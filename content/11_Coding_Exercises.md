# 11 - Coding Exercises (Problems first, Solutions after the page break)

This file has TWO parts:

- **Part I - Problems** (everything you must attempt first). Statement, input/output examples, hints.
- **Part II - Solutions** (after the page break). Expected approach, reference solution, complexity, common mistakes.

Rule: Part I padho, khud try karo (at least 15-20 minutes per problem), phir Part II kholo. Agar seedha
solution padhoge to interview mein "samajh aaya tha, likh nahi paaya" wali problem aayegi.

---

## How to use this file

**Setup (once).** Node.js 22 LTS (Node 20 notes are mentioned where behaviour differs).

```bash
mkdir practice && cd practice
npm init -y
npm pkg set type=module
npm i express@5 mysql2 jsonwebtoken bcrypt ioredis
npm i -D vitest supertest
```

Every solution is an ES module (`import` / `export`). Save a solution as `ex-xxx.js` and run with
`node ex-xxx.js`. Tests run with `npx vitest run`.

**Tiers.** `[ESSENTIAL]` = asked in most junior/mid interviews. `[ADVANCED]` = supplementary, do it after
the essentials. **Difficulty** = Basic / Intermediate / Advanced.

**Honest note.** 8 weeks mein sab kuch master nahi hota. Priority: all `[ESSENTIAL]` first, then `[ADVANCED]`
if time remains. Rate limiter aur duplicate-transaction ladders ko last 2 weeks mein dobara karna.

**Which week supports which category**

| Category | ID prefix | Study before attempting |
|----------|-----------|-------------------------|
| Promises and async/await | EX-ASYNC | Week 1 / Day 4, Day 6 |
| Event loop output prediction | EX-LOOP | Week 1 / Day 5, Week 2 / Day 2 |
| Array and object manipulation | EX-ARR | Week 1 / Day 3 |
| Asynchronous error handling | EX-ERR | Week 1 / Day 4, Week 2 / Day 5 |
| Express CRUD APIs | EX-EXP | Week 3 / Day 2-5 |
| Request validation and middleware | EX-MW | Week 3 / Day 3-4 |
| SQL joins and aggregation | EX-SQL | Week 4 / Day 1-2 |
| Transaction-safe DB operations | EX-TXN | Week 4 / Day 4-5, Week 5 / Day 1 |
| JWT authentication | EX-JWT | Week 5 / Day 3-4 |
| API testing | EX-TEST | Week 6 / Day 1 |
| Debugging slow or failing APIs | EX-DEBUG | Week 6 / Day 6 |
| Rate limiter | EX-RATE | Week 5 / Day 5, Week 7 / Day 2 |
| Duplicate transaction prevention | EX-IDEM | Week 6 / Day 3, Week 7 / Day 4 |

## Table of contents

**Part I - Problems**

1. EX-ASYNC-01..07 Promises and async/await
2. EX-LOOP-01..06 Event loop output prediction
3. EX-ARR-01..06 Array and object manipulation
4. EX-ERR-01..06 Asynchronous error handling
5. EX-EXP-01..06 Express CRUD APIs
6. EX-MW-01..06 Request validation and middleware
7. EX-SQL-01..08 SQL joins and aggregation (shared schema + data)
8. EX-TXN-01..07 Transaction-safe database operations
9. EX-JWT-01..06 JWT authentication
10. EX-TEST-01..06 API testing
11. EX-DEBUG-01..08 Debugging slow or failing APIs
12. EX-RATE-01..07 Rate limiter (progressive ladder)
13. EX-IDEM-01..07 Preventing duplicate transaction requests (progressive ladder)

**Part II - Solutions** (same order, same IDs)

---

# PART I - PROBLEMS

---

## 1. Promises and async/await (EX-ASYNC)

### EX-ASYNC-01 - Write your own `promisify` [ESSENTIAL] (Basic)

**Problem.** Implement `promisify(fn)`. `fn` is a Node-style function whose LAST argument is a callback
`(err, result) => void`. `promisify(fn)` must return a new function that returns a Promise: it resolves with
`result`, or rejects with `err`. It must preserve `this`, and it must reject (not throw) if `fn` throws
synchronously.

**Examples.**

```js
function fakeRead(path, cb) {
  setTimeout(() => (path === 'a.txt' ? cb(null, 'hello') : cb(new Error('ENOENT'))), 10);
}
const read = promisify(fakeRead);
await read('a.txt');   // 'hello'
await read('b.txt');   // rejects: Error: ENOENT
```

**Hints.**
1. Return `function (...args)` (not an arrow) so that `this` can be captured.
2. Promise constructor ke andar `fn.call(this, ...args, callback)` chalao.
3. `new Promise` executor ke andar sync throw automatically reject ban jaata hai.

### EX-ASYNC-02 - Sequential vs parallel runner [ESSENTIAL] (Basic)

**Problem.** Given `tasks`, an array of functions that each return a Promise, implement
`runSequential(tasks)` and `runParallel(tasks)`. Both return a Promise of the results array in the SAME order
as `tasks`. `runSequential` starts task `i+1` only after task `i` finishes and stops at the first rejection
(later tasks must NOT start). `runParallel` starts all tasks immediately.

**Examples.**

```js
const task = (ms, v) => () => new Promise((r) => setTimeout(() => r(v), ms));
await runSequential([task(100, 'a'), task(100, 'b'), task(100, 'c')]); // ['a','b','c'] after ~300 ms
await runParallel([task(100, 'a'), task(100, 'b'), task(100, 'c')]);   // ['a','b','c'] after ~100 ms
```

**Hints.**
1. Sequential ke liye `for...of` + `await` use karo.
2. Parallel ke liye tasks ko `map(t => t())` karke `Promise.all`.
3. `reduce` se bhi sequential ban sakta hai, par loop zyada readable hai.

### EX-ASYNC-03 - `retry` with exponential backoff [ESSENTIAL] (Intermediate)

**Problem.** Implement `retry(fn, options)`.

- `fn` is `async (attempt) => value` (`attempt` starts at 1).
- Options: `retries` (number of RETRIES after the first try, default 3), `baseDelayMs` (default 100),
  `factor` (default 2), `maxDelayMs` (default 5000), `shouldRetry(err)` (default: always true),
  `sleep(ms)` (injectable so tests do not wait; default real sleep).
- Delay before retry `n` (n = 1, 2, ...) is `min(maxDelayMs, baseDelayMs * factor^(n-1))`.
- Return the first successful value. If all attempts fail (or `shouldRetry` returns false), throw the LAST error.

**Examples.**

```js
let calls = 0;
const flaky = async () => { calls++; if (calls < 3) throw new Error('boom'); return 'ok'; };
await retry(flaky, { baseDelayMs: 100 }); // 'ok'; sleeps were 100 then 200; calls === 3
```

**Hints.**
1. Total attempts = `retries + 1`.
2. Last attempt ke baad sleep mat karo.
3. `sleep` injectable rakho, taaki test mein delay sequence array mein capture kar sako.

### EX-ASYNC-04 - `withTimeout` with real cancellation [ESSENTIAL] (Intermediate)

**Problem.** Implement `withTimeout(fn, ms)` where `fn` is `async (signal) => value` and `signal` is an
`AbortSignal`. If `fn` does not settle within `ms`, abort the signal and reject with a `TimeoutError`
(`name === 'TimeoutError'`). The timer MUST be cleared when `fn` settles first (otherwise the process stays
alive). If `fn` finishes first, return its value or rethrow its error.

**Examples.**

```js
const slow = (signal) => new Promise((resolve, reject) => {
  const t = setTimeout(() => resolve('late'), 500);
  signal.addEventListener('abort', () => { clearTimeout(t); reject(signal.reason); });
});
await withTimeout(slow, 50);  // rejects TimeoutError after ~50 ms, slow's timer is cancelled
await withTimeout(async () => 'fast', 50); // 'fast'
```

**Hints.**
1. `AbortController` banao; timer fire hone par `controller.abort(new TimeoutError(...))`.
2. `Promise.race([fn(signal), timeoutPromise])` use kar sakte ho, but timer ko `finally` mein clear karo.
3. `AbortSignal.timeout(ms)` bhi hai, par us case mein "fn settle hone par timer clear" apne control mein nahi hota -- yahan manual karo.

### EX-ASYNC-05 - `mapLimit` (bounded concurrency) [ESSENTIAL] (Intermediate)

**Problem.** Implement `mapLimit(items, limit, asyncFn)`. It calls `asyncFn(item, index)` for every item with at
most `limit` calls in flight at any time, and returns results in the ORIGINAL order. If any call rejects, the
returned Promise rejects and no NEW calls should start after that.

**Examples.**

```js
// 10 items, each takes 100 ms, limit 3 -> about 400 ms total, never more than 3 running together
const out = await mapLimit([1,2,3,4,5,6,7,8,9,10], 3, async (n) => n * 2);
// [2,4,6,8,10,12,14,16,18,20]
```

**Hints.**
1. Worker pattern: `limit` workers, sab ek shared `next` index se items uthate hain.
2. JS single-threaded hai, isliye `next++` ke beech race nahi hoti (await ke beech hota hai, increment sync hai).
3. Failure par ek `failed` flag set karo taaki workers naye item na uthayein.

### EX-ASYNC-06 - Implement `Promise.all` from scratch [ESSENTIAL] (Intermediate)

**Problem.** Implement `promiseAll(iterable)` with the same observable behaviour as `Promise.all`: accepts any
iterable of values or promises (plain values allowed), resolves with results in input order, rejects with the
FIRST rejection reason, resolves with `[]` for an empty iterable.

**Examples.**

```js
await promiseAll([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 10))]); // [1,2,3]
await promiseAll([]);                                                                      // []
await promiseAll([Promise.resolve(1), Promise.reject(new Error('x'))]);                   // rejects Error: x
```

**Hints.**
1. Counter rakho: `remaining`; har resolve par decrement, 0 par resolve karo.
2. Results ko index pe store karo (push mat karo, order bigad jaayega).
3. Plain value ko `Promise.resolve(value)` se wrap karo. Empty array ko alag handle karo.

### EX-ASYNC-07 - Single-flight async memoization [ADVANCED] (Advanced)

**Problem.** Implement `singleFlight(fn)`. It returns `cached(key)`. While a call for `key` is in flight,
all other calls with the same `key` must share the same Promise (so `fn` runs once). Successful results are
cached for `ttlMs` (second argument, default 1000; use injectable `now()` third argument). Rejections must NOT
be cached (next call retries). This is the "cache stampede" protection for a hot key.

**Examples.**

```js
let hits = 0;
const load = singleFlight(async (id) => { hits++; await sleep(50); return { id }; }, 1000);
await Promise.all([load('u1'), load('u1'), load('u1')]); // hits === 1
```

**Hints.**
1. Map mein Promise store karo (value nahi) -- yahi sharing hai.
2. Reject par entry delete karo, nahi to error cache ho jayega.
3. TTL expiry: promise resolve hone ke time `expiresAt` set karo.

---

## 2. Event loop output prediction (EX-LOOP)

Rules for all: ESM file, Node 22. Pehle khud output likho (paper par), phir run karke compare karo. Har problem
mein batao: "kyun" -- sirf output nahi.

### EX-LOOP-01 - Sync, microtask, macrotask [ESSENTIAL] (Basic)

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
```

**Problem.** Predict the exact output order and explain which queue each line uses.

**Hints.** 1) Sync code pehle. 2) Microtask queue timers se pehle drain hoti hai. 3) `setTimeout` timers phase mein.

### EX-LOOP-02 - `await` splits a function [ESSENTIAL] (Intermediate)

```js
async function first() {
  console.log('first start');
  await second();
  console.log('first end');
}
async function second() {
  console.log('second');
}
console.log('script start');
first();
new Promise((resolve) => {
  console.log('executor');
  resolve();
})
  .then(() => console.log('then 1'))
  .then(() => console.log('then 2'));
console.log('script end');
```

**Problem.** Predict the output. Explain when `first end` is queued relative to `then 1`.

**Hints.** 1) `await` ke baad ka code ek microtask ban jaata hai. 2) Promise executor synchronous hai. 3) Microtask FIFO hai.

### EX-LOOP-03 - nextTick, promise, queueMicrotask inside a timer [ESSENTIAL] (Intermediate)

```js
setTimeout(() => {
  console.log('timer');
  Promise.resolve().then(() => console.log('promise'));
  process.nextTick(() => console.log('nextTick'));
  queueMicrotask(() => console.log('microtask'));
  console.log('timer end');
}, 0);
```

**Problem.** Predict the output. Why did we put this inside a timer callback instead of top-level code of the
module? (Hint: top-level ESM code runs differently from a callback; answer in Part II.)

**Hints.** 1) `process.nextTick` queue promise microtask queue se pehle process hoti hai (callback ke baad). 2) Promise aur queueMicrotask same microtask queue mein FIFO hain.

### EX-LOOP-04 - setTimeout vs setImmediate inside an I/O callback [ESSENTIAL] (Intermediate)

```js
import { readFile } from 'node:fs';

readFile(import.meta.filename, () => {
  console.log('read done');
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
```

**Problem.** Predict the output. Then explain why the SAME two calls at the top level of the main module do
NOT have a guaranteed order. (`import.meta.filename` needs Node 20.11+.)

**Hints.** 1) Event loop phases: timers -> pending -> poll -> check -> close. 2) I/O callback poll phase mein chalta hai; uske baad agla phase check hai.

### EX-LOOP-05 - Microtasks between timers [ESSENTIAL] (Intermediate)

```js
setTimeout(() => {
  console.log('T1');
  Promise.resolve().then(() => console.log('M-in-T1'));
}, 0);
setTimeout(() => console.log('T2'), 0);
```

**Problem.** Predict the output on Node 22 and on Node 10. Assume both timers expire together.

**Hints.** 1) Node 11 ke baad har timer callback ke BAAD microtasks/nextTicks drain hote hain. 2) Purane Node mein timers ki poori list chalti thi, phir microtasks.

### EX-LOOP-06 - Await ordering and wall-clock time [ESSENTIAL] (Intermediate)

```js
const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));

async function main() {
  console.log('A');
  const p1 = wait(30, 'p1');
  const p2 = wait(10, 'p2');
  console.log(await p1);
  console.log(await p2);
  console.log('B');
}
main().then(() => console.log('done'));
console.log('C');
```

**Problem.** Predict the output order AND the approximate total run time. Now change the two `wait` calls so
they are created AFTER the first `await` (i.e. `const p2 = wait(10,'p2')` placed after `console.log(await p1)`).
What is the new total time?

**Hints.** 1) Timer tab start hota hai jab `wait()` call hota hai, `await` pe nahi. 2) `main()` pehle `await` tak sync chalta hai.

---

## 3. Array and object manipulation (EX-ARR)

### EX-ARR-01 - Group and total orders [ESSENTIAL] (Basic)

**Problem.** `orders` is an array of `{ id, customerId, amount, status }`. Implement
`totalsByCustomer(orders)` returning an object `{ [customerId]: totalOfPaidOrders }` counting only
`status === 'PAID'`, and `topCustomer(totals)` returning the `[customerId, total]` pair with the highest total
(`null` for empty input; ties -> smaller customerId as string compare).

**Examples.**

```js
const orders = [
  { id: 1, customerId: 'c1', amount: 100, status: 'PAID' },
  { id: 2, customerId: 'c2', amount: 300, status: 'CANCELLED' },
  { id: 3, customerId: 'c1', amount: 50,  status: 'PAID' },
  { id: 4, customerId: 'c2', amount: 70,  status: 'PAID' },
];
totalsByCustomer(orders);              // { c1: 150, c2: 70 }
topCustomer({ c1: 150, c2: 70 });      // ['c1', 150]
```

**Hints.** 1) `reduce` with an object accumulator. 2) `Object.entries` + a loop for the max. 3) Customer jiska koi PAID order nahi, output mein nahi aayega.

### EX-ARR-02 - Dedupe keeping the latest record [ESSENTIAL] (Basic)

**Problem.** `dedupeLatest(records, keyField, timeField)` returns one record per distinct `keyField`, keeping the
one with the greatest `timeField` (ISO date strings or numbers). The output order is the order in which each key
FIRST appeared in the input. Input must not be mutated.

**Examples.**

```js
dedupeLatest([
  { id: 'a', v: 1, at: '2024-01-01' },
  { id: 'b', v: 2, at: '2024-01-02' },
  { id: 'a', v: 3, at: '2024-01-05' },
], 'id', 'at');
// [ { id: 'a', v: 3, at: '2024-01-05' }, { id: 'b', v: 2, at: '2024-01-02' } ]
```

**Hints.** 1) `Map` insertion order preserve karta hai. 2) Date strings ISO format mein string compare se bhi theek hote hain, par `new Date()` safer hai.

### EX-ARR-03 - Build a comment tree from a flat list [ESSENTIAL] (Intermediate)

**Problem.** A DB returns comments as a flat array `{ id, parentId, text }` (`parentId === null` for top-level).
Implement `buildTree(flat)` returning nested objects with a `replies` array. Keep input order inside each
`replies`. A comment whose `parentId` does not exist in the list becomes a top-level node. Do not mutate the
input objects. Must run in O(n).

**Examples.**

```js
buildTree([
  { id: 1, parentId: null, text: 'root' },
  { id: 2, parentId: 1, text: 'reply' },
  { id: 3, parentId: 2, text: 'nested' },
  { id: 4, parentId: 99, text: 'orphan' },
]);
// [
//   { id: 1, parentId: null, text: 'root', replies: [ { id: 2, ..., replies: [ { id: 3, ..., replies: [] } ] } ] },
//   { id: 4, parentId: 99, text: 'orphan', replies: [] }
// ]
```

**Hints.** 1) Pehle pass: `Map(id -> node copy)`. 2) Doosra pass: parent mil gaya to parent.replies mein push, nahi to roots mein.

### EX-ARR-04 - Immutable `setIn` with structural sharing [ESSENTIAL] (Intermediate)

**Problem.** Implement `setIn(obj, path, value)` where `path` is an array of keys (strings or array indexes). It
returns a NEW object with the value set, without mutating `obj`. Branches NOT on the path must keep the same
object reference (structural sharing, like Redux reducers). Missing intermediate objects are created (a number
key creates an array, otherwise an object).

**Examples.**

```js
const a = { user: { name: 'Asha', tags: ['x'] }, meta: { v: 1 } };
const b = setIn(a, ['user', 'tags', 1], 'y');
b.user.tags;            // ['x', 'y']
a.user.tags;            // ['x']        (unchanged)
b.meta === a.meta;      // true         (shared)
setIn({}, ['a', 0, 'b'], 1); // { a: [ { b: 1 } ] }
```

**Hints.** 1) Recursion: head = `path[0]`, rest = `path.slice(1)`. 2) Array ho to `slice()` copy, object ho to spread. 3) Frontend connection: yehi pattern React state update mein use hota hai.

### EX-ARR-05 - Top K frequent words [ESSENTIAL] (Intermediate)

**Problem.** `topK(text, k)` returns the `k` most frequent words (lowercased, split on non-letters; ignore empty
tokens), as `[word, count]` pairs sorted by count descending then word ascending.

**Examples.**

```js
topK('The cat and the hat. The end, and THE cat!', 2); // [['the', 4], ['and', 2]]
```

Note: `cat` also has count 2; ties are broken alphabetically, so `and` comes before `cat`.

**Hints.** 1) `text.toLowerCase().match(/[a-z]+/g) ?? []`. 2) `Map` count, phir `sort` with a two-level comparator. 3) Complexity discuss karo: full sort O(n log n) vs heap O(n log k).

### EX-ARR-06 - Merge overlapping intervals (booking conflicts) [ESSENTIAL] (Intermediate)

**Problem.** `mergeIntervals(intervals)` takes `[[start, end], ...]` (numbers, `start <= end`, unsorted) and
returns the merged list sorted by start. Intervals that touch (`[1,3]` and `[3,5]`) are merged. Input must not be
mutated.

**Examples.**

```js
mergeIntervals([[8, 10], [1, 3], [2, 6], [15, 18], [6, 7]]); // [[1, 7], [8, 10], [15, 18]]
mergeIntervals([]);                                          // []
```

**Hints.** 1) Start ke hisaab se sort (copy par). 2) Last merged interval se compare: `start <= last.end` to `last.end = max(last.end, end)`.

---

## 4. Asynchronous error handling (EX-ERR)

### EX-ERR-01 - Fix the swallowed errors (`forEach` + `async`) [ESSENTIAL] (Basic)

**Broken code.**

```js
const save = async (user) => {
  if (!user.email) throw new Error('email required');
  return { ...user, saved: true };
};

async function saveAll(users) {
  const saved = [];
  users.forEach(async (u) => {
    saved.push(await save(u));
  });
  return saved;
}

console.log(await saveAll([{ email: 'a@x.com' }, { name: 'no email' }]));
```

**Symptoms.** Prints `[]`, and later the process crashes with an unhandled rejection (`email required`).

**Problem.** Explain both symptoms, then write `saveAll` so that (a) it returns all saved users in order, and
(b) the error from the invalid user reaches the caller's `try/catch`.

**Hints.** 1) `forEach` return value ko await nahi karta. 2) `for...of` ya `Promise.all(map(...))`.

### EX-ERR-02 - Custom error classes [ESSENTIAL] (Basic)

**Problem.** Build `AppError extends Error` with constructor `(message, { status = 500, code = 'INTERNAL', details, cause } = {})`,
plus `NotFoundError` (404, `NOT_FOUND`), `ValidationError` (422, `VALIDATION_FAILED`, takes `details` array),
`ConflictError` (409, `CONFLICT`). Requirements: `err.name` is the class name; `err instanceof AppError` works for
subclasses; `err.isOperational === true`; `toJSON()` returns `{ error: { code, message, details } }` and NEVER
includes `stack` or `cause`.

**Examples.**

```js
const e = new NotFoundError('Order 5 not found');
e.status;                         // 404
e instanceof AppError;            // true
JSON.stringify(e);                // '{"error":{"code":"NOT_FOUND","message":"Order 5 not found"}}'
```

**Hints.** 1) `super(message, { cause })` -- ES2022 `cause` option. 2) `this.name = new.target.name`. 3) Undefined `details` JSON mein apne aap hat jaata hai.

### EX-ERR-03 - Batch processor that never throws [ESSENTIAL] (Intermediate)

**Problem.** `processBatch(items, handler)` runs `handler(item)` for all items concurrently and returns
`{ succeeded: [{ item, value }], failed: [{ item, error }] }`, preserving input order inside each list. It must
never reject, even if `handler` throws synchronously (non-async function) for some item.

**Examples.**

```js
const handler = async (n) => { if (n % 2) throw new Error('odd ' + n); return n * 10; };
await processBatch([1, 2, 3, 4], handler);
// { succeeded: [ {item:2,value:20}, {item:4,value:40} ],
//   failed:    [ {item:1,error:Error('odd 1')}, {item:3,error:Error('odd 3')} ] }
```

**Hints.** 1) `Promise.allSettled`. 2) Sync throw bhi capture karne ke liye `async (item) => handler(item)` se wrap karo.

### EX-ERR-04 - EventEmitter to Promise (and the unhandled `error` event) [ESSENTIAL] (Intermediate)

**Problem.** A `job` is an `EventEmitter` that emits `'data'` (string chunk) zero or more times, then either
`'end'` or `'error'`. Implement `collect(job)` returning a Promise that resolves with all chunks joined, or
rejects with the error. After settling, ALL listeners that `collect` added must be removed (no leak). Also
explain (in a comment or in words) what happens if an emitter emits `'error'` and nobody listens.

**Examples.**

```js
import { EventEmitter } from 'node:events';
const job = new EventEmitter();
const p = collect(job);
job.emit('data', 'he'); job.emit('data', 'llo'); job.emit('end');
await p; // 'hello'
```

**Hints.** 1) Teen listeners: data, end, error; ek `cleanup()` function. 2) `events.once` / `events.on` async iterator bhi option hai -- par chunk collection ke liye manual listeners clear hote hain.

### EX-ERR-05 - Retry only retryable errors, honour `Retry-After` [ADVANCED] (Intermediate)

**Problem.** Implement `classify(err)` returning `'retry'`, `'retry-after'` or `'fatal'`, and
`callApi(doRequest, { retries, sleep })`. `doRequest()` rejects with errors shaped like
`{ code?: string, status?: number, retryAfterSeconds?: number }`.

- `'retry'`: network codes (`ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`, `EAI_AGAIN`) and status 500, 502, 503, 504.
- `'retry-after'`: status 429 (wait `retryAfterSeconds` if given, else 1 second).
- `'fatal'`: everything else (400, 401, 403, 404, 422, programming errors). Never retried.

**Examples.**

```js
// 429 with retryAfterSeconds 2 -> sleep(2000) then retry
// 404 -> throws immediately, doRequest called once
```

**Hints.** 1) POST ko blindly retry karna dangerous hai (double charge) -- iska connection EX-IDEM se hai. 2) Fatal error turant throw.

### EX-ERR-06 - Never leak a resource: `withResource` [ESSENTIAL] (Intermediate)

**Problem.** Implement `withResource(acquire, release, fn)`. It acquires a resource, runs `fn(resource)`, and
ALWAYS releases (also when `fn` throws). If both `fn` and `release` throw, the thrown error must be `fn`'s error
(the original cause) with the release error attached as `err.releaseError`. If `acquire` fails, `release` is not
called.

**Examples.**

```js
await withResource(() => pool.getConnection(), (c) => c.release(), async (c) => c.query('SELECT 1'));
```

**Hints.** 1) `try { ... } catch { ... } finally { ... }` -- finally mein throw original error ko replace kar deta hai, isliye careful. 2) Is pattern ka production use: DB connection `release()`.


---

## 5. Express CRUD APIs (EX-EXP)

All exercises: Express 5, ESM, in-memory data (no database yet). Export `createApp()` from your module so that
Supertest can use it later (EX-TEST). Express 5 note: rejected promises / thrown errors in async handlers reach the
error middleware automatically. In Express 4 you needed a wrapper (see EX-MW-05 solution notes).

### EX-EXP-01 - Skeleton, health check, read endpoints [ESSENTIAL] (Basic)

**Problem.** Build an Express app with: `GET /health` -> `200 {"status":"ok"}`; `GET /tasks` -> `200` array of
tasks; `GET /tasks/:id` -> `200` task or `404 {"error":{"code":"NOT_FOUND","message":"Task 9 not found"}}`. Seed
two tasks in memory. `id` is a positive integer; a non-numeric id returns `400`.

**Examples.**

```
GET /tasks/1   -> 200 {"id":1,"title":"Write docs","status":"todo"}
GET /tasks/9   -> 404 {"error":{"code":"NOT_FOUND","message":"Task 9 not found"}}
GET /tasks/abc -> 400 {"error":{"code":"BAD_REQUEST","message":"id must be a positive integer"}}
```

**Hints.** 1) `app.use(express.json())` pehle. 2) `Number.isInteger` check. 3) `listen` sirf `if (process.argv[1] === import.meta.filename)` ke andar rakho taaki import karne par server start na ho.

### EX-EXP-02 - Full CRUD with correct status codes [ESSENTIAL] (Basic)

**Problem.** Add `POST /tasks`, `PUT /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.

- POST: body `{ title (required, string, 1..100), status? ('todo'|'doing'|'done', default 'todo') }` -> `201`, JSON
  of the created task and `Location: /tasks/<id>`. Invalid body -> `422` with `details`.
- PUT: full replace (title required, status required); `200`.
- PATCH: partial update (at least one field); `200`.
- DELETE: `204` with no body; unknown id -> `404`.

**Examples.**

```
POST /tasks {"title":"Pay rent"}         -> 201, Location: /tasks/3, {"id":3,"title":"Pay rent","status":"todo"}
POST /tasks {"title":""}                  -> 422 {"error":{"code":"VALIDATION_FAILED","message":"Invalid body","details":[{"field":"title","message":"must be 1..100 chars"}]}}
DELETE /tasks/3                           -> 204
```

**Hints.** 1) PUT = replace, PATCH = merge. 2) Ids kabhi reuse mat karo (counter use karo, `length+1` nahi). 3) Validation ek helper function mein, route handlers patle rakho.

### EX-EXP-03 - List endpoint: filter, search, sort, paginate [ESSENTIAL] (Intermediate)

**Problem.** `GET /tasks?status=todo&q=docs&sort=-createdAt&page=2&limit=5` returns
`{ data: [...], meta: { page, limit, total, totalPages } }`.

- `status` optional enum filter; `q` case-insensitive substring match on title.
- `sort` is a comma-separated allow-list of `createdAt`, `title`, `id` with optional `-` prefix (desc). Anything
  else -> `400`.
- `page` default 1, `limit` default 10, max 100; invalid numbers or `limit` above 100 -> `400`.
- `total` is the count AFTER filtering, BEFORE slicing.

**Examples.**

```
GET /tasks?limit=2&page=2        -> data = items 3 and 4, meta {"page":2,"limit":2,"total":7,"totalPages":4}
GET /tasks?sort=password         -> 400
GET /tasks?limit=1000            -> 400
```

**Hints.** 1) Pipeline: filter -> sort -> count -> slice. 2) Sort field ko allow-list karo (SQL mein yehi ORDER BY injection rokta hai). 3) Express 5 mein `req.query` getter hai (simple parser); values strings hoti hain.

### EX-EXP-04 - Layered architecture and centralized errors [ESSENTIAL] (Intermediate)

**Problem.** Refactor EX-EXP-02 into: `routes -> controller -> service -> repository` (all in one file is fine, but
separate functions/factories). Rules: the repository knows storage only; the service holds business rules and
throws `NotFoundError` / `ValidationError` (EX-ERR-02); controllers only translate HTTP <-> service; ONE error
middleware turns errors into JSON; unknown routes get a JSON 404; malformed JSON body gets `400`.

**Examples.**

```
POST /tasks with body "{bad json"   -> 400 {"error":{"code":"BAD_REQUEST","message":"Malformed JSON"}}
GET  /nope                          -> 404 {"error":{"code":"NOT_FOUND","message":"Route GET /nope not found"}}
```

**Hints.** 1) Dependency injection: `createApp({ taskService })` -- test mein fake service pass kar sakte ho. 2) express.json ka parse error `err.type === 'entity.parse.failed'` hota hai.

### EX-EXP-05 - Nested resources: projects and tasks [ESSENTIAL] (Intermediate)

**Problem.** Add projects: `POST /projects`, `GET /projects/:projectId`, `DELETE /projects/:projectId`, and nested
`GET|POST /projects/:projectId/tasks`, `GET|PATCH|DELETE /projects/:projectId/tasks/:taskId`. Rules: any route with
an unknown `projectId` -> `404` (before touching tasks); a task only matches if it belongs to that project
(`GET /projects/1/tasks/7` where task 7 belongs to project 2 -> `404`); deleting a project deletes its tasks.

**Examples.**

```
POST /projects {"name":"Website"}                    -> 201 {"id":1,"name":"Website"}
POST /projects/1/tasks {"title":"Design header"}      -> 201 {"id":1,"projectId":1,"title":"Design header","status":"todo"}
GET  /projects/2/tasks/1                              -> 404 (task 1 belongs to project 1)
```

**Hints.** 1) `express.Router({ mergeParams: true })` ya `router.param('projectId', ...)`. 2) Ownership check data leak se bachata hai (IDOR).

### EX-EXP-06 - Versioning, conflicts and conditional updates [ADVANCED] (Advanced)

**Problem.** (a) Mount the API at `/v1`. Add `/v2/tasks` whose list response is `{ items, nextCursor }` using cursor
pagination (`?after=<id>&limit=`), while v1 keeps `{ data, meta }`; both versions share one service. (b) Creating
a task with a title that already exists (case-insensitive) -> `409 CONFLICT`. (c) Each task has a `version`
number starting at 1; `PATCH` requires header `If-Match: <version>`; mismatch -> `412 Precondition Failed`,
missing header -> `428 Precondition Required`; success increments `version` and returns it in the `ETag` header.

**Examples.**

```
GET /v2/tasks?limit=2            -> {"items":[{id:1,...},{id:2,...}],"nextCursor":2}
GET /v2/tasks?after=2&limit=2    -> {"items":[{id:3,...}],"nextCursor":null}
PATCH /v1/tasks/1  (If-Match: 1) -> 200, ETag: "2"
PATCH /v1/tasks/1  (If-Match: 1) -> 412 (version is now 2)
```

**Hints.** 1) Cursor = last id seen; `limit + 1` item fetch karke `nextCursor` decide karo. 2) Yeh optimistic locking ka HTTP version hai (EX-TXN-05 se connect karo).

---

## 6. Request validation and middleware (EX-MW)

### EX-MW-01 - Request-id and access-log middleware [ESSENTIAL] (Basic)

**Problem.** Write `requestLogger({ write = console.log })` middleware. For each request: take `x-request-id`
from the incoming header if it matches `/^[A-Za-z0-9._-]{8,64}$/`, otherwise generate `crypto.randomUUID()`;
set `req.id` and the response header `x-request-id`; when the response finishes, call `write(JSON.stringify(...))`
with `{ id, method, path, status, durationMs, ip }`. `durationMs` must come from a monotonic clock.

**Examples.**

```
-> {"id":"3f2b...","method":"GET","path":"/tasks","status":200,"durationMs":3.4,"ip":"::1"}
Incoming header "x-request-id: x" (too short) is ignored and replaced.
```

**Hints.** 1) `process.hrtime.bigint()` ya `performance.now()`. 2) `res.on('finish', ...)` -- aborted request ke liye `close` bhi sunte hain. 3) Log mein body/Authorization header kabhi mat daalo.

### EX-MW-02 - Schema validation middleware factory [ESSENTIAL] (Intermediate)

**Problem.** Without any library, implement `validate({ body, query, params })` returning Express middleware.
Each section is a schema object `{ field: { type, required?, min?, max?, enum?, default? } }` where `type` is one
of `'string' | 'integer' | 'number' | 'boolean'`. Rules: collect ALL errors (not just the first) and respond
`422 { error: { code: 'VALIDATION_FAILED', message, details: [{ in, field, message }] } }`; unknown fields are
rejected only for `body` (strict); query/params values arrive as strings, so coerce `'integer'`, `'number'` and
`'boolean'` types from strings; store the cleaned values in `req.valid = { body, query, params }`. (Do NOT assign
back to `req.query` -- in Express 5 it is a read-only getter.)

**Examples.**

```js
app.post('/tasks', validate({ body: { title: { type: 'string', required: true, min: 1, max: 100 } } }), handler);
// POST {} -> 422 details: [{ in:'body', field:'title', message:'is required' }]
// GET /tasks?limit=abc validated with limit: { type: 'integer', min: 1, max: 100, default: 10 }
//   -> 422 details: [{ in:'query', field:'limit', message:'must be an integer' }]
```

**Hints.** 1) Alag-alag `checkSection` helper likho. 2) `min/max` strings ke liye length hai, numbers ke liye value. 3) `'abc'` ko `Number()` karo to `NaN` aata hai; `''` ko `0` banata hai -- handle karo.

### EX-MW-03 - API key authentication with constant-time compare [ESSENTIAL] (Intermediate)

**Problem.** Write `apiKeyAuth(keyStore)` middleware. Clients send `Authorization: Bearer <key>`. `keyStore` is a
`Map` of `sha256(key) hex -> { clientId, scopes }` (so raw keys are never stored). Missing/malformed header ->
`401` with `WWW-Authenticate: Bearer`; unknown key -> `401`; valid -> `req.client = { clientId, scopes }`. Use a
constant-time comparison for the hash. Also write `requireScope(scope)` returning `403` when the scope is missing.

**Examples.**

```
no header                         -> 401 {"error":{"code":"UNAUTHENTICATED","message":"Missing bearer token"}}
Bearer wrong                      -> 401 {"error":{"code":"UNAUTHENTICATED","message":"Invalid credentials"}}
valid key, scope 'tasks:read' only, route needs 'tasks:write' -> 403 {"error":{"code":"FORBIDDEN",...}}
```

**Hints.** 1) Hash karke Map lookup timing-safe hai kyunki attacker hash ke bytes control nahi kar sakta; phir bhi `timingSafeEqual` practise karo. 2) 401 = "tum kaun ho?", 403 = "tumhe allowed nahi".

### EX-MW-04 - Body sanitization middleware [ESSENTIAL] (Intermediate)

**Problem.** Write `sanitizeBody({ allow, maxDepth = 3 })`. It rebuilds `req.body` containing only allow-listed
top-level keys; trims strings; removes keys named `__proto__`, `constructor`, `prototype`, and any key that starts
with `$` or contains `.` (NoSQL operator / prototype pollution protection); rejects bodies deeper than `maxDepth`
with `400`; converts non-plain-object bodies (array, string, null) to `400`.

**Examples.**

```js
// allow: ['name','email']
// body { name: '  Asha ', email: 'a@x.com', isAdmin: true } -> { name: 'Asha', email: 'a@x.com' }
// body { name: { $gt: '' } }                                  -> name object loses the '$gt' key -> { name: {} }
```

**Hints.** 1) Recursive `clean(value, depth)`. 2) Naya object banate waqt key check zaroori. 3) Mass assignment (`isAdmin`) allow-list se rukta hai.

### EX-MW-05 - Error-handling and not-found middleware [ESSENTIAL] (Intermediate)

**Problem.** Implement `notFound` and `errorHandler({ logger = console })` for Express 5. Mapping:

- `AppError` (from EX-ERR-02) -> its `status` and `toJSON()`.
- body-parser parse error (`err.type === 'entity.parse.failed'`) -> `400 BAD_REQUEST`.
- `err.type === 'entity.too.large'` -> `413 PAYLOAD_TOO_LARGE`.
- anything else -> `500 INTERNAL` with the generic message `"Internal server error"` (never leak `err.message` or
  stack); log the full error with `req.id` using `logger.error`.
- If `res.headersSent` is already true, delegate with `next(err)`.

**Examples.**

```
throw new Error('db password is hunter2')  -> 500 {"error":{"code":"INTERNAL","message":"Internal server error"}}
```

**Hints.** 1) Error middleware ke 4 parameters hone chahiye (`err, req, res, next`) -- arity se Express pehchanta hai. 2) 4xx ko `warn`, 5xx ko `error` level par log karo.

### EX-MW-06 - Write a mini middleware runner (`compose`) [ADVANCED] (Advanced)

**Problem.** Implement `compose(stack)` that returns `handle(req, res, done)`. `stack` is an array of functions: normal
middleware `(req, res, next)` and error middleware `(err, req, res, next)` (detect by `fn.length === 4`).
Semantics like Express: `next()` runs the next normal middleware; `next(err)` skips to the next error
middleware; a thrown sync error or rejected promise is treated as `next(err)`; calling `next()` twice from one
middleware must be reported as an error; after the stack is exhausted call `done(err)`.

**Examples.**

```js
const log = [];
const h = compose([
  (req, res, next) => { log.push('a'); next(); },
  (req, res, next) => { log.push('b'); next(new Error('x')); },
  (req, res, next) => { log.push('skipped'); next(); },
  (err, req, res, next) => { log.push('err:' + err.message); next(); },
]);
h({}, {}, (e) => log.push('done:' + e)); // log: ['a','b','err:x','done:undefined']
```

**Hints.** 1) Index-based `dispatch(i, err)` recursion. 2) Double-call guard: `let called = -1; if (i <= called) ...`. 3) Async fn ka return value `.catch(next)` se handle karo.

---

## 7. SQL joins and aggregation (EX-SQL)

All SQL is MySQL 8. Run the setup once, then attempt each query. **Schema and sample data are shared by
EX-SQL-01..08.** Only the expected COLUMNS are shown here; full expected result sets are in Part II.

```sql
CREATE DATABASE IF NOT EXISTS shop_practice;
USE shop_practice;

CREATE TABLE customers (
  id         INT PRIMARY KEY,
  name       VARCHAR(50) NOT NULL,
  city       VARCHAR(50) NOT NULL,
  created_at DATE NOT NULL
);

CREATE TABLE products (
  id       INT PRIMARY KEY,
  name     VARCHAR(50) NOT NULL,
  category VARCHAR(30) NOT NULL,
  price    DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
  id          INT PRIMARY KEY,
  customer_id INT NOT NULL,
  status      ENUM('PAID','CANCELLED','PENDING') NOT NULL,
  created_at  DATE NOT NULL,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id         INT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  qty        INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO customers (id, name, city, created_at) VALUES
  (1, 'Asha',  'Pune',   '2024-01-10'),
  (2, 'Ravi',  'Mumbai', '2024-02-05'),
  (3, 'Meera', 'Pune',   '2024-02-20'),
  (4, 'Karan', 'Delhi',  '2024-03-01'),
  (5, 'Divya', 'Mumbai', '2024-03-15');

INSERT INTO products (id, name, category, price) VALUES
  (1, 'Pipe 1in', 'Pipes',    100.00),
  (2, 'Valve',    'Fittings', 250.00),
  (3, 'Elbow',    'Fittings',  40.00),
  (4, 'Gasket',   'Seals',     15.00),
  (5, 'Clamp',    'Fittings',  60.00);

INSERT INTO orders (id, customer_id, status, created_at) VALUES
  (101, 1, 'PAID',      '2024-04-01'),
  (102, 1, 'PAID',      '2024-04-10'),
  (103, 2, 'PAID',      '2024-04-12'),
  (104, 3, 'CANCELLED', '2024-04-15'),
  (105, 2, 'PAID',      '2024-05-02'),
  (106, 3, 'PAID',      '2024-05-03');

INSERT INTO order_items (id, order_id, product_id, qty, unit_price) VALUES
  (1,  101, 1, 10, 100.00),
  (2,  101, 3,  5,  40.00),
  (3,  102, 2,  2, 250.00),
  (4,  103, 1, 20, 100.00),
  (5,  103, 4, 50,  15.00),
  (6,  104, 2,  1, 250.00),
  (7,  105, 3, 10,  40.00),
  (8,  105, 2,  1, 250.00),
  (9,  106, 1,  5, 100.00),
  (10, 106, 4, 10,  15.00);
```

An order's total is `SUM(qty * unit_price)` over its items. "Revenue" always means PAID orders only.

### EX-SQL-01 - INNER JOIN: paid orders with customer names [ESSENTIAL] (Basic)

**Problem.** List every PAID order with its customer name. Columns: `order_id, customer_name, status, created_at`,
ordered by `order_id`.

**Hints.** 1) `orders JOIN customers ON ...`. 2) Filter `WHERE o.status = 'PAID'`.

### EX-SQL-02 - LEFT JOIN anti-join: customers who never ordered [ESSENTIAL] (Basic)

**Problem.** List customers who have NO orders at all (any status). Columns: `id, name, city`, ordered by `id`.
Write it with `LEFT JOIN ... IS NULL`. Then (bonus) rewrite with `NOT EXISTS`.

**Hints.** 1) Right-side ki primary key `IS NULL` ka matlab match nahi mila. 2) WHERE mein right-table ka koi condition (IS NULL ke alawa) LEFT JOIN ko INNER bana deta hai.

### EX-SQL-03 - Aggregation: total per order [ESSENTIAL] (Basic)

**Problem.** For every PAID order show the order total. Columns: `order_id, item_lines, total` (`item_lines` = number
of item rows), ordered by `order_id`.

**Hints.** 1) `GROUP BY o.id`. 2) `SUM(oi.qty * oi.unit_price)`.

### EX-SQL-04 - Revenue per customer including zero-revenue customers [ESSENTIAL] (Intermediate)

**Problem.** For EVERY customer, show `name, city, paid_orders, revenue`, where `paid_orders` is the number of
distinct PAID orders and `revenue` the sum of their item totals (0.00 when none). Order by `revenue` descending,
then `name` ascending.

**Hints.** 1) LEFT JOIN customers -> orders -> order_items. 2) PAID filter ko `ON` clause mein rakho, WHERE mein nahi, warna zero-revenue customers gayab. 3) `COUNT(DISTINCT o.id)` kyunki order_items join rows multiply karta hai. 4) `COALESCE(SUM(...), 0)`.

### EX-SQL-05 - GROUP BY ... HAVING: busy categories [ESSENTIAL] (Intermediate)

**Problem.** Show product categories that sold MORE THAN 20 units in PAID orders. Columns:
`category, units_sold`, ordered by `units_sold` descending.

**Hints.** 1) Join products -> order_items -> orders. 2) WHERE = rows filter (pehle), HAVING = group filter (baad mein).

### EX-SQL-06 - Subquery / CTE: orders above the average [ESSENTIAL] (Intermediate)

**Problem.** Find PAID orders whose total is strictly greater than the average total of all PAID orders. Columns:
`order_id, total`, ordered by `order_id`.

**Hints.** 1) CTE mein per-order totals. 2) Scalar subquery `(SELECT AVG(total) FROM order_totals)`. 3) Average ko do baar compute karne ki zaroorat nahi, CTE reuse karo.

### EX-SQL-07 - Window function: rank customers within each city [ADVANCED] (Intermediate)

**Problem.** For each customer compute revenue (PAID only, 0 if none), then rank customers inside their city by
revenue descending. Columns: `city, name, revenue, city_rank` ordered by `city`, then `city_rank`. Use
`RANK()`; explain how `ROW_NUMBER()` and `DENSE_RANK()` would differ when two customers tie.

**Hints.** 1) Pehle CTE se per-customer revenue. 2) `RANK() OVER (PARTITION BY city ORDER BY revenue DESC)`.

### EX-SQL-08 - Monthly revenue with running total [ADVANCED] (Intermediate)

**Problem.** Show PAID revenue per month with a cumulative total. Columns: `month` (format `YYYY-MM`),
`revenue`, `cumulative_revenue`, ordered by month.

**Hints.** 1) `DATE_FORMAT(o.created_at, '%Y-%m')`. 2) Pehle group karke CTE banao, phir `SUM(revenue) OVER (ORDER BY month)`.

---

## 8. Transaction-safe database operations (EX-TXN)

Use `mysql2/promise` and a pool. Schema (separate database; InnoDB; MySQL 8):

```sql
CREATE DATABASE IF NOT EXISTS txn_practice;
USE txn_practice;

CREATE TABLE accounts (
  id      INT PRIMARY KEY,
  owner   VARCHAR(50) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  version INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_balance CHECK (balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE ledger (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  delta      DECIMAL(12,2) NOT NULL,
  ref        VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ledger_ref_account (ref, account_id)
) ENGINE=InnoDB;

CREATE TABLE products (
  id    INT PRIMARY KEY,
  name  VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  CONSTRAINT chk_stock CHECK (stock >= 0)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total   DECIMAL(12,2) NOT NULL,
  status  VARCHAR(20) NOT NULL DEFAULT 'PLACED'
) ENGINE=InnoDB;

CREATE TABLE order_items (
  order_id   BIGINT NOT NULL,
  product_id INT NOT NULL,
  qty        INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
) ENGINE=InnoDB;

CREATE TABLE outbox (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  topic      VARCHAR(50) NOT NULL,
  payload    JSON NOT NULL,
  status     ENUM('NEW','SENT') NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE articles (
  id    INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  views INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO accounts (id, owner, balance) VALUES (1, 'Asha', 1000.00), (2, 'Ravi', 500.00);
INSERT INTO products (id, name, price, stock) VALUES (1, 'Pipe', 100.00, 10), (2, 'Valve', 250.00, 3);
INSERT INTO articles (id, title, views) VALUES (1, 'Intro to Node', 0);
```

Pool setup used in every problem:

```js
import mysql from 'mysql2/promise';
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: 'txn_practice',
  connectionLimit: 10,
});
```

mysql2 returns `DECIMAL` columns as strings by default (good: never do float math on money).

### EX-TXN-01 - Money transfer [ESSENTIAL] (Intermediate)

**Problem.** Implement `transfer(pool, { fromId, toId, amount, ref })`. `amount` is a string like `"250.00"`.
In ONE transaction: reject invalid input (`amount <= 0`, same account) before opening a transaction; lock both
account rows with `SELECT ... FOR UPDATE` in a deterministic order; fail with an error if either account is
missing or the balance is insufficient; debit, credit, insert two ledger rows (`-amount` and `+amount`, same
`ref`); commit. On any error roll back and release the connection.

**Examples.**

```js
await transfer(pool, { fromId: 1, toId: 2, amount: '250.00', ref: 'T-1001' });
// accounts: 1 -> 750.00, 2 -> 750.00; ledger has 2 rows with ref T-1001
await transfer(pool, { fromId: 2, toId: 1, amount: '9999.00', ref: 'T-1002' }); // throws 'Insufficient funds', no changes
```

**Hints.** 1) Transfers A->B aur B->A ek saath chalein to deadlock ho sakta hai -- lock order fix karo (chhota id pehle). 2) Money ko JS float mat banao; SQL arithmetic ya integer paise. 3) `pool.getConnection()` ke baad `finally { conn.release() }`.

### EX-TXN-02 - Atomic stock reservation (no oversell) [ESSENTIAL] (Intermediate)

**Problem.** Given the BROKEN approach (`SELECT stock` -> check in JS -> `UPDATE stock = ?`), explain how it
oversells under concurrency, then implement `reserveStock(pool, productId, qty)` that is safe WITHOUT an explicit
transaction using a single conditional `UPDATE`. Return `true` if reserved, `false` if not enough stock.

**Examples.**

```js
// stock of product 2 is 3
await Promise.all([reserveStock(pool, 2, 2), reserveStock(pool, 2, 2)]); // exactly one true, one false; stock = 1
```

**Hints.** 1) `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`. 2) `result.affectedRows` check karo. 3) InnoDB row lock UPDATE ke dauran ye serialize kar deta hai.

### EX-TXN-03 - Place an order atomically [ESSENTIAL] (Intermediate)

**Problem.** Implement `placeOrder(pool, userId, items)` where `items` is `[{ productId, qty }]`. In one transaction:
validate input (non-empty, positive integer qty, no duplicate productId); lock product rows
(`FOR UPDATE`, ordered by id); read the price FROM THE DATABASE (never trust a client price); fail if any product
is missing or stock is short; insert the order and order_items; decrement stock; commit. Return
`{ orderId, total }` (total as a string with 2 decimals). Any failure rolls back everything.

**Examples.**

```js
await placeOrder(pool, 7, [{ productId: 1, qty: 2 }, { productId: 2, qty: 1 }]); // { orderId: 1, total: '450.00' }
await placeOrder(pool, 7, [{ productId: 2, qty: 99 }]); // throws, stock and orders untouched
```

**Hints.** 1) Total ko integer paise mein compute karo (`Math.round(price * 100)`), end mein 2 decimals string. 2) Sorted ids lock order deadlock rokta hai. 3) Total pehle compute karo, phir ek hi INSERT.

### EX-TXN-04 - `withTransaction` helper with deadlock retry [ESSENTIAL] (Intermediate)

**Problem.** Implement `withTransaction(pool, fn, { retries = 3 } = {})`. It gets a connection, `BEGIN`, runs
`fn(conn)`, commits and returns the value; rolls back on error; always releases. If the error is a deadlock
(`errno === 1213`) or lock wait timeout (`errno === 1205`), retry the WHOLE transaction up to `retries` times with a
small jittered delay. Other errors are not retried. Explain why `fn` must be safe to run again.

**Examples.**

```js
const id = await withTransaction(pool, async (conn) => {
  const [r] = await conn.execute('INSERT INTO orders (user_id, total) VALUES (?, ?)', [1, '10.00']);
  return r.insertId;
});
```

**Hints.** 1) Retry ek naya connection/transaction le; deadlock mein MySQL victim transaction ko rollback kar deta hai. 2) `fn` ke andar HTTP calls / emails mat bhejo -- retry par repeat honge.

### EX-TXN-05 - Optimistic locking with a version column [ADVANCED] (Intermediate)

**Problem.** Implement `renameOwner(pool, accountId, newOwner, expectedVersion)`. It runs
`UPDATE accounts SET owner = ?, version = version + 1 WHERE id = ? AND version = ?` and throws a `ConflictError`
when no row was updated (someone else changed it) or a `NotFoundError` when the account does not exist
(distinguish them with a second query). Show the client-side flow (read, edit, write with version, handle conflict
by re-reading).

**Examples.**

```js
// both users read account 1 at version 0
await renameOwner(pool, 1, 'Asha K', 0); // ok -> version 1
await renameOwner(pool, 1, 'Asha S', 0); // ConflictError (stale version)
```

**Hints.** 1) Optimistic = lock nahi lete, conflict detect karte hain. Kab achha hai: kam contention. 2) `affectedRows` 0 matlab condition fail.

### EX-TXN-06 - Transactional outbox [ADVANCED] (Advanced)

**Problem.** (a) `placeOrderWithEvent(pool, userId, total)` inserts into `orders` AND inserts an `outbox` row
(`topic = 'order.placed'`, JSON payload with the order id) in ONE transaction. (b) `drainOutbox(pool, publish, batchSize)`
claims up to `batchSize` `NEW` rows using `SELECT ... FOR UPDATE SKIP LOCKED` inside a transaction, calls
`publish(row)` for each, marks the successful ones `SENT`, and commits. Explain what guarantee this gives
(at-least-once) and why consumers must be idempotent.

**Examples.**

```js
await placeOrderWithEvent(pool, 7, '450.00');
await drainOutbox(pool, async (row) => console.log('publish', row.topic, row.payload), 50);
```

**Hints.** 1) "DB commit + broker publish" ek atomic operation nahi hai (dual write problem); outbox usse solve karta hai. 2) `SKIP LOCKED` MySQL 8.0+ mein available hai; multiple workers bina block kiye alag rows uthate hain.

### EX-TXN-07 - Fix the lost update (three ways) [ESSENTIAL] (Intermediate)

**Broken code.**

```js
async function incrementViews(pool, articleId) {
  const [[row]] = await pool.execute('SELECT views FROM articles WHERE id = ?', [articleId]);
  await pool.execute('UPDATE articles SET views = ? WHERE id = ?', [row.views + 1, articleId]);
}
// 100 concurrent calls -> views ends at, say, 37 instead of 100
```

**Problem.** Explain why updates are lost. Then write three fixes: (1) a single atomic `UPDATE views = views + 1`;
(2) `SELECT ... FOR UPDATE` inside a transaction; (3) optimistic retry with a version check (add a `version`
column in your answer). Compare when you would choose each.

**Hints.** 1) Dono requests ne same purani value padhi. 2) Fix 1 sabse simple aur sabse fast hai jab logic sirf arithmetic hai.

---

## 9. JWT authentication (EX-JWT)

### EX-JWT-01 - Decode a JWT by hand (and why decoding is not trusting) [ESSENTIAL] (Basic)

**Problem.** Implement `decodeJwt(token)` that splits a compact JWT into `{ header, payload, signature }` using
only built-ins (base64url decoding, JSON parsing). Throw a clear error for tokens that do not have exactly three
parts or whose header/payload are not valid JSON objects. In a comment, state why the result must never be used
for authorization decisions.

**Examples.**

```js
const t = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJ1c2VyIn0.sig';
decodeJwt(t); // { header: { alg: 'HS256', typ: 'JWT' }, payload: { sub: '42', role: 'user' }, signature: 'sig' }
```

**Hints.** 1) `Buffer.from(part, 'base64url').toString('utf8')`. 2) JWT encrypted nahi hota, sirf signed -- payload koi bhi padh sakta hai. 3) Attacker payload badal ke bhej sakta hai; signature verify hi trust deta hai.

### EX-JWT-02 - HS256 sign and verify from scratch [ESSENTIAL] (Intermediate)

**Problem.** Using only `node:crypto`, implement `signJwt(payload, secret, { expiresInSec })` and
`verifyJwt(token, secret, { now = () => Date.now(), leewaySec = 0, issuer, audience })`.

Verification must: require exactly 3 parts; REQUIRE header `alg === 'HS256'` (reject `none`, `RS256`, anything
else -- never trust the alg from the token to pick the algorithm); recompute the HMAC and compare with
`crypto.timingSafeEqual` (check lengths first); check `exp` (reject expired), `nbf` if present, and `iss`/`aud` when
options are given. `signJwt` adds `iat` and `exp`. Return the payload.

**Examples.**

```js
const token = signJwt({ sub: '42', role: 'user' }, 'topsecret', { expiresInSec: 60 });
verifyJwt(token, 'topsecret');            // { sub:'42', role:'user', iat:..., exp:... }
verifyJwt(token, 'wrong');                // throws 'invalid signature'
verifyJwt(forgedWithAlgNone, 'topsecret'); // throws 'unsupported alg'
```

**Hints.** 1) Signing input = `base64url(header) + '.' + base64url(payload)`. 2) `createHmac('sha256', secret).update(input).digest()`. 3) `exp` seconds mein hota hai, `Date.now()` milliseconds -- unit mix mat karo.

### EX-JWT-03 - Signup, login and auth middleware [ESSENTIAL] (Intermediate)

**Problem.** Build an Express app (in-memory users) with `POST /auth/signup`, `POST /auth/login`, `GET /me`.
Use `bcrypt` for password hashing (cost 12 in production; allow a lower cost via option for tests) and
`jsonwebtoken` for a 15-minute access token. Requirements: validate email/password (password length >= 8);
duplicate email -> `409`; wrong email OR wrong password -> the same `401 Invalid credentials` (no user
enumeration); never return or log the hash; the role is NEVER taken from the request body (always `user`);
`jwt.verify` must pin `algorithms: ['HS256']`; `GET /me` requires `Authorization: Bearer <token>`.

**Examples.**

```
POST /auth/signup {"email":"a@x.com","password":"Str0ng-pass"} -> 201 {"id":1,"email":"a@x.com","role":"user"}
POST /auth/login  {"email":"a@x.com","password":"Str0ng-pass"} -> 200 {"accessToken":"eyJ...","expiresIn":900}
GET  /me  (Bearer token)                                        -> 200 {"id":1,"email":"a@x.com","role":"user"}
GET  /me  (no header / expired / tampered)                      -> 401
```

**Hints.** 1) Unknown email par bhi dummy `bcrypt.compare` chalao taaki timing se pata na chale. 2) Secret `process.env.JWT_SECRET` se lo; missing ho to app start hi fail kare. 3) Token claims: `sub`, `role`, `iat`, `exp` -- password/hash kabhi nahi.

### EX-JWT-04 - Refresh token rotation with reuse detection [ADVANCED] (Advanced)

**Problem.** Extend EX-JWT-03: login also returns an opaque refresh token (`crypto.randomBytes(32)` base64url).
Store only its SHA-256 hash with `{ userId, familyId, expiresAt, usedAt }`. `POST /auth/refresh {refreshToken}`
returns a NEW access token and a NEW refresh token and marks the old one used (rotation). If an already-used
refresh token is presented again (theft signal), revoke the whole family and return `401`. `POST /auth/logout`
revokes the family. Write the store as a small class so it can later move to MySQL/Redis.

**Examples.**

```
login        -> refresh R1
refresh(R1)  -> R2 (R1 now used)
refresh(R1)  -> 401, family revoked (R2 is dead too)
refresh(R2)  -> 401
```

**Hints.** 1) Raw token DB mein mat rakho (DB leak = account takeover). 2) `familyId` ek login session ka chain hai. 3) Concurrent double-refresh ek legitimate race ho sakti hai -- production mein small grace window discuss karo.

### EX-JWT-05 - Role-based access control and ownership checks [ESSENTIAL] (Intermediate)

**Problem.** Given `req.user = { id, role }` (set by the auth middleware), implement `requireRole(...roles)` and
`requireOwnerOrAdmin(getOwnerId)` where `getOwnerId(req)` is async and returns the owner id of the resource (or
`null` if the resource does not exist). Rules: no `req.user` -> `401`; wrong role -> `403`; resource missing ->
`404`; user is neither owner nor admin -> `404` (do not leak existence; document why 404 not 403); admin passes.

**Examples.**

```js
app.delete('/admin/users/:id', requireRole('admin'), handler);
app.patch('/tasks/:id', requireOwnerOrAdmin(async (req) => (await tasks.find(req.params.id))?.ownerId ?? null), handler);
```

**Hints.** 1) 401 = authenticate nahi hua, 403 = hua par permission nahi. 2) Authorization hamesha server par, kabhi frontend hide-button par nahi (frontend connection: UI guard sirf UX hai).

### EX-JWT-06 - Audit and fix an insecure auth module [ESSENTIAL] (Intermediate)

**Broken code.**

```js
import jwt from 'jsonwebtoken';
const SECRET = 'secret123';

app.post('/signup', async (req, res) => {
  const user = await db.users.create(req.body);          // body may contain role: 'admin'
  const token = jwt.sign({ ...user }, SECRET);            // no expiry; includes everything
  res.json({ token, user });
});

app.post('/login', async (req, res) => {
  const user = await db.users.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ error: 'No such user' });
  if (user.password !== req.body.password) return res.status(401).json({ error: 'Wrong password' });
  res.json({ token: jwt.sign({ ...user }, SECRET) });
});

app.use((req, res, next) => {
  req.user = jwt.decode(req.headers.authorization);       // used for every protected route
  next();
});
```

**Problem.** List at least 8 distinct security problems, then write the corrected module.

**Hints.** 1) `decode` vs `verify`. 2) Hardcoded secret, plaintext password, mass assignment, user enumeration, no expiry, sensitive claims, `Bearer ` prefix parsing, missing `algorithms`. 3) Fix ke liye EX-JWT-03 ki approach reuse karo.

---

## 10. API testing (EX-TEST)

Tooling: Vitest + Supertest (`npm i -D vitest supertest`). Test files `*.test.js`, run `npx vitest run`.
In each problem the code under test is given. Write the tests first, then compare with Part II.

### EX-TEST-01 - Table-driven unit tests for pure logic [ESSENTIAL] (Basic)

**Code under test (`calc.js`).**

```js
export function calculateTotal(items, { discountPercent = 0, taxRate = 0 } = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new RangeError('items required');
  if (discountPercent < 0 || discountPercent > 100) throw new RangeError('discount out of range');
  const subtotalPaise = items.reduce((sum, i) => sum + Math.round(i.price * 100) * i.qty, 0);
  const discounted = Math.round((subtotalPaise * (100 - discountPercent)) / 100);
  return Math.round(discounted * (1 + taxRate)) / 100;
}
```

**Problem.** Write at least 8 tests: happy path, multiple items, discount, tax, discount + tax, the classic float
trap (`0.1 * 3`), invalid discount (both boundaries), empty/non-array items. Use `it.each` for the table.

**Examples.** `calculateTotal([{ price: 10.5, qty: 2 }])` is `21`; with `discountPercent: 10` and `taxRate: 0.18` it is `22.3`.

**Hints.** 1) Boundaries: 0, 100, -1, 101. 2) `expect(fn).toThrow(RangeError)` ke liye function ko wrap karo.

### EX-TEST-02 - Mocking collaborators [ESSENTIAL] (Intermediate)

**Code under test (`userService.js`).**

```js
export function createUserService({ userRepo, mailer, logger }) {
  return {
    async register({ email, name }) {
      const normalized = email.trim().toLowerCase();
      if (await userRepo.findByEmail(normalized)) {
        const err = new Error('Email already registered');
        err.code = 'EMAIL_TAKEN';
        throw err;
      }
      const user = await userRepo.insert({ email: normalized, name });
      try {
        await mailer.sendWelcome(user.email, user.name);
      } catch (err) {
        logger.warn({ err: err.message, userId: user.id }, 'welcome mail failed');
      }
      return user;
    },
  };
}
```

**Problem.** Write tests with `vi.fn()` fakes (no real DB or mail): (1) success inserts a NORMALIZED email and sends
exactly one welcome mail; (2) duplicate email throws `EMAIL_TAKEN` and neither inserts nor mails; (3) if the
mailer rejects, registration still succeeds and `logger.warn` is called; (4) if the repo insert rejects, the
mailer is never called and the error propagates.

**Hints.** 1) `mockResolvedValue`, `mockRejectedValue`. 2) `expect(mailer.sendWelcome).not.toHaveBeenCalled()`. 3) Mock sirf boundary (DB, mail, network), apni business logic ko mock mat karo.

### EX-TEST-03 - Integration tests with Supertest [ESSENTIAL] (Intermediate)

**Code under test (`app.js`).**

```js
import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());
  const tasks = [];
  let nextId = 1;

  app.post('/tasks', (req, res) => {
    const title = req.body?.title;
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(422).json({ error: { code: 'VALIDATION_FAILED' } });
    }
    const task = { id: nextId++, title: title.trim(), done: false };
    tasks.push(task);
    res.status(201).location(`/tasks/${task.id}`).json(task);
  });
  app.get('/tasks', (req, res) => res.json(tasks));
  app.get('/tasks/:id', (req, res) => {
    const task = tasks.find((t) => t.id === Number(req.params.id));
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    res.json(task);
  });
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_REQUEST' } });
    res.status(500).json({ error: { code: 'INTERNAL' } });
  });
  return app;
}
```

**Problem.** Write Supertest tests without starting a real port: create returns `201` + `Location` + body;
the created task appears in `GET /tasks`; `GET /tasks/:id` works; unknown id is `404`; blank title is `422`;
malformed JSON is `400`. Each test must get a FRESH app (isolation).

**Hints.** 1) `request(app).post('/tasks').send({...})`. 2) `beforeEach(() => { app = createApp(); })`. 3) Malformed JSON ke liye `.set('Content-Type','application/json').send('{bad')`.

### EX-TEST-04 - Negative tests: authn, authz, validation [ESSENTIAL] (Intermediate)

**Code under test (`app.js`).**

```js
import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());
  const keys = new Map([
    ['key-user', { id: 1, role: 'user' }],
    ['key-admin', { id: 2, role: 'admin' }],
  ]);

  app.use((req, res, next) => {
    const user = keys.get(req.get('x-api-key'));
    if (!user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED' } });
    req.user = user;
    next();
  });

  app.post('/admin/announcements', (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const message = req.body?.message;
    if (typeof message !== 'string' || message.length < 3 || message.length > 200) {
      return res.status(422).json({ error: { code: 'VALIDATION_FAILED' } });
    }
    res.status(201).json({ message });
  });
  return app;
}
```

**Problem.** Write the NEGATIVE test matrix: no key, unknown key, a key named `constructor` (prototype trap), user role
(403), admin with: missing body, non-string message, 2-char message, 201-char message (all 422), and the two valid
boundary lengths 3 and 200 (201). Assert on status AND `error.code`.

**Hints.** 1) Negative tests ka maqsad: galat input par safe failure. 2) `it.each([...])` se table banao. 3) Boundary values: 2/3 aur 200/201.

### EX-TEST-05 - Testing time: retries with fake timers [ESSENTIAL] (Intermediate)

**Problem.** Using the `retry` from EX-ASYNC-03 with its DEFAULT real `sleep`, write tests that do not actually
wait: (1) succeeds on 3rd attempt after delays 100 ms and 200 ms (verify by advancing fake time and counting
calls); (2) throws the LAST error after all attempts fail; (3) `shouldRetry` returning false stops immediately
(one call); (4) delay is capped by `maxDelayMs`. Use `vi.useFakeTimers()` and `vi.advanceTimersByTimeAsync`.

**Hints.** 1) `afterEach(() => vi.useRealTimers())`. 2) Rejection ko pehle attach karo (`const p = retry(...); const assertion = expect(p).rejects...`) taaki unhandled rejection warning na aaye. 3) `advanceTimersByTimeAsync` microtasks bhi flush karta hai.

### EX-TEST-06 - Table-driven test of the error-handling contract [ESSENTIAL] (Intermediate)

**Problem.** Using `AppError` classes (EX-ERR-02) and `errorHandler` (EX-MW-05), write a Supertest suite with one
app that has routes throwing: `NotFoundError`, `ValidationError` with details, `ConflictError`, a generic
`Error('secret db host')`, an async rejection, and a malformed-JSON request. Assert status, `error.code`, that
the 500 response never contains the word `secret`, and that the logger received the full error exactly once for
the 500 case.

**Hints.** 1) Logger ko inject karo (`{ error: vi.fn(), warn: vi.fn() }`). 2) `expect(JSON.stringify(res.body)).not.toContain('secret')`. 3) Express 5 async handler ko wrapper ki zaroorat nahi.

---

## 11. Debugging slow or failing APIs (EX-DEBUG)

For each exercise: read the broken code and the production symptoms, write your DIAGNOSIS (what, why, how you
would confirm it with a tool), then the smallest correct fix. Solutions explain the diagnosis path.

### EX-DEBUG-01 - Hanging requests and "headers already sent" [ESSENTIAL] (Basic)

**Broken code.**

```js
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id);
  if (!user) res.status(404).json({ error: 'not found' });
  res.json({ id: user.id, name: user.name });
});

app.post('/orders', (req, res) => {
  createOrder(req.body).then((order) => res.status(201).json(order));
});
```

**Symptoms.** (1) `GET /users/999` returns 404 to the client but the log shows `TypeError: Cannot read properties of
null (reading 'id')` (and sometimes `ERR_HTTP_HEADERS_SENT`). (2) When `createOrder` fails (e.g. validation), the client
waits until its timeout, and on Node 15+ the whole server process crashes with an unhandled rejection.

**Hints.** 1) `return` res.send ke saath. 2) Promise chain mein `.catch(next)` ya `async/await`. 3) Express 5 async handler ke rejection ko khud handle karta hai -- `.then` chain return karo ya async use karo.

### EX-DEBUG-02 - Memory grows until the pod is OOM-killed [ESSENTIAL] (Intermediate)

**Broken code.**

```js
import { EventEmitter } from 'node:events';
const bus = new EventEmitter();
const priceCache = {};

app.get('/price/:sku', async (req, res) => {
  const key = `${req.params.sku}:${req.query.currency}:${req.query.promo}`;
  if (!priceCache[key]) priceCache[key] = await fetchPrice(req.params.sku, req.query);
  const onUpdate = (sku) => { if (sku === req.params.sku) delete priceCache[key]; };
  bus.on('price-updated', onUpdate);
  res.json(priceCache[key]);
});
```

**Symptoms.** RSS rises steadily by ~50 MB/hour, a restart resets it; logs print
`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 price-updated listeners added`. A heap
snapshot shows millions of closures and a huge `priceCache` object.

**Hints.** 1) Do leaks: unbounded cache keyed by user input AND per-request listeners never removed. 2) Fix: bounded cache (LRU/TTL, normalize/whitelist key), one global listener. 3) Heap snapshot comparison (3-snapshot technique) se confirm karo.

### EX-DEBUG-03 - One endpoint makes the whole server slow [ESSENTIAL] (Intermediate)

**Broken code.**

```js
import crypto from 'node:crypto';
import fs from 'node:fs';

app.post('/signup', (req, res) => {
  const hash = crypto.pbkdf2Sync(req.body.password, SALT, 600000, 64, 'sha512').toString('hex');
  saveUser(req.body.email, hash);
  res.status(201).end();
});

app.get('/report', (req, res) => {
  const rows = JSON.parse(fs.readFileSync('./big-export.json', 'utf8'));   // ~300 MB
  res.json(summarize(rows));
});

app.get('/search', (req, res) => {
  const ok = /^(\w+\s?)+$/.test(req.query.q);   // validate "words only"
  res.json({ ok });
});
```

**Symptoms.** p99 latency of EVERY endpoint (even `/health`) spikes to seconds whenever `/signup`, `/report` or
a certain `/search?q=` is called; one CPU core is at 100% while others idle; `/search?q=aaaaaaaaaaaaaaaaaaaaaaaaaaaa!`
freezes the server for a long time.

**Hints.** 1) Event loop block ho raha hai (single thread). 2) Sync APIs (`*Sync`), huge JSON.parse, catastrophic regex backtracking (ReDoS). 3) Fix: async pbkdf2/bcrypt (thread pool), stream/worker thread, safe regex + length limit. Confirm: `monitorEventLoopDelay`, clinic/flame graph.

### EX-DEBUG-04 - The N+1 query [ESSENTIAL] (Intermediate)

**Broken code.**

```js
app.get('/orders', async (req, res) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [req.user.id]);
  for (const order of orders) {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;
    const [[customer]] = await pool.query('SELECT name FROM customers WHERE id = ?', [order.customer_id]);
    order.customerName = customer.name;
  }
  res.json(orders);
});
```

**Symptoms.** A user with 5 orders: 80 ms. A user with 500 orders: 6 seconds. The MySQL slow log shows thousands of
sub-millisecond queries per request; the app server CPU is low but the DB connection count spikes.

**Hints.** 1) Queries ki count = 1 + 2N. 2) Fix: ek `JOIN` / `WHERE order_id IN (?)` aur JS mein group. 3) `EXPLAIN` se verify karo ki `order_items.order_id` par index hai.

### EX-DEBUG-05 - Whole API freezes after a few failed transfers [ESSENTIAL] (Intermediate)

**Broken code.**

```js
app.post('/transfer', async (req, res, next) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await debit(conn, req.body.from, req.body.amount);   // throws 'Insufficient funds' sometimes
    await credit(conn, req.body.to, req.body.amount);
    await conn.commit();
    conn.release();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
```

**Symptoms.** With `connectionLimit: 10`, after about 10 failed transfers EVERY endpoint hangs (even simple
GETs) and nothing in the logs. `SHOW PROCESSLIST` shows 10 connections in `Sleep` state with open transactions,
and other transactions waiting on row locks.

**Hints.** 1) Error path mein rollback aur release dono missing. 2) `finally { conn.release() }`. 3) Pool queue ka timeout (`queueLimit`, `connectTimeout`) set karo taaki hang fail-fast ho.

### EX-DEBUG-06 - Users occasionally see another user's data [ESSENTIAL] (Intermediate)

**Broken code.**

```js
let currentUser;

app.use(async (req, res, next) => {
  currentUser = await loadUser(req.get('x-user-id'));
  next();
});

app.get('/me', async (req, res) => {
  const prefs = await loadPrefs(currentUser.id);
  res.json({ user: currentUser, prefs });
});
```

**Symptoms.** Works perfectly in local testing and with one tester. Under load, support receives "I see someone
else's name and settings". It cannot be reproduced with one request at a time.

**Hints.** 1) Module-level variable saare requests ke beech shared hai; `await` ke beech doosri request us ko overwrite kar deti hai. 2) Fix: per-request state `req.user` / `res.locals`. 3) AsyncLocalStorage bhi option hai jab deep call chain mein pass karna ho.

### EX-DEBUG-07 - Random process exits at night [ESSENTIAL] (Intermediate)

**Broken code.**

```js
import { EventEmitter } from 'node:events';
const orders = new EventEmitter();

orders.on('placed', async (order) => {
  await sendReceipt(order);        // SMTP call
  await updateAnalytics(order);
});

app.post('/orders', async (req, res) => {
  const order = await saveOrder(req.body);
  orders.emit('placed', order);
  res.status(201).json(order);
});

async function nightlyCleanup(ids) {
  ids.forEach(async (id) => { await archive(id); });
  console.log('cleanup finished');
}
```

**Symptoms.** pm2 shows several restarts per week, always when the SMTP provider has an outage; log tail:
`[UnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block...]`.
The nightly job prints "cleanup finished" immediately and sometimes archives only half the ids.

**Hints.** 1) EventEmitter async listener ke rejection ko emitter handle nahi karta. 2) Fix: try/catch + log (ya queue), `for...of` / `Promise.allSettled`. 3) `process.on('unhandledRejection')` last-resort logging hai, fix nahi.

### EX-DEBUG-08 - Login works in Postman, fails in the browser [ESSENTIAL] (Intermediate)

**Broken code.**

```js
import express from 'express';
import cors from 'cors';

const app = express();

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const token = authenticate(email, password);
  res.cookie('sid', token);
  res.json({ ok: true });
});

app.use(cors());
app.listen(3000);
```

Frontend: `fetch('https://api.example.com/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })` from `https://app.example.com`.

**Symptoms.** (1) Postman: `500 TypeError: Cannot destructure property 'email' of 'req.body' as it is undefined`.
(2) Browser console: `Access to fetch ... has been blocked by CORS policy: Response to preflight request doesn't pass access control check`.
(3) After fixing the first two, the request succeeds but `sid` is not stored and the next call is unauthenticated.

**Hints.** 1) Express 5: `req.body` bina parser undefined hota hai. 2) Preflight `OPTIONS` ko routes se PEHLE CORS middleware handle karna chahiye; `credentials: true` ke saath `origin: '*'` allowed nahi. 3) Cross-site cookie: `SameSite=None; Secure`, ya same-site subdomain + proper domain.

---

## 12. Rate limiter - progressive ladder (EX-RATE)

Shared API for the in-memory limiters (EX-RATE-01..04, 06): a factory returns an object with
`allow(key)` -> `{ allowed: boolean, remaining: number, retryAfterMs: number, resetMs: number }`. `retryAfterMs` is 0
when allowed. `resetMs` = milliseconds until the quota is fully restored (approximate for the sliding counter).
All factories accept an injectable `now = () => Date.now()` so tests can control time. Do rungs in order; each
rung fixes a weakness of the previous one.

### EX-RATE-01 - Fixed window counter [ESSENTIAL] (Basic)

**Problem.** `createFixedWindowLimiter({ limit, windowMs, now })`. Each key gets at most `limit` requests per
window; windows are aligned to `floor(now / windowMs)`. State per key: current window id and count.

**Examples.** `limit: 3, windowMs: 1000`, calls at t = 0, 100, 200 -> allowed (remaining 2, 1, 0); t = 300 -> denied
with `retryAfterMs = 700`; t = 1000 -> allowed (new window). Then show the BOUNDARY BURST: 3 requests at t = 900 and
3 more at t = 1100 are all allowed, i.e. 6 requests in 200 ms.

**Hints.** 1) Count reset jab window id badle. 2) `retryAfterMs = windowEnd - now`. 3) Boundary burst ka matlab limit 2x tak ja sakti hai -- agle rung ka motivation.

### EX-RATE-02 - Sliding window log [ESSENTIAL] (Intermediate)

**Problem.** `createSlidingLogLimiter({ limit, windowMs, now })`. Keep an array of request timestamps per key;
drop timestamps `<= now - windowMs`; allow if fewer than `limit` remain, then push `now`. Exact, no boundary burst.

**Examples.** `limit: 3, windowMs: 1000`: t = 0, 100, 200 allowed; t = 300 denied, `retryAfterMs = 700` (oldest expires at 1000);
t = 1000 allowed (the t=0 entry just expired); 3 at t=900 + 3 at t=1100 -> only the first 3 allowed.

**Hints.** 1) Denied requests ko log mein mat daalo. 2) `retryAfterMs = oldest + windowMs - now`. 3) Memory O(limit) per key -- limit 10,000 ho to mehnga; next rung.

### EX-RATE-03 - Sliding window counter (approximation) [ADVANCED] (Intermediate)

**Problem.** `createSlidingCounterLimiter({ limit, windowMs, now })`. Keep two counters per key: current window and
previous window. Estimated count = `prevCount * (1 - elapsedFraction) + currCount`, where `elapsedFraction` is how far
we are into the current window. Allow when `estimated + 1 <= limit`. O(1) memory per key.

**Examples.** `limit: 10, windowMs: 1000`: 8 requests in window 0; at t = 1250 (25% into window 1) with 0 requests so far:
estimate = 8 * 0.75 = 6 -> allow until the estimate reaches 10.

**Hints.** 1) Do windows se jyada purana data drop karo (agar 2+ window gap, prev = 0). 2) Yeh approximate hai (uniform distribution assume karta hai) -- Cloudflare ne public karke use kiya, accuracy high hai.

### EX-RATE-04 - Token bucket [ESSENTIAL] (Intermediate)

**Problem.** `createTokenBucketLimiter({ capacity, refillPerSec, now })`. Each key has `tokens` and `lastRefill`. On each
call, lazily refill: `tokens = min(capacity, tokens + elapsedSec * refillPerSec)`. `allow(key, cost = 1)` consumes
`cost` tokens if available. This allows bursts up to `capacity` and a steady rate of `refillPerSec`. `retryAfterMs` =
time until enough tokens exist.

**Examples.** `capacity: 5, refillPerSec: 1`: 5 calls at t = 0 allowed (burst); 6th at t = 0 denied, `retryAfterMs = 1000`;
call at t = 1000 allowed (1 token refilled); `cost: 3` at t = 1000 when 0 tokens -> `retryAfterMs = 3000`.

**Hints.** 1) Timer/interval se refill mat karo; lazy refill (calculation on demand) scalable hai. 2) Floating tokens allowed hain. 3) `cost > capacity` kabhi allow nahi hoga -- handle karo.

### EX-RATE-05 - Express middleware with standard headers [ESSENTIAL] (Intermediate)

**Problem.** Write `rateLimit({ limiter, keyFn, skip })` Express middleware on top of any limiter above.
`keyFn(req)` defaults to the client IP; allow `skip(req)` (e.g. `/health`). On allow set `RateLimit-Limit`,
`RateLimit-Remaining`, `RateLimit-Reset` (seconds); on deny respond `429` with `Retry-After` (seconds, integer, rounded up)
and JSON `{ error: { code: 'RATE_LIMITED', message } }`. Add a `trust proxy` note: behind a load balancer `req.ip`
is the proxy unless configured. Write the key function for authenticated routes: `user:<id>` else `ip:<ip>`.

**Examples.**

```
429 Too Many Requests
Retry-After: 1
RateLimit-Limit: 5
RateLimit-Remaining: 0
{"error":{"code":"RATE_LIMITED","message":"Too many requests"}}
```

**Hints.** 1) `Math.ceil(retryAfterMs / 1000)`. 2) Login route par alag, strict limiter (brute-force protection), global par loose. 3) `x-forwarded-for` header khud mat parse karo; spoofable hai -- `app.set('trust proxy', n)` use karo.

### EX-RATE-06 - Memory safety and per-route policies [ADVANCED] (Advanced)

**Problem.** An in-memory limiter keyed by IP leaks memory (every IP stays forever). Add to your token bucket:
(a) eviction of keys idle long enough to be full again (cleanup sweep on an interval that does not keep the process
alive: `timer.unref()`), (b) `maxKeys` cap with oldest-first eviction, (c) `createPolicyRegistry({ default, routes })` mapping
`'POST /auth/login'` -> a stricter limiter, falling back to default. Explain why in-memory limiting breaks with
multiple server instances (each instance has its own counters).

**Examples.** With `maxKeys: 2`, touching keys a, b, c evicts `a`. A bucket idle for `capacity / refillPerSec` seconds is
full and can be dropped without changing behaviour.

**Hints.** 1) `Map` insertion order ka use karke oldest key milti hai (delete + set se refresh = LRU). 2) Dropping a full bucket loses nothing -- naya bucket bhi full se shuru hota hai.

### EX-RATE-07 - Distributed token bucket with Redis and Lua [ADVANCED] (Advanced)

**Problem.** Implement `createRedisTokenBucket(redis, { capacity, refillPerSec, ttlSec })` using `ioredis`. All
read-modify-write must be ATOMIC: use a Lua script (`EVAL`/`defineCommand`). State in a hash `tokens`, `ts` per key;
use Redis `TIME` for the clock (so app servers with skewed clocks do not matter); set key expiry so idle keys vanish.
Return `{ allowed, remaining, retryAfterMs }`. Also state a policy: if Redis is down, fail-open or fail-closed? Justify
for (a) login endpoint, (b) public product search.

**Examples.** Two app servers hitting the same key share one bucket: 5 allowed in total across both, not 5 each.

**Hints.** 1) Non-atomic GET -> compute -> SET race karta hai (two servers dono allow kar denge). 2) Lua script Redis mein single-threaded atomic chalta hai. 3) Fail-open = availability pehle, fail-closed = security pehle.

---

## 13. Preventing duplicate transaction requests - progressive ladder (EX-IDEM)

Scenario: client taps "Pay" twice, or the mobile network drops after the server charged but before the response
arrived and the client retries. The server must charge ONCE. Rungs go from in-memory logic to MySQL and Redis.

### EX-IDEM-01 - Idempotency key store (in-memory) [ESSENTIAL] (Basic)

**Problem.** Implement `createIdempotencyStore()` with `run(key, fn)`. First call for a key executes `fn()` and
stores its result; later calls (even much later) return the stored result WITHOUT calling `fn` again. Different keys are
independent.

**Examples.**

```js
let charges = 0;
const store = createIdempotencyStore();
const pay = () => store.run('pay-123', async () => ({ chargeId: ++charges }));
await pay(); // { chargeId: 1 }
await pay(); // { chargeId: 1 }  (charges === 1)
```

**Hints.** 1) `Map<key, result>`. 2) Stored value ko JS reference ki tarah mat do jo mutate ho sake (clone ya freeze). 3) Yeh sirf sequential duplicates handle karta hai -- agle rung mein concurrent.

### EX-IDEM-02 - Concurrent duplicates and failures [ESSENTIAL] (Intermediate)

**Problem.** Fix the race: two requests with the same key arriving at the same time must run `fn` ONCE. Store the
in-flight Promise. Make the factory `createIdempotencyStore({ ttlMs = 86_400_000, now = Date.now, isFinal })`: completed entries expire after `ttlMs`; if `fn`
rejects, do NOT store the failure (so a retry can run again) -- document the trade-off (for non-retryable business
errors like "insufficient funds" you may want to store the response; show how with an `isFinal(err)` option).

**Examples.**

```js
await Promise.all([pay(), pay(), pay()]); // fn ran once, all three get the same chargeId
```

**Hints.** 1) Sequential version mein `await fn()` ke baad set karte the -- gap mein doosri request nikal jaati thi. Pehle Promise set karo. 2) Reject par `map.delete(key)`.

### EX-IDEM-03 - Same key, different payload [ESSENTIAL] (Intermediate)

**Problem.** Reusing a key with a DIFFERENT request body is a client bug (or an attack) and must be rejected, not replayed.
Compute a fingerprint = SHA-256 of a CANONICAL JSON of the body (keys sorted recursively, so `{a:1,b:2}` equals `{b:2,a:1}`).
Store `{ fingerprint, promise }`. Same key + same fingerprint -> replay; same key + different fingerprint -> throw
`IdempotencyKeyReuseError` (HTTP 422).

**Examples.**

```js
await run('k1', { amount: 100, to: 'B' }, charge);
await run('k1', { to: 'B', amount: 100 }, charge); // replay (same canonical body)
await run('k1', { amount: 999, to: 'B' }, charge); // throws IdempotencyKeyReuseError
```

**Hints.** 1) `JSON.stringify` key order preserve karta hai -- isliye canonicalize karna padta hai. 2) Stripe isi tarah behave karta hai.

### EX-IDEM-04 - Express middleware for `POST /payments` [ESSENTIAL] (Intermediate)

**Problem.** Implement `idempotency({ store })` middleware. Requirements: header `Idempotency-Key` is required on POST
(`400` if missing, 8..64 safe chars); scope the key per authenticated user (`userId + ':' + key`); first request runs the
handler and the middleware captures status code + JSON body; a replay returns the SAME status and body with header
`Idempotency-Replayed: true`; a request arriving while the first is still in progress gets `409` with `Retry-After: 1`;
same key different body -> `422`. 5xx results are not stored.

**Examples.**

```
POST /payments  Idempotency-Key: 7f3c-pay-001   {"amount":500}  -> 201 {"paymentId":"p1"}
POST /payments  Idempotency-Key: 7f3c-pay-001   {"amount":500}  -> 201 {"paymentId":"p1"}  Idempotency-Replayed: true
POST /payments  Idempotency-Key: 7f3c-pay-001   {"amount":900}  -> 422
```

**Hints.** 1) `res.json` ko wrap/override karke body capture karo. 2) Handler error (5xx) ko store karoge to client kabhi recover nahi karega.

### EX-IDEM-05 - Durable idempotency in MySQL [ESSENTIAL] (Advanced)

**Schema.**

```sql
CREATE TABLE idempotency_keys (
  user_id       INT NOT NULL,
  idem_key      VARCHAR(64) NOT NULL,
  fingerprint   CHAR(64) NOT NULL,
  status        ENUM('IN_PROGRESS','COMPLETED') NOT NULL,
  response_code INT NULL,
  response_body JSON NULL,
  locked_until  DATETIME(3) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, idem_key)
) ENGINE=InnoDB;
```

**Problem.** Implement `executeOnce(pool, { userId, key, fingerprint, leaseMs }, work)`. Algorithm: (1) try
`INSERT` of an `IN_PROGRESS` row with `locked_until = now + lease` (unique PK is the lock); (2) on duplicate key
(`errno 1062`): read the row (`FOR UPDATE` in a short transaction), if fingerprint differs -> reuse error; if
`COMPLETED` -> return stored response (replayed); if `IN_PROGRESS` and lease not expired -> throw `ConflictError`
(in progress); if lease expired -> take over (crash recovery); (3) run `work(conn)`; (4) mark `COMPLETED` with the
response. Decide and explain: should `work` and the `COMPLETED` update share ONE transaction? (Yes for DB-only side effects.)

**Examples.** Two parallel calls with the same `(userId, key)`: one runs `work`, the other gets `ConflictError` or the stored
response. A server crash between steps (1) and (4) is recoverable after `leaseMs`.

**Hints.** 1) Database ki unique constraint wo cheez hai jo race mein bhi sahi rehti hai; application-level check nahi. 2) Same transaction mein effect + COMPLETED mark ho to "effect hua par record nahi" wala gap band ho jata hai. 3) External API call (jaise payment gateway) transaction mein nahi aati -- usko gateway ki apni idempotency key bhejo.

### EX-IDEM-06 - Duplicate-safe money transfer (unique reference) [ESSENTIAL] (Advanced)

**Problem.** Reuse the `accounts` and `ledger` tables from EX-TXN. Add table
`transfers(ref VARCHAR(64) PRIMARY KEY, from_id INT, to_id INT, amount DECIMAL(12,2), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`.
Implement `transferOnce(pool, { ref, fromId, toId, amount })` where `ref` is the client-supplied unique reference. In ONE transaction:
`INSERT INTO transfers` first (duplicate `ref` -> errno 1062 -> look up and return the existing transfer without moving money again),
then lock accounts in order, move money, write ledger rows. The dedupe record and the money movement commit or roll back TOGETHER.

**Examples.**

```js
await transferOnce(pool, { ref: 'T-9', fromId: 1, toId: 2, amount: '100.00' }); // { duplicate: false, ... }
await transferOnce(pool, { ref: 'T-9', fromId: 1, toId: 2, amount: '100.00' }); // { duplicate: true, ... } balance moved once
```

**Hints.** 1) Check-then-insert (SELECT ref, agar nahi to INSERT) race hai; insert-first + unique key correct hai. 2) Rollback par transfers row bhi chala jata hai, to failed transfer retry ho sakta hai -- yeh intended behaviour hai (document karo).

### EX-IDEM-07 - Redis lock + cached response, and what can still go wrong [ADVANCED] (Advanced)

**Problem.** Implement `idempotentRedis(redis, key, { lockTtlMs, resultTtlSec }, work)` with `ioredis`: (1) if a result exists
at `idem:result:<key>`, return it; (2) acquire lock with `SET idem:lock:<key> <token> NX PX lockTtlMs`; if not acquired -> in-progress
(`409`); (3) run `work()`; (4) store result with `SET ... EX resultTtlSec`; (5) release the lock ONLY if it still holds
your token (Lua compare-and-delete). Then answer in writing: what happens if `work` takes longer than `lockTtlMs`?
Why can Redis alone not make a payment exactly-once, and what do you add (hint: downstream provider idempotency key,
DB unique constraint)?

**Examples.** Two concurrent calls: one acquires lock and executes; the other returns `409` until the result is cached, then replays.

**Hints.** 1) Lock release bina token check ke kisi aur ka lock hata sakta hai (expired + re-acquired). 2) TTL expire ho gaya aur work abhi chal raha hai -> do workers. 3) Exactly-once effects practically "at-least-once delivery + idempotent processing" se milte hain.

<div style="page-break-before: always;"></div>

---

---

# PART II - SOLUTIONS

**STOP.** Agar tumne Part I ke problems khud attempt nahi kiye, to wapas jao. Solution padhna aur solution
likh paana alag skills hain; interview mein doosri wali chahiye.

## How to use the solutions

- Har solution mein: **Expected approach**, **Reference solution** (runnable), **Complexity**, **Common mistakes**.
- Sab code ES modules mein hai (`"type": "module"`). File ka naam code ke pehle comment mein likha hai (for example
  `ex-err-02.js`). Kuch solutions pehle wali files import karte hain, isliye **sab solution files ek hi folder mein
  rakho**.
- Dependency map (kaun kisko import karta hai):

| File | Imports |
|------|---------|
| ex-mw-05.js | ex-err-02.js |
| ex-exp-04.js | ex-err-02.js, ex-mw-05.js |
| ex-exp-05.js, ex-exp-06.js | ex-err-02.js, ex-mw-05.js, ex-exp-04.js |
| ex-rate-05.js | ex-rate-04.js |
| ex-idem-04.js | ex-idem-03.js |
| ex-txn-05.js | ex-err-02.js |
| ex-txn-01/03.js | ex-err-02.js |
| ex-txn-06.js, ex-txn-07.js | ex-txn-04.js |
| ex-idem-05.js, ex-idem-07.js | ex-err-02.js |
| ex-idem-06.js | ex-err-02.js, ex-txn-01.js, ex-txn-04.js |
| ex-jwt-03.js | ex-err-02.js, ex-mw-05.js |
| ex-test-05 (test) | ex-async-03.js; ex-test-06 (test) imports ex-err-02.js, ex-mw-05.js |

- Verification status (honest): the pure JavaScript, Express, JWT and test solutions were executed and passed
  (Node 20 and Express 5). The EX-SQL-01..08 queries and EX-TXN-01..07 solutions were later run against a real
  MySQL 8.0.46 with mysql2 3.24.6 and behaved as documented (stated result sets matched; concurrent transfers,
  stock reservation, outbox and lost-update fixes gave correct totals). The Redis solutions (EX-IDEM-05/06/07,
  EX-RATE-07) and the MySQL parts of EX-IDEM-05/06/07 were NOT run against a live server; their control flow was
  checked with a scripted fake pool and the SQL was reviewed by hand. Run them against your own MySQL 8 / Redis
  before relying on them.
- The SQL result sets in section 7 were verified with an independent SQL engine (SQLite, equivalent logic); MySQL
  prints DECIMAL columns with 2 decimals (for example `1200.00`).

---

## 1. Promises and async/await - solutions

### EX-ASYNC-01 - `promisify`

**Expected approach.** Node-style callback ko Promise mein wrap karo: callback `(err, result)` aaye to `reject` ya
`resolve`. `function` (arrow nahi) use karo taaki `this` preserve ho; `fn.call(this, ...)`. Executor ke andar sync throw
automatically rejection ban jaata hai.

**Reference solution.**

```js
// ex-async-01.js
export function promisify(fn) {
  return function promisified(...args) {
    return new Promise((resolve, reject) => {
      // sync throw inside the executor is turned into a rejection automatically
      fn.call(this, ...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// demo
function fakeRead(path, cb) {
  setTimeout(() => (path === 'a.txt' ? cb(null, 'hello') : cb(new Error('ENOENT'))), 10);
}
const read = promisify(fakeRead);
console.log(await read('a.txt')); // hello
await read('b.txt').catch((e) => console.log(e.message)); // ENOENT
```

**Complexity.** O(1) time and space overhead per call.

**Common mistakes.**
- Arrow function return karna, jisse `this` lost ho jaata hai (class methods promisify karte waqt bug).
- `resolve(result)` ke saath `err` ko ignore karna ya dono ko call karna (resolve/reject sirf pehli baar kaam karta hai, par logic saaf rakho).
- Real life mein `util.promisify` use karo; yahan sirf samajhne ke liye khud likha. `util.promisify.custom` aur multi-value callbacks edge cases hain.

### EX-ASYNC-02 - Sequential vs parallel

**Expected approach.** Sequential: `for...of` mein `await task()`; ek task fail ho to loop ruk jaata hai aur baaki tasks
start hi nahi hote. Parallel: sab tasks turant start (`map`), phir `Promise.all`. Sequential tab chahiye jab ek step doosre par depend
kare ya order of side effects matter kare; parallel jab tasks independent ho.

**Reference solution.**

```js
// ex-async-02.js
export async function runSequential(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task()); // next task starts only after this one settles; a rejection stops the loop
  }
  return results;
}

export function runParallel(tasks) {
  return Promise.all(tasks.map((task) => task()));
}

// demo
const task = (ms, v) => () => new Promise((r) => setTimeout(() => r(v), ms));
let t0 = Date.now();
console.log(await runSequential([task(100, 'a'), task(100, 'b'), task(100, 'c')]), Date.now() - t0, 'ms');
t0 = Date.now();
console.log(await runParallel([task(100, 'a'), task(100, 'b'), task(100, 'c')]), Date.now() - t0, 'ms');
```

**Complexity.** Time: sequential = sum of task times, parallel = max of task times. Space O(n) for results.

**Common mistakes.**
- `tasks.map(async (t) => await t())` ko sequential samajhna: yeh parallel hi hai.
- `forEach(async ...)` use karna: await nahi hota (EX-ERR-01).
- Parallel mein tasks ko bina limit ke 10,000 baar start karna: DB/API overload. Bounded version EX-ASYNC-05 hai.
- `Promise.all` fail-fast hai: ek reject hone par baaki tasks ruk nahi jaate, bas unka result ignore hota hai.

### EX-ASYNC-03 - `retry` with exponential backoff

**Expected approach.** Loop `retries + 1` attempts. Har failure par agar last attempt hai ya `shouldRetry(err)` false hai
to error throw. Warna `min(maxDelay, base * factor^(attempt-1))` sleep karke dobara. `sleep` injectable rakho taaki tests
real time na lein. Production mein jitter bhi add karte hain (thundering herd rokne ke liye) -- yahan `sleep` ke argument
mein jitter laga sakte ho.

**Reference solution.**

```js
// ex-async-03.js
const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retry(fn, options = {}) {
  const {
    retries = 3,
    baseDelayMs = 100,
    factor = 2,
    maxDelayMs = 5000,
    shouldRetry = () => true,
    sleep = realSleep,
  } = options;

  const maxAttempts = retries + 1;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const isLast = attempt === maxAttempts;
      if (isLast || !shouldRetry(err)) throw err;
      const delay = Math.min(maxDelayMs, baseDelayMs * factor ** (attempt - 1));
      await sleep(delay);
    }
  }
  throw lastError; // unreachable, keeps linters happy
}

// demo (only when run directly, so tests can import { retry })
if (process.argv[1] === import.meta.filename) {
  let calls = 0;
  const delays = [];
  const flaky = async () => {
    calls++;
    if (calls < 3) throw new Error('boom');
    return 'ok';
  };
  console.log(await retry(flaky, { baseDelayMs: 100, sleep: async (ms) => delays.push(ms) }), calls, delays);
  // ok 3 [ 100, 200 ]
}
```

**Complexity.** Worst-case time = sum of delays + attempts * fn time. O(1) space.

**Common mistakes.**
- Last attempt ke baad bhi sleep karna.
- Har error par retry (validation 400 errors retry karne ka koi fayda nahi; `shouldRetry` isliye hai).
- Non-idempotent operations (payment POST) ko blindly retry karna: double charge. EX-IDEM dekho.
- Backoff bina cap ke: 2^10 seconds wait. `maxDelayMs` zaroori hai.
- Same delay sab clients ke liye: sab ek saath retry karte hain. Jitter lagao.

### EX-ASYNC-04 - `withTimeout` with cancellation

**Expected approach.** `AbortController` banao; `setTimeout` mein `controller.abort(new TimeoutError(...))` aur timeout
promise reject. `Promise.race([fn(signal), timeout])`. `finally` mein `clearTimeout` zaroor, warna jab `fn` jaldi
khatam ho to bhi timer 50 ms (ya jo bhi ms ho) tak process ko zinda rakhta hai.

**Important idea.** `Promise.race` sirf caller ko reject karta hai; underlying kaam (HTTP call, DB query) apne aap nahi ruk jaata.
Real cancellation ke liye `fn` ko `signal` mil raha hai (`fetch(url, { signal })`, `fs.readFile(path, { signal })`).

**Reference solution.**

```js
// ex-async-04.js
export class TimeoutError extends Error {
  constructor(ms) {
    super(`Timed out after ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout(fn, ms) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new TimeoutError(ms);
      controller.abort(err); // tell the underlying work to stop
      reject(err);
    }, ms);
  });
  try {
    return await Promise.race([fn(controller.signal), timeout]);
  } finally {
    clearTimeout(timer); // always: otherwise the timer keeps the event loop alive
  }
}

// demo
const slow = (signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve('late'), 500);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(signal.reason);
    });
  });
await withTimeout(slow, 50).catch((e) => console.log(e.name)); // TimeoutError
console.log(await withTimeout(async () => 'fast', 50)); // fast
```

**Complexity.** O(1).

**Common mistakes.**
- `Promise.race` + `setTimeout` karke timer clear na karna (event loop alive, memory held, tests hang).
- Soch lena ki race ne underlying work cancel kar diya.
- Timeout hone ke baad `fn` ki late rejection unhandled reh jaana: race ne us promise par handler laga diya hota hai, isliye yahan safe hai; par agar race use na karo to dhyan do.
- `AbortSignal.timeout(ms)` simple cases ke liye theek hai (Node 18+); yahan manual version isliye taaki clear-timer logic dikhe.

### EX-ASYNC-05 - `mapLimit`

**Expected approach.** Worker pool pattern: `limit` workers, sab ek shared counter `next` se agla index lete hain.
`const i = next++` synchronous hai, isliye do workers ko ek hi index nahi milta (single-threaded JS). Results index par store karo
taaki order bana rahe. Failure par `failed = true` karo: workers naye item nahi uthayenge, aur `Promise.all` first error se reject ho jayega.

**Reference solution.**

```js
// ex-async-05.js
export async function mapLimit(items, limit, asyncFn) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer');
  const results = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed) {
      const i = next++; // synchronous: no two workers get the same index
      if (i >= items.length) return;
      try {
        results[i] = await asyncFn(items[i], i);
      } catch (err) {
        failed = true; // stop other workers from picking new items
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// demo
let running = 0;
let maxRunning = 0;
const out = await mapLimit([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, async (n) => {
  running++;
  maxRunning = Math.max(maxRunning, running);
  await new Promise((r) => setTimeout(r, 20));
  running--;
  return n * 2;
});
console.log(out, 'max concurrent:', maxRunning); // [2..20] max concurrent: 3
```

**Complexity.** Time ~ ceil(n / limit) * average task time. Space O(n) for results, O(limit) for workers.

**Common mistakes.**
- `chunks` banake `Promise.all` chunk-by-chunk: ek slow task poore chunk ko rokta hai (worker pool better utilization deta hai).
- Results `push` karna (completion order mil jaata hai, input order nahi).
- `limit` validate na karna: `limit = 0` par kuch bhi nahi chalega aur promise hang/empty result.
- Already-started in-flight tasks fail ke baad bhi chalte rehte hain; cancel chahiye to AbortSignal (EX-ASYNC-04) pass karo.

### EX-ASYNC-06 - `Promise.all` from scratch

**Expected approach.** Input ko array banao, `remaining` counter rakho. Har item `Promise.resolve(item).then(...)` se result ko
`results[i]` mein rakho; counter 0 par resolve. Pehla reject poore promise ko reject karta hai (baad wale `reject` calls ignore).
Empty input par turant `[]`.

**Reference solution.**

```js
// ex-async-06.js
export function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) {
      resolve(results); // [] for empty input
      return;
    }
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value; // by index, not push: keeps input order
        if (--remaining === 0) resolve(results);
      }, reject); // first rejection wins; later reject() calls are ignored
    });
  });
}

// demo
console.log(await promiseAll([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 10))])); // [1,2,3]
console.log(await promiseAll([])); // []
await promiseAll([Promise.resolve(1), Promise.reject(new Error('x'))]).catch((e) => console.log(e.message)); // x
```

**Complexity.** O(n) time, O(n) space.

**Common mistakes.**
- `results.push(value)`: order complete hone ke time ke hisaab se bigad jaata hai.
- Empty array par kabhi resolve na karna (hang).
- Plain values (`1`) ko `.then` karne ki koshish: `Promise.resolve(item)` se wrap karo.
- `results.length === items.length` se completion check karna: sparse array / index assignment ke saath galat. Counter use karo.
- Real `Promise.all` iterables (Set, generators) bhi leta hai: isliye `Array.from`.

### EX-ASYNC-07 - Single-flight memoization

**Expected approach.** Map mein **Promise** store karo (value nahi). Pehli call promise banati hai aur turant Map mein
daalti hai; baaki calls wahi promise return karti hain, isliye `fn` ek hi baar chalta hai. Success par TTL set karo; failure par entry delete
karo (error cache nahi hona chahiye). In-flight entry ki `expiresAt` null hai (expire nahi hoti).

**Reference solution.**

```js
// ex-async-07.js
export function singleFlight(fn, ttlMs = 1000, now = () => Date.now()) {
  const entries = new Map(); // key -> { promise, expiresAt }

  return function cached(key) {
    const hit = entries.get(key);
    if (hit && (hit.expiresAt === null || hit.expiresAt > now())) return hit.promise;

    const entry = { promise: null, expiresAt: null }; // null = still in flight, never expires
    entry.promise = Promise.resolve()
      .then(() => fn(key))
      .then(
        (value) => {
          entry.expiresAt = now() + ttlMs; // TTL starts when the value is ready
          return value;
        },
        (err) => {
          if (entries.get(key) === entry) entries.delete(key); // do not cache failures
          throw err;
        },
      );
    entries.set(key, entry);
    return entry.promise;
  };
}

// demo
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let hits = 0;
const load = singleFlight(async (id) => {
  hits++;
  await sleep(50);
  return { id };
}, 1000);
await Promise.all([load('u1'), load('u1'), load('u1')]);
console.log('fn calls:', hits); // 1
```

**Complexity.** O(1) per call; memory O(number of distinct keys) until TTL expiry (add a sweep or LRU in production).

**Common mistakes.**
- Value cache karna aur `await fn()` ke baad set karna: beech ke gap mein sab concurrent calls miss ho jaati hain (stampede).
- Rejected promise ko cache kar dena: ek transient error TTL tak sab ko milta rahega.
- TTL ko promise creation se naapna (slow fn ke saath cache turant expire ho jaata hai): TTL value ready hone par start karo.
- Multi-instance deployment mein yeh sirf ek process ke andar protect karta hai; cross-instance ke liye Redis lock (EX-IDEM-07).

---

## 2. Event loop output prediction - solutions

Sab outputs Node 22 (aur Node 20) par run karke verify kiye gaye hain.

### EX-LOOP-01

**Output.**

```
1
4
3
2
```

**Why.** `1` aur `4` synchronous (call stack). Call stack khali hone par microtask queue drain hoti hai: promise `.then` -> `3`.
Uske baad event loop timers phase mein aata hai: `setTimeout` callback -> `2`. Rule: **sync -> microtasks -> macrotasks**.

**Common mistake.** `setTimeout(..., 0)` ko "turant" samajhna. Woh sirf "kam se kam is ke baad, jab stack aur microtasks khali ho".

### EX-LOOP-02

**Output.**

```
script start
first start
second
executor
script end
first end
then 1
then 2
```

**Why.**
1. `script start` sync.
2. `first()` sync chalta hai `await` tak: `first start`, phir `second()` call hota hai (sync) -> `second`. `second()` ek already-resolved promise
   return karta hai; `await` usko dekhkar `first` ka baaki hissa ek microtask mein schedule karta hai (queue position 1).
3. `new Promise` ka executor sync hai: `executor`. `resolve()` ke baad `.then(then 1)` register hota hai; promise already resolved hai, to `then 1`
   ka microtask queue position 2 par.
4. `script end` sync.
5. Microtasks FIFO: `first end` (position 1), `then 1` (position 2), uske baad `then 1` ne `then 2` ko queue kiya -> `then 2`.

**Common mistake.** Yeh sochna ki `await` poora function pause karke baaki script ke baad aata hai macrotask ki tarah. Nahi: woh microtask hai.
Version note: modern V8 (Node 12+) mein `await nativePromise` ek tick leta hai; purane engines mein 3 ticks lagte the, to order alag ho sakta tha.

### EX-LOOP-03

**Output.**

```
timer
timer end
nextTick
promise
microtask
```

**Why.** Timer callback ke andar sync lines pehle (`timer`, `timer end`). Callback khatam hone par Node pehle **nextTick queue** drain karta hai
(`nextTick`), phir **promise microtask queue** (`promise`, `microtask` FIFO order mein, kyunki `queueMicrotask` aur promise jobs ek hi microtask queue
share karte hain).

**Why a timer callback and not top-level code?** ESM module ka top-level code khud ek promise/microtask context ke andar chalta hai,
isliye top-level par `Promise.then` aur `process.nextTick` ka order ulta dikhta hai (`promise` pehle, `nextTick` baad mein). CommonJS top-level par `nextTick`
pehle aata hai. Hamne ek timer callback use kiya taaki output module type par depend na kare. Isse yaad rakho: **nextTick queue tabhi pehle hoti hai jab
hum macrotask callback ke baad process kar rahe ho**.

**Common mistake.** "nextTick hamesha promise se pehle" bolna. ESM top-level mein yeh galat hai. Aur `nextTick` ka over-use I/O ko starve kar sakta hai
(recursive nextTick loop event loop ko aage badhne nahi deta).

### EX-LOOP-04

**Output.**

```
read done
immediate
timeout
```

**Why.** `readFile` ka callback event loop ke **poll phase** mein chalta hai. Poll ke baad agla phase **check** hai (jahan `setImmediate` chalta hai); timers
phase poore loop iteration ke baad aata hai. Isliye I/O callback ke andar `setImmediate` hamesha `setTimeout(0)` se pehle chalta hai.

**Top-level of main module.** Wahan `setTimeout(0)` aur `setImmediate` ka order **non-deterministic** hai: `setTimeout(0)` actually 1 ms threshold par
set hota hai; agar process ko loop start karne mein 1 ms se zyada laga to timers phase pehle chalega, warna check phase. Isliye interviews mein "order
guaranteed nahi hai, I/O callback ke andar guaranteed hai" kehna sahi jawab hai.

**Common mistake.** `setImmediate` ko "immediately" samajhna aur `process.nextTick` se confuse karna. Hint: nextTick current operation ke turant baad (event loop ke
phase ke bahar), `setImmediate` check phase mein.

### EX-LOOP-05

**Output (Node 11+ including 20 and 22).**

```
T1
M-in-T1
T2
```

**Output (Node 10 and older).**

```
T1
T2
M-in-T1
```

**Why.** Node 11 se, har individual timer callback ke baad microtask/nextTick queue drain hoti hai (browser jaisa behaviour). Purane Node mein poori
expired timers ki list chalti thi aur uske baad microtasks. Interview mein version-dependent behaviour mention karna senior signal hai.

### EX-LOOP-06

**Output.**

```
A
C
p1
p2
B
done
```

**Total time.** About 30 ms. `wait(30,'p1')` aur `wait(10,'p2')` dono `await` se pehle call ho gaye, isliye dono timers
ek saath chal rahe hain. `await p1` 30 ms par resolve hota hai; tab tak `p2` (10 ms) already resolved hai, isliye `await p2` ek microtask mein pura.

**Variation.** Agar `const p2 = wait(10,'p2')` pehle `await` ke **baad** create ho to timers sequential ho jaate hain: 30 ms + 10 ms = about 40 ms. Lesson:
**promise banate hi kaam shuru ho jaata hai; `await` sirf intezaar karta hai.** Parallel karna ho to promises pehle sab create karo, phir await.

**Why `C` is second.** `main()` pehle `await` tak sync chalta hai (`A`), phir control caller ko lautta hai, to `C` sync chalta hai.

---

## 3. Array and object manipulation - solutions

### EX-ARR-01 - Group and total orders

**Expected approach.** `reduce` with object accumulator: sirf `PAID` orders. `topCustomer` mein `Object.entries` par linear scan with tie-break (string compare).

**Reference solution.**

```js
// ex-arr-01.js
export function totalsByCustomer(orders) {
  return orders.reduce((acc, o) => {
    if (o.status !== 'PAID') return acc;
    acc[o.customerId] = (acc[o.customerId] ?? 0) + o.amount;
    return acc;
  }, {});
}

export function topCustomer(totals) {
  let best = null;
  for (const [id, total] of Object.entries(totals)) {
    if (best === null || total > best[1] || (total === best[1] && id < best[0])) {
      best = [id, total];
    }
  }
  return best;
}

// demo
const orders = [
  { id: 1, customerId: 'c1', amount: 100, status: 'PAID' },
  { id: 2, customerId: 'c2', amount: 300, status: 'CANCELLED' },
  { id: 3, customerId: 'c1', amount: 50, status: 'PAID' },
  { id: 4, customerId: 'c2', amount: 70, status: 'PAID' },
];
console.log(totalsByCustomer(orders)); // { c1: 150, c2: 70 }
console.log(topCustomer(totalsByCustomer(orders))); // [ 'c1', 150 ]
console.log(topCustomer({})); // null
```

**Complexity.** O(n) time, O(c) space (c = distinct customers).

**Common mistakes.**
- `status` filter bhool jaana; ya cancelled orders count karna.
- Accumulator ko mutate karte hue bhi galti se input orders mutate karna.
- Customer id numeric ho to object keys strings ban jaati hain (`'1'` vs `1`): `Map` use karo jab key type matter kare.
- Floating point money (0.1 + 0.2): paise (integers) mein calculate karo.

### EX-ARR-02 - Dedupe keeping the latest

**Expected approach.** `Map` key -> best record. Naya record sirf tab replace kare jab uska time bada ho. `Map.set` existing key par position nahi badalta,
isliye first-appearance order preserve hota hai.

**Reference solution.**

```js
// ex-arr-02.js
export function dedupeLatest(records, keyField, timeField) {
  const latest = new Map(); // Map keeps first-insertion order of keys
  for (const rec of records) {
    const key = rec[keyField];
    const current = latest.get(key);
    if (current === undefined || rec[timeField] > current[timeField]) {
      latest.set(key, rec); // set on an existing key keeps its original position
    }
  }
  return [...latest.values()];
}

// demo
console.log(
  dedupeLatest(
    [
      { id: 'a', v: 1, at: '2024-01-01' },
      { id: 'b', v: 2, at: '2024-01-02' },
      { id: 'a', v: 3, at: '2024-01-05' },
    ],
    'id',
    'at',
  ),
); // [ { id: 'a', v: 3, ... }, { id: 'b', v: 2, ... } ]
```

**Complexity.** O(n) time, O(k) space.

**Common mistakes.**
- Pehle `sort` karke `filter(index === findIndex)`: O(n^2) aur order change.
- Input records ko mutate karna ya sort `records.sort` (in-place) karna.
- Mixed date formats compare karna (`'2024-1-5'` vs ISO): pehle normalize.

### EX-ARR-03 - Build a tree

**Expected approach.** Pehla pass: har item ka copy (`replies: []`) `Map` mein. Doosra pass: parent `Map` mein mile to `parent.replies.push(node)`, warna root.
Order input order mein rehta hai. Orphan (`parentId` exist nahi karta) root ban jaata hai.

**Reference solution.**

```js
// ex-arr-03.js
export function buildTree(flat) {
  const nodes = new Map();
  for (const item of flat) nodes.set(item.id, { ...item, replies: [] }); // copies: input untouched

  const roots = [];
  for (const item of flat) {
    const node = nodes.get(item.id);
    const parent = item.parentId == null ? undefined : nodes.get(item.parentId);
    if (parent) parent.replies.push(node);
    else roots.push(node); // parentId null OR orphan
  }
  return roots;
}

// demo
console.log(
  JSON.stringify(
    buildTree([
      { id: 1, parentId: null, text: 'root' },
      { id: 2, parentId: 1, text: 'reply' },
      { id: 3, parentId: 2, text: 'nested' },
      { id: 4, parentId: 99, text: 'orphan' },
    ]),
    null,
    1,
  ),
);
```

**Complexity.** O(n) time, O(n) space (do passes, har lookup O(1)).

**Common mistakes.**
- Har item ke liye `flat.filter(parentId === id)` (O(n^2)).
- Recursion par depend karna jo deep thread par stack overflow kare; yahan iterative hai.
- Input objects mein `replies` add karke mutate karna.
- Cycles (`a.parent = b`, `b.parent = a`) ke case mein koi root nahi banta aur woh data silently gayab ho jaata hai: production mein detect karo.

### EX-ARR-04 - Immutable `setIn`

**Expected approach.** Recursion: path ka pehla key `head`. Child ko recursively update karo, phir current level ko copy karo (array ho to `slice`, object ho to spread)
aur sirf `head` replace karo. Jo branches path par nahi hain unka reference same rehta hai (structural sharing), isliye React `===` comparison se pata chal jaata hai kya badla.

**Reference solution.**

```js
// ex-arr-04.js
export function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const base = obj ?? (typeof key === 'number' ? [] : {});
  const child = setIn(base[key], rest, value);
  if (Array.isArray(base)) {
    const copy = base.slice();
    copy[key] = child;
    return copy;
  }
  return { ...base, [key]: child };
}

// demo
const a = { user: { name: 'Asha', tags: ['x'] }, meta: { v: 1 } };
const b = setIn(a, ['user', 'tags', 1], 'y');
console.log(b.user.tags, a.user.tags, b.meta === a.meta); // [ 'x', 'y' ] [ 'x' ] true
console.log(JSON.stringify(setIn({}, ['a', 0, 'b'], 1))); // {"a":[{"b":1}]}
```

**Complexity.** O(d * w): d = path length, w = width of the copied level (shallow copies only). Space same.

**Common mistakes.**
- `JSON.parse(JSON.stringify(obj))` deep clone se update karna: structural sharing khatam, Dates/Map/undefined toot jaate hain, slow.
- `structuredClone` bhi poora clone karta hai (sharing nahi).
- Array index par `{...arr}` karna: array object ban jaata hai.
- Prototype pollution: user-controlled path mein `__proto__` ho to dangerous. Untrusted path ko validate/deny-list karo.

### EX-ARR-05 - Top K words

**Expected approach.** Lowercase, regex se words, `Map` counts, entries sort (count desc, word asc), `slice(0, k)`. Tie-break alphabetical hai, isliye `and` (2) `cat` (2) se pehle aata hai.

**Reference solution.**

```js
// ex-arr-05.js
export function topK(text, k) {
  const counts = new Map();
  for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))
    .slice(0, k);
}

// demo
console.log(topK('The cat and the hat. The end, and THE cat!', 2)); // [ [ 'the', 4 ], [ 'and', 2 ] ]
```

**Complexity.** O(n) to count, O(u log u) to sort (u = unique words). A heap of size k gives O(n log k) when u is huge and k is small.

**Common mistakes.**
- `split(' ')`: punctuation (`hat.`, `cat!`) alag word ban jaata hai.
- Case-sensitive counting (`The` vs `the`).
- Sort comparator mein sirf count compare karna: ties ka order unspecified feel hota hai (engines stable sort karte hain, par spec tie-break nahi deta).
- Plain object counts use karna: word `constructor` / `__proto__` par bug. `Map` safe hai.

### EX-ARR-06 - Merge intervals

**Expected approach.** Copy banao, start se sort, phir ek pass: agar naya start <= last end hai to merge (`max` of ends), warna naya interval. `[1,3]` aur `[3,5]` touch karte hain, isliye `<=`.

**Reference solution.**

```js
// ex-arr-06.js
export function mergeIntervals(intervals) {
  const sorted = intervals.map(([s, e]) => [s, e]).sort((a, b) => a[0] - b[0]); // copy, then sort
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

// demo
console.log(mergeIntervals([[8, 10], [1, 3], [2, 6], [15, 18], [6, 7]])); // [ [ 1, 7 ], [ 8, 10 ], [ 15, 18 ] ]
console.log(mergeIntervals([])); // []
```

**Complexity.** O(n log n) (sorting), O(n) extra space.

**Common mistakes.**
- Sort na karna (merge sirf sorted input par kaam karta hai).
- `last.end = end` (max nahi): `[1,10]` ke baad `[2,3]` interval ko chhota kar deta hai.
- Input arrays mutate karna (`last[1] = ...` agar copy na kiya ho to original change).
- Default `sort()` (lexicographic): `[10]` pehle `[2]` se aata hai. Numeric comparator do.

---

## 4. Asynchronous error handling - solutions

### EX-ERR-01 - `forEach` + `async`

**Diagnosis.** `forEach` callback ki return value (Promise) ignore karta hai. `saveAll` ne callbacks start kiye aur turant `saved` (abhi khali) return kar diya, isliye `[]` print hua.
Invalid user wala callback baad mein reject hua, lekin us rejected promise par koi handler nahi laga tha, isliye **unhandled rejection** (Node 15+ default: process crash).
Caller ka `try/catch` kuch pakad nahi sakta kyunki function pehle hi return ho chuka tha.

**Reference solution.**

```js
// ex-err-01.js
const save = async (user) => {
  if (!user.email) throw new Error('email required');
  return { ...user, saved: true };
};

// Fix A: sequential (stops at the first failure, easy to reason about)
export async function saveAllSequential(users) {
  const saved = [];
  for (const u of users) saved.push(await save(u));
  return saved;
}

// Fix B: parallel (all start together, results keep input order, first rejection rejects)
export function saveAll(users) {
  return Promise.all(users.map((u) => save(u)));
}

// demo
console.log(await saveAll([{ email: 'a@x.com' }, { email: 'b@x.com' }]));
try {
  await saveAll([{ email: 'a@x.com' }, { name: 'no email' }]);
} catch (err) {
  console.log('caught:', err.message); // caught: email required
}
```

**Complexity.** Sequential: sum of task times; parallel: max. O(n) space.

**Common mistakes.**
- `forEach`, `filter`, `reduce` ke andar `async` callback use karna aur result await na karna.
- `Promise.all(users.map(save))` ko sequential samajhna; yeh parallel hai.
- `try/catch` ko loop ke bahar sab par laga dena aur partial results kho dena: agar partial success chahiye to EX-ERR-03 (`allSettled`).

### EX-ERR-02 - Custom error classes

**Expected approach.** `AppError extends Error` with `super(message, { cause })` (ES2022). `this.name = new.target.name` taaki subclass ka naam sahi aaye. `status`, `code`, `details`,
`isOperational` (expected errors vs programmer bugs). `toJSON()` sirf client-safe fields: stack aur cause kabhi nahi.

**Reference solution.**

```js
// ex-err-02.js
export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL', details, cause } = {}) {
    super(message, { cause });
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true; // an expected, handled kind of error (not a bug)
  }

  toJSON() {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', opts = {}) {
    super(message, { ...opts, status: 404, code: 'NOT_FOUND' });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = [], opts = {}) {
    super(message, { ...opts, status: 422, code: 'VALIDATION_FAILED', details });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', opts = {}) {
    super(message, { ...opts, status: 409, code: 'CONFLICT' });
  }
}

// demo (runs only when this file is executed directly, not when imported)
if (process.argv[1] === import.meta.filename) {
  const e = new NotFoundError('Order 5 not found');
  console.log(e.status, e instanceof AppError, e instanceof Error, e.name, e.isOperational);
  console.log(JSON.stringify(e)); // {"error":{"code":"NOT_FOUND","message":"Order 5 not found"}}
  console.log(JSON.stringify(new ValidationError('Invalid body', [{ field: 'title', message: 'required' }])));
}
```

**Complexity.** O(1).

**Common mistakes.**
- `Object.setPrototypeOf` hacks: ES2015+ classes mein zaroorat nahi (sirf TypeScript target ES5 par).
- `name` set na karna: logs mein sab `Error` dikhte hain.
- `JSON.stringify(err)` default mein `message` aur `stack` chhod deta hai (non-enumerable) ya galti se stack leak kar deta hai agar enumerable bana do. `toJSON` explicit rakho.
- `cause` ko response mein bhej dena: internal DB error leak.
- Har cheez ke liye `instanceof` chain: `code` field se bhi decide kar sakte ho (service boundaries par `instanceof` toot sakta hai agar duplicate package versions ho).

### EX-ERR-03 - Batch processor that never throws

**Expected approach.** `Promise.allSettled(items.map(async (item) => handler(item)))`. Async wrapper sync throws ko rejection bana deta hai. Results ko index se original `items[i]` ke saath pair karo.

**Reference solution.**

```js
// ex-err-03.js
export async function processBatch(items, handler) {
  // the async wrapper turns a synchronous throw into a rejection too
  const settled = await Promise.allSettled(items.map(async (item) => handler(item)));
  const succeeded = [];
  const failed = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') succeeded.push({ item: items[i], value: r.value });
    else failed.push({ item: items[i], error: r.reason });
  });
  return { succeeded, failed };
}

// demo
const handler = async (n) => {
  if (n % 2) throw new Error('odd ' + n);
  return n * 10;
};
const out = await processBatch([1, 2, 3, 4], handler);
console.log(out.succeeded, out.failed.map((f) => [f.item, f.error.message]));
console.log((await processBatch([1], () => { throw new Error('sync'); })).failed[0].error.message); // sync
```

**Complexity.** O(n) time and space; concurrency unbounded (use `mapLimit` from EX-ASYNC-05 when n is large).

**Common mistakes.**
- `Promise.all` use karna: ek failure poore batch ko reject kar deta hai aur baaki results kho jaate hain.
- `items.map(handler)` seedha (bina async wrapper) jab handler sync throw kare to `map` hi throw kar deta hai aur `allSettled` tak pahunchta hi nahi.
- Failure ka original item na rakhna: baad mein retry/report nahi kar sakte.

### EX-ERR-04 - EventEmitter to Promise

**Expected approach.** Teen listeners (`data`, `end`, `error`) ek helper `cleanup()` ke saath. Settle hone par teeno `off` karo, warna long-lived emitter par listeners accumulate hote hain (memory leak).

**What if nobody listens for `error`?** `EventEmitter` ka `'error'` event special hai: agar us par koi listener nahi hai to `emit('error', err)` error ko throw kar deta hai. Async context mein
yeh uncaught exception ban jaata hai aur process crash ho jaata hai. Isliye har emitter/stream par error listener lagana zaroori hai.

**Reference solution.**

```js
// ex-err-04.js
import { EventEmitter } from 'node:events';

export function collect(job) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const onData = (chunk) => chunks.push(chunk);
    const onEnd = () => {
      cleanup();
      resolve(chunks.join(''));
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    function cleanup() {
      job.off('data', onData);
      job.off('end', onEnd);
      job.off('error', onError);
    }
    job.on('data', onData);
    job.on('end', onEnd);
    job.on('error', onError);
  });
}

// demo 1: success
const job = new EventEmitter();
const p = collect(job);
job.emit('data', 'he');
job.emit('data', 'llo');
job.emit('end');
console.log(await p, job.listenerCount('data')); // hello 0

// demo 2: failure
const bad = new EventEmitter();
const p2 = collect(bad);
bad.emit('error', new Error('disk full'));
await p2.catch((e) => console.log('rejected:', e.message));

// demo 3: emit('error') with NO listener throws (and crashes the process if uncaught)
try {
  new EventEmitter().emit('error', new Error('nobody listens'));
} catch (err) {
  console.log('thrown synchronously:', err.message);
}
```

**Complexity.** O(total data size) time and space.

**Common mistakes.**
- `new Promise` ke andar sirf `on('end')` suno aur `error` bhool jao (promise forever pending).
- `on('error')` ke saath `once` mix karna aur listeners cleanup na karna.
- Cleanup ke baad agar emitter phir bhi `error` emit kare (rare), woh unhandled ban jaata hai: long-lived emitter par ek permanent no-op error listener rakho ya `events.once()` use karo.
- Modern alternative: `events.once(emitter, 'end')` ya streams ke liye `stream.pipeline` / `for await (const chunk of stream)`.

### EX-ERR-05 - Retry only retryable errors

**Expected approach.** `classify(err)` error ko teen buckets mein daalta hai. `callApi` loop: fatal ho ya attempts khatam to throw. `retry-after` ke liye server ka bataya hua wait (default 1 s), warna exponential backoff.

**Reference solution.**

```js
// ex-err-05.js
const NETWORK_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN']);
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function classify(err) {
  if (err?.code && NETWORK_CODES.has(err.code)) return 'retry';
  if (err?.status === 429) return 'retry-after';
  if (RETRYABLE_STATUS.has(err?.status)) return 'retry';
  return 'fatal'; // 4xx, validation errors, TypeError, ...
}

export async function callApi(doRequest, { retries = 3, sleep = realSleep } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await doRequest();
    } catch (err) {
      const kind = classify(err);
      if (kind === 'fatal' || attempt >= retries) throw err;
      const delayMs =
        kind === 'retry-after'
          ? (err.retryAfterSeconds ?? 1) * 1000
          : Math.min(5000, 100 * 2 ** attempt); // exponential backoff
      await sleep(delayMs);
    }
  }
}

// demo
const slept = [];
let n = 0;
const flaky = async () => {
  n++;
  if (n === 1) throw { status: 429, retryAfterSeconds: 2 };
  if (n === 2) throw { code: 'ECONNRESET' };
  return 'ok';
};
console.log(await callApi(flaky, { sleep: async (ms) => slept.push(ms) }), slept); // ok [ 2000, 200 ]
let calls = 0;
await callApi(async () => { calls++; throw { status: 404 }; }, { sleep: async () => {} }).catch(() => {});
console.log('404 calls:', calls); // 1
```

**Complexity.** O(1) space; time bounded by `retries` and delays.

**Common mistakes.**
- Sab errors retry (400/401/404 kabhi theek nahi honge, sirf load badhate hain).
- 429 par aggressive retry (server ka `Retry-After` ignore karna).
- Non-idempotent `POST` ko bina idempotency key ke retry karna (double charge): ya to retry mat karo ya key bhejo (EX-IDEM).
- Retry budget na rakhna: har layer retry kare to 3 layers = 27 requests (retry amplification). Ek hi layer par retry karo.

### EX-ERR-06 - `withResource`

**Expected approach.** `acquire` try ke bahar (fail ho to release nahi). `fn` ko try mein; error par `release` karo, aur agar release bhi fail ho to **original error primary** rahe, release error attach karo. Success path par release ka error genuinely propagate hona chahiye.

**Why not plain `finally`.** `finally` ke andar throw karne se original error replace ho jaata hai (debugging nightmare).

**Reference solution.**

```js
// ex-err-06.js
export async function withResource(acquire, release, fn) {
  const resource = await acquire(); // if this throws, nothing to release
  let result;
  try {
    result = await fn(resource);
  } catch (err) {
    try {
      await release(resource);
    } catch (releaseErr) {
      if (err && typeof err === 'object') err.releaseError = releaseErr; // keep the ORIGINAL error primary
    }
    throw err;
  }
  await release(resource); // success path: a failing release is a real error and propagates
  return result;
}

// demo
const log = [];
const acquire = async () => ({ id: 1 });
const release = async (r) => log.push('released ' + r.id);
console.log(await withResource(acquire, release, async (r) => r.id * 10), log); // 10 [ 'released 1' ]
await withResource(acquire, release, async () => { throw new Error('query failed'); }).catch((e) =>
  console.log(e.message, log.length), // query failed 2
);
await withResource(acquire, async () => { throw new Error('release failed'); }, async () => { throw new Error('query failed'); })
  .catch((e) => console.log(e.message, e.releaseError.message)); // query failed release failed
```

**Complexity.** O(1) overhead.

**Common mistakes.**
- `release` ko `try` ke andar last line par rakhna: error par skip ho jaata hai (connection leak, EX-DEBUG-05).
- `finally` mein `return`/`throw` karke original error swallow karna.
- `acquire` ko try ke andar rakhkar `release(undefined)` call karna.
- Modern alternative: `using` declarations (explicit resource management) sirf naye runtimes mein hain (V8 13.4+, yaani Node 24); Node 22 LTS par nahi. Version-dependent hai, isliye pattern samajhna zaroori hai aur use karne se pehle apna Node version check karo.


---

## 5. Express CRUD APIs - solutions

Run any of them with `node ex-exp-0N.js` (listens on port 3000) and try with `curl`. Example:
`curl -i -X POST localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Pay rent\"}"`.

### EX-EXP-01 - Skeleton, health, read endpoints

**Expected approach.** `createApp()` factory (testable), `express.json()` pehle, id ko strictly validate karo (`/^\d+$/`), `404` JSON error shape consistent rakho.
`listen` sirf tab jab file directly run ho.

**Reference solution.**

```js
// ex-exp-01.js
import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());

  const tasks = [
    { id: 1, title: 'Write docs', status: 'todo' },
    { id: 2, title: 'Review PR', status: 'doing' },
  ];

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.get('/tasks', (req, res) => res.json(tasks));

  app.get('/tasks/:id', (req, res) => {
    if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) {
      return res
        .status(400)
        .json({ error: { code: 'BAD_REQUEST', message: 'id must be a positive integer' } });
    }
    const id = Number(req.params.id);
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Task ${id} not found` } });
    }
    res.json(task);
  });

  return app;
}

// start the server only when run directly (so tests can import createApp without opening a port)
if (process.argv[1] === import.meta.filename) {
  createApp().listen(3000, () => console.log('http://localhost:3000'));
}
```

**Complexity.** `find` O(n) here; a Map or DB primary key lookup is O(1).

**Common mistakes.**
- `app.listen` module level par: tests mein import karte hi port busy.
- `Number(req.params.id)` par bharosa (`'1e2'`, `' 5'`, `''` ka behaviour surprising).
- 404 ke liye HTML default response chhod dena: API clients ko JSON chahiye.
- Express 5 note: path syntax `app.get('/tasks/:id')` same; wildcard syntax change hua (`/*splat`), `req.query` getter hai.

### EX-EXP-02 - Full CRUD with correct status codes

**Expected approach.** `POST` -> 201 + `Location`; `PUT` full replace (required fields dono); `PATCH` merge (at least one field); `DELETE` -> 204 no body. Validation ek function mein (mode: create/replace/patch) taaki
handlers patle rahein. Counter se id (delete ke baad id reuse nahi).

**Reference solution.**

```js
// ex-exp-02.js
import express from 'express';

const STATUSES = ['todo', 'doing', 'done'];

// mode: 'create' | 'replace' | 'patch'
function parseTask(body, mode) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { details: [{ field: 'body', message: 'must be a JSON object' }] };
  }
  const details = [];
  const value = {};

  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 1 || title.length > 100) details.push({ field: 'title', message: 'must be 1..100 chars' });
    else value.title = title;
  } else if (mode !== 'patch') {
    details.push({ field: 'title', message: 'is required' });
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      details.push({ field: 'status', message: `must be one of: ${STATUSES.join(', ')}` });
    } else {
      value.status = body.status;
    }
  } else if (mode === 'replace') {
    details.push({ field: 'status', message: 'is required' });
  }

  if (mode === 'patch' && details.length === 0 && Object.keys(value).length === 0) {
    details.push({ field: 'body', message: 'at least one of title, status is required' });
  }
  return { value, details };
}

const sendError = (res, status, code, message, details) =>
  res.status(status).json({ error: { code, message, ...(details && { details }) } });

export function createApp() {
  const app = express();
  app.use(express.json());

  const tasks = new Map();
  let nextId = 1; // a counter: ids are never reused after a delete

  const loadTask = (req, res) => {
    if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) {
      sendError(res, 400, 'BAD_REQUEST', 'id must be a positive integer');
      return null;
    }
    const id = Number(req.params.id);
    const task = tasks.get(id);
    if (!task) {
      sendError(res, 404, 'NOT_FOUND', `Task ${id} not found`);
      return null;
    }
    return task;
  };

  app.get('/tasks', (req, res) => res.json([...tasks.values()]));

  app.get('/tasks/:id', (req, res) => {
    const task = loadTask(req, res);
    if (task) res.json(task);
  });

  app.post('/tasks', (req, res) => {
    const { value, details } = parseTask(req.body, 'create');
    if (details.length > 0) return sendError(res, 422, 'VALIDATION_FAILED', 'Invalid body', details);
    const task = { id: nextId++, title: value.title, status: value.status ?? 'todo' };
    tasks.set(task.id, task);
    res.status(201).location(`/tasks/${task.id}`).json(task);
  });

  app.put('/tasks/:id', (req, res) => {
    const task = loadTask(req, res);
    if (!task) return;
    const { value, details } = parseTask(req.body, 'replace');
    if (details.length > 0) return sendError(res, 422, 'VALIDATION_FAILED', 'Invalid body', details);
    const replaced = { id: task.id, title: value.title, status: value.status }; // full replace
    tasks.set(task.id, replaced);
    res.json(replaced);
  });

  app.patch('/tasks/:id', (req, res) => {
    const task = loadTask(req, res);
    if (!task) return;
    const { value, details } = parseTask(req.body, 'patch');
    if (details.length > 0) return sendError(res, 422, 'VALIDATION_FAILED', 'Invalid body', details);
    const merged = { ...task, ...value }; // partial: merge
    tasks.set(task.id, merged);
    res.json(merged);
  });

  app.delete('/tasks/:id', (req, res) => {
    const task = loadTask(req, res);
    if (!task) return;
    tasks.delete(task.id);
    res.status(204).end();
  });

  return app;
}

if (process.argv[1] === import.meta.filename) {
  createApp().listen(3000, () => console.log('http://localhost:3000'));
}
```

**Complexity.** All operations O(1) (Map), list O(n).

**Common mistakes.**
- 200 for create (REST convention 201), body ke saath 204, ya 404 ki jagah 200 with `null`.
- `PUT` ko `PATCH` ki tarah chalana (missing field ko purana value rakhna): PUT replace hai.
- `length + 1` se id: delete ke baad duplicate ids.
- Body ko directly store karna (`tasks.set(id, req.body)`): mass assignment; client `id` ya `isAdmin` inject kar dega.
- Validation errors ko 400 vs 422: dono acceptable hain; consistent raho aur document karo (hum 422 use kar rahe hain; malformed JSON 400).

### EX-EXP-03 - Filter, search, sort, paginate

**Expected approach.** `parseListQuery` (validation, allow-list) aur `applyListQuery` (pure function) alag rakho: testable. Pipeline: filter -> sort -> count -> slice. `total` slice se pehle.
Sort fields allow-list: yeh wahi discipline hai jo SQL `ORDER BY` injection rokti hai.

**Reference solution.**

```js
// ex-exp-03.js
import express from 'express';

const STATUSES = ['todo', 'doing', 'done'];
const SORT_FIELDS = new Set(['createdAt', 'title', 'id']); // allow-list: never pass raw input to sorting/SQL

class BadRequest extends Error {
  status = 400;
}

export function parseListQuery(query) {
  const single = (name) => {
    const v = query[name];
    if (v === undefined) return undefined;
    if (typeof v !== 'string') throw new BadRequest(`${name} must be a single value`);
    return v;
  };
  const intParam = (name, def, max) => {
    const raw = single(name);
    if (raw === undefined) return def;
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > max) {
      throw new BadRequest(`${name} must be an integer between 1 and ${max}`);
    }
    return Number(raw);
  };

  const status = single('status');
  if (status !== undefined && !STATUSES.includes(status)) {
    throw new BadRequest(`status must be one of: ${STATUSES.join(', ')}`);
  }
  const q = single('q')?.trim().toLowerCase();
  const sort = (single('sort') ?? 'id').split(',').map((part) => {
    const desc = part.startsWith('-');
    const field = desc ? part.slice(1) : part;
    if (!SORT_FIELDS.has(field)) throw new BadRequest(`Cannot sort by "${field}"`);
    return { field, desc };
  });
  return { status, q, sort, page: intParam('page', 1, 1_000_000), limit: intParam('limit', 10, 100) };
}

export function applyListQuery(tasks, { status, q, sort, page, limit }) {
  const filtered = tasks.filter(
    (t) => (!status || t.status === status) && (!q || t.title.toLowerCase().includes(q)),
  );
  const sorted = filtered.slice().sort((a, b) => {
    for (const { field, desc } of sort) {
      const cmp = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      if (cmp !== 0) return desc ? -cmp : cmp;
    }
    return 0;
  });
  const total = sorted.length; // after filter, before slice
  const data = sorted.slice((page - 1) * limit, page * limit);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export function createApp() {
  const app = express();
  const tasks = [
    { id: 1, title: 'Write docs', status: 'todo', createdAt: '2024-05-01' },
    { id: 2, title: 'Review PR', status: 'doing', createdAt: '2024-05-02' },
    { id: 3, title: 'Fix login bug', status: 'done', createdAt: '2024-05-03' },
    { id: 4, title: 'Update docs site', status: 'todo', createdAt: '2024-05-04' },
    { id: 5, title: 'Deploy staging', status: 'doing', createdAt: '2024-05-05' },
    { id: 6, title: 'Write tests', status: 'todo', createdAt: '2024-05-06' },
    { id: 7, title: 'Docs: API guide', status: 'done', createdAt: '2024-05-07' },
  ];

  app.get('/tasks', (req, res) => {
    res.json(applyListQuery(tasks, parseListQuery(req.query))); // throws BadRequest -> error middleware
  });

  app.use((err, req, res, next) => {
    if (err instanceof BadRequest) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: err.message } });
    }
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  });
  return app;
}

if (process.argv[1] === import.meta.filename) {
  createApp().listen(3000, () => console.log('http://localhost:3000'));
}
```

**Complexity.** Filter O(n), sort O(m log m) (m matches), slice O(limit). Database mein yeh index se hota hai (week 4 / day 6).

**Common mistakes.**
- Raw `req.query.sort` ko `a[sortField]` mein use karna (unexpected property access) ya SQL string mein concatenate karna.
- `limit` unbounded: `limit=1000000` poora table dump.
- Sort ko in-place karna (`tasks.sort`) jo shared state mutate karta hai: `slice()` copy karo.
- `total` ko slice ke baad nikaalna: client ko page count galat dikhta hai.
- OFFSET pagination deep pages par slow hai aur concurrent inserts mein items skip/duplicate karta hai: cursor pagination (EX-EXP-06) behtar.

### EX-EXP-04 - Layered architecture and centralized errors

**Expected approach.** Chaar layers: repository (storage), service (rules, throws domain errors), controller (HTTP translation), routes (wiring). `createApp({ taskService })` dependency injection.
Ek hi `errorHandler` + `notFound` (EX-MW-05). Express 5 mein async errors automatically error middleware tak pahunchte hain, isliye controllers mein `try/catch` ki zaroorat nahi.

**Reference solution** (needs `ex-err-02.js` and `ex-mw-05.js` in the same folder).

```js
// ex-exp-04.js  (uses ex-err-02.js and ex-mw-05.js from this folder)
import express from 'express';
import { AppError, NotFoundError, ValidationError } from './ex-err-02.js';
import { errorHandler, notFound } from './ex-mw-05.js';

const STATUSES = ['todo', 'doing', 'done'];

// ---- validation (business rules live here, not in the controller) ----
// mode: 'create' | 'replace' | 'patch'
export function validateTaskInput(body, mode) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid body', [{ field: 'body', message: 'must be a JSON object' }]);
  }
  const details = [];
  const value = {};
  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 1 || title.length > 100) details.push({ field: 'title', message: 'must be 1..100 chars' });
    else value.title = title;
  } else if (mode !== 'patch') {
    details.push({ field: 'title', message: 'is required' });
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) details.push({ field: 'status', message: `must be one of: ${STATUSES.join(', ')}` });
    else value.status = body.status;
  } else if (mode === 'replace') {
    details.push({ field: 'status', message: 'is required' });
  }
  if (mode === 'patch' && details.length === 0 && Object.keys(value).length === 0) {
    details.push({ field: 'body', message: 'at least one of title, status is required' });
  }
  if (details.length > 0) throw new ValidationError('Invalid body', details);
  return mode === 'create' ? { title: value.title, status: value.status ?? 'todo' } : value;
}

export function parseId(raw) {
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new AppError('id must be a positive integer', { status: 400, code: 'BAD_REQUEST' });
  }
  return Number(raw);
}

// ---- repository: storage only ----
export function createTaskRepository() {
  const rows = new Map();
  let nextId = 1;
  return {
    findAll: () => [...rows.values()],
    findById: (id) => rows.get(id) ?? null,
    insert(data) {
      const row = { id: nextId++, ...data };
      rows.set(row.id, row);
      return row;
    },
    update(id, data) {
      const row = rows.get(id);
      if (!row) return null;
      const next = { ...row, ...data, id };
      rows.set(id, next);
      return next;
    },
    remove: (id) => rows.delete(id),
  };
}

// ---- service: business rules ----
export function createTaskService(repo) {
  const must = (id) => {
    const task = repo.findById(id);
    if (!task) throw new NotFoundError(`Task ${id} not found`);
    return task;
  };
  return {
    list: () => repo.findAll(),
    get: (id) => must(id),
    create: (body) => repo.insert(validateTaskInput(body, 'create')),
    replace(id, body) {
      must(id);
      return repo.update(id, validateTaskInput(body, 'replace'));
    },
    update(id, body) {
      must(id);
      return repo.update(id, validateTaskInput(body, 'patch'));
    },
    remove(id) {
      must(id);
      repo.remove(id);
    },
  };
}

// ---- controller: HTTP <-> service only ----
export function createTaskController(service) {
  return {
    list: (req, res) => res.json(service.list()),
    get: (req, res) => res.json(service.get(parseId(req.params.id))),
    create(req, res) {
      const task = service.create(req.body);
      res.status(201).location(`/tasks/${task.id}`).json(task);
    },
    replace: (req, res) => res.json(service.replace(parseId(req.params.id), req.body)),
    update: (req, res) => res.json(service.update(parseId(req.params.id), req.body)),
    remove(req, res) {
      service.remove(parseId(req.params.id));
      res.status(204).end();
    },
  };
}

// ---- routes ----
export function createTaskRouter(controller) {
  const router = express.Router();
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.put('/:id', controller.replace);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

// ---- app factory with dependency injection ----
export function createApp({ taskService = createTaskService(createTaskRepository()), logger = console } = {}) {
  const app = express();
  app.use(express.json());
  app.use('/tasks', createTaskRouter(createTaskController(taskService)));
  app.use(notFound);
  app.use(errorHandler({ logger }));
  return app;
}

if (process.argv[1] === import.meta.filename) {
  createApp().listen(3000, () => console.log('http://localhost:3000'));
}
```

**Complexity.** Same as EX-EXP-02.

**Common mistakes.**
- Business rules controller mein daalna: dusra transport (CLI, queue worker) same rules reuse nahi kar sakta.
- Har route mein alag error format.
- Service ko `req`/`res` pass karna (HTTP concepts service mein leak).
- Error middleware ko routes se pehle mount karna (woh kabhi call nahi hota).
- Express 4: async handlers ke liye wrapper chahiye; warna rejected promise request ko hang kar deti hai.

### EX-EXP-05 - Nested resources

**Expected approach.** `Router({ mergeParams: true })` taaki nested router `:projectId` dekh sake. `loadProject` middleware parent ko pehle resolve karta hai (unknown -> 404). `loadTask` check karta hai ki task isi project ka hai: warna 404 (IDOR/enumeration
se bachav). Project delete par cascade.

**Reference solution** (needs `ex-err-02.js`, `ex-mw-05.js`, `ex-exp-04.js`).

```js
// ex-exp-05.js  (uses ex-err-02.js, ex-mw-05.js, ex-exp-04.js from this folder)
import express from 'express';
import { NotFoundError, ValidationError } from './ex-err-02.js';
import { errorHandler, notFound } from './ex-mw-05.js';
import { parseId, validateTaskInput } from './ex-exp-04.js';

export function createApp({ logger = console } = {}) {
  const app = express();
  app.use(express.json());

  const projects = new Map();
  const tasks = new Map();
  let nextProjectId = 1;
  let nextTaskId = 1;

  // resolves the parent first: unknown project -> 404 before any task logic runs
  const loadProject = (req, res, next) => {
    const id = parseId(req.params.projectId);
    const project = projects.get(id);
    if (!project) throw new NotFoundError(`Project ${id} not found`);
    req.project = project;
    next();
  };
  // a task must belong to THIS project, otherwise it does not exist for this URL (prevents IDOR)
  const loadTask = (req, res, next) => {
    const id = parseId(req.params.taskId);
    const task = tasks.get(id);
    if (!task || task.projectId !== req.project.id) throw new NotFoundError(`Task ${id} not found`);
    req.task = task;
    next();
  };

  const projectsRouter = express.Router();
  projectsRouter.post('/', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 1 || name.length > 100) {
      throw new ValidationError('Invalid body', [{ field: 'name', message: 'must be 1..100 chars' }]);
    }
    const project = { id: nextProjectId++, name };
    projects.set(project.id, project);
    res.status(201).location(`/projects/${project.id}`).json(project);
  });
  projectsRouter.get('/:projectId', loadProject, (req, res) => res.json(req.project));
  projectsRouter.delete('/:projectId', loadProject, (req, res) => {
    for (const [id, task] of tasks) if (task.projectId === req.project.id) tasks.delete(id); // cascade
    projects.delete(req.project.id);
    res.status(204).end();
  });

  const tasksRouter = express.Router({ mergeParams: true }); // so :projectId is visible here
  tasksRouter.use(loadProject);
  tasksRouter.get('/', (req, res) => {
    res.json([...tasks.values()].filter((t) => t.projectId === req.project.id));
  });
  tasksRouter.post('/', (req, res) => {
    const data = validateTaskInput(req.body, 'create');
    const task = { id: nextTaskId++, projectId: req.project.id, ...data };
    tasks.set(task.id, task);
    res.status(201).location(`/projects/${task.projectId}/tasks/${task.id}`).json(task);
  });
  tasksRouter.get('/:taskId', loadTask, (req, res) => res.json(req.task));
  tasksRouter.patch('/:taskId', loadTask, (req, res) => {
    const updated = { ...req.task, ...validateTaskInput(req.body, 'patch') };
    tasks.set(updated.id, updated);
    res.json(updated);
  });
  tasksRouter.delete('/:taskId', loadTask, (req, res) => {
    tasks.delete(req.task.id);
    res.status(204).end();
  });

  projectsRouter.use('/:projectId/tasks', tasksRouter);
  app.use('/projects', projectsRouter);
  app.use(notFound);
  app.use(errorHandler({ logger }));
  return app;
}

if (process.argv[1] === import.meta.filename) {
  createApp().listen(3000, () => console.log('http://localhost:3000'));
}
```

**Complexity.** Task lookup O(1); project task list O(T) (T = total tasks). With a DB, an index on `tasks(project_id)` makes it O(log n + k).

**Common mistakes.**
- Task ko sirf `taskId` se fetch karna aur `projectId` ignore karna: user URL badal kar doosre project ka task dekh sakta hai.
- `mergeParams` bhoolna: `req.params.projectId` nested router mein `undefined`.
- Cascade bhoolna: orphan tasks reh jaate hain (DB mein `ON DELETE CASCADE` foreign key).
- Project check ke bina task create karna.

### EX-EXP-06 - Versioning, conflicts, conditional updates

**Expected approach.** Ek service, do HTTP shapes. v1 offset (`data`, `meta`), v2 cursor (`items`, `nextCursor`): `limit + 1` rows fetch karo, extra row ka hona = aur data hai. Duplicate title -> 409 `ConflictError`.
Optimistic concurrency: har task par `version`; `PATCH` ko `If-Match` chahiye (428 agar missing, 412 agar mismatch); success par `version++` aur `ETag`.

**Reference solution** (needs `ex-err-02.js`, `ex-mw-05.js`, `ex-exp-04.js`).

```js
// ex-exp-06.js  (uses ex-err-02.js, ex-mw-05.js, ex-exp-04.js from this folder)
import express from 'express';
import { AppError, ConflictError, NotFoundError } from './ex-err-02.js';
import { errorHandler, notFound } from './ex-mw-05.js';
import { parseId, validateTaskInput } from './ex-exp-04.js';

// One service shared by both API versions: versions differ only in the HTTP shape.
export function createTaskService() {
  const tasks = [];
  let nextId = 1;
  const must = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundError(`Task ${id} not found`);
    return task;
  };
  return {
    create(body) {
      const data = validateTaskInput(body, 'create');
      if (tasks.some((t) => t.title.toLowerCase() === data.title.toLowerCase())) {
        throw new ConflictError(`Task "${data.title}" already exists`);
      }
      const task = { id: nextId++, ...data, version: 1 };
      tasks.push(task);
      return task;
    },
    get: (id) => must(id),
    update(id, body, expectedVersion) {
      const task = must(id);
      const data = validateTaskInput(body, 'patch');
      if (task.version !== expectedVersion) {
        throw new AppError(`Task has version ${task.version}`, { status: 412, code: 'PRECONDITION_FAILED' });
      }
      Object.assign(task, data);
      task.version += 1;
      return task;
    },
    page({ page, limit }) {
      return {
        data: tasks.slice((page - 1) * limit, page * limit),
        meta: { page, limit, total: tasks.length, totalPages: Math.ceil(tasks.length / limit) },
      };
    },
    after({ after, limit }) {
      const rows = tasks.filter((t) => t.id > after).slice(0, limit + 1); // fetch one extra
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
    },
  };
}

const intQuery = (raw, def, max) => {
  if (raw === undefined) return def;
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) > max) {
    throw new AppError(`Invalid number "${raw}"`, { status: 400, code: 'BAD_REQUEST' });
  }
  return Number(raw);
};

function parseIfMatch(req) {
  const header = req.get('if-match');
  if (header === undefined) {
    throw new AppError('If-Match header is required', { status: 428, code: 'PRECONDITION_REQUIRED' });
  }
  const raw = header.replace(/"/g, '');
  if (!/^\d+$/.test(raw)) throw new AppError('Invalid If-Match', { status: 400, code: 'BAD_REQUEST' });
  return Number(raw);
}

// version = how the list is shaped; everything else is identical
function tasksRouter(service, version) {
  const router = express.Router();
  router.get('/', (req, res) => {
    const limit = intQuery(req.query.limit, 10, 100);
    if (version === 'v2') {
      return res.json(service.after({ after: intQuery(req.query.after, 0, Number.MAX_SAFE_INTEGER), limit }));
    }
    res.json(service.page({ page: intQuery(req.query.page, 1, 1_000_000), limit }));
  });
  router.post('/', (req, res) => {
    const task = service.create(req.body);
    res.status(201).set('ETag', `"${task.version}"`).location(`/${version}/tasks/${task.id}`).json(task);
  });
  router.get('/:id', (req, res) => {
    const task = service.get(parseId(req.params.id));
    res.set('ETag', `"${task.version}"`).json(task);
  });
  router.patch('/:id', (req, res) => {
    const task = service.update(parseId(req.params.id), req.body, parseIfMatch(req));
    res.set('ETag', `"${task.version}"`).json(task);
  });
  return router;
}

export function createApp({ logger = console } = {}) {
  const app = express();
  app.use(express.json());
  const service = createTaskService();
  app.use('/v1/tasks', tasksRouter(service, 'v1'));
  app.use('/v2/tasks', tasksRouter(service, 'v2'));
  app.use(notFound);
  app.use(errorHandler({ logger }));
  return app;
}

if (process.argv[1] === import.meta.filename) {
  createApp().listen(3000, () => console.log('http://localhost:3000'));
}
```

**Complexity.** Cursor page O(n) here (linear filter); with a DB and an index on `id` it is O(log n + limit) at any depth, unlike OFFSET which scans skipped rows.

**Common mistakes.**
- Version breaking change ko same URL par ship karna: purane clients toot jaate hain.
- Cursor ke liye non-unique sort key (`createdAt`) use karna: ties mein rows skip hoti hain; unique tie-breaker (`id`) jodo.
- 412 vs 409: 412 = precondition header fail; 409 = resource state conflict. Dono distinct hain.
- Version check aur update alag steps mein (race): DB mein `UPDATE ... WHERE id = ? AND version = ?` ek atomic statement chahiye (EX-TXN-05).
- ETag ko quotes ke bina bhejna (spec quoted string maangta hai).

---

## 6. Request validation and middleware - solutions

### EX-MW-01 - Request-id and access-log middleware

**Expected approach.** Valid incoming id (regex) accept, warna `randomUUID()`. `req.id` aur response header set. `hrtime.bigint()` start par, `finish` (aur `close`) par duration. Log mein sirf safe fields.

**Reference solution.**

```js
// ex-mw-01.js
import { randomUUID } from 'node:crypto';

const VALID_ID = /^[A-Za-z0-9._-]{8,64}$/;

export function requestLogger({ write = console.log } = {}) {
  return (req, res, next) => {
    const incoming = req.get('x-request-id');
    // never trust a client value blindly: it ends up in logs and response headers
    req.id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('x-request-id', req.id);

    const start = process.hrtime.bigint(); // monotonic: not affected by system clock changes
    let logged = false;
    const log = () => {
      if (logged) return;
      logged = true;
      const durationMs = Math.round(Number(process.hrtime.bigint() - start) / 1e4) / 100;
      write(
        JSON.stringify({
          id: req.id,
          method: req.method,
          path: req.originalUrl.split('?')[0], // no query string: it may contain tokens
          status: res.statusCode,
          durationMs,
          ip: req.ip,
        }),
      );
    };
    res.on('finish', log); // normal completion
    res.on('close', log); // client aborted before finish (no-op if already logged)
    next();
  };
}
```

**Complexity.** O(1) per request.

**Common mistakes.**
- Client ka `x-request-id` bina validation ke log mein daalna (log injection, bohot lamba value).
- `Date.now()` se duration (clock adjustments se negative/wrong): monotonic clock.
- Sirf `finish` sunna: client disconnect hone par `close` aata hai, `finish` nahi.
- Query string ya `Authorization` header log karna: tokens leak.
- Request id ko downstream calls (DB logs, other services) mein propagate na karna: correlation ID ka point hi yahi hai (week 6 / day 2).

### EX-MW-02 - Validation middleware factory

**Expected approach.** `checkSection(schema, input, where, { strict, coerce })` har section ke liye: type check/coerce, enum, min/max, default, required. Saare errors collect, `422` with `details`.
Valid, cleaned values `req.valid` mein. Body strict (unknown keys rejected); query/params strings aate hain isliye coerce.

**Reference solution.**

```js
// ex-mw-02.js
const ok = (value) => ({ ok: true, value });
const bad = (message) => ({ ok: false, message });

const TYPES = {
  string: (v) => (typeof v === 'string' ? ok(v) : bad('must be a string')),
  integer: (v, coerce) => {
    const n = coerce && typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    return Number.isInteger(n) ? ok(n) : bad('must be an integer');
  },
  number: (v, coerce) => {
    const n = coerce && typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    return typeof n === 'number' && Number.isFinite(n) ? ok(n) : bad('must be a number');
  },
  boolean: (v, coerce) => {
    if (v === true || v === false) return ok(v);
    if (coerce && v === 'true') return ok(true);
    if (coerce && v === 'false') return ok(false);
    return bad('must be a boolean');
  },
};

function checkSection(schema, input, where, { strict, coerce }) {
  const details = [];
  const value = {};
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { value, details: [{ in: where, field: '(root)', message: 'must be an object' }] };
  }
  const fail = (field, message) => details.push({ in: where, field, message });

  for (const [field, rule] of Object.entries(schema)) {
    const raw = input[field];
    if (raw === undefined || raw === null) {
      if (rule.default !== undefined) value[field] = rule.default;
      else if (rule.required) fail(field, 'is required');
      continue;
    }
    const typed = TYPES[rule.type](raw, coerce);
    if (!typed.ok) {
      fail(field, typed.message);
      continue;
    }
    const v = typed.value;
    if (rule.enum && !rule.enum.includes(v)) {
      fail(field, `must be one of: ${rule.enum.join(', ')}`);
      continue;
    }
    const size = rule.type === 'string' ? v.length : v; // string: length, number: value
    const unit = rule.type === 'string' ? ' characters' : '';
    if (rule.min !== undefined && size < rule.min) fail(field, `must be at least ${rule.min}${unit}`);
    else if (rule.max !== undefined && size > rule.max) fail(field, `must be at most ${rule.max}${unit}`);
    else value[field] = v;
  }

  if (strict) {
    for (const key of Object.keys(input)) {
      if (!Object.hasOwn(schema, key)) fail(key, 'is not allowed');
    }
  }
  return { value, details };
}

export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    const details = [];
    const valid = {};
    const sections = [
      ['body', body, req.body ?? {}, { strict: true, coerce: false }],
      ['query', query, req.query, { strict: false, coerce: true }],
      ['params', params, req.params, { strict: false, coerce: true }],
    ];
    for (const [where, schema, input, options] of sections) {
      if (!schema) continue;
      const result = checkSection(schema, input, where, options);
      details.push(...result.details);
      valid[where] = result.value;
    }
    if (details.length > 0) {
      return res
        .status(422)
        .json({ error: { code: 'VALIDATION_FAILED', message: 'Invalid request', details } });
    }
    req.valid = valid; // do not write back to req.query (read-only getter in Express 5)
    next();
  };
}
```

**Complexity.** O(number of fields).

**Common mistakes.**
- Pehli error par return karna: client ko ek-ek karke errors fix karne padte hain.
- `Number('')` = 0 aur `Number('abc')` = NaN: coercion se pehle empty string aur NaN check.
- Express 5 mein `req.query = ...` assign karna (read-only getter): `req.valid` use karo.
- Body mein `'3'` ko integer maan lena (JSON types strict rakho; coercion sirf query/params ke liye).
- Validation ke baad bhi `req.body` use karna (unvalidated). Handler ko `req.valid.body` do.
- Production mein hand-rolled validator ki jagah Zod/Joi/Ajv use karo; yeh exercise concept ke liye hai.

### EX-MW-03 - API key authentication

**Expected approach.** Raw key store nahi hoti, sirf `sha256` hash. Request ki key ko hash karo aur store ke har entry se `timingSafeEqual` (length check ke baad) compare karo, bina early exit ke. 401 `WWW-Authenticate: Bearer` ke saath,
403 missing scope par.

**Reference solution.**

```js
// ex-mw-03.js
import { createHash, timingSafeEqual } from 'node:crypto';

export const hashKey = (key) => createHash('sha256').update(key).digest('hex');

const unauthenticated = (res, message) => {
  res.set('WWW-Authenticate', 'Bearer');
  return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message } });
};

export function apiKeyAuth(keyStore) {
  return (req, res, next) => {
    const header = req.get('authorization');
    if (!header) return unauthenticated(res, 'Missing bearer token');
    const match = /^Bearer ([\x21-\x7e]+)$/.exec(header);
    if (!match) return unauthenticated(res, 'Malformed Authorization header');

    const presented = Buffer.from(hashKey(match[1]), 'hex');
    let client = null;
    for (const [storedHex, info] of keyStore) {
      const stored = Buffer.from(storedHex, 'hex');
      // compare against every entry without early exit; timingSafeEqual needs equal lengths
      if (stored.length === presented.length && timingSafeEqual(stored, presented)) client = info;
    }
    if (!client) return unauthenticated(res, 'Invalid credentials');
    req.client = client;
    next();
  };
}

export function requireScope(scope) {
  return (req, res, next) => {
    if (!req.client) return unauthenticated(res, 'Missing bearer token');
    if (!req.client.scopes.includes(scope)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Missing scope ${scope}` } });
    }
    next();
  };
}
```

**Complexity.** O(k) per request (k keys). Production mein hash ko Map key bana ke O(1) lookup (hash par attacker ka control nahi hota, isliye timing leak nahi); yahan constant-time practise dikhayi hai.

**Common mistakes.**
- `===` se secret compare: early-exit timing attack.
- `timingSafeEqual` ko different length buffers dena: yeh throw karta hai; pehle length check.
- Raw API keys DB mein plaintext (leak = full compromise). High-entropy random keys ke liye fast hash (sha256) theek hai; passwords ke liye nahi (bcrypt/argon2).
- 401 aur 403 mix karna: authentication fail = 401, permission fail = 403.
- Key ko query string mein lena (URLs logs/proxies mein jaati hain).

### EX-MW-04 - Body sanitization

**Expected approach.** Allow-list se naya object banao (mass assignment rokta hai), recursively strings trim karo, dangerous keys (`__proto__`, `constructor`, `prototype`, `$`-prefixed, dotted) drop. Depth limit aur non-object body reject.

**Reference solution.**

```js
// ex-mw-04.js
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

class DepthError extends Error {}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function clean(value, depth, maxDepth) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    if (depth + 1 > maxDepth) throw new DepthError('Body is nested too deeply');
    return value.map((v) => clean(v, depth + 1, maxDepth));
  }
  if (isPlainObject(value)) {
    if (depth + 1 > maxDepth) throw new DepthError('Body is nested too deeply');
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key) || key.startsWith('$') || key.includes('.')) continue;
      out[key] = clean(v, depth + 1, maxDepth);
    }
    return out;
  }
  return value; // numbers, booleans, null
}

export function sanitizeBody({ allow, maxDepth = 3 }) {
  return (req, res, next) => {
    const body = req.body;
    if (!isPlainObject(body)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Body must be a JSON object' } });
    }
    try {
      const picked = {};
      for (const key of allow) {
        if (Object.hasOwn(body, key)) picked[key] = clean(body[key], 1, maxDepth);
      }
      req.body = picked; // anything not in the allow-list (e.g. isAdmin) is dropped
      next();
    } catch (err) {
      if (err instanceof DepthError) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: err.message } });
      }
      next(err);
    }
  };
}
```

**Complexity.** O(size of body).

**Common mistakes.**
- Deny-list se kaam chalana (`delete body.isAdmin`): naye field aate hi hole. Allow-list use karo.
- Sirf top-level keys clean karna: `{ profile: { $gt: '' } }` nested operator injection (MongoDB) nikal jaata hai.
- `Object.assign(target, JSON.parse(userInput))` / deep merge: prototype pollution.
- Sanitization ko validation samajhna: sanitize shape saaf karta hai, validate rules enforce karta hai. Dono chahiye.
- HTML escaping yahan nahi karte: output encoding output context par hoti hai (XSS, week 5 / day 5).

### EX-MW-05 - Error-handling and not-found middleware

**Expected approach.** Ek central `errorHandler(err, req, res, next)` (4 params). `AppError` -> uska status/JSON; body-parser errors map; baaki sab `500` generic. Full error `req.id` ke saath **sirf logs** mein. `headersSent` ho to Express ko delegate.
`notFound` ek normal (3-param) middleware hai jo sabse last route ke baad mount hota hai.

**Reference solution.**

```js
// ex-mw-05.js
import { AppError } from './ex-err-02.js';

export function notFound(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl.split('?')[0]} not found` },
  });
}

export function errorHandler({ logger = console } = {}) {
  // 4 parameters: this is how Express recognises an error-handling middleware
  return (err, req, res, next) => {
    if (res.headersSent) return next(err); // too late to send JSON; let Express close the connection

    let status = 500;
    let body = { error: { code: 'INTERNAL', message: 'Internal server error' } };

    if (err instanceof AppError) {
      status = err.status;
      body = err.toJSON();
    } else if (err?.type === 'entity.parse.failed') {
      status = 400;
      body = { error: { code: 'BAD_REQUEST', message: 'Malformed JSON' } };
    } else if (err?.type === 'entity.too.large') {
      status = 413;
      body = { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } };
    }

    const level = status >= 500 ? 'error' : 'warn';
    logger[level]({ reqId: req.id, status, err }, 'request failed'); // full detail stays in OUR logs
    res.status(status).json(body);
  };
}

// Express 4 note: async handlers needed a wrapper because rejected promises were NOT forwarded:
//   const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Express 5 forwards rejected promises and sync throws to the error middleware by itself.
```

**Complexity.** O(1).

**Common mistakes.**
- `err.message` / stack client ko bhejna (internal paths, SQL, secrets leak).
- 3-parameter function ko error handler samajhna: Express arity se pehchanta hai.
- Error handler ko routes se pehle mount karna.
- `headersSent` check bhoolna: "Cannot set headers after they are sent" ka second error.
- Sab errors ko 500 banana (validation aur not-found 4xx hote hain; 4xx ko `error` level par log karne se alert noise).
- Process-level `uncaughtException` handler ko error middleware ka replacement samajhna.

### EX-MW-06 - Mini middleware runner (`compose`)

**Expected approach.** `run(i, err)` recursion: current mode ke hisaab se handlers skip karo (error mode = arity 4, normal mode = arity != 4). `next` closure har middleware ko milta hai. Sync throw `catch` se, rejected promise `.then(undefined, next)` se
`next(err)` ban jata hai. `nextCalled` flag double-call detect karta hai.

**Reference solution.**

```js
// ex-mw-06.js
export function compose(stack) {
  return function handle(req, res, done) {
    function run(i, err) {
      const hasError = err !== undefined && err !== null;
      // skip handlers that do not match the current mode: error mode wants arity 4, normal mode does not
      while (i < stack.length && hasError !== (stack[i].length === 4)) i++;
      if (i >= stack.length) return done(err ?? undefined);

      const fn = stack[i];
      let nextCalled = false;
      const next = (e) => {
        if (nextCalled) return done(new Error('next() called multiple times'));
        nextCalled = true;
        run(i + 1, e);
      };
      try {
        const result = hasError ? fn(err, req, res, next) : fn(req, res, next);
        if (result && typeof result.then === 'function') {
          result.then(undefined, (e) => next(e ?? new Error('Rejected with no reason')));
        }
      } catch (e) {
        next(e);
      }
    }
    run(0, undefined);
  };
}

// demo
const log = [];
const h = compose([
  (req, res, next) => { log.push('a'); next(); },
  (req, res, next) => { log.push('b'); next(new Error('x')); },
  (req, res, next) => { log.push('skipped'); next(); },
  (err, req, res, next) => { log.push('err:' + err.message); next(); },
]);
h({}, {}, (e) => log.push('done:' + e));
console.log(log); // [ 'a', 'b', 'err:x', 'done:undefined' ]

const log2 = [];
compose([
  async () => { throw new Error('async boom'); },
  (err, req, res, next) => { log2.push('handled ' + err.message); next(); },
])({}, {}, () => console.log(log2)); // [ 'handled async boom' ]
```

**Complexity.** O(m) for m middleware per request; recursion depth up to m for sync chains.

**Common mistakes.**
- Error middleware ko normal flow mein chalana (ya normal middleware ko error flow mein).
- Async middleware ki rejection ko ignore karna (Express 4 ka asli bug; Express 5 isse fix karta hai).
- `next()` ko do baar call karna (e.g. response bhej ke bhi `next()`): downstream handlers do baar chalte hain.
- Mutating the `stack` array while running.

---

## 7. SQL joins and aggregation - solutions

Sab queries MySQL 8 valid hain. Neeche **expected result sets** dikhaye gaye hain (data upar Part I mein diya gaya hai). Order `ORDER BY` se fix hai.

### EX-SQL-01 - INNER JOIN

**Expected approach.** `orders` ko `customers` se `customer_id = id` par join, `WHERE status = 'PAID'`. INNER JOIN sirf matching rows deta hai.

```sql
SELECT o.id AS order_id, c.name AS customer_name, o.status, o.created_at
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'PAID'
ORDER BY o.id;
```

**Expected result.**

| order_id | customer_name | status | created_at |
|----------|---------------|--------|------------|
| 101 | Asha | PAID | 2024-04-01 |
| 102 | Asha | PAID | 2024-04-10 |
| 103 | Ravi | PAID | 2024-04-12 |
| 105 | Ravi | PAID | 2024-05-02 |
| 106 | Meera | PAID | 2024-05-03 |

**Complexity.** With the PK on `customers.id` and an index on `orders.customer_id` (created automatically for the foreign key), this is a nested-loop join: about O(N log M).

**Common mistakes.** `status` filter ko bhool jaana (order 104 CANCELLED aa jaata); `SELECT *` ambiguous `id` columns; JOIN condition bhoolna (cartesian product: 5 x 6 rows).

### EX-SQL-02 - LEFT JOIN anti-join

**Expected approach.** `customers LEFT JOIN orders`; jin customers ke liye match nahi mila unke `o.id` `NULL` hota hai.

```sql
SELECT c.id, c.name, c.city
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;

-- bonus: NOT EXISTS (same result, often the clearest intent)
SELECT c.id, c.name, c.city
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
ORDER BY c.id;
```

**Expected result (both queries).**

| id | name | city |
|----|------|------|
| 4 | Karan | Delhi |
| 5 | Divya | Mumbai |

**Common mistakes.** `NOT IN (SELECT customer_id FROM orders)`: agar subquery mein koi `NULL` aaye to poori query empty result deti hai (NULL semantics); yahan `customer_id` NOT NULL hai par `NOT EXISTS` safer habit hai.
`WHERE o.status = 'PAID' AND o.id IS NULL` jaisa extra condition ek alag question ban jaata hai. MySQL optimizer anti-join ko dono forms mein efficient chalata hai.

### EX-SQL-03 - Total per order

**Expected approach.** `order_items` ko order se join, `PAID` filter, `GROUP BY o.id`, `SUM(qty * unit_price)`.

```sql
SELECT o.id AS order_id,
       COUNT(*) AS item_lines,
       SUM(oi.qty * oi.unit_price) AS total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'PAID'
GROUP BY o.id
ORDER BY o.id;
```

**Expected result.**

| order_id | item_lines | total |
|----------|-----------:|------:|
| 101 | 2 | 1200.00 |
| 102 | 1 | 500.00 |
| 103 | 2 | 2750.00 |
| 105 | 2 | 650.00 |
| 106 | 2 | 650.00 |

**Common mistakes.** `SUM(unit_price)` bina `qty` se multiply kiye; `GROUP BY` mein non-aggregated columns (MySQL 8 `ONLY_FULL_GROUP_BY` error deta hai jab column functionally dependent na ho; yahan `o.id` primary key hai isliye theek);
current product price (`products.price`) ki jagah order time ka `unit_price` use karna chahiye (price baad mein badal sakta hai: historical data).

### EX-SQL-04 - Revenue per customer including zero

**Expected approach.** `customers` base table. `LEFT JOIN orders` mein PAID filter **ON clause** mein, phir `LEFT JOIN order_items`. `COUNT(DISTINCT o.id)` kyunki item join rows multiply karta hai. `COALESCE(SUM(...), 0)` NULL ko 0 banata hai.

```sql
SELECT c.name,
       c.city,
       COUNT(DISTINCT o.id) AS paid_orders,
       COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'PAID'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.name, c.city
ORDER BY revenue DESC, c.name;
```

**Expected result.**

| name | city | paid_orders | revenue |
|------|------|------------:|--------:|
| Ravi | Mumbai | 2 | 3400.00 |
| Asha | Pune | 2 | 1700.00 |
| Meera | Pune | 1 | 650.00 |
| Divya | Mumbai | 0 | 0.00 |
| Karan | Delhi | 0 | 0.00 |

**Common mistakes.**
- Filter ko `WHERE o.status = 'PAID'` mein rakhna: LEFT JOIN effectively INNER JOIN ban jaata hai aur Divya/Karan (zero revenue) result se gayab ho jaate hain.
- `COUNT(o.id)` (bina DISTINCT) ke saath items join: order 101 ke 2 items ki wajah se 2 baar count.
- `COUNT(*)` LEFT JOIN mein: unmatched customer bhi 1 count hota hai.
- Money par `FLOAT` type: `DECIMAL` use karo (schema mein already).

### EX-SQL-05 - GROUP BY ... HAVING

**Expected approach.** `WHERE` row-level filter (PAID) group banne se pehle; `HAVING` group-level filter (units > 20) group banne ke baad.

```sql
SELECT p.category, SUM(oi.qty) AS units_sold
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'PAID'
GROUP BY p.category
HAVING SUM(oi.qty) > 20
ORDER BY units_sold DESC;
```

**Expected result.**

| category | units_sold |
|----------|-----------:|
| Seals | 60 |
| Pipes | 35 |

(Fittings sold 18 units in PAID orders, plus 1 more in a CANCELLED order which is excluded, so it does not pass the filter.)

**Common mistakes.** Aggregate condition `WHERE SUM(...) > 20` (invalid: aggregates `WHERE` mein nahi chalte); `HAVING` mein alias use karna (MySQL allow karta hai, standard SQL nahi, aur portable nahi);
PAID filter ko `HAVING` mein daalna (kaam karta par slow: pehle sab rows group hote).

### EX-SQL-06 - Orders above the average

**Expected approach.** CTE `order_totals` ek baar compute karo. Scalar subquery se average, phir compare. CTE ko do jagah reuse karna readable hai.

```sql
WITH order_totals AS (
  SELECT o.id AS order_id, SUM(oi.qty * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'PAID'
  GROUP BY o.id
)
SELECT order_id, total
FROM order_totals
WHERE total > (SELECT AVG(total) FROM order_totals)
ORDER BY order_id;
```

**Expected result.** Average of PAID totals = (1200 + 500 + 2750 + 650 + 650) / 5 = 1150.

| order_id | total |
|----------|------:|
| 101 | 1200.00 |
| 103 | 2750.00 |

**Common mistakes.** Average ko raw `order_items` rows par nikalna (item average, order average nahi); CANCELLED order include karna (average 1150 ki jagah 1000 ho jaata); `>=` vs `>`.
MySQL 8.0+ mein CTE supported hai (5.7 mein nahi); MySQL 8 CTE ko multiple references par materialize kar sakta hai.

### EX-SQL-07 - Window function: rank within city

**Expected approach.** Pehle per-customer revenue (EX-SQL-04 logic) CTE mein. Phir `RANK() OVER (PARTITION BY city ORDER BY revenue DESC)`. Window functions rows collapse nahi karte (GROUP BY se alag).

```sql
WITH customer_revenue AS (
  SELECT c.id, c.name, c.city,
         COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'PAID'
  LEFT JOIN order_items oi ON oi.order_id = o.id
  GROUP BY c.id, c.name, c.city
)
SELECT city, name, revenue,
       RANK() OVER (PARTITION BY city ORDER BY revenue DESC) AS city_rank
FROM customer_revenue
ORDER BY city, city_rank, name;
```

**Expected result.**

| city | name | revenue | city_rank |
|------|------|--------:|----------:|
| Delhi | Karan | 0.00 | 1 |
| Mumbai | Ravi | 3400.00 | 1 |
| Mumbai | Divya | 0.00 | 2 |
| Pune | Asha | 1700.00 | 1 |
| Pune | Meera | 650.00 | 2 |

**Tie behaviour.** Do customers ka revenue barabar ho (say 500, 500, 300): `RANK()` -> 1, 1, 3 (gap); `DENSE_RANK()` -> 1, 1, 2 (no gap); `ROW_NUMBER()` -> 1, 2, 3 (arbitrary
tie-break unless you add a second ORDER BY column).

**Common mistakes.** Window function ko `WHERE` mein filter karna (nahi chalta; CTE/subquery mein wrap karke bahar filter karo: "top 1 per city" ka standard pattern); `PARTITION BY` bhoolna (poore table par rank); MySQL 5.7 par window functions available nahi.

### EX-SQL-08 - Monthly revenue with running total

**Expected approach.** Pehle monthly revenue group karo (CTE), phir us result par `SUM(revenue) OVER (ORDER BY month)` running total.
Window function aggregated rows par chalta hai, isliye do steps.

```sql
WITH monthly AS (
  SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month,
         SUM(oi.qty * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'PAID'
  GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
)
SELECT month,
       revenue,
       SUM(revenue) OVER (ORDER BY month) AS cumulative_revenue
FROM monthly
ORDER BY month;
```

**Expected result.**

| month | revenue | cumulative_revenue |
|-------|--------:|-------------------:|
| 2024-04 | 4450.00 | 4450.00 |
| 2024-05 | 1300.00 | 5750.00 |

**Common mistakes.** `GROUP BY MONTH(created_at)` (different years merge ho jaate hain); `ORDER BY` bina window frame ke: default frame `RANGE UNBOUNDED PRECEDING` hai, ties par peers ko ek saath add karta hai (yahan months unique hain);
`DATE_FORMAT` pe index use nahi hota: bade tables par `created_at >= ... AND created_at < ...` range filter + generated column/summary table.

---

## 8. Transaction-safe database operations - solutions

Sab MySQL solutions InnoDB assume karte hain. Reminder: EX-TXN-01..07 ke solutions real MySQL 8.0.46 (mysql2 3.24.6) par run karke verify kiye gaye hain; phir bhi apne MySQL 8 par run karke dekho (pehle `txn_practice` schema load karo).

### EX-TXN-01 - Money transfer

**Expected approach.** (1) Input validate **transaction se pehle** (connection waste nahi). (2) Connection lo, `BEGIN`. (3) Dono account rows `FOR UPDATE` se lock karo **hamesha chhote id se pehle** (lock ordering = deadlock prevention).
(4) Debit ek conditional `UPDATE ... WHERE balance >= ?` se (check + write ek statement, float math nahi). (5) Credit, ledger rows (double-entry). (6) Commit. Error par rollback, `finally` mein release.
`moveMoney` ko alag export kiya gaya hai taaki doosri operations (EX-IDEM-06) usi transaction mein reuse kar sakein.

**Reference solution.**

```js
// ex-txn-01.js  (uses ex-err-02.js; mysql2/promise pool from the problem statement)
import { AppError, NotFoundError, ValidationError } from './ex-err-02.js';

const MONEY_RE = /^\d+(\.\d{1,2})?$/;

export function assertMoney(amount, fromId, toId) {
  if (typeof amount !== 'string' || !MONEY_RE.test(amount) || Number(amount) <= 0) {
    throw new ValidationError('Invalid amount', [{ field: 'amount', message: 'must be a positive money string like "250.00"' }]);
  }
  if (fromId === toId) {
    throw new ValidationError('Invalid accounts', [{ field: 'toId', message: 'must differ from fromId' }]);
  }
}

// Runs INSIDE an already-open transaction (so other operations can share it, see EX-IDEM-06).
export async function moveMoney(conn, { fromId, toId, amount, ref }) {
  // lock rows in ONE global order (lowest id first): A->B and B->A can then never deadlock each other
  for (const id of [Math.min(fromId, toId), Math.max(fromId, toId)]) {
    const [rows] = await conn.execute('SELECT id FROM accounts WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) throw new NotFoundError(`Account ${id} not found`);
  }
  // the balance check and the debit are ONE statement: no float math, no read-then-write gap
  const [debit] = await conn.execute(
    'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
    [amount, fromId, amount],
  );
  if (debit.affectedRows !== 1) {
    throw new AppError('Insufficient funds', { status: 422, code: 'INSUFFICIENT_FUNDS' });
  }
  await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toId]);
  await conn.execute(
    'INSERT INTO ledger (account_id, delta, ref) VALUES (?, ?, ?), (?, ?, ?)',
    [fromId, `-${amount}`, ref, toId, amount, ref],
  );
}

export async function transfer(pool, { fromId, toId, amount, ref }) {
  assertMoney(amount, fromId, toId); // cheap validation BEFORE taking a connection
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await moveMoney(conn, { fromId, toId, amount, ref });
    await conn.commit();
    return { ref, fromId, toId, amount };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* the connection may already be broken; the original error matters more */
    }
    throw err;
  } finally {
    conn.release(); // ALWAYS: a leaked connection is a permanently lost pool slot
  }
}
```

**Complexity.** O(1) queries (about 6 statements); locks held for the duration of the transaction.

**Common mistakes.**
- Balance `SELECT` karke JS mein check karna phir `UPDATE`: race (EX-TXN-02).
- Lock order random: `transfer(A,B)` aur `transfer(B,A)` ek saath deadlock.
- Money ko JS `Number` mein add/subtract karna (`0.1 + 0.2`): DECIMAL aur SQL arithmetic, ya integer paise.
- `release()` bhoolna ya sirf success path mein: pool slot permanently lost (EX-DEBUG-05).
- Transaction ke andar network call (payment gateway, email): lock lamba time hold hota hai.
- `CHECK (balance >= 0)` constraint ko akela safety net maan lena: MySQL 8.0.16+ enforce karta hai; phir bhi application-level check zaroori hai taaki user ko clear error mile.

### EX-TXN-02 - Atomic stock reservation

**Why the broken approach oversells.** Do requests concurrently `SELECT stock` -> dono ko 3 dikhta hai -> dono `3 >= 2` check pass karte hain -> dono `UPDATE stock = 1` likhte hain. Hum 4 units bech chuke, stock 3 tha. Check aur write ke beech
gap hai (TOCTOU: time-of-check to time-of-use).

**Expected approach.** Check ko write ke saath ek statement banao: `UPDATE ... SET stock = stock - ? WHERE id = ? AND stock >= ?`. InnoDB update ke dauran row lock leta hai, isliye dusri request wait karti hai, phir updated `stock` dekhti hai aur
`WHERE` fail hone par 0 rows affect karti hai.

**Reference solution.**

```js
// ex-txn-02.js
//
// BROKEN version (do not use):
//   const [[p]] = await pool.execute('SELECT stock FROM products WHERE id = ?', [id]);
//   if (p.stock < qty) return false;                       // (1) both requests read stock = 3 here
//   await pool.execute('UPDATE products SET stock = ? WHERE id = ?', [p.stock - qty, id]); // (2) both write 1
// Two requests for qty 2 both see stock 3, both pass the check, both write 1: we sold 4 units with 3 in stock.

export async function reserveStock(pool, productId, qty) {
  if (!Number.isInteger(qty) || qty < 1) throw new RangeError('qty must be a positive integer');
  // check + decrement in ONE statement; InnoDB takes the row lock for the duration of the UPDATE
  const [result] = await pool.execute(
    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [qty, productId, qty],
  );
  return result.affectedRows === 1; // 0 rows: not enough stock (or no such product)
}
```

**Complexity.** One statement, O(log n) index lookup.

**Common mistakes.**
- `SELECT` + JS check + `UPDATE stock = <computed>` (lost update + oversell).
- `affectedRows` check na karna: stock kam hone par bhi "success" return.
- Is statement ko multi-step workflow (order + items + payment) ke liye kaafi samajhna: wahan explicit transaction chahiye (EX-TXN-03).
- `CHECK (stock >= 0)` par depend karke error pakadna: kaam karta hai (error 3819) par business flow ke liye conditional UPDATE zyada saaf hai.

### EX-TXN-03 - Place an order atomically

**Expected approach.** Validation pehle. Product ids sort karke `SELECT ... WHERE id IN (...) ORDER BY id FOR UPDATE` (rows lock, fixed order). Prices **DB se**. Stock check, total paise mein, order + items insert, stock decrement, commit. Koi bhi
step fail -> rollback (sab undo). `query()` use kiya kyunki `IN (?)` array client-side expand hota hai (`execute` prepared statement ye array expand nahi karta).

**Reference solution.**

```js
// ex-txn-03.js  (uses ex-err-02.js)
import { ConflictError, NotFoundError, ValidationError } from './ex-err-02.js';

function validateItems(items) {
  const details = [];
  if (!Array.isArray(items) || items.length === 0) details.push({ field: 'items', message: 'must be a non-empty array' });
  else {
    const seen = new Set();
    items.forEach((it, i) => {
      if (!Number.isInteger(it?.productId) || it.productId < 1) details.push({ field: `items[${i}].productId`, message: 'must be a positive integer' });
      if (!Number.isInteger(it?.qty) || it.qty < 1 || it.qty > 1000) details.push({ field: `items[${i}].qty`, message: 'must be an integer 1..1000' });
      if (seen.has(it?.productId)) details.push({ field: `items[${i}].productId`, message: 'duplicate product' });
      seen.add(it?.productId);
    });
  }
  if (details.length > 0) throw new ValidationError('Invalid order', details);
}

export async function placeOrder(pool, userId, items) {
  validateItems(items);
  const ids = items.map((i) => i.productId).sort((a, b) => a - b); // fixed lock order

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // query() (not execute) because `IN (?)` with an array is expanded client-side
    const [rows] = await conn.query('SELECT id, price, stock FROM products WHERE id IN (?) ORDER BY id FOR UPDATE', [ids]);
    if (rows.length !== ids.length) throw new NotFoundError('One or more products do not exist');
    const byId = new Map(rows.map((r) => [r.id, r]));

    let totalPaise = 0;
    for (const { productId, qty } of items) {
      const product = byId.get(productId);
      if (product.stock < qty) throw new ConflictError(`Insufficient stock for product ${productId}`);
      totalPaise += Math.round(Number(product.price) * 100) * qty; // price comes from the DB, never from the client
    }
    const total = (totalPaise / 100).toFixed(2);

    const [order] = await conn.execute('INSERT INTO orders (user_id, total) VALUES (?, ?)', [userId, total]);
    for (const { productId, qty } of items) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?)',
        [order.insertId, productId, qty, byId.get(productId).price],
      );
      await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, productId]);
    }

    await conn.commit();
    return { orderId: order.insertId, total };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore: keep the original error */
    }
    throw err;
  } finally {
    conn.release();
  }
}
```

**Complexity.** O(k) statements for k items; locks k product rows until commit.

**Common mistakes.**
- Client se `price` lena (user 1 rupee bhejega).
- Stock check ke liye `SELECT` bina `FOR UPDATE`: do orders ek hi stock ko consume kar lete hain.
- Lock order random (deadlocks): sorted ids.
- Duplicate `productId` allow karna: `order_items` primary key `(order_id, product_id)` toot jaati hai ya quantity logic bigadti hai.
- `conn.release()` ko `try` ke andar rakhna.
- Floating point total: `0.1 * 3` jaise errors; paise integer use kiye.

### EX-TXN-04 - `withTransaction` helper with deadlock retry

**Expected approach.** Ek reusable helper: connection lo, `BEGIN`, `fn(conn)`, `COMMIT`; error par `ROLLBACK`; hamesha `release`. Deadlock (`errno 1213`) ya lock wait timeout (`1205`) par poora transaction naye connection se dobara,
exponential backoff + jitter ke saath, bounded retries. Delay se pehle connection release.

**Why `fn` must be safe to rerun.** Rollback ke baad `fn` phir se chalta hai. `fn` ke andar jo bhi non-DB side effects hue (email, HTTP call, in-memory counter) woh repeat honge. DB writes rollback ho chuke hote hain, isliye safe; baaki nahi.

**Reference solution.**

```js
// ex-txn-04.js
const RETRYABLE_ERRNO = new Set([1213 /* ER_LOCK_DEADLOCK */, 1205 /* ER_LOCK_WAIT_TIMEOUT */]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withTransaction(pool, fn, { retries = 3 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const conn = await pool.getConnection();
    let retryDelayMs;
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      try {
        await conn.rollback(); // after a deadlock MySQL already rolled back; this is harmless
      } catch {
        /* connection may be dead */
      }
      if (!RETRYABLE_ERRNO.has(err.errno) || attempt >= retries) throw err;
      // exponential backoff with jitter, so the two deadlocked transactions do not collide again
      retryDelayMs = Math.round(20 * 2 ** attempt * (0.5 + Math.random()));
    } finally {
      conn.release(); // released BEFORE we sleep, so a waiting retry does not hold a pool slot
    }
    await sleep(retryDelayMs);
  }
}
```

**Complexity.** O(1) overhead; worst case `retries + 1` runs of `fn`.

**Common mistakes.**
- Sirf failed statement retry karna: deadlock mein poora transaction rollback hota hai, ek statement nahi.
- Sab errors retry karna (duplicate key, syntax error kabhi theek nahi honge).
- Connection ko sleep ke dauran hold karna.
- Jitter na lagana: dono deadlocked transactions same time par retry karke phir deadlock.
- Retry limit nahi.
- Deadlock ko "bug" samajhna: busy system mein normal hai; sahi response hai retry + lock ordering + short transactions.

### EX-TXN-05 - Optimistic locking

**Expected approach.** `UPDATE ... WHERE id = ? AND version = ?` aur `version = version + 1`. `affectedRows === 1` success. 0 ho to ya account nahi hai ya kisi ne pehle badal diya: dusri query se differentiate (404 vs 409).
Client flow: read (version note karo) -> edit -> write with version -> conflict mile to dobara read karke user ko latest data dikhao.

**Reference solution.**

```js
// ex-txn-05.js  (uses ex-err-02.js)
import { ConflictError, NotFoundError } from './ex-err-02.js';

export async function renameOwner(pool, accountId, newOwner, expectedVersion) {
  const [result] = await pool.execute(
    'UPDATE accounts SET owner = ?, version = version + 1 WHERE id = ? AND version = ?',
    [newOwner, accountId, expectedVersion],
  );
  if (result.affectedRows === 1) return { id: accountId, owner: newOwner, version: expectedVersion + 1 };

  // zero rows: either the account does not exist or somebody changed it first
  const [rows] = await pool.execute('SELECT version FROM accounts WHERE id = ?', [accountId]);
  if (rows.length === 0) throw new NotFoundError(`Account ${accountId} not found`);
  throw new ConflictError(`Stale version: you sent ${expectedVersion}, current is ${rows[0].version}`);
}

// Client-side flow (HTTP): GET /accounts/1 -> { owner, version: 0 }; edit; PATCH with If-Match: 0.
// 409/412 -> GET again, show the user the newer data, let them re-apply the edit, resend with the new version.
```

**Complexity.** One indexed UPDATE, O(log n).

**Common mistakes.**
- Version check aur update alag queries mein (race wapas aa jaati hai).
- `version` increment bhoolna.
- High-contention rows (counters, stock) par optimistic locking: retries ka toofan; wahan atomic UPDATE ya pessimistic lock.
- Silent overwrite ("last write wins") ko theek samajhna jab users forms edit karte hain.
- mysql2 mein `affectedRows` (matched) vs `changedRows` (actually changed) ka difference; version badalne se row hamesha change hoti hai, isliye dono kaam karte.

### EX-TXN-06 - Transactional outbox

**Expected approach.** Problem: "DB commit" aur "message broker publish" ek atomic operation nahi hain (dual write). Agar commit ke baad publish fail ho to event lost; publish ke baad commit fail ho to phantom event.
Outbox: business row aur event row **ek hi transaction** mein. Alag relay worker `outbox` table se `NEW` rows uthata hai (`FOR UPDATE SKIP LOCKED`: multiple workers bina ek-doosre ko block kiye), publish karta hai, `SENT` mark karta hai.

**Guarantee.** At-least-once delivery: publish ke baad commit se pehle crash ho to rows `NEW` rehte hain aur dobara publish hote hain. Isliye consumers ko idempotent (duplicate-safe) hona chahiye (event id se dedupe, EX-IDEM).

**Reference solution.**

```js
// ex-txn-06.js  (uses ex-txn-04.js)
import { withTransaction } from './ex-txn-04.js';

// (a) business row + event row in ONE transaction: either both exist or neither
export function placeOrderWithEvent(pool, userId, total) {
  return withTransaction(pool, async (conn) => {
    const [order] = await conn.execute('INSERT INTO orders (user_id, total) VALUES (?, ?)', [userId, total]);
    await conn.execute('INSERT INTO outbox (topic, payload) VALUES (?, ?)', [
      'order.placed',
      JSON.stringify({ orderId: order.insertId, userId, total }),
    ]);
    return order.insertId;
  });
}

// (b) relay: claim a batch, publish, mark SENT. Run this in a loop / interval in one or more workers.
export async function drainOutbox(pool, publish, batchSize = 50) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // SKIP LOCKED: rows locked by another worker are skipped instead of waited for (MySQL 8.0+)
    const [rows] = await conn.query(
      `SELECT id, topic, payload FROM outbox WHERE status = 'NEW' ORDER BY id LIMIT ? FOR UPDATE SKIP LOCKED`,
      [batchSize],
    );
    const sentIds = [];
    for (const row of rows) {
      try {
        await publish(row); // payload column (JSON) arrives already parsed
        sentIds.push(row.id);
      } catch {
        break; // keep ordering: stop at the first failure, the rest stay NEW for the next drain
      }
    }
    if (sentIds.length > 0) await conn.query(`UPDATE outbox SET status = 'SENT' WHERE id IN (?)`, [sentIds]);
    await conn.commit();
    return sentIds.length;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    conn.release();
  }
}
// If the worker crashes AFTER publish but BEFORE commit, the rows stay NEW and are published again:
// delivery is AT-LEAST-ONCE, so consumers must deduplicate (idempotent handlers, see EX-IDEM).
```

**Complexity.** O(batch size) per drain.

**Common mistakes.**
- Transaction ke andar seedha broker publish (dual write problem).
- Commit ke baad publish try/catch ke saath (crash window mein event lost).
- Consumer ko exactly-once maan lena.
- Outbox table ko kabhi clean na karna (SENT rows delete/archive job chahiye).
- `SKIP LOCKED` MySQL 8.0+ hai; 5.7 par available nahi.
- Ordering: multiple workers ke saath strict ordering guarantee nahi (partition key ya single worker chahiye).

### EX-TXN-07 - Fix the lost update

**Why updates are lost.** Do requests dono `views = 36` padhte hain aur dono `37` likhte hain: ek increment gaya. Read-modify-write application mein hai aur DB ko pata hi nahi ki dono operations related hain.

**Reference solution (three fixes).**

```js
// ex-txn-07.js  (uses ex-txn-04.js)
import { withTransaction } from './ex-txn-04.js';

// Why updates are lost: two requests both read views = 36, both write 37. The second write silently
// overwrites the first (read-modify-write in application code, no lock, no condition).

// Fix 1: do the arithmetic in the database. One statement, atomic, fastest. Prefer this when you can.
export async function incrementViewsAtomic(pool, articleId) {
  await pool.execute('UPDATE articles SET views = views + 1 WHERE id = ?', [articleId]);
}

// Fix 2: pessimistic lock. Needed when the NEW value depends on application logic (not just +1).
export function incrementViewsLocked(pool, articleId) {
  return withTransaction(pool, async (conn) => {
    const [[row]] = await conn.execute('SELECT views FROM articles WHERE id = ? FOR UPDATE', [articleId]);
    await conn.execute('UPDATE articles SET views = ? WHERE id = ?', [row.views + 1, articleId]);
  });
}

// Fix 3: optimistic. Needs: ALTER TABLE articles ADD COLUMN version INT NOT NULL DEFAULT 0;
// No lock is held while computing; the write only succeeds if nobody changed the row meanwhile.
export async function incrementViewsOptimistic(pool, articleId, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const [[row]] = await pool.execute('SELECT views, version FROM articles WHERE id = ?', [articleId]);
    const [result] = await pool.execute(
      'UPDATE articles SET views = ?, version = version + 1 WHERE id = ? AND version = ?',
      [row.views + 1, articleId, row.version],
    );
    if (result.affectedRows === 1) return;
  }
  throw new Error('Too much contention, giving up');
}
// Choose: Fix 1 for counters. Fix 2 for short, high-contention read-then-decide flows (stock, balances).
// Fix 3 for low-contention edits where users hold data for a long time (edit forms): never block, detect conflicts.
```

**Which to choose.**

| Fix | Use when | Cost |
|-----|----------|------|
| 1. Atomic `views = views + 1` | Pure arithmetic update | Cheapest; best default |
| 2. `SELECT ... FOR UPDATE` in a transaction | New value needs application logic after reading (balances, stock rules) | Holds a row lock; contention serializes |
| 3. Optimistic version check | Low contention; user edits data over long time (forms); you cannot hold locks | Needs a retry loop and a version column |

**Complexity.** Fix 1: one statement. Fix 2: 3 statements plus a lock held across them. Fix 3: 2 statements per attempt, up to `maxAttempts` attempts.

**Common mistakes.**
- Isolation level badalna (REPEATABLE READ default mein bhi lost update is code mein hota hai kyunki dono plain reads hain).
- `SELECT` ko `FOR UPDATE` ke bina transaction mein wrap karke safe samajhna.
- Retry loop mein backoff/limit nahi.


---

## 9. JWT authentication - solutions

### EX-JWT-01 - Decode by hand

**Expected approach.** JWT = `base64url(header).base64url(payload).signature`. Split on `.`, `Buffer.from(part, 'base64url')`, `JSON.parse`. Validate shape (object, 3 parts).

**Why decoding is not trusting.** JWT **signed** hota hai, **encrypted** nahi. Payload koi bhi padh sakta hai aur koi bhi naya payload bana kar bhej sakta hai. Jab tak signature verify nahi hua, payload sirf "client ka claim" hai.
`jwt.decode()` (jsonwebtoken) bhi yahi karta hai: authentication ke liye hamesha `jwt.verify()`.

**Reference solution.**

```js
// ex-jwt-01.js
function parsePart(part, label) {
  let value;
  try {
    value = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    throw new Error(`Invalid JWT ${label}`);
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid JWT ${label}`);
  }
  return value;
}

// WARNING: this only DECODES. Nothing here proves who created the token. Anyone can craft
// a token with any payload; only verifying the signature (with the secret/public key) makes it trustworthy.
// Never use the result of decodeJwt() for authentication or authorization decisions.
export function decodeJwt(token) {
  if (typeof token !== 'string') throw new TypeError('token must be a string');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('JWT must have exactly 3 parts');
  return { header: parsePart(parts[0], 'header'), payload: parsePart(parts[1], 'payload'), signature: parts[2] };
}

// demo
if (process.argv[1] === import.meta.filename) {
  const t = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJ1c2VyIn0.sig';
  console.log(decodeJwt(t)); // { header: { alg: 'HS256', typ: 'JWT' }, payload: { sub: '42', role: 'user' }, signature: 'sig' }
}
```

**Complexity.** O(token length).

**Common mistakes.**
- Auth middleware mein `jwt.decode` use karna (EX-JWT-06).
- Payload mein secrets (password, card numbers) daalna: payload readable hai.
- Standard base64 (`+`, `/`, `=` padding) aur base64url mix karna.

### EX-JWT-02 - HS256 from scratch

**Expected approach.** Sign: `HMAC-SHA256(secret, base64url(header) + '.' + base64url(payload))`. Verify: (1) 3 parts, (2) header `alg` **server ke expected value** se match (kabhi token se algorithm choose nahi), (3) HMAC dobara compute karke `timingSafeEqual` se compare
(pehle length check), (4) `exp`/`nbf`/`iss`/`aud` check. JWT time seconds mein hota hai.

**Reference solution.**

```js
// ex-jwt-02.js
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64u = (value) =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
const hmac = (data, secret) => createHmac('sha256', secret).update(data).digest();

export function signJwt(payload, secret, { expiresInSec, now = () => Date.now() } = {}) {
  const iat = Math.floor(now() / 1000);
  const body = { ...payload, iat, ...(expiresInSec !== undefined && { exp: iat + expiresInSec }) };
  const signingInput = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u(body)}`;
  return `${signingInput}.${hmac(signingInput, secret).toString('base64url')}`;
}

export function verifyJwt(token, secret, { now = () => Date.now(), leewaySec = 0, issuer, audience } = {}) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) throw new Error('malformed token');
  const [h, p, s] = parts;

  let header;
  try {
    header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
  } catch {
    throw new Error('malformed token');
  }
  // the server decides the algorithm; the token only gets to AGREE with it
  if (header?.alg !== 'HS256') throw new Error('unsupported alg');

  const expected = hmac(`${h}.${p}`, secret);
  const given = Buffer.from(s, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new Error('invalid signature');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  } catch {
    throw new Error('malformed token');
  }

  const nowSec = Math.floor(now() / 1000); // JWT times are in SECONDS, Date.now() is milliseconds
  if (typeof payload.exp === 'number' && nowSec >= payload.exp + leewaySec) throw new Error('token expired');
  if (typeof payload.nbf === 'number' && nowSec + leewaySec < payload.nbf) throw new Error('token not active yet');
  if (issuer !== undefined && payload.iss !== issuer) throw new Error('invalid issuer');
  if (audience !== undefined) {
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(audience)) throw new Error('invalid audience');
  }
  return payload;
}

// demo
if (process.argv[1] === import.meta.filename) {
  const token = signJwt({ sub: '42', role: 'user' }, 'topsecret', { expiresInSec: 60 });
  console.log(verifyJwt(token, 'topsecret'));
  for (const [label, run] of [
    ['wrong secret', () => verifyJwt(token, 'wrong')],
    ['tampered payload', () => {
      const [h, , s] = token.split('.');
      return verifyJwt(`${h}.${Buffer.from('{"sub":"1","role":"admin"}').toString('base64url')}.${s}`, 'topsecret');
    }],
    ['alg none', () => {
      const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
      return verifyJwt(`${b({ alg: 'none' })}.${b({ sub: '1' })}.`, 'topsecret');
    }],
    ['expired', () => verifyJwt(token, 'topsecret', { now: () => Date.now() + 61_000 })],
  ]) {
    try {
      run();
    } catch (err) {
      console.log(label, '->', err.message);
    }
  }
}
```

**Complexity.** O(token length).

**Common mistakes.**
- `alg: none` accept karna ya library ko token ke `alg` par chhod dena (algorithm confusion: RS256 public key ko HS256 secret ki tarah use). Hamesha `algorithms: [...]` pin karo.
- Signature compare `===` se (timing leak).
- `exp` na check karna ya `Date.now()` (ms) ko seconds se compare karna.
- Production mein `exp` ko **required** banao (yahan optional hai taaki function flexible rahe): bina expiry ka token forever valid.
- Apna crypto likhna production mein: library (`jsonwebtoken`, `jose`) use karo. Yeh exercise mechanism samajhne ke liye hai.
- Weak secret (`secret123`): HS256 ke liye kam se kam 32 random bytes.

### EX-JWT-03 - Signup, login, auth middleware

**Expected approach.** `bcrypt.hash` (cost 12; tests mein kam), `bcrypt.compare`. Login mein user na mile to bhi dummy hash se compare (timing equal), same `401 Invalid credentials`. Token: `sub`, `role`, `exp` (15 min); `jwt.verify(..., { algorithms: ['HS256'] })`. Role hamesha server decide
karta hai. Response mein hash kabhi nahi. Secret env se; missing ho to app start par hi fail.

**Reference solution** (needs `ex-err-02.js`, `ex-mw-05.js`; `npm i bcrypt jsonwebtoken`).

```js
// ex-jwt-03.js  (npm i express@5 bcrypt jsonwebtoken; uses ex-mw-05.js and ex-err-02.js)
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError, ConflictError, ValidationError } from './ex-err-02.js';
import { errorHandler, notFound } from './ex-mw-05.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const unauthenticated = () => new AppError('Invalid credentials', { status: 401, code: 'UNAUTHENTICATED' });

export function createApp({ jwtSecret = process.env.JWT_SECRET, bcryptCost = 12, logger = console } = {}) {
  if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must be set (at least 32 characters)');

  const app = express();
  app.use(express.json());

  const usersByEmail = new Map();
  const usersById = new Map();
  let nextId = 1;
  // compared against when the email is unknown, so "no such user" and "wrong password" take similar time
  const dummyHash = bcrypt.hashSync('not-a-real-password', bcryptCost);

  const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role }); // never includes passwordHash

  function authenticate(req, res, next) {
    const match = /^Bearer (.+)$/.exec(req.get('authorization') ?? '');
    if (!match) throw new AppError('Missing bearer token', { status: 401, code: 'UNAUTHENTICATED' });
    try {
      // algorithms pinned: a token cannot choose its own algorithm (blocks "alg: none" tricks)
      const payload = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'] });
      req.user = { id: Number(payload.sub), role: payload.role };
    } catch {
      throw new AppError('Invalid or expired token', { status: 401, code: 'UNAUTHENTICATED' });
    }
    next();
  }

  app.post('/auth/signup', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    const details = [];
    if (!EMAIL_RE.test(email)) details.push({ field: 'email', message: 'must be a valid email' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      // bcrypt only uses the first 72 bytes: cap the length instead of silently truncating
      details.push({ field: 'password', message: 'must be 8..72 characters' });
    }
    if (details.length > 0) throw new ValidationError('Invalid body', details);
    if (usersByEmail.has(email)) throw new ConflictError('Email already registered');

    const user = { id: nextId++, email, role: 'user', passwordHash: await bcrypt.hash(password, bcryptCost) };
    usersByEmail.set(email, user);
    usersById.set(user.id, user);
    res.status(201).json(publicUser(user));
  });

  app.post('/auth/login', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = usersByEmail.get(email);
    const ok = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
    if (!user || !ok) throw unauthenticated(); // same answer for both cases: no user enumeration

    const accessToken = jwt.sign({ role: user.role }, jwtSecret, {
      algorithm: 'HS256',
      subject: String(user.id),
      expiresIn: '15m',
    });
    res.json({ accessToken, expiresIn: 900 });
  });

  app.get('/me', authenticate, (req, res) => {
    const user = usersById.get(req.user.id);
    if (!user) throw new AppError('Invalid or expired token', { status: 401, code: 'UNAUTHENTICATED' });
    res.json(publicUser(user));
  });

  app.use(notFound);
  app.use(errorHandler({ logger }));
  return app;
}
```

**Complexity.** Login/signup dominated by bcrypt cost (intentionally slow: about 250 ms at cost 12). `bcrypt` library hashing libuv thread pool par chalti hai, isliye event loop block nahi hota.

**Common mistakes.**
- Plaintext ya fast hash (md5/sha256) se password store karna.
- "No such user" vs "wrong password" alag messages (user enumeration).
- `req.body` ko seedha create mein dena (`role: 'admin'` mass assignment).
- Token mein `passwordHash`/poora user object daalna.
- Hardcoded secret, ya `expiresIn` na lagana.
- `bcrypt.hashSync`/`compareSync` request handler mein: event loop block (yahan sirf startup par dummy hash ke liye).
- bcrypt sirf pehle 72 bytes use karta hai: long passwords silently truncate; length cap ya pre-hash.
- Access token 15 min ka hai kyunki revoke karna mushkil hai; long sessions ke liye refresh token (next exercise).

### EX-JWT-04 - Refresh token rotation with reuse detection

**Expected approach.** Refresh token opaque random string (JWT nahi). DB/store mein sirf `sha256(token)` (leak hone par bhi raw token nahi). Har refresh par purana token `usedAt` mark, naya token same `familyId` ke saath issue (rotation).
Agar `usedAt` wala token phir aaye -> theft signal: poori family revoke, 401. Logout family revoke karta hai.

**Reference solution.**

```js
// ex-jwt-04.js
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import express from 'express';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

// In-memory for the exercise. The same interface maps 1:1 to a MySQL table or Redis hashes.
export class RefreshTokenStore {
  #byHash = new Map(); // sha256(token) -> record. The raw token is never stored.
  #ttlMs;
  #now;

  constructor({ ttlMs = 7 * 24 * 3600 * 1000, now = () => Date.now() } = {}) {
    this.#ttlMs = ttlMs;
    this.#now = now;
  }

  issue(userId, familyId = randomUUID()) {
    const token = randomBytes(32).toString('base64url');
    this.#byHash.set(sha256(token), {
      userId,
      familyId,
      expiresAt: this.#now() + this.#ttlMs,
      usedAt: null,
      revoked: false,
    });
    return token;
  }

  rotate(token) {
    const rec = this.#byHash.get(sha256(String(token)));
    if (!rec) throw new AuthError('invalid refresh token');
    if (rec.usedAt !== null) {
      // an already-rotated token is coming back: either a thief or the real user replaying it
      this.revokeFamily(rec.familyId); // kill every token of this login session
      throw new AuthError('refresh token reuse detected');
    }
    if (rec.revoked || rec.expiresAt <= this.#now()) throw new AuthError('refresh token expired or revoked');
    rec.usedAt = this.#now();
    return { userId: rec.userId, refreshToken: this.issue(rec.userId, rec.familyId) };
  }

  revokeFamily(familyId) {
    for (const rec of this.#byHash.values()) if (rec.familyId === familyId) rec.revoked = true;
  }

  revoke(token) {
    const rec = this.#byHash.get(sha256(String(token)));
    if (rec) this.revokeFamily(rec.familyId);
  }
}

// Mount at /auth. Login (EX-JWT-03) additionally does: refreshToken: store.issue(user.id)
export function createRefreshRouter({ store, issueAccessToken, loadUser }) {
  const router = express.Router();

  router.post('/refresh', (req, res) => {
    try {
      const { userId, refreshToken } = store.rotate(req.body?.refreshToken);
      const user = loadUser(userId);
      res.json({ accessToken: issueAccessToken(user), refreshToken });
    } catch (err) {
      if (err instanceof AuthError) {
        return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid refresh token' } });
      }
      throw err;
    }
  });

  router.post('/logout', (req, res) => {
    store.revoke(req.body?.refreshToken); // idempotent: unknown tokens are ignored
    res.status(204).end();
  });

  return router;
}

// demo
if (process.argv[1] === import.meta.filename) {
  const store = new RefreshTokenStore();
  const r1 = store.issue(1);
  const { refreshToken: r2 } = store.rotate(r1);
  for (const [label, token] of [['reuse r1', r1], ['then r2', r2]]) {
    try {
      store.rotate(token);
    } catch (err) {
      console.log(label, '->', err.message);
    }
  }
}
```

**Complexity.** O(1) per operation with the hash map; `revokeFamily` is O(n) here (index by `familyId` in a real store).

**Common mistakes.**
- Refresh token ko long-lived JWT banana jisse server-side revoke impossible.
- Raw refresh token DB mein.
- Rotation na karna (ek chori hui token mahino chalti hai).
- Race: do tabs ek saath refresh karein to legitimate user ko bhi reuse-detection lag sakta hai. Production fix: chhota grace window (e.g. 10 s) ya single-flight refresh on the client.
- Refresh token ko `localStorage` mein rakhna (XSS se chori): `HttpOnly; Secure; SameSite` cookie behtar hai (week 5 / day 4-5).
- Check-then-update rotation multi-instance store mein atomic nahi: DB mein `UPDATE ... SET used_at = NOW() WHERE token_hash = ? AND used_at IS NULL` aur `affectedRows` check karo.

### EX-JWT-05 - RBAC and ownership

**Expected approach.** `requireRole(...roles)`: `req.user` nahi -> 401, role galat -> 403. `requireOwnerOrAdmin(getOwnerId)`: resource nahi mila -> 404; owner/admin nahi -> **404** (403 bataata hai ki resource exist karta hai: information leak); admin pass.
Role check route-level hai; ownership check resource-level hai (IDOR protection): dono chahiye.

**Reference solution.**

```js
// ex-jwt-05.js
const deny = (res, status, code, message) => res.status(status).json({ error: { code, message } });

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return deny(res, 401, 'UNAUTHENTICATED', 'Authentication required');
    if (!roles.includes(req.user.role)) return deny(res, 403, 'FORBIDDEN', 'Insufficient role');
    next();
  };
}

// getOwnerId(req): async, resolves to the owner's id or null when the resource does not exist
export function requireOwnerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    if (!req.user) return deny(res, 401, 'UNAUTHENTICATED', 'Authentication required');
    const ownerId = await getOwnerId(req); // Express 5 forwards a rejection to the error middleware
    if (ownerId === null || ownerId === undefined) return deny(res, 404, 'NOT_FOUND', 'Not found');
    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      // 404 instead of 403: do not reveal that someone else's resource exists
      return deny(res, 404, 'NOT_FOUND', 'Not found');
    }
    next();
  };
}
```

**Complexity.** O(1) plus the ownership lookup (one DB query by primary key).

**Common mistakes.**
- Sirf frontend mein button chhupana (authorization frontend par kabhi nahi: UI guard sirf UX).
- Role request body/token se bina verify bharosa karna (token verify ke baad hi `req.user`).
- 401 aur 403 ko mix karna.
- IDOR: `/orders/123` fetch karte waqt sirf login check, owner check nahi.
- Token mein purana role: user ka role badal gaya par 15 min tak token purana role leke chalta hai; sensitive actions par DB se role dobara check karo.
- Express 4: async middleware ke liye wrapper chahiye.

### EX-JWT-06 - Audit and fix

**Problems in the broken code (at least 8).**

1. **Mass assignment:** `db.users.create(req.body)` -- client `role: 'admin'` bhej kar admin ban sakta hai.
2. **Plaintext password** store/compare (`user.password !== req.body.password`): DB leak = sab passwords. bcrypt/argon2 use karo.
3. **Hardcoded weak secret** `'secret123'` source code mein: brute-force aur repo leak. Env/secret manager, 32+ random bytes.
4. **No expiry:** `jwt.sign` bina `expiresIn`: token kabhi expire nahi hota.
5. **Sensitive claims:** `{ ...user }` (password, email, internals) token mein; token readable hai.
6. **User enumeration:** `404 No such user` vs `401 Wrong password`.
7. **`jwt.decode` as auth:** signature verify hi nahi hota; koi bhi forged token chalega. `jwt.verify` + `algorithms` pin.
8. **Authorization header parsing:** `Bearer ` prefix strip nahi, missing header par `decode(undefined)`; invalid token par `req.user = null` aur request aage chali jaati hai (koi 401 nahi).
9. **Signup response mein `user` object (hash ke saath) return.**
10. **No rate limiting / lockout on login** (brute force): EX-RATE-05.
11. **Timing:** unknown user par bcrypt compare skip hone se response time alag.

**Corrected module** (verified with a fake `db`).

```js
// ex-jwt-06.js  (corrected module; `db` is any object with async findByEmail(email) and create(data))
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createAuthHandlers({ db, secret, bcryptCost = 12 }) {
  if (!secret || secret.length < 32) throw new Error('JWT secret missing or too short'); // from env, never hardcoded
  const dummyHash = bcrypt.hashSync('not-a-real-password', bcryptCost);

  const signAccessToken = (user) =>
    jwt.sign({ role: user.role }, secret, { algorithm: 'HS256', subject: String(user.id), expiresIn: '15m' });

  return {
    async signup(req, res) {
      const { email, password } = req.body ?? {}; // pick fields explicitly: no mass assignment of role/isAdmin
      if (typeof email !== 'string' || !EMAIL_RE.test(email) || typeof password !== 'string' || password.length < 8) {
        return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Invalid email or password' } });
      }
      if (await db.findByEmail(email.toLowerCase())) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already registered' } });
      }
      const user = await db.create({
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, bcryptCost), // hashed, salted, slow
        role: 'user', // server decides the role
      });
      res.status(201).json({ id: user.id, email: user.email, role: user.role }); // no hash, no token claims dump
    },

    async login(req, res) {
      const { email, password } = req.body ?? {};
      const user = typeof email === 'string' ? await db.findByEmail(email.toLowerCase()) : null;
      const ok = await bcrypt.compare(typeof password === 'string' ? password : '', user?.passwordHash ?? dummyHash);
      if (!user || !ok) {
        return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials' } });
      }
      res.json({ accessToken: signAccessToken(user), expiresIn: 900 });
    },

    authenticate(req, res, next) {
      const match = /^Bearer (.+)$/.exec(req.get('authorization') ?? '');
      if (!match) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing bearer token' } });
      try {
        const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] }); // verify, not decode
        req.user = { id: Number(payload.sub), role: payload.role };
        next();
      } catch {
        res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } });
      }
    },
  };
}
```

**Complexity.** Dominated by bcrypt cost.

**Common mistakes (in the fix).**
- `jwt.verify` ko `algorithms` ke bina chalana.
- Authenticate middleware ko sirf kuch routes par lagana aur baaki bhool jana: default-deny rakho (router-level `use`, public routes allow-list).
- Error message mein "jwt expired" vs "invalid signature" client ko alag batana (useful par minimal information; `expired` ko alag handle karna frontend refresh flow ke liye theek hai).

---

## 10. API testing - solutions

Tests Vitest + Supertest se likhe gaye hain. Code under test Part I mein diya hai; usko problem mein bataye file naam se save karo (`calc.js`, `userService.js`, `app.js`). Tests ko `calc.test.js`, `userService.test.js`, `app.test.js`, `retry.test.js`, `errors.test.js` naam do aur `npx vitest run` chalao.

### EX-TEST-01 - Table-driven unit tests

**Expected approach.** Pure function: koi mock nahi. `it.each` table: har row ek scenario. Categories: happy path, combination (discount + tax), numeric trap (`0.1 * 3`), boundaries (0 / 100 / -1 / 101), invalid input.

**Reference solution** (`calc.test.js`).

```js
import { describe, it, expect } from 'vitest';
import { calculateTotal } from './calc.js';

describe('calculateTotal', () => {
  it.each([
    ['single item', [{ price: 10.5, qty: 2 }], {}, 21],
    ['multiple items', [{ price: 100, qty: 1 }, { price: 40, qty: 5 }], {}, 300],
    ['discount only', [{ price: 200, qty: 1 }], { discountPercent: 10 }, 180],
    ['tax only', [{ price: 100, qty: 1 }], { taxRate: 0.18 }, 118],
    ['discount then tax', [{ price: 10.5, qty: 2 }], { discountPercent: 10, taxRate: 0.18 }, 22.3],
    ['float trap: 0.1 x 3 is 0.3, not 0.30000000000000004', [{ price: 0.1, qty: 3 }], {}, 0.3],
    ['0 percent discount (lower boundary)', [{ price: 50, qty: 1 }], { discountPercent: 0 }, 50],
    ['100 percent discount (upper boundary)', [{ price: 50, qty: 1 }], { discountPercent: 100 }, 0],
  ])('%s', (_name, items, options, expected) => {
    expect(calculateTotal(items, options)).toBe(expected);
  });

  it.each([[-1], [101]])('rejects discountPercent %i', (discountPercent) => {
    expect(() => calculateTotal([{ price: 1, qty: 1 }], { discountPercent })).toThrow(RangeError);
  });

  it.each([[[]], [null], [undefined], ['not-an-array']])('rejects invalid items %j', (items) => {
    expect(() => calculateTotal(items)).toThrow(RangeError);
  });
});
```

**Complexity.** N/A.

**Common mistakes.**
- Sirf happy path test karna.
- `toBe` floats par bina soche (yahan function paise mein round karta hai, isliye exact; generic code mein `toBeCloseTo`).
- Boundary values bhoolna (off-by-one bugs wahin chhupte hain).
- Exceptions test karte waqt function ko direct call karna (`expect(calculateTotal([]))` -- throw test ko hi fail kar deta). `expect(() => ...).toThrow(...)`.
- Implementation ki internal details test karna (behavior test karo).

### EX-TEST-02 - Mocking collaborators

**Expected approach.** Boundaries (DB repo, mailer, logger) ko `vi.fn()` fakes se replace karo; business logic real rakho. `beforeEach` mein fresh fakes (state leak nahi). Har scenario ka assertion do hissa: **result** aur **side effects** (called / not called).

**Reference solution** (`userService.test.js`).

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUserService } from './userService.js';

describe('userService.register', () => {
  let userRepo;
  let mailer;
  let logger;
  let service;

  beforeEach(() => {
    // fresh fakes for every test: no state leaks between tests
    userRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      insert: vi.fn(async (data) => ({ id: 1, ...data })),
    };
    mailer = { sendWelcome: vi.fn().mockResolvedValue(undefined) };
    logger = { warn: vi.fn() };
    service = createUserService({ userRepo, mailer, logger });
  });

  it('inserts a normalized email and sends exactly one welcome mail', async () => {
    const user = await service.register({ email: '  Asha@Example.COM ', name: 'Asha' });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('asha@example.com');
    expect(userRepo.insert).toHaveBeenCalledWith({ email: 'asha@example.com', name: 'Asha' });
    expect(mailer.sendWelcome).toHaveBeenCalledTimes(1);
    expect(mailer.sendWelcome).toHaveBeenCalledWith('asha@example.com', 'Asha');
    expect(user).toEqual({ id: 1, email: 'asha@example.com', name: 'Asha' });
  });

  it('rejects a duplicate email without inserting or mailing', async () => {
    userRepo.findByEmail.mockResolvedValue({ id: 9, email: 'asha@example.com' });

    await expect(service.register({ email: 'asha@example.com', name: 'Asha' })).rejects.toMatchObject({
      code: 'EMAIL_TAKEN',
    });
    expect(userRepo.insert).not.toHaveBeenCalled();
    expect(mailer.sendWelcome).not.toHaveBeenCalled();
  });

  it('still succeeds when the mailer fails, and logs a warning', async () => {
    mailer.sendWelcome.mockRejectedValue(new Error('SMTP down'));

    const user = await service.register({ email: 'a@x.com', name: 'A' });

    expect(user.id).toBe(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][0]).toMatchObject({ err: 'SMTP down', userId: 1 });
  });

  it('propagates a repository failure and never mails', async () => {
    userRepo.insert.mockRejectedValue(new Error('db down'));

    await expect(service.register({ email: 'a@x.com', name: 'A' })).rejects.toThrow('db down');
    expect(mailer.sendWelcome).not.toHaveBeenCalled();
  });
});
```

**Complexity.** N/A.

**Common mistakes.**
- Apni hi service ke internal functions ko mock karna (test kuch prove nahi karta).
- Mock reset na karna: ek test ka `mockResolvedValue` doosre mein leak.
- Sirf "no error thrown" assert karna; side effects verify nahi karna.
- Over-mocking: bohot zyada mocks = implementation coupling. Integration test (EX-TEST-03) se balance.
- `toHaveBeenCalledWith` mein exact object equality: extra fields add hote hi test toot jaata (jaan-bujhkar strict ya `expect.objectContaining`).

### EX-TEST-03 - Integration tests with Supertest

**Expected approach.** `createApp()` factory: Supertest `request(app)` khud ephemeral port par server chalata hai, real port ya `listen` ki zaroorat nahi. Har test ke liye fresh app (`beforeEach`) taaki in-memory state isolated rahe.
HTTP contract assert karo: status, headers, body.

**Reference solution** (`app.test.js`).

```js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('tasks API', () => {
  let app;
  beforeEach(() => {
    app = createApp(); // fresh in-memory state per test: tests cannot affect each other
  });

  it('POST /tasks creates a task: 201, Location header, body', async () => {
    const res = await request(app).post('/tasks').send({ title: '  Write tests  ' });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/tasks/1');
    expect(res.body).toEqual({ id: 1, title: 'Write tests', done: false });
  });

  it('the created task appears in GET /tasks', async () => {
    await request(app).post('/tasks').send({ title: 'one' });
    await request(app).post('/tasks').send({ title: 'two' });

    const res = await request(app).get('/tasks');

    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['one', 'two']);
  });

  it('GET /tasks/:id returns the task', async () => {
    await request(app).post('/tasks').send({ title: 'one' });

    const res = await request(app).get('/tasks/1');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('one');
  });

  it('GET /tasks/:id for an unknown id is 404', async () => {
    const res = await request(app).get('/tasks/999');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it.each([[{ title: '   ' }], [{}], [{ title: 123 }]])('blank or invalid title %j is 422', async (body) => {
    const res = await request(app).post('/tasks').send(body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('malformed JSON is 400', async () => {
    const res = await request(app).post('/tasks').set('Content-Type', 'application/json').send('{bad');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
```

**Complexity.** N/A.

**Common mistakes.**
- App ko module-level `listen()` karwa dena: tests mein port conflicts, open handles.
- Tests ke beech shared state (order-dependent tests).
- Sirf status code assert karna.
- `await` bhoolna: test pehle hi pass dikhta hai aur assertion kabhi chalta hi nahi.
- Real DB/network par depend: slow, flaky. Integration test mein bhi test database ya in-memory fake.

### EX-TEST-04 - Negative tests: authn, authz, validation

**Expected approach.** Matrix soch: (identity) x (permission) x (input). Order of checks bhi test karo (user + invalid body -> 403, validation se pehle authorization). Prototype-name key (`constructor`) ek classic trap hai: plain-object lookup isse match kar leta
(code mein `Map` hai, isliye pass hota hai; test regression guard ban jaata hai). Boundaries ke dono taraf (2/3, 200/201).

**Reference solution** (`app.test.js`).

```js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('POST /admin/announcements - negative matrix', () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  const post = (key, body) => {
    const req = request(app).post('/admin/announcements');
    if (key !== undefined) req.set('x-api-key', key);
    return req.send(body);
  };

  describe('authentication (401)', () => {
    it.each([
      ['no key', undefined],
      ['unknown key', 'nope'],
      ['prototype property name', 'constructor'], // a plain-object lookup would wrongly match this
      ['empty key', ''],
    ])('%s', async (_label, key) => {
      const res = await post(key, { message: 'hello' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('authorization (403)', () => {
    it('a normal user cannot post announcements', async () => {
      const res = await post('key-user', { message: 'hello' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('authorization is checked before validation (user + invalid body is still 403)', async () => {
      const res = await post('key-user', {});
      expect(res.status).toBe(403);
    });
  });

  describe('validation (422) as admin', () => {
    it.each([
      ['missing body', undefined],
      ['empty object', {}],
      ['non-string message', { message: 12345 }],
      ['too short (2 chars)', { message: 'ab' }],
      ['too long (201 chars)', { message: 'x'.repeat(201) }],
    ])('%s', async (_label, body) => {
      const res = await post('key-admin', body);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('valid boundaries (201)', () => {
    it.each([[3], [200]])('message length %i is accepted', async (len) => {
      const res = await post('key-admin', { message: 'x'.repeat(len) });
      expect(res.status).toBe(201);
      expect(res.body.message).toHaveLength(len);
    });
  });
});
```

**Complexity.** N/A.

**Common mistakes.**
- Negative tests na likhna: production bugs aksar invalid input par aate hain.
- 401 vs 403 ko ek jaisa assert karna.
- Error body ka `code` assert na karna (status 400 do alag reasons se ho sakta hai).
- Test order par depend karna.
- Auth tests ko mock se bypass karke real middleware kabhi test na karna.

### EX-TEST-05 - Fake timers

**Expected approach.** `vi.useFakeTimers()` + `await vi.advanceTimersByTimeAsync(ms)`: time aage badhta hai aur microtasks flush hote hain (async code ke liye zaroori). Delay boundaries (99 ms par ab tak 1 call, 100 par 2) exact verify karo.
Rejection test mein **handler pehle attach karo** (`const assertion = expect(p).rejects...`), phir time advance: nahi to timer fire hone par promise reject hota hai jab koi handler nahi hota (unhandled rejection warning).

**Reference solution** (`retry.test.js`, imports `retry` from `ex-async-03.js`).

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry } from './ex-async-03.js';

describe('retry with fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers(); // never leak fake timers into other tests
  });

  it('succeeds on the 3rd attempt after waiting 100 ms and then 200 ms', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const promise = retry(fn, { baseDelayMs: 100 });

    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1); // first try is immediate
    await vi.advanceTimersByTimeAsync(99);
    expect(fn).toHaveBeenCalledTimes(1); // still waiting the first 100 ms
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(199);
    expect(fn).toHaveBeenCalledTimes(2); // second delay is 200 ms
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(3);

    await expect(promise).resolves.toBe('ok');
  });

  it('throws the LAST error after all attempts fail', async () => {
    const fn = vi.fn(async (attempt) => {
      throw new Error(`err${attempt}`);
    });

    const promise = retry(fn, { retries: 2, baseDelayMs: 10 });
    const assertion = expect(promise).rejects.toThrow('err3'); // attach the handler BEFORE advancing time
    await vi.runAllTimersAsync();

    await assertion;
    expect(fn).toHaveBeenCalledTimes(3); // 1 try + 2 retries
  });

  it('stops immediately when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('validation failed'));

    await expect(retry(fn, { shouldRetry: () => false })).rejects.toThrow('validation failed');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('caps the delay at maxDelayMs', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    const promise = retry(fn, { retries: 3, baseDelayMs: 1000, factor: 10, maxDelayMs: 2500 });
    const assertion = expect(promise).rejects.toThrow('x');

    await vi.advanceTimersByTimeAsync(1000); // delay 1: 1000
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2499); // delay 2 would be 10000 -> capped to 2500
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(2500); // delay 3: capped again
    expect(fn).toHaveBeenCalledTimes(4);

    await assertion;
  });
});
```

**Complexity.** N/A.

**Common mistakes.**
- Real `setTimeout` par wait karna (slow, flaky tests).
- `vi.useRealTimers()` na karna (doosre tests mein fake timers leak).
- Sync `vi.advanceTimersByTime` async code ke saath: promise callbacks run nahi hote.
- `Date.now()` bhi fake hota hai: code jo `Date.now()` par depend kare use `vi.setSystemTime` se control karo.
- Rejection ko `await` karke baad mein assert karna jab promise pehle hi reject ho chuka ho.

### EX-TEST-06 - Table-driven test of the error contract

**Expected approach.** Ek app jisme har error type ke liye route hai. `it.each` se `(path, status, code)` table. Security assertions alag: 500 body mein internal text nahi, logger ko full error **ek baar** mila. 4xx `warn` par, 5xx `error` par.
Logger inject kiya gaya (`vi.fn()`), isliye test console noise ke bina log behaviour verify karta hai.

**Reference solution** (`errors.test.js`, needs `ex-err-02.js` and `ex-mw-05.js`).

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { NotFoundError, ValidationError, ConflictError } from './ex-err-02.js';
import { errorHandler, notFound } from './ex-mw-05.js';

describe('error-handling contract', () => {
  let app;
  let logger;

  beforeEach(() => {
    logger = { error: vi.fn(), warn: vi.fn() };
    app = express();
    app.use(express.json());
    app.get('/not-found', () => {
      throw new NotFoundError('Order 5 not found');
    });
    app.get('/invalid', () => {
      throw new ValidationError('Invalid body', [{ field: 'title', message: 'is required' }]);
    });
    app.get('/conflict', () => {
      throw new ConflictError('Already exists');
    });
    app.get('/crash', () => {
      throw new Error('secret db host: db-internal-7');
    });
    app.get('/async-crash', async () => {
      throw new Error('secret async failure');
    });
    app.post('/echo', (req, res) => res.json(req.body));
    app.use(notFound);
    app.use(errorHandler({ logger }));
  });

  it.each([
    ['/not-found', 404, 'NOT_FOUND'],
    ['/invalid', 422, 'VALIDATION_FAILED'],
    ['/conflict', 409, 'CONFLICT'],
    ['/crash', 500, 'INTERNAL'],
    ['/async-crash', 500, 'INTERNAL'],
    ['/no-such-route', 404, 'NOT_FOUND'],
  ])('GET %s -> %i %s', async (path, status, code) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  });

  it('includes validation details', async () => {
    const res = await request(app).get('/invalid');
    expect(res.body.error.details).toEqual([{ field: 'title', message: 'is required' }]);
  });

  it('never leaks internals on a 500, but logs the full error exactly once', async () => {
    const res = await request(app).get('/crash');

    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(res.body.error.message).toBe('Internal server error');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0].err.message).toContain('secret db host');
  });

  it('logs 4xx at warn level, not error', async () => {
    await request(app).get('/not-found');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('malformed JSON is a 400, not a 500', async () => {
    const res = await request(app).post('/echo').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
```

**Complexity.** N/A.

**Common mistakes.**
- Sirf happy path routes test karna; error handler kabhi exercise nahi hota.
- 500 response mein leak check na karna (security regression).
- Async handler error test na karna (Express 4 vs 5 behaviour alag).
- Logger ko mock na karke test output mein noisy stack traces.
- Express 4 mein yeh test tab tak fail/hang karega jab tak async wrapper na ho (Express 5 mein pass).

---

## 11. Debugging slow or failing APIs - solutions

Har solution: **Diagnosis -> How to confirm -> Fix -> Common mistakes.** Interview mein bhi yahi order bolo: symptom, hypothesis, evidence, smallest fix, prevention.

### EX-DEBUG-01 - Hanging requests and "headers already sent"

**Diagnosis.**
1. `GET /users/999`: `if (!user) res.status(404).json(...)` ke baad `return` nahi hai, isliye code aage chalta hai aur `user.id` null par `TypeError`. Response pehle hi bhej chuke the (client ko 404 mila), isliye bug dikhta nahi lekin logs mein error aata hai
   (kabhi `ERR_HTTP_HEADERS_SENT`).
2. `POST /orders`: promise chain mein `.catch` nahi aur handler promise return nahi karta. `createOrder` fail hone par rejection **unhandled** hai: request kabhi respond nahi hoti (client timeout tak hang) aur Node 15+ mein unhandled rejection process crash kar deta hai.

**How to confirm.** Local par `curl -i localhost:3000/users/999` aur failing `POST` bhejo; log mein `TypeError` / `UnhandledPromiseRejection`; `node --trace-warnings`; pm2 restart count.

**Fix.**

```js
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); // return!
  res.json({ id: user.id, name: user.name });
});

app.post('/orders', async (req, res) => {          // Express 5: a rejected promise reaches the error middleware
  const order = await createOrder(req.body);
  res.status(201).json(order);
});
// Express 4: wrap with (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
```

**Common mistakes.** `res.send` ke baad `return` bhoolna; `.then()` chain ko return/await na karna; `try/catch` mein error swallow karke response na bhejna (hang); unhandled rejection ko sirf `process.on('unhandledRejection')` se chhupa dena.

### EX-DEBUG-02 - Memory grows until OOM

**Diagnosis.** Do leaks.
1. `priceCache` unbounded hai aur key user-controlled (`currency`, `promo` query params): attacker ya normal traffic unlimited unique keys bana sakta hai. Entries kabhi evict nahi hoti (`delete` sirf event par, aur woh bhi specific key ke liye).
2. Har request par `bus.on('price-updated', onUpdate)`: listener kabhi `off` nahi hota. Har listener ek closure hai jo `req`, `res`, `key` capture karta hai, isliye poori request objects garbage collect nahi hote. `MaxListenersExceededWarning` iska sign hai.

**How to confirm.** `process.memoryUsage().heapUsed` ko time ke saath plot karo (sawtooth nahi, steady climb = leak). Heap snapshots: **3-snapshot technique** (baseline, load, load again; compare "Objects allocated between snapshot 1 and 2 that are still alive in 3"). Chrome DevTools / `node --inspect` /
`v8.writeHeapSnapshot()`. Retainers tree mein `EventEmitter._events` aur `priceCache` dikhenge.

**Fix.**

```js
import { EventEmitter } from 'node:events';
const bus = new EventEmitter();

const CURRENCIES = new Set(['INR', 'USD', 'EUR']);
const MAX_ENTRIES = 5000;
const cache = new Map(); // key -> { value, expiresAt }   (Map insertion order = simple LRU)

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) { cache.delete(key); return undefined; }
  cache.delete(key); cache.set(key, hit); // mark as recently used
  return hit.value;
}
function cacheSet(key, value) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value); // evict least recently used
  cache.set(key, { value, expiresAt: Date.now() + 60_000 });
}

// ONE listener for the whole process, registered once at startup
bus.on('price-updated', (sku) => {
  for (const key of cache.keys()) if (key.startsWith(`${sku}:`)) cache.delete(key);
});

app.get('/price/:sku', async (req, res) => {
  const currency = CURRENCIES.has(req.query.currency) ? req.query.currency : 'INR'; // normalise user input
  const key = `${req.params.sku}:${currency}`;
  let price = cacheGet(key);
  if (price === undefined) {
    price = await fetchPrice(req.params.sku, { currency });
    cacheSet(key, price);
  }
  res.json(price);
});
```

**Common mistakes.** `emitter.setMaxListeners(0)` karke warning chhupana (leak waisa hi); cache bina TTL/size limit ke; request-scoped objects ko global structures mein store karna; `WeakMap` se sab solve ho jayega sochna (keys objects hone chahiye aur use case match kare);
restart ko "fix" samajhna. Production cache ke liye `lru-cache` ya Redis (week 6 / day 4).

### EX-DEBUG-03 - One endpoint makes the whole server slow

**Diagnosis.** Node mein JavaScript ek thread par chalta hai; jo kaam synchronous aur lamba hai woh **event loop block** karta hai: sab requests (`/health` tak) wait karti hain.
1. `pbkdf2Sync` (600k iterations) har signup par CPU thread hold karta hai.
2. `readFileSync` + `JSON.parse` 300 MB: file read blocking, parse CPU-bound, aur ~1 GB+ memory.
3. `/^(\w+\s?)+$/` mein **catastrophic backtracking** (ReDoS): nested quantifiers par input `aaaa...!` exponential time leta hai.

**How to confirm.** `perf_hooks.monitorEventLoopDelay()` ya `clinic doctor` (event loop delay spike), `node --cpu-prof` / `clinic flame` flame graph mein `pbkdf2Sync` / regex exec / `JSON.parse` dikhega; `/health` ki latency kaam ke dauran ping karke. CPU 100% single core = CPU-bound block.

**Fix.**

```js
import { pbkdf2, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { createReadStream } from 'node:fs';
import { Worker } from 'node:worker_threads';
const pbkdf2Async = promisify(pbkdf2);

app.post('/signup', async (req, res) => {
  const salt = randomBytes(16);
  const hash = await pbkdf2Async(req.body.password, salt, 600_000, 64, 'sha512'); // runs on the libuv thread pool
  await saveUser(req.body.email, salt, hash);
  res.status(201).end();
});

// /report: stream/process in a worker thread (or precompute offline); never JSON.parse 300 MB on the main thread
app.get('/report', (req, res, next) => {
  const worker = new Worker(new URL('./report-worker.js', import.meta.url));
  worker.once('message', (summary) => res.json(summary));
  worker.once('error', next);
});

// /search: bound the input and use a linear-time pattern
app.get('/search', (req, res) => {
  const q = String(req.query.q ?? '');
  if (q.length > 100) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'q too long' } });
  res.json({ ok: /^[\w\s]+$/.test(q) }); // no nested quantifiers: linear time
});
```

(For passwords prefer `bcrypt`/`argon2` libraries; the point here is async + thread pool. `report-worker.js` would read and summarize the file and `parentPort.postMessage(summary)`.)

**Common mistakes.** `async` keyword lagana aur sochna sync kaam non-blocking ho gaya (`async function` sync CPU work ko thread se hata nahi deta); `Promise.resolve().then(heavy)` (microtask phir bhi main thread par);
regex ko user input par bina length limit chalana; thread pool size (`UV_THREADPOOL_SIZE`, default 4) ko ignore karna: 4 se zyada concurrent pbkdf2 queue mein lagte hain; har request par naya Worker (startup cost: pool use karo).

### EX-DEBUG-04 - The N+1 query

**Diagnosis.** 1 query orders ke liye, phir har order ke liye 2 queries (`order_items`, `customers`): total `1 + 2N`. Har query network round trip leti hai, isliye latency N ke saath linearly badhti hai (80 ms -> 6 s). DB CPU kam par connections/QPS zyada.
`SELECT *` aur `customers` lookup bhi duplicate (same customer baar-baar).

**How to confirm.** MySQL slow log / `performance_schema` mein same query pattern hazaron baar; ORM/query logging se query count per request; APM trace mein waterfall of tiny queries; `EXPLAIN` se per-query index check.

**Fix.** Fixed number of queries (N se independent).

```js
app.get('/orders', async (req, res) => {
  const [orders] = await pool.query(
    `SELECT o.id, o.total, o.status, o.created_at, c.name AS customer_name
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
      LIMIT 100`,
    [req.user.id],
  );
  const ids = orders.map((o) => o.id);
  const byOrder = new Map(ids.map((id) => [id, []]));
  if (ids.length > 0) {
    const [items] = await pool.query(
      'SELECT order_id, product_id, qty, unit_price FROM order_items WHERE order_id IN (?)',
      [ids],
    );
    for (const item of items) byOrder.get(item.order_id).push(item);
  }
  res.json(orders.map((o) => ({ ...o, items: byOrder.get(o.id) })));
});
```

Total: 2 queries regardless of N. Verify `order_items(order_id)` aur `orders(user_id)` par index (`EXPLAIN` mein `type: ref`, not `ALL`).

**Common mistakes.** Ek giant JOIN jo rows multiply kare (orders x items) aur app mein regroup mushkil; `LIMIT` na lagana (pagination week 3 / day 5, 4 / day 6); `IN (?)` ke saath bohot badi list (chunk karo); `Promise.all(orders.map(query))` se N+1 ko parallel kar dena: round trips parallel hue par connection pool khatam;
`SELECT *`.

### EX-DEBUG-05 - API freezes after a few failed transfers

**Diagnosis.** `debit` throw karta hai -> `catch` sirf `next(err)` karta hai: **na rollback, na release**. Connection pool mein wapas nahi aata aur uska transaction open reh jaata hai (row locks held). `connectionLimit: 10` hai, isliye 10 failures ke baad pool khali: har naya `getConnection()` queue mein wait karta hai (`queueLimit` 0 = unbounded).
Isliye saare endpoints hang. Locks held hone se baaki transactions bhi wait.

**How to confirm.** `SHOW PROCESSLIST` mein 10 connections `Sleep` with long `Time` aur open transactions (`SELECT * FROM information_schema.innodb_trx`); app metrics mein pool `free = 0`, waiting requests growing; logs mein errors ke turant baad koi activity nahi.

**Fix.**

```js
app.post('/transfer', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await debit(conn, req.body.from, req.body.amount);
    await credit(conn, req.body.to, req.body.amount);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch { /* connection may be broken */ }
    throw err; // Express 5 forwards to the error middleware
  } finally {
    conn.release(); // runs on success AND failure
  }
});
```

Better: use the `withTransaction` helper (EX-TXN-04) so nobody can forget. Hardening: `mysql2` pool options `queueLimit` and `connectTimeout`; DB side `innodb_lock_wait_timeout`, `wait_timeout`; alert on pool saturation.

**Common mistakes.** `release()` sirf success path par; `rollback` ke bina release (connection reuse hone par purana transaction state aage ke queries par asar karta hai); pool size badha dena (leak ko sirf der se dikhata hai); `connection.end()` aur `release()` ko confuse karna (`end` connection band karta hai, `release` pool ko wapas deta hai).

### EX-DEBUG-06 - Users see another user's data

**Diagnosis.** `currentUser` module-level (process-wide) variable hai. Node ek process mein saari requests handle karta hai. Request A middleware mein `currentUser = A` set karti hai, `await loadPrefs(...)` par ruk jaati hai, tab Request B middleware mein `currentUser = B` overwrite kar deti hai; A resume hoti hai aur
B ka user dekhti hai. Ek-ek request par ya single tester ke saath kabhi reproduce nahi hota (race tabhi hoti hai jab requests overlap hon).

**How to confirm.** Load test (`autocannon`) do alag users ke saath: response mein user id mismatch. Code review: request-specific data global/module state mein.

**Fix.**

```js
app.use(async (req, res, next) => {
  req.user = await loadUser(req.get('x-user-id')); // per-request state lives ON the request
  next();
});

app.get('/me', async (req, res) => {
  const prefs = await loadPrefs(req.user.id);
  res.json({ user: req.user, prefs });
});
```

Deep call chains mein `req` pass karna mushkil ho to `AsyncLocalStorage` (`node:async_hooks`) per-request context deta hai.

**Common mistakes.** Singleton service mein request data store karna; "single threaded hai to safe hai" sochna (await ke beech interleaving hoti hai); caches mein user-specific data bina user id key ke; `let`/`var` at module top level for request flow.

### EX-DEBUG-07 - Random process exits

**Diagnosis.**
1. `orders.on('placed', async ...)`: EventEmitter listener ki returned promise ko emitter ignore karta hai. SMTP down hone par `sendReceipt` reject hota hai aur koi handler nahi: **unhandled rejection**; Node 15+ default mein process terminate kar deta hai (pm2 restart). Outage ke dauran hi crash isiliye.
2. `ids.forEach(async ...)` (EX-ERR-01): `nightlyCleanup` kaam khatam hone se pehle "cleanup finished" print karta hai, errors unhandled, aur process jaldi exit ho jaye to half archive.

**How to confirm.** pm2 logs mein `ERR_UNHANDLED_REJECTION` / stack; `process.on('unhandledRejection', (r) => log(r))` temporarily; SMTP outage ki timing se correlation; Node version check (Node 14 mein sirf warning, 15+ mein crash).

**Fix.**

```js
orders.on('placed', async (order) => {
  try {
    await sendReceipt(order);
    await updateAnalytics(order);
  } catch (err) {
    logger.error({ err, orderId: order.id }, 'post-order tasks failed'); // handled: process survives
    // production: enqueue a retryable job instead of just logging (week 6 / day 5)
  }
});

async function nightlyCleanup(ids) {
  const results = await Promise.allSettled(ids.map((id) => archive(id)));
  const failed = results.filter((r) => r.status === 'rejected');
  logger.info({ total: ids.length, failed: failed.length }, 'cleanup finished'); // prints AFTER the work
  return failed;
}
```

Last-resort safety net (not a fix): `process.on('unhandledRejection', (reason) => { logger.error({ reason }, 'unhandled rejection'); })` plus an alert; for `uncaughtException` log and exit (state may be corrupt) and let the supervisor restart.

**Common mistakes.** Sirf global `unhandledRejection` handler lagake sab theek maan lena; side-effect work (email) ko request ke critical path mein await karna (user ko order response slow) ya bina error handling ke fire-and-forget karna; `emitter.on` ke async listener mein `try/catch` na lagana;
`forEach(async)`.

### EX-DEBUG-08 - Login works in Postman, fails in the browser

**Diagnosis (three separate bugs).**
1. Express 5 mein `req.body` **undefined** hota hai agar body parser mount nahi kiya (Express 4 mein `{}` tha). `express.json()` missing hai, isliye destructuring `TypeError` -> 500. Postman mein bhi yahi dikhta hai.
2. Browser cross-origin `POST` with `Content-Type: application/json` se pehle **preflight `OPTIONS`** bhejta hai. `cors()` routes ke **baad** mount hai, isliye `OPTIONS /login` par Express ka default response (Allow header ya 404) chala jaata hai aur us mein CORS headers hote hi nahi: "preflight doesn't pass". Middleware order matter karta hai.
3. `credentials: 'include'` ke saath CORS rule: `Access-Control-Allow-Origin` wildcard `*` nahi ho sakta (specific origin chahiye) aur `Access-Control-Allow-Credentials: true`. Agar frontend aur API alag sites par hain (for example `app.com` aur `api.other.com`) to cookie cross-site hai: `SameSite=None; Secure` (HTTPS) chahiye warna browser cookie store/send nahi karta. Agar dono ek hi site ke subdomains hain (`app.example.com`, `api.example.com`) to request same-site hoti hai aur `SameSite=Lax` bhi chal jaata hai (cookie phir bhi CORS credentials rules se guzarti hai).

**How to confirm.** Browser DevTools Network tab: `OPTIONS` request ka response headers; Application tab mein cookie ke blocked reason (warning icon); `curl -i -X OPTIONS -H "Origin: https://app.example.com" -H "Access-Control-Request-Method: POST" ...`.

**Fix.**

```js
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'https://app.example.com',   // exact origin (or an allow-list function), NOT '*' with credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));                                    // BEFORE the routes: it answers OPTIONS preflights
app.use(express.json());                // Express 5: req.body is undefined without a parser

app.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const token = authenticate(email, password);
  res.cookie('sid', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
  res.json({ ok: true });
});
```

**Common mistakes.** CORS ko "security" samajhna: yeh sirf browser enforce karta hai (curl/Postman par asar nahi); `origin: '*'` aur `credentials` saath; request ke `Origin` header ko blindly reflect karna (har site allowed); `res.cookie` mein `httpOnly`/`secure` bhoolna;
CSRF ko ignore karna jab cookies use ho rahi ho (`SameSite=None` ke saath CSRF token/double-submit zaroori, week 5 / day 5).

---

## 12. Rate limiter - solutions

Ladder ka logic: har rung pichhle ki kamzori fix karta hai. Sab in-memory limiters ek hi API (`allow(key)`) rakhte hain, isliye middleware kisi bhi limiter ke saath chalta hai.

| Rung | Algorithm | Strength | Weakness |
|------|-----------|----------|----------|
| 01 | Fixed window counter | Simplest, O(1) | 2x burst at window boundary |
| 02 | Sliding window log | Exact | O(limit) memory per key |
| 03 | Sliding window counter | O(1) memory, close to exact | Approximation |
| 04 | Token bucket | Allows controlled bursts, O(1) | Two parameters to tune |
| 05 | Express middleware + headers | Real API behaviour | Per-instance only |
| 06 | Eviction, per-route policy | Safe memory | Still per-instance |
| 07 | Redis + Lua | Shared across instances, atomic | Network hop, Redis availability |

### EX-RATE-01 - Fixed window counter

**Expected approach.** `windowId = floor(now / windowMs)`; per key `{ windowId, count }`. Naya window id -> count reset. `count >= limit` -> deny with `retryAfterMs = windowEnd - now`.

**Boundary burst.** Window 0 ke aakhri 100 ms mein 3 requests (t = 900) aur window 1 ke pehle 100 ms mein 3 (t = 1100): 6 requests 200 ms mein, limit 3 per second ke bawajood. Worst case 2x limit.

**Reference solution.**

```js
// ex-rate-01.js
export function createFixedWindowLimiter({ limit, windowMs, now = () => Date.now() }) {
  const state = new Map(); // key -> { windowId, count }
  return {
    allow(key) {
      const t = now();
      const windowId = Math.floor(t / windowMs); // windows are aligned to the clock
      let s = state.get(key);
      if (!s || s.windowId !== windowId) {
        s = { windowId, count: 0 }; // new window: counter resets
        state.set(key, s);
      }
      const resetMs = (windowId + 1) * windowMs - t;
      if (s.count >= limit) return { allowed: false, remaining: 0, retryAfterMs: resetMs, resetMs };
      s.count++;
      return { allowed: true, remaining: limit - s.count, retryAfterMs: 0, resetMs };
    },
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let t = 0;
  const lim = createFixedWindowLimiter({ limit: 3, windowMs: 1000, now: () => t });
  for (const at of [0, 100, 200, 300, 1000]) {
    t = at;
    console.log(at, lim.allow('k'));
  }
  // boundary burst: 6 requests in 200 ms are all allowed
  const burst = createFixedWindowLimiter({ limit: 3, windowMs: 1000, now: () => t });
  let allowed = 0;
  for (const at of [900, 900, 900, 1100, 1100, 1100]) {
    t = at;
    if (burst.allow('k').allowed) allowed++;
  }
  console.log('allowed in 200 ms:', allowed); // 6
}
```

**Complexity.** O(1) time, O(keys) space.

**Common mistakes.** Window ko "pehli request se" shuru karna aur clock-aligned nahi rakhna (alag semantics, theek hai par document karo); count ko denied requests par bhi badhana (client khud ko penalise karta rehta); `Date.now()` hardcode (test impossible);
per-key state alag na rakhna (global counter).

### EX-RATE-02 - Sliding window log

**Expected approach.** Har key ke liye accepted timestamps ki sorted list. Har request par `<= now - windowMs` wale hatao; baaki `< limit` to accept aur timestamp push. Deny par `retryAfter = oldest + windowMs - now`. Denied requests log mein nahi jaati.

**Reference solution.**

```js
// ex-rate-02.js
export function createSlidingLogLimiter({ limit, windowMs, now = () => Date.now() }) {
  const logs = new Map(); // key -> ascending array of accepted timestamps
  return {
    allow(key) {
      const t = now();
      const log = logs.get(key) ?? [];
      logs.set(key, log);
      while (log.length > 0 && log[0] <= t - windowMs) log.shift(); // drop expired timestamps
      if (log.length >= limit) {
        const retryAfterMs = log[0] + windowMs - t; // when the oldest one expires
        return { allowed: false, remaining: 0, retryAfterMs, resetMs: retryAfterMs };
      }
      log.push(t); // only ACCEPTED requests are recorded
      return {
        allowed: true,
        remaining: limit - log.length,
        retryAfterMs: 0,
        resetMs: log[0] + windowMs - t,
      };
    },
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let t = 0;
  const lim = createSlidingLogLimiter({ limit: 3, windowMs: 1000, now: () => t });
  for (const at of [0, 100, 200, 300, 1000]) {
    t = at;
    console.log(at, lim.allow('k'));
  }
  const burst = createSlidingLogLimiter({ limit: 3, windowMs: 1000, now: () => t });
  let allowed = 0;
  for (const at of [900, 900, 900, 1100, 1100, 1100]) {
    t = at;
    if (burst.allow('k').allowed) allowed++;
  }
  console.log('allowed in 200 ms:', allowed); // 3
}
```

**Complexity.** Time amortized O(1) (each timestamp enters and leaves once; `shift()` on large arrays is O(n) in V8, use an index/deque if limit is large). Space O(limit) per key.

**Common mistakes.** Denied requests ko log karna (limit kabhi recover nahi karti); `<` vs `<=` boundary mismatch (off-by-one: window `(now - windowMs, now]`); poori history rakhna (memory leak);
limit 10,000 par 10,000 timestamps per user (isliye rung 03).

### EX-RATE-03 - Sliding window counter

**Expected approach.** Do counters: `prev` aur `curr` window. Estimate `= prev * (1 - elapsedFraction) + curr`: pichhle window ka weighted hissa jo abhi bhi sliding window mein hai. `estimate + 1 > limit` -> deny. 2+ window ke gap par `prev = 0`.
`retryAfter` solve karna: kab estimate itna gir jaaye ki ek aur request fit ho.

**Reference solution.**

```js
// ex-rate-03.js
export function createSlidingCounterLimiter({ limit, windowMs, now = () => Date.now() }) {
  const state = new Map(); // key -> { windowId, prev, curr }

  // earliest wait (ms) after which one more request fits, assuming no other requests arrive
  function waitMs(prev, curr, elapsed) {
    if (prev > 0) {
      const need = 1 - (limit - 1 - curr) / prev; // fraction of window at which estimate + 1 <= limit
      if (need <= 1) return Math.max(0, Math.ceil((need - elapsed) * windowMs));
    }
    const needNext = curr > 0 ? Math.max(0, 1 - (limit - 1) / curr) : 0; // next window: prev becomes curr
    return Math.ceil((1 - elapsed + needNext) * windowMs);
  }

  return {
    allow(key) {
      const t = now();
      const windowId = Math.floor(t / windowMs);
      let s = state.get(key) ?? { windowId, prev: 0, curr: 0 };
      if (s.windowId !== windowId) {
        // a gap of 2+ windows means the previous window had no traffic
        s = { windowId, prev: s.windowId === windowId - 1 ? s.curr : 0, curr: 0 };
      }
      state.set(key, s);

      const elapsed = (t % windowMs) / windowMs; // 0..1 into the current window
      const estimated = s.prev * (1 - elapsed) + s.curr;
      const resetMs = Math.ceil((1 - elapsed) * windowMs);
      if (estimated + 1 > limit) {
        return { allowed: false, remaining: 0, retryAfterMs: waitMs(s.prev, s.curr, elapsed), resetMs };
      }
      s.curr++;
      return {
        allowed: true,
        remaining: Math.max(0, Math.floor(limit - (estimated + 1))),
        retryAfterMs: 0,
        resetMs,
      };
    },
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let t = 0;
  const lim = createSlidingCounterLimiter({ limit: 10, windowMs: 1000, now: () => t });
  for (let i = 0; i < 8; i++) lim.allow('k'); // 8 requests in window 0
  t = 1250; // 25% into window 1: estimate = 8 * 0.75 = 6
  for (let i = 0; i < 5; i++) console.log(lim.allow('k'));
  // first 4 allowed (estimate reaches 10), 5th denied with retryAfterMs 125
}
```

**Complexity.** O(1) time, O(1) space per key.

**Common mistakes.** Gap handling bhoolna (window 0 ka count window 5 mein carry hona); estimate ko integer round karna jaldi; yeh dhyan na rakhna ki yeh **approximation** hai (traffic window mein uniform maana jaata hai); `retryAfter` ko seedha next window start rakhna (agar prev bada hai to us waqt bhi deny hoga).

### EX-RATE-04 - Token bucket

**Expected approach.** Bucket mein `capacity` tak tokens; `refillPerSec` ki rate se refill. Timer nahi: **lazy refill** (`tokens = min(capacity, tokens + elapsedSec * rate)`) har request par. Request cost tokens consume karti hai. Burst `capacity` tak, long-run rate `refillPerSec`.
Denied par `retryAfter = (cost - tokens) / rate`.

**Reference solution.**

```js
// ex-rate-04.js
export function createTokenBucketLimiter({ capacity, refillPerSec, now = () => Date.now() }) {
  const buckets = new Map(); // key -> { tokens, last }
  return {
    allow(key, cost = 1) {
      if (cost > capacity) throw new RangeError('cost exceeds bucket capacity: it can never be allowed');
      const t = now();
      let b = buckets.get(key);
      if (!b) {
        b = { tokens: capacity, last: t }; // a new client starts with a full bucket
        buckets.set(key, b);
      } else {
        b.tokens = Math.min(capacity, b.tokens + ((t - b.last) / 1000) * refillPerSec); // lazy refill
        b.last = t;
      }
      if (b.tokens >= cost) {
        b.tokens -= cost;
        return {
          allowed: true,
          remaining: Math.floor(b.tokens),
          retryAfterMs: 0,
          resetMs: Math.ceil(((capacity - b.tokens) / refillPerSec) * 1000),
        };
      }
      return {
        allowed: false,
        remaining: Math.floor(b.tokens),
        retryAfterMs: Math.ceil(((cost - b.tokens) / refillPerSec) * 1000),
        resetMs: Math.ceil(((capacity - b.tokens) / refillPerSec) * 1000),
      };
    },
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let t = 0;
  const lim = createTokenBucketLimiter({ capacity: 5, refillPerSec: 1, now: () => t });
  for (let i = 0; i < 5; i++) lim.allow('k'); // burst of 5 at t = 0
  console.log(lim.allow('k')); // denied, retryAfterMs 1000
  t = 1000;
  console.log(lim.allow('k')); // allowed (1 token refilled)
  console.log(lim.allow('k', 3)); // denied, retryAfterMs 3000
}
```

**Complexity.** O(1) time and space per key.

**Common mistakes.** `setInterval` se har bucket refill karna (scale nahi hota); `capacity` se upar tokens jama hona; `last` timestamp update na karna (double refill); integer division se rate lose karna (`refillPerSec = 0.5` jaise fractional rates ke liye floats);
`cost > capacity` ko silently deny karna (retryAfter infinite): programmer error, throw karo.

**Which to choose?** Token bucket most APIs ke liye default (bursty traffic ko tolerate, steady rate enforce). Sliding window jab "exactly N per rolling minute" chahiye. Fixed window sirf sasti, rough protection ke liye.

### EX-RATE-05 - Express middleware

**Expected approach.** Limiter ko middleware mein wrap: `keyFn(req)` (default IP; authenticated par `user:<id>`), `skip` for `/health`. Allow par `RateLimit-*` headers; deny par `429` + `Retry-After` (seconds, `ceil`) + consistent JSON error.
Alag limiters: `/login` strict (brute force), global loose.

**`trust proxy`.** Load balancer ke peeche `req.ip` proxy ka IP hota hai, isliye sab clients ek bucket share karenge (ya limiter ko spoof kiya ja sakta hai). `app.set('trust proxy', n)` n = trusted hops ki sankhya; `X-Forwarded-For` khud parse mat karo (client spoof kar sakta hai).

**Reference solution** (needs `ex-rate-04.js`).

```js
// ex-rate-05.js
import express from 'express';
import { createTokenBucketLimiter } from './ex-rate-04.js';

export function rateLimit({ limiter, limit, keyFn = (req) => `ip:${req.ip}`, skip = () => false }) {
  return (req, res, next) => {
    if (skip(req)) return next();
    const result = limiter.allow(keyFn(req));
    res.set({
      'RateLimit-Limit': String(limit),
      'RateLimit-Remaining': String(result.remaining),
      'RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
    });
    if (result.allowed) return next();
    res.set('Retry-After', String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
  };
}

// authenticated routes: limit per user, anonymous: per IP
export const keyByUserOrIp = (req) => (req.user ? `user:${req.user.id}` : `ip:${req.ip}`);

// usage
export function createApp() {
  const app = express();
  // behind exactly one proxy/load balancer: trust 1 hop, so req.ip is the real client, not the proxy
  app.set('trust proxy', 1);

  const general = createTokenBucketLimiter({ capacity: 5, refillPerSec: 1 });
  const loginLimiter = createTokenBucketLimiter({ capacity: 3, refillPerSec: 1 / 60 }); // strict: brute force
  app.use(rateLimit({ limiter: general, limit: 5, keyFn: keyByUserOrIp, skip: (req) => req.path === '/health' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/ping', (req, res) => res.json({ pong: true }));
  app.post('/login', rateLimit({ limiter: loginLimiter, limit: 3 }), (req, res) => res.json({ ok: true }));
  return app;
}
```

**Complexity.** O(1) per request.

**Common mistakes.** Limiter ko auth middleware se pehle lagakar user-based key use karna (user abhi nahi pata); `Retry-After` milliseconds mein bhejna; `trust proxy: true` (har `X-Forwarded-For` hop trusted, spoofable);
429 par body mein generic HTML; health checks ko limit karna (load balancer apne hi service ko down maan leta hai); sirf IP key (NAT ke peeche poora office ek client); sirf per-instance memory (instances ke beech limit multiply ho jaati hai: rung 07).

### EX-RATE-06 - Memory safety and per-route policies

**Expected approach.**
- **Idle sweep:** jo bucket `capacity / refillPerSec` seconds idle raha woh full ho chuka hai; delete karna behaviour nahi badalta (naya bucket bhi full se shuru hota hai).
- **`maxKeys` cap:** `Map` insertion order se oldest key evict (delete + set se LRU). Trade-off: evicted active client ka bucket full ho jaata hai; attacker unique keys ghuma kar bucket flush kar sakta hai. Mitigation: cap bada rakho, IP-level coarse limiter alag, ya Redis.
- **`unref()`:** cleanup timer process ko alive nahi rakhta (graceful shutdown/tests).
- **Policy registry:** `'POST /auth/login'` -> strict limiter, baaki default.

**Why in-memory limiting breaks with many instances.** 4 app instances = 4 alag counters. Load balancer requests spread karta hai, isliye effective limit `4 x limit` ho jaati hai aur har instance ke restart par counters reset. Shared store (Redis) chahiye (rung 07), ya LB par sticky routing/edge rate limiting.

**Reference solution.**

```js
// ex-rate-06.js
export function createManagedTokenBucket({
  capacity,
  refillPerSec,
  now = () => Date.now(),
  maxKeys = 100_000,
  sweepEveryMs = 60_000,
}) {
  const buckets = new Map(); // insertion order = least recently used first
  const idleToFullMs = (capacity / refillPerSec) * 1000;

  // a bucket idle this long is full again: deleting it changes nothing (a new one also starts full)
  function sweep() {
    const t = now();
    for (const [key, b] of buckets) if (t - b.last >= idleToFullMs) buckets.delete(key);
  }
  const timer = sweepEveryMs > 0 ? setInterval(sweep, sweepEveryMs) : null;
  timer?.unref(); // a cleanup timer must never keep the process alive

  return {
    allow(key, cost = 1) {
      const t = now();
      let b = buckets.get(key);
      if (b) {
        buckets.delete(key); // re-inserted below: moves the key to the "most recent" end
        b.tokens = Math.min(capacity, b.tokens + ((t - b.last) / 1000) * refillPerSec);
        b.last = t;
      } else {
        if (buckets.size >= maxKeys) buckets.delete(buckets.keys().next().value); // evict the oldest
        b = { tokens: capacity, last: t };
      }
      buckets.set(key, b);
      if (b.tokens >= cost) {
        b.tokens -= cost;
        return { allowed: true, remaining: Math.floor(b.tokens), retryAfterMs: 0, resetMs: Math.ceil(((capacity - b.tokens) / refillPerSec) * 1000) };
      }
      return {
        allowed: false,
        remaining: Math.floor(b.tokens),
        retryAfterMs: Math.ceil(((cost - b.tokens) / refillPerSec) * 1000),
        resetMs: Math.ceil(((capacity - b.tokens) / refillPerSec) * 1000),
      };
    },
    sweep,
    size: () => buckets.size,
    stop: () => clearInterval(timer),
  };
}

// per-route policies: "METHOD /path" -> limiter, with a default
export function createPolicyRegistry({ default: fallback, routes = {} }) {
  return {
    get: (method, path) => routes[`${method.toUpperCase()} ${path}`] ?? fallback,
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let t = 0;
  const lim = createManagedTokenBucket({ capacity: 2, refillPerSec: 1, now: () => t, maxKeys: 2, sweepEveryMs: 0 });
  lim.allow('a');
  lim.allow('b');
  lim.allow('c'); // evicts 'a' (oldest)
  console.log(lim.size()); // 2
  t = 2000; // idle for capacity / refill = 2 s -> both remaining buckets are full again
  lim.sweep();
  console.log(lim.size()); // 0
}
```

**Complexity.** `allow` O(1). `sweep` O(keys) per run.

**Common mistakes.** Cleanup timer ko `unref` na karna (process exit nahi hota); eviction ke liye har request par poori Map scan; sweep mein sirf `last` dekhna (galat idle threshold); per-route policy ko global limiter ke upar bhool jaana (login par dono lagte hain);
unbounded keys (user-controlled header ko key banana).

### EX-RATE-07 - Distributed token bucket with Redis and Lua

**Expected approach.** Read-modify-write (HMGET, calculate, HSET) agar client side par ho to do servers ek hi tokens padhkar dono allow kar denge (race). **Lua script** Redis mein atomically chalta hai (Redis command execution single-threaded), isliye poora bucket logic ek atomic unit hai.
Time `redis.call('TIME')` se: app servers ki clocks skewed ho to bhi consistent. `PEXPIRE` se idle keys auto-delete. `defineCommand` script ko cache karke `EVALSHA` use karta hai.

**Fail-open vs fail-closed (Redis down).**
- **Login endpoint: fail-closed (ya strict local fallback).** Limiter ka maqsad brute-force rokna hai; limiter down hone par attacker ko free pass dena security hole hai.
- **Public product search: fail-open.** Limiter protection hai, product nahi; Redis outage par search band kar dena availability loss bada nuksan hai. Usually local in-memory limiter fallback.

**Reference solution** (needs a Redis server and `npm i ioredis`; not executed in this document's environment).

```js
// ex-rate-07.js  (needs a Redis server >= 5 and: npm i ioredis)
import Redis from 'ioredis';

// All read-modify-write happens inside ONE script: Redis runs scripts atomically (single-threaded).
const TOKEN_BUCKET_LUA = `
local key        = KEYS[1]
local capacity   = tonumber(ARGV[1])
local refill_ms  = tonumber(ARGV[2])   -- tokens per millisecond
local cost       = tonumber(ARGV[3])
local ttl_ms     = tonumber(ARGV[4])

local t = redis.call('TIME')           -- Redis clock: app servers' clocks do not matter
local now_ms = t[1] * 1000 + math.floor(t[2] / 1000)

local data   = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts     = tonumber(data[2])
if tokens == nil then
  tokens = capacity
  ts = now_ms
end

tokens = math.min(capacity, tokens + math.max(0, now_ms - ts) * refill_ms)

local allowed = 0
local retry_ms = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retry_ms = math.ceil((cost - tokens) / refill_ms)
end

redis.call('HSET', key, 'tokens', tostring(tokens), 'ts', now_ms)
redis.call('PEXPIRE', key, ttl_ms)     -- idle keys disappear by themselves
return { allowed, tostring(tokens), retry_ms }
`;

export function createRedisTokenBucket(
  redis,
  { capacity, refillPerSec, ttlSec = Math.ceil(capacity / refillPerSec) * 2 },
) {
  redis.defineCommand('tokenBucket', { numberOfKeys: 1, lua: TOKEN_BUCKET_LUA });
  const refillPerMs = refillPerSec / 1000;

  return {
    async allow(key, cost = 1) {
      const [allowed, tokens, retryMs] = await redis.tokenBucket(
        `rl:${key}`,
        capacity,
        refillPerMs,
        cost,
        ttlSec * 1000,
      );
      const left = Number(tokens);
      return {
        allowed: allowed === 1,
        remaining: Math.floor(left),
        retryAfterMs: Number(retryMs),
        resetMs: Math.ceil((capacity - left) / refillPerMs),
      };
    },
  };
}

// failure policy: what to do when Redis itself is unavailable
export function withFailPolicy(limiter, { failOpen }) {
  return {
    async allow(key, cost) {
      try {
        return await limiter.allow(key, cost);
      } catch (err) {
        return { allowed: failOpen, remaining: 0, retryAfterMs: failOpen ? 0 : 1000, resetMs: 0, degraded: true };
      }
    },
  };
}

// usage
// const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
// const login  = withFailPolicy(createRedisTokenBucket(redis, { capacity: 5, refillPerSec: 1 / 12 }), { failOpen: false });
// const search = withFailPolicy(createRedisTokenBucket(redis, { capacity: 50, refillPerSec: 10 }), { failOpen: true });
```

**Complexity.** O(1) per call: one Redis round trip, constant-time script.

**Common mistakes.** Client-side GET + SET (race); script mein `math.random`/non-deterministic logic ya key names ko `KEYS` ki jagah script ke andar construct karna (Redis Cluster mein slot problems; `KEYS` use karo);
float tokens ko Lua number return karke integer truncation (isliye `tostring`); TTL bucket full hone ke time se kam rakhna (state jaldi delete -> client ko free refill); Redis Cluster mein multi-key scripts same slot mein na hona (yahan single key);
har request par Redis call ka latency budget ignore karna (pipeline/local pre-check).

---

## 13. Preventing duplicate transaction requests - solutions

**Core idea.** Network unreliable hai: client request bhejta hai, server process karta hai, response kho jaata hai, client retry karta hai. Server ko retry ko pehchan kar **same result** dena hai bina effect repeat kiye. Tool: client ek unique **Idempotency-Key** bhejta hai; server key + request fingerprint
ke basis par "pehle dekha ya nahi" decide karta hai. **Correctness ka asli source hamesha durable unique constraint hota hai** (DB primary key / unique index); in-memory/Redis layers sirf speed aur UX ke liye.

### EX-IDEM-01 - Idempotency key store

**Expected approach.** `Map<key, result>`. Pehli baar `fn()` chalao aur result store; baad mein stored result return, `fn` nahi. Result ki copy (`structuredClone`) taaki caller mutation se cache kharab na ho.

**Reference solution.**

```js
// ex-idem-01.js
export function createIdempotencyStore() {
  const results = new Map(); // key -> result of the first successful run

  return {
    async run(key, fn) {
      if (results.has(key)) return structuredClone(results.get(key)); // replay: fn is NOT called
      const value = await fn();
      results.set(key, structuredClone(value)); // store a copy: later mutation by a caller cannot corrupt it
      return value;
    },
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let charges = 0;
  const store = createIdempotencyStore();
  const pay = () => store.run('pay-123', async () => ({ chargeId: ++charges }));
  console.log(await pay(), await pay(), 'charges =', charges); // { chargeId: 1 } { chargeId: 1 } charges = 1

  // the weakness: two CONCURRENT calls both miss the cache, both run fn
  charges = 0;
  const store2 = createIdempotencyStore();
  const slowPay = () => store2.run('pay-9', async () => { await new Promise((r) => setTimeout(r, 20)); return { chargeId: ++charges }; });
  await Promise.all([slowPay(), slowPay()]);
  console.log('concurrent charges =', charges); // 2  (BUG: fixed in EX-IDEM-02)
}
```

**Complexity.** O(1) time per call; O(keys) space.

**Common mistakes.** Isko complete samajhna: demo ka doosra hissa dikhata hai ki do concurrent calls dono cache miss karti hain aur `fn` do baar chalta hai (charges = 2). Agle rung mein fix.

### EX-IDEM-02 - Concurrent duplicates and failures

**Expected approach.** **Promise ko store karo** (value nahi) aur `await` se pehle store karo. Concurrent calls wahi promise share karti hain: `fn` ek baar. TTL (completion se) aur failure policy:
transient error cache nahi (client retry kar sake); `isFinal(err)` true ho (business error jaise "insufficient funds") to wahi failure replay hota hai.

**Trade-off.** Failure cache nahi karoge to retry dobara side effect try karega (agar failure partial side effect ke baad hua to dangerous). Cache karoge to client ko transient failure ke baad bhi purana error milta rahega. Isliye error classification zaroori.

**Reference solution.**

```js
// ex-idem-02.js
export function createIdempotencyStore({ ttlMs = 86_400_000, now = () => Date.now(), isFinal = () => false } = {}) {
  const entries = new Map(); // key -> { promise, expiresAt }  (expiresAt === null: still running)

  return {
    run(key, fn) {
      const hit = entries.get(key);
      if (hit && (hit.expiresAt === null || hit.expiresAt > now())) return hit.promise; // share the in-flight / stored promise

      const entry = { promise: null, expiresAt: null };
      entry.promise = Promise.resolve()
        .then(fn)
        .then(
          (value) => {
            entry.expiresAt = now() + ttlMs; // success: remember until the TTL
            return value;
          },
          (err) => {
            if (isFinal(err)) entry.expiresAt = now() + ttlMs; // business error: replay the same failure
            else if (entries.get(key) === entry) entries.delete(key); // transient: let the client retry
            throw err;
          },
        );
      entries.set(key, entry); // set BEFORE awaiting: this closes the race window
      return entry.promise;
    },
    sweep() {
      const t = now();
      for (const [key, e] of entries) if (e.expiresAt !== null && e.expiresAt <= t) entries.delete(key);
    },
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let charges = 0;
  const store = createIdempotencyStore();
  const pay = () =>
    store.run('pay-9', async () => {
      await new Promise((r) => setTimeout(r, 20));
      return { chargeId: ++charges };
    });
  console.log(await Promise.all([pay(), pay(), pay()]), 'charges =', charges); // all chargeId 1, charges = 1
}
```

**Complexity.** O(1) per call; O(keys) memory until TTL (sweep).

**Common mistakes.** Value cache karna, promise nahi (race); sab errors cache karna; sab errors na cache karna jab operation non-retryable ho; TTL ke bina store (memory leak) ya bahut chhota TTL (retry window se kam: client ka late retry dobara execute hota hai;
Stripe 24 hours rakhta hai).

### EX-IDEM-03 - Same key, different payload

**Expected approach.** Fingerprint = SHA-256 of **canonical JSON** (keys recursively sorted), taaki `{a:1,b:2}` aur `{b:2,a:1}` same ho. Entry mein fingerprint store. Same key + same fingerprint -> replay; same key + alag fingerprint -> `IdempotencyKeyReuseError` (422).
Reason: key reuse with different body ya to client bug hai ya attack; silently purana result dena user ko galat confirmation deta hai (e.g. 100 ki jagah 999 ka request, par 100 ka result).

**Reference solution.**

```js
// ex-idem-03.js
import { createHash } from 'node:crypto';

export class IdempotencyKeyReuseError extends Error {
  constructor(key) {
    super(`Idempotency key "${key}" was already used with a different request body`);
    this.name = 'IdempotencyKeyReuseError';
    this.status = 422;
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonicalize(value[k])]),
    );
  }
  return value;
}

export const canonicalJson = (value) => JSON.stringify(canonicalize(value));
export const fingerprint = (body) => createHash('sha256').update(canonicalJson(body)).digest('hex');

export function createIdempotencyStore({ ttlMs = 86_400_000, now = () => Date.now() } = {}) {
  const entries = new Map(); // key -> { fingerprint, promise, expiresAt }
  return {
    run(key, body, fn) {
      const fp = fingerprint(body);
      const hit = entries.get(key);
      if (hit && (hit.expiresAt === null || hit.expiresAt > now())) {
        if (hit.fingerprint !== fp) throw new IdempotencyKeyReuseError(key); // same key, different request
        return hit.promise;
      }
      const entry = { fingerprint: fp, promise: null, expiresAt: null };
      entry.promise = Promise.resolve()
        .then(fn)
        .then(
          (value) => {
            entry.expiresAt = now() + ttlMs;
            return value;
          },
          (err) => {
            if (entries.get(key) === entry) entries.delete(key);
            throw err;
          },
        );
      entries.set(key, entry);
      return entry.promise;
    },
  };
}

// demo
if (process.argv[1] === import.meta.filename) {
  let n = 0;
  const store = createIdempotencyStore();
  const charge = async () => ({ chargeId: ++n });
  console.log(await store.run('k1', { amount: 100, to: 'B' }, charge)); // { chargeId: 1 }
  console.log(await store.run('k1', { to: 'B', amount: 100 }, charge)); // replay: { chargeId: 1 }
  try {
    await store.run('k1', { amount: 999, to: 'B' }, charge);
  } catch (err) {
    console.log(err.name, err.status); // IdempotencyKeyReuseError 422
  }
}
```

**Complexity.** O(body size) for hashing, O(1) lookup.

**Common mistakes.** `JSON.stringify(body)` seedha (key order se false mismatch); fingerprint mein non-deterministic fields (timestamps, request id) shamil karna (kabhi match nahi hoga); fingerprint na rakhna (wrong replay); poora body store karna jab hash kaafi hai.

### EX-IDEM-04 - Express middleware for `POST /payments`

**Expected approach.** Middleware: header required (400), scope `userId:key`, fingerprint, state machine `IN_PROGRESS` (lock with lease) -> `DONE` (stores status + body). `res.json` wrap karke response capture; `5xx` store nahi hota (client ko retry karne do).
Replay par stored status/body + `Idempotency-Replayed: true`. Concurrent duplicate `IN_PROGRESS` dikhe to `409` + `Retry-After`. Different body -> `422`.

**Reference solution** (needs `ex-idem-03.js`).

```js
// ex-idem-04.js  (uses ex-idem-03.js from this folder)
import express from 'express';
import { fingerprint } from './ex-idem-03.js';

const KEY_RE = /^[A-Za-z0-9._:-]{8,64}$/;
const err = (res, status, code, message) => res.status(status).json({ error: { code, message } });

// store: any Map-like object (a Map here; Redis/MySQL in production)
export function idempotency({ store = new Map(), ttlMs = 86_400_000, lockMs = 30_000, now = () => Date.now() } = {}) {
  return (req, res, next) => {
    if (req.method !== 'POST') return next();

    const key = req.get('idempotency-key');
    if (!key || !KEY_RE.test(key)) {
      return err(res, 400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required (8-64 chars)');
    }
    const scope = `${req.user?.id ?? 'anon'}:${key}`; // one user must not collide with another's key
    const fp = fingerprint(req.body ?? {});

    let entry = store.get(scope);
    if (entry && entry.expiresAt <= now()) {
      store.delete(scope); // expired result, or a crashed in-progress lock
      entry = undefined;
    }
    if (entry) {
      if (entry.fingerprint !== fp) {
        return err(res, 422, 'IDEMPOTENCY_KEY_REUSE', 'Idempotency-Key was used with a different body');
      }
      if (entry.state === 'IN_PROGRESS') {
        res.set('Retry-After', '1');
        return err(res, 409, 'REQUEST_IN_PROGRESS', 'A request with this key is still being processed');
      }
      res.set('Idempotency-Replayed', 'true');
      return res.status(entry.status).json(entry.body);
    }

    entry = { fingerprint: fp, state: 'IN_PROGRESS', expiresAt: now() + lockMs };
    store.set(scope, entry);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 500) {
        store.delete(scope); // never store server errors: the client must be able to retry
      } else {
        Object.assign(entry, { state: 'DONE', status: res.statusCode, body, expiresAt: now() + ttlMs });
      }
      return originalJson(body);
    };
    next();
  };
}

// usage
export function createApp({ onCharge = () => {} } = {}) {
  const app = express();
  app.use(express.json());
  app.use(idempotency());
  let seq = 0;
  app.post('/payments', async (req, res) => {
    onCharge(req.body); // the side effect we must not repeat
    await new Promise((r) => setTimeout(r, 20));
    res.status(201).json({ paymentId: `p${++seq}`, amount: req.body.amount });
  });
  return app;
}
```

**Complexity.** O(1) per request.

**Common mistakes.** Key ko user se scope na karna (ek user ki key doosre ke response ko replay kare = data leak); 5xx response store karna; in-progress lock ke bina (concurrent duplicates dono process hote); lock lease na rakhna (crash par key forever stuck);
sirf `res.json` wrap karna aur handler `res.send` use kare to capture nahi hota; `Map` multi-instance par kaam nahi karta (instances ke beech state share nahi): MySQL/Redis store (agle rungs).

### EX-IDEM-05 - Durable idempotency in MySQL

**Expected approach.** **Insert-first:** `INSERT ... IN_PROGRESS` ki `PRIMARY KEY (user_id, idem_key)` lock hai: race mein sirf ek insert jeetta hai, doosra `errno 1062` (duplicate entry) paata hai. Haarne wala row padhta hai:
- fingerprint alag -> 422;
- `COMPLETED` -> stored response replay;
- `IN_PROGRESS` aur lease valid -> 409;
- `IN_PROGRESS` aur lease expire (previous worker crash) -> conditional `UPDATE ... WHERE locked_until < NOW(3)` se atomically takeover.

Jeetne wala `work(conn)` ek transaction mein chalata hai aur usi transaction mein `COMPLETED` + response store karta hai: DB side effects aur "done" marker **saath commit** hote hain (koi gap nahi jahan effect hua par record nahi). Fail hone par rollback aur claim delete (retry allowed).

**External side effects.** Agar `work` payment gateway ko call karta hai (DB transaction ke bahar), to DB transaction use nahi bacha sakti: gateway ko bhi **apni idempotency key** bhejo (same `key`), aur lease + `IN_PROGRESS` state se crash recovery handle karo.

**Reference solution** (needs `ex-err-02.js`).

```js
// ex-idem-05.js  (MySQL 8, mysql2/promise; table idempotency_keys from the problem)
import { AppError, ConflictError } from './ex-err-02.js';

const DUP_ENTRY = 1062;

// Phase 1: claim the key. Returns { replay } if there is a stored response, or null when we own the key.
async function claim(conn, { userId, key, fingerprint, leaseMs }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await conn.execute(
        `INSERT INTO idempotency_keys (user_id, idem_key, fingerprint, status, locked_until)
         VALUES (?, ?, ?, 'IN_PROGRESS', DATE_ADD(NOW(3), INTERVAL ? MICROSECOND))`,
        [userId, key, fingerprint, leaseMs * 1000],
      );
      return null; // we won: the PRIMARY KEY is the lock
    } catch (err) {
      if (err.errno !== DUP_ENTRY) throw err;
    }

    const [[row]] = await conn.execute(
      `SELECT fingerprint, status, response_code, response_body, (locked_until < NOW(3)) AS expired
         FROM idempotency_keys WHERE user_id = ? AND idem_key = ?`,
      [userId, key],
    );
    if (!row) continue; // deleted between our INSERT and SELECT: try to claim again
    if (row.fingerprint !== fingerprint) {
      throw new AppError('Idempotency key reused with a different request', {
        status: 422,
        code: 'IDEMPOTENCY_KEY_REUSE',
      });
    }
    if (row.status === 'COMPLETED') return { replay: { code: row.response_code, body: row.response_body } };
    if (row.expired) {
      // the previous owner crashed (lease expired): take over atomically; only one taker can win
      const [taken] = await conn.execute(
        `UPDATE idempotency_keys
            SET locked_until = DATE_ADD(NOW(3), INTERVAL ? MICROSECOND)
          WHERE user_id = ? AND idem_key = ? AND status = 'IN_PROGRESS' AND locked_until < NOW(3)`,
        [leaseMs * 1000, userId, key],
      );
      if (taken.affectedRows === 1) return null;
    }
    throw new ConflictError('A request with this key is still in progress');
  }
  throw new ConflictError('Could not claim idempotency key, retry');
}

// work(conn) must run inside the transaction we open and return { code, body }
export async function executeOnce(pool, { userId, key, fingerprint, leaseMs = 30_000 }, work) {
  const conn = await pool.getConnection();
  try {
    const existing = await claim(conn, { userId, key, fingerprint, leaseMs }); // autocommit: visible to others at once
    if (existing) return { replayed: true, ...existing.replay };

    await conn.beginTransaction();
    try {
      const result = await work(conn); // DB side effects + the COMPLETED mark commit TOGETHER
      await conn.execute(
        `UPDATE idempotency_keys
            SET status = 'COMPLETED', response_code = ?, response_body = ?, locked_until = NULL
          WHERE user_id = ? AND idem_key = ?`,
        [result.code, JSON.stringify(result.body), userId, key],
      );
      await conn.commit();
      return { replayed: false, ...result };
    } catch (err) {
      try { await conn.rollback(); } catch { /* connection may be gone */ }
      // the work was rolled back, so it is safe to release the key and let the client retry
      await conn.execute(
        `DELETE FROM idempotency_keys WHERE user_id = ? AND idem_key = ? AND status = 'IN_PROGRESS'`,
        [userId, key],
      );
      throw err;
    }
  } finally {
    conn.release();
  }
}
```

**Complexity.** About 2-4 statements per request (claim, work, complete); all primary-key operations, O(log n).

**Common mistakes.** `SELECT` karke "agar nahi hai to `INSERT`" (check-then-insert race); unique constraint ke bina logic; `COMPLETED` update aur business effect alag transactions mein (crash par double effect ya lost marker);
lease na rakhna (crash par key forever `IN_PROGRESS`); `IN_PROGRESS` ko cache/replica se padhna (stale); response body ko huge store karna (limit/size cap, TTL cleanup job `DELETE WHERE created_at < NOW() - INTERVAL 1 DAY`);
transaction ke andar slow external HTTP calls.

### EX-IDEM-06 - Duplicate-safe money transfer

**Expected approach.** Client-supplied unique `ref` `transfers` table ki primary key. Transaction ke pehle statement mein `INSERT INTO transfers` (insert-first). Duplicate `ref` -> `errno 1062` -> existing row padho (locking read `FOR SHARE`: latest committed version) aur
`duplicate: true` return, paisa dobara nahi hilta. Agar payload (accounts/amount) alag hai to `ConflictError`. Naya `ref` hai to usi transaction mein `moveMoney` (EX-TXN-01): dedupe row aur balance change **saath commit ya saath rollback**.

**Why rollback of the dedupe row is intended.** Agar transfer fail ho jaye (insufficient funds), poora transaction rollback hota hai aur `transfers` row bhi gayab: client sahi se retry kar sakta hai (jab balance ho jaye). Agar "failed" outcome ko bhi permanent record banana ho to alag status row (alag transaction) likhna padega.

**Reference solution** (needs `ex-err-02.js`, `ex-txn-01.js`, `ex-txn-04.js`).

```js
// ex-idem-06.js  (uses ex-err-02.js, ex-txn-01.js, ex-txn-04.js from this folder)
// extra table: CREATE TABLE transfers (ref VARCHAR(64) PRIMARY KEY, from_id INT NOT NULL, to_id INT NOT NULL,
//   amount DECIMAL(12,2) NOT NULL, status VARCHAR(20) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;
import { ConflictError } from './ex-err-02.js';
import { moveMoney, assertMoney } from './ex-txn-01.js';
import { withTransaction } from './ex-txn-04.js';

export async function transferOnce(pool, { ref, fromId, toId, amount }) {
  assertMoney(amount, fromId, toId);
  const normalized = Number(amount).toFixed(2);

  return withTransaction(pool, async (conn) => {
    try {
      // insert-first: the PRIMARY KEY on ref decides who is first, even under concurrency
      await conn.execute(
        `INSERT INTO transfers (ref, from_id, to_id, amount, status) VALUES (?, ?, ?, ?, 'DONE')`,
        [ref, fromId, toId, normalized],
      );
    } catch (err) {
      if (err.errno !== 1062) throw err;
      // duplicate ref: a locking read sees the latest committed row (not an old snapshot)
      const [[existing]] = await conn.execute(
        'SELECT ref, from_id, to_id, amount, status FROM transfers WHERE ref = ? FOR SHARE',
        [ref],
      );
      if (existing.from_id !== fromId || existing.to_id !== toId || existing.amount !== normalized) {
        throw new ConflictError(`Reference ${ref} was already used for a different transfer`);
      }
      return { duplicate: true, ref, fromId, toId, amount: normalized };
    }
    await moveMoney(conn, { fromId, toId, amount: normalized, ref }); // same transaction as the dedupe row
    return { duplicate: false, ref, fromId, toId, amount: normalized };
  });
}
```

**Complexity.** O(1) statements, all indexed by primary key.

**Common mistakes.** `SELECT` se pehle check phir `INSERT` (race: dono check pass karte hain); dedupe record ko money movement se alag transaction mein likhna (effect hua par record nahi, ya record hua par effect nahi); `REPEATABLE READ` snapshot se purana read (isliye `FOR SHARE` locking read);
`INSERT IGNORE` se sab errors swallow (sirf duplicate nahi, aur errors bhi); `ref` server-generated karna (retry par naya `ref` ban jaata hai: client ko stable ref bhejna chahiye); amount alag hone par bhi duplicate maan lena.

### EX-IDEM-07 - Redis lock + cached response

**Expected approach.** (1) Result cached ho to replay. (2) `SET lock token NX PX ttl` se lock (NX = only if absent, PX = auto-expiry: crashed worker lock forever nahi pakadta). Lock nahi mila -> 409. (3) Lock milne ke baad result dobara check (race window). (4) `work()`, result `SET ... EX`.
(5) **Lock release sirf apna token hone par** (Lua compare-and-delete): warna expire ho chuke lock par kisi aur ka lock hata dete.

**What if `work` takes longer than `lockTtlMs`?** Lock expire ho jaati hai; doosra worker lock le sakta hai aur `work` dobara chala deta hai: **do workers parallel**. Options: TTL realistic work time se bada rakho; lock renew (heartbeat/watchdog); aur sabse zaroori:
work ke andar ka effect khud idempotent ho (DB unique constraint, gateway idempotency key), kyunki Redis lock correctness ki guarantee nahi, sirf "kam duplicate attempts" ki optimization hai. Lock ke saath **fencing token** (monotonic counter jise downstream check kare) advanced technique hai.

**Why Redis alone cannot make payment exactly-once.** Redis aur payment DB/gateway do alag systems hain: effect ke baad aur result store karne se pehle crash ho sakta hai; Redis data loss/failover (async replication) ho sakta hai;
lock expiry hota hai. Practical exactly-once-effect = **at-least-once delivery + idempotent processing**: (a) gateway call mein provider ki idempotency key, (b) DB mein unique constraint (`ref`), (c) Redis sirf fast-path cache/lock.

**Reference solution** (needs a Redis server, `npm i ioredis`, and `ex-err-02.js`; not executed in this document's environment).

```js
// ex-idem-07.js  (Redis; npm i ioredis)
import { randomUUID } from 'node:crypto';
import { ConflictError } from './ex-err-02.js';

// delete the lock only if it is still OURS (it may have expired and been taken by someone else)
const RELEASE_LUA = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

export async function idempotentRedis(redis, key, { lockTtlMs = 30_000, resultTtlSec = 86_400 } = {}, work) {
  const resultKey = `idem:result:${key}`;
  const lockKey = `idem:lock:${key}`;

  const cached = await redis.get(resultKey);
  if (cached !== null) return { replayed: true, result: JSON.parse(cached) };

  const token = randomUUID();
  // NX: only if absent. PX: auto-expire, so a crashed worker cannot hold the lock forever.
  const acquired = await redis.set(lockKey, token, 'PX', lockTtlMs, 'NX');
  if (acquired !== 'OK') throw new ConflictError('A request with this key is in progress');

  try {
    const again = await redis.get(resultKey); // finished between our first GET and our lock?
    if (again !== null) return { replayed: true, result: JSON.parse(again) };

    const result = await work();
    await redis.set(resultKey, JSON.stringify(result), 'EX', resultTtlSec);
    return { replayed: false, result };
  } finally {
    await redis.eval(RELEASE_LUA, 1, lockKey, token);
  }
}
```

**Complexity.** 2-4 Redis round trips per call; O(1).

**Common mistakes.** `SET` aur `EXPIRE` do alag commands (beech mein crash = lock forever; `SET NX PX` ek atomic command hai); lock ko plain `DEL` se release karna; result store karne se pehle lock chhodna; lock ko hi idempotency ka proof maan lena;
single Redis lock ko distributed consensus samajhna (Redlock par bahut debate hai; critical correctness ke liye DB constraint); result TTL bahut chhota.

---

# END OF DOCUMENT

## Self-check before the interview

- [ ] I can explain why `forEach(async ...)`, `await` ordering and `nextTick` vs promise order behave as they do (EX-ASYNC, EX-LOOP, EX-ERR).
- [ ] I can write a retry with backoff, a timeout with AbortController, and bounded concurrency from memory.
- [ ] I can build Express 5 CRUD with layered code, validation and centralized errors without looking.
- [ ] I can write LEFT JOIN anti-joins, GROUP BY/HAVING, CTEs and window functions, and explain WHERE vs HAVING and ON vs WHERE in a LEFT JOIN.
- [ ] I can write a money transfer and an order placement with correct locking order, conditional UPDATEs and rollback/release.
- [ ] I can explain JWT verification (algorithms pinned, expiry), refresh rotation, RBAC vs ownership checks.
- [ ] I can write Supertest tests including negative cases and fake timers.
- [ ] I can diagnose: hanging request, memory leak, blocked event loop, N+1, pool exhaustion, shared state race, unhandled rejection, CORS/cookie issues.
- [ ] I can implement fixed window, sliding window, token bucket, and explain why distributed limiting needs Redis + Lua.
- [ ] I can explain idempotency end to end: key, fingerprint, in-flight handling, unique constraint as the source of truth, and why exactly-once is really at-least-once + idempotent processing.

## REMAINING

Nothing remaining for this file. Known limits (stated honestly): MySQL and Redis solutions were reviewed and control-flow-tested with a fake pool but not executed against live servers; hand-written crypto/validation here is for learning, use maintained libraries in production.

