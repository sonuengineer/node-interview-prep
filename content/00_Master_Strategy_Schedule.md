# 00 -- Master Table of Contents, Preparation Strategy, 56-Day Schedule and Optional Supplement Track

Node.js Backend Interview Preparation (Frontend Developer to Backend Developer). **Core plan: 8 weeks, 56 days, ~2 hours/day, 112 hours.** **Optional supplement track: 6 more weeks, Days 57-98, another 84 hours (196 hours in total).**

This file is Part 00 of the combined document. It contains: (1) the master table of contents and file map for Parts 00-20, (2) the preparation strategy, (3) the complete 56-day core plan with a per-week hours table and a per-day minutes table, (4) the spaced-revision schedule for the core days and for the supplement days, (5) the 'if you fall behind' triage rules, and (6) the optional Supplement Track (Weeks 9-14) that closes gaps against `h:\Node\90-day-backend-engineer-roadmap.md`. All detailed notes, question banks, exercises, projects and labs live in the other numbered files in the same folder.

Style conventions used across all parts: ASCII only; Hinglish explanations with English technical terms; interview answers in professional English labelled `**Interview answer:**`; tier tags `[ESSENTIAL]` (asked in most interviews) and `[ADVANCED]` (supplementary); Node.js 22 LTS (20 noted where it differs), ES modules, Express 5, MySQL 8, mysql2/promise.

**What changed in this version of the plan (read this once):** the previous plan gave a flat 40 minutes per day to 'read notes', but each Day block in Parts 01-08 holds 480-1,040 lines, so the plan could not be followed. This version (a) parses the real note files, (b) schedules only the `[ESSENTIAL]` sections of each Day for the read slot, with heading titles, line ranges, line counts and a computed reading time, (c) moves practice sections, the wrap-up and `[ADVANCED]` sub-blocks out of the read slot, and (d) re-sizes every day's read and coding minutes (still 120 min per day, still 112 h) with the math shown in section 3.1. Exercise and question ID ranges that pointed past the real banks were corrected (section 1.4 and 1.5).

---

## 1. Master Table of Contents (whole combined document)

### 1.1 File map

| Part | File | Content | Status |
|------|------|---------|--------|
| 00 | 00_Master_Strategy_Schedule.md | Master TOC, strategy, 56-day plan, spaced revision, triage rules, optional Supplement Track (Weeks 9-14) | This file |
| 01 | 01_Week1_JavaScript.md | Week 1 notes (Day 1-6), daily wrap-ups, weekly test and answers | Core |
| 02 | 02_Week2_Node_Internals.md | Week 2 notes (Day 1-6), daily wrap-ups, weekly test and answers | Core |
| 03 | 03_Week3_Express_REST.md | Week 3 notes (Day 1-6), daily wrap-ups, weekly test and answers | Core |
| 04 | 04_Week4_MySQL.md | Week 4 notes (Day 1-6), daily wrap-ups, weekly test and answers | Core |
| 05 | 05_Week5_Data_Auth_Security.md | Week 5 notes (Day 1-6), daily wrap-ups, weekly test and answers | Core |
| 06 | 06_Week6_Testing_Production.md | Week 6 notes (Day 1-6), daily wrap-ups, weekly test and answers | Core |
| 07 | 07_Week7_System_Design.md | Week 7 notes (Day 1-6), daily wrap-ups, weekly test and answers | Core |
| 08 | 08_Week8_Revision_Mocks_Checklist.md | Week 8 (Day 1-7), mock sets 1-4 with model answers, final readiness checklist, readiness assessment | Core |
| 09 | 09_Question_Bank_A.md | Question bank categories 1-5 (Q-JS, Q-NODE, Q-EXP, Q-SQL, Q-MONGO) | Core |
| 10 | 10_Question_Bank_B.md | Question bank categories 6-10 (Q-SEC, Q-TEST, Q-PERF, Q-PROD, Q-SD) | Core |
| 11 | 11_Coding_Exercises.md | All coding exercises (problems section, then solutions section), 90 exercises in 13 groups | Core |
| 12 | 12_Project_Task_API.md | End-to-end Task Management API project (Stage 1-7, Extensions A-D) | Core |
| 13 | 13_Linux_Networking_Foundations.md | Linux CLI, processes, TCP/HTTP/DNS/TLS on the wire, Docker networking (Q-LNX) | Supplement |
| 14 | 14_Database_Internals.md | B+tree, buffer pool, WAL/redo, MVCC, planner, replication, pool sizing (Q-DBI) | Supplement |
| 15 | 15_Observability_Cloud_CICD.md | Metrics, tracing, alerting/SLO, CI/CD, AWS basics (Q-OBS) | Supplement |
| 16 | 16_Chaos_Lab.md | Break-your-own-system lab against the Task API (chaos Q1-Q25 in Module 11) | Supplement |
| 17 | 17_Capstone_Payments_Project.md | Payments/orders backend capstone: idempotency, outbox, webhooks, ledger (capstone Q1-Q20) | Supplement |
| 18 | 18_URL_Shortener_Build.md | Build the URL shortener end to end (Q-URL) | Supplement |
| 19 | 19_Concurrency_Distributed_Systems.md | Concurrency labs, distributed-systems depth, capacity maths (Q-CONC) | Supplement |
| 20 | 20_Resume_Portfolio_Career.md | Resume, portfolio, behavioural stories, application strategy (Q-CAR) | Supplement |

Parts 13-20 are written to close gaps found by comparing the core plan with `h:\Node\90-day-backend-engineer-roadmap.md`. They are scheduled in section 6 (Weeks 9-14) as an OPTIONAL track after the core 56 days. Status of every other part is owned by its own author (each ends with a `## REMAINING` list if incomplete).

### 1.2 Contents of this file (Part 00)

1. Master Table of Contents (1.1 file map, 1.2 contents, 1.3 week files and supplement parts, 1.4 question banks, 1.5 exercises and projects, 1.6 weekly assessments)
2. Preparation strategy overview (2.1 how to use this document, 2.2 ESSENTIAL vs ADVANCED triage, 2.3 honest scope note, 2.4 how to study 2 hours/day, 2.5 how to use Day 7, 2.6 week-by-week arc)
3. The complete 56-day plan (3.1 per-week hours table, reading-time math and per-day minutes, 3.2 to 3.9 Week 1 to Week 8, Day 1 to Day 7 each)
4. Spaced-revision schedule (4.1 method, 4.2 topic-cluster table, 4.3 day-by-day revisit table for Days 1-56, 4.4 day-by-day revisit table for supplement Days 57-98)
5. 'If you fall behind' triage rule (5.1 decision table, 5.2 per-week skip and never-skip lists, 5.3 recovery rules, 5.4 supplement triage)
6. Optional Supplement Track, Weeks 9-14, Days 57-98 (6.1 what it is and the gap map, 6.2 which parts first for your target role, 6.3 hours budget, 6.4 per-week hours, 6.5 to 6.10 Weeks 9-14, 6.11 rules for the track)

### 1.3 Week files and their Day sections

Each week file has one `## Day X - <title>` heading per study day (Week 8 has Day 1-7). Refer to them as 'Week N / Day X notes'. Every Day block starts with `**Learning objectives**` and ends with key concepts, five revision questions, one practical coding task and a self-assessment checklist. Every week file ends with: revision summary, mixed-difficulty assessment (Basic/Intermediate/Advanced), answers with explanations, weak-area identification guidance, catch-up plan. Tier tags are on the topic headings (`### Topic 1.1 - ... [ESSENTIAL]`) and on bold sub-blocks inside a topic (`**... [ADVANCED]**`); section 3 uses them to build each day's reading plan.

**Week 1 -- JavaScript for Backend** (`01_Week1_JavaScript.md`, Days 1-7)

- Day 1 (overall Day 1) - Execution context, call stack, scope, closures, hoisting
- Day 2 (overall Day 2) - this, prototypes, prototypal inheritance
- Day 3 (overall Day 3) - Objects, arrays, references, manipulation patterns
- Day 4 (overall Day 4) - Promises, chaining, async/await, error propagation
- Day 5 (overall Day 5) - Event loop, call stack, microtasks vs macrotasks, output prediction
- Day 6 (overall Day 6) - Promise.all / allSettled / race / any, common async mistakes
- Day 7 (overall Day 7) - Revision, weekly test, catch-up

**Week 2 -- Node.js Internals** (`02_Week2_Node_Internals.md`, Days 8-14)

- Day 1 (overall Day 8) - Node vs browser JS, V8, libuv, runtime architecture
- Day 2 (overall Day 9) - Event loop phases, async I/O, blocking vs non-blocking, thread pool
- Day 3 (overall Day 10) - Worker threads, CommonJS vs ESM, process, Buffer, env variables
- Day 4 (overall Day 11) - File system and streams
- Day 5 (overall Day 12) - Backpressure, stream pipelines, EventEmitter
- Day 6 (overall Day 13) - Memory management, garbage collection, memory leaks
- Day 7 (overall Day 14) - Revision, weekly test, catch-up

**Week 3 -- Express.js and REST APIs** (`03_Week3_Express_REST.md`, Days 15-21)

- Day 1 (overall Day 15) - HTTP lifecycle, methods, headers, status codes, cookies, content types
- Day 2 (overall Day 16) - REST principles, API design, Express setup, routes/controllers/services
- Day 3 (overall Day 17) - Middleware, request validation, sanitization
- Day 4 (overall Day 18) - Centralized error handling, authentication middleware
- Day 5 (overall Day 19) - Pagination, filtering, sorting, API versioning
- Day 6 (overall Day 20) - File uploads, API docs (OpenAPI/Swagger), CORS, request lifecycle debugging
- Day 7 (overall Day 21) - Revision, weekly test, catch-up

**Week 4 -- MySQL and Database Fundamentals** (`04_Week4_MySQL.md`, Days 22-28)

- Day 1 (overall Day 22) - Relational fundamentals, tables, keys, constraints, relationships, CRUD
- Day 2 (overall Day 23) - INNER/LEFT JOIN, GROUP BY/HAVING, subqueries
- Day 3 (overall Day 24) - Normalization, indexes, composite indexes
- Day 4 (overall Day 25) - Transactions, ACID, isolation levels, concurrency problems
- Day 5 (overall Day 26) - Deadlocks, locking, connection pooling
- Day 6 (overall Day 27) - EXPLAIN, execution plans, query optimization, pagination and DB performance
- Day 7 (overall Day 28) - Revision, weekly test, catch-up

**Week 5 -- Data Access, MongoDB, Authentication and Security** (`05_Week5_Data_Auth_Security.md`, Days 29-35)

- Day 1 (overall Day 29) - Node.js to MySQL (mysql2), pooling, transactions in code, ORM vs raw SQL
- Day 2 (overall Day 30) - MongoDB documents, collections, indexes, aggregation, SQL vs NoSQL
- Day 3 (overall Day 31) - Signup/login APIs, bcrypt, JWT structure and verification
- Day 4 (overall Day 32) - Access/refresh tokens, sessions vs JWT, authn vs authz, RBAC
- Day 5 (overall Day 33) - SQL injection, XSS, CSRF, CORS, rate limiting
- Day 6 (overall Day 34) - Secure config, secrets management, common production security mistakes
- Day 7 (overall Day 35) - Revision, weekly test, catch-up

**Week 6 -- Testing and Production Engineering** (`06_Week6_Testing_Production.md`, Days 36-42)

- Day 1 (overall Day 36) - Unit vs integration tests, Jest/Vitest, Supertest, mocking, negative tests
- Day 2 (overall Day 37) - Logging, structured errors, correlation IDs
- Day 3 (overall Day 38) - Timeouts, retries, exponential backoff, idempotency, duplicate-request prevention
- Day 4 (overall Day 39) - Redis fundamentals, caching, cache invalidation
- Day 5 (overall Day 40) - Background jobs, queues, graceful shutdown
- Day 6 (overall Day 41) - Debugging slow APIs and memory leaks, basic load testing
- Day 7 (overall Day 42) - Revision, weekly test, catch-up

**Week 7 -- Backend System Design and Production Scenarios** (`07_Week7_System_Design.md`, Days 43-49)

- Day 1 (overall Day 43) - Modular monolith vs microservices, load balancing, horizontal scaling, caching and DB scaling
- Day 2 (overall Day 44) - Rate limiter design, notification system design
- Day 3 (overall Day 45) - URL shortener design, file upload architecture
- Day 4 (overall Day 46) - Payment/transaction workflows, retries, idempotency, failure recovery
- Day 5 (overall Day 47) - Message queues, async processing, logging/metrics/monitoring
- Day 6 (overall Day 48) - Docker and deployment basics, design-practice session
- Day 7 (overall Day 49) - Revision, weekly test, catch-up

**Week 8 -- Interview Revision and Mock Preparation** (`08_Week8_Revision_Mocks_Checklist.md`, Days 50-56)

- Day 1 (overall Day 50) - JavaScript and Node rapid revision
- Day 2 (overall Day 51) - Express/REST and SQL/MongoDB revision
- Day 3 (overall Day 52) - Auth/security scenarios and coding exercises
- Day 4 (overall Day 53) - Debugging/incident scenarios and backend machine-coding
- Day 5 (overall Day 54) - System design revision and project explanation questions
- Day 6 (overall Day 55) - Mock interview sets 1 and 2
- Day 7 (overall Day 56) - Final mock, final readiness checklist, readiness assessment

**Supplement parts 13-20** (optional, scheduled in section 6). Each `## ` heading below is one module that the study dashboard treats as one sitting (1-2 hours). Line numbers are the real ones in the current files.

**Part 13 -- Linux and Networking Foundations** (`13_Linux_Networking_Foundations.md`)

- Lab 0 - Build the lab machine (20 minutes) (lines 20-81, untagged)
- Module 1 - Shell, filesystem, permissions, pipes, exit codes (lines 82-263, ESSENTIAL)
- Module 2 - grep, sed, awk, xargs, find: reading logs like a backend dev (lines 264-426, ESSENTIAL)
- Module 3 - Processes, signals and resource inspection (lines 427-672, ESSENTIAL)
- Module 4 - Lab: "port already in use" and "who holds my port" (lines 673-823, ESSENTIAL)
- Module 5 - Docker run flags, bridge vs host networking, container DNS; lab "unreachable from another cont (lines 824-1155, ESSENTIAL)
- Module 6 - TCP in practice: handshake, TIME_WAIT, CLOSE_WAIT, strace and a blocked event loop (lines 1156-1514, ESSENTIAL)
- Module 7 - HTTP on the wire: keep-alive, chunked encoding, and connection pool vs socket vs request (lines 1515-1712, ESSENTIAL)
- Module 8 - DNS, localhost vs 127.0.0.1 vs 0.0.0.0, and TLS (lines 1713-2054, ESSENTIAL)
- Module 9 - Logs, systemd, journalctl, ssh and scp (lines 2055-2327, ESSENTIAL)
- Module 10 - Interview question bank (26 questions with answers) (lines 2328-2456, ESSENTIAL)

**Part 14 -- Database Internals** (`14_Database_Internals.md`)

- Module 0 - Lab setup: one primary, one replica, one scratch database (lines 44-172, ESSENTIAL)
- Module 1 - B+tree on disk: clustered vs secondary index, covering index, why random UUID PKs hurt (lines 173-406, ESSENTIAL)
- Module 2 - Buffer pool: hit ratio, sizing, reading SHOW ENGINE INNODB STATUS (lines 407-600, ESSENTIAL)
- Module 3 - WAL: redo log, doublewrite buffer, binlog, crash recovery, group commit (lines 601-856, ESSENTIAL)
- Module 4 - MVCC and undo logs: read views, why long transactions hurt, purge lag (lines 857-1031, ESSENTIAL)
- Module 5 - The query planner: cost model, statistics, histograms, EXPLAIN ANALYZE, optimizer hints (lines 1032-1233, ESSENTIAL)
- Module 6 - Replication: binlog, async vs semi-sync, replication lag, stale reads and read/write split (lines 1234-1502, ESSENTIAL)
- Module 7 - Connection pooling: why the DB runs out of connections first, pool-sizing math, exhaustion sym (lines 1503-1715, ESSENTIAL)
- Module 8 - "Why is my DB the bottleneck?" diagnosis checklist (lines 1716-1892, ESSENTIAL)

**Part 15 -- Observability, Cloud and CI/CD** (`15_Observability_Cloud_CICD.md`)

- Module 1 - Metrics: RED, USE, Prometheus, Grafana (lines 50-815, ESSENTIAL)
- Module 2 - Distributed tracing with OpenTelemetry (Jaeger) (lines 816-1107, ESSENTIAL)
- Module 3 - Alerting, SLI/SLO, error budgets and burn-rate rules (lines 1108-1519, ESSENTIAL)
- Module 4 - CI/CD with GitHub Actions and deployment strategies (lines 1520-1994, ESSENTIAL)
- Module 5 - Cloud basics with AWS as the worked example (lines 1995-2600, ESSENTIAL)
- Module 6 - Interview question bank: observability, CI/CD and cloud (lines 2601-2760, ESSENTIAL)

**Part 16 -- Chaos Lab** (`16_Chaos_Lab.md`)

- Module 0 - The lab: stack, tools and method (lines 31-547, untagged)
- Module 1 - Failure 1: kill MySQL (lines 548-1456, untagged)
- Module 2 - Failure 2: kill Redis (cache + queue): silent data loss (lines 1457-1954, untagged)
- Module 3 - Failure 3: delay and partition the queue/cache path (toxiproxy) (lines 1955-2267, untagged)
- Module 4 - Failure 4: duplicate messages (and a poison message) (lines 2268-2627, untagged)
- Module 5 - Failure 5: force an API timeout (slow dependency) (lines 2628-2999, untagged)
- Module 6 - Failure 6: exhaust the MySQL connection pool (lines 3000-3404, untagged)
- Module 7 - Failure 7: 10x traffic with autocannon (lines 3405-3683, untagged)
- Module 8 - Failure 8: rolling restart (deploy) under load with SIGTERM and graceful shutdown (lines 3684-3979, untagged)
- Module 9 - Incident review: one complete example and a blank template (lines 3980-4154, untagged)
- Module 10 - Bugs and wrong claims found in 12_Project_Task_API.md (with exact corrected text) (lines 4155-4329, untagged)
- Module 11 - Interview questions and answers (chaos, resilience, incidents) (lines 4330-4560, untagged)

**Part 17 -- Capstone Payments Project** (`17_Capstone_Payments_Project.md`)

- 0. Overview, architecture, folder tree, how to run (lines 45-295, untagged)
- Stage 0 - ADRs written first (lines 296-561, untagged)
- Stage 1 - Scaffold: config, logging, errors, DB and Redis, health (lines 562-1068, untagged)
- Stage 2 - Domain model and schema (lines 1069-1419, untagged)
- Stage 3 - Auth, RBAC and orders (lines 1420-1733, untagged)
- Stage 4 - Idempotent POST /payments (lines 1734-2106, untagged)
- Stage 5 - The fake payment provider (lines 2107-2447, untagged)
- Stage 6 - Transactional outbox, relay, BullMQ worker, retries, backoff + jitter, DLQ (lines 2448-2881, untagged)
- Stage 7 - Signed webhooks, settlement state machine, double-entry ledger (lines 2882-3285, untagged)
- Stage 8 - Caching with explicit invalidation, rate limiting, keyset pagination (lines 3286-3526, untagged)
- Stage 9 - Reconciliation job (lines 3527-3829, untagged)
- Stage 10 - Observability: structured logs, correlation ids, three metrics (lines 3830-3988, untagged)
- Stage 11 - Tests (including 50 duplicate requests -> exactly one charge) and a mutation check (lines 3989-4852, untagged)
- Stage 12 - Docker Compose one-command run, smoke test, load test and its result (lines 4853-5367, untagged)
- How to explain this project in an interview (lines 5368-5432, untagged)
- Interview Q&A (20 questions + 2 bonus) (lines 5433-5525, untagged)

**Part 18 -- URL Shortener Build** (`18_URL_Shortener_Build.md`)

- Overview: how to use this file, folder tree, design decisions (lines 28-163, untagged)
- Stage 1 - Requirements, project skeleton, config and schema (lines 164-553, untagged)
- Stage 2 - Authentication and per-user links (lines 554-751, untagged)
- Stage 3 - Create links: validation, code generation, idempotency (lines 752-1253, untagged)
- Stage 4 - Redirect, 302 vs 301, Redis cache-aside, click counting (lines 1254-1439, untagged)
- Stage 5 - Expiration, stats, delete, pagination, cleanup job (lines 1440-1629, untagged)
- Stage 6 - Rate limiting (sliding window, Redis Lua) (lines 1630-1770, untagged)
- Stage 7 - Error contract, OpenAPI, app wiring, graceful shutdown (lines 1771-2378, untagged)
- Stage 8 - Tests: unit + integration with real MySQL and Redis (lines 2379-3488, untagged)
- Stage 9 - Docker (multi-stage, non-root), compose, CI (lines 3489-3765, untagged)
- Stage 10 - Load test, README, and shipping it (lines 3766-4032, untagged)
- Interview Q&A (24) (lines 4033-4179, untagged)

**Part 19 -- Concurrency and Distributed Systems** (`19_Concurrency_Distributed_Systems.md`)

- Lab 0 - Setup and ground rules (lines 30-91, ESSENTIAL)
- Lab 1 - A race inside ONE Node process (async check-then-act) (lines 92-236, ESSENTIAL)
- Lab 2 - The database lost update: 10,000 concurrent updates on MySQL (lines 237-532, ESSENTIAL)
- Lab 3 - Real threads: SharedArrayBuffer + Atomics (lines 533-649, ADVANCED)
- Lab 4 - A bounded task pool with graceful drain (lines 650-810, ESSENTIAL)
- Lab 5 - A Mutex and a Semaphore from promises (and a deadlock) (lines 811-945, ESSENTIAL)
- Lab 6 - Blocking the event loop, measured with monitorEventLoopDelay (lines 946-1079, ESSENTIAL)
- Lab 7 - "What happens when 10,000 users update the same record simultaneously?" (lines 1080-1153, ESSENTIAL)
- B1 - CAP theorem and eventual consistency (lines 1154-1300, ESSENTIAL)
- B2 - Consensus and Raft, step by step, with a runnable election (lines 1301-1555, ADVANCED)
- B3 - Idempotency, retries, timeouts and retry storms (lines 1556-1776, ESSENTIAL)
- B4 - Circuit breakers and backpressure (lines 1777-1967, ESSENTIAL)
- B5 - Distributed locks with Redis: SET NX PX, tokens, fencing, and why Redlock is contested (lines 1968-2196, ESSENTIAL)
- B6 - Leader election (lines 2197-2328, ESSENTIAL)
- B7 - Saga and two-phase commit (lines 2329-2589, ESSENTIAL)
- B8 - The failure ledger: for each of the 12 topics, what it prevents, introduces and costs (lines 2590-2618, ESSENTIAL)
- C1 - Latency vs throughput vs concurrency, and Little's law (lines 2619-2789, ESSENTIAL)
- C2 - Back-of-envelope worked examples: URL shortener, chat, feed, payments (lines 2790-3079, ESSENTIAL)
- C3 - SLOs and error-budget math (lines 3080-3184, ESSENTIAL)
- Interview questions with answers (Q-CONC-01 to Q-CONC-42) (lines 3185-3355, ESSENTIAL)

**Part 20 -- Resume, Portfolio and Career** (`20_Resume_Portfolio_Career.md`)

- Module 1 - Positioning the transition story (lines 29-183, ESSENTIAL)
- Module 2 - Resume: structure, impact-first bullets, what to cut (lines 184-354, ESSENTIAL)
- Module 3 - Bullet rewrite bank (weak to strong) and one-page template (lines 355-532, ESSENTIAL)
- Module 4 - Portfolio and GitHub: repos, README, commits, diagrams, ADRs (lines 533-815, ESSENTIAL)
- Module 5 - Deployed demo guide: free tiers, honestly (lines 816-933, ESSENTIAL)
- Module 6 - LinkedIn and application strategy (lines 934-1177, ESSENTIAL)
- Module 7 - The interview loop: online assessments, machine coding, system design (lines 1178-1336, ESSENTIAL)
- Module 8 - Behavioural interviews: STAR, 8 story prompts with worked examples (lines 1337-1542, ESSENTIAL)
- Module 9 - Salary negotiation basics and questions to ask the interviewer (lines 1543-1686, ESSENTIAL)
- Module 10 - 30-day application and mock-interview calendar (lines 1687-1809, ESSENTIAL)
- Module 11 - Honest expectations: junior vs mid, what 8-12 weeks can and cannot do (lines 1810-1916, ESSENTIAL)
- Module 12 - Q&A bank: behavioural and transition-specific (26 questions) (lines 1917-2049, ESSENTIAL)
### 1.4 Question bank categories, ID prefixes and real counts

IDs were checked by grepping the actual files (distinct IDs defined, not mentions). 'Scheduled in core' shows the ID range the daily plan uses; 'Bonus' IDs exist but are not in any daily range: use them on Day 7, in Week 8, or when ahead of schedule.

| Cat. | Category | ID prefix | File | IDs that exist | Scheduled in core | Bonus (not scheduled) |
|------|----------|-----------|------|----------------|-------------------|-----------------------|
| 1 | JavaScript fundamentals and asynchronous programming | Q-JS | 09_Question_Bank_A.md | 01..30 (30) | 01..30 | none |
| 2 | Node.js runtime and internals | Q-NODE | 09_Question_Bank_A.md | 01..30 (30) | 01..30 | none |
| 3 | Express.js and API design | Q-EXP | 09_Question_Bank_A.md | 01..30 (30) | 01..30 | none |
| 4 | Databases and SQL queries | Q-SQL | 09_Question_Bank_A.md | 01..34 (34) | 01..34 | none |
| 5 | MongoDB | Q-MONGO | 09_Question_Bank_A.md | 01..30 (30) | 01..10 | 11..30 |
| 6 | Authentication and security | Q-SEC | 10_Question_Bank_B.md | 01..32 (32) | 01..30 | 31..32 |
| 7 | Testing and debugging | Q-TEST | 10_Question_Bank_B.md | 01..30 (30) | 01..20 | 21..30 |
| 8 | Performance and scalability | Q-PERF | 10_Question_Bank_B.md | 01..32 (32) | 01..22 | 23..32 |
| 9 | Production scenarios | Q-PROD | 10_Question_Bank_B.md | 01..32 (32) | 01..20 | 21..32 |
| 10 | Backend system design | Q-SD | 10_Question_Bank_B.md | 01..30 (30) | 01..30 | none |
| | **Core total** | | | **310** | **256** | **54** |

Core totals: 30+30+30+34+30+32+30+32+32+30 = 310 IDs that exist. Scheduled: 30+30+30+34+10+30+20+22+20+30 = 256. Bonus: 310 - 256 = 54 (Q-MONGO 20, Q-SEC 2, Q-TEST 10, Q-PERF 10, Q-PROD 12).

Supplement question IDs (section 6):

| Part | ID scheme | IDs that exist | Where they live |
|------|-----------|----------------|-----------------|
| 13 | Q-LNX-01.. | 01..26 (26) | Module 10, lines 2328-2456 |
| 14 | Q-DBI-01.. | 01..32 (32), each tagged [E] or [A] | section 'Interview questions', lines 1893-2048 |
| 15 | Q-OBS-01.. | 01..37 (37), tagged [ESSENTIAL] or [ADVANCED] | Module 6, lines 2601-2760 |
| 16 | Chaos Q1..Q25 (no Q- prefix; this schedule writes CH-Q1..CH-Q25) | 25 | Module 11, lines 4330-4560 |
| 17 | Capstone Q1..Q20 + 2 bonus (no Q- prefix; this schedule writes CAP-Q1..CAP-Q20) | 20 (+2 bonus) | 'Interview Q&A', lines 5433-5525 |
| 18 | Q-URL-01.. | 01..24 (24) | 'Interview Q&A', lines 4033-4179 |
| 19 | Q-CONC-01.. | 01..42 (42) | 'Interview questions with answers', lines 3185-3355 |
| 20 | Q-CAR-01.. | 01..26 (26) | Module 12, lines 1917-2049 |

Supplement total: 26+32+37+25+20+24+42+26 = 232 IDs (plus 2 bonus capstone questions). Combined with the core bank that is 542 question IDs.

Note on ID ranges used in the daily plan: ranges such as Q-JS-01..06 are assigned by index so that each day gets a fresh slice of the bank in order. All ranges in this file were checked against the lists above; if you find one that points past an existing ID, the list above wins.

### 1.5 Coding exercise groups, project and checklist

Counts are the real number of `EX-` IDs defined in `11_Coding_Exercises.md` (90 in total). The previous plan referred to exercise numbers past the end of several groups (EX-LOOP, EX-SQL, EX-ASYNC, EX-EXP, EX-MW, EX-JWT, EX-TXN). Those references were replaced by the real IDs listed below or by the practical tasks inside the Day notes.

| Group | Topic | IDs that exist | Main weeks |
|-------|-------|----------------|------------|
| EX-ASYNC | Promises and async/await | 01..07 | 1, 8 |
| EX-LOOP | Event loop output prediction | 01..06 | 1, 2, 8 |
| EX-ARR | Array and object manipulation | 01..06 | 1 |
| EX-ERR | Asynchronous error handling | 01..06 | 1, 6, 8 |
| EX-EXP | Express CRUD APIs | 01..06 | 3, 8 |
| EX-MW | Request validation and middleware | 01..06 | 3, 8 |
| EX-SQL | SQL joins and aggregation (no index-design or injection exercise) | 01..08 | 4, 8 |
| EX-TXN | Transaction-safe database operations | 01..07 | 4, 5, 8 |
| EX-JWT | JWT authentication | 01..06 | 5, 8 |
| EX-TEST | API testing | 01..06 | 6 |
| EX-DEBUG | Debugging slow or failing APIs | 01..08 | 2, 4, 6, 8 |
| EX-RATE | Rate limiter ladder | 01..07 | 5, 6, 7, 8 |
| EX-IDEM | Preventing duplicate transaction requests | 01..07 | 6, 7, 8 |

All exercises are in `11_Coding_Exercises.md` (problem statements first, solutions in a separate section so you can attempt before looking).

**Project (`12_Project_Task_API.md`)**: Stage 1 setup + Express skeleton (Week 3), Stage 2 CRUD + validation + error handling (Week 3), Stage 3 MySQL schema + data layer (Weeks 4-5), Stage 4 auth + RBAC (Week 5), Stage 5 pagination/filter/sort + transactions (Weeks 5-6), Stage 6 tests + logging + security middleware (Week 6), Stage 7 README + API docs (Weeks 6-7); Extension A Redis cache, B background jobs, C Docker, D deployment.

**Supplement projects (section 6)**: `16_Chaos_Lab.md` breaks the Task API; `17_Capstone_Payments_Project.md` is the serious payments project (Stage 0-12); `18_URL_Shortener_Build.md` is the URL shortener build (Stage 1-10).

**Readiness material (`08_Week8_Revision_Mocks_Checklist.md`)**: Week 8 Day 1-7, mock interview sets 1-4 with model answers, the final revision checklist, and the readiness assessment.

### 1.6 Weekly assessments

Each week file contains its own mixed-difficulty weekly test with answers. You take it on Day 7 of that week (see section 3). Supplement parts 13-20 each end with their own assessment, used on the supplement Day 7s (section 6).

---

## 2. Preparation Strategy Overview

### 2.1 How to use this document

- **This file is your calendar.** Open it every day, find today's block, and follow the minutes. It tells you exactly which section of which file to read and which question and exercise IDs to do.
- **The week files are your textbook.** Read the Hinglish concept first, then the Interview answer, then run the code yourself.
- **The question banks and exercises are your gym.** Reading an answer is not the same as being able to produce it. Always hide the answer first.
- **The project is your proof.** Interviewers ask about what you built. Keep the Task API running and green as you go.
- Keep a notebook (or a text file) with three lists: 'things I could not explain', 'things I got wrong', 'questions I want ChatGPT to explain'. Review the lists on every Day 7.

### 2.2 ESSENTIAL vs ADVANCED triage

Every topic in the week files is tagged. Use the tags as follows:

| Tier | Meaning | Rule |
|------|---------|------|
| `[ESSENTIAL]` | Asked in most junior-to-mid backend interviews | Never skip. You must be able to explain it aloud and code the basic version without notes. |
| `[ADVANCED]` | Supplementary, depth or breadth beyond the usual interview | Read once if time permits; skip first when behind (see section 5). Return to it only after Week 8 mock sets. |

Day tier labels in section 3 show whether a day is purely ESSENTIAL or mixes in ADVANCED material. On mixed days, the ADVANCED parts are listed in the 'ADVANCED (skip first)' line.

### 2.3 Honest scope note

Eight weeks at 2 hours/day (~112 hours) can make you interview-ready for typical junior-to-mid Node.js backend roles: you will be able to explain the core concepts, write common code, discuss your project, and give structured design answers. It **cannot** make you an expert in everything. Specifically:

- Backend engineering depth (database internals, distributed systems, production operations) normally takes years of hands-on experience. You will learn the vocabulary and the reasoning, not the scars.
- MongoDB, Redis, queues, Docker and system design get one to two days each. That is enough for an honest 'I understand the fundamentals and have used it in a small project', not for a claim of deep expertise.
- Do not claim experience you do not have in interviews. State what you built (Task API) and what you studied. Interviewers respect honesty plus sound reasoning.
- Expect to need follow-up study after week 8, targeted at the weak areas your mock interviews reveal. Section 5 and Week 8 explain how.
- **The supplement does not change this scope note.** Parts 13-20 (section 6) add Linux/networking, database internals, observability and cloud, a chaos lab, a payments capstone, a URL shortener build, concurrency/distributed-systems depth and career material. Even with them, the plan builds a strong junior-to-mid base, not senior experience. The supplement track is a compressed 84 hours against about 185 hours of material (see 6.3), so it selects and defers; it does not claim to finish those parts.

### 2.4 How to study 2 hours/day

Default daily structure (study days Day 1-6 of Weeks 1-7): **Read + Code = 80 min, Revise 15-20 min, Wrap-up 15-20 min = 120 min**. The split between Read and Code is no longer a flat 40/40: it is computed per day from the real note files (section 3.1 shows the math). Across the 42 study days the read slot ranges from 20 to 50 minutes and the coding slot from 30 to 65 minutes. Each day's block in section 3 shows the exact minutes and they always sum to 120.

1. **Read (computed per day)**: Read ONLY the `[ESSENTIAL]` sections listed in the day's 'Reading plan' table (heading, line range, line count, minutes). Do not read the `[ADVANCED]` items or the practice sections in this slot. After each section, close the note and say its Interview answer aloud (2 minutes per section is included in the estimate).
2. **Code (computed per day)**: Type the examples of the sections you just read, predict output before running, then do the assigned exercise group or project stage. The 'Practice sections inside the notes' line of each day names the Output-prediction and Coding-exercise sections of the notes to pick from.
3. **Revise (15-20 min)**: First about 10 minutes: spaced revisit of earlier days (1, 3 and 7 days back; section 4). Remaining minutes: the day's question IDs: read the question, answer aloud, then compare with the model answer.
4. **Wrap-up (15-20 min)**: Write the Key concepts from memory, answer the 5 revision questions, finish the practical coding task in the Day block, tick the checklist, and log hours plus one 'confusing thing'. The Day's own wrap-up section is named in the reading plan.

Four rules that make the 2 hours count:

- **Retrieval beats re-reading.** Hide the answer, try to produce it, then check. Struggling is the learning.
- **Speak the answers.** Interviews are spoken. Practise the Interview answer aloud at least once per topic.
- **Code from a blank file** at least once per week for the key snippets (promisify, middleware, withTransaction, JWT verify, token bucket).
- **Protect the time.** Two focused hours beat four distracted ones. Same time slot daily. Phone away.

**Reading-speed assumptions (used everywhere in section 3 and 6):**

| Item | Assumption | Why |
|------|------------|-----|
| Prose | 150 words per minute | Careful reading of technical text with Hinglish and English mixed, pausing to think. Measured note density is 11-20 words per line (Week 1 about 11, Week 5 about 20), so this is roughly 8-14 lines per minute depending on the week. Skimming speed (for example 60 lines per minute, about 700-1,200 words per minute) would say a 900-line Day can be read in 20 minutes, which is not credible for learning. |
| Code | 10 lines per minute | Reading a code example well enough to explain it. Typing and running it is the coding slot, not the read slot. |
| Aloud recall | 2 minutes per ESSENTIAL section | Say the Interview answer without looking. |
| Blank lines | not counted | Only non-blank lines count; fenced code lines are 'code', everything else is 'prose'. |
| Second pass | about 2x faster (prose 300 wpm, code 20 lines per minute) | Used on Day 7 revision sections and in Week 8, where you re-read material you have already studied. |
| Read slot cap | 50 min | If the estimate exceeds 50 min, up to 20 min of overflow is moved into the coding slot (you re-type those examples anyway) and anything beyond that is carried to the Day 7 catch-up reading. |

**Calibrate on Day 1.** Time yourself on Week 1 / Day 1 Topic 1.1 (estimate 9.9 min for 804 words and 45 code lines). If you are more than 30 percent slower, treat the LAST ESSENTIAL section of every day as overflow (move it to the coding slot or Day 7). If you are faster, spend the saved minutes on the Practice sections of the notes.

### 2.5 How to use Day 7 (every week)

Day 7 is not a rest day and not a new-topic day. It has a fixed 120-minute shape:

| Minutes | Activity |
|---------|----------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus the week's revision summary |
| 40 | Weekly assessment from the week file, closed book, timed |
| 15 | Mark with the answer key; identify weak areas with the week's weak-area guidance |
| 20 (25 in Week 3) | Catch-up reading: FIRST any overflow carried from Days 1-6 (named in that week's Day 7 block), then unfinished days, then weak areas |
| 15 (10 in Week 3) | Catch-up coding or project work (redo the failed exercise first) |
| 5 | Log hours, plan next week |

Overflow is carried to Day 7 only in these weeks: Week 2 (Day 10, about 1 min); Week 3 (Day 20, about 23 min); Week 6 (Day 36, about 8 min, Day 41, about 6 min); Week 7 (Day 46, about 10 min). Week 3 is the only week where the carry (23 min) exceeds the 20-minute catch-up reading slot, so its catch-up coding slot shrinks by 5 minutes.

If you finished everything early, use the catch-up blocks for ADVANCED topics tagged on the week's days. If you are behind, Day 7 absorbs one missed day (see section 5).

### 2.6 Week-by-week arc

| Week | Theme | Why this order |
|------|-------|----------------|
| 1 | JavaScript for Backend | Everything in Node is async JS. Weak JS makes every later week harder. |
| 2 | Node.js Internals | Understanding the runtime lets you explain performance and scaling answers later. |
| 3 | Express.js and REST APIs | First practical output: a layered REST API. Gives you a project to hang later concepts on. |
| 4 | MySQL and Database Fundamentals | Most backend interviews test SQL and transactions heavily. MySQL is the primary database. |
| 5 | Data Access, MongoDB, Authentication and Security | Connects Node to the database and covers the security topics every backend interview includes. |
| 6 | Testing and Production Engineering | What separates a tutorial project from production code: tests, logs, retries, caching, queues. |
| 7 | Backend System Design and Production Scenarios | System design questions combine everything above into spoken architecture answers. |
| 8 | Interview Revision and Mock Preparation | No new topics. Spoken practice, mock interviews, honest readiness check. |
| 9-14 | OPTIONAL supplement: Linux/networking, DB internals, observability/cloud, chaos lab, payments capstone, URL shortener, concurrency/distributed systems, career material | Closes gaps against the 90-day roadmap after the core 56 days (section 6) |

---

## 3. The Complete 56-Day Plan

### 3.1 Per-week hours table, reading-time math and per-day minutes

**Per-week hours (recomputed from the per-day tables in 3.2 to 3.9; every day is 120 minutes = 2.0 hours).**

| Week | Theme | Days | Reading (h) | Coding (h) | Revision and questions (h) | Wrap-up and tests (h) | Week total (h) | Cumulative (h) |
|------|-------|------|-------------|------------|-----------------------------|-----------------------|----------------|----------------|
| 1 | JavaScript for Backend | 1-7 | 4.17 | 4.58 | 3 | 2.25 | 14 | 14 |
| 2 | Node.js Internals | 8-14 | 5.33 | 3.5 | 2.83 | 2.33 | 14 | 28 |
| 3 | Express.js and REST APIs | 15-21 | 4.5 | 4.33 | 2.83 | 2.33 | 14 | 42 |
| 4 | MySQL and Database Fundamentals | 22-28 | 4.83 | 4.08 | 2.75 | 2.33 | 14 | 56 |
| 5 | Data Access, MongoDB, Authentication and Security | 29-35 | 5.08 | 3.92 | 2.67 | 2.33 | 14 | 70 |
| 6 | Testing and Production Engineering | 36-42 | 5.17 | 3.75 | 2.75 | 2.33 | 14 | 84 |
| 7 | Backend System Design and Production Scenarios | 43-49 | 5.25 | 3.67 | 2.75 | 2.33 | 14 | 98 |
| 8 | Interview Revision and Mock Preparation | 50-56 | 2.08 | 5.17 | 4.75 | 2 | 14 | 112 |
| **Total** | | 1-56 | **36.42** | **33** | **24.33** | **18.25** | **112** | **112** |

For comparison, the previous (flat 40/40/20/20) plan said: Reading 32.67 h, Coding 36.75 h, Revision 24.33 h, Wrap-up 18.25 h, total 112 h.

**Is 112 hours still right?** Yes: 56 days x 120 minutes = 6,720 minutes = 112 hours, and every day block still sums to 120. What changed is the mix: reading is 36.42 h instead of 32.67 h because the read slot is now sized from the real ESSENTIAL sections instead of a flat 40 minutes (some days need only 20 minutes, a few need the 50-minute cap), and coding is 33 h. The plan is honest about the limits: the 112 hours are enough to read the ESSENTIAL sections, but NOT enough to read every line of Parts 01-08 (see the 'if everything were read' lines in each day).

**How the reading minutes were computed (per Day 1-6 of Weeks 1-7):** (1) parse the Day block in the week file; (2) take the `###` topic sections tagged `[ESSENTIAL]`; (3) subtract bold `[ADVANCED]` sub-blocks inside them; (4) count non-blank prose words and non-blank code lines in each section (code = lines inside code fences); (5) minutes = words / 150 + code lines / 10; (6) add 2 minutes per section for saying the Interview answer aloud; (7) read slot = that total rounded up to a multiple of 5, never below 20 and never above 50; (8) coding slot = 120 - read - revise - wrap-up. If the total exceeds the 50-minute cap, the overflow is shown in the day block: up to 20 minutes are absorbed into the coding slot and the rest is carried to the Day 7 catch-up reading.

**Reading math per week (Days 1-6 only; Day 7 and Week 8 use second-pass revision reading):**

| Week | ESSENTIAL lines to read | Lines in the Day blocks | Estimated reading incl. recall (min) | Read slots given (min) | Overflow absorbed in coding (min) | Carried to Day 7 (min) |
|------|--------------------------|-------------------------|--------------------------------------|------------------------|-----------------------------------|------------------------|
| 1 | 2730 | 4949 | 216 | 230 | 0 | 0 |
| 2 | 4114 | 4619 | 340 | 300 | 42 | 1 |
| 3 | 3068 | 4007 | 284 | 245 | 26 | 23 |
| 4 | 2977 | 3302 | 266 | 270 | 5 | 0 |
| 5 | 3073 | 3425 | 302 | 285 | 22 | 0 |
| 6 | 3990 | 4314 | 350 | 290 | 46 | 14 |
| 7 | 4012 | 4287 | 357 | 295 | 52 | 10 |
| **Total** | **23964** | **28903** | **2115** | **1915** | **194** | **48** |

**Reading verdict.** The ESSENTIAL sections are 23964 of the 28903 lines in the Day 1-6 blocks (83 percent); the rest is Output-prediction and Coding-exercise practice, wrap-up and `[ADVANCED]` material. Estimated reading is 2115 minutes (35.2 h) against 1915 minutes of read slots, so the shortfall is 200 minutes in total. 19 of the 42 study days exceed the 50-minute read slot (see the table below, 'Over cap' column); of those, 5 days have overflow that does not fit even after absorbing 20 minutes into the coding slot, and it is carried to Day 7: Day 10 (1 min); Day 20 (23 min); Day 36 (8 min); Day 41 (6 min); Day 46 (10 min).

**Per-day minutes (Days 1-56).** 'E' = estimated reading minutes including aloud recall; 'Over cap' = minutes above the 50-minute read cap. Day 7 and Week 8 rows show their slots as written in the day blocks.

| Day | Week / Day | ESSENTIAL lines / Day lines | E (min) | Read | Code | Revise | Wrap-up | Over cap | Note |
|-----|------------|-----------------------------|---------|------|------|--------|---------|----------|------|
| 1 | W1 D1 | 594 / 926 | 46 | 50 | 30 | 20 | 20 | 0 |  |
| 2 | W1 D2 | 406 / 783 | 32 | 35 | 45 | 20 | 20 | 0 |  |
| 3 | W1 D3 | 413 / 736 | 33 | 35 | 45 | 20 | 20 | 0 |  |
| 4 | W1 D4 | 520 / 891 | 41 | 45 | 40 | 15 | 20 | 0 |  |
| 5 | W1 D5 | 372 / 784 | 29 | 30 | 55 | 20 | 15 | 0 |  |
| 6 | W1 D6 | 425 / 829 | 35 | 35 | 45 | 20 | 20 | 0 |  |
| 7 | W1 D7 | -- | -- | 20 | 15 | 65 | 20 | -- | Day 7 revision |
| 8 | W2 D1 | 615 / 680 | 53 | 50 | 30 | 20 | 20 | 3 | 3 min read-along in coding slot |
| 9 | W2 D2 | 715 / 864 | 66 | 50 | 35 | 15 | 20 | 16 | 16 min read-along in coding slot |
| 10 | W2 D3 | 902 / 975 | 71 | 50 | 35 | 15 | 20 | 21 | 1 min to Day 7 |
| 11 | W2 D4 | 621 / 706 | 49 | 50 | 35 | 15 | 20 | 0 |  |
| 12 | W2 D5 | 672 / 736 | 53 | 50 | 30 | 20 | 20 | 3 | 3 min read-along in coding slot |
| 13 | W2 D6 | 589 / 658 | 48 | 50 | 30 | 20 | 20 | 0 |  |
| 14 | W2 D7 | -- | -- | 20 | 15 | 65 | 20 | -- | Day 7 revision |
| 15 | W3 D1 | 594 / 659 | 55 | 50 | 30 | 20 | 20 | 5 | 5 min read-along in coding slot |
| 16 | W3 D2 | 166 / 482 | 18 | 20 | 65 | 15 | 20 | 0 |  |
| 17 | W3 D3 | 513 / 569 | 46 | 50 | 30 | 20 | 20 | 0 |  |
| 18 | W3 D4 | 612 / 668 | 51 | 50 | 35 | 15 | 20 | 1 | 1 min read-along in coding slot |
| 19 | W3 D5 | 205 / 593 | 20 | 25 | 55 | 20 | 20 | 0 |  |
| 20 | W3 D6 | 978 / 1036 | 93 | 50 | 35 | 15 | 20 | 43 | 23 min to Day 7 |
| 21 | W3 D7 | -- | -- | 25 | 10 | 65 | 20 | -- | Day 7 revision |
| 22 | W4 D1 | 431 / 484 | 38 | 40 | 45 | 15 | 20 | 0 |  |
| 23 | W4 D2 | 474 / 522 | 42 | 45 | 40 | 15 | 20 | 0 |  |
| 24 | W4 D3 | 489 / 539 | 45 | 45 | 35 | 20 | 20 | 0 |  |
| 25 | W4 D4 | 464 / 526 | 42 | 45 | 40 | 15 | 20 | 0 |  |
| 26 | W4 D5 | 489 / 541 | 44 | 45 | 35 | 20 | 20 | 0 |  |
| 27 | W4 D6 | 630 / 690 | 55 | 50 | 35 | 15 | 20 | 5 | 5 min read-along in coding slot |
| 28 | W4 D7 | -- | -- | 20 | 15 | 65 | 20 | -- | Day 7 revision |
| 29 | W5 D1 | 422 / 494 | 44 | 45 | 40 | 15 | 20 | 0 |  |
| 30 | W5 D2 | 602 / 678 | 59 | 50 | 35 | 15 | 20 | 9 | 9 min read-along in coding slot |
| 31 | W5 D3 | 432 / 477 | 43 | 45 | 40 | 15 | 20 | 0 |  |
| 32 | W5 D4 | 508 / 554 | 49 | 50 | 35 | 15 | 20 | 0 |  |
| 33 | W5 D5 | 646 / 712 | 63 | 50 | 30 | 20 | 20 | 13 | 13 min read-along in coding slot |
| 34 | W5 D6 | 463 / 510 | 43 | 45 | 40 | 15 | 20 | 0 |  |
| 35 | W5 D7 | -- | -- | 20 | 15 | 65 | 20 | -- | Day 7 revision |
| 36 | W6 D1 | 929 / 989 | 78 | 50 | 35 | 15 | 20 | 28 | 8 min to Day 7 |
| 37 | W6 D2 | 609 / 662 | 50 | 50 | 30 | 20 | 20 | 0 |  |
| 38 | W6 D3 | 628 / 680 | 52 | 50 | 35 | 15 | 20 | 2 | 2 min read-along in coding slot |
| 39 | W6 D4 | 598 / 654 | 54 | 50 | 35 | 15 | 20 | 4 | 4 min read-along in coding slot |
| 40 | W6 D5 | 466 / 516 | 40 | 40 | 45 | 15 | 20 | 0 |  |
| 41 | W6 D6 | 760 / 813 | 76 | 50 | 30 | 20 | 20 | 26 | 6 min to Day 7 |
| 42 | W6 D7 | -- | -- | 20 | 15 | 65 | 20 | -- | Day 7 revision |
| 43 | W7 D1 | 494 / 542 | 45 | 45 | 35 | 20 | 20 | 0 |  |
| 44 | W7 D2 | 710 / 754 | 62 | 50 | 35 | 15 | 20 | 12 | 12 min read-along in coding slot |
| 45 | W7 D3 | 719 / 762 | 62 | 50 | 35 | 15 | 20 | 12 | 12 min read-along in coding slot |
| 46 | W7 D4 | 893 / 941 | 80 | 50 | 35 | 15 | 20 | 30 | 10 min to Day 7 |
| 47 | W7 D5 | 595 / 641 | 52 | 50 | 30 | 20 | 20 | 2 | 2 min read-along in coding slot |
| 48 | W7 D6 | 601 / 647 | 56 | 50 | 35 | 15 | 20 | 6 | 6 min read-along in coding slot |
| 49 | W7 D7 | -- | -- | 20 | 15 | 65 | 20 | -- | Day 7 revision |
| 50 | W8 D1 | -- | -- | 25 | 30 | 45 | 20 | -- | Week 8 revision |
| 51 | W8 D2 | -- | -- | 20 | 35 | 45 | 20 | -- | Week 8 revision |
| 52 | W8 D3 | -- | -- | 20 | 60 | 25 | 15 | -- | Week 8 revision |
| 53 | W8 D4 | -- | -- | 15 | 60 | 30 | 15 | -- | Week 8 revision |
| 54 | W8 D5 | -- | -- | 15 | 60 | 30 | 15 | -- | Week 8 revision |
| 55 | W8 D6 | -- | -- | 5 | 50 | 50 | 15 | -- | Week 8 revision |
| 56 | W8 D7 | -- | -- | 25 | 15 | 60 | 20 | -- | Week 8 revision |

**Where the plan cannot fit (honest list).** Every ESSENTIAL section has a home (read slot, coding slot or the Day 7 catch-up), but these days exceed the 50-minute read slot and use the overflow rules:

- **Day 8 (Week 2 / Day 1):** ESSENTIAL reading is about 53 min against the 50-minute cap, so about 3 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 9 (Week 2 / Day 2):** ESSENTIAL reading is about 66 min against the 50-minute cap, so about 16 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 10 (Week 2 / Day 3):** ESSENTIAL reading is about 71 min against the 50-minute cap, so about 21 min overflows; 1 min is carried to the Week 2 Day 7 catch-up.
- **Day 12 (Week 2 / Day 5):** ESSENTIAL reading is about 53 min against the 50-minute cap, so about 3 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 15 (Week 3 / Day 1):** ESSENTIAL reading is about 55 min against the 50-minute cap, so about 5 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 18 (Week 3 / Day 4):** ESSENTIAL reading is about 51 min against the 50-minute cap, so about 1 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 20 (Week 3 / Day 6):** ESSENTIAL reading is about 93 min against the 50-minute cap, so about 43 min overflows; 23 min is carried to the Week 3 Day 7 catch-up.
- **Day 27 (Week 4 / Day 6):** ESSENTIAL reading is about 55 min against the 50-minute cap, so about 5 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 30 (Week 5 / Day 2):** ESSENTIAL reading is about 59 min against the 50-minute cap, so about 9 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 33 (Week 5 / Day 5):** ESSENTIAL reading is about 63 min against the 50-minute cap, so about 13 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 36 (Week 6 / Day 1):** ESSENTIAL reading is about 78 min against the 50-minute cap, so about 28 min overflows; 8 min is carried to the Week 6 Day 7 catch-up.
- **Day 38 (Week 6 / Day 3):** ESSENTIAL reading is about 52 min against the 50-minute cap, so about 2 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 39 (Week 6 / Day 4):** ESSENTIAL reading is about 54 min against the 50-minute cap, so about 4 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 41 (Week 6 / Day 6):** ESSENTIAL reading is about 76 min against the 50-minute cap, so about 26 min overflows; 6 min is carried to the Week 6 Day 7 catch-up.
- **Day 44 (Week 7 / Day 2):** ESSENTIAL reading is about 62 min against the 50-minute cap, so about 12 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 45 (Week 7 / Day 3):** ESSENTIAL reading is about 62 min against the 50-minute cap, so about 12 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 46 (Week 7 / Day 4):** ESSENTIAL reading is about 80 min against the 50-minute cap, so about 30 min overflows; 10 min is carried to the Week 7 Day 7 catch-up.
- **Day 47 (Week 7 / Day 5):** ESSENTIAL reading is about 52 min against the 50-minute cap, so about 2 min overflows, absorbed into the coding slot as read-along while you type the examples.
- **Day 48 (Week 7 / Day 6):** ESSENTIAL reading is about 56 min against the 50-minute cap, so about 6 min overflows, absorbed into the coding slot as read-along while you type the examples.

**Sensitivity.** The reading estimate scales linearly with reading speed: at 120 words per minute (a 25 percent slower reader) the read slots would be about 25 percent longer, and every day with an estimate above 40 minutes would overflow. If that is you, apply the 'last section is overflow' rule from section 2.4 and do not skip Day 7.

There is no slack in the calendar except the Day 7 catch-up blocks and the Week 8 consolidation days. If you can add a weekend hour, use it on the project or on weak areas.

**Project milestones by week:**

| Week | Project milestone |
|------|-------------------|
| 3 | Stage 1 and Stage 2: Express skeleton, CRUD, validation, centralized errors, pagination shape |
| 4 | Stage 3: MySQL schema, indexes, key queries, pool settings, EXPLAIN on list query |
| 5 | Stage 3 data layer finished, Stage 4 auth + RBAC, security middleware, Stage 5 started |
| 6 | Stage 5 finished (transactions, idempotency), Stage 6 tests + logging, Extension A and B |
| 7 | Stage 7 README + API docs, Extension C Docker and D deployment notes |
| 8 | Project explanation practice (no new features) |

### 3.2 Week 1 -- JavaScript for Backend (Days 1-7)

- **Notes file:** `01_Week1_JavaScript.md`
- **Week goal:** Be able to predict async JS output and explain closures, this, prototypes, promises and the event loop without hesitation. Every later week assumes this.
- **Never skip this week:** Closures, this binding rules, promise chaining + error propagation, event loop order (sync -> nextTick/microtask -> macrotask), Promise.all vs allSettled.
- **ADVANCED (skip first if behind):** Prototype-chain edge cases (Object.create(null), mixins), Promise.any AggregateError details, structuredClone edge cases.


#### Week 1 / Day 1 (overall Day 1) -- Execution context, call stack, scope, closures, hoisting

**Tier:** ESSENTIAL

**Learning objectives**

- Explain creation vs execution phase of an execution context and how the call stack grows and unwinds.
- Trace scope chain lookups, var/let/const hoisting and the temporal dead zone (TDZ).
- Write and explain closures (counter, once, memoize) and the classic var-in-loop bug.

**Topics:** Execution context and call stack; Lexical environment and scope chain; var vs let vs const, hoisting, TDZ; Closures and their real backend uses (config factories, memoize, private state).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Execution context and call stack; Scope and lexical environment; Hoisting; Closures | Reading |
| 30 | Coding practice: Predict output of 10 hoisting/closure snippets BEFORE running them; write counter factory, once(fn) and memoize(fn); EX-LOOP-01..02 (closure-in-loop output prediction) | Coding |
| 20 | Revise questions Q-JS-01..06 (read model answer, hide it, answer aloud) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 594 of the 926 lines in the Day 1 block of `01_Week1_JavaScript.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 1.1 - Execution context and call stack | 86-231 | 145 | 804 | 45 | 9.9 |
| Topic 1.2 - Scope and lexical environment | 232-375 | 143 | 799 | 35 | 8.8 |
| Topic 1.3 - Hoisting | 376-482 | 106 | 636 | 23 | 6.5 |
| Topic 1.4 - Closures (mixed tag: concept only) | 483-683 | 200 | 733 | 82 | 13.1 |
| **Total** | | **594** | **2972** | **185** | **38.3** |

- **Estimate:** 2972 prose words / 150 wpm + 185 code lines / 10 lines-per-min = 38 min, plus 4 x 2 min to say each Interview answer aloud = **46 min**. Read slot = 50 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "Topic 1.4 - Closures" (lines 613-629).
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Day 1 - Output-prediction questions (684-877, 193 lines); Day 1 - Coding exercises (878-960, 82 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 1 - Wrap-up (lines 961-994, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 926 lines of this Day block would take about 60 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Predict output of 10 hoisting/closure snippets BEFORE running them; write counter factory, once(fn) and memoize(fn); EX-LOOP-01..02 (closure-in-loop output prediction).

**Interview questions to revise:** Q-JS-01..06; plus the day's five revision questions at the end of the Day block.

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "Topic 1.4 - Closures" (lines 613-629).

**Daily learning outcomes**

- I can draw the call stack for nested calls and explain stack overflow.
- I can explain a closure in two sentences plus one backend example.
- I can predict var vs let loop output with setTimeout.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 1 / Day 1 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Predict output of 10 hoisting/closure snippets BEFORE running them
- [ ] Questions Q-JS-01..06 answered aloud
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 1 / Day 2 (overall Day 2) -- this, prototypes, prototypal inheritance

**Tier:** ESSENTIAL

**Learning objectives**

- Apply the four binding rules for this (default, implicit, explicit, new) plus arrow functions.
- Explain the prototype chain, __proto__ vs prototype, and how class syntax maps onto it.
- Fix a lost-this bug in a callback.

**Topics:** this binding rules and arrow functions; call/apply/bind; Prototype chain and property lookup; Constructor functions, class syntax, extends, super.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read the ESSENTIAL sections only (reading plan below): this; Prototypes and prototypal inheritance | Reading |
| 45 | Coding practice: Re-implement bind() and a tiny class hierarchy with prototypes only; fix 5 lost-this snippets; Object.create inheritance demo | Coding |
| 20 | Spaced revisit (Day 1 key concepts, cover and recall, 10 min) plus questions Q-JS-07..12 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 406 of the 783 lines in the Day 2 block of `01_Week1_JavaScript.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 2.1 - this | 1013-1170 | 157 | 777 | 57 | 10.9 |
| Topic 2.2 - Prototypes and prototypal inheritance | 1171-1420 | 249 | 968 | 110 | 17.5 |
| **Total** | | **406** | **1745** | **167** | **28.3** |

- **Estimate:** 1745 prose words / 150 wpm + 167 code lines / 10 lines-per-min = 28 min, plus 2 x 2 min to say each Interview answer aloud = **32 min**. Read slot = 35 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** Topic 2.3 - Property descriptors, getters/setters, free (lines 1421-1466, 45 lines).
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Day 2 - Output-prediction questions (1467-1648, 181 lines); Day 2 - Coding exercises (1649-1744, 95 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 2 - Wrap-up (lines 1745-1778, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 783 lines of this Day block would take about 52 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Re-implement bind() and a tiny class hierarchy with prototypes only; fix 5 lost-this snippets; Object.create inheritance demo.

**Interview questions to revise:** Q-JS-07..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 1 (Closures, scope, hoisting).

**ADVANCED (skip first if behind):** Topic 2.3 - Property descriptors, getters/setters, free (lines 1421-1466, 45 lines).

**Daily learning outcomes**

- I can name the binding rule used by any call site.
- I can explain why a class method passed as callback loses this.
- I can explain prototype lookup in 30 seconds.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~35 min) and said each Interview answer aloud (Week 1 / Day 2 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Re-implement bind() and a tiny class hierarchy with prototypes only
- [ ] Questions Q-JS-07..12 answered aloud
- [ ] Spaced revisit done (Day 1)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 1 / Day 3 (overall Day 3) -- Objects, arrays, references, manipulation patterns

**Tier:** ESSENTIAL

**Learning objectives**

- Distinguish value vs reference semantics, shallow vs deep copy and mutation bugs.
- Use map/filter/reduce/flatMap, destructuring, spread and Object.entries fluently for data shaping.
- Solve grouping / dedupe / indexing problems the way backend code needs them.

**Topics:** Primitives vs references, equality; Shallow vs deep copy, structuredClone; Array methods: map/filter/reduce/find/some/every/sort stability; Object manipulation: destructuring, spread, Object.groupBy, Map/Set.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read the ESSENTIAL sections only (reading plan below): Values, references, copying, equality; Destructuring, spread/rest, optional chaining, M; Array methods and manipulation patterns | Reading |
| 45 | Coding practice: EX-ARR-01..05 (groupBy, dedupe, index by id, flatten, top-N); write a deepClone with structuredClone fallback discussion | Coding |
| 20 | Spaced revisit (Day 2 key concepts, cover and recall, 10 min) plus questions Q-JS-13..18 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 413 of the 736 lines in the Day 3 block of `01_Week1_JavaScript.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 3.1 - Values, references, copying, equality | 1797-1953 | 156 | 780 | 48 | 10.0 |
| Topic 3.2 - Destructuring, spread/rest, optional chaining, Map/Set | 1954-2054 | 100 | 538 | 23 | 5.9 |
| Topic 3.3 - Array methods and manipulation patterns (mixed tag: concept only) | 2055-2212 | 157 | 684 | 62 | 10.8 |
| **Total** | | **413** | **2002** | **133** | **26.6** |

- **Estimate:** 2002 prose words / 150 wpm + 133 code lines / 10 lines-per-min = 27 min, plus 3 x 2 min to say each Interview answer aloud = **33 min**. Read slot = 35 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "Topic 3.3 - Array methods and manipulati" (lines 2162-2164).
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Day 3 - Output-prediction questions (2213-2382, 169 lines); Day 3 - Coding exercises (2383-2481, 98 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 3 - Wrap-up (lines 2482-2515, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 736 lines of this Day block would take about 46 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-ARR-01..05 (groupBy, dedupe, index by id, flatten, top-N); write a deepClone with structuredClone fallback discussion.

**Interview questions to revise:** Q-JS-13..18; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 2 (this and prototypes).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "Topic 3.3 - Array methods and manipulati" (lines 2162-2164).

**Daily learning outcomes**

- I can explain why mutating a function argument object leaks to the caller.
- I can group an array of orders by customer using reduce and Map.
- I can choose Map vs plain object.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~35 min) and said each Interview answer aloud (Week 1 / Day 3 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-ARR-01..05 (groupBy, dedupe, index by id, flatten, top-N)
- [ ] Questions Q-JS-13..18 answered aloud
- [ ] Spaced revisit done (Day 2)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 1 / Day 4 (overall Day 4) -- Promises, chaining, async/await, error propagation

**Tier:** ESSENTIAL

**Learning objectives**

- Explain the three promise states and how then/catch/finally chain and propagate errors.
- Convert callback and then-chain code to async/await with correct try/catch.
- Avoid unhandled rejections and swallowed errors.

**Topics:** Callbacks to promises, promisify; Promise states, chaining, return values in then; async/await semantics and error propagation; Unhandled rejection behaviour (Node 15+ crashes by default).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Promises and chaining; async/await; Error propagation and unhandled rejections | Reading |
| 40 | Coding practice: EX-ASYNC-01..04 (promisify, sequential vs parallel awaits, retry wrapper) and EX-ERR-01..02 (error propagation) | Coding |
| 15 | Spaced revisit (Day 3, Day 1 key concepts, cover and recall, 8 min) plus questions Q-JS-19..26 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 520 of the 891 lines in the Day 4 block of `01_Week1_JavaScript.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 4.1 - Promises and chaining | 2535-2709 | 174 | 834 | 60 | 11.6 |
| Topic 4.2 - async/await | 2710-2902 | 192 | 831 | 75 | 13.0 |
| Topic 4.3 - Error propagation and unhandled rejections | 2903-3057 | 154 | 809 | 53 | 10.7 |
| **Total** | | **520** | **2474** | **188** | **35.3** |

- **Estimate:** 2474 prose words / 150 wpm + 188 code lines / 10 lines-per-min = 35 min, plus 3 x 2 min to say each Interview answer aloud = **41 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Day 4 - Output-prediction questions (3058-3249, 191 lines); Day 4 - Coding exercises (3250-3372, 122 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 4 - Wrap-up (lines 3373-3407, 34 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 891 lines of this Day block would take about 60 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-ASYNC-01..04 (promisify, sequential vs parallel awaits, retry wrapper) and EX-ERR-01..02 (error propagation).

**Interview questions to revise:** Q-JS-19..26; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 3 (Objects, arrays, references); Day 1 (Closures, scope, hoisting).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can say what a then callback's return value does to the next link.
- I can rewrite a nested-callback fs example with async/await.
- I can explain why a missing await inside try/catch loses the error.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 1 / Day 4 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-ASYNC-01..04 (promisify, sequential vs parallel awaits, retry wrapper) and EX-ERR-01..02 (er
- [ ] Questions Q-JS-19..26 answered aloud
- [ ] Spaced revisit done (Day 3, Day 1)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 1 / Day 5 (overall Day 5) -- Event loop, call stack, microtasks vs macrotasks, output prediction

**Tier:** ESSENTIAL

**Learning objectives**

- State the order: synchronous code, process.nextTick, promise microtasks, then timers/I-O/check macrotasks.
- Predict mixed setTimeout / setImmediate / promise / nextTick output.
- Explain why a long synchronous loop blocks everything.

**Topics:** Call stack, task queues, microtask queue; process.nextTick vs promise microtasks vs queueMicrotask; setTimeout vs setImmediate (preview only; full phases in Week 2); Starving the loop and why it matters on a server.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read the ESSENTIAL sections only (reading plan below): The event loop model; Blocking the event loop and how to avoid it; Timers and ordering details worth knowing | Reading |
| 55 | Coding practice: EX-LOOP-03..06 (output prediction: nextTick/promise/queueMicrotask inside a timer, setTimeout vs setImmediate in an I/O callback, microtasks between timers, await ordering); write each prediction on paper first, then run and diff. Redo EX-LOOP-01..02 if you got them wrong. (Only EX-LOOP-01..06 exist in `11_Coding_Exercises.md`.) | Coding |
| 20 | Spaced revisit (Day 4, Day 2 key concepts, cover and recall, 10 min) plus questions Q-JS-24..30 (10 min) | Revision and questions |
| 15 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 372 of the 784 lines in the Day 5 block of `01_Week1_JavaScript.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 5.1 - The event loop model (mixed tag: concept only) | 3426-3633 | 207 | 1027 | 73 | 14.1 |
| Topic 5.2 - Blocking the event loop and how to avoid it (mixed tag: concept only) | 3634-3770 | 136 | 577 | 27 | 6.5 |
| Topic 5.3 - Timers and ordering details worth knowing | 3771-3800 | 29 | 192 | 7 | 2.0 |
| **Total** | | **372** | **1796** | **107** | **22.7** |

- **Estimate:** 1796 prose words / 150 wpm + 107 code lines / 10 lines-per-min = 23 min, plus 3 x 2 min to say each Interview answer aloud = **29 min**. Read slot = 30 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "Topic 5.1 - The event loop model" (lines 3559-3574); the [ADVANCED] sub-block inside "Topic 5.2 - Blocking the event loop and " (lines 3695-3713); the [ADVANCED] sub-block inside "Topic 5.2 - Blocking the event loop and " (lines 3714-3724).
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Day 5 - Output-prediction questions (3801-4027, 226 lines); Day 5 - Coding exercises (4028-4159, 131 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 5 - Wrap-up (lines 4160-4192, 32 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 784 lines of this Day block would take about 55 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-LOOP-03..06 (output prediction: nextTick/promise/queueMicrotask inside a timer, setTimeout vs setImmediate in an I/O callback, microtasks between timers, await ordering); write each prediction on paper first, then run and diff. Redo EX-LOOP-01..02 if you got them wrong. (Only EX-LOOP-01..06 exist in `11_Coding_Exercises.md`.).

**Interview questions to revise:** Q-JS-24..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 4 (Promises and async/await); Day 2 (this and prototypes).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "Topic 5.1 - The event loop model" (lines 3559-3574); the [ADVANCED] sub-block inside "Topic 5.2 - Blocking the event loop and " (lines 3695-3713); the [ADVANCED] sub-block inside "Topic 5.2 - Blocking the event loop and " (lines 3714-3724).

**Daily learning outcomes**

- I can predict a 10-line mixed-async output correctly.
- I can explain microtask starvation.
- I can explain why Node is single threaded but handles many requests.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~30 min) and said each Interview answer aloud (Week 1 / Day 5 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-LOOP-03..06 (output prediction: nextTick/promise/queueMicrotask inside a timer, setTimeout v
- [ ] Questions Q-JS-24..30 answered aloud
- [ ] Spaced revisit done (Day 4, Day 2)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 1 / Day 6 (overall Day 6) -- Promise.all / allSettled / race / any, common async mistakes

**Tier:** ESSENTIAL

**Learning objectives**

- Choose the correct combinator for a given requirement and state each one's failure behaviour.
- Spot the five most common async bugs (await in loop, forEach+async, floating promise, missing return, unbounded parallelism).
- Implement a concurrency-limited map.

**Topics:** Promise.all / allSettled / race / any semantics; Sequential vs parallel vs limited concurrency; forEach with async, floating promises, missing return/await; Timeouts with Promise.race and AbortController.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read the ESSENTIAL sections only (reading plan below): Promise.all, allSettled, race, any; Common asynchronous mistakes (and fixes) | Reading |
| 45 | Coding practice: EX-ASYNC-05..06 (mapLimit, Promise.all from scratch), EX-ASYNC-07 (ADVANCED single-flight memoization, optional) and EX-ERR-03..04 (batch processor that never throws, EventEmitter to Promise). (Only EX-ASYNC-01..07 exist.) | Coding |
| 20 | Spaced revisit (Day 5, Day 3 key concepts, cover and recall, 10 min) plus questions Q-JS-26..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 425 of the 829 lines in the Day 6 block of `01_Week1_JavaScript.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 6.1 - Promise.all, allSettled, race, any | 4210-4470 | 260 | 924 | 135 | 19.7 |
| Topic 6.2 - Common asynchronous mistakes (and fixes) (mixed tag: concept only) | 4471-4636 | 165 | 718 | 63 | 11.1 |
| **Total** | | **425** | **1642** | **198** | **30.7** |

- **Estimate:** 1642 prose words / 150 wpm + 198 code lines / 10 lines-per-min = 31 min, plus 2 x 2 min to say each Interview answer aloud = **35 min**. Read slot = 35 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "Topic 6.2 - Common asynchronous mistakes" (lines 4575-4578).
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Day 6 - Output-prediction questions (4637-4834, 197 lines); Day 6 - Coding exercises (4835-4987, 152 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 6 - Wrap-up (lines 4988-5022, 34 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 829 lines of this Day block would take about 58 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-ASYNC-05..06 (mapLimit, Promise.all from scratch), EX-ASYNC-07 (ADVANCED single-flight memoization, optional) and EX-ERR-03..04 (batch processor that never throws, EventEmitter to Promise). (Only EX-ASYNC-01..07 exist.).

**Interview questions to revise:** Q-JS-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 5 (Event loop and microtasks); Day 3 (Objects, arrays, references).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "Topic 6.2 - Common asynchronous mistakes" (lines 4575-4578).

**Daily learning outcomes**

- I can pick a combinator for 'call 3 services, tolerate one failure'.
- I can fix forEach(async) bugs.
- I can implement concurrency limiting without a library.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~35 min) and said each Interview answer aloud (Week 1 / Day 6 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-ASYNC-05..06 (mapLimit, Promise.all from scratch), EX-ASYNC-07 (ADVANCED single-flight memoi
- [ ] Questions Q-JS-26..30 answered aloud
- [ ] Spaced revisit done (Day 5, Day 3)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 1 / Day 7 (overall Day 7) -- Revision, weekly test, catch-up

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Prove (to yourself) what you actually retained from Week 1 by taking the weekly assessment closed-book.
- Identify the 2-3 weakest topics and repair them; absorb any unfinished day.
- Consolidate the week's key concepts into a one-page summary you can re-read in 10 minutes.

**Topics:** All of Week 1 -- Closures, scope, hoisting; this and prototypes; Objects, arrays, references; Promises and async/await; Event loop and microtasks; Promise combinators, async mistakes

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus read the Week 1 revision summary | Revision and questions |
| 40 | Weekly assessment (Week 1 file), closed book, timed, answer in writing or aloud | Revision and questions |
| 15 | Mark using the answer key; list weak areas using the weak-area guidance | Wrap-up and tests |
| 20 | Catch-up reading: re-read Week 1 notes for the weak areas only (unfinished days first) | Reading |
| 15 | Catch-up coding: redo the failed exercise | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |

**Reading plan (Day 7 revision day: second-pass speed = about 2x the first-pass speed, so each section costs about half its first-read estimate)**

| File | Section | Lines | Line count | Est. min (second pass) |
|------|---------|-------|------------|------------------------|
| 01_Week1_JavaScript.md | Week 1 revision summary | 5070-5115 | 46 | 1.6 |
| 01_Week1_JavaScript.md | Weekly assessment | 5247-5452 | 206 | 7.4 |
| 01_Week1_JavaScript.md | Answers with explanations | 5453-5620 | 168 | 6.0 |
| 01_Week1_JavaScript.md | Weak-area identification guidance | 5621-5659 | 39 | 1.4 |
| 01_Week1_JavaScript.md | Catch-up plan (if you fall behind) | 5660-5701 | 42 | 1.3 |

- **Where each slot uses them:** the revision summary belongs to the 25-minute spaced-revisit slot (about 2 min of reading, the rest is cover-and-recall); the assessment is the 40-minute closed-book slot (do not read the answers first); the answers section is used while marking (15 min); weak-area guidance and the catch-up plan feed the catch-up slots.
- **Overflow carried into this Day 7:** none this week; use the catch-up reading slot for weak areas and any unfinished day.
- **Re-read only the Week 1 / Day 1-6 notes for topics you got wrong** (use each Day block reading plan to find the ESSENTIAL section and re-read that section, not the whole Day).

**Coding practice:** Redo (from a blank file) every exercise you got wrong this week, in these groups: EX-ASYNC, EX-LOOP, EX-ARR, EX-ERR. No new project stage.

**Interview questions to revise:** The 10 questions you found hardest from this week's ID ranges (Q-JS-01..30). Answer each aloud in under 90 seconds.

**Weekly test:** Week 1 assessment in `01_Week1_JavaScript.md` (mixed Basic/Intermediate/Advanced). Target: 70 percent or more. Below 70 percent -> follow the week's catch-up plan before starting next week's Day 1.

**Daily learning outcomes**

- I know my Week 1 score and my weakest 2-3 topics.
- I have repaired at least one weak topic by re-reading plus re-doing a task.
- Every unfinished item from Day 1-6 is either done or explicitly moved to section 5 triage.

**Completion checklist**

- [ ] Spaced revisit of Day 1-6 done
- [ ] Weekly assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Weak topics re-read
- [ ] Failed exercise redone from blank file
- [ ] Week 1 hours logged (target 14 h)

### 3.3 Week 2 -- Node.js Internals (Days 8-14)

- **Notes file:** `02_Week2_Node_Internals.md`
- **Week goal:** Explain how Node runs JavaScript (V8 + libuv), which work goes to the OS, the event loop or the thread pool, and how streams, Buffers and memory behave.
- **Never skip this week:** Event loop phases, blocking vs non-blocking, thread pool vs OS polling, CommonJS vs ESM, streams + backpressure, EventEmitter, common memory-leak causes.
- **ADVANCED (skip first if behind):** V8 hidden classes / JIT details, worker_threads message-port internals, heap snapshot reading beyond the basics.


#### Week 2 / Day 1 (overall Day 8) -- Node vs browser JS, V8, libuv, runtime architecture

**Tier:** ESSENTIAL

**Learning objectives**

- Explain what Node.js is (runtime = V8 + libuv + C++ bindings + core modules) and how it differs from browser JS.
- Describe single-threaded JS execution plus background threads for specific work.
- Know which globals exist in Node and which do not (window, DOM).

**Topics:** Node vs browser environment; V8 role: parsing, JIT, heap, GC; libuv role: event loop, thread pool, OS abstractions; Node core modules and bindings layer.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): What Node.js is, and how it differs from browser; V8: what it does for Node; libuv: the part that makes Node asynchronous; Node.js runtime architecture; "Node is single-threaded": what is true and what;... | Reading |
| 30 | Read-along of the overflow section(s) (~3 min, typing their examples) then coding practice: Run small scripts printing process.versions, os.cpus(), globalThis keys; trace a fs.readFile call through the layers on paper | Coding |
| 20 | Spaced revisit (Day 7, Day 5, Day 1 key concepts, cover and recall, 10 min) plus questions Q-NODE-01..05 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 615 of the 680 lines in the Day 1 block of `02_Week2_Node_Internals.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 1.1 What Node.js is, and how it differs from browser JavaScript | 63-171 | 108 | 920 | 13 | 7.4 |
| 1.2 V8: what it does for Node | 172-297 | 125 | 806 | 28 | 8.2 |
| 1.3 libuv: the part that makes Node asynchronous | 298-424 | 126 | 796 | 32 | 8.5 |
| 1.4 Node.js runtime architecture | 425-561 | 136 | 611 | 57 | 9.8 |
| 1.5 "Node is single-threaded": what is true and what is not | 562-661 | 99 | 730 | 13 | 6.2 |
| 1.6 Release lines, LTS and runtime flags you should know | 662-683 | 21 | 209 | 0 | 1.4 |
| **Total** | | **615** | **4072** | **143** | **41.4** |

- **Estimate:** 4072 prose words / 150 wpm + 143 code lines / 10 lines-per-min = 41 min, plus 6 x 2 min to say each Interview answer aloud = **53 min**. Read slot = 50 min.
- **Overflow (~3 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 1.6 Release lines, LTS and runtime flags you should know. About 3 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 1 wrap-up (lines 684-719, 35 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 680 lines of this Day block would take about 45 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Run small scripts printing process.versions, os.cpus(), globalThis keys; trace a fs.readFile call through the layers on paper.

**Interview questions to revise:** Q-NODE-01..05; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 7 (Week 1 weak areas); Day 5 (Event loop and microtasks); Day 1 (Closures, scope, hoisting).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can draw the Node architecture diagram from memory.
- I can answer 'is Node single-threaded?' accurately.
- I can list 3 differences from browser JS.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 2 / Day 1 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Run small scripts printing process.versions, os.cpus(), globalThis keys
- [ ] Questions Q-NODE-01..05 answered aloud
- [ ] Spaced revisit done (Day 7, Day 5, Day 1)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 2 / Day 2 (overall Day 9) -- Event loop phases, async I/O, blocking vs non-blocking, thread pool

**Tier:** ESSENTIAL

**Learning objectives**

- Name the libuv phases in order (timers, pending, poll, check, close) and where nextTick/microtasks run.
- State precisely what uses OS polling (network), the thread pool (fs, dns.lookup, crypto pbkdf2/scrypt/randomBytes, zlib) or the loop itself.
- Demonstrate blocking the loop and fix it.

**Topics:** Event loop phases and ordering; setTimeout vs setImmediate inside and outside I/O callbacks; OS-level async (epoll/kqueue/IOCP) vs thread pool; UV_THREADPOOL_SIZE and pool saturation; Blocking vs non-blocking code.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): The event loop and its phases; How a request flows through the loop (end-to-end; setTimeout vs setImmediate vs nextTick vs queueM; Who does the work: OS async I/O vs libuv thread ; The libuv thread pool... | Reading |
| 35 | Read-along of the overflow section(s) (~16 min, typing their examples) then coding practice: Redo EX-LOOP-03..06 for the Node phase cases (EX-LOOP-04, setTimeout vs setImmediate inside an I/O callback, is the key one; only EX-LOOP-01..06 exist); benchmark 8 parallel pbkdf2 calls with UV_THREADPOOL_SIZE 1/4/8; block the loop with a CPU loop and measure request latency | Coding |
| 15 | Spaced revisit (Day 8, Day 6, Day 2 key concepts, cover and recall, 8 min) plus questions Q-NODE-06..12 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 715 of the 864 lines in the Day 2 block of `02_Week2_Node_Internals.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 2.1 The event loop and its phases | 748-941 | 193 | 1142 | 67 | 14.3 |
| 2.2 How a request flows through the loop (end-to-end trace) | 942-975 | 33 | 167 | 12 | 2.3 |
| 2.3 setTimeout vs setImmediate vs nextTick vs queueMicrotask: when to use which | 976-1008 | 32 | 170 | 12 | 2.3 |
| 2.4 Who does the work: OS async I/O vs libuv thread pool vs event loop vs main thread | 1009-1129 | 120 | 1357 | 7 | 9.7 |
| 2.5 The libuv thread pool in practice: size, sharing, starvation | 1130-1265 | 135 | 777 | 39 | 9.1 |
| 2.6 Blocking vs non-blocking, and how to keep the event loop healthy | 1266-1433 | 167 | 889 | 55 | 11.4 |
| 2.7 Bringing it together: one mixed example | 1434-1469 | 35 | 149 | 16 | 2.6 |
| **Total** | | **715** | **4651** | **208** | **51.8** |

- **Estimate:** 4651 prose words / 150 wpm + 208 code lines / 10 lines-per-min = 52 min, plus 7 x 2 min to say each Interview answer aloud = **66 min**. Read slot = 50 min.
- **Overflow (~16 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 2.6 Blocking vs non-blocking, and how to keep the event loop healthy; 2.7 Bringing it together: one mixed example. About 16 min is absorbed into the coding slot (you type those examples anyway).
- **Skim only (headings and one-line takeaways, no code):** 2.9 Delivery tip (1536-1541).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** 2.8 Output-prediction drill (1470-1535, 65 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 2 wrap-up (lines 1542-1584, 42 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 864 lines of this Day block would take about 62 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Redo EX-LOOP-03..06 for the Node phase cases (EX-LOOP-04, setTimeout vs setImmediate inside an I/O callback, is the key one; only EX-LOOP-01..06 exist); benchmark 8 parallel pbkdf2 calls with UV_THREADPOOL_SIZE 1/4/8; block the loop with a CPU loop and measure request latency.

**Interview questions to revise:** Q-NODE-06..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 8 (Node architecture, V8, libuv); Day 6 (Promise combinators, async mistakes); Day 2 (this and prototypes).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can say which category fs, net, crypto.pbkdf2 and dns.lookup fall in.
- I can explain pool saturation symptoms.
- I can predict setImmediate vs setTimeout(0) order cases.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 2 / Day 2 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Redo EX-LOOP-03..06 for the Node phase cases (EX-LOOP-04, setTimeout vs setImmediate inside an
- [ ] Questions Q-NODE-06..12 answered aloud
- [ ] Spaced revisit done (Day 8, Day 6, Day 2)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 2 / Day 3 (overall Day 10) -- Worker threads, CommonJS vs ESM, process, Buffer, env variables

**Tier:** ESSENTIAL

**Learning objectives**

- Decide when worker_threads, child_process or cluster is appropriate.
- Explain CJS vs ESM differences (require vs import, sync vs async load, __dirname vs import.meta, top-level await).
- Use process (argv, env, exit codes, signals), Buffer and env configuration correctly.

**Topics:** worker_threads vs cluster vs child_process; CommonJS vs ES modules, interop rules; process object, exit codes, signals; Buffer basics: encodings, allocation, binary data; Environment variables, --env-file (Node 20.6+ / 22), dotenv alternative.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Worker threads; child_process: running other programs; CommonJS vs ES modules; The process object; Buffer; Environment variables and configuration | Reading |
| 35 | Read-along of the overflow section(s) (~20 min, typing their examples) then coding practice: Offload a CPU task (fib or hashing) to a worker and compare; convert a CJS script to ESM; read config from process.env with validation; Buffer hex/base64 round trip | Coding |
| 15 | Spaced revisit (Day 9, Day 7, Day 3 key concepts, cover and recall, 8 min) plus questions Q-NODE-13..19 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 902 of the 975 lines in the Day 3 block of `02_Week2_Node_Internals.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 3.1 Worker threads (mixed tag: concept only) | 1612-1879 | 267 | 1140 | 105 | 18.1 |
| 3.2 child_process: running other programs | 1880-1912 | 32 | 128 | 13 | 2.2 |
| 3.3 CommonJS vs ES modules (mixed tag: concept only) | 1913-2110 | 197 | 1297 | 42 | 12.8 |
| 3.4 The process object | 2111-2260 | 149 | 847 | 41 | 9.7 |
| 3.5 Buffer | 2261-2394 | 133 | 665 | 38 | 8.2 |
| 3.6 Environment variables and configuration | 2395-2519 | 124 | 688 | 34 | 8.0 |
| **Total** | | **902** | **4765** | **273** | **59.1** |

- **Estimate:** 4765 prose words / 150 wpm + 273 code lines / 10 lines-per-min = 59 min, plus 6 x 2 min to say each Interview answer aloud = **71 min**. Read slot = 50 min.
- **Overflow (~21 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 3.4 The process object; 3.5 Buffer; 3.6 Environment variables and configuration. About 20 min is absorbed into the coding slot (you type those examples anyway). The remaining ~1 min is carried to the Day 7 catch-up reading of this week.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "3.1 Worker threads" (lines 1765-1783); the [ADVANCED] sub-block inside "3.3 CommonJS vs ES modules" (lines 2040-2046).
- **Wrap-up section (used in the wrap-up slot):** Day 3 wrap-up (lines 2520-2560, 40 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 975 lines of this Day block would take about 65 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Offload a CPU task (fib or hashing) to a worker and compare; convert a CJS script to ESM; read config from process.env with validation; Buffer hex/base64 round trip.

**Interview questions to revise:** Q-NODE-13..19; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 9 (Event loop phases, thread pool); Day 7 (Week 1 weak areas); Day 3 (Objects, arrays, references).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "3.1 Worker threads" (lines 1765-1783); the [ADVANCED] sub-block inside "3.3 CommonJS vs ES modules" (lines 2040-2046).

**Daily learning outcomes**

- I can justify worker thread vs cluster for a CPU job.
- I can list 4 CJS vs ESM differences.
- I can explain why env vars are strings and need parsing.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 2 / Day 3 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Offload a CPU task (fib or hashing) to a worker and compare
- [ ] Questions Q-NODE-13..19 answered aloud
- [ ] Spaced revisit done (Day 9, Day 7, Day 3)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 2 / Day 4 (overall Day 11) -- File system and streams

**Tier:** ESSENTIAL

**Learning objectives**

- Use fs/promises correctly and know why readFile on huge files is a memory risk.
- Explain the four stream types and the flowing/paused modes.
- Stream a large file to an HTTP response.

**Topics:** fs/promises vs callback vs sync APIs; Readable, Writable, Duplex, Transform; createReadStream, object mode, async iteration; Streaming a file download in an HTTP server.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): File system (node:fs) and path; Streams: concept, types, modes; Custom streams: Readable, Writable, Transform | Reading |
| 35 | Coding practice: Write a CSV line-counter with readline + stream; implement an uppercase Transform; serve a large file via createReadStream without loading it in memory | Coding |
| 15 | Spaced revisit (Day 10, Day 8, Day 4 key concepts, cover and recall, 8 min) plus questions Q-NODE-20..24 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 621 of the 706 lines in the Day 4 block of `02_Week2_Node_Internals.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 4.1 File system (node:fs) and path | 2586-2781 | 195 | 886 | 69 | 12.8 |
| 4.2 Streams: concept, types, modes | 2782-2994 | 212 | 1081 | 70 | 14.2 |
| 4.3 Custom streams: Readable, Writable, Transform | 2995-3209 | 214 | 581 | 118 | 15.7 |
| **Total** | | **621** | **2548** | **257** | **42.7** |

- **Estimate:** 2548 prose words / 150 wpm + 257 code lines / 10 lines-per-min = 43 min, plus 3 x 2 min to say each Interview answer aloud = **49 min**. Read slot = 50 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** 4.4 Web Streams awareness (lines 3210-3228, 18 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 4 wrap-up (lines 3229-3267, 38 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 706 lines of this Day block would take about 47 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Write a CSV line-counter with readline + stream; implement an uppercase Transform; serve a large file via createReadStream without loading it in memory.

**Interview questions to revise:** Q-NODE-20..24; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 10 (Workers, CJS/ESM, process, Buffer); Day 8 (Node architecture, V8, libuv); Day 4 (Promises and async/await).

**ADVANCED (skip first if behind):** 4.4 Web Streams awareness (lines 3210-3228, 18 lines).

**Daily learning outcomes**

- I can explain streams as 'process data in chunks' with a memory example.
- I can write a Transform stream.
- I can say when to use readFile vs stream.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 2 / Day 4 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Write a CSV line-counter with readline + stream
- [ ] Questions Q-NODE-20..24 answered aloud
- [ ] Spaced revisit done (Day 10, Day 8, Day 4)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 2 / Day 5 (overall Day 12) -- Backpressure, stream pipelines, EventEmitter

**Tier:** ESSENTIAL

**Learning objectives**

- Explain backpressure: write() returning false, highWaterMark, drain event.
- Use stream.pipeline / pipeline from node:stream/promises for correct error handling and cleanup.
- Use EventEmitter correctly (on, once, error event, memory-leak warning).

**Topics:** Backpressure and highWaterMark; pipeline vs pipe and error propagation; EventEmitter API and the special 'error' event; Listener leaks (MaxListenersExceededWarning).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Backpressure; pipeline, error propagation, and real pipelines; EventEmitter | Reading |
| 30 | Read-along of the overflow section(s) (~3 min, typing their examples) then coding practice: Gzip a file with pipeline and a slow writable to observe backpressure; build a typed EventEmitter-based job runner; reproduce and fix a listener leak | Coding |
| 20 | Spaced revisit (Day 11, Day 9, Day 5 key concepts, cover and recall, 10 min) plus questions Q-NODE-24..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 672 of the 736 lines in the Day 5 block of `02_Week2_Node_Internals.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 5.1 Backpressure (mixed tag: concept only) | 3293-3504 | 211 | 887 | 81 | 14.0 |
| 5.2 pipeline, error propagation, and real pipelines | 3505-3711 | 206 | 602 | 109 | 14.9 |
| 5.3 EventEmitter (mixed tag: concept only) | 3712-3967 | 255 | 923 | 121 | 18.3 |
| **Total** | | **672** | **2412** | **311** | **47.2** |

- **Estimate:** 2412 prose words / 150 wpm + 311 code lines / 10 lines-per-min = 47 min, plus 3 x 2 min to say each Interview answer aloud = **53 min**. Read slot = 50 min.
- **Overflow (~3 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 5.3 EventEmitter. About 3 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "5.1 Backpressure" (lines 3430-3446); the [ADVANCED] sub-block inside "5.3 EventEmitter" (lines 3904-3906).
- **Wrap-up section (used in the wrap-up slot):** Day 5 wrap-up (lines 3968-4004, 36 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 736 lines of this Day block would take about 52 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Gzip a file with pipeline and a slow writable to observe backpressure; build a typed EventEmitter-based job runner; reproduce and fix a listener leak.

**Interview questions to revise:** Q-NODE-24..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 11 (fs and streams); Day 9 (Event loop phases, thread pool); Day 5 (Event loop and microtasks).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "5.1 Backpressure" (lines 3430-3446); the [ADVANCED] sub-block inside "5.3 EventEmitter" (lines 3904-3906).

**Daily learning outcomes**

- I can explain why pipe() alone is unsafe for errors.
- I can describe the drain cycle.
- I can explain what happens with an unhandled 'error' event.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 2 / Day 5 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Gzip a file with pipeline and a slow writable to observe backpressure
- [ ] Questions Q-NODE-24..30 answered aloud
- [ ] Spaced revisit done (Day 11, Day 9, Day 5)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 2 / Day 6 (overall Day 13) -- Memory management, garbage collection, memory leaks

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Explain the V8 heap (young/old generation), generational GC and why long-lived references leak.
- List the top 6 Node leak causes (unbounded caches, listeners, globals, closures, timers, unreleased streams/connections).
- Capture and read a heap snapshot at a basic level.

**Topics:** V8 heap layout and generational GC; Common leak patterns and how to spot them; process.memoryUsage(), --max-old-space-size, heap snapshots; Bounded caches (LRU) as a fix.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Where memory lives in a Node process; Garbage collection in V8; Memory leaks: what they are and the common cause; Diagnosing a leak and an OOM in practice | Reading |
| 30 | Coding practice: Reproduce an unbounded-cache leak, watch RSS/heapUsed grow, fix with an LRU; take two heap snapshots in Chrome DevTools and compare (basic); EX-DEBUG-02 (memory grows until the pod is OOM-killed) | Coding |
| 20 | Spaced revisit (Day 12, Day 10, Day 6 key concepts, cover and recall, 10 min) plus questions Q-NODE-26..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 589 of the 658 lines in the Day 6 block of `02_Week2_Node_Internals.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 6.1 Where memory lives in a Node process | 4032-4157 | 125 | 766 | 35 | 8.6 |
| 6.2 Garbage collection in V8 | 4158-4288 | 130 | 882 | 27 | 8.6 |
| 6.3 Memory leaks: what they are and the common causes | 4289-4489 | 200 | 1206 | 62 | 14.2 |
| 6.4 Diagnosing a leak and an OOM in practice | 4490-4624 | 134 | 1091 | 14 | 8.7 |
| **Total** | | **589** | **3945** | **138** | **40.1** |

- **Estimate:** 3945 prose words / 150 wpm + 138 code lines / 10 lines-per-min = 40 min, plus 4 x 2 min to say each Interview answer aloud = **48 min**. Read slot = 50 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 6 wrap-up (lines 4625-4663, 38 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 658 lines of this Day block would take about 44 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Reproduce an unbounded-cache leak, watch RSS/heapUsed grow, fix with an LRU; take two heap snapshots in Chrome DevTools and compare (basic); EX-DEBUG-02 (memory grows until the pod is OOM-killed).

**Interview questions to revise:** Q-NODE-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 12 (Backpressure, pipeline, EventEmitter); Day 10 (Workers, CJS/ESM, process, Buffer); Day 6 (Promise combinators, async mistakes).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can name 5 leak causes with a one-line fix each.
- I can explain heapUsed vs rss.
- I can describe the first three diagnosis steps for a leaking service.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 2 / Day 6 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Reproduce an unbounded-cache leak, watch RSS/heapUsed grow, fix with an LRU
- [ ] Questions Q-NODE-26..30 answered aloud
- [ ] Spaced revisit done (Day 12, Day 10, Day 6)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 2 / Day 7 (overall Day 14) -- Revision, weekly test, catch-up

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Prove (to yourself) what you actually retained from Week 2 by taking the weekly assessment closed-book.
- Identify the 2-3 weakest topics and repair them; absorb any unfinished day.
- Consolidate the week's key concepts into a one-page summary you can re-read in 10 minutes.

**Topics:** All of Week 2 -- Node architecture, V8, libuv; Event loop phases, thread pool; Workers, CJS/ESM, process, Buffer; fs and streams; Backpressure, pipeline, EventEmitter; Memory, GC, leaks

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus read the Week 2 revision summary | Revision and questions |
| 40 | Weekly assessment (Week 2 file), closed book, timed, answer in writing or aloud | Revision and questions |
| 15 | Mark using the answer key; list weak areas using the weak-area guidance | Wrap-up and tests |
| 20 | Catch-up reading: FIRST the overflow carried from this week (Day 10 ~1 min), then weak areas, then any unfinished day | Reading |
| 15 | Catch-up coding: redo the failed exercise | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |

**Reading plan (Day 7 revision day: second-pass speed = about 2x the first-pass speed, so each section costs about half its first-read estimate)**

| File | Section | Lines | Line count | Est. min (second pass) |
|------|---------|-------|------------|------------------------|
| 02_Week2_Node_Internals.md | Week 2 Revision Summary | 4902-4961 | 60 | 1.8 |
| 02_Week2_Node_Internals.md | Week 2 Assessment | 4962-5097 | 136 | 4.1 |
| 02_Week2_Node_Internals.md | Week 2 Answers with Explanations | 5098-5326 | 229 | 9.6 |
| 02_Week2_Node_Internals.md | Weak-Area Identification Guidance | 5327-5367 | 41 | 1.6 |
| 02_Week2_Node_Internals.md | Catch-Up Plan If You Fall Behind | 5368-5408 | 41 | 1.7 |

- **Where each slot uses them:** the revision summary belongs to the 25-minute spaced-revisit slot (about 2 min of reading, the rest is cover-and-recall); the assessment is the 40-minute closed-book slot (do not read the answers first); the answers section is used while marking (15 min); weak-area guidance and the catch-up plan feed the catch-up slots.
- **Overflow carried into this Day 7:** Day 10 (3.4 The process object; 3.5 Buffer; 3.6 Environment variables and configuration), ~1 min. Because the carry is 1 min the catch-up reading slot is 20 min and the catch-up coding slot is 15 min (the table above already reflects this).
- **Re-read only the Week 2 / Day 1-6 notes for topics you got wrong** (use each Day block reading plan to find the ESSENTIAL section and re-read that section, not the whole Day).

**Coding practice:** Redo (from a blank file) every exercise you got wrong this week, in these groups: EX-LOOP, EX-DEBUG (and the Week 2 / Day 3-5 coding tasks). No new project stage.

**Interview questions to revise:** The 10 questions you found hardest from this week's ID ranges (Q-NODE-01..30). Answer each aloud in under 90 seconds.

**Weekly test:** Week 2 assessment in `02_Week2_Node_Internals.md` (mixed Basic/Intermediate/Advanced). Target: 70 percent or more. Below 70 percent -> follow the week's catch-up plan before starting next week's Day 1.

**Daily learning outcomes**

- I know my Week 2 score and my weakest 2-3 topics.
- I have repaired at least one weak topic by re-reading plus re-doing a task.
- Every unfinished item from Day 1-6 is either done or explicitly moved to section 5 triage.

**Completion checklist**

- [ ] Spaced revisit of Day 1-6 done
- [ ] Weekly assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Weak topics re-read
- [ ] Failed exercise redone from blank file
- [ ] Week 2 hours logged (target 14 h)

### 3.4 Week 3 -- Express.js and REST APIs (Days 15-21)

- **Notes file:** `03_Week3_Express_REST.md`
- **Week goal:** Build and explain a layered Express 5 REST API (routes, controllers, services, middleware, validation, error handling, auth middleware, pagination).
- **Never skip this week:** HTTP lifecycle and status codes, REST design, middleware order, validation, centralized error handler, auth middleware, pagination, CORS.
- **ADVANCED (skip first if behind):** OpenAPI tooling details, API versioning strategies beyond URL versioning, multipart streaming internals.


#### Week 3 / Day 1 (overall Day 15) -- HTTP lifecycle, methods, headers, status codes, cookies, content types

**Tier:** ESSENTIAL

**Learning objectives**

- Walk through a request from browser to response (DNS, TCP, TLS, HTTP, server handling).
- Choose correct methods, idempotency/safety properties and status codes.
- Use important headers and cookie attributes (HttpOnly, Secure, SameSite).

**Topics:** Request-response lifecycle; Methods: safe/idempotent table; Status code families and the ones interviewers ask (200/201/204/400/401/403/404/409/422/429/500/502/503); Headers, content negotiation, Content-Type, caching headers; Cookies and their security attributes.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): HTTP request-response lifecycle; HTTP methods: safe and idempotent; Status codes; Headers; Cookies; Content types and body formats | Reading |
| 30 | Read-along of the overflow section(s) (~5 min, typing their examples) then coding practice: Build a raw node:http server that returns JSON, handles 404 and a POST body; inspect with curl -v and note headers | Coding |
| 20 | Spaced revisit (Day 14, Day 12, Day 8 key concepts, cover and recall, 10 min) plus questions Q-EXP-01..06 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 594 of the 659 lines in the Day 1 block of `03_Week3_Express_REST.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 1.1 -- HTTP request-response lifecycle | 227-479 | 252 | 1030 | 137 | 20.6 |
| Topic 1.2 -- HTTP methods: safe and idempotent | 480-556 | 76 | 661 | 6 | 5.0 |
| Topic 1.3 -- Status codes | 557-639 | 82 | 787 | 0 | 5.2 |
| Topic 1.4 -- Headers | 640-675 | 35 | 344 | 0 | 2.3 |
| Topic 1.5 -- Cookies | 676-765 | 89 | 609 | 22 | 6.3 |
| Topic 1.6 -- Content types and body formats | 766-826 | 60 | 588 | 0 | 3.9 |
| **Total** | | **594** | **4019** | **165** | **43.3** |

- **Estimate:** 4019 prose words / 150 wpm + 165 code lines / 10 lines-per-min = 43 min, plus 6 x 2 min to say each Interview answer aloud = **55 min**. Read slot = 50 min.
- **Overflow (~5 min):** does not fit the 50-minute read slot, so these last section(s) spill over: Topic 1.6 -- Content types and body formats. About 5 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 1 wrap-up (lines 827-862, 35 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 659 lines of this Day block would take about 47 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Build a raw node:http server that returns JSON, handles 404 and a POST body; inspect with curl -v and note headers.

**Interview questions to revise:** Q-EXP-01..06; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 14 (Week 2 weak areas); Day 12 (Backpressure, pipeline, EventEmitter); Day 8 (Node architecture, V8, libuv).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can pick between 400, 401, 403, 404, 409 and 422 correctly.
- I can explain PUT vs PATCH vs POST idempotency.
- I can explain SameSite and HttpOnly.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 3 / Day 1 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Build a raw node:http server that returns JSON, handles 404 and a POST body
- [ ] Questions Q-EXP-01..06 answered aloud
- [ ] Spaced revisit done (Day 14, Day 12, Day 8)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 3 / Day 2 (overall Day 16) -- REST principles, API design, Express setup, routes/controllers/services

**Tier:** ESSENTIAL

**Learning objectives**

- State REST constraints and design resource-oriented URLs.
- Set up an Express 5 app with routers, controllers and services (separation of concerns).
- Explain why controllers stay thin.

**Topics:** REST principles and resource naming; Express 5 setup (v4 differences: async handler errors forwarded in 5); express.Router, controller vs service vs repository; Project structure and config loading.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 20 | Read the ESSENTIAL sections only (reading plan below): REST principles and API design; Express setup and how a request travels; Routes, controllers, services (and repositories) | Reading |
| 65 | Coding practice: Project Stage 1 + start Stage 2: scaffold Task API (Express 5, ESM), health route, tasks router with in-memory CRUD controller/service | Coding |
| 15 | Spaced revisit (Day 15, Day 13, Day 9 key concepts, cover and recall, 8 min) plus questions Q-EXP-07..12 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 166 of the 482 lines in the Day 2 block of `03_Week3_Express_REST.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 2.1 -- REST principles and API design | 884-978 | 94 | 978 | 0 | 6.5 |
| Topic 2.2 -- Express setup and how a request travels | 979-1030 | 51 | 623 | 0 | 4.2 |
| Topic 2.3 -- Routes, controllers, services (and repositories) | 1031-1052 | 21 | 219 | 0 | 1.5 |
| **Total** | | **166** | **1820** | **0** | **12.1** |

- **Estimate:** 1820 prose words / 150 wpm + 0 code lines / 10 lines-per-min = 12 min, plus 3 x 2 min to say each Interview answer aloud = **18 min**. Read slot = 20 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Build: Stage 1 skeleton + in-memory CRUD (1053-1312, 259 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 2 wrap-up (lines 1313-1345, 32 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 482 lines of this Day block would take about 34 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Project Stage 1 + start Stage 2: scaffold Task API (Express 5, ESM), health route, tasks router with in-memory CRUD controller/service.

**Interview questions to revise:** Q-EXP-07..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 15 (HTTP basics); Day 13 (Memory, GC, leaks); Day 9 (Event loop phases, thread pool).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain what makes an API RESTful vs RPC-over-HTTP.
- I can sketch routes/controllers/services for a resource.
- I can name 2 Express 5 vs 4 differences.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~20 min) and said each Interview answer aloud (Week 3 / Day 2 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Project Stage 1 + start Stage 2: scaffold Task API (Express 5, ESM), health route, tasks router
- [ ] Questions Q-EXP-07..12 answered aloud
- [ ] Spaced revisit done (Day 15, Day 13, Day 9)
- [ ] Project stage progressed: Stage 1
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 3 / Day 3 (overall Day 17) -- Middleware, request validation, sanitization

**Tier:** ESSENTIAL

**Learning objectives**

- Explain middleware order, next(), and the request lifecycle through the stack.
- Write custom middleware (request id, timing, auth stub).
- Validate and sanitize input with a schema library (zod or similar) and return consistent 400/422 errors.

**Topics:** Middleware types: application, router, error, built-in; Order of execution and short-circuiting; Schema validation and sanitization; Never trusting client input.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Middleware; Request validation with zod; Sanitization: validation vs sanitization vs esca | Reading |
| 30 | Coding practice: EX-MW-01..04 (logger, request id, validate(schema), async wrapper discussion); Stage 2: add validation to task create/update | Coding |
| 20 | Spaced revisit (Day 16, Day 14, Day 10 key concepts, cover and recall, 10 min) plus questions Q-EXP-13..18 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 513 of the 569 lines in the Day 3 block of `03_Week3_Express_REST.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 3.1 -- Middleware | 1367-1503 | 136 | 822 | 43 | 9.8 |
| Topic 3.2 -- Request validation with zod | 1504-1811 | 307 | 1248 | 161 | 24.4 |
| Topic 3.3 -- Sanitization: validation vs sanitization vs escaping | 1812-1882 | 70 | 659 | 12 | 5.6 |
| **Total** | | **513** | **2729** | **216** | **39.8** |

- **Estimate:** 2729 prose words / 150 wpm + 216 code lines / 10 lines-per-min = 40 min, plus 3 x 2 min to say each Interview answer aloud = **46 min**. Read slot = 50 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 3 wrap-up (lines 1883-1915, 32 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 569 lines of this Day block would take about 43 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-MW-01..04 (logger, request id, validate(schema), async wrapper discussion); Stage 2: add validation to task create/update.

**Interview questions to revise:** Q-EXP-13..18; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 16 (REST design, Express layers); Day 14 (Week 2 weak areas); Day 10 (Workers, CJS/ESM, process, Buffer).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain why middleware order matters with an example.
- I can write validate(schema) middleware.
- I can distinguish validation from sanitization.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 3 / Day 3 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-MW-01..04 (logger, request id, validate(schema), async wrapper discussion)
- [ ] Questions Q-EXP-13..18 answered aloud
- [ ] Spaced revisit done (Day 16, Day 14, Day 10)
- [ ] Project stage progressed: Stage 2
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 3 / Day 4 (overall Day 18) -- Centralized error handling, authentication middleware

**Tier:** ESSENTIAL

**Learning objectives**

- Build an AppError hierarchy and a single error-handling middleware.
- Distinguish operational errors from programmer errors.
- Write authentication middleware that sets req.user and rejects with 401.

**Topics:** Custom error classes and error shape; Error middleware (4 args) and Express 5 async handling; Operational vs programmer errors and process-level handlers; Auth middleware pattern (Bearer token verification preview).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Centralized error handling; Authentication middleware | Reading |
| 35 | Read-along of the overflow section(s) (~1 min, typing their examples) then coding practice: EX-MW-05 (error-handling and not-found middleware), EX-MW-03 (API key auth middleware), EX-MW-06 (ADVANCED compose, optional) and EX-EXP-01..02 (skeleton, full CRUD with correct status codes); Stage 2: wire AppError and the global handler into the Task API | Coding |
| 15 | Spaced revisit (Day 17, Day 15, Day 11 key concepts, cover and recall, 8 min) plus questions Q-EXP-19..24 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 612 of the 668 lines in the Day 4 block of `03_Week3_Express_REST.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 4.1 -- Centralized error handling | 1937-2147 | 210 | 454 | 138 | 16.8 |
| Topic 4.2 -- Authentication middleware | 2148-2550 | 402 | 1115 | 226 | 30.0 |
| **Total** | | **612** | **1569** | **364** | **46.9** |

- **Estimate:** 1569 prose words / 150 wpm + 364 code lines / 10 lines-per-min = 47 min, plus 2 x 2 min to say each Interview answer aloud = **51 min**. Read slot = 50 min.
- **Overflow (~1 min):** does not fit the 50-minute read slot, so these last section(s) spill over: Topic 4.2 -- Authentication middleware. About 1 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 4 wrap-up (lines 2551-2584, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 668 lines of this Day block would take about 50 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-MW-05 (error-handling and not-found middleware), EX-MW-03 (API key auth middleware), EX-MW-06 (ADVANCED compose, optional) and EX-EXP-01..02 (skeleton, full CRUD with correct status codes); Stage 2: wire AppError and the global handler into the Task API.

**Interview questions to revise:** Q-EXP-19..24; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 17 (Middleware and validation); Day 15 (HTTP basics); Day 11 (fs and streams).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain why one central error handler beats try/catch in every route.
- I can return a consistent error JSON.
- I can explain 401 vs 403 in middleware.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 3 / Day 4 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-MW-05 (error-handling and not-found middleware), EX-MW-03 (API key auth middleware), EX-MW-0
- [ ] Questions Q-EXP-19..24 answered aloud
- [ ] Spaced revisit done (Day 17, Day 15, Day 11)
- [ ] Project stage progressed: Stage 2
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 3 / Day 5 (overall Day 19) -- Pagination, filtering, sorting, API versioning

**Tier:** ESSENTIAL

**Learning objectives**

- Implement offset and cursor pagination and state trade-offs.
- Implement whitelisted filtering and sorting (prevent injection through sort fields).
- Explain URL vs header versioning.

**Topics:** Offset vs cursor/keyset pagination; Filtering and sorting query design; Response envelope with meta; API versioning strategies and deprecation.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read the ESSENTIAL sections only (reading plan below): Pagination; Filtering and sorting; API versioning | Reading |
| 55 | Coding practice: EX-EXP-03 (list endpoint: filter, search, sort, paginate), EX-EXP-04..05 (layered architecture + centralized errors, nested resources), EX-EXP-06 (ADVANCED versioning/conditional updates, optional); Stage 2/5 prep: GET /tasks with page, limit, status, sort | Coding |
| 20 | Spaced revisit (Day 18, Day 16, Day 12 key concepts, cover and recall, 10 min) plus questions Q-EXP-25..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 205 of the 593 lines in the Day 5 block of `03_Week3_Express_REST.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 5.1 -- Pagination | 2606-2686 | 80 | 858 | 9 | 6.6 |
| Topic 5.2 -- Filtering and sorting | 2687-2747 | 60 | 585 | 0 | 3.9 |
| Topic 5.3 -- API versioning | 2748-2813 | 65 | 595 | 0 | 4.0 |
| **Total** | | **205** | **2038** | **9** | **14.5** |

- **Estimate:** 2038 prose words / 150 wpm + 9 code lines / 10 lines-per-min = 14 min, plus 3 x 2 min to say each Interview answer aloud = **20 min**. Read slot = 25 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Practice sections inside the notes (use them in the coding slot, not the read slot):** Build: feature-complete list endpoint (2814-3146, 332 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 5 wrap-up (lines 3147-3178, 31 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 593 lines of this Day block would take about 44 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-EXP-03 (list endpoint: filter, search, sort, paginate), EX-EXP-04..05 (layered architecture + centralized errors, nested resources), EX-EXP-06 (ADVANCED versioning/conditional updates, optional); Stage 2/5 prep: GET /tasks with page, limit, status, sort.

**Interview questions to revise:** Q-EXP-25..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 18 (Error handler, auth middleware); Day 16 (REST design, Express layers); Day 12 (Backpressure, pipeline, EventEmitter).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain why offset pagination gets slow and inconsistent.
- I can whitelist sort columns.
- I can design GET /tasks?status=open&sort=-createdAt&limit=20.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~25 min) and said each Interview answer aloud (Week 3 / Day 5 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-EXP-03 (list endpoint: filter, search, sort, paginate), EX-EXP-04..05 (layered architecture
- [ ] Questions Q-EXP-25..30 answered aloud
- [ ] Spaced revisit done (Day 18, Day 16, Day 12)
- [ ] Project stage progressed: Stage 2 finish, Stage 5 preview
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 3 / Day 6 (overall Day 20) -- File uploads, API docs (OpenAPI/Swagger), CORS, request lifecycle debugging

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Handle multipart uploads safely (size/type limits, storage location).
- Document the API with an OpenAPI spec and Swagger UI.
- Explain CORS including preflight, and debug a failing request through the lifecycle.

**Topics:** multipart/form-data and multer (limits, fileFilter); OpenAPI 3 basics and Swagger UI; CORS: simple vs preflight requests, credentials; Debugging checklist: network tab, curl, logs, middleware order.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): File uploads with multer; API documentation with OpenAPI (Swagger); CORS; Request lifecycle debugging | Reading |
| 35 | Read-along of the overflow section(s) (~20 min, typing their examples) then coding practice: Add an attachment upload endpoint with limits; write openapi.yaml for 3 endpoints and serve Swagger UI; EX-DEBUG-08 (login works in Postman, fails in the browser: the CORS fix-the-bug). (Only EX-EXP-01..06 exist.) | Coding |
| 15 | Spaced revisit (Day 19, Day 17, Day 13 key concepts, cover and recall, 8 min) plus questions Q-EXP-26..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 978 of the 1036 lines in the Day 6 block of `03_Week3_Express_REST.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| Topic 6.1 -- File uploads with multer | 3201-3568 | 367 | 1000 | 247 | 31.4 |
| Topic 6.2 -- API documentation with OpenAPI (Swagger) | 3569-3917 | 348 | 626 | 279 | 32.1 |
| Topic 6.3 -- CORS | 3918-4098 | 180 | 968 | 84 | 14.9 |
| Topic 6.4 -- Request lifecycle debugging | 4099-4182 | 83 | 846 | 11 | 6.7 |
| **Total** | | **978** | **3440** | **621** | **85.0** |

- **Estimate:** 3440 prose words / 150 wpm + 621 code lines / 10 lines-per-min = 85 min, plus 4 x 2 min to say each Interview answer aloud = **93 min**. Read slot = 50 min.
- **Overflow (~43 min):** does not fit the 50-minute read slot, so these last section(s) spill over: Topic 6.2 -- API documentation with OpenAPI (Swagger); Topic 6.3 -- CORS; Topic 6.4 -- Request lifecycle debugging. About 20 min is absorbed into the coding slot (you type those examples anyway). The remaining ~23 min is carried to the Day 7 catch-up reading of this week.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 6 wrap-up (lines 4183-4215, 32 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 1036 lines of this Day block would take about 88 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Add an attachment upload endpoint with limits; write openapi.yaml for 3 endpoints and serve Swagger UI; EX-DEBUG-08 (login works in Postman, fails in the browser: the CORS fix-the-bug). (Only EX-EXP-01..06 exist.).

**Interview questions to revise:** Q-EXP-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 19 (Pagination, filter, sort, versioning); Day 17 (Middleware and validation); Day 13 (Memory, GC, leaks).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain why CORS is enforced by the browser, not the server.
- I can list safe upload limits.
- I can describe a preflight request.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 3 / Day 6 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Add an attachment upload endpoint with limits
- [ ] Questions Q-EXP-26..30 answered aloud
- [ ] Spaced revisit done (Day 19, Day 17, Day 13)
- [ ] Project stage progressed: Stage 2 finish, Stage 7 start
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 3 / Day 7 (overall Day 21) -- Revision, weekly test, catch-up

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Prove (to yourself) what you actually retained from Week 3 by taking the weekly assessment closed-book.
- Identify the 2-3 weakest topics and repair them; absorb any unfinished day.
- Consolidate the week's key concepts into a one-page summary you can re-read in 10 minutes.

**Topics:** All of Week 3 -- HTTP basics; REST design, Express layers; Middleware and validation; Error handler, auth middleware; Pagination, filter, sort, versioning; Uploads, OpenAPI, CORS

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus read the Week 3 revision summary | Revision and questions |
| 40 | Weekly assessment (Week 3 file), closed book, timed, answer in writing or aloud | Revision and questions |
| 15 | Mark using the answer key; list weak areas using the weak-area guidance | Wrap-up and tests |
| 25 | Catch-up reading: FIRST the overflow carried from this week (Day 20 ~23 min), then weak areas, then any unfinished day | Reading |
| 10 | Catch-up coding: redo the failed exercise or advance the project (Stage 1 and Stage 2 complete (in-memory CRUD, validation, central error handler, auth stub)) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |

**Reading plan (Day 7 revision day: second-pass speed = about 2x the first-pass speed, so each section costs about half its first-read estimate)**

| File | Section | Lines | Line count | Est. min (second pass) |
|------|---------|-------|------------|------------------------|
| 03_Week3_Express_REST.md | Week 3 revision summary | 4460-4478 | 19 | 0.8 |
| 03_Week3_Express_REST.md | Week 3 assessment | 4479-4561 | 83 | 2.7 |
| 03_Week3_Express_REST.md | Answers with explanations | 4562-4661 | 100 | 6.5 |
| 03_Week3_Express_REST.md | Weak-area identification guidance | 4662-4691 | 30 | 1.2 |
| 03_Week3_Express_REST.md | Catch-up plan if you fall behind | 4692-4709 | 18 | 0.9 |

- **Where each slot uses them:** the revision summary belongs to the 25-minute spaced-revisit slot (about 1 min of reading, the rest is cover-and-recall); the assessment is the 40-minute closed-book slot (do not read the answers first); the answers section is used while marking (15 min); weak-area guidance and the catch-up plan feed the catch-up slots.
- **Overflow carried into this Day 7:** Day 20 (Topic 6.2 -- API documentation with OpenAPI (Swagger); Topic 6.3 -- CORS; Topic 6.4 -- Request lifecycle debugging), ~23 min. Because the carry is 23 min the catch-up reading slot is 25 min and the catch-up coding slot is 10 min (the table above already reflects this).
- **Re-read only the Week 3 / Day 1-6 notes for topics you got wrong** (use each Day block reading plan to find the ESSENTIAL section and re-read that section, not the whole Day).

**Coding practice:** Redo (from a blank file) every exercise you got wrong this week, in these groups: EX-EXP, EX-MW. Project: Stage 1 and Stage 2 complete (in-memory CRUD, validation, central error handler, auth stub).

**Interview questions to revise:** The 10 questions you found hardest from this week's ID ranges (Q-EXP-01..30). Answer each aloud in under 90 seconds.

**Weekly test:** Week 3 assessment in `03_Week3_Express_REST.md` (mixed Basic/Intermediate/Advanced). Target: 70 percent or more. Below 70 percent -> follow the week's catch-up plan before starting next week's Day 1.

**Daily learning outcomes**

- I know my Week 3 score and my weakest 2-3 topics.
- I have repaired at least one weak topic by re-reading plus re-doing a task.
- Every unfinished item from Day 1-6 is either done or explicitly moved to section 5 triage.

**Completion checklist**

- [ ] Spaced revisit of Day 1-6 done
- [ ] Weekly assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Weak topics re-read
- [ ] Failed exercise redone from blank file
- [ ] Week 3 hours logged (target 14 h)

### 3.5 Week 4 -- MySQL and Database Fundamentals (Days 22-28)

- **Notes file:** `04_Week4_MySQL.md`
- **Week goal:** Write joins/aggregations confidently and explain indexes, transactions, isolation levels, deadlocks, pooling and EXPLAIN in interview language.
- **Never skip this week:** JOINs, GROUP BY/HAVING, indexes + composite index leftmost rule, ACID, isolation levels + anomalies, pooling, EXPLAIN basics, keyset vs offset pagination.
- **ADVANCED (skip first if behind):** Gap-lock details, MVCC internals depth, covering-index micro-optimizations, optimizer hints.


#### Week 4 / Day 1 (overall Day 22) -- Relational fundamentals, tables, keys, constraints, relationships, CRUD

**Tier:** ESSENTIAL

**Learning objectives**

- Model tables, primary/foreign keys, unique/not-null/check constraints and 1:1, 1:N, N:M relationships.
- Write CRUD SQL (MySQL 8) with correct data types.
- Explain ON DELETE behaviours.

**Topics:** Tables, rows, data types (INT, BIGINT, DECIMAL for money, VARCHAR, DATETIME, JSON); PK, FK, UNIQUE, NOT NULL, CHECK, defaults; Relationships and junction tables; INSERT/SELECT/UPDATE/DELETE, upsert.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 40 | Read the ESSENTIAL sections only (reading plan below): Relational model, tables, rows, data types; Keys and constraints; Relationships: 1:1, 1:N, M:N; CRUD in SQL | Reading |
| 45 | Coding practice: Create the Task API schema (users, tasks, projects, task_assignees) in MySQL 8; EX-SQL-01..03 (CRUD + constraint exercises) | Coding |
| 15 | Spaced revisit (Day 21, Day 19, Day 15 key concepts, cover and recall, 8 min) plus questions Q-SQL-01..06 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 431 of the 484 lines in the Day 1 block of `04_Week4_MySQL.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| T1.1 Relational model, tables, rows, data types | 262-342 | 80 | 721 | 7 | 5.5 |
| T1.2 Keys and constraints | 343-448 | 105 | 659 | 31 | 7.5 |
| T1.3 Relationships: 1:1, 1:N, M:N | 449-508 | 59 | 381 | 13 | 3.8 |
| T1.4 CRUD in SQL | 509-696 | 187 | 740 | 86 | 13.5 |
| **Total** | | **431** | **2501** | **137** | **30.4** |

- **Estimate:** 2501 prose words / 150 wpm + 137 code lines / 10 lines-per-min = 30 min, plus 4 x 2 min to say each Interview answer aloud = **38 min**. Read slot = 40 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** End of Day 1 (lines 697-733, 36 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 484 lines of this Day block would take about 34 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Create the Task API schema (users, tasks, projects, task_assignees) in MySQL 8; EX-SQL-01..03 (CRUD + constraint exercises).

**Interview questions to revise:** Q-SQL-01..06; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 21 (Week 3 weak areas); Day 19 (Pagination, filter, sort, versioning); Day 15 (HTTP basics).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain why money uses DECIMAL not FLOAT.
- I can design a many-to-many table.
- I can explain ON DELETE CASCADE vs RESTRICT.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~40 min) and said each Interview answer aloud (Week 4 / Day 1 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Create the Task API schema (users, tasks, projects, task_assignees) in MySQL 8
- [ ] Questions Q-SQL-01..06 answered aloud
- [ ] Spaced revisit done (Day 21, Day 19, Day 15)
- [ ] Project stage progressed: Stage 3
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 4 / Day 2 (overall Day 23) -- INNER/LEFT JOIN, GROUP BY/HAVING, subqueries

**Tier:** ESSENTIAL

**Learning objectives**

- Pick the right join and predict row counts including NULLs.
- Use GROUP BY with aggregates and HAVING vs WHERE correctly.
- Write correlated subqueries, EXISTS, IN and CTEs.

**Topics:** INNER vs LEFT (and RIGHT) JOIN; GROUP BY, COUNT/SUM/AVG, HAVING; Subqueries, EXISTS vs IN, CTEs; Common interview queries (Nth highest, duplicates, customers without orders).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): INNER JOIN and LEFT JOIN; GROUP BY, aggregates, HAVING; Subqueries, CTEs, window functions | Reading |
| 40 | Coding practice: EX-SQL-04..06 (revenue per customer including zero-revenue customers, GROUP BY ... HAVING, subquery/CTE), EX-SQL-07..08 (window functions, ADVANCED, optional); implement 'tasks per user with zero-task users included' for the Task API | Coding |
| 15 | Spaced revisit (Day 22, Day 20, Day 16 key concepts, cover and recall, 8 min) plus questions Q-SQL-07..13 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 474 of the 522 lines in the Day 2 block of `04_Week4_MySQL.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| T2.1 INNER JOIN and LEFT JOIN | 748-893 | 145 | 783 | 63 | 11.5 |
| T2.2 GROUP BY, aggregates, HAVING (mixed tag: concept only) | 894-1046 | 152 | 581 | 70 | 10.9 |
| T2.3 Subqueries, CTEs, window functions (mixed tag: concept only) | 1047-1224 | 177 | 738 | 87 | 13.6 |
| **Total** | | **474** | **2102** | **220** | **36.0** |

- **Estimate:** 2102 prose words / 150 wpm + 220 code lines / 10 lines-per-min = 36 min, plus 3 x 2 min to say each Interview answer aloud = **42 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "T2.2 GROUP BY, aggregates, HAVING" (lines 1002-1009).
- **Wrap-up section (used in the wrap-up slot):** End of Day 2 (lines 1225-1256, 31 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 522 lines of this Day block would take about 40 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-SQL-04..06 (revenue per customer including zero-revenue customers, GROUP BY ... HAVING, subquery/CTE), EX-SQL-07..08 (window functions, ADVANCED, optional); implement 'tasks per user with zero-task users included' for the Task API.

**Interview questions to revise:** Q-SQL-07..13; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 22 (Relational basics, CRUD); Day 20 (Uploads, OpenAPI, CORS); Day 16 (REST design, Express layers).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "T2.2 GROUP BY, aggregates, HAVING" (lines 1002-1009).

**Daily learning outcomes**

- I can explain LEFT JOIN plus WHERE filter pitfall.
- I can write Nth-highest and find-duplicates queries.
- I can explain WHERE vs HAVING.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 4 / Day 2 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-SQL-04..06 (revenue per customer including zero-revenue customers, GROUP BY
- [ ] Questions Q-SQL-07..13 answered aloud
- [ ] Spaced revisit done (Day 22, Day 20, Day 16)
- [ ] Project stage progressed: Stage 3
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 4 / Day 3 (overall Day 24) -- Normalization, indexes, composite indexes

**Tier:** ESSENTIAL

**Learning objectives**

- Explain 1NF-3NF with an example and when denormalizing is justified.
- Explain B-tree indexes, clustered vs secondary indexes in InnoDB and the leftmost-prefix rule.
- Choose indexes for a given query set.

**Topics:** 1NF, 2NF, 3NF, denormalization trade-offs; B-tree indexes, clustered PK in InnoDB; Composite index column order and leftmost prefix; Index costs: write overhead, space; low-cardinality columns.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Normalization; Indexes: B+Tree, clustered vs secondary; Composite indexes and the leftmost prefix rule | Reading |
| 35 | Coding practice: No EX-SQL exercise covers index design (the EX-SQL group ends at 08). Instead do the Day 3 practical task in the notes: add indexes to the Task API schema and justify each in a comment; check each one with EXPLAIN | Coding |
| 20 | Spaced revisit (Day 23, Day 21, Day 17 key concepts, cover and recall, 10 min) plus questions Q-SQL-14..20 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 489 of the 539 lines in the Day 3 block of `04_Week4_MySQL.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| T3.1 Normalization | 1271-1359 | 88 | 751 | 12 | 6.2 |
| T3.2 Indexes: B+Tree, clustered vs secondary | 1360-1555 | 195 | 1268 | 72 | 15.7 |
| T3.3 Composite indexes and the leftmost prefix rule | 1556-1762 | 206 | 1466 | 69 | 16.7 |
| **Total** | | **489** | **3485** | **153** | **38.5** |

- **Estimate:** 3485 prose words / 150 wpm + 153 code lines / 10 lines-per-min = 39 min, plus 3 x 2 min to say each Interview answer aloud = **45 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** End of Day 3 (lines 1763-1796, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 539 lines of this Day block would take about 42 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** No EX-SQL exercise covers index design (the EX-SQL group ends at 08). Instead do the Day 3 practical task in the notes: add indexes to the Task API schema and justify each in a comment; check each one with EXPLAIN.

**Interview questions to revise:** Q-SQL-14..20; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 23 (Joins, GROUP BY, subqueries); Day 21 (Week 3 weak areas); Day 17 (Middleware and validation).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain why (a,b) index helps WHERE a and WHERE a AND b but not WHERE b.
- I can explain why random UUID PKs hurt InnoDB inserts.
- I can justify one denormalization.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 4 / Day 3 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: No EX-SQL exercise covers index design (the EX-SQL group ends at 08)
- [ ] Questions Q-SQL-14..20 answered aloud
- [ ] Spaced revisit done (Day 23, Day 21, Day 17)
- [ ] Project stage progressed: Stage 3
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 4 / Day 4 (overall Day 25) -- Transactions, ACID, isolation levels, concurrency problems

**Tier:** ESSENTIAL

**Learning objectives**

- Explain each ACID property with a bank-transfer example.
- Define dirty read, non-repeatable read, phantom read and lost update.
- State which problems each isolation level prevents and InnoDB's default (REPEATABLE READ).

**Topics:** BEGIN/COMMIT/ROLLBACK, autocommit; ACID; Isolation levels and anomalies table; SELECT ... FOR UPDATE, optimistic locking with version column.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Transactions and ACID; Isolation levels and concurrency phenomena; Lost updates: atomic UPDATE, pessimistic and opt | Reading |
| 40 | Coding practice: Run two mysql sessions to reproduce non-repeatable read and a lost update; EX-TXN-01..03 (money transfer with FOR UPDATE, atomic stock reservation, place an order atomically) and EX-TXN-07 (fix the lost update three ways) | Coding |
| 15 | Spaced revisit (Day 24, Day 22, Day 18 key concepts, cover and recall, 8 min) plus questions Q-SQL-21..28 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 464 of the 526 lines in the Day 4 block of `04_Week4_MySQL.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| T4.1 Transactions and ACID | 1822-1971 | 149 | 1003 | 49 | 11.6 |
| T4.2 Isolation levels and concurrency phenomena | 1972-2155 | 183 | 1947 | 12 | 14.2 |
| T4.3 Lost updates: atomic UPDATE, pessimistic and optimistic locking | 2156-2288 | 132 | 1137 | 29 | 10.5 |
| **Total** | | **464** | **4087** | **90** | **36.2** |

- **Estimate:** 4087 prose words / 150 wpm + 90 code lines / 10 lines-per-min = 36 min, plus 3 x 2 min to say each Interview answer aloud = **42 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** End of Day 4 (lines 2289-2323, 34 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 526 lines of this Day block would take about 40 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Run two mysql sessions to reproduce non-repeatable read and a lost update; EX-TXN-01..03 (money transfer with FOR UPDATE, atomic stock reservation, place an order atomically) and EX-TXN-07 (fix the lost update three ways).

**Interview questions to revise:** Q-SQL-21..28; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 24 (Normalization, indexes); Day 22 (Relational basics, CRUD); Day 18 (Error handler, auth middleware).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain the transfer example with rollback.
- I can build the anomalies vs isolation level table from memory.
- I can explain optimistic vs pessimistic locking.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 4 / Day 4 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Run two mysql sessions to reproduce non-repeatable read and a lost update
- [ ] Questions Q-SQL-21..28 answered aloud
- [ ] Spaced revisit done (Day 24, Day 22, Day 18)
- [ ] Project stage progressed: Stage 3/5
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 4 / Day 5 (overall Day 26) -- Deadlocks, locking, connection pooling

**Tier:** ESSENTIAL

**Learning objectives**

- Explain row locks vs table locks, and how a deadlock arises and is resolved.
- Reduce deadlocks (consistent lock ordering, short transactions, retry).
- Explain connection pooling and sizing (and why pools protect the DB).

**Topics:** Shared/exclusive locks, InnoDB row locks; Deadlock reproduction, SHOW ENGINE INNODB STATUS, retry on error 1213; Connection pool: why, sizing, max_connections; Pool exhaustion symptoms.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Locking in InnoDB; Deadlocks; Connection pooling | Reading |
| 35 | Coding practice: Reproduce a two-transaction deadlock; EX-TXN-04 (withTransaction helper with deadlock retry), EX-TXN-05 (ADVANCED optimistic locking, optional); EX-DEBUG-05 (whole API freezes after a few failed transfers: connection-pool exhaustion) | Coding |
| 20 | Spaced revisit (Day 25, Day 23, Day 19 key concepts, cover and recall, 10 min) plus questions Q-SQL-28..34 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 489 of the 541 lines in the Day 5 block of `04_Week4_MySQL.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| T5.1 Locking in InnoDB (mixed tag: concept only) | 2339-2479 | 140 | 1454 | 10 | 10.7 |
| T5.2 Deadlocks (mixed tag: concept only) | 2480-2644 | 164 | 1120 | 48 | 12.3 |
| T5.3 Connection pooling (mixed tag: concept only) | 2645-2830 | 185 | 1092 | 73 | 14.6 |
| **Total** | | **489** | **3666** | **131** | **37.5** |

- **Estimate:** 3666 prose words / 150 wpm + 131 code lines / 10 lines-per-min = 38 min, plus 3 x 2 min to say each Interview answer aloud = **44 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "T5.2 Deadlocks" (lines 2553-2564); the [ADVANCED] sub-block inside "T5.3 Connection pooling" (lines 2784-2787).
- **Wrap-up section (used in the wrap-up slot):** End of Day 5 (lines 2831-2865, 34 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 541 lines of this Day block would take about 42 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Reproduce a two-transaction deadlock; EX-TXN-04 (withTransaction helper with deadlock retry), EX-TXN-05 (ADVANCED optimistic locking, optional); EX-DEBUG-05 (whole API freezes after a few failed transfers: connection-pool exhaustion).

**Interview questions to revise:** Q-SQL-28..34; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 25 (Transactions, ACID, isolation); Day 23 (Joins, GROUP BY, subqueries); Day 19 (Pagination, filter, sort, versioning).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "T5.2 Deadlocks" (lines 2553-2564); the [ADVANCED] sub-block inside "T5.3 Connection pooling" (lines 2784-2787).

**Daily learning outcomes**

- I can describe a deadlock with two accounts and the fix.
- I can explain why 1000 connections per instance is a bad idea.
- I can explain pool exhaustion from a leaked connection.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 4 / Day 5 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Reproduce a two-transaction deadlock
- [ ] Questions Q-SQL-28..34 answered aloud
- [ ] Spaced revisit done (Day 25, Day 23, Day 19)
- [ ] Project stage progressed: Stage 3
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 4 / Day 6 (overall Day 27) -- EXPLAIN, execution plans, query optimization, pagination and DB performance

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Read EXPLAIN output (type, key, rows, Extra) and spot full scans and filesort.
- Apply the standard optimization checklist.
- Implement keyset pagination and explain why OFFSET degrades.

**Topics:** EXPLAIN and EXPLAIN ANALYZE (MySQL 8.0.18+); Sargable predicates, functions on indexed columns, SELECT *; N+1 query problem; Offset vs keyset pagination at the SQL level, slow query log.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): EXPLAIN and execution plans; Query optimization patterns; Pagination and database performance | Reading |
| 35 | Read-along of the overflow section(s) (~5 min, typing their examples) then coding practice: Read EXPLAIN output for 3 queries on the practice schema, rewrite one slow query and implement keyset pagination (the practical tasks in the Day 6 notes); EX-DEBUG-04 (the N+1 query); run EXPLAIN on the Task API list query before and after an index | Coding |
| 15 | Spaced revisit (Day 26, Day 24, Day 20 key concepts, cover and recall, 8 min) plus questions Q-SQL-26..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 630 of the 690 lines in the Day 6 block of `04_Week4_MySQL.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| T6.1 EXPLAIN and execution plans | 2890-3113 | 223 | 1622 | 58 | 16.6 |
| T6.2 Query optimization patterns | 3114-3276 | 162 | 1013 | 57 | 12.5 |
| T6.3 Pagination and database performance | 3277-3522 | 245 | 1418 | 105 | 20.0 |
| **Total** | | **630** | **4053** | **220** | **49.0** |

- **Estimate:** 4053 prose words / 150 wpm + 220 code lines / 10 lines-per-min = 49 min, plus 3 x 2 min to say each Interview answer aloud = **55 min**. Read slot = 50 min.
- **Overflow (~5 min):** does not fit the 50-minute read slot, so these last section(s) spill over: T6.3 Pagination and database performance. About 5 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** End of Day 6 (lines 3523-3556, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 690 lines of this Day block would take about 53 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Read EXPLAIN output for 3 queries on the practice schema, rewrite one slow query and implement keyset pagination (the practical tasks in the Day 6 notes); EX-DEBUG-04 (the N+1 query); run EXPLAIN on the Task API list query before and after an index.

**Interview questions to revise:** Q-SQL-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 26 (Deadlocks, locks, pooling); Day 24 (Normalization, indexes); Day 20 (Uploads, OpenAPI, CORS).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can read type=ALL vs ref vs range.
- I can rewrite a non-sargable predicate.
- I can implement keyset pagination SQL.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 4 / Day 6 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Read EXPLAIN output for 3 queries on the practice schema, rewrite one slow query and implement
- [ ] Questions Q-SQL-26..30 answered aloud
- [ ] Spaced revisit done (Day 26, Day 24, Day 20)
- [ ] Project stage progressed: Stage 3 finish, Stage 5 preview
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 4 / Day 7 (overall Day 28) -- Revision, weekly test, catch-up

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Prove (to yourself) what you actually retained from Week 4 by taking the weekly assessment closed-book.
- Identify the 2-3 weakest topics and repair them; absorb any unfinished day.
- Consolidate the week's key concepts into a one-page summary you can re-read in 10 minutes.

**Topics:** All of Week 4 -- Relational basics, CRUD; Joins, GROUP BY, subqueries; Normalization, indexes; Transactions, ACID, isolation; Deadlocks, locks, pooling; EXPLAIN, optimization, pagination

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus read the Week 4 revision summary | Revision and questions |
| 40 | Weekly assessment (Week 4 file), closed book, timed, answer in writing or aloud | Revision and questions |
| 15 | Mark using the answer key; list weak areas using the weak-area guidance | Wrap-up and tests |
| 20 | Catch-up reading: re-read Week 4 notes for the weak areas only (unfinished days first) | Reading |
| 15 | Catch-up coding: redo the failed exercise or advance the project (Stage 3 schema, indexes and queries complete) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |

**Reading plan (Day 7 revision day: second-pass speed = about 2x the first-pass speed, so each section costs about half its first-read estimate)**

| File | Section | Lines | Line count | Est. min (second pass) |
|------|---------|-------|------------|------------------------|
| 04_Week4_MySQL.md | Week 4 revision summary | 3833-3865 | 33 | 1.0 |
| 04_Week4_MySQL.md | Week 4 mixed-difficulty assessment | 3866-3944 | 79 | 3.1 |
| 04_Week4_MySQL.md | Answers with explanations | 3945-4099 | 155 | 6.3 |
| 04_Week4_MySQL.md | Weak-area identification guidance | 4100-4128 | 29 | 1.2 |
| 04_Week4_MySQL.md | Catch-up plan if you fall behind | 4129-4160 | 32 | 1.1 |

- **Where each slot uses them:** the revision summary belongs to the 25-minute spaced-revisit slot (about 1 min of reading, the rest is cover-and-recall); the assessment is the 40-minute closed-book slot (do not read the answers first); the answers section is used while marking (15 min); weak-area guidance and the catch-up plan feed the catch-up slots.
- **Overflow carried into this Day 7:** none this week; use the catch-up reading slot for weak areas and any unfinished day.
- **Re-read only the Week 4 / Day 1-6 notes for topics you got wrong** (use each Day block reading plan to find the ESSENTIAL section and re-read that section, not the whole Day).

**Coding practice:** Redo (from a blank file) every exercise you got wrong this week, in these groups: EX-SQL, EX-TXN, EX-DEBUG. Project: Stage 3 schema, indexes and queries complete.

**Interview questions to revise:** The 10 questions you found hardest from this week's ID ranges (Q-SQL-01..34). Answer each aloud in under 90 seconds.

**Weekly test:** Week 4 assessment in `04_Week4_MySQL.md` (mixed Basic/Intermediate/Advanced). Target: 70 percent or more. Below 70 percent -> follow the week's catch-up plan before starting next week's Day 1.

**Daily learning outcomes**

- I know my Week 4 score and my weakest 2-3 topics.
- I have repaired at least one weak topic by re-reading plus re-doing a task.
- Every unfinished item from Day 1-6 is either done or explicitly moved to section 5 triage.

**Completion checklist**

- [ ] Spaced revisit of Day 1-6 done
- [ ] Weekly assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Weak topics re-read
- [ ] Failed exercise redone from blank file
- [ ] Week 4 hours logged (target 14 h)

### 3.6 Week 5 -- Data Access, MongoDB, Authentication and Security (Days 29-35)

- **Notes file:** `05_Week5_Data_Auth_Security.md`
- **Week goal:** Connect Node to MySQL safely, understand MongoDB trade-offs, and implement + explain signup/login, bcrypt, JWT, refresh tokens, RBAC and the OWASP basics.
- **Never skip this week:** Parameterized queries, transactions in code, bcrypt, JWT verification, access vs refresh tokens, authn vs authz, SQL injection, XSS, CSRF, CORS, rate limiting.
- **ADVANCED (skip first if behind):** MongoDB aggregation beyond $match/$group/$lookup, CSRF token variants, ORM internals.


#### Week 5 / Day 1 (overall Day 29) -- Node.js to MySQL (mysql2), pooling, transactions in code, ORM vs raw SQL

**Tier:** ESSENTIAL

**Learning objectives**

- Use mysql2/promise with a pool and parameterized queries (never string concatenation).
- Write a transaction helper that always releases the connection.
- Argue ORM vs query builder vs raw SQL trade-offs.

**Topics:** mysql2/promise createPool, execute vs query; Parameterized queries and why they stop SQL injection; Transaction pattern: getConnection, beginTransaction, commit/rollback, finally release; Repository layer, ORM (Prisma/Sequelize/TypeORM) vs raw SQL.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Why a connection pool; query() vs execute() and placeholders; Transactions in Node code; ORM vs query builder vs raw SQL | Reading |
| 40 | Coding practice: EX-TXN-07 redone in mysql2 (withTransaction + atomic UPDATE), EX-TXN-06 (ADVANCED transactional outbox, optional); Stage 3: implement the task repository with mysql2 | Coding |
| 15 | Spaced revisit (Day 28, Day 26, Day 22 key concepts, cover and recall, 8 min) plus questions Q-SQL-31..34 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 422 of the 494 lines in the Day 1 block of `05_Week5_Data_Auth_Security.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 1.1 Why a connection pool | 277-364 | 87 | 763 | 28 | 7.9 |
| 1.2 query() vs execute() and placeholders | 365-468 | 103 | 661 | 42 | 8.6 |
| 1.3 Transactions in Node code | 469-616 | 147 | 812 | 77 | 13.1 |
| 1.4 ORM vs query builder vs raw SQL | 617-702 | 85 | 644 | 23 | 6.6 |
| **Total** | | **422** | **2880** | **170** | **36.2** |

- **Estimate:** 2880 prose words / 150 wpm + 170 code lines / 10 lines-per-min = 36 min, plus 4 x 2 min to say each Interview answer aloud = **44 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skim only (headings and one-line takeaways, no code):** 1.5 Route example: put it together (703-727).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 1 wrap-up (lines 728-759, 31 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 494 lines of this Day block would take about 41 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-TXN-07 redone in mysql2 (withTransaction + atomic UPDATE), EX-TXN-06 (ADVANCED transactional outbox, optional); Stage 3: implement the task repository with mysql2.

**Interview questions to revise:** Q-SQL-31..34; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 28 (Week 4 weak areas); Day 26 (Deadlocks, locks, pooling); Day 22 (Relational basics, CRUD).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can write withTransaction(fn) from memory.
- I can explain why placeholders are safe.
- I can give 3 pros and 3 cons of an ORM.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 5 / Day 1 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-TXN-07 redone in mysql2 (withTransaction + atomic UPDATE), EX-TXN-06 (ADVANCED transactional
- [ ] Questions Q-SQL-31..34 answered aloud
- [ ] Spaced revisit done (Day 28, Day 26, Day 22)
- [ ] Project stage progressed: Stage 3
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 5 / Day 2 (overall Day 30) -- MongoDB documents, collections, indexes, aggregation, SQL vs NoSQL

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Model data as documents (embed vs reference) and run CRUD with the official driver.
- Explain MongoDB indexes and write a basic aggregation pipeline ($match, $group, $lookup, $sort).
- Compare SQL vs NoSQL without slogans.

**Topics:** Documents, collections, BSON, _id; Embedding vs referencing; Indexes and explain(); Aggregation pipeline fundamentals; SQL vs NoSQL decision criteria, transactions in MongoDB (replica set required).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Documents, collections and the official driver; Embed vs reference (data modelling); Indexes in MongoDB; Aggregation pipeline; NoSQL injection; SQL vs NoSQL: how to answer honestly | Reading |
| 35 | Read-along of the overflow section(s) (~9 min, typing their examples) then coding practice: Insert/query a small orders collection; aggregate revenue per customer; add an index and compare explain; no project stage today (MySQL stays primary) | Coding |
| 15 | Spaced revisit (Day 29, Day 27, Day 23 key concepts, cover and recall, 8 min) plus questions Q-MONGO-01..10 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 602 of the 678 lines in the Day 2 block of `05_Week5_Data_Auth_Security.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 2.1 Documents, collections and the official driver | 774-958 | 184 | 630 | 108 | 15.0 |
| 2.2 Embed vs reference (data modelling) | 959-998 | 39 | 381 | 0 | 2.5 |
| 2.3 Indexes in MongoDB | 999-1085 | 86 | 522 | 26 | 6.1 |
| 2.4 Aggregation pipeline | 1086-1268 | 182 | 655 | 108 | 15.2 |
| 2.6 NoSQL injection | 1293-1364 | 71 | 297 | 31 | 5.1 |
| 2.7 SQL vs NoSQL: how to answer honestly | 1365-1405 | 40 | 435 | 0 | 2.9 |
| **Total** | | **602** | **2920** | **273** | **46.8** |

- **Estimate:** 2920 prose words / 150 wpm + 273 code lines / 10 lines-per-min = 47 min, plus 6 x 2 min to say each Interview answer aloud = **59 min**. Read slot = 50 min.
- **Overflow (~9 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 2.6 NoSQL injection; 2.7 SQL vs NoSQL: how to answer honestly. About 9 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** 2.5 Transactions in MongoDB (lines 1269-1292, 23 lines).
- **Wrap-up section (used in the wrap-up slot):** Day 2 wrap-up (lines 1406-1438, 32 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 678 lines of this Day block would take about 52 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Insert/query a small orders collection; aggregate revenue per customer; add an index and compare explain; no project stage today (MySQL stays primary).

**Interview questions to revise:** Q-MONGO-01..10; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 29 (mysql2, pool, txn in code, ORM); Day 27 (EXPLAIN, optimization, pagination); Day 23 (Joins, GROUP BY, subqueries).

**ADVANCED (skip first if behind):** 2.5 Transactions in MongoDB (lines 1269-1292, 23 lines).

**Daily learning outcomes**

- I can explain embed vs reference with an e-commerce example.
- I can write a $group pipeline.
- I can state when I would NOT choose MongoDB.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 5 / Day 2 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Insert/query a small orders collection
- [ ] Questions Q-MONGO-01..10 answered aloud
- [ ] Spaced revisit done (Day 29, Day 27, Day 23)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 5 / Day 3 (overall Day 31) -- Signup/login APIs, bcrypt, JWT structure and verification

**Tier:** ESSENTIAL

**Learning objectives**

- Implement signup and login securely (validation, bcrypt hash, generic error messages).
- Explain JWT structure (header.payload.signature) and what verification actually checks.
- Avoid the common JWT mistakes (alg none, secrets in code, sensitive data in payload).

**Topics:** Why hash (not encrypt) passwords; bcrypt cost factor and salt; Signup/login flow and user enumeration; JWT anatomy, signing algorithms (HS256 vs RS256), exp/iat/sub; Verification middleware.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Password hashing with bcrypt; Signup and login APIs; JWT structure and verification | Reading |
| 40 | Coding practice: EX-JWT-01..03 (decode a JWT by hand, HS256 sign/verify from scratch, signup + login + auth middleware); Stage 4: users table, POST /auth/signup and /auth/login | Coding |
| 15 | Spaced revisit (Day 30, Day 28, Day 24 key concepts, cover and recall, 8 min) plus questions Q-SEC-01..06 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 432 of the 477 lines in the Day 3 block of `05_Week5_Data_Auth_Security.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 3.1 Password hashing with bcrypt | 1451-1546 | 95 | 1028 | 24 | 9.3 |
| 3.2 Signup and login APIs | 1547-1676 | 129 | 800 | 57 | 11.0 |
| 3.3 JWT structure and verification | 1677-1885 | 208 | 1026 | 98 | 16.6 |
| **Total** | | **432** | **2854** | **179** | **36.9** |

- **Estimate:** 2854 prose words / 150 wpm + 179 code lines / 10 lines-per-min = 37 min, plus 3 x 2 min to say each Interview answer aloud = **43 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 3 wrap-up (lines 1886-1916, 30 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 477 lines of this Day block would take about 40 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-JWT-01..03 (decode a JWT by hand, HS256 sign/verify from scratch, signup + login + auth middleware); Stage 4: users table, POST /auth/signup and /auth/login.

**Interview questions to revise:** Q-SEC-01..06; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 30 (MongoDB, SQL vs NoSQL); Day 28 (Week 4 weak areas); Day 24 (Normalization, indexes).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain what bcrypt's cost factor controls.
- I can decode a JWT by hand and say what is not secret.
- I can explain why login errors must be generic.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 5 / Day 3 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-JWT-01..03 (decode a JWT by hand, HS256 sign/verify from scratch, signup + login + auth midd
- [ ] Questions Q-SEC-01..06 answered aloud
- [ ] Spaced revisit done (Day 30, Day 28, Day 24)
- [ ] Project stage progressed: Stage 4
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 5 / Day 4 (overall Day 32) -- Access/refresh tokens, sessions vs JWT, authn vs authz, RBAC

**Tier:** ESSENTIAL

**Learning objectives**

- Design short-lived access tokens plus rotating refresh tokens and explain revocation.
- Compare sessions vs JWT honestly (statefulness, revocation, scaling).
- Implement role-based access control and resource ownership checks.

**Topics:** Access vs refresh tokens, storage (httpOnly cookie vs memory), rotation; Sessions vs JWT trade-offs; Authentication vs authorization; RBAC middleware, ownership checks (IDOR prevention).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Sessions vs JWT; Access tokens and refresh tokens; Authentication vs authorization, and RBAC | Reading |
| 35 | Coding practice: EX-JWT-04 (ADVANCED refresh-token rotation with reuse detection; do the basic refresh flow first) and EX-JWT-05 (RBAC and ownership checks); Stage 4: refresh endpoint, requireRole('admin'), task ownership | Coding |
| 15 | Spaced revisit (Day 31, Day 29, Day 25 key concepts, cover and recall, 8 min) plus questions Q-SEC-07..14 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 508 of the 554 lines in the Day 4 block of `05_Week5_Data_Auth_Security.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 4.1 Sessions vs JWT | 1929-1992 | 63 | 729 | 4 | 5.3 |
| 4.2 Access tokens and refresh tokens | 1993-2252 | 259 | 1156 | 152 | 22.9 |
| 4.3 Authentication vs authorization, and RBAC | 2253-2439 | 186 | 881 | 94 | 15.3 |
| **Total** | | **508** | **2766** | **250** | **43.4** |

- **Estimate:** 2766 prose words / 150 wpm + 250 code lines / 10 lines-per-min = 43 min, plus 3 x 2 min to say each Interview answer aloud = **49 min**. Read slot = 50 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 4 wrap-up (lines 2440-2471, 31 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 554 lines of this Day block would take about 46 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-JWT-04 (ADVANCED refresh-token rotation with reuse detection; do the basic refresh flow first) and EX-JWT-05 (RBAC and ownership checks); Stage 4: refresh endpoint, requireRole('admin'), task ownership.

**Interview questions to revise:** Q-SEC-07..14; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 31 (Signup/login, bcrypt, JWT); Day 29 (mysql2, pool, txn in code, ORM); Day 25 (Transactions, ACID, isolation).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain how to log a user out with JWTs.
- I can explain IDOR with an example.
- I can place the authz check in the right layer.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 5 / Day 4 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-JWT-04 (ADVANCED refresh-token rotation with reuse detection
- [ ] Questions Q-SEC-07..14 answered aloud
- [ ] Spaced revisit done (Day 31, Day 29, Day 25)
- [ ] Project stage progressed: Stage 4
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 5 / Day 5 (overall Day 33) -- SQL injection, XSS, CSRF, CORS, rate limiting

**Tier:** ESSENTIAL

**Learning objectives**

- Demonstrate SQL injection on a vulnerable query and fix it with placeholders.
- Explain XSS (stored/reflected/DOM), CSRF and their mitigations (escaping, CSP, SameSite, CSRF tokens).
- Apply rate limiting and security headers (helmet) in Express.

**Topics:** SQL injection and parameterization; XSS and output encoding, CSP; CSRF and SameSite cookies; why bearer-header APIs differ; CORS misconfiguration (wildcard with credentials); Rate limiting basics, helmet.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): SQL injection; XSS (Cross-Site Scripting); CSRF (Cross-Site Request Forgery); CORS; Rate limiting; helmet and basic hardening | Reading |
| 30 | Read-along of the overflow section(s) (~13 min, typing their examples) then coding practice: Fix the injection snippets in the Day 5 notes (there is no EX-SQL injection exercise), EX-RATE-01..02 (fixed-window and sliding-window limiters); Stage 6 preview: add helmet, cors allowlist and express-rate-limit on /auth | Coding |
| 20 | Spaced revisit (Day 32, Day 30, Day 26 key concepts, cover and recall, 10 min) plus questions Q-SEC-15..22 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 646 of the 712 lines in the Day 5 block of `05_Week5_Data_Auth_Security.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 5.1 SQL injection | 2486-2630 | 144 | 783 | 56 | 10.8 |
| 5.2 XSS (Cross-Site Scripting) | 2631-2739 | 108 | 882 | 33 | 9.2 |
| 5.3 CSRF (Cross-Site Request Forgery) | 2740-2863 | 123 | 902 | 42 | 10.2 |
| 5.4 CORS | 2864-2948 | 84 | 709 | 21 | 6.8 |
| 5.5 Rate limiting | 2949-3087 | 138 | 832 | 60 | 11.5 |
| 5.6 helmet and basic hardening | 3088-3137 | 49 | 313 | 8 | 2.9 |
| **Total** | | **646** | **4421** | **220** | **51.5** |

- **Estimate:** 4421 prose words / 150 wpm + 220 code lines / 10 lines-per-min = 51 min, plus 6 x 2 min to say each Interview answer aloud = **63 min**. Read slot = 50 min.
- **Overflow (~13 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 5.5 Rate limiting; 5.6 helmet and basic hardening. About 13 min is absorbed into the coding slot (you type those examples anyway).
- **Skim only (headings and one-line takeaways, no code):** 5.7 Attack and defence summary (3138-3150).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 5 wrap-up (lines 3151-3184, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 712 lines of this Day block would take about 56 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Fix the injection snippets in the Day 5 notes (there is no EX-SQL injection exercise), EX-RATE-01..02 (fixed-window and sliding-window limiters); Stage 6 preview: add helmet, cors allowlist and express-rate-limit on /auth.

**Interview questions to revise:** Q-SEC-15..22; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 32 (Refresh tokens, sessions, RBAC); Day 30 (MongoDB, SQL vs NoSQL); Day 26 (Deadlocks, locks, pooling).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain an injection payload and why placeholders defeat it.
- I can explain CSRF vs XSS in one line each.
- I can configure CORS safely.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 5 / Day 5 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Fix the injection snippets in the Day 5 notes (there is no EX-SQL injection exercise), EX-RATE-
- [ ] Questions Q-SEC-15..22 answered aloud
- [ ] Spaced revisit done (Day 32, Day 30, Day 26)
- [ ] Project stage progressed: Stage 6
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 5 / Day 6 (overall Day 34) -- Secure config, secrets management, common production security mistakes

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Manage configuration and secrets safely (env vars, secret managers, never in git).
- Recognize the top production security mistakes and how to audit for them.
- Build a pre-release security checklist for an API.

**Topics:** Config validation at startup, separate env files; Secrets managers and rotation; Dependency audit (npm audit), least-privilege DB user; Logging without leaking secrets/PII, error messages that do not leak internals; HTTPS/TLS termination, secure cookies.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Environment-based configuration; Secrets management; Common production security mistakes (review chec; Putting it together: the hardened app | Reading |
| 40 | Coding practice: Add a zod-validated config loader to the Task API; audit the project against the checklist (use EX-JWT-06, audit and fix an insecure auth module, as the practice audit); Stage 5: start pagination/filter/sort on MySQL using whitelisted sort fields; review the vulnerable snippet in the Day 6 notes and fix it | Coding |
| 15 | Spaced revisit (Day 33, Day 31, Day 27 key concepts, cover and recall, 8 min) plus questions Q-SEC-23..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 463 of the 510 lines in the Day 6 block of `05_Week5_Data_Auth_Security.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 6.1 Environment-based configuration | 3197-3326 | 129 | 649 | 63 | 10.6 |
| 6.2 Secrets management (mixed tag: concept only) | 3327-3470 | 143 | 924 | 9 | 7.1 |
| 6.3 Common production security mistakes (review checklist) | 3471-3589 | 118 | 1151 | 38 | 11.5 |
| 6.4 Putting it together: the hardened app | 3590-3663 | 73 | 42 | 56 | 5.9 |
| **Total** | | **463** | **2766** | **166** | **35.0** |

- **Estimate:** 2766 prose words / 150 wpm + 166 code lines / 10 lines-per-min = 35 min, plus 4 x 2 min to say each Interview answer aloud = **43 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "6.2 Secrets management" (lines 3357-3377); the [ADVANCED] sub-block inside "6.2 Secrets management" (lines 3378-3418).
- **Wrap-up section (used in the wrap-up slot):** Day 6 wrap-up (lines 3664-3695, 31 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 510 lines of this Day block would take about 43 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Add a zod-validated config loader to the Task API; audit the project against the checklist (use EX-JWT-06, audit and fix an insecure auth module, as the practice audit); Stage 5: start pagination/filter/sort on MySQL using whitelisted sort fields; review the vulnerable snippet in the Day 6 notes and fix it.

**Interview questions to revise:** Q-SEC-23..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 33 (SQLi, XSS, CSRF, CORS, rate limit); Day 31 (Signup/login, bcrypt, JWT); Day 27 (EXPLAIN, optimization, pagination).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "6.2 Secrets management" (lines 3357-3377); the [ADVANCED] sub-block inside "6.2 Secrets management" (lines 3378-3418).

**Daily learning outcomes**

- I can list 8 production security mistakes.
- I can explain why .env must not be committed.
- I can explain least privilege for the DB user.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 5 / Day 6 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Add a zod-validated config loader to the Task API
- [ ] Questions Q-SEC-23..30 answered aloud
- [ ] Spaced revisit done (Day 33, Day 31, Day 27)
- [ ] Project stage progressed: Stage 5
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 5 / Day 7 (overall Day 35) -- Revision, weekly test, catch-up

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Prove (to yourself) what you actually retained from Week 5 by taking the weekly assessment closed-book.
- Identify the 2-3 weakest topics and repair them; absorb any unfinished day.
- Consolidate the week's key concepts into a one-page summary you can re-read in 10 minutes.

**Topics:** All of Week 5 -- mysql2, pool, txn in code, ORM; MongoDB, SQL vs NoSQL; Signup/login, bcrypt, JWT; Refresh tokens, sessions, RBAC; SQLi, XSS, CSRF, CORS, rate limit; Secrets, secure config, mistakes

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus read the Week 5 revision summary | Revision and questions |
| 40 | Weekly assessment (Week 5 file), closed book, timed, answer in writing or aloud | Revision and questions |
| 15 | Mark using the answer key; list weak areas using the weak-area guidance | Wrap-up and tests |
| 20 | Catch-up reading: re-read Week 5 notes for the weak areas only (unfinished days first) | Reading |
| 15 | Catch-up coding: redo the failed exercise or advance the project (Stage 3 data layer and Stage 4 (auth + RBAC) complete; Stage 5 started) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |

**Reading plan (Day 7 revision day: second-pass speed = about 2x the first-pass speed, so each section costs about half its first-read estimate)**

| File | Section | Lines | Line count | Est. min (second pass) |
|------|---------|-------|------------|------------------------|
| 05_Week5_Data_Auth_Security.md | Week 5 revision summary | 3852-3902 | 51 | 1.5 |
| 05_Week5_Data_Auth_Security.md | 7.5 Take the weekly assessment | 3815-3818 | 4 | 0.1 |
| 05_Week5_Data_Auth_Security.md | Answers with explanations | 3964-4050 | 87 | 6.9 |
| 05_Week5_Data_Auth_Security.md | Weak-area identification guidance | 4051-4084 | 34 | 1.3 |
| 05_Week5_Data_Auth_Security.md | Catch-up plan if you fell behind | 4085-4122 | 38 | 1.3 |

- **Where each slot uses them:** the revision summary belongs to the 25-minute spaced-revisit slot (about 1 min of reading, the rest is cover-and-recall); the assessment is the 40-minute closed-book slot (do not read the answers first); the answers section is used while marking (15 min); weak-area guidance and the catch-up plan feed the catch-up slots.
- **Overflow carried into this Day 7:** none this week; use the catch-up reading slot for weak areas and any unfinished day.
- **Re-read only the Week 5 / Day 1-6 notes for topics you got wrong** (use each Day block reading plan to find the ESSENTIAL section and re-read that section, not the whole Day).

**Coding practice:** Redo (from a blank file) every exercise you got wrong this week, in these groups: EX-TXN, EX-JWT, EX-SQL, EX-RATE. Project: Stage 3 data layer and Stage 4 (auth + RBAC) complete; Stage 5 started.

**Interview questions to revise:** The 10 questions you found hardest from this week's ID ranges (Q-SQL-31..34, Q-MONGO-01..10, Q-SEC-01..30). Answer each aloud in under 90 seconds.

**Weekly test:** Week 5 assessment in `05_Week5_Data_Auth_Security.md` (mixed Basic/Intermediate/Advanced). Target: 70 percent or more. Below 70 percent -> follow the week's catch-up plan before starting next week's Day 1.

**Daily learning outcomes**

- I know my Week 5 score and my weakest 2-3 topics.
- I have repaired at least one weak topic by re-reading plus re-doing a task.
- Every unfinished item from Day 1-6 is either done or explicitly moved to section 5 triage.

**Completion checklist**

- [ ] Spaced revisit of Day 1-6 done
- [ ] Weekly assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Weak topics re-read
- [ ] Failed exercise redone from blank file
- [ ] Week 5 hours logged (target 14 h)

### 3.7 Week 6 -- Testing and Production Engineering (Days 36-42)

- **Notes file:** `06_Week6_Testing_Production.md`
- **Week goal:** Test an API properly, add structured logging, make requests safe to retry, cache with Redis, run background jobs, shut down gracefully and diagnose slow APIs.
- **Never skip this week:** Unit vs integration tests + mocking, structured logs + correlation IDs, timeouts/retries/backoff, idempotency keys, cache-aside + invalidation, graceful shutdown.
- **ADVANCED (skip first if behind):** Advanced queue features (priorities, rate-limited workers), flame-graph reading, distributed tracing.


#### Week 6 / Day 1 (overall Day 36) -- Unit vs integration tests, Jest/Vitest, Supertest, mocking, negative tests

**Tier:** ESSENTIAL

**Learning objectives**

- Explain the testing pyramid and what to unit vs integration test in a backend.
- Write Vitest/Jest tests with mocks plus Supertest API tests.
- Write negative tests (invalid input, 401/403, not found, duplicate).

**Topics:** Unit vs integration vs e2e; Vitest/Jest basics (describe/it/expect, mocks, spies); Supertest against the Express app (app separated from listen); Test database strategy, negative testing, AAA pattern.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Why test, and the test pyramid; What must be tested in a backend (priority list); Vitest basics; Mocking external dependencies; Supertest: integration testing the Express API; Negative testing and test ... | Reading |
| 35 | Read-along of the overflow section(s) (~20 min, typing their examples) then coding practice: EX-TEST-01..04 (service unit tests with mocked repo, Supertest for CRUD + auth failures); Stage 6: test suite for tasks and auth | Coding |
| 15 | Spaced revisit (Day 35, Day 33, Day 29 key concepts, cover and recall, 8 min) plus questions Q-TEST-01..08 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 929 of the 989 lines in the Day 1 block of `06_Week6_Testing_Production.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 1.1 Why test, and the test pyramid | 137-211 | 74 | 585 | 9 | 4.8 |
| 1.2 What must be tested in a backend (priority list) | 212-230 | 18 | 179 | 0 | 1.2 |
| 1.3 Vitest basics | 231-368 | 137 | 560 | 49 | 8.6 |
| 1.4 Mocking external dependencies | 369-654 | 285 | 614 | 168 | 20.9 |
| 1.5 Supertest: integration testing the Express API | 655-1010 | 355 | 663 | 233 | 27.7 |
| 1.6 Negative testing and test design | 1011-1071 | 60 | 479 | 0 | 3.2 |
| **Total** | | **929** | **3080** | **459** | **66.4** |

- **Estimate:** 3080 prose words / 150 wpm + 459 code lines / 10 lines-per-min = 66 min, plus 6 x 2 min to say each Interview answer aloud = **78 min**. Read slot = 50 min.
- **Overflow (~28 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 1.5 Supertest: integration testing the Express API; 1.6 Negative testing and test design. About 20 min is absorbed into the coding slot (you type those examples anyway). The remaining ~8 min is carried to the Day 7 catch-up reading of this week.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 1 wrap-up (lines 1072-1111, 39 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 989 lines of this Day block would take about 69 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-TEST-01..04 (service unit tests with mocked repo, Supertest for CRUD + auth failures); Stage 6: test suite for tasks and auth.

**Interview questions to revise:** Q-TEST-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 35 (Week 5 weak areas); Day 33 (SQLi, XSS, CSRF, CORS, rate limit); Day 29 (mysql2, pool, txn in code, ORM).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can say what I would not mock.
- I can write a Supertest case with a bearer token.
- I can list five negative cases for POST /tasks.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 6 / Day 1 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-TEST-01..04 (service unit tests with mocked repo, Supertest for CRUD + auth failures)
- [ ] Questions Q-TEST-01..08 answered aloud
- [ ] Spaced revisit done (Day 35, Day 33, Day 29)
- [ ] Project stage progressed: Stage 6
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 6 / Day 2 (overall Day 37) -- Logging, structured errors, correlation IDs

**Tier:** ESSENTIAL

**Learning objectives**

- Use structured JSON logging (pino) with levels and redaction.
- Propagate a correlation/request ID with AsyncLocalStorage.
- Design error responses and logs that help diagnose without leaking data.

**Topics:** Structured vs plain-text logs, log levels; Request IDs and AsyncLocalStorage; Error logging vs error responses; What never to log (passwords, tokens, PII).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Why structured logging, levels, what to log; pino: setup, redaction, child loggers; Structured error handling: operational vs progra; Request correlation IDs with AsyncLocalStorage ( | Reading |
| 30 | Coding practice: Add pino plus request-id middleware to Task API, include the id in error responses; test that the id appears in logs; EX-TEST-06 (table-driven test of the error-handling contract) and EX-DEBUG-01 (hanging requests and 'headers already sent': trace it through logs) | Coding |
| 20 | Spaced revisit (Day 36, Day 34, Day 30 key concepts, cover and recall, 10 min) plus questions Q-TEST-09..14 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 609 of the 662 lines in the Day 2 block of `06_Week6_Testing_Production.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 2.1 Why structured logging, levels, what to log | 1126-1218 | 92 | 810 | 3 | 5.7 |
| 2.2 pino: setup, redaction, child loggers | 1219-1368 | 149 | 610 | 63 | 10.4 |
| 2.3 Structured error handling: operational vs programmer errors | 1369-1503 | 134 | 720 | 40 | 8.8 |
| 2.4 Request correlation IDs with AsyncLocalStorage (mechanism) (mixed tag: concept only) | 1504-1738 | 234 | 927 | 106 | 16.8 |
| **Total** | | **609** | **3067** | **212** | **41.6** |

- **Estimate:** 3067 prose words / 150 wpm + 212 code lines / 10 lines-per-min = 42 min, plus 4 x 2 min to say each Interview answer aloud = **50 min**. Read slot = 50 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 2 wrap-up (lines 1739-1774, 35 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 662 lines of this Day block would take about 44 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Add pino plus request-id middleware to Task API, include the id in error responses; test that the id appears in logs; EX-TEST-06 (table-driven test of the error-handling contract) and EX-DEBUG-01 (hanging requests and 'headers already sent': trace it through logs).

**Interview questions to revise:** Q-TEST-09..14; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 36 (Testing, Supertest, mocking); Day 34 (Secrets, secure config, mistakes); Day 30 (MongoDB, SQL vs NoSQL).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain why correlation IDs matter across services.
- I can configure log redaction.
- I can explain AsyncLocalStorage in one paragraph.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 6 / Day 2 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Add pino plus request-id middleware to Task API, include the id in error responses
- [ ] Questions Q-TEST-09..14 answered aloud
- [ ] Spaced revisit done (Day 36, Day 34, Day 30)
- [ ] Project stage progressed: Stage 6
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 6 / Day 3 (overall Day 38) -- Timeouts, retries, exponential backoff, idempotency, duplicate-request prevention

**Tier:** ESSENTIAL

**Learning objectives**

- Add timeouts and bounded retries with exponential backoff plus jitter, only for safe/idempotent operations.
- Design idempotency keys for POST requests (payments).
- Explain why retries without idempotency cause duplicate charges.

**Topics:** Timeouts at every boundary (HTTP client, DB, upstream); Retry policy, backoff and jitter, retry budget; Idempotency key storage and response replay; Unique constraints as a last line of defence.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Timeouts; Retries, exponential backoff and jitter; Idempotency and idempotency keys | Reading |
| 35 | Read-along of the overflow section(s) (~2 min, typing their examples) then coding practice: EX-IDEM-01..04 (idempotency key store, concurrent duplicates, same key different payload, Express middleware for POST /payments), EX-TEST-05 (retries with fake timers), EX-ERR-05 (ADVANCED retry only retryable errors, honour Retry-After); Stage 5: idempotent POST for a task-creating or payment-like endpoint | Coding |
| 15 | Spaced revisit (Day 37, Day 35, Day 31 key concepts, cover and recall, 8 min) plus questions Q-PROD-01..08 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 628 of the 680 lines in the Day 3 block of `06_Week6_Testing_Production.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 3.1 Timeouts | 1789-1915 | 126 | 825 | 34 | 8.9 |
| 3.2 Retries, exponential backoff and jitter (mixed tag: concept only) | 1916-2145 | 229 | 769 | 111 | 16.2 |
| 3.3 Idempotency and idempotency keys | 2146-2419 | 273 | 1312 | 124 | 21.1 |
| **Total** | | **628** | **2906** | **269** | **46.3** |

- **Estimate:** 2906 prose words / 150 wpm + 269 code lines / 10 lines-per-min = 46 min, plus 3 x 2 min to say each Interview answer aloud = **52 min**. Read slot = 50 min.
- **Overflow (~2 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 3.3 Idempotency and idempotency keys. About 2 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "3.2 Retries, exponential backoff and jit" (lines 2088-2099).
- **Wrap-up section (used in the wrap-up slot):** Day 3 wrap-up (lines 2420-2455, 35 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 680 lines of this Day block would take about 50 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-IDEM-01..04 (idempotency key store, concurrent duplicates, same key different payload, Express middleware for POST /payments), EX-TEST-05 (retries with fake timers), EX-ERR-05 (ADVANCED retry only retryable errors, honour Retry-After); Stage 5: idempotent POST for a task-creating or payment-like endpoint.

**Interview questions to revise:** Q-PROD-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 37 (Logging, correlation IDs); Day 35 (Week 5 weak areas); Day 31 (Signup/login, bcrypt, JWT).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "3.2 Retries, exponential backoff and jit" (lines 2088-2099).

**Daily learning outcomes**

- I can explain exponential backoff with jitter.
- I can describe the idempotency-key flow including in-flight duplicates.
- I can say which errors are safe to retry.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 6 / Day 3 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-IDEM-01..04 (idempotency key store, concurrent duplicates, same key different payload, Expre
- [ ] Questions Q-PROD-01..08 answered aloud
- [ ] Spaced revisit done (Day 37, Day 35, Day 31)
- [ ] Project stage progressed: Stage 5
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 6 / Day 4 (overall Day 39) -- Redis fundamentals, caching, cache invalidation

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Explain what Redis is and its core data types and TTL.
- Implement cache-aside and explain its failure modes (stale data, stampede, penetration).
- State invalidation strategies and why invalidation is hard.

**Topics:** Redis data types, TTL, eviction policies; Cache-aside, write-through, write-behind; Cache invalidation, stampede, penetration, hot keys; Redis for rate limiting and sessions (preview).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Redis fundamentals; Caching patterns: cache-aside and friends; Stampede, penetration, avalanche (distributed lo; Cache invalidation; Redis in tests and operations | Reading |
| 35 | Read-along of the overflow section(s) (~4 min, typing their examples) then coding practice: Add cache-aside to GET /tasks/:id with TTL and invalidate on update; EX-RATE-07 (ADVANCED distributed token bucket with Redis + Lua, optional); Extension A (Redis cache) start | Coding |
| 15 | Spaced revisit (Day 38, Day 36, Day 32 key concepts, cover and recall, 8 min) plus questions Q-PERF-01..08 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 598 of the 654 lines in the Day 4 block of `06_Week6_Testing_Production.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 4.1 Redis fundamentals | 2470-2639 | 169 | 1043 | 51 | 12.1 |
| 4.2 Caching patterns: cache-aside and friends | 2640-2857 | 217 | 785 | 111 | 16.3 |
| 4.3 Stampede, penetration, avalanche (distributed lock) (mixed tag: concept only) | 2858-2941 | 83 | 382 | 34 | 5.9 |
| 4.4 Cache invalidation | 2942-3059 | 117 | 883 | 28 | 8.7 |
| 4.5 Redis in tests and operations | 3060-3072 | 12 | 152 | 0 | 1.0 |
| **Total** | | **598** | **3245** | **224** | **44.0** |

- **Estimate:** 3245 prose words / 150 wpm + 224 code lines / 10 lines-per-min = 44 min, plus 5 x 2 min to say each Interview answer aloud = **54 min**. Read slot = 50 min.
- **Overflow (~4 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 4.4 Cache invalidation; 4.5 Redis in tests and operations. About 4 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "4.3 Stampede, penetration, avalanche (di" (lines 2911-2914).
- **Wrap-up section (used in the wrap-up slot):** Day 4 wrap-up (lines 3073-3110, 37 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 654 lines of this Day block would take about 48 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Add cache-aside to GET /tasks/:id with TTL and invalidate on update; EX-RATE-07 (ADVANCED distributed token bucket with Redis + Lua, optional); Extension A (Redis cache) start.

**Interview questions to revise:** Q-PERF-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 38 (Retries, backoff, idempotency); Day 36 (Testing, Supertest, mocking); Day 32 (Refresh tokens, sessions, RBAC).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "4.3 Stampede, penetration, avalanche (di" (lines 2911-2914).

**Daily learning outcomes**

- I can explain cache-aside step by step.
- I can name 3 cache problems and a fix each.
- I can explain why caching is not free.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 6 / Day 4 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Add cache-aside to GET /tasks/:id with TTL and invalidate on update
- [ ] Questions Q-PERF-01..08 answered aloud
- [ ] Spaced revisit done (Day 38, Day 36, Day 32)
- [ ] Project stage progressed: Extension A
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 6 / Day 5 (overall Day 40) -- Background jobs, queues, graceful shutdown

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Explain why slow work moves to a queue and how producers/consumers/retries/dead-letter queues work.
- Implement graceful shutdown (SIGTERM, stop accepting, drain, close DB/Redis, exit).
- Explain at-least-once delivery and why jobs must be idempotent.

**Topics:** Queues and workers (BullMQ with Redis as the example); Retries, delays, dead-letter queues; Graceful shutdown sequence and server.close(); Health/readiness endpoints.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 40 | Read the ESSENTIAL sections only (reading plan below): Background jobs: why and the concepts; Graceful shutdown | Reading |
| 45 | Coding practice: EX-ERR-06 (withResource: never leak a resource, the pattern behind graceful shutdown), write a small job producer/worker; add SIGTERM handler to Task API; Extension B (background job: email-style notification) | Coding |
| 15 | Spaced revisit (Day 39, Day 37, Day 33 key concepts, cover and recall, 8 min) plus questions Q-PROD-09..16 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 466 of the 516 lines in the Day 5 block of `06_Week6_Testing_Production.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 5.1 Background jobs: why and the concepts (mixed tag: concept only) | 3125-3366 | 241 | 1237 | 99 | 18.1 |
| 5.2 Graceful shutdown | 3367-3592 | 225 | 1108 | 102 | 17.6 |
| **Total** | | **466** | **2345** | **201** | **35.7** |

- **Estimate:** 2345 prose words / 150 wpm + 201 code lines / 10 lines-per-min = 36 min, plus 2 x 2 min to say each Interview answer aloud = **40 min**. Read slot = 40 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "5.1 Background jobs: why and the concept" (lines 3302-3313).
- **Wrap-up section (used in the wrap-up slot):** Day 5 wrap-up (lines 3593-3627, 34 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 516 lines of this Day block would take about 40 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-ERR-06 (withResource: never leak a resource, the pattern behind graceful shutdown), write a small job producer/worker; add SIGTERM handler to Task API; Extension B (background job: email-style notification).

**Interview questions to revise:** Q-PROD-09..16; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 39 (Redis, caching, invalidation); Day 37 (Logging, correlation IDs); Day 33 (SQLi, XSS, CSRF, CORS, rate limit).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "5.1 Background jobs: why and the concept" (lines 3302-3313).

**Daily learning outcomes**

- I can list the steps of graceful shutdown.
- I can explain at-least-once and idempotent consumers.
- I can explain what a DLQ is for.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~40 min) and said each Interview answer aloud (Week 6 / Day 5 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-ERR-06 (withResource: never leak a resource, the pattern behind graceful shutdown), write a
- [ ] Questions Q-PROD-09..16 answered aloud
- [ ] Spaced revisit done (Day 39, Day 37, Day 33)
- [ ] Project stage progressed: Extension B
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 6 / Day 6 (overall Day 41) -- Debugging slow APIs and memory leaks, basic load testing

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Follow a systematic slow-API diagnosis (measure, isolate DB vs app vs network, fix, re-measure).
- Run a basic load test (autocannon or k6) and read p50/p95/p99 and throughput.
- Finish Stage 6 and make the Task API test-green.

**Topics:** Metrics to look at: latency percentiles, error rate, saturation; N+1 queries, missing indexes, blocking loop, pool exhaustion; --inspect, clinic/0x names, heap snapshots (recap Week 2); Load test design and interpreting results.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Debugging a slow API; Debugging memory leaks (tooling); Basic load and performance testing with autocann; Production failure diagnosis playbook | Reading |
| 30 | Read-along of the overflow section(s) (~20 min, typing their examples) then coding practice: EX-DEBUG-03 (one endpoint makes the whole server slow), EX-DEBUG-06..07 (optional); autocannon run on GET /tasks before/after an index; finalize Stage 6 tests and logging | Coding |
| 20 | Spaced revisit (Day 40, Day 38, Day 34 key concepts, cover and recall, 10 min) plus questions Q-PERF-09..16 and Q-TEST-15..20 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 760 of the 813 lines in the Day 6 block of `06_Week6_Testing_Production.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 6.1 Debugging a slow API (mixed tag: concept only) | 3644-3851 | 207 | 1267 | 65 | 14.9 |
| 6.2 Debugging memory leaks (tooling) (mixed tag: concept only) | 3852-4023 | 171 | 1344 | 58 | 14.8 |
| 6.3 Basic load and performance testing with autocannon | 4024-4158 | 134 | 1010 | 47 | 11.4 |
| 6.4 Production failure diagnosis playbook | 4159-4407 | 248 | 3220 | 50 | 26.5 |
| **Total** | | **760** | **6841** | **220** | **67.6** |

- **Estimate:** 6841 prose words / 150 wpm + 220 code lines / 10 lines-per-min = 68 min, plus 4 x 2 min to say each Interview answer aloud = **76 min**. Read slot = 50 min.
- **Overflow (~26 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 6.4 Production failure diagnosis playbook. About 20 min is absorbed into the coding slot (you type those examples anyway). The remaining ~6 min is carried to the Day 7 catch-up reading of this week.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "6.1 Debugging a slow API" (lines 3780-3802).
- **Wrap-up section (used in the wrap-up slot):** Day 6 wrap-up (lines 4408-4441, 33 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 813 lines of this Day block would take about 73 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-DEBUG-03 (one endpoint makes the whole server slow), EX-DEBUG-06..07 (optional); autocannon run on GET /tasks before/after an index; finalize Stage 6 tests and logging.

**Interview questions to revise:** Q-PERF-09..16 and Q-TEST-15..20; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 40 (Queues, jobs, graceful shutdown); Day 38 (Retries, backoff, idempotency); Day 34 (Secrets, secure config, mistakes).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "6.1 Debugging a slow API" (lines 3780-3802).

**Daily learning outcomes**

- I can narrate a 5-step slow-API investigation.
- I can read p95 vs average.
- I can explain why load tests need realistic data.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 6 / Day 6 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-DEBUG-03 (one endpoint makes the whole server slow), EX-DEBUG-06..07 (optional)
- [ ] Questions Q-PERF-09..16 and Q-TEST-15..20 answered aloud
- [ ] Spaced revisit done (Day 40, Day 38, Day 34)
- [ ] Project stage progressed: Stage 6 finish, Stage 7
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 6 / Day 7 (overall Day 42) -- Revision, weekly test, catch-up

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Prove (to yourself) what you actually retained from Week 6 by taking the weekly assessment closed-book.
- Identify the 2-3 weakest topics and repair them; absorb any unfinished day.
- Consolidate the week's key concepts into a one-page summary you can re-read in 10 minutes.

**Topics:** All of Week 6 -- Testing, Supertest, mocking; Logging, correlation IDs; Retries, backoff, idempotency; Redis, caching, invalidation; Queues, jobs, graceful shutdown; Slow API debugging, load testing

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus read the Week 6 revision summary | Revision and questions |
| 40 | Weekly assessment (Week 6 file), closed book, timed, answer in writing or aloud | Revision and questions |
| 15 | Mark using the answer key; list weak areas using the weak-area guidance | Wrap-up and tests |
| 20 | Catch-up reading: FIRST the overflow carried from this week (Day 36 ~8 min; Day 41 ~6 min), then weak areas, then any unfinished day | Reading |
| 15 | Catch-up coding: redo the failed exercise or advance the project (Stage 5 and Stage 6 complete (tests, logging, security middleware); Extension A and B attempted) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |

**Reading plan (Day 7 revision day: second-pass speed = about 2x the first-pass speed, so each section costs about half its first-read estimate)**

| File | Section | Lines | Line count | Est. min (second pass) |
|------|---------|-------|------------|------------------------|
| 06_Week6_Testing_Production.md | Week 6 Revision Summary | 4599-4627 | 29 | 1.4 |
| 06_Week6_Testing_Production.md | Week 6 Assessment (mixed difficulty) | 4628-4719 | 92 | 3.5 |
| 06_Week6_Testing_Production.md | Week 6 Assessment: Answers with Explanations | 4720-4788 | 69 | 7.0 |
| 06_Week6_Testing_Production.md | Week 6 Weak-Area Identification Guidance | 4789-4815 | 27 | 1.2 |
| 06_Week6_Testing_Production.md | Week 6 Catch-Up Plan (if you are behind) | 4816-4834 | 19 | 1.4 |

- **Where each slot uses them:** the revision summary belongs to the 25-minute spaced-revisit slot (about 1 min of reading, the rest is cover-and-recall); the assessment is the 40-minute closed-book slot (do not read the answers first); the answers section is used while marking (15 min); weak-area guidance and the catch-up plan feed the catch-up slots.
- **Overflow carried into this Day 7:** Day 36 (1.5 Supertest: integration testing the Express API; 1.6 Negative testing and test design), ~8 min; Day 41 (6.4 Production failure diagnosis playbook), ~6 min. Because the carry is 14 min the catch-up reading slot is 20 min and the catch-up coding slot is 15 min (the table above already reflects this).
- **Re-read only the Week 6 / Day 1-6 notes for topics you got wrong** (use each Day block reading plan to find the ESSENTIAL section and re-read that section, not the whole Day).

**Coding practice:** Redo (from a blank file) every exercise you got wrong this week, in these groups: EX-TEST, EX-IDEM, EX-DEBUG, EX-ERR. Project: Stage 5 and Stage 6 complete (tests, logging, security middleware); Extension A and B attempted.

**Interview questions to revise:** The 10 questions you found hardest from this week's ID ranges (Q-TEST-01..20, Q-PROD-01..16, Q-PERF-01..16). Answer each aloud in under 90 seconds.

**Weekly test:** Week 6 assessment in `06_Week6_Testing_Production.md` (mixed Basic/Intermediate/Advanced). Target: 70 percent or more. Below 70 percent -> follow the week's catch-up plan before starting next week's Day 1.

**Daily learning outcomes**

- I know my Week 6 score and my weakest 2-3 topics.
- I have repaired at least one weak topic by re-reading plus re-doing a task.
- Every unfinished item from Day 1-6 is either done or explicitly moved to section 5 triage.

**Completion checklist**

- [ ] Spaced revisit of Day 1-6 done
- [ ] Weekly assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Weak topics re-read
- [ ] Failed exercise redone from blank file
- [ ] Week 6 hours logged (target 14 h)

### 3.8 Week 7 -- Backend System Design and Production Scenarios (Days 43-49)

- **Notes file:** `07_Week7_System_Design.md`
- **Week goal:** Deliver a structured design answer (requirements, API, schema, components, data flow, failures, trade-offs, scaling) for the common backend design questions.
- **Never skip this week:** Simple design first, rate limiter, URL shortener, payment + idempotency flow, queues for async work, caching/DB scaling, basic Docker.
- **ADVANCED (skip first if behind):** Kubernetes, service mesh, consensus algorithms, multi-region replication.


#### Week 7 / Day 1 (overall Day 43) -- Modular monolith vs microservices, load balancing, horizontal scaling, caching and DB scaling

**Tier:** ESSENTIAL

**Learning objectives**

- Argue modular monolith vs microservices with trade-offs, defaulting to the simplest design.
- Explain load balancing, stateless services and horizontal vs vertical scaling.
- Describe read replicas, caching layers and connection limits.

**Topics:** Monolith vs modular monolith vs microservices; Load balancers (L4/L7), stateless services, sticky sessions; Caching layers (CDN, app, Redis, DB); DB scaling: indexes first, replicas, partitioning/sharding as last resort; connection limits.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 45 | Read the ESSENTIAL sections only (reading plan below): Modular monolith vs microservices; Load balancing and horizontal scaling; Caching; Database scaling ladder | Reading |
| 35 | Coding practice: Draw (on paper) the evolution of the Task API from 1 server to load-balanced with Redis and a read replica; write one-paragraph justification for each step | Coding |
| 20 | Spaced revisit (Day 42, Day 40, Day 36 key concepts, cover and recall, 10 min) plus questions Q-SD-01..06 and Q-PERF-17..22 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 494 of the 542 lines in the Day 1 block of `07_Week7_System_Design.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 1.1 Modular monolith vs microservices | 65-142 | 77 | 666 | 16 | 6.0 |
| 1.2 Load balancing and horizontal scaling | 143-267 | 124 | 752 | 46 | 9.6 |
| 1.3 Caching | 268-424 | 156 | 785 | 64 | 11.6 |
| 1.4 Database scaling ladder (mixed tag: concept only) | 425-562 | 137 | 675 | 51 | 9.6 |
| **Total** | | **494** | **2878** | **177** | **36.9** |

- **Estimate:** 2878 prose words / 150 wpm + 177 code lines / 10 lines-per-min = 37 min, plus 4 x 2 min to say each Interview answer aloud = **45 min**. Read slot = 45 min.
- **Overflow:** none; every ESSENTIAL section fits the read slot.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "1.4 Database scaling ladder" (lines 480-486).
- **Wrap-up section (used in the wrap-up slot):** Day 1 wrap-up (lines 563-594, 31 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 542 lines of this Day block would take about 40 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Draw (on paper) the evolution of the Task API from 1 server to load-balanced with Redis and a read replica; write one-paragraph justification for each step.

**Interview questions to revise:** Q-SD-01..06 and Q-PERF-17..22; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 42 (Week 6 weak areas); Day 40 (Queues, jobs, graceful shutdown); Day 36 (Testing, Supertest, mocking).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "1.4 Database scaling ladder" (lines 480-486).

**Daily learning outcomes**

- I can explain 'start simple, add complexity when justified'.
- I can explain why statelessness enables horizontal scaling.
- I can list the DB scaling ladder in order.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~45 min) and said each Interview answer aloud (Week 7 / Day 1 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Draw (on paper) the evolution of the Task API from 1 server to load-balanced with Redis and a r
- [ ] Questions Q-SD-01..06 and Q-PERF-17..22 answered aloud
- [ ] Spaced revisit done (Day 42, Day 40, Day 36)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 7 / Day 2 (overall Day 44) -- Rate limiter design, notification system design

**Tier:** ESSENTIAL

**Learning objectives**

- Design a rate limiter (algorithms: fixed window, sliding window, token bucket; Redis-based, distributed).
- Use the design template: requirements, API, schema, components, data flow, failures, trade-offs, scaling.
- Design a notification system with queues, retries and user preferences.

**Topics:** Rate limiter algorithms and placement (gateway vs app); Redis atomic counters / Lua scripts for distributed limiting; Notification system: channels, queue, workers, templates, retries, idempotency; Failure scenarios and trade-offs.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Design: Rate limiter; Design: Notification system | Reading |
| 35 | Read-along of the overflow section(s) (~12 min, typing their examples) then coding practice: EX-RATE-04..05 (token bucket, Express middleware with standard headers), EX-RATE-06 (ADVANCED memory safety and per-route policies, optional); sketch the notification design from a blank page in 25 min | Coding |
| 15 | Spaced revisit (Day 43, Day 41, Day 37 key concepts, cover and recall, 8 min) plus questions Q-SD-07..12 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 710 of the 754 lines in the Day 2 block of `07_Week7_System_Design.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 2.1 Design: Rate limiter | 607-943 | 336 | 1586 | 164 | 27.0 |
| 2.2 Design: Notification system | 944-1318 | 374 | 1453 | 215 | 31.2 |
| **Total** | | **710** | **3039** | **379** | **58.2** |

- **Estimate:** 3039 prose words / 150 wpm + 379 code lines / 10 lines-per-min = 58 min, plus 2 x 2 min to say each Interview answer aloud = **62 min**. Read slot = 50 min.
- **Overflow (~12 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 2.2 Design: Notification system. About 12 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 2 wrap-up (lines 1319-1349, 30 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 754 lines of this Day block would take about 61 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-RATE-04..05 (token bucket, Express middleware with standard headers), EX-RATE-06 (ADVANCED memory safety and per-route policies, optional); sketch the notification design from a blank page in 25 min.

**Interview questions to revise:** Q-SD-07..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 43 (Architecture and scaling basics); Day 41 (Slow API debugging, load testing); Day 37 (Logging, correlation IDs).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can compare 3 rate limit algorithms.
- I can explain how multiple servers share limits.
- I can design notifications with retry and dedupe.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 7 / Day 2 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-RATE-04..05 (token bucket, Express middleware with standard headers), EX-RATE-06 (ADVANCED m
- [ ] Questions Q-SD-07..12 answered aloud
- [ ] Spaced revisit done (Day 43, Day 41, Day 37)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 7 / Day 3 (overall Day 45) -- URL shortener design, file upload architecture

**Tier:** ESSENTIAL

**Learning objectives**

- Design a URL shortener (ID generation, schema, redirect path, caching, analytics).
- Design large-file upload with pre-signed URLs, object storage and async processing.
- Explain collision handling and read-heavy optimization.

**Topics:** Short code generation: base62 counter vs hash vs random; collision handling; Read-heavy design: cache, 301 vs 302; File upload: pre-signed URL, multipart/resumable, virus scan/processing queue; Metadata schema, access control for files.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Design: URL shortener; Design: File upload architecture | Reading |
| 35 | Read-along of the overflow section(s) (~12 min, typing their examples) then coding practice: Implement a minimal in-memory shortener (encode/decode base62, collision-safe); sketch upload flow with sequence diagram in text | Coding |
| 15 | Spaced revisit (Day 44, Day 42, Day 38 key concepts, cover and recall, 8 min) plus questions Q-SD-13..18 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 719 of the 762 lines in the Day 3 block of `07_Week7_System_Design.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 3.1 Design: URL shortener | 1361-1713 | 352 | 1660 | 173 | 28.4 |
| 3.2 Design: File upload architecture | 1714-2081 | 367 | 1672 | 181 | 29.2 |
| **Total** | | **719** | **3332** | **354** | **57.6** |

- **Estimate:** 3332 prose words / 150 wpm + 354 code lines / 10 lines-per-min = 58 min, plus 2 x 2 min to say each Interview answer aloud = **62 min**. Read slot = 50 min.
- **Overflow (~12 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 3.2 Design: File upload architecture. About 12 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 3 wrap-up (lines 2082-2112, 30 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 762 lines of this Day block would take about 60 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Implement a minimal in-memory shortener (encode/decode base62, collision-safe); sketch upload flow with sequence diagram in text.

**Interview questions to revise:** Q-SD-13..18; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 44 (Rate limiter, notification design); Day 42 (Week 6 weak areas); Day 38 (Retries, backoff, idempotency).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can justify base62 counter vs hash.
- I can explain why uploads should not stream through the API server.
- I can explain 301 vs 302 impact.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 7 / Day 3 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Implement a minimal in-memory shortener (encode/decode base62, collision-safe)
- [ ] Questions Q-SD-13..18 answered aloud
- [ ] Spaced revisit done (Day 44, Day 42, Day 38)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 7 / Day 4 (overall Day 46) -- Payment/transaction workflows, retries, idempotency, failure recovery

**Tier:** ESSENTIAL

**Learning objectives**

- Design a payment flow with idempotency keys, a state machine and webhook handling.
- Explain failure recovery: timeouts, unknown outcome, reconciliation, saga/compensation.
- Apply double-entry ledger thinking at a basic level.

**Topics:** Payment states (created, pending, succeeded, failed, refunded) and transitions; Idempotency keys and unique constraints; Webhooks: signature verification, dedupe, out-of-order delivery; Reconciliation, sagas vs 2PC (names, trade-offs).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Money rules and workflow overview; Design: Checkout payment with an external PSP; Design: Internal money transfer with a ledger; Retries, idempotency and failure recovery toolbo | Reading |
| 35 | Read-along of the overflow section(s) (~20 min, typing their examples) then coding practice: EX-IDEM-05..07 (idempotent payment with state transitions); extend your transfer code with a ledger table and unique idempotency key | Coding |
| 15 | Spaced revisit (Day 45, Day 43, Day 39 key concepts, cover and recall, 8 min) plus questions Q-SD-19..24 and Q-PROD-17..20 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 893 of the 941 lines in the Day 4 block of `07_Week7_System_Design.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 4.1 Money rules and workflow overview | 2127-2161 | 34 | 301 | 4 | 2.4 |
| 4.2 Design: Checkout payment with an external PSP | 2162-2620 | 458 | 1588 | 280 | 38.6 |
| 4.3 Design: Internal money transfer with a ledger | 2621-2916 | 295 | 1295 | 155 | 24.1 |
| 4.4 Retries, idempotency and failure recovery toolbox (mixed tag: concept only) | 2917-3023 | 106 | 732 | 23 | 7.2 |
| **Total** | | **893** | **3916** | **462** | **72.3** |

- **Estimate:** 3916 prose words / 150 wpm + 462 code lines / 10 lines-per-min = 72 min, plus 4 x 2 min to say each Interview answer aloud = **80 min**. Read slot = 50 min.
- **Overflow (~30 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 4.3 Design: Internal money transfer with a ledger; 4.4 Retries, idempotency and failure recovery toolbox. About 20 min is absorbed into the coding slot (you type those examples anyway). The remaining ~10 min is carried to the Day 7 catch-up reading of this week.
- **Skip for now ([ADVANCED]):** the [ADVANCED] sub-block inside "4.4 Retries, idempotency and failure rec" (lines 2984-2987).
- **Wrap-up section (used in the wrap-up slot):** Day 4 wrap-up (lines 3024-3054, 30 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 941 lines of this Day block would take about 75 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** EX-IDEM-05..07 (idempotent payment with state transitions); extend your transfer code with a ledger table and unique idempotency key.

**Interview questions to revise:** Q-SD-19..24 and Q-PROD-17..20; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 45 (URL shortener, upload architecture); Day 43 (Architecture and scaling basics); Day 39 (Redis, caching, invalidation).

**ADVANCED (skip first if behind):** the [ADVANCED] sub-block inside "4.4 Retries, idempotency and failure rec" (lines 2984-2987).

**Daily learning outcomes**

- I can narrate a payment from request to webhook confirmation.
- I can explain what to do when a payment call times out.
- I can explain why money uses integers/DECIMAL.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 7 / Day 4 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: EX-IDEM-05..07 (idempotent payment with state transitions)
- [ ] Questions Q-SD-19..24 and Q-PROD-17..20 answered aloud
- [ ] Spaced revisit done (Day 45, Day 43, Day 39)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 7 / Day 5 (overall Day 47) -- Message queues, async processing, logging/metrics/monitoring

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Compare queue vs pub/sub vs streaming (SQS/RabbitMQ vs Kafka) at interview depth.
- Explain delivery semantics, ordering, DLQs and consumer scaling.
- Describe the three pillars (logs, metrics, traces) and golden signals/alerting.

**Topics:** Message queue concepts and delivery guarantees; Competing consumers, partitions and ordering; Metrics: RED/USE/golden signals, Prometheus-style counters/histograms; Alerting on symptoms, dashboards, SLO basics.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Message queues and asynchronous processing; Logging, metrics and monitoring | Reading |
| 30 | Read-along of the overflow section(s) (~2 min, typing their examples) then coding practice: Add a /metrics endpoint (prom-client) to Task API with request count and latency histogram; Stage 7: update README with architecture and observability sections | Coding |
| 20 | Spaced revisit (Day 46, Day 44, Day 40 key concepts, cover and recall, 10 min) plus questions Q-SD-25..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 595 of the 641 lines in the Day 5 block of `07_Week7_System_Design.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 5.1 Message queues and asynchronous processing | 3069-3400 | 331 | 1387 | 182 | 27.4 |
| 5.2 Logging, metrics and monitoring | 3401-3665 | 264 | 1075 | 137 | 20.9 |
| **Total** | | **595** | **2462** | **319** | **48.3** |

- **Estimate:** 2462 prose words / 150 wpm + 319 code lines / 10 lines-per-min = 48 min, plus 2 x 2 min to say each Interview answer aloud = **52 min**. Read slot = 50 min.
- **Overflow (~2 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 5.2 Logging, metrics and monitoring. About 2 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 5 wrap-up (lines 3666-3696, 30 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 641 lines of this Day block would take about 51 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Add a /metrics endpoint (prom-client) to Task API with request count and latency histogram; Stage 7: update README with architecture and observability sections.

**Interview questions to revise:** Q-SD-25..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 46 (Payments, idempotency, recovery); Day 44 (Rate limiter, notification design); Day 40 (Queues, jobs, graceful shutdown).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can explain at-least-once vs at-most-once vs exactly-once honestly.
- I can name the 4 golden signals.
- I can explain how to scale consumers.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 7 / Day 5 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Add a /metrics endpoint (prom-client) to Task API with request count and latency histogram
- [ ] Questions Q-SD-25..30 answered aloud
- [ ] Spaced revisit done (Day 46, Day 44, Day 40)
- [ ] Project stage progressed: Stage 7
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 7 / Day 6 (overall Day 48) -- Docker and deployment basics, design-practice session

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Explain images, containers, Dockerfile layers, volumes, networking and docker compose.
- Describe deployment basics: env config, reverse proxy, process manager, health checks, CI/CD at overview level.
- Complete one timed design interview from scratch.

**Topics:** Dockerfile for a Node service (multi-stage, non-root, .dockerignore); docker compose with MySQL and Redis; Reverse proxy/TLS (nginx), PM2 vs container orchestration, zero-downtime idea; Timed design practice using the template.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 50 | Read the ESSENTIAL sections only (reading plan below): Docker fundamentals; Deployment basics; Design-practice session | Reading |
| 35 | Read-along of the overflow section(s) (~6 min, typing their examples) then coding practice: Extension C: Dockerfile and docker-compose.yml for Task API + MySQL + Redis; Extension D: write a deployment checklist; then 45-min timed design (pick one: rate limiter, URL shortener or payments) | Coding |
| 15 | Spaced revisit (Day 47, Day 45, Day 41 key concepts, cover and recall, 8 min) plus questions Q-SD-25..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (ESSENTIAL sections only: 601 of the 647 lines in the Day 6 block of `07_Week7_System_Design.md`)**

| Section (heading in the notes) | Lines | Line count | Prose words | Code lines | Est. min |
|--------------------------------|-------|------------|-------------|------------|----------|
| 6.1 Docker fundamentals | 3709-4006 | 297 | 1138 | 169 | 24.5 |
| 6.2 Deployment basics | 4007-4221 | 214 | 1138 | 99 | 17.5 |
| 6.3 Design-practice session | 4222-4312 | 90 | 1230 | 0 | 8.2 |
| **Total** | | **601** | **3506** | **268** | **50.2** |

- **Estimate:** 3506 prose words / 150 wpm + 268 code lines / 10 lines-per-min = 50 min, plus 3 x 2 min to say each Interview answer aloud = **56 min**. Read slot = 50 min.
- **Overflow (~6 min):** does not fit the 50-minute read slot, so these last section(s) spill over: 6.3 Design-practice session. About 6 min is absorbed into the coding slot (you type those examples anyway).
- **Skip for now ([ADVANCED]):** nothing in this Day block is tagged [ADVANCED]; the day is all ESSENTIAL.
- **Wrap-up section (used in the wrap-up slot):** Day 6 wrap-up (lines 4313-4344, 31 lines): key concepts, 5 revision questions, practical task, checklist.
- **If everything were read:** all 647 lines of this Day block would take about 53 min of pure reading at the same speeds (prose, code, exercises and wrap-up together), (without the aloud-recall minutes), so the ESSENTIAL-only plan above is what fits a 2-hour day; the rest is practice or skip material.

**Coding practice:** Extension C: Dockerfile and docker-compose.yml for Task API + MySQL + Redis; Extension D: write a deployment checklist; then 45-min timed design (pick one: rate limiter, URL shortener or payments).

**Interview questions to revise:** Q-SD-25..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 47 (Queues, metrics, monitoring); Day 45 (URL shortener, upload architecture); Day 41 (Slow API debugging, load testing).

**ADVANCED (skip first if behind):** none tagged for this day.

**Daily learning outcomes**

- I can write a production-quality Dockerfile.
- I can explain container vs VM.
- I can deliver a full design answer in 35 minutes.

**Completion checklist**

- [ ] Read the ESSENTIAL sections of the reading plan (~50 min) and said each Interview answer aloud (Week 7 / Day 6 notes)
- [ ] Ran and modified the code examples of the ESSENTIAL sections (typed, not pasted)
- [ ] Coding practice done: Extension C: Dockerfile and docker-compose.yml for Task API + MySQL + Redis
- [ ] Questions Q-SD-25..30 answered aloud
- [ ] Spaced revisit done (Day 47, Day 45, Day 41)
- [ ] Project stage progressed: Extension C
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 7 / Day 7 (overall Day 49) -- Revision, weekly test, catch-up

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Prove (to yourself) what you actually retained from Week 7 by taking the weekly assessment closed-book.
- Identify the 2-3 weakest topics and repair them; absorb any unfinished day.
- Consolidate the week's key concepts into a one-page summary you can re-read in 10 minutes.

**Topics:** All of Week 7 -- Architecture and scaling basics; Rate limiter, notification design; URL shortener, upload architecture; Payments, idempotency, recovery; Queues, metrics, monitoring; Docker, deployment, design practice

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus read the Week 7 revision summary | Revision and questions |
| 40 | Weekly assessment (Week 7 file), closed book, timed, answer in writing or aloud | Revision and questions |
| 15 | Mark using the answer key; list weak areas using the weak-area guidance | Wrap-up and tests |
| 20 | Catch-up reading: FIRST the overflow carried from this week (Day 46 ~10 min), then weak areas, then any unfinished day | Reading |
| 15 | Catch-up coding: redo the failed exercise or advance the project (Stage 7 (README, API docs) complete; Extension C and D attempted) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |

**Reading plan (Day 7 revision day: second-pass speed = about 2x the first-pass speed, so each section costs about half its first-read estimate)**

| File | Section | Lines | Line count | Est. min (second pass) |
|------|---------|-------|------------|------------------------|
| 07_Week7_System_Design.md | Week 7 revision summary | 4419-4449 | 31 | 1.1 |
| 07_Week7_System_Design.md | Week 7 assessment | 4450-4509 | 60 | 1.8 |
| 07_Week7_System_Design.md | Answers with explanations | 4510-4572 | 63 | 5.4 |
| 07_Week7_System_Design.md | Weak-area identification guidance | 4573-4599 | 27 | 1.3 |
| 07_Week7_System_Design.md | Catch-up plan if you fall behind | 4600-4638 | 39 | 1.5 |

- **Where each slot uses them:** the revision summary belongs to the 25-minute spaced-revisit slot (about 1 min of reading, the rest is cover-and-recall); the assessment is the 40-minute closed-book slot (do not read the answers first); the answers section is used while marking (15 min); weak-area guidance and the catch-up plan feed the catch-up slots.
- **Overflow carried into this Day 7:** Day 46 (4.3 Design: Internal money transfer with a ledger; 4.4 Retries, idempotency and failure recovery toolbox), ~10 min. Because the carry is 10 min the catch-up reading slot is 20 min and the catch-up coding slot is 15 min (the table above already reflects this).
- **Re-read only the Week 7 / Day 1-6 notes for topics you got wrong** (use each Day block reading plan to find the ESSENTIAL section and re-read that section, not the whole Day).

**Coding practice:** Redo (from a blank file) every exercise you got wrong this week, in these groups: EX-RATE, EX-IDEM. Project: Stage 7 (README, API docs) complete; Extension C and D attempted.

**Interview questions to revise:** The 10 questions you found hardest from this week's ID ranges (Q-SD-01..30, Q-PERF-17..22, Q-PROD-17..20). Answer each aloud in under 90 seconds.

**Weekly test:** Week 7 assessment in `07_Week7_System_Design.md` (mixed Basic/Intermediate/Advanced). Target: 70 percent or more. Below 70 percent -> follow the week's catch-up plan before starting next week's Day 1.

**Daily learning outcomes**

- I know my Week 7 score and my weakest 2-3 topics.
- I have repaired at least one weak topic by re-reading plus re-doing a task.
- Every unfinished item from Day 1-6 is either done or explicitly moved to section 5 triage.

**Completion checklist**

- [ ] Spaced revisit of Day 1-6 done
- [ ] Weekly assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Weak topics re-read
- [ ] Failed exercise redone from blank file
- [ ] Week 7 hours logged (target 14 h)

### 3.9 Week 8 -- Interview Revision and Mock Preparation (Days 50-56)

- **Notes file:** `08_Week8_Revision_Mocks_Checklist.md`
- **Week goal:** Convert knowledge into spoken, timed interview performance; find and patch the last weak areas; get an honest readiness assessment.
- **Never skip this week:** Mock sets 1-3, project explanation, rapid revision of your weakest two weeks, readiness checklist.
- **ADVANCED (skip first if behind):** New topics. Week 8 is consolidation only -- do not start new material.


#### Week 8 / Day 1 (overall Day 50) -- JavaScript and Node rapid revision

**Tier:** ESSENTIAL

**Learning objectives**

- Re-verify Weeks 1-2 knowledge speed: answer questions out loud under time pressure.
- Close the gaps flagged by the Week 1 and Week 2 weekly tests.
- Re-run every event-loop output prediction you got wrong.

**Topics:** Closures, this, prototypes, promises, event loop, combinators; Node architecture, event loop phases, thread pool classification, streams, memory; Spoken-answer drills (60-90 seconds each).

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read the reading-plan sections below (second pass): Week 1 revision summary; Week 2 Revision Summary; Cheat Sheet 1 - JavaScript for Backend; Cheat Sheet 2 - Node.js Internals | Reading |
| 30 | Redo failed EX-LOOP and EX-ASYNC items, timed | Coding |
| 45 | Spoken drill: 15 questions from Q-JS and Q-NODE, 90 sec each, self-grade | Revision and questions |
| 20 | Write 3 weak topics, log, plan Day 2 | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Week 8 is a second pass over material you already read, so speeds are about 2x the first-pass speeds; each section also gets 1 min of cover-and-recite)**

| File | Section (read slot) | Lines | Line count | Est. min (second pass) |
|------|---------------------|-------|------------|------------------------|
| 01_Week1_JavaScript.md | Week 1 revision summary | 5070-5115 | 46 | 1.6 |
| 02_Week2_Node_Internals.md | Week 2 Revision Summary | 4902-4961 | 60 | 1.8 |
| 08_Week8_Revision_Mocks_Checklist.md | Cheat Sheet 1 - JavaScript for Backend | 66-145 | 80 | 2.1 |
| 08_Week8_Revision_Mocks_Checklist.md | Cheat Sheet 2 - Node.js Internals | 146-234 | 89 | 2.1 |

- **Estimate:** 8 min reading + 4 min cover-and-recite = **12 min** against a read slot of 25 min (fits; the spare 13 min go to re-reading the weak-area sections from your Day 7 lists).
- **Used in the coding slot:** Output-prediction drill (write answers first; answers below) (08_Week8_Revision_Mocks_Checklist.md, lines 235-356, 122 lines).
- **Used in the revise / spoken-drill slot:** Interview-ready 60-second answers (lines 364-382, 19 lines); Follow-up chain: event loop (lines 383-395, 13 lines).
- **Wrap-up material (wrap-up slot):** lines 396-440 of `08_Week8_Revision_Mocks_Checklist.md` (common mistakes, revision notes, key concepts, five revision questions, practical task, self-assessment).
- **Skip:** any new topic; Week 8 only revises. [ADVANCED] items: see the week header.

**Coding practice:** EX-LOOP-01..06 re-run (wrong ones only), EX-ASYNC-05..07 timed, EX-ERR-01..06 skim. Use the 'Output-prediction drill' in the Week 8 / Day 1 notes as extra predictions.

**Interview questions to revise:** Q-JS-01..30 (Basic and Intermediate marked ones first) and Q-NODE-01..30 (answer 15 aloud); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 49 (Week 7 weak areas); Day 47 (Queues, metrics, monitoring); Day 43 (Architecture and scaling basics).

**Daily learning outcomes**

- I can answer 15 JS/Node questions aloud within 90 seconds each.
- I have no unresolved output-prediction mistakes.
- I know my two weakest JS/Node topics.

**Completion checklist**

- [ ] Read the reading-plan sections (second pass) (Week 1 and Week 2 revision summaries and 'weak-area' sections; Week 8 / Day 1 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-LOOP-01..06 re-run
- [ ] Questions Q-JS-01..30 answered aloud
- [ ] Spaced revisit done (Day 49, Day 47, Day 43)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 8 / Day 2 (overall Day 51) -- Express/REST and SQL/MongoDB revision

**Tier:** ESSENTIAL

**Learning objectives**

- Rapidly revise Express, REST and database topics through questions and queries.
- Write 5 SQL queries from scratch without hints.
- Explain indexes, transactions and isolation levels without notes.

**Topics:** Express request lifecycle, middleware, error handling, REST design; SQL joins/aggregation, indexes, transactions, isolation, pooling; MongoDB basics and SQL vs NoSQL.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 20 | Read the reading-plan sections below (second pass): Week 3 revision summary; Week 4 revision summary; Cheat Sheet 3 - HTTP, REST, Express; Cheat Sheet 4 - MySQL; Cheat Sheet 5 - MongoDB and SQL vs | Reading |
| 35 | Write 5 SQL queries and one Express middleware from a blank file | Coding |
| 45 | Spoken drill: 20 questions from Q-EXP, Q-SQL, Q-MONGO | Revision and questions |
| 20 | Weak-topic list, log, plan Day 3 | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Week 8 is a second pass over material you already read, so speeds are about 2x the first-pass speeds; each section also gets 1 min of cover-and-recite)**

| File | Section (read slot) | Lines | Line count | Est. min (second pass) |
|------|---------------------|-------|------------|------------------------|
| 03_Week3_Express_REST.md | Week 3 revision summary | 4460-4478 | 19 | 0.8 |
| 04_Week4_MySQL.md | Week 4 revision summary | 3833-3865 | 33 | 1.0 |
| 08_Week8_Revision_Mocks_Checklist.md | Cheat Sheet 3 - HTTP, REST, Express | 450-523 | 74 | 2.1 |
| 08_Week8_Revision_Mocks_Checklist.md | Cheat Sheet 4 - MySQL | 524-584 | 61 | 1.8 |
| 08_Week8_Revision_Mocks_Checklist.md | Cheat Sheet 5 - MongoDB and SQL vs NoSQL basics, sharding | 585-609 | 25 | 0.7 |

- **Estimate:** 6 min reading + 5 min cover-and-recite = **11 min** against a read slot of 20 min (fits; the spare 9 min go to re-reading the weak-area sections from your Day 7 lists).
- **Used in the coding slot:** SQL drill: write these from memory (08_Week8_Revision_Mocks_Checklist.md, lines 610-720, 111 lines).
- **Used in the revise / spoken-drill slot:** Interview-ready answers (lines 721-742, 22 lines); Follow-up chains (lines 743-767, 25 lines).
- **Wrap-up material (wrap-up slot):** lines 768-818 of `08_Week8_Revision_Mocks_Checklist.md` (common mistakes, revision notes, key concepts, five revision questions, practical task, self-assessment).
- **Skip:** any new topic; Week 8 only revises. [ADVANCED] items: see the week header.

**Coding practice:** EX-SQL-04..08 (redo the hardest 5, timed 10 min each), EX-EXP-01..06 and EX-MW-01..06 (re-skim reference solutions, rebuild one from scratch).

**Interview questions to revise:** Q-EXP-01..30, Q-SQL-01..34, Q-MONGO-01..10 (answer 20 aloud); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 50 (JS + Node rapid revision); Day 48 (Docker, deployment, design practice); Day 44 (Rate limiter, notification design).

**Daily learning outcomes**

- I can write a join+group query in under 5 minutes.
- I can explain isolation anomalies without notes.
- I can design a REST endpoint set in 3 minutes.

**Completion checklist**

- [ ] Read the reading-plan sections (second pass) (Week 3, Week 4 and Week 5 / Day 1-2 revision summaries; Week 8 / Day 2 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-SQL-04..08
- [ ] Questions Q-EXP-01..30, Q-SQL-01..34, Q-MONGO-01..10 answered aloud
- [ ] Spaced revisit done (Day 50, Day 48, Day 44)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 8 / Day 3 (overall Day 52) -- Auth/security scenarios and coding exercises

**Tier:** ESSENTIAL

**Learning objectives**

- Answer scenario questions: 'how would you secure this API', 'how would you log out a JWT user'.
- Implement JWT auth + RBAC in a timed 45-minute exercise.
- Implement a rate limiter and an idempotent endpoint from scratch.

**Topics:** Auth/security scenario walkthroughs; Timed coding: JWT middleware, rate limiter, idempotency guard; Common interviewer follow-ups on security.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 20 | Read the reading-plan sections below (second pass): Week 5 revision summary; Cheat Sheet 6 - Authentication and | Reading |
| 60 | Timed rebuilds: JWT auth + RBAC (30), rate limiter (15), idempotency guard (15) | Coding |
| 25 | Spoken drill: 12 Q-SEC questions | Revision and questions |
| 15 | Weak-topic list, log, plan Day 4 | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Week 8 is a second pass over material you already read, so speeds are about 2x the first-pass speeds; each section also gets 1 min of cover-and-recite)**

| File | Section (read slot) | Lines | Line count | Est. min (second pass) |
|------|---------------------|-------|------------|------------------------|
| 05_Week5_Data_Auth_Security.md | Week 5 revision summary | 3852-3902 | 51 | 1.5 |
| 08_Week8_Revision_Mocks_Checklist.md | Cheat Sheet 6 - Authentication and Security | 829-881 | 53 | 2.0 |

- **Estimate:** 3 min reading + 2 min cover-and-recite = **5 min** against a read slot of 20 min (fits; the spare 15 min go to re-reading the weak-area sections from your Day 7 lists).
- **Used in the coding slot:** Coding drills (attempt before opening solutions) -- problem statements (08_Week8_Revision_Mocks_Checklist.md, lines 971-1001, 31 lines); Coding drills -- solutions (08_Week8_Revision_Mocks_Checklist.md, lines 1002-1295, 294 lines).
- **Used in the revise / spoken-drill slot:** Day 52 (W8 D3) - Auth/security scenarios + coding exercises (lines 819-1341, 523 lines); Interview-ready answers (lines 941-957, 17 lines); Follow-up chains (lines 958-970, 13 lines).
- **Wrap-up material (wrap-up slot):** lines 1296-1341 of `08_Week8_Revision_Mocks_Checklist.md` (common mistakes, revision notes, key concepts, five revision questions, practical task, self-assessment).
- **Skip:** any new topic; Week 8 only revises. [ADVANCED] items: see the week header.

**Coding practice:** EX-JWT-01..06 (one timed rebuild), EX-RATE-01..07 (rebuild token bucket), EX-IDEM-01..07 (rebuild one).

**Interview questions to revise:** Q-SEC-01..30 (answer 12 aloud) and Q-PROD-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 51 (Express/REST + SQL/Mongo revision); Day 49 (Week 7 weak areas); Day 45 (URL shortener, upload architecture).

**Daily learning outcomes**

- I can build JWT auth + RBAC in 45 minutes.
- I can explain SQLi/XSS/CSRF with fixes without notes.
- I can implement a token bucket in 20 minutes.

**Completion checklist**

- [ ] Read the reading-plan sections (second pass) (Week 5 / Day 3-6 and Week 6 / Day 3 revision summaries; Week 8 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-JWT-01..06
- [ ] Questions Q-SEC-01..30 answered aloud
- [ ] Spaced revisit done (Day 51, Day 49, Day 45)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 8 / Day 4 (overall Day 53) -- Debugging/incident scenarios and backend machine-coding

**Tier:** ESSENTIAL + ADVANCED

**Learning objectives**

- Walk through production incident scenarios (slow API, memory leak, DB pool exhaustion, duplicate charges, 5xx spike) with a structured method.
- Complete a 60-minute backend machine-coding task from the Week 8 / Day 4 notes.
- Practise explaining trade-offs while coding.

**Topics:** Incident method: detect, mitigate, diagnose, fix, prevent; Machine-coding task (CRUD + validation + tests under time limit); Debugging scenarios from Q-PROD and Q-PERF.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 15 | Read the reading-plan sections below (second pass): Week 6 Revision Summary; Part A - Incident diagnosis framework; Part B - Eight incident scenarios with | Reading |
| 60 | Machine-coding task, 60 min, no AI help | Coding |
| 30 | Spoken drill: 10 incident/perf scenarios from Q-PROD and Q-PERF | Revision and questions |
| 15 | Self-review code, log, plan Day 5 | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Week 8 is a second pass over material you already read, so speeds are about 2x the first-pass speeds; each section also gets 1 min of cover-and-recite)**

| File | Section (read slot) | Lines | Line count | Est. min (second pass) |
|------|---------------------|-------|------------|------------------------|
| 06_Week6_Testing_Production.md | Week 6 Revision Summary | 4599-4627 | 29 | 1.4 |
| 08_Week8_Revision_Mocks_Checklist.md | Part A - Incident diagnosis framework | 1353-1370 | 18 | 0.5 |
| 08_Week8_Revision_Mocks_Checklist.md | Part B - Eight incident scenarios with walkthroughs | 1371-1491 | 121 | 4.8 |

- **Estimate:** 7 min reading + 3 min cover-and-recite = **10 min** against a read slot of 15 min (fits; the spare 5 min go to re-reading the weak-area sections from your Day 7 lists).
- **Used in the coding slot:** Part D - Backend machine-coding (45 minutes each) (08_Week8_Revision_Mocks_Checklist.md, lines 1508-2152, 645 lines).
- **Used in the revise / spoken-drill slot:** Part C - More short scenarios (rapid-fire, answer in 30 seconds each) (lines 1492-1507, 16 lines).
- **Wrap-up material (wrap-up slot):** lines 2153-2197 of `08_Week8_Revision_Mocks_Checklist.md` (common mistakes, revision notes, key concepts, five revision questions, practical task, self-assessment).
- **Skip:** any new topic; Week 8 only revises. [ADVANCED] items: see the week header.

**Coding practice:** EX-DEBUG-01..08 (timed), plus a 60-minute machine-coding build from Part D of the Week 8 / Day 4 notes (Express + validation + one test).

**Interview questions to revise:** Q-PROD-01..20 and Q-PERF-01..22 (answer 10 scenarios aloud); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 52 (Auth/security scenarios, coding); Day 50 (JS + Node rapid revision); Day 46 (Payments, idempotency, recovery).

**Daily learning outcomes**

- I can narrate an incident investigation in 2 minutes.
- I can complete a small CRUD machine-coding task in 60 minutes.
- I can name mitigation vs root cause fix.

**Completion checklist**

- [ ] Read the reading-plan sections (second pass) (Week 6 / Day 6 revision summary; Week 8 / Day 4 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-DEBUG-01..08
- [ ] Questions Q-PROD-01..20 and Q-PERF-01..22 answered aloud
- [ ] Spaced revisit done (Day 52, Day 50, Day 46)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 8 / Day 5 (overall Day 54) -- System design revision and project explanation questions

**Tier:** ESSENTIAL

**Learning objectives**

- Redo two system designs from a blank page with the full template.
- Prepare a 3-minute and a 10-minute explanation of the Task API project.
- Prepare answers for 'what would you do differently / how would it scale / what was hard'.

**Topics:** System design template drills: rate limiter, URL shortener, payment, notification; Project walkthrough: architecture, schema, auth, transactions, tests, trade-offs; Common project follow-ups.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 15 | Read the reading-plan sections below (second pass): Week 7 revision summary; Part B - Project explanation: Task | Reading |
| 60 | Two timed system designs, 30 min each, written on paper or in a text file | Coding |
| 30 | Project pitch practice (3 and 10 minute versions) aloud + 8 Q-SD questions | Revision and questions |
| 15 | Write 5 likely follow-ups with answers, log, plan Day 6 | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Week 8 is a second pass over material you already read, so speeds are about 2x the first-pass speeds; each section also gets 1 min of cover-and-recite)**

| File | Section (read slot) | Lines | Line count | Est. min (second pass) |
|------|---------------------|-------|------------|------------------------|
| 07_Week7_System_Design.md | Week 7 revision summary | 4419-4449 | 31 | 1.1 |
| 08_Week8_Revision_Mocks_Checklist.md | Part B - Project explanation: Task Management API | 2282-2460 | 179 | 7.8 |

- **Estimate:** 9 min reading + 2 min cover-and-recite = **11 min** against a read slot of 15 min (fits; the spare 4 min go to re-reading the weak-area sections from your Day 7 lists).
- **Used in the coding slot:** Design speaking drill (10 minutes) (08_Week8_Revision_Mocks_Checklist.md, lines 2267-2281, 15 lines).
- **Used in the revise / spoken-drill slot:** Part A - System design revision (lines 2207-2266, 60 lines); Part C - Common interviewer follow-up chains (rapid reference) (lines 2461-2500, 40 lines); How to handle "I don't know" (a skill worth practicing) (lines 2501-2512, 12 lines).
- **Wrap-up material (wrap-up slot):** lines 2513-2559 of `08_Week8_Revision_Mocks_Checklist.md` (common mistakes, revision notes, key concepts, five revision questions, practical task, self-assessment).
- **Skip:** any new topic; Week 8 only revises. [ADVANCED] items: see the week header.

**Coding practice:** Timed design 1 (30 min), timed design 2 (30 min); record yourself giving the project pitch; polish README of the Task API.

**Interview questions to revise:** Q-SD-01..30 (answer 8 aloud) and project explanation questions in Week 8 / Day 5 notes; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 53 (Debugging, incidents, machine coding); Day 51 (Express/REST + SQL/Mongo revision); Day 47 (Queues, metrics, monitoring).

**Daily learning outcomes**

- I can deliver a design in 30 minutes using the template.
- I can pitch my project in 3 minutes.
- I can justify every technology choice in the project.

**Completion checklist**

- [ ] Read the reading-plan sections (second pass) (Week 7 revision summary; 12_Project_Task_API.md)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Timed design 1
- [ ] Questions Q-SD-01..30 answered aloud
- [ ] Spaced revisit done (Day 53, Day 51, Day 47)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 8 / Day 6 (overall Day 55) -- Mock interview sets 1 and 2

**Tier:** ESSENTIAL

**Learning objectives**

- Complete mock interview sets 1 and 2 from the Week 8 file under realistic conditions.
- Score yourself against the model answers.
- Identify the 3 weakest topics for Day 7.

**Topics:** Mock set 1 (JS/Node/Express/SQL focus); Mock set 2 (auth, production, system design focus); Self-scoring and gap list.

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 5 | Read the reading-plan sections below (second pass): How to run a mock (solo); Shared scoring rubric | Reading |
| 50 | Mock set 1, 50 min, spoken answers (no notes) | Revision and questions |
| 50 | Mock set 2, 50 min including the live-coding part | Coding |
| 15 | Score, rank weak topics, log, plan Day 7 | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Week 8 is a second pass over material you already read, so speeds are about 2x the first-pass speeds; each section also gets 1 min of cover-and-recite)**

| File | Section (read slot) | Lines | Line count | Est. min (second pass) |
|------|---------------------|-------|------------|------------------------|
| 08_Week8_Revision_Mocks_Checklist.md | How to run a mock (solo) | 2571-2578 | 8 | 0.3 |
| 08_Week8_Revision_Mocks_Checklist.md | Shared scoring rubric (used by all four sets) | 2579-2600 | 22 | 0.6 |

- **Estimate:** 1 min reading + 2 min cover-and-recite = **3 min** against a read slot of 5 min (fits; the spare 2 min go to re-reading the weak-area sections from your Day 7 lists).
- **Used in the coding slot:** MOCK SET 1 -- Fundamentals baseline (45 minutes, junior bar) (08_Week8_Revision_Mocks_Checklist.md, lines 2601-2786, 186 lines); MOCK SET 2 -- Scenario-based junior+ (60 minutes) (08_Week8_Revision_Mocks_Checklist.md, lines 2787-3022, 236 lines).
- **Used in the revise / spoken-drill slot:** Review procedure after each mock (20 minutes) (lines 3023-3028, 6 lines).
- **Wrap-up material (wrap-up slot):** lines 3029-3073 of `08_Week8_Revision_Mocks_Checklist.md` (common mistakes, revision notes, key concepts, five revision questions, practical task, self-assessment).
- **Skip:** any new topic; Week 8 only revises. [ADVANCED] items: see the week header.

**Coding practice:** Live-code section of each mock set (2 x 25 min).

**Interview questions to revise:** Mock set questions (drawn from all Q- prefixes); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 54 (System design + project explanation); Day 52 (Auth/security scenarios, coding); Day 48 (Docker, deployment, design practice).

**Daily learning outcomes**

- I finished two mock sets within the time limits.
- I know my weakest 3 topics.
- I can recover from a question I do not know (clarify, reason aloud, state assumptions).

**Completion checklist**

- [ ] Read the reading-plan sections (second pass) (Week 8 / Day 6 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Live-code section of each mock set
- [ ] Questions Mock set questions answered aloud
- [ ] Spaced revisit done (Day 54, Day 52, Day 48)
- [ ] Day wrap-up done (key concepts, 5 revision questions, practical coding task, self-assessment)
- [ ] Hours logged (2.0 h)

#### Week 8 / Day 7 (overall Day 56) -- Final mock, final readiness checklist, readiness assessment

**Tier:** ESSENTIAL (consolidation)

**Learning objectives**

- Complete the full final mock interview under real conditions without notes.
- Walk the final readiness checklist honestly and mark each item [OK] or [X].
- Produce a realistic readiness assessment and a post-week-8 improvement plan.

**Topics:** Full mock interview, final readiness checklist, readiness assessment, next-step plan

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 60 | Final mock set 3 (full interview simulation: spoken Q&A 35 min, coding 25 min), no notes, timed | Revision and questions |
| 20 | Score against model answers; fill in the readiness assessment table in Week 8 file | Wrap-up and tests |
| 25 | Read the reading-plan sections below (second pass): Final interview readiness checklist; Honest readiness assessment | Reading |
| 15 | Redo the one coding task you failed in the final mock | Coding |
| **120** | **Total** | |

**Reading plan (Week 8 is a second pass over material you already read, so speeds are about 2x the first-pass speeds; each section also gets 1 min of cover-and-recite)**

| File | Section (read slot) | Lines | Line count | Est. min (second pass) |
|------|---------------------|-------|------------|------------------------|
| 08_Week8_Revision_Mocks_Checklist.md | Final interview readiness checklist | 3585-3699 | 115 | 4.4 |
| 08_Week8_Revision_Mocks_Checklist.md | Honest readiness assessment | 3700-3795 | 96 | 3.9 |

- **Estimate:** 8 min reading + 2 min cover-and-recite = **10 min** against a read slot of 25 min (fits; the spare 15 min go to re-reading the weak-area sections from your Day 7 lists).
- **Used in the coding slot:** MOCK SET 3 -- Mid-level stretch (60 minutes) (08_Week8_Revision_Mocks_Checklist.md, lines 3089-3345, 257 lines); MOCK SET 4 -- Final full simulation (75 minutes) (08_Week8_Revision_Mocks_Checklist.md, lines 3346-3573, 228 lines).
- **Used in the revise / spoken-drill slot:** Mock results log (copy this table to your notes) (lines 3574-3584, 11 lines).
- **Wrap-up material (wrap-up slot):** lines 3796-3828 of `08_Week8_Revision_Mocks_Checklist.md` (common mistakes, revision notes, key concepts, five revision questions, practical task, self-assessment).
- **Skip:** MOCK SET 4 (lines 3346-3573) is an optional extra full simulation: do it only if time is left, or in Week 9 / Day 7 of the supplement track. No new topics.

**Coding practice:** Mock set 3 live-coding block, then redo the failed task. Optionally finish pending Extensions (A Redis, B jobs, C Docker, D deployment).

**Interview questions to revise:** Final mock set 3 questions; your personal 'could not explain' list from the whole 8 weeks.

**Daily learning outcomes**

- I have a written, honest readiness rating per area (JS, Node, Express/REST, SQL, auth/security, production, system design).
- I know my top 5 improvement items for the next 2-4 weeks of continued study.
- I can introduce myself, my project and my transition story in 2 minutes.

**Completion checklist**

- [ ] Final mock completed without notes
- [ ] Final readiness checklist walked, every [X] item has a follow-up note
- [ ] Readiness assessment table filled
- [ ] Project runs from a clean clone (README steps work)
- [ ] Post-week-8 plan written (top 5 items)

---

## 4. Spaced-Revision Schedule (1, 3 and 7 days)

### 4.1 Method

After you learn a topic on Day D, revisit it on **D+1**, **D+3** and **D+7**. Each revisit is short (about 3-5 minutes per topic) and is done by active recall: look only at the topic name, say what you remember, write 3 bullet points, then check against the day's Key concepts block in the week file. This fits inside the 10-minute spaced-revision slot inside each day's 'Revise' block, so it costs no extra time.

- D+1 locks the memory before it fades. D+3 repairs gaps. D+7 makes it durable.
- A Day 7 (weekly test day) is itself the D+1 to D+6 revisit for that week. Weak topics from the test become 'Week N weak areas' and are revisited using the same 1/3/7 rule after the test.
- Revisits that would fall after Day 56 are replaced by the Week 8 revision and mock days. For the optional supplement (Days 57-98) the same 1/3/7 rule continues in table 4.4, and each supplement Day 7 is the weekly revisit.
- If a revisit shows you cannot recall the topic, mark it and add it to the next Day 7 weak-area list.

### 4.2 Topic-cluster table (topic -> days revisited)

Overall day numbers (1-56). 'Later touchpoints' are extra scheduled encounters because the topic re-appears in a later day or in Week 8.

| Topic | Learned | +1 day | +3 days | +7 days | Later touchpoints |
|-------|---------|--------|---------|---------|-------------------|
| Closures, scope, hoisting | Day 1 | 2 | 4 | 8 | 13, 50 |
| this, prototypes | Day 2 | 3 | 5 | 9 | 50 |
| Objects, arrays, references | Day 3 | 4 | 6 | 10 | 50 |
| Promises and async/await | Day 4 | 5 | 7 | 11 | 6, 50 |
| Event loop, microtasks | Day 5 | 6 | 8 | 12 | 9, 50 |
| Promise combinators, async mistakes | Day 6 | 7 | 9 | 13 | 50 |
| Node architecture, V8, libuv | Day 8 | 9 | 11 | 15 | 50 |
| Event loop phases, thread pool | Day 9 | 10 | 12 | 16 | 50 |
| Workers, CJS/ESM, process, Buffer | Day 10 | 11 | 13 | 17 | 50 |
| fs and streams | Day 11 | 12 | 14 | 18 | 12, 50 |
| Backpressure, pipeline, EventEmitter | Day 12 | 13 | 15 | 19 | 50 |
| Memory, GC, leaks | Day 13 | 14 | 16 | 20 | 41, 50 |
| HTTP, status codes, cookies | Day 15 | 16 | 18 | 22 | 51 |
| REST design, Express layers | Day 16 | 17 | 19 | 23 | 51 |
| Middleware, validation | Day 17 | 18 | 20 | 24 | 51 |
| Error handling, auth middleware | Day 18 | 19 | 21 | 25 | 31, 51 |
| Pagination, filtering, versioning | Day 19 | 20 | 22 | 26 | 27, 51 |
| Uploads, OpenAPI, CORS | Day 20 | 21 | 23 | 27 | 33, 51 |
| Relational basics, CRUD | Day 22 | 23 | 25 | 29 | 51 |
| Joins, GROUP BY, subqueries | Day 23 | 24 | 26 | 30 | 51 |
| Indexes, normalization | Day 24 | 25 | 27 | 31 | 27, 51 |
| Transactions, ACID, isolation | Day 25 | 26 | 28 | 32 | 29, 51 |
| Deadlocks, locking, pooling | Day 26 | 27 | 29 | 33 | 29, 41 |
| EXPLAIN, query optimization | Day 27 | 28 | 30 | 34 | 41, 51 |
| mysql2, ORM vs raw SQL | Day 29 | 30 | 32 | 36 | 51 |
| MongoDB, SQL vs NoSQL | Day 30 | 31 | 33 | 37 | 51 |
| bcrypt, JWT | Day 31 | 32 | 34 | 38 | 52 |
| Refresh tokens, sessions, RBAC | Day 32 | 33 | 35 | 39 | 52 |
| SQLi, XSS, CSRF, CORS, rate limiting | Day 33 | 34 | 36 | 40 | 44, 52 |
| Secrets, secure config | Day 34 | 35 | 37 | 41 | 52 |
| Testing, Supertest, mocking | Day 36 | 37 | 39 | 43 | 53 |
| Logging, correlation IDs | Day 37 | 38 | 40 | 44 | 53 |
| Retries, backoff, idempotency | Day 38 | 39 | 41 | 45 | 46, 52 |
| Redis, caching, invalidation | Day 39 | 40 | 42 | 46 | 43, 53 |
| Queues, jobs, graceful shutdown | Day 40 | 41 | 43 | 47 | 47, 53 |
| Slow API debugging, load testing | Day 41 | 42 | 44 | 48 | 53 |
| Architecture, scaling basics | Day 43 | 44 | 46 | 50 | 54 |
| Rate limiter, notification design | Day 44 | 45 | 47 | 51 | 52, 54 |
| URL shortener, upload design | Day 45 | 46 | 48 | 52 | 54 |
| Payments, idempotency, recovery | Day 46 | 47 | 49 | 53 | 52, 54 |
| Message queues, metrics | Day 47 | 48 | 50 | 54 | 54 |
| Docker, deployment | Day 48 | 49 | 51 | 55 | 54 |
| Part 13: Lab machine, shell, permissions, exit codes | Day 57 | 58 | 60 | 64 | 63 |
| Part 13: Text tools, processes, signals | Day 58 | 59 | 61 | 65 | 63 |
| Part 13: Port in use, Docker networking | Day 59 | 60 | 62 | 66 | 63 |
| Part 13: TCP states and HTTP on the wire | Day 60 | 61 | 63 | 67 | 63 |
| Part 13: DNS, TLS, localhost vs 0.0.0.0 | Day 61 | 62 | 64 | 68 | 63 |
| Part 14: B+tree, clustered and covering index | Day 62 | 63 | 65 | 69 | 63 |
| Part 14: Buffer pool, connection pooling | Day 64 | 65 | 67 | 71 | 70 |
| Part 14: WAL, redo/binlog, MVCC | Day 65 | 66 | 68 | 72 | 70 |
| Part 14: Replication and query planner | Day 66 | 67 | 69 | 73 | 70 |
| Part 14: DB bottleneck triage | Day 67 | 68 | 70 | 74 | 70 |
| Part 15: Metrics: RED/USE, Prometheus | Day 68 | 69 | 71 | 75 | 70 |
| Part 15: Tracing with OpenTelemetry | Day 69 | 70 | 72 | 76 | 70 |
| Part 15: SLI/SLO, burn-rate alerts | Day 71 | 72 | 74 | 78 | 77 |
| Part 15: CI/CD and deployment strategies | Day 72 | 73 | 75 | 79 | 77 |
| Part 15: AWS basics and incident questions | Day 73 | 74 | 76 | 80 | 77 |
| Part 16: Chaos setup, kill MySQL | Day 74 | 75 | 77 | 81 | 77 |
| Part 16: Kill Redis, duplicates and DLQ | Day 75 | 76 | 78 | 82 | 77 |
| Part 16: Slow dependency and timeouts | Day 76 | 77 | 79 | 83 | 77 |
| Part 16: Pool exhaustion, rolling restart | Day 78 | 79 | 81 | 85 | 84 |
| Part 16: Incident review, Part 12 fixes | Day 79 | 80 | 82 | 86 | 84 |
| Part 17: Capstone overview and ADRs | Day 80 | 81 | 83 | 87 | 84 |
| Part 17: Capstone schema, auth, orders | Day 81 | 82 | 84 | 88 | 84 |
| Part 17: Idempotent POST /payments | Day 82 | 83 | 85 | 89 | 84 |
| Part 17: Outbox, worker, retries, DLQ | Day 83 | 84 | 86 | 90 | 84 |
| Part 17: Webhooks, state machine, ledger | Day 85 | 86 | 88 | 92 | 91 |
| Part 17: Reconciliation and project pitch | Day 86 | 87 | 89 | 93 | 91 |
| Part 18: URL shortener skeleton and auth | Day 87 | 88 | 90 | 94 | 91 |
| Part 18: Create links and codes | Day 88 | 89 | 91 | 95 | 91 |
| Part 18: Redirect, cache-aside, rate limit | Day 89 | 90 | 92 | 96 | 91 |
| Part 18: Tests, Docker, load test, Q&A | Day 90 | 91 | 93 | 97 | 91 |
| Part 19: Races and lost updates | Day 92 | 93 | 95 | 99 | 98 |
| Part 19: CAP, idempotency, saga | Day 93 | 94 | 96 | 100 | 98 |
| Part 19: Capacity and SLO maths | Day 94 | 95 | 97 | 101 | 98 |
| Part 20: Story, resume, bullets | Day 95 | 96 | 98 | 102 | 98 |
| Part 20: Portfolio, demo, LinkedIn | Day 96 | 97 | 99 | 103 | 98 |
| Part 20: Interview loop and STAR stories | Day 97 | 98 | 100 | 104 | 98 |

Supplement rows above: '+1', '+3', '+7' are overall day numbers; when one lands on a supplement Day 7 (63, 70, 77, 84, 91, 98) it is covered by that Day 7's spaced-revisit slot; when it lands beyond Day 98 (for example Day 95 + 7) it is covered by the Day 98 final check. The 'Later touchpoints' column lists the next Day 7 of the supplement.

### 4.3 Day-by-day revisit table

For each day, the 'Revisit today' column tells you which earlier days' key concepts to recall in the 10-minute spaced slot. Day 7s use their own template (see 2.5).

| Day | Week/Day | Learn today | Revisit (D-1) | Revisit (D-3) | Revisit (D-7) |
|-----|----------|-------------|---------------|---------------|---------------|
| 1 | W1 D1 | Closures, scope, hoisting | -- | -- | -- |
| 2 | W1 D2 | this and prototypes | Day 1: Closures, scope, hoisting | -- | -- |
| 3 | W1 D3 | Objects, arrays, references | Day 2: this and prototypes | -- | -- |
| 4 | W1 D4 | Promises and async/await | Day 3: Objects, arrays, references | Day 1: Closures, scope, hoisting | -- |
| 5 | W1 D5 | Event loop and microtasks | Day 4: Promises and async/await | Day 2: this and prototypes | -- |
| 6 | W1 D6 | Promise combinators, async mistakes | Day 5: Event loop and microtasks | Day 3: Objects, arrays, references | -- |
| 7 | W1 D7 | Week 1 weak areas | Day 6: Promise combinators, async mistakes | Day 4: Promises and async/await | -- |
| 8 | W2 D1 | Node architecture, V8, libuv | Day 7: Week 1 weak areas | Day 5: Event loop and microtasks | Day 1: Closures, scope, hoisting |
| 9 | W2 D2 | Event loop phases, thread pool | Day 8: Node architecture, V8, libuv | Day 6: Promise combinators, async mistakes | Day 2: this and prototypes |
| 10 | W2 D3 | Workers, CJS/ESM, process, Buffer | Day 9: Event loop phases, thread pool | Day 7: Week 1 weak areas | Day 3: Objects, arrays, references |
| 11 | W2 D4 | fs and streams | Day 10: Workers, CJS/ESM, process, Buffer | Day 8: Node architecture, V8, libuv | Day 4: Promises and async/await |
| 12 | W2 D5 | Backpressure, pipeline, EventEmitter | Day 11: fs and streams | Day 9: Event loop phases, thread pool | Day 5: Event loop and microtasks |
| 13 | W2 D6 | Memory, GC, leaks | Day 12: Backpressure, pipeline, EventEmitter | Day 10: Workers, CJS/ESM, process, Buffer | Day 6: Promise combinators, async mistakes |
| 14 | W2 D7 | Week 2 weak areas | Day 13: Memory, GC, leaks | Day 11: fs and streams | Day 7: Week 1 weak areas |
| 15 | W3 D1 | HTTP basics | Day 14: Week 2 weak areas | Day 12: Backpressure, pipeline, EventEmitter | Day 8: Node architecture, V8, libuv |
| 16 | W3 D2 | REST design, Express layers | Day 15: HTTP basics | Day 13: Memory, GC, leaks | Day 9: Event loop phases, thread pool |
| 17 | W3 D3 | Middleware and validation | Day 16: REST design, Express layers | Day 14: Week 2 weak areas | Day 10: Workers, CJS/ESM, process, Buffer |
| 18 | W3 D4 | Error handler, auth middleware | Day 17: Middleware and validation | Day 15: HTTP basics | Day 11: fs and streams |
| 19 | W3 D5 | Pagination, filter, sort, versioning | Day 18: Error handler, auth middleware | Day 16: REST design, Express layers | Day 12: Backpressure, pipeline, EventEmitter |
| 20 | W3 D6 | Uploads, OpenAPI, CORS | Day 19: Pagination, filter, sort, versioning | Day 17: Middleware and validation | Day 13: Memory, GC, leaks |
| 21 | W3 D7 | Week 3 weak areas | Day 20: Uploads, OpenAPI, CORS | Day 18: Error handler, auth middleware | Day 14: Week 2 weak areas |
| 22 | W4 D1 | Relational basics, CRUD | Day 21: Week 3 weak areas | Day 19: Pagination, filter, sort, versioning | Day 15: HTTP basics |
| 23 | W4 D2 | Joins, GROUP BY, subqueries | Day 22: Relational basics, CRUD | Day 20: Uploads, OpenAPI, CORS | Day 16: REST design, Express layers |
| 24 | W4 D3 | Normalization, indexes | Day 23: Joins, GROUP BY, subqueries | Day 21: Week 3 weak areas | Day 17: Middleware and validation |
| 25 | W4 D4 | Transactions, ACID, isolation | Day 24: Normalization, indexes | Day 22: Relational basics, CRUD | Day 18: Error handler, auth middleware |
| 26 | W4 D5 | Deadlocks, locks, pooling | Day 25: Transactions, ACID, isolation | Day 23: Joins, GROUP BY, subqueries | Day 19: Pagination, filter, sort, versioning |
| 27 | W4 D6 | EXPLAIN, optimization, pagination | Day 26: Deadlocks, locks, pooling | Day 24: Normalization, indexes | Day 20: Uploads, OpenAPI, CORS |
| 28 | W4 D7 | Week 4 weak areas | Day 27: EXPLAIN, optimization, pagination | Day 25: Transactions, ACID, isolation | Day 21: Week 3 weak areas |
| 29 | W5 D1 | mysql2, pool, txn in code, ORM | Day 28: Week 4 weak areas | Day 26: Deadlocks, locks, pooling | Day 22: Relational basics, CRUD |
| 30 | W5 D2 | MongoDB, SQL vs NoSQL | Day 29: mysql2, pool, txn in code, ORM | Day 27: EXPLAIN, optimization, pagination | Day 23: Joins, GROUP BY, subqueries |
| 31 | W5 D3 | Signup/login, bcrypt, JWT | Day 30: MongoDB, SQL vs NoSQL | Day 28: Week 4 weak areas | Day 24: Normalization, indexes |
| 32 | W5 D4 | Refresh tokens, sessions, RBAC | Day 31: Signup/login, bcrypt, JWT | Day 29: mysql2, pool, txn in code, ORM | Day 25: Transactions, ACID, isolation |
| 33 | W5 D5 | SQLi, XSS, CSRF, CORS, rate limit | Day 32: Refresh tokens, sessions, RBAC | Day 30: MongoDB, SQL vs NoSQL | Day 26: Deadlocks, locks, pooling |
| 34 | W5 D6 | Secrets, secure config, mistakes | Day 33: SQLi, XSS, CSRF, CORS, rate limit | Day 31: Signup/login, bcrypt, JWT | Day 27: EXPLAIN, optimization, pagination |
| 35 | W5 D7 | Week 5 weak areas | Day 34: Secrets, secure config, mistakes | Day 32: Refresh tokens, sessions, RBAC | Day 28: Week 4 weak areas |
| 36 | W6 D1 | Testing, Supertest, mocking | Day 35: Week 5 weak areas | Day 33: SQLi, XSS, CSRF, CORS, rate limit | Day 29: mysql2, pool, txn in code, ORM |
| 37 | W6 D2 | Logging, correlation IDs | Day 36: Testing, Supertest, mocking | Day 34: Secrets, secure config, mistakes | Day 30: MongoDB, SQL vs NoSQL |
| 38 | W6 D3 | Retries, backoff, idempotency | Day 37: Logging, correlation IDs | Day 35: Week 5 weak areas | Day 31: Signup/login, bcrypt, JWT |
| 39 | W6 D4 | Redis, caching, invalidation | Day 38: Retries, backoff, idempotency | Day 36: Testing, Supertest, mocking | Day 32: Refresh tokens, sessions, RBAC |
| 40 | W6 D5 | Queues, jobs, graceful shutdown | Day 39: Redis, caching, invalidation | Day 37: Logging, correlation IDs | Day 33: SQLi, XSS, CSRF, CORS, rate limit |
| 41 | W6 D6 | Slow API debugging, load testing | Day 40: Queues, jobs, graceful shutdown | Day 38: Retries, backoff, idempotency | Day 34: Secrets, secure config, mistakes |
| 42 | W6 D7 | Week 6 weak areas | Day 41: Slow API debugging, load testing | Day 39: Redis, caching, invalidation | Day 35: Week 5 weak areas |
| 43 | W7 D1 | Architecture and scaling basics | Day 42: Week 6 weak areas | Day 40: Queues, jobs, graceful shutdown | Day 36: Testing, Supertest, mocking |
| 44 | W7 D2 | Rate limiter, notification design | Day 43: Architecture and scaling basics | Day 41: Slow API debugging, load testing | Day 37: Logging, correlation IDs |
| 45 | W7 D3 | URL shortener, upload architecture | Day 44: Rate limiter, notification design | Day 42: Week 6 weak areas | Day 38: Retries, backoff, idempotency |
| 46 | W7 D4 | Payments, idempotency, recovery | Day 45: URL shortener, upload architecture | Day 43: Architecture and scaling basics | Day 39: Redis, caching, invalidation |
| 47 | W7 D5 | Queues, metrics, monitoring | Day 46: Payments, idempotency, recovery | Day 44: Rate limiter, notification design | Day 40: Queues, jobs, graceful shutdown |
| 48 | W7 D6 | Docker, deployment, design practice | Day 47: Queues, metrics, monitoring | Day 45: URL shortener, upload architecture | Day 41: Slow API debugging, load testing |
| 49 | W7 D7 | Week 7 weak areas | Day 48: Docker, deployment, design practice | Day 46: Payments, idempotency, recovery | Day 42: Week 6 weak areas |
| 50 | W8 D1 | JS + Node rapid revision | Day 49: Week 7 weak areas | Day 47: Queues, metrics, monitoring | Day 43: Architecture and scaling basics |
| 51 | W8 D2 | Express/REST + SQL/Mongo revision | Day 50: JS + Node rapid revision | Day 48: Docker, deployment, design practice | Day 44: Rate limiter, notification design |
| 52 | W8 D3 | Auth/security scenarios, coding | Day 51: Express/REST + SQL/Mongo revision | Day 49: Week 7 weak areas | Day 45: URL shortener, upload architecture |
| 53 | W8 D4 | Debugging, incidents, machine coding | Day 52: Auth/security scenarios, coding | Day 50: JS + Node rapid revision | Day 46: Payments, idempotency, recovery |
| 54 | W8 D5 | System design + project explanation | Day 53: Debugging, incidents, machine coding | Day 51: Express/REST + SQL/Mongo revision | Day 47: Queues, metrics, monitoring |
| 55 | W8 D6 | Mock sets 1-2 | Day 54: System design + project explanation | Day 52: Auth/security scenarios, coding | Day 48: Docker, deployment, design practice |
| 56 | W8 D7 | Final mock + readiness | Day 55: Mock sets 1-2 | Day 53: Debugging, incidents, machine coding | Day 49: Week 7 weak areas |

Notes: on Day 1 nothing is due. Days 2-3 only have a D-1 revisit, and so on. On Day 7 of a week the weekly test replaces the individual revisits.

### 4.4 Day-by-day revisit table for the supplement (Days 57-98)

Same rule as 4.3. For Days 57-62 the D-3 and D-7 slots point into the last days of the core plan (the readiness material), which is a deliberate bridge: the first week of the supplement keeps the core weak areas alive. Supplement Day 7s use the weekly template in 6.5 to 6.10.

| Day | Supp. Week/Day | Learn today | Revisit (D-1) | Revisit (D-3) | Revisit (D-7) |
|-----|----------------|-------------|---------------|---------------|---------------|
| 57 | S9 D1 | Part 13: Lab machine, shell, permissions, exit codes | Day 56: Final mock + readiness | Day 54: System design + project explanation | Day 50: JS + Node rapid revision |
| 58 | S9 D2 | Part 13: Text tools, processes, signals | Day 57: Part 13: Lab machine, shell, permissions, exit codes | Day 55: Mock sets 1-2 | Day 51: Express/REST + SQL/Mongo revision |
| 59 | S9 D3 | Part 13: Port in use, Docker networking | Day 58: Part 13: Text tools, processes, signals | Day 56: Final mock + readiness | Day 52: Auth/security scenarios, coding |
| 60 | S9 D4 | Part 13: TCP states and HTTP on the wire | Day 59: Part 13: Port in use, Docker networking | Day 57: Part 13: Lab machine, shell, permissions, exit codes | Day 53: Debugging, incidents, machine coding |
| 61 | S9 D5 | Part 13: DNS, TLS, localhost vs 0.0.0.0 | Day 60: Part 13: TCP states and HTTP on the wire | Day 58: Part 13: Text tools, processes, signals | Day 54: System design + project explanation |
| 62 | S9 D6 | Part 14: B+tree, clustered and covering index | Day 61: Part 13: DNS, TLS, localhost vs 0.0.0.0 | Day 59: Part 13: Port in use, Docker networking | Day 55: Mock sets 1-2 |
| 63 | S9 D7 | Week 9 supplement weak areas | Day 62: Part 14: B+tree, clustered and covering index | Day 60: Part 13: TCP states and HTTP on the wire | Day 56: Final mock + readiness |
| 64 | S10 D1 | Part 14: Buffer pool, connection pooling | Day 63: Week 9 supplement weak areas | Day 61: Part 13: DNS, TLS, localhost vs 0.0.0.0 | Day 57: Part 13: Lab machine, shell, permissions, exit codes |
| 65 | S10 D2 | Part 14: WAL, redo/binlog, MVCC | Day 64: Part 14: Buffer pool, connection pooling | Day 62: Part 14: B+tree, clustered and covering index | Day 58: Part 13: Text tools, processes, signals |
| 66 | S10 D3 | Part 14: Replication and query planner | Day 65: Part 14: WAL, redo/binlog, MVCC | Day 63: Week 9 supplement weak areas | Day 59: Part 13: Port in use, Docker networking |
| 67 | S10 D4 | Part 14: DB bottleneck triage | Day 66: Part 14: Replication and query planner | Day 64: Part 14: Buffer pool, connection pooling | Day 60: Part 13: TCP states and HTTP on the wire |
| 68 | S10 D5 | Part 15: Metrics: RED/USE, Prometheus | Day 67: Part 14: DB bottleneck triage | Day 65: Part 14: WAL, redo/binlog, MVCC | Day 61: Part 13: DNS, TLS, localhost vs 0.0.0.0 |
| 69 | S10 D6 | Part 15: Tracing with OpenTelemetry | Day 68: Part 15: Metrics: RED/USE, Prometheus | Day 66: Part 14: Replication and query planner | Day 62: Part 14: B+tree, clustered and covering index |
| 70 | S10 D7 | Week 10 supplement weak areas | Day 69: Part 15: Tracing with OpenTelemetry | Day 67: Part 14: DB bottleneck triage | Day 63: Week 9 supplement weak areas |
| 71 | S11 D1 | Part 15: SLI/SLO, burn-rate alerts | Day 70: Week 10 supplement weak areas | Day 68: Part 15: Metrics: RED/USE, Prometheus | Day 64: Part 14: Buffer pool, connection pooling |
| 72 | S11 D2 | Part 15: CI/CD and deployment strategies | Day 71: Part 15: SLI/SLO, burn-rate alerts | Day 69: Part 15: Tracing with OpenTelemetry | Day 65: Part 14: WAL, redo/binlog, MVCC |
| 73 | S11 D3 | Part 15: AWS basics and incident questions | Day 72: Part 15: CI/CD and deployment strategies | Day 70: Week 10 supplement weak areas | Day 66: Part 14: Replication and query planner |
| 74 | S11 D4 | Part 16: Chaos setup, kill MySQL | Day 73: Part 15: AWS basics and incident questions | Day 71: Part 15: SLI/SLO, burn-rate alerts | Day 67: Part 14: DB bottleneck triage |
| 75 | S11 D5 | Part 16: Kill Redis, duplicates and DLQ | Day 74: Part 16: Chaos setup, kill MySQL | Day 72: Part 15: CI/CD and deployment strategies | Day 68: Part 15: Metrics: RED/USE, Prometheus |
| 76 | S11 D6 | Part 16: Slow dependency and timeouts | Day 75: Part 16: Kill Redis, duplicates and DLQ | Day 73: Part 15: AWS basics and incident questions | Day 69: Part 15: Tracing with OpenTelemetry |
| 77 | S11 D7 | Week 11 supplement weak areas | Day 76: Part 16: Slow dependency and timeouts | Day 74: Part 16: Chaos setup, kill MySQL | Day 70: Week 10 supplement weak areas |
| 78 | S12 D1 | Part 16: Pool exhaustion, rolling restart | Day 77: Week 11 supplement weak areas | Day 75: Part 16: Kill Redis, duplicates and DLQ | Day 71: Part 15: SLI/SLO, burn-rate alerts |
| 79 | S12 D2 | Part 16: Incident review, Part 12 fixes | Day 78: Part 16: Pool exhaustion, rolling restart | Day 76: Part 16: Slow dependency and timeouts | Day 72: Part 15: CI/CD and deployment strategies |
| 80 | S12 D3 | Part 17: Capstone overview and ADRs | Day 79: Part 16: Incident review, Part 12 fixes | Day 77: Week 11 supplement weak areas | Day 73: Part 15: AWS basics and incident questions |
| 81 | S12 D4 | Part 17: Capstone schema, auth, orders | Day 80: Part 17: Capstone overview and ADRs | Day 78: Part 16: Pool exhaustion, rolling restart | Day 74: Part 16: Chaos setup, kill MySQL |
| 82 | S12 D5 | Part 17: Idempotent POST /payments | Day 81: Part 17: Capstone schema, auth, orders | Day 79: Part 16: Incident review, Part 12 fixes | Day 75: Part 16: Kill Redis, duplicates and DLQ |
| 83 | S12 D6 | Part 17: Outbox, worker, retries, DLQ | Day 82: Part 17: Idempotent POST /payments | Day 80: Part 17: Capstone overview and ADRs | Day 76: Part 16: Slow dependency and timeouts |
| 84 | S12 D7 | Week 12 supplement weak areas | Day 83: Part 17: Outbox, worker, retries, DLQ | Day 81: Part 17: Capstone schema, auth, orders | Day 77: Week 11 supplement weak areas |
| 85 | S13 D1 | Part 17: Webhooks, state machine, ledger | Day 84: Week 12 supplement weak areas | Day 82: Part 17: Idempotent POST /payments | Day 78: Part 16: Pool exhaustion, rolling restart |
| 86 | S13 D2 | Part 17: Reconciliation and project pitch | Day 85: Part 17: Webhooks, state machine, ledger | Day 83: Part 17: Outbox, worker, retries, DLQ | Day 79: Part 16: Incident review, Part 12 fixes |
| 87 | S13 D3 | Part 18: URL shortener skeleton and auth | Day 86: Part 17: Reconciliation and project pitch | Day 84: Week 12 supplement weak areas | Day 80: Part 17: Capstone overview and ADRs |
| 88 | S13 D4 | Part 18: Create links and codes | Day 87: Part 18: URL shortener skeleton and auth | Day 85: Part 17: Webhooks, state machine, ledger | Day 81: Part 17: Capstone schema, auth, orders |
| 89 | S13 D5 | Part 18: Redirect, cache-aside, rate limit | Day 88: Part 18: Create links and codes | Day 86: Part 17: Reconciliation and project pitch | Day 82: Part 17: Idempotent POST /payments |
| 90 | S13 D6 | Part 18: Tests, Docker, load test, Q&A | Day 89: Part 18: Redirect, cache-aside, rate limit | Day 87: Part 18: URL shortener skeleton and auth | Day 83: Part 17: Outbox, worker, retries, DLQ |
| 91 | S13 D7 | Week 13 supplement weak areas | Day 90: Part 18: Tests, Docker, load test, Q&A | Day 88: Part 18: Create links and codes | Day 84: Week 12 supplement weak areas |
| 92 | S14 D1 | Part 19: Races and lost updates | Day 91: Week 13 supplement weak areas | Day 89: Part 18: Redirect, cache-aside, rate limit | Day 85: Part 17: Webhooks, state machine, ledger |
| 93 | S14 D2 | Part 19: CAP, idempotency, saga | Day 92: Part 19: Races and lost updates | Day 90: Part 18: Tests, Docker, load test, Q&A | Day 86: Part 17: Reconciliation and project pitch |
| 94 | S14 D3 | Part 19: Capacity and SLO maths | Day 93: Part 19: CAP, idempotency, saga | Day 91: Week 13 supplement weak areas | Day 87: Part 18: URL shortener skeleton and auth |
| 95 | S14 D4 | Part 20: Story, resume, bullets | Day 94: Part 19: Capacity and SLO maths | Day 92: Part 19: Races and lost updates | Day 88: Part 18: Create links and codes |
| 96 | S14 D5 | Part 20: Portfolio, demo, LinkedIn | Day 95: Part 20: Story, resume, bullets | Day 93: Part 19: CAP, idempotency, saga | Day 89: Part 18: Redirect, cache-aside, rate limit |
| 97 | S14 D6 | Part 20: Interview loop and STAR stories | Day 96: Part 20: Portfolio, demo, LinkedIn | Day 94: Part 19: Capacity and SLO maths | Day 90: Part 18: Tests, Docker, load test, Q&A |
| 98 | S14 D7 | Week 14 supplement weak areas | Day 97: Part 20: Interview loop and STAR stories | Day 95: Part 20: Story, resume, bullets | Day 91: Week 13 supplement weak areas |

Notes: the Day 7 rows replace the individual revisits with the weekly assessment. If you reorder parts (6.2), keep the 1/3/7 offsets and rewrite the 'Learn today' labels; the offsets, not the topic names, are what matter.

---

## 5. 'If You Fall Behind' Triage Rule

Falling behind is normal (work, travel, illness). The goal is to reach Week 8 with the ESSENTIAL material solid, not to cover every line.

### 5.1 Decision table

| Situation | What to do |
|-----------|------------|
| Missed 1 day | Do not double up. Skip the missed day's coding exercise extras and read only its ESSENTIAL notes inside the Day 7 catch-up blocks (20 min read + 15 min code) and shorten the weekly test review. |
| Missed 2-3 days in a week | On each missed day: read the ESSENTIAL parts only (25 min), do one coding task (20 min), answer the day's question IDs aloud (15 min). Do these across the next days by cutting the 'code' block of those days by 10 min each. Skip all ADVANCED items of the week. Still take the weekly test, but accept 60 percent. |
| Missed 4-6 days (about a week) | Do not restart the week. Drop the entire Week's ADVANCED list and all project Extensions. Merge the missed days into two 'compressed' days: 60 min read-ESSENTIAL, 40 min code, 20 min questions. Take the next Day 7 as a catch-up day and postpone its test by one day. |
| Missed more than a week | Use the week 'never skip' lists in 5.2 only. Treat Weeks 1-2 as a 3-day crash revision if you already know JS well. Protect Weeks 3-5 and Week 8 mocks; compress Weeks 6-7 to ESSENTIAL only. Be honest: you may need extra weeks, and that is fine. |
| Weekly test below 70 percent | Do not move on yet. Use the 'catch-up plan' at the end of that week's file: re-read the weak sections, redo failed exercises, retake only the failed questions the next day before starting the new week (counts as one missed day). |
| Ahead of schedule | Do not start next week's topics. Use extra time on the project, mock explaining aloud, ADVANCED items and the question-bank questions beyond the assigned ranges. |

### 5.2 Per-week skip and never-skip lists

| Week | Never skip (ESSENTIAL core) | Skip first (ADVANCED) |
|------|-----------------------------|------------------------|
| 1 | Closures, this binding rules, promise chaining + error propagation, event loop order (sync -> nextTick/microtask -> macrotask), Promise.all vs allSettled. | Prototype-chain edge cases (Object.create(null), mixins), Promise.any AggregateError details, structuredClone edge cases. |
| 2 | Event loop phases, blocking vs non-blocking, thread pool vs OS polling, CommonJS vs ESM, streams + backpressure, EventEmitter, common memory-leak causes. | V8 hidden classes / JIT details, worker_threads message-port internals, heap snapshot reading beyond the basics. |
| 3 | HTTP lifecycle and status codes, REST design, middleware order, validation, centralized error handler, auth middleware, pagination, CORS. | OpenAPI tooling details, API versioning strategies beyond URL versioning, multipart streaming internals. |
| 4 | JOINs, GROUP BY/HAVING, indexes + composite index leftmost rule, ACID, isolation levels + anomalies, pooling, EXPLAIN basics, keyset vs offset pagination. | Gap-lock details, MVCC internals depth, covering-index micro-optimizations, optimizer hints. |
| 5 | Parameterized queries, transactions in code, bcrypt, JWT verification, access vs refresh tokens, authn vs authz, SQL injection, XSS, CSRF, CORS, rate limiting. | MongoDB aggregation beyond $match/$group/$lookup, CSRF token variants, ORM internals. |
| 6 | Unit vs integration tests + mocking, structured logs + correlation IDs, timeouts/retries/backoff, idempotency keys, cache-aside + invalidation, graceful shutdown. | Advanced queue features (priorities, rate-limited workers), flame-graph reading, distributed tracing. |
| 7 | Simple design first, rate limiter, URL shortener, payment + idempotency flow, queues for async work, caching/DB scaling, basic Docker. | Kubernetes, service mesh, consensus algorithms, multi-region replication. |
| 8 | Mock sets 1-3, project explanation, rapid revision of your weakest two weeks, readiness checklist. | New topics. Week 8 is consolidation only -- do not start new material. |

### 5.3 Recovery rules

1. **Skip order when time is short:** (a) ADVANCED notes, (b) project Extensions A-D, (c) second and third exercise in a group, (d) the second half of a question-ID range, (e) only then ESSENTIAL reading depth. Never skip the daily wrap-up recall (the 20-minute block) -- it is where retention happens.
2. **Never skip the weekly test.** Even a rushed 30-minute attempt tells you where the gaps are.
3. **Protect these 10 topics above all** (highest interview frequency): closures + event loop + promises; Node event loop and thread pool vs OS I/O; streams and backpressure; Express middleware and error handling; REST/status codes; SQL joins; indexes; transactions and isolation levels; JWT + auth + security basics; idempotency and caching basics.
4. **Spaced revisits shrink, they do not vanish.** When behind, do only the D-1 revisit (3 minutes) each day and rely on Day 7 for the rest.
5. **Week 8 is not catch-up for Weeks 1-7.** If you reach Week 8 with big unfinished areas, spend Week 8 Day 1-5 as targeted study for the weakest two areas using the same minute structure, and do mock sets 1-2 on Day 6 anyway. A realistic partial mock is more valuable than a perfect revision of everything.
6. **Log and decide, do not guilt.** At every Day 7, write: hours done this week (target 14), items skipped, and the one thing you will fix next week. Adjust the plan using the table above rather than abandoning it.

### 5.4 Supplement triage (Weeks 9-14)

The supplement is optional, so falling behind there never blocks interview readiness. Rules:

1. **Never let the supplement eat the core.** If you are still repairing core weak areas after Week 8 (a readiness score under 70 percent in any area), spend the supplement days on those areas first and start Part 13 later.
2. **Skip order inside a supplement day:** (a) the Skim-only items, (b) the second half of the question range, (c) optional lab extras, (d) only then lab depth. Never skip the wrap-up recall or the Day 7 assessment.
3. **Missed 1-2 days:** use the Day 7 catch-up slots (20 min read + 15 min lab) for the missed modules; do not double up.
4. **Missed more than 3 days in a week:** drop the whole week's Day 7 assessment to a 20-minute version, do not drop the Q-ID practice; shift the remaining weeks by that many days.
5. **Target date is close (interview in under 3 weeks):** use the 'urgent' row of the decision table in 6.2 instead of the default order.
6. **Assessment under 70 percent on a part:** redo the weakest module of that part before moving on; this costs one supplement day.

---

## 6. Optional Supplement Track: Weeks 9-14 (Days 57-98)

**OPTIONAL. Do this only after the core 56 days (or in parallel with job applications once Week 8 is done).** The core 56 days already give a junior-to-mid interview base: JavaScript and Node internals, Express/REST, MySQL, auth/security, testing and production basics, system design cases, and four mock sets. The supplement does not redo that. It closes the gaps found by comparing the plan with `h:\Node\90-day-backend-engineer-roadmap.md`: Linux/networking, database internals, observability and cloud, chaos testing, a serious payments project, a finished URL shortener, concurrency and distributed-systems depth, and career material.

### 6.1 What the supplement is, and the gap map against the 90-day roadmap

- **Format:** same as the core: each day is a `####` block with learning objectives, a timed 120-minute table, a reading plan with real `## ` module headings and line ranges, lab / build steps, question IDs by their real prefixes (Q-LNX, Q-DBI, Q-OBS, CH-Q, CAP-Q, Q-URL, Q-CONC, Q-CAR), outcomes and a checklist. Each supplement Day 7 is revision plus the part assessment.
- **Honest sizing:** the 8 parts hold about 184 hours of material (their own hours tables). The track has 36 content days x 2 h = 72 h plus 6 Day-7 revision days = 84 h. It therefore selects and defers; section 6.3 shows what is covered, what is cut, and what you can add later.
- **Read slots:** supplement parts are lab-style, so the read slot covers only prose (words / 150 plus 2 minutes of recall per module); the code blocks are the commands you run in the lab slot. Sections that are question banks or assessments are used in the revise / assessment slots and are not counted as reading.

| Roadmap block | Core plan coverage (honest) | Supplement part and days | Gap that remains after the supplement |
|---------------|-----------------------------|--------------------------|---------------------------------------|
| Days 1-7 / 8-14: language, HTTP | Core Weeks 1-3 (JS, Node internals, HTTP, Express) | -- | None for a junior bar |
| "Linux and the command line" (added block, Days 8-14) | Only Docker/deployment basics in Week 7 / Day 6 | Part 13 (Days 57-61) | sudo/systemd/ssh depth (Module 9 deferred); package management, cron |
| Days 15-21: SQL | Core Week 4 + Week 5 / Day 1 (joins, GROUP BY, subqueries, transactions) | -- | Window functions beyond the basics; Postgres specifics |
| Days 22-28: database internals | Core Week 4 Day 3-6 touch indexes, locking, EXPLAIN, pooling | Part 14 (Days 62, 64-67) | Optimizer internals, partitioning/sharding, Postgres-specific MVCC |
| Days 29-35: first backend (URL shortener) + API design + testing | Task API (Part 12) + Weeks 3, 5, 6 | Part 18 (Days 87-90) | OpenAPI contract (Stage 7), CI workflow detail |
| Days 36-42: caching; 43-49: async processing | Core Week 6 Day 4-5, Week 7 Day 5 | Part 16 (Failures 2, 4) and Part 17 (Stage 6) | Kafka-class systems; exactly-once semantics beyond the outbox pattern |
| Days 50-56: concurrency | Core Week 2 (event loop, workers) and Week 4 Day 4-5 (locks) | Part 19 Labs 0-2, 7 (Day 92) | Labs 3-6 (Atomics, pools, mutex) deferred |
| Days 57-63: system design fundamentals | Core Week 7 (design cases) and Week 8 Day 5 | Part 19 Part C (Day 94: Little's law, estimation, SLO maths) | Large-scale data design (sharding, geo-replication) |
| Days 64-70: distributed systems | Core Week 7 Day 4 (payments, idempotency) only | Part 19 B1, B3, B7 (Day 93) | Consensus (B2), leader election (B6), distributed locks in depth |
| Days 71-77: production engineering | Core Week 6 Day 2, 6, Week 7 Day 5-6 | Part 15 (Days 68-69, 71-73) | Real cloud operations experience, Kubernetes |
| Days 78-84: break your own system | Core Week 6 Day 3, 5, 6 (timeouts, shutdown, load) | Part 16 (Days 74-76, 78-79) | Partition test (Failure 3), 10x load (Failure 7) runs deferred |
| Days 85-88: ONE serious project | Task API only (a tutorial-scale project) | Part 17 (Days 80-83, 85-86) | Compressed: runs the finished system and deep-studies 4 stages; building it all is 38-60 h |
| Days 89-90: interview preparation | Core Week 8 (4 mock sets, readiness assessment) | Part 20 (Days 95-97) | Real applications, real mocks with people |

The part-to-day map used in the rest of this section:

| Part | Name | Supplement days | Track days |
|------|------|-----------------|------------|
| 13 | Linux and Networking Foundations | 57-61 | 5 |
| 14 | Database Internals | 62, 64-67 | 5 |
| 15 | Observability, Cloud and CI/CD | 68-69, 71-73 | 5 |
| 16 | Chaos Lab | 74-76, 78-79 | 5 |
| 17 | Capstone Payments Project | 80-83, 85-86 | 6 |
| 18 | URL Shortener Build | 87-90 | 4 |
| 19 | Concurrency and Distributed Systems | 92-94 | 3 |
| 20 | Resume, Portfolio and Career | 95-97 | 3 |

### 6.2 Which supplement parts to do first for your target role

The default order in 6.5-6.10 is for a general Node.js backend role. If your target is different, reorder the parts using the table. Each part occupies a block of consecutive days (see the map in 6.1), so reordering means moving whole blocks; keep the six Day 7 revision days at the end of each week and re-label the 'Learn today' column of table 4.4 after you move things.

| Target role / situation | Do first (order) | Why | Safe to leave for later |
|-------------------------|------------------|-----|-------------------------|
| Default: Node.js backend, product company, junior to mid | 13 -> 14 -> 15 -> 16 -> 18 -> 17 -> 19 -> 20 (the order of section 6.5-6.10) | Linux and DB internals come up often in backend loops; observability and chaos build production vocabulary; the capstone and concurrency come after the basics | Part 20 Modules 9, 11, 12 |
| Fintech / payments / marketplace backend | 17 (Stages 4, 6, 7) -> 19 (B3, B7, Lab 2) -> 14 (Modules 3, 4, 7) -> 16 -> 13 -> 15 -> 18 -> 20 | Idempotency, outbox, webhooks, ledger, lost updates and WAL/MVCC are the whole interview | Part 13 Module 9, Part 18 Stage 7 |
| Startup that wants a shipped project fast | 18 -> 13 -> 14 -> 15 -> 16 -> 19 -> 17 -> 20 | The URL shortener core (Stages 1-4, 6) is buildable in 4 days and gives you a deployable project; Linux and DB internals make you debuggable | Part 17, Part 19 B2/B6 |
| DevOps / SRE-leaning backend role | 13 -> 15 -> 16 -> 14 -> 19 (Part C) -> 17 -> 18 -> 20 | Networking, observability, SLOs, incident review and chaos are the core of the loop | Part 19 Labs 3-6, Part 17 detail |
| Database-heavy or data-platform role | 14 -> 19 (Lab 1, 2, B1, B3) -> 13 -> 16 -> 15 -> 18 -> 17 -> 20 | Internals, MVCC, replication, pool sizing and lost updates are what they test | Part 15 Module 5, Part 20 Modules 9/11/12 |
| Actively applying right now (job search is open) | 20 (Days 95-96 first) -> 18 -> 13 -> 14 -> then the rest | A resume, portfolio and a deployed demo create interviews; technical depth can grow while you interview | Everything else until offers are in progress |
| Interview in under 3 weeks (urgent) | Do NOT start the capstone. Use only: 13 Modules 4-6 (Days 59-60), 14 Modules 1, 4, 7 (Days 62, 64, 65), 19 Day 92 and Q-CONC-01..10, 20 Modules 1-3 (Day 95) | Highest-frequency gaps for the least time (about 14 hours: Days 59, 60, 62, 64, 65, 92, 95) | All other days |

How to apply the table: take the first two or three parts in your row, schedule them in Weeks 9-10 by moving their day blocks forward, and keep the rest in the default order after them. If a part's block is split across a Day 7 (Part 14 and Part 15, Part 15 and Part 16, Part 16 and Part 17), finish the part's days in order and put the Day 7 where the week ends.

### 6.3 Hours budget: what the 84 hours cover and what they cut

| Part | Full material (its own hours table) | Track days | Track hours | What is deferred or cut (and its size) |
|------|--------------------------------------|------------|-------------|----------------------------------------|
| 13 Linux and Networking Foundations | 19 h | 5 | 10 h | Module 9 (logs, systemd, journalctl, ssh/scp, 2 h); the rest of the 19 h is typing and re-running every command instead of the selected ones |
| 14 Database Internals | 16.5 h | 5 | 10 h | ADVANCED parts of Modules 3 and 5 (doublewrite, group commit counters, histograms, optimizer hints), the Postgres comparison, [A] questions; about 6.5 h |
| 15 Observability, Cloud and CI/CD | 12.75 h | 5 | 10 h | optional scratch GitHub repo task (1 h), deeper LocalStack and Grafana provisioning, [ADVANCED] questions; about 2.75 h |
| 16 Chaos Lab | 23.5 h | 5 | 10 h | Module 3 (partition with toxiproxy, 2 h) and Module 7 (10x traffic, 2.5 h) runs; second halves of Modules 4 and 8; about 13.5 h |
| 17 Capstone Payments Project | 38 h | 6 | 12 h | Stage 1, 5, 8, 10, 12 are skimmed not built; Stage 11 tests only partly; typing the whole capstone is 38 to 60 h; about 26 h |
| 18 URL Shortener Build | 18 h | 4 | 8 h | Stage 5 (expiry, stats, cleanup), Stage 7 (error contract, OpenAPI, shutdown, 20 reading-min), Stage 9 CI detail; about 10 h |
| 19 Concurrency and Distributed Systems | 30 h | 3 | 6 h | Labs 3-6 (Atomics, bounded pool, mutex/semaphore, loop blocking), B2 Raft, B4/B5 depth, B6 leader election, B8 failure ledger; about 24 h |
| 20 Resume, Portfolio and Career | 25-28 (about 26.5) h | 3 | 6 h | Modules 9 (salary), 11 (honest expectations), 12 (Q&A bank) as separate sittings; full deployed demo and the 30-day loop; about 20 h |
| **Total** | **184.25 h** | **36** | **72 h** | **112.25 h of material not scheduled (39 percent of it is covered)** |

**Math.** Content days: Part 13 has 5, Part 14 has 5, Part 15 has 5, Part 16 has 5, Part 17 has 6, Part 18 has 4, Part 19 has 3, Part 20 has 3 = 36 content days x 2 h = 72 h. Add the six Day 7 revision days (63, 70, 77, 84, 91, 98) = 12 h. 72 + 12 = 84 h = 42 days x 2 h. Total plan = 112 h core + 84 h supplement = 196 h over 98 days.

**To finish everything** the eight parts hold about 184.25 h of material (sum of the 'Full material' column). At 2 h per day that is about 56 more days beyond the 36 content days. Treat the deferred list as a menu for your own follow-up weeks, in the order your row of 6.2 suggests. Part 17 (the capstone) is the largest single item: the track gets you a working, explainable understanding of Stages 4, 6, 7 and the concurrency test; the full build from scratch is a separate multi-week project.

### 6.4 Per-week hours table (supplement)

Totals are computed from the day tables in 6.5 to 6.10. Every day is 120 minutes. Day 7 uses the fixed shape 25 revisit + 40 assessment + 20 catch-up reading + 15 catch-up lab + 15 marking + 5 log.

| Week | Theme | Days | Reading (h) | Lab / coding (h) | Revision and questions (h) | Wrap-up and tests (h) | Week total (h) | Cumulative incl. core (h) |
|------|-------|------|-------------|------------------|-----------------------------|-----------------------|----------------|---------------------------|
| 9 | Linux, Networking and the first day of Database Internals | 57-63 | 3 | 5.08 | 3.25 | 2.67 | 14 | 126 |
| 10 | Database Internals, then Metrics and Tracing | 64-70 | 3.17 | 4.83 | 3.33 | 2.67 | 14 | 140 |
| 11 | Alerting, CI/CD and Cloud, then the Chaos Lab begins | 71-77 | 3.42 | 4.67 | 3.25 | 2.67 | 14 | 154 |
| 12 | Chaos Lab finish and the Payments Capstone begins | 78-84 | 3.42 | 5.42 | 2.83 | 2.33 | 14 | 168 |
| 13 | Capstone finish and the URL Shortener Build | 85-91 | 3.08 | 5.33 | 3 | 2.58 | 14 | 182 |
| 14 | Concurrency, Distributed Systems and Career Material | 92-98 | 3.75 | 4.08 | 3.5 | 2.67 | 14 | 196 |
| **Total** | | 57-98 | **19.83** | **29.42** | **19.17** | **15.58** | **84** | **196** |

Check: 6 weeks x 14 h = 84 h; 112 h core + 84 h = 196 h.

**Read slots in the supplement.** Estimated prose reading per content day (words / 150 plus 2 minutes of recall per module) against the slot given:

| Day | Part | Est. read (min) | Read slot (min) |
|-----|------|-----------------|-----------------|
| 57 | 13 | 12 | 25 |
| 58 | 13 | 18 | 30 |
| 59 | 13 | 20 | 30 |
| 60 | 13 | 25 | 30 |
| 61 | 13 | 16 | 20 |
| 62 | 14 | 17 | 25 |
| 64 | 14 | 25 | 30 |
| 65 | 14 | 26 | 30 |
| 66 | 14 | 26 | 30 |
| 67 | 14 | 11 | 25 |
| 68 | 15 | 17 | 30 |
| 69 | 15 | 15 | 25 |
| 71 | 15 | 17 | 25 |
| 72 | 15 | 19 | 30 |
| 73 | 15 | 29 | 35 |
| 74 | 16 | 21 | 25 |
| 75 | 16 | 22 | 35 |
| 76 | 16 | 23 | 35 |
| 78 | 16 | 21 | 35 |
| 79 | 16 | 21 | 30 |
| 80 | 17 | 25 | 30 |
| 81 | 17 | 15 | 30 |
| 82 | 17 | 10 | 30 |
| 83 | 17 | 12 | 30 |
| 85 | 17 | 12 | 30 |
| 86 | 17 | 15 | 30 |
| 87 | 18 | 20 | 25 |
| 88 | 18 | 7 | 25 |
| 89 | 18 | 13 | 25 |
| 90 | 18 | 13 | 30 |
| 92 | 19 | 33 | 35 |
| 93 | 19 | 31 | 35 |
| 94 | 19 | 19 | 25 |
| 95 | 20 | 34 | 35 |
| 96 | 20 | 33 | 35 |
| 97 | 20 | 37 | 40 |

Every content day fits its read slot (the table above is generated from the files). The code lines in those modules are commands and examples you run in the lab slot, so they are not read line by line.

### 6.5 Week 9 -- Linux, Networking and the first day of Database Internals (Days 57-63)

- **OPTIONAL.** Starts only after the core 56 days.
- **Notes files:** `13_Linux_Networking_Foundations.md`, `14_Database_Internals.md`
- **Week goal:** Be able to debug a misbehaving Node service from a Linux shell: ports, processes, signals, TCP states, Docker networking, DNS and TLS; and start the database-internals lab.
- **Never skip this week:** Modules 4, 5 and 6 of Part 13 (ports, Docker networking, TCP states) and the Day 62 clustered-index explanation.
- **Skip first if behind:** Part 13 Module 9 (logs, systemd, ssh) is not scheduled; tcpdump packet reading.

#### Supplement Week 9 / Day 1 (overall Day 57) -- Part 13: Lab machine, shell, filesystem, permissions, pipes, exit codes

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Build the throwaway Ubuntu lab container and run every command inside it, never on the Windows host.
- Explain permissions (chmod 640 vs 777), pipes/redirection and why exit codes (0, 1, 137, 143) matter for deploys.

**Topics:** Lab 0 (lab machine); shell, filesystem, permissions, pipes, `set -euo pipefail`, exit codes

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Lab 0 (Build the lab machine); Module 1 (Shell, filesystem, permissions,) | Reading |
| 55 | Lab / build: Lab 0: start `docker run --rm -it ubuntu:24.04` style lab container (container names prefixed lx-); run every Module 1 command and predict the output first; write one 10-line shell script with `set -euo pipefail` that fails loudly. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`13_Linux_Networking_Foundations.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 13_Linux_Networking_Foundations.md | Lab 0 - Build the lab machine (20 minutes) | 20-81 | 62 | 296 | 24 |
| 13_Linux_Networking_Foundations.md | Module 1 - Shell, filesystem, permissions, pipes, exit codes | 82-263 | 182 | 971 | 77 |
| | **Total** | | **244** | **1267** | **101** |

- **Estimate:** 1267 prose words / 150 wpm = 8 min, plus 2 x 2 min aloud recall = 12 min of reading against a read slot of 25 min (fits). The 101 code lines are commands and examples you run in the lab slot (about 10 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing tagged [ADVANCED] in Lab 0 or Module 1; skip only the shell-scripting extras you already know.

**Coding practice:** Lab 0: start `docker run --rm -it ubuntu:24.04` style lab container (container names prefixed lx-); run every Module 1 command and predict the output first; write one 10-line shell script with `set -euo pipefail` that fails loudly.

**Interview questions to revise:** Q-LNX-03..05 (chmod/777, set -euo pipefail, exit codes 0/1/137/143). ID scheme for this part: Q-LNX (26).

**Spaced revisits today:** Day 56: Final mock + readiness; Day 54: System design + project explanation; Day 50: JS + Node rapid revision.

**Daily learning outcomes**

- I can read and set Linux permissions and explain why 777 is wrong.
- I can explain what exit code 137 and 143 mean for a container.
- I can chain commands with pipes and stop a script on the first error.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-LNX-03..05
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 9 / Day 2 (overall Day 58) -- Part 13: Text tools, processes, signals and resource inspection

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Read a log with grep, sed, awk, xargs and find without opening an editor.
- Explain SIGTERM vs SIGKILL, and find CPU, memory and disk hogs with ps, top, free, df and du.

**Topics:** grep/sed/awk/xargs/find; processes, signals, /proc, resource inspection

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 2 (grep, sed, awk, xargs, find); Module 3 (Processes, signals and resource) | Reading |
| 50 | Lab / build: Run every Module 2 and 3 command in the lab container; write one awk one-liner that counts HTTP status codes in a sample access log; start a Node process, send it SIGTERM then SIGKILL and watch the exit codes. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`13_Linux_Networking_Foundations.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 13_Linux_Networking_Foundations.md | Module 2 - grep, sed, awk, xargs, find: reading logs like a ba | 264-426 | 163 | 722 | 74 |
| 13_Linux_Networking_Foundations.md | Module 3 - Processes, signals and resource inspection | 427-672 | 246 | 1311 | 108 |
| | **Total** | | **409** | **2033** | **182** |

- **Estimate:** 2033 prose words / 150 wpm = 14 min, plus 2 x 2 min aloud recall = 18 min of reading against a read slot of 30 min (fits). The 182 code lines are commands and examples you run in the lab slot (about 18 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing tagged [ADVANCED]; if time is short skip the xargs parallelism example and the second half of the signals trap section.

**Coding practice:** Run every Module 2 and 3 command in the lab container; write one awk one-liner that counts HTTP status codes in a sample access log; start a Node process, send it SIGTERM then SIGKILL and watch the exit codes.

**Interview questions to revise:** Q-LNX-06..09 (SIGTERM vs SIGKILL, disk usage, memory, 100 percent CPU). ID scheme for this part: Q-LNX (26).

**Spaced revisits today:** Day 57: Part 13: Lab machine, shell, permissions, exit codes; Day 55: Mock sets 1-2; Day 51: Express/REST + SQL/Mongo revision.

**Daily learning outcomes**

- I can count and filter log lines with awk and grep.
- I can explain why a Node server must handle SIGTERM.
- I can find which process uses the CPU, memory or disk.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-LNX-06..09
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 9 / Day 3 (overall Day 59) -- Part 13: Port in use, who holds my port, Docker run flags and networking

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Diagnose EADDRINUSE and "unreachable from another container" end to end.
- Explain bridge vs host networking, -p publishing and Docker container DNS.

**Topics:** Port-in-use lab; docker run flags; bridge vs host networking; container DNS; unreachable-container lab

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 4 (Lab); Module 5 (Docker run flags, bridge vs host) | Reading |
| 50 | Lab / build: Do both labs for real: reproduce EADDRINUSE and find the holder with ss/lsof; start two containers on a user-defined network, reach one from the other by name, then break it by binding to 127.0.0.1 and fix it with 0.0.0.0. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`13_Linux_Networking_Foundations.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 13_Linux_Networking_Foundations.md | Module 4 - Lab: "port already in use" and "who holds my port" | 673-823 | 151 | 718 | 63 |
| 13_Linux_Networking_Foundations.md | Module 5 - Docker run flags, bridge vs host networking, contai | 824-1155 | 332 | 1698 | 146 |
| | **Total** | | **483** | **2416** | **209** |

- **Estimate:** 2416 prose words / 150 wpm = 16 min, plus 2 x 2 min aloud recall = 20 min of reading against a read slot of 30 min (fits). The 209 code lines are commands and examples you run in the lab slot (about 21 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing tagged [ADVANCED]; skip host-network details on Windows Docker Desktop (behaves differently from Linux).

**Coding practice:** Do both labs for real: reproduce EADDRINUSE and find the holder with ss/lsof; start two containers on a user-defined network, reach one from the other by name, then break it by binding to 127.0.0.1 and fix it with 0.0.0.0.

**Interview questions to revise:** Q-LNX-01..02 and Q-LNX-14..17 (EADDRINUSE, EACCES on 80, unreachable container, -p, bridge vs host, Docker DNS). ID scheme for this part: Q-LNX (26).

**Spaced revisits today:** Day 58: Part 13: Text tools, processes, signals; Day 56: Final mock + readiness; Day 52: Auth/security scenarios, coding.

**Daily learning outcomes**

- I can name the three commands that show who holds a port.
- I can explain why 127.0.0.1 inside a container is unreachable from outside.
- I can say when -p is needed and when it is not.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-LNX-01..02 and Q-LNX-14..17
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 9 / Day 4 (overall Day 60) -- Part 13: TCP in practice and HTTP on the wire

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Read a TCP connection state table: handshake, TIME_WAIT, CLOSE_WAIT.
- Explain keep-alive, chunked encoding and where a request can wait (pool, socket, server queue).

**Topics:** TCP handshake, TIME_WAIT, CLOSE_WAIT, strace and a blocked event loop; keep-alive; connection pool vs socket vs request

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 6 (TCP in practice); Module 7 (HTTP on the wire) | Reading |
| 50 | Lab / build: Run the TIME_WAIT and CLOSE_WAIT experiments; strace a blocked Node event loop; run curl -v against a keep-alive server and note the Connection header and chunked body. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`13_Linux_Networking_Foundations.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 13_Linux_Networking_Foundations.md | Module 6 - TCP in practice: handshake, TIME_WAIT, CLOSE_WAIT,  | 1156-1514 | 359 | 1964 | 168 |
| 13_Linux_Networking_Foundations.md | Module 7 - HTTP on the wire: keep-alive, chunked encoding, and | 1515-1712 | 198 | 1153 | 84 |
| | **Total** | | **557** | **3117** | **252** |

- **Estimate:** 3117 prose words / 150 wpm = 21 min, plus 2 x 2 min aloud recall = 25 min of reading against a read slot of 30 min (fits). The 252 code lines are commands and examples you run in the lab slot (about 25 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing tagged [ADVANCED]; skip the tcpdump packet-reading sub-sections if tcpdump does not install in your container.

**Coding practice:** Run the TIME_WAIT and CLOSE_WAIT experiments; strace a blocked Node event loop; run curl -v against a keep-alive server and note the Connection header and chunked body.

**Interview questions to revise:** Q-LNX-10..13 and Q-LNX-22..23 (handshake, TIME_WAIT, CLOSE_WAIT, ECONNREFUSED vs timeout, keep-alive, pool vs socket). ID scheme for this part: Q-LNX (26).

**Spaced revisits today:** Day 59: Part 13: Port in use, Docker networking; Day 57: Part 13: Lab machine, shell, permissions, exit codes; Day 53: Debugging, incidents, machine coding.

**Daily learning outcomes**

- I can read ss -tan output and say what each state means.
- I can explain CLOSE_WAIT as an application bug, not a network bug.
- I can say where in the stack a request waits before a handler runs.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-LNX-10..13 and Q-LNX-22..23
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 9 / Day 5 (overall Day 61) -- Part 13: DNS, localhost vs 127.0.0.1 vs 0.0.0.0, TLS, and the Linux question bank

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain DNS resolution, localhost vs 0.0.0.0 and the TLS handshake and certificate chain.
- Answer the remaining Linux and networking questions aloud and take the part assessment.

**Topics:** DNS, localhost vs 0.0.0.0, TLS; Linux interview question bank; assessment

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 20 | Read these sections (prose; the code in them is run in the lab slot): Module 8 (DNS, localhost vs 127.0.0.1) | Reading |
| 30 | Lab / build: Run the dig/curl/openssl commands of Module 8 once; (Module 9 logs/systemd/ssh is DEFERRED, see 6.3). | Coding |
| 30 | Spaced revisit of the days in the line below (10 min) plus the questions listed below (20 min) | Revision and questions |
| 20 | Part 13 mixed-difficulty assessment, closed book, then mark it | Wrap-up and tests |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`13_Linux_Networking_Foundations.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 13_Linux_Networking_Foundations.md | Module 8 - DNS, localhost vs 127.0.0.1 vs 0.0.0.0, and TLS | 1713-2054 | 342 | 2086 | 132 |
| | **Total** | | **342** | **2086** | **132** |

- **Estimate:** 2086 prose words / 150 wpm = 14 min, plus 1 x 2 min aloud recall = 16 min of reading against a read slot of 20 min (fits). The 132 code lines are commands and examples you run in the lab slot (about 13 min of pure reading at 10 lines per min if you only read them).
- **Used in the revise / questions slot (not counted as reading):** 13_Linux_Networking_Foundations.md: Module 10 - Interview question bank (lines 2328-2456, 129 lines); 13_Linux_Networking_Foundations.md: Mixed-difficulty assessment (lines 2474-2523, 50 lines).
- **Skip for now:** Module 9 (logs, systemd, journalctl, ssh, scp, 2 h) is not scheduled in this track: it is the first item to add if you have spare time.

**Coding practice:** Run the dig/curl/openssl commands of Module 8 once; (Module 9 logs/systemd/ssh is DEFERRED, see 6.3).

**Interview questions to revise:** Q-LNX-18..21 and Q-LNX-24..26, then re-answer your 5 weakest from Q-LNX-01..17 (Q-LNX-01..26 all defined in Module 10). ID scheme for this part: Q-LNX (26).

**Spaced revisits today:** Day 60: Part 13: TCP states and HTTP on the wire; Day 58: Part 13: Text tools, processes, signals; Day 54: System design + project explanation.

**Daily learning outcomes**

- I can explain what happens at the network level on fetch(https://...).
- I can say why rejectUnauthorized: false is dangerous.
- I scored 70 percent or more on the part 13 assessment.

**Completion checklist**

- [ ] Read the reading-plan sections (~20 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-LNX-18..21 and Q-LNX-24..26, then re-answer your 5 weakest from Q-LNX-01..17
- [ ] Spaced revisit done
- [ ] Part 13 mixed-difficulty assessment
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 9 / Day 6 (overall Day 62) -- Part 14: Lab setup, B+tree on disk, clustered vs secondary index, covering index

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Bring up the primary + replica + scratch MySQL 8 lab (db-mysql on host port 33063).
- Explain the clustered index, why random UUID primary keys hurt, and covering indexes.

**Topics:** Module 0 lab setup; B+tree, clustered vs secondary, covering index, UUID primary keys

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Module 0 (Lab setup); Module 1 (B+tree on disk) | Reading |
| 55 | Lab / build: Run the Module 0 compose file; reproduce the page-count and tree-height experiment and the UUID-vs-auto-increment insert comparison. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`14_Database_Internals.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 14_Database_Internals.md | Module 0 - Lab setup: one primary, one replica, one scratch da | 44-172 | 129 | 422 | 75 |
| 14_Database_Internals.md | Module 1 - B+tree on disk: clustered vs secondary index, cover | 173-406 | 234 | 1550 | 81 |
| | **Total** | | **363** | **1972** | **156** |

- **Estimate:** 1972 prose words / 150 wpm = 13 min, plus 2 x 2 min aloud recall = 17 min of reading against a read slot of 25 min (fits). The 156 code lines are commands and examples you run in the lab slot (about 16 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Q-DBI-05 (page split detail) is [ADVANCED]; skip the .ibd file byte-reading sub-section if short on time.

**Coding practice:** Run the Module 0 compose file; reproduce the page-count and tree-height experiment and the UUID-vs-auto-increment insert comparison.

**Interview questions to revise:** Q-DBI-01..05 (clustered index, UUID PK, covering index, B+tree depth, page split; Q-DBI-05 is [A]). ID scheme for this part: Q-DBI (32).

**Spaced revisits today:** Day 61: Part 13: DNS, TLS, localhost vs 0.0.0.0; Day 59: Part 13: Port in use, Docker networking; Day 55: Mock sets 1-2.

**Daily learning outcomes**

- I can explain why a secondary index lookup may need two B+tree descents.
- I can give the tree height for 100 million rows.
- I can say what a covering index saves.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-DBI-01..05
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 9 / Day 7 (overall Day 63) -- Revision, assessment, catch-up

**Tier:** OPTIONAL supplement (consolidation)

**Learning objectives**

- Check honestly what you retained from: Part 13 (all five days) and Part 14 Day 62.
- Take the part assessment closed book and list the 2-3 weakest topics.
- Use the catch-up slots for the deferred or skipped material of this week.

**Topics:** Part 13 (all five days) and Part 14 Day 62

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of this week's key concepts (cover and recall; use the day-by-day table in 4.4) | Revision and questions |
| 40 | Part assessment(s) listed below, closed book, timed | Revision and questions |
| 15 | Mark with the answer key; list weak areas | Wrap-up and tests |
| 20 | Catch-up reading: Part 13 Module 9 (logs, systemd, journalctl, ssh/scp), the deferred module; then weak areas of Modules 1 to 8 | Reading |
| 15 | Catch-up lab: Redo the lab you found hardest (port-in-use, Docker DNS, TIME_WAIT) from a blank container; or re-run the Part 14 Module 1 UUID experiment. | Coding |
| 5 | Log hours (target 14 h this week), plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Day 7: assessment sections are used as exams, not read first)**

| File | Section | Lines | Line count | Prose words | Code lines |
|------|---------|-------|------------|-------------|------------|
| 13_Linux_Networking_Foundations.md | Mixed-difficulty assessment | 2474-2523 | 50 | 878 | 0 |
| 13_Linux_Networking_Foundations.md | Module 9 - Logs, systemd, journalctl, ssh and scp | 2055-2327 | 273 | 1413 | 127 |

- **Assessment:** 13_Linux_Networking_Foundations.md lines 2474-2523. Target 70 percent or more. Below 70 percent: redo the weakest module of that part before moving on (counts as one missed day, see 5.4).
- **Catch-up reading section:** 13_Linux_Networking_Foundations.md: Module 9 - Logs, systemd, journalctl, ssh and scp (lines 2055-2327).

**Interview questions to revise:** Your 10 weakest of Q-LNX-01..26, plus Q-DBI-01..05. Answer each aloud in under 90 seconds.

**Spaced revisits today:** Day 62: Part 14: B+tree, clustered and covering index; Day 60: Part 13: TCP states and HTTP on the wire; Day 56: Final mock + readiness.

**Daily learning outcomes**

- I know my assessment scores for this week and my weakest 2-3 topics.
- I repaired at least one weak topic by re-reading plus redoing a lab.
- Deferred items are written down with a date, not forgotten.

**Completion checklist**

- [ ] Spaced revisit done
- [ ] Assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Catch-up reading done
- [ ] Catch-up lab done
- [ ] Week 9 hours logged (target 14 h)

### 6.6 Week 10 -- Database Internals, then Metrics and Tracing (Days 64-70)

- **OPTIONAL.** Starts only after the core 56 days.
- **Notes files:** `14_Database_Internals.md`, `15_Observability_Cloud_CICD.md`
- **Week goal:** Explain how InnoDB stores, logs and versions data, how replication causes stale reads, and how pool size is calculated; then instrument a service with metrics and traces.
- **Never skip this week:** Buffer pool hit ratio, WAL and durability, MVCC and long transactions, replication lag, pool sizing, RED metrics, trace context propagation.
- **Skip first if behind:** Doublewrite buffer, group commit counters, histograms, optimizer hints, Postgres MVCC comparison, Prometheus push vs pull.

#### Supplement Week 10 / Day 1 (overall Day 64) -- Part 14: Buffer pool and connection pooling

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Compute the buffer pool hit ratio, read SHOW ENGINE INNODB STATUS and explain sizing.
- Do the pool-sizing math and recognise pool-exhaustion symptoms.

**Topics:** Module 2 buffer pool; Module 7 connection pooling and sizing

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 2 (Buffer pool); Module 7 (Connection pooling) | Reading |
| 50 | Lab / build: Run the hit-ratio experiment with an 8 MB vs 128 MB buffer pool; exhaust a pool of 5 connections on purpose and read the symptoms; compute a pool size by hand for 3 app instances. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`14_Database_Internals.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 14_Database_Internals.md | Module 2 - Buffer pool: hit ratio, sizing, reading SHOW ENGINE | 407-600 | 194 | 1376 | 63 |
| 14_Database_Internals.md | Module 7 - Connection pooling: why the DB runs out of connecti | 1503-1715 | 213 | 1834 | 52 |
| | **Total** | | **407** | **3210** | **115** |

- **Estimate:** 3210 prose words / 150 wpm = 21 min, plus 2 x 2 min aloud recall = 25 min of reading against a read slot of 30 min (fits). The 115 code lines are commands and examples you run in the lab slot (about 12 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Q-DBI-08 and Q-DBI-29 are [ADVANCED]; skip the midpoint-insertion LRU details.

**Coding practice:** Run the hit-ratio experiment with an 8 MB vs 128 MB buffer pool; exhaust a pool of 5 connections on purpose and read the symptoms; compute a pool size by hand for 3 app instances.

**Interview questions to revise:** Q-DBI-06..08 and Q-DBI-26..29 (buffer pool, hit ratio, why DBs run out of connections first, pool sizing, exhaustion, more connections slower; Q-DBI-08 and 29 are [A]). ID scheme for this part: Q-DBI (32).

**Spaced revisits today:** Day 63: Week 9 supplement weak areas; Day 61: Part 13: DNS, TLS, localhost vs 0.0.0.0; Day 57: Part 13: Lab machine, shell, permissions, exit codes.

**Daily learning outcomes**

- I can compute a hit ratio from two status counters.
- I can size a connection pool with a formula and state its assumptions.
- I can list three symptoms of pool exhaustion.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-DBI-06..08 and Q-DBI-26..29
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 10 / Day 2 (overall Day 65) -- Part 14: WAL, redo/undo/binlog, crash recovery and MVCC

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain what is durable when COMMIT returns and how InnoDB recovers after a crash.
- Explain MVCC read views and why long transactions hurt (history list length).

**Topics:** Module 3 WAL (essential parts); Module 4 MVCC and undo

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 3 (WAL); Module 4 (MVCC and undo logs) | Reading |
| 50 | Lab / build: Do the SIGKILL crash-recovery experiment; run the two-session MVCC script (repeatable read vs read committed); watch history list length grow with an open transaction. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`14_Database_Internals.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 14_Database_Internals.md | Module 3 - WAL: redo log, doublewrite buffer, binlog, crash re | 601-856 | 256 | 1755 | 90 |
| 14_Database_Internals.md | Module 4 - MVCC and undo logs: read views, why long transactio | 857-1031 | 175 | 1614 | 40 |
| | **Total** | | **431** | **3369** | **130** |

- **Estimate:** 3369 prose words / 150 wpm = 22 min, plus 2 x 2 min aloud recall = 26 min of reading against a read slot of 30 min (fits). The 130 code lines are commands and examples you run in the lab slot (about 13 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Skip for now ([ADVANCED] parts of Module 3): doublewrite buffer and group commit counters; and in Module 4 the Postgres comparison.

**Coding practice:** Do the SIGKILL crash-recovery experiment; run the two-session MVCC script (repeatable read vs read committed); watch history list length grow with an open transaction.

**Interview questions to revise:** Q-DBI-09..10, Q-DBI-14..17 (WAL, durability, crash recovery, MVCC, long transactions, history list length); Q-DBI-11..13 and 18..19 are [A], only if time. ID scheme for this part: Q-DBI (32).

**Spaced revisits today:** Day 64: Part 14: Buffer pool, connection pooling; Day 62: Part 14: B+tree, clustered and covering index; Day 58: Part 13: Text tools, processes, signals.

**Daily learning outcomes**

- I can say what the redo log and binlog each protect.
- I can explain MVCC without saying "magic".
- I can explain why a forgotten open transaction slows the whole database.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-DBI-09..10, Q-DBI-14..17
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 10 / Day 3 (overall Day 66) -- Part 14: Replication and the query planner

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain async vs semi-sync replication, replication lag and read-your-writes.
- Read EXPLAIN ANALYZE and know when optimizer statistics or hints matter.

**Topics:** Module 6 replication and read/write split; Module 5 query planner (skim)

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 6 (Replication); Module 5 (The query planner) | Reading |
| 50 | Lab / build: Create replication lag on purpose and show a stale read from the replica; fix it with a read-your-writes rule; run EXPLAIN vs EXPLAIN ANALYZE on one query. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`14_Database_Internals.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 14_Database_Internals.md | Module 6 - Replication: binlog, async vs semi-sync, replicatio | 1234-1502 | 269 | 1711 | 100 |
| 14_Database_Internals.md | Module 5 - The query planner: cost model, statistics, histogra | 1032-1233 | 202 | 1518 | 52 |
| | **Total** | | **471** | **3229** | **152** |

- **Estimate:** 3229 prose words / 150 wpm = 22 min, plus 2 x 2 min aloud recall = 26 min of reading against a read slot of 30 min (fits). The 152 code lines are commands and examples you run in the lab slot (about 15 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Module 5 is [ESSENTIAL + ADVANCED]: read the cost-model and EXPLAIN ANALYZE parts, skip histograms and optimizer hints for now.

**Coding practice:** Create replication lag on purpose and show a stale read from the replica; fix it with a read-your-writes rule; run EXPLAIN vs EXPLAIN ANALYZE on one query.

**Interview questions to revise:** Q-DBI-20..25 (optimizer choice, slow despite index, histograms [A], async vs semi-sync, replication lag, "I do not see my own update"). ID scheme for this part: Q-DBI (32).

**Spaced revisits today:** Day 65: Part 14: WAL, redo/binlog, MVCC; Day 63: Week 9 supplement weak areas; Day 59: Part 13: Port in use, Docker networking.

**Daily learning outcomes**

- I can explain why a user may not see their own write after a read/write split.
- I can name two causes of replication lag.
- I can read actual vs estimated rows in EXPLAIN ANALYZE.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-DBI-20..25
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 10 / Day 4 (overall Day 67) -- Part 14: "The DB is the bottleneck" diagnosis, Part 14 question bank and assessment

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Walk through a repeatable DB bottleneck triage out loud.
- Answer the Part 14 question bank and take the assessment.

**Topics:** Module 8 diagnosis checklist; interview questions; assessment

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Module 8 ("Why is my DB the bottleneck?") | Reading |
| 20 | Lab / build: Apply the Module 8 checklist to your own Task API MySQL from Part 12: write the 8 commands you would run in order and what each result would mean. | Coding |
| 35 | Spaced revisit of the days in the line below (10 min) plus the questions listed below (25 min) | Revision and questions |
| 20 | Part 14 assessment, closed book, then mark with the answers section | Wrap-up and tests |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`14_Database_Internals.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 14_Database_Internals.md | Module 8 - "Why is my DB the bottleneck?" diagnosis checklist | 1716-1892 | 177 | 1338 | 47 |
| | **Total** | | **177** | **1338** | **47** |

- **Estimate:** 1338 prose words / 150 wpm = 9 min, plus 1 x 2 min aloud recall = 11 min of reading against a read slot of 25 min (fits). The 47 code lines are commands and examples you run in the lab slot (about 5 min of pure reading at 10 lines per min if you only read them).
- **Used in the revise / questions slot (not counted as reading):** 14_Database_Internals.md: Interview questions (lines 1893-2048, 156 lines); 14_Database_Internals.md: Assessment (lines 2069-2098, 30 lines).
- **Skip for now:** The [A] questions (Q-DBI-05, 08, 11, 12, 13, 18, 19, 22, 29, 31, 32) are optional.

**Coding practice:** Apply the Module 8 checklist to your own Task API MySQL from Part 12: write the 8 commands you would run in order and what each result would mean.

**Interview questions to revise:** Q-DBI-30..32 plus every [E] question Q-DBI-01..29 spoken (90 seconds each). ID scheme for this part: Q-DBI (32).

**Spaced revisits today:** Day 66: Part 14: Replication and query planner; Day 64: Part 14: Buffer pool, connection pooling; Day 60: Part 13: TCP states and HTTP on the wire.

**Daily learning outcomes**

- I can run a 5-minute triage on a slow database and say what I check first.
- I can answer every [E] question in under 90 seconds.
- I scored 70 percent or more on the part 14 assessment.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-DBI-30..32 plus every [E] question Q-DBI-01..29 spoken
- [ ] Spaced revisit done
- [ ] Part 14 assessment
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 10 / Day 5 (overall Day 68) -- Part 15: Metrics: RED and USE, Prometheus, Grafana

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Instrument the Task API with prom-client and read RED metrics in Prometheus and Grafana.
- Explain counters, gauges, histograms, percentiles and label cardinality.

**Topics:** Module 1 metrics, RED/USE, Prometheus, Grafana

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 1 (Metrics) | Reading |
| 50 | Lab / build: Bring up the obs- compose stack (Prometheus 9091, Grafana 3001); run the PromQL queries; run the cardinality demo and watch series count explode. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`15_Observability_Cloud_CICD.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 15_Observability_Cloud_CICD.md | Module 1 - Metrics: RED, USE, Prometheus, Grafana | 50-815 | 766 | 2194 | 492 |
| | **Total** | | **766** | **2194** | **492** |

- **Estimate:** 2194 prose words / 150 wpm = 15 min, plus 1 x 2 min aloud recall = 17 min of reading against a read slot of 30 min (fits). The 492 code lines are commands and examples you run in the lab slot (about 49 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Q-OBS-07 is [ADVANCED]; skip the Grafana provisioning details (just import the dashboard).

**Coding practice:** Bring up the obs- compose stack (Prometheus 9091, Grafana 3001); run the PromQL queries; run the cardinality demo and watch series count explode.

**Interview questions to revise:** Q-OBS-01..07 (three pillars, RED vs USE, percentiles, cardinality, metric types, Node metrics, pull vs push [A]). ID scheme for this part: Q-OBS (37).

**Spaced revisits today:** Day 67: Part 14: DB bottleneck triage; Day 65: Part 14: WAL, redo/binlog, MVCC; Day 61: Part 13: DNS, TLS, localhost vs 0.0.0.0.

**Daily learning outcomes**

- I can explain RED and USE and which one I alert on.
- I can write a p95 latency PromQL query.
- I can explain label cardinality and give a bad label example.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-OBS-01..07
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 10 / Day 6 (overall Day 69) -- Part 15: Distributed tracing with OpenTelemetry

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Trace a POST /tasks request through API, queue and worker in Jaeger.
- Explain context propagation, sampling and log-trace correlation.

**Topics:** Module 2 distributed tracing with OpenTelemetry and Jaeger

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Module 2 (Distributed tracing with OpenTelemetry) | Reading |
| 55 | Lab / build: Run the Jaeger stack (16687); trace one request including the queue hop; try head sampling at 10 percent. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`15_Observability_Cloud_CICD.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 15_Observability_Cloud_CICD.md | Module 2 - Distributed tracing with OpenTelemetry (Jaeger) | 816-1107 | 292 | 1912 | 106 |
| | **Total** | | **292** | **1912** | **106** |

- **Estimate:** 1912 prose words / 150 wpm = 13 min, plus 1 x 2 min aloud recall = 15 min of reading against a read slot of 25 min (fits). The 106 code lines are commands and examples you run in the lab slot (about 11 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Q-OBS-12 and Q-OBS-13 are [ADVANCED]; skip the Collector pipeline configuration beyond the default.

**Coding practice:** Run the Jaeger stack (16687); trace one request including the queue hop; try head sampling at 10 percent.

**Interview questions to revise:** Q-OBS-08..13 (distributed tracing, queue propagation, log correlation, sampling, ESM auto-instrumentation [A], cardinality placement [A]). ID scheme for this part: Q-OBS (37).

**Spaced revisits today:** Day 68: Part 15: Metrics: RED/USE, Prometheus; Day 66: Part 14: Replication and query planner; Day 62: Part 14: B+tree, clustered and covering index.

**Daily learning outcomes**

- I can explain traceparent propagation in two sentences.
- I can say how a trace stays connected across a queue.
- I can say why I would sample traces.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-OBS-08..13
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 10 / Day 7 (overall Day 70) -- Revision, assessment, catch-up

**Tier:** OPTIONAL supplement (consolidation)

**Learning objectives**

- Check honestly what you retained from: Part 14 (Days 62, 64 to 67) and Part 15 Days 68 to 69.
- Take the part assessment closed book and list the 2-3 weakest topics.
- Use the catch-up slots for the deferred or skipped material of this week.

**Topics:** Part 14 (Days 62, 64 to 67) and Part 15 Days 68 to 69

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of this week's key concepts (cover and recall; use the day-by-day table in 4.4) | Revision and questions |
| 40 | Part assessment(s) listed below, closed book, timed | Revision and questions |
| 15 | Mark with the answer key; list weak areas | Wrap-up and tests |
| 20 | Catch-up reading: the Part 14 [ADVANCED] parts you skipped (doublewrite buffer, group commit, histograms, optimizer hints), then weak areas | Reading |
| 15 | Catch-up lab: Redo the replication-lag stale-read experiment or the pool-exhaustion experiment from a blank compose file. | Coding |
| 5 | Log hours (target 14 h this week), plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Day 7: assessment sections are used as exams, not read first)**

| File | Section | Lines | Line count | Prose words | Code lines |
|------|---------|-------|------------|-------------|------------|
| 14_Database_Internals.md | Assessment (mixed difficulty) | 2069-2098 | 30 | 309 | 0 |
| 14_Database_Internals.md | Answers with explanations | 2099-2150 | 52 | 729 | 0 |
| 14_Database_Internals.md | Module 5 - The query planner: cost model, statistics, histogra | 1032-1233 | 202 | 1518 | 52 |

- **Assessment:** 14_Database_Internals.md lines 2069-2098. Target 70 percent or more. Below 70 percent: redo the weakest module of that part before moving on (counts as one missed day, see 5.4).
- **Catch-up reading section:** 14_Database_Internals.md: Module 5 - The query planner: cost model, statisti (lines 1032-1233).

**Interview questions to revise:** Your 10 weakest of Q-DBI-01..32 and Q-OBS-01..13. Answer each aloud in under 90 seconds.

**Spaced revisits today:** Day 69: Part 15: Tracing with OpenTelemetry; Day 67: Part 14: DB bottleneck triage; Day 63: Week 9 supplement weak areas.

**Daily learning outcomes**

- I know my assessment scores for this week and my weakest 2-3 topics.
- I repaired at least one weak topic by re-reading plus redoing a lab.
- Deferred items are written down with a date, not forgotten.

**Completion checklist**

- [ ] Spaced revisit done
- [ ] Assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Catch-up reading done
- [ ] Catch-up lab done
- [ ] Week 10 hours logged (target 14 h)

### 6.7 Week 11 -- Alerting, CI/CD and Cloud, then the Chaos Lab begins (Days 71-77)

- **OPTIONAL.** Starts only after the core 56 days.
- **Notes files:** `15_Observability_Cloud_CICD.md`, `16_Chaos_Lab.md`
- **Week goal:** Define SLOs and burn-rate alerts, describe a CI/CD pipeline with safe database migrations, answer cloud basics, and start breaking the Task API on purpose.
- **Never skip this week:** SLI/SLO/error budget maths, deployment strategies and rollback, IAM least privilege, MySQL-down and Redis-down failures, timeouts.
- **Skip first if behind:** AWS ADVANCED questions (Q-OBS-33, 34, 37), the partition failure (Module 3) beyond reading.

#### Supplement Week 11 / Day 1 (overall Day 71) -- Part 15: Alerting, SLI/SLO, error budgets and burn rate

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Define SLI, SLO, SLA and error budget with numbers.
- Write and test a multi-window burn-rate alert rule.

**Topics:** Module 3 alerting, SLI/SLO, error budgets, burn-rate rules

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Module 3 (Alerting, SLI/SLO, error budgets) | Reading |
| 55 | Lab / build: Compute the error budget for 99.9 and 99.95 percent by hand; run promtool check and test on the sample alert rules. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`15_Observability_Cloud_CICD.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 15_Observability_Cloud_CICD.md | Module 3 - Alerting, SLI/SLO, error budgets and burn-rate rule | 1108-1519 | 412 | 2297 | 203 |
| | **Total** | | **412** | **2297** | **203** |

- **Estimate:** 2297 prose words / 150 wpm = 15 min, plus 1 x 2 min aloud recall = 17 min of reading against a read slot of 25 min (fits). The 203 code lines are commands and examples you run in the lab slot (about 20 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Q-OBS-18 and Q-OBS-19 are [ADVANCED]; skip recording-rule unit tests on the first pass.

**Coding practice:** Compute the error budget for 99.9 and 99.95 percent by hand; run promtool check and test on the sample alert rules.

**Interview questions to revise:** Q-OBS-14..19 (symptom vs cause alerts, SLI/SLO/SLA, burn rate, alert fatigue, latency SLO [A], recording rules [A]). ID scheme for this part: Q-OBS (37).

**Spaced revisits today:** Day 70: Week 10 supplement weak areas; Day 68: Part 15: Metrics: RED/USE, Prometheus; Day 64: Part 14: Buffer pool, connection pooling.

**Daily learning outcomes**

- I can convert 99.9 percent to minutes of downtime per month.
- I can explain why a burn-rate alert beats a static threshold.
- I can list three ways to reduce alert fatigue.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-OBS-14..19
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 11 / Day 2 (overall Day 72) -- Part 15: CI/CD with GitHub Actions and deployment strategies

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Describe a CI/CD pipeline for a Node API with MySQL, including migrations and rollback.
- Explain blue/green, rolling, canary and feature flags.

**Topics:** Module 4 CI/CD and deployment strategies

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 4 (CI/CD with GitHub Actions) | Reading |
| 50 | Lab / build: Read the ci.yml line by line; run its commands locally; (the optional scratch GitHub repo task is DEFERRED); write a rollback plan for a migration that drops a column. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`15_Observability_Cloud_CICD.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 15_Observability_Cloud_CICD.md | Module 4 - CI/CD with GitHub Actions and deployment strategies | 1520-1994 | 475 | 2598 | 260 |
| | **Total** | | **475** | **2598** | **260** |

- **Estimate:** 2598 prose words / 150 wpm = 17 min, plus 1 x 2 min aloud recall = 19 min of reading against a read slot of 30 min (fits). The 260 code lines are commands and examples you run in the lab slot (about 26 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Q-OBS-25 and Q-OBS-26 are [ADVANCED]; the GitHub-repo exercise (1 h optional) is deferred.

**Coding practice:** Read the ci.yml line by line; run its commands locally; (the optional scratch GitHub repo task is DEFERRED); write a rollback plan for a migration that drops a column.

**Interview questions to revise:** Q-OBS-20..26 (pipeline design, blue/green vs rolling vs canary, feature flags, safe rollbacks with migrations, CI secrets, latest tag [A], rolling deploy needs [A]). ID scheme for this part: Q-OBS (37).

**Spaced revisits today:** Day 71: Part 15: SLI/SLO, burn-rate alerts; Day 69: Part 15: Tracing with OpenTelemetry; Day 65: Part 14: WAL, redo/binlog, MVCC.

**Daily learning outcomes**

- I can describe a pipeline from push to production.
- I can explain an expand-contract migration.
- I can say why deploy and release are different.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-OBS-20..26
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 11 / Day 3 (overall Day 73) -- Part 15: Cloud basics (AWS) and the Part 15 question bank

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain IAM roles, VPC layout, RDS Multi-AZ vs read replicas, S3 presigned URLs and cost traps.
- Answer the Part 15 incident-style questions and take the assessment.

**Topics:** Module 5 cloud basics (AWS); Module 6 question bank; assessment

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): Module 5 (Cloud basics with AWS as the worked) | Reading |
| 15 | Lab / build: Run the 0.5 h LocalStack lab (S3 presigned URL + IAM policy); draw the network for a web API plus database on paper. | Coding |
| 30 | Spaced revisit of the days in the line below (10 min) plus the questions listed below (20 min) | Revision and questions |
| 20 | Part 15 assessment (inside the Summary, assessment, hours and verification section), closed book, then mark it | Wrap-up and tests |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`15_Observability_Cloud_CICD.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 15_Observability_Cloud_CICD.md | Module 5 - Cloud basics with AWS as the worked example | 1995-2600 | 606 | 4039 | 251 |
| | **Total** | | **606** | **4039** | **251** |

- **Estimate:** 4039 prose words / 150 wpm = 27 min, plus 1 x 2 min aloud recall = 29 min of reading against a read slot of 35 min (fits). The 251 code lines are commands and examples you run in the lab slot (about 25 min of pure reading at 10 lines per min if you only read them).
- **Used in the revise / questions slot (not counted as reading):** 15_Observability_Cloud_CICD.md: Module 6 - Interview question bank: observability, CI/CD and (lines 2601-2760, 160 lines).
- **Skip for now:** Q-OBS-33, 34 and 37 are [ADVANCED]; skip them unless you are targeting AWS-heavy roles.

**Coding practice:** Run the 0.5 h LocalStack lab (S3 presigned URL + IAM policy); draw the network for a web API plus database on paper.

**Interview questions to revise:** Q-OBS-27..37 (IAM, network design, Multi-AZ vs replicas, presigned URLs, autoscaling and DB, cost traps, two ADVANCED, three incident questions). ID scheme for this part: Q-OBS (37).

**Spaced revisits today:** Day 72: Part 15: CI/CD and deployment strategies; Day 70: Week 10 supplement weak areas; Day 66: Part 14: Replication and query planner.

**Daily learning outcomes**

- I can explain least privilege with an IAM example.
- I can answer "error rate jumped after a deploy" step by step.
- I scored 70 percent or more on the part 15 assessment.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-OBS-27..37
- [ ] Spaced revisit done
- [ ] Part 15 assessment (inside the Summary
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 11 / Day 4 (overall Day 74) -- Part 16: Chaos lab setup and Failure 1: kill MySQL

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Bring up the chaos lab stack against the Task API (ch-mysql on 33065, ch-redis on 63792).
- Run Failure 1, observe what breaks, and apply the fix.

**Topics:** Module 0 lab and method; Module 1 kill MySQL

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Module 0 (The lab); Module 1 (Failure 1) | Reading |
| 55 | Lab / build: Run the lab setup; follow the Module 1 hypothesis -> inject -> observe -> fix -> verify loop; write the result in your own incident table. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`16_Chaos_Lab.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 16_Chaos_Lab.md | Module 0 - The lab: stack, tools and method | 31-547 | 517 | 887 | 379 |
| 16_Chaos_Lab.md | Module 1 - Failure 1: kill MySQL | 548-1456 | 909 | 1630 | 724 |
| | **Total** | | **1426** | **2517** | **1103** |

- **Estimate:** 2517 prose words / 150 wpm = 17 min, plus 2 x 2 min aloud recall = 21 min of reading against a read slot of 25 min (fits). The 1103 code lines are commands and examples you run in the lab slot (about 110 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Module 0 tool installation extras (toxiproxy) are needed only for Failure 3, which is deferred.

**Coding practice:** Run the lab setup; follow the Module 1 hypothesis -> inject -> observe -> fix -> verify loop; write the result in your own incident table.

**Interview questions to revise:** CH-Q1 (chaos vs load testing) and CH-Q12 (liveness vs readiness). ID scheme for this part: CH-Q1..CH-Q25 (Module 11, printed as Q1..Q25).

**Spaced revisits today:** Day 73: Part 15: AWS basics and incident questions; Day 71: Part 15: SLI/SLO, burn-rate alerts; Day 67: Part 14: DB bottleneck triage.

**Daily learning outcomes**

- I can state a hypothesis before injecting a failure.
- I can explain liveness vs readiness.
- I have one real before/after table for MySQL down.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CH-Q1
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 11 / Day 5 (overall Day 75) -- Part 16: Failure 2: kill Redis, and Failure 4 (duplicates and poison messages) by reading

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Show that killing Redis can silently lose queued jobs and see the outbox fix.
- Explain idempotent consumers, DLQs and poison messages.

**Topics:** Module 2 kill Redis (run); Module 4 duplicates and poison message (read, run if time)

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): Module 2 (Failure 2); Module 4 (Failure 4) | Reading |
| 45 | Lab / build: Run Module 2 fully; for Module 4 read the code, run only the duplicate-delivery test. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`16_Chaos_Lab.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 16_Chaos_Lab.md | Module 2 - Failure 2: kill Redis (cache + queue): silent data  | 1457-1954 | 498 | 1333 | 353 |
| 16_Chaos_Lab.md | Module 4 - Failure 4: duplicate messages (and a poison message | 2268-2627 | 360 | 1305 | 226 |
| | **Total** | | **858** | **2638** | **579** |

- **Estimate:** 2638 prose words / 150 wpm = 18 min, plus 2 x 2 min aloud recall = 22 min of reading against a read slot of 35 min (fits). The 579 code lines are commands and examples you run in the lab slot (about 58 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Module 4 poison-message part 2 (retry ladder tuning) is optional; the outbox in Module 2 is [ADVANCED] but is the best interview story.

**Coding practice:** Run Module 2 fully; for Module 4 read the code, run only the duplicate-delivery test.

**Interview questions to revise:** CH-Q8..CH-Q11 and CH-Q20 (degradation vs fallback, outbox, idempotent consumer, DLQ, at-most/at-least/exactly-once). ID scheme for this part: CH-Q1..CH-Q25 (Module 11, printed as Q1..Q25).

**Spaced revisits today:** Day 74: Part 16: Chaos setup, kill MySQL; Day 72: Part 15: CI/CD and deployment strategies; Day 68: Part 15: Metrics: RED/USE, Prometheus.

**Daily learning outcomes**

- I can describe the silent data-loss failure in my own words.
- I can say how an idempotent consumer works.
- I can explain what a good DLQ contains.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CH-Q8..CH-Q11 and CH-Q20
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 11 / Day 6 (overall Day 76) -- Part 16: Failure 5: slow dependency and timeouts; Failure 3 skimmed

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Prove that a slow dependency is worse than a dead one and fix it with timeouts and a circuit breaker.
- Read how toxiproxy would model a partition.

**Topics:** Module 5 slow dependency (run); Module 3 partition (skim, do not run)

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): Module 5 (Failure 5); Module 3 (Failure 3) | Reading |
| 45 | Lab / build: Run Module 5: add a slow upstream, watch the event loop and pool; add timeouts; read-only pass over Module 3. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`16_Chaos_Lab.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 16_Chaos_Lab.md | Module 5 - Failure 5: force an API timeout (slow dependency) | 2628-2999 | 372 | 1452 | 248 |
| 16_Chaos_Lab.md | Module 3 - Failure 3: delay and partition the queue/cache path | 1955-2267 | 313 | 1339 | 188 |
| | **Total** | | **685** | **2791** | **436** |

- **Estimate:** 2791 prose words / 150 wpm = 19 min, plus 2 x 2 min aloud recall = 23 min of reading against a read slot of 35 min (fits). The 436 code lines are commands and examples you run in the lab slot (about 44 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Module 3 is read-only this week (tc netem is untested per the part's own Not verified list); CH-Q22 is [ADVANCED].

**Coding practice:** Run Module 5: add a slow upstream, watch the event loop and pool; add timeouts; read-only pass over Module 3.

**Interview questions to revise:** CH-Q2..CH-Q7 and CH-Q22 (slow vs dead, Node timeouts, retries, backoff with jitter, circuit breaker, bulkhead, retry storm [A]). ID scheme for this part: CH-Q1..CH-Q25 (Module 11, printed as Q1..Q25).

**Spaced revisits today:** Day 75: Part 16: Kill Redis, duplicates and DLQ; Day 73: Part 15: AWS basics and incident questions; Day 69: Part 15: Tracing with OpenTelemetry.

**Daily learning outcomes**

- I can list the timeouts a Node API needs.
- I can explain a retry storm and the fix.
- I can explain circuit breaker states.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CH-Q2..CH-Q7 and CH-Q22
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 11 / Day 7 (overall Day 77) -- Revision, assessment, catch-up

**Tier:** OPTIONAL supplement (consolidation)

**Learning objectives**

- Check honestly what you retained from: Part 15 Days 71 to 73 and Part 16 Days 74 to 76.
- Take the part assessment closed book and list the 2-3 weakest topics.
- Use the catch-up slots for the deferred or skipped material of this week.

**Topics:** Part 15 Days 71 to 73 and Part 16 Days 74 to 76

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of this week's key concepts (cover and recall; use the day-by-day table in 4.4) | Revision and questions |
| 40 | Part assessment(s) listed below, closed book, timed | Revision and questions |
| 15 | Mark with the answer key; list weak areas | Wrap-up and tests |
| 20 | Catch-up reading: Part 16 Module 7 (10x traffic with autocannon, deferred) and Module 3 (partition), then weak areas | Reading |
| 15 | Catch-up lab: Re-run the failure you understood least (MySQL down, Redis down or slow dependency) and rewrite its before/after table. | Coding |
| 5 | Log hours (target 14 h this week), plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Day 7: assessment sections are used as exams, not read first)**

| File | Section | Lines | Line count | Prose words | Code lines |
|------|---------|-------|------------|-------------|------------|
| 15_Observability_Cloud_CICD.md | Summary, assessment, hours and verification log | 2761-2863 | 103 | 1851 | 6 |
| 16_Chaos_Lab.md | Module 7 - Failure 7: 10x traffic with autocannon | 3405-3683 | 279 | 1387 | 142 |

- **Assessment:** 15_Observability_Cloud_CICD.md lines 2761-2863. Target 70 percent or more. Below 70 percent: redo the weakest module of that part before moving on (counts as one missed day, see 5.4).
- **Catch-up reading section:** 16_Chaos_Lab.md: Module 7 - Failure 7: 10x traffic with autocannon (lines 3405-3683).

**Interview questions to revise:** Your 10 weakest of Q-OBS-14..37 and CH-Q1..CH-Q12. Answer each aloud in under 90 seconds.

**Spaced revisits today:** Day 76: Part 16: Slow dependency and timeouts; Day 74: Part 16: Chaos setup, kill MySQL; Day 70: Week 10 supplement weak areas.

**Daily learning outcomes**

- I know my assessment scores for this week and my weakest 2-3 topics.
- I repaired at least one weak topic by re-reading plus redoing a lab.
- Deferred items are written down with a date, not forgotten.

**Completion checklist**

- [ ] Spaced revisit done
- [ ] Assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Catch-up reading done
- [ ] Catch-up lab done
- [ ] Week 11 hours logged (target 14 h)

### 6.8 Week 12 -- Chaos Lab finish and the Payments Capstone begins (Days 78-84)

- **OPTIONAL.** Starts only after the core 56 days.
- **Notes files:** `16_Chaos_Lab.md`, `17_Capstone_Payments_Project.md`
- **Week goal:** Finish the failure experiments (pool exhaustion, rolling restart), write an incident review, and start the payments capstone: run it, then understand schema, auth and the idempotent POST /payments.
- **Never skip this week:** Graceful shutdown under load, pool exhaustion symptoms, idempotency transaction pattern, outbox purpose.
- **Skip first if behind:** Capstone Stage 1, 5, 8, 10 (skim only); chaos Module 7 (10x traffic) and Module 3 runs.

#### Supplement Week 12 / Day 1 (overall Day 78) -- Part 16: Failure 6: connection pool exhaustion; Failure 8 (rolling restart) read

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Exhaust the MySQL pool, read the symptoms, and size/limit it properly.
- Understand why a rolling deploy returns 502s without graceful shutdown.

**Topics:** Module 6 pool exhaustion (run); Module 8 rolling restart (read first half)

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): Module 6 (Failure 6); Module 8 (Failure 8) | Reading |
| 45 | Lab / build: Run Module 6; for Module 8 run only the baseline (no shutdown handler) and read the fix. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`16_Chaos_Lab.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 16_Chaos_Lab.md | Module 6 - Failure 6: exhaust the MySQL connection pool | 3000-3404 | 405 | 1400 | 253 |
| 16_Chaos_Lab.md | Module 8 - Failure 8: rolling restart (deploy) under load with | 3684-3979 | 296 | 1222 | 167 |
| | **Total** | | **701** | **2622** | **420** |

- **Estimate:** 2622 prose words / 150 wpm = 17 min, plus 2 x 2 min aloud recall = 21 min of reading against a read slot of 35 min (fits). The 420 code lines are commands and examples you run in the lab slot (about 42 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Module 7 (10x traffic with autocannon) is DEFERRED; use the Week 6 / Day 6 load-testing notes instead.

**Coding practice:** Run Module 6; for Module 8 run only the baseline (no shutdown handler) and read the fix.

**Interview questions to revise:** CH-Q13..CH-Q17 (graceful shutdown, random 502s, pool sizing and exhaustion, 10x traffic, backpressure). ID scheme for this part: CH-Q1..CH-Q25 (Module 11, printed as Q1..Q25).

**Spaced revisits today:** Day 77: Week 11 supplement weak areas; Day 75: Part 16: Kill Redis, duplicates and DLQ; Day 71: Part 15: SLI/SLO, burn-rate alerts.

**Daily learning outcomes**

- I can describe the pool-exhaustion symptom in logs and metrics.
- I can say why 502s appear during deploys.
- I can explain backpressure in this system.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CH-Q13..CH-Q17
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 12 / Day 2 (overall Day 79) -- Part 16: Rolling restart fix, incident review, Part 12 corrections, chaos questions

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Apply and verify the graceful-shutdown fix under load.
- Write one blameless incident review and apply the Part 12 corrections.

**Topics:** Module 8 fix (run); Module 9 incident review; Module 10 Part 12 corrections; Module 11 questions

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Module 9 (Incident review); Module 10 (Bugs and wrong claims found in) | Reading |
| 55 | Lab / build: Finish the Module 8 SIGTERM fix and re-run the load; fill the blank incident template for the failure you liked best; apply at least two of the Module 10 corrections to your Task API. | Coding |
| 15 | Spaced revisit of the days in the line below (7 min) plus the questions listed below (8 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`16_Chaos_Lab.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 16_Chaos_Lab.md | Module 9 - Incident review: one complete example and a blank t | 3980-4154 | 175 | 1506 | 37 |
| 16_Chaos_Lab.md | Module 10 - Bugs and wrong claims found in 12_Project_Task_API | 4155-4329 | 175 | 981 | 67 |
| | **Total** | | **350** | **2487** | **104** |

- **Estimate:** 2487 prose words / 150 wpm = 17 min, plus 2 x 2 min aloud recall = 21 min of reading against a read slot of 30 min (fits). The 104 code lines are commands and examples you run in the lab slot (about 10 min of pure reading at 10 lines per min if you only read them).
- **Used in the revise / questions slot (not counted as reading):** 16_Chaos_Lab.md: Module 11 - Interview questions and answers (lines 4330-4560, 231 lines).
- **Skip for now:** Deferred: Module 3 and Module 7 runs (about 4.5 h in the Part 16 hours table); CH-Q22 is [ADVANCED].

**Coding practice:** Finish the Module 8 SIGTERM fix and re-run the load; fill the blank incident template for the failure you liked best; apply at least two of the Module 10 corrections to your Task API.

**Interview questions to revise:** CH-Q18..CH-Q25 plus any earlier CH-Q you found hard (all 25 are in Module 11). ID scheme for this part: CH-Q1..CH-Q25 (Module 11, printed as Q1..Q25).

**Spaced revisits today:** Day 78: Part 16: Pool exhaustion, rolling restart; Day 76: Part 16: Slow dependency and timeouts; Day 72: Part 15: CI/CD and deployment strategies.

**Daily learning outcomes**

- I have a written incident review with timeline, impact, causes and actions.
- I corrected the known issues in my Task API.
- I can tell a chaos story using real numbers.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CH-Q18..CH-Q25 plus any earlier CH-Q you found hard
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 12 / Day 3 (overall Day 80) -- Part 17: Capstone overview, architecture, ADRs and running the finished system

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Run the finished payments capstone with one command and read its architecture.
- Explain the key decisions recorded in the ADRs.

**Topics:** 0 Overview, architecture, folder tree, how to run; Stage 0 ADRs

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): 0. Overview, architecture, folder tree, ; Stage 0 (ADRs written first) | Reading |
| 50 | Lab / build: Run the compose stack and the smoke test from section 0 (cap-mysql 33066, cap-redis 63793); trace one POST /payments through the folder tree. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`17_Capstone_Payments_Project.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 17_Capstone_Payments_Project.md | 0. Overview, architecture, folder tree, how to run | 45-295 | 251 | 752 | 153 |
| 17_Capstone_Payments_Project.md | Stage 0 - ADRs written first | 296-561 | 266 | 2450 | 0 |
| | **Total** | | **517** | **3202** | **153** |

- **Estimate:** 3202 prose words / 150 wpm = 21 min, plus 2 x 2 min aloud recall = 25 min of reading against a read slot of 30 min (fits). The 153 code lines are commands and examples you run in the lab slot (about 15 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Capstone track mode: this track runs the finished system and deep-studies 4 stages; a full stage-by-stage build is 38 to 60 hours (see 6.3).

**Coding practice:** Run the compose stack and the smoke test from section 0 (cap-mysql 33066, cap-redis 63793); trace one POST /payments through the folder tree.

**Interview questions to revise:** CAP-Q3 (why not just a Redis lock, ADR 0003) and CAP-Q20 (weakest part of the design); read CAP-Q1..CAP-Q2 as a preview. ID scheme for this part: CAP-Q1..CAP-Q20 (+2 bonus; printed as Q1..Q22).

**Spaced revisits today:** Day 79: Part 16: Incident review, Part 12 fixes; Day 77: Week 11 supplement weak areas; Day 73: Part 15: AWS basics and incident questions.

**Daily learning outcomes**

- I can draw the architecture on paper from memory.
- I can name the three places the system de-duplicates a payment.
- The finished system runs on my machine.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CAP-Q3
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 12 / Day 4 (overall Day 81) -- Part 17: Schema, auth and orders (study by reading plus running)

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Read the domain model, money-as-integer-cents rule and the order state machine.
- Read how auth/RBAC plug into the orders routes.

**Topics:** Stage 2 domain model and schema; Stage 3 auth, RBAC and orders

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Stage 2 (Domain model and schema); Stage 3 (Auth, RBAC and orders) | Reading |
| 50 | Lab / build: Run each stage acceptance check against the finished system; write the SQL schema tables from memory afterwards; list every constraint and index and the reason for it. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`17_Capstone_Payments_Project.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 17_Capstone_Payments_Project.md | Stage 2 - Domain model and schema | 1069-1419 | 351 | 739 | 233 |
| 17_Capstone_Payments_Project.md | Stage 3 - Auth, RBAC and orders | 1420-1733 | 314 | 896 | 183 |
| | **Total** | | **665** | **1635** | **416** |

- **Estimate:** 1635 prose words / 150 wpm = 11 min, plus 2 x 2 min aloud recall = 15 min of reading against a read slot of 30 min (fits). The 416 code lines are commands and examples you run in the lab slot (about 42 min of pure reading at 10 lines per min if you only read them).
- **Skim only (headings and the key-takeaway lines):** 17_Capstone_Payments_Project.md: Stage 1 - Scaffold: config, logging, errors, DB and Redis, (lines 562-1068, 507 lines).
- **Skip for now:** Stage 1 scaffold (config, logging, DB and Redis wiring, 15 reading-min of mostly code) is skimmed, not built.

**Coding practice:** Run each stage acceptance check against the finished system; write the SQL schema tables from memory afterwards; list every constraint and index and the reason for it.

**Interview questions to revise:** CAP-Q12 (ledger and double-entry; schema side in Stage 2) and re-read CAP-Q1..CAP-Q3 from yesterday. ID scheme for this part: CAP-Q1..CAP-Q20 (+2 bonus; printed as Q1..Q22).

**Spaced revisits today:** Day 80: Part 17: Capstone overview and ADRs; Day 78: Part 16: Pool exhaustion, rolling restart; Day 74: Part 16: Chaos setup, kill MySQL.

**Daily learning outcomes**

- I can say why amounts are integer cents.
- I can explain the order state machine.
- I can explain where RBAC is enforced.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CAP-Q12
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 12 / Day 5 (overall Day 82) -- Part 17: Stage 4: idempotent POST /payments

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain and rebuild the idempotency table pattern: key + request hash + stored response in one transaction.
- Prove with a test that 50 concurrent duplicates give exactly one charge.

**Topics:** Stage 4 idempotent POST /payments

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Stage 4 (Idempotent POST /payments) | Reading |
| 55 | Lab / build: Re-type the core transaction (ON DUPLICATE KEY UPDATE, SELECT FOR UPDATE, replay or 422) from the part; run the 50-duplicate test; then break it (remove the lock) and watch the test fail. | Coding |
| 15 | Spaced revisit of the days in the line below (7 min) plus the questions listed below (8 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`17_Capstone_Payments_Project.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 17_Capstone_Payments_Project.md | Stage 4 - Idempotent POST /payments | 1734-2106 | 373 | 1259 | 210 |
| | **Total** | | **373** | **1259** | **210** |

- **Estimate:** 1259 prose words / 150 wpm = 8 min, plus 1 x 2 min aloud recall = 10 min of reading against a read slot of 30 min (fits). The 210 code lines are commands and examples you run in the lab slot (about 21 min of pure reading at 10 lines per min if you only read them).
- **Skim only (headings and the key-takeaway lines):** 17_Capstone_Payments_Project.md: Stage 5 - The fake payment provider (lines 2107-2447, 341 lines).
- **Skip for now:** Stage 5 (fake payment provider, 10 reading-min) is skimmed.

**Coding practice:** Re-type the core transaction (ON DUPLICATE KEY UPDATE, SELECT FOR UPDATE, replay or 422) from the part; run the 50-duplicate test; then break it (remove the lock) and watch the test fail.

**Interview questions to revise:** CAP-Q1..CAP-Q3 (idempotent POST /payments, two identical requests, why not a Redis lock); background: Week 6 / Day 3 notes. ID scheme for this part: CAP-Q1..CAP-Q20 (+2 bonus; printed as Q1..Q22).

**Spaced revisits today:** Day 81: Part 17: Capstone schema, auth, orders; Day 79: Part 16: Incident review, Part 12 fixes; Day 75: Part 16: Kill Redis, duplicates and DLQ.

**Daily learning outcomes**

- I can explain why concurrent duplicates serialise on the key row lock.
- I can explain why a different payload with the same key returns 422.
- I have seen the concurrency test fail when the lock is removed.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CAP-Q1..CAP-Q3
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 12 / Day 6 (overall Day 83) -- Part 17: Stage 6: transactional outbox, relay, BullMQ worker, retries, DLQ

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain why the outbox solves the dual-write problem and how the relay and worker stay idempotent.
- Explain retry, backoff with jitter and DLQ behaviour on a poison job.

**Topics:** Stage 6 transactional outbox, relay, BullMQ worker, retries, backoff and jitter, DLQ

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Stage 6 (Transactional outbox, relay, BullMQ) | Reading |
| 55 | Lab / build: Follow the own acceptance checks of the stage; as an extra experiment stop the worker, create payments, restart it and watch the outbox backlog drain; make one job fail permanently and find it in the DLQ. | Coding |
| 15 | Spaced revisit of the days in the line below (7 min) plus the questions listed below (8 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`17_Capstone_Payments_Project.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 17_Capstone_Payments_Project.md | Stage 6 - Transactional outbox, relay, BullMQ worker, retries, | 2448-2881 | 434 | 1455 | 256 |
| | **Total** | | **434** | **1455** | **256** |

- **Estimate:** 1455 prose words / 150 wpm = 10 min, plus 1 x 2 min aloud recall = 12 min of reading against a read slot of 30 min (fits). The 256 code lines are commands and examples you run in the lab slot (about 26 min of pure reading at 10 lines per min if you only read them).
- **Skim only (headings and the key-takeaway lines):** 17_Capstone_Payments_Project.md: Stage 8 - Caching with explicit invalidation, rate limiting, (lines 3286-3526, 241 lines); 17_Capstone_Payments_Project.md: Stage 10 - Observability: structured logs, correlation ids, (lines 3830-3988, 159 lines).
- **Skip for now:** Stage 8 (cache, rate limiting, keyset pagination) and Stage 10 (observability) are skimmed or covered by Parts 15 and 18.

**Coding practice:** Follow the own acceptance checks of the stage; as an extra experiment stop the worker, create payments, restart it and watch the outbox backlog drain; make one job fail permanently and find it in the DLQ.

**Interview questions to revise:** CAP-Q4..CAP-Q8 (outbox, exactly-once, retries and jitter, retries exhausted, provider timeout). ID scheme for this part: CAP-Q1..CAP-Q20 (+2 bonus; printed as Q1..Q22).

**Spaced revisits today:** Day 82: Part 17: Idempotent POST /payments; Day 80: Part 17: Capstone overview and ADRs; Day 76: Part 16: Slow dependency and timeouts.

**Daily learning outcomes**

- I can describe the dual-write problem in one sentence.
- I can explain at-least-once delivery plus idempotent consumers.
- I know where a failed payment job ends up.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CAP-Q4..CAP-Q8
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 12 / Day 7 (overall Day 84) -- Revision, assessment, catch-up

**Tier:** OPTIONAL supplement (consolidation)

**Learning objectives**

- Check honestly what you retained from: Part 16 Days 78 to 79 and Part 17 Days 80 to 83.
- Take the part assessment closed book and list the 2-3 weakest topics.
- Use the catch-up slots for the deferred or skipped material of this week.

**Topics:** Part 16 Days 78 to 79 and Part 17 Days 80 to 83

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of this week's key concepts (cover and recall; use the day-by-day table in 4.4) | Revision and questions |
| 40 | Part assessment(s) listed below, closed book, timed | Revision and questions |
| 15 | Mark with the answer key; list weak areas | Wrap-up and tests |
| 20 | Catch-up reading: Part 17 Stage 1 and Stage 5 (skimmed), then weak areas | Reading |
| 15 | Catch-up lab: Re-type the Stage 4 idempotency transaction or the Stage 6 outbox insert from a blank file. | Coding |
| 5 | Log hours (target 14 h this week), plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Day 7: assessment sections are used as exams, not read first)**

| File | Section | Lines | Line count | Prose words | Code lines |
|------|---------|-------|------------|-------------|------------|
| 16_Chaos_Lab.md | Assessment (mixed difficulty) and answers | 4649-4688 | 40 | 765 | 0 |
| 17_Capstone_Payments_Project.md | Summary, assessment and hours estimate | 5547-5655 | 109 | 1549 | 0 |
| 17_Capstone_Payments_Project.md | Stage 1 - Scaffold: config, logging, errors, DB and Redis, hea | 562-1068 | 507 | 793 | 355 |

- **Assessment:** 16_Chaos_Lab.md lines 4649-4688; 17_Capstone_Payments_Project.md lines 5547-5655. Target 70 percent or more. Below 70 percent: redo the weakest module of that part before moving on (counts as one missed day, see 5.4).
- **Catch-up reading section:** 17_Capstone_Payments_Project.md: Stage 1 - Scaffold: config, logging, errors, DB an (lines 562-1068).

**Interview questions to revise:** Your 10 weakest of CH-Q13..CH-Q25 and CAP-Q1..CAP-Q8. Answer each aloud in under 90 seconds.

**Spaced revisits today:** Day 83: Part 17: Outbox, worker, retries, DLQ; Day 81: Part 17: Capstone schema, auth, orders; Day 77: Week 11 supplement weak areas.

**Daily learning outcomes**

- I know my assessment scores for this week and my weakest 2-3 topics.
- I repaired at least one weak topic by re-reading plus redoing a lab.
- Deferred items are written down with a date, not forgotten.

**Completion checklist**

- [ ] Spaced revisit done
- [ ] Assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Catch-up reading done
- [ ] Catch-up lab done
- [ ] Week 12 hours logged (target 14 h)

### 6.9 Week 13 -- Capstone finish and the URL Shortener Build (Days 85-91)

- **OPTIONAL.** Starts only after the core 56 days.
- **Notes files:** `17_Capstone_Payments_Project.md`, `18_URL_Shortener_Build.md`
- **Week goal:** Explain webhooks, the state machine and the ledger; pitch the capstone; then build the shortener core: schema, auth, create, redirect with cache, rate limit, tests.
- **Never skip this week:** Capstone idempotency + outbox + webhook-dedupe trio, 302 vs 301, cache-aside pitfalls, collision retry.
- **Skip first if behind:** URL shortener Stage 5 detail, Stage 7 (OpenAPI), CI workflow detail; capstone Stage 11 beyond the concurrency test.

#### Supplement Week 13 / Day 1 (overall Day 85) -- Part 17: Stage 7: signed webhooks, settlement state machine, double-entry ledger

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain HMAC-signed webhooks over the raw body with timestamp and event-id dedupe.
- Explain the forward-only settlement state machine and the double-entry ledger.

**Topics:** Stage 7 webhooks, settlement state machine, ledger

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Stage 7 (Signed webhooks, settlement state) | Reading |
| 55 | Lab / build: Replay a signed webhook twice and a tampered webhook once; read the ledger entries for one payment and check debits equal credits. | Coding |
| 15 | Spaced revisit of the days in the line below (7 min) plus the questions listed below (8 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`17_Capstone_Payments_Project.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 17_Capstone_Payments_Project.md | Stage 7 - Signed webhooks, settlement state machine, double-en | 2882-3285 | 404 | 1513 | 233 |
| | **Total** | | **404** | **1513** | **233** |

- **Estimate:** 1513 prose words / 150 wpm = 10 min, plus 1 x 2 min aloud recall = 12 min of reading against a read slot of 30 min (fits). The 233 code lines are commands and examples you run in the lab slot (about 23 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing else in this part is scheduled for this day.

**Coding practice:** Replay a signed webhook twice and a tampered webhook once; read the ledger entries for one payment and check debits equal credits.

**Interview questions to revise:** CAP-Q9..CAP-Q13 (webhook security, duplicate/out-of-order webhooks, 200 for duplicates, ledger, load-test finding). ID scheme for this part: CAP-Q1..CAP-Q20 (+2 bonus; printed as Q1..Q22).

**Spaced revisits today:** Day 84: Week 12 supplement weak areas; Day 82: Part 17: Idempotent POST /payments; Day 78: Part 16: Pool exhaustion, rolling restart.

**Daily learning outcomes**

- I can explain why the webhook route needs the raw body.
- I can explain why the ledger is append-only.
- I can explain why a state machine only moves forward.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CAP-Q9..CAP-Q13
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 13 / Day 2 (overall Day 86) -- Part 17: Reconciliation, the concurrency test, and explaining the project

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain what the reconciliation job proves and how the concurrency test was built.
- Deliver the 3-minute and 10-minute pitch of the capstone.

**Topics:** Stage 9 reconciliation; Stage 11 tests (concurrency part only); how to explain the project; interview Q&A

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Stage 9 (Reconciliation job); How to explain this project in an interv | Reading |
| 40 | Lab / build: Read only the 50-duplicate-requests test and the mutation check in Stage 11 and re-run them; record a 3-minute pitch. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 30 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`17_Capstone_Payments_Project.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 17_Capstone_Payments_Project.md | Stage 9 - Reconciliation job | 3527-3829 | 303 | 809 | 184 |
| 17_Capstone_Payments_Project.md | How to explain this project in an interview | 5368-5432 | 65 | 767 | 0 |
| | **Total** | | **368** | **1576** | **184** |

- **Estimate:** 1576 prose words / 150 wpm = 11 min, plus 2 x 2 min aloud recall = 15 min of reading against a read slot of 30 min (fits). The 184 code lines are commands and examples you run in the lab slot (about 18 min of pure reading at 10 lines per min if you only read them).
- **Used in the revise / questions slot (not counted as reading):** 17_Capstone_Payments_Project.md: Interview Q&A (lines 5433-5525, 93 lines).
- **Skim only (headings and the key-takeaway lines):** 17_Capstone_Payments_Project.md: Stage 11 - Tests (lines 3989-4852, 864 lines); 17_Capstone_Payments_Project.md: Stage 12 - Docker Compose one-command run, smoke test, load (lines 4853-5367, 515 lines).
- **Skip for now:** Stage 11 other tests (about 28 reading-min, 674 code lines) and Stage 12 Docker/load test are skimmed; the part's Limitations section is a 2-minute read.

**Coding practice:** Read only the 50-duplicate-requests test and the mutation check in Stage 11 and re-run them; record a 3-minute pitch.

**Interview questions to revise:** CAP-Q14..CAP-Q20 plus the 2 bonus questions; re-answer any of CAP-Q1..CAP-Q13 you missed. ID scheme for this part: CAP-Q1..CAP-Q20 (+2 bonus; printed as Q1..Q22).

**Spaced revisits today:** Day 85: Part 17: Webhooks, state machine, ledger; Day 83: Part 17: Outbox, worker, retries, DLQ; Day 79: Part 16: Incident review, Part 12 fixes.

**Daily learning outcomes**

- I can pitch the capstone in 3 minutes.
- I can state its three biggest limitations.
- I can explain how I verified exactly-one-charge.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: CAP-Q14..CAP-Q20 plus the 2 bonus questions; re-answer any of CAP-Q1..CAP-Q13 you missed
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 13 / Day 3 (overall Day 87) -- Part 18: URL shortener: requirements, skeleton, schema and auth

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Build the skeleton with config, schema (ascii_bin short code, unique index) and per-user auth.
- Know why this part does not repeat the design theory of Week 7 / Day 3.

**Topics:** Overview; Stage 1 requirements, skeleton, config, schema; Stage 2 authentication and per-user links

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Overview: how to use this file, folder t; Stage 1 (Requirements, project skeleton,); Stage 2 (Authentication and per-user links) | Reading |
| 55 | Lab / build: Type Stage 1 and Stage 2: package, config, docker compose (us-mysql 33067, us-redis 63794), schema, signup/login; run the acceptance checks. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`18_URL_Shortener_Build.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 18_URL_Shortener_Build.md | Overview: how to use this file, folder tree, design decisions | 28-163 | 136 | 983 | 35 |
| 18_URL_Shortener_Build.md | Stage 1 - Requirements, project skeleton, config and schema | 164-553 | 390 | 641 | 237 |
| 18_URL_Shortener_Build.md | Stage 2 - Authentication and per-user links | 554-751 | 198 | 509 | 100 |
| | **Total** | | **724** | **2133** | **372** |

- **Estimate:** 2133 prose words / 150 wpm = 14 min, plus 3 x 2 min aloud recall = 20 min of reading against a read slot of 25 min (fits). The 372 code lines are commands and examples you run in the lab slot (about 37 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing tagged [ADVANCED]; Stage 7 (OpenAPI, 20 reading-min) is skipped in this track.

**Coding practice:** Type Stage 1 and Stage 2: package, config, docker compose (us-mysql 33067, us-redis 63794), schema, signup/login; run the acceptance checks.

**Interview questions to revise:** Q-URL-05, Q-URL-13..15 (ascii_bin, 404 vs 403, JWT limits, user enumeration). ID scheme for this part: Q-URL (24).

**Spaced revisits today:** Day 86: Part 17: Reconciliation and project pitch; Day 84: Week 12 supplement weak areas; Day 80: Part 17: Capstone overview and ADRs.

**Daily learning outcomes**

- I can run the skeleton and log in.
- I can explain ascii_bin for the code column.
- I can explain why a foreign link returns 404.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-URL-05, Q-URL-13..15
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 13 / Day 4 (overall Day 88) -- Part 18: Create links: validation, code generation, idempotent create

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Implement random code generation with a unique index and retry, and idempotent create.
- Explain why not a hash and not an auto-increment counter.

**Topics:** Stage 3 create links: validation, code generation, idempotency

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Stage 3 (Create links) | Reading |
| 55 | Lab / build: Type Stage 3; write the collision-retry test with a forced collision. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`18_URL_Shortener_Build.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 18_URL_Shortener_Build.md | Stage 3 - Create links: validation, code generation, idempoten | 752-1253 | 502 | 756 | 355 |
| | **Total** | | **502** | **756** | **355** |

- **Estimate:** 756 prose words / 150 wpm = 5 min, plus 1 x 2 min aloud recall = 7 min of reading against a read slot of 25 min (fits). The 355 code lines are commands and examples you run in the lab slot (about 36 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing tagged [ADVANCED].

**Coding practice:** Type Stage 3; write the collision-retry test with a forced collision.

**Interview questions to revise:** Q-URL-02..04 and Q-URL-11 (random vs counter vs hash, collision rate, idempotent create). ID scheme for this part: Q-URL (24).

**Spaced revisits today:** Day 87: Part 18: URL shortener skeleton and auth; Day 85: Part 17: Webhooks, state machine, ledger; Day 81: Part 17: Capstone schema, auth, orders.

**Daily learning outcomes**

- I can explain the collision-retry loop.
- I can explain how idempotent create works.
- I can say what changes when collisions rise.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-URL-02..04 and Q-URL-11
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 13 / Day 5 (overall Day 89) -- Part 18: Redirect, cache-aside, click counting and rate limiting

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Build the redirect with Redis cache-aside, 302 vs 301 and async click counting.
- Add the sliding-window limiter and explain its Lua script.

**Topics:** Stage 4 redirect and cache-aside; Stage 6 rate limiting; Stage 5 skimmed

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): Stage 4 (Redirect, 302 vs 301, Redis); Stage 6 (Rate limiting) | Reading |
| 55 | Lab / build: Type Stage 4 and Stage 6; kill Redis and confirm the redirect still works (fail-open). | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`18_URL_Shortener_Build.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 18_URL_Shortener_Build.md | Stage 4 - Redirect, 302 vs 301, Redis cache-aside, click count | 1254-1439 | 186 | 688 | 82 |
| 18_URL_Shortener_Build.md | Stage 6 - Rate limiting (sliding window, Redis Lua) | 1630-1770 | 141 | 589 | 56 |
| | **Total** | | **327** | **1277** | **138** |

- **Estimate:** 1277 prose words / 150 wpm = 9 min, plus 2 x 2 min aloud recall = 13 min of reading against a read slot of 25 min (fits). The 138 code lines are commands and examples you run in the lab slot (about 14 min of pure reading at 10 lines per min if you only read them).
- **Skim only (headings and the key-takeaway lines):** 18_URL_Shortener_Build.md: Stage 5 - Expiration, stats, delete, pagination, cleanup job (lines 1440-1629, 190 lines).
- **Skip for now:** Stage 5 (expiry, stats, delete, pagination, cleanup) is skimmed: read its headings and the cleanup-job idea only.

**Coding practice:** Type Stage 4 and Stage 6; kill Redis and confirm the redirect still works (fail-open).

**Interview questions to revise:** Q-URL-01, 06..10, 16..17 (302 vs 301, cache-aside pitfalls, Redis down, sliding window, many instances, click counting, expiry). ID scheme for this part: Q-URL (24).

**Spaced revisits today:** Day 88: Part 18: Create links and codes; Day 86: Part 17: Reconciliation and project pitch; Day 82: Part 17: Idempotent POST /payments.

**Daily learning outcomes**

- I can explain 302 vs 301 for a shortener.
- I can explain cache-aside and its stale-data window.
- I can explain why the rate limiter needs Lua or atomicity.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-URL-01, 06..10, 16..17
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 13 / Day 6 (overall Day 90) -- Part 18: Tests, Docker, load test, README, and the URL shortener Q&A

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Run the integration suite against real MySQL and Redis and read how it is organised.
- Write the README and run the load test; answer the Part 18 question bank.

**Topics:** Stage 8 tests (read strategy, run suite, write 3 tests); Stage 9 Docker/CI (read); Stage 10 load test, README; interview Q&A

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 30 | Read these sections (prose; the code in them is run in the lab slot): Stage 8 (Tests); Stage 10 (Load test, README, and shipping it) | Reading |
| 45 | Lab / build: Run the full suite; add 3 tests of your own; build the Docker image and run compose; run the load test once and record the numbers with the machine caveat. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 25 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`18_URL_Shortener_Build.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 18_URL_Shortener_Build.md | Stage 8 - Tests: unit + integration with real MySQL and Redis | 2379-3488 | 1110 | 686 | 877 |
| 18_URL_Shortener_Build.md | Stage 10 - Load test, README, and shipping it | 3766-4032 | 267 | 719 | 150 |
| | **Total** | | **1377** | **1405** | **1027** |

- **Estimate:** 1405 prose words / 150 wpm = 9 min, plus 2 x 2 min aloud recall = 13 min of reading against a read slot of 30 min (fits). The 1027 code lines are commands and examples you run in the lab slot (about 103 min of pure reading at 10 lines per min if you only read them).
- **Used in the revise / questions slot (not counted as reading):** 18_URL_Shortener_Build.md: Interview Q&A (lines 4033-4179, 147 lines).
- **Skim only (headings and the key-takeaway lines):** 18_URL_Shortener_Build.md: Stage 9 - Docker (lines 3489-3765, 277 lines).
- **Skip for now:** Stage 7 (OpenAPI, error contract, 20 reading-min, 468 code lines) and the detailed CI workflow are not scheduled; add them if you target API-contract roles.

**Coding practice:** Run the full suite; add 3 tests of your own; build the Docker image and run compose; run the load test once and record the numbers with the machine caveat.

**Interview questions to revise:** Q-URL-12, 18..24 and any earlier Q-URL you missed. ID scheme for this part: Q-URL (24).

**Spaced revisits today:** Day 89: Part 18: Redirect, cache-aside, rate limit; Day 87: Part 18: URL shortener skeleton and auth; Day 83: Part 17: Outbox, worker, retries, DLQ.

**Daily learning outcomes**

- I can run the full test suite from a clean clone.
- I can explain why integration tests use real MySQL and Redis.
- I can answer how this would scale to 40,000 redirects per second.

**Completion checklist**

- [ ] Read the reading-plan sections (~30 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-URL-12, 18..24 and any earlier Q-URL you missed
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 13 / Day 7 (overall Day 91) -- Revision, assessment, catch-up

**Tier:** OPTIONAL supplement (consolidation)

**Learning objectives**

- Check honestly what you retained from: Part 17 Days 85 to 86 and Part 18 Days 87 to 90.
- Take the part assessment closed book and list the 2-3 weakest topics.
- Use the catch-up slots for the deferred or skipped material of this week.

**Topics:** Part 17 Days 85 to 86 and Part 18 Days 87 to 90

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of this week's key concepts (cover and recall; use the day-by-day table in 4.4) | Revision and questions |
| 40 | Part assessment(s) listed below, closed book, timed | Revision and questions |
| 15 | Mark with the answer key; list weak areas | Wrap-up and tests |
| 20 | Catch-up reading: Part 18 Stage 7 (error contract, OpenAPI, graceful shutdown) and Stage 5, then weak areas | Reading |
| 15 | Catch-up lab: Rebuild the redirect path (cache-aside with Redis, 302) from a blank file, or add one missing test to your URL shortener. | Coding |
| 5 | Log hours (target 14 h this week), plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Day 7: assessment sections are used as exams, not read first)**

| File | Section | Lines | Line count | Prose words | Code lines |
|------|---------|-------|------------|-------------|------------|
| 18_URL_Shortener_Build.md | Assessment | 4199-4250 | 52 | 766 | 0 |
| 18_URL_Shortener_Build.md | Stage 7 - Error contract, OpenAPI, app wiring, graceful shutdo | 1771-2378 | 608 | 725 | 468 |

- **Assessment:** 18_URL_Shortener_Build.md lines 4199-4250. Target 70 percent or more. Below 70 percent: redo the weakest module of that part before moving on (counts as one missed day, see 5.4).
- **Catch-up reading section:** 18_URL_Shortener_Build.md: Stage 7 - Error contract, OpenAPI, app wiring, gra (lines 1771-2378).

**Interview questions to revise:** Your 10 weakest of CAP-Q9..CAP-Q20 and Q-URL-01..24. Answer each aloud in under 90 seconds.

**Spaced revisits today:** Day 90: Part 18: Tests, Docker, load test, Q&A; Day 88: Part 18: Create links and codes; Day 84: Week 12 supplement weak areas.

**Daily learning outcomes**

- I know my assessment scores for this week and my weakest 2-3 topics.
- I repaired at least one weak topic by re-reading plus redoing a lab.
- Deferred items are written down with a date, not forgotten.

**Completion checklist**

- [ ] Spaced revisit done
- [ ] Assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Catch-up reading done
- [ ] Catch-up lab done
- [ ] Week 13 hours logged (target 14 h)

### 6.10 Week 14 -- Concurrency, Distributed Systems and Career Material (Days 92-98)

- **OPTIONAL.** Starts only after the core 56 days.
- **Notes files:** `19_Concurrency_Distributed_Systems.md`, `20_Resume_Portfolio_Career.md`
- **Week goal:** Reproduce and fix a lost update, explain CAP, idempotency, retries, saga and the outbox, do capacity maths; then finish a resume, portfolio, behavioural stories and a 30-day application calendar.
- **Never skip this week:** Lost-update fixes, CAP and idempotency answers, Little's law, the transition story and a one-page resume.
- **Skip first if behind:** Labs 3-6, B2, B6, B8 of Part 19; Modules 9, 11, 12 of Part 20 as separate sittings.

#### Supplement Week 14 / Day 1 (overall Day 92) -- Part 19: Races and lost updates: single process, MySQL, and the 10,000 users answer

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Reproduce an async check-then-act race and the MySQL lost update, then fix both.
- Answer "what happens when 10,000 users update the same record" in a structured way.

**Topics:** Lab 0 setup; Lab 1 race in one process; Lab 2 MySQL lost update; Lab 7 the 10,000 users answer

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): Lab 0 (Setup and ground rules); Lab 1 (A race inside ONE Node process); Lab 2 (The database lost update); Lab 7 ("What happens when 10,000 users) | Reading |
| 45 | Lab / build: Run Lab 1 and Lab 2 (cd-mysql on 33068, cd-redis on 63795): see the wrong total, then fix with an atomic UPDATE and with SELECT FOR UPDATE. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`19_Concurrency_Distributed_Systems.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 19_Concurrency_Distributed_Systems.md | Lab 0 - Setup and ground rules | 30-91 | 62 | 383 | 13 |
| 19_Concurrency_Distributed_Systems.md | Lab 1 - A race inside ONE Node process (async check-then-act) | 92-236 | 145 | 661 | 64 |
| 19_Concurrency_Distributed_Systems.md | Lab 2 - The database lost update: 10,000 concurrent updates on | 237-532 | 296 | 1774 | 124 |
| 19_Concurrency_Distributed_Systems.md | Lab 7 - "What happens when 10,000 users update the same record | 1080-1153 | 74 | 894 | 0 |
| | **Total** | | **577** | **3712** | **201** |

- **Estimate:** 3712 prose words / 150 wpm = 25 min, plus 4 x 2 min aloud recall = 33 min of reading against a read slot of 35 min (fits). The 201 code lines are commands and examples you run in the lab slot (about 20 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Lab 3 (SharedArrayBuffer + Atomics) is [ADVANCED] and Lab 4, 5, 6 are skimmed or deferred (see 6.3).

**Coding practice:** Run Lab 1 and Lab 2 (cd-mysql on 33068, cd-redis on 63795): see the wrong total, then fix with an atomic UPDATE and with SELECT FOR UPDATE.

**Interview questions to revise:** Q-CONC-01..10 (race conditions, lost updates, atomic UPDATE vs FOR UPDATE, 10,000 users, pool size vs hot row, deadlock). ID scheme for this part: Q-CONC (42).

**Spaced revisits today:** Day 91: Week 13 supplement weak areas; Day 89: Part 18: Redirect, cache-aside, rate limit; Day 85: Part 17: Webhooks, state machine, ledger.

**Daily learning outcomes**

- I can explain why Node can still have race conditions.
- I can fix a lost update in three ways.
- I can answer the 10,000-users question in 2 minutes.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-CONC-01..10
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 14 / Day 2 (overall Day 93) -- Part 19: CAP, idempotency and retries, saga and the outbox

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Explain CAP and eventual consistency without saying "pick two".
- Explain retry storms, idempotency keys, saga vs 2PC and the outbox.

**Topics:** B1 CAP and eventual consistency; B3 idempotency, retries, timeouts; B7 saga and 2PC; B4 and B5 skimmed

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): B1 (CAP theorem and eventual consistency); B3 (Idempotency, retries, timeouts); B7 (Saga and two-phase commit) | Reading |
| 40 | Lab / build: Run the B3 retry-storm demo and the B7 saga demo once each; skim B4 (circuit breaker) and B5 (Redis lock) headings and answers only. | Coding |
| 25 | Spaced revisit of the days in the line below (10 min) plus the questions listed below (15 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`19_Concurrency_Distributed_Systems.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 19_Concurrency_Distributed_Systems.md | B1 - CAP theorem and eventual consistency | 1154-1300 | 147 | 859 | 54 |
| 19_Concurrency_Distributed_Systems.md | B3 - Idempotency, retries, timeouts and retry storms | 1556-1776 | 221 | 1355 | 87 |
| 19_Concurrency_Distributed_Systems.md | B7 - Saga and two-phase commit | 2329-2589 | 261 | 1495 | 108 |
| | **Total** | | **629** | **3709** | **249** |

- **Estimate:** 3709 prose words / 150 wpm = 25 min, plus 3 x 2 min aloud recall = 31 min of reading against a read slot of 35 min (fits). The 249 code lines are commands and examples you run in the lab slot (about 25 min of pure reading at 10 lines per min if you only read them).
- **Skim only (headings and the key-takeaway lines):** 19_Concurrency_Distributed_Systems.md: B4 - Circuit breakers and backpressure (lines 1777-1967, 191 lines); 19_Concurrency_Distributed_Systems.md: B5 - Distributed locks with Redis: SET NX PX, tokens, (lines 1968-2196, 229 lines).
- **Skip for now:** B2 (Raft, [ADVANCED]), B6 (leader election) and B8 (failure ledger) are not scheduled; Q-CONC-22..24 and 31..33 only if time.

**Coding practice:** Run the B3 retry-storm demo and the B7 saga demo once each; skim B4 (circuit breaker) and B5 (Redis lock) headings and answers only.

**Interview questions to revise:** Q-CONC-18..21, 25..27, 34..36 (CAP, CP vs AP, eventual consistency, quorum, idempotency key, retries, timeouts, saga, 2PC, outbox). ID scheme for this part: Q-CONC (42).

**Spaced revisits today:** Day 92: Part 19: Races and lost updates; Day 90: Part 18: Tests, Docker, load test, Q&A; Day 86: Part 17: Reconciliation and project pitch.

**Daily learning outcomes**

- I can explain CP vs AP with a booking and a likes counter.
- I can explain why 2PC is avoided between microservices.
- I can say how the outbox gives atomic publish.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-CONC-18..21, 25..27, 34..36
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 14 / Day 3 (overall Day 94) -- Part 19: Capacity maths, SLO maths and the concurrency question bank

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Use Little's law to size a pool and do back-of-envelope QPS and storage.
- Do SLO and error-budget arithmetic and take the Part 19 assessment.

**Topics:** C1 latency, throughput, Little's law; C2 back-of-envelope; C3 SLOs; interview questions; assessment

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Read these sections (prose; the code in them is run in the lab slot): C1 (Latency vs throughput vs concurrency,); C3 (SLOs and error-budget math) | Reading |
| 25 | Lab / build: Do the C1 and C2 worked examples with pen and paper before reading the answers; redo the URL-shortener estimate with your own numbers. | Coding |
| 30 | Spaced revisit of the days in the line below (10 min) plus the questions listed below (20 min) | Revision and questions |
| 20 | Part 19 assessment (mixed difficulty), closed book, then mark it | Wrap-up and tests |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`19_Concurrency_Distributed_Systems.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 19_Concurrency_Distributed_Systems.md | C1 - Latency vs throughput vs concurrency, and Little's law | 2619-2789 | 171 | 1259 | 52 |
| 19_Concurrency_Distributed_Systems.md | C3 - SLOs and error-budget math | 3080-3184 | 105 | 967 | 11 |
| | **Total** | | **276** | **2226** | **63** |

- **Estimate:** 2226 prose words / 150 wpm = 15 min, plus 2 x 2 min aloud recall = 19 min of reading against a read slot of 25 min (fits). The 63 code lines are commands and examples you run in the lab slot (about 6 min of pure reading at 10 lines per min if you only read them).
- **Used in the revise / questions slot (not counted as reading):** 19_Concurrency_Distributed_Systems.md: Interview questions with answers (lines 3185-3355, 171 lines).
- **Used in the lab slot (do the exercises first, then check the answers):** 19_Concurrency_Distributed_Systems.md: C2 - Back-of-envelope worked examples: URL shortener, chat, (lines 2790-3079, 290 lines).
- **Skip for now:** Part 19 Labs 3-6, B2, B6, B8 (about 14 hours in its hours table) are deferred.

**Coding practice:** Do the C1 and C2 worked examples with pen and paper before reading the answers; redo the URL-shortener estimate with your own numbers.

**Interview questions to revise:** Q-CONC-11..17, 28..33 (skim), 37..42; re-answer your 5 weakest from Q-CONC-01..36. ID scheme for this part: Q-CONC (42).

**Spaced revisits today:** Day 93: Part 19: CAP, idempotency, saga; Day 91: Week 13 supplement weak areas; Day 87: Part 18: URL shortener skeleton and auth.

**Daily learning outcomes**

- I can size a DB pool using Little's law.
- I can estimate QPS and storage for 100 million URLs per month.
- I scored 70 percent or more on the part 19 assessment.

**Completion checklist**

- [ ] Read the reading-plan sections (~25 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-CONC-11..17, 28..33
- [ ] Spaced revisit done
- [ ] Part 19 assessment (mixed difficulty)
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 14 / Day 4 (overall Day 95) -- Part 20: Transition story, resume structure and bullet rewrites

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Write a two-minute transition story that is honest about frontend-to-backend.
- Rewrite your resume bullets impact-first.

**Topics:** Module 1 positioning; Module 2 resume; Module 3 bullet rewrite bank and template

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): Module 1 (Positioning the transition story); Module 2 (Resume); Module 3 (Bullet rewrite bank) | Reading |
| 45 | Lab / build: Write your story, then draft your one-page resume from the template and rewrite 8 bullets (Task API, capstone, URL shortener, chaos lab). | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`20_Resume_Portfolio_Career.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 20_Resume_Portfolio_Career.md | Module 1 - Positioning the transition story | 29-183 | 155 | 1203 | 24 |
| 20_Resume_Portfolio_Career.md | Module 2 - Resume: structure, impact-first bullets, what to cu | 184-354 | 171 | 1455 | 6 |
| 20_Resume_Portfolio_Career.md | Module 3 - Bullet rewrite bank (weak to strong) and one-page t | 355-532 | 178 | 1585 | 43 |
| | **Total** | | **504** | **4243** | **73** |

- **Estimate:** 4243 prose words / 150 wpm = 28 min, plus 3 x 2 min aloud recall = 34 min of reading against a read slot of 35 min (fits). The 73 code lines are commands and examples you run in the lab slot (about 7 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Nothing tagged [ADVANCED]; skip template variations you will not use.

**Coding practice:** Write your story, then draft your one-page resume from the template and rewrite 8 bullets (Task API, capstone, URL shortener, chaos lab).

**Interview questions to revise:** Q-CAR-01..07 (tell me about yourself, why backend, frontend value, no production experience, weakness). ID scheme for this part: Q-CAR (26).

**Spaced revisits today:** Day 94: Part 19: Capacity and SLO maths; Day 92: Part 19: Races and lost updates; Day 88: Part 18: Create links and codes.

**Daily learning outcomes**

- I have a 2-minute story I can say without notes.
- My resume has 8 impact-first bullets with numbers I can defend.
- I can answer "no production experience" honestly.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-CAR-01..07
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 14 / Day 5 (overall Day 96) -- Part 20: Portfolio, deployed demo and LinkedIn

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Make each repo hiring-ready: README, architecture diagram, ADRs, clean commits.
- Deploy one demo honestly and update LinkedIn.

**Topics:** Module 4 portfolio and GitHub; Module 5 deployed demo (skim); Module 6 LinkedIn and application strategy

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 35 | Read these sections (prose; the code in them is run in the lab slot): Module 4 (Portfolio and GitHub); Module 5 (Deployed demo guide); Module 6 (LinkedIn and application strategy) | Reading |
| 45 | Lab / build: Fix the README of your best repo with the Module 4 checklist; start the free-tier deployment of one demo; update LinkedIn headline and about section. | Coding |
| 20 | Spaced revisit of the days in the line below (8 min) plus the questions listed below (12 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`20_Resume_Portfolio_Career.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 20_Resume_Portfolio_Career.md | Module 4 - Portfolio and GitHub: repos, README, commits, diagr | 533-815 | 283 | 1324 | 102 |
| 20_Resume_Portfolio_Career.md | Module 5 - Deployed demo guide: free tiers, honestly | 816-933 | 118 | 1160 | 0 |
| 20_Resume_Portfolio_Career.md | Module 6 - LinkedIn and application strategy | 934-1177 | 244 | 1637 | 48 |
| | **Total** | | **645** | **4121** | **150** |

- **Estimate:** 4121 prose words / 150 wpm = 27 min, plus 3 x 2 min aloud recall = 33 min of reading against a read slot of 35 min (fits). The 150 code lines are commands and examples you run in the lab slot (about 15 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Full deployment (3 to 4 hours) may spill into your own time; free-tier details change, check each provider page.

**Coding practice:** Fix the README of your best repo with the Module 4 checklist; start the free-tier deployment of one demo; update LinkedIn headline and about section.

**Interview questions to revise:** Q-CAR-08..13 (project you are proud of, failure, conflict, deadlines, learning, bug you cannot reproduce). ID scheme for this part: Q-CAR (26).

**Spaced revisits today:** Day 95: Part 20: Story, resume, bullets; Day 93: Part 19: CAP, idempotency, saga; Day 89: Part 18: Redirect, cache-aside, rate limit.

**Daily learning outcomes**

- Each pinned repo has a README with run steps and a diagram.
- I know my target role and application list size.
- One demo link works from a clean browser.

**Completion checklist**

- [ ] Read the reading-plan sections (~35 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-CAR-08..13
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 14 / Day 6 (overall Day 97) -- Part 20: Interview loop, behavioural stories and the 30-day calendar

**Tier:** OPTIONAL supplement (after the core 56 days)

**Learning objectives**

- Know the stages of the interview loop and prepare eight STAR stories.
- Create the 30-day application and mock calendar.

**Topics:** Module 7 interview loop; Module 8 behavioural stories; Module 10 30-day calendar; Q-CAR bank

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 40 | Read these sections (prose; the code in them is run in the lab slot): Module 7 (The interview loop); Module 8 (Behavioural interviews); Module 10 (30-day application and mock-interview) | Reading |
| 30 | Lab / build: Write four STAR stories from your real work (use Task API, chaos incident, capstone concurrency bug); schedule the 30-day calendar in your own tool; record yourself answering Q-CAR-01..07. | Coding |
| 30 | Spaced revisit of the days in the line below (10 min) plus the questions listed below (20 min) | Revision and questions |
| 20 | Wrap-up: write the day's key concepts from memory, answer the module's revision questions aloud, finish its practical task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (`20_Resume_Portfolio_Career.md`)**

| File | Section (`## ` heading) | Lines | Line count | Prose words | Code lines |
|------|------------------------|-------|------------|-------------|------------|
| 20_Resume_Portfolio_Career.md | Module 7 - The interview loop: online assessments, machine cod | 1178-1336 | 159 | 1683 | 0 |
| 20_Resume_Portfolio_Career.md | Module 8 - Behavioural interviews: STAR, 8 story prompts with  | 1337-1542 | 206 | 1920 | 0 |
| 20_Resume_Portfolio_Career.md | Module 10 - 30-day application and mock-interview calendar | 1687-1809 | 123 | 1099 | 0 |
| | **Total** | | **488** | **4702** | **0** |

- **Estimate:** 4702 prose words / 150 wpm = 31 min, plus 3 x 2 min aloud recall = 37 min of reading against a read slot of 40 min (fits). The 0 code lines are commands and examples you run in the lab slot (about 0 min of pure reading at 10 lines per min if you only read them).
- **Skip for now:** Module 9 (salary), Module 11 (honest expectations) and Module 12 (Q&A bank) are 1.5 to 2 h each and not scheduled as separate days; Q-CAR is covered here.

**Coding practice:** Write four STAR stories from your real work (use Task API, chaos incident, capstone concurrency bug); schedule the 30-day calendar in your own tool; record yourself answering Q-CAR-01..07.

**Interview questions to revise:** Q-CAR-14..26 spoken (record yourself). ID scheme for this part: Q-CAR (26).

**Spaced revisits today:** Day 96: Part 20: Portfolio, demo, LinkedIn; Day 94: Part 19: Capacity and SLO maths; Day 90: Part 18: Tests, Docker, load test, Q&A.

**Daily learning outcomes**

- I have 4 or more STAR stories.
- I know my 30-day calendar for the next month.
- I can answer Q-CAR-14..26 without notes.

**Completion checklist**

- [ ] Read the reading-plan sections (~40 min) and said each interview answer aloud
- [ ] Ran the lab / build steps myself and compared real output with the notes
- [ ] Questions answered aloud: Q-CAR-14..26 spoken
- [ ] Spaced revisit done
- [ ] Day wrap-up done
- [ ] Hours logged (2.0 h)

#### Supplement Week 14 / Day 7 (overall Day 98) -- Revision, assessment, catch-up

**Tier:** OPTIONAL supplement (consolidation)

**Learning objectives**

- Check honestly what you retained from: Part 19 Days 92 to 94 and Part 20 Days 95 to 97.
- Take the part assessment closed book and list the 2-3 weakest topics.
- Use the catch-up slots for the deferred or skipped material of this week.

**Topics:** Part 19 Days 92 to 94 and Part 20 Days 95 to 97

**Timed activities (total 120 min)**

| Min | Activity | Type |
|-----|----------|------|
| 25 | Spaced revisit of this week's key concepts (cover and recall; use the day-by-day table in 4.4) | Revision and questions |
| 40 | Part assessment(s) listed below, closed book, timed | Revision and questions |
| 15 | Mark with the answer key; list weak areas | Wrap-up and tests |
| 20 | Catch-up reading: the deferred modules listed in 6.3 (Part 19 Labs 3-6, B2, B6, B8; Part 20 Modules 9, 11, 12), then weak areas | Reading |
| 15 | Catch-up lab: Redo the lost-update fix in three ways, or re-record your transition story and one STAR story. | Coding |
| 5 | Log hours (target 14 h this week), plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Reading plan (Day 7: assessment sections are used as exams, not read first)**

| File | Section | Lines | Line count | Prose words | Code lines |
|------|---------|-------|------------|-------------|------------|
| 19_Concurrency_Distributed_Systems.md | Assessment (mixed difficulty) | 3371-3419 | 49 | 906 | 0 |
| 20_Resume_Portfolio_Career.md | Mixed-difficulty assessment | 2060-2105 | 46 | 625 | 0 |
| 19_Concurrency_Distributed_Systems.md | Lab 4 - A bounded task pool with graceful drain | 650-810 | 161 | 563 | 84 |

- **Assessment:** 19_Concurrency_Distributed_Systems.md lines 3371-3419; 20_Resume_Portfolio_Career.md lines 2060-2105. Target 70 percent or more. Below 70 percent: redo the weakest module of that part before moving on (counts as one missed day, see 5.4).
- **Catch-up reading section:** 19_Concurrency_Distributed_Systems.md: Lab 4 - A bounded task pool with graceful drain (lines 650-810).

**Interview questions to revise:** Your 10 weakest of Q-CONC-01..42 and Q-CAR-01..26. Answer each aloud in under 90 seconds.

**Spaced revisits today:** Day 97: Part 20: Interview loop and STAR stories; Day 95: Part 20: Story, resume, bullets; Day 91: Week 13 supplement weak areas.

**Final step of the supplement track:** open `08_Week8_Revision_Mocks_Checklist.md` lines 3700-3795 (Honest readiness assessment) and update it with what the supplement changed; write your top 5 improvement items; decide which deferred modules (6.3) to schedule next, using the decision table in 6.2.

**Daily learning outcomes**

- I know my assessment scores for this week and my weakest 2-3 topics.
- I repaired at least one weak topic by re-reading plus redoing a lab.
- Deferred items are written down with a date, not forgotten.

**Completion checklist**

- [ ] Spaced revisit done
- [ ] Assessment completed closed book
- [ ] Marked and weak areas listed
- [ ] Catch-up reading done
- [ ] Catch-up lab done
- [ ] Week 14 hours logged (target 14 h)

### 6.11 Rules for the supplement track

1. **It is optional.** A candidate who finishes the core 56 days with honest 70 percent+ scores is interview-ready at junior level; the supplement raises depth. Do not start it if the Week 8 readiness assessment shows a core area under 70 percent.
2. **Run, do not just read.** Parts 13-20 were written as labs. A command you did not run is a claim you cannot defend in an interview. When a lab will not run on Windows, use the Docker lab container the part tells you to use.
3. **Resource names are reserved per part** (Docker containers/ports): 13 uses lx-; 14 uses db-mysql on 33063; 15 uses obs- and ports 9091/3001/16687; 16 uses ch-mysql 33065 and ch-redis 63792; 17 uses cap-mysql 33066 and cap-redis 63793; 18 uses us-mysql 33067 and us-redis 63794; 19 uses cd-mysql 33068 and cd-redis 63795. Remove each part's containers, networks and volumes when you finish the part.
4. **Q-ID practice is the retention mechanism.** Each day names its question IDs by the real prefix; answer them aloud first, then read the model answer. Chaos and capstone questions are unprefixed in their files (Q1..Q25 and Q1..Q20); this schedule calls them CH-Q and CAP-Q to avoid clashing with other numbers.
5. **Reordering:** move whole part blocks (6.2), keep Day 7s at the end of each week, and keep the 1/3/7 offsets of table 4.4.
6. **Extending:** add deferred modules from the 6.3 table, one per spare day, in the order your row of 6.2 suggests. The first additions most people regret not doing: Part 13 Module 9, Part 16 Module 7, Part 18 Stage 7, Part 19 Lab 4 and B6.
7. **Honest reporting.** Each part ends with its own 'Not verified' list. If you quote output from a lab in an interview, quote the output you produced yourself, not the text in the notes.

---

End of Part 00. Remaining sections of this file: none.
