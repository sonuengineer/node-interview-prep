# 18 - URL Shortener Build

> **Where this fits**
>
> - Roadmap: **Days 29-35 "Build your first backend"** (URL Shortener) plus the added blocks
>   "API design and contracts", "Testing depth" and "Build it like you would ship it".
>   It also pulls in a little of Days 36-42 (Redis cache-aside, rate limiting) because a
>   shortener without a cache is a toy.
> - Design side: [Week 7 / Day 3 notes](07_Week7_System_Design.md) already explain WHAT a
>   shortener is (requirements, estimates, 5 code-generation options, 301 vs 302, scaling).
>   This file does not repeat that. It is the BUILD: requirements -> code -> tests -> Docker -> load test.
> - Prerequisites: Week 3 (Express, validation, errors), Week 4-5 (MySQL, mysql2, JWT/bcrypt),
>   Week 6 (Vitest, Supertest, Redis, idempotency, graceful shutdown).
> - Difference from the roadmap text: roadmap says PostgreSQL. The whole prep set uses MySQL 8, so
>   this build uses **MySQL 8.4** (the current 8.x LTS). The SQL ideas (unique index, keyset
>   pagination, transactions) transfer 1:1 to PostgreSQL.
> - Tags: `[ESSENTIAL]` = asked often / must understand. `[ADVANCED]` = bonus.
> - Estimated time: 12-14 hours across 10 stages (table at the end).

**Honesty note.** Everything below was built and executed on a Windows host (Node v20.20.1,
Docker Desktop). All code in this file is pulled straight from the files that were run, and
every output block is real. The host was heavily loaded by other containers while I ran the
load test, so absolute req/s numbers are low and noisy; only the hit-vs-miss ratio is meaningful
(details in Stage 10). Things I could NOT run are listed in "Not verified" at the end.

---

## Overview: how to use this file, folder tree, design decisions

### How to use this file

Is file ko "tutorial copy karo" ki tarah mat padho. Roadmap ka rule yaad rakho: **don't copy a
tutorial, build it from the requirements.** Har stage mein:

1. Pehle **Requirements** aur **Acceptance criteria** padho.
2. Khud ek baar design/code try karo (30 min), phir neeche ka code compare karo.
3. Stage ke tests ko red -> green karo.
4. **Interview concepts** ko apne words mein bolke explain karo.

Code files ek hi project ke hain. Folder `url-shortener/` ban jata hai; neeche tree hai.

### Folder tree

```text
url-shortener/
  .github/workflows/ci.yml
  db/schema.sql
  scripts/loadtest.js
  src/
    app.js                      composition root (wires everything, no hidden singletons)
    server.js                   process entry: connect, listen, graceful shutdown
    config.js                   env -> validated config (zod), fail fast
    logger.js                   tiny JSON logger
    errors.js                   AppError + helpers
    db/pool.js                  mysql2 pool
    db/migrate.js               applies db/schema.sql (idempotent)
    lib/code.js                 short-code generator + validation
    lib/urls.js                 long-URL checks + request hash
    lib/cacheEntry.js           pure cache logic (what we store, TTL, expiry)
    lib/cursor.js               pagination cursor encode/decode
    lib/lock.js                 Redis lock (SET NX PX + compare-and-delete)
    middleware/auth.js          JWT sign + requireAuth
    middleware/validate.js      zod -> req.valid
    middleware/rateLimit.js     sliding-window limiter (Redis Lua)
    middleware/requestContext.js request id + access log
    middleware/errorHandler.js  one error envelope
    modules/auth/               auth.service.js, auth.routes.js
    modules/links/              links.service.js, links.routes.js, idempotency.js
    jobs/cleanup.js             expired-link sweep + click flush timers
    jobs/cleanup-cli.js         run the sweep once (cron style)
  tests/
    globalSetup.js              Testcontainers (or CI service URLs)
    helpers.js                  build app against real MySQL/Redis
    unit/                       code, cacheEntry, urls(+cursor), linkService, errorHandler, openapi
    integration/                auth, links, idempotency, rateLimit, cleanup
  Dockerfile  .dockerignore  docker-compose.yml
  .env.example  .gitignore  openapi.yaml  README.md  vitest.config.js  package.json
```

### Design decisions (made up front, defended below)

### Short-code generation: compare, then pick one `[ESSENTIAL]`

Week 7 notes ne 5 options table mein dikhaye. Yahan teen ko implementation ki nazar se compare
karte hain, aur ek implement karte hain.

| | A. Random + unique index + retry | B. Counter (AUTO_INCREMENT) + base62 | C. Hash prefix (SHA-256, first 7 base62 chars) |
|---|---|---|---|
| How | 7 chars from CSPRNG, INSERT, retry on `ER_DUP_ENTRY` | INSERT row, `code = base62(id)` | `base62(sha256(url))[0..7]` |
| Collisions | Possible but tiny; handled by retry | Impossible (id is unique) | Possible between different URLs; need salt + retry anyway |
| Guessable? | No (62^7 = 3.5e12 space) | Yes: ids 1,2,3 -> "1","2","3". Anyone can enumerate all links | Predictable if you know the URL |
| Needs a global sequence? | No | Yes (single DB writer, or ranges per node) | No |
| Same URL twice | Two different codes | Two different codes | Same code (dedupe) |
| Two users, same URL, different expiry/owner | Fine | Fine | **Breaks**: one code cannot belong to two owners |
| Code length | Fixed 7 | Grows with id (1 char ... 7 chars after 3.5T) | Fixed 7 |
| Extra DB round trip | No | Yes (insert, then update/derive) | Maybe (lookup for dedupe) |

**Chosen: A (random + unique index + retry).** Reasons:

- Per-user links with their own expiry and owner rule out C (it only works for global dedupe).
- B leaks volume and allows enumeration of private links; fixing that (a bijective scramble of
  the id, or a Feistel network) adds code we would then have to test and explain.
- A needs nothing except a UNIQUE index, and the index is the real guarantee: even two app
  instances racing cannot create the same code, one of them just gets `ER_DUP_ENTRY` and retries.

Collision math (n = links already stored, one new random code): P(collision) = n / 62^7.
At 1 million links: 0.00003 percent. At 1 billion: 0.028 percent. Expected extra INSERTs per
create at 1 billion links is 0.0003. We cap retries at 5 and return 503 after that, which
(if it ever happens) is a signal that the space is filling and the length should grow to 8.

Details that matter: `crypto.randomInt` (CSPRNG, no modulo bias, unlike `Math.random()`),
`ascii_bin` collation (codes are case-sensitive), a reserved-word list so a random code can
never equal `healthz`.

### 301 vs 302 `[ESSENTIAL]`

- **301 Moved Permanently**: browsers and CDNs may cache it forever. Second click never reaches
  us: no click count, and after delete/expiry the browser still redirects.
- **302 Found**: not cached by default. Every click hits us, so stats, expiry and delete work.

**Chosen: 302**, with `Cache-Control: private, max-age=0`. The price is more traffic on our
side; that is exactly what the Redis cache is for. (307 is the method-preserving cousin of 302;
for GET links 302 is fine and is what most shorteners use.)

### Expiry: lazy check + sweep `[ESSENTIAL]`

- **Lazy**: every redirect compares `expires_at` with now, so an expired link is never served,
  even if no cleanup has run. This is the correctness mechanism.
- **Sweep job**: physically deletes links expired for more than `EXPIRED_GRACE_DAYS`, in batches
  of 1000, so storage and indexes do not grow forever. This is the housekeeping mechanism.
- Cache TTL is capped at the seconds-until-expiry, and the cached entry carries the expiry
  timestamp, so a cache hit also returns 410 on time.

Kyun dono? Sirf sweep rakhoge to cleanup se pehle expired link chalta rahega. Sirf lazy rakhoge
to table kabhi saaf nahi hogi.

### Rate limiter: sliding-window log in Redis (Lua) `[ESSENTIAL]`

Compared with token bucket and fixed window:

| Algorithm | Memory per key | Burst behaviour | Accuracy | Notes |
|-----------|----------------|-----------------|----------|-------|
| Fixed window counter | 1 counter | Up to 2x limit around a window boundary | Poor at edges | Simplest: `INCR` + `EXPIRE` |
| Sliding window log (chosen) | 1 entry per allowed request (ZSET) | Exact: never more than `max` in ANY window | Exact | Memory is O(max) per key |
| Sliding window counter | 2 counters | Approximate | Good | Cheap, slightly fuzzy |
| Token bucket | 2 numbers (tokens, last refill) | Allows controlled bursts, smooth refill | Good | Best for "average rate + burst" |

Chosen the log because limits here are small (30 creates/min, 10 logins/min, 600 redirects/min)
so memory is trivial, behaviour is exactly explainable, and it makes a nice atomic Lua example.
At 100k requests/min per key I would switch to token bucket (README "what I would change").

### Other decisions

- **Auth**: JWT (HS256, 1 hour) in `Authorization: Bearer`. No refresh token in this build.
- **Idempotent create**: `Idempotency-Key` header; key row and link row inserted in ONE MySQL
  transaction (Stage 3).
- **Pagination**: keyset (cursor) on `id`, not OFFSET.
- **Click counts**: Redis `HINCRBY` on the hot path, batch flush to MySQL every 10 seconds.
- **Failure policy**: Redis down => redirects fall back to MySQL, limiter fails open.
- **Others' links return 404, not 403**: do not confirm that a code exists.

---

## Stage 1 - Requirements, project skeleton, config and schema

**Learning objectives**

- Requirements ko measurable acceptance criteria mein badalna.
- Fail-fast config (zod), pool setup, idempotent schema.
- MySQL schema decisions: `ascii_bin`, unique index, FK, composite index for pagination.

### Requirements

Functional:

1. A user can register and log in.
2. A logged-in user can create a short link for an http(s) URL, optionally with an expiry time.
3. Anyone can open `GET /:code` and be redirected; unknown code -> 404; expired -> 410.
4. A user can list only their own links (paginated), see click stats, and delete a link.
5. Creating a link can be retried safely (idempotent).

Non-functional:

1. Redirect p99 low: Redis cache-aside in front of MySQL.
2. Abuse protection: rate limits on create, login and redirect.
3. One error format everywhere; no stack traces or SQL in responses.
4. Runs with one command (`docker compose up`), tests run against real MySQL/Redis.
5. Config only from environment; secrets never in git.

### Acceptance criteria

- [ ] `docker compose up --build` gives a healthy app on port 3018.
- [ ] Missing/short `JWT_SECRET` makes the process crash at startup with a clear message.
- [ ] `schema.sql` can be applied twice without error.
- [ ] `links.code` is case-sensitive and unique.

### Interview concepts

`[ESSENTIAL]` 12-factor config, fail fast, unique index as the uniqueness guarantee, collation,
connection pool sizing and `queueLimit`, UTC everywhere, FK `ON DELETE CASCADE`.

### Files

**package.json**

*File: `package.json`*

````json
{
  "name": "url-shortener",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "URL shortener: Express 5, MySQL 8, Redis cache-aside, JWT, rate limiting",
  "engines": {
    "node": ">=20.12"
  },
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node src/server.js",
    "migrate": "node src/db/migrate.js",
    "cleanup": "node src/jobs/cleanup-cli.js",
    "test": "vitest run",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "loadtest": "node scripts/loadtest.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "express": "^5.3.0",
    "ioredis": "^5.11.1",
    "jsonwebtoken": "^9.0.3",
    "mysql2": "^3.24.6",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@apidevtools/swagger-parser": "^13.0.0",
    "@testcontainers/mysql": "^11.14.0",
    "@testcontainers/redis": "^11.14.0",
    "autocannon": "^8.0.0",
    "supertest": "^7.3.1",
    "testcontainers": "^11.14.0",
    "vitest": "^3.2.7",
    "yaml": "^2.9.1"
  }
}
````

Notes: `"type": "module"` (ESM). `engines` is `>=20.12` because `node --env-file` needs it.
Dev dependencies of note: `vitest@3`, `supertest`, `testcontainers@11` (version 12 requires
Node >= 22.22; on Node 20 it crashes with `Cannot read properties of undefined (reading 'bind')`
inside `undici`, which is exactly what happened to me on this host).

**db/schema.sql**

*File: `db/schema.sql`*

````sql
-- MySQL 8.4 / 8.x. Idempotent: safe to run on every deploy.
-- Codes are case-sensitive, so they use a binary ascii collation.

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(254)    NOT NULL,
  password_hash VARCHAR(100)    NOT NULL,
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS links (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code       VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  long_url   VARCHAR(2048)   NOT NULL,
  owner_id   BIGINT UNSIGNED NOT NULL,
  clicks     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME(3)     NULL,
  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_links_code (code),
  KEY idx_links_owner_id (owner_id, id),
  KEY idx_links_expires_at (expires_at),
  CONSTRAINT fk_links_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Idempotency-Key storage. The row is inserted in the SAME transaction as the
-- link, so "key exists" always means "link was created and response stored".
CREATE TABLE IF NOT EXISTS idempotency_keys (
  user_id       BIGINT UNSIGNED NOT NULL,
  idem_key      VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_hash  CHAR(64) CHARACTER SET ascii NOT NULL,
  status_code   SMALLINT UNSIGNED NULL,
  response_body JSON NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, idem_key),
  KEY idx_idem_created_at (created_at),
  CONSTRAINT fk_idem_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
````

Dhyan do:

- `code VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin`: default collation is case-insensitive,
  so `aZ3kP9x` and `AZ3KP9X` would be the same link.
- `idx_links_owner_id (owner_id, id)`: the exact index the list query needs (`WHERE owner_id = ?
  AND id < ? ORDER BY id DESC LIMIT n` is an index range scan, no filesort).
- `DATETIME(3)` + `timezone: 'Z'` in the pool: we store UTC and never depend on the server timezone.
- `idempotency_keys` primary key `(user_id, idem_key)`: the key is scoped per user.

**.gitignore** and **.env.example**

*File: `.gitignore`*

````text
node_modules/
.env
coverage/
*.log
````

*File: `.env.example`*

````text
# Copy to .env and edit. Never commit .env.
NODE_ENV=development
PORT=3000
# Public base URL used to build shortUrl in responses
BASE_URL=http://localhost:3000

# mysql://user:password@host:port/database
DATABASE_URL=mysql://app:app_pw@127.0.0.1:33067/shortener
REDIS_URL=redis://127.0.0.1:63794
DB_POOL_SIZE=10

# At least 32 characters. Generate one:  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=change-me-change-me-change-me-change-me
JWT_EXPIRES_IN_SECONDS=3600
BCRYPT_COST=10

# Redirect cache
CACHE_ENABLED=true
CACHE_TTL_SECONDS=3600
NEGATIVE_CACHE_TTL_SECONDS=60

# Rate limits: max requests per window. Create is per user, auth and redirect are per IP.
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_CREATE_MAX=30
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_REDIRECT_MAX=600

# Set to the number of reverse proxies in front of the app (e.g. 1 behind nginx) so req.ip is the client's
TRUST_PROXY=false

# Background jobs
JOBS_ENABLED=true
CLEANUP_INTERVAL_SECONDS=300
CLICK_FLUSH_INTERVAL_SECONDS=10
EXPIRED_GRACE_DAYS=7

LOG_LEVEL=info
````

**src/config.js**

*File: `src/config.js`*

````js
import { z } from 'zod';

const bool = (def) =>
  z
    .enum(['true', 'false'])
    .default(def)
    .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).default(3000),
  BASE_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(3600),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(10),

  CACHE_ENABLED: bool('true'),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  NEGATIVE_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),

  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_CREATE_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_REDIRECT_MAX: z.coerce.number().int().positive().default(600),

  // 'false' | 'true' | number of proxy hops (e.g. 1 behind nginx)
  TRUST_PROXY: z.string().default('false'),

  JOBS_ENABLED: bool('true'),
  CLEANUP_INTERVAL_SECONDS: z.coerce.number().int().positive().default(300),
  CLICK_FLUSH_INTERVAL_SECONDS: z.coerce.number().int().positive().default(10),
  EXPIRED_GRACE_DAYS: z.coerce.number().int().min(0).default(7),

  LOG_LEVEL: z.enum(['silent', 'info', 'error']).default('info'),
});

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  return parsed.data;
}
````

**src/logger.js**, **src/errors.js**

*File: `src/logger.js`*

````js
// Minimal JSON logger. In a real service use pino; the interface is the same.
export function createLogger(level = 'info') {
  const write = (lvl, msg, extra) => {
    if (level === 'silent') return;
    if (level === 'error' && lvl !== 'error') return;
    const line = JSON.stringify({ level: lvl, time: new Date().toISOString(), msg, ...extra });
    (lvl === 'error' ? process.stderr : process.stdout).write(line + '\n');
  };
  return {
    info: (msg, extra) => write('info', msg, extra),
    error: (msg, extra) => write('error', msg, extra),
  };
}
````

*File: `src/errors.js`*

````js
// One error type for every failure we EXPECT. Anything else is a bug -> 500.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code; // stable, machine-readable
    this.details = details;
  }
}

export const badRequest = (code, msg, details) => new AppError(400, code, msg, details);
export const unauthorized = (msg = 'Authentication required') =>
  new AppError(401, 'UNAUTHENTICATED', msg);
export const notFound = (msg = 'Resource not found') => new AppError(404, 'NOT_FOUND', msg);
export const conflict = (code, msg) => new AppError(409, code, msg);
export const gone = (msg = 'This link has expired') => new AppError(410, 'LINK_EXPIRED', msg);
````

**src/db/pool.js** and **src/db/migrate.js**

*File: `src/db/pool.js`*

````js
import mysql from 'mysql2/promise';

export function createPool(config) {
  return mysql.createPool({
    uri: config.DATABASE_URL,
    connectionLimit: config.DB_POOL_SIZE,
    waitForConnections: true,
    queueLimit: 100, // fail fast instead of queueing forever
    timezone: 'Z', // Date <-> DATETIME as UTC, always
    charset: 'utf8mb4',
  });
}
````

*File: `src/db/migrate.js`*

````js
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { loadConfig } from '../config.js';

const SCHEMA = fileURLToPath(new URL('../../db/schema.sql', import.meta.url));

export async function migrate(databaseUrl) {
  const sql = await readFile(SCHEMA, 'utf8');
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });
  try {
    await conn.query(sql);
  } finally {
    await conn.end();
  }
}

// `node src/db/migrate.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  await migrate(config.DATABASE_URL);
  console.log('migrate: schema is up to date');
}
````

`queueLimit: 100`: agar pool ke saare 10 connections busy hain to 100 requests queue mein rukengi,
uske baad error. Unlimited queue (default 0) ka matlab hai overload mein memory aur latency dono
badhte jate hain. Fail fast better hai.

### How to test this stage

```bash
npm install
cp .env.example .env
JWT_SECRET=short node --env-file=.env src/server.js
```

Real output (stack trace trimmed):

```text
Error: Invalid environment configuration:
  JWT_SECRET: JWT_SECRET must be at least 32 characters
    at loadConfig (src/config.js:45:11)
    at src/server.js:8:16
```

(A variable set in the real shell wins over the same variable in `--env-file`, so the short
secret was used.) The process dies before opening any port: that is "fail fast".

**Key concepts to remember**

- Config is parsed once, validated, and passed down (no `process.env` scattered in code).
- The database, not the application, enforces uniqueness.
- Store time in UTC; convert at the edges.

**Revision questions**

1. Why `ascii_bin` for `code` but `utf8mb4` for `long_url`?
2. What happens to pending requests when the pool is exhausted and `queueLimit` is 0 vs 100?
3. Why do we validate env at startup instead of when first used?
4. Why is the FK `ON DELETE CASCADE` reasonable for `links.owner_id`? When would it be dangerous?

**Practical task**: add a `custom_alias` column (nullable, same collation, unique) and decide how
it interacts with the reserved-word list. Write the migration so it is safe to run twice.

**Self-check**

- [ ] I can explain every column of `links` and why its type was chosen.
- [ ] I can explain why config validation lives in one file.

---

## Stage 2 - Authentication and per-user links

**Learning objectives**

- Register/login with bcrypt, issue a JWT, protect routes.
- Avoid user enumeration (same error, same timing).
- Understand what JWT does and does not give you.

### Requirements

- `POST /v1/auth/register`, `POST /v1/auth/login`.
- Passwords hashed with bcrypt; email unique case-insensitively.
- A bearer token protects `/v1/links/*`. Ownership is enforced in SQL (`WHERE owner_id = ?`).

### Acceptance criteria

- [ ] Register returns 201 and never echoes the password or hash.
- [ ] Wrong password and unknown email produce an IDENTICAL 401 body.
- [ ] Duplicate email (any case) is 409 `EMAIL_TAKEN`.
- [ ] Expired token, token signed with another key, and `alg=none` token are all 401.
- [ ] Password longer than 72 bytes is rejected (bcrypt ignores everything after 72 bytes).

### Interview concepts

`[ESSENTIAL]` bcrypt cost factor, salt inside the hash, timing attacks and dummy-hash compare,
pinning the JWT algorithm, access token expiry, authn vs authz, 401 vs 403 vs 404 for ownership.
`[ADVANCED]` refresh token rotation, token revocation list, JWT vs server sessions.

### Files

**src/middleware/validate.js**

*File: `src/middleware/validate.js`*

````js
// validate(schema, 'body' | 'query' | 'params')
// Parsed (and coerced, defaulted, stripped) data goes to req.valid[source].
// Express 5 made req.query a read-only getter, so we never write back to it.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error); // errorHandler turns ZodError into 400
  req.valid = { ...req.valid, [source]: result.data };
  return next();
};
````

Express 5 note: `req.query` is now a getter. Express 4 code that did `req.query = parsed` silently
breaks in 5. Isliye parsed data `req.valid.query` mein jata hai.

**src/middleware/auth.js**

*File: `src/middleware/auth.js`*

````js
import jwt from 'jsonwebtoken';
import { unauthorized } from '../errors.js';

export function signToken(config, userId) {
  return jwt.sign({}, config.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(userId),
    expiresIn: config.JWT_EXPIRES_IN_SECONDS,
  });
}

export const requireAuth = (config) => (req, res, next) => {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());
  try {
    // Pin the algorithm: never let the token choose how it is verified.
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.sub };
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
};
````

`algorithms: ['HS256']` pin karna zaroori hai. Bina pin ke, library token ke header ke hisaab se
algorithm chunti thi (purane versions mein `alg: none` attack). Test: `alg=none tokens` in `auth.test.js`.

**src/modules/auth/auth.service.js** and **auth.routes.js**

*File: `src/modules/auth/auth.service.js`*

````js
import bcrypt from 'bcryptjs';
import { conflict, AppError } from '../../errors.js';
import { signToken } from '../../middleware/auth.js';

export function createAuthService({ pool, config }) {
  // Compared against when the email does not exist, so "unknown email" and
  // "wrong password" cost the same time (no user enumeration by timing).
  const dummyHash = bcrypt.hashSync('not-a-real-password', config.BCRYPT_COST);

  const tokenResponse = (userId) => ({
    accessToken: signToken(config, userId),
    tokenType: 'Bearer',
    expiresIn: config.JWT_EXPIRES_IN_SECONDS,
  });

  return {
    async register({ email, password }) {
      const hash = await bcrypt.hash(password, config.BCRYPT_COST);
      try {
        const [result] = await pool.execute(
          'INSERT INTO users (email, password_hash) VALUES (?, ?)',
          [email, hash],
        );
        return { id: String(result.insertId), email };
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw conflict('EMAIL_TAKEN', 'Email is already registered');
        throw err;
      }
    },

    async login({ email, password }) {
      const [rows] = await pool.execute(
        'SELECT id, password_hash FROM users WHERE email = ?',
        [email],
      );
      const user = rows[0];
      const ok = await bcrypt.compare(password, user ? user.password_hash : dummyHash);
      if (!user || !ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is wrong');
      return tokenResponse(user.id);
    },
  };
}
````

*File: `src/modules/auth/auth.routes.js`*

````js
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';

const credentials = z.object({
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  // bcrypt only uses the first 72 BYTES, so cap the input there.
  password: z.string().min(8).max(72),
});

export function createAuthRouter({ auth, authLimiter }) {
  const router = Router();

  router.post('/register', authLimiter, validate(credentials), async (req, res) => {
    const user = await auth.register(req.valid.body);
    res.status(201).json(user);
  });

  router.post('/login', authLimiter, validate(credentials), async (req, res) => {
    res.json(await auth.login(req.valid.body));
  });

  return router;
}
````

Why `bcryptjs` and not `bcrypt`? `bcryptjs` is pure JavaScript, so the Docker build needs no
compiler or native addon, which keeps the Alpine image simple. It is slower than native `bcrypt` (I did not benchmark it); in a hot-login service I would use native or argon2.

### How to test this stage

The integration tests in Stage 8 (`tests/integration/auth.test.js`) cover every acceptance
criterion. Manual (after Stage 9 compose is up), real output:

```text
$ curl -s -X POST $H/v1/auth/register -H 'content-type: application/json' -d '{"email":"Demo@Example.com","password":"correct-horse-battery"}'
{"id":"1","email":"demo@example.com"}
```

**Key concepts to remember**

- JWT is a signed claim, not encryption. Anyone can read the payload.
- Same error + same timing for "unknown email" and "wrong password".
- Ownership check belongs in the query (`WHERE code = ? AND owner_id = ?`), not in an `if` after loading.

**Revision questions**

1. Why do we compare against `dummyHash` when the user does not exist?
2. What does `alg: none` do and what in our code stops it?
3. Our token lives 1 hour and we cannot revoke it. How would you add logout that actually works?
4. Why 404 instead of 403 when user B asks for user A's link?
5. Why cap passwords at 72 characters?

**Practical task**: add `POST /v1/auth/refresh` with a rotating refresh token stored hashed in MySQL.
Write the failing integration test first (reuse of an old refresh token must revoke the family).

**Self-check**

- [ ] I can draw the register -> login -> authenticated request flow.
- [ ] I can explain bcrypt cost 10 vs 12 in terms of login latency vs attacker cost.

---

## Stage 3 - Create links: validation, code generation, idempotency

**Learning objectives**

- Allocate unique short codes with a unique index and retry (and know when it breaks).
- Validate a user-supplied URL safely (scheme allow-list, no embedded credentials, no self-links).
- Make `POST` safe to retry with `Idempotency-Key` using one MySQL transaction.

### Requirements

- `POST /v1/links` with `{ longUrl, expiresAt? }` returns 201 with `code`, `shortUrl`, `Location` header.
- Only `http:` and `https:` URLs, at most 2048 chars, no `user:pass@`, not pointing at our own host.
- `expiresAt` (ISO-8601) must be in the future. Unknown body fields are rejected.
- With `Idempotency-Key`: same key + same body returns the SAME response, no second link.
  Same key + different body returns 422. Concurrent duplicates create exactly one link.

### Acceptance criteria

- [ ] 8 different invalid bodies each return 400 `VALIDATION_FAILED` (see links.test.js).
- [ ] SQL-looking input is stored verbatim and the `links` table survives.
- [ ] 10 parallel requests with one key create 1 row and return 10 identical 201 bodies (9 flagged `Idempotent-Replayed: true`).
- [ ] After 5 collisions in a row the API returns 503 instead of looping forever (unit test).
- [ ] A reserved code (`healthz`) is never issued (unit test).

### Interview concepts

`[ESSENTIAL]` unique index as the source of truth, retry on `ER_DUP_ENTRY`, CSPRNG vs `Math.random`,
open redirect and scheme allow-list (`javascript:` URLs), idempotency key semantics (scope, request
fingerprint, replay), transaction + primary-key lock to serialise duplicates.
`[ADVANCED]` why a Redis `SETNX` idempotency lock is weaker than a DB transaction (key and effect
cannot commit atomically), gap between "key stored" and "effect done" on crash.

### Files

**src/lib/code.js**, **src/lib/urls.js**

*File: `src/lib/code.js`*

````js
import { randomInt } from 'node:crypto';

export const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const CODE_LENGTH = 7;
export const CODE_REGEX = /^[0-9A-Za-z]{7}$/;

// Codes that would collide with our own routes. Never hand these out.
const RESERVED = new Set(['healthz', 'readyz', 'metrics']);

// randomInt uses a CSPRNG and rejects modulo bias, so every character is
// uniformly likely: 62^7 = ~3.5 trillion possible codes.
export function randomCode(length = CODE_LENGTH) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function isReserved(code) {
  return RESERVED.has(code.toLowerCase());
}

export function isValidCode(code) {
  return CODE_REGEX.test(code);
}
````

*File: `src/lib/urls.js`*

````js
import { createHash } from 'node:crypto';

// Stable hash of the validated create-request, used by Idempotency-Key.
export function hashRequest(payload) {
  const canonical = JSON.stringify({
    longUrl: payload.longUrl,
    expiresAt: payload.expiresAt ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

// Returns an error string, or null if the URL is acceptable.
export function checkLongUrl(input, baseUrl) {
  let u;
  try {
    u = new URL(input);
  } catch {
    return 'Not a valid URL';
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return 'Only http and https URLs are allowed';
  }
  if (u.username || u.password) return 'URLs with embedded credentials are not allowed';
  // A short link that points at the shortener itself is a redirect-loop / abuse vector.
  if (u.host === new URL(baseUrl).host) return 'Cannot shorten a link that points to this service';
  return null;
}
````

**src/modules/links/idempotency.js**

*File: `src/modules/links/idempotency.js`*

````js
import { AppError } from '../../errors.js';

// Idempotent POST. The idempotency row and the work (insert link) share ONE
// transaction:
//   - a concurrent request with the same key blocks on the primary-key lock
//     until we commit, then sees the stored response (no "in progress" state)
//   - a crash rolls both back, so a retry simply runs again (no stuck key)
//
// work(conn) must return { status, body }.
export function createIdempotentRunner(pool) {
  async function loadStored(userId, key, requestHash) {
    const [rows] = await pool.execute(
      'SELECT request_hash, status_code, response_body FROM idempotency_keys WHERE user_id = ? AND idem_key = ?',
      [userId, key],
    );
    const row = rows[0];
    if (!row) return null;
    if (row.request_hash !== requestHash) {
      throw new AppError(
        422,
        'IDEMPOTENCY_KEY_REUSED',
        'This Idempotency-Key was already used with a different request body',
      );
    }
    const body = typeof row.response_body === 'string' ? JSON.parse(row.response_body) : row.response_body;
    return { status: row.status_code, body, replayed: true };
  }

  return async function run({ userId, key, requestHash }, work) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      try {
        await conn.execute(
          'INSERT INTO idempotency_keys (user_id, idem_key, request_hash) VALUES (?, ?, ?)',
          [userId, key, requestHash],
        );
      } catch (err) {
        await conn.rollback();
        if (err.code !== 'ER_DUP_ENTRY') throw err;
        const stored = await loadStored(userId, key, requestHash);
        if (stored) return stored;
        throw err; // row vanished between the two statements (cleanup job): let the client retry
      }

      const result = await work(conn);
      await conn.execute(
        'UPDATE idempotency_keys SET status_code = ?, response_body = ? WHERE user_id = ? AND idem_key = ?',
        [result.status, JSON.stringify(result.body), userId, key],
      );
      await conn.commit();
      return { ...result, replayed: false };
    } catch (err) {
      try { await conn.rollback(); } catch { /* connection may already be gone */ }
      throw err;
    } finally {
      conn.release();
    }
  };
}
````

Yeh sabse important file hai is stage ki. Flow:

1. `BEGIN`; `INSERT INTO idempotency_keys (user_id, idem_key, request_hash)`.
2. Agar INSERT chal gaya: hum "pehle" hain. Link banao (same transaction), response save karo, `COMMIT`.
3. Agar `ER_DUP_ENTRY`: koi aur ne wahi key use ki. Agar woh abhi transaction mein hai to hamari INSERT
   primary-key lock par **block** hoti hai jab tak woh commit/rollback na kare. Commit hua to hum stored
   response replay karte hain; rollback hua to hamari INSERT hi succeed ho jati hai.
4. Hash alag hai to 422: client ne key galat reuse ki.

Result: koi "in progress" state nahi, koi stuck key nahi, aur crash par dono rows saath rollback.
Cost: transaction chhota rehna chahiye (hum sirf do INSERT/SELECT karte hain, koi network call nahi).

**src/modules/links/links.service.js** (create + the rest of the service; later stages explain their parts)

*File: `src/modules/links/links.service.js`*

````js
import { randomCode, isReserved } from '../../lib/code.js';
import { toEntry, interpretEntry, ttlFor } from '../../lib/cacheEntry.js';
import { encodeCursor, decodeCursor } from '../../lib/cursor.js';
import { withLock } from '../../lib/lock.js';
import { AppError, notFound } from '../../errors.js';

const MAX_CODE_ATTEMPTS = 5;
const cacheKey = (code) => `link:${code}`;

export function createLinkService({ pool, redis, config, logger, generateCode = randomCode }) {
  const toDto = (row, extra = {}) => ({
    code: row.code,
    shortUrl: `${config.BASE_URL}/${row.code}`,
    longUrl: row.long_url,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    ...extra,
  });

  async function cacheSet(code, entry) {
    if (!config.CACHE_ENABLED) return;
    const ttl = ttlFor(entry, Date.now(), {
      ttlSeconds: config.CACHE_TTL_SECONDS,
      negativeTtlSeconds: config.NEGATIVE_CACHE_TTL_SECONDS,
    });
    try {
      await redis.set(cacheKey(code), JSON.stringify(entry), 'EX', ttl);
    } catch (e) {
      logger.error('cache_write_failed', { error: e.message });
    }
  }

  return {
    // `conn` is either the pool or a transaction connection (idempotent create).
    async create({ ownerId, longUrl, expiresAt }, conn = pool) {
      for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
        const code = generateCode();
        if (isReserved(code)) continue;
        try {
          await conn.execute(
            'INSERT INTO links (code, long_url, owner_id, expires_at) VALUES (?, ?, ?, ?)',
            [code, longUrl, ownerId, expiresAt ? new Date(expiresAt) : null],
          );
          const [rows] = await conn.execute('SELECT * FROM links WHERE code = ?', [code]);
          return toDto(rows[0], { clicks: 0 });
        } catch (err) {
          // Unique index on `code` is the ONLY thing that guarantees uniqueness.
          // Duplicate -> unlucky collision -> pick another code.
          if (err.code === 'ER_DUP_ENTRY') {
            logger.info('code_collision', { attempt });
            continue;
          }
          throw err;
        }
      }
      throw new AppError(503, 'CODE_ALLOCATION_FAILED', 'Could not allocate a short code, retry');
    },

    // Called AFTER the creating transaction commits.
    async forgetNegative(code) {
      if (!config.CACHE_ENABLED) return;
      try { await redis.del(cacheKey(code)); } catch { /* best effort */ }
    },

    // Hot path. Cache-aside: Redis first, MySQL on miss, then populate Redis.
    async resolve(code) {
      if (config.CACHE_ENABLED) {
        try {
          const raw = await redis.get(cacheKey(code));
          if (raw) return { ...interpretEntry(JSON.parse(raw), Date.now()), cache: 'HIT' };
        } catch (e) {
          logger.error('cache_read_failed', { error: e.message }); // fall through to MySQL
        }
      }
      const [rows] = await pool.execute(
        'SELECT long_url, expires_at FROM links WHERE code = ?',
        [code],
      );
      const entry = toEntry(rows[0]);
      await cacheSet(code, entry);
      return { ...interpretEntry(entry, Date.now()), cache: config.CACHE_ENABLED ? 'MISS' : 'BYPASS' };
    },

    recordClick(code) {
      // Fire and forget: the redirect must never wait for analytics.
      redis.hincrby('clicks:pending', code, 1).catch(() => {});
    },

    async list({ ownerId, limit, cursor }) {
      const params = [ownerId];
      let where = 'owner_id = ?';
      if (cursor) {
        where += ' AND id < ?';
        params.push(decodeCursor(cursor));
      }
      // query() not execute(): MySQL prepared statements reject a bound LIMIT parameter.
      // query() escapes client-side, still parameterised, no string concatenation of user input.
      const [rows] = await pool.query(
        `SELECT * FROM links WHERE ${where} ORDER BY id DESC LIMIT ?`,
        [...params, limit + 1],
      );
      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      return {
        data: page.map((r) => toDto(r, { clicks: Number(r.clicks) })),
        page: { limit, nextCursor: hasMore ? encodeCursor(page[page.length - 1].id) : null },
      };
    },

    async stats(ownerId, code) {
      const [rows] = await pool.execute('SELECT * FROM links WHERE code = ? AND owner_id = ?', [code, ownerId]);
      // 404, not 403, for someone else's link: do not confirm it exists.
      if (!rows[0]) throw notFound('Link not found');
      let pending = 0;
      try {
        const [a, b] = await Promise.all([
          redis.hget('clicks:pending', code),
          redis.hget('clicks:flushing', code),
        ]);
        pending = Number(a ?? 0) + Number(b ?? 0);
      } catch { /* stats are best effort */ }
      const row = rows[0];
      return {
        code,
        totalClicks: Number(row.clicks) + pending,
        flushedClicks: Number(row.clicks),
        expired: Boolean(row.expires_at && new Date(row.expires_at) <= new Date()),
        expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
        createdAt: new Date(row.created_at).toISOString(),
      };
    },

    async remove(ownerId, code) {
      const [result] = await pool.execute('DELETE FROM links WHERE code = ? AND owner_id = ?', [code, ownerId]);
      if (result.affectedRows === 0) throw notFound('Link not found');
      // Write a negative entry instead of DEL so the very next redirect is a cheap 404.
      await cacheSet(code, { m: 1 });
    },

    // Move pending counters from Redis into MySQL. Safe to run from many instances:
    // a Redis lock ensures one flusher at a time.
    async flushClicks() {
      const res = await withLock(redis, 'lock:flush-clicks', 30_000, async () => {
        if (!(await redis.exists('clicks:flushing'))) {
          try {
            await redis.rename('clicks:pending', 'clicks:flushing'); // atomic snapshot
          } catch {
            return 0; // nothing pending
          }
        }
        const counts = await redis.hgetall('clicks:flushing');
        let total = 0;
        for (const [code, n] of Object.entries(counts)) {
          await pool.execute('UPDATE links SET clicks = clicks + ? WHERE code = ?', [Number(n), code]);
          await redis.hdel('clicks:flushing', code);
          total += Number(n);
        }
        return total;
      });
      return res.ran ? res.value : 0;
    },
  };
}
````

`create()` accepts `conn` so it can run inside the idempotency transaction. Note that a duplicate-key
error inside a transaction only fails that one statement in InnoDB; the transaction stays open, so
the retry loop is safe there.

`list()` uses `pool.query` and not `pool.execute`: with prepared statements MySQL 8.0.22+ rejects a
JS number bound to `LIMIT ?` (`Incorrect arguments to mysqld_stmt_execute`). `query()` escapes values
client-side; it is still parameterised, never string-concatenated.

**src/modules/links/links.routes.js**

*File: `src/modules/links/links.routes.js`*

````js
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { checkLongUrl, hashRequest } from '../../lib/urls.js';
import { isValidCode } from '../../lib/code.js';
import { notFound, gone, badRequest } from '../../errors.js';

export function createLinksRouter({ links, runIdempotent, config, requireAuth, createLimiter }) {
  const createBody = z.object({
    longUrl: z.string().max(2048).superRefine((val, ctx) => {
      const problem = checkLongUrl(val, config.BASE_URL);
      if (problem) ctx.addIssue({ code: 'custom', message: problem });
    }),
    expiresAt: z.iso.datetime().optional().refine(
      (v) => v === undefined || new Date(v) > new Date(),
      'expiresAt must be in the future',
    ),
  }).strict(); // unknown fields -> 400 instead of silently ignored

  const listQuery = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().max(64).optional(),
  });

  const codeParam = z.object({
    code: z.string().refine(isValidCode, 'Invalid code'),
  });

  const router = Router();
  router.use(requireAuth);

  router.post('/', createLimiter, validate(createBody), async (req, res) => {
    const input = { ownerId: req.user.id, ...req.valid.body };
    const key = req.get('idempotency-key');

    if (key === undefined) {
      const link = await links.create(input);
      return res.status(201).location(link.shortUrl).json(link);
    }
    if (!/^[\x21-\x7e]{8,128}$/.test(key)) {
      throw badRequest('INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 8-128 printable ASCII characters');
    }
    const result = await runIdempotent(
      { userId: req.user.id, key, requestHash: hashRequest(req.valid.body) },
      async (conn) => {
        const link = await links.create(input, conn);
        return { status: 201, body: link };
      },
    );
    if (result.replayed) res.set('Idempotent-Replayed', 'true');
    else await links.forgetNegative(result.body.code);
    return res.status(result.status).location(result.body.shortUrl).json(result.body);
  });

  router.get('/', validate(listQuery, 'query'), async (req, res) => {
    res.json(await links.list({ ownerId: req.user.id, ...req.valid.query }));
  });

  router.get('/:code/stats', validate(codeParam, 'params'), async (req, res) => {
    res.json(await links.stats(req.user.id, req.valid.params.code));
  });

  router.delete('/:code', validate(codeParam, 'params'), async (req, res) => {
    await links.remove(req.user.id, req.valid.params.code);
    res.status(204).end();
  });

  return router;
}

// Public, unauthenticated, the hot path.
export function createRedirectRouter({ links, redirectLimiter }) {
  const router = Router();
  router.get('/:code', redirectLimiter, async (req, res) => {
    const { code } = req.params;
    if (!isValidCode(code)) throw notFound('Link not found'); // cheap reject, no cache or DB touch

    const result = await links.resolve(code);
    res.set('X-Cache', result.cache);
    if (result.status === 'missing') throw notFound('Link not found');
    if (result.status === 'gone') throw gone();

    if (req.method === 'GET') links.recordClick(code);
    // 302, not 301: browsers must come back to us so clicks are counted and
    // deletes/expiry take effect immediately.
    res.set('Cache-Control', 'private, max-age=0');
    res.redirect(302, result.longUrl);
  });
  return router;
}
````

### How to test this stage

Unit: `tests/unit/code.test.js`, `urls.test.js`, `linkService.test.js` (Stage 8). Integration:
`links.test.js` (create block) and `idempotency.test.js`. Manual, real output:

```text
--- create (with Idempotency-Key) twice
HTTP/1.1 201 Created
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
Location: http://localhost:3018/vXjPgQs
{"code":"vXjPgQs","shortUrl":"http://localhost:3018/vXjPgQs","longUrl":"https://nodejs.org/en/learn/getting-started/introduction-to-nodejs","expiresAt":null,"createdAt":"2026-10-20T07:04:31.064Z","clicks":0}
HTTP/1.1 201 Created
Idempotent-Replayed: true
Location: http://localhost:3018/vXjPgQs
{"code":"vXjPgQs","clicks":0,"longUrl":"https://nodejs.org/en/learn/getting-started/introduction-to-nodejs","shortUrl":"http://localhost:3018/vXjPgQs","createdAt":"2026-10-20T07:04:31.064Z","expiresAt":null}
code=vXjPgQs

--- same key, different body
{"error":{"code":"IDEMPOTENCY_KEY_REUSED","message":"This Idempotency-Key was already used with a different request body","requestId":"b93c22ee-912c-46bb-965f-f5aa5a5a3c79"}}
```

Notice the replay: same code, same body, plus `Idempotent-Replayed: true`. (The replayed JSON has
its keys in a different ORDER: MySQL's `JSON` column type normalises key order. Same data, which is
fine for JSON clients, but it is a good reminder that you replay a stored document, not the original bytes.)

**Key concepts to remember**

- Uniqueness = unique index. Retry = how you cope with the rare loss.
- Validate with an allow-list (`http`, `https`), never a block-list.
- Idempotency key + effect in ONE transaction removes the "crashed in the middle" problem.

**Revision questions**

1. What is the probability that one random 7 char code collides when the table has 1 billion rows?
2. Why does `Math.random()` make a bad code generator even if collisions were not a concern?
3. Walk through two simultaneous requests with the same Idempotency-Key. Who waits on what?
4. Why is the request hash part of the stored key row?
5. `javascript:alert(1)` as a long URL: what is the attack and where do we stop it?

**Practical task**: add `customAlias` (3-16 chars, `[A-Za-z0-9_-]`, not reserved). A duplicate alias
must return 409 `ALIAS_TAKEN` (not retry!). Explain why alias collision and random-code collision
need opposite handling.

**Self-check**

- [ ] I can explain why the code is unique even with 5 app instances.
- [ ] I can explain the three outcomes of the idempotent runner.

---

## Stage 4 - Redirect, 302 vs 301, Redis cache-aside, click counting

**Learning objectives**

- Implement cache-aside with correct TTLs, negative caching and fail-open behaviour.
- Keep analytics off the hot path.
- Defend the 302 choice with consequences.

### Requirements

- `GET /:code` is public. Valid active link -> 302 + `Location`. Unknown -> 404. Expired -> 410.
- Cache in Redis (`link:{code}`), TTL 1 hour, capped by expiry. Unknown codes cached 60 seconds.
- If Redis is down, redirects still work (slower) from MySQL.
- Every GET redirect counts one click; HEAD does not. Counting never delays the redirect.
- Malformed codes are rejected before touching Redis or MySQL.

### Acceptance criteria

- [ ] First request `X-Cache: MISS`, second `X-Cache: HIT`.
- [ ] A link that expires in 1.5 seconds is 410 on a cache HIT after expiry.
- [ ] Delete then redirect is 404 immediately, even though the link was cached.
- [ ] Stopping Redis does not break redirects or link creation (real output below).
- [ ] 3 GETs + 1 HEAD -> `totalClicks: 3`.

### Interview concepts

`[ESSENTIAL]` cache-aside vs read-through/write-through, TTL, negative caching, invalidation on write,
cache stampede, fail open vs fail closed, why 302, fire-and-forget analytics, write-behind counters.
`[ADVANCED]` stampede protection (single-flight, jittered TTL), stale race on delete (a reader that
loaded the row before DELETE can write it back after), hot-key problem.

### Files

**src/lib/cacheEntry.js** (pure logic, unit-testable with no Redis)

*File: `src/lib/cacheEntry.js`*

````js
// Pure functions: what the cache stores and how we read it back.
// Entry shapes:
//   { u: <long url>, e: <expiry epoch ms or null> }   a real link
//   { m: 1 }                                          negative entry (no such code)

export function toEntry(row) {
  if (!row) return { m: 1 };
  return { u: row.long_url, e: row.expires_at ? new Date(row.expires_at).getTime() : null };
}

export function interpretEntry(entry, nowMs) {
  if (entry.m) return { status: 'missing' };
  if (entry.e !== null && entry.e <= nowMs) return { status: 'gone' };
  return { status: 'ok', longUrl: entry.u };
}

// TTL must never outlive the link's expiry, otherwise we would serve a dead
// link from cache. interpretEntry also re-checks on every hit (belt and braces).
export function ttlFor(entry, nowMs, { ttlSeconds, negativeTtlSeconds }) {
  if (entry.m) return negativeTtlSeconds;
  if (entry.e === null || entry.e <= nowMs) return ttlSeconds;
  const untilExpiry = Math.ceil((entry.e - nowMs) / 1000);
  return Math.max(1, Math.min(ttlSeconds, untilExpiry));
}
````

Cache value ka shape chhota rakha: `{u, e}` ya `{m:1}`. Expiry timestamp cache ke andar hai, isliye
cache hit par bhi 410 sahi time par milta hai; TTL sirf memory bachane ke liye hai.

**src/lib/lock.js** (used by the click flush and the cleanup job)

*File: `src/lib/lock.js`*

````js
import { randomUUID } from 'node:crypto';

// SET NX PX with a unique token; release only if we still own it
// (compare-and-delete in Lua so check + delete are atomic).
const RELEASE = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
end
return 0`;

export async function withLock(redis, key, ttlMs, fn) {
  const token = randomUUID();
  const ok = await redis.set(key, token, 'PX', ttlMs, 'NX');
  if (ok !== 'OK') return { ran: false };
  try {
    return { ran: true, value: await fn() };
  } finally {
    await redis.eval(RELEASE, 1, key, token).catch(() => {});
  }
}
````

The redirect code itself is `resolve()` and `recordClick()` inside `links.service.js` (shown in
Stage 3) and the `createRedirectRouter` at the bottom of `links.routes.js`.

Cache-aside flow in `resolve(code)`:

```text
1. GET link:{code}            -> hit?  interpretEntry(entry, now)  -> ok / gone / missing   (X-Cache: HIT)
2. (miss) SELECT ... WHERE code = ?                                                          (X-Cache: MISS)
3. SET link:{code} entry EX ttlFor(entry)        (positive entry, or {m:1} negative entry)
4. Redis error at 1 or 3: log it, continue with MySQL (fail open)
```

Click counting: `HINCRBY clicks:pending <code> 1` (no await). `flushClicks()` takes a Redis lock,
`RENAME clicks:pending clicks:flushing` (atomic snapshot; new clicks go to a fresh hash), applies
`UPDATE links SET clicks = clicks + ?` per code, and `HDEL`s each code after its update.
If the process dies mid-flush, the next run continues from `clicks:flushing` (at-least-once; a crash
between one UPDATE and its HDEL can double-count that one code, so these are approximate stats).

### How to test this stage

Real output from the compose stack (Stage 9 builds it):

```text
--- redirect x2 (MISS then HIT)
HTTP/1.1 302 Found
X-Cache: MISS
Cache-Control: private, max-age=0
Location: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs
HTTP/1.1 302 Found
X-Cache: HIT
Location: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs

--- validation error / unknown code / expired
{"error":{"code":"VALIDATION_FAILED","message":"Request validation failed","requestId":"e0b46adc-11ba-4718-a182-779f25ce8f88","details":[{"field":"longUrl","message":"Only http and https URLs are allowed"}]}}
HTTP/1.1 404 Not Found
X-Request-Id: 457fe699-0c89-4a75-9eb9-a76eb19a0aab
{"error":{"code":"NOT_FOUND","message":"Link not found","requestId":"457fe699-0c89-4a75-9eb9-a76eb19a0aab"}}
{"code":"4g8X67k","shortUrl":"http://localhost:3018/4g8X67k","longUrl":"https://example.com/short-lived","expiresAt":"2026-10-20T07:04:35.834Z","createdAt":"2026-10-20T07:04:33.591Z","clicks":0}
HTTP/1.1 302 Found
HTTP/1.1 410 Gone
{"error":{"code":"LINK_EXPIRED","message":"This link has expired","requestId":"2674c454-91e5-4504-a10b-9cb7096a93bf"}}
```

Click counters: 2 redirects were made, `stats` right away (counts still in Redis, `flushedClicks: 0`), then
again after the 10 second flush job ran (real output):

```text
--- stats (clicks pending in Redis, then flushed by the 10s job)
{"code":"vXjPgQs","totalClicks":2,"flushedClicks":0,"expired":false,"expiresAt":null,"createdAt":"2026-10-20T07:04:31.064Z"}
{"code":"vXjPgQs","totalClicks":2,"flushedClicks":2,"expired":false,"expiresAt":null,"createdAt":"2026-10-20T07:04:31.064Z"}
```

Redis down (real output; `docker stop` on the Redis container, then calls through the app):

```text
--- stop Redis, then use the API
HTTP/1.1 302 Found
X-Cache: MISS
Location: https://example.com/redis-down-demo
{"status":"ready","checks":{"mysql":"ok","redis":"down"}}
create while redis down: 201
{"status":"ready","checks":{"mysql":"ok","redis":"ok"}}
```

Observe: redirect `X-Cache: MISS` while Redis was down (MySQL served it), create returned 201,
`/readyz` shows `redis: "down"` but the app stays "ready", then recovered by itself.

**Key concepts to remember**

- 302 keeps you in the loop; 301 trades control for traffic savings.
- The cache stores facts (url, expiry), decisions are recomputed on every read.
- Analytics on the hot path = a DB write per click. Count in Redis, flush in batches.

**Revision questions**

1. Why do we cache "this code does not exist" for 60 seconds? What attack does it blunt?
2. Why must the cache TTL be capped by the link's expiry, and why do we ALSO store `e` in the entry?
3. What races are possible when a link is deleted while a reader is filling the cache? How long is the damage window?
4. Why `RENAME` instead of `HGETALL` followed by `DEL`?
5. What changes if marketing says "we need exact click counts for billing"?

**Practical task**: add stampede protection. When 1,000 requests miss the same code at the same
instant, only ONE should query MySQL (single-flight per code inside the process, optionally a short
Redis lock across processes). Prove it with a test that counts `SELECT` calls on a fake pool.

**Self-check**

- [ ] I can explain HIT, MISS, BYPASS and what each costs.
- [ ] I can state what happens to redirects, creates and rate limiting when Redis dies.

---

## Stage 5 - Expiration, stats, delete, pagination, cleanup job

**Learning objectives**

- Two-layer expiry (lazy + sweep) and why each exists.
- Keyset pagination and why OFFSET degrades.
- Batched deletes and a Redis-locked background job.

### Requirements

- `expiresAt` honoured on every redirect; expired -> 410 `LINK_EXPIRED`.
- Sweep job deletes links expired more than 7 days ago in batches of 1000, plus idempotency keys older than 24 hours.
- Exactly one instance sweeps at a time. The sweep can also run as a one-shot CLI (`npm run cleanup`).
- `GET /v1/links?limit=&cursor=` returns my links newest first, `limit` 1-100 (default 20), opaque cursor.
- `GET /v1/links/:code/stats`, `DELETE /v1/links/:code` (owner only, 404 otherwise).

### Acceptance criteria

- [ ] Walking 5 links with `limit=2` gives 3 pages, no duplicates, newest first.
- [ ] Creating a link between page 1 and page 2 does not shift page 2.
- [ ] Sweep with 2,500 expired rows deletes all of them (3 batches).
- [ ] Rows expired less than 7 days ago, future-dated rows and non-expiring rows survive.
- [ ] A second sweeper gets `null` while the lock is held.
- [ ] Garbage cursors (`!!!`, `0`, `1 OR 1=1`) are 400 `INVALID_CURSOR`.

### Interview concepts

`[ESSENTIAL]` keyset vs offset pagination (cost of `OFFSET 100000`, drifting pages), opaque cursors,
batched `DELETE ... LIMIT` (short transactions, small undo log, no long locks), job idempotency,
distributed lock with token (`SET NX PX` + compare-and-delete).
`[ADVANCED]` MySQL partitioning by `expires_at` so expiry becomes `DROP PARTITION`, MySQL
`EVENT` scheduler vs app job, soft delete vs hard delete.

### Files

**src/lib/cursor.js**

*File: `src/lib/cursor.js`*

````js
import { badRequest } from '../errors.js';

// Keyset pagination cursor = opaque wrapper around the last seen id.
export const encodeCursor = (id) => Buffer.from(String(id), 'utf8').toString('base64url');

export function decodeCursor(cursor) {
  const text = Buffer.from(cursor, 'base64url').toString('utf8');
  if (!/^[1-9][0-9]{0,19}$/.test(text)) {
    throw badRequest('INVALID_CURSOR', 'Cursor is not valid');
  }
  return text; // keep as a string: BIGINT ids can exceed Number.MAX_SAFE_INTEGER
}
````

The cursor is the last row's `id`, wrapped in base64url so clients treat it as opaque and you stay
free to change it later (e.g. `(created_at, id)`). It is kept as a STRING: `BIGINT UNSIGNED` can
exceed `Number.MAX_SAFE_INTEGER`, and the regex rejects anything that is not a plain positive integer
before it reaches SQL.

Query shape: `WHERE owner_id = ? AND id < ? ORDER BY id DESC LIMIT limit+1`. We fetch one extra row;
if it exists there is a next page. No `COUNT(*)` (expensive and unstable).

**src/jobs/cleanup.js** and **src/jobs/cleanup-cli.js**

*File: `src/jobs/cleanup.js`*

````js
import { withLock } from '../lib/lock.js';

const BATCH = 1000;

// Expiry strategy = LAZY + SWEEP.
//   Lazy : every redirect checks expires_at, so an expired link is never served
//          even if the sweep has not run yet (correctness).
//   Sweep: this job physically deletes old expired rows (storage + index size).
// Deleting in small batches keeps each transaction short, so it never holds
// long locks or bloats the binlog / undo log.
export async function deleteExpiredLinks(pool, { graceDays, now = new Date() }) {
  const cutoff = new Date(now.getTime() - graceDays * 86_400_000);
  let total = 0;
  for (;;) {
    const [res] = await pool.query(
      'DELETE FROM links WHERE expires_at IS NOT NULL AND expires_at < ? LIMIT ?',
      [cutoff, BATCH],
    );
    total += res.affectedRows;
    if (res.affectedRows < BATCH) return total;
  }
}

export async function deleteOldIdempotencyKeys(pool, { now = new Date(), maxAgeHours = 24 }) {
  const cutoff = new Date(now.getTime() - maxAgeHours * 3_600_000);
  const [res] = await pool.execute('DELETE FROM idempotency_keys WHERE created_at < ?', [cutoff]);
  return res.affectedRows;
}

export async function runCleanup({ pool, redis, config, logger, now }) {
  // Lock so N app instances do not all sweep at the same time.
  const out = await withLock(redis, 'lock:cleanup', 5 * 60_000, async () => {
    const links = await deleteExpiredLinks(pool, { graceDays: config.EXPIRED_GRACE_DAYS, now });
    const keys = await deleteOldIdempotencyKeys(pool, { now });
    logger.info('cleanup_done', { expiredLinksDeleted: links, idempotencyKeysDeleted: keys });
    return { links, keys };
  });
  return out.ran ? out.value : null;
}

export function startJobs({ pool, redis, config, logger, links }) {
  const timers = [
    setInterval(() => {
      runCleanup({ pool, redis, config, logger }).catch((e) =>
        logger.error('cleanup_failed', { error: e.message }));
    }, config.CLEANUP_INTERVAL_SECONDS * 1000),
    setInterval(() => {
      links.flushClicks().catch((e) => logger.error('flush_failed', { error: e.message }));
    }, config.CLICK_FLUSH_INTERVAL_SECONDS * 1000),
  ];
  timers.forEach((t) => t.unref()); // jobs never keep the process alive on their own
  return () => timers.forEach(clearInterval);
}
````

*File: `src/jobs/cleanup-cli.js`*

````js
import Redis from 'ioredis';
import { loadConfig } from '../config.js';
import { createLogger } from '../logger.js';
import { createPool } from '../db/pool.js';
import { runCleanup } from './cleanup.js';

// `npm run cleanup` -- run the sweep once (e.g. from cron or a Kubernetes CronJob).
const config = loadConfig();
const pool = createPool(config);
const redis = new Redis(config.REDIS_URL);
const result = await runCleanup({ pool, redis, config, logger: createLogger('info') });
console.log(result ?? 'another instance holds the cleanup lock');
await pool.end();
redis.disconnect();
````

`setInterval(...).unref()`: jobs process ko zinda nahi rakhte; `stopJobs()` shutdown par timers
band karta hai. Real output of the CLI inside the running container:

```text
$ docker exec us-app-1 node src/jobs/cleanup-cli.js
{"level":"info","time":"2026-10-20T07:10:26.349Z","msg":"cleanup_done","expiredLinksDeleted":0,"idempotencyKeysDeleted":0}
{ links: 0, keys: 0 }
```

### How to test this stage

`tests/integration/cleanup.test.js`, `links.test.js` (pagination, ownership, delete, expiry) in Stage 8.
Manual, real output (3 more links created, page of 2 with its cursor, then delete and redirect):

```text
--- list with pagination
{"codes":["oxmQBej","U2rDLZb"],"page":{"limit":2,"nextCursor":"NA"}}

--- delete then redirect
HTTP/1.1 204 No Content
HTTP/1.1 404 Not Found
```

(The cursor `NA` is just base64url of the id `4`; clients must treat it as opaque.)

**Key concepts to remember**

- Correctness (lazy) and housekeeping (sweep) are separate concerns.
- Delete in batches; never one giant `DELETE`.
- A lock with a unique token protects against "my lock expired and I deleted yours".

**Revision questions**

1. Compute roughly how many rows MySQL must read and discard for `LIMIT 20 OFFSET 1000000` vs a keyset query.
2. A sweep takes longer than its lock TTL (5 minutes). What goes wrong and how do you mitigate it?
3. Why does the stats response include both `totalClicks` and `flushedClicks`?
4. Why is the expired-link grace period 7 days rather than 0?
5. What does `DELETE ... LIMIT` do to replication when the table has no `ORDER BY`? (Hint: statement-based binlog warning; row-based is fine.)

**Practical task**: add `GET /v1/links?expired=true|false` filter. Decide which index you need,
prove it with `EXPLAIN`, and keep the cursor stable.

**Self-check**

- [ ] I can explain why page 2 is stable under inserts with a keyset cursor.
- [ ] I can explain the lazy + sweep split to an interviewer in 30 seconds.

---

## Stage 6 - Rate limiting (sliding window, Redis Lua)

**Learning objectives**

- Implement an atomic sliding-window limiter and expose the standard headers.
- Pick keys (user vs IP) and failure policy (open vs closed).
- Know the trade-offs against token bucket and fixed window.

### Requirements

- Create: 30 per 60 s per user. Login/register: 10 per 60 s per IP. Redirect: 600 per 60 s per IP.
- Over the limit: 429 `RATE_LIMITED`, `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`.
- Exactly `max` requests pass even under heavy concurrency.
- Redis unreachable -> allow the request (fail open) and log.

### Acceptance criteria

- [ ] With max=3: 201, 201, 201, 429; another user is unaffected.
- [ ] After the window passes, capacity returns (sliding, not fixed buckets).
- [ ] 20 parallel redirect requests with max=5: exactly 5 are 302, 15 are 429.
- [ ] With Redis unreachable the API still answers; `/readyz` reports `redis: "down"`.

### Interview concepts

`[ESSENTIAL]` fixed vs sliding window vs token bucket, atomicity (why `GET` then `SET` from Node is
racy, why a Lua script is not), keys and identity (IP vs user, `trust proxy`), `429` + `Retry-After`,
fail open vs fail closed, memory cost of the algorithm.
`[ADVANCED]` Redis Cluster hash slots (single key per script is cluster safe), clock source (Redis
`TIME` avoids app clock skew), cost of per-request round trip, local pre-filter plus global limiter.

### Files

**src/middleware/rateLimit.js**

*File: `src/middleware/rateLimit.js`*

````js
import { randomUUID } from 'node:crypto';
import { AppError } from '../errors.js';

// Sliding-window LOG limiter. One sorted set per key: member = request id,
// score = timestamp (ms, taken from the Redis server clock so all app
// instances agree). Everything happens in one Lua script => atomic.
// Rejected requests are NOT recorded, so hammering does not extend the block.
const LUA = `
local window = tonumber(ARGV[1])
local limit  = tonumber(ARGV[2])
local t      = redis.call('TIME')
local now    = t[1] * 1000 + math.floor(t[2] / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - window)
local count = redis.call('ZCARD', KEYS[1])
if count < limit then
  redis.call('ZADD', KEYS[1], now, ARGV[3])
  redis.call('PEXPIRE', KEYS[1], window)
  return {1, limit - count - 1, 0}
end
local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
return {0, 0, tonumber(oldest[2]) + window - now}
`;

export function createRateLimiter({ redis, logger, name, windowSeconds, max, keyFn }) {
  const windowMs = windowSeconds * 1000;
  return async (req, res, next) => {
    const id = keyFn(req);
    try {
      const [allowed, remaining, retryMs] = await redis.eval(
        LUA, 1, `rl:${name}:${id}`, windowMs, max, randomUUID(),
      );
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(remaining));
      if (allowed === 1) return next();

      const retryAfter = Math.max(1, Math.ceil(retryMs / 1000));
      const err = new AppError(429, 'RATE_LIMITED', 'Too many requests, slow down');
      err.headers = { 'Retry-After': String(retryAfter), 'X-RateLimit-Reset': String(retryAfter) };
      return next(err);
    } catch (e) {
      // Fail OPEN: a Redis outage must not take the whole API down.
      // (For a login limiter on a bank you might choose fail CLOSED instead.)
      logger.error('rate_limiter_unavailable', { name, error: e.message });
      return next();
    }
  };
}
````

Script ka logic:

1. `now` Redis ke `TIME` se (saare app instances ek clock use karte hain).
2. `ZREMRANGEBYSCORE key 0 now-window`: purani entries hatao.
3. `ZCARD < limit` ho to `ZADD` (member = unique id, score = now) aur `PEXPIRE`; allowed.
4. Warna reject, **record nahi karte** (hammering se block lamba nahi hota), `Retry-After` =
   sabse purani entry ki umar khatam hone mein bacha time.

Sab ek Lua script mein, isliye Redis single-threaded execution ke andar atomic hai. Node mein
`ZCARD` phir `ZADD` alag calls hote to 20 parallel requests limit se zyada pass ho jaati
(`is atomic under concurrency` test isi ko prove karta hai).

Real output (login limit 10 per minute per IP, 12 bad logins in a row; the first 2 slots were
used by the register and login calls before it):

```text
--- rate limit on login (limit 10/min per IP): 12 bad logins
401 401 401 401 401 401 401 401 429 429 429 429 
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
Retry-After: 35
X-RateLimit-Reset: 35
{"error":{"code":"RATE_LIMITED","message":"Too many requests, slow down","requestId":"9be965d0-4318-4b6c-a71a-fda144fc01f6"}}
```

### How to test this stage

`tests/integration/rateLimit.test.js` (Stage 8). The `fails OPEN` test builds an app whose Redis
client points at a dead port.

**Key concepts to remember**

- Limit identity: IP for anonymous endpoints, user id for authenticated ones.
- A sliding LOG is exact but costs memory per allowed request.
- Fail open keeps the product up; fail closed protects a fragile dependency. Choose per endpoint.

**Revision questions**

1. Why is a fixed window counter wrong at the window boundary? Give the 2x-burst example.
2. Why do we not record rejected requests in the ZSET?
3. Behind nginx, every request has the proxy's IP. What breaks and what setting fixes it? What is the security risk of setting it wrongly?
4. Convert this limiter to a token bucket: what two values do you store per key?
5. For login you would maybe fail closed. What does that do during a Redis outage and is that acceptable?

**Practical task**: implement a token-bucket variant (`rl:bucket:{id}` hash with `tokens`, `ts`) in Lua,
parameters `capacity` and `refillPerSecond`. Re-run the same concurrency test against it.

**Self-check**

- [ ] I can explain why the script is atomic and what would go wrong without it.
- [ ] I can name the memory cost of this algorithm.

---

## Stage 7 - Error contract, OpenAPI, app wiring, graceful shutdown

**Learning objectives**

- One error envelope with stable machine-readable codes.
- Composition root (dependency injection without a framework) so tests can build the app.
- OpenAPI as the contract, validated in CI.
- Graceful shutdown.

### Requirements

- Every non-2xx response: `{ "error": { "code", "message", "requestId", "details"? } }`.
- `code` is stable and documented; `message` is for humans; stack traces and SQL never leave the server.
- Every response carries `X-Request-Id` (echoes a sane inbound one) and it appears in the error body and the access log.
- `openapi.yaml` is valid OpenAPI 3.1 and documents every route the server implements.
- On `SIGTERM`: stop accepting, finish in-flight requests, flush clicks, close pool and Redis, exit 0.

### Acceptance criteria

- [ ] Unknown route, validation error, malformed JSON, 401, 404, 410, 422, 429 and 500 all use the same shape.
- [ ] `openapi.yaml` passes `SwaggerParser.validate` and a test fails if a route is added without documenting it.
- [ ] `docker stop` exits in under 5 seconds with `shutdown_done` in the log (real output below).

### Interview concepts

`[ESSENTIAL]` centralised error handler (Express 5: async errors reach it automatically), operational vs
programmer errors, status code semantics (400 vs 401 vs 404 vs 409 vs 410 vs 422 vs 429 vs 503), correlation id,
leaking internals, dependency injection by function arguments, liveness vs readiness, SIGTERM handling.
`[ADVANCED]` spec-first vs code-first, response validation against the schema in tests, RFC 9457 problem details.

### Files

**src/middleware/errorHandler.js**, **src/middleware/requestContext.js**

*File: `src/middleware/errorHandler.js`*

````js
import { ZodError } from 'zod';
import { AppError } from '../errors.js';

// Every error response has exactly this shape:
// { "error": { "code": "...", "message": "...", "details": [...]?, "requestId": "..." } }
function send(res, status, code, message, details) {
  const body = { error: { code, message, requestId: res.locals.requestId } };
  if (details) body.error.details = details;
  res.status(status).json(body);
}

export function notFoundHandler(req, res) {
  send(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}

export function createErrorHandler(logger) {
  // Express recognises error middleware by its 4 arguments. Keep `next`.
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);

    if (err instanceof AppError) {
      if (err.headers) res.set(err.headers);
      return send(res, err.status, err.code, err.message, err.details);
    }
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return send(res, 400, 'VALIDATION_FAILED', 'Request validation failed', details);
    }
    // body-parser errors carry a `type`
    if (err.type === 'entity.parse.failed') {
      return send(res, 400, 'INVALID_JSON', 'Request body is not valid JSON');
    }
    if (err.type === 'entity.too.large') {
      return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
    }

    // Unexpected: log everything, leak nothing.
    logger.error('unhandled_error', {
      requestId: res.locals.requestId,
      path: req.path,
      error: err.message,
      stack: err.stack,
    });
    return send(res, 500, 'INTERNAL', 'Something went wrong');
  };
}
````

*File: `src/middleware/requestContext.js`*

````js
import { randomUUID } from 'node:crypto';

// Correlation id: accept a sane inbound one, otherwise make one. Echo it back.
export function requestContext(logger) {
  return (req, res, next) => {
    const inbound = req.get('x-request-id');
    const id = inbound && /^[\w-]{8,64}$/.test(inbound) ? inbound : randomUUID();
    res.locals.requestId = id;
    res.set('X-Request-Id', id);

    const start = process.hrtime.bigint();
    res.on('finish', () => {
      logger.info('request', {
        requestId: id,
        method: req.method,
        path: req.route?.path ?? req.path, // route pattern, not the raw URL (low cardinality)
        status: res.statusCode,
        ms: Number(process.hrtime.bigint() - start) / 1e6,
      });
    });
    next();
  };
}
````

Status codes used here and why:

| Code | When | Why this one |
|------|------|--------------|
| 400 | Zod validation, bad JSON, bad cursor, bad idempotency key | Client sent something malformed |
| 401 | No/invalid token, wrong password | Not authenticated |
| 404 | Unknown code, someone else's link | Also used instead of 403 to avoid confirming existence |
| 409 | Email already registered | State conflict |
| 410 | Expired link | "It existed, it is gone": more useful than 404 |
| 413 | Body over 10 KB | Protect the parser |
| 422 | Idempotency-Key reused with another body | Syntactically fine, semantically rejected |
| 429 | Rate limited | With `Retry-After` |
| 503 | Could not allocate a code | Retryable server-side condition |
| 500 | Anything unexpected | Logged with stack, body says only `INTERNAL` |

**src/app.js** (composition root) and **src/server.js**

*File: `src/app.js`*

````js
import express from 'express';
import { requestContext } from './middleware/requestContext.js';
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createLinkService } from './modules/links/links.service.js';
import { createLinksRouter, createRedirectRouter } from './modules/links/links.routes.js';
import { createIdempotentRunner } from './modules/links/idempotency.js';

// Composition root: everything is passed in, nothing is a hidden singleton,
// so tests can build the app with a real pool/redis (or fakes).
export function createApp({ config, pool, redis, logger, generateCode }) {
  const app = express();
  app.disable('x-powered-by');
  const hops = config.TRUST_PROXY;
  app.set('trust proxy', hops === 'true' ? true : hops === 'false' ? false : Number(hops));

  app.use(requestContext(logger));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Health endpoints are registered BEFORE /:code so they are never shadowed.
  app.get('/healthz', (req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (req, res) => {
    const checks = { mysql: 'ok', redis: 'ok' };
    try { await pool.query('SELECT 1'); } catch { checks.mysql = 'down'; }
    try { await redis.ping(); } catch { checks.redis = 'down'; }
    const ready = checks.mysql === 'ok'; // Redis down degrades us, it does not make us unready
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', checks });
  });

  const limiter = (name, max, keyFn) =>
    createRateLimiter({
      redis, logger, name, max, keyFn,
      windowSeconds: config.RATE_LIMIT_WINDOW_SECONDS,
    });
  const byIp = (req) => req.ip;
  const byUser = (req) => req.user.id;

  const auth = createAuthService({ pool, config });
  const links = createLinkService({ pool, redis, config, logger, generateCode });
  const runIdempotent = createIdempotentRunner(pool);

  app.use(express.json({ limit: '10kb' }));

  app.use('/v1/auth', createAuthRouter({
    auth,
    authLimiter: limiter('auth', config.RATE_LIMIT_AUTH_MAX, byIp),
  }));
  app.use('/v1/links', createLinksRouter({
    links, runIdempotent, config,
    requireAuth: requireAuth(config),
    createLimiter: limiter('create', config.RATE_LIMIT_CREATE_MAX, byUser),
  }));
  app.use(createRedirectRouter({
    links,
    redirectLimiter: limiter('redirect', config.RATE_LIMIT_REDIRECT_MAX, byIp),
  }));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  app.locals.links = links; // exposed for background jobs and tests
  return app;
}
````

*File: `src/server.js`*

````js
import Redis from 'ioredis';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';
import { startJobs } from './jobs/cleanup.js';

const config = loadConfig(); // crashes immediately on bad config: fail fast
const logger = createLogger(config.LOG_LEVEL);
const pool = createPool(config);
const redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 1, commandTimeout: 500 });
redis.on('error', (e) => logger.error('redis_error', { error: e.message }));

const app = createApp({ config, pool, redis, logger });
const stopJobs = config.JOBS_ENABLED
  ? startJobs({ pool, redis, config, logger, links: app.locals.links })
  : () => {};

const server = app.listen(config.PORT, () => {
  logger.info('listening', { port: config.PORT, env: config.NODE_ENV });
});

// Graceful shutdown: stop accepting, let in-flight requests finish, flush
// counters, close connections. Orchestrators send SIGTERM before SIGKILL.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('shutdown_start', { signal });
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  stopJobs();
  server.close(async () => {
    try {
      await app.locals.links.flushClicks();
      await pool.end();
      redis.disconnect();
      logger.info('shutdown_done');
      process.exit(0);
    } catch (e) {
      logger.error('shutdown_error', { error: e.message });
      process.exit(1);
    }
  });
  server.closeIdleConnections();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
````

`app.js` kuch bhi import karke global nahi banata: `config`, `pool`, `redis`, `logger` bahar se aate
hain. Isliye tests apne config ke saath (e.g. rate limit 3) ya fake code generator ke saath app bana
paate hain. `/healthz` ko `/:code` se pehle register kiya, warna `healthz` ek "code" ban jata.

Liveness vs readiness: `/healthz` = process zinda hai (restart karna hai ya nahi). `/readyz` =
traffic le sakta hai (MySQL OK). Redis down hone par hum "ready" rehte hain kyunki fail-open design hai.

**openapi.yaml**

*File: `openapi.yaml`*

````yaml
openapi: 3.1.0
info:
  title: URL Shortener API
  version: 1.0.0
  description: |
    Create short links, redirect, see click stats. Authenticated with a JWT bearer token.
    All errors share one shape (see `Error`). Rate limited per user / per IP.
servers:
  - url: http://localhost:3018
tags:
  - name: auth
  - name: links
  - name: redirect
  - name: ops

paths:
  /v1/auth/register:
    post:
      tags: [auth]
      summary: Create an account
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Credentials' }
      responses:
        '201':
          description: Account created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '409':
          description: Email already registered (code EMAIL_TAKEN)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /v1/auth/login:
    post:
      tags: [auth]
      summary: Exchange email + password for an access token
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Credentials' }
      responses:
        '200':
          description: Token issued
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Token' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '401':
          description: Wrong email or password (code INVALID_CREDENTIALS)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /v1/links:
    post:
      tags: [links]
      summary: Create a short link
      description: |
        Send an `Idempotency-Key` header to make retries safe. Same key + same body
        returns the original response (header `Idempotent-Replayed: true`).
        Same key + different body returns 422.
      security: [{ bearerAuth: [] }]
      parameters:
        - name: Idempotency-Key
          in: header
          required: false
          schema: { type: string, minLength: 8, maxLength: 128 }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateLink' }
      responses:
        '201':
          description: Created (or replayed)
          headers:
            Location: { schema: { type: string, format: uri } }
            Idempotent-Replayed: { schema: { type: string, enum: ['true'] } }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Link' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '401': { $ref: '#/components/responses/Unauthenticated' }
        '422':
          description: Idempotency-Key reused with a different body (code IDEMPOTENCY_KEY_REUSED)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
        '429': { $ref: '#/components/responses/RateLimited' }
        '503':
          description: Could not allocate a unique code (code CODE_ALLOCATION_FAILED), retry
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
    get:
      tags: [links]
      summary: List my links (newest first, cursor pagination)
      security: [{ bearerAuth: [] }]
      parameters:
        - name: limit
          in: query
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
        - name: cursor
          in: query
          description: Opaque value from the previous page's `page.nextCursor`
          schema: { type: string, maxLength: 64 }
      responses:
        '200':
          description: One page of links
          content:
            application/json:
              schema: { $ref: '#/components/schemas/LinkPage' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '401': { $ref: '#/components/responses/Unauthenticated' }

  /v1/links/{code}/stats:
    get:
      tags: [links]
      summary: Click statistics for one of my links
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/Code' }
      responses:
        '200':
          description: Stats
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Stats' }
        '401': { $ref: '#/components/responses/Unauthenticated' }
        '404': { $ref: '#/components/responses/NotFound' }

  /v1/links/{code}:
    delete:
      tags: [links]
      summary: Delete one of my links
      security: [{ bearerAuth: [] }]
      parameters:
        - { $ref: '#/components/parameters/Code' }
      responses:
        '204': { description: Deleted }
        '401': { $ref: '#/components/responses/Unauthenticated' }
        '404': { $ref: '#/components/responses/NotFound' }

  /{code}:
    get:
      tags: [redirect]
      summary: Redirect to the long URL
      description: Public. Always 302 (never 301) so clicks are counted and deletes take effect at once.
      parameters:
        - { $ref: '#/components/parameters/Code' }
      responses:
        '302':
          description: Redirect
          headers:
            Location: { schema: { type: string, format: uri } }
            X-Cache: { schema: { type: string, enum: [HIT, MISS, BYPASS] } }
        '404': { $ref: '#/components/responses/NotFound' }
        '410':
          description: Link expired (code LINK_EXPIRED)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /healthz:
    get:
      tags: [ops]
      summary: Liveness probe
      responses:
        '200': { description: Process is up }
  /readyz:
    get:
      tags: [ops]
      summary: Readiness probe (checks MySQL; Redis is reported but optional)
      responses:
        '200': { description: Ready }
        '503': { description: MySQL unreachable }

components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }

  parameters:
    Code:
      name: code
      in: path
      required: true
      schema: { type: string, pattern: '^[0-9A-Za-z]{7}$' }

  responses:
    ValidationFailed:
      description: Body, query or params failed validation (code VALIDATION_FAILED)
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    Unauthenticated:
      description: Missing or invalid token (code UNAUTHENTICATED)
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    NotFound:
      description: No such link, or it is not yours (code NOT_FOUND)
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    RateLimited:
      description: Too many requests (code RATE_LIMITED)
      headers:
        Retry-After: { schema: { type: integer }, description: Seconds to wait }
        X-RateLimit-Limit: { schema: { type: integer } }
        X-RateLimit-Remaining: { schema: { type: integer } }
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }

  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, requestId]
          properties:
            code: { type: string, examples: [VALIDATION_FAILED] }
            message: { type: string }
            requestId: { type: string }
            details:
              type: array
              items:
                type: object
                properties:
                  field: { type: string }
                  message: { type: string }
    Credentials:
      type: object
      required: [email, password]
      additionalProperties: false
      properties:
        email: { type: string, format: email, maxLength: 254 }
        password: { type: string, minLength: 8, maxLength: 72 }
    User:
      type: object
      properties:
        id: { type: string }
        email: { type: string, format: email }
    Token:
      type: object
      properties:
        accessToken: { type: string }
        tokenType: { type: string, enum: [Bearer] }
        expiresIn: { type: integer, description: Seconds }
    CreateLink:
      type: object
      required: [longUrl]
      additionalProperties: false
      properties:
        longUrl: { type: string, format: uri, maxLength: 2048 }
        expiresAt: { type: string, format: date-time, description: Must be in the future }
    Link:
      type: object
      properties:
        code: { type: string, pattern: '^[0-9A-Za-z]{7}$' }
        shortUrl: { type: string, format: uri }
        longUrl: { type: string, format: uri }
        expiresAt: { type: [string, 'null'], format: date-time }
        createdAt: { type: string, format: date-time }
        clicks: { type: integer }
    LinkPage:
      type: object
      properties:
        data:
          type: array
          items: { $ref: '#/components/schemas/Link' }
        page:
          type: object
          properties:
            limit: { type: integer }
            nextCursor: { type: [string, 'null'] }
    Stats:
      type: object
      properties:
        code: { type: string }
        totalClicks: { type: integer, description: Flushed + not-yet-flushed clicks }
        flushedClicks: { type: integer }
        expired: { type: boolean }
        expiresAt: { type: [string, 'null'], format: date-time }
        createdAt: { type: string, format: date-time }
````

Real graceful-shutdown output (container logs after `docker stop`; stop took 2.8 seconds including
Docker's own overhead):

```text
$ docker stop us-app-1   (took 2.8 s wall clock)
{"level":"info","time":"2026-10-20T07:10:44.977Z","msg":"shutdown_start","signal":"SIGTERM"}
{"level":"info","time":"2026-10-20T07:10:45.001Z","msg":"shutdown_done"}
```

### How to test this stage

`tests/unit/openapi.test.js` (valid spec + every route documented), `links.test.js` "error contract",
`auth.test.js` (INVALID_JSON, VALIDATION_FAILED), `tests/unit/errorHandler.test.js` (500 never leaks internals, 413, 429 headers). Run `npx @redocly/cli lint openapi.yaml` if you want a
stricter linter (I did not run it).

**Key concepts to remember**

- `code` is the API; `message` is documentation. Clients branch on `code`.
- One place formats errors; everything else throws.
- Graceful shutdown = stop intake, drain, flush, close, exit.

**Revision questions**

1. What changed in Express 5 about async handlers and how did it simplify this file?
2. Why 410 and not 404 for expired links? Any downside (it reveals that the code once existed)?
3. Why echo an inbound `X-Request-Id` only if it matches a regex?
4. What happens to in-flight requests when SIGTERM arrives and `server.close()` is called?
5. Why is Redis-down not "not ready"?

**Practical task**: add `Sunset` and `Deprecation` headers for a hypothetical `/v1/links` change and
document it in OpenAPI. Decide how a client would discover that `/v2` exists.

**Self-check**

- [ ] I can list our error codes and the HTTP status for each from memory.
- [ ] I can describe the shutdown sequence in order.

---

## Stage 8 - Tests: unit + integration with real MySQL and Redis

**Learning objectives**

- Test pyramid in practice: many fast unit tests, fewer integration tests against REAL dependencies.
- Testcontainers locally, service containers in CI, same test code.
- Test concurrency, expiry, rate limits and failure behaviour, not only happy paths.

### Requirements

- `npm run test:unit` needs no Docker and runs in seconds.
- `npm run test:integration` starts a disposable MySQL 8.4 and Redis 7 (Testcontainers) or uses `TEST_DATABASE_URL`/`TEST_REDIS_URL` (CI).
- Every test starts from empty tables and an empty Redis (`reset()`).
- Mock only boundaries you own; use the real database for anything about SQL, indexes, transactions or Redis semantics.

### Acceptance criteria

- [ ] 54 unit tests and 57 integration tests pass (real output below).
- [ ] The suite covers: auth, validation, redirect HIT/MISS, expiry via cache, delete, ownership, pagination stability, idempotency race, rate-limit atomicity and fail-open, cleanup batching and locking.
- [ ] No test depends on another test's data or ordering.

### Interview concepts

`[ESSENTIAL]` test pyramid, unit vs integration vs e2e, what to mock (boundaries) and what not (your DB),
isolation (truncate between tests), flaky tests (time, ordering, shared state), negative tests,
testing concurrency, Supertest (in-process HTTP, no port).
`[ADVANCED]` Testcontainers lifecycle and Ryuk reaper, running tests in parallel with one DB per worker,
contract tests against OpenAPI, mutation testing.

### Files

**vitest.config.js**, **tests/globalSetup.js**, **tests/helpers.js**

*File: `vitest.config.js`*

````js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // All integration files share one MySQL + one Redis, so files must run one at a time.
    // (In Vitest 3 this option is only honoured at the ROOT, not inside a project.)
    fileParallelism: false,
    coverage: { provider: 'v8', include: ['src/**'] },
    projects: [
      {
        // Fast, no I/O, no containers.
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.js'],
        },
      },
      {
        // Real MySQL + Redis (Testcontainers locally, service containers in CI).
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.js'],
          globalSetup: ['./tests/globalSetup.js'],
          testTimeout: 20_000,
          hookTimeout: 120_000, // first run may pull images
        },
      },
    ],
  },
});
````

*File: `tests/globalSetup.js`*

````js
// Starts ONE real MySQL 8.4 and ONE real Redis for the whole test run.
//   - Locally: Testcontainers starts disposable containers on random free ports.
//   - In CI (or if you already run them): set TEST_DATABASE_URL and TEST_REDIS_URL
//     and no container is started.
import { migrate } from '../src/db/migrate.js';

export default async function setup({ provide }) {
  const stops = [];

  let databaseUrl = process.env.TEST_DATABASE_URL;
  let redisUrl = process.env.TEST_REDIS_URL;

  if (!databaseUrl) {
    const { MySqlContainer } = await import('@testcontainers/mysql');
    const mysql = await new MySqlContainer('mysql:8.4')
      .withDatabase('shortener_test')
      .withUsername('app')
      .withUserPassword('app_pw')
      .start();
    databaseUrl = mysql.getConnectionUri();
    stops.push(() => mysql.stop());
  }
  if (!redisUrl) {
    const { RedisContainer } = await import('@testcontainers/redis');
    const redis = await new RedisContainer('redis:7-alpine').start();
    redisUrl = redis.getConnectionUrl();
    stops.push(() => redis.stop());
  }

  await migrate(databaseUrl);
  provide('databaseUrl', databaseUrl);
  provide('redisUrl', redisUrl);

  return async () => {
    await Promise.all(stops.map((stop) => stop()));
  };
}
````

*File: `tests/helpers.js`*

````js
import { inject } from 'vitest';
import Redis from 'ioredis';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db/pool.js';
import { createApp } from '../src/app.js';
import { createLogger } from '../src/logger.js';

// Build a fully wired app against the real MySQL + Redis from globalSetup.
export function buildTestContext(overrides = {}) {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: inject('databaseUrl'),
    REDIS_URL: inject('redisUrl'),
    JWT_SECRET: 'test-secret-test-secret-test-secret-123',
    BCRYPT_COST: '4', // fast hashing in tests only
    BASE_URL: 'http://short.test',
    LOG_LEVEL: 'silent',
    JOBS_ENABLED: 'false',
    RATE_LIMIT_CREATE_MAX: '1000',
    RATE_LIMIT_AUTH_MAX: '1000',
    RATE_LIMIT_REDIRECT_MAX: '1000',
    ...overrides.env,
  });
  const logger = createLogger('silent');
  const pool = createPool(config);
  const redis = new Redis(config.REDIS_URL);
  const app = createApp({ config, pool, redis, logger, generateCode: overrides.generateCode });

  return {
    app, config, pool, redis, links: app.locals.links,
    async reset() {
      await pool.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const t of ['idempotency_keys', 'links', 'users']) await pool.query(`TRUNCATE TABLE ${t}`);
      await pool.query('SET FOREIGN_KEY_CHECKS = 1');
      await redis.flushdb();
    },
    async close() {
      await pool.end();
      redis.disconnect();
    },
  };
}

let counter = 0;
// Register + login through the real HTTP API; returns an Authorization header value.
export async function signUp(request, app) {
  counter += 1;
  const creds = { email: `user${counter}-${Date.now()}@example.com`, password: 'correct-horse-battery' };
  await request(app).post('/v1/auth/register').send(creds).expect(201);
  const res = await request(app).post('/v1/auth/login').send(creds).expect(200);
  return { creds, auth: `Bearer ${res.body.accessToken}` };
}
````

Do gotchas jo mujhe actually hue:

1. `fileParallelism: false` Vitest 3 mein **sirf root level** par kaam karta hai. Maine pehle ise
   `integration` project ke andar rakha, files parallel chalti rahi, ek file ka `TRUNCATE` doosri
   file ke beech mein chal gaya aur 17 tests randomly fail hue (401, FK errors, duplicate PK). Fix:
   option root `test` block mein.
2. `testcontainers@12` Node 22.22+ maangta hai. Node 20 par pin `@11`.

**Unit tests**

*File: `tests/unit/code.test.js`*

````js
import { describe, it, expect } from 'vitest';
import { randomCode, isReserved, isValidCode, ALPHABET } from '../../src/lib/code.js';

describe('randomCode', () => {
  it('returns 7 base62 characters', () => {
    for (let i = 0; i < 1000; i += 1) {
      const code = randomCode();
      expect(code).toHaveLength(7);
      expect(isValidCode(code)).toBe(true);
    }
  });

  it('uses the whole alphabet roughly uniformly (no modulo bias)', () => {
    const counts = new Map();
    const total = 62 * 2000;
    for (let i = 0; i < total / 7; i += 1) {
      for (const ch of randomCode()) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    expect(counts.size).toBe(ALPHABET.length);
    const expected = (Math.floor(total / 7) * 7) / 62;
    for (const n of counts.values()) {
      expect(n).toBeGreaterThan(expected * 0.8);
      expect(n).toBeLessThan(expected * 1.2);
    }
  });

  it('does not repeat in 100k draws (collision probability ~ 1e-3 at this size)', () => {
    const seen = new Set();
    for (let i = 0; i < 100_000; i += 1) seen.add(randomCode());
    expect(seen.size).toBeGreaterThan(99_990);
  });
});

describe('code validation', () => {
  it.each(['abc1234', 'ZZZZZZZ', '0000000'])('accepts %s', (c) => expect(isValidCode(c)).toBe(true));
  it.each(['', 'abc123', 'abc12345', 'abc-123', 'abc 123', 'abc/123', `abc12${String.fromCharCode(233)}`])( // 7 chars, but the last one is e-acute
    'rejects %j',
    (c) => expect(isValidCode(c)).toBe(false),
  );
  it('flags codes that collide with our own routes', () => {
    expect(isReserved('healthz')).toBe(true);
    expect(isReserved('HealthZ')).toBe(true);
    expect(isReserved('abc1234')).toBe(false);
  });
});
````

*File: `tests/unit/cacheEntry.test.js`*

````js
import { describe, it, expect } from 'vitest';
import { toEntry, interpretEntry, ttlFor } from '../../src/lib/cacheEntry.js';

const NOW = Date.parse('2026-01-01T00:00:00Z');
const cfg = { ttlSeconds: 3600, negativeTtlSeconds: 60 };

describe('toEntry', () => {
  it('makes a negative entry for a missing row', () => {
    expect(toEntry(undefined)).toEqual({ m: 1 });
  });
  it('keeps url and expiry', () => {
    const e = toEntry({ long_url: 'https://a.com', expires_at: new Date(NOW + 1000) });
    expect(e).toEqual({ u: 'https://a.com', e: NOW + 1000 });
  });
});

describe('interpretEntry', () => {
  it('missing', () => expect(interpretEntry({ m: 1 }, NOW)).toEqual({ status: 'missing' }));
  it('ok with no expiry', () => {
    expect(interpretEntry({ u: 'https://a.com', e: null }, NOW)).toEqual({ status: 'ok', longUrl: 'https://a.com' });
  });
  it('ok before expiry, gone exactly at expiry', () => {
    expect(interpretEntry({ u: 'x', e: NOW + 1 }, NOW).status).toBe('ok');
    expect(interpretEntry({ u: 'x', e: NOW }, NOW).status).toBe('gone');
  });
});

describe('ttlFor', () => {
  it('uses the short negative TTL for unknown codes', () => {
    expect(ttlFor({ m: 1 }, NOW, cfg)).toBe(60);
  });
  it('uses the normal TTL when there is no expiry', () => {
    expect(ttlFor({ u: 'x', e: null }, NOW, cfg)).toBe(3600);
  });
  it('never outlives the link expiry', () => {
    expect(ttlFor({ u: 'x', e: NOW + 90_000 }, NOW, cfg)).toBe(90);
    expect(ttlFor({ u: 'x', e: NOW + 500 }, NOW, cfg)).toBe(1);
  });
  it('caps at the normal TTL for far-future expiry', () => {
    expect(ttlFor({ u: 'x', e: NOW + 10 * 86_400_000 }, NOW, cfg)).toBe(3600);
  });
});
````

*File: `tests/unit/urls.test.js`*

````js
import { describe, it, expect } from 'vitest';
import { checkLongUrl, hashRequest } from '../../src/lib/urls.js';
import { encodeCursor, decodeCursor } from '../../src/lib/cursor.js';

const BASE = 'http://short.test';

describe('checkLongUrl', () => {
  it.each([
    'https://example.com',
    'http://example.com/a/b?x=1#frag',
    'https://example.com:8443/path',
  ])('accepts %s', (u) => expect(checkLongUrl(u, BASE)).toBeNull());

  it.each([
    ['javascript:alert(1)', 'Only http'],
    ['data:text/html,<script>1</script>', 'Only http'],
    ['file:///etc/passwd', 'Only http'],
    ['ftp://example.com', 'Only http'],
    ['not a url', 'Not a valid URL'],
    ['https://user:pw@example.com', 'credentials'],
    ['http://short.test/abc1234', 'points to this service'],
  ])('rejects %s', (u, why) => expect(checkLongUrl(u, BASE)).toContain(why));
});

describe('hashRequest', () => {
  it('is stable and treats missing expiresAt as null', () => {
    expect(hashRequest({ longUrl: 'https://a.com' })).toBe(hashRequest({ longUrl: 'https://a.com', expiresAt: null }));
  });
  it('differs when the payload differs', () => {
    expect(hashRequest({ longUrl: 'https://a.com' })).not.toBe(hashRequest({ longUrl: 'https://b.com' }));
  });
});

describe('cursor', () => {
  it('round-trips', () => expect(decodeCursor(encodeCursor('12345'))).toBe('12345'));
  it('keeps BIGINT precision (string, not Number)', () => {
    const big = '18446744073709551615';
    expect(decodeCursor(encodeCursor(big))).toBe(big);
  });
  it.each(['', '!!!', Buffer.from('abc').toString('base64url'), Buffer.from('0').toString('base64url'),
    Buffer.from('1 OR 1=1').toString('base64url')])('rejects garbage %j', (c) => {
    expect(() => decodeCursor(c)).toThrow(/Cursor is not valid/);
  });
});
````

*File: `tests/unit/linkService.test.js`*

````js
import { describe, it, expect, vi } from 'vitest';
import { createLinkService } from '../../src/modules/links/links.service.js';

const config = {
  BASE_URL: 'http://short.test',
  CACHE_ENABLED: true,
  CACHE_TTL_SECONDS: 3600,
  NEGATIVE_CACHE_TTL_SECONDS: 60,
};
const logger = { info: vi.fn(), error: vi.fn() };

// A fake at the boundary we own (the DB handle). Duplicate-key behaviour is
// exactly what we want to test, and it is awkward to force with a real DB.
function fakeConn(takenCodes) {
  return {
    execute: vi.fn(async (sql, params) => {
      if (sql.startsWith('INSERT')) {
        if (takenCodes.has(params[0])) throw Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' });
        takenCodes.add(params[0]);
        return [{ insertId: 1 }];
      }
      return [[{ code: [...takenCodes].pop(), long_url: 'https://a.com', expires_at: null, created_at: new Date(0), clicks: 0 }]];
    }),
  };
}

describe('LinkService.create code allocation', () => {
  it('retries with a new code after a collision', async () => {
    const codes = ['AAAAAAA', 'AAAAAAA', 'BBBBBBB'];
    const conn = fakeConn(new Set(['AAAAAAA']));
    const svc = createLinkService({ pool: conn, redis: {}, config, logger, generateCode: () => codes.shift() });
    const link = await svc.create({ ownerId: '1', longUrl: 'https://a.com' }, conn);
    expect(link.code).toBe('BBBBBBB');
    expect(conn.execute.mock.calls.filter(([s]) => s.startsWith('INSERT'))).toHaveLength(3);
  });

  it('gives up with 503 after 5 collisions instead of looping forever', async () => {
    const conn = fakeConn(new Set(['AAAAAAA']));
    const svc = createLinkService({ pool: conn, redis: {}, config, logger, generateCode: () => 'AAAAAAA' });
    await expect(svc.create({ ownerId: '1', longUrl: 'https://a.com' }, conn)).rejects.toMatchObject({
      status: 503,
      code: 'CODE_ALLOCATION_FAILED',
    });
    expect(conn.execute).toHaveBeenCalledTimes(5);
  });

  it('does not swallow non-duplicate database errors', async () => {
    const conn = { execute: vi.fn().mockRejectedValue(Object.assign(new Error('boom'), { code: 'ER_LOCK_DEADLOCK' })) };
    const svc = createLinkService({ pool: conn, redis: {}, config, logger, generateCode: () => 'CCCCCCC' });
    await expect(svc.create({ ownerId: '1', longUrl: 'https://a.com' }, conn)).rejects.toThrow('boom');
    expect(conn.execute).toHaveBeenCalledTimes(1);
  });

  it('never hands out a reserved code', async () => {
    const codes = ['healthz', 'DDDDDDD'];
    const conn = fakeConn(new Set());
    const svc = createLinkService({ pool: conn, redis: {}, config, logger, generateCode: () => codes.shift() });
    expect((await svc.create({ ownerId: '1', longUrl: 'https://a.com' }, conn)).code).toBe('DDDDDDD');
  });
});

describe('LinkService.resolve with a broken cache', () => {
  it('falls back to MySQL when Redis throws (fail open)', async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error('redis down')),
      set: vi.fn().mockRejectedValue(new Error('redis down')),
    };
    const pool = { execute: vi.fn().mockResolvedValue([[{ long_url: 'https://a.com', expires_at: null }]]) };
    const svc = createLinkService({ pool, redis, config, logger });
    await expect(svc.resolve('abc1234')).resolves.toMatchObject({ status: 'ok', longUrl: 'https://a.com', cache: 'MISS' });
  });
});
````

*File: `tests/unit/errorHandler.test.js`*

````js
import { describe, it, expect, vi } from 'vitest';
import { ZodError, z } from 'zod';
import { createErrorHandler } from '../../src/middleware/errorHandler.js';
import { AppError } from '../../src/errors.js';

function run(err) {
  const logger = { info: vi.fn(), error: vi.fn() };
  const res = {
    locals: { requestId: 'req-12345678' },
    headersSent: false,
    statusCode: 200,
    headers: {},
    body: null,
    set(h) { Object.assign(this.headers, h); return this; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  createErrorHandler(logger)(err, { path: '/x' }, res, vi.fn());
  return { res, logger };
}

describe('error handler', () => {
  it('AppError -> its status and code, with requestId', () => {
    const { res } = run(new AppError(409, 'EMAIL_TAKEN', 'taken'));
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: { code: 'EMAIL_TAKEN', message: 'taken', requestId: 'req-12345678' } });
  });

  it('AppError with headers (429) sets Retry-After', () => {
    const e = new AppError(429, 'RATE_LIMITED', 'slow');
    e.headers = { 'Retry-After': '7' };
    expect(run(e).res.headers['Retry-After']).toBe('7');
  });

  it('ZodError -> 400 with per-field details', () => {
    const parsed = z.object({ a: z.string() }).safeParse({});
    const { res } = run(parsed.error);
    expect(parsed.error).toBeInstanceOf(ZodError);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details[0].field).toBe('a');
  });

  it('body too large -> 413', () => {
    expect(run(Object.assign(new Error('big'), { type: 'entity.too.large' })).res.statusCode).toBe(413);
  });

  it('unexpected error -> 500 INTERNAL, logged, and NOTHING leaks to the client', () => {
    const { res, logger } = run(new Error("ER_PARSE_ERROR near 'SELECT secret FROM users'"));
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toEqual({ code: 'INTERNAL', message: 'Something went wrong', requestId: 'req-12345678' });
    expect(JSON.stringify(res.body)).not.toContain('SELECT');
    expect(logger.error).toHaveBeenCalledWith('unhandled_error', expect.objectContaining({ error: expect.stringContaining('ER_PARSE_ERROR') }));
  });
});
````

*File: `tests/unit/openapi.test.js`*

````js
import { describe, it, expect } from 'vitest';
import SwaggerParser from '@apidevtools/swagger-parser';

// The OpenAPI file is a contract. At minimum it must be a VALID OpenAPI 3.1
// document and document every route the server implements.
describe('openapi.yaml', () => {
  it('is a valid OpenAPI document', async () => {
    const api = await SwaggerParser.validate('openapi.yaml');
    expect(api.openapi).toMatch(/^3\.1/);
  });

  it('documents every implemented route', async () => {
    const api = await SwaggerParser.parse('openapi.yaml');
    const documented = Object.entries(api.paths).flatMap(([p, ops]) =>
      Object.keys(ops).filter((m) => ['get', 'post', 'delete', 'put', 'patch'].includes(m)).map((m) => `${m.toUpperCase()} ${p}`));
    expect(documented.sort()).toEqual([
      'DELETE /v1/links/{code}',
      'GET /healthz',
      'GET /readyz',
      'GET /v1/links',
      'GET /v1/links/{code}/stats',
      'GET /{code}',
      'POST /v1/auth/login',
      'POST /v1/auth/register',
      'POST /v1/links',
    ]);
  });
});
````

Why `linkService.test.js` uses a fake DB handle: forcing `ER_DUP_ENTRY` five times in a row with a
real MySQL is impractical. A fake at the boundary we own is the right tool; the "real" duplicate
behaviour is covered by the unique index and by the 10-parallel idempotency test.

**Integration tests**

*File: `tests/integration/auth.test.js`*

````js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { buildTestContext } from '../helpers.js';

describe('auth', () => {
  let ctx;
  beforeAll(() => { ctx = buildTestContext(); });
  afterAll(() => ctx.close());
  beforeEach(() => ctx.reset());

  const creds = { email: 'Alice@Example.com', password: 'correct-horse-battery' };

  it('registers (email normalised), logs in, and the token works', async () => {
    const reg = await request(ctx.app).post('/v1/auth/register').send(creds).expect(201);
    expect(reg.body.email).toBe('alice@example.com');
    expect(reg.body).not.toHaveProperty('password');
    expect(reg.body).not.toHaveProperty('password_hash');

    const login = await request(ctx.app).post('/v1/auth/login').send(creds).expect(200);
    expect(login.body).toMatchObject({ tokenType: 'Bearer', expiresIn: 3600 });

    await request(ctx.app).get('/v1/links').set('Authorization', `Bearer ${login.body.accessToken}`).expect(200);
  });

  it('stores a bcrypt hash, never the password', async () => {
    await request(ctx.app).post('/v1/auth/register').send(creds).expect(201);
    const [rows] = await ctx.pool.query('SELECT password_hash FROM users');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$04\$/);
    expect(rows[0].password_hash).not.toContain(creds.password);
  });

  it('409 EMAIL_TAKEN on duplicate, case-insensitively', async () => {
    await request(ctx.app).post('/v1/auth/register').send(creds).expect(201);
    const res = await request(ctx.app)
      .post('/v1/auth/register').send({ ...creds, email: 'ALICE@example.com' }).expect(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('wrong password and unknown email give the SAME 401 body', async () => {
    await request(ctx.app).post('/v1/auth/register').send(creds).expect(201);
    const wrong = await request(ctx.app).post('/v1/auth/login').send({ ...creds, password: 'wrong-password-1' }).expect(401);
    const unknown = await request(ctx.app).post('/v1/auth/login').send({ email: 'nobody@example.com', password: 'wrong-password-1' }).expect(401);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });

  it('400 VALIDATION_FAILED with per-field details', async () => {
    const res = await request(ctx.app).post('/v1/auth/register').send({ email: 'nope', password: 'short' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['email', 'password']);
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('400 INVALID_JSON for a malformed body', async () => {
    const res = await request(ctx.app).post('/v1/auth/login')
      .set('Content-Type', 'application/json').send('{"email": ').expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['garbage token', 'Bearer not.a.jwt'],
  ])('protected route rejects %s', async (_name, header) => {
    const req = request(ctx.app).get('/v1/links');
    if (header) req.set('Authorization', header);
    const res = await req.expect(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects an expired token and a token signed with another key', async () => {
    const expired = jwt.sign({}, ctx.config.JWT_SECRET, { subject: '1', expiresIn: -10 });
    const forged = jwt.sign({}, 'x'.repeat(40), { subject: '1' });
    await request(ctx.app).get('/v1/links').set('Authorization', `Bearer ${expired}`).expect(401);
    await request(ctx.app).get('/v1/links').set('Authorization', `Bearer ${forged}`).expect(401);
  });

  it('rejects alg=none tokens', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: '1' })).toString('base64url');
    await request(ctx.app).get('/v1/links').set('Authorization', `Bearer ${header}.${body}.`).expect(401);
  });
});
````

*File: `tests/integration/links.test.js`*

````js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { buildTestContext, signUp } from '../helpers.js';

describe('links', () => {
  let ctx;
  let alice;
  beforeAll(() => { ctx = buildTestContext(); });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await ctx.reset();
    alice = await signUp(request, ctx.app);
  });

  const create = (body, auth = alice.auth) =>
    request(ctx.app).post('/v1/links').set('Authorization', auth).send(body);

  describe('create', () => {
    it('201 with a 7 char code, Location header and the documented shape', async () => {
      const res = await create({ longUrl: 'https://example.com/a?b=c' }).expect(201);
      expect(res.body).toMatchObject({
        longUrl: 'https://example.com/a?b=c', expiresAt: null, clicks: 0,
      });
      expect(res.body.code).toMatch(/^[0-9A-Za-z]{7}$/);
      expect(res.body.shortUrl).toBe(`http://short.test/${res.body.code}`);
      expect(res.headers.location).toBe(res.body.shortUrl);
    });

    it('401 without a token', async () => {
      await request(ctx.app).post('/v1/links').send({ longUrl: 'https://example.com' }).expect(401);
    });

    it.each([
      ['javascript scheme', { longUrl: 'javascript:alert(1)' }],
      ['not a url', { longUrl: 'hello' }],
      ['missing longUrl', {}],
      ['too long', { longUrl: `https://example.com/${'a'.repeat(2100)}` }],
      ['own host (loop)', { longUrl: 'http://short.test/abcdefg' }],
      ['past expiry', { longUrl: 'https://example.com', expiresAt: '2020-01-01T00:00:00Z' }],
      ['bad expiry format', { longUrl: 'https://example.com', expiresAt: 'tomorrow' }],
      ['unknown field', { longUrl: 'https://example.com', owner: 'me' }],
    ])('400 for %s', async (_name, body) => {
      const res = await create(body).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
    });

    it('survives SQL-injection-looking input (parameterised queries)', async () => {
      const evil = "https://example.com/?q=' OR 1=1; DROP TABLE links;--";
      const res = await create({ longUrl: evil }).expect(201);
      const [rows] = await ctx.pool.query('SELECT long_url FROM links WHERE code = ?', [res.body.code]);
      expect(rows[0].long_url).toBe(evil); // stored verbatim, as data, never executed
      const [[{ n }]] = await ctx.pool.query('SELECT COUNT(*) AS n FROM links');
      expect(n).toBe(1);
    });
  });

  describe('redirect', () => {
    it('302 to the long URL, MISS first then HIT from Redis', async () => {
      const { body } = await create({ longUrl: 'https://example.com/landing' }).expect(201);

      const first = await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302);
      expect(first.headers.location).toBe('https://example.com/landing');
      expect(first.headers['x-cache']).toBe('MISS');

      const second = await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302);
      expect(second.headers['x-cache']).toBe('HIT');
      expect(await ctx.redis.exists(`link:${body.code}`)).toBe(1);
    });

    it('is case sensitive: a different-case code is a different (missing) link', async () => {
      const { body } = await create({ longUrl: 'https://example.com/' }).expect(201);
      const swapped = body.code.replace(/[a-z]/gi, (c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()));
      if (swapped !== body.code) await request(ctx.app).get(`/${swapped}`).expect(404);
    });

    it('404 for unknown and malformed codes, and caches the miss', async () => {
      const r = await request(ctx.app).get('/zzzzzzz').expect(404);
      expect(r.body.error.code).toBe('NOT_FOUND');
      expect(await ctx.redis.get('link:zzzzzzz')).toBe('{"m":1}');
      await request(ctx.app).get('/short').expect(404);
      await request(ctx.app).get('/waaaaaaaaay-too-long').expect(404);
      expect(await ctx.redis.exists('link:short')).toBe(0); // malformed never touches the cache
    });

    it('creating a link clears an earlier negative cache entry', async () => {
      await ctx.redis.set('link:abcdefg', '{"m":1}');
      const gen = buildTestContext({ generateCode: () => 'abcdefg' });
      try {
        const a = await signUp(request, gen.app);
        await request(gen.app).post('/v1/links').set('Authorization', a.auth)
          .set('Idempotency-Key', 'key-for-negative-cache').send({ longUrl: 'https://example.com/n' }).expect(201);
        expect(await gen.redis.exists('link:abcdefg')).toBe(0);
      } finally {
        await gen.close();
      }
    });

    it('redirect still works when Redis cache entry is gone (falls back to MySQL)', async () => {
      const { body } = await create({ longUrl: 'https://example.com/x' }).expect(201);
      await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302);
      await ctx.redis.flushdb();
      const res = await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302);
      expect(res.headers['x-cache']).toBe('MISS');
    });

    it('410 once a link has expired, even when served from cache', async () => {
      const expiresAt = new Date(Date.now() + 1500).toISOString();
      const { body } = await create({ longUrl: 'https://example.com/soon', expiresAt }).expect(201);

      const live = await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302);
      expect(live.headers['x-cache']).toBe('MISS');
      expect(await ctx.redis.ttl(`link:${body.code}`)).toBeLessThanOrEqual(2); // TTL capped by expiry

      await new Promise((r) => setTimeout(r, 1700));
      const dead = await request(ctx.app).get(`/${body.code}`).expect(410);
      expect(dead.headers['x-cache']).toBe('HIT'); // the cache entry carried the expiry
      expect(dead.body.error.code).toBe('LINK_EXPIRED');
    });

    it('counts clicks in Redis and flushes them to MySQL', async () => {
      const { body } = await create({ longUrl: 'https://example.com/c' }).expect(201);
      for (let i = 0; i < 3; i += 1) await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302);
      await request(ctx.app).head(`/${body.code}`).redirects(0).expect(302); // HEAD is not a click

      await expect.poll(() => ctx.redis.hget('clicks:pending', body.code)).toBe('3');
      const before = await request(ctx.app).get(`/v1/links/${body.code}/stats`).set('Authorization', alice.auth).expect(200);
      expect(before.body).toMatchObject({ totalClicks: 3, flushedClicks: 0 });

      expect(await ctx.links.flushClicks()).toBe(3);
      const after = await request(ctx.app).get(`/v1/links/${body.code}/stats`).set('Authorization', alice.auth).expect(200);
      expect(after.body).toMatchObject({ totalClicks: 3, flushedClicks: 3, expired: false });
    });
  });

  describe('ownership', () => {
    it('another user gets 404 for stats and delete, and the link survives', async () => {
      const { body } = await create({ longUrl: 'https://example.com/mine' }).expect(201);
      const bob = await signUp(request, ctx.app);

      await request(ctx.app).get(`/v1/links/${body.code}/stats`).set('Authorization', bob.auth).expect(404);
      await request(ctx.app).delete(`/v1/links/${body.code}`).set('Authorization', bob.auth).expect(404);
      await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302);
    });

    it('list shows only my links', async () => {
      const bob = await signUp(request, ctx.app);
      await create({ longUrl: 'https://example.com/a' }).expect(201);
      await create({ longUrl: 'https://example.com/b' }, bob.auth).expect(201);
      const res = await request(ctx.app).get('/v1/links').set('Authorization', alice.auth).expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].longUrl).toBe('https://example.com/a');
    });
  });

  describe('delete', () => {
    it('204, then the link is 404 immediately even though it was cached', async () => {
      const { body } = await create({ longUrl: 'https://example.com/d' }).expect(201);
      await request(ctx.app).get(`/${body.code}`).redirects(0).expect(302); // warm the cache
      await request(ctx.app).delete(`/v1/links/${body.code}`).set('Authorization', alice.auth).expect(204);
      await request(ctx.app).get(`/${body.code}`).expect(404);
      await request(ctx.app).delete(`/v1/links/${body.code}`).set('Authorization', alice.auth).expect(404);
    });
  });

  describe('pagination (keyset / cursor)', () => {
    it('walks 5 links in pages of 2 without gaps or duplicates, newest first', async () => {
      const made = [];
      for (let i = 0; i < 5; i += 1) {
        made.push((await create({ longUrl: `https://example.com/${i}` }).expect(201)).body.code);
      }
      const seen = [];
      let cursor;
      let pages = 0;
      do {
        const q = cursor ? `?limit=2&cursor=${cursor}` : '?limit=2';
        const res = await request(ctx.app).get(`/v1/links${q}`).set('Authorization', alice.auth).expect(200);
        seen.push(...res.body.data.map((l) => l.code));
        cursor = res.body.page.nextCursor;
        pages += 1;
      } while (cursor);
      expect(pages).toBe(3);
      expect(seen).toEqual([...made].reverse());
    });

    it('a link created between page 1 and page 2 does not shift page 2', async () => {
      for (let i = 0; i < 4; i += 1) await create({ longUrl: `https://example.com/${i}` }).expect(201);
      const p1 = await request(ctx.app).get('/v1/links?limit=2').set('Authorization', alice.auth).expect(200);
      await create({ longUrl: 'https://example.com/new' }).expect(201); // offset pagination would repeat a row here
      const p2 = await request(ctx.app).get(`/v1/links?limit=2&cursor=${p1.body.page.nextCursor}`)
        .set('Authorization', alice.auth).expect(200);
      const all = [...p1.body.data, ...p2.body.data].map((l) => l.code);
      expect(new Set(all).size).toBe(4);
    });

    it.each(['limit=0', 'limit=101', 'limit=abc', 'cursor=%21%21%21'])('400 for %s', async (q) => {
      await request(ctx.app).get(`/v1/links?${q}`).set('Authorization', alice.auth).expect(400);
    });
  });

  describe('error contract', () => {
    it('unknown route -> same envelope', async () => {
      const res = await request(ctx.app).get('/v1/nope/nothing').expect(404);
      expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
      expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
    });

    it('echoes a caller supplied X-Request-Id', async () => {
      const res = await request(ctx.app).get('/nope1234').set('X-Request-Id', 'trace-abc-12345').expect(404);
      expect(res.body.error.requestId).toBe('trace-abc-12345');
    });
  });

  describe('health', () => {
    it('healthz and readyz', async () => {
      await request(ctx.app).get('/healthz').expect(200);
      const res = await request(ctx.app).get('/readyz').expect(200);
      expect(res.body.checks).toEqual({ mysql: 'ok', redis: 'ok' });
    });
  });
});
````

*File: `tests/integration/idempotency.test.js`*

````js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { buildTestContext, signUp } from '../helpers.js';

describe('Idempotency-Key on POST /v1/links', () => {
  let ctx;
  let alice;
  beforeAll(() => { ctx = buildTestContext(); });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await ctx.reset();
    alice = await signUp(request, ctx.app);
  });

  const post = (key, body, auth = alice.auth) =>
    request(ctx.app).post('/v1/links').set('Authorization', auth).set('Idempotency-Key', key).send(body);
  const count = async () => (await ctx.pool.query('SELECT COUNT(*) AS n FROM links'))[0][0].n;

  it('same key + same body -> same link, created once, replay flagged', async () => {
    const body = { longUrl: 'https://example.com/once' };
    const first = await post('key-aaaaaaaa-1', body).expect(201);
    const second = await post('key-aaaaaaaa-1', body).expect(201);
    expect(second.body).toEqual(first.body);
    expect(first.headers['idempotent-replayed']).toBeUndefined();
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(await count()).toBe(1);
  });

  it('same key + different body -> 422 IDEMPOTENCY_KEY_REUSED, nothing created', async () => {
    await post('key-aaaaaaaa-2', { longUrl: 'https://example.com/a' }).expect(201);
    const res = await post('key-aaaaaaaa-2', { longUrl: 'https://example.com/b' }).expect(422);
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await count()).toBe(1);
  });

  it('different key -> a second link', async () => {
    const body = { longUrl: 'https://example.com/same' };
    const a = await post('key-aaaaaaaa-3', body).expect(201);
    const b = await post('key-aaaaaaaa-4', body).expect(201);
    expect(a.body.code).not.toBe(b.body.code);
    expect(await count()).toBe(2);
  });

  it('keys are scoped per user', async () => {
    const bob = await signUp(request, ctx.app);
    const body = { longUrl: 'https://example.com/shared-key' };
    const a = await post('key-aaaaaaaa-5', body).expect(201);
    const b = await post('key-aaaaaaaa-5', body, bob.auth).expect(201);
    expect(a.body.code).not.toBe(b.body.code);
  });

  it('10 PARALLEL requests with one key create exactly one link', async () => {
    const body = { longUrl: 'https://example.com/race' };
    const results = await Promise.all(Array.from({ length: 10 }, () => post('key-aaaaaaaa-6', body)));
    expect(results.map((r) => r.status)).toEqual(Array(10).fill(201));
    expect(new Set(results.map((r) => r.body.code)).size).toBe(1);
    expect(await count()).toBe(1);
    expect(results.filter((r) => r.headers['idempotent-replayed'] === 'true')).toHaveLength(9);
  });

  it('a failed request does not burn the key', async () => {
    // Validation fails before the key is used, so the same key works afterwards.
    await post('key-aaaaaaaa-7', { longUrl: 'nope' }).expect(400);
    await post('key-aaaaaaaa-7', { longUrl: 'https://example.com/ok' }).expect(201);
  });

  it('400 for a malformed key', async () => {
    const res = await post('short', { longUrl: 'https://example.com/' }).expect(400);
    expect(res.body.error.code).toBe('INVALID_IDEMPOTENCY_KEY');
  });
});
````

*File: `tests/integration/rateLimit.test.js`*

````js
import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import Redis from 'ioredis';
import request from 'supertest';
import { inject } from 'vitest';
import { buildTestContext, signUp } from '../helpers.js';
import { createApp } from '../../src/app.js';
import { createPool } from '../../src/db/pool.js';
import { loadConfig } from '../../src/config.js';
import { createLogger } from '../../src/logger.js';

describe('rate limiting', () => {
  const ctx = buildTestContext({
    env: { RATE_LIMIT_CREATE_MAX: '3', RATE_LIMIT_REDIRECT_MAX: '5', RATE_LIMIT_WINDOW_SECONDS: '2' },
  });
  afterAll(() => ctx.close());
  beforeEach(() => ctx.reset());

  it('create: allows 3 per window per user, then 429 with Retry-After, other users unaffected', async () => {
    const alice = await signUp(request, ctx.app);
    const bob = await signUp(request, ctx.app);
    const post = (auth) => request(ctx.app).post('/v1/links').set('Authorization', auth).send({ longUrl: 'https://example.com/' });

    const statuses = [];
    for (let i = 0; i < 4; i += 1) statuses.push((await post(alice.auth)).status);
    expect(statuses).toEqual([201, 201, 201, 429]);

    const blocked = await post(alice.auth).expect(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThanOrEqual(1);
    expect(blocked.headers['x-ratelimit-limit']).toBe('3');
    expect(blocked.headers['x-ratelimit-remaining']).toBe('0');

    await post(bob.auth).expect(201);
  });

  it('window slides: capacity returns once old requests age out', async () => {
    const alice = await signUp(request, ctx.app);
    const post = () => request(ctx.app).post('/v1/links').set('Authorization', alice.auth).send({ longUrl: 'https://example.com/' });
    for (let i = 0; i < 3; i += 1) await post().expect(201);
    await post().expect(429);
    await new Promise((r) => setTimeout(r, 2100));
    await post().expect(201);
  });

  it('redirect: limited per IP', async () => {
    const alice = await signUp(request, ctx.app);
    // creating links burns create-quota, so insert directly
    await ctx.pool.query("INSERT INTO links (code, long_url, owner_id) SELECT 'abcdefg', 'https://example.com/', id FROM users LIMIT 1");
    const statuses = [];
    for (let i = 0; i < 7; i += 1) statuses.push((await request(ctx.app).get('/abcdefg').redirects(0)).status);
    expect(statuses).toEqual([302, 302, 302, 302, 302, 429, 429]);
    expect(alice.auth).toBeTruthy();
  });

  it('is atomic under concurrency: 20 parallel requests, limit 5 -> exactly 5 pass', async () => {
    await ctx.pool.query("INSERT INTO users (email, password_hash) VALUES ('a@b.co','x')");
    await ctx.pool.query("INSERT INTO links (code, long_url, owner_id) SELECT 'abcdefg', 'https://example.com/', id FROM users LIMIT 1");
    const results = await Promise.all(Array.from({ length: 20 }, () => request(ctx.app).get('/abcdefg').redirects(0)));
    expect(results.filter((r) => r.status === 302)).toHaveLength(5);
    expect(results.filter((r) => r.status === 429)).toHaveLength(15);
  });

  it('fails OPEN when Redis is unreachable (API keeps working, redirects fall back to MySQL)', async () => {
    const config = loadConfig({
      NODE_ENV: 'test', DATABASE_URL: inject('databaseUrl'), REDIS_URL: 'redis://127.0.0.1:1',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123', BCRYPT_COST: '4', LOG_LEVEL: 'silent',
    });
    const deadRedis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 0, enableOfflineQueue: false, retryStrategy: () => null, lazyConnect: true });
    deadRedis.on('error', () => {});
    const pool = createPool(config);
    const app = createApp({ config, pool, redis: deadRedis, logger: createLogger('silent') });
    try {
      await ctx.pool.query("INSERT INTO users (email, password_hash) VALUES ('c@d.co','x')");
      await ctx.pool.query("INSERT INTO links (code, long_url, owner_id) SELECT 'hijklmn', 'https://example.com/live', id FROM users LIMIT 1");
      const res = await request(app).get('/hijklmn').redirects(0).expect(302);
      expect(res.headers.location).toBe('https://example.com/live');
      expect(res.headers['x-cache']).toBe('MISS');
      const ready = await request(app).get('/readyz').expect(200);
      expect(ready.body.checks).toEqual({ mysql: 'ok', redis: 'down' });
    } finally {
      await pool.end();
      deadRedis.disconnect();
    }
  });
});
````

*File: `tests/integration/cleanup.test.js`*

````js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildTestContext } from '../helpers.js';
import { deleteExpiredLinks, deleteOldIdempotencyKeys, runCleanup } from '../../src/jobs/cleanup.js';
import { createLogger } from '../../src/logger.js';

describe('cleanup job', () => {
  let ctx;
  const DAY = 86_400_000;
  beforeAll(() => { ctx = buildTestContext(); });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await ctx.reset();
    await ctx.pool.query("INSERT INTO users (id, email, password_hash) VALUES (1, 'u@x.co', 'x')");
  });

  const insert = (code, expiresAt) =>
    ctx.pool.execute('INSERT INTO links (code, long_url, owner_id, expires_at) VALUES (?, ?, 1, ?)',
      [code, 'https://example.com/', expiresAt]);
  const codes = async () => (await ctx.pool.query('SELECT code FROM links ORDER BY code'))[0].map((r) => r.code);

  it('deletes links expired longer than the grace period, keeps the rest', async () => {
    const now = new Date();
    await insert('old0000', new Date(now - 10 * DAY)); // expired 10d ago  -> delete
    await insert('recent0', new Date(now - 1 * DAY));  // expired 1d ago   -> keep (grace 7d)
    await insert('future0', new Date(now + 1 * DAY));  // not expired      -> keep
    await insert('forever', null);                      // never expires    -> keep
    expect(await deleteExpiredLinks(ctx.pool, { graceDays: 7, now })).toBe(1);
    expect(await codes()).toEqual(['forever', 'future0', 'recent0']);
  });

  it('works in batches (2500 rows > 2 batches of 1000)', async () => {
    const old = new Date(Date.now() - 30 * DAY);
    const rows = Array.from({ length: 2500 }, (_, i) => [`b${String(i).padStart(6, '0')}`, 'https://example.com/', 1, old]);
    await ctx.pool.query('INSERT INTO links (code, long_url, owner_id, expires_at) VALUES ?', [rows]);
    expect(await deleteExpiredLinks(ctx.pool, { graceDays: 7 })).toBe(2500);
    expect(await codes()).toEqual([]);
  });

  it('deletes idempotency keys older than 24h', async () => {
    await ctx.pool.query("INSERT INTO idempotency_keys (user_id, idem_key, request_hash, created_at) VALUES (1,'old-key-1','h', NOW(3) - INTERVAL 2 DAY), (1,'new-key-1','h', NOW(3))");
    expect(await deleteOldIdempotencyKeys(ctx.pool, {})).toBe(1);
  });

  it('only one instance sweeps at a time (Redis lock)', async () => {
    await ctx.redis.set('lock:cleanup', 'someone-else', 'PX', 5000);
    const deps = { pool: ctx.pool, redis: ctx.redis, config: ctx.config, logger: createLogger('silent') };
    expect(await runCleanup(deps)).toBeNull();
    await ctx.redis.del('lock:cleanup');
    expect(await runCleanup(deps)).toEqual({ links: 0, keys: 0 });
    expect(await ctx.redis.exists('lock:cleanup')).toBe(0); // released
  });
});
````

### How to run and real output

```bash
npm run test:unit            # no Docker needed
npm run test:integration     # Testcontainers starts MySQL + Redis
npm test                     # both
```

Real output of `npx vitest run` (NO_COLOR, per-test lines removed, check marks changed to [OK]):

```text
 [OK] |integration| tests/integration/links.test.js (30 tests) 31710ms
 [OK] |integration| tests/integration/auth.test.js (11 tests) 11326ms
 [OK] |integration| tests/integration/rateLimit.test.js (5 tests) 23805ms
 [OK] |integration| tests/integration/idempotency.test.js (7 tests) 8588ms
 [OK] |integration| tests/integration/cleanup.test.js (4 tests) 2195ms
 [OK] |unit| tests/unit/openapi.test.js (2 tests) 667ms
 [OK] |unit| tests/unit/code.test.js (14 tests) 710ms
 [OK] |unit| tests/unit/errorHandler.test.js (5 tests) 40ms
 [OK] |unit| tests/unit/linkService.test.js (5 tests) 39ms
 [OK] |unit| tests/unit/urls.test.js (19 tests) 15ms
 [OK] |unit| tests/unit/cacheEntry.test.js (9 tests) 15ms
 Test Files  11 passed (11)
      Tests  111 passed (111)
   Start at  12:57:42
   Duration  251.53s (transform 657ms, setup 0ms, collect 13.88s, tests 79.11s, environment 10ms, prepare 3.97s)
```

Duration note: this host was running ~40 other containers (several MySQL instances at 100 percent CPU),
so the wall clock varied between 4 and 11 minutes across my runs (252 s for the run shown; one earlier run
took 679 s for the same 111 tests). On a quiet laptop it should be far faster. Do not read anything into the
absolute times; most of it is Docker Desktop being starved, not the code.

CI-mode run (the GitHub Actions path): the same integration suite with `TEST_DATABASE_URL` and
`TEST_REDIS_URL` pointing at the already-running compose containers, so Testcontainers is skipped:

```text
 [OK] |integration| tests/integration/links.test.js (30 tests) 44000ms
 [OK] |integration| tests/integration/rateLimit.test.js (5 tests) 6472ms
 [OK] |integration| tests/integration/auth.test.js (11 tests) 5328ms
 [OK] |integration| tests/integration/idempotency.test.js (7 tests) 6740ms
 [OK] |integration| tests/integration/cleanup.test.js (4 tests) 4371ms
 Test Files  5 passed (5)
      Tests  57 passed (57)
   Start at  13:02:06
   Duration  99.81s (transform 312ms, setup 0ms, collect 11.03s, tests 66.91s, environment 3ms, prepare 2.19s)
```

**Key concepts to remember**

- Real dependencies for I/O behaviour, fakes only at your own seams.
- Concurrency bugs need concurrent tests (`Promise.all` of 10 requests).
- Time-based behaviour: use short real expiries (1.5 s) or inject the clock; never `sleep` blindly for long.

**Revision questions**

1. Why do the unit and integration suites run as two Vitest projects?
2. Why does `reset()` TRUNCATE instead of recreating the database per test? What would you do for parallel files?
3. What would a mock of `mysql2` have failed to catch in the idempotency race test?
4. How would you find the source of a flaky integration test?
5. Our "expired" test sleeps 1.7 s. How would you remove the sleep?

**Practical task**: add a test proving `GET /:code` uses MySQL exactly once for 50 sequential
redirects (spy on `pool.execute`). Then write the stampede test from Stage 4's task.

**Self-check**

- [ ] I can run unit tests without Docker and integration tests with it.
- [ ] I can explain for each integration test which real behaviour a mock would have hidden.

---

## Stage 9 - Docker (multi-stage, non-root), compose, CI

**Learning objectives**

- Multi-stage build, layer caching, small image, non-root, signals.
- Compose with health checks and a one-shot migration service.
- A CI pipeline that runs the same tests with service containers.

### Requirements

- Image runs as a non-root user, contains only production dependencies and source.
- `docker compose up --build` starts MySQL, Redis, applies the schema, then starts the app, in the right order.
- Redis in compose is a pure cache: no persistence, bounded memory, LRU eviction.
- CI: unit + integration on Node 20 and 22, plus a Docker build and a "not root" check.

### Acceptance criteria

- [ ] `docker run --rm --entrypoint id <image>` prints `uid=1000(node)`.
- [ ] PID 1 in the container is `node src/server.js` (not `npm`, not a shell), so SIGTERM works.
- [ ] `docker compose ps` shows app, mysql, redis healthy; migrate exited 0.
- [ ] `.dockerignore` keeps `.env`, `.git`, `tests` out of the build context.

### Interview concepts

`[ESSENTIAL]` multi-stage builds, layer cache order (deps before source), `npm ci --omit=dev`, non-root user,
exec-form `CMD` and PID 1 signal handling, `HEALTHCHECK`, `depends_on` with `service_healthy` /
`service_completed_successfully`, secrets and env (never bake secrets into images), `.dockerignore`.
`[ADVANCED]` distroless images, `tini`/`--init`, BuildKit cache mounts, image scanning, SBOM, read-only root filesystem.

### Files

**Dockerfile** and **.dockerignore**

*File: `Dockerfile`*

````dockerfile
# syntax=docker/dockerfile:1

# ---- Stage 1: production dependencies only ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci = exact versions from the lockfile; --omit=dev keeps test tools out of the image
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---- Stage 2: runtime ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# node_modules first (changes rarely), source last (changes often) => better layer caching
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node db ./db
# The official image ships an unprivileged "node" user (uid 1000). Never run as root.
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# exec form + node directly (no npm): SIGTERM reaches our process for graceful shutdown
CMD ["node", "src/server.js"]
````

*File: `.dockerignore`*

````text
node_modules
.git
.github
.env
.env.*
!.env.example
tests
scripts
coverage
*.md
Dockerfile
docker-compose.yml
openapi.yaml
````

**docker-compose.yml**

*File: `docker-compose.yml`*

````yaml
# docker compose up --build
# App:   http://localhost:3018      MySQL: localhost:33067      Redis: localhost:63794
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: shortener
      MYSQL_USER: app
      MYSQL_PASSWORD: app_pw
      MYSQL_ROOT_PASSWORD: root_pw
    ports: ["33067:3306"]
    volumes: ["mysql-data:/var/lib/mysql"]
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uapp", "-papp_pw"]
      interval: 5s
      timeout: 3s
      retries: 20
      start_period: 20s

  redis:
    image: redis:7-alpine
    # cache only: no persistence needed, bounded memory, evict least-recently-used keys
    command: ["redis-server", "--save", "", "--appendonly", "no", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru"]
    ports: ["63794:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  # One-shot job: apply the (idempotent) schema, then exit 0.
  migrate:
    build: .
    command: ["node", "src/db/migrate.js"]
    environment: &app-env
      NODE_ENV: production
      PORT: "3000"
      BASE_URL: http://localhost:3018
      DATABASE_URL: mysql://app:app_pw@mysql:3306/shortener
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-dev-only-secret-dev-only-secret-dev-only-1234}
    depends_on:
      mysql: { condition: service_healthy }
    restart: "no"

  app:
    build: .
    environment: *app-env
    ports: ["3018:3000"]
    depends_on:
      migrate: { condition: service_completed_successfully }
      redis: { condition: service_healthy }
    restart: unless-stopped

volumes:
  mysql-data:
````

Compose notes: `migrate` ek one-shot service hai (same image, different command). `app` us par
`service_completed_successfully` se depend karta hai, isliye app tabhi start hoti hai jab schema lag
chuka ho. `&app-env` / `*app-env` YAML anchor hai: env ek jagah define. Ports host par `33067`
(MySQL), `63794` (Redis), `3018` (app) isliye hain taki doosre local services se na takraye.
`JWT_SECRET` ke liye compose ka default sirf local demo ke liye hai; real deploy mein secret manager.

**.github/workflows/ci.yml**

*File: `.github/workflows/ci.yml`*

````yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      matrix:
        node: [20, 22]
    # Real MySQL + Redis as service containers. globalSetup sees the TEST_* URLs
    # and skips Testcontainers.
    services:
      mysql:
        image: mysql:8.4
        env:
          MYSQL_DATABASE: shortener_test
          MYSQL_USER: app
          MYSQL_PASSWORD: app_pw
          MYSQL_ROOT_PASSWORD: root_pw
        ports: ["3306:3306"]
        options: >-
          --health-cmd="mysqladmin ping -h 127.0.0.1 -uapp -papp_pw"
          --health-interval=5s --health-timeout=3s --health-retries=20
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=5s --health-timeout=3s --health-retries=10
    env:
      TEST_DATABASE_URL: mysql://app:app_pw@127.0.0.1:3306/shortener_test
      TEST_REDIS_URL: redis://127.0.0.1:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration

  docker:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - name: Build image (no push)
        run: docker build -t url-shortener:ci .
      - name: Image runs as non-root
        run: test "$(docker run --rm --entrypoint id url-shortener:ci -u)" != "0"
````

Real output of the stack and image:

```text
$ docker compose ps
SERVICE   STATUS
app       Up 23 seconds (healthy)
mysql     Up About a minute (healthy)
redis     Up About a minute (healthy)

$ docker images us-app --format "{{.Repository}} {{.Size}}"
us-app 261MB
$ docker run --rm --entrypoint id us-app
uid=1000(node) gid=1000(node) groups=1000(node),1000(node)

$ docker exec us-app-1 ps (user of PID 1)
USER     PID   COMMAND
node         1 node src/server.js
node        45 sh -c ps -o user,pid,args | head -3
```

Honest size note: `docker images` reports about 261 MB. The base `node:22-alpine` alone is 238 MB
(the `node` binary is 123 MB of that), so OUR layers add about 23 MB (20 MB of production
`node_modules`). The multi-stage build keeps dev dependencies, tests and npm cache out of the final
image, but it cannot shrink the base. Going lower means a distroless Node image or removing
`npm`/`yarn` from the final stage with a build that copies only the node binary.

### How to test this stage

```bash
docker compose up -d --build
docker compose ps
curl localhost:3018/readyz
docker stop <app container>      # watch the shutdown logs
docker compose down -v           # remove containers AND the mysql volume
```

I ran the compose flow and the Dockerfile on this host (outputs in this file). I did NOT run the GitHub
Actions workflow on GitHub (see "Not verified"); its test commands are the same ones I ran locally,
including the `TEST_DATABASE_URL` mode.

**Key concepts to remember**

- Dependencies layer first, source last: a code edit does not reinstall packages.
- `CMD ["node", ...]` in exec form so the app is PID 1 and receives SIGTERM.
- Health checks drive start-up order, not sleeps.

**Revision questions**

1. Why `npm ci` and not `npm install` in a Dockerfile?
2. What breaks if the `CMD` were `npm start`?
3. What does `USER node` protect against, and what does it NOT protect against?
4. Why does compose need a `migrate` service rather than running the schema inside `app` on every boot? (Think: 5 replicas.)
5. How would you pass the JWT secret in production without writing it into compose or the image?

**Practical task**: add `--init` / `tini`, a read-only root filesystem (`read_only: true` plus a tmpfs for `/tmp`) and
prove the app still starts. Then add a `docker scout`/`trivy` scan step to CI.

**Self-check**

- [ ] I can explain every instruction in the Dockerfile.
- [ ] I can say why the final image has no tests and no dev dependencies.

---

## Stage 10 - Load test, README, and shipping it

**Learning objectives**

- Measure the cache's effect with a repeatable load test and read the numbers honestly.
- Write the README and commit history recruiters will actually read.

### Requirements

- A script that creates a user + link, warms the cache, then load-tests `GET /:code` for two configurations:
  cache enabled (HIT) and cache disabled (`CACHE_ENABLED=false`, every request hits MySQL).
- Report req/s and latency percentiles; verify the `X-Cache` header of each scenario first.
- README with what it does, API surface, how to run, one architecture diagram, one honest "what I would change" section.

### Acceptance criteria

- [ ] The probe line shows `X-Cache=HIT` for scenario 1 and `X-Cache=BYPASS` for scenario 2.
- [ ] Zero non-302 responses (the redirect limiter was raised so it does not interfere).
- [ ] README reviewed by someone who has never seen the repo: can they run it in 5 minutes?

### Interview concepts

`[ESSENTIAL]` latency percentiles (p50/p99) vs average, throughput vs latency, warm-up, load generator
being the bottleneck, coordinated omission, cache hit ratio, why benchmarks on shared hardware lie.
`[ADVANCED]` closed vs open load model (`autocannon` is closed: fixed connections), saturation, Little's law.

### Files

**scripts/loadtest.js**

*File: `scripts/loadtest.js`*

````js
// Redirect load test: cache HIT vs cache MISS (cache disabled => every request hits MySQL).
//
//   node scripts/loadtest.js hit=http://localhost:3101 miss=http://localhost:3102
//
// Each target must be a running instance of THIS app against the same MySQL/Redis,
// with a very high redirect rate limit so the limiter does not answer 429.
import autocannon from 'autocannon';

const DURATION = Number(process.env.DURATION ?? 10);
const CONNECTIONS = Number(process.env.CONNECTIONS ?? 50);

async function api(base, path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    redirect: 'manual',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function prepare(base) {
  const creds = { email: `load-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`, password: 'correct-horse-battery' };
  await api(base, '/v1/auth/register', { method: 'POST', body: creds });
  const { accessToken } = await (await api(base, '/v1/auth/login', { method: 'POST', body: creds })).json();
  const link = await (await api(base, '/v1/links', {
    method: 'POST', token: accessToken, body: { longUrl: 'https://example.com/landing-page' },
  })).json();
  await api(base, `/${link.code}`); // warm: first request populates the cache
  const probe = await api(base, `/${link.code}`);
  return { code: link.code, xCache: probe.headers.get('x-cache'), status: probe.status };
}

function run(url) {
  return new Promise((resolve, reject) => {
    autocannon({ url, connections: CONNECTIONS, duration: DURATION }, (err, result) =>
      (err ? reject(err) : resolve(result)));
  });
}

const rows = [];
for (const arg of process.argv.slice(2)) {
  const [name, base] = arg.split('=');
  const { code, xCache, status } = await prepare(base);
  console.log(`[${name}] probe: GET /${code} -> ${status}, X-Cache=${xCache}`);
  const r = await run(`${base}/${code}`);
  const ok302 = r.statusCodeStats['302']?.count ?? 0;
  rows.push({
    scenario: name,
    'req/s (avg)': Math.round(r.requests.average),
    'p50 ms': r.latency.p50,
    'p97.5 ms': r.latency.p97_5,
    'p99 ms': r.latency.p99,
    'max ms': r.latency.max,
    '302s': ok302,
    'errors/non-302': r.requests.total - ok302 + r.errors,
  });
}
console.table(rows);
````

How I ran it (two extra containers from the same image on the compose network; rate limit window 1 s and
a huge max so the limiter never answers 429; `LOG_LEVEL=error` so access logs do not distort the test;
the load generator ran INSIDE the Docker network to avoid Windows port-forwarding):

```bash
docker run -d --name lt-hit  --network us_default -p 3101:3000 <env...> -e CACHE_ENABLED=true  us-app
docker run -d --name lt-miss --network us_default -p 3102:3000 <env...> -e CACHE_ENABLED=false us-app
docker run --rm --network us_default -v "$PWD:/work:ro" -w /work node:22-alpine \
  node scripts/loadtest.js hit=http://lt-hit:3000 miss=http://lt-miss:3000
```

Real output (10 s per scenario, 50 connections):

```text
[hit] probe: GET /H4oXJGi -> 302, X-Cache=HIT
[miss] probe: GET /ykmEy3K -> 302, X-Cache=BYPASS
+---------+----------+-------------+--------+----------+--------+--------+------+----------------+
| (index) | scenario | req/s (avg) | p50 ms | p97.5 ms | p99 ms | max ms | 302s | errors/non-302 |
+---------+----------+-------------+--------+----------+--------+--------+------+----------------+
| 0       | 'hit'    | 174         | 271    | 429      | 437    | 469    | 1744 | 0              |
| 1       | 'miss'   | 73          | 507    | 1332     | 1461   | 1759   | 730  | 0              |
+---------+----------+-------------+--------+----------+--------+--------+------+----------------+
```

How to read this HONESTLY:

- **Relative result is real**: with the cache on the same machine served about 2.4x the requests and
  roughly half the median latency. In the HIT scenario a request costs a few Redis commands
  (rate-limit EVAL, GET, HINCRBY); in the miss scenario it adds a MySQL query through the pool.
- **Absolute numbers are NOT meaningful**. The host was saturated by other containers: a trivial
  `GET /healthz` managed only 693 req/s in-network at 10 connections, and `redis-benchmark` on the same
  Redis reported about 8,600 ops/s for `PING` (a healthy machine does tens of thousands to 100k+).
  Do not quote 174 req/s as "my shortener's throughput". Re-run on a quiet machine, and put the load
  generator on a different machine from the server if you can.
- The first attempt, with the load generator on the Windows host going through Docker port forwarding,
  gave 133 (hit) vs 72 (miss) req/s: same ratio, same story.
- Cache hit still costs 3 Redis round trips here (limiter, cache, counter). A real optimisation is to
  pipeline them or move the limiter to the edge (nginx/CDN) for the redirect path.

**README.md** (copy as the repository README; adjust the "what I would change" list to your real opinion)

*File: `README.md`*

````markdown
# URL Shortener

A small, production-shaped URL shortener. Create short links, redirect with a Redis
cache in front of MySQL, see click stats. Built as a learning project: every design
choice is written down so you can defend it in an interview.

Stack: Node 20/22, Express 5, MySQL 8.4 (mysql2), Redis 7 (ioredis), zod 4, JWT, Vitest 3 + Supertest.

### What it does

- Register / login (bcrypt + JWT bearer token)
- Create a short link (7 char base62 code), optional expiry, safe retries via `Idempotency-Key`
- Public redirect `GET /:code` (302) served from Redis when possible
- Per-user link list (cursor pagination), per-link stats, delete
- Sliding-window rate limiting in Redis (create per user, login and redirect per IP)
- Background jobs: flush click counters to MySQL, sweep expired links

### API surface

Full contract: [`openapi.yaml`](openapi.yaml).

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /v1/auth/register | no | 201, 409 EMAIL_TAKEN |
| POST | /v1/auth/login | no | 200 token, 401 INVALID_CREDENTIALS |
| POST | /v1/links | yes | 201; optional `Idempotency-Key` header |
| GET | /v1/links?limit=&cursor= | yes | newest first, keyset pagination |
| GET | /v1/links/:code/stats | yes | owner only (others get 404) |
| DELETE | /v1/links/:code | yes | 204 |
| GET | /:code | no | 302, 404, 410 (expired) |
| GET | /healthz, /readyz | no | liveness / readiness |

Every error: `{ "error": { "code", "message", "requestId", "details"? } }`

### Run it

    cp .env.example .env            # for local dev without Docker for the app
    docker compose up --build       # MySQL + Redis + migrate + app on http://localhost:3018
    npm test                        # unit + integration (Testcontainers starts MySQL and Redis)

Quick try:

    curl -X POST localhost:3018/v1/auth/register -H 'content-type: application/json' \
      -d '{"email":"me@example.com","password":"correct-horse-battery"}'

### Architecture

    Browser / client
          |
          v
    +----------------------------+        +---------------------+
    |  Express 5 API (stateless) | -----> | Redis               |
    |  - zod validation          |  cache | - link:{code} cache |
    |  - JWT auth                |  rate  | - rate-limit ZSETs  |
    |  - rate limit (Lua)        |  clicks| - click counters    |
    |  - 302 redirect            |        | - job locks         |
    +-------------+--------------+        +---------------------+
                  | miss / writes
                  v
         +------------------+      background (same process, Redis-locked):
         | MySQL 8.4        |      - flush click counters -> links.clicks
         | users, links,    |      - delete expired links (batched)
         | idempotency_keys |      - delete old idempotency keys
         +------------------+

Redirect hot path: rate-limit check -> `GET link:{code}` -> on miss `SELECT` by unique
`code` and `SET` with a TTL that never outlives the link's expiry -> 302. The click
is counted with a fire-and-forget `HINCRBY`, never a MySQL write on the hot path.

### Key decisions

- **Short code:** random 7 char base62 from a CSPRNG, unique index, retry on duplicate.
- **302, not 301:** we need every click to reach us (stats, expiry, delete).
- **Idempotency:** key row and link row are written in one MySQL transaction.
- **Expiry:** lazy check on every redirect (correctness) plus a batched sweep (storage).
- **Redis down:** redirects fall back to MySQL, rate limiting fails open.

### What I would change (honest list)

- Access tokens only. A real product needs refresh tokens and a way to revoke them.
- The sliding-window LOG limiter stores one Redis entry per allowed request. Fine at
  600/min, wasteful at 100k/min. I would move to a token bucket or a window counter.
- Click counting loses up to one flush interval of clicks if Redis dies. Fine for
  "approximate stats", wrong for billing. Billing needs an append-only event log or queue.
- Jobs run inside the API process. At scale they belong in a separate worker or cron.
- Rate limiting by IP breaks behind a proxy unless `TRUST_PROXY` is set correctly.
- No abuse protection beyond scheme checks: no malware or phishing URL screening, no
  per-domain blocklist, no report-a-link flow.
- Redirect cache invalidation on delete is best effort; a racing cache fill can serve a
  deleted link until its TTL ends.
- No metrics or tracing yet (Prometheus counters for hit ratio, p99 per route).
- Plain SQL schema file instead of versioned migrations.
````

### Ship it (Git hygiene)

- Commit in small, meaningful steps: `schema + config`, `auth`, `create link`, `redirect + cache`,
  `rate limiting`, `tests`, `docker + ci`. Recruiters do read `git log`.
- `.env` is git-ignored; `.env.example` is committed; the CI uses service containers, not real secrets.
- Add a short "Decisions" section or ADR files if you want to show design thinking.

**Key concepts to remember**

- Report percentiles, not just averages.
- State the environment and its limits next to every benchmark.
- A README with an honest limitations section reads as maturity, not weakness.

**Revision questions**

1. Why is p99 more useful than the average for a redirect service?
2. What is "coordinated omission" and does `autocannon` in this mode suffer from it?
3. Name three things that would make the hit-vs-miss gap larger on a quiet, properly sized machine.
4. How would you test the system at 10x load without a 10x machine?
5. What would you put in a dashboard to know the cache is healthy in production?

**Practical task**: add a third scenario: 1,000 different codes, random access, cold cache with a
Zipf-like distribution (a few hot links, many cold). Report the hit ratio from Redis `INFO stats`
(`keyspace_hits` / `keyspace_misses`) and explain why it differs from the single-hot-link test.

**Self-check**

- [ ] I can explain my benchmark's limits in one sentence.
- [ ] My README lets a stranger run the project in 5 minutes.

---

## Interview Q&A (24)

**Q-URL-01. Why 302 and not 301 for the redirect?**
**Interview answer:** A 301 is cacheable by browsers and CDNs, so after the first visit the client never
contacts us again. That makes click counting impossible and means deleting or expiring a link does not
take effect for people who already visited. A 302 is not cached by default, so every click reaches the
service and we keep full control, at the cost of more traffic, which a Redis cache absorbs. I would only use
301 for permanent, never-expiring, analytics-free links.

**Q-URL-02. Why random codes with a unique index and retry instead of an auto-increment counter?**
**Interview answer:** A counter gives short, collision-free codes but they are sequential, so anyone can enumerate
every link, and it needs a single global sequence. With random 7 character base62 codes the space is 62^7,
about 3.5 trillion, so a collision is very unlikely (about 0.03 percent per insert at one billion rows) and the
unique index guarantees correctness anyway: the loser of a race gets a duplicate-key error and retries.
If I needed shorter codes or zero retries I would use a counter plus a bijective scramble, or a pre-generated key service.

**Q-URL-03. Why not a hash of the URL?**
**Interview answer:** A hash is deterministic, which gives free de-duplication but breaks per-user links: two users
shortening the same URL with different owners and expiries would need the same code. Truncating a hash to
7 characters also still collides, so I would need a retry with a salt anyway. Deduplication, if desired, is better
done with an indexed hash column on the long URL, separate from the code.

**Q-URL-04. What happens when the collision rate rises?**
**Interview answer:** The retry loop is capped at 5 attempts and returns 503 `CODE_ALLOCATION_FAILED`. I would
log `code_collision` events and alert on their rate, because rising retries mean the code space is filling.
The fix is to move to 8 characters, which multiplies the space by 62, and existing 7 character codes keep working.

**Q-URL-05. Why `ascii_bin` for the code column?**
**Interview answer:** Default MySQL collations are case-insensitive, so `aZ3kP9x` and `AZ3KP9X` would be one
unique key and one cache key would map to two different intended links. A binary ASCII collation makes comparison
exact and the index smaller than utf8mb4.

**Q-URL-06. Explain your cache-aside flow and what can go wrong.**
**Interview answer:** On a redirect I read `link:{code}` from Redis. On a miss I query MySQL by the unique code and
write the result to Redis with a TTL. Problems: stale data after delete or update, stampede when a hot key
expires, negative-cache pollution, and Redis failure. I handle them with a short negative-cache TTL, explicit cache
write on delete, TTL capped by link expiry plus the expiry stored in the entry, and fail-open fallback to MySQL.
Stampede protection (single-flight, jittered TTL) is the next improvement and is a stage exercise.

**Q-URL-07. A link is deleted while a request is reading it. Can the cache serve it afterwards?**
**Interview answer:** Yes, in a narrow race: a reader loads the row, the owner deletes the link and writes the
negative entry, then the reader writes the stale positive entry back. The damage is bounded by the TTL. To reduce it,
keep TTLs moderate, version cache entries, or have deletes also write a tombstone with a longer TTL. I accept the
small window and state it as a known limitation.

**Q-URL-08. What happens when Redis goes down?**
**Interview answer:** Redirects fall back to MySQL (slower), creates keep working, the rate limiter fails open, and
click counts for that period are lost, which is acceptable for approximate stats. `/readyz` reports Redis as down but
the app stays ready. The risk is that MySQL now takes the full read load, so in production I would also add a
connection-pool limit and a coarse in-process rate limit as a safety net. I demonstrated this by stopping the container.

**Q-URL-09. Why a sliding-window log for rate limiting, and what are its costs?**
**Interview answer:** It is exact: no window ever sees more than the limit, which a fixed window cannot guarantee at
boundaries. The cost is memory: one sorted-set member per allowed request, so it is great for small limits
(tens to hundreds per minute) and poor for very high ones. For high-volume limits I would use a token bucket or a
sliding-window counter. A token bucket also gives controlled bursts, which suits APIs.

**Q-URL-10. How do you make the limiter correct with many app instances?**
**Interview answer:** State lives in Redis, not in the process, and the check-and-increment runs in one Lua script
so it is atomic. Time comes from Redis `TIME`, so instance clock skew does not matter. A test fires 20 parallel
requests with limit 5 and asserts exactly 5 succeed.

**Q-URL-11. Explain your idempotent create.**
**Interview answer:** The client sends an `Idempotency-Key`. In one MySQL transaction I insert a row keyed by
`(user_id, key)` with a hash of the request, create the link, store the response, and commit. A concurrent duplicate blocks
on the primary-key lock and then replays the stored response. A different body with the same key gets 422. Because the
key and the effect commit together, there is no stuck "in progress" state and a crash rolls both back. A Redis-only
lock cannot give that atomicity.

**Q-URL-12. Why cursor pagination?**
**Interview answer:** `OFFSET n` makes MySQL read and discard n rows, so deep pages get slower, and pages shift when rows are
inserted or deleted between requests. Keyset pagination uses `WHERE id < last_id ORDER BY id DESC LIMIT n`, which is an
index range scan with stable results. The cursor is opaque so the implementation can change. The trade-off is no
random access to page N.

**Q-URL-13. Why return 404 instead of 403 for another user's link?**
**Interview answer:** 403 confirms the resource exists. For a private resource namespace I prefer not to leak that, so
ownership is enforced in the SQL predicate (`WHERE code = ? AND owner_id = ?`) and a miss is a 404.

**Q-URL-14. JWT: what does it give you and what does it not?**
**Interview answer:** It gives stateless verification: any instance can authenticate a request with just the secret.
It does not give revocation or confidentiality: the payload is readable and a stolen token works until it expires.
I pin `HS256` on verify, keep a short lifetime, and would add refresh tokens with rotation and a deny-list for
logout or password change. If I needed instant revocation everywhere I would use server-side sessions.

**Q-URL-15. How do you avoid user enumeration on login?**
**Interview answer:** Same status and body for unknown email and wrong password, and equal work: when the user does
not exist I still run `bcrypt.compare` against a dummy hash, so response time does not reveal which case it was.
The login endpoint is also rate limited per IP.

**Q-URL-16. How do you count clicks without slowing the redirect or hammering MySQL?**
**Interview answer:** The hot path only does a fire-and-forget `HINCRBY` in Redis. A job every 10 seconds takes a Redis
lock, atomically `RENAME`s the pending hash to a flushing hash, applies batched `UPDATE ... clicks = clicks + n` to
MySQL, and removes each entry afterward. This trades exactness for speed: a Redis crash loses up to one interval, and a crash
mid-flush can double count one row. For billing I would write events to a durable queue instead.

**Q-URL-17. Why both lazy expiry and a cleanup job?**
**Interview answer:** The redirect checks `expires_at` every time, so an expired link is never served no matter when the
sweep runs: that is correctness. The sweep deletes old expired rows in batches of 1000 so the table and indexes do not
grow forever: that is housekeeping. With a cache in front, the entry also stores the expiry and its TTL is capped by it.

**Q-URL-18. Why `pool.query` for the list endpoint but `execute` elsewhere?**
**Interview answer:** `execute` uses server-side prepared statements, and MySQL 8.0.22 and later rejects a numeric
parameter for `LIMIT ?` there. `query` does client-side escaping, which is still parameterised and injection-safe, and
works with `LIMIT`. Everything else uses `execute` so statements are cached by the driver.

**Q-URL-19. How would the service run on several instances?**
**Interview answer:** The API is stateless, state is in MySQL and Redis. Things that need care: background jobs must
not run everywhere at once (I use a Redis lock with a unique token), `TRUST_PROXY` must reflect the load balancer so the
IP-based limits see client IPs, the DB pool size times instances must stay below MySQL `max_connections`, and graceful
shutdown must drain requests during rolling deploys.

**Q-URL-20. Why test with real MySQL and Redis instead of mocks?**
**Interview answer:** The risky behaviour is in the database and Redis semantics: unique-key violations, transaction
locking, collation, Lua atomicity, TTLs. A mock encodes my assumptions and passes even when they are wrong. The unit
tests mock only a seam I own (the DB handle) for cases that are hard to force, like five collisions in a row.
Testcontainers makes the real dependencies disposable and CI uses service containers with the same tests.

**Q-URL-21. Walk me through your Dockerfile.**
**Interview answer:** Stage one installs production dependencies only with `npm ci --omit=dev` using the lockfile for
reproducibility and a cache mount. Stage two starts from the same slim base, copies `node_modules` before the source for
layer caching, runs as the unprivileged `node` user, sets `NODE_ENV=production`, has a `HEALTHCHECK`, and uses exec-form
`CMD ["node", ...]` so the process is PID 1 and receives SIGTERM for graceful shutdown. Tests, dev dependencies and `.env`
never enter the image thanks to `.dockerignore` and the staged build.

**Q-URL-22. How would this handle 40,000 redirects per second?**
**Interview answer:** Redirects are read-heavy and cacheable, so: scale the stateless API horizontally behind a load
balancer, keep the hot set in Redis (a few GB is enough for the popular links), add read replicas for cache misses, put
a CDN or edge cache with a short TTL in front for the hottest links (accepting some stale-count loss), and take the
rate limiter and click counter off the per-request critical path (pipelining, local counters flushed periodically). Writes
at about 40 per second are not the problem. I would first measure where the time goes, as the hit versus miss load
test shows how much the cache buys.

**Q-URL-23. How do you stop abuse, such as phishing links or open-redirect misuse?**
**Interview answer:** Layers: allow-list of schemes (only http/https), no embedded credentials, no links to our own
host, authentication and per-user creation limits, per-IP limits on redirects and logins, and a delete/report path.
In production I would add a domain blocklist, a safe-browsing check at creation and asynchronously afterwards,
an interstitial for flagged links, and monitoring of creation spikes.

**Q-URL-24. What would you change before calling this production-ready?**
**Interview answer:** Refresh tokens and revocation; metrics and tracing (cache hit ratio, p99 per route, rate-limit
rejections); jobs moved to a worker; real migrations tool; stampede protection; a token bucket for high-volume limits; click events
via a durable queue if exact numbers matter; abuse screening; secrets from a secret manager; and load testing on dedicated
hardware. I list these in the README so the trade-offs are explicit.

---

## Summary

You built a complete small backend from requirements: Express 5 API, MySQL schema with the right indexes and
collation, JWT auth, validated input, collision-safe short codes, an idempotent create, a Redis cache-aside redirect with
fail-open behaviour, lazy plus batched expiry, keyset pagination, an atomic sliding-window rate limiter, one error
contract, an OpenAPI file checked by tests, 111 tests (54 unit, 57 integration against real MySQL and Redis), a non-root multi-stage image, compose,
CI, and a load test that shows what the cache buys. The point is not the shortener: it is that every decision has a reason
you can say out loud.

What the build taught that reading would not have:

- The idempotency design is only simple because the key and the effect share one transaction.
- Vitest 3 ignores `fileParallelism` inside a project; shared databases need it at the root.
- `testcontainers@12` needs Node 22.22+; Node 20 needs `@11`.
- MySQL `JSON` columns reorder keys, so a replay is the same data, not the same bytes.
- Benchmarks on a loaded machine only support relative claims.

---

## Assessment

### Basic

1. Which HTTP status do we return for an expired link, an unknown link, and another user's link?
2. Why is `code` stored with `ascii_bin`?
3. What does the `X-Cache` header show and what values can it have?
4. Which command in the Dockerfile makes the container run as non-root?
5. What is the difference between `/healthz` and `/readyz`?

**Answers**

1. 410, 404, 404. Expired links existed and are gone (410); unknown and not-yours both look like missing (404) so existence is not leaked.
2. Codes are case-sensitive; the default collation would treat `aZ` and `AZ` as the same key.
3. `HIT` (served from Redis), `MISS` (loaded from MySQL, then cached), `BYPASS` (cache disabled).
4. `USER node` (the official image ships uid 1000 `node`), after copying files with `--chown=node:node`.
5. Liveness (process is up, restart if not) vs readiness (can take traffic: MySQL reachable). Redis down does not make us unready.

### Intermediate

6. Two requests with the same `Idempotency-Key` arrive at the same time. Describe what each does.
7. Why does the cache entry store the expiry timestamp and not only a TTL?
8. Your `GET /v1/links` shows a duplicated item on page 2 after a new link was created. Which pagination style would cause that, and what fixes it?
9. Why does the limiter script take the timestamp from Redis?
10. What does `queueLimit: 100` do in the mysql2 pool?

**Answers**

6. Both start a transaction and insert the key row. One gets the primary-key lock first and proceeds to create the link and commit. The other blocks, then gets `ER_DUP_ENTRY`, loads the stored response and replays it with `Idempotent-Replayed: true`. Exactly one link exists.
7. TTL only controls memory. A hit is re-evaluated against the expiry on every read, so even with a long TTL or a skewed TTL we answer 410 on time. TTL is also capped by the expiry as a second guard.
8. OFFSET pagination: inserting at the head shifts rows down so a row appears on both pages. Keyset (cursor) pagination uses the last seen id and is stable.
9. Instances' clocks may differ; a single time source (Redis) keeps the window consistent across instances and removes clock-skew bugs.
10. When all connections are busy it allows up to 100 queued waiters; beyond that new requests fail immediately, which prevents unbounded memory and latency under overload.

### Advanced

11. Describe two ways a deleted link can still be redirected after DELETE returns 204, and how you would shrink each window.
12. Your flush job crashes after `UPDATE` for code X but before `HDEL`. What is the effect on the stats, and how could you make it exact?
13. You need to rate limit 100,000 requests per minute per API key. What changes in the limiter and why?
14. The interviewer says "Redis is a single point of failure for your rate limiting". Respond.
15. How would you split this into services, and would you? What would be the first seam?

**Answers**

11. (a) Cache fill race: a reader loads the row before the delete and writes it back after our negative entry; bounded by TTL. Reduce with shorter TTL, a versioned key or tombstone TTL. (b) Browser or CDN caching of a 301: avoided by choosing 302 with `max-age=0`; if a CDN is added, use short TTLs and purge on delete.
12. On the next run the leftover entry in `clicks:flushing` is applied again, double counting X. To be exact, apply the increment and record a per-batch id/offset in the same MySQL transaction (an `applied_batches` table with a unique key), or write click events to a durable queue and aggregate with idempotent consumers.
13. Move to a token bucket (two fields per key, O(1) memory) or a sliding-window counter; the log would store up to 100,000 members per key per minute. Consider sharding by key, local pre-aggregation, and approximate counting.
14. It is a shared dependency, so I made the failure mode explicit: the limiter fails open and logs, redirects still work from MySQL. Mitigations: Redis replica with failover/Sentinel or a managed Redis, an in-process fallback limiter with coarse limits, and an alert on `rate_limiter_unavailable`. For a sensitive endpoint such as login I could choose to fail closed instead.
15. I would not split yet: one codebase with clear modules (auth, links, jobs) is easier to operate. If needed, the first seam is the redirect read path (stateless, read-heavy, different scaling profile) as its own service reading from Redis/replica, while management APIs and jobs stay together. The click-flush worker is the second natural seam.

---

## Hours estimate

| Module | Hours |
|--------|-------|
| Stage 1 - Requirements, skeleton, config, schema | 1.5 |
| Stage 2 - Authentication | 1.5 |
| Stage 3 - Create links, codes, idempotency | 2.0 |
| Stage 4 - Redirect, cache-aside, clicks | 2.0 |
| Stage 5 - Expiry, pagination, cleanup job | 1.5 |
| Stage 6 - Rate limiting | 1.5 |
| Stage 7 - Error contract, OpenAPI, shutdown | 1.5 |
| Stage 8 - Tests (unit + integration) | 2.5 |
| Stage 9 - Docker, compose, CI | 1.5 |
| Stage 10 - Load test, README, shipping | 1.5 |
| Interview Q&A and assessment review | 1.0 |
| **Total** | **18** |

(The roadmap allots 7 days; if you code every stage yourself first, expect closer to 18 hours of focused work, not 12.)

---

## Not verified

- **GitHub Actions workflow** (`ci.yml`): YAML written, never executed on GitHub. The commands inside were run locally; the `TEST_DATABASE_URL` mode was run against the compose containers.
- **Node 22 on the host**: tests ran on Node v20.20.1. The container runs Node 22 (`v22.23.3`) and was exercised manually (compose, curl, load test) but the Vitest suite was not run on Node 22.
- **`@redocly/cli` lint** of `openapi.yaml`: not run; only `swagger-parser` validation (in a test).
- **`npm run dev`** (watch mode) and **`npm run cleanup` on the host** (only the in-container `node src/jobs/cleanup-cli.js` was run).
- **Absolute performance numbers**: the host was heavily loaded; see Stage 10.
- **Dependency audit**: `npm install` reported advisories in dev dependencies; not triaged.
- **Stampede protection, token bucket, refresh tokens**: described as exercises, not implemented here.
