# Week 4 - MySQL and Database Fundamentals (Days 22-28)

Part 04 of the Node.js Backend Interview Preparation Document. Master table of contents and the full 56-day
plan live in `00_Master_Strategy_Schedule.md`. This file covers Week 4: **Day 22 to Day 28** (Week 4 / Day 1 to Day 7).

Primary database for the whole course: **MySQL 8.0+ with the InnoDB storage engine**. Every SQL statement in
this file is valid MySQL 8 syntax. Where a feature needs a minimum version (for example `EXPLAIN ANALYZE` needs
8.0.18, `CHECK` enforcement needs 8.0.16), the version is stated next to it.

Tier markers used below:
- `[ESSENTIAL]` -- asked in most junior/mid backend interviews. Learn these first.
- `[ADVANCED]` -- supplementary, asked in stronger interviews or senior rounds. Do these if time permits.

Honest note: one week is enough to become **interview-comfortable** with SQL, indexes, transactions and
EXPLAIN. It is not enough to become a DBA. Production tuning (replication lag, partitioning, online schema
change) only gets a mention here.

---

## Contents of this file

- Section 0 - Practice schema and sample data (used by every day)
- Day 1 - Relational fundamentals, keys, constraints, relationships, CRUD
- Day 2 - INNER/LEFT JOIN, GROUP BY/HAVING, subqueries
- Day 3 - Normalization, indexes, composite indexes
- Day 4 - Transactions, ACID, isolation levels, concurrency problems
- Day 5 - Deadlocks, locking, connection pooling
- Day 6 - EXPLAIN, query optimization, pagination and DB performance
- Day 7 - Revision, mini project (Stage 3), weekly test
- Week 4 revision summary, mixed-difficulty assessment, answers, weak-area guidance, catch-up plan

Cross references: question bank category `Q-SQL-xx` (file `09_Question_Bank_A.md`), coding exercises
`EX-SQL-xx` and `EX-TXN-xx` (file `11_Coding_Exercises.md`), project `Stage 3` (file `12_Project_Task_API.md`).

---

## Section 0 - Practice schema and sample data

Poore week mein ek hi schema use hoga: `taskdb`. Ye wahi domain hai jo final Task Management API project mein
use hoga, plus ek chhota "payments" side (`accounts`, `orders`) taaki transaction aur money wale demos
realistic lagein. Is section ko ek baar run karo; baad mein jab bhi data bigar jaye, **reset script** dubara run
kar lo.

### How to run MySQL locally

Pick one:

```bash
# Option A: Docker (recommended, nothing installed on your machine)
docker run --name mysql8 -e MYSQL_ROOT_PASSWORD=rootpass -p 3306:3306 -d mysql:8.0
docker exec -it mysql8 mysql -uroot -prootpass

# Option B: native install (MySQL Community Server 8.0 or 8.4 LTS) then:
mysql -uroot -p
```

For the two-session demos (Day 4 and Day 5) open **two terminal windows**, each running the `mysql` client.
Call them **Session A** and **Session B**. Each client connection is one MySQL session with its own
transaction state.

### ER diagram (ASCII)

```
users 1 ----< projects          (projects.owner_id -> users.id)
users 1 ----< tasks             (tasks.assignee_id -> users.id, nullable)
projects 1 ----< tasks          (tasks.project_id -> projects.id, cascade delete)
users >----< projects           via project_members (composite PK)
tasks >----< tags               via task_tags (composite PK)
users 1 ----1 accounts          (accounts.user_id UNIQUE)
users 1 ----< orders
```

### Schema (DDL)

```sql
CREATE DATABASE IF NOT EXISTS taskdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE taskdb;

-- Reset section: safe to re-run any time
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS task_tags, tags, tasks, project_members, projects, orders, accounts, users, tasks_big;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(255)    NOT NULL,
  name        VARCHAR(100)    NOT NULL,
  role        ENUM('admin','manager','member') NOT NULL DEFAULT 'member',
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE projects (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id    BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(150)    NOT NULL,
  status      ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_owner_name (owner_id, name),
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE project_members (
  project_id   BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  member_role  ENUM('lead','contributor') NOT NULL DEFAULT 'contributor',
  joined_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  KEY idx_pm_user (user_id),
  CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tasks (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   BIGINT UNSIGNED NOT NULL,
  assignee_id  BIGINT UNSIGNED NULL,
  title        VARCHAR(200)    NOT NULL,
  status       ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  priority     TINYINT UNSIGNED NOT NULL DEFAULT 3,   -- 1 = most urgent, 5 = least urgent
  due_date     DATE            NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_project  (project_id),
  KEY idx_tasks_assignee (assignee_id),
  CONSTRAINT fk_tasks_project  FOREIGN KEY (project_id)  REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id)    ON DELETE SET NULL,
  CONSTRAINT chk_tasks_priority CHECK (priority BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE tags (
  id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB;

CREATE TABLE task_tags (
  task_id  BIGINT UNSIGNED NOT NULL,
  tag_id   BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  KEY idx_tt_tag (tag_id),
  CONSTRAINT fk_tt_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_tt_tag  FOREIGN KEY (tag_id)  REFERENCES tags (id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payments side (used for transaction / locking demos)
CREATE TABLE accounts (
  id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id  BIGINT UNSIGNED NOT NULL,
  balance  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  version  INT UNSIGNED    NOT NULL DEFAULT 0,          -- used for optimistic locking on Day 4
  PRIMARY KEY (id),
  UNIQUE KEY uq_accounts_user (user_id),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT chk_accounts_balance CHECK (balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  amount      DECIMAL(10,2)   NOT NULL,
  status      ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_user (user_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;
```

Notes on choices (poochhe jaate hain interview mein):
- `BIGINT UNSIGNED AUTO_INCREMENT` primary keys: compact, sequential (good for InnoDB, see Day 3).
- `DECIMAL(12,2)` for money, never `FLOAT`/`DOUBLE`.
- `utf8mb4` is real UTF-8 (the old `utf8` alias is only 3 bytes and cannot store emoji). In MySQL 8 the
  default collation for utf8mb4 is `utf8mb4_0900_ai_ci` (accent- and case-insensitive).
- `CHECK` constraints are enforced from MySQL 8.0.16. On 5.7 they were parsed and silently ignored.

### Sample data

```sql
INSERT INTO users (id, email, name, role, is_active) VALUES
  (1, 'asha@example.com',   'Asha',   'admin',   1),
  (2, 'bilal@example.com',  'Bilal',  'manager', 1),
  (3, 'chitra@example.com', 'Chitra', 'member',  1),
  (4, 'dev@example.com',    'Dev',    'member',  1),
  (5, 'esha@example.com',   'Esha',   'member',  1),
  (6, 'farhan@example.com', 'Farhan', 'member',  0);

INSERT INTO projects (id, owner_id, name, status) VALUES
  (1, 2, 'Website Revamp', 'active'),
  (2, 2, 'Mobile App',     'active'),
  (3, 1, 'Internal Tools', 'active'),
  (4, 1, 'Archived Pilot', 'archived');

INSERT INTO project_members (project_id, user_id, member_role) VALUES
  (1, 2, 'lead'), (1, 3, 'contributor'), (1, 4, 'contributor'),
  (2, 2, 'lead'), (2, 4, 'contributor'), (2, 5, 'contributor'),
  (3, 1, 'lead'), (3, 5, 'contributor');

INSERT INTO tasks (id, project_id, assignee_id, title, status, priority, due_date) VALUES
  (1,  1, 3,    'Design homepage',    'done',        2, '2026-09-10'),
  (2,  1, 3,    'Build login page',   'in_progress', 1, '2026-10-25'),
  (3,  1, 4,    'Set up CI pipeline', 'todo',        3, '2026-10-30'),
  (4,  1, NULL, 'Write copy',         'todo',        4, NULL),
  (5,  1, 4,    'SEO audit',          'done',        3, '2026-09-20'),
  (6,  2, 4,    'Push notifications', 'in_progress', 2, '2026-11-05'),
  (7,  2, 5,    'App store listing',  'todo',        3, '2026-11-15'),
  (8,  2, 5,    'Crash reporting',    'done',        2, '2026-10-01'),
  (9,  2, NULL, 'Offline mode',       'todo',        5, NULL),
  (10, 3, 5,    'Admin dashboard',    'in_progress', 2, '2026-10-28'),
  (11, 3, 1,    'Audit logs',         'todo',        1, '2026-10-22'),
  (12, 3, 5,    'Backup script',      'done',        3, '2026-09-30'),
  (13, 3, NULL, 'Slack bot',          'todo',        4, NULL),
  (14, 1, 3,    'Fix footer bug',     'todo',        1, '2026-10-21');

INSERT INTO tags (id, name) VALUES (1, 'bug'), (2, 'feature'), (3, 'urgent');

INSERT INTO task_tags (task_id, tag_id) VALUES
  (2, 2), (3, 2), (6, 2), (9, 2), (14, 1), (14, 3), (11, 3);

INSERT INTO accounts (id, user_id, balance) VALUES
  (1, 3, 1000.00), (2, 4, 200.00), (3, 5, 50.00);

INSERT INTO orders (id, user_id, amount, status, created_at) VALUES
  (1, 3, 120.00, 'paid',     '2026-09-01 10:00:00'),
  (2, 3,  80.50, 'paid',     '2026-09-15 11:30:00'),
  (3, 4, 200.00, 'paid',     '2026-09-20 09:15:00'),
  (4, 4,  45.00, 'pending',  '2026-10-02 14:00:00'),
  (5, 5, 300.00, 'refunded', '2026-10-05 16:45:00'),
  (6, 5,  75.25, 'paid',     '2026-10-10 12:00:00'),
  (7, 3,  60.00, 'pending',  '2026-10-12 08:20:00');
```

Quick facts about this data (answers neeche in queries isko use karte hain):
- Tasks per assignee: Chitra(3)=3, Dev(4)=3, Esha(5)=4, Asha(1)=1, Bilal(2)=0, Farhan(6)=0, unassigned=3.
- Tasks per project: project 1 has 6 tasks, project 2 has 4, project 3 has 4, project 4 has 0.
- Status per project: P1 = 2 done / 1 in_progress / 3 todo. P2 = 1 / 1 / 2. P3 = 1 / 1 / 2.

Run `SELECT COUNT(*) FROM tasks;` -> 14. If not 14, run the reset block and the inserts again.

---

## Day 1 - Relational fundamentals, keys, constraints, relationships, CRUD (Day 22)

**Estimated time (2 hours):** 30 min concepts (T1.1-T1.3), 25 min setup + run Section 0, 45 min CRUD practice
(T1.4), 20 min revision questions and coding task.

**Learning objectives**
- Explain what a relational database is and why backends use one (structure, integrity, transactions).
- Choose correct data types (money, timestamps, booleans, enums, UUID vs integer ids).
- Define primary key, unique key, foreign key, NOT NULL, DEFAULT, CHECK and explain what each one protects.
- Model one-to-one, one-to-many and many-to-many relationships.
- Write INSERT / SELECT / UPDATE / DELETE safely, including upsert and the effect of foreign key actions.
- Explain NULL semantics (three-valued logic) and the classic `= NULL` mistake.

### T1.1 Relational model, tables, rows, data types [ESSENTIAL]

**Concept.** Relational database mein data **tables** (rows + columns) mein store hota hai. Har table ek
"entity" ko represent karta hai (user, task, order). Tables ke beech relation **keys** se bante hain. SQL
(Structured Query Language) us data ko query/modify karne ki declarative language hai: tum batate ho **kya
chahiye**, database decide karta hai **kaise** nikalna hai (query optimizer).

**Why it matters.** Backend ka zyada kaam "data store karo, data wapas do" hota hai. Relational DB schema
enforce karta hai (types, constraints, foreign keys) aur ACID transactions deta hai. Payments, orders,
inventory jaisi cheezon mein ye guarantees zaroori hain, isliye interviews mein SQL sabse zyada poocha jaata
hai.

**Internal working.** MySQL do layers mein kaam karta hai:
1. **Server layer**: connection handling, parser, optimizer, executor. SQL text -> parse tree -> optimized
   execution plan.
2. **Storage engine layer** (pluggable): **InnoDB** (default since 5.5) stores data. InnoDB gives transactions,
   row-level locking, foreign keys, crash recovery (redo log), MVCC. MyISAM (old) has none of that.

InnoDB stores each table as a **clustered index**: the rows themselves live inside the B+Tree of the primary
key, sorted by PK. (Day 3 mein deep dive.)

**Data type cheat sheet (junior-to-mid interviews):**

| Need | Use | Avoid | Why |
|------|-----|-------|-----|
| Surrogate id | `BIGINT UNSIGNED AUTO_INCREMENT` | random UUID v4 as clustered PK | sequential inserts, small secondary indexes |
| Money | `DECIMAL(12,2)` (or integer paise/cents) | `FLOAT`, `DOUBLE` | binary floats cannot represent 0.1 exactly |
| Timestamp | `DATETIME` or `TIMESTAMP` | strings | range, functions, indexing |
| Boolean | `TINYINT(1)` (or `BOOLEAN` alias) | `VARCHAR('yes')` | compact, indexable |
| Fixed set | `ENUM(...)` or lookup table | free text | validation; lookup table if values change often |
| Text | `VARCHAR(n)`, `TEXT` for long | `TEXT` for short searchable fields | `TEXT` cannot be fully indexed without prefix |
| JSON blob | `JSON` | JSON for data you filter/join on constantly | no FK, weaker optimizer stats |

`DATETIME` vs `TIMESTAMP`: `TIMESTAMP` is stored as UTC and converted to session time zone, range ends at
2038-01-19 (4-byte), `DATETIME` is stored as-is (range to year 9999). Many teams store UTC in `DATETIME` and
convert in the app. Pick one convention and stay consistent.

**Code example.**

```sql
SHOW TABLES;
DESCRIBE tasks;                -- columns, types, keys
SHOW CREATE TABLE tasks\G      -- full DDL including constraints (\G is a mysql-client formatting trick)
SELECT 0.1 + 0.2 = 0.3                                   AS decimal_literals,  -- 1 (exact DECIMAL math)
       CAST(0.1 AS DOUBLE) + CAST(0.2 AS DOUBLE) = 0.3     AS double_math;       -- 0 (binary float error)
```

In JavaScript `0.1 + 0.2 === 0.3` is also `false`, because JS Numbers are binary doubles. That is why `mysql2`
returns a `DECIMAL` column as a **string** by default (so no precision is lost silently). Keep money as a
string/integer paise in the API layer, or use a decimal library; do not `parseFloat` and add.

**Frontend connection.** Table = array of objects with a fixed shape (like a TypeScript interface). A
column's type/constraint is like a PropTypes/Zod schema, but enforced **at the data layer**, so bad data cannot
sneak in even if one API route forgets validation. Index = like a `Map` lookup vs `Array.find` scan.

**Real-world scenario.** A marketplace stores `orders.amount` as `DECIMAL(10,2)`. Reports sum millions of rows;
with `DOUBLE`, totals drift by paise and finance reconciliation fails.

**Interview answer:** "A relational database stores data in tables with a fixed schema and relates them
through keys. I use MySQL with InnoDB because it gives ACID transactions, row-level locking, foreign keys and
crash recovery. I choose types deliberately: DECIMAL for money, sequential BIGINT keys for InnoDB, and
utf8mb4 for text."

**Follow-up questions**
- Q: Why InnoDB over MyISAM? A: Transactions, row-level locks (MyISAM locks the whole table), foreign keys,
  crash-safe redo log, MVCC. MyISAM is legacy.
- Q: DECIMAL vs FLOAT for money? A: DECIMAL is exact fixed-point; FLOAT/DOUBLE are approximate binary
  floats and produce rounding errors. Some systems store integer minor units (paise) instead.
- Q: What is a surrogate key? A: An artificial key (auto-increment id) with no business meaning, as opposed
  to a natural key such as email.

**Common mistakes**
- Using `VARCHAR(255)` for everything, or `utf8` (3-byte) instead of `utf8mb4`.
- Storing money in floats; storing dates as strings.
- Storing comma separated ids in a column (breaks 1NF, cannot join or index, see Day 3).

**Revision notes**
- InnoDB = default engine: ACID, row locks, FK, MVCC, clustered PK.
- Money = DECIMAL. Text = utf8mb4. Ids = sequential BIGINT.
- SQL is declarative; optimizer picks the plan.

### T1.2 Keys and constraints [ESSENTIAL]

**Concept.** Constraint = database ka rule jo bad data ko reject karta hai.

| Constraint | Protects | Example in our schema |
|------------|----------|-----------------------|
| `PRIMARY KEY` | each row uniquely identifiable, NOT NULL | `users.id` |
| `UNIQUE` | no duplicates (NULLs allowed, many) | `users.email`, `accounts.user_id` |
| `FOREIGN KEY` | child must reference an existing parent | `tasks.project_id -> projects.id` |
| `NOT NULL` | value must be present | `tasks.title` |
| `DEFAULT` | value if omitted | `tasks.status = 'todo'` |
| `CHECK` (8.0.16+) | custom rule per row | `priority BETWEEN 1 AND 5` |

**Why it matters.** Application validation (Joi/Zod in Express) can be bypassed: a second service, a
migration script, a race between two requests. Constraints are the **last line of defense**. A unique email
check done only in JS ("SELECT first, then INSERT") has a race condition; only the UNIQUE index is safe.

**Internal working.**
- PRIMARY KEY in InnoDB becomes the clustered index. If you do not declare one, InnoDB invents a hidden
  6-byte row id (worse: you cannot use it in queries).
- UNIQUE creates a unique **secondary index**; an INSERT of a duplicate fails with error 1062
  (`ER_DUP_ENTRY`).
- FOREIGN KEY: InnoDB checks parent existence on child insert/update and checks children on parent
  delete/update. It needs an index on the FK column (it creates one automatically if you did not).
- Referential actions (`ON DELETE`): `RESTRICT`/`NO ACTION` (default, block the delete), `CASCADE` (delete
  children), `SET NULL` (null the FK; column must be nullable), `SET DEFAULT` (not supported by InnoDB).

**Code example (run these and read the errors).**

```sql
-- 1. UNIQUE violation
INSERT INTO users (email, name) VALUES ('asha@example.com', 'Duplicate Asha');
-- ERROR 1062 (23000): Duplicate entry 'asha@example.com' for key 'users.uq_users_email'

-- 2. FOREIGN KEY violation (project 99 does not exist)
INSERT INTO tasks (project_id, title) VALUES (99, 'Orphan task');
-- ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails ...

-- 3. CHECK violation (MySQL 8.0.16+)
INSERT INTO tasks (project_id, title, priority) VALUES (1, 'Bad priority', 9);
-- ERROR 3819 (HY000): Check constraint 'chk_tasks_priority' is violated.

-- 4. Parent delete blocked by RESTRICT (projects.owner_id has no ON DELETE action)
DELETE FROM users WHERE id = 2;
-- ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails ...

-- 5. CASCADE and SET NULL in action (inside a transaction so we can undo)
START TRANSACTION;
DELETE FROM projects WHERE id = 3;                -- tasks 10..13 deleted by CASCADE
SELECT COUNT(*) FROM tasks WHERE project_id = 3;  -- 0
ROLLBACK;                                         -- everything comes back

START TRANSACTION;
DELETE FROM users WHERE id = 6;                   -- Farhan has no tasks/projects: fine
ROLLBACK;
```

In Node (mysql2) you detect these by `err.code`/`err.errno`:

```js
// src/db/errors.js
export function isDuplicateEntry(err) {
  return err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062;
}
export function isForeignKeyViolation(err) {
  return err?.errno === 1452 || err?.errno === 1451;
}
```

Express error handler maps `ER_DUP_ENTRY` to `409 Conflict`, FK violation to `409` or `422`, never leaks the raw
SQL message to the client.

**Frontend connection.** Constraints are like `required`, `pattern`, `min/max` on an HTML form -- but
server-side and unbypassable. FK is like a `<select>` that can only submit values from the option list.

**Real-world scenario.** Signup API: two users hit "register" with the same email in the same millisecond.
`SELECT ... WHERE email=?` then `INSERT` lets both pass the check. With `UNIQUE (email)` the second INSERT
fails with 1062 and the API returns 409. The DB resolves the race.

**Interview answer:** "A primary key uniquely identifies a row; in InnoDB it is also the clustered index.
Unique constraints stop duplicates, foreign keys protect referential integrity between tables, and NOT NULL,
DEFAULT and CHECK enforce row-level rules. I use them in addition to application validation because they are
the only guarantee that holds under concurrency and across multiple writers."

**Follow-up questions**
- Q: Can a UNIQUE column hold multiple NULLs? A: Yes in MySQL/InnoDB, NULL is never equal to NULL for
  uniqueness.
- Q: Difference between PRIMARY KEY and UNIQUE? A: One PK per table, NOT NULL, becomes clustered index;
  many UNIQUE keys allowed, NULLs allowed.
- Q: Should we use foreign keys in high-scale systems? A: They cost some write overhead and locking; some
  very large systems drop them and enforce integrity in code. For most apps they are worth it, and they give
  the optimizer and teammates guarantees. Say that it is a trade-off, and that you default to using them.
- Q: What does ON DELETE CASCADE risk? A: One DELETE can silently remove thousands of rows and hold many
  locks; prefer soft delete or RESTRICT for important parents.

**Common mistakes**
- Relying only on app-level uniqueness checks (race condition).
- `ON DELETE CASCADE` everywhere without thinking.
- FK column and parent column with different types/collations (FK creation fails with errno 3780/150).
- Forgetting that `ON DELETE SET NULL` requires a nullable column.

**Revision notes**
- PK = unique + NOT NULL + clustered. UNIQUE allows NULLs.
- FK needs matching types, creates an index, default action is RESTRICT.
- CHECK is enforced from 8.0.16. Constraint violations are errors 1062, 1451, 1452, 3819.

### T1.3 Relationships: 1:1, 1:N, M:N [ESSENTIAL]

**Concept.**
- **One-to-many (1:N):** FK on the "many" side. `projects (1) -> tasks (N)`: `tasks.project_id`.
- **One-to-one (1:1):** FK + UNIQUE on the child. `users (1) -> accounts (1)`: `accounts.user_id UNIQUE`.
- **Many-to-many (M:N):** needs a **junction table** with two FKs and a composite PK:
  `project_members(project_id, user_id)` and `task_tags(task_id, tag_id)`.

**Why it matters.** Wrong relationship modeling is the most common reason schemas become painful (e.g.
putting `tag_ids` as a CSV string in `tasks`). Interviewers often ask "model X" on a whiteboard.

**Internal working.** There is no special "relationship" object in MySQL: a relationship is just a FK column
and a JOIN. The composite PK `(project_id, user_id)` on the junction table gives two benefits: it prevents
duplicate pairs and it creates an index usable for "members of project X" (leftmost prefix, Day 3). The
second index `idx_pm_user` serves the reverse lookup "projects of user Y".

**Code example.**

```sql
-- 1:N  tasks of project 1
SELECT id, title FROM tasks WHERE project_id = 1;

-- M:N  members of project 1 (junction table + users)
SELECT u.name, pm.member_role
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = 1;
-- Bilal lead, Chitra contributor, Dev contributor

-- Prevent duplicate junction rows: composite PK
INSERT INTO project_members (project_id, user_id) VALUES (1, 3);
-- ERROR 1062 (23000): Duplicate entry '1-3' for key 'project_members.PRIMARY'
```

**Frontend connection.** 1:N is like `project.tasks = [...]` nested arrays; M:N is the normalized Redux/Normalizr
store: entities by id plus a separate "join" list of `{projectId, userId}` pairs.

**Real-world scenario.** Marketplace: `products` M:N `categories` via `product_categories`. A product in
5 categories = 5 junction rows, not a column with "1,4,7".

**Interview answer:** "One-to-many is a foreign key on the many side. One-to-one is a foreign key with a
unique constraint. Many-to-many needs a junction table with two foreign keys; I make the pair the composite
primary key so duplicates are impossible and the lookup index comes for free."

**Follow-up questions**
- Q: Why not store tag ids in a JSON column? A: You lose FK integrity and cannot index/join efficiently
  (MySQL does offer multi-valued indexes on JSON arrays since 8.0.17, but a junction table is still the
  standard relational answer). [ADVANCED]
- Q: Junction table with extra columns? A: Fine: `project_members.member_role`, `joined_at` belong to the
  relationship, not to either entity.
- Q: Surrogate id on the junction table? A: Optional; composite PK is usually enough and saves an index.

**Common mistakes**
- CSV values in a column.
- Forgetting the index for the reverse direction of an M:N lookup.
- Modeling 1:1 without UNIQUE (it silently becomes 1:N).

**Revision notes**
- 1:N = FK on many side. 1:1 = FK + UNIQUE. M:N = junction table, composite PK.

### T1.4 CRUD in SQL [ESSENTIAL]

**Concept.** CRUD = Create (INSERT), Read (SELECT), Update (UPDATE), Delete (DELETE). REST ke POST/GET/PUT-
PATCH/DELETE se directly map hota hai (Week 3).

**Why it matters.** 80% of backend queries are CRUD with filters. Mistakes here (missing WHERE, string
concatenation) are the ones that cause incidents and security holes.

**Internal working (short).** `SELECT` goes through parser -> optimizer (choose index) -> executor reads rows
from InnoDB. `UPDATE`/`DELETE` first **find** rows (so they also need good indexes), lock them, write undo +
redo log, then modify pages in the buffer pool. A `WHERE` without an index forces a full scan and (in
`REPEATABLE READ`) may lock every scanned row (Day 5).

**Code example: Create.**

```sql
-- Everything in this block runs inside a transaction so the sample data stays at 14 tasks.
-- (AUTO_INCREMENT counters are NOT rolled back; next ids will have a gap. That is normal.)
START TRANSACTION;

-- single and multi-row insert
INSERT INTO tasks (project_id, assignee_id, title, priority)
VALUES (1, 3, 'Write unit tests', 2);

SELECT LAST_INSERT_ID();       -- id of the row just inserted by THIS connection (15 on the fresh data set)

INSERT INTO tags (name) VALUES ('docs'), ('backend');

-- INSERT ... SELECT (copy rows)
INSERT INTO tasks (project_id, assignee_id, title, priority)
SELECT 4, assignee_id, CONCAT('Copy of ', title), priority
FROM tasks WHERE project_id = 3 AND status = 'todo';

-- UPSERT: insert or update if the unique key already exists (row alias form, MySQL 8.0.19+)
INSERT INTO tags (name) VALUES ('urgent') AS new_row
ON DUPLICATE KEY UPDATE name = new_row.name;     -- 'urgent' exists: no error, no duplicate

-- INSERT IGNORE swallows ALL errors of the row type (dup key, truncation warnings). Use with care.
INSERT IGNORE INTO tags (name) VALUES ('bug');

ROLLBACK;
```

On MySQL versions before 8.0.19 the `VALUES(col)` function form is used: `ON DUPLICATE KEY UPDATE
name = VALUES(name)`. It is deprecated now but still works. `REPLACE INTO` is **delete + insert**: it changes
the auto-increment id and fires cascades, so avoid it for upserts.

**Code example: Read.**

```sql
SELECT id, title, status
FROM tasks
WHERE project_id = 1
  AND status <> 'done'
ORDER BY priority ASC, due_date ASC
LIMIT 10;
-- Order: ties on priority 1 sorted by due_date; NULL due_date sorts FIRST in ASC order in MySQL

SELECT DISTINCT status FROM tasks;
SELECT COUNT(*) AS total, COUNT(assignee_id) AS assigned FROM tasks;  -- COUNT(col) skips NULLs: 14 vs 11
SELECT id, title FROM tasks WHERE title LIKE 'Set%';     -- prefix LIKE can use an index
SELECT id, title FROM tasks WHERE due_date BETWEEN '2026-10-01' AND '2026-10-31';
SELECT id FROM tasks WHERE status IN ('todo', 'in_progress') AND assignee_id IS NULL;
```

**NULL semantics (very common interview trap).** SQL uses three-valued logic: TRUE, FALSE, UNKNOWN. Any
comparison with NULL is UNKNOWN, and `WHERE` keeps only TRUE.

```sql
SELECT * FROM tasks WHERE assignee_id = NULL;      -- returns NOTHING (UNKNOWN), a classic bug
SELECT * FROM tasks WHERE assignee_id IS NULL;     -- correct: tasks 4, 9, 13
SELECT NULL = NULL, NULL <=> NULL;                 -- NULL, 1   (<=> is MySQL null-safe equals)
SELECT COALESCE(assignee_id, 0) FROM tasks LIMIT 3;
```

**Code example: Update and Delete (safe habits).**

```sql
START TRANSACTION;   -- keep sample data intact; we ROLLBACK at the end of this block

-- ALWAYS write the WHERE first. Check with a SELECT using the same WHERE.
SELECT id FROM tasks WHERE project_id = 1 AND status = 'todo';
UPDATE tasks SET status = 'in_progress' WHERE id = 3;
SELECT ROW_COUNT();     -- 1 (rows CHANGED in the CLI; in mysql2 see result.affectedRows / changedRows)

-- UPDATE with JOIN (MySQL multi-table syntax): close all tasks of archived projects (none match today)
UPDATE tasks t
JOIN projects p ON p.id = t.project_id
SET t.status = 'done'
WHERE p.status = 'archived';

-- DELETE with LIMIT (batching big deletes avoids long locks)
DELETE FROM tasks WHERE status = 'done' AND due_date < '2026-09-15' LIMIT 1000;   -- removes task 1

ROLLBACK;

-- Soft delete pattern: keep the row, mark it deleted (ALTER is DDL: implicit commit, so it is outside the txn)
ALTER TABLE tasks ADD COLUMN deleted_at DATETIME NULL;
UPDATE tasks SET deleted_at = NOW() WHERE id = 4;
SELECT id, title FROM tasks WHERE deleted_at IS NULL;
ALTER TABLE tasks DROP COLUMN deleted_at;   -- clean up so later demos match this file
```

`DELETE` removes rows one by one (logged, can rollback, fires FK actions). `TRUNCATE TABLE` drops and
recreates the table (DDL: implicit commit, resets AUTO_INCREMENT, cannot be rolled back, fails on tables
referenced by FKs). Safety net for beginners: `mysql --safe-updates` refuses UPDATE/DELETE without a key
WHERE.

**Node.js (mysql2/promise): CRUD with parameters. ALWAYS parameterized.**

```js
// src/tasks.repo.js  (ES module; package.json has "type": "module")
import { pool } from './db.js';

export async function createTask({ projectId, assigneeId = null, title, priority = 3 }) {
  const [result] = await pool.execute(
    'INSERT INTO tasks (project_id, assignee_id, title, priority) VALUES (?, ?, ?, ?)',
    [projectId, assigneeId, title, priority]
  );
  return result.insertId;
}

export async function getTask(id) {
  const [rows] = await pool.execute(
    'SELECT id, project_id, assignee_id, title, status, priority, due_date FROM tasks WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
}

export async function updateTaskStatus(id, status) {
  const [result] = await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows === 1;     // false -> 404 in the controller
}

export async function deleteTask(id) {
  const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows === 1;
}
```

Why `?` placeholders: the SQL text and the values travel separately, so a value like `'; DROP TABLE tasks;--`
is data, never SQL. This is the primary defense against SQL injection (Week 5 / Day 5 goes deeper).
Identifiers (column names in a dynamic ORDER BY) cannot be parameterized: use an allow-list map.
The `db.js` pool file appears in Day 5.

**Frontend connection.** `INSERT/SELECT/UPDATE/DELETE` map to `POST/GET/PATCH/DELETE` fetch calls; the Express
controller is the thin glue. Soft delete is the same idea as setting `isDeleted: true` in a Redux slice rather
than removing the object.

**Real-world scenario.** Admin panel "delete user" button: hard delete would CASCADE away the user's
orders and break accounting. Soft delete (`deleted_at`) plus `WHERE deleted_at IS NULL` in every read query
(or a view) keeps history. The trade-off: every query must remember the filter, and UNIQUE emails of deleted
users still block re-registration unless handled.

**Interview answer:** "CRUD maps to INSERT, SELECT, UPDATE and DELETE. I always use parameterized queries, I
write the WHERE clause first for updates and deletes, and I check affected rows to return 404 when nothing
matched. For idempotent writes I use INSERT ... ON DUPLICATE KEY UPDATE backed by a unique key. NULL needs
IS NULL because any comparison with NULL is UNKNOWN."

**Follow-up questions**
- Q: DELETE vs TRUNCATE vs DROP? A: DELETE = DML, row by row, rollbackable, fires triggers/FK actions.
  TRUNCATE = DDL, fast, resets auto-increment, implicit commit. DROP removes the table itself.
- Q: `INSERT IGNORE` vs `ON DUPLICATE KEY UPDATE` vs `REPLACE`? A: IGNORE skips the row (and hides other
  errors), ODKU updates in place, REPLACE deletes then inserts (new id, cascades).
- Q: How do you get the id of the new row? A: `LAST_INSERT_ID()` / `result.insertId`; it is per connection so
  it is safe under concurrency, but only within the same connection (relevant for pools: use the same
  connection or just read `insertId` from the result).
- Q: `COUNT(*)` vs `COUNT(col)`? A: `COUNT(*)` counts rows; `COUNT(col)` skips NULLs.
- Q: Does `NOT IN` handle NULL? A: No, see Day 2: if the subquery returns any NULL, `NOT IN` returns no rows.
- Q: Why is `SELECT *` discouraged? A: Extra data over the wire, breaks covering indexes, schema change
  surprises.

**Common mistakes**
- `WHERE col = NULL`.
- UPDATE/DELETE without WHERE (or with a wrong WHERE) in production consoles.
- Building SQL by string concatenation / template literals.
- Treating `affectedRows` as "found" rows: by default MySQL reports **changed** rows with some drivers; mysql2
  reports `affectedRows` as matched rows unless the connection sets `flags: ['-FOUND_ROWS']`. Know which one
  your code relies on (`changedRows` is the strictly changed count).
- Using `REPLACE INTO` as an upsert.

**Revision notes**
- INSERT multi-row, ODKU upsert, `insertId`, `affectedRows`.
- `IS NULL`, `COALESCE`, `<=>`. Prefix LIKE can use an index; leading `%` cannot.
- DELETE (rollbackable) vs TRUNCATE (DDL). Soft delete trade-offs.
- Identifiers cannot be bound; use an allow-list.

### End of Day 1

**Key concepts to remember**
1. InnoDB: transactional, row locks, clustered PK. Schema + constraints = integrity even under races.
2. PK / UNIQUE / FK / NOT NULL / DEFAULT / CHECK and the error numbers 1062, 1451, 1452, 3819.
3. Relationships: 1:N FK on many side, 1:1 FK + UNIQUE, M:N junction table with composite PK.
4. DECIMAL for money, utf8mb4 for text, sequential BIGINT for ids.
5. NULL is UNKNOWN: use `IS NULL`; `COUNT(col)` skips NULLs.
6. Always parameterize values; allow-list identifiers.

**Five revision questions**
1. Why must uniqueness be enforced by a UNIQUE index and not only by a `SELECT` before `INSERT`?
2. What happens on `DELETE FROM projects WHERE id = 3` given the FK actions in our schema? What about
   `DELETE FROM users WHERE id = 3`?
3. How do you model "a task can have many tags and a tag can belong to many tasks"? Which PK on the junction?
4. Why does `WHERE assignee_id = NULL` return nothing, and what are two correct alternatives?
5. Difference between `INSERT IGNORE`, `ON DUPLICATE KEY UPDATE` and `REPLACE`.

(Answer hints for Q2: project 3 delete cascades to its tasks and project_members; deleting user 3 -> tasks'
`assignee_id` set to NULL (SET NULL), but `accounts.user_id` FK is RESTRICT and `orders.user_id` is RESTRICT, so
the delete fails with 1451 because Chitra has an account and orders.)

**One practical coding task**
Add an `activity_log` table (`id`, `task_id` FK with `ON DELETE CASCADE`, `action` ENUM('created','status_changed',
'deleted'), `created_at`). Write an INSERT that logs "created" for task 14, a query that counts actions per
task, and demonstrate that deleting the task removes its log rows (inside a transaction, then ROLLBACK).
Then write a Node function `logAction(pool, taskId, action)` using `pool.execute`.

**Self-assessment checklist**
- [ ] I ran Section 0 and `SELECT COUNT(*) FROM tasks` returns 14.
- [ ] I can trigger errors 1062, 1452, 1451 and 3819 and explain each.
- [ ] I can draw the ER diagram from memory including junction tables.
- [ ] I can explain `IS NULL` vs `= NULL` and `COUNT(*)` vs `COUNT(col)`.
- [ ] I know DELETE vs TRUNCATE and soft delete trade-offs.
- [ ] I wrote parameterized CRUD functions with mysql2.
---

## Day 2 - INNER/LEFT JOIN, GROUP BY/HAVING, subqueries (Day 23)

**Estimated time (2 hours):** 40 min JOIN (T2.1) with queries run on your machine, 35 min GROUP BY/HAVING
(T2.2), 30 min subqueries/CTE/window (T2.3), 15 min revision questions + coding task.

**Learning objectives**
- Predict the exact result of INNER JOIN, LEFT JOIN, and anti-join queries on our sample data.
- Explain the difference between `WHERE` and `ON` in an outer join, and why filtering the right table in
  `WHERE` turns a LEFT JOIN into an INNER JOIN.
- Use `GROUP BY`, aggregates, `HAVING`, conditional aggregation.
- Explain the logical order of query clauses (FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT).
- Write scalar, `IN`, `EXISTS`, correlated, derived-table subqueries, CTEs and a simple window function.
- Avoid the `NOT IN` + NULL trap and the join "row multiplication" aggregate bug.

### T2.1 INNER JOIN and LEFT JOIN [ESSENTIAL]

**Concept.** JOIN do tables ki rows ko ek condition (`ON`) par jodta hai.
- **INNER JOIN**: sirf wahi rows jinke dono taraf match hai.
- **LEFT JOIN**: left table ki **saari** rows; right side match na mile to right columns `NULL`.
- RIGHT JOIN = mirror of LEFT (rarely used; rewrite as LEFT). `CROSS JOIN` = every pair (cartesian product).
- MySQL has no `FULL OUTER JOIN`; emulate with `LEFT JOIN ... UNION ... RIGHT JOIN`. [ADVANCED]

Venn thinking is okay for set-theory intuition, but think in rows: "for each left row, find matching right
rows".

**Why it matters.** Normalized data (Day 3) is split across tables, so almost every real endpoint is a join:
"tasks with project name and assignee name". Interviewers love "users with no orders" (LEFT JOIN + IS NULL).

**Internal working.** MySQL 8 mainly uses **nested loop join**: for each row of the outer (driving) table,
probe the inner table by index (`eq_ref`/`ref`). Without an index on the join column the inner side is scanned
repeatedly (disaster). MySQL 8.0.18+ adds **hash join** for joins without usable indexes (equi-joins).
The **optimizer chooses the join order** (not the order you wrote them, for INNER JOINs); for LEFT JOIN the
left table must come first logically, so there is less freedom. This is why **both sides of `ON` need
indexes** (the FK columns are usually already indexed, see Section 0).

**Code example: INNER JOIN** (tasks with their project and assignee).

```sql
SELECT t.id, t.title, p.name AS project, u.name AS assignee
FROM tasks t
INNER JOIN projects p ON p.id = t.project_id
INNER JOIN users    u ON u.id = t.assignee_id
ORDER BY t.id;
```

Result: **11 rows** (tasks 4, 9, 13 are missing because their `assignee_id` is NULL, and a NULL never matches).

```
+----+--------------------+----------------+----------+
| id | title              | project        | assignee |
+----+--------------------+----------------+----------+
|  1 | Design homepage    | Website Revamp | Chitra   |
|  2 | Build login page   | Website Revamp | Chitra   |
|  3 | Set up CI pipeline | Website Revamp | Dev      |
|  5 | SEO audit          | Website Revamp | Dev      |
|  6 | Push notifications | Mobile App     | Dev      |
|  7 | App store listing  | Mobile App     | Esha     |
|  8 | Crash reporting    | Mobile App     | Esha     |
| 10 | Admin dashboard    | Internal Tools | Esha     |
| 11 | Audit logs         | Internal Tools | Asha     |
| 12 | Backup script      | Internal Tools | Esha     |
| 14 | Fix footer bug     | Website Revamp | Chitra   |
+----+--------------------+----------------+----------+
```

**Code example: LEFT JOIN** (keep unassigned tasks too).

```sql
SELECT t.id, t.title, u.name AS assignee
FROM tasks t
LEFT JOIN users u ON u.id = t.assignee_id
ORDER BY t.id;
-- 14 rows; for ids 4, 9, 13 assignee is NULL
```

**Anti-join: "users with no tasks"** (LEFT JOIN + IS NULL on the right side's key).

```sql
SELECT u.id, u.name
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
WHERE t.id IS NULL;
-- Bilal (2) and Farhan (6)
```

**WHERE vs ON in a LEFT JOIN (very common trap).**

```sql
-- A) filter in ON: every user is kept; only matching 'done' tasks are attached
SELECT u.name, t.title
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id AND t.status = 'done'
ORDER BY u.id;
-- 7 rows: Asha NULL, Bilal NULL, Chitra 'Design homepage', Dev 'SEO audit',
--         Esha 'Crash reporting', Esha 'Backup script', Farhan NULL

-- B) filter in WHERE: NULL rows are filtered out => behaves like INNER JOIN
SELECT u.name, t.title
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
WHERE t.status = 'done';
-- 4 rows, only users who have done tasks: Chitra, Dev, Esha, Esha
```

Rule: conditions about the **right table** that should not remove left rows go in `ON`. Conditions that
exclude left rows go in `WHERE`.

**Many-to-many join** (tasks with their tags).

```sql
SELECT t.id, t.title, GROUP_CONCAT(tg.name ORDER BY tg.name SEPARATOR ', ') AS tags
FROM tasks t
LEFT JOIN task_tags tt ON tt.task_id = t.id
LEFT JOIN tags      tg ON tg.id = tt.tag_id
WHERE t.project_id = 1
GROUP BY t.id, t.title
ORDER BY t.id;
-- 1 NULL | 2 feature | 3 feature | 4 NULL | 5 NULL | 14 bug, urgent
```

**Self join** -- our schema has none, but the pattern is
`FROM employees e LEFT JOIN employees m ON m.id = e.manager_id`: same table twice with different aliases.

**Frontend connection.** JOIN is `tasks.map(task => ({...task, assignee: usersById[task.assignee_id]}))`.
INNER JOIN drops tasks without an assignee (like `.filter(Boolean)` after the lookup), LEFT JOIN keeps them with
`assignee: undefined`. The "N+1" bug (Day 6) is looping and calling the lookup per item over the network.

**Real-world scenario.** Marketplace seller dashboard: "all sellers and their order count this month, including
sellers with 0 orders" is a LEFT JOIN. An INNER JOIN would silently hide inactive sellers and the report would
look healthier than reality.

**Interview answer:** "INNER JOIN returns only rows that match on both sides. LEFT JOIN returns every row from
the left table and NULLs for the right columns when there is no match, which is how I find 'users without
orders' with a `WHERE right.id IS NULL` anti-join. For outer joins, I put right-table filters in the ON
clause, otherwise they behave like an inner join. Join columns should be indexed; MySQL mostly uses nested
loop joins and, from 8.0.18, hash joins when no index helps."

**Follow-up questions**
- Q: Difference between `ON` and `WHERE` for INNER JOIN? A: Logically equivalent; for OUTER JOIN they differ
  (shown above). Style: join condition in ON, filters in WHERE.
- Q: How would you get a FULL OUTER JOIN in MySQL? A: `SELECT ... LEFT JOIN ... UNION SELECT ... RIGHT JOIN ...`
  (UNION de-duplicates; use `UNION ALL` with a `WHERE left.id IS NULL` on the second half to be exact).
- Q: What if I JOIN on a column without an index? A: Nested loop scans the inner table per outer row (very
  slow) or the optimizer picks a hash join (8.0.18+); either is a sign to add an index.
- Q: `JOIN` vs subquery for performance? A: Modern MySQL 8 optimizer can rewrite many `IN`/`EXISTS` subqueries
  into semi-joins; measure with EXPLAIN rather than assuming.
- Q: What is a cartesian product and when does it happen by accident? A: Missing/incorrect ON condition:
  rows = left x right.

**Common mistakes**
- Filtering the right table in WHERE after a LEFT JOIN.
- Joining on non-indexed or mismatched-type columns (implicit conversion kills the index).
- `SELECT *` from joined tables with the same column names (`id`) -> ambiguous/overwritten keys in the Node
  result object. Alias columns (`t.id AS task_id`).
- Aggregating after a one-to-many join (row multiplication, see T2.2).

**Revision notes**
- INNER = intersection of keys; LEFT = all left + NULL fill; anti-join = LEFT + IS NULL.
- ON vs WHERE for outer joins. Index the join columns. No FULL OUTER JOIN in MySQL.

### T2.2 GROUP BY, aggregates, HAVING [ESSENTIAL]

**Concept.** `GROUP BY` rows ko groups mein baantta hai, aur aggregate functions (`COUNT, SUM, AVG, MIN, MAX`)
har group ke liye ek value nikalte hain. `WHERE` groups banne se **pehle** rows filter karta hai; `HAVING`
groups banne ke **baad** groups filter karta hai.

**Why it matters.** Dashboards, reports, "top N", billing summaries. Also tests whether you understand the
logical processing order.

**Internal working.** Logical order of evaluation:

```
1. FROM / JOIN        build the row set
2. WHERE              filter rows (no aggregates here)
3. GROUP BY           form groups
4. HAVING             filter groups (aggregates allowed)
5. SELECT             compute expressions / window functions
6. DISTINCT
7. ORDER BY           (can use SELECT aliases)
8. LIMIT / OFFSET
```

Physically, MySQL groups by reading an index in order if one matches (cheap) or by building a temporary table
(`Using temporary` in EXPLAIN) -- Day 6. MySQL 8 enables `ONLY_FULL_GROUP_BY` SQL mode by default: every
non-aggregated column in SELECT must be in `GROUP BY` or functionally dependent on it (for example, grouping by
the PK allows other columns of that table).

**Code example: tasks per status per project.**

```sql
SELECT project_id, status, COUNT(*) AS task_count
FROM tasks
GROUP BY project_id, status
ORDER BY project_id, status;
-- (1,todo,3) (1,in_progress,1) (1,done,2) (2,todo,2) ...
```

Note: ENUM columns sort by their **index position** (todo=1, in_progress=2, done=3), not alphabetically.

**Conditional aggregation (one pass, several counters).**

```sql
SELECT p.id, p.name,
       COUNT(t.id)                          AS total,
       SUM(t.status = 'done')               AS done_count,
       SUM(t.status <> 'done')              AS open_count,
       ROUND(100 * AVG(t.status = 'done'))  AS pct_done
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p.name
ORDER BY p.id;
```

Result:

```
+----+----------------+-------+------------+------------+----------+
| id | name           | total | done_count | open_count | pct_done |
+----+----------------+-------+------------+------------+----------+
|  1 | Website Revamp |     6 |          2 |          4 |       33 |
|  2 | Mobile App     |     4 |          1 |          3 |       25 |
|  3 | Internal Tools |     4 |          1 |          3 |       25 |
|  4 | Archived Pilot |     0 |       NULL |       NULL |     NULL |
+----+----------------+-------+------------+------------+----------+
```

(`SUM` over zero rows is NULL, not 0; use `COALESCE(SUM(...), 0)` for clean JSON. `COUNT` returns 0.)

**HAVING vs WHERE.**

```sql
-- Projects with at least 4 OPEN tasks
SELECT project_id, COUNT(*) AS open_count
FROM tasks
WHERE status <> 'done'          -- row filter BEFORE grouping
GROUP BY project_id
HAVING COUNT(*) >= 4;           -- group filter AFTER grouping
-- (1, 4)

-- Paying customers: users whose PAID orders total at least 200
SELECT user_id, COUNT(*) AS paid_orders, SUM(amount) AS total_paid
FROM orders
WHERE status = 'paid'
GROUP BY user_id
HAVING SUM(amount) >= 200
ORDER BY total_paid DESC;
-- (3, 2, 200.50)  (4, 1, 200.00)
```

**The row multiplication bug (join + aggregate).**

```sql
-- WRONG: joining tags before counting tasks
SELECT p.id, COUNT(*) AS wrong_count
FROM projects p
JOIN tasks t ON t.project_id = p.id
LEFT JOIN task_tags tt ON tt.task_id = t.id
GROUP BY p.id;
-- Project 1 returns 7 (task 14 has two tags and is counted twice), not 6.

-- FIX: COUNT(DISTINCT ...) or aggregate in a derived table first
SELECT p.id, COUNT(DISTINCT t.id) AS task_count
FROM projects p
JOIN tasks t ON t.project_id = p.id
LEFT JOIN task_tags tt ON tt.task_id = t.id
GROUP BY p.id;
```

**ROLLUP [ADVANCED].**

```sql
SELECT status, COUNT(*) AS n
FROM tasks
GROUP BY status WITH ROLLUP;     -- adds a grand-total row where status is NULL
```

**Frontend connection.** `GROUP BY` = `Object.groupBy(tasks, t => t.status)` / `reduce` into buckets, then
`.length` or a sum per bucket. `HAVING` = filtering the buckets afterwards. Doing it in SQL means only the
small result crosses the network, instead of fetching 1 million rows into Node and reducing in JS.

**Real-world scenario.** Finance report: "revenue per month for paid orders, months above 10k". Use
`GROUP BY DATE_FORMAT(created_at, '%Y-%m')` with `WHERE status='paid'` and `HAVING SUM(amount) > 10000`. For
big tables avoid wrapping the column in a function in WHERE (Day 6); grouping by the function is fine here
since it is not used to locate rows.

**Interview answer:** "GROUP BY partitions rows into groups so aggregates run per group. WHERE filters rows
before grouping and cannot use aggregates; HAVING filters groups after aggregation. With MySQL 8 and
ONLY_FULL_GROUP_BY, every selected column must be grouped, aggregated or functionally dependent. I use
conditional aggregation such as SUM(status='done') to compute several counters in one pass, and I watch out
for row multiplication when joining one-to-many tables before aggregating."

**Follow-up questions**
- Q: Can I use a SELECT alias in HAVING? A: MySQL allows aliases in GROUP BY/HAVING/ORDER BY as an extension
  (standard SQL does not); prefer repeating the expression for portability.
- Q: `COUNT(*)` vs `COUNT(1)` vs `COUNT(col)`? A: `COUNT(*)` and `COUNT(1)` are equivalent (count rows);
  `COUNT(col)` skips NULLs; `COUNT(DISTINCT col)` counts distinct non-NULL values.
- Q: Why does the query fail with "this is incompatible with sql_mode=only_full_group_by"? A: A selected column
  is neither grouped nor aggregated; add it to GROUP BY, aggregate it (`ANY_VALUE`, `MAX`), or group by the PK.
- Q: How to get "top 3 projects by open tasks"? A: `... GROUP BY project_id ORDER BY open_count DESC LIMIT 3`.
- Q: Per-group top-1 (most urgent task per project)? A: window function `ROW_NUMBER()` (below).

**Common mistakes**
- Using HAVING for row filters that belong in WHERE (slower: groups are built first).
- Selecting non-grouped columns (works only if `ONLY_FULL_GROUP_BY` is disabled and returns arbitrary values).
- `SUM` of a LEFT JOINed column without COALESCE.
- Aggregating after a one-to-many join (inflated totals).

**Revision notes**
- WHERE = pre-group row filter. HAVING = post-group filter. Logical order FROM, WHERE, GROUP BY, HAVING,
  SELECT, ORDER BY, LIMIT.
- `COUNT(col)` skips NULLs; `SUM` over empty set is NULL.
- Use `COUNT(DISTINCT)` or pre-aggregate to avoid multiplication.

### T2.3 Subqueries, CTEs, window functions [ESSENTIAL for subqueries, ADVANCED for windows]

**Concept.** Subquery = query ke andar query. Types:
- **Scalar subquery**: returns one value (can be used in SELECT or WHERE).
- **Column subquery**: `IN (SELECT ...)`.
- **Correlated subquery**: refers to the outer query, logically re-evaluated per outer row.
- **Derived table**: subquery in `FROM` (must have an alias).
- **CTE** (`WITH`, MySQL 8.0+): named subquery for readability, recursive CTEs for hierarchies/sequences.
- **Window function** (8.0+): aggregate-like calculation over a window of rows **without collapsing them**.

**Why it matters.** Many "second highest", "users who never...", "top-N per group" interview problems.
Understanding `EXISTS` vs `IN`, and the `NOT IN` NULL trap, shows real SQL depth.

**Internal working.** The optimizer often transforms `IN`/`EXISTS` subqueries into **semi-joins** and
`NOT EXISTS` into **anti-joins**; derived tables and CTEs can be **merged** into the outer query (when simple)
or **materialized** into a temporary table. Correlated subqueries that cannot be transformed run once per outer
row, which is O(n) executions (fine with an index on the correlated column, slow without).
Window functions are evaluated after WHERE/GROUP BY/HAVING and before the final ORDER BY/LIMIT, which is why
you cannot filter on them in the same query's WHERE and must wrap them in a derived table/CTE instead.

**Code example: scalar and IN subqueries.**

```sql
-- Tasks in the project with the most tasks
SELECT id, title FROM tasks
WHERE project_id = (SELECT project_id FROM tasks GROUP BY project_id ORDER BY COUNT(*) DESC LIMIT 1);
-- project 1: ids 1,2,3,4,5,14

-- Users who own at least one active project
SELECT id, name FROM users
WHERE id IN (SELECT owner_id FROM projects WHERE status = 'active');
-- Asha (1, owns project 3), Bilal (2)
```

**EXISTS and NOT EXISTS (preferred for "has / has not").**

```sql
-- users with no assigned tasks
SELECT u.id, u.name
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.assignee_id = u.id);
-- Bilal, Farhan

-- users who have at least one open task due before 2026-10-25
SELECT u.name
FROM users u
WHERE EXISTS (
  SELECT 1 FROM tasks t
  WHERE t.assignee_id = u.id AND t.status <> 'done' AND t.due_date < '2026-10-25'
);
-- tasks 11 (Asha, 10-22), 14 (Chitra, 10-21) => Asha, Chitra
```

**The NOT IN + NULL trap.**

```sql
SELECT id, name FROM users
WHERE id NOT IN (SELECT assignee_id FROM tasks);
-- Returns ZERO rows!  tasks.assignee_id contains NULLs. "id NOT IN (1,3,4,5,NULL)" is UNKNOWN for every
-- id that is not in the list, so no row passes.

-- Fix 1: NOT EXISTS (shown above)
-- Fix 2: filter NULLs
SELECT id, name FROM users
WHERE id NOT IN (SELECT assignee_id FROM tasks WHERE assignee_id IS NOT NULL);
-- Bilal, Farhan
```

**Correlated subquery: tasks more urgent than their project's average priority number** (1 = most urgent).

```sql
SELECT t.id, t.title, t.project_id, t.priority
FROM tasks t
WHERE t.priority < (SELECT AVG(t2.priority) FROM tasks t2 WHERE t2.project_id = t.project_id)
ORDER BY t.id;
-- P1 avg 2.33 -> ids 1(2), 2(1), 14(1);  P2 avg 3.00 -> 6(2), 8(2);  P3 avg 2.50 -> 10(2), 11(1)
-- Result ids: 1, 2, 6, 8, 10, 11, 14
```

Same thing without a correlated subquery (join with a derived table, usually easier on the optimizer):

```sql
SELECT t.id, t.title, t.priority, pa.avg_priority
FROM tasks t
JOIN (SELECT project_id, AVG(priority) AS avg_priority FROM tasks GROUP BY project_id) pa
  ON pa.project_id = t.project_id
WHERE t.priority < pa.avg_priority
ORDER BY t.id;
```

**CTE.**

```sql
WITH open_per_user AS (
  SELECT assignee_id, COUNT(*) AS open_tasks
  FROM tasks
  WHERE status <> 'done' AND assignee_id IS NOT NULL
  GROUP BY assignee_id
)
SELECT u.name, o.open_tasks
FROM open_per_user o
JOIN users u ON u.id = o.assignee_id
ORDER BY o.open_tasks DESC, u.name;
-- Chitra 2 (tasks 2,14), Dev 2 (3,6), Esha 2 (7,10), Asha 1 (11)
```

Recursive CTE (generate a sequence; also used for the bulk data on Day 3):

```sql
WITH RECURSIVE seq (n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 5
)
SELECT n FROM seq;         -- 1,2,3,4,5  (default cte_max_recursion_depth is 1000)
```

**Window function: most urgent open task per project.**

```sql
SELECT project_id, id, title, priority, due_date
FROM (
  SELECT t.*,
         ROW_NUMBER() OVER (PARTITION BY t.project_id ORDER BY t.priority ASC, t.due_date ASC) AS rn
  FROM tasks t
  WHERE t.status <> 'done'
) ranked
WHERE rn = 1
ORDER BY project_id;
-- P1 -> task 14 (priority 1, due 10-21 earlier than task 2's 10-25)
-- P2 -> task 6
-- P3 -> task 11
```

`ROW_NUMBER` gives unique ranks; `RANK` leaves gaps after ties; `DENSE_RANK` does not. Other useful ones:
`SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at)` = running total, `LAG(amount) OVER (...)` =
previous row value.

**Frontend connection.** Subquery = calling one function inside another's filter: `tasks.filter(t =>
!tasks.some(...))`. Correlated subquery = a nested loop (`filter` with an inner `find`), O(n*m) unless indexed.
Window function = `map` that adds a computed field (rank, running total) to each item without reducing the
array.

**Real-world scenario.** Payments: "latest transaction per customer" is a classic top-1-per-group:
`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC)` and keep `rn = 1`. "Customers who never
paid" is `NOT EXISTS`.

**Interview answer:** "A subquery is a query nested in another. I use EXISTS or NOT EXISTS for 'has or has not
related rows' because it handles NULLs correctly and the optimizer turns it into a semi- or anti-join. I avoid
NOT IN when the subquery column can be NULL because it returns no rows. For top-N per group I use a window
function like ROW_NUMBER with PARTITION BY in a derived table or CTE, and I check EXPLAIN when a correlated
subquery is on a large table."

**Follow-up questions**
- Q: `IN` vs `EXISTS`? A: Semantically similar for positive checks; `EXISTS` is NULL-safe in its negative form.
  MySQL 8 optimizes both into semi-joins in most cases; verify with EXPLAIN.
- Q: How to find the second highest priority number? A: `SELECT DISTINCT priority FROM tasks ORDER BY priority
  DESC LIMIT 1 OFFSET 1`, or `DENSE_RANK() OVER (ORDER BY priority DESC)` filtered on `= 2` in an outer query.
- Q: CTE vs derived table? A: Same result; CTE is more readable, can be referenced multiple times and can be
  recursive. Whether it is merged or materialized is the optimizer's decision.
- Q: Why can't I use a window function in WHERE? A: Window functions run after WHERE; wrap the query and filter
  outside.
- Q: Delete duplicates keeping the lowest id? A: Self-join delete:
  `DELETE t1 FROM t t1 JOIN t t2 ON t1.email = t2.email AND t1.id > t2.id`.

**Common mistakes**
- `NOT IN` with a nullable subquery column.
- Subquery returning more than one row where a scalar is expected (error 1242).
- Missing alias on a derived table (error 1248).
- Correlated subquery on an un-indexed column over a big table.
- Recursive CTE without termination (hits `cte_max_recursion_depth`).

**Revision notes**
- Scalar / IN / EXISTS / correlated / derived / CTE / window.
- NOT IN breaks with NULL; use NOT EXISTS.
- Top-N per group = ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...).
- Window functions cannot be in WHERE; wrap and filter outside.

### End of Day 2

**Key concepts to remember**
1. INNER keeps only matches; LEFT keeps all left rows; anti-join = LEFT JOIN ... IS NULL or NOT EXISTS.
2. Right-table filter in `ON` keeps the LEFT JOIN semantics, in `WHERE` it kills them.
3. Logical order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.
4. WHERE before grouping, HAVING after; conditional aggregation `SUM(cond)`.
5. Join then aggregate on 1:N = multiplied rows; use `COUNT(DISTINCT)` or pre-aggregate.
6. `NOT IN` + NULL = empty result; window functions for top-N per group.

**Five revision questions**
1. Write a query listing every project with its number of open tasks, including projects with zero tasks.
2. Why does `LEFT JOIN tasks t ... WHERE t.status='done'` stop being a left join?
3. Predict the output of `SELECT id FROM users WHERE id NOT IN (SELECT assignee_id FROM tasks)` and fix it.
4. Explain WHERE vs HAVING with an example from the orders table.
5. Get the most recent order per user (use a window function, then rewrite with a correlated subquery).

**One practical coding task**
Write `getProjectSummary(projectId)` in Node (mysql2) that returns one object: project name, total tasks,
done tasks, open tasks, and an array of `{ assignee, openTasks }`. Do it with **two** queries (one aggregate, one
grouped-by-assignee) rather than fetching all tasks and counting in JS. Use `pool.execute` with placeholders.

**Self-assessment checklist**
- [ ] I predicted the 11-row and 14-row results of the join examples before running them.
- [ ] I can explain why the NOT IN query returns nothing.
- [ ] I can write conditional aggregation and a HAVING filter without notes.
- [ ] I can write top-1-per-group with ROW_NUMBER.
- [ ] I know the logical clause order and why aliases work in ORDER BY.
- [ ] I can spot row multiplication in a join + aggregate.

---

## Day 3 - Normalization, indexes, composite indexes (Day 24)

**Estimated time (2 hours):** 30 min normalization (T3.1), 45 min index fundamentals + bulk data (T3.2),
30 min composite indexes + EXPLAIN experiments (T3.3), 15 min revision questions + coding task.

**Learning objectives**
- Identify 1NF, 2NF and 3NF violations in a table and fix them; know when denormalization is justified.
- Explain how an InnoDB B+Tree works, clustered vs secondary index, and why a secondary index lookup may need a
  second lookup by primary key.
- Decide which columns to index, and what indexes cost.
- Apply the **leftmost prefix rule** to composite indexes and design a composite index for a real query
  (equality columns, then sort/range column).
- Load 200,000 rows of test data and observe an index changing a plan (read EXPLAIN in detail on Day 6).

### T3.1 Normalization [ESSENTIAL]

**Concept.** Normalization = data ko aise tables mein todna ki **har fact sirf ek jagah** store ho. Isse
duplicate data aur inconsistent updates khatam hote hain.

**Why it matters.** Interviewers ask "what is normalization, explain 1NF/2NF/3NF with example" in almost every
SQL round, and follow with "when would you denormalize?".

**Internal working (the anomalies it prevents).** Imagine one flat table:

```
task_flat(task_id, title, project_name, project_owner_email, assignee_name, assignee_email, tags)
 1 | Build login | Website Revamp | bilal@example.com | Chitra | chitra@example.com | feature
14 | Fix footer  | Website Revamp | bilal@example.com | Chitra | chitra@example.com | bug,urgent
```

- **Update anomaly:** Bilal changes email; you must update every task row of every project he owns. Miss one and
  the data disagrees with itself.
- **Insert anomaly:** you cannot create a project with no tasks yet (no row to hold it).
- **Delete anomaly:** deleting the last task of a project deletes the only record of the project and its owner.

**The normal forms (practical version).**

| Form | Rule | Violation above | Fix |
|------|------|-----------------|-----|
| 1NF | Each cell holds one atomic value; no repeating groups; rows identifiable | `tags = 'bug,urgent'` | `tags` + `task_tags` junction table |
| 2NF | In a table with a composite key, every non-key column depends on the **whole** key | `order_items(order_id, product_id, product_name, qty)`: `product_name` depends only on `product_id` | move `product_name` to `products` |
| 3NF | No non-key column depends on another non-key column (no transitive dependency) | `project_owner_email` depends on `project_name`, not on `task_id` | separate `projects` and `users` |
| BCNF [ADVANCED] | Every determinant is a candidate key (stricter 3NF) | rarely asked in detail | -- |

Our Section 0 schema is in 3NF: `tasks` references `projects` and `users` by id; tags use a junction table;
user email lives only in `users`.

**Denormalization (deliberate, measured).** Duplicate data on purpose for read speed or history:
- `orders.amount` / `order_items.unit_price` copied from the product at purchase time (price **snapshot**, must
  not change when the product price changes later). This is correct modeling, not a violation.
- A counter column `projects.task_count` maintained by the app/triggers to avoid `COUNT(*)` on every page load.
- A reporting table / materialized summary refreshed by a job.

The cost: you now must keep copies in sync (in a transaction, Day 4) and accept more complex writes.

**Code example.** Show the denormalized cost, then the normalized fix:

```sql
-- Denormalized update: touches many rows and can be partially applied if the app crashes
UPDATE task_flat SET project_owner_email = 'new@example.com' WHERE project_name = 'Website Revamp';

-- Normalized: one row, one place
UPDATE users SET email = 'new-bilal@example.com' WHERE id = 2;
-- (undo it afterwards: UPDATE users SET email = 'bilal@example.com' WHERE id = 2;)
```

**Frontend connection.** This is the **Redux normalized state** idea (Normalizr / `entities.users[id]`): store
each entity once and reference it by id, otherwise updating one user means finding every nested copy in the
tree. Denormalized state is like a component prop-drilled copy that goes stale.

**Real-world scenario.** E-commerce: if `orders` stored the product name and price for the current catalog by
JOIN only, an admin changing a price would rewrite history for old invoices. So `order_items.unit_price` is a
deliberate snapshot. In contrast, a copy of the customer's email in every order row is a bad denormalization
(it will go stale).

**Interview answer:** "Normalization organizes data so each fact is stored once, which prevents update, insert
and delete anomalies. 1NF requires atomic values, 2NF removes partial dependencies on part of a composite key,
and 3NF removes transitive dependencies between non-key columns. I normalize to 3NF by default and
denormalize only with a measured reason, for example price snapshots in order items or a counter column to
avoid an expensive COUNT, and then I keep the copies consistent inside transactions."

**Follow-up questions**
- Q: Is a fully normalized schema always best? A: No. It optimizes integrity and write simplicity; reads
  need more joins. For read-heavy dashboards you denormalize selectively or use summary tables/caches.
- Q: Give an example of 2NF violation. A: `order_items(order_id, product_id, product_name, qty)` with PK
  `(order_id, product_id)`; `product_name` depends only on `product_id`.
- Q: Does normalization improve performance? A: Not by itself: it reduces storage and write cost, but adds
  joins. Performance comes from indexes and query shape.
- Q: Where do natural keys fit? A: Business identifiers (email, SKU) stay as UNIQUE columns, while a
  surrogate id is the PK, so changing an email does not ripple through foreign keys.

**Common mistakes**
- Storing lists in a single column (CSV or JSON for relational data).
- Copying mutable data (customer name/email) to many tables.
- Over-normalizing into a dozen tiny tables when a column would do (e.g. a lookup table for a 2-value
  boolean-like status that never changes: an ENUM or CHECK is fine).
- "Denormalizing for performance" without measuring.

**Revision notes**
- 1NF atomic, 2NF whole-key dependence, 3NF no transitive dependence.
- Anomalies: update, insert, delete.
- Snapshot columns and counters are legitimate denormalization; keep in sync transactionally.

### T3.2 Indexes: B+Tree, clustered vs secondary [ESSENTIAL]

**Concept.** Index ek sorted data structure hai jo rows ko **jaldi dhoondhne** mein madad karta hai, bilkul
book ke index ki tarah: poori book padhne ke bajaye index se page number dekho. Bina index ke MySQL ko poori
table scan karni padti hai (**full table scan**).

**Why it matters.** Indexing is the single biggest lever for backend query performance, and the most common
topic in the "my API is slow" interview scenario. Every `WHERE`, `JOIN ... ON`, `ORDER BY` and `GROUP BY` on a
large table is a candidate.

**Internal working.**
- InnoDB indexes are **B+Trees** made of 16 KB pages. Internal pages store keys + child pointers; **all data
  lives in leaf pages**, and leaf pages are linked in sorted order (so range scans and `ORDER BY` follow the
  leaf chain). With ~1000 keys per internal page, a tree of height 3 or 4 holds hundreds of millions of rows:
  a point lookup is only 3-4 page reads (many of them cached in the **buffer pool**).
- **Clustered index** = the primary key B+Tree whose leaf pages contain the **entire row**. The table IS the PK
  index. No PK declared -> first NOT NULL UNIQUE index, else a hidden 6-byte row id.
- **Secondary index** = separate B+Tree whose leaf entries are `(indexed columns, primary key value)`. A lookup
  by a secondary index finds the PK, then does a **second lookup in the clustered index** to fetch the row
  (the "bookmark lookup"). That is why: (1) a wide PK bloats every secondary index; (2) a **covering index**
  (all needed columns inside the index) avoids the second lookup and shows `Using index` in EXPLAIN.

```
secondary index on (status)          clustered index (PK = id)
leaf: ('done',  id=1)  --+           leaf: id=1 -> full row (project_id, title, status, ...)
      ('done',  id=5)  --+---->      leaf: id=5 -> full row
      ('todo',  id=3)  ...           ...
```

- **Selectivity / cardinality** = number of distinct values / number of rows. High selectivity (email, user_id)
  makes an index valuable. An index on a column with 2-3 distinct values (status, is_active) is weak alone;
  the optimizer may ignore it and scan the table because reading 33% of rows via random lookups is slower than
  a sequential scan.
- **Costs:** every INSERT/UPDATE/DELETE must update all affected indexes (write amplification), indexes use
  disk and buffer pool memory, and too many indexes slow writes and confuse the optimizer.
- **Primary key choice:** an ever-increasing PK appends to the right edge of the tree (fast, few page splits).
  A random PK (UUID v4) inserts into random leaf pages, causing page splits, fragmentation and a cold buffer
  pool, and a 36-char string PK is copied into every secondary index. If you need UUIDs, use `BINARY(16)` and
  a time-ordered variant (e.g. `UUID_TO_BIN(UUID(), 1)` swaps the time bits for locality). [ADVANCED]

**Which columns to index:**
- Foreign keys and join columns (InnoDB requires/creates one for FKs).
- Columns in frequent `WHERE` equality/range filters and `ORDER BY` with `LIMIT`.
- Columns with high selectivity or that appear together (composite, next topic).
- Not: tiny tables, columns with very low selectivity used alone, columns that are constantly updated, and "just
  in case" indexes.

**Setup: 200,000-row test table (we reuse it on Day 6).** `tasks` is only 14 rows, so we make a separate table
that mirrors it (no foreign keys, so bulk loading is fast). Study this statement: it uses the recursive CTE
from Day 2 as a number generator.

```sql
USE taskdb;

CREATE TABLE tasks_big (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   BIGINT UNSIGNED NOT NULL,
  assignee_id  BIGINT UNSIGNED NULL,
  title        VARCHAR(200)    NOT NULL,
  status       ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  priority     TINYINT UNSIGNED NOT NULL DEFAULT 3,
  due_date     DATE            NULL,
  created_at   DATETIME        NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

SET SESSION cte_max_recursion_depth = 200000;

INSERT INTO tasks_big (project_id, assignee_id, title, status, priority, due_date, created_at)
WITH RECURSIVE seq (n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 200000
)
SELECT 1 + (n % 3),                                              -- project 1..3
       IF(n % 10 = 0, NULL, 1 + (n % 5)),                        -- assignee 1..5, 10% unassigned
       CONCAT('Task ', n),
       ELT(1 + ((n DIV 3) % 3), 'todo', 'in_progress', 'done'),  -- status independent of project
       1 + ((n DIV 5) % 5),                                      -- priority 1..5
       DATE_ADD('2026-01-01', INTERVAL (n % 300) DAY),
       DATE_ADD('2026-01-01 00:00:00', INTERVAL (n DIV 4) MINUTE)  -- 4 rows share each timestamp (ties!)
FROM seq;

ANALYZE TABLE tasks_big;          -- refresh index statistics
SELECT COUNT(*) FROM tasks_big;   -- 200000
```

It takes a few seconds. Four rows share each `created_at` on purpose: on Day 6 that is what makes a
tie-breaker column necessary for pagination. If the INSERT fails with a recursion-depth error, the
`SET SESSION cte_max_recursion_depth` line was not applied in the same session.

**Code example: before and after an index.** EXPLAIN output below is **illustrative**: the exact `rows`
numbers and sometimes the chosen plan vary by data and MySQL version. Learn to read the shape, not memorize
numbers (full EXPLAIN reading is Day 6).

```sql
EXPLAIN SELECT id, title FROM tasks_big WHERE title = 'Task 150000';
```

```
+----+-------------+-----------+------+---------------+------+---------+------+--------+----------+-------------+
| id | select_type | table     | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra       |
+----+-------------+-----------+------+---------------+------+---------+------+--------+----------+-------------+
|  1 | SIMPLE      | tasks_big | ALL  | NULL          | NULL | NULL    | NULL | 199xxx |    10.00 | Using where |
+----+-------------+-----------+------+---------------+------+---------+------+--------+----------+-------------+
```

`type = ALL` is a **full table scan**: every row is read and tested. Add an index and compare:

```sql
CREATE INDEX idx_tasks_big_title ON tasks_big (title);
EXPLAIN SELECT id, title FROM tasks_big WHERE title = 'Task 150000';
```

```
| id | select_type | table     | type | possible_keys       | key                 | key_len | ref   | rows | filtered | Extra       |
|  1 | SIMPLE      | tasks_big | ref  | idx_tasks_big_title | idx_tasks_big_title | 802     | const |    1 |   100.00 | Using index |
```

`type = ref`, `rows = 1`, and because we select only `id` (inside every secondary index as the PK) and `title`
(in the index), it is even a **covering** read (`Using index`). `key_len = 802`: 200 chars x 4 bytes (utf8mb4)
+ 2 bytes length. Drop the index to keep Day 3 experiments clean:

```sql
DROP INDEX idx_tasks_big_title ON tasks_big;
```

**Useful index commands.**

```sql
SHOW INDEX FROM tasks;                        -- columns, Cardinality estimate, uniqueness
CREATE INDEX idx_orders_status ON orders (status);
ALTER TABLE orders ADD INDEX idx_orders_user_created (user_id, created_at), ALGORITHM=INPLACE, LOCK=NONE;
DROP INDEX idx_orders_status ON orders;
ALTER TABLE orders DROP INDEX idx_orders_user_created;

-- Prefix index: index only the first 20 chars of a long string (smaller, but not covering, no ORDER BY help)
-- CREATE INDEX idx_title_prefix ON tasks_big (title(20));

-- Functional index (8.0.13+): index an expression so `WHERE DATE(created_at) = ...` can use it
CREATE INDEX idx_orders_day ON orders ((DATE(created_at)));
DROP INDEX idx_orders_day ON orders;

-- Invisible index (8.0): test "what if this index did not exist" without dropping it
-- ALTER TABLE tasks_big ALTER INDEX idx_name INVISIBLE;   then VISIBLE again if the plan got worse
```

Adding an index on a big production table: InnoDB `ALGORITHM=INPLACE, LOCK=NONE` allows concurrent DML for
secondary indexes, but it still consumes IO and can lag replicas. Large tables use online schema change tools
(gh-ost, pt-online-schema-change). [ADVANCED]

**Frontend connection.** Index = `Map` / `Object` lookup instead of `Array.prototype.find`. A secondary index
is like keeping a second sorted array `[{status, id}]`: you find ids fast, but then still need
`rowsById[id]` (the clustered index) to get the full object, unless the index already has every field you need.

**Real-world scenario.** The "My Orders" page in a marketplace goes from 20 ms to 6 seconds after 5 million
orders: `WHERE user_id = ? ORDER BY created_at DESC LIMIT 20` does a full scan + filesort because `orders` has no
index starting with `user_id`. Adding `(user_id, created_at)` brings it back to milliseconds.

**Interview answer:** "An index is a B+Tree that lets MySQL find rows without scanning the whole table. In
InnoDB the primary key is the clustered index and holds the full rows; secondary indexes store the indexed
columns plus the primary key, so a lookup may need a second hop to the clustered index unless the index is
covering. I index foreign keys, join columns, and columns used in selective filters and in ORDER BY with LIMIT.
Indexes cost write performance and memory, so I add them based on actual query patterns and verify with
EXPLAIN."

**Follow-up questions**
- Q: Why B+Tree and not a hash or binary tree? A: Wide nodes minimize disk reads (height 3-4); leaves are
  linked in order so range queries and ORDER BY are efficient; hash only supports equality.
- Q: What is a covering index? A: An index containing every column the query needs, so InnoDB answers from the
  index alone (`Using index`), skipping the clustered lookup.
- Q: Why can an index be ignored even when it exists? A: Low selectivity (optimizer prefers a scan), function or
  implicit type conversion on the column, leading wildcard `LIKE '%x'`, stale statistics, or a better composite
  index.
- Q: Why is an auto-increment PK usually better than a random UUID PK in InnoDB? A: Sequential inserts avoid
  page splits and keep secondary indexes small; random keys cause fragmentation and cache misses.
- Q: What is cardinality? A: Estimated count of distinct values in an index; `SHOW INDEX` exposes it and
  `ANALYZE TABLE` refreshes it.
- Q: Do indexes help `LIKE 'abc%'`? A: Yes (range scan). `LIKE '%abc'` cannot use a B+Tree; use FULLTEXT or
  an external search engine. [ADVANCED]
- Q: Do NULLs get indexed? A: Yes, InnoDB indexes NULLs; `IS NULL` can use an index.

**Common mistakes**
- Indexing every column "to be safe" (slows writes, bloats memory).
- Wrapping an indexed column in a function: `WHERE DATE(created_at) = '2026-09-15'`,
  `WHERE LOWER(email) = ?`, `WHERE amount + 1 > 10`. Use a range or a functional index.
- Comparing a string column with a number (`WHERE phone = 9876543210` converts every row) -- implicit conversion
  prevents index use. Keep types matching.
- Indexing low-selectivity columns alone (`is_active`).
- Never measuring: adding indexes by guess instead of reading EXPLAIN.

**Revision notes**
- Clustered = PK tree holding rows; secondary = (cols + PK) -> second lookup unless covering.
- Index FKs, join columns, filter/sort columns. Beware low selectivity and functions on columns.
- Sequential PKs. ALTER ... ALGORITHM=INPLACE for online index add.

### T3.3 Composite indexes and the leftmost prefix rule [ESSENTIAL]

**Concept.** Composite (multi-column) index ek hi B+Tree hai jisme rows `(col1, col2, col3)` ke order mein sorted
hoti hain: pehle col1 se, col1 barabar ho to col2 se, aur aise hi. Isliye ye **leftmost prefix** se hi kaam karta
hai: jaise phone book `(last_name, first_name)` mein sorted hai, aap sirf first_name se nahi dhoondh sakte.

**Why it matters.** Real queries filter on 2-3 columns and sort ("tasks of this project, status todo, newest
first"). One well-designed composite index replaces several single-column indexes and also removes the
sort step. The leftmost prefix rule and column ordering are among the top MySQL interview questions.

**Internal working.** Consider `INDEX idx_proj_status_created (project_id, status, created_at)` on
`tasks_big`. The leaf level looks like:

```
(1,'todo',  2026-01-01 00:00:00, id=..)
(1,'todo',  2026-01-01 00:01:00, id=..)
(1,'in_progress', ...)
(1,'done', ...)
(2,'todo', ...)            <- all project 2 rows are contiguous, inside them status is contiguous,
(2,'todo', ...)               inside them created_at is already SORTED
```

MySQL can seek to a contiguous range **only** by fixing columns from the left. Once a column uses a **range**
(`>`, `<`, `BETWEEN`, `LIKE 'x%'`, or an `IN` with several values producing several ranges), columns to the
right can no longer narrow the seek (they may still be checked as filters inside the index, via **Index
Condition Pushdown**, shown as `Using index condition`).

**Step by step on the data we generated.** Query we want to speed up:

```sql
SELECT id, title, created_at
FROM tasks_big
WHERE project_id = 2 AND status = 'todo'
ORDER BY created_at DESC
LIMIT 20;
```

Step 0, no secondary index (we dropped them): full scan + sort.

```
| type | key  | key_len | rows   | filtered | Extra                       |
| ALL  | NULL | NULL    | 199xxx |     3.33 | Using where; Using filesort |
```

Step 1, single-column index on `project_id`:

```sql
CREATE INDEX idx_tb_project ON tasks_big (project_id);
```

```
| type | key            | key_len | ref   | rows  | filtered | Extra                       |
| ref  | idx_tb_project | 8       | const | 97xxx |    33.33 | Using where; Using filesort |
```

(Because project 2 is a third of the table, the optimizer may even choose `ALL`; this is the low selectivity
lesson.) It still has to read ~66,000 rows, filter status, and sort the survivors.

Step 2, the composite index:

```sql
CREATE INDEX idx_proj_status_created ON tasks_big (project_id, status, created_at);
```

```
| type | key                     | key_len | ref         | rows  | filtered | Extra               |
| ref  | idx_proj_status_created | 9       | const,const | 42xxx |   100.00 | Using where; Backward index scan |
```

- `ref: const,const` means the first TWO index columns are fixed by equality: `key_len = 9` = 8 bytes
  (BIGINT UNSIGNED NOT NULL) + 1 byte (ENUM with fewer than 256 values, NOT NULL).
- No `Using filesort`: rows inside that (project, status) slice are already in `created_at` order, MySQL just
  reads the index **backwards** (`Backward index scan`) and stops after 20 rows because of `LIMIT 20`. The
  `rows` estimate (42xxx on MySQL 8.0.46; the true slice holds 22,223 rows, so the estimate is rough) is the
  size of the slice, not the number of rows actually read thanks to LIMIT. Run `EXPLAIN ANALYZE` (8.0.18+) to see real row counts (Day 6).

```sql
DROP INDEX idx_tb_project ON tasks_big;   -- redundant now: the composite starts with project_id
```

Drop-the-prefix rule: an index on `(project_id)` is **redundant** if `(project_id, status, created_at)` exists
(except when a unique constraint or covering need differs).

**Leftmost prefix table** (index `(project_id, status, created_at)`):

| WHERE / ORDER BY | Index use | Why |
|------------------|-----------|-----|
| `project_id = 2` | yes, key_len 8 | first column |
| `project_id = 2 AND status = 'todo'` | yes, key_len 9 | first two columns |
| `project_id = 2 AND status = 'todo' AND created_at > '2026-01-10'` | yes, all 3 (range on the last column) | equality, equality, range |
| `status = 'todo'` | no seek (first column missing) | not a leftmost prefix; the optimizer may scan the whole index or table |
| `created_at > '2026-01-10'` | no seek | same |
| `project_id = 2 AND created_at > '2026-01-10'` | seeks on `project_id` only; `created_at` filtered inside the index (ICP, `Using index condition`) | status is skipped |
| `project_id = 2 ORDER BY created_at` | seeks on project_id, but needs `Using filesort` | `status` sits between them, so rows are not in created_at order |
| `project_id = 2 AND status = 'todo' ORDER BY created_at DESC` | yes and **no sort** | slice is already ordered |
| `project_id = 2 AND status IN ('todo','done') ORDER BY created_at` | can seek two ranges, but needs `Using filesort` (on our 200k data with `SELECT *` the optimizer even chose a full scan + filesort) | two ranges are each sorted but not merged |

In MySQL 8.0.13+ a **skip scan** can sometimes use an index even when the leading column is not in WHERE (it
internally loops over the distinct values of the missing leading column) but only for narrow cases such as a
covered query with a low-cardinality prefix. Do not rely on it as a design tool. [ADVANCED]

**Column ordering rules (use these in the interview):**
1. Put **equality** columns first (`=`, `IS NULL`).
2. Then the column used for **ORDER BY** (so no sort), or the single **range** column -- a range stops later
   columns from being used for seeking. If a query has both a range and an ORDER BY on different columns, you must
   choose which one the index serves.
3. Among equality columns, the order matters less for a single query (they are all fixed) -- choose the order that
   serves **most queries** via prefixes (a column that appears alone in other queries goes first). "Put the
   most selective column first" is a rule of thumb for **single-predicate** lookups, not a law for composites.
4. Add trailing columns to make it **covering** for hot read-only queries (keep it narrow, though).

**Covering composite example:**

```sql
-- Only columns inside (project_id, status, created_at) + PK id are needed -> "Using index"
EXPLAIN SELECT id, status, created_at
FROM tasks_big
WHERE project_id = 2 AND status = 'todo'
ORDER BY created_at DESC
LIMIT 20;
-- Extra: Using where; Backward index scan; Using index
```

Selecting `title` as well (as in the first query) forces a lookup in the clustered index for just the 20
returned rows: acceptable.

**Code example in Node: allow-listed sort so the index design stays valid.**

```js
// src/tasks.list.js
import { pool } from './db.js';

const SORT_COLUMNS = { createdAt: 'created_at', priority: 'priority', dueDate: 'due_date' };
const STATUSES = new Set(['todo', 'in_progress', 'done']);

export async function listTasks({ projectId, status, sortBy = 'createdAt', dir = 'desc', limit = 20 }) {
  if (!Number.isInteger(projectId)) throw new Error('projectId must be an integer');
  if (status && !STATUSES.has(status)) throw new Error('invalid status');
  const column = SORT_COLUMNS[sortBy];          // identifiers cannot be bound with ?, so allow-list them
  if (!column) throw new Error('invalid sort field');
  const direction = dir === 'asc' ? 'ASC' : 'DESC';
  const size = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const where = ['project_id = ?'];
  const params = [projectId];
  if (status) { where.push('status = ?'); params.push(status); }

  const sql = `SELECT id, title, status, priority, created_at
               FROM tasks_big
               WHERE ${where.join(' AND ')}
               ORDER BY ${column} ${direction}, id ${direction}
               LIMIT ${size}`;           // size is a validated integer, safe to inline
  const [rows] = await pool.query(sql, params);
  return rows;
}
```

The SQL text contains only allow-listed identifiers and a clamped integer; all user values go through `?`.
(Note: `LIMIT ?` with `pool.execute` is version dependent. Tested against MySQL 8.0.46: mysql2 2.3.3, 3.0.0, 3.9.0
and 3.20.0 throw "Incorrect arguments to mysqld_stmt_execute" when you pass a JS **number** (the number is sent as a
DOUBLE) but accept the **string** `'20'`; mysql2 3.24.6 accepts both. The opposite holds for `pool.query`: a number
works but a string like `'20'` becomes `LIMIT '20'` and fails with a syntax error. A clamped inlined integer with
`query` avoids all of this.)

**Frontend connection.** Composite index = sorting a table by multiple columns in a data grid (sort by project,
then status, then date): the rows for one project/status are adjacent and already in date order. You cannot
efficiently find "all rows with status todo" in a grid sorted by project first without scanning everything.

**Real-world scenario.** Payments table, "show my last 20 transactions with status `settled`":
`WHERE account_id = ? AND status = 'settled' ORDER BY created_at DESC LIMIT 20` -> index
`(account_id, status, created_at)`. The same index also serves "all transactions of my account" (prefix 1).
Adding a separate `(status)` index would be useless alone.

**Interview answer:** "A composite index sorts by its first column, then the second, and so on, so MySQL can
use it only from the leftmost column: (a,b,c) supports a, a+b and a+b+c, but not b or c alone. I order columns
with equality predicates first, then the range or ORDER BY column, which lets MySQL both seek and return rows
already sorted without a filesort. A range condition stops later columns from being used for seeking. I confirm
with EXPLAIN, looking at key_len and the Extra column."

**Follow-up questions**
- Q: Given index (a,b,c), which of these use it: `WHERE b=1`, `WHERE a=1 AND c=3`, `WHERE a=1 ORDER BY b`?
  A: `b=1` no (no leftmost); `a=1 AND c=3` seeks on `a` only, `c` filtered by ICP; `a=1 ORDER BY b` yes,
  seeks and sorts for free.
- Q: One composite index or three single-column indexes? A: The composite for queries that filter on the columns
  together; MySQL can merge single indexes (index merge) but it is usually slower and less predictable.
- Q: Is (a,b) redundant if I have (a,b,c)? A: Yes (prefix), unless uniqueness differs. (b,a) is NOT redundant.
- Q: How big can an index be? A: InnoDB max key length is 3072 bytes for DYNAMIC row format; utf8mb4 uses up to 4
  bytes per character, so a `VARCHAR(255)` indexed fully is 1020 bytes. Composite keys count the sum.
- Q: What is Index Condition Pushdown? A: The storage engine evaluates extra conditions on index columns before
  fetching full rows (`Using index condition`), cutting clustered lookups.
- Q: How do indexes interact with ORDER BY DESC? A: MySQL 8 supports real descending indexes
  (`INDEX (a ASC, b DESC)`) and can also scan a normal index backwards; mixed-direction ORDER BY needs an index
  with matching directions.

**Common mistakes**
- Putting the range column before equality columns.
- Creating (a), (a,b) and (a,b,c): the first two are redundant.
- Index column order that does not match the dominant query.
- Expecting `WHERE b = ?` to use `(a,b)`.
- Adding a composite index and forgetting to run `EXPLAIN` to confirm it is chosen.

**Revision notes**
- (a,b,c) covers a / a,b / a,b,c prefixes. Equality first, then range or ORDER BY.
- Range stops later columns from seeking (they can still filter via ICP).
- Composite index can remove filesort when ORDER BY matches the column after the equality columns.
- `key_len` tells how many index columns were used.

### End of Day 3

**Key concepts to remember**
1. 1NF atomic values, 2NF whole-key dependence, 3NF no transitive dependence; denormalize only on purpose.
2. InnoDB: clustered PK holds rows; secondary indexes carry the PK; covering index avoids the second lookup.
3. Index FKs/join columns/filter columns; watch selectivity, functions on columns, implicit conversions.
4. Leftmost prefix: (a,b,c) serves a / a,b / a,b,c. Equality first, then range/ORDER BY.
5. Indexes cost writes + memory; verify with EXPLAIN (`type`, `key`, `key_len`, `Extra`).
6. Sequential BIGINT PK beats random UUID PK in InnoDB.

**Five revision questions**
1. Convert `task_flat` into 3NF tables and name the normal form each step fixes.
2. Why does a secondary index in InnoDB store the primary key, and what is the performance consequence?
3. For `WHERE assignee_id = ? AND status <> 'done' ORDER BY due_date` what composite index would you propose and why?
4. Why can `WHERE DATE(created_at) = '2026-01-05'` not use an index on `created_at`, and give two fixes.
5. Index is `(project_id, status, created_at)`. Which of the following can it serve without a filesort:
   `project_id=2 ORDER BY created_at`; `project_id=2 AND status='todo' ORDER BY created_at`?

**One practical coding task**
On `tasks_big`, write three queries (assignee workload, overdue open tasks per project, latest 20 tasks of a
project) and for each: run `EXPLAIN` with no index, design one composite index, create it, run `EXPLAIN` again,
and record `type`, `key`, `key_len`, `rows`, `Extra` before and after in a small table. Then drop the extra
indexes so Day 6 starts from a known state (keep PK only).

**Self-assessment checklist**
- [ ] I loaded `tasks_big` (200,000 rows) successfully.
- [ ] I can explain clustered vs secondary indexes and what "covering" means.
- [ ] I can state the leftmost prefix rule and give three examples without notes.
- [ ] I can compute `key_len` for BIGINT/ENUM/DATETIME columns roughly.
- [ ] I know three ways an index gets ignored.
- [ ] I can justify when to denormalize with a real example.

---

## Day 4 - Transactions, ACID, isolation levels, concurrency problems (Day 25)

**Estimated time (2 hours):** 30 min transactions + ACID (T4.1), 50 min isolation levels with the two-session
demos (T4.2), 25 min lost update strategies (T4.3), 15 min revision questions + coding task.
Open **two `mysql` terminals** (Session A and Session B) before you start. This is the highest-value day of the
week for interviews: do the demos with your own hands.

**Learning objectives**
- Define a transaction and explain each ACID property with the InnoDB mechanism behind it (undo log, redo log,
  MVCC, locks).
- Use `START TRANSACTION`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`; know autocommit and implicit commits.
- Name the isolation levels and the phenomena each one prevents (dirty read, non-repeatable read, phantom read,
  lost update) and reproduce them in two sessions.
- Explain InnoDB's `REPEATABLE READ` specifics: consistent snapshot reads, current reads, next-key locks.
- Prevent lost updates with atomic `UPDATE`, `SELECT ... FOR UPDATE`, or optimistic locking (version column).

Reset helper (run in any session before each demo to get known values):

```sql
UPDATE accounts SET balance = 1000.00, version = 0 WHERE id = 1;
UPDATE accounts SET balance = 200.00,  version = 0 WHERE id = 2;
UPDATE accounts SET balance = 50.00,   version = 0 WHERE id = 3;
DELETE FROM tasks WHERE title IN ('Phantom task', 'Blocked insert');
```

### T4.1 Transactions and ACID [ESSENTIAL]

**Concept.** Transaction = multiple SQL statements ka ek **all-or-nothing** unit. Ya to saare apply honge
(`COMMIT`), ya koi bhi nahi (`ROLLBACK`). Classic example: bank transfer, paise ek account se katna aur doosre
mein jodna -- beech mein crash ho jaye to paisa gayab nahi hona chahiye.

**ACID:**

| Property | Meaning | InnoDB mechanism |
|----------|---------|------------------|
| **A**tomicity | all statements apply or none do | **undo log** stores old row versions so a rollback can restore them |
| **C**onsistency | a transaction moves the DB from one valid state to another (constraints, invariants hold) | constraints (PK, UNIQUE, FK, CHECK) + application logic. The DB enforces declared rules; **you** define the rest |
| **I**solation | concurrent transactions do not see each other's half-done work (to a degree set by the isolation level) | **MVCC** (multi-version snapshots from the undo log) + **row/gap locks** |
| **D**urability | once committed, data survives crash/power loss | **redo log** (write-ahead log) flushed at commit, doublewrite buffer for torn pages |

**Why it matters.** Any multi-step write (order + order items + stock decrement + payment record) needs a
transaction or a crash/race leaves partial data. Interviewers test whether you know *which* property a given
feature gives, and that "Consistency" is partly your responsibility.

**Internal working (short).**
1. `autocommit=1` is the default: every statement is its own transaction. `START TRANSACTION` (or `BEGIN`)
   turns that off until `COMMIT`/`ROLLBACK`.
2. Changing a row: InnoDB copies the old version into the **undo log**, modifies the page in the **buffer
   pool**, and appends a record to the **redo log** (sequential write, cheap). Dirty pages are flushed to disk
   later by a background thread.
3. `COMMIT` flushes the redo log to disk (fsync). That sequential write, not the scattered data pages, is what
   makes the commit durable. This is governed by `innodb_flush_log_at_trx_commit`:
   `1` (default, full ACID, fsync per commit), `2` (write to OS cache each commit, fsync each second: may lose up
   to ~1 second on OS crash), `0` (flush each second: may lose ~1 second on mysqld crash). Together with
   `sync_binlog=1` this is the "durable" configuration. Lower values trade safety for speed.
4. `ROLLBACK` uses undo records to restore old row versions. Crash recovery replays redo (roll forward) and then
   rolls back uncommitted transactions using undo.
5. A failed **statement** rolls back only that statement; the transaction stays open (you must still decide to
   `ROLLBACK` or continue). Exceptions: a **deadlock** (error 1213) rolls back the whole transaction; a
   **lock wait timeout** (error 1205) rolls back only the statement by default.
6. **Implicit commit:** DDL (`CREATE/ALTER/DROP/TRUNCATE TABLE`) and some other statements silently commit the
   current transaction. Never mix DDL into a transaction expecting it to roll back.

**Code example: money transfer, success and failure.**

```sql
-- Session A. Reset helper above first. Transfer 100.00 from account 1 to account 2.
START TRANSACTION;
UPDATE accounts SET balance = balance - 100.00 WHERE id = 1 AND balance >= 100.00;
SELECT ROW_COUNT();                          -- must be 1, otherwise insufficient funds: ROLLBACK
UPDATE accounts SET balance = balance + 100.00 WHERE id = 2;
COMMIT;
SELECT id, balance FROM accounts ORDER BY id;   -- 900.00, 300.00, 50.00

-- Failure path: account 3 has only 50.00; the CHECK (balance >= 0) protects the invariant
START TRANSACTION;
UPDATE accounts SET balance = balance - 80.00 WHERE id = 3;
-- ERROR 3819 (HY000): Check constraint 'chk_accounts_balance' is violated.
-- The failed statement was undone, the transaction is STILL OPEN.
ROLLBACK;                                    -- explicit rollback ends it (balance of 3 unchanged)
```

Savepoints allow partial rollback inside one transaction:

```sql
START TRANSACTION;
INSERT INTO orders (user_id, amount, status) VALUES (3, 10.00, 'pending');
SAVEPOINT after_order;
INSERT INTO orders (user_id, amount, status) VALUES (3, 20.00, 'pending');
ROLLBACK TO SAVEPOINT after_order;           -- removes only the second insert
COMMIT;                                      -- the first insert is committed
DELETE FROM orders WHERE amount = 10.00 AND user_id = 3;   -- clean up our demo row
```

**Code example: Node.js (mysql2/promise) transaction with an explicit connection.**

```js
// src/transfer.js  (full pool setup and a retrying helper come on Day 5)
import { pool } from './db.js';

export async function transfer(fromAccountId, toAccountId, amount) {
  const conn = await pool.getConnection();          // one dedicated connection = one session
  try {
    await conn.beginTransaction();

    const [debit] = await conn.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amount, fromAccountId, amount]
    );
    if (debit.affectedRows !== 1) throw new Error('INSUFFICIENT_FUNDS');

    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toAccountId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();                           // undo everything done on THIS connection
    throw err;
  } finally {
    conn.release();                                  // ALWAYS give the connection back to the pool
  }
}
```

Why `getConnection()` and not `pool.execute(...)` for each statement: a transaction lives on **one**
connection. `pool.execute` may use a different connection for every call, so `BEGIN` and the updates would run
in different sessions and nothing would be atomic. `amount` is passed as a string/number validated earlier
(never float arithmetic for money; the `DECIMAL` math happens in MySQL).

**Frontend connection.** Like a React form where you build a draft state and only `setState` the real one on
Submit; if validation fails you throw the draft away. Or Redux `batch`/Immer draft: either all changes land, or
none. The big difference: DB transactions also have to cope with **other users** changing the same data at the
same time.

**Real-world scenario.** Checkout: insert `orders`, insert `order_items`, decrement stock, insert `payments`.
A crash after the stock update but before the payment row would leave stock reduced with no order. Wrap
all four in one transaction. (Calls to an external payment gateway cannot be rolled back by MySQL; Week 7
covers sagas and idempotency for that.)

**Interview answer:** "A transaction groups statements into an atomic unit. ACID: atomicity means all or
nothing, implemented by InnoDB's undo log; consistency means constraints and invariants hold before and after;
isolation means concurrent transactions do not interfere beyond what the isolation level allows, implemented with
MVCC and row locks; durability means committed data survives a crash, implemented with the write-ahead redo log
flushed at commit. In Node I use one connection from the pool for the whole transaction, commit on success,
roll back on error and always release the connection in a finally block."

**Follow-up questions**
- Q: What is autocommit? A: Default mode where each statement commits immediately. `START TRANSACTION` suspends
  it until COMMIT/ROLLBACK.
- Q: What happens if the app crashes mid-transaction? A: The connection drops; MySQL rolls back the
  uncommitted transaction (undo). Committed work survives (redo).
- Q: Does DDL participate in transactions? A: No, in MySQL DDL causes an implicit commit (MySQL 8 DDL itself is
  atomic per statement, but it commits whatever was pending).
- Q: Is a longer transaction a problem? A: Yes: holds locks longer, keeps old undo versions alive (history list
  growth), raises deadlock and timeout probability. Keep transactions short and never wait for user input or
  external HTTP calls inside them.
- Q: Which property does `innodb_flush_log_at_trx_commit` relate to? A: Durability.
- Q: Are single statements atomic? A: Yes, each single statement is atomic (it fully applies or fully fails).
- Q: What are distributed transactions? A: XA/two-phase commit across systems; usually avoided in favor of
  sagas, outbox pattern and idempotent retries (Week 7). [ADVANCED]

**Common mistakes**
- Using `pool.execute` for each step of a "transaction" (different connections).
- Forgetting `conn.release()` on error paths (pool exhaustion, Day 5).
- Holding a transaction open across an HTTP call to a payment provider.
- Assuming "failed statement == whole transaction rolled back".
- Doing `SELECT` then `UPDATE balance = <value computed in JS>` (lost update, T4.3).

**Revision notes**
- ACID with mechanisms: undo, constraints, MVCC+locks, redo.
- One transaction = one connection. Always COMMIT/ROLLBACK/release.
- Statement error != transaction rollback (except deadlock). DDL = implicit commit.

### T4.2 Isolation levels and concurrency phenomena [ESSENTIAL]

**Concept.** Jab multiple transactions parallel chalte hain, to ek doosre ka data kitna dekh sakta hai --
ye **isolation level** decide karta hai. Zyada isolation = zyada safety, kam concurrency/performance.

**The phenomena:**
- **Dirty read:** reading data another transaction has not committed (it might roll back).
- **Non-repeatable read:** same row read twice in one transaction returns different values because another
  transaction committed an UPDATE in between.
- **Phantom read:** same range query run twice returns different **sets of rows** because another transaction
  committed an INSERT/DELETE in the range.
- **Lost update:** two transactions read the same value, both compute a new value and write it; the first write is
  overwritten (T4.3).

**The levels (SQL standard) and what MySQL/InnoDB does:**

| Level | Dirty read | Non-repeatable read | Phantom read | InnoDB notes |
|-------|:---:|:---:|:---:|--------------|
| READ UNCOMMITTED | possible | possible | possible | reads latest data even if uncommitted; rarely used |
| READ COMMITTED | no | possible | possible | new snapshot per **statement**; mostly no gap locks |
| **REPEATABLE READ** (default) | no | no (snapshot) | no for plain reads, locking reads use next-key locks | one snapshot per **transaction**; InnoDB is stricter than the standard here |
| SERIALIZABLE | no | no | no | plain SELECT becomes `SELECT ... FOR SHARE` (when autocommit is off): readers block writers |

Precisely: the SQL standard allows phantoms at REPEATABLE READ, but InnoDB's snapshot hides them for normal
SELECTs, and next-key locks block them for locking reads. What REPEATABLE READ still **does not** prevent:
lost updates in the read-modify-write pattern, and **write skew** (two transactions each read a set, each write a
different row, and together break an invariant). [ADVANCED]

**Why it matters.** "Explain isolation levels with an example", "what is MVCC", "what is the default level in
MySQL vs PostgreSQL (READ COMMITTED)" -- these are asked constantly, plus a scenario like "two requests
withdraw at the same time, what happens?".

**Internal working: MVCC and read views.**
- Every InnoDB row carries hidden columns: the id of the transaction that last changed it (`DB_TRX_ID`) and a
  pointer to its previous version in the undo log (`DB_ROLL_PTR`). Old versions form a chain.
- A **consistent (non-locking) read** (a plain `SELECT`) uses a **read view**: a snapshot saying "which
  transaction ids are committed as of now". InnoDB walks the version chain until it finds a version visible to the
  view. Readers do not take row locks, so **readers do not block writers and writers do not block readers**.
- `READ COMMITTED` builds a new read view for **each statement**; `REPEATABLE READ` builds one at the **first
  consistent read** in the transaction (or at `START TRANSACTION WITH CONSISTENT SNAPSHOT`) and reuses it.
- A **current (locking) read** -- `SELECT ... FOR UPDATE`, `SELECT ... FOR SHARE`, `UPDATE`, `DELETE`, `INSERT`
  -- always reads the **latest committed** version and locks it. So inside one RR transaction a plain `SELECT` can
  show a value different from what a subsequent `UPDATE` actually operates on. This is the root of many confusing
  interview puzzles.
- Locks types: record lock (one index record), gap lock (the gap between records), **next-key lock** (record +
  gap before it). In RR, range locking reads use next-key locks, which is what stops phantom inserts. In RC,
  gap locking is mostly off (so more concurrency, but phantoms are possible). (Day 5 covers lock details.)

**Check and change the level.**

```sql
SELECT @@transaction_isolation;                          -- REPEATABLE-READ (default)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;          -- affects only the NEXT transaction in this session
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ; -- all following transactions of this session
-- SET GLOBAL ...  affects new connections; needs privileges
```

**Demo 1 - dirty read (READ UNCOMMITTED).** Run the reset helper first.

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;` | | next transaction of A uses RU |
| 2 | `START TRANSACTION;` | `START TRANSACTION;` | |
| 3 | | `UPDATE accounts SET balance = 0 WHERE id = 1;` | B has NOT committed |
| 4 | `SELECT balance FROM accounts WHERE id = 1;` | | **0.00** (dirty read of uncommitted data) |
| 5 | | `ROLLBACK;` | the 0.00 never officially existed |
| 6 | `SELECT balance FROM accounts WHERE id = 1;` | | 1000.00 |
| 7 | `COMMIT;` | | |

If step 4 returned 1000.00 your session was not at READ UNCOMMITTED (check `SELECT @@transaction_isolation;`
inside the transaction). Under the default REPEATABLE READ A would see 1000.00 in step 4: no dirty read.

**Demo 2 - non-repeatable read: READ COMMITTED vs REPEATABLE READ.**

Part 1, `REPEATABLE READ` (default):

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | | |
| 2 | `SELECT balance FROM accounts WHERE id = 1;` | | 1000.00 (snapshot is created here) |
| 3 | | `UPDATE accounts SET balance = 900.00 WHERE id = 1;` (autocommit: committed immediately) | |
| 4 | `SELECT balance FROM accounts WHERE id = 1;` | | **1000.00** again: repeatable read via snapshot |
| 5 | `COMMIT;` | | |
| 6 | `SELECT balance FROM accounts WHERE id = 1;` | | 900.00 (new snapshot after commit) |

Part 2, repeat with `SET TRANSACTION ISOLATION LEVEL READ COMMITTED;` before A's `START TRANSACTION;` (reset the
balance to 1000 first). Step 4 now returns **900.00**: a **non-repeatable read**, because each statement gets a
fresh snapshot.

**Demo 3 - phantom reads and next-key locks (REPEATABLE READ).** Project 2 has 4 tasks.

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | | |
| 2 | `SELECT COUNT(*) FROM tasks WHERE project_id = 2;` | | 4 (snapshot created) |
| 3 | | `INSERT INTO tasks (project_id, title) VALUES (2, 'Phantom task');` (autocommit) | committed |
| 4 | `SELECT COUNT(*) FROM tasks WHERE project_id = 2;` | | **4**: snapshot hides the phantom |
| 5 | `SELECT COUNT(*) FROM tasks WHERE project_id = 2 FOR UPDATE;` | | **5**: a current read sees the latest committed rows |
| 6 | `UPDATE tasks SET priority = 4 WHERE project_id = 2 AND title = 'Phantom task';` | | 1 row matched and changed (A modified a row its snapshot cannot see) |
| 7 | `SELECT COUNT(*) FROM tasks WHERE project_id = 2;` | | **5**: A's own change made that row visible. Mixed snapshot + current reads give surprising results |
| 8 | `ROLLBACK;` | | |

Lesson: in InnoDB RR, plain SELECTs are consistent with the snapshot, but statements that write or lock read the
**latest** data. If you need a decision based on the current set (e.g. "is the slot still free"), use a locking
read, not a plain SELECT.

Now the **locking read** that prevents the phantom from being inserted at all:

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | | |
| 2 | `SELECT id FROM tasks WHERE project_id = 2 FOR UPDATE;` | | rows 6, 7, 8, 9 (plus the 'Phantom task' row if it still exists) locked, plus the gap(s) |
| 3 | | `INSERT INTO tasks (project_id, title) VALUES (2, 'Blocked insert');` | **B waits** (blocked by A's next-key/gap lock on `idx_tasks_project`) |
| 4 | `COMMIT;` | | B's INSERT immediately completes |
| 5 | | (if you wait more than `innodb_lock_wait_timeout`, default 50 s, B gets `ERROR 1205: Lock wait timeout exceeded; try restarting transaction`) | |

Clean up: run the reset helper's `DELETE` line.

**Why default RR vs RC debate (interview gold).**
- InnoDB default is REPEATABLE READ (MySQL), PostgreSQL's default is READ COMMITTED.
- Many high-concurrency MySQL shops run **READ COMMITTED** (requires `binlog_format=ROW`, the default in 8.0)
  because it takes far fewer gap locks, which means fewer lock waits and deadlocks, and every statement sees fresh
  data. The price: non-repeatable reads and phantoms within a transaction, which the app must tolerate.

**Code example (Node): choosing the level per transaction.** Set it **before** `beginTransaction`; it applies
to the next transaction only, so it does not leak into the next user of the pooled connection.

```js
await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
await conn.beginTransaction();
// ... queries ...
await conn.commit();
```

(Avoid `SET SESSION ...` on a pooled connection: the setting sticks to the connection after `release()` and
silently affects later requests.)

**Frontend connection.** MVCC = **immutable snapshots**: like holding a reference to an old Redux state object
while new actions produce new state objects; your reference never changes under you. READ COMMITTED is like
re-reading `store.getState()` each time (you see updates between reads).

**Real-world scenario.** Inventory/booking: two users book the last seat. Both do `SELECT seats_left`, both see 1,
both decrement. Without a locking read or an atomic conditional `UPDATE ... WHERE seats_left > 0`, you
oversell. Isolation level alone (RR) does not fix this because the plain SELECT came from a snapshot.

**Interview answer:** "Isolation levels control which anomalies concurrent transactions can see. READ
UNCOMMITTED allows dirty reads, READ COMMITTED prevents them but allows non-repeatable reads and phantoms,
REPEATABLE READ gives one snapshot per transaction, and SERIALIZABLE effectively makes readers take shared locks.
MySQL's default is REPEATABLE READ, implemented with MVCC for plain reads and next-key locks for locking reads,
so InnoDB also prevents phantoms in most cases. It does not prevent lost updates from read-modify-write, so for
those I use atomic updates or SELECT ... FOR UPDATE. Many high-write systems use READ COMMITTED to reduce gap
locks and deadlocks."

**Follow-up questions**
- Q: What is MVCC and why do readers not block writers? A: Multi-Version Concurrency Control: writers create new
  row versions (old ones kept in undo log); readers read the version visible to their snapshot without locks.
- Q: What is the difference between a consistent read and a locking read? A: Consistent = plain SELECT from the
  snapshot, no locks. Locking = `FOR UPDATE`/`FOR SHARE`, reads latest data and locks it.
- Q: Does REPEATABLE READ in MySQL allow phantoms? A: For plain SELECTs no (snapshot); for current reads in the
  same transaction you can observe rows committed after the snapshot (Demo 3), but next-key locks prevent
  other sessions from inserting into a range you locked.
- Q: What is a next-key lock? A: Record lock on an index record plus a gap lock on the gap before it; it
  prevents inserts into the range under REPEATABLE READ.
- Q: When would you pick SERIALIZABLE? A: Rarely; for strict correctness on small hot critical sections where
  retries are acceptable. Throughput and deadlock rate suffer.
- Q: Why does the same snapshot not apply to `UPDATE`? A: UPDATE must modify the latest committed version, so it
  does a current read; otherwise it would overwrite newer committed data.
- Q: What is write skew? A: Two transactions read overlapping data, each updates a different row, and the
  combined result breaks a rule (e.g. both on-call doctors go off duty). RR does not prevent it; use locking
  reads on the shared rows or SERIALIZABLE. [ADVANCED]

**Common mistakes**
- Believing REPEATABLE READ prevents lost updates.
- Mixing plain SELECT checks with later writes for business rules ("check then act").
- Setting a session-level isolation level on a pooled connection and not resetting it.
- Saying "READ COMMITTED reads uncommitted data" (confusing it with READ UNCOMMITTED).
- Stating the SQL-standard table as if it describes InnoDB exactly.

**Revision notes**
- RU: dirty reads. RC: statement snapshot. RR (default): transaction snapshot + next-key locks. SERIALIZABLE:
  shared locks on reads.
- Plain SELECT = consistent read, no locks. FOR UPDATE / UPDATE = current read, with locks.
- RR does not stop lost updates or write skew. Use atomic updates or FOR UPDATE.

### T4.3 Lost updates: atomic UPDATE, pessimistic and optimistic locking [ESSENTIAL]

**Concept.** Lost update = do transactions ek hi value padhte hain, dono apna naya value nikalte hain, aur
**baad wala write pehle ko overwrite** kar deta hai. Ye "read-modify-write in application code" ka classic bug hai.

**Why it matters.** This is **the** bug behind overselling, double spending and wrong counters. The usual fix
choices (atomic update vs pessimistic vs optimistic) are a staple interview comparison.

**Demo 4 - the bug (REPEATABLE READ). Two withdrawals (100 and 200) from a balance of 1000.** Reset first.

| Step | Session A (withdraw 100) | Session B (withdraw 200) | Comment |
|------|--------------------------|--------------------------|---------|
| 1 | `START TRANSACTION;` | `START TRANSACTION;` | |
| 2 | `SELECT balance FROM accounts WHERE id = 1;` -> 1000.00 | | app keeps 1000 in a JS variable |
| 3 | | `SELECT balance FROM accounts WHERE id = 1;` -> 1000.00 | |
| 4 | `UPDATE accounts SET balance = 900.00 WHERE id = 1;` | | app computed 1000 - 100 |
| 5 | `COMMIT;` | | |
| 6 | | `UPDATE accounts SET balance = 800.00 WHERE id = 1;` | app computed 1000 - 200 using its **stale** value |
| 7 | | `COMMIT;` | |
| 8 | `SELECT balance FROM accounts WHERE id = 1;` -> | | **800.00** but correct is 700.00. A's withdrawal was lost |

**Fix 1 - atomic relative UPDATE (best default).** Let the database do the arithmetic; the UPDATE performs a
current read under a row lock.

```sql
UPDATE accounts SET balance = balance - 100.00 WHERE id = 1 AND balance >= 100.00;
-- check affectedRows = 1; 0 means insufficient funds
```

Repeat Demo 4 with `SET balance = balance - 100.00` (A) and `balance - 200.00` (B): in step 6 B's UPDATE
applies to A's committed value (900.00) and produces 700.00. The row lock serializes the two writes, the
condition `balance >= x` guards the invariant, and the CHECK constraint is a second safety net. No explicit lock
statements are needed.

**Fix 2 - pessimistic locking with `SELECT ... FOR UPDATE`** (needed when the logic is more complex than one
UPDATE, e.g. check several rows then write):

| Step | Session A | Session B | Comment |
|------|-----------|-----------|---------|
| 1 | `START TRANSACTION;` | `START TRANSACTION;` | |
| 2 | `SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;` -> 1000.00 | | A locks the row |
| 3 | | `SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;` | **B blocks** |
| 4 | `UPDATE accounts SET balance = 900.00 WHERE id = 1;` | | |
| 5 | `COMMIT;` | | lock released |
| 6 | | (B's SELECT returns) **900.00** | locking read sees the latest committed value |
| 7 | | `UPDATE accounts SET balance = 700.00 WHERE id = 1; COMMIT;` | correct: 700.00 |

Costs: blocks other writers (and other locking readers), risk of deadlocks (Day 5: lock rows in a consistent order),
must keep the transaction short.

**Fix 3 - optimistic locking with a version column** (no DB locks held while the user "thinks", ideal for web
forms where the read and write happen in different HTTP requests):

```sql
-- Read: SELECT id, balance, version FROM accounts WHERE id = 1;   -> (1, 1000.00, 0)
-- Write succeeds only if nobody changed the row since we read it:
UPDATE accounts
SET balance = 900.00, version = version + 1
WHERE id = 1 AND version = 0;
-- ROW_COUNT() = 1 -> success.  ROW_COUNT() = 0 -> someone else updated first: re-read and retry / return 409.
```

```js
// optimistic update with retry (ES module)
export async function withdrawOptimistic(pool, accountId, amount, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const [[acc]] = await pool.execute('SELECT balance, version FROM accounts WHERE id = ?', [accountId]);
    if (!acc) throw new Error('ACCOUNT_NOT_FOUND');
    if (Number(acc.balance) < Number(amount)) throw new Error('INSUFFICIENT_FUNDS');

    const [res] = await pool.execute(
      'UPDATE accounts SET balance = balance - ?, version = version + 1 WHERE id = ? AND version = ?',
      [amount, accountId, acc.version]
    );
    if (res.affectedRows === 1) return;      // we won the race
    // somebody else changed the row between our read and write: loop and retry
  }
  throw new Error('CONCURRENT_UPDATE');      // map to HTTP 409 Conflict
}
```

(The balance check uses `Number` only for a quick guard in this demonstration; the authoritative arithmetic is
done by MySQL in the UPDATE. For real money use integer paise or a decimal library.)

HTTP form of optimistic locking: ETag / `If-Match` header or a `version` field in the PUT body, returning
`409 Conflict` or `412 Precondition Failed` when the version is stale (Week 3 tie-in).

**Choosing a strategy:**

| Strategy | Use when | Pros | Cons |
|----------|----------|------|------|
| Atomic `UPDATE ... SET x = x - ? WHERE x >= ?` | single-row counters, balances, stock | simplest, fastest, no explicit locks | only for simple arithmetic |
| `SELECT ... FOR UPDATE` | multi-step logic in one short transaction | correct for complex checks | blocking, deadlocks, lock contention |
| Optimistic (version / ETag) | low conflict, read and write far apart in time | no locks held, scales | retries, conflicts surfaced to client |
| SERIALIZABLE / unique constraints | strict invariants; "only one X per Y" | strong guarantees | throughput, retries |

**Frontend connection.** Optimistic locking is the same as an **optimistic UI** + version check: "I edited version 3
of the form; if the server is on version 4, tell me to refresh". Pessimistic locking is a "document is locked by
another editor" banner.

**Real-world scenario.** Flash sale of 100 units. `UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >
0` and check `affectedRows` handles 10,000 concurrent buyers correctly without overselling and without a
read. Doing `SELECT stock` then `UPDATE products SET stock = ?` in JS oversells.

**Interview answer:** "A lost update happens when two transactions read the same value and both write back a
value computed from it; the later write overwrites the earlier one. REPEATABLE READ does not prevent it. The
simplest fix is an atomic UPDATE like `SET balance = balance - ? WHERE balance >= ?` and checking affectedRows.
For multi-step logic I use SELECT ... FOR UPDATE in a short transaction, locking rows in a consistent order, and
for long-running user edits I use optimistic locking with a version column or ETag and return 409 on conflict."

**Follow-up questions**
- Q: Why does `SELECT ... FOR UPDATE` fix it but a plain SELECT does not? A: It is a current read that takes an
  exclusive lock, so the second transaction waits and then reads the committed value.
- Q: Pessimistic vs optimistic? A: Pessimistic assumes conflicts are common and locks up front; optimistic
  assumes they are rare and detects them at write time via version check.
- Q: What if the table has no index on the WHERE column of FOR UPDATE? A: InnoDB may lock many/all scanned rows
  (and gaps) -- a huge contention source. Always lock via an indexed predicate (Day 5).
- Q: How do you prevent double-processing of the same payment request? A: A UNIQUE idempotency key per request
  plus insert-first (`INSERT` fails with 1062 on duplicate); Week 6/7 cover this.
- Q: Can you do this without transactions at all? A: A single atomic UPDATE is a transaction of one statement.

**Common mistakes**
- Read, compute in JS, write absolute value.
- `FOR UPDATE` on a non-indexed column (locks the world).
- Long user think time inside a pessimistic lock.
- Optimistic update without checking `affectedRows`.
- Using `Number`/float math for money in the Node layer.

**Revision notes**
- Lost update = read-modify-write race; not prevented by RR.
- Prefer atomic UPDATE with condition; else FOR UPDATE; else optimistic version column.
- Always check `affectedRows`; map conflicts to 409.

### End of Day 4

**Key concepts to remember**
1. ACID mechanisms: undo (A), constraints (C), MVCC + locks (I), redo (D).
2. One transaction = one connection; short; commit/rollback/release in finally.
3. Dirty / non-repeatable / phantom reads and which level stops each; InnoDB default is REPEATABLE READ.
4. Plain SELECT = snapshot (no lock); FOR UPDATE/UPDATE = current read with locks.
5. Lost update needs atomic UPDATE, FOR UPDATE, or optimistic versioning.
6. RC reduces gap locks and deadlocks at the cost of non-repeatable reads and phantoms.

**Five revision questions**
1. Explain each letter of ACID and name the InnoDB component responsible.
2. In your own words, why does a plain SELECT inside a REPEATABLE READ transaction not see another session's
   committed insert, while `SELECT ... FOR UPDATE` does?
3. Two requests withdraw from the same balance at the same time. Describe the bug and three fixes with trade-offs.
4. Which statements cause an implicit commit, and which errors roll back the entire transaction?
5. When would you choose READ COMMITTED over REPEATABLE READ?

**One practical coding task**
Implement `POST /transfers` logic in Node as `transferFunds({ fromId, toId, amount, idempotencyKey })`: one
connection, one transaction, atomic conditional debit, credit, and an `INSERT` into a new `transfers` table
(`id`, `idempotency_key UNIQUE`, `from_id`, `to_id`, `amount`, `created_at`). If the INSERT fails with
`ER_DUP_ENTRY` roll back and return the previously stored result instead of transferring twice. Write the CREATE
TABLE statement too. (Compare with `EX-TXN-xx` in the exercise file afterwards.)

**Self-assessment checklist**
- [ ] I reproduced Demo 1 to Demo 4 in two real terminals.
- [ ] I can draw the step table for a non-repeatable read and a lost update from memory.
- [ ] I can explain MVCC, read view, undo log and why readers do not block writers.
- [ ] I can state the InnoDB default isolation level and the phenomenon table for all four levels.
- [ ] I know three ways to prevent lost updates and when to choose each.
- [ ] I can explain why `pool.execute` is wrong for multi-statement transactions.

---

## Day 5 - Deadlocks, locking, connection pooling (Day 26)

**Estimated time (2 hours):** 40 min locking (T5.1) with two terminals, 30 min deadlocks (T5.2), 35 min connection
pooling + Node code (T5.3), 15 min revision questions + coding task.

**Learning objectives**
- List InnoDB lock types (shared/exclusive, intention, record, gap, next-key, insert intention) and explain which
  statement takes which lock.
- Explain why a missing index turns a row-lock into a near table-lock.
- Reproduce a deadlock, read the error and the `LATEST DETECTED DEADLOCK` section, and apply the standard fixes
  (consistent lock order, short transactions, retries).
- Use `NOWAIT` and `SKIP LOCKED` for queue-style workloads.
- Configure a `mysql2` connection pool correctly, size it, avoid connection leaks, and write a reusable
  `withTransaction` helper with deadlock retry.

### T5.1 Locking in InnoDB [ESSENTIAL basics, ADVANCED details]

**Concept.** Lock = ek transaction ka claim ki "is row (ya range) ko main use kar raha hoon, doosre ruko".
InnoDB mostly **row-level locking** karta hai, jisse alag-alag rows par kaam karne wale transactions parallel
chalte hain.

**Why it matters.** "My API hangs / times out under load", "Lock wait timeout exceeded", "deadlock found" are
production incidents every backend dev meets. Knowing what locks a statement takes is how you debug them.

**Internal working.**

Lock modes:
- **S (shared):** many readers allowed, no writers. Taken by `SELECT ... FOR SHARE` (old name `LOCK IN SHARE MODE`).
- **X (exclusive):** one holder only. Taken by `UPDATE`, `DELETE`, `SELECT ... FOR UPDATE` and by `INSERT` on the new
  record.
- **Intention locks (IS / IX):** table-level markers saying "I intend to take S/X row locks inside". They let
  InnoDB check cheaply whether a table-level lock request conflicts. They conflict only with full table locks, not
  with each other.

Lock granularity (index-record based; InnoDB locks **index records**, not "rows" abstractly):

| Lock | Locks | Purpose |
|------|-------|---------|
| Record lock | one index record | protect that row |
| Gap lock | the gap between two index records (not the records) | stop other transactions inserting into the gap (REPEATABLE READ) |
| Next-key lock | record + gap before it | default for range scans in RR; prevents phantoms |
| Insert intention lock | a special gap lock set by INSERT | multiple inserts in the same gap at different positions do not block each other, but they wait for gap locks |
| Auto-inc lock | table-level, brief | `AUTO_INCREMENT` id allocation (mode controlled by `innodb_autoinc_lock_mode`) |
| Metadata lock (MDL) | the table definition | DDL waits for open transactions on the table; and **a long idle transaction blocks `ALTER TABLE`, which then blocks every new query on that table** |

Key facts:
1. Under `REPEATABLE READ`, a locking read or write that scans a **range** takes next-key locks on all the index
   records it scans. Under `READ COMMITTED`, gap locks are mostly disabled (they remain for FK and duplicate-key
   checks) and locks on rows that do not match the WHERE are released early.
2. Locks are held **until the transaction ends** (commit or rollback), not until the statement ends. That is why
   long transactions hurt.
3. **Index dependency:** if the WHERE clause cannot use an index, InnoDB scans the clustered index and (in RR)
   locks **every row it scans**, effectively blocking all writes to the table. An index narrows the locked range.
4. Locks conflict according to this matrix: S+S ok, S+X blocked, X+X blocked.

**Demo 5 - row lock wait and timeout.** Open Session A and Session B.

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | `SET SESSION innodb_lock_wait_timeout = 5;` | shortens the 50 s default for the demo |
| 2 | `UPDATE tasks SET priority = 1 WHERE id = 3;` | | A holds an X lock on row 3 until it ends |
| 3 | | `START TRANSACTION;` `UPDATE tasks SET priority = 2 WHERE id = 3;` | **B waits** |
| 4 | | (after 5 s) `ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction` | statement rolled back; B's transaction is still open |
| 5 | `ROLLBACK;` | `ROLLBACK;` | |

While B is waiting, a third terminal can show who blocks whom (MySQL 8):

```sql
SELECT trx_id, trx_state, trx_started, trx_mysql_thread_id, trx_query
FROM information_schema.innodb_trx;

SELECT object_name, index_name, lock_type, lock_mode, lock_status, lock_data
FROM performance_schema.data_locks;
-- illustrative: tasks | PRIMARY | RECORD | X,REC_NOT_GAP | GRANTED | 3     (held by A)
--               tasks | PRIMARY | RECORD | X,REC_NOT_GAP | WAITING | 3     (requested by B)

SELECT * FROM sys.innodb_lock_waits\G     -- waiting query, blocking query, blocking_pid
-- KILL <blocking_pid>;  ends the blocker's session if it is stuck (use with care)
```

**Demo 6 - missing index = wide lock (REPEATABLE READ).** `tasks.title` has no index.

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | | |
| 2 | `UPDATE tasks SET priority = 5 WHERE title = 'Write copy';` | | A changes 1 row, but scans all 14 rows through the clustered index and locks them (RR) |
| 3 | | `SET SESSION innodb_lock_wait_timeout = 5; UPDATE tasks SET priority = 2 WHERE id = 10;` | **B blocks**, although it touches a completely different row |
| 4 | `ROLLBACK;` | | B proceeds on retry |

Add an index (`CREATE INDEX idx_tasks_title ON tasks (title);`) and repeat: B no longer blocks because A locks only
the matching index record (and neighbor gap). Drop the index afterwards. Switching A to `READ COMMITTED`
(`SET TRANSACTION ISOLATION LEVEL READ COMMITTED;` before `START TRANSACTION`) also lets B proceed, because rows that
do not match are unlocked early.

**Demo 7 - `SKIP LOCKED` and `NOWAIT` (MySQL 8.0.1+): safe job queue.**

| Step | Session A (worker 1) | Session B (worker 2) | What you see |
|------|----------------------|----------------------|--------------|
| 1 | `START TRANSACTION;` | `START TRANSACTION;` | |
| 2 | `SELECT id FROM tasks WHERE status = 'todo' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;` | | returns **3** (locked by A) |
| 3 | | `SELECT id FROM tasks WHERE status = 'todo' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;` | returns **4**: skips the locked row instead of waiting |
| 4 | | `SELECT id FROM tasks WHERE id = 3 FOR UPDATE NOWAIT;` | fails immediately: `ERROR 3572 (HY000): Statement aborted because lock(s) could not be acquired immediately and NOWAIT is set.` |
| 5 | `ROLLBACK;` | `ROLLBACK;` | |

Each worker claims a different job with no blocking: this is how you build a simple DB-backed work queue
(Week 6/7 compare it with Redis queues).

**Table locks** (`LOCK TABLES`, `FLUSH TABLES WITH READ LOCK`) exist but are for backups/maintenance; do not use
them in app code. User-level named locks `GET_LOCK('name', timeout)` give cross-process mutexes (e.g. "only one
instance runs the nightly job"). [ADVANCED]

**Frontend connection.** Think of a locked row as a `mutex` / a `loading` flag in JS: while one async handler
holds it, another handler `await`s. The danger is the same as in JS code: if the holder never finishes (long
transaction, forgotten commit), everyone behind it starves.

**Real-world scenario.** A nightly job runs `UPDATE orders SET status='archived' WHERE created_at < ?` on an
un-indexed 20-million-row table. It runs in one transaction, locks millions of rows for minutes, and checkout
starts timing out with error 1205. Fix: index `created_at`, delete/update in small batches (`LIMIT 1000` in a loop,
commit each batch), and run off-peak.

**Interview answer:** "InnoDB uses row-level locking on index records: shared locks for reads that need
stability, exclusive locks for writes, and intention locks at table level. Under REPEATABLE READ it also uses gap and
next-key locks on ranges to prevent phantoms. Locks are held until the transaction ends, so I keep
transactions short. If a query cannot use an index, it can lock far more rows than intended, so I make sure
UPDATE and DELETE predicates are indexed. To investigate blocking I look at `performance_schema.data_locks`,
`sys.innodb_lock_waits` and `information_schema.innodb_trx`. For queue-like workloads I use `FOR UPDATE SKIP
LOCKED`."

**Follow-up questions**
- Q: What is a gap lock and why does it exist? A: A lock on the space between index records; prevents phantom
  inserts under REPEATABLE READ. Gap locks do not conflict with each other.
- Q: Does a plain SELECT take locks? A: No (consistent read via MVCC), except under SERIALIZABLE where it
  becomes `FOR SHARE`.
- Q: Why did my `ALTER TABLE` hang and then everything stalled? A: It waits for the metadata lock behind an
  old open transaction; new queries queue behind the waiting ALTER. Find and end the old transaction
  (`information_schema.innodb_trx`), or use online DDL during low traffic.
- Q: What is `innodb_lock_wait_timeout`? A: How long a statement waits for a row lock (default 50 s) before
  error 1205. Keep it low enough to fail fast in an API.
- Q: How do you avoid lock contention on a hot row such as a global counter? A: Shard the counter into several
  rows (sum on read), batch updates, or move the counter to Redis (Week 6).
- Q: Why can `SELECT ... FOR UPDATE` on a non-existing id still block inserts? A: Under RR it takes a gap lock
  where that id would be.

**Common mistakes**
- Forgetting that locks last until commit; opening a transaction and then calling an external API.
- Un-indexed predicates in UPDATE/DELETE/FOR UPDATE.
- Giant single-transaction batch updates.
- Using `LOCK TABLES` from application code.
- Not setting a sensible lock wait timeout in latency-sensitive services.

**Revision notes**
- S/X + intention; record, gap, next-key, insert intention. InnoDB locks index records.
- Locks released at COMMIT/ROLLBACK. No index => many locks.
- Diagnose: `data_locks`, `data_lock_waits`, `sys.innodb_lock_waits`, `innodb_trx`.
- `SKIP LOCKED` for queues, `NOWAIT` for fail-fast.

### T5.2 Deadlocks [ESSENTIAL]

**Concept.** Deadlock = do (ya zyada) transactions ek doosre ke locks ka intezaar kar rahe hain, **circular wait**,
aur koi aage nahi badh sakta. Jaise do log ek narrow gali mein aamne-saamne: dono wait kar rahe hain.

**Why it matters.** Any write-heavy system (payments, inventory) hits deadlocks. The interview checks: can you
explain the cause, read the error, fix it by design, and handle it in code (retry)?

**Internal working.** InnoDB runs a **deadlock detector** (`innodb_deadlock_detect = ON` by default): it builds a
wait-for graph; when it finds a cycle it picks a **victim** (usually the transaction that has modified the fewest
rows, i.e. is cheapest to undo) and rolls back the **entire victim transaction**, returning
`ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction`. The other transaction
continues. Deadlocks are therefore not "bugs that hang forever" but an **expected, retryable** event. (On extreme
write contention some teams turn the detector off and rely on `innodb_lock_wait_timeout`: advanced.)

**Demo 8 - classic deadlock: opposite lock order.** Reset helper first.

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | `START TRANSACTION;` | |
| 2 | `UPDATE accounts SET balance = balance - 10 WHERE id = 1;` | | A holds X lock on account 1 |
| 3 | | `UPDATE accounts SET balance = balance - 10 WHERE id = 2;` | B holds X lock on account 2 |
| 4 | `UPDATE accounts SET balance = balance + 10 WHERE id = 2;` | | **A waits** for B |
| 5 | | `UPDATE accounts SET balance = balance + 10 WHERE id = 1;` | cycle: A waits B, B waits A. InnoDB picks one victim (usually the session whose statement closed the cycle, here B, but it can vary): `ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction` |
| 6 | (A's UPDATE now completes) `COMMIT;` | (B was rolled back entirely) | |

This is exactly what happens when two concurrent transfers go opposite ways: A->B and B->A, each doing "debit
first, credit second" without a consistent order.

**Reading the evidence.**

```sql
SHOW ENGINE INNODB STATUS\G     -- look for the LATEST DETECTED DEADLOCK section
-- To record every deadlock in the MySQL error log (good in production):
SET GLOBAL innodb_print_all_deadlocks = ON;
```

Abbreviated, illustrative shape of the section:

```
LATEST DETECTED DEADLOCK
*** (1) TRANSACTION:
TRANSACTION 4711, ACTIVE 12 sec starting index read
UPDATE accounts SET balance = balance + 10 WHERE id = 2
*** (1) HOLDS THE LOCK(S):
RECORD LOCKS ... index PRIMARY of table `taskdb`.`accounts` trx id 4711 lock_mode X locks rec but not gap
      (this is account id = 1)
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS ... index PRIMARY of table `taskdb`.`accounts` trx id 4711 lock_mode X locks rec but not gap waiting
      (account id = 2)
*** (2) TRANSACTION:
TRANSACTION 4712, ACTIVE 8 sec starting index read
UPDATE accounts SET balance = balance + 10 WHERE id = 1
*** (2) HOLDS THE LOCK(S): ... account id = 2
*** (2) WAITING FOR THIS LOCK TO BE GRANTED: ... account id = 1
*** WE ROLL BACK TRANSACTION (2)
```

How to read it: for each transaction find (a) the statement, (b) the lock it **holds**, (c) the lock it **waits for**,
then draw the cycle. The `index` and `lock_mode` fields (`X`, `S`, `locks gap before rec`, `insert intention`)
tell you whether it was a row, gap or insert-intention conflict.

**Demo 9 - lock upgrade deadlock (S then X on the same row).**

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | `START TRANSACTION;` | |
| 2 | `SELECT * FROM accounts WHERE id = 1 FOR SHARE;` | `SELECT * FROM accounts WHERE id = 1 FOR SHARE;` | both get S locks (compatible) |
| 3 | `UPDATE accounts SET balance = balance + 1 WHERE id = 1;` | | A needs X: waits for B's S lock |
| 4 | | `UPDATE accounts SET balance = balance + 1 WHERE id = 1;` | B also needs X: deadlock, one gets 1213 |

Fix: take the exclusive lock right away (`FOR UPDATE`) or just use the single atomic `UPDATE`.

**Demo 10 - gap lock + insert deadlock [ADVANCED].** Both sessions "check then insert" a row that does not exist.

| Step | Session A | Session B | What you see |
|------|-----------|-----------|--------------|
| 1 | `START TRANSACTION;` | `START TRANSACTION;` | |
| 2 | `SELECT * FROM tasks WHERE id = 100 FOR UPDATE;` | `SELECT * FROM tasks WHERE id = 100 FOR UPDATE;` | no row, but both get a (compatible) **gap lock** above the last id |
| 3 | `INSERT INTO tasks (id, project_id, title) VALUES (100, 1, 'x');` | | A's insert needs an insert-intention lock: **waits** for B's gap lock |
| 4 | | `INSERT INTO tasks (id, project_id, title) VALUES (100, 1, 'y');` | deadlock; one session gets 1213 |

Fix: do not "SELECT FOR UPDATE then INSERT" for uniqueness. Just `INSERT` and handle error 1062 (unique key), or use
`INSERT ... ON DUPLICATE KEY UPDATE`, or run at READ COMMITTED.

**How to prevent deadlocks (say these in the interview).**
1. **Consistent lock order:** always touch rows/tables in the same order (e.g. lower account id first). This
   removes the cycle entirely.
2. **Short transactions:** do external calls, validation and computation outside the transaction.
3. **Indexed predicates:** fewer rows locked means fewer collisions.
4. **Single atomic statements** where possible (`UPDATE ... SET x = x + ?`).
5. **Lower isolation** (READ COMMITTED) if gap locks are the cause.
6. **Retry on 1213** with a bounded count and jittered backoff. You cannot eliminate deadlocks 100%, so the app
   must be able to retry the **whole** transaction safely (idempotent logic).
7. Process batches in primary-key order (sort ids before updating many rows).

**Code example: consistent ordering + retry (ES module).** The helper `withTransaction` is defined in T5.3 below.

```js
// src/transfer.safe.js
import { withTransaction } from './db.js';

export async function transferSafe(fromId, toId, amount) {
  if (fromId === toId) throw new Error('SAME_ACCOUNT');
  return withTransaction(async (conn) => {
    // 1) lock BOTH rows in ascending id order, whatever the transfer direction
    const [lo, hi] = fromId < toId ? [fromId, toId] : [toId, fromId];
    const [locked] = await conn.execute(
      'SELECT id FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
      [lo, hi]
    );
    if (locked.length !== 2) throw new Error('ACCOUNT_NOT_FOUND');

    // 2) now do the money movement; conditional debit protects the invariant
    const [debit] = await conn.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amount, fromId, amount]
    );
    if (debit.affectedRows !== 1) throw new Error('INSUFFICIENT_FUNDS');
    await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toId]);
  });
}

// run two opposite transfers concurrently: no deadlock because both lock id 1 then id 2
// await Promise.all([transferSafe(1, 2, '10.00'), transferSafe(2, 1, '10.00')]);
```

**Frontend connection.** Like two components each waiting for the other's promise to resolve before resolving
their own (`await a(); ` inside b and `await b();` inside a): a circular `await` that never finishes. The fix in JS
or SQL is the same: impose an order or break the cycle. The retry loop is like a fetch retry wrapper.

**Real-world scenario.** Payments: concurrent peer-to-peer transfers between the same two wallets in opposite
directions. Without ordering, a deadlock appears under load every few minutes; with ordering + retry they vanish
from the error rate dashboard.

**Interview answer:** "A deadlock is a circular wait: transaction A holds a lock B needs while B holds a lock A
needs. InnoDB detects the cycle, rolls back one transaction (the victim) with error 1213 and lets the other
continue. I reduce deadlocks by acquiring locks in a consistent order, keeping transactions short and using
indexed predicates, and because they cannot be eliminated entirely I retry the whole transaction a few times with
jittered backoff. To diagnose I use SHOW ENGINE INNODB STATUS and `innodb_print_all_deadlocks`."

**Follow-up questions**
- Q: Does InnoDB roll back the whole transaction on deadlock? A: Yes (unlike lock wait timeout, which rolls back
  just the statement by default).
- Q: How is the victim chosen? A: The transaction with the least weight (fewest rows changed/locked).
- Q: Deadlock vs lock wait timeout? A: Deadlock = cycle, detected immediately, error 1213. Timeout = no cycle,
  just a long wait, error 1205 after `innodb_lock_wait_timeout`.
- Q: Is a deadlock always an application bug? A: Not always; it is a normal concurrency event. But frequent ones
  point to missing indexes, long transactions or inconsistent ordering.
- Q: Can a single-row UPDATE deadlock? A: Yes, through secondary index + clustered index lock ordering with
  concurrent statements, or via foreign key checks; rare, but retry logic handles it. [ADVANCED]
- Q: Why not just increase the timeout? A: A timeout does not fix a cycle; deadlocks are already detected quickly.

**Common mistakes**
- Not retrying 1213 (user sees a 500 for a retryable event).
- Retrying only the last statement instead of the whole transaction.
- Unlimited retries with no backoff (retry storm).
- Retry logic around non-idempotent side effects (sending an email inside the transaction body).
- Assuming a deadlock means the database is broken.

**Revision notes**
- Circular wait; detector rolls back the victim; error 1213 (SQLSTATE 40001).
- Fix by ordering, short transactions, indexes; handle by retrying the whole transaction.
- Evidence: `SHOW ENGINE INNODB STATUS`, `innodb_print_all_deadlocks`.

### T5.3 Connection pooling [ESSENTIAL]

**Concept.** Har query ke liye naya DB connection kholna mehenga hai (TCP handshake + TLS + auth, tens of
milliseconds; MySQL server side par ek thread + memory). **Connection pool** pehle se kuch connections khol ke
rakhta hai aur requests unhe **udhaar** leti hain: `acquire -> use -> release`. Release ke baad connection band
nahi hota, wapas pool mein jata hai.

**Why it matters.** Without a pool, a spike of 500 requests would open 500 connections and hit
`Too many connections` (error 1040). With a pool of 10, the 11th request waits in the pool queue. A pool also
protects the database from your own traffic. Pool misconfiguration (leaks, wrong size) is a top cause of
"app freezes, DB looks idle" incidents.

**Internal working.**
- `mysql2` creates connections lazily up to `connectionLimit`. A request calls `pool.query()/execute()`, which
  borrows an idle connection (or opens a new one if under the limit, or **queues** if at the limit), runs the
  statement and returns the connection automatically.
- `pool.getConnection()` hands you the connection **and the responsibility** to call `conn.release()`. A forgotten
  release is a **connection leak**: the pool slowly loses capacity until all `connectionLimit` connections are
  "borrowed" and every request waits forever (with `queueLimit: 0` = unlimited queue).
- Session state (`SET ...`, temp tables, user variables, an open transaction) lives on the **connection**; it
  persists across borrowers unless reset. That is why transactions need `getConnection()` and why you must not
  leave session-level settings behind.
- Idle connections can be closed by the server (`wait_timeout`, default 8 hours) or by a firewall/load balancer
  (often minutes). The pool must detect/recycle them: `maxIdle`, `idleTimeout`, `enableKeepAlive`.

**Sizing (this is the question).**
- Total connections = (number of Node processes) x (pool `connectionLimit`). Example: 3 servers x 4 pm2/cluster
  workers x 10 = **120**, which already nearly fills MySQL's default `max_connections = 151`. Add migrations,
  admin sessions and read replicas' needs, and you are over. Rule: sum of pools <= ~80% of `max_connections`.
- Bigger is **not** faster. A MySQL server can only run about as many queries truly in parallel as it has CPU
  cores / IO capacity; extra connections just add context switching and lock contention. A common starting
  point is 10 per process, then tune with measurements.
- Little's law estimate: connections in use = throughput x average query time. 500 req/s x 10 ms = about 5
  connections busy on average; size a bit above that for bursts (and longer transactions need more).
- Long transactions hold a connection for their whole duration: another reason to keep them short.

**Code example: pool setup (ES module).**

```js
// src/db.js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,          // from env / secret manager, never hard-coded
  database: process.env.DB_NAME ?? 'taskdb',
  waitForConnections: true,                   // queue instead of throwing when the pool is busy
  connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
  maxIdle: Number(process.env.DB_POOL_SIZE ?? 10),   // keep up to this many idle connections
  idleTimeout: 60_000,                        // close connections idle for 60 s
  queueLimit: 100,                            // fail fast instead of an unbounded waiting line
  connectTimeout: 10_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: 'Z',                              // treat DATETIME values as UTC (pick one convention)
});

const LEVELS = new Set(['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withTransaction(work, { retries = 3, isolation } = {}) {
  if (isolation && !LEVELS.has(isolation)) throw new Error('invalid isolation level');
  for (let attempt = 0; ; attempt++) {
    const conn = await pool.getConnection();
    try {
      if (isolation) await conn.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`); // allow-listed
      await conn.beginTransaction();
      const result = await work(conn);
      await conn.commit();
      return result;
    } catch (err) {
      try { await conn.rollback(); } catch { /* connection may already be dead */ }
      if (err.errno === 1213 && attempt < retries) {           // deadlock victim: retry the WHOLE transaction
        await sleep(20 * 2 ** attempt + Math.random() * 20);    // exponential backoff + jitter
        continue;                                               // 'finally' still releases this connection
      }
      throw err;
    } finally {
      conn.release();
    }
  }
}

export async function closePool() {
  await pool.end();          // call on SIGTERM after the HTTP server stops accepting requests
}
```

Notes on the options: `queueLimit: 100` makes `getConnection`/`query` reject once 100 requests are already
waiting, which converts a meltdown into fast 503s. `idleTimeout` and `maxIdle` need a recent `mysql2` (3.x). On
older versions only `connectionLimit`, `queueLimit`, `waitForConnections` exist, so check your installed
version.

**Leak example and fix.**

```js
// BAD: early return and thrown errors skip release() -> leak
async function badHandler(id) {
  const conn = await pool.getConnection();
  const [rows] = await conn.execute('SELECT * FROM tasks WHERE id = ?', [id]);
  if (rows.length === 0) return null;          // connection never released
  conn.release();
  return rows[0];
}

// GOOD: finally guarantees release; or avoid getConnection entirely for single statements
async function goodHandler(id) {
  const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);   // pool releases for you
  return rows[0] ?? null;
}
```

**`query` vs `execute`.** `pool.execute` uses a **prepared statement** (binary protocol; the statement is cached
per connection and parameters are typed); `pool.query` escapes values client-side and sends text SQL. Both are
injection-safe when you pass values separately. Use `query` when you need list expansion (`WHERE id IN (?)` with
an array) or the `LIMIT ?` quirks; use `execute` for the common fixed-shape statements. `execute` rejects
`undefined` parameters (use `null`).

**Pool health and observability.**

```sql
SHOW STATUS LIKE 'Threads_connected';        -- current connections
SHOW STATUS LIKE 'Max_used_connections';     -- high-water mark since start
SHOW VARIABLES LIKE 'max_connections';       -- default 151
SHOW FULL PROCESSLIST;                       -- who is connected, what are they running, for how long
SELECT * FROM sys.session WHERE conn_id <> CONNECTION_ID();
```

```js
// optional pool event hooks for debugging (mysql2 pool is an EventEmitter)
pool.on('enqueue', () => console.warn('DB pool exhausted: request queued'));
```

Symptoms of a leak: requests hang, `Threads_connected` equals `connectionLimit` times processes, processlist shows
connections in `Sleep` state for a long time (borrowed, idle, never released), CPU on the DB is near zero. Symptoms
of too many connections: error 1040 `Too many connections`, latency growing with concurrency.

**ProxySQL / RDS Proxy [ADVANCED].** When hundreds of app instances (serverless, many pods) would exceed
`max_connections`, a connection-multiplexing proxy sits between app and DB. Mention it, but the primary answer is
"limit the pool per instance and scale reads with replicas".

**Frontend connection.** A pool is like the browser's limit of ~6 concurrent HTTP/1.1 connections per origin:
extra `fetch` calls queue until a slot frees up. And just like a leaked listener, a leaked connection is a resource
you must release in a `finally`.

**Real-world scenario.** Black Friday: traffic triples, each of 20 pods keeps a pool of 20 (400 connections) and
MySQL `max_connections` is 300. Half the pods get `Too many connections`. The correct fix is lowering the pool
per pod (and fixing slow queries that hold connections) rather than raising `max_connections` blindly (more
connections = more memory and thread contention on the DB).

**Interview answer:** "A connection pool keeps a fixed set of open database connections that requests borrow
and release, avoiding the cost of connecting per query and capping load on MySQL. With mysql2 I create one pool per
process, use `pool.execute` for single statements and `getConnection` only for transactions, always releasing in
a finally block. I size it by the number of processes times the pool limit staying under max_connections, and by
Little's law rather than by guessing big numbers. I set a bounded queue and timeouts so overload fails fast, and
I shut the pool down gracefully with `pool.end()`."

**Follow-up questions**
- Q: Why can't I run a transaction using `pool.query` for each statement? A: Each call may use a different
  connection, and a transaction is bound to one connection.
- Q: What happens when all connections are busy? A: With `waitForConnections: true` requests queue (up to
  `queueLimit`), otherwise an error is thrown.
- Q: Should I create a pool per request? A: Never. One pool per process, created at startup.
- Q: Does a bigger pool improve throughput? A: Only until the DB is saturated; beyond that it hurts.
- Q: How do pools interact with cluster/pm2? A: Each worker process has its own pool: multiply.
- Q: What is `max_connections` and what happens when it is reached? A: Server-side limit (default 151);
  new connections fail with error 1040 (a reserved extra slot for an admin user exists).
- Q: How do you handle "connection lost" errors? A: Let the pool discard the broken connection and retry the idempotent
  query once; keepAlive + idleTimeout shorter than the infrastructure's idle cut-off reduce them.

**Common mistakes**
- Not releasing connections (leak), especially on error paths and early returns.
- Creating a new pool inside a request handler.
- Pool size copied from a blog (e.g. 100) per pod without computing the total.
- Using `getConnection` for simple queries.
- Leaving `SET SESSION` state on pooled connections.
- Unbounded queue: a slow DB makes memory and latency grow until the process dies.
- Forgetting to `pool.end()` in tests/shutdown (process hangs open).

**Revision notes**
- Pool = reusable connections; per process; total = processes x limit < `max_connections`.
- Transactions: getConnection, begin, commit/rollback, release in finally.
- Pitfalls: leaks, oversize, unbounded queue, session state. Observe with Threads_connected + processlist.

### End of Day 5

**Key concepts to remember**
1. InnoDB locks index records: S/X, intention, record/gap/next-key; locks live until commit/rollback.
2. No index on the predicate = many rows locked; keep UPDATE/DELETE predicates indexed.
3. Deadlock = circular wait; error 1213; whole transaction rolled back; retry with backoff.
4. Prevent deadlocks: consistent order, short transactions, atomic statements, indexes.
5. `SKIP LOCKED` / `NOWAIT` for queues and fail-fast.
6. Pool: one per process, release in finally, size by math, bounded queue, graceful `pool.end()`.

**Five revision questions**
1. A request hangs, then fails with "Lock wait timeout exceeded". List three ways to find the blocker and three ways
   to prevent it.
2. Draw the wait-for cycle for two opposite money transfers and show the one-line change that prevents it.
3. What is the difference between error 1213 and 1205 (cause, rollback scope, retry strategy)?
4. How many MySQL connections can 6 pm2 workers with `connectionLimit: 20` open, and what breaks if
   `max_connections = 100`?
5. Why must transactions use `pool.getConnection()` and why must you call `release()` in `finally`?

**One practical coding task**
Write a small script `deadlock-demo.js` that opens two connections from the pool and deliberately creates the
opposite-order deadlock of Demo 8 using `Promise.all` and `await`s with a short sleep to line up the steps. Print
which one gets `err.errno === 1213`. Then rewrite it using `transferSafe` and show that 100 concurrent opposite
transfers finish with zero errors and a correct final total balance (sum of the three balances is unchanged).

**Self-assessment checklist**
- [ ] I reproduced the lock timeout, the missing-index lock, SKIP LOCKED and the deadlock in two terminals.
- [ ] I can explain a `LATEST DETECTED DEADLOCK` block line by line.
- [ ] I can list five deadlock prevention techniques.
- [ ] I can size a pool for a multi-instance deployment and justify the number.
- [ ] I can write `withTransaction` with deadlock retry from memory.
- [ ] I can diagnose a connection leak from symptoms.

---

## Day 6 - EXPLAIN, query optimization, pagination and database performance (Day 27)

**Estimated time (2 hours):** 40 min EXPLAIN reading (T6.1), 30 min optimization patterns (T6.2), 40 min
pagination offset vs keyset + Node code (T6.3), 10 min revision questions + coding task.

**Learning objectives**
- Read every important column of `EXPLAIN` (`type`, `key`, `key_len`, `rows`, `filtered`, `Extra`) and say whether a
  plan is good or bad.
- Use `EXPLAIN FORMAT=TREE` and `EXPLAIN ANALYZE` (8.0.18+) to compare estimates with reality.
- Fix the common slow-query causes: non-sargable predicates, `SELECT *`, N+1 queries, missing composite indexes,
  big offsets, expensive `COUNT(*)`.
- Implement keyset (cursor) pagination with a unique tie-breaker and explain why offset pagination degrades.
- Describe a methodical way to debug a slow query in production (slow log, digest table, EXPLAIN, change one
  thing, re-measure).

Prerequisite state: `tasks_big` exists with 200,000 rows and only its PRIMARY KEY (Day 3). Create the working
indexes for today's experiments:

```sql
CREATE INDEX idx_proj_status_created ON tasks_big (project_id, status, created_at);
CREATE INDEX idx_created_id          ON tasks_big (created_at, id);
ANALYZE TABLE tasks_big;
```

### T6.1 EXPLAIN and execution plans [ESSENTIAL]

**Concept.** `EXPLAIN` bata deta hai ki MySQL tumhari query ko **kaise** chalayega: kaunsi table pehle, kaunsa
index, kitni rows padhegi. Ye "mera query slow kyun hai?" ka pehla aur sabse zaroori tool hai.

**Why it matters.** The standard interview question "an API endpoint is slow; how do you find out why?" ends in
"I run EXPLAIN and read the access type and rows". Without it, indexing is guesswork.

**Internal working.** The optimizer is **cost-based**: it estimates the cost of alternative plans (which index, join
order, join algorithm) using table statistics (row counts, index cardinality, optional histograms) and picks the
cheapest estimate. `EXPLAIN` shows the **chosen plan without running the query**. Because it is based on
estimates, a stale or skewed statistic can produce a wrong plan (`ANALYZE TABLE` refreshes them).
`EXPLAIN ANALYZE` actually **executes** the query and reports real timings and row counts next to the estimates, so
never run it on a destructive statement against production without thinking (for `SELECT` it is fine).

**The columns (tabular `EXPLAIN`).**

| Column | Meaning | What to look for |
|--------|---------|------------------|
| `id` | step number (subqueries/unions get new ids) | |
| `select_type` | SIMPLE, PRIMARY, SUBQUERY, DERIVED, UNION | `DEPENDENT SUBQUERY` = correlated, check it |
| `table` | table or alias in this step | join order = row order top to bottom |
| `type` | **access type** (see below) | the most important column |
| `possible_keys` | indexes that could be used | empty = no usable index |
| `key` | index actually chosen | `NULL` = none |
| `key_len` | bytes of the index actually used | shows how many composite columns were used |
| `ref` | what is compared to the index (`const`, a column) | |
| `rows` | **estimated** rows examined in this step | compare to rows returned |
| `filtered` | estimated % of those rows that pass the remaining WHERE | low value = lots of wasted reads |
| `Extra` | extra info (below) | `Using filesort`, `Using temporary` flags |

**`type` from best to worst (memorize this order):**

| type | Meaning | Example |
|------|---------|---------|
| `system` / `const` | at most one row via PK or UNIQUE constant | `WHERE id = 5` |
| `eq_ref` | one row per row of the previous table, via PK/UNIQUE join | `JOIN users u ON u.id = t.assignee_id` |
| `ref` | non-unique index equality; may return several rows | `WHERE project_id = 2` with index |
| `range` | index range scan | `BETWEEN`, `<`, `>`, `IN (...)`, `LIKE 'abc%'` |
| `index` | **full index scan** (reads the whole index, cheaper than table, still O(n)) | covering index but no useful WHERE |
| `ALL` | **full table scan** | no usable index |

Rule: for big tables, `ALL` and `index` on a selective query are red flags; `const/eq_ref/ref/range` are fine.

**`Extra` values that matter:**

| Extra | Meaning |
|-------|---------|
| `Using index` | **covering index**: answered from the index alone (good) |
| `Using index condition` | Index Condition Pushdown: more conditions checked inside the index before row fetch (good) |
| `Using where` | rows are filtered by a WHERE condition after being read; harmless by itself |
| `Using filesort` | an explicit sort step is needed (not necessarily on disk; the name is historical). Costly on large sets: consider an index matching ORDER BY |
| `Using temporary` | an internal temp table is built (GROUP BY / DISTINCT / UNION); costly on big sets |
| `Using join buffer (hash join)` | join without usable index, done by hash join (8.0.18+) or block nested loop: add an index |
| `Backward index scan` | the index is read in descending order (no sort needed) |
| `Select tables optimized away` | answered from metadata (e.g. `MIN/MAX` on an indexed column) |
| `Using MRR` / `Using index for skip scan` | advanced optimizations |

**`key_len` arithmetic** (to see how many columns of a composite index are used): `BIGINT` = 8, `INT` = 4, `DATE` =
3, `DATETIME` = 5 (without fractional seconds), `ENUM` (< 256 values) = 1, `TINYINT` = 1, `VARCHAR(n)` utf8mb4 =
4n + 2; add **1 byte if the column is NULLable**. `(project_id BIGINT NOT NULL, status ENUM NOT NULL, created_at
DATETIME NOT NULL)` gives 8, 9 and 14 for one, two and three columns used.

**Code example: read these plans.** (`rows` values and some cost numbers are illustrative; verify on your
machine.)

*A. Point lookup by primary key*

```sql
EXPLAIN SELECT id, title FROM tasks_big WHERE id = 150000;
```

```
| id | select_type | table     | type  | possible_keys | key     | key_len | ref   | rows | filtered | Extra |
|  1 | SIMPLE      | tasks_big | const | PRIMARY       | PRIMARY | 8       | const |    1 |   100.00 | NULL  |
```

Perfect: `const`, one row.

*B. The composite index from Day 3*

```sql
EXPLAIN SELECT id, title, created_at FROM tasks_big
WHERE project_id = 2 AND status = 'todo' ORDER BY created_at DESC LIMIT 20;
```

```
| type | possible_keys           | key                     | key_len | ref         | rows  | filtered | Extra                            |
| ref  | idx_proj_status_created | idx_proj_status_created | 9       | const,const | 42xxx |   100.00 | Using where; Backward index scan |
```

`key_len = 9`: two columns used for the seek, `created_at` used for ordering. No filesort.

*C. A non-sargable predicate (function on the column)*

```sql
EXPLAIN SELECT COUNT(*) FROM tasks_big WHERE DATE(created_at) = '2026-01-05';
```

```
| type  | possible_keys | key           | key_len | rows   | filtered | Extra                    |
| index | NULL          | idx_created_id| 13      | 199xxx |   100.00 | Using where; Using index |
```

`type = index`: the function forces reading **the entire index**. Rewrite as a half-open range:

```sql
EXPLAIN SELECT COUNT(*) FROM tasks_big
WHERE created_at >= '2026-01-05 00:00:00' AND created_at < '2026-01-06 00:00:00';
```

```
| type  | key            | key_len | rows  | Extra                    |
| range | idx_created_id | 5       | 5760  | Using where; Using index |
```

`range`, about 5,760 rows (1,440 minutes x 4 rows per minute), exactly the day's rows.

*D. A join (our small tables)*

```sql
EXPLAIN SELECT t.id, t.title, p.name, u.name
FROM tasks t
JOIN projects p ON p.id = t.project_id
LEFT JOIN users u ON u.id = t.assignee_id
WHERE t.status = 'todo';
```

```
| id | table | type   | possible_keys     | key                    | ref                  | rows | Extra                                      |
|  1 | p     | index  | PRIMARY           | uq_projects_owner_name | NULL                 |    3 | Using index                                |
|  1 | t     | ALL    | idx_tasks_project | NULL                   | NULL                 |   15 | Using where; Using join buffer (hash join) |
|  1 | u     | eq_ref | PRIMARY           | PRIMARY                | taskdb.t.assignee_id |    1 | NULL                                       |
```

(Output from MySQL 8.0.46 on the 14-row data; yours may differ slightly.) Read the rows top to bottom as the
**join order**. The optimizer did **not** start with `t`: with such tiny tables it scans the small `projects`
table first (covering scan of its smallest index), then hash-joins `tasks` (`ALL`, `Using join buffer (hash join)`),
then does an `eq_ref` PK lookup into `u`. Join order and algorithm on tiny tables are the optimizer's call, which is
why you must not tune on dev-sized data. On a 5-million-row `tasks` table you would add an index on `status` (or
`(status, project_id)`) to avoid the `ALL`.

*E. GROUP BY with and without a helpful index*

```sql
EXPLAIN SELECT project_id, status, COUNT(*) FROM tasks_big GROUP BY project_id, status;
```

With `idx_proj_status_created`: `type = index`, `Extra: Using index` (groups come out in index order, no temp
table). Without a matching index you would see `Using temporary`. (MySQL 8 no longer sorts `GROUP BY` results
implicitly; add `ORDER BY` if you need an order.)

*F. `EXPLAIN FORMAT=TREE` and `EXPLAIN ANALYZE` (8.0.18+): estimate versus reality*

```sql
EXPLAIN ANALYZE
SELECT id, title FROM tasks_big
WHERE project_id = 2 AND status = 'todo'
ORDER BY created_at DESC LIMIT 20;
```

Illustrative output shape:

```
-> Limit: 20 row(s)  (cost=4868 rows=20) (actual time=1.05..1.06 rows=20 loops=1)
    -> Filter: (tasks_big.`status` = 'todo')  (cost=4868 rows=42194) (actual time=1.05..1.06 rows=20 loops=1)
        -> Index lookup on tasks_big using idx_proj_status_created (project_id=2, status='todo') (reverse)
           (cost=4868 rows=42194) (actual time=1.04..1.05 rows=20 loops=1)
```

Read it from the inside out: the estimate says up to 42,194 rows (the real slice is 22,223), the **actual** read stopped after 20 because of
`LIMIT` and the backward scan. `actual time=a..b` is time to first row .. time for all rows (milliseconds),
`loops` how many times that step ran. A large gap between estimated `rows` and actual `rows` signals stale
statistics (run `ANALYZE TABLE`), skewed data (consider a histogram: `ANALYZE TABLE t UPDATE HISTOGRAM ON col`) or
a correlated-columns misestimate. [ADVANCED]

**Reading checklist (say this out loud in the interview):**
1. Look at `type`: `ALL`/`index` on a big table = trouble.
2. Compare `rows` with how many rows you actually need.
3. Is `key` what you expected? If `NULL` or a different index: check `possible_keys`, column order, function
   wrappers, types, selectivity.
4. Check `key_len` to confirm all intended composite columns are used.
5. Look at `Extra` for `Using filesort` / `Using temporary` / `Using join buffer`.
6. Confirm with `EXPLAIN ANALYZE` and real timings (production-like data volume!).

**Frontend connection.** `EXPLAIN` is the database's **React Profiler / Chrome DevTools Performance tab**: you do
not guess which component re-renders, you measure. And "rows examined vs rows returned" is like a render that
touches 10,000 DOM nodes to change 1.

**Real-world scenario.** The "orders by status for a seller" endpoint takes 4 s. `EXPLAIN` shows `type=ALL`,
`rows=4,800,000`, `Using filesort`. After adding `(seller_id, status, created_at)` the plan is `ref`, `rows=120`,
no filesort and the endpoint returns in 15 ms.

**Interview answer:** "I use EXPLAIN to see the chosen execution plan. I check the access type, preferring
const, eq_ref, ref and range over index and ALL, then the key and key_len to confirm the intended index and how
many composite columns it uses, the estimated rows, and Extra for Using filesort, Using temporary or Using
join buffer. In MySQL 8 I use EXPLAIN ANALYZE to compare estimated and actual rows and timings. Statistics can be
stale, so I run ANALYZE TABLE if estimates look wrong."

**Follow-up questions**
- Q: Does `EXPLAIN` run the query? A: No, it only plans (estimates). `EXPLAIN ANALYZE` executes it.
- Q: Is `Using filesort` always bad? A: No. It is fine on small result sets; bad when sorting large sets without
  `LIMIT` support from an index.
- Q: Why would MySQL ignore an index? A: Low selectivity (scan is cheaper), function/implicit conversion on the
  column, leading wildcard, stale statistics, the optimizer prefers another index, or the table is tiny.
- Q: `type = index` vs `ALL`? A: `index` scans the whole index (smaller than the table), `ALL` scans the whole table.
  Both are O(n).
- Q: How do you force or forbid an index? A: `USE INDEX`, `FORCE INDEX`, `IGNORE INDEX` hints, or optimizer
  hints (`/*+ INDEX(t idx) */`). Prefer fixing the root cause (stats, index design) first. [ADVANCED]
- Q: `rows` shows 1 but the query is slow? A: The estimate can be wrong (check `EXPLAIN ANALYZE`) or the time may be
  spent in locks, network, or huge result transfer, not the plan.

**Common mistakes**
- Optimizing on tiny dev data (the optimizer rightly chooses `ALL` for a 14-row table; test with realistic volume).
- Reading only `key` and ignoring `rows` and `Extra`.
- Trusting `EXPLAIN` estimates without `EXPLAIN ANALYZE` / real timings.
- Adding an index and never re-running `EXPLAIN` to confirm it is used.
- Running `EXPLAIN ANALYZE` on a heavy query in peak production hours.

**Revision notes**
- type order: system/const > eq_ref > ref > range > index > ALL.
- key, key_len, rows, filtered, Extra (`Using index`, `filesort`, `temporary`).
- `EXPLAIN ANALYZE` runs the query and shows actual rows/time. `ANALYZE TABLE` refreshes stats.

### T6.2 Query optimization patterns [ESSENTIAL]

**Concept.** Zyada slow queries kuch gine-chune patterns ki wajah se hote hain. Pehle pattern pehchano, phir fix
karo, phir measure karo.

**Why it matters.** "How do you optimize a slow query?" is asked in nearly every backend interview. A
structured answer (find, explain, change one thing, re-measure) beats random tips.

**Internal working: methodical process.**
1. **Find** the slow queries: slow query log (`slow_query_log=ON`, `long_query_time=0.5`), APM, or the
   statement digest table.
2. **Reproduce** with production-like data and the real parameter values.
3. **EXPLAIN / EXPLAIN ANALYZE**: compare rows examined to rows returned.
4. **Change one thing** (index, rewrite, limit columns), **re-measure**.
5. Watch for write regressions after adding indexes. Keep the change in a migration.

```sql
-- Which statements consume the most total time? (MySQL 8, performance_schema is on by default)
SELECT LEFT(digest_text, 100)                 AS query_shape,
       count_star                             AS calls,
       ROUND(avg_timer_wait / 1000000000, 2)  AS avg_ms,
       sum_rows_examined, sum_rows_sent
FROM performance_schema.events_statements_summary_by_digest
ORDER BY sum_timer_wait DESC
LIMIT 10;

SELECT * FROM sys.statements_with_full_table_scans LIMIT 10;
SELECT * FROM sys.schema_unused_indexes;         -- candidates to drop (verify over a long period)
SELECT * FROM sys.schema_redundant_indexes;
```

A high `sum_rows_examined / sum_rows_sent` ratio means the query reads far more rows than it returns: that is the
signature of a missing or wrong index.

**The pattern catalogue (bad -> good).**

1. **Function on an indexed column (non-sargable).**
   ```sql
   -- BAD: cannot seek
   SELECT id FROM orders WHERE DATE(created_at) = '2026-09-15';
   SELECT id FROM orders WHERE YEAR(created_at) = 2026;
   -- GOOD: range on the raw column
   SELECT id FROM orders WHERE created_at >= '2026-09-15' AND created_at < '2026-09-16';
   SELECT id FROM orders WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01';
   ```
   (Or create a functional index `((DATE(created_at)))`, 8.0.13+.)
2. **Leading wildcard / contains search.**
   `WHERE title LIKE '%login%'` cannot use a B+Tree. Options: `LIKE 'login%'` if the product allows prefix search,
   a `FULLTEXT` index with `MATCH ... AGAINST`, or an external search engine. [ADVANCED]
3. **Implicit type conversion.** `WHERE email_or_phone = 9876543210` when the column is VARCHAR converts every row to
   a number and skips the index. Pass the right type (`'9876543210'`). Also a charset/collation mismatch on join
   columns causes the same effect.
4. **`SELECT *`.** Fetches unneeded columns (network, memory), blocks covering indexes. List the columns.
5. **OR across different columns.** `WHERE assignee_id = 3 OR project_id = 2` may force an index merge or a scan.
   Rewrite as `UNION ALL` of two indexed queries (add de-duplication if needed).
6. **The N+1 query problem** (most common backend performance bug, ORM or not):

   ```js
   // BAD: 1 query for tasks + N queries for assignees (N = number of tasks)
   const [tasks] = await pool.execute('SELECT id, title, assignee_id FROM tasks WHERE project_id = ?', [pid]);
   for (const t of tasks) {
     const [[u]] = await pool.execute('SELECT name FROM users WHERE id = ?', [t.assignee_id]);
     t.assignee = u?.name ?? null;
   }

   // GOOD 1: one JOIN query
   const [rows] = await pool.execute(
     `SELECT t.id, t.title, u.name AS assignee
      FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = ?`, [pid]);

   // GOOD 2: two queries total (batching), useful when you must assemble nested JSON
   const ids = [...new Set(tasks.map((t) => t.assignee_id).filter((x) => x != null))];
   const [users] = ids.length
     ? await pool.query('SELECT id, name FROM users WHERE id IN (?)', [ids])   // query() expands the array
     : [[]];
   ```
   100 tasks = 101 round trips vs 1 or 2. Each round trip costs network latency, plus connection pool pressure.
7. **Expensive `COUNT(*)`.** InnoDB does not keep a row count (MVCC makes it per-snapshot), so
   `COUNT(*) WHERE project_id = ?` counts index entries each time. Options: cap it
   (`SELECT COUNT(*) FROM (SELECT 1 FROM tasks_big WHERE project_id = 2 LIMIT 1001) x` and show "1000+"), cache the
   number, maintain a counter column in the same transaction, or drop total pages from the API (keyset
   pagination).
8. **Row-by-row inserts/updates.** 1,000 single INSERT round trips vs one multi-row statement:
   ```js
   const rows = [[1, 'Task A', 2], [1, 'Task B', 3], [2, 'Task C', 1]];
   await pool.query('INSERT INTO tasks (project_id, title, priority) VALUES ?', [rows]);   // query() expands nested arrays
   ```
   Batch in chunks of ~500-1000 rows inside one transaction.
9. **`ORDER BY RAND()`** sorts the whole table. Pick random ids with a different technique (random id range, or
   pre-computed random column).
10. **Large `IN (...)` lists / subqueries returning huge sets**: join against a temporary table or derived table
    instead.
11. **Sorting without an index** (`ORDER BY created_at DESC LIMIT 20` with no usable index sorts everything): add the
    index that matches the filter + order (Day 3).
12. **Long transactions and big batch writes**: break into batches (`LIMIT 1000` loop, commit per batch) to avoid
    long locks and replica lag (Day 5).
13. **Stale statistics**: run `ANALYZE TABLE` after bulk loads.
14. **Over-indexing**: audit with `sys.schema_unused_indexes`; every extra index taxes writes.
15. **Scale-out options, last** [ADVANCED]: cache hot reads (Redis, Week 6), read replicas for reporting, archive
    old rows, partitioning for time-series, move analytics out of the OLTP database. Fix queries and indexes first.

**Worked example: slow "overdue tasks per assignee" report.**

```sql
-- Slow version (on tasks_big): function on column, SELECT *, no matching index
SELECT * FROM tasks_big
WHERE DATE(due_date) < '2026-06-01' AND status <> 'done' AND assignee_id = 3;

-- Step 1: remove the function (due_date is already DATE) and the star
SELECT id, title, due_date FROM tasks_big
WHERE assignee_id = 3 AND status <> 'done' AND due_date < '2026-06-01';

-- Step 2: composite index: equality column first, then the range column
CREATE INDEX idx_assignee_due ON tasks_big (assignee_id, due_date);
-- status <> 'done' is a negation (not sargable), so it is checked after the index range: acceptable
-- because the first two columns already narrow the rows.

-- Step 3: re-run EXPLAIN ANALYZE; expect type=range on idx_assignee_due and far fewer rows examined.
DROP INDEX idx_assignee_due ON tasks_big;   -- cleanup
```

**Frontend connection.** N+1 is the same anti-pattern as a React component list where **each row fires its own
`fetch`** in `useEffect` (a waterfall) instead of one batched request. The fixes mirror each other: JOIN/batch on
the server, GraphQL DataLoader, or one list endpoint with included fields.

**Real-world scenario.** The orders list API for 50 orders per page was making 1 + 50 + 50 queries (customer and
shipping address per order) and p95 latency was 1.8 s. Replacing it with a single JOIN and selecting only the 9
needed columns got it to 40 ms and cut DB connections used by 20x.

**Interview answer:** "I start by finding the slow queries via the slow log or performance_schema, then run
EXPLAIN ANALYZE and compare rows examined with rows returned. The usual culprits are a missing or wrong composite
index, functions or implicit conversions on indexed columns, SELECT *, N+1 query patterns, big OFFSET pagination
and expensive COUNT queries. I fix one thing at a time, re-measure with realistic data, and only then consider
caching or replicas, because those add complexity."

**Follow-up questions**
- Q: How do you find slow queries in production? A: Slow query log with `long_query_time`, the
  `events_statements_summary_by_digest` table, APM traces, and `SHOW FULL PROCESSLIST` for what is running right now.
- Q: When is a full table scan acceptable? A: Tiny tables, or when the query legitimately needs most rows
  (analytics) where a scan beats random index lookups.
- Q: What is a covering index and why is it fast? A: It contains all selected columns so InnoDB never visits the
  clustered index (`Using index`).
- Q: What is the N+1 problem and how do ORMs cause it? A: Lazy-loading relations in a loop issues a query per
  item; fix with eager loading/JOIN/batched `IN` queries.
- Q: Why is `COUNT(*)` slow on InnoDB? A: No stored exact row count due to MVCC; each count scans an index.
- Q: Will adding an index always speed things up? A: No: it can slow writes, be ignored by the optimizer, or be
  redundant. Measure.
- Q: What is the query cache? A: Removed in MySQL 8.0. Do not mention it as an available optimization; use
  application caching (Redis) instead.

**Common mistakes**
- Guessing indexes without EXPLAIN.
- Testing on a 100-row dev table.
- Optimizing the SQL when the real cost is N+1 round trips in application code.
- Selecting all columns, including large TEXT/JSON blobs, for list endpoints.
- Reaching for caching before fixing a missing index.

**Revision notes**
- Process: find, EXPLAIN ANALYZE, change one thing, re-measure.
- Sargable predicates, no `SELECT *`, matching composite index, batch instead of N+1, cap/skip COUNT.
- Query cache is gone in MySQL 8.

### T6.3 Pagination and database performance [ESSENTIAL]

**Concept.** Pagination = bade result set ko chhote pages mein dena. Do main approaches: **offset pagination**
(`LIMIT n OFFSET m`, page numbers) aur **keyset / cursor pagination** (agle page ke liye "last seen row ke baad
wali rows" maango).

**Why it matters.** Every list endpoint needs pagination (Week 3 / Day 5 covers the API shape). The DB cost of
page 1 vs page 10,000 is a classic scalability interview question: offset gets slower as you go deeper; keyset
stays constant.

**Internal working: why OFFSET degrades.** `LIMIT 20 OFFSET 60000` does not "jump" to row 60,000. MySQL must
**read and discard** the first 60,000 rows (in index order) and then return the next 20. Cost grows linearly with
the offset; at page 10,000 of a big table each request reads ~200,000 rows to return 20. If the query is not
covered by the index it also does a clustered lookup for rows that it throws away.

Second problem, **correctness**: while the user pages, new rows are inserted at the top. Page 2 now starts with
rows that were on page 1 (duplicates), or deletions cause rows to be skipped. Offset pagination is unstable on
live data.

**Offset pagination (simple, supports "jump to page 7").**

```sql
SELECT id, title, created_at
FROM tasks_big
WHERE project_id = 2
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 60000;
-- With an index like (project_id, created_at, id), MySQL walks 60,020 index entries, returns 20.
```

Optimization for big offsets, the **deferred join**: page over the narrow index first, then fetch the wide rows
for only the 20 winners.

```sql
CREATE INDEX idx_proj_created_id ON tasks_big (project_id, created_at, id);

SELECT t.id, t.title, t.status, t.created_at
FROM tasks_big t
JOIN (
  SELECT id FROM tasks_big
  WHERE project_id = 2
  ORDER BY created_at DESC, id DESC
  LIMIT 20 OFFSET 60000
) page ON page.id = t.id
ORDER BY t.created_at DESC, t.id DESC;
```

The inner query is answered from the index only (`Using index`), so skipped entries are cheap, and only 20 clustered
lookups happen. It still reads 60,020 index entries: it reduces the constant, it does not remove the linear growth.

**Keyset (cursor, "seek") pagination.** Remember the sort key of the last row you returned and ask for rows
**after** it. The database seeks straight to that position in the B+Tree: cost is independent of depth.

```sql
-- first page
SELECT id, title, created_at
FROM tasks_big
WHERE project_id = 2
ORDER BY created_at DESC, id DESC
LIMIT 21;                                  -- fetch size + 1 to learn whether another page exists

-- next page: client sends the last row's (created_at, id) as a cursor
SELECT id, title, created_at
FROM tasks_big
WHERE project_id = 2
  AND (created_at < '2026-01-20 10:15:00'
       OR (created_at = '2026-01-20 10:15:00' AND id < 83214))
ORDER BY created_at DESC, id DESC
LIMIT 21;
```

Why the **tie-breaker `id`** is mandatory: in our data **four rows share every `created_at`**. If the cursor were
only `created_at < ?`, the other tied rows of the boundary minute would be **skipped** (or repeated with `<=`).
The sort key must be **unique and deterministic**: `(created_at, id)`. The expanded `OR` form shown above is
portable and lets the optimizer do a `range` scan on `(project_id, created_at, id)` (verified on MySQL 8.0.46:
`type=range`, `key_len=21`, `EXPLAIN ANALYZE` reads only ~21 rows). MySQL also accepts the row
constructor form `(created_at, id) < (?, ?)` which is shorter, but on MySQL 8.0.46 it was **not** used as a
seek: the plan was a plain `ref` lookup on `project_id` plus a filter, and `EXPLAIN ANALYZE` showed it read about
60,000 index entries up to the cursor position (cost grows with depth, like offset). Use the expanded form.

Compare plans (MySQL 8.0.46 on our data; `rows` estimates are rough):

```
offset 60000  : type=ref   key=idx_proj_created_id  rows=99xxx  Extra=Backward index scan
                EXPLAIN ANALYZE: actual rows=60020 on the index step  -> grows with offset
keyset        : type=range key=idx_proj_created_id  key_len=21 rows=12xxx est.  Extra=Using index condition; Backward index scan
                EXPLAIN ANALYZE: actual rows=21 on the index step     -> constant
```

Caution: the offset plan above is what you get when `idx_proj_created_id` is the only index starting with
`project_id`. If `idx_proj_status_created` (from the Day 6 setup) also exists, the optimizer picked **that** one in
our test (`key_len=8`, `Using filesort`, sorting all ~66,667 rows of the project) because `status` sits between
`project_id` and `created_at`. For this experiment run `DROP INDEX idx_proj_status_created ON tasks_big;` first (or add
`FORCE INDEX (idx_proj_created_id)`).

Run `EXPLAIN ANALYZE` on both and compare the `actual rows` and `actual time`: the offset query's time grows
roughly linearly as you increase the offset (try 0, 20,000, 40,000, 60,000; project 2 only has about 66,667 rows, so
an offset of 120,000 is past the end and returns nothing), the keyset query stays flat.

**Trade-offs:**

| | Offset | Keyset (cursor) |
|---|--------|-----------------|
| Jump to page N | yes | no (only next/previous) |
| Cost at deep pages | linear in offset | constant |
| Stable under inserts/deletes | no (duplicates/skips) | yes |
| Total count / "page 3 of 50" | needs COUNT | usually not provided (or approximate) |
| Sorting flexibility | any column | the sort must match an index and include a unique tie-breaker |
| Complexity | low | medium (cursor encoding, direction handling) |

Use offset for small admin tables and "page 1..5" UIs; use keyset for feeds, infinite scroll, exports and any
table that can grow large. (The API-level design of both styles is in Week 3 / Day 5 notes.)

**Node.js (Express 5 + mysql2) keyset implementation.**

```js
// src/tasks.keyset.js
import { pool } from './db.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function encodeCursor(row) {
  const payload = { t: new Date(row.created_at).toISOString(), id: Number(row.id) };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor) {
  try {
    const { t, id } = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(t);
    if (Number.isNaN(createdAt.getTime()) || !Number.isInteger(id) || id < 1) throw new Error('bad');
    return { createdAt, id };
  } catch {
    throw httpError(400, 'Invalid cursor');          // never trust client-supplied cursors
  }
}

export async function listTasksKeyset({ projectId, limit = 20, cursor }) {
  const size = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const params = [projectId];
  let cursorClause = '';
  if (cursor) {
    const c = decodeCursor(cursor);
    cursorClause = 'AND (created_at < ? OR (created_at = ? AND id < ?))';
    params.push(c.createdAt, c.createdAt, c.id);
  }
  params.push(size + 1);                              // one extra row tells us if there is a next page

  const [rows] = await pool.query(
    `SELECT id, title, status, created_at
     FROM tasks_big
     WHERE project_id = ? ${cursorClause}
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    params
  );

  const hasMore = rows.length > size;
  const items = hasMore ? rows.slice(0, size) : rows;
  return { items, nextCursor: hasMore ? encodeCursor(items.at(-1)) : null };
}
```

```js
// src/routes/tasks.js  (Express 5 forwards rejected promises to the error middleware automatically)
import { Router } from 'express';
import { listTasksKeyset } from '../tasks.keyset.js';

export const tasksRouter = Router();

tasksRouter.get('/projects/:projectId/tasks', async (req, res) => {
  const projectId = Number(req.params.projectId);
  if (!Number.isInteger(projectId) || projectId < 1) {
    return res.status(400).json({ error: 'projectId must be a positive integer' });
  }
  const data = await listTasksKeyset({
    projectId,
    limit: req.query.limit,
    cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
  });
  res.json(data);                                     // { items: [...], nextCursor: "eyJ0Ijoi..." | null }
});
```

(On Express 4 you would wrap the handler in a try/catch or an `asyncHandler` helper; Express 5 does not need it.)
The `created_at` values in the cursor are in the same timezone convention as the pool (`timezone: 'Z'`).

**Other database performance levers (beyond one query).**
- **Buffer pool:** `innodb_buffer_pool_size` (commonly 50-75% of RAM on a dedicated DB server). If the working set
  fits in memory, reads are fast; check `Innodb_buffer_pool_reads` vs `Innodb_buffer_pool_read_requests` for the
  hit ratio.
- **Only fetch what the page needs:** column lists, limits, no giant JSON blobs in list endpoints.
- **Cache** repeated reads (Redis, Week 6) and invalidate carefully.
- **Read replicas** for reporting/read-heavy traffic; remember replication lag (read-your-writes issues).
- **Archive / partition** old data (time-based partitions) so hot data stays small. [ADVANCED]
- **Keep transactions and connections short** (Day 5).

**Frontend connection.** Offset pagination = classic "Page 1 2 3 ..." buttons; keyset = **infinite scroll** with
a `nextCursor` token (React Query `useInfiniteQuery` with `getNextPageParam`). The cursor must be opaque to the UI:
it just passes it back, exactly like `getNextPageParam` returns it.

**Real-world scenario.** An activity feed with 80 million events. Offset pagination works until a crawler or an
"export all" script requests page 400,000: each request scans 8 million index entries, saturates the DB and slows
everyone. Switching the API to cursor pagination bounds every request to about 20 index reads and removes
duplicate/skipped items during live inserts.

**Interview answer:** "Offset pagination reads and discards all earlier rows, so cost grows with the page number,
and it can return duplicates or skip rows when data changes during paging. Keyset pagination remembers the last row's
sort key and queries 'rows after this', using the index to seek directly, so latency is constant. The sort key must
be unique, so I add the primary key as a tie-breaker, and I back it with a composite index like (project_id,
created_at, id). I return a base64 cursor and fetch limit plus one row to know whether there is another page. I use
offset only for small datasets where jumping to an arbitrary page matters."

**Follow-up questions**
- Q: How do you support sorting by a non-unique column such as priority with keyset? A: Sort by `(priority, id)`
  and use `(priority > ? OR (priority = ? AND id > ?))` with an index on `(project_id, priority, id)`.
- Q: How do you go to the previous page with keyset? A: Query with the reverse comparison and reverse order, then
  reverse the rows in the application (or keep a `prevCursor` stack on the client).
- Q: How do you show "total results" cheaply? A: Capped count (`LIMIT 1001`), cached/approximate count, or omit it.
- Q: What if the sort column is nullable? A: NULL ordering makes the comparison complicated (NULLs sort first in
  ASC); prefer NOT NULL sort columns or `COALESCE` into a stored/indexed column.
- Q: Is the cursor secure? A: It is not secret, just opaque; validate it strictly and keep it free of sensitive
  data. If it must not be tampered with (e.g. contains filters), sign it (HMAC). [ADVANCED]
- Q: Why fetch `limit + 1`? A: To know whether a next page exists without an extra COUNT query.
- Q: Does `LIMIT` alone make a query fast? A: Only if the sort/filter is served by an index; otherwise MySQL still
  sorts everything (`Using filesort`) and then discards.

**Common mistakes**
- Keyset on a non-unique column without a tie-breaker (skipped/duplicated rows).
- Mixing sort directions in the keyset condition and the `ORDER BY` (`id < ?` with `ORDER BY id ASC`).
- Index that does not match the filter + order (falls back to filesort, losing the benefit).
- Computing `COUNT(*)` on every page request for a huge table.
- Interpolating `req.query.limit`/`sort` directly into SQL (validate and allow-list; use placeholders for
  values).
- Deep offsets exposed publicly (easy denial of service); cap the maximum page/offset or switch to cursors.

**Revision notes**
- Offset = read and discard; linear cost; unstable under writes. Keyset = seek; constant cost; needs unique sort
  key + matching index.
- Fetch `limit + 1`; opaque base64url cursor; validate it.
- `COUNT(*)` is expensive on InnoDB: cap, cache or skip.

### End of Day 6

**Key concepts to remember**
1. `type` order: const > eq_ref > ref > range > index > ALL; read `key`, `key_len`, `rows`, `Extra`.
2. `EXPLAIN` = estimates; `EXPLAIN ANALYZE` = actual run. `ANALYZE TABLE` refreshes stats.
3. Slow query playbook: find, explain, change one thing, re-measure on realistic data.
4. Fix patterns: sargable predicates, no `SELECT *`, composite indexes, batch instead of N+1, cap COUNT.
5. Offset reads and discards; keyset seeks; use `(sort_col, id)` as the unique key.
6. Query cache is removed in MySQL 8; use application caching.

**Five revision questions**
1. Given `type=ref, key=idx_a, key_len=8, rows=50000, Extra=Using where; Using filesort` on a query with
   `WHERE a=? AND b=? ORDER BY c`, what is wrong and what index fixes it?
2. Why does `WHERE DATE(created_at) = '2026-01-05'` scan the index and how do you rewrite it?
3. Explain N+1 with a Node example and give two fixes.
4. Why do offset pages get slower, and why does keyset need a tie-breaker?
5. What is the difference between `Using index` and `Using index condition`?

**One practical coding task**
Using `tasks_big`, implement `GET /projects/:projectId/tasks` with **both** modes: `?page=&pageSize=` (offset,
capped at page 100) and `?cursor=` (keyset). Write a tiny benchmark script that requests page 1, 1000 and 9000
with offset and the equivalent number of cursor hops, timing each with `performance.now()`, and print a table. Run
`EXPLAIN ANALYZE` on the two SQL statements and paste the actual rows into your notes.

**Self-assessment checklist**
- [ ] I can read an EXPLAIN row aloud: type, key, key_len, rows, Extra, and say if it is good.
- [ ] I ran `EXPLAIN ANALYZE` and compared estimated and actual rows.
- [ ] I can list five non-sargable patterns and their fixes.
- [ ] I implemented keyset pagination with base64 cursors and a tie-breaker.
- [ ] I can explain why `COUNT(*)` is expensive and give three alternatives.
- [ ] I can describe the slow-query workflow without notes.

---

## Day 7 - Revision, Stage 3 mini project, weekly test (Day 28)

**Estimated time (2 hours):** 15 min spaced revision of Day 1-6 notes, 35 min Stage 3 mini project (schema +
data layer), 40 min timed weekly test (below), 20 min marking + weak-area plan, 10 min catch-up planning.
Use today to **catch up on unfinished topics** first; only do the new material if Day 1-6 are done.

**Learning objectives**
- Consolidate the week into a one-page mental model: schema -> queries -> indexes -> transactions -> locks -> pool
  -> EXPLAIN -> pagination.
- Build the MySQL data layer for the Task Management API (project `Stage 3`): migrations, pool, repositories, one
  transaction-safe operation.
- Test yourself under time pressure and identify weak areas using the guidance at the end of this file.

### Spaced revision schedule for Week 4 topics

Revisit each day's topic after about 1 day, 3 days and 7 days (the master plan in
`00_Master_Strategy_Schedule.md` lists the full 56-day version). Each revisit is 10-15 minutes: re-read the
"Revision notes" and answer the five revision questions out loud without looking.

| Study day | Topic | Revisit +1 day | Revisit +3 days | Revisit +7 days |
|-----------|-------|----------------|-----------------|-----------------|
| Day 22 (W4 D1) | keys, constraints, CRUD | Day 23 | Day 25 | Day 29 |
| Day 23 (W4 D2) | joins, GROUP BY, subqueries | Day 24 | Day 26 | Day 30 |
| Day 24 (W4 D3) | normalization, indexes | Day 25 | Day 27 | Day 31 |
| Day 25 (W4 D4) | transactions, isolation | Day 26 | Day 28 | Day 32 |
| Day 26 (W4 D5) | locks, deadlocks, pool | Day 27 | Day 29 | Day 33 |
| Day 27 (W4 D6) | EXPLAIN, optimization, pagination | Day 28 | Day 30 | Day 34 |

### One-page Week 4 cheat sheet (read before interviews)

```
SCHEMA      PK (clustered, sequential BIGINT), UNIQUE, FK (+index), NOT NULL, CHECK (8.0.16+), DECIMAL for money
JOIN        INNER = matches only | LEFT = all left + NULL | anti-join = LEFT ... IS NULL / NOT EXISTS
            right-table filter in ON (outer join), WHERE kills the outer join
AGGREGATE   WHERE (rows) -> GROUP BY -> HAVING (groups); COUNT(col) skips NULL; join+aggregate on 1:N multiplies
SUBQUERY    EXISTS > NOT IN (NULL trap); ROW_NUMBER() OVER (PARTITION BY ..) for top-N per group
NORMAL FORM 1NF atomic | 2NF whole key | 3NF no transitive dependency | denormalize only with a measured reason
INDEX       B+Tree; clustered = PK holds rows; secondary = cols + PK; covering = Using index
COMPOSITE   leftmost prefix; equality first, then range/ORDER BY; range stops later columns; key_len shows usage
ACID        undo (A), constraints (C), MVCC+locks (I), redo (D)
ISOLATION   RU dirty | RC stmt snapshot | RR (default) txn snapshot + next-key locks | SERIALIZABLE shared locks
LOST UPDATE atomic UPDATE ... SET x = x - ? WHERE x >= ?  |  SELECT FOR UPDATE  |  version column (optimistic)
LOCKS       row locks on index records, held until commit; no index = wide locks; SKIP LOCKED for queues
DEADLOCK    1213, whole txn rolled back; consistent lock order + short txns + retry with backoff
TIMEOUT     1205, statement rolled back; find blocker via data_locks / sys.innodb_lock_waits
POOL        one per process; getConnection for txns; release in finally; procs x limit < max_connections
EXPLAIN     type: const > eq_ref > ref > range > index > ALL; Extra: Using filesort / temporary / index
OPTIMIZE    sargable predicates, no SELECT *, composite index, no N+1, batch writes, cap COUNT(*)
PAGINATION  offset = read+discard (linear), keyset = seek (constant): ORDER BY (col, id), limit+1, opaque cursor
```

### Stage 3 mini project: MySQL schema and data layer for the Task Management API [ESSENTIAL]

This is **Stage 3** of the project in `12_Project_Task_API.md` (the part you can finish in Week 4; Week 5 adds
auth). It reuses everything from Section 0 so nothing here is new theory.

**Requirements**
1. Schema managed by **versioned SQL migrations**, not by pasting DDL in a console.
2. One shared `mysql2` pool (T5.3) and parameterized repositories for users, projects, tasks.
3. A `listTasks` query with filter + keyset pagination backed by a composite index.
4. One **transaction-safe** operation: assign a task to a user and write an activity-log row atomically, locking
   the task row first.

**Implementation approach**

Folder layout:

```
task-api/
  package.json              ("type": "module")
  db/migrations/001_init.sql          (Section 0 DDL for users, projects, project_members, tasks, tags, task_tags)
  db/migrations/002_activity_log.sql
  db/migrations/003_task_indexes.sql
  scripts/migrate.js
  src/db.js                 (pool + withTransaction, from Day 5)
  src/repos/tasks.repo.js
```

`db/migrations/002_activity_log.sql`:

```sql
CREATE TABLE activity_log (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id     BIGINT UNSIGNED NOT NULL,
  actor_id    BIGINT UNSIGNED NULL,
  action      ENUM('created','assigned','status_changed') NOT NULL,
  detail      VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_task_created (task_id, created_at),
  CONSTRAINT fk_activity_task  FOREIGN KEY (task_id)  REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;
```

`db/migrations/003_task_indexes.sql` (the composite indexes the list endpoints need):

```sql
CREATE INDEX idx_tasks_project_status_created ON tasks (project_id, status, created_at, id);
CREATE INDEX idx_tasks_project_created        ON tasks (project_id, created_at, id);   -- list WITHOUT a status filter
CREATE INDEX idx_tasks_assignee_status_due    ON tasks (assignee_id, status, due_date);
```

(Why two project indexes: with `status` sitting between `project_id` and `created_at`, the first index can only
return rows in `created_at` order when `status = ?` is in the WHERE clause. For the unfiltered list, verified on
MySQL 8.0.46, `WHERE project_id = ? ORDER BY created_at DESC, id DESC` showed `Using filesort` with only the first
index, so the second index serves that case.)

`scripts/migrate.js` (simple runner; DDL is not transactional in MySQL, so keep each migration small and idempotent
where possible):

```js
// scripts/migrate.js  -> node scripts/migrate.js
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

// multipleStatements is enabled ONLY for this trusted admin script, never for the app pool
const conn = await mysql.createConnection({
  host: process.env.DB_HOST ?? '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'taskdb',
  multipleStatements: true,
});

try {
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  const [rows] = await conn.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));

  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (done.has(file)) continue;
    console.log('applying', file);
    await conn.query(await readFile(path.join(dir, file), 'utf8'));
    await conn.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
  }
  console.log('migrations complete');
} finally {
  await conn.end();
}
```

`src/repos/tasks.repo.js`:

```js
// src/repos/tasks.repo.js
import { pool, withTransaction } from '../db.js';

const STATUSES = new Set(['todo', 'in_progress', 'done']);

export async function createTask({ projectId, title, priority = 3, dueDate = null, assigneeId = null }) {
  const [res] = await pool.execute(
    'INSERT INTO tasks (project_id, assignee_id, title, priority, due_date) VALUES (?, ?, ?, ?, ?)',
    [projectId, assigneeId, title, priority, dueDate]
  );
  return res.insertId;
}

export async function findTaskById(id) {
  const [rows] = await pool.execute(
    `SELECT t.id, t.project_id, t.title, t.status, t.priority, t.due_date,
            t.assignee_id, u.name AS assignee_name
     FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listTasksByProject({ projectId, status, limit = 20, before }) {
  if (status && !STATUSES.has(status)) throw Object.assign(new Error('invalid status'), { status: 400 });
  const size = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const where = ['project_id = ?'];
  const params = [projectId];
  if (status) { where.push('status = ?'); params.push(status); }
  if (before) {                                      // before = { createdAt: Date, id: number } from the cursor
    where.push('(created_at < ? OR (created_at = ? AND id < ?))');
    params.push(before.createdAt, before.createdAt, before.id);
  }
  params.push(size + 1);
  const [rows] = await pool.query(
    `SELECT id, title, status, priority, due_date, created_at
     FROM tasks WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC, id DESC LIMIT ?`,
    params
  );
  return rows;      // the service layer trims to `size` and builds nextCursor (see Day 6)
}

// Transaction: lock the task row, update the assignee, write the audit row, all or nothing
export async function assignTask({ taskId, assigneeId, actorId }) {
  return withTransaction(async (conn) => {
    const [[task]] = await conn.execute('SELECT id, assignee_id FROM tasks WHERE id = ? FOR UPDATE', [taskId]);
    if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });

    const [[user]] = await conn.execute('SELECT id, is_active FROM users WHERE id = ?', [assigneeId]);
    if (!user || !user.is_active) throw Object.assign(new Error('Assignee unavailable'), { status: 422 });

    await conn.execute('UPDATE tasks SET assignee_id = ? WHERE id = ?', [assigneeId, taskId]);
    await conn.execute(
      "INSERT INTO activity_log (task_id, actor_id, action, detail) VALUES (?, ?, 'assigned', ?)",
      [taskId, actorId, `assignee ${task.assignee_id ?? 'none'} -> ${assigneeId}`]
    );
    return { taskId, assigneeId };
  });
}
```

**Acceptance criteria**
- [ ] `node scripts/migrate.js` on an empty database creates all tables, and a second run does nothing.
- [ ] `listTasksByProject` returns stable pages with no duplicates while another script inserts tasks.
- [ ] `EXPLAIN` for the list query shows `idx_tasks_project_status_created` (with a status filter) or
  `idx_tasks_project_created` (without one) and no `Using filesort` on a seeded table of 100k+ tasks.
- [ ] `assignTask` rolls back the assignment if the activity insert fails (simulate by renaming the column),
  verified by a test or manual check.
- [ ] Two concurrent `assignTask` calls on the same task serialize (second waits on the row lock) and both audit rows
  exist.
- [ ] No SQL string is built from user input except allow-listed identifiers.

**Interview concepts demonstrated:** migrations vs ad-hoc DDL, composite index design, pool + transaction helper,
pessimistic row lock, parameterized queries, keyset pagination, audit logging with referential integrity.

### Interview rapid fire (answer each in 30 seconds, out loud)

1. What is the difference between a clustered and a secondary index in InnoDB?
2. Explain INNER vs LEFT JOIN and the WHERE-vs-ON trap.
3. Why does NOT IN return nothing when the subquery has a NULL?
4. What is the leftmost prefix rule? Give an example with three columns.
5. What does each ACID letter mean and which InnoDB structure provides it?
6. What is MVCC and what is a consistent read?
7. What is the default isolation level and what anomalies remain?
8. How do you prevent a lost update? Name three ways.
9. What causes a deadlock and how do you handle it in code?
10. How do you size a connection pool?
11. How do you read EXPLAIN? Which `type` values are bad?
12. Offset vs keyset pagination: when do you use each?

### End of Day 7

**Key concepts to remember**
1. The cheat sheet above: you should be able to rebuild it from memory.
2. A data layer is migrations + one pool + parameterized repositories + one transaction helper.
3. Measure (EXPLAIN ANALYZE, slow log) before and after every optimization.
4. Concurrency correctness is the DB's job (constraints, atomic statements, locks), not the JS code's.
5. Retryable errors: 1213 (deadlock), connection resets. Non-retryable: 1062, 1452, 3819 (map to 4xx).

**Five revision questions**
1. Write the schema (tables, keys, indexes) for a ride-booking app (riders, drivers, rides) from memory.
2. For `WHERE driver_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 20` design the index and justify it.
3. Walk through what happens inside InnoDB from `START TRANSACTION` to `COMMIT` for an UPDATE (undo, redo, locks).
4. A teammate wants `FLOAT` for prices and a pool of 200 per pod; respond to both.
5. Your endpoint p95 jumped from 40 ms to 3 s after a data import. List your first five investigation steps.

**One practical coding task**
Take the Stage 3 repository and add `bulkAssign({ taskIds, assigneeId, actorId })` that assigns many tasks in one
transaction. Lock the task rows in ascending id order (so two concurrent bulk assignments cannot deadlock), skip
tasks already assigned to that user, write one activity row per changed task using a single multi-row `INSERT`, and
return how many were changed. Add a concurrency script that runs two overlapping calls and asserts no 1213 reaches the
caller.

**Self-assessment checklist**
- [ ] I finished Days 1-6 or listed what is missing for the catch-up plan.
- [ ] I completed the weekly test within 40 minutes and marked it honestly.
- [ ] I built (or understood line by line) the Stage 3 data layer.
- [ ] I know my three weakest topics and scheduled a revisit.
- [ ] I can recite the one-page cheat sheet.

---

## Week 4 revision summary

**Schema and CRUD.** InnoDB tables with surrogate `BIGINT UNSIGNED AUTO_INCREMENT` keys, UNIQUE/FK/NOT NULL/CHECK
constraints as the last line of defense, junction tables for M:N, `DECIMAL` for money, `utf8mb4`. CRUD with
parameterized queries, `affectedRows`/`insertId`, `IS NULL`, upsert with `ON DUPLICATE KEY UPDATE`.

**Querying.** INNER vs LEFT JOIN, anti-joins, ON vs WHERE in outer joins. WHERE before grouping, HAVING after;
conditional aggregation; avoid multiplying rows by joining 1:N before aggregating. Subqueries: EXISTS preferred,
NOT IN NULL trap, correlated subqueries vs derived tables, CTEs, window functions for top-N per group.

**Design and indexes.** Normalize to 3NF, denormalize on purpose (snapshots, counters). B+Tree, clustered vs
secondary, covering indexes, selectivity, costs. Composite indexes: leftmost prefix, equality columns first then
range/ORDER BY, `key_len` to verify.

**Transactions and concurrency.** ACID mechanisms; autocommit, implicit commits, savepoints; MVCC and read views;
isolation levels and anomalies; InnoDB RR specifics (snapshot reads, current reads, next-key locks); lost update
fixes (atomic UPDATE, FOR UPDATE, optimistic version). Locking: S/X, intention, record/gap/next-key; locks live until
commit; missing indexes widen locks; SKIP LOCKED/NOWAIT. Deadlocks: cause, 1213, prevention, retry.

**Operations and performance.** Pooling: per-process pool, `getConnection` for transactions, release in finally,
sizing by processes x limit and Little's law, bounded queue. EXPLAIN / EXPLAIN ANALYZE reading; optimization
patterns; N+1; COUNT(*) cost; offset vs keyset pagination with tie-breaker and composite index.

**What is essential vs advanced this week.** Essential: keys/constraints, joins, GROUP BY/HAVING, subqueries,
index basics, composite prefix, transactions + ACID, isolation levels + lost update, deadlock handling, pooling,
EXPLAIN basics, pagination trade-offs. Advanced: hash joins, skip scan, histograms, write skew, gap-lock
deadlocks, online DDL tools, ProxySQL, partitioning, signed cursors.

**Honest scope note.** This week gives interview-level fluency. Replication, backup/restore, partitioning,
sharding and deep query-optimizer internals are topics for continued learning after the 8 weeks.

---

## Week 4 mixed-difficulty assessment

Take it in one sitting: 40 minutes, no notes, MySQL client open for the query questions. Mark the level of each
question (B = Basic, I = Intermediate, A = Advanced). Answers with explanations follow in the next section.

Use the Section 0 data (reset it first).

**Basic**

1. (B) What is the difference between a PRIMARY KEY and a UNIQUE KEY in MySQL?
2. (B) A signup API inserts a user whose email already exists. Which MySQL error number is raised and which HTTP
   status should the API return?
3. (B) Which join returns all rows of the left table even when there is no match on the right?
4. (B) Explain WHERE versus HAVING in one sentence each.
5. (B) What does the "D" in ACID stand for and which InnoDB structure provides it?
6. (B) What is the default transaction isolation level of InnoDB?
7. (B) Why should money be stored in `DECIMAL` and not `FLOAT`?
8. (B) What is a connection pool and why is it created once per process, not per request?

**Intermediate**

9. (I) Predict the result: `SELECT COUNT(*), COUNT(assignee_id), COUNT(DISTINCT assignee_id) FROM tasks;`
10. (I) Predict the result:
    ```sql
    SELECT u.name, COUNT(t.id) AS done_tasks
    FROM users u
    LEFT JOIN tasks t ON t.assignee_id = u.id AND t.status = 'done'
    GROUP BY u.id, u.name
    ORDER BY u.id;
    ```
11. (I) Write a query returning users who have **more than one open** (not done) task, with the count.
12. (I) Why does `SELECT name FROM users WHERE id NOT IN (SELECT assignee_id FROM tasks)` return no rows, and how do
    you fix it?
13. (I) Index `(project_id, status, created_at)` exists. For each query say "seeks on which columns" and whether a
    filesort is needed:
    (a) `WHERE project_id = 2 AND status = 'todo' ORDER BY created_at`
    (b) `WHERE status = 'todo' ORDER BY created_at`
    (c) `WHERE project_id = 2 ORDER BY created_at`
14. (I) Predict the table content after this script, assuming `orders` has 7 rows before it and autocommit is on:
    ```sql
    START TRANSACTION;
    INSERT INTO orders (user_id, amount, status) VALUES (3, 1.00, 'pending');
    SAVEPOINT s1;
    INSERT INTO orders (user_id, amount, status) VALUES (3, 2.00, 'pending');
    ROLLBACK TO SAVEPOINT s1;
    INSERT INTO orders (user_id, amount, status) VALUES (3, 3.00, 'pending');
    COMMIT;
    ```
    How many rows does `orders` have and which amounts were added?
15. (I) Session A (REPEATABLE READ) runs `START TRANSACTION; SELECT balance FROM accounts WHERE id=1;` (1000.00). Session B
    runs `UPDATE accounts SET balance = 900.00 WHERE id = 1;` (autocommit). Session A runs the same SELECT again, then
    `COMMIT`, then SELECT again. What does A see three times? What changes under READ COMMITTED?
16. (I) Describe the lost update problem with a concrete example and give two fixes.
17. (I) An `EXPLAIN` shows `type=ALL, rows=4800000, Extra=Using where; Using filesort`. What does it mean and what
    would you try first?
18. (I) Why do deep `OFFSET` pages get slow, and what is the replacement?
19. (I) You run 12 Node workers (pm2 cluster) each with `connectionLimit: 20` against a MySQL with
    `max_connections = 151`. What happens and what do you change?
20. (I) Name two kinds of statements that cause an implicit commit and say how a deadlock differs from a lock wait
    timeout regarding rollback scope.

**Advanced**

21. (A) Design the best index for: `WHERE assignee_id = ? AND status IN ('todo','in_progress') ORDER BY due_date
    LIMIT 20`, and explain the trade-off you are making.
22. (A) Endpoint `assign` locks the task row then increments a counter row in `user_workload`; endpoint `bulk reassign`
    locks `user_workload` rows first then tasks. Under load you see error 1213. Explain, prove it with a timeline, and fix it.
23. (A) Write the keyset pagination WHERE clause for `ORDER BY priority ASC, created_at DESC, id DESC` and the index
    you need. Why does mixed direction matter?
24. (A) Your code does `SELECT COUNT(*) FROM slots WHERE slot_time = ? AND room_id = ?`, and if 0 then `INSERT`. Under
    REPEATABLE READ two concurrent requests both insert. Why does isolation not save you, and what is the correct fix?
25. (A) Production incident: the API hangs, DB CPU is 5%, `Threads_connected` equals `connectionLimit x
    processes`, processlist shows many connections in `Sleep` for 20+ minutes. Diagnose and fix.
26. (A) Given `EXPLAIN SELECT id, title FROM tasks_big WHERE project_id = 2 AND status = 'todo' ORDER BY priority LIMIT 20`
    showing `type=ref, key=idx_proj_status_created, key_len=9, rows=42194, Extra=Using index condition; Using
    filesort`, why the filesort, and how do you remove it?

---

## Answers with explanations

**1.** A table has exactly one PRIMARY KEY: unique, NOT NULL, and in InnoDB it is the clustered index that physically
holds the rows. A table can have many UNIQUE keys; they allow NULLs (several) and are secondary indexes.

**2.** Error **1062** (`ER_DUP_ENTRY`, SQLSTATE 23000), because the UNIQUE index on `email` rejects it. The API should
return **409 Conflict** (sometimes 422 with a field error), never a raw 500 or the SQL message. Relying on the
UNIQUE constraint also removes the race condition of "SELECT then INSERT".

**3.** LEFT JOIN (LEFT OUTER JOIN): right-side columns are NULL where there is no match.

**4.** WHERE filters individual rows before grouping and cannot use aggregates; HAVING filters groups after
aggregation and may use aggregate functions.

**5.** Durability: committed data survives a crash. InnoDB uses the **redo log** (write-ahead log) flushed at commit,
with the doublewrite buffer protecting against torn pages.

**6.** REPEATABLE READ (one consistent snapshot per transaction, next-key locks for locking reads). PostgreSQL's
default is READ COMMITTED, a frequent follow-up.

**7.** FLOAT/DOUBLE are binary approximations (0.1 cannot be represented exactly), so sums drift. DECIMAL stores exact
fixed-point values. Alternatively store integer minor units (paise). Note that mysql2 returns DECIMAL as string.

**8.** A pool keeps reusable open connections so each query avoids the cost of connecting and the server is protected
from unlimited connections. It is created once at startup per process; creating one per request would defeat the
purpose, open many connections and exhaust `max_connections`.

**9.** `14, 11, 4`. `COUNT(*)` counts all 14 rows; `COUNT(assignee_id)` skips the 3 NULLs (tasks 4, 9, 13) giving 11;
distinct assignees are users 1, 3, 4, 5 = 4.

**10.**
```
Asha   0
Bilal  0
Chitra 1   (task 1)
Dev    1   (task 5)
Esha   2   (tasks 8, 12)
Farhan 0
```
The `status = 'done'` filter is in the `ON` clause, so every user stays in the result (LEFT JOIN semantics), and
`COUNT(t.id)` counts only matched non-NULL ids. If you moved the filter to WHERE you would lose users with zero
done tasks.

**11.**
```sql
SELECT u.id, u.name, COUNT(*) AS open_tasks
FROM users u
JOIN tasks t ON t.assignee_id = u.id
WHERE t.status <> 'done'
GROUP BY u.id, u.name
HAVING COUNT(*) > 1
ORDER BY u.id;
-- Chitra 2 (tasks 2, 14), Dev 2 (3, 6), Esha 2 (7, 10). Asha has 1 open task, so she is excluded.
```

**12.** `tasks.assignee_id` contains NULLs. `id NOT IN (1,3,4,5,NULL)` evaluates to UNKNOWN for every id not in the
list, so no row passes WHERE. Fix with `NOT EXISTS (SELECT 1 FROM tasks t WHERE t.assignee_id = users.id)` or add
`WHERE assignee_id IS NOT NULL` to the subquery. Result: Bilal and Farhan.

**13.**
(a) Seeks on `project_id` and `status` (equality), and the rows within that slice are already ordered by `created_at`:
**no filesort**.
(b) `status` alone is not a leftmost prefix: no normal seek on this index (the optimizer would scan the table or the
whole index; on MySQL 8.0.46 it used a skip scan, `Using index for skip scan`) and a **filesort** is needed.
(c) Seeks on `project_id` only, but the rows are ordered by `(status, created_at)`, not `created_at`, so a **filesort**
is needed. The fix is a different index, `(project_id, created_at)`, if this query is important.

**14.** **9 rows**: the 7 original rows plus two new ones with amounts **1.00** and **3.00**. `ROLLBACK TO SAVEPOINT s1`
undoes only the second insert (2.00); the transaction continues and the final `COMMIT` persists the 1.00 and 3.00
rows. (If you answered 10 you counted the rolled-back insert.) Delete the two demo rows afterward to restore the
data set.

**15.** Under REPEATABLE READ A sees **1000.00, 1000.00, 900.00**: the second SELECT reads from the snapshot created by
the first read, and after COMMIT a new transaction (autocommit) sees the latest committed value. Under READ COMMITTED
the second SELECT already returns **900.00** (non-repeatable read) because each statement takes a fresh snapshot.

**16.** Two requests read balance 1000, one computes 900 (withdraw 100), the other 800 (withdraw 200); both write
absolute values, the later write overwrites the first, final 800 instead of 700. Fixes: (1) atomic relative UPDATE
`SET balance = balance - ? WHERE id = ? AND balance >= ?` and check `affectedRows`; (2) `SELECT ... FOR UPDATE` inside a
short transaction; (3) optimistic locking with a `version` column (`WHERE id = ? AND version = ?`, retry or 409 on
zero affected rows). REPEATABLE READ alone does not prevent it.

**17.** `type=ALL` is a full table scan of about 4.8 million rows, `Using where` filters after reading, and `Using
filesort` sorts the matched rows. First try: add a composite index matching the equality filters then the ORDER BY
column (for example `(project_id, status, created_at)`), confirm with EXPLAIN that `type` becomes `ref`/`range`, rows
drop, and the filesort disappears. Also check the query for functions on columns or `SELECT *`.

**18.** `OFFSET n` makes MySQL read and discard n rows before returning the page, so cost grows linearly with the
page number (and data changes between requests cause duplicates/skips). Replace with keyset (cursor) pagination: remember
`(created_at, id)` of the last row and query `WHERE (created_at < ? OR (created_at = ? AND id < ?)) ORDER BY
created_at DESC, id DESC LIMIT n+1`, backed by a composite index. Cost is constant.

**19.** Potential connections = 12 x 20 = **240**, above `max_connections = 151`, so under load new connections
fail with error 1040 `Too many connections`, (and the sleeping idle pool connections still count). Fix: reduce the pool
size per worker (for example 8, giving 96), keep total under ~80% of the limit, size by Little's law and
concurrency, fix slow queries that hold connections, set `queueLimit`, and only then consider raising
`max_connections` or adding a proxy.

**20.** Implicit commit: DDL (`CREATE/ALTER/DROP/TRUNCATE TABLE`), `LOCK TABLES`/`UNLOCK TABLES`, `START
TRANSACTION` while one is open, `SET autocommit = 1`. A **deadlock** (1213) rolls back the **entire transaction** of the
victim; a **lock wait timeout** (1205) rolls back only the **statement** by default and the transaction stays open (the
app must decide to roll back). Deadlock: retry the whole transaction; timeout: investigate the blocker or retry the
unit of work.

**21.** Best general answer: `(assignee_id, due_date, status)`. MySQL seeks on `assignee_id`, reads entries already in
`due_date` order (no filesort), checks `status` against the index entries (index condition) and stops after 20
matches. Placing `status` before `due_date` (`assignee_id, status, due_date`) breaks the order because `IN` with two
values produces two sorted ranges, causing `Using filesort` (or a UNION ALL of two queries). The trade-off: reading
past non-matching rows if the assignee has many `done` tasks that sort early; if most rows are `done`, a partial
approach (query per status with `UNION ALL` + `ORDER BY ... LIMIT 20`, or a status-specific index) is better.
Always verify with `EXPLAIN ANALYZE`.

**22.** Lock order inversion: T1 (assign) holds the task row lock and requests the `user_workload` row; T2 (bulk
reassign) holds the `user_workload` row lock and requests the task row: a cycle, so InnoDB rolls one back with 1213.
Timeline: T1 `SELECT ... task FOR UPDATE` (locks task 5); T2 `SELECT ... FROM user_workload WHERE user_id = 3 FOR
UPDATE`; T1 `UPDATE user_workload WHERE user_id = 3` waits for T2; T2 `UPDATE tasks WHERE id = 5` waits for T1: deadlock.
Fix: make both endpoints lock in the same global order (for example always tasks first, ascending id, then
user_workload ascending user id), keep the transactions short, and add retry on 1213 in `withTransaction`.

**23.** Condition (ASC for priority, DESC for created_at and id):
```sql
WHERE project_id = ?
  AND ( priority > ?
        OR (priority = ? AND created_at < ?)
        OR (priority = ? AND created_at = ? AND id < ?) )
ORDER BY priority ASC, created_at DESC, id DESC
LIMIT 21
```
Index: `(project_id, priority ASC, created_at DESC, id DESC)`. MySQL 8 supports real descending index columns, so a
mixed-direction ORDER BY can be satisfied directly. A plain ascending index would need a filesort or an index scan in
one direction only, so mixed directions require a matching index definition. The row-constructor shortcut
`(priority, created_at, id) > (?, ?, ?)` does not work with mixed directions.

**24.** It is a check-then-act race: both transactions' plain `SELECT COUNT(*)` read the snapshot with 0 rows, both
insert, because a consistent read takes no lock and REPEATABLE READ does not serialize inserts into a range you only
read through the snapshot. Correct fix: enforce the rule in the database with `UNIQUE (room_id, slot_time)` and just
`INSERT`; handle error 1062 as "slot already taken" (409). Alternatives: `SELECT ... FOR UPDATE` on the range (gap lock),
or SERIALIZABLE, but the unique constraint is simplest and safest.

**25.** Classic connection leak: all pool connections are borrowed but idle (`Sleep`), requests queue forever, DB
looks idle. Investigate: `SHOW FULL PROCESSLIST`/`sys.session` for old `Sleep` sessions, `Threads_connected`, check
`information_schema.innodb_trx` for open transactions started long ago, app logs for errors in code paths using
`getConnection`. Root cause is usually a path that does not call `release()` (early return, thrown error without
`finally`) or a transaction that never commits/rolls back. Fix: wrap in `try/finally`, use a `withTransaction` helper,
use `pool.execute` for single statements, add `queueLimit` and acquire timeouts, alert on pool queue length, and kill the
stuck sessions as an immediate mitigation.

**26.** The index `(project_id, status, created_at)` delivers rows ordered by `created_at` inside each
`(project, status)` slice, not by `priority`, so the `ORDER BY priority` needs a sort of ~22,000 rows (`Using
filesort`, the `LIMIT` cannot short-circuit it). Fix: create `(project_id, status, priority)` (and optionally add
`id`/created_at as trailing columns); then equality, equality, ORDER BY column, the slice is already sorted by priority
and MySQL stops after 20 rows. Confirm with EXPLAIN and EXPLAIN ANALYZE (actual rows near 20).

---

## Weak-area identification guidance

Score yourself: 1 point per Basic, 2 per Intermediate, 3 per Advanced (maximum 8 + 24 + 18 = 50 points; give
half credit for a partly correct answer). Then map your misses:

| Missed questions | Weak area | Re-read | Drill (30 minutes) |
|------------------|-----------|---------|--------------------|
| 1, 2, 7, 12 | keys, constraints, NULL, types | Day 1 (T1.1-T1.4), Day 2 (NOT IN trap) | Trigger errors 1062, 1451, 1452, 3819 on purpose; write 5 NULL queries |
| 3, 10, 11 | joins, grouping | Day 2 (T2.1, T2.2) | Rewrite each query three ways: JOIN, EXISTS, window function |
| 12, 24 | subqueries, check-then-act | Day 2 (T2.3), Day 4 (T4.3) | Write NOT EXISTS / UNIQUE-based solutions from memory |
| 13, 17, 21, 23, 26 | indexes, composite design | Day 3 (T3.2, T3.3), Day 6 (T6.1) | Create `tasks_big` indexes and record before/after EXPLAIN for 3 queries |
| 5, 6, 14, 15, 16 | transactions, isolation, lost update | Day 4 (T4.1-T4.3) | Re-run Demo 2, 3 and 4 in two terminals without notes |
| 20, 22, 25 | locks, deadlocks, timeouts | Day 5 (T5.1, T5.2) | Reproduce Demo 8 and fix it with ordered locking |
| 8, 19, 25 | connection pooling | Day 5 (T5.3) | Write `db.js` + `withTransaction` from memory, then test a leak |
| 18, 23 | pagination | Day 6 (T6.3) | Implement keyset with a tie-breaker, compare EXPLAIN ANALYZE |

How to interpret the score:
- **40-50:** interview-ready on MySQL fundamentals. Spend Week 5 attention on the Node data-access and security topics;
  do the spaced revisions.
- **28-39:** good base with gaps. Fix the weak rows above within 2 days (30-minute drills), then retake only the
  missed questions.
- **below 28:** do not move to Week 5 data-access work yet. Use the catch-up plan below to repeat Days 3-5 first (they
  carry the most interview weight), then retake the test.

Also self-check qualitatively: can you **explain** each answer in plain English in under 90 seconds? If you can
write the SQL but not explain why it works, the topic is not yet interview-ready.

---

## Catch-up plan if you fall behind

Prioritize by interview value. `[ESSENTIAL]` first; skip `[ADVANCED]` items until everything else is done.

**If you are 1 day behind (about 2 hours):** do Day 7 as a catch-up day. Skip the Stage 3 mini project today (do it
on Week 5 / Day 1 together with the Node-to-MySQL material), finish the missing day's code-along and
"revision questions", and take the weekly test tomorrow morning.

**If you are 2-3 days behind (4-6 hours):** use the Minimum Viable Week 4 (priority order):

1. Day 1: T1.2 keys/constraints + NULL semantics (30 min), run Section 0.
2. Day 2: T2.1 joins + T2.2 GROUP BY/HAVING + `NOT EXISTS` (60 min).
3. Day 3: T3.2 index basics + T3.3 leftmost prefix (60 min); skip normalization detail beyond 1NF/2NF/3NF
   definitions.
4. Day 4: ACID + isolation table + Demo 2 + Demo 4 lost update (75 min).
5. Day 5: deadlock Demo 8 + prevention list + pool sizing/leaks (60 min).
6. Day 6: EXPLAIN type/key/Extra + offset vs keyset (60 min).
Total about 6 hours. Skip `[ADVANCED]` sections, extra demos (6, 7, 9, 10) and window functions on this pass.

**If you are a full week behind (Week 4 not started):** do **not** compress it into one day. Re-plan: take 4 days of
Week 5 time but keep daily 2 hours; run the Minimum Viable Week above over 3 days plus one day of mock questions, and
shift Week 5 by those days (the master plan in `00_Master_Strategy_Schedule.md` has buffer guidance). MySQL carries
much interview weight for backend roles, so it is better to be solid here than to rush MongoDB.

**Always-keep daily habit (10 minutes):** read the "Key concepts to remember" of the previous day and answer two of its
revision questions aloud.

**Cross references:** question bank `Q-SQL-01..` in `09_Question_Bank_A.md`; exercises `EX-SQL-01..` and `EX-TXN-01..`
in `11_Coding_Exercises.md`; project `Stage 3` and `Stage 5` in `12_Project_Task_API.md`; Week 5 / Day 1 notes continue
with Node-to-MySQL data access and ORM vs raw SQL.

