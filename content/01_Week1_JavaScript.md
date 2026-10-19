# Week 1 - JavaScript for Backend (Days 1-7)

Part of the Node.js Backend Interview Preparation set. Master TOC and the full 56-day plan live in
`00_Master_Strategy_Schedule.md`. This file contains the complete Week 1 notes, daily wrap-ups, and the
weekly test with answer key.

Days in this file: Day 1 to Day 7 (global day numbers 1-7). Budget: about 2 hours per day, 14 hours total.

---

## Table of contents (Week 1)

- [How to use this file](#how-to-use-this-file)
- [Day 1 - Execution context, call stack, scope, closures, hoisting, lexical environment](#day-1---execution-context-call-stack-scope-closures-hoisting-lexical-environment)
- [Day 2 - this, prototypes, prototypal inheritance](#day-2---this-prototypes-prototypal-inheritance)
- [Day 3 - Objects, arrays, references](#day-3---objects-arrays-references)
- [Day 4 - Promises, chaining, async/await, error propagation](#day-4---promises-chaining-asyncawait-error-propagation)
- [Day 5 - Event loop, microtasks vs macrotasks](#day-5---event-loop-microtasks-vs-macrotasks)
- [Day 6 - Promise combinators and common async mistakes](#day-6---promise-combinators-and-common-async-mistakes)
- [Day 7 - Revision and weekly test](#day-7---revision-and-weekly-test)
  - [Week 1 revision summary](#week-1-revision-summary)
  - [Weekly assessment](#weekly-assessment)
  - [Answers with explanations](#answers-with-explanations)
  - [Weak-area identification guidance](#weak-area-identification-guidance)
  - [Catch-up plan](#catch-up-plan-if-you-fall-behind)

---

## How to use this file

**Why JavaScript first?** Tum frontend developer ho, JS roz likhte ho. Lekin backend interviews mein
interviewer JS ke "andar ka kaam" poochta hai: closures, `this`, prototypes, event loop, promise ordering.
Node.js ek single-threaded event-loop runtime hai, isliye agar async JS ka model clear nahi hai to Week 2
(Node internals) samajh nahi aayega. Week 1 poori foundation hai.

**Tier markers used in this file**

- `[ESSENTIAL]` -- asked in most junior-to-mid interviews. Master these first.
- `[ADVANCED]` -- supplementary. Read after the essentials; skip if you are short on time.

**Conventions**

- All code is ES modules (`import`/`export`), Node.js 22 LTS. Where Node 20 differs, it is flagged.
- To run any snippet: save as `demo.mjs` (or use `"type": "module"` in `package.json`) and run
  `node demo.mjs`. Several snippets need `await` at top level, which works in ES modules.
- **Output-prediction questions:** cover the answer, predict on paper, then expand the answer. Always run the
  code afterwards to confirm. Prediction before running is the whole point.
- **Coding exercises:** problem first, solution hidden inside a `<details>` block. Attempt for 10-15 minutes
  before peeking.
- Interview answers are written in professional English and labelled `**Interview answer:**`. Say them
  in your own words after reading; do not memorise word for word.

**Honest expectation:** Week 1 will make your JS answers sharp. It will not by itself make you a backend
engineer. Treat it as the base layer for Weeks 2-8.

**Suggested 2-hour rhythm for every day (Days 1-6)**

| Block | Minutes | Activity |
|-------|---------|----------|
| 1 | 40 | Read the day's notes, run every example |
| 2 | 30 | Output-prediction questions (predict first, then verify) |
| 3 | 30 | Coding exercises / practical task |
| 4 | 10 | Revise the five questions aloud as if in an interview |
| 5 | 10 | Self-assessment checklist + note weak spots |

---

## Day 1 - Execution context, call stack, scope, closures, hoisting, lexical environment

**Learning objectives**

By the end of Day 1 you should be able to:

1. Explain what an execution context is and how the call stack uses it, with a hand-traced example.
2. Explain the two phases of running code (creation and execution) and use them to predict hoisting behavior.
3. Describe the scope chain and lexical environment, and say why `let`/`const` have a temporal dead zone.
4. Define a closure precisely (function + reference to its lexical environment), and write 3 practical closures.
5. Predict the output of classic `var` vs `let` loop and hoisting questions without running code.
6. Connect closures to Node patterns: middleware factories, dependency injection, per-instance state.

**Time plan (about 2 hours):** Topic 1.1 (20 min), 1.2 (20 min), 1.3 (15 min), 1.4 (30 min), prediction
questions (20 min), exercises (15 min).

---

### Topic 1.1 - Execution context and call stack [ESSENTIAL]

**Concept**

Jab bhi JS code run hota hai, engine (V8) ek **execution context** banata hai. Context ek "environment
packet" hai jisme yeh cheezein hoti hain:

- Variable bindings (kaunsa naam kis value se bandha hai)
- `this` binding
- Ek reference **outer environment** ki (scope chain isi se banti hai)

Teen type ke contexts hote hain: **global/module context**, **function context** (har function call pe
naya), aur `eval` context (ignore it). **Call stack** ek LIFO (last in, first out) stack hai jisme active
execution contexts rakhe jaate hain. Jo function abhi chal raha hai, woh top pe hai.

**Why it matters in backend**

- Stack overflow (`RangeError: Maximum call stack size exceeded`) production mein real bug hai, jaise deeply
  nested user-supplied JSON ya galat recursion pe.
- Error stack traces (jo logs mein aate hain) literally call stack ka snapshot hote hain. Unhe padhna debugging
  ka base skill hai.
- Event loop (Day 5) ka core rule hai: "call stack khaali ho tabhi queued callbacks chalte hain". Agar stack
  busy hai to poora server freeze.

**Internal working**

Har context do phases se guzarta hai:

1. **Creation phase:** engine code ko scan karta hai aur bindings banata hai, bina code chalaye.
   - `var` declarations -> binding banti hai, value `undefined`.
   - Function declarations -> binding banti hai aur **poora function object** already attach hota hai.
   - `let` / `const` / `class` -> binding banti hai lekin **uninitialized** (temporal dead zone, TDZ).
2. **Execution phase:** code line by line chalta hai, assignments hote hain, functions call hote hain.

Stack ka trace dekho:

```js
// stack-trace.mjs
function a() {
  b();
}
function b() {
  c();
}
function c() {
  console.trace("inside c"); // prints the current call stack
}
a();
```

Stack ka growth/shrink (neeche se upar):

```text
step 1: [module]
step 2: [module, a]
step 3: [module, a, b]
step 4: [module, a, b, c]
step 5: [module, a, b, c, console.trace]   -> prints stack, then pops
step 6: c returns -> [module, a, b]
step 7: b returns -> [module, a]
step 8: a returns -> [module]
```

`console.trace` ka output kuch aisa dikhega (paths tumhare machine ke honge):

```text
Trace: inside c
    at c (file:///.../stack-trace.mjs:8:11)
    at b (file:///.../stack-trace.mjs:5:3)
    at a (file:///.../stack-trace.mjs:2:3)
    at file:///.../stack-trace.mjs:10:1
```

Neeche se upar padho: module ne `a` ko bulaya, `a` ne `b` ko, `b` ne `c` ko.

**Stack overflow:** stack ki size limited hoti hai (V8 ka default roughly 1 MB, yaani aam taur pe 10-12 hazaar
simple frames; exact number machine/version pe depend karta hai).

```js
// overflow.mjs
let depth = 0;
function recurse() {
  depth++;
  recurse(); // no base case
}
try {
  recurse();
} catch (err) {
  console.log(err instanceof RangeError); // true
  console.log(err.message);               // Maximum call stack size exceeded
  console.log(depth > 1000);              // true (exact depth varies)
}
```

**Frontend connection**

Browser DevTools ke "Call Stack" panel mein jo tum breakpoint pe dekhte ho, wahi cheez hai. React mein
"Maximum call stack size exceeded" tab aata tha jab `setState` render ke andar infinite loop mein chala jaata
tha. Backend mein same concept hai, bas browser ki jagah Node process.

**Real-world scenario**

Ek marketplace API category tree (categories -> subcategories) ko recursion se flatten karti hai. Ek buggy
admin data mein category ka parent khud ban gaya (cycle). Recursive function infinite chali, stack overflow
hua, aur wo request handler uncaught exception ke saath process ko crash kar sakta hai (agar async path mein
ho). Fix: visited-set se cycle detect karo ya iterative approach (explicit stack/queue) use karo.

**Interview answer:**

"An execution context is the environment in which JavaScript code is evaluated. It holds the variable
bindings, the value of `this`, and a reference to its outer environment. Each function call creates a new
context, and the engine tracks active contexts on the call stack, which is last-in-first-out. A context is
created in two phases: a creation phase where bindings are set up, which is why hoisting exists, and an
execution phase where code runs line by line. If the stack grows past the engine's limit, usually due to
unbounded recursion, V8 throws a RangeError for maximum call stack size."

**Follow-up questions**

1. *Is JavaScript single-threaded? Then how does Node handle many requests?*
   JS code runs on one thread with one call stack, so only one piece of JS executes at a time. Concurrency
   comes from the event loop plus the OS and thread pool doing I/O outside JS. Details: Day 5 and Week 2.
2. *Can you increase the stack size?*
   `node --stack-size=...` exists but is risky (can segfault because the real OS thread stack is smaller). The
   right fix is to remove deep recursion (iteration, trampolining, or explicit stack).
3. *Does `async/await` have its own stack?*
   After an `await`, the function is suspended and its frame is removed from the stack. When resumed, it runs
   from the microtask queue on a fresh stack. V8 reconstructs "async stack traces" (`at async fnName`) for
   debugging, but the real stack is shallow at that point.
4. *What is tail-call optimization in Node?*
   ES2015 specified it, but V8 does not implement it. Do not rely on it.

**Common mistakes**

- Assuming recursion is "free". Every call costs a frame.
- Catching stack overflow and continuing as if state is consistent (state may be half-updated).
- Thinking `setTimeout(fn, 0)` runs `fn` immediately. It runs after the stack is empty (Day 5).

**Revision notes**

- Context = bindings + `this` + outer reference. New context per function call.
- Two phases: creation (hoisting happens here), execution.
- Call stack is LIFO; stack traces are snapshots of it; overflow -> `RangeError`.
- No tail-call optimization in V8.

---

### Topic 1.2 - Scope and lexical environment [ESSENTIAL]

**Concept**

**Scope** = "yeh variable kahan-kahan se dikhta hai". JS mein **lexical (static) scoping** hoti hai: scope is
decided by *where you wrote the code*, not by where the function is called from.

Scope ke types:

| Scope | Created by | Declarations visible |
|-------|-----------|----------------------|
| Global | the script / runtime | everything declared in the global environment |
| Module | each ES module / each CommonJS file | top-level declarations of that file only |
| Function | every function | `var`, `let`, `const`, params |
| Block | `{ }` of if/for/while/standalone block | `let`, `const`, `class` (and `var` ignores blocks) |

**Lexical environment** is the specification term for the actual data structure: an **environment record**
(the map of names to values) plus an **outer** reference to the parent lexical environment. Variable lookup
walks the chain: current environment -> outer -> outer -> ... -> global. First match wins. If nothing is
found, `ReferenceError`.

**Why it matters in backend**

- Node modules: har file ka apna **module scope** hota hai. Tumhara top-level `const db = ...` kisi doosri
  file ko leak nahi hota. (CommonJS mein Node file ko ek function mein wrap karta hai: `function (exports,
  require, module, __filename, __dirname) { ... }`. ES modules ka apna module scope hota hai.)
- Config, DB pool, logger jaisi cheezein module scope mein rakhna ek singleton pattern hai, jo closures par
  based hai.
- Accidental globals (`x = 5` without declaration) sloppy mode mein global bana deti hain. ES modules strict
  hote hain, wahan `ReferenceError`.

**Internal working**

```js
// scope-chain.mjs
const appName = "payments";          // module scope

function outer() {
  const region = "ap-south-1";       // outer's function scope
  function inner() {
    const txnId = "T-100";           // inner's function scope
    console.log(appName, region, txnId); // lookup walks: inner -> outer -> module
  }
  inner();
}
outer();
```

Environment chain jab `inner` chal raha hai:

```text
inner env  { txnId }  --outer-->  outer env { region, inner }  --outer-->  module env { appName, outer }  --> global
```

**Lexical, not dynamic:**

```js
const label = "global-label";
function show() {
  console.log(label);
}
function run() {
  const label = "local-label";
  show(); // prints "global-label" -- show's scope was fixed where it was WRITTEN
}
run();
```

`show` ke andar `label` ki lookup `show` ke likhe jaane wali jagah se hoti hai (module scope), `run` ke
andar se nahi.

**`var` vs `let`/`const`**

| | `var` | `let` | `const` |
|---|-------|-------|---------|
| Scope | function | block | block |
| Hoisted | yes, initialised to `undefined` | yes, but in TDZ | yes, but in TDZ |
| Re-declare in same scope | allowed | SyntaxError | SyntaxError |
| Reassign | yes | yes | no (binding is constant; object contents can still change) |
| Becomes global object property (script scope in browsers) | yes | no | no |

Modern practice: default `const`, use `let` when you must reassign, avoid `var`.

**Shadowing:** inner scope mein same naam ka variable bahar wale ko "chhupa" deta hai. Legal, lekin confusing.
```js
const x = "outer";
{
  const x = "inner"; // shadows, does not modify
  console.log(x);    // inner
}
console.log(x);      // outer
```

**Frontend connection**

React component function ke andar declared variables har render pe naye bante hain (function scope), aur
event handlers un par close karte hain. Block-scoped `let` in `for` loops wahi reason hai jisse
`onClick={() => handle(i)}` loop mein sahi `i` pakadta hai.

**Real-world scenario**

Ek banking service mein `const FEE_RATE = 0.02` module scope mein hai. Ek function ke andar developer ne
galti se `const FEE_RATE = 0.2` shadow kar diya, aur sirf us branch mein fee 10 guna ho gayi. Linter rule
`no-shadow` aise bugs pakadta hai.

**Interview answer:**

"JavaScript uses lexical scoping: the scope of a variable is determined by where it is declared in the source
code. Internally, each scope is a lexical environment, which is an environment record holding the bindings plus
a reference to the outer environment. When the engine resolves an identifier it walks this chain outward until
it finds a match, otherwise it throws a ReferenceError. `var` is function-scoped, while `let` and `const` are
block-scoped and sit in the temporal dead zone until their declaration is evaluated. In Node, each module has
its own scope, so top-level variables do not leak globally."

**Follow-up questions**

1. *What is the temporal dead zone?*
   The period between entering a scope (when the `let`/`const`/`class` binding is created) and the line where
   it is initialised. Accessing it throws `ReferenceError`. It exists to catch use-before-define bugs.
2. *Is `const` immutable?*
   No. The binding cannot be reassigned, but the object it points to can be mutated. Use `Object.freeze` for
   shallow immutability (Day 3).
3. *Does `typeof` protect you from TDZ?*
   No. `typeof undeclaredName` returns `"undefined"`, but `typeof tdzVariable` throws `ReferenceError`.
4. *Where do top-level variables live in a Node file?*
   In the module scope (CommonJS: function wrapper scope; ESM: module environment). They are not properties
   of `globalThis`.

**Common mistakes**

- Using `var` in loops and getting the shared-binding bug (see closures section).
- Believing `const` makes objects deep-immutable.
- Accidentally creating globals by forgetting a declaration (strict mode/ESM turns this into an error).
- Shadowing names like `err`, `data`, `id` in nested callbacks and fixing the wrong variable.

**Revision notes**

- Lexical scoping: decided by code position.
- Lexical environment = record + outer pointer. Lookup walks outward.
- `var` function-scoped; `let`/`const` block-scoped with TDZ.
- Each Node module has its own scope.

---

### Topic 1.3 - Hoisting [ESSENTIAL]

**Concept**

Hoisting ka matlab code literally upar move nahi hota. Creation phase mein declarations pehle se register ho
jaati hain, isliye unhe declaration line se **pehle** access karne par alag-alag behavior milta hai.

| Declaration | Before its line runs |
|-------------|----------------------|
| `var x` | exists, value `undefined` |
| `function f(){}` declaration | exists, fully usable (hoisted with body) |
| `const f = function(){}` / arrow | binding is `let/const` -> TDZ; for `var f = ...` it is `undefined` (calling -> `TypeError: f is not a function`) |
| `let` / `const` | TDZ -> `ReferenceError` |
| `class C {}` | TDZ -> `ReferenceError` |
| `import` | hoisted; imports are evaluated before the module body |

**Why it matters in backend**

- Interviewers use hoisting as a quick probe of whether you understand creation vs execution phase.
- Real bug source: calling a helper defined as `const helper = () => {}` below the route that uses it, at
  module load time, throws `ReferenceError`.
- Import hoisting matters for startup order: all `import`s of a module (and their side effects) run before
  your top-level code. Example: `dotenv` must be loaded before modules that read `process.env` at import time
  (use `import "dotenv/config"` as the first import, or Node 20.6+ `--env-file`).

**Internal working**

```js
// hoisting.mjs
console.log(typeof greet);   // "function"  (declaration fully hoisted)
console.log(typeof helper);  // "undefined" (var hoisted as undefined)
// console.log(arrow);       // would throw ReferenceError (TDZ)

function greet() { return "hi"; }
var helper = function () { return "help"; };
const arrow = () => "arrow";
```

Engine ne creation phase mein yeh table banayi:

```text
greet  -> function object (ready)
helper -> undefined
arrow  -> <uninitialized>  (TDZ)
```

**Function declaration vs expression priority:** agar `var` aur function declaration ka same naam ho, function
declaration jeet jaata hai creation phase mein, phir `var` ki assignment execution phase mein overwrite kar
sakti hai.

```js
function demo() {
  console.log(typeof dup); // "function"
  var dup = 10;
  function dup() {}
  console.log(typeof dup); // "number"
}
demo();
```

Note: yeh example function ke andar rakha hai. ES module ke **top level** pe `var dup` aur `function dup` ek saath
likhne par `SyntaxError: Identifier 'dup' has already been declared` aata hai, kyunki module top-level pe
function declarations lexical declarations ki tarah treat hoti hain.

**Frontend connection**

Component ke neeche defined helper function declaration upar ke JSX mein use ho sakta hai (hoisted), lekin
neeche defined `const handleClick = () => {}` ko upar use karoge to TDZ error. Wahi rule.

**Real-world scenario**

Ek `routes.js` file mein developer ne `const authMiddleware = ...` file ke end mein likha aur
`router.use(authMiddleware)` upar kar diya. Server startup pe `ReferenceError: Cannot access 'authMiddleware'
before initialization`. Fix: define before use, ya function declaration use karo.

**Interview answer:**

"Hoisting is a consequence of how execution contexts are created. In the creation phase the engine registers
declarations before running any code. `var` bindings are initialised to undefined, function declarations are
initialised with their full function object, and `let`, `const` and `class` bindings are created but left
uninitialised, so accessing them before the declaration throws a ReferenceError due to the temporal dead zone.
So nothing is physically moved; the bindings simply exist earlier than the line that declares them."

**Follow-up questions**

1. *Are `let` and `const` hoisted?* Yes, bindings are created at scope entry, but they are not initialised, so
   they cannot be accessed until the declaration executes. That is exactly why TDZ exists; if they were not
   hoisted, an outer variable with the same name would be silently read instead of erroring.
2. *Why does `var f = function(){}` then `f()` above it give TypeError, not ReferenceError?* Because `f`
   exists with value `undefined`; calling `undefined` is a TypeError.
3. *Are function declarations inside blocks hoisted?* In sloppy mode behavior is legacy and inconsistent
   (Annex B). In strict mode/ES modules, a function declaration in a block is block scoped. Avoid it.

**Common mistakes**

- Saying "hoisting moves code to the top". Incorrect mental model.
- Saying `let`/`const` are not hoisted.
- Relying on hoisting for readability instead of defining before use.

**Revision notes**

- `var` -> `undefined`; function declaration -> usable; `let/const/class` -> TDZ; function expressions follow
  the variable keyword used.
- Imports are hoisted and run first.

---

### Topic 1.4 - Closures [ESSENTIAL]

**Concept**

**Closure** = ek function **plus** uske lexical environment ka reference. Matlab inner function apne bahar wale
function ke variables ko tab bhi use kar sakta hai jab bahar wala function khatam ho chuka ho. Closure values
ki copy nahi rakhta, balki **live variable (binding) ka reference** rakhta hai.

```js
// closure-basic.mjs
function makeCounter() {
  let count = 0;                 // lives in makeCounter's environment
  return {
    inc: () => ++count,          // these functions close over `count`
    get: () => count,
  };
}
const c = makeCounter();
c.inc();
c.inc();
console.log(c.get()); // 2
// `count` is not accessible directly: private state without classes
```

`makeCounter` return ho chuka, uska stack frame pop ho gaya, lekin `count` zinda hai kyunki `inc`/`get` uske
environment ko reference kar rahe hain. Garbage collector tab tak nahi hatata jab tak closure reachable hai.

**Why it matters in backend**

Closures backend code ka daily tool hain:

1. **Middleware factories:** `rateLimit({ max: 100 })` ek function return karta hai jo `max` aur internal
   `Map` ko closure se yaad rakhta hai.
2. **Dependency injection:** `createUserService(db, logger)` returns functions that use `db`/`logger`.
3. **Callbacks:** har async callback ek closure hai jo request-specific variables (`req.id`, `userId`) yaad
   rakhta hai.
4. **Memoization/caching, once, debounce, throttle, private state.**
5. **Memory leaks:** closures accidentally badi objects ko zinda rakh sakte hain.

**Internal working**

Jab function **banta** hai (not when called), engine uski `[[Environment]]` internal slot mein current lexical
environment save kar leta hai. Jab function call hota hai, naya environment banta hai jiska `outer` pointer
`[[Environment]]` hota hai. Yahi chain closure ko outer variables tak pahunchati hai.

```text
makeCounter() call  -> env E1 { count: 0 }
inc created         -> inc.[[Environment]] = E1
makeCounter returns -> E1 survives, because inc and get point to it
c.inc() call        -> env E2 { } --outer--> E1 -> finds `count` in E1
```

**The classic loop bug**

```js
// loop-var.mjs
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 0);
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 0);
}
// var: 3, var: 3, var: 3   (one shared function-scoped `i`, loop ended with i = 3)
// let: 0, let: 1, let: 2   (each iteration gets its own `j` binding)
```

`let` loop mein spec har iteration ke liye **naya environment** banata hai aur value copy karta hai, isliye
har closure apni alag `j` pakadta hai.

**Practical closure patterns (runnable)**

```js
// patterns.mjs

// 1) once: run fn only the first time
export function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

// 2) memoize for single-argument pure functions
export function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (cache.has(arg)) return cache.get(arg);
    const value = fn(arg);
    cache.set(arg, value);
    return value;
  };
}

// 3) fixed-window rate limiter factory (middleware-style, framework independent)
export function createRateLimiter({ max, windowMs }) {
  const hits = new Map(); // key -> { count, resetAt } ; private to this limiter
  return function check(key, now = Date.now()) {
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: max - 1 };
    }
    if (entry.count >= max) {
      return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
    }
    entry.count++;
    return { allowed: true, remaining: max - entry.count };
  };
}

// demo
const limiter = createRateLimiter({ max: 2, windowMs: 1000 });
console.log(limiter("ip1", 0));    // { allowed: true, remaining: 1 }
console.log(limiter("ip1", 10));   // { allowed: true, remaining: 0 }
console.log(limiter("ip1", 20));   // { allowed: false, remaining: 0, retryAfterMs: 980 }
console.log(limiter("ip1", 1001)); // { allowed: true, remaining: 1 } (window reset)

const slowSquare = memoize((n) => { console.log("computing", n); return n * n; });
console.log(slowSquare(4)); // computing 4 -> 16
console.log(slowSquare(4)); // 16 (cached, no "computing")
```

Note: yeh rate limiter in-memory hai, isliye multiple server instances ke across kaam nahi karega. Production
version Redis use karta hai (Week 6 and Week 7).

**Closures and memory** [ADVANCED]

```js
// leak-risk.mjs
function handler() {
  const hugeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50 MB
  const summary = hugeBuffer.length;
  return () => summary; // only `summary` is used by this closure
}
```

V8 sirf unhi variables ko closure context mein rakhta hai jo kisi inner function mein use hote hain, isliye
yahan `hugeBuffer` collect ho sakta hai. Lekin agar **same scope mein dusra inner function** `hugeBuffer` use
karta ho (ya `eval` ho), to sab closures us context ko share karte hain aur ek closure bhi zinda raha to
`hugeBuffer` bhi zinda rahega. Rule of thumb: long-lived callbacks (event listeners, cache entries, timers) mein
badi objects capture mat karo. Memory leaks ki detail Week 2 / Day 6 aur Week 6 mein.

**Frontend connection**

React hooks closures par chalte hain. **Stale closure** bug: `useEffect(() => { setInterval(() => console.log(count), 1000) }, [])`
hamesha purana `count` print karta hai kyunki callback ne pehle render ka `count` pakda tha. Backend mein same
cheez: ek long-lived callback jo purane config/state ko capture karke baithi hai.

**Real-world scenario**

Payments service mein `createPaymentService({ db, gateway, logger })` factory hai. Test mein `db` ki jagah
fake object pass hota hai, production mein real pool. Service ke methods closure se `db` use karte hain. Yeh
DI-by-closure testability deta hai bina kisi framework ke.

**Interview answer:**

"A closure is a function bundled with a reference to the lexical environment in which it was created, so it can
keep accessing variables from its outer scopes even after those scopes have finished executing. It captures
bindings, not copies of values, which is why a `var` loop with `setTimeout` prints the final value while a
`let` loop prints each iteration's value. In backend code I use closures for factory functions such as
middleware that carry configuration, for dependency injection, for private state like counters and caches, and
for every async callback that needs to remember request-specific data. The thing to watch is memory: a
long-lived closure can keep large objects alive."

**Follow-up questions**

1. *Do closures capture values or variables?* Variables (bindings). If the variable changes later, the closure
   sees the new value.
2. *How would you fix the `var` loop bug without `let`?* Wrap in an IIFE passing `i` as a parameter, or use
   `forEach`, or `setTimeout(console.log, 0, "var:", i)` which passes `i` by value at call time. Best fix is
   simply `let`.
3. *How do closures cause memory leaks?* A long-lived structure (listener list, cache, timer, module-level Map)
   holds a function, which holds its environment, which holds large data. Fix by nulling references, bounding
   caches, removing listeners, and not capturing more than you need.
4. *Closure vs class for private state?* Both work. Closures give true privacy by scope; classes give private
   fields `#x` and shared methods via prototype (less memory per instance). Closures create new function
   objects per instance.
5. *Does every function create a closure?* Technically every function keeps its `[[Environment]]`, but we say
   "closure" when it actually uses outer variables.

**Common mistakes**

- Expecting closure to freeze the value at creation time.
- Creating closures in hot loops unnecessarily (extra allocations).
- Unbounded `Map` cache inside a closure (memory leak). Add max size/TTL.
- Forgetting that two instances created from one factory have separate state, but module-level variables are
  shared by all.

**Revision notes**

- Closure = function + `[[Environment]]` reference. Live bindings, not copies.
- `let` in `for` creates a fresh binding per iteration.
- Uses: factories, DI, private state, memoize/once, callbacks. Risk: retained memory.

---

### Day 1 - Output-prediction questions

Predict first. Assume ES module (strict mode) unless stated.

**P1.1**
```js
console.log(a);
var a = 5;
console.log(a);
```
<details><summary>Answer</summary>

```text
undefined
5
```
`var a` is hoisted and initialised to `undefined` in the creation phase. The assignment `a = 5` happens on its
line in the execution phase.
</details>

**P1.2**
```js
console.log(b);
let b = 5;
```
<details><summary>Answer</summary>

`ReferenceError: Cannot access 'b' before initialization`. `b` is in the temporal dead zone until the
declaration executes.
</details>

**P1.3**
```js
foo();
bar();
function foo() { console.log("foo declared"); }
var bar = function () { console.log("bar expression"); };
```
<details><summary>Answer</summary>

```text
foo declared
TypeError: bar is not a function
```
`foo` is fully hoisted. `bar` is a `var` hoisted as `undefined`, so `bar()` is `undefined()`, a TypeError.
The second log never runs because the error stops execution.
</details>

**P1.4**
```js
var x = 1;
function f() {
  console.log(x);
  var x = 2;
}
f();
```
<details><summary>Answer</summary>

`undefined`. Inside `f`, `var x` is hoisted to the top of `f` and shadows the outer `x`. At the `console.log` the
local `x` exists but is still `undefined`. It does not read the outer `1`.
</details>

**P1.5**
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
<details><summary>Answer</summary>

```text
3
3
3
```
One shared `i` for the whole loop. The callbacks run after the loop finished (call stack must empty first),
when `i` is `3`. Changing `var` to `let` prints `0 1 2`.
</details>

**P1.6**
```js
function makeCounter() {
  let c = 0;
  return { inc: () => ++c, get: () => c };
}
const a = makeCounter();
const b = makeCounter();
a.inc();
a.inc();
b.inc();
console.log(a.get(), b.get());
```
<details><summary>Answer</summary>

`2 1`. Each call of `makeCounter` creates a new environment with its own `c`.
</details>

**P1.7**
```js
const label = "global";
function show() { console.log(label); }
function run() {
  const label = "local";
  show();
}
run();
```
<details><summary>Answer</summary>

`global`. Lexical scoping: `show` resolves `label` from where `show` was written, not from where it was called.
</details>

**P1.8**
```js
const user = { name: "Asha" };
user.name = "Ravi";
console.log(user.name);
user = { name: "Neha" };
```
<details><summary>Answer</summary>

Prints `Ravi`, then `TypeError: Assignment to constant variable.` The binding is constant, the object content is
not.
</details>

**P1.9**
```js
console.log(typeof notDeclared);
console.log(typeof tdz);
let tdz = 1;
```
<details><summary>Answer</summary>

```text
undefined
ReferenceError: Cannot access 'tdz' before initialization
```
`typeof` on a never-declared name is safe and returns `"undefined"`. `tdz` is declared but uninitialised, so
`typeof` throws.
</details>

**P1.10**
```js
var fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => i);
}
i = 10; // line X
console.log(fns.map((f) => f()));
```
<details><summary>Answer</summary>

Line X throws `ReferenceError: i is not defined` in an ES module (strict mode, and the `let i` is scoped to
the loop). If you remove line X the output is `[ 0, 1, 2 ]`. This tests block scoping plus closure per iteration.
</details>

**P1.11**
```js
function outer() {
  const fns = [];
  for (var i = 0; i < 3; i++) {
    fns.push(function () { return i; });
  }
  return fns;
}
console.log(outer().map((f) => f()));
```
<details><summary>Answer</summary>

`[ 3, 3, 3 ]`. All three functions close over the same function-scoped `i`, which ended at `3`.
</details>

**P1.12 (hoisting priority)**
```js
function demo() {
  console.log(typeof dup);
  var dup = 10;
  function dup() {}
  console.log(typeof dup);
}
demo();
```
<details><summary>Answer</summary>

```text
function
number
```
Creation phase: function declaration wins for the binding. Execution phase: `dup = 10` overwrites it.
</details>

---

### Day 1 - Coding exercises

**Exercise 1.1 - `once`**

Write `once(fn)` that returns a function calling `fn` only on the first invocation, returning the cached result
on later calls. Preserve `this` and arguments.

Example: `const init = once(() => { console.log("init"); return 42 }); init(); init();` prints `init` once and
both calls return `42`.

<details><summary>Solution and explanation</summary>

See `once` in Topic 1.4. Key points: state `called/result` lives in the closure; `fn.apply(this, args)`
preserves `this`. Edge case to mention: if `fn` throws on first call, this version stays "not called"
(because `called = true` is set before `fn`). Decide intentionally; for "retry after failure" semantics, set
`called = true` after success.
</details>

**Exercise 1.2 - `createCounterStore`**

Write `createIdGenerator(prefix)` that returns `next()`. First call returns `"ORD-1"`, then `"ORD-2"`, etc. Two
generators must not share state.

<details><summary>Solution and explanation</summary>

```js
export function createIdGenerator(prefix) {
  let n = 0;
  return () => `${prefix}-${++n}`;
}
const orders = createIdGenerator("ORD");
const refunds = createIdGenerator("REF");
console.log(orders(), orders(), refunds()); // ORD-1 ORD-2 REF-1
```
Closure gives each generator its own `n`. Note: in-memory IDs reset on restart and collide across instances;
real systems use DB sequences/UUIDs (Week 4).
</details>

**Exercise 1.3 - Fix the loop**

Without changing `var` to `let`, make this print `0 1 2` (async, in order):

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

<details><summary>Solution and explanation</summary>

```js
for (var i = 0; i < 3; i++) {
  ((j) => setTimeout(() => console.log(j), 0))(i); // IIFE: j is a fresh parameter per iteration
}
// or: setTimeout(console.log, 0, i);  // extra args are passed at schedule time (by value)
```
Explains closures: IIFE creates a new scope per iteration, capturing the current value.
</details>

**Exercise 1.4 - `memoize` with multiple arguments**

Extend `memoize` to support any number of primitive arguments. Hint: build a cache key.

<details><summary>Solution and explanation</summary>

```js
export function memoizeN(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args); // fine for primitives and plain JSON-safe values
    if (cache.has(key)) return cache.get(key);
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
}
```
Caveats to say out loud: `JSON.stringify` loses `undefined`, functions, and key order differences in objects;
the cache is unbounded (add LRU/TTL for production); it is wrong for impure functions.
</details>

---

### Day 1 - Wrap-up

**Key concepts to remember**

1. Execution context = bindings + `this` + outer reference; two phases (creation, execution).
2. Call stack is LIFO; overflow -> `RangeError`; stack traces are stack snapshots.
3. Lexical scoping: lookup walks the scope chain defined by code position.
4. Hoisting: `var` -> `undefined`, function declaration -> ready, `let/const/class` -> TDZ.
5. Closure = function + environment reference; captures live bindings; `let` gives per-iteration binding.

**Five revision questions** (answer aloud in under 60 seconds each)

1. What happens in the creation phase vs the execution phase of an execution context?
2. Why does `typeof x` throw for a TDZ variable but not for an undeclared one?
3. What is the output of a `var` loop with `setTimeout`, and how many fixes can you give?
4. Define closure without using the words "remember" or "memory". (Hint: function + `[[Environment]]`.)
5. How can a closure cause a memory leak in a long-running Node process?

**One practical coding task**

Write `createRateLimiter` from Topic 1.4 from scratch (no peeking), add a `reset(key)` method, and write 5
`console.log` checks proving: allowed under limit, blocked over limit, window reset, separate keys independent,
`reset` works. Time-box: 25 minutes.

**Self-assessment checklist**

- [ ] I can trace a call stack by hand for 3 nested calls.
- [ ] I can explain TDZ and why `let` is "hoisted but unusable".
- [ ] I can predict P1.1 to P1.12 without running code (at least 10 of 12 correct).
- [ ] I can write a closure-based factory from memory.
- [ ] I can explain why each Node file has its own scope.

---

## Day 2 - this, prototypes, prototypal inheritance

**Learning objectives**

By the end of Day 2 you should be able to:

1. State the five rules that decide `this` and apply them in priority order.
2. Explain why `this` is lost when a method is passed as a callback, and give three fixes.
3. Draw the prototype chain of an object, array, function, and class instance.
4. Explain what `new` does step by step, and what `class` is really doing underneath.
5. Write a class hierarchy using `extends`/`super`, including a custom `AppError` for APIs.
6. Predict property lookup, shadowing, and `instanceof` results.

**Time plan (about 2 hours):** Topic 2.1 (35 min), 2.2 (35 min), 2.3 (10 min), predictions (25 min),
exercises (15 min).

---

### Topic 2.1 - `this` [ESSENTIAL]

**Concept**

`this` ek special binding hai jiski value **function ke call hone ke tareeke** se decide hoti hai (arrow
functions ko chhodkar, jo `this` apne outer scope se leti hain). Function kahan likha gaya woh matter nahi karta
(closure se ulta!), **kaise call hua** woh matter karta hai.

**Why it matters in backend**

- Class-based controllers/services mein `this.db`, `this.logger` use hota hai. Method ko Express route mein
  `router.get("/", controller.list)` pass karte hi `this` kho jaata hai: sabse common Node bug.
- Event handlers (`emitter.on("data", this.handle)`), timers, array callbacks sab `this` kho sakte hain.
- Interviewers aksar pehla sawaal poochte hain: "yeh print kya karega?"

**Internal working: the five rules (priority high to low)**

1. **`new` binding:** `new Foo()` -> `this` is the freshly created object.
2. **Explicit binding:** `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)` -> `this` is `obj`.
3. **Implicit binding:** `obj.method()` -> `this` is `obj` (the thing left of the dot at the call site).
4. **Default binding:** plain call `fn()` -> `this` is `undefined` in strict mode (ES modules, classes, and
   `"use strict"`); in sloppy-mode scripts it is `globalThis`.
5. **Arrow functions:** have **no own `this`**. They use the `this` of the surrounding lexical scope at the
   time of creation. `call/apply/bind` cannot change it. `new` on an arrow throws.

At the top level of an ES module, `this` is `undefined`. In a CommonJS file, top-level `this` is
`module.exports` (initially `{}`). Inside a CommonJS function called plainly (sloppy mode), `this` is
`globalThis`.

```js
// this-rules.mjs
const user = {
  name: "Asha",
  greet() {
    return `Hi, ${this.name}`;
  },
  greetArrow: () => `Hi, ${this?.name}`, // arrow: `this` is module-level `this` (undefined in ESM)
  later() {
    // arrow inside a method keeps the method's `this`
    return [1, 2].map((n) => `${this.name}-${n}`);
  },
};

console.log(user.greet());        // Hi, Asha        (implicit)
console.log(user.greetArrow());   // Hi, undefined   (arrow does not get `user`)
console.log(user.later());        // [ 'Asha-1', 'Asha-2' ]

const detached = user.greet;
try {
  detached();                     // default binding in strict mode
} catch (e) {
  console.log(e.constructor.name, "-", e.message);
  // TypeError - Cannot read properties of undefined (reading 'name')
}

console.log(detached.call({ name: "Ravi" })); // Hi, Ravi (explicit)
const bound = user.greet.bind({ name: "Neha" });
console.log(bound());                         // Hi, Neha
console.log(bound.call({ name: "X" }));       // Hi, Neha (bind wins over call)
```

**Losing `this` in a Node controller (the classic bug) and fixes**

```js
// lost-this.mjs
class OrderController {
  constructor(service) {
    this.service = service;
    this.list = this.list.bind(this); // Fix A: bind in constructor
  }
  list(req, res) {
    return this.service.findAll();
  }
  listArrow = (req, res) => this.service.findAll(); // Fix B: class field arrow function
  listPlain(req, res) {
    return this.service.findAll();
  }
}

const ctrl = new OrderController({ findAll: () => ["order1"] });

// A framework calls handlers as plain functions: no object on the left of the dot
const handler = ctrl.listPlain;
try {
  handler({}, {});
} catch (e) {
  console.log("lost this:", e.message);
}

console.log(ctrl.list({}, {}));      // [ 'order1' ]  (bound in constructor)
console.log(ctrl.listArrow({}, {})); // [ 'order1' ]  (arrow field)

// Fix C at the call site: wrap in an arrow
const wrapped = (req, res) => ctrl.listPlain(req, res);
console.log(wrapped({}, {}));        // [ 'order1' ]
```

Trade-off: arrow class fields (Fix B) and constructor binding (Fix A) create a new function per instance (more
memory, not shared on the prototype). Wrapping at the call site (Fix C) is cheapest and most explicit.

**`call`, `apply`, `bind` quick table**

| Method | Calls now? | Args | Returns |
|--------|-----------|------|---------|
| `fn.call(thisArg, a, b)` | yes | listed | result |
| `fn.apply(thisArg, [a, b])` | yes | array | result |
| `fn.bind(thisArg, a)` | no | partial args | new bound function |

**Frontend connection**

React class components: `this.handleClick = this.handleClick.bind(this)` in the constructor, same problem and
same fix. Function components + hooks removed `this`, but Node service classes bring it back.

**Real-world scenario**

A payments `PaymentController` registers `router.post("/pay", controller.pay)`. A unit test that calls
`controller.pay(req, res)` directly passes (implicit binding), but via Express the handler is called as a plain
function, so `this.gateway` throws `TypeError`. An integration test (Week 6) catches this; the direct unit test
does not.

**Interview answer:**

"In JavaScript, `this` is determined by how a function is called, not where it is defined, with the exception of
arrow functions, which capture `this` lexically from their enclosing scope. The order of precedence is: `new`
binding, then explicit binding with call, apply or bind, then implicit binding when the function is called as a
method on an object, and finally default binding, which is `undefined` in strict mode and the global object in
sloppy mode. The common bug is passing a method as a callback, such as an Express route handler, which detaches
it from its object so `this` is lost. I would fix that by binding in the constructor, using an arrow wrapper at
the registration site, or an arrow class field."

**Follow-up questions**

1. *Why does an arrow function not work as an object method that needs `this`?* Because it does not create its
   own `this`; it uses the enclosing scope's `this` where the object literal was written (often module level),
   not the object.
2. *Can you rebind an arrow function with `call`?* You can call it, but `this` stays lexical.
3. *What does `bind` do internally?* Returns a new exotic function with fixed `this` and optional pre-filled
   arguments. Binding an already-bound function does not change `this`.
4. *What is `this` inside a `setTimeout` callback in Node?* For a regular function callback, Node sets `this`
   to the `Timeout` object. For an arrow it is lexical. Do not rely on either; use closures.
5. *What is `this` in an `EventEmitter` listener?* Node calls non-arrow listeners with `this` set to the emitter
   instance. Arrow functions ignore it. (Week 2.)

**Common mistakes**

- Using arrow functions for object/prototype methods that need `this`.
- Using `function` callbacks inside methods and losing the outer `this` (use an arrow, or `const self = this`).
- Assuming `this` refers to the function itself.
- Passing `obj.method` as a callback without binding.

**Revision notes**

- Rules: new > explicit > implicit > default. Arrow = lexical, cannot be rebound.
- ESM and class bodies are strict: lost `this` is `undefined` -> TypeError.
- Fixes: bind, wrapper arrow, arrow field.

---

### Topic 2.2 - Prototypes and prototypal inheritance [ESSENTIAL]

**Concept**

JS mein har object ke paas ek hidden link hota hai: `[[Prototype]]`, jo kisi doosre object (ya `null`) ko point
karta hai. Property lookup mein agar object mein property nahi mili, to engine `[[Prototype]]` follow karke
dhundta hai. Yeh chain `null` tak chalti hai. Isi ko **prototype chain** kehte hain. JS ka inheritance "objects
linking to objects" hai, classes ki copy-paste se nahi.

Terminology (confusing hai, isliye dhyan se):

- `[[Prototype]]`: the hidden internal link of any object. Access: `Object.getPrototypeOf(obj)` (standard) or
  `obj.__proto__` (legacy accessor).
- `Fn.prototype`: ek normal property **functions** par; jab `new Fn()` call hota hai, naye object ka
  `[[Prototype]]` isi object ko set hota hai.
- `Fn.prototype.constructor` points back to `Fn`.

**Why it matters in backend**

- Interview classic: "How does inheritance work in JS?"
- Custom error hierarchies (`class NotFoundError extends AppError`) drive centralized error handling (Week 3).
- Prototype pollution is a real security vulnerability (`__proto__` in user JSON merged into objects).
- Why methods live on the prototype (shared, memory efficient) vs per instance.

**Internal working**

```js
// prototype-chain.mjs
function Dog(name) {
  this.name = name;                   // own property, lives on the instance
}
Dog.prototype.speak = function () {   // shared, lives on Dog.prototype
  return `${this.name} says woof`;
};

const d = new Dog("Tommy");
console.log(d.speak());                                                  // Tommy says woof
console.log(Object.getPrototypeOf(d) === Dog.prototype);                 // true
console.log(Object.getPrototypeOf(Dog.prototype) === Object.prototype);  // true
console.log(Object.getPrototypeOf(Object.prototype));                    // null (end of chain)
console.log(Object.hasOwn(d, "name"));                                   // true
console.log(Object.hasOwn(d, "speak"));                                  // false (found via the chain)
```

Chain diagram:

```text
d  { name: "Tommy" }
 |  [[Prototype]]
 v
Dog.prototype { speak, constructor: Dog }
 |  [[Prototype]]
 v
Object.prototype { toString, hasOwnProperty, ... }
 |  [[Prototype]]
 v
null
```

**What `new Fn(...args)` does** (4 steps):

1. Create a new empty object `obj`.
2. Set `obj.[[Prototype]] = Fn.prototype`.
3. Call `Fn` with `this = obj` and the args.
4. If `Fn` returns an object, that is the result; otherwise return `obj`.

```js
// new-simulation.mjs
function myNew(Fn, ...args) {
  const obj = Object.create(Fn.prototype);   // steps 1 + 2
  const result = Fn.apply(obj, args);        // step 3
  const isObjectResult =
    result !== null && (typeof result === "object" || typeof result === "function");
  return isObjectResult ? result : obj;      // step 4
}
function User(name) { this.name = name; }
User.prototype.hi = function () { return "hi " + this.name; };
console.log(myNew(User, "Asha").hi()); // hi Asha
```

**Property lookup, shadowing, and writes**

- **Reads** walk the chain.
- **Writes** create/update an **own** property on the object itself (shadowing the prototype's), except when
  the inherited property is a setter or read-only (non-writable), which changes the outcome.
- `delete obj.prop` removes only the own property; the inherited one becomes visible again.

```js
// shadowing.mjs
const base = { role: "user", greet() { return "base hello"; } };
const child = Object.create(base);
console.log(child.role);            // user  (inherited)
child.role = "admin";               // creates OWN property on child
console.log(child.role, base.role); // admin user
delete child.role;
console.log(child.role);            // user (inherited again)
```

**`Object.create(null)` objects**

```js
const dict = Object.create(null);   // no prototype: safe key/value map
dict["__proto__"] = "just a key";   // plain property, no pollution
console.log(Object.keys(dict));     // [ '__proto__' ]
// (A Map is usually cleaner for dynamic keys)
```

**Classes are syntax over prototypes**

```js
// classes.mjs
class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_ERROR", cause } = {}) {
    super(message, { cause });          // must call super() before using `this`
    this.name = this.constructor.name;  // "AppError" / "NotFoundError"...
    this.statusCode = statusCode;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} ${id} not found`, { statusCode: 404, code: "NOT_FOUND" });
  }
}

class ValidationError extends AppError {
  #fields; // private field: only accessible inside the class body
  constructor(fields) {
    super("Validation failed", { statusCode: 400, code: "VALIDATION_ERROR" });
    this.#fields = fields;
  }
  get fields() {
    return this.#fields;
  }
  toJSON() {
    return { code: this.code, message: this.message, fields: this.#fields };
  }
}

const e = new NotFoundError("Order", 42);
console.log(e instanceof NotFoundError, e instanceof AppError, e instanceof Error); // true true true
console.log(e.name, e.statusCode, e.message);   // NotFoundError 404 Order 42 not found
console.log(Object.getPrototypeOf(NotFoundError) === AppError);                      // true (statics inherit)
console.log(Object.getPrototypeOf(NotFoundError.prototype) === AppError.prototype);  // true

const v = new ValidationError([{ field: "email", problem: "invalid" }]);
console.log(JSON.stringify(v));
// {"code":"VALIDATION_ERROR","message":"Validation failed","fields":[{"field":"email","problem":"invalid"}]}
```

`class` internals:

- Methods defined in a class body go on `ClassName.prototype` (non-enumerable).
- `extends` sets `Child.prototype.[[Prototype]] = Parent.prototype` **and** `Child.[[Prototype]] = Parent`
  (so statics inherit).
- Class bodies are always strict mode. Calling a class without `new` throws `TypeError`.
- Class fields (`x = 1`) and arrow field functions are **per-instance own** properties, not on the prototype.
- `#private` fields are truly private (not accessible from outside, not even via reflection).

**`instanceof`:** `obj instanceof Fn` checks whether `Fn.prototype` appears anywhere in `obj`'s prototype chain.
It can fail across realms (objects created in another `vm` context have a different `Array.prototype`, etc.), so
prefer `Array.isArray` for arrays.

**Prototype pollution [ESSENTIAL for security awareness]**

```js
// pollution.mjs  (run in a throwaway process: it pollutes the runtime)
function unsafeMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === "object") {
      target[key] = unsafeMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const payload = JSON.parse('{"__proto__": {"isAdmin": true}}'); // JSON.parse creates an OWN "__proto__" key
unsafeMerge({}, payload);
console.log({}.isAdmin); // true  <- every object now "has" isAdmin (Object.prototype polluted)
```

Why: in the merge, `target["__proto__"]` resolves (via the inherited accessor) to `Object.prototype`, and the
recursive call then writes `isAdmin` onto it. Defences: reject keys `__proto__`, `constructor`, `prototype`;
use `Object.create(null)` or `Map` for dictionaries; validate input with a schema (Week 3); never deep-merge raw
user input; keep merge libraries updated; Node flag `--disable-proto=delete` as hardening.

**Frontend connection**

You already use prototypes daily: `[].map` lives on `Array.prototype`, and `class Foo extends React.Component`
is prototype inheritance. Spread/`Object.assign` copy own enumerable properties only, not the chain.

**Real-world scenario**

An API merges a JSON body into a user settings object with a naive deep merge. An attacker posts
`{"__proto__":{"isAdmin":true}}`. If the merge is unsafe, `isAdmin` leaks onto all objects, and a later
`if (user.isAdmin)` passes for everyone. Real CVEs existed in popular merge utilities (lodash among them).
Fix: whitelist fields with schema validation, never deep-merge raw input, keep dependencies patched.

**Interview answer:**

"JavaScript uses prototypal inheritance. Every object has an internal `[[Prototype]]` link to another object,
and when a property is not found on the object itself, the engine follows that link up the chain until it finds
the property or reaches `null`. Functions have a `prototype` property, and when you call a function with `new`,
the new object's internal prototype is set to it. ES6 classes are syntactic sugar over this mechanism: methods
are placed on the class's prototype and `extends` links both the prototype objects and the constructors. In
backend code I use this for error class hierarchies, such as a `NotFoundError` extending `AppError`, so my
central error handler can map errors to HTTP status codes. I also stay aware of prototype pollution when
merging untrusted JSON."

**Follow-up questions**

1. *`__proto__` vs `prototype`?* `prototype` is a property on constructor functions used as the template
   for instances. `__proto__` (or `Object.getPrototypeOf`) is the actual link on an instance:
   `d.__proto__ === Dog.prototype`.
2. *Class vs constructor function?* Same underlying model. Classes enforce `new`, are strict, have
   non-enumerable methods, TDZ for the class binding, proper `super`, `#private` support, and extending
   built-ins like `Error` works reliably.
3. *Why put methods on the prototype?* One copy shared by all instances -> less memory; per-instance function
   properties duplicate the function for every object.
4. *How does `Object.create(proto)` differ from `new`?* `Object.create` sets the prototype directly without
   running a constructor.
5. *How do you check own vs inherited properties?* `Object.hasOwn(obj, key)` (modern replacement for
   `obj.hasOwnProperty`); `key in obj` includes inherited. `Object.keys` returns own enumerable only; `for...in`
   includes inherited enumerable keys.
6. *Composition vs inheritance?* Prefer composition (inject collaborators) for services; use inheritance only
   for true "is-a" relationships like error types. Deep hierarchies are rigid.
7. *Why call `super()` before using `this`?* In derived constructors, `this` is not created until the parent
   constructor returns; touching `this` earlier throws `ReferenceError`.

**Common mistakes**

- Putting arrow functions on `Fn.prototype` expecting `this` to be the instance.
- Mutating `Object.prototype` or built-in prototypes (monkey-patching).
- Using `for...in` on arrays or plain data without an own-property guard.
- Overwriting `Fn.prototype = {...}` and forgetting to restore `constructor`.
- Extending `Error` and forgetting to set `name`, so logs show `Error` instead of `NotFoundError`.
- Believing JS classes work like Java classes.

**Revision notes**

- `[[Prototype]]` chain; reads walk the chain, writes create own props.
- `new` = create object, link prototype, run constructor, return object.
- Class = sugar. `extends` links the instance chain and statics.
- `instanceof` = prototype chain check. Prototype pollution = `__proto__` abuse in merges.

---

### Topic 2.3 - Property descriptors, getters/setters, freezing [ADVANCED, brief]

Har property ke attributes hote hain: `value`, `writable`, `enumerable`, `configurable` (ya `get`/`set`
accessor pair). Prototype pollution aur `Object.freeze` ko samajhne ke liye yeh kaam aata hai.

```js
// descriptors.mjs
const account = {};
Object.defineProperty(account, "id", { value: "A-1", writable: false, enumerable: true });
try {
  account.id = "A-2"; // strict mode / ESM: throws
} catch (e) {
  console.log(e.constructor.name, "-", e.message);
  // TypeError - Cannot assign to read only property 'id' of object '#<Object>'
}

const wallet = {
  _balance: 100,
  get balance() { return this._balance; },        // accessor (getter)
  set balance(v) {
    if (v < 0) throw new RangeError("negative balance");
    this._balance = v;
  },
};
wallet.balance = 50;
console.log(wallet.balance); // 50

console.log(Object.getOwnPropertyDescriptor(account, "id"));
// { value: 'A-1', writable: false, enumerable: true, configurable: false }
```

`Object.freeze(obj)` makes the object's own properties non-writable and non-configurable and prevents adding
new ones, but only **shallowly** (see Day 3). Getter/setter use: validation, computed fields, and `toJSON`.

**Interview answer:**

"Property descriptors control how a property behaves: whether it is writable, enumerable, and configurable, or
whether it is an accessor with a getter and setter. `Object.defineProperty` configures them, and
`Object.freeze` applies a shallow lock across all own properties. I use getters for computed or validated
fields, and I know that frozen objects throw in strict mode when mutated."

**Revision notes:** `writable`, `enumerable`, `configurable`; getters/setters are accessors on the object or
prototype; `freeze` is shallow.

---

### Day 2 - Output-prediction questions

Assume ES module (strict mode) unless stated.

**P2.1**
```js
const user = { name: "A", greet() { return this.name; } };
const g = user.greet;
console.log(g());
```
<details><summary>Answer</summary>

`TypeError: Cannot read properties of undefined (reading 'name')`. Plain call -> default binding -> `this` is
`undefined` in strict mode (ES modules). In a sloppy-mode CommonJS file it would print `undefined` instead
(`this` = `globalThis`, which has no `name`).
</details>

**P2.2**
```js
const o = { n: "x", f: () => this?.n };
console.log(o.f());
```
<details><summary>Answer</summary>

`undefined`. The arrow function's `this` is the module-level `this`, which is `undefined` in an ES module (so
`this?.n` is `undefined`). Without the `?.` it would throw a TypeError. In CommonJS, top-level `this` is
`module.exports` (`{}`), so `this.n` is also `undefined` but does not throw.
</details>

**P2.3**
```js
function show() { return this.v; }
const b = show.bind({ v: 1 });
console.log(b.call({ v: 2 }), b());
```
<details><summary>Answer</summary>

`1 1`. A bound function's `this` cannot be overridden by `call`.
</details>

**P2.4**
```js
function Dog() {}
Dog.prototype.speak = () => "woof";
const d = new Dog();
d.speak = () => "custom";
console.log(d.speak());
delete d.speak;
console.log(d.speak());
```
<details><summary>Answer</summary>

```text
custom
woof
```
The own property shadows the prototype's; deleting the own property reveals the inherited one.
</details>

**P2.5**
```js
class A {
  static s = 1;
  x = 2;
  m() {}
}
const a = new A();
console.log(Object.keys(a), a.s, A.s, Object.hasOwn(a, "m"));
```
<details><summary>Answer</summary>

`[ 'x' ] undefined 1 false`. The static is on the class, not instances. The field `x` is an own property. The
method `m` is on `A.prototype`, not own, and non-enumerable.
</details>

**P2.6**
```js
console.log([].__proto__ === Array.prototype);
console.log(Object.getPrototypeOf(Array.prototype) === Object.prototype);
console.log(Object.getPrototypeOf(Object.prototype));
```
<details><summary>Answer</summary>

```text
true
true
null
```
Array instance -> `Array.prototype` -> `Object.prototype` -> `null`.
</details>

**P2.7**
```js
class Btn {
  label = "ok";
  a() { return this?.label; }
  b = () => this.label;
}
const { a, b } = new Btn();
console.log(a(), b());
```
<details><summary>Answer</summary>

`undefined ok`. Destructured `a` is called with no receiver, so `this` is `undefined` (`?.` stops the error).
`b` is an arrow field created in the constructor with the instance as lexical `this`.
</details>

**P2.8**
```js
function Person(name) { this.name = name; }
Person.prototype.hello = function () { return "hi " + this.name; };
const p = new Person("A");
Person.prototype = { hello: () => "replaced" };
console.log(p.hello());
console.log(new Person("B").hello());
```
<details><summary>Answer</summary>

```text
hi A
replaced
```
`p` is already linked to the *old* prototype object. Reassigning `Person.prototype` affects only objects created
afterwards.
</details>

**P2.9**
```js
const proto = { hi() { return "proto " + this.name; } };
const obj = Object.create(proto, { name: { value: "Z", enumerable: true } });
console.log(obj.hi(), Object.keys(obj), "hi" in obj, Object.hasOwn(obj, "hi"));
```
<details><summary>Answer</summary>

`proto Z [ 'name' ] true false`. `this` in `hi` is `obj` (implicit binding), `hi` is found via the chain; `in`
sees inherited, `hasOwn` does not.
</details>

**P2.10**
```js
class P { constructor() { this.kind = "P"; } }
class C extends P {
  constructor() {
    this.extra = 1;
    super();
  }
}
try { new C(); } catch (e) { console.log(e.name + ": " + e.message); }
```
<details><summary>Answer</summary>

`ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived
constructor`. `this` does not exist until `super()` returns.
</details>

**P2.11**
```js
const e = new Error("x");
class MyErr extends Error {}
const m = new MyErr("y");
console.log(e.name, m.name, m instanceof MyErr, m instanceof Error, Object.prototype.toString.call(m));
```
<details><summary>Answer</summary>

`Error Error true true [object Error]`. Without setting `this.name`, subclass instances still report
`name === "Error"` (inherited from `Error.prototype`). This is why `AppError` sets `this.name`.
</details>

**P2.12**
```js
setTimeout(function () { console.log(this === globalThis); }, 0);
setTimeout(() => { console.log(this === undefined); }, 0);
```
<details><summary>Answer</summary>

`false` then `true` in an ES module. The regular function callback gets `this` = the `Timeout` object in Node
(not `globalThis`). The arrow uses the module's lexical `this`, `undefined`. (In CommonJS the second line would
print `false` since top-level `this` is `module.exports`.)
</details>

---

### Day 2 - Coding exercises

**Exercise 2.1 - Implement `Function.prototype.myBind`**

Write `myBind(fn, thisArg, ...preset)` (as a standalone function) that returns a function behaving like
`fn.bind(thisArg, ...preset)`: later arguments are appended to the preset ones.

<details><summary>Solution and explanation</summary>

```js
export function myBind(fn, thisArg, ...preset) {
  return function bound(...later) {
    return fn.apply(thisArg, [...preset, ...later]);
  };
}
function add(b, c) { return this.a + b + c; }
console.log(myBind(add, { a: 1 }, 2)(3)); // 6
```
Mention the limits: a real bound function also works with `new` (ignoring `thisArg`) and has a `name` like
`bound add`. The interview-level answer is the `apply` closure above.
</details>

**Exercise 2.2 - Error hierarchy for an API**

Create `AppError`, `NotFoundError(resource, id)`, `ConflictError(message)` with `statusCode`, `code`, and
`isOperational = true`. Then write `toHttp(err)` that returns `{ status, body }`; unknown errors map to 500 with
a generic message (no stack leak).

<details><summary>Solution and explanation</summary>

```js
class AppError extends Error {
  isOperational = true;
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}
class NotFoundError extends AppError {
  constructor(resource, id) { super(`${resource} ${id} not found`, 404, "NOT_FOUND"); }
}
class ConflictError extends AppError {
  constructor(message) { super(message, 409, "CONFLICT"); }
}

export function toHttp(err) {
  if (err instanceof AppError) {
    return { status: err.statusCode, body: { error: { code: err.code, message: err.message } } };
  }
  return { status: 500, body: { error: { code: "INTERNAL", message: "Something went wrong" } } };
}

console.log(toHttp(new NotFoundError("Order", 7)));
// { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Order 7 not found' } } }
console.log(toHttp(new TypeError("db password leaked in message")));
// { status: 500, body: { error: { code: 'INTERNAL', message: 'Something went wrong' } } }
```
Concepts tested: `extends`, `super`, `instanceof`, operational vs programmer errors (Week 3).
</details>

**Exercise 2.3 - Safe merge**

Write `safeMerge(target, source)` that deep-merges plain objects but ignores `__proto__`, `constructor`, and
`prototype` keys. Prove `{}.polluted` stays `undefined` after merging `JSON.parse('{"__proto__":{"polluted":true}}')`.

<details><summary>Solution and explanation</summary>

```js
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (FORBIDDEN.has(key)) continue;
    const value = source[key];
    if (isPlainObject(value)) {
      const existing = Object.hasOwn(target, key) && isPlainObject(target[key]) ? target[key] : {};
      target[key] = safeMerge(existing, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

safeMerge({}, JSON.parse('{"__proto__":{"polluted":true},"a":{"b":1}}'));
console.log({}.polluted); // undefined
```
Notes: `Object.keys` returns own keys (including the own `"__proto__"` created by `JSON.parse`), and the denylist
skips it. Allow-listing known fields via schema validation is stronger than a denylist.
</details>

---

### Day 2 - Wrap-up

**Key concepts to remember**

1. `this` = call-site decides (new > explicit > implicit > default); arrow = lexical.
2. Detached methods lose `this`; fix with bind, wrapper, or arrow field.
3. Prototype chain: `obj -> Fn.prototype -> Object.prototype -> null`; reads walk, writes shadow.
4. `new` = create, link, run, return. `class` = sugar over prototypes; `extends` links statics too.
5. Custom `AppError` hierarchies and prototype pollution are the two backend-relevant payoffs.

**Five revision questions**

1. List the `this` binding rules in order of precedence with one-line examples.
2. Why does `router.get("/", controller.list)` break a class method, and what are 3 fixes with trade-offs?
3. What is the difference between `__proto__` and `prototype`?
4. What exactly does `new` do? Implement it in 5 lines.
5. What is prototype pollution and how do you prevent it?

**One practical coding task**

Build `AppError`/`NotFoundError`/`ValidationError` plus a tiny `handle(err)` that returns
`{ status, body }`. Add `instanceof` checks and one test proving unknown errors do not leak `err.message`.
Time-box: 25 minutes. (Reused in Week 3 centralized error handling.)

**Self-assessment checklist**

- [ ] I can state the five `this` rules from memory.
- [ ] I can draw the prototype chain for a class instance and an array.
- [ ] I can explain why `super()` must precede `this` in derived constructors.
- [ ] I can demonstrate and prevent prototype pollution.
- [ ] I predicted at least 10 of 12 questions P2.1-P2.12 correctly.

---

## Day 3 - Objects, arrays, references

**Learning objectives**

By the end of Day 3 you should be able to:

1. Explain value types vs reference types and "pass by sharing" for function arguments.
2. Choose correctly between shallow copy, `structuredClone`, and JSON copy, and name their failure cases.
3. Use destructuring, spread/rest, optional chaining, and nullish coalescing safely.
4. Use `map/filter/reduce/find/some/every/flatMap/sort` correctly, including the `sort` and `parseInt` traps.
5. Pick between `Object`, `Map`, `Set`, and `WeakMap` for backend data structures.
6. Implement 8 common manipulation patterns (group, index, dedupe, pick, omit, chunk, paginate, frequency).

**Time plan (about 2 hours):** Topic 3.1 (30 min), 3.2 (30 min), 3.3 (20 min), predictions (20 min), exercises
(20 min).

---

### Topic 3.1 - Values, references, copying, equality [ESSENTIAL]

**Concept**

JS mein **primitives** (string, number, boolean, null, undefined, symbol, bigint) value se copy hote hain aur
immutable hain. **Objects** (object, array, function, Map, Set, Date...) reference se kaam karte hain: variable
object ka address (reference) rakhta hai, object khud nahi.

Function arguments **pass by sharing** hote hain: reference ki copy pass hoti hai. Isliye function object ko
mutate kar sakta hai (bahar dikhega), lekin parameter ko naye object pe re-assign karne se bahar ka variable
nahi badalta.

**Why it matters in backend**

- Shared mutable state bugs: ek request ne module-level `defaultConfig` object mutate kar diya aur sab
  requests ko affect kiya.
- Cache mein stored object ko caller ne mutate kar diya -> cache corrupt (cache poisoning by reference).
- Request body, DB rows, aur response DTOs ko copy/transform karna roz ka kaam hai.
- Object comparison (`===`) reference compare karta hai: "same data" ka matlab "same object" nahi hota.

**Internal working**

Primitives stack-like value slots mein (conceptually) hote hain; objects heap mein, aur variable mein heap
address hota hai.

```text
const a = { x: 1 };   a --> [heap object #1 {x:1}]
const b = a;          b --> [heap object #1]       (same object, two names)
const c = { x: 1 };   c --> [heap object #2 {x:1}] (equal-looking, different object)
a === b  true         a === c  false
```

```js
// references.mjs
const a = { x: 1 };
const b = a;
b.x = 2;
console.log(a.x);                 // 2 (same object)
console.log({ x: 1 } === { x: 1 }); // false (two different objects)

function mutate(o) {
  o.x = 99;        // mutates the shared object -> visible outside
  o = { x: 0 };    // re-assigns the LOCAL parameter only
}
const target = { x: 1 };
mutate(target);
console.log(target.x); // 99
```

**Copying objects**

| Technique | Depth | Copies | Fails on |
|-----------|-------|--------|----------|
| `{ ...obj }`, `Object.assign({}, obj)` | shallow | own enumerable props | nested objects stay shared |
| `[...arr]`, `arr.slice()`, `Array.from(arr)` | shallow | elements | nested objects stay shared |
| `structuredClone(obj)` (Node 17+) | deep | most built-ins: Date, Map, Set, RegExp, typed arrays, cycles | functions (throws `DataCloneError`), class prototypes lost (becomes plain object), getters evaluated |
| `JSON.parse(JSON.stringify(obj))` | deep | JSON-safe data | `undefined`, functions, symbols dropped; `Date` becomes string; `NaN`/`Infinity` become `null`; `Map`/`Set` become `{}`; BigInt throws; cycles throw |

```js
// copying.mjs
const original = { id: 1, tags: ["a"], profile: { city: "Pune" }, created: new Date(0) };

const shallow = { ...original };
shallow.profile.city = "Delhi";
console.log(original.profile.city);            // Delhi  <- shared nested object changed!

const deep = structuredClone(original);
deep.profile.city = "Mumbai";
console.log(original.profile.city);            // Delhi  (unchanged)
console.log(deep.created instanceof Date);     // true

const viaJson = JSON.parse(JSON.stringify(original));
console.log(typeof viaJson.created);           // string (Date lost its type)

console.log(JSON.stringify({ a: undefined, b: () => 1, c: NaN, d: new Date(0) }));
// {"c":null,"d":"1970-01-01T00:00:00.000Z"}
```

**Immutability tools**

- `const` -> binding only.
- `Object.freeze(obj)` -> shallow: top-level properties become read-only; nested objects remain mutable.
  In ESM/strict mode, writes throw `TypeError`.
- Deep freeze needs recursion. Treat objects as immutable by convention, and copy before change.

```js
const config = Object.freeze({ retries: 3, db: { host: "localhost" } });
try { config.retries = 5; } catch (e) { console.log(e.message); }
// Cannot assign to read only property 'retries' of object '#<Object>'
config.db.host = "evil";                 // allowed: freeze is shallow
console.log(config.db.host);             // evil
```

**Equality quick rules**

- `===` strict (no coercion). `==` coerces; avoid it except `x == null` (matches `null` and `undefined`).
- `Object.is(a, b)` differs from `===` for `NaN` (equal) and `+0/-0` (not equal).
- Objects/arrays compare by reference. For deep equality use `node:util` `isDeepStrictEqual` or
  `node:assert` `deepStrictEqual` (built-in, no library).

```js
import { isDeepStrictEqual } from "node:util";
console.log(isDeepStrictEqual({ a: [1, 2] }, { a: [1, 2] })); // true
console.log(NaN === NaN, Object.is(NaN, NaN));                // false true
```

**Frontend connection**

React's "do not mutate state" rule is exactly this: `setItems(items.push(x))` fails because React compares
references; you create a new array/object (`[...items, x]`) so the reference changes. Same reference semantics
power backend caches and memoization, just without a framework protecting you.

**Real-world scenario**

An e-commerce API keeps a module-level `const DEFAULT_FILTERS = { status: "active", tags: [] }`. A handler does
`const filters = req.query.f ?? DEFAULT_FILTERS; filters.tags.push("sale")`. After a few requests all users see
the "sale" tag filter forever. Fix: copy on use (`structuredClone(DEFAULT_FILTERS)`) or freeze defaults and
build new objects.

**Interview answer:**

"Primitives are copied by value and are immutable, while objects, arrays and functions are reference types:
a variable holds a reference to the object on the heap. When you pass an object to a function, JavaScript passes
a copy of the reference, so the function can mutate the shared object but re-assigning the parameter does not
affect the caller. Spread and Object.assign make shallow copies, so nested objects are still shared. For a deep
copy I use `structuredClone`, which handles Dates, Maps, Sets and cycles but throws on functions, and I avoid
the JSON round trip because it silently drops or changes types. In backend code I am careful with module-level
shared objects and cached values, because mutation through a shared reference causes cross-request bugs."

**Follow-up questions**

1. *Is JavaScript pass by value or pass by reference?* Pass by value, where the value for objects is a
   reference ("call by sharing"). You cannot make the caller's variable point to a new object from inside the
   function.
2. *How do you deep compare two objects without a library?* `util.isDeepStrictEqual` in Node.
3. *Does `Object.freeze` make an object immutable?* Only shallowly. Nested objects need recursive freezing.
4. *`structuredClone` vs JSON copy?* `structuredClone` preserves more types and handles cycles, throws on
   functions; JSON copy loses types and is slower for big data.
5. *What does spread do with getters and the prototype?* Copies own enumerable properties' current values
   (getters are invoked), and drops the prototype, so class instances become plain objects.

**Common mistakes**

- Using spread for "deep copy".
- Mutating function arguments (especially `req.body`, config, or cached objects).
- Comparing objects with `===` or `==`.
- Using `JSON.parse(JSON.stringify())` on data with Dates/undefined/BigInt.
- Thinking `const` freezes the object.

**Revision notes**

- Objects are references; arguments are passed by sharing.
- Shallow: spread/assign/slice. Deep: `structuredClone`. JSON copy is lossy.
- `freeze` is shallow. Compare with `isDeepStrictEqual`.

---

### Topic 3.2 - Destructuring, spread/rest, optional chaining, Map/Set [ESSENTIAL]

**Concept and quick reference**

```js
// syntax.mjs
const user = { id: 7, name: "Asha", address: { city: "Pune" }, roles: ["admin", "dev"] };

// Destructuring with rename + default
const { name: userName, age = 18, address: { city } } = user;
console.log(userName, age, city); // Asha 18 Pune

// Array destructuring, skipping, rest
const [first, , third = "none", ...others] = ["a", "b", undefined, "d", "e"];
console.log(first, third, others); // a none [ 'd', 'e' ]

// Rest in objects: omit a field (e.g. strip password before responding)
const { password, ...safeUser } = { id: 1, name: "A", password: "secret" };
console.log(safeUser); // { id: 1, name: 'A' }

// Optional chaining + nullish coalescing
console.log(user.profile?.avatar?.url ?? "default.png"); // default.png
console.log(0 ?? 5, 0 || 5, "" ?? "x", "" || "x");       // 0 5 '' x
```

Key semantics:

- `a ?? b` uses `b` only if `a` is `null` or `undefined`. `a || b` uses `b` for any falsy (0, "", false, NaN).
  Use `??` for defaults when `0`/`""` are valid (e.g. page=0, quantity=0).
- Default parameter/destructuring defaults apply only for `undefined`, **not** `null`.
- `?.` short-circuits to `undefined` when the left side is `null`/`undefined`; it does not catch other
  errors.
- Spread `{...a, ...b}`: later keys win. Spread of `null/undefined` in an object is fine (ignored).

**Map, Set, WeakMap**

| Structure | Use when | Notes |
|-----------|----------|-------|
| `Object` | fixed known keys (records, DTOs) | keys are strings/symbols; prototype keys risk (`__proto__`, `toString`) |
| `Map` | dynamic keys, any key type, frequent add/delete, need size, insertion order | O(1) average; safe from prototype pollution; `map.size` |
| `Set` | unique values, membership test | `new Set(arr)` dedupes primitives |
| `WeakMap` / `WeakSet` | attach metadata to objects without preventing GC | keys must be objects; not iterable; no size |

```js
const hits = new Map();                       // ip -> count
for (const ip of ["a", "b", "a"]) hits.set(ip, (hits.get(ip) ?? 0) + 1);
console.log(hits, [...hits.entries()]);       // Map(2) { 'a' => 2, 'b' => 1 } [ [ 'a', 2 ], [ 'b', 1 ] ]
console.log(new Set([1, 1, 2, 3, 3]).size);   // 3
console.log(new Map([[{}, 1]]).get({}));      // undefined (different object key)
```

**Iteration**

- `for...of` iterates values of iterables (arrays, Maps, Sets, strings).
- `for...in` iterates enumerable keys including inherited. Do not use on arrays.
- `Object.keys/values/entries` -> own enumerable. `Object.fromEntries(entries)` is the inverse.

**Frontend connection**

Destructuring props, `{...state, x}` updates, `?.` for API data that may be missing, `Map` instead of object as a
lookup table, all identical to React code you already write. New in backend: `req.body` is untrusted so every
`?.` and default is a validation question, not just convenience.

**Real-world scenario**

A `PATCH /users/:id` handler receives `{ name, email, role }`. Naive: `Object.assign(user, req.body)` lets a
client set `role: "admin"` (mass assignment). Correct: destructure only allowed fields:
`const { name, email } = req.body` and update those. Destructuring is a whitelisting tool.

**Interview answer:**

"I use destructuring to pick explicit fields from input, which also protects against mass assignment, rest
syntax to omit sensitive properties such as passwords before returning data, and optional chaining with nullish
coalescing for safe defaults. I prefer `??` over `||` when zero or an empty string is a valid value. For lookup
tables with dynamic keys I use `Map` rather than a plain object, because it handles any key type, preserves
insertion order, and avoids prototype key collisions."

**Follow-up questions**

1. *`??` vs `||`?* `??` only treats `null`/`undefined` as missing.
2. *Why `Map` over object for counters keyed by user input?* A user could send keys like `__proto__` or
   `constructor`; a `Map` has no prototype key problem, and `size` is O(1).
3. *WeakMap use case?* Storing per-object metadata (e.g. per-request/per-socket data) that must not leak memory
   because entries vanish when the key object is collected.
4. *Do default values apply to `null`?* No, only `undefined`.

**Common mistakes**

- `const { a } = null` throws `TypeError`. Guard or default: `const { a } = obj ?? {}`.
- Using `||` for defaults and clobbering `0`/`false`.
- Spreading user input into DB update objects.
- Expecting `for...in` order/behavior on arrays.

**Revision notes**

- `??` vs `||`, defaults only for `undefined`, `?.` short-circuit.
- `Map/Set` for dynamic keys/uniqueness, `WeakMap` for GC-friendly metadata.
- Destructure = whitelist; rest = omit.

---

### Topic 3.3 - Array methods and manipulation patterns [ESSENTIAL]

**Concept**

Backend mein tumhara daily kaam: DB se rows ka array aaya, usse filter/transform/group karke JSON response banana.
Isliye array methods fluently aane chahiye.

| Method | Returns | Mutates? | Notes |
|--------|---------|----------|-------|
| `map(fn)` | new array, same length | no | transform |
| `filter(fn)` | new array | no | keep truthy |
| `reduce(fn, init)` | single value | no | always pass `init`; empty array without it throws `TypeError` |
| `find / findLast` | element or `undefined` | no | first/last match |
| `findIndex` | index or `-1` | no | |
| `some / every` | boolean | no | short-circuit; `every` on `[]` is `true`, `some` on `[]` is `false` |
| `includes` | boolean | no | uses SameValueZero (finds `NaN`); `indexOf` does not |
| `flat(depth)/flatMap` | new array | no | |
| `sort(cmp)` | same array | **yes** | default compares as strings! |
| `reverse`, `splice`, `push/pop/shift/unshift`, `fill` | varies | **yes** | |
| `slice(a, b)` | new array | no | |
| `toSorted/toReversed/toSpliced/with` | new array | no | Node 20+ (ES2023) |
| `Object.groupBy(arr, fn)` | null-prototype object | no | **Node 21+ only**; not in Node 20 LTS. `Map.groupBy` same |
| `at(-1)` | element | no | negative index |

```js
// array-basics.mjs
const nums = [10, 9, 1];
console.log(nums.sort());                      // [ 1, 10, 9 ]  (string comparison: "1" < "10" < "9")
console.log([10, 9, 1].sort((a, b) => a - b)); // [ 1, 9, 10 ]
console.log(["1", "2", "3"].map(parseInt));    // [ 1, NaN, NaN ]  (map passes (value, index): parseInt("2", 1) -> NaN)
console.log(["1", "2", "3"].map(Number));      // [ 1, 2, 3 ]
console.log([NaN].includes(NaN), [NaN].indexOf(NaN)); // true -1

try { [].reduce((a, b) => a + b); } catch (e) { console.log(e.message); }
// Reduce of empty array with no initial value

const sortedCopy = [3, 1, 2].toSorted();       // Node 20+
```

`sort` is stable (guaranteed since ES2019 / V8 7.0), so you can sort by multiple keys with chained sorts, but a
single comparator with tie-breaks is clearer.

**Manipulation patterns used constantly in APIs** (all runnable together):

```js
// patterns-array.mjs
const orders = [
  { id: 1, userId: "u1", status: "paid",    amount: 250, tags: ["web"] },
  { id: 2, userId: "u2", status: "pending", amount: 100, tags: [] },
  { id: 3, userId: "u1", status: "paid",    amount: 400, tags: ["app", "web"] },
  { id: 4, userId: "u3", status: "failed",  amount: 75,  tags: ["web"] },
];

// 1) Group by key (works on every Node version)
export const groupBy = (items, keyFn) =>
  items.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
console.log(Object.keys(groupBy(orders, (o) => o.status))); // [ 'paid', 'pending', 'failed' ]

// 2) Index by id for O(1) lookup (avoids O(n^2) find-inside-loop)
export const indexBy = (items, keyFn) => new Map(items.map((i) => [keyFn(i), i]));
console.log(indexBy(orders, (o) => o.id).get(3).amount); // 400

// 3) Sum / aggregate per user
const totals = orders
  .filter((o) => o.status === "paid")
  .reduce((acc, o) => ({ ...acc, [o.userId]: (acc[o.userId] ?? 0) + o.amount }), {});
console.log(totals); // { u1: 650 }

// 4) Dedupe (primitives with Set; objects by key with Map)
console.log([...new Set(orders.flatMap((o) => o.tags))]); // [ 'web', 'app' ]
export const uniqueBy = (items, keyFn) => [...new Map(items.map((i) => [keyFn(i), i])).values()];
console.log(uniqueBy(orders, (o) => o.userId).map((o) => o.id)); // [ 3, 2, 4 ]  (last one per key wins)

// 5) Pick / omit
export const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
export const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
console.log(pick(orders[0], ["id", "amount"]), omit(orders[0], ["tags"]));

// 6) Chunk (batch inserts, e.g. 500 rows per INSERT)
export const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
console.log(chunk([1, 2, 3, 4, 5], 2)); // [ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]

// 7) In-memory pagination (when data is already in memory; DB pagination is Week 4)
export const paginate = (items, page, limit) => ({
  data: items.slice((page - 1) * limit, page * limit),
  page,
  limit,
  total: items.length,
  totalPages: Math.ceil(items.length / limit),
});
console.log(paginate(orders, 2, 3).data.map((o) => o.id)); // [ 4 ]

// 8) Frequency count
export const countBy = (items, keyFn) =>
  items.reduce((m, i) => m.set(keyFn(i), (m.get(keyFn(i)) ?? 0) + 1), new Map());
console.log(countBy(orders, (o) => o.status)); // Map(3) { 'paid' => 2, 'pending' => 1, 'failed' => 1 }
```

Complexity notes to say aloud: `find` inside a loop is O(n*m); building a `Map` first makes it O(n+m). The
reduce with `{ ...acc }` spread is O(n^2) because it copies the accumulator each time; mutate the accumulator
(as in `groupBy`) in hot paths.

**Typed performance honesty** [ADVANCED]: chaining `map().filter().map()` allocates intermediate arrays. For
tens of thousands of items it is fine. For millions, use a single loop or streams (Week 2).

**Frontend connection**

You already render lists with `map`/`filter` and group data for charts. In the backend the same code builds API
responses, while volume is larger and `sort`/`reduce` mutations can corrupt shared data (React's "do not
mutate state" rule applies to cached arrays).

**Real-world scenario**

A marketplace "seller dashboard" query returns 10,000 order rows. Code looks up each order's product with
`products.find(...)` inside `orders.map`. That is 10,000 x N. Building `indexBy(products, p => p.id)` first cuts
it to linear time. Better still: do the join/aggregation in SQL (Week 4) and use JS only for shaping.

**Interview answer:**

"I treat arrays as immutable in application code: `map`, `filter`, `slice`, and the new `toSorted` return new
arrays, while `sort`, `splice`, and `reverse` mutate in place, so I copy before sorting shared data. I always
pass an initial value to `reduce`, and a comparator to `sort` because the default sort compares strings. For
grouping and lookups I build a `Map` or object index once instead of calling `find` repeatedly inside a loop,
which turns quadratic work into linear work. For heavy aggregation I push the work to the database."

**Follow-up questions**

1. *Why does `['1','2','3'].map(parseInt)` return `[1, NaN, NaN]`?* `map` passes `(value, index, array)`;
   `parseInt(value, radix)` receives the index as the radix. Radix 1 is invalid -> `NaN`; radix 0 acts as 10.
2. *Is `sort` stable?* Yes since ES2019.
3. *`forEach` vs `for...of`?* `forEach` cannot `break`, ignores returned promises (see Day 6), `for...of`
   supports `break`/`await`.
4. *How do you remove duplicates from an array of objects?* By key using `Map`, as in `uniqueBy`.
5. *`Object.groupBy` availability?* Node 21+, so not on Node 20 LTS; use the `reduce` helper or Node 22.

**Common mistakes**

- `arr.sort()` on numbers without a comparator.
- `reduce` without an initial value on possibly empty arrays.
- Mutating arrays that are shared (cache, config) through `sort`, `reverse`, `push`.
- Using `map` for side effects (use `forEach`/`for...of`), or ignoring `filter(Boolean)` removing `0`.
- `async` callbacks in `forEach` (Day 6).
- O(n^2) accumulator spreading in `reduce`.

**Revision notes**

- Know which methods mutate: `sort/reverse/splice/push/pop/shift/unshift/fill`.
- `sort` default is lexicographic. `reduce` needs init. `map(parseInt)` trap.
- Index with `Map`, group with `reduce`, chunk for batches.
- `Object.groupBy` is Node 21+, `toSorted` is Node 20+.

---

### Day 3 - Output-prediction questions

**P3.1**
```js
const a = { x: 1 };
const b = a;
b.x = 2;
console.log(a.x, a === b, { x: 2 } === a);
```
<details><summary>Answer</summary>

`2 true false`. `a` and `b` are the same object. A new literal is a different object even with equal content.
</details>

**P3.2**
```js
function f(o) { o.x = 9; o = { x: 0 }; return o.x; }
const p = { x: 1 };
console.log(f(p), p.x);
```
<details><summary>Answer</summary>

`0 9`. `o.x = 9` mutates the shared object. `o = {...}` re-points only the local variable; `f` returns `0`
from the new object, and `p.x` stays `9`.
</details>

**P3.3**
```js
const a = { n: { v: 1 } };
const b = { ...a };
b.n.v = 2;
console.log(a.n.v);
const c = structuredClone(a);
c.n.v = 3;
console.log(a.n.v);
```
<details><summary>Answer</summary>

`2` then `2`. Spread is shallow (nested `n` shared). `structuredClone` is deep, so `c` is independent.
</details>

**P3.4**
```js
console.log([10, 9, 1].sort());
console.log(["1", "2", "3"].map(parseInt));
```
<details><summary>Answer</summary>

```text
[ 1, 10, 9 ]
[ 1, NaN, NaN ]
```
Default sort is string-based. `parseInt` receives the index as radix.
</details>

**P3.5**
```js
console.log(JSON.stringify({ a: undefined, b: () => 1, c: new Date(0), d: NaN, e: [undefined] }));
```
<details><summary>Answer</summary>

`{"c":"1970-01-01T00:00:00.000Z","d":null,"e":[null]}`. Object properties with `undefined`/function values are
omitted; in arrays they become `null`; `NaN` becomes `null`; `Date` uses `toJSON` (ISO string).
</details>

**P3.6**
```js
const arr = [1, 2, 3];
arr.length = 1;
arr[3] = 4;
console.log(arr, arr.length);
```
<details><summary>Answer</summary>

`[ 1, <2 empty items>, 4 ] 4`. Reducing `length` truncates; assigning index 3 creates holes (sparse array).
Avoid sparse arrays.
</details>

**P3.7**
```js
const frozen = Object.freeze({ a: 1, nested: { b: 2 } });
try { frozen.a = 2; } catch (e) { console.log("threw"); }
frozen.nested.b = 3;
console.log(frozen.a, frozen.nested.b);
```
<details><summary>Answer</summary>

`threw` then `1 3`. In an ES module (strict) writing to a frozen property throws. `freeze` is shallow, so the
nested object is still mutable.
</details>

**P3.8**
```js
console.log(0 ?? 10, 0 || 10, null ?? "d", "" || "d", false ?? "d");
```
<details><summary>Answer</summary>

`0 10 d d false`. `??` only replaces `null`/`undefined`.
</details>

**P3.9**
```js
const { a = 1, b = 2 } = { a: null, b: undefined };
console.log(a, b);
```
<details><summary>Answer</summary>

`null 2`. Defaults only apply for `undefined`, not `null`.
</details>

**P3.10**
```js
console.log([] + [] === "", [] == false, [1] == 1, typeof null, typeof [], [] instanceof Object);
```
<details><summary>Answer</summary>

`true true true object object true`. Coercion: `[] + []` -> `"" + ""` -> `""`; `[] == false` -> `"" == 0` -> true;
`[1] == 1` -> `"1" == 1` -> true. `typeof null` is the historical bug `"object"`. These show why `===` is
preferred.
</details>

**P3.11**
```js
const m = new Map([[{ id: 1 }, "a"]]);
console.log(m.get({ id: 1 }), m.size);
const s = new Set([NaN, NaN, 0, -0, "0"]);
console.log(s.size);
```
<details><summary>Answer</summary>

`undefined 1`, then `3`. Object keys are compared by reference. `Set` uses SameValueZero: `NaN` equals `NaN`,
`0` equals `-0`, `"0"` is different, so the set holds `NaN`, `0`, `"0"`.
</details>

**P3.12**
```js
const x = [1, 2, 3];
const y = x;
const z = [...x];
y.push(4);
console.log(x.length, z.length, x === y, x === z);
```
<details><summary>Answer</summary>

`4 3 true false`.
</details>

**P3.13**
```js
const users = [{ n: "b", a: 2 }, { n: "a", a: 2 }, { n: "c", a: 1 }];
console.log(users.sort((p, q) => p.a - q.a).map((u) => u.n).join(""));
```
<details><summary>Answer</summary>

`cba`. Sorted ascending by `a`: `c` (1) first; the two with `a: 2` keep original order (`b` then `a`) because
`sort` is stable.
</details>

**P3.14**
```js
const nums = [1, 2, 3, 4];
console.log(nums.reduce((acc, n) => acc + n, ""), nums.some((n) => n > 3), [].every(() => false));
```
<details><summary>Answer</summary>

`1234 true true`. Initial value `""` makes concatenation (string). `every` on an empty array is vacuously `true`.
</details>

---

### Day 3 - Coding exercises

**Exercise 3.1 - `deepFreeze` and mutation test**

Write `deepFreeze(obj)` that freezes recursively (handle arrays; avoid infinite loops on cycles). Prove that
mutating nested data throws in an ES module.

<details><summary>Solution and explanation</summary>

```js
export function deepFreeze(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== "object" || seen.has(obj)) return obj;
  seen.add(obj);
  for (const key of Reflect.ownKeys(obj)) {
    deepFreeze(obj[key], seen);
  }
  return Object.freeze(obj);
}
const cfg = deepFreeze({ db: { host: "h", ports: [1, 2] } });
try { cfg.db.ports.push(3); } catch (e) { console.log(e.constructor.name); } // TypeError
```
`WeakSet` tracks visited objects to survive cycles without leaking memory. Complexity: O(n) time, O(depth)
extra space for recursion plus the visited set.
</details>

**Exercise 3.2 - Group and summarize**

Given orders `[{userId, amount, status}]`, return an array like
`[{ userId: "u1", paidTotal: 650, paidCount: 2 }]` sorted by `paidTotal` descending, only for status `paid`.

<details><summary>Solution and explanation</summary>

```js
export function summarize(orders) {
  const byUser = new Map();
  for (const o of orders) {
    if (o.status !== "paid") continue;
    const cur = byUser.get(o.userId) ?? { userId: o.userId, paidTotal: 0, paidCount: 0 };
    cur.paidTotal += o.amount;
    cur.paidCount += 1;
    byUser.set(o.userId, cur);
  }
  return [...byUser.values()].sort((a, b) => b.paidTotal - a.paidTotal);
}
```
O(n + k log k) for k users. A single pass with a `Map` avoids chained `filter/reduce` allocations. In SQL this
is `GROUP BY user_id` (Week 4). Money tip: do not sum floats for currency; use integer minor units (paise/cents).
</details>

**Exercise 3.3 - Merge two sorted lists of ids without duplicates**

Input `[1,3,5,7]` and `[3,4,5,9]` -> `[1,3,4,5,7,9]`. Target O(n + m) time.

<details><summary>Solution and explanation</summary>

```js
export function mergeSortedUnique(a, b) {
  const out = [];
  let i = 0, j = 0;
  const push = (v) => { if (out.at(-1) !== v) out.push(v); };
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) push(a[i++]);
    else push(b[j++]);
  }
  while (i < a.length) push(a[i++]);
  while (j < b.length) push(b[j++]);
  return out;
}
console.log(mergeSortedUnique([1, 3, 5, 7], [3, 4, 5, 9])); // [ 1, 3, 4, 5, 7, 9 ]
```
Two-pointer merge. `[...new Set([...a, ...b])].sort((x, y) => x - y)` is simpler but O((n+m) log(n+m)).
</details>

**Exercise 3.4 - Whitelist an update payload**

Write `buildUpdate(body, allowed)` returning only allowed keys with non-undefined values; throw `TypeError` if
`body` is not a plain object. `buildUpdate({ name: "A", role: "admin", email: undefined }, ["name", "email"])`
-> `{ name: "A" }`.

<details><summary>Solution and explanation</summary>

```js
export function buildUpdate(body, allowed) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new TypeError("body must be a plain object");
  }
  const out = {};
  for (const key of allowed) {
    if (Object.hasOwn(body, key) && body[key] !== undefined) out[key] = body[key];
  }
  return out;
}
```
Iterating the allow-list (not the body) guarantees unknown/privileged keys like `role` and `__proto__` never
get through (mass-assignment protection).
</details>

---

### Day 3 - Wrap-up

**Key concepts to remember**

1. Objects are references; arguments are passed by sharing; `===` compares references for objects.
2. Spread and `Object.assign` are shallow; `structuredClone` is deep; JSON copy is lossy; `freeze` is shallow.
3. `??` vs `||`; defaults apply to `undefined` only; `?.` short-circuits.
4. `sort` mutates and defaults to string order; `reduce` needs an initial value; `map(parseInt)` trap.
5. Use `Map`/index structures for lookups and grouping, keep transformations linear.

**Five revision questions**

1. Is JavaScript pass-by-value or pass-by-reference? Prove it with an example.
2. When does a shallow copy bite you, and what are the deep copy options and their limits?
3. Which array methods mutate, and what is the safe way to sort a shared array?
4. Explain `??` vs `||` with an API example (pagination `page=0`).
5. How would you stop mass assignment when updating a record from `req.body`?

**One practical coding task**

Implement `groupBy`, `indexBy`, `pick`, `omit`, `chunk`, `paginate` from Topic 3.3 from memory in one file
`utils.mjs`, then write 6 `console.log` checks with edge cases (empty array, `page` beyond total, missing keys).
Time-box: 30 minutes.

**Self-assessment checklist**

- [ ] I can explain pass-by-sharing in one minute with code.
- [ ] I know three ways to copy and which one to pick for Dates/Maps.
- [ ] I never use `sort()` on numbers without a comparator.
- [ ] I can write group/index/dedupe/chunk without looking.
- [ ] I got at least 11 of 14 questions P3.1-P3.14 correct.

---

## Day 4 - Promises, chaining, async/await, error propagation

**Learning objectives**

By the end of Day 4 you should be able to:

1. Explain why callbacks became painful and what problem Promises solve.
2. Describe the three promise states and the exact rules of `then`, `catch`, and `finally`.
3. Predict what a `.then` chain returns when handlers return values, return promises, throw, or return nothing.
4. Explain `async/await` as syntax over promises and say what an `async` function always returns.
5. Trace how errors propagate through chains and `await`, and where `try/catch` does and does not help.
6. Handle unhandled rejections correctly in Node (crash behavior since Node 15).
7. Convert callback APIs to promises (`util.promisify`, `fs/promises`) and write `sleep`, `withTimeout`.

**Time plan (about 2 hours):** Topic 4.1 (35 min), 4.2 (30 min), 4.3 (20 min), predictions (20 min),
exercises (15 min).

---

### Topic 4.1 - Promises and chaining [ESSENTIAL]

**Concept**

**Promise** ek object hai jo ek async operation ke future result ko represent karta hai. Teen states:

- **pending**: abhi result nahi aaya.
- **fulfilled**: success, ek value ke saath.
- **rejected**: failure, ek reason (normally `Error`) ke saath.

Fulfilled ya rejected ko **settled** kehte hain. Ek baar settle hone ke baad state **kabhi nahi badalti** (first
settle wins) aur value immutable hoti hai.

Callbacks ki problem ("callback hell"/inversion of control): nested callbacks, error handling har level pe
manual, aur tum apna code kisi third-party function ko de dete ho jo use 0, 1, ya 2 baar bula sakta hai.
Promise guarantee deta hai: handler **ek hi baar** chalega, aur hamesha **asynchronously** (microtask mein).

**Why it matters in backend**

Almost every backend operation is async: DB query, HTTP call to a payment gateway, file read, Redis command.
Promises (via `async/await`) are how Node code is written in 2024+. Interviewers test: chaining semantics, error
propagation, parallel vs sequential, and unhandled rejections.

**Internal working**

Promise = state + result + two lists of reactions (fulfil reactions, reject reactions).

- `p.then(onFulfilled, onRejected)` always returns a **new promise** `p2`.
- If `p` is already settled, the handler is queued as a **microtask** immediately; if pending, it is stored
  until settle.
- The handler's outcome decides `p2`:
  - returns a plain value `v` -> `p2` fulfils with `v`.
  - returns a promise/thenable `q` -> `p2` "adopts" `q` (follows its fate).
  - throws `e` -> `p2` rejects with `e`.
  - handler is not a function (e.g. `.then(2)`) -> value/reason **passes through** to `p2`.
  - no handler for that state -> passes through (that is how `catch` far down the chain gets errors).
- `.catch(fn)` is `.then(undefined, fn)`. A `catch` handler that returns normally **recovers** the chain
  (next `then` runs as fulfilled).
- `.finally(fn)` runs regardless, receives no argument, its return value is ignored (unless it throws or returns a
  rejected promise), and the original value/reason passes through.

```js
// promise-basics.mjs
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getUser(id) {
  return new Promise((resolve, reject) => {          // executor runs synchronously
    setTimeout(() => {
      if (id <= 0) reject(new Error("invalid id"));
      else resolve({ id, name: "Asha" });
    }, 10);
  });
}

getUser(1)
  .then((user) => {
    console.log("user:", user.name);
    return user.id * 100;                 // plain value -> next then receives it
  })
  .then((n) => {
    console.log("n:", n);
    return getUser(0);                    // returns a promise -> chain adopts it (rejected)
  })
  .then(() => console.log("skipped"))     // skipped: chain is rejected
  .catch((err) => {
    console.log("caught:", err.message);  // invalid id
    return "recovered";                   // returning normally recovers
  })
  .then((v) => console.log("after catch:", v)) // recovered
  .finally(() => console.log("cleanup"));       // always runs
```

Output:

```text
user: Asha
n: 100
caught: invalid id
after catch: recovered
cleanup
```

**Callback to promise** (`util.promisify`, built-in)

```js
// promisify.mjs
import { promisify } from "node:util";
import { readFile } from "node:fs";                // callback API
import { readFile as readFileP } from "node:fs/promises"; // native promise API (preferred)

const readFileAsync = promisify(readFile);          // works for error-first callback (err, value) APIs
const text = await readFileAsync(new URL(import.meta.url), "utf8");
const text2 = await readFileP(new URL(import.meta.url), "utf8");
console.log(text === text2); // true
```

Rule: promisify works only for the Node convention `(err, value) => ...` as last argument. Prefer the
`node:fs/promises`, `node:timers/promises` (`setTimeout` returning a promise), `node:dns/promises` modules
that already return promises.

```js
import { setTimeout as sleep } from "node:timers/promises";
await sleep(100); // built-in promise sleep
```

**`new Promise` details**

```js
// executor-semantics.mjs
const p = new Promise((resolve, reject) => {
  resolve(1);
  reject(new Error("ignored")); // no effect: already settled
  throw new Error("also ignored"); // thrown after settle: swallowed (promise already fulfilled)
});
console.log(await p); // 1

// Throw BEFORE settle becomes a rejection:
await new Promise(() => { throw new Error("boom"); }).catch((e) => console.log(e.message)); // boom
```

Modern helper (Node 22, V8 12.4; **not** in Node 20): `const { promise, resolve, reject } =
Promise.withResolvers();` replaces the "capture resolve outside" pattern. On Node 20 write it manually.

**Frontend connection**

`fetch(url).then(res => res.json()).then(...)` is the same chain. `fetch` only rejects on network errors, not
on HTTP 404/500; same trap with Node's `fetch`/`undici` and axios-style clients (check `response.ok`). React Query
`useQuery` also relies on promise rejection to know about errors.

**Real-world scenario**

Checkout flow: `validateCart() -> reserveStock() -> chargeCard() -> createOrder()`. Each step returns a promise
and depends on the previous result. A `.catch` at the end maps any failure to an HTTP error, `.finally` releases
a DB connection or lock. If `chargeCard` rejects, `createOrder` must not run, and chain semantics give exactly
that skipping behavior.

**Interview answer:**

"A Promise represents the eventual result of an asynchronous operation and is in one of three states: pending,
fulfilled, or rejected. Once settled it never changes. `then` always returns a new promise, so calls can be
chained: if a handler returns a value the next promise fulfils with it, if it returns a promise the chain waits
for it, and if it throws the next promise rejects. A rejection skips fulfilment handlers until it reaches a
`catch`, and a `catch` that returns normally recovers the chain. Handlers always run asynchronously as
microtasks, which gives consistent ordering compared to callbacks."

**Follow-up questions**

1. *What is the difference between `.then(a, b)` and `.then(a).catch(b)`?* In the first, `b` does not handle
   errors thrown by `a`. In the second, `catch` handles both earlier rejections and errors from `a`.
2. *What if I forget to `return` inside `then`?* Next handler receives `undefined` and does not wait for the
   inner promise. Very common bug.
3. *Is the `new Promise` executor sync or async?* Synchronous; only the handlers (`then`) are async.
4. *What is a thenable?* Any object with a `then` method; promises adopt thenables.
5. *Can you cancel a promise?* Not natively. Use `AbortController`/`AbortSignal` to cancel the underlying
   operation (Day 6).
6. *Why are promises better than callbacks?* Composability (chaining, `all`), unified error propagation,
   guaranteed single settle and async execution, and `async/await` support.

**Common mistakes**

- Not returning the promise inside `then` (broken chain, unhandled rejection later).
- Nesting `.then` inside `.then` (promise hell) instead of flattening.
- Wrapping an existing promise in `new Promise` (the "explicit construction anti-pattern").
- `.catch` that logs and swallows the error without rethrowing when the caller needs to know.
- Not adding a final `.catch` (unhandled rejection crashes the process).

**Revision notes**

- States: pending -> fulfilled/rejected (once). `then` returns a new promise.
- Return value / returned promise / throw decide the next state; non-function handlers pass through.
- `catch` recovers; `finally` passes value through, return ignored.
- Executor is synchronous. Prefer `fs/promises` and `timers/promises`.

---

### Topic 4.2 - `async/await` [ESSENTIAL]

**Concept**

`async/await` promises ka syntax sugar hai jo async code ko sync jaisa dikhata hai.

- `async function` **hamesha promise return karta hai**: return value -> fulfilled; thrown error -> rejected.
- `await expr` function ko **suspend** karta hai jab tak `expr` (promise) settle na ho. Fulfilled -> value
  milti hai; rejected -> error **throw** hota hai (isliye `try/catch` kaam karta hai).
- Suspend hone par thread block nahi hota: function ka frame stack se hat jaata hai aur event loop doosra
  kaam chalata hai. Resume hone par continuation microtask se chalti hai.

**Why it matters in backend**

Sab modern Node code `async/await` mein hota hai. Interviewers dekhte hain: sequential vs parallel
(`await` in loop), error handling placement, `return await`, aur "await ke baad kya hota hai" (event loop).

**Internal working**

Roughly, an async function is a state machine (like a generator driven by promises):

```js
// desugared idea (simplified, not exact spec)
function getUserSummary(id) {
  return getUser(id).then((user) => getOrders(user.id).then((orders) => ({ user, orders })));
}
// is the same as:
async function getUserSummary2(id) {
  const user = await getUser(id);
  const orders = await getOrders(user.id);
  return { user, orders };
}
```

Execution rules:

1. Code runs **synchronously** until the first `await`.
2. At `await v`: `v` is wrapped with `Promise.resolve(v)` (native promises are used as-is; modern V8 takes 1
   microtask tick for an already-resolved native promise). The rest of the function is scheduled as a
   continuation reaction on that promise.
3. The function returns its own pending promise to the caller immediately.
4. When the awaited promise settles, the continuation runs from the microtask queue.

```js
// async-basics.mjs
import { setTimeout as sleep } from "node:timers/promises";

async function f() {
  return 1;                      // wrapped in a fulfilled promise
}
console.log(f());                // Promise { 1 }
console.log(await f());          // 1

async function g() {
  throw new Error("bad");        // becomes a rejected promise, NOT a sync throw
}
const pr = g();                  // no exception here
await pr.catch((e) => console.log("caught via catch:", e.message));

async function h() {
  try {
    await g();
  } catch (e) {
    console.log("caught via try/catch:", e.message);
  } finally {
    console.log("finally runs");
  }
}
await h();
```

**Sequential vs parallel**

```js
// seq-vs-parallel.mjs
import { setTimeout as sleep } from "node:timers/promises";
const task = async (name, ms) => { await sleep(ms); return name; };

console.time("sequential");
const a = await task("a", 100);
const b = await task("b", 100);
const c = await task("c", 100);
console.timeEnd("sequential");        // ~300 ms

console.time("parallel");
const [x, y, z] = await Promise.all([task("a", 100), task("b", 100), task("c", 100)]);
console.timeEnd("parallel");          // ~100 ms
```

Rule: if operations are **independent**, start them together and await together. If B needs A's result, await A
first. In a `for` loop with `await`, iterations run one after another (use `for...of` deliberately for
sequential work such as ordered payments; use `Promise.all` (with concurrency control, Day 6) for independent
work).

Another subtle pattern, start early, await later:

```js
const userPromise = getUser(1);        // started, not awaited yet
const ordersPromise = getOrders(1);    // started concurrently
const user = await userPromise;
const orders = await ordersPromise;    // if this rejects while we still await userPromise, see warning below
```

Warning: if two promises are started together and the *second* rejects while you are still awaiting the first,
Node may emit an unhandled rejection before you attach a handler. Prefer `Promise.all`/`allSettled` for
concurrent starts.

**Top-level await:** allowed in ES modules (Node 14.8+). It blocks the evaluation of that module and the
modules importing it, so use it for startup (read config, connect DB), not in hot paths. Not available in
CommonJS.

**`return` vs `return await`**

```js
// return-await.mjs
const fail = () => Promise.reject(new Error("e"));

async function noAwait() {
  try {
    return fail();            // promise is returned to the caller; try/catch does NOT see the rejection
  } catch {
    return "caught here";
  }
}
async function withAwait() {
  try {
    return await fail();      // rejection is thrown inside try -> caught
  } catch {
    return "caught here";
  }
}
console.log(await noAwait().catch((e) => "rejected: " + e.message)); // rejected: e
console.log(await withAwait());                                      // caught here
```

Rule: inside `try/catch` (or `try/finally` that must wait for the operation, e.g. releasing a DB connection),
use `return await`. Outside, `return promise` is fine.

**Frontend connection**

Same syntax as in React data-fetching code, same `try/catch` around `await fetch(...)`. The big shift in
backend: there is no UI to show a spinner, so a missing `await` or unhandled rejection can silently corrupt
data or kill the whole process, affecting every user.

**Real-world scenario**

Order placement: `const user = await getUser(); const [stock, price] = await Promise.all([checkStock(),
getPrice()]);` (independent, parallel) then `await charge(...)` (depends on price, sequential). Total latency =
max(stock, price) + charge instead of the sum of all three.

**Interview answer:**

"`async/await` is syntax over promises. An `async` function always returns a promise: returning a value
fulfils it and throwing rejects it. `await` pauses only that function until the promise settles, without
blocking the thread; the rest of the function resumes later as a microtask, and a rejection is rethrown at the
await point so I can use `try/catch`. The key practical point is that `await` in a loop makes independent
operations run sequentially, so I start independent work together with `Promise.all`, and I only await
sequentially when later steps depend on earlier results. Inside a `try/catch` I use `return await` so the catch
block can actually handle rejections from the returned promise."

**Follow-up questions**

1. *Does `await` block the thread?* No. It suspends the async function; the event loop continues with other
   work. A busy CPU loop does block.
2. *What does an `async` function return if it returns another promise?* The result adopts that promise
   (flattened); it never returns a promise of a promise.
3. *Can you use `await` in `forEach`?* The callback becomes async but `forEach` does not wait for it (Day 6).
   Use `for...of` or `Promise.all(arr.map(...))`.
4. *What happens if you forget `await`?* You get a pending promise object instead of a value, `try/catch`
   will not catch its rejection, and the function continues without waiting (a "floating promise").
5. *Why is top-level await only in ES modules?* CommonJS is synchronous `require`; ESM loading is async-capable.
6. *What is the cost of `async/await` over raw promises?* Small, extra allocations per call. Not relevant
   until hot loops.

**Common mistakes**

- Missing `await` (floating promise).
- Sequential awaits for independent calls.
- `try/catch` around a non-awaited promise.
- Making a function `async` unnecessarily (it forces a promise return and wraps sync throws).
- Using `await` inside `Promise` constructors or `forEach`.
- Forgetting that `async` arrow callbacks passed to APIs that ignore returned promises (e.g. `forEach`, event
  emitters, `setTimeout`) turn errors into unhandled rejections.

**Revision notes**

- `async` -> always a promise. `await` -> suspend + rethrow rejections.
- Independent work -> `Promise.all`; dependent -> sequential.
- `return await` inside `try/catch`/`finally`.
- Top-level await: ESM only. Floating promises are bugs.

---

### Topic 4.3 - Error propagation and unhandled rejections [ESSENTIAL]

**Concept**

Errors in async code travel through promises, not through the call stack. Rules:

1. A throw inside a `then` handler or `async` function becomes a **rejection** of the returned promise.
2. A rejection flows down the chain until a handler for it exists (`catch` or a `then` second argument).
3. `try/catch` only catches errors from code that is **awaited** inside the `try` block, or synchronous code.
4. A rejected promise with **no handler** by the time the microtask queue drains is an **unhandled
   rejection**. Since **Node 15**, the default mode is `--unhandled-rejections=throw`: it raises an
   `uncaughtException`, and if that is not handled the process **exits with code 1** (printing the error).
   Before Node 15 it only printed a warning. This is version-dependent behavior interviewers like.
5. Errors thrown inside callbacks of timers/event emitters (`setTimeout(() => { throw ... })`) are **not**
   caught by surrounding `try/catch`; they become `uncaughtException`.

**Why it matters in backend**

An unhandled rejection in a request handler can crash the whole server for all users, or (in frameworks that
swallow it) leave a request hanging forever. Production Node services log and exit on unhandled rejections and
rely on a process manager (PM2/Kubernetes) to restart, because process state is unknown after an unexpected
error.

**Internal working and examples**

```js
// propagation.mjs
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function level3() {
  await wait(5);
  throw new Error("DB down");
}
async function level2() {
  await level3();            // error propagates up through await
}
async function level1() {
  try {
    await level2();
  } catch (err) {
    console.log("level1 handled:", err.message);
    throw new Error("Order failed", { cause: err }); // wrap + keep the original (Error cause, Node 16.9+)
  }
}

try {
  await level1();
} catch (e) {
  console.log(e.message, "<-", e.cause.message); // Order failed <- DB down
}
```

**Where `try/catch` fails**

```js
// not-caught.mjs
async function bad() { throw new Error("x"); }

try {
  bad();                      // not awaited: rejection is not thrown here
  console.log("try finished without catching");
} catch {
  console.log("never printed");
}
// Later: unhandled rejection -> Node prints the error and exits with code 1 (Node 15+)

try {
  setTimeout(() => { throw new Error("in timer"); }, 0); // thrown later, outside this try -> uncaughtException
} catch {
  console.log("never printed");
}
```

**Process-level safety nets** (for logging, **not** for continuing as normal)

```js
// safety-net.mjs
process.on("unhandledRejection", (reason, promise) => {
  console.error("unhandledRejection:", reason);
  // log, flush logs/metrics, then exit; let the process manager restart
  process.exitCode = 1;
  setImmediate(() => process.exit(1));
});
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
  process.exit(1); // process state may be corrupt: do not keep serving
});
```

**Operational vs programmer errors** (important mental model, also Week 3):

- **Operational:** expected runtime failures: invalid input, DB timeout, 3rd party 503. Handle, map to HTTP
  status, retry maybe.
- **Programmer errors:** bugs (`TypeError`, undefined access). Fix code; log; for unexpected crashes, restart.

**Express note** (Week 3): Express 4 does **not** catch rejected promises from `async` handlers (you need
`next(err)` or a wrapper). Express 5 forwards rejected promises from handlers/middleware to the error handler
automatically.

**Frontend connection**

`window.onunhandledrejection` and React error boundaries (which do not catch async errors) have the same limits:
errors thrown asynchronously escape `try/catch` unless awaited. Backend difference: the browser tab just logs it;
the Node process can **exit**.

**Real-world scenario**

A payment webhook handler calls `sendReceiptEmail(order)` without `await` and the SMTP server is down. The
rejection is unhandled; the process crashes mid-traffic and every in-flight request fails. Fix: `await` it with
`try/catch` (if it must succeed), or fire-and-forget deliberately with `.catch(logError)` (or better, push to a
queue, Week 6), and never leave a promise floating.

**Interview answer:**

"Errors in asynchronous code propagate through promise rejections rather than the call stack. A throw inside an
`async` function or a `then` handler rejects the returned promise, and the rejection skips fulfilment handlers
until it hits a `catch`. `try/catch` only catches errors from awaited promises inside the block, so a missing
`await` or an error thrown from a timer callback escapes it. Since Node 15 an unhandled rejection raises an
uncaught exception and terminates the process by default, so I always await or attach `.catch`, I keep global
`unhandledRejection` and `uncaughtException` handlers only for logging and a clean exit, and I wrap lower-level
errors with `new Error(message, { cause })` to preserve context. I also distinguish operational errors, which I
handle and map to responses, from programmer errors, which I fix."

**Follow-up questions**

1. *What happens to an unhandled rejection in Node 12 vs 22?* Node 12: warning only. Node 15+: crashes by
   default (`--unhandled-rejections=throw`). Other modes: `warn`, `strict`, `none`.
2. *Should you keep the process alive after `uncaughtException`?* No. State may be inconsistent. Log, finish or
   drain gracefully if possible (Week 6), and restart under a supervisor.
3. *How do you propagate errors but add context?* Catch, then throw a new error with `{ cause: err }`.
4. *What is the difference between `Promise.reject(err)` and `throw err` inside a promise chain?* Equivalent
   inside handlers. Outside a promise context (plain sync code), `throw` is a sync exception.
5. *How do you handle errors for several parallel promises?* `Promise.all` (fail fast), `allSettled`
   (collect all outcomes). Day 6.
6. *Where would you put the try/catch in a layered Express app?* Services throw typed errors, controllers do
   not catch what they cannot handle, a centralized error middleware maps errors to responses (Week 3).

**Common mistakes**

- Swallowing errors with an empty `catch {}`.
- Logging and rethrowing at every layer (duplicate logs). Log once at the boundary.
- Catching `Error` and returning `null` so callers cannot distinguish "not found" from "database failure".
- Relying on `process.on("uncaughtException")` to keep running.
- Throwing strings (`throw "bad"`) which have no stack or class.
- Missing `await` before a promise that is returned inside a `try` block.

**Revision notes**

- Async errors travel via rejections; `try/catch` needs `await`.
- Node 15+: unhandled rejection crashes by default.
- Use `Error` `cause`; separate operational vs programmer errors; log once at the boundary.
- Global handlers are for logging and exit, not recovery.

---

### Day 4 - Output-prediction questions

**P4.1**
```js
Promise.resolve(1)
  .then((x) => { throw new Error("boom"); })
  .then(() => console.log("A"))
  .catch((e) => { console.log("B", e.message); return "recovered"; })
  .then((v) => console.log("C", v));
```
<details><summary>Answer</summary>

```text
B boom
C recovered
```
The throw rejects the chain, `A` is skipped, `catch` handles it and returns a value, so the next `then` runs
with `"recovered"`.
</details>

**P4.2**
```js
Promise.resolve(1).then(2).then((v) => console.log(v));
```
<details><summary>Answer</summary>

`1`. A non-function argument to `then` is ignored and the value passes through.
</details>

**P4.3**
```js
Promise.resolve(1)
  .then((v) => { Promise.resolve(v + 1); })
  .then((v) => console.log(v));
```
<details><summary>Answer</summary>

`undefined`. The handler has braces and no `return`, so it returns `undefined`; the chain does not wait for the
inner promise.
</details>

**P4.4**
```js
// snippet 1 (run alone)
Promise.resolve("x")
  .finally(() => "ignored")
  .then((v) => console.log(v));

// snippet 2 (run alone)
Promise.resolve("y")
  .finally(() => { throw new Error("from finally"); })
  .catch((e) => console.log(e.message));
```
<details><summary>Answer</summary>

Snippet 1 prints `x`; snippet 2 prints `from finally`. `finally` passes the original value through and ignores
its return value, but a throw inside `finally` replaces the result with a rejection. (If you run both together,
the relative order of the two lines depends on microtask tick counts; do not rely on it.)
</details>

**P4.5**
```js
async function f() { return 1; }
console.log(f());
console.log(f() instanceof Promise);
```
<details><summary>Answer</summary>

```text
Promise { 1 }
true
```
</details>

**P4.6**
```js
async function bad() { throw new Error("x"); }
try {
  bad();
  console.log("after call");
} catch {
  console.log("caught");
}
```
<details><summary>Answer</summary>

`after call`, then the process crashes with the error `x` as an unhandled rejection (Node 15+, exit code 1).
`caught` is never printed because `bad()` is not awaited; its failure is a rejected promise, not a synchronous
throw.
</details>

**P4.7**
```js
async function a() {
  try { return Promise.reject(new Error("e")); } catch { return "caught"; }
}
async function b() {
  try { return await Promise.reject(new Error("e")); } catch { return "caught"; }
}
console.log(await a().then(() => "fulfilled", (e) => "rejected " + e.message));
console.log(await b().then((v) => "fulfilled " + v, (e) => "rejected " + e.message));
```
<details><summary>Answer</summary>

```text
rejected e
fulfilled caught
```
`a` returns the promise without awaiting, so the rejection bypasses its `catch` and `a()` rejects. `b` awaits
inside `try`, so the rejection is thrown inside the block and caught, and `b()` fulfils with `"caught"`.
</details>

**P4.8**
```js
const p = new Promise((resolve, reject) => {
  resolve(1);
  reject(2);
  throw 3;
});
p.then(console.log, (e) => console.log("rej", e));
```
<details><summary>Answer</summary>

`1`. The first settle wins; later `reject` and the throw are ignored.
</details>

**P4.9**
```js
console.log(1);
new Promise((r) => { console.log(2); r(); }).then(() => console.log(3));
console.log(4);
```
<details><summary>Answer</summary>

```text
1
2
4
3
```
The executor runs synchronously (`2` before `4`); the `then` handler runs later as a microtask (`3` last).
</details>

**P4.10**
```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const start = Date.now();
for (const ms of [100, 100, 100]) await sleep(ms);
console.log(Math.round((Date.now() - start) / 100));
const s2 = Date.now();
await Promise.all([100, 100, 100].map(sleep));
console.log(Math.round((Date.now() - s2) / 100));
```
<details><summary>Answer</summary>

`3` then `1`. Sequential awaits add up (about 300 ms); parallel takes about as long as the slowest (about 100 ms).
</details>

**P4.11**
```js
async function run() {
  console.log("A");
  await null;
  console.log("B");
}
run();
console.log("C");
```
<details><summary>Answer</summary>

```text
A
C
B
```
Code before the first `await` is synchronous; the continuation after `await` is a microtask that runs after the
current synchronous code finishes.
</details>

**P4.12**
```js
Promise.reject(new Error("one"))
  .catch((e) => { throw new Error("two", { cause: e }); })
  .catch((e) => console.log(e.message, e.cause.message));
```
<details><summary>Answer</summary>

`two one`. The second error wraps the first via `cause`.
</details>

---

### Day 4 - Coding exercises

**Exercise 4.1 - Implement `promisify`**

Write `myPromisify(fn)` returning a function that calls `fn(...args, callback)` and returns a promise,
rejecting on the first `err` argument. Preserve `this`.

<details><summary>Solution and explanation</summary>

```js
export function myPromisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
  };
}
// demo
const legacyAdd = (a, b, cb) => setTimeout(() => (a < 0 ? cb(new Error("neg")) : cb(null, a + b)), 10);
const add = myPromisify(legacyAdd);
console.log(await add(1, 2));                          // 3
await add(-1, 2).catch((e) => console.log(e.message)); // neg
```
Mention: real `util.promisify` also supports `util.promisify.custom` and callbacks with multiple values via
custom symbols. `new Promise` is appropriate here because we wrap a callback API (not an existing promise).
</details>

**Exercise 4.2 - `withTimeout`**

Write `withTimeout(promise, ms, message)` that rejects with `Error(message)` if `promise` does not settle in
time, and always clears the timer. Explain what it cannot do.

<details><summary>Solution and explanation</summary>

```js
export function withTimeout(promise, ms, message = `Timed out after ${ms}ms`) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
const slow = new Promise((r) => setTimeout(() => r("done"), 200));
await withTimeout(slow, 50).catch((e) => console.log(e.message)); // Timed out after 50ms
```
Limitation: it does **not cancel** the underlying work (the slow DB/HTTP call continues). For real cancellation
pass an `AbortSignal` to the operation (`fetch(url, { signal: AbortSignal.timeout(ms) })`), covered Day 6 and
Week 6.
</details>

**Exercise 4.3 - Convert a promise chain to async/await (and fix the bug)**

```js
function placeOrder(userId) {
  return getUser(userId).then((user) => {
    getCart(user.id).then((cart) => {
      return charge(user, cart.total);
    });
  });
}
```
This resolves before the charge completes. Rewrite it correctly in both styles.

<details><summary>Solution and explanation</summary>

Bug: the inner `getCart(...)` promise is not returned, so `placeOrder` resolves early and any charge error is
unhandled.

```js
// Promise style: flatten and return
function placeOrder(userId) {
  return getUser(userId)
    .then((user) => getCart(user.id).then((cart) => charge(user, cart.total)));
}
// async/await style
async function placeOrder2(userId) {
  const user = await getUser(userId);
  const cart = await getCart(user.id);
  return charge(user, cart.total);
}
```
`getCart` depends on `user.id`, so sequential is correct here.
</details>

**Exercise 4.4 - Error wrapping layer**

Write `getOrder(id)` that calls a fake `db.query` (which may reject with a generic `Error("ECONNRESET")`). If the
row is missing throw `NotFoundError`; if DB fails throw `AppError("Could not load order", { cause })`. Show how
the caller distinguishes them.

<details><summary>Solution and explanation</summary>

```js
class AppError extends Error {
  constructor(message, options) { super(message, options); this.name = this.constructor.name; }
}
class NotFoundError extends AppError {}

async function getOrder(db, id) {
  let rows;
  try {
    rows = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
  } catch (cause) {
    throw new AppError("Could not load order", { cause });
  }
  if (rows.length === 0) throw new NotFoundError(`Order ${id} not found`);
  return rows[0];
}

try {
  await getOrder({ query: async () => [] }, 1);
} catch (e) {
  console.log(e instanceof NotFoundError, e.message); // true Order 1 not found
}
```
The `try` surrounds only the DB call, so `NotFoundError` is not accidentally wrapped as a DB failure.
</details>

---

### Day 4 - Wrap-up

**Key concepts to remember**

1. Promise: pending/fulfilled/rejected; settles once; handlers are async microtasks.
2. `then` returns a new promise; value, returned promise, throw, and pass-through decide the next state.
3. `async` always returns a promise; `await` suspends the function and rethrows rejections.
4. `try/catch` needs `await`; `return await` inside `try`; floating promises are bugs.
5. Node 15+: unhandled rejection crashes by default. Use `cause`, log once at the boundary.

**Five revision questions**

1. Walk through exactly what `p.then(f).catch(g).finally(h)` does for fulfil and for reject paths.
2. What is the difference between returning a promise from `async` inside vs outside `try/catch`?
3. Why does `try { asyncFn() } catch {}` not catch the error, and how do you fix it?
4. What happens on an unhandled rejection in Node 12 vs Node 22?
5. When must you use sequential `await`, and when `Promise.all`?

**One practical coding task**

Write `fetchWithRetry`-style skeleton (no retries yet): `loadDashboard(userId)` that calls three fake async
services (`getProfile`, `getOrders`, `getNotifications`), where `getProfile` is required (failure -> throw
`AppError` with `cause`) but the other two are optional (log and default to `[]`). Use `Promise.all` where
possible. Time-box: 25 minutes. (You will improve it with `allSettled` on Day 6.)

**Self-assessment checklist**

- [ ] I can predict every `then/catch/finally` chain result including pass-through cases.
- [ ] I can explain why an `async` function never throws synchronously.
- [ ] I can fix a missing `return` in a chain and a missing `await` in an `async` function.
- [ ] I know the Node 15 unhandled-rejection change and what to do about it.
- [ ] I got at least 10 of 12 questions P4.1-P4.12 correct.

---

## Day 5 - Event loop, microtasks vs macrotasks

**Learning objectives**

By the end of Day 5 you should be able to:

1. Draw and explain the call stack, task (macrotask) queues, and microtask queue, and the rule that connects them.
2. Predict the output order of mixed `console.log`, `setTimeout`, `setImmediate`, promises, `queueMicrotask`,
   `process.nextTick`, and `async/await` code.
3. Explain why a CPU-heavy loop freezes a Node server, and give three mitigation strategies.
4. Explain starvation (microtask or `nextTick` recursion) and why `setTimeout(fn, 0)` is not "now".
5. Describe at a high level how this maps to Node's libuv phases (details deferred to Week 2 / Day 2).

**Time plan (about 2 hours):** Topic 5.1 (35 min), 5.2 (20 min), 5.3 (20 min), predictions (30 min),
exercises (15 min).

---

### Topic 5.1 - The event loop model [ESSENTIAL]

**Concept**

JavaScript ka code **ek thread** par chalta hai, ek call stack ke saath. To ek hi thread par hazaaron requests
kaise handle hoti hain? Jawab: **I/O ka wait JS thread par nahi hota.** Network/disk ka kaam OS ya libuv
(thread pool) karta hai, aur jab kaam ho jaata hai to uska **callback** ek queue mein daal diya jaata hai.
**Event loop** woh mechanism hai jo dekhta rehta hai: "call stack khaali hai? to queue se agla callback uthao
aur stack par chalao."

Teen cheezein yaad rakho:

1. **Call stack:** abhi jo sync code chal raha hai.
2. **Macrotask (task) queues:** timers (`setTimeout`/`setInterval`), I/O callbacks, `setImmediate`, etc.
3. **Microtask queue:** promise reactions (`then/catch/finally`), `await` continuations, `queueMicrotask`.

**Why it matters in backend**

- Node ki scalability ka poora reason yeh model hai (Week 2 mein deep dive).
- Isi se samajh aata hai ki ek heavy synchronous loop (JSON.parse of 50 MB, sync crypto, regex catastrophic
  backtracking) **sab users ko block** kar deta hai.
- Output-ordering questions ke bina koi JS/Node interview poora nahi hota.

**Internal working: the core algorithm**

```text
loop forever:
  1. Take ONE macrotask from the queues (when the call stack is empty) and run it to completion.
  2. After that task finishes (stack empty), DRAIN the microtask queue completely:
       run every microtask; microtasks queued during this drain run in the same drain.
  3. (Browsers: maybe render.) Repeat.
```

The rule to memorise: **run to completion -> drain all microtasks -> next macrotask.**

```text
 sync code (module body / current callback)
        |
        v
   call stack empties
        |
        v
 +-------------------------+      microtasks:
 | drain MICROTASK queue   | <--  Promise .then/.catch/.finally
 | (until it is empty)     |      await continuations, queueMicrotask
 +-------------------------+
        |
        v
 next MACROTASK (timers, I/O callbacks, setImmediate ...)
```

**Node specifics** (version note: these details are Node, not browser):

- `process.nextTick(fn)` has its **own queue** that is processed **before** the promise microtask queue, right
  after the current operation completes. Both are drained between every macrotask callback (since Node 11;
  before Node 11 they were drained between phases).
- Order inside a macrotask callback after it finishes: **`nextTick` queue -> promise microtasks (including
  `queueMicrotask`)**, and the nextTick queue is re-checked after each round.
- At the top level of an **ES module**, the module evaluation itself runs inside a promise job, so promise
  microtasks run **before** `nextTick` callbacks queued from the module body. In **CommonJS**, `nextTick`
  runs first. This is a real gotcha; the example below shows both. Inside any later callback (timer, I/O) the
  order is always nextTick first, then promises.
- `setTimeout(fn, 0)` is treated as `1` ms minimum. Timers are **not exact**: they mean "no earlier than".
- `setImmediate(fn)` runs in the **check** phase, right after the poll (I/O) phase.

High-level Node loop phases (details and the OS/thread-pool story: Week 2 / Day 2):

```text
   timers  ->  pending callbacks  ->  idle/prepare  ->  poll (I/O)  ->  check (setImmediate)  ->  close callbacks
      ^                                                                                              |
      +----------------------------------------------------------------------------------------------+
   (between every callback: process.nextTick queue, then promise microtasks)
```

```js
// order-basics.mjs
console.log("1 sync");
setTimeout(() => console.log("5 timeout (macrotask)"), 0);
Promise.resolve().then(() => console.log("3 promise (microtask)"));
queueMicrotask(() => console.log("4 queueMicrotask (microtask)"));
console.log("2 sync");
// 1 sync, 2 sync, 3 promise, 4 queueMicrotask, 5 timeout
```

```js
// next-tick-order.mjs  (inside a timer callback: deterministic in ESM and CJS)
setTimeout(() => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
  process.nextTick(() => console.log("nextTick"));
  Promise.resolve().then(() => console.log("promise"));
  queueMicrotask(() => console.log("queueMicrotask"));
  console.log("sync");
}, 0);
// sync, nextTick, promise, queueMicrotask, immediate, timeout
```

Why `immediate` before `timeout` here: we are inside the timers phase; the next phase is check (immediate), and the
new 1 ms timer waits for the next loop iteration. From the **main module**, `setTimeout(0)` vs `setImmediate`
order is **not guaranteed** (depends on process performance and whether 1 ms elapsed before the loop starts).
Inside an **I/O callback**, `setImmediate` is always first.

```js
// io-callback-order.mjs
import fs from "node:fs";
fs.readFile(import.meta.filename, () => {  // import.meta.filename: Node 20.11+ / 21.2+
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// always: immediate, timeout
```

**`await` and the event loop**

`await x` schedules the rest of the function as a promise reaction (a microtask) once `x` settles. For an
already-resolved native promise or a non-promise value, that is **one microtask tick** in modern V8.

```js
// async-order.mjs
async function a() {
  console.log("a1");
  await b();            // b() runs synchronously, prints "b"; continuation queued as microtask
  console.log("a2");
}
async function b() {
  console.log("b");
}
console.log("start");
a();
console.log("end");
// start, a1, b, end, a2
```

**Tick counting: why `return promise` costs extra ticks** [ADVANCED]

```js
// ticks.mjs
Promise.resolve().then(() => { console.log(1); return Promise.resolve(2); }).then((v) => console.log(v));
Promise.resolve().then(() => console.log(3))
  .then(() => console.log(4))
  .then(() => console.log(5))
  .then(() => console.log(6));
// 1, 3, 4, 5, 2, 6
```

Returning a promise from a `then` handler requires the outer promise to first "adopt" it (a thenable job) and
then wait for its reaction: about **two extra microtask ticks**. That is why `2` arrives after `5`. You will
not be asked this in most interviews, but it shows that microtask ordering is deterministic and explainable.

**Frontend connection**

Identical model to the browser: `setTimeout` callback runs after the current JS finishes, promises run before it,
a long loop freezes the UI. In the browser a freeze means a stuck page for one user; in Node a freeze means
every request on that process waits (head-of-line blocking). Node also adds `nextTick`/`setImmediate` and
I/O phases; there is no rendering step.

**Real-world scenario**

An analytics endpoint parses a 40 MB CSV upload with a synchronous `for` loop that takes 800 ms. During those
800 ms the health-check endpoint cannot respond, the load balancer marks the instance unhealthy, and it
gets removed from rotation. Root cause: the event loop was blocked. Fix: stream-parse (Week 2), offload to a
worker thread, or a queue worker (Week 6).

**Interview answer:**

"JavaScript runs on a single thread with one call stack. The event loop coordinates asynchronous work: when
the call stack is empty, it takes the next macrotask, such as a timer or I/O callback, and runs it to
completion. After each macrotask, the engine drains the entire microtask queue, which holds promise reactions,
`await` continuations and `queueMicrotask` callbacks, before moving on. In Node there is also
`process.nextTick`, which has its own queue processed before promise microtasks, and `setImmediate`, which runs
in the check phase after I/O polling. The important consequence is that any long synchronous work blocks all
other work on that process, because nothing can run until the stack is empty. That is why in Node we avoid
CPU-heavy synchronous code in request handlers and use streams, worker threads, or queues instead."

**Follow-up questions**

1. *Microtask vs macrotask: examples and priority?* Microtasks: promise handlers, `await` continuations,
   `queueMicrotask`. Macrotasks: timers, I/O, `setImmediate`. All microtasks run before the next macrotask.
2. *`process.nextTick` vs `setImmediate`?* `nextTick` runs right after the current operation, before promise
   microtasks and before the loop continues; `setImmediate` runs in the check phase of the next loop turn. Despite
   the names, `nextTick` is "sooner". Use `setImmediate` to yield to the event loop; use `nextTick` rarely.
3. *Is `setTimeout(fn, 0)` immediate?* No. It runs after the current stack and all microtasks, and not before
   about 1 ms.
4. *Is Node single-threaded?* Your JS runs on one thread. Node itself uses additional threads for the libuv
   thread pool (fs, crypto, zlib, dns.lookup) and V8 background work (GC, compilation). Details in Week 2.
5. *What is starvation?* If microtasks (or `nextTick` callbacks) keep scheduling more microtasks, the queue
   never empties, so timers and I/O never run. Same with a never-ending `while` loop.
6. *How is the browser event loop different?* It has rendering steps, `requestAnimationFrame`, and task source
   priorities; Node has phases (timers, poll, check...) and `nextTick`.

**Common mistakes**

- Assuming `setTimeout(0)` runs before promise callbacks.
- Assuming a timer fires exactly at the delay.
- Using `process.nextTick` recursively (starves I/O).
- Believing Node is "multi-threaded for requests".
- Saying "async code runs in parallel with JS". It runs outside JS (OS/thread pool); your JS callbacks still
  run one at a time.

**Revision notes**

- Stack empty -> drain ALL microtasks -> next macrotask.
- Microtasks: promise `then`, `await` continuation, `queueMicrotask`. Node: `nextTick` queue first.
- ESM top-level: promise before `nextTick`; CJS: `nextTick` first. Inside callbacks: `nextTick` first.
- `setTimeout(0)` vs `setImmediate` from main: not guaranteed; from I/O callback: immediate first.

---

### Topic 5.2 - Blocking the event loop and how to avoid it [ESSENTIAL]

**Concept**

Jab tak koi sync function chal raha hai, event loop aage nahi badh sakta. Isko **blocking** kehte hain.

```js
// blocking.mjs
const start = Date.now();
setTimeout(() => console.log("timer fired after >= 100ms:", Date.now() - start >= 100), 0);

while (Date.now() - start < 100) {
  // busy loop: nothing else can run
}
console.log("loop done");
// loop done
// timer fired after >= 100ms: true
```

**Why it matters in backend**

One slow synchronous operation delays **every** request on that process. Typical culprits:

| Culprit | Why it blocks | Mitigation |
|---------|---------------|------------|
| Large `JSON.parse`/`JSON.stringify` | sync CPU work, grows with size | limit body size, stream parse, paginate |
| `fs.readFileSync`, `*Sync` calls after startup | sync disk wait | use `fs/promises` |
| `crypto.pbkdf2Sync`, `bcrypt` sync variants | sync CPU | async versions (they use the thread pool) |
| Heavy loops / sorting millions of items | CPU | chunking, worker threads, offload to DB |
| Regex with catastrophic backtracking (ReDoS) | CPU, attacker-controlled | safe regex, input length limits |
| Big synchronous recursion | CPU + stack | iteration, streaming |

**Internal working: mitigation strategies**

1. **Avoid**: do the work elsewhere (database aggregation, queue worker, separate service).
2. **Chunk and yield**: process in slices and yield with `setImmediate` so I/O can interleave.
3. **Worker threads** (Week 2 / Day 3): run CPU work on another thread with its own event loop.
4. **Streaming** (Week 2 / Days 4-5): process data incrementally.

```js
// chunking.mjs
import { setImmediate as yieldToLoop } from "node:timers/promises";

export async function processInChunks(items, handler, chunkSize = 1000) {
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    for (const item of items.slice(i, i + chunkSize)) {
      results.push(handler(item));
    }
    await yieldToLoop();   // lets timers, I/O, and other requests run between chunks
  }
  return results;
}

const out = await processInChunks(Array.from({ length: 5000 }, (_, i) => i), (n) => n * 2);
console.log(out.length); // 5000
```

Trade-off: chunking keeps the server responsive but does not make the work faster (still one thread). For real
parallel CPU work use worker threads or other processes.

**Measuring the problem [ADVANCED]**: `perf_hooks.monitorEventLoopDelay()` records event loop lag.

```js
// lag.mjs
import { monitorEventLoopDelay } from "node:perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";

const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
await sleep(50);                 // let the sampler start ticking
const t = Date.now();
while (Date.now() - t < 200) {}  // block the loop for 200 ms
await sleep(50);                 // let the sampler record the late tick
h.disable();
console.log("max lag ms:", Math.round(h.max / 1e6)); // roughly 200 (values are in nanoseconds)
```

In production you export p99 event-loop delay as a metric (Week 7); rising lag means something is blocking.

**Starvation demo [ADVANCED]**

```js
// starvation.mjs  (do not run casually: it never lets the timer fire)
// setTimeout(() => console.log("never printed"), 0);
// const loop = () => queueMicrotask(loop);
// loop(); // microtask queue never empties -> the loop never reaches the timers phase
```
Compare with `const loop = () => setImmediate(loop)`, which does let timers and I/O run, because each
`setImmediate` callback is a macrotask.

**Frontend connection**

A long-running event handler freezes the browser tab; you fix it with `requestIdleCallback`, chunking, or Web
Workers. Node equivalents: `setImmediate` chunking and `worker_threads`.

**Real-world scenario**

A banking statement endpoint builds a PDF-like report by sorting and formatting 2 million transactions in JS.
P99 latency of unrelated endpoints spikes when one statement is requested. Solution path: push aggregation to SQL
with pagination, generate reports in a background worker/queue, and add event-loop-lag alerts.

**Interview answer:**

"Because Node runs JavaScript on one thread, any long synchronous operation blocks the event loop and delays
every other request, including health checks. Common causes are large JSON parsing, synchronous file or crypto
APIs, heavy loops, and regular expressions with catastrophic backtracking. I mitigate it by moving heavy work off
the request path with a queue or worker thread, using async APIs that run in the thread pool, streaming large
data, or chunking work and yielding with `setImmediate`. I monitor event loop delay in production to detect
blocking early."

**Follow-up questions**

1. *How do you detect event loop blocking?* Event-loop-delay histogram (`monitorEventLoopDelay`), APM metrics,
   CPU profiles (`--cpu-prof`, `node --inspect`), and the symptom that unrelated endpoints slow down together.
2. *Does `async` make a CPU-bound function non-blocking?* No. `async` only changes the return type. The CPU loop
   inside still holds the thread until it ends.
3. *Why can `setTimeout` callbacks be late?* The loop was busy; timers only fire when the loop gets to the
   timers phase.
4. *Is `await Promise.all(items.map(heavySyncFn))` parallel?* No. The sync function runs for each item one after
   another on the same thread.

**Common mistakes**

- Using `*Sync` APIs in request handlers (fine at startup only).
- Thinking `async function` makes heavy computation async.
- Fixing slowness by adding `await` or `Promise.all` around CPU-bound code.
- Not limiting request body size / pagination so one request can take large CPU time.

**Revision notes**

- One synchronous function can freeze the whole server.
- Fixes: avoid, chunk with `setImmediate`, workers, streams, queues.
- Measure event loop lag.

---

### Topic 5.3 - Timers and ordering details worth knowing [ESSENTIAL, brief]

- `setTimeout(fn, delay)`: "no earlier than `delay`"; delay clamps to a minimum of 1 ms in Node; ties run in
  insertion order for the same delay.
- `setInterval` can drift and overlap if the callback is slower than the interval (use recursive `setTimeout`
  after the work completes if you need "no overlap").
- `clearTimeout`/`clearInterval` should be called on shutdown. Timers keep the process alive; `timer.unref()`
  lets the process exit if only unref'd timers remain.
- Timer callbacks for different delays are ordered by their **expiry time**: `10ms`, `5ms`, `0ms` run as
  `0ms`, `5ms`, `10ms`.
- Promises: after `await sleep(0)` the continuation runs after a macrotask turn (timer), unlike `await null`
  (microtask).

```js
// timers.mjs
const t = setInterval(() => console.log("tick"), 1000);
t.unref();                       // do not keep the process alive for this timer
setTimeout(() => console.log("done"), 20);
// process exits after "done" (no 'tick' printed) because only an unref'd interval remains
```

**Interview answer:**

"`setTimeout` guarantees a minimum delay, not an exact one, since the callback must wait for the call stack to be
empty and the loop to reach the timers phase. For polling work that must not overlap, I use a recursive
`setTimeout` scheduled after the previous run finishes rather than `setInterval`, and I clear or unref timers so
they do not keep the process alive during shutdown."

---

### Day 5 - Output-prediction questions

Run these as ES modules. Exact orders below were verified on Node 20; they match Node 22.

**P5.1**
```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
```
<details><summary>Answer</summary>

```text
1
4
3
2
```
Sync first (`1`, `4`), then microtasks (`3`), then the macrotask (`2`).
</details>

**P5.2**
```js
async function a() { console.log("a1"); await b(); console.log("a2"); }
async function b() { console.log("b"); }
console.log("s");
a();
console.log("e");
```
<details><summary>Answer</summary>

```text
s
a1
b
e
a2
```
`a()` runs synchronously until its first `await`; `b()` also runs synchronously and prints `b`. The continuation
`a2` is a microtask that runs after the sync code `e`.
</details>

**P5.3**
```js
setTimeout(() => console.log("T1"), 0);
Promise.resolve().then(() => {
  console.log("P1");
  setTimeout(() => console.log("T2"), 0);
  Promise.resolve().then(() => console.log("P2"));
});
setTimeout(() => console.log("T3"), 0);
console.log("sync");
```
<details><summary>Answer</summary>

```text
sync
P1
P2
T1
T3
T2
```
After the sync code, the microtask drain runs `P1`, which queues `P2` (same drain, so it runs before any timer)
and a new timer `T2`. Then timers run in order of scheduling: `T1`, `T3`, `T2`.
</details>

**P5.4**
```js
Promise.resolve().then(() => console.log(1)).then(() => console.log(2));
Promise.resolve().then(() => console.log(3)).then(() => console.log(4));
```
<details><summary>Answer</summary>

`1 3 2 4`. Each `then` queues its follow-up only after it runs, so the two chains interleave one step at a
time.
</details>

**P5.5**
```js
console.log(1);
(async () => {
  console.log(2);
  await null;
  console.log(3);
})();
Promise.resolve().then(() => console.log(4));
console.log(5);
```
<details><summary>Answer</summary>

```text
1
2
5
3
4
```
The async function runs synchronously to `await null`, queueing its continuation first; the `then` handler is
queued second. Microtasks run FIFO: `3` then `4`.
</details>

**P5.6**
```js
setTimeout(() => console.log("a"), 10);
setTimeout(() => console.log("b"), 5);
setTimeout(() => console.log("c"), 0);
```
<details><summary>Answer</summary>

`c b a`. Timers fire in order of their expiry time, not the order they were written.
</details>

**P5.7 (nextTick vs promise inside a callback)**
```js
setTimeout(() => {
  Promise.resolve().then(() => console.log("promise"));
  process.nextTick(() => console.log("nextTick"));
  console.log("sync");
}, 0);
```
<details><summary>Answer</summary>

```text
sync
nextTick
promise
```
After the callback finishes, Node drains the `nextTick` queue before the promise microtask queue.
</details>

**P5.8 (nextTick vs promise at the top level, module-system dependent)**
```js
// order.mjs  versus  order.cjs (same body in a CommonJS file)
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));
console.log("sync");
```
<details><summary>Answer</summary>

As `.mjs`: `sync`, `promise`, `nextTick`. As `.cjs`: `sync`, `nextTick`, `promise`. In ESM the module body is
itself evaluated inside a microtask (promise job), so the promise queue is already draining when the body
finishes and the newly queued promise reaction runs before the `nextTick` queue is processed. Most interviewers
expect the CommonJS answer ("nextTick before promises"); mention the ESM nuance for bonus points and always say
"verify by running".
</details>

**P5.9**
```js
import fs from "node:fs";
fs.readFile(import.meta.filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
```
<details><summary>Answer</summary>

`immediate` then `timeout`, always. We are in the poll phase (I/O callback); the check phase (where immediates
run) comes right after, before the loop returns to the timers phase.
</details>

**P5.10**
```js
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
```
<details><summary>Answer</summary>

Not deterministic from the main module. Commonly `timeout` first on fast machines, but `immediate` first is also
valid (when the loop starts in under 1 ms the timer has not expired yet). Interview answer: "order is not
guaranteed; inside an I/O callback `setImmediate` always wins." (Both orders occur in practice; a run on Node 20 printed `immediate` then `timeout`.)
</details>

**P5.11**
```js
const start = Date.now();
setTimeout(() => console.log("timer", Date.now() - start >= 100), 0);
while (Date.now() - start < 100) {}
console.log("loop done");
```
<details><summary>Answer</summary>

```text
loop done
timer true
```
The timer cannot fire until the busy loop returns control; it fires late (after at least 100 ms).
</details>

**P5.12**
```js
Promise.resolve().then(() => { console.log(1); return Promise.resolve(2); }).then((v) => console.log(v));
Promise.resolve().then(() => console.log(3))
  .then(() => console.log(4))
  .then(() => console.log(5))
  .then(() => console.log(6));
```
<details><summary>Answer</summary>

`1 3 4 5 2 6` (one per line). Returning a promise from a handler costs about two extra microtask ticks, so `2`
arrives after `5`.
</details>

**P5.13**
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
(async () => {
  console.log("C");
  await new Promise((r) => setTimeout(r, 0));
  console.log("D");
})();
Promise.resolve().then(() => console.log("E"));
process.nextTick(() => console.log("F"));
console.log("G");
```
<details><summary>Answer</summary>

Sync: `A C G`. Then (CommonJS ordering, nextTick before promises): `F E`. In an ES module the order of `E` and `F`
swaps (`E F`, see P5.8). Then timers in scheduling order: `B`, then the promise timer resolves and `D` runs
after `B`. CommonJS: `A C G F E B D`. ES module: `A C G E F B D`. The `await` on a timer-based promise waits
for a macrotask, so `D` comes after `B`.
</details>

---

### Day 5 - Coding exercises

**Exercise 5.1 - Predict and then write `sleep`**

Write `sleep(ms)` using `setTimeout` and a promise (no libraries). Then print the order produced by:
`await sleep(0); console.log("after sleep")` interleaved with a `queueMicrotask` and a `setImmediate`.

<details><summary>Solution and explanation</summary>

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

queueMicrotask(() => console.log("microtask"));
setImmediate(() => console.log("immediate"));
console.log("sync");
await sleep(0);
console.log("after sleep");
// sync, microtask, then immediate/after sleep (relative order of these two is timing dependent)
```
Point: `await sleep(0)` resumes after a timer macrotask, so it is later than microtasks; its order relative to
`setImmediate` from the main module is not guaranteed.
</details>

**Exercise 5.2 - Non-blocking sum of primes**

Write `sumPrimes(limit)` as an async function that processes numbers in batches of 5,000 and yields to the event
loop between batches. Prove responsiveness by running a `setInterval` that logs every 10 ms and showing it
interleaves (use a limit big enough to take ~100+ ms on your machine).

<details><summary>Solution and explanation</summary>

```js
import { setImmediate as yieldToLoop } from "node:timers/promises";

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

export async function sumPrimes(limit, batch = 5000) {
  let sum = 0;
  for (let n = 0; n < limit; n += batch) {
    const end = Math.min(n + batch, limit);
    for (let i = n; i < end; i++) if (isPrime(i)) sum += i;
    await yieldToLoop(); // let timers/I/O run between batches
  }
  return sum;
}

const ticker = setInterval(() => console.log("tick"), 10);
console.log("sum:", await sumPrimes(2_000_000));
clearInterval(ticker);
```
Without the `await yieldToLoop()` the interval would never print until the whole sum finished. Trade-off:
total CPU time is the same (slightly more due to yielding); use worker threads for true parallelism.
</details>

**Exercise 5.3 - Scheduler order puzzle (write the expected output before running)**

```js
console.log("start");
setTimeout(() => console.log("timeout 1"), 0);
setImmediate(() => console.log("immediate"));
process.nextTick(() => console.log("tick 1"));
Promise.resolve().then(() => {
  console.log("promise 1");
  process.nextTick(() => console.log("tick 2"));
}).then(() => console.log("promise 2"));
console.log("end");
```
<details><summary>Solution and explanation</summary>

Sync: `start`, `end` in both module systems. After that the module system matters (verified on Node 20):

```text
ES module                     CommonJS
start                         start
end                           end
promise 1                     tick 1
promise 2                     promise 1
tick 1                        promise 2
tick 2                        tick 2
immediate                     timeout 1 / immediate (main-module order not guaranteed)
timeout 1
```

Reasoning (CommonJS): after the main script, the `nextTick` queue runs first (`tick 1`), then promise
microtasks: `promise 1` runs and queues `tick 2` (nextTick queue) and `promise 2` (same microtask drain), so
`promise 2` runs before `tick 2`. Reasoning (ESM): the promise queue is already being drained when the module
body finishes, so both promise handlers run first, then the nextTick queue (`tick 1`, `tick 2`). Then the
macrotasks: `timeout 1` vs `immediate` from the main module is not guaranteed. Skill being tested: reasoning with
*two* queues instead of memorising answers. Always verify by running.
</details>


**Exercise 5.4 - Non-overlapping poller**

Write `poll(fn, intervalMs, signal)` that calls `fn`, waits `intervalMs` after it finishes (not after it
starts), and stops when `signal.aborted`. Why is this better than `setInterval` for slow tasks?

<details><summary>Solution and explanation</summary>

```js
import { setTimeout as sleep } from "node:timers/promises";

export async function poll(fn, intervalMs, signal) {
  while (!signal.aborted) {
    try {
      await fn();
    } catch (err) {
      console.error("poll error:", err.message); // keep polling; decide per use case
    }
    try {
      await sleep(intervalMs, undefined, { signal }); // abortable sleep
    } catch (e) {
      if (e.name === "AbortError") return;
      throw e;
    }
  }
}

const ac = new AbortController();
setTimeout(() => ac.abort(), 350);
await poll(async () => console.log("work"), 100, ac.signal);
```
`setInterval` would start a new run every interval even if the last is still running, so slow tasks overlap and
pile up. This loop guarantees at most one run at a time.
</details>

---

### Day 5 - Wrap-up

**Key concepts to remember**

1. Run to completion -> drain all microtasks -> next macrotask.
2. Microtasks: promise handlers, `await` continuations, `queueMicrotask`. Node: `nextTick` queue goes first.
3. `setTimeout(0)` is "after at least ~1 ms and after the stack and microtasks"; timers are not exact.
4. Sync CPU work blocks every request; async does not fix CPU-bound code.
5. Mitigations: avoid, chunk + yield, worker threads, streams, queues; monitor event loop delay.

**Five revision questions**

1. Explain the event loop with one diagram and the "run to completion, drain microtasks" rule.
2. What is the output order of `setTimeout`, `Promise.then`, `process.nextTick`, `setImmediate` and sync code?
3. Why do `await null` and `await sleep(0)` resume at different times?
4. How would you find and fix a blocked event loop in production?
5. Is Node single-threaded? Give the precise answer (JS thread vs libuv thread pool vs OS).

**One practical coding task**

Create `order-lab.mjs` with 10 mixed snippets (timers, promises, nextTick, await) of your own. Write the
predicted order as comments first, run, and mark each as [OK]/[X]. Re-explain every [X]. Time-box: 30 minutes.

**Self-assessment checklist**

- [ ] I can state the event loop rule in one sentence and draw it.
- [ ] I can explain `nextTick` vs promise vs `setImmediate` vs `setTimeout` ordering (and the ESM caveat).
- [ ] I can explain blocking with an example and three fixes.
- [ ] I predicted at least 10 of 13 questions P5.1-P5.13 correctly before running.
- [ ] I understand that deeper libuv phases and the thread pool come in Week 2.

---

## Day 6 - Promise combinators and common async mistakes

**Learning objectives**

By the end of Day 6 you should be able to:

1. State the exact behavior of `Promise.all`, `allSettled`, `race`, and `any` for success, failure, and empty input.
2. Choose the right combinator for a backend scenario (dashboard aggregation, fallback mirrors, timeouts, batch jobs).
3. Explain what "fail-fast" does and does not do (the other promises keep running).
4. Implement concurrency limiting, retry with exponential backoff, and cancellation with `AbortSignal`.
5. Spot and fix the 12 most common async mistakes, including `forEach(async ...)`, floating promises, and
   read-modify-write races across `await`.

**Time plan (about 2 hours):** Topic 6.1 (35 min), 6.2 (35 min), predictions (25 min), exercises (25 min).

---

### Topic 6.1 - `Promise.all`, `allSettled`, `race`, `any` [ESSENTIAL]

**Concept**

Jab multiple independent promises hon, to unhe ek saath start karke combine karne ke liye 4 static methods hain.
Sab ek iterable lete hain (non-promise values bhi chalte hain, unhe `Promise.resolve` kar diya jaata hai) aur ek
naya promise return karte hain.

| Method | Fulfils when | Rejects when | Fulfilment value | Empty input `[]` |
|--------|-------------|--------------|------------------|------------------|
| `Promise.all` | **all** fulfil | **first** rejection (fail-fast) | array of values, **in input order** | fulfils `[]` |
| `Promise.allSettled` | **all** settle (never rejects) | never | array of `{status, value}` / `{status, reason}`, input order | fulfils `[]` |
| `Promise.race` | **first to settle** fulfils | **first to settle** rejects | that value | **never settles** (pending forever) |
| `Promise.any` | **first to fulfil** | **all** reject -> `AggregateError` | that value | rejects with `AggregateError` |

Static `Promise.any` and `allSettled` are in Node 12.9+/15+; safe on Node 20/22.

**Why it matters in backend**

- Latency: calling 3 independent services in parallel makes the response as slow as the slowest, not the sum.
- Resilience: `allSettled` lets a dashboard return partial data; `any` supports "first successful mirror".
- Interview classic: "when would you use allSettled instead of all?" and "does `Promise.all` cancel the others?"

**Internal working**

All four subscribe to every input promise with `then`. They keep a counter/array of results indexed by input
position (that is why `all` preserves order even when completion order differs). They settle their own promise
once, using the "first settle wins" rule; later results are ignored by the combinator, but the **input promises
keep running** (no cancellation exists) and their side effects still happen. Also, `all` attaches handlers to
every input, so later rejections of the other inputs are marked as handled and do **not** become unhandled
rejections.

```js
// combinators.mjs
const ok = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const fail = (m, ms) => new Promise((_, rej) => setTimeout(() => rej(new Error(m)), ms));

// all: ordered values; rejects fast on first failure
console.log(await Promise.all([ok("a", 30), ok("b", 10), 3]));          // [ 'a', 'b', 3 ]
await Promise.all([ok("a", 100), fail("x", 20), ok("c", 10)])
  .catch((e) => console.log("all rejected:", e.message));               // all rejected: x (after ~20 ms)

// allSettled: never rejects, gives every outcome
const settled = await Promise.allSettled([ok("a", 10), fail("x", 20), 7]);
console.log(settled);
// [
//   { status: 'fulfilled', value: 'a' },
//   { status: 'rejected', reason: Error: x ... },
//   { status: 'fulfilled', value: 7 }
// ]

// race: first to settle (success OR failure) wins
console.log(await Promise.race([ok("slow", 100), ok("fast", 10)]));     // fast
await Promise.race([fail("boom", 10), ok("late", 50)])
  .catch((e) => console.log("race rejected:", e.message));              // race rejected: boom

// any: first success; rejections ignored until all fail
console.log(await Promise.any([fail("a", 10), ok("b", 50), fail("c", 20)])); // b
await Promise.any([fail("a", 10), fail("c", 20)]).catch((e) => {
  console.log(e.constructor.name, "-", e.message); // AggregateError - All promises were rejected
  console.log(e.errors.map((x) => x.message));      // [ 'a', 'c' ]
});

// empty inputs
console.log(await Promise.all([]), await Promise.allSettled([]));      // [] []
await Promise.any([]).catch((e) => console.log(e.constructor.name));    // AggregateError
// Promise.race([]) returns a promise that stays pending forever
```

**Real patterns**

```js
// patterns-combinators.mjs
import { setTimeout as sleep } from "node:timers/promises";

// 1) Parallel independent reads (dashboard)
async function loadDashboard(userId, svc) {
  const [profile, orders, balance] = await Promise.all([
    svc.getProfile(userId),
    svc.getOrders(userId),
    svc.getBalance(userId),
  ]);
  return { profile, orders, balance };
}

// 2) Partial success: optional widgets must not break the page
async function loadDashboardResilient(userId, svc) {
  const [profile, orders, recs] = await Promise.allSettled([
    svc.getProfile(userId),     // required
    svc.getOrders(userId),      // required
    svc.getRecommendations(userId), // optional
  ]);
  if (profile.status === "rejected") throw profile.reason; // required failed -> fail
  if (orders.status === "rejected") throw orders.reason;
  return {
    profile: profile.value,
    orders: orders.value,
    recommendations: recs.status === "fulfilled" ? recs.value : [], // degrade gracefully
  };
}

// 3) Hedged/fallback request: first healthy mirror wins
async function fetchFromMirrors(urls, fetchOne) {
  return Promise.any(urls.map((u) => fetchOne(u)));
}

// 4) Timeout with race (does not cancel work: see AbortSignal below)
const withTimeout = (p, ms) =>
  Promise.race([p, sleep(ms).then(() => { throw new Error("timeout"); })]);

// demo
const svc = {
  getProfile: async () => ({ name: "Asha" }),
  getOrders: async () => [{ id: 1 }],
  getRecommendations: async () => { throw new Error("recs service down"); },
};
console.log(await loadDashboardResilient(7, svc));
// { profile: { name: 'Asha' }, orders: [ { id: 1 } ], recommendations: [] }
```

**Cancellation with `AbortSignal`** (Node 18+/20+/22)

```js
// abort.mjs
// AbortSignal.timeout(ms) creates a signal that aborts itself; fetch and many Node APIs accept `signal`.
try {
  const res = await fetch("https://example.com/", { signal: AbortSignal.timeout(2000) });
  console.log(res.status);
} catch (err) {
  // err.name is "TimeoutError" (timeout) or "AbortError" (manual abort); also network errors
  console.log("request failed:", err.name);
}

// Combine: user cancel OR timeout (AbortSignal.any: Node 20.3+)
const userCancel = new AbortController();
const signal = AbortSignal.any([userCancel.signal, AbortSignal.timeout(5000)]);
```

`Promise.race` timeout stops waiting but the request continues using sockets and memory; `AbortSignal` actually
cancels the work. Always prefer signals when the API supports them (`fetch`, `fs/promises`, `timers/promises`,
`child_process`, many DB drivers).

**Concurrency limiting**: `Promise.all(items.map(fn))` with 10,000 items starts 10,000 operations **at once**,
which can exhaust a DB pool (default pool ~10 connections), file descriptors, or an external API's rate limit.

```js
// map-limit.mjs
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;                 // synchronous increment: safe, no await between read and write
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);           // first failure rejects; other workers continue their current item
  return results;                       // input order preserved
}

import { setTimeout as sleep } from "node:timers/promises";
let active = 0, peak = 0;
const out = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
  active++; peak = Math.max(peak, active);
  await sleep(20);
  active--;
  return n * 10;
});
console.log(out, "peak concurrency:", peak); // [ 10, 20, 30, 40, 50, 60 ] peak concurrency: 2
```

Alternatives: batch with `chunk` + `Promise.all` per chunk (simple but wastes time waiting for the slowest in each
chunk), or the `p-limit` library. Understand the worker-pool pattern above for interviews.

**Retry with exponential backoff and jitter** (preview; full treatment in Week 6)

```js
// retry.mjs
import { setTimeout as sleep } from "node:timers/promises";

export async function retry(fn, { retries = 3, baseMs = 100, maxMs = 2000, shouldRetry = () => true } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      const backoff = Math.min(maxMs, baseMs * 2 ** attempt);   // 100, 200, 400, ...
      const jitter = Math.random() * backoff;                   // "full jitter" avoids thundering herd
      await sleep(jitter);
      attempt++;
    }
  }
}

let calls = 0;
const flaky = async () => { if (++calls < 3) throw new Error("503"); return "ok"; };
console.log(await retry(flaky, { retries: 5, baseMs: 10 }), "after", calls, "calls"); // ok after 3 calls
```

Only retry **idempotent** operations or operations protected by an idempotency key (Week 6): retrying a payment
charge blindly can double-charge.

**Frontend connection**

`Promise.all` is what you use to fire several `fetch` calls on page load; `allSettled` is for widgets that may
fail independently; `AbortController` is the same one you use in `useEffect` cleanup to cancel requests. React
Query's retry with backoff is the same algorithm.

**Real-world scenario**

Marketplace product page: `getProduct`, `getSellerInfo`, `getReviews`, `getRecommendations`. Product and seller are
required, reviews and recommendations optional. Use `Promise.all` for the required pair and `allSettled` for
optional parts (or one `allSettled` with a post-check). Add per-call timeouts via `AbortSignal.timeout(800)`, so one
slow service does not blow the page SLA.

**Interview answer:**

"`Promise.all` starts nothing itself; it combines promises that are already running. It fulfils with an array of
results in input order when all fulfil and rejects immediately with the first rejection, but the other
operations are not cancelled. `Promise.allSettled` waits for everything and returns status objects, so it is
the right tool for partial results. `Promise.race` settles with the first promise to settle, success or failure,
and I use it with a timer for timeouts, although real cancellation needs an `AbortSignal`. `Promise.any`
fulfils with the first success and rejects with an `AggregateError` only if all fail, which suits redundant
sources. For large lists I limit concurrency with a worker pool so I do not exhaust database connections or
trigger rate limits."

**Follow-up questions**

1. *Does `Promise.all` run promises in parallel?* The work is already running in parallel (or concurrently via
   the event loop/OS); `all` just waits. JavaScript callbacks still execute one at a time.
2. *What happens to the other promises when one rejects in `all`?* They continue; their results are ignored; their
   later rejections do not cause unhandled-rejection errors because `all` attached handlers.
3. *`race` vs `any`?* `race` settles on the first settled promise (a fast failure wins); `any` ignores failures
   until one success exists.
4. *How do you run async tasks sequentially?* `for...of` with `await`, or `reduce` chaining; use when order
   or dependency matters.
5. *How would you limit concurrency?* Worker pool with a shared index (`mapLimit`), batches, or `p-limit`.
6. *What does `AggregateError.errors` contain?* The array of rejection reasons in input order.
7. *How do you get a timeout that really cancels?* `AbortSignal.timeout(ms)` passed as `signal` to the
   operation; the operation must support it.

**Common mistakes**

- Using `all` when partial success is acceptable (one optional failure kills the response).
- Using `race` for timeouts and believing the slow work stops.
- Unbounded `Promise.all(items.map(...))` against a DB or API.
- Forgetting `Promise.race([])` never settles.
- Assuming order of completion equals order of results (results are in input order; completion order is not).
- Starting promises, then awaiting sequentially after one has rejected (unhandled rejection window).

**Revision notes**

- all: fail-fast, ordered. allSettled: never rejects. race: first settle. any: first success, `AggregateError`.
- Empty: `all`/`allSettled` -> `[]`, `race` -> pending forever, `any` -> `AggregateError`.
- No cancellation: use `AbortSignal`. Limit concurrency. Retry only idempotent work.

---

### Topic 6.2 - Common asynchronous mistakes (and fixes) [ESSENTIAL]

Yeh section interview ka "spot the bug" round hai. Har mistake ke liye: bug, kyun hota hai, fix.

**Mistake 1: `async` callback inside `forEach`**

```js
// bad
async function bad(items) {
  items.forEach(async (item) => {
    await save(item);          // forEach ignores the returned promise
  });
  console.log("all saved");    // prints BEFORE the saves finish; errors become unhandled rejections
}
// good (sequential)
async function goodSeq(items) {
  for (const item of items) await save(item);
}
// good (parallel, bounded if needed)
async function goodPar(items) {
  await Promise.all(items.map((item) => save(item)));
}
```
Same for `filter`, `reduce`, `some`, `every`: callbacks returning promises (always truthy) break them.

**Mistake 2: sequential `await` for independent work** (see Day 4: ~sum vs ~max latency).

**Mistake 3: floating promise (missing `await`/`catch`)**

```js
async function handler(req) {
  sendAuditLog(req);            // returns a promise; if it rejects -> unhandled rejection -> process may crash
  await doWork(req);
}
// fix: await it, or deliberately detach with a catch
sendAuditLog(req).catch((err) => logger.error({ err }, "audit log failed"));
```
Tooling: ESLint rule `@typescript-eslint/no-floating-promises` (works with TS) or `no-misused-promises`.

**Mistake 4: `try/catch` without `await`** (Day 4, P4.6) and `return` vs `return await` in `try`.

**Mistake 5: forgetting `return` in `.then`** (Day 4, P4.3).

**Mistake 6: the explicit-construction anti-pattern**

```js
// bad: wrapping a promise in new Promise, and swallowing errors
function getUser(id) {
  return new Promise(async (resolve) => {      // async executor: thrown errors are NOT turned into rejection
    const u = await db.find(id);               // if this throws -> unhandled rejection, outer promise hangs forever
    resolve(u);
  });
}
// good
async function getUser2(id) {
  return db.find(id);
}
```

**Mistake 7: read-modify-write race across `await`** (lost update)

```js
// race.mjs
import { setTimeout as sleep } from "node:timers/promises";
let counter = 0;
async function inc() {
  const current = counter;      // read
  await sleep(0);               // any I/O (DB call) yields control: other tasks run here
  counter = current + 1;        // write based on stale read
}
await Promise.all([inc(), inc(), inc()]);
console.log(counter);           // 1  (expected 3)
```
JS has no data races on memory (single thread), but it has **logical races** whenever `await` sits between a
read and a dependent write. With databases this is the "double spend" bug: `SELECT balance`, check in JS,
`UPDATE balance` allows two concurrent withdrawals to both pass the check. Fixes: do it atomically in SQL
(`UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?` and check `affectedRows`),
use transactions with row locks (`SELECT ... FOR UPDATE`, Week 4), or serialise access with a mutex/queue.

**Mistake 8: unbounded concurrency** (`Promise.all` over 50,000 items -> pool exhaustion, `EMFILE`, 429s). Use
`mapLimit`/batches.

**Mistake 9: no timeout and no cancellation**: a hung upstream holds the request forever, and memory/sockets
pile up. Always set client timeouts (`AbortSignal.timeout`, DB driver `connectTimeout`/`queryTimeout`).

**Mistake 10: swallowing errors**

```js
try { await chargeCard(); } catch (e) { console.log(e); }  // logs, then continues as if payment succeeded
```
Handle or rethrow. A catch that continues must be a conscious decision.

**Mistake 11: async errors in callbacks and event emitters**

```js
emitter.on("order", async (o) => { await process(o); });   // rejection -> unhandled, emitter ignores promises
// fix: wrap handler body in try/catch that logs/forwards, or use events.once / captureRejections option
```
`new EventEmitter({ captureRejections: true })` routes rejected async listeners to the `'error'` event
(Week 2). Likewise `setTimeout(async () => {...})` and `array.forEach(async ...)`.

**Mistake 12: mixing callbacks, promises, and `await` in one function** (double-callbacks, errors escape).
Promisify at the boundary; keep one style inside a module.

**Mistake 13 [ADVANCED]: swallowed `Promise.all` follow-up work**: after the first rejection, remaining operations
still write to DB/files; use `AbortSignal` and compensating logic if partial work must be undone (Week 7
payments).

**Mistake 14: Express 4 async handlers** (Week 3 preview)

```js
// Express 4: a rejected promise in an async handler is NOT passed to the error middleware (request hangs).
app.get("/x", async (req, res) => { throw new Error("oops"); });
// Express 5 (this course): rejected promises from handlers are forwarded to the error handler automatically.
// Express 4 needs: try/catch + next(err), or a wrapper (asyncHandler).
```

**Frontend connection**

Race conditions across `await` are the same as stale responses in a React search box (older request resolves
later and overwrites newer state, so people use `AbortController` or request ids). `forEach(async)` is the same
mistake in both worlds. In the backend, the damage is data corruption instead of a wrong UI.

**Real-world scenario**

Wallet debit endpoint: `const w = await getWallet(id); if (w.balance < amt) throw ...; await setBalance(id,
w.balance - amt);`. Two simultaneous requests for 80 on a balance of 100 both read 100, both pass the check, and
both write 20: the user spent 160. Fix with an atomic conditional `UPDATE` or a transaction with `FOR UPDATE`
(Week 4 / Day 4-5; Week 7 payments design).

**Interview answer:**

"The mistakes I watch for are: using `forEach` or other array callbacks with `async` functions, because they
ignore the returned promises; leaving promises floating without `await` or `catch`, which causes unhandled
rejections; using `await` sequentially for independent calls; unbounded `Promise.all` on large inputs; no
timeout or cancellation on outbound calls; and read-modify-write races where an `await` sits between reading
and writing shared state. The last one is especially dangerous with databases, so I make the check and update
atomic in SQL or use transactions with locks rather than checking in JavaScript."

**Follow-up questions**

1. *Can JavaScript have race conditions without threads?* Yes, logical ones: interleaving of async tasks at
   `await` points between a read and a dependent write.
2. *How do you make a check-then-act safe with a DB?* Atomic statement (`UPDATE ... WHERE balance >= ?`),
   transaction with `SELECT ... FOR UPDATE`, optimistic locking with a version column, or unique constraints.
3. *What does a linter catch here?* `no-floating-promises`, `no-misused-promises`, `require-await`,
   `no-async-promise-executor`, `prefer-promise-reject-errors`.
4. *Why is `async` inside `new Promise(...)` executors bad?* Errors thrown inside become unhandled rejections
   and the outer promise never settles.
5. *Does `await` inside `for...of` run sequentially?* Yes, deliberately; use when order matters or concurrency
   must be 1.

**Common mistakes (meta)**

- Fixing symptoms with `setTimeout` delays instead of correct sequencing.
- Wrapping everything in `try/catch` that returns `null`.
- Disabling the unhandled-rejection crash instead of fixing the bug.

**Revision notes**

- Never `forEach(async)`. Never leave floating promises. Await dependent work, parallelise independent work.
- Bound concurrency. Always timeouts. Logical races across `await`: use atomic DB operations.
- Handle errors at a boundary; do not swallow.

---

### Day 6 - Output-prediction questions

Helpers used below:

```js
const ok = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const fail = (m, ms) => new Promise((_, rej) => setTimeout(() => rej(new Error(m)), ms));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
```

**P6.1**
```js
Promise.all([ok("a", 100), fail("x", 50), ok("c", 10)])
  .then(console.log)
  .catch((e) => console.log("err", e.message));
```
<details><summary>Answer</summary>

`err x` after about 50 ms. `all` rejects with the first rejection; it does not wait for `a`.
</details>

**P6.2**
```js
const r = await Promise.allSettled([ok(1, 10), fail("no", 5), 3]);
console.log(r.map((x) => x.status + ":" + (x.value ?? x.reason.message)).join(" | "));
```
<details><summary>Answer</summary>

`fulfilled:1 | rejected:no | fulfilled:3`. Results are in input order, not completion order.
</details>

**P6.3**
```js
console.log(await Promise.race([ok("slow", 100), ok("fast", 10)]));
await Promise.race([fail("boom", 10), ok("ok", 50)]).catch((e) => console.log("rejected", e.message));
```
<details><summary>Answer</summary>

```text
fast
rejected boom
```
`race` takes the first promise to settle, even if it is a rejection.
</details>

**P6.4**
```js
console.log(await Promise.any([fail("a", 10), ok("b", 50), fail("c", 20)]));
await Promise.any([fail("a", 10), fail("c", 20)]).catch((e) =>
  console.log(e.constructor.name, e.errors.map((x) => x.message), e.message));
```
<details><summary>Answer</summary>

```text
b
AggregateError [ 'a', 'c' ] All promises were rejected
```
</details>

**P6.5**
```js
[1, 2, 3].forEach(async (i) => {
  await sleep(10);
  console.log("done", i);
});
console.log("after forEach");
```
<details><summary>Answer</summary>

```text
after forEach
done 1
done 2
done 3
```
`forEach` does not wait for the returned promises.
</details>

**P6.6**
```js
console.log(await Promise.all([]));
console.log(await Promise.allSettled([]));
const result = await Promise.any([]).catch((e) => e.constructor.name);
console.log(result);
```
<details><summary>Answer</summary>

```text
[]
[]
AggregateError
```
(And `await Promise.race([])` would never continue: the program would end without printing further.)
</details>

**P6.7**
```js
console.log([1, 2].map(async (x) => x * 2));
```
<details><summary>Answer</summary>

`[ Promise { 2 }, Promise { 4 } ]`. The async callbacks have no `await`, so their promises are already fulfilled
when printed. `map(async ...)` returns an array of promises, not values: use `await Promise.all(...)`.
</details>

**P6.8**
```js
console.log(await Promise.all([1, Promise.resolve(2), ok(3, 5)]));
```
<details><summary>Answer</summary>

`[ 1, 2, 3 ]`. Non-promise values are wrapped automatically.
</details>

**P6.9**
```js
let counter = 0;
async function inc() {
  const c = counter;
  await sleep(0);
  counter = c + 1;
}
await Promise.all([inc(), inc(), inc()]);
console.log(counter);
```
<details><summary>Answer</summary>

`1`. All three read `0` before any writes; each writes `1` (lost updates).
</details>

**P6.10**
```js
const t = Date.now();
await Promise.race([sleep(50), sleep(500)]);
console.log(Date.now() - t < 200);
await new Promise((r) => setTimeout(r, 600)); // wait so the other timer finishes too
```
<details><summary>Answer</summary>

`true`. `race` resolves after the first timer (about 50 ms). The 500 ms timer keeps running; it is not cancelled.
</details>

**P6.11**
```js
const results = [];
await Promise.all([3, 1, 2].map(async (n) => {
  await sleep(n * 10);
  results.push(n);
}));
console.log(results);
const mapped = await Promise.all([3, 1, 2].map(async (n) => { await sleep(n * 10); return n; }));
console.log(mapped);
```
<details><summary>Answer</summary>

```text
[ 1, 2, 3 ]
[ 3, 1, 2 ]
```
Pushing records **completion order**; the values returned through `Promise.all` keep **input order**.
</details>

**P6.12**
```js
const p = Promise.reject(new Error("x"));
setTimeout(() => p.catch(() => console.log("late catch")), 0);
```
<details><summary>Answer</summary>

On Node 15+ the process crashes with the unhandled rejection error (exit code 1) before the timer callback runs,
because no handler was attached by the time the microtask queue drained after the main script. Attach handlers
synchronously (or at least before the current tick ends).
</details>

**P6.13**
```js
async function f() {
  try {
    await Promise.all([fail("A", 10), fail("B", 20)]);
  } catch (e) {
    console.log("caught", e.message);
  }
  await sleep(50);
  console.log("end");
}
await f();
```
<details><summary>Answer</summary>

```text
caught A
end
```
`B` also rejects later, but `Promise.all` already attached a handler to it, so there is no unhandled rejection.
</details>

---

### Day 6 - Coding exercises

**Exercise 6.1 - Implement `Promise.all`**

Write `myAll(iterable)` with the same semantics: input order, fail-fast, non-promise values allowed, empty
iterable fulfils `[]`.

<details><summary>Solution and explanation</summary>

```js
export function myAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;                 // store by index to keep input order
        if (--remaining === 0) resolve(results);
      }, reject);                           // first rejection wins; later calls are no-ops
    });
  });
}
console.log(await myAll([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 10))])); // [ 1, 2, 3 ]
```
Concepts: closure over `results/remaining`, "first settle wins", and `Promise.resolve` normalising non-promises.
Time O(n), space O(n).
</details>

**Exercise 6.2 - Implement `allSettled` and `any` using only `then`**

<details><summary>Solution and explanation</summary>

```js
export function myAllSettled(iterable) {
  return Promise.all(
    Array.from(iterable, (p) =>
      Promise.resolve(p).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason }),
      ),
    ),
  );
}

export function myAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const errors = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return reject(new AggregateError([], "All promises were rejected"));
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (err) => {
        errors[i] = err;
        if (--remaining === 0) reject(new AggregateError(errors, "All promises were rejected"));
      });
    });
  });
}
```
`allSettled` is `all` over promises that never reject (each is converted to a status object). `any` is the mirror
of `all`: resolve on first success, reject when everything has failed.
</details>

**Exercise 6.3 - Concurrency-limited fetcher with fail-soft results**

Write `fetchAll(urls, fetchOne, limit)` returning `[{ url, ok: true, value } | { url, ok: false, error }]` in input
order, never rejecting, with at most `limit` calls active at once.

<details><summary>Solution and explanation</summary>

```js
export async function fetchAll(urls, fetchOne, limit = 3) {
  const results = new Array(urls.length);
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      const url = urls[i];
      try {
        results[i] = { url, ok: true, value: await fetchOne(url) };
      } catch (error) {
        results[i] = { url, ok: false, error: error.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, urls.length) }, worker));
  return results;
}
```
Because each worker catches its own errors, `Promise.all` over workers never rejects, and one bad URL does not stop
the others. Note `while (next < urls.length) { const i = next++ }` has no `await` between check and increment, so
no logical race.
</details>

**Exercise 6.4 - Retry only when it is safe**

Extend `retry` so that it retries only on errors with `err.retryable === true` (or HTTP 429/503), respects an
`AbortSignal`, and caps total attempts. Show a test where a non-retryable error is thrown immediately.

<details><summary>Solution and explanation</summary>

```js
import { setTimeout as sleep } from "node:timers/promises";

const isRetryable = (e) => e?.retryable === true || [429, 503].includes(e?.status);

export async function retry(fn, { retries = 3, baseMs = 100, maxMs = 2000, signal } = {}) {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const cap = Math.min(maxMs, baseMs * 2 ** attempt);
      await sleep(Math.random() * cap, undefined, { signal });
    }
  }
}

let n = 0;
console.log(await retry(async () => { if (++n < 3) throw Object.assign(new Error("busy"), { status: 503 }); return "ok"; }, { baseMs: 5 })); // ok
await retry(async () => { throw Object.assign(new Error("bad input"), { status: 400 }); })
  .catch((e) => console.log("not retried:", e.message)); // not retried: bad input
```
Key ideas: exponential backoff with jitter, retry budget, retry only transient errors, honour cancellation.
</details>

**Exercise 6.5 - Fix the double spend (conceptual + code)**

Given `withdraw(db, id, amount)` that does `SELECT balance`, compares in JS, then `UPDATE`, rewrite using an atomic
conditional `UPDATE` with `mysql2/promise` and parameterised SQL. Return `true`/`false`.

<details><summary>Solution and explanation</summary>

```js
// pool = mysql.createPool({...}) from "mysql2/promise"
export async function withdraw(pool, accountId, amount) {
  const [result] = await pool.execute(
    "UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
    [amount, accountId, amount],
  );
  return result.affectedRows === 1; // 0 rows -> insufficient funds (or no such account)
}
```
The balance check and decrement happen in one atomic statement inside the database (row lock held for the
statement), so two concurrent requests cannot both succeed beyond the balance. Parameterised queries prevent SQL
injection (Week 4/5). Use integer minor units for money.
</details>

---

### Day 6 - Wrap-up

**Key concepts to remember**

1. `all` fail-fast ordered; `allSettled` never rejects; `race` first settle; `any` first success + `AggregateError`.
2. None of them cancels work; use `AbortSignal` for cancellation and timeouts.
3. Bound concurrency; add timeouts; retry only safe/idempotent operations with backoff and jitter.
4. Top mistakes: `forEach(async)`, floating promises, sequential independent awaits, swallowing errors,
   read-modify-write across `await`.
5. Fix check-then-act races with atomic SQL or transactions, not JS checks.

**Five revision questions**

1. Compare the four combinators in a table from memory, including empty-input behavior.
2. Does `Promise.all` cancel the other promises when one fails? What happens to them?
3. How do you implement a timeout that actually cancels an HTTP call?
4. Why is `items.forEach(async ...)` wrong, and what are two correct alternatives?
5. Describe a lost-update race in a wallet debit and two ways to prevent it.

**One practical coding task**

Rewrite your Day 4 `loadDashboard` using `allSettled` (required vs optional services), add per-call
`AbortSignal.timeout`, and a `mapLimit` for loading 20 product details with limit 5. Add 4 tests via
`console.log` (all ok, optional fails, required fails, timeout). Time-box: 30 minutes.

**Self-assessment checklist**

- [ ] I can implement `Promise.all` from scratch.
- [ ] I can choose between all/allSettled/race/any for four different scenarios.
- [ ] I can explain concurrency limiting and write `mapLimit`.
- [ ] I can spot all 12 mistakes listed in Topic 6.2 in unseen code.
- [ ] I got at least 11 of 13 questions P6.1-P6.13 correct.

---

## Day 7 - Revision and weekly test

**Learning objectives**

By the end of Day 7 you should be able to:

1. Recall all Week 1 concepts from a one-page cheat sheet, without reading the notes.
2. Score yourself on a mixed-difficulty test (Basic / Intermediate / Advanced) and map every miss to a topic.
3. Combine closures, classes, promises, combinators, and error handling in one small integrated program.
4. Answer the 20 rapid-fire Week 1 interview questions aloud in under 45 seconds each.
5. Decide, using the catch-up plan, exactly what to do if you are behind before starting Week 2.

**Time plan (about 2 hours):**

| Block | Minutes | Activity |
|-------|---------|----------|
| 1 | 20 | Read the revision summary and cheat sheets; close the file and redraw the event loop from memory |
| 2 | 45 | Weekly assessment, closed book, timed (do not run code until finished) |
| 3 | 15 | Mark with the answer key; fill the score table |
| 4 | 25 | Weak-area drill: reread only the topics your misses point to; rerun the examples |
| 5 | 15 | Integrated lab (below) or rapid-fire aloud |

If you scored well, spend block 4 on the integrated lab. If you missed many questions, use block 4 and the
catch-up plan rather than moving on blindly.

---

### Spaced revision schedule for Week 1 topics

Revisit each day's topics about 1 day, 3 days, and 7 days after first learning them (10-15 minutes each, from
the "Revision notes" and the five revision questions; no re-reading of full topics).

| Learned on | Topics | Revisit at +1 day | +3 days | +7 days |
|-----------|--------|-------------------|---------|---------|
| Day 1 | Execution context, scope, hoisting, closures | Day 2 (start) | Day 4 | Day 8 |
| Day 2 | `this`, prototypes, classes, `AppError` | Day 3 (start) | Day 5 | Day 9 |
| Day 3 | References, copying, arrays, `Map/Set` | Day 4 (start) | Day 6 | Day 10 |
| Day 4 | Promises, async/await, error propagation | Day 5 (start) | Day 7 (this day) | Day 11 |
| Day 5 | Event loop, microtasks, blocking | Day 6 (start) | Day 8 | Day 12 |
| Day 6 | Combinators, async mistakes, races | Day 7 (this day) | Day 9 | Day 13 |

Days 8-13 are in Week 2, so reserve the first 10-15 minutes of those days for these reviews. Priority for the
7-day review: event loop ordering, closures, promise chaining, and `Promise.all` vs `allSettled`. These recur in
Node internals (Week 2) and in every later week.

---

### Week 1 revision summary

**Cheat sheet 1 - Language core**

| Topic | Remember |
|-------|----------|
| Execution context | bindings + `this` + outer ref; creation phase then execution phase |
| Call stack | LIFO; overflow -> `RangeError`; traces are stack snapshots |
| Scope | lexical (by code position); scope chain walks outward; each Node module has its own scope |
| `var` / `let` / `const` | function scope vs block scope; TDZ for `let/const/class`; `const` freezes the binding only |
| Hoisting | `var` -> `undefined`; function declaration -> ready; `let/const/class` -> TDZ |
| Closure | function + `[[Environment]]`; live bindings; per-iteration `let`; risks: retained memory |
| `this` | `new` > `call/apply/bind` > `obj.method()` > plain call (`undefined` in strict) ; arrow = lexical |
| Prototypes | `[[Prototype]]` chain; reads walk, writes shadow; `class` is sugar; `new` = create-link-run-return |
| Pollution | `__proto__` in merges; use schema validation, deny-list keys, `Map`/null-prototype dictionaries |
| References | objects by reference; args passed by sharing; shallow (spread) vs deep (`structuredClone`); `freeze` shallow |
| Arrays | `sort/reverse/splice` mutate; `sort()` default is string order; `reduce` needs init; `map(parseInt)` trap |
| `??` vs `||` | `??` only for `null/undefined`; destructuring defaults only for `undefined` |

**Cheat sheet 2 - Async core**

| Topic | Remember |
|-------|----------|
| Promise | pending -> fulfilled/rejected once; `then` returns a new promise; handlers are microtasks |
| Chain rules | return value / return promise (adopted) / throw (rejects) / non-function (pass-through) |
| `catch` / `finally` | `catch` recovers; `finally` passes through, its return ignored, throw overrides |
| `async/await` | `async` -> always a promise; `await` suspends the function, rethrows rejection; `return await` in `try` |
| Errors | via rejections; `try/catch` needs `await`; Node 15+ unhandled rejection crashes; use `cause` |
| Event loop | stack empty -> drain ALL microtasks -> next macrotask |
| Node queues | `nextTick` queue before promise microtasks (ESM top-level nuance); `setImmediate` in check phase |
| Blocking | sync CPU work blocks everyone; fix: avoid, chunk + `setImmediate`, workers, streams, queues |
| Combinators | all: fail-fast, ordered; allSettled: never rejects; race: first settle; any: first success + `AggregateError` |
| Cancellation | none for promises; use `AbortSignal` (`AbortSignal.timeout`, `AbortSignal.any` Node 20.3+) |
| Concurrency | bound it (`mapLimit`); timeouts everywhere; retry only idempotent work with backoff + jitter |
| Races | `await` between read and dependent write loses updates; use atomic SQL / transactions |

**Version notes to remember (interviewers like these):**

- Node 15+: unhandled rejection terminates the process by default.
- `Object.groupBy` / `Map.groupBy`: Node 21+ (not Node 20 LTS). `toSorted/toReversed/with`: Node 20+.
- `Promise.withResolvers`: Node 22+ (not in Node 20).
- `AbortSignal.any`: Node 20.3+. `structuredClone`: Node 17+. `Error` `cause`: Node 16.9+.
- `import.meta.dirname/filename`: Node 20.11+ / 21.2+.

---

### Integrated lab - process a batch of orders [ESSENTIAL practice]

This combines closures, classes, `async/await`, retries, concurrency limiting, and error handling in one
runnable file. Read the requirement first, attempt it, then compare.

**Requirement:** `processOrders(orders, { concurrency })` charges each order through a flaky `chargeCard(order)`.

- At most `concurrency` charges run at once.
- Transient errors (`err.retryable === true`) are retried up to 2 times with exponential backoff and jitter.
- Non-retryable errors (e.g. "card declined") are not retried.
- One failing order must not stop the others; the result lists successes and failures in input order.

<details><summary>Reference solution</summary>

```js
// lab-orders.mjs
import { setTimeout as sleep } from "node:timers/promises";

class AppError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function retry(fn, { retries = 2, baseMs = 5 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !err.retryable) throw err;
      await sleep(Math.random() * baseMs * 2 ** attempt);
    }
  }
}

// fake flaky gateway
const attempts = new Map();
async function chargeCard(order) {
  attempts.set(order.id, (attempts.get(order.id) ?? 0) + 1);
  await sleep(5);
  if (order.id === 2 && attempts.get(2) < 2) {
    throw Object.assign(new Error("gateway busy"), { retryable: true });
  }
  if (order.id === 3) throw new AppError("card declined");
  return { orderId: order.id, charged: order.amount };
}

export async function processOrders(orders, { concurrency = 2 } = {}) {
  const outcomes = await mapLimit(orders, concurrency, async (order) => {
    try {
      return { id: order.id, ok: true, value: await retry(() => chargeCard(order)) };
    } catch (error) {
      return { id: order.id, ok: false, error: error.message };
    }
  });
  return {
    succeeded: outcomes.filter((o) => o.ok).length,
    failed: outcomes.filter((o) => !o.ok),
    outcomes,
  };
}

const orders = [{ id: 1, amount: 100 }, { id: 2, amount: 50 }, { id: 3, amount: 75 }, { id: 4, amount: 20 }];
const summary = await processOrders(orders);
console.log(summary.succeeded, summary.failed, attempts.get(2));
// 3 [ { id: 3, ok: false, error: 'card declined' } ] 2
```

What it demonstrates: worker-pool concurrency limit (closure over `next`), per-order error isolation (`try/catch`
inside the mapped function so the pool never rejects), retry only on transient errors, order preserved by writing
to `results[i]`. What a real payment flow adds: idempotency keys so a retried charge cannot double-charge (Week
6 / Week 7), timeouts via `AbortSignal`, structured logging, and a queue for failures.
</details>

---

### Week 1 rapid-fire (answer aloud, 30-45 seconds each)

Cover the answers, say your answer aloud, then check. These are short forms; the full interview answers are in the
topics above.

1. **What is a closure?** A function together with a reference to the lexical environment where it was created, so
   it keeps access to outer variables after the outer function returns.
2. **`var` vs `let` vs `const`?** `var` is function scoped, hoisted as `undefined`; `let`/`const` are block
   scoped with a temporal dead zone; `const` cannot be reassigned but its object can be mutated.
3. **What is hoisting?** Bindings are created in the creation phase before execution: `var` as `undefined`,
   function declarations fully, `let/const/class` uninitialised (TDZ).
4. **How is `this` determined?** By the call site: `new`, explicit `call/apply/bind`, implicit method call, then
   default (`undefined` in strict mode). Arrow functions use lexical `this`.
5. **Why does a controller method lose `this` in Express routes?** It is passed as a plain function, so default
   binding applies. Fix with `bind`, a wrapper arrow, or an arrow class field.
6. **What is the prototype chain?** The linked list of objects through `[[Prototype]]` that property lookup
   walks until `null`.
7. **Are classes real in JS?** Syntax over prototypes, with stricter semantics (`new` required, strict mode,
   `super`, private fields).
8. **Is JS pass by value or reference?** By value, where object values are references (pass by sharing).
9. **Shallow vs deep copy?** Spread copies the top level only; `structuredClone` copies deeply but not functions.
10. **Which array methods mutate?** `sort`, `reverse`, `splice`, `push/pop/shift/unshift`, `fill`.
11. **Three promise states?** Pending, fulfilled, rejected; settles once.
12. **What does an `async` function return?** Always a promise.
13. **Does `await` block?** No, it suspends only that function; the thread stays free.
14. **Microtask vs macrotask?** Promise reactions/`queueMicrotask` run after the current task and before the next
    macrotask (timers, I/O).
15. **`process.nextTick` vs `setImmediate`?** `nextTick` runs before promise microtasks right after the current
    operation; `setImmediate` runs in the check phase after I/O.
16. **`all` vs `allSettled`?** `all` is fail-fast; `allSettled` waits and reports every outcome.
17. **`race` vs `any`?** `race` takes the first settled; `any` takes the first fulfilled.
18. **What happens on an unhandled rejection in Node 22?** The process raises an uncaught exception and exits
    (since Node 15).
19. **How do you stop a slow synchronous task from freezing Node?** Avoid it, chunk with `setImmediate`, move to a
    worker thread/queue, stream the data.
20. **How do you prevent a lost update across `await`?** Make the read-check-write atomic in the database or lock;
    do not rely on JS-side checks.

---

### Weekly assessment

**Instructions:** closed book, 45 minutes. Answer on paper. For output questions write the exact output order. Do
not run code until you finish. Assume ES modules on Node 22 unless stated. Scoring: Basic 1 point, Intermediate
2 points, Advanced 3 points. Total 58.

Helpers for questions that use them:

```js
const ok = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const fail = (m, ms) => new Promise((_, rej) => setTimeout(() => rej(new Error(m)), ms));
```

#### Basic (10 questions, 1 point each)

**B1.** What does this print?
```js
function t() {
  console.log(typeof f, typeof g);
  function f() {}
  var g = function () {};
}
t();
```

**B2.** Name the three states of a Promise and say which transitions are possible.

**B3.** What does this print?
```js
const a = [1, 2, 3];
const b = a;
b.push(4);
console.log(a.length);
```

**B4.** What does an `async` function return when it executes `return 5;`, and what if it executes `throw new Error("x")`?

**B5.** What does this print?
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
```

**B6.** State two differences between `let` and `var`.

**B7.** What does `console.log([3, 20, 100].sort())` print, and why?

**B8.** Why does `const g = user.greet; g();` throw in an ES module when `greet` uses `this.name`?

**B9.** What does this print?
```js
Promise.all([1, 2, Promise.resolve(3)]).then(console.log);
```

**B10.** Define a closure in one sentence and give one backend use.

#### Intermediate (12 questions, 2 points each)

**I1.** What does this print?
```js
const obj = { a: 1, get b() { return this.a + 1; } };
const copy = { ...obj };
obj.a = 10;
console.log(copy.b, obj.b);
```

**I2.** What does this print?
```js
function A() {}
A.prototype.x = 1;
const a1 = new A();
const a2 = new A();
a1.x = 2;
console.log(a2.x, A.prototype.x);
```

**I3.** What is the exact output order?
```js
console.log(1);
setTimeout(() => console.log(2));
(async () => {
  console.log(3);
  await Promise.resolve();
  console.log(4);
})();
console.log(5);
```

**I4.** What is the exact output?
```js
Promise.reject(new Error("a"))
  .finally(() => console.log("f"))
  .catch((e) => console.log("c", e.message))
  .then(() => console.log("t"));
```

**I5.** What does this print, and which line makes it differ from the classic bug?
```js
const fns = [];
for (var i = 0; i < 3; i++) {
  let j = i;
  fns.push(() => j);
}
console.log(fns.map((f) => f()));
```

**I6.** Explain `Promise.all` vs `Promise.allSettled` and give one real use case for each.

**I7.** Why is `items.forEach(async (x) => await save(x))` a bug? Give two correct alternatives.

**I8.** What is the result?
```js
Promise.race([ok("a", 20), fail("b", 10)]).then(console.log, (e) => console.log("E", e.message));
```

**I9.** Inside a `setTimeout` callback you do: `Promise.resolve().then(() => console.log("promise")); process.nextTick(() => console.log("nextTick")); console.log("sync");`. What is the output order?

**I10 (coding).** Write `memoizeAsync(fn)` that caches by arguments **the promise** (so concurrent identical calls
share one in-flight request) and evicts failed promises so a later call retries.

**I11 (debugging).** List all the bugs in this handler and fix them:
```js
const config = { retries: 3, tags: [] };

async function handleRequest(req, db, mailer, rows) {
  const opts = config;
  opts.tags.push(req.id);
  const user = db.findUser(req.userId);
  rows.forEach(async (r) => { await db.save(r); });
  mailer.send(user.email);
  try {
    return db.updateBalance(user.id, -req.amount);
  } catch (e) {
    console.log(e);
  }
}
```

**I12 (concept).** Explain "pass by sharing" with an example, and explain how destructuring helps avoid mass
assignment when updating a record from `req.body`.

#### Advanced (8 questions, 3 points each)

**A1.** What is the exact output order?
```js
async function a1() { console.log(1); await a2(); console.log(2); }
async function a2() { console.log(3); }
console.log(4);
setTimeout(() => console.log(5), 0);
a1();
new Promise((r) => { console.log(6); r(); }).then(() => console.log(7));
console.log(8);
```

**A2.** What is printed?
```js
const o = Object.create({ inherited: 1 });
o.own = 2;
for (const k in o) console.log(k);
console.log(Object.keys(o), JSON.stringify(o));
```

**A3.** What is printed, and is there an unhandled rejection for the second error?
```js
async function main() {
  try {
    await Promise.all([Promise.reject(new Error("1")), Promise.reject(new Error("2"))]);
  } catch (e) {
    console.log("main", e.message);
  }
}
main();
```

**A4 (design).** An endpoint `GET /rates/:currency` calls a slow third-party API (300 ms). Under load, 500
concurrent requests for `USD` all hit the third party. Describe how you would collapse them into one call using
promises, what happens on failure, and what the limits of an in-process solution are.

**A5 (coding).** Write `pipeAsync(...fns)` that returns a function running async/sync functions in sequence,
passing each result to the next (input -> f1 -> f2 ...), and rejects if any step rejects.

**A6 (concept).** Production CPU is low but p99 latency of every endpoint spikes periodically. How do you
investigate whether the event loop is being blocked, what are the typical culprits, and what are three
mitigations?

**A7 (design + code).** A wallet endpoint does `SELECT balance`, checks `balance >= amount` in JS, then
`UPDATE balance = balance - amount`. Explain the failure with two concurrent requests and give a fix. Then explain
one alternative fix using transactions.

**A8 (memory).** A long-running service attaches an event listener per request that closes over the request
object, but never removes it. Explain the leak in terms of closures and reachability, and how you would find and
fix it.

#### Score sheet

| Section | Questions | Points available | Your score |
|---------|-----------|------------------|-----------|
| Basic | B1-B10 | 10 | |
| Intermediate | I1-I12 | 24 | |
| Advanced | A1-A8 | 24 | |
| Total | | 58 | |

---

### Answers with explanations

#### Basic answers

**B1.** `function undefined`. Function declaration `f` is fully hoisted; `var g` is hoisted as `undefined` (the
function expression is assigned later).

**B2.** Pending, fulfilled, rejected. Allowed: pending -> fulfilled and pending -> rejected. A settled promise
never changes state (first settle wins).

**B3.** `4`. `a` and `b` reference the same array; `push` mutates it.

**B4.** `return 5` -> a promise fulfilled with `5`; `throw new Error("x")` -> a promise rejected with that error
(no synchronous throw to the caller).

**B5.** `A`, `D`, `C`, `B`. Synchronous code first, then microtasks (promise), then the timer macrotask.

**B6.** Any two: `var` is function scoped, `let` is block scoped; `let` has a TDZ, `var` is initialised to
`undefined`; `let` cannot be redeclared in the same scope; `var` at script top level creates a global object
property in browsers; per-iteration binding in `for` loops for `let`.

**B7.** `[ 100, 20, 3 ]`. Default `sort` converts elements to strings and compares lexicographically
(`"100" < "20" < "3"`). Use `sort((a, b) => a - b)` for numbers.

**B8.** A detached method is called with default binding; in strict mode (ES modules, class bodies) `this` is
`undefined`, so `this.name` throws `TypeError: Cannot read properties of undefined (reading 'name')`.

**B9.** `[ 1, 2, 3 ]`. `Promise.all` wraps non-promises, and keeps input order.

**B10.** A closure is a function bundled with its lexical environment, so it can access variables of its outer
scopes after the outer function has returned. Backend uses: middleware/config factories (`rateLimit({ max })`),
dependency injection (`createService(db)`), private state, memoization.

#### Intermediate answers

**I1.** `2 11`. Spread invokes the getter and copies its *current value* (`2`) as a plain data property, so `copy.b`
stays `2`; `obj.b` recomputes with the new `a` (`11`).

**I2.** `1 1`. `a1.x = 2` creates an own property on `a1` (shadowing); `A.prototype.x` and `a2.x` still read `1`.

**I3.** `1 3 5 4 2`. Sync: `1`, `3` (async function runs to the first `await`), `5`; microtask: `4`; macrotask: `2`.

**I4.** `f`, `c a`, `t` (one per line). `finally` runs and passes the rejection through; `catch` handles and returns
normally; the next `then` runs.

**I5.** `[ 0, 1, 2 ]`. The `let j = i` inside the loop body creates a new block-scoped binding per iteration that each
closure captures, so the shared `var i` problem is avoided.

**I6.** `all` fulfils with an ordered array only if all fulfil and rejects on the first rejection (fail-fast);
use for required parallel data (profile + orders + balance for a response). `allSettled` waits for all and returns
`{status, value|reason}`; use for optional/partial results (dashboard widgets, bulk jobs where you must report
each item's outcome). Neither cancels running work.

**I7.** `forEach` ignores the promises returned by the callback: the function continues immediately, the saves
finish later, and rejections become unhandled. Alternatives: `for (const x of items) await save(x)` (sequential)
or `await Promise.all(items.map((x) => save(x)))` (parallel, add a concurrency limit for large arrays).

**I8.** `E b`. `race` settles with the first settled promise, and the rejection at 10 ms beats the fulfilment at
20 ms.

**I9.** `sync`, `nextTick`, `promise`. After a macrotask callback, Node drains the `nextTick` queue before the
promise microtask queue.

**I10.**
```js
import { setTimeout as sleep } from "node:timers/promises";

export function memoizeAsync(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return (...args) => {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);          // share the in-flight (or resolved) promise
    const promise = Promise.resolve().then(() => fn(...args)); // also turns sync throws into rejections
    cache.set(key, promise);
    promise.catch(() => {                                 // evict failures so the next call retries
      if (cache.get(key) === promise) cache.delete(key);
    });
    return promise;
  };
}

let calls = 0;
const getUser = memoizeAsync(async (id) => { calls++; await sleep(20); return { id }; });
const [a, b] = await Promise.all([getUser(1), getUser(1)]);
console.log(a === b, calls); // true 1
```
Key idea: cache the **promise**, not the value, so concurrent callers share one in-flight request; evict
rejections. Production additions: TTL, max size (LRU), per-key timeouts.

**I11.** Bugs and fixes:
1. `const opts = config` aliases shared module state and `push` mutates it for every request. Fix: copy
   (`structuredClone(config)`) or do not mutate shared config at all.
2. Missing `await` on `db.findUser`: `user` is a promise, so `user.email` is `undefined`. Fix:
   `const user = await db.findUser(req.userId)`.
3. `forEach(async ...)`: saves are not awaited. Fix: `await Promise.all(rows.map((r) => db.save(r)))` (bounded if
   `rows` is large).
4. `mailer.send(...)` is a floating promise; failure is an unhandled rejection that can crash the process. Fix:
   `await` it in try/catch, or `.catch(log)` if intentionally fire-and-forget (better: a queue).
5. `return db.updateBalance(...)` inside `try` without `await`, so the `catch` never sees rejections. Fix:
   `return await db.updateBalance(...)`. Also, the `catch` just logs and returns `undefined`, swallowing the
   error: rethrow or map to an application error.

**I12.** Pass by sharing: the function receives a copy of the reference. `function f(o){ o.x = 1; o = {}; }`
mutates the caller's object (`x` becomes 1) but the reassignment affects only the local variable. Mass
assignment: `Object.assign(user, req.body)` lets clients set any field (such as `role`). Destructuring
`const { name, email } = req.body` and updating only those fields is an explicit allow-list, so privileged or
unknown keys are ignored (add schema validation for types, Week 3).

#### Advanced answers

**A1.** `4 1 3 6 8 2 7 5`. Sync part: `4`; `a1()` prints `1` and calls `a2()`, which prints `3`; `await` queues
the continuation `2` as a microtask; the promise executor prints `6` synchronously and queues `7`; then `8`.
Microtasks run FIFO: `2`, `7`. Finally the timer: `5`.

**A2.** Prints `own`, `inherited` (for...in includes inherited enumerable keys), then
`[ 'own' ] {"own":2}`. `Object.keys` and `JSON.stringify` consider only own enumerable properties.

**A3.** Prints `main 1`. There is no unhandled rejection for the second error: `Promise.all` attached handlers to
every input promise, so the later rejection is considered handled; its result is simply ignored.

**A4 (model answer).** Cache the **in-flight promise** per key (single-flight): `memoizeAsync` from I10, with a
short TTL. The first request starts the call; 499 others await the same promise, so the third party sees 1 call.
On failure, evict the entry so the next request retries (otherwise all callers get the cached rejection forever);
optionally serve stale data if available. Add a timeout via `AbortSignal.timeout`. Limits: the cache is per
process, so with N instances you make N calls; memory is bounded only if you cap size/TTL; it does not protect
against cache stampedes across instances. For multi-instance setups use Redis with a short lock or "stale while
revalidate" (Week 6).

**A5.**
```js
export const pipeAsync = (...fns) => (input) =>
  fns.reduce((acc, fn) => acc.then(fn), Promise.resolve(input));

const add1 = async (x) => x + 1;
const dbl = (x) => x * 2;
console.log(await pipeAsync(add1, dbl, add1)(3)); // 9
```
`reduce` builds the chain `Promise.resolve(input).then(f1).then(f2)...`; a rejection skips all following steps and
rejects the final promise, and sync functions work too because `then` handles plain return values.

**A6 (model answer).** Symptoms: low CPU average but periodic latency spikes across unrelated endpoints suggests
the single JS thread is blocked in bursts (GC pauses, large synchronous JSON, sync fs/crypto, regex backtracking,
big sorts/loops, a synchronous cron job). Investigate: export the event loop delay histogram
(`perf_hooks.monitorEventLoopDelay`) and correlate spikes with requests/logs; take a CPU profile
(`node --cpu-prof` or `--inspect` with DevTools, clinic/0x flame graphs); check GC with `--trace-gc` or
`process.memoryUsage()`; log slow synchronous sections. Mitigations: move heavy work to worker threads or a job
queue; stream or paginate large data; replace `*Sync` calls with async ones; chunk work and yield with
`setImmediate`; limit request body sizes; fix regexes; scale horizontally as a stopgap, not a fix.

**A7 (model answer).** Two requests of 80 on a balance of 100: both `SELECT` 100, both pass the JS check, both
`UPDATE` to 20 (or the last write wins), so 160 was spent. Fix 1 (preferred, atomic):
`UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?` and treat `affectedRows === 0` as
insufficient funds. Fix 2: a transaction using `SELECT balance FROM accounts WHERE id = ? FOR UPDATE`, so the
second transaction waits for the row lock until the first commits, then re-reads the new balance, checks, and updates;
commit/rollback in `try/finally`. (Other options: optimistic locking with a version column, a ledger table with
constraints.) Details: Week 4 Days 4-5 and Week 7 payments.

**A8 (model answer).** The listener list is held by a long-lived object (emitter or module-level structure). Each
listener is a closure holding its environment, which references the `req` object (and possibly the response and
body), so none of them is garbage collectable: they stay reachable from the emitter forever, and memory grows with
each request. Node may print `MaxListenersExceededWarning` after 10 listeners on one event, which is a clue.
Find it with heap snapshots (`--inspect`, compare snapshots, look at retained size under listener closures) or
`process.memoryUsage()` trending upward under constant load. Fix: use `emitter.once` where appropriate, remove
listeners (`emitter.off`) in `finally` or on request close, capture only needed primitives (`const id = req.id`),
and avoid per-request listeners on global emitters. (Memory leaks in depth: Week 2 Day 6 and Week 6 Day 6.)

---

### Weak-area identification guidance

**Step 1: score.** Total your points from the score sheet.

| Score (of 58) | Reading | Action |
|---------------|---------|--------|
| 48-58 | Strong. Interview-ready on JS fundamentals | Move on; do the spaced reviews; attempt EX-ASYNC and EX-LOOP exercises in `11_Coding_Exercises.md` |
| 36-47 | Solid with gaps | Spend 1 extra hour on weak topics (map below) before Week 2 Day 1 |
| 24-35 | Shaky | Use the catch-up plan "Option B" (below); redo the output-prediction sets for the weak days |
| Below 24 | Foundation not yet built | Use "Option C": repeat Days 4-6 at half speed; ask for explanations on the specific concepts; do not rush Week 2 |

**Step 2: map misses to topics.**

| Missed question(s) | Weak topic | Revisit |
|--------------------|-----------|---------|
| B1, B6, I5, A8 | Hoisting, scope, closures | Day 1 Topics 1.2-1.4, P1.1-P1.12 |
| B8, I2, A2 | `this`, prototypes | Day 2 Topics 2.1-2.2, P2.1-P2.12 |
| B3, B7, I1, I12, I11(1) | References, copies, arrays | Day 3 Topics 3.1-3.3, P3.1-P3.14 |
| B2, B4, B9, I4, I10, A5 | Promises, async/await | Day 4 Topics 4.1-4.2, P4.1-P4.12 |
| A3, I11 (2-5) | Error propagation, floating promises | Day 4 Topic 4.3, Day 6 Topic 6.2 |
| B5, I3, I9, A1, A6 | Event loop ordering and blocking | Day 5 Topics 5.1-5.2, P5.1-P5.13 |
| I6, I7, I8, A4, A7 | Combinators, mistakes, races | Day 6 Topics 6.1-6.2, P6.1-P6.13 |

**Step 3: diagnose the kind of error.** Different misses need different fixes:

- **Wrong prediction but you understood the explanation:** you need more repetitions. Do 5 more prediction
  snippets from the same day and write the order of queues on paper (stack, microtasks, macrotasks) before answering.
- **Right answer, but you could not explain why:** you memorised the output. Practice the "explain in one
  minute" version aloud, using the vocabulary: creation phase, scope chain, microtask queue, adoption.
- **Could not start the coding question:** rewrite the reference solution from memory the next day without looking.
- **Skipped the design questions (A4, A7):** read Day 6 Topic 6.2 and Week 4 Day 4 when it arrives; these are
  revisited with real SQL.

**Step 4: honest note.** Passing this test does not mean you have mastered JavaScript, only that the Week 1
interview basics are in place. Event-loop reasoning and promise semantics improve mainly through repeated
prediction practice, so keep doing 2-3 prediction snippets as a warm-up on later days.

---

### Catch-up plan (if you fall behind)

The aim is to protect the `[ESSENTIAL]` material and drop low-value time first. Everything marked `[ADVANCED]` is
safe to postpone.

**What is safe to skip or postpone to Week 8 (revision week):**

- Day 1: "Closures and memory [ADVANCED]".
- Day 2: Topic 2.3 (property descriptors), `Symbol.hasInstance` mentions.
- Day 3: `WeakMap` details, `Object.groupBy` discussion.
- Day 5: tick-counting ("return promise costs extra ticks"), starvation demo, `monitorEventLoopDelay`.
- Day 6: `AbortSignal.any`, Mistake 13, the retry code details (will be revisited in Week 6).

**What must not be skipped:**

- Day 1: hoisting/TDZ, closures and the loop bug.
- Day 2: `this` rules and lost `this` in callbacks; prototype chain; `AppError` hierarchy.
- Day 3: references/copying, array mutation traps, `??` vs `||`.
- Day 4: promise chaining rules, `async/await`, error propagation, unhandled rejection behavior.
- Day 5: microtask vs macrotask ordering, blocking.
- Day 6: the four combinators, `forEach(async)`, race conditions across `await`.

**Option A: behind by about half a day (about 1 hour).** Skip the "Common mistakes" re-read, do only the
output-prediction questions for your weakest 2 days, and carry the rest into Day 1 of Week 2 as 15 minutes.

**Option B: behind by 1-2 days.** Use the 2-hour Day 7 slot plus one extra hour:
1. Read only the **Interview answer**, **Revision notes**, and **Key concepts** for each day (about 10 minutes
   per day).
2. Do all output-prediction questions for Days 4, 5, and 6 (about 60 minutes in total).
3. Do the integrated lab.
4. Start Week 2 on the next day; add 15 minutes of Week 1 review at the start of each of the next 4 days.

**Option C: behind by 3 or more days, or scoring below 24.** Do not push on silently.
1. Take one extra full day: Day 4 -> Day 5 -> Day 6 in half-length passes (read the examples, run every snippet,
   predict output first).
2. Retake the weekly assessment (cover your earlier answers) two days later.
3. Check `00_Master_Strategy_Schedule.md` for how revision days can absorb a repeated day; Week 8 is mostly
   revision, so one repeated day there is affordable, but many repeated days are not.
4. Remember the realistic goal: finish the essentials, not every `[ADVANCED]` item.

---

### Day 7 - Wrap-up

**Key concepts to remember**

1. Event loop: stack empty -> drain all microtasks -> next macrotask; blocking is the main Node anti-pattern.
2. Closures + `this` + prototypes explain most "why does this behave like that" questions; classes are sugar.
3. Promise chains pass values or rejections down; `async/await` is syntax over them; `await` needs a `try/catch`.
4. Combinators differ in failure behavior; none cancels work; bound concurrency; time out with `AbortSignal`.
5. Logical races across `await` need atomic or locked database operations.

**Five revision questions**

1. Draw the event loop and explain the ordering of sync code, `nextTick`, promises, `setImmediate`, timers.
2. Explain closures and the `var`/`let` loop bug, then give two backend uses of closures.
3. Walk through what `new` does and how `AppError extends Error` works at the prototype level.
4. Compare the four promise combinators and give a scenario for each.
5. Describe the wallet double-spend race and two ways to fix it.

**One practical coding task**

Without looking at the lab, write `processOrders` again with an added `AbortSignal` that stops starting new charges
once aborted, and a summary that counts retries per order. Time-box: 35 minutes. Compare with the reference.

**Self-assessment checklist**

- [ ] I scored at least 36 of 58 on the weekly assessment (or I have a plan from the catch-up section).
- [ ] I can redraw the event loop and the two cheat sheets from memory.
- [ ] I answered the rapid-fire list aloud, not only in my head.
- [ ] I know which two topics are my weakest and have scheduled their spaced reviews.
- [ ] I ran every output-prediction snippet from Days 4-6 at least once.

---

**Next:** Week 2 - Node.js Internals (`02_Week2_Node_Internals.md`). Week 1 provides the event loop and promise
foundation that Week 2 builds directly on (libuv phases, the thread pool, streams, and backpressure).
