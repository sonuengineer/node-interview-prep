# 12 - End-to-End Project: Task Management API

> Part 12 of the Node.js Backend Interview Preparation set. This file is the single practical project
> that ties Weeks 3 to 7 together. Stage numbering (Stage 1-7, Extension A-D) is shared with the other
> parts, so other files can say "see Project Stage 5" and it will match.

Tier tags used in this file: `[ESSENTIAL]` = asked in most junior/mid interviews, `[ADVANCED]` =
supplementary (good to know, do not panic if you skip it). Honest note: you will not become a senior
backend engineer by finishing this project. You WILL have one real, explainable codebase that proves
you understand the request lifecycle, SQL, auth, testing and production basics.

## Table of Contents

1. How to use this project (and how long it takes)
2. What we are building: scope, API contract, RBAC matrix, data model, architecture
3. Final folder tree (all stages combined)
4. Stage 1 - Project setup + Express skeleton (Week 3)
5. Stage 2 - CRUD + validation + centralized error handling (Week 3)
6. Stage 3 - MySQL schema + data layer (Week 4-5)
7. Stage 4 - Authentication + RBAC (Week 5)
8. Stage 5 - Pagination, filter, sort + transactions (Week 5-6)
9. Stage 6 - Tests + logging + security middleware (Week 6)
10. Stage 7 - README + OpenAPI docs (Week 6-7)
11. Extension A - Redis caching
12. Extension B - Background jobs with BullMQ
13. Extension C - Dockerfile + docker-compose
14. Extension D - Deployment outline
15. How to explain this project in an interview
16. Project-level interview Q&A
17. Final checklist and honest readiness notes

---

## 1. How to use this project

**Concept (Hinglish):** Ye project ek chhota but "real" backend hai: users login karte hain, tasks
banate hain, roles ke hisaab se permissions alag hain. Tum isko stage by stage banaoge. Har stage ke
end me tumhare paas ek chalta hua server hoga, aur har stage ek interview topic cover karta hai.

**Rules for yourself**

- Type the code yourself (do not only copy-paste). Interviewers ask "why did you do X?" and typing
  forces you to notice X.
- After each stage, run the "Acceptance criteria" checks. If a check fails, fix it before moving on.
- Code is consistent across stages: a file shown in a later stage replaces the earlier version
  (full file is shown), unless the stage explicitly says "append" or "replace function X".
- Environment: Node.js 22 LTS (Node 20 also works; differences are flagged), MySQL 8.x (8.4 LTS is
  fine), npm. Windows, macOS, Linux all work. Shell examples use Git Bash style `curl`; in
  PowerShell use `curl.exe` with `--data-raw` or use Postman/Thunder Client.

**Time estimate (realistic)**

| Stage | Hours | Matches week |
|-------|-------|--------------|
| 1 | 1.5 | Week 3 |
| 2 | 3 | Week 3 |
| 3 | 3 | Week 4-5 |
| 4 | 4 | Week 5 |
| 5 | 4 | Week 5-6 |
| 6 | 5 | Week 6 |
| 7 | 2 | Week 6-7 |
| Extensions A-D | 8-10 total | Week 6-8 (optional) |

Total about 22 hours for Stage 1-7. That fits inside the 112-hour plan if you spread it across the
weeks as shown, but only if you do not skip the weekly reading first.

**Tech stack (fixed, so the code stays consistent)**

| Concern | Choice | Why |
|---------|--------|-----|
| Runtime | Node.js 22 LTS, ES modules | Spec says ESM everywhere |
| Web framework | Express 5 | Async errors forwarded automatically |
| Database | MySQL 8 via `mysql2/promise` | Primary DB in spec; raw SQL to show you understand SQL |
| Validation | zod 4 | Schema + coercion + typed errors |
| Auth | `jsonwebtoken` (HS256) + `bcryptjs` | Standard interview stack |
| Logging | pino + pino-http | Fast structured JSON logs |
| Security | helmet, cors, express-rate-limit | Baseline hardening |
| Tests | Vitest + Supertest | Fast, ESM-native |
| Docs | OpenAPI 3 + swagger-ui-express | Interactive docs |
| Extensions | ioredis, BullMQ, Docker | Cache, jobs, containers |

`bcryptjs` is pure JavaScript, so it installs without a compiler on Windows. The native `bcrypt`
package is faster but needs prebuilt binaries/toolchain. The API is the same (`hash`, `compare`).

---

## 2. What we are building

### 2.1 Scope

A Task Management API for a small team. A user signs up, logs in, and works with tasks. Managers can
assign work, bulk-update status, and reassign a leaving colleague's tasks. Every important change is
written to an audit table (`task_events`) in the same transaction as the change.

### 2.2 API contract (conventions)

- Base path: `/api/v1`. Health probes live outside the version prefix: `/health`, `/health/ready`.
- JSON in, JSON out. Success envelope: `{ "data": ... }` and for lists `{ "data": [...], "meta": {...} }`.
- Error envelope (every error, no exceptions):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "in": "body", "path": "title", "message": "Too small: expected string to have >=1 characters" }],
    "requestId": "5c0f6c6e-2d6c-4f1e-9a73-0a5d8c3bde11"
  }
}
```

- Status codes we use: 200, 201 (+ `Location` header), 204, 400 (bad input), 401 (not authenticated),
  403 (authenticated but not allowed), 404, 409 (conflict / invalid state), 413, 422 (valid shape but
  business rule fails), 429, 500, 503 (readiness).
- IDs are positive integers. Dates: `dueDate` is `YYYY-MM-DD`; timestamps are ISO-8601 UTC.

### 2.3 Endpoint list

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| GET | /health | public | Liveness |
| GET | /health/ready | public | Readiness (checks DB) |
| POST | /api/v1/auth/register | public | Create a `member` account |
| POST | /api/v1/auth/login | public | Get an access token |
| GET | /api/v1/auth/me | any user | Current user |
| GET | /api/v1/users | admin, manager | Paginated user list (to pick assignees) |
| PATCH | /api/v1/users/:id | admin | Change role / activate / deactivate |
| GET | /api/v1/tasks | any user (scoped) | Paginated, filtered, sorted list |
| POST | /api/v1/tasks | any user | Create task |
| GET | /api/v1/tasks/:id | any user (scoped) | Get one task |
| PATCH | /api/v1/tasks/:id | any user (scoped) | Partial update |
| DELETE | /api/v1/tasks/:id | admin, manager | Delete task |
| GET | /api/v1/tasks/:id/events | any user (scoped) | Audit history of a task |
| POST | /api/v1/tasks/bulk-status | admin, manager | Set status on many tasks atomically |
| POST | /api/v1/tasks/reassign | admin, manager | Move all open tasks from user A to user B atomically |

"Scoped" means: a `member` only sees tasks assigned to them or created by them. Everybody else
gets 404 (not 403) so we do not leak that a task id exists.

### 2.4 RBAC matrix

| Action | member | manager | admin |
|--------|--------|---------|-------|
| Register / login | yes | yes | yes |
| See own tasks (assigned or created) | yes | yes | yes |
| See all tasks | no | yes | yes |
| Create task for self | yes | yes | yes |
| Create task for someone else | no | yes | yes |
| Update fields (title, description, status, priority, dueDate) on visible task | yes | yes | yes |
| Change `assigneeId` | no | yes | yes |
| Delete task | no | yes | yes |
| Bulk status / reassign | no | yes | yes |
| List users | no | yes | yes |
| Change a user's role / active flag | no | no | yes |

Business rule: a `cancelled` task is terminal (cannot be reopened). This gives us a real reason for
a 409 and for all-or-nothing transactions.

### 2.5 Data model

```
users                          tasks                              task_events
-----                          -----                              -----------
id PK                          id PK                              id PK
email UNIQUE                   title                              task_id FK -> tasks.id (CASCADE)
name                           description (nullable)             actor_id FK -> users.id (SET NULL)
password_hash                  status ENUM                        event_type VARCHAR
role ENUM                      priority ENUM                      details JSON
is_active                      due_date DATE (nullable)           created_at
created_at, updated_at         created_by FK -> users.id (SET NULL)
                               assignee_id FK -> users.id (SET NULL)
                               created_at, updated_at
```

One user has many tasks (as assignee) and many tasks (as creator): two foreign keys from `tasks`
to `users`. `task_events` is an append-only audit log (1 task -> N events).

### 2.6 Architecture (layers)

```
HTTP request
   |
   v
[ http-logger ] -> [ helmet / cors ] -> [ rate limit ] -> [ json body parser ]
   |
   v
[ router ] -> [ authenticate ] -> [ authorize(roles) ] -> [ validate(zod) ]
   |
   v
[ controller ]   HTTP only: read req, call service, write res
   |
   v
[ service ]      business rules, RBAC checks, transactions
   |
   v
[ repository ]   SQL only: one place that knows table/column names
   |
   v
[ mysql2 pool ] -> MySQL

Any throw / rejected promise -> [ error-handler ] -> uniform JSON error
```

**Frontend connection:** controller = React component that only handles events and rendering; service
= custom hook/business logic; repository = API client module. Same separation, same reason: you can
change one layer without touching the others and you can test each layer alone.

**Why layers matter in an interview:** it is the most common follow-up to "walk me through your
project". The answer is "controllers know HTTP, services know rules, repositories know SQL".

---

## 3. Final folder tree (all stages combined)

Files marked with the stage that creates them. Anything marked EXT belongs to an extension.

```
task-api/
  .env.example                      (Stage 1; final form shown there)
  .gitignore                        (Stage 1)
  .dockerignore                     (EXT C)
  Dockerfile                        (EXT C)
  docker-compose.yml                (EXT C)
  README.md                         (Stage 7)
  package.json                      (Stage 1, grows each stage; final in Stage 7)
  vitest.config.js                  (Stage 6)
  .github/workflows/ci.yml          (EXT D)
  db/
    migrations/
      001_init.sql                  (Stage 3)
  scripts/
    migrate.js                      (Stage 3)
    seed.js                         (Stage 4)
  src/
    app.js                          (Stage 1, rewritten in 2, 6, 7)
    server.js                       (Stage 1, rewritten in 3)
    worker.js                       (EXT B)
    config/
      env.js                        (Stage 1)
      logger.js                     (Stage 1)
    db/
      pool.js                       (Stage 3)
      transaction.js                (Stage 5)
    cache/
      cache.js                      (EXT A)
    queue/
      notifications.js              (EXT B)
    docs/
      openapi.js                    (Stage 7)
    errors/
      app-error.js                  (Stage 2)
    middleware/
      validate.js                   (Stage 2)
      not-found.js                  (Stage 2)
      error-handler.js              (Stage 2, extended in 3 and 4)
      auth.js                       (Stage 4)
      http-logger.js                (Stage 6)
      security.js                   (Stage 6)
      rate-limit.js                 (Stage 6)
    utils/
      pagination.js                 (Stage 5)
    modules/
      health/health.routes.js       (Stage 1, extended in 3)
      auth/
        auth.routes.js              (Stage 4)
        auth.controller.js          (Stage 4)
        auth.service.js             (Stage 4)
        auth.schemas.js             (Stage 4)
        password.js                 (Stage 4)
        tokens.js                   (Stage 4)
      users/
        users.routes.js             (Stage 4, extended in 5)
        users.controller.js         (Stage 4, extended in 5)
        users.service.js            (Stage 4, extended in 5)
        users.schemas.js            (Stage 4, extended in 5)
        users.repository.js         (Stage 4, extended in 5)
      tasks/
        tasks.routes.js             (Stage 2, rewritten in 4 and 5)
        tasks.controller.js         (Stage 2, rewritten in 4 and 5)
        tasks.service.js            (Stage 2, rewritten in 4, 5 and EXT A)
        tasks.schemas.js            (Stage 2, extended in 5)
        tasks.repository.js         (Stage 2 in-memory, rewritten in 3 and 5)
        task-events.repository.js   (Stage 5)
        task-policy.js              (Stage 4, rewritten in 5)
        task-query.js               (Stage 5)
        task-cache.js               (EXT A)
        task-hooks.js               (EXT A, extended in EXT B)
  tests/
    global-setup.js                 (Stage 6)
    helpers.js                      (Stage 6)
    unit/
      task-query.test.js
      task-policy.test.js
      pagination.test.js
      error-handler.test.js
      auth-middleware.test.js
      transaction.test.js
      openapi.test.js               (Stage 7)
      task-hooks.test.js            (EXT B)
    integration/
      auth.test.js
      users.test.js
      tasks.test.js
      tasks-transactions.test.js
      rollback.test.js
      security.test.js
      cache.test.js                 (EXT A)
```

---

## 4. Stage 1 - Project setup + Express skeleton (Week 3)

### Requirements

1. A Node.js 22 project using ES modules (`"type": "module"`).
2. All configuration comes from environment variables and is validated at boot. If anything is
   missing or wrong, the process must refuse to start with a clear message (fail fast).
3. The Express app is built by a factory function `createApp()` that does NOT call `listen()`.
   `server.js` is the only file that listens. (This is what makes Supertest possible later.)
4. `GET /health` returns 200 with a small JSON body.
5. A structured logger (pino) exists from day one. No `console.log` in application code.
6. Graceful shutdown on SIGTERM/SIGINT.

### Implementation approach (one recommended approach)

- Parse `process.env` with a zod schema in one module (`config/env.js`) and export a frozen `env`
  object. Every other file imports `env`, nobody reads `process.env` directly.
- We declare ALL variables the finished project needs right now (DB, JWT, rate limit...). The file
  `.env.example` is the contract of the whole app. Later stages simply start using the variables.
  That means in Stage 1 you must fill in DB and JWT values even though nothing uses them yet.
- `createApp()` in `app.js`, `listen()` + shutdown in `server.js`.
- Use Node's built-in `--env-file` and `--watch` flags instead of `dotenv` and `nodemon`
  (prefer built-ins). `--env-file` exists in Node 20.6+, `--watch` is stable from Node 22 (works in 20 as
  experimental).

### Commands

```bash
mkdir task-api && cd task-api
npm init -y
npm install express zod pino
npm install -D pino-pretty
```

Then replace `package.json` with the file below (it only lists what Stage 1 needs; later stages add
packages with `npm install`, and the complete final file is in Stage 7).

### `package.json` (Stage 1 state)

```json
{
  "name": "task-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "pino": "^9.7.0",
    "zod": "^4.1.0"
  },
  "devDependencies": {
    "pino-pretty": "^13.0.0"
  }
}
```

### `.gitignore`

```
node_modules/
.env
coverage/
*.log
.DS_Store
```

### `.env.example` (FINAL form, used by all stages)

Copy it to `.env` and edit. Never commit `.env`.

```dotenv
# --- App ---
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
# Number of reverse proxies in front of the app (0 = none). Needed for correct client IP + rate limiting.
TRUST_PROXY=0
# Comma-separated list of allowed browser origins (your frontend URLs)
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
# Serve Swagger UI at /docs (true/false)
DOCS_ENABLED=true

# --- MySQL ---
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=taskapi
DB_PASSWORD=change-me
DB_NAME=task_api
DB_POOL_SIZE=10

# --- Auth ---
# Generate with:
#   node -e "import('node:crypto').then(c=>console.log(c.randomBytes(32).toString('hex')))"
JWT_SECRET=replace-with-a-long-random-secret-from-the-command-above
JWT_EXPIRES_IN=1h
# 12 is a sensible production cost; tests use 4 for speed
BCRYPT_ROUNDS=12

# --- Rate limiting ---
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=10

# --- Seed script (scripts/seed.js) ---
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-this-admin-password

# --- Tests (a SEPARATE database; its name must end with _test) ---
TEST_DB_NAME=task_api_test
# Optional overrides, default to the DB_* values above:
# TEST_DB_HOST=127.0.0.1
# TEST_DB_PORT=3306
# TEST_DB_USER=root
# TEST_DB_PASSWORD=root

# --- Extensions A and B (Redis). Leave commented to run without Redis ---
# REDIS_URL=redis://127.0.0.1:6379
```

### `src/config/env.js`

```js
import { z } from 'zod';

// z.coerce.boolean() is a trap: Boolean("false") is true. Parse the literal strings ourselves.
// default() goes BEFORE transform() so the default is a valid input value (zod 4 semantics).
const bool = (fallback) =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DOCS_ENABLED: bool('true'),

  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().regex(/^[A-Za-z0-9_]+$/, 'only letters, digits and underscore'),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),

  JWT_SECRET: z
    .string()
    .min(32, 'must be at least 32 characters')
    .refine((value) => !value.startsWith('replace-with'), 'still the placeholder from .env.example'),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'use a form like 15m, 1h, 7d').default('1h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),

  REDIS_URL: z.string().min(1).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
}

export const env = Object.freeze(parsed.data);
```

### `src/config/logger.js`

```js
import pino from 'pino';
import { env } from './env.js';

// pino-pretty is a devDependency: only used while developing. In production we emit raw JSON lines
// (one object per line) which log tools (CloudWatch, Loki, ELK) can parse.
const prettyTransport =
  env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {};

export const logger = pino({
  level: env.LOG_LEVEL,
  // Defense in depth: even if someone logs a request/user object by accident, secrets are masked.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'password_hash',
      '*.password',
      '*.passwordHash',
      '*.password_hash',
    ],
    censor: '[REDACTED]',
  },
  ...prettyTransport,
});
```

### `src/modules/health/health.routes.js` (Stage 1)

```js
import { Router } from 'express';

export const healthRouter = Router();

// Liveness: "is the process up?" Must NOT touch the database.
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});
```

### `src/app.js` (Stage 1 state)

```js
import express from 'express';
import { healthRouter } from './modules/health/health.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by'); // do not advertise the framework
  app.use(express.json({ limit: '100kb' })); // body size cap: protects memory
  app.use(healthRouter);

  return app;
}
```

### `src/server.js` (Stage 1 state)

```js
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();

// Express 5: the callback receives an error argument if the port cannot be bound.
const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'failed to start server');
    process.exit(1);
  }
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'server listening');
});

let shuttingDown = false;

function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason }, 'shutting down');

  // Safety net: if something hangs, exit anyway. unref() so this timer alone cannot keep the process alive.
  setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000).unref();

  // Stop accepting new connections; the callback runs when in-flight requests finish.
  server.close((error) => {
    if (error) logger.error({ err: error }, 'error while closing http server');
    process.exit(error ? 1 : 0);
  });
  // Keep-alive sockets that are idle would otherwise hold close() open until they time out.
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled promise rejection');
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  shutdown('uncaughtException');
});
```

### Acceptance criteria

- [ ] `cp .env.example .env`, put a real `JWT_SECRET`, then `npm run dev` prints "server listening".
- [ ] `curl -i http://localhost:3000/health` returns `200` and `{"status":"ok",...}`.
- [ ] Remove `DB_USER` from `.env`, restart: the process exits with "Invalid environment configuration: - DB_USER: ...".
- [ ] Press Ctrl+C: log shows "shutting down" and the process exits with code 0.
- [ ] `curl -i http://localhost:3000/nope` returns Express's default HTML 404. (We will fix this in Stage 2.)
- [ ] There is no `console.log` in `src/` (the single `throw` in env.js is intentional; logger depends on env).

### Interview concepts demonstrated

- **Twelve-factor config:** config in environment, validated, one access point. `[ESSENTIAL]`
- **App factory vs server (testability):** `createApp()` does not listen. `[ESSENTIAL]`
- **Graceful shutdown:** stop accepting, finish in-flight, release resources, hard timeout. `[ESSENTIAL]`
- **Liveness vs readiness probes** (readiness comes in Stage 3). `[ESSENTIAL]`
- **Structured logging + redaction.** `[ESSENTIAL]`

### Stage 1 interview material

**Concept:** `createApp()` sirf Express app banata hai, port pe sunta nahi. `server.js` sunta hai.

**Why it matters:** Supertest ko app object chahiye, running server nahi. Aur ek hi process me multiple
instances (tests me) bina port conflict ke chal jaate hain.

**Internal working:** `app.listen()` internally `http.createServer(app).listen()` karta hai. Express app
ek function `(req, res)` hai jo Node ke HTTP server ka request listener ban jaata hai.

**Frontend connection:** jaise React me `<App />` component alag hota hai aur `ReactDOM.createRoot(...).render()`
alag file me. Component test ke liye DOM mount ki zarurat nahi padti wahi idea.

**Real-world scenario:** Kubernetes pod ko stop karta hai -> SIGTERM bhejta hai. Agar app turant mar gaya,
to in-flight payment request beech me kat jaati hai. Graceful shutdown se wo request complete hoti hai.

**Interview answer:** "I separate the Express app from the HTTP listener, so the app can be imported by
tests without opening a port. Configuration is validated once at startup with a schema, so a bad
deployment fails immediately instead of failing on the first request. On SIGTERM the server stops
accepting new connections, lets in-flight requests finish, closes resources, and has a hard timeout as a safety net."

**Follow-up questions**

1. *Why validate env at startup?* Because a missing `DB_PASSWORD` discovered at 3 AM on the first request is
   worse than a container that refuses to start during the deploy, where the orchestrator can roll back.
2. *Liveness vs readiness?* Liveness = restart me if I am dead (no dependency checks, or a DB blip restarts
   every pod). Readiness = send me traffic only if I can serve it (check DB).
3. *What does `server.close()` actually do?* Stops accepting new connections and calls back when all existing
   connections end. Idle keep-alive connections must be closed with `closeIdleConnections()` (Node 18.2+).

**Common mistakes**

- Reading `process.env.X` all over the codebase (typos become `undefined` silently).
- Calling `app.listen()` inside `app.js` (cannot test without a port).
- `process.exit()` immediately in a SIGTERM handler (drops in-flight requests).
- Using `z.coerce.boolean()` for flags (`"false"` becomes `true`).

**Revision notes:** env validated once -> frozen `env`; factory + listener split; graceful shutdown = close,
drain, release, timeout; liveness has no dependencies.

---

## 5. Stage 2 - CRUD + validation + centralized error handling (Week 3)

### Requirements

1. CRUD for tasks under `/api/v1/tasks` (create, list, get, partial update, delete). Storage is an
   in-memory `Map` for now. Data disappears on restart; that is intentional, Stage 3 swaps it for MySQL.
2. Every request body/param is validated with zod BEFORE reaching the controller. Unknown fields are rejected.
3. All errors leave the app through ONE error-handling middleware with ONE JSON shape (see section 2.2).
4. Unknown routes return the same JSON error shape (404), not Express's HTML page.
5. Controllers contain no business logic; services contain no `req`/`res`; the repository is the only
   place that touches storage.

### Implementation approach

- Layers: `routes -> controller -> service -> repository`. The repository exposes plain async
  functions (`list`, `findById`, `create`, `update`, `remove`). The SQL repository in Stage 3 will keep the
  SAME function names and return shapes, so the service does not change when storage changes.
- Custom `AppError` hierarchy carries `statusCode` + machine-readable `code`. Services throw them;
  only the error handler turns them into HTTP.
- Express 5 forwards rejected promises from async handlers to the error handler automatically.
  In Express 4 you needed `express-async-errors` or a try/catch wrapper in every handler.
- Express 5 difference that bites: `req.query` is a read-only getter. So the validate middleware does not
  overwrite `req.query`; it stores parsed values in `req.validated.{params,query,body}`.
- Another Express 5 difference: `req.body` is `undefined` (not `{}`) when no body was sent. Our validator
  uses `req[part] ?? {}`.

### `src/errors/app-error.js`

```js
// Operational errors: expected failures we deliberately throw (bad input, not found, forbidden...).
// Anything that is NOT an AppError is treated as a bug and becomes a generic 500.
export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details, cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details) {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, { statusCode: 401, code });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    super(message, { statusCode: 403, code });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, { statusCode: 404, code });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details) {
    super(message, { statusCode: 409, code, details });
  }
}

// 422: the JSON is well-formed and passes the schema, but a business rule rejects it
// (for example "assignee is deactivated").
export class UnprocessableError extends AppError {
  constructor(message = 'Unprocessable request', code = 'UNPROCESSABLE', details) {
    super(message, { statusCode: 422, code, details });
  }
}
```

### `src/middleware/validate.js`

```js
import { ValidationError } from '../errors/app-error.js';

/**
 * validate({ params, query, body }) -> middleware
 * Parses each part with its zod schema. On success the PARSED values (coerced, trimmed, defaults applied)
 * are stored in req.validated. On failure ALL problems from all parts are reported together.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    const issues = [];

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ in: part, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (issues.length > 0) return next(new ValidationError('Request validation failed', issues));

    req.validated = validated;
    next();
  };
}
```

### `src/middleware/not-found.js`

```js
import { NotFoundError } from '../errors/app-error.js';

// Registered AFTER all routes: if nothing matched, we get here.
export function notFound(req, _res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND'));
}
```

### `src/middleware/error-handler.js` (Stage 2 state)

```js
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logger } from '../config/logger.js';

// Translate ANY thrown value into { status, code, message, details }.
// Exported separately so it can be unit tested without Express.
export function toHttpError(err) {
  if (err instanceof AppError) {
    return { status: err.statusCode, code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.issues.map((i) => ({ in: 'body', path: i.path.join('.'), message: i.message })),
    };
  }

  // Errors raised by express.json() (body-parser). They carry a `type` string.
  if (err?.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  }
  if (err?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }

  // Other safe 4xx errors from libraries (http-errors sets expose=true for 4xx).
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 && err.expose) {
    return { status: err.status, code: 'BAD_REQUEST', message: err.message };
  }

  // Everything else is a bug or an infrastructure failure. NEVER leak its message to the client.
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' };
}

// Express recognises an error handler by its 4 parameters. Do not remove `next` even if unused.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err); // response already started; let Express close the socket

  const http = toHttpError(err);

  if (http.status >= 500) {
    (req.log ?? logger).error({ err }, 'unhandled error');
  }

  res.status(http.status).json({
    error: {
      code: http.code,
      message: http.message,
      ...(http.details ? { details: http.details } : {}),
      requestId: req.id,
    },
  });
}
```

### `src/modules/tasks/tasks.schemas.js` (Stage 2 state)

```js
import { z } from 'zod';

export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];

// URL params and query strings are always strings -> coerce. JSON bodies already carry numbers -> no coerce.
const paramId = z.coerce.number().int().positive();
export const bodyId = z.number().int().positive();

export const idParams = z.object({ id: paramId });

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(5000).nullable();
const dueDate = z.iso.date().nullable(); // "YYYY-MM-DD"

// strictObject: unknown keys are an ERROR (not silently dropped). This blocks mass-assignment
// attempts such as { "createdBy": 1 } or { "role": "admin" }.
export const createTaskBody = z.strictObject({
  title,
  description: description.optional(),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  dueDate: dueDate.optional(),
  assigneeId: bodyId.nullable().optional(),
});

export const updateTaskBody = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: dueDate.optional(),
    assigneeId: bodyId.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });
```

### `src/modules/tasks/tasks.repository.js` (Stage 2: in-memory)

```js
// In-memory storage. SAME exported function names/return shapes as the MySQL repository in Stage 3.
const store = new Map();
let nextId = 1;

const nowIso = () => new Date().toISOString();

export async function list() {
  return [...store.values()].sort((a, b) => b.id - a.id);
}

export async function findById(id) {
  return store.get(id) ?? null;
}

export async function create(data) {
  const timestamp = nowIso();
  const task = {
    id: nextId++,
    title: data.title,
    description: data.description ?? null,
    status: data.status ?? 'todo',
    priority: data.priority,
    dueDate: data.dueDate ?? null,
    createdBy: data.createdBy ?? null,
    assigneeId: data.assigneeId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.set(task.id, task);
  return task;
}

export async function update(id, patch) {
  const current = store.get(id);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: nowIso() };
  store.set(id, next);
  return next;
}

export async function remove(id) {
  return store.delete(id);
}
```

### `src/modules/tasks/tasks.service.js` (Stage 2 state)

```js
import * as tasksRepo from './tasks.repository.js';
import { NotFoundError } from '../../errors/app-error.js';

export async function listTasks() {
  return tasksRepo.list();
}

export async function getTask(id) {
  const task = await tasksRepo.findById(id);
  if (!task) throw new NotFoundError('Task not found');
  return task;
}

export async function createTask(input) {
  return tasksRepo.create(input);
}

export async function updateTask(id, patch) {
  const task = await tasksRepo.update(id, patch);
  if (!task) throw new NotFoundError('Task not found');
  return task;
}

export async function deleteTask(id) {
  const removed = await tasksRepo.remove(id);
  if (!removed) throw new NotFoundError('Task not found');
}
```

### `src/modules/tasks/tasks.controller.js` (Stage 2 state)

```js
import * as tasksService from './tasks.service.js';

// Express 5: if one of these async functions rejects, Express calls the error handler for us.

export async function list(_req, res) {
  const items = await tasksService.listTasks();
  res.json({ data: items });
}

export async function get(req, res) {
  const task = await tasksService.getTask(req.validated.params.id);
  res.json({ data: task });
}

export async function create(req, res) {
  const task = await tasksService.createTask(req.validated.body);
  res.status(201).location(`/api/v1/tasks/${task.id}`).json({ data: task });
}

export async function update(req, res) {
  const task = await tasksService.updateTask(req.validated.params.id, req.validated.body);
  res.json({ data: task });
}

export async function remove(req, res) {
  await tasksService.deleteTask(req.validated.params.id);
  res.status(204).end();
}
```

### `src/modules/tasks/tasks.routes.js` (Stage 2 state)

```js
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as controller from './tasks.controller.js';
import { createTaskBody, idParams, updateTaskBody } from './tasks.schemas.js';

export const tasksRouter = Router();

tasksRouter.get('/', controller.list);
tasksRouter.post('/', validate({ body: createTaskBody }), controller.create);
tasksRouter.get('/:id', validate({ params: idParams }), controller.get);
tasksRouter.patch('/:id', validate({ params: idParams, body: updateTaskBody }), controller.update);
tasksRouter.delete('/:id', validate({ params: idParams }), controller.remove);
```

### `src/app.js` (Stage 2 state)

```js
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { healthRouter } from './modules/health/health.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use(healthRouter);
  app.use('/api/v1/tasks', tasksRouter);

  // ORDER MATTERS: 404 after all routes, error handler absolutely last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
```

### Acceptance criteria (run these)

```bash
# 1. create (201 + Location header)
curl -i -X POST localhost:3000/api/v1/tasks -H "Content-Type: application/json" \
  -d '{"title":"Write Stage 2","priority":"high","dueDate":"2026-12-31"}'

# 2. list, get, patch, delete
curl localhost:3000/api/v1/tasks
curl localhost:3000/api/v1/tasks/1
curl -X PATCH localhost:3000/api/v1/tasks/1 -H "Content-Type: application/json" -d '{"status":"done"}'
curl -i -X DELETE localhost:3000/api/v1/tasks/1          # 204 No Content
curl -i localhost:3000/api/v1/tasks/1                    # 404 JSON error

# 3. negative cases
curl -i -X POST localhost:3000/api/v1/tasks -H "Content-Type: application/json" -d '{"title":""}'
curl -i -X POST localhost:3000/api/v1/tasks -H "Content-Type: application/json" -d '{"title":"x","createdBy":99}'
curl -i -X POST localhost:3000/api/v1/tasks -H "Content-Type: application/json" -d '{bad json'
curl -i localhost:3000/api/v1/tasks/abc
curl -i localhost:3000/api/v1/nope
curl -i -X PATCH localhost:3000/api/v1/tasks/1 -H "Content-Type: application/json" -d '{}'
```

- [ ] POST returns 201 and a `Location: /api/v1/tasks/1` header.
- [ ] Empty title -> 400 `VALIDATION_ERROR` with `details` pointing at `title`.
- [ ] Extra field `createdBy` -> 400 (strict schema).
- [ ] Broken JSON -> 400 `INVALID_JSON`; `/tasks/abc` -> 400; unknown route -> 404 JSON `ROUTE_NOT_FOUND`.
- [ ] Empty PATCH body `{}` -> 400 "Provide at least one field".
- [ ] No stack trace or internal message ever appears in a response.
- [ ] Add `throw new Error('boom')` temporarily in `listTasks` -> response is 500 `INTERNAL_ERROR` "Something went wrong", and the real error is logged. Remove it afterwards.

### Interview concepts demonstrated

- REST resource design, HTTP verbs and status codes (201 + Location, 204, 400/404). `[ESSENTIAL]`
- Request validation at the boundary + mass-assignment defense. `[ESSENTIAL]`
- Centralized error handling, operational vs programmer errors. `[ESSENTIAL]`
- Layered architecture / separation of concerns. `[ESSENTIAL]`
- Express 5 changes (async errors, read-only `req.query`, undefined body). `[ESSENTIAL]`

### Stage 2 interview material

**Concept:** Validation ek "gatekeeper" middleware hai: galat data controller tak pahunchta hi nahi.
Error handler ek jagah hai jahan har error ek hi JSON format me convert hota hai.

**Why it matters:** Agar har controller apna `try/catch` aur apna error format likhe, to 20 endpoints me
20 alag formats ban jaate hain. Frontend developer ke liye ye sabse irritating hota hai.

**Internal working:** Express middleware chain ek array of functions hai. Jab koi function `next(err)` call
karta hai (ya Express 5 me async function reject hota hai), Express normal middlewares skip karke seedha
4-argument wale `(err, req, res, next)` handler pe jaata hai.

**Frontend connection:** React me error boundary jaisa: ek jagah pe saare render errors pakadte ho. Aur zod
ko tum React Hook Form / form validation se jaante ho; yahan same schema server pe chalta hai kyunki
client validation par kabhi bharosa nahi karte (koi bhi curl se request bhej sakta hai).

**Real-world scenario:** Marketplace checkout me client "quantity: -5" bhej deta hai. Validation layer 400
deti hai; agar validation na ho to negative quantity se stock badh jaata hai ya total negative ho jaata hai.

**Interview answer:** "I validate every request at the boundary with a schema, params, query and body, and
reject unknown fields to prevent mass assignment. Business code throws typed errors that carry a status
and a machine-readable code. A single error-handling middleware converts everything into one JSON shape,
logs unexpected errors with the request id, and never exposes internal messages for 5xx responses."

**Follow-up questions**

1. *What changed in Express 5 regarding async errors?* Rejected promises returned by route handlers and
   middleware are passed to `next(err)` automatically. In v4 an unhandled rejection in an async handler
   hung the request or crashed the process, so we used wrappers.
2. *400 vs 422?* We use 400 when the request cannot be parsed or fails schema validation, 422 when it is
   well-formed but violates a business rule. Many teams use 400 for both; consistency is what matters.
3. *PUT vs PATCH?* PUT replaces the whole resource (idempotent), PATCH applies a partial change. We use
   PATCH because clients usually change one field. PATCH is not guaranteed idempotent in theory, but ours
   is (setting a field to a value twice gives the same result).
4. *Is DELETE idempotent if the second call returns 404?* Yes: idempotent means the server STATE after N
   calls equals the state after one call, not that the response is identical.
5. *Why not validate only in the frontend?* Frontend validation is UX; backend validation is security.

**Common mistakes**

- Forgetting that error middleware must be registered last and must have exactly 4 parameters.
- Returning `res.status(500).json({ message: err.message })` (leaks SQL text, file paths).
- Different error shapes per controller.
- Using `200` with `{ success: false }` for errors (breaks HTTP caches, monitoring, client libraries).
- In Express 5: assigning to `req.query` (it is a getter; the assignment is ignored or throws).

**Revision notes:** layers = routes/controller/service/repository; zod at the boundary with strict objects;
AppError with `code`; one error handler; 5xx never leaks details; Express 5 async errors are automatic.

---

## 6. Stage 3 - MySQL schema + data layer (Week 4-5)

### Requirements

1. A versioned SQL migration creates `users`, `tasks`, `task_events` with proper types, constraints,
   foreign keys and indexes. A tiny migration runner records applied files in `schema_migrations`.
2. A single `mysql2/promise` connection pool is created once and shared by the whole app.
3. `tasks.repository.js` is rewritten to use SQL. It keeps the same function names and return shapes as
   the in-memory version, so `tasks.service.js`, the controller and the routes do NOT change.
4. Database errors that are really client errors (duplicate key, missing foreign key) become proper
   4xx responses, not 500.
5. `GET /health/ready` checks the database. The server closes the pool on shutdown.

### Implementation approach

- Raw SQL with parameter placeholders (`?`). No ORM: the goal is to prove you understand SQL. (ORM vs raw
  SQL trade-offs are in the Q&A below and in Week 5 / Day 1 notes.)
- One repository function = one clear SQL statement. Functions accept an optional `executor` argument
  (`pool` by default, or a transaction connection later). That single parameter is what makes Stage 5
  transactions possible without rewriting the repository.
- Dates: the pool uses `timezone: 'Z'` (UTC) and returns `DATE` columns as `'YYYY-MM-DD'` strings
  (`dateStrings: ['DATE']`) so `dueDate` does not turn into a JavaScript Date at midnight in some timezone.
  Run MySQL itself in UTC (the Docker command below does that).
- We use `pool.query()` with `?` placeholders everywhere. mysql2 escapes values on the client with the
  same rules as the official `sqlstring` library, and it supports `IN (?)` with arrays and
  `VALUES ?` for bulk insert (`execute()` does not). `stringifyObjects: true` hardens against the "object
  expands into `col = val` pairs" injection variant. See the follow-up Q&A for `query` vs `execute`.
- Migrations: plain `.sql` files named `001_init.sql`, `002_...sql`. MySQL DDL auto-commits, so a
  migration that fails halfway can leave a partial change. Keep each migration small.

### Prepare MySQL (one time)

Option 1: Docker (simplest, UTC server):

```bash
docker run --name task-mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8.4 --default-time-zone=+00:00
```

Option 2: a local MySQL 8 installation (set `default-time-zone='+00:00'` in `my.ini`/`my.cnf`).

Create the app database and a least-privilege user (run in `mysql -uroot -p`, or
`docker exec -it task-mysql mysql -uroot -proot`):

```sql
CREATE DATABASE task_api CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'taskapi'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON task_api.* TO 'taskapi'@'%';
-- The test suite (Stage 6) creates and wipes this one, so it needs its own grant:
GRANT ALL PRIVILEGES ON task_api_test.* TO 'taskapi'@'%';
FLUSH PRIVILEGES;
```

Make sure `.env` has `DB_USER=taskapi`, `DB_PASSWORD=change-me`, `DB_NAME=task_api`. Then:

```bash
npm install mysql2
```

Add the migration script to `package.json` `scripts`:

```json
"migrate": "node --env-file=.env scripts/migrate.js"
```

### `db/migrations/001_init.sql`

```sql
-- 001_init.sql : initial schema (MySQL 8, InnoDB, utf8mb4)

CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)    NOT NULL,
  name          VARCHAR(100)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('admin', 'manager', 'member') NOT NULL DEFAULT 'member',
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE tasks (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(200)    NOT NULL,
  description TEXT            NULL,
  status      ENUM('todo', 'in_progress', 'done', 'cancelled') NOT NULL DEFAULT 'todo',
  priority    ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  due_date    DATE            NULL,
  created_by  BIGINT UNSIGNED NULL,
  assignee_id BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- "my open tasks", the reassign lock query, filter by assignee (+ status)
  KEY idx_tasks_assignee_status (assignee_id, status),
  KEY idx_tasks_created_by (created_by),
  -- overdue / due-soon dashboards: WHERE status = ? AND due_date <= ?
  KEY idx_tasks_status_due (status, due_date),
  -- default sort of the list endpoint
  KEY idx_tasks_created_at (created_at),
  CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_assignee   FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE task_events (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    BIGINT UNSIGNED NOT NULL,
  actor_id   BIGINT UNSIGNED NULL,
  event_type VARCHAR(50)     NOT NULL,
  details    JSON            NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_events_task (task_id, id),
  KEY idx_task_events_actor (actor_id),
  CONSTRAINT fk_task_events_task  FOREIGN KEY (task_id)  REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_task_events_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
```

Design notes you should be able to say out loud:

- `ON DELETE SET NULL` on user FKs: deleting a user must not delete the company's tasks. Admins "deactivate"
  (`is_active = 0`) instead of deleting, so history stays attributable.
- `ON DELETE CASCADE` on `task_events.task_id`: events of a deleted task are meaningless. (Trade-off: the
  audit trail is lost when a task is hard-deleted. A production system might soft-delete instead.)
- `ENUM` is compact and self-validating, but adding a value needs an `ALTER TABLE`. `ENUM` columns sort by
  their declared order (low < medium < high), which we use for sorting by priority.
- Every index has a named query it serves. Indexes slow down writes and use disk; do not add "just in case".
- `utf8mb4_0900_ai_ci`: accent- and case-insensitive collation, so `UNIQUE(email)` treats `A@x.com` and
  `a@x.com` as duplicates. We still lower-case emails in the app.

### `scripts/migrate.js`

```js
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(here, '../db/migrations');

/**
 * Applies every db/migrations/*.sql file not yet recorded in schema_migrations, in filename order.
 * `config` = { host, port, user, password, database }. Returns the list of files applied now.
 * NOTE: MySQL DDL statements auto-commit, so there is no transaction around a migration file.
 */
export async function runMigrations(config) {
  // multipleStatements is needed to run a whole .sql file. Never enable it on the application pool:
  // it turns any SQL injection into a stacked-query injection.
  const connection = await mysql.createConnection({ ...config, multipleStatements: true });
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE = InnoDB
    `);

    const [rows] = await connection.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name));

    const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();
    const ranNow = [];

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      ranNow.push(file);
    }

    return ranNow;
  } finally {
    await connection.end();
  }
}

// CLI entry: `npm run migrate`. Skipped when this file is only imported (e.g. by the test setup).
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const { env } = await import('../src/config/env.js');
  const ranNow = await runMigrations({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });
  console.log(ranNow.length === 0 ? 'No new migrations.' : `Applied: ${ranNow.join(', ')}`);
}
```

(`console.log` is fine in a CLI script; the "no console.log" rule is for the server code.)

### `src/db/pool.js`

```js
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  waitForConnections: true, // when all connections are busy, queue the request instead of failing
  connectionLimit: env.DB_POOL_SIZE,
  queueLimit: 100, // bounded queue = backpressure; the 101st waiter gets an error instead of memory growing forever
  connectTimeout: 10_000,
  enableKeepAlive: true,

  timezone: 'Z', // interpret/send DATETIME and TIMESTAMP values as UTC
  dateStrings: ['DATE'], // keep DATE columns as 'YYYY-MM-DD' strings
  stringifyObjects: true, // never expand a JS object into SQL (injection hardening)
});
```

### `src/modules/tasks/tasks.repository.js` (Stage 3: MySQL)

```js
import { pool } from '../../db/pool.js';

// LEFT JOIN: a task may have no assignee (assignee_id IS NULL), and we still want the task row.
const SELECT_TASK = `
  SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date,
         t.created_by, t.assignee_id, t.created_at, t.updated_at,
         a.name AS assignee_name
  FROM tasks t
  LEFT JOIN users a ON a.id = t.assignee_id`;

// API field name -> column name. This whitelist is what makes dynamic UPDATE safe:
// column names never come from user input.
const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  assigneeId: 'assignee_id',
};

// Row (snake_case) -> API object (camelCase). Works for rows with or without the joined assignee_name.
export function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdBy: row.created_by,
    assigneeId: row.assignee_id,
    assignee: row.assignee_id ? { id: row.assignee_id, name: row.assignee_name ?? null } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Temporary safety cap. Stage 5 replaces this with real pagination + filters.
export async function list(executor = pool) {
  const [rows] = await executor.query(`${SELECT_TASK} ORDER BY t.id DESC LIMIT 200`);
  return rows.map(toTask);
}

export async function findById(id, executor = pool) {
  const [rows] = await executor.query(`${SELECT_TASK} WHERE t.id = ?`, [id]);
  return rows.length > 0 ? toTask(rows[0]) : null;
}

export async function create(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO tasks (title, description, status, priority, due_date, created_by, assignee_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description ?? null,
      data.status ?? 'todo',
      data.priority,
      data.dueDate ?? null,
      data.createdBy ?? null,
      data.assigneeId ?? null,
    ],
  );
  return findById(result.insertId, executor);
}

// Returns the updated task, or null if no task has this id.
export async function update(id, patch, executor = pool) {
  const assignments = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
    if (patch[key] !== undefined) {
      assignments.push(`${column} = ?`);
      params.push(patch[key]);
    }
  }

  if (assignments.length > 0) {
    params.push(id);
    await executor.query(`UPDATE tasks SET ${assignments.join(', ')} WHERE id = ?`, params);
  }
  return findById(id, executor);
}

export async function remove(id, executor = pool) {
  const [result] = await executor.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
```

### `src/middleware/error-handler.js` (Stage 3 state: adds MySQL error mapping)

```js
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logger } from '../config/logger.js';

// mysql2 errors carry a string `code`. These are CLIENT-caused, so they must not be 500s.
const MYSQL_ERRORS = {
  ER_DUP_ENTRY: { status: 409, code: 'CONFLICT', message: 'A record with the same unique value already exists' },
  ER_NO_REFERENCED_ROW_2: { status: 400, code: 'INVALID_REFERENCE', message: 'A referenced record does not exist' },
  ER_ROW_IS_REFERENCED_2: { status: 409, code: 'IN_USE', message: 'This record is referenced by other records' },
};

export function toHttpError(err) {
  if (err instanceof AppError) {
    return { status: err.statusCode, code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.issues.map((i) => ({ in: 'body', path: i.path.join('.'), message: i.message })),
    };
  }

  if (err?.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  }
  if (err?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }

  if (typeof err?.code === 'string' && MYSQL_ERRORS[err.code]) {
    return MYSQL_ERRORS[err.code];
  }

  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 && err.expose) {
    return { status: err.status, code: 'BAD_REQUEST', message: err.message };
  }

  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const http = toHttpError(err);

  if (http.status >= 500) {
    (req.log ?? logger).error({ err }, 'unhandled error');
  }

  res.status(http.status).json({
    error: {
      code: http.code,
      message: http.message,
      ...(http.details ? { details: http.details } : {}),
      requestId: req.id,
    },
  });
}
```

### `src/modules/health/health.routes.js` (Stage 3 state: adds readiness)

```js
import { Router } from 'express';
import { logger } from '../../config/logger.js';
import { pool } from '../../db/pool.js';

export const healthRouter = Router();

// Liveness: "is the process up?" Must NOT touch the database.
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

// Readiness: "can I serve traffic?" Checks the database. A load balancer stops routing here on 503.
healthRouter.get('/health/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (err) {
    logger.error({ err }, 'readiness check failed');
    res.status(503).json({ status: 'unavailable' });
  }
});
```

### `src/server.js` (Stage 3 state: closes the pool)

```js
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './db/pool.js';

const app = createApp();

const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'failed to start server');
    process.exit(1);
  }
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'server listening');
});

let shuttingDown = false;

function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason }, 'shutting down');

  setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000).unref();

  server.close(async (closeError) => {
    if (closeError) logger.error({ err: closeError }, 'error while closing http server');
    try {
      await pool.end(); // wait for checked-out connections to return, then close them
    } catch (poolError) {
      logger.error({ err: poolError }, 'error while closing database pool');
    }
    process.exit(closeError ? 1 : 0);
  });
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled promise rejection');
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  shutdown('uncaughtException');
});
```

### Acceptance criteria

```bash
npm install mysql2
npm run migrate        # prints: Applied: 001_init.sql   (second run: No new migrations.)
npm run dev
curl -i localhost:3000/health/ready      # 200 {"status":"ready"}
curl -X POST localhost:3000/api/v1/tasks -H "Content-Type: application/json" -d '{"title":"Persisted"}'
# stop and restart the server, then:
curl localhost:3000/api/v1/tasks         # the task is still there
curl -i -X POST localhost:3000/api/v1/tasks -H "Content-Type: application/json" -d '{"title":"bad fk","assigneeId":999}'
```

- [ ] `SHOW TABLES;` lists `users`, `tasks`, `task_events`, `schema_migrations`.
- [ ] Data survives a server restart.
- [ ] `assigneeId: 999` -> 400 `INVALID_REFERENCE` (the database enforced the foreign key, our handler translated it).
- [ ] Stop MySQL (`docker stop task-mysql`): `/health` stays 200, `/health/ready` becomes 503. Start it again.
- [ ] Run in MySQL: `EXPLAIN SELECT id FROM tasks WHERE assignee_id = 1 AND status = 'todo';` and see `key: idx_tasks_assignee_status`.
- [ ] Creating a task whose title contains an apostrophe (for example `It's fine`) works (parameters, not string concatenation).

### Interview concepts demonstrated

- Relational modelling: PK, FK, unique, ENUM, nullable columns, `ON DELETE` behaviour. `[ESSENTIAL]`
- Connection pooling (size, queue, shutdown). `[ESSENTIAL]`
- Parameterized queries and SQL injection defense. `[ESSENTIAL]`
- Index design tied to concrete queries; `EXPLAIN`. `[ESSENTIAL]`
- Repository pattern: swapping storage behind a stable interface. `[ESSENTIAL]`
- Schema migrations. `[ESSENTIAL]`
- Timezone/date handling pitfalls with `mysql2`. `[ADVANCED]`

### Stage 3 interview material

**Concept:** Pool = pehle se khule hue database connections ka ek set. Har request ek connection udhaar leti hai,
kaam khatam hone par wapas deti hai. Naya connection kholna (TCP + auth handshake) mehenga hota hai.

**Why it matters:** Bina pool ke har request ka naya connection = slow + MySQL ke `max_connections` (default
151) jaldi khatam. Ek hi connection sab requests me share karoge to wo queries serial ho jaati hain.

**Internal working:** `pool.query()` ek free connection nikalta hai, query bhejta hai, aur connection wapas
pool me daal deta hai. Agar sab busy hain to request queue me wait karti hai (`waitForConnections`), aur queue
bhar jaaye to error (`queueLimit`). Transaction ke liye `pool.getConnection()` se ek connection lete hain
kyunki transaction ek hi connection par honi chahiye.

**Frontend connection:** Browser bhi ek server ke saath limited parallel connections (HTTP/1.1) ya multiplexing
(HTTP/2) use karta hai. Pool wahi idea hai, bas server-to-database side par.

**Real-world scenario:** Sale ke time marketplace par traffic 10x. App instances badhte hain (autoscaling).
Agar har instance ka pool size 20 hai aur 10 instances hain, to 200 connections ho gaye aur MySQL 151 par
reject karne lagta hai. Isliye: `instances x poolSize <= max_connections` (aur kuch headroom).

**Interview answer:** "I use a single mysql2 connection pool per process, created at startup and closed on
shutdown. Pool size is chosen so that instances times pool size stays under the database's max_connections.
All queries are parameterized, so user input is never concatenated into SQL. Table columns are chosen with
constraints and foreign keys so the database itself protects data integrity, and each index exists to serve
a specific query that I verified with EXPLAIN."

**Follow-up questions**

1. *`query()` vs `execute()` in mysql2?* `execute()` uses real server-side prepared statements (SQL and values
   travel separately, the statement can be reused per connection). `query()` builds the final SQL string on
   the client by escaping values. Both are safe when every value goes through `?` placeholders and the values
   are primitives. We use `query()` because we need `IN (?)` with arrays and bulk `VALUES ?`, and there is a
   known quirk where `execute()` with a numeric `LIMIT ?` fails on MySQL 8.0.22+ unless you pass strings.
   Hardening: `stringifyObjects: true`, and zod guarantees primitives.
2. *ORM vs raw SQL?* ORM (Prisma, Sequelize, TypeORM) gives migrations, models and less boilerplate but hides
   the SQL and can generate inefficient queries (N+1). Raw SQL gives control and clarity but you maintain
   mapping code. A good answer: "I can use either; I chose raw SQL here to show I understand joins, indexes
   and transactions; in a big team I would likely add a query builder like Knex or an ORM."
3. *What is N+1?* Fetch 20 tasks, then run 20 more queries to fetch each assignee. Fix with a JOIN (we did)
   or one `WHERE id IN (...)` query.
4. *Why `LEFT JOIN` and not `INNER JOIN` for the assignee?* INNER JOIN drops tasks with no assignee. LEFT JOIN keeps them with NULL columns.
5. *Why BIGINT UNSIGNED ids and not UUID?* Auto-increment integers are small, ordered (good B-tree locality
   and insert speed in InnoDB) but guessable and awkward to merge across systems. UUIDs avoid guessing
   (use UUIDv7 or `UUID_TO_BIN(uuid, 1)` for ordering). For this API, authorization checks, not id secrecy, protect data.
6. *What if two instances run migrations together?* Race. Use a deploy step that runs migrations once (a one-shot
   job), or take `GET_LOCK('migrate', 30)` in the runner. `[ADVANCED]`

**Common mistakes**

- Building SQL with template strings and user input: `` `WHERE title = '${title}'` `` (SQL injection).
- Dynamic `ORDER BY` / column names taken straight from the query string (placeholders cannot parameterize identifiers; use a whitelist).
- Forgetting `conn.release()` after `getConnection()` (the pool leaks and eventually hangs). Stage 5 wraps this once.
- Using the pool for a transaction: `BEGIN` on one pooled connection and the next statement on another.
- A pool larger than the DB can handle; no `queueLimit`; not closing the pool on shutdown.
- Storing money in FLOAT (use DECIMAL or integer minor units). Not needed here, but a classic follow-up.

**Revision notes:** one pool per process; `instances x pool <= max_connections`; placeholders always; whitelist
for identifiers; FK errors mapped to 4xx; repository keeps the same interface; readiness checks DB, liveness does not.

---

## 7. Stage 4 - Authentication + RBAC (Week 5)

### Requirements

1. `POST /api/v1/auth/register` creates a `member`. The client can NEVER choose a role.
2. `POST /api/v1/auth/login` verifies email + password and returns a signed JWT access token.
3. `GET /api/v1/auth/me` returns the current user.
4. Passwords are hashed with bcrypt (never stored or logged in plain text). Login must not reveal whether the
   email exists (same error, similar timing).
5. All `/api/v1/tasks` routes require a valid token. A deactivated user is rejected immediately, even with
   an unexpired token.
6. Role-based access control (RBAC) exactly as in the matrix in section 2.4: members see only their own
   tasks, only manager/admin can delete or change assignee, only admin can change roles.
7. A seed script creates the first admin (there is no API to create an admin, on purpose).

### Implementation approach

- Authentication (who are you?) and authorization (what may you do?) are separate middleware/functions:
  `authenticate` puts `req.user`, `authorize(...roles)` checks the role, and finer rules ("is this task visible
  to this user?") live in a small pure module `task-policy.js` that the service uses.
- JWT: HS256, payload `{ sub, role, iss, exp, iat }`. We pin the algorithm on verify (blocks the `alg: none`
  and algorithm-confusion attacks).
- `authenticate` loads the user from the DB on every request. Trade-off: one extra primary-key lookup per
  request, but role changes and deactivation take effect immediately. A purely stateless check would trust
  the token for its whole lifetime (up to 1 hour here). Extension A can cache this lookup.
- Hide existence: a member requesting someone else's task gets 404, not 403.
- Authorization is enforced in the route (`authorize`) AND again in the service where it protects data
  (defense in depth; the service can be reused by a job or another route).
- Order of middleware on a route: `authenticate -> authorize -> validate -> controller`, so an anonymous or
  unauthorized caller learns nothing about the validation rules.
- We implement access tokens only. Refresh tokens, rotation and token revocation lists are explained in the
  interview Q&A (Week 5 / Day 4 notes cover them in depth); adding them is a follow-up, not a Stage 4 requirement.

### Commands

```bash
npm install bcryptjs jsonwebtoken
```

Add to `package.json` scripts: `"seed": "node --env-file=.env scripts/seed.js"`.

### `src/modules/auth/password.js`

```js
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';

// bcrypt embeds a random salt and the cost factor inside the hash string, so we store ONE column.
// Cost 12 means 2^12 rounds: slow enough to make offline brute force expensive, fast enough for login.
export function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
```

### `src/modules/auth/tokens.js`

```js
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const ISSUER = 'task-api';

export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(user.id),
    issuer: ISSUER,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// ALWAYS pass `algorithms`: never let the token header decide how it is verified.
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], issuer: ISSUER });
}
```

### `src/modules/users/users.repository.js` (Stage 4 state)

```js
import { pool } from '../../db/pool.js';

const PUBLIC_COLUMNS = 'id, email, name, role, is_active, created_at, updated_at';

// Never include password_hash in objects that can reach a response.
export function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findById(id, executor = pool) {
  const [rows] = await executor.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows.length > 0 ? toUser(rows[0]) : null;
}

// Shared lock: while our transaction is open, nobody can change/delete this user row
// (for example deactivate the assignee while we are assigning work to them). Used in Stage 5.
export async function findByIdForShare(id, executor) {
  const [rows] = await executor.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? FOR SHARE`, [id]);
  return rows.length > 0 ? toUser(rows[0]) : null;
}

// The ONLY query that selects password_hash. Returns the raw row; used by login.
export async function findByEmailWithHash(email, executor = pool) {
  const [rows] = await executor.query(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = ?`, [email]);
  return rows.length > 0 ? rows[0] : null;
}

export async function create({ email, name, passwordHash, role }, executor = pool) {
  const [result] = await executor.query(
    'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
    [email, name, passwordHash, role],
  );
  return findById(result.insertId, executor);
}

export async function update(id, { role, isActive }, executor = pool) {
  const assignments = [];
  const params = [];

  if (role !== undefined) {
    assignments.push('role = ?');
    params.push(role);
  }
  if (isActive !== undefined) {
    assignments.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  if (assignments.length > 0) {
    params.push(id);
    await executor.query(`UPDATE users SET ${assignments.join(', ')} WHERE id = ?`, params);
  }
  return findById(id, executor);
}
```

### `src/modules/auth/auth.schemas.js`

```js
import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(255);

export const registerBody = z.strictObject({
  email,
  name: z.string().trim().min(1).max(100),
  // bcrypt only uses the first 72 BYTES of the password, so a longer limit would be a false promise.
  password: z.string().min(8).max(72),
});

export const loginBody = z.strictObject({
  email,
  password: z.string().min(1).max(72),
});
```

### `src/modules/auth/auth.service.js`

```js
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError } from '../../errors/app-error.js';
import * as usersRepo from '../users/users.repository.js';
import { hashPassword, verifyPassword } from './password.js';
import { signAccessToken } from './tokens.js';

// Used when the email does not exist, so the "unknown user" path still pays the bcrypt cost.
// Without it, response time would reveal which emails are registered. Created lazily, once.
let dummyHash;
const getDummyHash = () => (dummyHash ??= hashPassword('not-a-real-password'));

function buildAuthResult(user) {
  return {
    user,
    accessToken: signAccessToken(user),
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export async function register({ email, name, password }) {
  const passwordHash = await hashPassword(password);
  try {
    // role is fixed here. Even if the schema allowed a role field, we would ignore it (no mass assignment).
    const user = await usersRepo.create({ email, name, passwordHash, role: 'member' });
    return buildAuthResult(user);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('This email is already registered', 'EMAIL_TAKEN');
    }
    throw err;
  }
}

export async function login({ email, password }) {
  const row = await usersRepo.findByEmailWithHash(email);
  const passwordOk = await verifyPassword(password, row ? row.password_hash : await getDummyHash());

  // One message for: unknown email, wrong password, deactivated account.
  if (!row || !passwordOk || !row.is_active) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  return buildAuthResult(usersRepo.toUser(row));
}
```

### `src/modules/auth/auth.controller.js`

```js
import * as authService from './auth.service.js';

export async function register(req, res) {
  const result = await authService.register(req.validated.body);
  res.status(201).json({ data: result });
}

export async function login(req, res) {
  const result = await authService.login(req.validated.body);
  res.json({ data: result });
}

export async function me(req, res) {
  res.json({ data: req.user });
}
```

### `src/modules/auth/auth.routes.js`

```js
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { loginBody, registerBody } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerBody }), controller.register);
authRouter.post('/login', validate({ body: loginBody }), controller.login);
authRouter.get('/me', authenticate, controller.me);
```

### `src/middleware/auth.js`

```js
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';
import * as usersRepo from '../modules/users/users.repository.js';

// Authentication: "who is calling?" Sets req.user or throws 401.
// Async middleware: in Express 5 a throw/rejection here goes to the error handler automatically.
export async function authenticate(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new UnauthorizedError('Missing or malformed Authorization header', 'MISSING_TOKEN');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid access token', 'INVALID_TOKEN');
  }

  // Re-read the user: a role change or deactivation applies immediately, not after the token expires.
  const userId = Number(payload.sub);
  const user = Number.isInteger(userId) ? await usersRepo.findById(userId) : null;
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Account not found or disabled', 'ACCOUNT_DISABLED');
  }

  req.user = user;
  next();
}

// Authorization by role: authorize('admin', 'manager')
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}
```

### Edit `src/middleware/error-handler.js` (one line)

Per the HTTP spec a 401 response should say which scheme to use. In `errorHandler`, just before
`res.status(http.status).json(...)`, add:

```js
  if (http.status === 401) res.set('WWW-Authenticate', 'Bearer');
```

### `src/modules/users/users.schemas.js` (Stage 4 state)

```js
import { z } from 'zod';

export const ROLES = ['admin', 'manager', 'member'];

export const idParams = z.object({ id: z.coerce.number().int().positive() });

export const updateUserBody = z
  .strictObject({
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Provide at least one field to update' });
```

### `src/modules/users/users.service.js` (Stage 4 state)

```js
import { ForbiddenError, NotFoundError } from '../../errors/app-error.js';
import * as usersRepo from './users.repository.js';

export async function updateUser(actor, id, patch) {
  if (actor.role !== 'admin') throw new ForbiddenError();

  const target = await usersRepo.findById(id);
  if (!target) throw new NotFoundError('User not found');

  // Guard rail: an admin must not lock themselves out of the system.
  if (actor.id === target.id) {
    const demoting = patch.role !== undefined && patch.role !== target.role;
    const deactivating = patch.isActive === false;
    if (demoting || deactivating) {
      throw new ForbiddenError('You cannot change your own role or deactivate your own account', 'SELF_MODIFICATION');
    }
  }

  return usersRepo.update(id, patch);
}
```

### `src/modules/users/users.controller.js` (Stage 4 state)

```js
import * as usersService from './users.service.js';

export async function update(req, res) {
  const user = await usersService.updateUser(req.user, req.validated.params.id, req.validated.body);
  res.json({ data: user });
}
```

### `src/modules/users/users.routes.js` (Stage 4 state)

```js
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './users.controller.js';
import { idParams, updateUserBody } from './users.schemas.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.patch('/:id', authorize('admin'), validate({ params: idParams, body: updateUserBody }), controller.update);
```

### `src/modules/tasks/task-policy.js` (Stage 4 state)

```js
// Pure functions (no I/O): trivial to unit test, and the single source of truth for "who may see what".

export function isPrivileged(user) {
  return user.role === 'admin' || user.role === 'manager';
}

// A member sees only tasks assigned to them or created by them. Managers/admins see everything.
export function canViewTask(user, task) {
  return isPrivileged(user) || task.assigneeId === user.id || task.createdBy === user.id;
}
```

### Edit `src/modules/tasks/tasks.repository.js`: replace the `list` function

Everything else in the Stage 3 file stays. Replace `list` so the service can ask for "only tasks visible to this user":

```js
// visibleTo: when set, return only tasks assigned to or created by that user id.
// Stage 5 replaces this with pagination + filters.
export async function list({ visibleTo } = {}, executor = pool) {
  const where = visibleTo === undefined ? '' : 'WHERE (t.assignee_id = ? OR t.created_by = ?)';
  const params = visibleTo === undefined ? [] : [visibleTo, visibleTo];
  const [rows] = await executor.query(`${SELECT_TASK} ${where} ORDER BY t.id DESC LIMIT 200`, params);
  return rows.map(toTask);
}
```

### `src/modules/tasks/tasks.service.js` (Stage 4 state)

```js
import * as tasksRepo from './tasks.repository.js';
import { canViewTask, isPrivileged } from './task-policy.js';
import { ForbiddenError, NotFoundError } from '../../errors/app-error.js';

export async function listTasks(actor) {
  return tasksRepo.list({ visibleTo: isPrivileged(actor) ? undefined : actor.id });
}

export async function getTask(actor, id) {
  const task = await tasksRepo.findById(id);
  // Same 404 for "does not exist" and "exists but not yours": do not leak which ids exist.
  if (!task || !canViewTask(actor, task)) throw new NotFoundError('Task not found');
  return task;
}

export async function createTask(actor, input) {
  let assigneeId = input.assigneeId;

  if (!isPrivileged(actor)) {
    // Members work on their own tasks only.
    if (assigneeId !== undefined && assigneeId !== actor.id) {
      throw new ForbiddenError('Members can only assign tasks to themselves');
    }
    assigneeId = actor.id;
  }

  // createdBy comes from the token, never from the request body.
  return tasksRepo.create({ ...input, assigneeId, createdBy: actor.id });
}

export async function updateTask(actor, id, patch) {
  await getTask(actor, id); // 404 if missing or not visible

  if (patch.assigneeId !== undefined && !isPrivileged(actor)) {
    throw new ForbiddenError('Only managers and admins can change the assignee');
  }
  return tasksRepo.update(id, patch);
}

export async function deleteTask(actor, id) {
  if (!isPrivileged(actor)) throw new ForbiddenError();
  const removed = await tasksRepo.remove(id);
  if (!removed) throw new NotFoundError('Task not found');
}
```

### `src/modules/tasks/tasks.controller.js` (Stage 4 state)

```js
import * as tasksService from './tasks.service.js';

export async function list(req, res) {
  const items = await tasksService.listTasks(req.user);
  res.json({ data: items });
}

export async function get(req, res) {
  const task = await tasksService.getTask(req.user, req.validated.params.id);
  res.json({ data: task });
}

export async function create(req, res) {
  const task = await tasksService.createTask(req.user, req.validated.body);
  res.status(201).location(`/api/v1/tasks/${task.id}`).json({ data: task });
}

export async function update(req, res) {
  const task = await tasksService.updateTask(req.user, req.validated.params.id, req.validated.body);
  res.json({ data: task });
}

export async function remove(req, res) {
  await tasksService.deleteTask(req.user, req.validated.params.id);
  res.status(204).end();
}
```

### `src/modules/tasks/tasks.routes.js` (Stage 4 state)

```js
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './tasks.controller.js';
import { createTaskBody, idParams, updateTaskBody } from './tasks.schemas.js';

export const tasksRouter = Router();

tasksRouter.use(authenticate); // every task route needs a logged-in user

tasksRouter.get('/', controller.list);
tasksRouter.post('/', validate({ body: createTaskBody }), controller.create);
tasksRouter.get('/:id', validate({ params: idParams }), controller.get);
tasksRouter.patch('/:id', validate({ params: idParams, body: updateTaskBody }), controller.update);
tasksRouter.delete('/:id', authorize('admin', 'manager'), validate({ params: idParams }), controller.remove);
```

### `src/app.js` (Stage 4 state)

```js
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use(healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/tasks', tasksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
```

### `scripts/seed.js`

```js
import { pool } from '../src/db/pool.js';
import { hashPassword } from '../src/modules/auth/password.js';

// Usage: npm run seed            -> creates the admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
//        npm run seed -- --demo  -> also creates manager@example.com and member@example.com (same password)
// NEVER use --demo in production: those accounts have a publicly known email.
const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword || adminPassword.length < 12) {
  console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least 12 characters) in .env');
  process.exit(1);
}

const users = [{ email: adminEmail, name: 'Admin', role: 'admin' }];
if (process.argv.includes('--demo')) {
  users.push(
    { email: 'manager@example.com', name: 'Demo Manager', role: 'manager' },
    { email: 'member@example.com', name: 'Demo Member', role: 'member' },
  );
}

try {
  for (const user of users) {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);
    if (existing.length > 0) {
      console.log(`${user.email}: already exists, skipped`);
      continue;
    }
    const passwordHash = await hashPassword(adminPassword); // per user: a fresh salt each time
    await pool.query('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)', [
      user.email,
      user.name,
      passwordHash,
      user.role,
    ]);
    console.log(`${user.email}: created as ${user.role}`);
  }
} finally {
  await pool.end();
}
```

### Acceptance criteria

```bash
npm install bcryptjs jsonwebtoken
npm run seed -- --demo
npm run dev

# login as the manager and keep the token
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"<your SEED_ADMIN_PASSWORD>"}' | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).data.accessToken")

curl -i localhost:3000/api/v1/tasks                                   # 401 MISSING_TOKEN + WWW-Authenticate header
curl -i localhost:3000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"   # 200
curl -i localhost:3000/api/v1/auth/me -H "Authorization: Bearer ${TOKEN}x" # 401 INVALID_TOKEN
```

- [ ] Register a new user: 201, the response has NO `password` / `password_hash`; role is `member`.
- [ ] Register with `"role":"admin"` in the body: 400 (strict schema, mass assignment blocked).
- [ ] Register the same email twice (also with different letter case): 409 `EMAIL_TAKEN`.
- [ ] Wrong password and unknown email return the same 401 `INVALID_CREDENTIALS` message.
- [ ] As member: create a task (gets `assigneeId` = you, `createdBy` = you); assign to another user -> 403;
  list shows only your tasks; fetch a manager's unrelated task -> 404; `DELETE` -> 403.
- [ ] As manager: assign to the member -> 201; delete -> 204.
- [ ] Admin `PATCH /api/v1/users/:id` `{"role":"manager"}` works; manager gets 403; admin demoting self gets 403 `SELF_MODIFICATION`.
- [ ] Deactivate a user (admin) and call `/auth/me` with that user's old token: 401 `ACCOUNT_DISABLED`.
- [ ] In the database, `password_hash` starts with `$2a$` or `$2b$` followed by the cost (`12`) and is different for two users with the same password.

### Interview concepts demonstrated

- Authentication vs authorization; 401 vs 403 vs 404. `[ESSENTIAL]`
- Password hashing with bcrypt (salt, cost) and why never encrypt/plain/SHA. `[ESSENTIAL]`
- JWT structure, signature verification, pinned algorithm, expiry. `[ESSENTIAL]`
- RBAC + resource-level (ownership) authorization. `[ESSENTIAL]`
- Mass assignment, user enumeration, timing side channels. `[ESSENTIAL]`
- Stateless tokens vs per-request user lookup (revocation trade-off). `[ADVANCED]`

### Stage 4 interview material

**Concept:** Authentication = "tum kaun ho?" (login, token). Authorization = "tumhe ye karne ki permission hai?"
(role, ownership). Dono alag steps hain aur dono har protected request par chalte hain.

**Why it matters:** Sabse common real-world security bug authorization ka hota hai (IDOR: user A ka token use
karke user B ka `/tasks/57` khol lena). Isliye "token valid hai" ke baad bhi har resource par ownership check chahiye.

**Internal working:** JWT = `base64url(header).base64url(payload).signature`. Signature =
`HMAC_SHA256(header + "." + payload, secret)`. Server payload ko decrypt nahi karta (payload sirf encoded hai,
encrypted nahi); wo signature dobara compute karke compare karta hai. Payload badla to signature match nahi hoga.
Isliye payload me secret/password kabhi nahi daalte.

**Frontend connection:** Tum login ke baad token ko `localStorage` ya memory me rakhte ho aur har request me
`Authorization: Bearer ...` bhejte ho (axios interceptor). Backend side par wahi header parse hota hai. Tum
route guards (`<PrivateRoute role="admin">`) bhi banate ho; wo sirf UX hai. Asli guard backend ka `authorize` hai.

**Real-world scenario:** Banking app: customer apna statement dekh sakta hai (ownership), teller sab customers
ke accounts dekh sakta hai (role), auditor sirf read kar sakta hai (role + method). Same pattern.

**Interview answer:** "Passwords are hashed with bcrypt, which adds a per-password salt and a configurable cost.
Login returns a short-lived signed JWT with the user id as the subject and the role as a claim. A middleware
verifies the signature with a pinned algorithm, then loads the user so deactivation and role changes take
effect immediately. Authorization is layered: route-level role checks, then resource-level checks in the service
so a member can only see tasks they own or are assigned, and the API returns 404 instead of 403 to avoid leaking
which ids exist."

**Follow-up questions**

1. *Where would you store the JWT in the browser?* In an `httpOnly`, `Secure`, `SameSite` cookie if the frontend
   and API share a site (XSS cannot read it, but you then need CSRF protection). `localStorage` is easy but any
   XSS steals the token. For a pure API with a separate SPA, many teams keep a short-lived access token in memory
   and a refresh token in an httpOnly cookie.
2. *How do refresh tokens work?* Access token lives 5-15 minutes. A long-lived random refresh token (stored hashed
   in the DB, sent via httpOnly cookie) is exchanged for a new access token. Use rotation: every refresh issues a
   new refresh token and invalidates the old one; reuse of an old one signals theft and revokes the whole family.
3. *How do you log a user out or revoke a JWT?* Pure JWTs cannot be revoked before expiry. Options: short expiry
   + refresh token revocation, a denylist of token ids (`jti`) in Redis, or per-request DB check like ours.
4. *HS256 vs RS256?* HS256 uses one shared secret (fine for a single service). RS256 signs with a private key and
   verifies with a public key, so other services can verify without being able to issue tokens.
5. *What is the `alg: none` attack?* A forged token with header `alg: none` and no signature is accepted by
   libraries that trust the header. We prevent it with `algorithms: ['HS256']`.
6. *Why bcrypt and not SHA-256?* SHA-256 is designed to be fast, so GPUs try billions per second. bcrypt/scrypt/
   argon2 are deliberately slow and salted. Hashing is one-way; encryption is reversible and is the wrong tool for passwords.
7. *Why 404 for another user's task?* A 403 confirms the id exists; attackers can enumerate. 404 is uniform.

**Common mistakes**

- Trusting the role sent in the request body (or in the JWT without any DB cross-check for sensitive actions).
- Checking only authentication and forgetting ownership (IDOR / broken object level authorization).
- Different messages for "email not found" and "wrong password".
- Storing JWT secret in the repo; using a short guessable secret; never setting an expiry.
- Putting sensitive data in the JWT payload (it is readable by anyone).
- Returning the whole user row including `password_hash` from the repository.
- Using `jwt.decode` (no verification) where `jwt.verify` is required.

**Revision notes:** authn vs authz; bcrypt = salt + cost in one string; JWT = signed not encrypted; pin algorithm;
`authenticate -> authorize -> validate`; 401 no/invalid identity, 403 identity but not allowed, 404 hide existence;
role from token/DB, never from the request body.

---

## 8. Stage 5 - Pagination, filter, sort + transactions (Week 5-6)

### Requirements

1. `GET /api/v1/tasks` supports: `page`, `limit` (max 100), filters `status`, `priority`, `assigneeId`, `dueBefore`,
   `dueAfter`, `q` (title contains), and sorting `sort` (`createdAt|dueDate|priority|title|status`) +
   `order` (`asc|desc`). The response contains `meta: { page, limit, total, totalPages }`.
2. Sorting is deterministic (tie-break by id) so pages never overlap or skip rows. Sort field names come from a
   whitelist, never from raw input.
3. `GET /api/v1/users` (admin, manager): paginated user list, used to pick assignees.
4. Create / update / delete-related writes keep an audit trail: a row in `task_events` is written in the SAME
   transaction as the change. `GET /api/v1/tasks/:id/events` returns the history.
5. `POST /api/v1/tasks/bulk-status` (admin, manager): set the status of many tasks all-or-nothing.
6. `POST /api/v1/tasks/reassign` (admin, manager): move ALL open tasks (`todo`, `in_progress`) from user A to
   user B all-or-nothing (the "colleague is leaving" case).
7. Business rule: `cancelled` is terminal. Violations are 409 `INVALID_TRANSITION`.
8. Assigning to a missing/deactivated user is a clear 422, not a raw FK error.

### Implementation approach

- Offset pagination (`LIMIT ? OFFSET ?`) plus a `COUNT(*)` with the same WHERE clause. It is simple, supports "jump
  to page 7" and is fine for admin-style lists up to a few hundred thousand rows. Deep offsets get slow
  (`OFFSET 1000000` reads and discards a million rows). We cap `page` to protect the DB; the keyset
  alternative is in the Q&A.
- The WHERE/ORDER BY building lives in `task-query.js` as pure functions (easy to unit test, and the only
  place where SQL text is assembled dynamically).
- Transactions use one helper, `withTransaction(fn)`: get a connection, `BEGIN`, run `fn(conn)`, `COMMIT`, on
  error `ROLLBACK`, and ALWAYS release the connection. It retries when MySQL reports a deadlock.
- Concurrency safety: inside the transaction we lock the rows we are about to change with
  `SELECT ... FOR UPDATE`, always in `ORDER BY id` order (consistent lock order prevents most deadlocks). The
  target user row is locked with `FOR SHARE` so they cannot be deactivated mid-operation.
- Authorization stays in the service (policy functions); the repository only does SQL.

### `src/utils/pagination.js`

```js
import { z } from 'zod';

// Spread this into any list-query schema: z.object({ ...pageQueryShape, ... })
export const pageQueryShape = {
  // max page is a guard against absurd offsets (page 10 million would force MySQL to scan and discard rows)
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export function offsetOf({ page, limit }) {
  return (page - 1) * limit;
}

export function pageMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
```

### Edit `src/modules/tasks/tasks.schemas.js`: add import + append schemas

At the TOP of the file add:

```js
import { pageQueryShape } from '../../utils/pagination.js';
```

At the BOTTOM of the file append:

```js
export const SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'title', 'status'];

// Unknown query parameters are ignored (not strict) so harmless cache-busters like ?_=123 do not break clients.
export const listTasksQuery = z.object({
  ...pageQueryShape,
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: paramId.optional(),
  dueBefore: z.iso.date().optional(),
  dueAfter: z.iso.date().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const bulkStatusBody = z.strictObject({
  taskIds: z.array(bodyId).min(1).max(100),
  status: z.enum(TASK_STATUSES),
});

export const reassignBody = z
  .strictObject({
    fromUserId: bodyId,
    toUserId: bodyId,
  })
  .refine((value) => value.fromUserId !== value.toUserId, {
    message: 'fromUserId and toUserId must be different',
    path: ['toUserId'],
  });
```

### `src/modules/tasks/task-query.js`

```js
// Whitelist: API sort name -> SQL column. Anything not in this map can never reach the SQL text.
const SORT_COLUMNS = {
  createdAt: 't.created_at',
  dueDate: 't.due_date',
  priority: 't.priority', // ENUM sorts by its declared order: low < medium < high
  title: 't.title',
  status: 't.status', // ENUM order: todo < in_progress < done < cancelled
};

// LIKE treats % and _ as wildcards and backslash as the escape character. Neutralise them in user input.
export function escapeLike(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * filters: { visibleTo?, status?, priority?, assigneeId?, dueBefore?, dueAfter?, q? }
 * Returns { whereSql, params }. Only placeholders and fixed text are appended; values go in `params`.
 */
export function buildWhere(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.visibleTo !== undefined) {
    clauses.push('(t.assignee_id = ? OR t.created_by = ?)');
    params.push(filters.visibleTo, filters.visibleTo);
  }
  if (filters.status !== undefined) {
    clauses.push('t.status = ?');
    params.push(filters.status);
  }
  if (filters.priority !== undefined) {
    clauses.push('t.priority = ?');
    params.push(filters.priority);
  }
  if (filters.assigneeId !== undefined) {
    clauses.push('t.assignee_id = ?');
    params.push(filters.assigneeId);
  }
  if (filters.dueBefore !== undefined) {
    clauses.push('t.due_date <= ?');
    params.push(filters.dueBefore);
  }
  if (filters.dueAfter !== undefined) {
    clauses.push('t.due_date >= ?');
    params.push(filters.dueAfter);
  }
  if (filters.q !== undefined) {
    // A leading wildcard cannot use an index. For real text search use a FULLTEXT index (see Q&A).
    clauses.push('t.title LIKE ?');
    params.push(`%${escapeLike(filters.q)}%`);
  }

  return { whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

// ORDER BY always ends with the primary key so ordering is total (stable pagination).
export function buildOrderBy(sort = 'createdAt', order = 'desc') {
  const column = Object.hasOwn(SORT_COLUMNS, sort) ? SORT_COLUMNS[sort] : SORT_COLUMNS.createdAt;
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  // MySQL sorts NULL first in ASC. For due dates we want "no due date" at the end in both directions.
  const nullsLast = sort === 'dueDate' ? 't.due_date IS NULL, ' : '';
  return `ORDER BY ${nullsLast}${column} ${direction}, t.id ${direction}`;
}
```

### `src/modules/tasks/task-policy.js` (Stage 5 state: adds status rules)

```js
import { ConflictError } from '../../errors/app-error.js';

export const OPEN_STATUSES = ['todo', 'in_progress'];

// Allowed status changes. `cancelled` is terminal.
const TRANSITIONS = {
  todo: ['in_progress', 'done', 'cancelled'],
  in_progress: ['todo', 'done', 'cancelled'],
  done: ['todo', 'in_progress'],
  cancelled: [],
};

export function isPrivileged(user) {
  return user.role === 'admin' || user.role === 'manager';
}

export function canViewTask(user, task) {
  return isPrivileged(user) || task.assigneeId === user.id || task.createdBy === user.id;
}

// "Changing" a status to itself is a no-op and always allowed.
export function canTransition(from, to) {
  return from === to || TRANSITIONS[from].includes(to);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new ConflictError(`Cannot change status from "${from}" to "${to}"`, 'INVALID_TRANSITION');
  }
}
```

### `src/db/transaction.js`

```js
import { setTimeout as sleep } from 'node:timers/promises';
import { logger } from '../config/logger.js';
import { pool } from './pool.js';

// MySQL may pick one transaction as the "victim" of a deadlock, or time out waiting for a lock.
// Both are safe to retry because the whole transaction was rolled back.
const RETRYABLE_CODES = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);

async function runOnce(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      logger.error({ err: rollbackError }, 'transaction rollback failed');
    }
    throw err;
  } finally {
    connection.release(); // ALWAYS give the connection back, success or failure
  }
}

/**
 * withTransaction(async (conn) => { ...use conn for every query... }, { retries: 2 })
 * Everything `work` does through `conn` commits together or not at all.
 * `work` may run more than once on a deadlock, so keep it free of non-database side effects
 * (do not send emails or enqueue jobs inside it).
 */
export async function withTransaction(work, { retries = 2 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await runOnce(work);
    } catch (err) {
      if (attempt >= retries || !RETRYABLE_CODES.has(err.code)) throw err;
      logger.warn({ code: err.code, attempt: attempt + 1 }, 'retrying transaction');
      await sleep(25 * 2 ** attempt + Math.random() * 25); // small exponential backoff with jitter
    }
  }
}
```

### `src/modules/tasks/task-events.repository.js`

```js
import { pool } from '../../db/pool.js';

function toEvent(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    actorId: row.actor_id,
    type: row.event_type,
    details: row.details, // mysql2 parses JSON columns into objects
    createdAt: row.created_at,
  };
}

const toJson = (details) => (details === undefined || details === null ? null : JSON.stringify(details));

export async function insert({ taskId, actorId, type, details }, executor = pool) {
  await executor.query(
    'INSERT INTO task_events (task_id, actor_id, event_type, details) VALUES (?, ?, ?, ?)',
    [taskId, actorId, type, toJson(details)],
  );
}

// One round trip for N rows: VALUES ? with an array of arrays.
export async function insertMany(events, executor = pool) {
  if (events.length === 0) return;
  const rows = events.map((e) => [e.taskId, e.actorId, e.type, toJson(e.details)]);
  await executor.query('INSERT INTO task_events (task_id, actor_id, event_type, details) VALUES ?', [rows]);
}

export async function listByTask(taskId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT id, task_id, actor_id, event_type, details, created_at
     FROM task_events WHERE task_id = ? ORDER BY id DESC`,
    [taskId],
  );
  return rows.map(toEvent);
}
```

### `src/modules/tasks/tasks.repository.js` (FINAL)

```js
import { pool } from '../../db/pool.js';
import { offsetOf } from '../../utils/pagination.js';
import { buildOrderBy, buildWhere } from './task-query.js';

const SELECT_TASK = `
  SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date,
         t.created_by, t.assignee_id, t.created_at, t.updated_at,
         a.name AS assignee_name
  FROM tasks t
  LEFT JOIN users a ON a.id = t.assignee_id`;

const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  assigneeId: 'assignee_id',
};

export function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdBy: row.created_by,
    assigneeId: row.assignee_id,
    assignee: row.assignee_id ? { id: row.assignee_id, name: row.assignee_name ?? null } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * filters: see task-query.js buildWhere. paging: { page, limit, sort, order }.
 * Returns { items, total }. Two queries on purpose: the page itself and the total for the same filter.
 */
export async function list(filters, { page, limit, sort, order }, executor = pool) {
  const { whereSql, params } = buildWhere(filters);
  const orderBy = buildOrderBy(sort, order);

  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM tasks t ${whereSql}`, params);
  const [rows] = await executor.query(
    `${SELECT_TASK} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offsetOf({ page, limit })],
  );

  return { items: rows.map(toTask), total: Number(countRows[0].total) };
}

export async function findById(id, executor = pool) {
  const [rows] = await executor.query(`${SELECT_TASK} WHERE t.id = ?`, [id]);
  return rows.length > 0 ? toTask(rows[0]) : null;
}

// ---- Locking reads (call these only with a transaction connection) ---------------------------------
// FOR UPDATE takes an exclusive row lock until COMMIT/ROLLBACK: other writers (and other locking readers)
// of these rows wait. We read from `tasks` only (no JOIN) so we do not lock `users` rows by accident.
// Rows returned here have assignee.name = null; re-read with findById if the name is needed.

export async function findByIdForUpdate(id, executor) {
  const [rows] = await executor.query('SELECT * FROM tasks WHERE id = ? FOR UPDATE', [id]);
  return rows.length > 0 ? toTask(rows[0]) : null;
}

// ORDER BY id: every transaction locks rows in the same order, which prevents most deadlocks.
export async function lockByIds(ids, executor) {
  const [rows] = await executor.query('SELECT * FROM tasks WHERE id IN (?) ORDER BY id FOR UPDATE', [ids]);
  return rows.map(toTask);
}

export async function lockByAssignee(userId, statuses, executor) {
  const [rows] = await executor.query(
    'SELECT * FROM tasks WHERE assignee_id = ? AND status IN (?) ORDER BY id FOR UPDATE',
    [userId, statuses],
  );
  return rows.map(toTask);
}

// ---- Writes ----------------------------------------------------------------------------------------

export async function create(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO tasks (title, description, status, priority, due_date, created_by, assignee_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description ?? null,
      data.status ?? 'todo',
      data.priority,
      data.dueDate ?? null,
      data.createdBy ?? null,
      data.assigneeId ?? null,
    ],
  );
  return findById(result.insertId, executor);
}

// Returns the updated task, or null if no task has this id.
export async function update(id, patch, executor = pool) {
  const assignments = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
    if (patch[key] !== undefined) {
      assignments.push(`${column} = ?`);
      params.push(patch[key]);
    }
  }

  if (assignments.length > 0) {
    params.push(id);
    await executor.query(`UPDATE tasks SET ${assignments.join(', ')} WHERE id = ?`, params);
  }
  return findById(id, executor);
}

// One statement for N rows instead of N statements.
export async function updateStatusMany(ids, status, executor) {
  await executor.query('UPDATE tasks SET status = ? WHERE id IN (?)', [status, ids]);
}

export async function reassignMany(ids, assigneeId, executor) {
  await executor.query('UPDATE tasks SET assignee_id = ? WHERE id IN (?)', [assigneeId, ids]);
}

export async function remove(id, executor = pool) {
  const [result] = await executor.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
```

### `src/modules/tasks/tasks.service.js` (FINAL)

```js
import { withTransaction } from '../../db/transaction.js';
import { ConflictError, ForbiddenError, NotFoundError, UnprocessableError } from '../../errors/app-error.js';
import { pageMeta } from '../../utils/pagination.js';
import * as usersRepo from '../users/users.repository.js';
import * as eventsRepo from './task-events.repository.js';
import { assertTransition, canTransition, canViewTask, isPrivileged, OPEN_STATUSES } from './task-policy.js';
import * as tasksRepo from './tasks.repository.js';

// ---- helpers -----------------------------------------------------------------------------------------

// Must run inside a transaction: FOR SHARE keeps the user row from being deactivated until we commit.
async function assertAssignable(userId, connection) {
  const user = await usersRepo.findByIdForShare(userId, connection);
  if (!user) throw new UnprocessableError('Assignee does not exist', 'ASSIGNEE_NOT_FOUND');
  if (!user.isActive) throw new UnprocessableError('Assignee account is deactivated', 'ASSIGNEE_INACTIVE');
}

function resolveAssigneeForCreate(actor, requested) {
  if (isPrivileged(actor)) return requested;
  // Members work on their own tasks only.
  if (requested !== undefined && requested !== actor.id) {
    throw new ForbiddenError('Members can only assign tasks to themselves');
  }
  return actor.id;
}

// { field: { from, to } } for fields whose value actually changes.
function diffTask(existing, patch) {
  const changes = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && value !== existing[key]) {
      changes[key] = { from: existing[key], to: value };
    }
  }
  return changes;
}

// ---- reads -------------------------------------------------------------------------------------------

export async function listTasks(actor, query) {
  const { page, limit, sort, order, ...filters } = query;
  if (!isPrivileged(actor)) filters.visibleTo = actor.id;

  const { items, total } = await tasksRepo.list(filters, { page, limit, sort, order });
  return { items, meta: pageMeta({ page, limit, total }) };
}

export async function getTask(actor, id) {
  const task = await tasksRepo.findById(id);
  // Same 404 for "missing" and "not yours": do not leak which ids exist.
  if (!task || !canViewTask(actor, task)) throw new NotFoundError('Task not found');
  return task;
}

export async function getTaskEvents(actor, id) {
  await getTask(actor, id);
  return eventsRepo.listByTask(id);
}

// ---- single-task writes (task change + audit event commit together) -------------------------------

export async function createTask(actor, input) {
  const assigneeId = resolveAssigneeForCreate(actor, input.assigneeId);

  return withTransaction(async (connection) => {
    if (assigneeId !== undefined && assigneeId !== null) await assertAssignable(assigneeId, connection);

    const task = await tasksRepo.create({ ...input, assigneeId, createdBy: actor.id }, connection);
    await eventsRepo.insert(
      { taskId: task.id, actorId: actor.id, type: 'created', details: { title: task.title, assigneeId: task.assigneeId } },
      connection,
    );
    return task;
  });
}

export async function updateTask(actor, id, patch) {
  if (patch.assigneeId !== undefined && !isPrivileged(actor)) {
    throw new ForbiddenError('Only managers and admins can change the assignee');
  }

  return withTransaction(async (connection) => {
    // Lock the row: two concurrent PATCHes on the same task run one after the other, not interleaved.
    const existing = await tasksRepo.findByIdForUpdate(id, connection);
    if (!existing || !canViewTask(actor, existing)) throw new NotFoundError('Task not found');

    if (patch.assigneeId != null && patch.assigneeId !== existing.assigneeId) {
      await assertAssignable(patch.assigneeId, connection);
    }
    if (patch.status !== undefined) assertTransition(existing.status, patch.status);

    const changes = diffTask(existing, patch);
    if (Object.keys(changes).length === 0) return tasksRepo.findById(id, connection); // nothing to do

    const changedValues = Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.to]));
    const updated = await tasksRepo.update(id, changedValues, connection);
    await eventsRepo.insert({ taskId: id, actorId: actor.id, type: 'updated', details: { changes } }, connection);
    return updated;
  });
}

export async function deleteTask(actor, id) {
  if (!isPrivileged(actor)) throw new ForbiddenError();
  const removed = await tasksRepo.remove(id); // events are removed by ON DELETE CASCADE
  if (!removed) throw new NotFoundError('Task not found');
}

// ---- multi-row transactions ------------------------------------------------------------------------

export async function bulkUpdateStatus(actor, { taskIds, status }) {
  if (!isPrivileged(actor)) throw new ForbiddenError();
  const ids = [...new Set(taskIds)]; // duplicates in the request must not break the count check

  return withTransaction(async (connection) => {
    const rows = await tasksRepo.lockByIds(ids, connection);

    if (rows.length !== ids.length) {
      const found = new Set(rows.map((row) => row.id));
      const missing = ids.filter((id) => !found.has(id));
      throw new NotFoundError(`Tasks not found: ${missing.join(', ')}`, 'TASKS_NOT_FOUND');
    }

    const blocked = rows.filter((row) => !canTransition(row.status, status)).map((row) => row.id);
    if (blocked.length > 0) {
      // One bad row aborts the whole batch: this is the point of the transaction.
      throw new ConflictError(
        `Status "${status}" is not allowed for tasks: ${blocked.join(', ')}`,
        'INVALID_TRANSITION',
        { taskIds: blocked },
      );
    }

    const changing = rows.filter((row) => row.status !== status);
    if (changing.length > 0) {
      await tasksRepo.updateStatusMany(changing.map((row) => row.id), status, connection);
      await eventsRepo.insertMany(
        changing.map((row) => ({
          taskId: row.id,
          actorId: actor.id,
          type: 'status_changed',
          details: { from: row.status, to: status },
        })),
        connection,
      );
    }
    return { requested: ids.length, updated: changing.length };
  });
}

export async function reassignOpenTasks(actor, { fromUserId, toUserId }) {
  if (!isPrivileged(actor)) throw new ForbiddenError();

  return withTransaction(async (connection) => {
    const source = await usersRepo.findById(fromUserId, connection);
    if (!source) throw new NotFoundError('Source user not found', 'USER_NOT_FOUND');
    await assertAssignable(toUserId, connection);

    const tasks = await tasksRepo.lockByAssignee(fromUserId, OPEN_STATUSES, connection);
    if (tasks.length > 0) {
      await tasksRepo.reassignMany(tasks.map((task) => task.id), toUserId, connection);
      await eventsRepo.insertMany(
        tasks.map((task) => ({
          taskId: task.id,
          actorId: actor.id,
          type: 'reassigned',
          details: { from: fromUserId, to: toUserId },
        })),
        connection,
      );
    }
    return { reassigned: tasks.length, fromUserId, toUserId };
  });
}
```

### `src/modules/tasks/tasks.controller.js` (FINAL)

```js
import * as tasksService from './tasks.service.js';

export async function list(req, res) {
  const { items, meta } = await tasksService.listTasks(req.user, req.validated.query);
  res.json({ data: items, meta });
}

export async function get(req, res) {
  const task = await tasksService.getTask(req.user, req.validated.params.id);
  res.json({ data: task });
}

export async function create(req, res) {
  const task = await tasksService.createTask(req.user, req.validated.body);
  res.status(201).location(`/api/v1/tasks/${task.id}`).json({ data: task });
}

export async function update(req, res) {
  const task = await tasksService.updateTask(req.user, req.validated.params.id, req.validated.body);
  res.json({ data: task });
}

export async function remove(req, res) {
  await tasksService.deleteTask(req.user, req.validated.params.id);
  res.status(204).end();
}

export async function events(req, res) {
  const items = await tasksService.getTaskEvents(req.user, req.validated.params.id);
  res.json({ data: items });
}

export async function bulkStatus(req, res) {
  const result = await tasksService.bulkUpdateStatus(req.user, req.validated.body);
  res.json({ data: result });
}

export async function reassign(req, res) {
  const result = await tasksService.reassignOpenTasks(req.user, req.validated.body);
  res.json({ data: result });
}
```

### `src/modules/tasks/tasks.routes.js` (FINAL)

```js
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './tasks.controller.js';
import {
  bulkStatusBody,
  createTaskBody,
  idParams,
  listTasksQuery,
  reassignBody,
  updateTaskBody,
} from './tasks.schemas.js';

export const tasksRouter = Router();

tasksRouter.use(authenticate);

tasksRouter.get('/', validate({ query: listTasksQuery }), controller.list);
tasksRouter.post('/', validate({ body: createTaskBody }), controller.create);

// Fixed paths before "/:id" routes. (Different verbs here, but this order stays safe if someone adds a GET later.)
tasksRouter.post('/bulk-status', authorize('admin', 'manager'), validate({ body: bulkStatusBody }), controller.bulkStatus);
tasksRouter.post('/reassign', authorize('admin', 'manager'), validate({ body: reassignBody }), controller.reassign);

tasksRouter.get('/:id', validate({ params: idParams }), controller.get);
tasksRouter.get('/:id/events', validate({ params: idParams }), controller.events);
tasksRouter.patch('/:id', validate({ params: idParams, body: updateTaskBody }), controller.update);
tasksRouter.delete('/:id', authorize('admin', 'manager'), validate({ params: idParams }), controller.remove);
```

### Users module additions (list endpoint)

Add to `src/modules/users/users.schemas.js` (import at the top, schema at the bottom):

```js
import { pageQueryShape } from '../../utils/pagination.js';

export const listUsersQuery = z.object({ ...pageQueryShape });
```

Append to `src/modules/users/users.repository.js`:

```js
export async function list({ page, limit }, executor = pool) {
  const [countRows] = await executor.query('SELECT COUNT(*) AS total FROM users');
  const [rows] = await executor.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY id ASC LIMIT ? OFFSET ?`,
    [limit, (page - 1) * limit],
  );
  return { items: rows.map(toUser), total: Number(countRows[0].total) };
}
```

Replace the imports and append to `src/modules/users/users.service.js`:

```js
import { ForbiddenError, NotFoundError } from '../../errors/app-error.js';
import { pageMeta } from '../../utils/pagination.js';
import * as usersRepo from './users.repository.js';

// ... updateUser from Stage 4 stays exactly as it is ...

export async function listUsers(actor, { page, limit }) {
  if (actor.role !== 'admin' && actor.role !== 'manager') throw new ForbiddenError();
  const { items, total } = await usersRepo.list({ page, limit });
  return { items, meta: pageMeta({ page, limit, total }) };
}
```

Append to `src/modules/users/users.controller.js`:

```js
export async function list(req, res) {
  const { items, meta } = await usersService.listUsers(req.user, req.validated.query);
  res.json({ data: items, meta });
}
```

`src/modules/users/users.routes.js` (FINAL):

```js
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './users.controller.js';
import { idParams, listUsersQuery, updateUserBody } from './users.schemas.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/', authorize('admin', 'manager'), validate({ query: listUsersQuery }), controller.list);
usersRouter.patch('/:id', authorize('admin'), validate({ params: idParams, body: updateUserBody }), controller.update);
```

### Acceptance criteria

```bash
# as manager (TOKEN from Stage 4): create 25 tasks
for i in $(seq 1 25); do
  curl -s -o /dev/null -X POST localhost:3000/api/v1/tasks -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d "{\"title\":\"Task $i\",\"priority\":\"medium\"}"
done

curl -s "localhost:3000/api/v1/tasks?page=2&limit=10" -H "Authorization: Bearer $TOKEN"
curl -s "localhost:3000/api/v1/tasks?status=todo&sort=title&order=asc&q=Task%201" -H "Authorization: Bearer $TOKEN"
curl -i "localhost:3000/api/v1/tasks?limit=1000" -H "Authorization: Bearer $TOKEN"        # 400
curl -i "localhost:3000/api/v1/tasks?sort=password_hash" -H "Authorization: Bearer $TOKEN" # 400 (whitelist)
curl -i -X POST localhost:3000/api/v1/tasks/bulk-status -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"taskIds":[1,2,3],"status":"done"}'
curl -s localhost:3000/api/v1/tasks/1/events -H "Authorization: Bearer $TOKEN"
```

- [ ] Page 2 with `limit=10` returns 10 items and `meta` = `{ page: 2, limit: 10, total: 25, totalPages: 3 }`.
- [ ] Page 3 returns 5 items; page 4 returns `[]` (not an error).
- [ ] `sort=title&order=asc` is really ascending; two requests for consecutive pages never repeat an item.
- [ ] `limit=1000` and `sort=password_hash` return 400. A `q` of `%` matches only titles containing a literal percent sign.
- [ ] Bulk status with ids `[1,2,999]` -> 404 `TASKS_NOT_FOUND` and tasks 1 and 2 are UNCHANGED.
- [ ] Mark task 5 `cancelled`, then bulk set `[4,5,6]` to `done` -> 409 `INVALID_TRANSITION`, and tasks 4 and 6 are UNCHANGED.
- [ ] Successful bulk call returns `{ requested, updated }` and writes one `status_changed` event per changed task.
- [ ] Reassign user A -> B moves only `todo`/`in_progress` tasks; `done` tasks stay with A; target inactive -> 422 `ASSIGNEE_INACTIVE`.
- [ ] Prove the lock: open two MySQL sessions. Session 1: `START TRANSACTION; SELECT * FROM tasks WHERE id = 1 FOR UPDATE;`
  Session 2: `UPDATE tasks SET title = 'x' WHERE id = 1;` blocks until session 1 runs `COMMIT;` (or fails with
  lock wait timeout after 50 s by default).
- [ ] `EXPLAIN SELECT ... WHERE t.status = 'todo' ORDER BY t.created_at DESC, t.id DESC LIMIT 10 OFFSET 0`: read the `key` and `Extra`
  columns and write one sentence about whether the sort used an index or a filesort.

### Interview concepts demonstrated

- Pagination (offset vs keyset), deterministic ordering, total count cost. `[ESSENTIAL]`
- Filtering and sorting safely (whitelist for identifiers, placeholders for values). `[ESSENTIAL]`
- Transactions and ACID; commit/rollback/release pattern. `[ESSENTIAL]`
- Row locking (`FOR UPDATE`, `FOR SHARE`), lost-update prevention. `[ESSENTIAL]`
- Deadlocks: consistent lock order + retry. `[ESSENTIAL]`
- Audit trail written atomically with the change. `[ESSENTIAL]`
- Bulk SQL (`IN (?)`, `VALUES ?`) instead of N queries. `[ESSENTIAL]`
- Business-rule state machine (status transitions). `[ESSENTIAL]`

### Stage 5 interview material

**Concept:** Transaction = "ya to saare steps hon, ya koi nahi." Bulk status me 10 tasks update karte waqt 7th pe
error aaye to pehle 6 bhi wapas (rollback). Pagination = poori table ek saath nahi, page-by-page.

**Why it matters:** Bina transaction ke half-updated data milta hai (task reassign ho gaya lekin audit event
nahi bana). Bina pagination ke ek `GET /tasks` 5 lakh rows load karke server ki memory aur DB dono maar deta hai.

**Internal working:** InnoDB MVCC use karta hai: normal `SELECT` snapshot padhta hai, kisi ko block nahi karta.
`SELECT ... FOR UPDATE` row par exclusive lock leta hai, jab tak commit/rollback na ho. Default isolation level
REPEATABLE READ hai: transaction ke andar same query same snapshot dekhti hai. Deadlock tab hota hai jab T1 row A
lock karke B maangta hai aur T2 row B lock karke A maangta hai; MySQL ek ko victim bana ke error 1213 deta hai.
Fix: hamesha same order (ORDER BY id) me lock karo, aur victim ko retry karo.

**Frontend connection:** Pagination wahi hai jo tum table component me `page`/`pageSize` ke saath karte ho
(React Query `keepPreviousData`, infinite scroll = keyset/cursor). Transaction ko Redux me "optimistic update + rollback
on failure" jaisa socho, bas yahan guarantee database deta hai.

**Real-world scenario:** Payment/banking: A ke account se 500 debit aur B me 500 credit ek transaction me.
Marketplace: order create + stock decrement + payment record. Yahan: tasks reassign + audit events ek saath.

**Interview answer:** "For multi-row operations I use a transaction helper that borrows one connection, begins, runs the
work, commits, rolls back on any error and always releases the connection. Inside, I lock the rows I intend to
change with SELECT FOR UPDATE in primary-key order so concurrent requests serialize instead of interleaving and
deadlocks are rare; if MySQL still picks my transaction as a deadlock victim, the helper retries with backoff.
The audit event is inserted in the same transaction, so we never have a change without a record or a record
without a change."

**Follow-up questions**

1. *Offset vs keyset (cursor) pagination?* Offset: easy, random page access, but cost grows with the offset and
   rows can shift between requests (inserts cause duplicates/skips). Keyset: `WHERE (created_at < ? OR (created_at = ? AND id < ?))
   ORDER BY created_at DESC, id DESC LIMIT 20` (params: lastCreatedAt, lastCreatedAt, lastId; do NOT use the row-constructor form `(created_at, id) < (?, ?)`, MySQL 8 does not turn it into an index seek); constant cost with an index and stable, but only next/previous,
   and the client must send the last row's sort values (a cursor). Use keyset for feeds and very large tables.
2. *Why a separate COUNT query?* Page data and total are different questions. COUNT(*) on a big filtered table
   can be slow; options: cap it, cache it, return `hasNext` (fetch `limit + 1` rows) instead of a total.
3. *What are the ACID properties here?* Atomicity: all-or-nothing batch. Consistency: constraints (FK, ENUM,
   our transition rule) hold. Isolation: row locks stop concurrent edits interleaving. Durability: after COMMIT the change survives a crash (redo log).
4. *What problem does `FOR UPDATE` solve?* The lost update: two requests read status `todo`, both decide to change,
   the last writer silently overwrites the first. Locking (or an `updated_at`/version column checked in the
   `WHERE` clause = optimistic locking) prevents it.
5. *Pessimistic vs optimistic locking?* Pessimistic: lock rows up front (what we did; good when conflicts are likely and transactions are short).
   Optimistic: no lock, `UPDATE ... WHERE id = ? AND version = ?` and retry if 0 rows matched (good when conflicts are rare).
6. *Is it OK to call an external API (email, payment gateway) inside a transaction?* No. It holds locks and a
   pooled connection while waiting on the network, and retries could repeat the side effect. Commit first, then
   do the side effect (Extension B uses a queue; for guaranteed delivery use the transactional outbox pattern).
7. *Why not `Promise.all` inside the transaction?* A single connection executes one statement at a time; the driver queues them.
   No speedup and harder-to-read ordering, so we `await` sequentially.
8. *What happens if the process crashes mid-transaction?* The connection drops, MySQL rolls the transaction back automatically.

**Common mistakes**

- Starting a transaction on `pool` instead of a checked-out connection (each statement lands on a different connection).
- Not releasing the connection in `finally` (pool slowly leaks; the app hangs under load).
- Reading first and writing later without locking (lost updates).
- Locking rows in different orders in different code paths (deadlocks).
- Using the sort field from `req.query` directly in `ORDER BY`.
- Sorting by a non-unique column only (rows jump between pages). Always add the id tie-breaker.
- `LIMIT` without `ORDER BY`: the DB may return a different subset each time.
- Long transactions that include network calls.

**Revision notes:** offset pagination = LIMIT/OFFSET + COUNT, cap page and limit; whitelist sort; tie-break by id;
`withTransaction` = begin/commit/rollback/release + deadlock retry; lock in id order; audit in same transaction;
side effects after commit.

---

## 9. Stage 6 - Tests + logging + security middleware (Week 6)

### Requirements

1. Every request gets a correlation id (`X-Request-Id`): reused if the caller sends a sane one, otherwise
   generated. It appears in every log line of that request and in the error JSON (`requestId`).
2. Structured JSON request logs (pino-http): status-based levels, no `Authorization` header, no passwords,
   health probes not logged.
3. Security middleware: `helmet` headers, CORS allowlist from env, global rate limit and a stricter limit on
   `/auth` (counts failures only), body-size limit (already in place).
4. Automated tests with Vitest + Supertest:
   - unit tests for pure logic (query builder, policy, pagination, error mapping, auth middleware with a mocked repo, transaction retry);
   - integration tests against a REAL MySQL test database for auth, RBAC, validation, pagination/filter/sort,
     transactions, rollback and security behaviour;
   - negative tests (bad input, wrong role, tampered token) are first-class, not an afterthought.
5. Tests never touch the development database: the test DB name must end with `_test` or the run aborts.

### Implementation approach

- `httpLogger`, `securityMiddleware`, `createRateLimiter` live in their own small files; `createApp()` wires them in
  a deliberate order (see comments in `app.js`).
- `createApp({ globalLimit, authLimit })` accepts overrides so one test can build an app with a tiny limit
  without changing the others (each app instance has its own in-memory rate-limit store).
- Tests use a real MySQL because most of our risk is in SQL, locking and constraints, which mocks cannot
  verify. We mock only where isolation is the goal (unit tests), and we keep the number of mocks small.
- Test environment values are set in `vitest.config.js`: low bcrypt cost (4) so hashing is fast, huge rate limits
  so normal tests are never throttled, `LOG_LEVEL=silent`.
- Between tests we `DELETE` rows (fast, keeps the schema). Test files run one after another
  (`fileParallelism: false`) because they share one database.

### Commands

```bash
# Pin majors: pino-http 11 needs pino 10, and vitest 4+ needs Node 22.12+ (npm also crashes on Node 20 with it).
npm install helmet cors express-rate-limit@7 pino-http@10
npm install -D vitest@3 supertest
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

### `src/middleware/http-logger.js`

```js
import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';

// Accept an incoming id only if it looks harmless (no spaces/newlines: log injection) and has a sane length.
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

export const httpLogger = pinoHttp({
  logger,

  // Correlation id: the same id is used in logs, in the response header and in the error body (req.id).
  genReqId(req, res) {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },

  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Probes hit these every few seconds; logging them would bury real traffic.
  autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/health/ready' },

  // Who made the call (req.user exists after authenticate). Never log tokens or emails here.
  customProps(req) {
    return req.user ? { userId: req.user.id } : {};
  },
});
```

A typical production log line (one JSON object per line, shown wrapped for reading):

```json
{"level":30,"time":1760860000000,"req":{"id":"5c0f6c6e-2d6c-4f1e-9a73-0a5d8c3bde11","method":"PATCH","url":"/api/v1/tasks/17"},"userId":4,"res":{"statusCode":200},"responseTime":18,"msg":"request completed"}
```

### `src/middleware/security.js`

```js
import cors from 'cors';
import helmet from 'helmet';
import { env } from '../config/env.js';

const allowedOrigins = new Set(
  env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

// CORS is a BROWSER rule: it tells browsers which other origins may read our responses.
// It is not authentication and does not stop curl/Postman/servers.
export const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header = not a cross-origin browser request (curl, server-to-server, same origin).
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false); // send no CORS headers; the browser blocks the response
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'Location', 'Retry-After'],
  maxAge: 600, // browsers may cache the preflight answer for 10 minutes
});

// helmet sets safe default headers: Content-Security-Policy, X-Content-Type-Options: nosniff,
// Strict-Transport-Security, X-Frame-Options/frame-ancestors, Referrer-Policy and removes X-Powered-By.
export const securityMiddleware = [helmet(), corsMiddleware];
```

### `src/middleware/rate-limit.js`

```js
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

/**
 * createRateLimiter({ limit, windowMs, skipSuccessfulRequests })
 * Fixed-window counter per client IP (in-memory store). With several app instances each has its own counter;
 * for a shared limit use a Redis store (see Q&A). Remember `trust proxy` (TRUST_PROXY) so the IP is the
 * real client and not your load balancer.
 */
export function createRateLimiter({ limit, windowMs = env.RATE_LIMIT_WINDOW_MS, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests, // true = only failed requests (status >= 400) count: brute-force protection for login
    standardHeaders: 'draft-7', // RateLimit / RateLimit-Policy headers
    legacyHeaders: false, // no X-RateLimit-* headers
    // Use OUR error shape (and request id) instead of the library's plain-text response.
    handler: (_req, _res, next) =>
      next(new AppError('Too many requests, please try again later', { statusCode: 429, code: 'RATE_LIMITED' })),
  });
}
```

### `src/app.js` (Stage 6 state)

```js
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { httpLogger } from './middleware/http-logger.js';
import { notFound } from './middleware/not-found.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { securityMiddleware } from './middleware/security.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export function createApp({ globalLimit = env.RATE_LIMIT_MAX, authLimit = env.AUTH_RATE_LIMIT_MAX } = {}) {
  const app = express();

  app.disable('x-powered-by');
  // Behind nginx / a load balancer, req.ip must be the real client (used by the rate limiter and the logs).
  app.set('trust proxy', env.TRUST_PROXY);

  // ORDER MATTERS
  app.use(httpLogger); // 1. first, so every request (even rejected ones) gets an id and a log line
  app.use(securityMiddleware); // 2. headers + CORS (answers preflight OPTIONS early)
  app.use(healthRouter); // 3. probes: not rate limited, not logged
  app.use(createRateLimiter({ limit: globalLimit })); // 4. cheap rejection BEFORE parsing bodies
  app.use(express.json({ limit: '100kb' })); // 5. body parsing with a size cap

  app.use('/api/v1/auth', createRateLimiter({ limit: authLimit, skipSuccessfulRequests: true }), authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/tasks', tasksRouter);

  app.use(notFound);
  app.use(errorHandler); // absolutely last

  return app;
}
```

### `vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

// Load .env if present (local dev). In CI there is none and the TEST_* / default values below are used.
try {
  process.loadEnvFile();
} catch {
  // no .env file: fine
}

// Tests must NEVER pick up Redis from a developer's .env (Extension A/B are tested separately).
delete process.env.REDIS_URL;

const testEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DB_HOST: process.env.TEST_DB_HOST ?? process.env.DB_HOST ?? '127.0.0.1',
  DB_PORT: process.env.TEST_DB_PORT ?? process.env.DB_PORT ?? '3306',
  DB_USER: process.env.TEST_DB_USER ?? process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
  DB_NAME: process.env.TEST_DB_NAME ?? 'task_api_test',
  DB_POOL_SIZE: '5',
  JWT_SECRET: 'test-only-secret-test-only-secret-0123456789',
  JWT_EXPIRES_IN: '1h',
  BCRYPT_ROUNDS: '4', // minimum cost: tests hash passwords constantly
  CORS_ORIGINS: 'http://localhost:5173',
  DOCS_ENABLED: 'false',
  TRUST_PROXY: '0',
  RATE_LIMIT_MAX: '100000',
  AUTH_RATE_LIMIT_MAX: '100000',
};

// globalSetup runs in this (main) process, workers inherit it: set it for both.
Object.assign(process.env, testEnv);

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/global-setup.js'],
    env: testEnv,
    fileParallelism: false, // all files share one database
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
```

### `tests/global-setup.js`

```js
import mysql from 'mysql2/promise';
import { runMigrations } from '../scripts/migrate.js';

// Runs once before all test files: make sure the test database exists and is migrated.
export default async function setup() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  // Safety valve: tests DELETE all rows. Refuse anything that is not clearly a test database.
  if (!/^[A-Za-z0-9_]+_test$/.test(DB_NAME ?? '')) {
    throw new Error(`Refusing to run tests: DB_NAME "${DB_NAME}" must end with "_test" (set TEST_DB_NAME).`);
  }

  const base = { host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD };

  // DB_NAME was validated against a strict pattern above, so interpolating it as an identifier is safe here.
  const admin = await mysql.createConnection(base);
  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
  } finally {
    await admin.end();
  }

  await runMigrations({ ...base, database: DB_NAME });
}
```

### `tests/helpers.js`

```js
import request from 'supertest';
import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';
import { hashPassword } from '../src/modules/auth/password.js';

export const PASSWORD = 'Passw0rd!Passw0rd';

function assertTestDatabase() {
  if (!env.DB_NAME.endsWith('_test')) {
    throw new Error(`Refusing to touch database "${env.DB_NAME}" from tests`);
  }
}

export async function resetDb() {
  assertTestDatabase();
  await pool.query('DELETE FROM task_events');
  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM users');
}

export async function closeDb() {
  await pool.end();
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export async function createUser({ email, name = 'Test User', role = 'member', isActive = true }) {
  assertTestDatabase();
  const passwordHash = await hashPassword(PASSWORD);
  const [result] = await pool.query(
    'INSERT INTO users (email, name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
    [email, name, passwordHash, role, isActive ? 1 : 0],
  );
  return { id: result.insertId, email, name, role };
}

export async function loginAs(app, email) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data.accessToken;
}

// Four users with tokens: admin, manager, member, other (a second member).
export async function createActors(app) {
  const definitions = [
    ['admin', 'admin'],
    ['manager', 'manager'],
    ['member', 'member'],
    ['other', 'member'],
  ];
  const actors = {};
  for (const [key, role] of definitions) {
    const user = await createUser({ email: `${key}@test.dev`, name: key, role });
    actors[key] = { ...user, token: await loginAs(app, user.email) };
  }
  return actors;
}

// Insert a task row directly (fast set-up that bypasses the API rules).
export async function insertTask({
  title = 'Seed task',
  status = 'todo',
  priority = 'medium',
  dueDate = null,
  createdBy = null,
  assigneeId = null,
} = {}) {
  const [result] = await pool.query(
    'INSERT INTO tasks (title, status, priority, due_date, created_by, assignee_id) VALUES (?, ?, ?, ?, ?, ?)',
    [title, status, priority, dueDate, createdBy, assigneeId],
  );
  return result.insertId;
}

export async function getTaskRow(id) {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return rows[0] ?? null;
}

export async function countEvents(taskId, type) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM task_events WHERE task_id = ? AND event_type = ?',
    [taskId, type],
  );
  return Number(rows[0].total);
}

export { pool };
```

### Unit tests

#### `tests/unit/task-query.test.js`

```js
import { describe, expect, it } from 'vitest';
import { buildOrderBy, buildWhere, escapeLike } from '../../src/modules/tasks/task-query.js';

describe('buildWhere', () => {
  it('returns no WHERE clause when there are no filters', () => {
    expect(buildWhere({})).toEqual({ whereSql: '', params: [] });
    expect(buildWhere()).toEqual({ whereSql: '', params: [] });
  });

  it('joins filters with AND and passes values as parameters, not SQL text', () => {
    const { whereSql, params } = buildWhere({ visibleTo: 7, status: 'todo', priority: 'high' });

    expect(whereSql).toBe('WHERE (t.assignee_id = ? OR t.created_by = ?) AND t.status = ? AND t.priority = ?');
    expect(params).toEqual([7, 7, 'todo', 'high']);
    expect(whereSql).not.toContain('todo');
  });

  it('builds date range filters', () => {
    const { whereSql, params } = buildWhere({ dueAfter: '2026-01-01', dueBefore: '2026-01-31' });

    expect(whereSql).toBe('WHERE t.due_date <= ? AND t.due_date >= ?');
    expect(params).toEqual(['2026-01-31', '2026-01-01']);
  });

  it('treats a hostile search text as plain data', () => {
    const hostile = "x'; DROP TABLE tasks; --";
    const { whereSql, params } = buildWhere({ q: hostile });

    expect(whereSql).toBe('WHERE t.title LIKE ?');
    expect(params).toEqual([`%${hostile}%`]);
  });
});

describe('escapeLike', () => {
  it('escapes percent, underscore and backslash', () => {
    expect(escapeLike('50%_off')).toBe('50\\%\\_off');
    expect(escapeLike('a\\b')).toBe('a\\\\b');
  });

  it('leaves normal text alone', () => {
    expect(escapeLike('Quarterly report')).toBe('Quarterly report');
  });
});

describe('buildOrderBy', () => {
  it('defaults to newest first with an id tie-breaker', () => {
    expect(buildOrderBy()).toBe('ORDER BY t.created_at DESC, t.id DESC');
  });

  it('honours sort and order', () => {
    expect(buildOrderBy('title', 'asc')).toBe('ORDER BY t.title ASC, t.id ASC');
  });

  it('puts tasks without a due date last', () => {
    expect(buildOrderBy('dueDate', 'asc')).toBe('ORDER BY t.due_date IS NULL, t.due_date ASC, t.id ASC');
  });

  it('never lets an unknown sort field reach the SQL text', () => {
    for (const evil of ['password_hash', 'constructor', '__proto__', 'title; DROP TABLE tasks']) {
      expect(buildOrderBy(evil, 'asc')).toBe('ORDER BY t.created_at ASC, t.id ASC');
    }
  });

  it('falls back to DESC for an unknown direction', () => {
    expect(buildOrderBy('title', 'sideways')).toBe('ORDER BY t.title DESC, t.id DESC');
  });
});
```

#### `tests/unit/pagination.test.js`

```js
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { offsetOf, pageMeta, pageQueryShape } from '../../src/utils/pagination.js';

const schema = z.object({ ...pageQueryShape });

describe('pagination helpers', () => {
  it('computes the offset', () => {
    expect(offsetOf({ page: 1, limit: 20 })).toBe(0);
    expect(offsetOf({ page: 3, limit: 10 })).toBe(20);
  });

  it('computes page metadata', () => {
    expect(pageMeta({ page: 2, limit: 10, total: 25 })).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
    expect(pageMeta({ page: 1, limit: 10, total: 0 }).totalPages).toBe(0);
  });
});

describe('page query schema', () => {
  it('applies defaults and coerces strings from the query string', () => {
    expect(schema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(schema.parse({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
  });

  it('rejects out-of-range and non-numeric values', () => {
    expect(schema.safeParse({ limit: '101' }).success).toBe(false);
    expect(schema.safeParse({ limit: '0' }).success).toBe(false);
    expect(schema.safeParse({ page: '0' }).success).toBe(false);
    expect(schema.safeParse({ page: 'abc' }).success).toBe(false);
    expect(schema.safeParse({ page: '1.5' }).success).toBe(false);
  });
});
```

#### `tests/unit/task-policy.test.js`

```js
import { describe, expect, it } from 'vitest';
import { ConflictError } from '../../src/errors/app-error.js';
import { assertTransition, canTransition, canViewTask, isPrivileged } from '../../src/modules/tasks/task-policy.js';

const member = { id: 1, role: 'member' };
const manager = { id: 2, role: 'manager' };
const admin = { id: 3, role: 'admin' };

describe('isPrivileged', () => {
  it('is true only for manager and admin', () => {
    expect(isPrivileged(admin)).toBe(true);
    expect(isPrivileged(manager)).toBe(true);
    expect(isPrivileged(member)).toBe(false);
  });
});

describe('canViewTask', () => {
  it('lets a member see tasks assigned to or created by them only', () => {
    expect(canViewTask(member, { assigneeId: 1, createdBy: 9 })).toBe(true);
    expect(canViewTask(member, { assigneeId: 9, createdBy: 1 })).toBe(true);
    expect(canViewTask(member, { assigneeId: 9, createdBy: 8 })).toBe(false);
    expect(canViewTask(member, { assigneeId: null, createdBy: null })).toBe(false);
  });

  it('lets managers and admins see everything', () => {
    const task = { assigneeId: 9, createdBy: 8 };
    expect(canViewTask(manager, task)).toBe(true);
    expect(canViewTask(admin, task)).toBe(true);
  });
});

describe('status transitions', () => {
  it('allows normal workflow moves and re-opening done tasks', () => {
    expect(canTransition('todo', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'done')).toBe(true);
    expect(canTransition('done', 'todo')).toBe(true);
  });

  it('treats "same status" as a no-op that is always allowed', () => {
    expect(canTransition('cancelled', 'cancelled')).toBe(true);
  });

  it('never leaves cancelled', () => {
    for (const to of ['todo', 'in_progress', 'done']) {
      expect(canTransition('cancelled', to)).toBe(false);
    }
  });

  it('assertTransition throws a 409 ConflictError with a machine-readable code', () => {
    expect(() => assertTransition('cancelled', 'todo')).toThrow(ConflictError);
    try {
      assertTransition('cancelled', 'todo');
    } catch (err) {
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('INVALID_TRANSITION');
    }
  });
});
```

#### `tests/unit/error-handler.test.js`

```js
import { describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../src/errors/app-error.js';
import { errorHandler, toHttpError } from '../../src/middleware/error-handler.js';

function fakeRes() {
  const res = { headersSent: false };
  res.status = vi.fn(() => res);
  res.set = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe('toHttpError', () => {
  it('maps AppError subclasses to their status and code', () => {
    expect(toHttpError(new NotFoundError('nope'))).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'nope' });
    expect(toHttpError(new ConflictError('dup', 'EMAIL_TAKEN'))).toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  it('keeps validation details', () => {
    const details = [{ in: 'body', path: 'title', message: 'required' }];
    expect(toHttpError(new ValidationError('bad', details))).toMatchObject({ status: 400, details });
  });

  it('maps body-parser errors', () => {
    const parseError = Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed' });
    const tooLarge = Object.assign(new Error('too large'), { type: 'entity.too.large' });

    expect(toHttpError(parseError)).toMatchObject({ status: 400, code: 'INVALID_JSON' });
    expect(toHttpError(tooLarge)).toMatchObject({ status: 413, code: 'PAYLOAD_TOO_LARGE' });
  });

  it('maps client-caused MySQL errors to 4xx', () => {
    const dup = Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });
    const fk = Object.assign(new Error('FK fails'), { code: 'ER_NO_REFERENCED_ROW_2' });

    expect(toHttpError(dup)).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(toHttpError(fk)).toMatchObject({ status: 400, code: 'INVALID_REFERENCE' });
  });

  it('turns unknown errors into a generic 500 without leaking the message', () => {
    const result = toHttpError(new Error("SELECT * FROM secret_table failed: password='hunter2'"));

    expect(result).toEqual({ status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' });
  });
});

describe('errorHandler', () => {
  it('writes the error envelope with the request id', () => {
    const res = fakeRes();
    const req = { id: 'req-1' };

    errorHandler(new NotFoundError('Task not found'), req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Task not found', requestId: 'req-1' },
    });
  });

  it('logs unexpected errors with the request logger, but not expected ones', () => {
    const log = { error: vi.fn() };

    errorHandler(new Error('boom'), { id: 'r1', log }, fakeRes(), vi.fn());
    errorHandler(new NotFoundError(), { id: 'r2', log }, fakeRes(), vi.fn());

    expect(log.error).toHaveBeenCalledTimes(1);
  });

  it('adds WWW-Authenticate on 401', () => {
    const res = fakeRes();

    errorHandler(new UnauthorizedError(), { id: 'r1' }, res, vi.fn());

    expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
  });

  it('delegates to Express when the response has already started', () => {
    const res = Object.assign(fakeRes(), { headersSent: true });
    const next = vi.fn();
    const err = new Error('late');

    errorHandler(err, { id: 'r1' }, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });
});
```

#### `tests/unit/auth-middleware.test.js` (mocking the repository)

```js
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The repository is replaced by a stub: this test is about the middleware logic, not about SQL.
// vi.mock is hoisted above the imports below, so auth.js receives the stub.
vi.mock('../../src/modules/users/users.repository.js', () => ({ findById: vi.fn() }));

import { authenticate, authorize } from '../../src/middleware/auth.js';
import { signAccessToken } from '../../src/modules/auth/tokens.js';
import * as usersRepo from '../../src/modules/users/users.repository.js';

const requestWith = (authorization) => ({
  get: (name) => (name.toLowerCase() === 'authorization' ? authorization : undefined),
});

const activeUser = { id: 5, email: 'a@b.co', name: 'A', role: 'member', isActive: true };
const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authenticate', () => {
  it('rejects a missing Authorization header', async () => {
    await expect(authenticate(requestWith(undefined), {}, vi.fn())).rejects.toMatchObject({
      statusCode: 401,
      code: 'MISSING_TOKEN',
    });
  });

  it('rejects a non-Bearer scheme', async () => {
    await expect(authenticate(requestWith('Basic abc'), {}, vi.fn())).rejects.toMatchObject({ code: 'MISSING_TOKEN' });
  });

  it('rejects garbage tokens', async () => {
    await expect(authenticate(requestWith('Bearer not.a.jwt'), {}, vi.fn())).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });

  it('rejects an unsigned token (alg: none)', async () => {
    const token = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({
      sub: '5',
      role: 'admin',
      iss: 'task-api',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })}.`;

    await expect(authenticate(requestWith(`Bearer ${token}`), {}, vi.fn())).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
    expect(usersRepo.findById).not.toHaveBeenCalled();
  });

  it('rejects an expired token with a distinct code', async () => {
    const expired = jwt.sign(
      { role: 'member', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', subject: '5', issuer: 'task-api' },
    );

    await expect(authenticate(requestWith(`Bearer ${expired}`), {}, vi.fn())).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
    });
  });

  it('rejects a valid token whose user is deactivated or gone', async () => {
    const token = signAccessToken(activeUser);

    usersRepo.findById.mockResolvedValueOnce({ ...activeUser, isActive: false });
    await expect(authenticate(requestWith(`Bearer ${token}`), {}, vi.fn())).rejects.toMatchObject({
      code: 'ACCOUNT_DISABLED',
    });

    usersRepo.findById.mockResolvedValueOnce(null);
    await expect(authenticate(requestWith(`Bearer ${token}`), {}, vi.fn())).rejects.toMatchObject({
      code: 'ACCOUNT_DISABLED',
    });
  });

  it('sets req.user and calls next for a valid token of an active user', async () => {
    usersRepo.findById.mockResolvedValueOnce(activeUser);
    const req = requestWith(`Bearer ${signAccessToken(activeUser)}`);
    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(usersRepo.findById).toHaveBeenCalledWith(5);
    expect(req.user).toEqual(activeUser);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('authorize', () => {
  it('lets an allowed role through', () => {
    const next = vi.fn();
    authorize('admin', 'manager')({ user: { role: 'manager' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes a 403 error for another role', () => {
    const next = vi.fn();
    authorize('admin')({ user: { role: 'member' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('passes a 401 error when nobody is authenticated', () => {
    const next = vi.fn();
    authorize('admin')({}, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });
});
```

#### `tests/unit/transaction.test.js` (deadlock retry with a fake pool)

```js
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/db/pool.js', () => ({ pool: { getConnection: vi.fn() } }));

import { pool } from '../../src/db/pool.js';
import { withTransaction } from '../../src/db/transaction.js';

function fakeConnection() {
  return {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };
}

const deadlock = () => Object.assign(new Error('Deadlock found'), { code: 'ER_LOCK_DEADLOCK' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('withTransaction', () => {
  it('commits and releases on success', async () => {
    const connection = fakeConnection();
    pool.getConnection.mockResolvedValue(connection);

    const result = await withTransaction(async () => 'ok');

    expect(result).toBe('ok');
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it('rolls back, releases and rethrows on a normal error (no retry)', async () => {
    const connection = fakeConnection();
    pool.getConnection.mockResolvedValue(connection);
    const work = vi.fn().mockRejectedValue(new Error('business rule'));

    await expect(withTransaction(work)).rejects.toThrow('business rule');

    expect(work).toHaveBeenCalledTimes(1);
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it('retries after a deadlock and then succeeds', async () => {
    const first = fakeConnection();
    const second = fakeConnection();
    pool.getConnection.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const work = vi.fn().mockRejectedValueOnce(deadlock()).mockResolvedValueOnce('done');

    await expect(withTransaction(work)).resolves.toBe('done');

    expect(work).toHaveBeenCalledTimes(2);
    expect(first.rollback).toHaveBeenCalledOnce();
    expect(first.release).toHaveBeenCalledOnce();
    expect(second.commit).toHaveBeenCalledOnce();
    expect(second.release).toHaveBeenCalledOnce();
  });

  it('gives up after the retry budget is used', async () => {
    pool.getConnection.mockImplementation(async () => fakeConnection());
    const work = vi.fn().mockRejectedValue(deadlock());

    await expect(withTransaction(work, { retries: 1 })).rejects.toMatchObject({ code: 'ER_LOCK_DEADLOCK' });
    expect(work).toHaveBeenCalledTimes(2); // first try + one retry
  });
});
```

### Integration tests

#### `tests/integration/auth.test.js`

```js
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { auth, closeDb, createActors, createUser, PASSWORD, pool, resetDb } from '../helpers.js';

const app = createApp();

beforeEach(resetDb);
afterAll(closeDb);

const register = (body) => request(app).post('/api/v1/auth/register').send(body);
const login = (body) => request(app).post('/api/v1/auth/login').send(body);

describe('POST /api/v1/auth/register', () => {
  it('creates a member, normalises the email and never returns the password', async () => {
    const res = await register({ email: 'New.User@Example.com', name: 'New User', password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'new.user@example.com', role: 'member', isActive: true });
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('refuses a client-supplied role (mass assignment)', async () => {
    const res = await register({ email: 'evil@example.com', name: 'Evil', password: PASSWORD, role: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate email regardless of letter case', async () => {
    await register({ email: 'dup@example.com', name: 'One', password: PASSWORD });
    const res = await register({ email: 'DUP@example.com', name: 'Two', password: PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('validates the password length', async () => {
    const short = await register({ email: 'a@example.com', name: 'A', password: 'short' });
    const long = await register({ email: 'b@example.com', name: 'B', password: 'x'.repeat(73) });

    expect(short.status).toBe(400);
    expect(short.body.error.details[0]).toMatchObject({ in: 'body', path: 'password' });
    expect(long.status).toBe(400);
  });

  it('stores a bcrypt hash, not the password', async () => {
    await register({ email: 'hash@example.com', name: 'Hash', password: PASSWORD });
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE email = ?', ['hash@example.com']);

    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$04\$/); // cost 4 in the test environment
    expect(rows[0].password_hash).not.toContain(PASSWORD);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns a token that works on /auth/me', async () => {
    await createUser({ email: 'ok@example.com', name: 'Ok' });

    const res = await login({ email: 'ok@example.com', password: PASSWORD });
    expect(res.status).toBe(200);

    const me = await request(app).get('/api/v1/auth/me').set(auth(res.body.data.accessToken));
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('ok@example.com');
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await createUser({ email: 'real@example.com' });

    const wrongPassword = await login({ email: 'real@example.com', password: 'Wrong-password-1' });
    const unknownEmail = await login({ email: 'ghost@example.com', password: 'Wrong-password-1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('does not let a deactivated user log in', async () => {
    await createUser({ email: 'gone@example.com', isActive: false });

    const res = await login({ email: 'gone@example.com', password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('token handling on protected routes', () => {
  it('rejects a request without a token and advertises the scheme', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
    expect(res.headers['www-authenticate']).toBe('Bearer');
  });

  it('rejects a token whose payload was edited (signature no longer matches)', async () => {
    const { member } = await createActors(app);
    const [header, payload, signature] = member.token.split('.');
    const edited = JSON.parse(Buffer.from(payload, 'base64url').toString());
    edited.role = 'admin';
    const forged = [header, Buffer.from(JSON.stringify(edited)).toString('base64url'), signature].join('.');

    const res = await request(app).get('/api/v1/auth/me').set(auth(forged));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects an expired token', async () => {
    const { member } = await createActors(app);
    const expired = jwt.sign({ role: 'member', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      subject: String(member.id),
      issuer: 'task-api',
    });

    const res = await request(app).get('/api/v1/auth/me').set(auth(expired));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('stops accepting a still-valid token once the account is deactivated', async () => {
    const { member } = await createActors(app);
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [member.id]);

    const res = await request(app).get('/api/v1/auth/me').set(auth(member.token));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });
});
```

#### `tests/integration/users.test.js`

```js
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { auth, closeDb, createActors, resetDb } from '../helpers.js';

const app = createApp();
let actors;

beforeEach(async () => {
  await resetDb();
  actors = await createActors(app);
});
afterAll(closeDb);

const patchUser = (actor, id, body) => request(app).patch(`/api/v1/users/${id}`).set(auth(actor.token)).send(body);

describe('PATCH /api/v1/users/:id', () => {
  it('lets an admin change a role', async () => {
    const res = await patchUser(actors.admin, actors.member.id, { role: 'manager' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: actors.member.id, role: 'manager' });
  });

  it('forbids managers and members', async () => {
    expect((await patchUser(actors.manager, actors.member.id, { role: 'admin' })).status).toBe(403);
    expect((await patchUser(actors.member, actors.member.id, { role: 'admin' })).status).toBe(403);
  });

  it('stops an admin from demoting or deactivating themselves', async () => {
    const demote = await patchUser(actors.admin, actors.admin.id, { role: 'member' });
    const deactivate = await patchUser(actors.admin, actors.admin.id, { isActive: false });

    expect(demote.status).toBe(403);
    expect(demote.body.error.code).toBe('SELF_MODIFICATION');
    expect(deactivate.status).toBe(403);
  });

  it('returns 404 for an unknown user and 400 for an invalid role', async () => {
    expect((await patchUser(actors.admin, 999999, { role: 'member' })).status).toBe(404);
    expect((await patchUser(actors.admin, actors.member.id, { role: 'superuser' })).status).toBe(400);
  });
});

describe('GET /api/v1/users', () => {
  it('lets a manager list users with pagination metadata', async () => {
    const res = await request(app).get('/api/v1/users?limit=3&page=2').set(auth(actors.manager.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 2, limit: 3, total: 4, totalPages: 2 });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('forbids members', async () => {
    const res = await request(app).get('/api/v1/users').set(auth(actors.member.token));
    expect(res.status).toBe(403);
  });
});
```

#### `tests/integration/tasks.test.js`

```js
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { auth, closeDb, createActors, createUser, insertTask, resetDb } from '../helpers.js';

const app = createApp();
let actors;

beforeEach(async () => {
  await resetDb();
  actors = await createActors(app);
});
afterAll(closeDb);

const createTask = (actor, body) => request(app).post('/api/v1/tasks').set(auth(actor.token)).send(body);
const getTask = (actor, id) => request(app).get(`/api/v1/tasks/${id}`).set(auth(actor.token));
const patchTask = (actor, id, body) => request(app).patch(`/api/v1/tasks/${id}`).set(auth(actor.token)).send(body);
const listTasks = (actor, query = '') => request(app).get(`/api/v1/tasks${query}`).set(auth(actor.token));

describe('authentication and creation', () => {
  it('requires a token', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  it('creates a task for the member themselves and sets createdBy from the token', async () => {
    const res = await createTask(actors.member, { title: '  Write report  ' });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/v1/tasks/${res.body.data.id}`);
    expect(res.body.data).toMatchObject({
      title: 'Write report', // trimmed by the schema
      status: 'todo',
      priority: 'medium',
      createdBy: actors.member.id,
      assigneeId: actors.member.id,
      assignee: { id: actors.member.id, name: 'member' },
    });
  });

  it('forbids a member from assigning to someone else', async () => {
    const res = await createTask(actors.member, { title: 'Not mine', assigneeId: actors.other.id });
    expect(res.status).toBe(403);
  });

  it('lets a manager assign to a member', async () => {
    const res = await createTask(actors.manager, { title: 'Delegated', assigneeId: actors.member.id });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ assigneeId: actors.member.id, createdBy: actors.manager.id });
  });

  it('rejects a missing or deactivated assignee with 422', async () => {
    const ghost = await createTask(actors.manager, { title: 'Ghost', assigneeId: 999999 });
    const inactive = await createUser({ email: 'inactive@test.dev', isActive: false });
    const disabled = await createTask(actors.manager, { title: 'Disabled', assigneeId: inactive.id });

    expect(ghost.status).toBe(422);
    expect(ghost.body.error.code).toBe('ASSIGNEE_NOT_FOUND');
    expect(disabled.status).toBe(422);
    expect(disabled.body.error.code).toBe('ASSIGNEE_INACTIVE');
  });
});

describe('validation (negative tests)', () => {
  it('reports which field is wrong', async () => {
    const res = await createTask(actors.member, { title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatchObject({ in: 'body', path: 'title' });
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('rejects unknown fields such as createdBy', async () => {
    const res = await createTask(actors.member, { title: 'x', createdBy: actors.admin.id });
    expect(res.status).toBe(400);
  });

  it('rejects bad enum values, dates and ids', async () => {
    expect((await createTask(actors.member, { title: 'x', priority: 'urgent' })).status).toBe(400);
    expect((await createTask(actors.member, { title: 'x', dueDate: '31-12-2026' })).status).toBe(400);
    expect((await getTask(actors.member, 'abc')).status).toBe(400);
    expect((await getTask(actors.member, 0)).status).toBe(400);
  });

  it('rejects an empty PATCH body', async () => {
    const created = await createTask(actors.member, { title: 'x' });
    const res = await patchTask(actors.member, created.body.data.id, {});
    expect(res.status).toBe(400);
  });
});

describe('visibility rules', () => {
  it('shows a member only their own tasks, and hides others with 404', async () => {
    const mine = await createTask(actors.manager, { title: 'For member', assigneeId: actors.member.id });
    const theirs = await createTask(actors.manager, { title: 'For other', assigneeId: actors.other.id });

    const memberList = await listTasks(actors.member);
    expect(memberList.body.data.map((task) => task.id)).toEqual([mine.body.data.id]);

    expect((await getTask(actors.member, mine.body.data.id)).status).toBe(200);
    expect((await getTask(actors.member, theirs.body.data.id)).status).toBe(404);

    const managerList = await listTasks(actors.manager);
    expect(managerList.body.meta.total).toBe(2);
  });
});

describe('updates', () => {
  it('lets a member update status, records events, and treats "no change" as a no-op', async () => {
    const created = await createTask(actors.member, { title: 'Progress' });
    const id = created.body.data.id;

    const updated = await patchTask(actors.member, id, { status: 'in_progress' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('in_progress');

    await patchTask(actors.member, id, { status: 'in_progress' }); // same value again

    const events = await request(app).get(`/api/v1/tasks/${id}/events`).set(auth(actors.member.token));
    expect(events.status).toBe(200);
    expect(events.body.data.map((event) => event.type)).toEqual(['updated', 'created']);
    expect(events.body.data[0].details.changes.status).toEqual({ from: 'todo', to: 'in_progress' });
  });

  it('forbids a member from changing the assignee, allows a manager', async () => {
    const created = await createTask(actors.member, { title: 'Handover' });
    const id = created.body.data.id;

    expect((await patchTask(actors.member, id, { assigneeId: actors.other.id })).status).toBe(403);

    const byManager = await patchTask(actors.manager, id, { assigneeId: actors.other.id });
    expect(byManager.status).toBe(200);
    expect(byManager.body.data.assigneeId).toBe(actors.other.id);
  });

  it('never lets a cancelled task be reopened', async () => {
    const created = await createTask(actors.member, { title: 'Stop' });
    const id = created.body.data.id;

    expect((await patchTask(actors.member, id, { status: 'cancelled' })).status).toBe(200);
    const reopen = await patchTask(actors.member, id, { status: 'todo' });

    expect(reopen.status).toBe(409);
    expect(reopen.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('returns 404 when updating a task the member cannot see', async () => {
    const created = await createTask(actors.manager, { title: 'Private', assigneeId: actors.other.id });
    const res = await patchTask(actors.member, created.body.data.id, { title: 'Hijack' });
    expect(res.status).toBe(404);
  });
});

describe('delete', () => {
  it('forbids members, allows managers, then the task is gone', async () => {
    const created = await createTask(actors.member, { title: 'Delete me' });
    const id = created.body.data.id;

    const byMember = await request(app).delete(`/api/v1/tasks/${id}`).set(auth(actors.member.token));
    expect(byMember.status).toBe(403);

    const byManager = await request(app).delete(`/api/v1/tasks/${id}`).set(auth(actors.manager.token));
    expect(byManager.status).toBe(204);

    expect((await getTask(actors.manager, id)).status).toBe(404);
  });
});

describe('pagination, filtering and sorting', () => {
  it('pages through 25 tasks without overlap and reports correct metadata', async () => {
    for (let i = 1; i <= 25; i += 1) {
      await insertTask({ title: `Task ${i}`, assigneeId: actors.member.id, createdBy: actors.manager.id });
    }

    const page1 = await listTasks(actors.manager, '?page=1&limit=10');
    const page2 = await listTasks(actors.manager, '?page=2&limit=10');
    const page3 = await listTasks(actors.manager, '?page=3&limit=10');
    const page4 = await listTasks(actors.manager, '?page=4&limit=10');

    expect(page2.body.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
    expect(page1.body.data).toHaveLength(10);
    expect(page3.body.data).toHaveLength(5);
    expect(page4.body.data).toEqual([]);

    const ids = [...page1.body.data, ...page2.body.data, ...page3.body.data].map((task) => task.id);
    expect(new Set(ids).size).toBe(25);
  });

  it('rejects an oversized limit and a non-whitelisted sort field', async () => {
    expect((await listTasks(actors.manager, '?limit=1000')).status).toBe(400);
    expect((await listTasks(actors.manager, '?sort=password_hash')).status).toBe(400);
    expect((await listTasks(actors.manager, '?order=sideways')).status).toBe(400);
  });

  it('filters by status, priority and assignee', async () => {
    const memberId = actors.member.id;
    await insertTask({ title: 'A', status: 'done', priority: 'high', assigneeId: memberId });
    await insertTask({ title: 'B', status: 'todo', priority: 'high', assigneeId: memberId });
    await insertTask({ title: 'C', status: 'todo', priority: 'low', assigneeId: actors.other.id });

    const done = await listTasks(actors.manager, '?status=done');
    const highTodo = await listTasks(actors.manager, '?status=todo&priority=high');
    const forOther = await listTasks(actors.manager, `?assigneeId=${actors.other.id}`);

    expect(done.body.data.map((task) => task.title)).toEqual(['A']);
    expect(highTodo.body.data.map((task) => task.title)).toEqual(['B']);
    expect(forOther.body.data.map((task) => task.title)).toEqual(['C']);
  });

  it('searches titles and treats % as a literal character', async () => {
    await insertTask({ title: 'Quarterly report' });
    await insertTask({ title: 'Report bugs' });
    await insertTask({ title: '100% done' });

    const report = await listTasks(actors.manager, '?q=report&sort=title&order=asc');
    const percent = await listTasks(actors.manager, `?q=${encodeURIComponent('%')}`);

    expect(report.body.data.map((task) => task.title)).toEqual(['Quarterly report', 'Report bugs']);
    expect(percent.body.data.map((task) => task.title)).toEqual(['100% done']);
  });

  it('sorts by title in both directions', async () => {
    for (const title of ['Charlie', 'Alpha', 'Bravo']) await insertTask({ title });

    const asc = await listTasks(actors.manager, '?sort=title&order=asc');
    const desc = await listTasks(actors.manager, '?sort=title&order=desc');

    expect(asc.body.data.map((task) => task.title)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(desc.body.data.map((task) => task.title)).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });

  it('filters by due date range and keeps tasks without a due date last', async () => {
    await insertTask({ title: 'Later', dueDate: '2026-02-10' });
    await insertTask({ title: 'Sooner', dueDate: '2026-01-10' });
    await insertTask({ title: 'Someday', dueDate: null });

    const sorted = await listTasks(actors.manager, '?sort=dueDate&order=asc');
    const january = await listTasks(actors.manager, '?dueBefore=2026-01-31');

    expect(sorted.body.data.map((task) => task.title)).toEqual(['Sooner', 'Later', 'Someday']);
    expect(sorted.body.data[0].dueDate).toBe('2026-01-10'); // plain date string, not a timestamp
    expect(january.body.data.map((task) => task.title)).toEqual(['Sooner']);
  });

  it('applies the member visibility rule together with filters', async () => {
    await insertTask({ title: 'Mine', status: 'todo', assigneeId: actors.member.id });
    await insertTask({ title: 'Not mine', status: 'todo', assigneeId: actors.other.id });

    const res = await listTasks(actors.member, '?status=todo');

    expect(res.body.data.map((task) => task.title)).toEqual(['Mine']);
    expect(res.body.meta.total).toBe(1);
  });
});
```

#### `tests/integration/tasks-transactions.test.js`

```js
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { auth, closeDb, countEvents, createActors, createUser, getTaskRow, insertTask, resetDb } from '../helpers.js';

const app = createApp();
let actors;

beforeEach(async () => {
  await resetDb();
  actors = await createActors(app);
});
afterAll(closeDb);

const bulk = (actor, body) => request(app).post('/api/v1/tasks/bulk-status').set(auth(actor.token)).send(body);
const reassign = (actor, body) => request(app).post('/api/v1/tasks/reassign').set(auth(actor.token)).send(body);

describe('POST /api/v1/tasks/bulk-status', () => {
  it('updates every task that needs it and writes one event per changed task', async () => {
    const a = await insertTask({ status: 'todo' });
    const b = await insertTask({ status: 'in_progress' });
    const c = await insertTask({ status: 'done' }); // already done: counted as requested, not updated

    const res = await bulk(actors.manager, { taskIds: [a, b, c], status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ requested: 3, updated: 2 });
    for (const id of [a, b, c]) expect((await getTaskRow(id)).status).toBe('done');
    expect(await countEvents(a, 'status_changed')).toBe(1);
    expect(await countEvents(b, 'status_changed')).toBe(1);
    expect(await countEvents(c, 'status_changed')).toBe(0);
  });

  it('is all-or-nothing when one id does not exist', async () => {
    const a = await insertTask({ status: 'todo' });
    const b = await insertTask({ status: 'todo' });

    const res = await bulk(actors.manager, { taskIds: [a, b, 999999], status: 'done' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TASKS_NOT_FOUND');
    expect((await getTaskRow(a)).status).toBe('todo');
    expect((await getTaskRow(b)).status).toBe('todo');
    expect(await countEvents(a, 'status_changed')).toBe(0);
  });

  it('is all-or-nothing when one task is not allowed to make the transition', async () => {
    const open = await insertTask({ status: 'todo' });
    const cancelled = await insertTask({ status: 'cancelled' });

    const res = await bulk(actors.admin, { taskIds: [open, cancelled], status: 'done' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
    expect(res.body.error.details.taskIds).toEqual([cancelled]);
    expect((await getTaskRow(open)).status).toBe('todo'); // the valid one was NOT changed either
  });

  it('ignores duplicate ids in the request', async () => {
    const a = await insertTask({ status: 'todo' });

    const res = await bulk(actors.manager, { taskIds: [a, a, a], status: 'in_progress' });

    expect(res.body.data).toEqual({ requested: 1, updated: 1 });
    expect(await countEvents(a, 'status_changed')).toBe(1);
  });

  it('is forbidden for members and validates the body', async () => {
    const a = await insertTask({ assigneeId: actors.member.id });

    expect((await bulk(actors.member, { taskIds: [a], status: 'done' })).status).toBe(403);
    expect((await bulk(actors.manager, { taskIds: [], status: 'done' })).status).toBe(400);
    expect((await bulk(actors.manager, { taskIds: [a], status: 'finished' })).status).toBe(400);
    expect((await bulk(actors.manager, { taskIds: ['1'], status: 'done' })).status).toBe(400);
  });
});

describe('POST /api/v1/tasks/reassign', () => {
  it('moves only open tasks from one user to another and records events', async () => {
    const todo = await insertTask({ status: 'todo', assigneeId: actors.member.id });
    const inProgress = await insertTask({ status: 'in_progress', assigneeId: actors.member.id });
    const done = await insertTask({ status: 'done', assigneeId: actors.member.id });

    const res = await reassign(actors.manager, { fromUserId: actors.member.id, toUserId: actors.other.id });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ reassigned: 2, fromUserId: actors.member.id, toUserId: actors.other.id });
    expect((await getTaskRow(todo)).assignee_id).toBe(actors.other.id);
    expect((await getTaskRow(inProgress)).assignee_id).toBe(actors.other.id);
    expect((await getTaskRow(done)).assignee_id).toBe(actors.member.id); // history stays attributed
    expect(await countEvents(todo, 'reassigned')).toBe(1);
    expect(await countEvents(done, 'reassigned')).toBe(0);
  });

  it('returns reassigned: 0 when the source user has no open tasks', async () => {
    const res = await reassign(actors.manager, { fromUserId: actors.member.id, toUserId: actors.other.id });

    expect(res.status).toBe(200);
    expect(res.body.data.reassigned).toBe(0);
  });

  it('refuses a deactivated target and leaves everything unchanged', async () => {
    const task = await insertTask({ status: 'todo', assigneeId: actors.member.id });
    const inactive = await createUser({ email: 'inactive@test.dev', isActive: false });

    const res = await reassign(actors.manager, { fromUserId: actors.member.id, toUserId: inactive.id });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ASSIGNEE_INACTIVE');
    expect((await getTaskRow(task)).assignee_id).toBe(actors.member.id);
  });

  it('rejects the same user, unknown source user and members', async () => {
    const same = await reassign(actors.manager, { fromUserId: actors.member.id, toUserId: actors.member.id });
    const unknown = await reassign(actors.manager, { fromUserId: 999999, toUserId: actors.other.id });
    const byMember = await reassign(actors.member, { fromUserId: actors.member.id, toUserId: actors.other.id });

    expect(same.status).toBe(400);
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('USER_NOT_FOUND');
    expect(byMember.status).toBe(403);
  });
});
```

#### `tests/integration/rollback.test.js` (prove a transaction really rolls back)

```js
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Keep the real implementation but make insertMany spy-able, so one call can fail AFTER the UPDATE ran.
vi.mock('../../src/modules/tasks/task-events.repository.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, insertMany: vi.fn(actual.insertMany) };
});

import { createApp } from '../../src/app.js';
import * as eventsRepo from '../../src/modules/tasks/task-events.repository.js';
import { auth, closeDb, createActors, getTaskRow, insertTask, resetDb } from '../helpers.js';

const app = createApp();
let actors;

beforeEach(async () => {
  await resetDb();
  actors = await createActors(app);
});
afterAll(closeDb);

const bulk = (taskIds) =>
  request(app).post('/api/v1/tasks/bulk-status').set(auth(actors.manager.token)).send({ taskIds, status: 'done' });

describe('transaction rollback', () => {
  it('undoes the UPDATE when a later step in the same transaction fails', async () => {
    const a = await insertTask({ status: 'todo' });
    const b = await insertTask({ status: 'todo' });
    eventsRepo.insertMany.mockRejectedValueOnce(new Error('simulated failure after the UPDATE'));

    const res = await bulk([a, b]);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatchObject({ code: 'INTERNAL_ERROR', message: 'Something went wrong' });
    expect((await getTaskRow(a)).status).toBe('todo'); // rolled back, although UPDATE had already run
    expect((await getTaskRow(b)).status).toBe('todo');
  });

  it('always returns the connection to the pool (no leak after repeated failures)', async () => {
    const a = await insertTask({ status: 'todo' });

    // The test pool has 5 connections. If a failure leaked one, the 6th request would hang forever.
    for (let i = 0; i < 8; i += 1) {
      eventsRepo.insertMany.mockRejectedValueOnce(new Error('boom'));
      expect((await bulk([a])).status).toBe(500);
    }

    const ok = await bulk([a]);
    expect(ok.status).toBe(200);
    expect((await getTaskRow(a)).status).toBe('done');
  });
});
```

#### `tests/integration/security.test.js`

```js
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { closeDb } from '../helpers.js';

const app = createApp();

afterAll(closeDb);

describe('health probes', () => {
  it('liveness is always ok and readiness checks the database', async () => {
    expect((await request(app).get('/health')).body.status).toBe('ok');

    const ready = await request(app).get('/health/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.status).toBe('ready');
  });
});

describe('security headers and request ids', () => {
  it('sets helmet headers and hides the framework', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('generates a request id, reuses a sane incoming one, and replaces a suspicious one', async () => {
    const generated = await request(app).get('/health');
    const reused = await request(app).get('/health').set('X-Request-Id', 'client-req-12345');
    const replaced = await request(app).get('/health').set('X-Request-Id', 'x y');

    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(reused.headers['x-request-id']).toBe('client-req-12345');
    expect(replaced.headers['x-request-id']).not.toBe('x y');
  });

  it('puts the same request id in the error body and the header', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });
});

describe('input hardening', () => {
  it('returns 400 INVALID_JSON for a malformed body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 413 for a body over the size limit', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'a@example.com', password: 'x'.repeat(200_000) });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('CORS', () => {
  it('allows a listed origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('sends no CORS headers to an unlisted origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers a preflight request', async () => {
    const res = await request(app)
      .options('/api/v1/tasks')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('PATCH');
  });
});

describe('rate limiting', () => {
  it('blocks repeated failed logins with 429 and Retry-After', async () => {
    const limited = createApp({ authLimit: 3 }); // fresh app = fresh counters
    const attempt = () => request(limited).post('/api/v1/auth/login').send({ email: 'x@example.com', password: 'nope-nope' });

    for (let i = 0; i < 3; i += 1) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('applies a global limit but never to the health probes', async () => {
    const limited = createApp({ globalLimit: 2 });

    for (let i = 0; i < 5; i += 1) expect((await request(limited).get('/health')).status).toBe(200);

    expect((await request(limited).get('/api/v1/unknown')).status).toBe(404);
    expect((await request(limited).get('/api/v1/unknown')).status).toBe(404);
    expect((await request(limited).get('/api/v1/unknown')).status).toBe(429);
  });
});
```

### Acceptance criteria

- [ ] `npm test` creates `task_api_test`, migrates it and runs all unit + integration tests green.
- [ ] Setting `TEST_DB_NAME=task_api` makes the run abort with the "Refusing to run tests" message (the safety valve works).
- [ ] `npm run dev` shows pretty request logs; `NODE_ENV=production node --env-file=.env src/server.js` shows one JSON object per line.
- [ ] `curl -i -H "X-Request-Id: my-trace-0001" localhost:3000/api/v1/tasks` returns that id in the header, and the 401 body has the same `requestId`.
- [ ] A request with `Authorization: Bearer ...` never shows the token in the logs (redacted); a failed login never logs the password.
- [ ] `curl -i -H "Origin: https://evil.example" localhost:3000/health` has no `access-control-allow-origin`.
- [ ] With `AUTH_RATE_LIMIT_MAX=3` in `.env`, four wrong logins in a row return 429 on the fourth.
- [ ] Mutation check (do this once, it is the best way to learn what tests are worth): temporarily delete `authorize('admin', 'manager')`
  from the DELETE route, run `npm test`, and watch tests fail. Then revert. Do the same with the `ORDER BY ... t.id` tie-breaker and the `FOR UPDATE` clause.
  Note which of them NO test catches (hint: the lock is not covered by a single-request test; a real concurrency test needs two parallel requests).

### Interview concepts demonstrated

- Test pyramid: many fast unit tests, fewer integration tests against a real DB. `[ESSENTIAL]`
- Supertest against `createApp()` without opening a port; negative/edge-case testing. `[ESSENTIAL]`
- Mocking at the right boundary (`vi.mock`, `vi.fn`) and not over-mocking. `[ESSENTIAL]`
- Test isolation and test-database safety. `[ESSENTIAL]`
- Structured logging, correlation ids, log levels, secret redaction. `[ESSENTIAL]`
- helmet, CORS, rate limiting, payload limits, `trust proxy`. `[ESSENTIAL]`
- Proving transactional behaviour (rollback + connection release) in tests. `[ADVANCED]`

### Stage 6 interview material

**Concept:** Unit test = ek function/module akela (DB ya network ke bina). Integration test = poora stack
(HTTP -> middleware -> service -> real MySQL). Correlation id = har request ka ek unique tag jo logs, response aur error
me same rehta hai, taaki production me "user ne kaha request fail hui" ko ek id se trace kar sako.

**Why it matters:** Interviewer ka favourite sawaal: "Tum apne API ko kaise test karte ho aur production me bug kaise dhundte ho?"
Tests regression rokte hain; logs + request id debugging ka time ghanto se minutes me laate hain.

**Internal working:** Supertest app ko ek ephemeral port par bind karta hai (agar `listen` nahi hua), request bhejta hai
aur close kar deta hai. `vi.mock` module registry me import ko replace karta hai (hoisted, import se pehle). Rate limiter ek
fixed window counter hai: key = IP, value = count + reset time; limit cross hone par middleware error pass karta hai.
helmet sirf kuch response headers set karta hai jo browser ko safe defaults batate hain.

**Frontend connection:** Jest/Vitest + React Testing Library se tum already component tests likhte ho; yahan
Supertest "user interactions" ki jagah HTTP requests karta hai. CORS error jo tum browser console me dekhte ho, wo yahi
`Access-Control-Allow-Origin` header ka na hona hai: browser enforce karta hai, server sirf header deta hai.

**Real-world scenario:** Payment API: customer bolta hai "paisa kat gaya, order nahi bana." Support request id maangta hai,
engineer log search me `req.id` daalta hai aur ek hi query me poora flow (auth -> order insert -> gateway call -> error) dikh jaata hai.

**Interview answer:** "I test at two levels. Pure logic like the query builder, authorization policy and error mapping has fast
unit tests. The API itself is covered with Supertest integration tests against a real MySQL test database, because most of the
risk is in SQL, constraints and locking which mocks cannot prove. I include negative tests for bad input, wrong roles and tampered
tokens, and a rollback test proving a failed multi-step operation leaves no partial data and releases its connection. In production
every request has a correlation id that appears in the structured logs, the response header and the error body, and secrets are
redacted from logs."

**Follow-up questions**

1. *Why not mock the database in integration tests?* A mock returns what you tell it; it cannot tell you the SQL is wrong, a foreign key
   is missing or a lock blocks. Use mocks to isolate logic (unit), and a real DB for integration. Use a disposable DB (container or `_test` schema).
2. *How do you keep tests independent?* Each test builds its own data and resets tables before running; no test depends on another's leftovers;
   files share one DB so they run serially (or give each worker its own schema to parallelize).
3. *What is a flaky test and how do you avoid it?* A test that sometimes fails without code changes: shared state, timing/`sleep`, real clocks,
   random order dependencies, network calls. Fix with isolation, deterministic data, fake timers, no real third-party calls.
4. *What is the difference between CORS and CSRF?* CORS controls which origins can READ responses in a browser. CSRF is an attacker
   page making the victim's browser send an authenticated request (cookies sent automatically). Bearer tokens in the `Authorization`
   header are not sent automatically, so they are not CSRF-prone; cookie-based auth needs `SameSite` and/or CSRF tokens.
5. *Which rate-limit algorithms do you know?* Fixed window (simple, burst at window edges), sliding window (smoother, more memory), token
   bucket (allows bursts, steady refill), leaky bucket (smooths output). With multiple instances use a shared store (Redis) so the limit is global.
6. *Why `trust proxy`?* Behind a reverse proxy, the TCP peer is the proxy. Without `trust proxy`, every user shares one IP and one rate limit;
   if you trust the header blindly, anyone can spoof `X-Forwarded-For` to dodge limits. Set the exact number of proxy hops.
7. *What belongs in a log line, and what never?* Include: timestamp, level, request id, method, path, status, duration, user id. Never: passwords,
   tokens, full card numbers, secrets, raw personal data. Redact by path and review what you log on error objects.
8. *Log levels?* `error` = needs action, `warn` = unusual but handled (4xx), `info` = business events, `debug/trace` = development detail (off in production).

**Common mistakes**

- Tests that run against the development database (and delete real data). We guard against it.
- Over-mocking: asserting that a mock was called instead of asserting behaviour.
- Testing only the happy path. Most production bugs live in the 4xx/edge cases.
- `console.log` debugging instead of structured logs; logging whole request bodies (leaks secrets).
- Setting CORS to `*` with credentials or reflecting any origin.
- Rate limiting by IP behind a proxy without `trust proxy` (everyone blocked together).
- Hashing with a high bcrypt cost in tests (slow suite). Use the minimum in the test environment only.
- Running the rate limiter only on login but not globally (or the reverse).

**Revision notes:** unit = pure logic, integration = real DB; negative tests matter; mock at boundaries; `createApp()` enables Supertest;
request id in logs + header + error body; helmet = headers, CORS = browser read permission (not auth), rate limit = per-IP counter
(needs shared store for many instances); redact secrets; never run tests on the dev DB.

---

## 10. Stage 7 - README + OpenAPI docs (Week 6-7)

### Requirements

1. A `README.md` that lets a stranger run the project in 10 minutes: prerequisites, setup, scripts, env table,
   endpoints, auth example, error format, testing, design decisions, troubleshooting.
2. An OpenAPI 3.0 description of every endpoint, served as JSON at `/openapi.json` and as interactive
   Swagger UI at `/docs` (switchable with `DOCS_ENABLED`).
3. The OpenAPI document reuses the code's own enums (statuses, priorities, roles, sort fields), so docs cannot drift
   from validation on those values. A test guards the structure (every `$ref` resolves, every endpoint is documented).
4. The final `package.json` is complete and consistent with everything built so far.

### Implementation approach

- Hand-written OpenAPI object in JavaScript (one file) with tiny helper functions to avoid repetition. Alternative
  approaches (generate from zod schemas, or write the spec first and generate routes) are discussed in the Q&A.
- `swagger-ui-express` serves the UI. It is mounted AFTER the rate limiter and body parser, so docs traffic is also limited.
- Docs are a product feature for your API's consumers (the frontend team). The README is for developers who run
  or maintain the service. Keep both short and accurate; delete anything you do not maintain.

```bash
npm install swagger-ui-express
```

### `src/docs/openapi.js`

```js
import { ROLES } from '../modules/users/users.schemas.js';
import { SORT_FIELDS, TASK_PRIORITIES, TASK_STATUSES } from '../modules/tasks/tasks.schemas.js';

// ---- tiny helpers so the spec below stays readable ------------------------------------------------------
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const response = (description, schema) => ({ description, content: json(schema) });
const envelope = (schema) => ({ type: 'object', required: ['data'], properties: { data: schema } });
const listEnvelope = (schema) => ({
  type: 'object',
  required: ['data', 'meta'],
  properties: { data: { type: 'array', items: schema }, meta: ref('PageMeta') },
});
const body = (name) => ({ required: true, content: json(ref(name)) });
const bearer = [{ bearerAuth: [] }];
const idPath = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };
const queryParam = (name, schema, description) => ({ name, in: 'query', required: false, description, schema });

const ERROR_TEXT = {
  400: 'Validation failed or malformed request',
  401: 'Missing, invalid or expired token',
  403: 'Your role is not allowed to do this',
  404: 'Not found (also returned for resources you are not allowed to see)',
  409: 'Conflicts with the current state',
  422: 'A business rule rejected the request',
  429: 'Rate limit exceeded',
};
const errors = (...codes) =>
  Object.fromEntries(codes.map((code) => [String(code), response(ERROR_TEXT[code], ref('ErrorResponse'))]));

const dateTime = { type: 'string', format: 'date-time' };
const nullableDate = { type: 'string', format: 'date', nullable: true, example: '2026-12-31' };

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Task Management API',
    version: '1.0.0',
    description:
      'REST API for tasks with JWT authentication and role-based access control (admin, manager, member). ' +
      'Every error uses the same ErrorResponse shape and includes a requestId you can quote to support.',
  },
  servers: [{ url: '/', description: 'This server' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Tasks' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: { 200: response('Process is up', { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe (checks the database)',
        responses: {
          200: response('Ready to serve traffic', { type: 'object', properties: { status: { type: 'string', example: 'ready' } } }),
          503: response('Database unavailable', { type: 'object', properties: { status: { type: 'string', example: 'unavailable' } } }),
        },
      },
    },

    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create a member account',
        description: 'The role is always `member`. Passwords must be 8-72 characters.',
        requestBody: body('RegisterRequest'),
        responses: { 201: response('Account created', envelope(ref('AuthResult'))), ...errors(400, 409, 429) },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive an access token',
        description: 'Failed attempts are rate limited. The same error is returned for an unknown email and a wrong password.',
        requestBody: body('LoginRequest'),
        responses: { 200: response('Logged in', envelope(ref('AuthResult'))), ...errors(400, 401, 429) },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: bearer,
        responses: { 200: response('The authenticated user', envelope(ref('User'))), ...errors(401) },
      },
    },

    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (admin, manager)',
        security: bearer,
        parameters: [
          queryParam('page', { type: 'integer', minimum: 1, default: 1 }),
          queryParam('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }),
        ],
        responses: { 200: response('A page of users', listEnvelope(ref('User'))), ...errors(400, 401, 403) },
      },
    },
    '/api/v1/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Change a role or activate/deactivate a user (admin)',
        description: 'An admin cannot demote or deactivate themselves.',
        security: bearer,
        parameters: [idPath],
        requestBody: body('UpdateUserRequest'),
        responses: { 200: response('The updated user', envelope(ref('User'))), ...errors(400, 401, 403, 404) },
      },
    },

    '/api/v1/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks (paginated, filtered, sorted)',
        description: 'Members only see tasks assigned to them or created by them. Managers and admins see all tasks.',
        security: bearer,
        parameters: [
          queryParam('page', { type: 'integer', minimum: 1, default: 1 }),
          queryParam('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }),
          queryParam('status', { type: 'string', enum: TASK_STATUSES }),
          queryParam('priority', { type: 'string', enum: TASK_PRIORITIES }),
          queryParam('assigneeId', { type: 'integer', minimum: 1 }),
          queryParam('dueBefore', { type: 'string', format: 'date' }, 'Due date on or before (YYYY-MM-DD)'),
          queryParam('dueAfter', { type: 'string', format: 'date' }, 'Due date on or after (YYYY-MM-DD)'),
          queryParam('q', { type: 'string', maxLength: 100 }, 'Title contains this text'),
          queryParam('sort', { type: 'string', enum: SORT_FIELDS, default: 'createdAt' }),
          queryParam('order', { type: 'string', enum: ['asc', 'desc'], default: 'desc' }),
        ],
        responses: { 200: response('A page of tasks', listEnvelope(ref('Task'))), ...errors(400, 401) },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        description: 'Members can only assign tasks to themselves (the default). Managers and admins can assign anyone active.',
        security: bearer,
        requestBody: body('CreateTaskRequest'),
        responses: {
          201: {
            description: 'Task created',
            headers: { Location: { schema: { type: 'string' }, description: 'URL of the new task' } },
            content: json(envelope(ref('Task'))),
          },
          ...errors(400, 401, 403, 422),
        },
      },
    },
    '/api/v1/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get one task',
        security: bearer,
        parameters: [idPath],
        responses: { 200: response('The task', envelope(ref('Task'))), ...errors(400, 401, 404) },
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Update some fields of a task',
        description:
          'Only managers and admins may change `assigneeId`. `cancelled` is a terminal status. ' +
          'Every real change is recorded in the task history.',
        security: bearer,
        parameters: [idPath],
        requestBody: body('UpdateTaskRequest'),
        responses: { 200: response('The updated task', envelope(ref('Task'))), ...errors(400, 401, 403, 404, 409, 422) },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task (admin, manager)',
        security: bearer,
        parameters: [idPath],
        responses: { 204: { description: 'Deleted' }, ...errors(400, 401, 403, 404) },
      },
    },
    '/api/v1/tasks/{id}/events': {
      get: {
        tags: ['Tasks'],
        summary: 'Audit history of a task (newest first)',
        security: bearer,
        parameters: [idPath],
        responses: { 200: response('Events', envelope({ type: 'array', items: ref('TaskEvent') })), ...errors(400, 401, 404) },
      },
    },
    '/api/v1/tasks/bulk-status': {
      post: {
        tags: ['Tasks'],
        summary: 'Set the status of many tasks, all or nothing (admin, manager)',
        description:
          'If any id does not exist (404) or any task cannot make the transition (409), NO task is changed. ' +
          'Duplicate ids are ignored.',
        security: bearer,
        requestBody: body('BulkStatusRequest'),
        responses: {
          200: response(
            'Result',
            envelope({
              type: 'object',
              properties: {
                requested: { type: 'integer', example: 3 },
                updated: { type: 'integer', example: 2, description: 'Tasks whose status actually changed' },
              },
            }),
          ),
          ...errors(400, 401, 403, 404, 409),
        },
      },
    },
    '/api/v1/tasks/reassign': {
      post: {
        tags: ['Tasks'],
        summary: 'Move all open tasks from one user to another, all or nothing (admin, manager)',
        description: 'Open means `todo` or `in_progress`. Tasks in other statuses stay with the original user.',
        security: bearer,
        requestBody: body('ReassignRequest'),
        responses: {
          200: response(
            'Result',
            envelope({
              type: 'object',
              properties: {
                reassigned: { type: 'integer', example: 4 },
                fromUserId: { type: 'integer' },
                toUserId: { type: 'integer' },
              },
            }),
          ),
          ...errors(400, 401, 403, 404, 422),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Request validation failed' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    in: { type: 'string', enum: ['params', 'query', 'body'] },
                    path: { type: 'string', example: 'title' },
                    message: { type: 'string' },
                  },
                },
              },
              requestId: { type: 'string', example: '5c0f6c6e-2d6c-4f1e-9a73-0a5d8c3bde11' },
            },
          },
        },
      },
      PageMeta: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ROLES },
          isActive: { type: 'boolean' },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          user: ref('User'),
          accessToken: { type: 'string', description: 'JWT. Send as `Authorization: Bearer <token>`' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: { type: 'string', example: '1h' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'name', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', format: 'email', maxLength: 255 },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        properties: { role: { type: 'string', enum: ROLES }, isActive: { type: 'boolean' } },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: TASK_STATUSES },
          priority: { type: 'string', enum: TASK_PRIORITIES },
          dueDate: nullableDate,
          createdBy: { type: 'integer', nullable: true },
          assigneeId: { type: 'integer', nullable: true },
          assignee: {
            type: 'object',
            nullable: true,
            properties: { id: { type: 'integer' }, name: { type: 'string', nullable: true } },
          },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      CreateTaskRequest: {
        type: 'object',
        required: ['title'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 5000, nullable: true },
          priority: { type: 'string', enum: TASK_PRIORITIES, default: 'medium' },
          dueDate: nullableDate,
          assigneeId: { type: 'integer', minimum: 1, nullable: true },
        },
      },
      UpdateTaskRequest: {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 5000, nullable: true },
          status: { type: 'string', enum: TASK_STATUSES },
          priority: { type: 'string', enum: TASK_PRIORITIES },
          dueDate: nullableDate,
          assigneeId: { type: 'integer', minimum: 1, nullable: true },
        },
      },
      BulkStatusRequest: {
        type: 'object',
        required: ['taskIds', 'status'],
        additionalProperties: false,
        properties: {
          taskIds: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'integer', minimum: 1 } },
          status: { type: 'string', enum: TASK_STATUSES },
        },
      },
      ReassignRequest: {
        type: 'object',
        required: ['fromUserId', 'toUserId'],
        additionalProperties: false,
        properties: {
          fromUserId: { type: 'integer', minimum: 1 },
          toUserId: { type: 'integer', minimum: 1, description: 'Must be an active user different from fromUserId' },
        },
      },
      TaskEvent: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          taskId: { type: 'integer' },
          actorId: { type: 'integer', nullable: true },
          type: { type: 'string', enum: ['created', 'updated', 'status_changed', 'reassigned'] },
          details: { type: 'object', nullable: true, additionalProperties: true },
          createdAt: dateTime,
        },
      },
    },
  },
};
```

### `src/app.js` (FINAL)

```js
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapiSpec } from './docs/openapi.js';
import { errorHandler } from './middleware/error-handler.js';
import { httpLogger } from './middleware/http-logger.js';
import { notFound } from './middleware/not-found.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { securityMiddleware } from './middleware/security.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export function createApp({ globalLimit = env.RATE_LIMIT_MAX, authLimit = env.AUTH_RATE_LIMIT_MAX } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(httpLogger);
  app.use(securityMiddleware);
  app.use(healthRouter);
  app.use(createRateLimiter({ limit: globalLimit }));
  app.use(express.json({ limit: '100kb' }));

  if (env.DOCS_ENABLED) {
    app.get('/openapi.json', (_req, res) => res.json(openapiSpec));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'Task API docs' }));
  }

  app.use('/api/v1/auth', createRateLimiter({ limit: authLimit, skipSuccessfulRequests: true }), authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/tasks', tasksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
```

If the Swagger page is blank, open the browser console: helmet's default Content-Security-Policy can block resources
Swagger UI needs. Fix it for the docs route only (do not weaken the policy for the whole API).

### `tests/unit/openapi.test.js`

```js
import { describe, expect, it } from 'vitest';
import { openapiSpec } from '../../src/docs/openapi.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../src/modules/tasks/tasks.schemas.js';

function collectRefs(node, found = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, found);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref') found.add(value);
      else collectRefs(value, found);
    }
  }
  return found;
}

// Keep this list in sync with the routers. If you add an endpoint and forget the docs, this test fails.
const EXPECTED_OPERATIONS = [
  'get /health',
  'get /health/ready',
  'post /api/v1/auth/register',
  'post /api/v1/auth/login',
  'get /api/v1/auth/me',
  'get /api/v1/users',
  'patch /api/v1/users/{id}',
  'get /api/v1/tasks',
  'post /api/v1/tasks',
  'get /api/v1/tasks/{id}',
  'patch /api/v1/tasks/{id}',
  'delete /api/v1/tasks/{id}',
  'get /api/v1/tasks/{id}/events',
  'post /api/v1/tasks/bulk-status',
  'post /api/v1/tasks/reassign',
];

describe('OpenAPI document', () => {
  it('documents every endpoint', () => {
    const documented = Object.entries(openapiSpec.paths).flatMap(([path, operations]) =>
      Object.keys(operations).map((method) => `${method} ${path}`),
    );

    expect(documented.sort()).toEqual([...EXPECTED_OPERATIONS].sort());
  });

  it('has no dangling $ref', () => {
    for (const reference of collectRefs(openapiSpec)) {
      const name = reference.replace('#/components/schemas/', '');
      expect(openapiSpec.components.schemas[name], `missing schema ${name}`).toBeDefined();
    }
  });

  it('reuses the enums from the validation code', () => {
    const task = openapiSpec.components.schemas.Task.properties;
    expect(task.status.enum).toEqual(TASK_STATUSES);
    expect(task.priority.enum).toEqual(TASK_PRIORITIES);
  });

  it('can be serialised to JSON without losing data', () => {
    expect(JSON.parse(JSON.stringify(openapiSpec)).openapi).toBe('3.0.3');
  });

  it('requires a token on every /api/v1 operation except register and login', () => {
    const open = new Set(['/api/v1/auth/register', '/api/v1/auth/login']);
    for (const [path, operations] of Object.entries(openapiSpec.paths)) {
      if (!path.startsWith('/api/v1') || open.has(path)) continue;
      for (const [method, operation] of Object.entries(operations)) {
        expect(operation.security, `${method} ${path}`).toEqual([{ bearerAuth: [] }]);
      }
    }
  });
});
```

### `package.json` (FINAL, Stages 1-7)

```json
{
  "name": "task-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node src/server.js",
    "migrate": "node --env-file=.env scripts/migrate.js",
    "seed": "node --env-file=.env scripts/seed.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.14.0",
    "pino": "^9.7.0",
    "pino-http": "^10.5.0",
    "swagger-ui-express": "^5.0.1",
    "zod": "^4.1.0"
  },
  "devDependencies": {
    "pino-pretty": "^13.0.0",
    "supertest": "^7.1.0",
    "vitest": "^3.2.0"
  }
}
```

The caret ranges let `npm install` pick newer compatible minor versions, and `package-lock.json` (commit it) pins exactly what you tested.
On Node 20 everything works except `node --watch` is experimental and `process.loadEnvFile()` needs Node 20.12+; use 22 LTS.

### `README.md` (copy this into the project root)

````markdown
# Task Management API

REST API for managing tasks in a small team. Node.js 22, Express 5, MySQL 8, JWT auth with role-based access
control (admin / manager / member), validation with zod, structured logging, tests with Vitest + Supertest and
interactive OpenAPI docs.

## Features

- Register / login with bcrypt-hashed passwords and short-lived JWT access tokens
- Roles: `admin`, `manager`, `member` (members only see tasks assigned to or created by them)
- Tasks CRUD with partial updates, status rules (a cancelled task cannot be reopened) and an audit history
- Pagination, filtering (status, priority, assignee, due dates, title search) and sorting
- All-or-nothing bulk operations in database transactions: bulk status change and reassigning a user's open tasks
- One error format for every failure, with a request id for tracing
- helmet, CORS allowlist, rate limiting, body size limit, secrets redacted from logs

## Prerequisites

- Node.js 22 or newer
- MySQL 8.x (8.4 LTS is fine) running in UTC. Quick start with Docker:
  `docker run --name task-mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8.4 --default-time-zone=+00:00`

## Quick start

```bash
npm install
cp .env.example .env        # then edit .env (DB credentials, JWT_SECRET)
```

Create the databases and user once (as the MySQL root user):

```sql
CREATE DATABASE task_api CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'taskapi'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON task_api.* TO 'taskapi'@'%';
GRANT ALL PRIVILEGES ON task_api_test.* TO 'taskapi'@'%';
FLUSH PRIVILEGES;
```

```bash
npm run migrate             # creates the tables
npm run seed -- --demo      # creates admin + demo manager/member (demo accounts: never in production)
npm run dev                 # http://localhost:3000
```

Open http://localhost:3000/docs for the interactive API documentation.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start with auto-restart and pretty logs |
| `npm start` | Start for production (reads real environment variables) |
| `npm run migrate` | Apply new files from `db/migrations` |
| `npm run seed` | Create the admin from `SEED_ADMIN_*` (add `-- --demo` for demo users) |
| `npm test` | Run unit + integration tests (needs MySQL; uses the `*_test` database) |

## Environment variables

See `.env.example` for the full list. The app validates them at startup and refuses to boot if one is missing or invalid.

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DB_USER`, `DB_NAME` | yes | | MySQL credentials / database |
| `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | no | empty, `127.0.0.1`, `3306` | |
| `DB_POOL_SIZE` | no | 10 | Keep `instances x pool size` under MySQL `max_connections` |
| `JWT_SECRET` | yes | | At least 32 random characters |
| `JWT_EXPIRES_IN` | no | `1h` | Form: `15m`, `1h`, `7d` |
| `BCRYPT_ROUNDS` | no | 12 | |
| `CORS_ORIGINS` | no | `http://localhost:5173` | Comma-separated browser origins |
| `TRUST_PROXY` | no | 0 | Number of reverse proxies in front of the app |
| `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` | no | 300, 10 | Per IP per window (`RATE_LIMIT_WINDOW_MS`, default 15 min) |
| `DOCS_ENABLED` | no | `true` | Serve `/docs` and `/openapi.json` |
| `LOG_LEVEL` | no | `info` | `fatal` ... `trace`, `silent` |

## API overview

All JSON. Base path `/api/v1`. Send `Authorization: Bearer <token>` on everything except register and login.

| Method | Path | Who |
|--------|------|-----|
| POST | /auth/register, /auth/login | public |
| GET | /auth/me | any user |
| GET | /users | admin, manager |
| PATCH | /users/:id | admin |
| GET, POST | /tasks | any user (members see only their own) |
| GET, PATCH | /tasks/:id | any user (same rule) |
| DELETE | /tasks/:id | admin, manager |
| GET | /tasks/:id/events | any user (same rule) |
| POST | /tasks/bulk-status | admin, manager |
| POST | /tasks/reassign | admin, manager |

Example:

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"YOUR_SEED_PASSWORD"}' \
  | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).data.accessToken")

curl -X POST localhost:3000/api/v1/tasks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Prepare release notes","priority":"high","dueDate":"2026-12-31"}'

curl "localhost:3000/api/v1/tasks?status=todo&sort=dueDate&order=asc&page=1&limit=20" -H "Authorization: Bearer $TOKEN"
```

Errors always look like this:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed",
             "details": [{ "in": "body", "path": "title", "message": "..." }], "requestId": "..." } }
```

## Project structure

```
src/
  app.js, server.js        app factory (no listen) and process entry (listen + graceful shutdown)
  config/                  env validation (zod) and logger (pino)
  db/                      mysql2 pool and withTransaction helper
  middleware/              auth, validate, error handler, logging, security, rate limit
  modules/<name>/          routes -> controller -> service -> repository (+ schemas)
  docs/openapi.js          OpenAPI document
db/migrations/             versioned SQL
tests/                     unit/ and integration/
```

## Design decisions

- **Layers:** controllers handle HTTP, services hold rules and transactions, repositories hold SQL.
- **Raw SQL with placeholders:** explicit and reviewable; column names for dynamic UPDATE/ORDER BY come from whitelists.
- **Transactions:** `withTransaction` (begin / commit / rollback / always release, retry on deadlock). Rows are locked
  with `SELECT ... FOR UPDATE` in primary-key order. Audit events are written in the same transaction.
- **Authorization:** role checks in routes, ownership rules in the service; other users' tasks return 404, not 403.
- **Auth lookup per request:** a user lookup on every request makes deactivation and role changes immediate.

## Security notes

Passwords: bcrypt. Tokens: HS256 JWT with pinned algorithm and expiry. Unknown JSON fields are rejected.
Secrets are never logged. Rate limits: global and a stricter one on failed auth attempts. Run behind HTTPS
(terminate TLS at your reverse proxy) and set `TRUST_PROXY` correctly.

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `Invalid environment configuration` on start | A variable is missing/invalid; the message names it |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL is not running or the port is different |
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` / `DB_PASSWORD`, or the user has no grant on `DB_NAME` |
| `/health/ready` returns 503 | Database unreachable; check logs for the real error |
| Tests: `Refusing to run tests` | `TEST_DB_NAME` must end with `_test` |
| Timestamps are hours off | Run MySQL in UTC (`default-time-zone='+00:00'`) |
| 429 while testing by hand | Rate limit; raise `AUTH_RATE_LIMIT_MAX` locally or wait for the window |
````

### Acceptance criteria

- [ ] `npm install swagger-ui-express`, restart: `http://localhost:3000/docs` shows all endpoints; "Authorize" with a token and execute `GET /api/v1/tasks` from the UI.
- [ ] `curl localhost:3000/openapi.json` returns the spec; with `DOCS_ENABLED=false`, `/docs` and `/openapi.json` return 404.
- [ ] `npm test` still passes, including `openapi.test.js`. Remove one path from `openapi.js` and see that test fail, then restore it.
- [ ] Follow your own README from an empty folder (clone, install, env, migrate, seed, run). Fix anything that was unclear.
- [ ] Final checklist of the whole project: no `console.log` outside `scripts/`; no secret in git; `.env.example` lists every variable the code reads; `git status` clean except intended files.

### Interview concepts demonstrated

- API documentation as a deliverable; OpenAPI/Swagger; contract between frontend and backend. `[ESSENTIAL]`
- API versioning (`/api/v1`) and backward-compatible evolution. `[ESSENTIAL]`
- Developer experience: README, `.env.example`, scripts, troubleshooting. `[ESSENTIAL]`
- Keeping docs from drifting (shared enums + a test). `[ADVANCED]`

### Stage 7 interview material

**Concept:** API documentation = tumhare API ka "user manual" frontend developer ke liye. OpenAPI ek standard JSON/YAML
format hai jisme endpoints, request/response shapes aur auth likhe jaate hain; Swagger UI usko clickable page bana deta hai.

**Why it matters:** Tum frontend dev ho, tumne dekha hoga ki bina docs ke backend integration kitna slow hota hai
("ye field kab null aata hai?"). Achhe docs = kam Slack messages, kam bugs, aur code generation (TypeScript clients, Postman collection) free me milti hai.

**Internal working:** `swagger-ui-express` ek static Swagger UI bundle serve karta hai aur spec JSON ko usme inject karta hai;
browser spec padhke form generate karta hai aur "Try it out" par seedha tumhare API ko call karta hai (isiliye CORS/same-origin matter karta hai).

**Frontend connection:** Tum axios/fetch wrappers ya React Query hooks likhte ho; OpenAPI se `openapi-typescript` jaise tools se
types auto-generate hote hain, jisse frontend aur backend ke beech type mismatch kam hota hai.

**Real-world scenario:** Marketplace me mobile team aur web team dono ek hi API use karti hain. Spec ek single source of truth hai;
breaking change (field rename) ke liye `/api/v2` banta hai taaki purane mobile app versions na tootein.

**Interview answer:** "I version the API in the URL and treat the OpenAPI document as the contract. It is served by the app for
interactive exploration, built from the same enums the validation uses, and a test fails if an endpoint is missing from it.
The README documents setup, configuration, scripts and troubleshooting so a new developer can run the service in minutes."

**Follow-up questions**

1. *Code-first vs contract-first (spec-first)?* Code-first: derive the spec from code (decorators, zod-to-OpenAPI), less drift but the spec
   follows implementation. Contract-first: design the spec with consumers, then implement and validate against it; better for
   multiple teams. We hand-wrote the spec and added a guard test; for a large API I would generate it from the zod schemas.
2. *How do you version an API?* URL (`/v1`) is simple and visible; header/media-type versioning keeps URLs clean but is harder to test and cache.
   Add fields without a new version (backward compatible); changing/removing fields or meaning needs a new version and a deprecation period (Sunset header, changelog).
3. *Should Swagger UI be public in production?* It reveals your API surface. Public APIs often expose it; internal ones put it behind auth/VPN or disable it (`DOCS_ENABLED=false`).
4. *PATCH vs PUT in your docs?* PATCH sends only changed fields (our case), with `minProperties: 1`; PUT would require the whole resource.
5. *What is HATEOAS and do you use it?* Responses contain links to next actions. Rarely used in practice; we only return a `Location` header on create.

**Common mistakes**

- Docs written once and never updated (guard with tests or generation).
- README that does not mention the required environment variables or the database setup.
- Exposing `.env` values in docs examples; using real tokens in examples.
- Changing a response shape without a version bump.
- Putting secrets in the OpenAPI `example` values.

**Revision notes:** OpenAPI = machine-readable contract; Swagger UI = interactive viewer; version in the URL; backward-compatible changes
do not need a new version; README = setup + config + scripts + troubleshooting; guard docs with a test.

---

## 11. Extension A - Redis caching `[ADVANCED]`

Extensions are optional. Do them after Stage 7 is green. Extension B builds on A (it reuses the Redis dependency
and the "after commit" hook introduced here).

### Requirements

1. Cache single-task reads (`GET /tasks/:id`) and list reads (`GET /tasks`) in Redis to reduce database load.
2. Authorization must NEVER depend on the cache: the cache stores task data, the permission check runs after every read.
3. Every write (create, update, delete, bulk status, reassign) invalidates what it affected, AFTER the transaction commits.
4. If Redis is down, slow or not configured, the API keeps working (cache is an optimisation, not a dependency).
5. Without `REDIS_URL` the code path is a pure pass-through: all earlier tests still pass unchanged.

### Implementation approach

- **Cache-aside** (lazy loading): read cache -> on miss read DB -> write cache with a TTL. The application, not
  the cache, owns the logic. TTLs (60 s for one task, 30 s for lists) bound how stale anything can get even if an
  invalidation is missed.
- **Single task:** key `task:{id}`, value = the task JSON. Delete the key on every write that touches the task.
- **Lists** are hard to invalidate precisely (any write could change any list). We use a **version key**:
  `tasks:list:version` is part of every list cache key; every write does `INCR` on it, so all old list keys instantly
  become unreachable and expire by TTL. List keys also include the viewer scope (`all` or `user-<id>`) because a
  member's list differs from a manager's list, and a hash of the validated query.
- A small **after-commit hook** (`afterTasksChanged`) is called by the service once the transaction has committed.
  Extension A uses it for invalidation; Extension B adds notifications to the same hook. The service says WHAT happened,
  the hook decides what to do about it. A hook failure is logged and swallowed: the database change already succeeded,
  so the client must not get an error for it.
- Invalidate AFTER commit, not inside the transaction: otherwise a concurrent reader could re-fill the cache with the old
  row between your delete and your commit.
- Redis client options: `enableOfflineQueue: false` and `maxRetriesPerRequest: 1`, so a dead Redis makes commands fail
  immediately (and we fall back to the DB) instead of queueing requests and slowing the API.

### Commands

```bash
npm install ioredis
docker run --name task-redis -p 6379:6379 -d redis:7-alpine
```

In `.env` uncomment: `REDIS_URL=redis://127.0.0.1:6379`

### `src/cache/cache.js`

```js
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// No REDIS_URL -> no client -> every method below is a harmless no-op.
const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1, // fail a command quickly
      enableOfflineQueue: false, // while disconnected, fail immediately instead of buffering commands
      connectTimeout: 2_000,
    })
  : null;

redis?.on('error', (err) => logger.warn({ err }, 'redis connection error'));

// A cache must never take the API down: any Redis problem becomes "cache miss".
async function safely(label, fallback, operation) {
  if (!redis) return fallback;
  try {
    return await operation(redis);
  } catch (err) {
    logger.warn({ err, label }, 'cache operation failed, continuing without cache');
    return fallback;
  }
}

export const cache = {
  enabled: Boolean(redis),

  getText: (key) => safely('get', null, (client) => client.get(key)),

  getJson: (key) =>
    safely('getJson', null, async (client) => {
      const raw = await client.get(key);
      return raw === null ? null : JSON.parse(raw);
    }),

  setJson: (key, value, ttlSeconds = 60) =>
    safely('setJson', undefined, (client) => client.set(key, JSON.stringify(value), 'EX', ttlSeconds)),

  del: (...keys) => safely('del', 0, (client) => (keys.length > 0 ? client.del(...keys) : 0)),

  incr: (key) => safely('incr', 0, (client) => client.incr(key)),

  async close() {
    if (!redis) return;
    try {
      await redis.quit();
    } catch {
      redis.disconnect();
    }
  },
};
```

### `src/modules/tasks/task-cache.js`

```js
import { createHash } from 'node:crypto';
import { cache } from '../../cache/cache.js';

const TASK_TTL_SECONDS = 60;
const LIST_TTL_SECONDS = 30;
const LIST_VERSION_KEY = 'tasks:list:version';

export const taskKey = (id) => `task:${id}`;

export const read = (key) => cache.getJson(key);

export const writeTask = (task) => cache.setJson(taskKey(task.id), task, TASK_TTL_SECONDS);

export const writeList = (key, result) => cache.setJson(key, result, LIST_TTL_SECONDS);

// Build the key ONCE per request and reuse it for the read and the later write. If we rebuilt it after the DB call, a
// write that bumped the version in between would make us store stale data under the NEW version.
export async function buildListKey(scope, query) {
  const version = (await cache.getText(LIST_VERSION_KEY)) ?? '0';
  const canonical = JSON.stringify(query, Object.keys(query).sort()); // same query -> same text, key order irrelevant
  const hash = createHash('sha256').update(canonical).digest('hex').slice(0, 32);
  return `tasks:list:v${version}:${scope}:${hash}`;
}

export async function invalidate(taskIds) {
  await cache.del(...taskIds.map(taskKey));
  await cache.incr(LIST_VERSION_KEY); // every cached list key becomes unreachable at once
}
```

### `src/modules/tasks/task-hooks.js` (Extension A state)

```js
import { logger } from '../../config/logger.js';
import * as taskCache from './task-cache.js';

/**
 * Called by the service AFTER a transaction committed.
 *   taskIds      - tasks that changed (cache invalidation)
 *   assignments  - [{ taskId, assigneeId, actorId, version }] new assignments (used by Extension B)
 *   reassignment - { toUserId, taskIds, actorId } or null (used by Extension B)
 * Never throws: the database change already happened, a cache/queue hiccup must not turn it into an error response.
 */
export async function afterTasksChanged({ taskIds }) {
  try {
    await taskCache.invalidate(taskIds);
  } catch (err) {
    logger.error({ err, taskIds }, 'post-commit hook failed');
  }
}
```

### `src/modules/tasks/tasks.service.js` (FINAL, with Extensions A and B wired in)

This is the complete file. It replaces the Stage 5 version. Changes: cache reads in `listTasks`/`getTask`, and a call to
`afterTasksChanged` after each committed write. Extension B only edits `task-hooks.js`, not this file again.

```js
import { withTransaction } from '../../db/transaction.js';
import { ConflictError, ForbiddenError, NotFoundError, UnprocessableError } from '../../errors/app-error.js';
import { pageMeta } from '../../utils/pagination.js';
import * as usersRepo from '../users/users.repository.js';
import * as eventsRepo from './task-events.repository.js';
import * as taskCache from './task-cache.js';
import { afterTasksChanged } from './task-hooks.js';
import { assertTransition, canTransition, canViewTask, isPrivileged, OPEN_STATUSES } from './task-policy.js';
import * as tasksRepo from './tasks.repository.js';

// ---- helpers -----------------------------------------------------------------------------------------

async function assertAssignable(userId, connection) {
  const user = await usersRepo.findByIdForShare(userId, connection);
  if (!user) throw new UnprocessableError('Assignee does not exist', 'ASSIGNEE_NOT_FOUND');
  if (!user.isActive) throw new UnprocessableError('Assignee account is deactivated', 'ASSIGNEE_INACTIVE');
}

function resolveAssigneeForCreate(actor, requested) {
  if (isPrivileged(actor)) return requested;
  if (requested !== undefined && requested !== actor.id) {
    throw new ForbiddenError('Members can only assign tasks to themselves');
  }
  return actor.id;
}

function diffTask(existing, patch) {
  const changes = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && value !== existing[key]) {
      changes[key] = { from: existing[key], to: value };
    }
  }
  return changes;
}

// Do not notify people about things they did themselves. `version` makes the job id stable per change.
function assignmentFor(actor, task) {
  if (task.assigneeId === null || task.assigneeId === undefined || task.assigneeId === actor.id) return [];
  return [
    {
      taskId: task.id,
      assigneeId: task.assigneeId,
      actorId: actor.id,
      version: new Date(task.updatedAt).getTime(),
    },
  ];
}

// ---- reads (cache-aside) -----------------------------------------------------------------------------

export async function listTasks(actor, query) {
  const scope = isPrivileged(actor) ? 'all' : `user-${actor.id}`; // a member's list differs from a manager's
  const key = await taskCache.buildListKey(scope, query);

  const cached = await taskCache.read(key);
  if (cached) return cached;

  const { page, limit, sort, order, ...filters } = query;
  if (!isPrivileged(actor)) filters.visibleTo = actor.id;

  const { items, total } = await tasksRepo.list(filters, { page, limit, sort, order });
  const result = { items, meta: pageMeta({ page, limit, total }) };

  await taskCache.writeList(key, result);
  return result;
}

export async function getTask(actor, id) {
  let task = await taskCache.read(taskCache.taskKey(id));
  if (!task) {
    task = await tasksRepo.findById(id);
    if (task) await taskCache.writeTask(task);
  }
  // The cache holds DATA, not permission decisions: authorize on every read, cached or not.
  if (!task || !canViewTask(actor, task)) throw new NotFoundError('Task not found');
  return task;
}

export async function getTaskEvents(actor, id) {
  await getTask(actor, id);
  return eventsRepo.listByTask(id);
}

// ---- single-task writes ------------------------------------------------------------------------------

export async function createTask(actor, input) {
  const assigneeId = resolveAssigneeForCreate(actor, input.assigneeId);

  const task = await withTransaction(async (connection) => {
    if (assigneeId !== undefined && assigneeId !== null) await assertAssignable(assigneeId, connection);

    const created = await tasksRepo.create({ ...input, assigneeId, createdBy: actor.id }, connection);
    await eventsRepo.insert(
      { taskId: created.id, actorId: actor.id, type: 'created', details: { title: created.title, assigneeId: created.assigneeId } },
      connection,
    );
    return created;
  });

  await afterTasksChanged({ taskIds: [task.id], assignments: assignmentFor(actor, task) }); // after COMMIT
  return task;
}

export async function updateTask(actor, id, patch) {
  if (patch.assigneeId !== undefined && !isPrivileged(actor)) {
    throw new ForbiddenError('Only managers and admins can change the assignee');
  }

  const { task, changed, assigneeChanged } = await withTransaction(async (connection) => {
    const existing = await tasksRepo.findByIdForUpdate(id, connection);
    if (!existing || !canViewTask(actor, existing)) throw new NotFoundError('Task not found');

    if (patch.assigneeId != null && patch.assigneeId !== existing.assigneeId) {
      await assertAssignable(patch.assigneeId, connection);
    }
    if (patch.status !== undefined) assertTransition(existing.status, patch.status);

    const changes = diffTask(existing, patch);
    if (Object.keys(changes).length === 0) {
      return { task: await tasksRepo.findById(id, connection), changed: false, assigneeChanged: false };
    }

    const changedValues = Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.to]));
    const updated = await tasksRepo.update(id, changedValues, connection);
    await eventsRepo.insert({ taskId: id, actorId: actor.id, type: 'updated', details: { changes } }, connection);
    return { task: updated, changed: true, assigneeChanged: 'assigneeId' in changes };
  });

  if (changed) {
    await afterTasksChanged({ taskIds: [id], assignments: assigneeChanged ? assignmentFor(actor, task) : [] });
  }
  return task;
}

export async function deleteTask(actor, id) {
  if (!isPrivileged(actor)) throw new ForbiddenError();
  const removed = await tasksRepo.remove(id);
  if (!removed) throw new NotFoundError('Task not found');
  await afterTasksChanged({ taskIds: [id] });
}

// ---- multi-row transactions --------------------------------------------------------------------------

export async function bulkUpdateStatus(actor, { taskIds, status }) {
  if (!isPrivileged(actor)) throw new ForbiddenError();
  const ids = [...new Set(taskIds)];

  const { changedIds, ...summary } = await withTransaction(async (connection) => {
    const rows = await tasksRepo.lockByIds(ids, connection);

    if (rows.length !== ids.length) {
      const found = new Set(rows.map((row) => row.id));
      const missing = ids.filter((id) => !found.has(id));
      throw new NotFoundError(`Tasks not found: ${missing.join(', ')}`, 'TASKS_NOT_FOUND');
    }

    const blocked = rows.filter((row) => !canTransition(row.status, status)).map((row) => row.id);
    if (blocked.length > 0) {
      throw new ConflictError(
        `Status "${status}" is not allowed for tasks: ${blocked.join(', ')}`,
        'INVALID_TRANSITION',
        { taskIds: blocked },
      );
    }

    const changing = rows.filter((row) => row.status !== status);
    if (changing.length > 0) {
      await tasksRepo.updateStatusMany(changing.map((row) => row.id), status, connection);
      await eventsRepo.insertMany(
        changing.map((row) => ({
          taskId: row.id,
          actorId: actor.id,
          type: 'status_changed',
          details: { from: row.status, to: status },
        })),
        connection,
      );
    }
    return { requested: ids.length, updated: changing.length, changedIds: changing.map((row) => row.id) };
  });

  if (changedIds.length > 0) await afterTasksChanged({ taskIds: changedIds });
  return summary;
}

export async function reassignOpenTasks(actor, { fromUserId, toUserId }) {
  if (!isPrivileged(actor)) throw new ForbiddenError();

  const { taskIds, ...summary } = await withTransaction(async (connection) => {
    const source = await usersRepo.findById(fromUserId, connection);
    if (!source) throw new NotFoundError('Source user not found', 'USER_NOT_FOUND');
    await assertAssignable(toUserId, connection);

    const tasks = await tasksRepo.lockByAssignee(fromUserId, OPEN_STATUSES, connection);
    if (tasks.length > 0) {
      await tasksRepo.reassignMany(tasks.map((task) => task.id), toUserId, connection);
      await eventsRepo.insertMany(
        tasks.map((task) => ({
          taskId: task.id,
          actorId: actor.id,
          type: 'reassigned',
          details: { from: fromUserId, to: toUserId },
        })),
        connection,
      );
    }
    return { reassigned: tasks.length, fromUserId, toUserId, taskIds: tasks.map((task) => task.id) };
  });

  if (taskIds.length > 0) {
    await afterTasksChanged({ taskIds, reassignment: { toUserId, taskIds, actorId: actor.id } });
  }
  return summary;
}
```

### `tests/integration/cache.test.js` (no Redis needed: the cache module is replaced by an in-memory fake)

```js
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/cache/cache.js', () => {
  const store = new Map();
  return {
    cache: {
      enabled: true,
      __store: store,
      getText: vi.fn(async (key) => store.get(key) ?? null),
      getJson: vi.fn(async (key) => (store.has(key) ? JSON.parse(store.get(key)) : null)),
      setJson: vi.fn(async (key, value) => {
        store.set(key, JSON.stringify(value));
      }),
      del: vi.fn(async (...keys) => {
        for (const key of keys) store.delete(key);
      }),
      incr: vi.fn(async (key) => {
        const next = Number(store.get(key) ?? 0) + 1;
        store.set(key, String(next));
        return next;
      }),
      close: vi.fn(async () => {}),
    },
  };
});

// Count how often the service really reaches the database for reads.
vi.mock('../../src/modules/tasks/tasks.repository.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, findById: vi.fn(actual.findById), list: vi.fn(actual.list) };
});

import { createApp } from '../../src/app.js';
import { cache } from '../../src/cache/cache.js';
import * as tasksRepo from '../../src/modules/tasks/tasks.repository.js';
import { auth, closeDb, createActors, resetDb } from '../helpers.js';

const app = createApp();
let actors;

beforeEach(async () => {
  await resetDb();
  cache.__store.clear();
  actors = await createActors(app);
  vi.clearAllMocks(); // forget the calls made while preparing data
});
afterAll(closeDb);

const create = (body) => request(app).post('/api/v1/tasks').set(auth(actors.manager.token)).send(body);
const read = (actor, id) => request(app).get(`/api/v1/tasks/${id}`).set(auth(actor.token));
const list = () => request(app).get('/api/v1/tasks?limit=5').set(auth(actors.manager.token));

describe('single task cache', () => {
  it('serves the second read from the cache and refreshes after an update', async () => {
    const id = (await create({ title: 'Cache me', assigneeId: actors.member.id })).body.data.id;

    await read(actors.manager, id);
    await read(actors.manager, id);
    expect(tasksRepo.findById).toHaveBeenCalledTimes(1); // second read never reached MySQL

    await request(app).patch(`/api/v1/tasks/${id}`).set(auth(actors.manager.token)).send({ title: 'Changed' });
    const after = await read(actors.manager, id);

    expect(after.body.data.title).toBe('Changed'); // invalidated, not stale
    expect(tasksRepo.findById).toHaveBeenCalledTimes(2);
  });

  it('still applies authorization to cached data', async () => {
    const id = (await create({ title: 'Private', assigneeId: actors.member.id })).body.data.id;

    expect((await read(actors.manager, id)).status).toBe(200); // fills the cache
    const intruder = await read(actors.other, id); // another member, same cached row

    expect(intruder.status).toBe(404);
    expect(tasksRepo.findById).toHaveBeenCalledTimes(1);
  });

  it('removes the cached task on delete', async () => {
    const id = (await create({ title: 'Short lived' })).body.data.id;
    await read(actors.manager, id);

    await request(app).delete(`/api/v1/tasks/${id}`).set(auth(actors.manager.token));

    expect((await read(actors.manager, id)).status).toBe(404);
  });
});

describe('list cache', () => {
  it('caches an identical list query and invalidates it when a task is created', async () => {
    await create({ title: 'First' });
    vi.clearAllMocks();

    await list();
    await list();
    expect(tasksRepo.list).toHaveBeenCalledTimes(1);

    await create({ title: 'Second' }); // bumps the list version
    const fresh = await list();

    expect(tasksRepo.list).toHaveBeenCalledTimes(2);
    expect(fresh.body.meta.total).toBe(2);
  });
});
```

### Acceptance criteria

- [ ] `npm test` is still green WITHOUT `REDIS_URL` (pass-through mode), and `cache.test.js` passes (fake cache).
- [ ] With Redis running and `REDIS_URL` set: `curl -w "%{time_total}\n" -o /dev/null -s .../tasks/1 -H "Authorization: Bearer $TOKEN"` twice; the second is usually faster.
- [ ] In `docker exec -it task-redis redis-cli`: `SCAN 0 MATCH task:* COUNT 100`, `TTL task:1` (counts down from 60), `GET tasks:list:version` (increases after every write).
- [ ] PATCH a task, then GET it: new data immediately (not after 60 s).
- [ ] `docker stop task-redis` while the API runs: every endpoint still works (warnings in the logs), no 500s. Start it again: caching resumes.
- [ ] A member who is not allowed to see a cached task still gets 404.

### Interview concepts demonstrated

- Cache-aside, TTL, invalidation strategies (delete on write, version keys). `[ESSENTIAL]`
- "There are only two hard things": cache invalidation and consistency windows. `[ESSENTIAL]`
- Cache must not break authorization; graceful degradation when the cache is down. `[ESSENTIAL]`
- Hook after commit (side effects only after the DB transaction succeeded). `[ADVANCED]`

### Extension A interview material

**Concept:** Cache = frequently padha jaane wala data ko fast memory (Redis) me rakhna taaki har baar MySQL na jaana pade.
Redis ek in-memory key-value store hai (strings, hashes, lists, sets, sorted sets), TTL support karta hai, aur single-threaded
event loop par chalta hai (isliye commands atomic hote hain).

**Why it matters:** Read-heavy endpoints (dashboard, product page) par DB sabse pehle bottleneck banta hai. Cache latency kam karta
hai aur DB load. Lekin cache = duplicate data, matlab stale data ka risk. Isliye "kya cache karein aur kab invalidate karein" hi asli skill hai.

**Internal working:** Cache-aside: (1) cache check, (2) miss par DB, (3) cache me daalo. Write par key delete (invalidate), next read fresh data laata hai.
Version key trick: list ke liye har key me version number hai; `INCR` karte hi saare purane keys "orphan" ho jaate hain aur TTL se khud expire.

**Frontend connection:** React Query / SWR bhi cache-aside + invalidation karte hain: `queryClient.invalidateQueries(['tasks'])` write ke baad.
Browser HTTP cache (`Cache-Control`, ETag) bhi same idea hai. Yahan bas server side par, aur sabhi users ke liye shared.

**Real-world scenario:** Marketplace product page 1000 req/s; price rarely changes. Cache 60 s. Seller price update kare to
product key delete. Lekin user-specific data (cart, "my orders") me user id key me chahiye, warna ek user ka data dusre ko dikhega (data leak).

**Interview answer:** "I use cache-aside with short TTLs. Reads check Redis first and fall back to MySQL; writes commit to MySQL first and then
invalidate the affected keys. List queries use a version number in the key, so one INCR invalidates all cached lists. Authorization is applied after
reading from the cache, never stored in it, and cache keys include the viewer's scope. If Redis fails, the code treats it as a cache miss, so the API stays available."

**Follow-up questions**

1. *Cache stampede (thundering herd)?* A hot key expires and 1000 requests hit the DB at once. Mitigate with request coalescing (one in-flight load per key in the process),
   a short lock (`SET key val NX PX 5000`) so one request rebuilds, TTL jitter, or refreshing before expiry.
2. *Cache penetration?* Requests for ids that do not exist always miss and hit the DB (attack vector). Cache "not found" for a short time (negative caching) or use a Bloom filter. We skip it here and rely on rate limiting.
3. *Cache avalanche?* Many keys expire together. Add random jitter to TTLs and avoid restarting a cold cache under full load.
4. *Write-through vs write-behind vs cache-aside?* Write-through writes cache and DB together (consistent, slower writes). Write-behind writes cache first and DB later asynchronously (fast, risk of loss). Cache-aside is simplest and the common default.
5. *Why not cache per-request user lookup in `authenticate`?* You could (`user:{id}` for 30 s) but then deactivation is delayed by the TTL unless you also invalidate on user changes. A security-versus-speed trade-off to decide consciously.
6. *Redis persistence?* RDB snapshots (periodic) and AOF (append-only log, `appendfsync everysec`). For a pure cache you may disable persistence; for queues (BullMQ) you want AOF because jobs must survive restarts.
7. *When NOT to cache?* Data that must always be exact (balances, stock at checkout), rarely repeated queries, very large payloads, per-user data without proper keys.
8. *Why a version key and not `KEYS tasks:list:*` + `DEL`?* `KEYS` scans every key and blocks Redis (single-threaded). `SCAN` is incremental but still O(N) and racy. One `INCR` is O(1).

**Common mistakes**

- Caching authorization results or whole responses that differ per user under a shared key.
- Invalidating before the DB commit (a reader re-caches old data) or forgetting one write path.
- No TTL (stale forever when an invalidation is missed).
- Treating the cache as the source of truth; making the API fail when Redis is down.
- Using `KEYS` in production.
- Caching huge lists with high-cardinality query strings (low hit rate, memory churn).

**Revision notes:** cache-aside = read cache, miss -> DB -> set with TTL; invalidate after commit; version key for lists; scope in the key; authorize after cache; fail open when Redis is down; stampede/penetration/avalanche.

---

## 12. Extension B - Background jobs with BullMQ `[ADVANCED]`

### Requirements

1. When a task is assigned to someone (on create, on assignee change) the assignee should get a notification, and when tasks are reassigned the new owner gets one summary.
2. Sending must NOT slow down or fail the HTTP request: it runs in a separate worker process.
3. Jobs survive restarts (stored in Redis), retry with exponential backoff (5 attempts) and a duplicate enqueue of the same logical event does not create a second job (stable job id).
4. The worker shuts down gracefully (finishes active jobs, then exits).
5. Without `REDIS_URL`, enqueueing is a no-op and the API is unaffected.

### Implementation approach

- **Queue** = a list of jobs in Redis. The API is the **producer** (`queue.add`), a separate Node process is the **consumer** (`Worker`).
  BullMQ stores job data, state (waiting/active/completed/failed/delayed), attempts and scheduling in Redis.
- We only enqueue AFTER the database commit (via the `afterTasksChanged` hook from Extension A). Trade-off: if the process crashes between commit and enqueue,
  the notification is lost. The robust solution is the **transactional outbox**: write the job into an `outbox` table in the SAME transaction and have a relay publish it. Mentioned in the Q&A, not built here.
- Job handlers must be **idempotent** because delivery is "at least once": a job may run twice (worker crash after sending but before acking). Use the job id as the idempotency key towards the email provider.
- Handlers re-load fresh data by id instead of trusting the payload (the task may have been deleted or the user deactivated by the time the job runs).
- A job that can never succeed (unknown job name) throws `UnrecoverableError` so it is not retried 5 times for nothing.
- Producer connection: `enableOfflineQueue: false`, so `queue.add` fails fast when Redis is down instead of hanging the request (we catch and log). Worker connection: `maxRetriesPerRequest: null`, which BullMQ requires for workers.

### Commands

```bash
npm install bullmq        # ioredis was installed in Extension A
```

Add to `package.json` scripts: `"worker": "node --watch --env-file=.env src/worker.js"` (use `node --env-file=.env src/worker.js` for production).

### `src/queue/notifications.js`

```js
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const NOTIFICATIONS_QUEUE = 'notifications';

// Producers (the API) should fail fast if Redis is down.
function createProducerConnection() {
  return new Redis(env.REDIS_URL, { enableOfflineQueue: false });
}

// Workers block on Redis commands, so BullMQ requires maxRetriesPerRequest: null.
export function createWorkerConnection() {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

let queue = null;

// Created lazily: importing this module (for example in the worker) must not open a producer connection.
function getQueue() {
  if (!env.REDIS_URL) return null;
  if (!queue) {
    queue = new Queue(NOTIFICATIONS_QUEUE, {
      connection: createProducerConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2_000 }, // 2s, 4s, 8s, 16s between attempts
        removeOnComplete: { age: 3_600, count: 1_000 }, // keep Redis small
        removeOnFail: { age: 7 * 24 * 3_600 }, // keep failures a week for debugging
      },
    });
    queue.on('error', (err) => logger.warn({ err }, 'notification queue error'));
  }
  return queue;
}

/**
 * Returns true if the job was accepted. A custom jobId makes the call idempotent: adding a job with an id that
 * already exists is ignored by BullMQ (use "-" separators; avoid purely numeric ids).
 */
export async function enqueueNotification(name, data, jobId) {
  const target = getQueue();
  if (!target) return false;
  try {
    await target.add(name, data, jobId ? { jobId } : {});
    return true;
  } catch (err) {
    logger.error({ err, name, jobId }, 'failed to enqueue notification');
    return false;
  }
}

export async function closeQueue() {
  if (queue) await queue.close();
}
```

### `src/modules/tasks/task-hooks.js` (FINAL: replaces the Extension A version)

```js
import { logger } from '../../config/logger.js';
import { enqueueNotification } from '../../queue/notifications.js';
import * as taskCache from './task-cache.js';

/**
 * Called by the service AFTER a transaction committed. Never throws (see Extension A).
 *   taskIds      - tasks that changed -> cache invalidation
 *   assignments  - [{ taskId, assigneeId, actorId, version }] -> one "task-assigned" job each
 *   reassignment - { toUserId, taskIds, actorId } | null -> one "tasks-reassigned" summary job
 */
export async function afterTasksChanged({ taskIds, assignments = [], reassignment = null }) {
  try {
    await taskCache.invalidate(taskIds);

    for (const assignment of assignments) {
      await enqueueNotification(
        'task-assigned',
        { taskId: assignment.taskId, assigneeId: assignment.assigneeId, actorId: assignment.actorId },
        // Same task + same assignee + same version of the row = same logical event = same job id.
        `task-assigned-${assignment.taskId}-${assignment.assigneeId}-${assignment.version}`,
      );
    }

    if (reassignment) {
      await enqueueNotification('tasks-reassigned', {
        toUserId: reassignment.toUserId,
        taskIds: reassignment.taskIds,
        actorId: reassignment.actorId,
      });
    }
  } catch (err) {
    logger.error({ err, taskIds }, 'post-commit hook failed');
  }
}
```

### `src/worker.js`

```js
import { UnrecoverableError, Worker } from 'bullmq';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './db/pool.js';
import * as tasksRepo from './modules/tasks/tasks.repository.js';
import * as usersRepo from './modules/users/users.repository.js';
import { createWorkerConnection, NOTIFICATIONS_QUEUE } from './queue/notifications.js';

if (!env.REDIS_URL) {
  logger.fatal('REDIS_URL is required to run the worker');
  process.exit(1);
}

// Replace the logger calls with a real provider (SES, SendGrid...) and pass job.id as the provider's idempotency key.
async function handleJob(job) {
  switch (job.name) {
    case 'task-assigned': {
      const [task, user] = await Promise.all([
        tasksRepo.findById(job.data.taskId),
        usersRepo.findById(job.data.assigneeId),
      ]);
      if (!task || !user || !user.isActive) {
        logger.info({ jobId: job.id }, 'task or assignee no longer valid, skipping');
        return { skipped: true };
      }
      logger.info({ jobId: job.id, userId: user.id, taskId: task.id }, 'sending assignment notification');
      return { sent: true };
    }

    case 'tasks-reassigned': {
      const user = await usersRepo.findById(job.data.toUserId);
      if (!user || !user.isActive) return { skipped: true };
      logger.info(
        { jobId: job.id, userId: user.id, taskCount: job.data.taskIds.length },
        'sending reassignment summary notification',
      );
      return { sent: true };
    }

    default:
      // Retrying cannot fix an unknown job name.
      throw new UnrecoverableError(`Unknown job name: ${job.name}`);
  }
}

const worker = new Worker(NOTIFICATIONS_QUEUE, handleJob, {
  connection: createWorkerConnection(),
  concurrency: 5, // up to 5 jobs in parallel in this process (they are I/O bound)
});

worker.on('completed', (job) => logger.info({ jobId: job.id, name: job.name }, 'job completed'));
worker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, name: job?.name, attemptsMade: job?.attemptsMade, err }, 'job failed'),
);
worker.on('error', (err) => logger.error({ err }, 'worker error'));

logger.info({ queue: NOTIFICATIONS_QUEUE }, 'worker started');

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'worker shutting down');

  setTimeout(() => process.exit(1), 15_000).unref(); // hard stop if a job hangs
  await worker.close(); // stops taking new jobs and waits for the active ones
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Edit `src/server.js`: close Redis resources on shutdown

Add two imports at the top:

```js
import { cache } from './cache/cache.js';
import { closeQueue } from './queue/notifications.js';
```

and replace the body of the `server.close(...)` callback so it closes everything (each failure is logged, none blocks the others):

```js
  server.close(async (closeError) => {
    if (closeError) logger.error({ err: closeError }, 'error while closing http server');

    const results = await Promise.allSettled([pool.end(), cache.close(), closeQueue()]);
    for (const result of results) {
      if (result.status === 'rejected') logger.error({ err: result.reason }, 'error while closing a resource');
    }
    process.exit(closeError ? 1 : 0);
  });
```

### `tests/unit/task-hooks.test.js`

```js
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/queue/notifications.js', () => ({ enqueueNotification: vi.fn().mockResolvedValue(true) }));
vi.mock('../../src/modules/tasks/task-cache.js', () => ({ invalidate: vi.fn().mockResolvedValue(undefined) }));

import { enqueueNotification } from '../../src/queue/notifications.js';
import * as taskCache from '../../src/modules/tasks/task-cache.js';
import { afterTasksChanged } from '../../src/modules/tasks/task-hooks.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('afterTasksChanged', () => {
  it('invalidates the cache for the changed tasks', async () => {
    await afterTasksChanged({ taskIds: [1, 2] });

    expect(taskCache.invalidate).toHaveBeenCalledWith([1, 2]);
    expect(enqueueNotification).not.toHaveBeenCalled();
  });

  it('enqueues one job per assignment with a deterministic job id', async () => {
    await afterTasksChanged({
      taskIds: [7],
      assignments: [{ taskId: 7, assigneeId: 3, actorId: 1, version: 1700000000000 }],
    });

    expect(enqueueNotification).toHaveBeenCalledWith(
      'task-assigned',
      { taskId: 7, assigneeId: 3, actorId: 1 },
      'task-assigned-7-3-1700000000000',
    );
  });

  it('enqueues a single summary job for a reassignment', async () => {
    await afterTasksChanged({ taskIds: [1, 2, 3], reassignment: { toUserId: 9, taskIds: [1, 2, 3], actorId: 4 } });

    expect(enqueueNotification).toHaveBeenCalledTimes(1);
    expect(enqueueNotification).toHaveBeenCalledWith('tasks-reassigned', { toUserId: 9, taskIds: [1, 2, 3], actorId: 4 });
  });

  it('never throws, even when the cache or the queue fails', async () => {
    taskCache.invalidate.mockRejectedValueOnce(new Error('redis down'));
    await expect(afterTasksChanged({ taskIds: [1] })).resolves.toBeUndefined();

    enqueueNotification.mockRejectedValueOnce(new Error('queue down'));
    await expect(
      afterTasksChanged({ taskIds: [1], assignments: [{ taskId: 1, assigneeId: 2, actorId: 3, version: 1 }] }),
    ).resolves.toBeUndefined();
  });
});
```

### Acceptance criteria

- [ ] Terminal 1: `npm run dev`. Terminal 2: `npm run worker` prints "worker started".
- [ ] As manager create a task assigned to the demo member: the worker logs "sending assignment notification" within a second; the HTTP response time did not change.
- [ ] Stop the worker, create 3 assigned tasks, start the worker: all 3 jobs are processed (jobs survived in Redis).
- [ ] Reassign a user's open tasks: ONE "sending reassignment summary notification" log, not one per task.
- [ ] Make `handleJob` throw once (temporary): the failure is logged and the job is retried after about 2 s, then 4 s ... and eventually succeeds when you remove the throw. (After 5 failures it stays in the failed set.)
- [ ] Ctrl+C the worker while a job runs: it logs "worker shutting down" and exits cleanly after the job finishes.
- [ ] `docker stop task-redis`: creating tasks still returns 201 (enqueue failure is logged, not surfaced).
- [ ] `npm test` is green (no Redis in tests; `task-hooks.test.js` passes).

### Interview concepts demonstrated

- Why background jobs exist (slow, unreliable or non-urgent work must not run inside the request). `[ESSENTIAL]`
- Queues, producers/consumers, retries with exponential backoff, dead-letter/failed set. `[ESSENTIAL]`
- At-least-once delivery and idempotent consumers. `[ESSENTIAL]`
- Graceful shutdown of workers. `[ESSENTIAL]`
- Transactional outbox as the fix for "commit succeeded but enqueue failed". `[ADVANCED]`

### Extension B interview material

**Concept:** Background job = kaam jo HTTP request ke andar nahi, alag process me hota hai (email bhejna, image resize, report banana).
Queue = jobs ki line jo Redis me store hoti hai; worker jobs uthake process karta hai.

**Why it matters:** Agar email provider 3 second slow hai to tumhara API bhi 3 second slow ho jaata hai; provider down hai to API fail ho jaata hai.
Queue se request turant return hoti hai, aur failure par retry apne aap hota hai.

**Internal working:** `queue.add` Redis me job hash + waiting list me id daalta hai (Lua scripts se atomic). Worker blocking command se naya job leta hai,
job "active" hota hai, lock renew hota rehta hai. Success par "completed"; error par attempts bache hain to "delayed" (backoff ke baad wapas waiting),
nahi to "failed". Agar worker mar gaya aur lock expire hua, to job "stalled" maana jaata hai aur dobara chalta hai, isliye handler idempotent hona chahiye.

**Frontend connection:** Browser me `setTimeout`/Web Worker/`requestIdleCallback` se heavy kaam UI thread se hatate ho. Ye wahi idea hai: main thread (request path) ko free rakho,
heavy ya slow kaam alag worker ko do. Aur "optimistic UI" jaisa: user ko turant 201 mil gaya, notification baad me.

**Real-world scenario:** Payment success par: order confirm (DB, synchronous) + invoice PDF + email + SMS + inventory sync (jobs). Gateway webhook ko 200 jaldi chahiye, baaki async.

**Interview answer:** "Slow or failure-prone side effects such as notifications run in a BullMQ worker. The API commits the database transaction first and then enqueues a job
with a deterministic job id, so enqueueing the same event twice is harmless. The worker retries with exponential backoff, re-loads fresh data by id, and is idempotent because
delivery is at least once. If enqueueing fails the request still succeeds and the error is logged; for guaranteed delivery I would use a transactional outbox."

**Follow-up questions**

1. *Why not just `setTimeout`/fire-and-forget inside the request?* It dies with the process, has no retries, no visibility, and competes with requests for CPU and memory.
2. *At-most-once vs at-least-once vs exactly-once?* At-most-once may lose work, at-least-once may duplicate (what queues give), exactly-once is effectively "at-least-once + idempotent consumer".
3. *What if the job is enqueued but the transaction rolled back?* That is why we enqueue after commit. The opposite failure (commit ok, enqueue lost) is solved with an outbox table written in the same transaction.
4. *How do you handle a poison message?* Limit attempts, backoff, move to a failed/dead-letter set, alert on failed-count, allow manual replay; `UnrecoverableError` for non-retryable cases.
5. *How do you scale workers?* Run more worker processes (they compete for jobs) and raise `concurrency` for I/O-bound jobs; CPU-bound jobs need more processes or `worker_threads`. Watch queue depth and job age.
6. *BullMQ vs RabbitMQ/Kafka/SQS?* BullMQ: simple job queue on Redis with retries/delays/rate limits, great for application background jobs. RabbitMQ: routing and acknowledgements between services. Kafka: durable ordered event log for streaming. SQS: managed queue, no servers.
7. *Scheduled/recurring jobs?* BullMQ supports delayed jobs and job schedulers (cron-like). Beware running the same schedule from several app instances: register it once.

**Common mistakes**

- Doing slow work inside the request, or awaiting a third-party call inside a DB transaction.
- Non-idempotent handlers (customer gets 2 emails or is charged twice on retry).
- Trusting stale payloads instead of re-reading data by id.
- No retry limit / no backoff (hammering a failing provider); retrying non-retryable errors.
- Never looking at the failed set; no alert on queue depth.
- Running the worker without graceful shutdown (jobs get "stalled" and rerun).
- Redis without persistence (AOF) when jobs must not be lost.

**Revision notes:** producer enqueues after commit; worker is a separate process; at-least-once + idempotent handlers; retries with exponential backoff; deterministic job id for dedupe; outbox for guaranteed enqueue; graceful worker shutdown.

---

## 13. Extension C - Dockerfile + docker-compose `[ADVANCED]`

### Requirements

1. A small, secure production image of the API (multi-stage build, non-root user, no dev dependencies, no secrets inside).
2. One command starts the whole stack locally: MySQL 8.4 (UTC), Redis, a one-shot migration job, the API and the worker.
3. Start-up order is correct: DB healthy -> migrations done -> API/worker start.
4. Containers stop gracefully (our SIGTERM handlers run) and the image has a health check.

### Implementation approach

- **Multi-stage build:** stage 1 installs production dependencies with `npm ci --omit=dev` (reproducible, uses `package-lock.json`); stage 2 copies
  only `node_modules`, `src`, `db` and `scripts`. Copying `package*.json` BEFORE the source lets Docker reuse the cached dependency layer when only code changes.
- **Non-root:** the official Node image has a `node` user; we switch to it.
- **No `.env` in the image** (see `.dockerignore`): configuration arrives as environment variables at run time (12-factor). Compose reads a root `.env` file only
  to substitute `${...}` values.
- **Migrations are a separate one-shot service**, not part of the API start command: with several API replicas you must not run the same migration concurrently.
- The same image runs three roles (`migrate`, `api`, `worker`) with different `command`s.
- `node` runs as PID 1 and handles SIGTERM itself (we wrote the handlers in Stage 1 and Extension B). `stop_grace_period` is longer than our internal 10 s / 15 s hard timeouts.
- Prerequisites: Docker Desktop (or Docker Engine + the compose plugin), a committed `package-lock.json`. Extension C assumes Extensions A and B exist (Redis, worker); if you skipped them, delete the `redis` and `worker`
  services and the `REDIS_URL` line.

### `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1

# ---- stage 1: production dependencies only -------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- stage 2: runtime image ----------------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY db ./db
COPY scripts ./scripts

USER node
EXPOSE 3000

# Uses Node's built-in fetch (no curl in alpine). Only meaningful for the API container.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
```

### `.dockerignore`

```
node_modules
npm-debug.log
.env
.env.*
!.env.example
.git
.github
coverage
tests
vitest.config.js
Dockerfile
docker-compose.yml
.dockerignore
README.md
```

### `docker-compose.yml`

```yaml
# Local / single-host stack. Secrets come from the root .env file (never commit it).
x-app-env: &app-env
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: info
  TRUST_PROXY: "0"
  DB_HOST: db
  DB_PORT: "3306"
  DB_USER: ${DB_USER:-taskapi}
  DB_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD in .env}
  DB_NAME: ${DB_NAME:-task_api}
  JWT_SECRET: ${JWT_SECRET:?Set JWT_SECRET in .env}
  JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-1h}
  CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:5173}
  DOCS_ENABLED: ${DOCS_ENABLED:-true}
  REDIS_URL: redis://redis:6379

services:
  db:
    image: mysql:8.4
    command: ["--default-time-zone=+00:00"]
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:?Set DB_ROOT_PASSWORD in .env}
      MYSQL_DATABASE: ${DB_NAME:-task_api}
      MYSQL_USER: ${DB_USER:-taskapi}
      MYSQL_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD in .env}
    volumes:
      - db-data:/var/lib/mysql
    ports:
      - "127.0.0.1:3307:3306" # optional: connect from the host with a SQL client on port 3307
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p$$MYSQL_ROOT_PASSWORD --silent"]
      interval: 5s
      timeout: 5s
      retries: 20
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"] # AOF: queued jobs survive a restart
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

  migrate:
    build: .
    image: task-api:local
    command: ["node", "scripts/migrate.js"]
    environment: *app-env
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      disable: true
    restart: "no"

  api:
    build: .
    image: task-api:local
    environment: *app-env
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    stop_grace_period: 15s
    restart: unless-stopped

  worker:
    build: .
    image: task-api:local
    command: ["node", "src/worker.js"]
    environment: *app-env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    healthcheck:
      disable: true
    stop_grace_period: 20s
    restart: unless-stopped

volumes:
  db-data:
  redis-data:
```

Add these to the root `.env` (they are only used by compose; the app itself does not read them):

```dotenv
DB_ROOT_PASSWORD=choose-a-root-password
DB_PASSWORD=choose-an-app-password
JWT_SECRET=paste-the-64-hex-characters-generated-earlier
```

### Commands

```bash
docker compose up --build -d
docker compose ps                       # db/redis healthy, migrate exited (0), api healthy, worker running
curl -i http://localhost:3000/health/ready
docker compose logs -f api worker

# create the first admin inside the stack (password: at least 12 characters)
docker compose run --rm -e SEED_ADMIN_EMAIL=admin@example.com -e SEED_ADMIN_PASSWORD=a-long-admin-password api node scripts/seed.js

docker compose stop api                 # watch the log: "shutting down" then a clean exit
docker compose down                     # stop and remove containers (volumes stay)
docker compose down -v                  # ALSO delete the database and Redis data
```

### Acceptance criteria

- [ ] `docker compose up --build -d` brings everything up from an empty machine; `curl localhost:3000/health/ready` returns 200.
- [ ] `docker compose ps` shows the API as `healthy` and the `migrate` container exited with code 0.
- [ ] `docker compose exec api whoami` prints `node` (not root); `docker compose exec api ls -a` shows no `.env`, no `tests/`.
- [ ] `docker images task-api:local` is small (roughly a few hundred MB at most; check and note the number).
- [ ] Change one line in `src/` and rebuild: the `npm ci` layer is reused ("CACHED" in the build output).
- [ ] `docker compose stop api` logs a graceful shutdown (not a SIGKILL after 15 s).
- [ ] Create a task assigned to someone through the containerized API: the `worker` logs the notification.
- [ ] `docker compose down` then `up -d` again: the data is still there (named volume).

### Interview concepts demonstrated

- Image vs container, layers and build cache, multi-stage builds, `.dockerignore`. `[ESSENTIAL]`
- Running as non-root, no secrets in images, configuration via environment. `[ESSENTIAL]`
- Health checks, start-up ordering, one-off migration job. `[ESSENTIAL]`
- Signals and graceful shutdown inside containers (PID 1). `[ADVANCED]`
- Compose networking: services reach each other by service name. `[ESSENTIAL]`

### Extension C interview material

**Concept:** Image = app + uske dependencies ka frozen snapshot (read-only layers). Container = us image ka chalta hua instance.
Compose = multiple containers (API, DB, Redis) ko ek YAML se define aur start karne ka tool.

**Why it matters:** "Mere laptop pe chal raha hai" problem khatam: dev, CI aur server par same Node version aur same dependencies.
Deployment simple ho jaata hai: image build karo, kahin bhi `docker run`.

**Internal working:** Dockerfile ki har instruction ek layer banati hai aur cache hoti hai. `COPY package*.json` + `npm ci` pehle isliye karte hain ki
source code badalne par dependency layer rebuild na ho. Compose ek private network banata hai jisme service name DNS name ban jaata hai
(isliye `DB_HOST=db`, `localhost` nahi: container ke andar `localhost` us container ko hi point karta hai).

**Frontend connection:** Tumne frontend me Vite build ke baad static files nginx container me serve kiye honge, ya Vercel/Netlify use kiya hoga. Backend ke liye
wahi "build once, run anywhere" idea hai. `.dockerignore` bilkul `.gitignore` jaisa hai: `node_modules` aur `.env` image me nahi jaana chahiye.

**Real-world scenario:** CI pipeline har merge par image build karke registry me push karti hai; production server naya tag pull karke container replace karta hai;
problem aaye to purana tag wapas chala do (rollback).

**Interview answer:** "I use a multi-stage Dockerfile: dependencies are installed with npm ci in a separate stage so the layer is cached, and the runtime image only
contains production modules and source, runs as the non-root node user, and carries no secrets. Configuration comes from environment variables at runtime.
Compose runs MySQL, Redis, a one-shot migration job, the API and the worker, with health checks and depends_on conditions so start-up order is deterministic. Containers handle SIGTERM
to shut down gracefully."

**Follow-up questions**

1. *Why `npm ci` instead of `npm install`?* `npm ci` installs exactly what `package-lock.json` says, fails if they disagree, and is faster/cleaner in CI and images.
2. *Why a multi-stage build if we have no compile step?* To keep the final stage free of build caches and tools, and to separate dependency installation (cached) from code copy. With TypeScript you would also build in a stage and ship only `dist`.
3. *Why not run migrations inside the app on start?* With N replicas they race; a failed migration would crash-loop every replica; and you want a clear, separate, reviewable deploy step.
4. *Where do secrets go?* Not in the image or git. Use environment variables injected by the platform from a secret store (Docker/Compose secrets, AWS Secrets Manager/SSM, Kubernetes Secrets, CI secrets). Remember that anyone who can run `docker inspect` sees env vars.
5. *Why not use `latest` tags in production?* They are not reproducible and break rollbacks. Tag with the git SHA (or semantic version) and deploy that exact tag.
6. *Container vs VM?* Containers share the host kernel (light, fast start); VMs include a full OS (stronger isolation, heavier).
7. *Does `depends_on` wait until the DB is ready?* Only with `condition: service_healthy` and a health check. Plain `depends_on` waits for the container to START, not for MySQL to accept connections. Apps should still retry DB connections on boot.
8. *What happens to data when the DB container is removed?* Without a volume it is lost. A named volume persists independently; back it up regularly.

**Common mistakes**

- Copying the whole folder before `npm ci` (no layer caching); forgetting `.dockerignore` (huge context, `.env` leaked into the image).
- Running as root; using `latest`; putting secrets in the Dockerfile `ENV`.
- Using `localhost` as the DB host inside a container.
- Running `npm start` through a shell wrapper that does not forward SIGTERM (use the exec form `CMD ["node", ...]`).
- Exposing the DB port publicly.
- Not setting a health check; assuming `depends_on` waits for readiness.

**Revision notes:** multi-stage + cached dependency layer; non-root; env at runtime; migration as one-shot job; service names are hostnames; exec-form CMD for signals; tag by version, not `latest`; volumes for data.

---

## 14. Extension D - Deployment outline `[ADVANCED]`

This is an outline with the key files, not a full cloud tutorial. Goal: you can describe (and, if you want, perform) a realistic
deployment and answer "how would you deploy and operate this?". Do not claim production experience you do not have; say "I deployed it to a VPS with Docker Compose behind nginx".

### 1. Choose a target

| Option | Good for | Trade-off |
|--------|----------|-----------|
| One Linux VM (EC2, DigitalOcean, Hetzner) + Docker Compose + nginx | Learning, small apps, simplest mental model | You manage OS patches, backups, TLS, scaling |
| VM + PM2 + nginx (no Docker) | Teams already running Node on servers | Environment drift between machines; manual dependency install |
| PaaS (Render, Railway, Fly.io, Heroku-style) | Fast, built-in TLS/deploys | Less control, cost grows, vendor specifics |
| AWS ECS/Fargate + RDS (MySQL) + ElastiCache | Real production on AWS, no servers to patch | More services/IAM to learn, higher cost |
| Kubernetes | Many services, large teams | Big operational overhead; unnecessary for one API |

Recommended learning path: **one VM + Docker Compose + nginx + Let's Encrypt**. For "production", replace the MySQL container with a managed database (for example RDS) so backups, patching and failover are handled for you.

### 2. Target architecture

```
Internet -> DNS (api.example.com) -> nginx :443 (TLS, request id, body limit)
                                       |
                                       v  127.0.0.1:3000
                                   [ api container(s) ] --> MySQL (managed, private network)
                                   [ worker container ] --> Redis (private network)
```

Only nginx is public. The database and Redis accept connections only from the private network / security group.

### 3. Step-by-step outline

1. **Prepare the server:** create a non-root sudo user, SSH keys only (disable password login), firewall allowing only 22 (your IP), 80 and 443, automatic security updates, install Docker + compose plugin and nginx.
2. **DNS:** point an `A` record (for example `api.example.com`) to the server's IP.
3. **Configuration and secrets:** create `/opt/task-api/.env` with `chmod 600`, owned by the deploy user. Real values for `DB_*`, `JWT_SECRET` (new, not your dev one), `CORS_ORIGINS` = your production frontend origin only, `DOCS_ENABLED` as you decide. Never commit it; keep a copy in a password manager or secret store.
4. **Production compose file:** same as Extension C but (a) `image: ghcr.io/YOUR_GITHUB_USER/task-api:${TAG}` instead of `build: .`, (b) API port bound to localhost only: `"127.0.0.1:3000:3000"`, (c) `TRUST_PROXY: "1"` because nginx is one proxy hop, (d) no `db` service if you use a managed database (point `DB_HOST` at it), (e) no published DB/Redis ports.
5. **TLS:** `sudo certbot --nginx -d api.example.com` (Let's Encrypt, renews automatically). Test with `curl -I https://api.example.com/health`.
6. **First start:** `docker compose pull && docker compose run --rm migrate && docker compose up -d`. Create the admin with the seed command from Extension C (never use `--demo` in production).
7. **Verify:** `/health/ready` is 200 over HTTPS; log in with the admin; check `docker compose logs api` shows JSON lines with request ids.
8. **Backups:** managed DB automated snapshots + point-in-time recovery, or a nightly `mysqldump` copied off the server. A backup you never restored is not a backup: do a restore test.
9. **Monitoring:** an external uptime check on `/health/ready`, container restart policy `unless-stopped`, log shipping/rotation (JSON logs to a log service, or at least `docker logs` rotation), alerts on 5xx rate, latency, CPU/memory, disk and failed-job count.

### 4. nginx reverse proxy (`/etc/nginx/sites-available/task-api`)

```nginx
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name api.example.com;

  # certbot fills/updates these two lines
  ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  client_max_body_size 200k;   # app limit is 100kb; reject earlier and cheaper

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Request-Id $request_id;   # nginx id flows into our logs (32 hex chars passes our id check)
    proxy_read_timeout 30s;
  }
}
```

With `TRUST_PROXY=1`, Express takes the client IP from `X-Forwarded-For` (one hop). Rate limiting and logs then see the real client.

### 5. CI: `.github/workflows/ci.yml`

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.4
        env:
          MYSQL_ROOT_PASSWORD: root
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping -h 127.0.0.1 -uroot -proot"
          --health-interval=5s
          --health-timeout=5s
          --health-retries=20
    env:
      TEST_DB_HOST: 127.0.0.1
      TEST_DB_USER: root
      TEST_DB_PASSWORD: root
      TEST_DB_NAME: task_api_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test

  publish:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
```

Every pull request runs the whole test suite against a real MySQL; every merge to `main` publishes an image tagged with the commit SHA (use that SHA as `TAG` when deploying; the registry name must be lowercase).

### 6. Release procedure (what to describe in an interview)

1. CI is green on `main`, image `ghcr.io/.../task-api:<sha>` exists.
2. On the server: set `TAG=<sha>`, `docker compose pull`, run the `migrate` service, then `docker compose up -d` (compose recreates only changed containers).
3. Wait for `/health/ready` to return 200 (a small script polls it for up to 60 s; if it never becomes healthy, roll back).
4. **Rollback:** deploy the previous SHA tag. This is why we never deploy `latest`, and why migrations must be backward compatible (next point).
5. **Backward-compatible migrations (expand / contract):** the old version of the app must still work with the new schema, because during a deploy both versions run for a moment and because rollback must be possible.
   Example "rename column": (1) add the new column, deploy code that writes both, (2) backfill, (3) deploy code that reads the new one, (4) drop the old column in a later release. Never rename or drop in one step.
6. **Zero downtime:** with one container there is a short gap on restart. For none: run two API replicas behind the proxy and replace them one at a time (the readiness check decides when a new replica receives traffic). This needs a shared rate-limit store (see below).

### 7. Alternative: PM2 on a VM (if you prefer no Docker)

`ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: 'task-api',
      script: 'src/server.js',
      exec_mode: 'fork', // our entry is an ES module; fork mode is the safe choice
      node_args: ['--env-file=/opt/task-api/.env'],
      env_production: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      kill_timeout: 12000, // longer than our 10 s graceful-shutdown timeout
    },
    {
      name: 'task-worker',
      script: 'src/worker.js',
      exec_mode: 'fork',
      node_args: ['--env-file=/opt/task-api/.env'],
      env_production: { NODE_ENV: 'production' },
      kill_timeout: 17000,
    },
  ],
};
```

Run: `pm2 start ecosystem.config.cjs --env production`, `pm2 save`, `pm2 startup`. nginx config is identical. Trade-off: you manage Node versions and `npm ci --omit=dev` on the server yourself.

### 8. Things that change when you run more than one instance

- **Rate limiting:** the in-memory store counts per process. Use a shared store (for example the `rate-limit-redis` package with the same `REDIS_URL`) so limits are global.
- **Connection budget:** `instances x DB_POOL_SIZE` must stay below MySQL `max_connections` (minus headroom for migrations, admin tools, the worker).
- **Statelessness:** the API keeps no session state (JWT), so any instance can serve any request. Good. Uploaded files (not built here) would have to go to object storage (S3), not local disk.
- **Cache:** Redis is shared, so cache and invalidation already work across instances.
- **Jobs:** run workers separately; several workers share one queue safely.

### 9. Production readiness checklist

- [ ] HTTPS only; HTTP redirects; HSTS (helmet sets it); certificate auto-renews.
- [ ] Unique strong `JWT_SECRET`; secrets not in git/images; `.env` file permissions 600.
- [ ] DB and Redis not reachable from the internet; least-privilege DB user (no `DROP`/`CREATE` at runtime if you can split the migration user).
- [ ] `CORS_ORIGINS` lists only real frontends; `DOCS_ENABLED` decided on purpose.
- [ ] Backups automated AND a restore test done.
- [ ] Uptime check on `/health/ready`; alerts on error rate, latency, resource usage, failed jobs.
- [ ] Logs are JSON, rotated/shipped, contain request ids, contain no secrets.
- [ ] `TRUST_PROXY` matches the number of proxies; rate limits tuned for real traffic.
- [ ] Rollback tested at least once.
- [ ] Load test done on a staging copy (autocannon or k6) so you know the rough requests-per-second and where it breaks first (usually the DB pool or a missing index).

### Interview concepts demonstrated

- Environments, configuration and secrets management. `[ESSENTIAL]`
- Reverse proxy, TLS termination, `trust proxy`. `[ESSENTIAL]`
- CI (tests on every PR) and delivery of an immutable, versioned artifact. `[ESSENTIAL]`
- Safe database migrations (expand/contract) and rollback. `[ADVANCED]`
- Health checks, monitoring, backups, scaling considerations. `[ESSENTIAL]`

### Extension D interview material

**Concept:** Deployment = code ko aise machine par chalana jahan users access kar sakein: build, configure, run, monitor, aur zarurat par rollback.
Reverse proxy (nginx) = public gate jo HTTPS handle karta hai aur request ko tumhare Node app tak forward karta hai.

**Why it matters:** Junior se mid-level me jump ka ek bada hissa yahi hai: sirf "code likha" nahi, "code chal raha hai, dikhta hai kab toota, aur wapas theek kar sakte hain."

**Internal working:** Client -> nginx (TLS decrypt) -> `proxy_pass` -> Node. nginx `X-Forwarded-For` me asli client IP daalta hai; Express `trust proxy` ke through usko `req.ip` banata hai.
CI har push par tests chalata hai; merge par image banake registry me daalta hai; server us tag ko pull karke run karta hai.

**Frontend connection:** Tumhare React app ka deploy (build -> static host -> CDN) aur ye same pipeline idea hai: build artifact, environment variables (`VITE_API_URL` jaisa), rollback by previous version.
CORS ka production origin wahi hona chahiye jahan frontend host hai; `localhost:5173` production me allowed nahi hona chahiye.

**Real-world scenario:** Black Friday se pehle: 2 API replicas, managed DB with read replica, Redis cache, alerts on p95 latency. Deploy ke baad error rate badhe to automatic/manual rollback previous SHA par.

**Interview answer:** "I containerize the API and worker, run tests against real MySQL in CI on every pull request, and publish an image tagged with the commit SHA on merge. On the server nginx terminates TLS and proxies
to the container; configuration comes from environment variables and secrets are not in the repo or the image. Migrations are backward compatible and run as a separate step, health checks gate traffic,
and rollback means redeploying the previous tag. In production I would use a managed database with automated backups and monitor error rate, latency and queue depth."

**Follow-up questions**

1. *How would you scale this to 10x traffic?* Measure first. Typical order: add missing indexes and fix slow queries, cache hot reads, increase pool/instance counts within the DB connection budget, run more API replicas behind a load balancer (with Redis-backed rate limiting), add read replicas for heavy reads, move slow work to queues.
2. *Blue-green vs rolling vs canary?* Blue-green: run the new version beside the old and switch traffic at once (easy rollback, double capacity). Rolling: replace instances gradually. Canary: send a small percentage of traffic to the new version first.
3. *How do you handle secrets?* Secret manager or platform-injected environment variables, rotated regularly, least privilege, never logged or committed. Rotating `JWT_SECRET` invalidates all tokens (plan for it, or support two keys at once).
4. *What is the difference between liveness and readiness in Kubernetes terms?* Liveness failure restarts the container; readiness failure removes it from load-balancer rotation. We implemented both endpoints for that reason.
5. *What would you monitor first?* The four golden signals: latency, traffic, errors, saturation (CPU/memory, DB connections, queue depth). Plus business-level checks (can a user log in and create a task?).
6. *How do you do a database migration with zero downtime on a big table?* Additive changes first (expand), online schema-change tools for large tables (gh-ost, pt-online-schema-change, or MySQL online DDL where supported), backfill in small batches, then contract later.
7. *Why not SSH in and edit code on the server?* Not reproducible, not reviewed, not rollback-able. Deploy immutable artifacts from CI.

**Common mistakes**

- Deploying from a laptop with uncommitted changes; no rollback plan; deploying `latest`.
- Same `JWT_SECRET`/DB credentials in dev and production.
- DB or Redis exposed to the internet; default passwords.
- Forgetting `trust proxy` (rate limiter sees only nginx's IP) or trusting `X-Forwarded-For` with no proxy at all (clients can spoof it).
- Destructive migrations (drop/rename) in the same release as the code change.
- No backups, or backups never restored.
- No alerting: finding out about outages from users.

**Revision notes:** one VM + compose + nginx is a valid first deployment; TLS at the proxy; env/secrets outside git; CI tests on PR, image tagged by SHA; migrations backward compatible; health checks + monitoring + backups; rollback = previous tag; multi-instance needs shared rate-limit store and a connection budget.

---

## 15. How to explain this project in an interview

### 15.1 Ground rules (read this first)

- **You must be able to explain every file.** An interviewer will pick a random file and ask "why is this here?" or "change this live". If you cannot explain a line, you do not own it yet.
  Re-type the parts you cannot explain, then explain them aloud to a wall (or record yourself).
- **Be honest about scope and about how you built it.** Say "personal project / portfolio project", not "production system". If you used AI tools or tutorials, say you used them as a pair-programmer and
  that you reviewed, tested and can modify every part. Interviewers value honesty and the ability to reason far more than a claim you cannot defend.
- **Lead with the problem and the decisions, not the file list.** "I chose X over Y because Z" is the sentence interviewers listen for.
- **Know the weak spots before they do.** Section 15.6 and 16 list the limits. Naming a limitation and the fix is a strength, not a weakness.
- **Never invent numbers.** Use your own: number of endpoints (15), number of tests (run `npm test` and read the count), response times you actually measured.

### 15.2 The 30-second pitch (memorize the shape, not the words)

"I built a Task Management REST API with Node.js 22, Express 5 and MySQL. It has JWT authentication with three roles, so members only see their own tasks while managers can assign and bulk-update.
Writes that touch several rows, like reassigning a leaving colleague's tasks, run in database transactions with row locking, and every change is recorded in an audit table in the same transaction.
It is covered by unit and integration tests against a real MySQL, uses structured logging with request ids, and I added Redis caching, a BullMQ worker and Docker as extensions."

### 15.3 The 2-minute walkthrough (structure)

1. **Problem and scope (10 s):** small team task tracking; who uses it; roles.
2. **Stack and why (15 s):** Express 5 (async errors built in), raw SQL with mysql2 to show SQL skill, zod for validation, Vitest + Supertest.
3. **Architecture (25 s):** draw the layer diagram (15.4). "Controllers know HTTP, services know business rules and transactions, repositories know SQL. One error handler produces one error shape."
4. **Three highlights (45 s)** - pick the ones that match the interviewer's role:
   - Security: bcrypt, JWT with pinned algorithm, RBAC plus ownership checks, 404 instead of 403 for other people's tasks, strict schemas against mass assignment, parameterized SQL, whitelisted sort fields, rate limiting, helmet, CORS allowlist.
   - Data integrity: foreign keys, constraints, `withTransaction`, `SELECT ... FOR UPDATE` in id order, deadlock retry, audit events committed atomically.
   - Quality: unit + integration tests, negative tests, a rollback test proving no partial writes and no leaked connections.
5. **Operations (15 s):** health/readiness probes, graceful shutdown, JSON logs with correlation id, Docker, CI.
6. **What I would do next (10 s):** refresh tokens, idempotency keys, outbox for notifications, keyset pagination, Redis-backed rate limiter.

### 15.4 Whiteboard: the request lifecycle (draw this, then walk through `PATCH /tasks/17`)

```
Client
  |  PATCH /api/v1/tasks/17   Authorization: Bearer <jwt>
  v
nginx (TLS, X-Request-Id) -> Express app
  1. http-logger        assigns/echoes request id, logs on finish
  2. helmet + CORS      headers, preflight
  3. rate limiter       per-IP counter -> 429 if exceeded
  4. express.json       parse body (100kb cap) -> 400/413 on bad body
  5. router /tasks      authenticate (verify JWT, load user, 401)
  6.                    validate(params + body with zod, 400)
  7. controller         req -> service call, response status/shape
  8. service            RBAC + ownership, BEGIN
  9. repository         SELECT ... FOR UPDATE, UPDATE, INSERT event
 10. service            COMMIT, then after-commit hook (cache invalidate, enqueue job)
 11. controller         200 { data: task }
Any throw -> error handler -> { error: { code, message, details?, requestId } }
```

### 15.5 "If they ask about X, go to Y" map

| Interviewer asks about | Go to | Key sentence |
|------------------------|-------|--------------|
| REST design, status codes | Stage 2 | "201 with Location, 204 on delete, 400 vs 422, one error envelope" |
| Express middleware order | Stage 6 `app.js` | "Logger first, then security, cheap rate-limit before body parsing, error handler last" |
| SQL, joins, indexes | Stage 3 migration, Stage 5 `task-query.js` | "Each index serves a query; LEFT JOIN for the optional assignee; verified with EXPLAIN" |
| Transactions, concurrency | Stage 5 | "FOR UPDATE in id order, retry on deadlock, side effects after commit" |
| Auth and security | Stage 4, Stage 6 | "Authn vs authz, bcrypt, pinned JWT algorithm, IDOR prevention, rate limits" |
| Testing | Stage 6 | "Unit for pure logic, integration on real MySQL, negative tests, rollback test" |
| Performance, caching | Extension A | "Cache-aside, version key for lists, authorize after cache, fail open" |
| Async processing | Extension B | "Queue after commit, retries with backoff, idempotent handlers, outbox for guarantees" |
| DevOps | Extensions C, D | "Multi-stage image, non-root, health checks, CI, immutable tags, rollback" |

### 15.6 Design decisions and honest trade-offs

| Decision | Why | Trade-off / what I would change |
|----------|-----|---------------------------------|
| Raw SQL, no ORM | Shows SQL understanding, explicit queries and locks | More mapping code; for a larger team use a query builder/ORM with migrations |
| Offset pagination + COUNT | Simple, page jumps | Slow for deep pages; keyset for feeds/huge tables |
| `authenticate` loads the user every request | Role change and deactivation apply immediately | One extra PK lookup; cache it with short TTL + invalidation if needed |
| Access token only (no refresh token) | Keeps scope manageable | Real apps need refresh tokens with rotation and revocation |
| 404 for tasks you cannot see | No resource-existence leak | Slightly harder client-side debugging |
| Pessimistic locking (`FOR UPDATE`) | Conflicts are plausible, transactions are short | Optimistic locking with a version column for low-conflict, long edits |
| Audit events in the same transaction | No change without a record | Events deleted with the task (cascade); soft delete if you must keep history |
| In-memory rate limiter | Zero dependencies | Per process; Redis store for multiple instances |
| Hand-written OpenAPI + guard test | Full control, no extra library | Can still drift on field details; generate from zod for big APIs |
| Jobs enqueued after commit | No phantom jobs for rolled-back changes | Crash between commit and enqueue loses a job; use the outbox pattern |
| `bcryptjs` (pure JS) | No native build issues | Slower than native `bcrypt` or `argon2`; use native/argon2 in production |
| Hard delete of tasks | Simple | Soft delete (`deleted_at`) for recoverability |

### 15.7 Stories worth telling (only if they really happened to you)

Interviewers love "I hit a problem, found the cause, fixed it, and learned X". This project is designed to surface real ones. Keep a short log while building (date, symptom, cause, fix) and
use your own entries. Typical ones you will likely meet:

- **Express 5: `req.query` is read-only.** Symptom: the first validation middleware that assigns `req.query = parsed` does nothing or throws. Cause: it became a getter in Express 5. Fix: store parsed values in `req.validated`.
- **`LIMIT ?` fails with prepared statements.** Symptom: `Incorrect arguments to mysqld_stmt_execute` on MySQL 8.0.22+. Cause: `execute()` sends JS numbers as DOUBLE for `LIMIT`/`OFFSET`. Fix: `query()` (client-side escaping) or pass strings.
- **Dates shifted by a day.** Symptom: `dueDate` `2026-12-31` comes back as `2026-12-30T23:00:00Z`. Cause: `DATE` converted to a JavaScript Date in the server's time zone. Fix: `dateStrings: ['DATE']` and run MySQL/Node in UTC.
- **Deadlock under concurrent reassignment.** Symptom: `ER_LOCK_DEADLOCK` (1213) in a load test. Cause: two transactions locking the same rows in different orders. Fix: `ORDER BY id` on locking reads + retry in `withTransaction`.
- **Connection pool exhaustion.** Symptom: requests hang after a few errors. Cause: a path that did not release a connection. Fix: `finally { connection.release() }` in one helper, and a test that fails 8 times in a row.
- **`z.coerce.boolean()`** turned `"false"` into `true` and enabled Swagger in production. Fix: parse literal strings.
- **Tests wiping the dev database.** Cause: tests ran against `.env` values. Fix: separate `_test` database and a hard refusal otherwise.

Format: "Situation, what I saw, how I found the cause (logs / EXPLAIN / reproducing in a test), the fix, and what I do now to avoid it."

### 15.8 Three-minute live demo script

1. `npm run dev` - show the validated config and JSON/pretty logs.
2. Swagger UI (`/docs`): register, log in, click "Authorize".
3. Create a task as a member; try to assign it to someone else (403); show the 404 on a task that is not yours.
4. Switch to the manager token: list with `?status=todo&sort=dueDate&order=asc&page=1&limit=5`, show `meta`.
5. `bulk-status` with one invalid id: 404 and nothing changed; then a valid call; show `GET /tasks/:id/events`.
6. Show the code path of that bulk call: route -> `authorize` -> `validate` -> service transaction -> repository `FOR UPDATE`.
7. Run `npm test` and point at the rollback test.
8. (Optional) `docker compose up`, create an assigned task, show the worker log.

### 15.9 Live-coding follow-ups (practice them)

Interviewers often say "add a small feature to your project". Worked example first, then drills.

#### Worked example: `GET /api/v1/tasks/stats` (count tasks per status, respecting visibility)

Route order matters: `/stats` must be registered BEFORE `/:id`, otherwise `stats` is parsed as an id and fails validation with a 400.

Repository (append to `tasks.repository.js`):

```js
// Returns { todo: 3, done: 1 } (only statuses that exist). Same WHERE builder as the list, so filters/visibility stay consistent.
export async function countByStatus(filters, executor = pool) {
  const { whereSql, params } = buildWhere(filters);
  const [rows] = await executor.query(
    `SELECT t.status, COUNT(*) AS total FROM tasks t ${whereSql} GROUP BY t.status`,
    params,
  );
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.total)]));
}
```

Service (append to `tasks.service.js`; also add `TASK_STATUSES` to the import from `./tasks.schemas.js`, written as a new line `import { TASK_STATUSES } from './tasks.schemas.js';`):

```js
export async function getTaskStats(actor) {
  const filters = isPrivileged(actor) ? {} : { visibleTo: actor.id };
  const counts = await tasksRepo.countByStatus(filters);
  return Object.fromEntries(TASK_STATUSES.map((status) => [status, counts[status] ?? 0])); // fill missing with 0
}
```

Controller (append):

```js
export async function stats(req, res) {
  const data = await tasksService.getTaskStats(req.user);
  res.json({ data });
}
```

Route (add right after the `reassign` route, before `/:id`):

```js
tasksRouter.get('/stats', controller.stats);
```

Test (add to `tests/integration/tasks.test.js`, inside the file's existing `describe` structure as a new `describe`):

```js
describe('GET /api/v1/tasks/stats', () => {
  it('counts tasks per status within the viewer scope', async () => {
    await insertTask({ status: 'todo', assigneeId: actors.member.id });
    await insertTask({ status: 'todo', assigneeId: actors.other.id });
    await insertTask({ status: 'done', assigneeId: actors.member.id });

    const manager = await request(app).get('/api/v1/tasks/stats').set(auth(actors.manager.token));
    const member = await request(app).get('/api/v1/tasks/stats').set(auth(actors.member.token));

    expect(manager.body.data).toEqual({ todo: 2, in_progress: 0, done: 1, cancelled: 0 });
    expect(member.body.data).toEqual({ todo: 1, in_progress: 0, done: 1, cancelled: 0 });
  });
});
```

Also add it to `openapi.js` (path `/api/v1/tasks/stats`) and to `EXPECTED_OPERATIONS` in `openapi.test.js`, or that test fails: this is the "docs drift guard" doing its job.

#### Drills (try each in 20-30 minutes; think about the approach first)

1. **Soft delete:** add `deleted_at TIMESTAMP NULL` (new migration `002_...sql`), change `remove` to set it, add `t.deleted_at IS NULL` to `buildWhere`/`findById`, keep events.
   Think: what happens to the unique/index choices, and to "restore"?
2. **Optimistic locking:** add `version INT NOT NULL DEFAULT 1`; `PATCH` requires the current version (`If-Match` header or body field); `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`; zero rows -> 409. Compare with the `FOR UPDATE` approach.
3. **Idempotency key for `POST /tasks`:** table `idempotency_keys(user_id, idem_key, request_hash, response_status, response_body, created_at, PRIMARY KEY (user_id, idem_key))`.
   Flow: insert the key first (unique constraint decides the winner); same key + same body -> replay stored response; same key + different body -> 422; concurrent duplicates -> second waits/409; expire old keys.
4. **Comments on tasks:** new table with FK to tasks and users, `POST/GET /tasks/:id/comments`, visibility = same as the task, pagination, event `commented`.
5. **Keyset pagination** for `GET /tasks?cursor=`: encode `(created_at, id)` as base64 JSON; `WHERE (t.created_at < ? OR (t.created_at = ? AND t.id < ?))` (createdAt passed twice; avoid the row-constructor form, MySQL 8 does not seek an index with it); return `nextCursor`; discuss why `COUNT` disappears.
6. **Refresh tokens:** table `refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, replaced_by)`, `POST /auth/refresh` with rotation and reuse detection, `POST /auth/logout` revokes.
7. **Redis-backed rate limiter** using `rate-limit-redis` so the limit is shared by all instances.
8. **Task due-date reminder:** BullMQ job scheduler that runs daily and enqueues a "due tomorrow" notification per assignee (query with `dueBefore`/status, group by assignee).

### 15.10 Self-quiz: can you explain these in 60 seconds each?

- [ ] Why `createApp()` does not call `listen()`
- [ ] What `validate` does and why `req.validated` exists (Express 5)
- [ ] The difference between 400, 401, 403, 404, 409, 422 in this API
- [ ] How the error handler decides between a 4xx and a generic 500
- [ ] Why `strictObject` (mass assignment)
- [ ] How bcrypt works at a high level (salt, cost) and why not SHA-256
- [ ] JWT structure, what the signature protects, why the algorithm is pinned
- [ ] Why `authenticate` hits the DB and what you would change to avoid it
- [ ] How a member is prevented from reading someone else's task (and why 404)
- [ ] What `withTransaction` guarantees and the three things it always does
- [ ] What `FOR UPDATE` locks, and why `ORDER BY id`
- [ ] What a deadlock is, how you reduce and handle it
- [ ] Why side effects go after commit, and the outbox pattern
- [ ] Why the sort field is whitelisted and the id tie-breaker
- [ ] Offset vs keyset pagination
- [ ] Which index serves which query (and one `EXPLAIN` you ran)
- [ ] Pool size vs `max_connections` with several instances
- [ ] Liveness vs readiness
- [ ] What graceful shutdown does, step by step
- [ ] Unit vs integration tests here, and what the rollback test proves
- [ ] helmet vs CORS vs rate limiting: what each does and does not protect
- [ ] Cache-aside and why authorization runs after the cache
- [ ] At-least-once delivery and idempotent job handlers
- [ ] Why the Docker image is multi-stage, non-root and has no `.env`
- [ ] How you would roll back a bad deployment

---

## 16. Project-level interview Q&A

These are questions about the project as a whole. (Topic-level questions live in the question banks, see section 17.) Each answer is written to be spoken in about 30-60 seconds.

**Q1. Walk me through what happens when a client sends `PATCH /api/v1/tasks/17`. [ESSENTIAL, Basic-Intermediate]**

**Interview answer:** "The request first gets a correlation id and a log context, then helmet and CORS headers, the rate limiter, and the JSON body parser with a size limit. The tasks router runs `authenticate`, which verifies the JWT signature and expiry and loads the user, so a deactivated account is rejected. Then `validate` parses the id and the body with zod and rejects unknown fields. The controller calls the service, which opens a transaction, locks the task row with `SELECT ... FOR UPDATE`, checks the user may see it, validates the status transition, writes the change and an audit event, and commits. After the commit, a hook invalidates the cache and may enqueue a notification. Any error along the way goes to one error handler that returns a uniform JSON error with the request id."

*Hinglish:* Poora flow bolo: middleware chain -> auth -> validation -> service (transaction) -> repository -> response ya error handler.

**Q2. Why did you separate controller, service and repository? [ESSENTIAL, Basic]**

**Interview answer:** "Each layer has one reason to change. Controllers translate HTTP to function calls, services hold business rules, authorization and transactions, and repositories own the SQL. That lets me test rules without HTTP, swap storage (I started with an in-memory repository and moved to MySQL without touching the service), and keeps SQL in one place for review and optimization."

**Q3. How do you prevent SQL injection here? [ESSENTIAL, Basic]**

**Interview answer:** "In layers. Every value goes through `?` placeholders, never string concatenation. Identifiers that must be dynamic, like the sort column and the updatable columns, come from fixed whitelists and are never taken from input. Input is validated with strict zod schemas first, so values are primitives of the expected type (which also blocks the object-expansion trick in the MySQL driver, and I enabled `stringifyObjects` as a second guard). The migration connection is the only place with `multipleStatements`, and the app pool does not allow stacked queries. The database user has only the privileges it needs."

**Q4. What happens if two managers reassign the same user's tasks at the same time? [ESSENTIAL, Intermediate-Advanced]**

**Interview answer:** "Both transactions try to lock the user's open tasks with `FOR UPDATE ORDER BY id`. The second one waits until the first commits. After that, it reads the current state: the tasks no longer belong to that user, so it finds nothing to move and returns `reassigned: 0`. Because both lock rows in the same order, they cannot deadlock on those rows; if MySQL still reports a deadlock or lock timeout, `withTransaction` retries with a short backoff. The audit events are written in the same transaction, so history stays consistent."

**Q5. What does the API do when the database is down? [ESSENTIAL, Intermediate]**

**Interview answer:** "Liveness stays green because the process is alive, but readiness returns 503 so the load balancer stops sending traffic. Requests that need the database fail in the pool with an error that is not an `AppError`, so the error handler logs it with the request id and returns a generic 500 without internal details. The pool has a bounded queue so waiting requests do not pile up in memory forever. When the DB comes back the pool reconnects on its own. Optional pieces such as Redis are designed to fail open."

**Q6. Why JWT instead of server-side sessions? [ESSENTIAL, Intermediate]**

**Interview answer:** "JWT keeps the API stateless: any instance can verify a token with the shared secret, which suits horizontal scaling and mobile or SPA clients. The costs are that you cannot revoke a token before it expires and that the payload is readable. I mitigate with short expiry, a per-request user lookup so deactivation and role changes apply immediately, and I would add refresh-token rotation for long sessions. Server-side sessions give instant revocation and smaller tokens but need a shared session store (Redis) and are more natural for same-site browser apps with cookies."

**Q7. How would you add refresh tokens? [ESSENTIAL, Intermediate]**

**Interview answer:** "Keep the access token short (5-15 minutes). On login also create a random refresh token, store only its hash with the user id and expiry in a table, and send it in an httpOnly, Secure, SameSite cookie. `POST /auth/refresh` checks the hash, issues a new access token and rotates the refresh token (the old one is marked as replaced). If an already-used refresh token appears again, treat it as theft and revoke that whole token family. Logout revokes the current refresh token. Password changes and role changes can revoke all of a user's tokens."

**Q8. How would you make `POST /tasks` idempotent? [ESSENTIAL, Intermediate-Advanced]**

**Interview answer:** "The client sends an `Idempotency-Key` header. The server stores `(user, key, request hash)` with a unique constraint before doing the work. If the same key and same body arrive again, return the stored response; if the key is reused with a different body, return 422; a concurrent duplicate either waits or gets 409. Keys expire after a day or so. This protects against client retries after timeouts and double-clicks, and the same idea is mandatory for payment endpoints."

**Q9. What would you improve first, and why? [ESSENTIAL, Basic-Intermediate]**

**Interview answer:** "First, refresh tokens and token revocation, because the access-token-only model is the biggest gap for real users. Second, an outbox table for notifications, so a crash between commit and enqueue cannot lose a message. Third, keyset pagination and a FULLTEXT index for search, because offset pagination and `LIKE '%q%'` do not scale. Fourth, a Redis-backed rate limiter and metrics (Prometheus) for multi-instance operation. I would decide the order by measuring: error rates and slow-query logs, not guesses."

**Q10. How do you debug a slow endpoint in this codebase? [ESSENTIAL, Intermediate]**

**Interview answer:** "Start with the request log: `responseTime` and the request id tell me which route and how slow. Then I reproduce with the same query parameters and run `EXPLAIN` on the generated SQL to check index use, row estimates and filesorts. I check pool wait time and connection counts, N+1 patterns, and the MySQL slow query log. In this API the likely suspects are the `LIKE '%q%'` search (cannot use an index), deep offsets, and a missing composite index for a new filter. Fixes: add or adjust an index, switch to keyset pagination or FULLTEXT, cache, or move work to a job. Then I re-measure, ideally with a load test."

**Q11. What did you test, and what did you not? [ESSENTIAL, Basic]**

**Interview answer:** "I tested pure logic in unit tests (query builder, policy, error mapping, transaction retry), and the whole HTTP surface in integration tests against a real MySQL: auth, RBAC, validation and negative cases, pagination/filter/sort, bulk operations, rollback behaviour, and security headers and rate limiting. I did not write true concurrency tests for the locking, load tests, or end-to-end tests with a browser, and the Redis and queue paths are tested with fakes rather than real Redis. I would add a two-parallel-request test for the lock and a small k6 or autocannon run."

**Q12. How would you add multi-tenancy (organizations)? [ADVANCED, Advanced]**

**Interview answer:** "Add an `organizations` table and an `org_id` to users and every business table, put it in the JWT or load it with the user, and make every query and every policy check include it, ideally through one helper so nobody forgets. Indexes become composite with `org_id` first. Unique constraints become per organization (for example `UNIQUE(org_id, name)`). Tests must prove that tenant A can never read or change tenant B's rows. For stricter isolation use a schema or database per tenant, at the price of operational complexity."

**Q13. How would you add file attachments? [ADVANCED, Intermediate]**

**Interview answer:** "I would not stream files through the API. The client asks the API for a pre-signed upload URL to object storage (S3), after the API checks permission, size and content type. The client uploads directly; the API stores metadata (key, size, type, task id, uploader). Downloads also use short-lived signed URLs. Virus scanning and thumbnailing run as background jobs. This keeps the API stateless and cheap."

**Q14. How would you push live updates to the browser? [ADVANCED, Intermediate]**

**Interview answer:** "Server-Sent Events are enough for one-way updates like 'task changed', WebSockets if the client also sends frequent messages. With more than one API instance, instances need a shared channel: Redis pub/sub (or a queue) so that an event handled by instance A reaches clients connected to instance B. Authentication happens at connect time with the same token, and every event is filtered by the same visibility rules as the REST API."

**Q15. Why 404 instead of 403 for another user's task? [ESSENTIAL, Basic]**

**Interview answer:** "A 403 confirms the resource exists, which lets an attacker enumerate ids. Returning the same 404 for 'missing' and 'not yours' leaks nothing. The exception is when the resource is not secret and the user needs to know why, for example a role-protected action like deleting a task, where 403 is the honest answer."

**Q16. How do you handle time zones and dates? [ESSENTIAL, Intermediate]**

**Interview answer:** "Everything is stored and transmitted in UTC. `TIMESTAMP` columns are timezone-aware in MySQL, the pool is configured with `timezone: 'Z'`, and the database server runs in UTC. Due dates are calendar dates without time (`DATE`), returned as plain `YYYY-MM-DD` strings so no time zone conversion can shift them by a day. The client converts timestamps to the user's local zone for display."

**Q17. Where could N+1 queries appear, and how did you avoid them? [ESSENTIAL, Intermediate]**

**Interview answer:** "Listing tasks with their assignee names is the classic case: one query for tasks and one per task for the user. I use a single `LEFT JOIN`. Bulk operations use `WHERE id IN (...)` and one multi-row insert for audit events instead of a loop of single statements. In general I look at the number of queries per request in the logs, and I use joins or batched `IN` queries for related data."

**Q18. Why do you write the audit event in the same transaction as the change? [ESSENTIAL, Basic-Intermediate]**

**Interview answer:** "So the two can never disagree. If the audit insert fails, the change rolls back, and if the change fails there is no phantom event. Writing it afterwards would leave windows where a crash produces a change without history. The same reasoning is why external side effects are done after commit, and why I would use an outbox for guaranteed delivery."

**Q19. What does graceful shutdown do in your app? [ESSENTIAL, Basic]**

**Interview answer:** "On SIGTERM the server stops accepting new connections and closes idle keep-alive sockets, in-flight requests finish, then the database pool (and Redis and queue connections) are closed, and the process exits with code 0. A timer forces exit after 10 seconds so a stuck request cannot block a deployment. The worker does the same: it stops taking jobs, lets active ones finish, then closes."

**Q20. Is this a monolith? Would you split it into microservices? [ESSENTIAL, Intermediate]**

**Interview answer:** "It is a modular monolith: one deployable with clear module boundaries (auth, users, tasks). For this size that is the right choice: one database transaction can cover several rows, no network calls between modules, simple deploys. I would split a part out only for a concrete reason such as very different scaling needs, a separate team owning it, or isolation of failures, and I would start with the worker (already a separate process), not with the core domain."

---

## 17. Final checklist and honest readiness notes

### 17.1 Project completion checklist

**Stage 1-2**
- [ ] `createApp()` and `server.js` are separate; env validated; graceful shutdown works
- [ ] CRUD with zod validation; unknown fields rejected; one JSON error shape; JSON 404

**Stage 3-4**
- [ ] Migration applied; FKs, unique email, indexes; `EXPLAIN` checked for one query
- [ ] bcrypt hashes in DB; login returns the same error for unknown email and wrong password
- [ ] RBAC matrix from section 2.4 verified by hand AND by tests

**Stage 5**
- [ ] Pagination/filter/sort with `meta`; sort whitelist; id tie-breaker
- [ ] Bulk status and reassign are all-or-nothing; audit events committed with the change

**Stage 6-7**
- [ ] `npm test` green; negative tests and rollback test present
- [ ] Request ids in logs, header and error body; no secrets in logs
- [ ] `/docs` works; README lets someone else run it; `.env.example` complete

**Extensions (optional)**
- [ ] A: Redis cache + invalidation, API fine without Redis
- [ ] B: worker processes jobs; retries visible; graceful stop
- [ ] C: `docker compose up` brings up everything from scratch
- [ ] D: you can draw the deployment diagram and explain rollback and migrations

### 17.2 What this project proves, and what it does not

**It shows:** REST design, layered architecture, SQL and transactions, authentication and authorization, validation, error handling, testing with a real database, logging, baseline security,
and (with extensions) caching, queues and containers.

**It does not show:** production traffic experience, refresh-token flows, payment/idempotency flows, observability with metrics and tracing, multi-region or large-scale operations, a frontend, or team workflow.
Say so. Then say how you would close each gap (section 15.9 drills). Eight weeks do not make you senior; they make you a credible junior-to-mid candidate who understands the fundamentals and can learn the rest.

### 17.3 If you are short on time (priority order)

1. Stage 1-4 fully (you can explain a secure CRUD API end to end)
2. Stage 5 transactions (the strongest differentiator for backend interviews)
3. Stage 6 tests (at least auth, RBAC and one rollback test)
4. Stage 7 README (30 minutes, high value)
5. Extension C (Docker is asked often), then A, then B, then D (outline only)

### 17.4 Where to revise the theory (cross-references)

| Project part | Revise in |
|--------------|-----------|
| Stage 1-2 (Express, REST, middleware, errors, validation) | `03_Week3_Express_REST.md` |
| Stage 3 (MySQL, indexes, pool) | `04_Week4_MySQL.md`, `05_Week5_Data_Auth_Security.md` (Day 1) |
| Stage 4 (auth, JWT, RBAC, security) | `05_Week5_Data_Auth_Security.md` |
| Stage 5 (transactions, locking, pagination) | `04_Week4_MySQL.md` (Day 4-6), `05_Week5_Data_Auth_Security.md` |
| Stage 6 (testing, logging, security middleware, rate limit) | `06_Week6_Testing_Production.md` |
| Extension A, B (Redis, queues, graceful shutdown) | `06_Week6_Testing_Production.md` (Day 4-5) |
| Extension C, D, scaling questions | `07_Week7_System_Design.md` (Day 1, Day 6) |
| Interview practice | `08_Week8_Revision_Mocks_Checklist.md`, `09_Question_Bank_A.md`, `10_Question_Bank_B.md`, `11_Coding_Exercises.md` (EX-EXP, EX-MW, EX-TXN, EX-JWT, EX-TEST, EX-IDEM series) |

### 17.5 Known simplifications in this project (so you are not surprised)

- Access-token-only authentication; no password reset, email verification or account lockout beyond rate limiting.
- Offset pagination and `LIKE` search are fine for thousands of rows, not millions.
- Hard delete (audit events cascade away with the task).
- The in-memory rate limiter is per process.
- Notifications are simulated by log lines; a real provider call would go where the worker logs.
- OpenAPI is hand-written; field-level details can drift despite the guard test.
- `bcryptjs` is chosen for portability; production systems usually prefer native `bcrypt` or `argon2`.

End of Part 12.
