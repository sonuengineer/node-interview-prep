# 17 - Capstone: Payments and Orders Backend

> Part 17 of the Node.js Backend Interview Preparation set. This is the "ONE serious project" of the
> roadmap (Days 85-88 block), written as a staged build you can type, run and defend in an interview.
> Everything in this file was built and executed on this machine; real outputs are pasted, and the last
> section lists what was NOT verified.

**Where this fits**

| Item | Value |
|------|-------|
| Roadmap | Phase "Build ONE serious project" (Days 85-88), and the production/chaos block (Days 71-84) applied to a real codebase |
| Roadmap's own reality check | "4 days is not enough; 6-8 weeks" -- this file is the 6-8 week project compressed into a guided build of roughly 25-35 focused hours |
| Builds on | `12_Project_Task_API.md` (same conventions: ESM, zod, pino, Vitest + Supertest, `createApp()` factory), Week 4 (transactions, locking), Week 5 (auth, RBAC), Week 6 / Day 3 (idempotency, retries), Day 4 (Redis), Day 5 (queues), Week 7 / Day 4 (payment workflows) |
| Feeds into | `16_Chaos_Lab.md` (break this system), `19_Concurrency_Distributed_Systems.md`, Week 8 project-explanation questions |
| Tiers | Everything here is `[ADVANCED]` relative to the Task API, but the idempotency + outbox + webhook-dedupe trio is `[ESSENTIAL]` for any payments/fintech interview |

Honest note: this does not make you a senior engineer. It gives you ONE system where every
"senior-sounding" word (idempotency, outbox, at-least-once, reconciliation, backpressure, bulkhead) maps to
code you wrote, ran, broke and fixed. That is what interviewers can actually probe.

**Contents of this file**

0. Overview, domain, architecture, folder tree, how to run everything (this section)
1. Stage 0 - ADRs (decisions written BEFORE code)
2. Stage 1 - Scaffold: config, logging, errors, DB/Redis, health
3. Stage 2 - Domain model and schema
4. Stage 3 - Auth + RBAC + orders
5. Stage 4 - Idempotent `POST /payments`
6. Stage 5 - The fake payment provider
7. Stage 6 - Transactional outbox, relay, BullMQ worker, retries, backoff + jitter, DLQ
8. Stage 7 - Signed webhooks, settlement state machine, double-entry ledger
9. Stage 8 - Caching, rate limiting, keyset pagination
10. Stage 9 - Reconciliation job
11. Stage 10 - Observability: structured logs, correlation ids, 3 metrics
12. Stage 11 - Tests (including the 50-duplicate-request test) and a mutation check
13. Stage 12 - Docker Compose one-command run, smoke test, load test and its result
14. How to explain this project in an interview
15. Interview Q&A (20 questions + 2 bonus)
16. Limitations, what I would build next
17. Summary, assessment, hours estimate, "Not verified"

(The study dashboard builds its checklist from the `## ` headings, so every stage below is one unit.)

## 0. Overview, architecture, folder tree, how to run

**Learning objectives**

- Explain, with your own code, how a payment API stays correct when clients retry, networks fail, queues
  redeliver and third parties send duplicate or lost callbacks.
- Be able to draw the architecture and the payment lifecycle from memory.
- Know exactly which test proves which guarantee.

### 0.1 What you are building

A small but production-shaped backend where customers register, create **orders**, and pay for them
through an external **payment provider** (a fake one we also build). Money movement is recorded in a
**double-entry ledger**. Admins can inspect the ledger, run **reconciliation**, and manage failed jobs.

What the roadmap says a serious project must demonstrate, and where it lives here:

| Roadmap requirement | Where |
|---------------------|-------|
| Clear domain model + well-designed relational schema | Stage 2 (9 tables, constraints, generated column, double-entry) |
| Real auth + authorization with RBAC | Stage 3 (JWT, bcrypt, roles customer/admin, ownership checks) |
| Idempotency on the critical write path + at-least-once-safe consumers | Stage 4 (payments), Stage 6 (queue consumers), Stage 7 (webhooks) |
| Background worker with retries, backoff, DLQ | Stage 6 |
| Caching with explicit invalidation | Stage 8 |
| Rate limiting and pagination | Stage 8 |
| Unit + integration tests, CI-ready | Stage 11 (44 tests; `npm test` is the CI command) |
| Dockerized, one-command run | Stage 12 (`docker compose up --build`) |
| Observability: structured logs, a few metrics, a trace | Stage 10 (pino + request id carried through the queue = a poor man's trace, 3 metrics) |
| ADR set | Stage 0 (7 ADRs) |
| README that sells it + load/chaos result | Stage 12 + "How to explain" section; load test result with calibration |

### 0.2 Architecture

```text
                       +-------------------+
   Client (React/mobile)|   API  :3017      |  Express 5: auth, orders, payments, webhooks, admin, /metrics
   --------HTTP-------> |  (stateless)      |
                       +----+---------+----+
                            |         |
            SQL (tx, locks) |         | cache, rate limit (Redis)
                            v         v
                       +--------+  +--------+
                       | MySQL 8|  | Redis  |<-----------------------------+
                       +---+----+  +---+----+                              |
        outbox rows (same  |           | BullMQ queues: payments, events,  |
        tx as the payment) |           | payments-dlq, maintenance         |
                            v           v                                  |
                       +-------------------------+   POST /charges         |
                       | WORKER                  |   Idempotency-Key       |
                       |  relay: outbox -> queue |------------------+      |
                       |  charge job (retries)   |                  v      |
                       |  event job (notify)     |            +-------------+----+
                       |  reconcile (scheduled)  |            | PROVIDER :4017   |
                       +-------------------------+            | (fake PSP)       |
                                  ^                           +--------+---------+
                                  |                                    |
                                  |        signed webhook (HMAC + ts)  |
                                  +---- API POST /webhooks/provider <--+
```

Three processes, one image (`api`, `worker`, `provider`), plus MySQL and Redis.

### 0.3 The payment lifecycle (memorise this)

```text
 1. POST /payments  (Idempotency-Key: K, body {orderId})
      one MySQL transaction:
        claim key K  ->  lock order  ->  check order is payable  ->  INSERT payment(pending)
        ->  INSERT outbox_event(payment.created)  ->  store response under K  ->  COMMIT
      answer 202 {payment: pending}                     (a retry with key K replays this answer)
 2. worker relay: reads pending outbox row -> BullMQ job "charge" (jobId = outbox-<id>) -> marks row published
 3. worker "charge" job: re-reads payment; if still pending -> POST provider /charges
      (Idempotency-Key = payment-<id>; 2s timeout; 5xx/timeout => retry with backoff+jitter;
       attempts exhausted => dead-letter queue)         -> payment = processing
 4. provider, later: POST API /webhooks/provider  (signed: HMAC(secret, timestamp.rawBody))
 5. API webhook: verify signature + timestamp -> ONE tx: dedupe event id, lock order+payment,
      state machine pending|processing -> succeeded, order -> paid, outbox(payment.succeeded),
      ledger postings (4 rows, 2 balanced transactions)  -> COMMIT -> delete order cache key
 6. worker "events" job: send notification, deduped by SET NX
 7. scheduled reconciliation: recompute everything from the ledger, flag mismatches,
      repair payments whose webhook was lost by asking the provider
```

Payment state machine (forward only, terminal states never change):

```text
 pending --worker calls provider--> processing --webhook--> succeeded
    |                                    |
    +-------- webhook (fast path) -------+--webhook--> failed   (declined / permanent provider reject)
```

### 0.4 Final folder tree

```text
payments-orders/
|-- db/
|   `-- migrations/
|       `-- 001_init.sql   # all 9 tables
|-- docker/
|   `-- mysql-init.sql   # creates payments_test on first start
|-- docs/
|   `-- adr/   # 7 decision records (Stage 0)
|       |-- 0001-architecture-shape.md
|       |-- 0002-money-and-ledger.md
|       |-- 0003-idempotency.md
|       |-- 0004-async-processing.md
|       |-- 0005-provider-webhooks.md
|       |-- 0006-read-path-and-protection.md
|       `-- 0007-consistency-safety-nets.md
|-- scripts/
|   |-- loadtest.js   # autocannon load test + consistency check
|   |-- migrate.js   # forward-only migration runner
|   |-- seed.js   # idempotent admin seed
|   `-- smoke.mjs   # smoke test of a running stack
|-- src/
|   |-- config/
|   |   `-- env.js   # zod-validated env
|   |-- lib/
|   |   |-- backoff.js   # exponential backoff + full jitter
|   |   |-- cache.js   # Redis cache-aside helpers
|   |   |-- cursor.js   # keyset cursor + paginate()
|   |   |-- db.js   # pools, withTx (deadlock retry), webhook bulkhead pool
|   |   |-- errors.js   # AppError helpers
|   |   |-- hash.js   # stable JSON + request hash
|   |   |-- logger.js   # pino
|   |   |-- metrics.js   # 3 custom Prometheus metrics
|   |   |-- redis.js   # shared ioredis client
|   |   `-- signature.js   # HMAC sign/verify
|   |-- middleware/
|   |   |-- auth.js   # JWT + RBAC
|   |   |-- errorHandler.js   # central error mapping
|   |   `-- rateLimit.js   # Redis Lua fixed-window limiter
|   |-- modules/
|   |   |-- admin/
|   |   |   `-- admin.routes.js   # ledger, accounts, reconcile, DLQ
|   |   |-- auth/
|   |   |   `-- auth.routes.js   # register/login
|   |   |-- ledger/
|   |   |   `-- ledger.service.js   # double-entry posting
|   |   |-- orders/
|   |   |   |-- orders.routes.js   # orders HTTP
|   |   |   `-- orders.service.js   # orders + cache + keyset list
|   |   |-- outbox/
|   |   |   |-- outbox.service.js   # addOutboxEvent()
|   |   |   `-- relay.js   # outbox -> BullMQ relay
|   |   |-- payments/
|   |   |   |-- idempotency.js   # runIdempotent()
|   |   |   |-- payments.routes.js   # POST/GET /payments
|   |   |   |-- payments.service.js   # createPayment(), listing
|   |   |   `-- settlement.js   # the only terminal-state writer
|   |   |-- reconcile/
|   |   |   `-- reconcile.service.js   # invariant checks + repair
|   |   `-- webhooks/
|   |       `-- webhooks.routes.js   # signed webhook endpoint
|   |-- provider/
|   |   |-- client.js   # provider HTTP client (timeouts, error classes)
|   |   |-- provider.app.js   # fake PSP with chaos scenarios
|   |   `-- server.js   # provider entrypoint
|   |-- queue/
|   |   |-- queues.js   # BullMQ queues + backoff strategy
|   |   `-- workers.js   # charge/event/maintenance processors + DLQ hook
|   |-- app.js   # createApp(): middleware + routers (no listen)
|   |-- server.js   # API entrypoint + graceful shutdown
|   `-- worker-main.js   # relay + BullMQ workers + schedule
|-- test/
|   |-- api.test.js   # 16 tests
|   |-- e2e.test.js   # 8 tests
|   |-- helpers.js   # reset DB, users, startStack()
|   |-- unit.test.js   # 9 tests
|   `-- webhooks.test.js   # 11 tests
|-- .dockerignore
|-- .env.example   # config contract (copy to .env)
|-- .gitignore
|-- Dockerfile   # one image for api/worker/provider/migrate
|-- docker-compose.yml   # mysql, redis, migrate, provider, api, worker (+ load profile)
|-- package.json   # dependencies, scripts
`-- vitest.config.js   # test env: payments_test DB, Redis DB 1
```

`package-lock.json` is also committed in the real project (the Docker build uses `npm ci`).

### 0.5 Prerequisites and how to run everything

- Node 20.6+ (tested on Node 20.20.1 on the host and 20.20.2 inside Docker), Docker Desktop.
- Host ports used: MySQL 33066, Redis 63793, API 3017, provider 4017 (all configurable).

**A. Full stack, one command**

```bash
cd payments-orders
docker compose up --build            # mysql, redis, migrate(+seed), provider, api, worker
node scripts/smoke.mjs               # optional: walks the whole flow against http://127.0.0.1:3017
```

**B. Local development (infra in Docker, code on the host)**

```bash
cp .env.example .env
docker compose up -d mysql redis
npm install
npm run migrate && npm run migrate:test && npm run seed
npm run dev:provider    # terminal 1
npm run dev:worker      # terminal 2
npm run dev:api         # terminal 3
npm test                # runs against payments_test database + Redis DB 1
```

**C. Load test (inside the compose network, see Stage 12 for why)**

```bash
PAYMENT_RATE_MAX=1000000 GLOBAL_RATE_MAX=1000000 AUTH_RATE_MAX=1000000 docker compose up -d --build
LOAD_PAYMENTS=500 docker compose --profile load run --rm loadtest
```

Windows note: in PowerShell set variables with `$env:PAYMENT_RATE_MAX = "1000000"` before `docker compose`.

### 0.6 How to read each stage

Every stage has: **Requirements**, **Design decisions**, **Code** (full files), **How it works**,
**Acceptance criteria** (+ real output), **Interview concepts**, **Common mistakes**.

Code honesty note: files are shown in their FINAL form (the form that ran in the tests and the load test).
I built the stages in this order, but a few files were revised later (for example `ledger.service.js` and
`settlement.js` were changed after the Stage 12 load test exposed a deadlock; that story is told in Stage 7
and Stage 12). To run only the first N stages, comment out the `app.use(...)` lines in `src/app.js` for modules
you have not written yet. The per-stage acceptance commands were executed against the finished system.

**Key concepts to remember (section 0)**

- Three processes: API (stateless), worker (async), provider (external). MySQL = truth, Redis = speed + queue.
- A payment is created synchronously but COMPLETED asynchronously (202 + webhook).
- Every boundary (client->API, API->queue, API->provider, provider->API) is retried by someone, so every
  boundary needs its own idempotency answer.

**Revision questions**

1. Why does `POST /payments` return 202 and not 200/201?
2. Which two components can retry the same logical work, and which mechanism makes each retry safe?
3. Why is the provider a separate service instead of a function call?
4. What is the single source of truth for money, and what is merely cached?
5. Draw the state machine and name the only code path allowed to enter a terminal state.

**Practical task:** draw the sequence diagram of section 0.3 on paper with the failure that can happen at each
arrow (timeout, crash, duplicate). You will check it against Stage 6 and Stage 7.

- [ ] I can draw the architecture and lifecycle without looking
- [ ] I know the four host ports and the three processes
- [ ] I ran `docker compose up --build` and `node scripts/smoke.mjs` successfully

---

## Stage 0 - ADRs written first

**Learning objectives**

- Write down the trade-offs BEFORE coding, so the code has a reason to exist and you can defend it.
- Know the vocabulary an interviewer expects: context, decision, consequences, alternatives rejected.

### Requirements

1. One short ADR (architecture decision record) per hard decision. Seven are enough here.
2. Each ADR has: Status, Context/Decision, Consequences (good and bad), Alternatives rejected.
3. The ADRs are files in `docs/adr/`, committed with the code. When reality disagrees with an ADR, you
   AMEND the ADR (ADR 0007 has an "Amendment" written after the load test) instead of silently drifting.

### Why this matters (Hinglish)

Interview mein "why did you do X?" sabse common sawaal hai. ADR ek page hota hai jisme tum pehle se likh
dete ho: kya options the, kya choose kiya, kya kharcha (cost) hai. Code baad mein aata hai, ADR code ko
justify karta hai. Ek ADR ko "stale" mat hone do: load test ya incident ke baad usse update karo.

### The seven ADRs (full text)

The files live in `docs/adr/`. In this document the `#` / `##` headings inside them are shown as bold text
so they do not break this file's own heading structure; the content is identical.

### ADR 0001: Modular monolith, a separate worker process, and a fake provider service

Status: accepted

**Context**
We need an orders + payments backend that shows real engineering (idempotency, queues, webhooks,
ledger) without microservice overhead. One developer, one MySQL, one Redis.

**Decision**
- One codebase, one deployable image, THREE processes started from it: `api` (HTTP), `worker`
  (outbox relay + BullMQ workers + scheduled reconciliation), and `provider` (a separate fake third party).
- Inside the codebase, code is split by module (auth, orders, payments, ledger, outbox, webhooks,
  reconcile). Modules talk through functions and through the outbox, so any of them could be
  extracted later.
- The provider is a SEPARATE service on purpose: the only way to talk to it is HTTP + signed
  webhooks, exactly like a real PSP. That forces us to handle timeouts, duplicates and lost callbacks.
- Stack: Node 20+/Express 5, MySQL 8 (source of truth), Redis (cache, rate limiter, BullMQ), zod
  (validation), pino (logs), prom-client (metrics), Vitest + Supertest against real MySQL/Redis.

**Consequences**
+ One image, one `docker compose up`. Easy to reason about transactions (everything is in one database).
+ The worker scales and fails independently of the API; a slow provider cannot block HTTP threads.
- Not independently deployable per module. Accepted: premature microservices cost more than they give.

**Alternatives rejected**
- Microservices (payments, orders, ledger): needs distributed transactions or sagas for no benefit at this size.
- Calling the provider inside the HTTP request: couples our latency/availability to theirs (see ADR 0004).

### ADR 0002: Integer cents + append-only double-entry ledger

Status: accepted

**Context**
Money bugs are the worst bugs. We must be able to answer "where did every cent go?" and prove
the books balance.

**Decision**
- All amounts are BIGINT minor units (cents) in MySQL and plain integers in JS. Never FLOAT/DOUBLE.
  The amount of a payment is copied from the ORDER on the server; the client never sends an amount.
- `ledger_entries` is append-only and double-entry: every business event posts one or more
  transactions (same `txn_id`) where sum(debits) = sum(credits). Entries are never updated or deleted.
- Accounts: `sys:provider_clearing` (asset, debit-normal), `sys:merchant_revenue` (credit-normal),
  one `wallet:<userId>` per customer (liability, credit-normal).
- A succeeded payment posts two balanced transactions:
    capture: DR provider_clearing / CR customer_wallet     (cash confirmed by the provider)
    settle : DR customer_wallet    / CR merchant_revenue   (wallet pays the merchant)
- `accounts.balance_cents` is a cached projection for fast reads. The ledger is the truth;
  reconciliation (ADR 0007) recomputes balances from entries and flags any drift.
- `ledger_entries.posting_key` is UNIQUE and deterministic (`pay-<id>-capture-dr`, ...), so posting
  the same business event twice fails loudly instead of double counting.

**Consequences**
+ Auditable, tamper-evident, and every anomaly is detectable by queries.
- Two rows per movement and a cached balance to keep in sync inside the same transaction.
- System accounts are hot rows (every payment updates them). See ADR 0007 for how we limit the damage.

**Alternatives rejected**
- A single `balance` column updated in place: no history, impossible to audit or reconcile.
- DECIMAL: fine, but integers make rounding bugs impossible and are faster to compare.

### ADR 0003: Idempotency keys stored with request hash + response, claimed inside the business transaction

Status: accepted

**Context**
Clients retry (timeouts, double clicks, mobile networks). POST /payments must not create two payments.

**Decision**
- Client sends `Idempotency-Key` (8-100 chars). Scope = (user_id, key), the PRIMARY KEY of `idempotency_keys`.
- One transaction does: INSERT ... ON DUPLICATE KEY UPDATE (takes an exclusive lock on the key row) ->
  SELECT ... FOR UPDATE -> if a response is stored, REPLAY it (or 422 if the request hash differs) ->
  otherwise run the business logic, store the response, then COMMIT.
- The request hash is sha256(method, path, canonical-JSON body). Same key + different request = 422.
- Replays return the original status and body with header `Idempotent-Replay: true`.
- Deterministic 4xx business errors (e.g. order not payable) are stored too; 5xx are not (the
  transaction rolls back and the key is released so the client can retry).
- The transaction contains database work ONLY. The provider is called later, by the worker.
- Defence in depth: a generated column + UNIQUE index guarantees at most one live payment per order
  even if a client uses a different key every time.

**Consequences**
+ No "processing" state that can get stuck, no lock expiry logic, no separate Redis lock to lose.
+ Crash safety is free: if the process dies mid-request the whole transaction rolls back.
- Concurrent duplicates wait (briefly) on a row lock instead of failing fast. Accepted.
- Keys must be purged (a 24h cleanup job); the table grows otherwise. Not built here.
- MySQL's JSON type normalises key order, so a replayed body is semantically equal, not byte-identical.

**Alternatives rejected**
- Redis SETNX lock + later DB write: two systems that can disagree; a lock that expires mid-request
  creates exactly the duplicate you were trying to prevent.
- "Check then insert" without a lock: the classic race. We have a test that fails against it.

### ADR 0004: Transactional outbox -> relay -> BullMQ, with retries, backoff+jitter and a DLQ

Status: accepted

**Context**
After a payment row is committed we must ask the provider to charge it. We cannot atomically
write MySQL and Redis (dual write): either order of the two writes can lose or invent work.

**Decision**
- The business transaction also INSERTs a row into `outbox_events`. Commit makes both visible, or neither.
- A relay in the worker process polls pending rows (`FOR UPDATE SKIP LOCKED`), adds them to BullMQ with
  `jobId = outbox-<id>`, then marks them published. A crash between the two steps just re-publishes the
  row, and the identical jobId makes that a no-op. Delivery is AT-LEAST-ONCE.
- Consumers are idempotent anyway: the charge job re-reads the payment and skips unless it is `pending`,
  and calls the provider with `Idempotency-Key: payment-<id>`. Event consumers use a SET NX marker.
- Retries: 5 attempts, exponential backoff with FULL jitter (random(0, min(cap, base*2^n))) so failed jobs
  do not retry in synchronised waves. Only transient errors (timeout, network, 5xx, 429) retry; other 4xx
  from the provider fail the payment immediately (UnrecoverableError).
- Dead-letter: after the last attempt the job is copied to `payments-dlq` with payload + error. The payment
  stays `pending` (we do not know the outcome, so we do not guess "failed"). Admins can list and requeue.
- Provider calls have a hard timeout (2s) via AbortSignal.

**Consequences**
+ No lost payments, no phantom charges, API latency independent of the provider.
- Eventual consistency: POST /payments answers 202 and the result arrives later (webhook).
- Extra moving parts (relay, Redis) and an outbox table that needs housekeeping (delete old published rows).

**Alternatives rejected**
- Publish to the queue inside the request, after commit: a crash between commit and publish loses the job.
- Publish first, then commit: a rollback leaves a job for a payment that does not exist.
- Kafka / CDC (Debezium): the right answer at higher scale; too heavy here.

### ADR 0005: Provider integration - async result via signed webhooks, at-least-once safe

Status: accepted

**Context**
Real providers answer "accepted" and tell you the outcome later, by webhook, and they retry
webhooks until they get a 2xx. Webhooks can be duplicated, reordered, delayed, forged, or lost.

**Decision**
- Verify: HMAC-SHA256 over `<timestamp>.<raw body>`, constant-time compare, and reject timestamps more than
  5 minutes from now (replay protection). The route reads the RAW body, mounted before express.json().
- Dedupe: `webhook_deliveries.provider_event_id` is UNIQUE and is inserted in the SAME transaction as the
  state change. Crash before commit -> nothing recorded -> the provider retries -> processed normally.
- Second line of defence: a forward-only payment state machine. Terminal states never change, so a
  different event id for the same charge, or `failed` arriving after `succeeded`, is acknowledged and ignored.
- The amount in the event must equal the payment amount, otherwise it is ignored and left for reconciliation.
- Always answer 200 for a verified event (even duplicates/ignored) so the provider stops retrying.
- Lost webhooks: reconciliation finds payments stuck in processing/pending, asks the provider
  (GET /charges/:id) and applies the result through the same settlement function.

**Consequences**
+ Exactly-once EFFECT on top of at-least-once delivery.
- A secret rotation rejects everything unless there is an overlap window (not built here).

**Alternatives rejected**
- Polling the provider for every payment: wasteful and slow; kept only as the reconciliation fallback.
- Trusting the webhook without verifying: anyone could mark orders paid.

### ADR 0006: Cache-aside with explicit invalidation, Redis rate limiting, keyset pagination

Status: accepted

**Decision**
- Cache: GET /orders/:id is read-through (Redis, key `cache:order:<id>`, TTL 60s). Authorization is checked
  AFTER the cache read, so a cache hit cannot leak another user's order. Invalidation is explicit:
  settlement deletes the key AFTER the DB commit. TTL is only a safety net. Known residual race: a reader
  that loaded the old row before the commit can write it back after our DEL; it self-heals within the TTL.
  Redis failures never fail a request (fall back to MySQL).
- Rate limiting: fixed-window counter in Redis (atomic Lua INCR+PEXPIRE). Limits: global per IP, strict per
  IP on /auth, per USER on /payments. Returns 429 + Retry-After. FAILS OPEN if Redis is down: an availability
  decision, to be revisited for abuse-sensitive endpoints.
- Pagination: keyset (cursor = last id, ORDER BY id DESC, `id < ?`), fetch limit+1 to learn if there is a
  next page. Stable under concurrent inserts, O(log n) with the (user_id, id) index, no COUNT(*).

**Consequences**
+ Fast hot reads, bounded abuse, pages that never skip or repeat rows.
- A fixed window allows a 2x burst at a window boundary; a sliding window or token bucket fixes that.
- Keyset gives no "jump to page 7". Accepted for feeds and APIs.

### ADR 0007: Lock ordering, bulkhead pool, and reconciliation as the safety net

Status: accepted, amended after the Stage 10 load test (see "Amendment")

**Decision**
- Lock order is always: orders row -> payments row -> account rows (ascending id). Every code path that
  touches several rows uses this order, so two transactions cannot wait on each other in a cycle.
- Inbound webhooks use their OWN small connection pool (bulkhead). A webhook burst can queue, but it cannot
  consume the connections that customer requests need.
- Reconciliation recomputes the truth independently and reports mismatches: unbalanced ledger transactions,
  cached-balance drift, succeeded payment without ledger, ledger without succeeded payment, amount
  mismatch, order/payment disagreement, and payments stuck too long. It runs on a schedule in the worker
  and on demand (POST /admin/reconcile). Stuck payments are repaired from provider state; everything else
  is only reported (humans decide).

**Amendment (found by running the load test)**
The first version inserted ledger rows BEFORE updating account balances. Inserting a ledger row takes a
SHARED lock on the account row (foreign key check); the following UPDATE needs an EXCLUSIVE lock. Two
payments each holding the shared lock and waiting for the exclusive one = deadlock (hundreds under load;
InnoDB rolled back victims and the provider's webhook retries masked it). Fix: lock all touched accounts
up front with SELECT ... FOR UPDATE ORDER BY id, and post the ledger LAST in the transaction so the hot
rows are held for the shortest possible time.

**Consequences**
+ Deadlock-free under the load test; mismatches become alerts instead of surprises.
- System accounts remain a throughput ceiling (all payments serialise on two rows). Next step if needed:
  shard the system accounts (N sub-accounts chosen by payment id) or derive their balances from entries.

### Acceptance criteria

- [ ] Seven files exist in `docs/adr/` before any `src/` file does.
- [ ] Each ADR names at least one rejected alternative and one real cost of the chosen option.
- [ ] You can explain ADR 0003 and ADR 0004 aloud in 90 seconds each (they are the interview core).

### Interview concepts

ADR practice; trade-off thinking; CAP-style honesty ("we chose X, it costs us Y"); documenting
amendments after incidents (blameless post-mortem culture).

**Interview answer:** "Before writing code I wrote seven short ADRs: architecture shape, money and ledger,
idempotency, async processing, webhooks, read path, and consistency safety nets. Each lists what I rejected
and what the choice costs. One of them, the consistency ADR, I amended after my load test found a deadlock in
the ledger posting; that is the point of ADRs, they are a living record, not a formality."

**Common mistakes:** writing ADRs after the code (they become justification, not decision); listing only
benefits; never updating them.

**Key concepts to remember**

- ADR = context + decision + consequences + alternatives. Amend, do not rewrite history.
- Prefer a decision you can state with its cost over a "best practice" you cannot defend.

**Revision questions**

1. What is the cost of ADR 0003's "claim the key inside the business transaction" choice?
2. Why is calling the provider inside the HTTP request rejected in ADR 0001/0004?
3. What does "amended after the load test" tell an interviewer about you?
4. Which ADR would you revisit first if traffic grew 100x? Why?

**Practical task:** add an ADR 0008 for a decision you would take next (for example "shard the system
ledger accounts") with context, decision, consequences and a rejected alternative.

- [ ] 7 ADRs written and committed first
- [ ] Each has a "rejected alternatives" section
- [ ] I wrote ADR 0008 for a future decision

---

## Stage 1 - Scaffold: config, logging, errors, DB and Redis, health

**Learning objectives**

- Fail fast on bad configuration; build the app with a factory so tests never need a running server.
- Understand a transaction helper that retries deadlocks and a second "bulkhead" connection pool.

### Requirements

1. ES modules, Node 20.6+ (uses `node --env-file`, no dotenv). Versions are pinned by `package.json`.
2. All configuration comes from environment variables, validated by zod at boot. Bad config = process exits
   with a readable message.
3. `createApp()` builds the Express app but never listens (`server.js` listens). Needed for Supertest.
4. `GET /health` (liveness) and `GET /ready` (readiness: MySQL + Redis reachable).
5. Structured JSON logs (pino) with a request id on every line; no `console.log` in application code.
6. A `withTx(fn)` helper: begin/commit/rollback, retry on deadlock. A second pool for webhooks.
7. Graceful shutdown on SIGTERM/SIGINT.

### Design decisions

- **Config in one module:** nobody else reads `process.env`. The frozen `env` object is the contract.
- **Two MySQL pools:** `pool` for normal traffic and `webhookPool` (bulkhead) for provider callbacks, so a
  webhook storm cannot starve customers (ADR 0007; discovered under load, see Stage 12).
- **Side effects after commit:** `withTx` re-runs the callback on deadlock, so the callback must only touch
  the database through `conn`. Cache deletes and queue publishes happen after `withTx` returns.
- **Redis client fails fast:** `enableOfflineQueue: false` so a dead Redis returns errors immediately
  instead of hanging requests; callers decide fail-open (rate limit, cache) or fail-closed.

### Code

`package.json` (dependency versions are what the tests and load test ran with):

```json
{
  "name": "payments-orders",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.6"
  },
  "scripts": {
    "dev:api": "node --watch --env-file=.env src/server.js",
    "dev:worker": "node --watch --env-file=.env src/worker-main.js",
    "dev:provider": "node --watch --env-file=.env src/provider/server.js",
    "start:api": "node src/server.js",
    "start:worker": "node src/worker-main.js",
    "start:provider": "node src/provider/server.js",
    "migrate": "node --env-file=.env scripts/migrate.js",
    "migrate:test": "node --env-file=.env scripts/migrate.js payments_test",
    "seed": "node --env-file=.env scripts/seed.js",
    "test": "vitest run",
    "loadtest": "node --env-file=.env scripts/loadtest.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "bullmq": "^5.81.5",
    "express": "^5.3.0",
    "ioredis": "^5.11.1",
    "jsonwebtoken": "^9.0.3",
    "mysql2": "^3.24.6",
    "pino": "^9.14.0",
    "pino-http": "^10.5.0",
    "prom-client": "^15.1.3",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "autocannon": "^8.0.0",
    "pino-pretty": "^13.2.0",
    "supertest": "^7.3.1",
    "vitest": "^3.2.7"
  }
}
```

`.env.example` (copy to `.env`):

```bash
# Host (non-docker) development. Copy to .env.  Infra comes from: docker compose up -d mysql redis
NODE_ENV=development
PORT=3017
LOG_LEVEL=info
DB_HOST=127.0.0.1
DB_PORT=33066
DB_USER=app
DB_PASSWORD=app
DB_NAME=payments
DB_POOL=20
REDIS_URL=redis://127.0.0.1:63793
JWT_SECRET=change-me-in-real-life-0123456789
JWT_TTL=1h
BCRYPT_COST=10
PROVIDER_URL=http://127.0.0.1:4017
PROVIDER_PORT=4017
PROVIDER_API_KEY=provider-key-dev
WEBHOOK_SECRET=whsec_dev_secret_0123456789
API_BASE_URL=http://127.0.0.1:3017
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin-password-123
QUEUE_PREFIX=cap
JOB_ATTEMPTS=5
BACKOFF_BASE_MS=500
BACKOFF_CAP_MS=30000
PAYMENT_RATE_MAX=30
GLOBAL_RATE_MAX=300
AUTH_RATE_MAX=20
```

`src/config/env.js`:

```js
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3017),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(33066),
  DB_USER: z.string().default('app'),
  DB_PASSWORD: z.string().default('app'),
  DB_NAME: z.string().default('payments'),
  DB_POOL: z.coerce.number().int().min(1).default(20),
  WEBHOOK_DB_POOL: z.coerce.number().int().min(1).default(8),

  REDIS_URL: z.string().default('redis://127.0.0.1:63793'),
  QUEUE_PREFIX: z.string().default('cap'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_TTL: z.string().default('1h'),
  BCRYPT_COST: z.coerce.number().int().min(4).max(14).default(10),

  PROVIDER_URL: z.string().url().default('http://127.0.0.1:4017'),
  PROVIDER_PORT: z.coerce.number().int().default(4017),
  PROVIDER_API_KEY: z.string().min(8).default('provider-key-dev'),
  PROVIDER_TIMEOUT_MS: z.coerce.number().int().default(2000),
  PROVIDER_WEBHOOK_DELAY_MS: z.coerce.number().int().default(100),
  PROVIDER_DUPLICATE_WEBHOOKS: z.enum(['true', 'false']).default('false'),
  WEBHOOK_SECRET: z.string().min(16),
  WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().default(300),
  API_BASE_URL: z.string().url().default('http://127.0.0.1:3017'),

  JOB_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  BACKOFF_BASE_MS: z.coerce.number().int().default(500),
  BACKOFF_CAP_MS: z.coerce.number().int().default(30000),
  WORKER_CONCURRENCY: z.coerce.number().int().default(10),
  RELAY_INTERVAL_MS: z.coerce.number().int().default(250),
  RECONCILE_EVERY_MS: z.coerce.number().int().default(300000),
  STALE_PAYMENT_MINUTES: z.coerce.number().int().default(10),

  ORDER_CACHE_TTL_SECONDS: z.coerce.number().int().default(60),
  GLOBAL_RATE_MAX: z.coerce.number().int().default(300),
  PAYMENT_RATE_MAX: z.coerce.number().int().default(30),
  AUTH_RATE_MAX: z.coerce.number().int().default(20),
  RATE_WINDOW_MS: z.coerce.number().int().default(60000),

  ADMIN_EMAIL: z.string().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().default('admin-password-123'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // fail fast with a readable message; never start half-configured
  console.error('Invalid environment:\n' + JSON.stringify(z.flattenError(parsed.error).fieldErrors, null, 2));
  process.exit(1);
}
export const env = Object.freeze(parsed.data);
```

`src/lib/logger.js`:

```js
import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'payments-orders' },
  redact: ['req.headers.authorization', 'req.headers.cookie', 'password', '*.password'],
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
    : {}),
});
```

`src/lib/errors.js`:

```js
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export const badRequest = (code, msg, d) => new AppError(400, code, msg, d);
export const unauthorized = (msg = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', msg);
export const forbidden = (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg);
export const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (code, msg) => new AppError(409, code, msg);
```

`src/lib/db.js`:

```js
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const base = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  queueLimit: 0,
  timezone: 'Z',
  charset: 'utf8mb4',
};

export const pool = mysql.createPool({ ...base, connectionLimit: env.DB_POOL });

// BULKHEAD: inbound webhooks get their own small pool. A burst of provider webhooks (each waits on the
// hot ledger rows) can then never use up the connections that user-facing requests need. When this pool
// is busy, webhooks queue in memory / the provider retries later; customers keep paying.
export const webhookPool = mysql.createPool({ ...base, connectionLimit: env.WEBHOOK_DB_POOL });

export const closeDb = () => Promise.all([pool.end(), webhookPool.end()]);

const DEADLOCK = 1213;
const LOCK_TIMEOUT = 1205;

/**
 * Run fn(conn) inside one transaction. Retries on deadlock (InnoDB picks a victim and rolls it
 * back; the right response is to run the whole transaction again). fn MUST be safe to re-run:
 * do all reads and writes through `conn`, and do side effects (cache, queue) AFTER withTx returns.
 */
export async function withTx(fn, { retries = 3, from = pool } = {}) {
  for (let attempt = 0; ; attempt++) {
    const conn = await from.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback().catch(() => {});
      if ((err.errno === DEADLOCK || err.errno === LOCK_TIMEOUT) && attempt < retries) {
        logger.warn({ errno: err.errno, attempt }, 'transaction retry');
        continue;
      }
      throw err;
    } finally {
      conn.release();
    }
  }
}

export const isDuplicateKey = (err) => err?.errno === 1062;
```

`src/lib/redis.js`:

```js
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

// Shared by cache + rate limiter. BullMQ gets its own connections (see queue/queues.js).
export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
redis.on('error', () => {}); // errors surface per command; callers decide fail-open vs fail-closed
```

`src/middleware/errorHandler.js` (Express 5 forwards rejected async handlers here automatically; in Express 4
you needed a wrapper):

```js
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

// Express 5 forwards rejected promises from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Body is not valid JSON' } });
  }
  (req.log ?? console).error({ err }, 'unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
}
```

`src/app.js` (FINAL version; it mounts every module. Comment out the lines for modules you have not written yet):

```js
import { randomUUID } from 'node:crypto';
import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { pool } from './lib/db.js';
import { redis } from './lib/redis.js';
import { registry, httpMetricsMiddleware } from './lib/metrics.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import { authenticate } from './middleware/auth.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { webhooksRouter } from './modules/webhooks/webhooks.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';

/**
 * App factory: does NOT listen. server.js listens; tests use Supertest on the returned app.
 * `queues` is injected (only the admin DLQ endpoints need it). `limits` can be overridden by tests.
 */
export function createApp({ queues, limits = {} } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind nginx/ALB: req.ip must be the client, not the proxy

  // correlation id: reuse the caller's X-Request-Id or mint one; it is echoed back and put in every log line
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.headers['x-request-id'] || randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      // log only what helps debugging; never dump all headers (smaller lines, no accidental secret leakage)
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
      autoLogging: { ignore: (req) => req.url === '/metrics' || req.url === '/health' },
    }),
  );
  app.use(httpMetricsMiddleware);

  // ---- unauthenticated, infrastructure endpoints
  app.get('/health', (_req, res) => res.json({ status: 'ok' })); // liveness: the process is up
  app.get('/ready', async (_req, res) => {                        // readiness: dependencies reachable
    try {
      await pool.query('SELECT 1');
      await redis.ping();
      res.json({ status: 'ready' });
    } catch (err) {
      res.status(503).json({ status: 'not_ready', error: err.message });
    }
  });
  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  });

  // ---- webhooks BEFORE express.json(): they need the raw body for HMAC verification
  app.use('/webhooks', webhooksRouter);

  app.use(express.json({ limit: '100kb' }));

  const ip = (req) => req.ip;
  app.use(rateLimit({ name: 'global', key: ip, max: env.GLOBAL_RATE_MAX, windowMs: env.RATE_WINDOW_MS, ...limits.global }));

  app.use('/auth', rateLimit({ name: 'auth', key: ip, max: env.AUTH_RATE_MAX, windowMs: env.RATE_WINDOW_MS, ...limits.auth }), authRouter);
  app.use('/orders', ordersRouter);
  // per-USER limit on the money endpoint (authenticate first so we know who the user is)
  app.use(
    '/payments',
    authenticate,
    rateLimit({ name: 'payments', key: (req) => `u${req.user.id}`, max: env.PAYMENT_RATE_MAX, windowMs: env.RATE_WINDOW_MS, ...limits.payments }),
    paymentsRouter,
  );
  app.use('/admin', adminRouter({ queues }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
```

`src/server.js`:

```js
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { closeDb } from './lib/db.js';
import { redis } from './lib/redis.js';
import { createQueues } from './queue/queues.js';
import { createApp } from './app.js';

const queues = createQueues();
const app = createApp({ queues });
const server = app.listen(env.PORT, () => logger.info({ port: env.PORT }, 'api listening'));

// Graceful shutdown: stop accepting, let in-flight requests finish, then close pools. Orchestrators send SIGTERM first.
let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  logger.info({ signal }, 'shutting down');
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    await queues.close().catch(() => {});
    await closeDb().catch(() => {});
    redis.disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### How it works (Hinglish)

- `env.js` zod se saari values parse karta hai. Galat/missing hone par `process.exit(1)` -- app half-configured
  start hi nahi hoti.
- `createApp()` sirf app return karta hai. Tests `request(app)` use karte hain, server alag.
- `/health` sirf "process zinda hai" batata hai; `/ready` dependencies check karta hai. Kubernetes/ALB
  liveness aur readiness alag probes use karte hain: ready fail hone par traffic roka jata hai, restart nahi.
- `trust proxy = 1`: nginx/ALB ke peeche `req.ip` client ka hona chahiye, warna rate limiter sabko ek hi IP samjhega.
- Webhook router `express.json()` se PEHLE mount hai kyunki HMAC raw bytes pe hota hai (Stage 7).

### Acceptance criteria

- [ ] `docker compose up -d mysql redis` then `npm run dev:api`: `curl localhost:3017/health` -> `{"status":"ok"}`
- [ ] `curl localhost:3017/ready` -> `{"status":"ready"}`; stop Redis and it becomes 503
- [ ] Deleting `JWT_SECRET` from `.env` makes the process exit with a clear message
- [ ] Every log line is JSON and contains `service` (and `req.id` for HTTP requests)

Real output (stack from Stage 12 running):

```text
$ curl -s localhost:3017/health
{"status":"ok"}
$ curl -s localhost:3017/ready
{"status":"ready"}

$ docker stop cap-redis ; curl -s -o /dev/null -w "%{http_code}
" localhost:3017/ready ; curl -s -w " %{http_code}
" localhost:3017/health
503
{"status":"ok"} 200            <- /ready fails, /health stays OK (restart would not help; stop sending traffic)

$ docker run --rm payments-orders:local sh -c 'WEBHOOK_SECRET=x node src/server.js'    (output condensed to fewer lines)
Invalid environment:
{
  "JWT_SECRET": [ "Invalid input: expected string, received undefined" ],
  "WEBHOOK_SECRET": [ "Too small: expected string to have >=16 characters" ]
}
```

### Interview concepts

Fail-fast configuration, app factory for testability, liveness vs readiness, graceful shutdown, connection
pooling, bulkhead pattern, why a transaction helper must retry deadlocks, why side effects go after commit.

**Interview answer (bulkhead):** "I gave inbound provider webhooks their own small MySQL pool. Webhook handlers
queue on hot ledger rows; if they shared the main pool, a burst of callbacks could use every connection and
customer requests would wait for a connection. With a separate pool the damage is contained to the webhook path,
and the provider simply retries later."

**Follow-up: why `enableOfflineQueue: false`?** "With the default, commands issued while Redis is down are buffered
in memory and requests hang until reconnect. I prefer an immediate error so the cache/rate-limiter code can
fail open and the request is served from MySQL."

**Common mistakes:** reading `process.env` all over the code; listening inside the app module (untestable);
using one pool for everything; running side effects inside a retryable transaction callback.

**Key concepts to remember**

- Config is validated once; app is a factory; `/health` != `/ready`.
- Retry deadlocks by re-running the whole transaction; keep the callback side-effect free.

**Revision questions**

1. Why is `/ready` allowed to fail while `/health` stays OK?
2. What happens if `withTx` retries a callback that published to a queue? How do we avoid it?
3. What is `trust proxy` for, and what breaks without it?
4. Why `SIGTERM` handling matters in Kubernetes/ECS deployments.
5. Why does the webhook pool exist?

**Practical task:** add a `DB_STATEMENT_TIMEOUT_MS` setting and apply it so no query can run longer than that
(hint: `SET SESSION MAX_EXECUTION_TIME` for SELECTs). Write a test with `SELECT SLEEP(5)`.

- [ ] Config validated by zod, app factory, health + ready
- [ ] `withTx` understood (retry + after-commit side effects)
- [ ] Graceful shutdown tested with Ctrl+C

---

## Stage 2 - Domain model and schema

**Learning objectives**

- Design tables so the database itself rejects invalid states (constraints are the last line of defence).
- Understand double-entry accounting at the level an interviewer asks about.

### Requirements

1. Tables: `users`, `accounts`, `orders`, `order_items`, `payments`, `ledger_entries`, `idempotency_keys`,
   `outbox_events`, `webhook_deliveries` (+ `schema_migrations` created by the runner).
2. Money is BIGINT cents. Foreign keys everywhere a relationship exists. CHECK constraints for positive amounts.
3. At most ONE live (pending/processing/succeeded) payment per order, enforced by the database.
4. Ledger is append-only, with a deterministic unique `posting_key`.
5. A migration runner that applies `db/migrations/*.sql` once each; an idempotent seed for the admin user.

### Domain model

```text
 users 1---* orders 1---* order_items
   |           |
   |           +---* payments 1---* ledger_entries *---1 accounts
   |                    |
   |                    +-- idempotency_key (client chosen) ; provider_ref (provider charge id)
   +---1 accounts (type = customer_wallet, code wallet:<userId>)

 accounts also hold two system rows: sys:provider_clearing, sys:merchant_revenue
 idempotency_keys  PK (user_id, idem_key)         -- request hash + stored response
 outbox_events     status pending|published       -- written in the business transaction
 webhook_deliveries UNIQUE (provider_event_id)    -- inbound dedupe
```

Double entry in one paragraph (Hinglish): har paisa movement ke do side hote hain -- ek account debit, ek credit,
amount barabar. Isliye "total debit = total credit" ek invariant hai jisse bug turant pakda jata hai. Normal side
ka matlab: asset accounts (clearing) debit se badhte hain, liability/revenue (wallet, revenue) credit se badhte hain.
Hamare payment par: capture = DR clearing / CR wallet (provider se paisa aaya), settle = DR wallet / CR revenue
(wallet ne merchant ko diya). Wallet net 0 rehta hai.

### Code

`db/migrations/001_init.sql`:

```sql
-- Money is ALWAYS stored as integer minor units (cents) in BIGINT. Never FLOAT/DOUBLE.

CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(100)    NOT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- Ledger accounts. `balance_cents` is a CACHED value in the account's normal side;
-- the source of truth is ledger_entries (reconciliation proves they agree).
CREATE TABLE accounts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code          VARCHAR(40)     NOT NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  type          ENUM('customer_wallet','provider_clearing','merchant_revenue') NOT NULL,
  currency      CHAR(3)         NOT NULL DEFAULT 'USD',
  normal_side   ENUM('debit','credit') NOT NULL,
  balance_cents BIGINT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_accounts_code (code),
  CONSTRAINT fk_accounts_user FOREIGN KEY (owner_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

INSERT INTO accounts (code, type, normal_side) VALUES
  ('sys:provider_clearing', 'provider_clearing', 'debit'),
  ('sys:merchant_revenue',  'merchant_revenue',  'credit');

CREATE TABLE orders (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  status      ENUM('pending_payment','paid','cancelled') NOT NULL DEFAULT 'pending_payment',
  total_cents BIGINT UNSIGNED NOT NULL,
  currency    CHAR(3)         NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_orders_user_id (user_id, id),           -- serves "my orders, newest first" keyset scans
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id         BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(200)    NOT NULL,
  unit_price_cents BIGINT UNSIGNED NOT NULL,
  quantity         INT UNSIGNED    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_items_order (order_id),
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT chk_items_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  amount_cents    BIGINT UNSIGNED NOT NULL,
  currency        CHAR(3)         NOT NULL DEFAULT 'USD',
  status          ENUM('pending','processing','succeeded','failed') NOT NULL DEFAULT 'pending',
  provider_ref    VARCHAR(64)     NULL,
  failure_reason  VARCHAR(200)    NULL,
  last_error      VARCHAR(500)    NULL,
  idempotency_key VARCHAR(100)    NOT NULL,
  -- Defence in depth: at most ONE live payment per order, enforced by the database itself.
  -- NULL for failed payments, and UNIQUE ignores NULLs, so a failed payment can be retried.
  active_order_id BIGINT UNSIGNED GENERATED ALWAYS AS
                  (IF(status IN ('pending','processing','succeeded'), order_id, NULL)) STORED,
  created_at      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_active_order (active_order_id),
  UNIQUE KEY uq_payments_provider_ref (provider_ref),
  KEY idx_payments_user_id (user_id, id),
  KEY idx_payments_status_updated (status, updated_at),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_payments_user  FOREIGN KEY (user_id)  REFERENCES users (id),
  CONSTRAINT chk_payments_amount CHECK (amount_cents > 0)
) ENGINE=InnoDB;

-- Double-entry, append-only. Every txn_id must have sum(debits) = sum(credits).
-- posting_key is a deterministic natural key so re-posting the same business event is rejected.
CREATE TABLE ledger_entries (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  txn_id       CHAR(36)        NOT NULL,
  payment_id   BIGINT UNSIGNED NOT NULL,
  account_id   BIGINT UNSIGNED NOT NULL,
  direction    ENUM('debit','credit') NOT NULL,
  amount_cents BIGINT UNSIGNED NOT NULL,
  description  VARCHAR(200)    NOT NULL,
  posting_key  VARCHAR(120)    NOT NULL,
  created_at   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_ledger_posting_key (posting_key),
  KEY idx_ledger_txn (txn_id),
  KEY idx_ledger_account (account_id, id),
  KEY idx_ledger_payment (payment_id),
  CONSTRAINT fk_ledger_account FOREIGN KEY (account_id) REFERENCES accounts (id),
  CONSTRAINT fk_ledger_payment FOREIGN KEY (payment_id) REFERENCES payments (id),
  CONSTRAINT chk_ledger_amount CHECK (amount_cents > 0)
) ENGINE=InnoDB;

-- Idempotency: one row per (user, client-chosen key). The PRIMARY KEY is the concurrency guard.
CREATE TABLE idempotency_keys (
  user_id         BIGINT UNSIGNED NOT NULL,
  idem_key        VARCHAR(100)    NOT NULL,
  request_hash    CHAR(64)        NOT NULL,
  response_status SMALLINT        NULL,
  response_body   JSON            NULL,
  created_at      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, idem_key),
  KEY idx_idem_created (created_at)               -- for the 24h cleanup job
) ENGINE=InnoDB;

-- Transactional outbox: written in the SAME transaction as the business change.
CREATE TABLE outbox_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aggregate_type VARCHAR(40)     NOT NULL,
  aggregate_id   BIGINT UNSIGNED NOT NULL,
  event_type     VARCHAR(60)     NOT NULL,
  payload        JSON            NOT NULL,
  status         ENUM('pending','published') NOT NULL DEFAULT 'pending',
  attempts       INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  published_at   TIMESTAMP(3)    NULL,
  PRIMARY KEY (id),
  KEY idx_outbox_status_id (status, id)
) ENGINE=InnoDB;

-- INBOUND provider webhooks. UNIQUE(provider_event_id) is the dedupe guard for at-least-once delivery.
CREATE TABLE webhook_deliveries (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_event_id VARCHAR(64)     NOT NULL,
  event_type        VARCHAR(60)     NOT NULL,
  payload           JSON            NOT NULL,
  outcome           VARCHAR(40)     NOT NULL,
  received_at       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_webhook_event (provider_event_id)
) ENGINE=InnoDB;
```

`scripts/migrate.js`:

```js
// Minimal forward-only migration runner: applies db/migrations/*.sql in name order, once each.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

export async function migrate(config) {
  const conn = await mysql.createConnection({ ...config, multipleStatements: true });
  try {
    await conn.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
    );
    const [done] = await conn.query('SELECT name FROM schema_migrations');
    const applied = new Set(done.map((r) => r.name));
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      await conn.query(await readFile(path.join(dir, file), 'utf8'));
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      console.log(`applied ${file}`);
    }
    if (files.every((f) => applied.has(f))) console.log('schema already up to date');
  } finally {
    await conn.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await migrate({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 33066),
    user: process.env.DB_USER ?? 'app',
    password: process.env.DB_PASSWORD ?? 'app',
    database: process.argv[2] ?? process.env.DB_NAME ?? 'payments', // optional CLI arg: database name
  });
}
```

`scripts/seed.js`:

```js
// Idempotent: creates the admin user (+ wallet account) if it does not exist.
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 33066),
  user: process.env.DB_USER ?? 'app',
  password: process.env.DB_PASSWORD ?? 'app',
  database: process.env.DB_NAME ?? 'payments',
});
const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.ADMIN_PASSWORD ?? 'admin-password-123';
const hash = await bcrypt.hash(password, 10);
const [res] = await conn.query(
  "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin') ON DUPLICATE KEY UPDATE role = 'admin'",
  [email, hash],
);
const [[user]] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
await conn.query(
  "INSERT IGNORE INTO accounts (code, owner_user_id, type, normal_side) VALUES (?, ?, 'customer_wallet', 'credit')",
  [`wallet:${user.id}`, user.id],
);
console.log(res.affectedRows ? `seeded admin ${email}` : `admin ${email} already present`);
await conn.end();
```

`docker/mysql-init.sql` (creates the `payments_test` database on first start of the MySQL volume):

```sql
-- Runs once, on first start of an empty MySQL data volume.
-- MYSQL_DATABASE=payments and user "app" are created by the image; here we add the test database.
CREATE DATABASE IF NOT EXISTS payments_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON payments_test.* TO 'app'@'%';
FLUSH PRIVILEGES;
```

### How it works

- `active_order_id` is a STORED generated column: it equals `order_id` while the payment is live and `NULL`
  when it is `failed`. A UNIQUE index ignores NULLs, so "one live payment per order" is enforced by MySQL, and a
  failed payment frees the slot for a retry. Application checks can race; this cannot.
- `idempotency_keys` PRIMARY KEY `(user_id, idem_key)` is the concurrency guard (Stage 4).
- `ledger_entries.posting_key` UNIQUE makes double posting impossible.
- The `(user_id, id)` index on `orders` and `payments` serves keyset pagination (Stage 8) without a sort.
- `webhook_deliveries.provider_event_id` UNIQUE dedupes inbound webhooks (Stage 7).

### Acceptance criteria

- [ ] `npm run migrate` prints `applied 001_init.sql`; running it again prints `schema already up to date`
- [ ] `npm run seed` creates `admin@example.com` once (second run says already present)
- [ ] Inserting a payment with `amount_cents = 0` fails (CHECK); a second live payment for one order fails (UNIQUE)

Real output:

```text
$ npm run migrate
applied 001_init.sql
$ npm run migrate        (second run)
schema already up to date
$ npm run seed
seeded admin admin@example.com
```

Try the constraints yourself (inside `docker exec -it cap-mysql mysql -uapp -papp payments`):

```sql
INSERT INTO payments (order_id, user_id, amount_cents, idempotency_key) VALUES (1, 1, 0, 'x');
-- ERROR 3819 (HY000) at line 1: Check constraint 'chk_payments_amount' is violated.

-- order 502 already has a live payment (from the demo run in Stage 12):
INSERT INTO payments (order_id, user_id, amount_cents, idempotency_key, status) VALUES (502, 4, 100, 'x', 'pending');
-- ERROR 1062 (23000) at line 1: Duplicate entry '502' for key 'payments.uq_payments_active_order'
```

### Interview concepts

Normalisation vs denormalised projections (cached balance), constraints as invariants, generated columns,
partial-unique-index pattern in MySQL (generated column + UNIQUE), double-entry bookkeeping, why money is never
FLOAT, surrogate keys, FK behaviour (shared lock on parent row during child insert -- this bites in Stage 12).

**Interview answer:** "I store money as integer cents and record every movement in an append-only double-entry
ledger. Balances on the accounts table are a cached projection I can recompute from the entries, and a
reconciliation job proves they match. The schema also enforces business rules: a generated column plus a unique
index guarantees one live payment per order, even if application code races."

**Follow-up: how do you do a partial unique index in MySQL?** "MySQL has no partial indexes. I use a generated
column that is the value when the row is 'active' and NULL otherwise, then put a UNIQUE index on it; UNIQUE allows
many NULLs."

**Common mistakes:** FLOAT/DECIMAL arithmetic in JS; updating ledger rows; trusting the application to
enforce uniqueness; no FK so orphan rows appear; one `balance` column with no history.

**Key concepts to remember**

- Cents as integers; ledger = truth; cached balance = projection.
- The database is the last line of defence: UNIQUE, CHECK, FK.
- Generated column + UNIQUE = partial unique index.

**Revision questions**

1. Why can a failed payment be retried for the same order but a pending one cannot?
2. What are the debits and credits for a $50 payment, and what is the wallet balance afterwards?
3. Why is `posting_key` deterministic rather than random?
4. Why does an index on `(user_id, id)` matter for pagination?
5. Which side is "normal" for an asset account, and why does it matter for the cached balance formula?

**Practical task:** add a `refunds` flow design: which accounts and which entries? (Write only the table
changes and the ledger postings; do not implement.)

- [ ] Schema applied; constraints tried by hand
- [ ] I can explain every unique/check/generated construct
- [ ] I can post a payment and a refund as balanced entries on paper

---

## Stage 3 - Auth, RBAC and orders

**Learning objectives**

- Implement signup/login with bcrypt + JWT, verify tokens safely, and enforce role AND ownership checks.
- Understand why "not yours" returns 404, not 403, and why role never comes from the request body.

### Requirements

1. `POST /auth/register` creates a **customer** (never an admin) and its wallet account in one transaction.
2. `POST /auth/login` returns a signed JWT access token (HS256, `sub` = user id, `role` claim, 1h TTL).
3. `authenticate` middleware verifies the token (algorithm pinned) and sets `req.user`.
4. `requireRole('admin')` protects `/admin/*`. Customers can only see their own orders and payments.
5. Wrong password and unknown email must be indistinguishable (same response, similar timing).
6. `POST /orders` (items validated with zod; the server computes the total), `GET /orders/:id`, `GET /orders`.
   (The final `orders.service.js` also contains the cache and the pagination from Stage 8; read those parts
   there. For now treat `getOrderForUser` as "load + ownership check".)

### Design decisions

- **Access token only** (no refresh token) to keep the capstone focused; the Task API part covers refresh
  tokens. In production you would add refresh rotation. Say this honestly if asked.
- **RBAC with two roles** is a lookup of `req.user.role`; **ownership** (`order.userId === req.user.id`) is a
  separate check. RBAC answers "may this kind of user call this endpoint?", ownership answers "may THIS user touch
  THIS row?". Mixing them up causes IDOR (insecure direct object reference) bugs.
- **404 for foreign resources** so the API does not reveal that another user's order id exists.
- **Total computed on the server** from `unitPriceCents * quantity`; the client never sends a total.
- **bcryptjs** (pure JS) avoids native build problems on Windows/Alpine; use native `bcrypt` or `argon2` when
  you can build native modules. Cost 10 in dev, 4 in tests (speed).

### Code

`src/middleware/auth.js`:

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_TTL,
    algorithm: 'HS256',
  });
}

// Authentication: who are you? Verifies the bearer token and sets req.user.
export function authenticate(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();
  try {
    // algorithms is pinned: never let the token choose its own algorithm ("alg: none" attack)
    const claims = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: Number(claims.sub), role: claims.role };
    next();
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

// Authorization (RBAC): are you allowed? Role comes from the signed token, never from the request body.
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) throw forbidden('Insufficient role');
    next();
  };
```

`src/modules/auth/auth.routes.js`:

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { pool, withTx, isDuplicateKey } from '../../lib/db.js';
import { AppError, unauthorized } from '../../lib/errors.js';
import { signAccessToken } from '../../middleware/auth.js';

const credentials = z.object({
  email: z.string().email().max(255).transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(72), // bcrypt only uses the first 72 bytes
});

// compared against when the email is unknown, so "no such user" costs the same time as "wrong password"
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.BCRYPT_COST);

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
  try {
    const user = await withTx(async (conn) => {
      // role is NEVER taken from the body: public signup always creates a customer
      const [r] = await conn.query("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'customer')", [email, passwordHash]);
      await conn.query(
        "INSERT INTO accounts (code, owner_user_id, type, normal_side) VALUES (?, ?, 'customer_wallet', 'credit')",
        [`wallet:${r.insertId}`, r.insertId],
      );
      return { id: r.insertId, email, role: 'customer' };
    });
    res.status(201).json({ user });
  } catch (err) {
    if (isDuplicateKey(err)) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered');
    throw err;
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const [[user]] = await pool.query('SELECT id, email, role, password_hash FROM users WHERE email = ?', [email]);
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Invalid email or password');
  res.json({ accessToken: signAccessToken(user), tokenType: 'Bearer', expiresIn: env.JWT_TTL });
});
```

`src/modules/orders/orders.routes.js`:

```js
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { createOrder, getOrderForUser, listOrders } from './orders.service.js';

const createBody = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        unitPriceCents: z.number().int().min(1).max(100_000_000),
        quantity: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(50),
});

const listQuery = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending_payment', 'paid', 'cancelled']).optional(),
});

const idParam = z.object({ id: z.coerce.number().int().min(1) });

export const ordersRouter = Router();
ordersRouter.use(authenticate);

ordersRouter.post('/', async (req, res) => {
  const { items } = createBody.parse(req.body);
  res.status(201).json({ order: await createOrder(req.user.id, items) });
});

ordersRouter.get('/', async (req, res) => {
  const q = listQuery.parse(req.query);
  res.json(await listOrders({ user: req.user, ...q }));
});

ordersRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { order, cacheState } = await getOrderForUser(id, req.user);
  res.setHeader('X-Cache', cacheState);
  res.json({ order });
});
```

`src/modules/orders/orders.service.js` (final form; cache + pagination are explained in Stage 8):

```js
import { pool, withTx } from '../../lib/db.js';
import { notFound } from '../../lib/errors.js';
import { paginate } from '../../lib/cursor.js';
import { cacheGet, cacheSet, orderKey } from '../../lib/cache.js';

const toOrder = (o, items) => ({
  id: o.id,
  userId: o.user_id,
  status: o.status,
  totalCents: o.total_cents,
  currency: o.currency,
  items: items.map((i) => ({ name: i.name, unitPriceCents: i.unit_price_cents, quantity: i.quantity })),
  createdAt: o.created_at,
});

export async function createOrder(userId, items) {
  // The server computes the total. The client never sends an amount we trust.
  const total = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const id = await withTx(async (conn) => {
    const [o] = await conn.query('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)', [userId, total]);
    await conn.query('INSERT INTO order_items (order_id, name, unit_price_cents, quantity) VALUES ?', [
      items.map((i) => [o.insertId, i.name, i.unitPriceCents, i.quantity]),
    ]);
    return o.insertId;
  });
  return loadOrder(id);
}

async function loadOrder(id) {
  const [[o]] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (!o) return null;
  const [items] = await pool.query('SELECT name, unit_price_cents, quantity FROM order_items WHERE order_id = ? ORDER BY id', [id]);
  return toOrder(o, items);
}

/** Read-through cache. Authorization is checked AFTER the cache read, so a cache hit can never leak another user's order. */
export async function getOrderForUser(id, user) {
  let cacheState = 'HIT';
  let order = await cacheGet(orderKey(id));
  if (!order) {
    cacheState = 'MISS';
    order = await loadOrder(id);
    if (order) await cacheSet(orderKey(id), order);
  }
  if (!order || (order.userId !== user.id && user.role !== 'admin')) throw notFound('Order'); // 404 not 403: do not reveal existence
  return { order, cacheState };
}

export function listOrders({ user, cursor, limit, status }) {
  return paginate({ cursor, limit }, async (beforeId, take) => {
    const where = ['user_id = ?'];
    const params = [user.id];
    if (beforeId) { where.push('id < ?'); params.push(beforeId); }
    if (status) { where.push('status = ?'); params.push(status); }
    const [rows] = await pool.query(
      `SELECT id, user_id, status, total_cents, currency, created_at FROM orders WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ?`,
      [...params, take],
    );
    return rows.map((o) => ({ id: o.id, userId: o.user_id, status: o.status, totalCents: o.total_cents, currency: o.currency, createdAt: o.created_at }));
  });
}
```

### How it works (Hinglish)

- `register`: email lowercase, password min 8 / max 72 (bcrypt sirf pehle 72 bytes use karta hai). User aur wallet
  account ek hi transaction mein. Duplicate email par MySQL ka `ER_DUP_ENTRY` (errno 1062) pakad kar 409 dete hain --
  "pehle check karo phir insert" nahi, kyunki wo race hai.
- `login`: user na mile to bhi `bcrypt.compare` ek dummy hash par chalta hai, taaki response time se pata na chale ki
  email exist karta hai ya nahi.
- `authenticate`: `jwt.verify(..., { algorithms: ['HS256'] })` -- algorithm pin kiya, taaki attacker `alg: none`
  ya RS/HS confusion na kar sake.
- Role token ke andar signed hai, body se kabhi nahi aata. Test `cannot self-assign admin through the body` yahi check
  karta hai.

### Acceptance criteria

- [ ] Register returns 201 and role `customer`; duplicate email 409; password shorter than 8 -> 400
- [ ] Login with wrong password and unknown email return the identical 401 body
- [ ] No/garbage token -> 401; customer on `/admin/*` -> 403; admin -> 200
- [ ] A user reading another user's order gets 404; an admin gets 200

Real output (from the running compose stack):

```text
$ curl -i POST /auth/register (customer)
HTTP/1.1 201 Created
{"user":{"id":4,"email":"demo@example.com","role":"customer"}}

$ customer calls an admin endpoint
HTTP/1.1 403 Forbidden
{"error":{"code":"FORBIDDEN","message":"Insufficient role"}}

$ create order, 2 x 4500 cents
{"order":{"id":502,"userId":4,"status":"pending_payment","totalCents":9000,"currency":"USD","items":[{"name":"Keyboard","unitPriceCents":4500,"quantity":2}],"createdAt":"2026-10-20T07:45:46.396Z"}}
```

Matching automated tests (all pass, see Stage 11): `auth + RBAC` (5 tests).

### Interview concepts

bcrypt cost factor and why hashing is deliberately slow; JWT structure (header.payload.signature), `sub`/`exp`
claims, HS256 vs RS256, algorithm pinning; authentication vs authorization; RBAC vs ownership (IDOR/BOLA, the
number one API vulnerability in the OWASP API Top 10); user enumeration; mass assignment (role in body).

**Interview answer:** "Authentication verifies the JWT signature and expiry with a pinned algorithm and puts the user
id and role on the request. Authorization is two separate checks: a role check at the route level for admin
endpoints, and an ownership check at the data level, so a customer can only read their own orders and payments.
Foreign ids return 404 so we do not leak existence. The role is only ever read from the signed token, never the body."

**Follow-up: where would you put refresh tokens and how would you revoke a JWT?** "Short-lived access tokens (15 min)
plus a rotating refresh token stored hashed in the database with reuse detection. To revoke an access token
immediately you need state: a denylist keyed by `jti` in Redis with TTL equal to the token's remaining life, or
a per-user `token_version` claim checked on each request."

**Common mistakes:** accepting `role` from the body; comparing passwords with `===`; different errors for
unknown user vs wrong password; verifying JWT without pinning the algorithm; checking role but not ownership.

**Key concepts to remember**

- Authn != authz; RBAC != ownership; 404 over 403 for foreign ids.
- Never trust the client for role or amount.

**Revision questions**

1. What attack does `algorithms: ['HS256']` prevent?
2. Why compare against a dummy hash when the email is unknown?
3. Why is "check email exists, then insert" a bug, and what do we do instead?
4. What does a customer get when calling `GET /orders/<someone else's id>`, and why?
5. How would you add a `merchant` role without changing the payment code?

**Practical task:** add `POST /auth/logout-all` that invalidates every existing token for a user using a
`token_version` column and claim. Add a test.

- [ ] Register/login/protected route work
- [ ] Role and ownership are separate checks in my code
- [ ] I can explain IDOR/BOLA with an example from this API

---

## Stage 4 - Idempotent `POST /payments`

**Learning objectives**

- Build the single most asked-about payments feature: an idempotency layer that is correct under concurrency.
- Know every state the key can be in and what each concurrent caller sees.

### Requirements

1. `POST /payments` with header `Idempotency-Key` (required, 8-100 chars, `[A-Za-z0-9_-]`) and body `{ orderId }`.
2. First request creates a `pending` payment and an outbox event, and answers `202`.
3. Same key + same body: replay the stored status and body, header `Idempotent-Replay: true`, create nothing.
4. Same key + different body: `422 IDEMPOTENCY_KEY_REUSED`.
5. Concurrent duplicates (50 at once): exactly one payment and one outbox event; every caller gets the same payment id.
6. A different key for an order that already has a live payment: `409 PAYMENT_IN_PROGRESS` (DB unique index backstop).
7. The amount comes from the order, never the client. Only the order's owner can pay; foreign order = 404.

### Design decisions (see ADR 0003)

- **Key claim, business logic and response storage share ONE transaction.** There is no "in progress" state that can
  get stuck, and a crash rolls everything back.
- **Concurrency control = a row lock.** `INSERT ... ON DUPLICATE KEY UPDATE` takes an exclusive lock on the key row.
  A concurrent duplicate blocks there until the first transaction commits, then reads the stored response.
  (`INSERT IGNORE` takes only a shared lock on the duplicate; if the first transaction then rolls back, several
  waiters can all try to upgrade and deadlock. The `ON DUPLICATE KEY UPDATE` form avoids that.)
- **Request hash** (sha256 over method, path, canonical JSON body) detects key reuse with a different payload.
- **Validate before write** inside the handler, so a stored 4xx never corresponds to partial writes.
- **Lock order** is orders row -> payments row everywhere (settlement uses the same order, ADR 0007).
- The provider is NOT called here. The handler writes an outbox row; the worker calls the provider (Stage 6).

### Code

`src/lib/hash.js`:

```js
import { createHash } from 'node:crypto';

// JSON with sorted keys, so {a:1,b:2} and {b:2,a:1} hash the same.
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const requestHash = (method, path, body) => sha256(`${method}\n${path}\n${stableStringify(body ?? {})}`);
```

`src/modules/payments/idempotency.js`:

```js
import { withTx } from '../../lib/db.js';
import { AppError } from '../../lib/errors.js';
import { requestHash } from '../../lib/hash.js';

/**
 * Run `handler(conn)` at most once per (userId, key), and replay the stored response for repeats.
 *
 * Why this is safe under concurrency
 * ----------------------------------
 * Everything happens in ONE transaction: claim the key, do the business writes, store the response.
 *  1. INSERT ... ON DUPLICATE KEY UPDATE takes an EXCLUSIVE lock on the (user_id, idem_key) index
 *     record. A concurrent duplicate blocks right here until the first transaction commits.
 *  2. After the first commits, the waiter's insert becomes a no-op update, and the SELECT ... FOR UPDATE
 *     reads the COMMITTED row with the stored response -> it replays instead of re-running.
 *  3. If the first transaction rolls back (crash, error), the key row vanishes with it and the next
 *     waiter simply becomes the new owner. There is no "stuck in processing" state to expire.
 * The handler only does database work (the provider is called later by the worker via the outbox),
 * which is what lets us keep the whole thing in one short transaction.
 *
 * `response_status IS NULL` after we hold the lock can only mean "we just created it".
 */
export async function runIdempotent({ userId, key, method, path, body }, handler) {
  const hash = requestHash(method, path, body);

  return withTx(async (conn) => {
    await conn.query(
      'INSERT INTO idempotency_keys (user_id, idem_key, request_hash) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user_id = user_id',
      [userId, key, hash],
    );
    const [[row]] = await conn.query(
      'SELECT request_hash, response_status, response_body FROM idempotency_keys WHERE user_id = ? AND idem_key = ? FOR UPDATE',
      [userId, key],
    );

    if (row.response_status !== null) {
      if (row.request_hash !== hash) {
        throw new AppError(422, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used with a different request');
      }
      return { replayed: true, status: row.response_status, body: row.response_body };
    }

    let status;
    let responseBody;
    try {
      ({ status, body: responseBody } = await handler(conn));
    } catch (err) {
      // Deterministic business rejections (4xx) are stored too, so a retry gets the SAME answer.
      // Handlers validate before they write, so nothing partial is committed. 5xx / unknown errors
      // propagate -> rollback -> the key is released and the client may retry.
      if (!(err instanceof AppError) || err.status >= 500) throw err;
      status = err.status;
      responseBody = { error: { code: err.code, message: err.message } };
    }

    await conn.query(
      'UPDATE idempotency_keys SET response_status = ?, response_body = ? WHERE user_id = ? AND idem_key = ?',
      [status, JSON.stringify(responseBody), userId, key],
    );
    return { replayed: false, status, body: responseBody };
  });
}
```

`src/modules/outbox/outbox.service.js`:

```js
/**
 * Write an event row INSIDE the caller's transaction. If the business change rolls back,
 * the event rolls back with it; if it commits, the event is guaranteed to exist and will be
 * relayed (at-least-once) by outbox/relay.js. This is the fix for the "dual write" problem:
 * you cannot atomically write to MySQL AND Redis, but you CAN atomically write two MySQL rows.
 */
export async function addOutboxEvent(conn, { aggregateType, aggregateId, type, payload }) {
  const [r] = await conn.query(
    'INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload) VALUES (?, ?, ?, ?)',
    [aggregateType, aggregateId, type, JSON.stringify(payload)],
  );
  return r.insertId;
}
```

`src/modules/payments/payments.service.js`:

```js
import { pool, isDuplicateKey } from '../../lib/db.js';
import { conflict, notFound } from '../../lib/errors.js';
import { paginate } from '../../lib/cursor.js';
import { addOutboxEvent } from '../outbox/outbox.service.js';
import { paymentsTotal } from '../../lib/metrics.js';

export const toPayment = (p) => ({
  id: p.id,
  orderId: p.order_id,
  status: p.status,
  amountCents: Number(p.amount_cents),
  currency: p.currency,
  failureReason: p.failure_reason ?? null,
  createdAt: p.created_at,
});

/**
 * Business logic of POST /payments, run INSIDE the idempotency transaction.
 * Order of operations matters: validate (read-only, may throw AppError) BEFORE any write,
 * so a stored 4xx response never corresponds to a half-written state.
 */
export async function createPayment(conn, { user, orderId, idempotencyKey, requestId }) {
  // Lock order is always: orders row -> payments row (settlement.js uses the same order; no deadlock).
  const [[order]] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  if (!order || order.user_id !== user.id) throw notFound('Order'); // same answer for "missing" and "not yours"
  if (order.status !== 'pending_payment') throw conflict('ORDER_NOT_PAYABLE', `Order is ${order.status}`);

  const [[live]] = await conn.query(
    "SELECT id FROM payments WHERE order_id = ? AND status IN ('pending','processing','succeeded') LIMIT 1",
    [orderId],
  );
  if (live) throw conflict('PAYMENT_IN_PROGRESS', 'A payment for this order is already in progress');

  let paymentId;
  try {
    const [r] = await conn.query(
      'INSERT INTO payments (order_id, user_id, amount_cents, currency, idempotency_key) VALUES (?, ?, ?, ?, ?)',
      [orderId, user.id, order.total_cents, order.currency, idempotencyKey], // amount comes from the ORDER, never the client
    );
    paymentId = r.insertId;
  } catch (err) {
    // backstop: uq_payments_active_order fired -> someone else created a live payment
    if (isDuplicateKey(err)) throw conflict('PAYMENT_IN_PROGRESS', 'A payment for this order is already in progress');
    throw err;
  }

  await addOutboxEvent(conn, {
    aggregateType: 'payment',
    aggregateId: paymentId,
    type: 'payment.created',
    payload: { paymentId, orderId, userId: user.id, amountCents: Number(order.total_cents), requestId },
  });

  const [[payment]] = await conn.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
  return { status: 202, body: { payment: toPayment(payment) } };
}

export async function getPaymentForUser(id, user) {
  const [[p]] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
  if (!p || (p.user_id !== user.id && user.role !== 'admin')) throw notFound('Payment');
  return toPayment(p);
}

export function listPayments({ user, cursor, limit }) {
  return paginate({ cursor, limit }, async (beforeId, take) => {
    const where = ['user_id = ?'];
    const params = [user.id];
    if (beforeId) { where.push('id < ?'); params.push(beforeId); }
    const [rows] = await pool.query(`SELECT * FROM payments WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ?`, [...params, take]);
    return rows.map(toPayment);
  });
}

export function countCreated(replayed) {
  paymentsTotal.inc({ result: replayed ? 'replayed' : 'created' });
}
```

`src/modules/payments/payments.routes.js`:

```js
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { badRequest } from '../../lib/errors.js';
import { runIdempotent } from './idempotency.js';
import { countCreated, createPayment, getPaymentForUser, listPayments } from './payments.service.js';

const body = z.object({ orderId: z.number().int().min(1) }).strict();
const keyHeader = z.string().regex(/^[A-Za-z0-9_-]{8,100}$/, 'Idempotency-Key must be 8-100 chars of [A-Za-z0-9_-]');
const listQuery = z.object({ cursor: z.string().max(200).optional(), limit: z.coerce.number().int().min(1).max(100).default(20) });
const idParam = z.object({ id: z.coerce.number().int().min(1) });

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);

paymentsRouter.post('/', async (req, res) => {
  const idempotencyKey = req.get('Idempotency-Key');
  if (!idempotencyKey) throw badRequest('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required');
  keyHeader.parse(idempotencyKey);
  const { orderId } = body.parse(req.body);

  const result = await runIdempotent(
    { userId: req.user.id, key: idempotencyKey, method: 'POST', path: '/payments', body: { orderId } },
    (conn) => createPayment(conn, { user: req.user, orderId, idempotencyKey, requestId: req.id }),
  );

  if (result.status === 202) countCreated(result.replayed);
  if (result.replayed) res.setHeader('Idempotent-Replay', 'true');
  res.status(result.status).json(result.body);
});

paymentsRouter.get('/', async (req, res) => {
  res.json(await listPayments({ user: req.user, ...listQuery.parse(req.query) }));
});

paymentsRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ payment: await getPaymentForUser(id, req.user) });
});
```

### How it works - what each caller sees (Hinglish)

Maan lo 50 requests ek saath aayi, same key `K`:

1. Sab `INSERT ... ON DUPLICATE KEY UPDATE` karte hain. MySQL ek ko row ka exclusive lock deta hai (A). Baaki 49
   wahin wait karte hain -- unke paas connection hai par query block hai.
2. A: `SELECT ... FOR UPDATE` -> `response_status` NULL hai -> mai owner hoon. Order lock, payment insert, outbox insert,
   response store, COMMIT. Lock chhootta hai.
3. Ab agla caller (B) ka INSERT unblock hota hai (duplicate -> no-op update), `SELECT ... FOR UPDATE` committed row
   dekhta hai, `response_status` set hai -> hash match -> **replay**. Aise hi baaki 48.
4. Agar A crash/rollback kare to key row bhi gayab -- agla waiter naya owner ban jata hai. "Stuck processing" jaisa kuch
   hota hi nahi.

Why the pool does not deadlock: the owner transaction uses exactly one connection from start to finish; waiters hold
a connection each but wait on a row lock, not on the pool. 50 requests against a pool of 30 just queue.

### Acceptance criteria

- [ ] No header -> 400; short key -> 400
- [ ] Replay returns the same body and `Idempotent-Replay: true`; DB has 1 payment + 1 outbox event
- [ ] Same key + different `orderId` -> 422
- [ ] 50 concurrent identical requests -> 50 x 202, 1 created + 49 replays, same payment id everywhere
- [ ] 50 concurrent requests with 50 different keys for one order -> one 202, forty-nine 409
- [ ] Two different users may reuse the same key string (key scope is `(user_id, key)`)

Real output (compose stack):

```text
$ POST /payments WITHOUT Idempotency-Key
HTTP/1.1 400 Bad Request
{"error":{"code":"IDEMPOTENCY_KEY_REQUIRED","message":"Idempotency-Key header is required"}}

$ POST /payments first time
HTTP/1.1 202 Accepted
{"payment":{"id":514,"orderId":502,"status":"pending","amountCents":9000,"currency":"USD","failureReason":null,"createdAt":"2026-10-20T07:45:46.838Z"}}

$ POST /payments again, same key
HTTP/1.1 202 Accepted
Idempotent-Replay: true
{"payment":{"id":514,"status":"pending","orderId":502,"currency":"USD","createdAt":"2026-10-20T07:45:46.838Z","amountCents":9000,"failureReason":null}}

$ same key, different order id
HTTP/1.1 422 Unprocessable Entity
{"error":{"code":"IDEMPOTENCY_KEY_REUSED","message":"This Idempotency-Key was already used with a different request"}}
```

Note the replayed JSON has its keys in a different order than the first response: the stored response lives in a
MySQL `JSON` column, which normalises key order. Semantically identical, not byte-identical (ADR 0003). If you
need byte-identical replays, store the response in a `TEXT` column instead.

The automated proof (real run; full list in Stage 11):

```text
 [OK] idempotent POST /payments > same key + same body replays the stored response and creates nothing new
 [OK] idempotent POST /payments > same key + DIFFERENT body is rejected with 422
 [OK] idempotent POST /payments > a different key for an order that already has a live payment is 409 (DB unique index is the backstop)
 [OK] idempotent POST /payments > CONCURRENCY: 50 simultaneous requests with the SAME key -> exactly one payment, one outbox event
 [OK] idempotent POST /payments > CONCURRENCY: 50 simultaneous requests with 50 DIFFERENT keys for one order -> exactly one wins, 49 get 409
```

### Interview concepts

Idempotency vs safe methods; idempotency keys (Stripe model); request fingerprinting; replay semantics;
transactions + row locks (`SELECT ... FOR UPDATE`, gap/next-key locks on unique indexes); `ON DUPLICATE KEY UPDATE` vs
`INSERT IGNORE` lock modes; why app-level "check then insert" races; HTTP 202 Accepted; lock ordering to avoid deadlocks.

**Interview answer:** "The client sends an Idempotency-Key. In one transaction I insert the key row with ON DUPLICATE KEY
UPDATE, which takes an exclusive lock on that primary key, then SELECT FOR UPDATE it. If a response is already
stored I replay it, after checking the request hash matches; otherwise I run the business logic, store the
response on the key row and commit. Concurrent duplicates block on the row lock and then read the committed
response, so 50 simultaneous requests produce exactly one payment. If the process crashes mid-way the transaction
rolls back and the key disappears, so there is no stuck 'processing' state. I also have a unique index
guaranteeing one live payment per order, as a backstop for clients that use a fresh key every time."

**Follow-up: What if the key is claimed but the response was never saved because the server died?** "Nothing
persisted: the key row and the payment were in the same transaction, so both rolled back and the retry is simply
a first request. If I called the provider inline I could not make that claim, which is why the provider call is
moved to a worker behind an outbox."

**Follow-up: Why not Redis SETNX?** "Redis and MySQL cannot commit atomically. A Redis lock with a TTL can expire
while the request is still running, and then a second request does the work again; and if the key is set but the
DB write fails you have a key that blocks a legitimate retry. Putting the key in the same MySQL transaction removes
the whole class."

**Follow-up: Should replays of 4xx responses be stored?** "Deterministic business rejections, yes, so the client sees
a stable answer for a key. 5xx and unknown errors, no: roll back and let the client retry."

**Common mistakes:** check-then-insert; storing the key after the work (no protection during the work); not
hashing the request (same key, different body silently returns the wrong result); making keys global instead of
per-user; calling the provider inside the idempotent transaction; letting the client send the amount.

**Key concepts to remember**

- Idempotency = same key, same effect. The key row's PK is the lock; the stored response is the replay.
- One transaction = claim + work + response. Crash = nothing happened.
- DB constraints as a backstop for logic bugs.

**Revision questions**

1. Which SQL statement takes the lock that serialises duplicates, and why not `INSERT IGNORE`?
2. What does the 49th concurrent duplicate see, step by step?
3. Why is the hash needed if the key already identifies the request?
4. What would break if the provider call were inside this transaction?
5. What purges old keys, and what happens if you never purge?

**Practical task:** write a test that kills the transaction half-way (throw inside the handler after the payment
insert) and asserts that no payment, no outbox row and no key row remain, and that an immediate retry with the same
key succeeds.

- [ ] I can narrate the 50-request race step by step
- [ ] I know the lock mode difference between INSERT IGNORE and ON DUPLICATE KEY UPDATE
- [ ] I wrote the rollback test

---

## Stage 5 - The fake payment provider

**Learning objectives**

- Build a deliberately misbehaving third party so you can test failure handling deterministically.
- Learn what a real PSP integration looks like: idempotent create, async result, signed webhooks, retries.

### Requirements

1. A separate Express service on its own port (`provider/server.js`) with `POST /charges` and `GET /charges/:id`,
   protected by an API key header.
2. `POST /charges` requires an `Idempotency-Key`. The same key returns the SAME charge (no second charge, no
   second webhook).
3. The result is asynchronous: the response is `202 {id, status:'pending'}`; later the provider POSTs a signed
   webhook (`charge.succeeded` or `charge.failed`) to the `callback_url`.
4. Webhooks are delivered at-least-once: retried with backoff until the receiver answers 2xx; optional mode that
   sends every event twice.
5. Deterministic chaos: the LAST TWO DIGITS of `amount_cents` choose the scenario.

| Amount ends with | Behaviour | What it exercises |
|------------------|-----------|-------------------|
| `00`-`95` | success, webhook after ~100ms | happy path |
| `96` | every `POST /charges` answers 503 | retries -> dead-letter queue |
| `97` | accepted, webhook never sent | lost webhook -> reconciliation repair |
| `98` | first 2 POSTs answer 503, then success | transient failure -> retry + backoff |
| `99` | card declined, `charge.failed` webhook | failure path, order stays payable |

6. Test helpers `GET /_stats` and `POST /_reset` (counts charges and attempts, so tests can assert "exactly one charge").
7. The API talks to it through a small client with a hard timeout, distinguishing transient from permanent errors.

### Design decisions

- **Separate process, real HTTP:** the same code path as a real provider; no mocks that hide timeouts.
- **Webhook signature** = `HMAC_SHA256(secret, timestamp + "." + rawBody)`, sent in `X-Provider-Signature` with the
  timestamp in `X-Provider-Timestamp`. Binding the timestamp into the MAC is what makes replay protection possible.
- **Error classification in the client:** timeout/network/5xx/429 -> `ProviderTransientError` (retry);
  other 4xx -> `ProviderPermanentError` (do not retry).
- `GET /charges/:id` tells the "true" outcome even when a webhook was lost; reconciliation relies on that.
- `_stats` / `_reset` are test endpoints. In a real deployment of a fake provider they would be disabled
  (`enableTestEndpoints: false`).

### Code

`src/lib/signature.js` (HMAC sign + verify; used by the provider to sign and by the API to verify):

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

// Signed payload = `${timestamp}.${rawBody}`. Binding the timestamp into the MAC is what makes
// replay protection possible: an attacker cannot reuse an old body with a fresh timestamp.
export function sign(secret, timestamp, rawBody) {
  return 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export function verify({ secret, timestamp, rawBody, signature, toleranceSeconds, nowMs = Date.now() }) {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || !signature) return { ok: false, reason: 'missing_or_malformed_headers' };
  if (Math.abs(nowMs / 1000 - ts) > toleranceSeconds) return { ok: false, reason: 'timestamp_outside_tolerance' };
  const expected = Buffer.from(sign(secret, timestamp, rawBody));
  const given = Buffer.from(String(signature));
  // timingSafeEqual throws on different lengths, so compare lengths first
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'bad_signature' };
  }
  return { ok: true };
}
```

`src/provider/provider.app.js`:

```js
import { randomUUID } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { sign } from '../lib/signature.js';

/**
 * A fake third-party payment provider (think Stripe in miniature). Deliberately behaves badly:
 * the LAST TWO DIGITS of amount_cents select the scenario, so tests and demos are deterministic.
 *
 *   ..00 - 95   charge succeeds, webhook charge.succeeded after a short delay
 *   ..96        every POST /charges answers 503 (provider outage -> retries -> dead-letter queue)
 *   ..97        accepted, but the webhook is NEVER sent (lost webhook -> reconciliation repairs it)
 *   ..98        first 2 POSTs answer 503, the 3rd succeeds (transient outage -> retry+backoff)
 *   ..99        card declined, webhook charge.failed
 *
 * Properties it models: idempotent POST /charges (by Idempotency-Key), asynchronous result via
 * signed webhooks, at-least-once webhook delivery (retries until 2xx; optional duplicates).
 */
export function createProviderApp({
  apiKey,
  webhookSecret,
  webhookDelayMs = 100,
  duplicateWebhooks = false,
  retryBaseMs = 200,
  maxWebhookAttempts = 8,
  enableTestEndpoints = true,
  log = () => {},
}) {
  const charges = new Map();      // chargeId -> charge
  const byIdemKey = new Map();    // Idempotency-Key -> charge
  const attemptsByKey = new Map();
  const stats = { postAttempts: 0, chargesCreated: 0, webhooksSent: 0, webhookFailures: 0 };

  const body = z.object({
    amount_cents: z.number().int().min(1),
    currency: z.string().length(3),
    reference: z.string().min(1),
    callback_url: z.string().url(),
  });

  async function deliver(charge, event) {
    const raw = JSON.stringify(event);
    for (let attempt = 1; attempt <= maxWebhookAttempts; attempt++) {
      const ts = Math.floor(Date.now() / 1000);
      try {
        const res = await fetch(charge.callback_url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-provider-timestamp': String(ts),
            'x-provider-signature': sign(webhookSecret, ts, raw),
          },
          body: raw,
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) { stats.webhooksSent++; return; }
        stats.webhookFailures++;
        log(`webhook ${event.id} got ${res.status}, attempt ${attempt}`);
      } catch (err) {
        stats.webhookFailures++;
        log(`webhook ${event.id} network error ${err.message}, attempt ${attempt}`);
      }
      await new Promise((r) => setTimeout(r, retryBaseMs * 2 ** (attempt - 1)));
    }
  }

  function scheduleWebhook(charge) {
    const tail = charge.amount_cents % 100;
    if (tail === 97) return; // webhook "lost"
    const failed = tail === 99;
    setTimeout(() => {
      charge.status = failed ? 'failed' : 'succeeded';
      const event = {
        id: `evt_${randomUUID()}`,
        type: failed ? 'charge.failed' : 'charge.succeeded',
        data: {
          charge_id: charge.id, reference: charge.reference, amount_cents: charge.amount_cents,
          ...(failed ? { failure_reason: 'card_declined' } : {}),
        },
      };
      deliver(charge, event);
      if (duplicateWebhooks) deliver(charge, event); // same event id twice: consumers must dedupe
    }, webhookDelayMs);
  }

  const app = express();
  app.use(express.json());

  app.post('/charges', (req, res) => {
    stats.postAttempts++;
    if (req.get('x-api-key') !== apiKey) return res.status(401).json({ error: 'bad api key' });
    const idemKey = req.get('idempotency-key');
    if (!idemKey) return res.status(400).json({ error: 'Idempotency-Key required' });
    const parsed = body.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: 'invalid body' });
    const input = parsed.data;

    // idempotency: same key -> same charge, no second charge, no new webhook
    const existing = byIdemKey.get(idemKey);
    if (existing) return res.status(200).json({ id: existing.id, status: existing.status, idempotent_replay: true });

    const tail = input.amount_cents % 100;
    const n = (attemptsByKey.get(idemKey) ?? 0) + 1;
    attemptsByKey.set(idemKey, n);
    if (tail === 96 || (tail === 98 && n <= 2)) return res.status(503).json({ error: 'provider unavailable' });

    const charge = { id: `ch_${randomUUID()}`, status: 'pending', ...input };
    charges.set(charge.id, charge);
    byIdemKey.set(idemKey, charge);
    stats.chargesCreated++;
    scheduleWebhook(charge);
    res.status(202).json({ id: charge.id, status: charge.status });
  });

  app.get('/charges/:id', (req, res) => {
    if (req.get('x-api-key') !== apiKey) return res.status(401).json({ error: 'bad api key' });
    const c = charges.get(req.params.id);
    if (!c) return res.status(404).json({ error: 'no such charge' });
    // reflect the "true" outcome even when the webhook was lost (that is what reconciliation relies on)
    const tail = c.amount_cents % 100;
    const status = c.status !== 'pending' ? c.status : tail === 99 ? 'failed' : tail === 97 ? 'succeeded' : c.status;
    res.json({ id: c.id, status, reference: c.reference, amount_cents: c.amount_cents });
  });

  if (enableTestEndpoints) {
    app.get('/_stats', (_req, res) => res.json(stats));
    app.post('/_reset', (_req, res) => {
      charges.clear(); byIdemKey.clear(); attemptsByKey.clear();
      Object.assign(stats, { postAttempts: 0, chargesCreated: 0, webhooksSent: 0, webhookFailures: 0 });
      res.json({ reset: true });
    });
  }
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return { app, stats };
}
```

`src/provider/server.js`:

```js
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { createProviderApp } from './provider.app.js';

const { app } = createProviderApp({
  apiKey: env.PROVIDER_API_KEY,
  webhookSecret: env.WEBHOOK_SECRET,
  webhookDelayMs: env.PROVIDER_WEBHOOK_DELAY_MS,
  duplicateWebhooks: env.PROVIDER_DUPLICATE_WEBHOOKS === 'true',
  log: (m) => logger.warn({ provider: true }, m),
});
const server = app.listen(env.PROVIDER_PORT, () => logger.info({ port: env.PROVIDER_PORT }, 'fake provider listening'));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
```

`src/provider/client.js` (used by the worker):

```js
import { env } from '../config/env.js';

export class ProviderTransientError extends Error {} // timeout, network, 5xx, 429 -> worth retrying
export class ProviderPermanentError extends Error {} // other 4xx -> retrying cannot help

/**
 * Create a charge at the payment provider. Idempotency-Key = our payment id, so if the response is
 * lost (timeout AFTER the provider created the charge) the retry returns the SAME charge instead of charging twice.
 */
export async function createCharge({ idempotencyKey, amountCents, currency, reference }) {
  let res;
  try {
    res = await fetch(`${env.PROVIDER_URL}/charges`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.PROVIDER_API_KEY, 'idempotency-key': idempotencyKey },
      body: JSON.stringify({ amount_cents: amountCents, currency, reference, callback_url: `${env.API_BASE_URL}/webhooks/provider` }),
      signal: AbortSignal.timeout(env.PROVIDER_TIMEOUT_MS), // never wait forever on a dependency
    });
  } catch (err) {
    throw new ProviderTransientError(`provider unreachable: ${err.message}`);
  }
  if (res.status >= 500 || res.status === 429) throw new ProviderTransientError(`provider returned ${res.status}`);
  if (!res.ok) throw new ProviderPermanentError(`provider rejected request: ${res.status} ${await res.text()}`);
  return res.json(); // { id, status: 'pending' }
}

export async function getCharge(chargeId) {
  const res = await fetch(`${env.PROVIDER_URL}/charges/${encodeURIComponent(chargeId)}`, {
    headers: { 'x-api-key': env.PROVIDER_API_KEY },
    signal: AbortSignal.timeout(env.PROVIDER_TIMEOUT_MS),
  });
  if (!res.ok) throw new ProviderTransientError(`provider lookup returned ${res.status}`);
  return res.json();
}
```

### How it works (Hinglish)

- Provider ek `Map` me `Idempotency-Key -> charge` rakhta hai. Same key dobara aaye to wahi charge milta hai
  (`idempotent_replay: true`). Isi wajah se hamara worker timeout ke baad safely retry kar sakta hai -- provider ne
  charge bana bhi diya ho to duplicate nahi banta.
- Webhook ke liye provider `deliver()` loop chalata hai: non-2xx ya network error par `retryBaseMs * 2^attempt`
  wait karke dobara bhejta hai (max 8 attempts). Yani at-least-once. `duplicateWebhooks` on ho to wahi event do baar jata hai.
- Scenario amount ke last do digits se: tests mein "declined card" ke liye bas `unitPriceCents: 1099` bhej do.

### Acceptance criteria

- [ ] `npm run dev:provider` prints `fake provider listening`
- [ ] Same `Idempotency-Key` twice -> same charge id, second answer has `idempotent_replay: true`
- [ ] Amount 1096 -> 503 every time; 1098 -> 503, 503, then 202
- [ ] A webhook it sends verifies with `verify()` (unit test) and fails if one byte of the body changes

Quick manual check (provider only):

```bash
curl -s -XPOST localhost:4017/charges -H 'x-api-key: provider-key-dev' -H 'idempotency-key: k-1' \
  -H 'content-type: application/json' \
  -d '{"amount_cents":1000,"currency":"USD","reference":"1","callback_url":"http://127.0.0.1:9/none"}'
```

The unit tests for the signature logic (real run):

```text
 [OK] test/unit.test.js > webhook signature > accepts a correct signature
 [OK] test/unit.test.js > webhook signature > rejects a tampered body
 [OK] test/unit.test.js > webhook signature > rejects a wrong secret
 [OK] test/unit.test.js > webhook signature > rejects an old timestamp even with a valid signature (replay)
 [OK] test/unit.test.js > webhook signature > rejects missing headers and different-length signatures without throwing
```

### Interview concepts

Third-party integration design; idempotent create with provider-side keys; asynchronous payment outcomes; webhook
delivery semantics (at-least-once, out-of-order, duplicates); HMAC signatures and constant-time comparison; timeouts and
error classification; contract testing with a fake.

**Interview answer:** "I built a fake provider as a separate service so I could test the nasty cases deterministically:
declines, outages, a succeed-then-lose-the-webhook scenario, and duplicate webhooks. It honours an idempotency key
on charge creation and delivers signed webhooks with retries, exactly like a real PSP. That let me prove that my
worker and webhook consumer are correct under at-least-once delivery rather than assuming it."

**Follow-up: why classify errors as transient vs permanent?** "Retrying a 400 never helps and just burns attempts and
delays the failure; retrying a 503 or a timeout usually does. Permanent errors fail the payment immediately;
transient ones go through backoff and, if exhausted, to the dead-letter queue."

**Common mistakes:** calling the provider without a timeout; retrying non-idempotent calls without an idempotency key
(double charge); treating a timeout as failure (the charge may exist!); no webhook signature verification.

**Key concepts to remember**

- A timeout is an UNKNOWN outcome, not a failure. Idempotency keys make the retry safe.
- Provider results arrive later by webhook; webhooks are duplicated, reordered and can be lost.

**Revision questions**

1. Why must the client treat a timeout as "unknown"?
2. What two things does the timestamp in the signed payload protect against?
3. Which amount endings simulate which failure?
4. Why does `GET /charges/:id` exist in the fake?
5. What would change if the provider supported only polling, not webhooks?

**Practical task:** add a scenario `..95` where the provider sends the webhook BEFORE returning the 202 response to
the charge request (a race). Predict what the system does, then test it (hint: Stage 7's state machine handles it).

- [ ] Provider runs and honours idempotency
- [ ] I understand each chaos scenario
- [ ] I did the `..95` race experiment

---

## Stage 6 - Transactional outbox, relay, BullMQ worker, retries, backoff + jitter, DLQ

**Learning objectives**

- Solve the dual-write problem with the outbox pattern and explain exactly why it is at-least-once.
- Build a worker with bounded retries, full-jitter exponential backoff and a dead-letter path.
- Write consumers that are safe when the same message arrives twice.

### What is BullMQ and why do we need a queue? (Hinglish)

**What:** BullMQ ek Redis-based job queue library hai: producer `queue.add(...)` karta hai, worker process job
uthata hai, fail hone par retry/backoff milta hai. **Why:** provider call dheemi aur unreliable hai -- HTTP request
ke andar karenge to customer ka latency provider ke haath mein chala jaata hai. **Problem solved:** request jaldi
202 de deta hai, kaam background mein hota hai, retries aur dead-letter free milte hain. **How it fits here:** outbox
relay jobs ko `payments` queue mein daalta hai, `worker` process unhe uthata hai. Redis queue ka data MySQL jitna
durable nahi hota -- isliye "source of truth" MySQL hi hai aur outbox usse queue ko feed karta hai.

### Requirements

1. The API never calls the provider. `payment.created` is written to `outbox_events` in the SAME transaction as the payment.
2. A relay (in the worker process) publishes pending outbox rows to BullMQ with `jobId = outbox-<id>` and marks them
   published. A crash between publish and mark must not cause a second charge.
3. The `charge` job: skip unless the payment is `pending`; call the provider with `Idempotency-Key: payment-<id>`; on
   success set `processing` + `provider_ref`.
4. Retries: 5 attempts, exponential backoff with FULL jitter, base 500ms, cap 30s. Only transient errors retry.
5. Permanent provider errors: mark the payment `failed` immediately and do not retry.
6. After the last attempt the job is parked in the dead-letter queue with payload + error; the payment stays `pending`.
   Admin endpoints list and requeue DLQ jobs.
7. `events` queue consumer for `payment.succeeded` / `payment.failed` that is idempotent (SET NX marker).
8. Graceful shutdown: stop the relay, let in-flight jobs finish.

### Design decisions (see ADR 0004)

- **Outbox over "publish after commit":** a crash between commit and publish would lose the job forever. The outbox row
  is durable and is retried by the relay.
- **`FOR UPDATE SKIP LOCKED`** lets several relay instances run in parallel without blocking each other or
  double-publishing a row.
- **Deterministic `jobId`:** BullMQ ignores `add()` with an existing job id (while the job is retained), turning a
  re-publish into a no-op. Retention is finite (`removeOnComplete`), so consumers are idempotent regardless.
- **Full jitter:** `delay = random(0, min(cap, base * 2^(attempt-1)))`. Without jitter, 1000 jobs that failed together
  retry together (thundering herd) and re-crash the provider.
- **Do not guess failure:** when retries are exhausted the outcome at the provider is UNKNOWN (the charge might exist).
  Marking `failed` could let the customer pay twice. Keep `pending`, alert, and let a human or reconciliation decide.
- **Separate process** so slow jobs never block the HTTP event loop.

### Code

`src/lib/backoff.js`:

```js
/**
 * Exponential backoff with FULL jitter: delay = random(0, min(cap, base * 2^(attempt-1))).
 * Full jitter spreads the retries of many failed jobs over time so they do not hit the provider
 * in synchronized waves (thundering herd). `rand` is injectable for tests.
 */
export function backoffWithJitter(attemptsMade, { baseMs, capMs }, rand = Math.random) {
  const ceiling = Math.min(capMs, baseMs * 2 ** Math.max(0, attemptsMade - 1));
  return Math.floor(rand() * ceiling);
}
```

`src/queue/queues.js`:

```js
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { backoffWithJitter } from '../lib/backoff.js';

// BullMQ requires maxRetriesPerRequest: null on blocking connections (workers).
export const makeConnection = () => new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const QUEUES = { payments: 'payments', events: 'events', dlq: 'payments-dlq', maintenance: 'maintenance' };

export const backoffOptions = () => ({ baseMs: env.BACKOFF_BASE_MS, capMs: env.BACKOFF_CAP_MS });

// Passed to the Worker (settings.backoffStrategy). Jobs opt in with { backoff: { type: 'expo-jitter' } }.
export const backoffStrategy = (attemptsMade) => backoffWithJitter(attemptsMade, backoffOptions());

const jobDefaults = {
  attempts: env.JOB_ATTEMPTS,
  backoff: { type: 'expo-jitter' },
  removeOnComplete: { age: 3600, count: 5000 }, // keep a window of completed ids: BullMQ de-dupes by jobId while the job exists
  removeOnFail: { age: 7 * 24 * 3600 },
};

export function createQueues(connection = makeConnection()) {
  const mk = (name, defaultJobOptions) => new Queue(name, { connection, prefix: env.QUEUE_PREFIX, defaultJobOptions });
  return {
    connection,
    payments: mk(QUEUES.payments, jobDefaults),
    events: mk(QUEUES.events, jobDefaults),
    dlq: mk(QUEUES.dlq, { attempts: 1, removeOnFail: false }), // dead-letter parking lot: no worker consumes it
    maintenance: mk(QUEUES.maintenance, { removeOnComplete: 50, removeOnFail: 50 }),
    async close() {
      await Promise.all([this.payments.close(), this.events.close(), this.dlq.close(), this.maintenance.close()]);
      await connection.quit().catch(() => {});
    },
  };
}
```

`src/modules/outbox/relay.js`:

```js
import { withTx } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

// outbox event_type -> [queue, job name]
const ROUTES = {
  'payment.created': ['payments', 'charge'],
  'payment.succeeded': ['events', 'payment.succeeded'],
  'payment.failed': ['events', 'payment.failed'],
};

/**
 * Move up to `limit` pending outbox rows to BullMQ. At-least-once:
 *  - publish first, mark published after. A crash in between re-publishes the row next tick.
 *  - the BullMQ jobId is derived from the outbox id, so re-publishing is a no-op (same jobId is ignored
 *    while the job is retained). Consumers are STILL written idempotent, because retention is finite.
 *  - FOR UPDATE SKIP LOCKED lets several relay instances run side by side without fighting over rows.
 */
export async function relayOnce(queues, limit = 100) {
  return withTx(async (conn) => {
    const [rows] = await conn.query(
      "SELECT id, event_type, payload FROM outbox_events WHERE status = 'pending' ORDER BY id LIMIT ? FOR UPDATE SKIP LOCKED",
      [limit],
    );
    for (const row of rows) {
      const route = ROUTES[row.event_type];
      if (!route) {
        logger.error({ outboxId: row.id, type: row.event_type }, 'no route for outbox event type');
        continue;
      }
      const [queueName, jobName] = route;
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      await queues[queueName].add(jobName, { outboxId: row.id, ...payload }, { jobId: `outbox-${row.id}` });
    }
    if (rows.length) {
      await conn.query(
        "UPDATE outbox_events SET status = 'published', published_at = NOW(3), attempts = attempts + 1 WHERE id IN (?)",
        [rows.map((r) => r.id)],
      );
    }
    return rows.length;
  });
}

export function startRelay(queues, { intervalMs }) {
  let stopped = false;
  let timer;
  const tick = async () => {
    try {
      // drain: keep going while there is a full batch, then sleep
      while (!stopped && (await relayOnce(queues)) === 100);
    } catch (err) {
      logger.error({ err: err.message }, 'outbox relay tick failed, will retry');
    }
    if (!stopped) timer = setTimeout(tick, intervalMs);
  };
  tick();
  return { stop: () => { stopped = true; clearTimeout(timer); } };
}
```

`src/queue/workers.js` (processors, DLQ hook, scheduler):

```js
import { Worker, UnrecoverableError } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { pool } from '../lib/db.js';
import { redis } from '../lib/redis.js';
import { makeConnection, QUEUES, backoffStrategy } from './queues.js';
import { createCharge, ProviderPermanentError } from '../provider/client.js';
import { failPaymentPermanently, markProcessing } from '../modules/payments/settlement.js';
import { runReconciliation } from '../modules/reconcile/reconcile.service.js';

/** payment.created -> ask the provider to charge. Safe to run any number of times for the same payment. */
export async function chargeProcessor(job) {
  const { paymentId, requestId } = job.data;
  const log = logger.child({ jobId: job.id, paymentId, requestId, attempt: job.attemptsMade + 1 });

  const [[p]] = await pool.query('SELECT id, amount_cents, currency, status FROM payments WHERE id = ?', [paymentId]);
  if (!p || p.status !== 'pending') {
    log.info({ status: p?.status }, 'charge skipped: payment is not pending (duplicate delivery or already handled)');
    return { skipped: true };
  }

  try {
    const charge = await createCharge({
      idempotencyKey: `payment-${p.id}`,
      amountCents: Number(p.amount_cents),
      currency: p.currency,
      reference: String(p.id),
    });
    await markProcessing(p.id, charge.id);
    log.info({ chargeId: charge.id }, 'charge accepted by provider');
    return { chargeId: charge.id };
  } catch (err) {
    if (err instanceof ProviderPermanentError) {
      log.warn({ err: err.message }, 'provider rejected the charge permanently; failing payment without retry');
      await failPaymentPermanently(p.id, 'provider_rejected');
      throw new UnrecoverableError(err.message); // tells BullMQ: do NOT retry
    }
    log.warn({ err: err.message }, 'transient provider error; BullMQ will retry with backoff+jitter');
    throw err;
  }
}

/**
 * At-least-once-safe consumer: the same event may arrive twice (relay crash, retry after a slow ack).
 * SET NX on the outbox id turns the second delivery into a no-op. If sending fails we release the
 * marker so the retry can run. (For anything that matters financially, keep the marker in MySQL
 * in the same transaction as the effect; Redis is fine for a notification.)
 */
export async function eventProcessor(job) {
  const marker = `done:event:${job.data.outboxId}`;
  const first = await redis.set(marker, '1', 'EX', 7 * 24 * 3600, 'NX');
  if (!first) {
    logger.info({ outboxId: job.data.outboxId, type: job.name }, 'duplicate event ignored');
    return { duplicate: true };
  }
  try {
    await redis.lpush('notifications:sent', JSON.stringify({ type: job.name, paymentId: job.data.paymentId, userId: job.data.userId }));
    await redis.ltrim('notifications:sent', 0, 999);
    logger.info({ outboxId: job.data.outboxId, type: job.name, paymentId: job.data.paymentId }, 'notification sent');
    return { sent: true };
  } catch (err) {
    await redis.del(marker);
    throw err;
  }
}

export async function maintenanceProcessor() {
  const report = await runReconciliation({ staleMinutes: env.STALE_PAYMENT_MINUTES, repair: true });
  if (report.ok) logger.info({ checks: report.counts }, 'reconciliation clean');
  else logger.error({ issues: report.issues.slice(0, 20), counts: report.counts }, 'RECONCILIATION FOUND MISMATCHES');
  return report.counts;
}

export function startWorkers(queues) {
  const common = { prefix: env.QUEUE_PREFIX, settings: { backoffStrategy } };
  const payments = new Worker(QUEUES.payments, chargeProcessor, { ...common, connection: makeConnection(), concurrency: env.WORKER_CONCURRENCY });
  const events = new Worker(QUEUES.events, eventProcessor, { ...common, connection: makeConnection(), concurrency: env.WORKER_CONCURRENCY });
  const maintenance = new Worker(QUEUES.maintenance, maintenanceProcessor, { ...common, connection: makeConnection(), concurrency: 1 });

  // Dead-letter path: a job that has used all attempts (or threw UnrecoverableError) is parked in
  // payments-dlq with its payload + error so a human can inspect and replay it. BullMQ keeps the failed job too.
  payments.on('failed', async (job, err) => {
    if (!job) return;
    const attempts = job.opts.attempts ?? 1;
    const finalFailure = job.attemptsMade >= attempts || err instanceof UnrecoverableError || err.name === 'UnrecoverableError';
    if (!finalFailure) return;
    try {
      await pool.query('UPDATE payments SET last_error = ? WHERE id = ?', [err.message.slice(0, 500), job.data.paymentId]);
      await queues.dlq.add('dead-charge', {
        originalJobId: job.id, originalName: job.name, data: job.data,
        error: err.message, attemptsMade: job.attemptsMade, failedAt: new Date().toISOString(),
      });
      logger.error({ jobId: job.id, paymentId: job.data.paymentId, attemptsMade: job.attemptsMade }, 'job moved to dead-letter queue');
    } catch (e) {
      logger.error({ err: e.message, jobId: job.id }, 'FAILED TO WRITE TO DLQ');
    }
  });
  for (const w of [payments, events, maintenance]) w.on('error', (e) => logger.error({ err: e.message }, 'worker error'));

  return {
    payments, events, maintenance,
    async close() { await Promise.all([payments.close(), events.close(), maintenance.close()]); },
  };
}

export async function scheduleReconciliation(queues) {
  await queues.maintenance.upsertJobScheduler('reconcile-schedule', { every: env.RECONCILE_EVERY_MS }, { name: 'reconcile' });
}
```

`src/worker-main.js`:

```js
// Background process: outbox relay + BullMQ workers (charge, events, reconciliation schedule).
// Runs separately from the API so a slow provider can never starve HTTP request handling.
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { closeDb } from './lib/db.js';
import { redis } from './lib/redis.js';
import { createQueues } from './queue/queues.js';
import { startRelay } from './modules/outbox/relay.js';
import { startWorkers, scheduleReconciliation } from './queue/workers.js';

const queues = createQueues();
const relay = startRelay(queues, { intervalMs: env.RELAY_INTERVAL_MS });
const workers = startWorkers(queues);
await scheduleReconciliation(queues);
logger.info('worker process started (relay + payments/events/maintenance workers)');

let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  logger.info({ signal }, 'worker shutting down');
  relay.stop();
  await workers.close(); // waits for in-flight jobs to finish
  await queues.close();
  await closeDb();
  redis.disconnect();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

The admin DLQ endpoints live in `src/modules/admin/admin.routes.js` (shown in full in Stage 9).

### How it works (Hinglish)

1. API ne payment + outbox row commit kiya. Ab relay ka loop (`RELAY_INTERVAL_MS`, default 250ms) `status='pending'` rows
   lock karta hai (`SKIP LOCKED`), har row ke liye `queues.payments.add('charge', data, { jobId: 'outbox-<id>' })`, phir
   rows ko `published` mark karke commit.
2. Agar relay `add()` ke baad aur `UPDATE` se pehle mar jaye: transaction rollback, rows `pending` hi rahte hain, agli
   baar dobara `add()` -- same `jobId` isliye BullMQ ignore karta hai. (Test: `outbox relay is crash-safe`.)
3. Worker `chargeProcessor`: payment `pending` nahi hai to skip (duplicate delivery). Provider call fail ho (503/timeout)
   to error throw -> BullMQ `backoffStrategy` ke hisaab se delay karke retry. `ProviderPermanentError` par
   `UnrecoverableError` throw -- BullMQ retry nahi karta.
4. Last attempt fail hone par `failed` event: job ka data `payments-dlq` queue me, `payments.last_error` update.
5. `eventProcessor`: `SET done:event:<outboxId> 1 NX EX 7d`. Pehli baar OK -> notification; dobara aaye to skip. Send fail ho
   to marker `DEL` taaki retry chal sake.

Important subtlety: the relay holds a MySQL transaction open while it calls Redis. That is acceptable at small scale;
at high volume you would select, publish, then update in separate short transactions (still safe, because publish is
idempotent by `jobId`).

### Acceptance criteria

- [ ] After `POST /payments`, within ~1s the payment becomes `processing` then `succeeded` (provider + webhook, Stage 7)
- [ ] `payment.created` is only delivered to the worker AFTER the HTTP transaction committed (outbox row exists first)
- [ ] Amount ..98 (two 503s): payment still succeeds; provider saw exactly 3 POSTs and created 1 charge
- [ ] Amount ..96 (always 503): 5 attempts with growing random delays, then one entry in `GET /admin/dlq`; the payment
      stays `pending` with `last_error` set
- [ ] Re-publishing an already-published outbox row does not create a second charge or second notification
- [ ] SIGTERM on the worker lets the current job finish

Real run: a payment for an item priced 1096 cents against the compose stack (default settings: 5 attempts, base 500ms).
Note the gaps between attempts are random (0.3s, 1.0s, 0.9s, 1.9s), not 0.5/1/2/4: that is the jitter.

```text
--- worker log for this payment (provider answers 503 every time)
07:45:59.871 WARN  transient provider error; BullMQ will retry with backoff+jitter | attempt=1 paymentId=515 err=provider returned 503
07:46:00.167 WARN  transient provider error; BullMQ will retry with backoff+jitter | attempt=2 paymentId=515 err=provider returned 503
07:46:01.176 WARN  transient provider error; BullMQ will retry with backoff+jitter | attempt=3 paymentId=515 err=provider returned 503
07:46:02.078 WARN  transient provider error; BullMQ will retry with backoff+jitter | attempt=4 paymentId=515 err=provider returned 503
07:46:04.004 WARN  transient provider error; BullMQ will retry with backoff+jitter | attempt=5 paymentId=515 err=provider returned 503
07:46:04.022 ERROR job moved to dead-letter queue | attempt=5 paymentId=515 

--- GET /admin/dlq
{"data":[{"id":"1","originalJobId":"outbox-1017","originalName":"charge","data":{"outboxId":1017,"userId":4,"orderId":503,"paymentId":515,"requestId":"1c6142f0-4218-4ad2-ba92-8c26baf5e0ec","amountCents":1096},"error":"provider returned 503","attemptsMade":5,"failedAt":"2026-10-20T07:46:04.020Z"}]}

--- payment row state
{"order":{"id":503,"userId":4,"status":"pending_payment","totalCents":1096,"currency":"USD","items":[{"name":"
+-----+---------+--------------+-----------------------+
| id  | status  | provider_ref | last_error            |
+-----+---------+--------------+-----------------------+
| 515 | pending | NULL         | provider returned 503 |
+-----+---------+--------------+-----------------------+
```

Automated proof (real run):

```text
 [OK] end to end > transient provider errors are retried with backoff and then succeed
 [OK] end to end > provider outage: retries exhausted -> job lands in the DLQ, payment stays pending, admin can replay
 [OK] end to end > outbox relay is crash-safe: re-publishing the same row does not create a second job
 [OK] unit > backoffWithJitter > ceiling doubles per attempt and is capped
 [OK] unit > backoffWithJitter > is fully jittered: anywhere between 0 and the ceiling
```

### Interview concepts

Dual-write problem; transactional outbox; relay/CDC alternatives (Debezium + Kafka); at-least-once vs at-most-once vs
exactly-once (effect); idempotent consumers; retries, exponential backoff, full vs equal jitter, retry budgets;
dead-letter queues and replay; poison messages; `SKIP LOCKED` work-queue pattern; queue durability (Redis AOF/RDB) vs
database durability; backpressure (`concurrency`, rate limiting workers); graceful shutdown.

**Interview answer:** "I never call the payment provider inside the request. The request commits the payment and an
outbox row in one transaction, so I can't have a payment without its event or the reverse. A relay moves outbox rows to
BullMQ with a deterministic job id, then marks them published; if it crashes in between, it just republishes and the job
id makes that harmless. The worker is idempotent: it re-reads the payment and calls the provider with an idempotency
key derived from the payment id. Transient failures retry five times with exponential backoff and full jitter; after
that the job goes to a dead-letter queue and the payment stays pending, because after exhausted retries I do not know
whether the provider charged the customer."

**Follow-up: Is it exactly-once?** "No. Delivery is at-least-once. Exactly-once effect comes from idempotent
consumers: the job id de-dupes the publish, the state check de-dupes the charge, the provider idempotency key
de-dupes at the provider, and a SET NX marker de-dupes notifications."

**Follow-up: Why full jitter instead of a fixed exponential delay?** "A fixed schedule keeps failed jobs synchronised.
When the provider recovers, everyone retries in the same instant and knocks it over again. Random delay between zero
and the exponential ceiling spreads the load; AWS's architecture blog showed full jitter minimises total work and
completion time for contended retries."

**Follow-up: What do you do with DLQ messages?** "Alert on queue depth, investigate the error, fix the cause, then
requeue. My requeue endpoint puts the job back on the main queue with a new id; because the processor re-checks the
payment state, replaying is safe even if the payment was resolved meanwhile."

**Common mistakes:** publishing to the queue after commit without an outbox; relying on exactly-once; no jitter; retrying
permanent errors; infinite retries; no DLQ; marking a payment failed after a timeout; unbounded concurrency; losing
in-flight jobs on deploy (no graceful shutdown).

**Key concepts to remember**

- Outbox = atomic "state change + intent to publish". Relay is at-least-once. Consumers are idempotent.
- Backoff + jitter + max attempts + DLQ = a retry policy you can defend.
- After exhausted retries the outcome is unknown, not failed.

**Revision questions**

1. What exact failure does the outbox prevent that "commit, then publish" does not?
2. Why does `jobId = outbox-<id>` help, and why is it not sufficient on its own?
3. What is the retry delay ceiling on attempt 4 with base 500ms and cap 30s?
4. Why does the payment stay `pending` in the DLQ case?
5. Which processors are idempotent and what makes each one so?
6. What breaks if two relays run without `SKIP LOCKED`?

**Practical task:** make the relay publish in batches OUTSIDE the DB transaction (select ids, publish, then
`UPDATE ... WHERE id IN (...) AND status='pending'`). Prove with a test that killing the process between publish and
update still yields exactly one charge.

- [ ] Outbox + relay + worker run; DLQ demonstrated
- [ ] I can state the retry delay ceiling for each attempt
- [ ] I can explain why the system is at-least-once and still charges once

---

## Stage 7 - Signed webhooks, settlement state machine, double-entry ledger

**Learning objectives**

- Receive third-party webhooks safely: authenticate, reject replays, dedupe, tolerate reordering.
- Make one function the only way a payment can reach a terminal state.
- Post balanced ledger entries inside the same transaction, and find the deadlock that naive posting causes.

### Requirements

1. `POST /webhooks/provider` verifies `X-Provider-Signature` = HMAC-SHA256 of `timestamp.rawBody`, using a constant-time
   compare, and rejects timestamps more than 5 minutes from now (replay protection). Bad -> `401`, nothing changes.
2. The route reads the RAW body (mounted before `express.json()`), then validates the parsed event with zod.
3. Dedupe by `event.id` using `UNIQUE(provider_event_id)`, inserted in the SAME transaction as the state change.
4. Concurrent deliveries of the same event (20 at once): processed exactly once.
5. Different event ids for the same payment, or `charge.failed` after `charge.succeeded`: acknowledged and ignored
   (terminal states never change).
6. Amount in the event must equal the payment amount, otherwise ignored (never credit a different amount).
7. On success, one transaction: payment `succeeded`, order `paid`, outbox `payment.succeeded`, ledger entries
   (capture + settle, 4 rows). On failure: payment `failed`, outbox `payment.failed`, order stays payable.
8. Always answer `200` for a verified event, including duplicates and ignored events.
9. After commit: delete the order's cache key; increment the `payments_total` metric.

### Design decisions (ADR 0005, ADR 0007)

- **Raw body:** HMAC is over bytes. If `express.json()` runs first and you `JSON.stringify` the object again, key
  order/whitespace can change and a valid signature fails (or, worse, you verify something different from what you process).
- **Constant-time compare:** `timingSafeEqual` (after a length check, because it throws on unequal lengths) so response time
  does not leak how many leading bytes matched.
- **Dedupe + effect in one transaction:** if we crash before commit, neither is saved and the provider's retry is processed
  normally. If we crash after commit but before answering, the provider retries and gets "duplicate" -> 200.
- **State machine as the second defence:** even a brand-new event id for an already-finished payment is a no-op.
- **Lock order orders -> payments -> accounts(ascending id)**, same as `createPayment`. The webhook handler first does a plain read
  of `payments.order_id`, then locks the order row, then the payment row.
- **Ledger last, accounts locked up front:** see "The deadlock the load test found" below.
- **Why 200 for duplicates:** a non-2xx tells the provider to retry something we have already handled.
- **`webhook_deliveries` stores every accepted event** with its outcome (`succeeded`, `failed`, `ignored_terminal`, ...)
  -- a free audit trail. Duplicates are not stored again (that is the point of the unique key).

### Code

`src/modules/webhooks/webhooks.routes.js`:

```js
import { Router, raw } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { verify } from '../../lib/signature.js';
import { AppError } from '../../lib/errors.js';
import { settleProviderEvent } from '../payments/settlement.js';

const eventSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(['charge.succeeded', 'charge.failed']),
  data: z.object({
    charge_id: z.string().min(1).max(64),
    reference: z.string().regex(/^\d+$/),
    amount_cents: z.number().int().min(1),
    failure_reason: z.string().max(200).optional(),
  }),
});

export const webhooksRouter = Router();

// IMPORTANT: this router is mounted BEFORE express.json(). We need the exact bytes the provider signed;
// re-serialising a parsed object would change whitespace/key order and break the HMAC.
webhooksRouter.post('/provider', raw({ type: '*/*', limit: '100kb' }), async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

  const check = verify({
    secret: env.WEBHOOK_SECRET,
    timestamp: req.get('X-Provider-Timestamp'),
    signature: req.get('X-Provider-Signature'),
    rawBody,
    toleranceSeconds: env.WEBHOOK_TOLERANCE_SECONDS,
  });
  if (!check.ok) {
    req.log.warn({ reason: check.reason }, 'webhook rejected');
    throw new AppError(401, 'INVALID_SIGNATURE', 'Webhook signature check failed');
  }

  let json;
  try { json = JSON.parse(rawBody); } catch { throw new AppError(400, 'INVALID_JSON', 'Body is not valid JSON'); }
  const event = eventSchema.parse(json);

  const result = await settleProviderEvent(event);
  req.log.info({ eventId: event.id, type: event.type, outcome: result.outcome }, 'webhook processed');
  // Always 200 for a verified event, even when it was a duplicate or ignored: a non-2xx would make
  // the provider retry something we have already dealt with.
  res.status(200).json({ received: true, outcome: result.outcome });
});
```

`src/modules/payments/settlement.js` (the only place a payment becomes terminal):

```js
import { pool, webhookPool, withTx, isDuplicateKey } from '../../lib/db.js';
import { cacheDel, orderKey } from '../../lib/cache.js';
import { paymentsTotal } from '../../lib/metrics.js';
import { addOutboxEvent } from '../outbox/outbox.service.js';
import { postPaymentCapture } from '../ledger/ledger.service.js';

/**
 * The ONLY place a payment moves to a terminal state. Webhooks, the reconciliation repair and the
 * worker's "permanent failure" path all come through here, so the rules live in one spot.
 *
 * State machine (forward only):  pending -> processing -> succeeded | failed
 *                                pending ----------------> succeeded | failed   (webhook beat the worker)
 * Terminal states never change. A late/duplicate/out-of-order event is acknowledged and ignored.
 */
export async function applyProviderEvent(conn, event) {
  const paymentId = Number(event.data.reference);
  const [[peek]] = await conn.query('SELECT order_id FROM payments WHERE id = ?', [paymentId]); // plain read, no lock
  if (!peek) return { outcome: 'ignored_unknown_payment' };

  // Lock order matches createPayment: orders row first, then payments row. Same order everywhere = no deadlock.
  await conn.query('SELECT id FROM orders WHERE id = ? FOR UPDATE', [peek.order_id]);
  const [[payment]] = await conn.query('SELECT * FROM payments WHERE id = ? FOR UPDATE', [paymentId]);

  if (payment.status === 'succeeded' || payment.status === 'failed') {
    return { outcome: 'ignored_terminal', orderId: payment.order_id };
  }

  if (event.type === 'charge.succeeded') {
    if (Number(event.data.amount_cents) !== Number(payment.amount_cents)) {
      return { outcome: 'ignored_amount_mismatch', orderId: payment.order_id }; // never credit a different amount; reconciliation + alerting handle it
    }
    await conn.query(
      "UPDATE payments SET status = 'succeeded', provider_ref = COALESCE(provider_ref, ?) WHERE id = ?",
      [event.data.charge_id, payment.id],
    );
    await conn.query("UPDATE orders SET status = 'paid' WHERE id = ?", [payment.order_id]);
    await addOutboxEvent(conn, {
      aggregateType: 'payment', aggregateId: payment.id, type: 'payment.succeeded',
      payload: { paymentId: payment.id, orderId: payment.order_id, userId: payment.user_id, amountCents: Number(payment.amount_cents) },
    });
    // Ledger LAST: the system accounts (provider_clearing, merchant_revenue) are hot rows touched by every
    // payment. Taking their locks at the end keeps the time we hold them as short as possible.
    await postPaymentCapture(conn, payment);
    return { outcome: 'succeeded', orderId: payment.order_id };
  }

  if (event.type === 'charge.failed') {
    await markFailed(conn, payment, event.data.failure_reason ?? 'declined');
    return { outcome: 'failed', orderId: payment.order_id };
  }
  return { outcome: 'ignored_unknown_type', orderId: payment.order_id };
}

async function markFailed(conn, payment, reason) {
  await conn.query("UPDATE payments SET status = 'failed', failure_reason = ? WHERE id = ?", [reason.slice(0, 200), payment.id]);
  await addOutboxEvent(conn, {
    aggregateType: 'payment', aggregateId: payment.id, type: 'payment.failed',
    payload: { paymentId: payment.id, orderId: payment.order_id, userId: payment.user_id, reason },
  });
}

/**
 * Apply an inbound provider event exactly-once-in-effect.
 * Delivery dedupe (UNIQUE provider_event_id) and the state change commit in ONE transaction:
 *  - crash before commit -> neither is saved -> provider retries -> processed normally
 *  - duplicate delivery   -> second INSERT waits for the first commit, then hits the UNIQUE key -> 'duplicate'
 */
export async function settleProviderEvent(event, { record = true } = {}) {
  const result = await withTx(async (conn) => {
    if (record) {
      try {
        await conn.query(
          "INSERT INTO webhook_deliveries (provider_event_id, event_type, payload, outcome) VALUES (?, ?, ?, 'received')",
          [event.id, event.type, JSON.stringify(event)],
        );
      } catch (err) {
        if (isDuplicateKey(err)) return { outcome: 'duplicate' };
        throw err;
      }
    }
    const applied = await applyProviderEvent(conn, event);
    if (record) await conn.query('UPDATE webhook_deliveries SET outcome = ? WHERE provider_event_id = ?', [applied.outcome, event.id]);
    return applied;
  }, { from: record ? webhookPool : pool });

  // Side effects only AFTER commit: invalidate the cached order, count the business outcome.
  if (result.orderId && (result.outcome === 'succeeded' || result.outcome === 'failed')) {
    await cacheDel(orderKey(result.orderId));
    paymentsTotal.inc({ result: result.outcome });
  }
  return result;
}

/** Worker -> provider gave a permanent 4xx. Mark failed without waiting for a webhook that will never come. */
export async function failPaymentPermanently(paymentId, reason) {
  const orderId = await withTx(async (conn) => {
    const [[peek]] = await conn.query('SELECT order_id FROM payments WHERE id = ?', [paymentId]);
    await conn.query('SELECT id FROM orders WHERE id = ? FOR UPDATE', [peek.order_id]);
    const [[payment]] = await conn.query('SELECT * FROM payments WHERE id = ? FOR UPDATE', [paymentId]);
    if (payment.status !== 'pending' && payment.status !== 'processing') return null;
    await markFailed(conn, payment, reason);
    return payment.order_id;
  });
  if (orderId) {
    await cacheDel(orderKey(orderId));
    paymentsTotal.inc({ result: 'failed' });
  }
}

/** Worker -> provider accepted the charge. Conditional UPDATE: if the webhook already finished the payment, do not move it backwards. */
export async function markProcessing(paymentId, providerRef) {
  await pool.query(
    "UPDATE payments SET status = IF(status = 'pending', 'processing', status), provider_ref = COALESCE(provider_ref, ?) WHERE id = ?",
    [providerRef, paymentId],
  );
}
```

`src/modules/ledger/ledger.service.js`:

```js
import { randomUUID } from 'node:crypto';

/**
 * Post one balanced ledger transaction. `lines` = [{ accountId, direction, amountCents, description, key }].
 * Throws if debits != credits. The unique posting_key makes re-posting the same business event
 * fail with ER_DUP_ENTRY instead of silently double-counting money.
 */
export async function postTransaction(conn, { paymentId, lines }) {
  const debit = lines.filter((l) => l.direction === 'debit').reduce((s, l) => s + l.amountCents, 0);
  const credit = lines.filter((l) => l.direction === 'credit').reduce((s, l) => s + l.amountCents, 0);
  if (debit !== credit || debit === 0) throw new Error(`unbalanced ledger transaction: debit=${debit} credit=${credit}`);

  const txnId = randomUUID();
  for (const l of lines) {
    await conn.query(
      'INSERT INTO ledger_entries (txn_id, payment_id, account_id, direction, amount_cents, description, posting_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [txnId, paymentId, l.accountId, l.direction, l.amountCents, l.description, l.key],
    );
    // cached balance, in the account's normal side: same side as normal_side -> +, opposite -> -
    await conn.query(
      'UPDATE accounts SET balance_cents = balance_cents + IF(normal_side = ?, ?, -?) WHERE id = ?',
      [l.direction, l.amountCents, l.amountCents, l.accountId],
    );
  }
  return txnId;
}

export async function accountIdByCode(conn, code) {
  const [[row]] = await conn.query('SELECT id FROM accounts WHERE code = ?', [code]);
  if (!row) throw new Error(`ledger account missing: ${code}`);
  return row.id;
}

/**
 * Money flow for one successful payment of an order (two balanced transactions):
 *   1. capture:  provider confirms cash   DR provider_clearing  / CR customer_wallet
 *   2. settle:   wallet pays the merchant DR customer_wallet     / CR merchant_revenue
 * Net effect: provider_clearing +amount (we are owed it), merchant_revenue +amount, wallet back to 0.
 */
export async function postPaymentCapture(conn, payment) {
  const clearing = await accountIdByCode(conn, 'sys:provider_clearing');
  const revenue = await accountIdByCode(conn, 'sys:merchant_revenue');
  const wallet = await accountIdByCode(conn, `wallet:${payment.user_id}`);
  const amountCents = Number(payment.amount_cents);
  const pid = payment.id;

  // Lock every account we are about to touch, in ASCENDING ID ORDER, before inserting anything.
  // (Found by the load test: inserting a ledger row takes a shared FK lock on the account row, and a
  // later UPDATE then needs an exclusive lock. Two concurrent payments each holding the shared lock and
  // waiting for the exclusive one = deadlock. A fixed lock order + taking X up front removes it.)
  await conn.query('SELECT id FROM accounts WHERE id IN (?) ORDER BY id FOR UPDATE', [[clearing, revenue, wallet]]);

  await postTransaction(conn, {
    paymentId: pid,
    lines: [
      { accountId: clearing, direction: 'debit', amountCents, description: `provider capture for payment ${pid}`, key: `pay-${pid}-capture-dr` },
      { accountId: wallet, direction: 'credit', amountCents, description: `wallet funded by payment ${pid}`, key: `pay-${pid}-capture-cr` },
    ],
  });
  await postTransaction(conn, {
    paymentId: pid,
    lines: [
      { accountId: wallet, direction: 'debit', amountCents, description: `order ${payment.order_id} paid from wallet`, key: `pay-${pid}-settle-dr` },
      { accountId: revenue, direction: 'credit', amountCents, description: `revenue for order ${payment.order_id}`, key: `pay-${pid}-settle-cr` },
    ],
  });
}
```

### The deadlock the load test found (a real bug, kept in the story on purpose)

In the first version of `postPaymentCapture` there was no `SELECT ... FOR UPDATE` on the accounts, and the ledger was posted
before the order update. Under the Stage 12 load test the API logged `Deadlock found when trying to get lock` thousands of
times (more than 1,800 deadlock errors and about 10,000 `transaction retry` warnings in roughly ten minutes), webhooks answered
500, and the provider's retries kept the system "eventually correct" while throughput collapsed.

Root cause (MySQL InnoDB): `INSERT INTO ledger_entries (..., account_id, ...)` checks the foreign key, which takes a **shared**
lock on the `accounts` row. The next statement `UPDATE accounts SET balance_cents = ...` needs an **exclusive** lock on the same
row. Two transactions can each hold the shared lock and each wait for the exclusive one: a lock-upgrade deadlock. All payments
touch the same two system accounts, so it was guaranteed.

Fix (what the code above does): lock every account the transaction will touch **up front, in ascending id order**, with
`SELECT id FROM accounts WHERE id IN (...) ORDER BY id FOR UPDATE`, and do the ledger posting **last** so the hot rows are held
for as short a time as possible. After the fix: zero deadlocks in the same load test.

Interview lesson: "I found a lock-upgrade deadlock with a load test, not by reading the code. The fix was a consistent lock
order plus taking the exclusive lock first."

### How it works (Hinglish)

- Provider ne `ts.rawBody` ka HMAC bheja. Hum wahi bytes se HMAC banate hain, `timingSafeEqual` se compare. Timestamp 5 min se
  purana ho to reject -- attacker purani valid request dobara nahi bhej sakta (replay).
- `settleProviderEvent`: transaction shuru -> `webhook_deliveries` me `INSERT`. Agar pehle se hai (duplicate key, errno 1062) to
  `{outcome:'duplicate'}` return -- aur 200. Concurrent 20 deliveries: ek INSERT jeet-ta hai, baaki uske commit ka wait karke
  duplicate key paate hain.
- `applyProviderEvent`: order lock, payment lock; agar status already terminal to `ignored_terminal`; amount mismatch to ignore;
  `charge.succeeded` par payment/order update, outbox, aur sabse last ledger. `charge.failed` par sirf payment `failed`.
- Commit ke baad: `cacheDel(order:<id>)` -- DB commit se pehle delete karte to koi reader purani row cache me wapas daal deta.
- Out-of-order: webhook worker ke `processing` update se pehle aa jaye to? `pending -> succeeded` allowed hai, aur worker ka
  `markProcessing` conditional hai (`IF(status='pending','processing',status)`), isliye wo succeeded ko wapas processing nahi karta.

### Acceptance criteria

- [ ] Forged / missing / tampered signature -> 401 and no ledger rows
- [ ] Valid but 1-hour-old signed request -> 401
- [ ] Same event id twice -> `succeeded` then `duplicate`; ledger has 4 rows, not 8
- [ ] Same event id 20x concurrently -> one `succeeded`, nineteen `duplicate`, one `webhook_deliveries` row
- [ ] Second event (new id) for a finished payment -> `ignored_terminal`; `charge.failed` after success cannot undo it
- [ ] Amount mismatch -> `ignored_amount_mismatch`, no ledger
- [ ] A provider that sends EVERY webhook twice still produces 4 ledger rows and 1 notification
- [ ] After payment, `GET /orders/:id` shows `paid` (cache invalidated), account balances: clearing +amount, revenue +amount, wallet 0

Real output (compose stack):

```text
$ webhook with a forged signature
HTTP/1.1 401 Unauthorized
{"error":{"code":"INVALID_SIGNATURE","message":"Webhook signature check failed"}}
```

Automated proof (real run):

```text
 [OK] inbound provider webhooks > valid signature -> payment succeeded, order paid, ledger posted
 [OK] inbound provider webhooks > missing / wrong / tampered signature -> 401 and nothing changes
 [OK] inbound provider webhooks > replay protection: a correctly signed but OLD request is rejected
 [OK] inbound provider webhooks > same event id delivered twice (sequentially) -> second is a recognised duplicate, ledger unchanged
 [OK] inbound provider webhooks > same event id delivered 20x CONCURRENTLY -> processed exactly once
 [OK] inbound provider webhooks > two DIFFERENT event ids for the same payment -> state machine ignores the second (terminal state)
 [OK] inbound provider webhooks > out-of-order: charge.failed arriving after success cannot undo it
 [OK] inbound provider webhooks > amount mismatch is never credited
 [OK] inbound provider webhooks > unknown payment reference is acknowledged (200) and ignored
 [OK] end to end > webhooks are at-least-once: a provider that sends every webhook twice still posts the ledger once
 [OK] end to end > happy path: order becomes paid, 4 balanced ledger rows, account balances correct, reconciliation clean
 [OK] end to end > declined card: payment failed, order stays payable, second attempt with a new key works
```

### Interview concepts

Webhook security (HMAC, constant-time compare, timestamp tolerance, raw body); replay attacks; at-least-once delivery;
dedupe tables; state machines as an idempotency mechanism; out-of-order events; "ack fast, process safely"; double-entry
bookkeeping; lock ordering; shared vs exclusive locks and lock-upgrade deadlocks; foreign keys take locks; load testing
as a correctness tool.

**Interview answer:** "A webhook is authenticated by an HMAC over the timestamp and the raw body, compared in constant time,
with a five-minute tolerance for replay protection. Then, in one transaction, I insert the provider's event id into a table
with a unique constraint and apply the state change. Duplicates hit the unique key and are acknowledged with 200;
concurrent duplicates serialise on that key. As a second defence the payment is a forward-only state machine, so a
different event for an already-finished payment is ignored. That gives exactly-once effect on top of at-least-once delivery."

**Follow-up: What if your handler is slow and the provider times out?** "The transaction may still commit, and the provider
retries; the retry becomes a duplicate and returns 200. In my load test I saw exactly that: thousands of provider-side
timeouts and retries, and the final revenue was still exactly right. The better design for high volume is to persist the
event, answer 200 immediately, and process it from a queue."

**Follow-up: What did your ledger deadlock teach you?** "That foreign keys take shared locks, that a shared-then-exclusive
upgrade on a hot row deadlocks, and that the fix is a fixed lock order with the exclusive lock taken first. And that you only
find it under concurrent load, which is why I run a load test as part of correctness, not only performance."

**Common mistakes:** parsing JSON before verifying; `===` on signatures; no timestamp; dedupe check in a separate transaction
from the effect; returning 4xx/5xx for duplicates; trusting amounts in the event; updating state in place without checking the
current state; posting ledger rows without locking accounts in a fixed order.

**Key concepts to remember**

- Verify (raw bytes + HMAC + timestamp) -> dedupe + effect in one tx -> terminal-state guard -> 200 always.
- A forward-only state machine makes reordering and duplicates harmless.
- Lock in one global order; exclusive first.

**Revision questions**

1. Why must the webhook route be mounted before `express.json()`?
2. What two properties does including the timestamp in the MAC give you?
3. Walk through what happens when the provider delivers the same event on 20 connections at once.
4. Why is the dedupe insert in the same transaction as the state change?
5. Explain the ledger deadlock in two sentences, and the two-part fix.
6. What would you change to acknowledge webhooks faster under load?

**Practical task:** implement the "ack fast" variant: the route only verifies, inserts into `webhook_deliveries` (status `received`),
enqueues a BullMQ job and returns 200; the worker settles. Keep all the existing webhook tests passing (adjust them to wait).

- [ ] I can write the HMAC verification from memory
- [ ] I can explain dedupe-in-same-transaction
- [ ] I can explain the shared->exclusive lock-upgrade deadlock

---

## Stage 8 - Caching with explicit invalidation, rate limiting, keyset pagination

**Learning objectives**

- Cache a read model and invalidate it deliberately instead of hoping the TTL saves you.
- Implement an atomic Redis rate limiter and decide fail-open vs fail-closed.
- Replace OFFSET with keyset (cursor) pagination and understand why it is stable.

### Requirements

1. `GET /orders/:id` is served read-through from Redis (`cache:order:<id>`, TTL 60s). Header `X-Cache: HIT|MISS` for observability.
2. Authorization is applied AFTER the cache read (a cached order of user A is never served to user B).
3. Invalidation: when settlement changes an order, the key is deleted after the DB commit.
4. Redis failure never fails a request: cache falls back to MySQL, rate limiter fails open.
5. Rate limits: global per IP (300/min), `/auth` per IP (20/min), `/payments` per USER (30/min). Exceeding -> `429` with `Retry-After`,
   `X-RateLimit-Limit`, `X-RateLimit-Remaining`. The counter increment and expiry are atomic.
6. `GET /orders` and `GET /payments`: `limit` (1-100, default 20), opaque `cursor`, newest first, returns `{ data, nextCursor }`;
   `nextCursor` is `null` on the last page; a tampered cursor -> `400`.

### Design decisions (ADR 0006)

- **Cache-aside** (application reads cache, falls back to DB, writes cache) is simplest; the app owns invalidation.
- **Delete, don't update, on change** (invalidate then let the next read repopulate) avoids writing a stale value computed from a
  stale read. **After commit**, not before: deleting before commit lets a concurrent reader re-cache the OLD row.
- **Residual race (honest):** a reader that loaded the old row just before the commit can still write it back right after our
  DELETE. The TTL bounds the staleness to 60s. Stronger options: versioned keys, or caching `updated_at` and comparing, or
  deleting twice (second delete after a short delay).
- **Fixed window counter + Lua:** `INCR` and `PEXPIRE` in one script so a crash cannot leave a key without TTL (permanent ban).
  Weakness: up to 2x burst around a window boundary. Alternatives: sliding window log/counter, token bucket (see
  `07_Week7_System_Design.md` Day 2).
- **Fail open:** during a Redis outage we serve traffic unthrottled rather than turning a cache outage into an API outage. For a
  login endpoint under attack you might choose fail-closed. Say which you chose and why.
- **Keyset pagination:** `WHERE user_id = ? AND id < ? ORDER BY id DESC LIMIT n+1`. With index `(user_id, id)` MySQL walks the index from the
  cursor; cost does not grow with page depth (OFFSET 100000 reads and discards 100000 rows) and inserts during paging cannot shift rows.
  We fetch `limit+1` rows to know whether another page exists without `COUNT(*)`.

### Code

`src/lib/cache.js`:

```js
import { redis } from './redis.js';
import { logger } from './logger.js';
import { env } from '../config/env.js';

// Cache-aside for hot read models. Redis problems never break a request: we fall back to MySQL.
export const orderKey = (id) => `cache:order:${id}`;

export async function cacheGet(key) {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn({ err: err.message }, 'cache get failed');
    return null;
  }
}

export async function cacheSet(key, value, ttl = env.ORDER_CACHE_TTL_SECONDS) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.warn({ err: err.message }, 'cache set failed');
  }
}

// Explicit invalidation: called AFTER the DB transaction commits. TTL is only the safety net.
export async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err: err.message }, 'cache del failed');
  }
}
```

`src/middleware/rateLimit.js`:

```js
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

// Fixed-window counter. INCR + PEXPIRE must be atomic, otherwise a crash between them leaves a
// counter with no TTL (blocked forever). A Lua script runs atomically inside Redis.
const SCRIPT = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return { c, redis.call('PTTL', KEYS[1]) }
`;

/**
 * @param {{name:string, max:number, windowMs:number, key:(req)=>string}} opts
 * Fails OPEN: if Redis is down we serve traffic instead of turning a cache outage into an API outage.
 */
export function rateLimit({ name, max, windowMs, key }) {
  return async (req, res, next) => {
    try {
      const k = `rl:${name}:${key(req)}`;
      const [count, ttl] = await redis.eval(SCRIPT, 1, k, windowMs);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      if (count > max) {
        const retryAfter = Math.ceil(Math.max(ttl, 0) / 1000) || 1;
        res.setHeader('Retry-After', retryAfter);
        throw new AppError(429, 'RATE_LIMITED', `Too many requests, retry in ${retryAfter}s`);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn({ err: err.message, limiter: name }, 'rate limiter unavailable, failing open');
    }
    next();
  };
}
```

`src/lib/cursor.js`:

```js
import { badRequest } from './errors.js';

export const encodeCursor = (id) => Buffer.from(JSON.stringify({ id })).toString('base64url');

export function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const { id } = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('bad id');
    return id;
  } catch {
    throw badRequest('INVALID_CURSOR', 'cursor is not valid');
  }
}

/**
 * Keyset pagination over a numeric primary key, newest first.
 * `run(beforeId, limitPlusOne)` must return rows ordered by id DESC.
 * Fetching limit+1 rows tells us whether another page exists without a COUNT(*).
 */
export async function paginate({ cursor, limit }, run) {
  const before = decodeCursor(cursor);
  const rows = await run(before, limit + 1);
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  return { data, nextCursor: hasMore ? encodeCursor(data[data.length - 1].id) : null };
}
```

The cache usage and keyset query are in `src/modules/orders/orders.service.js` (`getOrderForUser`, `listOrders`, shown in Stage 3) and
in `src/modules/payments/payments.service.js` (`listPayments`, Stage 4). The limiter wiring is in `src/app.js` (Stage 1).

### How it works (Hinglish)

- Cache: `getOrderForUser` pehle Redis dekhta hai. MISS par DB se load karke `SET ... EX 60`. Phir ownership check (user ka order hai ya
  admin). Isliye cache hit par bhi dusre user ko 404.
- Invalidate: webhook transaction commit hone ke baad `cacheDel`. Test dekho: order ko do baar GET karo (MISS, HIT), phir payment settle
  hone ke baad GET -> MISS aur status `paid`.
- Rate limiter: Lua script `INCR` karta hai; pehli baar (`c == 1`) `PEXPIRE` lagata hai; `{count, ttl}` return. Count > max to 429 aur
  `Retry-After = ttl` seconds. Redis down ho to `catch` me warn log aur `next()` (fail open).
- Pagination: cursor sirf `{id}` ka base64url. Client cursor ko opaque maane; kal ko cursor ka format badal sakte ho (id + created_at)
  bina API tode.

### Acceptance criteria

- [ ] First `GET /orders/:id` -> `X-Cache: MISS`, second -> `HIT`; user B gets 404 even on a HIT
- [ ] After the payment settles the next read is `MISS` and shows `paid`
- [ ] 5 payment attempts with limit 3 -> responses `202, 409, 409, 429, 429`, `Retry-After > 0`, `X-RateLimit-Remaining: 0`
- [ ] 25 orders, `limit=10` -> exactly 3 pages, 25 unique ids, descending, even though an order was created mid-walk
- [ ] `cursor=garbage` -> 400; `limit=1000` -> 400

Real output (compose stack):

```text
$ GET /orders/:id (first read after payment settled)
HTTP/1.1 200 OK
X-Cache: MISS
{"order":{"id":502,"userId":4,"status":"paid","totalCents":9000,"currency":"USD","items":[{"name":"Keyboard","unitPriceCents":4500,"quantity":2}],"createdAt":"2026-10-20T07:45:46.396Z"}}

$ again
HTTP/1.1 200 OK
X-Cache: HIT

$ GET /payments?limit=1 (keyset page)
{"data":[{"id":514,"orderId":502,"status":"succeeded","amountCents":9000,"currency":"USD","failureReason":null,"createdAt":"2026-10-20T07:45:46.838Z"}],"nextCursor":null}
```

Automated proof (real run):

```text
 [OK] caching with explicit invalidation > MISS then HIT; a hit never leaks to another user
 [OK] inbound provider webhooks > cache invalidation: a cached order flips to paid right after the webhook (no stale read)
 [OK] keyset pagination > walks 25 orders in pages of 10 with no duplicates, stable under concurrent inserts, newest first
 [OK] keyset pagination > rejects a tampered cursor with 400 and an out-of-range limit with 400
 [OK] rate limiting > returns 429 with Retry-After once the per-user payment limit is exceeded
```

### Interview concepts

Cache-aside vs read-through vs write-through; cache invalidation strategies (TTL, explicit, versioned keys); stale reads and the
read/delete race; cache stampede (dog-piling) and mitigations (single-flight, jittered TTL); fail-open vs fail-closed; Redis atomicity
(Lua, `INCR`); rate-limit algorithms (fixed window, sliding window, token bucket, leaky bucket); `429` and `Retry-After`; OFFSET vs keyset
pagination, composite indexes, opaque cursors.

**Interview answer:** "I cache the order read model in Redis for 60 seconds and invalidate it explicitly after the transaction that changes the
order commits; the TTL is only a safety net. Authorization runs after the cache read so a cached object cannot leak. For rate limiting I use an
atomic Lua INCR with expiry, keyed per user on the payments endpoint and per IP elsewhere, returning 429 with Retry-After, and it fails open if
Redis is down. Lists use keyset pagination on the primary key, which stays fast on deep pages and does not skip or repeat rows when new orders
are inserted."

**Follow-up: How would you prevent a cache stampede?** "When a hot key expires, thousands of requests hit the DB at once. Mitigations: single-flight
(one request recomputes, others wait on a lock or promise), stale-while-revalidate, and adding random jitter to TTLs so keys do not expire together."

**Follow-up: Why not update the cache value instead of deleting it?** "An update can write a value computed from an outdated read and then stay wrong
for the whole TTL. Deleting forces the next read to rebuild from the database, which is the source of truth."

**Common mistakes:** invalidating before commit; caching per-user data under a shared key; caching without TTL; separate `INCR` and `EXPIRE` calls;
OFFSET pagination on large tables; exposing raw ids as cursors without validating; rate limiting by IP behind a proxy without `trust proxy`.

**Key concepts to remember**

- Delete after commit; TTL is the safety net; authorize after the cache read.
- Atomic rate-limit counters (Lua); decide fail-open vs fail-closed deliberately.
- Keyset = index seek + limit+1; OFFSET = read and discard.

**Revision questions**

1. Describe the one race that remains in the cache design and what bounds it.
2. Why Lua for the rate limiter instead of two Redis commands?
3. What are the downsides of a fixed window and how would a token bucket fix them?
4. Why does keyset pagination not need `COUNT(*)`?
5. Why does the `/payments` limiter key on user id and `/auth` on IP?

**Practical task:** replace the fixed window with a token bucket in Lua (store `tokens` and `ts` in a hash) and extend the rate limit test to
show a burst of 5 allowed then 1 token per second.

- [ ] Cache hit/miss and invalidation demonstrated
- [ ] 429 with Retry-After demonstrated
- [ ] Keyset walk test passes and I can explain it

---

## Stage 9 - Reconciliation job

**Learning objectives**

- Build the safety net that finds what your other guarantees missed.
- Know the standard ledger invariants and how to check each with one query.

### What is reconciliation? (Hinglish)

**What:** apne records ko ek independent source se compare karna -- yahan "ledger entries" se balances dobara nikalna, aur provider
se payment status poochna. **Why:** koi bhi system 100% perfect nahi: bug, manual DB edit, lost webhook, partial restore. **Problem solved:**
silent money corruption ko alert me badalna. **How it fits:** worker process BullMQ ke repeatable job se har 5 minute chalata hai; admin
`POST /admin/reconcile` se manually bhi chala sakta hai.

### Requirements

1. Detect: unbalanced ledger transactions; cached balance != recomputed balance; succeeded payment without ledger; ledger without succeeded
   payment; ledger total != 2 x payment amount; order/payment status disagreement.
2. Detect payments stuck in `pending`/`processing` longer than N minutes (default 10).
3. Repair stuck payments that have a `provider_ref` by asking the provider (`GET /charges/:id`) and applying the result through the SAME settlement
   function used by webhooks. Everything else is reported, never auto-"fixed" (a human decides about money).
4. Run on a schedule in the worker (`RECONCILE_EVERY_MS`) and on demand (`POST /admin/reconcile?repair=true`). Log at error level when not clean.
5. Return a machine-readable report: `{ ok, counts, issues[] }`.

### Design decisions

- **Independent recomputation:** never reads cached balances as truth; derives from `ledger_entries`.
- **Read-only checks, repair only for the safe case:** a lost webhook is safe to repair (the provider is the authority on charge status).
- **Same code path for repair and webhook:** `settleProviderEvent(event, { record: false })` with a synthetic event id, so state-machine rules apply.
- **Scheduled via BullMQ job scheduler** (`upsertJobScheduler`), so only one worker runs it per interval even with many worker replicas.

### Code

`src/modules/reconcile/reconcile.service.js`:

```js
import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import { getCharge } from '../../provider/client.js';
import { settleProviderEvent } from '../payments/settlement.js';

/**
 * Reconciliation = independently re-derive the truth and compare it with what the system claims.
 * It never trusts cached balances or status flags; it recomputes from ledger_entries.
 * Each check is a read-only query returning offending rows (empty = healthy).
 */
const CHECKS = {
  // every ledger transaction must balance: sum(debit) = sum(credit)
  unbalanced_transactions: `
    SELECT txn_id,
           CAST(SUM(IF(direction = 'debit',  amount_cents, 0)) AS SIGNED) AS debits,
           CAST(SUM(IF(direction = 'credit', amount_cents, 0)) AS SIGNED) AS credits
    FROM ledger_entries GROUP BY txn_id
    HAVING debits <> credits`,

  // cached accounts.balance_cents must equal the balance recomputed from entries
  balance_drift: `
    SELECT a.id AS account_id, a.code, a.balance_cents AS cached,
           CAST(COALESCE(SUM(IF(le.direction = a.normal_side, le.amount_cents, -le.amount_cents)), 0) AS SIGNED) AS computed
    FROM accounts a LEFT JOIN ledger_entries le ON le.account_id = a.id
    GROUP BY a.id, a.code, a.balance_cents, a.normal_side
    HAVING computed <> a.balance_cents`,

  // money was confirmed (payment succeeded) but never recorded
  succeeded_without_ledger: `
    SELECT p.id AS payment_id, p.amount_cents FROM payments p
    WHERE p.status = 'succeeded'
      AND NOT EXISTS (SELECT 1 FROM ledger_entries le WHERE le.payment_id = p.id)`,

  // ledger says money moved but the payment is not succeeded
  ledger_without_succeeded: `
    SELECT DISTINCT le.payment_id FROM ledger_entries le
    JOIN payments p ON p.id = le.payment_id WHERE p.status <> 'succeeded'`,

  // the ledger total for a payment must equal 2x the payment amount (capture + settle), per side
  amount_mismatch: `
    SELECT p.id AS payment_id, p.amount_cents,
           CAST(SUM(IF(le.direction = 'debit', le.amount_cents, 0)) AS SIGNED) AS ledger_debits
    FROM payments p JOIN ledger_entries le ON le.payment_id = p.id
    WHERE p.status = 'succeeded'
    GROUP BY p.id, p.amount_cents
    HAVING ledger_debits <> 2 * p.amount_cents`,

  // order state must agree with payment state
  order_payment_disagree: `
    SELECT o.id AS order_id, o.status AS order_status FROM orders o
    WHERE (o.status = 'paid' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'succeeded'))
       OR (o.status = 'pending_payment' AND EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'succeeded'))`,
};

export async function runReconciliation({ staleMinutes = 10, repair = false } = {}) {
  const issues = [];
  const counts = {};

  for (const [name, sql] of Object.entries(CHECKS)) {
    const [rows] = await pool.query(sql);
    counts[name] = rows.length;
    for (const row of rows) issues.push({ check: name, ...row });
  }

  // Stuck payments: the provider accepted a charge but we never saw the webhook (lost / dropped).
  const [stale] = await pool.query(
    "SELECT id, status, provider_ref, amount_cents FROM payments WHERE status IN ('pending','processing') AND updated_at < NOW(3) - INTERVAL ? MINUTE",
    [staleMinutes],
  );
  counts.stale_payments = stale.length;
  counts.repaired = 0;
  for (const p of stale) {
    if (repair && p.provider_ref) {
      try {
        const charge = await getCharge(p.provider_ref);
        if (charge.status === 'succeeded' || charge.status === 'failed') {
          // same code path as a webhook; synthetic event id so it is also deduped (record=false: no delivery row)
          await settleProviderEvent(
            { id: `recon-${p.provider_ref}`, type: `charge.${charge.status}`, data: { reference: String(p.id), charge_id: p.provider_ref, amount_cents: Number(p.amount_cents) } },
            { record: false },
          );
          counts.repaired++;
          logger.warn({ paymentId: p.id, providerStatus: charge.status }, 'reconciliation repaired a stale payment from provider state');
          continue;
        }
      } catch (err) {
        logger.warn({ paymentId: p.id, err: err.message }, 'reconciliation could not query provider');
      }
    }
    issues.push({ check: 'stale_payment', payment_id: p.id, status: p.status, provider_ref: p.provider_ref });
  }

  return { ok: issues.length === 0, counts, issues, ranAt: new Date().toISOString() };
}
```

`src/modules/admin/admin.routes.js` (ledger paging, accounts, reconcile, DLQ list/requeue):

```js
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../lib/db.js';
import { paginate } from '../../lib/cursor.js';
import { notFound } from '../../lib/errors.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { runReconciliation } from '../reconcile/reconcile.service.js';
import { env } from '../../config/env.js';

const listQuery = z.object({ cursor: z.string().max(200).optional(), limit: z.coerce.number().int().min(1).max(200).default(50) });

export function adminRouter({ queues }) {
  const r = Router();
  r.use(authenticate, requireRole('admin'));

  // ledger is append-only; admins page through it newest-first with a keyset cursor
  r.get('/ledger', async (req, res) => {
    const q = listQuery.parse(req.query);
    res.json(
      await paginate(q, async (before, take) => {
        const [rows] = await pool.query(
          `SELECT id, txn_id AS txnId, payment_id AS paymentId, account_id AS accountId, direction,
                  amount_cents AS amountCents, description FROM ledger_entries ${before ? 'WHERE id < ?' : ''} ORDER BY id DESC LIMIT ?`,
          before ? [before, take] : [take],
        );
        return rows;
      }),
    );
  });

  r.get('/accounts', async (_req, res) => {
    const [rows] = await pool.query('SELECT id, code, type, normal_side AS normalSide, balance_cents AS balanceCents FROM accounts ORDER BY id');
    res.json({ data: rows });
  });

  r.post('/reconcile', async (req, res) => {
    const repair = req.query.repair === 'true';
    res.json(await runReconciliation({ staleMinutes: env.STALE_PAYMENT_MINUTES, repair }));
  });

  r.get('/dlq', async (_req, res) => {
    const jobs = await queues.dlq.getJobs(['waiting', 'delayed', 'failed', 'completed'], 0, 99);
    res.json({ data: jobs.map((j) => ({ id: j.id, ...j.data })) });
  });

  // Replay a dead job: put the charge back on the main queue under a NEW job id. The processor
  // re-checks payment state, so replaying something that already succeeded is harmless.
  r.post('/dlq/:id/requeue', async (req, res) => {
    const job = await queues.dlq.getJob(req.params.id);
    if (!job) throw notFound('DLQ job');
    await queues.payments.add('charge', job.data.data, { jobId: `replay-${job.data.data.paymentId}-${Date.now()}` });
    await job.remove();
    res.json({ requeued: true, paymentId: job.data.data.paymentId });
  });

  return r;
}
```

### How it works (Hinglish)

Har check ek SQL query hai jo "galat rows" return karta hai; empty = theek. `balance_drift`: account ke `balance_cents` ko
`SUM(IF(direction = normal_side, +amount, -amount))` se compare karta hai. `unbalanced_transactions`: `GROUP BY txn_id HAVING debits <> credits`.
Stuck payments: `status IN ('pending','processing') AND updated_at < NOW() - INTERVAL n MINUTE`; `repair=true` aur `provider_ref` ho to provider
se poochkar settle karta hai.

### Acceptance criteria

- [ ] Healthy system: `ok: true`, all counts 0
- [ ] Hand-edited balance (+500 on revenue) -> `balance_drift: 1`, with cached vs computed numbers
- [ ] Deleted ledger row -> `unbalanced_transactions: 1`; wiped ledger -> `succeeded_without_ledger: 1`; order flipped back -> `order_payment_disagree: 1`
- [ ] Payment with a lost webhook, stuck for an hour: report shows `stale_payment`; with `repair` it becomes `succeeded`, ledger posted, `ok: true`
- [ ] The scheduled job logs `reconciliation clean` in the worker

Real output (compose stack, after the load test):

```text
$ POST /admin/reconcile   (healthy system, after the load test)
{
 "ok": true,
 "counts": {
  "unbalanced_transactions": 0,
  "balance_drift": 0,
  "succeeded_without_ledger": 0,
  "ledger_without_succeeded": 0,
  "amount_mismatch": 0,
  "order_payment_disagree": 0,
  "stale_payments": 0,
  "repaired": 0
 },
 "issues": []
}

$ mysql> UPDATE accounts SET balance_cents = balance_cents + 500 WHERE code = 'sys:merchant_revenue';    (someone "fixes" a balance by hand)

$ POST /admin/reconcile
{
 "ok": false,
 "counts": {
  "unbalanced_transactions": 0,
  "balance_drift": 1,
  "succeeded_without_ledger": 0,
  "ledger_without_succeeded": 0,
  "amount_mismatch": 0,
  "order_payment_disagree": 0,
  "stale_payments": 0,
  "repaired": 0
 },
 "issues": [
  {
   "check": "balance_drift",
   "account_id": 2,
   "code": "sys:merchant_revenue",
   "cached": 511500,
   "computed": 511000
  }
 ]
}

$ (restored the balance, reconciliation clean again)
true
```

Automated proof (real run):

```text
 [OK] reconciliation detects ledger mismatches > clean after a normal payment; flags drift, unbalanced txn, missing ledger, and order/payment disagreement when we corrupt data
 [OK] end to end > lost webhook: payment sticks in processing, reconciliation asks the provider and repairs it
```

### Interview concepts

Reconciliation in fintech (internal vs external); invariants; eventual consistency safety nets; detective vs preventive controls; idempotent repair; alerting on
invariant violations; auditability; why you do not auto-correct money.

**Interview answer:** "Preventive controls (constraints, idempotency, transactions) can still be defeated by bugs or manual edits, so I added a detective
control: a reconciliation job that recomputes balances from the ledger, checks that every ledger transaction balances, that every succeeded payment has ledger
entries and vice versa, and that orders and payments agree. It also finds payments stuck for too long and repairs them by asking the provider. In my tests I
corrupt data on purpose and assert each corruption is detected."

**Follow-up: Why not auto-fix a balance drift?** "A mismatch means one of two things is wrong and the system cannot know which: the cache or the entries. Silently
'fixing' either can destroy evidence or compound an error. We alert and a human decides. The one automatic repair is the lost-webhook case, because the provider is the
authority."

**Common mistakes:** trusting cached balances; reconciling only totals (not per transaction); auto-correcting; running without alerts; running heavy queries in
the request path of the API.

**Key concepts to remember**

- Prevent (constraints/idempotency) + detect (reconciliation) + repair only the provably safe cases.
- Every check is a query that returns offenders.

**Revision questions**

1. Name four ledger invariants and the query shape for each.
2. Why is the lost-webhook repair safe to automate and the balance drift not?
3. Why does the repair reuse `settleProviderEvent`?
4. How does the BullMQ scheduler avoid running reconciliation twice with two workers?
5. What would you alert on, and at what severity?

**Practical task:** add a check "payment older than 24h still `pending` with NO outbox/job" (a lost job) and a test that creates it by deleting the outbox row.

- [ ] Healthy and corrupted reports seen
- [ ] I can write each invariant query myself
- [ ] I understand why repair is limited

---

## Stage 10 - Observability: structured logs, correlation ids, three metrics

**Learning objectives**

- Make the system explain itself in production: logs you can search, a request id that follows work across processes, and a few metrics that answer real questions.
- Choose metrics deliberately (RED / business / pipeline health) instead of exporting everything.

### Requirements

1. JSON logs (pino) on every process; HTTP access logs with `req.id`, status and `responseTime`; secrets redacted
   (`authorization`, `cookie`, `password`).
2. **Correlation id:** reuse the caller's `X-Request-Id` or generate one; echo it in the response; store it in the outbox payload so the
   worker's log lines for the charge carry the SAME id. (This is a poor man's distributed trace. A real tracer such as OpenTelemetry adds
   spans and timing; see `15_Observability_Cloud_CICD.md`.)
3. Exactly three custom metrics exposed at `GET /metrics` (Prometheus text format):
   - `http_request_duration_seconds` (histogram: method, route PATTERN, status code) -- Rate, Errors, Duration (RED).
   - `payments_total{result}` (counter: `created`, `replayed`, `succeeded`, `failed`) -- the business metric.
   - `outbox_pending_events` (gauge, computed at scrape time) -- pipeline health: if it keeps growing the relay/queue is stuck.
   (`prom-client` default process metrics are also registered: CPU, memory, event loop lag.)
4. Log levels mean something: 5xx -> error, 4xx -> warn, success -> info; `/health` and `/metrics` are not access-logged.

### Design decisions

- **Route pattern as the label** (`/orders/:id`), never the raw URL: raw URLs create unbounded label cardinality and melt Prometheus.
- **Business metric over vanity metric:** `payments_total{result="replayed"}` rising sharply means clients are retrying a lot -- a signal about
  the network or a client bug, invisible in generic HTTP metrics.
- **Gauge with `collect()`:** the value is read from MySQL only when scraped, so there is no background timer to forget.
- **Slim request serializer:** log `id, method, url` and status only. Dumping all headers makes lines large and risks leaking secrets.
- **Why the id travels through the queue:** debugging "which request created this charge?" at 3 AM is a `grep` instead of a guess.

### Code

`src/lib/metrics.js`:

```js
import client from 'prom-client';
import { pool } from './db.js';

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry }); // process_*, nodejs_eventloop_lag_seconds ...

// 1. RED: Rate / Errors / Duration of every HTTP route (label by ROUTE PATTERN, never the raw URL)
export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency by route',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

// 2. Business metric: what happened to payments (created / replayed / succeeded / failed)
export const paymentsTotal = new client.Counter({
  name: 'payments_total',
  help: 'Payments by result',
  labelNames: ['result'],
  registers: [registry],
});

// 3. Pipeline health: events committed but not yet handed to the queue. Rising value = relay is stuck.
export const outboxPending = new client.Gauge({
  name: 'outbox_pending_events',
  help: 'Outbox rows with status=pending',
  registers: [registry],
  async collect() {
    const [[row]] = await pool.query("SELECT COUNT(*) AS n FROM outbox_events WHERE status = 'pending'");
    this.set(row.n);
  },
});

export function httpMetricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched';
    end({ method: req.method, route, status_code: res.statusCode });
  });
  next();
}
```

The logging setup is in `src/lib/logger.js` (Stage 1) and the `pino-http` configuration in `src/app.js` (Stage 1); the worker adds the
request id to its child logger in `chargeProcessor` (`src/queue/workers.js`, Stage 6).

### How it works (Hinglish)

- `genReqId`: header `x-request-id` mila to wahi, warna UUID. Response me wapas bhi jata hai, taaki frontend/support ke paas wahi id ho.
- `createPayment` outbox payload me `requestId: req.id` rakhta hai; relay use job data me copy karta hai; worker `logger.child({ requestId })`
  banata hai. Isse API log aur worker log ek hi id se jud jaate hain.
- Histogram `startTimer()` `res.on('finish')` par end hota hai, route label `req.baseUrl + req.route.path`. Match na ho to `unmatched`
  (404 scanners ki wajah se cardinality nahi phatti).

### Acceptance criteria

- [ ] `curl /metrics` shows the three metrics; after one payment `payments_total{result="created"}` and `{result="succeeded"}` are 1
- [ ] One `requestId` appears in an API log line AND in the worker's `charge accepted by provider` line
- [ ] `outbox_pending_events` returns to 0 shortly after a burst of payments
- [ ] No `authorization` header or password ever appears in logs

Real output (compose stack, after the load test and demos):

```text
--- one request id across API and worker logs (payment 514)
requestId=2a579d26-a28d-40d0-9545-9224f63d3cf8
{"level":30,"time":1792482346856,"service":"payments-orders","req":{"id":"2a579d26-a28d-40d0-9545-9224f63d3cf8","method":"POST","url":"/payments"},"res":{"statusCode":202},"responseTime":31,"msg":"request completed"}
{"level":30,"time":1792482346894,"service":"payments-orders","jobId":"outbox-1015","paymentId":514,"requestId":"2a579d26-a28d-40d0-9545-9224f63d3cf8","attempt":1,"chargeId":"ch_2d1dbcaf-285f-4795-875a-bf0f7c5bd895","msg":"charge accepted by provider"}

--- /metrics (the 3 custom metrics)
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum{method="POST",route="/payments/",status_code="202"} 2000.8396320230024
http_request_duration_seconds_count{method="POST",route="/payments/",status_code="202"} 3503
# TYPE payments_total counter
payments_total{result="created"} 503
payments_total{result="succeeded"} 502
payments_total{result="replayed"} 3000
# TYPE outbox_pending_events gauge
outbox_pending_events 0
```

### Interview concepts

The three pillars (logs, metrics, traces); RED vs USE methods; label cardinality; correlation/trace ids and context propagation across async
boundaries (HTTP -> DB -> queue -> worker); structured logging; log levels; SLIs/SLOs and burn-rate alerts; Prometheus pull model and
histograms (p95/p99 from buckets); what NOT to log (PII, secrets, card data -- PCI).

**Interview answer:** "Every request gets a correlation id that I put in the log context and in the outbox payload, so the worker's log lines
for that charge carry the same id and I can follow one payment across the API, the queue and the worker with a single search. I export three
metrics on purpose: request duration by route for the RED view, a payments counter by result as the business signal, and the outbox backlog as a
gauge because it is the earliest sign that async processing has stalled. I alert on the backlog and on a rise in failed or replayed payments,
not on CPU."

**Follow-up: what would you alert on for this system?** "Page: outbox backlog above a threshold for 5 minutes; DLQ depth greater than zero;
reconciliation reporting any non-zero invariant count; p99 of POST /payments above SLO; 5xx rate. Ticket: replay ratio unusually high; webhook
signature failures spiking (possible attack or secret mismatch)."

**Common mistakes:** unbounded label values (user ids, raw URLs); `console.log`; logging request bodies with card or password data; no id linking
async work to its trigger; alerting on resource usage instead of user-visible symptoms.

**Key concepts to remember**

- Log JSON with a correlation id; propagate it through queues.
- Few, meaningful metrics: RED + one business metric + one pipeline-health gauge.
- Label by route pattern, never raw path.

**Revision questions**

1. Why is `outbox_pending_events` a good alerting metric?
2. What breaks if you label the histogram with the raw URL?
3. How does the request id get from the HTTP request to the worker log?
4. Which fields do we redact and why?
5. How would you turn this correlation id into a real OpenTelemetry trace?

**Practical task:** add a fourth metric `queue_job_failures_total{queue}` incremented in the worker's `failed` handler and expose the worker's
metrics on port 9101. Add a Prometheus + Grafana pair to a second compose file (see `15_Observability_Cloud_CICD.md`).

- [ ] Three metrics scraped
- [ ] Correlation id followed across API and worker
- [ ] I can justify each metric to an interviewer

---

## Stage 11 - Tests (including 50 duplicate requests -> exactly one charge) and a mutation check

**Learning objectives**

- Test the guarantees that matter against REAL MySQL and Redis, not mocks.
- Prove a test can fail by deliberately breaking the code (mutation check).

### Requirements

1. Vitest 3 + Supertest. `npm test` runs everything; it is the command you put in CI.
2. Real dependencies: database `payments_test` and Redis DB 1 (separate from dev data), cleaned before each test.
3. Unit tests: backoff + jitter, HMAC signature verify (valid, tampered, wrong secret, replay, malformed), cursor encode/decode, request hash.
4. Integration tests (API only): auth + RBAC, idempotency (missing key, replay, different body, per-user scope, backstop), concurrency
   (50 same key; 50 different keys), cache hit/miss + no leak, keyset pagination under inserts, rate limit 429.
5. Webhook tests: signature, replay, duplicate sequential and 20x concurrent, different event id, out-of-order, amount mismatch, unknown payment,
   cache invalidation; reconciliation detects four corruptions.
6. End-to-end tests with the whole pipeline in one process (API listening on a port, fake provider, relay, BullMQ workers): happy path with ledger
   and balances; **50 duplicate requests -> exactly 1 payment, 1 provider charge, 4 ledger rows**; declined; flaky provider retry; outage -> DLQ ->
   requeue; duplicate webhooks; lost webhook repaired by reconciliation; relay crash-safety.
7. Tests are independent of timing luck: they poll with `waitFor()` instead of fixed sleeps (a few short settle sleeps are used only to give
   WRONG duplicate work time to appear before asserting it did not).

### Design decisions

- **Files run one at a time** (`fileParallelism: false`) because they share one database.
- **Config injected through `vitest.config.js` `test.env`**, so the production `env.js` is exercised too.
- **The e2e stack uses the production code** (`createApp`, `startRelay`, `startWorkers`) with tiny backoff (20ms base) and 4 attempts.
- **Assertions on the database**, not only on HTTP responses: counts of payments, outbox rows, ledger rows, idempotency rows.
- **Mutation check:** temporarily replace the idempotency implementation with a naive "check then insert" and confirm the concurrency test FAILS.

### Code

`vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';

// Tests run against REAL MySQL and Redis (docker compose up -d mysql redis), on a separate database
// (payments_test) and Redis DB 1. Mocks would not prove locking, unique keys or queues work.
export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    fileParallelism: false, // files share one database; run them one at a time
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DB_HOST: '127.0.0.1',
      DB_PORT: '33066',
      DB_USER: 'app',
      DB_PASSWORD: 'app',
      DB_NAME: 'payments_test',
      DB_POOL: '30',
      REDIS_URL: 'redis://127.0.0.1:63793/1',
      QUEUE_PREFIX: 'captest',
      JWT_SECRET: 'test-secret-0123456789abcdef',
      BCRYPT_COST: '4',
      PROVIDER_URL: 'http://127.0.0.1:4117',
      PROVIDER_API_KEY: 'test-provider-key',
      PROVIDER_TIMEOUT_MS: '1000',
      WEBHOOK_SECRET: 'whsec_test_0123456789abcdef',
      API_BASE_URL: 'http://127.0.0.1:3117',
      JOB_ATTEMPTS: '4',
      BACKOFF_BASE_MS: '20',
      BACKOFF_CAP_MS: '200',
      RELAY_INTERVAL_MS: '50',
      PAYMENT_RATE_MAX: '1000',
      GLOBAL_RATE_MAX: '100000',
      AUTH_RATE_MAX: '1000',
    },
  },
});
```

`test/helpers.js`:

```js
import request from 'supertest';
import { pool } from '../src/lib/db.js';
import { redis } from '../src/lib/redis.js';
import { createApp } from '../src/app.js';
import { createQueues } from '../src/queue/queues.js';
import { startRelay } from '../src/modules/outbox/relay.js';
import { startWorkers } from '../src/queue/workers.js';
import { createProviderApp } from '../src/provider/provider.app.js';

export async function resetAll() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['ledger_entries', 'webhook_deliveries', 'outbox_events', 'idempotency_keys', 'payments', 'order_items', 'orders', 'accounts', 'users']) {
    await pool.query(`DELETE FROM ${t}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  await pool.query("INSERT INTO accounts (code, type, normal_side) VALUES ('sys:provider_clearing','provider_clearing','debit'), ('sys:merchant_revenue','merchant_revenue','credit')");
  await redis.flushdb();
}

let seq = 0;
export async function makeUser(app, { admin = false } = {}) {
  const email = `user${Date.now()}_${++seq}@test.dev`;
  const password = 'password123';
  const reg = await request(app).post('/auth/register').send({ email, password });
  if (admin) await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [reg.body.user.id]);
  const login = await request(app).post('/auth/login').send({ email, password });
  return { id: reg.body.user.id, email, token: login.body.accessToken, auth: { Authorization: `Bearer ${login.body.accessToken}` } };
}

export const makeOrder = async (app, user, unitPriceCents = 1000, quantity = 1) =>
  (await request(app).post('/orders').set(user.auth).send({ items: [{ name: 'Thing', unitPriceCents, quantity }] })).body.order;

export const pay = (app, user, orderId, key) =>
  request(app).post('/payments').set(user.auth).set('Idempotency-Key', key).send({ orderId });

export async function waitFor(fn, { timeout = 10000, interval = 50, label = 'condition' } = {}) {
  const start = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - start > timeout) throw new Error(`timed out waiting for ${label}`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

/**
 * Whole system in one process: API (real listener, so provider webhooks can call it), fake provider,
 * outbox relay, BullMQ workers. Same code paths as production, with tiny backoff delays.
 */
export async function startStack(providerOpts = {}) {
  const queues = createQueues();
  const app = createApp({ queues });
  const apiServer = await new Promise((res) => { const s = app.listen(3117, '127.0.0.1', () => res(s)); });
  const provider = createProviderApp({
    apiKey: 'test-provider-key', webhookSecret: 'whsec_test_0123456789abcdef', webhookDelayMs: 30, retryBaseMs: 50, ...providerOpts,
  });
  const providerServer = await new Promise((res) => { const s = provider.app.listen(4117, '127.0.0.1', () => res(s)); });
  const relay = startRelay(queues, { intervalMs: 50 });
  const workers = startWorkers(queues);
  return {
    app, queues, provider, stats: provider.stats,
    async stop() {
      relay.stop();
      await workers.close();
      await queues.close();
      await new Promise((r) => apiServer.close(r));
      await new Promise((r) => providerServer.close(r));
    },
  };
}
```

`test/unit.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { backoffWithJitter } from '../src/lib/backoff.js';
import { sign, verify } from '../src/lib/signature.js';
import { encodeCursor, decodeCursor } from '../src/lib/cursor.js';
import { stableStringify, requestHash } from '../src/lib/hash.js';

describe('backoffWithJitter', () => {
  const o = { baseMs: 100, capMs: 1000 };
  it('ceiling doubles per attempt and is capped', () => {
    const max = (n) => backoffWithJitter(n, o, () => 0.999999);
    expect([1, 2, 3, 4, 5, 6].map(max)).toEqual([99, 199, 399, 799, 999, 999]);
  });
  it('is fully jittered: anywhere between 0 and the ceiling', () => {
    expect(backoffWithJitter(3, o, () => 0)).toBe(0);
    const samples = Array.from({ length: 200 }, () => backoffWithJitter(3, o));
    expect(Math.min(...samples)).toBeLessThan(100);
    expect(Math.max(...samples)).toBeLessThan(400);
    expect(new Set(samples).size).toBeGreaterThan(50); // not all identical
  });
});

describe('webhook signature', () => {
  const secret = 'whsec_unit_0123456789';
  const now = 1_800_000_000_000;
  const ts = String(now / 1000);
  const body = '{"id":"evt_1"}';
  const base = { secret, timestamp: ts, rawBody: body, toleranceSeconds: 300, nowMs: now };

  it('accepts a correct signature', () => {
    expect(verify({ ...base, signature: sign(secret, ts, body) })).toEqual({ ok: true });
  });
  it('rejects a tampered body', () => {
    expect(verify({ ...base, rawBody: '{"id":"evt_2"}', signature: sign(secret, ts, body) }).reason).toBe('bad_signature');
  });
  it('rejects a wrong secret', () => {
    expect(verify({ ...base, signature: sign('other_secret_0123456', ts, body) }).reason).toBe('bad_signature');
  });
  it('rejects an old timestamp even with a valid signature (replay)', () => {
    const old = String(now / 1000 - 301);
    expect(verify({ ...base, timestamp: old, signature: sign(secret, old, body) }).reason).toBe('timestamp_outside_tolerance');
  });
  it('rejects missing headers and different-length signatures without throwing', () => {
    expect(verify({ ...base, signature: undefined }).ok).toBe(false);
    expect(verify({ ...base, signature: 'sha256=abc' }).reason).toBe('bad_signature');
  });
});

describe('cursor + request hash', () => {
  it('round-trips and rejects garbage', () => {
    expect(decodeCursor(encodeCursor(42))).toBe(42);
    expect(() => decodeCursor('not-a-cursor')).toThrow();
    expect(() => decodeCursor(Buffer.from('{"id":"x"}').toString('base64url'))).toThrow();
  });
  it('request hash ignores key order but not values', () => {
    expect(stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
    expect(requestHash('POST', '/p', { a: 1, b: 2 })).toBe(requestHash('POST', '/p', { b: 2, a: 1 }));
    expect(requestHash('POST', '/p', { a: 1 })).not.toBe(requestHash('POST', '/p', { a: 2 }));
  });
});
```

`test/api.test.js`:

```js
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, closeDb } from '../src/lib/db.js';
import { redis } from '../src/lib/redis.js';
import { resetAll, makeUser, makeOrder, pay } from './helpers.js';

const app = createApp({});
beforeEach(resetAll);
afterAll(async () => { await closeDb(); redis.disconnect(); });

describe('auth + RBAC', () => {
  it('register -> login -> protected route; duplicate email is 409; weak password is 400', async () => {
    const ok = await request(app).post('/auth/register').send({ email: 'A@Test.dev', password: 'password123' });
    expect(ok.status).toBe(201);
    expect(ok.body.user).toMatchObject({ email: 'a@test.dev', role: 'customer' });
    expect((await request(app).post('/auth/register').send({ email: 'a@test.dev', password: 'password123' })).status).toBe(409);
    expect((await request(app).post('/auth/register').send({ email: 'b@test.dev', password: 'short' })).status).toBe(400);
  });

  it('cannot self-assign admin through the body', async () => {
    const r = await request(app).post('/auth/register').send({ email: 'sneaky@test.dev', password: 'password123', role: 'admin' });
    expect(r.body.user.role).toBe('customer');
  });

  it('wrong password and unknown email give the same 401', async () => {
    await makeUser(app);
    const a = await request(app).post('/auth/login').send({ email: 'nobody@test.dev', password: 'password123' });
    const b = await request(app).post('/auth/login').send({ email: 'x@test.dev', password: 'wrongpass123' });
    expect(a.status).toBe(401);
    expect(a.body).toEqual(b.body);
  });

  it('no token / garbage token -> 401; customer on admin route -> 403; admin -> 200', async () => {
    expect((await request(app).get('/orders')).status).toBe(401);
    expect((await request(app).get('/orders').set('Authorization', 'Bearer abc.def.ghi')).status).toBe(401);
    const customer = await makeUser(app);
    const admin = await makeUser(app, { admin: true });
    expect((await request(app).get('/admin/accounts').set(customer.auth)).status).toBe(403);
    expect((await request(app).get('/admin/accounts').set(admin.auth)).status).toBe(200);
  });

  it("a user cannot read another user's order or payment (404, not 403)", async () => {
    const alice = await makeUser(app);
    const bob = await makeUser(app);
    const order = await makeOrder(app, alice);
    expect((await request(app).get(`/orders/${order.id}`).set(bob.auth)).status).toBe(404);
    expect((await pay(app, bob, order.id, 'bob-key-000001')).status).toBe(404);
    const admin = await makeUser(app, { admin: true });
    expect((await request(app).get(`/orders/${order.id}`).set(admin.auth)).status).toBe(200);
  });
});

describe('idempotent POST /payments', () => {
  it('requires a well-formed Idempotency-Key', async () => {
    const u = await makeUser(app);
    const o = await makeOrder(app, u);
    const none = await request(app).post('/payments').set(u.auth).send({ orderId: o.id });
    expect(none.status).toBe(400);
    expect(none.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    expect((await pay(app, u, o.id, 'short')).status).toBe(400);
  });

  it('same key + same body replays the stored response and creates nothing new', async () => {
    const u = await makeUser(app);
    const o = await makeOrder(app, u);
    const first = await pay(app, u, o.id, 'key-replay-0001');
    const second = await pay(app, u, o.id, 'key-replay-0001');
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(second.headers['idempotent-replay']).toBe('true');
    expect(first.headers['idempotent-replay']).toBeUndefined();
    expect(second.body).toEqual(first.body);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM payments');
    const [[{ e }]] = await pool.query('SELECT COUNT(*) e FROM outbox_events');
    expect([n, e]).toEqual([1, 1]);
  });

  it('same key + DIFFERENT body is rejected with 422', async () => {
    const u = await makeUser(app);
    const o1 = await makeOrder(app, u);
    const o2 = await makeOrder(app, u);
    await pay(app, u, o1.id, 'key-reuse-00001');
    const bad = await pay(app, u, o2.id, 'key-reuse-00001');
    expect(bad.status).toBe(422);
    expect(bad.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('keys are scoped per user: two users may use the same key string', async () => {
    const a = await makeUser(app);
    const b = await makeUser(app);
    const [oa, ob] = [await makeOrder(app, a), await makeOrder(app, b)];
    expect((await pay(app, a, oa.id, 'shared-key-0001')).status).toBe(202);
    expect((await pay(app, b, ob.id, 'shared-key-0001')).status).toBe(202);
  });

  it('a different key for an order that already has a live payment is 409 (DB unique index is the backstop)', async () => {
    const u = await makeUser(app);
    const o = await makeOrder(app, u);
    await pay(app, u, o.id, 'key-first-000001');
    const dup = await pay(app, u, o.id, 'key-second-00001');
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('PAYMENT_IN_PROGRESS');
  });

  it('CONCURRENCY: 50 simultaneous requests with the SAME key -> exactly one payment, one outbox event', async () => {
    const u = await makeUser(app);
    const o = await makeOrder(app, u);
    const results = await Promise.all(Array.from({ length: 50 }, () => pay(app, u, o.id, 'key-race-0000001')));

    const statuses = results.map((r) => r.status);
    expect(statuses.every((s) => s === 202)).toBe(true);
    const created = results.filter((r) => !r.headers['idempotent-replay']);
    const replays = results.filter((r) => r.headers['idempotent-replay'] === 'true');
    expect(created).toHaveLength(1);
    expect(replays).toHaveLength(49);
    expect(new Set(results.map((r) => r.body.payment.id)).size).toBe(1); // everyone got the same payment id

    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM payments WHERE order_id = ?', [o.id]);
    const [[{ e }]] = await pool.query("SELECT COUNT(*) e FROM outbox_events WHERE event_type = 'payment.created'");
    const [[{ k }]] = await pool.query('SELECT COUNT(*) k FROM idempotency_keys');
    expect([n, e, k]).toEqual([1, 1, 1]);
  });

  it('CONCURRENCY: 50 simultaneous requests with 50 DIFFERENT keys for one order -> exactly one wins, 49 get 409', async () => {
    const u = await makeUser(app);
    const o = await makeOrder(app, u);
    const results = await Promise.all(Array.from({ length: 50 }, (_, i) => pay(app, u, o.id, `key-multi-${String(i).padStart(6, '0')}`)));
    const byStatus = results.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] ?? 0) + 1 }), {});
    expect(byStatus).toEqual({ 202: 1, 409: 49 });
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM payments WHERE order_id = ?', [o.id]);
    expect(n).toBe(1);
  });
});

describe('caching with explicit invalidation', () => {
  it('MISS then HIT; a hit never leaks to another user', async () => {
    const alice = await makeUser(app);
    const bob = await makeUser(app);
    const o = await makeOrder(app, alice);
    const r1 = await request(app).get(`/orders/${o.id}`).set(alice.auth);
    const r2 = await request(app).get(`/orders/${o.id}`).set(alice.auth);
    expect([r1.headers['x-cache'], r2.headers['x-cache']]).toEqual(['MISS', 'HIT']);
    expect((await request(app).get(`/orders/${o.id}`).set(bob.auth)).status).toBe(404); // cached, still protected
  });
});

describe('keyset pagination', () => {
  it('walks 25 orders in pages of 10 with no duplicates, stable under concurrent inserts, newest first', async () => {
    const u = await makeUser(app);
    for (let i = 0; i < 25; i++) await makeOrder(app, u, 100 + i);
    const seen = [];
    let cursor;
    let pages = 0;
    do {
      const r = await request(app).get('/orders').query({ limit: 10, ...(cursor ? { cursor } : {}) }).set(u.auth);
      expect(r.status).toBe(200);
      seen.push(...r.body.data.map((o) => o.id));
      cursor = r.body.nextCursor;
      if (pages === 0) await makeOrder(app, u); // a new order arrives mid-pagination: OFFSET paging would shift and repeat a row
      pages++;
    } while (cursor);
    expect(pages).toBe(3);
    expect(seen).toHaveLength(25);
    expect(new Set(seen).size).toBe(25);
    expect([...seen].sort((a, b) => b - a)).toEqual(seen);
  });

  it('rejects a tampered cursor with 400 and an out-of-range limit with 400', async () => {
    const u = await makeUser(app);
    expect((await request(app).get('/orders').query({ cursor: 'garbage' }).set(u.auth)).status).toBe(400);
    expect((await request(app).get('/orders').query({ limit: 1000 }).set(u.auth)).status).toBe(400);
  });
});

describe('rate limiting', () => {
  it('returns 429 with Retry-After once the per-user payment limit is exceeded', async () => {
    const limited = createApp({ limits: { payments: { max: 3 } } });
    const u = await makeUser(limited);
    const o = await makeOrder(limited, u);
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await pay(limited, u, o.id, `rate-key-${String(i).padStart(6, '0')}`)));
    expect(codes.map((r) => r.status)).toEqual([202, 409, 409, 429, 429]);
    expect(Number(codes[3].headers['retry-after'])).toBeGreaterThan(0);
    expect(codes[3].headers['x-ratelimit-remaining']).toBe('0');
  });
});
```

`test/webhooks.test.js`:

```js
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool, closeDb } from '../src/lib/db.js';
import { redis } from '../src/lib/redis.js';
import { sign } from '../src/lib/signature.js';
import { runReconciliation } from '../src/modules/reconcile/reconcile.service.js';
import { resetAll, makeUser, makeOrder, pay } from './helpers.js';

const SECRET = 'whsec_test_0123456789abcdef';
const app = createApp({});
beforeEach(resetAll);
afterAll(async () => { await closeDb(); redis.disconnect(); });

// no worker/provider here: we play the provider ourselves and POST signed webhooks by hand
async function setup(unit = 1000) {
  const u = await makeUser(app);
  const o = await makeOrder(app, u, unit);
  const p = (await pay(app, u, o.id, `wh-key-${Math.random().toString(36).slice(2, 12)}`)).body.payment;
  return { u, o, p };
}
function webhook({ id = `evt_${Math.random().toString(36).slice(2)}`, type = 'charge.succeeded', paymentId, amount = 1000, ts = Math.floor(Date.now() / 1000), secret = SECRET, tamper = false }) {
  const raw = JSON.stringify({ id, type, data: { charge_id: `ch_${id}`, reference: String(paymentId), amount_cents: amount } });
  const sig = sign(secret, ts, raw);
  const send = tamper ? raw.replace('"amount_cents":1000', '"amount_cents":1') : raw;
  return request(app).post('/webhooks/provider').set('content-type', 'application/json').set('X-Provider-Timestamp', String(ts)).set('X-Provider-Signature', sig).send(send);
}
const ledgerCount = async () => (await pool.query('SELECT COUNT(*) n FROM ledger_entries'))[0][0].n;

describe('inbound provider webhooks', () => {
  it('valid signature -> payment succeeded, order paid, ledger posted', async () => {
    const { o, p } = await setup();
    const r = await webhook({ paymentId: p.id });
    expect(r.status).toBe(200);
    expect(r.body.outcome).toBe('succeeded');
    expect((await pool.query('SELECT status FROM orders WHERE id = ?', [o.id]))[0][0].status).toBe('paid');
    expect(await ledgerCount()).toBe(4);
  });

  it('missing / wrong / tampered signature -> 401 and nothing changes', async () => {
    const { p } = await setup();
    expect((await request(app).post('/webhooks/provider').send({ x: 1 })).status).toBe(401);
    expect((await webhook({ paymentId: p.id, secret: 'some_other_secret_value' })).status).toBe(401);
    expect((await webhook({ paymentId: p.id, tamper: true })).status).toBe(401);
    expect(await ledgerCount()).toBe(0);
  });

  it('replay protection: a correctly signed but OLD request is rejected', async () => {
    const { p } = await setup();
    const old = Math.floor(Date.now() / 1000) - 3600;
    const r = await webhook({ paymentId: p.id, ts: old });
    expect(r.status).toBe(401);
    expect(await ledgerCount()).toBe(0);
  });

  it('same event id delivered twice (sequentially) -> second is a recognised duplicate, ledger unchanged', async () => {
    const { p } = await setup();
    const first = await webhook({ id: 'evt_fixed_1', paymentId: p.id });
    const second = await webhook({ id: 'evt_fixed_1', paymentId: p.id });
    expect([first.body.outcome, second.body.outcome]).toEqual(['succeeded', 'duplicate']);
    expect(second.status).toBe(200); // still 2xx so the provider stops retrying
    expect(await ledgerCount()).toBe(4);
  });

  it('same event id delivered 20x CONCURRENTLY -> processed exactly once', async () => {
    const { p } = await setup();
    const rs = await Promise.all(Array.from({ length: 20 }, () => webhook({ id: 'evt_race_1', paymentId: p.id })));
    const outcomes = rs.map((r) => r.body.outcome).sort();
    expect(outcomes.filter((o) => o === 'succeeded')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'duplicate')).toHaveLength(19);
    expect(await ledgerCount()).toBe(4);
    expect((await pool.query('SELECT COUNT(*) n FROM webhook_deliveries'))[0][0].n).toBe(1);
  });

  it('two DIFFERENT event ids for the same payment -> state machine ignores the second (terminal state)', async () => {
    const { p } = await setup();
    await webhook({ paymentId: p.id });
    const again = await webhook({ paymentId: p.id });
    expect(again.body.outcome).toBe('ignored_terminal');
    expect(await ledgerCount()).toBe(4);
  });

  it('out-of-order: charge.failed arriving after success cannot undo it', async () => {
    const { o, p } = await setup();
    await webhook({ paymentId: p.id, type: 'charge.succeeded' });
    const late = await webhook({ paymentId: p.id, type: 'charge.failed' });
    expect(late.body.outcome).toBe('ignored_terminal');
    expect((await pool.query('SELECT status FROM orders WHERE id = ?', [o.id]))[0][0].status).toBe('paid');
  });

  it('amount mismatch is never credited', async () => {
    const { p } = await setup(1000);
    const r = await webhook({ paymentId: p.id, amount: 999999 });
    expect(r.body.outcome).toBe('ignored_amount_mismatch');
    expect(await ledgerCount()).toBe(0);
  });

  it('unknown payment reference is acknowledged (200) and ignored', async () => {
    const r = await webhook({ paymentId: 987654 });
    expect([r.status, r.body.outcome]).toEqual([200, 'ignored_unknown_payment']);
  });

  it('cache invalidation: a cached order flips to paid right after the webhook (no stale read)', async () => {
    const { u, o, p } = await setup();
    const before = await request(app).get(`/orders/${o.id}`).set(u.auth);
    expect([before.headers['x-cache'], before.body.order.status]).toEqual(['MISS', 'pending_payment']);
    expect((await request(app).get(`/orders/${o.id}`).set(u.auth)).headers['x-cache']).toBe('HIT');
    await webhook({ paymentId: p.id });
    const after = await request(app).get(`/orders/${o.id}`).set(u.auth);
    expect([after.headers['x-cache'], after.body.order.status]).toEqual(['MISS', 'paid']);
  });
});

describe('reconciliation detects ledger mismatches', () => {
  it('clean after a normal payment; flags drift, unbalanced txn, missing ledger, and order/payment disagreement when we corrupt data', async () => {
    const { o, p } = await setup();
    await webhook({ paymentId: p.id });
    expect((await runReconciliation({})).ok).toBe(true);

    // 1. someone "fixes" a balance by hand
    await pool.query("UPDATE accounts SET balance_cents = balance_cents + 500 WHERE code = 'sys:merchant_revenue'");
    let r = await runReconciliation({});
    expect(r.counts.balance_drift).toBe(1);
    expect(r.issues.find((i) => i.check === 'balance_drift')).toMatchObject({ code: 'sys:merchant_revenue', cached: 1500, computed: 1000 });
    await pool.query("UPDATE accounts SET balance_cents = balance_cents - 500 WHERE code = 'sys:merchant_revenue'");

    // 2. a ledger row disappears -> that transaction no longer balances (and balances drift)
    const [[row]] = await pool.query("SELECT id FROM ledger_entries WHERE posting_key LIKE '%settle-cr'");
    await pool.query('DELETE FROM ledger_entries WHERE id = ?', [row.id]);
    r = await runReconciliation({});
    expect(r.counts.unbalanced_transactions).toBe(1);
    expect(r.ok).toBe(false);

    // 3. whole ledger wiped -> succeeded payment with no ledger
    await pool.query('DELETE FROM ledger_entries');
    r = await runReconciliation({});
    expect(r.counts.succeeded_without_ledger).toBe(1);

    // 4. order says pending but a payment succeeded
    await pool.query("UPDATE orders SET status = 'pending_payment' WHERE id = ?", [o.id]);
    r = await runReconciliation({});
    expect(r.counts.order_payment_disagree).toBe(1);
  });
});
```

`test/e2e.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import { pool, closeDb } from '../src/lib/db.js';
import { redis } from '../src/lib/redis.js';
import { relayOnce } from '../src/modules/outbox/relay.js';
import { runReconciliation } from '../src/modules/reconcile/reconcile.service.js';
import { resetAll, makeUser, makeOrder, pay, startStack, waitFor } from './helpers.js';

let stack;
afterEach(async () => { await stack?.stop(); stack = undefined; });
afterAll(async () => { await closeDb(); redis.disconnect(); });

const orderStatus = async (id) => (await pool.query('SELECT status FROM orders WHERE id = ?', [id]))[0][0].status;
const paymentRow = async (orderId) => (await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [orderId]))[0][0];
const ledgerCount = async () => (await pool.query('SELECT COUNT(*) n FROM ledger_entries'))[0][0].n;

describe('end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger', () => {
  beforeEach(async () => { await resetAll(); });

  it('happy path: order becomes paid, 4 balanced ledger rows, account balances correct, reconciliation clean', async () => {
    stack = await startStack();
    const u = await makeUser(stack.app);
    const o = await makeOrder(stack.app, u, 2500, 2); // 5000
    expect((await pay(stack.app, u, o.id, 'e2e-happy-000001')).status).toBe(202);

    await waitFor(async () => (await orderStatus(o.id)) === 'paid', { label: 'order paid' });
    const p = await paymentRow(o.id);
    expect(p.status).toBe('succeeded');
    expect(p.provider_ref).toMatch(/^ch_/);
    expect(await ledgerCount()).toBe(4);

    const [accts] = await pool.query('SELECT code, balance_cents FROM accounts ORDER BY id');
    const bal = Object.fromEntries(accts.map((a) => [a.code, Number(a.balance_cents)]));
    expect(bal['sys:provider_clearing']).toBe(5000);
    expect(bal['sys:merchant_revenue']).toBe(5000);
    expect(bal[`wallet:${u.id}`]).toBe(0);

    const report = await runReconciliation({});
    expect(report.ok).toBe(true);
    // the success notification is consumed from the events queue
    await waitFor(async () => (await redis.llen('notifications:sent')) === 1, { label: 'notification' });
  });

  it('EXACTLY ONE CHARGE: 50 duplicate requests -> 1 payment, 1 provider charge, 1 ledger posting set', async () => {
    stack = await startStack();
    const u = await makeUser(stack.app);
    const o = await makeOrder(stack.app, u, 1000);
    const results = await Promise.all(Array.from({ length: 50 }, () => pay(stack.app, u, o.id, 'e2e-dup-0000001')));
    expect(results.every((r) => r.status === 202)).toBe(true);

    await waitFor(async () => (await orderStatus(o.id)) === 'paid', { label: 'order paid' });
    await new Promise((r) => setTimeout(r, 300)); // give any (wrongly) duplicated work time to show up

    expect(stack.stats.chargesCreated).toBe(1);   // the provider created ONE charge...
    expect(stack.stats.postAttempts).toBe(1);     // ...because the worker only called it once
    expect((await pool.query('SELECT COUNT(*) n FROM payments'))[0][0].n).toBe(1);
    expect(await ledgerCount()).toBe(4);          // not 8, not 200
  });

  it('declined card: payment failed, order stays payable, second attempt with a new key works', async () => {
    stack = await startStack();
    const u = await makeUser(stack.app);
    const o = await makeOrder(stack.app, u, 1099); // ..99 = declined by the fake provider
    await pay(stack.app, u, o.id, 'e2e-decl-0000001');
    await waitFor(async () => (await paymentRow(o.id)).status === 'failed', { label: 'payment failed' });
    expect(await orderStatus(o.id)).toBe('pending_payment');
    expect(await ledgerCount()).toBe(0);
    // failed payments release the unique "one live payment per order" slot
    const retry = await pay(stack.app, u, o.id, 'e2e-decl-0000002');
    expect(retry.status).toBe(202);
  });

  it('transient provider errors are retried with backoff and then succeed', async () => {
    stack = await startStack();
    const u = await makeUser(stack.app);
    const o = await makeOrder(stack.app, u, 1098); // ..98 = 503, 503, then OK
    await pay(stack.app, u, o.id, 'e2e-flaky-000001');
    await waitFor(async () => (await orderStatus(o.id)) === 'paid', { label: 'order paid after retries' });
    expect(stack.stats.postAttempts).toBe(3);      // 2 failures + 1 success
    expect(stack.stats.chargesCreated).toBe(1);
  });

  it('provider outage: retries exhausted -> job lands in the DLQ, payment stays pending, admin can replay', async () => {
    stack = await startStack();
    const u = await makeUser(stack.app);
    const admin = await makeUser(stack.app, { admin: true });
    const o = await makeOrder(stack.app, u, 1096); // ..96 = always 503
    await pay(stack.app, u, o.id, 'e2e-outage-00001');

    const dead = await waitFor(async () => {
      const r = await request(stack.app).get('/admin/dlq').set(admin.auth);
      return r.body.data?.length ? r.body.data : null;
    }, { label: 'DLQ entry' });
    expect(dead[0].attemptsMade).toBe(4);             // JOB_ATTEMPTS=4 in the test config
    expect(dead[0].error).toMatch(/503/);
    expect(stack.stats.postAttempts).toBe(4);
    const p = await paymentRow(o.id);
    expect(p.status).toBe('pending');                  // we do not know the outcome, so we do not guess "failed"
    expect(p.last_error).toMatch(/503/);

    // replay mechanics: the job leaves the DLQ and goes back on the payments queue (the processor
    // re-checks payment state, so replaying is always safe)
    const replay = await request(stack.app).post(`/admin/dlq/${dead[0].id}/requeue`).set(admin.auth);
    expect(replay.body.requeued).toBe(true);
    expect((await request(stack.app).get('/admin/dlq').set(admin.auth)).body.data).toHaveLength(0);
  });

  it('webhooks are at-least-once: a provider that sends every webhook twice still posts the ledger once', async () => {
    stack = await startStack({ duplicateWebhooks: true });
    const u = await makeUser(stack.app);
    const o = await makeOrder(stack.app, u, 3000);
    await pay(stack.app, u, o.id, 'e2e-dupwh-000001');
    await waitFor(async () => (await orderStatus(o.id)) === 'paid', { label: 'order paid' });
    await waitFor(async () => (await pool.query('SELECT COUNT(*) n FROM webhook_deliveries'))[0][0].n === 1, { label: 'delivery recorded' });
    await new Promise((r) => setTimeout(r, 300));
    expect(stack.stats.webhooksSent).toBe(2);          // provider delivered twice (same event id)
    expect((await pool.query('SELECT COUNT(*) n FROM webhook_deliveries'))[0][0].n).toBe(1);
    expect(await ledgerCount()).toBe(4);
    expect(await redis.llen('notifications:sent')).toBe(1);
  });

  it('lost webhook: payment sticks in processing, reconciliation asks the provider and repairs it', async () => {
    stack = await startStack();
    const u = await makeUser(stack.app);
    const o = await makeOrder(stack.app, u, 1097); // ..97 = accepted, webhook never sent
    await pay(stack.app, u, o.id, 'e2e-lostwh-000001');
    await waitFor(async () => (await paymentRow(o.id)).status === 'processing', { label: 'processing' });
    await new Promise((r) => setTimeout(r, 300));
    expect(await orderStatus(o.id)).toBe('pending_payment');

    await pool.query("UPDATE payments SET updated_at = NOW(3) - INTERVAL 1 HOUR WHERE order_id = ?", [o.id]); // pretend it has been stuck for an hour
    const before = await runReconciliation({ staleMinutes: 10, repair: false });
    expect(before.ok).toBe(false);
    expect(before.issues.map((i) => i.check)).toContain('stale_payment');

    const after = await runReconciliation({ staleMinutes: 10, repair: true });
    expect(after.counts.repaired).toBe(1);
    expect(after.ok).toBe(true);
    expect(await orderStatus(o.id)).toBe('paid');
    expect(await ledgerCount()).toBe(4);
  });

  it('outbox relay is crash-safe: re-publishing the same row does not create a second job', async () => {
    stack = await startStack();
    const u = await makeUser(stack.app);
    const o = await makeOrder(stack.app, u, 1000);
    await pay(stack.app, u, o.id, 'e2e-relay-000001');
    await waitFor(async () => (await orderStatus(o.id)) === 'paid', { label: 'order paid' });
    // simulate "relay published to Redis but crashed before marking the row published"
    await pool.query("UPDATE outbox_events SET status = 'pending'");
    const republished = await relayOnce(stack.queues);
    expect(republished).toBeGreaterThan(0);
    await new Promise((r) => setTimeout(r, 400));
    expect(stack.stats.postAttempts).toBe(1);           // the charge was not repeated
    expect(await ledgerCount()).toBe(4);
    expect(await redis.llen('notifications:sent')).toBe(1); // consumer dedupe held too
  });
});
```

### How to run

```bash
docker compose up -d mysql redis
npm run migrate:test        # creates the schema in payments_test (the database itself is created by docker/mysql-init.sql)
npm test
```

### Real output

```text
$ npm test
 [OK] test/api.test.js (16 tests) 5873ms
 [OK] test/e2e.test.js (8 tests) 6601ms
 [OK] test/webhooks.test.js (11 tests) 3491ms
 [OK] test/unit.test.js (9 tests) 29ms
Test Files  4 passed (4)
Tests  44 passed (44)
Duration  23.85s (transform 339ms, setup 0ms, collect 5.76s, tests 15.99s, environment 2ms, prepare 865ms)
```

Verbose listing of all 44 tests (real run, `npx vitest run --reporter=verbose`, timings removed, check marks shown as [OK]):

```text

 RUN  v3.2.7 C:/Users/Admin/AppData/Local/Temp/claude/h--Node/12653e7b-33d6-4f90-812a-94b1eba4e8d5/scratchpad/cap17/payments-orders

 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > happy path: order becomes paid, 4 balanced ledger rows, account balances correct, reconciliation clean
 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > EXACTLY ONE CHARGE: 50 duplicate requests -> 1 payment, 1 provider charge, 1 ledger posting set
 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > declined card: payment failed, order stays payable, second attempt with a new key works
 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > transient provider errors are retried with backoff and then succeed
 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > provider outage: retries exhausted -> job lands in the DLQ, payment stays pending, admin can replay
 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > webhooks are at-least-once: a provider that sends every webhook twice still posts the ledger once
 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > lost webhook: payment sticks in processing, reconciliation asks the provider and repairs it
 [OK] test/e2e.test.js > end to end: API -> outbox -> relay -> BullMQ worker -> fake provider -> signed webhook -> ledger > outbox relay is crash-safe: re-publishing the same row does not create a second job
 [OK] test/api.test.js > auth + RBAC > register -> login -> protected route; duplicate email is 409; weak password is 400
 [OK] test/api.test.js > auth + RBAC > cannot self-assign admin through the body
 [OK] test/api.test.js > auth + RBAC > wrong password and unknown email give the same 401
 [OK] test/api.test.js > auth + RBAC > no token / garbage token -> 401; customer on admin route -> 403; admin -> 200
 [OK] test/api.test.js > auth + RBAC > a user cannot read another user's order or payment (404, not 403)
 [OK] test/api.test.js > idempotent POST /payments > requires a well-formed Idempotency-Key
 [OK] test/api.test.js > idempotent POST /payments > same key + same body replays the stored response and creates nothing new
 [OK] test/api.test.js > idempotent POST /payments > same key + DIFFERENT body is rejected with 422
 [OK] test/api.test.js > idempotent POST /payments > keys are scoped per user: two users may use the same key string
 [OK] test/api.test.js > idempotent POST /payments > a different key for an order that already has a live payment is 409 (DB unique index is the backstop)
 [OK] test/api.test.js > idempotent POST /payments > CONCURRENCY: 50 simultaneous requests with the SAME key -> exactly one payment, one outbox event
 [OK] test/api.test.js > idempotent POST /payments > CONCURRENCY: 50 simultaneous requests with 50 DIFFERENT keys for one order -> exactly one wins, 49 get 409
 [OK] test/api.test.js > caching with explicit invalidation > MISS then HIT; a hit never leaks to another user
 [OK] test/api.test.js > keyset pagination > walks 25 orders in pages of 10 with no duplicates, stable under concurrent inserts, newest first
 [OK] test/api.test.js > keyset pagination > rejects a tampered cursor with 400 and an out-of-range limit with 400
 [OK] test/api.test.js > rate limiting > returns 429 with Retry-After once the per-user payment limit is exceeded
 [OK] test/webhooks.test.js > inbound provider webhooks > valid signature -> payment succeeded, order paid, ledger posted
 [OK] test/webhooks.test.js > inbound provider webhooks > missing / wrong / tampered signature -> 401 and nothing changes
 [OK] test/webhooks.test.js > inbound provider webhooks > replay protection: a correctly signed but OLD request is rejected
 [OK] test/webhooks.test.js > inbound provider webhooks > same event id delivered twice (sequentially) -> second is a recognised duplicate, ledger unchanged
 [OK] test/webhooks.test.js > inbound provider webhooks > same event id delivered 20x CONCURRENTLY -> processed exactly once
 [OK] test/webhooks.test.js > inbound provider webhooks > two DIFFERENT event ids for the same payment -> state machine ignores the second (terminal state)
 [OK] test/webhooks.test.js > inbound provider webhooks > out-of-order: charge.failed arriving after success cannot undo it
 [OK] test/webhooks.test.js > inbound provider webhooks > amount mismatch is never credited
 [OK] test/webhooks.test.js > inbound provider webhooks > unknown payment reference is acknowledged (200) and ignored
 [OK] test/webhooks.test.js > inbound provider webhooks > cache invalidation: a cached order flips to paid right after the webhook (no stale read)
 [OK] test/webhooks.test.js > reconciliation detects ledger mismatches > clean after a normal payment; flags drift, unbalanced txn, missing ledger, and order/payment disagreement when we corrupt data
 [OK] test/unit.test.js > backoffWithJitter > ceiling doubles per attempt and is capped
 [OK] test/unit.test.js > backoffWithJitter > is fully jittered: anywhere between 0 and the ceiling
 [OK] test/unit.test.js > webhook signature > accepts a correct signature
 [OK] test/unit.test.js > webhook signature > rejects a tampered body
 [OK] test/unit.test.js > webhook signature > rejects a wrong secret
 [OK] test/unit.test.js > webhook signature > rejects an old timestamp even with a valid signature (replay)
 [OK] test/unit.test.js > webhook signature > rejects missing headers and different-length signatures without throwing
 [OK] test/unit.test.js > cursor + request hash > round-trips and rejects garbage
 [OK] test/unit.test.js > cursor + request hash > request hash ignores key order but not values

 Test Files  4 passed (4)
      Tests  44 passed (44)
   Start at  13:18:30
   Duration  28.77s (transform 405ms, setup 0ms, collect 7.55s, tests 18.78s, environment 2ms, prepare 1.01s)
```

### Mutation check (does the concurrency test actually protect us?)

I replaced `runIdempotent` with a naive version: plain `SELECT` for the key (no claim, no lock), run the handler, `INSERT` the key row at the end. Then ran
only the two concurrency tests. Real output (trimmed):

```text
 FAIL  test/api.test.js > idempotent POST /payments > CONCURRENCY: 50 simultaneous requests with the SAME key -> exactly one payment, one outbox event
AssertionError: expected false to be true // Object.is equality
    111|     const statuses = results.map((r) => r.status);
    112|     expect(statuses.every((s) => s === 202)).toBe(true);
 Tests  1 failed | 1 passed | 14 skipped (16)
```

Why it fails: with no key claim, requests that arrive before the first one commits all run the business logic. I printed the status distribution of the 50 callers against the mutant:
`{"202": 21, "500 INTERNAL": 29}` -- 21 got an answer (the ones that arrived after the first commit, or won), 29 crashed with duplicate-key collisions and a 500. The database still held
exactly 1 payment and 1 outbox event, because the unique index (one live payment per order) stopped the second payment: the unique index saved the money but not the API contract (clients got 500s
instead of the original answer). The second concurrency test (50 DIFFERENT keys) still passes in the mutant, correctly, because that behaviour comes from the order
lock plus the unique index, not from the idempotency layer. I restored the original file afterwards (the numbers above and the 44 passing tests are
from the restored code).

### Acceptance criteria

- [ ] `npm test`: 4 files, 44 tests pass on a fresh clone with only Docker running
- [ ] The 50-duplicate e2e test asserts: provider `chargesCreated === 1`, `postAttempts === 1`, payments `=== 1`, ledger rows `=== 4`
- [ ] The mutation check makes the SAME-key concurrency test fail
- [ ] Re-running the whole suite 3 times in a row gives the same result (no flaky waits)

### Interview concepts

Test pyramid for backends; integration tests against real databases (and why mocks cannot test locks and unique keys); testing concurrency
(`Promise.all` of N requests; assertions on persisted state); deterministic fakes; avoiding sleeps (poll with timeout); test isolation; mutation
testing idea (does the test fail when the code is wrong?); CI (`npm test` + service containers).

**Interview answer:** "The most important test fires 50 identical payment requests at once and then asserts on the database and the fake provider, not just on
HTTP codes: exactly one payment row, one outbox event, one charge at the provider, and four ledger rows. I verified the test is meaningful by swapping in a naive check-then-insert
implementation and watching it fail. All integration tests run against real MySQL and Redis because locks, unique constraints and queues are exactly the things a mock would fake away."

**Follow-up: how do you avoid flaky async tests?** "No fixed sleeps as the success condition: I poll for the expected state with a timeout (`waitFor`). The few short sleeps I keep are
only to give wrong behaviour (a duplicate charge) time to appear before asserting it did not. Each test starts from a clean database and Redis DB, and files run serially."

**Follow-up: what does this suite NOT cover?** "Multi-process races (several API/worker replicas), a Redis or MySQL outage mid-request, crash-kill of the worker mid-job, and real network
partitions. The chaos lab part covers some of these."

**Common mistakes:** mocking the database in tests of locking logic; asserting only on HTTP status; `setTimeout` as synchronisation; shared state between tests; tests that
pass even when the code is broken (never checked).

**Key concepts to remember**

- Assert on persisted state. Poll, do not sleep. Real dependencies for concurrency tests.
- A test you have never seen fail is a hypothesis, not a safety net.

**Revision questions**

1. Why does the SAME-key test fail on the naive implementation but the DIFFERENT-keys test pass?
2. Which assertions prove "exactly one charge"?
3. Why `fileParallelism: false`?
4. How does the e2e test make retries fast without changing production code?
5. Which guarantee is NOT covered by any test here?

**Practical task:** write a test that starts TWO API instances and TWO relay loops on the same database and fires 50 duplicate requests at both. Assert exactly one
charge. (This exercises `SKIP LOCKED` and the row locks across processes.)

- [ ] 44 tests pass locally
- [ ] I broke the idempotency code on purpose and saw the test fail
- [ ] I can explain every assertion of the 50-duplicate e2e test

---

## Stage 12 - Docker Compose one-command run, smoke test, load test and its result

**Learning objectives**

- Package three processes plus MySQL and Redis so a stranger can run the whole system with one command.
- Load test honestly: calibrate the machine, measure, then verify the money is still right.

### Requirements

1. `docker compose up --build` starts MySQL, Redis, runs migration + seed once, then starts provider, API and worker; dependencies wait for health.
2. One image for all app services; non-root user; `npm ci --omit=dev`.
3. `scripts/smoke.mjs`: register -> order -> pay -> replay -> wait for `paid` -> cache hit -> reconcile.
4. A load test with autocannon: (A) cached reads, (B) distinct payments with unique keys, (C) a duplicate storm: 3000 requests with ONE key. After the load: wait for the async pipeline to
   drain, run reconciliation, and assert that revenue increased by EXACTLY the expected amount.
5. Report the result with a calibration baseline so the numbers can be interpreted.

### Code

`Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY db ./db
COPY scripts ./scripts
COPY src ./src
USER node
# the same image runs api, worker, provider and migrate; compose picks the command
CMD ["node", "src/server.js"]
```

`docker-compose.yml`:

```yaml
# One command:  docker compose up --build
# api      -> http://localhost:3017      (Express API)
# provider -> http://localhost:4017      (fake payment provider)
# mysql    -> localhost:33066            (user app / password app)
# redis    -> localhost:63793
x-app-env: &app-env
  NODE_ENV: production
  LOG_LEVEL: ${LOG_LEVEL:-info}
  DB_HOST: mysql
  DB_PORT: "3306"
  DB_USER: app
  DB_PASSWORD: app
  DB_NAME: payments
  DB_POOL: ${DB_POOL:-30}
  REDIS_URL: redis://redis:6379
  JWT_SECRET: change-me-in-real-life-0123456789
  PROVIDER_URL: http://provider:4017
  PROVIDER_API_KEY: provider-key-dev
  WEBHOOK_SECRET: whsec_dev_secret_0123456789
  API_BASE_URL: http://api:3017
  ADMIN_EMAIL: admin@example.com
  ADMIN_PASSWORD: admin-password-123
  PAYMENT_RATE_MAX: ${PAYMENT_RATE_MAX:-30}
  GLOBAL_RATE_MAX: ${GLOBAL_RATE_MAX:-300}
  AUTH_RATE_MAX: ${AUTH_RATE_MAX:-20}

services:
  mysql:
    image: mysql:8.4
    container_name: cap-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootdev
      MYSQL_DATABASE: payments
      MYSQL_USER: app
      MYSQL_PASSWORD: app
    command: ["--character-set-server=utf8mb4", "--max-connections=300"]
    ports: ["33066:3306"]
    volumes:
      - cap-mysql-data:/var/lib/mysql
      - ./docker/mysql-init.sql:/docker-entrypoint-initdb.d/01-test-db.sql:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uapp", "-papp"]
      interval: 3s
      timeout: 3s
      retries: 60
      start_period: 40s   # first start initialises the data directory, which can take a minute on a slow disk

  redis:
    image: redis:7-alpine
    container_name: cap-redis
    ports: ["63793:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 20

  migrate:
    build: .
    image: payments-orders:local
    container_name: cap-migrate
    command: ["sh", "-c", "node scripts/migrate.js && node scripts/seed.js"]
    environment: *app-env
    depends_on:
      mysql: { condition: service_healthy }

  provider:
    image: payments-orders:local
    container_name: cap-provider
    command: ["node", "src/provider/server.js"]
    environment:
      <<: *app-env
      PROVIDER_PORT: "4017"
      PROVIDER_WEBHOOK_DELAY_MS: "100"
    ports: ["4017:4017"]
    depends_on:
      migrate: { condition: service_completed_successfully }

  api:
    image: payments-orders:local
    container_name: cap-api
    command: ["node", "src/server.js"]
    environment:
      <<: *app-env
      PORT: "3017"
    ports: ["3017:3017"]
    depends_on:
      migrate: { condition: service_completed_successfully }
      redis: { condition: service_healthy }

  worker:
    image: payments-orders:local
    container_name: cap-worker
    command: ["node", "src/worker-main.js"]
    environment: *app-env
    depends_on:
      migrate: { condition: service_completed_successfully }
      redis: { condition: service_healthy }

  # Load generator INSIDE the compose network (the Windows/macOS host port proxy caps throughput at
  # ~1k req/s and would measure Docker Desktop, not the API).  docker compose --profile load run --rm loadtest
  loadtest:
    profiles: ["load"]
    image: node:20-alpine
    working_dir: /app
    volumes: [".:/app"]
    environment:
      LOAD_URL: http://api:3017
      LOAD_PROVIDER_URL: http://provider:4017
      LOAD_PAYMENTS: ${LOAD_PAYMENTS:-1000}
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: admin-password-123
    command: ["node", "scripts/loadtest.js"]
    depends_on: [api, worker, provider]

volumes:
  cap-mysql-data:
```

`.dockerignore` and `.gitignore`:

```text
node_modules
.env
.git
test
```

(`.gitignore` contains `node_modules` and `.env`.)

`scripts/smoke.mjs`:

```js
// End-to-end smoke test against a RUNNING stack (docker compose up). Prints each step.
// Usage: node scripts/smoke.mjs [baseUrl]
const base = process.argv[2] ?? 'http://127.0.0.1:3017';
const j = async (method, path, { token, body, headers = {} } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, headers: res.headers, body: await res.json().catch(() => null) };
};
const step = (title, r) => console.log(`${title.padEnd(44)} -> ${r.status} ${JSON.stringify(r.body).slice(0, 110)}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const email = `smoke${Date.now()}@example.com`;
step('register', await j('POST', '/auth/register', { body: { email, password: 'password123' } }));
const { body: login } = await j('POST', '/auth/login', { body: { email, password: 'password123' } });
const token = login.accessToken;
const { body: o } = await j('POST', '/orders', { token, body: { items: [{ name: 'Keyboard', unitPriceCents: 4500, quantity: 2 }] } });
console.log(`create order                                 -> total ${o.order.totalCents} cents, status ${o.order.status}`);

const key = `smoke-${Date.now()}`;
const p1 = await j('POST', '/payments', { token, body: { orderId: o.order.id }, headers: { 'idempotency-key': key } });
step('POST /payments (first)', p1);
const p2 = await j('POST', '/payments', { token, body: { orderId: o.order.id }, headers: { 'idempotency-key': key } });
console.log(`POST /payments (same key)                    -> ${p2.status} Idempotent-Replay: ${p2.headers.get('idempotent-replay')} same id: ${p2.body.payment.id === p1.body.payment.id}`);

let order;
for (let i = 0; i < 40; i++) {
  order = (await j('GET', `/orders/${o.order.id}`, { token })).body.order;
  if (order.status === 'paid') break;
  await sleep(250);
}
console.log(`order after async processing                 -> ${order.status}`);
const hit = await j('GET', `/orders/${o.order.id}`, { token });
console.log(`GET /orders/:id again                        -> X-Cache: ${hit.headers.get('x-cache')}`);

const { body: adminLogin } = await j('POST', '/auth/login', { body: { email: process.env.ADMIN_EMAIL ?? 'admin@example.com', password: process.env.ADMIN_PASSWORD ?? 'admin-password-123' } });
step('admin reconcile', await j('POST', '/admin/reconcile', { token: adminLogin.accessToken }));
if (order.status !== 'paid') process.exit(1);
```

`scripts/loadtest.js`:

```js
// Load test with autocannon against a RUNNING stack, then verifies the money is still consistent.
// Start the stack with high rate limits:
//   PAYMENT_RATE_MAX=1000000 GLOBAL_RATE_MAX=1000000 AUTH_RATE_MAX=1000000 docker compose up -d --build
// Run:  node scripts/loadtest.js
import autocannon from 'autocannon';
import { randomUUID } from 'node:crypto';
import http from 'node:http';

const BASE = process.env.LOAD_URL ?? 'http://127.0.0.1:3017';
const PROVIDER = process.env.LOAD_PROVIDER_URL ?? 'http://127.0.0.1:4017';
const PAY_COUNT = Number(process.env.LOAD_PAYMENTS ?? 1000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, { token, body, headers } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function login(email, password) {
  return (await api('POST', '/auth/login', { body: { email, password } })).accessToken;
}

const row = (name, r) => ({
  scenario: name,
  'req/s avg': Math.round(r.requests.average),
  'p50 ms': r.latency.p50,
  'p97.5 ms': r.latency.p97_5,
  'p99 ms': r.latency.p99,
  'max ms': r.latency.max,
  '2xx': r['2xx'],
  non2xx: r.non2xx,
  errors: r.errors,
  timeouts: r.timeouts,
});

// ---- setup
const admin = await login(process.env.ADMIN_EMAIL ?? 'admin@example.com', process.env.ADMIN_PASSWORD ?? 'admin-password-123');
const revenue = async () => (await api('GET', '/admin/accounts', { token: admin })).data.find((a) => a.code === 'sys:merchant_revenue').balanceCents;
const revenueBefore = await revenue();
const email = `load${Date.now()}@example.com`;
await api('POST', '/auth/register', { body: { email, password: 'password123' } });
const token = await login(email, 'password123');
const auth = { authorization: `Bearer ${token}` };

console.log(`creating ${PAY_COUNT} orders...`);
const orderIds = [];
for (let i = 0; i < PAY_COUNT; i += 50) {
  const batch = await Promise.all(
    Array.from({ length: Math.min(50, PAY_COUNT - i) }, () =>
      api('POST', '/orders', { token, body: { items: [{ name: 'Load item', unitPriceCents: 1000, quantity: 1 }] } }),
    ),
  );
  orderIds.push(...batch.map((b) => b.order.id));
}
const hotOrder = (await api('POST', '/orders', { token, body: { items: [{ name: 'Hot', unitPriceCents: 2000, quantity: 1 }] } })).order.id;
const results = [];

// ---- 0: calibration. A do-nothing Node HTTP server on THIS machine, hit by the same autocannon settings.
// Your API can never beat this number, so it tells you how much of the result is the box, not the code.
console.log('0: calibration against a bare node http server, 5s, 50 connections');
const bare = http.createServer((_q, r) => r.end('{"status":"ok"}')).listen(0);
results.push(row('0 baseline: bare node http (ceiling)', await autocannon({ url: `http://127.0.0.1:${bare.address().port}`, connections: 50, duration: 5 })));
bare.close();

// ---- A: cached read path (GET /orders/:id served from Redis)
console.log('A: cached reads, 10s, 50 connections');
results.push(row('A GET /orders/:id (cache hit)', await autocannon({ url: `${BASE}/orders/${orderIds[0]}`, connections: 50, duration: 10, headers: auth })));

// ---- B: the write path: unique Idempotency-Key per request, each pays a different order
console.log(`B: ${PAY_COUNT} distinct payments, 30 connections`);
let i = 0;
const t0 = Date.now();
results.push(
  row(
    'B POST /payments (unique keys)',
    await autocannon({
      url: BASE, connections: 30, amount: PAY_COUNT,
      requests: [{
        method: 'POST', path: '/payments', headers: { 'content-type': 'application/json', ...auth },
        setupRequest(req) {
          req.headers['idempotency-key'] = randomUUID();
          req.body = JSON.stringify({ orderId: orderIds[i++ % orderIds.length] });
          return req;
        },
      }],
    }),
  ),
);
const acceptSeconds = ((Date.now() - t0) / 1000).toFixed(1);

// ---- C: duplicate storm: every request carries the SAME key for ONE order (all contend for one row lock)
console.log('C: duplicate storm, one key, 30 connections, 3000 requests');
results.push(
  row(
    'C POST /payments (same key x3000)',
    await autocannon({
      url: BASE, connections: 30, amount: 3000,
      requests: [{ method: 'POST', path: '/payments', headers: { 'content-type': 'application/json', 'idempotency-key': 'load-hot-key-0001', ...auth }, body: JSON.stringify({ orderId: hotOrder }) }],
    }),
  ),
);

// ---- drain: wait for the async pipeline (outbox -> queue -> worker -> provider -> webhook) to finish
console.log('waiting for async processing to drain...');
const t1 = Date.now();
let pending = Infinity;
while (Date.now() - t1 < 180_000) {
  let count = 0;
  let cursor;
  do {
    const page = await api('GET', `/orders?status=pending_payment&limit=100${cursor ? `&cursor=${cursor}` : ''}`, { token });
    count += page.data.length;
    cursor = page.nextCursor;
  } while (cursor);
  pending = count;
  if (pending === 0) break;
  await sleep(500);
}
const drainSeconds = ((Date.now() - t1) / 1000).toFixed(1);

// ---- consistency checks after the storm
const recon = await api('POST', '/admin/reconcile', { token: admin });
const stats = await (await fetch(`${PROVIDER}/_stats`)).json();

console.table(results);
console.log(`B accepted ${PAY_COUNT} payments in ${acceptSeconds}s; async pipeline drained ${drainSeconds}s later (orders still pending: ${pending})`);
console.log('provider stats      :', JSON.stringify(stats));
console.log('reconciliation      :', JSON.stringify({ ok: recon.ok, counts: recon.counts }));
const expectedDelta = PAY_COUNT * 1000 + 2000; // PAY_COUNT orders of $10.00 + the hot order of $20.00 (paid ONCE despite 3000 requests)
const actualDelta = (await revenue()) - revenueBefore;
console.log(`revenue delta       : expected ${expectedDelta} cents, actual ${actualDelta} cents`);
console.log(`provider charges    : ${stats.chargesCreated} created for ${PAY_COUNT + 1} paid orders (+ earlier runs on this provider instance)`);
if (!recon.ok || pending !== 0 || actualDelta !== expectedDelta) process.exit(1);
```

### Run it

```bash
docker compose up --build -d
docker compose ps
node scripts/smoke.mjs
```

Real output (`docker compose ps`, and the smoke test):

```text
NAME           STATUS                    PORTS
cap-api        Up About a minute         0.0.0.0:3017->3017/tcp, [::]:3017->3017/tcp
cap-mysql      Up 12 minutes (healthy)   0.0.0.0:33066->3306/tcp, [::]:33066->3306/tcp
cap-provider   Up 12 minutes             0.0.0.0:4017->4017/tcp, [::]:4017->4017/tcp
cap-redis      Up 4 minutes (healthy)    0.0.0.0:63793->6379/tcp, [::]:63793->6379/tcp
cap-worker     Up 2 minutes              
```

```text
register                                     -> 201 {"user":{"id":5,"email":"smoke1792482921454@example.com","role":"customer"}}
create order                                 -> total 9000 cents, status pending_payment
POST /payments (first)                       -> 202 {"payment":{"id":517,"orderId":504,"status":"pending","amountCents":9000,"currency":"USD","failureReason":null
POST /payments (same key)                    -> 202 Idempotent-Replay: true same id: true
order after async processing                 -> paid
GET /orders/:id again                        -> X-Cache: HIT
admin reconcile                              -> 200 {"ok":true,"counts":{"unbalanced_transactions":0,"balance_drift":0,"succeeded_without_ledger":0,"ledger_withou
```

The first start from an empty volume can be slow (MySQL initialises its data directory; on this busy machine it took over two minutes), which is why the MySQL healthcheck has
`start_period: 40s` and 60 retries. A fixed `sleep` would have been wrong.

### The load test

Setup: Docker Desktop on a Windows 11 laptop that was ALSO running several other containers and test suites for other work at the same time (host CPU around 90 percent while I measured).
That matters more than any tuning: treat the absolute numbers as "this noisy machine", and read them against the calibration row.

Why the load generator runs inside the compose network (`docker compose --profile load run --rm loadtest`): when I first ran autocannon from the Windows host, even `GET /health` topped out at about 850 req/s
because of the Docker Desktop port proxy. That measures Docker Desktop, not the API.

Command: `LOAD_PAYMENTS=500 docker compose --profile load run --rm loadtest`, with rate limits raised
(`PAYMENT_RATE_MAX=1000000 GLOBAL_RATE_MAX=1000000 AUTH_RATE_MAX=1000000`), default log level, one API process, one worker, `DB_POOL=30`.

Real output:

```text
 Container cap-provider Running 
 Container cap-api Running 
 Container cap-worker Running 
 Container cap-mysql Running 
 Container cap-redis Running 
 Container cap-mysql Waiting 
 Container cap-mysql Healthy 
 Container cap-migrate Starting 
 Container cap-migrate Started 
 Container cap-migrate Waiting 
 Container cap-redis Waiting 
 Container cap-migrate Waiting 
 Container cap-redis Waiting 
 Container cap-migrate Waiting 
 Container cap-redis Healthy 
 Container cap-redis Healthy 
 Container cap-migrate Exited 
 Container cap-migrate Exited 
 Container cap-migrate Exited 
 Container payments-orders-loadtest-run-9abfe341e5c6 Creating 
 Container payments-orders-loadtest-run-9abfe341e5c6 Created 
creating 500 orders...
0: calibration against a bare node http server, 5s, 50 connections
A: cached reads, 10s, 50 connections
B: 500 distinct payments, 30 connections
C: duplicate storm, one key, 30 connections, 3000 requests
waiting for async processing to drain...
+---------+----------------------------------------+-----------+--------+----------+--------+--------+------+--------+--------+----------+
| (index) | scenario                               | req/s avg | p50 ms | p97.5 ms | p99 ms | max ms | 2xx  | non2xx | errors | timeouts |
+---------+----------------------------------------+-----------+--------+----------+--------+--------+------+--------+--------+----------+
| 0       | '0 baseline: bare node http (ceiling)' | 1240      | 23     | 119      | 131    | 642    | 6200 | 0      | 0      | 0        |
| 1       | 'A GET /orders/:id (cache hit)'        | 268       | 163    | 352      | 367    | 375    | 2677 | 0      | 0      | 0        |
| 2       | 'B POST /payments (unique keys)'       | 42        | 580    | 1192     | 1500   | 1635   | 500  | 0      | 0      | 0        |
| 3       | 'C POST /payments (same key x3000)'    | 51        | 521    | 1177     | 1272   | 1387   | 3000 | 0      | 0      | 0        |
+---------+----------------------------------------+-----------+--------+----------+--------+--------+------+--------+--------+----------+
B accepted 500 payments in 12.1s; async pipeline drained 0.0s later (orders still pending: 0)
provider stats      : {"postAttempts":501,"chargesCreated":501,"webhooksSent":492,"webhookFailures":3179}
reconciliation      : {"ok":true,"counts":{"unbalanced_transactions":0,"balance_drift":0,"succeeded_without_ledger":0,"ledger_without_succeeded":0,"amount_mismatch":0,"order_payment_disagree":0,"stale_payments":0,"repaired":0}}
revenue delta       : expected 502000 cents, actual 502000 cents
provider charges    : 501 created for 501 paid orders (+ earlier runs on this provider instance)
```

How to read it:

- **Row 0 (calibration):** a do-nothing Node HTTP server on the same machine tops out around 1,240 req/s. The API cannot beat that here.
- **Row A (cache hit read, auth + rate limit + Redis):** about 270 req/s with p50 163 ms. That is roughly a fifth of the do-nothing ceiling: JWT verification, two Redis round trips and JSON
  logging per request on a single Node process. On a quiet machine and with `cluster`/multiple replicas this is easily several times higher; I did not tune it.
- **Row B (500 distinct payments, each a multi-statement transaction with row locks and an fsync-ed commit):** about 42 req/s at 30 connections, p50 580 ms, p99 1.5 s, zero errors.
- **Row C (3000 requests, same key):** all 3000 answered 202 with no errors, about 51 req/s. They serialise on one row lock by design; the first one creates, 2999 replay.
- **Correctness after the storm (the part that matters):** reconciliation clean; revenue delta EXACTLY 502,000 cents = 500 x $10.00 + 1 x $20.00. The hot order was paid once even though
  3,001 requests were made for it. `provider charges: 501 created for 501 paid orders` -- not 3,501.
- **`webhookFailures: 3179`** on the provider side: with the API saturated, most webhook deliveries timed out (5s) at the provider, which retried them. The retries were absorbed by
  event-id dedupe and the terminal-state guard. This is at-least-once delivery working as designed, and also the evidence for the "ack fast, process from a queue" improvement.

What this run does and does not show: it shows correctness under concurrency and retries (exact money, no duplicates, no deadlocks after the fix). It does NOT show maximum throughput; the machine was the
bottleneck. If you want better numbers: run on a quiet machine, use `--scale api=3` behind a load balancer, give MySQL `innodb_flush_log_at_trx_commit=2` for a dev benchmark (that trades durability for
speed -- never in production), and shard the two hot system accounts (ADR 0007).

### The first load run (what went wrong, kept for the lesson)

My first load run (before the lock-order fix described in Stage 7) never finished scenario C: MySQL sat at 100 percent CPU, the API logged more than 1,800 `Deadlock found` errors and about
10,000 `transaction retry` warnings, and webhooks answered 500. The provider's webhook retries masked the problem enough that the payments still got settled, which is exactly why a happy-path test would never have
caught it. The fixes were: lock accounts up front in ascending id order, post the ledger last (Stage 7), a separate connection pool for webhooks (Stage 1, ADR 0007), and slimmer request log lines. Each fix is
in the code above.

### Acceptance criteria

- [ ] `docker compose up --build` on a clean checkout reaches `cap-api` Up and `node scripts/smoke.mjs` ends with `admin reconcile -> 200 {"ok":true`
- [ ] `docker compose down -v && docker compose up --build` works from scratch (migrate + seed happen once, idempotently)
- [ ] The load test exits 0: `revenue delta: expected N cents, actual N cents`, reconciliation `ok: true`, nothing left pending
- [ ] `docker stop cap-worker` logs `worker shutting down` and `docker stop cap-api` logs `shutting down` (graceful)

Graceful shutdown, real output:

```text
{"level":30,...,"signal":"SIGTERM","msg":"worker shutting down"}
{"level":30,...,"signal":"SIGTERM","msg":"shutting down"}
```

### Interview concepts

Containerising Node (multi-process from one image, non-root, `npm ci --omit=dev`); compose healthchecks and `depends_on` conditions (`service_healthy`,
`service_completed_successfully`); one-shot migration jobs; config via environment; load testing methodology (calibrate, warm up, steady load, check
correctness afterwards); latency percentiles vs averages; coordinated omission (autocannon with fixed connections under-reports queueing); finding bugs with load; horizontal scaling of stateless APIs.

**Interview answer:** "`docker compose up --build` starts MySQL and Redis with healthchecks, runs migration and seed as a one-shot job, then the provider, API and worker from one image. I load tested
inside the compose network after finding that the Windows port proxy capped everything at ~850 req/s. The load test is also a correctness test: after 500 distinct payments and a 3000-request duplicate storm, I wait for the pipeline to drain, run
reconciliation and assert revenue increased by exactly the expected amount. The first run exposed a real lock-upgrade deadlock in my ledger posting, which I fixed with a consistent lock order. I can tell you the throughput I measured and
why I would not quote it as a capacity number: the machine was shared and saturated, and I calibrated against a bare Node server on the same box."

**Common mistakes:** quoting a throughput number without saying what hardware and what else was running; load testing only the happy path; not checking data integrity afterwards; benchmarking through a slow port proxy;
`sleep 10` instead of healthchecks; running the app as root; baking secrets into the image.

**Key concepts to remember**

- A load test that does not verify correctness afterwards only measures speed.
- Calibrate: know the ceiling of your load generator and machine.
- Healthchecks and one-shot migrations make "one command" reliable.

**Revision questions**

1. Why did we run autocannon inside the compose network?
2. What does the calibration row tell you?
3. What bug did the first load run reveal, and why did smaller tests not?
4. Why is `webhookFailures` high but the final data still correct?
5. How would you scale this system to 10x traffic, in order?

**Practical task:** run the load test with `docker compose up -d --scale api=3` behind an nginx container that round-robins to the three APIs. Compare the B row and explain which limit you hit next (hint: hot ledger rows).

- [ ] Compose stack up from scratch in one command
- [ ] Load test run, correctness verified
- [ ] I can quote the result honestly with its caveats

---

## How to explain this project in an interview

**Learning objectives**

- Deliver a 60-second pitch, a 5-minute walkthrough and a deep dive on demand, using your own numbers and your own bugs.

### The 60-second pitch (memorise the structure, not the words)

**Interview answer:** "I built a payments and orders backend in Node, Express 5 and MySQL, with Redis and BullMQ. Customers create orders and pay through an
external payment provider, which I also built as a fake service so I could test failures. The part I am proudest of is correctness under retries. `POST /payments`
is idempotent: the idempotency key, the payment and an outbox event are written in one transaction, so 50 concurrent duplicates produce exactly one payment. A relay publishes
the outbox to a BullMQ worker that calls the provider with its own idempotency key, with exponential backoff and full jitter and a dead-letter queue. The provider answers later with
signed webhooks, which I verify with an HMAC and a timestamp, de-duplicate by event id, and apply through a forward-only state machine, posting a double-entry ledger in the same transaction. A
reconciliation job proves the books balance and repairs lost webhooks. It is tested with 44 tests against real MySQL and Redis, runs with one docker compose command, and my load test found a real
deadlock that I fixed."

### The 5-minute walkthrough (draw this on the whiteboard)

1. **Draw the boxes:** client, API, MySQL, Redis, worker, provider (section 0.2). Say which is stateless and which holds truth.
2. **Walk the happy path** (section 0.3, steps 1-7). Pause at each arrow and say what can fail and who retries.
3. **Pick two deep dives** based on the interviewer's face: idempotency (Stage 4) and webhooks + ledger (Stage 7). Have outbox (Stage 6) ready.
4. **Close with a bug and a limit:** the lock-upgrade deadlock found by the load test, and "the two system ledger accounts are a throughput ceiling; I would shard them".

### Numbers you can quote (all real, from this build)

| Fact | Value |
|------|-------|
| Tests | 44 (9 unit, 16 API/integration, 11 webhook/reconcile, 8 end-to-end), all against real MySQL + Redis |
| Concurrency proof | 50 identical requests -> 1 payment, 1 outbox event, 1 provider charge, 4 ledger rows |
| Load test (noisy shared laptop, 1 API process) | 500 distinct payments + 3000-request duplicate storm: 0 errors; revenue exactly +502,000 cents; 501 provider charges for 501 paid orders |
| Cached read throughput | about 270 req/s here vs 1,240 req/s for a do-nothing Node server on the same box (calibration) |
| Bug found by load test | InnoDB shared->exclusive lock-upgrade deadlock on hot ledger accounts (> 1,800 deadlocks in the first run) |
| Size | about 1,900 lines of application code, 620 lines of tests, 144 lines of SQL, 7 ADRs |

Do NOT quote the throughput as capacity. Say "on a saturated laptop; the point was correctness under load and finding the deadlock".

### Likely interruptions and short answers

- "Why not Kafka?" -> Volume does not justify it; outbox + BullMQ gives at-least-once with far less to operate; the outbox also makes a later move to Kafka/CDC straightforward.
- "Why MySQL, not Postgres?" -> Team/stack choice here; everything used (row locks, unique indexes, `SKIP LOCKED`, generated columns) exists in Postgres too, where a partial unique index would replace my generated-column trick.
- "Is it exactly-once?" -> No. At-least-once delivery plus idempotent consumers gives exactly-once effect.
- "What would you do with more time?" -> see "Limitations and next steps" below.

**Common mistakes:** reciting the tech stack instead of the guarantees; claiming "exactly once"; quoting throughput without context; hiding the bug you found (it is your best story).

**Key concepts to remember**

- Lead with guarantees (what can't go wrong), then show how each is enforced and tested.
- Use the real bug and the real numbers; be explicit about what you did not build.

**Revision questions**

1. Give the 60-second pitch aloud and time it.
2. Which two deep dives would you choose for a payments company? For a generic SaaS?
3. How would you answer "what is the weakest part of your design?"
4. Which three numbers would you quote and which one would you refuse to quote?

**Practical task:** record yourself giving the 5-minute walkthrough with a whiteboard (or paper). Listen for filler words and unexplained jargon; redo it once.

- [ ] 60-second pitch ready
- [ ] 5-minute whiteboard walkthrough rehearsed
- [ ] I can tell the deadlock story in 60 seconds

---

## Interview Q&A (20 questions + 2 bonus)

Each answer is written the way you would say it. Stage numbers show where to re-read.

**Q1. How do you make `POST /payments` idempotent? (Stage 4)**
**Interview answer:** The client sends an Idempotency-Key. In a single transaction I insert the key row with `ON DUPLICATE KEY UPDATE`, which takes an exclusive lock on that primary key, then `SELECT ... FOR UPDATE`
it. If a response is stored and the request hash matches, I replay it; if the hash differs I return 422; otherwise I run the business logic, store the response on the key row and commit. Concurrent duplicates block on the
row lock and then read the committed response. A crash rolls everything back, so there is no stuck "processing" state.

**Q2. What happens if two identical requests arrive at the same millisecond? (Stage 4)**
**Interview answer:** MySQL serialises them on the key row's exclusive lock. The first one runs the logic and commits; the second one's insert then becomes a no-op, its `SELECT FOR UPDATE` sees the committed response and it
replays it. My test fires 50 at once and asserts exactly one payment, one outbox event, and the same payment id in all 50 responses.

**Q3. Why not just use a Redis lock for idempotency? (Stage 4, ADR 0003)**
**Interview answer:** A Redis lock and a MySQL write cannot commit atomically. If the lock expires while the request is still running, a second request repeats the work; if the lock is set and the database write fails, a
legitimate retry is blocked. Putting the key into the same MySQL transaction as the payment removes both failure modes, and I get the stored response for free.

**Q4. Explain the transactional outbox and what problem it solves. (Stage 6)**
**Interview answer:** It solves the dual-write problem: I cannot atomically update MySQL and publish to a queue. So the business transaction also inserts an event row into an outbox table. A relay later publishes pending rows to
the queue and marks them published. If it crashes between those two steps it republishes, so delivery is at-least-once, and consumers are written to tolerate duplicates.

**Q5. Is your pipeline exactly-once? (Stage 6)**
**Interview answer:** No. It is at-least-once end to end, and I get an exactly-once effect through idempotency at every hop: deterministic BullMQ job ids, a state check in the charge job, a provider-side idempotency key
derived from the payment id, a unique webhook event id, and a forward-only payment state machine.

**Q6. How do your retries work, and why jitter? (Stage 6)**
**Interview answer:** Five attempts with exponential backoff, base 500 ms, capped at 30 s, and full jitter: the delay is a random number between zero and the exponential ceiling. Jitter prevents all failed jobs from retrying at the same instant
and overwhelming a recovering provider. Only transient failures retry (timeouts, network errors, 5xx, 429). A permanent 4xx fails the payment immediately.

**Q7. What happens when retries are exhausted? (Stage 6)**
**Interview answer:** The job is copied to a dead-letter queue with its payload and error, and the payment stays pending. I deliberately do not mark it failed, because after repeated timeouts I do not know whether the provider
created the charge. An admin can inspect and requeue; the processor re-checks the payment state, so replay is safe. Reconciliation also reports payments that stay stuck.

**Q8. A provider call times out. Did the charge happen? (Stage 5, 6)**
**Interview answer:** Unknown, and that is why every call carries an idempotency key (`payment-<id>`). If the first request did create a charge, the retry returns the same charge instead of creating another. A timeout is never
treated as a failure.

**Q9. How do you secure the webhook endpoint? (Stage 7)**
**Interview answer:** HMAC-SHA256 over the timestamp plus the raw request body with a shared secret, compared in constant time, and a five-minute tolerance on the timestamp to stop replays. The route reads the raw body, because
re-serialising parsed JSON can change the bytes. A failed check returns 401 and changes nothing.

**Q10. Webhooks are delivered twice, or out of order. What happens? (Stage 7)**
**Interview answer:** Duplicates: the provider's event id has a unique constraint and is inserted in the same transaction as the state change, so the second delivery is recognised and acknowledged with 200. Out-of-order or conflicting
events: the payment is a forward-only state machine, so a `failed` event after `succeeded` is ignored. In both cases I return 200 so the provider stops retrying.

**Q11. Why do you return 200 for duplicate and ignored webhooks? (Stage 7)**
**Interview answer:** A non-2xx response tells the provider the delivery failed and triggers retries. For an event I have already processed, or deliberately ignored, retrying is pointless noise and can amplify load.

**Q12. How does your ledger work, and why double-entry? (Stage 2, 7)**
**Interview answer:** Amounts are integer cents. Every movement is an append-only set of entries sharing a transaction id, with debits equal to credits. A successful payment posts a capture (debit provider clearing, credit the customer
wallet) and a settlement (debit wallet, credit revenue). Double-entry gives an invariant I can check mechanically, and the cached balances on the accounts table are a projection I can recompute and compare.

**Q13. What did your load test find? (Stage 7, 12)**
**Interview answer:** A deadlock. Inserting a ledger row takes a shared lock on the account row because of the foreign key, and the following balance update needs an exclusive lock on the same row. Two concurrent payments each held the shared lock and
waited for the exclusive one. All payments touch the same two system accounts, so under load it happened thousands of times. The fix was to lock all touched accounts first, in ascending id order, with `SELECT ... FOR UPDATE`, and to post the ledger last
so the hot rows are held briefly.

**Q14. How do you keep the cache correct? (Stage 8)**
**Interview answer:** Cache-aside with explicit invalidation: after the transaction that changes an order commits, I delete its Redis key; the TTL of 60 seconds is only a safety net. Authorization is evaluated after the cache read so a cached object never leaks.
There is one residual race, where a reader who loaded the old row just before the commit repopulates the key after my delete; it is bounded by the TTL, and I would use versioned keys if that mattered.

**Q15. Why keyset pagination? (Stage 8)**
**Interview answer:** OFFSET reads and discards all skipped rows, so deep pages are slow, and inserts between page requests shift rows so items repeat or vanish. Keyset uses `WHERE id < cursor ORDER BY id DESC LIMIT n+1` with an index on `(user_id, id)`, so each page is an index seek, stable
under inserts, and fetching one extra row tells me whether there is a next page without a COUNT.

**Q16. How does your rate limiter work and what are its limits? (Stage 8)**
**Interview answer:** A fixed-window counter in Redis, incremented with an atomic Lua script that also sets the expiry, keyed by user on the payments endpoint and by IP elsewhere. It returns 429 with Retry-After. A fixed window allows a burst of up to twice the limit around a window
boundary, so for stricter control I would use a sliding window or a token bucket. It fails open if Redis is down, which is an availability choice I would revisit for login endpoints.

**Q17. What does reconciliation check, and why not auto-fix? (Stage 9)**
**Interview answer:** It recomputes truth from the ledger and checks that every ledger transaction balances, cached balances match, every succeeded payment has ledger entries and vice versa, amounts match, orders agree with payments, and no payment is stuck too long. Stuck payments
with a provider reference are repaired by asking the provider, because the provider is the authority on charge status. Everything else is reported for a human, since the system cannot know whether the cache or the entries are wrong.

**Q18. How would you scale this to ten times the traffic? (Stage 12)**
**Interview answer:** In order: run several stateless API replicas behind a load balancer (the API holds no state); scale workers horizontally (the relay uses `SKIP LOCKED`, BullMQ distributes jobs); add a MySQL read replica for list endpoints with attention to replication lag; acknowledge webhooks fast and
process them from a queue; and shard the two hot ledger accounts or derive their balances, since all payments currently serialise on those rows. Then measure again.

**Q19. What would you monitor and alert on? (Stage 10)**
**Interview answer:** Outbox backlog (earliest sign async processing stalled), dead-letter queue depth, any non-zero reconciliation invariant, p99 latency and 5xx rate on payment endpoints, webhook signature failures, and the ratio of replayed to created payments. Alerts are on user-visible symptoms and
invariants, not on CPU.

**Q20. What is the weakest part of your design? (Section 16)**
**Interview answer:** Three things. The two system ledger accounts are a serialisation point for all payments. Webhooks are processed inline, so a slow database makes the provider time out and retry; I would persist and queue them. And the DLQ and old outbox rows have no cleanup or alerting built in. I
documented all three and know the fix for each.

**Q21 (bonus). How do you prevent a customer paying the same order twice with different keys? (Stage 2, 4)**
**Interview answer:** The order row is locked inside the payment transaction, and I check for a live payment; as a backstop a generated column plus a unique index guarantees at most one pending, processing or succeeded payment per order, so even a bug in the application check cannot create two.

**Q22 (bonus). Why is the provider call not made in the HTTP request? (Stage 6, ADR 0001)**
**Interview answer:** It would tie our latency and availability to a third party and make the idempotency transaction span a network call, which cannot be rolled back. With the outbox, the request is fast and local, and slow or failing providers are handled by retries off the request path.

---

## Limitations and what I would build next

Be explicit about these in an interview; saying them first shows judgment.

| Limitation | Impact | What I would do |
|------------|--------|-----------------|
| Two system ledger accounts are hot rows | All payments serialise on them; throughput ceiling | Shard into N sub-accounts by payment id, or compute system balances from entries/snapshots |
| Webhooks processed inline | Under load the provider times out and retries (seen in the load test) | Verify + persist + enqueue + 200; settle from a queue |
| No refresh tokens, no token revocation | Stolen access token valid until expiry | Short access TTL + rotating refresh tokens + `jti` denylist |
| Idempotency key table and published outbox rows are never purged | Unbounded growth | Scheduled purge job (24h for keys; N days for published outbox) |
| Relay holds a DB transaction while calling Redis | Long transactions at high volume | Publish outside the transaction; rely on `jobId` dedupe |
| No refunds, partial payments or currencies other than USD | Smaller domain | Add `refunds` with reversing ledger entries |
| Single-region, no HA for MySQL/Redis | Outage = downtime | Managed MySQL with Multi-AZ; Redis with persistence (AOF) and a replica |
| Fixed-window rate limiter, fail-open | Boundary bursts; no protection during Redis outage | Token bucket; fail-closed on `/auth` |
| Notification consumer dedupes in Redis | Redis flush could re-send a notification | For money-affecting consumers, dedupe in MySQL in the same transaction |
| Fake provider is in-memory | A restart loses its state | Fine for a fake; real providers persist |
| No distributed tracing spans | Only a correlation id | OpenTelemetry (see `15_Observability_Cloud_CICD.md`) |
| Secrets are plain env vars in compose | Dev only | Secrets manager / Docker secrets |

---

## Summary, assessment and hours estimate

### Summary

You built a payments and orders backend whose core guarantees are: **idempotent writes** (key + request hash + stored response in one transaction), **atomic intent to publish**
(transactional outbox), **at-least-once delivery with idempotent consumers** (job ids, state checks, provider keys, SET NX), **safe third-party callbacks** (HMAC over raw body + timestamp, event-id dedupe,
forward-only state machine), **auditable money** (integer cents, double-entry ledger, reconciliation), and **operability** (structured logs with correlation ids, three metrics, graceful shutdown, one-command Docker). You also
found and fixed a real concurrency bug with a load test, which is the best story you can bring to an interview.

### Mixed-difficulty assessment

**Basic**

1. Why are amounts stored as integer cents?
2. What does HTTP 202 mean and why does `POST /payments` return it?
3. What is the difference between `/health` and `/ready`?
4. Which header carries the idempotency key and what happens on a repeat request?

**Intermediate**

5. Why does `INSERT ... ON DUPLICATE KEY UPDATE` serialise concurrent duplicates?
6. List the three places where this system de-duplicates the same logical payment.
7. Why must the webhook route see the raw body?
8. Why is the payment left `pending` when the DLQ receives its job?

**Advanced**

9. Explain the ledger deadlock precisely (which locks, which statements) and why locking in ascending id order fixes it.
10. The outbox relay crashes after `queue.add` but before `UPDATE ... published`. Trace what happens next and why no second charge occurs.
11. Design the change to "acknowledge webhooks immediately and settle from a queue". What new failure modes appear and how do you handle them?
12. Argue for or against caching `GET /payments/:id` the same way as orders.

### Answers

1. Floating point cannot represent most decimal fractions exactly; sums drift. Integers are exact, comparable and fast. Display formatting happens at the edge.
2. 202 Accepted: the request is valid and accepted for processing, but the work (charging the provider) is not complete. The outcome arrives later by webhook.
3. `/health` (liveness) says the process is up; restart if it fails. `/ready` (readiness) says dependencies are reachable; stop routing traffic if it fails but do not restart. Here `/ready` checks MySQL and Redis.
4. `Idempotency-Key`. A repeat with the same body replays the stored status and body with `Idempotent-Replay: true` and creates nothing; the same key with a different body returns 422.
5. The statement needs to update the existing row on duplicate, so InnoDB takes an exclusive lock on that primary key record. Other transactions inserting the same key wait for it to be released at commit, then see the committed row.
6. (a) the idempotency key (client retries), (b) the unique index on `active_order_id` (different keys, same order), (c) the provider idempotency key `payment-<id>` plus deterministic BullMQ job ids and the payment state check (queue redelivery), and (d) webhook event-id uniqueness plus the state machine (provider redelivery).
7. The HMAC is computed over exact bytes. Parsing then re-serialising can change whitespace or key order, so the computed MAC would differ, or worse, you would verify different data than you process. Mounting the route before `express.json()` and using `express.raw()` preserves the bytes.
8. After exhausted retries the provider may or may not have created the charge. Marking it failed could let the customer pay again and double charge. Pending keeps the order locked, raises an alert, and lets a human or reconciliation resolve it.
9. Txn A and B both `INSERT INTO ledger_entries` referencing account X; the foreign key check takes a shared lock on X for each. Then both run `UPDATE accounts ... WHERE id = X`, needing an exclusive lock; each waits for the other's shared lock to be released: deadlock, InnoDB rolls one back. Taking `SELECT ... FOR UPDATE` on all the needed accounts first, in ascending id, means a transaction either holds exclusive locks on all of them or waits at the first, so no cycle forms.
10. The outbox row stays `pending` (the transaction rolled back or never committed the update). On the next tick the relay selects it again and calls `queue.add` with the same `jobId = outbox-<id>`. BullMQ ignores an add with an existing job id (while the job is retained). Even if the job had been purged and ran again, the charge processor sees the payment is no longer `pending` and skips, and the provider would return the same charge for the same idempotency key.
11. The route verifies the signature, inserts the raw event into `webhook_deliveries` with status `received`, enqueues a job and returns 200. New failure modes: a persisted-but-unprocessed event if enqueue fails (use the same outbox pattern or process by scanning `received` rows), longer time to `paid`, ordering between events for one payment (process per-payment serially, e.g. job id or queue group by payment), and a poison event (retries + DLQ). Dedupe moves to the persistence step, the state machine remains as the guard.
12. For: it is read-heavy while polling for status. Against: the status changes within seconds (pending -> processing -> succeeded), so a 60s TTL would show stale states exactly when the user is watching, and invalidation must cover three writers (worker, webhook, reconciliation). A short TTL (1-2 s) or no cache plus `ETag`/`If-None-Match`
 is the better answer. Orders change rarely (once, to paid), which is why the order cache is worthwhile.

### Weak-area guidance

- Missed Q5-Q7: redo Stage 4 and Stage 7 and write the race by hand with timestamps.
- Missed Q8-Q10: redo Stage 6; run the DLQ demo again and read the BullMQ job states.
- Missed Q9/Q11: redo the lock experiment: open two `mysql` sessions and reproduce the shared->exclusive deadlock by hand with a parent/child table pair.
- Q12 and "weakest part" questions: re-read the limitations table.

### Hours estimate

| Module | Hours |
|--------|-------|
| 0 Overview + architecture + running it | 1.5 |
| Stage 0 ADRs | 1.5 |
| Stage 1 Scaffold | 2 |
| Stage 2 Schema + domain | 2 |
| Stage 3 Auth + RBAC + orders | 2.5 |
| Stage 4 Idempotent payments | 3 |
| Stage 5 Fake provider | 2 |
| Stage 6 Outbox + worker + retries + DLQ | 4 |
| Stage 7 Webhooks + settlement + ledger | 4 |
| Stage 8 Cache + rate limit + pagination | 2.5 |
| Stage 9 Reconciliation | 2 |
| Stage 10 Observability | 1.5 |
| Stage 11 Tests + mutation check | 3 |
| Stage 12 Docker + load test | 3 |
| Interview preparation (pitch, whiteboard, Q&A) | 3 |
| **Total** | **about 38** |

If you type the code yourself and do each practical task, expect 40-60 hours. Copy-pasting and running everything takes about 8-10 hours but teaches much less; do not do only that.

### Not verified (honest list)

- Everything in this file was executed, EXCEPT the following.
- **Windows PowerShell commands** (`$env:...`): the build and all commands ran in Git Bash; the PowerShell lines are standard syntax but I did not run them.
- **Multi-replica behaviour** (several API or worker replicas, `--scale`): reasoned about (`SKIP LOCKED`, row locks), not tested; the "two API instances" task is a practical exercise.
- **Redis or MySQL failing mid-request** beyond one manual check (`docker stop cap-redis` made `/ready` return 503 while `/health` stayed 200; the worker logged connection errors and recovered after restart). Rate-limiter fail-open and cache fallback paths are
  implemented but not covered by a dedicated automated test.
- **Per-stage intermediate states:** I built the code in stage order, but the stage acceptance checks and every pasted output come from the finished system, not from intermediate partial versions of `app.js`.
- **Throughput numbers** are from a heavily shared machine and are not capacity figures. Larger runs (1,000+ payments) were attempted before the fixes and are not reported.
- **Node 22:** all runs were on Node 20.20.x (host 20.20.1, container 20.20.2). The code uses nothing newer than Node 20.6 (`--env-file`), and I expect Node 22 to work, but I did not run it.
- **TLS, real PCI scope, real provider SDKs** are out of scope.
- **Docker image size (257 MB)** and cold-build time (a few minutes) depend on the network; not benchmarked.

**Key concepts to remember (whole capstone)**

- Idempotency at every hop; outbox for atomic publish; state machine for ordering; ledger + reconciliation for trust.
- Test concurrency with real databases and assert on persisted state; verify your tests can fail.
- Load tests find correctness bugs; calibrate before quoting numbers.

**Revision questions**

1. Which guarantee does each of these provide: idempotency key table, outbox, event-id table, state machine, ledger, reconciliation?
2. What are the three biggest limitations and their fixes?
3. Which stage would you rebuild first if you lost the code, and why?

**Practical task:** pick ONE item from the limitations table and implement it end to end (code, test, ADR amendment). The best candidate for interviews is "ack webhooks fast and settle from a queue".

- [ ] I can pitch the project in 60 seconds and 5 minutes
- [ ] I answered the 22 Q&As aloud without notes
- [ ] I implemented one improvement from the limitations table
