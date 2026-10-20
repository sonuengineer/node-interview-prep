# 14 - Database Internals (MySQL 8 InnoDB, with PostgreSQL differences)

> Roadmap fill: **Phase "SQL + Database internals", Days 22-28** (B-Trees, indexes, query planner,
> buffer/cache, WAL, MVCC, replication, read replicas, connection pooling) plus the roadmap's ADDED
> block "Connection pooling deserves its own afternoon". This file goes DEEPER than Week 4 notes.
> It does not re-teach SQL syntax, basic index rules, transaction basics or basic pool setup: for those see
> "Week 4 / Day 3 notes" (T3.2 indexes), "Week 4 / Day 4 notes" (ACID, isolation), "Week 4 / Day 5 notes"
> (T5.3 connection pooling, deadlocks) and "Week 4 / Day 6 notes" (EXPLAIN). Here we open the box and
> MEASURE things on real servers.

**Where this fits (box)**

| Roadmap item | Module in this file |
|---|---|
| B-Trees, Indexes | Module 1 |
| Buffer / cache | Module 2 |
| WAL | Module 3 |
| MVCC | Module 4 |
| Query planner | Module 5 |
| Replication, Read replicas | Module 6 |
| Connection pooling (ADDED afternoon) | Module 7 |
| "Your backend is only as good as its DB" | Module 8 (diagnosis checklist) |

**How to use this file.** Every module is one 1-2 hour sitting. Every number you see below was produced
by me on real containers (MySQL 8.4.11, Docker Desktop on Windows 11, 12 CPUs, 16 GB RAM visible to Docker).
Your numbers WILL differ (disk, CPU, noise). Learn the SHAPE (ratios, trends), not my absolute values.
Where a number is noisy I say so.

**Why MySQL if the roadmap uses PostgreSQL?** The existing notes (Week 4/5) use MySQL, and the concepts
(B+tree, buffer cache, WAL, MVCC, replication, pooling) are the same ideas with different names and
trade-offs. Each module has a **PostgreSQL differs here** box. The Postgres boxes are written from
documented behaviour and were NOT executed (see "Not verified" at the end).

Tier tags: `[ESSENTIAL]` asked in most backend interviews, `[ADVANCED]` senior/depth questions.

**Version note.** `mysql:8.4` is the LTS 8.x line (the newest "MySQL 8" you can pull). Differences from
8.0 that bit me while writing this: `SHOW MASTER STATUS` is removed (use `SHOW BINARY LOG STATUS`),
`binlog_transaction_dependency_tracking` is removed, `mysql_native_password` is disabled by default
(mysql2 works fine with the default `caching_sha2_password`), and the redo log is sized by
`innodb_redo_log_capacity` (since 8.0.30; the old `innodb_log_file_size` is gone from the picture).

---

## Module 0 - Lab setup: one primary, one replica, one scratch database [ESSENTIAL]

**Goal.** Create the lab used by all other modules: a MySQL 8.4 **primary** (`db-mysql`, host port 33063)
and a **replica** (`db-replica`, host port 33064) on a private Docker network, GTID replication, small
buffer pool and small `max_connections` so limits are easy to hit.

**Step 1 - compose file** (`docker-compose.yml`, any empty folder):

```yaml
name: db14
services:
  db-mysql:
    image: mysql:8.4
    container_name: db-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpw
      MYSQL_DATABASE: lab
    ports: ["33063:3306"]
    command: >
      --server-id=1
      --log-bin=mysql-bin
      --binlog-format=ROW
      --gtid-mode=ON
      --enforce-gtid-consistency=ON
      --innodb-buffer-pool-size=134217728
      --max-connections=60
      --sync-binlog=1
      --innodb-flush-log-at-trx-commit=1
    volumes: ["db-mysql-data:/var/lib/mysql"]
    networks: [dbnet]
  db-replica:
    image: mysql:8.4
    container_name: db-replica
    environment:
      MYSQL_ROOT_PASSWORD: rootpw
    ports: ["33064:3306"]
    command: >
      --server-id=2
      --log-bin=mysql-bin
      --gtid-mode=ON
      --enforce-gtid-consistency=ON
      --relay-log=relay-bin
      --replica-parallel-workers=1
    volumes: ["db-replica-data:/var/lib/mysql"]
    networks: [dbnet]
networks:
  dbnet:
    name: db-net
volumes:
  db-mysql-data:
    name: db-mysql-data
  db-replica-data:
    name: db-replica-data
```

Notes on the flags: `--max-connections=60` (default is 151) makes "Too many connections" reproducible with a
laptop. `--replica-parallel-workers=1` makes the replica apply transactions one at a time so we can SEE
replication lag in Module 6 (the 8.4 default is 4). The buffer pool is the default 128 MB, written out
explicitly so you can see it.

**Gotcha I hit (real).** My first compose file had `--read-only=ON --super-read-only=ON` on the replica.
The container never started: the image's init script runs `ALTER USER` and the server answered
`ERROR 1290 ... running with the --super-read-only option so it cannot execute this statement`. Fix:
start the replica normally and set `super_read_only=ON` AFTER initialisation (Step 3).

**Step 2 - start and wait** (first start takes about 40-60 s; the mysqld that answers during init is a
temporary one, so `Access denied` or `Can't connect` for the first half-minute is normal):

```bash
docker compose up -d
docker exec db-mysql mysql -uroot -prootpw -e "select version(), @@gtid_mode, @@innodb_buffer_pool_size"
```

```
version()	@@gtid_mode	@@innodb_buffer_pool_size
8.4.11	ON	134217728
```

**Step 3 - wire replication (GTID auto-position):**

```bash
docker exec db-mysql mysql -uroot -prootpw -e "CREATE USER 'repl'@'%' IDENTIFIED BY 'replpw'; GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';"
docker exec db-replica mysql -uroot -prootpw -e "CHANGE REPLICATION SOURCE TO SOURCE_HOST='db-mysql', SOURCE_USER='repl', SOURCE_PASSWORD='replpw', SOURCE_AUTO_POSITION=1, GET_SOURCE_PUBLIC_KEY=1; START REPLICA; SET GLOBAL super_read_only=ON;"
docker exec db-replica mysql -uroot -prootpw -e "SHOW REPLICA STATUS\G" | grep -E "Running|Seconds_Behind|Last_.*Error:|Source_Host"
```

```
                  Source_Host: db-mysql
           Replica_IO_Running: Yes
          Replica_SQL_Running: Yes
                   Last_Error: 
        Seconds_Behind_Source: 0
                Last_IO_Error: 
               Last_SQL_Error: 
    Replica_SQL_Running_State: Replica has read all relay log; waiting for more updates
```

`GET_SOURCE_PUBLIC_KEY=1` is needed because the `repl` user authenticates with `caching_sha2_password`
over a non-TLS link (it asks the source for the RSA public key to send the password safely). In a real
setup you would use TLS (`SOURCE_SSL=1`).

**Step 3b - an app user (used in Module 7)** so that `max_connections` applies to it as a hard wall
(root has one extra reserved slot via `CONNECTION_ADMIN`):

```bash
docker exec db-mysql mysql -uroot -prootpw -e "CREATE USER 'app'@'%' IDENTIFIED BY 'apppw'; GRANT SELECT,INSERT,UPDATE,DELETE ON lab.* TO 'app'@'%'; GRANT SELECT ON performance_schema.* TO 'app'@'%'; GRANT PROCESS ON *.* TO 'app'@'%';"
```

**Step 4 - Node project** (Node 20+, ES modules). All Node demos use `mysql2` 3.x:

```bash
npm init -y && npm pkg set type=module && npm i mysql2@3
```

**Cleanup when done:** `docker compose down -v` and `docker rm -f db-bp-small` (Module 2 creates that one).

A helper I use everywhere for pasting SQL files: `docker exec -i db-mysql mysql -uroot -prootpw -t < file.sql`
(`-t` forces table-style output, `-e` takes inline statements). Password-on-command-line warnings are filtered
out of the pasted output below.

**Key concepts.** Primary/replica = two servers, one writes, one replays the binlog. GTID = global
transaction id (`server_uuid:n`) so a replica can say "I have executed everything up to X".
**Checklist**
- [ ] `docker compose up -d` and both containers healthy
- [ ] `SHOW REPLICA STATUS` shows both threads `Yes`
- [ ] `lab` database exists on the replica (replicated from primary after the first CREATE TABLE)

---

## Module 1 - B+tree on disk: clustered vs secondary index, covering index, why random UUID PKs hurt [ESSENTIAL]

**Concept.** Week 4 told you "InnoDB index = B+tree of 16 KB pages, table = clustered index". Here we
PROVE it: count pages, read the tree height out of the data file, count page reads per query, and measure
what a random UUID primary key costs.

**Why it matters.** "Why is my primary key choice important?" and "what is a covering index?" are classic
interview questions, and the honest answer has numbers: page counts, fan-out, fill factor. It also explains
real production symptoms: indexes that are 3x bigger than expected, slow inserts once the table outgrows RAM.

**Internal working (the mental model you need).**

```
                         root page (level 2)            <- 1 page, always cached
                        /          |          \
         internal pages (level 1)   ...        ...       <- ~20 pages for 300k rows
        /      |       \
  leaf pages (level 0) <-> leaf <-> leaf <-> ...          <- doubly linked list: range scans walk sideways
  PRIMARY (clustered): leaf holds the WHOLE ROW        (129 rows per 16 KB page in our test)
  secondary index   : leaf holds (indexed cols, PK)    -> a lookup needs a 2nd descent in PRIMARY
```

- **Fan-out** is what keeps trees short. An internal entry is (key, child page number): about 8 B key + 4 B
  pointer + overhead for a BIGINT key, so one 16 KB page points at roughly 1000 children. Height 3 holds
  about 1000 x 1000 x (rows per leaf) rows. A lookup = height page reads (root and level 1 are almost always
  in the buffer pool), so about 1 real disk read per lookup even for a huge table.
- **Page split.** Inserting into a full leaf splits it in two (about half full each). Sequential PK
  inserts always go to the right-most leaf, so InnoDB just starts a fresh page and old pages stay about
  15/16 full. Random keys (UUIDv4) hit random leaves: constant splits, pages settle around 69% full on
  average, and every insert touches a random page (cold cache, random IO).
- **Secondary index leaf = (index columns + the PK)**. So a fat PK (CHAR(36) = 36 bytes, utf8mb4 may reserve
  up to 144) is copied into EVERY secondary index entry.

**Hands-on.**

*Step 1 - three tables, 300,000 rows each, same columns, different PK type.* `t_seq` has
`id BIGINT AUTO_INCREMENT`, `t_uuid` has `id CHAR(36)` filled with a random v4-style string
(`LOWER(INSERT(...HEX(RANDOM_BYTES(16))...))`), `t_bin` has `id BINARY(16)` filled with
`UUID_TO_BIN(UUID(), 1)` (time-ordered). All three have `KEY idx_country (country)`, `email VARCHAR(80)`,
`balance INT`, `bio VARCHAR(100)`.

```sql
CREATE TABLE t_seq (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(80) NOT NULL, country CHAR(2) NOT NULL, balance INT NOT NULL, bio VARCHAR(100) NOT NULL,
  PRIMARY KEY (id), KEY idx_country (country)
) ENGINE=InnoDB;
SET SESSION cte_max_recursion_depth = 300000;
INSERT INTO t_seq (email, country, balance, bio)
WITH RECURSIVE s(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM s WHERE n < 300000)
SELECT CONCAT('user', n, '@example.com'), ELT(1+(n%5),'IN','US','GB','DE','SG'), n%10000, REPEAT('x', 60) FROM s;

-- t_uuid: same DDL but  id CHAR(36) NOT NULL  and the INSERT's first select-expression is
--   LOWER(INSERT(INSERT(INSERT(INSERT(HEX(RANDOM_BYTES(16)),9,0,'-'),14,0,'-'),19,0,'-'),24,0,'-'))
-- t_bin : same DDL but  id BINARY(16) NOT NULL  and the first select-expression is  UUID_TO_BIN(UUID(),1)
ANALYZE TABLE t_seq, t_uuid, t_bin;
```

(Each 300k-row load takes 30-60 s here. Recursive-CTE number generator: Week 4 / Day 3 notes.)

*Step 2 - how many pages?* InnoDB keeps persistent statistics in `mysql.innodb_index_stats`:

```sql
SELECT table_name, ROUND(data_length/1024/1024,1) AS data_mb, ROUND(index_length/1024/1024,1) AS index_mb
FROM information_schema.tables WHERE table_schema='lab' AND table_name IN ('t_seq','t_uuid');

SELECT table_name, index_name, stat_name, stat_value
FROM mysql.innodb_index_stats
WHERE database_name='lab' AND stat_name='n_leaf_pages' ORDER BY table_name, index_name;
```

Real output:

```
+------------+---------+----------+
| table_name | data_mb | index_mb |        data_mb = clustered index (the table), index_mb = secondary indexes
+------------+---------+----------+
| t_seq      |    36.6 |      6.5 |
| t_uuid     |    72.8 |     20.6 |
+------------+---------+----------+

+------------+-------------+--------------+------------+
| table_name | index_name  | stat_name    | stat_value |
+------------+-------------+--------------+------------+
| t_bin      | PRIMARY     | n_leaf_pages |       2473 |
| t_bin      | idx_country | n_leaf_pages |        459 |
| t_seq      | PRIMARY     | n_leaf_pages |       2320 |
| t_seq      | idx_country | n_leaf_pages |        311 |
| t_uuid     | PRIMARY     | n_leaf_pages |       4037 |
| t_uuid     | idx_country | n_leaf_pages |       1136 |
+------------+-------------+--------------+------------+
```

Read it like this (each leaf page is 16 KB):

| Table (PK type) | PRIMARY leaf pages | idx_country leaf pages | Why |
|---|---|---|---|
| t_seq (BIGINT, sequential) | 2320 (36 MB) | 311 | pages ~94% full; 8-byte PK copied in index |
| t_bin (BINARY(16), time-ordered) | 2473 (+7%) | 459 (+48%) | only the PK width differs: 16 B instead of 8 B |
| t_uuid (CHAR(36), random) | 4037 (+74%) | 1136 (3.7x) | 36 B PK **and** random inserts left pages about 2/3 full |

300000 rows / 2320 pages = 129 rows per page for the sequential table, 74 rows per page for the random
one. About 21% of the extra size is the wider row (36-byte key instead of 8) and the rest is the lower fill
factor from page splits. (An earlier attempt with plain `UUID()` strings gave only 45.7 MB data: UUID v1
starts with a TIMESTAMP-low field, so it is roughly ascending inside a 30-second load and avoids most
splits. Time-ordered IDs are good, the string form is still fat. Random v4 is the real offender.)

*Step 3 - tree height, straight from the file.* The root page number of every index is in
`information_schema.innodb_indexes.page_no` (PRIMARY root = page 4). In every InnoDB page the 2-byte
`PAGE_LEVEL` sits at byte offset 38 (FIL header) + 26 = 64. Level of the root = height - 1.

```bash
docker exec db-mysql sh -c "dd if=/var/lib/mysql/lab/t_seq.ibd bs=16384 skip=4 count=1 2>/dev/null | od -An -tx1 -j64 -N2"
```

```
t_seq PRIMARY root PAGE_LEVEL: 00 02     -> root is level 2 -> 3 levels (root, 1 internal level, leaves)
t_uuid PRIMARY root PAGE_LEVEL: 00 02    -> also 3 levels
t_seq idx_country: 00 01                 -> 2 levels (small index)
t_uuid idx_country: 00 02                -> 3 levels (the fat random index needed a level more)
```

Sanity check with the page counts: `t_seq` PRIMARY has `size` 2340 pages = 2320 leaf + about 19 internal + 1 root,
exactly a 3-level tree. A point lookup in either table reads 3 pages.

*Step 4 - clustered vs secondary vs covering, measured in page reads.* The status counter
`Innodb_buffer_pool_read_requests` counts every logical page read, so the difference before/after a
statement is "pages touched" (my small overhead of reading the status table is included, a few reads):

```sql
-- (a) no index on email: full scan
SELECT COUNT(*) FROM t_seq WHERE email = 'user250000@example.com';           -- pages read: 5396

ALTER TABLE t_seq ADD INDEX idx_email (email);
-- (b) secondary lookup + clustered lookup (SELECT *)
EXPLAIN SELECT * FROM t_seq WHERE email = 'user250000@example.com';
SELECT * FROM t_seq WHERE email = 'user250000@example.com';                  -- pages read: 14

-- (c) covering: only columns that live inside idx_email (email + PK id)
EXPLAIN SELECT id, email FROM t_seq WHERE email = 'user250000@example.com';
SELECT id, email FROM t_seq WHERE email = 'user250000@example.com';          -- pages read: 10
```

```
| key       | key_len | rows | Extra       |
| idx_email | 322     |    1 | NULL        |    <- (b) "ref", needs the clustered row afterwards
| idx_email | 322     |    1 | Using index |    <- (c) covering: never touches PRIMARY
```

14 vs 10 reads looks small because most of the 10 is fixed overhead (3 index pages + a few for the status
queries). The gap matters when MANY rows match. A range example, 20% of the table (`country = 'IN'`):

```sql
SELECT AVG(balance) FROM t_seq WHERE country='IN';       -- uses idx_country, then 1 PK lookup PER ROW
-- pages read: 240553          (about 4 logical reads per matching row: it walks the PRIMARY tree each time)

ALTER TABLE t_seq ADD INDEX idx_country_balance (country, balance);
EXPLAIN SELECT AVG(balance) FROM t_seq WHERE country='IN';
-- Extra: Using where; Using index   (covering)         -> pages read: 274
```

**240,553 vs 274 page reads: about 880x fewer** for the same answer, only because `balance` now lives
inside the index leaf. This is what "covering index" means. Cost: the new index is more storage and more
work on every write.

**PostgreSQL differs here (box).**
- Postgres has **no clustered index by default**. Rows live in an unordered **heap** (8 KB pages); EVERY
  index (including the primary key) is a secondary index whose leaf entries point to the row's physical
  address (`ctid`, page + slot). So there is no "PK copied into every secondary index" effect: a fat PK
  costs less in secondary indexes (but the PK index itself still suffers random-insert splits).
- `CLUSTER table USING index` reorders the heap ONCE; it is not maintained afterwards.
- "Covering" = **index-only scan**, which also needs the **visibility map** (pages marked all-visible by
  VACUUM). A table that is not vacuumed enough keeps visiting the heap even for covering indexes. Since
  PG 11 you can add non-key columns with `CREATE INDEX ... INCLUDE (balance)`.
- UUID v4 keys still fragment the index btree; PG 18 added a built-in `uuidv7()` (time-ordered) and
  `gen_random_uuid()` is v4. Page size is 8 KB, so the tree is a bit taller for the same data.
- Tools: `pgstattuple`, `pg_relation_size('idx')`, `EXPLAIN (ANALYZE, BUFFERS)` shows page hits/reads per node.

**Frontend connection.** Think of a lookup table: the clustered index is the array of full objects sorted by
id; a secondary index is a `Map<email, id>` and you still need `array.find(id)` afterwards. A covering index
is a `Map<email, {id, email, balance}>` where you never touch the array.

**Real-world scenario (marketplace).** Orders table with `id CHAR(36)` UUID PK, 80M rows, 4 secondary
indexes. Inserts were fast at 5M rows and fell off a cliff past 30M: the working set (random leaf pages of 5
indexes) stopped fitting in the buffer pool, so every insert became a random disk read (Module 2 measures
exactly this effect). Fix path: `BINARY(16)` time-ordered ids (UUIDv7 or `UUID_TO_BIN(UUID(),1)`), or a
`BIGINT` internal PK plus a unique `public_id` column; drop unused indexes (`sys.schema_unused_indexes`,
Module 8).

**Interview answer:** "InnoDB stores the table as a B+tree on the primary key; leaf pages contain the full
rows, so the PK is the clustered index. Secondary indexes store the indexed columns plus the PK, so a
lookup goes secondary tree then clustered tree, and a covering index avoids the second descent. I
measured a 300k-row table: with a BIGINT PK the clustered index had 2,320 leaf pages; with a random CHAR(36)
UUID it had 4,037, and the secondary index was 3.7x larger because every entry carries the 36-byte PK and
random inserts split pages and leave them about two-thirds full. For random UUIDs I would use BINARY(16)
and a time-ordered variant, or a BIGINT PK plus a unique public id."

**Follow-up questions with answers.**
1. *Why not just index every column?* Every index is another B+tree to update per write (write
   amplification), more pages competing for buffer pool, and more plans for the optimizer to choose from.
2. *What if the table has no PK?* InnoDB uses the first NOT NULL UNIQUE index, otherwise a hidden 6-byte
   row id (`DB_ROW_ID`), and secondary indexes carry that id.
3. *Why is `SELECT *` bad for index design?* It makes covering indexes impossible and forces a clustered
   lookup per row.
4. *Does a longer index key change height?* Wider keys mean lower fan-out, so a taller tree sooner
   (our `idx_country` on the UUID table needed 3 levels, on the BIGINT table 2).

**Common mistakes.** `CHAR(36)` UUID PKs; `utf8mb4` on key columns that are ASCII hex (use `BINARY(16)` or
`CHARACTER SET ascii`); trusting `table_rows` (it is an estimate: it said 297,728 for 300,000);
judging index size from `index_length` before `ANALYZE TABLE`.

**Key concepts.** B+tree height/fan-out; clustered = table; secondary leaf carries PK; page splits and
fill factor; covering index = no second lookup; `n_leaf_pages` in `mysql.innodb_index_stats`.

**Revision questions**
1. Why does a secondary index lookup do two tree descents?
2. A table has `PRIMARY KEY (uuid CHAR(36))` and 6 secondary indexes. Roughly how does the PK width
   multiply storage?
3. Why do sequential inserts give fuller pages than random inserts?
4. What does `Using index` in EXPLAIN mean, and what does `Using index condition` mean?
5. How can you read a tree's height without third-party tools?

**Practical task.** Load 300k rows into a table with a `CHAR(36)` random PK and into one with
`BINARY(16)` + `UUID_TO_BIN(UUID(),1)`. Record `n_leaf_pages` for PRIMARY and one secondary index; explain
the ratio.

**Checklist**
- [ ] I can draw root/internal/leaf pages and show where the full row lives
- [ ] I can explain why the `t_uuid` secondary index is 3.7x bigger
- [ ] I produced a covering-index example with `Using index` and measured page reads
- [ ] I can state the Postgres difference (heap + ctid, no clustered PK)

---

## Module 2 - Buffer pool: hit ratio, sizing, reading SHOW ENGINE INNODB STATUS [ESSENTIAL]

**Concept.** The **buffer pool** is InnoDB's own page cache in RAM. Every page read (index or data) goes
through it. Hit = page already in RAM (nanoseconds-microseconds). Miss = read 16 KB from disk (0.1 ms on
good SSD, 5-10 ms on a busy cloud disk, and it queues). Writes also go to the pool first: the page becomes
**dirty** and is flushed later by background threads (the redo log makes that safe: Module 3).

**Why it matters.** The single most common DB performance cliff: "everything was fast until the data
outgrew RAM". Sizing the buffer pool, knowing your hit ratio, and spotting a working set that does not fit
are basic skills for anyone who says they "tuned a database".

**Internal working.**
- Pool = array of 16 KB frames. A midpoint-insertion **LRU**: the list is split into a "young" (hot, 5/8)
  and "old" (3/8) sublist. A newly read page enters at the head of the OLD sublist and is promoted only if
  touched again after `innodb_old_blocks_time` (1000 ms). That stops one big table scan from flushing your
  hot pages. (You will see "Pages made young" vs "not young" in the status output.)
- **Free list** (empty frames), **LRU list** (pages), **flush list** (dirty pages ordered by oldest
  modification LSN). Page cleaner threads flush dirty pages from the tail of the LRU and the head of the
  flush list; checkpointing (Module 3) is tied to the flush list.
- Size: `innodb_buffer_pool_size` (resizable online in chunks of `innodb_buffer_pool_chunk_size`, default
  128 MB). Typical rule on a DEDICATED DB host: **50-75% of RAM**; the rest is for per-connection buffers
  (sort, join, tmp tables), the OS, and binlog/redo cache. Docker/cloud: remember the container memory
  limit, not host RAM. Also `innodb_buffer_pool_instances` (splits the pool to reduce mutex contention, only
  matters for pools of several GB).
- **Hit ratio** = 1 - (disk reads / logical read requests). Counters:
  `Innodb_buffer_pool_read_requests` (logical reads) and `Innodb_buffer_pool_reads` (reads that missed and
  went to disk). A healthy OLTP system is 99%+; 95% can already hurt a lot, because a miss costs about
  1000x a hit.

**Hands-on 1 - read the numbers on a warm server.**

```sql
SELECT ROUND(100*(1 - (SELECT variable_value FROM performance_schema.global_status WHERE variable_name='Innodb_buffer_pool_reads')
                    /(SELECT variable_value FROM performance_schema.global_status WHERE variable_name='Innodb_buffer_pool_read_requests')),3)
       AS hit_ratio_since_start_pct;

SELECT table_name, index_name, COUNT(*) AS cached_pages, ROUND(COUNT(*)*16/1024,1) AS cached_mb
FROM information_schema.innodb_buffer_page WHERE table_name LIKE '%lab%'
GROUP BY table_name, index_name ORDER BY cached_pages DESC LIMIT 6;
```

```
+---------------------------+
| hit_ratio_since_start_pct |
+---------------------------+
|                    99.949 |         <- 8,018,304 logical reads, 4,113 disk reads since the container started
+---------------------------+
| table_name     | index_name          | cached_pages | cached_mb |
| `lab`.`t_bin`  | PRIMARY             |         2479 |      38.7 |
| `lab`.`t_seq`  | PRIMARY             |         2324 |      36.3 |
| `lab`.`t_seq`  | idx_email           |          468 |       7.3 |
...
```

Caution: querying `information_schema.innodb_buffer_page` scans the whole pool and takes a mutex. Fine on
a lab, avoid on a busy production primary.

**Hands-on 2 - read `SHOW ENGINE INNODB STATUS\G` (the BUFFER POOL AND MEMORY section).** Real output
from the lab server (128 MB = 8192 pages):

```
BUFFER POOL AND MEMORY
----------------------
Buffer pool size   8192                  <- pages (x 16 KB = 128 MB)
Free buffers       602                   <- empty frames left; 0 free + falling hit rate = pool is full
Database pages     7590                  <- frames holding data pages
Old database pages 2781                  <- the "old" sublist (3/8 of the LRU)
Modified db pages  0                     <- dirty pages not yet flushed
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 9564, not young 94400   <- big "not young" = scans passing through, protected by midpoint LRU
67.38 youngs/s, 113.25 non-youngs/s
Pages read 6340, created 18297, written 91835
13.15 reads/s, 0.00 creates/s, 0.00 writes/s
Buffer pool hit rate 998 / 1000, young-making rate 14 / 1000 not 24 / 1000    <- the number to watch (per last interval)
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 7590, unzip_LRU len: 0
```

How I read it in 10 seconds: (1) `Free buffers` tiny and `Database pages` ~ pool size means the pool is full
(normal on a busy server: it caches until full). (2) `hit rate 998 / 1000` = 99.8% over the last interval:
good. (3) `Pending reads` / `Pending writes` non-zero for several samples = IO is the bottleneck. (4)
`Modified db pages` growing without bound = flushing cannot keep up with writes. (5) The same output also
has SEMAPHORES (mutex waits), TRANSACTIONS (`History list length`, Module 4) and LOG (Module 3).

**Hands-on 3 - a pool that is too small vs one that fits (the cliff, measured).** Second container
`db-bp-small`: same table `t_seq` (43 MB) but `--innodb-buffer-pool-size=8388608` (8 MB) and
`--innodb-buffer-pool-chunk-size=1048576`. The workload: 50,000 random primary-key lookups, done inside the
server by a stored procedure (no network in the numbers):

```bash
docker run -d --name db-bp-small -e MYSQL_ROOT_PASSWORD=rootpw -e MYSQL_DATABASE=lab -p 33071:3306 mysql:8.4 \
  --innodb-buffer-pool-size=8388608 --innodb-buffer-pool-chunk-size=1048576 --innodb-buffer-pool-instances=1 --skip-log-bin
```

```sql
DELIMITER //
CREATE PROCEDURE random_lookups(IN max_id INT, IN iters INT)
BEGIN
  DECLARE i INT DEFAULT 0; DECLARE x INT; DECLARE k INT;
  WHILE i < iters DO
    SET k = 1 + FLOOR(RAND()*max_id);              -- NOT inline in the WHERE clause, see the trap below
    SELECT balance INTO x FROM t_seq WHERE id = k;
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;
```

I took before/after snapshots of `Innodb_buffer_pool_read_requests` / `Innodb_buffer_pool_reads` and the
clock around `CALL random_lookups(300000, 50000);`:

```
=== db-bp-small  (pool 8 MB, data 43 MB)
| elapsed_ms | logical_reads | disk_reads | hit_pct |
|  68718.0000|        191288 |      40493 |   78.83 |

=== db-mysql     (pool 128 MB, data 63 MB incl. extra indexes)
| elapsed_ms | logical_reads | disk_reads | hit_pct |
|   2703.0000|        151188 |        422 |   99.72 |
```

**25x slower (68.7 s vs 2.7 s) at 78.8% hit rate vs 99.7%**, for the same 50,000 lookups. Each disk read
costs about 1.7 ms here and there were 40,493 of them. The lesson is the SHAPE: a 21-point drop in hit
ratio is not a 21% slowdown, it is more than an order of magnitude, because misses dominate the time.

**A trap I fell into while writing this (worth remembering).** My first version of the procedure was
`SELECT balance INTO x FROM t_seq WHERE id = 1 + FLOOR(RAND()*max_id)`. MySQL answered
`ERROR 1172: Result consisted of more than one row`. `RAND()` is non-deterministic, so it is re-evaluated
per ROW instead of once per query: the optimizer cannot use it for an index lookup, it scans the table and
every row has a roughly 1/N chance of matching. Compute the random value into a variable first.

**PostgreSQL differs here (box).**
- Postgres has `shared_buffers` (typical start: 25% of RAM, not 75%) and ALSO relies heavily on the
  **OS page cache** (it does buffered IO, no O_DIRECT by default). So the same page can sit in both caches
  ("double buffering"), and `effective_cache_size` is only a planner hint about how much total cache exists.
- Hit ratio: `pg_stat_database.blks_hit / (blks_hit + blks_read)`; per-table `pg_statio_user_tables`;
  inspect contents with the `pg_buffercache` extension. `EXPLAIN (ANALYZE, BUFFERS)` shows
  `shared hit=... read=...` per plan node (a much better tool than InnoDB gives you per statement).
- Eviction is **clock-sweep** with usage counts, and large scans use a small ring buffer so they do not
  wipe the cache (same goal as InnoDB's midpoint insertion).

**Frontend connection.** It is your React Query / HTTP cache: hit = no network. A cache that is smaller than
your working set thrashes; the cure is more memory or a smaller working set (better indexes, archiving cold
data), not "more retries".

**Real-world scenario (payments).** A ledger table grows 5 GB/month on a 16 GB instance with a 12 GB pool.
Month 3 is fine; month 5 the p99 of `GET /transactions` triples although traffic is flat. The CloudWatch
graph shows ReadIOPS rising; `hit rate` dropped from 999/1000 to 940/1000. Fixes in order of cost: index so
the query reads fewer pages (covering/composite), archive old months into a cold table, then bigger RAM.

**Interview answer:** "The buffer pool is InnoDB's page cache; reads and writes go through it and dirty
pages are flushed lazily because the redo log gives durability. I size it to roughly 50-75% of RAM on a
dedicated host and watch hit ratio from `Innodb_buffer_pool_reads` versus `read_requests` and the `Buffer
pool hit rate` line in `SHOW ENGINE INNODB STATUS`. I tested it: the same 50k random lookups took 2.7 s
at 99.7% hit rate and 68.7 s at 78.8% with an undersized pool, so a few points of hit rate are a huge
latency difference."

**Follow-up questions with answers.**
1. *Why not give InnoDB 100% of RAM?* Per-connection memory (sort/join/tmp buffers x connections), OS,
   binlog/redo file cache, and in containers the OOM killer. Swapping a buffer pool is far worse than a
   smaller pool.
2. *Does a big table scan evict my hot pages?* Mostly no: midpoint insertion + `innodb_old_blocks_time`.
3. *What is the buffer pool warm-up problem after restart?* The pool starts empty so latency spikes.
   `innodb_buffer_pool_dump_at_shutdown` / `innodb_buffer_pool_load_at_startup` (both ON by default in 8.x)
   save and reload the list of page ids, not the data.
4. *Is a 99% hit rate always fine?* Not if the workload is huge: 1% of 100,000 reads/s is 1,000 disk
   reads/s. Look at absolute `Innodb_buffer_pool_reads` per second too.

**Common mistakes.** Leaving the default 128 MB on a production box; setting it above container memory;
judging by "since start" ratio (it hides a recent regression: sample deltas); thinking more pool fixes
missing indexes.

**Key concepts.** Page cache; hit ratio formula; midpoint LRU; dirty pages / flush list; sizing rule;
miss costs about 1000x a hit.

**Revision questions**
1. Write the hit ratio formula with the two status variables.
2. What do "Pages made young" and "not young" tell you?
3. Why did the 8 MB pool turn 2.7 s into 68.7 s?
4. What are two reasons not to set the pool to 90% of RAM?
5. Postgres has `shared_buffers`; why is 75% of RAM a bad idea there?

**Practical task.** Start a second container with an 8 MB pool, load 300k rows, run the same
random-lookup procedure, and compute the hit ratio from the status deltas. Then re-run on a 128 MB pool.

**Checklist**
- [ ] I computed hit ratio from status counters (not just trusted a dashboard)
- [ ] I can read each line of the BUFFER POOL section above
- [ ] I reproduced the undersized-pool slowdown
- [ ] I know why `RAND()` in a WHERE clause is a trap

---

## Module 3 - WAL: redo log, doublewrite buffer, binlog, crash recovery, group commit [ESSENTIAL + ADVANCED]

**Concept.** **Write-ahead logging (WAL):** before a changed page is allowed to reach its data file, the
description of the change must already be in a sequential log on disk. COMMIT only has to wait for that
small sequential log write (fast), not for the random page writes (slow). If the server dies, it replays
the log. InnoDB's log is the **redo log**. MySQL also has a second, separate log, the **binlog**, which
belongs to the SQL layer and is used for replication and point-in-time recovery.

**Why it matters.** It answers "what exactly is durable when `COMMIT` returns?", "what does
`innodb_flush_log_at_trx_commit` trade?", and "why does the same server do 33 commits/s one at a time and
300+/s with 16 clients?" (group commit). Payments and ledgers live or die on these settings.

**Internal working.**

```
 UPDATE row                      (1) change the page in the buffer pool (page becomes DIRTY)
   |                             (2) write undo record (for rollback / MVCC, Module 4)
   |                             (3) append REDO record to the log buffer  (physical-ish: "page X, offset Y, bytes Z")
 COMMIT
   |  PREPARE: flush redo to disk (fsync)                          <- InnoDB two-phase commit with binlog
   |  write + fsync BINLOG event(s)  (sync_binlog=1)               <- the "decision" record
   |  COMMIT: mark transaction committed in redo
   v  ack to client           (data pages are written later by page cleaners; a checkpoint advances)
```

- **Redo log** (`#innodb_redo/` directory, 32 files of capacity/32 each; total = `innodb_redo_log_capacity`,
  default 100 MB in 8.4): circular, identified by **LSN** (log sequence number, a byte offset). The
  **checkpoint LSN** is the point up to which all dirty pages are already flushed to data files. Anything
  after it must be replayed on crash recovery. If writes outrun flushing and the log fills, InnoDB stalls
  commits to flush pages first ("async/sync flush" stalls). That is why write-heavy servers raise redo
  capacity (several GB).
- **Doublewrite buffer.** A page is 16 KB but the OS/disk guarantees only 4 KB (or 512 B) atomic writes.
  A power loss in the middle of writing a page gives a **torn page** that redo cannot fix (redo records are
  "change bytes in the page", they need a valid base page). So before writing pages to their home, InnoDB
  writes them sequentially into the doublewrite files (`#ib_16384_*.dblwr`), fsyncs, then writes the real
  location. At recovery a torn page is restored from the doublewrite copy, then redo is applied.
- **Binlog** (`mysql-bin.00000N`): logical record of committed transactions (`binlog_format=ROW`: before/after
  row images). Not used for InnoDB crash recovery. Used for (1) replication (Module 6), (2) point-in-time
  recovery (restore backup + replay binlog to 14:03:59), (3) CDC tools (Debezium reads it).
- **Two-phase commit:** the binlog and the redo log must agree. Redo has the transaction as PREPARED
  (flushed), then the binlog is written, then InnoDB marks it committed. After a crash, a transaction that
  is prepared and present in the binlog is committed, otherwise rolled back. This is what keeps a
  replica and the primary from diverging after a crash.
- **Group commit.** Many concurrent committers queue in stages (flush, sync, commit). ONE fsync of the redo
  log and ONE fsync of the binlog serves the whole group. That is why throughput scales with concurrency
  even though each fsync is slow.

**What is durable at COMMIT (the table to memorize).**

| Setting | Redo at commit | Crash of mysqld process | Power loss / OS crash |
|---|---|---|---|
| `innodb_flush_log_at_trx_commit=1` (default) | written AND fsynced | no loss | no loss |
| `=2` | written to OS cache, fsync about once per second | no loss | up to ~1 s of committed txns lost |
| `=0` | only in log buffer, written+fsynced about once per second | up to ~1 s lost | up to ~1 s lost |

`sync_binlog=1` fsyncs the binlog at every commit group; `sync_binlog=0` leaves it to the OS (replicas and
PITR could then miss the tail after a power loss). **Fully durable = 1 + 1.** For payments, use 1 + 1
(or a managed service that guarantees it). `=2` is acceptable for e.g. session/analytics data when you
accept losing a second.

**Hands-on 1 - crash recovery you can watch.** On `db-bp-small` (no binlog) I created a table, committed
one row, then in a second session opened a transaction with an uncommitted INSERT and UPDATE, committed
another row from a third session, and killed the server with SIGKILL (no clean shutdown, no flushing).

```bash
docker exec -i db-bp-small mysql -uroot -prootpw -e "CREATE TABLE lab.cr (id INT PRIMARY KEY, note VARCHAR(40)) ENGINE=InnoDB; INSERT INTO lab.cr VALUES (1,'committed before crash');"
# session 2 (kept open, uncommitted):  BEGIN; INSERT INTO cr VALUES (2,'uncommitted'); UPDATE cr SET note='uncommitted change' WHERE id=1;
# session 3:                            INSERT INTO lab.cr VALUES (3,'committed after, autocommit');
docker exec db-bp-small mysql -uroot -prootpw -e "SHOW ENGINE INNODB STATUS\G" | grep -E "Log sequence number|Last checkpoint at|Modified db pages|ACTIVE|undo log entries"
docker kill -s KILL db-bp-small
docker start db-bp-small
docker exec db-bp-small mysql -uroot -prootpw -t -e "SELECT * FROM lab.cr"
```

```
---TRANSACTION 1830, ACTIVE 5 sec          <- the uncommitted txn
2 lock struct(s), heap size 1128, 1 row lock(s), undo log entries 2
Log sequence number          85328953      <- redo written up to here
Last checkpoint at           85328801      <- pages flushed up to here: 152 bytes of redo exist beyond the checkpoint
Modified db pages  2                       <- 2 dirty pages in RAM only, NOT in the data file

(kill -9, restart)
+----+-----------------------------+
| id | note                        |
|  1 | committed before crash      |       <- row 1 back to its committed value (uncommitted UPDATE rolled back)
|  3 | committed after, autocommit |       <- committed after the checkpoint: restored from REDO
+----+-----------------------------+      <- id=2 (uncommitted INSERT) is gone: rolled back using UNDO
```

Recovery has 3 steps: (1) fix torn pages from the doublewrite buffer, (2) **redo forward** from the
checkpoint (repeat history, including the uncommitted work), (3) **undo** the transactions that had not
committed. Row 3 existing proves redo works; the vanished uncommitted changes prove undo works. Honest
limit: SIGKILL of the mysqld process does not lose data in the OS cache, so this does NOT demonstrate loss
with `=2` or `sync_binlog=0` (that needs a power loss or a VM kill).

**Hands-on 2 - what fsync costs, and group commit.** Node script (autocommit inserts, one commit each,
`mysql2` pool):

```js
// m3_commit_bench.mjs  (usage: node m3_commit_bench.mjs <flush> <sync_binlog> <concurrency> <totalInserts>)
import mysql from 'mysql2/promise';
const [flush, syncBin, conc, total] = process.argv.slice(2).map(Number);
const pool = mysql.createPool({ host: '127.0.0.1', port: 33063, user: 'root', password: 'rootpw',
  database: 'lab', connectionLimit: conc + 1 });
await pool.query('CREATE TABLE IF NOT EXISTS commit_test (id BIGINT AUTO_INCREMENT PRIMARY KEY, v INT NOT NULL, pad CHAR(100) NOT NULL)');
await pool.query('TRUNCATE commit_test');
await pool.query(`SET GLOBAL innodb_flush_log_at_trx_commit=${flush}`);   // numbers only, from argv
await pool.query(`SET GLOBAL sync_binlog=${syncBin}`);
const fsyncs = async () => Number((await pool.query(
  "SELECT variable_value v FROM performance_schema.global_status WHERE variable_name='Innodb_os_log_fsyncs'"))[0][0].v);
const per = Math.floor(total / conc);
const f0 = await fsyncs(); const t0 = performance.now();
await Promise.all(Array.from({ length: conc }, async () => {
  for (let i = 0; i < per; i++) await pool.execute('INSERT INTO commit_test (v, pad) VALUES (?, ?)', [i, 'x']); // 1 commit per insert
}));
const ms = performance.now() - t0; const f1 = await fsyncs();
console.log(`flush=${flush} sync_binlog=${syncBin} conc=${conc} commits=${per * conc} time=${(ms/1000).toFixed(2)}s ` +
  `${Math.round(per * conc / (ms / 1000))} commits/s  redo_fsyncs=${f1 - f0}`);
await pool.end();
```

Real output (Docker Desktop on Windows: fsync is expensive here, so absolute numbers are low; the shape is
what matters):

```
flush=1 sync_binlog=1 conc=1  commits=200  time=11.15s   18 commits/s  redo_fsyncs=509
flush=1 sync_binlog=1 conc=16 commits=1600 time=6.80s   235 commits/s  redo_fsyncs=717
flush=2 sync_binlog=1 conc=1  commits=300  time=9.98s    30 commits/s  redo_fsyncs=20
flush=0 sync_binlog=0 conc=1  commits=1500 time=10.34s  145 commits/s  redo_fsyncs=38
```

How to read it:
- **Single client, fully durable: 18 commits/s** = one commit every ~55 ms. A single connection can only
  commit as fast as its fsyncs. (Earlier runs of the same config gave 33/s and 334/s for 16 clients: this
  machine is noisy, so trust ratios, not absolute values.)
- **16 clients: 235/s, 13x** more commits per second, while redo fsyncs per commit dropped from about 2.5
  (509/200) to 0.45 (717/1600). Many commits shared one fsync: that is **group commit**.
- `flush=2` has almost no redo fsyncs (20 for 300 commits, roughly one per second): the commit is acked
  after a write() to the OS cache. `flush=0, sync_binlog=0` is fastest and weakest.
- Application lesson: **batching writes into one transaction** (100 rows per COMMIT) is the cheapest durable
  speed-up; so is running more concurrent writers; never "turn off fsync" for money data.

**Hands-on 3 - peek at the doublewrite buffer and the binlog.**

```sql
SELECT variable_name, variable_value FROM performance_schema.global_status
WHERE variable_name IN ('Innodb_dblwr_pages_written','Innodb_dblwr_writes','Innodb_pages_written');
SELECT @@innodb_doublewrite, @@innodb_redo_log_capacity, @@binlog_format, @@gtid_mode;
```

```
| Innodb_dblwr_pages_written | 104557 |      <- every flushed data page went through the doublewrite files first
| Innodb_dblwr_writes        |   1043 |      <- in batches of about 100 pages (104557 / 1043)
| Innodb_pages_written       | 105091 |
| @@innodb_doublewrite = ON | redo capacity = 104857600 (100 MB) | ROW | ON |
```

```bash
docker exec db-mysql ls /var/lib/mysql   # (filtered)  #ib_16384_0.dblwr  #ib_16384_1.dblwr  #innodb_redo/  ibdata1  mysql-bin.000003  mysql-bin.index
```

A two-statement transaction in the binlog (I did `FLUSH BINARY LOGS` first so the new file is tiny;
`mysqlbinlog` is not shipped in the `mysql:8.4` image, so I use `SHOW BINLOG EVENTS`):

```sql
BEGIN; UPDATE acct SET bal=bal-30 WHERE id=1; UPDATE acct SET bal=bal+30 WHERE id=2; COMMIT;
SHOW BINLOG EVENTS IN 'mysql-bin.000004';
```

```
| Pos | Event_type     | Info                                                                  |
|   4 | Format_desc    | Server ver: 8.4.11, Binlog ver: 4                                     |
| 127 | Previous_gtids | a7f7efe0-cc4f-11f1-8469-32a1137db79f:1-14568                          |
| 198 | Gtid           | SET @@SESSION.GTID_NEXT= 'a7f7efe0-cc4f-11f1-8469-32a1137db79f:14569' |
| 277 | Query          | BEGIN                                                                 |
| 360 | Table_map      | table_id: 112 (lab.acct)                                              |
| 410 | Update_rows    | table_id: 112 flags: STMT_END_F                                       |
| 464 | Table_map      | table_id: 112 (lab.acct)                                              |
| 514 | Update_rows    | table_id: 112 flags: STMT_END_F                                       |
| 568 | Xid            | COMMIT /* xid=214922 */                                               |
```

The whole transaction is one GTID unit between `BEGIN` and `Xid COMMIT`; the replica applies it atomically.
The `Xid` is the id that ties this binlog event to the InnoDB transaction in the two-phase commit.
(`SHOW MASTER STATUS` gives a syntax error in 8.4; use `SHOW BINARY LOG STATUS`.)

**PostgreSQL differs here (box).**
- Postgres has ONE log: the **WAL** (`pg_wal/`, 16 MB segments). It is used for crash recovery AND for
  replication AND for logical decoding/CDC. There is no separate binlog and no two-phase commit between two
  logs.
- No doublewrite buffer: Postgres uses **full_page_writes** (the first change to a page after each
  checkpoint writes the WHOLE page into the WAL), which costs WAL volume right after checkpoints.
- Durability knob is `synchronous_commit` (`on` = fsync before ack; `off` = ack before fsync, may lose
  about 3x `wal_writer_delay` of transactions but NEVER corrupts; `remote_write`, `remote_apply` involve
  standbys). `fsync=off` is the dangerous one (can corrupt the cluster). Group commit exists
  (`commit_delay`, `commit_siblings`).
- Checkpoints: `checkpoint_timeout` (5 min) and `max_wal_size`; `checkpoint_completion_target` spreads IO.
  Undo is not needed for rollback in the WAL sense: old row versions stay in the heap (Module 4).
- PITR = base backup + archived WAL (`archive_command`, `pg_basebackup`, `recovery_target_time`).

**Frontend connection.** WAL is like a Redux action log: state (pages) can be rebuilt by replaying the
log from a snapshot (checkpoint). The binlog is the same log shipped to other clients (replicas).

**Real-world scenario (banking).** After a host crash the primary comes back and the app team asks "did we
lose the transfers acked in the last second?". With 1 + 1: no, every acked commit was fsynced in both logs.
They had previously set `innodb_flush_log_at_trx_commit=2` "for speed" after a benchmark: that change would
have allowed losing about 1 s of acked transfers on a power loss. Decision recorded: money tables stay on
1 + 1, throughput comes from batching and group commit instead.

**Interview answer:** "InnoDB uses write-ahead logging. A commit appends redo records and fsyncs the log;
data pages are flushed later by background threads, so commit latency is one sequential fsync. The
doublewrite buffer protects against torn 16 KB pages, and on crash recovery InnoDB replays redo from the
last checkpoint and then rolls back uncommitted transactions using undo. The binlog is a separate
logical log used for replication and PITR, kept consistent with redo by an internal two-phase commit.
With `innodb_flush_log_at_trx_commit=1` and `sync_binlog=1` an acknowledged commit survives power loss;
`=2` can lose about a second on OS crash. I measured group commit: one client did 18 commits/s while 16
clients did 235/s, with 0.45 redo fsyncs per commit instead of 2.5."

**Follow-up questions with answers.**
1. *If redo is on disk, why flush data pages at all?* The redo log is circular and finite; to reclaim its
   space, the pages it describes must be flushed (checkpoint). Also recovery time is proportional to
   un-checkpointed redo.
2. *Is redo physical or logical?* "Physiological": physical to a page, logical within it. The binlog (ROW)
   is logical per row.
3. *Can a replica be built from the redo log?* No. Redo is internal to one InnoDB instance and tied to its
   page layout. Replication uses the binlog.
4. *What does `innodb_flush_method=O_DIRECT` do?* Bypasses the OS page cache for data files, avoiding double
   caching with the buffer pool (it is our lab default).
5. *Why does batching help?* One commit (one fsync) per batch instead of per row.

**Common mistakes.** Setting `=2`/`0` globally for a database that also holds money; tiny redo capacity
on write-heavy servers (log stalls); forgetting binlog size growth (`binlog_expire_logs_seconds`, default 30
days; my bench alone made a 147 MB binlog in minutes); believing `COMMIT` returning means the replica has
it (it does not, Module 6).

**Key concepts.** WAL, LSN, checkpoint, redo vs undo vs binlog, torn page + doublewrite, two-phase commit,
group commit, the 1/2/0 table.

**Revision questions**
1. What is written, and fsynced, at `COMMIT` under the default settings?
2. Why is a doublewrite buffer needed if redo exists?
3. Describe the 3 phases of crash recovery. Which log is used by each?
4. Why does 16-way concurrency commit 13x more per second than 1-way on the same disk?
5. How do Postgres `synchronous_commit=off` and MySQL `flush_log_at_trx_commit=2` differ in risk?

**Practical task.** Run the commit benchmark with concurrency 1, 4, 16, 32 and plot commits/s versus
`redo_fsyncs`/commit. Then repeat with a 100-row batch per commit at concurrency 1.

**Checklist**
- [ ] I can explain redo vs undo vs binlog in one sentence each
- [ ] I reproduced the crash: committed row survived, uncommitted row vanished
- [ ] I measured group commit
- [ ] I can state the durability table (1 / 2 / 0) from memory

---

## Module 4 - MVCC and undo logs: read views, why long transactions hurt, purge lag [ESSENTIAL + ADVANCED]

**Concept.** **MVCC (multi-version concurrency control):** readers do not block writers and writers do not
block readers, because the database keeps several versions of a row and each transaction sees the version
that was committed when ITS snapshot (read view) was taken. Isolation levels from Week 4 / Day 4 notes are
HOW MUCH of this snapshot machinery you get; this module is the machinery.

**Why it matters.** "Why is my SELECT suddenly slow although the table did not grow?", "why did disk fill up
on the primary?", "what is wrong with a transaction that stays open while we call a payment API?" all
end at undo logs and purge. It also explains why REPEATABLE READ gives repeatable reads without locking.

**Internal working.**
- Every clustered-index row has hidden columns: `DB_TRX_ID` (id of the transaction that last changed it)
  and `DB_ROLL_PTR` (pointer into the **undo log** to the previous version). Older versions form a
  **version chain** in undo.
- An UPDATE changes the row IN PLACE in the clustered index and writes the old values to undo (so rollback
  and old readers can recover them). A DELETE only sets a delete-mark; physical removal happens in purge.
- **Read view** = a snapshot of "which transaction ids were active/committed at this moment". When a
  reader meets a row version whose `DB_TRX_ID` is not visible to its read view, it follows `DB_ROLL_PTR`
  down the chain until it finds a visible version.
  - REPEATABLE READ (default): ONE read view, created at the FIRST consistent read in the transaction.
  - READ COMMITTED: a NEW read view for EACH statement.
  - Locking reads (`SELECT ... FOR UPDATE`, UPDATE, DELETE) ignore the snapshot and read the LATEST
    committed version (and lock it). So "current read" can see data your snapshot read cannot.
- **Purge.** Undo records can be thrown away only when NO active read view can still need them. Background
  **purge threads** remove them (and delete-marked rows) once the oldest read view moves past them.
  The **history list length** (HLL) = number of committed transactions' undo logs not yet purged
  (units are undo LOGS, i.e. roughly transactions, not rows). Health check: `SHOW ENGINE INNODB STATUS`
  `History list length`, or
  `SELECT count FROM information_schema.innodb_metrics WHERE name='trx_rseg_history_len'`.
- A long-open transaction (even a READ-ONLY one that just did one SELECT and then went idle) pins the
  oldest read view: purge stalls, undo grows (in `undo_001/002` tablespaces, shrinkable only by undo
  truncation), and every query that must reconstruct old versions pays to walk long chains.

**Hands-on - two sessions, three experiments (real output).** One Node script with two connections, `A`
(the reader) and `B` (the writer). Key lines:

```js
const A = await mysql.createConnection(cfg);   // reader
const B = await mysql.createConnection(cfg);   // writer
await A.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
await A.beginTransaction();
console.log('A first read   :', (await A.query('SELECT bal FROM acct WHERE id=1'))[0][0].bal);  // read view created
await B.query('UPDATE acct SET bal = 999 WHERE id = 1');                                        // autocommit
console.log('A second read  :', (await A.query('SELECT bal FROM acct WHERE id=1'))[0][0].bal);
console.log('A locking read :', (await A.query('SELECT bal FROM acct WHERE id=1 FOR UPDATE'))[0][0].bal);
```

```
--- Part 1: snapshot semantics under REPEATABLE READ (default) ---
A first read   : 100 (read view created here)
B committed bal=999. B reads: 999
A second read  : 100 <- still old: A sees its snapshot
A locking read : 999 <- FOR UPDATE reads the LATEST version, not the snapshot
A after commit : 999

--- Part 2: same thing under READ COMMITTED (new read view per statement) ---
A first read   : 100
A second read  : 555 <- sees B's commit (non-repeatable read)
```

Part 3 is the production incident in miniature. `A` opens a transaction, does one SELECT and goes idle
(a forgotten `BEGIN`, a slow report, or a request that holds a transaction while calling an external API).
`B` then does 8 big updates (100,000 rows each, `UPDATE t_seq SET balance = balance + 1 WHERE id <= 100000`)
and 3,000 tiny autocommit updates. Then we time the same `SELECT SUM(balance) FROM t_seq WHERE id <= 100000`
from `A` (snapshot must be rebuilt by walking up to 8 versions per row) and from `B` (newest version):

```
baseline history list length: 8
baseline SUM on A (no old versions):  101 ms
A opened a transaction and went idle (like a forgotten BEGIN, or a slow report).
B ran 8 UPDATEs over 100000 rows (800000 row versions created, all committed).
history list length after the 8 big transactions: 20   (it counts undo LOGS = transactions, not rows)
history list length after 3000 more tiny commits: 3054 <- purge cannot remove undo that A might still need
+---------+-----------------+-----------+-------+-------------------+
| (index) | trx_id          | trx_state | age_s | trx_rows_modified |
| 0       | 419346877960192 | 'RUNNING' | 223   | 0                 |     <- the culprit: 223 s old, modified NOTHING
SUM on A (snapshot, must walk 8 undo versions per row): 4352 ms
SUM on B (fresh read view, reads newest version):         88 ms
```

**4,352 ms vs 88 ms (about 50x)** for the identical query, purely because `A`'s snapshot forces undo-chain
walks. (An earlier run of the same script gave 1,331 ms vs 81 ms and 3,291 ms vs 110 ms: noisy, always
many times slower.) `A` never wrote anything, yet it made the database slower for itself and kept 3,054
undo logs alive. The way to find the culprit:

```sql
SELECT trx_id, trx_state, trx_started, TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_s,
       trx_rows_modified, trx_mysql_thread_id
FROM information_schema.innodb_trx ORDER BY trx_started LIMIT 5;
-- then:  KILL <trx_mysql_thread_id>;   and fix the application code that held the transaction
```

**Purge lag (honest observation).** After `A` committed, I polled the history list length once a second
while still running small updates: it did NOT fall within 20 s (3,055 -> 3,073). I left the server idle
and it was still 3,073 a minute later; it only dropped to 0 some minutes later (confirmed in
`SHOW ENGINE INNODB STATUS`: `History list length 0`, `Purge done for trx's n:o < 55718 ... running but
idle`). In an earlier run, two ordinary UPDATEs from a fresh session were followed by a drop from 3,055 to
3. Take-away: purge is asynchronous and uses `innodb_purge_threads` (1 on this 8.4 container) and batches
(`innodb_purge_batch_size=300`), so after a long transaction ends the cleanup can take a while and your
reads stay slow until it does. Never alert only on "no long transactions NOW": alert on history list
length too (a few thousand is a smell, millions is an incident) and on the age of the oldest transaction.

**PostgreSQL differs here (box).**
- Postgres has **no undo log**. Old row versions live in the **heap itself** (each tuple has `xmin` and
  `xmax`). An UPDATE writes a NEW tuple version in the table (plus new index entries, unless a HOT update
  fits in the same page) and marks the old one dead. Readers check `xmin/xmax` against their snapshot.
- Cleanup is **VACUUM** (autovacuum), not purge. Dead tuples before vacuum = **table and index bloat**.
  A long-running transaction holds back the **xmin horizon**, so vacuum cannot remove dead tuples newer than
  it: same class of incident, different symptom (table size and seq scan time grow, `n_dead_tup` rises).
  Also `idle in transaction` sessions: set `idle_in_transaction_session_timeout`.
- Rollback is instant in Postgres (just mark the transaction aborted); in InnoDB a big rollback must
  apply undo and can take as long as the original change.
- Isolation: default is READ COMMITTED (snapshot per statement). Postgres REPEATABLE READ is snapshot
  isolation with NO gap locks; conflicting updates fail with `could not serialize access` (SQLSTATE 40001)
  and you must retry. SERIALIZABLE (SSI) detects dangerous patterns the same way.
- Monitoring: `pg_stat_activity` (`xact_start`, `state`), `pg_stat_user_tables.n_dead_tup`,
  `pg_stat_all_tables.last_autovacuum`; wraparound protection: `age(datfrozenxid)`.

**Frontend connection.** Like React's immutable state snapshots: a render (transaction) works with the
state as it was; new setState calls (writes) create new versions. Holding on to an old snapshot (a
stale closure) keeps old versions alive in memory, just as an old read view keeps undo alive.

**Real-world scenario (payments).** A "reconcile" endpoint opens a transaction, SELECTs a batch of payments
and then calls the bank's API for 30-90 s before committing. Under traffic the history list length
climbs to 2 million, p99 of unrelated reads doubles, and the primary's disk fills with undo. Fix: never
hold a DB transaction across a network call; read, close, call, then open a short transaction to write.
Add `SET SESSION innodb_lock_wait_timeout`/application timeouts and a monitor that kills transactions
older than N minutes.

**Interview answer:** "InnoDB implements MVCC with an undo log and read views. Each row version carries a
transaction id and a roll pointer; a transaction under REPEATABLE READ takes one read view at its first read
and reconstructs older versions from undo when a newer one is not visible, while READ COMMITTED takes a new
view per statement. Purge can only remove undo once no read view needs it, so a long transaction, even a
read-only one, makes the history list grow and slows reads that walk version chains. In my test, an idle
open transaction made the same SUM query 50x slower than from a fresh session and held 3,000 undo logs. In
Postgres the versions live in the heap and VACUUM does the cleanup, so the same problem shows up as bloat."

**Follow-up questions with answers.**
1. *Does MVCC mean no locks at all?* Plain SELECTs take no row locks; writes still lock rows (exclusive)
   and locking reads lock. Writers on the same row still block each other.
2. *Why does `SELECT ... FOR UPDATE` return the newer value?* It is a "current read" (needs the latest
   version to lock it), not a snapshot read.
3. *Can a read-only transaction cause trouble?* Yes, it pins purge (shown above).
4. *Why is a huge UPDATE/DELETE dangerous?* Millions of undo records, long lock hold time, slow rollback,
   replica lag (a single huge transaction is applied as one unit). Batch in chunks of 1,000-10,000 rows.
5. *How do you stop MVCC from showing stale data in a report?* Use READ COMMITTED for that session, or
   accept the snapshot and keep the transaction short.

**Common mistakes.** Transactions held open across HTTP calls or user think-time; forgetting `COMMIT`
in a pooled connection after an error (the connection goes back to the pool with an open transaction:
see Module 7); `autocommit=0` in an ORM default; assuming a read-only transaction is free.

**Key concepts.** Version chain, `DB_TRX_ID`/`DB_ROLL_PTR`, read view, snapshot vs current read, purge,
history list length, why long transactions hurt.

**Revision questions**
1. What does a read view contain and when is it created at REPEATABLE READ versus READ COMMITTED?
2. Why did the same SUM take 4.3 s from the old transaction and 88 ms from a new one?
3. What is the history list length and which two things make it grow?
4. Give two differences between InnoDB's and Postgres's MVCC storage.
5. How would you find and kill the long-running transaction in production?

**Practical task.** Reproduce Part 3 with your own script: open a transaction in session A, run 100k
updates in session B, watch `trx_rseg_history_len` and the timing of the same SELECT from both sessions;
then commit A and record how long the history list takes to drain.

**Checklist**
- [ ] I can explain a read view and a version chain
- [ ] I showed snapshot read vs `FOR UPDATE` on the same row from two sessions
- [ ] I found a long transaction with `information_schema.innodb_trx`
- [ ] I can explain the Postgres equivalent (xmin horizon, VACUUM, bloat)

---

## Module 5 - The query planner: cost model, statistics, histograms, EXPLAIN ANALYZE, optimizer hints [ESSENTIAL + ADVANCED]

**Concept.** SQL says WHAT you want; the **optimizer** chooses HOW: which index, which join order, which
join algorithm. It is **cost-based**: it estimates the cost of candidate plans from statistics (row counts,
index cardinality, optionally histograms) and a cost model (cost of a page read, a row comparison, a
temp table...), then picks the cheapest. Bad plans nearly always come from bad ESTIMATES, not from "stupid
optimizer logic". EXPLAIN basics are in "Week 4 / Day 6 notes"; here: estimate vs reality, statistics, hints.

**Why it matters.** "The query was fast yesterday and is slow today" is an optimizer story: data skew
changed, statistics got stale, a new index tempted the planner. You need to know how to tell estimate from
actual (`EXPLAIN ANALYZE`), how to refresh/improve statistics, and when (rarely) to override the planner.

**Internal working.**
- Phases: parse -> **resolve/rewrite** (subquery to semi-join, view merging) -> **optimize** (access path per
  table, join order, join algorithm; exhaustive search with pruning, `optimizer_search_depth`) -> execute
  (iterator tree). 8.0.18+ has **hash join** for joins without usable indexes; nested-loop (index lookups)
  remains the default for indexed joins.
- Statistics: InnoDB samples index pages (`innodb_stats_persistent_sample_pages`, default 20) to estimate
  **cardinality**; persisted in `mysql.innodb_index_stats`; refreshed after about 10% of rows change
  (`innodb_stats_auto_recalc`) or by `ANALYZE TABLE`. For low-cardinality columns it is only an
  approximation: for equality on an index MySQL does "index dives" (counts exact range ends) when the
  `eq_range_index_dive_limit` allows.
- **Histograms** (8.0+): `ANALYZE TABLE t UPDATE HISTOGRAM ON col WITH N BUCKETS` stores the value
  distribution of a column in `information_schema.column_statistics`. Used for columns WITHOUT an index (an
  indexed column uses index dives instead). They are not updated automatically.
- The numbers in EXPLAIN: `rows` = estimated rows to examine; `filtered` = estimated % that survive the
  non-index conditions; `cost=` (FORMAT=TREE/ANALYZE) = relative cost units.

**Hands-on setup.** A skewed `t_orders` table: 300,000 rows, `status` is `'done'` for 98% and `'pending'`
for 2%, `region` is `'IN'` for 90% and `'EU'` for 10%, with indexes on `status` and `user_id`.

```sql
CREATE TABLE t_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL, status VARCHAR(10) NOT NULL, region VARCHAR(4) NOT NULL,
  amount DECIMAL(10,2) NOT NULL, created_at DATETIME NOT NULL,
  KEY idx_status (status), KEY idx_user (user_id)
) ENGINE=InnoDB;
INSERT INTO t_orders (user_id, status, region, amount, created_at)
SELECT 1 + (id * 7919) % 300000, IF(id % 50 = 0, 'pending', 'done'), IF(id % 10 = 0, 'EU', 'IN'),
       (id % 1000) / 10, DATE_ADD('2026-01-01', INTERVAL (id DIV 10) MINUTE)
FROM t_seq;                      -- reuse the 300k ids from Module 1
ANALYZE TABLE t_orders;
```

**Experiment 1 - the optimizer is confidently wrong (estimate vs actual).**

```sql
EXPLAIN SELECT * FROM t_orders WHERE status = 'pending';   -- ref idx_status, rows = 6000   (actual 6,000: spot on)
EXPLAIN SELECT * FROM t_orders WHERE status = 'done';      -- ref idx_status, rows = 145879 (actual 294,000!)
```

For `'done'` the optimizer estimated about 146k rows and chose the secondary index. In reality 98% of the
table matches, and an index lookup per row plus a clustered lookup is far worse than reading the table
sequentially. `EXPLAIN ANALYZE` (8.0.18+) EXECUTES the query and prints actual times and rows next to the
estimates:

```sql
EXPLAIN ANALYZE SELECT SUM(amount) FROM t_orders WHERE status = 'done'\G                       -- the plan MySQL picked
EXPLAIN ANALYZE SELECT SUM(amount) FROM t_orders IGNORE INDEX (idx_status) WHERE status = 'done'\G
```

```
-> Aggregate: sum(t_orders.amount)  (cost=29970 rows=1) (actual time=1257..1257 rows=1 loops=1)
    -> Index lookup on t_orders using idx_status (status='done')  (cost=15382 rows=145879) (actual time=2.54..1199 rows=294000 loops=1)

-> Aggregate: sum(t_orders.amount)  (cost=59368 rows=1) (actual time=284..284 rows=1 loops=1)
    -> Filter: (t_orders.`status` = 'done')  (cost=30193 rows=291759) (actual time=2.87..227 rows=294000 loops=1)
        -> Table scan on t_orders  (cost=30193 rows=299278) (actual time=0.354..149 rows=300000 loops=1)
```

**1,257 ms with the "clever" index plan versus 284 ms with a plain table scan (4.4x).** Read the first plan:
estimated `rows=145879`, actual `rows=294000`: estimate off by 2x, and the index cost (15,382) looked
cheaper than the scan (30,193) so the index won. The skill: compare the `rows=` estimate with the `actual
... rows=` in every node; the first node where they diverge wildly is where the plan went wrong.

**Experiment 2 - hints to override (use sparingly).** Two syntaxes, same effect:

```sql
SELECT SUM(amount) FROM t_orders IGNORE INDEX (idx_status) WHERE status = 'done';           -- old style index hint
SELECT /*+ NO_INDEX(t_orders idx_status) */ SUM(amount) FROM t_orders WHERE status = 'done'; -- 8.0 optimizer hint
```

Measured (`EXPLAIN ANALYZE`): 313 ms (hint) vs 284 ms (IGNORE INDEX): both avoid the bad index, the
difference is noise. Hint families you should know:

| Hint | Use |
|---|---|
| `USE INDEX / FORCE INDEX / IGNORE INDEX (idx)` | restrict/force the index choice (FORCE makes table scans very expensive in the cost model) |
| `/*+ INDEX(t idx) */`, `/*+ NO_INDEX(t idx) */` | 8.0 hint comment syntax (does not break other DBs/ORMs: it is a comment) |
| `/*+ JOIN_ORDER(u, o) */`, `STRAIGHT_JOIN` | force join order |
| `/*+ SET_VAR(sort_buffer_size = 262144) */` | set a session variable for ONE statement |
| `/*+ MAX_EXECUTION_TIME(2000) */` | kill a SELECT after 2000 ms (a safety net for ad hoc queries) |
| `ANALYZE TABLE t` / `... UPDATE HISTOGRAM` | fix the INPUT (statistics) instead of the plan |

Prefer fixing statistics, indexes and query shape first: a hint is frozen knowledge about today's data. If
the data changes, the hint can become the bug. Document why each hint exists.

**Experiment 3 - histogram for a non-indexed skewed column.**

```sql
EXPLAIN SELECT * FROM t_orders WHERE region = 'IN';
-- type=ALL rows=299278 filtered=10.00   <- no stats on a non-indexed column: planner GUESSES 10%
ANALYZE TABLE t_orders UPDATE HISTOGRAM ON region WITH 8 BUCKETS;
EXPLAIN SELECT * FROM t_orders WHERE region = 'IN';
-- type=ALL rows=299278 filtered=89.85   <- histogram says 90%: matches reality
```

```
hist: {"buckets": [["base64:type254:RVU=", 0.1014...],        <- 'EU'  cumulative 10.1%
                   ["base64:type254:SU4=", 1.0]],             <- 'IN'  cumulative 100%
       "histogram-type": "singleton", "sampling-rate": 0.3977..., "number-of-buckets-specified": 8 ...}
```

The scan is the same here, but `filtered` feeds the NEXT step of a join: if the planner thinks
`region='IN'` keeps only 10% of the rows, it believes the join is much cheaper than it is and may pick a
bad join order. (`ANALYZE TABLE ... DROP HISTOGRAM ON region` removes it.)

**Experiment 4 - join order and `JOIN_ORDER`.**

```sql
EXPLAIN SELECT o.id, u.email FROM t_orders o JOIN t_seq u ON u.id = o.user_id
WHERE o.status = 'pending' AND u.country = 'SG';
-- o: ref idx_status  rows=6000 -> u: eq_ref PRIMARY rows=1 filtered=36.39     (start from the SMALL side: 6000 rows)

EXPLAIN SELECT /*+ JOIN_ORDER(u, o) */ o.id, u.email FROM t_orders o JOIN t_seq u ON u.id = o.user_id
WHERE o.status = 'pending' AND u.country = 'SG';
-- u: ref idx_country rows=108372 -> o: ref idx_user  rows=1 filtered=5.00     (forced to start from 108k rows)
```

The planner's default (6,000 outer rows, one PK lookup each) is clearly better than the forced order
(108k outer rows). Join order is the biggest lever of the optimizer; know that the "driving table" is the
one with the fewest estimated rows after filtering.

**PostgreSQL differs here (box).**
- Also cost-based, with statistics gathered by `ANALYZE`/autovacuum (`default_statistics_target=100`
  histogram buckets, most-common-values lists for EVERY column, not just on request). **Extended statistics**
  (`CREATE STATISTICS ... (dependencies, ndistinct)`) fix correlated-column misestimates.
- `EXPLAIN (ANALYZE, BUFFERS, VERBOSE)` is the standard; it shows `rows=` estimate vs `actual rows=`, loops,
  buffers hit/read, and "Rows Removed by Filter". Estimate errors of 10x+ are the red flag.
- **No hints in core.** You steer with settings (`SET enable_seqscan = off`, `enable_nestloop`,
  `random_page_cost` (default 4.0, lower it on SSD)), CTE `MATERIALIZED / NOT MATERIALIZED`, or the
  `pg_hint_plan` extension. Join algorithms: nested loop, hash join, merge join (MySQL gained hash join
  in 8.0.18; has no merge join).
- Plan cache: prepared statements may switch from custom to generic plans after 5 executions
  (`plan_cache_mode`), a classic cause of "same query, slower with parameters".

**Frontend connection.** The planner is like a bundler's tree shaking/chunking decisions: it decides the
order and shape of work from metadata. When metadata (stats) is wrong, the build (plan) is wasteful.

**Real-world scenario (marketplace).** Dashboard query `WHERE status = 'pending'` ran in 4 ms for a year.
After a bulk import, `pending` was 40% of the table; the same plan (index per row) became a 9 s query
that saturated the replica. EXPLAIN ANALYZE showed `rows=6000 actual rows=120000`. Fix: `ANALYZE TABLE`,
then a composite index `(status, created_at)` for the real filter; the hint was kept only as a
documented stopgap during the deployment window.

**Interview answer:** "MySQL's optimizer is cost-based: it estimates rows from index statistics and
optional histograms, costs candidate access paths and join orders, and picks the cheapest. Wrong estimates
cause bad plans. I diagnose with EXPLAIN ANALYZE by comparing estimated rows with actual rows per node.
In a test the planner chose an index for a predicate matching 98% of the table because it estimated half
of that, and the query took 1.26 s versus 0.28 s for a table scan. I fix input first (ANALYZE TABLE,
histograms, better composite/covering indexes, query rewrite) and use hints like NO_INDEX or JOIN_ORDER
only as targeted, documented overrides."

**Follow-up questions with answers.**
1. *Why might the optimizer ignore an index?* Low selectivity (reading most rows via random lookups costs
   more than a scan), stale stats, a function on the column (`WHERE DATE(created_at)=...`), type mismatch,
   leading column not used, or it thinks a covering alternative is cheaper.
2. *What is a histogram good for if I can add an index?* Columns you cannot or do not want to index but that
   take part in filters/joins; it improves `filtered` and thus join order.
3. *EXPLAIN vs EXPLAIN ANALYZE?* EXPLAIN only estimates; ANALYZE really runs the statement (a slow query stays
   slow; protect production with `MAX_EXECUTION_TIME`) and reports real timings and row counts.
4. *Why does `FORCE INDEX` sometimes make things worse?* It removes the planner's ability to pick the
   table scan when it is really cheaper (as shown above).
5. *Can the same query have different plans on primary and replica?* Yes: different statistics sampling
   and data layout, so compare with EXPLAIN on the server that actually runs it.

**Common mistakes.** Reading `rows` as the result size; adding a hint and forgetting it for years;
benchmarking on 1,000 rows (planner picks scans for tiny tables); skipping `ANALYZE TABLE` after bulk loads;
`ORDER BY RAND()`.

**Key concepts.** Cost-based optimization, cardinality/selectivity, estimate vs actual, `filtered`,
histograms, join order, hints as last resort.

**Revision questions**
1. Where do the optimizer's row estimates come from for an indexed column and for a non-indexed one?
2. Read this node: `(cost=15382 rows=145879) (actual rows=294000)`. What is wrong and what do you try?
3. When is `JOIN_ORDER` justified, and what is the risk?
4. Why can a histogram change the join order without changing the access path of the filtered table?
5. Name three Postgres differences in how you influence the planner.

**Practical task.** Create a skewed table (98/2 split), find the value where the index plan loses to a
table scan, and record both `EXPLAIN ANALYZE` runtimes. Then add the right composite index and compare again.

**Checklist**
- [ ] I compared estimated and actual rows in an EXPLAIN ANALYZE output
- [ ] I created and dropped a histogram and saw `filtered` change
- [ ] I used `NO_INDEX` / `JOIN_ORDER` hints and can say when NOT to
- [ ] I can list 3 reasons an index is ignored

---

## Module 6 - Replication: binlog, async vs semi-sync, replication lag, stale reads and read/write split [ESSENTIAL]

**Concept.** A **replica** is a second server that downloads the primary's binlog and re-executes the
changes. Used for (1) **read scaling** (send SELECTs to replicas), (2) **high availability** (promote a
replica when the primary dies), (3) backups and analytics without loading the primary. The default mode is
**asynchronous**: the primary acks a COMMIT without waiting for any replica.

**Why it matters.** Interviewers love "we added read replicas and now users see old data": that is
replication lag plus read-your-writes. You must be able to explain the data path, measure the lag, and give
2-3 application-level fixes.

**Internal working.**

```
 Primary                                           Replica
 client COMMIT -> redo+binlog fsync -> ack          IO (receiver) thread: connects, "Binlog Dump GTID", writes relay log
                  |                                 relay log (relay-bin.*) on replica's disk
                  +--> binlog dump thread  ------>  SQL/applier thread(s): read relay log, re-execute row changes
                                                    (coordinator + N workers when replica_parallel_workers > 1)
```

- **Asynchronous (default).** Primary commits, returns OK, ships the binlog "whenever". If the primary dies
  right after, the replica may NOT have the last transactions. Promoting it = silently losing acknowledged
  commits. Fine for feeds and catalogs, not fine for payments unless you accept/handle it.
- **Semi-synchronous.** Plugin pair (`semisync_source.so`, `semisync_replica.so`). With
  `rpl_semi_sync_source_wait_point=AFTER_SYNC` (default in 8.x) the primary waits until at least
  `rpl_semi_sync_source_wait_for_replica_count` (1) replica has RECEIVED and WRITTEN the transaction to its
  relay log before it tells the client OK. It does NOT mean the replica has APPLIED it (reads can still be
  stale) and if no replica acks within `rpl_semi_sync_source_timeout` (default 10 s) the primary silently
  falls back to async. Costs one network round trip per commit.
- **Group Replication / InnoDB Cluster / Galera** are the truly synchronous (certification-based)
  options, with their own trade-offs; out of scope but name them in interviews.
- **GTIDs** (`server_uuid:sequence`): each transaction has a global id; a replica says "I already have
  `uuid:1-14568`, send me the rest" (`SOURCE_AUTO_POSITION=1`), which makes failover and re-pointing
  replicas far safer than file+position.
- **Why lag happens:** (a) the applier is **single-threaded by default** in old setups while the primary
  commits in parallel, (b) one huge transaction is applied as one unit, (c) replica hardware is smaller or
  busy with analytics queries, (d) network, (e) the replica also fsyncs its own binlog and redo per commit,
  (f) long-running queries on the replica hold locks/metadata needed by the applier.
- `Seconds_Behind_Source` is the difference between the replica's clock and the TIMESTAMP of the event
  it is executing: it jumps, reads 0 when idle, and says nothing about network lag before the event is
  fetched. Better: a heartbeat table written every second on the primary and compared on the replica
  (Percona `pt-heartbeat`), or GTID sets (`SHOW REPLICA STATUS`: `Retrieved_Gtid_Set` vs `Executed_Gtid_Set`).

**Hands-on 1 - natural replication lag (real).** Setup: Module 0 replica with
`replica_parallel_workers=1` (serial applier). A Node script runs 16 concurrent writers on the primary
(each does `INSERT` + autocommit in a loop) and every 3 s asks the replica for
`SHOW REPLICA STATUS` and `COUNT(*)`:

```js
const primary = mysql.createPool({ ...base, host: '127.0.0.1', port: 33063, connectionLimit: 20 });
const replica = await mysql.createConnection({ ...base, host: '127.0.0.1', port: 33064 });
// 16 writers: while (!stop) await primary.execute('INSERT INTO commit_test (v, pad) VALUES (1, ?)', ['x']);
const seconds = async () => (await replica.query('SHOW REPLICA STATUS'))[0][0].Seconds_Behind_Source;
const rowsOnReplica = async () => (await replica.query('SELECT COUNT(*) c FROM commit_test'))[0][0].c;
```

```
t(s)  primary_commits  replica_rows  rows_behind  Seconds_Behind_Source
  3              308            44          264                      2
  6              751            87          664                      5
  9             1161           129         1032                      8
 12             1556           168         1388                     10
 15             2048           217         1831                     13
 19             2686           287         2399                     15
 22             3155           337         2818                     18
 25             3746           411         3335                     22
writers stopped at 3779 commits; waiting for the replica to drain...
  replica_rows=437 behind=3342 Seconds_Behind_Source=22
  ...                                                         (about 25 rows/s applied)
  replica_rows=2976 behind=803 Seconds_Behind_Source=87
```

The primary committed about 150 rows/s thanks to group commit (Module 3). The serial replica applied
only about 25 rows/s (one fsync per transaction, one at a time), so lag grew linearly to 22 s while the
writers ran and then kept growing to 87 s after they stopped (the backlog is applied slower than it was
produced). **A replica that cannot keep up never catches up as long as traffic continues.** The fix, live:

```sql
STOP REPLICA SQL_THREAD;
SET GLOBAL replica_parallel_workers = 8;     -- 8.4 default is 4; I had set 1 on purpose
START REPLICA SQL_THREAD;
```

```
2026-10-20 07:08:43   3348 rows   Seconds_Behind_Source: 100
2026-10-20 07:08:51   3779 rows   Seconds_Behind_Source: 0      <- ~430 rows applied in under 8 s
```

Parallel workers can apply transactions in parallel because the primary's group commit marks which
transactions were committed together (they cannot conflict). `replica_preserve_commit_order=ON` (default
in 8.4) keeps the same commit order as the primary. Other fixes: bigger replica, no heavy analytics on
the same replica, split huge transactions, tune `sync_binlog`/flush on the replica (it is safe to
relax durability on a replica you can rebuild).

**Hands-on 2 - a stale read you can show to a colleague.** To make the lag deterministic I set the
replica to apply each transaction 2 s after the primary committed it (`SOURCE_DELAY`, normally used for
"oops protection"/delayed replicas):

```sql
-- on the replica
STOP REPLICA; CHANGE REPLICATION SOURCE TO SOURCE_DELAY = 2; START REPLICA;
```

```
=== 1. Naive read/write split: write to primary, read from replica ===
write committed on primary (UPDATE ... Asha v1)
immediate read from replica -> Asha v0    <-- STALE: user just saved and sees the old name
2.6 s later, replica       -> Asha v0     (still old: the delay is per transaction on top of the apply time)
```

That is **read-your-writes** violated: the user saved their profile, the app redirected to the profile page,
the page read from the replica, and the user sees the old name and saves again. Three fixes, all tested
against the lab:

```js
// (A) Sticky reads: after a write, send that user's reads to the primary for N seconds.
const lastWrite = new Map();                // userId -> timestamp (real life: signed cookie or Redis key with TTL)
const pickPool = (userId) => (Date.now() - (lastWrite.get(userId) ?? 0) < 5000 ? P : R);
```

```
=== 2. Fix A: pin the user to the primary for N ms after a write ("sticky reads") ===
right after write, router picks PRIMARY -> Asha v2
```

```js
// (B) GTID wait: the replica read waits until it has APPLIED my write; fall back to the primary on timeout.
async function writeThenGtid(sql, params) {
  const conn = await P.getConnection();
  try {
    await conn.execute(sql, params);                                           // autocommit
    const [[g]] = await conn.query('SELECT @@global.gtid_executed AS gtid');   // a superset of my txn: always safe
    return g.gtid.replace(/\s+/g, '');
  } finally { conn.release(); }
}
async function readAfter(gtid, timeoutSec) {
  const conn = await R.getConnection();
  try {
    const [[w]] = await conn.query('SELECT WAIT_FOR_EXECUTED_GTID_SET(?, ?) AS rc', [gtid, timeoutSec]);
    if (w.rc === 0) return (await conn.query('SELECT display_name FROM profile WHERE user_id = 1'))[0][0].display_name;
  } finally { conn.release(); }
  return (await P.query('SELECT display_name FROM profile WHERE user_id = 1'))[0][0].display_name;   // fallback
}
```

```
=== 3. Fix B: GTID wait (replica read only once it has applied MY write) ===
wait up to 5 s   -> Asha v3   (served by replica after waiting 3264 ms)
wait up to 0.5 s -> Asha v4   (replica timed out after 524 ms, fell back to PRIMARY)
```

`WAIT_FOR_EXECUTED_GTID_SET` returns 0 when the replica has executed the GTID set and 1 on timeout. The
cost is explicit latency (here 3.3 s because of the artificial 2 s delay) instead of wrong data. (Reading
`@@global.gtid_executed` gives all committed GTIDs, a superset of mine: correct, slightly stricter than
needed. With `session_track_gtids=OWN_GTID` the OK packet can carry your exact GTID, but `mysql2` does not
surface it easily.) A third fix (C): route the critical read to the primary always (profile after edit,
order confirmation page, anything the user just changed) and use replicas only for lag-tolerant reads
(catalog, feeds, search, reports). After the demo I restored `SOURCE_DELAY = 0`.

**Hands-on 3 - semi-synchronous replication.**

```sql
-- primary
INSTALL PLUGIN rpl_semi_sync_source SONAME 'semisync_source.so';
SET GLOBAL rpl_semi_sync_source_timeout = 3000;      -- shortened from 10000 for the demo
SET GLOBAL rpl_semi_sync_source_enabled = 1;
-- replica (needs super_read_only OFF for the INSTALL, then back ON)
SET GLOBAL super_read_only=OFF; SET GLOBAL read_only=OFF;
INSTALL PLUGIN rpl_semi_sync_replica SONAME 'semisync_replica.so';
SET GLOBAL rpl_semi_sync_replica_enabled = 1; SET GLOBAL read_only=ON; SET GLOBAL super_read_only=ON;
STOP REPLICA IO_THREAD; START REPLICA IO_THREAD;     -- reconnect so the handshake negotiates semi-sync
```

Measured commit latency from Node (40 single-row autocommit inserts each), then I stopped the replica's
IO thread to see what the primary does:

```
async         : avg=60.2 ms  p50=58.1 ms  max=132.3 ms
semisync      : avg=66.5 ms  p50=50.6 ms  max=472.4 ms   status={"Rpl_semi_sync_source_status":"ON"}
replica IO thread stopped -> next commit took 3033 ms (waited for ack, then timed out)
status after timeout: {"Rpl_semi_sync_source_status":"OFF"}      <- silently degraded to async
next commit (now async): avg=42.6 ms
replica back, status  : {"Rpl_semi_sync_source_status":"ON"}
```

Honest reading: on this box commit latency is dominated by fsync, so semi-sync cost is in the noise
(on a real network add about one round trip, typically 0.5-2 ms within a region). The instructive line is
the 3,033 ms commit: when the replica vanishes, every commit stalls for `rpl_semi_sync_source_timeout`,
then the primary degrades to async WITHOUT telling the application. Monitor `Rpl_semi_sync_source_status`.
(An earlier run in which the replica plugin was NOT yet installed showed the same: first commit with
semi-sync on and no replica took 3,049 ms.)

**PostgreSQL differs here (box).**
- Postgres replication is **physical streaming replication of the WAL** by default: the standby is a
  byte-identical copy that replays WAL (hot standby allows read-only queries). Logical replication
  (publications/subscriptions) replicates row changes per table and allows different versions/schemas.
- Synchronous replication: `synchronous_standby_names` (+ `synchronous_commit = on / remote_write /
  remote_apply`). `remote_apply` waits until the standby has APPLIED the commit, which gives read-your-writes
  on that standby; MySQL semi-sync only guarantees receipt.
- Lag: `pg_stat_replication` on the primary (`write_lag`, `flush_lag`, `replay_lag`) and
  `pg_last_xact_replay_timestamp()` / `now() - pg_last_xact_replay_timestamp()` on the standby. The
  GTID-wait equivalent: capture `pg_current_wal_lsn()` after the write, then on the replica wait until
  `pg_last_wal_replay_lsn() >= that LSN` (or use `remote_apply`).
- **Replication slots** retain WAL until the standby consumes it: a dead standby with a slot fills the
  primary's disk. **Recovery conflicts**: a long query on a hot standby may be cancelled when replay needs
  to remove rows it still sees (`max_standby_streaming_delay`, `hot_standby_feedback`).
- Failover tooling: Patroni, repmgr, or managed services (RDS/Aurora, Cloud SQL).

**Frontend connection.** Optimistic UI: after a mutation, the client shows the new value locally instead of
refetching from a possibly stale cache/replica. Sticky reads are the server-side version of that idea.

**Real-world scenario (marketplace/payments).** Orders service adds a read replica to offload the "my
orders" page. After checkout the user lands on "my orders" and the new order is missing for 1-2 s; support
tickets: "payment taken but no order". Fix: after checkout, set a `read_primary_until` cookie (now + 10 s) so
that user's reads go to the primary; the order-confirmation page itself reads the primary by id;
the replica serves search and the public catalog. Add an alert on replica lag > 5 s and a circuit that
routes ALL reads to the primary when lag > 30 s.

**Interview answer:** "MySQL replication ships the binlog: an IO thread writes it to a relay log and
applier threads re-execute it. It is asynchronous by default, so commits can be lost on failover and
replicas can lag; semi-sync waits until a replica has received the transaction (not applied it) and falls
back to async on timeout. Lag causes include a serial applier, huge transactions and underpowered replicas;
I reproduced a replica that fell 87 s behind with 1 worker and caught up in seconds with 8 workers.
Read/write splitting breaks read-your-writes, so I pin a user to the primary for a short window after a
write, or wait for the write's GTID on the replica with a timeout and a primary fallback, and I only use
replicas for lag-tolerant reads."

**Follow-up questions with answers.**
1. *Do replicas help with write scaling?* No. Every replica replays every write; writes scale only by
   sharding/partitioning or a different architecture.
2. *How do you promote a replica safely?* Stop writes on the old primary (or fence it), wait for the
   candidate to apply everything (GTID sets equal), promote, repoint others with `AUTO_POSITION`, and make
   the old primary rejoin as a replica; automate with Orchestrator/MHA/managed failover. Expect to lose the
   un-received tail if async.
3. *What is the difference between `Seconds_Behind_Source` and real lag?* See above: timestamp-based, 0 when
   the IO thread is behind, jumps; use a heartbeat table.
4. *Statement-based vs row-based binlog?* Statement can be non-deterministic (`UUID()`, `NOW()`, `LIMIT`
   without ORDER BY) and diverge; row-based (default) logs row images, bigger but safe, and what CDC
   tools need.
5. *Can replicas serve read-after-write consistently?* Only with extra work (sticky, GTID wait,
   Postgres `remote_apply`, or reading from the primary).

**Common mistakes.** Putting transactions that read-then-write on a replica; treating a replica as a backup
(a bad `DELETE` replicates in milliseconds; use a delayed replica and real backups); not monitoring lag;
semi-sync with a single replica and no monitoring (silent downgrade); load balancing replicas behind a plain
round-robin so one user alternates between fresh and stale replicas ("time travel" reads).

**Key concepts.** Binlog/relay log, IO vs applier thread, GTID, async/semi-sync, lag causes, parallel
apply, read-your-writes patterns, promotion.

**Revision questions**
1. Why did the serial replica fall further behind after the writers stopped?
2. What exactly does semi-sync guarantee and what does it not?
3. Give three ways to get read-your-writes with replicas and one downside of each.
4. Why is `Seconds_Behind_Source = 0` not proof that the replica is current?
5. What is `remote_apply` in Postgres and how does it compare with MySQL semi-sync?

**Practical task.** Build the lab, then write a tiny router (`getPool({ userId, afterWrite })`) with sticky
reads and a lag circuit breaker that reads `Seconds_Behind_Source`. Test it by flipping `SOURCE_DELAY`.

**Checklist**
- [ ] Primary + replica running with GTID replication
- [ ] I produced and measured lag, then fixed it with parallel workers
- [ ] I demonstrated a stale read and fixed it two ways
- [ ] I can explain async vs semi-sync and the silent fallback

---

## Module 7 - Connection pooling: why the DB runs out of connections first, pool-sizing math, exhaustion symptoms [ESSENTIAL]

**Concept.** Basic pool setup (`createPool`, `connectionLimit`, `queueLimit`, leaks, `finally { release() }`)
is in "Week 4 / Day 5 notes, T5.3". This module adds the afternoon the roadmap asks for: (1) why the database
hits its connection limit long before it hits CPU, (2) pool sizing math (Little's law), (3) the failure mode
people miss, **pool exhaustion shows up as LATENCY, not errors**, and (4) how to see it.

**Why it matters.** At 3 a.m. the symptom is "API is slow, DB CPU is 10%, no errors in the logs". That is a
pool problem, and the usual wrong reflex is "raise the pool size", which can make it worse.

**Internal working.**
- On MySQL each connection is a **thread** with its own buffers (`thread_stack`, `sort_buffer_size`,
  `join_buffer_size`, `tmp_table_size` allocated on demand). `max_connections` (default 151, 60 in our lab)
  is a hard wall: connection number max+1 gets `ERROR 1040 Too many connections` (root/`CONNECTION_ADMIN`
  gets one extra slot so you can still log in). The replica's IO connection and your monitoring count too.
- **Total connections = (app instances) x (processes per instance) x (pool size)**. 6 pods x 4 cluster
  workers x pool 10 = 240 > 151. Autoscaling multiplies it silently: a scale-out event can kill the DB.
- The server can only run about as many queries truly in parallel as it has cores and IO queues. Extra
  connections just add **context switching, mutex contention and memory**. Beyond that point more
  connections = same throughput, higher latency (measured below).
- **Little's law:** `L = lambda x W` (connections in use = requests per second x time each holds a
  connection). 500 req/s x 10 ms = 5 busy connections on average. If a request holds the connection 200 ms
  (slow query, or a transaction held over an HTTP call) the same traffic needs 100.
- **Capacity of a pool:** `pool_size / hold_time` requests per second (5 connections / 0.07 s = about 70
  req/s). Arrival rate above capacity builds a **queue** inside the pool: latency = queue wait + query time,
  growing linearly with time, with NO error until `queueLimit` or a timeout.
- A common sizing starting point (from the PostgreSQL/HikariCP world and still a good rule): pool of about
  `(cores x 2) + effective_spindles` per DATABASE, shared across all app instances. For a 12-core DB that
  is about 25 connections TOTAL for CPU-bound work, far fewer than people configure. Tune with measurements.

**Hands-on 1 - "Too many connections" (no pool, 80 requests at once).** Lab primary: `max_connections=60`,
connecting as the non-privileged `app` user.

```js
const results = await Promise.allSettled(Array.from({ length: 80 }, async () => {
  const c = await mysql.createConnection(cfg);     // every request opens its own connection
  await c.query('SELECT SLEEP(2)');                // hold it for a moment
  await c.end();
}));
```

```
80 simultaneous connections, no pool: ok=58 failed=22
first error: ER_CON_COUNT_ERROR errno=1040: Too many connections
```

58 succeeded and 22 failed (the other slots of the 60 were already used by the replica's dump thread and the sessions I had open). Server counters agree:
`Connection_errors_max_connections 22`, `Max_used_connections 61` (the 61st is root's reserved slot).

**Hands-on 2 - pool exhaustion = latency, not errors.** One pool of 5 (`connectionLimit: 5`,
`queueLimit: 0` = unlimited waiting), each request runs `SELECT SLEEP(0.05)` (a 50 ms query; with driver
and network overhead the effective hold time is about 70 ms, so capacity is about 70 req/s). An OPEN-LOOP
generator sends requests on a schedule regardless of how slow the previous ones were (this is how real
users behave; a closed loop of N workers hides the problem). 8 s per rate:

```js
const pool = mysql.createPool({ ...cfg, connectionLimit: 5, queueLimit: 0, waitForConnections: true });
// open loop: due = floor(elapsed * rate / 1000); send (due - sent) requests now; measure total latency per request
```

```
rate/s  sent  errors  p50_ms  p95_ms  p99_ms  max_queue_len
    30   239       0      62     147     225              2     <- below capacity: p50 is basically the query time
    55   438       0      99     283     383             18
    65   518       0    1324    1475    1504             94     <- at/over capacity: queue builds
    80   639       0    1072    1295    1314            104
   100   794       0    1366    3061    3109            255     <- 255 requests waiting inside the pool
```

(Another run of the same experiment gave p50 = 2,037 ms at 80/s and 5,910 ms at 100/s with queue length 506.
The exact knee moves with machine noise; the SHAPE does not.) **Errors: 0 in every row.** Nothing in your
error logs. What a user sees: spinner, then a gateway timeout from the load balancer at 30 s, usually after
they have retried, which adds more load. The DB side looks idle (queries are fast); the time is spent in
the Node process waiting for a connection. This is why the roadmap says "latency spikes under load, not
errors".

How to catch it: record the pool wait separately from query time (a `acquire` timer around
`pool.getConnection()`), export a gauge for `waiting` requests, and alert on it. With `mysql2` the internal
counters used above (`pool.pool._allConnections.length`, `_freeConnections.length`,
`_connectionQueue.length`) are undocumented internals: fine for a lab, wrap them behind your own metric
and re-check on upgrades. `mysql2` has no built-in acquire timeout: wrap `getConnection` in a timeout or
set `queueLimit` so overflow fails fast with an error (a clear 503 is better than a 30 s hang).

**Hands-on 3 - a connection leak looks exactly like this (pool of 4, a handler that forgets `release()`).**

```js
async function leakyHandler(id) {
  const conn = await pool.getConnection();
  const [rows] = await conn.query('SELECT id FROM t_seq WHERE id = ?', [id]);
  if (rows.length === 0) return null;          // BUG: early return, release() skipped
  conn.release();
  return rows[0];
}
```

```
start      : all=0 free=0 waiting=0
request 1 (id=-1) ok in 85 ms -> all=1 free=0 waiting=0
request 2 (id=-2) ok in 41 ms -> all=2 free=0 waiting=0
request 3 (id=-3) ok in 46 ms -> all=3 free=0 waiting=0
request 4 (id=-4) ok in 92 ms -> all=4 free=0 waiting=0           <- 4 "not found" requests each leaked one connection
request 5 (id=5) FAILED after 1520 ms: no connection after 1500 ms (pool exhausted) -> all=4 free=0 waiting=1
request 6 (id=6) FAILED after 1515 ms: no connection after 1500 ms (pool exhausted) -> all=4 free=0 waiting=2
server side (processlist, user=app): { conns: 5, sleeping: '4' } <- DB looks idle: 4 connections "Sleep", but the app can no longer borrow them
```

Healthy requests start hanging, one by one, as soon as the pool runs dry (the "FAILED" here is my own
timeout; without it these requests wait forever). Fix: `try/finally`, or use `pool.execute/query` for
single statements and `withTransaction()` helper for transactions (Week 4 / Day 5 code). The other classic
leak: an exception between `beginTransaction()` and `commit()` that returns the connection to the pool
with the transaction still open (a Module 4 problem too: it pins purge).

**Hands-on 4 - bigger pool is not faster (CPU-bound query, 12 cores visible to the DB container).**
Closed loop: N workers, N connections, each runs `SELECT BENCHMARK(8000, MD5('a'))` (about 20 ms of CPU)
for 8 s:

```
pool_size  queries/s  avg_ms  p95_ms
        1         48    20.8    40.7
        2         68    29.4    59.8
        4        111    36.3    75.0
        8        145    55.5   135.8
       12        264    46.0    90.4      <- about one connection per core: throughput nearly saturated
       24        253    96.4   225.6      <- 2x connections: no more throughput, 2x latency
       48        311   158.2   476.1      <- 4x connections: +18% throughput, 3.4x latency, 5x p95
```

(Noisy: the 8-connection row is low because other processes shared the CPU. Look at the trend.) Past
roughly the core count, throughput flattens and latency grows linearly with connections: this is the same
queue as in Hands-on 2, moved from the Node process into the database (where it is more expensive: memory
per connection, contention). That is why you size pools to the DB's capacity, and why PgBouncer/ProxySQL
exist.

**Sizing recipe (use it in interviews).**
1. Measure `W` = p95 time a request holds a connection (query + transaction time). Keep transactions
   short (no HTTP calls inside).
2. `connections_needed = peak_req_per_s x W` (Little). Add 20-30% for bursts.
3. Cap the sum across ALL instances: `instances x workers x pool <= 0.8 x max_connections` (leave room for
   migrations, admin, replica, monitoring) AND `<= about 2-4 x DB cores` unless the workload is IO-bound.
4. Prefer a small pool + a bounded `queueLimit` + timeouts (fail fast) over a large pool.
5. If instances multiply (autoscaling, serverless), put a **proxy pooler** (ProxySQL, RDS Proxy, PgBouncer)
   between app and DB so thousands of app connections share dozens of DB connections.
6. Re-check when you add pods: `max_connections` is a cluster-level budget.

**PostgreSQL differs here (box).**
- Postgres uses **process-per-connection** (a forked backend, several MB each, plus shared-memory
  slots). Default `max_connections=100`. Many idle connections hurt more than in MySQL, so pooling
  is even more important and the pooler is usually external.
- **PgBouncer** modes: session (connection held for the whole client session), **transaction** (connection
  returned after each COMMIT; most popular, but session state such as `SET`, advisory locks, `LISTEN` and
  server-side prepared statements breaks unless handled), statement. Use `pool_mode = transaction` and
  keep app pools tiny or point many app processes at one PgBouncer.
- Node: `pg.Pool` (`max` defaults to 10, `connectionTimeoutMillis`, `idleTimeoutMillis`); the same pool
  exhaustion symptom (calls waiting in `pool.waitingCount`, `pool.idleCount`, `pool.totalCount` are
  PUBLIC properties, unlike mysql2's internals).
- Observability: `pg_stat_activity` (`state`, `wait_event`), count of `idle in transaction`.

**Frontend connection.** Browsers limit concurrent connections per host (about 6 for HTTP/1.1): the 7th
fetch queues in the browser, looks like a slow server, and shows no error. Same phenomenon, different
layer.

**Real-world scenario (payments).** A promo doubles traffic. Autoscaling goes from 4 to 12 pods, each with
pool 20: 240 potential connections against `max_connections=200`. New pods crash-loop on error 1040 and the
existing ones starve. Second incident a week later: no errors at all, p99 climbs to 20 s; a new code path
held a transaction open during a card-network HTTP call (hold time 2 s instead of 20 ms): by Little's law
the same traffic needed 100x more connections. Fixes: transaction scope fixed, pool per pod = 5 with
`queueLimit`, RDS Proxy in front, alert on pool-wait p95.

**Interview answer:** "Each MySQL connection is a thread with its own memory, and max_connections is a hard
limit, so total connections (instances x workers x pool size) must stay under it. A pool queues callers when
all connections are busy, so overload shows up as latency, not errors: capacity is pool size divided by hold
time, and arrival above that grows a queue. Little's law gives the needed connections as throughput times
hold time. I tested it: 5 connections serving 50 ms queries stayed at about 60 ms p50 below capacity and
went to 1-6 s p50 above it with zero errors, and with a CPU-bound query 12 connections reached about 85% of the
throughput of 48 at under a third of the latency. So I keep pools small, transactions short, set a bounded queue
and timeouts, and use a proxy pooler when instance count scales."

**Follow-up questions with answers.**
1. *Why not set the pool to 100 to be safe?* Memory and context switching on the DB, an overload spreads
   to every query, and the sum across instances can exceed `max_connections`.
2. *How do you size the pool for a transaction that makes an external call?* You should not do that; if
   unavoidable, the hold time includes the external call and you need many more connections: restructure.
3. *`queueLimit: 0` vs a limit?* 0 = unbounded queue: unbounded latency and memory; a limit converts a
   meltdown into fast 503s the client can retry with backoff.
4. *Where does the pool live in a Node cluster/PM2 setup?* One pool per process; 4 workers = 4 pools.
5. *Serverless (Lambda)?* Each invocation can open its own connection: use RDS Proxy or a data API.

**Common mistakes.** One pool per request; pool created inside the handler; `connectionLimit` equal to
`max_connections`; no timeouts on acquire; leaving `queueLimit: 0`; forgetting that migrations/cron/BI tools
also use connections; assuming "no errors" means healthy.

**Key concepts.** `max_connections`, Little's law, capacity = pool/hold time, queueing delay, leak vs
saturation, bounded queue, proxy pooler.

**Revision questions**
1. Compute: 8 pods x 4 workers x pool 10 vs `max_connections=151`. What happens at scale-out?
2. A pool of 10, each query holds 40 ms. What is the max sustainable req/s? What happens at 300 req/s?
3. Why does a pool leak make a healthy DB look idle?
4. Why did 48 connections not beat 12 connections by much on CPU-bound queries?
5. What changes with PgBouncer transaction pooling?

**Practical task.** Reproduce the open-loop experiment with your own query and measure p50/p95 per
arrival rate. Mark the knee, then compute what pool size would move it to 2x the rate (and check it
against the DB core count).

**Checklist**
- [ ] I triggered error 1040 on purpose
- [ ] I measured latency growth without any error under overload
- [ ] I reproduced a connection leak and fixed it with `finally`
- [ ] I can do the sizing arithmetic (Little + the instance multiplication)

---

## Module 8 - "Why is my DB the bottleneck?" diagnosis checklist [ESSENTIAL]

**Concept.** A repeatable order of questions that takes you from "the API is slow" to "this query / this
pool / this transaction". Without it people guess (add an index, raise the pool, buy a bigger instance).
This module is the checklist plus the real queries, run against the lab after all the experiments above (so
the output also shows the traces they left).

**Why it matters.** It is the most common senior-interview scenario question ("p99 doubled at 2 p.m., what
do you check?"). A structured answer matters more than a clever guess.

**The checklist (in order; stop when you find the cause).**

| # | Question | How to check | Typical verdict |
|---|---|---|---|
| 0 | Is it the DB at all? | App traces: time in DB call vs rest; pool wait time vs query time | DB time small but request slow -> Module 7 (pool wait) or app/CPU/GC |
| 1 | Connections | `Threads_connected`, `Threads_running`, `Max_used_connections`, `Connection_errors_max_connections`; app pool `waiting` | `Threads_running` >> cores = CPU/lock pile-up; `Connected` near max = pool math wrong |
| 2 | Top slow queries | `performance_schema.events_statements_summary_by_digest` ordered by total time; slow log | One digest owns 60%+ of total time |
| 3 | Plan quality | `EXPLAIN ANALYZE` on that digest: full scan? estimate vs actual? filesort/temp table? | Missing/wrong index, stale stats (Module 5) |
| 4 | Rows examined vs sent | `sum_rows_examined / sum_rows_sent` per digest | 10,000:1 = it reads far more than it returns |
| 5 | Locks | `sys.innodb_lock_waits`, `SHOW ENGINE INNODB STATUS` (LATEST DETECTED DEADLOCK), `Innodb_row_lock_time_avg` | Hot row, long transactions (Week 4 / Day 5 notes) |
| 6 | Long transactions / undo | `information_schema.innodb_trx` oldest first, history list length | Open transaction pinning purge (Module 4) |
| 7 | Buffer pool / IO | hit ratio deltas, `Innodb_buffer_pool_reads`/s, pending reads, disk IOPS and queue | Working set > RAM (Module 2) |
| 8 | Write path | `Innodb_os_log_fsyncs`, log waits, dirty page %, binlog fsync, commit latency | Too many tiny commits -> batch (Module 3) |
| 9 | Temp tables / sorts | `Created_tmp_disk_tables`, `Sort_merge_passes`, `Select_full_join` | Big GROUP BY/ORDER BY without index |
| 10 | Replication | `Seconds_Behind_Source`, replica CPU, reads routed to a lagging replica | Module 6 |
| 11 | Schema / data growth | table and index sizes, unused/duplicate indexes, row counts trend | Table 10x since the last review |
| 12 | Capacity | CPU, memory (swap?), disk latency, network | Only now consider scaling up / out |

**Real queries and real output (lab server after this file's experiments).**

*Top statements by total time (2):*

```sql
SELECT LEFT(digest_text,60) AS query, count_star AS calls, ROUND(sum_timer_wait/1e9) AS total_ms,
       ROUND(avg_timer_wait/1e9,1) AS avg_ms, sum_rows_examined AS rows_examined,
       sum_rows_sent AS rows_sent, sum_no_index_used AS no_index
FROM performance_schema.events_statements_summary_by_digest
WHERE schema_name='lab' ORDER BY sum_timer_wait DESC LIMIT 5;
```

```
| query                                                        | calls | total_ms | avg_ms   | rows_examined | rows_sent | no_index |
| SELECT `BENCHMARK` ( ? , `MD5` (?) )                         |  9592 |   527922 |       55 |          9605 |      9605 |        0 |   <- Module 7 CPU test
| SELECT `SLEEP` (?)                                           |  7160 |   510844 |     71.3 |          7181 |      7192 |        0 |   <- Module 7 pool test
| UPDATE `acct` SET `bal` = `bal` + ? WHERE `id` = ?           |  6026 |   322961 |     53.6 |          6026 |         0 |        0 |   <- tiny commits (fsync-bound)
| UPDATE `t_seq` SET `balance` = `balance` + ? WHERE `id` <= ? |    24 |   176949 |   7372.9 |       2400000 |         0 |        0 |   <- the 8 big MVCC updates
| INSERT INTO `t_uuid` ( `id` , `email` , `country` , `balance |     1 |   133770 | 133769.9 |        300000 |         0 |        1 |   <- the random UUID load: 134 s
```

Digests normalise literals to `?`, so 9,592 different calls collapse into one row. `total_ms` is "where
the DB spent its life", `avg_ms` x `calls` is what you fix first. Note the UPDATE on `acct`: avg 53.6 ms
for a one-row PK update is not an index problem, it is the fsync-per-commit cost of this lab (Module 3).

*Full table scans (3, 4):*

```sql
SELECT * FROM sys.statements_with_full_table_scans WHERE db='lab' ORDER BY total_latency DESC LIMIT 3\G
```

```
query: SELECT COUNT ( * ) FROM `t_seq` WHERE `email` = ?   exec_count: 1   total_latency: 971.34 ms
no_index_used_count: 1   no_index_used_pct: 100   rows_sent: 1   rows_examined: 300000
```

That is the unindexed email lookup from Module 1: 300,000 rows examined to return 1.

*Unused indexes (11):*

```sql
SELECT object_name, index_name FROM sys.schema_unused_indexes WHERE object_schema='lab';
```

```
| t_bin | idx_country |
| t_seq | idx_email   |       <- created for a demo and never used since the server started
```

(Statistics are since server start: only trust this view after a full business cycle, e.g. a month,
including month-end jobs.)

*Server counters (1, 5, 9):*

```
| Aborted_connects                  | 5   |
| Connection_errors_max_connections | 22  |   <- Module 7 experiment 1
| Created_tmp_disk_tables           | 3   |
| Innodb_row_lock_time_avg          | 0   |
| Innodb_row_lock_waits             | 0   |   <- no lock problem in this lab
| Max_used_connections              | 61  |   <- touched the wall (limit is 60 + 1 reserved)
| Select_full_join                  | 6   |
| Slow_queries                      | 19  |
| Threads_connected                 | 2   |
| Threads_running                   | 3   |
@@slow_query_log=0, @@long_query_time=10, @@log_queries_not_using_indexes=0
```

`Slow_queries` counts queries over `long_query_time` (10 s default) EVEN with the slow log file turned
off. In production: `slow_query_log=1`, `long_query_time=0.5` (or 0.2), and analyze with
`pt-query-digest` or the same digest table.

*Locks (5) when you need them:*

```sql
SELECT wait_started, locked_table, locked_index, waiting_pid, waiting_query, blocking_pid, blocking_query
FROM sys.innodb_lock_waits;                         -- who blocks whom, right now
SHOW ENGINE INNODB STATUS\G                         -- search for "LATEST DETECTED DEADLOCK"
```

(I did not generate a lock wait in this file: Week 4 / Day 5 notes cover deadlock reproduction.)

**The 5-minute triage script (what I actually run, in order).**
1. `SHOW PROCESSLIST` / `SELECT * FROM sys.processlist` : many `Sending data`/`Waiting for ... lock`?
2. `SELECT trx_id, trx_started, trx_rows_modified, trx_mysql_thread_id FROM information_schema.innodb_trx ORDER BY trx_started LIMIT 5;`
3. Top-5 digests by `sum_timer_wait` and by `sum_rows_examined`.
4. `EXPLAIN ANALYZE` the top one; compare estimated vs actual rows; check indexes; `ANALYZE TABLE`.
5. Hit ratio delta over 30 s; `Threads_running`; replica lag; pool `waiting` metric in the app.
6. Decide: query/index fix (minutes) -> config (buffer pool, connections) -> architecture (cache, read
   replica, batch, partition, bigger box).

**PostgreSQL differs here (box).** Equivalents: `pg_stat_statements` (extension; `total_exec_time`, `calls`,
`rows`, `shared_blks_read`) replaces the digest table; `pg_stat_activity` (`state`, `wait_event_type`,
`xact_start`) replaces PROCESSLIST + innodb_trx; `pg_locks` + `pg_blocking_pids(pid)` replace
`sys.innodb_lock_waits`; `EXPLAIN (ANALYZE, BUFFERS)`; `log_min_duration_statement` replaces the slow log;
`auto_explain` captures plans of slow queries; bloat/vacuum: `pg_stat_user_tables.n_dead_tup`,
`last_autovacuum`; connection pressure: `SELECT count(*) FROM pg_stat_activity GROUP BY state`.

**Frontend connection.** It is the same discipline as profiling a slow page: network waterfall (pool wait),
main-thread flame chart (top queries), and then micro-optimizations (hints/config). You do not rewrite
components before reading the profiler; do not buy a bigger database before reading the digest.

**Real-world scenario (marketplace).** "Checkout p99 jumped from 300 ms to 4 s at 14:00." Checklist result:
pool waiting count 80 (step 0), `Threads_running` low (step 1), digest top is `SELECT ... FROM inventory
WHERE sku = ? FOR UPDATE` (step 2) holding row locks (step 5) because a new flash-sale code path
calls the payment gateway inside the transaction (step 6). Root cause is transaction scope, not "slow DB".

**Interview answer:** "I work from the outside in. First I separate DB time from pool wait and app time in
traces. Then connections and running threads, then the top statements by total time from the digest table
or slow log, then EXPLAIN ANALYZE on the worst one to compare estimated and actual rows. After that locks
and long transactions, buffer pool hit ratio and IO, replication lag if reads go to replicas, and only then
capacity. Most of the time the answer is one missing or wrong index, a transaction that is too long, or a
pool that is too big or too small, and each of those has a cheap fix before any scaling."

**Follow-up questions with answers.**
1. *CPU is 15% but the API is slow: where do you look?* Pool wait (Module 7), locks, IO wait, a remote
   dependency inside a transaction. Low CPU with high latency means waiting, not computing.
2. *How do you find which query to optimize?* Highest `total_time` (frequency x cost), not the single
   slowest query; a 5 ms query run 10 million times beats a 5 s query run twice.
3. *When do you add a cache instead of tuning SQL?* When the same expensive read is repeated, tolerant of
   staleness, and already optimized (Week 6 / Day 4 Redis notes).
4. *When is it a capacity problem?* After queries/indexes are fine, hit ratio is high, locks are low, and
   CPU or IOPS are saturated at normal load.

**Common mistakes.** Optimizing the slowest single query instead of the heaviest by total time; scaling
before reading the plan; trusting averages (use p95/p99 and per-digest histograms); fixing in production
with an `ALTER TABLE` that locks (use online DDL, `ALGORITHM=INPLACE`/`INSTANT`, or gh-ost/pt-osc).

**Key concepts.** Outside-in triage, digest tables, rows examined vs sent, wait vs compute, order of
cheap-to-expensive fixes.

**Revision questions**
1. List the first five checks you do, in order.
2. Why order by total time instead of average time?
3. What does `rows_examined : rows_sent` tell you?
4. Which two views/tables find a long transaction and a blocking query?
5. Name the Postgres equivalents of the digest table and of `innodb_trx`.

**Practical task.** Put your Task API (Week 3-5 project) under the Module 7 open-loop generator, then run
the triage script and write a 10-line "incident report": symptom, evidence for each step, root cause, fix.

**Checklist**
- [ ] I can recite the 12-step table in order
- [ ] I ran the digest query and identified the top statement by total time
- [ ] I found an unused index and a full scan with `sys` views
- [ ] I wrote one incident report using the checklist

---

## Interview questions (25+ with answers)

Tags: `[E]` essential, `[A]` advanced. IDs are `Q-DBI-xx` (database internals).

**Q-DBI-01 [E] What is the clustered index in InnoDB and why does it matter?** It is the primary-key B+tree
whose leaf pages hold the full rows, so the table is the index. It matters because rows are physically
ordered by PK (range scans on PK are sequential), every secondary index stores the PK, and PK width and
insert order affect size and speed. Without a PK InnoDB uses the first NOT NULL UNIQUE index or a hidden
6-byte row id.

**Q-DBI-02 [E] Why is a random UUID primary key a problem? What would you use?** Inserts land on random leaf
pages: page splits, pages about 69% full instead of about 94%, cold-cache random IO, and the key is copied
into every secondary index. In my 300k-row test the CHAR(36) random PK had 4,037 leaf pages vs 2,320 for
BIGINT, and its secondary index was 3.7x larger. Use BIGINT auto-increment (plus a unique public id),
or `BINARY(16)` with time-ordered UUIDs (UUIDv7 / `UUID_TO_BIN(UUID(),1)`).

**Q-DBI-03 [E] What is a covering index?** An index that contains every column the query needs, so the
engine answers from the secondary index leaf and never touches the clustered index (`Using index`). Measured:
880x fewer page reads for an `AVG(balance) WHERE country='IN'` over 60k matching rows.

**Q-DBI-04 [E] How deep is a B+tree for 100 million rows?** About 3-4 levels, because one 16 KB internal
page holds roughly 1,000 child pointers for a BIGINT key (fewer for wide keys). A point lookup reads
height pages, with the top levels cached, so about 1 disk read.

**Q-DBI-05 [A] What happens on a page split?** A full leaf is divided into two, the parent gets a new
pointer (it can cascade up), data is moved, and both pages are only about half full. Sequential inserts avoid
it by appending to the right-most page.

**Q-DBI-06 [E] What is the InnoDB buffer pool and how do you size it?** InnoDB's page cache for data and
index pages (plus dirty pages awaiting flush). On a dedicated DB host use 50-75% of RAM, leaving room for
per-connection memory and the OS; in containers respect the memory limit. Verify with hit ratio and
the free/dirty page counts.

**Q-DBI-07 [E] How do you compute and read the buffer pool hit ratio?** `1 - Innodb_buffer_pool_reads /
Innodb_buffer_pool_read_requests` (disk reads vs logical reads), sampled as a delta. 99%+ is normal for OLTP.
In my test 99.7% took 2.7 s and 78.8% took 68.7 s for the same 50k lookups, because misses cost about 1,000x
more than hits.

**Q-DBI-08 [A] How does InnoDB avoid a table scan evicting hot pages?** Midpoint insertion LRU: new pages
enter the old sublist (3/8) and are promoted only after being touched again after `innodb_old_blocks_time`
(1 s). Postgres uses a ring buffer for large scans.

**Q-DBI-09 [E] What is write-ahead logging and why does it make commits fast?** Changes are described in a
sequential log that is fsynced at commit before the data pages are written. Sequential log appends are
cheap; random page writes happen later in the background. After a crash the log is replayed.

**Q-DBI-10 [E] What is durable when COMMIT returns in InnoDB?** With
`innodb_flush_log_at_trx_commit=1` the redo log is written and fsynced, so the transaction survives power
loss; with `sync_binlog=1` the binlog too. `=2` only writes to the OS cache (about 1 s may be lost on an OS
crash), `=0` only the log buffer (about 1 s lost even on a mysqld crash).

**Q-DBI-11 [A] What is the doublewrite buffer for?** To protect against torn pages: a 16 KB page may be
partially written on a crash, redo cannot repair a corrupted base page. Pages are first written
sequentially to doublewrite files and fsynced, then to their real location; recovery restores a torn page
from the copy. Postgres uses `full_page_writes` instead.

**Q-DBI-12 [A] Explain redo log, undo log and binlog.** Redo = physical change records for crash recovery
(InnoDB). Undo = previous row versions for rollback and MVCC (InnoDB). Binlog = logical committed changes at
the server layer for replication, PITR and CDC. Redo and binlog are kept consistent by two-phase commit.

**Q-DBI-13 [A] What is group commit and why does concurrency raise commits per second?** Concurrent
commits are batched through flush/sync/commit stages so one fsync covers many transactions. I measured 18
commits/s with one client and 235/s with 16, with 0.45 redo fsyncs per commit versus about 2.5. Practical
consequence: batch writes and use several concurrent writers.

**Q-DBI-14 [E] Describe InnoDB crash recovery.** Restore torn pages from the doublewrite buffer, replay
redo from the last checkpoint LSN forward (including uncommitted work), then roll back transactions that
were not committed using undo. I killed a server with SIGKILL: the committed rows came back and the
uncommitted insert/update vanished.

**Q-DBI-15 [E] How does MVCC work in InnoDB?** Rows carry a transaction id and a roll pointer into the undo
log. A read view decides which versions are visible; invisible newer versions are skipped by following the
chain in undo. REPEATABLE READ creates one read view per transaction, READ COMMITTED one per statement.
Readers do not block writers.

**Q-DBI-16 [E] Why are long-running transactions harmful?** They pin the oldest read view, so purge cannot
remove undo: history list length grows, undo space grows, and queries that walk long version chains slow
down (4.3 s vs 88 ms for the same SUM in my test). They also hold locks, hold a pool connection, and big ones
cause replica lag and slow rollbacks.

**Q-DBI-17 [E] What is the history list length and how do you act on it?** The number of committed undo
logs not yet purged. Check `SHOW ENGINE INNODB STATUS` or `innodb_metrics.trx_rseg_history_len`; find the oldest
transaction in `information_schema.innodb_trx`, kill/fix it, and consider more purge threads. Alert on
it. Note it counts transactions, not rows.

**Q-DBI-18 [A] SELECT vs SELECT ... FOR UPDATE under REPEATABLE READ: can they return different values?**
Yes. A plain SELECT reads from the snapshot; FOR UPDATE (and UPDATE/DELETE) are current reads of the
latest committed version. In my two-session test the snapshot read returned 100 while FOR UPDATE returned 999.

**Q-DBI-19 [A] How does Postgres MVCC differ?** Versions are kept in the heap (xmin/xmax), no undo log;
dead tuples are removed by VACUUM, so the failure mode is bloat and xmin-horizon blocking instead of undo
growth; rollback is instant; REPEATABLE READ is snapshot isolation with serialization failures instead of gap
locks; and every index points to a ctid since there is no clustered index.

**Q-DBI-20 [E] How does the MySQL optimizer choose a plan?** Cost-based: it estimates row counts from
index statistics and histograms, costs access paths, join orders and join algorithms (nested loop, hash join),
and picks the cheapest. Bad estimates (stale or skewed stats) produce bad plans; `EXPLAIN ANALYZE` shows
estimate vs actual per node.

**Q-DBI-21 [E] The optimizer chose an index but the query is slow. What do you do?** `EXPLAIN ANALYZE`; if
estimated rows << actual rows, run `ANALYZE TABLE`, add a histogram for non-indexed columns, add a better
composite/covering index, rewrite the query, and as a documented last resort use `IGNORE INDEX` / `NO_INDEX`
/ `JOIN_ORDER` hints. In my test the index plan took 1,257 ms and the scan 284 ms for a predicate matching 98%.

**Q-DBI-22 [A] What is a histogram in MySQL 8 and when is it useful?** Column value-distribution statistics
(`ANALYZE TABLE ... UPDATE HISTOGRAM`) stored in `information_schema.column_statistics`. Useful for
non-indexed filtered/joined columns with skew; it fixes the `filtered` estimate (10% guess became 89.85%
in my test). It is not auto-updated.

**Q-DBI-23 [E] Async vs semi-sync replication?** Async: primary acks without waiting for replicas, fastest,
may lose acked commits on failover, replicas lag. Semi-sync: primary waits until at least one replica has
received (not applied) the transaction (AFTER_SYNC), costs a round trip, and silently falls back to async after
`rpl_semi_sync_source_timeout` (I measured a 3,033 ms stalled commit then `Rpl_semi_sync_source_status=OFF`).

**Q-DBI-24 [E] What causes replication lag and how do you fix it?** Serial applier, huge transactions,
underpowered or busy replica, replica fsync settings, network, blocking queries on the replica. Fixes:
`replica_parallel_workers` (lag 100 s to 0 in my demo), split big transactions, bigger replica, separate
analytics replica, relax durability on the replica, monitor with a heartbeat table.

**Q-DBI-25 [E] Users do not see their own update right after saving. Diagnose and fix.** Read/write split
with async replication: the read hit a lagging replica (read-your-writes violation). Fixes: send reads of
recently-written data to the primary (sticky window or per-request flag), wait for the write's GTID on the
replica with a timeout and fallback, `remote_apply` in Postgres, or do not use replicas for that read.

**Q-DBI-26 [E] Why does a database run out of connections before CPU?** Each connection is a thread/process
with memory; `max_connections` is a hard cap; total = instances x workers x pool and it multiplies silently
with autoscaling. Idle or oversized pools waste memory and contention while CPU is barely used.

**Q-DBI-27 [E] How do you size a connection pool?** Little's law: connections = throughput x hold time (500
req/s x 10 ms = 5), plus burst headroom; keep the sum across all instances under about 80% of
`max_connections` and around 2-4x DB cores for CPU-bound workloads; prefer small pools, bounded queues, timeouts,
and a proxy pooler when instances scale.

**Q-DBI-28 [E] What are the symptoms of pool exhaustion?** Rising latency and timeouts with NO database
errors, low DB CPU, many `Sleep` connections server-side (leaks) or a growing `waiting` count in the
pool. I measured p50 going from 62 ms to over 1 s with 0 errors when arrival exceeded pool capacity.

**Q-DBI-29 [A] More connections made it slower. Why?** Past roughly the core count extra connections only add
context switching and contention; throughput flattens, latency rises linearly (12 connections = 264 q/s at
46 ms; 48 connections = 311 q/s at 158 ms).

**Q-DBI-30 [E] Walk me through "the DB is the bottleneck" triage.** Separate pool wait vs query time; check
connections and running threads; top statements by total time (digest/slow log); EXPLAIN ANALYZE the top
one; then locks and long transactions, buffer pool/IO, replica lag; only then capacity. (Full table in
Module 8.)

**Q-DBI-31 [A] Why might a "fixed" query regress after a bulk import?** Statistics changed: a value that was
rare became common and the index plan stopped being optimal; `ANALYZE TABLE`, histograms, and re-checking the
plan with EXPLAIN ANALYZE fix it.

**Q-DBI-32 [A] Explain two-phase commit between redo log and binlog.** InnoDB prepares and flushes redo, the
server writes (and fsyncs) the binlog, then InnoDB commits. After a crash, prepared transactions found in
the binlog are committed, others rolled back, so primary data and the binlog never disagree.

---

## Summary

- **Storage:** InnoDB = B+tree pages (16 KB). The PK tree IS the table; secondary indexes carry the PK.
  Random wide PKs bloat everything (measured: 74% more leaf pages, 3.7x bigger secondary index).
  Covering indexes can cut page reads by orders of magnitude (240,553 to 274).
- **Memory:** the buffer pool decides whether you do memory or disk IO. 99.7% vs 78.8% hit rate was 2.7 s
  vs 68.7 s.
- **Durability:** WAL = sequential redo + fsync at commit; doublewrite protects torn pages; binlog is a
  separate logical log for replicas/PITR; group commit makes concurrency raise throughput.
- **Concurrency:** MVCC = undo + read views. Long transactions pin purge, grow the history list and make
  reads walk version chains (50x slower in the test).
- **Planner:** cost-based; wrong estimates cause wrong plans. Read estimate vs actual; fix statistics and
  indexes first; hints last.
- **Replication:** async by default; lag is real (87 s with 1 applier, 0 with 8 workers); read/write split
  needs read-your-writes handling (sticky, GTID wait, primary for critical reads).
- **Pools:** limits are about connections, not CPU; pool exhaustion is latency without errors; size with
  Little's law and keep the total under the DB budget.
- **Diagnosis:** outside-in checklist, top statements by total time, then plan, locks, undo, cache, replica,
  capacity.

## Assessment (mixed difficulty)

**Basic**
1. What is stored in the leaf pages of the clustered index versus a secondary index in InnoDB?
2. Write the formula for the buffer pool hit ratio using two status variables.
3. Name the three logs involved in a MySQL commit and one job of each.
4. What does `innodb_flush_log_at_trx_commit=1` guarantee?
5. State Little's law and use it: 200 req/s, each holding a connection 25 ms. How many connections on average?

**Intermediate**
6. A table has `PRIMARY KEY (id CHAR(36))` and four secondary indexes. Explain two reasons storage and insert
   cost are higher than with `BIGINT`.
7. After `COMMIT` of a long report transaction the history list length is still growing for a minute. Explain
   why and what you would monitor.
8. A replica shows `Seconds_Behind_Source: 0` but users still read stale data. Give two possible causes.
9. 6 pods x 4 workers x pool 10, `max_connections=151`. What breaks, and what do you change?
10. `EXPLAIN` estimates `rows=6000` but `EXPLAIN ANALYZE` shows `actual rows=120000`. List three things you try.

**Advanced**
11. Explain exactly what crash recovery does with (a) a committed transaction whose pages were not flushed,
    (b) an uncommitted transaction whose pages WERE flushed, (c) a torn page.
12. You must provide read-your-writes with one async replica and 5,000 requests/s. Compare sticky reads, GTID
    wait and always-primary reads in latency, complexity and failure modes.
13. A single `UPDATE ... WHERE created_at < ...` touches 40M rows in one transaction on the primary. List four
    problems and a safer pattern.
14. Compare how MySQL and Postgres handle old row versions, what breaks when a transaction stays open for 3
    hours in each, and how you detect it.
15. A payment service uses semi-sync with one replica. During a replica outage nobody noticed anything. What
    happened and what monitoring and policy would you add?

## Answers with explanations

1. Clustered index leaf = the full row (all columns). Secondary index leaf = the indexed columns plus the
   primary key value, which is used for the second lookup in the clustered tree.
2. `1 - Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests` (`reads` = misses that went to disk,
   `read_requests` = logical reads); use deltas over an interval.
3. Redo log (InnoDB crash recovery: replay committed work), undo log (rollback and MVCC old versions), binlog
   (replication, point-in-time recovery, CDC). The doublewrite buffer is a fourth helper for torn pages.
4. The redo log is written and fsynced before COMMIT returns, so an acknowledged transaction survives a
   crash or power loss (combined with `sync_binlog=1` for the binlog too).
5. `L = lambda x W` = 200 x 0.025 = 5 connections on average; size for bursts, e.g. 8-10.
6. (a) The 36-byte PK is copied into every secondary index entry (versus 8 bytes), so all five trees are
   fatter and fan-out drops. (b) Random keys cause page splits and about 69% fill and random IO per insert,
   so the working set is larger and writes miss the buffer pool sooner. (Measured: 4,037 vs 2,320 leaf
   pages; secondary index 3.7x.)
7. Purge is asynchronous and runs in batches on a small number of threads; after the oldest read view
   disappears the backlog still has to be drained, and I observed it draining slowly on a mostly idle
   server. Monitor history list length and oldest `trx_started`, add purge threads, and keep transactions
   short.
8. The metric is timestamp-based and reads 0 when the SQL thread is idle or the IO thread has not fetched
   events yet; the app may be reading a different (lagging) replica from a pool; or the data was written
   after the monitor sampled. Use GTID comparison or a heartbeat table and verify which node served the read.
9. 240 potential connections > 151: at scale-out new pods get error 1040 and may starve existing ones. Budget
   is about 80% of 151 = 120 for ALL processes, so reduce the pool per process to 4 or 5 (6 x 4 x 5 = 120 is the
   ceiling, leaving no room for admin/migrations, so 4 is safer), cap the pod count, or add a proxy pooler;
   raise `max_connections` only if memory allows.
10. `ANALYZE TABLE`; add/refresh a histogram (non-indexed column) or a better composite index;
    check data skew and parameter sniffing-like behaviour (value-dependent plans); rewrite predicate so the
    index is usable; as a last resort a documented hint.
11. (a) Pages are old on disk but redo has the change: redo is replayed forward from the checkpoint so the
    change appears. (b) The page on disk contains uncommitted changes: recovery repeats history via redo, then
    uses undo to roll the transaction back. (c) Torn page: restored from the doublewrite copy before redo is
    applied.
12. Sticky reads: no extra latency, simple (cookie/Redis), but sends more traffic to the primary and fails
    if the window is shorter than the lag. GTID wait: exact, costs up to the lag in latency, needs GTID
    plumbing and a primary fallback on timeout. Always-primary for critical reads: simplest and consistent,
    but the primary absorbs those reads; fine if they are a small fraction. Most systems combine them
    (critical reads on primary, sticky for the rest, GTID/`remote_apply` for special flows).
13. Huge undo and slow rollback, long lock hold (blocking other writers), replica lag (applied as one
    unit), history list/undo growth and purge pressure, binlog event size, and a possible crash/rollback
    that takes as long again. Safer: batch by PK range in chunks of 1,000-10,000 rows with a short
    transaction per chunk and a pause for replicas.
14. MySQL: old versions in undo; a 3 h transaction pins purge, history list length and undo grow, reads
    slow down; detect with `innodb_trx` and HLL. Postgres: versions in the heap; a 3 h transaction holds the
    xmin horizon, VACUUM cannot remove newer dead tuples, tables/indexes bloat; detect with
    `pg_stat_activity.xact_start` / `backend_xmin` and `n_dead_tup`; mitigate with
    `idle_in_transaction_session_timeout` and statement timeouts.
15. Semi-sync waited up to the timeout, then the primary silently fell back to async, so durability on a
    replica was lost without errors. Monitor `Rpl_semi_sync_source_status` and alert when OFF, run at least
    2 replicas with `wait_for_replica_count=1`, consider Group Replication or managed multi-AZ synchronous
    storage for money, and write a runbook for failover with possible data loss accounted.

## Hours estimate (for a schedule)

| Module | Reading | Lab / experiments | Total |
|---|---|---|---|
| 0 Lab setup (compose, replication) | 0.25 h | 0.75 h | 1.0 h |
| 1 B+tree, clustered/secondary, covering, UUID | 0.75 h | 1.25 h | 2.0 h |
| 2 Buffer pool | 0.5 h | 1.0 h | 1.5 h |
| 3 WAL, redo, doublewrite, binlog, group commit | 0.75 h | 1.25 h | 2.0 h |
| 4 MVCC and undo | 0.75 h | 1.0 h | 1.75 h |
| 5 Query planner and hints | 0.5 h | 1.0 h | 1.5 h |
| 6 Replication and read/write split | 0.75 h | 1.5 h | 2.25 h |
| 7 Connection pooling and sizing | 0.5 h | 1.5 h | 2.0 h |
| 8 Diagnosis checklist + interview questions | 1.0 h | 0.5 h | 1.5 h |
| Assessment and revision | 1.0 h | - | 1.0 h |
| **Total** | | | **about 16.5 h (fits Days 22-28 at about 2.5 h/day)** |

If you are short on time, the highest-value order is: Module 7, 1, 4, 6, 3, 2, 8, 5, then the rest.

## Not verified and honest limits

**Executed and verified on real containers** (MySQL 8.4.11 on Docker Desktop, Windows 11, Node v20.20.1,
`mysql2` 3.24.6): Module 0 compose and replication setup; Module 1 page counts, tree height read from
`.ibd`, covering-index page reads, UUID comparison; Module 2 hit ratio, INNODB STATUS, 8 MB vs 128 MB pool;
Module 3 SIGKILL crash recovery, commit benchmark, group commit counters, binlog events; Module 4 two-session
MVCC script; Module 5 EXPLAIN / EXPLAIN ANALYZE / histogram / hints; Module 6 lag, parallel workers fix,
stale read, sticky and GTID-wait fixes, semi-sync; Module 7 error 1040, open-loop latency, leak, CPU-bound
pool sizes; Module 8 digest, `sys` views and counters.

**Not verified / caveats**
- ALL "PostgreSQL differs here" boxes were written from documented behaviour; I did not run Postgres. Check
  details against the docs of your Postgres version (notably `uuidv7()` is PG 18+, parallel/replication
  defaults).
- Absolute numbers (commits/s, ms) are specific to Docker Desktop on one Windows laptop with other containers
  running; they are noisy (I report ranges where runs differed). Ratios and trends are the lesson.
- `innodb_flush_log_at_trx_commit=2` / `sync_binlog=0` data-loss behaviour on power loss was NOT demonstrated
  (a SIGKILL of mysqld does not drop OS-cached writes); it is stated from the MySQL documentation.
- Redo file count (32), default values of `innodb_stats_persistent_sample_pages` (20), `innodb_old_blocks_time`
  (1000), `binlog_expire_logs_seconds` (30 days), semi-sync defaults were checked with `SELECT @@var`
  where noted; the Group Replication / Galera mentions were not run.
- `mysqlbinlog` is not included in the `mysql:8.4` image, so I showed `SHOW BINLOG EVENTS` instead of a
  decoded row dump.
- The history list length draining after the long transaction ended was slow and inconsistent between my
  runs (one run dropped from 3,055 to 3 after two fresh writes, another stayed at 3,073 for a minute and
  was 0 a few minutes later); I did not isolate the exact purge trigger.
- `pool.pool._allConnections` and similar `mysql2` fields are internal and may change; the lab uses them only
  to print counters.
- Sizing rules such as `(cores x 2) + spindles` and "2-4x cores" are heuristics to START from, not laws.

**Cleanup (run when finished):**

```bash
docker compose down -v          # removes db-mysql, db-replica, network db-net and both data volumes
docker rm -f db-bp-small        # the small-buffer-pool container from Module 2
```
