# Week 2: Node.js Internals (Days 8-14)

> Part of the Node.js Backend Interview Preparation set. Spec: `prompt.md`. Layout/conventions: `_brief.md`.
> This file = Week 2 detailed notes, daily wrap-ups, weekly test with answers.
> Numbering: Week 2 = Day 8 to Day 14 of the 56-day plan. Inside this file they are called Day 1 to Day 7
> (so "Week 2 / Day 2 notes" means the event-loop day).

**Tier markers used in this file**

- `[ESSENTIAL]` = asked in most Node.js interviews. Learn this properly.
- `[ADVANCED]` = supplementary. Read after the essentials; skip if you are short on time.

**Versions used.** Examples target Node.js 22 LTS (Node 20 differences are flagged). All examples use
ES modules (`"type": "module"` in `package.json`) unless the topic is CommonJS itself. To run any
example: create a folder, run `npm init -y`, add `"type": "module"` to `package.json`, save the
snippet as a `.js` file, run `node file.js`.

**Honest note.** Node internals is a wide topic. In 7 days you will become interview-ready for the
essentials (event loop, thread pool vs OS I/O, streams, backpressure, EventEmitter, memory leaks). You will
not master V8 or libuv source code, and you do not need to.

## Week 2 Table of Contents

- [Day 1 - Node vs browser JS, V8, libuv, runtime architecture](#day-1---node-vs-browser-js-v8-libuv-runtime-architecture)
- [Day 2 - Event loop phases, async I/O, blocking vs non-blocking, thread pool](#day-2---event-loop-phases-async-io-blocking-vs-non-blocking-thread-pool)
- [Day 3 - Worker threads, CommonJS vs ESM, process, Buffer, env variables](#day-3---worker-threads-commonjs-vs-esm-process-buffer-env-variables)
- [Day 4 - File system and streams](#day-4---file-system-and-streams)
- [Day 5 - Backpressure, stream pipelines, EventEmitter](#day-5---backpressure-stream-pipelines-eventemitter)
- [Day 6 - Memory management, garbage collection, memory leaks](#day-6---memory-management-garbage-collection-memory-leaks)
- [Day 7 - Revision and weekly test](#day-7---revision-and-weekly-test)
- [Week 2 Revision Summary](#week-2-revision-summary)
- [Week 2 Assessment](#week-2-assessment)
- [Week 2 Answers with Explanations](#week-2-answers-with-explanations)
- [Weak-Area Identification Guidance](#weak-area-identification-guidance)
- [Catch-Up Plan If You Fall Behind](#catch-up-plan-if-you-fall-behind)

---

## Day 1 - Node vs browser JS, V8, libuv, runtime architecture

**Time plan (about 2 hours)**

| Minutes | Activity |
|---------|----------|
| 35 | Read sections 1.1 to 1.3 (Node vs browser, V8, libuv) |
| 25 | Read sections 1.4 to 1.5 (architecture, "single-threaded" truth) |
| 30 | Run all code examples yourself, change values, observe |
| 20 | Answer follow-up questions aloud (record yourself once) |
| 10 | Day wrap-up: five questions + checklist |

**Learning objectives**

By the end of today you can:

1. Explain what Node.js is (and is not) and name 4 concrete differences from browser JavaScript.
2. Explain the roles of V8, libuv, and Node core (C++ bindings + JS library) in one clear paragraph.
3. Draw the layered architecture of a Node process from memory.
4. Explain precisely why "Node is single-threaded" is only partly true.
5. Run a tiny script that proves a CPU loop blocks timers.

---

### 1.1 What Node.js is, and how it differs from browser JavaScript [ESSENTIAL]

**Concept**

Node.js koi language nahi hai, na hi koi framework. Ye ek **JavaScript runtime** hai: ek program jo
V8 engine (jo Chrome me bhi hai) ko embed karke JavaScript ko browser ke bahar chalata hai, aur saath me
OS ke features (files, network sockets, processes, timers) JavaScript ko APIs ke form me deta hai.

Language wahi hai (ECMAScript): `let`, `const`, closures, promises, classes. Jo badalta hai woh hai
**environment ke APIs**.

| Aspect | Browser JS | Node.js |
|--------|-----------|---------|
| Global object | `window` (and `self`, `globalThis`) | `globalThis` (`global` is an alias) |
| DOM / `document` / `localStorage` | Yes | No |
| File system, child processes, raw TCP/UDP | No (sandboxed) | Yes (`node:fs`, `node:child_process`, `node:net`) |
| HTTP server | Cannot listen on a port | Can (`node:http`) |
| Module system | ES modules via `<script type="module">` | CommonJS and ES modules (Day 3) |
| Security model | Same-origin policy, CORS, user sandbox | Full user permissions of the OS user (there is an experimental permission model, not a sandbox) |
| Event loop | Browser's loop (rendering, input events, tasks) | libuv loop (phases; Day 2) |
| `fetch`, `URL`, `AbortController`, `TextEncoder`, `structuredClone`, `crypto.subtle` | Yes | Yes (global in modern Node; `fetch` since 18) |
| Who controls the version | User's browser (you cannot choose) | You choose (LTS version on your server) |
| Config / secrets | N/A | `process.env`, files |

Important nuance for interviews: the list of "web APIs available in Node" keeps growing. Do not say
"Node has no fetch" or "Node cannot use WebSocket" -- Node 22 has global `fetch`, `WebSocket` (client),
`ReadableStream`, `AbortSignal.timeout()`, `BroadcastChannel`, `structuredClone`, etc.

```js
// env_check.js  (ESM)  run: node env_check.js
console.log('window   :', typeof window);       // undefined
console.log('document :', typeof document);     // undefined
console.log('globalThis === global:', globalThis === global); // true
console.log('process  :', typeof process);       // object
console.log('Buffer   :', typeof Buffer);        // function
console.log('fetch    :', typeof fetch);         // function (Node 18+)
console.log('require  :', typeof require);       // undefined in ESM!
console.log('file     :', import.meta.filename); // Node 20.11+ / 21.2+
console.log('dir      :', import.meta.dirname);  // Node 20.11+ / 21.2+
console.log('versions :', process.versions.node, 'V8', process.versions.v8, 'libuv', process.versions.uv);
```

Expected idea of the output: `window`/`document` are `undefined`, `process` and `Buffer` exist, and the last
line shows the exact V8 and libuv versions bundled in your Node binary. Node bundles its own V8 and libuv;
you do not install them separately.

**Why it matters**

Interviewers start with "What is Node.js?" to check whether you know it is a runtime and not a language or a
framework, and whether you understand why it fits I/O-heavy servers. One JavaScript language across frontend
and backend also means shared validation code, shared types (TypeScript), and one hiring pool.

**Internal working (short; deeper in 1.4)**

When you run `node app.js`, the `node` executable (C++) starts, initialises V8 (creates an "isolate" and a
"context"), initialises libuv (creates the event loop), loads Node's own JavaScript core library (`lib/*.js`,
which gives you `fs`, `http`, ...), then compiles and runs your file with V8. When your main script finishes,
Node does **not** exit if the event loop still has work (open sockets, pending timers). It exits when the loop
has nothing left to wait for.

**Frontend connection**

You already know that browser JS is "JS + Web APIs (DOM, fetch, timers) provided by the browser". Node is the
same idea: "JS + Node APIs (fs, http, net, process) provided by Node". `setTimeout` in a browser is not part of
JavaScript the language either -- the host environment provides it. Same here.

**Real-world scenario**

A marketplace backend: React app calls `POST /orders`. A Node process receives the HTTP request (`node:http`
via Express), reads the cart from MySQL, calls a payment gateway over HTTPS, writes an invoice PDF to disk,
and replies. None of those I/O capabilities exist in a browser sandbox; all of them are Node APIs.

**Interview answer:**

"Node.js is an open-source JavaScript runtime built on Chrome's V8 engine. V8 executes the JavaScript, and a
C library called libuv provides the event loop, asynchronous I/O and a thread pool. Node adds APIs that
browsers do not expose, such as file system, networking, child processes and streams. It is not a language
and not a framework. It is well suited to I/O-bound services like APIs and gateways because one process can
handle thousands of concurrent connections without blocking while it waits for I/O."

**Follow-up questions**

1. *Is `window` available in Node?* No. The global object is `globalThis` (`global` is an alias). Code
   shared between browser and Node should reference `globalThis`.
2. *Can Node do everything a browser can?* No. No DOM, no rendering, no browser security model. It has
   many Web-standard APIs (fetch, URL, streams, AbortController) but not the whole web platform.
3. *When is Node a poor choice?* Long CPU-bound work on the main thread (video encoding, heavy
   computation) unless offloaded to worker threads or another service. See Day 2 and Day 3.
4. *Does Node make JavaScript faster than in the browser?* Same V8, so similar raw speed. The advantage is
   the I/O model, not a faster language.
5. *What exactly does Node add beyond V8?* The event loop (libuv), the standard library bindings, the module
   loaders, `process`, networking/HTTP parsing (llhttp), TLS/crypto (OpenSSL), zlib, DNS resolver (c-ares).

**Common mistakes**

- Calling Node "a framework" or "a language".
- Saying "Node is faster than Java/Python" without context. Node is efficient for concurrent I/O, not
  magically faster for CPU work.
- Forgetting that Node scripts have the **full permissions** of the OS user. A path traversal bug in a Node
  server is dangerous in a way it is not in a browser.

**Revision notes**

- Node = runtime = V8 + libuv + Node core APIs. Language is the same; environment APIs differ.
- No DOM; has fs/net/http/process/Buffer. `globalThis` is the universal global.
- Node bundles its own V8 and libuv (`process.versions`).

---

### 1.2 V8: what it does for Node [ESSENTIAL]

**Concept**

V8 Google ka open-source JavaScript + WebAssembly engine hai, C++ me likha hua. Iska kaam: tumhara JS source
text lena aur machine code (ya bytecode) me convert karke execute karna. V8 ko **nahi pata** ki file kya hoti hai,
socket kya hota hai, ya timer kya hota hai. V8 sirf JS language chalata hai, memory manage karta hai (heap +
garbage collector), aur ek **call stack** deta hai.

What V8 provides:

- Parser and compiler pipeline (turns source into bytecode, then optimised machine code).
- The JavaScript heap and the **garbage collector** (Day 6).
- The call stack and microtask queue (promise jobs).
- Language built-ins: `Object`, `Array`, `Promise`, `Map`, `JSON`, `RegExp`, `Intl`, etc.

What V8 does NOT provide: `setTimeout`, `fs`, `http`, `console`, `process`, `require`. Those come from Node
(and the browser provides its own versions in its own host).

**Internal working** (just enough for interviews)

JIT (just-in-time) compilation pipeline in modern V8 (names change across versions, the idea is stable):

```
 JS source
    |
    v
 Parser  --> AST
    |
    v
 Ignition (interpreter) --> bytecode, starts running immediately
    |   collects type feedback while running (what types did this function see?)
    v
 Hot function?
    |--> Sparkplug (fast baseline compiler)      -- cheap machine code
    |--> Maglev    (mid-tier optimiser)           -- present in newer V8 / Node 22
    +--> TurboFan  (top-tier optimising compiler) -- fastest code, based on type assumptions
              |
              +--> assumption broken (e.g. function suddenly gets a string instead of a number)
                   -> "deoptimisation": falls back to bytecode, re-learns
```

Why this matters in practice:

1. **Startup is interpreted, hot paths get optimised.** A benchmark that runs a function once tells you
   nothing; warm-up matters.
2. **Type stability helps.** Functions that always see the same "shape" of objects optimise better. V8 uses
   **hidden classes** (shapes): objects created with the same properties in the same order share a shape.
   Creating `{a:1,b:2}` in one place and `{b:2,a:1}` in another yields different shapes. Adding properties
   later or using `delete` also changes shapes. `[ADVANCED]` Do not obsess over this in an interview, but
   know the sentence "keep object shapes stable in hot paths".
3. **Memory is a V8 heap with limits.** Default old-space limit depends on system memory and Node version
   (roughly a few GB on a 64-bit machine with enough RAM). It can be changed with `--max-old-space-size=<MB>`.
   Day 6 covers this.
4. **Node ships a specific V8 version.** Node 20 ships V8 11.3, Node 22 ships V8 12.4. That is why newer
   JS features (e.g. `Array.prototype.toSorted`, `Object.groupBy`, `Promise.withResolvers`, Set methods)
   appear in specific Node versions. Always check `node -p "process.versions.v8"` and compat tables
   instead of assuming.

```js
// v8_peek.js
import v8 from 'node:v8';
const s = v8.getHeapStatistics();
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log('heap size limit   :', mb(s.heap_size_limit));
console.log('total heap size   :', mb(s.total_heap_size));
console.log('used heap size    :', mb(s.used_heap_size));
console.log('external memory   :', mb(s.external_memory));   // Buffers etc., outside the JS heap
```

Run it, then run `node --max-old-space-size=256 v8_peek.js` and compare `heap size limit`. This is
the exact knob you use when a container is memory-limited.

**Why it matters**

When someone asks "what happens to my JS code in Node?", the answer starts with V8. Also, memory limits,
deoptimisation, and GC pauses are V8 topics that show up in production performance questions.

**Frontend connection**

Same V8 as Chrome/Edge. DevTools "Performance" and "Memory" tabs work against Node too:
`node --inspect app.js` then open `chrome://inspect`. You already know heap snapshots from debugging React
memory leaks; same tool, now on a server.

**Real-world scenario**

An order-export endpoint builds a 1.5 GB array of rows in memory and the container (limit 512 MB) gets
OOM-killed. Raising `--max-old-space-size` is only a patch; the real fix is streaming rows (Day 4/5).
The V8 heap limit and the container limit are two different limits -- set the first below the second.

**Interview answer:**

"V8 is the JavaScript engine that Node embeds. It parses and compiles JavaScript, first interpreting it with
Ignition and then optimising hot functions with its JIT compilers such as TurboFan. It also manages the
JavaScript heap and the garbage collector. V8 only implements the language. Things like timers, files and
networking are not part of V8; they are provided by Node through libuv and C++ bindings."

**Follow-up questions**

1. *Does V8 provide the event loop?* No. V8 gives the call stack and the microtask queue; the event loop
   that schedules I/O and timer callbacks is libuv's (embedded by Node). Browsers have their own loop,
   implemented by the browser (e.g. Blink).
2. *What is JIT and why do we need it?* Compiling on the fly using runtime type feedback to produce fast
   machine code for hot functions, while starting quickly with an interpreter.
3. *What is deoptimisation?* When an optimised function's type assumptions are invalidated, V8 discards the
   optimised code and returns to bytecode. Frequent deopts in hot code hurt performance.
4. *How do you raise the memory limit?* `node --max-old-space-size=<MB> app.js` (or `NODE_OPTIONS`).
   And explain this treats a symptom unless the memory growth is legitimate.
5. *Which JS engine do Firefox and Safari use?* SpiderMonkey and JavaScriptCore. Node/Chrome/Deno use V8
   (Bun uses JavaScriptCore).

**Common mistakes**

- Saying "Node is written in JavaScript". Node core is C++ plus JavaScript; V8 and libuv are C/C++.
- Saying V8 handles async I/O. It does not.
- Assuming the V8 heap limit equals the container memory. They are different; Buffers and native memory
  live outside the V8 heap.

**Revision notes**

- V8 = language engine (parse, JIT, heap, GC, call stack, microtasks). No I/O, no timers.
- Ignition (interpreter) -> optimising tiers (TurboFan) with deopt on broken assumptions.
- `--max-old-space-size`, `v8.getHeapStatistics()`.

---

### 1.3 libuv: the part that makes Node asynchronous [ESSENTIAL]

**Concept**

libuv ek cross-platform C library hai jo Node.js ke liye likhi gayi thi. Iska kaam: **event loop** chalana,
**asynchronous I/O** ko OS ke mechanism se connect karna, aur ek chhota **thread pool** dena un kaamon ke liye jinka
OS-level async API nahi hota (jaise file system, DNS lookup, kuch crypto).

Core things libuv gives:

1. The event loop (`uv_run`), with phases (Day 2).
2. Network I/O via OS readiness/completion mechanisms: **epoll** (Linux), **kqueue** (macOS/BSD),
   **IOCP** (Windows), event ports (Solaris/illumos).
3. Timers (a min-heap of timers).
4. A **thread pool** (default 4 threads) for blocking work (`uv_queue_work`).
5. Handles and requests: long-lived objects (a TCP server handle, a timer handle) vs short-lived
   operations (a write request, a file-read request).
6. Child processes, pipes, TTY, signals, file system events (`inotify`/`FSEvents`/`ReadDirectoryChangesW`).

**Internal working**

Two ways libuv gets "async" behaviour. This is the single most important distinction in this week:

```
 Way A: OS-level asynchronous / readiness-based I/O  (NO extra thread needed)
 -------------------------------------------------------------------------
   Node asks the OS: "tell me when socket 57 has data".  (epoll_ctl / kevent / IOCP)
   The event loop's poll phase sleeps in epoll_wait / kevent / GetQueuedCompletionStatus.
   Kernel wakes it up when data arrives.  Loop runs the JS callback.
   Used for: TCP, UDP, HTTP server/client sockets, TLS sockets (on top of TCP),
             pipes, child process stdio, TTY (most cases), signals, timers (loop computes timeout)

 Way B: Thread pool (blocking syscall executed on a worker thread)
 -------------------------------------------------------------------------
   Node hands a blocking job to the pool: "do fs.read on this file".
   A pool thread performs the blocking syscall.  When done, it posts a completion
   back to the loop (uv_async_send); the loop runs the JS callback in the poll phase.
   Used for: most fs operations, dns.lookup (getaddrinfo), crypto.pbkdf2 / scrypt /
             randomBytes / randomFill / generateKeyPair, zlib (async API), some others
```

A mental model: **sockets are cheap for the OS to watch in bulk (one thread watches thousands), regular files
are not.** On Linux, `epoll` does not work on regular files (they are always "ready"), and POSIX AIO is
limited and awkward. So libuv uses blocking syscalls on threads for file I/O. (Newer libuv versions can use
`io_uring` for some file operations on Linux; that is version- and configuration-dependent, so do not claim it
in an interview as a default fact. Say: "historically the thread pool, with newer io_uring experiments
depending on libuv/Node version.")

The full "who does what" matrix is in Day 2 section 2.4.

```js
// libuv_two_ways.js
// Same "async" look, very different machinery underneath.
import { readFile } from 'node:fs';
import { createServer, get } from 'node:http';

// Way B: fs uses the thread pool
readFile(import.meta.filename, () => console.log('fs callback (thread pool finished the read)'));

// Way A: sockets use OS polling (epoll/kqueue/IOCP)
const server = createServer((req, res) => res.end('hi'));
server.listen(0, () => {
  get({ port: server.address().port }, (res) => {
    res.resume();
    res.on('end', () => { console.log('http callback (OS told us data arrived)'); server.close(); });
  });
});
```

You cannot see the difference by output alone. You see it in Day 2's thread-pool starvation experiment.

**Why it matters**

"How can single-threaded Node handle 10,000 connections?" has exactly one honest answer: the event loop
multiplexes many sockets using OS polling, and slow blocking work is pushed out of the JS thread. If you
cannot explain epoll vs thread pool, you will be asked a follow-up that exposes it.

**Frontend connection**

In a browser, `fetch()` does not freeze the page because the browser's network stack does the waiting and
queues a callback for your JS. libuv plays that role in Node. Same pattern: "start operation, continue running
JS, get a callback later".

**Real-world scenario**

A payments webhook receiver gets 3,000 concurrent HTTPS connections from a gateway. These are sockets: one
Node thread, epoll watches them all, callbacks run when bytes arrive. But if each webhook handler calls
`crypto.pbkdf2` (e.g. hashing something) the thread pool (4 threads) becomes the bottleneck even though
sockets scale fine. Knowing which resource a call consumes tells you where the bottleneck will appear.

**Interview answer:**

"libuv is the C library underneath Node that implements the event loop and asynchronous I/O. For network
I/O it uses the operating system's polling mechanisms, which are epoll on Linux, kqueue on macOS and IOCP on
Windows, so one thread can watch thousands of sockets. For operations that have no good async OS API, such as
most file system calls, DNS lookup through getaddrinfo, and CPU-heavy crypto and zlib, libuv runs the work
on a thread pool, four threads by default, and then queues the callback back onto the event loop."

**Follow-up questions**

1. *Does every async operation in Node use the thread pool?* No. Network sockets, timers, pipes and signals
   are handled by the event loop with OS mechanisms. The pool is for fs, `dns.lookup`, and some crypto/zlib.
2. *How big is the pool and can you change it?* 4 by default. `UV_THREADPOOL_SIZE` environment variable
   (max 1024), set before the pool is first used, so set it when launching the process. Bigger is not
   automatically better; it competes for CPU cores.
3. *Why not use epoll for files?* Regular files are always "ready" for epoll, so it gives no
   non-blocking behaviour. Hence thread pool.
4. *What is the difference between a handle and a request in libuv?* A handle is a long-lived object (timer,
   TCP server, signal watcher) that keeps the loop alive while active; a request is a short-lived operation
   (write, fs call, getaddrinfo) that completes once.
5. *What keeps a Node process alive?* Active, referenced handles and pending requests. `timer.unref()` and
   `server.unref()` tell the loop not to wait for that handle.

**Common mistakes**

- "libuv = thread pool". The thread pool is one component; sockets are not on it.
- "Async means multi-threaded." Callbacks still run on one JS thread. The pool threads never run your JS.
- Setting `UV_THREADPOOL_SIZE` to 128 "for performance" without measuring.

**Revision notes**

- libuv = event loop + OS async I/O abstraction + thread pool + timers + handles/requests.
- Sockets: epoll/kqueue/IOCP. Files/DNS lookup/crypto/zlib: thread pool (default 4).
- Pool threads never run JavaScript; they run C/C++ work and post a completion to the loop.

---

### 1.4 Node.js runtime architecture [ESSENTIAL]

**Concept**

Ek Node process ko layers me samjho. Tumhara code sabse upar; neeche ek layer ka output dusri layer ka input hai.

```
+---------------------------------------------------------------+
|                    YOUR APPLICATION CODE                      |
|     (Express routes, services, DB calls, business logic)      |
+---------------------------------------------------------------+
|             NODE.JS CORE LIBRARY  (JavaScript, lib/*.js)      |
|   fs, http, net, stream, events, crypto, zlib, worker_threads |
+---------------------------------------------------------------+
|             NODE.JS C++ BINDINGS / C++ LAYER                  |
|   glue: converts JS calls into C/C++ calls and back           |
+----------------------+----------------------------------------+
|        V8            |               libuv                    |
|  JS engine, heap,    |  event loop, thread pool, OS async I/O |
|  GC, JIT             |  timers, handles, requests             |
+----------------------+----------------------------------------+
| Other native deps: OpenSSL (TLS/crypto), llhttp (HTTP parser),|
| c-ares (async DNS resolve*), zlib, nghttp2/ngtcp2, ICU        |
+---------------------------------------------------------------+
|           OPERATING SYSTEM  (Linux / Windows / macOS)         |
|   kernel: sockets, epoll/kqueue/IOCP, files, processes        |
+---------------------------------------------------------------+
```

**Internal working: what happens for `fs.readFile`**

```
 your JS:     fs.readFile('a.txt', cb)
                 |
 Node lib JS:    lib/fs.js validates args, creates a FSReqCallback
                 |
 C++ binding:    binding.open/read(...) -> uv_fs_open / uv_fs_read with a callback
                 |
 libuv:          uv_fs_* queues the work on the THREAD POOL
                 |                          (pool thread does blocking open/read/close)
                 |  pool thread finishes -> posts completion to the loop
                 v
 event loop:     poll phase picks up the completion -> C++ callback
                 |
 V8:             enters JS, calls cb(err, data)  (your callback runs on the MAIN thread)
```

Compare with a socket: `socket.on('data', cb)` -> libuv registers the fd with epoll/kqueue/IOCP. When the OS
says "readable", libuv reads the bytes (non-blocking `read`) and calls into JS. No pool thread.

**Lifecycle of a Node process** (useful for "when does Node exit?" questions)

1. Start: initialise V8, libuv, load core modules, run bootstrap.
2. Run main module synchronously (all top-level code).
3. Drain `process.nextTick` queue and microtasks (promise jobs).
4. Start the event loop: `uv_run` loops phases while there are active ref'd handles/requests.
5. When nothing remains: emit `beforeExit` (you may schedule more work here), then `exit`, then terminate.
6. `process.exit()` or an uncaught exception ends it earlier.

```js
// lifecycle.js
process.on('beforeExit', () => console.log('beforeExit: loop empty'));
process.on('exit', (code) => console.log('exit with code', code));
setTimeout(() => console.log('timer'), 10);
console.log('main script done');
// Output order: main script done -> timer -> beforeExit -> exit with code 0
```

**A tiny HTTP server mapped to the layers**

```js
// server_layers.js
import { createServer } from 'node:http';

const server = createServer((req, res) => {          // Node core lib (JS)
  // llhttp (C) parsed the raw bytes into method/url/headers before this ran
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ path: req.url, pid: process.pid }));
});

server.listen(3000, () => console.log('listening on 3000'));
// listen(): libuv creates a TCP handle, binds, listens, registers with epoll/kqueue/IOCP
// each connection: OS accepts, libuv reads bytes, llhttp parses, V8 runs your callback
```

**Why it matters**

Layer knowledge lets you reason about bugs: "Is this slow because of JS (V8), because of I/O (libuv / OS),
or because of a native dependency (OpenSSL)?" It also explains why native addons exist (C++ code loaded into
the process, e.g. `bcrypt` uses native code, whereas `bcryptjs` is pure JS and slower).

**Frontend connection**

Think of the React stack: your components -> React library (JS) -> browser APIs -> browser engine (C++) ->
OS. Node has the same sandwich shape; your code sits on top, and the "browser engine" part is V8 + libuv.

**Real-world scenario**

During a traffic spike an API starts returning slow responses but CPU is 20%. Layer thinking: sockets are fine
(libuv), JS is idle (V8), so look at a blocked resource: DB connection pool exhaustion, or the 4-thread pool
being saturated by `bcrypt`/`fs`. (Day 2 teaches how to prove which.)

**Interview answer:**

"A Node process is layered. At the top is application code, below it Node's core JavaScript library, then
C++ bindings that connect to V8, which runs JavaScript, and libuv, which runs the event loop and asynchronous
I/O. Alongside are native libraries like OpenSSL for TLS, llhttp for HTTP parsing, c-ares for DNS resolving
and zlib. When I call `fs.readFile`, JavaScript calls a binding, libuv queues the work on its thread pool,
and when the read is finished the event loop runs my callback on the main thread."

**Follow-up questions**

1. *Where does Express fit?* Pure JavaScript library on top of `node:http`; it adds routing and middleware.
   It is not part of Node itself.
2. *What parses HTTP in Node?* llhttp (C, compiled from TypeScript/C via llparse) in the C++ layer; modern Node
   no longer uses the old `http_parser`.
3. *What is a native addon?* A compiled C/C++ (or Rust via N-API) module loaded by `require`. Node-API
   (N-API) gives a stable ABI across Node versions.
4. *When does a Node process exit on its own?* When the event loop has no more referenced handles/requests
   and no scheduled work.
5. *Where does your JS callback run after a file read finishes?* On the main JS thread, in the event loop's
   poll phase. Pool threads never execute JS.

**Common mistakes**

- Assuming `require('http')` loads code from disk each time; core modules are built into the binary.
- Believing Express handles the network. `node:http` and libuv do.
- Forgetting that a process with an open `setInterval` or a listening server never exits by itself.

**Revision notes**

- Layers: app -> core JS lib -> C++ bindings -> V8 + libuv (+ OpenSSL, llhttp, c-ares, zlib) -> OS.
- Callbacks always run on the main thread. Exit happens when the loop has nothing left.
- Native deps are in the Node binary; addons add more.

---

### 1.5 "Node is single-threaded": what is true and what is not [ESSENTIAL]

**Concept**

"Node single-threaded hai" half-truth hai. Sahi statement: **your JavaScript runs on a single main thread**
(one call stack). Lekin Node process ke andar aur bhi threads hote hain.

What is single-threaded: executing your JS callbacks. Only one JS function runs at any moment per
thread (per isolate). No two callbacks run in parallel on the main thread; that is why you do not need locks
for ordinary variables.

What is not single-threaded:

- libuv thread pool threads (4 by default, created lazily when the first pool job arrives).
- V8 background threads (GC helpers, JIT compile threads, platform workers).
- Optional `worker_threads` (each has its own V8 isolate, own event loop, own heap; Day 3).
- The OS kernel itself doing network work in parallel with your process.
- `cluster` / `child_process` run extra processes (not threads).

```js
// thread_count.js  -- keep the process alive and inspect its thread count from outside
console.log('pid', process.pid);
setInterval(() => {}, 1000);
```

- Windows PowerShell: `(Get-Process -Id <pid>).Threads.Count`
- Linux: `ls /proc/<pid>/task | wc -l`

A hello-world Node process typically shows more than 5 threads (the exact number depends on version/OS), even
though you wrote no threading code. That is the proof: **"single-threaded" refers to JS execution, not the
process.**

A runnable proof that CPU work blocks everything else (including timers):

```js
// block.js
const start = Date.now();
setTimeout(() => console.log(`timer asked for 100 ms, fired after ${Date.now() - start} ms`), 100);
while (Date.now() - start < 1000) { /* busy-wait for 1 second */ }
console.log('loop finished after', Date.now() - start, 'ms');
// Output: "loop finished after 1000 ms" first, then the timer fires after ~1000 ms, not 100.
```

**Why it matters**

This is the number-one Node.js interview topic. Good answers explain *why* a single JS thread can serve many
clients (I/O is not done by that thread) and *when* it fails (CPU work or sync calls on that thread).

**Frontend connection**

You already live with this in the browser: a heavy `for` loop freezes the UI because JS and rendering share
one main thread. On the server the "UI" is every other request. One slow synchronous handler freezes all
users, not just one.

**Real-world scenario**

A banking dashboard API has an endpoint that computes a monthly statement by looping over 2 million
transactions synchronously (800 ms). While one user calls it, every other user's request (balance check,
login) waits. p99 latency explodes. Fixes: move the aggregation into SQL, stream/batch it, use a worker
thread, or a separate job service. (Details Day 2/3.)

**Interview answer:**

"Node runs JavaScript on a single main thread with one call stack, so only one piece of JavaScript executes
at a time. It still handles many concurrent connections because I/O is not performed on that thread. Network
I/O is delegated to the operating system through epoll, kqueue or IOCP, and blocking operations like file
system calls and some crypto run on libuv's thread pool, and the results come back as callbacks queued on the
event loop. The consequence is that CPU-heavy or synchronous code blocks all requests, so I keep the main
thread free and offload heavy work to worker threads or separate services."

**Follow-up questions**

1. *So is Node multi-threaded or not?* The JS execution model is single-threaded; the runtime is not. The
   process has pool threads and V8 helper threads, and you can add worker threads.
2. *How do you use all CPU cores?* `cluster` module or process manager (PM2, multiple containers) for
   multiple processes behind a load balancer, and `worker_threads` for CPU work inside one service.
3. *Do you need locks in Node?* Not for plain JS variables on the main thread since callbacks do not
   interleave mid-function. You do need correct coordination across `await` points (a read-modify-write that
   spans an `await` can race with another request), and real locking for `SharedArrayBuffer`
   (Atomics) or in the database.
4. *Why is Node good at I/O-heavy workloads?* No thread per connection, so memory and context-switch
   overhead is small; the single thread is mostly idle waiting for OS notifications.
5. *Give an example where Node is a bad fit.* Image/video transcoding or large ML inference inside the
   request path on the main thread.

**Common mistakes**

- "Node is single-threaded so it cannot be parallel" -- it can, with workers, processes, the pool, the OS.
- "Node does not need synchronisation at all." Race conditions across `await` still happen (e.g. check
  stock, `await` DB, decrement stock).
- Thinking `async` functions run in parallel threads. They run on the same thread, interleaved at `await`.

**Revision notes**

- JS on one thread; runtime has other threads. Callbacks never run in parallel on the main thread.
- Blocking the main thread blocks every request. Offload CPU work.
- Scale across cores with processes (cluster/containers) or worker threads.

---

### 1.6 Release lines, LTS and runtime flags you should know [ESSENTIAL, short]

Node releases: even-numbered versions become LTS (Active LTS then Maintenance). Production should use an LTS
(22 here; 20 is in maintenance and nearing end of life -- verify dates on nodejs.org/en/about/previous-releases,
dates change). Odd-numbered releases are "Current" and never LTS.

| Need | Command / API | Notes |
|------|---------------|-------|
| Check versions | `node -v`, `node -p "process.versions"` | |
| Auto-restart in dev | `node --watch app.js` | Stable in Node 22; replaces nodemon for simple cases |
| Load `.env` | `node --env-file=.env app.js` | Node 20.6+; `process.loadEnvFile()` 20.12/21.7+ |
| Heap limit | `node --max-old-space-size=512 app.js` | MB |
| Debug | `node --inspect app.js` | Chrome DevTools via `chrome://inspect` |
| Expose gc() for experiments | `node --expose-gc app.js` | Experiments only; never rely on it in production |
| Built-in test runner | `node --test` | `node:test` is stable in 20+ (Week 6 uses Jest/Vitest) |

**Interview answer (version-awareness):** "I run the current Active LTS in production, pin it in `.nvmrc`
or the Docker image tag, and check release notes for behaviour changes when upgrading, for example the
`require(esm)` support and the stream default `highWaterMark` change in newer lines."

---

### Day 1 wrap-up

**Key concepts to remember**

- Node = runtime (V8 + libuv + core APIs). Not a language, not a framework.
- V8 runs JS (JIT, heap, GC, call stack, microtasks). It does not do I/O or timers.
- libuv = event loop + OS polling for sockets + thread pool (default 4) for blocking work.
- JS runs on one thread; the process has more threads. CPU work on the main thread blocks all requests.
- Callbacks always run on the main thread; pool threads never run JS.
- Layers: app -> core JS -> C++ bindings -> V8 + libuv (+ OpenSSL, llhttp, c-ares, zlib) -> OS.

**Five revision questions**

1. What is Node.js, and name four differences from browser JavaScript?
2. What does V8 do and what does it explicitly not do?
3. What is libuv and what are its two ways of providing "asynchronous" behaviour?
4. Why is "Node is single-threaded" an incomplete statement? Give three kinds of other threads or processes.
5. Walk through the layers when your code calls `fs.readFile`.

**One practical coding task**

Write `health.js`: an HTTP server on port 3000 that returns JSON with `pid`, `nodeVersion`, `v8Version`,
`uvVersion`, `uptimeSeconds`, and `heapUsedMB` (from `process.memoryUsage()`). Add a `/block` route that
busy-waits 3 seconds. Hit `/block` in one terminal and `/` in another and observe `/` hanging. Write 3
sentences on why.

**Self-assessment checklist**

- [ ] I can explain V8 vs libuv vs Node core in under 60 seconds.
- [ ] I can draw the layer diagram from memory.
- [ ] I can say which of sockets / fs / timers use the thread pool (answer: only fs; not sockets, not timers).
- [ ] I ran `block.js` and understand why the 100 ms timer fired late.
- [ ] I can explain why callbacks never run in parallel on the main thread.

---

## Day 2 - Event loop phases, async I/O, blocking vs non-blocking, thread pool

**Time plan (about 2 hours)**

| Minutes | Activity |
|---------|----------|
| 30 | 2.1 to 2.3: phases, nextTick/microtasks, timers vs immediate |
| 30 | 2.4: the "who does the work" matrix (most important table of the week) |
| 25 | 2.5 to 2.6: thread pool experiment, blocking vs non-blocking |
| 25 | Run every example, then output-prediction drill (2.8) |
| 10 | Day wrap-up |

**Learning objectives**

By the end of today you can:

1. Draw the Node event loop phases from memory and say what runs in each.
2. State where `process.nextTick` and promise microtasks run relative to the phases.
3. Predict output for `setTimeout` vs `setImmediate` vs `nextTick` vs promise (in the main module and inside an I/O callback).
4. For any given API, say whether it uses OS polling, the thread pool, the event loop only, or the main thread.
5. Explain and demonstrate thread-pool starvation, and how to fix it.
6. Define "blocking" precisely and list the common ways backend code accidentally blocks the loop.

Revisit Week 1 / Day 5 notes (event loop, microtasks vs macrotasks at the JS-language level) before
reading. Today is the Node-specific, libuv-level view of the same machine.

---

### 2.1 The event loop and its phases [ESSENTIAL]

**Concept**

Event loop ek **while loop** hai (libuv me `uv_run`) jo baar baar check karta hai: "kya koi timer expire hua?
kya koi I/O complete hua? kya koi setImmediate pending hai?" Aur jo callbacks ready hain unhe **ek ek karke
main thread par** chalata hai. Loop ke andar kaam **phases** me divided hai, har phase ki apni queue hoti hai.

```
        +----------------------------------------------------------+
   +--->|  1. TIMERS                                                |
   |    |     setTimeout / setInterval callbacks that are due       |
   |    +----------------------------------------------------------+
   |    +----------------------------------------------------------+
   |    |  2. PENDING CALLBACKS                                     |
   |    |     some deferred system callbacks (e.g. certain TCP      |
   |    |     errors on some platforms)                             |
   |    +----------------------------------------------------------+
   |    +----------------------------------------------------------+
   |    |  3. IDLE, PREPARE   (internal use only)                   |
   |    +----------------------------------------------------------+
   |    +----------------------------------------------------------+      +-----------------------+
   |    |  4. POLL                                                  |<-----|  incoming connections |
   |    |     - run completed I/O callbacks (socket data, fs done) |      |  data, fs completions |
   |    |     - or BLOCK here waiting for I/O (with a timeout)      |      +-----------------------+
   |    +----------------------------------------------------------+
   |    +----------------------------------------------------------+
   |    |  5. CHECK                                                 |
   |    |     setImmediate callbacks                                |
   |    +----------------------------------------------------------+
   |    +----------------------------------------------------------+
   +----|  6. CLOSE CALLBACKS                                       |
        |     socket.on('close'), handle close events               |
        +----------------------------------------------------------+

  BETWEEN every individual callback (Node 11+), Node drains:
       (a) the process.nextTick queue   -> then
       (b) the promise microtask queue  (repeat (a),(b) until both are empty)
  Also once after the main script finishes, before the loop starts.
```

**Internal working: what each phase does**

1. **Timers.** libuv keeps timers in a min-heap ordered by expiry. At the start of an iteration it updates its
   cached "now" and runs every timer whose time has come. A timer's delay is a **minimum**, not a guarantee:
   if the loop is busy, it fires late. `setTimeout(fn, 0)` is coerced to 1 ms.
2. **Pending callbacks.** Callbacks deferred from a previous iteration for certain system operations.
   Rarely relevant for application code.
3. **Idle/prepare.** Internal hooks.
4. **Poll.** The heart. It does two jobs:
   - Executes callbacks for completed I/O (a socket became readable, a pool job finished, etc.).
   - If there is nothing to execute, it decides **how long to block**:
     - If `setImmediate` callbacks are queued -> do not block; go on to the check phase.
     - Else if timers exist -> block until the nearest timer is due (this is why idle Node uses about 0% CPU
       yet wakes up on time).
     - Else -> block until an I/O event arrives (epoll_wait / kevent / GetQueuedCompletionStatus), or exit if
       the loop has no more active handles.
5. **Check.** Runs `setImmediate` callbacks. It exists so you can run code "right after the poll phase".
6. **Close callbacks.** `socket.destroy()` -> `'close'` event, etc.

Loop liveness: the loop keeps iterating while there are **active, referenced** handles or pending requests.
An `unref()`'d timer or server does not keep the process alive.

**nextTick and promises are NOT phases.** They are queues drained *between* callbacks:

- `process.nextTick(cb)`: Node's own queue. Highest priority. Runs after the current operation completes,
  before the loop moves on.
- Promise `.then` / `await` continuation and `queueMicrotask`: V8's microtask queue.
- Order in CommonJS: after the current JS stack empties, **nextTick queue first, then promise microtasks**.
- **Module-system nuance:** inside an **ES module**, top-level code itself runs as part of a promise job, so
  promise microtasks scheduled at top level run **before** the nextTick queue. The same snippet therefore
  prints in a different order in `.mjs` and `.cjs` files. Inside later callbacks (timers, I/O), nextTick
  runs before promises in both.
- Before Node 11, these queues were drained only between *phases*, not between each timer callback. Today
  they drain after every callback (matches browsers).

```js
// order.js (ESM, because package.json has "type": "module")
import { readFile } from 'node:fs';

setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('queueMicrotask'));
console.log('sync');

readFile(import.meta.filename, () => {
  setTimeout(() => console.log('io: timeout'), 0);
  setImmediate(() => console.log('io: immediate'));
  process.nextTick(() => console.log('io: nextTick'));
  Promise.resolve().then(() => console.log('io: promise'));
});
```

Observed output (Node 20, ESM; Node 22 behaves the same here):

```
sync
promise
queueMicrotask
nextTick
immediate          <- timeout/immediate order from the main module is NOT guaranteed
timeout            <- (either may come first; depends on how long startup took)
io: nextTick
io: promise
io: immediate      <- inside an I/O callback, immediate ALWAYS comes before timeout
io: timeout
```

The same top-level script saved as `order.cjs` (CommonJS) prints `sync, nextTick, promise, queueMicrotask, ...`.

Why `io: immediate` always beats `io: timeout`: the I/O callback runs in the poll phase. The next phase is
check (immediates), and only after the loop wraps around does the timers phase run. Why main-module order is
nondeterministic: when the script ends and the loop starts, whether 1 ms has already elapsed (so the timer
is due in the first timers phase) depends on how long bootstrapping took.

**Starvation risk: recursive nextTick (or recursive microtasks)**

```js
// starve.js
let n = 0;
setTimeout(() => console.log('timer finally ran after', n, 'nextTicks'), 0);
function spin() { if (++n < 1_000_000) process.nextTick(spin); }
spin();
// The timer cannot run until the nextTick queue is empty: timers and I/O are starved.
```

Replace `process.nextTick(spin)` with `setImmediate(spin)` and the timer fires early, because the loop gets to
turn between iterations. Rule: use `setImmediate` to yield to the event loop; never recurse unboundedly on
nextTick or `Promise.resolve().then`.

**Why it matters**

Event loop phases explain real bugs: "why does my timer fire 300 ms late?" (something blocked the loop),
"why does my response sometimes come before the log line?" (ordering of queues), "why is my server
frozen but CPU shows idle?" (pool or DB pool exhausted). It is also the most common Node-specific
interview question after "what is Node.js".

**Frontend connection**

Browser: call stack, microtask queue (promises), task queue (timers, events), then render. Node: call stack,
nextTick + microtask queues, then libuv phases (timers, poll, check...). There is no rendering step in Node,
but there is a poll phase that waits for I/O. Promises behave the same in both; `nextTick` and
`setImmediate` are Node-specific.

**Real-world scenario**

A batch job in a payments service iterates 100k settlement records inside a recursive
`Promise.resolve().then` loop. It starves the health-check endpoint (timers and I/O never get a turn), and the
load balancer kills the instance. Fix: yield with `setImmediate` every N items, or move the batch to a worker.

**Interview answer:**

"The Node event loop, implemented by libuv, runs in phases: timers for expired `setTimeout` and
`setInterval` callbacks, pending callbacks, idle/prepare, then the poll phase where completed I/O callbacks
run and where the loop blocks waiting for events if nothing is ready, then the check phase for
`setImmediate`, and finally close callbacks. Between every callback Node drains `process.nextTick` first and
then promise microtasks. So within one turn the order is: synchronous code, nextTick, promises, and then
the phases. Timers are minimum delays, not guarantees, because a busy main thread delays them."

**Follow-up questions**

1. *What is the difference between `setImmediate` and `setTimeout(fn, 0)`?* `setImmediate` runs in the check
   phase right after poll; `setTimeout 0` (1 ms) runs in the timers phase. From the main module the order is
   nondeterministic; inside an I/O callback `setImmediate` is always first.
2. *`process.nextTick` vs `Promise.then`?* Both run before the loop continues. In CommonJS nextTick runs
   first; at the top level of an ES module, promise callbacks run first. Do not build logic that depends on
   it; use nextTick sparingly (it can starve I/O).
3. *Why is the timer delay not exact?* The delay is a lower bound. The timer is only checked when the loop
   reaches the timers phase, and a long callback ahead of it postpones that.
4. *What does the poll phase do when idle?* It blocks (sleeps in epoll/kqueue/IOCP) up to the time of the
   nearest timer, or until I/O arrives, or not at all if immediates are pending.
5. *What happens when the loop has nothing to do?* The process emits `beforeExit` and then `exit`.
6. *Does Node's loop differ from the browser's?* Same concept; different phases and extra APIs (nextTick,
   setImmediate). The browser loop includes rendering opportunities and different task-source priorities.

**Common mistakes**

- Drawing the phases as including a "microtask phase" or "nextTick phase". They are queues drained between
  callbacks, not phases.
- Claiming `setImmediate` always fires before/after `setTimeout 0` from the top level. It does not.
- Believing `setTimeout(fn, 100)` runs *exactly* after 100 ms.
- Using `nextTick` for "run later" in recursive loops.

**Revision notes**

- Phases: timers -> pending -> idle/prepare -> poll -> check -> close. Poll blocks when idle.
- nextTick and microtasks are drained after every callback; nextTick first in CJS, promises first at ESM top
  level.
- `setImmediate` is the way to yield to the loop. Never recurse on nextTick unbounded.

---

### 2.2 How a request flows through the loop (end-to-end trace) [ESSENTIAL]

Trace one request through this server, naming the mechanism at each step.

```js
// trace_server.js
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

createServer(async (req, res) => {
  console.log('1. handler starts (main thread, inside a poll-phase callback)');
  const text = await readFile(import.meta.filename, 'utf8');  // thread pool
  console.log('3. back from readFile (promise continuation, microtask on main thread)');
  res.end(`bytes read: ${text.length}\n`);
  console.log('4. res.end called; kernel sends bytes when the socket is writable (OS)');
}).listen(3000);
```

Step by step:

1. The browser connects; the kernel completes the TCP handshake; libuv's epoll/IOCP wakes the poll phase; Node
   accepts the connection and reads bytes without any pool thread.
2. llhttp parses the request on the main thread; Node calls your handler (still the main thread).
3. `readFile` hands work to the **thread pool**. The main thread is free and serves other requests.
4. A pool thread finishes the blocking read and posts a completion; the poll phase runs the callback; the
   promise resolves; the `await` continuation runs as a microtask.
5. `res.end()` writes to the socket. Node attempts a non-blocking write; if the kernel buffer is full, the
   rest waits for a "writable" notification (Day 5: backpressure).

**Common mistake:** "the await makes the thread wait". `await` suspends only that async function; the thread
returns to the loop and serves others.

---

### 2.3 setTimeout vs setImmediate vs nextTick vs queueMicrotask: when to use which [ESSENTIAL, short]

| API | Queue / phase | Typical use |
|-----|---------------|-------------|
| `process.nextTick(fn)` | nextTick queue, before promises (CJS) | Emit events after a constructor returns so listeners can attach; Node internals |
| `queueMicrotask(fn)` / `Promise.then` | V8 microtask queue | Defer within the current tick; promise continuations |
| `setImmediate(fn)` | check phase | Yield to the loop; split CPU work into chunks |
| `setTimeout(fn, ms)` | timers phase | Delays, timeouts, retry backoff |
| `setInterval(fn, ms)` | timers phase | Periodic work; `unref()` it so it does not keep the process alive |

Example of the nextTick-in-constructor use:

```js
import { EventEmitter } from 'node:events';

class Job extends EventEmitter {
  constructor() {
    super();
    // Wrong: this.emit('ready') here would fire before the caller attached a listener.
    process.nextTick(() => this.emit('ready'));
  }
}
const j = new Job();
j.on('ready', () => console.log('listener received ready')); // works because emit is deferred
```

**Interview answer:** "I use `setImmediate` when I want to yield to the event loop between chunks of work,
`setTimeout` for real delays, promises and `await` for normal async flow, and `process.nextTick` only for rare
cases like deferring an event emission until after the constructor returns, because recursive nextTick can
starve I/O."

---

### 2.4 Who does the work: OS async I/O vs libuv thread pool vs event loop vs main thread [ESSENTIAL]

This is the table interviewers dig into. "Async" in Node is not one mechanism. Memorise the categories, not
every API.

| Category | What it uses | Examples |
|----------|--------------|----------|
| **A. OS network/readiness I/O via the event loop** (epoll on Linux, kqueue on macOS/BSD, IOCP on Windows) | No pool thread. The poll phase waits on the OS. | `net` TCP sockets, `http`/`https`/`http2` client and server, TLS sockets, `dgram` (UDP), pipes, `child_process` stdio pipes, TTY, signals, `dns.resolve*` (c-ares uses its own sockets driven by the loop) |
| **B. Event loop only (no I/O, no thread)** | Loop internal data structures | Timers (min-heap + poll timeout), `setImmediate`, `process.nextTick`, microtasks, `EventEmitter` (pure synchronous JS) |
| **C. libuv thread pool** (blocking syscall or CPU work run on a pool thread; callback posted back) | Default 4 threads, shared by everything in this row | Most `fs` async APIs (callback and `fs.promises`, streams over files), `dns.lookup()` (getaddrinfo) and `dns.lookupService`, `crypto.pbkdf2`, `crypto.scrypt`, `crypto.randomBytes` / `randomFill` / `randomInt` (async forms), `crypto.generateKeyPair`, `crypto.hkdf`, async `zlib` compression/decompression, native addons that use `uv_queue_work` / N-API async work (npm `bcrypt` does) |
| **D. Separate OS process, thread or kernel notification (not the pool)** | OS creates a process or notification | `child_process.spawn/exec` (separate process; its output arrives over pipes = category A), `fs.watch` (inotify / FSEvents / ReadDirectoryChangesW notifications delivered via the loop), `worker_threads` (separate V8 isolate with its own loop) |
| **E. Always the main thread (blocks the loop)** | Your JS thread | All `*Sync` APIs (`readFileSync`, `pbkdf2Sync`, `execSync`, `spawnSync`), `JSON.parse/stringify`, regex matching, `Array.sort`, loops, string building, `crypto.createHash` (streaming `update/digest` runs synchronously on the calling thread), pure-JS libraries (`bcryptjs`), the CPU work of TLS encryption/decryption (the socket wait is OS-driven, but OpenSSL processing of the bytes runs on the main thread) |

**Precision notes (these are the details interviewers like)**

1. **`dns.lookup` vs `dns.resolve`.** `dns.lookup()` calls the OS `getaddrinfo()` (honours `/etc/hosts` and the
   OS resolver config) and, being a blocking call, runs on the **thread pool**. `dns.resolve*()` talks to DNS
   servers directly via c-ares over sockets and does **not** use the pool. Importantly, `net.connect` and
   `http.request` to a *hostname* use `dns.lookup` internally, and global `fetch` (undici) also resolves
   hostnames through the same lookup by default. So a saturated thread pool can slow down **outbound HTTP
   calls**, even though the HTTP I/O itself is OS-polled. This surprises people.
2. **`fs` uses the pool on every platform** (libuv has no portable async file API). Newer libuv versions can
   use `io_uring` for some operations on Linux; that is version- and configuration-dependent, so do not claim
   it as a default fact. `fs.watch` is different: it uses kernel notification APIs delivered through the loop,
   not pool reads.
3. **`fs.promises` and `fs.createReadStream` are still pool-backed.** Promises and streams are only JS APIs on
   top.
4. **Crypto split.** Heavy key derivation and random generation have async forms that run on the pool.
   `createHash`/`createHmac` and one-shot `crypto.hash()` run synchronously on the main thread (fast for
   small inputs, blocking for huge ones; for large files stream into the hash, which still burns main-thread
   CPU in small slices). `crypto.subtle` (WebCrypto) operations are asynchronous and generally pool-backed;
   verify a specific method against your Node version before claiming it.
5. **bcrypt packages differ.** npm `bcrypt` (native) hashes on the pool (non-blocking, but limited by pool
   size). `bcryptjs` (pure JS) runs on the main thread and **will** block the loop for the hash even though its
   API looks async. Week 5 covers password hashing.
6. **TLS.** Waiting for TLS bytes is OS-polled; encrypting/decrypting happens in OpenSSL on the main thread.
   Terminating TLS in Node under heavy load costs main-thread CPU; many deployments terminate TLS at a
   reverse proxy or load balancer (nginx, ALB).
7. **`process.stdout.write` / `console.log`.** Synchronous or asynchronous depending on the destination (file,
   pipe, TTY) and OS (see the Node docs section "A note on process I/O"). In hot paths heavy logging can
   block; use a buffered structured logger (Week 6).
8. **Promises and async/await do no I/O by themselves.** They only resume JS after something finishes. The
   underlying operation decides the mechanism.
9. **`setTimeout` uses no thread.** The loop computes the poll timeout from the nearest timer.
10. **`child_process.spawn` creates an OS process.** Waiting for its output is category A; the child's CPU
    work happens outside your process and in parallel. `execSync` blocks the main thread until the child exits.

**Decision flow to answer "what does this call use?"**

```
Is it a socket / pipe / TTY / signal / UDP?                          -> OS polling via event loop (no pool)
Is it a timer / immediate / nextTick / promise / EventEmitter?       -> loop or queues (no pool, no I/O)
Is it fs.*, dns.lookup, pbkdf2/scrypt/randomBytes, async zlib?       -> thread pool
Is it a *Sync API, JSON, regex, loop, createHash, pure-JS library?   -> main thread (blocks)
Is it spawn / worker_threads?                                        -> separate process / thread
```

**Why it matters**

When a service slows under load, the right fix depends on the resource: socket concurrency (usually fine), pool
saturation (raise `UV_THREADPOOL_SIZE`, reduce pool work, change design), or main-thread CPU (workers or a
separate service). Treating every "async" call as magic leads to wrong diagnoses.

**Frontend connection**

In the browser you never think about this because the browser decides. Think of `fetch` (network stack) vs
`crypto.subtle.digest` (browser background threads) vs a heavy `for` loop (main thread). Same three buckets;
in Node you can see them.

**Real-world scenario**

A fintech login API verifies passwords with native `bcrypt` (cost 12, about 250 ms per hash, runs on the pool).
At peak, 40 concurrent logins queue on the 4 pool threads: each login waits behind others (up to about 2.5
seconds), and meanwhile `fs.readFile` for config and `dns.lookup` for the DB hostname also wait. Users see slow
logins *and* slow unrelated endpoints, while Node's main-thread CPU looks fine and sockets are fine. Remedies:
rate-limit login, justify the cost factor, scale out instances, tune the pool size to the core count, resolve
DNS once/cached, and use a pooled DB connection so lookups are rare.

**Interview answer:**

"Not every asynchronous operation in Node works the same way. Network I/O such as TCP, HTTP and TLS sockets is
handled by the operating system's polling mechanisms, epoll, kqueue or IOCP, driven by libuv's poll phase, with
no extra thread. Timers and promises are managed by the event loop and microtask queues without any I/O.
Operations with no suitable async OS API, such as file system calls, `dns.lookup`, async `pbkdf2`, `scrypt`,
`randomBytes` and zlib, run on libuv's thread pool, which has four threads by default. Everything marked
Sync, plus `JSON.parse`, regular expressions and pure-JavaScript code, runs directly on the main thread and
blocks the event loop. The mechanism determines where bottlenecks appear."

**Follow-up questions**

1. *Which requests are affected if the thread pool is saturated?* Anything that needs the pool: `fs`, DNS
   `lookup` (including hostname-based outbound HTTP connections), async crypto, async zlib. Traffic on
   already-established keep-alive sockets continues to flow.
2. *Does `fs.readFile` block the event loop?* The async form does not; the blocking syscall happens on a pool
   thread. The sync form blocks. Both are fine at startup; only the sync form is dangerous in request paths.
3. *Is an HTTP request a thread-pool job?* No (except hostname resolution through `dns.lookup`).
4. *How would you prove which mechanism an operation uses?* Experiment: saturate the pool with 4+ long
   `pbkdf2` jobs, then time `fs.stat` and a local HTTP request. The fs call is delayed, the HTTP call is not
   (see 2.5). On Linux you can also use `strace -f` or `perf`.
5. *Is it true that Node uses a thread per CPU core for async?* No. The pool defaults to 4 regardless of core
   count.
6. *Are there other thread pools?* V8 platform worker threads (GC, compilation) are separate from libuv's pool;
   `worker_threads` are separate again.

**Common mistakes**

- "All async code in Node runs on the thread pool."
- "Network requests use the thread pool." (Only the DNS `lookup` part may.)
- "`await` makes it non-blocking." Not if the awaited thing is a CPU-bound pure-JS function.
- Treating `crypto.createHash` as asynchronous because it is used with streams/promises.
- Using `bcryptjs` and assuming it behaves like native `bcrypt` regarding blocking.

**Revision notes**

- Sockets/pipes/signals: OS polling. Timers/microtasks: loop only. fs/dns.lookup/pbkdf2/scrypt/randomBytes/
  zlib: thread pool. Sync APIs, JSON, regex, pure JS: main thread.
- `dns.lookup` (pool) vs `dns.resolve` (c-ares, loop).
- Pool default 4, shared by all pool users. Saturation is felt as latency in unrelated features.

---

### 2.5 The libuv thread pool in practice: size, sharing, starvation [ESSENTIAL]

**Concept**

Thread pool ek chhota group of worker threads hai (default 4) jo blocking tasks ek queue se uthata hai (FIFO).
Agar 4 se zyada tasks ek saath aaye to baaki **queue me wait** karte hain. Ye pool alag-alag features me
**shared** hai: fs, dns.lookup, crypto, zlib. Isliye ek heavy crypto burst se file reads bhi slow ho jaate hain.

**Internal working**

- Created lazily on first use (not at startup). Size read from `UV_THREADPOOL_SIZE` at that time. Max 1024.
- Work items go on a global queue. Each worker picks the next item, runs the blocking C function, and posts
  the result back to the loop via an async handle. The callback then runs on the main thread.
- No priorities; FIFO. Long jobs delay short jobs queued behind them (head-of-line blocking).
- Set the size **when launching the process**:
  - bash/zsh: `UV_THREADPOOL_SIZE=8 node app.js`
  - PowerShell: `$env:UV_THREADPOOL_SIZE = 8; node app.js`
  - Docker/PM2/systemd: set it as an environment variable of the process.
  Setting `process.env.UV_THREADPOOL_SIZE` inside your script is unreliable (it works only if it happens
  before anything touches the pool, and behaviour has differed across platforms and versions). Do it at launch.

**Runnable experiment: prove which operations use the pool**

```js
// pool_experiment.js
import { pbkdf2 } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import http from 'node:http';

const t0 = performance.now();
const ms = () => Math.round(performance.now() - t0);

const server = http.createServer((req, res) => res.end('ok'));
server.listen(0, '127.0.0.1', async () => {
  const { port } = server.address();

  // Fill the pool: 8 CPU-heavy jobs on a pool of 4 threads.
  for (let i = 1; i <= 8; i++) {
    pbkdf2('pw', 'salt', 300_000, 64, 'sha512', () => console.log(`pbkdf2 #${i} done at ${ms()} ms`));
  }

  const timeIt = async (label, fn) => { await fn(); console.log(`${label} finished at ${ms()} ms`); };

  await Promise.all([
    timeIt('fs.stat    (thread pool)', () => stat(import.meta.filename)),
    timeIt('dns.lookup (thread pool)', () => lookup('localhost')),
    timeIt('http GET   (OS polling) ', () => new Promise((resolve) => {
      http.get({ host: '127.0.0.1', port }, (res) => { res.resume(); res.on('end', resolve); });
    })),
  ]);

  server.closeAllConnections();
  server.close();
});
```

Observed output on a 4-thread pool (numbers vary by machine):

```
http GET   (OS polling)  finished at 32 ms      <- not delayed at all
pbkdf2 #1 done at 388 ms                        <- first 4 jobs run in parallel
pbkdf2 #4 done at 393 ms
pbkdf2 #3 done at 410 ms
pbkdf2 #2 done at 418 ms
pbkdf2 #5 done at 800 ms                        <- jobs 5-8 waited for a free thread
fs.stat    (thread pool) finished at 801 ms     <- queued behind the crypto jobs
dns.lookup (thread pool) finished at 804 ms     <- same
pbkdf2 #6 done at 809 ms
...
```

Interpretation: the HTTP request finished immediately (OS-polled, no pool). `fs.stat` and `dns.lookup` waited
about one whole "round" of pbkdf2 jobs because they sit in the same FIFO queue. Run again with
`UV_THREADPOOL_SIZE=8`: all 8 pbkdf2 jobs finish at about the same time (limited by your CPU cores), and
fs/dns are no longer stuck behind them. If your machine has fewer than 8 cores each job takes longer because
they compete for CPU. That is the trade-off.

**Sizing guidance**

- CPU-bound pool work (pbkdf2, scrypt, bcrypt, zlib): the benefit stops at the number of physical cores. More
  threads than cores only adds context switching.
- Blocking-I/O-bound pool work (many fs ops on slow or network disks): a larger pool can help.
- The pool is process-wide, so never size it without measuring (event-loop lag + request latency test, Week 6).
- Alternative designs: run login hashing in its own service/worker, rate-limit it, or scale out instances.

**Why it matters**

"Why is my API slow while CPU is fine?" is a classic production question; shared-pool saturation is one of the
unexpected answers. Mentioning `UV_THREADPOOL_SIZE` and head-of-line blocking is a strong signal.

**Frontend connection**

Similar to the browser's limit of about 6 parallel HTTP/1.1 connections per origin: a fixed concurrency limit
and a queue. Work beyond the limit waits, it does not fail.

**Real-world scenario**

A report generator gzips 20 files per request using async zlib; during month-end reports, login (bcrypt) and
file download endpoints slow down together. Root cause: the shared 4-thread pool. Fix: queue report jobs to a
worker process, raise `UV_THREADPOOL_SIZE` for the API process modestly, and keep report jobs out of the
request path.

**Interview answer:**

"libuv's thread pool has four threads by default, configurable up to 1024 through `UV_THREADPOOL_SIZE`, and it
is shared by file system operations, `dns.lookup`, and async crypto and zlib. Tasks run first-in first-out, so
if slow jobs like `pbkdf2` fill the pool, unrelated operations such as file reads and hostname lookups wait
behind them. Raising the pool size helps only up to the number of cores for CPU-bound work, so I would measure
before tuning and consider moving heavy work to separate workers or services."

**Follow-up questions**

1. *Does the thread pool run my JavaScript callbacks?* No. It runs native C/C++ work. The callback runs on the
   main thread.
2. *If I set the pool to 128, what is the downside?* Memory per thread, context switching, CPU contention. No
   benefit once threads exceed cores for CPU-bound jobs.
3. *Is the pool created at startup?* Lazily, on the first job that needs it.
4. *What is head-of-line blocking here?* A short job (`fs.stat`) waits behind long jobs queued earlier because
   the queue is FIFO.
5. *How do I know the pool is saturated?* Rising latency on fs/crypto/DNS calls while the main thread's CPU is
   low and sockets are fine; measure durations of those calls; compare with a larger `UV_THREADPOOL_SIZE`.

**Common mistakes**

- Setting `UV_THREADPOOL_SIZE` inside code after other modules already used the pool.
- Assuming the pool size scales with CPU count.
- Running pool-heavy work in the request path without limits.

**Revision notes**

- Pool = default 4 workers, FIFO queue, shared by fs/dns.lookup/crypto/zlib. Callbacks run on the main thread.
- Saturation slows unrelated features. Size at process launch. Do not exceed cores for CPU-bound jobs.

---

### 2.6 Blocking vs non-blocking, and how to keep the event loop healthy [ESSENTIAL]

**Concept**

**Blocking** ka matlab: kuch bhi aisa jo main JS thread ko "wait ya compute" me rokta hai, jisse event loop agli
iteration nahi le paata. Tab tak koi timer, koi request callback, kuch nahi chalta. **Non-blocking** =
operation start karo, thread free chhodo, result callback/promise se lo.

Two different kinds of blocking (many candidates confuse them):

1. **Blocking on I/O wait:** `fs.readFileSync` -- the thread waits for the disk. Avoid in request paths.
2. **Blocking on CPU:** a long loop, `JSON.parse` of 200 MB, a catastrophic regex, `pbkdf2Sync`. `await` does
   not help, because the code is running, not waiting.

**Internal working: how to see blocking**

```js
// sync_vs_async.js
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

let ticks = 0;
const timer = setInterval(() => ticks++, 1);   // wants to run every 1 ms
const file = import.meta.filename;

const a = performance.now();
for (let i = 0; i < 2000; i++) readFileSync(file);
console.log(`sync : ${Math.round(performance.now() - a)} ms, timer ticks during work = ${ticks}`);

ticks = 0;
const b = performance.now();
await Promise.all(Array.from({ length: 2000 }, () => readFile(file)));
console.log(`async: ${Math.round(performance.now() - b)} ms, timer ticks during work = ${ticks}`);
clearInterval(timer);
```

The sync run shows `ticks = 0` (the timer could not run at all during the loop). In the async run the timer
gets to fire while pool threads do the reads. Total time is similar for a small file, but responsiveness
differs. (Exact numbers vary.)

**Measure event loop delay** (this is how you detect blocking in production):

```js
// loop_lag.js
import { monitorEventLoopDelay } from 'node:perf_hooks';

const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();

setTimeout(() => {                    // simulate a blocking handler
  const end = Date.now() + 300;
  while (Date.now() < end) { /* block 300 ms */ }
}, 100);

setTimeout(() => {
  h.disable();
  const ms = (ns) => (ns / 1e6).toFixed(0);
  console.log(`max ${ms(h.max)} ms, p99 ${ms(h.percentile(99))} ms, mean ${ms(h.mean)} ms`);
}, 800);
// Observed: max about 316 ms. A healthy idle server shows a max of a few ms.
```

**Common ways backend code blocks the loop**

| Cause | Example | Better approach |
|-------|---------|-----------------|
| Sync fs in a handler | `fs.readFileSync` per request | `fs.promises`, or cache at startup |
| Sync crypto | `pbkdf2Sync`, `bcrypt.hashSync`, `scryptSync` | Async versions (pool), or workers |
| Big JSON | `JSON.parse` of a 100 MB body | Limit body size, stream-parse, paginate |
| Catastrophic regex (ReDoS) | `/^(a+)+$/.test('aaaa...b')` | Linear regexes, input length caps, safe-regex checks, RE2 |
| CPU loops | 5M-element sort/aggregation in a handler | Do it in SQL, chunk with `setImmediate`, worker thread |
| `execSync` | shelling out synchronously | async `execFile` / `spawn` |
| Heavy synchronous logging | `console.log` of large objects | Structured buffered logger, log less |
| Lazy `require` of a heavy module inside a handler | `require()` per request | Load at startup |

ReDoS demo (takes seconds, careful):

```js
// redos.js
const evil = /^(a+)+$/;
const input = 'a'.repeat(26) + 'b';   // each extra 'a' roughly doubles the time
console.time('regex');
evil.test(input);
console.timeEnd('regex');
// Observed: several seconds on a laptop. The whole server is frozen during that time.
```

**Techniques to keep the loop responsive**

1. Prefer async APIs in request paths. Sync APIs are acceptable at **startup** (load config, read TLS certs).
2. Chunk CPU work and yield:

```js
// chunked.js
import { setImmediate as yieldToLoop } from 'node:timers/promises';

export async function sumBig(items, chunkSize = 10_000) {
  let total = 0;
  for (let i = 0; i < items.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, items.length);
    for (let j = i; j < end; j++) total += items[j];
    await yieldToLoop();               // let timers and I/O run between chunks
  }
  return total;
}

console.log(await sumBig(Array.from({ length: 1_000_000 }, (_, i) => i)));
```

   Yielding keeps others responsive but makes this job slower overall; for real parallelism use workers (Day 3).
3. Offload to `worker_threads` or another process/service (queue + worker, Week 6/7).
4. Move aggregation to the database (SQL `GROUP BY`) instead of looping in JS.
5. Limit input sizes (body size, array length, regex input length).
6. Monitor event-loop delay and alert (p99 above about 100 ms is a common smell; set your own SLO).

**Why it matters**

One blocking call in one endpoint degrades the whole server. Interviewers ask "your API is slow for all users
after deploying X, how do you investigate?" and expect event-loop-lag reasoning.

**Frontend connection**

Identical to long tasks freezing the browser main thread (Chrome DevTools flags "Long Task"). The remedies
also match: chunk work (`setTimeout`/`requestIdleCallback`) or move to a Web Worker, which in Node is
`worker_threads`.

**Real-world scenario**

An e-commerce admin endpoint exports orders to CSV by loading 500k rows, mapping them to CSV text, and calling
`JSON.stringify` for an audit log. It blocks for 2 seconds; during that time checkout requests time out. Fix:
stream rows from MySQL to the response (Day 4/5), apply pagination limits, or run exports as background jobs.

**Interview answer:**

"Blocking means occupying the main JavaScript thread so the event loop cannot process other callbacks. It can
be waiting, like `readFileSync`, or computing, like a huge JSON parse, a heavy loop, or a catastrophic regular
expression. Using `await` does not fix CPU-bound code because the code is actually running. I avoid sync APIs
in request paths, use streaming and pagination, push aggregation to the database, offload CPU work to worker
threads or separate workers, and monitor event-loop delay with `perf_hooks.monitorEventLoopDelay` to detect
blocking in production."

**Follow-up questions**

1. *Is an `async` function the same as non-blocking?* No. An `async` function runs synchronously until its
   first `await` that actually suspends; a heavy loop inside it still blocks.
2. *Is it OK to use sync fs APIs?* At startup and in CLI scripts, yes. In a server's hot paths, no.
3. *How do you detect event loop blocking?* `monitorEventLoopDelay`, timer-drift checks, APM tools, CPU
   profiles (`--cpu-prof`, `--inspect`), flamegraphs (clinic.js, 0x).
4. *What is ReDoS?* Regular-expression denial of service: nested quantifiers cause exponential backtracking on
   crafted input; since regex runs on the main thread, one request can freeze the server.
5. *Why does chunking with `setImmediate` help?* Control returns to the loop between chunks, so pending I/O and
   timer callbacks can run. Use `setImmediate`, not `nextTick` or microtasks, for this.

**Common mistakes**

- Wrapping blocking code in a Promise: `new Promise(r => r(heavySync()))` is still blocking.
- Using `await` in a loop and thinking it yields CPU time for long computations without a real async boundary.
- Micro-optimising JS while an N+1 database pattern or a sync call is the real blocker.
- Using `setTimeout(fn, 0)` to "make code async" -- it still runs on the same thread later.

**Revision notes**

- Blocking = main thread occupied (wait or CPU). `await` does not make CPU work non-blocking.
- Sync APIs only at startup. Chunk + `setImmediate`, workers, SQL aggregation, streaming, input limits.
- Monitor event-loop delay; sudden multi-hundred-ms values mean something blocked.

---

### 2.7 Bringing it together: one mixed example [ESSENTIAL]

Predict the order before running. Then check against the reasoning below.

```js
// mixed.js (ESM)
import { readFile } from 'node:fs';

console.log('A');
setTimeout(() => console.log('B: timeout 0'), 0);
setImmediate(() => console.log('C: immediate'));
readFile(import.meta.filename, () => {
  console.log('D: fs callback');
  setTimeout(() => console.log('E: timeout in fs'), 0);
  setImmediate(() => console.log('F: immediate in fs'));
  process.nextTick(() => console.log('G: nextTick in fs'));
});
Promise.resolve().then(() => console.log('H: promise'));
process.nextTick(() => console.log('I: nextTick'));
console.log('J');
```

Observed output: `A J H I C B D G F E`. Reasoning:

1. Synchronous first: `A`, `J`.
2. After the main module (ESM: it ran inside a promise job): promise microtasks, then nextTick: `H`, `I`.
   (In a CJS file this pair would be `I`, `H`.)
3. The loop starts. `B` and `C` order is racy (here `C` came first; often `B` first).
4. The fs callback `D` arrives later in the poll phase (after a pool round trip). After `D`: `G` (nextTick), then
   the loop proceeds to check: `F`, and on the next turn the timers phase: `E`.

Deterministic facts: `A, J` first; `H, I` before any phase callback; `G` right after `D`; `F` before `E`.
Racy: `B` vs `C`, and (rarely) whether `D` lands before them.

---

### 2.8 Output-prediction drill

Predict the output. Assume ESM (package.json `"type": "module"`) and a normal machine.

```js
// Q1
setTimeout(() => console.log(1), 0);
Promise.resolve().then(() => console.log(2));
process.nextTick(() => console.log(3));
console.log(4);
```

```js
// Q2 (inside an I/O callback)
import { readFile } from 'node:fs';
readFile(import.meta.filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
```

```js
// Q3
import { setTimeout as sleep } from 'node:timers/promises';
async function f() {
  console.log('f start');
  await sleep(0);
  console.log('f after sleep');
}
f();
Promise.resolve().then(() => console.log('micro'));
console.log('sync end');
```

```js
// Q4
const start = Date.now();
setTimeout(() => console.log('t1', Date.now() - start >= 50), 50);
const until = Date.now() + 200;
while (Date.now() < until) {}
console.log('loop done');
```

```js
// Q5
process.nextTick(() => console.log('tick1'));
Promise.resolve().then(() => {
  console.log('p1');
  process.nextTick(() => console.log('tick inside promise'));
}).then(() => console.log('p2'));
```

**Answers**

- Q1: `4, 2, 3, 1` in ESM (`4, 3, 2, 1` in CJS). Sync first, then microtasks/nextTick, then the timer.
- Q2: `immediate`, then `timeout`. Always: we are in poll, check comes before the next timers phase.
- Q3: `f start`, `sync end`, `micro`, `f after sleep`. `sleep(0)` is a timer (timers phase); `micro` runs right
  after the sync code.
- Q4: `loop done`, then `t1 true`. The timer is overdue but cannot run until the loop finishes (it runs at about
  200 ms, not 50).
- Q5: ESM: `p1, p2, tick1, tick inside promise`. CJS: `tick1, p1, p2, tick inside promise`. In both, the
  nextTick scheduled inside a promise callback runs only after the whole microtask queue is drained. (Verified
  by running both module types.)

---

### 2.9 Delivery tip

Practise a 90-second spoken answer to "Explain the Node event loop": (1) one thread runs JS, (2) libuv loop with
phases timers/poll/check/close, (3) nextTick and microtasks drain between callbacks, (4) sockets via OS
polling, fs/dns.lookup/crypto/zlib via the pool, (5) blocking the thread is the main failure mode. Time yourself.

### Day 2 wrap-up

**Key concepts to remember**

- Phases: timers -> pending -> idle/prepare -> poll -> check -> close. Poll blocks when idle.
- nextTick/microtasks drain after every callback; nextTick before promises in CJS; promises first at ESM top level.
- `setImmediate` after an I/O callback always precedes `setTimeout 0`; from the main module it is nondeterministic.
- Sockets/pipes/signals: OS polling. fs, `dns.lookup`, async pbkdf2/scrypt/randomBytes, zlib: thread pool (4).
  Sync APIs, JSON, regex, pure JS: main thread.
- `dns.lookup` uses the pool, `dns.resolve` does not. Hostname-based HTTP requests depend on `lookup`.
- The pool is shared and FIFO; saturation slows unrelated work. Set `UV_THREADPOOL_SIZE` at process launch.
- Blocking is both waiting and computing. `await` cannot fix CPU-bound code.
- Detect with `monitorEventLoopDelay`; fix with async APIs, streaming, chunking, workers, SQL.

**Five revision questions**

1. List the event loop phases in order and what each does.
2. Where do `process.nextTick` and promise callbacks run, and why does the order differ between CJS and ESM
   top level?
3. Name three operations that use the thread pool, three that use OS polling, and three that always block the
   main thread.
4. Describe an experiment that proves `fs.stat` uses the thread pool but a local HTTP request does not.
5. A server's p99 latency is 3 seconds but CPU is 25%. List three hypotheses and how to test each.

**One practical coding task**

Write `lag_probe.js`: an HTTP server with `/fast` (returns immediately), `/cpu` (busy loop of 500 ms), `/hash`
(async `pbkdf2` with 300000 iterations, respond with the hex length), and `/stats` (JSON of event-loop delay
max/p99 from `monitorEventLoopDelay`, reset on each read). Use a script (or `npx autocannon`) to hit `/cpu` and
`/fast` together and record `/fast` latency. Then hit `/hash` 10 times concurrently and compare `/fast` latency
and `/stats`. Write down which endpoint harms `/fast` and why. Repeat `/hash` with `UV_THREADPOOL_SIZE=8`.

**Self-assessment checklist**

- [ ] I can draw the six phases and the nextTick/microtask drain points without looking.
- [ ] I can predict `order.js` output and explain why `io: immediate` precedes `io: timeout`.
- [ ] I can place any API into one of the five categories in 2.4.
- [ ] I ran `pool_experiment.js` and saw `fs.stat` delayed while HTTP was not.
- [ ] I can give the 90-second event loop answer without hand-waving.
- [ ] I can list five ways code blocks the loop and one fix each.

---

## Day 3 - Worker threads, CommonJS vs ESM, process, Buffer, env variables

**Time plan (about 2 hours)**

| Minutes | Activity |
|---------|----------|
| 30 | 3.1 to 3.2: worker_threads, cluster, child_process comparison |
| 30 | 3.3: CommonJS vs ES modules |
| 20 | 3.4: `process` object |
| 20 | 3.5: Buffer |
| 10 | 3.6: environment variables and config |
| 10 | Day wrap-up |

**Learning objectives**

By the end of today you can:

1. Decide between worker threads, child processes and cluster for a given problem, and justify it.
2. Write a working worker-thread example with `workerData` and message passing, and a small worker pool.
3. Explain CommonJS vs ES modules: loading, caching, `this`, `__dirname`, live bindings, interop, and
   the `require(esm)` situation per Node version.
4. Use `process` for argv, env, exit codes, signals and error events correctly.
5. Explain what a `Buffer` is, why strings and Buffers differ in length, and why Buffers live outside the V8 heap.
6. Load and validate configuration from environment variables safely.

---

### 3.1 Worker threads [ESSENTIAL concept, ADVANCED details]

**Concept**

Day 2 me dekha ki CPU-heavy kaam main thread ko block karta hai. **Worker threads** ka solution: Node ke andar
**alag JS thread** chalao, jiska apna V8 isolate, apna heap, apna event loop hota hai. Main thread free rehta hai.
Communication **message passing** se hoti hai (`postMessage`), shared variables se nahi.

When to use workers:

- CPU-bound work: image resizing, PDF generation, large JSON transformation, crypto done in pure JS, parsing
  big CSV in memory, complex calculations.

When NOT to use them:

- I/O-bound work (DB calls, HTTP calls, file reads). Node already handles these without blocking. Putting
  `await db.query()` in a worker gains nothing.
- Tiny tasks: starting a worker costs tens of milliseconds and several MB of memory.

**Internal working**

```
 main thread                              worker thread
 +---------------------+                  +---------------------+
 | V8 isolate #1       |   MessagePort    | V8 isolate #2       |
 | own heap, own loop  |<---------------->| own heap, own loop  |
 | own call stack      |  structured      | own call stack      |
 +---------------------+  clone / transfer+---------------------+
           \                                       /
            +---- shared: process, same OS process, optional SharedArrayBuffer
```

- A worker is an OS thread inside the same process. It has its own V8 isolate, so a crash or a leak there does
  not corrupt the main heap (an uncaught exception in a worker emits `'error'` on the Worker object and ends
  that worker; the process survives unless you re-throw).
- Messages are copied using the **structured clone algorithm** (objects, arrays, Map, Set, Date, typed arrays,
  but **not** functions or class instances with methods). Copy cost grows with size.
- **Transfer** avoids copying: `postMessage(buffer, [buffer])` moves an `ArrayBuffer`; the sender loses access.
- **SharedArrayBuffer + Atomics** gives real shared memory. You then need atomics for correctness
  (`Atomics.add`, `Atomics.compareExchange`, `Atomics.wait`). `[ADVANCED]`
- Workers share the process-wide libuv thread pool and the OS threads; they do not each get their own 4-thread
  pool. Heavy pool use inside several workers still contends for that pool.

**Example 1: offload a CPU task and keep the main thread responsive**

```js
// fib.js  (ESM)  run: node fib.js
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }

if (isMainThread) {
  const run = (n) => new Promise((resolve, reject) => {
    const w = new Worker(import.meta.filename, { workerData: { n } });
    w.once('message', resolve);
    w.once('error', reject);
    w.once('exit', (code) => { if (code !== 0) reject(new Error(`worker exited with ${code}`)); });
  });

  let ticks = 0;
  const timer = setInterval(() => ticks++, 10);       // main thread stays responsive
  const t0 = performance.now();
  const results = await Promise.all([run(38), run(38)]);   // two workers in parallel
  clearInterval(timer);
  console.log('results', results, 'in', Math.round(performance.now() - t0), 'ms; main-thread ticks:', ticks);
} else {
  parentPort.postMessage(fib(workerData.n));
}
```

Observed: both results `39088169`, about 437 ms total on a multi-core machine, and `ticks` is well above 0
(28 here), proving the main thread kept running. The same two calls done synchronously on the main thread
would take about twice as long and would freeze the timer.

`import.meta.filename` needs Node 20.11+/21.2+; on older versions use
`fileURLToPath(import.meta.url)`.

**Example 2: a minimal reusable worker pool (never spawn a worker per request)**

```js
// pool_worker.js  (worker side)
import { parentPort } from 'node:worker_threads';

function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }

parentPort.on('message', ({ id, n }) => {
  parentPort.postMessage({ id, result: fib(n) });
});
```

```js
// pool_main.js
import { Worker } from 'node:worker_threads';
import { availableParallelism } from 'node:os';

class WorkerPool {
  #idle = [];
  #queue = [];
  #pending = new Map();
  #nextId = 0;

  constructor(file, size = Math.max(1, availableParallelism() - 1)) {
    for (let i = 0; i < size; i++) this.#spawn(file);
  }

  #spawn(file) {
    const worker = new Worker(file);
    worker.on('message', ({ id, result }) => {
      const { resolve } = this.#pending.get(id);
      this.#pending.delete(id);
      resolve(result);
      this.#release(worker);
    });
    worker.on('error', (err) => {          // simplified: a production pool would replace the dead worker
      for (const { reject } of this.#pending.values()) reject(err);
      this.#pending.clear();
    });
    this.#idle.push(worker);
  }

  #release(worker) {
    const next = this.#queue.shift();
    if (next) worker.postMessage(next);
    else this.#idle.push(worker);
  }

  run(n) {
    return new Promise((resolve, reject) => {
      const id = this.#nextId++;
      this.#pending.set(id, { resolve, reject });
      const job = { id, n };
      const worker = this.#idle.pop();
      if (worker) worker.postMessage(job);
      else this.#queue.push(job);          // all busy: wait in the queue
    });
  }

  async close() {
    await Promise.all(this.#idle.map((w) => w.terminate()));
  }
}

const pool = new WorkerPool(new URL('./pool_worker.js', import.meta.url), 3);
const t0 = performance.now();
const results = await Promise.all([35, 35, 35, 35, 35, 35].map((n) => pool.run(n)));
console.log(results, Math.round(performance.now() - t0), 'ms');
await pool.close();
```

Run it: six jobs on three workers complete in two "rounds" (observed about 245 ms). In production use a
library such as **Piscina** (handles crashes, task cancellation, resource limits) instead of your own pool;
the point here is to understand the shape.

**Example 3: shared memory with Atomics** `[ADVANCED]`

```js
// shared.js
import { Worker, isMainThread, workerData } from 'node:worker_threads';

if (isMainThread) {
  const sab = new SharedArrayBuffer(4);
  const counter = new Int32Array(sab);
  const workers = Array.from({ length: 4 }, () => new Worker(import.meta.filename, { workerData: sab }));
  await Promise.all(workers.map((w) => new Promise((resolve) => w.once('exit', resolve))));
  console.log('total (expect 400000):', Atomics.load(counter, 0));
} else {
  const counter = new Int32Array(workerData);
  for (let i = 0; i < 100_000; i++) Atomics.add(counter, 0, 1);   // atomic increment
}
// With plain `counter[0]++` the total would be lower and different on every run (lost updates).
```

**Comparison: worker_threads vs child_process vs cluster**

| | `worker_threads` | `child_process` | `cluster` |
|---|---|---|---|
| Unit | Thread in same process | Separate OS process (any program) | Several Node processes (forked), sharing a listening port |
| Memory | Own heap, can share ArrayBuffers | Fully isolated | Fully isolated per process |
| Startup cost | Low (tens of ms) | Higher (new process) | Higher (new process) |
| Communication | `postMessage`, SharedArrayBuffer | stdio pipes, IPC messages | IPC messages |
| Crash isolation | Worker error contained; process-level fatal (e.g. OOM kill) can still take everything | Strong | Strong; primary restarts workers |
| Best for | CPU-bound JS tasks | Running other programs/scripts (ffmpeg, python); strong isolation | Using all cores for an HTTP server |

`cluster` quick look (runs several copies of the same server):

```js
// cluster_demo.js
import cluster from 'node:cluster';
import http from 'node:http';
import { availableParallelism } from 'node:os';

if (cluster.isPrimary) {
  for (let i = 0; i < availableParallelism(); i++) cluster.fork();
  cluster.on('exit', (worker, code) => {
    console.log(`worker ${worker.process.pid} exited (${code}); starting a replacement`);
    cluster.fork();
  });
} else {
  http.createServer((req, res) => res.end(`served by ${process.pid}\n`)).listen(3000);
}
```

The primary accepts connections and hands them to workers (round-robin on Linux/macOS; on Windows scheduling is
left to the OS, so you may see one worker handling most connections). Because processes do not share memory,
in-process state (an in-memory cache, a session Map, a rate-limit counter) is **per worker**, which causes bugs;
use Redis or the DB for shared state. In modern deployments the same goal is often met with multiple containers
or PM2 behind a load balancer (Week 7).

**Why it matters**

"How does Node scale across CPU cores?" and "What if one endpoint is CPU heavy?" appear in almost every Node
interview. A precise answer separates processes (scale the HTTP server), workers (parallelise a CPU task inside a
service), and queues/microservices (move heavy work out of the request path).

**Frontend connection**

Worker threads are the server-side Web Workers: separate thread, message passing, no shared DOM (here no shared
heap). Same rules: copy cost for big messages, `transferable` objects to avoid copies, do not spin up a new
worker for every tiny task.

**Real-world scenario**

A marketplace generates PDF invoices with a CPU-heavy library. Doing it inside the request blocks the API.
Option 1: a worker pool in the same service (simple; invoice generation latency is predictable). Option 2: push a
job to a queue consumed by a separate worker service (Week 6/7), better when load is high or generation is slow
because failures and retries become independent of the API.

**Interview answer:**

"Worker threads let me run JavaScript in parallel inside one Node process. Each worker has its own V8 isolate,
heap and event loop, and communicates with the main thread through message passing using structured clone, with
optional transferable objects or SharedArrayBuffer for shared memory. I use them for CPU-bound work such as image
processing, never for I/O, since Node already handles I/O asynchronously, and I use a pool because spawning a
worker per request is expensive. To use all cores for an HTTP server I would run multiple processes using
cluster, PM2 or multiple containers behind a load balancer."

**Follow-up questions**

1. *Worker threads vs cluster?* Workers parallelise CPU tasks inside one process and can share memory. Cluster
   forks entire processes to use multiple cores for a server; no shared memory.
2. *Can workers share variables?* No, except `SharedArrayBuffer`. Everything else is copied or transferred.
3. *Do worker threads make I/O faster?* No. I/O is already non-blocking; workers help only CPU-bound code.
4. *How do you handle errors in a worker?* Listen for `'error'` and `'exit'` on the `Worker`, reject the pending
   promise, and replace the worker in a pool.
5. *What are transferables?* Objects such as `ArrayBuffer` and `MessagePort` that are moved, not copied, when
   listed in the transfer list; the sender can no longer use them.
6. *Is there a limit on workers?* Practical: CPU cores and memory. More CPU-bound workers than cores only
   adds contention.
7. *Why does in-memory session or rate limit state break under cluster?* Each process has its own memory;
   share it via Redis or the database.

**Common mistakes**

- Spawning a new `Worker` for every request.
- Moving I/O work into workers.
- Passing huge objects back and forth (copy cost) instead of transferring buffers or sharing via
  SharedArrayBuffer.
- Forgetting `worker.on('error')` and `exit`, so promises never settle.
- Assuming in-memory state is shared across cluster workers.

**Revision notes**

- Worker = thread with its own V8 isolate/heap/loop. Message passing (structured clone, transferables).
- CPU-bound only; use a pool. cluster/containers for multi-core servers. child_process for other programs.
- SharedArrayBuffer + Atomics = real shared memory (advanced).

---

### 3.2 child_process: running other programs [ESSENTIAL, short]

```js
// child.js
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Small output, no shell, arguments passed as an array (prevents shell injection)
const { stdout } = await execFileAsync('node', ['--version']);
console.log('node version via child:', stdout.trim());

// Large or streaming output: spawn, and read stdout as a stream
const child = spawn('node', ['-e', 'for (let i = 0; i < 3; i++) console.log("line", i)']);
child.stdout.on('data', (chunk) => process.stdout.write(`child says: ${chunk}`));
child.on('close', (code) => console.log('child exited with', code));
```

Rules to remember:

- `exec` runs a command through a **shell** and buffers all output (default `maxBuffer` is limited). Passing
  user input into `exec` creates **command injection**. Prefer `execFile` or `spawn` with an argument array.
- `spawn` streams output (good for large output). `fork` starts a Node child with an IPC channel.
- The child's work happens in another process (true parallelism); waiting for its output is OS-polled pipe I/O.
- `execSync`/`spawnSync` block the main thread.

**Interview answer:** "I use `child_process` to run external programs like ffmpeg or a Python script. I prefer
`spawn` or `execFile` with an argument array, not `exec` with an interpolated string, to avoid shell injection,
and I stream output when it can be large."

---

### 3.3 CommonJS vs ES modules [ESSENTIAL]

**Concept**

Node ke paas **do module systems** hain:

- **CommonJS (CJS):** `require()` / `module.exports`. Original Node system, synchronous.
- **ES Modules (ESM):** `import` / `export`. JavaScript language standard, asynchronous loading, static
  structure. Same syntax you use in React/Vite.

How Node decides which system a file uses:

1. `.mjs` is ESM; `.cjs` is CommonJS.
2. `.js` follows the nearest `package.json` `"type"`: `"module"` -> ESM; `"commonjs"` or missing -> CJS.
3. Node 22.7+ can detect ESM syntax in an untyped `.js` file (`--experimental-detect-module`, enabled by default in
   22.7+/20.19+ in recent lines); do not rely on this in your own projects; set `"type"` explicitly.

**Internal working**

*CommonJS:* Node wraps each file in a function:

```js
(function (exports, require, module, __filename, __dirname) {
  // your file body
});
```

That is why `require`, `module`, `__dirname` exist as "globals" inside a CJS file, and why top-level `return`
works in CJS. The steps of `require('./x')`: resolve the path -> check the module cache
(`require.cache`) -> if not cached, read + compile + run **synchronously** -> store `module.exports` in the
cache -> return it. A second `require` returns the same object (module singleton).

*ESM:* three phases: **parse** (find all static `import`s without running code), **link** (create bindings),
**evaluate** (run code, dependencies first). Loading may be asynchronous (network, disk), so ESM supports
**top-level await**. Imports are **live bindings** (a read-only view of the exporter's variable), not copies.

**Side-by-side**

| Topic | CommonJS | ES modules |
|-------|----------|------------|
| Syntax | `const x = require('x')`, `module.exports = ...` | `import x from 'x'`, `export default ...` |
| Loading | Synchronous, at runtime, anywhere in code | Static analysis then async load; `import` must be top-level (use `import()` for dynamic) |
| Exports are | Values/objects copied by reference at require time (the object is shared; primitives are snapshots) | **Live bindings**: importer sees updates to exported `let` |
| `this` at top level | `module.exports` | `undefined` |
| Strict mode | Opt-in | Always strict |
| `__dirname`, `__filename`, `require` | Available | Not available. Use `import.meta.dirname` / `import.meta.filename` (Node 20.11+/21.2+) or `fileURLToPath(import.meta.url)` |
| File extension in imports | Optional (`require('./x')`) | Required for relative imports (`./x.js`) |
| Directory import | `require('./dir')` -> `index.js` | Not supported for relative paths |
| JSON | `require('./a.json')` | `import data from './a.json' with { type: 'json' }` (import attributes; stable in Node 22; Node 20 uses `assert` or `with` depending on the version, check docs) |
| Top-level await | No | Yes |
| Caching | `require.cache` (you can delete entries) | Module map keyed by URL; no supported way to evict |
| Conditional/lazy loading | Easy (`require` inside `if`) | `await import('./x.js')` |
| Tree shaking by bundlers | Hard | Easy (static) |

**Example: the same module in both systems**

```js
// math.cjs  (CommonJS)
let count = 0;
function inc() { return ++count; }
module.exports = { inc, getCount: () => count, count };
```

```js
// use_cjs.mjs  (ESM importing CJS)
import math from './math.cjs';            // default import = module.exports object
console.log(math.inc(), math.inc());      // 1 2
console.log(math.count, math.getCount()); // 0 2   <-- `count` property is a snapshot, the function reads live value
```

```js
// counter.mjs  (ESM live binding)
export let count = 0;
export function inc() { count++; }
```

```js
// use_esm.mjs
import { count, inc } from './counter.mjs';
console.log(count); // 0
inc();
console.log(count); // 1  -- live binding updated
// count = 5;       // TypeError: Assignment to constant variable (imports are read-only)
```

**Interop rules (version-dependent)**

- **ESM importing CJS:** always allowed. The default import is `module.exports`. Named imports from CJS work only
  when Node's static analysis (cjs-module-lexer) can detect the export names; otherwise use the default import and
  destructure.
- **CJS requiring ESM:**
  - Historically **not allowed**: `require()` of an ES module throws `ERR_REQUIRE_ESM`. You had to use dynamic
    `import()` (which returns a Promise, so it only works inside an async function or with `.then`).
  - **Version-dependent:** `require(esm)` support was added behind a flag in Node 22.0 and became enabled by default
    in **22.12** (it may print an ExperimentalWarning on some versions) and was backported to **20.19**. It works only
    for ES modules that do **not** use top-level await. In older runtimes (Node 20 before 20.19, Node 18) you still
    get `ERR_REQUIRE_ESM`. Check your exact version before relying on it.
- Dynamic import works from both systems:

```js
// from CommonJS
async function loadChalkLikeEsmOnlyPackage() {
  const { default: pkg } = await import('some-esm-only-package');
  return pkg;
}
```

**Circular dependencies**

- CJS: `a` requires `b`, `b` requires `a` -> `b` receives a **partially filled** `module.exports` of `a`
  (whatever was exported before the `require` call). Functions defined later are `undefined` when `b` runs.
- ESM: bindings are live, so functions are usable once evaluated, but touching a `let`/`const` binding before its
  module has evaluated throws a `ReferenceError` (temporal dead zone). Best fix for both: restructure (extract
  the shared piece into a third module) rather than relying on load order.

**Singleton and caching gotcha**

```js
// db.mjs
console.log('db module evaluated');       // prints once, however many files import it
export const pool = { created: Date.now() };
```

Every file importing `./db.mjs` gets the same `pool` (module cache). This is the standard way to share a DB pool
instance. Beware of case differences or different resolved paths (symlinks, `file.js` vs `File.js` on case-insensitive
Windows) producing two instances in rare setups.

**Packaging notes** `[ADVANCED]`

- `package.json` `"exports"` controls what consumers can import, and supports conditions
  (`"import"` vs `"require"`) to ship both formats ("dual package"). Dual packages risk loading both copies
  (the "dual package hazard"), so keep singletons out of them.
- With TypeScript, `"module": "NodeNext"` mirrors these rules.

**Why it matters**

Real projects hit module issues all the time: "ERR_REQUIRE_ESM", "__dirname is not defined", "Cannot use import
statement outside a module", "Must use import to load ES Module". Knowing the model lets you fix them in a minute
and justifies "we use ESM for new code".

**Frontend connection**

ESM is exactly what you write in React/Vite (`import`/`export`). Bundlers hid the differences. In Node you must
specify extensions, there is no `__dirname`, and `"type": "module"` decides the system. `require()` is the
legacy part: you will meet it in older Express tutorials, Jest configs, and many npm packages.

**Real-world scenario**

A team upgrades `node-fetch` or `chalk` to a version that is ESM-only and the old CommonJS API gateway
service crashes with `ERR_REQUIRE_ESM`. Options: migrate the service to ESM (best), use dynamic `import()`, pin
the old version, or on Node 22.12+/20.19+ use `require(esm)` if the package has no top-level await.

**Interview answer:**

"CommonJS is Node's original module system: `require` loads modules synchronously at runtime, files are wrapped
in a function that provides `module`, `exports`, `__dirname` and so on, and results are cached so each module is a
singleton. ES modules are the language standard: `import` and `export` are static, loading is asynchronous, they
support top-level await, imports are live read-only bindings, and files are strict by default. Node decides
between them using the `.mjs` and `.cjs` extensions or the `type` field in package.json. ESM can import CommonJS
freely, but requiring ESM from CommonJS historically needed dynamic `import()`; newer Node lines, 22.12 and 20.19,
can `require` ES modules without top-level await. For new code I use ESM."

**Follow-up questions**

1. *Why is `__dirname` undefined in ESM?* It is a CJS wrapper parameter, not a language feature. Use
   `import.meta.dirname` (Node 20.11+/21.2+) or `fileURLToPath(new URL('.', import.meta.url))`.
2. *`exports` vs `module.exports`?* `exports` is just a reference to the initial `module.exports` object.
   Reassigning `exports = ...` breaks the link; `module.exports = ...` is what is returned.
3. *Why must ESM imports have file extensions?* ESM resolution follows URL rules and does not probe the file
   system for `.js`/`index.js` like CJS does.
4. *What is a live binding?* An imported name refers to the exporter's variable, so later updates are visible;
   importers cannot assign to it.
5. *Can you use `require` in ESM?* Not directly; create one via
   `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);`.
6. *How do you load JSON in ESM?* `import data from './x.json' with { type: 'json' }`, or
   `JSON.parse(await readFile(...))`, which works in every version.
7. *What does top-level await do to module loading?* The module (and anything importing it) waits for the awaited
   promise before evaluating further; keep it for startup tasks and avoid long waits.

**Common mistakes**

- Mixing `require` and `import` in the same file.
- Forgetting `"type": "module"` or the file extension, then seeing "Cannot use import statement outside a
  module".
- `exports = {...}` (does nothing) instead of `module.exports = {...}`.
- Expecting `import` to be conditional; use dynamic `import()` for that.
- Relying on `require.cache` deletion tricks for hot reload in production.

**Revision notes**

- CJS: sync, wrapper function, cached singleton, `this === module.exports`. ESM: static, async, live bindings,
  strict, top-level await, no `__dirname`.
- `type` field / `.mjs` / `.cjs` choose the system. ESM -> CJS import always works; CJS -> ESM depends on version
  (`require(esm)` from 22.12 and 20.19, no top-level await).
- Use `import.meta.dirname/filename` (20.11+).

---

### 3.4 The `process` object [ESSENTIAL]

**Concept**

`process` ek global object hai jo **current running Node process** ke baare me information deta hai aur usse control
karne deta hai. Import ki zaroorat nahi (optional: `import process from 'node:process'`). Backend me ye roz use hota
hai: environment variables, command-line args, exit codes, signals (graceful shutdown), memory stats.

| Member | Meaning | Example |
|--------|---------|---------|
| `process.argv` | `[nodePath, scriptPath, ...userArgs]` | `node app.js --port 3000` -> `['...node', '...app.js', '--port', '3000']` |
| `process.env` | Environment variables (strings only) | `process.env.PORT` |
| `process.cwd()` | Current working directory (not the script folder) | |
| `process.pid`, `process.ppid` | Process IDs | |
| `process.platform`, `process.arch` | `'win32'`, `'linux'`, `'darwin'`, `'x64'`, ... | |
| `process.version(s)` | Node and dependency versions | |
| `process.uptime()` | Seconds since start | |
| `process.hrtime.bigint()` | High-resolution monotonic timer (ns) | benchmarking |
| `process.memoryUsage()` | `rss`, `heapTotal`, `heapUsed`, `external`, `arrayBuffers` | Day 6 |
| `process.exit(code)` | End immediately | Use sparingly |
| `process.exitCode = n` | Set exit code, let process end naturally | Preferred |
| `process.nextTick(fn)` | Day 2 queue | |
| `process.stdin/stdout/stderr` | Streams | Day 4 |
| `process.on(event, fn)` | `exit`, `beforeExit`, `uncaughtException`, `unhandledRejection`, signals | |
| `process.emitWarning()` | Raise a Node warning | |

**Internal working: exit codes and events**

- Exit code `0` = success, non-zero = failure. Orchestrators (Docker, Kubernetes, CI, systemd) read it.
- `process.exit(1)` terminates quickly and may **cut off pending async work** and unflushed output (for example
  stdout writes to a pipe on some platforms, buffered log lines, open DB transactions). Prefer: set
  `process.exitCode = 1`, stop accepting work, close resources, and let the loop drain.
- Event order at the end: `beforeExit` (only when the loop empties naturally; not on `process.exit()` or
  uncaught exceptions) -> `exit` (synchronous handlers only, no async work possible).
- **`uncaughtException`**: a thrown error nobody caught. After it, the process is in an undefined state
  (resources may be half-closed). The safe pattern: log, try a quick graceful cleanup, exit with code 1, and let a
  supervisor restart the process. Do not "swallow and continue".
- **`unhandledRejection`**: a rejected promise with no handler. Since **Node 15** the default behaviour is to throw
  (crash with an `uncaughtException`-like failure); in Node 14 and earlier it only warned. Always handle
  rejections; log and exit in the global handler as a safety net.
- **Signals**: `SIGTERM` (polite stop, used by Docker/Kubernetes/PM2), `SIGINT` (Ctrl+C). `SIGKILL` cannot be
  handled. Windows has limited signal support (SIGINT, SIGBREAK work for console processes; SIGTERM is emulated).

```js
// process_demo.js  run: node process_demo.js --port 8080 --verbose
import process from 'node:process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { port: { type: 'string', default: '3000' }, verbose: { type: 'boolean', default: false } },
});
console.log('args:', values);                         // { port: '8080', verbose: true }
console.log('platform:', process.platform, 'pid:', process.pid);

const t0 = process.hrtime.bigint();
for (let i = 0; i < 1e6; i++) Math.sqrt(i);
console.log('elapsed ms:', Number(process.hrtime.bigint() - t0) / 1e6);

const m = process.memoryUsage();
console.log('rss MB:', (m.rss / 1048576).toFixed(1), 'heapUsed MB:', (m.heapUsed / 1048576).toFixed(1));

process.on('exit', (code) => console.log('exit code', code));

process.on('uncaughtException', (err, origin) => {
  console.error('FATAL uncaughtException:', err.message, 'origin:', origin);
  process.exitCode = 1;
  setTimeout(() => process.exit(1), 100).unref();      // brief window to flush logs, then leave
});

process.on('unhandledRejection', (reason) => {
  console.error('FATAL unhandledRejection:', reason);
  throw reason;                                         // funnel into uncaughtException handling
});

Promise.reject(new Error('nobody handled me'));
```

Graceful shutdown skeleton (full version in Week 6):

```js
import http from 'node:http';
const server = http.createServer((req, res) => res.end('ok')).listen(3000);

function shutdown(signal) {
  console.log(`${signal} received, closing server`);
  server.close(() => {            // stop accepting new connections, wait for in-flight ones
    console.log('closed cleanly');
    process.exit(0);
  });
  server.closeIdleConnections();  // Node 18.2+: drop idle keep-alive sockets
  setTimeout(() => process.exit(1), 10_000).unref();   // hard deadline
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**Why it matters**

Production Node apps live and die by correct exit behaviour: containers get `SIGTERM` at every deploy;
unhandled rejections crash services; wrong exit codes make CI/CD think a failing job succeeded.

**Frontend connection**

`process.env` replaces Vite's `import.meta.env`; `process.argv` is what CLI tools like `vite build --mode x`
read. There is no browser analogue of signals or exit codes; closest is the `beforeunload`/page-unload lifecycle.

**Real-world scenario**

A payments service gets `SIGTERM` during a rolling deploy. Without a handler Node dies immediately, dropping
in-flight payment requests mid-way (customer charged, order not recorded). With a handler it stops accepting
new connections, lets in-flight requests finish, closes the DB pool, then exits with `0`.

**Interview answer:**

"`process` is a global that represents the running Node process. I use it for command-line arguments through
`argv`, environment variables through `env`, exit codes, signals such as SIGTERM for graceful shutdown, and
runtime stats like `memoryUsage`. I prefer setting `process.exitCode` over calling `process.exit()` so pending
work can finish. For global error events, `uncaughtException` and `unhandledRejection`, I log and exit non-zero
and rely on a supervisor to restart, because after an uncaught exception the process state is unreliable."

**Follow-up questions**

1. *What is the difference between `process.exit()` and `process.exitCode`?* `exit()` ends immediately, possibly
   dropping pending async work; `exitCode` sets the code and lets the process end naturally.
2. *Are environment variables strings?* Always. `process.env.PORT` is `'3000'`; numbers, booleans must be parsed.
   Assigning `undefined` stores the string `'undefined'`, a classic bug.
3. *What happens on an unhandled rejection?* Since Node 15 the process terminates with an error by default
   (`--unhandled-rejections=throw`); earlier versions only warned.
4. *Should you continue after `uncaughtException`?* No. Log, clean up fast, exit, restart via supervisor.
5. *What is `process.cwd()` vs `__dirname`?* `cwd` depends on where you launched Node; `__dirname` (or
   `import.meta.dirname`) is the script's folder. Use the latter to locate files shipped with your code.
6. *Difference between SIGINT, SIGTERM, SIGKILL?* Ctrl+C interrupt; polite termination request; forced kill
   that cannot be caught.

**Common mistakes**

- Calling `process.exit()` right after a `console.log`/log call or an async write, then losing output.
- Swallowing `uncaughtException` and continuing.
- Assuming `process.env.DEBUG` is a boolean.
- Using `process.cwd()` to find files relative to the code.
- Not handling `SIGTERM`, so containers need `SIGKILL` after the grace period.

**Revision notes**

- `argv`, `env` (strings), `cwd`, `pid`, `memoryUsage`, `hrtime`, `exitCode`, signals, events.
- Prefer `exitCode`; handle `SIGTERM`; crash-and-restart on `uncaughtException`; unhandled rejection throws
  since Node 15.

---

### 3.5 Buffer [ESSENTIAL]

**Concept**

JavaScript strings text ke liye hain; lekin network aur files **bytes** hain (images, PDFs, TCP packets). **Buffer**
Node ka class hai jo **fixed-size raw bytes** ka array hota hai. Technically `Buffer` ek `Uint8Array` ka subclass
hai, aur uska memory **V8 heap ke bahar** (off-heap, native memory) allocate hota hai.

**Internal working**

- `Buffer.alloc(n)` gives zero-filled memory (safe). `Buffer.allocUnsafe(n)` skips zero-filling; it may contain
  old memory content (**can leak data from previous allocations**) and is faster; small unsafe allocations
  come from a shared 8 KiB pool. Use `allocUnsafe` only when you immediately overwrite everything.
- `Buffer.from(string, encoding)` encodes text into bytes (default UTF-8). `buf.toString(encoding)` decodes.
- `buf.length` is the **byte length**. For text with non-ASCII characters it differs from `string.length`
  (UTF-16 code units).
- `buf.subarray()` (and the older `slice()`) returns a **view** over the same memory, not a copy. Mutating
  the view mutates the original. Use `Buffer.from(buf)` to copy.
- Supported encodings: `utf8`, `utf16le`, `latin1`, `ascii`, `base64`, `base64url`, `hex`.
- Memory sits outside the V8 heap, which is why `heapUsed` can look flat while `rss`/`external` grows (Day 6).

```js
// buffer_demo.js  (ASCII-only source; non-ASCII written as escapes)
const text = 'Price: \u20B9500 \u{1F600}';               // rupee sign and an emoji
const b = Buffer.from(text, 'utf8');
console.log('string length:', text.length, 'byte length:', b.length);  // bytes > characters

console.log('hex   :', b.toString('hex'));
console.log('base64:', b.toString('base64'));
console.log('round trip equal:', b.toString('utf8') === text);

// Binary protocols: write and read numbers
const header = Buffer.alloc(8);
header.writeUInt32BE(0xdeadbeef, 0);   // 4 bytes, big-endian, at offset 0
header.writeUInt16BE(1234, 4);
console.log(header, header.readUInt32BE(0), header.readUInt16BE(4));

// Concatenate chunks (what you do with request body chunks)
const body = Buffer.concat([Buffer.from('{"a":'), Buffer.from('1}')]);
console.log(JSON.parse(body.toString('utf8')));

// base64url is the JWT-friendly encoding (no +, /, or padding)
console.log(Buffer.from('hello world').toString('base64url'));

// subarray shares memory
const whole = Buffer.from('Hello');
const view = whole.subarray(0, 2);
view[0] = 0x4a;                                           // 'J'
console.log(whole.toString());                            // Jello  (original changed)

// Comparing: Buffer.compare / buf.equals; for secrets use crypto.timingSafeEqual
import { timingSafeEqual } from 'node:crypto';
const a = Buffer.from('secret-token');
const c = Buffer.from('secret-token');
console.log(a.equals(c), timingSafeEqual(a, c));          // true true (lengths must match for timingSafeEqual)
```

**The multi-byte split problem (a classic stream bug)**

A UTF-8 character can be 1-4 bytes. If a stream chunk boundary falls in the middle of a character, decoding each
chunk separately corrupts it:

```js
import { StringDecoder } from 'node:string_decoder';

const bytes = Buffer.from('\u20B9');                  // 3 bytes: e2 82 b9
const part1 = bytes.subarray(0, 2);
const part2 = bytes.subarray(2);

console.log(part1.toString() + part2.toString());      // garbage: replacement characters
const dec = new StringDecoder('utf8');
console.log(dec.write(part1) + dec.write(part2));      // correct: the rupee sign
```

Safer: collect all chunks with `Buffer.concat` and decode once, or call `readable.setEncoding('utf8')` (which uses
`StringDecoder` internally). Never do `body += chunk` with raw Buffer chunks of non-ASCII data.

**Why it matters**

Buffers show up everywhere: HTTP request bodies, file reads without an encoding, TCP data, crypto outputs,
image/PDF handling, JWT/base64 handling, and streams. Interview questions test bytes-vs-characters understanding
and memory implications (large buffers are off-heap and not reported by `heapUsed`).

**Frontend connection**

Browser equivalents: `Uint8Array`, `ArrayBuffer`, `Blob`, `TextEncoder/TextDecoder`, `btoa/atob`. `Buffer` is a
`Uint8Array` with convenience methods (encodings, `readUInt32BE`, etc.). `TextEncoder`/`TextDecoder` also exist in
Node and are the portable choice for shared code.

**Real-world scenario**

An upload endpoint receives a 200 MB video as chunks. Collecting everything in one Buffer (`Buffer.concat`) for 30
simultaneous uploads uses 6 GB of native memory and the process is OOM-killed, while `heapUsed` stayed small, which
confuses people reading only heap graphs. The fix: stream to disk or object storage (Day 4/5) and enforce size
limits.

**Interview answer:**

"A Buffer is Node's fixed-size container for raw binary data. It is a subclass of `Uint8Array` and its memory
is allocated outside the V8 heap. I use `Buffer.alloc` for zero-filled safe allocation, and `allocUnsafe` only
when I immediately overwrite the content, since it can expose old memory. Buffer length is in bytes, which differs
from string length for non-ASCII text, and slicing with `subarray` shares memory instead of copying. When reading
text from streams I either decode after concatenating all chunks or use a StringDecoder so multi-byte characters
split across chunks are not corrupted."

**Follow-up questions**

1. *`Buffer.alloc` vs `Buffer.allocUnsafe`?* Zero-filled and safe vs uninitialised, faster, potentially leaking old
   data. Also avoid the deprecated `new Buffer(n)`.
2. *Is `Buffer` on the V8 heap?* No, it is native memory (reported under `external`/`arrayBuffers` in
   `process.memoryUsage()`).
3. *What is the relation between Buffer and Uint8Array?* Buffer extends Uint8Array, so typed array methods work.
4. *Why compare tokens with `timingSafeEqual`?* Regular comparison returns early at the first differing byte and
   can leak information through timing differences.
5. *How do you convert a Buffer to a string safely?* `buf.toString('utf8')` after the whole body is collected, or
   `setEncoding` / `StringDecoder` while streaming.
6. *What does base64 do to size?* About 33% larger than the raw bytes.

**Common mistakes**

- Using `string.length` as byte size (for `Content-Length` use `Buffer.byteLength(str)`).
- `body += chunk` in stream handlers with non-ASCII content.
- Loading entire files/uploads into one Buffer.
- Using `allocUnsafe` and returning the result without filling it.
- Assuming `slice`/`subarray` copies.

**Revision notes**

- Buffer = `Uint8Array` subclass, off-heap bytes. `alloc` safe, `allocUnsafe` fast and dirty.
- Length is bytes. `subarray` shares memory. Use `StringDecoder`/`setEncoding` for streamed text.
- `Buffer.byteLength` for sizes; `timingSafeEqual` for secrets.

---

### 3.6 Environment variables and configuration [ESSENTIAL]

**Concept**

Environment variables (env vars) key-value pairs hote hain jo OS process ko deta hai: `PORT=3000`, `DB_HOST=...`.
Rule of "12-factor app": **config environment me, code me nahi**. Isse same code dev, staging, prod me alag
settings ke saath chalta hai, aur secrets Git me commit nahi hote.

**Internal working and facts**

- `process.env` values are **always strings** (or `undefined` if missing). `process.env.X = undefined` stores the
  string `"undefined"`. Parse numbers/booleans yourself.
- On Windows env var names are case-insensitive; on Linux they are case-sensitive. Keep names UPPER_SNAKE_CASE.
- Setting variables when launching:
  - bash: `PORT=4000 node app.js`
  - PowerShell: `$env:PORT = 4000; node app.js`
  - Docker: `-e PORT=4000` or `env_file`.
- Node can load `.env` files natively (no `dotenv` package needed):
  - `node --env-file=.env app.js` (Node 20.6+)
  - `process.loadEnvFile('.env')` (Node 21.7+ and 20.12+)
  - `import { parseEnv } from 'node:util'` to parse text without mutating `process.env` (available in newer 20.x/22 lines).
  Existing real environment variables take precedence over the file when using `--env-file`.
- `NODE_ENV` is a convention (`development`, `production`, `test`), read by libraries (Express alters behaviour
  and caching under `production`). Node itself does not interpret it.
- Never commit `.env` to Git (add to `.gitignore`); commit a `.env.example` with placeholder values.
- Environment variables are not a vault: they leak through crash dumps, `/proc/<pid>/environ`, child processes
  (inherited), and logging of `process.env`. For high-sensitivity secrets use a secrets manager (Week 5/Day 6).

**A validated config module (no libraries)**

```js
// config.js
function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  return n;
}

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: intEnv('PORT', 3000),
  db: Object.freeze({
    host: requireEnv('DB_HOST'),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    name: requireEnv('DB_NAME'),
    poolSize: intEnv('DB_POOL_SIZE', 10),
  }),
});

// Fail fast at startup: a missing variable should crash the deploy, not a customer request at 2 a.m.
```

```js
// app.js
import { config } from './config.js';
console.log(`starting on port ${config.port} in ${config.nodeEnv}`);   // never log config.db.password
```

Run: `node --env-file=.env app.js` with a `.env` file containing `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
Try omitting one variable and observe the immediate, descriptive failure.

**Why it matters**

Misconfigured environments cause a large fraction of production incidents; leaked secrets cause worse ones.
Interviewers ask "how do you manage config and secrets?" to test maturity.

**Frontend connection**

Vite/Next/CRA also use env files (`VITE_*`), but those values are **baked into the browser bundle** and are public.
On the server, env values stay private. Never expect backend secrets in frontend env variables.

**Real-world scenario**

A staging deployment accidentally uses the production payment gateway key because `.env` was copied between
environments. A validated config with an environment-specific allowlist (for example refusing a live payment key
unless `NODE_ENV=production`) catches that at startup.

**Interview answer:**

"I keep configuration in environment variables following the twelve-factor approach. In Node they are exposed
through `process.env` as strings, so I parse and validate them once at startup in a config module and fail fast if
anything required is missing. For local development I use Node's built-in `--env-file` support or a `.env` file
that is git-ignored, and commit only `.env.example`. Real secrets in production come from the platform's secret
store or a secrets manager rather than from files in the repo."

**Follow-up questions**

1. *Why are env vars always strings?* They come from the OS as text. Parse as needed (`Number`, `=== 'true'`).
2. *Is `.env` safe for production secrets?* It is acceptable only if the file is protected and not in Git/images;
   better is a secret manager or orchestrator secrets injected at runtime.
3. *Difference between `dotenv` and `--env-file`?* Both load `.env`. `--env-file` is built in (Node 20.6+), so you
   can skip the dependency; `dotenv` offers extra features and works on older Node.
4. *What does `NODE_ENV=production` do?* Nothing inside Node itself. Libraries use it to enable optimisations and
   hide stack traces (Express caches views, `npm install` skips dev dependencies).
5. *Where should you read env vars: everywhere or in one place?* One config module, validated once, imported
   elsewhere; scattering `process.env` reads causes inconsistent defaults and untested paths.

**Common mistakes**

- Committing `.env` or logging the whole `process.env`.
- Treating `'false'` as false (non-empty string is truthy in JS).
- Defaulting secrets silently (`process.env.JWT_SECRET || 'secret'`), which turns a missing variable into a
  vulnerable production system.
- Putting secrets into frontend env variables.
- Reading and parsing `process.env` inside hot request paths repeatedly.

**Revision notes**

- Config in env (12-factor), strings only, validate once at startup, fail fast.
- `--env-file` (20.6+), `process.loadEnvFile` (20.12/21.7+). `.env` ignored by Git, `.env.example` committed.
- `NODE_ENV` is a library convention. Secrets belong in a secret manager for serious setups.

---

### Day 3 wrap-up

**Key concepts to remember**

- Workers = threads with own isolate/heap/loop; for CPU-bound JS only; use a pool; message passing (copy or transfer).
- cluster/containers scale a server across cores; in-memory state is per process.
- `child_process`: prefer `execFile`/`spawn` with argument arrays; never interpolate user input into `exec`.
- CJS: sync `require`, wrapper, cached; ESM: static, async, live bindings, no `__dirname`; interop depends on version
  (`require(esm)` in 22.12+/20.19+).
- `process`: argv, env (strings), exitCode vs exit, signals, uncaughtException/unhandledRejection (throws since Node 15).
- Buffer: off-heap bytes, `Uint8Array` subclass, bytes vs characters, `alloc` vs `allocUnsafe`, `subarray` shares.
- Config: env vars, validated at startup, `.env` not committed, `--env-file` built in.

**Five revision questions**

1. When would you pick worker_threads, child_process, or cluster? Give one example for each.
2. Explain the CommonJS module wrapper and why `__dirname` is not available in ESM.
3. What happens in Node 22 when CommonJS code `require()`s an ES module, and in Node 18?
4. Why should you avoid `process.exit()` in the middle of async work, and what do you do instead?
5. Why can `heapUsed` stay flat while a process runs out of memory because of Buffers?

**One practical coding task**

Build `resize_sim.js` with a `WorkerPool` (adapt the example) that exposes `run(task)`. The worker computes a
fake "image resize" by hashing a 5 MB Buffer 50 times with `createHash('sha256')`. Compare: 20 tasks
sequentially on the main thread vs 20 tasks through a 4-worker pool, and while each runs, track event-loop delay with
`monitorEventLoopDelay`. Report total time and max loop delay for both. Then write 3 sentences explaining the
result.

**Self-assessment checklist**

- [ ] I can explain why workers are not useful for database calls.
- [ ] I ran the worker example and saw the main-thread timer keep ticking.
- [ ] I can list five differences between CJS and ESM from memory.
- [ ] I know exactly how to fix `ERR_REQUIRE_ESM` for three different Node versions.
- [ ] I can write a graceful shutdown handler for SIGTERM.
- [ ] I can explain bytes vs characters and why `body += chunk` is risky.
- [ ] I wrote a config module that fails fast on missing environment variables.

---

## Day 4 - File system and streams

**Time plan (about 2 hours)**

| Minutes | Activity |
|---------|----------|
| 35 | 4.1: the `fs` module and `path` (three API styles, safe patterns) |
| 40 | 4.2: stream concepts, types, modes, events, async iteration |
| 25 | 4.3: custom Readable/Transform, streaming HTTP responses |
| 10 | 4.4: Web Streams awareness |
| 10 | Day wrap-up |

**Learning objectives**

By the end of today you can:

1. Use the three `fs` API styles correctly and pick the right one (promises in application code).
2. Write files safely (atomic write, exclusive create) and avoid path traversal.
3. Explain why streams exist (constant memory, early first byte) and demonstrate it with a measurement.
4. Name the four stream types and the two reading modes, and the events each emits.
5. Consume streams with `for await`, write a custom `Transform`, and generate/process large files line by line.
6. Stream a file in an HTTP response without loading it into memory.

---

### 4.1 File system (`node:fs`) and `path` [ESSENTIAL]

**Concept**

`fs` module file system operations deta hai. Har operation ke **teen flavours** hote hain:

| Style | Example | Blocking? | When to use |
|-------|---------|-----------|-------------|
| Callback | `fs.readFile(path, cb)` | No (thread pool) | Legacy code |
| Promise | `import { readFile } from 'node:fs/promises'` | No (thread pool) | **Default for application code** |
| Sync | `fs.readFileSync(path)` | **Yes**, blocks the loop | Startup code, CLI scripts only |

Always import with the `node:` prefix (`node:fs`, `node:fs/promises`, `node:path`): it makes it explicit that the
module is built in and prevents confusion with an npm package of the same name.

**Internal working**

As covered on Day 2: async `fs` calls (including promises and streams over files) run on the libuv **thread pool**.
`fs.promises` operations that return a `FileHandle` keep a file descriptor open; forgetting to `close()` leaks
descriptors (error `EMFILE: too many open files`). The OS limit is per process (check `ulimit -n` on Linux;
Windows has a different limit model).

**Core operations (runnable)**

```js
// fs_basics.js   run: node fs_basics.js
import { mkdir, writeFile, readFile, appendFile, readdir, stat, rename, copyFile, rm, access, open } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

const dir = path.join(tmpdir(), 'fs-demo');            // path.join builds OS-correct paths
await rm(dir, { recursive: true, force: true });       // cleanup from a previous run
await mkdir(dir, { recursive: true });                 // recursive: no error if it exists

const file = path.join(dir, 'notes.txt');
await writeFile(file, 'line 1\n', 'utf8');             // creates or truncates
await appendFile(file, 'line 2\n');
console.log(JSON.stringify(await readFile(file, 'utf8')));   // "line 1\nline 2\n"

const info = await stat(file);
console.log({ size: info.size, isFile: info.isFile(), isDir: info.isDirectory(), modified: info.mtime.toISOString() });

await copyFile(file, path.join(dir, 'copy.txt'));
await rename(path.join(dir, 'copy.txt'), path.join(dir, 'renamed.txt'));

for (const entry of await readdir(dir, { withFileTypes: true })) {
  console.log(entry.isDirectory() ? 'dir ' : 'file', entry.name);
}

// Exclusive create: fails with EEXIST if file exists (prevents overwriting, avoids races)
try {
  await writeFile(file, 'overwrite?', { flag: 'wx' });
} catch (err) {
  console.log('expected error code:', err.code);       // EEXIST
}

// Existence check: do not "check then act" (race). Try the operation and handle the error.
try { await access(path.join(dir, 'missing.txt'), constants.R_OK); } catch (err) { console.log('access error:', err.code); } // ENOENT

// FileHandle: always close in finally
const fh = await open(file, 'r');
try {
  const { bytesRead, buffer } = await fh.read(Buffer.alloc(6), 0, 6, 0);
  console.log('first bytes:', buffer.toString('utf8', 0, bytesRead));  // "line 1"
} finally {
  await fh.close();
}

await rm(dir, { recursive: true, force: true });
```

Notes on the API (accurate details worth knowing):

- `readFile` without an encoding returns a **Buffer**; with `'utf8'` returns a string.
- `readFile` reads the **entire file into memory**. Practical limits: process memory, and `buffer.constants.MAX_LENGTH`
  (about 2 GiB on 64-bit in modern Node; changed across versions). For large files use streams.
- `fs.exists()` is deprecated; `fs.existsSync()` is fine but check-then-act is racy. Prefer "try and handle
  `ENOENT`".
- `readdir(dir, { recursive: true })` exists in Node 18.17+/20+; `fs.cp(src, dest, { recursive: true })` (stable
  in 22; experimental in earlier lines) copies directory trees. Verify against your version.
- `fs.watch` is OS-notification based and behaves differently across platforms (duplicate events, missing
  filenames); do not build critical logic on it. Libraries such as chokidar smooth this over.
- Error handling: errors have `code` (`ENOENT`, `EACCES`, `EEXIST`, `EMFILE`, `EISDIR`, `ENOSPC`), `syscall` and
  `path`. Switch on `err.code`, not on message text.

**Atomic write pattern (avoid half-written files)**

If the process crashes during `writeFile`, readers may see a truncated file. Write to a temp file in the same
directory, then `rename` (atomic on the same filesystem on POSIX; effectively atomic replacement on modern Windows
NTFS in practice but check your platform guarantees):

```js
import { writeFile, rename } from 'node:fs/promises';

export async function writeFileAtomic(target, data) {
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, target);       // readers see either the old file or the new file, never half
}
```

**`path` module essentials**

```js
import path from 'node:path';

console.log(path.join('/srv/app', 'uploads', '..', 'public', 'a.txt'));   // normalised, OS separators
console.log(path.resolve('uploads', 'a.txt'));      // absolute path, based on process.cwd()
console.log(path.basename('/a/b/report.final.pdf'), path.extname('/a/b/report.final.pdf'), path.dirname('/a/b/c.txt'));
console.log(path.parse('/a/b/c.txt'));              // { root, dir, base, ext, name }
console.log(path.relative('/a/b', '/a/b/c/d.txt'));
```

**Security: path traversal** (this is an interview favourite)

User input like `../../etc/passwd` or `..\\..\\Windows\\win.ini` can escape your uploads directory.

```js
// safe_path.js
import path from 'node:path';

const BASE = path.resolve('/srv/app/uploads');

export function resolveInside(userSuppliedName) {
  const target = path.resolve(BASE, userSuppliedName);
  const relative = path.relative(BASE, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path traversal attempt blocked');
  }
  return target;
}

console.log(resolveInside('invoice-42.pdf'));                      // ok
try { resolveInside('../../etc/passwd'); } catch (e) { console.log(e.message); }
```

Even better: never use user-supplied names on disk. Generate your own file name (`crypto.randomUUID()`), store the
original name in the database, and validate file type/size (Week 3, uploads). Also resolve symlinks (`realpath`)
when symlinks inside the directory are possible.

**Why it matters**

File handling underpins uploads, exports, logs, config loading, and temp files. Incorrect `fs` usage causes blocking,
descriptor leaks, corrupted files, and security holes.

**Frontend connection**

Browser JS has `File`, `Blob`, `FileReader`, and no free disk access. In Node you read/write real paths, so the
failure modes are different: permissions, missing paths, partial writes, disk full, and security (path traversal).

**Real-world scenario**

An invoice service saves a PDF per order. First version used `writeFileSync` inside the request handler (blocking),
named files by customer input (path traversal risk), and overwrote on retries (duplicate/corrupt files). Fixed
version: async `fs.promises`, generated UUID names inside a fixed base directory, `wx` flag or atomic rename, and
`finally { await fh.close() }`.

**Interview answer:**

"`fs` offers callback, promise and synchronous APIs. In application code I use `fs/promises`, because the async
versions run on libuv's thread pool and do not block the event loop, while sync versions are only for startup or
scripts. `readFile` loads the whole file into memory, so for large files I use streams. I avoid check-then-act with
`exists` and instead handle the error codes, write files atomically through a temp file and rename, close file
handles in `finally`, and protect against path traversal by resolving user-provided paths against a fixed base
directory and verifying the result stays inside it."

**Follow-up questions**

1. *Why is `readFileSync` bad in a request handler?* It blocks the event loop for the duration of the disk read,
   freezing all other requests.
2. *Is `fs.promises.readFile` truly non-blocking if it uses the thread pool?* It does not block the main thread;
   it occupies a pool thread, and heavy fs use can saturate the 4-thread pool (Day 2).
3. *How would you read a 5 GB log file?* Stream it (`createReadStream` with `readline`), never `readFile`.
4. *What causes `EMFILE`?* Too many open file descriptors; often unclosed handles or unbounded concurrent opens.
   Limit concurrency and close handles.
5. *How do you check that a file exists?* Usually do not; attempt the operation and handle `ENOENT`. If you must,
   use `access` or `stat` and accept the race.
6. *What is a safe way to accept uploaded filenames?* Do not trust them. Generate a server-side name; keep the
   original name as metadata; validate extension and MIME type by content.

**Common mistakes**

- Using sync APIs in handlers.
- `path` building with string concatenation (`dir + '/' + name`) instead of `path.join`.
- Trusting `req.params.file` in a path.
- `Promise.all(files.map(readFile))` over 100k files (descriptor exhaustion, pool flood). Limit concurrency.
- Forgetting to close `FileHandle`s.

**Revision notes**

- Prefer `node:fs/promises`; sync only at startup. `readFile` = whole file in memory.
- Use error codes; use `wx`/atomic rename; close handles; use `path.join/resolve`; block path traversal.

---

### 4.2 Streams: concept, types, modes [ESSENTIAL]

**Concept**

Stream ka matlab: data ko **chhote chunks me, ek ek karke** process karna, pura data memory me load kiye bina.
Socho pani ki pipe: tank poora bharne ka wait nahi karte, pani flow hota rehta hai. Ek 2 GB file ko `readFile` se
padhoge to 2 GB RAM chahiye; stream se sirf ek chunk (default 64 KiB for files) memory me hota hai.

Two big benefits:

1. **Constant memory.** Memory use depends on the chunk size, not the total size.
2. **Lower latency (time to first byte).** You can start sending/processing the first chunk while the rest is
   still being read.

**Internal working**

Streams are `EventEmitter`s built on an internal **buffer** with a limit called **`highWaterMark`**:

```
 source (file, socket, DB cursor)
        |
        v
 +--------------------+   chunk by chunk    +--------------------+
 | Readable           | ------------------> | Writable           |
 | internal buffer    |   (pipe/pipeline)   | internal buffer    |
 | (<= highWaterMark) |                     | (<= highWaterMark) |
 +--------------------+ <-- backpressure -- +--------------------+
                          (slow writer tells reader to pause)
```

The four types:

| Type | Direction | Examples | Key methods/events |
|------|-----------|----------|--------------------|
| **Readable** | produces data | `fs.createReadStream`, HTTP request (server side), HTTP response (client side), `process.stdin` | `read()`, `pipe()`, events `data`, `end`, `error`, `close`, `readable` |
| **Writable** | consumes data | `fs.createWriteStream`, HTTP response (server side), `process.stdout`, HTTP request (client side) | `write()`, `end()`, events `drain`, `finish`, `error`, `close` |
| **Duplex** | both, independent | TCP `net.Socket`, WebSocket-like objects | both sets |
| **Transform** | Duplex where output is derived from input | `zlib.createGzip()`, `crypto.createCipheriv`, custom parsers | `transform(chunk, enc, cb)`, `flush(cb)` |

`PassThrough` is a Transform that passes data unchanged (useful for tapping a stream or measuring).

**Two reading modes (for Readable)**

- **Flowing mode:** data arrives automatically via `'data'` events (switched on by attaching a `data` listener,
  calling `pipe()`, or `resume()`).
- **Paused mode:** you pull data explicitly using `read()` in response to `'readable'` events.
- Modern recommendation: **do not use either directly in application code.** Use `pipeline()` and
  `for await (const chunk of readable)`, which handle both modes, errors and cleanup.

**`highWaterMark` defaults (version-dependent)**

- Byte streams: **16 KiB in Node 20 and earlier, raised to 64 KiB in Node 22**
  (`stream.getDefaultHighWaterMark(false)` reports it).
- `fs.createReadStream`: 64 KiB.
- Object-mode streams: **16 objects** (count, not bytes).

```js
// stream_defaults.js
import { getDefaultHighWaterMark } from 'node:stream';
console.log('byte stream default :', getDefaultHighWaterMark(false));  // 16384 on Node 20, 65536 on Node 22
console.log('object mode default :', getDefaultHighWaterMark(true));   // 16
```

**Measuring the memory benefit**

First generate a CSV (run once). It writes with backpressure handling, which Day 5 explains in detail:

```js
// make_big.js
import { createWriteStream } from 'node:fs';
import { once } from 'node:events';

const out = createWriteStream('big.csv');
out.write('id,name,amount\n');
for (let i = 1; i <= 2_000_000; i++) {
  if (!out.write(`${i},user${i},${(i % 997) + 0.5}\n`)) await once(out, 'drain');   // respect backpressure
}
out.end();
await once(out, 'finish');
console.log('written');
```

(This creates a file of about 50 MB; use 20_000_000 rows if you want to see a larger difference, it needs about 500 MB
disk.) Then compare reading it whole versus streaming:

```js
// mem_compare.js    run: node mem_compare.js readFile     and     node mem_compare.js stream
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

const mb = (n) => (n / 1048576).toFixed(0) + ' MB';
const mode = process.argv[2];
let peak = 0;
const sampler = setInterval(() => { peak = Math.max(peak, process.memoryUsage().rss); }, 5);

if (mode === 'readFile') {
  const buf = await readFile('big.csv');
  console.log('readFile bytes:', buf.length);
} else {
  let bytes = 0;
  for await (const chunk of createReadStream('big.csv')) bytes += chunk.length;
  console.log('stream bytes:', bytes);
}
peak = Math.max(peak, process.memoryUsage().rss);
clearInterval(sampler);
console.log(mode, 'peak rss', mb(peak));
```

Observed with the 50 MB file: `readFile` peak RSS about 90 MB vs `stream` about 62 MB (a Node process starts at about
45 MB). The readFile figure grows with the file size (about baseline + file size), the stream figure stays roughly flat
however large the file is. Try the 20M-row file to see 500 MB vs still about 60 MB.

**Consuming a Readable: the modern way**

```js
import { createReadStream } from 'node:fs';

// 1) async iteration: simplest, handles backpressure and cleanup
let total = 0;
for await (const chunk of createReadStream('big.csv')) {
  total += chunk.length;          // chunk is a Buffer unless an encoding was set
}
console.log('bytes', total);

// 2) line by line, constant memory
import { createInterface } from 'node:readline';
const rl = createInterface({ input: createReadStream('big.csv'), crlfDelay: Infinity });
let lines = 0;
for await (const line of rl) lines++;
console.log('lines', lines);
```

**Events you must know**

| Event | Stream | Meaning |
|-------|--------|---------|
| `data` | Readable | A chunk is available (flowing mode) |
| `end` | Readable | No more data to read (does not mean flushed/closed elsewhere) |
| `error` | all | Something failed; stream is destroyed. **Unhandled `error` crashes the process** (it is an EventEmitter) |
| `close` | all | Underlying resource closed |
| `drain` | Writable | Buffer emptied after `write()` returned `false` (Day 5) |
| `finish` | Writable | `end()` called and all data flushed to the underlying system |

**Object mode**

By default chunks are Buffers or strings. With `objectMode: true` a stream can carry any JS value (rows, parsed
records), and `highWaterMark` counts objects.

```js
import { Readable } from 'node:stream';

const rows = Readable.from([{ id: 1 }, { id: 2 }, { id: 3 }]);      // object mode by default
for await (const row of rows) console.log(row);
```

**Why it matters**

Streams are how Node moves data without exhausting memory: file uploads/downloads, CSV exports, log processing,
proxying, compression, and database cursors. "How do you handle a 2 GB file upload?" is a standard question.

**Frontend connection**

Same concept as `fetch` response bodies (`response.body` is a Web `ReadableStream`), `Blob.stream()`, and Node
streams interoperate with them. If you used `ReadableStream` + `TextDecoderStream` or Server-Sent Events, you
already know the mental model; Node's classic streams predate the Web Streams standard and have more mature
backpressure ergonomics (`pipeline`).

**Real-world scenario**

Finance export: "download all transactions for the year" returns 3 million rows. Loading them into an array and
`JSON.stringify` blocks the loop and uses gigabytes. A streamed design: query with a DB cursor/stream, transform
each row to a CSV line, pipe to `res` through `zlib.createGzip()`. Memory stays flat, the browser starts receiving
bytes immediately.

**Interview answer:**

"A stream processes data incrementally in chunks instead of loading it fully into memory, which keeps memory
constant and lets processing start before the data is fully available. Node has four stream types: Readable,
Writable, Duplex and Transform. Each has an internal buffer limited by `highWaterMark`, and streams are event
emitters, so an unhandled `error` event can crash the process. In modern code I consume them with
`for await...of` and connect them with `stream.pipeline`, which handles backpressure and cleans up on errors.
Typical uses are file uploads and downloads, CSV exports, compression, and proxying HTTP bodies."

**Follow-up questions**

1. *Why use streams instead of `readFile`?* Memory scales with file size for `readFile`, constant with streams; and
   streaming lowers time to first byte.
2. *Flowing vs paused mode?* Flowing pushes data via `data` events; paused requires `read()`. Prefer async
   iteration or `pipeline` instead of managing modes.
3. *What is `highWaterMark`?* The internal buffer threshold: 16 KiB (Node <= 20) or 64 KiB (Node 22) for byte
   streams, 16 objects in object mode. For Writables it is the point at which `write()` returns `false`.
4. *`end` vs `finish` vs `close`?* `end`: Readable has no more data. `finish`: Writable has flushed everything
   after `end()`. `close`: underlying resource closed.
5. *Are HTTP request/response streams?* Yes: `req` is a Readable (incoming body), `res` is a Writable.
6. *What is a Transform stream?* A Duplex whose output is computed from its input, for example gzip or a parser.
7. *What is object mode?* Streams carrying arbitrary JS values instead of Buffers/strings.

**Common mistakes**

- Using `readFile` for big files.
- Attaching `data` handlers without handling `error`.
- `body += chunk` with raw Buffers.
- Using `.pipe()` chains in new code, where an error in one stream leaves the others open (use `pipeline`).
- Forgetting that `end` on a Readable does not mean the Writable finished.

**Revision notes**

- Streams = chunked, constant memory, early first byte. Types: Readable, Writable, Duplex, Transform.
- `highWaterMark` governs buffering (64 KiB byte default in Node 22, 16 KiB before). Objects: 16.
- Use `for await` and `pipeline`; always handle `error`.

---

### 4.3 Custom streams: Readable, Writable, Transform [ESSENTIAL]

**Transform: uppercase** (the "hello world" of streams)

```js
// upper.js
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const upper = new Transform({
  transform(chunk, _encoding, callback) {
    callback(null, chunk.toString().toUpperCase());   // callback(error, outputChunk)
  },
});

await pipeline(
  Readable.from(['hello ', 'stream ', 'world\n']),
  upper,
  process.stdout,
);
// HELLO STREAM WORLD
```

**Transform in object mode: parse CSV lines to objects, with a count and a flush**

```js
// csv_to_objects.js
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const rawCsv = ['id,name,am', 'ount\n1,asha,10\n2,ravi', ',20\n3,meera,30\n'];   // chunks split mid-line on purpose

class LineSplitter extends Transform {
  #rest = '';
  constructor() { super({ readableObjectMode: true }); }   // input bytes/strings, output line strings
  _transform(chunk, _enc, cb) {
    const parts = (this.#rest + chunk.toString()).split('\n');
    this.#rest = parts.pop();                                // last piece may be incomplete: keep it
    for (const line of parts) this.push(line);
    cb();
  }
  _flush(cb) {                                               // stream ended: emit leftover
    if (this.#rest) this.push(this.#rest);
    cb();
  }
}

class ToObjects extends Transform {
  #header = null;
  constructor() { super({ objectMode: true }); }
  _transform(line, _enc, cb) {
    const cells = line.split(',');
    if (!this.#header) { this.#header = cells; return cb(); }   // first line = header, emit nothing
    cb(null, Object.fromEntries(this.#header.map((h, i) => [h, cells[i]])));
  }
}

const out = [];
await pipeline(
  Readable.from(rawCsv),
  new LineSplitter(),
  new ToObjects(),
  new Writable({ objectMode: true, write(obj, _enc, cb) { out.push(obj); cb(); } }),
);
console.log(out);
// [ { id: '1', name: 'asha', amount: '10' }, { id: '2', name: 'ravi', amount: '20' }, { id: '3', name: 'meera', amount: '30' } ]
```

Lesson: chunk boundaries are arbitrary. Never assume a chunk equals a line or a record. Buffer the partial tail
(`#rest`) and use `_flush` for the final piece. (The simple `line.split(',')` does not handle quoted commas; real CSV
needs a proper parser library such as `csv-parse`.)

**Custom Readable: a generator-based source (modern and easiest)**

```js
// numbers.js
import { Readable } from 'node:stream';

async function* countTo(n) {
  for (let i = 1; i <= n; i++) {
    await new Promise((r) => setTimeout(r, 50));   // simulate a slow source (DB page, API)
    yield `${i}\n`;
  }
}

for await (const chunk of Readable.from(countTo(5))) process.stdout.write(chunk);
```

**Async generators as pipeline stages**

`pipeline` accepts async generator functions as intermediate transforms. This is often the cleanest way to write
a Transform:

```js
// pipeline_generators.js
import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';

// make sure big.csv exists (run make_big.js first)
async function* toJsonLines(lines) {
  let header = null;
  for await (const line of lines) {
    const cells = line.split(',');
    if (!header) { header = cells; continue; }
    yield JSON.stringify(Object.fromEntries(header.map((h, i) => [h, cells[i]]))) + '\n';
  }
}

await pipeline(
  createInterface({ input: createReadStream('big.csv'), crlfDelay: Infinity }),
  toJsonLines,
  createWriteStream('out.jsonl'),
);
console.log('done');
```

Observed: converts 2M rows in constant memory (it takes several seconds; use fewer rows for a quicker run).
`readline` is convenient but not the fastest; for extreme throughput split on `'\n'` yourself.

**Custom Writable: sink that counts bytes**

```js
import { Writable } from 'node:stream';

class ByteCounter extends Writable {
  bytes = 0;
  _write(chunk, _enc, cb) {
    this.bytes += chunk.length;
    cb();                           // call cb() when this chunk is handled; pass an error to fail the stream
  }
}
```

**Streaming an HTTP file response (the classic use case)**

```js
// serve_file.js   run: node serve_file.js   then open http://localhost:3000/ (needs big.csv)
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

createServer(async (req, res) => {
  try {
    const file = './big.csv';
    const { size } = await stat(file);               // ENOENT is thrown here BEFORE headers are sent
    res.writeHead(200, { 'content-type': 'text/csv', 'content-length': size });
    await pipeline(createReadStream(file), res);     // backpressure + cleanup on client disconnect
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500).end('error');
    } else {
      res.destroy(err);                              // headers already sent: all we can do is abort
    }
  }
}).listen(3000, () => console.log('http://localhost:3000'));
```

Key points: headers cannot be changed after streaming starts, so do checks (existence, auth, size) first; if the
client disconnects midway, `pipeline` destroys the file stream so the descriptor is released (a manual `.pipe()`
would leak it). Real servers also support `Range` requests (partial content) for video; see Week 3.

**Why it matters**

Most real streaming code is: source -> transform(s) -> sink, with errors handled. Knowing how to write
a Transform correctly (partial chunks, `flush`) separates people who copy snippets from those who understand
chunk semantics.

**Frontend connection**

An async generator stage is similar to writing `async function*` with `for await` over `response.body` in the
browser, or a `TransformStream`. Mapping: Node `Transform` <-> Web `TransformStream`.

**Real-world scenario**

Import of bank statements: a user uploads a 300 MB CSV. The handler streams the upload (`req`), splits lines,
validates each row, batches 1000 rows per `INSERT` (Week 4/5), and reports row-level errors. Memory remains small,
and the endpoint can reject on the first malformed line without reading the rest.

**Interview answer:**

"To build custom streams I extend Transform, Readable or Writable, or more simply use async generator functions
inside `pipeline`. Because chunk boundaries are arbitrary, a parser Transform must keep any partial trailing data
in state and emit the remainder in `_flush`. I connect stages with `stream/promises` `pipeline`, so errors propagate
and every stream is destroyed. For HTTP responses I validate everything before writing headers and then pipe the
file stream into the response."

**Follow-up questions**

1. *What is `_flush` in a Transform?* Called once input has ended and before the stream closes; used to emit
   buffered remainder data.
2. *What is `callback(err, data)` in `_transform`?* Signals the chunk is processed and optionally pushes output; an
   error fails the stream.
3. *Why use `pipeline` over `pipe`?* `pipe` does not forward errors or destroy the other streams, leaking
   resources; `pipeline` does both and returns a promise.
4. *Can a Transform emit more or fewer chunks than it received?* Yes: any number of `push()` calls per input.
5. *What if the client closes the connection mid-download?* `pipeline` sees `res` close/error and destroys the read
   stream, releasing the file descriptor.

**Common mistakes**

- Assuming a chunk equals a message/line.
- Forgetting `callback()` in `_transform` (stream stalls forever).
- Throwing inside `_transform` instead of passing the error to the callback.
- Sending headers and then discovering an error you could have checked first.

**Revision notes**

- Buffer partial data, flush the tail. Call the callback exactly once per chunk.
- Async generators work as pipeline stages. Validate before sending headers. Use `pipeline`.

---

### 4.4 Web Streams awareness [ADVANCED]

Node 18+ also ships WHATWG Web Streams (`ReadableStream`, `WritableStream`, `TransformStream`), the same ones
browsers use. `fetch()` responses expose `response.body` as a Web `ReadableStream`. Convert between worlds:

```js
import { Readable } from 'node:stream';

const res = await fetch('https://example.com');
const nodeReadable = Readable.fromWeb(res.body);     // Web -> Node
for await (const chunk of nodeReadable) { /* ... */ break; }
// Readable.toWeb(nodeReadable) converts the other way
```

For backend interviews, Node streams (`node:stream`) are the expected knowledge; mention that Web Streams exist for
cross-runtime code (Deno, Bun, edge workers). Details of Web Streams are not needed for junior-to-mid interviews.

---

### Day 4 wrap-up

**Key concepts to remember**

- `fs/promises` in app code; sync only at startup. `readFile` loads everything; use streams for large data.
- `fs` async operations use the thread pool. Close `FileHandle`s. Handle `err.code`. Atomic write = temp + rename.
- Path traversal: resolve user paths against a base directory and verify containment, or avoid user-supplied names.
- Streams: Readable / Writable / Duplex / Transform; internal buffer with `highWaterMark` (Node 22 byte default 64
  KiB, earlier 16 KiB; object mode 16 objects).
- `for await` and `pipeline` instead of manual `data` events and `pipe`. Always handle `error`.
- Chunk boundaries are arbitrary: buffer partial data, use `_flush`.
- Validate and compute headers before streaming an HTTP response.

**Five revision questions**

1. Compare callback, promise and sync `fs` APIs, and say which thread executes each.
2. Why does a stream use constant memory but `readFile` does not? What is the extra benefit besides memory?
3. Name the four stream types with one real example each.
4. What are the differences among `end`, `finish`, and `close`?
5. Show how a path traversal attack works against `path.join(base, userInput)` and how you prevent it.

**One practical coding task**

Write `log_stats.js`: given a large text file of access log lines like
`2026-05-01T10:00:00Z GET /api/orders 200 35ms`, stream it with `readline` and compute, in constant memory, the
request count per status code and the 95th percentile latency (hint: keep a histogram of latency buckets
instead of all values). Generate a 500 MB test file with a stream writer first. Print peak RSS at the end.

**Self-assessment checklist**

- [ ] I ran `mem_compare.js` both ways and can explain the difference.
- [ ] I can write a Transform that handles chunk boundaries and `_flush`.
- [ ] I can stream a file to an HTTP response with correct error handling.
- [ ] I can state the `highWaterMark` defaults and that they changed in Node 22.
- [ ] I know why `pipe()` is not recommended for new code.
- [ ] I can explain path traversal and show a defence.

---

## Day 5 - Backpressure, stream pipelines, EventEmitter

**Time plan (about 2 hours)**

| Minutes | Activity |
|---------|----------|
| 40 | 5.1: backpressure (concept, experiment, manual handling) |
| 25 | 5.2: `pipeline`, error handling, gzip, upload size limit, HTTP upload |
| 40 | 5.3: EventEmitter (API, semantics, pitfalls, implementing your own) |
| 15 | Run examples; answer follow-ups aloud |
| 10 | Day wrap-up |

**Learning objectives**

By the end of today you can:

1. Explain backpressure with a concrete mechanism: `write()` returning `false`, `drain`, `highWaterMark`, `pause/resume`.
2. Demonstrate with numbers what happens when backpressure is ignored.
3. Use `stream/promises` `pipeline` correctly and explain why it replaces `pipe()`.
4. Build a safe upload pipeline with a size limit and cleanup.
5. Use EventEmitter correctly: sync emission, `error` event rules, `once`, listener limits, async listener errors.
6. Implement a minimal EventEmitter from scratch (a common coding question).

---

### 5.1 Backpressure [ESSENTIAL]

**Concept**

Backpressure matlab: jab **producer tez hai aur consumer slow**, to consumer producer ko bolta hai "ruko, mujhe time
chahiye". Agar ye signal nahi hota to data beech ke buffer me jama hota rehta hai aur **memory badhti jaati hai**
(OOM crash). Example: ek taraf 1 GB/s disk read, dusri taraf 1 MB/s slow client connection. Beech ka data kahan jayega?
RAM me, agar tum rok nahi lagaoge.

Analogy: ek tez tap aur ek chhota sink. Agar tap band nahi karoge to bucket overflow hoga. Backpressure = tap ko
automatically band karna jab sink bhar jaye.

**Internal working**

Both sides of a stream have an internal buffer with a limit, `highWaterMark` (HWM). The protocol is cooperative:

```
 Writable side                                   Producer (your code / a Readable)
 ---------------------------------------------------------------------------
 write(chunk) -> adds chunk to internal buffer
     if buffered bytes < HWM  -> returns true   ("keep going")
     if buffered bytes >= HWM -> returns false  ("STOP, buffer is full")   <-- the backpressure signal
 ... the writable drains its buffer to the destination (disk/socket) ...
 when buffer empties -> emits 'drain'           ("you may continue")      <-- the resume signal

 Readable side (inside pipe/pipeline):
     dest.write(chunk) === false  -> source.pause()
     dest 'drain' event           -> source.resume()
```

Important facts:

1. `write()` **always accepts** the chunk, even when it returns `false`. The data is buffered, not dropped. The
   `false` is advice. If you ignore it, memory grows without limit.
2. HWM is a threshold, not a hard cap.
3. A Readable also has an HWM: `push()` returns `false` when its buffer is full, telling a custom producer to stop
   pushing until `_read()` is called again.
4. Sockets show this naturally: if the remote client reads slowly, the kernel send buffer fills, Node's Writable
   buffer fills, `res.write()` returns `false`.

**Runnable experiment: ignore it, handle it manually, let pipeline handle it**

```js
// bp_demo.js   run: node bp_demo.js naive   |   node bp_demo.js manual   |   node bp_demo.js pipeline
import { Writable, Readable } from 'node:stream';
import { once } from 'node:events';
import { pipeline } from 'node:stream/promises';

const mode = process.argv[2] ?? 'naive';
const makeChunk = () => Buffer.alloc(1024 * 1024, 1);   // 1 MiB, a fresh allocation each time
const COUNT = 200;                                      // 200 MiB total
let peakBuffered = 0;
let peakRss = 0;

// A slow consumer, like a slow disk or a slow client connection
const slow = new Writable({
  highWaterMark: 4 * 1024 * 1024,
  write(chunk, _enc, cb) { setTimeout(cb, 1); },
});
const sampler = setInterval(() => {
  peakBuffered = Math.max(peakBuffered, slow.writableLength);
  peakRss = Math.max(peakRss, process.memoryUsage().rss);
}, 1);

const t0 = performance.now();
if (mode === 'naive') {
  for (let i = 0; i < COUNT; i++) slow.write(makeChunk());          // ignores the return value
  peakBuffered = Math.max(peakBuffered, slow.writableLength);
  peakRss = Math.max(peakRss, process.memoryUsage().rss);
  slow.end();
} else if (mode === 'manual') {
  for (let i = 0; i < COUNT; i++) {
    if (!slow.write(makeChunk())) await once(slow, 'drain');        // wait until the buffer empties
  }
  slow.end();
} else {
  const source = Readable.from((function* () { for (let i = 0; i < COUNT; i++) yield makeChunk(); })());
  await pipeline(source, slow);                                     // backpressure handled for us
}
if (mode !== 'pipeline') await once(slow, 'finish');
clearInterval(sampler);
console.log(`${mode}: peak buffered = ${(peakBuffered / 1048576).toFixed(1)} MB, peak rss = ${(peakRss / 1048576).toFixed(0)} MB, took ${Math.round(performance.now() - t0)} ms`);
```

Observed output (Windows, Node 20; your numbers differ, the pattern does not):

```
naive:    peak buffered = 200.0 MB, peak rss = 243 MB, took 3111 ms
manual:   peak buffered = 4.0 MB,   peak rss = 75 MB,  took 2671 ms
pipeline: peak buffered = 4.0 MB,   peak rss = 75 MB,  took 2842 ms
```

Same total time (the consumer is the bottleneck either way), but the naive version holds the **entire** 200 MiB
in memory; the other two never exceed about the HWM. Make `COUNT = 5000` and the naive version needs 5 GB
and crashes; the other two remain at about 75 MB. That is the entire point.

**What `pipe()` and `pipeline()` do for you**

A simplified `pipe()` is just this:

```js
// what src.pipe(dest) roughly does
src.on('data', (chunk) => {
  if (dest.write(chunk) === false) src.pause();     // dest buffer full -> stop the source
});
dest.on('drain', () => src.resume());               // dest emptied -> restart the source
src.on('end', () => dest.end());
```

**Handling it when writing the loop yourself** (generating a big response, exporting rows)

```js
import { once } from 'node:events';

async function writeRows(res, rowIterator) {
  for await (const row of rowIterator) {
    const ok = res.write(JSON.stringify(row) + '\n');
    if (!ok) await once(res, 'drain');       // pause this loop until the client has caught up
  }
  res.end();
}
```

If the client disconnects while you wait for `drain`, `drain` never fires; the promise from `once()` rejects when the
emitter emits `error` and you should also listen to `close`. In practice prefer `pipeline(Readable.from(generator), res)`
which handles all of it:

```js
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

async function* rowsAsNdjson(rowIterator) {
  for await (const row of rowIterator) yield JSON.stringify(row) + '\n';
}
// inside a handler: await pipeline(Readable.from(rowsAsNdjson(rows)), res);
```

**Backpressure in a custom Readable** `[ADVANCED]`

```js
import { Readable } from 'node:stream';

class Counter extends Readable {
  #i = 0;
  _read() {                                   // called when the consumer wants more
    while (this.#i < 1_000_000) {
      const wantMore = this.push(`${this.#i++}\n`);
      if (!wantMore) return;                  // buffer full: stop; _read will be called again later
    }
    this.push(null);                          // end of stream
  }
}
```

**Why it matters**

Ignoring backpressure is the classic stream bug that survives development (small test data) and takes down production
(large data, slow clients). "What is backpressure and how do you handle it?" is one of the most common Node
senior/mid-level questions.

**Frontend connection**

Web Streams in the browser have the same idea (`controller.desiredSize`, `writer.ready`). Also similar to
rate-limiting how fast you append to the DOM or process WebSocket messages when the UI cannot keep up.

**Real-world scenario**

A "download my statements" endpoint reads rows from MySQL fast (LAN) and writes CSV to the user over a mobile
connection. Without backpressure each concurrent download buffers the whole export in RAM; 50 users on slow
networks hold gigabytes and the pod is killed at OOM. With `pipeline(dbStream, csvTransform, res)`, memory per
download is a few hundred KB and a slow client simply slows its own export.

**Interview answer:**

"Backpressure is the mechanism that stops a fast producer from overwhelming a slow consumer. In Node streams,
`writable.write()` returns `false` when the internal buffer reaches `highWaterMark`; the producer should stop
writing until the writable emits `drain`. `readable.pipe()` and `stream.pipeline()` implement this automatically
by pausing the source and resuming it on drain. If you ignore it, the data is still accepted but piles up in
memory, which can cause out-of-memory crashes with large files or slow clients. I use `pipeline` so backpressure,
error propagation and cleanup are handled consistently."

**Follow-up questions**

1. *Does `write()` returning `false` mean data was lost?* No. The chunk is buffered; `false` just signals that the
   buffer is full and you should wait for `drain`.
2. *Is `highWaterMark` a hard limit?* No, a threshold. You can still write beyond it and memory will grow.
3. *How does backpressure work with HTTP responses?* `res` is a Writable over a socket. If the client reads slowly,
   the kernel and Node buffers fill, `res.write()` returns `false`; piping a file into `res` pauses the file read.
4. *What happens with `for await (const chunk of readable)` and a writable?* The loop itself does not apply
   backpressure to the writable. You must check `write()` and await `drain`, or use `pipeline`.
5. *How would you test it?* Use a deliberately slow Writable and watch `writableLength` and RSS, as in the
   experiment.
6. *What is the difference between `readable.pause()` and the writable returning false?* `pause()` is the Readable
   side stopping data events; `false` is the Writable's signal that triggers a pause in pipe/pipeline.

**Common mistakes**

- Calling `write()` in a loop and never checking the return value.
- `await stream.write(chunk)`: `write` does not return a promise; awaiting it does nothing.
- Collecting all chunks into an array/string "just to be safe".
- Using `pipe` and forgetting `error` handlers, then leaking descriptors.
- Reading a whole DB result set into memory before streaming it to the client (the stream starts too late and the
  memory is already used).

**Revision notes**

- `write()` false -> pause producer; `drain` -> resume. Data is buffered anyway, so ignoring it = memory growth.
- HWM = threshold (64 KiB byte default in Node 22, 16 KiB earlier; 16 objects in object mode).
- `pipe` and `pipeline` automate it; `for await` + manual writes does not.

---

### 5.2 `pipeline`, error propagation, and real pipelines [ESSENTIAL]

**Concept**

`stream.pipeline(a, b, c, ...)` connect karta hai streams ko, backpressure sambhalta hai, aur **kisi bhi stream me error
aaye to sab streams ko destroy** kar deta hai. Promise-version: `import { pipeline } from 'node:stream/promises'`.

**Why `pipe()` is not enough (proof)**

```js
// pipe_vs_pipeline.js
import { Readable, PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// A source that emits one chunk, then fails.
function failingSource() {
  let sent = false;
  return new Readable({
    read() {
      if (sent) return;
      sent = true;
      this.push('data');
      setImmediate(() => this.destroy(new Error('source failed')));
    },
  });
}

// 1) classic pipe(): the error does NOT propagate and the destination is not cleaned up
const dest1 = new PassThrough();
dest1.resume();
const src1 = failingSource();
src1.on('error', (e) => console.log('pipe: source error ->', e.message));
src1.pipe(dest1);
await new Promise((resolve) => setTimeout(resolve, 50));
console.log('pipe: destination destroyed?', dest1.destroyed);        // false: leaked, still open

// 2) pipeline(): rejects and destroys every stream
const dest2 = new PassThrough();
dest2.resume();
try {
  await pipeline(failingSource(), dest2);
} catch (e) {
  console.log('pipeline: rejected ->', e.message);
}
console.log('pipeline: destination destroyed?', dest2.destroyed);    // true
```

Observed:

```
pipe: source error -> source failed
pipe: destination destroyed? false
pipeline: rejected -> source failed
pipeline: destination destroyed? true
```

With `pipe()` in a real server the "destination" is a file descriptor or a client socket. Not closing it leaks
descriptors and memory under errors or client disconnects.

**Rules of `pipeline`**

- First argument: a Readable, an iterable, or an async generator. Middle: Transforms or async generator functions.
  Last: a Writable (or an async function consuming the stream).
- Returns a promise (`stream/promises`) that resolves when the last stream finishes and rejects with the first error.
- Supports cancellation: `await pipeline(a, b, { signal })` with `AbortSignal.timeout(ms)` or an `AbortController`.
- Does not end `process.stdout` (it is special: it cannot be closed).
- Related helpers: `stream.finished(stream)` (promise when a stream is done or errored), `stream.compose` `[ADVANCED]`.

**Example: compress a file (zlib runs on the thread pool)**

```js
// gzip_file.js (needs big.csv from Day 4)
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip, createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

await pipeline(createReadStream('big.csv'), createGzip(), createWriteStream('big.csv.gz'));
await pipeline(createReadStream('big.csv.gz'), createGunzip(), createWriteStream('big.copy.csv'));
console.log('ok');
// Observed: 49,557,120 byte CSV compresses to 11,349,509 bytes; the round trip is byte-identical in size.
```

**Example: a safe upload with a size limit**

```js
// size_limit.js  (reusable class, no demo code)
import { Transform } from 'node:stream';

export class SizeLimit extends Transform {
  #seen = 0;
  constructor(maxBytes) { super(); this.max = maxBytes; }
  _transform(chunk, _enc, cb) {
    this.#seen += chunk.length;
    if (this.#seen > this.max) {
      return cb(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
    }
    cb(null, chunk);
  }
}
```

```js
// limit_demo.js
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { SizeLimit } from './size_limit.js';

try {
  await pipeline(
    Readable.from([Buffer.alloc(600), Buffer.alloc(600)]),    // 1200 bytes, limit is 1000
    new SizeLimit(1000),
    createWriteStream('upload.tmp'),
  );
} catch (e) {
  console.log(e.statusCode, e.message);                       // 413 Payload too large
}
```

Observed: `413 Payload too large`. The `pipeline` destroys the file stream, but the **partially written file stays on
disk**; production code deletes it (`rm(tmpPath, { force: true })`) in the `catch`.

**Example: an HTTP upload endpoint using the same pieces**

```js
// upload_server.js   run: node upload_server.js
import { createServer } from 'node:http';
import { createWriteStream } from 'node:fs';
import { rename, rm, mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { SizeLimit } from './size_limit.js';

const UPLOAD_DIR = path.resolve('uploads');
await mkdir(UPLOAD_DIR, { recursive: true });

createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/upload') {
    return res.writeHead(404).end();
  }
  const id = randomUUID();                              // server-chosen name: no path traversal
  const tmp = path.join(UPLOAD_DIR, `${id}.part`);
  const final = path.join(UPLOAD_DIR, id);
  try {
    await pipeline(req, new SizeLimit(5 * 1024 * 1024), createWriteStream(tmp, { flags: 'wx' }));
    await rename(tmp, final);                           // publish only complete files
    res.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify({ id }));
  } catch (err) {
    await rm(tmp, { force: true });                     // never leave half-uploaded files
    if (!res.headersSent) res.writeHead(err.statusCode ?? 500).end(err.message);
  }
}).listen(3000, () => console.log('POST raw bytes to http://localhost:3000/upload'));
```

A real API also checks the `Content-Length` header early, authenticates before reading the body, and uses a
multipart parser such as busboy or multer for browser form uploads (Week 3).

**Why it matters**

`pipeline` is the production-grade way to connect streams. Many real leaks ("too many open files",
"memory keeps growing after client aborts") come from `pipe()` without error handling.

**Frontend connection**

`pipeline(a, b, c)` resembles `readable.pipeThrough(transform).pipeTo(writable)` in Web Streams, and
`AbortSignal` cancellation is the same API you use with `fetch`.

**Real-world scenario**

KYC document upload in a banking app: stream the upload through a size limiter and a virus-scan stage (async
generator that rejects on detection) into object storage; on any failure delete the temp object and return 4xx.
No file is ever fully in memory.

**Interview answer:**

"I use `stream.pipeline`, preferably the promise version, instead of chaining `pipe()`. It applies backpressure,
propagates an error from any stream, destroys all streams on failure so descriptors and sockets are released,
and supports cancellation with an AbortSignal. With `pipe()` an error in one stream does not close the others, which
leaks resources. For uploads I stream the request into a temporary file through a size-limiting transform, rename it
when complete, and delete it on failure."

**Follow-up questions**

1. *What happens to the other streams if one fails in `pipeline`?* They are destroyed, and the promise rejects with
   the first error.
2. *How do you add a timeout?* `pipeline(..., { signal: AbortSignal.timeout(30_000) })`.
3. *Does the request being aborted by the client reject `pipeline(req, ...)`?* Yes (premature close error), and your
   cleanup code runs.
4. *Why write to a temp file and rename?* So other readers never see a partially uploaded file.
5. *Can I use async generators in `pipeline`?* Yes; they are convenient transforms and compose with backpressure.

**Common mistakes**

- Using `pipe()` chains without per-stream `error` handlers.
- Not cleaning up partial files on error.
- Trusting `Content-Length` alone as a size check (it can lie; enforce while streaming).
- Using the original client filename on disk.
- Forgetting to authenticate before reading the body.

**Revision notes**

- `pipeline` = backpressure + error propagation + cleanup + abort support. Prefer over `pipe`.
- Uploads: limit while streaming, temp file + rename, delete on failure, server-chosen names.

---

### 5.3 EventEmitter [ESSENTIAL]

**Concept**

`EventEmitter` Node ka **publish-subscribe (pub/sub)** pattern hai: ek object events emit karta hai, doosre
objects un events ke listeners register karte hain. Streams, HTTP server, sockets, `process`, child processes sab
EventEmitter par bane hain. Tumhara apna code bhi isse use kar sakta hai (order service emits `order.paid`, email
service listens).

**Internal working**

An emitter holds a map: event name -> array of listener functions.

- `on(event, fn)` / `addListener`: append `fn`.
- `once(event, fn)`: wrapper that removes itself after the first call.
- `off(event, fn)` / `removeListener`: remove that function reference.
- `emit(event, ...args)`: call each listener **synchronously, in registration order**, with `this` bound to the
  emitter (for non-arrow functions). Returns `true` if there were listeners, else `false`.
- `prependListener`: insert at the front.
- `listenerCount(event)`, `removeAllListeners([event])`, `eventNames()`.

Properties that matter:

1. **Emission is synchronous.** `emit()` returns only after all listeners finish. A slow listener blocks the emitter
   and the caller. It is *not* a queue or a background job system.
2. **Listener errors propagate to the emitter caller.** A listener that throws makes `emit()` throw (remaining
   listeners do not run).
3. **Special `'error'` event.** If `emit('error', err)` is called and there is **no** `'error'` listener, Node
   **throws** the error (crashing the process if uncaught). Always attach an `error` listener to emitters that
   can fail (streams, sockets, your own classes that emit errors).
4. **Async listeners are not awaited.** `emit` ignores returned promises. If an `async` listener rejects, you get an
   unhandled rejection (a crash since Node 15) unless you use `{ captureRejections: true }`, which routes the
   rejection to the `'error'` event.
5. **Max listeners warning.** More than 10 listeners for the same event prints `MaxListenersExceededWarning` (a
   heuristic for leaks). Raise intentionally with `setMaxListeners(n)`; never to silence a genuine leak.
6. **Memory:** the emitter holds strong references to listeners, and closures inside them keep their scope alive
   (Day 6).

```js
// ee_demo.js
import { EventEmitter, once, on } from 'node:events';

// --- basics and ordering ---
const e = new EventEmitter();
e.on('a', () => console.log('listener 1'));
e.prependListener('a', () => console.log('listener 0 (prepended)'));
e.once('a', () => console.log('once listener'));
console.log('before emit');
console.log('emit returned', e.emit('a'));     // listeners already ran by the time this prints
console.log('after emit');
console.log('second emit returned', e.emit('a'), e.emit('nobody'));  // once-listener gone; no listeners -> false

// --- error event rule ---
try {
  e.emit('error', new Error('boom'));          // no 'error' listener -> emit THROWS
} catch (err) {
  console.log('thrown from emit:', err.message);
}

// --- async listener pitfall ---
const e2 = new EventEmitter();
e2.on('x', async () => { throw new Error('async listener failed'); });
process.once('unhandledRejection', (r) => console.log('unhandledRejection:', r.message));
e2.emit('x');                                  // emit does not await; rejection escapes

// --- captureRejections routes it to the error event ---
const e3 = new EventEmitter({ captureRejections: true });
e3.on('y', async () => { throw new Error('captured'); });
e3.on('error', (err) => console.log('routed to error event:', err.message));
e3.emit('y');

// --- promise and async-iterator helpers ---
const e4 = new EventEmitter();
setTimeout(() => e4.emit('ready', 42, 'x'), 10);
const [value, label] = await once(e4, 'ready');              // resolves with the emit args as an array
console.log('once resolved', value, label);

const ac = new AbortController();
setTimeout(() => e4.emit('tick', 1), 5);
setTimeout(() => e4.emit('tick', 2), 10);
setTimeout(() => ac.abort(), 20);
try {
  for await (const [n] of on(e4, 'tick', { signal: ac.signal })) console.log('tick', n);
} catch (err) {
  console.log(err.name);                                      // AbortError
}

// --- max listeners warning ---
for (let i = 0; i < 11; i++) e4.on('leak', () => {});         // prints MaxListenersExceededWarning
```

Observed output (abridged, in order):

```
before emit
listener 0 (prepended)
listener 1
once listener
emit returned true
after emit
listener 0 (prepended)
listener 1
second emit returned true false
thrown from emit: boom
routed to error event: captured
unhandledRejection: async listener failed
once resolved 42 x
tick 1
tick 2
AbortError
(node) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 leak listeners added ...
```

**Realistic usage: a domain-event emitter with a typed `error` path**

```js
// order_service.js
import { EventEmitter } from 'node:events';

export class OrderService extends EventEmitter {
  async pay(orderId, amount) {
    if (amount <= 0) throw new Error('Invalid amount');
    // ... charge the card, write to DB ...
    this.emit('order.paid', { orderId, amount, at: new Date().toISOString() });
    return { orderId, status: 'PAID' };
  }
}

const orders = new OrderService();
orders.on('order.paid', (evt) => console.log('send email for', evt.orderId));
orders.on('order.paid', (evt) => console.log('update analytics for', evt.orderId));
orders.on('error', (err) => console.error('order service error:', err));   // always attach

await orders.pay('A-1001', 2500);
```

Be honest about limits: in-process events are fine for decoupling inside one process, but they are **not durable**.
If the process crashes between `emit` and a listener doing its job (sending the email), the event is lost, and
listeners run synchronously on the same thread. For reliable work across services use a queue (Week 6/7).

**Implement a minimal EventEmitter (frequent live-coding question)**

```js
// mini_emitter.js
export class MiniEmitter {
  #events = new Map();                     // eventName -> array of functions

  on(name, fn) {
    if (!this.#events.has(name)) this.#events.set(name, []);
    this.#events.get(name).push(fn);
    return this;                           // chainable like Node's
  }

  off(name, fn) {
    const list = this.#events.get(name);
    if (!list) return this;
    const i = list.findIndex((l) => l === fn || l.original === fn);
    if (i !== -1) list.splice(i, 1);
    if (list.length === 0) this.#events.delete(name);
    return this;
  }

  once(name, fn) {
    const wrapper = (...args) => {
      this.off(name, wrapper);
      fn.apply(this, args);
    };
    wrapper.original = fn;                 // so off(name, fn) still works before it fires
    return this.on(name, wrapper);
  }

  emit(name, ...args) {
    const list = this.#events.get(name);
    if (!list || list.length === 0) {
      if (name === 'error') throw args[0] instanceof Error ? args[0] : new Error('Unhandled error event');
      return false;
    }
    for (const fn of [...list]) fn.apply(this, args);   // copy: listeners may remove themselves while running
    return true;
  }

  listenerCount(name) { return this.#events.get(name)?.length ?? 0; }
}

const m = new MiniEmitter();
m.once('hi', (n) => console.log('hello', n));
console.log(m.emit('hi', 'asha'), m.emit('hi', 'again'));   // hello asha, then: true false
```

Why the `[...list]` copy matters: `once` wrappers remove themselves during iteration; without the copy the loop would
skip the next listener. Mention this in the interview, it shows understanding.

**EventTarget** `[ADVANCED]`: the browser-style `addEventListener`/`dispatchEvent` API is also available in Node
(used by `AbortSignal`, `BroadcastChannel`). Node's own APIs mostly use EventEmitter.

**Why it matters**

EventEmitter underlies streams, HTTP, sockets and `process`; understanding its synchronous nature, the `error`
rule and listener leaks explains many production bugs. Interviewers also love "implement EventEmitter".

**Frontend connection**

Like DOM events (`addEventListener`/`dispatchEvent`) or a small pub/sub store. Differences: Node emission is
synchronous in registration order; there is no bubbling or capturing; `error` is special; `removeListener` needs the
same function reference (as with `removeEventListener`).

**Real-world scenario**

An e-commerce checkout emits `order.paid`; listeners send a confirmation email, reduce stock, and update loyalty
points. One listener awaits a slow SMTP call without handling errors: its rejection becomes an unhandled rejection
and crashes the service, and in another variant its slowness delays the HTTP response because emit is
synchronous. Fixes: handle errors inside listeners (try/catch), push slow work to a queue, and design so a
listener failure does not break the main flow.

**Interview answer:**

"EventEmitter is Node's built-in publish-subscribe mechanism: objects register listeners with `on` or `once` and
other code calls `emit`. Emission is synchronous and in registration order, so listeners run before `emit`
returns, and a slow or throwing listener affects the emitter. The special `error` event throws if nobody listens,
so I always attach an error listener. Listeners are not awaited, so async listener failures become unhandled
rejections unless I handle them or use `captureRejections`. I also watch for listener leaks because the emitter keeps
strong references to its listeners; Node warns after more than ten listeners for one event."

**Follow-up questions**

1. *Is `emit` synchronous or asynchronous?* Synchronous. Listeners run immediately in order. For deferral use
   `setImmediate` or `process.nextTick`.
2. *What happens if you emit `'error'` without a listener?* Node throws; uncaught it terminates the process.
3. *How do you remove a listener?* `off(event, sameFunctionReference)`. Anonymous inline functions cannot be removed
   later; keep a reference, or pass an `AbortSignal` to `events.once` / `events.on` so the wait can be cancelled.
4. *`on` vs `once`?* `once` auto-removes after the first call.
5. *How do you wait for an event with promises?* `await events.once(emitter, 'name')`; rejects if `error` is emitted.
6. *What causes `MaxListenersExceededWarning`?* More than 10 listeners for one event on an emitter, usually adding a
   listener per request on a long-lived emitter without removing it.
7. *When is EventEmitter the wrong tool?* When you need durability, retries, ordering across processes or
   backpressure; use a queue or broker.
8. *Do listeners run in the order registered?* Yes; `prependListener` changes that.

**Common mistakes**

- Forgetting the `error` listener.
- Assuming async listeners are awaited or ordered.
- Adding a listener inside every request handler to a global emitter and never removing it (leak).
- Using `emit` for work that must survive crashes.
- `off('x', () => {...})` with a new anonymous function (does nothing).
- Heavy synchronous work in listeners (blocks the loop).

**Revision notes**

- Sync, ordered emission; listener throw propagates; `error` event throws without a listener; async listeners not
  awaited (`captureRejections`).
- `once`, `off`, `prependListener`, `events.once`, `events.on`. >10 listeners -> leak warning.
- Not durable; use queues for reliability.

---

### Day 5 wrap-up

**Key concepts to remember**

- Backpressure: `write()` false -> pause; `drain` -> resume; data is buffered anyway; ignoring it grows memory.
- `highWaterMark` is a threshold (byte streams 64 KiB in Node 22, 16 KiB before; objects 16).
- `pipeline` (promises) over `pipe`: propagates errors, destroys streams, supports AbortSignal.
- Uploads: limit while streaming, temp file then rename, delete on failure, server-generated names.
- EventEmitter: synchronous, ordered, `error` special, async listeners not awaited, >10 listeners warning.
- Emitters are in-process and not durable.

**Five revision questions**

1. What exactly does `write()` returning `false` mean, and what must the producer do?
2. Why does the "naive" experiment use 200 MB while the pipeline version stays near the high-water mark?
3. Why is `pipeline` safer than `pipe()`? Describe a failure scenario.
4. If `emit('error', err)` is called with no error listener, what happens? What about a rejected async listener?
5. Implement `once()` for an emitter. What bug appears if `emit` iterates the live listener array?

**One practical coding task**

Write `export_server.js`: a `GET /export.csv` endpoint that fabricates 5 million rows with an async generator, turns
them into CSV lines, gzips when the client sends `Accept-Encoding: gzip`, and uses `pipeline` to the response. Verify
with `curl --limit-rate 200k` (a slow client) that RSS stays flat, and that aborting the curl (Ctrl+C) stops the
generator (log in a `finally` block inside the generator).

**Self-assessment checklist**

- [ ] I ran `bp_demo.js` in all three modes and can explain the numbers.
- [ ] I can explain `write()` false / `drain` without notes.
- [ ] I can write a pipeline with gzip and an upload size limit.
- [ ] I know three ways an EventEmitter can crash or leak a Node process.
- [ ] I implemented `MiniEmitter` (on/off/once/emit) from memory.
- [ ] I can say when not to use EventEmitter.

---

## Day 6 - Memory management, garbage collection, memory leaks

**Time plan (about 2 hours)**

| Minutes | Activity |
|---------|----------|
| 25 | 6.1: where memory lives (process, V8 heap, stack, external/native) |
| 30 | 6.2: garbage collection (reachability, generations, pauses, `--trace-gc`) |
| 35 | 6.3: memory leaks, the leak lab (run all scenarios) |
| 20 | 6.4: diagnosing leaks (heap snapshots, three-snapshot technique), OOM types |
| 10 | Review WeakMap and the memory-efficient habits (end of 6.3 and 6.4) |
| 10 | Day wrap-up |

**Learning objectives**

By the end of today you can:

1. Explain what `rss`, `heapTotal`, `heapUsed`, `external` and `arrayBuffers` mean, and why Buffers do not appear in `heapUsed`.
2. Describe how V8's garbage collector decides what to free (reachability) and the generational design (scavenge vs
   mark-sweep-compact).
3. Define a memory leak precisely and distinguish it from high-but-stable memory use.
4. Name and reproduce the six most common Node.js leak patterns, and fix each.
5. Describe a step-by-step investigation using memory metrics and heap snapshots.
6. Distinguish "JavaScript heap out of memory" (V8 limit) from a container OOM kill, and set limits sensibly.

---

### 6.1 Where memory lives in a Node process [ESSENTIAL]

**Concept**

Process ki memory sirf JS objects nahi hoti. Jab OS bolta hai "ye process 300 MB use kar raha hai" to usme ye sab shaamil hai:

```
 Process memory (what the OS reports as RSS = resident set size)
 +-------------------------------------------------------------------------+
 | V8 JavaScript heap  (objects, strings, arrays, closures)                |
 |    new space (young generation, small)                                  |
 |    old space (survivors, long-lived objects)                            |
 |    large object space (huge arrays/strings), code space, map space      |
 +-------------------------------------------------------------------------+
 | External / native memory OUTSIDE the V8 heap:                           |
 |    Buffers and ArrayBuffers, zlib/crypto native state, sockets' buffers |
 |    native addons, TLS state                                             |
 +-------------------------------------------------------------------------+
 | Call stack(s)  (default about 1 MB for the main thread)                 |
 | Node binary code, V8 compiled code, libuv, thread stacks                |
 +-------------------------------------------------------------------------+
```

`process.memoryUsage()` fields:

| Field | Meaning |
|-------|---------|
| `rss` | Total resident memory of the process (what a container limit and `top` see) |
| `heapTotal` | Memory V8 has reserved for its heap |
| `heapUsed` | Bytes in use by live and not-yet-collected JS objects |
| `external` | Memory of C++ objects tied to JS objects (includes Buffers) |
| `arrayBuffers` | Memory of ArrayBuffers/Buffers (included in `external`) |

**Observe it**

```js
// mem_fields.js
const mb = (n) => (n / 1048576).toFixed(1).padStart(7) + ' MB';
const show = (label) => {
  const m = process.memoryUsage();
  console.log(label.padEnd(22), 'rss', mb(m.rss), '| heapTotal', mb(m.heapTotal), '| heapUsed', mb(m.heapUsed),
    '| external', mb(m.external), '| arrayBuffers', mb(m.arrayBuffers));
};
show('start');
const objs = Array.from({ length: 500_000 }, (_, i) => ({ i, s: 'x' + i }));
show('+500k JS objects');
const buf = Buffer.alloc(200 * 1024 * 1024, 1);
show('+200 MB Buffer');
```

Observed:

```
start              rss    41.4 MB | heapTotal     4.5 MB | heapUsed     3.8 MB | external     1.4 MB | arrayBuffers     0.0 MB
+500k JS objects   rss   106.0 MB | heapTotal    67.8 MB | heapUsed    41.3 MB | external     1.6 MB | arrayBuffers     0.0 MB
+200 MB Buffer     rss   306.1 MB | heapTotal    67.8 MB | heapUsed    41.3 MB | external   201.6 MB | arrayBuffers   200.0 MB
```

The 200 MB Buffer raised `rss` and `external`/`arrayBuffers` by 200 MB while `heapUsed` did not move. Consequence:
**watching only `heapUsed` misses Buffer-related leaks**, and `--max-old-space-size` does not cap Buffer memory.

Important limits:

- **V8 heap limit** (`v8.getHeapStatistics().heap_size_limit`): default depends on Node version and system/cgroup
  memory (on the test machine for this lab it printed about 4144 MB). Change with
  `--max-old-space-size=<MB>`. Exceeding it is a fatal "JavaScript heap out of memory" crash.
- **Call stack limit:** about 1 MB (roughly 10,000 to 12,000 simple frames). Exceeding it throws
  `RangeError: Maximum call stack size exceeded` (catchable). `--stack-size` can raise it but risks a hard crash.
  Deep recursion on user input (a nested JSON, a recursive tree walk) is a denial-of-service risk.
- **Container limit** (Docker/Kubernetes `memory` limit): enforced by the OS. Going over it gets the process
  **OOM-killed (exit code 137 / SIGKILL)** with no JavaScript error, no stack trace. Compare with the V8 limit
  above: that one is raised by V8 with a message.
- **Rule of thumb:** set `--max-old-space-size` to roughly 70-80% of the container limit, leaving room for
  Buffers, native memory, stack and the Node runtime itself. Do not rely on automatic detection of container
  limits without testing on your Node version.

**Why it matters**

Memory questions test whether you can read production symptoms: "rss grows but heapUsed is flat" (Buffers/native),
"heapUsed grows after GC" (a leak), "memory is high but stable" (cache or large working set).

**Frontend connection**

Same V8 heap model as the browser tab, and same DevTools Memory profiler. The big difference: a tab is short-lived and
users refresh; a server runs for weeks, so a small leak per request becomes a crash.

**Real-world scenario**

An image-thumbnail service shows flat `heapUsed` (40 MB) but its pod restarts every few hours with exit code 137.
The cause: Buffers of uploaded images stored in a Map for "retry later" (external memory). The heap graph looked
healthy because it plotted only `heapUsed`; plotting `rss` and `arrayBuffers` revealed the leak.

**Interview answer:**

"A Node process's memory includes the V8 heap for JavaScript objects, plus native memory outside the heap such as
Buffers, plus stacks and runtime code. `process.memoryUsage()` reports rss for the whole process, heapUsed for live JS
objects, and external and arrayBuffers for native memory such as Buffers. A large Buffer increases rss without
increasing heapUsed, so I monitor both. The V8 heap limit is set with `--max-old-space-size` and results in a fatal
'heap out of memory' error, while a container limit kills the process with exit code 137, so I size the heap limit
below the container limit."

**Follow-up questions**

1. *Where are Buffers stored?* Outside the V8 heap, in native memory, tracked as `external`/`arrayBuffers`.
2. *What is the default heap limit?* It depends on version and available memory (commonly about 2-4 GB on 64-bit
   systems with enough RAM; check `v8.getHeapStatistics().heap_size_limit`). Do not quote a single number as fact.
3. *Difference between a heap OOM and a container OOM kill?* V8 prints "FATAL ERROR: Reached heap limit ... JavaScript
   heap out of memory" and aborts; the kernel kills a process that exceeds the cgroup limit (exit 137) with no JS error.
4. *What causes `Maximum call stack size exceeded`?* Unbounded or very deep recursion; catchable `RangeError`.
5. *Why is `rss` bigger than `heapTotal`?* RSS includes native memory, code, stacks, shared libraries.

**Common mistakes**

- Graphing only `heapUsed` and missing Buffer/native growth.
- Setting `--max-old-space-size` equal to the container limit (no headroom).
- Treating high `rss` immediately as a leak: V8 may keep freed memory for reuse before returning it to the OS.
- Raising the heap limit as the fix for a leak.

**Revision notes**

- RSS = heap + native (Buffers) + stacks + binary. `heapUsed` excludes Buffers.
- V8 heap limit (fatal JS error) vs container OOM (exit 137). Heap limit < container limit.
- Stack overflow is a catchable RangeError; recursion on user input is a risk.

---

### 6.2 Garbage collection in V8 [ESSENTIAL]

**Concept**

JavaScript me tum memory manually free nahi karte. **Garbage Collector (GC)** automatically un objects ko free karta hai
jinhe **program ke kisi bhi live reference se reach nahi kiya ja sakta** (unreachable). Rule yaad rakho:
**GC "kaun use nahi hoga" nahi dekhta; sirf "kya reachable hai" dekhta hai.** Isiliye leak ka matlab hota hai
"object ki zaroorat nahi, lekin koi reference abhi bhi usse pakde hue hai".

**Internal working**

*Reachability.* GC starts from **roots** (global object, the current call stack variables, active handles/timers, module
scope) and follows references. Everything reached is live; everything else is garbage (even objects that reference each
other in a cycle; JS GC is not reference counting).

*Generational hypothesis.* Most objects die young (temporary objects in a request), so V8 splits the heap:

```
 NEW SPACE (young generation)  - small (a few MB to tens of MB), two semi-spaces
     objects are allocated here (fast, pointer-bump)
     SCAVENGE (minor GC): copy live objects from the "from" semi-space to the "to" semi-space,
                           discard the rest.  Very fast (about 0.2 - 2 ms), runs often.
     objects that survive two scavenges are PROMOTED to old space
 OLD SPACE
     long-lived objects.  Collected by MARK-SWEEP-COMPACT (major GC):
        mark live objects from roots, sweep dead ones, sometimes compact to reduce fragmentation.
     Much more expensive; V8 reduces pauses using
        incremental marking (small steps), concurrent marking (helper threads), parallel
        scavenging/compaction, lazy sweeping   (the "Orinoco" project)
 LARGE OBJECT SPACE: very big arrays/strings are allocated separately, never moved.
```

*Pauses.* GC needs the JS thread to stop for parts of its work ("stop-the-world"). Scavenges pause for around a
millisecond; major GCs pause longer for big heaps (tens to hundreds of ms in bad cases). These pauses show up as
event-loop delay and latency spikes. GC work runs on the main thread plus V8's helper threads (these are **not** the
libuv thread pool).

*Allocation rate matters.* Creating millions of short-lived objects per second triggers many scavenges (cheap but
not free). Retaining objects too long (a big cache) makes major GCs more expensive.

*What triggers GC:* allocation failure in a space (heap full), memory pressure heuristics, idle time, explicit
`global.gc()` (only exists with `--expose-gc`; use for experiments, never in production code paths).

**Observe the GC**

Reachable vs unreachable:

```js
// gc_demo.js   run: node --expose-gc gc_demo.js
const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
let big = Array.from({ length: 1_000_000 }, (_, i) => ({ i }));
gc(); console.log('while referenced   :', mb(process.memoryUsage().heapUsed));   // about 41 MB
big = null;                                   // drop the last reference: now unreachable
gc(); console.log('after big = null   :', mb(process.memoryUsage().heapUsed));   // about 3 MB
```

Watch GC events live with `--trace-gc`:

```
node --trace-gc your_script.js
[45004:...]  32 ms: Scavenge 4.5 (5.2) -> 4.3 (6.2) MB, 0.38 / 0.00 ms (average mu = 1.000, ...) allocation failure;
[47376:...] 632 ms: Mark-Compact 63.7 (96.8) -> 63.7 (96.5) MB, 9.40 / 0.00 ms (...) allocation failure; scavenge might not succeed
```

Reading a line: collector type (`Scavenge` = young, `Mark-Compact` = major), heap used before (and total committed) ->
after, the pause time in ms, and the reason. A healthy server shows many short Scavenges and occasional Mark-Compacts
that **reduce** the heap. In the second line above, Mark-Compact went from 63.7 to 63.7 MB: it freed nothing, which is
the signature of a leak approaching the limit (the process crashed right after with "heap out of memory").

Useful related flags (know they exist; do not memorise values):

| Flag / API | Use |
|-----------|-----|
| `--max-old-space-size=<MB>` | Old-space (heap) limit |
| `--max-semi-space-size=<MB>` | Young-generation semi-space size; larger can reduce scavenge frequency and promotion for allocation-heavy servers (test before using) |
| `--trace-gc` | Print GC events |
| `v8.getHeapStatistics()`, `v8.getHeapSpaceStatistics()` | Programmatic heap numbers per space |
| `perf_hooks` `PerformanceObserver` with `entryTypes: ['gc']` | Measure GC pauses in production metrics |

**Why it matters**

Understanding "reachability" is the key to explaining leaks. Understanding generations explains why short-lived garbage
is cheap, why caches hurt major GC time, and why GC pauses appear as latency spikes.

**Frontend connection**

Identical engine. In Chrome DevTools "Performance" you see the same Minor GC / Major GC events. A detached DOM node that
a closure still references is the browser version of a server-side leak: still reachable, so not collected.

**Real-world scenario**

An API with p99 latency spikes every few minutes: `--trace-gc` shows Mark-Compact pauses of 300 ms because an
in-memory product catalogue (800 MB) lives in old space and is marked every cycle. Fixes: keep the catalogue in Redis
or a DB, shrink what is cached, or shard across processes. Raising the heap limit would make pauses worse.

**Interview answer:**

"V8 uses a generational, tracing garbage collector. An object is collected when it is no longer reachable from the
roots such as globals, the stack and active handles. New objects go into a small young generation that is cleaned
by a fast copying collector called a scavenge; objects that survive are promoted to the old generation, which is
collected by mark-sweep-compact using incremental, concurrent and parallel techniques to shorten pauses. Memory
leaks in JavaScript are therefore not forgotten frees; they are objects that remain reachable by mistake, for example
in a global map or an event listener."

**Follow-up questions**

1. *Does JavaScript use reference counting?* No, it uses tracing from roots, so cycles are collected fine.
2. *Why is a scavenge fast?* It only touches live young objects (few), copying them; dead objects cost nothing.
3. *What is a GC pause, and how do you see it?* Time the JS thread is stopped; observe with `--trace-gc`,
   `PerformanceObserver` for `gc` entries, event-loop delay metrics.
4. *Can you force GC?* Only with `--expose-gc` and `global.gc()`, for diagnostics. Never as a production "fix".
5. *Are circular references leaks?* No. If the cycle is unreachable from roots it is collected.
6. *What is promotion?* Moving survivors from new space to old space after surviving scavenges.
7. *Is GC running on the libuv thread pool?* No. V8 has its own helper threads.

**Common mistakes**

- Saying "JS uses reference counting" or "closures always leak".
- Calling `gc()` periodically in production to "fix" memory.
- Assuming `delete obj.prop` or setting variables to `null` is generally needed; local variables go out of scope
  automatically. Only long-lived references (globals, caches, listeners) need explicit cleanup.
- Believing memory returns to the OS immediately after GC.

**Revision notes**

- GC frees unreachable objects; roots = globals, stack, handles. Not reference counting.
- Young gen (scavenge, fast, frequent) vs old gen (mark-sweep-compact, incremental/concurrent). Promotion after survival.
- `--trace-gc` to observe; a Mark-Compact that frees nothing = leak signal.

---

### 6.3 Memory leaks: what they are and the common causes [ESSENTIAL]

**Concept**

**Memory leak** = memory jo application ko ab nahi chahiye, lekin kisi reachable reference ki wajah se GC use free
nahi kar pata, aur **time ke saath badhti jaati hai** (usually proportional to traffic/requests).

Three situations that look alike but are different:

| Situation | Pattern over time | Is it a leak? |
|-----------|-------------------|---------------|
| Normal operation | Sawtooth: rises, then drops after GC, same baseline | No |
| Large but stable working set (a deliberate cache, a loaded dataset) | Rises once then flat | No (but check it is bounded) |
| Leak | Staircase / steady upward slope; **baseline after each major GC keeps rising** | Yes |

The decisive test: look at memory **after a full GC** (the low points of the sawtooth). If the low points keep rising
with traffic, you have a leak.

**The six most common leak patterns in Node.js backends** (each with the runnable lab below)

1. **Unbounded cache / global collection.** A module-level `Map`, object or array that only grows: per-user
   caches, memoisation, "recent requests" arrays, in-memory sessions, queues that producers outrun.
2. **Event listeners that are never removed.** Adding a listener per request/connection/job to a long-lived
   emitter (`process`, a shared bus, a DB client, a pool). The emitter holds the function, and the function's closure
   holds everything it captured.
3. **Timers never cleared.** `setInterval` created per request/connection without `clearInterval`; each handle keeps
   its callback and closure alive and keeps firing.
4. **Closures retaining large objects.** A small callback stored globally accidentally captures a big variable
   from the enclosing scope (a whole request, a large array), keeping all of it alive.
5. **Unreleased resources / never-settling operations.** Streams not destroyed after errors, HTTP requests without
   timeouts holding buffers, DB connections or cursors not released, promises that never resolve (their
   continuations hold state), unbounded in-flight work (no concurrency limit).
6. **Per-request data attached to long-lived objects.** Storing `req`, `res`, or user data on global state, singletons,
   or a module-level array for logging or debugging; adding properties to shared objects with unique keys per request.

Also possible: native addon leaks, huge string slices keeping parent strings alive `[ADVANCED]`, and
leaks in `Buffer` usage (external memory).

**The leak lab (run it)**

```js
// leak_lab.js   run: node --expose-gc leak_lab.js <scenario>
// scenarios: cache-leak | cache-fixed | listener-leak | listener-fixed | timer-leak | timer-fixed | closure-leak
import { EventEmitter } from 'node:events';

const scenario = process.argv[2] ?? 'cache-leak';
if (typeof gc !== 'function') throw new Error('run with: node --expose-gc leak_lab.js <scenario>');

const mb = (n) => (n / 1048576).toFixed(1);

// ---- scenario building blocks ----
const unboundedCache = new Map();                        // module-level: lives forever
class LruCache {                                         // tiny LRU: a Map keeps insertion order
  constructor(max) { this.max = max; this.map = new Map(); }
  get(k) {
    if (!this.map.has(k)) return undefined;
    const v = this.map.get(k);
    this.map.delete(k); this.map.set(k, v);              // move to "most recent"
    return v;
  }
  set(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);   // evict the oldest
  }
}
const lru = new LruCache(1000);
const bus = new EventEmitter();
bus.setMaxListeners(0);                                  // silences the warning ONLY because this is a lab
const keep = [];

function handleRequest(i) {
  const payload = { id: i, data: new Array(1000).fill(i) };       // roughly 8 KB per "request"
  switch (scenario) {
    case 'cache-leak':     unboundedCache.set(`user:${i}`, payload); break;     // never evicted
    case 'cache-fixed':    lru.set(`user:${i}`, payload); break;                // bounded
    case 'listener-leak':  bus.on('shutdown', () => payload.id); break;         // never removed; closure holds payload
    case 'listener-fixed': {
      const onShutdown = () => payload.id;
      bus.on('shutdown', onShutdown);
      bus.off('shutdown', onShutdown);                                          // cleaned up when the request ends
      break;
    }
    case 'timer-leak':     setInterval(() => payload.id, 60_000); break;        // handle never cleared
    case 'timer-fixed': { const t = setInterval(() => payload.id, 60_000); clearInterval(t); break; }
    case 'closure-leak':   keep.push(() => payload.id); break;                  // closure retains payload
  }
}

// ---- drive it and measure after a forced full GC ----
let n = 0;
for (let round = 1; round <= 6; round++) {
  for (let k = 0; k < 5000; k++) handleRequest(n++);
  gc();                                                  // full GC: heapUsed now reflects only reachable objects
  console.log(`${scenario} round ${round}: requests=${n} heapUsed after GC = ${mb(process.memoryUsage().heapUsed)} MB`);
}
process.exit(0);                                         // leaked timers would otherwise keep the process alive
```

Run each scenario, e.g. `node --expose-gc leak_lab.js cache-leak`. Observed (round 1 -> round 6, heapUsed after GC):

| Scenario | Round 1 | Round 6 | Verdict |
|----------|---------|---------|---------|
| `cache-leak` | 42.0 MB | 236.4 MB | grows linearly with requests: leak |
| `cache-fixed` (LRU, 1000 entries) | 10.9 MB | 11.0 MB | flat: bounded |
| `listener-leak` | 42.0 MB | 237.6 MB | leak (closure + listener) |
| `listener-fixed` | 3.0 MB | 3.2 MB | flat |
| `timer-leak` | 42.7 MB | 241.7 MB | leak |
| `timer-fixed` | 3.0 MB | 3.3 MB | flat |
| `closure-leak` | 42.2 MB | 237.6 MB | leak |

Interpretation: in all leak scenarios memory after a **full GC** keeps climbing about 40 MB per 5000 requests, so the
growth is retained memory, not garbage waiting to be collected. The fixed variants stay flat.

**Fix patterns**

1. *Cache:* bound it (LRU with max entries or max bytes), add TTL, or use Redis/memcached instead of process memory.
   In production use a proven library (`lru-cache`) instead of your own class.
2. *Listeners:* use `once`, remove with `off` in `finally`/on close, prefer `AbortSignal` support, and avoid adding to
   long-lived emitters per request. Do not "fix" the `MaxListenersExceededWarning` by raising the limit.
3. *Timers:* keep the handle, `clearInterval`/`clearTimeout` on completion, `unref()` background timers.
4. *Closures:* do not capture whole requests/arrays; copy only the fields needed (`const id = payload.id` before
   creating the callback), and drop references when done.
5. *Resources:* use `pipeline`, `try/finally`, timeouts (`AbortSignal.timeout`), pool release in `finally`, and
   concurrency limits.
6. *Per-request data:* keep request state in local variables or `AsyncLocalStorage`, never in module-level collections.

**WeakMap: attach data without keeping the key alive**

```js
// weak.js
const meta = new WeakMap();                    // keys held weakly: entry disappears when the key object is unreachable
function track(obj) { meta.set(obj, { seenAt: Date.now() }); }

let user = { id: 1 };
track(user);
console.log(meta.has(user));                   // true
user = null;                                   // no other references: the object AND its WeakMap entry can be collected
```

`WeakRef` and `FinalizationRegistry` `[ADVANCED]` allow weak caches and cleanup callbacks, but when (or whether)
they fire is not deterministic. Do not build program logic on them; interviewers mostly want you to know that
`WeakMap`/`WeakSet` do not prevent collection of their keys and cannot be iterated or sized.

**Why it matters**

Leaks cause the dreaded "works for a week then crashes" failure. Showing a structured leak investigation process is
one of the strongest signals of production experience.

**Frontend connection**

Same patterns as React/SPA leaks: listeners added in `useEffect` without cleanup, `setInterval` without clear,
closures capturing large state, global caches. The cleanup-function discipline (`return () => ...` in `useEffect`) is
exactly the discipline needed on the server, except the server never reloads, so the leak accumulates for weeks.

**Real-world scenario**

A chat/notification service attaches `socket.on('message')` plus a `redisSubscriber.on('message')` for each client
connection, and removes only the socket listener on disconnect. After a week, 200k stale subscriber listeners
(and the closures with user data) sit in memory; Node prints `MaxListenersExceededWarning` daily; the team
raises the limit to hide it; the pod finally dies from heap exhaustion. Correct fix: remove (or register once and
route by user id) on disconnect.

**Interview answer:**

"A memory leak in Node.js is memory that is no longer needed but is still reachable, so the garbage collector cannot
free it, and total usage keeps growing after full garbage collections. Typical causes are unbounded in-memory caches,
event listeners added per request and never removed, timers that are never cleared, closures that capture large
objects, unreleased resources such as unclosed streams and unbounded queues, and per-request data stored in global
structures. The fix is to bound and expire caches, clean up listeners and timers in finally blocks or on close,
and keep request state local."

**Follow-up questions**

1. *How do you tell a leak from a large but stable heap?* Watch memory after full GCs over time and under steady
   load. A leak shows a rising baseline; a stable heap flattens.
2. *Do closures cause leaks?* Not by themselves. A closure keeps what it references alive; if the closure lives
   too long (stored globally), what it captured lives too.
3. *Is `MaxListenersExceededWarning` always a leak?* It is a heuristic: it flags potential leaks. Sometimes
   many listeners are legitimate (then call `setMaxListeners`), but investigate first.
4. *Why use WeakMap?* To associate metadata with an object without extending its lifetime.
5. *Can in-memory caching be a leak?* Yes, if unbounded or without eviction. Always set size or TTL limits.
6. *Can the heap be flat while memory leaks?* Yes: Buffer/native/external leaks appear in `rss` and `external`
   but not `heapUsed`.

**Common mistakes**

- Declaring "memory leak" because `rss` is high right after a spike.
- Raising `--max-old-space-size` or the listener limit instead of finding the cause.
- Using `process.on('uncaughtException')` to continue running a process that is already leaking.
- Caching per-user data in a module-level Map "temporarily".
- Not clearing timers on connection close.

**Revision notes**

- Leak = reachable but unused, baseline after full GC keeps rising. Sawtooth is normal.
- Six patterns: unbounded cache, listeners, timers, closures, unreleased resources, per-request global state.
- Fix with bounds, cleanup, local state. WeakMap for metadata. Do not hide warnings.

---

### 6.4 Diagnosing a leak and an OOM in practice [ESSENTIAL]

**Concept**

Leak ka debugging **systematic** hona chahiye: pehle confirm karo ki leak hai, phir reproduce karo, phir heap snapshots ko
compare karke dekho kaun si object type badh rahi hai aur kaun usse pakde hue hai (retainer path).

**Step-by-step process**

1. **Confirm and characterise.** Record `rss`, `heapUsed`, `external`, `arrayBuffers` every 10-60 seconds (log or
   export as metrics). Check whether the low points (after major GC) trend upward, and whether the growth correlates
   with traffic. Which metric grows tells you where to look: `heapUsed` (JS objects) vs `external`/`arrayBuffers`
   (Buffers/native).
2. **Reproduce** in a non-production environment with realistic load (autocannon, k6) and a lowered limit
   (`--max-old-space-size=128`) so it fails faster.
3. **Heap snapshots (three-snapshot technique).**
   - Start with `node --inspect app.js`; open `chrome://inspect`, "inspect", **Memory** tab.
   - Take Snapshot 1 after warm-up (the app has initialised and handled some traffic).
   - Apply a batch of load (for example 10,000 requests of the suspicious endpoint). Take Snapshot 2.
   - Apply the same batch again. Take Snapshot 3.
   - In snapshot 3 choose "Objects allocated between Snapshot 1 and Snapshot 2" or use **Comparison** view. Objects
     that grow by the same amount in each step (count of `Object`, `Array`, closures `(closure)`, `Promise`,
     `Map` entries, or a specific class such as `OrderPayload`) are your leak.
   - Click an instance and read the **Retainers** panel: it shows the reference path from a GC root (for example
     `global -> Map -> entries -> your object`). That path is the bug.
4. **Fix, rerun the same load, verify** the post-GC baseline is flat.

**Taking snapshots from a running server** (no DevTools attached)

```js
// snapshot_on_signal.js
import v8 from 'node:v8';

process.on('SIGUSR2', () => {                   // Linux/macOS; Windows has no SIGUSR2
  const file = v8.writeHeapSnapshot();          // writes Heap.<date>.<pid>...heapsnapshot in the cwd
  console.log('heap snapshot written to', file);
});
```

Or without code: `node --heapsnapshot-signal=SIGUSR2 app.js` then `kill -USR2 <pid>`, and
`--heapsnapshot-near-heap-limit=1` to capture a snapshot automatically shortly before an out-of-memory crash. Load the
`.heapsnapshot` file into Chrome DevTools -> Memory -> Load.

Cautions: writing a snapshot **pauses the process** (seconds for big heaps) and can need substantial extra memory
(on the order of the heap size or more), which can itself trigger an OOM kill in a tight container. Do it on one
instance taken out of the load balancer rotation, or reproduce elsewhere.

**Other tools worth naming:** `node --heap-prof` (sampling allocation profile), Chrome's "Allocation sampling" /
"Allocation instrumentation on timeline", `clinic heapprofiler`, `process.report.writeReport()`
(diagnostic report), APM agents (Datadog, New Relic) with heap metrics, `memwatch`-style libraries (use with
care).

**Reading the two fatal OOM situations**

```
V8 heap limit reached (from a lab run with --max-old-space-size=64):

<--- Last few GCs --->
[...] 632 ms: Mark-Compact 63.7 (96.8) -> 63.7 (96.5) MB, 9.40 / 0.00 ms ... allocation failure; scavenge might not succeed
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

- Diagnosis: the last Mark-Compact lines show the heap not shrinking. This is a **V8** limit; raise only if
  the working set is legitimately larger; otherwise find the leak.
- **Container OOM kill:** the process vanishes, `docker inspect` shows `OOMKilled: true`, Kubernetes shows
  `Reason: OOMKilled`, exit code 137, nothing in Node logs. Check `rss`, `external` and `arrayBuffers`, not only the
  heap.

**Memory-efficient habits that prevent most problems**

- Stream large data (Day 4/5); paginate DB queries; avoid `SELECT *` into giant arrays.
- Bound all in-memory structures: caches (size + TTL), queues, retry buffers, in-flight request counts.
- Do not retain `req`/`res` beyond the request. Use `AsyncLocalStorage` for request context.
- Add timeouts to outbound calls (a hung upstream call holds buffers and closures indefinitely).
- Prefer `Map`/`Set` for dynamic keys over objects used as dictionaries with unbounded keys.
- For worker threads use `resourceLimits` (`maxOldGenerationSizeMb`) to contain a runaway task.
- Keep an eye on string concatenation of huge payloads and on `JSON.stringify` of big objects.
- Alert on rising post-GC baseline and on GC pause durations.

**Why it matters**

Interviewers ask: "Your Node service's memory keeps growing. What do you do?" A structured answer (confirm, reproduce,
snapshot diff, retainer path, fix, verify) is what separates experienced engineers.

**Frontend connection**

You already use the Chrome DevTools Memory tab with snapshots and comparison for SPA leaks. For Node you simply attach
the same DevTools to the server process (`--inspect`), or load a snapshot file.

**Real-world scenario**

After a release, an order API's memory rises about 50 MB per hour and the pod restarts nightly. Snapshot comparison
shows 120k extra `ReadStream` objects retained by an array named `openStreams`, added by a new "download invoice"
feature that never removed streams on client abort. The fix replaces manual piping with `pipeline` and removes the
array. Verified by flat post-GC baseline under the same load test.

**Interview answer:**

"First I confirm it is a leak by tracking memory after full garbage collections over time under steady load, and I check
which metric grows: heapUsed for JavaScript objects or rss, external and arrayBuffers for Buffers and native memory.
Then I reproduce it with a load test and a smaller heap limit, take heap snapshots with Chrome DevTools or
`v8.writeHeapSnapshot`, compare snapshots to see which object types keep growing, and use the retainers panel to find
the reference chain from a GC root. I fix the retention, for example by bounding a cache or removing a listener, and
repeat the same load test to confirm that the baseline is flat. In production I would monitor heap, rss and GC
pause metrics and alert on a rising baseline."

**Follow-up questions**

1. *What is a retainer?* The chain of references from a GC root to an object, showing why it cannot be collected.
2. *What is the difference between shallow size and retained size?* Shallow = the object's own memory; retained = the
   memory that would be freed if that object were collected (including objects only it holds).
3. *Why can taking a heap snapshot in production be dangerous?* It pauses the process and needs lots of memory.
4. *How do you find a native/Buffer leak?* Track `external` and `arrayBuffers`; look for Buffer retention in code
   (queues, maps), use `--heap-prof`/native tooling; heap snapshots show ArrayBuffer wrappers but not native
   allocations.
5. *Does restarting the process fix a leak?* It resets symptoms; schedule restarts as a stopgap, not a fix.
6. *What if heapUsed is flat but the container is OOMKilled?* Native/Buffer memory, too many threads/sockets, or
   a heap limit set equal to the container limit.

**Common mistakes**

- Starting with a snapshot before confirming a leak exists.
- Comparing snapshots without warm-up (initialisation noise).
- Forgetting that DevTools itself holds objects, and that triggering GC before the snapshot is needed (DevTools does
  it by default when you take the snapshot).
- "Fixing" by increasing memory or restarting nightly forever.

**Revision notes**

- Confirm (post-GC baseline) -> reproduce -> snapshots (1,2,3) -> compare -> retainers -> fix -> verify.
- `v8.writeHeapSnapshot`, `--heapsnapshot-signal`, `--heapsnapshot-near-heap-limit`, `--inspect`, `--heap-prof`.
- Heap OOM (V8 message) vs container OOMKilled (137). Look at rss/external too.

---

### Day 6 wrap-up

**Key concepts to remember**

- Process memory = V8 heap + native (Buffers) + stacks + code. `heapUsed` misses Buffers.
- GC frees what is unreachable. Generational: scavenge (young, fast) and mark-sweep-compact (old, incremental).
- A leak = growing post-GC baseline due to unwanted retention; sawtooth is normal.
- Six common causes: unbounded cache, listeners, timers, closures, unreleased resources, per-request global state.
- Diagnose: metrics -> reproduce -> snapshot comparison -> retainer path -> fix -> verify.
- Heap OOM (V8, fatal message) vs container OOM kill (137). Set heap limit below container limit.

**Five revision questions**

1. What is the difference between `heapUsed`, `external` and `rss`? Which one grows when you allocate a 200 MB Buffer?
2. How does V8 decide an object can be freed? Why are circular references not a problem?
3. List six common causes of memory leaks in a Node.js backend and one fix each.
4. How do you distinguish a leak from a normal sawtooth or a large stable heap?
5. Walk through the investigation of a leak using heap snapshots, including what the retainers panel shows.

**One practical coding task**

Write a tiny Express-free HTTP server (`node:http`) with these routes: `/leak` (pushes a 10 KB object into a module-level
array), `/ok` (does the same work but with local variables only), and `/stats` (returns `process.memoryUsage()` after
calling `gc()`, requires `--expose-gc`). Use `autocannon` (`npx autocannon -c 20 -d 15 http://localhost:3000/leak`)
against each route and record the post-GC `heapUsed` before and after. Then take two heap snapshots in Chrome DevTools
around the `/leak` load, and find the retainer path of the leaked objects. Finally replace the array with a bounded
LRU and show the baseline becomes flat.

**Self-assessment checklist**

- [ ] I ran every scenario in `leak_lab.js` and understand why the "fixed" ones are flat.
- [ ] I can explain why `heapUsed` can stay flat while `rss` explodes.
- [ ] I can draw the generational heap and explain promotion.
- [ ] I can read a `--trace-gc` line.
- [ ] I know the difference between V8's OOM message and a container OOMKilled.
- [ ] I can describe the three-snapshot technique from memory.

---

## Day 7 - Revision and weekly test

**Time plan (about 2 hours)**

| Minutes | Activity |
|---------|----------|
| 25 | Spaced revision: re-read the "Revision notes" of Days 1-6 (do not re-read the full notes) |
| 10 | Say the five "Interview answer" blocks aloud: event loop, thread pool vs OS I/O, streams/backpressure, EventEmitter, memory leaks |
| 35 | Integrated lab: `week2_lab.js` (below) |
| 40 | Weekly assessment (closed notes, timed), then check answers |
| 10 | Weak-area marking and plan for next week |

**Learning objectives**

1. Consolidate Week 2 into one mental model: JS thread + event loop + (OS polling | thread pool | workers) + memory.
2. Prove the model with an integrated lab (blocking vs worker, streaming export, loop-delay and memory metrics).
3. Take the weekly test under exam conditions and identify weak areas honestly.
4. Prepare the Week 3 handover: you will now build HTTP/Express on top of this runtime knowledge.

---

### 7.1 Spaced revision schedule for Week 2 topics

Use after each study day. Items are short (10-15 minutes per session): re-read revision notes, answer the day's five
questions aloud without notes, redo one code example from memory.

| Topic (study day) | +1 day | +3 days | +7 days |
|---|---|---|---|
| Node vs browser, V8, libuv, architecture (Day 1) | Day 2 | Day 4 | Week 3 Day 1 |
| Event loop phases, who-does-the-work table, thread pool (Day 2) | Day 3 | Day 5 | Week 3 Day 2 |
| Worker threads, CJS vs ESM, process, Buffer, env (Day 3) | Day 4 | Day 6 | Week 3 Day 3 |
| fs and streams (Day 4) | Day 5 | Day 7 | Week 3 Day 4 |
| Backpressure, pipeline, EventEmitter (Day 5) | Day 6 | Week 3 Day 1 | Week 3 Day 5 |
| Memory, GC, leaks (Day 6) | Day 7 | Week 3 Day 2 | Week 3 Day 6 |

"Week 3 Day N" sessions are 10-15 minute warm-ups at the start of that day's study, not new study days. The overall
spaced-revision plan lives in `00_Master_Strategy_Schedule.md`; this table is the Week 2 slice of it.

Highest-priority items to revisit (most frequently asked): the event loop phases and ordering, the OS vs thread pool vs
main thread table, backpressure, EventEmitter's synchronous behaviour and `error` rule, and the leak investigation process.

---

### 7.2 Integrated lab: a mini "ops" server using everything from Week 2

Goal: one file that demonstrates (1) event-loop blocking vs worker offload, (2) streaming a large gzip CSV with
backpressure, (3) loop-delay and memory metrics, (4) graceful shutdown.

```js
// week2_lab.js   run: node week2_lab.js     (set PORT=3120 to change the port)
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }

if (!isMainThread) {
  // ---- worker side: compute and report ----
  parentPort.postMessage(fib(workerData.n));
} else {
  const PORT = Number(process.env.PORT ?? 3000);
  const loopDelay = monitorEventLoopDelay({ resolution: 10 });
  loopDelay.enable();

  // lab only: one worker per call. In production use a pool (Day 3) or a library such as Piscina.
  const runInWorker = (n) => new Promise((resolve, reject) => {
    const w = new Worker(import.meta.filename, { workerData: { n } });
    w.once('message', resolve);
    w.once('error', reject);
  });

  async function* csvRows(total) {
    yield 'id,name,amount\n';
    for (let i = 1; i <= total; i++) yield `${i},user${i},${(i % 997) + 0.5}\n`;
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/stats') {
        const m = process.memoryUsage();
        const body = {
          uptimeSeconds: Math.round(process.uptime()),
          loopDelayMs: {
            mean: +(loopDelay.mean / 1e6).toFixed(1),
            p99: +(loopDelay.percentile(99) / 1e6).toFixed(1),
            max: +(loopDelay.max / 1e6).toFixed(1),
          },
          memoryMB: {
            rss: +(m.rss / 1048576).toFixed(1),
            heapUsed: +(m.heapUsed / 1048576).toFixed(1),
            external: +(m.external / 1048576).toFixed(1),
          },
        };
        loopDelay.reset();
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(body));
      } else if (url.pathname === '/export') {
        const rows = Math.min(Number(url.searchParams.get('rows') ?? 1000), 5_000_000);   // cap input
        const gzip = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
        res.writeHead(200, { 'content-type': 'text/csv', ...(gzip && { 'content-encoding': 'gzip' }) });
        const source = Readable.from(csvRows(rows));
        await (gzip ? pipeline(source, createGzip(), res) : pipeline(source, res));
      } else if (url.pathname === '/cpu-blocking') {
        const n = Number(url.searchParams.get('n') ?? 38);
        res.writeHead(200).end(String(fib(n)));                    // BLOCKS the event loop for everyone
      } else if (url.pathname === '/cpu') {
        const n = Number(url.searchParams.get('n') ?? 38);
        res.writeHead(200).end(String(await runInWorker(n)));      // main thread stays free
      } else {
        res.writeHead(404).end('not found');
      }
    } catch (err) {
      console.error('request failed:', err.message);
      if (!res.headersSent) res.writeHead(500).end('internal error');
      else res.destroy(err);
    }
  });

  server.listen(PORT, () => console.log(`lab server on http://localhost:${PORT}`));

  function shutdown(signal) {
    console.log(`${signal}: shutting down`);
    server.close(() => process.exit(0));          // stop accepting; wait for in-flight requests
    server.closeIdleConnections();
    setTimeout(() => process.exit(1), 5000).unref();   // hard deadline
  }
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
```

Client script to run in a second terminal (it measures `/stats` latency while the CPU endpoint is busy):

```js
// lab_client.js   run: node lab_client.js   (adjust the port to match the server)
const base = 'http://127.0.0.1:3120';
const stats = async () => (await fetch(base + '/stats')).json();
const probe = async () => {                       // latency of a trivial request, sent 50 ms into the CPU work
  await new Promise((r) => setTimeout(r, 50));
  const t = performance.now();
  await fetch(base + '/stats');
  return Math.round(performance.now() - t);
};

await stats();
const [blockResult, blockProbe] = await Promise.all([fetch(base + '/cpu-blocking?n=40').then((r) => r.text()), probe()]);
console.log('blocking: fib =', blockResult, '| /stats latency during the computation =', blockProbe, 'ms');

const [workerResult, workerProbe] = await Promise.all([fetch(base + '/cpu?n=40').then((r) => r.text()), probe()]);
console.log('worker  : fib =', workerResult, '| /stats latency during the computation =', workerProbe, 'ms');

const exportRes = await fetch(base + '/export?rows=300000');          // fetch sends Accept-Encoding: gzip
console.log('export bytes after auto-decompress:', (await exportRes.arrayBuffer()).byteLength,
  '| content-encoding:', exportRes.headers.get('content-encoding'));
console.log(JSON.stringify(await stats()));
```

Observed results (your numbers will differ, the pattern should match):

```
blocking: fib = 102334155 | /stats latency during the computation = 1034 ms
worker  : fib = 102334155 | /stats latency during the computation = 2 ms
export bytes after auto-decompress: 6944697 | content-encoding: gzip
{"uptimeSeconds":11,"loopDelayMs":{"mean":10.1,"p99":12.2,"max":26.3},"memoryMB":{"rss":78.9,"heapUsed":10.7,"external":2.2}}
```

What to notice and write down:

1. `/stats` took over 1 second while `/cpu-blocking` ran (event loop blocked), but about 2 ms while the worker ran.
2. The export streamed 300,000 rows through gzip using `pipeline`; heap stayed around 10 MB.
3. `loopDelayMs` values come from a histogram that only records when its timer fires. Right after a long block the
   first read can look empty; read `/stats` twice or rely on request latency. This is a measurement subtlety worth
   knowing.
4. Extensions (do at least one): add a `/hash` endpoint that runs `pbkdf2` async 8 times and check `/stats` and
   `fs`-based endpoint latency with and without `UV_THREADPOOL_SIZE=8`; add a `/leak` endpoint and find it with
   snapshots; run with `curl --limit-rate 100k` against `/export?rows=2000000` and watch memory stay flat.

---

### 7.3 Common interviewer follow-up chains for Week 2 (practice aloud)

Interviewers rarely ask one question. Rehearse these chains until each step has a 20-30 second answer:

1. "What is Node?" -> "Single-threaded?" -> "Then how does it handle 10k connections?" -> "What does libuv do?" -> "Does
   file reading use the same mechanism as sockets?" -> "What if the thread pool is full?"
2. "Explain the event loop" -> "Where do promises run?" -> "setImmediate vs setTimeout 0?" -> "How do you detect blocking?"
   -> "How do you fix it?"
3. "How do you read a large file?" -> "What is backpressure?" -> "pipe vs pipeline?" -> "How do you handle a client that
   disconnects mid-download?" -> "How do you limit upload size?"
4. "What is EventEmitter?" -> "Is emit async?" -> "What if a listener throws?" -> "What is the error event rule?" -> "When
   is it the wrong tool?"
5. "Your Node service's memory keeps growing" -> "How do you confirm a leak?" -> "Which tool?" -> "What would you look
   for in the snapshot?" -> "Heap flat but container killed?"
6. "CommonJS vs ESM" -> "Why no `__dirname`?" -> "Can you require an ES module?" -> "What is a live binding?"

---

### Day 7 wrap-up

**Key concepts to remember**

- One JS thread; the process has other threads. Callbacks run on the main thread, never on pool threads.
- Sockets: OS polling (epoll/kqueue/IOCP). fs, `dns.lookup`, async crypto/zlib: thread pool (default 4, FIFO, shared).
  Sync APIs, JSON, regex, pure JS: main thread. Timers and promises: loop/queues only.
- Event loop: timers -> pending -> idle/prepare -> poll -> check -> close; nextTick then microtasks between callbacks.
- Workers for CPU-bound JS (pool, message passing); cluster/containers for cores; child_process for other programs.
- CJS vs ESM differences and version-dependent interop. `process` (exitCode, signals, env as strings). Buffer off-heap.
- Streams + backpressure + `pipeline`. EventEmitter: synchronous, `error` special, async listeners not awaited.
- Memory: heapUsed vs rss/external, generational GC, leak = rising post-GC baseline, investigate with snapshots.

**Five revision questions**

1. A teammate says "every async function in Node runs on the thread pool." Correct them using three concrete counter-examples.
2. Why can `await` not fix a slow synchronous loop? What actually fixes it?
3. Explain `write()` returning `false`, `drain`, and what `pipeline` does for you.
4. Explain why `emit` is synchronous and what that implies for listeners that do slow or failing work.
5. Describe your leak investigation steps, including how you would tell a heap leak from a Buffer leak.

**One practical coding task**

Take `week2_lab.js`, add a `/hash` endpoint (async `pbkdf2`, 300000 iterations), a `/readfile` endpoint (reads the script
file with `fs.promises.readFile`), and a `/hostlookup` endpoint (`dns.promises.lookup('localhost')`). Write a client that
fires 8 concurrent `/hash` calls and measures `/readfile`, `/hostlookup` and `/stats` latency at the same time. Record
results for `UV_THREADPOOL_SIZE=4` and `8`, and explain each number in two sentences using the Day 2 table.

**Self-assessment checklist**

- [ ] I completed the lab and wrote down the three observations.
- [ ] I did the weekly test closed-book and scored it honestly.
- [ ] I marked every missed question with its Day number (see weak-area guidance).
- [ ] I can deliver each of the five core interview answers in under 90 seconds.
- [ ] I know which two topics I will re-read before Week 3.

---

## Week 2 Revision Summary

**Runtime and architecture**

| Concept | One-line memory hook |
|---|---|
| Node.js | Runtime = V8 + libuv + core APIs. Not a language, not a framework. |
| V8 | Runs JS: parse -> Ignition -> JIT (TurboFan), heap + GC, stack, microtasks. No I/O, no timers. |
| libuv | Event loop + OS polling (sockets) + thread pool (blocking work) + timers + handles/requests. |
| "Single-threaded" | JS runs on one thread; the process also has V8 helper threads, pool threads, optional workers. |
| Layers | App -> core JS -> C++ bindings -> V8 + libuv (+ OpenSSL, llhttp, c-ares, zlib) -> OS. |

**Event loop**

```
timers -> pending callbacks -> idle/prepare -> poll -> check (setImmediate) -> close callbacks -> (repeat)
after EVERY callback: process.nextTick queue, then promise microtasks
CJS top level: sync, nextTick, promises.   ESM top level: sync, promises, nextTick.
Inside an I/O callback: setImmediate always before setTimeout 0.
```

**Who does the work**

| Mechanism | Operations |
|---|---|
| OS polling via loop (epoll/kqueue/IOCP) | TCP/HTTP/HTTPS/TLS sockets, UDP, pipes, child stdio, TTY, signals, `dns.resolve*` |
| Loop only | Timers, `setImmediate`, nextTick, promises, EventEmitter |
| libuv thread pool (4, FIFO, shared) | Async `fs`, `dns.lookup`, async `pbkdf2/scrypt/randomBytes/generateKeyPair`, async zlib, native bcrypt |
| Main thread (blocks) | `*Sync`, `JSON.parse/stringify`, regex, loops, `createHash`, `bcryptjs`, TLS CPU work |
| Separate process/thread | `child_process`, `worker_threads`, cluster; `fs.watch` via kernel notifications |

**Modules, process, Buffer, env**

- CJS: sync `require`, wrapper function, cached singleton. ESM: static, async, live bindings, strict, top-level await, no `__dirname`.
  `require(esm)`: Node 22.12+ and 20.19+, no top-level await; older versions throw `ERR_REQUIRE_ESM`.
- `process`: argv, env (strings), cwd, exitCode vs exit, SIGTERM handling, `uncaughtException` (log + exit),
  unhandled rejection throws since Node 15.
- Buffer: `Uint8Array` subclass, off-heap, bytes not characters, `alloc` safe / `allocUnsafe` fast and dirty, `subarray` shares.
- Env: strings, validate at startup, `--env-file`, never commit `.env`, secrets in a secret manager.

**fs and streams**

- `fs/promises` in app code; sync only at startup; `readFile` = whole file in memory; atomic write via temp + rename;
  defend against path traversal.
- Streams: Readable/Writable/Duplex/Transform; chunk boundaries are arbitrary; `highWaterMark` (Node 22 byte default
  64 KiB, earlier 16 KiB, objects 16); `for await` + `pipeline`; always handle `error`.
- Backpressure: `write()` false -> wait for `drain`; `pipeline` automates it and cleans up on errors.
- EventEmitter: synchronous, ordered, `error` throws if unhandled, async listeners not awaited, >10 listeners warns;
  not durable.

**Memory**

- `rss` = whole process; `heapUsed` = JS objects; `external`/`arrayBuffers` = Buffers/native.
- GC: reachability from roots; scavenge (young) + mark-sweep-compact (old, incremental/concurrent).
- Leak = rising baseline after full GC. Six causes: unbounded cache, listeners, timers, closures, unreleased resources,
  per-request global state.
- Investigate: metrics -> reproduce -> snapshots 1/2/3 -> retainers -> fix -> verify. Heap OOM vs container OOMKilled (137).

---

## Week 2 Assessment

Closed-book, about 60 minutes. Mark each question as you go; answers follow. Marks: Basic 1 each (10), Intermediate 2 each
(24), Advanced 3 each (24), Code 2 each (6). Total 64.

### Section A - Basic (10 questions, 1 mark each)

**B1.** What is Node.js? Is it a programming language or a framework?

**B2.** State in one sentence each what V8 does and what libuv does.

**B3.** What is the default size of libuv's thread pool and how do you change it?

**B4.** Name three operations that run on the thread pool and three that do not.

**B5.** Give three differences between CommonJS and ES modules.

**B6.** What is a Buffer, and why can `buf.length` differ from `str.length`?

**B7.** What type are `process.env` values, and what is the practical consequence?

**B8.** Name the four stream types and one example of each.

**B9.** What does `writable.write(chunk)` returning `false` mean?

**B10.** What happens if code calls `emitter.emit('error', err)` and no `error` listener exists?

### Section B - Intermediate (12 questions, 2 marks each)

**I1.** Predict the output (CommonJS file):

```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('tick'));
Promise.resolve().then(() => console.log('promise'));
console.log('sync');
```

(Which lines are guaranteed in order, and which are not?)

**I2.** Why does `setImmediate` always run before `setTimeout(fn, 0)` when both are scheduled inside an I/O callback?

**I3.** The thread pool is fully busy with long `pbkdf2` jobs. Which of these are delayed: (a) `fs.readFile`, (b) a request
to `http://127.0.0.1:3000` from the same process, (c) a request to `http://api.example.com`, (d) `setTimeout(fn, 10)`,
(e) `JSON.parse`? Explain each.

**I4.** Choose worker_threads, child_process, or cluster for: (a) resizing images inside an API, (b) running ffmpeg,
(c) using all cores for an Express app. Justify each.

**I5.** Why is `pipeline` preferred over `pipe`? Give a concrete failure with `pipe`.

**I6.** Why does `await` not make a CPU-bound function non-blocking? How do you actually fix it?

**I7.** Why is `body += chunk` risky when chunks are Buffers with non-ASCII text? What are two correct approaches?

**I8.** What is the difference between `process.exit(1)` and `process.exitCode = 1`? What is the recommended reaction to an
`uncaughtException`?

**I9.** Show how `path.join(base, userInput)` can be exploited, and write a safe check.

**I10.** Explain `rss`, `heapUsed` and `external`. Which grows when you allocate a 100 MB Buffer?

**I11.** What happens when an `async` listener attached with `emitter.on` throws or rejects? How do you handle it?

**I12.** How would you count the lines of a 5 GB log file in Node.js with constant memory?

### Section C - Advanced (8 questions, 3 marks each)

**A1.** Trace precisely what happens, layer by layer, when your code calls `fs.readFile`, and where the callback runs.

**A2.** A service's outbound HTTP calls to `payments.example.com` become slow during a burst of login requests, though
sockets and CPU look fine. Explain why this can happen, how to verify it, and three mitigations.

**A3.** Explain how a CommonJS file can use an ES-module-only package on (a) Node 18, (b) Node 20 before 20.19, (c) Node 22.12+.

**A4.** Describe V8's generational garbage collection and explain why a large long-lived in-memory cache can hurt latency.

**A5.** Design a `GET /export.csv` endpoint that returns 5 million rows from a database to slow clients without exhausting
memory. Name the components, the failure modes and how each is handled.

**A6.** `heapUsed` is flat at 60 MB but rss grows by 5 MB/hour until the container is OOM killed (exit 137). List likely
causes and your investigation steps.

**A7.** Explain why the same top-level script prints promise output before `nextTick` output in an ES module but after it in
CommonJS. Why should production code not depend on it?

**A8.** Implement `mapLimit(items, limit, asyncFn)` that runs at most `limit` async operations at once, preserves result
order, and rejects on the first error. Explain which Node resource problems it prevents.

### Section D - Code reading (3 questions, 2 marks each)

**C1.** Predict the exact output (ES module):

```js
import { readFile } from 'node:fs';
readFile(import.meta.filename, () => {
  console.log('1 read');
  setTimeout(() => console.log('2 timeout'), 0);
  setImmediate(() => { console.log('3 immediate'); process.nextTick(() => console.log('4 tick in immediate')); });
  Promise.resolve().then(() => console.log('5 promise'));
  process.nextTick(() => console.log('6 tick'));
});
```

**C2.** Find the problem(s) and fix:

```js
import { createWriteStream } from 'node:fs';
const out = createWriteStream('lines.txt');
for (let i = 0; i < 1e7; i++) out.write(`line ${i}\n`);
out.end();
```

**C3.** This service leaks. Find at least three leak sources and fix them:

```js
import { createServer } from 'node:http';
import { EventEmitter } from 'node:events';

const bus = new EventEmitter();
const inflight = new Map();
const history = [];

createServer((req, res) => {
  const id = Math.random().toString(36).slice(2);
  inflight.set(id, { req, res, startedAt: Date.now() });
  history.push({ id, url: req.url, headers: req.headers });
  const timer = setInterval(() => bus.emit('tick', id), 1000);
  bus.on('tick', (tickId) => { if (tickId === id) res.write('.'); });
  res.on('close', () => console.log('closed', id));
}).listen(3000);
```

---

## Week 2 Answers with Explanations

### Section A - Basic

**B1.** Node.js is a JavaScript **runtime** (environment), not a language and not a framework. It embeds V8 to run JS and
adds libuv (event loop, async I/O, thread pool) and APIs such as `fs`, `http`, `net`, `process`.
*Explanation:* the language is ECMAScript; the runtime supplies the host APIs. Express is a framework built on Node.

**B2.** V8 parses, compiles (JIT) and executes JavaScript and manages the heap and garbage collector. libuv runs the
event loop and provides asynchronous I/O (OS polling for sockets, thread pool for blocking work) and timers.

**B3.** 4 threads. Change with the `UV_THREADPOOL_SIZE` environment variable (maximum 1024) set when launching the process,
before the pool is first used.

**B4.** On the pool: async `fs` calls, `dns.lookup`, async `crypto.pbkdf2/scrypt/randomBytes`, async zlib. Not on the pool:
TCP/HTTP sockets, timers, `child_process` pipes, signals, promises, `EventEmitter`.
*Explanation:* sockets use OS polling; timers use the loop's timer heap.

**B5.** Any three of: `require` is synchronous and dynamic, `import` is static and asynchronous; ESM supports top-level await;
ESM has live bindings, CJS exports are values on an object; ESM is always strict; `__dirname`/`__filename`/`require` do not
exist in ESM; ESM needs file extensions for relative imports; selected via `type` in package.json or `.mjs/.cjs`.

**B6.** A Buffer is a fixed-size chunk of raw bytes (a `Uint8Array` subclass) stored outside the V8 heap. `buf.length` counts
bytes; `str.length` counts UTF-16 code units; for non-ASCII text (e.g. the rupee sign is 3 bytes in UTF-8, one code unit) they
differ.

**B7.** Always strings (or `undefined`). Numbers/booleans must be parsed (`Number(process.env.PORT)`); `'false'` is truthy;
assigning `undefined` stores the string `'undefined'`.

**B8.** Readable (`fs.createReadStream`, HTTP request), Writable (`fs.createWriteStream`, HTTP response), Duplex (`net.Socket`),
Transform (`zlib.createGzip`).

**B9.** The internal buffer reached `highWaterMark`: the chunk **was accepted and buffered**, but the producer should stop
writing until the `drain` event. Ignoring it grows memory.

**B10.** Node throws the error (`emit` throws). If uncaught, the process terminates. Always attach an `error` listener on
emitters that can fail.

### Section B - Intermediate

**I1.** CommonJS: `sync` first, then `tick`, then `promise` (nextTick before promise microtasks; both guaranteed in that order).
`timeout` and `immediate` come afterwards, and their relative order from the main module is **not guaranteed** (depends on whether
1 ms has elapsed when the loop starts). *Explanation:* microtask-like queues drain before the loop; timers vs check phase race at
startup. (In an ES module the `promise` line would precede `tick`.)

**I2.** The I/O callback runs in the **poll** phase. The loop then proceeds to the **check** phase (immediates) before returning to
**timers**. So the immediate runs in the same iteration; the timer waits for the next iteration.

**I3.** (a) Delayed: fs uses the pool, queued behind pbkdf2. (b) Not delayed: a loopback TCP connection to an IP uses OS
polling and needs no DNS lookup. (c) Delayed at connect time: resolving the hostname via `dns.lookup` uses the pool (getaddrinfo), so
connection setup waits; established keep-alive connections are unaffected. (d) Not delayed by the pool: timers use the loop (they
are only delayed if the main thread is blocked). (e) Not affected by the pool: `JSON.parse` runs on the main thread (it is
affected only by being blocking itself). *Explanation:* identify the mechanism per operation.

**I4.** (a) worker_threads with a pool: CPU-bound JS, same process, low overhead, message passing (or a queue + separate worker
service if load is high). (b) child_process (`spawn`/`execFile`): it is an external program; separate process; stream its output;
pass arguments as an array to avoid injection. (c) cluster (or multiple containers/PM2): scale a server across cores with separate
processes that share a port; remember in-memory state is per process.

**I5.** `pipeline` applies backpressure, **propagates errors** from any stream and **destroys all streams**, and supports abort
signals; `pipe` does not forward errors or destroy the destination. Failure example: the source file errors midway; with `pipe` the
HTTP response/file descriptor stays open (leak, client hangs); with `pipeline` the promise rejects and everything is closed.

**I6.** `await` only yields when waiting on something asynchronous. A CPU-bound function is running, not waiting, so the thread
stays busy until it returns, blocking the loop. Fixes: move the computation to a worker thread/another service, do the aggregation
in the database, chunk the work with `setImmediate` yields, or reduce the work (algorithm, pagination).

**I7.** A multi-byte character can be split across two chunks; converting each chunk separately (`body += chunk` calls
`toString()` implicitly) produces replacement characters. Correct: collect Buffers with `Buffer.concat(chunks).toString('utf8')`,
or `readable.setEncoding('utf8')` / `StringDecoder`, which handles split characters.

**I8.** `process.exit(1)` terminates immediately and may cut off pending async work and unflushed output. `process.exitCode = 1`
sets the code but lets the loop finish naturally. For `uncaughtException`: log the error, perform a quick cleanup, exit non-zero
(the process state is unreliable) and let a supervisor restart it.

**I9.** `path.join('/srv/uploads', '../../etc/passwd')` resolves to `/etc/passwd` (escapes the base). Safe check:
`const target = path.resolve(base, input); const rel = path.relative(base, target); if (rel.startsWith('..') || path.isAbsolute(rel)) reject;`
Better: never use user-supplied names; generate server-side names and store the original name in the DB.

**I10.** `rss` = total resident memory of the process; `heapUsed` = live JS objects in the V8 heap; `external` = memory of
native objects attached to JS (including Buffers; `arrayBuffers` is the Buffer portion). Allocating a 100 MB Buffer increases
`rss` and `external`/`arrayBuffers`, not `heapUsed`.

**I11.** `emit` does not await listeners. A rejected async listener causes an **unhandled rejection**, which terminates the
process by default since Node 15. Handle with try/catch inside the listener, or construct the emitter with
`{ captureRejections: true }` so rejections are routed to the `error` event (and attach an `error` listener).

**I12.** Stream it: `for await (const line of readline.createInterface({ input: createReadStream(path), crlfDelay: Infinity })) count++`.
Memory stays at roughly one chunk. A faster variant counts `\n` bytes directly in each chunk without readline.

### Section C - Advanced

**A1.** (1) JS calls `fs.readFile`, which lives in Node's JS core library: it validates arguments and prepares a request object.
(2) A C++ binding converts it into libuv fs requests (open, fstat, read, close). (3) libuv queues each request on the **thread pool**;
a pool thread performs the blocking syscall. (4) When done, the pool thread signals the event loop (async handle). (5) In the
**poll** phase the loop runs the completion callback on the **main thread**, which enters V8 and invokes your JS callback (or
resolves the promise, whose continuation runs as a microtask). *Key points:* pool threads never run JS; the work for a large file
spans several pool round trips; the callback always runs on the main thread.

**A2.** Hostname resolution for outbound connections uses `dns.lookup` (OS `getaddrinfo`), which runs on the shared 4-thread pool.
During a login burst using native bcrypt (also on the pool), DNS lookups queue behind hashing jobs (head-of-line blocking), so
new outbound connections are delayed even though sockets and CPU on the main thread look fine. Verify: measure `dns.lookup` and
connection-time durations separately; compare with a larger `UV_THREADPOOL_SIZE`; use an IP address or `dns.resolve` in an
experiment; check pool-heavy endpoints' concurrency. Mitigations: (1) rate-limit or isolate password hashing (separate service,
worker, or limited concurrency), (2) reuse keep-alive connections/agents so lookups are rare, and cache DNS results, (3) size the pool
modestly to the core count and measure, (4) scale out instances, (5) use `dns.resolve` or a caching resolver where appropriate.

**A3.** (a) Node 18: `require()` of an ES module throws `ERR_REQUIRE_ESM`; use dynamic `import()` inside an async function, or
migrate the app to ESM, or pin a CJS-compatible version of the package. (b) Node 20 before 20.19: same as Node 18. (c) Node 22.12+ (and
20.19+): `require(esm)` works when the ES module has no top-level await (it may print an experimental warning on some versions);
the result is the module namespace object, so read `.default` or named exports from it. In all versions, the cleanest long-term
answer is moving to ESM. *Explanation:* version-dependent behaviour; always check `node -v` and the docs.

**A4.** New objects are allocated in a small young generation (two semi-spaces) collected by a fast copying **scavenge**, which
touches only live objects; survivors (after about two scavenges) are promoted to the old generation, collected by **mark-sweep-
compact** using incremental, concurrent and parallel marking to reduce pauses. A large long-lived cache sits in old space, so every
major GC must mark and possibly compact it, lengthening major GC work and pauses (visible as latency spikes and event-loop delay),
and it raises memory pressure (more frequent major GCs). Remedies: bound/evict the cache, move it to Redis, or keep less per entry.

**A5.** Components: HTTP handler -> DB cursor/stream (for example mysql2 `.stream()` or keyset-paginated batches) -> async generator or
Transform to format CSV lines -> optional `createGzip()` -> `res`, joined with `stream/promises` `pipeline`. Validate auth and
parameters before sending headers; set `Content-Type`/`Content-Disposition`; apply backpressure via `pipeline`, so a slow client
only slows its own query. Failure modes and handling: client disconnect (pipeline destroys the stream; release the DB connection in
`finally`/stream close), DB error mid-stream (headers already sent: abort the response with `res.destroy(err)` and log; client sees a
truncated file, so use a trailer/checksum or ask clients to verify row counts), connection-pool exhaustion (limit concurrent exports,
queue them), timeouts (`AbortSignal.timeout`), event-loop blocking (avoid giant sync JSON/CSV work per row batch), huge exports (move to
a background job producing a file in object storage and notify the user), memory limits (stream, never build the full array).

**A6.** Likely causes: Buffers retained (maps/queues of uploads or responses), native addon leak, too many open sockets/handles, thread
stacks (too many workers), zlib/crypto objects not closed, large `ArrayBuffer`s retained by closures or caches, heap limit set too close
to the container limit. Steps: chart `rss`, `heapUsed`, `external`, `arrayBuffers`, number of active handles
(`process.getActiveResourcesInfo()`), and open file descriptors/sockets; if `external`/`arrayBuffers` grow, inspect code that stores
Buffers and streams not destroyed; take heap snapshots to look for retained `ArrayBuffer`/`Buffer`/stream objects and their retainers; if
nothing in the heap and `rss` still grows, suspect native addons (profile with OS tools such as `pmap`, `valgrind`/heaptrack, or addon
diagnostics); set limits and metrics, then verify with a load test.

**A7.** An ES module's top-level code is evaluated as part of a promise job, so when it completes the engine is already draining the
microtask queue: promise reactions queued at top level run before Node returns to process the nextTick queue. In CommonJS the main
script runs as a plain synchronous call, and after it returns Node drains the nextTick queue first and then microtasks. Production code
should not depend on this, because it varies by module system and it is easy to break by refactoring; use explicit sequencing
(`await`) and use `nextTick` only for rare cases such as deferring an event emission.

**A8.**

```js
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let failed = false;
  async function worker() {
    while (!failed) {
      const i = next++;                      // safe: JS is single-threaded between awaits
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        failed = true;                       // stop the other workers from starting new items
        throw err;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
```

Verified: with 8 items and `limit = 3` the peak concurrency was 3, results keep input order, and a thrown error rejects the
whole call (the `failed` flag stops other workers from starting new items; operations already in flight still run to completion, so
pass an `AbortSignal` into `fn` if you need true cancellation). It prevents: file-descriptor exhaustion
(`EMFILE`) from opening 100k files at once, thread-pool flooding that starves unrelated work, DB pool exhaustion, memory blow-ups from
holding thousands of in-flight responses, and rate-limit violations on upstream APIs. Complexity: O(n) time overhead, O(n) result space.

### Section D - Code reading

**C1.** Output: `1 read`, `6 tick`, `5 promise`, `3 immediate`, `4 tick in immediate`, `2 timeout` (verified by running).
*Explanation:* inside the I/O callback, nextTick runs before promises; the immediate (check phase) runs before the timer (next
loop iteration); the nextTick scheduled inside the immediate runs right after that immediate callback, before the timer.

**C2.** Problem: the loop ignores backpressure: all 10 million lines are buffered in memory because `write()` return values are
ignored (memory spike, possible OOM), and it also monopolises the event loop for the whole loop. Also no `error` handling. Fix:

```js
import { createWriteStream } from 'node:fs';
import { once } from 'node:events';

const out = createWriteStream('lines.txt');
out.on('error', (err) => { console.error('write failed', err); process.exitCode = 1; });

for (let i = 0; i < 1e7; i++) {
  if (!out.write(`line ${i}\n`)) await once(out, 'drain');   // wait when the buffer is full
}
out.end();
await once(out, 'finish');
```

Or use `pipeline(Readable.from(generator), createWriteStream(...))`, which handles all of this and the error.

**C3.** Leaks and bugs: (1) `inflight` Map is never cleaned: entries (including `req` and `res`) accumulate forever; delete on
`res.on('close')`. (2) `history` grows without bound and retains all headers; bound it (ring buffer) or send to a logger instead.
(3) The `setInterval` timer is never cleared, so it keeps firing and keeps `id` alive after the client disconnects; call
`clearInterval(timer)` on `close`. (4) `bus.on('tick', ...)` adds a listener per request and never removes it; the closure retains
`res`; remove with `bus.off` on close (or avoid a shared bus entirely and write from the interval). (5) Writing to `res` after it
closed is also an error risk. Fixed version:

```js
createServer((req, res) => {
  const id = Math.random().toString(36).slice(2);          // use crypto.randomUUID() in real code
  const timer = setInterval(() => res.write('.'), 1000);   // no shared bus, no inflight map
  res.on('close', () => {
    clearInterval(timer);                                  // always release per-request resources
    console.log('closed', id);
  });
}).listen(3000);
```

### Scoring and interpretation

| Score (of 64) | Meaning | Action |
|---|---|---|
| 54-64 | Strong. Interview-ready on Node internals fundamentals | Move to Week 3; keep 15-minute daily recall of the five core answers |
| 42-53 | Good, with gaps | Fix weak areas (see below) in the first 30 minutes of each Week 3 day for three days |
| 30-41 | Partial | Re-do the Day notes for the weak areas before Week 3 content; use the catch-up plan |
| Below 30 | Significant gaps | Take one buffer day: redo Days 2, 4, 5 and 6 quickly, retest the missed questions, then proceed |

Do not over-fit to the score: the real test is explaining without notes. Anything you could answer only after peeking is
a gap.

---

## Weak-Area Identification Guidance

**Step 1: map every missed question to a topic and Day.**

| Missed question(s) | Topic | Re-read | Redo |
|---|---|---|---|
| B1, B2, A1 | Node/V8/libuv, layers | Day 1 (1.1-1.4), Day 2 (2.2) | Draw the layer diagram; trace `fs.readFile` aloud |
| B3, B4, I3, A2 | Thread pool vs OS polling | Day 2 (2.4, 2.5) | Rerun `pool_experiment.js` with sizes 4 and 8 |
| I1, I2, A7, C1 | Event loop order | Day 2 (2.1, 2.7, 2.8) | Predict then run `order.js`, `mixed.js`, Q1-Q5 |
| I6 | Blocking vs non-blocking | Day 2 (2.6) | Run `loop_lag.js`, `redos.js` |
| I4, A8 | Workers, cluster, concurrency | Day 3 (3.1, 3.2) | Rewrite the worker pool; implement `mapLimit` |
| B5, A3 | CJS vs ESM | Day 3 (3.3) | Create `.cjs` and `.mjs` pair; test interop |
| B7, I8 | process, env | Day 3 (3.4, 3.6) | Write config module + SIGTERM handler |
| B6, I7 | Buffer | Day 3 (3.5) | Run `buffer_demo.js` split-character demo |
| I9, I12 | fs, path, big files | Day 4 (4.1, 4.2) | Run `mem_compare.js`; implement `resolveInside` |
| B8, C-level custom streams | Stream types, Transform | Day 4 (4.2, 4.3) | Rewrite `csv_to_objects.js` from memory |
| B9, I5, C2, A5 | Backpressure, pipeline | Day 5 (5.1, 5.2) | Run `bp_demo.js` x3; `pipe_vs_pipeline.js` |
| B10, I11, C3 (listeners) | EventEmitter | Day 5 (5.3) | Implement `MiniEmitter`; run `ee_demo.js` |
| I10, A4, A6, C3 (leaks) | Memory, GC, leaks | Day 6 (all) | Run `leak_lab.js` scenarios; snapshot practice |

**Step 2: classify the type of miss.**

- *Recall miss* (you knew it, forgot a detail): add it to your own one-page cheat sheet; re-test in 3 days.
- *Understanding miss* (cannot explain why): redo the experiment for that topic, then explain it aloud to someone or record
  yourself; if you cannot teach it in 60 seconds you do not own it yet.
- *Application miss* (cannot use it in code review or design questions): re-solve C2/C3-style tasks using your own
  broken-then-fixed code.

**Step 3: pattern check.**

- Many misses in Sections A and B -> fundamentals gap: redo Days 1, 2 and 4 before anything else.
- Fine on A/B but weak on Section C/D -> depth and application gap: spend time on experiments, `leak_lab.js`, and design
  questions (A5, A6).
- Weak only on version-dependent facts (highWaterMark default, `require(esm)`, `unhandledRejection`) -> make a small
  "version facts" table and review it weekly; interviewers value knowing that behaviour changed and checking the docs.

**Step 4: keep a running "gap list"** in a file (topic, what I got wrong, the correct statement). Review it with the +1/+3/+7
day schedule. Week 8's mock interviews use these gaps.

---

## Catch-Up Plan If You Fall Behind

Week 2 is heavy (internals plus many experiments). If you lost time, **protect the essentials**: Days 2, 4, 5 and 6 carry most
interview weight. Shorten by skipping `[ADVANCED]` sections and by reading rather than writing some of the code (but still run
the key experiments: `pool_experiment.js`, `bp_demo.js`, `leak_lab.js`).

**Minimum viable Week 2 (about 8 hours)**

| Block | Time | Content | Must produce |
|---|---|---|---|
| 1 | 60 min | Day 1: 1.1, 1.3, 1.5 only; Day 2: 2.1 and 2.4 | Event-loop diagram + who-does-the-work table from memory |
| 2 | 60 min | Day 2: 2.5, 2.6 + run `pool_experiment.js`, `loop_lag.js` | Written explanation of pool starvation |
| 3 | 45 min | Day 3: 3.1 (concept), 3.3, 3.4 (graceful shutdown), 3.5 (bytes vs chars) | CJS vs ESM table; SIGTERM handler |
| 4 | 60 min | Day 4: 4.1 (promises API, path traversal), 4.2 (types, events, `for await`) | `mem_compare.js` results |
| 5 | 60 min | Day 5: 5.1 + run `bp_demo.js`, 5.2 `pipeline`, 5.3 EventEmitter rules | `MiniEmitter` from memory |
| 6 | 60 min | Day 6: 6.1, 6.3 (+ run `leak_lab.js`), 6.4 steps | Leak investigation answer, 90 seconds |
| 7 | 60 min | Weekly test, sections A and B only; answer review | Gap list |

**If you are 1 day behind:** merge Day 6 into Day 7: study 6.1-6.3 (75 min), take only Sections A-B of the test (30 min),
and do the lab as an optional Week 3 evening task.

**If you are 2 days behind:** drop Day 3's worker pool code and cluster demo (read the comparison table only), drop Day 4's custom
Readable examples, keep everything else. Move the integrated lab to a weekend slot.

**If you are 3 or more days behind:** use the Minimum viable table above over three days, shift Week 3 by one day, and compress
Week 3's Day 6 (file uploads/API docs) later using its own catch-up notes. Do not skip Day 2 (event loop) and Day 5 (backpressure,
EventEmitter): they recur in later weeks (Express middleware, streaming responses, testing and production debugging).

**Rules for catching up without burning out**

1. Never double the daily time for more than two days in a row. Fatigue lowers retention.
2. Replace re-reading with recall: close the notes, write the diagram or answer, then check.
3. Keep the +1/+3/+7 revision micro-sessions (10-15 minutes) even when behind; they are cheaper than relearning.
4. Mark skipped sections in your gap list and schedule them in the Week 8 buffer (Week 8 Day 1 covers JS + Node rapid
   revision, which is the natural place to pick them up).

**Reminder:** eight weeks will not make you an expert in every Node internals detail. For junior-to-mid roles the essentials in
this file are what you need; the `[ADVANCED]` items are bonus depth you pick up as time permits.

---

## REMAINING

Nothing remains for Week 2. All seven day blocks (Day 1 to Day 7), the weekly revision summary, the mixed-difficulty
assessment with answers, weak-area guidance, and the catch-up plan are complete in this file.
