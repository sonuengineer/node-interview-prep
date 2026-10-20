# 19 - Concurrency, Distributed Systems and Capacity Estimation

> **Where this fits**
>
> | Roadmap days | Roadmap section | This file |
> |--------------|-----------------|-----------|
> | Days 50-56 | Learn concurrency + "Prove it, don't just read it" | Part A (Lab 0 to Lab 7) |
> | Days 64-70 | Learn distributed systems + "Apply it to your own project" | Part B (B1 to B8) |
> | Days 57-63 | System design fundamentals + "Do the numbers, not the boxes" | Part C (C1 to C3) |
> | Interview prep | 30+ Q&A, assessment | Last modules |
>
> Existing parts you should read first, so this file does not repeat them:
> Week 1 / Day 5 notes (event loop, microtasks), Week 2 / Day 2 and Day 3 notes (event loop phases, thread pool,
> `worker_threads`, a first worker pool and a first Atomics example), Week 4 / Day 4-5 notes (transactions,
> isolation levels, deadlocks), Week 6 / Day 3 notes (retries, backoff, idempotency basics),
> Week 7 / Day 1 and Day 4 notes (scaling ladder, payment workflows). Here we go one level deeper and
> **break things on purpose, then measure**.
>
> Honest scope note: seven days of reading will make you fluent in the vocabulary and able to reason about
> failure. It will not make you a person who can implement Raft in production. The labs are small on purpose.

**How to use this file:** every lab follows the same shape: goal -> exact code -> exact command -> **real
output** (copied from a run, not invented) -> what you learned -> interview answer. Tiers: `[ESSENTIAL]`
(asked in most backend interviews) and `[ADVANCED]` (supplementary / senior-level).

---

**PART A - CONCURRENCY LABS (Days 50-56)**

## Lab 0 - Setup and ground rules `[ESSENTIAL]`

**Goal:** have MySQL 8 and Redis 7 running locally, and a lab folder with the three npm packages.

```bash
mkdir cd-labs && cd cd-labs
npm init -y && npm pkg set type=module
npm i express@5 mysql2@3 ioredis@5

docker run -d --name cd-mysql -p 33068:3306 -e MYSQL_ROOT_PASSWORD=pw -e MYSQL_DATABASE=cd \
  mysql:8.0 --innodb-flush-log-at-trx-commit=2 --skip-log-bin
docker run -d --name cd-redis -p 63795:6379 redis:7
```

Check:

```bash
node -v                                                     # v20.20.1 in my runs
docker exec cd-mysql mysql -ppw -e "select version()"       # 8.0.46
docker exec cd-redis redis-cli ping                         # PONG
```

Why those two MySQL flags? Docker Desktop on Windows has slow `fsync`. With the defaults
(`innodb_flush_log_at_trx_commit=1`, binary log on, `sync_binlog=1`) every COMMIT waits for two disk syncs and
one hot row topped out near 15-20 updates/second in my first attempt (see the box in Lab 2). The flags make
commits cheaper so the labs finish in minutes. `flush_log_at_trx_commit=2` means "write to the OS cache at
commit, fsync once per second": you can lose about 1 second of commits on an OS crash. **Never copy that to a
payments database without understanding the trade.** Everything in this file works with the defaults too, just
slower.

**Ground rules**

1. Node 20 is enough for everything here (`fetch`, `AbortSignal.timeout`, `worker_threads`, `perf_hooks`).
   Node 22 behaves the same for these labs.
2. Timings are from one Windows 11 laptop with Docker Desktop. **Your absolute numbers will differ. The shape
   (who is correct, who is wrong, what grows) is what matters.**
3. A "race condition" is not a bug you can see by reading `console.log` once. Always run the broken version
   several times and count: the claim must be "final value X, expected Y", never "it looked fine".

**Key concepts**

- Concurrency = many things in progress at once (interleaved). Parallelism = many things executing at the
  same instant. Node gives you the first for free (event loop) and the second only with threads/processes.
- A race condition needs three things: shared state, a gap between check and act, and interleaving.
- Correctness comes from making the check and the act **one indivisible step** (atomic), or from forcing
  steps to take turns (lock / queue).

**Revision questions**

1. Is Node single-threaded? (Careful answer: JavaScript execution of your code is single-threaded; libuv thread
   pool and worker threads exist; see Week 2 / Day 2 notes.)
2. Concurrency vs parallelism with a restaurant example.
3. Why can a single-threaded program still have a race condition?

**Practical task:** run the three setup checks and paste the outputs into your notes.

- [ ] MySQL answers on 33068
- [ ] Redis answers on 63795
- [ ] `node -v` is 20 or newer

---

## Lab 1 - A race inside ONE Node process (async check-then-act) `[ESSENTIAL]`

**Goal:** prove that "Node is single-threaded, so I have no race conditions" is false. Any `await` between a
check and the action that depends on it opens a window for another request to slip in.

**Concept.** JavaScript runs one callback at a time, so `stock = stock - 1` on its own can never be torn
apart. But the moment you write

```js
const current = await db.read();   // CHECK  (suspend here, other requests run)
if (current <= 0) ...;
await db.write(current - 1);       // ACT    (based on a value that may be stale by now)
```

the function is suspended at every `await`. While request #1 waits, requests #2..#20 run their own CHECK and
all see the same old value. This is the classic **check-then-act** (or read-modify-write) race. It is a race
between *requests*, not between threads.

**Frontend connection.** Same bug as a React `setCount(count + 1)` called twice in one handler: both calls
close over the same stale `count`. The fix there is the functional form `setCount(c => c + 1)`; the backend
equivalent is "make the update a single atomic operation".

**Code** (`lab1_race.mjs`, runnable as is). Five tickets exist, twenty buyers arrive at the same moment.

```js
import express from 'express';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- tiny promise Mutex (explained fully in Lab 5) ----
class Mutex {
  #tail = Promise.resolve();
  run(fn) {
    const result = this.#tail.then(fn);
    this.#tail = result.catch(() => {});
    return result;
  }
}

let stock = 5;            // only 5 tickets exist
let soldBroken = 0;
let soldFixed = 0;
const mutex = new Mutex();

async function fakeDbRead() { await sleep(5); return stock; }   // simulates a SELECT
async function fakeDbWrite(v) { await sleep(5); stock = v; }    // simulates an UPDATE

const app = express();

// BROKEN: check ... await ... act
app.post('/buy-broken', async (req, res) => {
  const current = await fakeDbRead();          // CHECK
  if (current <= 0) return res.status(409).json({ ok: false });
  await fakeDbWrite(current - 1);              // ACT (based on a stale read)
  soldBroken++;
  res.json({ ok: true });
});

// FIXED: the whole check-then-act runs inside the mutex
app.post('/buy-fixed', (req, res) =>
  mutex.run(async () => {
    const current = await fakeDbRead();
    if (current <= 0) return res.status(409).json({ ok: false });
    await fakeDbWrite(current - 1);
    soldFixed++;
    res.json({ ok: true });
  }),
);

const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const fire = (path, n) =>
    Promise.all(Array.from({ length: n }, () => fetch(base + path, { method: 'POST' }).then((r) => r.status)));

  stock = 5;
  const a = await fire('/buy-broken', 20);
  console.log('BROKEN: 20 buyers, 5 tickets -> 200s:', a.filter((s) => s === 200).length,
    '| 409s:', a.filter((s) => s === 409).length, '| final stock:', stock, '| sold counter:', soldBroken);

  stock = 5;
  const b = await fire('/buy-fixed', 20);
  console.log('FIXED : 20 buyers, 5 tickets -> 200s:', b.filter((s) => s === 200).length,
    '| 409s:', b.filter((s) => s === 409).length, '| final stock:', stock, '| sold counter:', soldFixed);
  server.close();
});
```

**Run:**

```bash
node lab1_race.mjs
```

**Real output:**

```text
BROKEN: 20 buyers, 5 tickets -> 200s: 20 | 409s: 0 | final stock: 4 | sold counter: 20
FIXED : 20 buyers, 5 tickets -> 200s: 5 | 409s: 15 | final stock: 0 | sold counter: 5
```

**What you learned**

- The broken route sold **20 tickets when only 5 existed**, and the stock counter says 4 (the last writer
  "won" with a stale number). Money-wise that is 15 oversold tickets and an inventory number that is a lie.
- This happened with **zero threads**. One process, one event loop.
- The fixed route serialises the critical section with a promise-based mutex, so exactly 5 succeed.
- Intermittency: with a real DB the window is a few milliseconds, so low traffic hides the bug and a flash
  sale exposes it. That is why "works on my machine" proves nothing.
- Caveat: an in-process mutex only protects **one** Node process. With 2 instances behind a load balancer the
  race is back. Real fixes live in the database (Lab 2) or in a distributed lock (B5).

**Common mistakes**

- Putting the lock around only the write, not around check + write.
- Thinking `async/await` makes code "sequential" across requests. It is sequential inside one function only.
- Using a module-level variable as a cache of "current stock" in a service that runs as several instances.

**Interview answer:** "Node being single-threaded protects each synchronous step, not a sequence of steps
separated by `await`. A check-then-act across an await is a race between concurrent requests. I fix it by
making the operation atomic in the data store (conditional UPDATE, unique constraint, transaction with a row
lock), or by serialising access with a mutex or queue if it is single-process. In a multi-instance deployment
the in-process mutex is not enough, so the guarantee has to live in the database or a distributed lock."

**Follow-ups**

1. *Would `Promise.all` or a for-loop change the result?* A `for` loop with `await` inside handles ONE caller
   sequentially, but the race is between different HTTP requests, so no. The mutex or an atomic SQL does.
2. *Why did the broken version not oversell by exactly the same amount every run?* Timer ordering and I/O
   timing vary; the bug is non-deterministic, which is the whole danger.

**Revision questions**

1. Where exactly is the race window in `/buy-broken`?
2. Why does the mutex fix fail with two server instances?
3. What would a conditional UPDATE look like for this route? (`UPDATE tickets SET stock = stock - 1 WHERE id = ? AND stock > 0`, check `affectedRows`.)

**Practical task:** change `fire('/buy-broken', 20)` to 200 buyers and 50 tickets, run it five times, and write
down the range of "sold" values. Then add a third route that uses a counter object and no mutex but
a synchronous check-and-decrement (no `await` between check and act) and observe that it is correct.

- [ ] I can point at the line where the stale read happens
- [ ] I reproduced the oversell more than once
- [ ] I can explain why the in-process mutex is not enough in production

---
## Lab 2 - The database lost update: 10,000 concurrent updates on MySQL `[ESSENTIAL]`

**Goal:** fire 10,000 concurrent "add 1 to the same row" requests at MySQL, and compare four strategies by
the only metric that matters: **final value vs expected value** (plus time). Also see a real MySQL deadlock.

**Concept.** A *lost update* happens when two transactions read the same value, both compute a new value in
the application, and both write: the second write silently overwrites the first.

```text
T1: read n=5 ........................ write n=6
T2:        read n=5 ........ write n=6        <- one increment vanished
```

Four ways to deal with it:

| Strategy | Idea | Cost |
|----------|------|------|
| 0. Naive read-modify-write | read in app, write in app | wrong |
| 1. Atomic `UPDATE n = n + 1` | the DB does read+write inside one statement, under the row lock | best when the operation can be expressed in SQL |
| 2. `SELECT ... FOR UPDATE` in a transaction (pessimistic) | take the row lock at read time, hold until COMMIT | correct for any logic, but holds the lock longer (3 round trips) |
| 3. Optimistic version column | `UPDATE ... WHERE id=? AND version=?`, if 0 rows changed then somebody beat you: re-read and retry | no lock held while you think, but retries explode on a hot row |

**Internal working (InnoDB).** `UPDATE` takes an exclusive (X) record lock on the row. Another transaction
that wants the same row waits in the lock queue until the first one commits. So concurrent updates to one row
are **serialised by the database no matter how many connections you have**. Under `REPEATABLE READ` a plain
`SELECT` is a consistent snapshot read and takes no lock: that is exactly why the naive pattern is unsafe.
`SELECT ... FOR UPDATE` is a *locking read*: it reads the latest committed row and takes the X lock. (See
Week 4 / Day 4-5 notes for isolation levels and the lock types; 14_Database_Internals.md has the InnoDB internals.)

**Code** (`lab2_mysql.mjs`). Pool of 50 connections, 10,000 promises started at once (so 9,950 of them queue
inside the mysql2 pool waiting for a free connection):

```js
import mysql from 'mysql2/promise';

const N = Number(process.env.N || 10000);
const ONLY = process.argv[2];
const pool = mysql.createPool({
  host: '127.0.0.1', port: 33068, user: 'root', password: 'pw', database: 'cd',
  connectionLimit: Number(process.env.POOL || 50), waitForConnections: true,
});

await pool.query(`CREATE TABLE IF NOT EXISTS counters (
  id INT PRIMARY KEY, n INT NOT NULL, version INT NOT NULL DEFAULT 0) ENGINE=InnoDB`);

async function reset() { await pool.query('REPLACE INTO counters (id, n, version) VALUES (1, 0, 0)'); }
async function finalValue() { const [[r]] = await pool.query('SELECT n, version FROM counters WHERE id = 1'); return r; }

// 0. Naive: read in app, write back in app. No transaction, no lock.
async function naive() {
  const [[row]] = await pool.query('SELECT n FROM counters WHERE id = 1');
  await pool.query('UPDATE counters SET n = ? WHERE id = 1', [row.n + 1]);
}

// 1. Atomic UPDATE: the increment happens inside the DB, under the row lock
async function atomic() {
  await pool.query('UPDATE counters SET n = n + 1 WHERE id = 1');
}

// 2. Pessimistic: SELECT ... FOR UPDATE inside a transaction
async function forUpdate() {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[row]] = await c.query('SELECT n FROM counters WHERE id = 1 FOR UPDATE');
    await c.query('UPDATE counters SET n = ? WHERE id = 1', [row.n + 1]);
    await c.commit();
  } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}

// 3. Optimistic: version column, retry when 0 rows matched
let retries = 0;
async function optimistic() {
  for (;;) {
    const [[row]] = await pool.query('SELECT n, version FROM counters WHERE id = 1');
    const [res] = await pool.query(
      'UPDATE counters SET n = ?, version = version + 1 WHERE id = 1 AND version = ?',
      [row.n + 1, row.version]);
    if (res.affectedRows === 1) return;
    retries++;
  }
}

async function run(name, fn) {
  await reset(); retries = 0;
  const t0 = performance.now();
  const results = await Promise.allSettled(Array.from({ length: N }, () => fn()));
  const ms = Math.round(performance.now() - t0);
  const failed = results.filter((r) => r.status === 'rejected').length;
  const { n, version } = await finalValue();
  console.log(`${name.padEnd(22)} expected=${N} final=${String(n).padStart(5)} lost=${String(N - n).padStart(5)} failed=${failed} time=${ms}ms` +
    (name === 'optimistic+retry' ? ` retries=${retries} version=${version}` : ''));
}

if (!ONLY || ONLY === 'naive') await run('naive read-modify-write', naive);
if (!ONLY || ONLY === 'atomic') await run('atomic UPDATE n=n+1', atomic);
if (!ONLY || ONLY === 'forupdate') await run('SELECT FOR UPDATE', forUpdate);
if (!ONLY || ONLY === 'optimistic') await run('optimistic+retry', optimistic);
await pool.end();
```

**Run** (one strategy at a time so they do not disturb each other; `N` and `POOL` are env vars):

```bash
N=10000 POOL=50 node lab2_mysql.mjs naive
N=10000 POOL=50 node lab2_mysql.mjs atomic
N=10000 POOL=50 node lab2_mysql.mjs forupdate
N=200   POOL=50 node lab2_mysql.mjs optimistic
```

**Real output** (MySQL 8.0.46, `flush_log_at_trx_commit=2`, binlog off, Docker Desktop on Windows):

```text
naive read-modify-write expected=10000 final=    2 lost= 9998 failed=0 time=42035ms
atomic UPDATE n=n+1    expected=10000 final=10000 lost=    0 failed=0 time=31893ms
SELECT FOR UPDATE      expected=10000 final=10000 lost=    0 failed=0 time=131993ms
optimistic+retry       expected=  200 final=  200 lost=    0 failed=0 time=28033ms retries=11262 version=200
```

And the naive strategy at smaller sizes, so you can see it is not a "10,000 only" problem:

```text
naive read-modify-write expected=200 final=    2 lost=  198 failed=0 time=2064ms
naive read-modify-write expected=2000 final=    2 lost= 1998 failed=0 time=19602ms     (POOL=5)
```

**Why is the naive result as extreme as "2"?** The 10,000 promises are created in one synchronous burst; the
pool hands out connections in FIFO order, so all the early SELECTs run before any of the UPDATEs get a turn.
Nearly everyone reads `n=0` and writes `1`. In production, traffic is spread over time, so you would lose a
fraction of the updates, not 99.98%. The failure *mode* is the same, and it is silent: **no error, no
exception, status 200 everywhere, the data is simply wrong.**

**Optimistic locking at larger sizes** (retries are the price):

| Updates (N) | Pool | Result (same hot row, retry until success) |
|-------------|------|----------------------------------------------|
| 200 | 50 | all 200 applied in 28.0 s, **11,262 retries** (about 56 wasted attempts per success) |
| 200 | 5 | all 200 applied in 22.8 s, 12,549 retries |
| 2,000 | 5 | after about 8 minutes 50 seconds only **106 of 2,000** had succeeded; I stopped the run |
| 10,000 | 50 | not completed: see below |

Why the collapse? Each retry re-enters the pool's FIFO queue **behind every other waiting query**. By the time
a transaction's `UPDATE ... WHERE version = ?` finally runs, thousands of other statements have gone first and
the version it read is long stale, so almost every attempt fails and re-queues. Optimistic locking assumes
*conflicts are rare*; 2,000 simultaneous writers on one row is the opposite assumption. I did not run the
10,000-update version to completion because the 2,000 run already showed the trend. The production rule is:
**limit retries (2-3), add jitter, return `409 Conflict` and let the caller decide**, and do not use
optimistic locking for hot counters.

**What the numbers say**

1. **Correctness first:** only strategies 1, 2 and 3 end with `final == expected`. The naive version lost
   9,998 of 10,000 updates without a single error.
2. **The row is a serial resource.** 10,000 updates on one row finished in 32 s with the atomic UPDATE (about
   313 updates/s) on this laptop. Adding connections does not help: the lock queue is the bottleneck. Hot-row
   throughput is roughly `1 / (time the lock is held)`.
3. **Holding the lock longer is expensive.** `FOR UPDATE` held the row across 3 round trips (SELECT, UPDATE,
   COMMIT) and was about 4 times slower (132 s, about 76 updates/s) than the single atomic statement.
4. **Optimistic locking is a gamble on low contention.** With 200 updates and 50 workers there were 11,262
   retries, about 56 wasted attempts per successful update, and with 2,000 contenders only 106 had succeeded
   after almost 9 minutes. Each retry is two more queries. On a genuinely hot
   row it is the worst strategy; on rarely-conflicting rows (a user editing their own profile) it is the
   cheapest, because nobody holds a lock while the user thinks.
5. **Pool size did not fix anything.** In an earlier run with `FOR UPDATE` and 1,000 updates, pool=5 took
   54.6 s, pool=10 took 65.4 s, pool=50 took 49.6 s (binlog on). The queue is inside the database.

> **Box: what the durability settings did (measured).** Same hot-row workload, three server configs:
> `flush_log_at_trx_commit=1` + binlog on (MySQL defaults): the atomic UPDATE loop had reached only n=6611
> after about 450 s (about 15 updates/s) when I stopped it. `=2` + binlog on: 10,000 atomic updates in
> 79.8 s. `=2` + binlog off: 31.9 s. **A hot row's ceiling is set by the commit latency of the disk**, which is
> why "just one counter row" can quietly cap a whole product at tens of requests per second.

### Deadlock on real MySQL `[ESSENTIAL]`

`lab2b_deadlock.mjs` makes two transfers lock the same two accounts in opposite order:

```js
import mysql from 'mysql2/promise';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfg = { host: '127.0.0.1', port: 33068, user: 'root', password: 'pw', database: 'cd' };
const admin = await mysql.createConnection(cfg);
await admin.query('DROP TABLE IF EXISTS accounts');
await admin.query('CREATE TABLE accounts (id INT PRIMARY KEY, balance INT NOT NULL) ENGINE=InnoDB');
await admin.query('INSERT INTO accounts VALUES (1, 100), (2, 100)');

async function transfer(name, first, second, lockOrderFixed = false) {
  const c = await mysql.createConnection(cfg);
  const [a, b] = lockOrderFixed ? [Math.min(first, second), Math.max(first, second)] : [first, second];
  try {
    await c.beginTransaction();
    await c.query('SELECT balance FROM accounts WHERE id = ? FOR UPDATE', [a]);
    await sleep(200);                                  // both transactions now hold their first lock
    await c.query('SELECT balance FROM accounts WHERE id = ? FOR UPDATE', [b]);
    await c.query('UPDATE accounts SET balance = balance - 10 WHERE id = ?', [first]);
    await c.query('UPDATE accounts SET balance = balance + 10 WHERE id = ?', [second]);
    await c.commit();
    return `${name}: committed`;
  } catch (e) {
    await c.rollback().catch(() => {});
    return `${name}: ${e.code} errno=${e.errno} -> ${e.sqlMessage}`;
  } finally { await c.end(); }
}

console.log('opposite lock order (1->2 and 2->1):');
console.log((await Promise.all([transfer('T1', 1, 2), transfer('T2', 2, 1)])).map((s) => '  ' + s).join('\n'));
console.log('same lock order (always lowest id first):');
console.log((await Promise.all([transfer('T1', 1, 2, true), transfer('T2', 2, 1, true)])).map((s) => '  ' + s).join('\n'));
const [rows] = await admin.query('SELECT * FROM accounts');
console.log('balances:', JSON.stringify(rows));
await admin.end();
```

Real output:

```text
opposite lock order (1->2 and 2->1):
  T1: committed
  T2: ER_LOCK_DEADLOCK errno=1213 -> Deadlock found when trying to get lock; try restarting transaction
same lock order (always lowest id first):
  T1: committed
  T2: committed
balances: [{"id":1,"balance":90},{"id":2,"balance":110}]
```

InnoDB detects the cycle (T1 waits for T2's lock, T2 waits for T1's) and kills one victim immediately. Your code
must **catch errno 1213 and retry the whole transaction** (a deadlock is a normal, expected event under
concurrency, not a bug to log and forget). The prevention is a global lock ordering rule: always lock rows in
ascending id order, so no cycle can form (second half of the output).

### Which strategy when? `[ESSENTIAL]`

| Situation | Use |
|-----------|-----|
| Counter, balance, stock decrement | atomic conditional UPDATE: `SET stock = stock - 1 WHERE id=? AND stock > 0`, check `affectedRows` |
| Multi-step logic that must see a stable row (ledger transfer, state machine) | transaction + `SELECT ... FOR UPDATE`, lock rows in a fixed order, retry on 1213 |
| User edits a form/document, conflicts are rare, locks cannot be held across HTTP requests | optimistic `version` column, return 409 on conflict, let the client re-fetch |
| "Only one of these may ever exist" | UNIQUE constraint; catch duplicate-key error (errno 1062) |
| Work spanning several services/DBs | not a DB lock problem: see B5 (distributed lock) and B7 (saga) |

**Frontend connection.** The optimistic version column is the backend half of "this record was changed by
someone else, reload" dialogs; the HTTP form is `ETag` + `If-Match` (412) or a `version` field in the PUT body (409).

**Common mistakes**

- Reading the balance with a plain SELECT inside a transaction and believing the transaction protects you
  (under REPEATABLE READ the plain SELECT is a snapshot, no lock).
- Starting a transaction, calling a slow external API, then updating: the row lock is held for the whole API call.
- Forgetting the retry loop on deadlock (1213) and lock wait timeout (1205).
- Using `SERIALIZABLE` as a magic fix and not preparing for the extra deadlocks it creates.

**Interview answer:** "A lost update is two transactions reading the same value and both writing back a
computed result. I would measure it, not assume: I ran 10,000 concurrent increments through a 50-connection
pool. The naive read-in-app/write-in-app pattern ended at 2 instead of 10,000 with no errors at all. An atomic
`UPDATE n = n + 1` ended at exactly 10,000, because InnoDB serialises writers on the row lock. `SELECT ... FOR
UPDATE` also ended correct but was about four times slower because the lock is held across round trips.
Optimistic version checks are correct but, on one hot row, burn dozens of retries per success. So I choose the
smallest atomic statement that expresses the change, a locking transaction when I need to read-then-decide, and
optimistic locking when conflicts are rare."

**Follow-ups**

1. *Does `SERIALIZABLE` fix it?* Yes (plain SELECTs become locking reads), but at the cost of more lock waits
   and deadlocks; targeted `FOR UPDATE` or an atomic UPDATE is cheaper and clearer.
2. *Would a bigger pool make it faster?* No. The bottleneck is the single row's lock queue; more connections
   just wait longer and consume DB memory.
3. *How do you make a hot counter scale?* Shard the counter (N rows, pick one at random, SUM on read), or
   buffer increments in Redis (`INCR`) and flush periodically, accepting a small window of data loss.

**Key concepts:** lost update, read-modify-write, atomic statement, row lock, locking read, optimistic locking,
deadlock victim, lock ordering.

**Revision questions**

1. Why does the naive version lose updates even inside a transaction on REPEATABLE READ?
2. How do you detect a lost optimistic update (which column, which value)?
3. Why is hot-row throughput independent of pool size?
4. What error code does MySQL return on deadlock and what must the app do?
5. Why is `FOR UPDATE` slower than the atomic UPDATE in the table above?

**Practical task:** add a fifth strategy `ticketAtomic()` for the Lab 1 problem: table `tickets(id, stock)`,
statement `UPDATE tickets SET stock = stock - 1 WHERE id = 1 AND stock > 0`, count how many calls get
`affectedRows === 1` when 1,000 requests compete for 100 tickets. My run (table with `CHECK (stock >= 0)`,
pool of 20, 1,000 `Promise.all` calls):

```text
1000 buyers, 100 tickets -> succeeded: 100 | rejected: 900 | final stock: 0
```

Exactly 100, no oversell, no transaction, no app-side lock: the `AND stock > 0` inside the statement is the
check and the act in one step.

- [ ] I ran all four strategies and saw `lost=` for each
- [ ] I can explain the deadlock output and the ordering fix
- [ ] I can say when I would pick each strategy

---
## Lab 3 - Real threads: SharedArrayBuffer + Atomics `[ADVANCED]`

**Goal:** see a race that is a true data race (two CPU cores touching the same memory), and fix it with
`Atomics`. Worker basics are in Week 2 / Day 3 notes; this lab adds the part that file only mentions: a
**start gate**, so the race actually happens.

**Concept.** `worker_threads` normally share nothing: messages are copied. A `SharedArrayBuffer` is raw memory
visible to all threads. `view[0]++` compiles to three steps (load, add, store). Two threads can load the same
old value and both store old+1: classic lost update, now at CPU level. `Atomics.add` does the three steps as one
indivisible hardware operation. (Node's own docs describe `Atomics` as the way to read/write/wait on shared memory safely.)

**Code** (`lab3_atomics.mjs`). My first version had no gate: worker #1 finished its loop before worker #2 even
booted (starting a thread takes tens of milliseconds), so the "race" printed the correct total by luck. That is
itself a lesson: **a test that cannot fail proves nothing.** The gate below makes all four workers start at
the same instant:

```js
import { Worker, isMainThread, workerData } from 'node:worker_threads';

const WORKERS = 4;
const PER_WORKER = 2_000_000;

if (isMainThread) {
  async function run(mode) {
    // slot 0 = the counter, slot 1 = start gate (so all workers begin at the same instant)
    const sab = new SharedArrayBuffer(8);
    const view = new Int32Array(sab);
    const workers = Array.from({ length: WORKERS }, () => new Worker(new URL(import.meta.url), { workerData: { sab, mode } }));
    const exits = workers.map((w) => new Promise((resolve, reject) => { w.on('exit', resolve); w.on('error', reject); }));
    await new Promise((r) => setTimeout(r, 300));       // let every worker boot and park at the gate
    const t0 = performance.now();
    Atomics.store(view, 1, 1); Atomics.notify(view, 1); // open the gate
    await Promise.all(exits);
    const ms = Math.round(performance.now() - t0);
    const got = Atomics.load(view, 0);
    console.log(`${mode.padEnd(8)} expected=${WORKERS * PER_WORKER} final=${got} lost=${WORKERS * PER_WORKER - got} time=${ms}ms`);
  }
  await run('plain');
  await run('plain');
  await run('atomics');
} else {
  const view = new Int32Array(workerData.sab);
  Atomics.wait(view, 1, 0);                             // block this worker thread until the gate opens
  if (workerData.mode === 'plain') {
    for (let i = 0; i < PER_WORKER; i++) view[0]++;     // read, add, write: three steps
  } else {
    for (let i = 0; i < PER_WORKER; i++) Atomics.add(view, 0, 1);
  }
}
```

`Atomics.wait` is allowed in worker threads and forbidden on the main thread's event loop in browsers (it would
freeze the page); in Node it is allowed but you should never block the main thread with it.

**Run:** `node lab3_atomics.mjs`

**Real output** (4 workers, 2,000,000 increments each):

```text
plain    expected=8000000 final=2952098 lost=5047902 time=45ms
plain    expected=8000000 final=2813118 lost=5186882 time=42ms
atomics  expected=8000000 final=8000000 lost=0 time=215ms
```

**What you learned**

- Two runs of the same broken code gave **two different wrong answers**: the signature of a data race.
  Here 63% of the increments vanished.
- `Atomics.add` is exactly correct, but about 5 times slower here (215 ms vs 45 ms): atomic operations force
  cache-line ownership to bounce between cores. Correctness is not free, and a shared hot counter is a
  contention point on a CPU just like a hot row is in a database.
- Prefer **no sharing**: give each worker its own counter (or its own slice of the input) and add the partial
  results at the end. Shared memory is the last resort.
- Important: the Lab 1 race (async interleaving, one thread) and this race (parallel threads) have different
  causes and the same cure: make read-modify-write indivisible.

**Frontend connection.** Same primitive browsers use to share memory between a page and a Web Worker (needs
cross-origin isolation headers there). Same race, same `Atomics` API.

**Common mistakes**

- Using a `SharedArrayBuffer` to "avoid copying" without needing it; structured clone or transferables are
  simpler and safe.
- Believing `Atomics.add` on one slot makes a *multi-field* update atomic. It does not: you would need a lock
  built with `Atomics.compareExchange`.
- Declaring victory after one passing run of a race test.

**Interview answer:** "Threads in Node do not share memory by default; with a `SharedArrayBuffer` they do, and
then `x++` is a non-atomic read-modify-write. I demonstrated it with four workers incrementing one slot two
million times each: the plain version lost about 5 million increments, differently on every run; `Atomics.add`
gave exactly 8,000,000 but was several times slower because of cache-line contention. I would normally avoid the
sharing: partition the data per worker and merge results."

**Follow-ups**

1. *How would you build a mutex from Atomics?* `compareExchange(view, i, 0, 1)` to try to take it,
   `Atomics.wait` to sleep while it is 1, `Atomics.store(..., 0)` plus `Atomics.notify` to release.
2. *Why did the gate matter?* Without it, thread start-up time hid the race.

**Key concepts:** data race, atomic operation, SharedArrayBuffer, start gate, false sharing/cache-line bouncing.

**Revision questions**

1. Why can't a plain `view[0]++` be made safe by running it in a try/catch?
2. What does `Atomics.wait` do and why is it not usable in a request handler?
3. Why is the atomic version slower?

**Practical task:** change `WORKERS` to 1 and run both modes; explain why `plain` is now always correct.
Then give each worker its own slot (`view[workerIndex]++`), sum them at the end and compare time with the
atomic version.

- [ ] I saw `plain` give a different wrong answer on two runs
- [ ] I can explain why the first version of my race printed the right answer
- [ ] I tried the per-worker-slot version

---

## Lab 4 - A bounded task pool with graceful drain `[ESSENTIAL]`

**Goal:** build the structure behind every worker pool, queue consumer and HTTP client: **limit concurrency,
bound the queue, reject (not buffer) beyond it, and drain cleanly on shutdown.** (Week 2 / Day 3 has a
worker-thread pool for CPU work; this one is the promise-level pool you use for I/O such as "call this API for
10,000 users but only 20 at a time".)

**Concept.** Without a limit, `Promise.all(items.map(fetchSomething))` starts everything at once: 10,000
sockets, DB pool exhausted, downstream rate-limited, your memory full. A pool has three numbers:

- `concurrency`: how many tasks run at once (protects the downstream).
- `maxQueue`: how many may wait (protects your memory; the rest get "queue full", i.e. backpressure).
- a drain deadline: how long you wait for in-flight work on shutdown (protects your deploy).

**Code** (`lab4_pool.mjs`):

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class TaskPool {
  #concurrency; #maxQueue; #queue = []; #running = 0; #closing = false; #idle = [];
  constructor({ concurrency, maxQueue = Infinity }) {
    this.#concurrency = concurrency; this.#maxQueue = maxQueue;
    this.peak = 0;
  }
  get stats() { return { running: this.#running, queued: this.#queue.length }; }

  submit(fn) {
    if (this.#closing) return Promise.reject(new Error('pool is draining: not accepting work'));
    if (this.#queue.length >= this.#maxQueue) return Promise.reject(new Error('queue full (backpressure)'));
    return new Promise((resolve, reject) => {
      this.#queue.push({ fn, resolve, reject });
      this.#pump();
    });
  }
  #pump() {
    while (this.#running < this.#concurrency && this.#queue.length) {
      const { fn, resolve, reject } = this.#queue.shift();
      this.#running++;
      this.peak = Math.max(this.peak, this.#running);
      Promise.resolve().then(fn).then(resolve, reject).finally(() => {
        this.#running--;
        this.#pump();
        if (this.#running === 0 && this.#queue.length === 0) this.#idle.splice(0).forEach((f) => f());
      });
    }
  }
  // Graceful drain: stop accepting, finish everything already accepted, with a deadline
  async drain(timeoutMs = 5000) {
    this.#closing = true;
    if (this.#running === 0 && this.#queue.length === 0) return 'drained';
    const done = new Promise((r) => this.#idle.push(() => r('drained')));
    const timer = sleep(timeoutMs).then(() => 'timeout');
    return Promise.race([done, timer]);
  }
}

const pool = new TaskPool({ concurrency: 3, maxQueue: 5 });
const finished = [];
const task = (id, ms) => async () => { await sleep(ms); finished.push(id); return id; };

const settled = [];
for (let i = 1; i <= 12; i++) {
  settled.push(pool.submit(task(i, 100)).then((v) => `task ${v} ok`, (e) => `task ${i} REJECTED: ${e.message}`));
}
console.log('after submitting 12:', pool.stats);
const drainP = pool.drain(2000);                       // SIGTERM equivalent
const late = await pool.submit(task(99, 10)).catch((e) => e.message);
console.log('submit after drain started ->', late);
console.log('drain result:', await drainP, '| peak concurrency:', pool.peak);
console.log((await Promise.all(settled)).join('\n'));
console.log('finished in order:', finished.join(','));

// deadline case
const slow = new TaskPool({ concurrency: 1 });
slow.submit(task('slow', 1000));
console.log('drain with 200ms deadline on a 1000ms task ->', await slow.drain(200));
```

**Run:** `node lab4_pool.mjs`

**Real output:**

```text
after submitting 12: { running: 3, queued: 5 }
submit after drain started -> pool is draining: not accepting work
drain result: drained | peak concurrency: 3
task 1 ok
task 2 ok
task 3 ok
task 4 ok
task 5 ok
task 6 ok
task 7 ok
task 8 ok
task 9 REJECTED: queue full (backpressure)
task 10 REJECTED: queue full (backpressure)
task 11 REJECTED: queue full (backpressure)
task 12 REJECTED: queue full (backpressure)
finished in order: 1,2,3,4,5,6,7,8
drain with 200ms deadline on a 1000ms task -> timeout
```

**What you learned**

- 12 tasks submitted: 3 running, 5 queued, 4 **rejected immediately** (fast failure beats unbounded memory).
- Peak concurrency was exactly 3 = the limit.
- After `drain()` starts, new work is refused, but all 8 accepted tasks still finish: that is "graceful".
- The deadline matters: a stuck task must not block the deploy forever. `timeout` tells the caller to log and
  exit anyway (then the orchestrator's SIGKILL is the backstop).

**Wiring it to shutdown (sketch you can use in Express 5):**

```js
process.on('SIGTERM', async () => {
  server.close();                       // stop accepting new HTTP connections; keep-alive ones finish
  const r = await pool.drain(10_000);   // finish in-flight background work
  console.log('shutdown:', r);
  process.exit(r === 'drained' ? 0 : 1);
});
```

**Frontend connection.** Browsers cap parallel requests per host (about 6 over HTTP/1.1) with the same queue
idea; `p-limit` and `p-queue` are the npm versions of this class.

**Common mistakes**

- Unbounded queue: the pool "works" until memory runs out; the failure appears hours later as OOM.
- Drain without a deadline, so one hung request blocks every deploy.
- Rejecting after the process has already exited because `process.exit()` ran before `drain()` finished.
- Forgetting that a *rejected* task must be visible to the caller (here: the returned promise rejects).

**Interview answer:** "A bounded pool has a concurrency limit, a bounded queue that rejects when full, and a drain
operation. On SIGTERM I stop accepting new work, wait for in-flight tasks up to a deadline, then exit. The
bounded queue is what turns overload into a fast, explicit 429/503 instead of memory growth and unbounded latency."

**Follow-ups**

1. *Concurrency 3 and 100 ms tasks: what is max throughput?* `3 / 0.1 s = 30 tasks/s` (Little's law again, C1).
2. *Where does the pool fit with a DB pool?* Pool concurrency must be at or below the DB pool size, otherwise
   tasks just wait twice.
3. *Worker pool for CPU work?* Same shape, but tasks go to `worker_threads` (Week 2 / Day 3, Example 2).

**Key concepts:** concurrency limit, bounded queue, load shedding, graceful drain, drain deadline.

**Revision questions**

1. Why reject instead of queueing without limit?
2. What happens to tasks already running when `drain()` starts?
3. How do you test the deadline path?
4. Where in an Express app would `drain` be called?

**Practical task:** add `pool.onIdle()` and `pool.stats` to a `/health` JSON, and make `submit` support a
per-task timeout (`Promise.race` with `AbortSignal.timeout`). Test with a task that never resolves.

- [ ] I can explain each of the three numbers (concurrency, maxQueue, deadline)
- [ ] I triggered both `drained` and `timeout` results
- [ ] I can sketch SIGTERM handling with the pool

---

## Lab 5 - A Mutex and a Semaphore from promises (and a deadlock) `[ESSENTIAL]`

**Goal:** implement the two classic primitives with nothing but promises, use them to fix a race, limit
concurrency, and then deliberately deadlock them.

**Concept.**

- **Mutex** (mutual exclusion): at most one holder. Protects a critical section.
- **Semaphore(n)**: at most `n` holders. A mutex is `Semaphore(1)`. Use it to cap concurrent DB calls or API calls.
- Mechanism in JS: `acquire()` returns a promise that is already resolved when a permit is free, otherwise
  its resolver is parked in a FIFO queue; `release()` hands the permit straight to the next waiter.

**Code** (`lab5_mutex.mjs`):

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Semaphore {
  #permits; #waiters = [];
  constructor(n) { this.#permits = n; }
  acquire() {
    if (this.#permits > 0) { this.#permits--; return Promise.resolve(); }
    return new Promise((resolve) => this.#waiters.push(resolve));
  }
  release() {
    const next = this.#waiters.shift();
    if (next) next();               // hand the permit directly to the next waiter (FIFO)
    else this.#permits++;
  }
  async use(fn) { await this.acquire(); try { return await fn(); } finally { this.release(); } }
}
class Mutex extends Semaphore { constructor() { super(1); } }

// 1) Mutex fixes the read-modify-write race
let shared = 0;
async function incUnsafe() { const v = shared; await sleep(1); shared = v + 1; }
const m = new Mutex();
async function incSafe() { await m.use(async () => { const v = shared; await sleep(1); shared = v + 1; }); }

await Promise.all(Array.from({ length: 100 }, incUnsafe));
console.log('unsafe: expected 100, got', shared);
shared = 0;
await Promise.all(Array.from({ length: 100 }, incSafe));
console.log('mutex : expected 100, got', shared);

// 2) Semaphore(3) limits concurrency
const sem = new Semaphore(3);
let active = 0, peak = 0;
await Promise.all(Array.from({ length: 10 }, () => sem.use(async () => {
  active++; peak = Math.max(peak, active); await sleep(50); active--;
})));
console.log('semaphore(3): 10 tasks, peak concurrent =', peak);

// 3) Deadlock: two mutexes taken in opposite order
const A = new Mutex(), B = new Mutex();
async function t1() { await A.acquire(); await sleep(10); await B.acquire(); B.release(); A.release(); return 't1 done'; }
async function t2() { await B.acquire(); await sleep(10); await A.acquire(); A.release(); B.release(); return 't2 done'; }
const result = await Promise.race([Promise.all([t1(), t2()]), sleep(500).then(() => 'DEADLOCK: nothing finished after 500ms')]);
console.log('opposite lock order ->', result);

// Fix: always take locks in one global order (A then B), on fresh mutexes
const A2 = new Mutex(), B2 = new Mutex();
async function ordered(name) { await A2.acquire(); await sleep(10); await B2.acquire(); B2.release(); A2.release(); return name + ' done'; }
console.log('same lock order     ->', (await Promise.all([ordered('t1'), ordered('t2')])).join(', '));
```

**Run:** `node lab5_mutex.mjs`

**Real output:**

```text
unsafe: expected 100, got 1
mutex : expected 100, got 100
semaphore(3): 10 tasks, peak concurrent = 3
opposite lock order -> DEADLOCK: nothing finished after 500ms
same lock order     -> t1 done, t2 done
```

**What you learned**

- `unsafe: got 1`: all 100 tasks read `0` before any wrote, because each suspended at `await sleep(1)`.
  Worst-case Lab 1.
- With the mutex the result is exactly 100, but notice the cost: 100 tasks that each wait 1 ms now run one
  after another, so the batch takes at least 100 ms instead of about 1 ms. **A lock trades parallelism for correctness.** Keep critical sections tiny.
- `use(fn)` with `try/finally` guarantees release even if `fn` throws. A mutex that is not released on error
  is a permanent outage.
- The four conditions for deadlock all hold in the opposite-order case: mutual exclusion, hold-and-wait, no
  preemption, circular wait. Break any one: the cheapest is a **global lock ordering** (break circular wait),
  as the last line shows. Same rule as the MySQL deadlock in Lab 2.
- Node has no built-in mutex/semaphore for async code; the libraries `async-mutex` and `p-limit` are this same
  idea, plus timeouts and cancellation.

**Frontend connection.** A mutex around an async function is how you stop a "double click submits twice" bug;
a semaphore(6) is what the browser does for per-host connections.

**Common mistakes**

- Calling `release()` twice, or in a path that did not `acquire()`: the semaphore then hands out more permits
  than it should.
- Holding a mutex while calling something that needs the same mutex (re-entrancy): instant deadlock.
- Assuming an in-process mutex protects a multi-instance service (it does not; see B5).
- No timeout on `acquire()`: one stuck holder blocks every waiter forever.

**Interview answer:** "A promise mutex is a FIFO queue of resolvers: acquire either returns immediately or parks
a promise, release resolves the next one. A semaphore generalises it to n permits and is what I use to bound
concurrency toward a database or third-party API. It fixes check-then-act races within one process at the cost
of serialising the critical section. Deadlock requires circular wait, so I prevent it by always acquiring locks
in a consistent global order and by putting timeouts on acquire."

**Follow-ups**

1. *Mutex vs queue?* Equivalent for serialising; a queue (BullMQ, single consumer) also survives restarts and
   spans instances.
2. *Fairness?* This one is FIFO, so no starvation. A spin-lock on `compareExchange` is not.
3. *Livelock?* Tasks keep reacting to each other and make no progress (e.g. two retry loops with identical
   backoff); jitter breaks the symmetry.

**Key concepts:** mutex, semaphore, critical section, lock ordering, four deadlock conditions, starvation.

**Revision questions**

1. Why does `use()` use try/finally?
2. What would happen if `release()` handed the permit back to `#permits` even when a waiter existed?
3. Name the four conditions for deadlock and break one in the demo.
4. Why is a mutex not enough with 2 instances?

**Practical task:** add `acquire(timeoutMs)` that rejects with `Error('lock timeout')` and removes the waiter
from the queue. Test it by holding the mutex for 1 s and acquiring with a 100 ms timeout.

- [ ] I can recite the four deadlock conditions
- [ ] I reproduced the deadlock and fixed it with ordering
- [ ] I know why critical sections must be tiny

---

## Lab 6 - Blocking the event loop, measured with `monitorEventLoopDelay` `[ESSENTIAL]`

**Goal:** show with numbers what "do not block the event loop" costs, and that moving CPU work to a worker
thread fixes it. (Event loop phases: Week 2 / Day 2 notes; the histogram API appears in Week 1 / Day 5 and
Week 2 / Day 2 notes. This lab adds a **separate client process**, because measuring from inside the
blocked process lies to you.)

**Concept.** One synchronous function that runs for 1.3 seconds stops *every* other request from even being
read off the socket for 1.3 seconds: health checks, WebSocket pings, timers, everything. Under load this is
how one slow endpoint takes down a whole instance. `monitorEventLoopDelay` samples a timer every
`resolution` ms and records how late it fires: the lateness is the time the loop was busy.

**Code** (`lab6_block.mjs`). The server and the probe client are different processes (`fork`):

```js
// Server and probe client live in DIFFERENT processes, otherwise the client's own event loop is blocked too.
import http from 'node:http';
import { fork } from 'node:child_process';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';

function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (process.argv[2] === 'client') {
  const base = process.argv[3];
  const ping = async () => { const t = performance.now(); await fetch(base + '/ping'); return Math.round(performance.now() - t); };
  const stats = async (label) => console.log(label.padEnd(24), await (await fetch(base + '/stats')).text());
  await ping();
  console.log('idle /ping latency (ms):         ', await ping());
  await stats('idle');
  const slow = fetch(base + '/block').then((r) => r.text());
  await sleep(50);
  console.log('/ping DURING fib(40) on loop (ms):', await ping());
  await slow;
  await stats('fib(40) ON the loop');
  const slow2 = fetch(base + '/worker').then((r) => r.text());
  await sleep(50);
  console.log('/ping DURING fib(40) in worker(ms):', await ping());
  await slow2;
  await stats('fib(40) in worker');
  await fetch(base + '/quit');
} else if (!isMainThread) {
  parentPort.on('message', (n) => parentPort.postMessage(fib(n)));
} else {
  const h = monitorEventLoopDelay({ resolution: 10 });
  h.enable();
  const worker = new Worker(new URL(import.meta.url));
  const server = http.createServer((req, res) => {
    if (req.url === '/block') { res.end(String(fib(40))); return; }
    if (req.url === '/worker') { worker.once('message', (v) => res.end(String(v))); worker.postMessage(40); return; }
    if (req.url === '/stats') {
      res.end(`loop delay p50=${(h.percentile(50) / 1e6).toFixed(1)}ms p99=${(h.percentile(99) / 1e6).toFixed(1)}ms max=${(h.max / 1e6).toFixed(1)}ms`);
      h.reset(); return;
    }
    if (req.url === '/quit') { res.end('bye'); h.disable(); worker.terminate(); server.close(); return; }
    res.end('pong');
  });
  server.listen(0, () => {
    fork(new URL(import.meta.url), ['client', `http://127.0.0.1:${server.address().port}`]);
  });
}
```

**Run:** `node lab6_block.mjs`

**Real output:**

```text
idle /ping latency (ms):          7
idle                     loop delay p50=15.5ms p99=21.7ms max=21.7ms
/ping DURING fib(40) on loop (ms): 1288
fib(40) ON the loop      loop delay p50=1363.1ms p99=1363.1ms max=1363.1ms
/ping DURING fib(40) in worker(ms): 3
fib(40) in worker        loop delay p50=15.5ms p99=16.4ms max=16.5ms
```

**What you learned**

- A trivial `/ping` went from **7 ms to 1,288 ms** (about 180 times slower) because someone else's request was
  computing `fib(40)` on the main thread. The CPU work itself took about 1.3 s.
- The histogram agrees: max loop delay 1,363 ms versus about 16-22 ms idle. The idle floor is not 0 because the
  sampling timer has a 10 ms resolution and Windows timers are coarse.
- With the same computation in a worker thread, `/ping` took **3 ms** and loop delay stayed at idle level.
  The main thread only forwards a message.
- Alert on event-loop delay p99 (for example, more than 100 ms for 1 minute): it is the earliest signal that
  something CPU-bound or synchronous has crept into a request path.
- Typical real-world culprits: large `JSON.parse/stringify`, synchronous `crypto`/`bcryptSync`, catastrophic
  regex, big `Array.sort`, `fs.readFileSync` in a handler, and SQL result mapping for 100k rows.

**Frontend connection.** Identical to a React page with a 1.3 s synchronous loop in an event handler: the UI
freezes because the same single thread paints and runs JS. The cure is the same: a Web Worker.

**Common mistakes**

- Measuring latency from a client in the same process (the client is frozen too, so you see nothing wrong).
- "Fixing" blocking with `setImmediate` chunking when a worker or a different service is the right tool for
  heavy CPU.
- Spawning a new `Worker` per request (start-up costs tens of ms); use a pool (Week 2 / Day 3, Example 2).
- Thinking `async` functions make CPU work non-blocking. `async` only helps with waiting, not with computing.

**Interview answer:** "Node runs my JavaScript on one thread, so a long synchronous task delays every request.
I measured it: a trivial ping took 7 ms idle and 1,288 ms while another request ran fib(40) on the main thread,
and `monitorEventLoopDelay` showed a 1.36 s max delay. Running the same computation in a worker thread kept the
ping at 3 ms. I monitor event loop delay in production, keep CPU-heavy work in workers or separate services, and
avoid sync APIs in request paths."

**Follow-ups**

1. *Is a slow DB query blocking the loop?* No: waiting for I/O does not occupy the thread. A slow DB query holds
   a *connection*, not the loop. Processing a huge result set in JS does block it.
2. *Cluster vs worker threads?* Cluster/PM2 forks full processes to use more cores for request handling;
   worker threads offload CPU tasks inside one process.
3. *Why is p50 also 1.3 s?* There was only one sample during the block, so it is p50 of a tiny sample; read max and p99.

**Key concepts:** event loop delay, blocking, worker offload, histogram percentiles, measuring from outside the process.

**Revision questions**

1. Why must the probe client run in another process?
2. Name three operations that block the loop without looking slow.
3. What is the difference between event loop delay and request latency?
4. How would you alert on this in production?

**Practical task:** add a `/regex` route with a catastrophic regex (`/^(a+)+$/.test('a'.repeat(30) + 'b')`)
and watch the loop delay. Then add `/sortbig` that sorts 5 million numbers, and decide worker vs
chunking for each.

- [ ] I reproduced the 1+ second ping
- [ ] I can read a loop-delay histogram
- [ ] I know when to use a worker, a pool, or another service

---

## Lab 7 - "What happens when 10,000 users update the same record simultaneously?" `[ESSENTIAL]`

**Goal:** answer the roadmap's question with evidence instead of adjectives. This module has no new code: it
assembles Labs 1, 2, 5 and 6 into one answer you can say out loud.

**Follow the request through the stack** (assume an Express 5 API, mysql2 pool of 50, one MySQL primary):

1. **Load balancer / Node accept 10,000 requests fine.** Waiting is cheap in Node. Nothing blocks as long as the
   handler is async and does no CPU work (Lab 6).
2. **They queue in the connection pool.** Only 50 hold a connection; 9,950 wait inside the pool. If the wait
   exceeds `connectTimeout`/your request timeout, those users get errors even though the database was fine.
3. **At the database, all 50 aim at one row, so the row lock queue serialises them.** InnoDB lets exactly one
   X-lock holder proceed; the rest wait. Throughput for that row = `1 / (lock hold time)`. Measured (Lab 2):
   313 updates/s with the single atomic statement, 76/s with `FOR UPDATE`, 15/s when every commit paid two
   fsyncs.
4. **Correctness depends only on your code, not on MySQL.** Same traffic, same DB: the naive code ended with 2
   of 10,000 updates applied and returned 200 for all of them. The atomic UPDATE ended with exactly 10,000.
5. **Latency is a queue.** Little's law (C1): 10,000 requests in the system, 313 completing per second, so
   the last user waits `10,000 / 313 = 32 s`. That is what the run measured (31.9 s). Any client or proxy timeout
   under 32 s fails requests that the server will still go on to execute; the client retries and the update is
   applied twice unless the operation is idempotent (B3).
6. **Secondary failures appear:** `innodb_lock_wait_timeout` (50 s default) turns long waits into error 1205;
   deadlocks (errno 1213) appear if transactions touch more than one row; retries from the client create a
   retry storm (B3); one overloaded primary slows every other query that shares its CPU and buffer pool.

**What I would do about it, in order of cost**

| Step | Action | Effect |
|------|--------|--------|
| 1 | Make the update one atomic, conditional SQL statement; keep transactions short; no external calls inside them | correct and as fast as one row can go |
| 2 | Idempotency key on the request (unique constraint), so client retries do not double-apply | safe retries |
| 3 | Bound the wait: pool `queueLimit`, per-request timeout, 429/503 above a queue depth | fail fast instead of 30 s hangs (backpressure, B4) |
| 4 | Remove the hot row: shard the counter into N rows and SUM on read, or buffer in Redis `INCR` and flush in batches | N times the throughput, at the cost of read complexity or a small loss window |
| 5 | Serialise by design: put updates for the same key on one queue partition (Kafka key / BullMQ group), one consumer applies them in order | no lock contention at all, but eventual consistency for the user |

**Interview answer (60 seconds):** "It depends on how the update is written, and I can show it. With a
read-modify-write in the application, concurrent requests overwrite each other: in my test 10,000 concurrent
increments produced a final value of 2 with no errors. With an atomic UPDATE, MySQL serialises the writers on the
row lock and the answer is exactly 10,000, but throughput is capped by how long the lock is held, about 313
updates per second on my laptop, so the last user waits about 32 seconds; a bigger connection pool does not help.
Pessimistic locking is correct but slower, optimistic locking burns retries on a hot row. So the user-visible
problems are latency and timeouts, and the client's retries then cause duplicates unless I use idempotency keys.
I would use an atomic statement, bound the queue and return 429 above a depth, and if the row is genuinely hot,
shard the counter or serialise the writes through a queue."

**Revision questions**

1. Which two numbers let you predict how long the 10,000th user waits?
2. Why can a client timeout produce a duplicate update?
3. Why does sharding a counter help when more connections do not?

**Practical task:** write the 60-second answer in your own words, then answer the follow-up "what if it were a bank
balance with a constraint that it can never go below zero?" (atomic conditional UPDATE or `FOR UPDATE` in a
transaction plus a `CHECK` constraint; never read-then-write).

- [ ] I can narrate the request path from LB to row lock
- [ ] I can quote my own measured numbers
- [ ] I can list five mitigations in cost order

---
**PART B - DISTRIBUTED SYSTEMS**

Part A was about many things touching one piece of state. Part B is about **many machines, an unreliable
network, and no shared clock.** Three facts drive everything:

1. A message can be lost, delayed, duplicated or reordered.
2. A machine can crash at any instruction, and you cannot tell "slow" from "dead".
3. Clocks on different machines disagree.

For every topic below we answer the three questions the roadmap asks:
**the failure it prevents, the failure it introduces, the cost.** B8 collects all twelve in one table.

---

## B1 - CAP theorem and eventual consistency `[ESSENTIAL]`

**Goal:** be able to explain CAP without the cliche, and show what "choose AP" or "choose CP" does to a user.

**Concept.** In a replicated system, when the network **partitions** (some nodes cannot talk to others), you must
choose per operation:

- **Consistency (C):** every read sees the latest write (linearizable), so a node that cannot confirm it is
  up to date must **refuse** (error/timeout).
- **Availability (A):** every non-failing node answers, so nodes on both sides keep accepting writes and may
  **disagree**.

"Partition tolerance" is not an option you can drop: networks do partition. So the real choice is **C or A
during a partition**. When there is no partition, a well-built system can be both fast and consistent; the more
useful everyday trade is **latency vs consistency** (the PACELC idea: Else, choose Latency or Consistency).

**Demo** (`cap_sim.mjs`: three replicas, `R1` cut off from `R2,R3`, last-write-wins merge):

```js
// Three replicas, a network partition, and two policies: CP (refuse without majority) vs AP (always answer).
class Replica {
  constructor(name) { this.name = name; this.data = new Map(); }
  put(k, v, ts) { const cur = this.data.get(k); if (!cur || ts > cur.ts) this.data.set(k, { v, ts }); }   // last-write-wins by timestamp
  get(k) { return this.data.get(k)?.v ?? '(none)'; }
}
function cluster(mode) {
  const r = [new Replica('R1'), new Replica('R2'), new Replica('R3')];
  let clock = 0; let partitioned = false;           // partition: R1 alone | R2+R3 together
  const group = (node) => (!partitioned ? r : node.name === 'R1' ? [r[0]] : [r[1], r[2]]);
  return {
    r, partition() { partitioned = true; }, heal() {
      partitioned = false;                          // anti-entropy: everyone exchanges everything, LWW merges
      for (const a of r) for (const b of r) for (const [k, { v, ts }] of a.data) b.put(k, v, ts);
    },
    write(node, k, v) {
      const g = group(node);
      if (mode === 'CP' && g.length < 2) return 'REJECTED (no majority reachable)';
      const ts = ++clock; g.forEach((n) => n.put(k, v, ts)); return 'ok';
    },
    read(node, k) { return mode === 'CP' && group(node).length < 2 ? 'REJECTED(minority)' : node.get(k); },
  };
}
for (const mode of ['CP', 'AP']) {
  console.log(`== ${mode} cluster`);
  const c = cluster(mode);
  console.log('  write seat=free from R2 (healthy):', c.write(c.r[1], 'seat12A', 'free'));
  c.partition(); console.log('  --- PARTITION: R1 is cut off from R2,R3');
  console.log('  alice (talks to R1) books the seat   :', c.write(c.r[0], 'seat12A', 'alice'));
  console.log('  bob   (talks to R2) books the seat   :', c.write(c.r[1], 'seat12A', 'bob'));
  console.log(`  read at R1 -> ${c.read(c.r[0], 'seat12A')} | read at R3 -> ${c.read(c.r[2], 'seat12A')}`);
  c.heal(); console.log('  --- HEALED, replicas merge with last-write-wins');
  console.log(`  read at R1 -> ${c.read(c.r[0], 'seat12A')} | read at R3 -> ${c.read(c.r[2], 'seat12A')}`);
}
```

**Run:** `node cap_sim.mjs`

**Real output:**

```text
== CP cluster
  write seat=free from R2 (healthy): ok
  --- PARTITION: R1 is cut off from R2,R3
  alice (talks to R1) books the seat   : REJECTED (no majority reachable)
  bob   (talks to R2) books the seat   : ok
  read at R1 -> REJECTED(minority) | read at R3 -> bob
  --- HEALED, replicas merge with last-write-wins
  read at R1 -> bob | read at R3 -> bob
== AP cluster
  write seat=free from R2 (healthy): ok
  --- PARTITION: R1 is cut off from R2,R3
  alice (talks to R1) books the seat   : ok
  bob   (talks to R2) books the seat   : ok
  read at R1 -> alice | read at R3 -> bob
  --- HEALED, replicas merge with last-write-wins
  read at R1 -> bob | read at R3 -> bob
```

**What you learned**

- **CP:** Alice got an error (unavailable for her), but the data never diverged: only Bob owns the seat.
- **AP:** both Alice and Bob got "ok", the replicas disagreed during the partition, and after healing
  **last-write-wins silently threw Alice's booking away** even though she was told it succeeded. AP is only safe
  when the data tolerates merging (likes, carts, presence) or when you have a real conflict-resolution rule
  (CRDTs, version vectors, "keep both and ask the user").
- For a seat, a payment or a balance, you want CP: an error is better than two owners.

**Eventual consistency in everyday backend life.** You already use it: a MySQL read replica that lags by 200 ms,
a Redis cache that is stale until TTL, a search index fed from a queue, a CDN edge. The practical problem is
**read-your-writes**: the user saves a profile, the next page reads from a lagging replica and shows the old
value. Fixes (cheapest first): read from the primary for a few seconds after that user's write (sticky flag),
send the new value in the write response and let the UI use it, version/LSN tokens ("wait until replica has
caught up to my write"), or accept it and tell the user ("saved, updating shortly").

**Frontend connection.** Optimistic UI is eventual consistency on purpose: the screen shows the new value
immediately and reconciles when the server answers, rolling back on conflict.

**Failure prevented / introduced / cost**

| | |
|--|--|
| Prevents | one node (or a whole region) being a single point of failure for reads and writes |
| Introduces | stale reads, conflicting writes, anomalies that only appear under partition (hard to test) |
| Cost | extra design work: conflict resolution, monotonic reads, user-facing "pending" states |

**Common mistakes**

- "CAP says pick two of three": wrong framing; partition tolerance is not optional, and the choice only bites during a partition.
- Calling a single-node MySQL "CA". With one node there is no distribution problem, hence no CAP trade at all.
- Using last-write-wins with wall-clock timestamps from different machines (clock skew makes the "last" write arbitrary).
- Believing "eventual" means "soon enough for my feature" without ever measuring replica lag.

**Interview answer:** "CAP says that when a network partition happens a replicated store must either reject some
requests to stay consistent, or answer from both sides and risk divergence. I choose per use case: for money,
seats and uniqueness I want consistency and accept errors during a partition, usually through a quorum or a
single leader. For feeds, carts and counters I accept eventual consistency and design the merge. In normal
operation the trade is latency versus consistency, which is why read replicas and caches need a read-your-writes
strategy."

**Follow-ups**

1. *Is MySQL with async replicas CP or AP?* The primary is consistent for its own writes; reads from replicas are
   eventually consistent; on primary failure with async replication you can lose the last acknowledged writes
   (consistency loss). Semi-sync or group replication reduces that window at a latency cost.
2. *What is a quorum?* With N replicas, writes to W and reads from R nodes with `R + W > N` always overlap, so a
   read sees the latest write (N=3, W=2, R=2).
3. *Example of data safe for AP?* A like counter implemented as a CRDT G-counter: merge is addition per node,
   it converges without conflicts.

**Key concepts:** partition, C vs A, quorum, last-write-wins, read-your-writes, monotonic reads, CRDT.

**Revision questions**

1. Why is "CA" not a real option for a distributed system?
2. In the output above, who gets a wrong answer in the AP cluster and why?
3. Give a read-your-writes fix that needs no extra infrastructure.
4. What does `R + W > N` guarantee?

**Practical task:** change `cap_sim.mjs` so the merge keeps both values (a list of "siblings") instead of
last-write-wins, and print what a booking UI would have to do with two siblings.

- [ ] I can explain CAP in four sentences without saying "pick two"
- [ ] I ran the sim and can explain each line
- [ ] I can name two read-your-writes fixes

---

## B2 - Consensus and Raft, step by step, with a runnable election `[ADVANCED]`

**Goal:** understand what "consensus" is for, what problem Raft solves, and watch a leader election, a crash, a
partition and a recovery happen in a 100-line simulation. You will not implement production Raft; you will be
able to explain it.

**Concept.** *Consensus* = several machines agree on one value (or one ordered log of values) even though
some of them crash and messages get lost. Used for: leader election, cluster configuration, distributed locks
that must be correct, replicated state machines (etcd, Consul, ZooKeeper (a similar protocol, ZAB), CockroachDB,
Kafka KRaft). Without it, two nodes both believe they are the leader (**split brain**) and both accept writes.

**Raft in plain steps**

1. **Roles.** Every node is a *follower*, *candidate* or *leader*. There is at most one leader per **term**
   (a term is a logical clock number that only increases).
2. **Heartbeats.** The leader sends `AppendEntries` (empty = heartbeat) to all followers every ~50 ms.
3. **Election timeout.** A follower that hears nothing for a *randomised* 150-300 ms assumes the leader is dead,
   increments its term, becomes a **candidate**, votes for itself and sends `RequestVote` to everyone.
   Randomisation is what prevents everybody timing out together and splitting the votes forever.
4. **Voting rules.** Each node votes **once per term**, and only for a candidate whose log is at least as
   up-to-date as its own. A candidate with votes from a **majority** (3 of 5) becomes leader.
5. **Majority = safety.** Two different majorities of the same cluster always overlap in at least one node, so
   two leaders in the same term are impossible.
6. **Log replication.** Clients talk only to the leader. The leader appends the command to its log, sends it to
   followers, and when a **majority** has stored it, the entry is **committed**, applied, and the client is told OK.
7. **Stale leaders step down.** Any message with a higher term makes a node revert to follower. A leader cut off
   in a minority can still *append* entries but can never *commit* them.
8. **Healing.** When the partition ends, the old leader sees the higher term, steps down, and its uncommitted
   entries are overwritten by the new leader's log. Nothing that was acknowledged to a client is lost.

Why odd cluster sizes: 3 nodes tolerate 1 failure, 5 tolerate 2, 4 also only tolerates 1 (majority of 4 is 3), so
the 4th node costs money and buys nothing.

**Code** (`raft_sim.mjs`). A virtual clock and a seeded random generator make the output identical on every run.
It simulates only election and a tiny log replication. **It is not production Raft**: no persistence, no
log-matching repair, no membership change, no snapshots.

```js
// Tiny in-memory Raft: leader election + (very small) log replication.
// Virtual clock, seeded random -> same output every run. Not production Raft:
// no persistence, no log-matching repair, no membership changes, no snapshots.
let seed = 42;
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

class Net {
  now = 0; q = []; down = new Set(); cut = new Set();   // cut holds "a|b" pairs that cannot talk
  send(from, to, msg) {
    if (this.down.has(from) || this.down.has(to) || this.cut.has(`${from}|${to}`)) return;
    this.q.push({ at: this.now + 1 + Math.floor(rand() * 2), to, from, msg });   // 1-2 ms latency
  }
  partition(groupA, groupB) { for (const a of groupA) for (const b of groupB) { this.cut.add(`${a}|${b}`); this.cut.add(`${b}|${a}`); } }
  heal() { this.cut.clear(); }
}

class Node {
  constructor(id, peers, net) {
    Object.assign(this, { id, peers, net, term: 0, votedFor: null, state: 'follower', votes: new Set(), log: [], commit: 0, acks: new Map() });
    this.resetTimer();
  }
  resetTimer() { this.deadline = this.net.now + 150 + Math.floor(rand() * 150); }   // randomized 150-300ms
  majority() { return Math.floor((this.peers.length + 1) / 2) + 1; }
  say(s) { console.log(`t=${String(this.net.now).padStart(4)}ms  ${this.id} ${s}`); }

  becomeFollower(term) { if (term > this.term) { this.term = term; this.votedFor = null; } this.state = 'follower'; this.resetTimer(); }

  tick() {
    if (this.net.down.has(this.id)) return;
    if (this.state === 'leader') {
      if (this.net.now % 50 === 0) for (const p of this.peers) this.net.send(this.id, p, { type: 'append', term: this.term, log: this.log.slice(), commit: this.commit });
      return;
    }
    if (this.net.now >= this.deadline) {                       // no heartbeat -> start an election
      this.state = 'candidate'; this.term++; this.votedFor = this.id; this.votes = new Set([this.id]); this.resetTimer();
      this.say(`timeout -> CANDIDATE for term ${this.term}`);
      for (const p of this.peers) this.net.send(this.id, p, { type: 'vote?', term: this.term, lastLen: this.log.length });
    }
  }

  receive(from, m) {
    if (this.net.down.has(this.id)) return;
    if (m.term > this.term) { if (this.state !== 'follower') this.say(`sees higher term ${m.term} -> steps down`); this.becomeFollower(m.term); }
    if (m.type === 'vote?') {
      const ok = m.term >= this.term && (this.votedFor === null || this.votedFor === from) && m.lastLen >= this.log.length;
      if (ok) { this.votedFor = from; this.resetTimer(); }
      this.net.send(this.id, from, { type: 'vote!', term: this.term, granted: ok });
    } else if (m.type === 'vote!' && this.state === 'candidate' && m.term === this.term && m.granted) {
      this.votes.add(from);
      if (this.votes.size >= this.majority()) {
        this.state = 'leader'; this.say(`wins election with ${this.votes.size}/${this.peers.length + 1} votes -> LEADER of term ${this.term}`);
        for (const p of this.peers) this.net.send(this.id, p, { type: 'append', term: this.term, log: this.log.slice(), commit: this.commit });
      }
    } else if (m.type === 'append' && m.term >= this.term) {
      if (this.state !== 'follower') this.state = 'follower';
      this.resetTimer();
      this.log = m.log.slice(); this.commit = Math.max(this.commit, m.commit);
      this.net.send(this.id, from, { type: 'ack', term: this.term, len: this.log.length });
    } else if (m.type === 'ack' && this.state === 'leader') {
      this.acks.set(from, m.len);
      const replicated = [...this.acks.values()].filter((l) => l >= this.log.length).length + 1;   // +1 = leader itself
      if (this.log.length > this.commit && replicated >= this.majority()) { this.commit = this.log.length; this.say(`entry #${this.commit} COMMITTED (on ${replicated}/${this.peers.length + 1} nodes)`); }
    }
  }
  propose(cmd) { if (this.state === 'leader') { this.log.push({ term: this.term, cmd }); this.say(`appended "${cmd}" (uncommitted until a majority has it)`); } }
}

const ids = ['A', 'B', 'C', 'D', 'E'];
const net = new Net();
const nodes = Object.fromEntries(ids.map((id) => [id, new Node(id, ids.filter((x) => x !== id), net)]));
const leader = () => Object.values(nodes).filter((n) => n.state === 'leader' && !net.down.has(n.id)).sort((a, b) => b.term - a.term)[0];  // highest term wins

function runUntil(ms, label) {
  console.log(`--- ${label}`);
  const end = net.now + ms;
  while (net.now < end) {
    net.now++;
    const due = net.q.filter((e) => e.at <= net.now); net.q = net.q.filter((e) => e.at > net.now);
    for (const e of due) nodes[e.to].receive(e.from, e.msg);
    for (const n of Object.values(nodes)) n.tick();
  }
}

runUntil(700, 'phase 1: cold start, 5 followers, nobody is leader');
leader().propose('SET x=1'); runUntil(100, 'phase 2: replicate one entry');
const old = leader(); console.log(`--- phase 3: CRASH leader ${old.id}`); net.down.add(old.id);
runUntil(700, 'new election among the 4 survivors');
console.log(`--- phase 4: ${old.id} comes back (stale term ${old.term}) and must step down`); net.down.delete(old.id);
runUntil(300, 'old leader rejoins');
const L = leader(); const others = ids.filter((x) => x !== L.id);
console.log(`--- phase 5: partition leader ${L.id} + 1 follower (minority) from the other 3 (majority)`);
net.partition([L.id, others[0]], others.slice(1));
L.propose('SET y=2   (written to the MINORITY side)');
runUntil(900, 'majority side elects a new leader; minority leader cannot commit');
leader().propose('SET z=3   (written to the MAJORITY side)'); runUntil(200, 'new leader commits a fresh entry with its 3-node majority');
console.log('final states:', ids.map((i) => `${i}:${nodes[i].state}/t${nodes[i].term}/log${nodes[i].log.length}/commit${nodes[i].commit}`).join('  '));
net.heal(); runUntil(300, 'phase 6: heal partition, old minority leader steps down and its uncommitted entry is overwritten');
console.log('final states:', ids.map((i) => `${i}:${nodes[i].state}/t${nodes[i].term}/log${nodes[i].log.length}/commit${nodes[i].commit}`).join('  '));
```

**Run:** `node raft_sim.mjs`

**Real output:**

```text
--- phase 1: cold start, 5 followers, nobody is leader
t= 163ms  B timeout -> CANDIDATE for term 1
t= 166ms  B wins election with 3/5 votes -> LEADER of term 1
t= 700ms  B appended "SET x=1" (uncommitted until a majority has it)
--- phase 2: replicate one entry
t= 704ms  B entry #1 COMMITTED (on 3/5 nodes)
--- phase 3: CRASH leader B
--- new election among the 4 survivors
t=1015ms  A timeout -> CANDIDATE for term 2
t=1018ms  A wins election with 3/5 votes -> LEADER of term 2
--- phase 4: B comes back (stale term 1) and must step down
--- old leader rejoins
t=1552ms  B sees higher term 2 -> steps down
--- phase 5: partition leader A + 1 follower (minority) from the other 3 (majority)
t=1800ms  A appended "SET y=2   (written to the MINORITY side)" (uncommitted until a majority has it)
--- majority side elects a new leader; minority leader cannot commit
t=1994ms  D timeout -> CANDIDATE for term 3
t=1997ms  D wins election with 3/5 votes -> LEADER of term 3
t=2700ms  D appended "SET z=3   (written to the MAJORITY side)" (uncommitted until a majority has it)
--- new leader commits a fresh entry with its 3-node majority
t=2753ms  D entry #2 COMMITTED (on 3/5 nodes)
final states: A:leader/t2/log2/commit1  B:follower/t2/log2/commit1  C:follower/t3/log2/commit2  D:leader/t3/log2/commit2  E:follower/t3/log2/commit2
--- phase 6: heal partition, old minority leader steps down and its uncommitted entry is overwritten
t=2951ms  A sees higher term 3 -> steps down
final states: A:follower/t3/log2/commit2  B:follower/t3/log2/commit2  C:follower/t3/log2/commit2  D:leader/t3/log2/commit2  E:follower/t3/log2/commit2
```

**Reading the output**

- `t=163ms`: B's randomised timeout fired first; it asked for votes and won 3/5 within 3 ms. Term 1 begins.
- `t=704ms`: the entry `SET x=1` is committed only when it exists on 3 of 5 nodes (majority), not when the
  leader wrote it.
- Phase 3: B crashes. Nothing happens until some follower's election timeout expires (about 200 ms of
  unavailability here). **Leader failover is not instant: it costs one election timeout.** This is the price
  of consensus and the reason you tune timeouts against network latency.
- `A ... LEADER of term 2`: the survivors elected a new leader, the term went from 1 to 2.
- `t=1552ms B sees higher term 2 -> steps down`: the old leader had been *down*, still believing it was the leader.
  The first heartbeat from term 2 demoted it. That is how stale leaders are neutralised.
- Phase 5 (the important one): A is leader of term 2 with 1 follower, cut off from the other 3. A appends
  `SET y=2` but it is **never committed** (commit stays 1): it can reach only 2 of 5 nodes. The majority side
  elects D (term 3) and commits `SET z=3`. For a moment there are **two leaders, A (term 2) and D (term 3)**. This
  is allowed: A's is stale and harmless because it cannot commit. The `final states` line shows it:
  `A:leader/t2/commit1` and `D:leader/t3/commit2`.
- Phase 6: after healing, A sees term 3 and steps down; its uncommitted `y=2` is replaced by D's log. Every node
  ends with the same log and commit index 2. A client that was told "OK" for `x=1` and `z=3` lost nothing.
  A client talking to A during the partition never got an OK for `y=2`, and rightly so.

**What the simulation leaves out (do not pretend otherwise in an interview):** persisting `term`/`votedFor`/log
to disk before replying, log-matching repair when follower logs diverge, only committing entries from the
current term, membership changes, snapshots, and linearizable reads (reading from a stale leader is a real
bug unless the leader confirms it is still leader).

**Where you will actually meet it:** etcd (Kubernetes control plane), Consul, CockroachDB, TiKV, Kafka KRaft, Redis
Sentinel/Cluster use consensus-like election logic (Sentinel and Cluster use their own variants, not Raft). As an
application developer you **use** a consensus system (etcd, ZooKeeper, a managed lock service) rather than writing one.

**Frontend connection.** None directly; the closest idea is a collaborative editor deciding the order of edits
(OT/CRDT); consensus gives a single agreed order.

**Failure prevented / introduced / cost**

| | |
|--|--|
| Prevents | split brain (two nodes both acting as the leader), lost acknowledged writes on failover |
| Introduces | unavailability without a majority (a 3-node cluster with 2 down stops accepting writes), failover pause of one election timeout, leader as a throughput bottleneck |
| Cost | every write needs a majority round trip (latency = slowest of the fastest majority), odd node counts, 3x the machines, operational complexity |

**Common mistakes**

- Running a 2-node "cluster" (no majority is possible after one failure) or 4 nodes (same fault tolerance as 3).
- Spreading a 3-node cluster across 2 datacenters: losing the DC with 2 nodes loses quorum. Use 3 zones.
- Election timeout shorter than network jitter: constant spurious elections (a "flapping" leader).
- Treating "Raft" as a database feature checkbox rather than a latency/availability trade.

**Interview answer:** "Consensus lets a group of nodes agree on a single leader and an ordered log despite crashes
and message loss. In Raft, followers start an election when they miss heartbeats for a randomised timeout, a
candidate needs votes from a majority, and each node votes once per term, so at most one leader exists per term.
Writes are committed when a majority has stored them, so a new leader always has every committed entry. A leader
cut off from the majority cannot commit and steps down on seeing a higher term. The cost is a majority round
trip per write, a short pause on failover, and no progress without a quorum. I would use etcd or ZooKeeper for
coordination rather than implement it."

**Follow-ups**

1. *Raft vs Paxos?* Same guarantees; Raft was designed to be understandable (strong leader, clear log
   replication), Paxos is the older, harder-to-implement family.
2. *Why randomised timeouts?* To avoid simultaneous candidates splitting the vote repeatedly.
3. *Can a Raft cluster have two leaders?* In different terms, briefly (as in the output), yes; in the same term, never.
   Only the current-term leader can commit.
4. *What about Byzantine failures (lying nodes)?* Raft assumes crash faults only; Byzantine tolerance needs
   PBFT-style protocols (3f+1 nodes).

**Key concepts:** term, majority/quorum, election timeout, heartbeat, committed entry, split brain, stale leader.

**Revision questions**

1. Why does a majority guarantee no two leaders in one term?
2. How long is the unavailability window after a leader crash, roughly?
3. What stops the minority leader's `SET y=2` from being committed?
4. Why is a 4-node cluster no better than 3?
5. What does a voter check about the candidate's log, and why?

**Practical task:** change `ids` to 3 nodes, crash the leader and one follower, and show that the survivor can
never become leader. My run: node C printed `CANDIDATE for term 2`, then 3, 4 and 5 at t=795, 973, 1253 and
1490 ms and ended as `candidate/term 5` without ever winning, because it can never collect 2 votes out of 3.
Explain why refusing to make progress is the correct behavior (the alternative is split brain).

- [ ] I can narrate the 8 Raft steps without notes
- [ ] I ran the sim and can explain phases 3 to 6
- [ ] I can list what the sim leaves out

---
## B3 - Idempotency, retries, timeouts and retry storms `[ESSENTIAL]`

**Goal:** see a duplicate charge happen, fix it with an idempotency key, and see how naive retries turn a
5-second outage into a long one. (Basics of backoff and idempotency: Week 6 / Day 3 notes; payment workflow
design: Week 7 / Day 4 notes. This module is the experiment.)

**Concept.**

- **Timeout:** the maximum you will wait. Without one, a hung dependency holds your sockets, memory and
  connection-pool slots forever. Every network call needs one.
- **Retry:** try again after a failure. Only valid if the failure may be transient **and** repeating the call
  is safe.
- **Idempotency:** doing the operation N times has the same effect as doing it once. `PUT /users/7 {name}` is
  naturally idempotent; `POST /payments` is not, so we give it an **idempotency key**: the client generates a
  unique key per logical operation, the server stores `key -> response` and, on a repeat, returns the stored
  response without redoing the side effect.
- The core problem: **a timeout does not tell you whether the server did the work.** The request may have been
  lost, or processed with the response lost. Both look the same to the client. So after a timeout, retrying a
  non-idempotent call is a coin flip between "paid twice" and "never paid".
- **Retry storm:** when a dependency is struggling, every client retries, multiplying the load by the retry
  count; the dependency then stays down because of the retries themselves (a **metastable failure**).

**Code** (`idem_retry.mjs`):

```js
import http from 'node:http';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ================= Part 1: idempotency. Client times out, retries, server already did the work =================
let charges = [];
const idemStore = new Map();   // key -> stored response (in prod: DB unique constraint / Redis SET NX)

const server = http.createServer(async (req, res) => {
  const key = req.headers['idempotency-key'];
  if (key && idemStore.has(key)) {                           // replay: return the SAME answer, do no new work
    res.setHeader('Idempotent-Replay', 'true');
    return res.end(JSON.stringify(idemStore.get(key)));
  }
  charges.push({ amount: 500, key: key ?? null });           // the side effect (money moves)
  const result = { chargeId: 'ch_' + charges.length, amount: 500 };
  if (key) idemStore.set(key, result);
  await sleep(300);                                          // slow response -> client times out first
  res.end(JSON.stringify(result));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

async function payWithRetry(headers) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(base + '/pay', { method: 'POST', headers, signal: AbortSignal.timeout(100) });   // 100ms timeout
      return await r.json();
    } catch { /* timeout: we do NOT know whether the server processed it -> retry */ }
  }
  return null;
}

console.log('== Part 1: idempotency (client timeout 100ms, server takes 300ms, client retries up to 3 times)');
charges = [];
await payWithRetry({});
await sleep(400);
console.log(`   WITHOUT Idempotency-Key: 1 logical payment -> ${charges.length} charges recorded, total ${charges.length * 500}`);
charges = [];
await payWithRetry({ 'Idempotency-Key': 'order-42-attempt-1' });
await sleep(400);
console.log(`   WITH    Idempotency-Key: 1 logical payment -> ${charges.length} charge recorded, total ${charges.length * 500}`);
server.close(); server.closeAllConnections();

// ================= Part 2: retry storm (discrete-time simulation, 1 tick = 100ms) =================
// Server capacity: 10 requests/tick. Normal offered load: 8 new requests/tick. Outage: ticks 20-24 (capacity 0).
// A request that is not served in its tick "fails" (timeout). Policies decide when failed requests come back.
function simulate(policy) {
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const TICKS = 80, CAP = 10, NEW = 8;
  const pending = new Map();                  // tick -> [{attempt}]
  let totalSent = 0, ok = 0, gaveUp = 0; const timeline = [];
  let budget = 0;                             // retry budget: retries allowed = 10% of first attempts
  for (let t = 0; t < TICKS; t++) {
    const batch = (pending.get(t) ?? []).concat(Array.from({ length: NEW }, () => ({ attempt: 1 })));
    pending.delete(t);
    budget += NEW * 0.1;
    const capacity = t >= 20 && t < 25 ? 0 : CAP;
    // overloaded servers waste work: when offered load > capacity, goodput drops (queueing/timeouts) to 60%
    const effective = batch.length > capacity ? Math.floor(capacity * 0.6) : capacity;
    totalSent += batch.length;
    batch.sort(() => rnd() - 0.5);
    const served = batch.slice(0, effective), failed = batch.slice(effective);
    ok += served.length;
    for (const req of failed) {
      const a = req.attempt;
      if (a >= 4) { gaveUp++; continue; }
      let delay;
      if (policy === 'naive') delay = 1;                                          // retry next tick, immediately
      else delay = 1 + Math.floor(rnd() * Math.min(40, 2 ** a * 2));              // exponential backoff + FULL jitter
      if (policy === 'backoff+budget') { if (budget < 1) { gaveUp++; continue; } budget -= 1; }   // retry budget
      const at = t + delay; if (!pending.has(at)) pending.set(at, []); pending.get(at).push({ attempt: a + 1 });
    }
    timeline.push(batch.length);
  }
  return { totalSent, ok, gaveUp, peakOffered: Math.max(...timeline), offeredAfterRecovery: timeline.slice(30, 45).join(' ') };
}
console.log('\n== Part 2: retry storm simulation (capacity 10/tick, normal load 8/tick, outage on ticks 20-24)');
for (const p of ['naive', 'backoff+jitter', 'backoff+budget']) {
  const r = simulate(p);
  console.log(`   ${p.padEnd(15)} sent=${String(r.totalSent).padStart(4)} succeeded=${String(r.ok).padStart(3)} gaveUp=${String(r.gaveUp).padStart(3)} peak offered/tick=${String(r.peakOffered).padStart(3)}  offered ticks 30-44: ${r.offeredAfterRecovery}`);
}
```

**Run:** `node idem_retry.mjs`

**Real output:**

```text
== Part 1: idempotency (client timeout 100ms, server takes 300ms, client retries up to 3 times)
   WITHOUT Idempotency-Key: 1 logical payment -> 3 charges recorded, total 1500
   WITH    Idempotency-Key: 1 logical payment -> 1 charge recorded, total 500

== Part 2: retry storm simulation (capacity 10/tick, normal load 8/tick, outage on ticks 20-24)
   naive           sent=1450 succeeded=490 gaveUp=136 peak offered/tick= 32  offered ticks 30-44: 20 21 23 21 22 20 19 20 22 20 20 20 20 21 22
   backoff+jitter  sent=1330 succeeded=490 gaveUp= 91 peak offered/tick= 26  offered ticks 30-44: 20 23 23 18 18 19 16 14 19 25 20 18 19 17 18
   backoff+budget  sent= 660 succeeded=600 gaveUp= 40 peak offered/tick= 13  offered ticks 30-44: 8 8 9 8 8 8 8 8 8 8 8 8 8 8 8
```

**What you learned**

- **Part 1:** one logical payment became **3 real charges (Rs. 1,500 instead of Rs. 500)** because the client
  timed out three times while the server was in fact succeeding. With the `Idempotency-Key` header the first
  request creates the charge and the 2nd/3rd are recognised as replays: 1 charge. (Real implementations
  insert the key with a UNIQUE constraint *before* doing the work, store the response after, and handle the
  "same key, request still in progress" case with 409 or by waiting. Note the toy server here is only safe
  because Node processes the check and the store synchronously with no `await` in between; see Lab 1.)
- **Part 2 (a toy model, not a benchmark):** a 5-tick outage with normal load 8/tick and capacity 10/tick.
  - **Naive** immediate retry: after the outage ends the offered load stays at about 20/tick, double the
    capacity, for the whole rest of the 80-tick run (I printed ticks 25-79 once: it never came back down to 8): the system **cannot recover by itself**
    although the original trigger is gone. That is a metastable failure. Only 490 requests succeeded.
  - **Backoff + jitter** spreads retries out, peak offered drops from 32 to 26, but in this toy model the load
    after recovery is still above capacity (about 14-25/tick): backoff alone is not enough when every client retries.
  - **Backoff + jitter + retry budget** (a client may retry only if retries are less than 10% of its first
    attempts) keeps offered load at about 8/tick right after the outage: 600 successes and 40 given up, and
    only 660 requests sent in total versus 1,450 for the naive policy.
  - The 60% "goodput under overload" factor is my assumption to mimic queueing and timeout waste. Change it
    and the numbers change; the *shape* (retries amplify, budgets cap) is the point.

**The retry checklist**

1. Retry only **transient** errors (timeouts, connection reset, 429, 502/503/504), never 400/401/403/404/409/422.
2. Retry only **idempotent** operations, or operations carrying an idempotency key.
3. **Exponential backoff with full jitter:** `sleep = random(0, min(cap, base * 2^attempt))`. Without jitter,
   all clients retry in lockstep (thundering herd).
4. Cap attempts (2-3) and total time; respect `Retry-After`.
5. **Retry at one layer only.** If the browser, the API gateway and the service each retry 3 times, one user
   click can become 27 calls to the database.
6. Use a **retry budget** (a token bucket of retries as a fraction of traffic) so retries cannot exceed about
   10% extra load.
7. Make the **deadline** travel with the request (a remaining-time header), so a downstream service does not
   keep working on a request whose caller already gave up.

**Timeout values:** set client timeout slightly above the server's p99 for that call (not above the user's
patience), and shorter than your own caller's timeout: timeouts must **decrease** as you go deeper in the chain
(browser 30 s > API 10 s > service 3 s > DB 1 s), otherwise inner calls outlive the callers waiting for them.

**Frontend connection.** `fetch` has no default timeout: use `AbortSignal.timeout`. React Query retries failed
queries 3 times with exponential backoff by default, but you should set `retry: false` for mutations unless
they carry an idempotency key.

**Failure prevented / introduced / cost**

| | Idempotency key | Retry + backoff | Timeout |
|--|----|----|----|
| Prevents | duplicate side effects from repeats | transient failures becoming user errors | one slow dependency exhausting your threads/sockets/pool |
| Introduces | key storage and expiry, "in-progress" edge cases, same key with a different body | retry storms, duplicate work, extra latency | false failures (the work still completes), ambiguity ("did it happen?") |
| Cost | one extra DB write/lookup per request, a table to clean up | tail latency, extra load, harder debugging | picking the right numbers per call |

**Common mistakes**

- Retrying `POST /charge` after a timeout with no key.
- Generating a **new** idempotency key on each retry (defeats the purpose): the key belongs to the logical
  operation, created once, before the first attempt.
- Keys that are not scoped per user, or that expire before the client stops retrying.
- Retry loops with a fixed sleep and no jitter, or retry-forever loops.
- Retrying inside every layer (multiplicative amplification).

**Interview answer:** "A timeout means 'I do not know', not 'it failed', so retrying a non-idempotent call can
duplicate its effect. I give such requests an idempotency key chosen once by the client, store key plus
response with a unique constraint so repeats return the original result, and retry only transient errors, with
exponential backoff, full jitter, a small attempt cap and ideally a retry budget. I retry at one layer only.
Otherwise retries multiply load during an outage and keep the dependency down after the original problem is
gone. I demonstrated this with a payment that was charged 3 times without a key and once with it."

**Follow-ups**

1. *Where do you store idempotency keys?* In the primary DB with a UNIQUE `(user_id, key)` in the same
   transaction as the side effect when possible; Redis `SET key NX EX` for short-lived dedupe (weaker: Redis
   can lose data).
2. *How long do you keep them?* Longer than the client's maximum retry window (Stripe: 24 hours).
3. *What if the same key arrives with a different body?* Reject with 422/409; it is a client bug.
4. *What does the server return while the first request is still running?* 409 Conflict (or block briefly)
   so the retry does not start a second execution.
5. *Is GET idempotent? PUT? DELETE?* Yes (safe/idempotent by definition); POST is not; PATCH depends.

**Key concepts:** idempotency key, at-least-once vs exactly-once (effectively-once = at-least-once + idempotent
consumer), backoff, jitter, retry budget, metastable failure, deadline propagation.

**Revision questions**

1. Why can't the client know whether a timed-out payment succeeded?
2. Write the formula for exponential backoff with full jitter.
3. Why do timeouts have to shrink as you go deeper?
4. What does a retry budget bound?
5. Which status codes would you never retry?

**Practical task:** extend Part 1's server so it handles "same key arrives while the first is in flight" (return
409 with `Retry-After: 1`), and add the unique-constraint version using a MySQL table
`idempotency_keys(key VARCHAR(64) PRIMARY KEY, response JSON)` with `INSERT ... ON DUPLICATE KEY` semantics.

- [ ] I reproduced the 3x charge and the 1x charge
- [ ] I can explain why the key must be created before the first attempt
- [ ] I can list the 7 items of the retry checklist

---

## B4 - Circuit breakers and backpressure `[ESSENTIAL]`

**Goal:** stop one sick dependency from taking your whole service down, and stop a fast producer from
drowning a slow consumer.

### Circuit breaker

**Concept.** A circuit breaker wraps a call to a dependency and tracks failures. **Closed** = calls flow
normally. After N consecutive failures it **opens**: calls fail immediately (no network, no waiting) for a cool-down
time. Then it goes **half-open**: it lets one probe through; success closes it, failure re-opens it.

Why it matters: when a dependency hangs, each call burns a timeout (seconds) and holds a socket, a pool slot
and memory. Your own latency and resource use explode and **your** service goes down too (cascading failure).
Failing fast keeps you alive and gives the dependency room to recover.

**Code** (`breaker_bp.mjs`, first half). The dependency is "down" for the first 7 calls (each burns 200 ms
before failing) and healthy from call 8:

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CircuitBreaker {
  state = 'CLOSED'; failures = 0; openedAt = 0;
  constructor({ failureThreshold = 3, resetMs = 300 } = {}) { Object.assign(this, { failureThreshold, resetMs }); }
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt < this.resetMs) throw new Error('circuit open: failing fast');
      this.state = 'HALF_OPEN';                                   // let exactly one probe through
    }
    try {
      const r = await fn();
      this.failures = 0; this.state = 'CLOSED'; return r;
    } catch (e) {
      this.failures++;
      if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) { this.state = 'OPEN'; this.openedAt = Date.now(); }
      throw e;
    }
  }
}

let dependencyUp = false, realCalls = 0;
async function dependency() { realCalls++; if (!dependencyUp) { await sleep(200); throw new Error('dependency timeout'); } await sleep(20); return 'ok'; }

console.log('== Circuit breaker: dependency is down; a failing call burns 200ms (timeout), a good call takes 20ms');
async function runCalls(label, useBreaker) {
  const cb = new CircuitBreaker({ failureThreshold: 3, resetMs: 300 });
  realCalls = 0; dependencyUp = false;
  const t0 = Date.now(); const outcomes = {};
  for (let i = 1; i <= 30; i++) {
    if (i === 8) dependencyUp = true;                               // dependency heals at call 8
    try { await (useBreaker ? cb.call(dependency) : dependency()); outcomes.ok = (outcomes.ok ?? 0) + 1; }
    catch (e) { const k = e.message.startsWith('circuit') ? 'failedFast' : 'failedSlow'; outcomes[k] = (outcomes[k] ?? 0) + 1; }
    await sleep(40);
  }
  console.log(`   ${label.padEnd(15)} real calls to dependency=${String(realCalls).padStart(2)}  outcomes=${JSON.stringify(outcomes)}  total time=${Date.now() - t0}ms`);
}
await runCalls('no breaker', false);
await runCalls('with breaker', true);
```

**Real output:**

```text
== Circuit breaker: dependency is down; a failing call burns 200ms (timeout), a good call takes 20ms
   no breaker      real calls to dependency=30  outcomes={"failedSlow":7,"ok":23}  total time=3814ms
   with breaker    real calls to dependency=25  outcomes={"failedSlow":3,"failedFast":5,"ok":22}  total time=2785ms
```

**What you learned**

- Without the breaker all 7 calls during the outage were real 200 ms timeouts. With it, after 3 failures the
  breaker opened and the next 5 calls **failed in microseconds**, sending 5 fewer calls to the sick dependency
  and finishing the whole run about 1 second sooner.
- The price: 5 requests were rejected that *would have succeeded a bit later* (here the dependency healed at
  call 8, but the circuit stayed open for its 300 ms cool-down; `ok` is 22 versus 23). You trade a little
  availability right after recovery for protection during the outage. Tune `resetMs`.
- Timings come from real timers, so they vary by tens of ms per run; the call counts are stable.

Things the toy omits: a rolling failure-rate window (not just consecutive failures), a minimum request volume,
only counting real dependency errors (not 4xx), a limit of concurrent half-open probes, and per-dependency (not
global) breakers. In production use a library (`opossum` for Node) and **emit metrics on state changes**.
What to do while open: return a cached or default value, degrade the feature, queue the work, or return 503
with `Retry-After`.

**Other isolation tools** that pair with it: **timeouts** (every call), **bulkheads** (separate pools/semaphores
per dependency, so one slow dependency cannot use all connections: Lab 5's semaphore is a bulkhead), and **load shedding**.

### Backpressure

**Concept.** When a producer is faster than a consumer, something has to give. Options: let the queue grow
(until memory dies), **reject** new work (429/503: shed load), or **slow the producer down** (block/await/pause).
Backpressure means the consumer's limit propagates upstream so the system degrades predictably. Node streams
do this with `highWaterMark` and `write()` returning `false` (Week 2 / Day 5 notes). Same idea in HTTP (429),
queues (bounded length, `maxQueue` in Lab 4), TCP (receive window).

**Code** (`breaker_bp.mjs`, second half; virtual time so the result is deterministic):

```js
// Backpressure (virtual time: 1 tick = 10ms, so 200 ticks = 2 seconds)
console.log('\n== Backpressure: producer wants 1000 msg/s (10/tick), consumer handles 200 msg/s (2/tick), 2 seconds');
function bp(policy) {
  const MAX = 100; const queue = []; let wanted = 0, accepted = 0, consumed = 0, rejected = 0, maxLen = 0, stalled = 0;
  for (let tick = 0; tick < 200; tick++) {
    for (let i = 0; i < 10; i++) {
      wanted++;
      if (policy === 'unbounded') { queue.push(1); accepted++; }
      else if (queue.length >= MAX) { if (policy === 'reject (429)') rejected++; else stalled++; }   // block = producer is made to wait
      else { queue.push(1); accepted++; }
    }
    for (let i = 0; i < 2 && queue.length; i++) { queue.shift(); consumed++; }
    maxLen = Math.max(maxLen, queue.length);
  }
  console.log(`   ${policy.padEnd(13)} wanted=${wanted} accepted=${String(accepted).padStart(4)} consumed=${consumed} rejected=${String(rejected).padStart(4)} producer-stalled=${String(stalled).padStart(4)} queue at end=${String(queue.length).padStart(4)} (max ${maxLen})`);
}
bp('unbounded'); bp('reject (429)'); bp('block');
```

**Real output:**

```text
== Backpressure: producer wants 1000 msg/s (10/tick), consumer handles 200 msg/s (2/tick), 2 seconds
   unbounded     wanted=2000 accepted=2000 consumed=400 rejected=   0 producer-stalled=   0 queue at end=1600 (max 1600)
   reject (429)  wanted=2000 accepted= 498 consumed=400 rejected=1502 producer-stalled=   0 queue at end=  98 (max 98)
   block         wanted=2000 accepted= 498 consumed=400 rejected=   0 producer-stalled=1502 queue at end=  98 (max 98)
```

**What you learned**

- Unbounded: 2,000 accepted, only 400 processed, **1,600 messages waiting** after 2 s; the queue grows by 800 per
  second for ever. A message arriving now waits `1600 / 200 = 8 s` (Little's law) and memory grows until the
  process dies. This is the typical "it ran fine for 3 hours and then OOM-killed" outage.
- Bounded + reject: the queue stays at 100 (latency bounded at `100 / 200 = 0.5 s`), and excess load is
  rejected immediately and visibly.
- Bounded + block: nothing is lost, the producer is slowed to the consumer's speed. It only works when the
  producer *can* wait (an internal job, a stream, a message consumer). A public HTTP client cannot be made to
  wait forever, so edge services reject.
- Backpressure does not make you faster. It makes overload **explicit and bounded**.
  The real fix for a persistent gap is more consumer capacity.

**Frontend connection.** Debounce/throttle on input, virtualised lists and `AbortController` are all
frontend-side backpressure; a 429 with `Retry-After` is the server's backpressure signal your client must honour.

**Failure prevented / introduced / cost**

| | Circuit breaker | Backpressure / load shedding |
|--|----|----|
| Prevents | cascading failure; threads/sockets stuck on a dead dependency | unbounded queues, OOM, unbounded latency |
| Introduces | rejected requests that could have succeeded, flapping, hidden state to monitor | rejected or delayed work the caller must handle (retry/UX) |
| Cost | a state machine per dependency, tuning, fallback logic | capacity planning for queue sizes, client changes to handle 429 |

**Common mistakes**

- Breaker counting 4xx (client errors) as dependency failures.
- One global breaker for several unrelated dependencies.
- Queues with no maximum (the default for most in-memory arrays and many libraries).
- Shedding load *after* doing the expensive work instead of at the front door.
- Retrying 429/503 immediately, ignoring `Retry-After`.

**Interview answer:** "A circuit breaker counts failures to a dependency and, past a threshold, fails calls
immediately for a cool-down instead of waiting for timeouts; then it probes with half-open before closing. It stops
a slow dependency from consuming my threads, sockets and pool slots and cascading. Backpressure is the other
half: bounded queues and explicit rejection so a slow consumer pushes back on a fast producer instead of letting
memory and latency grow. In my demo an unbounded queue was 1,600 messages behind after 2 seconds (an 8-second wait
for the next message) while the bounded queue stayed at 100 messages and a 0.5 second wait."

**Follow-ups**

1. *Breaker vs retry?* Retries help transient blips; a breaker protects against sustained failure. Use both:
   retries inside the breaker, never retries that bypass it.
2. *Where do you shed load?* At the edge (gateway/rate limit), then per-service concurrency limits, then
   per-dependency bulkheads; prefer rejecting cheap-to-serve low-priority traffic first.
3. *How do you pick the queue size?* Latency budget: `max queue = acceptable wait x consumer throughput`
   (0.5 s x 200/s = 100).

**Key concepts:** closed/open/half-open, cascading failure, bulkhead, load shedding, bounded queue, 429/503, `Retry-After`.

**Revision questions**

1. What are the three breaker states and their transitions?
2. Why is an unbounded queue not "safe"?
3. How does queue size translate into latency?
4. Which is better at the public edge, block or reject, and why?

**Practical task:** wrap the Lab 4 pool call to an HTTP API with the breaker plus a 1 s timeout; when the
breaker is open, return a cached value from the last success and add a `stale: true` flag.

- [ ] I can draw the breaker state machine
- [ ] I can compute the wait time of a queue from its length and service rate
- [ ] I can say where a bulkhead would go in the Task API

---
## B5 - Distributed locks with Redis: `SET NX PX`, tokens, fencing, and why Redlock is contested `[ESSENTIAL]`

**Goal:** build the standard Redis lock, break it on purpose with a paused holder, fix it with a token, and then
see why even the fixed lock is not enough without a **fencing token**.

**Concept.** Lab 5's mutex only works inside one process. When 5 instances of your API (or a cron job on 3
servers) must not do the same thing at the same time (generate the same invoice, run the same migration,
refund the same payment), you need a lock that lives *outside* the processes: Redis, a DB row, etcd or ZooKeeper.

The Redis recipe:

- **Acquire:** `SET lock:invoice:42 <random-token> NX PX 30000`. `NX` = only if the key does not exist; `PX` =
  expire in 30,000 ms. It is one atomic command; the **expiry (lease)** exists because a crashed holder
  cannot release the lock: without a TTL a crash is a permanent outage.
- **Release:** only if the stored value is still **my** token: compare-and-delete in a Lua script (a plain
  `DEL` can delete someone else's lock).
- **Never** `SETNX` followed by a separate `EXPIRE`: a crash between the two leaves a lock that never expires.

**Code** (`redis_lock.mjs`; needs the Redis container on port 63795):

```js
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

const redis = new Redis({ host: '127.0.0.1', port: 63795 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KEY = 'lock:invoice:42';

// ---------- the lock primitives ----------
async function acquire(key, ttlMs) {
  const token = randomUUID();                                   // proves WHO owns it
  const ok = await redis.set(key, token, 'PX', ttlMs, 'NX');   // atomic: set only if absent + expiry
  return ok === 'OK' ? token : null;
}
const UNLOCK_LUA = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;
const safeRelease = (key, token) => redis.eval(UNLOCK_LUA, 1, key, token);   // compare-and-delete, atomic
const unsafeRelease = (key) => redis.del(key);                                // WRONG: deletes whoever owns it now

// ---------- demo 1: mutual exclusion works while everyone is healthy ----------
async function demo1() {
  console.log('== demo 1: 5 workers, one lock, critical section = read-modify-write on a Redis key');
  await redis.set('shared:n', 0);
  let inside = 0, maxInside = 0;
  const worker = async (id) => {
    for (let i = 0; i < 4; i++) {
      let token;
      while (!(token = await acquire(KEY, 2000))) await sleep(5 + Math.random() * 10);   // spin with jitter
      inside++; maxInside = Math.max(maxInside, inside);
      const v = Number(await redis.get('shared:n')); await sleep(5); await redis.set('shared:n', v + 1);
      inside--;
      await safeRelease(KEY, token);
    }
  };
  await Promise.all([1, 2, 3, 4, 5].map(worker));
  console.log(`   final shared:n = ${await redis.get('shared:n')} (expected 20), max workers inside at once = ${maxInside}`);
}

// ---------- demo 2: lock expires while holder is paused; unsafe DEL breaks the next owner ----------
async function demo2(useSafe) {
  console.log(`== demo 2${useSafe ? 'b (token + Lua release)' : 'a (plain DEL release)'}`);
  await redis.del(KEY);
  const tokenA = await acquire(KEY, 300);
  console.log('   A acquired lock (TTL 300ms), then A "pauses" 500ms (GC pause / slow network call)');
  await sleep(500);                                              // lock expires underneath A
  const tokenB = await acquire(KEY, 5000);
  console.log(`   B acquired lock after expiry: ${tokenB ? 'yes' : 'no'}`);
  const r = useSafe ? await safeRelease(KEY, tokenA) : await unsafeRelease(KEY);
  console.log(`   A wakes up and releases -> redis replied ${r}; key still held by B? ${(await redis.get(KEY)) === tokenB}`);
  const tokenC = await acquire(KEY, 5000);
  console.log(`   C tries to acquire while B is still working: ${tokenC ? 'GOT IT (B and C both think they own the lock!)' : 'refused (correct)'}`);
  await redis.del(KEY);
}

// ---------- demo 3: fencing token. The resource itself rejects stale writers ----------
async function demo3() {
  console.log('== demo 3: fencing tokens (the real fix for paused lock holders)');
  await redis.del('fence:counter', 'resource:value', 'resource:lastFence', KEY);
  // the lock service hands out a monotonically increasing number with every grant
  async function acquireFenced(ttl) {
    const token = await acquire(KEY, ttl);
    if (!token) return null;
    return { token, fence: await redis.incr('fence:counter') };
  }
  // the protected resource remembers the highest fence it has seen and refuses anything older (atomic in Lua)
  const WRITE_LUA = `local last = tonumber(redis.call('get', KEYS[2]) or '0')
    if tonumber(ARGV[1]) < last then return 0 end
    redis.call('set', KEYS[2], ARGV[1]); redis.call('set', KEYS[1], ARGV[2]); return 1`;
  const write = (fence, value) => redis.eval(WRITE_LUA, 2, 'resource:value', 'resource:lastFence', fence, value);

  const A = await acquireFenced(300);
  console.log(`   A got lock with fence ${A.fence}, then pauses 500ms`);
  await sleep(500);
  const B = await acquireFenced(5000);
  console.log(`   B got lock with fence ${B.fence}`);
  console.log(`   B writes "from-B" -> accepted? ${await write(B.fence, 'from-B') === 1}`);
  console.log(`   A wakes up (still believes it holds the lock) writes "from-A" -> accepted? ${await write(A.fence, 'from-A') === 1}`);
  console.log(`   resource value = ${await redis.get('resource:value')}`);
  await redis.del(KEY);
}

await demo1();
await demo2(false);
await demo2(true);
await demo3();
redis.disconnect();
```

**Run:** `node redis_lock.mjs`

**Real output:**

```text
== demo 1: 5 workers, one lock, critical section = read-modify-write on a Redis key
   final shared:n = 20 (expected 20), max workers inside at once = 1
== demo 2a (plain DEL release)
   A acquired lock (TTL 300ms), then A "pauses" 500ms (GC pause / slow network call)
   B acquired lock after expiry: yes
   A wakes up and releases -> redis replied 1; key still held by B? false
   C tries to acquire while B is still working: GOT IT (B and C both think they own the lock!)
== demo 2b (token + Lua release)
   A acquired lock (TTL 300ms), then A "pauses" 500ms (GC pause / slow network call)
   B acquired lock after expiry: yes
   A wakes up and releases -> redis replied 0; key still held by B? true
   C tries to acquire while B is still working: refused (correct)
== demo 3: fencing tokens (the real fix for paused lock holders)
   A got lock with fence 1, then pauses 500ms
   B got lock with fence 2
   B writes "from-B" -> accepted? true
   A wakes up (still believes it holds the lock) writes "from-A" -> accepted? false
   resource value = from-B
```

**What you learned**

1. **Demo 1:** with a healthy lock, 5 workers x 4 increments = exactly 20 and never more than 1 worker inside.
   `SET NX PX` gives mutual exclusion in the normal case.
2. **Demo 2a:** the lease expired while A was paused. B legitimately took the lock. A then woke up and ran
   `DEL`, which **removed B's lock**; C immediately got in. B and C now both think they own the lock. A naive
   unlock is a classic production bug.
3. **Demo 2b:** the token + Lua compare-and-delete returned 0 for A (not the owner), B's lock survived, C was
   refused. Fixed.
4. **But look at what 2b did not fix:** A is *still running its critical section* believing it has the lock
   for as long as its pause lasted. Between "my lease expired" and "I noticed", A may write to the database.
   That is why a lock alone can never guarantee safety. **Demo 3:** each grant gets a monotonically increasing
   **fencing token** (`INCR`); the *protected resource* remembers the highest token it has accepted and rejects
   older ones. A (token 1) is refused after B (token 2) has written. The safety property now lives in the
   resource, not in the lock's timing. In MySQL the same thing is `UPDATE ... SET data = ?, fence = ? WHERE
   id = ? AND fence < ?`.

**Why Redlock is contested.** Redlock is Redis's documented algorithm for locking across N independent Redis
masters (take the lock on a majority, with a validity time that subtracts elapsed time). The critique
(Martin Kleppmann, "How to do distributed locking"; the Redis author, Salvatore Sanfilippo, replied) can
be summarised without taking sides on every detail:

- A lock with a lease is only safe if clocks and pauses are bounded. GC pauses, VM stalls and swapped-out
  processes break that assumption (exactly what demo 2/3 simulates). Redlock generates no fencing token, so it
  cannot protect a downstream resource from a paused client.
- It depends on **timing assumptions** (clock drift small compared to the TTL) that real systems do not
  guarantee; a consensus system (ZooKeeper, etcd) has sessions and monotonic revision numbers usable as
  fencing tokens.
- It is heavy (5 Redis masters) for the "efficiency" use case and not strong enough for the "correctness" use case.

The practical rule from that debate:

| Why do you need the lock? | Use |
|---------------------------|-----|
| **Efficiency**: avoid doing expensive work twice; a rare double run is harmless (send a digest email, warm a cache) | single-Redis `SET NX PX` with token + Lua release. Simple and good enough |
| **Correctness**: a double run corrupts data (money, inventory, unique resource) | do **not** rely on a lease lock: DB unique constraint / conditional UPDATE / `SELECT FOR UPDATE`, fencing tokens, or a consensus store (etcd, ZooKeeper) |

Also remember: a single Redis (or a primary with async replica) can lose a lock on failover (the replica
never received the key), so two clients can both hold it.

**Operational details:** pick the TTL as `p99 of critical section x 3`; for longer work use a **watchdog** that
extends the TTL while the holder is alive (compare-and-`PEXPIRE` script, as in B6) but also stop the work if renewal
fails; put a timeout on acquiring; **always** put the lock key in a namespace that includes the resource id;
log lock wait time as a metric (rising wait = contention).

**Frontend connection.** Think of the `navigator.locks` Web Lock API: same idea for tabs of one browser, no
lease problem because one JS runtime owns it. The distributed version is hard exactly because the holder can die.

**Failure prevented / introduced / cost**

| | |
|--|--|
| Prevents | two workers doing the same exclusive job at once (double invoice, double refund, double cron run) |
| Introduces | **a new failure mode: the holder dies or pauses and the lease expires while it still works** (two holders); lock service becomes a dependency (if Redis is down, nothing can run); possible deadlock/starvation if TTLs are wrong |
| Cost | a Redis round trip on every critical section (about 1 ms), operations for Redis HA, extra code for tokens, fencing, renewal and timeouts |

**Common mistakes**

- `SETNX` then `EXPIRE` as two commands; no TTL at all.
- Releasing with plain `DEL` (demo 2a).
- A TTL shorter than the work, with no renewal or no fencing.
- Using Redlock/leases for correctness-critical writes instead of database constraints.
- Holding a distributed lock around a slow external call.

**Interview answer:** "I acquire with `SET key token NX PX ttl`, a single atomic command with a lease so a crashed
holder cannot block forever, and release with a Lua compare-and-delete so I only delete my own lock. I demonstrated
that a plain DEL after a lease expiry deletes the next owner's lock. Even then a paused client can keep working after its lease
expires, so for correctness-critical resources I use fencing tokens that the resource checks, or simply a database
constraint. Redlock is contested because it relies on bounded clock drift and pauses and gives no fencing token;
for efficiency-only locks a single Redis lock is enough, for correctness use the database or a consensus store."

**Follow-ups**

1. *Why a random token and not the server name?* The same process may re-acquire after expiry; a unique value per acquisition identifies that acquisition.
2. *Alternatives to Redis?* A MySQL row with `GET_LOCK()` (session-bound, released on disconnect), advisory locks in Postgres,
   etcd leases/`txn` with revision numbers, ZooKeeper ephemeral nodes.
3. *What about a queue instead of a lock?* Often better: route all work for the same key to one consumer (partitioned queue) and no lock is needed.

**Key concepts:** lease/TTL, token, compare-and-delete, fencing token, clock drift, GC pause, efficiency vs correctness lock.

**Revision questions**

1. Why must unlock be a Lua script rather than GET then DEL from the client?
2. What exactly did demo 2a do wrong, in order?
3. How does a fencing token protect a resource even when the lock fails?
4. State one argument against Redlock and one situation where a single-node Redis lock is fine.
5. Why is a lock around a slow API call dangerous?

**Practical task:** write a `withLock(key, ttlMs, fn)` helper that acquires with retry-and-timeout, runs `fn`,
and releases in `finally`; add a watchdog that renews at `ttl/3` and aborts `fn` (via `AbortSignal`) if a renewal returns 0.

- [ ] I ran demo 2a and 2b and can explain the difference line by line
- [ ] I can explain fencing tokens in one minute
- [ ] I can say when NOT to use a Redis lock

---

## B6 - Leader election `[ESSENTIAL]`

**Goal:** elect exactly one "active" instance for singleton jobs (cron scheduler, outbox poller, queue
re-balancer), and recover automatically when it dies.

**Concept.** Many instances run; one is the **leader** and does the singleton work; the others stand by.
It is a lock held for a long time with renewal: `SET leader NX PX ttl`, the leader renews every `ttl/3`, and if it
crashes the key expires and another instance takes over. Because renewal happens in a loop, **failover time is up
to `ttl`**: a trade of detection speed against false failovers on a slow network.

Implementation options (cheapest first):

1. **Don't elect.** Make the job safe to run on every instance (idempotent, or use `SELECT ... FOR UPDATE SKIP
   LOCKED` to claim work). Often the best design.
2. **DB row lease:** `UPDATE leader SET holder=?, expires_at=NOW()+INTERVAL 30 SECOND WHERE name='x' AND
   (holder=? OR expires_at < NOW())`; leader if `affectedRows=1`. Works with the DB you already have.
3. **Redis lease** (below).
4. **Consensus store:** etcd/ZooKeeper/Consul sessions, Kubernetes `Lease` objects. Use when correctness matters.
5. Managed: let the platform do it (a single-replica Deployment, a cloud scheduler, a queue with a single consumer group).

**Code** (`leader_redis.mjs`). Three candidates in one process; the leader renews with a compare-and-`PEXPIRE`
Lua script; we crash the leader at ~1 s by silencing it (its lease is left to expire):

```js
// Leader election with a Redis lease: SET NX PX to become leader, compare-and-PEXPIRE to renew, epoch via INCR (fencing).
import Redis from 'ioredis';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KEY = 'leader:cron-scheduler', TTL = 600, RENEW_EVERY = 200;
const RENEW_LUA = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end`;
const t0 = Date.now(); const log = (m) => console.log(`t=${String(Date.now() - t0).padStart(4)}ms  ${m}`);

class Candidate {
  constructor(name) { this.name = name; this.redis = new Redis({ host: '127.0.0.1', port: 63795 }); this.isLeader = false; this.alive = true; this.epoch = 0; }
  async loop() {
    while (this.alive) {
      if (this.isLeader) {
        const ok = await this.redis.eval(RENEW_LUA, 1, KEY, this.name, TTL);       // only the owner may extend
        if (!ok) { this.isLeader = false; log(`${this.name} lost leadership (renewal refused)`); }
      } else {
        const got = await this.redis.set(KEY, this.name, 'PX', TTL, 'NX');
        if (got === 'OK') { this.isLeader = true; this.epoch = await this.redis.incr('leader:epoch'); log(`${this.name} became LEADER, epoch (fencing token) = ${this.epoch}`); }
      }
      await sleep(RENEW_EVERY);
    }
  }
  crash() { this.alive = false; this.isLeader = false; log(`${this.name} CRASHED (stops renewing; lease is left to expire)`); this.redis.disconnect(); }
}

const admin = new Redis({ host: '127.0.0.1', port: 63795 }); await admin.del(KEY, 'leader:epoch');
const cs = ['svc-A', 'svc-B', 'svc-C'].map((n) => new Candidate(n));
cs.forEach((c) => c.loop());
await sleep(1000);
const leader = cs.find((c) => c.isLeader);
log(`current leader: ${leader.name}; leaders right now = ${cs.filter((c) => c.isLeader).length}`);
leader.crash();
await sleep(1800);
log(`leaders right now = ${cs.filter((c) => c.isLeader).length}: ${cs.filter((c) => c.isLeader).map((c) => c.name)}; key holder = ${await admin.get(KEY)}; epoch = ${await admin.get('leader:epoch')}`);
cs.forEach((c) => c.alive = false); await sleep(300); admin.disconnect(); cs.forEach((c) => c.redis.disconnect());
```

**Run:** `node leader_redis.mjs`

**Real output:**

```text
t= 140ms  svc-B became LEADER, epoch (fencing token) = 1
t=1079ms  current leader: svc-B; leaders right now = 1
t=1080ms  svc-B CRASHED (stops renewing; lease is left to expire)
t=1668ms  svc-C became LEADER, epoch (fencing token) = 2
t=2911ms  leaders right now = 1: svc-C; key holder = svc-C; epoch = 2
```

**What you learned**

- Exactly one leader at all times in the healthy phase (`leaders right now = 1`).
- After the crash at t=1080 ms the new leader appeared at t=1668 ms: a **588 ms gap with no leader**. It is
  bounded by `TTL` (600 ms) plus the polling interval (200 ms). Set TTL too low and a 1 s network blip causes a
  spurious failover; too high and a real crash leaves the cluster without a scheduler for minutes.
- The new leader got **epoch 2**. Attach this epoch to every write the leader makes (fencing, B5), so a
  zombie old leader that wakes up later gets rejected by the resource.
- This election is only as safe as B5's lock: it can produce two leaders for a moment after a pause or a Redis
  failover. Fine for "run the nightly report", not fine for "decide who owns the ledger" unless writes are fenced.

**Frontend connection.** One browser tab acting as leader for a `BroadcastChannel`/SharedWorker (only one tab polls
the server) is the same pattern at tiny scale.

**Failure prevented / introduced / cost**

| | |
|--|--|
| Prevents | duplicated singleton work (two schedulers firing every cron job twice), or no scheduler at all after a crash |
| Introduces | failover gap (no leader for up to TTL), split brain if leases and pauses are not fenced, a flapping leader if TTL < network jitter |
| Cost | a heartbeat load on Redis/DB (one renew per TTL/3 per leader), the code for demotion (the old leader must *stop* work when renewal fails), monitoring of "who is leader" |

**Common mistakes**

- A leader that keeps working after a failed renewal (it must stop immediately).
- No standby alerting: you do not notice until all instances are followers.
- Electing a leader for work that could simply be made idempotent.
- Using the process uptime or lowest IP as the "election".

**Interview answer:** "I implement leader election as a lease: instances compete with `SET NX PX`; the winner
renews periodically with a compare-and-expire script; if it dies the key expires and another instance wins.
Failover time is about the TTL, and I attach a monotonically increasing epoch to the leader's writes so a stale
leader is rejected. For correctness-critical election I use etcd, ZooKeeper or Kubernetes Leases, which use
consensus; for a simple scheduler a database or Redis lease is enough. Often the better answer is to avoid
needing a leader by making the job idempotent or using `SKIP LOCKED`."

**Follow-ups**

1. *What does the leader do if its renewal fails?* Stops all leader work at once and goes back to follower.
2. *Election vs lock?* Same primitive; election is a lock held for the process lifetime with a heartbeat.
3. *Why not "highest id wins" (bully algorithm)?* It needs reliable failure detection and fails under partition.

**Key concepts:** lease, heartbeat/renewal, failover time, epoch/term, demotion, standby.

**Revision questions**

1. What bounds the no-leader window?
2. What should a leader do when it cannot renew?
3. Why attach an epoch to writes?
4. Give a design that needs no leader.

**Practical task:** implement the DB-row lease version for MySQL (conditional UPDATE) and run it with 3 processes; kill the
leader with `kill -9` and measure the gap.

- [ ] I measured the failover gap and can relate it to TTL
- [ ] I can name three election options
- [ ] I can explain the demotion rule

---

## B7 - Saga and two-phase commit `[ESSENTIAL]`

**Goal:** coordinate a business transaction that spans services that each own their own database, using
either a saga (compensation) or 2PC, and know why most systems choose sagas.

**The problem.** "Place order" must reserve stock (inventory service), charge the card (payment service) and
confirm the order (order service). Three databases, no shared transaction. If step 2 fails after step 1 succeeded, step 1
must be undone.

### Saga

A **saga** is a sequence of local transactions; each has a **compensating action** that semantically undoes it
(refund, release stock, cancel order). If step k fails, run compensations for steps k-1..1 in reverse order.

- **Orchestration:** one coordinator (a service or workflow engine) calls the steps, keeps the state, and issues the compensations.
  Easier to follow, test and monitor; the orchestrator is another thing to run and must itself be durable.
- **Choreography:** no coordinator. Each service listens for events and emits the next one
  (`OrderPlaced -> StockReserved -> PaymentCaptured`; `PaymentFailed -> release stock`). Loose coupling, but the flow is
  spread across services, hard to see, and easy to create cyclic event chains.

**Code** (`saga.mjs`: in-memory services with an artificial delay; same fake services used for both styles):

```js
import { EventEmitter } from 'node:events';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- fake services: each owns its own data, each step has a compensating action ----------
function makeServices({ failPayment = false } = {}) {
  const db = { stock: 3, payments: [], orders: [], emails: [] };
  return {
    db,
    inventory: {
      async reserve(orderId) { await sleep(5); if (db.stock < 1) throw new Error('out of stock'); db.stock--; return 'reserved'; },
      async release(orderId) { await sleep(5); db.stock++; },
    },
    payment: {
      async charge(orderId) { await sleep(5); if (failPayment) throw new Error('card declined'); db.payments.push({ orderId, state: 'CHARGED' }); },
      async refund(orderId) { await sleep(5); const p = db.payments.find((x) => x.orderId === orderId); if (p) p.state = 'REFUNDED'; },
    },
    orders: {
      async create(orderId) { await sleep(5); db.orders.push({ orderId, state: 'CONFIRMED' }); },
      async cancel(orderId) { await sleep(5); const o = db.orders.find((x) => x.orderId === orderId); if (o) o.state = 'CANCELLED'; },
    },
  };
}

// ================= 1. ORCHESTRATION: one coordinator owns the steps and the undo list =================
async function runSaga(steps, ctx, log) {
  const done = [];
  for (const s of steps) {
    try { log(`-> ${s.name}`); await s.action(ctx); done.push(s); }
    catch (e) {
      log(`!! ${s.name} failed: ${e.message}. Compensating ${done.length} completed step(s) in reverse order`);
      for (const d of done.reverse()) { log(`<- compensate ${d.name}`); await d.compensate(ctx); }   // compensations must be idempotent + retried in real life
      return 'ROLLED_BACK';
    }
  }
  return 'COMPLETED';
}
function orderSteps(svc) {
  return [
    { name: 'reserve inventory', action: (o) => svc.inventory.reserve(o), compensate: (o) => svc.inventory.release(o) },
    { name: 'charge payment', action: (o) => svc.payment.charge(o), compensate: (o) => svc.payment.refund(o) },
    { name: 'confirm order', action: (o) => svc.orders.create(o), compensate: (o) => svc.orders.cancel(o) },
  ];
}
console.log('== Orchestration, happy path');
let svc = makeServices();
console.log('   result:', await runSaga(orderSteps(svc), 'o-1', (m) => console.log('  ', m)), JSON.stringify(svc.db));
console.log('== Orchestration, payment fails');
svc = makeServices({ failPayment: true });
console.log('   result:', await runSaga(orderSteps(svc), 'o-2', (m) => console.log('  ', m)), JSON.stringify(svc.db));

// ================= 2. CHOREOGRAPHY: no coordinator; services react to events on a bus =================
console.log('\n== Choreography (event bus), payment fails');
const bus = new EventEmitter();
const s2 = makeServices({ failPayment: true });
const say = (m) => console.log('  ', m);
const on = (evt, fn) => bus.on(evt, (...a) => fn(...a).catch((e) => say('handler error: ' + e.message)));
on('OrderPlaced', async (id) => { say('inventory heard OrderPlaced'); try { await s2.inventory.reserve(id); bus.emit('StockReserved', id); } catch { bus.emit('StockFailed', id); } });
on('StockReserved', async (id) => { say('payment heard StockReserved'); try { await s2.payment.charge(id); bus.emit('PaymentCaptured', id); } catch { bus.emit('PaymentFailed', id); } });
on('PaymentCaptured', async (id) => { say('orders heard PaymentCaptured'); await s2.orders.create(id); bus.emit('OrderConfirmed', id); });
on('PaymentFailed', async (id) => { say('inventory heard PaymentFailed -> release stock (compensation)'); await s2.inventory.release(id); bus.emit('OrderRejected', id); });
bus.emit('OrderPlaced', 'o-3');
await sleep(100);
console.log('   final db:', JSON.stringify(s2.db));
```

(The file continues with the two-phase commit demo, shown in the next section.)

**Real output of the saga part:**

```text
== Orchestration, happy path
   -> reserve inventory
   -> charge payment
   -> confirm order
   result: COMPLETED {"stock":2,"payments":[{"orderId":"o-1","state":"CHARGED"}],"orders":[{"orderId":"o-1","state":"CONFIRMED"}],"emails":[]}
== Orchestration, payment fails
   -> reserve inventory
   -> charge payment
   !! charge payment failed: card declined. Compensating 1 completed step(s) in reverse order
   <- compensate reserve inventory
   result: ROLLED_BACK {"stock":3,"payments":[],"orders":[],"emails":[]}

== Choreography (event bus), payment fails
   inventory heard OrderPlaced
   payment heard StockReserved
   inventory heard PaymentFailed -> release stock (compensation)
   final db: {"stock":3,"payments":[],"orders":[],"emails":[]}
```

**What you learned**

- Both styles end in the same state: after a payment failure, stock is back to 3 and nothing was charged. In
  the orchestrated run the control flow is in one function you can read top to bottom; in the choreographed run
  you had to read four `on(...)` handlers to reconstruct the same story.
- A saga gives **no isolation**: between `reserve` and `compensate`, another customer could have seen stock = 2
  (a "dirty read" at business level). You handle this with semantic locks (a `PENDING` state), reservations with
  expiry, and by showing "held for you" instead of "sold".
- Compensation is not rollback. You cannot un-send an email or un-ship a parcel; you send a correction
  or a return label. Design each step with its compensation (or a "pivot" step after which the saga can only
  go forward).
- **What the toy leaves out and production needs:** the orchestrator's state must be persisted (otherwise a
  crash mid-saga strands half-done work), every step and compensation must be **idempotent** (retried after
  timeouts, B3), the order of events must be handled (duplicates, late arrivals), and messages must be sent
  reliably with the **transactional outbox** pattern (write the event in the same DB transaction as the state change;
  a relay publishes it). Workflow engines (Temporal, AWS Step Functions) provide persistence and retries.

**Orchestration vs choreography**

| | Orchestration | Choreography |
|--|--|--|
| Flow visible in | one place | spread over services |
| Coupling | services depend on the coordinator's API | services depend on event schemas |
| Adding a step | change the orchestrator | add a subscriber (but check the whole chain) |
| Debugging | easy: saga state per order | hard: reconstruct from events/traces |
| Risk | the orchestrator becomes a "god service" / SPOF | cyclic dependencies, invisible flows |
| Good for | multi-step money flows, anything needing audit | simple, few-step, fan-out notifications |

### Two-phase commit (2PC)

**Concept.** A **coordinator** asks all participants (databases) to **PREPARE** ("can you commit? promise me
you can"). Each participant writes the transaction durably, **keeps its locks**, and votes YES/NO. If all vote
YES the coordinator logs COMMIT and tells everyone to commit; otherwise it tells everyone to abort. It gives
**atomic commit across databases**. (XA transactions are the standard API; MySQL supports `XA START/END/PREPARE/COMMIT`.)

**The failure it prevents:** a payment recorded in the bank DB but not in the ledger DB (or the reverse), i.e. a
partially applied distributed transaction.

**The failure it introduces: blocking.** Once a participant votes YES, it may not decide alone: it has promised
to commit, and it cannot abort because the coordinator might have told *another* participant to commit. If the
coordinator crashes after PREPARE, participants sit with locks held **until the coordinator comes back**. In
the demo (rest of `saga.mjs`):

```js
// ================= 3. Two-phase commit: why participants block =================
console.log('\n== Two-phase commit: coordinator crashes after PREPARE');
class Participant {
  constructor(name) { this.name = name; this.state = 'IDLE'; this.locked = false; }
  prepare() { this.state = 'PREPARED'; this.locked = true; return 'YES'; }   // promise: "I can commit" -> must hold locks until told otherwise
  commit() { this.state = 'COMMITTED'; this.locked = false; }
  abort() { this.state = 'ABORTED'; this.locked = false; }
}
async function twoPC(parts, { crashAfterPrepare }) {
  const votes = parts.map((p) => p.prepare());                        // phase 1
  if (crashAfterPrepare) return 'COORDINATOR CRASHED (decision never sent)';
  if (votes.every((v) => v === 'YES')) { parts.forEach((p) => p.commit()); return 'COMMITTED'; }   // phase 2
  parts.forEach((p) => p.abort()); return 'ABORTED';
}
let parts = [new Participant('bank-db'), new Participant('ledger-db')];
console.log('   healthy      :', await twoPC(parts, { crashAfterPrepare: false }), parts.map((p) => `${p.name}=${p.state}/locked=${p.locked}`).join(' '));
parts = [new Participant('bank-db'), new Participant('ledger-db')];
console.log('   coordinator dies:', await twoPC(parts, { crashAfterPrepare: true }), parts.map((p) => `${p.name}=${p.state}/locked=${p.locked}`).join(' '));
await sleep(200);
console.log('   200ms later  : participants cannot decide alone (the other might have been told COMMIT):', parts.map((p) => `${p.name}=${p.state}/locked=${p.locked}`).join(' '));
```

```text
== Two-phase commit: coordinator crashes after PREPARE
   healthy      : COMMITTED bank-db=COMMITTED/locked=false ledger-db=COMMITTED/locked=false
   coordinator dies: COORDINATOR CRASHED (decision never sent) bank-db=PREPARED/locked=true ledger-db=PREPARED/locked=true
   200ms later  : participants cannot decide alone (the other might have been told COMMIT): bank-db=PREPARED/locked=true ledger-db=PREPARED/locked=true
```

Both rows stay locked (`locked=true`) indefinitely. Any other transaction touching those rows waits, and the
wait propagates upward into your connection pool and then your API (Lab 7). In MySQL, a prepared XA transaction
survives even a server restart until someone runs `XA COMMIT` or `XA ROLLBACK` manually.

**The cost:** at least 2 extra network round trips and 2 forced disk writes per transaction on every
participant; locks held across all of them (so throughput is limited by the slowest participant); the coordinator
is a single point of failure and must be highly available and durable (this is why 2PC with a consensus-replicated
coordinator, as in Spanner or CockroachDB, works inside one database but is rarely built across independent microservices); not supported by many
modern stores (most NoSQL, SaaS APIs such as a payment provider can never take part in your 2PC).

**Why it is mostly avoided in microservices:** you cannot make a third-party PSP "prepare"; availability is the
product of every participant's availability; latency rises; locks block users. Sagas accept temporary
inconsistency (visible intermediate states) and compensation instead.

| | Saga | 2PC |
|--|--|--|
| Atomicity | eventual (compensate) | immediate (all or nothing) |
| Isolation | none (intermediate states visible) | yes (locks held) |
| Failure behavior | continue or compensate | block while the coordinator is down |
| Latency | local transactions, async | slowest participant, 2 round trips |
| Works with external APIs | yes | no |
| Complexity lives in | compensations, idempotency, state machine | the transaction manager and recovery |

**Frontend connection.** A checkout page that shows "processing... we will email you" is a saga (eventual outcome,
possible later compensation: a refund email); a form that blocks until everything is committed is the 2PC experience.

**Failure prevented / introduced / cost**

| | Saga | 2PC |
|--|--|--|
| Prevents | half-finished business transactions across services | half-committed data across databases |
| Introduces | visible intermediate states, compensation bugs, duplicate/out-of-order events | blocking locks when the coordinator fails, lower availability |
| Cost | orchestration/outbox code, idempotent steps, a persisted state machine, observability | latency and lock time on every transaction, a durable HA coordinator, XA support everywhere |

**Common mistakes**

- Treating compensation as an exact inverse (you cannot un-send an email).
- A saga whose state lives only in memory.
- Non-idempotent steps or compensations that are retried after a timeout.
- Publishing the event outside the DB transaction (dual-write problem): the state is saved but the event is lost, or the reverse.
- Choosing 2PC across HTTP microservices.

**Interview answer:** "For a business transaction across services I use a saga: a sequence of local transactions, each
with a compensating action, run by an orchestrator that persists its state, with idempotent steps and the
transactional outbox for reliable events. It gives eventual consistency, not isolation, so I model intermediate
states such as PENDING. I avoid two-phase commit across services because participants that voted YES must hold
locks until the coordinator decides; if the coordinator dies they block, which I showed in a demo. It also adds round
trips and cannot include external APIs. 2PC remains reasonable inside one database cluster or for two co-located
databases where XA is supported and the coordinator is reliable."

**Follow-ups**

1. *What is a pivot step?* The step after which compensation is no longer possible (e.g. goods shipped); steps before it are compensable, after it are retryable until success.
2. *What is the transactional outbox?* Insert the event into an `outbox` table in the same local transaction as the state change; a background relay publishes rows and marks them sent: at-least-once delivery without a distributed transaction.
3. *What is 3PC?* Adds a pre-commit phase to reduce blocking but assumes bounded delays, so it is rarely used.
4. *TCC (Try-Confirm-Cancel)?* A saga-like pattern: reserve resources in Try, make permanent in Confirm, release in Cancel.

**Key concepts:** local transaction, compensation, orchestration, choreography, outbox, pivot, PREPARE/COMMIT, XA, blocking.

**Revision questions**

1. Write the saga for "book flight + hotel + car" with compensations.
2. Why is a compensation not a rollback?
3. Why do participants block in 2PC after voting YES?
4. What is the dual-write problem and how does the outbox solve it?
5. Which of the two would you use with a payment provider and why?

**Practical task:** make the orchestrated saga resumable: after each step write `{orderId, completedSteps}` to a JSON file (stand-in
for a DB), kill the process in the middle, restart it and have it finish or compensate from the saved state.

- [ ] I can explain orchestration vs choreography with one example each
- [ ] I can explain exactly why 2PC blocks
- [ ] I can describe the outbox pattern

---

## B8 - The failure ledger: for each of the 12 topics, what it prevents, introduces and costs `[ESSENTIAL]`

The roadmap asks you to write this down for every topic. Here is the completed table; copy it into your own
project notes and adapt the "your project" column.

| # | Topic | Failure it prevents | Failure it introduces | Cost | In the Task API / payments project |
|---|-------|---------------------|------------------------|------|-----------------------------------|
| 1 | CAP / replication | single node = single point of failure | stale reads or refused requests during partition | design for conflicts, read-your-writes logic | read replica lag for task lists; reads of "my own task" from primary |
| 2 | Eventual consistency | blocking on cross-node agreement, latency | stale data, anomalies, merge bugs | "pending" UI states, reconciliation jobs | search index and cache are eventually consistent with MySQL |
| 3 | Consensus (Raft) | split brain, lost acknowledged writes on failover | no progress without a quorum, election pause | majority round trip per write, 3+ nodes | consumed through etcd/managed DB failover, not written by us |
| 4 | Idempotency | duplicate side effects from retries | key storage, in-progress states, key/body mismatch | one extra write + table per request | `Idempotency-Key` on `POST /payments` and job creation |
| 5 | Retries | transient errors reaching users | retry storms, duplicate work | extra load and tail latency | 2 attempts, backoff + jitter, only in one layer |
| 6 | Timeouts | hung dependency exhausting sockets/pool | false failures while work still completes | picking and tuning values per call | decreasing timeouts: gateway > service > DB |
| 7 | Circuit breaker | cascading failure | rejections after recovery, flapping | state machine, fallbacks, metrics | around the PSP / email provider calls |
| 8 | Backpressure | unbounded queues, OOM, unbounded latency | rejected/delayed work the caller must handle | queue sizing, client 429 handling | bounded BullMQ concurrency, 429 from the edge |
| 9 | Distributed lock | two workers on the same exclusive job | expired-lease double ownership; lock service dependency | Redis round trip, fencing/renewal code | efficiency locks for report jobs only; money uses DB constraints |
| 10 | Leader election | duplicated singleton work / no scheduler | failover gap, split brain without fencing | heartbeats, demotion logic | one cron scheduler with an epoch on its writes |
| 11 | Saga | half-finished multi-service transactions | visible intermediate states, compensation bugs | persisted orchestrator, outbox, idempotent steps | order -> reserve -> pay -> confirm with refunds |
| 12 | Two-phase commit | half-committed data across DBs | blocking locks if the coordinator fails; latency | 2 round trips + forced writes; HA coordinator | **not used**; one DB transaction or saga |

---
**PART C - CAPACITY ESTIMATION AND SYSTEM-DESIGN NUMBERS**

Week 7 notes (system design) drew the boxes. This part does "the numbers, not the boxes": a design with no
numbers cannot be wrong, which is exactly why it cannot be right. Aim for **order-of-magnitude** accuracy: is it
100 requests/s or 100,000? 1 GB or 100 TB? One machine or fifty? Those answers change the design.

---

## C1 - Latency vs throughput vs concurrency, and Little's law `[ESSENTIAL]`

**Goal:** know what each number means, how they are linked by one equation, and why latency explodes near full utilisation.

**Definitions**

- **Latency (W):** how long one request takes, from the caller's view. Report percentiles (p50, p95, p99), not the mean.
- **Throughput (lambda):** requests completed per second.
- **Concurrency (L):** requests in the system at the same time (in flight: running + waiting).
- **Capacity:** the throughput at which latency starts to climb sharply.

**Little's law:** `L = lambda x W` (average number in system = arrival rate x average time in system). It holds for
*any* stable system, whatever the distribution. Use it in either direction:

| You know | You want | Formula | Example |
|----------|----------|---------|---------|
| rate and latency | connections/threads/memory needed | `L = lambda x W` | 500 req/s x 0.040 s of DB time = **20 DB connections busy on average** |
| workers and latency | max throughput | `lambda_max = L / W` | 10 workers x (1 / 0.1 s) = **100 req/s** |
| queue length and service rate | wait time | `W = L / lambda` | 1,600 queued / 200 per s = **8 s** (B4) |
| in-flight limit and rate | latency | `W = L / lambda` | 10,000 waiting / 313 per s = **32 s** (Lab 7) |

**Why you must size a pool with Little's law:** a pool of 100 connections is *not* "more safe" than 20 if the
database has 8 cores; beyond the number the DB can serve in parallel, extra connections only add queueing,
context switches and memory. Start from `rate x query time`, add headroom for peak (x2 to x3), then test.

**Simulation** (`little.mjs`: discrete-event simulation of 10 workers, each request needs 100 ms on average
with exponential variation; arrivals are random at rate lambda). Capacity = `10 / 0.1 s = 100 req/s`:

```js
// Discrete-event simulation of a server with c workers (e.g. DB connections), exponential service time.
// Verifies Little's law L = lambda * W and shows latency exploding as utilisation -> 100%.
let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const expo = (mean) => -Math.log(1 - rnd()) * mean;

function sim({ lambda, c, meanServiceMs, durationS = 600 }) {
  const end = durationS * 1000;
  let nextArrival = expo(1000 / lambda);
  const busyUntil = Array(c).fill(0);         // when each worker becomes free
  const waits = [], sojourns = []; let areaInSystem = 0, lastT = 0, inSystem = 0; const departures = [];
  let arrivals = 0;
  while (nextArrival < end) {
    departures.sort((a, b) => a - b);
    while (departures.length && departures[0] <= nextArrival) { const d = departures.shift(); areaInSystem += inSystem * (d - lastT); lastT = d; inSystem--; }
    areaInSystem += inSystem * (nextArrival - lastT); lastT = nextArrival; inSystem++; arrivals++;
    // FIFO: assign to the worker that frees earliest
    let k = 0; for (let i = 1; i < c; i++) if (busyUntil[i] < busyUntil[k]) k = i;
    const start = Math.max(nextArrival, busyUntil[k]);
    const svc = expo(meanServiceMs);
    busyUntil[k] = start + svc;
    departures.push(busyUntil[k]);
    waits.push(start - nextArrival); sojourns.push(busyUntil[k] - nextArrival);
    nextArrival += expo(1000 / lambda);
  }
  while (departures.length) { departures.sort((a, b) => a - b); const d = departures.shift(); areaInSystem += inSystem * (d - lastT); lastT = d; inSystem--; }
  const W = sojourns.reduce((a, b) => a + b, 0) / sojourns.length;
  const L = areaInSystem / lastT;
  const lam = arrivals / (lastT / 1000);
  const sorted = sojourns.slice().sort((a, b) => a - b);
  return { util: (lambda * meanServiceMs / 1000) / c, W, L, lam, p99: sorted[Math.floor(sorted.length * 0.99)], meanWait: waits.reduce((a, b) => a + b, 0) / waits.length };
}

console.log('c=10 workers, mean service time 100ms -> capacity = 10 / 0.1s = 100 req/s');
console.log('lambda  util   mean latency W   p99 latency   L (measured)  lambda*W (Little)');
for (const lambda of [20, 50, 80, 90, 95, 98]) {
  const r = sim({ lambda, c: 10, meanServiceMs: 100, durationS: 1200 });
  console.log(`${String(lambda).padStart(5)}  ${(r.util * 100).toFixed(0).padStart(3)}%   ${r.W.toFixed(0).padStart(8)} ms   ${r.p99.toFixed(0).padStart(8)} ms   ${r.L.toFixed(2).padStart(10)}   ${(r.lam * r.W / 1000).toFixed(2).padStart(10)}`);
}
const over = sim({ lambda: 120, c: 10, meanServiceMs: 100, durationS: 60 });
console.log(`overload lambda=120 > capacity 100 for 60s: mean latency ${over.W.toFixed(0)} ms, p99 ${over.p99.toFixed(0)} ms (queue grows without bound)`);
```

**Run:** `node little.mjs`

**Real output:**

```text
c=10 workers, mean service time 100ms -> capacity = 10 / 0.1s = 100 req/s
lambda  util   mean latency W   p99 latency   L (measured)  lambda*W (Little)
   20   20%        100 ms        464 ms         2.02         2.02
   50   50%        100 ms        464 ms         4.97         4.97
   80   80%        121 ms        489 ms         9.67         9.67
   90   90%        171 ms        668 ms        15.35        15.35
   95   95%        259 ms        869 ms        24.53        24.53
   98   98%        497 ms       1561 ms        48.81        48.81
overload lambda=120 > capacity 100 for 60s: mean latency 7510 ms, p99 13574 ms (queue grows without bound)
```

**What you learned**

- The last two columns agree to two decimals: **L = lambda x W is exact**, measured, not a rule of thumb.
- Latency is flat until about 80% utilisation and then climbs: mean latency 121 ms at 80% -> 171 ms at 90%
  -> 259 ms at 95% -> **497 ms at 98%** (5 times the service time). The p99 (1,561 ms) is 15 times the service time.
  **Do not run a shared resource hot.** Plan for 50-70% peak utilisation.
- p99 at 20% utilisation is already 464 ms: with exponentially varying service times, even an idle system has a
  tail. Tail latency is a property of variance, not only of load.
- Above capacity (lambda=120 vs 100) there is no steady state: the queue grows without bound, mean latency
  reached 7.5 s after only 60 s, and keeps growing. Hence bounded queues and load shedding (B4).

**Other numbers to carry**

- **Tail amplification:** if one call has p99 = 100 ms and a request fans out to 100 such calls in parallel, then
  `1 - 0.99^100 = 63%` of requests see at least one call slower than 100 ms. Fan-out turns rare slowness into common slowness.
- **Amdahl / serialisation:** if 5% of the work must be serial (one hot row, one lock), the speed-up from adding
  machines is capped at `1 / 0.05 = 20x`, however many you add. This is the Lab 2 hot row.
- **Utilisation, saturation, errors (USE)** per resource and **rate, errors, duration (RED)** per service are the
  metrics that expose this (see 15_Observability_Cloud_CICD.md).

**Order-of-magnitude latency table** (typical modern hardware; values drift year to year, use as orders of magnitude, not facts):

| Operation | Roughly |
|-----------|---------|
| main memory read | 100 ns |
| SSD random read | 100 us |
| round trip inside one datacenter / zone | 0.5 ms |
| Redis GET (same zone, including client) | 0.2 - 1 ms |
| MySQL indexed point read (in buffer pool) | 0.2 - 2 ms |
| spinning-disk seek | 10 ms |
| cross-continent network round trip | 100 - 200 ms |
| TLS handshake (1 RTT in TLS 1.3 plus crypto) | a few ms in-region, 100+ ms cross-continent |

Rules of thumb for arithmetic: 1 day = 86,400 s, **about 10^5 s**; 1 month = 2.6 x 10^6 s;
**1 million requests per day is about 12 requests per second**; peak is usually 2 to 10 times the average.

**Frontend connection.** Core Web Vitals are latency percentiles measured at the user; a page that calls 6 APIs
in parallel has the tail amplification above. `Promise.all` is as slow as its slowest request.

**Common mistakes**

- Quoting average latency (hides the tail); averaging percentiles across instances (not valid: compute from histograms).
- Sizing a pool from "the max the DB allows" instead of Little's law.
- Load testing at one rate and extrapolating linearly, ignoring the knee at 80-90% utilisation.
- Closed-loop load testers (fixed number of virtual users waiting for responses) that hide queueing:
  when the server slows down they send fewer requests ("coordinated omission"). Use an open-loop tool (rate-based).

**Interview answer:** "Latency is time per request, throughput is requests per second, concurrency is how many
are in flight, and Little's law ties them: concurrency = throughput x latency. If I expect 500 requests per second
and each needs 40 ms of database time, I need about 20 connections busy on average, so I would size the pool near 30,
not 500. I also know latency is not linear in load: in a simulation of ten workers with 100 ms jobs, mean latency was
121 ms at 80% utilisation and 497 ms at 98%, and above 100% the queue grows without bound. So I plan for around 60% peak
utilisation and shed load beyond it."

**Follow-ups**

1. *Does adding servers always reduce latency?* It reduces queueing delay (the part above service time); it does not
   reduce the service time itself.
2. *Why p99 over the mean?* Users experience individual requests; a few slow ones dominate perception and retries.
3. *How do you pick a DB pool size?* `rate x query time` for the average, headroom for peaks, and cap it
   below what the DB can run in parallel (cores x 2 + disks is a classic starting rule; always load-test).

**Key concepts:** latency, throughput, concurrency, Little's law, utilisation knee, tail latency, tail amplification, coordinated omission.

**Revision questions**

1. If latency doubles at constant throughput, what happens to concurrency?
2. Your service handles 200 req/s with 50 ms latency: how many requests are in flight on average?
3. Why does latency rise sharply near 100% utilisation?
4. Compute `1 - 0.999^50`.
5. What is wrong with measuring only the mean?

**Practical task:** run `little.mjs` with `c: 5` and `meanServiceMs: 50` (capacity is still 100 req/s) and compare
with the table above. My run: mean latency 50 / 52 / 78 / 130 / 218 / 457 ms at 20 / 50 / 80 / 90 / 95 / 98% utilisation, and
`L` still equals `lambda x W`. The knee is at the same relative utilisation; latency is lower because each job is
twice as fast, yet the p99-to-service-time ratio is similar. Explain why.

- [ ] I can use L = lambda x W in all four directions
- [ ] I can explain the utilisation knee with my own numbers
- [ ] I know the latency table orders of magnitude

---

## C2 - Back-of-envelope worked examples: URL shortener, chat, feed, payments `[ESSENTIAL]`

**Goal:** practise the full framework, in order, on four classic systems:
**requirements -> estimation -> API -> data model -> diagram -> deep dive -> bottlenecks.** (Week 7 / Day 3 notes
design the URL shortener in more detail; Week 7 / Day 4 covers the payment flow. Here the focus is the arithmetic
and the reasoning from numbers to design.)

All arithmetic was done by script (`calc.mjs`); the raw output is at the end of this module. Assumptions are
**stated**, because in an interview the assumptions are the answer: wrong assumptions stated clearly are
fixable, hidden ones are not.

### The framework (use it every time)

1. **Requirements** (2 min): functional (what it does), non-functional (latency, availability, consistency,
   durability), and **explicit non-goals**.
2. **Estimation:** users -> requests/s (average and peak) -> read:write ratio -> storage (per record x count x
   retention x replication) -> memory (cache) -> bandwidth -> machine counts.
3. **API:** the 3 to 5 endpoints that matter, with idempotency and pagination where relevant.
4. **Data model:** tables/keys, the access patterns they serve, the indexes, the shard key.
5. **Diagram:** a small box diagram of the request path and the data stores.
6. **Deep dive:** the one or two hardest parts (key generation, fan-out, double charge).
7. **Bottlenecks:** where it breaks first at 10x load, single points of failure, what you would monitor.

### Example 1 - URL shortener

**Requirements.** Create a short URL for a long one; redirect fast; optional custom alias and expiry; basic click
counts. Non-functional: redirect p99 < 100 ms, high availability for redirects (reads), **a short code must never
point to two URLs**, links durable for years. Non-goals: link previews, user accounts.

**Estimation** (assumptions: 100 M new URLs per month, read:write = 100:1, 500 bytes per record including
metadata, keep 5 years):

| Quantity | Calculation | Result |
|----------|-------------|--------|
| Writes/s | 100 M / (30 x 86,400) | **38.6 /s** |
| Redirects/s (avg) | 38.6 x 100 | **3,858 /s** |
| Redirects/s (peak, x3) | | **11,574 /s** |
| Records in 5 years | 100 M x 12 x 5 | **6 billion** |
| Storage | 6 G x 500 B | **3 TB** (before replication x3 = 9 TB) |
| Code length | 62^6 = 56.8 G, 62^7 = 3.52 T | **7 chars of base62** (6 chars is only 56.8 G, tight for 6 G with random collisions) |
| Hot set cache | assume 10% of links get 90% of traffic: 10% x 1 year of links x 500 B | **about 60 GB** (fits in a Redis node or two) |
| Egress (redirect ~400 B x peak) | 400 B x 11.6 K | **4.6 MB/s**: network is irrelevant |

Conclusion from numbers: **38 writes/s is trivial** (one MySQL primary); 3 TB is a lot for one machine but fine for
a primary + replicas or a sharded NoSQL store; the real work is **the read path**: 11.6 K redirects/s, almost all
cache hits.

**API**

```text
POST /v1/urls        {longUrl, alias?, expiresAt?}  -> 201 {code, shortUrl}   (Idempotency-Key header)
GET  /{code}                                          -> 301/302 Location: longUrl   (302 if you need click counts, 301 caches in browsers)
GET  /v1/urls/{code}/stats                            -> {clicks, ...}
DELETE /v1/urls/{code}
```

**Data model:** `urls(code CHAR(7) PRIMARY KEY, long_url TEXT, created_at, expires_at, owner_id)`. Point lookups by
code only. Primary key = the code, so reads are one index seek. Shard key (if needed): `code` hash.

**Diagram**

```text
client -> CDN/edge (optional for 301s) -> LB -> redirect service x N -> Redis (code -> url)
                                                         |  (miss)
                                                         v
                                              MySQL primary + replicas (urls)
create: client -> LB -> API -> key generator -> MySQL primary (INSERT) -> Redis (warm)
clicks: redirect service -> queue (Kafka/Redis stream) -> aggregator -> analytics store
```

**Deep dive: key generation.** Options: (a) random 7 chars + unique-constraint retry on collision (at 6 G of 3.5 T
codes, collision chance per attempt = 0.17% and rising: acceptable with retry); (b) a counter (auto-increment or Redis
`INCR`) encoded in base62: no collisions but predictable (enumerable) codes; (c) pre-generated key ranges handed to
each app instance (avoids a hot counter: Lab 2 lesson). Choose (c) or (a) with the DB unique constraint as the
final guard (Lab 2: the constraint is the safety net, not the app check).

**Bottlenecks:** cache stampede on a viral link (single-flight/request coalescing + TTL jitter); click counting must be
async (a DB row increment per redirect is the hot-row problem of Lab 2: at 11 K/s it would be impossible);
expiry cleanup job; abuse (rate limit creation, malware scan); cache invalidation on delete/edit.

### Example 2 - Chat (1:1 and small groups)

**Requirements.** Send and receive messages in real time, history, delivery/read receipts, offline delivery.
Non-functional: message delivery latency p99 < 500 ms, **no message loss**, ordering per conversation. Non-goals: voice/video, E2E encryption internals.

**Estimation** (assumptions: 50 M DAU, 40 messages sent per user per day, 10% of DAU online at peak, 200 bytes per message incl. metadata):

| Quantity | Calculation | Result |
|----------|-------------|--------|
| Messages/day | 50 M x 40 | **2 billion** |
| Messages/s avg | 2 G / 86,400 | **23,148 /s** |
| Messages/s peak (x3) | | **69,444 /s** |
| Storage/day | 2 G x 200 B | **400 GB/day = 146 TB/year** (x3 replicas ~ 440 TB) |
| Concurrent connections | 10% x 50 M | **5 million WebSockets** |
| Gateway servers | 5 M / 50,000 conns each | **100 servers** (a tuned box can hold 50 K+ idle connections) |
| Memory for connections | 5 M x 10 KB | **50 GB** total (0.5 GB per server) |

Conclusion: the hard part is not message rate (69 K/s is shardable) but **5 M long-lived connections** and the
**write volume** (146 TB/year): a wide-column/LSM store (Cassandra/Scylla/HBase) or sharded MySQL fits, a single
Postgres/MySQL does not.

**API:** WebSocket events `send {convId, clientMsgId, body}` -> `ack {serverMsgId, ts}`; `message` push; REST
`GET /v1/conversations/{id}/messages?before=<cursor>&limit=50`, `POST /v1/conversations`. `clientMsgId` is an
idempotency key: a retry after reconnect must not duplicate the message (B3).

**Data model:** `messages((conversation_id, message_id) PRIMARY KEY, sender_id, body, created_at)` with `message_id` a
time-ordered id (Snowflake/ULID) so "latest 50" is a range scan on one partition; `conversations`,
`participants`; per-user inbox pointers for unread counts. **Partition key = conversation_id**: one conversation is on one
shard, which gives in-order writes without a global lock.

**Diagram**

```text
phone <-WebSocket-> L4 LB -> chat gateway (holds connections) -> message service -> partitioned DB (conversation_id)
                                   ^                                  |
                                   |  routing: userId -> gateway      +-> queue -> push notification service (offline users)
                              presence/session store (Redis: userId -> gatewayId)
```

**Deep dive: delivery and ordering.** Sender's gateway writes the message (durable) *then* acks; recipient online:
look up its gateway in Redis and push; offline: push notification + sync on reconnect from "messages after my last seen
message_id". Ordering inside one conversation comes from the per-conversation sequence (single partition leader).
Groups: fan-out on write to member inboxes for small groups (< ~100), read-time merge for large ones. Exactly-once
is impossible; **at-least-once delivery + client dedupe by messageId = effectively once**.

**Bottlenecks:** connection count per gateway (file descriptors, memory; reconnect storm after a gateway restart:
use jittered reconnect, B3); hot conversations/large groups; the presence service (writes on every connect/disconnect);
backlog when push providers are slow (queue + backpressure, B4).

### Example 3 - News feed / timeline

**Requirements.** Show a user a ranked list of recent posts from the people they follow; post creation; infinite scroll.
Non-functional: feed load p99 < 300 ms, a new post appears within seconds (eventual consistency is fine), very read-heavy.

**Estimation** (assumptions: 300 M DAU, 10 feed loads/user/day, 100 M posts/day, average 200 followers, a few
celebrities with up to 50 M followers, timeline entry = 8-byte post id, keep 800 posts per timeline):

| Quantity | Calculation | Result |
|----------|-------------|--------|
| Feed reads/s avg | 300 M x 10 / 86,400 | **34,722 /s** (peak x3: **104,167 /s**) |
| Posts/s | 100 M / 86,400 | **1,157 /s** |
| Fan-out on write | 1,157 x 200 followers | **231,481 timeline inserts/s** |
| Timeline cache (all users) | 300 M x 800 x 8 B | **1.92 TB** in RAM |
| Timeline cache (only active 30%) | | **576 GB** |
| One celebrity post | 50 M followers | **50 M inserts for one post**; at 2,000 inserts/s per worker x 100 workers = **250 s** |

Conclusion: reads dominate 30:1 (34.7 K reads/s vs 1.2 K posts/s), so **do work at write time** (precompute
timelines). But the celebrity row shows fan-out on write breaks for huge accounts: a post would take minutes to reach everyone and
would spike write load. Hence a **hybrid**: fan-out on write for normal users, fan-out on read for celebrities
(their posts are fetched and merged into the timeline at read time).

**API:** `GET /v1/feed?cursor=<opaque>&limit=20` -> `{items:[...], nextCursor}` (cursor, not offset: the list
changes while you scroll; Week 3 / Day 5 notes), `POST /v1/posts`, `POST /v1/users/{id}/follow`.

**Data model:** `posts(post_id, author_id, body, created_at)` (sharded by author or post_id);
`follows(follower_id, followee_id)` indexed both ways; **timeline** = Redis sorted set per user `feed:{userId}` with score =
time (or snowflake id), member = post_id, trimmed to 800; post bodies fetched by id from a post cache/DB (hydration).

**Diagram**

```text
POST /posts -> post service -> posts DB -> queue -> fan-out workers -> Redis feed:{follower} (ZADD, trim 800)
GET /feed   -> feed service -> Redis feed:{me} (ids) + merge celebrity posts (fan-out on read)
                            -> hydrate ids from post cache -> ranking -> response
```

**Deep dive: fan-out workers.** They read the follower list in pages and `ZADD` in batches (pipelining);
the queue gives retries, rate control and backpressure; an idempotent `ZADD` makes retries safe; skip fan-out
to inactive users (not seen for 30 days) to cut the cache from 1.92 TB to 576 GB.

**Bottlenecks:** hot keys (celebrity post cache), cache memory cost, fan-out lag during a spike (monitor queue age),
follow graph size, ranking latency, and cold-start (rebuild a timeline for a returning user from the follow list, on demand).

### Example 4 - Payments (checkout with an external PSP)

**Requirements.** Accept a payment for an order, never charge twice, never lose a successful charge, support refunds,
reconcile with the provider. Non-functional: **correctness over speed**, durability, auditability; p99 < 3 s (the PSP dominates). Non-goals: card storage (use the PSP's tokenization).

**Estimation** (assumptions: 10 M payments/day, flash-sale peak = 10x average, PSP latency 0.8 s, each payment writes
3 ledger rows of 200 B):

| Quantity | Calculation | Result |
|----------|-------------|--------|
| Payments/s avg | 10 M / 86,400 | **116 /s** |
| Payments/s peak (x10) | | **1,157 /s** |
| In-flight PSP calls at peak | Little: 1,157 x 0.8 s | **926 concurrent calls** (average load: 93) |
| Ledger rows/day | 10 M x 3 | **30 M** rows = **6 GB/day = 2.19 TB/year** |
| Idempotency keys (24 h) | 10 M x 100 B | **1 GB** |

Conclusion: the DB volume is modest (about 3,500 row writes/s at peak: a single well-tuned MySQL primary
copes; keep rows narrow and indexes few). What is dangerous is **926 concurrent outbound calls**: the HTTP client pool, the
PSP's rate limit and your timeouts need sizing from Little's law (C1), and a slow PSP will exhaust sockets unless you have a
timeout, a circuit breaker (B4) and bulkhead around it.

**API:** `POST /v1/payments` with `Idempotency-Key`, body `{orderId, amount, currency, paymentMethodToken}` ->
`202 {paymentId, status: "PENDING"}` or `200` with the final state; `GET /v1/payments/{id}`; `POST /v1/payments/{id}/refunds`;
`POST /webhooks/psp` (signed, idempotent). Amounts are integer minor units, never floats.

**Data model:** `payments(id, order_id, amount_minor, currency, status ENUM(PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED),
psp_reference, idempotency_key UNIQUE(user_id, key), version, created_at)`; `ledger_entries(id, payment_id, account, debit_minor,
credit_minor, created_at)` append-only; `outbox(id, event, payload, sent_at)`. Status changes use conditional updates
(`WHERE status = 'PENDING'`) so a webhook and a poll cannot both "complete" a payment (Lab 2).

**Diagram**

```text
client -> API (idempotency check: INSERT key, UNIQUE) -> payments row PENDING (+ outbox in same TX)
        -> PSP call (timeout 5 s, breaker, no retry without PSP idempotency key) -> update status (conditional)
PSP webhook -> verify signature -> idempotent status update -> ledger entries -> outbox -> events (email, order service)
nightly: reconciliation job compares our payments vs PSP settlement report -> flags mismatches
```

**Deep dive: the ambiguous timeout.** The PSP call times out: did the card get charged? Never guess. Mark
`status = UNKNOWN/PENDING`, **query the PSP by our idempotency key/reference** (or wait for its webhook), and
reconcile. Pass our idempotency key to the PSP so a retry cannot double charge (B3). Use the outbox so "payment
captured" and "send receipt/ship order" cannot disagree (B7). The rest is the Week 7 / Day 4 flow.

**Bottlenecks:** the PSP (latency, rate limits, outages: circuit breaker plus a second PSP for failover), the
`payments` hot rows during a flash sale on one product's stock (Lab 2: atomic conditional UPDATE or queue), webhook bursts,
reconciliation lag, and the DB primary as the single writer (plan: read replicas for dashboards, partitioning by
date for ledger archival).

**Raw calculator output** (`calc.mjs`, so you can check every number above):

```text
--- URL shortener
writes/s 38.6 reads/s 3858 peak reads/s (x3) 11574
records in 5y 6.00G storage 3.00TB
base62 7 chars 3.52T 6 chars 56.80G
reads/day 333.33M | hot set = 10% of 1 year of records x 500B = 60.00GB
egress redirect 400B x peak 4.63MB/s
--- chat
msgs/day 2.00G avg/s 23148 peak x3 69444 storage/day @200B 400.00GB per year 146.00TB
concurrent conns 5.00M servers @50k conns 100 mem @10KB/conn 50.00GB
--- feed
feed reads/day 3.00G avg/s 34722 peak x3 104167
posts/s 1157 fanout-on-write @200 followers 231481 inserts/s
timeline cache 800 ids x 8B x 300M users 1.92TB  only active 30%: 576.00GB
celebrity 50M followers x 1 post =  50.00M inserts for ONE post; at 2000 inserts/s per shard worker x 100 workers = 250 s
--- payments
avg tps 116 peak x10 1157
ledger rows/day @3 rows 30.00M size/day @200B 6.00GB per year 2.19TB
idempotency keys 24h @100B 1.00GB
PSP latency 0.8s: in-flight at peak (Little) 926  at avg 93
```

**Frontend connection.** The feed's cursor pagination, the chat's optimistic "sending..." bubble and the payment page's
"pending" status are the user-visible faces of the eventual-consistency, idempotency and async choices above.

**Common mistakes**

- Jumping to Kafka/microservices before computing that 38 writes/s fits on one MySQL primary.
- Forgetting peak vs average, replication factor, or retention in storage math.
- Designing a feed or chat without the one number that decides the design (celebrity fan-out; concurrent connections).
- Not stating assumptions; not saying what you would cut at 10x.

**Interview answer (how to open any design question):** "Let me clarify requirements and non-goals first, then do rough
numbers: users, requests per second average and peak, read:write ratio and storage over the retention period. The numbers
tell me what is hard: for a URL shortener it is the read path and the click counting, for a feed it is fan-out of celebrity
posts, for chat it is millions of open connections, for payments it is correctness under retries. Then I sketch API and data
model, the request path, one or two deep dives, and finish with the first bottleneck at 10x load."

**Follow-ups**

1. *Your URL shortener doubles in traffic: what breaks first?* The cache hit ratio and the Redis memory (hot set), then the DB
   read replicas; writes (38/s) will not be the problem.
2. *Why not store the feed only on read?* 104 K feed loads/s each joining followees' recent posts would hit the DB too hard; precomputation trades storage for latency.
3. *How do you shard chat messages?* By conversation_id, so a conversation's messages are one partition (ordered, range-scannable);
   a user's inbox list is a separate structure.
4. *How do you handle a flash-sale on one SKU?* The hot row problem (Lab 2): atomic conditional UPDATE, or a queue per SKU with one consumer, or pre-allocated stock tokens in Redis.

**Key concepts:** average vs peak, read:write ratio, hot set, fan-out on write vs read, partition key, idempotency key, ambiguous timeout, reconciliation.

**Revision questions**

1. Redo the URL-shortener storage for 1 billion URLs per month: what changes in the design?
2. Why is chat storage partitioned by conversation_id?
3. Compute timeline-cache memory if each entry is 16 bytes and you keep 500 posts for 100 M users.
4. How many concurrent PSP calls at peak if latency rises to 3 s?
5. Which single number decided the feed's hybrid design?

**Practical task:** pick one more system (Uber dispatch or notifications) and fill the framework table in 30 minutes
with a stated assumption list and a calculator script that prints every number.

- [ ] I can run the 7-step framework without notes
- [ ] I computed each example myself before reading the answer
- [ ] I can name the deciding number in each of the four systems

---

## C3 - SLOs and error-budget math `[ESSENTIAL]`

**Goal:** turn "99.9% uptime" into minutes, decide what to alert on, and see why dependencies lower your ceiling.

**Concept.**

- **SLI** (indicator): a measured ratio, e.g. `good requests / valid requests` (availability) or `requests faster than 300 ms / all requests` (latency).
- **SLO** (objective): the target for the SLI over a window, e.g. 99.9% over 30 days.
- **SLA:** a contract with penalties, usually looser than the SLO.
- **Error budget:** `1 - SLO`. It is the amount of unreliability you are *allowed* to spend on deploys, experiments and incidents.
  If budget remains, ship faster; if it is gone, slow down and fix reliability.

**Downtime allowed per 30 days and per year** (`calc.mjs`):

```text
99% budget/30d = 7.20 h  per year 87.60 h
99.5% budget/30d = 3.60 h  per year 43.80 h
99.9% budget/30d = 43.20 min  per year 8.76 h
99.95% budget/30d = 21.60 min  per year 4.38 h
99.99% budget/30d = 4.32 min  per year 0.88 h
99.999% budget/30d = 25.9 s  per year 0.09 h
5 hard deps each 99.9 in series -> 99.501% => budget 3.59 h/30d
burn 14.4x for 1h consumes 2.0 % of 30d budget; 6x for 6h 5.0 %; 1x for 3d 10.0 %
request-based: 99.9% of 100M req/month =  100.00K failed requests allowed
```

**Request-based budget:** at 100 M requests/month, a 99.9% SLO allows **100,000 failed requests** per month. A
request-based SLI is usually better than time-based: an outage at 3 a.m. costs less than the same one at peak.

**Dependencies lower your ceiling.** If a request needs 5 hard dependencies, each 99.9% available, and failures
are independent: `0.999^5 = 99.501%`, i.e. **3.59 hours of budget per 30 days** instead of 43 minutes. To promise
99.9% you need hard dependencies at 99.99%, or you must make them soft (timeouts, fallbacks, breakers, caching, queues: B4).

**Burn rate and alerting.** Burn rate = how fast you consume budget relative to the rate that would use it exactly over the window.
A burn rate of 1 uses the whole 30-day budget in 30 days. Page on fast burn, ticket on slow burn:

| Alert | Burn rate | Window | Budget consumed | Action |
|-------|-----------|--------|-----------------|--------|
| fast burn | 14.4x | 1 hour | 2.0% of the 30-day budget | page now |
| medium burn | 6x | 6 hours | 5.0% | page / urgent ticket |
| slow burn | 1x | 3 days | 10.0% | ticket |

(`14.4 x 1 h / 720 h = 2.0%`; `6 x 6 / 720 = 5.0%`; `1 x 72 / 720 = 10.0%`, as printed by `calc.mjs`.)
Alerting on symptoms (error ratio burning the budget) rather than causes (CPU 85%) reduces alert fatigue;
use multi-window alerts (long window to confirm, short window to detect recovery) to avoid flapping.
Tool details: 15_Observability_Cloud_CICD.md.

**Examples of good SLIs for this file's systems**

| System | Availability SLI | Latency SLI | Other |
|--------|-----------------|-------------|-------|
| URL shortener | redirects returning 3xx / valid redirects | 99% of redirects < 100 ms | correctness: 0 wrong redirects |
| Chat | messages accepted and delivered within 5 s / sent | p99 delivery < 500 ms | message loss = 0 (a stricter, separate objective) |
| Feed | feed requests returning 200 | 95% < 300 ms | freshness: new post visible in < 10 s for 99% |
| Payments | payment attempts reaching a terminal state correctly | p99 < 3 s | **double charges = 0**, reconciliation mismatches < 0.01% |

**Frontend connection.** Real-user monitoring (page load, error rate in the browser) is the best source for an
SLI because it measures what the user saw, including the CDN and network.

**Failure prevented / introduced / cost**

| | |
|--|--|
| Prevents | arguments by opinion ("is the site reliable?"), over-investing in nines nobody needs, shipping during a reliability crisis |
| Introduces | the risk of choosing a wrong SLI (green dashboard, unhappy users); gaming metrics |
| Cost | instrumentation, a team agreement, review time; each extra nine multiplies cost |

**Common mistakes**

- Promising 99.99% without redundancy that makes it possible (multi-AZ, no single points of failure).
- Measuring uptime with a health-check ping instead of real user requests.
- An SLO of 100% (no budget = no change allowed).
- Counting planned maintenance as free when users still see failures.
- Averaging availability across different customers or regions and hiding one bad region.

**Interview answer:** "An SLO is a target for a user-visible indicator over a window; the error budget is one minus
the SLO. 99.9% over 30 days is about 43 minutes of full outage or 0.1% of requests. If the budget is healthy we ship
more; if it is burning we stop feature work. I alert on burn rate, for example 14.4 times over one hour
paging, because that detects real user pain early and is less noisy than cause-based alerts. I also remember that
five hard dependencies at 99.9% each give me only 99.5%, so I decouple them with timeouts, breakers and fallbacks."

**Follow-ups**

1. *Difference between SLO and SLA?* The SLA is a contractual promise with penalties; the SLO is the internal, stricter target.
2. *What if the budget is exhausted?* Freeze risky changes, prioritise reliability work until the window recovers.
3. *How many nines for a payments API?* Enough that outages are rarer than your business tolerates, usually 99.9-99.95% for
   the API, but **correctness SLOs (no double charge) are separate and much stricter**.

**Key concepts:** SLI, SLO, SLA, error budget, burn rate, multi-window alert, hard vs soft dependency.

**Revision questions**

1. Compute the monthly budget for 99.95%.
2. What does a burn rate of 6 over 6 hours mean?
3. Why does adding dependencies reduce availability and what are three mitigations?
4. Give an SLI that measures correctness, not just uptime.

**Practical task:** write an SLO document for the Task API in 10 lines: two SLIs, targets, window, error budget in
minutes and in requests (assume 5 M requests/month), and the two burn-rate alerts you would configure.

- [ ] I can convert any "number of nines" to minutes per month
- [ ] I can explain burn rate and the 14.4x / 6x / 1x alerts
- [ ] I can state the ceiling effect of dependencies

---
## Interview questions with answers (Q-CONC-01 to Q-CONC-42) `[ESSENTIAL]`

Answers are written to be said in about 30 to 60 seconds. Numbers quoted are from the labs above; say "in my
test on a laptop" when you use them.

**Concurrency (Part A)**

**Q-CONC-01. Node is single-threaded: can it have race conditions?**
Yes. The race is between interleaved requests, not threads. Any `await` between a check and the action that
depends on it lets other requests run and invalidate the check. In Lab 1, 20 buyers bought 5 tickets with zero
threads involved. Fix: make check+act atomic in the data store, or serialise with a mutex/queue (single process only).

**Q-CONC-02. Concurrency vs parallelism?**
Concurrency is structure: many tasks in progress, interleaved (one cook switching between pans). Parallelism is
execution: tasks running at the same instant on several cores (several cooks). Node gives concurrency for I/O on one
thread; parallelism needs worker threads, child processes or cluster.

**Q-CONC-03. What is a race condition and what three ingredients does it need?**
Shared mutable state, a gap between reading and writing that depends on that read, and interleaving between actors.
Remove any one: no sharing (partition/immutability), no gap (atomic operation), or no interleaving (lock/queue).

**Q-CONC-04. How do you prevent lost updates in MySQL?**
Atomic statement (`SET n = n + 1`, `SET stock = stock - 1 WHERE stock > 0`), pessimistic `SELECT ... FOR UPDATE` in a
transaction, or optimistic version column with retry. In my test (10,000 concurrent increments) the naive read-modify-write ended at 2;
atomic and `FOR UPDATE` ended at 10,000.

**Q-CONC-05. Atomic UPDATE vs `SELECT FOR UPDATE`, which and why?**
Prefer the atomic UPDATE when the change is expressible in SQL: one statement, lock held for the shortest time (313
updates/s vs 76/s on the same hot row in my run). Use `FOR UPDATE` when you must read, make a decision in application code, and write.

**Q-CONC-06. When is optimistic locking a bad idea?**
On hot rows. Every conflict costs a retry and each retry re-reads; in my run 200 updaters caused 11,262 retries, and with 2,000 contenders only 106 had
succeeded after almost 9 minutes. It shines when conflicts are rare and you cannot hold locks across user think time (edit forms).

**Q-CONC-07. 10,000 users update the same record at once: what happens?**
Node accepts them all (waiting is cheap); the DB pool lets 50 through and queues the rest; at the DB the row lock serialises the
writers, so throughput is `1 / lock hold time` regardless of pool size; correctness depends on the SQL pattern (naive: lost updates with 200 OK; atomic: exact); the last user waits
`N / throughput` (32 s in my test); timeouts then trigger retries and duplicates unless idempotent. Mitigations: atomic SQL, short transactions,
bounded queue with 429, idempotency keys, sharded counters or a single-writer queue.

**Q-CONC-08. Why does a bigger connection pool not speed up a hot-row update?**
The bottleneck is the row lock queue inside InnoDB. More connections only add waiters, memory and context switching. In my runs
pool 5, 10 and 50 finished within the same order of magnitude of time.

**Q-CONC-09. What are the four conditions of deadlock and how do you prevent it?**
Mutual exclusion, hold-and-wait, no preemption, circular wait. Prevent by breaking one: acquire locks in a global order (breaks circular wait),
use timeouts, or acquire all at once. In MySQL: lock rows in id order, keep transactions short, and **retry on error 1213**.

**Q-CONC-10. What does MySQL do on a deadlock?**
InnoDB detects the cycle and rolls back one victim transaction with `ER_LOCK_DEADLOCK (1213)`; the other proceeds. The application
must retry the whole transaction. Deadlocks are expected under concurrency, so retry logic is mandatory.

**Q-CONC-11. How does `SharedArrayBuffer` + `Atomics` differ from message passing?**
Messages copy data (safe by default, no sharing). SAB shares raw memory between threads: fast, but you now face data races. `Atomics.add`/`compareExchange` make single-slot
read-modify-write indivisible. In my test four workers lost 63% of 8M increments with plain `++` and none with `Atomics.add` (but about 5x slower).

**Q-CONC-12. How do you implement a mutex with promises?**
Keep a FIFO queue of resolvers. `acquire()` returns a resolved promise if free, otherwise parks a resolver; `release()` resolves the next waiter (or frees the permit).
Wrap use in `try/finally`. A semaphore(n) is the same with n permits; mutex = semaphore(1).

**Q-CONC-13. Why must `release()` be in `finally`?**
If the critical section throws, a missing release leaves the lock held for ever and every waiter hangs: a self-inflicted outage.

**Q-CONC-14. How would you design a bounded worker pool with graceful shutdown?**
Concurrency limit, bounded queue (reject when full: backpressure), per-task result promise, `drain(timeout)`: stop accepting, let in-flight and queued
tasks finish, race against a deadline, then exit. Wire it to SIGTERM after `server.close()`. Lab 4 shows 12 submitted tasks -> 3 running, 5 queued, 4 rejected.

**Q-CONC-15. How do you detect and avoid blocking the event loop?**
Detect: `perf_hooks.monitorEventLoopDelay` (alert on p99), APM, CPU profile. Avoid: no sync fs/crypto in handlers, stream big payloads, bound regex and JSON sizes, offload CPU
to worker threads or another service. In my demo a 7 ms ping became 1,288 ms during `fib(40)` on the main thread and 3 ms with the work in a worker.

**Q-CONC-16. Event loop vs thread pool vs worker threads vs cluster?**
Event loop: runs your JS and dispatches I/O completions. libuv thread pool (default 4): fs, dns.lookup, some crypto, zlib. Worker threads: your CPU-heavy JS in parallel,
with their own event loop and heap. Cluster/PM2: several processes to use all cores for request handling. Failure modes: blocked loop; pool starvation (4 slow fs/crypto calls block others); worker explosion if you spawn per request; memory multiplied per process.

**Q-CONC-17. Does a slow database query block the event loop?**
No. Awaiting I/O frees the loop. It holds a pool connection and the request's memory. Processing a huge result in JS does block the loop.

**Part B (distributed systems)**

**Q-CONC-18. Explain CAP without saying "pick two".**
When a network partition occurs, a replicated system must choose between consistency (refuse some requests so everyone sees the latest write) and
availability (answer from every node and risk divergence). Partitions cannot be ruled out, so the choice is C or A during a partition; otherwise the trade is latency vs consistency.

**Q-CONC-19. CP or AP for a seat-booking system? For a "likes" counter?**
Seats: CP. Two owners of a seat is worse than an error. Likes: AP with a mergeable structure (CRDT counter), since a briefly wrong count is harmless. My sim showed AP silently dropped Alice's booking under last-write-wins.

**Q-CONC-20. What is eventual consistency and how do you handle read-your-writes?**
Replicas/caches converge if writes stop, but reads may be stale meanwhile. For read-your-writes: read from primary for a short time after a user's write, return the new
state in the write response, use version/LSN tokens, or show a pending state in the UI.

**Q-CONC-21. What is a quorum?**
With N replicas, write to W and read from R such that `R + W > N`; read and write sets overlap, so a read sees the latest acknowledged write (N=3, W=2, R=2). It also is
why consensus needs a majority.

**Q-CONC-22. Explain Raft leader election.**
Followers expect heartbeats; after a randomised 150-300 ms silence a follower increments the term, votes for itself and requests votes. Each node votes once per term and only for
a candidate whose log is at least as up to date. A majority wins; a higher term in any message makes a node step down. Committed entries (on a majority) survive failover.
My 5-node simulation re-elected a leader about 200 ms after a crash and a minority-partitioned leader could not commit.

**Q-CONC-23. Why odd numbers of nodes?**
Majority of 4 is 3, so 4 nodes tolerate 1 failure, same as 3. The extra node adds cost and a bit of latency without adding fault tolerance. 5 nodes tolerate 2.

**Q-CONC-24. What is split brain and how does consensus prevent it?**
Two nodes both act as leader and accept conflicting writes. Raft prevents it: a leader needs a majority to commit, two majorities overlap, and stale leaders
step down upon seeing a higher term.

**Q-CONC-25. What is an idempotency key and where is it stored?**
A client-generated unique id for one logical operation, sent on each retry. The server stores `key -> response` (UNIQUE constraint, in the same transaction as the side effect, for a retention longer
than the retry window) and returns the stored response on repeats. Without it my payment demo charged 3 times after two timeouts.

**Q-CONC-26. How should retries be done?**
Only transient errors, only idempotent (or keyed) operations, exponential backoff with full jitter, 2-3 attempts, a retry budget (about 10% extra load), respect `Retry-After`, and retry in a single layer.
Otherwise you get retry storms: in my toy model naive retries kept load at 2x capacity long after the outage ended.

**Q-CONC-27. How do you choose timeouts?**
Above the dependency's p99 under normal load, below your caller's timeout; timeouts decrease down the call chain; propagate deadlines. Every network call needs one. A timeout means "unknown", not "failed".

**Q-CONC-28. How does a circuit breaker work and when would you not use one?**
Closed -> after N failures opens (fail fast) -> after cool-down half-open lets a probe through -> closes on success. It stops cascading failure and resource exhaustion. Not useful for calls that
are cheap and in-process, or when failing fast is worse than waiting and there is no fallback; and never count 4xx as failures.

**Q-CONC-29. What is backpressure and name three ways to implement it?**
Letting a slow consumer limit a fast producer. (1) Bounded queues with rejection (429/503), (2) blocking/pausing the producer (stream `write()` returning false, `pause()`), (3) credit-based or pull-based consumption (consumer asks for N more). The unbounded alternative
grew to 1,600 queued messages in my 2-second demo.

**Q-CONC-30. How do you build a distributed lock on Redis and what can go wrong?**
`SET key token NX PX ttl`; release with a Lua compare-and-delete. Problems: lease expiry while the holder is paused (two holders), plain-DEL releasing someone else's lock, Redis failover losing the key,
clock/timing assumptions. Mitigations: fencing tokens checked by the resource, renewal watchdog, and using DB constraints for correctness-critical work.

**Q-CONC-31. Why is Redlock controversial?**
It assumes bounded clock drift, network delay and process pauses; with GC pauses or skew two clients can both think they hold the lock, and it provides no fencing token. Critics (Kleppmann) say use it for efficiency only
and use a consensus system or the database for correctness; the Redis author argues its assumptions are reasonable in practice. Know both sides.

**Q-CONC-32. What is a fencing token?**
A monotonically increasing number issued with each lock grant; the protected resource rejects writes with a token lower than the highest it has seen. It makes a stale lock holder harmless even if the lock service was wrong. Demo: A (token 1) rejected after B (token 2) wrote.

**Q-CONC-33. How do you do leader election with Redis or a DB?**
A lease: `SET NX PX` or a conditional UPDATE on a lease row; the leader renews every ttl/3; on failed renewal it stops leading immediately. Failover time is bounded by the TTL (about 588 ms gap in my demo with a 600 ms TTL). For correctness-critical election use etcd/ZooKeeper/Kubernetes Leases and fence leader writes with an epoch.

**Q-CONC-34. Saga: orchestration vs choreography?**
Orchestration: a coordinator drives steps and compensations (clear flow, one place to monitor, a component to make durable). Choreography: services react to each other's events (loose coupling, flow is implicit, harder to debug). Choose orchestration for multi-step money flows, choreography for simple fan-out.

**Q-CONC-35. Why is 2PC avoided between microservices?**
After voting YES a participant must hold locks until the coordinator decides; if the coordinator crashes everyone blocks (my demo: both rows `PREPARED/locked`). It adds round trips and forced writes, lowers availability to the product of all participants, and external APIs (PSPs) cannot participate. Sagas with idempotent steps and an outbox are preferred.

**Q-CONC-36. What is the transactional outbox?**
Write the state change and an `outbox` row in the same local DB transaction; a relay publishes unsent rows to the broker and marks them sent. It solves the dual-write problem (state saved but message lost) with at-least-once delivery, so consumers must be idempotent.

**Part C (capacity and SLOs)**

**Q-CONC-37. State Little's law and use it to size a DB pool.**
`L = lambda x W`: average in-flight = arrival rate x time in system. 500 queries/s at 40 ms means 20 connections busy on average; with a x2 headroom about 40, capped by what the DB can run in parallel. More is just queueing.

**Q-CONC-38. Why does latency explode near full utilisation?**
Queueing: random arrivals and variable service times cause bursts that a nearly full server cannot absorb. In my simulation mean latency went 121 ms (80% utilisation) -> 497 ms (98%) with 100 ms jobs; above 100% the queue grows without bound. Plan for 50-70% at peak.

**Q-CONC-39. Estimate storage and QPS for a URL shortener with 100 M new URLs/month.**
Writes 100 M / 2.6 M s = about 39/s; with 100:1 reads about 3.9 K/s average, about 12 K/s peak; 500 B x 6 G records over 5 years = 3 TB; 7 base62 characters (3.5 T codes); hot set about 60 GB cache. Design implication: single MySQL primary for writes; cache + replicas for reads; async click counting.

**Q-CONC-40. Fan-out on write vs on read for a feed?**
Write: precompute each follower's timeline (fast reads, expensive writes: 231 K inserts/s at 200 followers avg; a celebrity post means 50 M inserts). Read: merge at request time (cheap writes, slow reads). Hybrid: write for normal users, read for celebrities.

**Q-CONC-41. Convert 99.9% to downtime and explain an error budget.**
0.1% of 30 days = 43.2 minutes (or 100,000 failed requests per 100 M). The budget is what you may spend on risk; when exhausted, prioritise reliability over features. Alert on burn rate (14.4x over 1 hour pages).

**Q-CONC-42. Five dependencies, each 99.9%: what is your availability ceiling?**
`0.999^5 = 99.5%`, about 3.6 hours per month. Mitigate with timeouts, fallbacks, caching, circuit breakers and by making dependencies asynchronous or optional.

---

## Summary

- Part A: concurrency bugs are not about threads, they are about **gaps between check and act**. You reproduced them in one
  Node process (20 sold of 5), in MySQL (2 of 10,000 survived the naive pattern), and in real threads (63% of increments lost),
  and fixed each with an atomic operation. Measured: the atomic UPDATE did 313 updates/s on one hot row, `FOR UPDATE` 76/s, optimistic
  locking collapsed under contention. A single hot row is a serial resource: the pool size does not matter, the lock hold time does.
- Part A also gave you a bounded pool with drain, a promise mutex/semaphore with a deadlock, and an event-loop-delay measurement
  (7 ms -> 1,288 ms).
- Part B: for each of the 12 topics you can say what it prevents, what it introduces and what it costs (B8 table). Retries need idempotency;
  breakers and bounded queues stop cascades; a lease lock needs fencing; consensus buys safety with a majority; sagas replace 2PC across services.
- Part C: Little's law links latency, throughput and concurrency exactly; latency has a knee near 80-90% utilisation; the numbers (38 writes/s, 11.6 K reads/s,
  3 TB; 5 M connections; 231 K inserts/s; 926 concurrent PSP calls) decide the design before any box is drawn; a 99.9% SLO is 43 minutes per month.

---

## Assessment (mixed difficulty)

**Basic**

1. A Node handler does `const n = await db.get(); await db.set(n - 1);`. Name the bug and one fix.
2. What does `Atomics.add` guarantee that `view[0]++` does not?
3. Compute the monthly downtime allowed by a 99.99% SLO.
4. Why must every outgoing network call have a timeout?
5. Which of GET, PUT, POST is idempotent by definition?

**Intermediate**

6. 10,000 concurrent requests increment one MySQL row through a pool of 50. Which approach ends with the exact value and why is a pool of 200 no faster?
7. You see MySQL error 1213 in the logs. What is it and what must the code do?
8. Your service gets 400 req/s; each request holds a DB connection for 25 ms. How many connections are busy on average and what pool size would you choose?
9. A client retries a `POST /charge` after a timeout. Give the two ways this can go wrong and the fix.
10. Why does a Redis lock need a token and a Lua release?

**Advanced**

11. Explain why a lease-based lock cannot be made safe on its own and what fixes it.
12. In a 5-node Raft cluster, 2 nodes (one is the leader) are partitioned from the other 3. Which side can commit writes, what happens to an entry the old leader appended, and what happens after healing?
13. Design the order checkout (stock, payment, confirm) without 2PC: name the pattern, the state storage, the reliability mechanism for events and the handling of an ambiguous PSP timeout.
14. Estimate: 20 M DAU, 5 messages/user/day, 300 B per message, 3x replication. Messages per second (average and x3 peak) and storage per year.
15. At 80% vs 98% utilisation the mean latency of a 100 ms service was 121 ms vs 497 ms. What operational policy follows?

### Answers

1. Check-then-act race: two requests read the same `n` and both write `n-1`. Fix: `UPDATE ... SET n = n - 1 WHERE id=? AND n > 0` and check `affectedRows`; or a transaction with `SELECT ... FOR UPDATE`; or a mutex (single process only).
2. It performs the read-modify-write as one indivisible operation, so concurrent threads cannot interleave between the read and the write; plain `++` is three steps and loses updates.
3. 30 days x 24 x 60 x 0.0001 = 4.32 minutes.
4. Without a timeout a hung dependency holds sockets, memory and pool slots indefinitely, exhausting the caller (cascading failure). The timeout converts hanging into a handled error.
5. GET and PUT. POST is not (unless given an idempotency key).
6. The atomic `UPDATE n = n + 1` (or `FOR UPDATE`, slower): both serialise on the row lock and end at 10,000; the naive read-then-write ended at 2. A pool of 200 adds waiters, not throughput: throughput is `1 / lock hold time`.
7. `ER_LOCK_DEADLOCK`: InnoDB found a cycle and rolled back this transaction. The app must retry the entire transaction (bounded attempts); prevention: consistent lock ordering and short transactions.
8. `400 x 0.025 = 10` busy connections on average. Choose about 20-25 (x2 headroom for peaks), never above what the DB can serve in parallel, then load-test.
9. (a) The first attempt succeeded and the response was lost: the retry double-charges. (b) The first attempt never arrived and no retry means no charge. Fix: a client-created idempotency key stored server-side with a unique constraint (and forwarded to the PSP), retries with backoff and jitter, and a status lookup for ambiguous cases.
10. The token identifies the owner so only the owner can release; GET-then-DEL from the client is not atomic (the lock could expire and be re-acquired in between), so compare-and-delete must run atomically on Redis as a Lua script. Demo: plain DEL let a third client in.
11. A holder can pause (GC, network) past its lease and still act believing it owns the lock; no lock-side check can stop that. Fix: fencing tokens validated by the protected resource (monotonic number; resource rejects older), or avoid the lock with a DB constraint/conditional update.
12. Only the 3-node majority side can elect a leader (term+1) and commit. The old leader can append but never reaches a majority, so its entry is uncommitted; after healing it sees the higher term, steps down and its uncommitted entry is overwritten by the new leader's log; acknowledged writes are never lost.
13. Saga (orchestrated): reserve stock -> charge -> confirm with compensations (release, refund). Orchestrator state in a durable table; events via the transactional outbox; all steps idempotent with idempotency keys; for an ambiguous PSP timeout mark the payment PENDING, query the PSP by our key/reference or wait for the webhook, then reconcile; PENDING stock reservations expire.
14. 20 M x 5 = 100 M messages/day = 1,157/s average, about 3,500/s at x3 peak. Storage: 100 M x 300 B = 30 GB/day = 10.95 TB/year, x3 replicas = about 33 TB/year.
15. Run capacity so peak utilisation stays around 50-70%, autoscale on utilisation/queue depth before the knee, bound queues and shed load above the capacity, and alert on p99 latency and saturation rather than CPU alone.

**Weak-area guide:** if you missed 1, 2, 6 or 7, redo Labs 1-3 and Lab 2's deadlock; 4, 9 or 10 -> B3 and B5; 11-13 -> B5, B2, B7; 3, 8, 14, 15 -> Part C
(redo each calculation with a script before reading the answer).

---

## Hours estimate

| Module | Hours |
|--------|-------|
| Lab 0 - Setup | 0.5 |
| Lab 1 - Race in one Node process | 1.0 |
| Lab 2 - MySQL lost update and deadlock | 2.0 |
| Lab 3 - SharedArrayBuffer + Atomics | 1.0 |
| Lab 4 - Bounded pool with graceful drain | 1.5 |
| Lab 5 - Mutex, semaphore, deadlock | 1.5 |
| Lab 6 - Blocking the event loop | 1.0 |
| Lab 7 - The 10,000 users answer | 1.0 |
| B1 - CAP and eventual consistency | 1.5 |
| B2 - Consensus and Raft | 2.0 |
| B3 - Idempotency, retries, timeouts | 2.0 |
| B4 - Circuit breaker and backpressure | 1.5 |
| B5 - Distributed locks | 2.0 |
| B6 - Leader election | 1.0 |
| B7 - Saga and 2PC | 2.0 |
| B8 - Failure ledger | 1.0 |
| C1 - Latency, throughput, Little's law | 1.5 |
| C2 - Back-of-envelope examples | 3.0 |
| C3 - SLOs and error budgets | 1.0 |
| Interview questions and assessment | 2.0 |
| **Total** | **about 30 hours** |

Roadmap mapping: Days 50-56 = Labs 0-7 (about 9.5 h plus revision); Days 57-63 = C1-C3 (about 5.5 h) and B1; Days 64-70 = B1-B8
(about 13 h). Suggested split: 2 hours per day, so stretch over about 15 study days, not 21; do the labs by typing them, not pasting.

---

## Not verified / limits (read this honestly)

- **Everything shown with "Real output" was executed on Node v20.20.1, MySQL 8.0.46 and Redis 7 in Docker Desktop on Windows 11.** Absolute timings
  (ms, updates/s) are specific to that laptop and to the non-default MySQL durability flags `--innodb-flush-log-at-trx-commit=2 --skip-log-bin`; the shapes are what matters.
- **Optimistic locking at 10,000 updates was not completed.** I ran 200 (both pool sizes) and a 2,000 run that I stopped after about 8 minutes 50 seconds with 106 successes. The 10,000 case is an extrapolation of a trend, not a measurement.
- `FOR UPDATE` at 10,000 was run once (132.0 s); the pool-size comparison (5/10/50) used 1,000 updates with the binary log on. Atomic and naive were run once at 10,000 with binlog off.
- The naive-update final value (1 or 2) varies by run because of connection scheduling; I saw 1 and 2 in different runs.
- The first run of the "durability" box (flush=1 + binlog) was stopped while in progress (n=6611 after about 450 s); the 15 updates/s figure is that partial rate, not a completed benchmark.
- The Raft simulation is a teaching toy (no persistence, no log repair, no membership change); it has been run with 5 nodes and, for the practical task, 3 nodes. It is **not** evidence that Raft is correctly implemented.
- The retry-storm and circuit-breaker numbers come from a toy model (and a timer-based demo whose millisecond totals vary run to run). The 60% overload-goodput factor is an assumption.
- Redis demos used a **single Redis node**; Redlock itself, Redis failover losing a lock, and etcd/ZooKeeper were **not run**: those parts are explanation.
- The capacity estimates depend entirely on the stated assumptions (DAU, ratios, sizes); they are practice numbers, not data from real companies.
- Web claims about the Kleppmann/Sanfilippo Redlock debate, Stripe's 24-hour idempotency window and MySQL XA persistence are from my knowledge and were not re-checked online during this session.
- Containers used (`cd-mysql` on 33068, `cd-redis` on 63795) were removed at the end of the session.
