# 00 -- Master Table of Contents, Preparation Strategy and 56-Day Schedule

Node.js Backend Interview Preparation (Frontend Developer to Backend Developer, 8 weeks, ~2 hours/day, ~112 hours).

This file is Part 00 of the combined document. It contains: (1) the master table of contents, (2) the preparation strategy, (3) the complete 56-day plan with a per-week hours table, (4) the spaced-revision schedule and (5) the 'if you fall behind' triage rules. All detailed notes, question banks, exercises and the project live in the other numbered files in the same folder.

Style conventions used across all parts: ASCII only; Hinglish explanations with English technical terms; interview answers in professional English labelled `**Interview answer:**`; tier tags `[ESSENTIAL]` (asked in most interviews) and `[ADVANCED]` (supplementary); Node.js 22 LTS (20 noted where it differs), ES modules, Express 5, MySQL 8, mysql2/promise.

---

## 1. Master Table of Contents (whole combined document)

### 1.1 File map

| Part | File | Content | Status |
|------|------|---------|--------|
| 00 | 00_Master_Strategy_Schedule.md | Master TOC, strategy, 56-day plan, spaced revision, triage rules | This file |
| 01 | 01_Week1_JavaScript.md | Week 1 notes (Day 1-6), daily wrap-ups, weekly test and answers | Separate part |
| 02 | 02_Week2_Node_Internals.md | Week 2 notes (Day 1-6), daily wrap-ups, weekly test and answers | Separate part |
| 03 | 03_Week3_Express_REST.md | Week 3 notes (Day 1-6), daily wrap-ups, weekly test and answers | Separate part |
| 04 | 04_Week4_MySQL.md | Week 4 notes (Day 1-6), daily wrap-ups, weekly test and answers | Separate part |
| 05 | 05_Week5_Data_Auth_Security.md | Week 5 notes (Day 1-6), daily wrap-ups, weekly test and answers | Separate part |
| 06 | 06_Week6_Testing_Production.md | Week 6 notes (Day 1-6), daily wrap-ups, weekly test and answers | Separate part |
| 07 | 07_Week7_System_Design.md | Week 7 notes (Day 1-6), daily wrap-ups, weekly test and answers | Separate part |
| 08 | 08_Week8_Revision_Mocks_Checklist.md | Week 8 (Day 1-7), mock sets with model answers, final readiness checklist, readiness assessment | Separate part |
| 09 | 09_Question_Bank_A.md | Question bank categories 1-5 | Separate part |
| 10 | 10_Question_Bank_B.md | Question bank categories 6-10 | Separate part |
| 11 | 11_Coding_Exercises.md | All coding exercises (problems section, then solutions section) | Separate part |
| 12 | 12_Project_Task_API.md | End-to-end Task Management API project (Stage 1-7, Extensions A-D) | Separate part |

Remaining to be produced by this file's author: nothing. Every section listed in 1.2 to 1.6 exists in this file. Status of the other parts is owned by their own authors (each ends with a `## REMAINING` list if incomplete).

### 1.2 Contents of this file (Part 00)

1. Master Table of Contents
2. Preparation strategy overview (2.1 how to use this document, 2.2 ESSENTIAL vs ADVANCED triage, 2.3 honest scope note, 2.4 how to study 2 hours/day, 2.5 how to use Day 7, 2.6 week-by-week arc)
3. The complete 56-day plan (3.1 per-week hours table, 3.2 to 3.9 Week 1 to Week 8, Day 1 to Day 7 each)
4. Spaced-revision schedule (4.1 method, 4.2 topic-cluster table, 4.3 day-by-day revisit table)
5. 'If you fall behind' triage rule (5.1 decision table, 5.2 per-week skip and never-skip lists, 5.3 recovery rules)

### 1.3 Week files and their Day sections

Each week file has one `## Day X - <title>` heading per study day (Week 8 has Day 1-7). Refer to them as 'Week N / Day X notes'. Every Day block starts with `**Learning objectives**` and ends with key concepts, five revision questions, one practical coding task and a self-assessment checklist. Every week file ends with: revision summary, mixed-difficulty assessment (Basic/Intermediate/Advanced), answers with explanations, weak-area identification guidance, catch-up plan.

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

### 1.4 Question bank categories and ID prefixes

| Cat. | Category | ID prefix | File |
|------|----------|-----------|------|
| 1 | JavaScript fundamentals and asynchronous programming | Q-JS-01.. | 09_Question_Bank_A.md |
| 2 | Node.js runtime and internals | Q-NODE-01.. | 09_Question_Bank_A.md |
| 3 | Express.js and API design | Q-EXP-01.. | 09_Question_Bank_A.md |
| 4 | Databases and SQL queries | Q-SQL-01.. | 09_Question_Bank_A.md |
| 5 | MongoDB | Q-MONGO-01.. | 09_Question_Bank_A.md |
| 6 | Authentication and security | Q-SEC-01.. | 10_Question_Bank_B.md |
| 7 | Testing and debugging | Q-TEST-01.. | 10_Question_Bank_B.md |
| 8 | Performance and scalability | Q-PERF-01.. | 10_Question_Bank_B.md |
| 9 | Production scenarios | Q-PROD-01.. | 10_Question_Bank_B.md |
| 10 | Backend system design | Q-SD-01.. | 10_Question_Bank_B.md |

Note on ID ranges used in this plan: ranges such as Q-JS-01..06 are assigned by index so that each day gets a fresh slice of the bank in order. If a bank category has fewer entries than a range asks for, stop at the last entry; if it has more, the extra entries are bonus questions for Day 7 or Week 8.

### 1.5 Coding exercise groups, project and checklist

| Group | Topic | Main weeks |
|-------|-------|------------|
| EX-ASYNC | Promises and async/await | 1, 6, 8 |
| EX-LOOP | Event loop output prediction | 1, 2, 8 |
| EX-ARR | Array and object manipulation | 1 |
| EX-ERR | Asynchronous error handling | 1, 3, 6, 8 |
| EX-EXP | Express CRUD APIs | 3, 8 |
| EX-MW | Request validation and middleware | 3, 8 |
| EX-SQL | SQL joins and aggregation | 4, 5, 8 |
| EX-TXN | Transaction-safe database operations | 4, 5, 8 |
| EX-JWT | JWT authentication | 5, 8 |
| EX-TEST | API testing | 6 |
| EX-DEBUG | Debugging slow or failing APIs | 2, 4, 6, 8 |
| EX-RATE | Implementing a rate limiter | 5, 6, 7, 8 |
| EX-IDEM | Preventing duplicate transaction requests | 6, 7, 8 |

All exercises are in `11_Coding_Exercises.md` (problem statements first, solutions in a separate section so you can attempt before looking).

**Project (`12_Project_Task_API.md`)**: Stage 1 setup + Express skeleton (Week 3), Stage 2 CRUD + validation + error handling (Week 3), Stage 3 MySQL schema + data layer (Weeks 4-5), Stage 4 auth + RBAC (Week 5), Stage 5 pagination/filter/sort + transactions (Weeks 5-6), Stage 6 tests + logging + security middleware (Week 6), Stage 7 README + API docs (Weeks 6-7); Extension A Redis cache, B background jobs, C Docker, D deployment.

**Readiness material (`08_Week8_Revision_Mocks_Checklist.md`)**: Week 8 Day 1-7, mock interview sets with model answers, the final revision checklist, and the readiness assessment.

### 1.6 Weekly assessments

Each week file contains its own mixed-difficulty weekly test with answers. You take it on Day 7 of that week (see section 3).

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

### 2.4 How to study 2 hours/day

Default daily structure (study days, Day 1-6): **40 min read, 40 min code, 20 min revise, 20 min wrap-up = 120 min**. Some days shift 5-10 minutes between blocks (for example more coding on project days); each day's block in section 3 shows the exact minutes and they always sum to 120.

1. **Read (about 40 min)**: Read the assigned notes actively. Do not just scroll. After each sub-topic, close the note and say the Interview answer out loud in your own words.
2. **Code (about 40 min)**: Type the examples, do not paste. Predict output before running. Then do the assigned exercise group. On project days, work on the stated project stage.
3. **Revise (about 20 min)**: First 10 minutes: spaced revisit of earlier days (1, 3 and 7 days back; section 4). Next 10 minutes: the day's question IDs: read the question, answer aloud, then compare with the model answer.
4. **Wrap-up (about 20 min)**: Write the Key concepts from memory, answer the 5 revision questions, finish the practical coding task in the Day block, tick the checklist, and log hours plus one 'confusing thing'.

Four rules that make the 2 hours count:

- **Retrieval beats re-reading.** Hide the answer, try to produce it, then check. Struggling is the learning.
- **Speak the answers.** Interviews are spoken. Practise the Interview answer aloud at least once per topic.
- **Code from a blank file** at least once per week for the key snippets (promisify, middleware, withTransaction, JWT verify, token bucket).
- **Protect the time.** Two focused hours beat four distracted ones. Same time slot daily. Phone away.

### 2.5 How to use Day 7 (every week)

Day 7 is not a rest day and not a new-topic day. It has a fixed 120-minute shape:

| Minutes | Activity |
|---------|----------|
| 25 | Spaced revisit of Day 1-6 key concepts (cover and recall) plus the week's revision summary |
| 40 | Weekly assessment from the week file, closed book, timed |
| 15 | Mark with the answer key; identify weak areas with the week's weak-area guidance |
| 20 | Catch-up reading: unfinished days first, then weak areas |
| 15 | Catch-up coding or project work (redo the failed exercise first) |
| 5 | Log hours, plan next week |

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

---

## 3. The Complete 56-Day Plan

### 3.1 Per-week hours table

Totals are computed from the per-day minute breakdowns in sections 3.2 to 3.9. Every day is 120 minutes (2.0 hours).

| Week | Theme | Days | Reading (h) | Coding (h) | Revision and questions (h) | Wrap-up and tests (h) | Week total (h) | Cumulative (h) |
|------|-------|------|-------------|------------|-----------------------------|-----------------------|----------------|----------------|
| 1 | JavaScript for Backend | 1-7 | 4.42 | 4.33 | 3 | 2.25 | 14 | 14 |
| 2 | Node.js Internals | 8-14 | 4.58 | 4.25 | 2.83 | 2.33 | 14 | 28 |
| 3 | Express.js and REST APIs | 15-21 | 4.33 | 4.5 | 2.83 | 2.33 | 14 | 42 |
| 4 | MySQL and Database Fundamentals | 22-28 | 4.42 | 4.5 | 2.75 | 2.33 | 14 | 56 |
| 5 | Data Access, MongoDB, Authentication and Security | 29-35 | 4.25 | 4.75 | 2.67 | 2.33 | 14 | 70 |
| 6 | Testing and Production Engineering | 36-42 | 4.17 | 4.75 | 2.75 | 2.33 | 14 | 84 |
| 7 | Backend System Design and Production Scenarios | 43-49 | 4.42 | 4.5 | 2.75 | 2.33 | 14 | 98 |
| 8 | Interview Revision and Mock Preparation | 50-56 | 2.08 | 5.17 | 4.75 | 2 | 14 | 112 |
| **Total** | | 1-56 | **32.67** | **36.75** | **24.33** | **18.25** | **112** | **112** |

Total = 56 days x 2 h = 112 hours = 6720 minutes. This matches the ~112 hour budget. There is no slack in the calendar by design except Day 7 catch-up blocks (35 min of explicit catch-up in each Day 7) and the Week 8 consolidation days. If you can add a weekend hour, use it on the project or on weak areas.

**Reading-load sanity check:** about 32.67 hours of reading across 8 weeks means each study day's notes are sized for ~40 minutes of focused reading. If a Day section in a week file takes you much longer, read only the ESSENTIAL parts and mark the ADVANCED parts for later.

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
| 40 | Read notes: Week 1 / Day 1 notes (all topic sections plus Day 1 wrap-up) | Reading |
| 40 | Coding practice: Predict output of 10 hoisting/closure snippets BEFORE running them; write counter factory, once(fn) and memoize(fn); EX-LOOP-01..02 (closure-in-loop output prediction) | Coding |
| 20 | Revise questions Q-JS-01..06 (read model answer, hide it, answer aloud) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 1 / Day 1 notes (all topic sections plus Day 1 wrap-up).

**Coding practice:** Predict output of 10 hoisting/closure snippets BEFORE running them; write counter factory, once(fn) and memoize(fn); EX-LOOP-01..02 (closure-in-loop output prediction).

**Interview questions to revise:** Q-JS-01..06; plus the day's five revision questions at the end of the Day block.

**ADVANCED (skip first if behind):** Garbage-collection angle of closures (leave for Week 2 / Day 6).

**Daily learning outcomes**

- I can draw the call stack for nested calls and explain stack overflow.
- I can explain a closure in two sentences plus one backend example.
- I can predict var vs let loop output with setTimeout.

**Completion checklist**

- [ ] Read the assigned notes (Week 1 / Day 1 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 1 / Day 2 notes (this rules, prototype chain, class sections) | Reading |
| 40 | Coding practice: Re-implement bind() and a tiny class hierarchy with prototypes only; fix 5 lost-this snippets; Object.create inheritance demo | Coding |
| 20 | Spaced revisit (Day 1 key concepts, cover and recall, 10 min) plus questions Q-JS-07..12 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 1 / Day 2 notes (this rules, prototype chain, class sections).

**Coding practice:** Re-implement bind() and a tiny class hierarchy with prototypes only; fix 5 lost-this snippets; Object.create inheritance demo.

**Interview questions to revise:** Q-JS-07..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 1 (Closures, scope, hoisting).

**ADVANCED (skip first if behind):** Mixins, Object.create(null), Symbol.species.

**Daily learning outcomes**

- I can name the binding rule used by any call site.
- I can explain why a class method passed as callback loses this.
- I can explain prototype lookup in 30 seconds.

**Completion checklist**

- [ ] Read the assigned notes (Week 1 / Day 2 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 1 / Day 3 notes (references, copying, array/object manipulation patterns) | Reading |
| 40 | Coding practice: EX-ARR-01..05 (groupBy, dedupe, index by id, flatten, top-N); write a deepClone with structuredClone fallback discussion | Coding |
| 20 | Spaced revisit (Day 2 key concepts, cover and recall, 10 min) plus questions Q-JS-13..18 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 1 / Day 3 notes (references, copying, array/object manipulation patterns).

**Coding practice:** EX-ARR-01..05 (groupBy, dedupe, index by id, flatten, top-N); write a deepClone with structuredClone fallback discussion.

**Interview questions to revise:** Q-JS-13..18; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 2 (this and prototypes).

**ADVANCED (skip first if behind):** Sort comparator edge cases, WeakMap/WeakRef.

**Daily learning outcomes**

- I can explain why mutating a function argument object leaks to the caller.
- I can group an array of orders by customer using reduce and Map.
- I can choose Map vs plain object.

**Completion checklist**

- [ ] Read the assigned notes (Week 1 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-ARR-01..05
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
| 45 | Read notes: Week 1 / Day 4 notes (promise internals, chaining rules, async/await, error propagation) | Reading |
| 40 | Coding practice: EX-ASYNC-01..04 (promisify, sequential vs parallel awaits, retry wrapper) and EX-ERR-01..02 (error propagation) | Coding |
| 15 | Spaced revisit (Day 3, Day 1 key concepts, cover and recall, 8 min) plus questions Q-JS-19..26 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 1 / Day 4 notes (promise internals, chaining rules, async/await, error propagation).

**Coding practice:** EX-ASYNC-01..04 (promisify, sequential vs parallel awaits, retry wrapper) and EX-ERR-01..02 (error propagation).

**Interview questions to revise:** Q-JS-19..26; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 3 (Objects, arrays, references); Day 1 (Closures, scope, hoisting).

**ADVANCED (skip first if behind):** Thenable assimilation, custom Promise implementation.

**Daily learning outcomes**

- I can say what a then callback's return value does to the next link.
- I can rewrite a nested-callback fs example with async/await.
- I can explain why a missing await inside try/catch loses the error.

**Completion checklist**

- [ ] Read the assigned notes (Week 1 / Day 4 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-ASYNC-01..04
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
| 40 | Read notes: Week 1 / Day 5 notes (event loop model, microtask rules, output-prediction walkthroughs) | Reading |
| 45 | Coding practice: EX-LOOP-03..10 (progressively harder output prediction); write each prediction on paper first, then run and diff | Coding |
| 20 | Spaced revisit (Day 4, Day 2 key concepts, cover and recall, 10 min) plus questions Q-JS-24..30 (10 min) | Revision and questions |
| 15 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 1 / Day 5 notes (event loop model, microtask rules, output-prediction walkthroughs).

**Coding practice:** EX-LOOP-03..10 (progressively harder output prediction); write each prediction on paper first, then run and diff.

**Interview questions to revise:** Q-JS-24..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 4 (Promises and async/await); Day 2 (this and prototypes).

**ADVANCED (skip first if behind):** Browser vs Node event loop differences in detail (finished in Week 2 / Day 1).

**Daily learning outcomes**

- I can predict a 10-line mixed-async output correctly.
- I can explain microtask starvation.
- I can explain why Node is single threaded but handles many requests.

**Completion checklist**

- [ ] Read the assigned notes (Week 1 / Day 5 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-LOOP-03..10
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
| 40 | Read notes: Week 1 / Day 6 notes (combinators table, async mistakes catalogue) | Reading |
| 40 | Coding practice: EX-ASYNC-05..09 (mapLimit, timeout wrapper, allSettled reporter, fix-the-bug set) and EX-ERR-03..04 | Coding |
| 20 | Spaced revisit (Day 5, Day 3 key concepts, cover and recall, 10 min) plus questions Q-JS-26..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 1 / Day 6 notes (combinators table, async mistakes catalogue).

**Coding practice:** EX-ASYNC-05..09 (mapLimit, timeout wrapper, allSettled reporter, fix-the-bug set) and EX-ERR-03..04.

**Interview questions to revise:** Q-JS-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 5 (Event loop and microtasks); Day 3 (Objects, arrays, references).

**ADVANCED (skip first if behind):** Cancellation patterns beyond AbortController.

**Daily learning outcomes**

- I can pick a combinator for 'call 3 services, tolerate one failure'.
- I can fix forEach(async) bugs.
- I can implement concurrency limiting without a library.

**Completion checklist**

- [ ] Read the assigned notes (Week 1 / Day 6 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-ASYNC-05..09
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
| **120** | **Total** | |

**Exact sections to read:** Week 1 revision summary and weak-area sections in `01_Week1_JavaScript.md`; Week 1 / Day 1-6 notes only for the topics you got wrong.

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
| 45 | Read notes: Week 2 / Day 1 notes (runtime architecture sections) | Reading |
| 35 | Coding practice: Run small scripts printing process.versions, os.cpus(), globalThis keys; trace a fs.readFile call through the layers on paper | Coding |
| 20 | Spaced revisit (Day 7, Day 5, Day 1 key concepts, cover and recall, 10 min) plus questions Q-NODE-01..05 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 2 / Day 1 notes (runtime architecture sections).

**Coding practice:** Run small scripts printing process.versions, os.cpus(), globalThis keys; trace a fs.readFile call through the layers on paper.

**Interview questions to revise:** Q-NODE-01..05; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 7 (Week 1 weak areas); Day 5 (Event loop and microtasks); Day 1 (Closures, scope, hoisting).

**ADVANCED (skip first if behind):** V8 hidden classes, inline caching, Ignition/TurboFan names only.

**Daily learning outcomes**

- I can draw the Node architecture diagram from memory.
- I can answer 'is Node single-threaded?' accurately.
- I can list 3 differences from browser JS.

**Completion checklist**

- [ ] Read the assigned notes (Week 2 / Day 1 notes)
- [ ] Ran and modified every code example myself
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
| 45 | Read notes: Week 2 / Day 2 notes (phases, async I/O classification table, thread pool) | Reading |
| 40 | Coding practice: EX-LOOP-11..14 (phase-ordering predictions); benchmark 8 parallel pbkdf2 calls with UV_THREADPOOL_SIZE 1/4/8; block the loop with a CPU loop and measure request latency | Coding |
| 15 | Spaced revisit (Day 8, Day 6, Day 2 key concepts, cover and recall, 8 min) plus questions Q-NODE-06..12 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 2 / Day 2 notes (phases, async I/O classification table, thread pool).

**Coding practice:** EX-LOOP-11..14 (phase-ordering predictions); benchmark 8 parallel pbkdf2 calls with UV_THREADPOOL_SIZE 1/4/8; block the loop with a CPU loop and measure request latency.

**Interview questions to revise:** Q-NODE-06..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 8 (Node architecture, V8, libuv); Day 6 (Promise combinators, async mistakes); Day 2 (this and prototypes).

**ADVANCED (skip first if behind):** dns.lookup vs dns.resolve internals, io_uring note (version dependent).

**Daily learning outcomes**

- I can say which category fs, net, crypto.pbkdf2 and dns.lookup fall in.
- I can explain pool saturation symptoms.
- I can predict setImmediate vs setTimeout(0) order cases.

**Completion checklist**

- [ ] Read the assigned notes (Week 2 / Day 2 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-LOOP-11..14
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
| 45 | Read notes: Week 2 / Day 3 notes (workers, module systems, process, Buffer, env) | Reading |
| 40 | Coding practice: Offload a CPU task (fib or hashing) to a worker and compare; convert a CJS script to ESM; read config from process.env with validation; Buffer hex/base64 round trip | Coding |
| 15 | Spaced revisit (Day 9, Day 7, Day 3 key concepts, cover and recall, 8 min) plus questions Q-NODE-13..19 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 2 / Day 3 notes (workers, module systems, process, Buffer, env).

**Coding practice:** Offload a CPU task (fib or hashing) to a worker and compare; convert a CJS script to ESM; read config from process.env with validation; Buffer hex/base64 round trip.

**Interview questions to revise:** Q-NODE-13..19; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 9 (Event loop phases, thread pool); Day 7 (Week 1 weak areas); Day 3 (Objects, arrays, references).

**ADVANCED (skip first if behind):** SharedArrayBuffer/Atomics, ESM loader hooks.

**Daily learning outcomes**

- I can justify worker thread vs cluster for a CPU job.
- I can list 4 CJS vs ESM differences.
- I can explain why env vars are strings and need parsing.

**Completion checklist**

- [ ] Read the assigned notes (Week 2 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Offload a CPU task
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
| 40 | Read notes: Week 2 / Day 4 notes (fs and stream fundamentals) | Reading |
| 45 | Coding practice: Write a CSV line-counter with readline + stream; implement an uppercase Transform; serve a large file via createReadStream without loading it in memory | Coding |
| 15 | Spaced revisit (Day 10, Day 8, Day 4 key concepts, cover and recall, 8 min) plus questions Q-NODE-20..24 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 2 / Day 4 notes (fs and stream fundamentals).

**Coding practice:** Write a CSV line-counter with readline + stream; implement an uppercase Transform; serve a large file via createReadStream without loading it in memory.

**Interview questions to revise:** Q-NODE-20..24; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 10 (Workers, CJS/ESM, process, Buffer); Day 8 (Node architecture, V8, libuv); Day 4 (Promises and async/await).

**ADVANCED (skip first if behind):** Web Streams API interop (Readable.toWeb).

**Daily learning outcomes**

- I can explain streams as 'process data in chunks' with a memory example.
- I can write a Transform stream.
- I can say when to use readFile vs stream.

**Completion checklist**

- [ ] Read the assigned notes (Week 2 / Day 4 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 2 / Day 5 notes (backpressure, pipeline, EventEmitter) | Reading |
| 40 | Coding practice: Gzip a file with pipeline and a slow writable to observe backpressure; build a typed EventEmitter-based job runner; reproduce and fix a listener leak | Coding |
| 20 | Spaced revisit (Day 11, Day 9, Day 5 key concepts, cover and recall, 10 min) plus questions Q-NODE-24..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 2 / Day 5 notes (backpressure, pipeline, EventEmitter).

**Coding practice:** Gzip a file with pipeline and a slow writable to observe backpressure; build a typed EventEmitter-based job runner; reproduce and fix a listener leak.

**Interview questions to revise:** Q-NODE-24..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 11 (fs and streams); Day 9 (Event loop phases, thread pool); Day 5 (Event loop and microtasks).

**ADVANCED (skip first if behind):** Custom Writable with _write batching, events.on async iterator.

**Daily learning outcomes**

- I can explain why pipe() alone is unsafe for errors.
- I can describe the drain cycle.
- I can explain what happens with an unhandled 'error' event.

**Completion checklist**

- [ ] Read the assigned notes (Week 2 / Day 5 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 2 / Day 6 notes (memory model, leak catalogue, diagnosis) | Reading |
| 40 | Coding practice: Reproduce an unbounded-cache leak, watch RSS/heapUsed grow, fix with an LRU; take two heap snapshots in Chrome DevTools and compare (basic); EX-DEBUG-01 (leak hunt) | Coding |
| 20 | Spaced revisit (Day 12, Day 10, Day 6 key concepts, cover and recall, 10 min) plus questions Q-NODE-26..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 2 / Day 6 notes (memory model, leak catalogue, diagnosis).

**Coding practice:** Reproduce an unbounded-cache leak, watch RSS/heapUsed grow, fix with an LRU; take two heap snapshots in Chrome DevTools and compare (basic); EX-DEBUG-01 (leak hunt).

**Interview questions to revise:** Q-NODE-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 12 (Backpressure, pipeline, EventEmitter); Day 10 (Workers, CJS/ESM, process, Buffer); Day 6 (Promise combinators, async mistakes).

**ADVANCED (skip first if behind):** Mark-sweep vs scavenge details, WeakRef/FinalizationRegistry, --trace-gc reading.

**Daily learning outcomes**

- I can name 5 leak causes with a one-line fix each.
- I can explain heapUsed vs rss.
- I can describe the first three diagnosis steps for a leaking service.

**Completion checklist**

- [ ] Read the assigned notes (Week 2 / Day 6 notes)
- [ ] Ran and modified every code example myself
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
| 20 | Catch-up reading: re-read Week 2 notes for the weak areas only (unfinished days first) | Reading |
| 15 | Catch-up coding: redo the failed exercise | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 2 revision summary and weak-area sections in `02_Week2_Node_Internals.md`; Week 2 / Day 1-6 notes only for the topics you got wrong.

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
| 45 | Read notes: Week 3 / Day 1 notes (HTTP lifecycle, methods, status codes, headers, cookies) | Reading |
| 35 | Coding practice: Build a raw node:http server that returns JSON, handles 404 and a POST body; inspect with curl -v and note headers | Coding |
| 20 | Spaced revisit (Day 14, Day 12, Day 8 key concepts, cover and recall, 10 min) plus questions Q-EXP-01..06 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3 / Day 1 notes (HTTP lifecycle, methods, status codes, headers, cookies).

**Coding practice:** Build a raw node:http server that returns JSON, handles 404 and a POST body; inspect with curl -v and note headers.

**Interview questions to revise:** Q-EXP-01..06; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 14 (Week 2 weak areas); Day 12 (Backpressure, pipeline, EventEmitter); Day 8 (Node architecture, V8, libuv).

**ADVANCED (skip first if behind):** HTTP/2 multiplexing, HTTP/3, keep-alive tuning.

**Daily learning outcomes**

- I can pick between 400, 401, 403, 404, 409 and 422 correctly.
- I can explain PUT vs PATCH vs POST idempotency.
- I can explain SameSite and HttpOnly.

**Completion checklist**

- [ ] Read the assigned notes (Week 3 / Day 1 notes)
- [ ] Ran and modified every code example myself
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
| 35 | Read notes: Week 3 / Day 2 notes (REST design, Express setup, layered structure) | Reading |
| 50 | Coding practice: Project Stage 1 + start Stage 2: scaffold Task API (Express 5, ESM), health route, tasks router with in-memory CRUD controller/service; PROJECT: Stage 1 (setup + Express skeleton) and begin Stage 2 (CRUD, in-memory) | Coding |
| 15 | Spaced revisit (Day 15, Day 13, Day 9 key concepts, cover and recall, 8 min) plus questions Q-EXP-07..12 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3 / Day 2 notes (REST design, Express setup, layered structure).

**Coding practice:** Project Stage 1 + start Stage 2: scaffold Task API (Express 5, ESM), health route, tasks router with in-memory CRUD controller/service.

**Project stage today:** Stage 1 (setup + Express skeleton) and begin Stage 2 (CRUD, in-memory) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-EXP-07..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 15 (HTTP basics); Day 13 (Memory, GC, leaks); Day 9 (Event loop phases, thread pool).

**ADVANCED (skip first if behind):** HATEOAS, Richardson maturity levels beyond naming.

**Daily learning outcomes**

- I can explain what makes an API RESTful vs RPC-over-HTTP.
- I can sketch routes/controllers/services for a resource.
- I can name 2 Express 5 vs 4 differences.

**Completion checklist**

- [ ] Read the assigned notes (Week 3 / Day 2 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Project Stage 1 + start Stage 2: scaffold Task API
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
| 40 | Read notes: Week 3 / Day 3 notes (middleware model, validation, sanitization) | Reading |
| 40 | Coding practice: EX-MW-01..04 (logger, request id, validate(schema), async wrapper discussion); Stage 2: add validation to task create/update; PROJECT: Stage 2 (validation) | Coding |
| 20 | Spaced revisit (Day 16, Day 14, Day 10 key concepts, cover and recall, 10 min) plus questions Q-EXP-13..18 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3 / Day 3 notes (middleware model, validation, sanitization).

**Coding practice:** EX-MW-01..04 (logger, request id, validate(schema), async wrapper discussion); Stage 2: add validation to task create/update.

**Project stage today:** Stage 2 (validation) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-EXP-13..18; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 16 (REST design, Express layers); Day 14 (Week 2 weak areas); Day 10 (Workers, CJS/ESM, process, Buffer).

**ADVANCED (skip first if behind):** Streaming body parsers, custom body size limits per route.

**Daily learning outcomes**

- I can explain why middleware order matters with an example.
- I can write validate(schema) middleware.
- I can distinguish validation from sanitization.

**Completion checklist**

- [ ] Read the assigned notes (Week 3 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-MW-01..04
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
| 40 | Read notes: Week 3 / Day 4 notes (centralized errors, auth middleware) | Reading |
| 45 | Coding practice: EX-MW-05..07 and EX-EXP-01..02 (error handler, auth middleware, 404 handler); Stage 2: wire AppError and the global handler into the Task API; PROJECT: Stage 2 (error handling) and Stage 4 preview (auth stub) | Coding |
| 15 | Spaced revisit (Day 17, Day 15, Day 11 key concepts, cover and recall, 8 min) plus questions Q-EXP-19..24 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3 / Day 4 notes (centralized errors, auth middleware).

**Coding practice:** EX-MW-05..07 and EX-EXP-01..02 (error handler, auth middleware, 404 handler); Stage 2: wire AppError and the global handler into the Task API.

**Project stage today:** Stage 2 (error handling) and Stage 4 preview (auth stub) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-EXP-19..24; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 17 (Middleware and validation); Day 15 (HTTP basics); Day 11 (fs and streams).

**ADVANCED (skip first if behind):** Problem Details (RFC 9457) format.

**Daily learning outcomes**

- I can explain why one central error handler beats try/catch in every route.
- I can return a consistent error JSON.
- I can explain 401 vs 403 in middleware.

**Completion checklist**

- [ ] Read the assigned notes (Week 3 / Day 4 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-MW-05..07 and EX-EXP-01..02
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
| 40 | Read notes: Week 3 / Day 5 notes (pagination, filtering, sorting, versioning) | Reading |
| 40 | Coding practice: EX-EXP-03..06 (paginated list endpoint with filter + sort over in-memory data); Stage 2/5 prep: GET /tasks with page, limit, status, sort; PROJECT: Stage 2 finish, Stage 5 preview (list query shape) | Coding |
| 20 | Spaced revisit (Day 18, Day 16, Day 12 key concepts, cover and recall, 10 min) plus questions Q-EXP-25..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3 / Day 5 notes (pagination, filtering, sorting, versioning).

**Coding practice:** EX-EXP-03..06 (paginated list endpoint with filter + sort over in-memory data); Stage 2/5 prep: GET /tasks with page, limit, status, sort.

**Project stage today:** Stage 2 finish, Stage 5 preview (list query shape) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-EXP-25..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 18 (Error handler, auth middleware); Day 16 (REST design, Express layers); Day 12 (Backpressure, pipeline, EventEmitter).

**ADVANCED (skip first if behind):** Link headers, ETags for list endpoints.

**Daily learning outcomes**

- I can explain why offset pagination gets slow and inconsistent.
- I can whitelist sort columns.
- I can design GET /tasks?status=open&sort=-createdAt&limit=20.

**Completion checklist**

- [ ] Read the assigned notes (Week 3 / Day 5 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-EXP-03..06
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
| 40 | Read notes: Week 3 / Day 6 notes (uploads, OpenAPI, CORS, debugging) | Reading |
| 45 | Coding practice: Add an attachment upload endpoint with limits; write openapi.yaml for 3 endpoints and serve Swagger UI; EX-EXP-07..08 (CORS + upload fix-the-bug); PROJECT: Stage 2 finish, Stage 7 start (API docs skeleton) | Coding |
| 15 | Spaced revisit (Day 19, Day 17, Day 13 key concepts, cover and recall, 8 min) plus questions Q-EXP-26..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3 / Day 6 notes (uploads, OpenAPI, CORS, debugging).

**Coding practice:** Add an attachment upload endpoint with limits; write openapi.yaml for 3 endpoints and serve Swagger UI; EX-EXP-07..08 (CORS + upload fix-the-bug).

**Project stage today:** Stage 2 finish, Stage 7 start (API docs skeleton) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-EXP-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 19 (Pagination, filter, sort, versioning); Day 17 (Middleware and validation); Day 13 (Memory, GC, leaks).

**ADVANCED (skip first if behind):** Pre-signed URL uploads (covered in Week 7 / Day 3).

**Daily learning outcomes**

- I can explain why CORS is enforced by the browser, not the server.
- I can list safe upload limits.
- I can describe a preflight request.

**Completion checklist**

- [ ] Read the assigned notes (Week 3 / Day 6 notes)
- [ ] Ran and modified every code example myself
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
| 20 | Catch-up reading: re-read Week 3 notes for the weak areas only (unfinished days first) | Reading |
| 15 | Catch-up coding: redo the failed exercise or advance the project (Stage 1 and Stage 2 complete (in-memory CRUD, validation, central error handler, auth stub)) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3 revision summary and weak-area sections in `03_Week3_Express_REST.md`; Week 3 / Day 1-6 notes only for the topics you got wrong.

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
| 40 | Read notes: Week 4 / Day 1 notes (relational model, constraints, CRUD) | Reading |
| 45 | Coding practice: Create the Task API schema (users, tasks, projects, task_assignees) in MySQL 8; EX-SQL-01..03 (CRUD + constraint exercises); PROJECT: Stage 3 (schema design) | Coding |
| 15 | Spaced revisit (Day 21, Day 19, Day 15 key concepts, cover and recall, 8 min) plus questions Q-SQL-01..06 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 4 / Day 1 notes (relational model, constraints, CRUD).

**Coding practice:** Create the Task API schema (users, tasks, projects, task_assignees) in MySQL 8; EX-SQL-01..03 (CRUD + constraint exercises).

**Project stage today:** Stage 3 (schema design) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SQL-01..06; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 21 (Week 3 weak areas); Day 19 (Pagination, filter, sort, versioning); Day 15 (HTTP basics).

**ADVANCED (skip first if behind):** Generated columns, JSON column querying.

**Daily learning outcomes**

- I can explain why money uses DECIMAL not FLOAT.
- I can design a many-to-many table.
- I can explain ON DELETE CASCADE vs RESTRICT.

**Completion checklist**

- [ ] Read the assigned notes (Week 4 / Day 1 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Create the Task API schema
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
| 35 | Read notes: Week 4 / Day 2 notes (joins, aggregation, subqueries) | Reading |
| 50 | Coding practice: EX-SQL-04..10 (joins and aggregation set); implement 'tasks per user with zero-task users included' for the Task API; PROJECT: Stage 3 (reporting queries) | Coding |
| 15 | Spaced revisit (Day 22, Day 20, Day 16 key concepts, cover and recall, 8 min) plus questions Q-SQL-07..13 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 4 / Day 2 notes (joins, aggregation, subqueries).

**Coding practice:** EX-SQL-04..10 (joins and aggregation set); implement 'tasks per user with zero-task users included' for the Task API.

**Project stage today:** Stage 3 (reporting queries) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SQL-07..13; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 22 (Relational basics, CRUD); Day 20 (Uploads, OpenAPI, CORS); Day 16 (REST design, Express layers).

**ADVANCED (skip first if behind):** Window functions (ROW_NUMBER, RANK) as ADVANCED stretch.

**Daily learning outcomes**

- I can explain LEFT JOIN plus WHERE filter pitfall.
- I can write Nth-highest and find-duplicates queries.
- I can explain WHERE vs HAVING.

**Completion checklist**

- [ ] Read the assigned notes (Week 4 / Day 2 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-SQL-04..10
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
| 45 | Read notes: Week 4 / Day 3 notes (normalization, indexing) | Reading |
| 35 | Coding practice: EX-SQL-11..14 (index design); add indexes to the Task API schema and justify each in a comment; PROJECT: Stage 3 (indexes) | Coding |
| 20 | Spaced revisit (Day 23, Day 21, Day 17 key concepts, cover and recall, 10 min) plus questions Q-SQL-14..20 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 4 / Day 3 notes (normalization, indexing).

**Coding practice:** EX-SQL-11..14 (index design); add indexes to the Task API schema and justify each in a comment.

**Project stage today:** Stage 3 (indexes) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SQL-14..20; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 23 (Joins, GROUP BY, subqueries); Day 21 (Week 3 weak areas); Day 17 (Middleware and validation).

**ADVANCED (skip first if behind):** Covering indexes, prefix indexes, invisible indexes.

**Daily learning outcomes**

- I can explain why (a,b) index helps WHERE a and WHERE a AND b but not WHERE b.
- I can explain why random UUID PKs hurt InnoDB inserts.
- I can justify one denormalization.

**Completion checklist**

- [ ] Read the assigned notes (Week 4 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-SQL-11..14
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
| 45 | Read notes: Week 4 / Day 4 notes (transactions, ACID, isolation, anomalies) | Reading |
| 40 | Coding practice: Run two mysql sessions to reproduce non-repeatable read and a lost update; EX-TXN-01..03 (transfer with FOR UPDATE, optimistic version check); PROJECT: Stage 3/5 (design the transactional operations) | Coding |
| 15 | Spaced revisit (Day 24, Day 22, Day 18 key concepts, cover and recall, 8 min) plus questions Q-SQL-21..28 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 4 / Day 4 notes (transactions, ACID, isolation, anomalies).

**Coding practice:** Run two mysql sessions to reproduce non-repeatable read and a lost update; EX-TXN-01..03 (transfer with FOR UPDATE, optimistic version check).

**Project stage today:** Stage 3/5 (design the transactional operations) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SQL-21..28; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 24 (Normalization, indexes); Day 22 (Relational basics, CRUD); Day 18 (Error handler, auth middleware).

**ADVANCED (skip first if behind):** MVCC and undo-log internals, serializable via gap locks.

**Daily learning outcomes**

- I can explain the transfer example with rollback.
- I can build the anomalies vs isolation level table from memory.
- I can explain optimistic vs pessimistic locking.

**Completion checklist**

- [ ] Read the assigned notes (Week 4 / Day 4 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 4 / Day 5 notes (locking, deadlocks, pooling) | Reading |
| 40 | Coding practice: Reproduce a two-transaction deadlock; write retry-on-deadlock helper pseudo-code; EX-TXN-04..05; EX-DEBUG-02 (pool exhaustion diagnosis); PROJECT: Stage 3 (pool configuration notes) | Coding |
| 20 | Spaced revisit (Day 25, Day 23, Day 19 key concepts, cover and recall, 10 min) plus questions Q-SQL-28..34 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 4 / Day 5 notes (locking, deadlocks, pooling).

**Coding practice:** Reproduce a two-transaction deadlock; write retry-on-deadlock helper pseudo-code; EX-TXN-04..05; EX-DEBUG-02 (pool exhaustion diagnosis).

**Project stage today:** Stage 3 (pool configuration notes) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SQL-28..34; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 25 (Transactions, ACID, isolation); Day 23 (Joins, GROUP BY, subqueries); Day 19 (Pagination, filter, sort, versioning).

**ADVANCED (skip first if behind):** Gap/next-key locks, lock wait timeouts tuning.

**Daily learning outcomes**

- I can describe a deadlock with two accounts and the fix.
- I can explain why 1000 connections per instance is a bad idea.
- I can explain pool exhaustion from a leaked connection.

**Completion checklist**

- [ ] Read the assigned notes (Week 4 / Day 5 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 4 / Day 6 notes (EXPLAIN, optimization checklist, pagination performance) | Reading |
| 45 | Coding practice: EX-SQL-15..18 (read EXPLAIN, rewrite slow query, keyset pagination); run EXPLAIN on Task API list query before and after an index; PROJECT: Stage 3 finish, Stage 5 preview (keyset list query) | Coding |
| 15 | Spaced revisit (Day 26, Day 24, Day 20 key concepts, cover and recall, 8 min) plus questions Q-SQL-26..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 4 / Day 6 notes (EXPLAIN, optimization checklist, pagination performance).

**Coding practice:** EX-SQL-15..18 (read EXPLAIN, rewrite slow query, keyset pagination); run EXPLAIN on Task API list query before and after an index.

**Project stage today:** Stage 3 finish, Stage 5 preview (keyset list query) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SQL-26..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 26 (Deadlocks, locks, pooling); Day 24 (Normalization, indexes); Day 20 (Uploads, OpenAPI, CORS).

**ADVANCED (skip first if behind):** Optimizer hints, histogram statistics, partitioning.

**Daily learning outcomes**

- I can read type=ALL vs ref vs range.
- I can rewrite a non-sargable predicate.
- I can implement keyset pagination SQL.

**Completion checklist**

- [ ] Read the assigned notes (Week 4 / Day 6 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-SQL-15..18
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
| **120** | **Total** | |

**Exact sections to read:** Week 4 revision summary and weak-area sections in `04_Week4_MySQL.md`; Week 4 / Day 1-6 notes only for the topics you got wrong.

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
| 35 | Read notes: Week 5 / Day 1 notes (mysql2, pool, transactions, ORM trade-offs) | Reading |
| 50 | Coding practice: EX-TXN-06..08 (withTransaction helper, transfer in code, rollback on failure); Stage 3: implement task repository with mysql2; PROJECT: Stage 3 (data layer with MySQL) | Coding |
| 15 | Spaced revisit (Day 28, Day 26, Day 22 key concepts, cover and recall, 8 min) plus questions Q-SQL-31..34 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 5 / Day 1 notes (mysql2, pool, transactions, ORM trade-offs).

**Coding practice:** EX-TXN-06..08 (withTransaction helper, transfer in code, rollback on failure); Stage 3: implement task repository with mysql2.

**Project stage today:** Stage 3 (data layer with MySQL) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SQL-31..34; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 28 (Week 4 weak areas); Day 26 (Deadlocks, locks, pooling); Day 22 (Relational basics, CRUD).

**ADVANCED (skip first if behind):** Prepared statement caching, streaming large result sets.

**Daily learning outcomes**

- I can write withTransaction(fn) from memory.
- I can explain why placeholders are safe.
- I can give 3 pros and 3 cons of an ORM.

**Completion checklist**

- [ ] Read the assigned notes (Week 5 / Day 1 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-TXN-06..08
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
| 45 | Read notes: Week 5 / Day 2 notes (MongoDB fundamentals, aggregation, SQL vs NoSQL) | Reading |
| 40 | Coding practice: Insert/query a small orders collection; aggregate revenue per customer; add an index and compare explain; no project stage today (MySQL stays primary) | Coding |
| 15 | Spaced revisit (Day 29, Day 27, Day 23 key concepts, cover and recall, 8 min) plus questions Q-MONGO-01..10 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 5 / Day 2 notes (MongoDB fundamentals, aggregation, SQL vs NoSQL).

**Coding practice:** Insert/query a small orders collection; aggregate revenue per customer; add an index and compare explain; no project stage today (MySQL stays primary).

**Interview questions to revise:** Q-MONGO-01..10; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 29 (mysql2, pool, txn in code, ORM); Day 27 (EXPLAIN, optimization, pagination); Day 23 (Joins, GROUP BY, subqueries).

**ADVANCED (skip first if behind):** Sharding, change streams, schema validation details.

**Daily learning outcomes**

- I can explain embed vs reference with an e-commerce example.
- I can write a $group pipeline.
- I can state when I would NOT choose MongoDB.

**Completion checklist**

- [ ] Read the assigned notes (Week 5 / Day 2 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 5 / Day 3 notes (bcrypt, signup/login, JWT) | Reading |
| 45 | Coding practice: EX-JWT-01..04 (signup, login, sign/verify, auth middleware); Stage 4: users table, POST /auth/signup and /auth/login; PROJECT: Stage 4 (auth: signup/login) | Coding |
| 15 | Spaced revisit (Day 30, Day 28, Day 24 key concepts, cover and recall, 8 min) plus questions Q-SEC-01..06 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 5 / Day 3 notes (bcrypt, signup/login, JWT).

**Coding practice:** EX-JWT-01..04 (signup, login, sign/verify, auth middleware); Stage 4: users table, POST /auth/signup and /auth/login.

**Project stage today:** Stage 4 (auth: signup/login) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SEC-01..06; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 30 (MongoDB, SQL vs NoSQL); Day 28 (Week 4 weak areas); Day 24 (Normalization, indexes).

**ADVANCED (skip first if behind):** Argon2 vs bcrypt, JWKS key rotation.

**Daily learning outcomes**

- I can explain what bcrypt's cost factor controls.
- I can decode a JWT by hand and say what is not secret.
- I can explain why login errors must be generic.

**Completion checklist**

- [ ] Read the assigned notes (Week 5 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-JWT-01..04
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
| 40 | Read notes: Week 5 / Day 4 notes (token strategy, sessions vs JWT, RBAC) | Reading |
| 45 | Coding practice: EX-JWT-05..08 (refresh flow, role middleware, ownership check); Stage 4: refresh endpoint, requireRole('admin'), task ownership; PROJECT: Stage 4 (RBAC and refresh tokens) | Coding |
| 15 | Spaced revisit (Day 31, Day 29, Day 25 key concepts, cover and recall, 8 min) plus questions Q-SEC-07..14 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 5 / Day 4 notes (token strategy, sessions vs JWT, RBAC).

**Coding practice:** EX-JWT-05..08 (refresh flow, role middleware, ownership check); Stage 4: refresh endpoint, requireRole('admin'), task ownership.

**Project stage today:** Stage 4 (RBAC and refresh tokens) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SEC-07..14; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 31 (Signup/login, bcrypt, JWT); Day 29 (mysql2, pool, txn in code, ORM); Day 25 (Transactions, ACID, isolation).

**ADVANCED (skip first if behind):** OAuth 2.0 / OIDC overview, PKCE, ABAC.

**Daily learning outcomes**

- I can explain how to log a user out with JWTs.
- I can explain IDOR with an example.
- I can place the authz check in the right layer.

**Completion checklist**

- [ ] Read the assigned notes (Week 5 / Day 4 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-JWT-05..08
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
| 40 | Read notes: Week 5 / Day 5 notes (injection, XSS, CSRF, CORS, rate limiting) | Reading |
| 40 | Coding practice: EX-SQL-19 (injection fix), EX-RATE-01..02 (in-memory fixed-window limiter); Stage 6 preview: add helmet, cors allowlist and express-rate-limit on /auth; PROJECT: Stage 6 (security middleware) | Coding |
| 20 | Spaced revisit (Day 32, Day 30, Day 26 key concepts, cover and recall, 10 min) plus questions Q-SEC-15..22 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 5 / Day 5 notes (injection, XSS, CSRF, CORS, rate limiting).

**Coding practice:** EX-SQL-19 (injection fix), EX-RATE-01..02 (in-memory fixed-window limiter); Stage 6 preview: add helmet, cors allowlist and express-rate-limit on /auth.

**Project stage today:** Stage 6 (security middleware) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SEC-15..22; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 32 (Refresh tokens, sessions, RBAC); Day 30 (MongoDB, SQL vs NoSQL); Day 26 (Deadlocks, locks, pooling).

**ADVANCED (skip first if behind):** SSRF, mass assignment, prototype pollution (name them, know one fix).

**Daily learning outcomes**

- I can explain an injection payload and why placeholders defeat it.
- I can explain CSRF vs XSS in one line each.
- I can configure CORS safely.

**Completion checklist**

- [ ] Read the assigned notes (Week 5 / Day 5 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-SQL-19
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
| 35 | Read notes: Week 5 / Day 6 notes (secure configuration, mistakes catalogue) | Reading |
| 50 | Coding practice: Add zod-validated config loader to the Task API; audit the project against the checklist; Stage 5: start pagination/filter/sort on MySQL using whitelisted sort fields; review the vulnerable snippet in the Day 6 notes and fix it; PROJECT: Stage 5 (pagination/filter/sort on MySQL), Stage 6 (config hardening) | Coding |
| 15 | Spaced revisit (Day 33, Day 31, Day 27 key concepts, cover and recall, 8 min) plus questions Q-SEC-23..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 5 / Day 6 notes (secure configuration, mistakes catalogue).

**Coding practice:** Add zod-validated config loader to the Task API; audit the project against the checklist; Stage 5: start pagination/filter/sort on MySQL using whitelisted sort fields; review the vulnerable snippet in the Day 6 notes and fix it.

**Project stage today:** Stage 5 (pagination/filter/sort on MySQL), Stage 6 (config hardening) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SEC-23..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 33 (SQLi, XSS, CSRF, CORS, rate limit); Day 31 (Signup/login, bcrypt, JWT); Day 27 (EXPLAIN, optimization, pagination).

**ADVANCED (skip first if behind):** KMS envelope encryption, dependency supply-chain attacks.

**Daily learning outcomes**

- I can list 8 production security mistakes.
- I can explain why .env must not be committed.
- I can explain least privilege for the DB user.

**Completion checklist**

- [ ] Read the assigned notes (Week 5 / Day 6 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Add zod-validated config loader to the Task API
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
| **120** | **Total** | |

**Exact sections to read:** Week 5 revision summary and weak-area sections in `05_Week5_Data_Auth_Security.md`; Week 5 / Day 1-6 notes only for the topics you got wrong.

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
| 35 | Read notes: Week 6 / Day 1 notes (testing strategy, Jest/Vitest, Supertest, mocking) | Reading |
| 50 | Coding practice: EX-TEST-01..04 (service unit tests with mocked repo, Supertest for CRUD + auth failures); Stage 6: test suite for tasks and auth; PROJECT: Stage 6 (unit and integration tests) | Coding |
| 15 | Spaced revisit (Day 35, Day 33, Day 29 key concepts, cover and recall, 8 min) plus questions Q-TEST-01..08 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 / Day 1 notes (testing strategy, Jest/Vitest, Supertest, mocking).

**Coding practice:** EX-TEST-01..04 (service unit tests with mocked repo, Supertest for CRUD + auth failures); Stage 6: test suite for tasks and auth.

**Project stage today:** Stage 6 (unit and integration tests) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-TEST-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 35 (Week 5 weak areas); Day 33 (SQLi, XSS, CSRF, CORS, rate limit); Day 29 (mysql2, pool, txn in code, ORM).

**ADVANCED (skip first if behind):** Contract testing, mutation testing.

**Daily learning outcomes**

- I can say what I would not mock.
- I can write a Supertest case with a bearer token.
- I can list five negative cases for POST /tasks.

**Completion checklist**

- [ ] Read the assigned notes (Week 6 / Day 1 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-TEST-01..04
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
| 35 | Read notes: Week 6 / Day 2 notes (logging, structured errors, correlation IDs) | Reading |
| 45 | Coding practice: Add pino plus request-id middleware to Task API, include id in error responses; test that the id appears in logs; EX-DEBUG-03 (trace a failed request through logs); PROJECT: Stage 6 (logging) | Coding |
| 20 | Spaced revisit (Day 36, Day 34, Day 30 key concepts, cover and recall, 10 min) plus questions Q-TEST-09..14 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 / Day 2 notes (logging, structured errors, correlation IDs).

**Coding practice:** Add pino plus request-id middleware to Task API, include id in error responses; test that the id appears in logs; EX-DEBUG-03 (trace a failed request through logs).

**Project stage today:** Stage 6 (logging) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-TEST-09..14; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 36 (Testing, Supertest, mocking); Day 34 (Secrets, secure config, mistakes); Day 30 (MongoDB, SQL vs NoSQL).

**ADVANCED (skip first if behind):** OpenTelemetry tracing (names and purpose only).

**Daily learning outcomes**

- I can explain why correlation IDs matter across services.
- I can configure log redaction.
- I can explain AsyncLocalStorage in one paragraph.

**Completion checklist**

- [ ] Read the assigned notes (Week 6 / Day 2 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Add pino plus request-id middleware to Task API, include id in error responses
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
| 40 | Read notes: Week 6 / Day 3 notes (timeouts, retries, idempotency) | Reading |
| 45 | Coding practice: EX-IDEM-01..04 (idempotent create/payment endpoint, retry with backoff, duplicate request guard); Stage 5: idempotent POST for a task-creating or payment-like endpoint; PROJECT: Stage 5 (transactions and idempotency) | Coding |
| 15 | Spaced revisit (Day 37, Day 35, Day 31 key concepts, cover and recall, 8 min) plus questions Q-PROD-01..08 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 / Day 3 notes (timeouts, retries, idempotency).

**Coding practice:** EX-IDEM-01..04 (idempotent create/payment endpoint, retry with backoff, duplicate request guard); Stage 5: idempotent POST for a task-creating or payment-like endpoint.

**Project stage today:** Stage 5 (transactions and idempotency) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-PROD-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 37 (Logging, correlation IDs); Day 35 (Week 5 weak areas); Day 31 (Signup/login, bcrypt, JWT).

**ADVANCED (skip first if behind):** Circuit breaker pattern, retry budgets.

**Daily learning outcomes**

- I can explain exponential backoff with jitter.
- I can describe the idempotency-key flow including in-flight duplicates.
- I can say which errors are safe to retry.

**Completion checklist**

- [ ] Read the assigned notes (Week 6 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-IDEM-01..04
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
| 40 | Read notes: Week 6 / Day 4 notes (Redis, caching patterns, invalidation) | Reading |
| 45 | Coding practice: Add cache-aside to GET /tasks/:id with TTL and invalidate on update; EX-RATE-03 (Redis-backed counter); Extension A (Redis cache) start; PROJECT: Extension A (Redis cache) | Coding |
| 15 | Spaced revisit (Day 38, Day 36, Day 32 key concepts, cover and recall, 8 min) plus questions Q-PERF-01..08 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 / Day 4 notes (Redis, caching patterns, invalidation).

**Coding practice:** Add cache-aside to GET /tasks/:id with TTL and invalidate on update; EX-RATE-03 (Redis-backed counter); Extension A (Redis cache) start.

**Project stage today:** Extension A (Redis cache) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-PERF-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 38 (Retries, backoff, idempotency); Day 36 (Testing, Supertest, mocking); Day 32 (Refresh tokens, sessions, RBAC).

**ADVANCED (skip first if behind):** Redis persistence (RDB/AOF), clustering, Redlock debates.

**Daily learning outcomes**

- I can explain cache-aside step by step.
- I can name 3 cache problems and a fix each.
- I can explain why caching is not free.

**Completion checklist**

- [ ] Read the assigned notes (Week 6 / Day 4 notes)
- [ ] Ran and modified every code example myself
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
| 40 | Read notes: Week 6 / Day 5 notes (queues, workers, graceful shutdown) | Reading |
| 45 | Coding practice: EX-ERR-05 (graceful shutdown), write a small job producer/worker; add SIGTERM handler to Task API; Extension B (background job: email-style notification); PROJECT: Extension B (background jobs) | Coding |
| 15 | Spaced revisit (Day 39, Day 37, Day 33 key concepts, cover and recall, 8 min) plus questions Q-PROD-09..16 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 / Day 5 notes (queues, workers, graceful shutdown).

**Coding practice:** EX-ERR-05 (graceful shutdown), write a small job producer/worker; add SIGTERM handler to Task API; Extension B (background job: email-style notification).

**Project stage today:** Extension B (background jobs) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-PROD-09..16; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 39 (Redis, caching, invalidation); Day 37 (Logging, correlation IDs); Day 33 (SQLi, XSS, CSRF, CORS, rate limit).

**ADVANCED (skip first if behind):** Job priorities, repeatable jobs, flow producers.

**Daily learning outcomes**

- I can list the steps of graceful shutdown.
- I can explain at-least-once and idempotent consumers.
- I can explain what a DLQ is for.

**Completion checklist**

- [ ] Read the assigned notes (Week 6 / Day 5 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-ERR-05
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
| 40 | Read notes: Week 6 / Day 6 notes (slow API diagnosis, memory leak diagnosis, load testing) | Reading |
| 40 | Coding practice: EX-DEBUG-04..06 (diagnose slow endpoint), autocannon run on GET /tasks before/after an index; finalize Stage 6 tests and logging; PROJECT: Stage 6 finish, Stage 7 (README) draft | Coding |
| 20 | Spaced revisit (Day 40, Day 38, Day 34 key concepts, cover and recall, 10 min) plus questions Q-PERF-09..16 and Q-TEST-15..20 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 / Day 6 notes (slow API diagnosis, memory leak diagnosis, load testing).

**Coding practice:** EX-DEBUG-04..06 (diagnose slow endpoint), autocannon run on GET /tasks before/after an index; finalize Stage 6 tests and logging.

**Project stage today:** Stage 6 finish, Stage 7 (README) draft (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-PERF-09..16 and Q-TEST-15..20; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 40 (Queues, jobs, graceful shutdown); Day 38 (Retries, backoff, idempotency); Day 34 (Secrets, secure config, mistakes).

**ADVANCED (skip first if behind):** Flame graphs, CPU profiling with --cpu-prof.

**Daily learning outcomes**

- I can narrate a 5-step slow-API investigation.
- I can read p95 vs average.
- I can explain why load tests need realistic data.

**Completion checklist**

- [ ] Read the assigned notes (Week 6 / Day 6 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-DEBUG-04..06
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
| 20 | Catch-up reading: re-read Week 6 notes for the weak areas only (unfinished days first) | Reading |
| 15 | Catch-up coding: redo the failed exercise or advance the project (Stage 5 and Stage 6 complete (tests, logging, security middleware); Extension A and B attempted) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 revision summary and weak-area sections in `06_Week6_Testing_Production.md`; Week 6 / Day 1-6 notes only for the topics you got wrong.

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
| 50 | Read notes: Week 7 / Day 1 notes (architecture styles, scaling, caching and DB scaling) | Reading |
| 30 | Coding practice: Draw (on paper) the evolution of the Task API from 1 server to load-balanced with Redis and a read replica; write one-paragraph justification for each step | Coding |
| 20 | Spaced revisit (Day 42, Day 40, Day 36 key concepts, cover and recall, 10 min) plus questions Q-SD-01..06 and Q-PERF-17..22 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 / Day 1 notes (architecture styles, scaling, caching and DB scaling).

**Coding practice:** Draw (on paper) the evolution of the Task API from 1 server to load-balanced with Redis and a read replica; write one-paragraph justification for each step.

**Interview questions to revise:** Q-SD-01..06 and Q-PERF-17..22; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 42 (Week 6 weak areas); Day 40 (Queues, jobs, graceful shutdown); Day 36 (Testing, Supertest, mocking).

**ADVANCED (skip first if behind):** CAP/PACELC, consistent hashing (names only).

**Daily learning outcomes**

- I can explain 'start simple, add complexity when justified'.
- I can explain why statelessness enables horizontal scaling.
- I can list the DB scaling ladder in order.

**Completion checklist**

- [ ] Read the assigned notes (Week 7 / Day 1 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Draw
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
| 40 | Read notes: Week 7 / Day 2 notes (rate limiter design, notification system design) | Reading |
| 45 | Coding practice: EX-RATE-04..06 (token bucket and sliding window implementation); sketch the notification design from a blank page in 25 min | Coding |
| 15 | Spaced revisit (Day 43, Day 41, Day 37 key concepts, cover and recall, 8 min) plus questions Q-SD-07..12 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 / Day 2 notes (rate limiter design, notification system design).

**Coding practice:** EX-RATE-04..06 (token bucket and sliding window implementation); sketch the notification design from a blank page in 25 min.

**Interview questions to revise:** Q-SD-07..12; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 43 (Architecture and scaling basics); Day 41 (Slow API debugging, load testing); Day 37 (Logging, correlation IDs).

**ADVANCED (skip first if behind):** Adaptive rate limiting, global distributed limits.

**Daily learning outcomes**

- I can compare 3 rate limit algorithms.
- I can explain how multiple servers share limits.
- I can design notifications with retry and dedupe.

**Completion checklist**

- [ ] Read the assigned notes (Week 7 / Day 2 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-RATE-04..06
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
| 40 | Read notes: Week 7 / Day 3 notes (URL shortener, file upload architecture) | Reading |
| 45 | Coding practice: Implement a minimal in-memory shortener (encode/decode base62, collision-safe); sketch upload flow with sequence diagram in text | Coding |
| 15 | Spaced revisit (Day 44, Day 42, Day 38 key concepts, cover and recall, 8 min) plus questions Q-SD-13..18 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 / Day 3 notes (URL shortener, file upload architecture).

**Coding practice:** Implement a minimal in-memory shortener (encode/decode base62, collision-safe); sketch upload flow with sequence diagram in text.

**Interview questions to revise:** Q-SD-13..18; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 44 (Rate limiter, notification design); Day 42 (Week 6 weak areas); Day 38 (Retries, backoff, idempotency).

**ADVANCED (skip first if behind):** Custom aliases, expiry cleanup jobs, geo-distributed redirects.

**Daily learning outcomes**

- I can justify base62 counter vs hash.
- I can explain why uploads should not stream through the API server.
- I can explain 301 vs 302 impact.

**Completion checklist**

- [ ] Read the assigned notes (Week 7 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Implement a minimal in-memory shortener
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
| 45 | Read notes: Week 7 / Day 4 notes (payment workflows, failure recovery) | Reading |
| 40 | Coding practice: EX-IDEM-05..07 (idempotent payment with state transitions); extend your transfer code with a ledger table and unique idempotency key | Coding |
| 15 | Spaced revisit (Day 45, Day 43, Day 39 key concepts, cover and recall, 8 min) plus questions Q-SD-19..24 and Q-PROD-17..20 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 / Day 4 notes (payment workflows, failure recovery).

**Coding practice:** EX-IDEM-05..07 (idempotent payment with state transitions); extend your transfer code with a ledger table and unique idempotency key.

**Interview questions to revise:** Q-SD-19..24 and Q-PROD-17..20; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 45 (URL shortener, upload architecture); Day 43 (Architecture and scaling basics); Day 39 (Redis, caching, invalidation).

**ADVANCED (skip first if behind):** Outbox pattern, exactly-once myths, PCI scope.

**Daily learning outcomes**

- I can narrate a payment from request to webhook confirmation.
- I can explain what to do when a payment call times out.
- I can explain why money uses integers/DECIMAL.

**Completion checklist**

- [ ] Read the assigned notes (Week 7 / Day 4 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-IDEM-05..07
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
| 40 | Read notes: Week 7 / Day 5 notes (queues and async processing, observability) | Reading |
| 40 | Coding practice: Add a /metrics endpoint (prom-client) to Task API with request count and latency histogram; Stage 7: update README with architecture and observability sections; PROJECT: Stage 7 (README, API docs finish) | Coding |
| 20 | Spaced revisit (Day 46, Day 44, Day 40 key concepts, cover and recall, 10 min) plus questions Q-SD-25..30 (10 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 / Day 5 notes (queues and async processing, observability).

**Coding practice:** Add a /metrics endpoint (prom-client) to Task API with request count and latency histogram; Stage 7: update README with architecture and observability sections.

**Project stage today:** Stage 7 (README, API docs finish) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SD-25..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 46 (Payments, idempotency, recovery); Day 44 (Rate limiter, notification design); Day 40 (Queues, jobs, graceful shutdown).

**ADVANCED (skip first if behind):** Kafka partitions and consumer groups depth, distributed tracing.

**Daily learning outcomes**

- I can explain at-least-once vs at-most-once vs exactly-once honestly.
- I can name the 4 golden signals.
- I can explain how to scale consumers.

**Completion checklist**

- [ ] Read the assigned notes (Week 7 / Day 5 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: Add a /metrics endpoint
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
| 30 | Read notes: Week 7 / Day 6 notes (Docker, deployment, design-practice prompts) | Reading |
| 55 | Coding practice: Extension C: Dockerfile and docker-compose.yml for Task API + MySQL + Redis; Extension D: write a deployment checklist; then 45-min timed design (pick one: rate limiter, URL shortener or payments); PROJECT: Extension C (Docker) and Extension D (deployment) | Coding |
| 15 | Spaced revisit (Day 47, Day 45, Day 41 key concepts, cover and recall, 8 min) plus questions Q-SD-25..30 (7 min) | Revision and questions |
| 20 | Wrap-up: write the day's Key concepts, answer the 5 revision questions aloud, finish the practical coding task, tick the checklist, log hours | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 / Day 6 notes (Docker, deployment, design-practice prompts).

**Coding practice:** Extension C: Dockerfile and docker-compose.yml for Task API + MySQL + Redis; Extension D: write a deployment checklist; then 45-min timed design (pick one: rate limiter, URL shortener or payments).

**Project stage today:** Extension C (Docker) and Extension D (deployment) (see `12_Project_Task_API.md`).

**Interview questions to revise:** Q-SD-25..30; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 47 (Queues, metrics, monitoring); Day 45 (URL shortener, upload architecture); Day 41 (Slow API debugging, load testing).

**ADVANCED (skip first if behind):** Kubernetes basics, blue/green and canary deploys.

**Daily learning outcomes**

- I can write a production-quality Dockerfile.
- I can explain container vs VM.
- I can deliver a full design answer in 35 minutes.

**Completion checklist**

- [ ] Read the assigned notes (Week 7 / Day 6 notes)
- [ ] Ran and modified every code example myself
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
| 20 | Catch-up reading: re-read Week 7 notes for the weak areas only (unfinished days first) | Reading |
| 15 | Catch-up coding: redo the failed exercise or advance the project (Stage 7 (README, API docs) complete; Extension C and D attempted) | Coding |
| 5 | Log hours and mood, plan next week | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 revision summary and weak-area sections in `07_Week7_System_Design.md`; Week 7 / Day 1-6 notes only for the topics you got wrong.

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
| 25 | Read Week 1 and Week 2 revision summaries | Reading |
| 30 | Redo failed EX-LOOP and EX-ASYNC items, timed | Coding |
| 45 | Spoken drill: 15 questions from Q-JS and Q-NODE, 90 sec each, self-grade | Revision and questions |
| 20 | Write 3 weak topics, log, plan Day 2 | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 1 and Week 2 revision summaries and 'weak-area' sections; Week 8 / Day 1 notes.

**Coding practice:** EX-LOOP-01..14 re-run (wrong ones only), EX-ASYNC-05..09 timed, EX-ERR-01..05 skim.

**Interview questions to revise:** Q-JS-01..30 (Basic and Intermediate marked ones first) and Q-NODE-01..30 (answer 15 aloud); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 49 (Week 7 weak areas); Day 47 (Queues, metrics, monitoring); Day 43 (Architecture and scaling basics).

**Daily learning outcomes**

- I can answer 15 JS/Node questions aloud within 90 seconds each.
- I have no unresolved output-prediction mistakes.
- I know my two weakest JS/Node topics.

**Completion checklist**

- [ ] Read the assigned notes (Week 1 and Week 2 revision summaries and 'weak-area' sections; Week 8 / Day 1 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-LOOP-01..14 re-run
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
| 20 | Read Week 3, 4 and Week 5 / Day 1-2 revision summaries | Reading |
| 35 | Write 5 SQL queries and one Express middleware from a blank file | Coding |
| 45 | Spoken drill: 20 questions from Q-EXP, Q-SQL, Q-MONGO | Revision and questions |
| 20 | Weak-topic list, log, plan Day 3 | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 3, Week 4 and Week 5 / Day 1-2 revision summaries; Week 8 / Day 2 notes.

**Coding practice:** EX-SQL-04..18 (redo hardest 5, timed 10 min each), EX-EXP-01..08 and EX-MW-01..07 (re-skim reference solutions, rebuild one from scratch).

**Interview questions to revise:** Q-EXP-01..30, Q-SQL-01..34, Q-MONGO-01..10 (answer 20 aloud); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 50 (JS + Node rapid revision); Day 48 (Docker, deployment, design practice); Day 44 (Rate limiter, notification design).

**Daily learning outcomes**

- I can write a join+group query in under 5 minutes.
- I can explain isolation anomalies without notes.
- I can design a REST endpoint set in 3 minutes.

**Completion checklist**

- [ ] Read the assigned notes (Week 3, Week 4 and Week 5 / Day 1-2 revision summaries; Week 8 / Day 2 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-SQL-04..18
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
| 20 | Read security and idempotency revision summaries | Reading |
| 60 | Timed rebuilds: JWT auth + RBAC (30), rate limiter (15), idempotency guard (15) | Coding |
| 25 | Spoken drill: 12 Q-SEC questions | Revision and questions |
| 15 | Weak-topic list, log, plan Day 4 | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 5 / Day 3-6 and Week 6 / Day 3 revision summaries; Week 8 / Day 3 notes.

**Coding practice:** EX-JWT-01..08 (one timed rebuild), EX-RATE-01..06 (rebuild token bucket), EX-IDEM-01..07 (rebuild one).

**Interview questions to revise:** Q-SEC-01..30 (answer 12 aloud) and Q-PROD-01..08; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 51 (Express/REST + SQL/Mongo revision); Day 49 (Week 7 weak areas); Day 45 (URL shortener, upload architecture).

**Daily learning outcomes**

- I can build JWT auth + RBAC in 45 minutes.
- I can explain SQLi/XSS/CSRF with fixes without notes.
- I can implement a token bucket in 20 minutes.

**Completion checklist**

- [ ] Read the assigned notes (Week 5 / Day 3-6 and Week 6 / Day 3 revision summaries; Week 8 / Day 3 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-JWT-01..08
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
| 15 | Read incident scenario notes | Reading |
| 60 | Machine-coding task, 60 min, no AI help | Coding |
| 30 | Spoken drill: 10 incident/perf scenarios from Q-PROD and Q-PERF | Revision and questions |
| 15 | Self-review code, log, plan Day 5 | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 6 / Day 6 revision summary; Week 8 / Day 4 notes (incident scenarios, machine-coding prompts).

**Coding practice:** EX-DEBUG-01..06 (timed), plus a 60-minute machine-coding build from Week 8 / Day 4 notes (Express + validation + one test).

**Interview questions to revise:** Q-PROD-01..20 and Q-PERF-01..22 (answer 10 scenarios aloud); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 52 (Auth/security scenarios, coding); Day 50 (JS + Node rapid revision); Day 46 (Payments, idempotency, recovery).

**Daily learning outcomes**

- I can narrate an incident investigation in 2 minutes.
- I can complete a small CRUD machine-coding task in 60 minutes.
- I can name mitigation vs root cause fix.

**Completion checklist**

- [ ] Read the assigned notes (Week 6 / Day 6 revision summary; Week 8 / Day 4 notes)
- [ ] Ran and modified every code example myself
- [ ] Coding practice done: EX-DEBUG-01..06
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
| 15 | Read project interview concepts and Week 7 summary | Reading |
| 60 | Two timed system designs, 30 min each, written on paper or in a text file | Coding |
| 30 | Project pitch practice (3 and 10 minute versions) aloud + 8 Q-SD questions | Revision and questions |
| 15 | Write 5 likely follow-ups with answers, log, plan Day 6 | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 7 revision summary; 12_Project_Task_API.md (stage summaries and 'interview concepts demonstrated'); Week 8 / Day 5 notes.

**Coding practice:** Timed design 1 (30 min), timed design 2 (30 min); record yourself giving the project pitch; polish README of the Task API.

**Interview questions to revise:** Q-SD-01..30 (answer 8 aloud) and project explanation questions in Week 8 / Day 5 notes; plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 53 (Debugging, incidents, machine coding); Day 51 (Express/REST + SQL/Mongo revision); Day 47 (Queues, metrics, monitoring).

**Daily learning outcomes**

- I can deliver a design in 30 minutes using the template.
- I can pitch my project in 3 minutes.
- I can justify every technology choice in the project.

**Completion checklist**

- [ ] Read the assigned notes (Week 7 revision summary; 12_Project_Task_API.md)
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
| 5 | Read mock rules and scoring guide | Reading |
| 50 | Mock set 1, 50 min, spoken answers (no notes) | Revision and questions |
| 50 | Mock set 2, 50 min including the live-coding part | Coding |
| 15 | Score, rank weak topics, log, plan Day 7 | Wrap-up and tests |
| **120** | **Total** | |

**Exact sections to read:** Week 8 / Day 6 notes (mock sets 1-2 and model answers).

**Coding practice:** Live-code section of each mock set (2 x 25 min).

**Interview questions to revise:** Mock set questions (drawn from all Q- prefixes); plus the day's five revision questions at the end of the Day block.

**Spaced revisits today:** Day 54 (System design + project explanation); Day 52 (Auth/security scenarios, coding); Day 48 (Docker, deployment, design practice).

**Daily learning outcomes**

- I finished two mock sets within the time limits.
- I know my weakest 3 topics.
- I can recover from a question I do not know (clarify, reason aloud, state assumptions).

**Completion checklist**

- [ ] Read the assigned notes (Week 8 / Day 6 notes)
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
| 25 | Walk the final readiness checklist; re-read notes only for items marked [X] | Reading |
| 15 | Redo the one coding task you failed in the final mock | Coding |
| **120** | **Total** | |

**Exact sections to read:** Final readiness checklist and readiness assessment sections of `08_Week8_Revision_Mocks_Checklist.md`; model answers for mock set 3; only the notes for your [X] items.

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
- Revisits that would fall after Day 56 are replaced by the Week 8 revision and mock days.
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

---

End of Part 00. Remaining sections of this file: none.
