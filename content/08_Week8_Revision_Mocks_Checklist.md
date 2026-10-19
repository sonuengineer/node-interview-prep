# Week 8 -- Interview Revision, Mock Interviews, Final Checklist

Days 50-56 of the 56-day plan. Yeh week naya kuch teach nahi karta. Is week ka kaam hai: jo
Weeks 1-7 mein padha usse **bolna**, **debug karna**, aur **time ke andar code karna** practice karna.

Tier markers: `[ESSENTIAL]` = most interviews mein poochha jata hai, `[ADVANCED]` = supplementary.
Cross-references: topic ki detail ke liye "Week N / Day X notes", question bank IDs (`Q-JS-01`...),
exercise IDs (`EX-ASYNC-01`...), project stages (`Stage 1..7`, `Extension A-D` in
12_Project_Task_API.md).

## Table of Contents

- Week 8 map and rules for this week
- Day 50 (W8 D1) - JS + Node rapid revision (cheat sheets 1-2)
- Day 51 (W8 D2) - Express/REST + SQL/MongoDB revision (cheat sheets 3-5)
- Day 52 (W8 D3) - Auth/security scenarios + coding exercises (cheat sheet 6)
- Day 53 (W8 D4) - Debugging/incident scenarios + backend machine-coding
- Day 54 (W8 D5) - System design revision + project explanation + follow-up chains
- Day 55 (W8 D6) - Mock interview sets 1-2
- Day 56 (W8 D7) - Mock sets 3-4, final readiness checklist, readiness assessment
- Week 8 revision summary
- Week 8 mixed-difficulty assessment
- Answers with explanations
- Weak-area identification guidance
- Catch-up plan if behind
- Appendix: Mock scoring sheet

---

## Week 8 map and rules for this week

| Day | 2-hour split |
|-----|--------------|
| D1 (Day 50) JS + Node | 50 min cheat sheets, 30 min output prediction, 30 min speak answers aloud, 10 min wrap-up |
| D2 (Day 51) Express/REST + SQL + Mongo | 50 min cheat sheets, 40 min SQL writing from memory, 20 min speak, 10 wrap-up |
| D3 (Day 52) Auth/security + coding | 40 min security scenarios, 70 min coding drills (timed), 10 min wrap-up |
| D4 (Day 53) Incidents + machine coding | 45 min incident walkthroughs, 65 min machine-coding (timed), 10 min wrap-up |
| D5 (Day 54) System design + project | 50 min design revision, 40 min project Q&A aloud, 20 min follow-up chains, 10 min wrap-up |
| D6 (Day 55) Mocks 1-2 | 2 x 40 min mocks + 30 min review and scoring + 10 min notes |
| D7 (Day 56) Mocks 3-4, checklist | 2 x 40 min mocks + 20 min checklist + 20 min assessment |

Rules (inhe todna mat):

1. **Bol ke practice karo.** Reading se confidence aata hai, but interview mein bolna padta hai.
   Har model answer ko pehle apne words mein bolo, phir compare karo. Phone par record karo.
2. **Timer lagao.** Machine-coding mein 45 min cap. Mock mein har question ka time limit hai.
3. **Weak area = jahan tum model answer dekhe bina 60 seconds nahi bol paye.** Usse Day 56 par wapas jao.
4. **Sab kuch master nahi hoga.** 8 weeks mein breadth + solid junior-to-mid fundamentals milte hain,
   deep expertise nahi. Honest assessment Day 56 ke end mein hai.
5. Code samples ES modules mein hain (Node 22 LTS; Node 20 differences jahan relevant flagged hain).

---

## Day 50 (W8 D1) - JS + Node rapid revision

**Learning objectives**

- Week 1 (JS) aur Week 2 (Node internals) ke core facts ko one-page cheat sheets se recall karna.
- 12 output-prediction snippets bina run kiye sahi solve karna.
- Event loop, closures, promises, streams, aur thread pool ke "trap" statements ko precisely bolna.
- Har cheat sheet ka ek 60-second spoken version ready rakhna.

How to use a cheat sheet: pehle sheet ko cover karo, topic ka naam dekho, 60 seconds bolo, phir
uncover karke gaps mark karo. Gaps ko "Week N / Day X notes" mein dekho. Yahan re-teach nahi hoga.

### Cheat Sheet 1 - JavaScript for Backend `[ESSENTIAL]`

**Execution model**

- Call stack = LIFO of execution contexts. Single thread, ek time par ek function.
- Execution context = (variable environment, lexical environment, `this`). Creation phase -> execution phase.
- Hoisting: `var` hoisted and initialized `undefined`; `let/const/class` hoisted but in TDZ (ReferenceError
  before declaration); function declarations fully hoisted; function expressions follow the variable rule.
- Closure = function + reference to its lexical environment (variables, not copies). Use: factories,
  private state, memoize, once(), rate limiter counters.
- Classic trap: `var` in a loop with setTimeout prints the same final value; `let` creates a per-iteration binding.

**`this` rules (priority order)**

1. `new` binding -> new object.
2. Explicit: `call/apply/bind`.
3. Implicit: `obj.method()` -> `obj`.
4. Default: `undefined` in strict mode/ESM, `globalThis` in sloppy scripts.
5. Arrow functions: no own `this`, lexical from the enclosing scope (cannot be rebound by call/bind).

- Trap: `const f = obj.method; f()` loses `this`. Passing a method as a callback loses `this` -> bind or arrow.

**Prototypes**

- Every object has internal `[[Prototype]]`; property lookup walks the chain until `null`.
- `Object.getPrototypeOf(obj)`, `Object.create(proto)`. `class` is syntax over constructor + prototype.
- `instanceof` checks the prototype chain; `Object.hasOwn(o, k)` checks own properties only.
- Method on prototype is shared; method as class field/arrow is per instance (memory cost).
- Prototype pollution: never merge untrusted JSON keys like `__proto__` into objects blindly.

**Objects, arrays, references**

- Primitives copied by value; objects by reference. `const` = binding cannot be reassigned, not immutable.
- Shallow copy: spread, `Object.assign`, `slice`. Deep copy: `structuredClone` (Node 17+); JSON round-trip
  loses Date/undefined/Map/functions.
- Equality: `===` on objects compares reference. `NaN !== NaN`, use `Number.isNaN`.
- `map/filter/reduce` return new arrays; `sort/splice/reverse/push` mutate. `sort()` default is
  string order -> pass a comparator. (`toSorted` exists from Node 20.)
- `Map/Set` for keyed lookup and dedupe, O(1) average.

**Promises and async/await**

- Promise states: pending -> fulfilled/rejected, settles once. `.then` returns a NEW promise.
- Returning a value from `.then` -> next is fulfilled; throwing -> next is rejected; returning a promise -> adopts it.
- `.catch(fn)` = `.then(undefined, fn)`; `.finally` passes through value/reason unless it throws.
- `async` function always returns a promise. `await` pauses only that function, not the thread.
- Error propagation: `try/catch` around `await`; an unawaited promise rejection is NOT caught by a surrounding try.
- Unhandled rejection: Node 15+ default is to crash the process (`--unhandled-rejections=throw`).
- Sequential `await` in a loop is slow if the work is independent; use `Promise.all`.

**Combinators**

| Method | Resolves when | Rejects when | Result |
|--------|---------------|--------------|--------|
| `all` | all fulfil | first rejects | array of values (order preserved) |
| `allSettled` | all settle | never | array of `{status, value/reason}` |
| `race` | first settles | first settles as rejected | first outcome |
| `any` | first fulfils | all reject -> `AggregateError` | first fulfilled value |

None of them cancels the other promises. Cancellation needs `AbortController`.

**Event loop (language level)**

- Order: sync code -> drain the `process.nextTick` queue, then promise jobs (microtasks) -> one macrotask ->
  drain microtasks again -> repeat.
- Microtasks: promise `.then/.catch/.finally`, `await` continuation, `queueMicrotask`.
- Macrotasks: `setTimeout`, `setInterval`, `setImmediate`, I/O callbacks.
- Starvation trap: recursive microtasks / `nextTick` never let the loop reach I/O.

**Common async mistakes (rapid list)**

1. `forEach(async ...)` is not awaited; use `for...of` or `Promise.all(map)`.
2. Missing `return`/`await` inside a `.then` chain breaks the chain and loses errors.
3. `await` in a sequential loop for independent work.
4. `new Promise(async ...)` anti-pattern, swallowed errors.
5. No error handling on fire-and-forget calls -> unhandled rejection.
6. Mixing callbacks and promises (use `util.promisify` / `node:fs/promises`).
7. Race condition on shared state across awaits (read-modify-write with an await in between).
8. Unbounded `Promise.all` over 10k items overloads downstream; use batching/concurrency limit.

### Cheat Sheet 2 - Node.js Internals `[ESSENTIAL]`

**Runtime pieces**

- V8 = JS engine (JIT, GC). libuv = event loop + async I/O + thread pool + timers. Node C++ bindings expose
  fs/net/crypto etc. to JS. No DOM/window; has `process`, `Buffer`, `fs`, `http`.
- Single JS thread for your code; libuv thread pool (default size 4, `UV_THREADPOOL_SIZE`, max 1024)
  and OS async facilities do the waiting.

**Event loop phases (libuv)**

`timers` -> `pending callbacks` -> `idle/prepare` -> `poll` (I/O) -> `check` (setImmediate) -> `close callbacks`.
Between every callback (Node 11+) the nextTick and microtask queues are drained.

- From the main module: `setTimeout(0)` vs `setImmediate` order is NOT deterministic.
- Inside an I/O callback: `setImmediate` always first.
- `process.nextTick` runs before promise microtasks.

**What uses what**

| Operation | Mechanism |
|-----------|-----------|
| TCP/HTTP sockets, most network | OS polling (epoll/kqueue/IOCP) via libuv, not thread pool |
| `fs` (read/write/stat) | thread pool |
| `dns.lookup` (used by default in `http.request`) | thread pool (calls getaddrinfo) |
| `dns.resolve*` | c-ares, network, not pool |
| `crypto.pbkdf2/scrypt/randomBytes`, bcrypt (native addon) | thread pool |
| `zlib` async | thread pool |
| Timers | libuv timer heap, no thread |
| `worker_threads` | separate V8 isolate + event loop per worker |
| `child_process` | separate OS process |

Do not claim "all async uses the thread pool". Also do not claim "async = parallel JS". JS runs on one thread.

**Blocking vs non-blocking**

- Blocking = anything that holds the JS thread: `fs.readFileSync`, huge `JSON.parse`, catastrophic regex
  backtracking, tight CPU loops, sync crypto, large sort.
- Fixes: async API, streams, chunk work with `setImmediate`, worker threads (CPU), separate service.
- Symptom: all requests' latency spikes together; event loop lag high; CPU 100% on one core.

**Worker threads vs cluster vs child_process**

- Worker threads: CPU-bound work; share memory via `SharedArrayBuffer`, message passing otherwise.
- Cluster / multiple processes (PM2, containers): use all cores for request handling, isolated memory.
- Child process: run external programs or isolated scripts.

**Modules**

- CommonJS: `require`, `module.exports`, sync loading, `__dirname` available, cached by resolved filename.
- ESM: `import/export`, top-level await, static analysis, strict mode, no `__dirname`
  (use `import.meta.dirname` Node 20.11+ or `import.meta.url`). `"type":"module"` or `.mjs`.
- ESM can import CJS (default export = `module.exports`). `require(esm)` support is version-dependent
  (experimental in Node 22 releases, behind a flag in earlier ones); do not rely on it.

**process / Buffer / env**

- `process.env` values are strings; `process.argv`, `process.exit(code)`, `process.on('SIGTERM')`,
  `process.memoryUsage()`, `process.hrtime.bigint()`.
- `process.exit()` kills immediately, pending I/O is lost. Prefer setting `process.exitCode` and letting the loop drain.
- Buffer = fixed-size raw bytes outside the V8 heap. `Buffer.from(str, 'utf8')`, `Buffer.alloc(n)` is
  zero-filled; avoid `allocUnsafe` for anything sensitive.
- `--env-file=.env` (Node 20.6+) loads env without dotenv; still never commit secrets.

**Streams**

- 4 types: Readable, Writable, Duplex, Transform. Modes: flowing/paused; `highWaterMark` buffer threshold.
- Backpressure: `writable.write()` returns `false` when the buffer is full -> wait for `'drain'`. `pipe` /
  `pipeline` handle it.
- Prefer `pipeline` from `node:stream/promises` -> proper error propagation and cleanup.
  `pipe()` does not destroy streams on error (leak risk).
- Use streams for large files, uploads, CSV export; avoid loading the whole file into memory.

**EventEmitter**

- Listeners are called synchronously in registration order. `emit('error')` with no listener throws.
- `once`, `off`, `setMaxListeners` warning (>10 listeners per event = likely leak).
- Listener leak: adding a listener per request on a long-lived emitter.

**Memory / GC**

- V8 generational: young generation (scavenge, fast) and old generation (mark-sweep-compact,
  incremental/concurrent).
- Heap limit depends on version/machine; `--max-old-space-size=MB`.
- Typical leaks: unbounded caches/Maps, listeners not removed, closures holding big objects, timers not
  cleared, global arrays of requests, per-request data attached to long-lived objects.
- Diagnose: `process.memoryUsage()` trend, heap snapshots (compare 2-3), `--inspect` + DevTools,
  `--heapsnapshot-signal`. Rising RSS with flat heapUsed suggests Buffers/native memory outside the heap.

### Output-prediction drill (write answers first; answers below)

```js
// P1
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
process.nextTick(() => console.log('D'));
console.log('E');
```

```js
// P2
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0);
```

```js
// P3
async function f() {
  console.log(1);
  await null;
  console.log(2);
}
console.log(3);
f();
console.log(4);
```

```js
// P4
const p = Promise.reject(new Error('x'));
p.catch(() => console.log('caught'))
 .then(() => console.log('then'))
 .finally(() => console.log('finally'));
```

```js
// P5 (ESM file, strict mode)
const obj = { n: 1, get() { return this.n; } };
const g = obj.get;
console.log(obj.get(), typeof g);
console.log(g());
```

```js
// P6
console.log([1, 10, 2, 21].sort());
console.log([1, 10, 2, 21].sort((a, b) => a - b));
```

```js
// P7
const a = { x: 1 };
const b = a;
b.x = 2;
const c = { ...a };
c.x = 3;
console.log(a.x, b.x, c.x);
```

```js
// P8
Promise.all([1, Promise.resolve(2), new Promise((_, r) => setTimeout(() => r('boom'), 10))])
  .then(v => console.log('ok', v))
  .catch(e => console.log('err', e));
```

```js
// P9
import { readFile } from 'node:fs';
readFile(import.meta.filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
```

```js
// P10 (sloppy script semantics for hoisting; run as CommonJS .cjs)
console.log(typeof undeclared, typeof null, typeof (() => {}));
console.log(hoisted());
function hoisted() { return 'ok'; }
console.log(v);
var v = 5;
```

```js
// P11
const results = [];
[1, 2, 3].forEach(async (n) => {
  await new Promise(r => setTimeout(r, 10));
  results.push(n);
});
console.log(results.length);
```

```js
// P12
Promise.resolve(1)
  .then(() => { throw new Error('a'); })
  .then(() => console.log('skipped'))
  .catch(e => { console.log('catch', e.message); return 'recovered'; })
  .then(v => console.log(v));
```

**Answers**

- P1: `A E D C B`. Sync A, E; nextTick D; promise C; then macrotask B.
- P2: `3 3 3 0 1 2` (var shares one binding, let is per iteration).
- P3: `3 1 4 2`.
- P4: `caught`, `then`, `finally`. After `.catch` handles it the chain is fulfilled; `.finally` runs last.
- P5: prints `1 function`, then `g()` throws `TypeError: Cannot read properties of undefined (reading 'n')`
  (strict mode, `this` is undefined). In a sloppy CommonJS script it would print `undefined`.
- P6: `[ 1, 10, 2, 21 ]` (string sort: "1","10","2","21") then `[ 1, 2, 10, 21 ]`.
- P7: `2 2 3`.
- P8: `err boom` after about 10 ms. `ok` is never printed.
- P9: `immediate` then `timeout` (inside an I/O callback the check phase comes before the next timers phase).
  `import.meta.filename` needs Node 20.11+.
- P10: `undefined object function`, then `ok`, then `undefined` (var is hoisted but not yet assigned).
- P11: `0`. forEach does not await async callbacks; results are filled later.
- P12: `catch a` then `recovered`. `skipped` never prints.

### Frontend connection (compact)

- Event loop: browser mein React state batching aur `useEffect` timing ka mental model wahi hai. Node mein
  rendering step nahi hai, I/O phases hain, aur `nextTick` hai.
- Closures: stale-state hook bugs ~ backend mein stale config captured in long-lived callbacks.
- Promises: `fetch` chain wahi hai. Backend mein farak: unhandled rejection process kill kar sakta hai.

### Interview-ready 60-second answers

**Interview answer (event loop):** "Node runs my JavaScript on a single thread. When I start an
asynchronous operation, like a network call or a file read, Node hands the waiting to libuv, either to the
operating system's I/O polling or to a small thread pool. When the work completes, a callback is queued.
The event loop picks up callbacks phase by phase: timers, poll for I/O, check for setImmediate, and so on.
Between callbacks it drains microtasks, meaning process.nextTick and promise reactions. That is why a
blocking CPU task on the main thread delays every request, and why I move heavy CPU work to worker threads
or separate services."

**Interview answer (thread pool):** "Not every asynchronous operation uses the thread pool. Network sockets
use the operating system's readiness notifications through libuv. File system operations, dns.lookup, zlib,
and crypto functions like pbkdf2, scrypt, and bcrypt's native addon use the libuv thread pool, which
defaults to four threads. So a burst of bcrypt hashes can saturate the pool and slow down file reads."

**Interview answer (closures):** "A closure is a function that retains access to the variables of the scope
where it was created, even after that scope has finished. I use closures for factory functions, private
state, memoization, and for example a per-key counter inside a simple rate limiter."

### Follow-up chain: event loop

1. Q: Is `setTimeout(fn, 0)` exactly 0 ms? A: No. Node clamps to a minimum of 1 ms, plus the delay until the
   loop reaches the timers phase; long sync work postpones it more.
2. Q: nextTick vs promise? A: The nextTick queue is processed before the promise microtask queue after the
   current operation. Overuse of nextTick can starve I/O.
3. Q: How do you detect event-loop lag? A: `perf_hooks.monitorEventLoopDelay()` histogram, or measure
   setTimeout drift; alert on p99 delay.
4. Q: How would you handle a 3-second CPU job in an API? A: Offload to a worker thread pool or a job queue
   with a separate worker process; return 202 plus a job id if user-facing.
5. Q: Does `async` make a function run in a thread? A: No. It wraps the result in a promise and allows
   `await` suspension; the body runs on the main thread until the first await.

### Common mistakes (this day)

- Saying "Node is multithreaded because libuv has a thread pool" (JS execution is single-threaded).
- Explaining `await` as "blocks the thread".
- Using `process.exit()` mid-request or during shutdown without draining.
- Claiming `fs.promises` runs on the main thread: it is non-blocking for the loop because it uses the pool.

### Revision notes

- Say the order rule out loud: sync, nextTick, promises, then macrotask phases.
- Memorize the OS vs pool table. It separates average from good candidates.
- Streams: pipeline + backpressure; EventEmitter: error event; memory leaks: cache, listeners, timers.

### Key concepts to remember

1. Closures capture variables (live binding), not values.
2. Microtasks run to exhaustion before the next macrotask.
3. Network I/O is OS-polled; fs/dns.lookup/crypto/zlib use the pool.
4. Backpressure = respect `write()` returning false / use `pipeline`.
5. Leaks come from references that stay reachable (caches, listeners, timers).

### Five revision questions

1. Why does the `var` loop with `setTimeout` print the same value, and how many fixes can you give?
2. Explain the order of `setTimeout`, `setImmediate`, `nextTick`, and a resolved promise.
3. Which of these use the thread pool: `http.get`, `fs.readFile`, `crypto.randomBytes`, `dns.lookup`?
4. What does `pipeline` give you that `pipe` does not?
5. How would you find a memory leak in a running service?

### Practical coding task (25 min)

Write `limitConcurrency(tasks, limit)` that takes an array of functions returning promises, runs at most
`limit` at once, preserves result order, and rejects on the first error. No libraries. Reference solution:
drill D52-1 on Day 52.

### Self-assessment checklist

- [ ] I solved at least 10 of 12 output predictions correctly on paper.
- [ ] I can explain the thread pool table without notes.
- [ ] I can explain backpressure in 45 seconds.
- [ ] I can name 5 sources of memory leaks and how I would detect each.
- [ ] I recorded a 60-second event loop answer and it sounded confident.

---

## Day 51 (W8 D2) - Express/REST + SQL/MongoDB revision

**Learning objectives**

- Week 3 (HTTP, REST, Express) aur Weeks 4-5 (MySQL, MongoDB) ke interview facts ko cheat sheets se recall karna.
- 8 SQL queries bina notes ke likhna (joins, group by, top-N, anti-join, window function).
- Index/EXPLAIN reading aur transaction/isolation traps ko precisely bolna.
- SQL vs NoSQL ka trade-off ek balanced answer mein dena.

### Cheat Sheet 3 - HTTP, REST, Express `[ESSENTIAL]`

**HTTP lifecycle**

DNS -> TCP (+TLS) -> request line + headers + body -> server routing -> handler -> response status +
headers + body -> connection keep-alive or close. Backend ka kaam: parse, validate, authorize, act, respond.

**Methods and semantics**

| Method | Safe | Idempotent | Typical use |
|--------|------|------------|-------------|
| GET | yes | yes | read |
| HEAD / OPTIONS | yes | yes | metadata / CORS preflight |
| POST | no | no | create, actions |
| PUT | no | yes | full replace |
| PATCH | no | not guaranteed | partial update |
| DELETE | no | yes | remove |

Idempotent = same request repeated gives the same server state. POST needs an idempotency key when retries
are possible (payments).

**Status codes you must produce correctly**

- 200 OK, 201 Created (+ `Location`), 202 Accepted (async job), 204 No Content.
- 301/302/304 (cache validation with ETag).
- 400 bad input/malformed, 401 not authenticated (missing/invalid token), 403 authenticated but not allowed,
  404 not found, 405, 409 conflict (duplicate, version mismatch), 413 payload too large, 415 unsupported
  media type, 422 semantic validation failed, 429 rate limited (+ `Retry-After`).
- 500 unexpected, 502 bad upstream response, 503 unavailable/overloaded, 504 upstream timeout.
- 401 vs 403 and 400 vs 422 are favourite questions. Pick one convention for 400/422 and stay consistent.

**Headers and cookies**

- `Content-Type` (what I send), `Accept` (what I want), `Authorization: Bearer <jwt>`, `Cache-Control`,
  `ETag/If-None-Match`, `Origin`, `X-Request-Id` (correlation).
- Cookie flags: `HttpOnly` (JS cannot read; XSS mitigation), `Secure` (HTTPS only), `SameSite=Lax|Strict|None`
  (CSRF mitigation), `Max-Age/Expires`, `Path`, `Domain`.

**REST design**

- Nouns in plural paths: `/tasks`, `/tasks/42`, `/projects/7/tasks`. Verbs come from HTTP methods.
- Stateless: each request carries what the server needs (token), no server-side request memory.
- Consistent error shape: `{ "error": { "code", "message", "details" } }`.
- Pagination: offset (`page`, `limit`) simple but slow for deep pages; cursor/keyset scalable and stable.
- Filtering/sorting by whitelisted query params only (never inject column names from the client blindly).
- Versioning: URL `/v1/` (simple, most common), header-based (cleaner but harder to test). Breaking vs
  additive changes. Deprecation headers.

**Express 5 essentials**

- App: `express()`, `app.use(express.json({ limit }))`, routers, `app.listen`.
- Middleware order matters: request id -> logger -> security headers (helmet) -> CORS -> body parser ->
  rate limit -> routes -> 404 -> error handler.
- Error handler has 4 args `(err, req, res, next)`, registered LAST.
- Express 5: rejected promises/thrown errors from async handlers are forwarded to the error handler
  automatically. Express 4 needs `try/catch` + `next(err)` or a wrapper. Path-to-regexp syntax differs in 5
  (wildcards must be named, e.g. `/*splat`).
- Layering: route (HTTP mapping) -> controller (parse/respond) -> service (business rules, transactions) ->
  repository (SQL). Controllers stay thin; services do not know about `req/res`.
- Validation at the edge (zod/joi/express-validator): reject early, strip unknown fields, coerce types.
- CORS = browser policy enforced by the browser, configured on the server via response headers. It is not
  authentication. Preflight `OPTIONS` for non-simple requests. Credentials need an explicit origin, not `*`.
- File uploads: `multer` (disk or memory), limits on size/type, never trust `originalname` or the mimetype
  header, store outside the web root or in object storage, scan if user-facing.
- API docs: OpenAPI 3 / Swagger UI. Keep the spec in sync using schema-derived docs.

**Debugging a failing request: standard order**

1. Reproduce with curl/Postman (isolates browser/CORS issues).
2. Check status + response body + headers.
3. Check logs with the request id.
4. Check middleware order and body parser (`Content-Type` mismatch => `req.body` undefined).
5. Check auth header and token expiry; then the DB query and error.

### Cheat Sheet 4 - MySQL `[ESSENTIAL]`

**Fundamentals**

- Table, row, column; PK uniquely identifies a row (InnoDB clusters data by PK). FK enforces referential
  integrity (`ON DELETE RESTRICT/CASCADE/SET NULL`). Constraints: `NOT NULL`, `UNIQUE`, `CHECK` (enforced in
  MySQL 8.0.16+), `DEFAULT`.
- Relationships: 1-1, 1-N (FK on the N side), M-N (junction table with composite PK).
- Normalization: 1NF atomic values, 2NF no partial dependency on part of a composite key, 3NF no transitive
  dependency. Denormalize deliberately for read performance (counters, snapshots like `price_at_purchase`).
- Money: `DECIMAL(12,2)` or integer minor units. Never FLOAT.

**Joins and aggregation**

- INNER JOIN: only matching rows. LEFT JOIN: all left rows, NULLs for no match. Anti-join: LEFT JOIN ... WHERE
  right.pk IS NULL (or NOT EXISTS).
- `WHERE` filters rows before grouping; `HAVING` filters groups after aggregation.
- A filter on the right table in `WHERE` turns a LEFT JOIN into an INNER JOIN; put it in `ON`.
- `COUNT(*)` counts rows; `COUNT(col)` ignores NULLs; `COUNT(DISTINCT col)`.
- MySQL 8: CTEs (`WITH`), window functions (`ROW_NUMBER() OVER (...)`).

**Indexes**

- B-tree (InnoDB). Speeds up lookups, range scans, ordering; costs write speed and space.
- Composite index `(a, b, c)`: leftmost-prefix rule; equality columns first, then the range column; usable for
  `ORDER BY` if the order matches. `WHERE b = ?` alone cannot use `(a, b)` efficiently.
- Covering index: all selected columns inside the index -> `Using index`, no table lookup.
- Index killers: function on column (`WHERE DATE(created_at) = ...`), leading wildcard `LIKE '%x'`, implicit
  type conversion (string column compared to a number), low-selectivity column alone, `OR` across different
  columns without index merge.
- Secondary indexes store the PK; a big PK makes all indexes bigger.

**EXPLAIN reading**

- Check `type` (`ALL` = full scan, bad on big tables; `ref`, `range`, `const` good), `key` (chosen index),
  `rows` (estimate), `Extra` (`Using filesort`, `Using temporary` = watch; `Using index` = covering).
- `EXPLAIN ANALYZE` (8.0.18+) shows actual timings.

**Transactions and ACID**

- Atomicity (all or nothing), Consistency (constraints hold), Isolation (concurrent transactions do not see
  partial work, as per level), Durability (committed data survives a crash; redo log).
- InnoDB default isolation: REPEATABLE READ (MVCC snapshot + gap/next-key locks).
- Anomalies: dirty read, non-repeatable read, phantom read, lost update, write skew.
  READ COMMITTED prevents dirty reads; REPEATABLE READ prevents non-repeatable reads (and mostly phantoms in
  InnoDB for consistent reads); SERIALIZABLE locks reads.
- Lost update fix: `SELECT ... FOR UPDATE` in a transaction, atomic `UPDATE ... SET qty = qty - 1 WHERE
  qty > 0`, or optimistic locking with a `version` column.
- Deadlock: two transactions hold locks and wait for each other. InnoDB detects it and rolls back one
  (error 1213). Mitigate: consistent lock ordering, short transactions, retry on deadlock, proper indexes
  (fewer locked rows).
- Do not make network calls (email/payment API) inside an open DB transaction; it holds locks.

**Pooling and pagination**

- A pool reuses connections (opening is costly). Size = based on DB `max_connections`, number of app
  instances, and concurrent query load. `pool.getConnection()` must be released in `finally`. Pool exhaustion =
  requests queue, latency spikes, timeouts.
- Offset pagination `LIMIT 20 OFFSET 100000` scans and discards rows; keyset: `WHERE created_at < ? OR (created_at = ? AND id < ?)
  ORDER BY created_at DESC, id DESC LIMIT 20` with a supporting index.

### Cheat Sheet 5 - MongoDB and SQL vs NoSQL `[ESSENTIAL]` basics, `[ADVANCED]` sharding

- Document = JSON-like BSON; collection = group of documents; flexible schema (but still validate, e.g.
  Mongoose or `$jsonSchema`).
- Embed when data is read together and bounded (order + line items). Reference when unbounded or shared
  (user -> orders). 16 MB document limit.
- Indexes: single, compound (same leftmost-prefix thinking), unique, TTL, text. `explain("executionStats")`:
  look at `COLLSCAN` vs `IXSCAN`, `totalDocsExamined` vs `nReturned`.
- Aggregation pipeline stages: `$match` (early, uses index), `$group`, `$sort`, `$project`, `$lookup` (join-like,
  can be slow), `$unwind`, `$limit`.
- Transactions: multi-document ACID supported on replica sets (4.0+), but design to avoid needing them.
- Replica set = HA via primary/secondaries; sharding = horizontal partitioning (shard key choice is critical).

**SQL vs NoSQL trade-off**

| Need | Lean SQL (MySQL) | Lean MongoDB |
|------|------------------|--------------|
| Strong relations, joins, transactions (payments, inventory) | yes | possible but harder |
| Flexible/evolving documents, nested data read as a unit | less natural | yes |
| Ad-hoc reporting | yes | aggregation works, joins weak |
| Horizontal write scaling | harder (sharding/app-level) | built-in sharding |

Honest answer: default to relational unless the data shape or scale clearly fits documents. "NoSQL is
faster" is not an acceptable justification.

### SQL drill: write these from memory

Schema for the drill (MySQL 8):

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('admin','member') NOT NULL DEFAULT 'member',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  assignee_id BIGINT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  status ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  priority TINYINT NOT NULL DEFAULT 3,
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_owner FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id),
  INDEX idx_tasks_owner_status_created (owner_id, status, created_at)
);

CREATE TABLE comments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  author_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id)
);
```

Queries to write (answers below):

1. Count of tasks per status for owner 5.
2. All users with their number of tasks (include users with zero tasks).
3. Users who have never been assigned any task (anti-join).
4. Owners who have more than 10 tasks that are not done.
5. Top 3 owners by number of completed tasks.
6. Latest comment per task (MySQL 8 window function).
7. Tasks overdue (due_date before today, not done) with owner email, newest due date first.
8. Next page of owner 5's tasks using keyset pagination (last seen created_at = '2026-01-10 10:00:00', id = 90).

**Answers**

```sql
-- 1
SELECT status, COUNT(*) AS cnt
FROM tasks
WHERE owner_id = 5
GROUP BY status;

-- 2 (LEFT JOIN so zero-task users remain; COUNT(t.id) ignores NULLs)
SELECT u.id, u.email, COUNT(t.id) AS task_count
FROM users u
LEFT JOIN tasks t ON t.owner_id = u.id
GROUP BY u.id, u.email;

-- 3 (anti-join)
SELECT u.id, u.email
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
WHERE t.id IS NULL;

-- 4 (HAVING filters groups; the status filter goes in WHERE)
SELECT owner_id, COUNT(*) AS open_cnt
FROM tasks
WHERE status <> 'done'
GROUP BY owner_id
HAVING COUNT(*) > 10;

-- 5
SELECT owner_id, COUNT(*) AS done_cnt
FROM tasks
WHERE status = 'done'
GROUP BY owner_id
ORDER BY done_cnt DESC, owner_id ASC
LIMIT 3;

-- 6
SELECT task_id, id AS comment_id, body, created_at
FROM (
  SELECT c.*, ROW_NUMBER() OVER (PARTITION BY c.task_id ORDER BY c.created_at DESC, c.id DESC) AS rn
  FROM comments c
) x
WHERE rn = 1;

-- 7
SELECT t.id, t.title, t.due_date, u.email AS owner_email
FROM tasks t
INNER JOIN users u ON u.id = t.owner_id
WHERE t.due_date < CURDATE() AND t.status <> 'done'
ORDER BY t.due_date DESC;

-- 8 (row-value comparison; a dedicated index on (owner_id, created_at, id) serves it best)
SELECT id, title, created_at
FROM tasks
WHERE owner_id = 5
  AND (created_at < '2026-01-10 10:00:00' OR (created_at = '2026-01-10 10:00:00' AND id < 90))
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

Notes: for query 8 mention the index `(owner_id, created_at, id)`. In query 2, putting
`WHERE t.status = 'done'` would silently turn the LEFT JOIN into an INNER JOIN (put it in `ON`).

### Interview-ready answers

**Interview answer (401 vs 403):** "401 means the request is not authenticated: the credentials are missing,
expired, or invalid. 403 means the server knows who you are but you are not allowed to perform this action.
For example, a missing or expired JWT gives 401, while a normal member trying to delete another user's task
gets 403. Sometimes, to hide the existence of a resource, I return 404 instead of 403."

**Interview answer (composite index):** "A composite index on columns a, b, c is a B-tree sorted by a, then
b, then c. The optimizer can use it for conditions on a leftmost prefix such as a, or a and b. I put equality
columns first and the range column last, and I try to match ORDER BY so MySQL can avoid a filesort. A query
filtering only on b cannot use that index efficiently."

**Interview answer (isolation level):** "InnoDB uses REPEATABLE READ by default, so within a transaction
consistent reads see one snapshot. It prevents dirty and non-repeatable reads. Lost updates and write skew
still need explicit handling, for example SELECT FOR UPDATE, atomic conditional updates, or optimistic
locking with a version column."

**Interview answer (SQL vs NoSQL):** "I choose by access patterns and consistency needs. For money,
inventory, and relational data with joins I prefer a relational database such as MySQL with transactions.
MongoDB suits document-shaped data that is read as a unit and evolves quickly, or very high write scale
with a good shard key. I would not pick NoSQL just because it is called faster."

### Follow-up chains

**Chain A: "Why is my API slow on `/tasks`?"**

1. Check how it is slow: p50 vs p99, all endpoints or one. (One endpoint -> query/N+1; all -> pool/loop lag.)
2. Run EXPLAIN on the query; look for `type=ALL`, `Using filesort`, high `rows`.
3. Add or fix a composite index matching WHERE + ORDER BY.
4. Check for N+1 (a loop making a query per row) -> replace with JOIN or `WHERE id IN (?)`.
5. Check deep offset pagination -> keyset.
6. Only then consider caching (Redis) and read replicas.

**Chain B: "How do you prevent a double-booking / oversell?"**

1. Atomic update: `UPDATE stock SET qty = qty - 1 WHERE sku = ? AND qty > 0`; check `affectedRows`.
2. Or a transaction with `SELECT ... FOR UPDATE`.
3. Or an optimistic `version` column and retry.
4. A unique constraint as the final safety net (e.g. unique `(event_id, seat_no)`).

**Chain C: CORS**

1. Why did the browser block the call? Different origin + missing `Access-Control-Allow-Origin`.
2. Does curl fail too? No -> CORS is browser-enforced.
3. Why preflight? Non-simple method/headers (e.g. `Authorization`, JSON content type) trigger `OPTIONS`.
4. With cookies? `Access-Control-Allow-Credentials: true` and an explicit origin; `*` is not allowed.

### Common mistakes (this day)

- Returning 200 with `{ "error": ... }` for failures.
- Using `SELECT *` in production queries and exposing `password_hash` in responses.
- Offset pagination on huge tables; sorting on non-indexed columns.
- Putting business logic in controllers, or SQL strings built via concatenation (injection risk).
- Thinking foreign keys are optional "because the app checks".
- Claiming Mongo "has no schema, so no design needed".

### Revision notes

- HTTP: method semantics + idempotency + status code precision.
- Express: order of middleware, error handler last, async errors in Express 5.
- SQL: join types, WHERE vs HAVING, leftmost prefix, EXPLAIN, FOR UPDATE, deadlock retry.
- Mongo: embed vs reference, `$match` first, indexes, COLLSCAN.

### Key concepts to remember

1. 401 = who are you, 403 = you may not.
2. PUT/DELETE idempotent; POST is not, so payments need idempotency keys.
3. Leftmost prefix + equality-then-range for composite indexes.
4. REPEATABLE READ does not save you from lost updates; use atomic updates or locks.
5. Keyset pagination scales; offset does not.

### Five revision questions

1. Why does the Express error-handling middleware need exactly four parameters and a last position?
2. Difference between PUT and PATCH, and which is idempotent?
3. Write a query returning the second-highest priority among a user's tasks.
4. What does `Using filesort` in EXPLAIN mean and how do you remove it?
5. When would you embed vs reference in MongoDB?

(Hint for question 3: `SELECT DISTINCT priority FROM tasks WHERE owner_id = ? ORDER BY priority DESC LIMIT 1 OFFSET 1;`
or `DENSE_RANK()` in a window function.)

### Practical coding task (30 min)

Create a `GET /tasks` Express route handler (no DB needed; use an in-memory array) with whitelisted
sorting (`sort=created_at|priority`, `order=asc|desc`), `status` filter, and offset pagination returning
`{ data, page, limit, total }`. Compare with the Task API project's Stage 5.

### Self-assessment checklist

- [ ] I wrote 7 of 8 SQL queries correctly without looking.
- [ ] I can explain 401/403/404/409/422/429 with one example each.
- [ ] I can explain leftmost-prefix with a concrete index and three queries (usable / partly / unusable).
- [ ] I can describe how to find and fix an N+1 query.
- [ ] I can give a balanced SQL vs NoSQL answer in under a minute.

---

## Day 52 (W8 D3) - Auth/security scenarios + coding exercises

**Learning objectives**

- Authentication aur security (Week 5) ko cheat sheet se recall karna.
- 7 security scenarios mein vulnerability pehchanna, attack explain karna, aur fix batana.
- 6 timed coding drills (D52-1 to D52-6) solve karna: concurrency limiter, retry/backoff, JWT middleware,
  signup/login, transaction-safe transfer, idempotent endpoint.
- Har drill ka problem pehle attempt karna; solution tabhi dekhna jab timer khatam ho.

### Cheat Sheet 6 - Authentication and Security `[ESSENTIAL]`

**Authentication vs authorization**

- Authentication (authn) = who are you. Authorization (authz) = what may you do. RBAC = permissions via
  roles; also check resource ownership (a role check alone is not enough: "member can edit only own tasks").

**Passwords**

- Hash with a slow, salted algorithm: bcrypt (cost 10-12), argon2id, or scrypt. Never MD5/SHA-1/plain
  SHA-256, never encryption, never log passwords.
- bcrypt truncates input at 72 bytes. The salt is embedded in the hash string. Compare with `bcrypt.compare`
  (constant-time). Hashing runs on the thread pool; a burst of logins can saturate the pool.
- Login errors: same message for unknown email and wrong password ("Invalid credentials"); also keep timing
  similar (compare against a dummy hash when the user does not exist).

**JWT**

- Structure: `header.payload.signature`, base64url encoded. The payload is readable by anyone (NOT encrypted):
  never put secrets or sensitive PII in it.
- Verify: signature, `exp`, `nbf`, `iss`, `aud`; pin the algorithm list (`algorithms: ['HS256']`) to prevent
  alg confusion / `none` tricks.
- HS256 = shared secret (single service); RS256/ES256 = private key signs, public key verifies (multi-service).
- Access token: short life (5-15 min). Refresh token: long life, stored hashed in DB, rotated on use, revocable,
  ideally in an `HttpOnly; Secure; SameSite` cookie. Detect reuse of an old refresh token -> revoke the family.
- Sessions vs JWT: sessions = server stores state (easy revoke, needs a shared store like Redis when scaled);
  JWT = stateless verification (scales, hard to revoke before expiry). Many real systems combine a short access
  JWT + a server-side refresh record.

**Attacks and fixes**

| Attack | What happens | Fix |
|--------|--------------|-----|
| SQL injection | user input becomes SQL | parameterized queries (`?` placeholders), whitelist column/sort names, least-privilege DB user |
| XSS | attacker script runs in the victim's browser | output encoding/escaping, CSP, `HttpOnly` cookies, sanitize HTML input; a JSON API must still not return raw unsanitized HTML that gets rendered |
| CSRF | browser auto-sends the cookie to your API from another site | `SameSite` cookies, CSRF token (double-submit/synchronizer), check `Origin`; bearer header tokens are not auto-sent |
| CORS misconfig | any origin can read responses | explicit allowlist, no `*` with credentials, never reflect an arbitrary Origin |
| Brute force / credential stuffing | many login attempts | rate limit by IP + account, lockout/backoff, MFA, breached-password checks |
| IDOR / BOLA | change the ID in the URL, read someone else's data | always scope queries by owner/tenant or check ownership |
| Mass assignment | client sends `role: "admin"` and you save it | whitelist fields (schema validation with strip) |
| SSRF | server fetches an attacker-given URL (internal metadata) | allowlist hosts, block private IP ranges |
| Path traversal | `../../etc/passwd` via filename | generate server-side filenames, `path.resolve` + prefix check |
| Prototype pollution | `__proto__` merged into objects | schema validation, `Object.create(null)` maps, safe merge |
| ReDoS | evil regex blocks the loop | simple regexes, input length limits, re2 if needed |
| Secrets leakage | keys in git, logs, error responses | env/secret manager, `.gitignore`, rotate on leak, scrub logs |

**Secure baseline for an Express API**

`helmet()`, strict `express.json({ limit: '100kb' })`, CORS allowlist, rate limiting (stricter on `/auth/*`),
validation on every input, generic error messages to clients with detail in server logs, HTTPS terminated
at a proxy with `trust proxy` configured correctly (otherwise `req.ip` and rate limiting are wrong),
dependency audit (`npm audit`), a pinned lockfile, a non-root container user.

### Security scenarios (diagnose, then read the answer)

**S1.** Frontend stores the access token in `localStorage`. A third-party analytics script is compromised.
What is the risk and what do you change?

Answer: Any script on the page can read `localStorage`, so an XSS or malicious third-party script can exfiltrate
the token. Mitigations: keep access tokens in memory, the refresh token in an `HttpOnly; Secure; SameSite`
cookie, add a strict CSP, remove or sandbox third-party scripts. Cookie use then requires CSRF protection
(`SameSite=Lax/Strict` plus an Origin check on the refresh endpoint).

**S2.** Login endpoint: 50,000 failed logins per minute from many IPs against a few accounts.

Answer: Credential stuffing/brute force. Per-IP rate limiting alone fails with distributed IPs, so add
per-account throttling (progressive delay or temporary lock, with care for lockout-DoS), CAPTCHA/MFA after
failures, alerting on failure rate, breached-password checks, and make sure bcrypt cost does not let attackers
exhaust the thread pool (limit concurrent hashes).

**S3.** A reviewer finds `jwt.verify(token, secret)` without options, and tokens are signed with a secret
`"secret123"` stored in code.

Answer: A weak/hard-coded secret can be brute forced offline, after which anyone can forge tokens. Use a long
random secret (32+ bytes) from env/secret manager, pin `algorithms`, validate `iss/aud/exp`, rotate the secret
(support `kid` for overlap). If it has been committed, treat it as compromised and rotate.

**S4.** `GET /tasks/:id` returns any task by ID for any logged-in user.

Answer: IDOR/BOLA (broken object level authorization). Fix in the service/query:
`SELECT ... FROM tasks WHERE id = ? AND (owner_id = ? OR assignee_id = ?)`. Return 404 for not found or not
visible (avoids leaking existence). Add a negative test with another user's token.

**S5.** `GET /tasks?sort=...` builds `ORDER BY ${sort}` from the query string.

Answer: SQL injection through an identifier (placeholders cannot parameterize identifiers).
Fix: whitelist map `{ created_at: 't.created_at', priority: 't.priority' }`, fall back to a default, and
validate `order` as `ASC|DESC` only.

```js
const SORTABLE = { created_at: 't.created_at', priority: 't.priority', due_date: 't.due_date' };
export function buildOrderBy(sort = 'created_at', order = 'desc') {
  const col = SORTABLE[sort] ?? SORTABLE.created_at;
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${col} ${dir}, t.id ${dir}`;
}
```

**S6.** `.env` with the DB password was pushed to a public repository 20 minutes ago.

Answer: Assume compromised. Rotate the DB password/keys immediately, check DB logs for unknown connections,
remove the file from history (but rotation matters more than rewriting history), add `.env` to `.gitignore`,
add secret scanning (pre-commit/CI), use a secret manager or deployment-time env vars.

**S7.** The app uses a session cookie for auth and has a `POST /transfer` endpoint. A malicious site auto-submits
a form to it.

Answer: CSRF. The browser attaches the cookie automatically. Fix: `SameSite=Lax` (or Strict), a CSRF token
for state-changing requests, validate `Origin/Referer`, and require a JSON content type with a custom header
(forces preflight) as defence in depth. Bearer tokens in an Authorization header are not auto-attached, so CSRF
is not the same risk there.

### Interview-ready answers

**Interview answer (JWT revocation):** "JWTs are stateless, so I cannot revoke one before it expires
unless I keep some server-side state. My approach is short-lived access tokens, around 10 to 15 minutes,
plus a refresh token that I store hashed in the database and rotate on each use. To log a user out or
respond to a compromise, I revoke the refresh token, and the access token dies on its own shortly after. For
immediate revocation I can add a small deny-list in Redis keyed by token id until expiry."

**Interview answer (SQL injection):** "SQL injection happens when user input is concatenated into SQL. I
prevent it with parameterized queries, where the driver sends values separately from the statement, so input
is never parsed as SQL. For things that cannot be parameterized, like column names in ORDER BY, I use a
whitelist. I also use a least-privilege database user and validate input at the edge."

**Interview answer (hashing):** "I never store passwords reversibly. I use bcrypt or argon2 with a unique
salt and a tuned cost factor, so brute-forcing a leaked database is expensive. At login I compare using the
library's constant-time compare and return the same error for an unknown user and a wrong password."

### Follow-up chains

**Chain: "Why not just encrypt passwords?"** -> Encryption is reversible; if the key leaks, all passwords
leak. Hashing is one-way. -> "Why not SHA-256?" Too fast; GPUs try billions per second; no built-in salt
or cost. -> "What does the cost factor do?" It sets the work factor: 2^cost iterations; raise it as
hardware improves. -> "What if a user has a 100-char password?" bcrypt truncates at 72 bytes; pre-hash or
use argon2/scrypt, or cap length and document it.

**Chain: "Where do you store the refresh token?"** -> HttpOnly Secure SameSite cookie, scoped to the
refresh path. -> "CSRF on the refresh endpoint?" SameSite + Origin check; the refresh endpoint only
returns a new access token in the body, which a cross-site attacker cannot read thanks to CORS. -> "What
if it is stolen?" Rotation + reuse detection: using an already-rotated token revokes the whole token family.

### Coding drills (attempt before opening solutions) -- problem statements

All drills: ES modules, Node 22. 15-20 minutes each. Write tests (`node:test`) for at least two cases.

**D52-1 limitConcurrency.** `limitConcurrency(tasks, limit)`; `tasks` is an array of `() => Promise`.
Run at most `limit` at once. Return results in input order. If any task rejects, reject with that error and
do not start new tasks. Example: 5 tasks each taking 100 ms, limit 2 -> total about 300 ms.
Hints: shared index counter, N worker loops. Complexity target: O(n) time overhead, O(n) results.

**D52-2 retry with exponential backoff.** `retry(fn, { retries, baseMs, maxMs, shouldRetry, signal })`.
Delay = random between 0 and `min(maxMs, baseMs * 2^attempt)` (full jitter). Do not retry when
`shouldRetry(err)` is false. Respect `AbortSignal`. Example: `fn` fails twice then succeeds -> returns the value
after 2 delays.

**D52-3 JWT auth + role middleware.** Express middleware `authenticate` (Bearer token, HS256 pinned, issuer
check, sets `req.user = { id, role }`, 401 with a consistent error shape on any failure) and
`requireRole(...roles)` (403). Do not leak the reason for verification failure.

**D52-4 signup/login service.** Using a `mysql2/promise` pool and `bcrypt`: `signup` (normalizes email,
hashes, handles duplicate email -> 409), `login` (same error for unknown user and wrong password, dummy-hash
compare to flatten timing, returns `{ id, role }`). Parameterized SQL only.

**D52-5 transfer money.** `transfer(pool, fromId, toId, amountMinor)` on table
`accounts(id, balance_minor BIGINT UNSIGNED, ...)` and `ledger(id, from_id, to_id, amount_minor, created_at)`.
Atomic, no overdraft, no negative/zero amounts, no deadlock when two opposite transfers run concurrently.

**D52-6 idempotent POST.** `withIdempotency(pool, { key, userId, requestHash }, action)`: the same key
returns the stored response (no second side effect); the same key with a different request body returns
422; a concurrent duplicate while the first is still running returns 409; if `action` throws, release
the key so the client can retry.

### Coding drills -- solutions

**D52-1 solution**

```js
// limit-concurrency.js
export async function limitConcurrency(tasks, limit) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('limit must be an integer >= 1');
  }
  const results = new Array(tasks.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed) {
      const i = next++;
      if (i >= tasks.length) return;
      try {
        results[i] = await tasks[i]();
      } catch (err) {
        failed = true; // stop other workers from picking new tasks
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
```

Why it works: `next++` is atomic because JS is single-threaded between awaits, so no two workers take the same
index. Time O(n) overhead; space O(n). Tasks already in flight cannot be cancelled (pass an `AbortSignal`
into tasks if cancellation is needed). Common mistakes: starting all tasks via `map` first (promises begin
immediately), losing result order by using `push`, forgetting that `limit` may exceed `tasks.length`.

**D52-2 solution**

```js
// retry.js
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function retry(
  fn,
  { retries = 3, baseMs = 100, maxMs = 2000, shouldRetry = () => true, signal } = {},
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      const cap = Math.min(maxMs, baseMs * 2 ** attempt);
      await sleep(Math.random() * cap, signal);
    }
  }
}
```

Interview points: jitter avoids the thundering herd; retry only idempotent operations or those protected by
an idempotency key; retry only transient errors (network reset, 502/503/504, 429 with `Retry-After`), not
400/401/404; set an overall deadline so retries do not outlive the client's patience.
Mistakes: retrying forever, no jitter, retrying a non-idempotent POST blindly.

**D52-3 solution**

```js
// auth.middleware.js
import jwt from 'jsonwebtoken';

const unauthorized = (res) =>
  res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

export function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return unauthorized(res);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: 'task-api',
    });
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    return unauthorized(res); // expired, malformed, bad signature: same response
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
  }
  return next();
};
```

Usage: `router.delete('/users/:id', authenticate, requireRole('admin'), deleteUser)`. Ownership checks
belong in the service (see S4). Returning a non-sensitive code such as `TOKEN_EXPIRED` (so the client knows to
refresh) is acceptable, because expiry is public information in the payload.

**D52-4 solution**

```js
// auth.service.js
import bcrypt from 'bcrypt';

const ROUNDS = 12;
const DUMMY_HASH = await bcrypt.hash('not-a-real-password', ROUNDS);

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function signup(pool, { email, password }) {
  const normalized = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, ROUNDS);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [normalized, hash],
    );
    return { id: result.insertId, email: normalized, role: 'member' };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'EMAIL_TAKEN', 'Email already registered');
    }
    throw err;
  }
}

export async function login(pool, { email, password }) {
  const [rows] = await pool.execute(
    'SELECT id, role, password_hash FROM users WHERE email = ?',
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }
  return { id: user.id, role: user.role };
}
```

Notes: the `users` table needs `password_hash VARCHAR(100) NOT NULL` (the Task API project schema has it; the
Day 51 drill table omits it for brevity). Relying on the UNIQUE constraint (and catching the duplicate error)
is race-safe; a "SELECT then INSERT" check is not. Validate password length (e.g. 8-72 chars) at the edge.
Mistakes: logging the request body, returning `password_hash` in the response, telling the client which of
email/password was wrong.

**D52-5 solution**

```js
// transfer.js
import { HttpError } from './auth.service.js';

export async function transfer(pool, fromId, toId, amountMinor) {
  if (fromId === toId) throw new HttpError(400, 'SAME_ACCOUNT', 'Cannot transfer to same account');
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new HttpError(400, 'BAD_AMOUNT', 'Amount must be a positive integer (minor units)');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock both rows in a fixed order (by id) -> opposite transfers cannot deadlock each other.
    const [lo, hi] = fromId < toId ? [fromId, toId] : [toId, fromId];
    const [rows] = await conn.execute(
      'SELECT id, balance_minor FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
      [lo, hi],
    );
    if (rows.length !== 2) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');

    const from = rows.find((r) => r.id === fromId);
    if (BigInt(from.balance_minor) < BigInt(amountMinor)) {
      throw new HttpError(409, 'INSUFFICIENT_FUNDS', 'Insufficient funds');
    }

    await conn.execute('UPDATE accounts SET balance_minor = balance_minor - ? WHERE id = ?', [amountMinor, fromId]);
    await conn.execute('UPDATE accounts SET balance_minor = balance_minor + ? WHERE id = ?', [amountMinor, toId]);
    await conn.execute(
      'INSERT INTO ledger (from_id, to_id, amount_minor) VALUES (?, ?, ?)',
      [fromId, toId, amountMinor],
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
```

Why it works: `FOR UPDATE` locks both rows until commit; fixed lock order prevents deadlock cycles; the ledger
row makes the movement auditable; money is integer minor units. If a deadlock still happens (error code
`ER_LOCK_DEADLOCK`, 1213) the caller can retry the whole function. Notes: `BIGINT` may arrive as a string
from mysql2 depending on `supportBigNumbers/bigNumberStrings`, hence `BigInt(...)`.
Mistakes: checking the balance with a plain SELECT outside the transaction, forgetting `release()` (pool leak),
calling an external API inside the transaction, using FLOAT.

**D52-6 solution**

Table:

```sql
CREATE TABLE idempotency_keys (
  user_id BIGINT UNSIGNED NOT NULL,
  idem_key VARCHAR(100) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  state ENUM('in_progress','completed') NOT NULL DEFAULT 'in_progress',
  response_code SMALLINT NULL,
  response_body JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, idem_key)
);
```

Code:

```js
// idempotency.js
import { createHash } from 'node:crypto';
import { HttpError } from './auth.service.js';

export const hashRequest = (body) =>
  createHash('sha256').update(JSON.stringify(body)).digest('hex');

export async function withIdempotency(pool, { key, userId, requestHash }, action) {
  // The PRIMARY KEY makes "first writer wins" atomic, even across app instances.
  const [ins] = await pool.execute(
    `INSERT IGNORE INTO idempotency_keys (user_id, idem_key, request_hash) VALUES (?, ?, ?)`,
    [userId, key, requestHash],
  );

  if (ins.affectedRows === 0) {
    const [rows] = await pool.execute(
      `SELECT request_hash, state, response_code, response_body
         FROM idempotency_keys WHERE user_id = ? AND idem_key = ?`,
      [userId, key],
    );
    const row = rows[0];
    if (!row) throw new HttpError(409, 'RETRY', 'Please retry');
    if (row.request_hash !== requestHash) {
      throw new HttpError(422, 'IDEMPOTENCY_KEY_REUSED', 'Key was used with a different request');
    }
    if (row.state === 'in_progress') {
      throw new HttpError(409, 'IN_PROGRESS', 'A request with this key is still processing');
    }
    return { replayed: true, status: row.response_code, body: row.response_body };
  }

  try {
    const { status, body } = await action();
    await pool.execute(
      `UPDATE idempotency_keys SET state = 'completed', response_code = ?, response_body = ?
        WHERE user_id = ? AND idem_key = ?`,
      [status, JSON.stringify(body), userId, key],
    );
    return { replayed: false, status, body };
  } catch (err) {
    await pool.execute('DELETE FROM idempotency_keys WHERE user_id = ? AND idem_key = ?', [userId, key]);
    throw err;
  }
}
```

Honest limitation: if the process crashes after the side effect but before the `UPDATE`, the key stays
`in_progress`. Production fix: run the side effect and the key update in the SAME database transaction when
the side effect is a DB write, and expire stale `in_progress` rows with a sweeper (TTL). For external
side effects (payment gateway), pass the same idempotency key downstream.
Mistakes: SELECT-then-INSERT (race), not hashing the request body, keeping keys forever (add TTL cleanup),
using a global instead of a per-user key scope.

### Common mistakes (this day)

- Verifying JWT without pinning the algorithm; long-lived access tokens; secrets in code.
- Role-only checks without ownership checks (IDOR).
- Different error messages for unknown user vs wrong password.
- Ignoring `trust proxy`, so rate limiting sees the proxy IP for every user.
- Treating CORS as an authentication mechanism.

### Revision notes

- Auth answers always cover: hashing, token lifetime, storage, revocation, rate limiting.
- For every endpoint ask: who is allowed, what scope, what input, what is logged.
- Retries need idempotency. Money needs transactions + locks + integer units.

### Key concepts to remember

1. bcrypt/argon2 with salt; same error for unknown user and wrong password.
2. JWT payload is public; pin algorithms; short expiry + rotating refresh tokens.
3. Parameterize values, whitelist identifiers.
4. RBAC + ownership check; return 404 to hide existence when appropriate.
5. Idempotency key = unique constraint + stored response + request hash.

### Five revision questions

1. Why is `SameSite=Lax` not a complete CSRF solution on its own?
2. What is the difference between 401 and 403 in a JWT flow when the token is expired vs the role is wrong?
3. Why does fixed lock ordering prevent deadlocks in transfer?
4. What problem does refresh-token rotation with reuse detection solve?
5. Why is "SELECT then INSERT" unsafe for unique emails?

### Practical coding task (30 min)

Write tests with `node:test` for `retry` (succeeds after 2 failures; stops when `shouldRetry` returns false;
aborts on signal) using a tiny `baseMs` such as 1. Then add a `deadlineMs` option that stops retrying after
a total time budget.

### Self-assessment checklist

- [ ] I solved at least 4 of 6 drills within the time limit.
- [ ] I can explain each row of the attack table without notes.
- [ ] I can explain access vs refresh token design in 90 seconds.
- [ ] I can state two limitations of my idempotency implementation.
- [ ] I can write the whitelist ORDER BY helper from memory.

---

## Day 53 (W8 D4) - Debugging/incident scenarios + backend machine-coding

**Learning objectives**

- Production incident ko structured way mein triage karna: symptom -> hypotheses -> evidence -> fix -> prevention.
- 8 common incident patterns ka diagnosis walkthrough bolna (slow API, memory leak, blocked loop, pool
  exhaustion, duplicate charge, deadlocks, shutdown errors, cache stampede).
- 5 backend machine-coding problems (rate limiter, URL shortener, job queue, LRU+TTL cache, Express CRUD)
  45 minutes ke andar design + code + test karna.
- Interview mein "think aloud" format: clarify -> simple design -> code -> test -> improve.

### Part A - Incident diagnosis framework `[ESSENTIAL]`

Interviewer poochega "API slow hai, kya karoge?" Tum yeh 6-step order bolo:

1. **Scope**: kaunsa endpoint, kitne users, kab se, kisi deploy/config change ke baad? (Start time ko deploy
   timeline se match karo.)
2. **Impact and mitigate first**: rollback, scale out, disable a feature flag, shed load. Root cause baad mein.
3. **Golden signals**: latency (p50/p95/p99), traffic, errors, saturation (CPU, event loop lag, DB connections,
   memory).
4. **Narrow the layer**: client -> load balancer -> app -> cache -> DB -> third party. Use request id traces.
5. **Hypothesis with evidence**: ek time par ek cheez; EXPLAIN, heap snapshot, flame graph, slow query log.
6. **Fix + prevention**: permanent fix, test/alert/runbook, short post-incident note.

Tools by layer (Node): `curl -w` timing, structured logs with request id, `process.memoryUsage()`,
`perf_hooks.monitorEventLoopDelay`, `node --inspect` / `--cpu-prof`, `clinic`/`0x` flame graphs,
`autocannon` for load, MySQL `SHOW PROCESSLIST`, slow query log, `EXPLAIN ANALYZE`,
`SHOW ENGINE INNODB STATUS` (last deadlock), Redis `INFO`, `SLOWLOG`.

### Part B - Eight incident scenarios with walkthroughs

**Incident 1: `/tasks` became slow after a deploy (p99 from 80 ms to 4 s)**

- Symptom: only `/tasks` slow; CPU of the app low; DB CPU high.
- Triage: the app is idle but the DB busy -> query problem. Check the slow query log for new queries after the deploy.
- Evidence: `EXPLAIN` shows `type=ALL`, `rows` about 2M, `Using filesort`. The deploy added
  `ORDER BY priority DESC, created_at DESC` and a filter on `assignee_id`; no matching index.
- Immediate fix: add a composite index online
  `ALTER TABLE tasks ADD INDEX idx_assignee_priority_created (assignee_id, priority, created_at), ALGORITHM=INPLACE, LOCK=NONE;`
  (verify on staging; DDL on a large table can still cause metadata lock waits).
- Also check for N+1: a loop calling `SELECT ... WHERE task_id = ?` per row; replace by one `IN (...)` query
  or a JOIN.
- Prevention: review EXPLAIN in PRs touching queries, load-test with production-sized data, alert on slow
  query count.
- **Interview answer:** "I would first confirm whether the slowness is in the app or the database by comparing
  app CPU, event loop lag, and DB metrics. If the DB is busy I would look at the slow query log, run EXPLAIN
  on the new query, and look for full scans or filesorts. The usual fix is a composite index that matches the
  filter and sort, or removing an N+1 pattern. Then I add a regression guard such as a load test or slow-query alert."

**Incident 2: Memory grows steadily, process OOM-killed every ~6 hours**

- Symptom: RSS climbs linearly, GC cannot reclaim, the container restarts (exit code 137 when OOM-killed).
- Triage: compare `heapUsed` vs `rss`. If heapUsed grows -> JS objects retained; if only rss -> Buffers/native.
- Evidence: take two heap snapshots 30 minutes apart (`--heapsnapshot-signal=SIGUSR2` or DevTools via
  `--inspect`), use the "comparison" view; sort by retained size/delta. Finding: a `Map` named `requestCache`
  with key = full URL including query string and no eviction.
- Fix: bound the cache (LRU with max entries + TTL, see M4), or use Redis. Remove listeners/timers per
  request. Verify with a soak test: memory should plateau after warm-up.
- Common causes: unbounded Map/array, `emitter.on` in each request, `setInterval` never cleared,
  closures capturing `req`/`res`, large objects in global state, unclosed DB connections/streams.
- **Interview answer:** "I would distinguish heap growth from native memory growth using process.memoryUsage.
  For heap growth I take heap snapshots at two points in time and compare what grows, usually an unbounded
  cache, a listener leak, or retained closures. Short-term I add a restart policy and memory limit; the
  permanent fix is bounding the structure or moving it to Redis, then verifying with a soak test."

**Incident 3: Every endpoint stalls for seconds at random; CPU 100% on one core**

- Symptom: all routes slow together, health check timeouts, then it recovers.
- Triage: the event loop is blocked. Measure `monitorEventLoopDelay` p99; capture a CPU profile (`--cpu-prof` or
  the `--inspect` profiler) during the stall.
- Evidence: the profile shows `JSON.parse`/`JSON.stringify` of a 40 MB payload, or a regex with nested
  quantifiers on user input (ReDoS), or `bcrypt.hashSync`, or sync `fs` calls, or sorting 1M items.
- Fix: stream/paginate large payloads, limit body size (`express.json({ limit })`), replace the regex, use async
  bcrypt, move CPU work to worker threads or a queue, add per-request input limits.
- Prevention: event loop lag alert; an `eslint` rule against `*Sync` calls in request paths.

**Incident 4: "Timeout acquiring connection" / requests hang; DB has few active queries**

- Symptom: errors started after a new endpoint shipped; `SHOW PROCESSLIST` shows many `Sleep` connections;
  the pool is at max.
- Evidence: code uses `pool.getConnection()` and on an error path returns early without `release()`; or a
  transaction is opened and not committed/rolled back on exception.
- Fix: always `try/finally { conn.release() }`; prefer `pool.execute/query` for single statements (auto
  release); set `connectionLimit` based on `max_connections / number_of_app_instances`; set `queueLimit` and an
  acquire timeout so failures are fast; add pool metrics.
- Related: 10 pods x pool 20 = 200 connections > the MySQL default `max_connections` of 151 -> "Too many connections".
- Pattern to show:

```js
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  // work
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

**Incident 5: Customers charged twice**

- Symptom: support tickets; two `payments` rows seconds apart for the same order.
- Evidence: the client retried after a timeout (response lost although the server succeeded) or the user
  double-clicked; a load balancer retried a POST; no idempotency key; no unique constraint on the business key.
- Fix: idempotency key per payment attempt (see D52-6), a unique constraint on the business key, pass the key
  to the payment gateway, make the handler "check state then act" inside a transaction with a row lock.
  Reconcile with gateway reports; refund duplicates.
- Prevention: disable the button + client-generated key; retry only with the same key; alert on duplicate
  business keys.

**Incident 6: Spike of `ER_LOCK_DEADLOCK` (1213) errors under load**

- Evidence: `SHOW ENGINE INNODB STATUS` -> "LATEST DETECTED DEADLOCK" shows two transactions updating the same
  two rows in opposite order, or range scans taking gap locks because of a missing index.
- Fix: consistent lock order, shorter transactions, add an index so fewer rows are locked, a lower isolation level if
  acceptable (READ COMMITTED reduces gap locking), and **retry** the transaction on 1213 (bounded attempts).
- Not a fix: increasing the lock wait timeout (that is for `1205`, lock wait timeout, a different error).

**Incident 7: 502/connection reset errors during every deploy**

- Evidence: the process receives SIGTERM and exits immediately; in-flight requests are cut; the load balancer
  still routes to the old instance for a few seconds.
- Fix: graceful shutdown: on SIGTERM stop accepting new connections (`server.close()`), fail the readiness
  probe, finish in-flight requests, close the DB pool/Redis, then exit with a forced timeout (e.g. 10-25 s).
  From Node 19, `server.close()` also closes idle keep-alive connections; on Node 18 and older call
  `server.closeIdleConnections()` (18.2+) too.

```js
function shutdown(signal) {
  console.log(JSON.stringify({ msg: 'shutdown_start', signal }));
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 20_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**Incident 8: After a Redis restart, DB CPU spikes to 100% and the site is down (cache stampede)**

- Evidence: all hot keys expired/flushed at once; thousands of requests miss and hit the DB simultaneously.
- Fix: request coalescing (a single in-flight load per key, see `getOrLoad` in M4), randomized TTL jitter, a lock
  (`SET key NX PX`) so one worker refills, serve stale while revalidating, warm up critical keys, a circuit
  breaker/rate limit on the DB path, and treat Redis failure as degraded mode (fallback with limits), not an outage.

### Part C - More short scenarios (rapid-fire, answer in 30 seconds each)

1. "Works on my machine, 500 in production." -> compare env vars, Node version, DB schema/migrations,
   timezone/collation; read the logged stack trace; check a missing `NODE_ENV` and secrets.
2. "Browser shows a CORS error, Postman works." -> CORS is browser-enforced; fix the response headers; check that
   preflight `OPTIONS` is handled before auth middleware; check credentials mode.
3. "req.body is undefined." -> missing `express.json()`, wrong `Content-Type`, middleware order, or a GET.
4. "Server crashes with unhandled rejection." -> find the unawaited promise; in Express 4 async handlers need
   a wrapper; add `process.on('unhandledRejection')` for logging + exit (not to continue).
5. "Same user gets different results on refresh." -> multiple instances with in-memory state/session; move to a
   shared store; or replica lag reading stale data.
6. "Dates are off by hours." -> timezone mismatch between DB session, server, and client; store UTC.
7. "Upload of 200 MB crashes the server." -> memory storage; switch to streaming to disk/object storage, set limits.
8. "bcrypt login latency spikes when many users log in at once." -> thread pool saturation (4 threads); tune
   `UV_THREADPOOL_SIZE`, rate limit login, scale instances.

### Part D - Backend machine-coding (45 minutes each)

Format to follow in the interview: (1) 3 minutes clarify requirements and edge cases, (2) say the simplest
design, (3) code the core, (4) show 2-3 tests, (5) mention scaling/failure improvements. All examples ES modules.

#### Problem statements (attempt first)

**M1 Rate limiter.** Build `TokenBucket` (per-key, capacity, refill per second, injectable clock) and a
fixed-window Express middleware. Return `429` with `Retry-After`. Explain how to make it work across multiple
instances.

**M2 URL shortener service.** `create(longUrl, { ttlSec, customAlias })` returns a short code; `resolve(code)`
returns the long URL or null if missing/expired. Validate URLs (http/https only), handle code collisions,
reject duplicate custom aliases with 409. Add `GET /:code` redirect and `POST /shorten`.

**M3 Job queue.** In-memory `JobQueue` with a concurrency limit, retry with exponential backoff + jitter,
max attempts, a dead-letter callback, and an `onIdle()` promise.

**M4 LRU + TTL cache.** `get/set/delete`, max entries, per-entry TTL, injectable clock, and
`getOrLoad(key, loader)` that coalesces concurrent loads for the same key.

**M5 Task CRUD API.** Express 5 app factory `createApp({ repo, authenticate })` with `POST/GET/PATCH/DELETE
/tasks`, owner-scoped access, validation, a centralized error handler, and Supertest tests.

#### Solutions

**M1 solution**

```js
// rate-limit.js
export class TokenBucket {
  constructor({ capacity, refillPerSec, now = Date.now }) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.now = now;
    this.buckets = new Map();
  }

  take(key, cost = 1) {
    const t = this.now();
    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: this.capacity, last: t };
      this.buckets.set(key, b);
    }
    const elapsedSec = (t - b.last) / 1000;
    b.tokens = Math.min(this.capacity, b.tokens + elapsedSec * this.refillPerSec);
    b.last = t;

    if (b.tokens >= cost) {
      b.tokens -= cost;
      return { allowed: true, remaining: Math.floor(b.tokens), retryAfterMs: 0 };
    }
    const retryAfterMs = Math.ceil(((cost - b.tokens) / this.refillPerSec) * 1000);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  // Remove buckets that are full again (idle keys) so the Map does not grow forever.
  sweep() {
    const t = this.now();
    for (const [key, b] of this.buckets) {
      const tokens = b.tokens + ((t - b.last) / 1000) * this.refillPerSec;
      if (tokens >= this.capacity) this.buckets.delete(key);
    }
  }
}

export function fixedWindowLimiter({ windowMs, max, keyFn = (req) => req.ip, now = Date.now }) {
  const hits = new Map(); // key -> { count, resetAt }
  const timer = setInterval(() => {
    const t = now();
    for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
  }, windowMs);
  timer.unref();

  return (req, res, next) => {
    const t = now();
    const key = keyFn(req);
    let e = hits.get(key);
    if (!e || e.resetAt <= t) {
      e = { count: 0, resetAt: t + windowMs };
      hits.set(key, e);
    }
    e.count += 1;
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - e.count)));
    if (e.count > max) {
      res.set('Retry-After', String(Math.ceil((e.resetAt - t) / 1000)));
      return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
    }
    return next();
  };
}
```

Test with a fake clock:

```js
// rate-limit.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenBucket } from './rate-limit.js';

test('token bucket refills over time', () => {
  let t = 0;
  const tb = new TokenBucket({ capacity: 2, refillPerSec: 1, now: () => t });
  assert.equal(tb.take('u').allowed, true);
  assert.equal(tb.take('u').allowed, true);
  const denied = tb.take('u');
  assert.equal(denied.allowed, false);
  assert.equal(denied.retryAfterMs, 1000);
  t += 1000;
  assert.equal(tb.take('u').allowed, true);
});
```

Discussion points: a fixed window allows a burst of 2x at the window boundary (sliding window log/counter or
token bucket smooths this). In-memory state is per process; behind N instances each allows `max`, so use Redis.
Atomic Redis fixed window (a Lua script avoids the race between `INCR` and `PEXPIRE`):

```js
const LUA = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return c`;
// const count = await redis.eval(LUA, 1, `rl:${key}`, windowMs);
```

Configure `app.set('trust proxy', 1)` when behind one proxy, otherwise `req.ip` is the proxy's IP.
Complexity: O(1) per request, O(active keys) memory. Mistakes: using `Date.now()` directly (untestable), never
cleaning the Map, keying by IP only on login (also key by account), returning 403 instead of 429.

**M2 solution**

```js
// shortener.js
import { randomInt } from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const randomCode = (len = 7) =>
  Array.from({ length: len }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export class DuplicateError extends Error {
  code = 'DUP';
}

export class MemoryUrlRepo {
  #rows = new Map();
  async insert(row) {
    if (this.#rows.has(row.code)) throw new DuplicateError('duplicate code');
    this.#rows.set(row.code, row);
  }
  async find(code) {
    return this.#rows.get(code) ?? null;
  }
}

export class UrlShortener {
  constructor({ repo, now = Date.now, genCode = randomCode }) {
    this.repo = repo;
    this.now = now;
    this.genCode = genCode;
  }

  static validateUrl(raw) {
    if (typeof raw !== 'string' || raw.length > 2048) throw new RangeError('Invalid URL');
    let u;
    try {
      u = new URL(raw);
    } catch {
      throw new RangeError('Invalid URL');
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new RangeError('Only http/https allowed');
    return u.toString();
  }

  async create(longUrl, { ttlSec, customAlias } = {}) {
    const url = UrlShortener.validateUrl(longUrl);
    if (customAlias !== undefined && !/^[A-Za-z0-9_-]{3,32}$/.test(customAlias)) {
      throw new RangeError('Invalid alias');
    }
    const expiresAt = ttlSec ? this.now() + ttlSec * 1000 : null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = customAlias ?? this.genCode();
      try {
        await this.repo.insert({ code, longUrl: url, expiresAt, createdAt: this.now() });
        return { code, longUrl: url, expiresAt };
      } catch (err) {
        if (err.code !== 'DUP') throw err;
        if (customAlias !== undefined) {
          const e = new Error('Alias already taken');
          e.status = 409;
          throw e;
        }
        // random code collision: loop and try a new code
      }
    }
    throw new Error('Could not allocate a unique code');
  }

  async resolve(code) {
    const row = await this.repo.find(code);
    if (!row) return null;
    if (row.expiresAt !== null && row.expiresAt <= this.now()) return null;
    return row.longUrl;
  }
}
```

Routes:

```js
// shortener-app.js
import express from 'express';

export function createShortenerApp(service) {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

  app.post('/shorten', async (req, res) => {
    try {
      const out = await service.create(req.body?.url, {
        ttlSec: req.body?.ttlSec,
        customAlias: req.body?.alias,
      });
      res.status(201).json(out);
    } catch (err) {
      if (err instanceof RangeError) return res.status(400).json({ error: { message: err.message } });
      if (err.status === 409) return res.status(409).json({ error: { message: err.message } });
      throw err; // Express 5 forwards to the error handler
    }
  });

  app.get('/:code', async (req, res) => {
    const target = await service.resolve(req.params.code);
    if (!target) return res.status(404).json({ error: { message: 'Not found' } });
    res.redirect(302, target);
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: { message: 'Internal error' } });
  });
  return app;
}
```

Design notes: 62^7 = about 3.5 trillion codes; a collision is handled by retry on the unique constraint (the DB's
UNIQUE index is the real guard, not a "check first"). Use 302 (not 301) when you need expiry/analytics, since
browsers cache 301. Validate the scheme to avoid `javascript:` URLs and open redirect abuse; consider a block-list
for phishing. Scale: cache hot codes in Redis, read replicas, counter-based IDs encoded in base62 (needs a
distributed ID generator) as an alternative to random codes. Deep design: Week 7 / Day 3 notes.

**M3 solution**

```js
// job-queue.js
export class JobQueue {
  #queue = [];
  #running = 0;
  #waiting = 0; // jobs sleeping before a retry
  #seq = 0;
  #idleResolvers = [];

  constructor({ handler, concurrency = 2, maxAttempts = 3, baseDelayMs = 50, onDead = () => {} }) {
    this.handler = handler;
    this.concurrency = concurrency;
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
    this.onDead = onDead;
  }

  add(payload) {
    const job = { id: ++this.#seq, payload, attempts: 0 };
    this.#queue.push(job);
    this.#drain();
    return job.id;
  }

  #isIdle() {
    return this.#running === 0 && this.#waiting === 0 && this.#queue.length === 0;
  }

  #drain() {
    while (this.#running < this.concurrency && this.#queue.length > 0) {
      const job = this.#queue.shift();
      this.#running++;
      this.#execute(job).finally(() => {
        this.#running--;
        this.#drain();
        if (this.#isIdle()) {
          for (const resolve of this.#idleResolvers.splice(0)) resolve();
        }
      });
    }
  }

  async #execute(job) {
    try {
      await this.handler(job.payload, job);
    } catch (err) {
      job.attempts++;
      if (job.attempts >= this.maxAttempts) {
        try {
          this.onDead(job, err);
        } catch {
          // a failing dead-letter callback must not crash the queue
        }
        return;
      }
      const delay = Math.random() * this.baseDelayMs * 2 ** (job.attempts - 1);
      this.#waiting++;
      setTimeout(() => {
        this.#waiting--;
        this.#queue.push(job);
        this.#drain();
      }, delay);
    }
  }

  onIdle() {
    if (this.#isIdle()) return Promise.resolve();
    return new Promise((resolve) => this.#idleResolvers.push(resolve));
  }
}
```

Test:

```js
// job-queue.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { JobQueue } from './job-queue.js';

test('retries then succeeds; dead-letters after max attempts', async () => {
  const seen = new Map();
  const dead = [];
  const q = new JobQueue({
    concurrency: 2,
    maxAttempts: 3,
    baseDelayMs: 1,
    onDead: (job) => dead.push(job.payload),
    handler: async (p) => {
      const n = (seen.get(p) ?? 0) + 1;
      seen.set(p, n);
      if (p === 'flaky' && n < 3) throw new Error('try again');
      if (p === 'bad') throw new Error('always fails');
    },
  });
  q.add('flaky');
  q.add('bad');
  await q.onIdle();
  assert.equal(seen.get('flaky'), 3);
  assert.equal(seen.get('bad'), 3);
  assert.deepEqual(dead, ['bad']);
});
```

Discussion: in-memory queues lose jobs on a crash; production uses a durable queue (Redis-backed BullMQ, SQS,
RabbitMQ) with at-least-once delivery, so handlers must be idempotent. Visibility timeout, poison messages,
dead-letter queue, graceful shutdown (stop taking jobs, finish running ones). Week 6 / Day 5 and Week 7 / Day 5 notes.

**M4 solution**

```js
// lru-ttl-cache.js
export class LruTtlCache {
  #map = new Map(); // insertion order = recency order (oldest first)
  #inflight = new Map();

  constructor({ max, ttlMs, now = Date.now }) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.now = now;
  }

  get size() {
    return this.#map.size;
  }

  get(key) {
    const entry = this.#map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.#map.delete(key);
      return undefined;
    }
    this.#map.delete(key); // refresh recency
    this.#map.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    this.#map.delete(key);
    this.#map.set(key, { value, expiresAt: this.now() + ttlMs });
    if (this.#map.size > this.max) {
      const oldestKey = this.#map.keys().next().value;
      this.#map.delete(oldestKey);
    }
  }

  delete(key) {
    return this.#map.delete(key);
  }

  async getOrLoad(key, loader) {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    let pending = this.#inflight.get(key);
    if (!pending) {
      pending = loader()
        .then((value) => {
          this.set(key, value);
          return value;
        })
        .finally(() => this.#inflight.delete(key));
      this.#inflight.set(key, pending);
    }
    return pending;
  }
}
```

Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { LruTtlCache } from './lru-ttl-cache.js';

test('evicts least recently used and expires by ttl', () => {
  let t = 0;
  const c = new LruTtlCache({ max: 2, ttlMs: 100, now: () => t });
  c.set('a', 1);
  c.set('b', 2);
  c.get('a'); // a is now most recent
  c.set('c', 3); // evicts b
  assert.equal(c.get('b'), undefined);
  assert.equal(c.get('a'), 1);
  t += 101;
  assert.equal(c.get('a'), undefined);
});

test('getOrLoad coalesces concurrent loads', async () => {
  const c = new LruTtlCache({ max: 10, ttlMs: 1000 });
  let calls = 0;
  const loader = async () => { calls++; return 'v'; };
  const [x, y] = await Promise.all([c.getOrLoad('k', loader), c.getOrLoad('k', loader)]);
  assert.equal(x, 'v');
  assert.equal(y, 'v');
  assert.equal(calls, 1);
});
```

Complexity: get/set O(1) average. Limitations: `undefined` cannot be cached as a value (use a sentinel);
failed loads are not cached (good) but are shared by concurrent callers; expired entries are removed lazily
(add a sweep if memory matters). This is exactly the structure that Incident 2 and Incident 8 call for.

**M5 solution**

```js
// tasks-app.js
import express from 'express';

export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const STATUSES = ['todo', 'in_progress', 'done'];

function validateTask(body, { partial }) {
  const errors = [];
  const out = {};
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.length > 200) {
      errors.push({ field: 'title', message: 'title must be a string of 1-200 chars' });
    } else out.title = body.title.trim();
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) errors.push({ field: 'status', message: `status must be one of ${STATUSES.join(', ')}` });
    else out.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!Number.isInteger(body.priority) || body.priority < 1 || body.priority > 5) {
      errors.push({ field: 'priority', message: 'priority must be an integer 1-5' });
    } else out.priority = body.priority;
  }
  if (errors.length) throw new AppError(422, 'VALIDATION_FAILED', 'Invalid input', errors);
  return out; // unknown fields (e.g. ownerId, role) are dropped: no mass assignment
}

export class MemoryTaskRepo {
  #rows = new Map();
  #seq = 0;
  async create(data) {
    const row = { id: ++this.#seq, status: 'todo', priority: 3, ...data };
    this.#rows.set(row.id, row);
    return { ...row };
  }
  async find(id) {
    const r = this.#rows.get(id);
    return r ? { ...r } : null;
  }
  async list({ ownerId, status, page, limit }) {
    let rows = [...this.#rows.values()].filter((r) => r.ownerId === ownerId);
    if (status) rows = rows.filter((r) => r.status === status);
    const total = rows.length;
    return { total, rows: rows.slice((page - 1) * limit, page * limit).map((r) => ({ ...r })) };
  }
  async update(id, patch) {
    const r = this.#rows.get(id);
    Object.assign(r, patch);
    return { ...r };
  }
  async remove(id) {
    this.#rows.delete(id);
  }
}

export function createApp({ repo, authenticate }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  const router = express.Router();
  router.use(authenticate);

  const parseId = (raw) => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) throw new AppError(400, 'BAD_ID', 'Invalid id');
    return id;
  };

  const loadOwned = async (req) => {
    const task = await repo.find(parseId(req.params.id));
    // 404 for both "missing" and "not yours": do not leak existence
    if (!task || task.ownerId !== req.user.id) throw new AppError(404, 'NOT_FOUND', 'Task not found');
    return task;
  };

  router.post('/', async (req, res) => {
    const data = validateTask(req.body ?? {}, { partial: false });
    const task = await repo.create({ ...data, ownerId: req.user.id });
    res.status(201).location(`/tasks/${task.id}`).json(task);
  });

  router.get('/', async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const status = STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const { total, rows } = await repo.list({ ownerId: req.user.id, status, page, limit });
    res.json({ data: rows, page, limit, total });
  });

  router.get('/:id', async (req, res) => res.json(await loadOwned(req)));

  router.patch('/:id', async (req, res) => {
    const task = await loadOwned(req);
    const patch = validateTask(req.body ?? {}, { partial: true });
    res.json(await repo.update(task.id, patch));
  });

  router.delete('/:id', async (req, res) => {
    const task = await loadOwned(req);
    await repo.remove(task.id);
    res.status(204).end();
  });

  app.use('/tasks', router);

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Centralized error handler (4 args, registered last)
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err instanceof AppError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON body' } });
    }
    console.error(JSON.stringify({ msg: 'unhandled_error', message: err.message, stack: err.stack }));
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  });

  return app;
}
```

Test (Supertest + node:test; `npm i -D supertest`):

```js
// tasks-app.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp, MemoryTaskRepo } from './tasks-app.js';

// Test double for authentication: user id comes from a header. The real app uses the JWT middleware.
const fakeAuth = (req, res, next) => {
  const id = Number(req.get('x-test-user'));
  if (!id) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  req.user = { id, role: 'member' };
  next();
};

const makeApp = () => createApp({ repo: new MemoryTaskRepo(), authenticate: fakeAuth });

test('rejects unauthenticated requests', async () => {
  await request(makeApp()).get('/tasks').expect(401);
});

test('creates a task and validates input', async () => {
  const app = makeApp();
  const ok = await request(app).post('/tasks').set('x-test-user', '1').send({ title: 'Write docs', ownerId: 99 }).expect(201);
  assert.equal(ok.body.ownerId, 1); // mass-assignment attempt ignored
  const bad = await request(app).post('/tasks').set('x-test-user', '1').send({ title: '' }).expect(422);
  assert.equal(bad.body.error.code, 'VALIDATION_FAILED');
});

test('user cannot read another user task (404)', async () => {
  const app = makeApp();
  const created = await request(app).post('/tasks').set('x-test-user', '1').send({ title: 'Secret' }).expect(201);
  await request(app).get(`/tasks/${created.body.id}`).set('x-test-user', '2').expect(404);
});

test('malformed JSON returns 400', async () => {
  await request(makeApp()).post('/tasks').set('x-test-user', '1').set('Content-Type', 'application/json').send('{bad').expect(400);
});
```

Interview points: a factory function (`createApp`) makes the app testable without opening a port; dependency
injection of repo/auth; error handler shape; 404 for not-owned; validation strips unknown fields; Express 5
forwards async errors. In Express 4 you would wrap handlers or call `next(err)`. This maps to the project
Stages 2, 4, 6 in 12_Project_Task_API.md.

### Common mistakes (this day)

- Jumping to "add Redis" or "scale up" before measuring where the time goes.
- Fixing symptoms (restart) without a root-cause plan; not capturing evidence (heap snapshot, EXPLAIN) before restarting.
- In machine coding: coding for 40 minutes without tests; no edge cases (empty input, expired TTL,
  duplicates); not stating complexity; hard-coding `Date.now()` and `Math.random()`, which makes code untestable.
- Treating in-memory solutions as production-ready without naming the multi-instance/crash limitations.

### Revision notes

- Incident template: scope -> mitigate -> signals -> layer -> hypothesis+evidence -> fix -> prevention.
- Five classics: missing index/N+1, leak, blocked loop, pool leak, duplicate side effects.
- Machine coding: injectable clock, small API, tests for edge cases, honest limitations.

### Key concepts to remember

1. Mitigate first, root-cause second; always capture evidence.
2. Compare two heap snapshots to find what grows.
3. `try/finally release()` for every pooled connection.
4. Deadlock = retry + consistent lock order; lock wait timeout is a different error.
5. Graceful shutdown: stop accepting, drain, close resources, forced timeout.

### Five revision questions

1. Heap snapshot vs CPU profile: which problem does each diagnose?
2. How can total pool size across instances break MySQL, and how do you calculate a safe pool size?
3. Why can a retry cause a double charge, and what are three layers of protection?
4. What is a cache stampede and how many mitigations can you list?
5. What does `Using filesort` suggest and what does `type: ALL` suggest?

### Practical coding task (45 min, timed)

Without looking at the solutions, implement M4 (LRU + TTL with `getOrLoad`), including the two tests. Then
compare. Note which edge cases you missed (TTL refresh on get? tie between expiry and eviction? error in the loader?).

### Self-assessment checklist

- [ ] I can run the 6-step incident framework aloud for any symptom.
- [ ] I completed at least 3 of 5 machine-coding problems within 45 minutes each.
- [ ] I wrote tests with an injected clock instead of real timers.
- [ ] I can explain at least 6 causes of memory leaks and 4 causes of a blocked event loop.
- [ ] I can write the pool `try/catch/finally` pattern from memory.

---

## Day 54 (W8 D5) - System design revision + project explanation + follow-up chains

**Learning objectives**

- Week 7 ke system design framework ko 5 minute mein recall karna aur 6 standard designs ka one-page skeleton bolna.
- Task Management API project ko 2 minute pitch mein explain karna aur 16 project questions ke model answers bolna.
- Interviewer ke follow-up chains ko predict karke "why" ladder pe comfortable hona.
- "Mujhe nahi pata" ko bhi professionally handle karna.

### Part A - System design revision `[ESSENTIAL]`

**The 8-step framework (say this out loud at the start of every design question)**

1. **Clarify requirements**: functional (what), non-functional (scale, latency, availability, consistency).
2. **Estimate**: requests per second (RPS), read/write ratio, storage per year. Rough numbers are fine.
3. **API**: 3-5 endpoints with method, path, request, response, status codes.
4. **Data model**: tables/collections, keys, indexes, important constraints.
5. **Simplest working design**: one app + one DB. Make it correct first.
6. **Data flow**: walk through the main request step by step.
7. **Bottlenecks and scaling**: only add components that solve a measured/estimated problem
   (cache, replicas, queue, CDN, sharding).
8. **Failure scenarios and trade-offs**: what if the DB/Redis/third party is down, duplicate requests, retries,
   data loss, consistency choice.

**Scaling ladder (add in this order, justify each step)**

1. Fix queries and indexes. 2. Connection pooling. 3. Cache hot reads (Redis). 4. Horizontal scale of the app
(stateless, load balancer). 5. Read replicas (replication lag!). 6. Queue for slow/async work. 7. CDN/object
storage for static and large files. 8. Partition/shard data. 9. Split services only for team/scale reasons.

**Back-of-envelope numbers to remember**

- 1M requests/day is about 12 RPS average; peak 5-10x. 100M/day is about 1,150 RPS average.
- One Node process on one core: roughly 1-5k simple RPS; DB-backed APIs far less, typically bound by the DB.
- Read-heavy ratio (100:1) -> cache + replicas. Write-heavy -> batching, queues, partitioning.
- A single MySQL node comfortably handles low thousands of simple QPS with good indexes; the connection count is
  usually the first hard limit.

**Six design skeletons** (full versions: Week 7 / Day 1-6 notes)

| Design | Core idea | Key data | Main trade-off / failure |
|--------|-----------|----------|--------------------------|
| Rate limiter | Token bucket or sliding window per key at gateway/middleware; Redis counters with atomic Lua | `rl:{key}` counter with TTL | Redis down: fail-open vs fail-closed; boundary burst; accuracy vs cost |
| URL shortener | Random/base62 code + unique index; cache reads; 302 redirect | `urls(code PK, long_url, expires_at, created_at)` | Collisions, hot keys, 301 vs 302, abuse/phishing, analytics via async queue |
| Notification system | API -> queue -> workers per channel (email/SMS/push); templates, preferences, dedupe | `notifications`, `user_prefs`, delivery log | At-least-once -> duplicates; provider limits/retries; DLQ; ordering not guaranteed |
| File upload | Client uploads directly to object storage via a pre-signed URL; API stores metadata; async scan/process | `files(id, owner, key, size, status)` | Large files through the API server block resources; orphan cleanup; virus scanning; access control on download |
| Payment workflow | State machine (created -> authorized -> captured/failed/refunded), idempotency keys, webhook + reconciliation | `payments`, `ledger` (append-only), `idempotency_keys`, `webhook_events` | Exactly-once is impossible; use at-least-once + idempotent consumers; never lose money state; a timeout means "unknown" state |
| Task management API scaled up | Stateless Node behind LB, MySQL primary + replica, Redis cache for lists, queue for emails/reports | per project schema | Cache invalidation, replica lag, pool limits across instances |

**Monolith vs microservices (the answer interviewers want)**

Start with a **modular monolith**: one deployable, clear module boundaries, one database. Split a service out
only when there is a real reason: an independent scaling profile (image processing), a different release cadence
or team ownership, fault isolation, or different tech needs. Costs of microservices: network failures,
distributed transactions (use sagas/outbox, eventual consistency), observability, deployment complexity.

**Consistency, quickly**

- Strong consistency: reads see the latest write (single primary, transactions). Eventual: replicas/caches
  catch up later. Choose per feature: balance = strong; "likes count" = eventual.
- Outbox pattern: write the business row and an `outbox` event row in one DB transaction; a relay publishes the
  event. Avoids "DB committed but message lost".
- Saga: a sequence of local transactions with compensating actions (refund, release stock).

**Observability trio**

Logs (structured JSON + request id), metrics (RPS, error rate, latency percentiles, saturation), traces
(request across services). Alert on symptoms (error rate, p99), not only causes (CPU).

### Design speaking drill (10 minutes)

Pick "design a notification system". Speak the 8 steps in 6 minutes without notes; then compare with Week 7
/ Day 2 notes. Repeat for the URL shortener the next time.

**Interview answer (when to add a cache):** "I add a cache when I have evidence that reads are repetitive and
the database is the bottleneck, for example a hot list endpoint with a 95 percent read ratio. I use
cache-aside with Redis: read the cache, on a miss load from the database and set with a TTL. The hard part
is invalidation, so I prefer short TTLs plus explicit deletion of affected keys on writes, and I protect
against stampedes with request coalescing or a lock."

**Interview answer (exactly-once):** "In distributed systems I assume at-least-once delivery and make
consumers idempotent. I use an idempotency key or a unique constraint on the business identifier so that
processing the same message twice has the same effect as processing it once."

### Part B - Project explanation: Task Management API

Reference: 12_Project_Task_API.md (Stages 1-7, Extensions A-D). The answers below assume the project follows
that document: Node.js 22, Express 5, MySQL 8 via `mysql2/promise`, JWT access + refresh tokens, RBAC
(`admin`, `member`), validation, centralized error handling, pagination/filtering/sorting, transactions, tests
(Jest or Vitest + Supertest), structured logging, helmet/CORS/rate limiting. If your actual column or route
names differ, adapt the specifics; keep the reasoning.

**Rules for talking about your project**

- Be honest about what you built and learned. If you used AI help, say you used it as a pair programmer and
  that you can explain and modify every part. You WILL be asked to change code or explain a line; be ready.
- Structure: problem -> architecture -> one hard decision -> one bug/trade-off -> what you would improve.
- Know your numbers: how many endpoints, tables, tests; what you did NOT build (do not claim scale you did not test).

**The 2-minute pitch (practice aloud)**

**Interview answer:** "I built a Task Management REST API to learn production backend practices. It uses
Node.js with Express and MySQL. Users sign up and log in; passwords are hashed with bcrypt and sessions use a
short-lived JWT access token plus a rotating refresh token. There are two roles, admin and member, enforced in
middleware, and members can only access their own or assigned tasks, which I check in the service layer.
The code is layered as routes, controllers, services, and repositories, with all SQL parameterized. I added
request validation, a centralized error handler with a consistent error shape, pagination, filtering and
whitelisted sorting, and transactions where multiple writes must succeed together, like reassigning a task
and writing an activity log. I covered it with unit tests for services and Supertest integration tests,
including negative cases for authentication and authorization, and I added structured logging with request
IDs, helmet, CORS, and rate limiting. As an extension I looked at Redis caching and background jobs. The
biggest thing I learned was how much of backend quality is in the error paths: validation, authorization,
and concurrency."

**P-01. Walk me through the architecture.** Basic

Answer: "A request flows through middleware first: request id, logger, helmet, CORS, rate limiter, JSON parser.
Then the router maps to a controller, which only parses input and shapes the response. The controller calls a
service that contains business rules, authorization decisions like ownership, and transactions. The service
calls a repository, the only layer that writes SQL, using a mysql2 connection pool. Errors thrown anywhere
go to a single error-handling middleware that maps them to status codes and a consistent JSON body."
Follow-up: "Why separate service and repository?" -> "Business logic is testable without HTTP or a database
by faking the repository, and SQL changes stay in one place."

**P-02. Why MySQL and not MongoDB?** Basic

Answer: "Tasks, users, projects, and comments are naturally relational, I need foreign keys, transactions
across tables, and flexible filtering and sorting with joins. MongoDB would work, but I would be re-implementing
relational guarantees in application code. I would choose Mongo for document-shaped, read-as-a-unit data
with a flexible schema."

**P-03. Show me your schema and explain the indexes.** Intermediate

Answer: "Core tables are users, tasks, comments, refresh_tokens, and an activity or audit table. tasks has
owner_id and assignee_id foreign keys to users, a status enum, priority, due date, and timestamps. The main
list query filters by owner and status and sorts by created_at, so I created a composite index on
(owner_id, status, created_at); equality columns first, then the sort column, so MySQL can avoid a filesort.
I verified it with EXPLAIN. I store a hash of refresh tokens, not the token itself, with an expiry and a revoked flag."
Follow-up: "What if you also filter by assignee?" -> "Another index (assignee_id, status, created_at), because the
leftmost-prefix rule means the first one cannot serve assignee filters; I would check the write overhead before adding more."

**P-04. How does authentication work end to end?** Intermediate

Answer: "On signup I validate input, hash the password with bcrypt, and rely on the unique email constraint to
detect duplicates. On login I look up the user by email, compare with bcrypt, and return the same error for
an unknown user or a wrong password. I issue an access token valid for about 15 minutes, containing user id and role,
signed with HS256 from an environment secret, and a refresh token that is random, stored hashed in the DB,
and delivered in an HttpOnly cookie. The auth middleware verifies the signature, expiry, and issuer with a
pinned algorithm and sets req.user. On refresh I rotate: invalidate the old refresh token and issue a new one,
and if an old one is reused I revoke the family."

**P-05. How do you implement authorization?** Intermediate

Answer: "Two levels. Role checks in route middleware, for example only admin can list all users. Then
resource-level checks in the service: a member can access a task only if they own it or are assigned. I put
the ownership condition inside the query, like WHERE id = ? AND (owner_id = ? OR assignee_id = ?), and return
404 when no row matches so I do not leak existence. I have negative tests where user B requests user A's task."

**P-06. Where did you use transactions, and why?** Intermediate

Answer: "Anywhere two or more writes must be atomic. For example, reassigning a task updates tasks.assignee_id
and inserts an activity row; if the second insert fails, the first must roll back. I get a connection from
the pool, begin, run the statements, commit, roll back in catch, and release in finally. I keep transactions
short and never call external services inside them."
Follow-up: "What about two users updating the same task at once?" -> "I add a version column for optimistic
locking: UPDATE ... SET ..., version = version + 1 WHERE id = ? AND version = ?; if affectedRows is 0 I
return 409 and the client refetches. For counters or stock-like fields I use atomic updates or SELECT FOR UPDATE."

**P-07. How do you validate input and why?** Basic

Answer: "At the edge, with a schema validator, before any business logic. It checks types, lengths, enums,
and ranges, coerces query params, and strips unknown fields, which blocks mass assignment such as a client
sending role or ownerId. Failures return 422 (or 400, consistently) with field-level details. Validation
protects the database and the logic, but the real SQL injection defence is parameterized queries, not validation."

**P-08. Describe your error handling.** Intermediate

Answer: "I use custom error classes such as AppError with status, code, and message. Services throw them;
controllers do not try/catch everything. Express 5 forwards rejected promises from async handlers to the
error middleware, which maps known errors to their status and anything unexpected to a generic 500 while logging the
stack with the request id. Clients never see stack traces or SQL errors. Specific cases, like body parser
errors and MySQL duplicate entry errors, are translated into 400 and 409."

**P-09. How did you implement pagination, filtering, and sorting?** Intermediate

Answer: "Query params page and limit with a maximum limit of 100, status and assignee filters, and a
whitelisted sort map so that column names never come from user input. The response includes data plus
page, limit, and total. I know offset pagination gets slow for deep pages because MySQL scans and discards rows,
so for a feed-like endpoint I would use keyset pagination on (created_at, id) with a matching index."

**P-10. What did you test and how?** Intermediate

Answer: "Unit tests for services with a fake repository, covering business rules and error cases.
Integration tests with Supertest against the real Express app and a test MySQL database, reset between
tests with transactions or truncation. I focus on the contract: status codes, response shape, validation
errors, auth failures (no token, expired token, wrong role), ownership checks, pagination bounds, and
duplicate handling. I mock only external boundaries such as email, not the database in integration tests."
Follow-up: "What do you not test?" -> "Third-party libraries and trivial getters; and I know I have not load
tested beyond a basic autocannon run, so I would not make performance claims."

**P-11. How do you handle security in the API?** Intermediate

Answer: "helmet for security headers, a CORS allowlist, a JSON body size limit, rate limiting with stricter
limits on login, bcrypt hashing, JWT verification with a pinned algorithm, parameterized queries, whitelisted
sort fields, input validation with unknown fields stripped, generic auth error messages, secrets from
environment variables, and `npm audit` plus a lockfile. In production I would run behind HTTPS with trust proxy
configured correctly and run the container as a non-root user."

**P-12. How do you log and debug issues?** Intermediate

Answer: "Structured JSON logs (pino style) with a request id generated or read from X-Request-Id at the first
middleware and attached to every log line and the response header. I log method, path, status, duration, and
user id, but never passwords, tokens, or full bodies. Errors are logged once at the error handler with
the stack. That lets me trace one failing request across logs."

**P-13. How would you scale this API?** Advanced

Answer: "First measure. The app is stateless because auth is token-based, so I can run multiple instances
behind a load balancer. The first bottleneck is the database, so I verify indexes with EXPLAIN and size the
connection pool so instances times pool size stays below max_connections. Then I cache hot read endpoints
in Redis with cache-aside and invalidate on writes, move slow work like emails and reports to a queue with workers,
and add read replicas if reads dominate, accepting replica lag for non-critical reads. I would keep it
a modular monolith until a clear reason justified splitting."

**P-14. Tell me about a bug or hard problem you faced.** Intermediate (behavioral + technical)

Pick one real one; use this shape. Example: "My integration tests passed individually but failed together
because tests shared database state. I reproduced it by running the suite in random order, found tests relied
on rows from earlier tests, and fixed it by resetting tables in beforeEach and creating fixtures inside each
test. It taught me that tests must be independent and that flaky tests hide real bugs." (Alternatives: a pool
connection not released on an error path; Express body parser order; a refresh-token rotation race.)

**P-15. What would you do differently or improve next?** Basic

Answer: "Add refresh-token reuse detection if not complete, keyset pagination on the busiest list, Redis
caching with explicit invalidation, a background job for notifications with retries, an OpenAPI spec generated
from the validation schemas, CI running tests and lint, and Docker for a reproducible deployment. I would also
add metrics for latency and error rate."

**P-16. Did you write this yourself? Did you use AI?** Basic (honesty)

Answer: "I followed a structured plan and used AI as a mentor and pair programmer to learn faster. I wrote and
ran the code, made the design decisions, and I can walk through any file and modify it live. For example, I
can explain why the ownership check lives in the query, or how the transaction handles rollback." Then be
ready for a live change: add a field, add a filter, explain a test. If you cannot explain a part, do not
claim it; say you know the concept but did not implement it.

### Part C - Common interviewer follow-up chains (rapid reference)

A follow-up chain is the interviewer drilling from a surface answer to the underlying mechanism. The pattern:
**What -> Why -> What breaks -> How do you detect -> How do you fix.** Practice finishing each level in
one or two sentences.

**Chain 1: Promises** What is a promise? -> How does `.then` chaining pass values? -> What if I forget to return
inside `.then`? (the next handler gets undefined, ordering breaks) -> Difference between `Promise.all` and
`allSettled`? -> What happens to the other promises when one rejects in `all`? (they keep running)

**Chain 2: Express** What is middleware? -> Order of execution? -> What if I forget `next()`? (the request hangs)
-> How does the error handler know it is one? (4 params) -> What about async errors in Express 4 vs 5?

**Chain 3: Indexing** What is an index? -> Why is a B-tree fast? -> Cost of indexes? (writes, space) ->
Composite index order? -> Why did the optimizer ignore my index? (low selectivity, function on column, type
mismatch, stale statistics, small table) -> How do you verify? (EXPLAIN)

**Chain 4: Transactions** ACID? -> Isolation levels? -> Default in MySQL? -> Lost update example and fix? ->
Deadlock cause and handling? -> Why not hold a transaction open during an API call?

**Chain 5: Auth** Hash vs encrypt? -> bcrypt cost? -> JWT structure? -> Where to store tokens? -> Revoke a JWT? ->
Session vs JWT trade-offs? -> What if the secret leaks?

**Chain 6: Caching** What do you cache? -> Cache-aside flow? -> Invalidation strategies? -> Stampede? -> What if
Redis is down? -> How do you know the cache helps? (hit ratio, latency before/after)

**Chain 7: Microservices** Why microservices? -> Costs? -> How do services communicate? (sync HTTP vs async
events) -> Data consistency across services? (saga, outbox, eventual) -> How do you debug a request across
services? (correlation id, tracing)

**Chain 8: Scalability** The app is slow under load -> where do you look first? -> single instance limits? ->
state in memory problems? -> sticky sessions? -> DB bottleneck options? -> replica lag consequences?

**Chain 9: Node internals** Is Node single-threaded? -> What is libuv? -> What uses the thread pool? -> How do
you handle CPU-heavy work? -> Worker threads vs cluster? -> How do you detect event loop blocking?

**Chain 10: Payments** Why is POST risky on retry? -> Idempotency key design? -> What if the gateway times out?
(status unknown: query the gateway, reconcile, do not blindly retry the charge) -> Webhooks arrive twice or out of
order? -> How do you store money? (integer minor units, DECIMAL)

### How to handle "I don't know" (a skill worth practicing)

1. Say what you do know about the area ("I have not used Kafka, but I understand queues as ...").
2. Reason from first principles out loud ("Given at-least-once delivery I would make the consumer idempotent...").
3. State how you would find out ("I would check the docs for X and verify with a small experiment").
4. Never bluff about something you listed on your CV; interviewers probe the edges deliberately.

**Interview answer (when asked about unfamiliar tech):** "I haven't used that in production. The closest I've
worked with is Redis-based queues, and from that I understand the delivery guarantees and retry semantics. I
would read the documentation, build a small prototype to verify the behavior, and bring in the team's experience
before making a design decision."

### Common mistakes (this day)

- Starting system design with microservices, Kafka, and sharding before a simple working version.
- Not asking clarifying questions or giving numbers; designing without requirements.
- Claiming exactly-once delivery, or "no downtime" without failure handling.
- Project answers that list technologies but cannot explain a single decision or trade-off.
- Over-claiming: saying the project "handles millions of users" when it was never load tested.

### Revision notes

- 8-step design framework, scaling ladder, modular monolith first.
- Project: pitch + 16 answers; each includes one decision, one trade-off, one limitation.
- Chain pattern: what -> why -> what breaks -> detect -> fix.

### Key concepts to remember

1. Simplest working design first; add components only for stated problems.
2. At-least-once + idempotency beats chasing exactly-once.
3. Outbox and saga solve cross-system consistency without distributed transactions.
4. Project answers must show decisions, not feature lists.
5. Honesty about limitations is a strength in interviews.

### Five revision questions

1. Walk through a design for a URL shortener from requirements to scaling in 6 minutes.
2. How do you decide between cache-aside and write-through?
3. Why can a payment API never promise exactly-once, and what do you do instead?
4. Explain how your Task API prevents a member from seeing another member's task.
5. What would you change in your Task API if traffic grew 50x?

### Practical coding task (30 min)

Add optimistic locking to your Task API's `PATCH /tasks/:id`: add `version INT NOT NULL DEFAULT 0`, accept
`version` in the request, update with `WHERE id = ? AND version = ?`, return 409 when `affectedRows` is 0, and
write one Supertest test that simulates two clients updating the same task.

### Self-assessment checklist

- [ ] I can give the project pitch in under 2 minutes without notes.
- [ ] I can answer at least 12 of 16 project questions without reading.
- [ ] I can design 3 of the 6 skeleton systems from memory using the 8 steps.
- [ ] I can name the limitations of my project honestly.
- [ ] I practiced the "I don't know" template at least once aloud.

---

## Day 55 (W8 D6) - Mock interview sets 1-2

**Learning objectives**

- Real interview ki tarah timed, mixed-round mock dena (JS/Node, Express/DB, security, system design,
  behavioral, live coding).
- Apne answers ko rubric se score karna aur weak areas identify karna.
- Model answers se sirf compare karna: pehle bolo, phir dekho. Model answer ko ratta mat maaro;
  apne words mein bolo.
- Do mocks ke beech 10 min break; end mein review aur notes.

### How to run a mock (solo)

1. Phone ka timer + voice recorder on. Question ko padho, 20 seconds sochne do, phir bolo (loud).
2. Interviewer ka role kisi dost se karwa sako to best; warna question ko screen par dekho aur bolo.
3. Coding portion: editor mein, no autocomplete AI, no docs, console.log allowed.
4. Answer ke baad "Hit" checklist se score karo. Honestly. Half-hit = 0.5 point allowed nahi; ya to bola ya nahi bola.
5. Har mock ke baad 3 weak topics likho aur Day 56 ke liye mark karo.

### Shared scoring rubric (used by all four sets)

Per question score 0-4 = number of "Hit" checkpoints you clearly stated (the list under each model answer).
Additional communication score per round (0-4): structure (answer first, then reasons), clarity, correct
terminology, and whether you volunteered a trade-off or an example.

| Round score vs maximum | Meaning |
|------------------------|---------|
| 85%+ | Strong for the target level; fine-tune delivery |
| 70-84% | Interview-ready for junior; polish weak spots |
| 55-69% | Borderline; revise those areas this week |
| below 55% | Not ready for that round; re-study the related Week notes before applying |

Overall set result: total points / maximum. For a junior role aim for 70%+ on Sets 1-2 and 60%+ on Sets 3-4.
Mid-level roles need 70%+ on Sets 3-4 AND real project/work depth (see the readiness assessment on Day 56).

Instant red flags (note them even if the score is high): bluffing, saying "Node is multithreaded" without
nuance, string-concatenated SQL, plain-text/MD5 passwords, "I would use microservices" as the first design
move, no mention of failure cases in design, blaming others in behavioral answers.

---

### MOCK SET 1 -- Fundamentals baseline (45 minutes, junior bar)

Time plan: Round A 10 min, Round B 10 min, Round C 5 min, Round D 10 min, Round E 5 min, Live coding 5 min.

#### Round A -- JavaScript / Node (10 min)

**1A-1. Explain the event loop as you would to a teammate.**

Model answer: "JavaScript runs on one thread with a call stack. Asynchronous work such as timers, network and
file operations is handled outside the stack, by the browser or, in Node, by libuv using the operating system
or a thread pool. When it completes, a callback is placed in a queue. When the stack is empty, the event loop
moves callbacks onto the stack. Microtasks, meaning promise callbacks and nextTick in Node, run before the
next macrotask such as a timer or I/O callback. The consequence is that long synchronous code blocks
everything, so CPU-heavy work must be offloaded."
Hit: (1) single thread + call stack; (2) queues/libuv handle async; (3) microtasks before macrotasks;
(4) blocking consequence.

**1A-2. What is the output?**

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
```

Model answer: "1, 4, 3, 2. The synchronous logs run first, then the promise microtask, then the timer
macrotask."
Hit: (1) correct order; (2) mentions microtask vs macrotask; (3) sync first; (4) can restate the rule.

**1A-3. What is a closure? Give a practical backend example.**

Model answer: "A closure is a function together with the variables from the scope where it was defined; it keeps
access to them after the outer function has returned. A practical example is a counter factory or a rate
limiter that creates a private Map of request counts per key and returns the middleware function that uses it."

```js
export function makeCounter() {
  let count = 0;
  return () => ++count;
}
```

Hit: (1) definition; (2) outlives the outer scope; (3) real example; (4) mention of private state or the loop/var pitfall.

**1A-4. How do you handle errors with async/await, and what happens to an unhandled promise rejection in current Node?**

Model answer: "I wrap awaits in try/catch where I can handle or translate the error, otherwise I let it propagate to
a central handler. A rejected promise with no handler is an unhandled rejection; since Node 15 the default
behaviour is to throw and terminate the process, so I make sure every promise is awaited or has a catch. In
Express 5 rejected async handlers are forwarded to the error middleware automatically; in Express 4 I need
a wrapper or next(err)."
Hit: (1) try/catch; (2) propagation; (3) Node crash default; (4) Express version note.

#### Round B -- Express / Databases (10 min)

**1B-1. What is middleware in Express and why does order matter?**

Model answer: "Middleware is a function with request, response, and next that runs in the request pipeline. It
can modify the request or response, end the response, or pass control with next. Order matters because they
execute in registration order: the JSON body parser must come before routes that read req.body, authentication
before protected routes, and the error handler last."
Hit: (1) signature with next; (2) executes sequentially; (3) example of order dependency; (4) error handler last with 4 args.

**1B-2. Which HTTP methods and status codes would you use for creating, fully updating, partially updating, and deleting a task? What about duplicates and validation errors?**

Model answer: "POST /tasks returns 201 with a Location header. PUT /tasks/:id replaces the resource and returns 200.
PATCH changes some fields and returns 200. DELETE returns 204. A duplicate of a unique value returns 409
Conflict. Invalid input returns 400 or 422 with field-level details. Missing resources are 404, missing authentication
is 401, and lack of permission is 403."
Hit: (1) 201 for create; (2) PUT vs PATCH difference; (3) 409 duplicate; (4) 401 vs 403 / validation code.

**1B-3. Explain INNER JOIN and LEFT JOIN. Write a query for users with their number of tasks, including users with none.**

```sql
SELECT u.id, u.email, COUNT(t.id) AS task_count
FROM users u
LEFT JOIN tasks t ON t.owner_id = u.id
GROUP BY u.id, u.email;
```

Model answer: "INNER JOIN returns only rows with a match in both tables. LEFT JOIN returns all rows from the left table
and NULLs where there is no match. For zero-task users I need LEFT JOIN, and I count t.id rather than
COUNT(*), because COUNT(*) would count the NULL-extended row as 1."
Hit: (1) INNER definition; (2) LEFT definition; (3) correct query; (4) COUNT(t.id) reasoning.

**1B-4. What is an index? When would you not add one?**

Model answer: "An index is a separate sorted data structure, a B-tree in InnoDB, that lets the database find rows without
scanning the whole table. It speeds up lookups, range queries, and sorting but costs storage and slows
inserts and updates. I avoid indexing tiny tables, columns with very low selectivity on their own such as a
boolean, and columns that are rarely queried. I check with EXPLAIN."
Hit: (1) B-tree/faster lookups; (2) write cost; (3) when not to; (4) EXPLAIN.

#### Round C -- Security (5 min)

**1C-1. How do you store passwords, and why not encrypt them?**

Model answer: "I hash them with bcrypt or argon2 using a per-password salt and a cost factor. Hashing is one-way,
so a database leak does not reveal the passwords directly, and the slow cost factor makes brute force
expensive. Encryption is reversible, so if the key leaks everything leaks. At login I compare with the library's
compare function and return the same error for a wrong email or a wrong password."
Hit: (1) bcrypt/argon2; (2) salt + cost; (3) one-way vs reversible; (4) generic login error.

**1C-2. How do you prevent SQL injection?**

Model answer: "With parameterized queries or prepared statements, so user input is sent as data and never
parsed as SQL, plus whitelisting for identifiers like sort columns, input validation, and a least-privilege
database account. I never build SQL by string concatenation."
Hit: (1) parameterized; (2) whitelist identifiers; (3) least privilege; (4) never concatenate.

**1C-3. What is a JWT and where would you store it in a web app?**

Model answer: "A JWT is a signed token with header, payload, and signature. The payload is only base64url encoded,
so it is readable and must not contain secrets. The server verifies the signature and expiry. For browsers
I prefer a short-lived access token in memory and a refresh token in an HttpOnly, Secure, SameSite cookie,
because localStorage is exposed to XSS."
Hit: (1) three parts/signed; (2) not encrypted; (3) verify + expiry; (4) storage reasoning.

#### Round D -- System design (10 min): "Design a URL shortener (simple version)"

Model answer outline (speak it in this order):

1. Requirements: create a short link, redirect, optional expiry; scale assumption e.g. 100M redirects/day (about
   1,200 RPS average), read-heavy (100:1).
2. API: `POST /shorten {url, ttlSec?}` -> 201 `{code}`; `GET /:code` -> 302 to the long URL, 404 if missing or expired.
3. Data: `urls(code PK, long_url, created_at, expires_at)`; code via random base62 of length 7, retry on
   unique-constraint collision.
4. Simplest design: Node app + MySQL. Validate URL scheme (http/https).
5. Scale: cache `code -> url` in Redis (cache-aside), multiple stateless app instances behind a load balancer,
   read replicas, 302 vs 301 trade-off, click analytics asynchronously through a queue.
6. Failures/abuse: rate limit creation, block malicious URLs, DB down -> serve from cache; Redis down -> fall back to the DB with limits.

Hit: (1) clarifies requirements/scale; (2) API + data model; (3) unique code strategy + collisions; (4) caching and read-heavy scaling.
Bonus (not scored but note): 301 vs 302, analytics via queue, abuse prevention.

#### Round E -- Behavioral (5 min)

**1E-1. Tell me about yourself and why you are moving from frontend to backend.**

Model answer (about 90 seconds; fill in your own numbers): "I have several years of experience as a frontend developer, mostly with React and
JavaScript, building dashboards and customer-facing features. Working with APIs every day, I kept being
curious about what happens on the other side: why an endpoint is slow, how authentication really works, how
data is modeled. Over the last two months I studied Node.js and backend engineering systematically: the event
loop, Express and REST design, MySQL including indexes and transactions, authentication, testing, and system
design basics, and built a Task Management API with role-based access, validation, and tests. I am looking for
a junior to mid-level backend role where I can use my strong JavaScript and product sense while growing on the
server side."
Hit: (1) background in one sentence; (2) genuine motivation; (3) concrete evidence (project/topics); (4) what you want next.

**1E-2. What is your biggest gap right now?**

Model answer: "My production experience on the backend is limited. I have built and tested a project, but I
have not operated a high-traffic service on-call. I am closing that gap by learning to read logs and metrics,
practicing incident scenarios, and I would like a team where I can pair with experienced engineers on
reliability work."
Hit: (1) honest real gap; (2) not a fake weakness; (3) action to improve; (4) positive framing.

#### Live coding (5 min): "Group tasks by status"

Write `groupBy(items, keyFn)` returning an object of arrays. Then use it to count tasks per status.

```js
export function groupBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item);
    (out[key] ??= []).push(item);
  }
  return out;
}

const tasks = [{ status: 'todo' }, { status: 'done' }, { status: 'todo' }];
const grouped = groupBy(tasks, (t) => t.status);
const counts = Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length]));
console.log(counts); // { todo: 2, done: 1 }
```

Hit: (1) correct loop/reduce; (2) uses `??=` or equivalent initialization; (3) mentions complexity O(n);
(4) edge-case awareness (empty array, keys such as `__proto__` -> use `Map` or `Object.create(null)`).

**Scoring for Set 1:** Questions: 1A (4 Qs), 1B (4), 1C (3), D (1), E (2), coding (1) = 15 items x 4 = 60 points
max, plus communication 0-4 per round (6 rounds = 24). Total max 84. 70%+ = 59 points.

---

### MOCK SET 2 -- Scenario-based junior+ (60 minutes)

Time plan: A 12 min, B 15 min, C 8 min, D 15 min, E 5 min, live coding 5 min.

#### Round A -- JavaScript / Node (12 min)

**2A-1. Which Node operations use the thread pool, and why does it matter?**

Model answer: "Node's JavaScript runs on one thread, but libuv has a pool of worker threads, four by default. Operations
that use it include file system calls, dns.lookup, zlib, and CPU-bound crypto such as pbkdf2, scrypt, and
bcrypt's native implementation. Network I/O does not use the pool; it uses the OS's non-blocking
mechanisms like epoll, kqueue, or IOCP. It matters because a burst of bcrypt hashes or file reads can
saturate the four threads and delay unrelated operations; I can size UV_THREADPOOL_SIZE, rate limit
login, or scale horizontally."
Hit: (1) pool default 4; (2) correct list; (3) network not in pool; (4) practical consequence.

**2A-2. Explain backpressure in streams and how to avoid memory blowups when serving a 2 GB file.**

Model answer: "Backpressure is the mechanism by which a slow consumer signals a fast producer to pause. A writable
stream's write returns false when its internal buffer passes the highWaterMark, and the producer should wait
for the drain event. Using pipeline handles this automatically and also propagates errors and cleans up. For a
2 GB file I use fs.createReadStream piped through pipeline into the HTTP response, with correct headers,
instead of readFile which loads everything into memory."

```js
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

app.get('/download', async (req, res) => {
  res.type('application/octet-stream');
  await pipeline(createReadStream('/data/big.bin'), res);
});
```

Hit: (1) definition; (2) write() false / drain; (3) pipeline benefits; (4) stream vs readFile memory.

**2A-3. Predict the output.**

```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('tick'));
Promise.resolve().then(() => console.log('promise'));
(async () => {
  console.log('A');
  await null;
  console.log('B');
})();
console.log('C');
```

Model answer: "A, C, tick, promise, B, then timeout and immediate. A and C are synchronous (the async function runs
synchronously until its first await). Then nextTick, then promise microtasks in the order queued: the `.then`
callback was queued first, and the await continuation B second. Timeout versus immediate from the main
module is not guaranteed; usually timeout first, but I would not rely on it."
Hit: (1) sync A, C; (2) tick before promise; (3) B after promise; (4) says timeout/immediate order is nondeterministic here.

**2A-4. You must send notifications to 100 users, and a failure for one user must not stop the others. Which Promise method and why?**

Model answer: "Promise.allSettled, because it waits for every promise and gives me status and value or reason for each,
without rejecting early. Promise.all would reject on the first failure while the others keep running unobserved.
I would also limit concurrency, for example processing in batches of 10, so I do not overload the provider,
and log or retry the failures."
Hit: (1) allSettled; (2) why not all; (3) concurrency limit; (4) failure handling/retry.

#### Round B -- Express / DB (15 min)

**2B-1. Design the REST endpoints for tasks, with filtering and pagination.**

Model answer: "Resources are plural nouns: POST /tasks, GET /tasks, GET /tasks/:id, PATCH /tasks/:id, DELETE /tasks/:id.
GET /tasks supports query parameters status, assignee, sort (whitelisted), order, page, and limit with a
maximum limit. The response returns data plus pagination metadata. Everything is under /v1 for versioning.
Access is scoped to the authenticated user, and errors have a consistent JSON shape."
Hit: (1) resource-based routes; (2) query params for filter/sort/page; (3) whitelisted sort/limit cap; (4) versioning + error shape.

**2B-2. How do you do centralized error handling in Express 5?**

Model answer: "I define custom error classes with status and code. Handlers throw or reject; Express 5 passes thrown
errors and rejected promises to the error middleware, which has four parameters and is registered last. It maps
known errors to responses, translates special cases like JSON parse errors and MySQL duplicate-entry errors,
and returns a generic 500 for unexpected errors while logging the stack with the request id. In Express 4
async handlers need try/catch with next(err) or a wrapper."
Hit: (1) custom errors; (2) 4-arg last middleware; (3) generic 500 + logging; (4) Express 4 vs 5.

**2B-3. SQL: for each user, return their most recent task.**

```sql
SELECT user_id, task_id, title, created_at
FROM (
  SELECT t.owner_id AS user_id, t.id AS task_id, t.title, t.created_at,
         ROW_NUMBER() OVER (PARTITION BY t.owner_id ORDER BY t.created_at DESC, t.id DESC) AS rn
  FROM tasks t
) ranked
WHERE rn = 1;
```

Model answer: "In MySQL 8 I use a window function: ROW_NUMBER partitioned by owner and ordered by newest first, then keep
rn = 1. The older alternative is a join to a subquery with MAX(created_at), but that returns ties; adding id to
the ordering makes it deterministic."
Hit: (1) window function or correct alternative; (2) PARTITION BY/ORDER BY right; (3) filter rn = 1 in the outer query; (4) tie-breaking.

**2B-4. EXPLAIN shows `type: ALL`, `rows: 1,800,000`, `Using filesort` for `SELECT * FROM tasks WHERE owner_id = ? ORDER BY created_at DESC LIMIT 20`. What do you do?**

Model answer: "ALL means a full table scan, and filesort means MySQL sorts results separately. I add a composite index
on (owner_id, created_at) so the database can seek to the owner and read rows in index order, stopping after
20. I select only needed columns instead of SELECT *, then re-run EXPLAIN to confirm type=ref/range and no
filesort. I also check that owner_id has a matching type and no function wraps it."
Hit: (1) interprets ALL/filesort; (2) correct composite order; (3) LIMIT benefit; (4) verifies with EXPLAIN.

**2B-5. Walk through a safe money transfer. Which isolation concerns exist?**

Model answer: "Open a transaction, lock both account rows with SELECT ... FOR UPDATE in a fixed order such as ascending id to
avoid deadlocks, verify the balance, update both rows, insert a ledger entry, and commit; on error roll back and always
release the connection. Without locking, two concurrent transfers could read the same balance and overdraw
(lost update), which REPEATABLE READ does not prevent for read-then-write logic. Amounts are integers in minor
units. I retry on deadlock errors, and I keep the transaction short without external calls."
Hit: (1) transaction + rollback; (2) FOR UPDATE; (3) lock ordering/deadlock; (4) minor units/ledger/retry.

**2B-6. In MongoDB, when do you embed vs reference?**

Model answer: "Embed when the child data is read together with the parent, is bounded in size, and belongs to one
parent, such as order line items. Reference when the relationship is one-to-many without a bound, many-to-many,
or the data is shared or updated independently, such as users and their orders. Documents have a 16 MB limit,
and $lookup joins are costly, so I design around access patterns."
Hit: (1) embed criteria; (2) reference criteria; (3) 16 MB / unbounded growth; (4) access-pattern thinking.

#### Round C -- Security (8 min)

**2C-1. Explain access tokens versus refresh tokens and why both exist.**

Model answer: "The access token is short-lived and sent with every API call, so if it leaks the damage window is small.
The refresh token is long-lived, used only against the refresh endpoint to get a new access token, stored
hashed server-side so it can be revoked and rotated. This gives stateless verification for most requests but
still allows logout and compromise response. If a rotated refresh token is reused, I treat it as theft and revoke
the family."
Hit: (1) short vs long lifetime; (2) refresh stored server-side/hashed; (3) rotation; (4) reuse detection or revocation.

**2C-2. What is the difference between CORS and CSRF? Is CORS a security feature for your API?**

Model answer: "CORS is a browser mechanism controlling which origins' JavaScript can read responses from my API. It does
not stop requests from being sent, and it does not protect against non-browser clients, so it is not authentication.
CSRF is an attack where a malicious site causes the victim's browser to send an authenticated request with
automatically attached cookies. Defences are SameSite cookies, CSRF tokens, and Origin checks. Bearer tokens in the
Authorization header are not attached automatically, so the CSRF risk is lower there."
Hit: (1) CORS = browser read policy; (2) not auth; (3) CSRF definition; (4) defences.

**2C-3. `GET /orders/123` returns the order for any logged-in user. What is wrong and how do you fix it?**

Model answer: "That is an insecure direct object reference, a broken object-level authorization. Authentication
alone does not authorize access to a specific record. The fix is to scope the query by owner or tenant, for example
WHERE id = ? AND user_id = ?, or check ownership in the service, return 404 for non-visible resources, allow
an admin override by role, and add a negative test using a second user's token."
Hit: (1) names IDOR/BOLA; (2) ownership check in query/service; (3) 404 vs 403 reasoning; (4) test.

**2C-4. How would you protect the login endpoint from brute force?**

Model answer: "Rate limiting per IP and per account, progressive delays or a temporary lock, CAPTCHA or MFA after
repeated failures, generic error messages, monitoring and alerts for spikes, and breached-password checks. I
configure trust proxy so IPs are accurate, and remember that bcrypt hashing costs CPU, so limiting also protects availability."
Hit: (1) per-IP and per-account; (2) lockout/backoff/MFA; (3) generic error + monitoring; (4) trust proxy or CPU cost.

#### Round D -- System design (15 min): "Design a rate limiter for an API"

Model answer outline:

1. Requirements: limit per user/API key/IP, e.g. 100 requests/min; return 429 with Retry-After; low latency;
   works across multiple instances; configurable rules per route.
2. Algorithms: fixed window (simple, boundary burst), sliding window log (accurate, memory heavy), sliding window
   counter (approximate, cheap), token bucket (allows bursts, smooth) -- choose token bucket or sliding window counter.
3. Single instance: in-memory Map keyed by user with a bucket {tokens, lastRefill}; O(1).
4. Multi-instance: shared store, Redis, with an atomic Lua script (INCR + EXPIRE, or token bucket math) to avoid races.
5. Placement: API gateway/reverse proxy or middleware; stricter limits on /login; identify clients by API key
   then IP; `trust proxy` pitfalls.
6. Failures: Redis down -> fail-open (availability) or fail-closed (protect the backend), decided per route (login:
   closed-ish with local fallback; public reads: open). Clock skew handled by using Redis time or relative TTL.
7. Response headers: `RateLimit-*`, `Retry-After`. Observability: count of 429s, top limited keys.
8. Trade-offs: accuracy vs memory, burst tolerance, per-key hot spots, cost of the Redis round trip (use a local pre-check or batching).

Hit: (1) requirements + 429; (2) names and compares 2+ algorithms; (3) distributed approach with atomicity; (4) failure policy.

#### Round E -- Behavioral (5 min)

**2E-1. Tell me about a time you had to learn something quickly.**

Model answer (STAR; use your own real story): "Situation: our team needed a feature in an area I had not worked in, and I had two weeks. Task: ship
it reliably. Action: I split the learning into core concepts, built small throwaway experiments, read the
official docs, and asked a teammate to review my approach early. Result: I delivered it on time and wrote up
notes for the team. I used the same method to learn backend: eight weeks, daily hands-on practice, and a
project instead of passive reading."
Hit: (1) specific situation; (2) concrete actions; (3) measurable result; (4) lesson/link to the backend switch.

**2E-2. Why should we hire a frontend-turned-backend developer over a backend-only junior?**

Model answer: "I bring real experience consuming APIs, so I understand what makes an API pleasant or painful: consistent error
shapes, pagination, and good documentation. I know JavaScript deeply, can debug across the whole stack, and
communicate well with frontend and product teams. On the backend side I have built a tested API and I learn
fast. I do not claim deep production backend experience yet, and I would expect mentorship in that area."
Hit: (1) genuine strengths; (2) full-stack debugging value; (3) evidence of backend work; (4) honest about gaps.

#### Live coding (5 min): "Fetch all pages"

An API returns `{ items: [...], nextPage: number | null }` for `GET /users?page=N`. Write
`fetchAllUsers(fetchPage)` where `fetchPage(page)` returns a promise of that shape. Return all items.
Then explain how you would speed it up if the total page count were known.

```js
export async function fetchAllUsers(fetchPage) {
  const all = [];
  let page = 1;
  while (page !== null) {
    const res = await fetchPage(page); // sequential: the next page number comes from the response
    all.push(...res.items);
    page = res.nextPage;
  }
  return all;
}

// If total pages are known, pages are independent -> fetch in parallel with a concurrency limit.
export async function fetchPagesParallel(fetchPage, totalPages, limit = 5) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const results = [];
  for (let i = 0; i < pages.length; i += limit) {
    const batch = pages.slice(i, i + limit);
    const items = await Promise.all(batch.map((p) => fetchPage(p).then((r) => r.items)));
    results.push(...items.flat());
  }
  return results;
}
```

Hit: (1) loop with correct termination; (2) sequential because the next page is unknown; (3) parallel with a limit when the total is
known; (4) mentions error handling/retry/rate limits (and that `push(...)` with huge arrays can overflow the argument limit).

**Scoring for Set 2:** A (4) + B (6) + C (4) + D (1) + E (2) + coding (1) = 18 items x 4 = 72 points, plus
communication 6 rounds x 4 = 24. Total 96. 70%+ = 67 points.

### Review procedure after each mock (20 minutes)

1. Tally scores. 2. List every question with a score of 2 or less. 3. For each, write the one-sentence answer you
should have said. 4. Map to the Week/Day notes and mark for Day 56. 5. Re-record the three weakest answers and
listen once: speed, filler words, structure.

### Common mistakes (this day)

- Reading the model answer first and then "pretending" you knew it.
- Long preambles; interviewers want the direct answer in the first sentence, then reasons.
- Not asking clarifying questions in design; skipping the failure scenarios.
- Memorized definitions without an example; always add a concrete backend example.
- Rushing coding without stating the approach and edge cases.

### Revision notes

- Answer-first, then why, then example, then trade-off.
- 20 seconds of think time is acceptable; silence is better than rambling.
- Every design has requirements, a simplest version, a scale step, and failure modes.

### Key concepts to remember

1. Thread pool vs OS async I/O is a signature "depth" question.
2. allSettled vs all; concurrency limits; error isolation.
3. IDOR is the most common real-world API bug: scope every query.
4. Rate limiter = algorithm choice + atomic shared store + failure policy.
5. Behavioral answers need a specific story, an action, and a result.

### Five revision questions

1. What are the four things a good interview answer includes?
2. Which red flags did you commit in Mock 1 or 2?
3. Which round was weakest and which Week note covers it?
4. What would you do differently in the system design round?
5. Which two answers will you re-record tonight?

### Practical coding task (30 min)

Redo the live-coding question you scored lowest, this time with tests using `node:test`, and add one edge
case you forgot in the mock.

### Self-assessment checklist

- [ ] I completed both mocks in the allotted time without pausing.
- [ ] I scored every answer honestly using the Hit lists.
- [ ] I recorded my weak topics for Day 56.
- [ ] My Set 1 score is 70%+ (or I know exactly what to fix).
- [ ] I identified at least two filler habits to remove.

---

## Day 56 (W8 D7) - Mock sets 3-4, final readiness checklist, readiness assessment

**Learning objectives**

- Mid-level stretch mock (Set 3) aur full-length final simulation (Set 4) dena, including project deep dive,
  incident diagnosis, live coding, aur frontend-to-backend transition story.
- Final readiness checklist se har area honestly tick karna.
- Readiness assessment padhna: kya tum realistically kar sakte ho, kya nahi, aur next steps kya hain.
- Weak areas ka last-pass revision plan banana (Week 8 ka weak-area guidance section dekho).

Scoring rubric: same as Day 55 (0-4 per question = number of Hit checkpoints you clearly stated; communication
0-4 per round). Same red flags apply.

---

### MOCK SET 3 -- Mid-level stretch (60 minutes)

This set mixes deeper internals, concurrency, and design trade-offs. A junior is not expected to score
85 percent; 60 percent is a good result. For a mid-level target aim for 70 percent plus.

Time plan: A 12 min, B 15 min, C 8 min, D 15 min, E 5 min, live coding 5 min.

#### Round A -- JavaScript / Node (12 min)

**3A-1. Describe step by step what happens when Node executes `await fs.promises.readFile(path)`.**

Model answer: "The call crosses from JavaScript into Node's C++ bindings, which submit a file system request to libuv. File
operations are performed by a thread from libuv's thread pool, so a pool thread does the blocking read while the
main thread continues running other code. When the read finishes, the pool thread posts the completion back to the
event loop, the loop runs the completion callback, which resolves the promise, and the continuation after `await`
is queued as a microtask. So JavaScript is never blocked, but a pool thread is occupied, which is why heavy file
or crypto work can queue up behind the four default threads."
Hit: (1) bindings to libuv; (2) thread pool executes; (3) main thread keeps running; (4) completion back via loop -> promise -> microtask continuation.

**3A-2. When do you use worker threads, the cluster module, or more containers?**

Model answer: "Worker threads are for CPU-bound work inside one service, such as image resizing or heavy parsing,
because they run separate JavaScript isolates and keep the main event loop responsive; they communicate through
message passing or SharedArrayBuffer. Cluster, or running several processes with PM2, uses multiple cores
to handle more concurrent requests; each process has its own memory. On container platforms I usually prefer one
Node process per container and scale containers horizontally, with the orchestrator handling restarts and load
balancing. For long CPU jobs I would rather use a queue with a separate worker service so web latency is isolated."
Hit: (1) worker threads = CPU offload; (2) cluster/processes = use cores for I/O concurrency; (3) containers/horizontal scale; (4) queue/worker service for long jobs.

**3A-3. RSS grows steadily until the container is OOM-killed. How do you investigate?**

Model answer: "First I compare heapUsed with rss from process.memoryUsage over time; if the heap grows it is retained JavaScript
objects, if only RSS grows it may be Buffers or native memory. I take heap snapshots at two points under load and use the
comparison view to see which object types grow and what retains them. Common culprits are unbounded caches or
Maps, listeners added per request, intervals not cleared, closures holding request objects, and global arrays.
I fix by bounding or evicting, removing listeners, and clearing timers, then confirm with a soak test that memory
plateaus. Short term, I set a memory limit with restart so the service stays available."
Hit: (1) heap vs RSS; (2) snapshot comparison; (3) typical causes; (4) verification and mitigation.

**3A-4. Prototype and `this` question. What does each line print or do (ES module, strict mode)?**

```js
function Task(title) { this.title = title; }
Task.prototype.describe = function () { return this.title; };

const t = new Task('A');
console.log(t.describe());                 // line 1
console.log(Object.hasOwn(t, 'describe')); // line 2
console.log(t instanceof Task);            // line 3
const d = t.describe;
console.log(d());                          // line 4
```

Model answer: "Line 1 prints A. Line 2 prints false because describe lives on Task.prototype, not on the instance. Line 3
prints true because Task.prototype is in t's prototype chain. Line 4 throws a TypeError: the function is called
without a receiver, `this` is undefined in strict mode, and reading `title` of undefined fails. The fix is
`d.call(t)`, `t.describe.bind(t)`, or calling it as a method."
Hit: (1) A; (2) own vs prototype false; (3) instanceof via chain; (4) lost this + fix.

**3A-5. ESM vs CommonJS: what practical differences cause bugs when migrating?**

Model answer: "ESM uses static import/export, is always strict, supports top-level await, and has no `require`, `__dirname`, or
`__filename`; I use import.meta.url or import.meta.dirname in recent Node versions. Relative imports need file
extensions. ESM can import CommonJS packages, but named imports from CommonJS can fail when the exports cannot be
statically detected, so I use the default import. Importing JSON needs an import attribute with type json. CommonJS
loads synchronously and can `require` conditionally; require of an ES module is version-dependent, so I avoid
relying on it. In package.json, type module changes how .js files are interpreted."
Hit: (1) no __dirname/require; (2) extensions needed; (3) CJS interop caveat; (4) top-level await/strict/package.json type.

#### Round B -- Express / Databases (15 min)

**3B-1. Explain isolation levels with a concrete anomaly, and show a lost update fix.**

Model answer: "READ UNCOMMITTED allows dirty reads, READ COMMITTED prevents dirty reads but allows non-repeatable reads,
REPEATABLE READ, the InnoDB default, gives a stable snapshot within the transaction, and SERIALIZABLE effectively
locks reads. Lost update example: two requests read stock 1, both decide to sell, both write 0. Even under
REPEATABLE READ this can happen with read-then-write logic. Fixes: an atomic conditional update
`UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0` and check affectedRows; or SELECT ... FOR UPDATE inside a
transaction; or an optimistic version column."
Hit: (1) levels in order with anomalies; (2) InnoDB default; (3) lost update scenario; (4) at least two fixes.

**3B-2. What is a deadlock, how do you find it, and how should your code react?**

Model answer: "Two transactions each hold a lock the other needs, so neither can proceed. InnoDB detects it and rolls back one
transaction with error 1213. I look at SHOW ENGINE INNODB STATUS for the latest detected deadlock, which shows the
statements and locks. Fixes include accessing rows in a consistent order, keeping transactions short, adding
indexes so fewer rows are locked, and in code retrying the whole transaction a bounded number of times with a
small randomized delay. A lock wait timeout, error 1205, is a different condition."
Hit: (1) definition; (2) InnoDB status/1213; (3) consistent ordering/indexes/short transactions; (4) retry in code.

**3B-3. Design indexes for: `WHERE tenant_id = ? AND status IN ('todo','in_progress') AND created_at >= ? ORDER BY created_at DESC LIMIT 50`.**

Model answer: "I start with equality on tenant_id. An index on (tenant_id, created_at) lets MySQL range-scan by time in
the correct order and stop after 50 matching rows, filtering status as it goes; that is good when most rows have
the open statuses. An index on (tenant_id, status, created_at) is better for a single status, but with an IN list
MySQL probes each status separately and then needs to merge or sort for ORDER BY created_at, so it may use a filesort. I would test both with EXPLAIN
ANALYZE on realistic data and pick the one with fewer rows examined, keeping write overhead in mind. If the status
is very selective I may run one query per status and merge in the application."
Hit: (1) tenant equality first; (2) understands IN breaks ordering; (3) alternatives with trade-off; (4) verifies with EXPLAIN.

**3B-4. Offset vs keyset pagination: explain and show the query.**

```sql
-- keyset (next page after the last seen row created_at = ?, id = ?)
SELECT id, title, created_at
FROM tasks
WHERE owner_id = ?
  AND (created_at < ? OR (created_at = ? AND id < ?))
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- supporting index: (owner_id, created_at, id)
```

Model answer: "Offset pagination makes the database read and discard OFFSET rows, so deep pages get slower, and results shift if
rows are inserted during paging. Keyset pagination uses the last seen sort key, here created_at plus id as a tie-breaker, to seek
directly, giving constant-time pages and stable results. The costs: no random page jumps, and the sort keys must be unique
and indexed. The API returns an opaque cursor encoding the last key."
Hit: (1) offset cost; (2) keyset condition with tiebreaker; (3) index; (4) trade-off (no jumping) / opaque cursor.

**3B-5. How do you size a MySQL connection pool?**

Model answer: "Start from the limit: max_connections on MySQL minus reserved connections, divided by the number of app
instances, including workers and migrations. More connections do not mean more throughput past what the
database cores and I/O can execute; a small pool, often 10 to 20 per instance, and a queue is usually
better. Estimate concurrent queries as queries per second times average query time (Little's law), add headroom,
then load test. I set acquire timeouts so requests fail fast, release connections in finally, and monitor pool wait
time. Autoscaling instances multiply pool size, which can exhaust the database."
Hit: (1) bounded by max_connections/instances; (2) more is not faster; (3) Little's law or load testing; (4) timeouts/release/monitor.

**3B-6. What is a breaking API change and how do you introduce one?**

Model answer: "Anything clients cannot ignore safely: removing or renaming a field, changing a type or meaning, making an
optional field required, or changing status codes or error formats. Additive changes, like new optional fields or
endpoints, are non-breaking. For breaking changes I introduce a new version such as /v2, keep /v1 running with a
deprecation notice and sunset date, communicate with changelogs, and monitor v1 usage before removal."
Hit: (1) examples of breaking; (2) additive is safe; (3) versioning mechanics; (4) deprecation/sunset/monitoring.

**3B-7. How do you implement file uploads safely?**

Model answer: "Limit size and count, restrict allowed types by checking content, not just the client mimetype or
extension, generate server-side file names to avoid path traversal and overwrites, and never serve uploads from
an executable path. Do not buffer large files in memory; stream to disk or object storage. A scalable pattern is
a pre-signed URL so the client uploads directly to object storage, and the API only stores metadata, then
scans or processes asynchronously. Enforce authorization on download."
Hit: (1) limits + type validation; (2) server-side filenames; (3) streaming/pre-signed URL; (4) access control/scan.

#### Round C -- Security (8 min)

**3C-1. Design a secure password-reset flow.**

Model answer: "The request endpoint always returns the same response whether the email exists, to prevent account
enumeration, and is rate limited. I generate a random token with crypto.randomBytes, store only its hash with a short
expiry such as 15 to 30 minutes and single-use status, and email a link. On reset, I hash the submitted token, find an
unexpired unused record, validate the new password, store a new bcrypt hash, mark the token used, and revoke
existing refresh tokens and sessions. I notify the user by email that the password changed."
Hit: (1) no enumeration; (2) random token stored hashed; (3) expiry + single use; (4) revoke sessions/notify.

**3C-2. How do you manage secrets in a backend project?**

Model answer: "Secrets such as database passwords and JWT signing keys come from environment variables or a secret manager,
never from the repository. `.env` is git-ignored with a `.env.example` listing names only. Each environment has different
secrets with least-privilege credentials. I avoid logging them, scan commits for leaks, and have a rotation plan; if one leaks, I rotate
it immediately because removing it from git history is not enough. Config is validated at startup so the app fails fast if
something is missing."
Hit: (1) env/secret manager; (2) no commit/.env.example; (3) rotation on leak; (4) validate at startup/least privilege.

**3C-3. Your API only returns JSON. Can XSS still be an issue?**

Model answer: "Yes, indirectly. The API itself does not render HTML, but if it stores user content, such as a comment containing a script
tag, and a frontend renders it unsafely, XSS occurs. I send the correct Content-Type with X-Content-Type-Options: nosniff, validate and
sanitize rich text inputs if HTML is allowed, and encourage output encoding on the frontend and a Content Security Policy. HttpOnly cookies
limit the damage by keeping tokens unreadable to scripts."
Hit: (1) stored content risk; (2) correct content type/nosniff; (3) sanitize/encode; (4) CSP/HttpOnly.

**3C-4. A JWT library accepts `alg: none` or an unexpected algorithm. What is the risk?**

Model answer: "An attacker could forge tokens by changing the header: `none` means unsigned, and in algorithm-confusion attacks they
sign with HMAC using the public key as the secret. Defence: always pin the allowed algorithms in verify, use a
maintained library, use strong secrets or asymmetric keys, and validate issuer, audience, and expiry."
Hit: (1) forgery risk; (2) alg confusion; (3) pin algorithms; (4) validate claims.

#### Round D -- System design (15 min): "Design a notification system (email + push + SMS)"

Model answer outline:

1. Requirements: send transactional notifications triggered by events (order shipped); channels email, push, SMS; user
   preferences and opt-outs; reliability (no lost messages, tolerate duplicates); scale e.g. 10M notifications/day (about 115/s average,
   bursts 50x).
2. API/events: internal `POST /notifications {userId, type, data, idempotencyKey}` or consume domain events; returns 202.
3. Data: `notifications(id, user_id, type, payload, status, created_at)`, `deliveries(notification_id, channel, status,
   attempts, provider_id, last_error)`, `user_preferences(user_id, channel, enabled)`, templates.
4. Simplest design: the API saves a row and sends inline. Problem: slow providers block requests and failures lose messages.
5. Real design: the API validates + writes the notification + an outbox event in one transaction -> queue (per channel) -> channel
   workers -> provider (SES/FCM/Twilio). Workers check preferences, render the template, send, record the delivery.
6. Reliability: at-least-once delivery, idempotency key per notification+channel so retries do not duplicate; exponential
   backoff with jitter; dead-letter queue; provider failover; rate limiting per provider and per user; priority queues
   (OTP before marketing).
7. Failures: queue down -> the outbox retains events; provider outage -> retry/fallback channel; poison messages -> DLQ + alert;
   duplicate webhooks -> idempotent status updates.
8. Scale/observability: partition queues, autoscale workers, batch sends, metrics (queue depth, send latency, failure rate),
   delivery tracking via provider webhooks.

Hit: (1) requirements + scale; (2) queue/worker async architecture; (3) idempotency/retries/DLQ; (4) failure scenarios + trade-offs (duplicates, ordering).

#### Round E -- Behavioral (5 min)

**3E-1. Tell me about a mistake you made that affected users or teammates.**

Model answer (STAR; replace with your real story if you have one): "Situation: I shipped a frontend change that assumed an API field was always present. Task: restore the user
experience and prevent recurrence. Action: I rolled back within minutes, wrote a fix with defensive handling,
added a test, and proposed a contract check with the backend team. Result: no repeat; the team adopted response schema validation. I
learned to treat API contracts as a shared responsibility, which is part of why I want backend ownership now."
Hit: (1) real mistake, owned; (2) quick mitigation; (3) systemic fix; (4) lesson learned.

**3E-2. How do you handle disagreement with a senior engineer about a technical approach?**

Model answer: "I first make sure I understand their reasoning, then present my concern with evidence such as a benchmark, a
failure scenario, or documentation, and ask what trade-offs they see. If we still disagree, I suggest a small experiment or defer to the
decision owner, and commit fully once a decision is made. I keep it about the problem, not the person."
Hit: (1) listens first; (2) evidence-based; (3) experiment/escalate appropriately; (4) commits after the decision.

**3E-3. How do you estimate a task you have never done before?**

Model answer: "I break it into small pieces, identify unknowns, do a short time-boxed spike to reduce risk, and give a
range with assumptions rather than a single number. I flag early if the spike changes the estimate."
Hit: (1) decompose; (2) spike for unknowns; (3) range + assumptions; (4) communicate early.

#### Live coding (5-8 min): "Async memoize with in-flight sharing"

Write `memoizeAsync(fn)`: caches by first-argument key; concurrent calls with the same key share one in-flight promise;
failures are NOT cached.

```js
export function memoizeAsync(fn) {
  const cache = new Map(); // key -> Promise
  return (key, ...rest) => {
    if (cache.has(key)) return cache.get(key);
    const p = Promise.resolve()
      .then(() => fn(key, ...rest))
      .catch((err) => {
        cache.delete(key); // do not cache failures
        throw err;
      });
    cache.set(key, p);
    return p;
  };
}
```

Hit: (1) caches the promise (not the value); (2) concurrent calls share it; (3) deletes on rejection; (4) mentions
unbounded growth and TTL/LRU (see M4) and sync-throw handling.

**Scoring for Set 3:** A (5) + B (7) + C (4) + D (1) + E (3) + coding (1) = 21 items x 4 = 84, plus communication 6 x 4 = 24.
Total 108. 60 percent = 65 points; 70 percent = 76 points.

---

### MOCK SET 4 -- Final full simulation (75 minutes)

Treat this as the real thing. Quiet room, camera on if possible, timer visible, no notes. Record audio or video and
review it afterwards. Time plan: Round 1 quick-fire 10 min, Round 2 project 12 min, Round 3 incident 12 min, Round 4
system design 15 min, Round 5 live coding 10 min, Round 6 behavioral + your questions 16 min.

#### Round 1 -- Quick-fire (10 questions, about 1 minute each, scored 0-2: 2 = precise, 1 = partial, 0 = wrong/none)

1. What is the difference between `==` and `===`, and when is `==` acceptable?
   Answer: `===` compares without coercion; `==` coerces types with surprising rules. Many teams enforce `===`; `x == null` is the common deliberate exception for "null or undefined".
2. What does `process.nextTick` do compared to `setImmediate`?
   Answer: nextTick callbacks run right after the current operation, before promise microtasks and before the loop continues; setImmediate runs in the check phase after I/O polling. Overusing nextTick can starve I/O.
3. What is the difference between PUT and PATCH?
   Answer: PUT replaces the whole resource and is idempotent; PATCH partially updates and is not guaranteed idempotent by definition.
4. 401 vs 403?
   Answer: 401 not authenticated (missing/invalid credentials); 403 authenticated but not permitted.
5. What is an idempotent operation and why does it matter for payments?
   Answer: Repeating it yields the same server state; retries are inevitable (timeouts), so unsafe duplicates must be prevented with idempotency keys.
6. What is the difference between WHERE and HAVING?
   Answer: WHERE filters rows before grouping; HAVING filters groups after aggregation, so it can use aggregate functions.
7. What is the leftmost-prefix rule?
   Answer: A composite index (a,b,c) can serve conditions on a, on a+b, or a+b+c, not on b or c alone.
8. Why bcrypt instead of SHA-256 for passwords?
   Answer: bcrypt is deliberately slow, salted, and tunable; SHA-256 is fast, so brute force is cheap.
9. What is the difference between unit and integration tests?
   Answer: Unit tests isolate a unit with its dependencies faked; integration tests exercise several real components together, like Express + DB through HTTP.
10. What is graceful shutdown?
    Answer: On SIGTERM stop accepting new connections, let in-flight requests finish, close DB/Redis connections, exit, with a forced timeout.

Scoring: sum (max 20).

#### Round 2 -- Project deep dive (12 min)

The interviewer has your resume open: "Task Management API". Use the P-01 to P-16 answers on Day 54 as your base,
but answer in your own words.

- 2-1. "Give me a two-minute overview of the project and the one decision you are proudest of."
  Hit: (1) clear architecture in order; (2) one specific decision with reasoning; (3) concrete tech facts (Express, MySQL, JWT, tests); (4) limitation mentioned honestly.
- 2-2. "How do you make sure user A cannot modify user B's task?"
  Hit: (1) auth middleware + req.user; (2) ownership in service/query (`WHERE id = ? AND owner_id = ?` or assignee rule); (3) 404/403 reasoning; (4) negative test.
- 2-3. "Show me where you used a transaction and what would happen without it."
  Hit: (1) specific multi-write example; (2) begin/commit/rollback/release in finally; (3) failure outcome (partial write); (4) concurrency (locks/versions).
- 2-4. "How would you find out why `GET /tasks` is slow in production?"
  Hit: (1) measure scope (p99, logs with request id); (2) check the DB with slow log/EXPLAIN; (3) N+1/index/pagination; (4) fix + verify.
- 2-5. **Live modification:** "Add soft delete: `DELETE /tasks/:id` should mark the task deleted instead of removing it, and lists should hide deleted tasks."

Model answer: "Add a nullable `deleted_at DATETIME` column (migration). DELETE becomes
`UPDATE tasks SET deleted_at = NOW() WHERE id = ? AND owner_id = ? AND deleted_at IS NULL` and returns 204 or 404 based on
affectedRows. Every read query adds `AND deleted_at IS NULL`; I centralize that in the repository to avoid forgetting it,
and add `deleted_at` into the relevant composite indexes if lists get slow. Unique constraints need care (e.g. a
unique title per project would block recreating after a soft delete; use a generated column or include deleted_at). Admins
can restore via PATCH. I add tests: a deleted task gives 404, is absent from the list, and another user cannot delete it. A purge job can hard delete
old rows for privacy compliance."

```js
// repository excerpt
async softDelete(id, ownerId) {
  const [res] = await this.pool.execute(
    'UPDATE tasks SET deleted_at = NOW() WHERE id = ? AND owner_id = ? AND deleted_at IS NULL',
    [id, ownerId],
  );
  return res.affectedRows === 1;
}
```

Hit: (1) column + update-instead-of-delete; (2) all reads filtered; (3) unique/index implications; (4) tests + restore/purge.

Scoring: 5 items x 4 = 20.

#### Round 3 -- Incident (12 min)

"Since 10:00 the checkout endpoint p99 is 5 seconds and 504s are rising. App CPU is low, DB CPU and query times look
normal. What do you do?"

Model answer: "First mitigate and scope: is it all endpoints or only checkout, and did anything deploy at 10:00? Since app CPU and
DB look healthy but latency is high, requests are probably waiting, so I suspect a slow or failing dependency, pool or thread-pool queueing, or
missing timeouts. I check the traces and logs by request id for where time is spent, and the latency of outbound calls
to the payment gateway. I check event loop delay to rule out blocking, DB pool wait time and queue counts, and whether
the libuv thread pool is saturated by crypto or DNS lookups. Likely cause here: the payment provider is slow and our
outbound HTTP calls have no timeout, so requests pile up holding connections and workers. Mitigation: set a timeout
with AbortSignal.timeout, fail fast with a clear error, add a circuit breaker so we stop hammering the provider, retry
only with idempotency keys and backoff, and show users 'payment pending' with reconciliation by webhook. If a deploy
caused it, roll back. After recovery I add alerts on dependency latency and a runbook, and write a short
post-incident review."

```js
// outbound call with a hard timeout
const res = await fetch(url, { method: 'POST', body, headers, signal: AbortSignal.timeout(3000) });
```

Hit (item 3-1): (1) scope + mitigate first; (2) reasoning from signals (CPU low = waiting); (3) checks dependency/pool/event loop/thread pool;
(4) timeouts/circuit breaker/idempotent retries.
Hit (item 3-2, follow-up "How do you prevent this class of incident?"): (1) timeouts everywhere; (2) bulkheads/limits/circuit breaker;
(3) dependency latency alerts/SLOs; (4) load/chaos test and runbook.

Scoring: 2 items x 4 = 8.

#### Round 4 -- System design (15 min): "Design the checkout/payment flow for a marketplace"

Model answer outline:

1. Requirements: users pay for an order; integrate with a payment gateway; never double charge; handle gateway
   timeouts; order state consistent; audit trail; refunds. Scale: moderate, spikes during sales.
2. API: `POST /orders` (create, status `pending_payment`), `POST /orders/:id/pay` with an `Idempotency-Key` header,
   `POST /webhooks/payments` (gateway events), `GET /orders/:id`.
3. State machine: `created -> pending_payment -> paid | failed -> (refunded)`; allowed transitions enforced in code and
   by conditional updates (`UPDATE orders SET status='paid' WHERE id=? AND status='pending_payment'`).
4. Data: `orders`, `order_items` (price snapshot), `payments(id, order_id, gateway_ref, amount_minor, currency, status)`,
   `idempotency_keys`, append-only `ledger`, `webhook_events(event_id UNIQUE)`. Money as integer minor units.
5. Flow: the client sends pay with an idempotency key; the server records a payment attempt, calls the gateway passing the same
   key, with a timeout; on success, in one DB transaction update payment + order + ledger; confirmation also comes by
   webhook, which is verified by signature and processed idempotently by event id.
6. Failure scenarios: gateway timeout -> state unknown: do not retry blindly; mark `pending`, query the gateway by key or
   wait for the webhook, and a reconciliation job compares our records with gateway reports; duplicate webhook -> unique event id;
   crash after the charge but before the DB write -> webhook/reconciliation repairs it; out-of-order webhooks -> compare state machine/version.
7. Inventory: reserve stock with atomic conditional updates and a reservation expiry; release on failure.
8. Scale/trade-offs: a queue for post-payment work (emails, invoices) through the outbox; a separate payments module but a single
   database until there is a reason to split; consistency over availability for money state; observability with payment
   funnel metrics and alerts on stuck `pending_payment` orders.

Hit (item 4-1): (1) requirements + API; (2) state machine + data model with minor units; (3) simplest flow first; (4) transaction/consistency approach.
Hit (item 4-2): (1) idempotency key end to end; (2) timeout means unknown -> reconciliation/webhook; (3) duplicate/out-of-order webhooks; (4) outbox/queue + monitoring.

Scoring: 2 items x 4 = 8.

#### Round 5 -- Live coding (10 min): "Request ID and timeout middleware"

Write Express middleware `requestId()` that reuses a valid incoming `X-Request-Id` or generates a UUID, sets it on
`req.id` and the response header; and `requestTimeout(ms)` that aborts a per-request `AbortController` and responds 503
if the handler takes too long. Explain a limitation.

```js
// request-context.js
import { randomUUID } from 'node:crypto';

export function requestId() {
  return (req, res, next) => {
    const incoming = req.get('x-request-id');
    req.id = incoming && /^[A-Za-z0-9_-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    res.set('X-Request-Id', req.id);
    next();
  };
}

export function requestTimeout(ms) {
  return (req, res, next) => {
    const controller = new AbortController();
    req.abortSignal = controller.signal; // pass to DB/fetch calls that support signals
    const timer = setTimeout(() => {
      controller.abort(new Error('request timeout'));
      if (!res.headersSent) {
        res.status(503).json({ error: { code: 'TIMEOUT', message: 'Request timed out', requestId: req.id } });
      }
    }, ms);
    res.on('close', () => clearTimeout(timer)); // fires on finish or client disconnect
    next();
  };
}
```

Usage: `app.use(requestId()); app.use(requestTimeout(10_000));` (register before routes).
Limitation to state: responding with 503 does not stop the work unless the underlying operations observe the abort
signal; a handler might still write later and try to send a second response (guard with `res.headersSent`). Validate the incoming
header to avoid log injection. 504 normally comes from a proxy/gateway, so 503 is a reasonable choice for an application-level timeout.

Hit (item 5-1): (1) correct middleware structure with next; (2) validates/generates id and sets header; (3) timer cleared on close, AbortController used.
Hit (item 5-2): (1) explains the limitation of timeouts (work continues); (2) mentions the headersSent guard; (3) validation of header/log injection; (4) how to use the id in logs.

Scoring: 2 items x 4 = 8.

#### Round 6 -- Behavioral + your questions (16 min): the transition story

**6-1. Walk me through your transition from frontend to backend. Why now, and what did you do about it?**

Model answer (about 2 minutes; use your own years and details): "For the past several years I have built React frontends and spent a lot of time integrating
with APIs. The moments I enjoyed most were debugging across the boundary: figuring out why an endpoint returned slow
or inconsistent data and tracing it to a missing index or a design problem. I realized I wanted to own that side. Eight
weeks ago I started a structured plan, about two hours a day. I went from JavaScript runtime details and Node internals,
to Express and REST design, to MySQL including indexes and transactions, to authentication and security, and finally testing, caching,
queues, and system design. I applied it in a Task Management API with role-based access, validation, transactions, and tests,
and I practiced explaining designs and debugging incidents out loud. I understand I am early in my backend career, so I am
looking for a role with mentoring, where my JavaScript and frontend perspective is an advantage and I can keep growing on
reliability and data."
Hit: (1) honest background; (2) genuine motivation tied to experience; (3) concrete learning plan and project evidence; (4) forward-looking, realistic about level.

**6-2. What was the hardest thing to learn, and how did you deal with it?**

Model answer: "The hardest part was moving from 'it works' to thinking about failure: concurrency, partial failure, retries,
and data consistency. In frontend a bug usually affects one user's session; on the backend two simultaneous requests can corrupt
shared data. I practiced with deliberate examples, such as reproducing a lost update and fixing it with an atomic update and
a version column, and a transfer with lock ordering to avoid deadlocks. I also learned to ask 'what happens if this
runs twice or halfway?' for every write path."
Hit: (1) genuine difficulty; (2) concrete example; (3) method of learning; (4) changed mindset.

**6-3. Tell me about a time you debugged an issue across frontend and backend.**

Model answer: "Users reported a list page showing duplicates. On the frontend the component looked fine, so I inspected the
network tab and saw the API returned overlapping items between pages. The backend used offset pagination with a sort on a non-unique
column, so ordering was unstable between requests. I proposed a deterministic tie-breaker on id and then keyset pagination.
That experience is what showed me how much API design affects the user experience and pushed me towards the backend."
(Replace with your real story; the shape is: symptom, investigation, root cause on the other side, fix, lesson.)
Hit: (1) specific symptom; (2) systematic investigation; (3) root cause + fix; (4) learning/impact.

**6-4. You are on call and something breaks that you do not understand. What do you do?**

Model answer: "I stay calm and follow a checklist: confirm impact, check recent deploys and dashboards, mitigate first through a rollback
or feature flag, and escalate early if I cannot find the cause in a reasonable time, since waiting hurts users more than
asking for help. I communicate status updates, keep notes of what I tried, and afterwards contribute to the post-incident
review and add a missing alert or runbook."
Hit: (1) mitigate first; (2) uses signals/deploys; (3) escalates early; (4) communication + follow-up.

**Questions YOU should ask the interviewer (pick 3-4)**

1. What does onboarding for a new backend engineer look like in the first 90 days?
2. How is code reviewed, and how are production incidents handled and reviewed here?
3. What does the stack look like: Node version, database, queue, deployment, observability?
4. How do you test, and what does CI/CD look like?
5. Is there mentoring or pairing for engineers newer to backend work?
6. What is the biggest technical challenge the team is facing in the next six months?
7. How do you decide between building modules in the monolith and extracting services?
8. What does success look like for this role after six months?

Scoring: 4 items x 4 = 16.

**Scoring for Set 4:** Round 1 (20) + Round 2 (20) + Round 3 (8) + Round 4 (8) + Round 5 (8) + Round 6 (16) = 80, plus
communication 6 rounds x 4 = 24. Total 104. 70 percent = 73 points. A final set at 70 percent or more, with no red flags, is a
good signal that you are ready to start applying to junior roles; for mid-level also see the assessment below.

### Mock results log (copy this table to your notes)

| Set | Date | Score | % | Weakest round | Red flags | Action |
|-----|------|-------|---|---------------|-----------|--------|
| 1 | | /84 | | | | |
| 2 | | /96 | | | | |
| 3 | | /108 | | | | |
| 4 | | /104 | | | | |

---

### Final interview readiness checklist

Tick an item only if you can do it **without notes, aloud, in under 90 seconds** (for "explain" items) or **in the
stated time** (for "write" items). If you cannot, it stays unticked, and you use the pointer to the notes.
Tier: `[E]` = essential (expect it in most interviews), `[A]` = advanced (bonus, mid-level signal).

#### 1. JavaScript

- [ ] [E] Explain call stack, execution context, hoisting/TDZ, closures with an example (Week 1 / Day 1)
- [ ] [E] Explain `this` binding rules and fix a lost-`this` bug (Week 1 / Day 2)
- [ ] [E] Explain prototypes and what `class` really is (Week 1 / Day 2)
- [ ] [E] Reference vs value, shallow vs deep copy, mutating vs non-mutating array methods (Week 1 / Day 3)
- [ ] [E] Promise chaining rules and async/await error handling (Week 1 / Day 4)
- [ ] [E] Predict output with timers, nextTick, promises, async functions (Week 1 / Day 5)
- [ ] [E] Choose between `all`, `allSettled`, `race`, `any` and name 5 async mistakes (Week 1 / Day 6)
- [ ] [A] Implement a concurrency limiter and a retry helper (Day 52 drills D52-1, D52-2)

#### 2. Node.js

- [ ] [E] Explain V8, libuv, the event loop phases, and blocking vs non-blocking (Week 2 / Day 1-2)
- [ ] [E] Say which operations use the OS vs the thread pool vs the event loop, without overclaiming (Week 2 / Day 2)
- [ ] [E] Compare CommonJS and ESM and describe common migration bugs (Week 2 / Day 3)
- [ ] [E] Explain streams, backpressure, `pipeline`, and when to use them (Week 2 / Day 4-5)
- [ ] [E] Explain EventEmitter and the `error` event rule (Week 2 / Day 5)
- [ ] [E] Describe memory leaks: causes, how to diagnose with heap snapshots (Week 2 / Day 6)
- [ ] [A] Explain worker threads vs cluster vs containers and event loop lag monitoring

#### 3. Express and REST

- [ ] [E] Walk through the HTTP request-response lifecycle and choose methods/status codes correctly (Week 3 / Day 1)
- [ ] [E] Explain REST principles and design resource routes (Week 3 / Day 2)
- [ ] [E] Explain middleware, ordering, validation, centralized error handling (Week 3 / Day 3-4)
- [ ] [E] Implement pagination, filtering, whitelisted sorting (Week 3 / Day 5)
- [ ] [E] Explain CORS and debug a CORS failure (Week 3 / Day 6)
- [ ] [E] Know what changed in Express 5 (async errors, path syntax) (Week 3)
- [ ] [A] API versioning strategy and file-upload architecture

#### 4. MySQL and databases

- [ ] [E] Write joins, GROUP BY/HAVING, subqueries, anti-joins from memory (Week 4 / Day 2; Day 51 drill)
- [ ] [E] Explain keys, constraints, normalization with an example (Week 4 / Day 1, 3)
- [ ] [E] Explain indexes, composite index order, leftmost prefix, covering index (Week 4 / Day 3)
- [ ] [E] Explain ACID, isolation levels, lost update and its fixes (Week 4 / Day 4)
- [ ] [E] Explain deadlocks and handle them in code (Week 4 / Day 5)
- [ ] [E] Read an EXPLAIN output and fix a slow query (Week 4 / Day 6)
- [ ] [E] Explain pooling and pool sizing (Week 4 / Day 5; Week 5 / Day 1)
- [ ] [A] Keyset pagination, window functions, optimistic locking

#### 5. MongoDB and SQL vs NoSQL

- [ ] [E] Explain documents, collections, indexes; embed vs reference (Week 5 / Day 2)
- [ ] [E] Write a basic aggregation pipeline ($match, $group, $sort) (Week 5 / Day 2)
- [ ] [E] Give a balanced SQL vs NoSQL answer (Week 5 / Day 2)
- [ ] [A] Replica sets, sharding concepts, multi-document transactions

#### 6. Authentication and security

- [ ] [E] bcrypt hashing, salt, cost; signup/login flow (Week 5 / Day 3)
- [ ] [E] JWT structure, verification, pinned algorithm (Week 5 / Day 3)
- [ ] [E] Access vs refresh tokens, rotation, sessions vs JWT (Week 5 / Day 4)
- [ ] [E] Authn vs authz, RBAC, ownership checks (IDOR) (Week 5 / Day 4)
- [ ] [E] SQL injection, XSS, CSRF, CORS, rate limiting: attack + fix for each (Week 5 / Day 5)
- [ ] [E] Secrets management and production security mistakes (Week 5 / Day 6)
- [ ] [A] Password reset flow, SSRF, prototype pollution, alg confusion

#### 7. Testing and production engineering

- [ ] [E] Unit vs integration tests; Jest/Vitest + Supertest; mocking boundaries only (Week 6 / Day 1)
- [ ] [E] Write negative tests (401, 403, 404, 422, 409) (Week 6 / Day 1)
- [ ] [E] Structured logging, correlation IDs, error logging rules (Week 6 / Day 2)
- [ ] [E] Timeouts, retries with backoff and jitter, idempotency (Week 6 / Day 3)
- [ ] [E] Redis caching: cache-aside, TTL, invalidation, stampede (Week 6 / Day 4)
- [ ] [E] Background jobs, queues, graceful shutdown (Week 6 / Day 5)
- [ ] [E] Diagnose a slow API and a memory leak; run a basic load test (Week 6 / Day 6; Day 53 incidents)

#### 8. System design

- [ ] [E] Use the 8-step framework and start with the simplest design (Day 54)
- [ ] [E] Explain modular monolith vs microservices honestly (Week 7 / Day 1)
- [ ] [E] Design rate limiter, URL shortener, notification system (Week 7 / Day 2-3)
- [ ] [E] Design a payment/checkout flow with idempotency and reconciliation (Week 7 / Day 4)
- [ ] [E] Explain queues, retries, DLQ, logging/metrics/monitoring (Week 7 / Day 5)
- [ ] [E] Docker and deployment basics (image, container, env, health checks) (Week 7 / Day 6)
- [ ] [A] Outbox pattern, saga, sharding, consistency trade-offs

#### 9. Project (Task Management API)

- [ ] [E] 2-minute pitch without notes (Day 54)
- [ ] [E] Can open any file and explain it line by line; can add a small feature live (soft delete, new filter)
- [ ] [E] README explains setup, env vars, endpoints, and how to run tests (12_Project_Task_API.md Stage 7)
- [ ] [E] The repository is public or shareable, has a clean commit history, no secrets, and a lockfile
- [ ] [A] At least one extension done (Redis cache, background job, Docker)

#### 10. Behavioral and logistics

- [ ] [E] Transition story (90 seconds and 2 minutes versions), practiced aloud (Day 55-56)
- [ ] [E] Two STAR stories ready: debugging, mistake/learning; one about teamwork/disagreement
- [ ] [E] "I don't know" template practiced (Day 54)
- [ ] [E] Four questions to ask the interviewer chosen
- [ ] [E] Resume reflects only what you can explain; skills list is honest
- [ ] [E] At least 4 mock sets done; last mock at 70 percent or more with no red flags
- [ ] [E] Environment ready: stable internet, editor set up (Node 22, no AI autocomplete for the mock), sample project runs

#### Day-before and day-of checklist

- [ ] Re-read cheat sheets 1-6 (45 minutes), not new material.
- [ ] Skim your project README and schema; run the test suite once.
- [ ] Re-read the job description; map 5 of its keywords to your preparation.
- [ ] Prepare the pitch, the transition story, and your questions.
- [ ] Sleep. A rested candidate beats an extra hour of cramming.
- [ ] During: clarify before answering, answer first then explain, think aloud in coding, state trade-offs, say
      "I don't know, but here is how I would find out" when needed, and never bluff.

---

### Honest readiness assessment

This section is deliberately blunt, because calibration helps you apply to the right roles and avoid
disappointment.

#### What 112 hours can realistically give you

Two hours a day for eight weeks is about 112 hours. That is a serious amount of focused study, equal to roughly
three full-time weeks, but it is still a short time for a new engineering discipline. You will have breadth and a solid
fundamentals base; you will not have the depth that comes from years of production exposure.

**You can realistically:**

- Explain the Node.js runtime, the event loop, asynchronous patterns, and common pitfalls accurately.
- Build a REST API in Express with layered structure, validation, authentication, RBAC, error handling,
  and tests, and explain every decision.
- Write correct SQL for typical interview queries and reason about indexes, transactions, and isolation at a
  working level.
- Discuss authentication and common vulnerabilities with the correct mitigations.
- Talk through system design for classic problems using a sensible framework, with honest trade-offs.
- Debug typical issues (slow query, leak, blocked loop, pool exhaustion) by following a structured approach.
- Pass screening and first-round technical interviews for many **junior** Node.js backend or full-stack (backend-leaning)
  roles, especially at companies that value frontend experience and good fundamentals.

**You realistically cannot (yet):**

- Claim production backend experience: operating a service under load, on-call experience, real incident ownership,
  handling real data migrations, or multi-year system evolution.
- Design and defend large distributed systems (multi-region, sharding strategy, consensus, Kafka at scale).
- Have deep database expertise: query optimizer internals, replication topologies, partitioning, online schema
  migration at scale, MySQL tuning under real workloads.
- Have mastered every topic in this document. Redis, queues, Docker, and deployment are learned at a conceptual and
  small-project level; real mastery comes from using them in production.
- Be equivalent to a developer with 2-4 years of backend work, regardless of how many mock tests you pass.
  Interviewers detect depth quickly through follow-up questions on things you have not operated.
- Guarantee an offer. Outcomes depend on the market, the role, competition, interview performance, and luck.

#### Junior vs mid-level bar

| Dimension | Typical junior bar | Typical mid-level bar (2-4 years) | Where an 8-week candidate stands |
|-----------|-------------------|-----------------------------------|----------------------------------|
| JavaScript/Node | Core concepts, async, basic internals | Deep internals, performance, memory, streams in practice | Near junior bar; mid-level only in JS (from frontend years) |
| API development | Build CRUD with auth and validation | Design maintainable, versioned, documented APIs; own modules | Meets junior; partially mid on design principles |
| SQL/DB | Joins, basic indexes, transactions concept | Index design, query tuning, concurrency, migrations in production | Solid junior; mid-level gaps in practice and scale |
| Security | Knows hashing, JWT, SQLi, XSS basics | Threat modeling, secure defaults, incident awareness | Junior bar; mid needs real exposure |
| Testing | Writes basic tests | Test strategy, CI, flaky test handling | Junior bar if tests exist and are meaningful |
| Production | Awareness (logs, errors) | Owns reliability: monitoring, on-call, incident response | Awareness only; this is the main gap |
| System design | May not be asked deeply; basics | Designs services, trade-offs, scaling plans | Can discuss classic designs; not battle-tested |
| Autonomy | Needs guidance | Delivers features independently | Needs guidance on backend-specific decisions |
| Communication | Clear explanations | Explains trade-offs, mentors | Often a strength due to frontend and team experience |

#### Readiness bands (use your mock scores and checklist)

| Evidence | Interpretation | What to do |
|----------|----------------|------------|
| Sets 1-2 at 70%+, Set 4 at 65%+, 80%+ of [E] checklist items ticked | Ready to apply for **junior / associate / full-stack-with-backend** roles | Start applying now; keep practicing weekly |
| Set 3 at 70%+ and Set 4 at 75%+, real project depth, 90%+ of [E] and many [A] ticked | Can attempt **junior-plus / early mid-level** roles at companies that hire for potential, mainly where your frontend seniority is valued | Apply to both junior and mid; expect probing on production topics |
| Sets 1-2 below 60% or many red flags | Not ready yet | Use the catch-up plan; re-take Sets 1-2 after 1 week |
| Mid-level target but no production backend experience | Expect to be assessed against the production bar and likely not to pass senior-ish rounds | Target "mid frontend-heavy fullstack" or junior backend; build experience via a real deployed service or open-source contributions |

#### Strengths you bring as a frontend developer

- Strong JavaScript fluency and debugging habits.
- You know what good APIs feel like from the consumer side.
- Experience with product thinking, code review, working in teams, and browser behavior (CORS, cookies, caching).
- This often makes full-stack roles and teams with a strong JS/TypeScript culture the best first target.

#### Recommended next steps after Week 8 (the next 4-8 weeks)

1. **Apply while you keep learning.** Interviewing is a skill; real interviews are the best practice. Aim for
   5-10 applications per week with tailored resumes, and do a mock before each real interview.
2. **Deploy the Task API** (Docker + a small cloud VM or PaaS), add CI that runs tests, and add basic monitoring.
   "Deployed and monitored" is a major credibility boost over "runs locally".
3. **Add depth in one area** rather than ten shallow ones: Redis caching with measured results, or a queue with
   retries, or database performance with a seeded 1M-row table and documented index experiments.
4. **TypeScript for backend** if your target companies use it (many do). It was out of scope here.
5. **Continue spaced revision**: cheat sheets weekly, one timed machine-coding problem every two days, one mock every week.
6. **Contribute or build one more small service** (for example a URL shortener or webhook receiver) with tests, to broaden evidence.
7. **Keep an interview journal**: every question you could not answer, with the correct answer written in your words.

#### Resume and positioning advice (honest, not inflated)

- Title yourself accurately: "Frontend Developer transitioning to Node.js Backend" or "Full-Stack Developer (React, Node.js)".
- List the project with specific, verifiable bullets (endpoints, auth, tests, transactions), not claims like "scalable to millions".
- Do not list technologies you cannot discuss for 5 minutes (Kafka, Kubernetes, microservices) unless you have used them.
- Use your frontend years as real seniority in JavaScript, collaboration, and product delivery, and be upfront
  about being newer to backend.

#### Final message

Eight weeks will not make you a senior backend engineer, and it does not need to. It can make you a credible,
well-prepared junior backend candidate with unusually good JavaScript depth. The difference between candidates
who get offers and those who do not is often not knowledge but calibration: choosing the right roles, answering
clearly, admitting gaps professionally, and showing a project they truly understand. Keep practicing, apply
consistently, and treat each interview, including the ones that go badly, as data for the next one.

### Day 56 wrap-up

**Key concepts to remember**

1. Mock scores are a diagnostic, not a verdict; use them to prioritize revision.
2. Answer-first, then reasons, then an example, then trade-offs.
3. Production awareness (timeouts, idempotency, pools, graceful shutdown, observability) is what separates good junior answers.
4. Honesty about limits is a positive signal; bluffing is a red flag.
5. Depth in your project beats breadth of buzzwords.

**Five revision questions**

1. Which areas of the checklist remain unticked, and what is your plan to close each within a week?
2. How would you explain your transition to backend in 90 seconds?
3. What are three things you cannot claim after 8 weeks, and how would you phrase that honestly?
4. Which two incident patterns could you walk through from memory right now?
5. What does a junior vs a mid-level answer to "design a rate limiter" look like?

**Practical coding task (45 min)**

Pick the question from Sets 1-4 where you scored lowest in the coding round. Re-implement it from scratch, with tests,
and write a one-paragraph explanation of its complexity and failure modes.

**Self-assessment checklist**

- [ ] I completed Mock Sets 3 and 4 and logged the results.
- [ ] I ticked the readiness checklist honestly and made a plan for gaps.
- [ ] I read the readiness assessment and picked the right target roles.
- [ ] I have a one-week plan for deployment of the Task API and applications.
- [ ] I prepared my transition story, project pitch, and questions for the interviewer.

---

## Week 8 revision summary

**What Week 8 consolidated**

| Area | The 5 sentences you must be able to say |
|------|------------------------------------------|
| JS/Node | Single JS thread + libuv; sync -> nextTick -> promises -> macrotasks; network I/O uses OS polling, fs/dns.lookup/crypto/zlib use the pool; blocking the loop hurts everyone; streams with `pipeline` respect backpressure. |
| Express/REST | Layers: route -> controller -> service -> repository; middleware order; centralized 4-arg error handler last; correct status codes (401/403/404/409/422/429); whitelist sort fields; Express 5 forwards async errors. |
| MySQL | Joins/HAVING; composite index leftmost-prefix; EXPLAIN (`type`, `key`, `rows`, `Extra`); InnoDB default REPEATABLE READ; lost update fixes; deadlock = retry + consistent order; pool sizing across instances; keyset pagination. |
| MongoDB | Embed vs reference; compound indexes; `$match` first; COLLSCAN vs IXSCAN; SQL by default for relational/money. |
| Security | bcrypt/argon2; short access + rotating refresh; pinned JWT algorithm; parameterized SQL + whitelist; IDOR via scoped queries; CSRF vs CORS vs XSS; rate limit login; secrets outside git. |
| Production | Timeouts everywhere; retry with backoff + jitter only when idempotent; idempotency keys; pool `finally release`; graceful shutdown; stampede protection; structured logs with request id. |
| System design | 8-step framework; simplest design first; scale ladder; at-least-once + idempotent consumers; outbox; payments need a state machine and reconciliation. |
| Behavioral | Transition story with evidence; STAR stories; honest gaps; "I don't know" template; ask good questions. |

**Spaced revision for Week 8 material (do these after Day 56)**

| Item | +1 day | +3 days | +7 days |
|------|--------|---------|---------|
| Cheat sheets 1-2 (JS, Node) | re-read, speak 3 answers | output-prediction drill P1-P12 again | one mock-style 10-minute round |
| Cheat sheets 3-5 (Express, SQL, Mongo) | rewrite 4 SQL queries | explain EXPLAIN + indexes aloud | Set 2 Round B again |
| Cheat sheet 6 + D52 drills | redo D52-3 and D52-5 | redo D52-6 | Set 3 Round C again |
| Incident scenarios + M1-M5 | retell 3 incidents aloud | redo M4 or M3 from scratch | redo M5 and compare |
| Design skeletons | speak rate limiter design | speak payment flow | full 15-minute design, timed |
| Project Q&A | pitch aloud | answer P-04, P-06, P-13 | live-modify task: add a filter |
| Behavioral | 90-second transition story | two STAR stories | record the full Round 6 again |

---

## Week 8 mixed-difficulty assessment

Time: 60 minutes, no notes. Score using the answers section below. Questions are grouped by difficulty;
do all of them. Suggested split: Basic 15 min, Intermediate 25 min, Advanced 20 min.

### Basic (8 questions)

**W8-B1.** What does this print?

```js
console.log(typeof null, typeof [], typeof undefined);
```

**W8-B2.** Which HTTP status code should `POST /tasks` return on successful creation, and which header should accompany it?

**W8-B3.** What does `next()` do in Express middleware, and what happens if you forget to call it (and do not send a response)?

**W8-B4.** What is the difference between `WHERE` and `HAVING`?

**W8-B5.** Why are passwords hashed with bcrypt rather than encrypted or hashed with SHA-256?

**W8-B6.** Does a correct CORS configuration prevent `curl` or a mobile app from calling your API?

**W8-B7.** Which HTTP methods are idempotent by definition?

**W8-B8.** Name two Node.js operations that use the libuv thread pool and one that does not.

### Intermediate (9 questions)

**W8-I1.** What is the output order?

```js
async function a() {
  console.log('a1');
  await b();
  console.log('a2');
}
async function b() {
  console.log('b');
}
console.log('s1');
a();
Promise.resolve().then(() => console.log('p'));
console.log('s2');
```

**W8-I2.** Design the best composite index for: `SELECT id, title FROM tasks WHERE owner_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20`.

**W8-I3.** List every problem in this handler and show a corrected version.

```js
app.get('/tasks', async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM tasks WHERE title LIKE '%${req.query.q}%'`);
  res.json(rows);
});
```

**W8-I4.** Why is `items.forEach(async (i) => { await save(i); })` followed by `res.json(...)` a bug, and what are two correct alternatives?

**W8-I5.** Explain refresh-token rotation with reuse detection and what threat it addresses.

**W8-I6.** Why do an in-memory rate limiter and in-memory sessions break when you run three instances behind a load balancer? What fixes it?

**W8-I7.** What is wrong with this transaction code?

```js
const conn = await pool.getConnection();
await conn.beginTransaction();
await conn.execute('UPDATE accounts SET balance_minor = balance_minor - ? WHERE id = ?', [100, 1]);
await conn.execute('UPDATE accounts SET balance_minor = balance_minor + ? WHERE id = ?', [100, 2]);
await conn.commit();
conn.release();
```

**W8-I8.** A request with an expired JWT and a request from a `member` calling an admin-only endpoint: which status codes, and why?

**W8-I9.** `Promise.race([fetchData(), timeout(3000)])` is a common timeout pattern. What does it NOT do, and what is better?

### Advanced (7 questions)

**W8-A1.** What happens when you run this, and why?

```js
function loop() { process.nextTick(loop); }
setTimeout(() => console.log('timer'), 0);
loop();
```

**W8-A2.** The payment gateway call times out after 5 seconds. Should you retry the charge? Describe the correct handling.

**W8-A3.** Your read-heavy endpoint's traffic grows 10x. List, in order, the steps you would take before introducing microservices.

**W8-A4.** Explain cache stampede and give four mitigations.

**W8-A5.** Distinguish MySQL error 1213 from 1205 and explain how your code should handle each.

**W8-A6.** Give a write-skew example under InnoDB REPEATABLE READ and two ways to prevent it.

**W8-A7.** `process.memoryUsage()` shows `heapUsed` flat but `rss` climbing. What can cause this, and how do you investigate?

---

## Answers with explanations

### Basic

**W8-B1.** `object object undefined`. `typeof null` is `"object"` (a historical bug retained for compatibility); arrays are
objects; an undefined value gives `"undefined"`. Use `Array.isArray` and `=== null` for real checks.

**W8-B2.** 201 Created, with a `Location` header pointing to the new resource (e.g. `/tasks/42`), and typically the created
resource in the body. 200 is acceptable in some APIs but 201 is the precise semantic.

**W8-B3.** `next()` passes control to the next middleware or route handler. If you neither call `next()` nor send a response,
the request hangs until the client or server times out. Calling `next(err)` jumps to the error-handling middleware.

**W8-B4.** `WHERE` filters individual rows before grouping and cannot use aggregates; `HAVING` filters groups after
aggregation and can use aggregate functions (e.g. `HAVING COUNT(*) > 10`). Prefer `WHERE` for filters that do not need
aggregates because it reduces rows earlier.

**W8-B5.** Encryption is reversible: anyone with the key can recover all passwords. SHA-256 is fast and unsalted by default,
so attackers can test billions of guesses per second. bcrypt (or argon2/scrypt) is one-way, salted per password, and deliberately slow
with a tunable cost factor, which makes offline cracking expensive.

**W8-B6.** No. CORS is enforced by browsers only; curl and mobile apps ignore it. It controls which web origins' scripts can read
responses. Authentication and authorization must still be enforced server-side.

**W8-B7.** GET, HEAD, OPTIONS, PUT, DELETE (and TRACE) are idempotent by definition; GET/HEAD/OPTIONS are also safe. POST is not
idempotent, and PATCH is not guaranteed to be. "Idempotent" concerns the server state after repeated identical requests,
not the response bodies, which may differ (e.g. DELETE returning 404 the second time).

**W8-B8.** Thread pool: `fs` operations, `dns.lookup`, `zlib`, and `crypto.pbkdf2/scrypt/randomBytes`
(and bcrypt's native addon). Not thread pool: TCP/HTTP socket I/O, which uses OS polling (epoll/kqueue/IOCP); timers also do not use it.

### Intermediate

**W8-I1.** `s1, a1, b, s2, a2, p`. Synchronous code first: `s1`, then `a()` runs synchronously: `a1`, then `b()` runs and logs `b`
and returns a resolved promise; `await` on that already-resolved native promise queues the continuation immediately as a microtask. Then
`Promise.resolve().then(...)` queues `p` after it. `s2` logs synchronously. Microtasks then run in queue order: `a2`, then `p`.
(The ordering of `a2` before `p` depends on modern engine behaviour for awaiting native promises: one microtask tick. In very old
engines, `await` took three ticks.)

**W8-I2.** Index `(owner_id, status, created_at)`. Equality columns come first (owner_id, status), and the sort column last, so
MySQL seeks to the matching group and reads rows already ordered by created_at (it can read the index backwards for DESC),
stopping after 20 rows with no filesort. Selecting only `id, title` means `SELECT *` is avoided; adding `id`/`title` to the index
could make it covering but costs size. Verify with `EXPLAIN`.

**W8-I3.** Problems: (1) SQL injection via string interpolation of `req.query.q`; (2) `pool.query` with string-built SQL instead of
placeholders; (3) `SELECT *` may expose sensitive columns; (4) `LIKE '%...%'` with a leading wildcard cannot use a B-tree index (full scan);
(5) no pagination or limit; (6) no authentication or owner scoping; (7) no input validation (missing or non-string `q`); (8) no error handling
(fine in Express 5, a crash path in 4). Corrected:

```js
app.get('/tasks', authenticate, async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 100) : '';
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const escaped = q.replace(/[\\%_]/g, '\\$&'); // escape LIKE wildcards in user input
  const [rows] = await pool.execute(
    'SELECT id, title, status, created_at FROM tasks WHERE owner_id = ? AND title LIKE ? ORDER BY created_at DESC, id DESC LIMIT ?',
    [req.user.id, `%${escaped}%`, String(limit)],
  );
  res.json({ data: rows, limit });
});
```

Note: with `mysql2` prepared statements (`execute`), a numeric `LIMIT ?` parameter can raise an error in some versions/setups
when passed as a JavaScript number; passing it as a string or using `query()` with a validated integer are the usual workarounds, so
test this on your driver version. For substring search at scale use a FULLTEXT index or a search engine.

**W8-I4.** `forEach` ignores returned promises, so the async callbacks start but nothing waits for them: `res.json` runs before the
saves finish, and failures become unhandled rejections. Alternatives: `await Promise.all(items.map((i) => save(i)))` (parallel; use a
concurrency limit for large arrays) or a sequential `for (const i of items) { await save(i); }` when order or load matters; use
a transaction/bulk insert if the saves must be atomic.

**W8-I5.** Each refresh token is single-use: on `/refresh` the server verifies the presented token (hash lookup), issues a new access token and a new
refresh token, and marks the old one as used (or deletes it). If an already-used token is presented again, either the legitimate client or an
attacker holds a stolen copy, so the server revokes the whole token family and forces re-login. It limits the damage window of stolen refresh tokens
and makes theft detectable.

**W8-I6.** State kept in process memory is per instance. With three instances, a limiter allows up to 3x the limit and a session created
on instance A is unknown to B (unless sticky sessions). Fix with shared state: Redis for counters (atomic Lua/INCR with expiry) and sessions, or stateless signed
tokens (JWT) with a server-side store only for refresh tokens. Sticky sessions are a workaround that hurts balancing and failover.

**W8-I7.** No `try/catch/finally`: if any query throws, the transaction is never rolled back and the connection is never released, leaking
a pool connection that holds locks (eventually exhausting the pool). Correct pattern: `try { begin; ...; commit } catch { rollback; throw } finally { release }`.
Also consider lock ordering and an overdraft check (see D52-5).

**W8-I8.** Expired JWT -> 401 Unauthorized (authentication failed; the client should refresh the token). Valid token but role `member`
on an admin route -> 403 Forbidden (authenticated but not permitted). The distinction tells the client what to do: refresh/login vs
stop (permission issue).

**W8-I9.** `Promise.race` only stops *waiting*; it does not cancel the losing operation, so `fetchData()` keeps running (consuming
sockets, DB connections, CPU), and the timeout timer may stay pending if not cleared. Better: pass an `AbortSignal` with
`AbortSignal.timeout(3000)` to `fetch` (or to APIs that support signals) so the work is actually cancelled, and map the abort error
to a clear timeout response.

### Advanced

**W8-A1.** `'timer'` is never printed and the process pegs a CPU at 100 percent: each `nextTick` callback schedules another before the
event loop is allowed to continue, so the timers phase is never reached (I/O starvation). Same risk with an endless chain of promise
microtasks. Use `setImmediate` for recursion that must yield to the loop. (Node docs describe the nextTick queue as processed after the
current operation completes, fully drained before moving on.)

**W8-A2.** Do not blindly retry the charge; a timeout means the outcome is unknown (the gateway may have charged). Correct handling: send an
idempotency key with every charge attempt so a retry with the same key cannot double charge; mark the payment `pending` in your DB;
query the gateway by key/reference or wait for the webhook (verify signature, handle duplicates by unique event id); a reconciliation job
compares your records with the gateway's reports; only after confirming that the charge did not happen, allow a new attempt. Tell the user the
payment is "processing" rather than failed. Set sensible timeouts and use a circuit breaker for the gateway.

**W8-A3.** (1) Measure: profile and find the bottleneck. (2) Fix queries/indexes, remove N+1, add keyset pagination. (3) Size connection pool; make the app
stateless. (4) Cache hot reads in Redis (cache-aside, TTL, invalidation) and HTTP caching/CDN where possible. (5) Scale the app horizontally
behind a load balancer. (6) Add read replicas and route tolerant reads there (accept replica lag). (7) Move slow work to queues. (8) Rate limit and protect
the DB (bulkheads). (9) Only then consider sharding or service extraction if there is a team/scale reason. Each step justified by measurement.

**W8-A4.** A stampede (thundering herd) occurs when a hot key expires or the cache is flushed and many concurrent requests all miss and hit the database at once, possibly
overloading it. Mitigations: (1) coalesce concurrent loads per key (single-flight / in-flight promise map); (2) distributed lock so one worker refills (`SET key NX PX`);
(3) TTL jitter to avoid synchronized expiry; (4) serve stale while revalidating (soft TTL); (5) pre-warm critical keys; (6) rate limit or circuit-break the DB path.

**W8-A5.** 1213 `ER_LOCK_DEADLOCK`: a deadlock cycle was detected and InnoDB rolled back one transaction; the entire transaction is lost, so the
application should retry the whole transaction (bounded retries, small randomized backoff) and fix the cause (lock ordering, indexes, short transactions).
1205 `ER_LOCK_WAIT_TIMEOUT`: a statement waited longer than `innodb_lock_wait_timeout` for a lock held by another transaction (no cycle needed);
by default only the statement is rolled back (not the whole transaction), so handle by rolling back and retrying or failing with a clear error, and find the
long-running transaction holding the lock.

**W8-A6.** Classic write skew: a hospital requires at least one doctor on call. Doctors A and B both read "2 on call", each sets themselves off-call in
separate transactions; each update touches a different row, so no row conflict occurs and both commit, leaving 0 on call. REPEATABLE READ snapshots do not
prevent this. Prevention: `SELECT ... FOR UPDATE` on all rows that form the invariant (locks the set), or run at SERIALIZABLE,
or enforce the invariant via a single row (a counter row updated atomically) or a constraint/trigger-based check, plus retry on conflict.

**W8-A7.** Heap is flat, so JS objects are not the problem; memory is outside the V8 heap: Buffers (`external`/`arrayBuffers` in memoryUsage), native
addons, many open sockets/streams, large Buffer pools, fragmentation, or too many worker threads. Investigate: log all fields of `process.memoryUsage()`
(`external`, `arrayBuffers`) over time; check for unconsumed streams or Buffers being retained (e.g. buffered uploads), unclosed
file/socket handles (`process.getActiveResourcesInfo()`), and native module issues; use OS-level tools (e.g. `pmap`, container metrics) and consider
`--max-old-space-size` irrelevant here since it limits only the V8 heap.

### Scoring the assessment

- Basic: 8 questions x 1 point = 8. Intermediate: 9 x 2 = 18. Advanced: 7 x 3 = 21. Total 47.
- 38+ (80%): strong. 33-37 (70-79%): ready, polish gaps. 26-32 (55-69%): revise weak areas below, retake in 3 days. Below 26: use the catch-up plan.
- Award full points only if you stated the key mechanism and a reason, not only a keyword.

---

## Weak-area identification guidance

**Step 1 -- Collect evidence.** Use (a) the four mock set scores per round, (b) the assessment by difficulty, (c) the
readiness checklist unticked items, (d) the questions you scored 0-2 on.

**Step 2 -- Map the evidence to an area.**

| If you lose points on... | Likely weak area | Go to | Fix action (time) |
|--------------------------|------------------|-------|-------------------|
| Output prediction, closures, `this` | JS fundamentals | Week 1 / Day 1-2, 5 | redo P1-P12 + 10 new snippets (60 min) |
| Promise combinators, async bugs | Async programming | Week 1 / Day 4, 6 | EX-ASYNC drills, D52-1/D52-2 (60 min) |
| Thread pool, loop phases, streams | Node internals | Week 2 / Day 2, 4-5 | redraw the OS vs pool table, one stream pipeline (60 min) |
| Leaks, memory, GC | Memory | Week 2 / Day 6 | Incident 2 walkthrough + M4 (45 min) |
| Status codes, REST design | HTTP/REST | Week 3 / Day 1-2 | design 5 resources + codes (45 min) |
| Middleware, error handler, validation | Express | Week 3 / Day 3-4 | M5 from scratch (60 min) |
| Joins, grouping, window functions | SQL basics | Week 4 / Day 2 | Day 51 drill, 8 queries (45 min) |
| Index design, EXPLAIN | Indexing | Week 4 / Day 3, 6 | explain 5 indexes + EXPLAIN reading (60 min) |
| Transactions, isolation, deadlock | Concurrency | Week 4 / Day 4-5 | D52-5 + Incident 6 (60 min) |
| Pool, mysql2 usage | Data access | Week 5 / Day 1 | Incident 4 + pool code (30 min) |
| Mongo modeling | MongoDB | Week 5 / Day 2 | 3 embed/reference decisions (30 min) |
| Hashing, JWT, tokens | Auth | Week 5 / Day 3-4 | D52-3/D52-4 + S1-S7 (60 min) |
| Attack/mitigation pairs | Security | Week 5 / Day 5-6 | attack table recall (30 min) |
| Test strategy, mocks | Testing | Week 6 / Day 1 | write 5 negative tests (60 min) |
| Retries, idempotency, caching | Reliability | Week 6 / Day 3-4 | D52-2, D52-6, M4 (75 min) |
| Queues, shutdown, load testing | Production | Week 6 / Day 5-6 | M3 + Incident 7 (60 min) |
| Design structure, trade-offs | System design | Week 7 / Day 1-6 | 3 timed designs aloud (90 min) |
| Project explanation | Project | 12_Project_Task_API.md; Day 54 Part B | rehearse pitch + 8 answers (45 min) |
| Behavioral | Communication | Day 55-56 Round E/6 | 3 recorded stories (45 min) |

**Step 3 -- Classify severity.** If a topic is `[ESSENTIAL]` and you scored 0-2: critical, fix before applying. `[ADVANCED]`:
note for later. Fix at most three weak areas per day; more than that dilutes the effort.

**Step 4 -- Re-test.** After fixing, re-answer the exact missed questions after 1, 3, and 7 days (spaced revision).

**Pattern warnings**

- High on knowledge answers, low on communication scores: practice structure (answer first), shorter answers, fewer filler words.
- High on theory, low on coding: do a timed machine-coding problem daily for a week.
- High on coding, low on design: practice drawing the data flow and failure cases, not code.
- Good on everything except the project: reread your code; modify it live; you may have followed along without ownership.

---

## Catch-up plan if behind

Be realistic: it is better to finish a smaller, correct plan than to skim everything. Choose the row that matches
your situation.

| Situation | Plan |
|-----------|------|
| **1-2 days behind** | Use Day 7 slack (revision day). Do the missed days' Part A reading + the coding task; skip optional [ADVANCED] parts. Compress mock sets: do Sets 1 and 4 only if short on time. |
| **3-5 days behind** | Drop deep re-reads. Per area, do only the cheat sheet (Days 50-52), 6 key incident scenarios, 3 machine-coding (M1, M4, M5), design skeletons for rate limiter, URL shortener, and payment, and Mock Sets 2 and 4. About 14 hours. |
| **A full week behind** | Prioritize `[ESSENTIAL]` only. Use this 12-hour minimum viable Week 8 (below). Postpone applying by 3-5 days, or apply while finishing. |
| **Two weeks or more behind** | Do not compress Week 8. Spend the extra time on the earliest incomplete week's Day 7 assessment, then redo Week 8 normally. A 10-week plan done well beats an 8-week plan done superficially. |

**Minimum viable Week 8 (about 12 hours, in this order)**

1. (2 h) Cheat sheets 1, 2, 6: speak each aloud; drill P1-P12.
2. (1.5 h) Cheat sheets 3-5 + SQL drill (8 queries).
3. (2 h) D52-1, D52-3, D52-5, D52-6 timed.
4. (1.5 h) Incidents 1, 2, 4, 5 walkthroughs aloud.
5. (1.5 h) M4 and M5 timed (or M1).
6. (1 h) Design skeletons: rate limiter, URL shortener, payment (8-step framework aloud).
7. (1 h) Project pitch + P-04, P-06, P-13, P-16.
8. (1.5 h) Mock Set 2 and Set 4 (shortened Round 6).

**Rules when behind**

- Never skip mocks entirely; they are the only way to find out what you cannot explain under pressure.
- Skip new reading before skipping practice. Retrieval beats re-reading.
- Drop `[ADVANCED]` items first (Mongo sharding, saga/outbox detail, worker threads details), never the essentials.
- If you can only add 30 minutes a day: one mock round (e.g. Round B of a set) per day, then the weak-area fix.
- Tell yourself the truth about the readiness band, and adjust the application target (junior vs junior-plus) accordingly.

---

## Appendix: Mock scoring sheet (copy per set)

| Round | Question | Score 0-4 (Hits) | Notes / what I missed |
|-------|----------|------------------|------------------------|
| A | | | |
| A | | | |
| A | | | |
| B | | | |
| B | | | |
| C | | | |
| D | | | |
| E | | | |
| Coding | | | |
| Communication (per round, 0-4) | A / B / C / D / E / Coding | | structure, clarity, terminology, trade-off mention |
| **Total** | | | |
| **Red flags** | | | |
| **Top 3 fixes** | 1. 2. 3. | | |

Hit-list scoring reminder: count only checkpoints you stated clearly and correctly out loud. If you needed to
read the model answer to recall it, the checkpoint is not scored. Re-run the question after 1, 3, and 7 days.

---

End of Week 8 file. Related files: 00_Master_Strategy_Schedule.md (full plan and spaced-revision schedule), 09_Question_Bank_A.md and
10_Question_Bank_B.md (question banks), 11_Coding_Exercises.md (exercise sets), 12_Project_Task_API.md (project stages).
