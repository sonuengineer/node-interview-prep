# Question Bank A -- Categories 1 to 5

Part 9 of the Node.js Backend Interview Preparation set. This file covers:

1. JavaScript fundamentals and asynchronous programming (`Q-JS-`)
2. Node.js runtime and internals (`Q-NODE-`)
3. Express.js and API design (`Q-EXP-`)
4. Databases and SQL queries (`Q-SQL-`)
5. MongoDB (`Q-MONGO-`)

Categories 6 to 10 (security, testing, performance, production, system design) are in `10_Question_Bank_B.md`.
Coding exercises are in `11_Coding_Exercises.md`. Concept notes live in the week files (`01_Week1_JavaScript.md` to `05_Week5_Data_Auth_Security.md`).

## How to use this bank

- Cover the answer, read the question, answer OUT LOUD in English for 45-90 seconds, then compare with **Interview answer**.
- The **Hinglish explanation** is for understanding. In the interview, speak the English answer, but use the Hinglish part to make sure you could explain the idea in your own words.
- Tier tags: `[ESSENTIAL]` means asked in most junior-to-mid interviews. `[ADVANCED]` means supplementary; do it after the essentials are solid.
- Difficulty tags: Basic, Intermediate, Advanced. Difficulty and tier are different things: an Intermediate question can still be ESSENTIAL.
- Version notes: examples target Node.js 22 LTS (Node 20 differences are flagged), ES modules, Express 5, MySQL 8 and `mysql2/promise`.
- Honest note: 150+ questions is a lot. In 8 weeks, master all ESSENTIAL ones and be able to reason through the ADVANCED ones; do not try to memorize text.

## Mini index

| Category | ID range | Count | Basic | Intermediate | Advanced | ESSENTIAL | ADVANCED tier |
|----------|----------|-------|-------|--------------|----------|-----------|---------------|
| JavaScript fundamentals and async | Q-JS-01 to Q-JS-30 | 30 | 9 | 17 | 4 | 27 | 3 |
| Node.js runtime and internals | Q-NODE-01 to Q-NODE-30 | 30 | 6 | 19 | 5 | 26 | 4 |
| Express.js and API design | Q-EXP-01 to Q-EXP-30 | 30 | 8 | 21 | 1 | 30 | 0 |
| Databases and SQL queries | Q-SQL-01 to Q-SQL-34 | 34 | 5 | 23 | 6 | 33 | 1 |
| MongoDB | Q-MONGO-01 to Q-MONGO-30 | 30 | 4 | 19 | 7 | 26 | 4 |
| Total | | 154 | | | | | |

Quick lookup of every question (ID, difficulty, tier, topic):

**JavaScript fundamentals and async**

| ID | Difficulty | Tier | Topic |
|----|------------|------|-------|
| Q-JS-01 | Basic | ESSENTIAL | What is an execution context and how does the call stack use it? |
| Q-JS-02 | Basic | ESSENTIAL | Explain hoisting and the temporal dead zone for var, let and const. |
| Q-JS-03 | Basic | ESSENTIAL | What is a closure and where do you use it in backend code? |
| Q-JS-04 | Intermediate | ESSENTIAL | Predict the output: closures in loops with var and let. |
| Q-JS-05 | Basic | ESSENTIAL | What is lexical scope and the scope chain? |
| Q-JS-06 | Intermediate | ESSENTIAL | How is `this` determined in JavaScript? |
| Q-JS-07 | Intermediate | ESSENTIAL | call, apply, bind: what do they do and when do you need them? |
| Q-JS-08 | Basic | ESSENTIAL | Arrow functions versus regular functions. |
| Q-JS-09 | Intermediate | ESSENTIAL | Explain the prototype chain and prototypal inheritance. |
| Q-JS-10 | Intermediate | ESSENTIAL | Are JavaScript classes real classes? How do they relate to prototypes? |
| Q-JS-11 | Intermediate | ADVANCED | Object.create, own versus inherited properties, and shadowing. |
| Q-JS-12 | Basic | ESSENTIAL | `==` versus `===`, truthy and falsy values, and common coercion traps. |
| Q-JS-13 | Basic | ESSENTIAL | Primitives versus references: what does assignment copy? |
| Q-JS-14 | Intermediate | ESSENTIAL | Shallow copy versus deep copy; how do you clone safely? |
| Q-JS-15 | Basic | ESSENTIAL | Does `const` make an object immutable? How do you get real immutability? |
| Q-JS-16 | Intermediate | ESSENTIAL | Use map, filter and reduce to transform backend data (group, index, aggregate). |
| Q-JS-17 | Basic | ESSENTIAL | What is a Promise? Explain its states and chaining. |
| Q-JS-18 | Intermediate | ESSENTIAL | How do errors propagate in promise chains? catch versus finally. |
| Q-JS-19 | Intermediate | ESSENTIAL | How does async/await work, and when should awaits run in parallel? |
| Q-JS-20 | Intermediate | ESSENTIAL | Explain the JavaScript event loop: call stack, microtasks and macrotasks. |
| Q-JS-21 | Intermediate | ESSENTIAL | Output prediction: timers, promises and synchronous code. |
| Q-JS-22 | Advanced | ESSENTIAL | Output prediction: async functions and ordering of `await`. |
| Q-JS-23 | Intermediate | ESSENTIAL | Promise.all vs allSettled vs race vs any: when do you use each? |
| Q-JS-24 | Advanced | ESSENTIAL | Implement a concurrency limit: process N items with at most K in flight. |
| Q-JS-25 | Intermediate | ESSENTIAL | Common async mistakes: forEach with async, missing await, and floating promises. |
| Q-JS-26 | Intermediate | ESSENTIAL | Why does try/catch not catch errors in callbacks, and how do you handle errors in async code? |
| Q-JS-27 | Intermediate | ESSENTIAL | Convert a callback API to a promise (promisify) and explain the rules. |
| Q-JS-28 | Intermediate | ESSENTIAL | Implement retry with exponential backoff and jitter. |
| Q-JS-29 | Advanced | ADVANCED | What are generators, iterators and async iterators? Where do they show up in Node? |
| Q-JS-30 | Advanced | ADVANCED | How can microtasks starve the event loop, and how does Node treat unhandled rejections? |

**Node.js runtime and internals**

| ID | Difficulty | Tier | Topic |
|----|------------|------|-------|
| Q-NODE-01 | Basic | ESSENTIAL | What is Node.js and how does it differ from browser JavaScript? |
| Q-NODE-02 | Intermediate | ESSENTIAL | Explain V8, libuv and the Node.js runtime architecture. |
| Q-NODE-03 | Basic | ESSENTIAL | Is Node.js single-threaded? Explain precisely. |
| Q-NODE-04 | Basic | ESSENTIAL | Blocking versus non-blocking: what is the difference and what does blocking cost? |
| Q-NODE-05 | Intermediate | ESSENTIAL | Describe the phases of the Node.js event loop. |
| Q-NODE-06 | Advanced | ESSENTIAL | Which asynchronous operations use the OS, the event loop, or the thread pool? |
| Q-NODE-07 | Advanced | ADVANCED | Demonstrate the thread pool limit: what is UV_THREADPOOL_SIZE and how would you tune it? |
| Q-NODE-08 | Intermediate | ESSENTIAL | process.nextTick vs queueMicrotask vs setImmediate vs setTimeout(0). |
| Q-NODE-09 | Advanced | ADVANCED | setTimeout(0) vs setImmediate: why is the order sometimes random? |
| Q-NODE-10 | Intermediate | ESSENTIAL | Worker threads vs cluster vs child_process: what is each for? |
| Q-NODE-11 | Intermediate | ESSENTIAL | Show how to offload a CPU-heavy task to a worker thread. |
| Q-NODE-12 | Intermediate | ESSENTIAL | CommonJS versus ES modules: key differences. |
| Q-NODE-13 | Intermediate | ESSENTIAL | ESM gotchas in Node: __dirname, JSON, dynamic import and extensions. |
| Q-NODE-14 | Intermediate | ESSENTIAL | What is the `process` object? Explain exit codes, signals and events. |
| Q-NODE-15 | Basic | ESSENTIAL | How do you manage configuration and environment variables safely? |
| Q-NODE-16 | Intermediate | ESSENTIAL | What is a Buffer and when do you need it? |
| Q-NODE-17 | Basic | ESSENTIAL | fs callback vs promise vs sync APIs, and reading large files. |
| Q-NODE-18 | Intermediate | ESSENTIAL | What are streams and why use them? |
| Q-NODE-19 | Advanced | ESSENTIAL | What is backpressure and how does Node handle it? |
| Q-NODE-20 | Intermediate | ESSENTIAL | pipe() vs pipeline(): why prefer pipeline? |
| Q-NODE-21 | Intermediate | ESSENTIAL | Write a Transform stream: process a huge CSV or NDJSON file in constant memory. |
| Q-NODE-22 | Intermediate | ESSENTIAL | What is EventEmitter and where is it used in Node? |
| Q-NODE-23 | Intermediate | ESSENTIAL | EventEmitter pitfalls: the 'error' event and listener leaks. |
| Q-NODE-24 | Intermediate | ESSENTIAL | How does V8 manage memory and garbage collection? |
| Q-NODE-25 | Intermediate | ESSENTIAL | What causes memory leaks in Node.js and how do you diagnose one? |
| Q-NODE-26 | Advanced | ADVANCED | What is the heap limit and how do containers affect Node memory? |
| Q-NODE-27 | Intermediate | ESSENTIAL | How do you implement graceful shutdown in a Node HTTP service? |
| Q-NODE-28 | Intermediate | ESSENTIAL | How does Node handle thousands of concurrent connections, and when is Node a bad choice? |
| Q-NODE-29 | Intermediate | ADVANCED | How does module caching work and what are circular dependencies? |
| Q-NODE-30 | Basic | ESSENTIAL | What does Express add over Node's built-in http module? What built-in features should a modern Node developer know? |

**Express.js and API design**

| ID | Difficulty | Tier | Topic |
|----|------------|------|-------|
| Q-EXP-01 | Basic | ESSENTIAL | Walk through the HTTP request-response lifecycle for an API call. |
| Q-EXP-02 | Basic | ESSENTIAL | HTTP methods: safe vs idempotent. Which methods are which? |
| Q-EXP-03 | Intermediate | ESSENTIAL | PUT vs PATCH vs POST: when do you use which? |
| Q-EXP-04 | Basic | ESSENTIAL | Which HTTP status codes do you use and when? |
| Q-EXP-05 | Intermediate | ESSENTIAL | Which HTTP headers matter for APIs? (Content-Type, Accept, Authorization, Cache-Control, ETag) |
| Q-EXP-06 | Intermediate | ESSENTIAL | Cookies: what attributes make them secure? |
| Q-EXP-07 | Basic | ESSENTIAL | What are the REST principles? |
| Q-EXP-08 | Basic | ESSENTIAL | How do you design resource URLs? |
| Q-EXP-09 | Basic | ESSENTIAL | Set up an Express 5 server. What changed from Express 4? |
| Q-EXP-10 | Intermediate | ESSENTIAL | What is middleware and how does the order of middleware matter? |
| Q-EXP-11 | Intermediate | ESSENTIAL | How do you structure an Express app: routes, controllers, services, repositories? |
| Q-EXP-12 | Intermediate | ESSENTIAL | How do you validate requests in Express? Show a schema-based approach. |
| Q-EXP-13 | Intermediate | ESSENTIAL | Validation versus sanitization: what is the difference and where do they apply? |
| Q-EXP-14 | Intermediate | ESSENTIAL | Design centralized error handling in Express. |
| Q-EXP-15 | Intermediate | ESSENTIAL | How are async errors handled in Express 4 versus Express 5? |
| Q-EXP-16 | Intermediate | ESSENTIAL | Operational errors vs programmer errors: how should each be handled? |
| Q-EXP-17 | Intermediate | ESSENTIAL | Write JWT authentication middleware for Express. |
| Q-EXP-18 | Intermediate | ESSENTIAL | Authentication vs authorization in middleware: implement role and ownership checks. |
| Q-EXP-19 | Intermediate | ESSENTIAL | Offset vs cursor pagination: how do you design list endpoints? |
| Q-EXP-20 | Intermediate | ESSENTIAL | How do you implement filtering and sorting safely? |
| Q-EXP-21 | Intermediate | ESSENTIAL | How do you version an API and handle breaking changes? |
| Q-EXP-22 | Intermediate | ESSENTIAL | How do you handle file uploads safely in Express? |
| Q-EXP-23 | Basic | ESSENTIAL | How do you document an API? (OpenAPI / Swagger) |
| Q-EXP-24 | Intermediate | ESSENTIAL | What is CORS and why does the browser block my request? |
| Q-EXP-25 | Intermediate | ESSENTIAL | What is a CORS preflight request and why does it fail? |
| Q-EXP-26 | Intermediate | ESSENTIAL | How do you debug a request that hangs, returns 404 or returns 500? |
| Q-EXP-27 | Basic | ESSENTIAL | How does body parsing work and what limits should you set? |
| Q-EXP-28 | Advanced | ESSENTIAL | How do you make a POST endpoint idempotent (duplicate request protection)? |
| Q-EXP-29 | Intermediate | ESSENTIAL | Rate limiting in Express and the `trust proxy` trap. |
| Q-EXP-30 | Intermediate | ESSENTIAL | What should an API response and error format look like? |

**Databases and SQL queries**

| ID | Difficulty | Tier | Topic |
|----|------------|------|-------|
| Q-SQL-01 | Basic | ESSENTIAL | Explain tables, primary keys, foreign keys and constraints. What relationship types exist? |
| Q-SQL-02 | Basic | ESSENTIAL | Write CRUD queries safely, including safe UPDATE and DELETE habits. |
| Q-SQL-03 | Basic | ESSENTIAL | INNER JOIN, LEFT JOIN and RIGHT JOIN: what is the difference? |
| Q-SQL-04 | Basic | ESSENTIAL | Query: list each order with the customer name and city (join). |
| Q-SQL-05 | Intermediate | ESSENTIAL | Query: customers who have never placed an order. |
| Q-SQL-06 | Intermediate | ESSENTIAL | Query: total spent per customer, including customers with zero spend. |
| Q-SQL-07 | Intermediate | ESSENTIAL | WHERE vs HAVING: find customers with at least two orders. |
| Q-SQL-08 | Intermediate | ESSENTIAL | Query: top 3 products by revenue (multi-table join and aggregation). |
| Q-SQL-09 | Intermediate | ESSENTIAL | Query: monthly revenue report. |
| Q-SQL-10 | Intermediate | ESSENTIAL | Query: second highest salary and the Nth highest salary. |
| Q-SQL-11 | Intermediate | ESSENTIAL | Query: highest paid employee in each department. |
| Q-SQL-12 | Intermediate | ESSENTIAL | Query: employees who earn more than their manager (self join). |
| Q-SQL-13 | Intermediate | ESSENTIAL | Query: find and delete duplicate rows, and prevent them. |
| Q-SQL-14 | Intermediate | ESSENTIAL | Query: latest order per customer. |
| Q-SQL-15 | Intermediate | ESSENTIAL | Subqueries: scalar, correlated, derived tables, and IN vs EXISTS vs JOIN. |
| Q-SQL-16 | Advanced | ESSENTIAL | Window functions: running totals, ranking, LAG. |
| Q-SQL-17 | Advanced | ADVANCED | CTEs and recursive CTEs: query a hierarchy. |
| Q-SQL-18 | Intermediate | ESSENTIAL | NULL handling: NOT IN trap, COUNT(*) vs COUNT(col), and comparisons. |
| Q-SQL-19 | Intermediate | ESSENTIAL | Explain normalization (1NF, 2NF, 3NF) and when to denormalize. |
| Q-SQL-20 | Intermediate | ESSENTIAL | What is an index and how does it speed up queries? What does it cost? |
| Q-SQL-21 | Intermediate | ESSENTIAL | Composite indexes and the leftmost prefix rule: design an index for a query. |
| Q-SQL-22 | Advanced | ESSENTIAL | Covering indexes and why the optimizer ignores your index. |
| Q-SQL-23 | Intermediate | ESSENTIAL | How do you read EXPLAIN output and diagnose a slow query? |
| Q-SQL-24 | Basic | ESSENTIAL | Explain ACID properties with a banking example. |
| Q-SQL-25 | Intermediate | ESSENTIAL | Implement a safe money transfer in Node.js with mysql2 transactions. |
| Q-SQL-26 | Advanced | ESSENTIAL | Isolation levels and concurrency anomalies. |
| Q-SQL-27 | Advanced | ESSENTIAL | What is a deadlock and how do you prevent and handle it? |
| Q-SQL-28 | Advanced | ESSENTIAL | Pessimistic vs optimistic locking, and row, gap and next-key locks. |
| Q-SQL-29 | Intermediate | ESSENTIAL | What is connection pooling and how do you size a MySQL pool? |
| Q-SQL-30 | Intermediate | ESSENTIAL | Why is deep OFFSET pagination slow in SQL and what are the alternatives? |
| Q-SQL-31 | Intermediate | ESSENTIAL | What is the N+1 query problem and how do you fix it? |
| Q-SQL-32 | Intermediate | ESSENTIAL | An endpoint became slow in production. How do you diagnose and fix the database side? |
| Q-SQL-33 | Intermediate | ESSENTIAL | Prevent overselling: stock decrement under concurrency. |
| Q-SQL-34 | Intermediate | ESSENTIAL | SQL injection: how does it happen and how do you prevent it with mysql2? |

**MongoDB**

| ID | Difficulty | Tier | Topic |
|----|------------|------|-------|
| Q-MONGO-01 | Basic | ESSENTIAL | What is MongoDB and what is the document model? |
| Q-MONGO-02 | Basic | ESSENTIAL | SQL vs NoSQL: how do you decide? What trade-offs matter? |
| Q-MONGO-03 | Basic | ESSENTIAL | Write CRUD operations with the Node.js driver. |
| Q-MONGO-04 | Basic | ESSENTIAL | Query operators and projection: write common find queries. |
| Q-MONGO-05 | Intermediate | ESSENTIAL | Update operators: $set, $inc, $push, $pull, $addToSet, upsert. |
| Q-MONGO-06 | Intermediate | ESSENTIAL | Embedding versus referencing: how do you model relationships? |
| Q-MONGO-07 | Intermediate | ESSENTIAL | Unbounded arrays and the 16 MB limit: what is the anti-pattern and the fix? |
| Q-MONGO-08 | Intermediate | ESSENTIAL | Indexes in MongoDB: types and creation. |
| Q-MONGO-09 | Advanced | ESSENTIAL | Compound index order: the ESR rule. |
| Q-MONGO-10 | Intermediate | ESSENTIAL | How do you use explain() and what are COLLSCAN, IXSCAN and covered queries? |
| Q-MONGO-11 | Intermediate | ESSENTIAL | What is the aggregation pipeline? Explain the main stages. |
| Q-MONGO-12 | Intermediate | ESSENTIAL | Aggregation query: total spent per customer with names (using $lookup). |
| Q-MONGO-13 | Intermediate | ESSENTIAL | Aggregation query: revenue per SKU using $unwind. |
| Q-MONGO-14 | Intermediate | ESSENTIAL | Aggregation query: monthly revenue and order count. |
| Q-MONGO-15 | Advanced | ESSENTIAL | How do you optimize aggregation pipelines? |
| Q-MONGO-16 | Intermediate | ESSENTIAL | What is atomicity in MongoDB? Are single operations safe from races? |
| Q-MONGO-17 | Advanced | ESSENTIAL | Multi-document transactions in MongoDB: how, when, and the cost. |
| Q-MONGO-18 | Intermediate | ESSENTIAL | What is a replica set and how do failover and read preference work? |
| Q-MONGO-19 | Advanced | ADVANCED | Write concern and read concern: durability and consistency settings. |
| Q-MONGO-20 | Advanced | ADVANCED | What is sharding and how do you choose a shard key? |
| Q-MONGO-21 | Intermediate | ESSENTIAL | Pagination in MongoDB: skip/limit vs range queries. |
| Q-MONGO-22 | Intermediate | ESSENTIAL | Mongoose vs the native MongoDB driver: when do you use which? |
| Q-MONGO-23 | Intermediate | ESSENTIAL | Mongoose populate: is it a join? What is the cost? |
| Q-MONGO-24 | Intermediate | ESSENTIAL | How should a Node.js app manage MongoDB connections? |
| Q-MONGO-25 | Intermediate | ESSENTIAL | NoSQL injection: how does it happen in Node.js and how do you prevent it? |
| Q-MONGO-26 | Intermediate | ESSENTIAL | Prevent duplicates and handle duplicate-key errors (E11000). |
| Q-MONGO-27 | Advanced | ADVANCED | Schema validation and schema evolution in a flexible-schema database. |
| Q-MONGO-28 | Intermediate | ESSENTIAL | Scenario: choose a database for a marketplace (products, orders, payments, chat). |
| Q-MONGO-29 | Advanced | ADVANCED | Common MongoDB design patterns: bucket, computed, subset and outbox. |
| Q-MONGO-30 | Intermediate | ESSENTIAL | Common MongoDB mistakes in Node.js applications. |

---

# Category 1 -- JavaScript Fundamentals and Asynchronous Programming (`Q-JS-`)

Related notes: Week 1 (all days).

---

### Q-JS-01 | Basic | [ESSENTIAL] | What is an execution context and how does the call stack use it?

**Question:** Explain execution context and the call stack. What happens when a function is called, and what is a stack overflow?

**Interview answer:** An execution context is the environment in which JavaScript code is evaluated. There is a global execution context, and every function call creates a new function execution context. Each context has a creation phase, where variables and functions are registered in its environment and `this` is determined, and an execution phase, where code runs line by line. The call stack is a LIFO structure that tracks which context is currently running: calling a function pushes a context, returning pops it. JavaScript has one call stack per thread, so it can do one thing at a time. If calls nest too deeply, typically through unbounded recursion, the stack runs out of space and throws `RangeError: Maximum call stack size exceeded`.

**Hinglish explanation:** Socho har function call ke liye ek "kamra" banta hai jisme uske variables, `this` aur outer scope ka reference hota hai. Call stack ek plates ka stack hai: naya function call upar rakhte hain, return hone par hata dete hain. Jo plate sabse upar hai wahi chal rahi hoti hai. Backend me ye isliye important hai kyunki Node me bhi single main thread hai: agar stack par koi heavy kaam atka raha, baaki requests wait karengi.

```js
function c() { console.log('c'); }
function b() { c(); console.log('b'); }
function a() { b(); console.log('a'); }
a();
// stack: global -> a -> b -> c, then pops c, b, a
// output: c, b, a

function infinite() { return infinite(); } // no base case
try { infinite(); } catch (e) { console.log(e instanceof RangeError); } // true
```

**Follow-ups:**
- Q: Does a stack overflow crash the Node process? A: A `RangeError` is thrown and can be caught like any error, but a deep recursion in a request handler is still a bug; convert to a loop or use an explicit stack.
- Q: Does JavaScript have tail call optimization? A: It is in the spec but V8 does not implement it, so do not rely on it.
- Q: Where do async callbacks run relative to the stack? A: They are queued and only run when the call stack is empty (see Q-JS-20).

---

### Q-JS-02 | Basic | [ESSENTIAL] | Explain hoisting and the temporal dead zone for var, let and const.

**Question:** What is hoisting? How do `var`, `let`, `const` and function declarations behave differently?

**Interview answer:** Hoisting means declarations are registered in the scope during the creation phase, before code executes. `var` declarations are hoisted and initialized to `undefined`, so reading them early gives `undefined`. `let` and `const` are also hoisted but are not initialized until their declaration line runs; accessing them earlier throws a `ReferenceError`, and that window is the temporal dead zone. Function declarations are hoisted with their body, so they can be called before they appear. Function expressions and arrow functions assigned to a variable follow the rules of that variable. In modern code I use `const` by default, `let` when reassignment is needed, and avoid `var`.

**Hinglish explanation:** Hoisting ka matlab code "upar utha" nahi, bas engine pehle scan karke names scope me daal deta hai. `var` ka naam `undefined` ke saath ready milta hai, isliye bug chhup jata hai. `let/const` ka naam to hota hai par declaration tak "use mat karo" zone me hota hai (TDZ), isliye error aata hai - jo actually acchi baat hai kyunki bug jaldi pakda jata hai.

```js
console.log(a); // undefined (var hoisted + initialized)
var a = 1;

try { console.log(b); } catch (e) { console.log(e.name); } // ReferenceError (TDZ)
let b = 2;

hello(); // works: function declaration is fully hoisted
function hello() { console.log('hi'); }

try { world(); } catch (e) { console.log(e.name); } // TypeError: world is not a function
var world = function () {};
```

**Follow-ups:**
- Q: Why `TypeError` for `world()` and not `ReferenceError`? A: `world` exists (var, value `undefined`), but calling `undefined` is a type error.
- Q: Is `typeof` safe in TDZ? A: No; `typeof b` before `let b` also throws, unlike `typeof` on an undeclared name.
- Q: Are `class` declarations hoisted? A: Yes, but they behave like `let` (TDZ).

---

### Q-JS-03 | Basic | [ESSENTIAL] | What is a closure and where do you use it in backend code?

**Question:** What is a closure? Give a practical backend example.

**Interview answer:** A closure is a function that retains access to the variables of the scope where it was created, even after that outer function has returned. The inner function keeps a reference to the lexical environment, not a copy of the values. In backend code closures are everywhere: middleware factories such as `rateLimit({ max: 5 })` that return a handler remembering its options, private state like counters or caches, memoization, and callbacks that remember a request id. The downside is that a closure can keep large objects alive, which can cause memory leaks if the closure itself is retained, for example in a long-lived cache or an event listener.

**Hinglish explanation:** Closure = function + uska "yaad" kiya hua outer environment. Outer function khatam ho gaya, par inner function ko abhi bhi us scope ke variables dikhte hain. React me `useState` ke saath stale closure wala bug dekha hoga - wahi concept hai. Backend me middleware factory sabse common example hai: `requireRole('admin')` ek function return karta hai jo `'admin'` ko yaad rakhta hai.

```js
// Middleware factory: closure over `role`
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Private counter
function createCounter() {
  let count = 0;                 // not accessible from outside
  return { inc: () => ++count, get: () => count };
}
const c = createCounter();
c.inc(); c.inc();
console.log(c.get()); // 2
```

**Follow-ups:**
- Q: Does a closure copy the variable? A: No, it holds a live reference to the binding; if the variable changes, the closure sees the new value.
- Q: How can closures leak memory? A: If a long-lived object (module-level array, emitter listener) holds a function that closes over a big object, that object cannot be garbage collected.
- Q: Frontend equivalent? A: Stale state in `useEffect` callbacks is a closure capturing an old render's variables.

---

### Q-JS-04 | Intermediate | [ESSENTIAL] | Predict the output: closures in loops with var and let.

**Question:** What does this print, and why? How do you fix the `var` version?

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log('var', i), 0);
for (let j = 0; j < 3; j++) setTimeout(() => console.log('let', j), 0);
```

**Interview answer:** It prints `var 3` three times and then `let 0`, `let 1`, `let 2`. `var` is function scoped, so there is a single `i` shared by all callbacks, and by the time the timers fire the loop has finished with `i === 3`. `let` is block scoped and, in a `for` loop, a fresh binding is created per iteration, so each callback closes over its own `j`. To fix the `var` version, use `let`, or wrap the body in an IIFE that receives `i` as a parameter, or use `forEach`.

**Hinglish explanation:** `var` me ek hi dabba `i` hai jo sab callbacks share karte hain. Timer baad me chalta hai jab loop khatam ho chuka hota hai aur `i = 3`. `let` har iteration ke liye naya dabba banata hai, isliye har callback ko apni value milti hai. Ye question closure + event loop dono check karta hai.

```js
for (var i = 0; i < 3; i++) {
  ((n) => setTimeout(() => console.log('fixed', n), 0))(i); // IIFE captures current value
}
// fixed 0, fixed 1, fixed 2
```

**Follow-ups:**
- Q: Does the output change with a delay of 100 ms? A: No, ordering of values is the same; only timing changes.
- Q: Does `let` really create a copy per iteration? A: The spec creates a new binding per iteration and copies the previous value into it, then runs the increment on the new one.

---

### Q-JS-05 | Basic | [ESSENTIAL] | What is lexical scope and the scope chain?

**Question:** Explain lexical scope. How does JavaScript resolve a variable name?

**Interview answer:** JavaScript uses lexical (static) scope: which variables a function can access is decided by where it is written in the source, not where it is called from. When resolving an identifier, the engine looks in the current scope, then the enclosing scope, and so on up to the global scope; this is the scope chain. The first match wins, which is why an inner variable can shadow an outer one. If nothing is found, a `ReferenceError` is thrown. Block scope (`let`, `const`) and function scope (`var`) are the two main local scope types; modules also have their own module scope, so top-level variables in an ES module are not global.

**Hinglish explanation:** Function kahan likha gaya hai, wahi decide karta hai kaun se variables dikhenge - kahan se call hua usse farq nahi padta. Variable dhundhne ka tareeka: pehle apna scope, phir bahar wala, phir aur bahar, global tak. Node me ek bonus point: file ke top-level variables global nahi hote, module scope me rehte hain.

```js
const x = 'global';
function outer() {
  const x = 'outer';
  function inner() { console.log(x); } // finds 'outer' via scope chain
  return inner;
}
function caller() {
  const x = 'caller';
  outer()(); // still prints 'outer', not 'caller'
}
caller();
```

**Follow-ups:**
- Q: Does JavaScript have dynamic scope anywhere? A: Not for variables; `this` behaves somewhat dynamically, which is a separate mechanism (Q-JS-06).
- Q: What is variable shadowing? A: An inner declaration with the same name hides the outer one; linters warn because it hurts readability.

---

### Q-JS-06 | Intermediate | [ESSENTIAL] | How is `this` determined in JavaScript?

**Question:** Explain the rules that decide the value of `this`.

**Interview answer:** For regular functions, `this` is determined at call time. The rules in priority order: `new` binding (a new object), explicit binding via `call`, `apply` or `bind`, implicit binding (the object before the dot, `obj.method()`), and default binding, which is `undefined` in strict mode and modules, or the global object in sloppy mode. Arrow functions do not have their own `this`; they capture it lexically from the enclosing scope, and `call`, `apply` and `bind` cannot change it. In ES modules and classes code is strict, so a detached method call gives `undefined` for `this`, which is the common source of "Cannot read properties of undefined".

**Hinglish explanation:** `this` ka matlab hai "ye function kis object ke upar chala". Dot ke pehle jo object hai wahi `this`. Agar method ko alag variable me nikal ke call kiya, dot gaya, `this` gaya. Arrow function me apna `this` hota hi nahi, wo bahar wale se udhaar leta hai - isliye callbacks me arrow functions pasand kiye jaate hain.

```js
const user = {
  name: 'Asha',
  regular() { return this?.name; },
  arrow: () => typeof this,          // module top-level: this is undefined
  delayed() { setTimeout(() => console.log(this.name), 0); } // arrow keeps this = user
};
console.log(user.regular());   // 'Asha'
const f = user.regular;
console.log(f());              // undefined (default binding, strict mode in ESM)
user.delayed();                // 'Asha'
```

**Follow-ups:**
- Q: What is `this` at the top level of an ES module? A: `undefined`. In CommonJS it is `module.exports`.
- Q: Why do class methods passed as callbacks lose `this`? A: They are detached from the instance; bind in the constructor, use a class-field arrow function, or pass an arrow wrapper.
- Q: Can you rebind an arrow function with `bind`? A: No, `bind` returns a function but the lexical `this` stays.

---


### Q-JS-07 | Intermediate | [ESSENTIAL] | call, apply, bind: what do they do and when do you need them?

**Question:** Compare `call`, `apply` and `bind`. Give a case where `bind` fixes a real bug.

**Interview answer:** All three set `this` explicitly. `call(thisArg, a, b)` invokes the function immediately with arguments listed one by one. `apply(thisArg, [a, b])` invokes immediately with an array of arguments. `bind(thisArg, a)` does not invoke; it returns a new function with `this` (and optionally leading arguments) permanently fixed. `bind` is useful when passing a method as a callback, because otherwise the method loses its object. In modern code spread syntax replaced most `apply` uses, and arrow functions replaced many `bind` uses.

**Hinglish explanation:** Teeno ka kaam: "is function ko is object ke saath chalao". `call` aur `apply` turant chalate hain (farak: arguments alag-alag ya array me). `bind` function ko turant nahi chalata, ek naya function deta hai jisme `this` lock ho chuka hota hai.

```js
class Mailer {
  constructor() { this.from = 'noreply@shop.test'; this.send = this.send.bind(this); }
  send(to) { return `${this.from} -> ${to}`; }
}
const m = new Mailer();
const send = m.send;              // detached
console.log(send('a@b.com'));     // works only because of bind in constructor

function greet(greeting, punct) { return `${greeting}, ${this.name}${punct}`; }
console.log(greet.call({ name: 'Ravi' }, 'Hi', '!'));
console.log(greet.apply({ name: 'Ravi' }, ['Hi', '!']));
```

**Follow-ups:**
- Q: What does `bind` do when called twice? A: The first bind wins; later binds cannot change `this`.
- Q: How does `Math.max.apply(null, arr)` compare to `Math.max(...arr)`? A: Same result; spread is clearer. Both can overflow the stack for very large arrays (hundreds of thousands of items).

---

### Q-JS-08 | Basic | [ESSENTIAL] | Arrow functions versus regular functions.

**Question:** What are the differences between arrow and regular functions? When would you not use an arrow function?

**Interview answer:** Arrow functions have no own `this`, no own `arguments`, no `prototype`, cannot be used with `new`, and cannot be generators. Their `this` is lexical. Regular functions have dynamic `this`, an `arguments` object, and can be constructors. I use arrows for callbacks, array methods and short helpers where I want to keep the outer `this`. I avoid arrows for object methods that rely on `this`, for constructors, and for prototype methods. Arrows also have a shorter syntax with implicit return, but that is a convenience, not the main semantic difference.

**Hinglish explanation:** Arrow function ka sabse bada fark `this` hai: wo bahar se le leta hai. Isliye `setTimeout`, `.map()`, promise callbacks me arrow best hai. Lekin object ke method me `this.name` chahiye to regular method likho, warna `this` upar wale scope ka aa jayega.

```js
const counter = {
  count: 0,
  incBad: () => { this.count++; },   // this is NOT counter (module scope)
  incGood() { this.count++; },
};
counter.incGood();
console.log(counter.count); // 1
const Fn = () => {};
try { new Fn(); } catch (e) { console.log(e.name); } // TypeError
```

**Follow-ups:**
- Q: Do arrow functions have `arguments`? A: No; use rest parameters `(...args)`.
- Q: Does an arrow function make code faster? A: No meaningful difference; choose for semantics.

---

### Q-JS-09 | Intermediate | [ESSENTIAL] | Explain the prototype chain and prototypal inheritance.

**Question:** How does property lookup work through prototypes? What is the difference between `__proto__` and `prototype`?

**Interview answer:** Every object has an internal link, `[[Prototype]]`, to another object or `null`. When a property is read, the engine looks on the object itself, then follows the link up the chain until it finds the property or reaches `null`, at which point the result is `undefined`. Writes normally create or update an own property on the object itself, so the prototype is not modified. `prototype` is a property on constructor functions: objects created with `new Fn()` get their `[[Prototype]]` set to `Fn.prototype`. `__proto__` is the legacy accessor to an object's `[[Prototype]]`; I would use `Object.getPrototypeOf` instead. Methods placed on the prototype are shared by all instances, which saves memory.

**Hinglish explanation:** Object me property nahi mili to wo apne "parent object" me dhundhta hai, phir uske parent me, aur aise chain chalti rehti hai `null` tak. `prototype` function ka property hai (blueprint object jo instances ko milega), aur `__proto__` instance ka link hai us blueprint tak. Class based languages se alag: yaha objects directly objects se inherit karte hain.

```js
function User(name) { this.name = name; }
User.prototype.greet = function () { return `Hi ${this.name}`; };

const u = new User('Asha');
console.log(u.greet());                                   // found on User.prototype
console.log(Object.getPrototypeOf(u) === User.prototype); // true
console.log(Object.hasOwn(u, 'greet'));                   // false (inherited)
console.log(Object.getPrototypeOf(User.prototype) === Object.prototype); // true
```

**Follow-ups:**
- Q: What is at the end of the chain? A: `Object.prototype`, whose prototype is `null`.
- Q: What is prototype pollution? A: Attacker-controlled keys such as `__proto__` merged into objects can modify `Object.prototype`, affecting all objects; avoid unsafe deep-merge, use `Object.create(null)` or `Map` for dictionaries, and validate input.
- Q: Why not put methods inside the constructor? A: Each instance would get its own copy of the function.

---

### Q-JS-10 | Intermediate | [ESSENTIAL] | Are JavaScript classes real classes? How do they relate to prototypes?

**Question:** What does the `class` keyword actually do? How does `extends` work?

**Interview answer:** `class` is syntactic sugar over constructor functions and prototypes, with some extra rules: class bodies are strict, class constructors cannot be called without `new`, methods are non-enumerable, and there is support for `#private` fields, static members and `super`. Methods defined in the class body live on `ClassName.prototype`. `extends` sets up two links: `Child.prototype`'s prototype points to `Parent.prototype` so instance methods are inherited, and `Child`'s own prototype points to `Parent` so static members are inherited. In a derived constructor you must call `super()` before using `this`.

**Hinglish explanation:** `class` naya system nahi hai, wahi prototype chain hai, bas likhna aasan. Method `Class.prototype` par jata hai. `extends` se child ka prototype parent ke prototype se jud jata hai. Derived class me `super()` pehle call karna padta hai, kyunki `this` parent constructor hi banata hai.

```js
class Account {
  #balance = 0;                       // truly private
  constructor(owner) { this.owner = owner; }
  deposit(n) { this.#balance += n; return this; }
  get balance() { return this.#balance; }
}
class SavingsAccount extends Account {
  constructor(owner, rate) { super(owner); this.rate = rate; }
}
const s = new SavingsAccount('Ravi', 0.04).deposit(100);
console.log(s.balance, s instanceof Account);                    // 100 true
console.log(typeof Account, Object.hasOwn(s, 'deposit'));        // function false
```

**Follow-ups:**
- Q: Composition or inheritance in backend code? A: Prefer composition (services receiving dependencies); inheritance only for a stable "is-a" such as custom error classes extending `Error`.
- Q: What is `#private` versus `_private`? A: `#` is enforced by the engine; underscore is only a naming convention.

---

### Q-JS-11 | Intermediate | [ADVANCED] | Object.create, own versus inherited properties, and shadowing.

**Question:** What does `Object.create` do? How do you iterate only own properties and why does it matter?

**Interview answer:** `Object.create(proto)` creates a new object whose `[[Prototype]]` is `proto`; `Object.create(null)` creates an object with no prototype, which is useful as a safe dictionary because keys such as `toString` or `__proto__` do not collide with inherited members. `for...in` iterates enumerable properties including inherited ones, so it can surprise; prefer `Object.keys`, `Object.entries` or `Object.hasOwn(obj, key)` to limit to own properties. Assigning a property that exists only on the prototype creates an own property that shadows it; it does not change the prototype.

**Hinglish explanation:** `Object.create(null)` ek bilkul khaali object deta hai, jisme koi inherited cheez nahi, isliye user-supplied keys store karne ke liye safe hai. `for...in` parent chain ki properties bhi dikha deta hai, isliye `Object.keys/entries` use karo.

```js
const base = { kind: 'base' };
const child = Object.create(base);
child.kind = 'child';                 // shadows, base.kind unchanged
console.log(base.kind, child.kind);   // base child

const dict = Object.create(null);
dict['__proto__'] = 'safe';           // plain own key here
console.log(Object.keys(dict));       // [ '__proto__' ]

for (const k in Object.create({ inherited: 1 })) console.log(k); // inherited
```

**Follow-ups:**
- Q: `hasOwnProperty` versus `Object.hasOwn`? A: `Object.hasOwn` (Node 16.9+) works even for null-prototype objects and cannot be overridden by an own `hasOwnProperty` key.
- Q: Map versus plain object as a dictionary? A: `Map` allows any key type, keeps insertion order, has `size`, and has no prototype issues.

---

### Q-JS-12 | Basic | [ESSENTIAL] | `==` versus `===`, truthy and falsy values, and common coercion traps.

**Question:** What is the difference between `==` and `===`? Which values are falsy? What goes wrong with `||` for defaults?

**Interview answer:** `===` compares without type coercion; `==` coerces operands first, which produces surprising results, so I use `===` by default. The only common intentional `==` is `x == null`, which matches both `null` and `undefined`. The falsy values are `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` and `NaN`; everything else, including `"0"`, `[]` and `{}`, is truthy. Using `||` for defaults is risky because valid values like `0` or an empty string are replaced; the nullish coalescing operator `??` only falls back for `null` and `undefined`. For example `const limit = req.query.limit ?? 10` keeps `0` if provided.

**Hinglish explanation:** `==` pehle types badalta hai, phir compare karta hai - isliye `'0' == false` true ho jata hai. `===` seedha strict. Default value dene me `||` galat ho sakta hai: `count || 10` me `count = 0` ho to 10 mil jayega. `??` sirf `null/undefined` par fallback deta hai.

```js
console.log(0 == '', null == undefined, null === undefined); // true true false
console.log(NaN === NaN, Number.isNaN(NaN), Object.is(NaN, NaN)); // false true true
const qty = 0;
console.log(qty || 5, qty ?? 5);        // 5 0
console.log([] == false, !![]);         // true true  (surprising: avoid ==)
```

**Follow-ups:**
- Q: How do you check for a real array? A: `Array.isArray(x)`.
- Q: What does `typeof null` return? A: `'object'`, a historical bug kept for compatibility.

---

### Q-JS-13 | Basic | [ESSENTIAL] | Primitives versus references: what does assignment copy?

**Question:** Explain value versus reference semantics, with an example of a bug caused by shared references.

**Interview answer:** Primitives (string, number, boolean, null, undefined, symbol, bigint) are immutable and are copied by value on assignment. Objects, arrays and functions are stored by reference: assignment copies the reference, so two variables point to the same object and a mutation through one is visible through the other. Function arguments are passed by value, but for objects that value is a reference, so a function can mutate the caller's object though reassigning the parameter does not affect the caller. A typical bug is a shared default object or a cached config that one request handler mutates, which leaks state across requests.

**Hinglish explanation:** Number/string ki copy bantti hai, object ka sirf "address" copy hota hai. Isliye `const b = a` ke baad `b.x = 1` karne par `a.x` bhi badal jata hai. Server me ye khatarnak hai kyunki module-level object saari requests share karti hain.

```js
const a = { cart: [] };
const b = a;
b.cart.push('item');
console.log(a.cart.length);      // 1 (same object)

function reset(obj) { obj = { cart: [] }; }   // reassigns local param only
reset(a);
console.log(a.cart.length);      // still 1

// shared-state bug
const defaults = { retries: 3 };
export function makeOptions(o) { return Object.assign(defaults, o); }   // [X] mutates shared defaults
export function makeOptionsSafe(o) { return { ...defaults, ...o }; }    // [OK] new object
```

**Follow-ups:**
- Q: Is JavaScript pass-by-reference? A: No, it is pass-by-value where the value of an object variable is a reference ("call by sharing").
- Q: How do you compare two objects for equality? A: Not with `===` (identity). Compare fields, or use `node:util` `isDeepStrictEqual` or `assert.deepStrictEqual`.

---

### Q-JS-14 | Intermediate | [ESSENTIAL] | Shallow copy versus deep copy; how do you clone safely?

**Question:** What is the difference between shallow and deep copy? What are the options and limitations of `structuredClone` and `JSON.parse(JSON.stringify())`?

**Interview answer:** A shallow copy, such as spread `{...obj}`, `Object.assign` or `Array.prototype.slice`, copies only top-level properties; nested objects are still shared. A deep copy duplicates the whole nested structure. `structuredClone` (Node 17+) is the built-in deep clone: it handles nested objects, arrays, `Date`, `Map`, `Set`, `RegExp`, typed arrays and circular references, but throws on functions and does not preserve prototypes or class instances. The `JSON` trick drops `undefined`, functions and symbols, turns `Date` into strings, converts `NaN` to `null`, and fails on circular references and `BigInt`, so I avoid it for anything but plain JSON-safe data.

**Hinglish explanation:** Shallow copy me upar ka level naya hota hai par andar ke objects wahi purane. Deep copy me sab kuch naya. `structuredClone` aaj ka best built-in hai. JSON wala jugaad `Date` ko string bana deta hai aur functions gayab kar deta hai - interview me ye limitations bolna plus point hai.

```js
const order = { id: 1, items: [{ sku: 'A', qty: 1 }], at: new Date() };

const shallow = { ...order };
shallow.items[0].qty = 99;
console.log(order.items[0].qty);          // 99 (shared!)

const deep = structuredClone(order);
deep.items[0].qty = 1;
console.log(order.items[0].qty);          // 99 (unchanged by deep)
console.log(deep.at instanceof Date);     // true

console.log(JSON.parse(JSON.stringify(order)).at instanceof Date); // false (string)
```

**Follow-ups:**
- Q: What does `structuredClone` do with a class instance? A: Returns a plain object; methods and prototype are lost.
- Q: Why avoid deep clone on hot paths? A: It is O(size of the structure) and allocates a lot; prefer immutable updates of only the changed branch.

---


### Q-JS-15 | Basic | [ESSENTIAL] | Does `const` make an object immutable? How do you get real immutability?

**Question:** What does `const` guarantee? What about `Object.freeze`?

**Interview answer:** `const` prevents reassignment of the binding; it does not make the value immutable, so a `const` object or array can still be mutated. `Object.freeze` makes an object shallowly immutable: adding, deleting or changing own properties silently fails in sloppy mode and throws a `TypeError` in strict mode (modules and classes). It is shallow, so nested objects remain mutable unless frozen recursively. For application state I prefer producing new objects with spread or `structuredClone` rather than relying on freezing, and I use freezing for constants such as config enums.

**Hinglish explanation:** `const` sirf variable ka naam lock karta hai, andar ka object badal sakta hai. `Object.freeze` upar ka level lock karta hai, par andar ke nested objects phir bhi badle ja sakte hain.

```js
const cfg = Object.freeze({ roles: ['admin'], limits: { max: 5 } });
try { cfg.x = 1; } catch (e) { console.log(e.name); }   // TypeError (ESM is strict)
cfg.roles.push('user');                                  // allowed: freeze is shallow
console.log(cfg.roles);                                  // [ 'admin', 'user' ]
```

**Follow-ups:**
- Q: `freeze` versus `seal` versus `preventExtensions`? A: `seal` blocks add/delete but allows value changes; `preventExtensions` only blocks adding; `freeze` blocks all three.
- Q: How do you do an immutable update? A: `const next = { ...state, items: [...state.items, item] }`.

---

### Q-JS-16 | Intermediate | [ESSENTIAL] | Use map, filter and reduce to transform backend data (group, index, aggregate).

**Question:** Given an array of orders, compute total revenue per customer and an index by id. When is `reduce` the wrong choice?

**Interview answer:** `map` transforms each element, `filter` selects elements, and `reduce` folds an array into any single value such as an object, number or Map. To aggregate revenue per customer I reduce into an object or, better, a `Map`, adding each order's amount to its customer's total. To index by id I can use `Object.fromEntries(orders.map(o => [o.id, o]))` or a `Map`. `reduce` is the wrong choice when it makes the code harder to read than a simple `for...of` loop, or when chaining many `map/filter` passes on a very large array creates unnecessary intermediate arrays. Node 21+ also has `Object.groupBy` and `Map.groupBy` for grouping, which are available in Node 22 LTS but not Node 20.

**Hinglish explanation:** `map` = har item ko badlo, `filter` = kuch items rakho, `reduce` = poore array ko ek value me compress karo. Backend me daily kaam: orders ko customer ke hisaab se group karna, id se lookup table banana. Agar reduce samajhne me mushkil ho raha hai to simple `for...of` likho - readability pehle.

```js
const orders = [
  { id: 1, customer: 'A', amount: 100, status: 'paid' },
  { id: 2, customer: 'B', amount: 50,  status: 'paid' },
  { id: 3, customer: 'A', amount: 30,  status: 'refunded' },
];

const revenue = orders
  .filter(o => o.status === 'paid')
  .reduce((acc, o) => acc.set(o.customer, (acc.get(o.customer) ?? 0) + o.amount), new Map());
console.log(revenue);                       // Map(2) { 'A' => 100, 'B' => 50 }

const byId = new Map(orders.map(o => [o.id, o]));
console.log(byId.get(2).amount);            // 50

// Node 21+ (use only if your runtime is 22 LTS)
const grouped = Object.groupBy(orders, o => o.customer);
console.log(Object.keys(grouped));          // [ 'A', 'B' ]
```

**Follow-ups:**
- Q: Why pass an initial value to `reduce`? A: Without it, an empty array throws a `TypeError`, and the first element is used as accumulator, which changes types silently.
- Q: Does `sort` mutate? A: Yes, in place; use `toSorted` (Node 20+) or copy first. Without a comparator, `sort` compares as strings, so `[10, 9, 1].sort()` gives `[1, 10, 9]`.
- Q: Complexity of `includes` in a loop? A: O(n*m); build a `Set` first for O(n+m).

---

### Q-JS-17 | Basic | [ESSENTIAL] | What is a Promise? Explain its states and chaining.

**Question:** What problem do promises solve? Explain pending, fulfilled, rejected, and how `then` chaining works.

**Interview answer:** A Promise represents the eventual result of an asynchronous operation. It starts as pending and settles exactly once, either fulfilled with a value or rejected with a reason; after that it never changes. `then(onFulfilled, onRejected)` always returns a new promise, which is why chaining works: whatever a handler returns becomes the fulfillment value of the next promise, and if it returns another promise the chain waits for it. A thrown error or rejected promise skips forward to the next `catch`. Promises flatten the "callback hell" nesting and give a standard way to compose and handle errors, and handlers always run asynchronously as microtasks.

**Hinglish explanation:** Promise ek "token" hai jo kehta hai: "result abhi nahi hai, aayega ya fail hoga". Teen state: pending, fulfilled, rejected. Ek baar settle hua to badalta nahi. `then` har baar naya promise return karta hai, isliye chain bana sakte ho. Handler ka return value agle step ko mil jata hai.

```js
const delay = (ms, v) => new Promise(res => setTimeout(() => res(v), ms));

delay(10, 2)
  .then(n => n * 2)                 // returns plain value -> 4
  .then(n => delay(10, n + 1))      // returns promise -> chain waits -> 5
  .then(n => { console.log(n); })   // 5, returns undefined
  .then(v => console.log(v));       // undefined
```

**Follow-ups:**
- Q: What if you forget to `return` inside a `then`? A: The next step receives `undefined` and does not wait for the inner promise (a classic bug).
- Q: What is the "promise constructor anti-pattern"? A: Wrapping an existing promise in `new Promise(...)` unnecessarily; just return the promise.
- Q: Can a promise resolve twice? A: Only the first `resolve` or `reject` call counts.

---

### Q-JS-18 | Intermediate | [ESSENTIAL] | How do errors propagate in promise chains? catch versus finally.

**Question:** Predict the output and explain error propagation, `catch` and `finally`.

```js
Promise.resolve(1)
  .then(v => { throw new Error('boom'); })
  .then(() => console.log('skipped'))
  .catch(e => { console.log('caught', e.message); return 5; })
  .finally(() => console.log('cleanup'))
  .then(v => console.log('value', v));
```

**Interview answer:** The output is `caught boom`, `cleanup`, `value 5`. A throw inside `then` turns that step's promise into a rejection; rejection handlers are skipped by `then(onFulfilled)` steps until a `catch` handles it. A `catch` that returns a value recovers the chain, so the following steps are fulfilled with that value. `finally` runs regardless of outcome, receives no argument, and passes through the previous value or rejection unchanged unless the `finally` callback itself throws or returns a rejected promise. I put `catch` at the end of a chain for central handling and rethrow when a step cannot actually recover.

**Hinglish explanation:** Error aaya to chain me beech ke saare `then` skip ho jate hain jab tak koi `catch` na mile. `catch` agar value return kare to chain wapas normal ho jati hai. `finally` cleanup ke liye hai (loader band karna, connection release karna) aur value ko jaise ka taisa aage jaane deta hai.

```js
// rethrow when you cannot really recover
fetchUser().catch(err => {
  if (err.code === 'NOT_FOUND') return null;   // expected case, recover
  throw err;                                    // unexpected: let upper layer handle
});
```

**Follow-ups:**
- Q: `.then(a, b)` versus `.then(a).catch(b)`? A: In the first form `b` does not catch errors thrown by `a`; the second does.
- Q: What is an unhandled rejection? A: A rejected promise with no handler by the end of the microtask drain; in Node 15+ it crashes the process by default (`--unhandled-rejections=throw`), so always handle or `await` inside try/catch.

---

### Q-JS-19 | Intermediate | [ESSENTIAL] | How does async/await work, and when should awaits run in parallel?

**Question:** What do `async` and `await` actually do? How do you avoid accidentally serial code?

**Interview answer:** An `async` function always returns a promise. `await` pauses only that function, not the thread: it suspends the function, lets the call stack unwind, and resumes the function as a microtask when the awaited promise settles. Rejections become thrown exceptions at the `await` point, so `try/catch` works. It is syntactic sugar over promises and generators-like state machines. Awaiting independent operations one after another makes them run serially and adds up latency; for independent work I start all promises first and await them together with `Promise.all`. For dependent steps, sequential awaits are correct.

**Hinglish explanation:** `await` function ko beech me "pause" karta hai, par server ko block nahi karta - baaki requests chalti rehti hain. Galti: do independent DB calls ko ek ke baad ek `await` karna, total time = t1 + t2. `Promise.all` se t = max(t1, t2). Interview me ye "N+1 sequential awaits" bahut poochhte hain.

```js
// [X] serial: ~ t1 + t2
const user = await getUser(id);
const orders = await getOrders(id);

// [OK] parallel: ~ max(t1, t2)
const [user2, orders2] = await Promise.all([getUser(id), getOrders(id)]);

// await in a loop is serial; use Promise.all with map when order does not matter
const results = await Promise.all(ids.map(id => getUser(id)));
```

**Follow-ups:**
- Q: Is `return await` different from `return` inside try/catch? A: Yes: `return await p` inside `try` lets the `catch` handle the rejection; plain `return p` does not.
- Q: Does `await` work at top level? A: In ES modules, yes (top-level await); not in CommonJS.
- Q: Is unbounded `Promise.all` over 10,000 items safe? A: No, it can exhaust DB connections or sockets; use a concurrency limit (Q-JS-24).

---

### Q-JS-20 | Intermediate | [ESSENTIAL] | Explain the JavaScript event loop: call stack, microtasks and macrotasks.

**Question:** How can single-threaded JavaScript handle async work? What is the order between microtasks and macrotasks?

**Interview answer:** JavaScript runs your code on one thread with one call stack. Asynchronous operations such as timers and I/O are handled outside the stack (by the host, e.g. libuv in Node), and when they complete their callbacks are queued. The event loop picks queued callbacks and runs them only when the call stack is empty. There are two main kinds of queues: macrotasks (timers, I/O callbacks, `setImmediate`) and microtasks (promise reactions, `queueMicrotask`). After each macrotask, and after the main script finishes, the engine drains the entire microtask queue before moving on. Therefore a resolved promise's `.then` always runs before the next `setTimeout` callback, even with a 0 ms delay. In Node, `process.nextTick` has its own queue that is processed before the promise microtask queue (with the ES module top-level exception shown below).

**Hinglish explanation:** Ek hi thread hai, par kaam "baad me" karne ka system hai: timer/network wale kaam bahar OS handle karta hai, jab ready ho to callback line me lag jata hai. Event loop dekhta hai: stack khaali? to agla callback uthao. VIP line = microtasks (promises): har kaam ke baad ye poori line khaali hoti hai, tab kahin jakar agla timer/I/O callback chalta hai.

```js
console.log('start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('end');
// CommonJS: start, end, nextTick, promise, timeout
// ES module: start, end, promise, nextTick, timeout
// (an ES module is itself evaluated inside a promise job, so the microtask queue drains first;
//  inside a normal callback, e.g. after an fs read, nextTick runs before promise microtasks)
```

**Follow-ups:**
- Q: Does `setTimeout(fn, 0)` run in 0 ms? A: No, at least about 1 ms and only after the stack is empty and microtasks are drained.
- Q: How does this differ from the browser? A: Same idea, but Node's loop has distinct phases (timers, poll, check) and `nextTick`; see Q-NODE-08 and Q-NODE-09.
- Q: Why are microtasks dangerous in a loop? A: A microtask that keeps scheduling another microtask starves timers and I/O (Q-JS-30).

---

### Q-JS-21 | Intermediate | [ESSENTIAL] | Output prediction: timers, promises and synchronous code.

**Question:** What is the output, in order?

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve()
  .then(() => console.log('C'))
  .then(() => console.log('D'));
setTimeout(() => console.log('E'), 0);
console.log('F');
```

**Interview answer:** The output is `A`, `F`, `C`, `D`, `B`, `E`. Synchronous code runs first, printing `A` and `F`. The two timers are registered and the promise reaction `C` is queued as a microtask. When the script finishes the microtask queue drains completely: `C` runs and queues `D`, which also runs before any timer. Then the timer callbacks run in order of registration, `B` and `E`. The key rule is that all microtasks, including ones queued by microtasks, drain before the next macrotask.

**Hinglish explanation:** Pehle sync code (`A`, `F`). Phir microtask queue poori khaali hogi - `C` ke andar se `D` aaya, wo bhi isi round me. Uske baad timers (`B`, `E`). Trick: "micro pehle, macro baad me".

```js
// Variation: what changes if D is created with setTimeout instead of then?
// A, F, C, B, E, D  -> D becomes a macrotask queued after B and E
```

**Follow-ups:**
- Q: If both timers had different delays (0 and 10)? A: The 0 ms one first; ordering follows expiry time, then registration order.
- Q: What if the first timer's callback creates a promise? A: Its microtask runs right after that callback, before the second timer callback (Node 11+ behavior matches browsers).

---

### Q-JS-22 | Advanced | [ESSENTIAL] | Output prediction: async functions and ordering of `await`.

**Question:** What is the output?

```js
async function a() { console.log('a1'); await b(); console.log('a2'); }
async function b() { console.log('b'); }
console.log('s');
setTimeout(() => console.log('t'), 0);
a();
new Promise(r => { console.log('p1'); r(); }).then(() => console.log('p2'));
console.log('e');
```

**Interview answer:** The output is `s`, `a1`, `b`, `p1`, `e`, `a2`, `p2`, `t`. `s` prints first. `a()` runs synchronously until its first `await`, so `a1` and then `b` print (calling `b()` runs its body synchronously). The `await` schedules the rest of `a` as a microtask. The Promise executor is synchronous, so `p1` prints and its `.then` is queued after `a`'s continuation. `e` prints, the stack empties, and the microtasks run in queue order, `a2` then `p2`, followed by the timer `t`. The important rule is that code before the first `await` is synchronous, and awaiting an already-resolved native promise costs one microtask tick.

**Hinglish explanation:** `async` function ka body tab tak normal sync chalta hai jab tak pehla `await` na aaye. `await` ke baad ka code microtask ban jata hai. Queue me `a2` pehle aaya, `p2` baad me, isliye wahi order. `t` sabse last kyunki wo macrotask hai.

**Follow-ups:**
- Q: What if `b` returned a promise created with `new Promise(r => setTimeout(r, 0))`? A: `a2` would be delayed until that timer fires, so order becomes `... e, p2, t, a2` (timer `t` was registered first).
- Q: Why did old engines show different orders for `await`? A: Before V8 7.2 / Node 12, `await` took three microtask ticks; modern Node takes one for native promises. Interviewers usually test the modern behavior.

---


### Q-JS-23 | Intermediate | [ESSENTIAL] | Promise.all vs allSettled vs race vs any: when do you use each?

**Question:** Compare the four promise combinators with a backend use case for each.

**Interview answer:** `Promise.all` resolves with an array of all results, in input order, and rejects immediately with the first rejection; use it when all results are required, such as loading user, orders and settings for one response. `Promise.allSettled` waits for everything and returns `{ status, value | reason }` objects, never rejecting; use it for best-effort work such as sending notifications to several channels and reporting which failed. `Promise.race` settles as soon as the first promise settles, whether fulfilled or rejected; I use it to implement timeouts. `Promise.any` resolves with the first fulfilled promise and rejects with an `AggregateError` only if all reject; use it for hedged requests to redundant sources. Note that none of them cancel the losing operations; they keep running unless you pass an `AbortSignal`.

**Hinglish explanation:** `all` = "sab chahiye, ek bhi fail to sab fail". `allSettled` = "sab ka result batao, fail ho ya pass". `race` = "jo pehle khatam ho, chahe success chahe fail". `any` = "pehla success chahiye, fail ignore karo jab tak koi pass ho". Cancel koi nahi karta - ye galatfehmi interview me common hai.

```js
import { setTimeout as sleep } from 'node:timers/promises';

const ok = (v, ms) => sleep(ms).then(() => v);
const bad = (m, ms) => sleep(ms).then(() => { throw new Error(m); });

console.log(await Promise.allSettled([ok(1, 10), bad('x', 5)]));
// [ { status: 'fulfilled', value: 1 }, { status: 'rejected', reason: Error: x } ]

console.log(await Promise.any([bad('a', 5), ok('mirror2', 20)]));   // 'mirror2'
console.log(await Promise.race([ok('slow', 50), bad('timeout', 10)].map(p => p.catch(e => e.message)))); // 'timeout'

try { await Promise.any([bad('a', 1), bad('b', 2)]); }
catch (e) { console.log(e.constructor.name, e.errors.length); }       // AggregateError 2
```

**Follow-ups:**
- Q: Does `Promise.all` keep order? A: Yes, result order matches input order, not completion order.
- Q: What does `Promise.all([])` return? A: A promise fulfilled with `[]`. `Promise.race([])` never settles; `Promise.any([])` rejects.
- Q: How do you implement a timeout properly? A: `AbortSignal.timeout(ms)` passed to the operation (fetch, fs, timers), or race with a timeout promise and also cancel the work.

---

### Q-JS-24 | Advanced | [ESSENTIAL] | Implement a concurrency limit: process N items with at most K in flight.

**Question:** You have 10,000 user ids and must call an API for each, but only 10 requests may run at once. Implement `mapLimit(items, limit, fn)`.

**Interview answer:** I start `limit` worker loops. Each worker repeatedly takes the next index from a shared counter, awaits `fn` for that item, and stores the result at the same index so order is preserved. Because JavaScript is single-threaded, incrementing the shared index between awaits is safe. When all workers drain the list, `Promise.all` over the workers resolves. If any call rejects, `Promise.all` rejects and the remaining workers continue until their current item finishes, so for production I would add a stop flag or an `AbortController`. This prevents exhausting sockets, database connections or third-party rate limits compared with an unbounded `Promise.all`.

**Hinglish explanation:** Socho 10 workers hain aur ek common list. Har worker list se agla item uthata hai, kaam karta hai, phir agla. Isse hamesha max 10 kaam ek saath chalte hain. Index ko `next++` karna safe hai kyunki JS me ek time par ek hi code chalta hai (await ke beech me hi switch hota hai).

```js
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        failed = true;          // stop other workers from taking new items
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// usage
// const users = await mapLimit(ids, 10, id => fetchUser(id));
```

**Follow-ups:**
- Q: Time and space complexity? A: O(n) time overall with at most `limit` concurrent calls; O(n) space for results.
- Q: Should you hand-roll this in production? A: Libraries like `p-limit` are fine, but knowing the pattern matters; for CPU work use worker threads instead.
- Q: How would you add retries? A: Wrap `fn` in a `retry` helper with backoff (Q-JS-28).

---

### Q-JS-25 | Intermediate | [ESSENTIAL] | Common async mistakes: forEach with async, missing await, and floating promises.

**Question:** What is wrong with this code and how do you fix it?

```js
async function sendAll(users) {
  users.forEach(async (u) => { await sendEmail(u); });
  console.log('done');
}
```

**Interview answer:** `forEach` ignores the return value of its callback, so the promises it creates are not awaited. `'done'` prints before any email finishes, errors become unhandled rejections that can crash the process, and the caller cannot know when the work is complete. The fix depends on intent: use `for...of` with `await` for sequential sends, or `await Promise.all(users.map(sendEmail))` for parallel sends, with a concurrency limit for large lists. Other common mistakes are forgetting `await` on a promise-returning function (a floating promise), forgetting `return` in `then`, wrapping `await` in a `try` but not awaiting the inner call so the `catch` never fires, and mixing callbacks with promises.

**Hinglish explanation:** `forEach` ko async callback ka result se matlab nahi, wo bas chalata jata hai aur aage badh jata hai. Isliye "done" pehle print hota hai. Sequential chahiye to `for...of + await`, parallel chahiye to `Promise.all(map)`. Aur har promise ko ya `await` karo ya `.catch` lagao, warna unhandled rejection process kill kar sakta hai.

```js
// sequential
for (const u of users) await sendEmail(u);

// parallel, report failures without failing everything
const results = await Promise.allSettled(users.map(sendEmail));
const failed = results.filter(r => r.status === 'rejected');

// floating promise bug
async function save(order) {
  try {
    db.insert(order);          // [X] not awaited: rejection escapes try/catch
    await db.insert(order);    // [OK]
  } catch (e) { /* handled */ }
}
```

**Follow-ups:**
- Q: Which ESLint rules help? A: `@typescript-eslint/no-floating-promises` (even in JS projects via typed linting), `no-await-in-loop` (with judgment), `require-await`.
- Q: Does `array.map(async ...)` have the same problem? A: It returns an array of promises, which is fine if you `await Promise.all(...)` it.

---

### Q-JS-26 | Intermediate | [ESSENTIAL] | Why does try/catch not catch errors in callbacks, and how do you handle errors in async code?

**Question:** Why does this not catch the error? How should errors from timers, callbacks and promises be handled?

```js
try {
  setTimeout(() => { throw new Error('late'); }, 0);
} catch (e) {
  console.log('never runs');
}
```

**Interview answer:** `try/catch` only handles exceptions thrown while its block is on the call stack. The timer callback runs later from the event loop, on a fresh stack, after the `try` block has exited, so the exception propagates to the top level as an `uncaughtException` and by default terminates the process. For Node-style callbacks the convention is error-first callbacks: check `err` as the first argument. For promises, use `.catch` or `try/await/catch`, because `await` converts rejection into a thrown exception inside the async function. At application level I add centralized handling: Express error middleware, and `process.on('unhandledRejection')` and `uncaughtException` handlers that log and shut down gracefully, because the process state may be corrupted.

**Hinglish explanation:** `try/catch` sirf wahi error pakadta hai jo us waqt stack par hai. Callback baad me chalta hai, tab `try` block ka stack ja chuka hota hai. Isliye async code me `await + try/catch` ya `.catch()` use karo. Global handlers last-resort logging ke liye hain, normal error handling ke liye nahi.

```js
import { readFile } from 'node:fs/promises';

async function load(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));   // both errors caught
  } catch (err) {
    if (err.code === 'ENOENT') return {};              // expected: missing file
    throw err;                                          // unexpected: bubble up
  }
}
```

**Follow-ups:**
- Q: Should you continue running after `uncaughtException`? A: No; log, flush, close resources and exit; let a supervisor (pm2, Docker, Kubernetes) restart.
- Q: How does Express 5 differ here? A: Express 5 forwards rejected promises from async handlers to the error middleware automatically; Express 4 needed a wrapper or try/catch with `next(err)`.

---

### Q-JS-27 | Intermediate | [ESSENTIAL] | Convert a callback API to a promise (promisify) and explain the rules.

**Question:** Write `promisify` and show how `util.promisify` is used with a Node-style callback function.

**Interview answer:** Node-style callbacks use the error-first convention `(err, result)`. To promisify, return a function that returns a promise, call the original with an extra callback that rejects on `err` and resolves otherwise. I should keep `this` correct if the function is a method. In real code I use `util.promisify` or, better, the built-in promise APIs such as `fs/promises`, `timers/promises` and `stream/promises`. A callback that is not error-first or that calls back multiple times is not suitable for a plain promisify, because a promise can settle only once.

**Hinglish explanation:** Callback ko promise me badalna = ek wrapper jo callback ke andar `reject(err)` ya `resolve(data)` call kare. Node me ye pehle se `util.promisify` me hai. Ab to zyada tar modules ka promise version already hai (`fs/promises`), to naya promisify likhne ki zaroorat kam padti hai.

```js
import { promisify } from 'node:util';
import { readFile } from 'node:fs';

export function myPromisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, result) => (err ? reject(err) : resolve(result)));
    });
  };
}

const read1 = myPromisify(readFile);
const read2 = promisify(readFile);
console.log((await read1(new URL(import.meta.url), 'utf8')).length > 0); // true
console.log((await read2(new URL(import.meta.url), 'utf8')).length > 0); // true
```

**Follow-ups:**
- Q: What if the callback receives multiple success values? A: Plain promisify only keeps the first; `util.promisify.custom` can define a specific behavior.
- Q: Can an event-based API (EventEmitter) be promisified? A: For one-time events use `events.once(emitter, 'event')`, which returns a promise.

---

### Q-JS-28 | Intermediate | [ESSENTIAL] | Implement retry with exponential backoff and jitter.

**Question:** Write an async `retry` helper. Why add jitter, and which errors should you not retry?

**Interview answer:** The helper calls the function, and on failure waits `base * 2^attempt` milliseconds before trying again, up to a maximum number of attempts, then rethrows the last error. Jitter randomizes the delay so that many clients that failed together do not retry at the same moment and overload a recovering service (the thundering herd problem). I only retry transient failures such as timeouts, connection resets, HTTP 429 and 5xx, and never client errors like 400, 401 or 404. I also require the operation to be idempotent, or protect it with an idempotency key, because a retry after a timeout may duplicate a payment or an order.

**Hinglish explanation:** Fail hone par turant dobara try karne se server par aur load padta hai. Isliye har retry ke beech me wait badhao (200ms, 400ms, 800ms...). Jitter = thoda random delay, taaki hazaar clients ek hi second par retry na karein. Aur payment jaise kaam me retry se pehle idempotency socho, warna double charge ho sakta hai.

```js
import { setTimeout as sleep } from 'node:timers/promises';

export async function retry(fn, { retries = 3, baseMs = 200, maxMs = 5000, shouldRetry = () => true } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      const cap = Math.min(maxMs, baseMs * 2 ** attempt);
      await sleep(Math.random() * cap);          // "full jitter"
    }
  }
}

// usage: only retry transient errors
// await retry(() => callGateway(payload), { shouldRetry: e => e.status >= 500 || e.code === 'ETIMEDOUT' });
```

**Follow-ups:**
- Q: What is a circuit breaker and how is it related? A: It stops calling a failing dependency for a cool-down period instead of retrying endlessly; retries handle blips, breakers handle sustained outages.
- Q: Where should retries live in a layered system? A: At one layer only; retries at every layer multiply (3 x 3 x 3 = 27 calls).

---

### Q-JS-29 | Advanced | [ADVANCED] | What are generators, iterators and async iterators? Where do they show up in Node?

**Question:** Explain `function*`, `yield`, the iterator protocol and `for await...of`.

**Interview answer:** An iterator is an object with a `next()` method returning `{ value, done }`; an iterable has a `[Symbol.iterator]()` method returning an iterator, and `for...of`, spread and destructuring consume iterables. A generator function (`function*`) is a convenient way to create an iterator: it pauses at each `yield` and resumes on the next `next()` call, keeping its local state, which enables lazy sequences. An async iterator has `[Symbol.asyncIterator]()` whose `next()` returns promises and is consumed with `for await...of`. In Node this appears for readable streams, `readline` and `events.on`, which lets you process large data piece by piece with bounded memory instead of loading everything.

**Hinglish explanation:** Generator = aisa function jo beech me ruk sakta hai aur baad me wahi se aage chal sakta hai. Lazy values dena ke liye acha: poora array memory me nahi banana padta. `for await...of` async data (stream ke chunks, file ki lines) ko ek-ek karke padhne ke liye hai.

```js
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

function* range(start, end) { for (let i = start; i < end; i++) yield i; }
console.log([...range(0, 3)]);                   // [ 0, 1, 2 ]

async function countErrors(file) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let n = 0;
  for await (const line of rl) if (line.includes('ERROR')) n++;   // constant memory
  return n;
}
```

**Follow-ups:**
- Q: Is a generator the same as async/await? A: Conceptually related (async functions were originally modeled with generators plus a runner), but `async` functions are built in and return promises.
- Q: What happens if you `break` out of `for await` over a stream? A: The iterator's `return()` is called, which destroys the stream and releases the file handle.

---

### Q-JS-30 | Advanced | [ADVANCED] | How can microtasks starve the event loop, and how does Node treat unhandled rejections?

**Question:** What happens if a promise callback keeps scheduling more promise callbacks? How do you keep a server responsive while doing heavy loops?

**Interview answer:** The microtask queue is drained completely before the event loop moves to the next macrotask. If microtasks keep scheduling new microtasks, for example a recursive `Promise.resolve().then(loop)` or a recursive `process.nextTick`, timers and I/O callbacks never get a chance to run, so the server stops responding even though the code looks asynchronous. A long synchronous loop blocks even more directly. To keep the server responsive, break the work into chunks and yield to the event loop with `setImmediate` between chunks, move CPU-heavy work to worker threads or another service, and use streaming or batching for large data. Separately, since Node 15 an unhandled promise rejection raises an `uncaughtException`-like failure and terminates the process by default, so rejections must always be handled.

**Hinglish explanation:** "Async" likhne se code non-blocking nahi ho jata. Agar promise ke andar se promise bante hi rahe, to microtask queue kabhi khaali nahi hoti aur timers/network callbacks bhookhe reh jate hain. Fix: bade kaam ko tukdo me todo aur beech me `setImmediate` se loop ko saans lene do, ya worker thread me bhejo.

```js
import { setImmediate as yieldToLoop } from 'node:timers/promises';

export async function processBig(items, handle, chunk = 1000) {
  for (let i = 0; i < items.length; i += chunk) {
    for (const item of items.slice(i, i + chunk)) handle(item);
    await yieldToLoop();     // lets timers and I/O run between chunks
  }
}

// starvation (do not do this):
// const loop = () => Promise.resolve().then(loop);   // timers never fire
```

**Follow-ups:**
- Q: Why `setImmediate` and not `setTimeout(0)` for yielding? A: `setImmediate` runs in the check phase right after poll, with no minimum-delay clamp, so it yields more cheaply and predictably.
- Q: How do you detect event loop blocking in production? A: Monitor event loop delay with `perf_hooks.monitorEventLoopDelay()` and alert on p99 spikes.

---


---

# Category 2 -- Node.js Runtime and Internals (`Q-NODE-`)

Related notes: Week 2 (all days). Remember the accuracy rule: not every asynchronous operation uses the thread pool. See Q-NODE-06.

---

### Q-NODE-01 | Basic | [ESSENTIAL] | What is Node.js and how does it differ from browser JavaScript?

**Question:** What is Node.js? How is running JavaScript in Node different from running it in a browser?

**Interview answer:** Node.js is a JavaScript runtime built on Google's V8 engine, with libuv providing the event loop and asynchronous I/O, plus a standard library for files, networking, processes and more. The language is the same, but the environment differs. A browser provides `window`, `document`, DOM and Web APIs, and sandboxes code for security. Node has no DOM; instead it provides `fs`, `http`, `net`, `crypto`, `child_process`, `process` and `Buffer`, and gives code full access to the machine with the permissions of the process user. Node also has a module system (CommonJS and ES modules) with `node_modules` resolution, and the global object is `globalThis` rather than `window`. Modern Node also includes web-compatible APIs such as `fetch`, `AbortController`, `URL` and `structuredClone`.

**Hinglish explanation:** Browser me JS ka kaam page ko control karna hai (DOM, events). Node me JS ka kaam server ka hai: file padhna, network sockets, database se baat karna. Language wahi, bas "aas-paas ki duniya" alag hai. Browser me `document` hota hai, Node me nahi; Node me `fs` hota hai, browser me nahi (security ki wajah se).

```js
console.log(typeof window);          // 'undefined' in Node
console.log(typeof process);         // 'object'
console.log(globalThis === global);  // true in Node
console.log(process.version);        // e.g. v22.x.x
```

**Follow-ups:**
- Q: Is Node.js a framework or a language? A: Neither; it is a runtime. Express is a framework running on it.
- Q: Why is Node popular for APIs? A: Non-blocking I/O handles many concurrent connections with low memory, one language across front and back end, and a large npm ecosystem.
- Q: What are Deno and Bun? A: Alternative JavaScript runtimes; Node remains the mainstream production choice for most backend jobs.

---

### Q-NODE-02 | Intermediate | [ESSENTIAL] | Explain V8, libuv and the Node.js runtime architecture.

**Question:** What roles do V8 and libuv play? How does a JavaScript call like `fs.readFile` reach the operating system?

**Interview answer:** V8 compiles and executes JavaScript, manages the heap, and runs garbage collection. libuv is a C library that provides the event loop, the thread pool, and cross-platform asynchronous I/O abstractions over epoll, kqueue and IOCP. Node's C++ bindings connect the two. When my code calls `fs.readFile`, the JavaScript API validates arguments and calls into a C++ binding, which creates a libuv request and submits it to the thread pool because file operations are done with blocking system calls on worker threads. When the work completes, libuv queues the result, the event loop picks it up in a later phase, and V8 invokes my JavaScript callback or resolves the promise on the main thread. Other components include c-ares for DNS resolution, OpenSSL for crypto and TLS, zlib, and the HTTP parser.

**Hinglish explanation:** V8 = JS ko samajhne aur chalane wala engine. libuv = "event loop + I/O ka manager". Dono ke beech C++ ka glue code hai. JS ne bola "file padho", libuv ne kaam kisi worker thread ko diya, kaam hone par event loop ko batata hai, aur tab tumhara callback main thread par chalta hai.

```text
Your JS code
   |  (calls)
Node core JS modules (fs, http, ...)
   |
C++ bindings  <---->  V8 (heap, JIT, GC)
   |
libuv: event loop + thread pool + OS polling (epoll / kqueue / IOCP)
   |
Operating system (files, sockets, timers)
```

**Follow-ups:**
- Q: Is the event loop part of V8? A: No. V8 has no event loop; libuv (in Node) or the browser provides it.
- Q: What does JIT mean here? A: V8 compiles hot JavaScript to optimized machine code at run time (Ignition interpreter, then TurboFan/Maglev optimizing compilers).

---

### Q-NODE-03 | Basic | [ESSENTIAL] | Is Node.js single-threaded? Explain precisely.

**Question:** People say "Node is single-threaded". Is that accurate?

**Interview answer:** Your JavaScript code runs on a single main thread, one call stack, so two pieces of JavaScript never run at the same time in that thread. However, the Node process itself is not single-threaded: libuv has a thread pool (default size 4) for file system work, some crypto, zlib and `dns.lookup`; V8 uses background threads for garbage collection and compilation; and you can create more JavaScript threads explicitly with worker threads. Network I/O does not need extra threads because the operating system notifies libuv about readiness. So the right statement is "JavaScript execution is single-threaded, I/O is concurrent". The practical consequence is that CPU-heavy JavaScript on the main thread blocks all requests.

**Hinglish explanation:** "Single-threaded" ka sahi matlab: tumhara JS code ek hi thread par chalta hai. Par peeche libuv ke worker threads aur OS ka kaam chal raha hota hai. Isliye 1000 connections handle ho jate hain, lekin ek heavy `for` loop poore server ko rok deta hai.

```js
import { pbkdf2 } from 'node:crypto';
// 4 hashes run in parallel on the libuv thread pool while the main thread stays free
const t = Date.now();
for (let i = 0; i < 4; i++) {
  pbkdf2('pw', 'salt', 300_000, 64, 'sha512', () => console.log(i, Date.now() - t, 'ms'));
}
console.log('main thread is free');
```

**Follow-ups:**
- Q: Then how do you use multiple CPU cores? A: `cluster` or multiple processes behind a load balancer, or worker threads for CPU tasks (Q-NODE-10).
- Q: Does "single-threaded" mean no race conditions? A: Not entirely; in-memory read-modify-write across `await` points and shared database rows can still race.

---

### Q-NODE-04 | Basic | [ESSENTIAL] | Blocking versus non-blocking: what is the difference and what does blocking cost?

**Question:** Explain blocking and non-blocking operations with an example. Why are `*Sync` functions dangerous in a server?

**Interview answer:** A blocking operation holds the main thread until it finishes, so no other JavaScript, including other requests' handlers, can run. A non-blocking operation starts the work, returns immediately, and later delivers the result through a callback, promise or event, so the loop keeps serving others. `fs.readFileSync` is blocking; `fs.promises.readFile` is non-blocking. A one second blocking call in a request handler means every other request waits for that second, so throughput collapses. `*Sync` calls are acceptable during startup (reading config), in CLI scripts, and in worker code, but not inside request handling. CPU-bound loops, large `JSON.parse`, synchronous crypto and catastrophic regex are also blocking even though they are not I/O.

**Hinglish explanation:** Restaurant socho: ek waiter (main thread). Blocking = waiter kitchen ke bahar khada rehke ek dish ka wait karta hai, baaki customers ignore. Non-blocking = order de kar dusre table par chala jata hai, dish ready hone par bell bajti hai. Server me ek `readFileSync` ya heavy loop = waiter ruk gaya.

```js
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';

http.createServer(async (req, res) => {
  if (req.url === '/bad')  { res.end(readFileSync('./big.json')); }        // [X] blocks everyone
  if (req.url === '/good') { res.end(await readFile('./big.json')); }      // [OK] non-blocking
}).listen(3000);
```

**Follow-ups:**
- Q: How do you spot blocking code? A: Event loop delay metrics, CPU profile flame graphs (`--cpu-prof`, clinic), and latency spikes that hit all endpoints at once.
- Q: Is `JSON.parse` of a 50 MB string a problem? A: Yes, it is synchronous CPU work; stream-parse or offload.
- Q: What is ReDoS? A: A regex with catastrophic backtracking on crafted input can block the loop for seconds; avoid nested quantifiers on untrusted input.

---

### Q-NODE-05 | Intermediate | [ESSENTIAL] | Describe the phases of the Node.js event loop.

**Question:** What are the event loop phases and what runs in each?

**Interview answer:** Each loop iteration goes through these phases in order. Timers: runs expired `setTimeout` and `setInterval` callbacks. Pending callbacks: runs some deferred system-level callbacks, such as certain TCP errors. Idle and prepare: internal use. Poll: retrieves new I/O events and runs their callbacks; if nothing is scheduled the loop may block here waiting for I/O, but it will not wait if there are `setImmediate` callbacks or timers due. Check: runs `setImmediate` callbacks. Close callbacks: runs close handlers such as `socket.on('close')`. Between every individual callback, and between phases, Node drains the `process.nextTick` queue first and then the promise microtask queue (this per-callback behavior is from Node 11 onward and matches browsers).

**Hinglish explanation:** Loop ek gol chakkar hai jisme har phase ka apna queue hai: timers -> pending -> idle/prepare -> poll (I/O) -> check (`setImmediate`) -> close. Har callback ke baad nextTick aur promise wali VIP queue khaali hoti hai. Interview me phases ke naam aur timers/poll/check ka order bolna kaafi hota hai.

```text
   +--> timers  (setTimeout / setInterval)
   |      pending callbacks
   |      idle, prepare
   |      poll    (I/O callbacks; waits here when idle)
   |      check   (setImmediate)
   +--    close callbacks
(after EVERY callback: process.nextTick queue, then promise microtasks)
```

**Follow-ups:**
- Q: What decides how long poll waits? A: The time until the nearest timer, and whether `setImmediate` callbacks are pending.
- Q: Where do promise `.then` callbacks run? A: In the microtask queue, between callbacks, not in a loop phase of their own.

---

### Q-NODE-06 | Advanced | [ESSENTIAL] | Which asynchronous operations use the OS, the event loop, or the thread pool?

**Question:** Does every async operation in Node use the libuv thread pool? Give examples of each category.

**Interview answer:** No, and saying so is a common misconception. There are three mechanisms. First, OS-level asynchronous I/O via epoll, kqueue or IOCP, used for network sockets (TCP, HTTP, TLS, UDP) and pipes; no thread is blocked per connection. Second, the libuv thread pool (default 4 threads) runs operations that have no portable non-blocking OS API or are CPU-bound: most `fs` operations, `dns.lookup` (which calls blocking `getaddrinfo`), `crypto.pbkdf2`, `scrypt`, `randomBytes`, `randomFill`, `zlib` compression, and many native addon operations such as the bcrypt library. Third, timers and `setImmediate` are managed directly by the event loop with no thread involved. Also `dns.resolve*` uses c-ares and the network rather than the pool, and child processes use OS process and pipe mechanisms. Promise callbacks are just microtasks on the main thread. Implementation details can vary by platform and Node version, so I reason by category rather than memorizing every function.

**Hinglish explanation:** Teen raaste hain: (1) network = OS khud bata deta hai "data aa gaya" (epoll/kqueue/IOCP), thread pool nahi lagta; (2) file system, `dns.lookup`, crypto hashing, zlib = libuv ke 4 worker threads; (3) timers = loop ke andar hi. Isliye 1 lakh sockets chal sakte hain par 5 simultaneous `pbkdf2` calls queue me lagenge.

| Operation | Mechanism |
|-----------|-----------|
| TCP/HTTP/TLS sockets, UDP, pipes | OS polling (epoll/kqueue/IOCP), no pool thread |
| `fs.*` (readFile, stat, writeFile) | libuv thread pool |
| `dns.lookup` (used by http, net by default) | thread pool (`getaddrinfo`) |
| `dns.resolve4` etc. | c-ares, network based, not pool |
| `crypto.pbkdf2/scrypt/randomBytes`, `bcrypt` addon | thread pool |
| `zlib` async compression | thread pool |
| `setTimeout`, `setInterval`, `setImmediate` | event loop itself |
| Promise `.then`, `await` continuation | microtask queue, main thread |
| `child_process.spawn` | OS processes + pipes (not the pool) |

**Follow-ups:**
- Q: Why does this matter in production? A: Heavy `fs` or hashing traffic can saturate the 4 pool threads and delay even unrelated DNS lookups or file reads.
- Q: Does Windows differ? A: libuv uses IOCP on Windows, epoll on Linux, kqueue on macOS/BSD; the abstraction hides differences, but low-level behavior can vary.

---

### Q-NODE-07 | Advanced | [ADVANCED] | Demonstrate the thread pool limit: what is UV_THREADPOOL_SIZE and how would you tune it?

**Question:** Run 8 `pbkdf2` calls on a 4-thread pool. What do you observe? How can you change the pool size?

**Interview answer:** With the default pool size of 4, the first four hashes run in parallel and finish at about the same time, and the next four start only after threads free up, so total time is about twice a single hash (assuming 4 or more cores). You can set `UV_THREADPOOL_SIZE` (maximum 1024) as an environment variable before the process starts, for example `UV_THREADPOOL_SIZE=8 node app.js`, because the pool is created when first used. Tuning helps when many pool-bound tasks compete, but more threads than CPU cores for CPU-bound work gives no gain and adds context switching. A better architectural answer for heavy hashing is limiting concurrency at the application layer and scaling horizontally.

**Hinglish explanation:** Pool me 4 worker hain. 8 kaam aaye to pehle 4 chalte hain, baaki lineup me. `UV_THREADPOOL_SIZE` badha sakte ho, par CPU cores se zyada badhane ka fayda nahi hota CPU-heavy kaam me. Env var process start se pehle set karo.

```js
import { pbkdf2 } from 'node:crypto';
const start = Date.now();
for (let i = 1; i <= 8; i++) {
  pbkdf2('pw', 'salt', 400_000, 64, 'sha512', () =>
    console.log(`hash ${i} done at ${Date.now() - start} ms`));
}
// default pool: hashes 1-4 finish together (~T), 5-8 finish together (~2T)
// run again with:  UV_THREADPOOL_SIZE=8 node file.mjs
```

**Follow-ups:**
- Q: Can you set it from inside the script? A: Unreliable; the pool may already be created and behavior differs by platform. Use the environment.
- Q: How does this relate to login endpoints with bcrypt? A: Each login hash occupies a pool thread for ~100 ms; a burst of logins queues up and slows other pool work like file reads. Rate-limit login.

---

### Q-NODE-08 | Intermediate | [ESSENTIAL] | process.nextTick vs queueMicrotask vs setImmediate vs setTimeout(0).

**Question:** Explain the differences and the order in which they run.

**Interview answer:** `process.nextTick` queues a callback in the nextTick queue, processed right after the current operation completes and before promise microtasks, so overuse can starve I/O. `queueMicrotask` and promise reactions go into the microtask queue, which is drained after the nextTick queue. `setImmediate` runs in the check phase of the event loop, after the poll phase. `setTimeout(fn, 0)` runs in the timers phase after at least the minimum delay (effectively 1 ms). In a CommonJS main script the order is: synchronous code, nextTick, microtasks, then timers or immediate (the last two are order-dependent from the main module, see Q-NODE-09). I use `setImmediate` or `queueMicrotask` to defer work, and avoid `nextTick` in new code except where documented patterns require it.

**Hinglish explanation:** Priority line: sync code > `nextTick` > promises/`queueMicrotask` > timers/`setImmediate` (phase ke hisaab se). `nextTick` naam ke baavajood "agla tick" nahi, balki "current operation ke turant baad" hai - isliye confusing hai.

```js
// CommonJS file
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
queueMicrotask(() => console.log('microtask'));
console.log('sync');
// sync, nextTick, promise, microtask, then timeout/immediate (order may vary)
```

**Follow-ups:**
- Q: Why can recursive `nextTick` hang the server? A: The nextTick queue must empty before the loop proceeds, so I/O never gets a turn.
- Q: When is `nextTick` legitimately used? A: To emit events after the constructor returns so listeners can be attached, or to make a callback API consistently asynchronous.

---

### Q-NODE-09 | Advanced | [ADVANCED] | setTimeout(0) vs setImmediate: why is the order sometimes random?

**Question:** From the main module the order of `setTimeout(..., 0)` and `setImmediate` is not deterministic. Why? Inside an I/O callback it is. Why?

**Interview answer:** When the loop starts, whether the 1 ms timer has already expired depends on how long process start-up took. If the loop enters the timers phase and 1 ms has passed, the timeout runs first; otherwise the loop proceeds to poll and check, so `setImmediate` runs first. That makes the order from the main module dependent on machine performance. Inside an I/O callback we are in the poll phase, and the next phase is check, so a `setImmediate` registered there always runs before a `setTimeout(0)`, which must wait for the next loop iteration's timers phase.

**Hinglish explanation:** Main script me loop shuru hone tak 1 ms nikal gaya ya nahi - ye machine ki speed par depend karta hai, isliye order random. I/O callback ke andar hum poll phase me hain, aur uske turant baad check phase aata hai, isliye `setImmediate` hamesha pehle.

```js
import { readFile } from 'node:fs';
readFile(new URL(import.meta.url), () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// always: immediate, then timeout
```

**Follow-ups:**
- Q: Is the minimum timer delay really 1 ms? A: `setTimeout(fn, 0)` is coerced to 1 ms in Node; timers are never exact and fire late if the loop is busy.
- Q: Practical takeaway? A: Never write code that depends on this order; use promises or explicit sequencing.

---

### Q-NODE-10 | Intermediate | [ESSENTIAL] | Worker threads vs cluster vs child_process: what is each for?

**Question:** Compare `worker_threads`, `cluster` and `child_process`. When do you use each?

**Interview answer:** `worker_threads` run additional JavaScript threads inside the same process, each with its own V8 isolate and event loop, communicating by message passing and optionally sharing memory through `SharedArrayBuffer`. They are for CPU-bound work such as image processing, large JSON transforms or heavy computation, without blocking the main thread. `cluster` forks multiple Node processes that share the same server port, each with its own memory, so you can use all CPU cores for handling more requests; in practice many teams use a process manager or container orchestration to run several instances instead. `child_process` spawns separate OS processes, including non-Node programs such as `ffmpeg` or shell scripts, with communication through stdio or IPC. Workers are lighter than processes but offer less isolation: a crash in a worker can be contained, but memory is shared in the process.

**Hinglish explanation:** Worker threads = ek hi process ke andar extra JS threads, CPU heavy kaam ke liye. Cluster = poora Node process multiple copies me chalana taaki sab CPU cores request handle karein. child_process = koi bhi alag program chalana (ffmpeg, python script). I/O heavy kaam ke liye in me se kisi ki zaroorat nahi, async I/O kaafi hai.

| Need | Choose |
|------|--------|
| CPU-heavy computation without blocking requests | worker_threads (or a job queue + separate worker service) |
| Use all cores for an HTTP server | multiple processes: cluster, PM2, containers + load balancer |
| Run an external binary | child_process (`spawn`, `execFile`) |
| I/O-bound waiting (DB, HTTP calls) | none: async/await is enough |

**Follow-ups:**
- Q: Why not just use more threads for I/O-bound work? A: Waiting on I/O costs no CPU; the event loop already multiplexes thousands of waits on one thread.
- Q: What is the difference between `exec` and `spawn`? A: `exec` runs through a shell and buffers output (size-limited, injection risk with user input); `spawn`/`execFile` stream output and avoid the shell. Never pass untrusted input to `exec`.
- Q: Does cluster share memory? A: No; each process has its own heap, so in-memory sessions or caches are not shared. Use Redis or a database.

---


### Q-NODE-11 | Intermediate | [ESSENTIAL] | Show how to offload a CPU-heavy task to a worker thread.

**Question:** An endpoint computes a heavy result and blocks other requests. Show a worker-thread solution and discuss its cost.

**Interview answer:** I move the computation into a worker script and communicate with it using `postMessage`. The main thread creates a `Worker`, sends the input, and awaits the result through a promise that resolves on the `message` event and rejects on `error` or a non-zero exit. The event loop in the main thread stays free to serve other requests. Creating a worker costs tens of milliseconds and some megabytes of memory, so for frequent tasks I use a worker pool rather than a new worker per request, limit queue length, and measure whether the work is actually CPU-bound. Data is copied between threads by the structured clone algorithm unless I transfer an `ArrayBuffer` or use `SharedArrayBuffer`.

**Hinglish explanation:** Heavy computation ko alag thread me bhej do. Main thread sirf message bhejta aur result leta hai. Worker banana mehenga hai, isliye har request par naya worker mat banao - pool banao. Data copy hota hai (clone), isliye bade data ke liye `ArrayBuffer` transfer karo.

```js
// main.mjs
import { Worker } from 'node:worker_threads';

export function runInWorker(n) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./fib-worker.mjs', import.meta.url), { workerData: { n } });
    w.once('message', resolve);
    w.once('error', reject);
    w.once('exit', code => { if (code !== 0) reject(new Error(`worker exited ${code}`)); });
  });
}
console.log(await runInWorker(40));

// fib-worker.mjs
import { parentPort, workerData } from 'node:worker_threads';
const fib = n => (n < 2 ? n : fib(n - 1) + fib(n - 2));
parentPort.postMessage(fib(workerData.n));
```

**Follow-ups:**
- Q: Do workers share variables with the main thread? A: No; separate heaps, only messages, transferables, or `SharedArrayBuffer` with `Atomics`.
- Q: Is a worker better than a queue with a separate service? A: For occasional short tasks, a worker is simpler; for long or retryable jobs, a queue plus separate worker processes is more robust and scalable.

---

### Q-NODE-12 | Intermediate | [ESSENTIAL] | CommonJS versus ES modules: key differences.

**Question:** Compare CommonJS and ES modules in Node. How does Node decide which is used?

**Interview answer:** CommonJS uses `require()` and `module.exports`; it loads modules synchronously at run time, so `require` can be called conditionally and returns a copy-by-reference of the exports object. ES modules use `import` and `export`, are statically analyzable (imports are known before execution, enabling tree shaking), load asynchronously, support top-level `await`, run in strict mode, and export live bindings. Node treats a file as ESM if it has the `.mjs` extension, or `.js` with `"type": "module"` in the nearest `package.json`; `.cjs` or `type: commonjs` (the default) means CommonJS. ESM does not provide `__dirname`, `__filename` or `require`. Import specifiers for relative files must include the file extension. For new projects I use ESM.

**Hinglish explanation:** CJS = `require/module.exports`, runtime par sync load. ESM = `import/export`, static, top-level `await`, live bindings. Node ko batana padta hai kaunsa chahiye: `package.json` me `"type": "module"` ya `.mjs` extension. Naye code me ESM use karo, par purane packages CJS hi hote hain, isliye dono ka interop pata hona chahiye.

```js
// CommonJS
const fs = require('node:fs');
module.exports = { read: p => fs.readFileSync(p, 'utf8') };

// ESM
import fs from 'node:fs';
export const read = p => fs.readFileSync(p, 'utf8');
export default read;
```

**Follow-ups:**
- Q: What are live bindings? A: An imported name reflects later changes made by the exporting module; CommonJS exports are plain property values read at `require` time.
- Q: Can ESM import CommonJS? A: Yes, with `import pkg from 'cjs-package'` (the default import is `module.exports`).
- Q: Can CommonJS load ESM? A: In Node 20 `require()` of an ES module throws `ERR_REQUIRE_ESM`; use dynamic `import()`. Node 22.12 and later can `require()` synchronous ES modules (no top-level await) without a flag.

---

### Q-NODE-13 | Intermediate | [ESSENTIAL] | ESM gotchas in Node: __dirname, JSON, dynamic import and extensions.

**Question:** What breaks when migrating a CommonJS file to ESM and how do you fix it?

**Interview answer:** `__dirname` and `__filename` do not exist; use `import.meta.dirname` and `import.meta.filename` (Node 20.11+) or derive them from `import.meta.url` with `fileURLToPath`. `require` is not defined, so use `import`, or create one with `createRequire(import.meta.url)` for legacy cases. JSON is imported with an import attribute: `import data from './data.json' with { type: 'json' }`. Relative imports need explicit extensions (`./utils.js`). Dynamic `import()` works in both systems and returns a promise, which is the way to load ESM from CommonJS in Node 20. Also, `this` at the top level is `undefined`, and code is always strict.

**Hinglish explanation:** ESM me purane habits toot-te hain: `__dirname` nahi, `require` nahi, JSON import ke liye `with { type: 'json' }`, aur file extension likhna zaroori. Ye sab "migration" interview me common sawal hai.

```js
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import config from './config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);       // or import.meta.dirname on Node 20.11+
const require = createRequire(import.meta.url);
const legacy = require('./legacy.cjs');
console.log(__dirname, config, typeof legacy);
```

**Follow-ups:**
- Q: Why are extensions mandatory in ESM? A: ESM resolution follows URL rules and does not probe the file system for `.js` or `index.js`, which makes it deterministic.
- Q: How do you load a module only when needed? A: `const { heavy } = await import('./heavy.js')`.

---

### Q-NODE-14 | Intermediate | [ESSENTIAL] | What is the `process` object? Explain exit codes, signals and events.

**Question:** What do `process.argv`, `process.env`, `process.exit`, `process.on('SIGTERM')` and `exitCode` do?

**Interview answer:** `process` is a global object representing the current Node process. `process.argv` holds command-line arguments, `process.env` holds environment variables as strings, `process.cwd()` is the current working directory, `process.pid` is the process ID, and `process.memoryUsage()` reports memory. `process.exit(code)` ends the process immediately, which can cut off pending asynchronous work such as unflushed logs, so I prefer setting `process.exitCode` and letting the loop drain, or doing an orderly shutdown. Exit code 0 means success and non-zero means failure, which is what CI and orchestrators check. Operating systems or orchestrators stop services with signals: `SIGTERM` requests a graceful stop, `SIGINT` comes from Ctrl+C, and `SIGKILL` cannot be handled. Handlers for `SIGTERM` should stop accepting traffic, finish in-flight requests, close the database pool, and then exit.

**Hinglish explanation:** `process` = "mera chalta hua program" ka control panel. Arguments, env variables, memory sab yahi se. `process.exit()` seedha kaat deta hai, pending kaam adhoora reh jata hai. Docker/Kubernetes pehle `SIGTERM` bhejte hain: tab tumhe graceful shutdown karna hota hai, warna kuch der baad `SIGKILL` se force kill.

```js
console.log(process.argv.slice(2), process.pid);
console.log(process.env.NODE_ENV ?? 'development');

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  process.exitCode = 0;      // let the loop end naturally after cleanup
});
process.on('exit', code => console.log('exiting with', code)); // sync work only here
```

**Follow-ups:**
- Q: Are env variable values always strings? A: Yes; `process.env.PORT` is `'3000'`, so convert with `Number()` and validate.
- Q: Why not call `process.exit(1)` inside a library? A: It prevents callers from handling errors; throw instead and let the app decide.

---

### Q-NODE-15 | Basic | [ESSENTIAL] | How do you manage configuration and environment variables safely?

**Question:** How should a Node app read configuration? How do you handle secrets and the `.env` file?

**Interview answer:** Configuration comes from environment variables, following the twelve-factor approach, so the same build can run in development, staging and production. In development I can load a `.env` file with Node's built-in `--env-file=.env` flag (Node 20.6+) or `process.loadEnvFile()` (Node 20.12 / 21.7+), or `dotenv` for older versions. I centralize reading and validation in one config module that parses types, applies defaults and fails fast at startup when a required value is missing. `.env` files are never committed; production secrets come from the platform's secret manager or injected environment, not from source control or logs. Values in `process.env` are always strings, and secrets must never be sent to the client or printed in error messages.

**Hinglish explanation:** Config code me hardcode mat karo; environment se lo. Ek jagah (config module) me sab padho, validate karo, aur missing ho to app start hote hi crash kare - production me baad me ajeeb bug se behtar hai. `.env` git me kabhi nahi, `.gitignore` me.

```js
// config.js
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing env var ${k}`);
}
export const config = Object.freeze({
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  isProd: process.env.NODE_ENV === 'production',
});
// run: node --env-file=.env server.js
```

**Follow-ups:**
- Q: Why is `NODE_ENV=production` important? A: Libraries such as Express skip dev-only behavior (verbose errors, view cache off) and optimize; it should be set in production.
- Q: Are env variables fully secret? A: They can leak via crash dumps, `/proc`, child processes or debug logs; use a secret manager for high-value secrets and rotate.

---

### Q-NODE-16 | Intermediate | [ESSENTIAL] | What is a Buffer and when do you need it?

**Question:** What is `Buffer` in Node.js? How does it relate to `Uint8Array`, strings and encodings?

**Interview answer:** A `Buffer` is a fixed-size chunk of raw binary memory, a subclass of `Uint8Array`, used for binary data such as file contents, network packets, images and cryptographic output. Its memory is allocated outside the V8 heap. Strings are sequences of characters while buffers are sequences of bytes, so converting between them requires an encoding such as UTF-8, base64 or hex: `Buffer.from('hi', 'utf8')` and `buf.toString('base64')`. `Buffer.alloc(n)` returns zero-filled memory and is safe; `Buffer.allocUnsafe(n)` is faster but may contain old data, so I never expose it without overwriting. A subtle bug is converting chunks to strings individually while reading a stream, because a multi-byte UTF-8 character can be split across chunks; collect buffers and concatenate, or use `setEncoding` or a `StringDecoder`.

**Hinglish explanation:** Buffer = raw bytes ka array. File ya network se jo data aata hai wo pehle bytes hota hai, string baad me bante hai. Bytes ko string me badalne ke liye encoding (utf8/base64/hex) batani padti hai. Chunk-by-chunk `toString()` se emoji ya Hindi characters beech me tut sakte hain.

```js
const buf = Buffer.from('Namaste', 'utf8');
console.log(buf.length, buf.toString('hex'), buf.toString('base64'));

const chunks = [Buffer.from('Hello '), Buffer.from('World')];
console.log(Buffer.concat(chunks).toString());         // Hello World

const safe = Buffer.alloc(4);                          // zero-filled
console.log(safe);                                     // <Buffer 00 00 00 00>
console.log(Buffer.byteLength('a\u20ac'), 'a\u20ac'.length);   // 4 2 (bytes vs characters)
```

**Follow-ups:**
- Q: Why check `byteLength` instead of `.length` for upload limits? A: `.length` of a string counts UTF-16 units, not bytes.
- Q: Why use `crypto.timingSafeEqual` with buffers? A: To compare secrets without leaking timing information.

---

### Q-NODE-17 | Basic | [ESSENTIAL] | fs callback vs promise vs sync APIs, and reading large files.

**Question:** Which `fs` API style should you use? What is wrong with `readFile` for a 2 GB file?

**Interview answer:** I use the promise API, `node:fs/promises`, with `async/await` for most work. Callback APIs are older and `*Sync` variants block the event loop, so I limit them to startup or scripts. `readFile` loads the entire file into memory, so a 2 GB file may exceed memory limits (Node buffers have a maximum size, and loading consumes RAM) and delays the first byte. For large files I use streams (`createReadStream`) or `FileHandle.readLines()` to process data in chunks with constant memory. Also important: check for specific error codes such as `ENOENT`, avoid check-then-use races (`exists` then `read`) by handling the error from the operation itself, and build paths with `path.join` or `path.resolve` to avoid separators and traversal bugs.

**Hinglish explanation:** Chhoti file ke liye `fs/promises.readFile` theek. Bahut badi file ho to stream use karo, warna RAM bhar jayegi. "Pehle exists check karo phir read" galat pattern hai kyunki beech me file badal sakti hai; seedha read karo aur error handle karo.

```js
import { readFile, open } from 'node:fs/promises';

try {
  const text = await readFile('./config.json', 'utf8');
  console.log(JSON.parse(text));
} catch (err) {
  if (err.code === 'ENOENT') console.log('missing file');
  else throw err;
}

// large file, line by line, constant memory
const fh = await open('./huge.log');
let errors = 0;
for await (const line of fh.readLines()) if (line.includes('ERROR')) errors++;
console.log(errors);
```

**Follow-ups:**
- Q: Why is user-supplied filename dangerous? A: Path traversal (`../../etc/passwd`); resolve the path and verify it stays inside an allowed directory.
- Q: Does fs use the thread pool? A: Yes, for most operations (see Q-NODE-06).

---

### Q-NODE-18 | Intermediate | [ESSENTIAL] | What are streams and why use them?

**Question:** Explain the four stream types and the benefits of streaming over buffering.

**Interview answer:** A stream processes data in chunks as they arrive instead of loading everything into memory. The four types are Readable (a source, e.g. file read or HTTP request), Writable (a sink, e.g. file write or HTTP response), Duplex (both independently, e.g. a TCP socket), and Transform (a Duplex that modifies data as it passes, e.g. gzip). Benefits are constant memory use regardless of data size, lower time to first byte since processing starts immediately, and composability through pipelines. Streams are event emitters and support async iteration. In backend work I use them for file uploads and downloads, large exports such as CSV, proxying, compression and log processing.

**Hinglish explanation:** Pani ki pipe jaisa: poori tanki bharke ek saath bhejne ke bajay, pipe se thoda-thoda behta rehta hai. Isse 5 GB file bhi 50 MB RAM me process ho jati hai. Readable = source, Writable = destination, Transform = beech me kuch badalna (compress, parse).

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

await pipeline(
  createReadStream('big.log'),
  createGzip(),                    // Transform
  createWriteStream('big.log.gz'), // Writable
);
console.log('compressed with constant memory');
```

**Follow-ups:**
- Q: Which common objects are streams? A: `req` (Readable), `res` (Writable), `fs` streams, `net.Socket` (Duplex), `zlib` streams (Transform), `process.stdin/stdout`.
- Q: What is object mode? A: A mode where chunks are arbitrary JavaScript values instead of buffers/strings, used for parsed records.
- Q: When is streaming not worth it? A: Small payloads where simplicity matters more.

---

### Q-NODE-19 | Advanced | [ESSENTIAL] | What is backpressure and how does Node handle it?

**Question:** What is backpressure? What happens if you ignore it when writing to a slow destination?

**Interview answer:** Backpressure is the mechanism that slows a fast producer when the consumer cannot keep up. A Writable has an internal buffer limited by `highWaterMark` (16 KiB by default for byte streams, 16 objects in object mode). When the buffer is full, `writable.write(chunk)` returns `false`; the producer should stop and resume when the stream emits `'drain'`. If a producer ignores that signal and keeps writing, data accumulates in memory, which can lead to high memory use and out-of-memory crashes, for example when streaming a large file to a slow client. `readable.pipe(writable)` and `stream.pipeline` handle this automatically by pausing the source when `write()` returns false. When writing manually in a loop, I must await `drain`.

**Hinglish explanation:** Producer tez, consumer dheema: beech ka buffer bhar jata hai. Writable bolta hai `write()` se `false` return karke "ruk jao". Tum `drain` event aane tak ruko. Agar nahi rukte, saara data RAM me jama hota rehta hai. `pipe`/`pipeline` ye khud sambhal lete hain, isliye unhe prefer karo.

```js
import { createWriteStream } from 'node:fs';
import { once } from 'node:events';

const out = createWriteStream('out.txt');
for (let i = 0; i < 1_000_000; i++) {
  if (!out.write(`line ${i}\n`)) {
    await once(out, 'drain');         // respect backpressure
  }
}
out.end();
```

**Follow-ups:**
- Q: Which one is the producer in `req.pipe(res)`? A: `req` is the readable source; `res` is the writable sink, and a slow client pauses reading from `req`.
- Q: How do you see backpressure in practice? A: `writableLength` growing and `write()` returning false; memory graph rising during large transfers.

---

### Q-NODE-20 | Intermediate | [ESSENTIAL] | pipe() vs pipeline(): why prefer pipeline?

**Question:** What are the problems of `.pipe()` and how does `stream.pipeline` fix them?

**Interview answer:** `.pipe()` forwards data and handles backpressure, but it does not propagate errors or clean up: if one stream errors or closes early, the others stay open, which leaks file descriptors and memory, and you need an `error` handler on every stream. `stream.pipeline`, or the promise version from `node:stream/promises`, connects streams, propagates an error from any stage, destroys all the streams, and calls your callback or rejects the promise. It also supports async generator functions as stages. So I always use `pipeline` for production code, wrapped in `try/catch`, and handle client disconnects by passing an `AbortSignal` or letting the destroyed response abort the pipeline.

**Hinglish explanation:** `pipe` data to bhej deta hai par agar beech me error aaya to baaki streams khule reh jate hain (file descriptor leak). `pipeline` sabko ek unit maanta hai: error aaya to sabko destroy karta hai aur tumhe ek jagah error milta hai.

```js
import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';
import http from 'node:http';

http.createServer(async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/plain');
    await pipeline(createReadStream('./report.txt'), res);
  } catch (err) {
    // client aborted or file error: pipeline already destroyed both streams
    if (!res.headersSent) { res.statusCode = 500; res.end('error'); }
  }
}).listen(3000);
```

**Follow-ups:**
- Q: Why `stream/promises` instead of callbacks? A: It works with `async/await` and fits Express 5 error handling.
- Q: What if the client disconnects mid-download? A: The response stream closes; `pipeline` rejects with `ERR_STREAM_PREMATURE_CLOSE` and destroys the file stream, which is the behavior you want.

---


### Q-NODE-21 | Intermediate | [ESSENTIAL] | Write a Transform stream: process a huge CSV or NDJSON file in constant memory.

**Question:** Implement a pipeline that reads a large newline-delimited JSON file, filters records, and writes the result, without loading the whole file.

**Interview answer:** I chain a read stream, a line splitter, a transform that parses and filters, and a write stream using `pipeline`. Because chunk boundaries do not align with lines, I either use `readline` to produce lines or buffer the partial last line in my transform. Using an async generator function as a pipeline stage is the modern concise approach: it consumes the source with `for await` and yields output, and backpressure is respected automatically because the generator pauses between yields. Memory stays constant no matter how large the file is, and errors in any stage abort the whole pipeline. For true CSV parsing with quoted fields I would use a proper parser library rather than splitting on commas.

**Hinglish explanation:** Bade file ko lines me tod kar ek-ek record process karo. Chunk ki boundary line ki boundary nahi hoti, isliye `readline` ya async generator use karte hain. Result: 10 GB file bhi kam RAM me.

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';

async function* activeUsers(lines) {
  for await (const line of lines) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line);              // wrap in try/catch to skip bad lines in real code
    if (rec.active) yield `${JSON.stringify({ id: rec.id, email: rec.email })}\n`;
  }
}

const lines = createInterface({ input: createReadStream('users.ndjson'), crlfDelay: Infinity });
await pipeline(lines, activeUsers, createWriteStream('active.ndjson'));
```

**Follow-ups:**
- Q: Why not `split('\n')` per chunk? A: A record can be cut across chunks, producing invalid JSON.
- Q: How would you extend this to object mode transforms? A: `new Transform({ objectMode: true, transform(chunk, enc, cb) { ... cb(null, out); } })`.

---

### Q-NODE-22 | Intermediate | [ESSENTIAL] | What is EventEmitter and where is it used in Node?

**Question:** Explain the observer pattern with `EventEmitter`. Is emitting synchronous?

**Interview answer:** `EventEmitter` implements a publish-subscribe pattern: objects call `emit('event', data)` and registered listeners added through `on` or `once` are invoked. Many core APIs are built on it: streams, HTTP servers and requests, sockets, and `process`. Emission is synchronous: `emit` calls each listener in the order they were registered, immediately, before returning, so a slow listener delays the emitter. Listeners are not asynchronous just because they are events; if I need async behavior I must schedule it in the listener. I use `once` for one-time events, `off` to remove listeners, and `events.once()` to await an event as a promise.

**Hinglish explanation:** EventEmitter = notice board: ek taraf se "event hua" bolo, jinhone sun'ne ka register kiya wo sab call ho jate hain. Dhyan rahe: `emit` sync hai, yani listener khatam hone tak `emit` wapas nahi aata. HTTP server, streams sab isi par bane hain.

```js
import { EventEmitter, once } from 'node:events';

class OrderService extends EventEmitter {
  place(order) {
    // ...save...
    this.emit('order:placed', order);      // listeners run synchronously here
    return order.id;
  }
}
const svc = new OrderService();
svc.on('order:placed', o => console.log('email for', o.id));
svc.once('order:placed', o => console.log('first order only', o.id));

setTimeout(() => svc.place({ id: 1 }), 10);
const [order] = await once(svc, 'order:placed');   // promise form
console.log('awaited', order.id);
```

**Follow-ups:**
- Q: What happens if no listener is attached when emitting? A: Nothing, except for the special `'error'` event (Q-NODE-23).
- Q: Why not use EventEmitter for cross-service messaging? A: It is in-process only and has no durability or delivery guarantees; use a queue or broker for that.

---

### Q-NODE-23 | Intermediate | [ESSENTIAL] | EventEmitter pitfalls: the 'error' event and listener leaks.

**Question:** What happens when an emitter emits `'error'` without a listener? What does "MaxListenersExceededWarning" mean?

**Interview answer:** If an `'error'` event is emitted and nobody listens, Node throws the error, which becomes an uncaught exception and crashes the process. So any emitter that can fail, such as streams and sockets, needs an error listener (or you use `pipeline`, which attaches handlers). `MaxListenersExceededWarning` appears when more than 10 listeners (the default) are added for a single event on one emitter; it is a heuristic warning about a probable leak, typically adding a listener on every request without removing it. The fix is to remove listeners (`off`, `once`), reuse a single listener, or restructure; I raise the limit with `setMaxListeners` only when the high number is intentional. Leaked listeners keep their closures and captured objects alive, which grows memory.

**Hinglish explanation:** `error` event ka listener nahi hai to process crash. Aur agar har request par `emitter.on(...)` lagate ho aur hataate nahi, to listeners jama hote rehte hain: warning aati hai aur memory badhti hai. Ye real production leak ka classic reason hai.

```js
import { EventEmitter } from 'node:events';
const bus = new EventEmitter();

try { bus.emit('error', new Error('boom')); }       // no listener -> throws
catch (e) { console.log('thrown:', e.message); }

bus.on('error', e => console.log('handled:', e.message));
bus.emit('error', new Error('boom2'));

// leak pattern:
// app.get('/x', (req, res) => { bus.on('tick', () => res.write('.')); });  // [X] never removed
// fix: bus.once(...) or remove with bus.off(...) on res 'close'
```

**Follow-ups:**
- Q: How do you find the leaking emitter? A: Run with `--trace-warnings` to see the stack trace of the warning.
- Q: Does `once` clean itself up? A: Yes, it removes the listener after the first call.

---

### Q-NODE-24 | Intermediate | [ESSENTIAL] | How does V8 manage memory and garbage collection?

**Question:** Explain the V8 heap, generational garbage collection, and what "stop the world" means.

**Interview answer:** V8 allocates JavaScript objects on a managed heap and frees them automatically with garbage collection, based on reachability: objects reachable from roots (globals, the stack, active closures) are kept, and everything else is collected. The heap is generational. New objects go to a small young generation, collected frequently and cheaply by a scavenger that copies survivors; objects that survive a couple of cycles are promoted to the old generation, which is collected less often by mark-sweep-compact. Modern V8 uses incremental, concurrent and parallel techniques to reduce pause times, but some phases still pause JavaScript execution briefly, which is called stop-the-world. Memory outside the heap, such as `Buffer` data, is tracked separately as external memory. Practically, I reduce garbage pressure by avoiding unnecessary allocations in hot paths and by not holding references longer than needed.

**Hinglish explanation:** Naye objects "nursery" me jate hain; jo jaldi mar jate hain unko saaf karna sasta hai. Jo bach jate hain wo "old space" me chale jate hain jahan safai kam hoti hai par mehengi. GC ka rule: agar koi root se object tak pahunch sakta hai to wo zinda hai. Isliye "forgotten reference" hi memory leak hai.

```js
// observe memory in a running process
const { heapUsed, heapTotal, rss, external, arrayBuffers } = process.memoryUsage();
console.log({
  heapUsedMB: (heapUsed / 1048576).toFixed(1),
  rssMB: (rss / 1048576).toFixed(1),       // total resident memory incl. native + buffers
  externalMB: (external / 1048576).toFixed(1),
});
```

**Follow-ups:**
- Q: Can you force GC? A: Only with `--expose-gc` and `global.gc()`, for diagnostics, not production logic.
- Q: Why can RSS be much higher than `heapUsed`? A: RSS includes native memory, buffers, code, thread stacks and fragmentation not returned to the OS.
- Q: What do `WeakMap` and `WeakRef` do? A: They hold references that do not keep objects alive, useful for caches attached to objects.

---

### Q-NODE-25 | Intermediate | [ESSENTIAL] | What causes memory leaks in Node.js and how do you diagnose one?

**Question:** List common causes of memory leaks and describe how you would find the leak in a running service.

**Interview answer:** Common causes are unbounded in-memory caches or maps keyed by user or request, global arrays that keep growing (logs, queues), event listeners added repeatedly and never removed, timers or intervals that are never cleared and hold closures, closures retaining large objects, unclosed resources such as sockets or streams, and per-request data stored on module-level variables. To diagnose, I first confirm the pattern: heap used climbs steadily across GC cycles and does not return after load stops, using `process.memoryUsage()` or a metrics dashboard. Then I take heap snapshots at different times with `--inspect` and Chrome DevTools, or `v8.writeHeapSnapshot()` or `--heapsnapshot-signal`, and compare them to see which object types and retainers grow. Fixes include bounded caches with eviction (LRU with TTL), removing listeners, clearing timers, and moving state to Redis or a database. As a stopgap, restarts and memory limits contain the damage but do not fix the cause.

**Hinglish explanation:** Leak = object ki zaroorat khatam par kisi ne reference pakad ke rakha. Common: global `Map` jisme kabhi delete nahi, `setInterval` jo clear nahi hua, listener jo hataya nahi. Dhoondhne ka tareeka: do heap snapshots (pehle aur baad me) compare karo aur dekho kaun sa type badh raha hai aur kaun usko "retain" kar raha hai.

```js
// classic leak
const cache = new Map();
export function getUser(id) {
  if (!cache.has(id)) cache.set(id, loadUser(id));   // [X] grows forever
  return cache.get(id);
}
// fix: bounded cache with TTL / max size (LRU) or use Redis with expiry

import v8 from 'node:v8';
// on demand: writes a .heapsnapshot file you can open in Chrome DevTools
// v8.writeHeapSnapshot();
```

**Follow-ups:**
- Q: Is a growing heap always a leak? A: No; caches fill up and GC is lazy. A leak is growth that continues after GC and stable load.
- Q: Why is taking a snapshot risky in production? A: It pauses the process and needs memory about equal to the heap; take it on one instance removed from the load balancer.
- Q: Tools? A: Chrome DevTools, `clinic heapprofiler`, `--heap-prof`, APM tools.

---

### Q-NODE-26 | Advanced | [ADVANCED] | What is the heap limit and how do containers affect Node memory?

**Question:** Your Node service in a 512 MB container is OOM-killed. How can that happen even if the V8 heap looks fine, and what do you configure?

**Interview answer:** V8's old-space limit is set by `--max-old-space-size` (in MB); the default depends on the Node version and detected system memory, and in containers it can be larger than the container allows if the runtime does not account for cgroup limits properly. The process also uses memory outside the V8 heap: Buffers and external memory, native addons, thread stacks, the code cache and fragmentation. The kernel kills the process when total RSS exceeds the container limit, even if `heapUsed` is under the heap limit. I set the heap limit explicitly to about 70-75 percent of the container memory, for example `node --max-old-space-size=384 app.js` for 512 MB, watch both `rss` and `heapUsed`, and avoid loading large payloads into memory by streaming. If the heap limit itself is hit, Node crashes with a "JavaScript heap out of memory" fatal error.

**Hinglish explanation:** Heap sirf ek hissa hai. Buffers, native memory, threads ka stack alag se RAM khate hain. Container limit RSS par lagti hai, heap par nahi. Isliye `--max-old-space-size` container limit se kam rakho (~75%) aur `rss` bhi monitor karo.

**Follow-ups:**
- Q: Exit code 137 meaning? A: The process received `SIGKILL` (128 + 9), commonly the kernel OOM killer.
- Q: How do you reduce memory? A: Stream large data, paginate queries, cap request body size, bound caches, and avoid large intermediate arrays.

---

### Q-NODE-27 | Intermediate | [ESSENTIAL] | How do you implement graceful shutdown in a Node HTTP service?

**Question:** On deploy, the platform sends SIGTERM. What should your service do, and in what order?

**Interview answer:** First, stop accepting new connections by calling `server.close()`; in Node 19 and later this also closes idle keep-alive connections, and I can call `server.closeIdleConnections()` explicitly on older versions. Existing in-flight requests are allowed to finish. Then, once the server has closed, close shared resources in reverse order of creation: message consumers, database pool, Redis client, and flush logs. I set a hard deadline timer, for example 10 to 25 seconds, after which I force-exit with a non-zero code so a stuck connection cannot block the deploy, and I make sure the timer does not itself keep the process alive (`unref`). The health check should start failing (readiness) as soon as shutdown starts so the load balancer stops sending traffic. Handling `SIGINT` the same way helps local development.

**Hinglish explanation:** Deploy ke time naya request lena band karo, jo chal rahi hain unhe khatam hone do, phir DB/Redis band karo, aur phir exit. Agar koi atka hai to 10-25 second ke baad force kill. Bina isake, user ki request beech me tut sakti hai (payment bhi!).

```js
import http from 'node:http';
import { pool } from './db.js';   // mysql2/promise pool

const server = http.createServer(app).listen(3000);
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received`);
  const force = setTimeout(() => process.exit(1), 15_000);
  force.unref();
  server.close(async () => {                 // called when all connections ended
    await pool.end();
    process.exit(0);
  });
  server.closeIdleConnections?.();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**Follow-ups:**
- Q: What about long-lived connections (WebSocket, SSE)? A: Notify clients and close them explicitly; `server.close()` waits for them otherwise.
- Q: Why is readiness different from liveness? A: Readiness controls traffic routing; liveness decides restarts. During shutdown, report not-ready but still alive.

---

### Q-NODE-28 | Intermediate | [ESSENTIAL] | How does Node handle thousands of concurrent connections, and when is Node a bad choice?

**Question:** Why can one Node process serve 10,000 concurrent connections, and for which workloads does it perform poorly?

**Interview answer:** Most backend requests spend their time waiting on the network, database or disk, not on CPU. In Node, a waiting request holds only a small object and a socket registered with the OS poller, not a dedicated thread, so thousands of waiting requests cost little memory and the single thread is free to run other handlers whenever data arrives. This works well for I/O-bound workloads: APIs, proxies, real-time messaging, and streaming. It performs poorly when each request needs significant CPU on the main thread, such as image or video processing, heavy cryptography, large-scale numerical computation, or complex report rendering, because one request blocks all others. For those, I offload to worker threads, a job queue with separate worker processes, or a service in another language, and still use Node as the API layer.

**Hinglish explanation:** Zyada tar request "wait" karti hai (DB, API, disk). Wait karne ke liye thread nahi chahiye, isliye Node halka rehta hai. Par agar request CPU kaam kare (video encode, bade calculation), to wo main thread rok deti hai. Tab queue/worker use karo.

**Follow-ups:**
- Q: What is the C10K problem? A: Handling 10,000 concurrent connections; thread-per-connection servers struggled, event-driven I/O solved it.
- Q: How do you scale a Node API horizontally? A: Run stateless instances behind a load balancer; keep session/cache state in Redis or the database.

---

### Q-NODE-29 | Intermediate | [ADVANCED] | How does module caching work and what are circular dependencies?

**Question:** What happens when two files require the same module? What happens with circular imports?

**Interview answer:** A module is executed only once; the result is cached, so subsequent `require` or `import` of the same resolved path returns the same exports object or bindings. In CommonJS the cache is `require.cache`, keyed by resolved filename. This makes modules natural singletons, for example a shared database pool, but also means module-level state is shared across all requests in the process. A circular dependency occurs when A imports B and B imports A. In CommonJS the second module receives the partially completed exports of the first (possibly an empty object), which causes subtle `undefined` bugs; in ESM, live bindings are created and accessing them before initialization throws a `ReferenceError` (temporal dead zone). The fix is to restructure: extract shared code into a third module, inject dependencies, or import lazily inside functions.

**Hinglish explanation:** Module ek hi baar chalta hai aur result cache hota hai, isliye `db` connection wali file kitni bhi baar import karo, ek hi instance milega. Circular import me ek module aadhe-bane hue doosre module ko dekhta hai, isliye `undefined` aata hai. Solution: common cheez ko teesri file me nikal do.

```js
// counter.js (ESM): executed once, state shared by every importer
export let count = 0;
export const inc = () => { count++; };

// a.js
import { inc, count } from './counter.js';
inc();
console.log(count);        // 1 (live binding reflects updates)
```

**Follow-ups:**
- Q: How do you tell if a design is too circular? A: Tools such as `madge`; also a sign that layering (routes -> services -> repositories) is violated.
- Q: Is clearing `require.cache` a good idea? A: Only for tooling or tests; in production it creates duplicate state.

---

### Q-NODE-30 | Basic | [ESSENTIAL] | What does Express add over Node's built-in http module? What built-in features should a modern Node developer know?

**Question:** Write a minimal server with `node:http`. Then explain what a framework adds, and which modern built-ins reduce dependencies.

**Interview answer:** The `http` module gives raw `req` and `res` streams: I must parse the URL, match methods and paths manually, parse request bodies, set headers and status codes, and handle errors myself. Express adds routing with parameters, a middleware pipeline for cross-cutting concerns, helpers such as `res.json`, body parsing and static file serving, and an ecosystem of plugins; it does not change how Node's I/O works. Modern Node also ships useful built-ins that reduce dependencies: global `fetch`, `AbortController`, `node:test` test runner, `--watch` mode, `--env-file`, `crypto.randomUUID()`, `structuredClone`, `node:util` `parseArgs`, `stream/promises` and `timers/promises`. I choose a framework for maintainability, not performance.

**Hinglish explanation:** Raw `http` me sab kuch haath se karna padta hai: routing, body parse, JSON response. Express ye sab convenience deta hai. Aur Node me ab `fetch`, test runner, `--watch`, `--env-file` jaise cheezein built-in hain, to chhoti cheezon ke liye extra npm package ki zaroorat kam hai.

```js
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});
server.listen(3000, () => console.log('listening on 3000'));
```

**Follow-ups:**
- Q: Is Express slower than raw http? A: Slightly, but the difference is negligible next to database latency in typical apps. Fastify is another option with schema-based validation.
- Q: Is the global `fetch` production-ready? A: Yes (built on undici, stable since Node 21 and available in 18+); always set timeouts through `AbortSignal.timeout()`.

---


---

# Category 3 -- Express.js and API Design (`Q-EXP-`)

Related notes: Week 3 (all days). Examples use Express 5 and ES modules; Express 4 differences are flagged.

---

### Q-EXP-01 | Basic | [ESSENTIAL] | Walk through the HTTP request-response lifecycle for an API call.

**Question:** What happens from the moment a browser calls `fetch('https://api.shop.com/orders')` until it gets a response?

**Interview answer:** The client resolves the domain through DNS to an IP, opens a TCP connection, performs a TLS handshake for HTTPS, and sends an HTTP request containing a method, path, headers and optional body. Usually a load balancer or reverse proxy such as Nginx terminates TLS and forwards the request to one of the Node instances. Node's HTTP server parses the request, creates `req` and `res` objects, and Express runs the matching middleware and route handler chain: logging, body parsing, authentication, validation, controller, service and database calls. The handler sends a response with a status code, headers and body; the connection may be kept alive for subsequent requests. The client then parses the response. Failures can happen at every hop, which is why I debug layer by layer: DNS, network, proxy, app, database.

**Hinglish explanation:** Browser pehle domain ko IP me badalta hai, connection kholta hai (HTTPS me encryption setup), phir request bhejta hai. Beech me Nginx/load balancer hota hai jo Node tak pahunchata hai. Express middleware ki line se guzar kar handler tak jata hai, DB se data laata hai, aur response wapas bhejta hai.

```text
Client -> DNS -> TCP -> TLS -> [CDN/Load balancer/Nginx] -> Node http server
   -> Express: logger -> json parser -> auth -> validate -> controller -> service -> DB
   <- status + headers + body (JSON) <-
```

**Follow-ups:**
- Q: What is HTTP keep-alive? A: Reusing a TCP connection for multiple requests to avoid repeated handshakes.
- Q: What does HTTP/2 change? A: Multiplexing many requests on one connection, header compression; usually terminated at the proxy while the app speaks HTTP/1.1.
- Q: Where is a request timeout best set? A: At every layer: client, proxy, server (`server.requestTimeout`), and database queries.

---

### Q-EXP-02 | Basic | [ESSENTIAL] | HTTP methods: safe vs idempotent. Which methods are which?

**Question:** Explain safe and idempotent methods and classify GET, POST, PUT, PATCH, DELETE.

**Interview answer:** A safe method does not change server state, such as GET, HEAD and OPTIONS. An idempotent method has the same effect on the server whether it is called once or many times: GET, HEAD, PUT, DELETE and OPTIONS are idempotent. POST is neither safe nor idempotent: calling it twice may create two orders. PATCH is not guaranteed idempotent; it depends on the operation, for example "set status to shipped" is idempotent but "increment counter" is not. Idempotency matters because networks fail and clients retry; if a request is retried after a timeout, an idempotent operation is safe, and for non-idempotent operations such as payments I add an idempotency key. Note idempotent refers to server state effect, not to identical responses: the second DELETE may return 404 while the state remains the same.

**Hinglish explanation:** Safe = sirf padhna, kuch badalna nahi (GET). Idempotent = ek baar ya 10 baar karo, final result same (PUT, DELETE). POST har baar naya kaam kar sakta hai, isliye retry me khatarnak. Payment API me isliye idempotency key hoti hai.

| Method | Safe | Idempotent | Typical use |
|--------|------|------------|-------------|
| GET | yes | yes | read resource |
| POST | no | no | create / action |
| PUT | no | yes | replace whole resource |
| PATCH | no | depends | partial update |
| DELETE | no | yes | remove |

**Follow-ups:**
- Q: Can a GET change data? A: It should not; crawlers, prefetchers and caches assume GET is safe, and it also invites CSRF issues.
- Q: Why can the second DELETE return 404 and still be idempotent? A: The server state (resource absent) is the same; only the response differs.

---

### Q-EXP-03 | Intermediate | [ESSENTIAL] | PUT vs PATCH vs POST: when do you use which?

**Question:** An order has `status`, `address` and `items`. How do you design update endpoints?

**Interview answer:** `POST /orders` creates a new order and the server assigns the id; it returns 201 with a `Location` header. `PUT /orders/42` replaces the entire resource with the representation sent, so missing fields are reset or rejected; it is idempotent. `PATCH /orders/42` applies a partial change, for example only the address. For business actions that are not simple field updates, such as cancel or refund, I either model them as a sub-resource, `POST /orders/42/cancellation`, or as a state transition with validation, because arbitrary `PATCH` of `status` would bypass business rules. I always validate which fields are updatable and never let clients set protected fields such as `role`, `price` or `userId` directly (mass assignment).

**Hinglish explanation:** POST = naya banao. PUT = poora object replace karo. PATCH = sirf kuch fields badlo. "Cancel order" jaisa kaam sirf field badalna nahi hai, usme rules hote hain (shipped order cancel nahi ho sakta) - isliye alag endpoint ya service method rakho.

```js
// PATCH with an explicit allow-list (prevents mass assignment)
const PATCHABLE = ['address', 'note'];
router.patch('/orders/:id', async (req, res) => {
  const changes = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => PATCHABLE.includes(k)),
  );
  const order = await orderService.update(req.params.id, req.user.id, changes);
  res.json(order);
});
```

**Follow-ups:**
- Q: What is mass assignment? A: Blindly applying `req.body` to a model so an attacker sets fields like `isAdmin`.
- Q: What does JSON Merge Patch vs JSON Patch mean? A: Merge Patch (RFC 7386) sends a partial document; JSON Patch (RFC 6902) sends a list of operations such as add, remove, replace.

---

### Q-EXP-04 | Basic | [ESSENTIAL] | Which HTTP status codes do you use and when?

**Question:** What status codes would you return for create, validation failure, unauthenticated, forbidden, not found, conflict, rate limit and server error?

**Interview answer:** Success: 200 for a successful read or update, 201 for a created resource (with `Location`), 204 when there is no body, such as delete. Client errors: 400 for malformed requests, 401 when authentication is missing or invalid, 403 when the user is authenticated but not allowed, 404 for a missing resource, 409 for a conflict such as a duplicate email or version mismatch, 422 for semantically invalid data (many teams use 400 or 422 consistently for validation), and 429 for rate limiting with a `Retry-After` header. Server errors: 500 for unexpected failures, 502 or 504 for upstream problems, and 503 when the service is unavailable or shutting down. Consistency matters more than perfection, and the body should carry a machine-readable error code and a safe message.

**Hinglish explanation:** 2xx = sab theek, 4xx = client ki galti, 5xx = server ki galti. 401 = "tum kaun ho?" (login nahi), 403 = "tum ho par permission nahi". 404 = nahi mila. 409 = conflict (email already exists). 429 = bahut requests. 500 me internal details user ko mat dikhao.

**Follow-ups:**
- Q: 401 vs 403? A: 401 means not authenticated (credentials missing/invalid); 403 means authenticated but forbidden. For privacy, some APIs return 404 instead of 403 to hide resource existence.
- Q: 404 or 200 with empty list for a search with no results? A: A collection endpoint returns 200 with an empty array; 404 is for a specific missing resource.
- Q: Should errors return 200 with `success: false`? A: No; clients, caches, monitors and retries rely on status codes.

---

### Q-EXP-05 | Intermediate | [ESSENTIAL] | Which HTTP headers matter for APIs? (Content-Type, Accept, Authorization, Cache-Control, ETag)

**Question:** Explain the most important request and response headers in API work.

**Interview answer:** `Content-Type` describes the body format of the message, such as `application/json`, and `Accept` states what the client wants back; mismatches lead to 415 Unsupported Media Type or 406. `Authorization: Bearer <token>` carries credentials. `Cache-Control` controls caching (`no-store` for sensitive data, `max-age` for public static data), and `ETag` with `If-None-Match` enables conditional requests, where the server returns 304 Not Modified to save bandwidth. `Set-Cookie` and `Cookie` handle cookies. `Location` points to the new resource after a 201 or a redirect, `Retry-After` accompanies 429 or 503, and `X-Request-Id` or `traceparent` carry correlation ids. CORS headers such as `Access-Control-Allow-Origin` control cross-origin browser access, and security headers (`Strict-Transport-Security`, `Content-Security-Policy`) are typically added through helmet.

**Hinglish explanation:** Headers = request/response ke "metadata". `Content-Type` batata hai body kis format me hai, `Authorization` me token jata hai, `Cache-Control` batata hai response cache ho sakta hai ya nahi. Frontend me `fetch` ke `headers: {...}` me jo likhte ho wahi hain.

```js
app.get('/products/:id', async (req, res) => {
  const product = await productService.get(req.params.id);
  res.set('Cache-Control', 'public, max-age=60');   // fine for public catalog data
  res.json(product);                                // Express also sets ETag automatically
});
app.get('/me', auth, (req, res) => {
  res.set('Cache-Control', 'no-store');             // never cache personal data
  res.json(req.user);
});
```

**Follow-ups:**
- Q: Why may `req.body` be empty? A: The client did not send `Content-Type: application/json`, so `express.json()` skipped parsing.
- Q: What is `Vary`? A: It tells caches which request headers (like `Accept-Encoding` or `Origin`) affect the response.

---

### Q-EXP-06 | Intermediate | [ESSENTIAL] | Cookies: what attributes make them secure?

**Question:** Explain `HttpOnly`, `Secure`, `SameSite`, `Domain`, `Path` and `Max-Age`. When do you use cookies instead of the Authorization header?

**Interview answer:** A cookie is a small key-value pair the server sets with `Set-Cookie` and the browser automatically sends back for matching requests. `HttpOnly` blocks JavaScript access, reducing token theft through XSS. `Secure` sends the cookie only over HTTPS. `SameSite` limits cross-site sending: `Strict` and `Lax` reduce CSRF risk, while `None` requires `Secure` and is needed for genuine cross-site use. `Domain` and `Path` scope where the cookie is sent, and `Max-Age` or `Expires` set its lifetime. Cookies suit browser apps with server-side sessions or refresh tokens because the browser attaches them automatically and `HttpOnly` protects them, but automatic sending introduces CSRF concerns that need `SameSite` and sometimes CSRF tokens. Authorization headers suit mobile apps and service-to-service calls.

**Hinglish explanation:** Cookie browser ko server batata hai "ye yaad rakh, har request me wapas bhej". `HttpOnly` = JS se chura nahi sakte (XSS se bachav). `Secure` = sirf HTTPS. `SameSite` = doosri site se aane wali request me cookie nahi jayegi (CSRF se bachav).

```js
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,    // milliseconds in Express
});
```

**Follow-ups:**
- Q: `maxAge` unit in Express vs the `Max-Age` header? A: Express `res.cookie` takes milliseconds and converts; the header itself is seconds.
- Q: Why must you set `app.set('trust proxy', 1)` behind a proxy for secure cookies? A: Otherwise Express thinks the connection is HTTP and may refuse to set `Secure` cookies.
- Deeper security discussion is in `10_Question_Bank_B.md` (Q-SEC).

---

### Q-EXP-07 | Basic | [ESSENTIAL] | What are the REST principles?

**Question:** What makes an API RESTful? Is every JSON API REST?

**Interview answer:** REST is an architectural style with constraints: client-server separation, statelessness (each request carries all information needed, so servers do not store client session context between requests), cacheability, a uniform interface (resources identified by URLs, manipulated through standard methods and representations), layered system, and optionally code on demand. In practice, REST APIs model nouns as resources, use HTTP methods for actions and status codes for outcomes, and return JSON representations. Most JSON APIs are "REST-like"; strict REST also includes hypermedia (HATEOAS), which is rarely used. Statelessness is what lets me scale horizontally, because any instance can serve any request.

**Hinglish explanation:** REST ke andar: resources (orders, users) URL se pehchane jaate hain, HTTP method se action hota hai, aur server request ke beech koi session yaad nahi rakhta (stateless). Isliye 10 server instances ke peeche load balancer laga sakte ho. Har JSON API strictly REST nahi hoti, "REST-like" hoti hai - ye jaan lena interview me achha impression deta hai.

**Follow-ups:**
- Q: How can a stateless API handle login? A: Each request includes a token (JWT) or a session id cookie validated against a shared store; the server instances themselves keep no per-user memory.
- Q: REST vs GraphQL vs gRPC? A: REST is simple and cacheable; GraphQL lets clients choose fields at the cost of complexity and caching; gRPC is efficient for internal service-to-service calls.

---

### Q-EXP-08 | Basic | [ESSENTIAL] | How do you design resource URLs?

**Question:** Design endpoints for users, their orders and order items. What conventions do you follow?

**Interview answer:** URLs name resources with plural nouns and let the HTTP method express the action: `GET /users/12/orders`, `POST /orders`, `GET /orders/42`, `PATCH /orders/42`, `DELETE /orders/42/items/3`. I use lowercase and hyphens, keep nesting shallow (one or two levels) and avoid verbs in paths for CRUD. For actions that do not map to CRUD I use a sub-resource or an explicit action path such as `POST /orders/42/cancel` and document it consistently. Collections support query parameters for filtering, sorting and pagination (`?status=paid&sort=-createdAt&limit=20`). I return consistent JSON shapes and use identifiers that do not leak information, such as UUIDs, if enumeration is a concern.

**Hinglish explanation:** URL me noun rakho, verb nahi: `/orders` sahi, `/getOrders` galat. Action method se aata hai (GET/POST/PUT/DELETE). Filter/sort/pagination query string me. Zyada deep nesting mat karo: `/users/1/orders/2/items/3/...` bahut lamba ho jata hai.

```js
router.get('/users/:userId/orders', listUserOrders);   // collection under a user
router.post('/orders', createOrder);                    // create
router.get('/orders/:id', getOrder);                    // read
router.patch('/orders/:id', updateOrder);              // partial update
router.post('/orders/:id/cancel', cancelOrder);        // business action
```

**Follow-ups:**
- Q: `/orders/42/cancel` vs `PATCH status=cancelled`? A: An action endpoint centralizes business rules and side effects (refund, stock restore) and is easier to audit.
- Q: Why UUIDs instead of auto-increment ids in URLs? A: They prevent trivial enumeration and hide business volume, but indexes are larger; authorization checks are still required either way.

---

### Q-EXP-09 | Basic | [ESSENTIAL] | Set up an Express 5 server. What changed from Express 4?

**Question:** Show a minimal Express server with JSON parsing, a route and error handling. What are the notable Express 5 differences?

**Interview answer:** I create the app, register global middleware such as `express.json()`, mount routers, add a 404 handler and a final error-handling middleware, and then call `listen`. Express 5 changes that matter in interviews: it requires Node 18 or later; rejected promises and thrown errors in async handlers are forwarded to the error middleware automatically, so no wrapper is needed; route path syntax moved to `path-to-regexp` v8, so a wildcard must be named (`/*splat`) and optional segments use braces (`/:id{/:sub}`); `req.body` is `undefined` when no body parser ran (not `{}`); `req.query` uses the simple parser by default; and removed legacy APIs include `app.del()` and `req.param()`, and `res.status()` accepts only integers.

**Hinglish explanation:** Express 5 me sabse bada fayda: async handler me error aaye to khud error middleware tak pahunch jata hai (Express 4 me `try/catch + next(err)` lagana padta tha). Wildcard route ka syntax badla: `*` ki jagah `/*splat`. `req.body` ab parser na ho to `undefined` hota hai.

```js
import express from 'express';

const app = express();
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/users/:id', async (req, res) => {
  const user = await findUser(req.params.id);       // a rejection here reaches the error handler in v5
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  res.json(user);
});

app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
app.use((err, req, res, next) => {                   // 4 arguments: error middleware
  console.error(err);
  res.status(err.status ?? 500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
});

app.listen(3000);
```

**Follow-ups:**
- Q: Why must error middleware have four parameters? A: Express identifies error handlers by arity; with three it is treated as normal middleware.
- Q: In what order must middleware be registered? A: Order is execution order: parsers and auth before routes, 404 and error handlers last.

---

### Q-EXP-10 | Intermediate | [ESSENTIAL] | What is middleware and how does the order of middleware matter?

**Question:** Explain Express middleware, `next()`, and common bugs related to ordering or forgetting `next`.

**Interview answer:** Middleware is a function `(req, res, next)` that runs in the request-response pipeline. It can read or modify `req` and `res`, end the request by sending a response, or pass control to the next function by calling `next()`; calling `next(err)` jumps to the error handlers. Middleware runs in the order it is registered, so a body parser must come before routes that read `req.body`, authentication before protected routes, and the error handler last. Typical bugs: forgetting to call `next()` so the request hangs, calling `next()` and also sending a response which causes "Cannot set headers after they are sent", registering the CORS or auth middleware after the routes so it never applies, and doing heavy synchronous work inside middleware that runs on every request. Middleware can be applied globally, per router, or per route.

**Hinglish explanation:** Middleware = airport security checkpoints ki line. Har checkpoint ya to tumhe aage bhej deta hai (`next()`), ya rok deta hai (response bhej ke). Order matter karta hai: auth check route se pehle chahiye, warna route bina check ke khul jayega. `next()` bhoole to request hang ho jati hai.

```js
import { randomUUID } from 'node:crypto';

const requestId = (req, res, next) => {
  req.id = req.get('x-request-id') ?? randomUUID();
  res.set('X-Request-Id', req.id);
  next();                                  // pass control on
};
const timing = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.id} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
};
app.use(requestId, timing);
app.use('/admin', requireRole('admin'));    // applies only to /admin paths
```

**Follow-ups:**
- Q: What does `next('route')` do? A: Skips the remaining handlers of the current route and moves to the next matching route.
- Q: How do you share data between middleware? A: Attach to `req` (e.g. `req.user`) or `res.locals`; validate and document these properties.

---


### Q-EXP-11 | Intermediate | [ESSENTIAL] | How do you structure an Express app: routes, controllers, services, repositories?

**Question:** Why separate layers? Show where each piece of logic belongs.

**Interview answer:** I separate responsibilities so each layer is simple and testable. Routes map HTTP paths and methods to controllers and attach middleware. Controllers handle HTTP concerns only: read `req`, call a service, and shape the response and status code. Services contain business logic and rules, such as "a cancelled order cannot be shipped", and orchestrate transactions across repositories; they know nothing about `req` or `res`. Repositories (the data access layer) contain SQL or ORM calls. Benefits are that business logic can be unit-tested without HTTP, the database can change without touching controllers, and code is easier to review. I avoid over-engineering: for a tiny CRUD API, controller plus service is enough, and I keep dependencies flowing in one direction, from routes down to the repository.

**Hinglish explanation:** Route = darwaza, controller = receptionist (request padhta, response banata), service = manager (business rules), repository = store-keeper (database). Controller me SQL ya business logic mat bharo, warna test karna mushkil ho jata hai.

```js
// routes/orders.js
import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { auth } from '../middleware/auth.js';
export const orders = Router();
orders.post('/', auth, orderController.create);

// controllers/orderController.js
export const orderController = {
  async create(req, res) {
    const order = await orderService.create(req.user.id, req.body);   // HTTP stays here
    res.status(201).location(`/orders/${order.id}`).json(order);
  },
};

// services/orderService.js
export const orderService = {
  async create(userId, input) {
    if (input.items.length === 0) throw new AppError(422, 'EMPTY_ORDER', 'Order needs items');
    return orderRepo.insertWithItems(userId, input);                  // business rule + data access
  },
};
```

**Follow-ups:**
- Q: Where does validation go? A: Request shape validation in middleware (before the controller); business validation in the service.
- Q: Where do transactions live? A: In the service (it knows the unit of work), with the repository receiving a connection.

---

### Q-EXP-12 | Intermediate | [ESSENTIAL] | How do you validate requests in Express? Show a schema-based approach.

**Question:** Why validate input on the server? Show validation middleware using a schema library.

**Interview answer:** Client-side validation is for user experience only; any client can be bypassed, so the server must treat all input (body, query, params, headers) as untrusted. I validate with a schema library such as Zod, Joi or Ajv in a reusable middleware: it parses the input, rejects invalid data with a 400 or 422 and a structured list of field errors, and replaces `req.body` with the parsed, typed and trimmed output so that unknown fields are stripped. Validation checks types, formats, ranges, lengths and required fields, and enforces size limits. It complements, but does not replace, parameterized queries and output encoding.

**Hinglish explanation:** Frontend ki validation sirf UX ke liye hai; koi bhi Postman se seedha API maar sakta hai. Server par har input ko "untrusted" maano. Schema library se ek baar rules likho aur middleware me lagao. Unknown fields hata do taaki mass assignment na ho.

```js
import { z } from 'zod';

const createUserSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(72),          // 72 bytes is bcrypt's input limit
    age: z.coerce.number().int().min(18).optional(),
  }).strict(),                                     // reject unknown keys
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', details: result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) },
    });
  }
  Object.assign(req, { body: result.data.body });  // use parsed output
  next();
};
// router.post('/users', validate(createUserSchema), createUser);
```

**Follow-ups:**
- Q: Why `req.query` values are strings? A: Everything in a query string is text; coerce explicitly (`z.coerce.number()`) and bound the range.
- Q: Why limit password length to 72 bytes for bcrypt? A: bcrypt ignores bytes beyond 72, and unlimited length enables DoS.

---

### Q-EXP-13 | Intermediate | [ESSENTIAL] | Validation versus sanitization: what is the difference and where do they apply?

**Question:** Explain validation, sanitization and output encoding with examples.

**Interview answer:** Validation decides whether input is acceptable: reject an email that is not an email. Sanitization transforms input into a safe or normalized form: trimming whitespace, lowercasing emails, stripping unexpected fields, or removing dangerous HTML from rich text with a proper sanitizer library. Output encoding escapes data when it is placed in a specific context, such as HTML, SQL or shell, and is the main defense against XSS; for SQL the defense is not sanitization but parameterized queries. I prefer allow-list validation over trying to strip bad characters, because blacklists are easy to bypass. I validate on input and encode on output, and I avoid silently "fixing" data in ways that surprise the caller.

**Hinglish explanation:** Validation = "ye sahi hai ya nahi, galat to reject". Sanitization = "safai: trim, lowercase, extra fields hatao". Encoding = "data ko HTML/SQL me daalte waqt escape karo". SQL injection ka asli ilaaj parameterized query hai, "quotes hata do" wala jugaad nahi.

```js
// bad: string concatenation + "sanitizing" quotes
// db.query(`SELECT * FROM users WHERE email = '${email.replace("'", '')}'`);   [X]

// good: parameterized query (value never becomes SQL code)
const [rows] = await pool.execute('SELECT id, email FROM users WHERE email = ?', [email]);
```

**Follow-ups:**
- Q: Should you HTML-escape data before storing it? A: Generally no; store raw (validated) data and encode at output for the specific context.
- Q: Can you trust JSON schema validation alone for security? A: No; you still need authorization checks, parameterized queries and output encoding.

---

### Q-EXP-14 | Intermediate | [ESSENTIAL] | Design centralized error handling in Express.

**Question:** How do you avoid `try/catch` and error formatting scattered across controllers?

**Interview answer:** I define an `AppError` class for expected, operational errors with a status code, a stable machine-readable `code`, and a safe message. Controllers and services simply throw these; with Express 5 rejected async handlers go straight to a single error-handling middleware registered last. That middleware maps known errors, such as validation failures, JWT errors and database duplicate-key errors, to consistent HTTP responses, logs the error with the request id and stack trace, and for unknown errors returns a generic 500 without leaking internals. This gives consistent response format, one place to log, and keeps controllers focused. Programmer errors, such as a `TypeError`, are logged and returned as 500; for corrupted-state situations the process may be restarted.

**Hinglish explanation:** Har controller me try/catch likhne ke bajay, error `throw` karo aur ek hi error middleware sab handle kare. Fayde: sab errors ka format same, logging ek jagah, aur user ko stack trace kabhi nahi dikhta.

```js
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = true;               // safe to show message to the client
  }
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);          // let Express close the connection
  if (err.code === 'ER_DUP_ENTRY') err = new AppError(409, 'DUPLICATE', 'Resource already exists');
  const known = err instanceof AppError;
  if (!known) req.log?.error({ err, reqId: req.id }, 'unhandled error');
  res.status(known ? err.status : 500).json({
    error: {
      code: known ? err.code : 'INTERNAL_ERROR',
      message: known ? err.message : 'Something went wrong',
      requestId: req.id,
      ...(known && err.details ? { details: err.details } : {}),
    },
  });
}
// app.use(errorHandler)  // last
```

**Follow-ups:**
- Q: Why check `res.headersSent`? A: If the response has already started streaming, you cannot send a new one; delegate to Express's default handler.
- Q: Should you show `err.stack` in development? A: Optionally, but gate it strictly with `NODE_ENV` and never enable it in production.

---

### Q-EXP-15 | Intermediate | [ESSENTIAL] | How are async errors handled in Express 4 versus Express 5?

**Question:** What happens if an async route handler throws in Express 4? How does Express 5 differ?

**Interview answer:** In Express 4, a synchronous throw is caught by Express and passed to the error handler, but a rejected promise from an `async` handler is not caught, so it becomes an unhandled rejection: the request hangs and the process may crash. Teams solved it with `try/catch` and `next(err)` in every handler, a wrapper like `asyncHandler(fn)`, or the `express-async-errors` package. Express 5 handles promises natively: if a route handler or middleware returns a rejected promise, or throws inside an async function, Express calls `next(err)` automatically. Errors thrown in callbacks, timers or event handlers outside the promise chain are still not caught by Express and need explicit handling.

**Hinglish explanation:** Express 4 me `async (req, res) => { throw ... }` ka error kho jata tha. Wrapper lagana padta tha. Express 5 me ye built-in hai. Phir bhi, `setTimeout` ya event listener ke andar jo error aaye wo Express nahi pakadta.

```js
// Express 4 style wrapper (still seen in legacy code)
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.get('/users/:id', asyncHandler(async (req, res) => {
  res.json(await userService.get(req.params.id));
}));

// Express 5: no wrapper needed
router.get('/users/:id', async (req, res) => {
  res.json(await userService.get(req.params.id));  // rejection -> error middleware
});
```

**Follow-ups:**
- Q: Is the wrapper harmful in Express 5? A: No, but redundant; remove it when upgrading to reduce noise.
- Q: What about errors inside `res.on('finish')` callbacks? A: Not handled by Express; handle or log explicitly.

---

### Q-EXP-16 | Intermediate | [ESSENTIAL] | Operational errors vs programmer errors: how should each be handled?

**Question:** Distinguish operational from programmer errors with examples and describe the response strategy.

**Interview answer:** Operational errors are expected runtime problems that a correct program can encounter: invalid user input, a record not found, a database timeout, a third-party API failure, or a full disk. I handle them gracefully: return a proper status code, retry transient ones with backoff, and log at the right level. Programmer errors are bugs: `undefined is not a function`, wrong argument types, forgetting to await. They cannot be fixed by handling at runtime; I log them with full context, return a generic 500, fix the code, and in severe cases of unknown state I let the process crash and restart through a supervisor rather than continuing in a possibly corrupted state. The distinction guides alerting: operational errors are tracked by rate, programmer errors need a fix and often a page.

**Hinglish explanation:** Operational = "duniya me aise hota hai" (user ne galat email diya, DB timeout). Inhe sambhalo. Programmer error = hamari galti (bug). Inhe chhupao mat; log karo, fix karo. Ye dono ko alag treat karne se error middleware saaf banta hai.

**Follow-ups:**
- Q: Example of mapping a DB error? A: MySQL `ER_DUP_ENTRY` (errno 1062) becomes 409; `ER_NO_REFERENCED_ROW_2` becomes 422 or 400; connection errors become 503.
- Q: Should `uncaughtException` handlers keep the process running? A: No; log and exit after cleanup, as state may be inconsistent.

---

### Q-EXP-17 | Intermediate | [ESSENTIAL] | Write JWT authentication middleware for Express.

**Question:** Implement middleware that authenticates a bearer token and attaches the user. What mistakes should be avoided?

**Interview answer:** The middleware reads the `Authorization` header, checks it has the `Bearer` scheme, verifies the token signature, expiry and, importantly, restricts the accepted algorithm, then attaches a minimal user object, such as id and role, to `req.user`, and calls `next()`. Failures return 401 with a generic message; I do not reveal whether the token was malformed or expired in ways useful to an attacker, other than a distinct code for "expired" that clients use to refresh. Common mistakes are not specifying the algorithm in `verify`, using a weak or hardcoded secret, putting sensitive data in the payload (it is only encoded, not encrypted), trusting `role` from a client-supplied token without server-side checks for sensitive operations, and not handling token expiry. More depth on JWT is in the security bank.

**Hinglish explanation:** Token header se nikalo, verify karo (signature + expiry + algorithm fixed), `req.user` me daal do. Fail ho to 401. JWT ka payload encrypted nahi hota, bas base64 hai - password ya secret usme mat daalo.

```js
import jwt from 'jsonwebtoken';
import { AppError } from '../errors.js';

export function auth(req, res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'UNAUTHENTICATED', 'Missing token');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    throw new AppError(401, code, 'Invalid or expired token');
  }
}
```

**Follow-ups:**
- Q: Why must you pin the `algorithms` option? A: To prevent algorithm confusion attacks such as accepting `none` or switching RS256 to HS256.
- Q: Throwing inside synchronous middleware: does Express catch it? A: Yes, synchronous throws are caught in both Express 4 and 5 and forwarded to the error handler.

---

### Q-EXP-18 | Intermediate | [ESSENTIAL] | Authentication vs authorization in middleware: implement role and ownership checks.

**Question:** How do you restrict `DELETE /orders/:id` to admins or the order owner?

**Interview answer:** Authentication establishes who the caller is; authorization decides what they may do. In Express I run the auth middleware first to set `req.user`, then check permission either in a reusable role middleware (`requireRole('admin')`) or, for resource ownership, in the service after loading the resource, because ownership depends on data. A frequent vulnerability is broken object level authorization (BOLA, also called IDOR): the code verifies the user is logged in but not that the order belongs to them, so changing the id in the URL exposes someone else's data. I therefore include the owner in the query (`WHERE id = ? AND user_id = ?`) or compare after loading, and return 404 or 403 consistently.

**Hinglish explanation:** Authentication = "tum kaun ho", authorization = "tumhe ye karne ki permission hai ya nahi". Sirf login check karna kaafi nahi: `/orders/42` me 42 ko 43 karke kisi aur ka order dekh liya to ye IDOR bug hai. Hamesha ownership check karo.

```js
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
  next();
};

// service-level ownership check
export async function deleteOrder(user, orderId) {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  if (user.role !== 'admin' && order.userId !== user.id) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');   // hide existence
  }
  await orderRepo.delete(orderId);
}
```

**Follow-ups:**
- Q: Where should RBAC rules live as they grow? A: In a policy module or service layer, not scattered across routes.
- Q: What is the difference between RBAC and ABAC? A: Role-based uses roles; attribute-based evaluates attributes of user, resource and context (e.g. same department, business hours).

---

### Q-EXP-19 | Intermediate | [ESSENTIAL] | Offset vs cursor pagination: how do you design list endpoints?

**Question:** Compare `?page=3&limit=20` with `?cursor=...`. When does each fail?

**Interview answer:** Offset pagination uses `LIMIT n OFFSET m`. It is simple and allows jumping to arbitrary pages, but it gets slower as the offset grows because the database must scan and discard all skipped rows, and results can skip or duplicate records when data is inserted or deleted between page requests. Cursor (keyset) pagination remembers the last seen sort key, for example `WHERE created_at < ? OR (created_at = ? AND id < ?) ORDER BY created_at DESC, id DESC LIMIT 20`, which uses an index to seek directly to the position, giving stable and fast pages for large or live data such as feeds. Its downsides are no random page jumps and the need for a deterministic unique sort order. I always cap `limit`, return pagination metadata (total for offset when affordable, `nextCursor` for keyset), and define a stable sort including a unique tiebreaker.

**Hinglish explanation:** Offset = "pehle 10000 rows chhodo phir 20 do" - DB ko 10000 rows padhni hi padti hain, isliye slow. Cursor = "last dekhi hui row ke baad se 20 do" - index se seedha wahi pahunchta hai. Admin table me offset chalega, infinite scroll feed me cursor behtar.

```js
router.get('/orders', auth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);   // cap it
  const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null; // { createdAt, id }
  const [rows] = cursor
    ? await pool.execute(
        `SELECT id, total, created_at FROM orders
         WHERE user_id = ? AND (created_at < ? OR (created_at = ? AND id < ?))
         ORDER BY created_at DESC, id DESC LIMIT ${limit + 1}`,
        [req.user.id, cursor.createdAt, cursor.createdAt, cursor.id])
    : await pool.execute(
        `SELECT id, total, created_at FROM orders
         WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ${limit + 1}`,
        [req.user.id]);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  res.json({ items, nextCursor: hasMore ? encodeCursor(items.at(-1)) : null });
});
```

Note: `limit` is a validated integer that is inlined, because placeholders for `LIMIT` are unreliable with `execute()` on some MySQL versions; never inline untrusted strings.

**Follow-ups:**
- Q: Why fetch `limit + 1` rows? A: To know whether another page exists without a separate count query.
- Q: How do you build the cursor? A: Encode the last row's sort keys (e.g. base64url of JSON); sign it if you do not want clients to tamper.
- Q: Why is `COUNT(*)` for total expensive? A: It scans many rows on large tables; show approximate or omit.

---

### Q-EXP-20 | Intermediate | [ESSENTIAL] | How do you implement filtering and sorting safely?

**Question:** An endpoint supports `?status=paid&sort=-createdAt&minTotal=100`. How do you build the SQL safely?

**Interview answer:** I treat every query parameter as untrusted. Filter values go into the query as bound parameters. Column names and sort directions cannot be parameterized in SQL, so I map them through an explicit allow-list: the client sends a logical field name and I translate to a known column from a fixed map, rejecting anything else with 400. I validate types and ranges with a schema, cap the page size, and make sure the filtered and sorted columns are covered by suitable indexes, otherwise the endpoint becomes slow at scale. Building WHERE clauses dynamically from an array of conditions and parameters keeps the code clean and injection-free.

**Hinglish explanation:** Values ko `?` placeholder me daalo. Lekin column ka naam ya `ASC/DESC` placeholder nahi ban sakta, isliye allow-list rakho: client "createdAt" bheje to tum fixed map se `created_at` lagao. Jo list me nahi hai usko reject karo. Ye SQL injection se bachata hai.

```js
const SORTABLE = { createdAt: 'created_at', total: 'total' };
const FILTERS = {
  status: (v) => ['status = ?', v],
  minTotal: (v) => ['total >= ?', Number(v)],
};

export function buildOrderQuery(query, userId) {
  const where = ['user_id = ?'];
  const params = [userId];
  for (const [key, build] of Object.entries(FILTERS)) {
    if (query[key] !== undefined) { const [sql, val] = build(query[key]); where.push(sql); params.push(val); }
  }
  const desc = String(query.sort ?? '-createdAt').startsWith('-');
  const field = String(query.sort ?? '-createdAt').replace(/^-/, '');
  const column = SORTABLE[field];
  if (!column) throw new AppError(400, 'BAD_SORT', 'Unsupported sort field');
  const sql = `SELECT id, status, total, created_at FROM orders WHERE ${where.join(' AND ')} ORDER BY ${column} ${desc ? 'DESC' : 'ASC'}, id DESC`;
  return { sql, params };
}
```

**Follow-ups:**
- Q: Why not pass `ORDER BY ?`? A: A placeholder binds a value, not an identifier, so it would sort by a constant string; hence the allow-list.
- Q: How do you handle full-text search? A: Use a FULLTEXT index in MySQL or a search engine; `LIKE '%term%'` cannot use a normal B-tree index.

---


### Q-EXP-21 | Intermediate | [ESSENTIAL] | How do you version an API and handle breaking changes?

**Question:** What are the versioning strategies and what counts as a breaking change?

**Interview answer:** Breaking changes include removing or renaming a field, changing a field's type or meaning, making an optional input required, changing status codes or error formats, and tightening validation. Non-breaking changes are adding optional fields or new endpoints. Common versioning strategies are the URL path (`/v1/orders`), which is simple, visible and cache friendly; a header such as `Accept: application/vnd.shop.v2+json`, which keeps URLs clean but is harder to test and debug; or a query parameter. For most teams I recommend path versioning, introduced only for breaking changes, with additive evolution inside a version. I support the old version for a documented deprecation period, communicate it with `Deprecation` and `Sunset` headers, monitor usage per version, and share business logic in services so that versions differ only at the controller or serializer level.

**Hinglish explanation:** Mobile apps purane version par mahino chalte rehte hain, isliye API todna khatarnak hai. Naya field add karna safe hai; field hatana ya type badalna breaking hai. `/v1`, `/v2` sabse aasaan aur clear hai. Purana version turant band mat karo: pehle deprecate karo, usage dekho, phir hatao.

```js
import { Router } from 'express';
import { ordersV1 } from './v1/orders.js';
import { ordersV2 } from './v2/orders.js';

const api = Router();
api.use('/v1/orders', ordersV1);
api.use('/v2/orders', ordersV2);
api.use('/v1', (req, res, next) => {
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Wed, 31 Dec 2026 23:59:59 GMT');
  next();
});
app.use('/api', api);
```

**Follow-ups:**
- Q: Can you avoid versions entirely? A: Largely, with additive changes and tolerant clients (Postel's law), but breaking changes eventually happen.
- Q: How do you share logic between versions? A: One service layer, separate request/response mappers per version.

---

### Q-EXP-22 | Intermediate | [ESSENTIAL] | How do you handle file uploads safely in Express?

**Question:** Implement an upload endpoint and describe the security and scalability concerns.

**Interview answer:** For `multipart/form-data` I use a library such as Multer (built on busboy) because `express.json()` cannot parse files. I configure limits on file size and count, filter by MIME type and also verify the actual content (magic bytes) because the declared type is client-controlled, generate my own random filenames instead of trusting the original name (path traversal and overwrite), and store files outside the web root. In production I avoid keeping files on the app server's disk: with several instances and ephemeral containers, I stream to object storage such as S3, or better, issue a pre-signed upload URL so the client uploads directly and the API only stores metadata. For large files I stream rather than buffer, scan for malware if users share files, and set body size limits at the proxy as well.

**Hinglish explanation:** Upload = multipart request; Multer parse karta hai. Security: size limit, file type check (sirf extension ya header par bharosa mat karo), random filename. Production me file server ke disk par mat rakho; S3 jaise storage me bhejo, ya pre-signed URL se client seedha S3 me upload kare, jisse tumhara server halka rehta hai.

```js
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const ALLOWED = new Set(['image/png', 'image/jpeg']);
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',                                    // outside the public static dir
    filename: (req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(ALLOWED.has(file.mimetype) ? null : new AppError(415, 'BAD_TYPE', 'Only PNG or JPEG'), ALLOWED.has(file.mimetype)),
});

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  // req.file.path, req.file.size ... verify magic bytes, then move to object storage
  res.status(201).json({ id: req.file.filename });
});
```

**Follow-ups:**
- Q: Why is the file extension or MIME type not enough? A: Both are controlled by the client; inspect magic bytes and re-encode images when possible.
- Q: What happens to files when a container restarts? A: Local disk is lost unless it is a mounted volume, which is why object storage is preferred.

---

### Q-EXP-23 | Basic | [ESSENTIAL] | How do you document an API? (OpenAPI / Swagger)

**Question:** What is OpenAPI, and how do you keep documentation in sync with code?

**Interview answer:** OpenAPI is a standard machine-readable specification, in YAML or JSON, describing endpoints, parameters, request and response schemas, authentication and error responses. Swagger UI or Redoc renders it as interactive documentation, and tools can generate client SDKs, mock servers and contract tests from it. To keep docs in sync, I either write the spec first (design-first) and validate requests against it, or generate it from code-level schemas such as Zod or JSON Schema, and run a contract test in CI that fails when behavior diverges. Good documentation also covers authentication, pagination conventions, error format, rate limits and examples. Stale docs are worse than no docs, so I treat the spec as part of the code review.

**Hinglish explanation:** OpenAPI = API ka "contract" ek file me. Frontend team, QA aur mobile team sab isse padh sakti hai aur Swagger UI me try bhi kar sakti hai. Dikkat: docs purane ho jate hain. Isliye ya to schema se generate karo ya CI me check lagao.

```yaml
openapi: 3.0.3
info: { title: Shop API, version: 1.0.0 }
paths:
  /v1/orders/{id}:
    get:
      summary: Get one order
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      responses:
        '200': { description: OK }
        '404': { description: Order not found }
security: [{ bearerAuth: [] }]
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
```

**Follow-ups:**
- Q: Design-first vs code-first? A: Design-first improves agreement before coding; code-first is faster for small teams but risks drift.
- Q: Should Swagger UI be public in production? A: Usually restrict it or expose only docs for public APIs; it reveals your attack surface.

---

### Q-EXP-24 | Intermediate | [ESSENTIAL] | What is CORS and why does the browser block my request?

**Question:** Explain CORS, the same-origin policy and how to configure it in Express.

**Interview answer:** The same-origin policy stops JavaScript on one origin (scheme, host and port) from reading responses from another origin. CORS is the opt-in mechanism through which a server tells the browser which other origins are allowed, using headers such as `Access-Control-Allow-Origin`. The enforcement is entirely in the browser: the server still receives and processes the request, and tools like Postman or curl are not restricted, which is why "it works in Postman" tells nothing about CORS. In Express I use the `cors` middleware with an explicit allow-list of origins rather than `*`, particularly when credentials (cookies) are used, since `Access-Control-Allow-Origin: *` cannot be combined with credentials. CORS is not a security control against attackers calling the API directly; it protects users' browsers from malicious sites.

**Hinglish explanation:** Browser ka rule: `site-a.com` ka JS `api.site-b.com` ka response tab hi padh sakta hai jab server bole "haan, site-a allowed hai". Ye check browser karta hai, server nahi. Isliye Postman me chalta hai par browser me CORS error. Frontend developer hone ke naate tumne ye error dekha hoga - ab backend side se fix karna seekho.

```js
import cors from 'cors';

const allowed = new Set(['https://app.shop.com', 'http://localhost:5173']);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowed.has(origin)),   // allow non-browser (no Origin) and listed origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,                  // only with explicit origins
  maxAge: 600,                        // cache preflight 10 min
}));
```

**Follow-ups:**
- Q: Does CORS protect my API from other servers or scripts? A: No, only from other websites in a user's browser; you still need authentication and authorization.
- Q: Why does a wildcard origin fail with cookies? A: Browsers refuse credentialed requests when `Access-Control-Allow-Origin` is `*`.

---

### Q-EXP-25 | Intermediate | [ESSENTIAL] | What is a CORS preflight request and why does it fail?

**Question:** When does the browser send an OPTIONS request? What are the usual reasons it fails?

**Interview answer:** For non-simple cross-origin requests, such as methods other than GET, POST and HEAD, or requests with custom headers like `Authorization` or a `Content-Type` of `application/json`, the browser first sends an `OPTIONS` preflight asking whether the real request is allowed. The server must respond with 2xx and the headers `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` covering the real request. Typical failures: the CORS middleware is registered after the authentication middleware, so `OPTIONS` is rejected with 401; the server's allow-headers list is missing a header that the client sends; the proxy strips or blocks `OPTIONS`; the response redirects; or the origin is not in the allow-list. The fix is to register CORS before auth and routes, and to check the exact failing header in the browser console and network tab.

**Hinglish explanation:** Browser pehle "OPTIONS" bhejke poochta hai "kya main ye request bhej sakta hoon?" Tabhi asli request jati hai. Agar auth middleware CORS se pehle laga hai, to OPTIONS par 401 aa jata hai kyunki usme token hota hi nahi - yahi sabse common bug hai.

```js
// order matters
app.use(cors(corsOptions));      // 1. handles OPTIONS and adds headers
app.use(express.json());
app.use('/api', auth, routes);   // 2. auth only after CORS
```

**Follow-ups:**
- Q: Do simple GET requests need a preflight? A: Not if there are no custom headers; with `Authorization` they do.
- Q: How do you debug quickly? A: Browser DevTools Network tab, inspect the OPTIONS request and response headers, and compare with the console error message.

---

### Q-EXP-26 | Intermediate | [ESSENTIAL] | How do you debug a request that hangs, returns 404 or returns 500?

**Question:** An API call from the frontend is slow or failing. Describe your debugging approach layer by layer.

**Interview answer:** I reproduce it with curl or Postman to separate frontend and backend causes, then follow the request: check DNS and TLS, the proxy or load balancer logs, then the application logs by request id. A request that hangs usually means a handler never sent a response or never called `next()`, an awaited promise never settles (a missing timeout on an external call, an exhausted database pool), or a proxy timeout. A 404 indicates routing problems: wrong base path or version prefix, route registered after the 404 handler, a different HTTP method, trailing slashes, or the router not mounted. A 500 means a thrown error: I check structured logs with the stack trace and request id, the exact input, and the database error code. I add timing logs per layer (controller, service, query) to find where time goes, and reproduce with the same payload locally.

**Hinglish explanation:** Pehle dekho problem frontend ki hai ya backend ki (curl se hit karo). Phir request ke raaste ko follow karo: proxy, app, DB. Hang = response nahi gaya (next() bhoola, promise atak gaya, DB pool full). 404 = route ya path ka mismatch. 500 = code me exception, log me stack trace dekho.

```js
// a quick tracer to find where a request stalls
app.use((req, res, next) => {
  const t = Date.now();
  console.log(`--> ${req.method} ${req.originalUrl}`);
  res.on('finish', () => console.log(`<-- ${res.statusCode} in ${Date.now() - t}ms`));
  res.on('close', () => { if (!res.writableFinished) console.log('client closed early'); });
  next();
});
```

**Follow-ups:**
- Q: How can a missing `return` cause "headers already sent"? A: Code continues after `res.json()` and sends a second response; `return res.json(...)`.
- Q: What if only production fails? A: Compare environment variables, config, proxy rules (body size, timeouts), data volume and database indexes.

---

### Q-EXP-27 | Basic | [ESSENTIAL] | How does body parsing work and what limits should you set?

**Question:** What do `express.json()` and `express.urlencoded()` do? What does a 413 mean?

**Interview answer:** `express.json()` reads the request stream, and if `Content-Type` is `application/json` it parses the body into `req.body`; `express.urlencoded({ extended: false })` does this for HTML form posts. Parsers should have size limits (`limit: '100kb'`) to prevent memory exhaustion by huge payloads; exceeding the limit produces a 413 Payload Too Large error. Invalid JSON produces a 400 error from the parser, which my error handler should convert into a clean response. Because the body is a stream, it can be read only once, so middleware must not consume it before the parser. For webhooks that need to verify a signature, I need the raw body bytes (`express.raw()` or the `verify` callback), because re-serializing parsed JSON changes the bytes. File uploads need `multipart` handling instead.

**Hinglish explanation:** Request ka body ek stream hai; `express.json()` usse padhke `req.body` object bana deta hai. Limit zaroor lagao, warna koi 500 MB ka JSON bhejke memory khatam kar sakta hai. Webhook signature verify karna ho to raw bytes chahiye, parsed JSON nahi.

```js
app.post('/webhooks/payments', express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
  const signature = req.get('x-signature');
  if (!verifySignature(req.body /* Buffer */, signature)) return res.sendStatus(401);
  const event = JSON.parse(req.body.toString('utf8'));
  res.sendStatus(200);
});
app.use(express.json({ limit: '100kb' }));       // other routes
```

**Follow-ups:**
- Q: Why register the webhook route before the global `express.json()`? A: Once JSON is parsed the raw body is consumed; the raw parser must run first for that path.
- Q: Why is `req.body` `undefined` in Express 5 without a parser? A: Express 5 no longer initializes it to `{}`, which surfaces missing-middleware mistakes.

---

### Q-EXP-28 | Advanced | [ESSENTIAL] | How do you make a POST endpoint idempotent (duplicate request protection)?

**Question:** A client times out on `POST /payments` and retries. How do you avoid charging twice?

**Interview answer:** I require the client to send a unique `Idempotency-Key` header per logical operation. On the first request, the server stores the key together with a hash of the request payload and a status of in-progress, in a table with a unique constraint on the key (per user), then performs the operation and saves the response. If the same key arrives again, the server returns the stored response instead of re-executing; if the key is reused with a different payload it returns 422 or 409; if the first request is still in progress it returns 409 or waits. The unique constraint is what makes this safe under concurrent duplicates, since two parallel requests cannot both insert the key. Keys expire after a retention period such as 24 hours, and the operation itself and the key record are written in the same database transaction where possible.

**Hinglish explanation:** Client har payment request ke saath ek unique key bhejta hai. Server pehli baar kaam karke result key ke saath save kar leta hai. Retry aaye (same key) to naya charge nahi, purana result wapas. Safety DB ke unique constraint se aati hai, `if (!exists)` check se nahi, kyunki do requests ek saath aa sakti hain (race condition).

```js
export async function withIdempotency(pool, userId, key, payloadHash, work) {
  try {
    await pool.execute(
      `INSERT INTO idempotency_keys (user_id, idem_key, request_hash, status)
       VALUES (?, ?, ?, 'in_progress')`,
      [userId, key, payloadHash]);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    const [[row]] = await pool.execute(
      'SELECT request_hash, status, response_json FROM idempotency_keys WHERE user_id = ? AND idem_key = ?',
      [userId, key]);
    if (row.request_hash !== payloadHash) throw new AppError(422, 'KEY_REUSED', 'Key used with different payload');
    if (row.status === 'in_progress') throw new AppError(409, 'IN_PROGRESS', 'Request still processing');
    return JSON.parse(row.response_json);               // replay stored response
  }
  const result = await work();
  await pool.execute(
    `UPDATE idempotency_keys SET status = 'done', response_json = ?
     WHERE user_id = ? AND idem_key = ?`,
    [JSON.stringify(result), userId, key]);
  return result;
}
```

A unique key `UNIQUE (user_id, idem_key)` is required on the table. The `work()` and the final update should share a transaction when they touch the same database; for external calls, also pass the key downstream if the provider supports it.

**Follow-ups:**
- Q: What if the server crashes after charging but before saving the response? A: Use the provider's own idempotency key, reconcile via webhooks or a status check, and keep the in-progress record to detect it.
- Q: Why not use Redis `SET NX` only? A: It works for short locks, but durable money flows need the record in a transactional store.

---

### Q-EXP-29 | Intermediate | [ESSENTIAL] | Rate limiting in Express and the `trust proxy` trap.

**Question:** How do you add rate limiting and why does it break behind a proxy?

**Interview answer:** I use a middleware such as `express-rate-limit`, keyed by IP for anonymous routes and by user id for authenticated ones, with stricter limits on sensitive endpoints like login, OTP and password reset. A single Node process keeps counters in memory, which does not work across multiple instances or restarts, so I use a shared store such as Redis. Behind a load balancer or reverse proxy, `req.ip` is the proxy's address unless I configure `app.set('trust proxy', n)` with the correct number of hops; otherwise all users share one bucket, or if I trust too much an attacker can spoof `X-Forwarded-For` to evade limits. Responses use 429 with `Retry-After` and optionally `RateLimit-*` headers. Rate limiting complements, not replaces, upstream protection such as WAF or CDN rules.

**Hinglish explanation:** Rate limit = "ek user minute me max N requests". Memory me counter rakhoge to 3 server instances me alag-alag count hoga, isliye Redis chahiye. Aur Nginx ke peeche `req.ip` sabka same (proxy ka) aata hai jab tak `trust proxy` set na karo - sab users ek hi limit share karenge.

```js
import rateLimit from 'express-rate-limit';

app.set('trust proxy', 1);                      // one trusted proxy hop (e.g. Nginx)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,                                     // 5 attempts per window per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try later' } },
});
app.post('/auth/login', loginLimiter, loginHandler);
```

**Follow-ups:**
- Q: Fixed window vs sliding window vs token bucket? A: Fixed window is simple but allows bursts at boundaries; sliding window is smoother; token bucket permits controlled bursts.
- Q: Design depth for rate limiter systems is in `10_Question_Bank_B.md` (Q-SD) and `11_Coding_Exercises.md` (EX-RATE).

---

### Q-EXP-30 | Intermediate | [ESSENTIAL] | What should an API response and error format look like?

**Question:** Design consistent success and error responses. What do clients need from an error?

**Interview answer:** I keep a consistent shape so that clients can handle responses generically. For success, return the resource or collection directly with the right status code, and include pagination metadata for lists. For errors, return a JSON body with a stable machine-readable `code`, a human-readable `message`, optional `details` such as field-level validation errors, and a `requestId` to correlate with logs; an established alternative is the RFC 9457 "problem details" format with `type`, `title`, `status`, `detail` and `instance`. The HTTP status code remains the primary signal. Error messages must not leak internals such as stack traces or SQL. I keep dates in ISO 8601 UTC, money in minor units (integers) or strings to avoid floating point issues, and use consistent field naming across the API.

**Hinglish explanation:** Frontend developer ke liye sabse badi madad: har error ka same format. `code` se frontend logic likhta hai (`EMAIL_TAKEN`), `message` user ko dikhane ke liye, `details` me field-wise errors, `requestId` se support team logs me dhoondh leti hai. Paise ko float me mat bhejo; paise (integer) me bhejo.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "email", "message": "Invalid email" },
      { "path": "password", "message": "Must be at least 8 characters" }
    ],
    "requestId": "7f3c9a1e-5a3b-4a0c-9d2a-0f6f2f3d9c11"
  }
}
```

**Follow-ups:**
- Q: Envelope (`{ data: ... }`) or bare resource? A: Either is fine if consistent; envelopes help when adding metadata, bare resources are simpler.
- Q: Why integer cents for money? A: Binary floating point cannot represent decimals exactly (`0.1 + 0.2 !== 0.3`); store and compute in minor units or `DECIMAL`.

---


---

# Category 4 -- Databases and SQL Queries (`Q-SQL-`)

Related notes: Week 4 (all days) and Week 5 / Day 1 (Node.js with MySQL). The primary database is MySQL 8 (InnoDB). Q-SQL-01 to Q-SQL-19 cover query writing and schema design; Q-SQL-20 to Q-SQL-23 cover indexes and execution plans; Q-SQL-24 to Q-SQL-28 cover transactions, isolation, deadlocks and locking; Q-SQL-29 to Q-SQL-34 cover pooling, performance and safe data access.

## Reference schema and sample data (used by most query questions)

Create this once in a scratch database to practice. All answer queries below were written against it, and the stated results refer to this exact data.

```sql
CREATE TABLE customers (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  city       VARCHAR(80),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customers_email (email)
) ENGINE=InnoDB;

CREATE TABLE products (
  id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(150) NOT NULL,
  category VARCHAR(50)  NOT NULL,
  price    DECIMAL(10,2) NOT NULL,
  stock    INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE orders (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  status      ENUM('pending','paid','shipped','cancelled','refunded') NOT NULL DEFAULT 'pending',
  total       DECIMAL(12,2) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  order_id   BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity   INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id),
  CONSTRAINT chk_qty CHECK (quantity > 0),
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

CREATE TABLE employees (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  manager_id BIGINT UNSIGNED NULL,
  department VARCHAR(50) NOT NULL,
  salary     INT NOT NULL,
  CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id) REFERENCES employees (id)
) ENGINE=InnoDB;

INSERT INTO customers (id, name, email, city) VALUES
  (1,'Asha','asha@x.com','Pune'), (2,'Ravi','ravi@x.com','Delhi'),
  (3,'Meera','meera@x.com','Pune'), (4,'Karan','karan@x.com','Mumbai');

INSERT INTO products (id, name, category, price, stock) VALUES
  (1,'Keyboard','electronics',1500.00,50), (2,'Mouse','electronics',500.00,100),
  (3,'Notebook','stationery',100.00,500), (4,'Desk Lamp','home',800.00,0);

INSERT INTO orders (id, customer_id, status, total, created_at) VALUES
  (101,1,'paid',     2000.00,'2026-01-05 10:00:00'),
  (102,1,'shipped',   500.00,'2026-01-20 11:30:00'),
  (103,2,'paid',     1000.00,'2026-02-03 09:15:00'),
  (104,2,'cancelled',1500.00,'2026-02-10 16:45:00'),
  (105,3,'paid',     1500.00,'2026-02-15 12:00:00');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (101,1,1,1500.00), (101,2,1,500.00),
  (102,3,5,100.00),
  (103,2,2,500.00),
  (104,1,1,1500.00),
  (105,3,10,100.00), (105,2,1,500.00);

INSERT INTO employees (id, name, manager_id, department, salary) VALUES
  (1,'Neha',NULL,'eng',9000), (2,'Om',1,'eng',7000), (3,'Pia',1,'eng',7000),
  (4,'Quin',2,'eng',8000),    (5,'Raj',NULL,'ops',6000), (6,'Sam',5,'ops',4000);
```

---

### Q-SQL-01 | Basic | [ESSENTIAL] | Explain tables, primary keys, foreign keys and constraints. What relationship types exist?

**Question:** What do primary key, foreign key, UNIQUE, NOT NULL, CHECK and DEFAULT do? Explain one-to-one, one-to-many and many-to-many with examples.

**Interview answer:** A relational database stores data in tables of rows and columns. A primary key uniquely identifies each row and cannot be NULL; in InnoDB it also defines the physical order of the table (the clustered index). A foreign key links a column to the primary key of another table and enforces referential integrity: you cannot reference a non-existent parent, and the `ON DELETE` rule defines what happens when the parent is removed (RESTRICT, CASCADE, SET NULL). `UNIQUE` prevents duplicates, `NOT NULL` forbids missing values, `CHECK` enforces a condition (enforced from MySQL 8.0.16), and `DEFAULT` supplies a value. Relationships: one-to-many is the most common (one customer has many orders, with the foreign key on the "many" side); many-to-many (orders and products) needs a junction table such as `order_items` with a composite key; one-to-one (user and profile) uses a unique foreign key. Constraints push correctness into the database so that bugs in application code cannot corrupt data.

**Hinglish explanation:** Primary key = row ki unique ID. Foreign key = "ye row us dusre table ki row se judi hai" aur DB ensure karta hai ki jodi hui row exist kare. Many-to-many ke liye beech me ek junction table banti hai (`order_items`). Application me validation to hona hi chahiye, par DB constraints last line of defense hain, kyunki bugs hote hain.

```sql
-- FK behavior: this fails because customer 999 does not exist
INSERT INTO orders (customer_id, status, total) VALUES (999, 'pending', 10.00);
-- ERROR 1452: Cannot add or update a child row: a foreign key constraint fails
```

**Follow-ups:**
- Q: Natural key vs surrogate key? A: Natural keys (email, SKU) carry business meaning and can change; surrogate keys (auto-increment id or UUID) are stable and compact. Use a surrogate primary key and a UNIQUE constraint on the natural key.
- Q: Auto-increment vs UUID primary key? A: Auto-increment is compact and insert-friendly for the clustered index but guessable and awkward to generate across shards; random UUIDv4 causes index fragmentation, UUIDv7 or ordered UUIDs are better, stored as `BINARY(16)`.
- Q: Why InnoDB? A: It supports transactions, row-level locking and foreign keys; MyISAM does not and is obsolete for most uses.

---

### Q-SQL-02 | Basic | [ESSENTIAL] | Write CRUD queries safely, including safe UPDATE and DELETE habits.

**Question:** Show INSERT, SELECT, UPDATE and DELETE with the reference schema. How do you avoid catastrophic mistakes?

**Interview answer:** CRUD maps to INSERT, SELECT, UPDATE and DELETE. I select only the columns I need rather than `SELECT *`, always include a `WHERE` clause on UPDATE and DELETE, and preview the target rows with a SELECT using the same WHERE first. In application code I use parameterized queries and check `affectedRows` to detect a missing row. For important data I prefer soft deletes (`deleted_at`) or archiving to hard deletes, wrap multi-statement changes in a transaction, and run risky operations in production with a transaction that I can roll back, or with `sql_safe_updates` enabled in the client. Unique constraints handle duplicates: `INSERT ... ON DUPLICATE KEY UPDATE` performs an upsert atomically.

**Hinglish explanation:** `UPDATE` ya `DELETE` bina `WHERE` ke poori table par chal jata hai - sabse common production disaster. Pehle wahi `WHERE` laga ke `SELECT` chalao, rows dekho, phir `UPDATE`. Code me `affectedRows` check karo.

```sql
-- NOTE: these statements change the shared reference data (order 104 becomes 'refunded', customer 1 is renamed
-- 'Asha K'), which would make the stated results of later questions differ. Wrap them in
-- START TRANSACTION; ... ROLLBACK; or re-create the sample data afterwards.
INSERT INTO customers (name, email, city) VALUES ('Zoya', 'zoya@x.com', 'Delhi');

SELECT id, name, city FROM customers WHERE city = 'Pune' ORDER BY name;

-- preview, then update
SELECT id, status FROM orders WHERE id = 104;
UPDATE orders SET status = 'refunded' WHERE id = 104 AND status = 'cancelled';

DELETE FROM customers WHERE email = 'zoya@x.com';

-- atomic upsert (requires UNIQUE on email)
INSERT INTO customers (name, email, city) VALUES ('Asha K', 'asha@x.com', 'Pune')
ON DUPLICATE KEY UPDATE name = VALUES(name), city = VALUES(city);
```

**Follow-ups:**
- Q: DELETE vs TRUNCATE vs DROP? A: DELETE removes rows (filterable, logged row by row, can roll back, fires triggers); TRUNCATE empties the table quickly, resets auto-increment and causes an implicit commit in MySQL (DDL); DROP removes the table itself.
- Q: `VALUES()` in the upsert is deprecated in 8.0.20+? A: Yes; use a row alias: `INSERT ... VALUES (...) AS new ON DUPLICATE KEY UPDATE name = new.name`.
- Q: How do you read `affectedRows` in mysql2? A: `const [result] = await pool.execute(sql, params); result.affectedRows`.

---

### Q-SQL-03 | Basic | [ESSENTIAL] | INNER JOIN, LEFT JOIN and RIGHT JOIN: what is the difference?

**Question:** Explain the join types with the customers and orders tables. When does LEFT JOIN change the result?

**Interview answer:** A join combines rows from two tables based on a condition. `INNER JOIN` returns only rows that match on both sides, so a customer without orders disappears. `LEFT JOIN` returns all rows from the left table and the matching rows from the right; where no match exists the right-side columns are NULL, which lets me find "customers with no orders". `RIGHT JOIN` is the mirror image and is rarely used because swapping the table order and using LEFT JOIN is clearer. `CROSS JOIN` produces the Cartesian product. MySQL has no `FULL OUTER JOIN`, but it can be emulated by a `UNION` of a LEFT and a RIGHT join. A critical detail: a condition on the right table placed in `WHERE` can turn a LEFT JOIN into an INNER JOIN, because NULL rows are filtered out; to keep left rows, put the condition in the `ON` clause.

**Hinglish explanation:** INNER JOIN = dono taraf match wali rows. LEFT JOIN = left table ki saari rows, match nahi mila to right ke columns NULL. Karan ka koi order nahi hai: INNER JOIN me wo nahi dikhega, LEFT JOIN me dikhega `order_id = NULL` ke saath.

```sql
-- INNER: 4 customers, but only 3 appear (Karan has no orders)
SELECT c.name, o.id AS order_id
FROM customers c
JOIN orders o ON o.customer_id = c.id
ORDER BY c.name, o.id;

-- LEFT: Karan appears with order_id NULL
SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
ORDER BY c.name, o.id;
```

**Follow-ups:**
- Q: Does the order of tables in INNER JOIN matter? A: Not logically; the optimizer chooses the join order.
- Q: What is the effect of `LEFT JOIN ... WHERE o.status = 'paid'`? A: It filters out the NULL rows, behaving like INNER JOIN; use `AND o.status = 'paid'` in the ON clause instead.
- Q: What if the join column has duplicates on both sides? A: Rows multiply (many-to-many explosion), inflating aggregates; aggregate first or use `COUNT(DISTINCT ...)`.

---

### Q-SQL-04 | Basic | [ESSENTIAL] | Query: list each order with the customer name and city (join).

**Question:** Using the reference schema, return order id, status, total, customer name and city, newest first.

**Interview answer:** I join `orders` to `customers` on the foreign key and select only the needed columns. Because every order has a customer (NOT NULL foreign key), an inner join is correct. I order by `created_at` descending with `id` as a tiebreaker to get deterministic results.

**Hinglish explanation:** Foreign key ke through join: `orders.customer_id = customers.id`. Alias (`o`, `c`) use karo taaki query chhoti aur readable rahe.

```sql
SELECT o.id, o.status, o.total, c.name AS customer, c.city
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.created_at DESC, o.id DESC;
-- first rows: 105 paid 1500.00 Meera Pune; 104 cancelled 1500.00 Ravi Delhi; ...
```

**Follow-ups:**
- Q: How does the plan change with an index on `orders.customer_id`? A: The foreign key already creates one in InnoDB, so lookups from customer to orders are index-based.
- Q: Should you return `SELECT *`? A: No; it wastes bandwidth, breaks covering indexes and may leak columns added later.

---

### Q-SQL-05 | Intermediate | [ESSENTIAL] | Query: customers who have never placed an order.

**Question:** Find customers with no orders. Show at least two correct approaches and one trap.

**Interview answer:** The anti-join pattern with `LEFT JOIN ... WHERE o.id IS NULL` returns left rows with no match. `NOT EXISTS` expresses the same intent and is usually equally efficient, as the optimizer converts both to an anti-join. The trap is `NOT IN (subquery)` when the subquery can return NULL: any comparison with NULL is unknown, so the whole predicate yields no rows. Here `orders.customer_id` is NOT NULL so it would work, but I still prefer `NOT EXISTS` to be safe against future schema changes.

**Hinglish explanation:** "Jinka koi match nahi" = anti-join. Do tareeke: LEFT JOIN + `IS NULL`, ya `NOT EXISTS`. `NOT IN` risky hai kyunki subquery me ek bhi NULL aaya to result khaali.

```sql
-- 1) LEFT JOIN anti-join
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- 2) NOT EXISTS
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
-- both return: 4 Karan
```

**Follow-ups:**
- Q: Why `SELECT 1` inside EXISTS? A: EXISTS checks only for the presence of a row; the select list is ignored.
- Q: Index needed? A: `orders(customer_id)` so each existence check is an index lookup.

---

### Q-SQL-06 | Intermediate | [ESSENTIAL] | Query: total spent per customer, including customers with zero spend.

**Question:** For each customer, compute total spent on `paid` or `shipped` orders. Customers with no qualifying orders must appear with 0.

**Interview answer:** I use a `LEFT JOIN` from customers to orders, put the status filter in the `ON` clause so customers without qualifying orders are retained, group by the customer, and wrap the sum in `COALESCE(..., 0)` because the sum of no rows is NULL. If I put the status condition in `WHERE`, Karan would disappear. I include the customer id in `GROUP BY` together with the name for correctness.

**Hinglish explanation:** Filter `ON` me daalo, `WHERE` me nahi, warna LEFT JOIN INNER JOIN ban jata hai aur Karan gayab. `SUM` khaali set par NULL deta hai isliye `COALESCE(...,0)`.

```sql
SELECT c.id, c.name, COALESCE(SUM(o.total), 0) AS spent
FROM customers c
LEFT JOIN orders o
       ON o.customer_id = c.id AND o.status IN ('paid', 'shipped')
GROUP BY c.id, c.name
ORDER BY spent DESC, c.id;
-- Asha 2500.00, Meera 1500.00, Ravi 1000.00, Karan 0.00
```

**Follow-ups:**
- Q: What changes if I also join `order_items`? A: Each order row repeats per item, so `SUM(o.total)` would be inflated; aggregate items separately or sum item-level amounts instead.
- Q: Why group by `c.id` and not just the name? A: Names are not unique; two customers with the same name would be merged.

---

### Q-SQL-07 | Intermediate | [ESSENTIAL] | WHERE vs HAVING: find customers with at least two orders.

**Question:** Explain the difference between `WHERE` and `HAVING` and write a query for customers who placed two or more orders.

**Interview answer:** `WHERE` filters individual rows before grouping, and cannot use aggregate functions. `HAVING` filters groups after aggregation, so it can use `COUNT`, `SUM` and so on. The logical order is `FROM/JOIN`, `WHERE`, `GROUP BY`, `HAVING`, `SELECT`, `ORDER BY`, `LIMIT`. As a performance rule, filter as much as possible in `WHERE`, so fewer rows are grouped, and keep `HAVING` for conditions that truly depend on the aggregate.

**Hinglish explanation:** `WHERE` = group banne se pehle row filter. `HAVING` = group banne ke baad group filter. "Kitne orders" count GROUP BY ke baad hi pata chalta hai, isliye `HAVING COUNT(*) >= 2`.

```sql
SELECT c.id, c.name, COUNT(*) AS order_count
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(*) >= 2
ORDER BY order_count DESC, c.id;
-- Asha 2, Ravi 2

-- only count non-cancelled orders: use WHERE (row filter) not HAVING
SELECT c.name, COUNT(*) AS active_orders
FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE o.status <> 'cancelled'
GROUP BY c.id, c.name;
```

**Follow-ups:**
- Q: Can you use a SELECT alias in HAVING? A: MySQL allows it (an extension), but standard SQL does not; repeating the expression is more portable.
- Q: What is `ONLY_FULL_GROUP_BY`? A: A default SQL mode that rejects selecting non-aggregated columns not functionally dependent on the GROUP BY columns.

---

### Q-SQL-08 | Intermediate | [ESSENTIAL] | Query: top 3 products by revenue (multi-table join and aggregation).

**Question:** Compute revenue per product from `paid` and `shipped` orders and return the top 3, with deterministic ordering for ties.

**Interview answer:** I join `order_items` to `orders` to filter by status, and to `products` for the name, then group by product and sum `quantity * unit_price`. I use `unit_price` from `order_items` rather than the product's current price, because the price at the time of purchase is what matters historically. For deterministic output with ties I add a secondary sort on the product id. `LIMIT 3` returns the top three.

**Hinglish explanation:** Revenue = quantity x us waqt ka price (`order_items.unit_price`), product ka aaj ka price nahi. Tie ho sakta hai (Keyboard aur Notebook dono 1500), isliye `ORDER BY revenue DESC, p.id` taaki result stable rahe.

```sql
SELECT p.id, p.name, SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders   o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status IN ('paid', 'shipped')
GROUP BY p.id, p.name
ORDER BY revenue DESC, p.id
LIMIT 3;
-- Mouse 2000.00, Keyboard 1500.00, Notebook 1500.00
```

**Follow-ups:**
- Q: Why store `unit_price` on `order_items`? A: Product prices change; the order must record the price paid (a deliberate, justified denormalization).
- Q: How do you include products never sold? A: Start from `products` with a LEFT JOIN chain and move the status condition into ON clauses.

---


### Q-SQL-09 | Intermediate | [ESSENTIAL] | Query: monthly revenue report.

**Question:** Produce revenue and order count per month for `paid` and `shipped` orders. How do you keep it index friendly?

**Interview answer:** I group by a month expression, `DATE_FORMAT(created_at, '%Y-%m')`, and aggregate with `SUM` and `COUNT`. For performance on big tables I avoid wrapping the indexed column in a function inside `WHERE`; instead I filter with a half-open range such as `created_at >= '2026-01-01' AND created_at < '2027-01-01'`, which can use an index on `created_at`. The `GROUP BY` expression itself still requires computing the month for the rows in range, which is acceptable. For heavy dashboards I would precompute a daily or monthly summary table instead of scanning raw orders on every request.

**Hinglish explanation:** Month nikalne ke liye `DATE_FORMAT`. Filter me `YEAR(created_at) = 2026` mat likho (index kaam nahi karega), range likho: `>= '2026-01-01' AND < '2027-01-01'`. Bahut bada data ho to summary table banao.

```sql
SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       COUNT(*)   AS orders,
       SUM(total) AS revenue
FROM orders
WHERE status IN ('paid', 'shipped')
  AND created_at >= '2026-01-01' AND created_at < '2027-01-01'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month;
-- 2026-01: 2 orders, 2500.00; 2026-02: 2 orders, 2500.00
```

**Follow-ups:**
- Q: Time zones? A: Store timestamps in UTC; convert to the business time zone at grouping time (`CONVERT_TZ`) if "month" is local.
- Q: Why half-open ranges? A: They avoid off-by-one problems with times like `23:59:59.5`.

---

### Q-SQL-10 | Intermediate | [ESSENTIAL] | Query: second highest salary and the Nth highest salary.

**Question:** Find the second highest distinct salary in `employees`. Generalize to N and explain ties.

**Interview answer:** A simple approach is `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`. A more general approach is `SELECT DISTINCT salary ... ORDER BY salary DESC LIMIT 1 OFFSET N-1`, which returns no row if fewer than N distinct salaries exist, while the outer query can wrap it to return NULL. With window functions, `DENSE_RANK() OVER (ORDER BY salary DESC)` ranks salaries without gaps, so rank 2 is the second highest distinct value even when several employees share the top salary. `RANK` leaves gaps after ties and `ROW_NUMBER` ignores ties, which is why the choice of function matters.

**Hinglish explanation:** Tie wale salaries ka dhyan rakho: agar do log 9000 le rahe hon to "second highest" kya hoga? `DENSE_RANK` distinct salary ke hisaab se rank deta hai, isliye 2nd highest sahi milta hai. Interview me ye sawal almost guaranteed hai.

```sql
-- 1) subquery
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);          -- 8000

-- 2) LIMIT/OFFSET (N = 2), NULL when missing
SELECT (SELECT DISTINCT salary FROM employees
        ORDER BY salary DESC LIMIT 1 OFFSET 1) AS second_highest;

-- 3) window function, general N
SELECT salary
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
      FROM employees) t
WHERE rnk = 2
GROUP BY salary;                                              -- 8000
```

**Follow-ups:**
- Q: RANK vs DENSE_RANK vs ROW_NUMBER? A: For values 9000, 8000, 8000, 7000: RANK = 1,2,2,4; DENSE_RANK = 1,2,2,3; ROW_NUMBER = 1,2,3,4.
- Q: What if there is only one salary value? A: Queries 2 and the subquery in 1 return NULL; query 3 returns no rows, so wrap as needed.

---

### Q-SQL-11 | Intermediate | [ESSENTIAL] | Query: highest paid employee in each department.

**Question:** Return the top earner per department, including ties.

**Interview answer:** I use a window function: `RANK() OVER (PARTITION BY department ORDER BY salary DESC)` and keep rank 1, which includes all tied top earners. The classic pre-window alternative joins the table to a derived table of `MAX(salary)` per department. A plain `GROUP BY department` with `MAX(salary)` alone cannot return the employee name, and selecting `name` without aggregation is invalid under `ONLY_FULL_GROUP_BY`. If I need exactly one row per department, I switch to `ROW_NUMBER()` with a deterministic tiebreaker.

**Hinglish explanation:** `PARTITION BY` = har department ke liye alag ranking. Rank 1 = top earner. Agar tie me sab chahiye to `RANK()`, sirf ek chahiye to `ROW_NUMBER()` aur tiebreaker.

```sql
SELECT department, name, salary
FROM (
  SELECT e.*, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
  FROM employees e
) t
WHERE rnk = 1;
-- eng Neha 9000; ops Raj 6000

-- join-based alternative
SELECT e.department, e.name, e.salary
FROM employees e
JOIN (SELECT department, MAX(salary) AS max_sal FROM employees GROUP BY department) m
  ON m.department = e.department AND m.max_sal = e.salary;
```

**Follow-ups:**
- Q: Why can't you filter on a window function in WHERE? A: Window functions are evaluated after WHERE, so you must wrap them in a derived table or CTE.
- Q: Salary above department average? A: `WHERE salary > (SELECT AVG(salary) FROM employees x WHERE x.department = e.department)` (correlated subquery) or `AVG(salary) OVER (PARTITION BY department)`; result: Neha, Quin, Raj.

---

### Q-SQL-12 | Intermediate | [ESSENTIAL] | Query: employees who earn more than their manager (self join).

**Question:** Write a query using the `employees` table where `manager_id` references the same table.

**Interview answer:** A self join treats the same table as two logical tables with different aliases: `e` for the employee and `m` for the manager, joined on `m.id = e.manager_id`. I then compare salaries. An inner join automatically excludes employees without a manager (NULL `manager_id`). To list all employees with their manager names, including those without managers, I would use a LEFT JOIN. Self joins model hierarchies and also appear in "find pairs" problems, such as customers in the same city.

**Hinglish explanation:** Same table ko do baar alias dekar join karo: ek copy "employee", dusri copy "manager". Condition: `m.id = e.manager_id`.

```sql
SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager,  m.salary AS mgr_salary
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;
-- Quin 8000 > Om 7000

-- pairs of different customers in the same city (each pair once)
SELECT a.name, b.name, a.city
FROM customers a JOIN customers b ON a.city = b.city AND a.id < b.id;   -- Asha, Meera, Pune
```

**Follow-ups:**
- Q: How do you get the full chain of managers? A: A recursive CTE (Q-SQL-17).
- Q: Why `a.id < b.id` in the pairs query? A: It removes self-pairs and mirrored duplicates.

---

### Q-SQL-13 | Intermediate | [ESSENTIAL] | Query: find and delete duplicate rows, and prevent them.

**Question:** A `subscribers(id, email)` table has duplicate emails. Find them, delete extras keeping the earliest row, and stop it from happening again.

**Interview answer:** To find duplicates I group by the natural key and keep groups with count greater than one. To delete extras while keeping the lowest id, I use a multi-table `DELETE` with a self join where the other row has a smaller id, or a window function with `ROW_NUMBER()` and delete rows whose rank is greater than one. I back up or run it in a transaction first. The real fix is a `UNIQUE` constraint on the email (normalized, e.g. lowercase) and handling the duplicate-key error in application code, because a check-then-insert in code is a race condition that allows duplicates under concurrency.

**Hinglish explanation:** Duplicate dhoondhna: `GROUP BY email HAVING COUNT(*) > 1`. Delete: purani wali rakho, baaki hatao. Permanent solution: `UNIQUE` constraint. Sirf "pehle SELECT karke check karo" kaafi nahi, do requests ek saath aayein to dono pass ho jati hain.

```sql
CREATE TABLE subscribers (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL);

-- find
SELECT email, COUNT(*) AS cnt FROM subscribers GROUP BY email HAVING COUNT(*) > 1;

-- delete extras, keep the smallest id
DELETE s1
FROM subscribers s1
JOIN subscribers s2 ON s1.email = s2.email AND s1.id > s2.id;

-- prevent
ALTER TABLE subscribers ADD CONSTRAINT uq_subscribers_email UNIQUE (email);
```

**Follow-ups:**
- Q: Will the ALTER succeed before cleaning duplicates? A: No; it fails with a duplicate entry error, so clean first.
- Q: Case sensitivity of email uniqueness? A: Default collations in MySQL 8 (`utf8mb4_0900_ai_ci`) are case-insensitive, so `A@x.com` and `a@x.com` collide; still normalize in code.

---

### Q-SQL-14 | Intermediate | [ESSENTIAL] | Query: latest order per customer.

**Question:** Return each customer's most recent order.

**Interview answer:** I use `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC)` in a derived table and keep row number 1. The tiebreaker on `id` ensures exactly one row when timestamps are equal. An alternative is a correlated subquery comparing `created_at` with `MAX(created_at)` for that customer, but it can return duplicates on ties. On very large tables, a `(customer_id, created_at, id)` index lets the database find the latest row per customer efficiently.

**Hinglish explanation:** "Per group me latest" ka standard pattern: `ROW_NUMBER` + `PARTITION BY` + filter `rn = 1`. Tiebreaker `id` zaroor rakho, warna same timestamp par ek se zyada row aa sakti hai.

```sql
SELECT id, customer_id, status, total, created_at
FROM (
  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC) AS rn
  FROM orders o
) t
WHERE rn = 1
ORDER BY customer_id;
-- 102 (Asha), 104 (Ravi), 105 (Meera)
```

**Follow-ups:**
- Q: Pre-MySQL 8 alternative? A: Join to a derived table of `MAX(created_at)` per customer, or a correlated subquery with `LIMIT 1`.
- Q: Why not `GROUP BY customer_id` and select `status`? A: Non-aggregated columns would be arbitrary or rejected by `ONLY_FULL_GROUP_BY`.

---

### Q-SQL-15 | Intermediate | [ESSENTIAL] | Subqueries: scalar, correlated, derived tables, and IN vs EXISTS vs JOIN.

**Question:** Find customers who purchased any electronics product. Compare JOIN, IN and EXISTS. When is a subquery better than a join?

**Interview answer:** A scalar subquery returns one value, a derived table is a subquery in `FROM`, and a correlated subquery references the outer query and is conceptually evaluated per outer row. `EXISTS` answers "is there at least one matching row" and stops at the first match, and it avoids duplicates because the outer row is returned at most once. A `JOIN` returns one row per match, so I need `DISTINCT` or grouping to deduplicate, which costs extra. `IN (subquery)` is fine when the subquery returns a modest list without NULLs. MySQL 8's optimizer can transform many `IN` and `EXISTS` subqueries into semi-joins, so performance is often similar; I choose the one that states the intent clearly and verify with `EXPLAIN`.

**Hinglish explanation:** "Kisne kabhi X kharida" = existence question, to `EXISTS` natural hai. JOIN lagane se customer ki row har item ke liye repeat hoti hai, phir `DISTINCT` chahiye. Dono ka result same, intent aur duplicate handling alag.

```sql
-- EXISTS (no duplicates)
SELECT c.id, c.name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE o.customer_id = c.id AND p.category = 'electronics'
);                                        -- Asha, Ravi, Meera

-- JOIN + DISTINCT
SELECT DISTINCT c.id, c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE p.category = 'electronics';
```

**Follow-ups:**
- Q: When is a correlated subquery slow? A: When the optimizer cannot decorrelate it and the inner table lacks an index on the correlation column.
- Q: Scalar subquery returning more than one row? A: Error 1242 "Subquery returns more than 1 row".

---

### Q-SQL-16 | Advanced | [ESSENTIAL] | Window functions: running totals, ranking, LAG.

**Question:** For each order, show the customer's running total and the days since their previous order.

**Interview answer:** Window functions compute a value across a set of related rows without collapsing them like `GROUP BY` does. `SUM(total) OVER (PARTITION BY customer_id ORDER BY created_at, id)` gives a cumulative total per customer, and `LAG(created_at) OVER (...)` accesses the previous row so I can compute the gap with `DATEDIFF`. Other useful functions are `RANK`, `DENSE_RANK`, `ROW_NUMBER`, `LEAD`, `NTILE`, and aggregate windows with explicit frames such as `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` for a 7-row moving average. Window functions are available in MySQL 8.0 and later and are evaluated after `WHERE`, `GROUP BY` and `HAVING`.

**Hinglish explanation:** `GROUP BY` rows ko ek me compress kar deta hai; window function rows ko rakhte hue "aas-paas ki rows" ka hisaab deta hai: running total, pichhli row ki value, rank. `PARTITION BY` = group, `ORDER BY` = group ke andar order.

```sql
SELECT id, customer_id, created_at, total,
       SUM(total) OVER (PARTITION BY customer_id ORDER BY created_at, id) AS running_total,
       DATEDIFF(created_at, LAG(created_at) OVER (PARTITION BY customer_id ORDER BY created_at, id)) AS days_since_prev
FROM orders
ORDER BY customer_id, created_at;
-- Asha: 101 -> 2000, NULL ; 102 -> 2500, 15
-- Ravi: 103 -> 1000, NULL ; 104 -> 2500, 7
-- Meera: 105 -> 1500, NULL
```

**Follow-ups:**
- Q: Default frame when `ORDER BY` is given? A: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, so rows with equal sort values are treated as peers and share the same running total; use `ROWS` for strict row-by-row.
- Q: Window function vs GROUP BY performance? A: Windows need a sort per partition; an index matching `PARTITION BY` + `ORDER BY` can help.

---

### Q-SQL-17 | Advanced | [ADVANCED] | CTEs and recursive CTEs: query a hierarchy.

**Question:** What is a CTE? Show a recursive CTE that lists the management chain with depth.

**Interview answer:** A common table expression, `WITH name AS (...)`, is a named temporary result set within one statement; it improves readability, lets me reuse a subquery, and can be recursive. A recursive CTE has an anchor member that selects the starting rows, a `UNION ALL`, and a recursive member that joins the CTE to the base table, repeating until no new rows appear. It is used for hierarchies such as org charts, category trees and threaded comments. I protect against cycles by tracking a path or limiting depth, because bad data can create infinite recursion (MySQL stops at `cte_max_recursion_depth`, default 1000).

**Hinglish explanation:** CTE = query ke andar naam wala temporary result, padhne me aasan. Recursive CTE: pehle starting rows (jinka manager NULL hai), phir baar-baar "unke reports" join karte jao jab tak naye rows aana band na ho. Tree/hierarchy ke liye perfect.

```sql
WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 0 AS depth
  FROM employees
  WHERE manager_id IS NULL                               -- anchor: top-level
  UNION ALL
  SELECT e.id, e.name, e.manager_id, c.depth + 1
  FROM employees e
  JOIN chain c ON e.manager_id = c.id                    -- recursive member
)
SELECT id, name, depth FROM chain ORDER BY depth, id;
-- Neha 0, Raj 0, Om 1, Pia 1, Sam 1, Quin 2
```

**Follow-ups:**
- Q: Is a CTE faster than a subquery? A: Not inherently; it may be merged or materialized, so check `EXPLAIN`.
- Q: Why UNION ALL instead of UNION in recursion? A: UNION deduplicates (extra cost); ALL is what you normally want and avoids hiding data issues.

---

### Q-SQL-18 | Intermediate | [ESSENTIAL] | NULL handling: NOT IN trap, COUNT(*) vs COUNT(col), and comparisons.

**Question:** Why does this return no rows? And what is the difference between `COUNT(*)` and `COUNT(manager_id)`?

```sql
SELECT name FROM employees WHERE id NOT IN (SELECT manager_id FROM employees);
```

**Interview answer:** SQL uses three-valued logic: comparisons with NULL are neither true nor false but unknown. The subquery returns the manager ids including a NULL (the top-level employees have no manager). `id NOT IN (1, 2, 5, NULL)` expands to `id <> 1 AND id <> 2 AND id <> 5 AND id <> NULL`, and the last comparison is unknown, so the predicate is never true and the result is empty. The fix is `NOT EXISTS`, or filtering NULLs in the subquery with `WHERE manager_id IS NOT NULL`. `COUNT(*)` counts rows (6), while `COUNT(manager_id)` counts only non-NULL values (4). Aggregate functions such as `SUM` and `AVG` ignore NULLs, and `x = NULL` is never true: use `IS NULL`, or the null-safe equality `<=>`.

**Hinglish explanation:** NULL = "pata nahi". "Pata nahi" se compare karoge to jawab bhi "pata nahi" aayega, true nahi. Isliye `NOT IN` me ek NULL aate hi poora result khaali. `NOT EXISTS` use karo ya subquery me NULL filter karo.

```sql
-- correct: employees who are not managers
SELECT e.name
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees x WHERE x.manager_id = e.id);   -- Pia, Quin, Sam

SELECT COUNT(*) AS all_rows, COUNT(manager_id) AS with_manager FROM employees;   -- 6, 4
SELECT NULL = NULL AS eq, NULL <=> NULL AS null_safe_eq;                          -- NULL, 1
```

**Follow-ups:**
- Q: `ORDER BY` with NULLs? A: MySQL sorts NULLs first for ASC and last for DESC.
- Q: `COALESCE` vs `IFNULL`? A: `COALESCE` is standard and takes many arguments; `IFNULL` takes two.

---

### Q-SQL-19 | Intermediate | [ESSENTIAL] | Explain normalization (1NF, 2NF, 3NF) and when to denormalize.

**Question:** Why normalize a schema? Show a bad design and its fix. When is denormalization justified?

**Interview answer:** Normalization organizes data to reduce redundancy and avoid update, insert and delete anomalies. 1NF requires atomic values with no repeating groups, for example no comma-separated list of product ids in a column. 2NF requires that every non-key column depends on the whole primary key, which matters for composite keys; partial dependencies are moved to another table. 3NF requires that non-key columns depend only on the key and not on other non-key columns, so the customer's city belongs in `customers`, not repeated in every order row. A normalized design stores each fact once, making updates consistent. Denormalization is justified deliberately for read performance or history: storing `unit_price` on `order_items` (price at purchase), a cached `order_count`, or a reporting table, accepting the cost of keeping copies consistent. I normalize first and denormalize with evidence from measurements.

**Hinglish explanation:** Normalization = ek fact sirf ek jagah rakho. Agar customer ka phone har order row me repeat hai aur ek jagah badla, dusri jagah purana, to inconsistent data. Par kabhi-kabhi jaan-bujh ke copy rakhte hain (jaise order ke waqt ka price) - ye alag cheez hai: "history" ya "performance" ke liye.

```sql
-- Bad: 1NF + 3NF violations
-- orders_bad(order_id, customer_name, customer_city, product_ids "1,2,5", product_names "Keyboard,Mouse,...")

-- Good: separate entities and a junction table
-- customers(id, name, city)  orders(id, customer_id, ...)  products(id, ...)  order_items(order_id, product_id, quantity, unit_price)
```

**Follow-ups:**
- Q: Is JSON column a violation? A: Not if used for truly flexible attributes you do not join or filter heavily on; use relational columns for core data and index generated columns for JSON fields you query.
- Q: Does normalization slow down queries? A: It adds joins, which with proper indexes are fast; denormalize only after measuring.

---


---

## SQL: indexes and query plans (Q-SQL-20 to Q-SQL-23)

---

### Q-SQL-20 | Intermediate | [ESSENTIAL] | What is an index and how does it speed up queries? What does it cost?

**Question:** Explain how a B-tree index works in MySQL InnoDB, the clustered vs secondary index difference, and the costs of adding indexes.

**Interview answer:** An index is a separate sorted data structure, a B+tree in InnoDB, that lets the database find rows by key in logarithmic time instead of scanning the whole table (a full table scan). InnoDB stores the table itself as a clustered index ordered by the primary key, so the leaf nodes of the primary key index are the actual rows. A secondary index stores the indexed columns plus the primary key value in its leaves, so a lookup by a secondary index finds the primary key and then does a second lookup into the clustered index (unless the index covers the query). Indexes speed up `WHERE`, `JOIN`, `ORDER BY` and `GROUP BY` on the indexed columns, but they cost storage, slow down `INSERT`, `UPDATE` and `DELETE` since each index must be maintained, and add work for the optimizer. So I index columns used in frequent filters, joins and sorts based on real query patterns, and I drop unused indexes. Indexes help most on selective columns: an index on a boolean or low-cardinality `status` alone rarely helps.

**Hinglish explanation:** Index = kitab ke peeche ka "index page": poori kitab padhne ke bajay seedha page number mil jata hai. Par har naya index insert/update ko thoda slow karta hai aur disk lagta hai. InnoDB me primary key hi table hai (clustered). Secondary index me pehle primary key milti hai, phir row - isliye primary key chhoti rakhna acha hai.

```sql
-- speed up "orders of a customer"
CREATE INDEX idx_orders_customer ON orders (customer_id);     -- InnoDB creates one for the FK anyway

SHOW INDEX FROM orders;
-- Optional in MySQL 8: test removing an index safely
ALTER TABLE orders ALTER INDEX idx_orders_customer INVISIBLE;
```

**Follow-ups:**
- Q: Why keep the primary key small? A: Every secondary index entry stores the primary key, so a wide key bloats all indexes.
- Q: What is index selectivity (cardinality)? A: The ratio of distinct values to rows; high selectivity (email) is great, low (gender, boolean) is weak by itself but can help in a composite index.
- Q: What are invisible indexes for? A: The optimizer ignores them, so you can test dropping an index without actually dropping it.

---

### Q-SQL-21 | Intermediate | [ESSENTIAL] | Composite indexes and the leftmost prefix rule: design an index for a query.

**Question:** Design an index for: `WHERE customer_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20`. Which queries can use it?

**Interview answer:** A composite index is sorted by its first column, then the second within equal first values, and so on. A query can use the index efficiently from the leftmost column onward, which is the leftmost prefix rule. For the given query I create `(customer_id, status, created_at)`: the two equality columns come first, and the sort column comes last, so the database seeks to the matching `(customer_id, status)` range and reads rows already sorted by `created_at`, avoiding a filesort, and can stop after 20 rows. The general guideline is equality columns first, then the range or sort column; once a range condition is used on a column, later columns in the index can no longer narrow the seek. A query filtering only by `status` cannot use this index efficiently, because `status` is not the leftmost column. Column order should consider both query patterns and selectivity, but equality-before-range comes first.

**Hinglish explanation:** Composite index telephone directory jaisa hai: pehle surname se sorted, phir first name. Sirf first name se dhoondhna mushkil. Isliye order matter karta hai: pehle wo columns jo `=` se filter hote hain, aakhir me sort/range wala column. Ek index se kai queries chal jati hain (prefix), isliye alag-alag chhote indexes banane ki zaroorat kam padti hai.

```sql
CREATE INDEX idx_orders_cust_status_created ON orders (customer_id, status, created_at);

-- can use the index well
SELECT id, total FROM orders WHERE customer_id = 1;
SELECT id, total FROM orders WHERE customer_id = 1 AND status = 'paid' ORDER BY created_at DESC LIMIT 20;

-- cannot seek on it (status is not the leftmost column)
SELECT id FROM orders WHERE status = 'paid';
```

**Follow-ups:**
- Q: Does `ORDER BY created_at DESC` work on an ascending index? A: Yes, MySQL can scan an index backward; for mixed directions use a descending index (supported in MySQL 8).
- Q: Is one composite index better than several single-column indexes? A: Usually yes for multi-column filters; MySQL can merge indexes but a purpose-built composite is more efficient.
- Q: Can MySQL use the index if I filter `customer_id` and `created_at` but skip `status`? A: It uses the `customer_id` prefix, and `created_at` can only be filtered inside the index rather than used to seek.

---

### Q-SQL-22 | Advanced | [ESSENTIAL] | Covering indexes and why the optimizer ignores your index.

**Question:** What is a covering index? List common reasons an index is not used.

**Interview answer:** A covering index contains every column the query needs, so MySQL can answer from the index alone without reading the table rows; `EXPLAIN` shows `Using index` in the `Extra` column. It avoids the second lookup into the clustered index, which is useful for hot read queries. An index may not be used because: a function is applied to the indexed column in the predicate (`WHERE DATE(created_at) = '2026-02-03'` or `LOWER(email) = ...`); a leading wildcard `LIKE '%term'`; an implicit type conversion such as comparing a `VARCHAR` column to a number; a condition that does not use the leftmost prefix; `OR` conditions across different columns; a collation or charset mismatch in joins; the optimizer estimating that a large fraction of the table matches, so a scan is cheaper; or stale statistics. The fixes are to rewrite the predicate to be sargable (searchable by index), add the right composite or functional index, or run `ANALYZE TABLE`.

**Hinglish explanation:** Covering index = query ko jo columns chahiye sab index me hi mil jaye, table tak jana na pade. Index kyun ignore hota hai: column par function laga diya (`DATE(created_at)`), `LIKE '%abc'`, type mismatch (string column ko number se compare), ya aadhi table match ho rahi ho (scan sasta padta hai).

```sql
-- not sargable: function on the column
SELECT id FROM orders WHERE DATE(created_at) = '2026-02-03';
-- sargable rewrite
SELECT id FROM orders WHERE created_at >= '2026-02-03' AND created_at < '2026-02-04';

-- functional index (MySQL 8.0.13+) when you must query by an expression
CREATE INDEX idx_customers_email_lower ON customers ((LOWER(email)));

-- covering for this hot query: all needed columns are in the index
SELECT status, created_at FROM orders WHERE customer_id = 1;   -- covered by (customer_id, status, created_at)
```

**Follow-ups:**
- Q: Does `LIKE 'abc%'` use an index? A: Yes, a prefix match can use a B-tree range scan; `'%abc'` cannot.
- Q: Why is `WHERE phone = 9876543210` slow when `phone` is `VARCHAR`? A: The column values are converted to numbers per row, defeating the index; compare with a string literal.
- Q: Full-text search? A: Use a `FULLTEXT` index with `MATCH ... AGAINST`, or a search engine for advanced needs.

---

### Q-SQL-23 | Intermediate | [ESSENTIAL] | How do you read EXPLAIN output and diagnose a slow query?

**Question:** What are the key columns in `EXPLAIN`? What do you do when you see `type = ALL` or `Using filesort`?

**Interview answer:** `EXPLAIN` shows the optimizer's plan without running the query. The key columns are `type` (the access method: `const` and `eq_ref` are best, then `ref`, `range`, `index`, and `ALL` is a full table scan), `possible_keys` and `key` (the index considered and chosen), `rows` (the estimated rows examined), `filtered`, and `Extra`, where `Using filesort` means an extra sort step, `Using temporary` means a temporary table, and `Using index` means a covering index. For a slow query I look for large `rows` estimates, `type = ALL` on a big table, filesorts on big sets, and joins without indexes. Then I add or adjust an index, rewrite the predicate to be sargable, select fewer columns, or restructure the query, and compare again. `EXPLAIN ANALYZE` (MySQL 8.0.18+) executes the query and shows actual row counts and timings, which exposes estimate errors. I confirm improvements with real timing and the slow query log, not by the plan alone.

**Hinglish explanation:** EXPLAIN = "MySQL ka plan": kaun sa index lega, kitni rows padhega. Dekhne wali cheezein: `type=ALL` (poori table scan), `rows` bahut zyada, `Extra` me `Using filesort`/`Using temporary`. Fix: sahi index, predicate ko index-friendly banana, kam columns select karna. `EXPLAIN ANALYZE` actual time bhi dikhata hai.

```sql
EXPLAIN
SELECT id, total FROM orders
WHERE customer_id = 1 AND status = 'paid'
ORDER BY created_at DESC LIMIT 20;
-- look at: type (ref/range wanted), key (which index), rows, Extra (no "Using filesort")

EXPLAIN ANALYZE
SELECT c.name, SUM(o.total) FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name;
```

**Follow-ups:**
- Q: Why can `rows` be wrong? A: It is an estimate from index statistics; run `ANALYZE TABLE` to refresh, and use `EXPLAIN ANALYZE` to compare estimates with actuals.
- Q: How do you find slow queries in production? A: Enable the slow query log (`long_query_time`), use Performance Schema or `pt-query-digest`, and an APM that tracks query timing.
- Q: Is a full table scan always bad? A: No; on small tables, or when most rows are needed, a scan can be the cheapest plan.

---

## SQL: transactions, concurrency and locking (Q-SQL-24 to Q-SQL-28)

---

### Q-SQL-24 | Basic | [ESSENTIAL] | Explain ACID properties with a banking example.

**Question:** What does each letter in ACID mean and how does InnoDB provide it?

**Interview answer:** Atomicity means a transaction is all or nothing: if any step fails the earlier steps are undone, such as a transfer that debits one account but fails to credit the other. InnoDB uses undo logs to roll back. Consistency means a transaction moves the database from one valid state to another, respecting constraints (foreign keys, unique, check) and business invariants, such as total money staying constant; some of this is enforced by the database and some by application logic. Isolation means concurrent transactions do not see each other's partial work; InnoDB achieves this using MVCC (multi-version concurrency control) and locks, with the strictness controlled by the isolation level. Durability means once committed, data survives crashes; InnoDB writes a redo log and, with `innodb_flush_log_at_trx_commit = 1`, flushes it to disk at commit. ACID is why a relational database is the default choice for money and orders.

**Hinglish explanation:** Atomicity = ya to poora kaam ya kuch nahi (paisa kat gaya par credit nahi hua - aisa nahi hona chahiye). Consistency = rules na tutein. Isolation = do transactions ek dusre ko beech me disturb na karein. Durability = commit ke baad power cut ho jaye to bhi data safe.

```sql
START TRANSACTION;
UPDATE accounts SET balance_cents = balance_cents - 5000 WHERE id = 1;
UPDATE accounts SET balance_cents = balance_cents + 5000 WHERE id = 2;
COMMIT;      -- both changes become durable together; ROLLBACK would undo both
```

**Follow-ups:**
- Q: Is a single SQL statement atomic? A: Yes, in InnoDB each statement is atomic; with autocommit on, each statement is its own transaction.
- Q: Does DDL participate in transactions? A: In MySQL most DDL (`ALTER`, `CREATE`, `TRUNCATE`) causes an implicit commit.
- Q: Which ACID property most relates to "money disappears after a crash"? A: Durability (for committed data) and atomicity (for partial changes).

---

### Q-SQL-25 | Intermediate | [ESSENTIAL] | Implement a safe money transfer in Node.js with mysql2 transactions.

**Question:** Write a transfer function that debits one account and credits another with correct locking, rollback and connection handling.

**Interview answer:** I get a dedicated connection from the pool, because a transaction is bound to one connection and `pool.query` can use different connections each time. I begin a transaction, lock both account rows with `SELECT ... FOR UPDATE`, ordered by id so that concurrent transfers acquire locks in the same order and cannot deadlock on each other, validate the balance on the locked data, apply both updates, insert a ledger row, and commit. On any error I roll back, and in a `finally` block I always release the connection back to the pool. I use integer minor units (cents) rather than floating-point numbers for money, and the check constraint `balance_cents >= 0` is a second safety net. For retries on deadlock (error 1213) or lock wait timeout (1205), I retry the whole transaction, not individual statements.

**Hinglish explanation:** Transaction ek connection par chalta hai, isliye `pool.getConnection()` lo. Dono accounts ko `FOR UPDATE` se lock karo, hamesha chhoti id pehle taaki do transfers ulte order me lock na maangein (deadlock). Fail hua to `rollback`, aur `finally` me `release()` - ye bhoole to pool khatam ho jayega.

```sql
CREATE TABLE accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner VARCHAR(100) NOT NULL,
  balance_cents BIGINT NOT NULL,
  CONSTRAINT chk_balance CHECK (balance_cents >= 0)
) ENGINE=InnoDB;
CREATE TABLE transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_account BIGINT UNSIGNED NOT NULL,
  to_account   BIGINT UNSIGNED NOT NULL,
  amount_cents BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

```js
export async function transfer(pool, fromId, toId, amountCents) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new AppError(400, 'BAD_AMOUNT', 'Invalid amount');
  if (fromId === toId) throw new AppError(400, 'SAME_ACCOUNT', 'Cannot transfer to the same account');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      'SELECT id, balance_cents FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
      [fromId, toId]);
    if (rows.length !== 2) throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');
    const from = rows.find(r => Number(r.id) === Number(fromId));
    if (Number(from.balance_cents) < amountCents) throw new AppError(422, 'INSUFFICIENT_FUNDS', 'Insufficient funds');

    await conn.execute('UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ?', [amountCents, fromId]);
    await conn.execute('UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?', [amountCents, toId]);
    await conn.execute(
      'INSERT INTO transfers (from_account, to_account, amount_cents) VALUES (?, ?, ?)',
      [fromId, toId, amountCents]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
```

**Follow-ups:**
- Q: Why not read the balance with a plain SELECT and update later? A: Two concurrent transfers could both read the same balance and overdraw (race condition); `FOR UPDATE` serializes them.
- Q: What does `pool.query('START TRANSACTION')` do wrong? A: The following statements may run on different pooled connections, so they are not in that transaction.
- Q: How does mysql2 return DECIMAL and BIGINT? A: `DECIMAL` columns come back as strings by default (to avoid precision loss); `BIGINT` becomes a JavaScript number, which loses precision above 2^53 unless `supportBigNumbers` and `bigNumberStrings` are enabled. Convert deliberately.

---

### Q-SQL-26 | Advanced | [ESSENTIAL] | Isolation levels and concurrency anomalies.

**Question:** Explain dirty read, non-repeatable read, phantom read and lost update, and the four isolation levels. What is MySQL's default?

**Interview answer:** A dirty read sees another transaction's uncommitted change. A non-repeatable read happens when the same row read twice in one transaction returns different values because another transaction committed in between. A phantom read happens when re-running a range query returns new rows inserted and committed by another transaction. A lost update occurs when two transactions read the same value and both write back, so one overwrite is lost. The SQL isolation levels are `READ UNCOMMITTED` (dirty reads possible), `READ COMMITTED` (no dirty reads, but non-repeatable reads and phantoms possible), `REPEATABLE READ` (consistent snapshot for plain reads), and `SERIALIZABLE` (strictest, effectively converts reads into locking reads). MySQL InnoDB's default is `REPEATABLE READ`: plain `SELECT`s use an MVCC snapshot taken at the first read, which prevents non-repeatable reads and, for consistent reads, phantoms; locking reads and writes use next-key locks to protect ranges. Many other databases, such as PostgreSQL, default to `READ COMMITTED`. Higher isolation reduces anomalies but increases locking and the chance of deadlocks or retries, so I choose the lowest level that keeps my invariants safe and use explicit locks or atomic updates for hot spots.

**Hinglish explanation:** Anomalies: dirty read = kisi ka uncommitted data padh liya. Non-repeatable = same row do baar padhi, value alag. Phantom = same query do baar, nayi rows aa gayi. Lost update = do log ek saath padhke likhein to ek ka kaam gum. InnoDB ka default `REPEATABLE READ` hai: transaction ke shuru me ek snapshot jaisa dikhta hai.

| Level | Dirty read | Non-repeatable read | Phantom |
|-------|-----------|---------------------|---------|
| READ UNCOMMITTED | possible | possible | possible |
| READ COMMITTED | no | possible | possible |
| REPEATABLE READ (InnoDB default) | no | no | not for plain consistent reads; locking reads use next-key locks |
| SERIALIZABLE | no | no | no |

```sql
SELECT @@transaction_isolation;                          -- REPEATABLE-READ
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;  -- applies to subsequent transactions of this session
```

**Follow-ups:**
- Q: Does REPEATABLE READ prevent lost updates? A: Not for read-then-write in application code; use `SELECT ... FOR UPDATE`, an atomic `UPDATE x = x - 1`, or optimistic version checks.
- Q: What is MVCC? A: Multi-version concurrency control: readers see a consistent version of rows from undo logs without blocking writers, and writers do not block plain readers.
- Q: Why do some teams use READ COMMITTED with MySQL? A: Fewer gap locks and deadlocks, closer to PostgreSQL behavior; requires row-based binary logging.

---

### Q-SQL-27 | Advanced | [ESSENTIAL] | What is a deadlock and how do you prevent and handle it?

**Question:** Describe a deadlock scenario and how InnoDB reacts. What do you do in application code?

**Interview answer:** A deadlock happens when two transactions each hold a lock the other needs, so neither can proceed. For example, transaction A updates row 1 then wants row 2, while transaction B updated row 2 and now wants row 1. InnoDB detects the cycle, picks a victim (usually the transaction that did less work), rolls it back, and returns error 1213 (`ER_LOCK_DEADLOCK`) to that client, while the other continues. Deadlocks are normal in busy systems; they cannot be eliminated entirely, but they can be minimized and must be handled. I prevent them by accessing rows in a consistent order (for example sorting ids before locking), keeping transactions short, avoiding user interaction or network calls inside a transaction, using indexes so that statements lock fewer rows, and using lower isolation levels where appropriate. In code, I catch error 1213 and retry the entire transaction a limited number of times with a small randomized delay, and log occurrences. `SHOW ENGINE INNODB STATUS` displays the latest deadlock.

**Hinglish explanation:** Do transactions ek dusre ke lock ka intezaar kar rahe hain: A ne row 1 pakdi aur row 2 chahiye, B ne row 2 pakdi aur row 1 chahiye. InnoDB ek ko "victim" bana ke rollback kar deta hai. Tumhe retry logic chahiye. Rokne ke liye: hamesha same order me lock lo, transaction chhoti rakho.

```text
Time   Transaction A                      Transaction B
t1     UPDATE accounts ... WHERE id=1     UPDATE accounts ... WHERE id=2
t2     UPDATE accounts ... WHERE id=2     UPDATE accounts ... WHERE id=1
       (waits for B)                      (waits for A)  -> deadlock, one is rolled back (error 1213)
```

```js
export async function withDeadlockRetry(fn, attempts = 3) {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (err) {
      const retryable = err.errno === 1213 || err.errno === 1205;   // deadlock / lock wait timeout
      if (!retryable || i >= attempts) throw err;
      await new Promise(r => setTimeout(r, 20 * i + Math.random() * 30));
    }
  }
}
```

**Follow-ups:**
- Q: Deadlock vs lock wait timeout? A: Deadlock is a cycle detected immediately; a lock wait timeout (error 1205, `innodb_lock_wait_timeout` default 50 s) happens when a transaction simply waits too long.
- Q: Can a single-row update deadlock? A: Yes, via secondary index locks, gap locks or foreign key checks, which is why indexes and short transactions matter.

---

### Q-SQL-28 | Advanced | [ESSENTIAL] | Pessimistic vs optimistic locking, and row, gap and next-key locks.

**Question:** When do you use `SELECT ... FOR UPDATE` and when a version column? What are gap locks?

**Interview answer:** Pessimistic locking locks rows up front (`SELECT ... FOR UPDATE`), assuming conflicts are likely; it prevents concurrent modification but holds locks, which reduces concurrency and risks deadlocks. It suits short critical sections like money movement or inventory reservation. Optimistic locking assumes conflicts are rare: each row has a `version` (or `updated_at`) column, a client reads the row with its version, and the update is `UPDATE ... SET ..., version = version + 1 WHERE id = ? AND version = ?`; if `affectedRows` is 0, someone else changed it and the caller retries or reports a conflict (HTTP 409). Optimistic locking works well across user think-time, such as editing a form, since no database lock is held. InnoDB's locks are row locks on index records; at `REPEATABLE READ`, locking reads and updates also use gap locks (the space between index records) and next-key locks (record plus preceding gap) to prevent phantom inserts, which can surprisingly block inserts into a range.

**Hinglish explanation:** Pessimistic = "pehle lock lo, phir kaam karo" (conflict ki zyada umeed). Optimistic = "kaam karo, save karte waqt check karo ki kisi ne badla to nahi" (version column se). Form edit jaisi lambi chalne wali cheez me optimistic behtar, kyunki lock ghanton tak nahi pakad sakte.

```sql
-- optimistic update
UPDATE products
SET name = ?, price = ?, version = version + 1
WHERE id = ? AND version = ?;
-- affectedRows = 0  -> someone else updated first: respond 409 Conflict

-- pessimistic
START TRANSACTION;
SELECT stock FROM products WHERE id = 1 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 1;
COMMIT;
```

**Follow-ups:**
- Q: `FOR UPDATE SKIP LOCKED` use? A: Lets workers pick the next unlocked row from a job table without waiting, forming a simple queue (MySQL 8.0+).
- Q: `FOR SHARE` vs `FOR UPDATE`? A: `FOR SHARE` allows other readers to share-lock but blocks writers; `FOR UPDATE` takes an exclusive lock.
- Q: How do you surface optimistic conflicts to API clients? A: Return 409 Conflict or 412 Precondition Failed with `If-Match` and an ETag.

---


---

## SQL: connections, performance and safe data access (Q-SQL-29 to Q-SQL-34)

---

### Q-SQL-29 | Intermediate | [ESSENTIAL] | What is connection pooling and how do you size a MySQL pool?

**Question:** Why use a pool in Node.js? What goes wrong when it is too small, too large, or when connections leak?

**Interview answer:** Opening a database connection is expensive: TCP, authentication, and session setup. A connection pool keeps a set of open connections and lends them to requests, so most queries reuse an existing connection. The pool also caps concurrency so the database is not overwhelmed. With `mysql2/promise`, `pool.query` and `pool.execute` acquire and release a connection automatically; for transactions I use `pool.getConnection()` and must `release()` it in a `finally` block. If the pool is too small, requests queue waiting for a free connection and latency increases; if too large, the database suffers from too many concurrent queries, memory use and context switching, and I may exceed MySQL's `max_connections`. Total connections equal pool size times the number of application instances, so I size the pool per instance with the whole fleet in mind. A leak, such as a missing `release()` after an error, gradually exhausts the pool and the service appears to hang. I monitor pool usage and queue length and use sensible timeouts.

**Hinglish explanation:** Har request par naya DB connection kholna mehenga hai, isliye connections ka "pool" rakhte hain jo reuse hote hain. Pool chhota = requests line me wait. Pool bahut bada = DB par load. Aur `getConnection()` ke baad `release()` bhool gaye to pool khatam aur app hang. Formula yaad rakho: total connections = pool size x instances (jaise 10 x 5 = 50), aur MySQL ka `max_connections` (default 151) isse zyada hona chahiye.

```js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,   // queue instead of failing when all connections are busy
  connectionLimit: 10,
  queueLimit: 0,              // 0 = unlimited queue; consider a cap plus request timeouts
  enableKeepAlive: true,
});

// simple queries: automatic acquire and release
const [rows] = await pool.execute('SELECT id, name FROM customers WHERE id = ?', [1]);

// transaction: manual connection handling
const conn = await pool.getConnection();
try { /* beginTransaction ... commit */ }
finally { conn.release(); }          // always
```

**Follow-ups:**
- Q: What is a reasonable starting pool size? A: Often 10 per instance; tune by load testing. More connections do not mean more throughput once the database is saturated.
- Q: Why do slow queries cause pool exhaustion? A: Each slow query holds a connection longer, so fewer connections are available and requests pile up behind them.
- Q: Does a pool help with serverless or many short-lived instances? A: Per-instance pools multiply connection counts; use a proxy (ProxySQL, RDS Proxy) or small pool sizes.

---

### Q-SQL-30 | Intermediate | [ESSENTIAL] | Why is deep OFFSET pagination slow in SQL and what are the alternatives?

**Question:** `LIMIT 20 OFFSET 200000` takes seconds. Why, and how do you fix it?

**Interview answer:** With `OFFSET`, MySQL must generate and discard all the skipped rows before returning the page, so the cost grows with the offset, even with an index, and if the query needs a sort or fetches wide rows the cost is higher. Better options are keyset (seek) pagination, which continues from the last seen sort key using an index, and, when jumping to arbitrary pages is required, a "deferred join": first select only the ids for the page from a narrow covering index, then join back to fetch the full rows for just those 20 ids. I also avoid `SELECT COUNT(*)` on every page for big tables, show approximate totals or "has more" instead, and always include a unique tiebreaker in `ORDER BY` so pages are stable.

**Hinglish explanation:** `OFFSET 200000` ka matlab DB pehle 2 lakh rows nikalta hai aur phir phenk deta hai. Isliye slow. Keyset: "jo last id/time dekha uske baad ki 20 rows do" - index se seedha. Agar page number chahiye hi chahiye to pehle sirf IDs nikalo (chhota index), phir un 20 IDs ki full rows join karke lao.

```sql
-- keyset (best for feeds): expanded form, supported by an index on (created_at, id)
SELECT id, total, created_at
FROM orders
WHERE created_at < '2026-02-10 16:45:00'
   OR (created_at = '2026-02-10 16:45:00' AND id < 104)
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- The shorter row-constructor form WHERE (created_at, id) < ('2026-02-10 16:45:00', 104) returns the same rows,
-- but on MySQL 8.0 it was NOT used as an index seek in our test (EXPLAIN ANALYZE read ~180k index entries on a
-- 200k-row table, versus 20 for the expanded form), so prefer the expanded form.

-- deferred join (when page numbers are required)
SELECT o.*
FROM orders o
JOIN (
  SELECT id FROM orders
  WHERE status = 'paid'
  ORDER BY created_at DESC, id DESC
  LIMIT 20 OFFSET 200000
) page ON page.id = o.id
ORDER BY o.created_at DESC, o.id DESC;
-- supporting index: (status, created_at, id)
```

**Follow-ups:**
- Q: What if the sort key is not unique? A: Add the primary key as a tiebreaker in both the `ORDER BY` and the cursor comparison.
- Q: Can keyset pagination support sorting by multiple user-chosen columns? A: Only with an index and cursor per allowed sort; usually limit sortable fields.

---

### Q-SQL-31 | Intermediate | [ESSENTIAL] | What is the N+1 query problem and how do you fix it?

**Question:** Why does listing 100 orders with their items make 101 queries, and how do you reduce it?

**Interview answer:** The N+1 problem is running one query to fetch N parent rows and then one additional query per parent to fetch its children, resulting in 1 + N round trips. It is slow because each query has network latency and uses a connection, and it often hides in ORM lazy loading or loops with `await` inside. The fixes are a single `JOIN` that fetches everything (then grouping rows in code), or two queries where the second fetches all children with `WHERE order_id IN (...)` and the code groups them in memory. The two-query approach avoids row multiplication from joining one-to-many data. I detect it by logging query counts per request, and prevent it with eager loading in ORMs and code reviews on loops that contain queries.

**Hinglish explanation:** 100 orders ke liye pehle 1 query, phir har order ke items ke liye alag query = 101 queries. Network round trips bahut. Fix: ek baar me saare order ids ke items `IN (...)` se lao aur memory me group karo - total 2 queries.

```js
// [X] N+1
const [orders] = await pool.execute('SELECT id, total FROM orders WHERE customer_id = ?', [customerId]);
for (const o of orders) {
  const [items] = await pool.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [o.id]);
  o.items = items;
}

// [OK] 2 queries
const [orders2] = await pool.execute('SELECT id, total FROM orders WHERE customer_id = ?', [customerId]);
if (orders2.length) {
  const ids = orders2.map(o => o.id);
  const [items] = await pool.query(                       // query() expands the array into (?, ?, ?)
    'SELECT order_id, product_id, quantity FROM order_items WHERE order_id IN (?)', [ids]);
  const byOrder = Map.groupBy(items, i => i.order_id);    // Node 21+; use a reduce on Node 20
  for (const o of orders2) o.items = byOrder.get(o.id) ?? [];
}
```

**Follow-ups:**
- Q: Why `pool.query` here and not `execute`? A: `execute` uses server-side prepared statements, which do not expand an array into multiple placeholders; `query` performs client-side escaped interpolation that does.
- Q: Is the `IN` list size limited? A: By `max_allowed_packet` and practicality; batch very large id lists in chunks of a few thousand.
- Q: JOIN vs two queries? A: JOIN for one-to-one or small fan-out; two queries for one-to-many to avoid duplicating parent columns.

---

### Q-SQL-32 | Intermediate | [ESSENTIAL] | An endpoint became slow in production. How do you diagnose and fix the database side?

**Question:** Describe a systematic approach to find and fix a slow SQL query.

**Interview answer:** First I confirm that the database is the bottleneck by measuring time per layer (application code, query time, network) with logs, tracing or APM. Then I identify the specific slow queries using the slow query log or Performance Schema, and capture the exact SQL and parameters. I run `EXPLAIN` or `EXPLAIN ANALYZE` to see the plan: full scans, large estimated rows, filesorts, missing join indexes. Typical fixes in order of effort are: add or adjust an index, rewrite non-sargable predicates, select only needed columns, replace OFFSET with keyset pagination, remove N+1 patterns, batch writes, shorten long transactions, add caching for hot reads, and finally consider schema changes, read replicas or summary tables. I verify the improvement with realistic data volumes, because a query that is fast with 1,000 rows may be slow with 10 million, and I add the index in a way that does not lock the table for long (online DDL, `ALGORITHM=INPLACE`). I also check contention: lock waits, long-running transactions and pool exhaustion can look like slow queries.

**Hinglish explanation:** Pehle naap lo ki dheema kahan hai (app, DB ya network). Phir slow query log se wahi query pakdo, `EXPLAIN` chalao, aur index/rewrite se theek karo. Production data jitna bada test data par check karo. Aur ye bhi dekho ki query khud slow hai ya lock/pool ki wajah se wait kar rahi hai.

```sql
-- enable and inspect slow queries (session example; use config files in production)
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;

-- currently running statements
SHOW FULL PROCESSLIST;

-- top statements by total time (Performance Schema)
SELECT DIGEST_TEXT, COUNT_STAR, ROUND(SUM_TIMER_WAIT/1e12, 2) AS total_s
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 5;
```

**Follow-ups:**
- Q: Index added but no improvement? A: Check that the optimizer uses it (`EXPLAIN`), that statistics are fresh, and that the predicate is sargable.
- Q: How do you add an index on a huge table safely? A: Online DDL in MySQL 8 or tools such as `gh-ost` / `pt-online-schema-change`, during low traffic, monitoring replication lag.
- Q: When would you cache instead of tuning? A: For read-heavy, rarely changing data after fixing obvious query problems; caching hides inefficiency and introduces invalidation complexity.

---

### Q-SQL-33 | Intermediate | [ESSENTIAL] | Prevent overselling: stock decrement under concurrency.

**Question:** Two customers buy the last item at the same time. How do you ensure stock never goes negative?

**Interview answer:** A read-then-write approach (select stock, check in code, then update) has a race: both requests see stock 1 and both decrement. The simplest correct solution is an atomic conditional update: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`, then check `affectedRows`; if it is 0, there was not enough stock and I return 409 or 422. The database serializes updates to the same row with a row lock, so only one request succeeds. If the decrement must be part of a bigger unit of work (create order, order items, payment record), I do it within one transaction so a failure rolls everything back, locking products in a consistent id order for multi-item orders. A `CHECK (stock >= 0)` constraint is an additional safeguard. For very hot items, I may reserve stock in a cache or queue and reconcile, but correctness at the database level remains the source of truth.

**Hinglish explanation:** Code me `if (stock > 0)` check karke baad me update karna galat hai - do requests ek saath check pass kar leti hain. Sahi tareeka: ek hi SQL me condition: `stock = stock - 1 WHERE stock >= 1`, aur `affectedRows` dekho. DB row lock deke ek-ek karke chalata hai.

```js
export async function reserveStock(conn, productId, qty) {
  const [res] = await conn.execute(
    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [qty, productId, qty]);
  if (res.affectedRows !== 1) throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock');
}

// inside a transaction for a multi-item order
// for (const item of [...items].sort((a, b) => a.productId - b.productId)) await reserveStock(conn, item.productId, item.qty);
```

**Follow-ups:**
- Q: Why sort items before locking? A: Consistent lock order avoids deadlocks between concurrent orders containing the same products.
- Q: What about `affectedRows` when the new value equals the old? A: MySQL by default reports changed rows; here the value always changes, so it is reliable.
- Q: How do you handle abandoned carts holding stock? A: Time-limited reservations with a TTL and a cleanup job.

---

### Q-SQL-34 | Intermediate | [ESSENTIAL] | SQL injection: how does it happen and how do you prevent it with mysql2?

**Question:** Why is string concatenation dangerous? What is the difference between `execute` and `query`, and how do you handle dynamic column names?

**Interview answer:** SQL injection happens when untrusted input becomes part of the SQL text, so an attacker can change the query's structure, for example `' OR '1'='1` in a login or `; DROP TABLE` in a stacked query. The defense is to keep SQL text and data separate using parameterized queries: placeholders `?` bind values safely as data. In mysql2, `execute()` uses server-side prepared statements, while `query()` escapes values on the client side and interpolates them; both are safe when I pass values as parameters, never when I concatenate them into the string. Parameters can only replace values, not identifiers such as table or column names or `ASC`/`DESC`; for those I map user choices through an allow-list, or use `mysql.escapeId` for identifiers with care. Additional layers are least-privilege database users (no `DROP`, no admin rights for the app account), input validation, no detailed database errors returned to clients, and an ORM or query builder, which still must be used with parameters. Stored data that is later concatenated into SQL (second-order injection) is equally dangerous.

**Hinglish explanation:** Agar user ka input seedha SQL string me jod diya, to wo SQL ka hissa ban jata hai. Placeholder `?` use karoge to wo sirf "data" rehta hai. Column/table ka naam placeholder nahi ban sakta, uske liye allow-list. DB user ko sirf zaroori permissions do - agar injection ho bhi jaye to nuksan limited rahe.

```js
// [X] vulnerable
const bad = `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${hash}'`;
// email = "' OR '1'='1' -- "  changes the logic

// [OK] parameterized
const [rows] = await pool.execute('SELECT id, role FROM users WHERE email = ?', [email]);

// [OK] dynamic identifier through an allow-list
const SORT = { name: 'name', created: 'created_at' };
const col = SORT[req.query.sort] ?? 'created_at';
const [list] = await pool.query(`SELECT id, name FROM customers ORDER BY ${col} DESC LIMIT ?`, [25]);
```

**Follow-ups:**
- Q: Are ORMs immune? A: Generally safe with their query APIs, but raw query helpers with interpolated strings are just as vulnerable.
- Q: Does escaping quotes manually work? A: It is fragile (character sets, edge cases); use parameters.
- Q: How do you limit damage? A: A least-privilege DB account, network restrictions, read-only users for reporting, WAF rules, and monitoring for unusual queries. Deeper coverage is in `10_Question_Bank_B.md` (Q-SEC).

---


---

# Category 5 -- MongoDB (`Q-MONGO-`)

Related notes: Week 5 / Day 2 (MongoDB documents, collections, indexes, aggregation, SQL vs NoSQL). MySQL remains the primary database in this preparation set; MongoDB is covered at a fundamentals-to-intermediate level, which is what most junior-to-mid Node.js interviews expect.

## Reference data (used by many MongoDB questions)

Run in `mongosh`. Results quoted below refer to exactly this data. It mirrors the SQL reference data so you can compare approaches.

```js
use shop

db.customers.insertMany([
  { _id: 1, name: 'Asha',  city: 'Pune'   },
  { _id: 2, name: 'Ravi',  city: 'Delhi'  },
  { _id: 3, name: 'Meera', city: 'Pune'   },
  { _id: 4, name: 'Karan', city: 'Mumbai' }
]);

db.orders.insertMany([
  { _id: 101, customerId: 1, status: 'paid',      total: 2000, createdAt: ISODate('2026-01-05T10:00:00Z'),
    items: [ { sku: 'KB', qty: 1, price: 1500 }, { sku: 'MS', qty: 1, price: 500 } ] },
  { _id: 102, customerId: 1, status: 'shipped',   total: 500,  createdAt: ISODate('2026-01-20T11:30:00Z'),
    items: [ { sku: 'NB', qty: 5, price: 100 } ] },
  { _id: 103, customerId: 2, status: 'paid',      total: 1000, createdAt: ISODate('2026-02-03T09:15:00Z'),
    items: [ { sku: 'MS', qty: 2, price: 500 } ] },
  { _id: 104, customerId: 2, status: 'cancelled', total: 1500, createdAt: ISODate('2026-02-10T16:45:00Z'),
    items: [ { sku: 'KB', qty: 1, price: 1500 } ] },
  { _id: 105, customerId: 3, status: 'paid',      total: 1500, createdAt: ISODate('2026-02-15T12:00:00Z'),
    items: [ { sku: 'NB', qty: 10, price: 100 }, { sku: 'MS', qty: 1, price: 500 } ] }
]);
```

Money is stored as integer whole currency units here only to keep examples small; in real systems use integer minor units (paise or cents) or `Decimal128`, never floating point.

---

### Q-MONGO-01 | Basic | [ESSENTIAL] | What is MongoDB and what is the document model?

**Question:** Explain MongoDB, documents, collections, BSON and how they map to relational concepts.

**Interview answer:** MongoDB is a document-oriented NoSQL database. Data is stored as documents, which are JSON-like objects serialized in BSON (binary JSON, which adds types such as `ObjectId`, `Date`, `Decimal128` and binary data). Documents live in collections, which roughly correspond to tables, but collections do not enforce a fixed schema by default, so documents in one collection can have different fields, although I can add schema validation rules. A document can embed arrays and nested objects, so data that is read together can be stored together and fetched with one read without joins. The maximum document size is 16 MB. Each document has a unique `_id`, which is an `ObjectId` by default. MongoDB scales horizontally through sharding and provides high availability through replica sets.

**Hinglish explanation:** MongoDB me data JSON jaise documents me hota hai. Table = collection, row = document, column = field. Fark: ek document ke andar array aur nested object rakh sakte ho, isliye jo data saath me padha jata hai use saath me store kar do. Frontend developer ke liye ye natural lagta hai kyunki JS object jaisa hi hai.

```js
// one document with embedded address and items
{
  _id: ObjectId('65f1a2b3c4d5e6f708192a3b'),
  name: 'Asha',
  address: { city: 'Pune', pin: '411001' },
  tags: ['vip', 'newsletter'],
  createdAt: ISODate('2026-01-05T10:00:00Z')
}
```

**Follow-ups:**
- Q: What is BSON and why not plain JSON? A: BSON is a binary format with richer types (dates, 64-bit integers, decimals, binary) and efficient traversal.
- Q: Is MongoDB schemaless? A: Flexible-schema is a better term; the application still has an implicit schema, and you should enforce it with `$jsonSchema` validation or Mongoose.
- Q: What is in an ObjectId? A: 12 bytes: a 4-byte timestamp, a 5-byte random value and a 3-byte counter, so ids are roughly time-ordered and unique without coordination.

---

### Q-MONGO-02 | Basic | [ESSENTIAL] | SQL vs NoSQL: how do you decide? What trade-offs matter?

**Question:** Compare MySQL and MongoDB for a new backend. When would you choose each?

**Interview answer:** I choose based on data shape, consistency needs, query patterns and team skills, not on fashion. A relational database such as MySQL fits well-structured, highly relational data, strong constraints, multi-row transactions and ad hoc queries with joins and aggregations, which is typical for orders, payments, inventory and banking. MongoDB fits hierarchical or variable data that is usually read and written as a whole document, such as product catalogs with varying attributes, content, user profiles, event logs and rapid prototyping, and it makes horizontal scaling by sharding more natural. Since MongoDB 4.0, multi-document ACID transactions exist on replica sets, but they are heavier than single-document operations and the data model should avoid needing them often. Joins are possible with `$lookup` but are not MongoDB's strength, and relational integrity (foreign keys) is not enforced by the database. For most business applications involving money, I default to a relational database and use MongoDB where the document model clearly helps. Many systems use both (polyglot persistence).

**Hinglish explanation:** "NoSQL SQL se better hai" galat soch hai. Paisa, orders, inventory: relationships aur transactions zyada, to MySQL. Catalog jaisi data jisme har product ke alag attributes hain, ya logs, ya aisa data jo ek document ke roop me padha jata hai: MongoDB. Interview me "it depends" ke saath reasons bolna zaroori hai.

| Aspect | MySQL (relational) | MongoDB (document) |
|--------|--------------------|--------------------|
| Schema | Fixed, enforced | Flexible, optional validation |
| Relationships | Foreign keys, joins | Embed or reference, `$lookup` |
| Transactions | Mature multi-row ACID | Single-document atomic; multi-document supported but costlier |
| Query language | SQL | Query API and aggregation pipeline |
| Scaling writes | Vertical, replicas, manual sharding | Built-in sharding |
| Best for | Orders, payments, reporting | Catalogs, content, events, profiles |

**Follow-ups:**
- Q: Can MongoDB handle money? A: Yes with care (integer minor units or Decimal128, transactions, write concern majority), but relational constraints and joins usually make SQL the simpler, safer choice.
- Q: What is CAP? A: Under a network partition a distributed system must choose consistency or availability; MongoDB's default replica set behavior favors consistency (a partitioned minority cannot accept writes).

---

### Q-MONGO-03 | Basic | [ESSENTIAL] | Write CRUD operations with the Node.js driver.

**Question:** Show insert, find, update and delete with the official `mongodb` driver. What do the return values tell you?

**Interview answer:** I create one `MongoClient` at startup, reuse it for the life of the process, and get a collection handle from `client.db(name).collection(name)`. `insertOne` returns `insertedId`, `find` returns a cursor which I convert with `toArray()` or iterate, `updateOne` returns `matchedCount` and `modifiedCount`, and `deleteOne` returns `deletedCount`. I always validate input first, use operators such as `$set` for updates (an update without operators would fail or replace documents depending on the method), and treat `matchedCount === 0` as not found. Since `_id` is an `ObjectId` by default, I convert incoming string ids with `new ObjectId(id)` after validating them with `ObjectId.isValid`.

**Hinglish explanation:** Driver me ek hi `MongoClient` banao aur poore process me use karo. `find` cursor deta hai, `toArray()` se array banta hai. Update me `$set` jaisa operator lagao. URL se jo `id` string aati hai use `ObjectId` me badalna padta hai warna match nahi hoga.

```js
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL);
await client.connect();
const orders = client.db('shop').collection('orders');

const { insertedId } = await orders.insertOne({ customerId: 1, status: 'pending', total: 700, items: [], createdAt: new Date() });

const paid = await orders.find({ status: 'paid' }, { projection: { _id: 1, total: 1 } })
  .sort({ createdAt: -1 }).limit(10).toArray();

const r = await orders.updateOne({ _id: insertedId }, { $set: { status: 'paid' } });
console.log(r.matchedCount, r.modifiedCount);        // 1 1

const d = await orders.deleteOne({ _id: insertedId });
console.log(d.deletedCount);                         // 1

await client.close();
```

**Follow-ups:**
- Q: `updateOne` vs `replaceOne`? A: `updateOne` applies operators to selected fields; `replaceOne` swaps the whole document (except `_id`).
- Q: `findOne` returns what if nothing matches? A: `null`.
- Q: What does `findOneAndUpdate` add? A: Atomic read-modify-write returning the document before or after (`returnDocument: 'after'`).

---

### Q-MONGO-04 | Basic | [ESSENTIAL] | Query operators and projection: write common find queries.

**Question:** Using the reference data, find paid orders above 1000, orders by customers 1 or 2, orders containing the MS item, and show only selected fields.

**Interview answer:** MongoDB queries are documents. Comparison operators include `$gt`, `$gte`, `$lt`, `$lte`, `$ne`, `$in` and `$nin`; logical operators are `$and`, `$or`, `$not` and `$nor`; and `$exists`, `$type` and `$regex` check fields. Multiple top-level conditions are implicitly ANDed. To match inside arrays of objects I use dot notation (`'items.sku': 'MS'`), and `$elemMatch` when several conditions must apply to the same array element. Projection selects which fields to return and reduces data transfer; including some fields while excluding others is not allowed except for `_id`. I add indexes for the fields used in filters and sorts.

**Hinglish explanation:** Query bhi ek JS object hai. Sab conditions by default AND hoti hain. Array ke andar ke objects me dhoondhna ho to `'items.sku'`. Agar ek hi array element par do conditions chahiye (sku = 'MS' AND qty >= 2) to `$elemMatch`, warna dono alag elements se match ho sakti hain - ye classic trap hai.

```js
db.orders.find({ status: 'paid', total: { $gt: 1000 } });                    // 101 (2000), 105 (1500)
db.orders.find({ customerId: { $in: [1, 2] } });                             // 101, 102, 103, 104
db.orders.find({ 'items.sku': 'MS' }, { total: 1, status: 1, _id: 0 });      // 101, 103, 105
db.orders.find({ items: { $elemMatch: { sku: 'MS', qty: { $gte: 2 } } } });  // 103 only
db.orders.find({ $or: [{ status: 'cancelled' }, { total: { $gte: 2000 } }] });
```

**Follow-ups:**
- Q: `{ 'items.sku': 'MS', 'items.qty': { $gte: 2 } }` vs `$elemMatch`? A: Without `$elemMatch` the two conditions can be satisfied by different array elements. Order 105 has MS with qty 1 and NB with qty 10, so it would wrongly match the non-`$elemMatch` query; `$elemMatch` requires one element to satisfy both, so only order 103 matches.
- Q: Is `$regex` fast? A: Only anchored, case-sensitive prefix patterns (`/^abc/`) can use an index efficiently.

---

### Q-MONGO-05 | Intermediate | [ESSENTIAL] | Update operators: $set, $inc, $push, $pull, $addToSet, upsert.

**Question:** Show how to increment a counter, add to and remove from arrays, and do an upsert, atomically.

**Interview answer:** Update operators modify fields in place atomically within a single document. `$set` and `$unset` set or remove fields, `$inc` increments numbers atomically (so no read-modify-write race), `$push` appends to an array (with `$each`, `$slice` and `$sort` modifiers to cap size), `$addToSet` appends only if absent, and `$pull` removes matching elements. `$setOnInsert` applies values only when an upsert inserts. An upsert (`{ upsert: true }`) updates the matching document or inserts a new one; to avoid duplicates under concurrency it must be backed by a unique index. Positional operators (`$`, `$[]`, `$[<identifier>]` with `arrayFilters`) update array elements. I prefer these operators over reading the document, modifying it in code and saving it back, because they are atomic and cheaper.

**Hinglish explanation:** Counter badhana ho to `$inc` - ye atomic hai, to do requests ek saath chalein tab bhi count sahi rahega. Code me read karke +1 karke save karna race condition deta hai. Upsert = "mile to update, nahi to insert", par uske saath unique index zaroor rakho.

```js
await db.collection('products').updateOne({ _id: 'KB' }, { $inc: { stock: -1 } });                       // atomic decrement
await db.collection('users').updateOne({ _id: 1 }, { $addToSet: { tags: 'vip' } });                      // no duplicates
await db.collection('users').updateOne({ _id: 1 }, { $pull: { tags: 'newsletter' } });
await db.collection('feed').updateOne({ _id: 'u1' },
  { $push: { recent: { $each: [{ msg: 'hi' }], $slice: -50 } } });                                       // keep last 50

await db.collection('counters').updateOne(
  { _id: 'orderSeq' },
  { $inc: { value: 1 }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true });
```

**Follow-ups:**
- Q: Conditional stock decrement? A: `updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` and check `modifiedCount`; the same idea as the SQL conditional update.
- Q: How do you update one element inside an array? A: `updateOne({ _id, 'items.sku': 'MS' }, { $set: { 'items.$.qty': 3 } })`.

---

### Q-MONGO-06 | Intermediate | [ESSENTIAL] | Embedding versus referencing: how do you model relationships?

**Question:** Should order items be embedded in the order document? What about customers? What guides the choice?

**Interview answer:** I model for the application's access patterns. I embed when the child data is read together with the parent, is owned by it, has bounded size, and does not need independent access: order line items inside an order are a good example, and they also give atomic updates of the whole order in one document. I reference (store the id, like a foreign key) when the related entity is shared or large, changes independently, or is unbounded: a customer is referenced from orders rather than copied into each one, though I may duplicate a few stable display fields such as the customer's name at order time for fast reads and history (a deliberate denormalization). The rules of thumb: one-to-few embed, one-to-many often reference or use bounded embedding, and many-to-many use arrays of references. I also watch the 16 MB document limit and avoid unbounded arrays.

**Hinglish explanation:** Pooch ye: "ye data hamesha saath me padha jata hai?" Haan to embed. "Alag se bhi use hota hai, ya bahut bada/badhta rehta hai?" To reference. Order ke items order ke saath hi dikhte hain, to embed. Customer ka profile alag se badalta hai, to order me sirf `customerId` aur shayad naam ka snapshot.

```js
// embedded items + referenced customer + snapshot of price/name at purchase time
{
  _id: 101,
  customerId: 1,                       // reference
  customerName: 'Asha',                // snapshot (denormalized)
  items: [ { sku: 'KB', name: 'Keyboard', qty: 1, price: 1500 } ],   // embedded, bounded
  total: 2000,
  status: 'paid'
}
```

**Follow-ups:**
- Q: Downside of duplicating data? A: Updates must be applied in multiple places or accepted as historical snapshots; choose fields that rarely change or should be frozen in time.
- Q: What is the extended reference pattern? A: Store the id plus a few commonly displayed fields of the referenced document to avoid `$lookup`.

---

### Q-MONGO-07 | Intermediate | [ESSENTIAL] | Unbounded arrays and the 16 MB limit: what is the anti-pattern and the fix?

**Question:** A `posts` document embeds all comments in an array. What problems appear as comments grow?

**Interview answer:** An ever-growing array makes the document large: it can hit the 16 MB limit, each update rewrites more data, memory and network usage per read increases, indexes on array fields (multikey) grow, and fetching a post loads every comment even if the client needs only the latest few. The fix is to store the unbounded side as separate documents in a `comments` collection with a `postId` reference and an index on `(postId, createdAt)`, then paginate. For bounded recent items, I can keep the last N inline using `$push` with `$slice`. The bucket pattern groups time-series or event data into documents holding a fixed number of entries or a time window, reducing document count and index size.

**Hinglish explanation:** Document me array hamesha badhta rahe to wo mote ho jata hai - 16 MB ki limit aur slow reads. Comments ko alag collection me rakho (`postId` ke saath) aur pagination karo. Sirf "latest 5 comments" jaisa chhota snapshot post me rakh sakte ho.

```js
await db.collection('comments').createIndex({ postId: 1, createdAt: -1 });
const page = await db.collection('comments')
  .find({ postId }).sort({ createdAt: -1 }).limit(20).toArray();
```

**Follow-ups:**
- Q: What is a multikey index? A: An index on an array field that creates an index entry per element; large arrays inflate it.
- Q: How big can the working set be? A: The frequently accessed data and indexes ideally fit in RAM; large documents reduce how many fit.

---

### Q-MONGO-08 | Intermediate | [ESSENTIAL] | Indexes in MongoDB: types and creation.

**Question:** What index types exist? What do unique, TTL and partial indexes do?

**Interview answer:** MongoDB uses B-tree indexes. Every collection has a unique index on `_id`. Single-field and compound indexes speed up filters and sorts; multikey indexes handle array fields; text and 2dsphere indexes support text search and geospatial queries. A unique index enforces uniqueness (a duplicate insert fails with error code 11000, E11000 duplicate key). A TTL index automatically deletes documents after a number of seconds from a date field, useful for sessions, OTPs and temporary tokens; deletion is done by a background task that runs about every 60 seconds, so it is not instant. A partial index indexes only documents matching a filter, and a sparse index skips documents without the field, both reducing size. As with SQL, indexes speed reads but slow writes and use memory, so I create them based on real query patterns and check them with `explain`.

**Hinglish explanation:** Index se query fast hoti hai, par write slow aur memory zyada. `unique` duplicate rokta hai. `TTL` purane documents khud delete kar deta hai (OTP, session). Index kaun sa chahiye ye `explain()` aur real queries dekh ke decide karo.

```js
await db.collection('users').createIndex({ email: 1 }, { unique: true });
await db.collection('otps').createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });             // TTL, 5 min
await db.collection('orders').createIndex({ customerId: 1, createdAt: -1 });                         // compound
await db.collection('orders').createIndex({ status: 1 }, { partialFilterExpression: { status: { $in: ['pending', 'paid'] } } });
```

**Follow-ups:**
- Q: How do you catch a duplicate-key error in Node? A: `err.code === 11000`; map to HTTP 409.
- Q: Does a TTL index delete exactly on time? A: No; the monitor runs roughly every minute, so expired documents can linger briefly.

---

### Q-MONGO-09 | Advanced | [ESSENTIAL] | Compound index order: the ESR rule.

**Question:** Design an index for `find({ customerId: 1, status: 'paid', total: { $gt: 500 } }).sort({ createdAt: -1 })`.

**Interview answer:** The guideline is ESR: Equality fields first, then Sort fields, then Range fields. Equality predicates narrow to a precise index range, the sort field next lets the index return documents already ordered so no in-memory sort is needed, and range predicates go last because a range on an earlier field would break the sort order for later fields. For this query: `{ customerId: 1, status: 1, createdAt: -1, total: 1 }`. As with SQL composite indexes, the leftmost-prefix principle applies: this index also supports queries on `customerId` alone or `customerId` + `status`. An in-memory sort that exceeds 100 MB fails unless disk use is allowed, so supporting the sort with an index is important for large result sets.

**Hinglish explanation:** Yaad rakho ESR: pehle Equality wale fields, phir Sort ka field, last me Range wale. Isse index se hi sorted result mil jata hai aur alag se sort nahi karna padta. Ye SQL ke "equality pehle, range baad me" rule jaisa hi hai.

```js
await orders.createIndex({ customerId: 1, status: 1, createdAt: -1, total: 1 });

await orders.find({ customerId: 1, status: 'paid', total: { $gt: 500 } })
  .sort({ createdAt: -1 })
  .explain('executionStats');     // expect IXSCAN and no SORT stage
```

**Follow-ups:**
- Q: Does index direction (1 vs -1) matter? A: Not for single-field sorts; for compound indexes, the sort pattern must match the index or its exact reverse.
- Q: How many indexes is too many? A: Each write updates all indexes; keep only those used, and review unused ones with `$indexStats`.

---

### Q-MONGO-10 | Intermediate | [ESSENTIAL] | How do you use explain() and what are COLLSCAN, IXSCAN and covered queries?

**Question:** How do you tell whether a MongoDB query uses an index and whether it is efficient?

**Interview answer:** I run `explain('executionStats')` on the query. The winning plan shows the stage: `COLLSCAN` means a full collection scan, `IXSCAN` means an index scan followed by `FETCH` to read documents, and a `SORT` stage means an in-memory sort. The most telling numbers are `nReturned` (documents returned), `totalKeysExamined` and `totalDocsExamined`: in an efficient query they are close to each other, while a large `totalDocsExamined` compared with `nReturned` shows wasted work. A covered query returns results entirely from the index, using a projection that includes only indexed fields and excludes `_id` unless it is in the index; the plan then has no `FETCH`. I also use the database profiler or slow query logs in production to find slow operations.

**Hinglish explanation:** `explain('executionStats')` me dekho: `COLLSCAN` = poori collection scan (bad), `IXSCAN` = index use. `nReturned` aur `totalDocsExamined` ka ratio dekho: agar 10 return karne ke liye 1 lakh docs examine hue, to index galat ya missing hai.

```js
const plan = await orders.find({ customerId: 1, status: 'paid' }).explain('executionStats');
const s = plan.executionStats;
console.log(plan.queryPlanner.winningPlan.stage, s.nReturned, s.totalKeysExamined, s.totalDocsExamined, s.executionTimeMillis);
```

**Follow-ups:**
- Q: Can a covered query exist with an array field in the index? A: Not when the index is multikey on that field, since the index cannot reproduce the original array.
- Q: What is `hint()`? A: Forces the use of a specific index, mostly for testing; the optimizer normally chooses well.

---


### Q-MONGO-11 | Intermediate | [ESSENTIAL] | What is the aggregation pipeline? Explain the main stages.

**Question:** Explain `$match`, `$group`, `$project`, `$sort`, `$limit`, `$unwind` and `$lookup`, and how data flows through a pipeline.

**Interview answer:** The aggregation pipeline processes documents through an ordered list of stages, where each stage transforms the stream and passes the output to the next, similar to a Unix pipe or chained array methods. `$match` filters documents, `$group` groups by a key and computes accumulators such as `$sum`, `$avg`, `$min`, `$max` and `$push`, `$project` (or `$addFields` and `$set`) reshapes documents, `$sort` and `$limit` order and cut results, `$unwind` deconstructs an array into one document per element, and `$lookup` performs a left outer join with another collection. Order matters for performance and correctness: filtering early with `$match` (and `$sort` early, before stages that destroy index usability) reduces the amount of data flowing through the rest of the pipeline. The pipeline is the MongoDB equivalent of SQL's `WHERE`, `GROUP BY`, `HAVING` and joins combined.

**Hinglish explanation:** Pipeline = assembly line. Har stage documents ko leta hai, kuch karta hai, aage bhejta hai. `$match` = WHERE, `$group` = GROUP BY, `$sort/$limit` = ORDER BY/LIMIT, `$lookup` = LEFT JOIN. JS me `.filter().map().reduce()` chain jaisa socho.

```js
db.orders.aggregate([
  { $match: { status: { $in: ['paid', 'shipped'] } } },          // WHERE
  { $group: { _id: '$customerId', spent: { $sum: '$total' }, orders: { $sum: 1 } } },   // GROUP BY
  { $sort: { spent: -1 } },                                       // ORDER BY
  { $limit: 3 }
]);
// { _id: 1, spent: 2500, orders: 2 }, { _id: 3, spent: 1500, orders: 1 }, { _id: 2, spent: 1000, orders: 1 }
```

**Follow-ups:**
- Q: Equivalent of HAVING? A: A `$match` stage after `$group`.
- Q: `$project` vs `$addFields`? A: `$project` defines the output shape (fields not mentioned are dropped); `$addFields` keeps existing fields and adds new ones.

---

### Q-MONGO-12 | Intermediate | [ESSENTIAL] | Aggregation query: total spent per customer with names (using $lookup).

**Question:** Return customer name, number of paid or shipped orders, and total spent, highest first.

**Interview answer:** I filter orders by status, group by `customerId` to compute the totals, then use `$lookup` to fetch the customer document for the name, `$unwind` to turn the one-element array into an object, and `$project` to shape the result. Doing the `$group` before `$lookup` means the join runs once per customer rather than once per order, which is cheaper. `$lookup` is a left outer join, so customers without orders are not in this result because the pipeline started from orders; to include customers with zero orders I would start from the `customers` collection and look up their orders, accepting the extra work.

**Hinglish explanation:** Pehle orders ko group karo (kam documents bachte hain), phir sirf un groups ke liye `$lookup` se customer ka naam lao. Ulta karoge (pehle lookup, phir group) to join zyada baar chalega. SQL ke saath compare: wahi "aggregate first, then join" idea.

```js
db.orders.aggregate([
  { $match: { status: { $in: ['paid', 'shipped'] } } },
  { $group: { _id: '$customerId', spent: { $sum: '$total' }, orders: { $sum: 1 } } },
  { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
  { $unwind: '$customer' },
  { $project: { _id: 0, name: '$customer.name', orders: 1, spent: 1 } },
  { $sort: { spent: -1 } }
]);
// Asha 2 2500, Meera 1 1500, Ravi 1 1000
```

**Follow-ups:**
- Q: How do you include customers with no orders (Karan)? A: Aggregate on `customers` with `$lookup` from `orders` (with a pipeline to filter status), then `$size`/`$sum` over the joined array.
- Q: Do you need an index for `$lookup`? A: Yes, an index on the foreign collection's `foreignField` (here `_id`, already indexed); otherwise it scans per input document.

---

### Q-MONGO-13 | Intermediate | [ESSENTIAL] | Aggregation query: revenue per SKU using $unwind.

**Question:** Compute revenue per product SKU from embedded `items` for `paid` and `shipped` orders and return the top 3.

**Interview answer:** Items are embedded in an array, so I first filter orders, then `$unwind` the `items` array to produce one document per line item, compute `qty * price` with `$multiply`, group by SKU and sum, and sort descending with a tiebreaker on `_id` for determinism. `$unwind` multiplies the number of documents, so filtering with `$match` before it is important for performance. With the reference data the result is MS 2000, then KB 1500 and NB 1500 (a tie).

**Hinglish explanation:** Embedded array ke har element par kaam karna ho to `$unwind`: ek order ke 2 items to 2 documents ban jate hain. Phir group by SKU. Ye wahi cheez hai jo SQL me `order_items` join karke kiya tha.

```js
db.orders.aggregate([
  { $match: { status: { $in: ['paid', 'shipped'] } } },
  { $unwind: '$items' },
  { $group: { _id: '$items.sku', revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } },
  { $sort: { revenue: -1, _id: 1 } },
  { $limit: 3 }
]);
// { _id: 'MS', revenue: 2000 }, { _id: 'KB', revenue: 1500 }, { _id: 'NB', revenue: 1500 }
```

**Follow-ups:**
- Q: What does `$unwind` do to documents with an empty or missing array? A: They are dropped unless `preserveNullAndEmptyArrays: true`.
- Q: Alternative without unwinding? A: Operators such as `$reduce`/`$map` over the array can compute per-order values without multiplying documents.

---

### Q-MONGO-14 | Intermediate | [ESSENTIAL] | Aggregation query: monthly revenue and order count.

**Question:** Produce revenue per month for paid and shipped orders.

**Interview answer:** I match on status and a date range, then group by a formatted month computed with `$dateToString` (or `$dateTrunc` in newer versions) and sum the totals. Dates are stored as UTC `Date` values; if business reporting uses a local time zone I pass the `timezone` option. A date-range `$match` on an indexed `createdAt` at the beginning of the pipeline lets MongoDB use the index and reduces the volume processed. For heavy repeated reports I would precompute summaries, using a scheduled aggregation with `$merge` into a summary collection.

**Hinglish explanation:** Month ka key banane ke liye `$dateToString` use karo. Date range `$match` me sabse pehle rakho taaki index use ho. Roz-roz bhaari report chalani ho to result ko `$merge` se summary collection me save kar lo.

```js
db.orders.aggregate([
  { $match: { status: { $in: ['paid', 'shipped'] }, createdAt: { $gte: ISODate('2026-01-01'), $lt: ISODate('2027-01-01') } } },
  { $group: {
      _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);
// { _id: '2026-01', revenue: 2500, orders: 2 }, { _id: '2026-02', revenue: 2500, orders: 2 }
```

**Follow-ups:**
- Q: Why use a half-open date range? A: It avoids missing documents at boundaries.
- Q: What does `$merge` do? A: Writes aggregation output into a collection, inserting, replacing or merging, enabling incremental materialized views.

---

### Q-MONGO-15 | Advanced | [ESSENTIAL] | How do you optimize aggregation pipelines?

**Question:** An aggregation on a large collection is slow. What do you check?

**Interview answer:** I check the order and the index use. `$match` and `$sort` at the start of the pipeline can use indexes; once a stage like `$group`, `$project` that renames fields, `$unwind` or `$lookup` transforms documents, later stages cannot use the original indexes. So I filter as early as possible, project only needed fields early to reduce document size, and avoid unnecessary `$unwind` of large arrays. For `$lookup` I ensure an index on the foreign field and consider embedding or denormalizing data that is always read together. Each blocking stage such as `$group` or `$sort` without an index has a memory limit (100 MB per stage), and in MongoDB 6.0 and later stages can spill to disk by default; `allowDiskUse` controls this in older versions, but spilling is slow, so reduce data first. I use `explain` on the aggregation to see index usage, and for dashboards I precompute with `$merge` or maintain counters at write time. If a pipeline needs many joins, it is a signal the data model may need rethinking or the workload belongs in a relational database or analytics store.

**Hinglish explanation:** Pehle `$match`/`$sort` rakho taaki index use ho. Phir jo fields chahiye sirf wahi aage bhejo. `$lookup` ke liye foreign field par index. Agar pipeline me bahut saare joins ban rahe hain, to shayad data model galat hai ya ye kaam SQL/analytics ka hai.

**Follow-ups:**
- Q: How can I see which indexes the pipeline uses? A: `db.orders.explain('executionStats').aggregate([...])`.
- Q: Is a pipeline slower than computing in Node? A: Usually much faster since data does not leave the database; but heavy aggregations on production primaries can impact other traffic, so consider secondaries or analytics replicas.

---

### Q-MONGO-16 | Intermediate | [ESSENTIAL] | What is atomicity in MongoDB? Are single operations safe from races?

**Question:** What operations are atomic? How do you avoid read-modify-write races without a transaction?

**Interview answer:** In MongoDB a write operation on a single document is atomic, including changes to embedded documents and arrays, so concurrent operations on the same document do not interleave partially. Operators such as `$inc`, `$push` and `$set`, and methods such as `findOneAndUpdate`, perform the modification on the server in one atomic step, so I avoid the pattern of reading a document, changing it in application code, and writing it back, which is subject to lost updates. For conditional updates I put the condition in the filter (for instance `{ _id, stock: { $gte: qty } }`) and check `modifiedCount`. Operations spanning multiple documents are not atomic by default; they either need a multi-document transaction or a data model that keeps related data in one document. For optimistic concurrency I can add a `version` field and include it in the filter.

**Hinglish explanation:** Ek document par ek write atomic hai. Isliye data model aisa banao ki jo cheezein saath me badalni hain wo ek hi document me hon. Counter ya stock ke liye `$inc` aur filter me condition. Do alag documents ko ek saath badalna ho to transaction chahiye.

```js
const r = await products.findOneAndUpdate(
  { _id: 'KB', stock: { $gte: 1 } },
  { $inc: { stock: -1 } },
  { returnDocument: 'after' });
if (!r) throw new Error('Out of stock');          // driver v6+: returns the document or null
```

**Follow-ups:**
- Q: What changed in driver v6 for `findOneAndUpdate`? A: It returns the document directly (or `null`) instead of a `{ value }` wrapper; older versions need `result.value`.
- Q: Is `updateMany` atomic across documents? A: No; each document is updated atomically, but the whole `updateMany` is not one transaction.

---

### Q-MONGO-17 | Advanced | [ESSENTIAL] | Multi-document transactions in MongoDB: how, when, and the cost.

**Question:** Implement a transfer between two accounts in MongoDB. What are the requirements and trade-offs?

**Interview answer:** Multi-document ACID transactions are available since MongoDB 4.0 for replica sets and 4.2 for sharded clusters, so the deployment must be a replica set (even a single-node replica set for development). In Node, I start a session and use `session.withTransaction(callback)`, which retries transient errors, passing the session to every operation inside. Transactions use snapshot isolation, hold resources, have a default time limit of 60 seconds, and add overhead, so MongoDB recommends designing the schema so that most operations touch a single document, and using transactions only when you genuinely need atomicity across documents or collections. I keep them short, avoid external calls inside them, and handle `TransientTransactionError` and `UnknownTransactionCommitResult` through the retry logic. Reads inside the transaction use `readConcern: snapshot`, writes use `writeConcern: majority`.

**Hinglish explanation:** MongoDB me transaction ho sakta hai (replica set chahiye), par ye SQL jitna sasta nahi hai. Agar baar-baar multi-document transaction ki zaroorat pad rahi hai to data model par dobara socho. Jab zaroorat ho (paisa transfer), `withTransaction` use karo aur session har operation ko pass karo.

```js
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    const accounts = client.db('bank').collection('accounts');
    const from = await accounts.findOneAndUpdate(
      { _id: fromId, balanceCents: { $gte: amount } },
      { $inc: { balanceCents: -amount } },
      { session, returnDocument: 'after' });
    if (!from) throw new Error('Insufficient funds');             // aborts the transaction
    await accounts.updateOne({ _id: toId }, { $inc: { balanceCents: amount } }, { session });
  }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
} finally {
  await session.endSession();
}
```

**Follow-ups:**
- Q: Why must the session be passed to each operation? A: Otherwise the operation runs outside the transaction.
- Q: Can you run transactions on standalone `mongod`? A: No; it needs a replica set because transactions rely on the oplog.
- Q: Why prefer modeling over transactions? A: Single-document atomicity is fast and simple; transactions increase latency, locking and complexity.

---

### Q-MONGO-18 | Intermediate | [ESSENTIAL] | What is a replica set and how do failover and read preference work?

**Question:** Explain primary, secondaries, elections and read preferences.

**Interview answer:** A replica set is a group of MongoDB nodes holding the same data for high availability. One node is the primary and accepts all writes; secondaries replicate the primary's operations from its oplog (operations log). If the primary becomes unavailable, the remaining members hold an election and one secondary becomes the new primary, usually within seconds, which requires a majority of voting members, so deployments use an odd number of voting members (typically three). The driver discovers the topology, and with retryable writes it can transparently retry a failed write once after failover. Read preference determines where reads go: `primary` (default) gives the latest data; `secondary` or `secondaryPreferred` offloads reads but may return slightly stale data because of replication lag, which is a trade-off I accept only for read paths that tolerate staleness. Write concern and read concern control durability and consistency (Q-MONGO-19).

**Hinglish explanation:** Replica set = same data ke 3 copies (ek primary, do secondary). Primary band hua to baaki election karke naya primary chun lete hain. Secondary se padhne par data thoda purana ho sakta hai (replication lag), isliye critical reads primary se.

```js
const client = new MongoClient(process.env.MONGO_URL, {
  readPreference: 'primary',
  retryWrites: true,
  w: 'majority',
});
// connection string example: mongodb://h1,h2,h3/shop?replicaSet=rs0
```

**Follow-ups:**
- Q: Why an odd number of members? A: To always be able to form a majority for elections; an arbiter can break ties but holds no data.
- Q: What happens to writes during an election? A: They fail or wait briefly; retryable writes handle many cases, but the app should handle transient errors.

---

### Q-MONGO-19 | Advanced | [ADVANCED] | Write concern and read concern: durability and consistency settings.

**Question:** What do `w: 1`, `w: 'majority'` and `j: true` mean? Why does it matter for payments?

**Interview answer:** Write concern defines how many nodes must acknowledge a write before the server reports success. `w: 1` means only the primary acknowledged; if it fails before replicating, the write can be rolled back after failover. `w: 'majority'` waits until a majority of data-bearing voting members have the write, so it survives failover; MongoDB 5.0 and later default to majority in most cases. `j: true` requires the write to be journaled to disk. Read concern determines the consistency of reads: `local` returns the node's latest data (may later be rolled back), `majority` returns data acknowledged by a majority, and `snapshot` is used in transactions. For financial or critical data, I use `w: 'majority'` with journaling and read with `majority` where needed, accepting slightly higher latency in exchange for not losing acknowledged writes.

**Hinglish explanation:** Write concern = "kitne nodes ne likh liya tab success bolna". `w:1` fast hai par failover me data kho sakta hai. `majority` safe hai par thoda slow. Paisa ya order jaisi cheezon ke liye `majority`.

**Follow-ups:**
- Q: Is `w: 0` ever appropriate? A: Fire-and-forget for non-critical telemetry; the driver does not report errors.
- Q: How does this relate to SQL durability settings? A: Similar to `innodb_flush_log_at_trx_commit` and synchronous replication choices: trade latency for durability.

---

### Q-MONGO-20 | Advanced | [ADVANCED] | What is sharding and how do you choose a shard key?

**Question:** Explain sharding, what a shard key is, and what makes a bad shard key.

**Interview answer:** Sharding splits a large collection across multiple replica sets (shards) so storage and throughput can scale horizontally. A router (`mongos`) directs queries using metadata from config servers. The shard key, a field or compound of fields, determines how documents are partitioned into chunks. A good shard key has high cardinality, distributes writes evenly, and appears in most queries so they can be routed to a single shard (targeted queries) instead of all shards (scatter-gather). A monotonically increasing key such as a timestamp or an auto-increment `ObjectId` under range sharding creates a hot shard because all new writes go to the last chunk; hashed sharding spreads them but loses efficient range queries. A low-cardinality key such as `country` leads to jumbo chunks that cannot be split. Sharding adds operational complexity and the shard key is hard to change, so I first exhaust vertical scaling, indexing, caching and read replicas, and shard only when data or throughput requires it.

**Hinglish explanation:** Sharding = data ko kai machines me baant dena. Shard key decide karti hai kaun sa document kaha jayega. Achhi key: bahut alag-alag values, writes barabar baante, aur zyada queries me wahi key ho. `createdAt` jaisi badhti hui key hot shard banati hai. Sharding mehengi aur complex hai, isliye pehle simple upay (index, cache, replica) try karo.

**Follow-ups:**
- Q: What is a scatter-gather query? A: A query without the shard key that must be sent to every shard and merged, which is slow at scale.
- Q: Hashed vs ranged sharding? A: Hashed gives even distribution but poor range queries; ranged supports range queries but risks hot spots with monotonic keys.
- Q: Can you change the shard key later? A: Modern versions (5.0+) allow resharding and refining a key, but it is a heavy operation.

---


### Q-MONGO-21 | Intermediate | [ESSENTIAL] | Pagination in MongoDB: skip/limit vs range queries.

**Question:** How do you paginate efficiently? Why is `skip` slow for deep pages?

**Interview answer:** `skip(n).limit(m)` is simple, but MongoDB must walk past the skipped documents (index keys at least), so cost grows linearly with the offset, and pages can shift if documents are inserted or deleted between requests. Range-based (keyset) pagination remembers the last seen sort value and queries `find({ _id: { $lt: lastId } }).sort({ _id: -1 }).limit(20)`; because `ObjectId` values are roughly time-ordered, sorting by `_id` gives chronological order with an existing index. For sort by non-unique fields such as `createdAt`, I combine it with `_id` as a tiebreaker: `$or: [{ createdAt: { $lt: c } }, { createdAt: c, _id: { $lt: id } }]`, supported by a compound index on `(createdAt, _id)`. I cap the page size and return a `nextCursor`.

**Hinglish explanation:** `skip(100000)` ka matlab 1 lakh entries pehle guzaro, phir 20 do - slow. Range-based: "jo last `_id` dekha usse chhote wale 20 do". `_id` pe index pehle se hota hai, isliye fast. SQL ke keyset pagination jaisa hi idea.

```js
const limit = Math.min(Number(req.query.limit) || 20, 100);
const filter = req.query.cursor ? { _id: { $lt: new ObjectId(req.query.cursor) } } : {};
const docs = await orders.find(filter).sort({ _id: -1 }).limit(limit + 1).toArray();
const hasMore = docs.length > limit;
const items = docs.slice(0, limit);
res.json({ items, nextCursor: hasMore ? items.at(-1)._id : null });
```

**Follow-ups:**
- Q: How do you get a total count? A: `countDocuments(filter)` is accurate but scans matches; `estimatedDocumentCount()` is fast for the whole collection only.
- Q: Why validate the cursor? A: `new ObjectId(invalid)` throws; validate with `ObjectId.isValid` and return 400.

---

### Q-MONGO-22 | Intermediate | [ESSENTIAL] | Mongoose vs the native MongoDB driver: when do you use which?

**Question:** What does Mongoose add? What are its costs?

**Interview answer:** The native `mongodb` driver is a thin, fast layer exposing the full MongoDB API. Mongoose is an ODM (object-document mapper) that adds schemas, type casting, validation, defaults, middleware (hooks), virtuals, population (a convenient reference resolver), and a familiar model-based API; it gives structure to a flexible-schema database, which helps teams keep documents consistent. The costs are an extra abstraction layer, some performance overhead for creating full Mongoose documents (mitigated by `.lean()` for read-only queries), occasional surprises with casting and default behavior, and the need to learn its API. I use Mongoose when the team wants enforced structure and rapid development in an application with many models, and the native driver when I need maximum control, aggregation-heavy workloads or minimal overhead. In both cases I still need indexes, validation of request input and careful query design.

**Hinglish explanation:** Native driver = seedha MongoDB se baat. Mongoose = upar ek layer jo schema, validation, hooks deta hai. Fayda: structure aur convenience. Nuksan: thoda overhead aur extra seekhna. Read-only list queries me `.lean()` lagao taaki plain object mile.

```js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customerId: { type: Number, required: true, index: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'cancelled'], default: 'pending' },
  total: { type: Number, required: true, min: 0 },
  items: [{ sku: String, qty: { type: Number, min: 1 }, price: Number }],
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);

const list = await Order.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(20).lean();
```

**Follow-ups:**
- Q: Does Mongoose validation replace request validation? A: No; it validates on save, not on all update paths by default (`runValidators` is needed for updates); validate requests at the API boundary too.
- Q: What does `.lean()` do? A: Returns plain JavaScript objects instead of hydrated documents, faster and lighter, but without virtuals or methods.

---

### Q-MONGO-23 | Intermediate | [ESSENTIAL] | Mongoose populate: is it a join? What is the cost?

**Question:** How does `populate()` work and what performance problems can it cause?

**Interview answer:** `populate()` is not a database join. Mongoose runs the main query, collects the referenced ids, and then runs additional queries to fetch the referenced documents and stitches them into the result in application code. This is convenient but is effectively the N+1 style multi-query pattern, batched into one extra query per populated path. Populating many paths or deep nesting multiplies queries and memory use, and populated fields are not available for filtering in the main query. Alternatives are embedding or denormalizing the few fields that are always displayed, using `$lookup` in an aggregation when a database-side join is really needed, or selecting only required fields in `populate` (`select`) and using `lean()`.

**Hinglish explanation:** `populate` SQL ka JOIN nahi hai; Mongoose pehle main query chalata hai, phir referenced ids ki ek aur query, aur code me jod deta hai. Zyada fields populate karoge to queries aur memory badhegi. Zaroorat ke fields hi select karo ya data embed kar do.

```js
const orders = await Order.find({ status: 'paid' })
  .select('total customer createdAt')
  .populate({ path: 'customer', select: 'name city' })   // second query: customers by id
  .lean();
```

**Follow-ups:**
- Q: When prefer `$lookup`? A: When you need to filter or aggregate on joined data in the database.
- Q: How do you prevent unbounded populate? A: Limit the number of ids, paginate the parent query, and select only needed fields.

---

### Q-MONGO-24 | Intermediate | [ESSENTIAL] | How should a Node.js app manage MongoDB connections?

**Question:** Where do you create the client? What are the pool settings and common mistakes?

**Interview answer:** I create a single `MongoClient` (or one Mongoose connection) when the app starts, connect once, and reuse it across all requests; the driver maintains a connection pool internally, configured with options such as `maxPoolSize` (default 100) and `minPoolSize`. Creating a new client per request wastes connections and can exhaust the server's connection limit, and closing the client after each query defeats pooling. In serverless functions I cache the client in module scope so warm invocations reuse it, and keep pool sizes small because many instances multiply connections. I set `serverSelectionTimeoutMS` and `socketTimeoutMS`-style timeouts so failures surface quickly, handle connection errors at startup (fail fast), and close the client during graceful shutdown. Secrets in connection strings come from environment variables, and the database user has least privilege.

**Hinglish explanation:** Client ek baar banao, app start par connect, aur har request me wahi use karo. Har request me naya client banaya to connections khatam ho jayenge. Shutdown par `client.close()`. Serverless me client ko global variable me cache karo.

```js
// db.js
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL, {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000,
});
let connecting;
export function getDb() {
  connecting ??= client.connect();      // connect once, share the promise
  return connecting.then(() => client.db(process.env.MONGO_DB));
}
export const closeDb = () => client.close();
```

**Follow-ups:**
- Q: Does the driver reconnect automatically? A: Yes, it monitors the topology and reconnects; your code should still handle transient errors with retries on idempotent operations.
- Q: Why `??=` with a promise? A: Concurrent first callers share the same connection attempt instead of creating many.

---

### Q-MONGO-25 | Intermediate | [ESSENTIAL] | NoSQL injection: how does it happen in Node.js and how do you prevent it?

**Question:** A login handler does `users.findOne({ email: req.body.email, password: req.body.password })`. What is the vulnerability?

**Interview answer:** MongoDB queries are JavaScript objects, and Express parses JSON bodies into objects, so an attacker can send `{ "email": "admin@shop.com", "password": { "$ne": null } }`. The query then means "password not equal to null", which matches any user with a password, and authentication is bypassed. The same applies to query-string input parsed into objects (`?role[$ne]=x`). Prevention: validate input types strictly with a schema so that email and password must be strings, never pass raw `req.body` or `req.query` objects into queries, strip keys starting with `$` or containing dots (for example `express-mongo-sanitize`), and use proper password hashing, where the application fetches the user by email and then compares the password hash with bcrypt, instead of putting the password in the query at all. `$where` and server-side JavaScript evaluation should be disabled or avoided since they enable code injection.

**Hinglish explanation:** JSON me attacker `{"$ne": null}` bhej sakta hai aur query ka matlab badal jata hai. Isliye type check zaroori: email/password sirf string hone chahiye. Aur password query me daalna hi galat hai: email se user nikalo, phir bcrypt se hash compare karo.

```js
import { z } from 'zod';
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(72) }).strict();

app.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);       // objects like {$ne:null} are rejected
  const user = await users.findOne({ email });                    // value is a string, not an operator object
  const ok = user && await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  // issue token ...
});
```

**Follow-ups:**
- Q: Is Mongoose safe? A: Casting to schema types helps (a string field will reject objects in most cases), but `strictQuery`, `sanitizeFilter` and validation at the boundary are still advised.
- Q: What is Mongoose `sanitizeFilter`? A: An option that wraps query operators from user input so they are treated as literal values.

---

### Q-MONGO-26 | Intermediate | [ESSENTIAL] | Prevent duplicates and handle duplicate-key errors (E11000).

**Question:** How do you ensure unique emails or idempotent operations in MongoDB?

**Interview answer:** I create a unique index on the field (or compound fields such as `{ userId, idempotencyKey }`), and then rely on the database to reject duplicates: a concurrent duplicate insert fails with error code 11000, which I catch and translate into HTTP 409 or into returning the existing resource. A check-then-insert in application code is a race condition, because two requests can both pass the check. For idempotent payment-like endpoints I store the key with the result in a collection with a unique index and, optionally, a TTL to expire old keys. Upserts with a unique index are also race-safe: the loser of the race gets a duplicate-key error and can retry the update.

**Hinglish explanation:** "Pehle find karke check karo phir insert" galat hai (race). DB me unique index lagao; duplicate aaya to `E11000` error milega, usko 409 me badal do. Idempotency key ke liye bhi yahi trick: key par unique index.

```js
await db.collection('users').createIndex({ email: 1 }, { unique: true });

try {
  await db.collection('users').insertOne({ email: email.toLowerCase(), passwordHash });
} catch (err) {
  if (err.code === 11000) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered');
  throw err;
}
```

**Follow-ups:**
- Q: Case-insensitive uniqueness? A: Store a normalized lowercase field or use a collation on the index.
- Q: Where is the duplicate key info? A: `err.keyPattern` and `err.keyValue` tell which index and value conflicted; do not echo sensitive values to clients.

---

### Q-MONGO-27 | Advanced | [ADVANCED] | Schema validation and schema evolution in a flexible-schema database.

**Question:** How do you keep documents consistent, and how do you evolve the schema safely?

**Interview answer:** Flexible schema does not mean no schema. I enforce rules at the API with request validation, in the ODM with Mongoose schemas, and in the database with `$jsonSchema` validators on the collection (`validationLevel` and `validationAction` control strictness and whether to error or warn). For evolution, I make changes backward compatible: new fields are optional with defaults in code, and readers tolerate missing fields. Where a structural change is needed I use a `schemaVersion` field on documents, and either migrate lazily (upgrade a document when it is read or written) or run a batched background migration with idempotent scripts, testing on a copy first. I avoid large `updateMany` operations during peak traffic and monitor replication lag when running migrations. Index changes are built in the background by default in modern versions but still consume resources.

**Hinglish explanation:** "Schemaless" ka matlab ye nahi ki kuch bhi chalega. Validation 3 jagah: API, Mongoose, aur DB ka `$jsonSchema`. Naye field ke liye purane documents ko todna nahi: optional rakho. Bade structure change ke liye `schemaVersion` field aur batch migration (idempotent script).

```js
await db.createCollection('orders', {
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['customerId', 'status', 'total'],
    properties: {
      status: { enum: ['pending', 'paid', 'shipped', 'cancelled'] },
      total:  { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0 },
      schemaVersion: { bsonType: 'int' },
    },
  } },
  validationLevel: 'strict',
  validationAction: 'error',
});
```

**Follow-ups:**
- Q: What happens to existing invalid documents when adding a validator? A: With `validationLevel: 'moderate'` existing invalid documents are not checked until updated; `strict` validates all inserts and updates.
- Q: Why make migrations idempotent? A: They may be interrupted and re-run; each step should be safe to apply twice.

---

### Q-MONGO-28 | Intermediate | [ESSENTIAL] | Scenario: choose a database for a marketplace (products, orders, payments, chat).

**Question:** For a marketplace app, would you use MySQL, MongoDB, or both? Justify each part.

**Interview answer:** I would use MySQL as the system of record for orders, payments, inventory and user accounts, because these need strong constraints, multi-row ACID transactions, relational integrity and flexible reporting. The product catalog, where sellers add different attributes per category (electronics versus clothing), is a good fit for documents in MongoDB, or JSON columns in MySQL if the team wants a single database, and search would eventually use a dedicated search engine. Chat messages and activity logs are high-volume append-heavy data that fit MongoDB or a specialized store. Using two databases introduces operational cost and consistency challenges across stores, so I start with the simplest option that meets requirements: for a small team, MySQL alone with a JSON column for variable attributes is often enough, and I add MongoDB only when the access patterns justify it. Cross-store consistency is handled with events and eventual consistency, not distributed transactions.

**Hinglish explanation:** Paisa aur orders = MySQL (transactions, constraints). Alag-alag attributes wala catalog aur chat/log = MongoDB ya JSON column. Do database rakhna operational bojh hai, isliye chhoti team me "ek database + JSON column" se shuru karna samajhdari hai. Interview me trade-off bolna important hai.

**Follow-ups:**
- Q: How do you keep MySQL and MongoDB in sync? A: Publish events (outbox pattern) and update the other store asynchronously; accept eventual consistency and design idempotent consumers.
- Q: Can MySQL handle JSON? A: Yes, a `JSON` type with functions and generated columns that can be indexed.

---

### Q-MONGO-29 | Advanced | [ADVANCED] | Common MongoDB design patterns: bucket, computed, subset and outbox.

**Question:** Name patterns that solve common MongoDB modeling problems and when you would use them.

**Interview answer:** The bucket pattern groups many small related documents, such as sensor readings or chat messages per hour, into one document with an array of entries, reducing document count and index size. The computed pattern stores precomputed values, such as an order count or average rating, updated at write time with `$inc` or by a background job, trading some write cost for fast reads. The subset pattern keeps only the most frequently needed part of a large related set inside the main document, such as the latest 10 reviews inside a product, while the rest lives in a separate collection. The extended reference pattern copies a few stable fields from a referenced document to avoid `$lookup`. The outbox pattern writes an event into an outbox collection in the same transaction (or same document update) as the business change so a separate process can publish it reliably to a queue. Each pattern trades duplication and write complexity for read speed, so I apply them only to demonstrated access-pattern needs.

**Hinglish explanation:** Patterns = common problems ke ready solutions. Bucket = bahut saare chhote records ek document me batch. Computed = pehle se count/average nikal ke rakho. Subset = sirf latest 10 reviews product me. Outbox = DB change aur event ek saath save, phir alag process queue me bheje.

**Follow-ups:**
- Q: Downside of computed values? A: They can drift if updates fail; reconcile periodically with an aggregation.
- Q: What are change streams? A: A way to subscribe to real-time changes in a collection (requires a replica set), useful for syncing, cache invalidation and event publishing.

---

### Q-MONGO-30 | Intermediate | [ESSENTIAL] | Common MongoDB mistakes in Node.js applications.

**Question:** What mistakes do you commonly see in code reviews of Node and MongoDB projects?

**Interview answer:** First, string versus `ObjectId` mismatches: querying `{ _id: req.params.id }` with a string does not match an `ObjectId`, so convert after validating. Second, missing indexes, causing collection scans that look fine on small data and fail in production. Third, unbounded queries: `find({}).toArray()` without a filter, projection or limit loads the entire collection into memory. Fourth, unbounded growth of embedded arrays and oversized documents. Fifth, creating a client per request or not closing it on shutdown. Sixth, trusting input shapes (operator injection) and mass assignment by passing `req.body` directly into `insertOne` or `$set`. Seventh, read-modify-write in application code instead of atomic operators, causing lost updates. Eighth, forgetting error handling for duplicate keys and transient errors, or running multi-document logic without transactions where atomicity is required. Finally, using floating-point numbers for money instead of integers or `Decimal128`.

**Hinglish explanation:** Ye checklist interview aur real kaam dono me kaam aati hai: id ko ObjectId me convert karo, index lagao, har query me limit/projection, array ko badhne se roko, client ek baar banao, input validate karo, atomic operators use karo, duplicate key error handle karo, aur paisa float me mat rakho.

```js
// typical fixes in one place
const id = ObjectId.isValid(req.params.id) ? new ObjectId(req.params.id) : null;
if (!id) return res.status(400).json({ error: { code: 'BAD_ID', message: 'Invalid id' } });

const allowed = (({ title, price }) => ({ title, price }))(req.body);       // no mass assignment
const result = await products.updateOne({ _id: id }, { $set: allowed });
if (result.matchedCount === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
```

**Follow-ups:**
- Q: How do you spot missing indexes before production? A: Load test with realistic data volumes, run `explain` on key queries, and review slow query logs or Atlas Performance Advisor.
- Q: Why is `Decimal128` special for money? A: It stores exact decimal values without binary floating point errors, but needs careful handling in Node (it is not a JavaScript number).

---

## Self-test prompts for this file

Attempt these from memory before moving to the exercises in `11_Coding_Exercises.md`. The model answers are in the referenced questions.

1. In 90 seconds, explain how an `await` inside a `for` loop differs from `Promise.all` for 10 independent database calls (Q-JS-19, Q-JS-24).
2. Draw the Node event loop phases and place `setTimeout`, `setImmediate`, `process.nextTick` and a resolved promise on it (Q-NODE-05, Q-NODE-08).
3. Explain, using one example, why `req.body` can be `undefined` in Express 5 (Q-EXP-09, Q-EXP-27).
4. Write the query for "latest order per customer" and "customers with no orders" without looking (Q-SQL-05, Q-SQL-14).
5. Explain why an index on `(customer_id, status, created_at)` serves two different queries (Q-SQL-21).
6. Describe one race condition in MySQL and one in MongoDB and the atomic fix for each (Q-SQL-33, Q-MONGO-16).
7. Explain NoSQL injection and the fix for the login query (Q-MONGO-25).

