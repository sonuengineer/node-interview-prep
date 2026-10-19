# Week 3 -- Express.js and REST APIs (Days 15-21)

> Part 03 of the Node.js Backend Interview Prep series. Spec: `prompt.md`. Layout: `_brief.md`.
> Previous: Week 2 (Node internals). Next: Week 4 (MySQL).
> Tiers: `[ESSENTIAL]` = asked in most junior/mid interviews. `[ADVANCED]` = supplementary, do it if time permits.
> Honest note: ek hafte mein Express + REST ki "working knowledge" aa jaati hai, mastery nahi. Mastery tab aati hai jab tum
> apna API break karke debug karte ho. Isliye is week ka center hai ek chhota REST API jo har din extend hota hai.

## Table of contents (this file)

- Week 3 overview and how to use this file
- The running project: Task API (seed of `12_Project_Task_API.md` Stage 1-2)
  - Final folder structure and which day adds which file
  - Setup (one time)
- Day 1 (Day 15) -- HTTP lifecycle, methods, headers, status codes, cookies, content types
- Day 2 (Day 16) -- REST principles, API design, Express setup, routes/controllers/services
- Day 3 (Day 17) -- Middleware, request validation (zod), sanitization
- Day 4 (Day 18) -- Centralized error handling, authentication middleware
- Day 5 (Day 19) -- Pagination, filtering, sorting, API versioning
- Day 6 (Day 20) -- File uploads (multer), API docs (OpenAPI), CORS, request lifecycle debugging
- Day 7 (Day 21) -- Revision, smoke test, weekly test
- Week 3 revision summary
- Week 3 assessment (Basic / Intermediate / Advanced)
- Answers with explanations
- Weak-area identification guidance
- Catch-up plan if you fall behind
- Spaced-revision schedule for Week 3 topics

---

## Week 3 overview and how to use this file

**Week goal:** Is week ke end tak tum bina tutorial dekhe ek Express 5 REST API bana sakte ho jisme routing, layered
structure, validation, centralized errors, auth middleware, pagination/filter/sort, versioning, file upload, OpenAPI docs
aur CORS ho -- aur interview mein har decision ka "kyun" explain kar sakte ho.

**Daily rhythm (about 2 hours):**

| Block | Time | What |
|-------|------|------|
| Read notes | 35-45 min | Concept, internal working, interview answers of the day |
| Build | 50-60 min | Extend the Task API with that day's code (type it, do not paste blindly) |
| Revise | 15 min | Five revision questions + question-bank category "Express.js and API design" |
| Wrap-up | 10 min | Checklist, daily log |

**How code is organised:** Har din ka code pichhle din pe build hota hai. Jahan file badalti hai, main poori updated file
dikhata hoon (taaki confusion na ho). Jahan sirf ek chhota addition hai, wahan clearly bataya hai "add this".

**Versions used:** Node.js 22 LTS (Node 20 LTS bhi chalega; jahan fark hai wahan flag kiya hai), Express 5.x, zod 4.x,
multer 2.x, ES modules everywhere (`"type": "module"`).

**Express 5 vs Express 4 (mention once, remember always):**

| Topic | Express 4 | Express 5 |
|-------|-----------|-----------|
| Async handler errors | Rejected promise NOT forwarded; need try/catch or `express-async-errors` | Rejected promise / thrown error in handler is automatically passed to `next(err)` |
| Wildcard route | `app.get('*', ...)` | Must be named: `app.get('/*splat', ...)`; optional segment `/:id{/:sub}` |
| `req.body` with no parser match | `{}` | `undefined` (so validate it!) |
| `req.query` | Writable property | Getter (read-only); cannot do `req.query = parsed` |
| Default query parser | `extended` (qs: `a[b]=1` -> nested) | `simple` (node:querystring: flat) |
| `req.param(name)` | Works | Removed (use `req.params`, `req.query`, `req.body`) |
| `res.status()` | Accepts weird values | Must be an integer 100-999 |
| `res.redirect('back')`, `res.send(status)` | Allowed | Removed / changed |
| `app.router` | Not public (internals used `app._router`) | `app.router` is a public property again |
| Minimum Node | 0.10+ | 18+ |

---

## The running project: Task API

Hum ek **Task Management API** ka seed bana rahe hain. Week 3 mein data **in-memory** rahega (ek `Map`). Week 4-5 mein
repository layer ko MySQL (`mysql2/promise`) se replace karenge -- isiliye hum "repository" layer abhi se rakh rahe hain, taaki
baaki code (controllers, services, routes) ko haath na lagana pade. Ye `12_Project_Task_API.md` ke **Stage 1** (setup +
Express skeleton) aur **Stage 2** (CRUD + validation + error handling) ka base hai.

### Resource model (Task)

```json
{
  "id": "3b0c1d2e-....",
  "title": "Write Week 3 notes",
  "description": "Cover middleware and zod",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2026-11-01T00:00:00.000Z",
  "ownerId": "user-1",
  "attachments": [],
  "createdAt": "2026-10-19T08:00:00.000Z",
  "updatedAt": "2026-10-19T08:00:00.000Z"
}
```

`status` in `todo | in_progress | done`, `priority` in `low | medium | high`.

### Final folder structure (end of Day 6)

```
task-api/
  package.json
  .env                      (not committed)
  .env.example
  .gitignore
  playground/
    http-lifecycle.js       Day 1  (raw node:http experiments, not part of the API)
  scripts/
    make-token.js           Day 4  (dev-only JWT generator)
    seed.js                 Day 5  (creates demo tasks through the API)
    smoke.js                Day 7  (end-to-end checks with fetch)
  uploads/                  Day 6  (created at runtime, git-ignored)
  src/
    server.js               Day 2  (listen + graceful close)
    app.js                  Day 2  (createApp(); changes on Days 3, 4, 6)
    config/
      env.js                Day 2  (rewritten with zod on Day 4, extended on Day 6)
    routes/
      v1/
        index.js            Day 2  (mounts feature routers; auth gate added Day 4)
        tasks.routes.js     Day 2  (changes Days 3, 4, 5, 6)
        admin.routes.js     Day 4
      v2/
        index.js            Day 5
    controllers/
      tasks.controller.js   Day 2  (changes Days 3, 4, 5, 6)
      admin.controller.js   Day 4
      attachments.controller.js  Day 6
    services/
      tasks.service.js      Day 2  (changes Days 4, 5, 6)
    repositories/
      tasks.repository.js   Day 2  (changes Days 4, 5)
    middleware/
      requestId.js          Day 3
      requestLogger.js      Day 3
      validate.js           Day 3  (changes Day 4)
      requireJson.js        Day 4
      authenticate.js       Day 4
      authorize.js          Day 4
      notFound.js           Day 4
      errorHandler.js       Day 4  (extended Day 6)
      loadTask.js           Day 6
      upload.js             Day 6
      deprecate.js          Day 5
    schemas/
      task.schema.js        Day 3  (extended Day 5, Day 6)
    errors/
      AppError.js           Day 4
    utils/
      cursor.js             Day 5
    docs/
      openapi.js            Day 6
```

### Layering rule (yaad rakho)

```
HTTP request
   |
   v
routes        -> URL + method -> list of middleware + controller (wiring only)
   |
   v
controllers   -> HTTP in/out: read validated input, call service, choose status code, shape JSON
   |
   v
services      -> business rules (ownership, defaults, state transitions). No req/res here.
   |
   v
repositories  -> data access only (Map today, MySQL from Week 4)
```

### Setup (one time, 10 minutes)

```bash
mkdir task-api && cd task-api
npm init -y
npm pkg set type=module
npm pkg set scripts.dev="node --watch --env-file=.env src/server.js"
npm pkg set scripts.start="node --env-file=.env src/server.js"
npm i express
mkdir -p src/config src/routes/v1 src/controllers src/services src/repositories src/middleware src/schemas src/errors src/utils src/docs scripts playground
```

- `node --watch` aur `--env-file` built-in hain (Node 20.6+ for `--env-file`; Node 18.11+ for `--watch`). Isliye `nodemon` aur `dotenv` ki
  zaroorat nahi -- "prefer built-ins" rule.
- Baaki packages us din install karenge jab zaroorat ho (zod Day 3, jsonwebtoken Day 4, multer/cors/swagger-ui-express Day 6).

`.gitignore`:

```
node_modules
.env
uploads
```

`.env` (Day 2 only needs these two; `.env.example` mein same keys rakho bina secrets ke):

```
PORT=3000
NODE_ENV=development
```

---

## Day 1 (Day 15) -- HTTP lifecycle, methods, headers, status codes, cookies, content types

**Time plan (about 2h)**

| Activity | Min |
|----------|-----|
| Read: lifecycle, methods, status codes | 40 |
| Read: headers, cookies, content types | 20 |
| Build: `playground/http-lifecycle.js` + curl experiments | 45 |
| Revision questions + wrap-up | 15 |

**Learning objectives**

- Ek request ke browser se server tak aur wapas aane ke har step ko explain kar sako (DNS, TCP, TLS, HTTP, server, response).
- Safe aur idempotent methods ka fark, aur kaunsi method kab use karni hai.
- Status codes ko "family + meaning" se choose kar sako (401 vs 403, 400 vs 404 vs 409, 201 vs 204).
- Important request/response headers aur unka kaam.
- Cookies ka `Set-Cookie` / `Cookie` flow aur security attributes.
- `Content-Type` vs `Accept`, JSON vs form vs multipart.
- Raw `node:http` se ek chhota server bana ke Express ke andar ka kaam samajh sako.

**Questions to revise (question bank):** Category 3 (Express.js and API design) -- the HTTP basics entries; also keep
Week 2 Day 5 (streams) in mind because `req` aur `res` streams hain.

### Topic 1.1 -- HTTP request-response lifecycle `[ESSENTIAL]`

**Concept**

HTTP ek **stateless request-response protocol** hai. Client (browser, mobile app, `fetch`, `curl`) ek request bhejta hai, server ek
response deta hai. "Stateless" ka matlab: server ek request ke baad doosri request ke baare mein kuch yaad nahi rakhta jab tak tum
cookie / token jaisa kuch bhejkar khud context na do.

Ek request ka journey (HTTPS wali `https://api.shop.com/v1/orders?status=paid`):

1. **DNS lookup** -- `api.shop.com` -> IP address.
2. **TCP connection** -- 3-way handshake (SYN, SYN-ACK, ACK). Keep-alive ho to purana connection reuse hota hai.
3. **TLS handshake** -- certificate verify, session keys. (HTTPS)
4. **HTTP request bhejna** -- request line + headers + optional body.
5. **Edge/proxy layer** -- CDN, load balancer, nginx / ALB. Ye TLS terminate kar sakte hain, `X-Forwarded-For` lagate hain.
6. **Node process** -- `http.Server` bytes ko parse karta hai (llhttp parser), `IncomingMessage` (req) aur `ServerResponse` (res)
   banata hai, `'request'` event emit karta hai.
7. **Express** -- middleware chain, router, controller.
8. **Response** -- status line + headers + body, ya stream.
9. **Connection** -- keep-alive ya close. Client response render/parse karta hai.

Raw HTTP/1.1 request aisi dikhti hai:

```
POST /api/v1/tasks HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
Content-Length: 31

{"title":"Buy milk","priority":"low"}
```

Response:

```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /api/v1/tasks/3b0c1d2e-9f1a-4c53-8d0e-1a2b3c4d5e6f
X-Request-Id: 7a1f...
Content-Length: 214

{"data":{...}}
```

**Why it matters**

Backend interview mein "jab user button click karta hai to kya hota hai?" ek classic question hai. Debugging bhi isi
model pe hoti hai: 502 aaya to proxy-to-Node ka issue, CORS error aaya to browser ne response block kiya, 401 aaya to auth
middleware tak request pahunchi. Jab tum jaante ho ki request kis layer pe hai, tab debugging 10x tez hoti hai.

**Internal working (Node specific)**

- `http.createServer(handler)` ek TCP server (`net.Server`) banata hai. Network I/O **libuv ke OS-level polling (epoll/kqueue/IOCP)**
  se hota hai, thread pool se nahi (Week 2 Day 2 revise karo).
- Har incoming connection pe Node ek HTTP parser chalata hai. Headers parse hote hi `'request'` event fire hota hai -- body
  tab tak poori aayi hui nahi hoti.
- `req` ek **Readable stream** hai (body chunks aate hain), `res` ek **Writable stream** hai. Isiliye raw Node mein body padhne ke
  liye `for await (const chunk of req)` chalta hai.
- Express khud server nahi hai. `express()` ek **function `(req, res, next)`** return karta hai jo `http.createServer(app)` ko diya
  ja sakta hai. `app.listen()` bas `http.createServer(this)` + `.listen()` ka shortcut hai.
- Timeouts (Node 18+ defaults): `server.headersTimeout` = 60s, `server.requestTimeout` = 300s, `server.keepAliveTimeout` = 5s.
  Load balancer (jaise AWS ALB, default idle timeout 60s) ke peeche Node ka 5s keep-alive timeout kam hai: Node connection pehle
  band kar deta hai aur LB us band connection pe request bhej deta hai -> random **502**. Fix: `server.keepAliveTimeout` ko LB
  idle timeout se bada rakho (jaise 65s) aur `headersTimeout` usse thoda aur bada.

**Code: raw `node:http` server (Day 1 playground)**

Ye file Express use nahi karti. Isse tum dekhoge ki Express asal mein kya kar raha hai.

`playground/http-lifecycle.js`:

```js
import http from 'node:http';

const PORT = 4000;

function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

// req is a Readable stream: collect chunks, enforce a size limit.
async function readBody(req, limitBytes = 100 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) {
      const err = new Error('Payload too large');
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.on('finish', () => {
    console.log(`${req.method} ${url.pathname}${url.search} -> ${res.statusCode} (${Date.now() - started}ms)`);
  });

  try {
    // 1) JSON echo: method check (405), content-type check (415), parse check (400)
    if (url.pathname === '/echo') {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' }, { Allow: 'POST' });
      }
      if (!req.headers['content-type']?.startsWith('application/json')) {
        return sendJson(res, 415, { error: 'Content-Type must be application/json' });
      }
      const raw = await readBody(req);
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        return sendJson(res, 400, { error: 'Body is not valid JSON' });
      }
      return sendJson(res, 200, {
        method: req.method,
        query: Object.fromEntries(url.searchParams),
        received: json,
        userAgent: req.headers['user-agent'] ?? null,
      });
    }

    // 2) Cookies: server sets, browser sends back automatically
    if (url.pathname === '/login-demo') {
      res.setHeader('Set-Cookie', [
        'sid=abc123; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600',
        'theme=dark; SameSite=Lax; Path=/; Max-Age=31536000',
      ]);
      return sendJson(res, 200, { message: 'cookies set' });
    }
    if (url.pathname === '/whoami') {
      const cookies = parseCookies(req.headers.cookie);
      if (!cookies.sid) return sendJson(res, 401, { error: 'No session cookie' });
      return sendJson(res, 200, { sid: cookies.sid, theme: cookies.theme ?? null });
    }

    // 3) Redirect and conditional GET (ETag -> 304)
    if (url.pathname === '/old') {
      res.writeHead(301, { Location: '/new' });
      return res.end();
    }
    if (url.pathname === '/cached') {
      const etag = '"v1"';
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ETag: etag });
        return res.end();
      }
      return sendJson(res, 200, { value: 42 }, { ETag: etag, 'Cache-Control': 'private, max-age=0, must-revalidate' });
    }

    return sendJson(res, 404, { error: `No route for ${req.method} ${url.pathname}` });
  } catch (err) {
    const status = err.status ?? 500;
    return sendJson(res, status, { error: status === 500 ? 'Internal Server Error' : err.message });
  }
});

server.listen(PORT, () => {
  console.log(`raw http server on http://localhost:${PORT}`);
  console.log({
    keepAliveTimeout: server.keepAliveTimeout,
    headersTimeout: server.headersTimeout,
    requestTimeout: server.requestTimeout,
  });
});
```

Run: `node playground/http-lifecycle.js` aur doosre terminal mein experiments:

```bash
# -i shows response headers, -v shows the full request/response conversation
curl -i http://localhost:4000/echo                       # 405 + Allow header
curl -i -X POST http://localhost:4000/echo -d 'hello'    # 415 (curl sends form-urlencoded by default)
curl -i -X POST http://localhost:4000/echo \
  -H 'Content-Type: application/json' -d '{"a":1}'       # 200
curl -i -X POST http://localhost:4000/echo \
  -H 'Content-Type: application/json' -d '{bad json'     # 400
curl -i -c jar.txt http://localhost:4000/login-demo      # see Set-Cookie, save to cookie jar
curl -i -b jar.txt http://localhost:4000/whoami          # cookie sent back
curl -i http://localhost:4000/whoami                     # 401: no cookie
curl -i http://localhost:4000/old                        # 301 + Location (curl does not follow without -L)
curl -i http://localhost:4000/cached                     # 200 + ETag
curl -i -H 'If-None-Match: "v1"' http://localhost:4000/cached   # 304, no body
```

**Frontend connection**

- Browser DevTools -> Network tab wahi request line, headers, status, payload dikhata hai jo tum `curl -v` mein dekh rahe ho.
- `fetch('/api/tasks', { method: 'POST', headers: {...}, body })` ka har argument HTTP ke ek hisse se map hota hai.
  `fetch` ka promise HTTP error (404/500) pe **reject nahi hota** -- sirf network failure pe; isliye `if (!res.ok)` check hota hai.
- Browser cookies automatic bhejta hai (same-site rules ke saath); `Authorization` header tumhe khud lagana padta hai.

**Real-world scenario**

Checkout page: browser `POST /api/v1/orders` bhejta hai. ALB TLS terminate karke Node pe forward karta hai. Agar response 502 aaye
to hum pehle ALB/Node connection (keep-alive mismatch, crashed process) dekhte hain; agar 400 aaye to payload validation; agar 401 to
token. Ek hi symptom ("order nahi hua") ke peeche alag layers hain -- lifecycle ka model batata hai kahan dekhna hai.

**Interview answer:** "When a client calls an API, the browser resolves the domain through DNS, opens a TCP connection, and for HTTPS
performs a TLS handshake. It then sends an HTTP request consisting of a request line, headers and an optional body. The request usually
passes through a CDN or load balancer to the Node.js process, where the HTTP parser creates request and response objects and Express
runs the matching middleware and route handler. The server returns a status line, headers and a body, and the connection is typically
kept alive for reuse. HTTP itself is stateless, so identity and session state must be carried by cookies or tokens on each request."

**Follow-up questions**

1. *Is HTTP stateless? Then how do logins work?* Protocol stateless hai; state client har request ke saath cookie ya
   `Authorization` token bhejkar carry karta hai. Server session store ya token verify karke user pehchanta hai.
2. *HTTP/1.1 vs HTTP/2?* HTTP/2 ek connection pe multiple parallel streams (multiplexing), header compression, binary framing deta hai;
   HTTP/1.1 mein ek connection pe ek time mein ek request (head-of-line blocking). Production mein aksar proxy HTTP/2 handle karta hai
   aur Node tak HTTP/1.1 aata hai. Semantics (methods, status codes) dono mein same hain.
3. *What does keep-alive do?* TCP/TLS handshake ka cost bachata hai by reusing the connection for multiple requests.
4. *Why might you get 502 behind a load balancer even when Node is healthy?* Keep-alive timeout mismatch (Node 5s vs LB 60s), or Node
   crashed/restarting, or response headers too large.
5. *Where does the request body live when the handler starts?* Handler tab shuru hota hai jab headers aa chuke hote hain; body ek stream
   hai jo abhi aa rahi ho sakti hai. Express ka `express.json()` stream padhke `req.body` banata hai.

**Common mistakes**

- Samajhna ki `fetch` 404/500 pe throw karta hai.
- Body size limit na lagana (memory DoS). Hamesha limit rakho (raw: manual; Express: `express.json({ limit })`).
- Proxy ke peeche `req.ip` ko trust karna bina `app.set('trust proxy', ...)` ke -- sab requests ek hi (proxy) IP se dikhengi.
- Keep-alive timeout ko LB timeout se chhota chhodna.

**Revision notes**

- Order: DNS -> TCP -> TLS -> request -> proxy -> Node parser -> Express -> response.
- `req` = Readable, `res` = Writable; Express = function `(req, res, next)`.
- Stateless protocol; identity carried per request.
- Behind a LB: `keepAliveTimeout` > LB idle timeout; configure `trust proxy`.

### Topic 1.2 -- HTTP methods: safe and idempotent `[ESSENTIAL]`

**Concept**

Method request ka **intent** batati hai. Do properties jo interview mein poochi jaati hain:

- **Safe**: server state change nahi karta (read-only intent).
- **Idempotent**: same request ko 1 baar ya N baar bhejne ka **server state par effect** same rahe. (Response same hona zaroori nahi.)

| Method | Typical use | Body | Safe | Idempotent | Cacheable |
|--------|-------------|------|------|------------|-----------|
| GET | Read a resource / list | no | yes | yes | yes |
| HEAD | Like GET, headers only | no | yes | yes | yes |
| OPTIONS | Capabilities, CORS preflight | no | yes | yes | no |
| POST | Create / non-idempotent action | yes | no | **no** | rarely |
| PUT | Replace whole resource (or create at known URL) | yes | no | yes | no |
| PATCH | Partial update | yes | no | **not guaranteed** | no |
| DELETE | Remove resource | usually no | no | yes | no |

**Why it matters**

Idempotency decide karti hai ki network failure ke baad client **safely retry** kar sakta hai ya nahi. Payment API mein `POST /payments`
retry karne se double charge ho sakta hai -- isliye Week 6 Day 3 aur Week 7 Day 4 mein idempotency keys aate hain. Safe methods pe
crawlers/prefetch bina darr ke chal sakte hain -- isliye `GET /logout` ya `GET /delete?id=5` jaisa design galat hai.

**Internal working**

- Node/Express ko method ki semantics enforce nahi karte -- ye tumhari design discipline hai. Express bas `app.get/post/...` se routing
  karta hai.
- DELETE idempotent hai kyunki end state (resource gone) same hai, chahe doosri call 404 de.
- PATCH tab idempotent hota hai jab operation "set field to X" ho, aur non-idempotent jab "increment by 1" jaisa ho. Isiliye spec
  "not guaranteed" kehta hai.

**Code (preview, will be built on Day 2):**

```js
tasksRouter.get('/:id', getOne);      // safe + idempotent
tasksRouter.post('/', create);        // creates new id each time -> not idempotent
tasksRouter.patch('/:id', update);    // "set status=done" -> idempotent in practice
tasksRouter.delete('/:id', remove);   // idempotent (second call -> 404, state same)
```

**Frontend connection**

React Query / SWR automatic retry sirf GET (idempotent) pe safely chalta hai; mutation retry ke liye tumhe idempotency ka dhyan rakhna
padta hai. Double-click on "Pay" button = duplicate POST problem.

**Real-world scenario**

Banking transfer: `POST /transfers` network timeout ke baad client retry karta hai. Server ne pehli request process kar di thi ->
paisa do baar kat gaya. Fix: client `Idempotency-Key` header bheje aur server same key pe pehla result return kare (Week 6).

**Interview answer:** "A method is safe if it does not modify server state, such as GET and HEAD. It is idempotent if making the same request
multiple times leaves the server in the same state as making it once; GET, PUT and DELETE are idempotent, POST is not, and PATCH is not
guaranteed to be. Idempotency matters because it tells clients which requests can be retried safely after a timeout."

**Follow-up questions**

1. *PUT vs PATCH?* PUT poora resource replace karta hai (missing fields reset/remove ho sakte hain); PATCH sirf bheje gaye fields badalta hai.
   Mostly PATCH practical hai; PUT tab jab client poora representation owns karta ho.
2. *PUT vs POST for creating?* PUT tab jab client resource ka URL/ID decide karta hai (idempotent create); POST jab server ID generate karta hai.
3. *Is DELETE idempotent if second call returns 404?* Haan -- idempotency state ke baare mein hai, response code ke baare mein nahi.
4. *Can GET have a body?* Technically allowed but semantics undefined; proxies/caches ignore it. Avoid; use query params or POST for complex search.
5. *How do you make POST idempotent?* Idempotency-Key header + server-side dedupe store (Week 6 Day 3).

**Common mistakes**

- State-changing GET endpoints (`GET /users/5/delete`).
- Using POST for everything.
- Assuming "idempotent" means "same response".
- Returning 200 for a created resource instead of 201.

**Revision notes**

- Safe = read-only. Idempotent = repeat has same state effect. GET/PUT/DELETE idempotent; POST not; PATCH depends.
- Retry rule: only retry idempotent requests automatically.

### Topic 1.3 -- Status codes `[ESSENTIAL]`

**Concept**

Status code response ka **machine-readable outcome** hai. Family yaad rakho:

- **1xx** informational (rare), **2xx** success, **3xx** redirect/caching, **4xx** client ki galti, **5xx** server ki galti.

| Code | Name | Use it when |
|------|------|-------------|
| 200 | OK | Successful GET/PATCH/PUT with a body |
| 201 | Created | POST created a resource; include `Location` header |
| 202 | Accepted | Work accepted but processing is async (queues, Week 6) |
| 204 | No Content | Success, nothing to return (DELETE, some PUT/PATCH) |
| 301 / 308 | Moved Permanently / Permanent Redirect | URL permanently changed (308 keeps method) |
| 302 / 307 | Found / Temporary Redirect | Temporary redirect (307 keeps method) |
| 304 | Not Modified | Conditional GET: client cache still valid (ETag/If-None-Match) |
| 400 | Bad Request | Malformed JSON, failed validation |
| 401 | Unauthorized | **Not authenticated** (no/invalid/expired credentials) |
| 403 | Forbidden | Authenticated but **not allowed** |
| 404 | Not Found | Resource/route does not exist (also used to hide existence) |
| 405 | Method Not Allowed | URL exists, method does not; send `Allow` header |
| 409 | Conflict | State conflict: duplicate email, version mismatch |
| 413 | Payload Too Large | Body/file exceeds limit |
| 415 | Unsupported Media Type | Wrong `Content-Type` |
| 422 | Unprocessable Content | Syntactically valid but semantically invalid (alternative to 400 for validation) |
| 429 | Too Many Requests | Rate limited; send `Retry-After` |
| 500 | Internal Server Error | Unexpected bug |
| 502 | Bad Gateway | Proxy got an invalid response from upstream |
| 503 | Service Unavailable | Overloaded / maintenance / shutting down |
| 504 | Gateway Timeout | Upstream took too long |

**Why it matters**

Frontend aur monitoring status code pe decisions lete hain: 401 pe login page, 403 pe "access denied", 429 pe backoff, 5xx pe alert.
Galat codes (sab kuch 200 + `{success:false}`) se monitoring, caching aur client libraries sab andhe ho jaate hain.

**Internal working**

- Express default status 200 deta hai. `res.status(201).json(...)` pehle status set karta hai fir body bhejta hai. `res.sendStatus(204)` status +
  uska text bhejta hai.
- Error middleware agar kuch set nahi karta to Express ka default handler 500 bhejta hai (Day 4).
- 204 aur 304 responses **body nahi** rakh sakte; Node body drop kar deta hai.

**Frontend connection**

Axios interceptors: 401 -> refresh token / redirect to login; 403 -> toast; 429 -> retry after `Retry-After`. Ye sab status codes pe
based hai, response body pe nahi.

**Real-world scenario**

Marketplace: customer doosre customer ka order dekhne ki koshish karta hai. Options: 403 (exists but forbidden) ya 404 (existence hide).
Hum Task API mein **404** use karenge taaki IDs enumerate na ho sakein (Day 4).

**Interview answer:** "I use 2xx for success, with 201 and a Location header for creation and 204 for empty responses. 400 is for malformed
or invalid input, 401 means the caller is not authenticated, and 403 means authenticated but not authorized. 404 is for missing resources,
409 for state conflicts such as duplicates, and 429 for rate limiting. 5xx codes signal server-side failures, and I make sure unexpected
errors map to 500 without leaking internals."

**Follow-up questions**

1. *401 vs 403?* 401: "tum kaun ho, ye pata nahi / credentials galat". 403: "tum kaun ho pata hai, par permission nahi". 401 ke saath
   `WWW-Authenticate` header bhejna chahiye.
2. *400 vs 422?* 400 = request samajh nahi aayi (bad syntax/shape). 422 = samajh aayi par business/semantic rules fail. Teams aksar ek ko
   choose karke consistent rehte hain; hum validation ke liye 400 use karenge.
3. *404 vs 410?* 410 = pehle tha, ab permanently gone. 404 = nahi mila (ya hide kiya).
4. *When 200 vs 204 for DELETE?* 204 jab kuch return nahi karna; 200 jab deleted resource ya status body return karna ho.
5. *When 409?* Unique constraint violation (email already used), optimistic-lock version mismatch, invalid state transition.
6. *What is 304 and how does it save bandwidth?* Client `If-None-Match: <etag>` bhejta hai; agar match hua to server body ke bina 304 deta hai.

**Common mistakes**

- Always returning 200 with an `error` field.
- Using 500 for validation errors.
- Using 401 for authorization failures.
- Returning 404 for method mismatch (should be 405).
- Redirect codes mix-up (301 vs 308 for POST).

**Revision notes**

- 2xx ok, 3xx redirect, 4xx client error, 5xx server error.
- 201+Location, 204 no body, 401 authn, 403 authz, 404 missing, 409 conflict, 429 rate limit, 502/503/504 are gateway/availability errors.

### Topic 1.4 -- Headers `[ESSENTIAL]`

Short topic, concise treatment. Headers = key/value metadata, case-insensitive names. Node `req.headers` lowercases names.

| Header | Direction | Purpose |
|--------|-----------|---------|
| `Host` | req | Which domain (virtual hosting) |
| `Content-Type` | both | Format of the body being sent |
| `Content-Length` / `Transfer-Encoding: chunked` | both | Body size / streaming body |
| `Accept` | req | Formats client can handle (content negotiation) |
| `Accept-Encoding` / `Content-Encoding` | req / res | gzip, br compression |
| `Authorization` | req | Credentials: `Bearer <token>`, `Basic ...` |
| `User-Agent` | req | Client identification |
| `Origin` | req | Where a cross-origin browser request comes from (CORS, Day 6) |
| `Cookie` / `Set-Cookie` | req / res | Cookie transport |
| `Cache-Control` | both | Caching rules (`no-store`, `max-age=60`, `private`) |
| `ETag` / `If-None-Match` | res / req | Validator for conditional requests |
| `Location` | res | Redirect target or URL of a created resource |
| `Retry-After` | res | When to retry (429, 503) |
| `Allow` | res | Allowed methods (405) |
| `X-Request-Id` | both | Correlation id for tracing (Day 3, Week 6) |
| `X-Forwarded-For`, `X-Forwarded-Proto` | req (from proxy) | Original client IP/protocol; used with `trust proxy` |
| `Strict-Transport-Security`, `X-Content-Type-Options` | res | Security headers (Week 5, helmet) |

Express helpers: `req.get('content-type')`, `req.is('json')`, `res.set(name, value)`, `res.type('json')`, `res.location(url)`.

**Interview answer:** "Headers carry metadata about the request or response. The ones I rely on most are Content-Type and Accept for
format negotiation, Authorization for credentials, Cache-Control and ETag for caching, Origin and the Access-Control headers for CORS, and a
request-id header for tracing a request across services."

**Common mistakes:** Assuming header names are case-sensitive; trusting `X-Forwarded-For` without configuring `trust proxy` (clients can
spoof it); putting secrets in URLs instead of headers (URLs end up in logs).

**Revision notes:** Content-Type = what I send, Accept = what I want back; Authorization for creds; Cache-Control/ETag for caching;
Origin for CORS.

### Topic 1.5 -- Cookies `[ESSENTIAL]`

**Concept**

Cookie ek chhota key=value data hai jo server `Set-Cookie` response header se deta hai aur browser har agli matching request ke saath
`Cookie` header mein wapas bhejta hai. HTTP stateless hai, cookies uske upar "memory" ka kaam karti hain (sessions, preferences).

```
Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
```

| Attribute | Meaning |
|-----------|---------|
| `HttpOnly` | JavaScript (`document.cookie`) cookie padh nahi sakta -> XSS se token theft mushkil |
| `Secure` | Sirf HTTPS pe bhejo |
| `SameSite=Strict/Lax/None` | Cross-site requests mein cookie kab jayegi (CSRF mitigation). `None` requires `Secure` |
| `Max-Age` / `Expires` | Lifetime; na ho to session cookie (browser close pe delete) |
| `Domain` / `Path` | Kin hosts / paths pe bhejni hai |
| `__Host-` prefix | Forces `Secure`, `Path=/`, no `Domain` -- strongest binding |

**Why it matters**

Session-based login aur "remember me" cookies pe chalte hain. Galat flags (`HttpOnly` missing, `Secure` missing) seedhe security bugs hain
(Week 5 Day 5 mein XSS/CSRF).

**Internal working**

- Server response mein ek ya zyada `Set-Cookie` headers bhejta hai (multiple cookies = multiple headers, comma se join nahi karte).
- Browser cookie jar mein store karta hai (domain+path+name key). Matching request pe `Cookie: a=1; b=2` bhejta hai -- attributes request mein
  nahi dikhte.
- Cookie size limit ~4KB per cookie; har request ke saath jaati hain, isliye bade data mat rakho.
- Express: `res.cookie(name, value, options)` set karta hai; `req.cookies` ke liye `cookie-parser` middleware chahiye (Express built-in nahi deta). Express 5
  mein `res.cookie` ke `maxAge` milliseconds mein hota hai (header mein seconds ban jaata hai).

```js
import express from 'express';
import cookieParser from 'cookie-parser'; // npm i cookie-parser

const app = express();
app.use(cookieParser());

app.post('/session-demo', (req, res) => {
  res.cookie('sid', 'abc123', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000, // ms
    path: '/',
  });
  res.status(204).end();
});

app.get('/me', (req, res) => {
  res.json({ sid: req.cookies.sid ?? null });
});
```

**Frontend connection**

Cross-origin `fetch` mein cookies tabhi jaati hain jab `credentials: 'include'` ho **aur** server `Access-Control-Allow-Credentials: true` aur
specific origin (wildcard nahi) de (Day 6). `localStorage` mein token rakhna XSS ke liye vulnerable hai; `HttpOnly` cookie JS se hidden rehti hai.

**Real-world scenario**

E-commerce site: login ke baad server `sid` cookie set karta hai (session id). Cart, wishlist usi se pehchane jaate hain. Agar `HttpOnly` na ho aur
site pe XSS ho to attacker `document.cookie` se session chura leta hai.

**Interview answer:** "A cookie is a small piece of state that the server sets with the Set-Cookie header and the browser returns on subsequent
requests. For session cookies I set HttpOnly to block JavaScript access, Secure to restrict to HTTPS, and SameSite to reduce CSRF risk, plus a
sensible Max-Age. Cookies are sent automatically by the browser, which is convenient for sessions but is exactly why CSRF protection matters."

**Follow-up questions**

1. *Cookie vs localStorage for tokens?* Cookie (`HttpOnly`) XSS-safe hai par CSRF ka risk (mitigate with SameSite/CSRF tokens); localStorage JS se accessible
   hai -> XSS mein token chori, par CSRF nahi. Trade-off (detail Week 5 Day 4).
2. *What does SameSite=Lax do?* Cross-site subresource requests aur POST forms mein cookie nahi jaati; top-level GET navigation mein jaati hai.
3. *Why Secure + SameSite=None together?* Third-party contexts (iframe, cross-site API) ke liye cookie chahiye to `None`, aur browsers `None` ke saath `Secure` mandatory karte hain.
4. *How do signed cookies work?* Server value ke saath HMAC signature bhejta hai (`cookie-parser` secret); tamper detect hota hai, par value encrypted nahi hoti.
5. *Where does the server store session data?* Cookie mein sirf session id; data server-side store (memory, Redis, DB) mein.

**Common mistakes**

- Sensitive data directly cookie mein rakhna.
- `Secure` flag dev mein hard-code karke local HTTP pe debugging tod dena (env-based rakho).
- `maxAge` units confuse karna (Express: ms).
- Session store ko in-memory chhod ke multiple instances chalana (sessions instance-specific ho jaate hain).

**Revision notes:** `Set-Cookie` (server) -> `Cookie` (browser). HttpOnly/Secure/SameSite are the big three. Cookies auto-sent; hence CSRF. Express needs
`cookie-parser` to read.

### Topic 1.6 -- Content types and body formats `[ESSENTIAL]`

**Concept**

`Content-Type` batata hai body kis format mein hai; `Accept` batata hai client kya chahta hai. Common ones:

| Content-Type | Body looks like | Used for | Express parser |
|--------------|-----------------|----------|----------------|
| `application/json` | `{"a":1}` | REST APIs | `express.json()` |
| `application/x-www-form-urlencoded` | `a=1&b=2` | HTML forms | `express.urlencoded({ extended: false })` |
| `multipart/form-data; boundary=...` | parts separated by boundary | File uploads | **multer** (Day 6) |
| `text/plain` | raw text | webhooks (sometimes) | `express.text()` |
| `application/octet-stream` | raw bytes | binary upload | `express.raw()` |

**Why it matters**

Galat Content-Type = body parse nahi hoti. Express 5 mein agar parser match nahi karta to `req.body` **undefined** rehta hai (Express 4 mein `{}`),
isliye validation zaroori hai. Security: unsupported types ko 415 se reject karo.

**Internal working**

- `express.json()` check karta hai `Content-Type` match karta hai ya nahi (`type` option, default `application/json`), phir stream padhta hai (limit default 100kb),
  UTF-8 decode karta hai, `JSON.parse` karta hai (strict mode: sirf object/array), aur `req.body` set karta hai. Parse error -> `err.type = 'entity.parse.failed'`
  (status 400); size exceed -> `entity.too.large` (413).
- Multipart format: boundary string se alag kiye hue parts, har part ke apne headers. Parser stream-based hota hai (busboy), isliye bade files memory mein
  load kiye bina disk pe likhe ja sakte hain.
- Response side: `res.json(obj)` `Content-Type: application/json; charset=utf-8` set karta hai, `JSON.stringify` karta hai, aur weak `ETag` bhi (Express default).

**Frontend connection**

`fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })` -- `Content-Type` bhoolne pe
server body parse nahi karega. `FormData` bhejne par `Content-Type` **manually mat set karo**; browser boundary ke saath khud set karta hai.
Aur: `application/json` + `Authorization` header cross-origin pe CORS **preflight** trigger karte hain (Day 6).

**Real-world scenario**

Profile page: JSON se name/phone update (`application/json`), avatar upload alag endpoint pe `multipart/form-data`. Payment gateway webhooks kabhi kabhi
raw body maangte hain (signature verify ke liye exact bytes chahiye) -- tab `express.raw({ type: 'application/json' })` us route pe lagate hain.

**Interview answer:** "Content-Type tells the server how to interpret the request body, and Accept tells it which representation the client wants back.
REST APIs mostly use application/json; browser forms use urlencoded; file uploads use multipart/form-data, which Express does not parse natively so I use
multer. I validate the content type and return 415 when it is unsupported, and I always set a body size limit."

**Follow-up questions**

1. *What happens if a client sends JSON without the Content-Type header?* `express.json()` body ko skip kar deta hai, Express 5 mein `req.body` undefined, aur
   validation fail hoti hai (ya 415 return karo `requireJson` middleware se, Day 4).
2. *Why is `extended: false` recommended for urlencoded?* `extended: true` `qs` library se nested objects parse karta hai (bigger attack surface / complexity); simple
   `querystring` kaafi hai. Express 5 mein default `false` hai.
3. *Why must webhook signature verification use the raw body?* Signature exact bytes pe compute hota hai; JSON parse + re-stringify bytes badal sakta hai.
4. *Content negotiation kya hai?* Client `Accept` se bataata hai; server `res.format()` / `req.accepts()` se match karke format chunta hai, na mile to 406.

**Common mistakes**

- Manually setting `Content-Type: multipart/form-data` in fetch (boundary missing -> parse fail).
- Sending numbers/booleans in urlencoded/query and assuming types (sab strings aate hain).
- No body limit.
- Using `res.send(JSON.stringify(x))` and forgetting content type.

**Revision notes:** JSON/urlencoded/multipart ke apne parsers; Express 5 `req.body` may be undefined; limit + 415; do not set multipart header manually.

### Day 1 wrap-up

**Key concepts to remember**

- Request journey: DNS -> TCP -> TLS -> HTTP -> proxy -> Node -> Express -> response; HTTP is stateless.
- `req` is a Readable stream, `res` a Writable stream; Express is `(req, res, next)`.
- Safe vs idempotent; retry only idempotent calls.
- 401 (who are you?) vs 403 (not allowed); 201+Location; 204 has no body; 409 conflict; 429 rate limit.
- Cookies: HttpOnly, Secure, SameSite, Max-Age; auto-sent -> CSRF thinking.
- Content-Type vs Accept; JSON vs urlencoded vs multipart.

**Five revision questions**

1. Walk through what happens from clicking "Place order" to seeing the response. Where can a 502 come from?
2. Define safe and idempotent. Classify GET, POST, PUT, PATCH, DELETE.
3. 401 vs 403 vs 404 for "user reads someone else's order" -- which and why?
4. What do HttpOnly, Secure and SameSite protect against?
5. Why does Express 5 give `req.body === undefined` sometimes, and what should you do about it?

**Practical coding task**

Extend `playground/http-lifecycle.js` with `GET /items?limit=5` that validates `limit` (integer 1-50) manually and returns 400 with a JSON error otherwise; add
`HEAD` support for `/cached` that returns the same headers without a body; and add a `PUT /echo` that returns 405 with a correct `Allow` header listing only `POST`.
Test all with `curl -i`.

**Self-assessment checklist**

- [ ] I can list the 9 steps of the lifecycle without notes.
- [ ] I can explain keep-alive and the LB timeout mismatch.
- [ ] I can justify any status code I pick for create/update/delete/validation/auth failures.
- [ ] I ran every curl command and understood each response header.
- [ ] I can set and read a cookie with correct security attributes.
- [ ] I know why multipart needs multer.

---

## Day 2 (Day 16) -- REST principles, API design, Express setup, routes/controllers/services

**Time plan (about 2h)**

| Activity | Min |
|----------|-----|
| Read: REST principles, resource design | 30 |
| Read: Express internals, layering | 25 |
| Build: Stage 1 skeleton + in-memory CRUD | 55 |
| Revision questions + wrap-up | 10 |

**Learning objectives**

- REST ke 6 constraints aur practical API design rules (nouns, plural, nesting, status codes, envelope).
- Express 5 ka app/router/middleware model samajhna (kaise request layers se guzarti hai).
- Routes vs controllers vs services vs repositories ka clear separation, aur kab over-engineering hoti hai.
- Task API ka Stage 1 (setup + skeleton) aur CRUD ka pehla version chalana.

**Questions to revise (question bank):** Category 3 (Express.js and API design): REST principles, PUT vs PATCH, project structure.
Coding: `EX-EXP-*` series (Express CRUD) -- is din ke baad pehla exercise try karo.

### Topic 2.1 -- REST principles and API design `[ESSENTIAL]`

**Concept**

REST (Representational State Transfer) ek **architectural style** hai (protocol ya standard nahi). "RESTful API" ka practical matlab: resources ko URLs se
identify karo, HTTP methods se unpe operations karo, aur representations (JSON) exchange karo.

Six constraints (Roy Fielding):

1. **Client-server** -- UI aur data storage alag; independently evolve.
2. **Stateless** -- har request mein server ko sab kuch chahiye (auth token, params). Server request ke beech session memory pe depend nahi karta. Isse horizontal scaling
   aasaan (koi bhi instance request serve kar sakta hai).
3. **Cacheable** -- responses batate hain ki cache ho sakte hain ya nahi (`Cache-Control`, `ETag`).
4. **Uniform interface** -- resource identification via URI, standard methods, self-descriptive messages, (HATEOAS: links in responses).
5. **Layered system** -- client ko nahi pata ki beech mein CDN/proxy/LB hai.
6. **Code on demand** (optional) -- server se executable code.

Honest note: Practice mein zyaadatar "REST-ish" JSON APIs bante hain (Richardson Maturity Level 2: resources + HTTP verbs + status codes). HATEOAS (Level 3) kam use hota hai;
interview mein mention karo par ye mat bolo ki tumne isko har project mein lagaya.

**Design rules that interviewers check**

| Rule | Good | Bad |
|------|------|-----|
| Nouns, not verbs | `POST /tasks` | `POST /createTask` |
| Plural collection names | `/tasks`, `/tasks/42` | `/task/42` |
| Hierarchy for ownership (depth <= 2) | `/projects/7/tasks` | `/projects/7/milestones/3/tasks/9/comments/1` |
| Filtering via query string | `GET /tasks?status=done` | `GET /tasks/done` |
| Method gives the action | `DELETE /tasks/42` | `GET /tasks/42/delete` |
| Non-CRUD actions as sub-resource or state change | `POST /tasks/42/archive` or `PATCH` with `status` | `POST /archiveTask` |
| Consistent JSON casing | `dueDate` everywhere | mix of `due_date` / `DueDate` |
| ISO 8601 UTC timestamps | `2026-10-19T08:00:00.000Z` | `19/10/2026` |
| Stable error format | `{ error: { code, message, details } }` | different shapes per endpoint |
| Collections return an object with `data` and `meta` | `{ data: [...], meta: {...} }` | raw array (cannot add pagination later without breaking clients) |

**Task API endpoint design (what we build this week)**

| Method + path | Meaning | Success | Typical errors |
|---------------|---------|---------|----------------|
| `GET /api/v1/tasks` | List (filter/sort/paginate) | 200 | 400, 401 |
| `POST /api/v1/tasks` | Create | 201 + `Location` | 400, 401, 415 |
| `GET /api/v1/tasks/:id` | Read one | 200 | 400, 401, 404 |
| `PATCH /api/v1/tasks/:id` | Partial update | 200 | 400, 401, 404 |
| `DELETE /api/v1/tasks/:id` | Delete | 204 | 400, 401, 404 |
| `POST /api/v1/tasks/:id/attachments` | Upload file | 201 | 400, 401, 404, 413, 415 |
| `GET /api/v1/tasks/:id/attachments/:attachmentId` | Download file | 200 | 401, 404 |
| `GET /health` | Liveness (not versioned) | 200 | -- |

**Why it matters**

API ek contract hai. Ek baar frontend/mobile ne use kar liya to naam badalna = breaking change. Isiliye design ke time pe naming, error format, pagination envelope
sochna padta hai. Interview mein "design an API for X" poocha jaata hai.

**Internal working**

REST khud kuch "run" nahi karta -- design discipline hai. Statelessness ka practical impact: sessions server memory mein rakhoge to 2 instances ke beech break hoga; isliye
token (JWT) ya shared store (Redis) use hota hai (Week 5-6).

**Frontend connection**

Tumhare React data-fetching hooks (`useQuery('tasks')`, `useMutation`) REST resources ke upar bane hain. Predictable URL + status codes + stable envelope = frontend mein kam
conditional code. Agar API raw array return kare aur kal pagination chahiye, to har component badalna padega.

**Real-world scenario**

Marketplace order API: `GET /orders?status=paid&sort=-createdAt&page=2`, `POST /orders/:id/cancel` (action ek business transition hai, isliye sub-resource POST), `GET /sellers/:id/products`.
Payment capture jaisa non-idempotent action `POST` hi rehta hai aur idempotency key leta hai.

**Interview answer:** "REST is an architectural style where the server exposes resources identified by URLs and clients manipulate them through standard HTTP methods. Its key constraints are
client-server separation, statelessness, cacheability, a uniform interface and a layered system. In practice I design resource-oriented URLs with plural nouns, use methods and status codes
correctly, keep a consistent response and error envelope, and make the API stateless so any instance can serve any request, which is what allows horizontal scaling."

**Follow-up questions**

1. *What does stateless mean for authentication?* Har request mein credential (token) jaata hai; server per-client session memory pe depend nahi karta. (Session store use bhi ho sakta hai, par wo shared store hota hai, process memory nahi.)
2. *How would you model "complete a task"?* Simple case: `PATCH /tasks/:id { "status": "done" }`. Agar side effects/business rules zyada hain (notifications, validations) to `POST /tasks/:id/complete` bhi acceptable hai -- consistent raho.
3. *How do you handle bulk operations?* `POST /tasks/bulk` ya batch endpoint with per-item results (207 style or a results array); limit size aur partial-failure semantics document karo.
4. *UUID vs auto-increment IDs in URLs?* Auto-increment guessable (enumeration) aur sharding mein dikkat; UUID unguessable par index locality/size cost (Week 4). Authorization check dono mein zaroori hai -- UUID security nahi hai.
5. *What is HATEOAS and do you use it?* Responses mein next actions ke links; theoretical REST ka hissa, par practice mein rarely; pagination links (`next`) us idea ka halka version hain.
6. *PUT vs PATCH (design view)?* PUT idempotent full replace; PATCH partial. Hum PATCH pe focus karte hain kyunki clients aksar ek-do field change karte hain.

**Common mistakes**

- Verbs in URLs, singular/plural mixing.
- Returning arrays directly (no room for `meta`).
- Deep nesting.
- Using 200 for everything.
- Putting secrets/tokens in query strings.
- "Changing field names" without versioning (Day 5).

**Revision notes**

- REST = resources + methods + stateless + cacheable + uniform + layered.
- Plural nouns, shallow nesting, filters in query string, ISO dates, `{ data, meta }`, stable `{ error }`.

### Topic 2.2 -- Express setup and how a request travels `[ESSENTIAL]`

**Concept**

Express ek minimal web framework hai jo Node ke `http` module ke upar **routing** aur **middleware pipeline** deta hai.

**Internal working**

- `const app = express()` ek function hai `app(req, res)`. `http.createServer(app)` har request pe isse call karta hai.
- App ke andar ek **Router** hota hai jisme `stack` = ordered list of **Layers**. Har `app.use(path, fn)` / `app.get(path, fn)` ek Layer add karta hai (method + path pattern + handler).
- Request aati hai to Express stack ko upar se neeche walk karta hai: jis Layer ka path+method match kare wo handler chalata hai. Handler `next()` call kare to aage badho; response bheje to chain khatam.
- `next(err)` (argument ke saath) normal handlers skip karke seedha **error-handling middleware** (4 arguments: `(err, req, res, next)`) pe jaata hai. `next('route')` current route ke baaki handlers skip karta hai.
- Express 5 mein path matching `path-to-regexp` v8 se hoti hai (wildcard names, `{}` optional) -- v4 se syntax thoda alag.
- Handler ek promise return kare aur wo **reject** ho, ya sync throw ho -> Express 5 khud `next(err)` call karta hai. (Express 4 mein promise rejection forward nahi hota tha; request hang ho jaati ya process `unhandledRejection` se girta.)
- **Order matters**: middleware/routes definition ke order mein chalte hain. 404 handler sabse neeche, error handler uske baad.

Code: ek `createApp()` factory (testing ke liye `listen` alag rakhte hain, Week 6 mein Supertest `createApp()` ko seedha use karega).

**Frontend connection**

Redux middleware / Axios interceptors ka chain jaisa socha jaaye to: har middleware request ko dekh/badal sakta hai aur `next()` se aage de sakta hai; Express mein bhi same
"pipeline" pattern hai, bas HTTP request par.

**Real-world scenario**

Order service ka pipeline: request id -> logging -> CORS -> body parser -> auth -> validation -> controller -> error handler. Agar koi step galat order mein ho (jaise auth CORS se pehle), to
browser preflight requests 401 se fail ho jaati hain -- ye production bug bahut common hai (Day 6).

**Interview answer:** "Express is a thin routing and middleware layer on top of Node's HTTP server. The app is a function that receives each request and runs it through an ordered stack of middleware and
route handlers. Each handler either ends the response or calls next to pass control on; calling next with an error skips to the error-handling middleware. In Express 5, rejected promises and thrown errors in async handlers are forwarded to that error handler automatically."

**Follow-up questions**

1. *What is middleware?* `(req, res, next)` function jo request/response pe kaam karke ya to response bhejta hai ya `next()` call karta hai. (Day 3 detail.)
2. *Why separate `app.js` and `server.js`?* Testing (Supertest bina port bind kiye app import kar leta hai), graceful shutdown control, aur clean separation of "build the app" vs "run the process".
3. *How does Express know a function is an error handler?* `fn.length === 4`. Isliye 4 arguments declare karna zaroori hai, chahe `next` use na ho.
4. *What did Express 5 change for async code?* Promise rejections handle automatically; `express-async-errors` jaisi libraries ya wrapper ki zaroorat nahi.
5. *Where does routing order bite you?* `/tasks/:id` pehle declare ho to `/tasks/stats` usse match ho jaata hai (`id = 'stats'`) -- specific routes pehle.

**Common mistakes**

- Forgetting `next()` -> request hangs (client timeout).
- Calling `next()` after already sending a response -> "Cannot set headers after they are sent".
- Putting `app.listen` inside the app module (untestable).
- Registering 404/error handlers before routes.

**Revision notes**

- App = function; stack of layers; order = execution order.
- `next()` continue, `next(err)` -> error handler (4 args). Express 5 auto-forwards async errors.
- Split `createApp()` from `listen()`.

### Topic 2.3 -- Routes, controllers, services (and repositories) `[ESSENTIAL]`

**Concept**

Code ko responsibility ke hisaab se layers mein baanto:

- **Route**: "kaunsa URL+method kaunse middleware + controller ko jaata hai." Koi logic nahi.
- **Controller**: HTTP translate karta hai -- request se validated data nikalna, service call karna, status code aur JSON shape decide karna.
- **Service**: business logic (defaults, ownership rules, state transitions). `req`/`res` kabhi import/use nahi karta. Isliye bina HTTP ke test ho sakti hai aur kal ko queue worker se bhi reuse.
- **Repository**: data access. Aaj `Map`, Week 4-5 mein MySQL. Baaki layers ko pata nahi ki storage kya hai.

**Why it matters**

- **Testability**: service ko HTTP ke bina unit test kar sakte ho.
- **Replaceability**: in-memory -> MySQL swap sirf repository badalta hai.
- **Readability**: "fat controller" (200 line handler jisme SQL + business rule + response) interviews mein red flag hai.

Honesty check: bahut chhote CRUD ke liye service layer sirf pass-through ban sakta hai; tab bhi ek layer rakhna acha hai kyunki business rules baad mein aate hain (ownership, limits). Over-engineer mat karo --
interface, DI container, abstract classes jaisi cheezein is stage pe zaroori nahi.

**Mass assignment** (security): `repo.insert(req.body)` kabhi mat karo -- client `{"ownerId":"admin","status":"done"}` bhejke fields force kar sakta hai. Service mein **explicit whitelist** se fields choose karo.

### Build: Stage 1 skeleton + in-memory CRUD

Files (sab ES modules). Pehle `config`:

`src/config/env.js`

```js
// Day 2 version: plain env reading. Day 4 replaces this with zod-validated config.
export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
```

`src/server.js`

```js
import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`task-api listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

// Graceful shutdown (full treatment in Week 6): stop accepting new connections, finish in-flight ones.
function shutdown(signal) {
  console.log(`${signal} received, closing server`);
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

`src/app.js` (Day 2 version; Days 3, 4, 6 add to it)

```js
import express from 'express';
import { v1Router } from './routes/v1/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by'); // do not advertise the framework
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  app.use('/api/v1', v1Router);

  // Catch-all 404 (Day 4 moves this into middleware/notFound.js)
  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
    });
  });

  return app;
}
```

`src/routes/v1/index.js`

```js
import { Router } from 'express';
import { tasksRouter } from './tasks.routes.js';

export const v1Router = Router();

v1Router.use('/tasks', tasksRouter);
```

`src/routes/v1/tasks.routes.js`

```js
import { Router } from 'express';
import * as tasksController from '../../controllers/tasks.controller.js';

export const tasksRouter = Router();

tasksRouter.get('/', tasksController.list);
tasksRouter.post('/', tasksController.create);
tasksRouter.get('/:id', tasksController.getOne);
tasksRouter.patch('/:id', tasksController.update);
tasksRouter.delete('/:id', tasksController.remove);
```

`src/controllers/tasks.controller.js`

```js
import * as tasksService from '../services/tasks.service.js';

function notFound(res, id) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Task ${id} not found` } });
}

export async function list(req, res) {
  const tasks = await tasksService.listTasks();
  res.json({ data: tasks });
}

export async function create(req, res) {
  const task = await tasksService.createTask(req.body);
  // req.baseUrl is "/api/v1/tasks" inside this router
  res.status(201).location(`${req.baseUrl}/${task.id}`).json({ data: task });
}

export async function getOne(req, res) {
  const task = await tasksService.getTask(req.params.id);
  if (!task) return notFound(res, req.params.id);
  res.json({ data: task });
}

export async function update(req, res) {
  const task = await tasksService.updateTask(req.params.id, req.body);
  if (!task) return notFound(res, req.params.id);
  res.json({ data: task });
}

export async function remove(req, res) {
  const deleted = await tasksService.deleteTask(req.params.id);
  if (!deleted) return notFound(res, req.params.id);
  res.status(204).end();
}
```

`src/services/tasks.service.js`

```js
import { randomUUID } from 'node:crypto';
import * as tasksRepo from '../repositories/tasks.repository.js';

// Mass-assignment protection: only these fields can ever be written by a client.
const UPDATABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

export async function listTasks() {
  return tasksRepo.findAll();
}

export async function getTask(id) {
  return tasksRepo.findById(id);
}

export async function createTask(input) {
  const now = new Date().toISOString();
  return tasksRepo.insert({
    id: randomUUID(),
    title: input.title,
    description: input.description ?? '',
    status: 'todo',
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
    attachments: [],
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTask(id, input) {
  const patch = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in input) patch[field] = input[field];
  }
  return tasksRepo.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteTask(id) {
  return tasksRepo.remove(id);
}
```

`src/repositories/tasks.repository.js`

```js
// In-memory store. Same async interface a MySQL repository will expose in Week 4-5.
const store = new Map();

export async function findAll() {
  return [...store.values()];
}

export async function findById(id) {
  return store.get(id) ?? null;
}

export async function insert(task) {
  store.set(task.id, task);
  return task;
}

export async function update(id, patch) {
  const current = store.get(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  store.set(id, next);
  return next;
}

export async function remove(id) {
  return store.delete(id);
}
```

Run and test:

```bash
npm run dev

curl -i localhost:3000/health
curl -i -X POST localhost:3000/api/v1/tasks -H 'Content-Type: application/json' \
  -d '{"title":"Write Week 3 notes","priority":"high"}'
# copy the id from the response
curl -i localhost:3000/api/v1/tasks
curl -i localhost:3000/api/v1/tasks/<id>
curl -i -X PATCH localhost:3000/api/v1/tasks/<id> -H 'Content-Type: application/json' -d '{"status":"done"}'
curl -i -X DELETE localhost:3000/api/v1/tasks/<id>
curl -i localhost:3000/api/v1/tasks/<id>          # 404 now
curl -i localhost:3000/nope                        # 404 from catch-all
```

**Deliberate weakness to observe:** `curl -i -X POST localhost:3000/api/v1/tasks` (no body) -> `req.body` is `undefined` in Express 5 -> `input.title` throws a `TypeError` -> Express
returns a **500 with an HTML stack trace** (in development). Isme teen problems hain: validation missing (Day 3), error format inconsistent (Day 4), aur dev stack leak. Hum inhe agle do din fix karenge.

**Stage 1 acceptance criteria (maps to `12_Project_Task_API.md` Stage 1)**

- [ ] `npm run dev` starts the server; `GET /health` returns 200.
- [ ] `app.js` exports `createApp()` and `server.js` is the only place that calls `listen`.
- [ ] Routes -> controller -> service -> repository separation visible in the folder tree.
- [ ] Unknown routes return JSON 404, not HTML.
- [ ] Config read from env via `--env-file`, no secrets in code.

**Interview concepts demonstrated:** Express app factory, routing, layered architecture, REST resource design, mass-assignment protection.

**Interview answer (layering):** "I split the code into routes, controllers, services and repositories. Routes only map URLs to handlers. Controllers translate HTTP into function calls and back into status codes and JSON.
Services hold business rules and know nothing about Express, so they are easy to test and reuse. Repositories own data access, so I can move from an in-memory store to MySQL without touching the upper layers."

**Follow-up questions**

1. *Where do you put validation?* Request-shape validation middleware pe (route level, Day 3); business rules (ownership, state transitions) service mein.
2. *Where do you decide the HTTP status code?* Controller (ya errors ke through error middleware). Service HTTP status nahi jaanta -- wo domain errors throw karta hai (Day 4).
3. *Is a service layer always necessary?* Tiny CRUD mein overhead lag sakta hai; par business rules aate hi wo jagah chahiye. Consistency ke liye rakhna theek hai, par DI containers/abstractions se bachna.
4. *Why not call the database directly from the controller?* Controller HTTP-bound ho jaata hai: test mushkil, logic duplicate, DB swap painful.

**Common mistakes**

- Fat controllers with SQL inside.
- Passing `req`/`res` into services.
- `insert(req.body)` (mass assignment).
- Returning different shapes per endpoint.
- Circular imports between layers (dependency direction should be one-way: routes -> controllers -> services -> repositories).

**Revision notes**

- Route = wiring, Controller = HTTP translate, Service = rules, Repository = data.
- Whitelist writable fields. `createApp()` separate from `listen()`.

### Day 2 wrap-up

**Key concepts to remember**

- REST = style, not protocol: resources, methods, stateless, cacheable, uniform, layered.
- Plural nouns, shallow nesting, filters in query, `{ data, meta }` envelope.
- Express = function + ordered layer stack; `next()` / `next(err)`; error middleware has 4 args.
- Express 5 auto-forwards async errors; `req.body` can be undefined.
- Layering and mass-assignment whitelist.

**Five revision questions**

1. List REST's constraints and explain how statelessness enables horizontal scaling.
2. Design the URLs and status codes for a "comments on a task" feature. Where would you stop nesting?
3. What happens internally when a request hits `app.get('/tasks/:id', handler)`?
4. Why should `createApp()` not call `listen()`?
5. Explain mass assignment with an example and the fix in the service layer.

**Practical coding task**

Add `POST /api/v1/tasks/:id/complete` as a separate route (controller + service function `completeTask` that sets `status: 'done'`). Then argue in a code comment whether you prefer this or `PATCH { status: 'done' }`
and when each is better. Also add a route-order experiment: declare `GET /tasks/:id` before `GET /tasks/stats`, observe the bug, fix it.

**Self-assessment checklist**

- [ ] The API starts and all five CRUD routes work via curl.
- [ ] I can draw the request path from `http.Server` to the repository from memory.
- [ ] I can explain why `ownerId`/`id` are never read from `req.body`.
- [ ] I know why the no-body POST currently returns 500 and which later day fixes it.
- [ ] I can describe Express 4 vs 5 async error behavior.

---

## Day 3 (Day 17) -- Middleware, request validation (zod), sanitization

**Time plan (about 2h)**

| Activity | Min |
|----------|-----|
| Read: middleware model, types, ordering | 30 |
| Read: validation with zod, sanitization | 30 |
| Build: requestId, logger, validate middleware, schemas | 50 |
| Revision questions + wrap-up | 10 |

**Learning objectives**

- Middleware ke types (application, router, route-level, built-in, third-party, error) aur execution order samajhna.
- Apni khud ki middleware likhna: request id, logger, validation factory.
- zod kya hai, kyun chahiye (runtime validation), `parse` vs `safeParse`, coercion, transforms, defaults, strict objects.
- Validation vs sanitization vs escaping ka fark; mass assignment, NoSQL operator injection, HPP.
- Task API mein har endpoint pe validation lagana (Stage 2 progress).

**Questions to revise (question bank):** Category 3 (Express/API design): middleware, validation. Coding: `EX-MW-*` (middleware) and `EX-EXP-*`.

### Topic 3.1 -- Middleware `[ESSENTIAL]`

**Concept**

Middleware ek function hai `(req, res, next)` jo request-response cycle ke beech mein baithta hai. Wo teen mein se ek kaam karta hai:

1. Request/response ko modify ya inspect karta hai (header add, `req.user` set) aur `next()` call karta hai.
2. Response khud bhej deta hai (chain yahin khatam; jaise auth fail pe 401).
3. `next(err)` se error pass karta hai.

Types:

| Type | Example | Scope |
|------|---------|-------|
| Application-level | `app.use(requestLogger)` | Har request |
| Router-level | `router.use(authenticate)` | Us router ke routes |
| Route-level | `router.post('/', validate(...), handler)` | Sirf us route pe |
| Built-in | `express.json()`, `express.urlencoded()`, `express.static()` | Config ke hisaab se |
| Third-party | `cors`, `cookie-parser`, `helmet`, `multer` | npm packages |
| Error-handling | `(err, req, res, next)` | Errors (Day 4) |

**Why it matters**

Cross-cutting concerns (logging, auth, validation, CORS, rate limit) ko har controller mein copy-paste karne ki jagah ek baar likhke pipeline mein lagate hain. Interview mein "middleware kya hai aur order kyun
matter karta hai?" lagbhag har Express interview mein aata hai.

**Internal working**

- `app.use(fn)` Layer stack mein push karta hai. Request aate hi Express layers ko ek-ek karke call karta hai; `next` ek closure hai jo "stack ka agla layer" chalata hai.
- Middleware `await` kare to Express 5 promise ko track karta hai: reject/throw -> `next(err)`.
- `next()` call kiye bina aur response bheje bina -> request **hang** (koi timeout nahi lagata jab tak server/LB timeout na ho).
- Request-scoped data `req` pe attach hota hai (`req.id`, `req.user`, `req.validated`). Kabhi global variable mein per-request data mat rakho (concurrent requests mix ho jaati hain).
- Middleware ki **factory pattern**: `validate(schema)` ek function return karta hai jo middleware hai. Config closure mein bandh hoti hai.

**Code: order demo**

```js
import express from 'express';

const app = express();

app.use((req, res, next) => { console.log('A before'); next(); console.log('A after'); });
app.use(async (req, res, next) => { console.log('B before'); await Promise.resolve(); next(); console.log('B after'); });
app.get('/ping', (req, res) => { console.log('handler'); res.send('pong'); });

app.listen(3100);
// GET /ping prints: A before, B before, handler, B after, A after
```

"After" lines tab chalti hain jab downstream `next()` ka synchronous call return karta hai -- ye onion model jaisa hai, par Express ka official onion nahi hai (Koa ka hai). Response timing measure karne ke liye
`res.on('finish')` use karo, `next()` ke baad ke code pe depend mat karo.

**Our middleware: request id and request logger**

`src/middleware/requestId.js`

```js
import { randomUUID } from 'node:crypto';

// Accept an upstream id (from a gateway) only if it looks safe; otherwise generate one.
// Never trust arbitrary header content: it ends up in logs (log injection).
const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

export function requestId(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
```

`src/middleware/requestLogger.js`

```js
// One structured JSON line per request, written when the response is finished.
// (Week 6 Day 2 replaces console.log with a proper logger such as pino.)
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      JSON.stringify({
        level: 'info',
        msg: 'request',
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
      }),
    );
  });

  next();
}
```

`finish` tab fire hota hai jab response bhej diya gaya; agar client beech mein disconnect kar de to `close` event aata hai bina `finish` ke -- production loggers dono handle karte hain.

**Frontend connection**

React mein higher-order components / hooks cross-cutting concerns wrap karte hain; Redux middleware actions ke beech mein baithta hai; Axios interceptors request/response transform karte hain. Express middleware wahi pattern
server pe hai: har request pipeline se guzarti hai aur har stage use inspect/transform/reject kar sakti hai.

**Real-world scenario**

Payments API: middleware chain = request id -> access log -> rate limiter -> auth -> idempotency check -> validation -> controller. Support team ek `X-Request-Id` se poora request ka trace logs mein dhundh leti hai.
Agar `requestId` auth ke baad lagaya hota to 401 requests mein id hi nahi hoti.

**Interview answer:** "Middleware is a function with access to the request, the response and the next function. It can modify the request or response, end the cycle by sending a response, or call next to hand off
to the following middleware. Express executes them in the order they are registered, so ordering matters: for example request-id and logging go first, CORS before authentication, body parsing before validation, and the
404 and error handlers last. I use middleware for cross-cutting concerns such as logging, authentication and validation so controllers stay focused on the use case."

**Follow-up questions**

1. *What if you forget to call `next()`?* Request hang hoti hai jab tak client/LB timeout na kare; Node koi default response nahi bhejta.
2. *Difference between `app.use` and `app.get`?* `use` kisi bhi method pe aur path prefix pe match hota hai (path strip karke `req.url` badalta hai); `get` sirf GET aur exact path pattern.
3. *How do you pass data between middleware?* `req` ke properties (`req.user`) ya `res.locals`. Global variables nahi.
4. *How do you apply middleware to only some routes?* Route-level array ya alag `Router` pe `router.use`.
5. *Why does CORS middleware go before auth?* Browser preflight `OPTIONS` request mein credentials/Authorization nahi hote; auth pehle chalega to 401 ke saath preflight fail ho jaayegi.
6. *Sync vs async middleware in Express 5?* Dono theek; async function ka reject/throw automatically `next(err)` banta hai.

**Common mistakes**

- Calling `next()` and also sending a response (double handling).
- `res.send()` then `next()`.
- Registering body parsers after the routes that need them.
- Doing heavy synchronous work (e.g., `JSON.parse` of huge payloads, sync crypto) in middleware -> blocks the event loop for all requests (Week 2 Day 2).
- Storing per-request state in module-level variables.

**Revision notes**

- Middleware = `(req, res, next)`; types: app, router, route, built-in, third-party, error.
- Order = execution order. Do not forget `next()`. Per-request data on `req`.
- CORS before auth; parsers before validation; 404 + error handler last.

### Topic 3.2 -- Request validation with zod `[ESSENTIAL]`

**Concept**

Client se aane wala har data **untrusted** hai (`unknown`). Validation ka kaam: check karna ki data tumhari expected shape/type/range mein hai, warna reject karna **business logic tak pahunchne se pehle**.

TypeScript use bhi karo to types **compile time pe hi hote hain** -- runtime pe network se aaya JSON kuch bhi ho sakta hai. Isliye runtime validation library chahiye. **zod** ek schema-first library hai: ek hi schema se
(1) runtime validation, (2) parsed/typed output, (3) TypeScript type inference (`z.infer`) milta hai. Plain JavaScript mein bhi poora kaam aata hai (hum JS likh rahe hain).

Alternatives (interview mein naam batao): **Joi** (mature, class-style), **Yup** (frontend forms mein popular), **ajv** (JSON Schema, bahut fast), **express-validator** (validator.js ke upar chain-style middleware). zod ka fayda:
chhota API, composable schemas, transforms/coercion, aur frontend (react-hook-form + zod resolver) ke saath same schema share ho sakta hai.

**Install:** `npm i zod` (hum zod 4.x use kar rahe hain; v3 se difference neeche).

**zod core API (mini tour)**

```js
import { z } from 'zod';

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.iso.datetime().nullable().optional(),
});

// parse: returns validated data or THROWS ZodError
const ok = schema.parse({ title: '  Hi there  ', priority: 'low' });
// ok -> { title: 'Hi there', priority: 'low' }  (trimmed; a NEW object, input not mutated)

// safeParse: never throws, returns { success, data } or { success, error }
const result = schema.safeParse({ title: 'x', priority: 'urgent' });
if (!result.success) {
  console.log(result.error.issues);
  // [
  //   { code: 'too_small', path: ['title'], message: 'Too small: expected string to have >=3 characters', ... },
  //   { code: 'invalid_value', path: ['priority'], message: 'Invalid option: expected one of "low"|"medium"|"high"', ... }
  // ]
}
```

(Message wording versions ke saath badal sakta hai -- tests mein exact message pe depend mat karo, `code` aur `path` pe karo.)

Important building blocks:

| Need | zod |
|------|-----|
| String, number, boolean | `z.string()`, `z.number()`, `z.boolean()` |
| Integer, ranges | `z.number().int().min(1).max(100)` |
| Enum | `z.enum(['todo', 'in_progress', 'done'])` |
| UUID, email, URL | `z.uuid()`, `z.email()`, `z.url()` (v4 top-level helpers; v3: `z.string().uuid()`) |
| ISO datetime | `z.iso.datetime()` (v4; accepts `Z` UTC format by default) |
| Optional / nullable | `.optional()` (key may be missing), `.nullable()` (value may be null) |
| Default | `.default(x)` |
| Query/form strings -> numbers | `z.coerce.number()` |
| Object: reject unknown keys | `z.strictObject({...})` (v3: `z.object({...}).strict()`) |
| Object: silently drop unknown keys | `z.object({...})` (default behavior: strip) |
| Partial/extend/pick/omit | `schema.partial()`, `.extend({})`, `.pick({})`, `.omit({})` |
| Custom rule | `.refine(fn, { message })` |
| Transform | `.transform(fn)` |
| Infer TS type | `z.infer<typeof schema>` |

**Internal working**

- Har zod schema ek object hai jisme parsing logic aur checks ki list hoti hai. `parse` input ko type-check karta hai, fir checks (min, max, regex...) chalata hai, fir transforms.
- **Saare issues collect hote hain** (ek field ke type fail hone pe uske aage ke checks skip, par doosre fields continue) -- isliye ek response mein saari errors bhej sakte ho.
- Return value **naya object** hota hai (stripped/transformed); original input mutate nahi hota. Isliye hum `req.body` ko overwrite karne ke bajay `req.validated.body` mein rakhte hain.
- `z.coerce.number()` internally `Number(input)` chalata hai. **Pitfall:** `z.coerce.boolean()` `Boolean(input)` hai -> `"false"` string bhi `true` ban jaata hai. Query mein booleans ke liye
  `z.enum(['true','false']).transform(v => v === 'true')` use karo.
- **Pitfall (defaults + PATCH):** zod 4 mein `.default()` optional/partial ke andar bhi apply hota hai. Agar `.partial()` karte waqt fields pe default laga ho, to PATCH mein bheji nahi gayi fields silently default pe reset ho jaayengi.
  Isliye **create schema mein defaults service mein lagao ya alag schema rakho**; update schema mein defaults kabhi nahi. (Hum yahi karte hain.)
- zod 4 notes: `error.issues` array wahi hai; `z.flattenError(err)` / `z.treeifyError(err)` helper functions hain (v3 ke `err.flatten()` / `err.format()` ki jagah); `z.string().email()` deprecated hai `z.email()` ke favor mein;
  error customization ek unified `error` param se hoti hai.

**Task schemas**

`src/schemas/task.schema.js` (Day 3 version; Day 5 adds the list-query schema, Day 6 adds attachment params)

```js
import { z } from 'zod';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];

const title = z.string().trim().min(3).max(120);
const description = z.string().trim().max(2000);
const status = z.enum(TASK_STATUSES);
const priority = z.enum(TASK_PRIORITIES);
const dueDate = z.iso.datetime().nullable(); // null means "no due date"

// Create: unknown keys are rejected (strictObject) so typos like "prioriti" are not silently ignored.
// No .default() here on purpose: defaults are applied in the service (see pitfall above).
export const createTaskBody = z.strictObject({
  title,
  description: description.optional(),
  priority: priority.optional(),
  dueDate: dueDate.optional(),
});

// Update (PATCH): every field optional, but at least one must be present.
export const updateTaskBody = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    status: status.optional(),
    priority: priority.optional(),
    dueDate: dueDate.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided',
  });

export const idParams = z.object({
  id: z.uuid(),
});
```

**The validate middleware (factory)**

Design decisions: (1) ek hi middleware `params`, `query`, `body` teeno validate kare; (2) sab errors ek saath report ho; (3) parsed output `req.validated` mein jaaye (Express 5 mein `req.query` read-only getter hai --
`req.query = parsed` fail/ignore hoga); (4) raw `req.body` ko controller mein use karne ki aadat chhodo.

`src/middleware/validate.js` (Day 3 version responds directly; Day 4 will switch it to `next(new ValidationError(...))`)

```js
const PARTS = ['params', 'query', 'body'];

export function validate(schemas) {
  return (req, res, next) => {
    const details = [];
    req.validated = {};

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (result.success) {
        req.validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({
            in: part,
            path: issue.path.join('.') || '(root)',
            code: issue.code,
            message: issue.message,
          });
        }
      }
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details },
      });
    }
    next();
  };
}
```

**Wire it in**

`src/app.js` (Day 3 version: request id + logger added at the top)

```js
import express from 'express';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { v1Router } from './routes/v1/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(requestLogger);
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  app.use('/api/v1', v1Router);

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
    });
  });

  return app;
}
```

`src/routes/v1/tasks.routes.js`

```js
import { Router } from 'express';
import * as tasksController from '../../controllers/tasks.controller.js';
import { validate } from '../../middleware/validate.js';
import { createTaskBody, updateTaskBody, idParams } from '../../schemas/task.schema.js';

export const tasksRouter = Router();

tasksRouter.get('/', tasksController.list);
tasksRouter.post('/', validate({ body: createTaskBody }), tasksController.create);
tasksRouter.get('/:id', validate({ params: idParams }), tasksController.getOne);
tasksRouter.patch('/:id', validate({ params: idParams, body: updateTaskBody }), tasksController.update);
tasksRouter.delete('/:id', validate({ params: idParams }), tasksController.remove);
```

`src/controllers/tasks.controller.js` (controllers now read only `req.validated`)

```js
import * as tasksService from '../services/tasks.service.js';

function notFound(res, id) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Task ${id} not found` } });
}

export async function list(req, res) {
  const tasks = await tasksService.listTasks();
  res.json({ data: tasks });
}

export async function create(req, res) {
  const task = await tasksService.createTask(req.validated.body);
  res.status(201).location(`${req.baseUrl}/${task.id}`).json({ data: task });
}

export async function getOne(req, res) {
  const { id } = req.validated.params;
  const task = await tasksService.getTask(id);
  if (!task) return notFound(res, id);
  res.json({ data: task });
}

export async function update(req, res) {
  const { id } = req.validated.params;
  const task = await tasksService.updateTask(id, req.validated.body);
  if (!task) return notFound(res, id);
  res.json({ data: task });
}

export async function remove(req, res) {
  const { id } = req.validated.params;
  const deleted = await tasksService.deleteTask(id);
  if (!deleted) return notFound(res, id);
  res.status(204).end();
}
```

Service aur repository Day 2 jaise hi rehte hain. Test:

```bash
curl -i -X POST localhost:3000/api/v1/tasks -H 'Content-Type: application/json' -d '{"title":"ab","prioriti":"high"}'
# 400, details: title too_small + unrecognized_keys
curl -i -X POST localhost:3000/api/v1/tasks                       # 400 (body missing), no more 500
curl -i -X POST localhost:3000/api/v1/tasks -H 'Content-Type: application/json' -d '{"title":"  Plan sprint  "}'
# 201, title trimmed to "Plan sprint"
curl -i localhost:3000/api/v1/tasks/not-a-uuid                    # 400 on params.id
curl -i -X PATCH localhost:3000/api/v1/tasks/<id> -H 'Content-Type: application/json' -d '{}'   # 400 "At least one field"
```

Console mein har request ke liye ek JSON log line dikhegi (requestId ke saath), aur response header mein `X-Request-Id`.

**Frontend connection**

Frontend mein tum `react-hook-form` + `zodResolver` se form validate karte ho -- user experience ke liye. **Backend validation uska replacement nahi hai**: koi bhi `curl` se frontend bypass kar sakta hai. Same zod schema monorepo mein share karna
ek acchi practice hai (par backend hamesha apna validation chalata hai). Backend ke `details[].path` ko form field errors se map karna bhi easy hai (`path: "title"`).

**Real-world scenario**

Payment API: amount `"100"` (string) ya `-5` ya `1e21` aaye to ledger corrupt ho sakta hai. Validation boundary pe `amount: z.number().int().positive().max(...)` hota hai, currency `z.enum`, aur unknown keys reject.
Validation fail hone pe request DB tak pahunchti hi nahi.

**Interview answer:** "I validate all external input at the boundary, before it reaches business logic. With zod I define a schema per endpoint for params, query and body, run safeParse in a reusable middleware, and
return a 400 with structured per-field errors. The parsed output, which is trimmed, coerced and stripped of unknown fields, is attached to the request and used by the controller instead of the raw input. This protects
the application from malformed data, mass assignment and type confusion, and gives clients consistent error messages. Validation on the frontend is only a UX improvement; the server must always validate."

**Follow-up questions**

1. *`parse` vs `safeParse`?* `parse` throw karta hai `ZodError`; `safeParse` result object return karta hai. Middleware mein `safeParse` (control flow explicit) ya `parse` + error middleware dono chalte hain.
2. *Why TypeScript is not enough?* Types erase ho jaate hain; runtime pe network input `unknown` hai. zod runtime check + type inference dono deta hai.
3. *strip vs strict for unknown keys?* Strip: silently drop (lenient, forward-compatible clients). Strict: 400 (typos pakde jaate hain, par naye clients purane server pe fail ho sakte hain). Public APIs mein strip, internal/admin mein strict common hai; yahan strict
   isliye kyunki hum seekh rahe hain aur mass-assignment dikhana chahte hain.
4. *Why are query params all strings?* URL text hai; `?limit=10` -> `'10'`. `z.coerce.number()` convert karta hai (par empty string `''` -> `0` ban sakta hai, so `.min(1)` ke saath use karo).
5. *Where do business-rule validations go (e.g. "dueDate cannot be in the past", "email already used")?* Schema mein pure shape/format checks; DB-dependent checks (uniqueness) service mein, aur uniqueness ko DB unique constraint se bhi enforce karo (race condition).
6. *Is validating `req.params.id` as UUID needed?* Haan: bad IDs ko DB tak jaane se rokta hai (cheap rejection, consistent 400 vs 404) aur logs/queries ko saaf rakhta hai.
7. *How does zod compare with Joi?* Joi imperative/class-style, mature, JS-first; zod TypeScript-first with inference, tree-shakable, composable. Dono production-grade hain; choice team convention.

**Common mistakes**

- Validating only on the frontend.
- Trusting `req.body` directly after validation (using raw instead of parsed output).
- `req.query = parsed` in Express 5 (read-only).
- `z.coerce.boolean()` for query booleans.
- Putting defaults inside a schema you later `.partial()` (PATCH resets fields).
- Returning raw zod error objects to clients (leaks internals, unstable format). Map to your own `{ in, path, code, message }`.
- Forgetting body can be `undefined` in Express 5 (schema handles it: object expected).

**Revision notes**

- Validate at the boundary; zod gives runtime validation + parsed output + inferred types.
- `safeParse`, `strictObject`, `coerce`, `refine`, `transform`; collect all issues.
- Controllers use `req.validated`; never `req.query =` in Express 5.
- No defaults in schemas that will be made partial.

### Topic 3.3 -- Sanitization: validation vs sanitization vs escaping `[ESSENTIAL]`

**Concept**

Teen alag cheezein hain jo log mix kar dete hain:

| Term | Question it answers | Example |
|------|---------------------|---------|
| **Validation** | "Kya ye data allowed form mein hai?" Reject if not. | title length 3-120, status in enum |
| **Sanitization / normalization** | "Allowed data ko clean/consistent form mein kaise laun?" | `trim()`, lowercase email, strip control chars, unicode normalize |
| **Escaping / encoding** | "Data ko ek specific output context (HTML, SQL, shell) mein safely kaise daalun?" | HTML-escape on render, parameterized SQL |

Zaroori baat: **sanitization injection attacks ka primary defense nahi hai**. SQL injection ka fix **parameterized queries** hain (Week 4-5), XSS ka fix **output encoding** (aur CSP) hai (Week 5 Day 5). "Dangerous characters strip kar do" approach fragile hai
(`O'Brien` jaise valid names toot jaate hain, aur attackers encoding tricks se bypass karte hain).

**What we do in the API**

1. **Whitelist fields** (strict schema / explicit service whitelist) -> mass assignment band.
2. **Type-check strictly** -> NoSQL operator injection band: `{"email": {"$gt": ""}}` agar `z.string()` se validate hota hai to object reject ho jaata hai (MongoDB login bypass attack ka classic example, Week 5).
3. **Normalize**: `trim()`, email lowercase, length limits (DoS: 10MB title).
4. **Do not store HTML-escaped data**: raw store karo, output context pe encode karo. Agar rich text/HTML accept karna hi hai to allow-list sanitizer library (jaise `sanitize-html`) use karo `[ADVANCED]`.
5. **Query array/object tricks (HTTP Parameter Pollution)**: `?status=a&status=b` Express mein array ban jaata hai; schema `z.enum` isse reject kar deta hai. Express 5 ka default `simple` query parser `a[b]=1` ko nested object nahi banata -- attack surface kam.
6. **Filenames / paths** (Day 6): kabhi user input ko filesystem path mein directly mat jodo.

```js
// Example: email normalization + strict type, used in Week 5 signup
const email = z.email().transform((v) => v.toLowerCase());

// Example: reject control characters and collapse whitespace in a display name
const displayName = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[^\u0000-\u001F\u007F]*$/, 'Control characters are not allowed')
  .transform((v) => v.replace(/\s+/g, ' '));
```

**Frontend connection**

React JSX by default text ko escape karta hai (isliye XSS kam hota hai); `dangerouslySetInnerHTML` wahi jagah hai jahan encoding bypass hota hai. Backend ka kaam: data ko sahi shape mein rakhna; frontend/templates ka kaam: render time pe escape karna. Defense in depth: dono.

**Real-world scenario**

Marketplace product review: user `<script>alert(1)</script>` likhta hai. Backend length/type validate karke raw text store karta hai; web frontend text ko escape karke dikhata hai; email template engine bhi auto-escape karta hai. Agar kisi admin panel mein `innerHTML` se render hua to stored XSS -- isliye encode karna render ki zimmedari hai.

**Interview answer:** "Validation rejects data that does not fit the contract, sanitization normalizes acceptable data, and escaping makes data safe for a specific output context. I rely on strict schemas, type checks and
field allow-lists at the boundary, parameterized queries for the database, and context-aware output encoding for rendering. I avoid trying to blacklist dangerous characters because it is brittle and breaks legitimate input."

**Follow-up questions**

1. *Does validation prevent SQL injection?* Nahi (fully). Type/format checks madad karte hain, par asli fix parameterized queries hain: user input kabhi SQL string mein concat nahi hota.
2. *What is NoSQL injection?* Operator objects (`$gt`, `$ne`) ko value ki jagah bhejna. Fix: strict type validation (string expected) aur Mongo query mein sirf validated primitives.
3. *Should I sanitize before storing or when displaying?* Normalize (trim, case) store se pehle; HTML-escape display ke time. Double-escaping aur lost-data problems se bachne ke liye raw store karo.
4. *What is mass assignment?* Client unexpected fields bhejke internal columns (role, ownerId) set kar de. Fix: strict schemas / explicit field whitelist.
5. *How do you limit abusive payloads?* `express.json({ limit })`, max string lengths, max array sizes, rate limiting (Week 5).

**Common mistakes**

- Escaping HTML on input and storing it (double-escaping later).
- Stripping quotes to "prevent SQL injection".
- Trusting client-side validation.
- Leaving string fields unbounded.
- Using `Object.assign(model, req.body)`.

**Revision notes**

- Validate (reject) vs sanitize (normalize) vs escape (output context).
- Injection is solved by parameterization/encoding, not blacklists.
- Strict types stop NoSQL operator injection; whitelists stop mass assignment; limits stop DoS.

### Day 3 wrap-up

**Key concepts to remember**

- Middleware: `(req, res, next)`, order = execution order, factory pattern for configurable middleware.
- zod gives runtime validation + parsed output; `safeParse`; `strictObject`; `coerce`; no defaults before `.partial()`.
- Parsed data goes to `req.validated` (Express 5: `req.query` is read-only).
- Validation vs sanitization vs escaping; mass assignment; HPP; NoSQL operator injection.
- Request id + structured access log give traceability.

**Five revision questions**

1. Explain what happens if a middleware neither calls `next()` nor sends a response.
2. Why does the validation middleware write to `req.validated` instead of `req.body`/`req.query`?
3. Why is TypeScript alone not enough for API input safety?
4. What is the difference between `.optional()` and `.nullable()` in zod and when do you need each in a PATCH body?
5. Why does `?status=a&status=b` matter for validation, and how does the schema handle it?

**Practical coding task**

Add `priority` and `status` list filters later (Day 5) -- for now, write a `rejectUnknownQuery(allowed)` middleware that returns 400 when the query string contains keys outside an allow-list, and add a zod schema
`listTasksQuery` (not yet wired) with `status`, `priority` enums. Test with `?status=done&status=todo` and `?foo=1`. Then write 5 failing-input curl cases for POST /tasks and record the `details` your API returns for each.

**Self-assessment checklist**

- [ ] Every Task route validates params and/or body; no controller reads raw `req.body`.
- [ ] I get the same JSON error shape for every validation failure.
- [ ] I can explain the zod 4 `.default()` + `.partial()` pitfall.
- [ ] I can explain why `z.coerce.boolean()` is dangerous.
- [ ] Logs show a JSON line per request and responses carry `X-Request-Id`.

---

## Day 4 (Day 18) -- Centralized error handling, authentication middleware

**Time plan (about 2h)**

| Activity | Min |
|----------|-----|
| Read: error taxonomy, centralized handler | 30 |
| Read: authentication middleware, 401 vs 403 | 25 |
| Build: AppError, error middleware, auth, ownership | 55 |
| Revision questions + wrap-up | 10 |

**Learning objectives**

- Operational errors vs programmer errors; custom error classes (`AppError` family) aur ek hi jagah (central handler) pe response banana.
- Express error-middleware ki 4-argument signature, `next(err)`, `headersSent`, Express 5 async behavior.
- Consistent error response format (code, message, details, requestId); production mein stack leak na karna.
- Bearer-token authentication middleware, `req.user`, authorization (roles) middleware, ownership checks.
- 401 vs 403 vs 404 ka practical decision.

**Questions to revise (question bank):** Category 3 (Express/API design): error handling; Category 6 later (auth). Coding: `EX-ERR-*` (async error handling), `EX-MW-*`.

### Topic 4.1 -- Centralized error handling `[ESSENTIAL]`

**Concept**

Do tarah ki errors hoti hain:

- **Operational errors**: expected runtime failures -- invalid input, resource not found, DB connection timeout, upstream 503. Inhe handle karke sahi status code ke saath client ko batana hai.
- **Programmer errors**: bugs -- `undefined.title`, wrong function args. Inhe "fix the code" se theek karte hain; client ko generic 500 milta hai, aur logs/alerts mein full detail jaati hai. Process ko kabhi-kabhi restart karna safe hota hai (Week 6).

**Centralized handling** ka matlab: controllers/services mein `res.status(...).json(error)` bikhra hua nahi; wo bas `throw new NotFoundError(...)` karte hain, aur **ek error-handling middleware** poori mapping
(error -> status code + JSON shape + logging) karta hai. Fayde: consistent format, ek jagah security (stack leak nahi), ek jagah logging.

**Why it matters**

Har endpoint apna error format banaye to frontend har jagah alag parsing likhega. Interview mein "centralized error handling kaise karte ho?" lagbhag guaranteed question hai.

**Internal working**

- Error-handling middleware ka signature `(err, req, res, next)` hota hai. Express function ki `length` dekhta hai: 4 args = error handler. **`next` use na bhi karo to declare karo.**
- Jab koi handler `next(err)` call kare (ya Express 5 mein throw/reject kare), Express baaki normal handlers skip karke stack ke **agle error handler** pe jaata hai. Isliye error handler **sabse last** register hota hai.
- Agar response ka header pehle hi bhej diya gaya ho (`res.headersSent === true`, jaise streaming beech mein) to `next(err)` se Express ke default handler ko do; wo connection close kar dega -- tum naya response nahi bhej sakte.
- Express ka default error handler (agar tum kuch nahi lagate): status `err.status` ya 500, aur development mein stack trace HTML mein. Production (`NODE_ENV=production`) mein stack hide.
- body-parser errors (`express.json()`) `err.type` ke saath aate hain: `entity.parse.failed` (400), `entity.too.large` (413). Inhe humein **map** karna padega warna client ko Express ka format milega.
- Express 5: async handlers ke reject automatic forward hote hain. **Lekin** callbacks/event emitters (jaise `setTimeout`, `stream.on('error')`) mein throw hua error Express ko nahi milta -- wahan manually `next(err)`
  ya `try/catch` chahiye.
- Process-level safety net: `process.on('unhandledRejection')` / `uncaughtException` sirf **last resort logging + graceful exit** ke liye hain, normal error handling nahi (Week 2 Day 5, Week 6 Day 5).

**Error classes**

`src/errors/AppError.js`

```js
// Base class for expected (operational) errors. The central handler trusts status/code/message of these.
export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details, cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(details, message = 'Request validation failed') {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id) {
    super(id ? `${resource} ${id} not found` : `${resource} not found`, { status: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Request conflicts with current state') {
    super(message, { status: 409, code: 'CONFLICT' });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload too large') {
    super(message, { status: 413, code: 'PAYLOAD_TOO_LARGE' });
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported media type') {
    super(message, { status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' });
  }
}
```

`Error` ka `cause` option (ES2022) original error ko chain karne deta hai -- wrap karte waqt context nahi khota.

**The central middleware**

`src/middleware/notFound.js`

```js
import { NotFoundError } from '../errors/AppError.js';

// Reached only when no route matched. Goes through the same error pipeline as everything else.
export function notFound(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}
```

`src/middleware/errorHandler.js` (Day 6 extends it for multer errors)

```js
import { AppError } from '../errors/AppError.js';
import { config } from '../config/env.js';

// Translate any thrown value into a safe HTTP error description.
function toHttpError(err) {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }
  // Errors raised by express.json() (body-parser)
  if (err?.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  }
  if (err?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }
  // Anything else is a bug or an unknown failure: never expose its message.
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Too late to send a new response (e.g. mid-stream): let Express close the connection.
  if (res.headersSent) return next(err);

  const { status, code, message, details } = toHttpError(err);

  const logLine = {
    level: status >= 500 ? 'error' : 'warn',
    msg: 'request failed',
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    code,
  };
  if (status >= 500) {
    logLine.err = { name: err?.name, message: err?.message, stack: err?.stack };
  }
  console.error(JSON.stringify(logLine));

  if (status === 401) res.set('WWW-Authenticate', 'Bearer');

  const body = { error: { code, message, requestId: req.id } };
  if (details) body.error.details = details;
  // Developer convenience only; never in production.
  if (status >= 500 && config.nodeEnv === 'development') body.error.stack = err?.stack;

  res.status(status).json(body);
}
```

**Refactor existing code to throw instead of responding**

`src/middleware/validate.js` (Day 4 version: delegates to the central handler)

```js
import { ValidationError } from '../errors/AppError.js';

const PARTS = ['params', 'query', 'body'];

export function validate(schemas) {
  return (req, res, next) => {
    const details = [];
    req.validated = {};

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (result.success) {
        req.validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({
            in: part,
            path: issue.path.join('.') || '(root)',
            code: issue.code,
            message: issue.message,
          });
        }
      }
    }

    if (details.length > 0) return next(new ValidationError(details));
    next();
  };
}
```

`src/middleware/requireJson.js` (route-level: reject non-JSON bodies with 415)

```js
import { UnsupportedMediaTypeError } from '../errors/AppError.js';

// req.is() returns: a string if the body matches, false if a body exists but does not match,
// and null if the request has no body. We only reject the "false" case; an empty body is handled by validation (400).
export function requireJson(req, res, next) {
  if (req.is('application/json') === false) {
    throw new UnsupportedMediaTypeError('Content-Type must be application/json');
  }
  next();
}
```

Service ab domain error throw karti hai -- HTTP ke baare mein kuch nahi jaanti (sirf "ye error type").

### Topic 4.2 -- Authentication middleware `[ESSENTIAL]`

**Concept**

- **Authentication (authn)**: "tum kaun ho?" -- identity verify karna. Fail -> **401**.
- **Authorization (authz)**: "tum ye karne ke allowed ho?" -- permission check. Fail -> **403**.

Auth middleware har protected request pe credential verify karke `req.user` set karta hai. Is week mein hum **Bearer token (JWT)** verify karne wala middleware likhte hain; signup/login, password hashing (bcrypt), refresh tokens, sessions-vs-JWT,
RBAC ka poora design **Week 5 Day 3-4** mein aayega. Abhi ke liye token **dev script** se banayenge taaki middleware ki practice ho sake.

**JWT ka minimum (full detail Week 5 Day 3)**

`header.payload.signature` -- teen base64url parts. Payload mein claims hote hain (`sub` = user id, `role`, `exp` = expiry). Signature (HS256 = HMAC-SHA256 with a shared secret) se server verify karta hai ki token tamper nahi hua. **JWT signed hai, encrypted
nahi**: payload koi bhi base64-decode karke padh sakta hai, isliye usme secrets/passwords kabhi nahi.

**Why it matters**

Har protected API ko isse guzarna padta hai. Bugs yahan = security incidents (algorithm confusion, missing expiry check, tokens in logs).

**Internal working (our middleware)**

1. `Authorization` header padho: `Bearer <token>`. Missing/malformed -> `UnauthorizedError`.
2. `jwt.verify(token, secret, { algorithms: ['HS256'] })` -- signature + `exp` check. **`algorithms` explicitly whitelist karo** (default behaviors par depend mat karo; `alg: none` / algorithm-confusion attacks se bachao).
3. Payload se `req.user = { id: sub, role }` set karo (sirf zaroori fields).
4. Fail ke har case (bad signature, expired, malformed) mein **same generic 401** do -- attacker ko detail nahi.
5. `next()`.

Sync `throw` middleware mein bhi Express catch karta hai (v4 aur v5 dono; async hone par hi v4 mein problem thi).

`src/middleware/authenticate.js`

```js
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';

export function authenticate(req, res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    // Expired, tampered, wrong algorithm, malformed: same answer for all (cause kept for logs).
    throw new UnauthorizedError('Invalid or expired token');
  }

  if (typeof payload.sub !== 'string' || !['user', 'admin'].includes(payload.role)) {
    throw new UnauthorizedError('Invalid token claims');
  }

  req.user = { id: payload.sub, role: payload.role };
  next();
}
```

`src/middleware/authorize.js` (role gate factory)

```js
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) throw new UnauthorizedError(); // programmer safety: authenticate must run first
    if (!allowedRoles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}
```

**Ownership (object-level authorization)**

Role check kaafi nahi: user A ko user B ka task nahi dikhna chahiye (**IDOR** -- Insecure Direct Object Reference, OWASP ka top risk). Ye check service mein hota hai, har read/write pe. Hum yahan **404** return karte hain (403 nahi) taaki
attacker ko pata na chale ki wo ID exist karti hai.

**Dev token script** (production mein tokens login endpoint se aate hain -- Week 5)

`scripts/make-token.js`

```js
import jwt from 'jsonwebtoken';

const [, , userId = 'user-1', role = 'user'] = process.argv;
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is not set. Run with: node --env-file=.env scripts/make-token.js');

console.log(jwt.sign({ role }, secret, { subject: userId, expiresIn: '1h', algorithm: 'HS256' }));
```

**Config (rewritten with zod: fail fast on bad configuration)**

`src/config/env.js` (Day 4 version)

```js
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  jwtSecret: env.JWT_SECRET,
};
```

Setup:

```bash
npm i zod jsonwebtoken     # zod was installed on Day 3
node -p "crypto.randomBytes(48).toString('base64url')"   # generate a secret; put it in .env as JWT_SECRET=...
```

`.env.example` mein `JWT_SECRET=replace-with-a-long-random-string-of-at-least-32-chars` rakho; asli `.env` commit mat karo.

**Wire it all together**

`src/routes/v1/index.js`

```js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { tasksRouter } from './tasks.routes.js';
import { adminRouter } from './admin.routes.js';

export const v1Router = Router();

// Public routes (login/signup in Week 5) would be mounted HERE, before the gate.

// Everything below requires a valid token. Gate at router level so a new route cannot forget it.
v1Router.use(authenticate);

v1Router.use('/tasks', tasksRouter);
v1Router.use('/admin', adminRouter);
```

`src/routes/v1/admin.routes.js`

```js
import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import * as adminController from '../../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.use(authorize('admin'));
adminRouter.get('/stats', adminController.stats);
```

`src/controllers/admin.controller.js`

```js
import * as tasksService from '../services/tasks.service.js';

export async function stats(req, res) {
  res.json({ data: await tasksService.statsByStatus() });
}
```

`src/routes/v1/tasks.routes.js` (adds `requireJson` on body routes)

```js
import { Router } from 'express';
import * as tasksController from '../../controllers/tasks.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireJson } from '../../middleware/requireJson.js';
import { createTaskBody, updateTaskBody, idParams } from '../../schemas/task.schema.js';

export const tasksRouter = Router();

tasksRouter.get('/', tasksController.list);
tasksRouter.post('/', requireJson, validate({ body: createTaskBody }), tasksController.create);
tasksRouter.get('/:id', validate({ params: idParams }), tasksController.getOne);
tasksRouter.patch('/:id', requireJson, validate({ params: idParams, body: updateTaskBody }), tasksController.update);
tasksRouter.delete('/:id', validate({ params: idParams }), tasksController.remove);
```

`src/controllers/tasks.controller.js` (Day 4: no more inline 404s; `req.user` goes to the service)

```js
import * as tasksService from '../services/tasks.service.js';

export async function list(req, res) {
  const tasks = await tasksService.listTasks(req.user);
  res.json({ data: tasks });
}

export async function create(req, res) {
  const task = await tasksService.createTask(req.user, req.validated.body);
  res.status(201).location(`${req.baseUrl}/${task.id}`).json({ data: task });
}

export async function getOne(req, res) {
  const task = await tasksService.getTask(req.user, req.validated.params.id);
  res.json({ data: task });
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

`src/services/tasks.service.js` (Day 4: ownership + domain errors)

```js
import { randomUUID } from 'node:crypto';
import * as tasksRepo from '../repositories/tasks.repository.js';
import { NotFoundError } from '../errors/AppError.js';

const UPDATABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

const isAdmin = (user) => user.role === 'admin';

// Returns the task if the caller may access it. Missing OR someone else's -> same 404 (no existence leak).
async function getAccessibleTask(user, id) {
  const task = await tasksRepo.findById(id);
  if (!task || (!isAdmin(user) && task.ownerId !== user.id)) {
    throw new NotFoundError('Task', id);
  }
  return task;
}

export async function listTasks(user) {
  const all = await tasksRepo.findAll();
  return isAdmin(user) ? all : all.filter((task) => task.ownerId === user.id);
}

export async function getTask(user, id) {
  return getAccessibleTask(user, id);
}

export async function createTask(user, input) {
  const now = new Date().toISOString();
  return tasksRepo.insert({
    id: randomUUID(),
    title: input.title,
    description: input.description ?? '',
    status: 'todo',
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
    ownerId: user.id, // from the verified token, never from the body
    attachments: [],
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTask(user, id, input) {
  await getAccessibleTask(user, id);
  const patch = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in input) patch[field] = input[field];
  }
  return tasksRepo.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteTask(user, id) {
  await getAccessibleTask(user, id);
  await tasksRepo.remove(id);
}

export async function statsByStatus() {
  const counts = { todo: 0, in_progress: 0, done: 0 };
  for (const task of await tasksRepo.findAll()) counts[task.status] += 1;
  return counts;
}
```

`src/app.js` (Day 4: 404 + error handler registered last)

```js
import express from 'express';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { v1Router } from './routes/v1/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(requestLogger);
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  app.use('/api/v1', v1Router);

  app.use(notFound);
  app.use(errorHandler); // must be last

  return app;
}
```

Optional safety net in `src/server.js` (log and exit; do not try to "continue" after an unknown state -- Week 6 explains why):

```js
process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({ level: 'fatal', msg: 'unhandledRejection', reason: String(reason) }));
  process.exit(1);
});
```

**Test it**

```bash
export JWT_SECRET=...   # same as in .env (or just use --env-file as below)
USER1=$(node --env-file=.env scripts/make-token.js user-1 user)
USER2=$(node --env-file=.env scripts/make-token.js user-2 user)
ADMIN=$(node --env-file=.env scripts/make-token.js admin-1 admin)

curl -i localhost:3000/api/v1/tasks                                    # 401 + WWW-Authenticate: Bearer
curl -i -H "Authorization: Bearer garbage" localhost:3000/api/v1/tasks # 401 (invalid token)
curl -i -X POST localhost:3000/api/v1/tasks -H "Authorization: Bearer $USER1" \
  -H 'Content-Type: application/json' -d '{"title":"Owned by user-1"}'  # 201, ownerId=user-1
curl -i -H "Authorization: Bearer $USER2" localhost:3000/api/v1/tasks/<id-from-above>   # 404 (not yours)
curl -i -H "Authorization: Bearer $USER1" localhost:3000/api/v1/admin/stats             # 403
curl -i -H "Authorization: Bearer $ADMIN" localhost:3000/api/v1/admin/stats             # 200
curl -i -X POST localhost:3000/api/v1/tasks -H "Authorization: Bearer $USER1" \
  -H 'Content-Type: application/json' -d '{bad'                         # 400 INVALID_JSON (body-parser error mapped)
curl -i -X POST localhost:3000/api/v1/tasks -H "Authorization: Bearer $USER1" \
  -H 'Content-Type: text/plain' -d 'hello'                              # 415
curl -i localhost:3000/does-not-exist                                   # 404 via NotFoundError, same JSON shape
```

Bonus: ek route mein `throw new Error('boom')` daal ke dekho: client ko generic 500 + requestId milega (development mein `stack` bhi), aur log line mein pura stack.

**Frontend connection**

Axios interceptors: response interceptor `error.response.status === 401` pe refresh/redirect karta hai; `error.response.data.error.code` se UI messages choose hote hain; `requestId` ko "Contact support" dialog mein dikhana
support ko logs tak seedha pahunchata hai. Consistent error shape = frontend mein ek hi `handleApiError()`.

**Real-world scenario**

Banking API: statement endpoint `GET /accounts/:id/statements`. Authentication middleware token verify karta hai; service check karti hai ki `account.ownerId === req.user.id` (warna 404). Admin/support role ke liye alag
route `authorize('support')` ke peeche. Unexpected DB error pe client ko generic 500 + requestId; logs mein SQL error -- customer ko kabhi table/column naam nahi dikhna chahiye.

**Interview answer (error handling):** "I use custom error classes for expected failures, such as validation, not found and conflict errors, and I throw them from services and middleware. A single error-handling middleware, registered last, maps any
error to an HTTP status and a consistent JSON body containing a machine-readable code, a safe message, optional details and the request id. Unknown errors become a generic 500, with the full stack logged but never returned to the client in
production. In Express 5, rejected promises in async handlers reach this middleware automatically, and I also handle body-parser errors like invalid JSON and oversized payloads."

**Interview answer (authentication middleware):** "My auth middleware reads the Bearer token from the Authorization header, verifies the JWT signature and expiry with an explicit algorithm allow-list, and attaches a minimal user object to the request. Failures return 401 with a
generic message. Authorization is a separate step: role checks happen in a reusable middleware that returns 403, and object-level ownership checks happen in the service, where I return 404 for resources the user does not own to avoid leaking their existence."

**Follow-up questions**

1. *How do you identify an error handler in Express?* Four parameters `(err, req, res, next)`. Register after all routes.
2. *What if the error handler itself throws?* Express ke default handler tak jaata hai; isliye handler simple rakho aur logging mein try/catch lagao.
3. *Operational vs programmer errors, and what do you do for each?* Operational: handle, respond with proper 4xx/5xx. Programmer: log, generic 500, fix; unknown state mein process restart (supervised) safe hota hai.
4. *Why not `res.status(500).json({ error: err.message })`?* `err.message` mein DB queries, paths, internals aa sakte hain -- information disclosure.
5. *Express 4 vs 5 async errors?* v4 mein wrapper (`asyncHandler`) ya `express-async-errors` chahiye tha; v5 mein built-in.
6. *401 vs 403?* 401 authentication fail (WWW-Authenticate ke saath); 403 authenticated but not allowed. Ownership miss par 404 bhi acceptable (existence leak se bachne ke liye).
7. *Where should the token be stored on the client, and what is the risk?* Cookie (HttpOnly) vs memory vs localStorage -- XSS/CSRF trade-offs (Week 5 Day 4).
8. *Why whitelist `algorithms` in `jwt.verify`?* Algorithm-confusion attacks (`none`, RS256->HS256) se bachne ke liye.
9. *What is IDOR?* Insecure Direct Object Reference: user ID/URL badalke doosre ka data access kar lena jab server ownership check na kare.

**Common mistakes**

- Error handler registered before routes, or with 3 args (never runs as error handler).
- Sending `err.message`/stack to clients in production.
- Different error formats from different endpoints.
- `try/catch` in every controller (Express 5 does not need it; do it only when you must translate/clean up).
- Throwing strings (`throw 'x'`) -- no stack, no class.
- Sending a response in the error handler after headers were sent.
- Reading `userId` from `req.body` instead of the verified token.
- Returning 403 vs 404 inconsistently and leaking existence.
- Logging full tokens or Authorization headers.
- Weak/short JWT secret or hard-coded secret in code.

**Revision notes**

- Throw domain errors; one central 4-arg handler last; map known errors, hide unknown ones; include requestId.
- `res.headersSent` -> `next(err)`.
- Authn = 401 (who?), authz = 403 (allowed?), ownership miss -> 404.
- `jwt.verify` with explicit `algorithms`; generic 401; `req.user` minimal; gate at router level.

### Day 4 wrap-up

**Key concepts to remember**

- Operational vs programmer errors; `AppError` hierarchy; central error middleware (4 args, last).
- Body-parser errors need mapping; `headersSent` rule; no stack leaks.
- Bearer/JWT verification with algorithm allow-list; authenticate -> authorize -> ownership.
- IDOR prevention through service-level ownership checks.
- Fail-fast config validation with zod.

**Five revision questions**

1. Walk through what happens when a service throws `NotFoundError` inside an async controller in Express 5.
2. Why must the error handler have exactly four parameters and be registered last?
3. What is the difference between 401, 403 and 404 for "user reads another user's task" and which would you choose?
4. Why do we return the same message for expired, tampered and malformed tokens?
5. What is IDOR and where in this codebase is it prevented?

**Practical coding task**

Add a `ConflictError` use: forbid changing a task from `done` back to `todo` (business rule in `updateTask`) and return 409 with code `INVALID_STATE_TRANSITION`. Then add an unhandled-error test route (only when `NODE_ENV=development`) that throws and
confirm the client sees a generic message while the log contains the stack. Write down the exact JSON for 400, 401, 403, 404, 409, 415 and 500 responses of your API.

**Self-assessment checklist**

- [ ] All errors from my API share one JSON shape with `code`, `message`, `requestId`.
- [ ] `GET /tasks` without token -> 401 with `WWW-Authenticate`.
- [ ] User 2 cannot read, update or delete user 1's task (404).
- [ ] Admin-only route returns 403 for a normal user.
- [ ] Invalid JSON returns 400 `INVALID_JSON`, not an HTML page.
- [ ] I can explain why `jwt.verify` is called with `algorithms`.

---

## Day 5 (Day 19) -- Pagination, filtering, sorting, API versioning

**Time plan (about 2h)**

| Activity | Min |
|----------|-----|
| Read: pagination (offset vs cursor), filter/sort design | 35 |
| Read: API versioning and deprecation | 15 |
| Build: query schema, repository query, v1 offset list, v2 cursor list, seed script | 55 |
| Revision questions + wrap-up | 15 |

**Learning objectives**

- Offset (page/limit) vs cursor (keyset) pagination: kaise kaam karte hain, trade-offs, kab kaunsa.
- Filtering aur sorting ko safely design karna (whitelist), kyunki sort fields SQL `ORDER BY` mein jaate hain.
- Response mein pagination metadata kaise do (`meta`, headers).
- API versioning strategies, breaking vs non-breaking changes, deprecation headers.
- Task API ka `GET /tasks` poori tarah feature-complete banana (Stage 2 -> Stage 5 ka frontend-facing part).

**Questions to revise (question bank):** Category 3 (Express/API design): pagination, filtering, versioning; Category 4 (SQL) for `LIMIT/OFFSET` later. Coding: `EX-EXP-*` (pagination/filter endpoint).

### Topic 5.1 -- Pagination `[ESSENTIAL]`

**Concept**

Collection endpoint (`GET /tasks`) ko kabhi "saare records ek saath" return nahi karna chahiye -- memory, DB, network teeno pe load. **Pagination** result ko chhote pages mein deta hai.

Do mukhya strategies:

| | Offset pagination | Cursor (keyset) pagination |
|---|---|---|
| Request | `?page=3&limit=20` (ya `offset=40`) | `?limit=20&cursor=<opaque>` |
| SQL | `ORDER BY ... LIMIT 20 OFFSET 40` | `WHERE (sort key) after cursor ORDER BY ... LIMIT 21` |
| Jump to page N | Haan | Nahi (sirf next/prev) |
| Total count / total pages | Easy (extra `COUNT(*)`) | Usually nahi |
| Performance on deep pages | Slow: DB `OFFSET` rows scan karke discard karta hai (O(offset)) | Stable: index se seedha seek |
| Consistency under inserts/deletes | Rows skip ya duplicate ho sakti hain (list shift hoti hai) | Stable |
| Best for | Admin tables, small/medium data, "page numbers" UI | Infinite scroll, feeds, large/high-write tables, public APIs |

**Why it matters**

Interview mein "offset pagination ki dikkat kya hai?" ek favourite question hai. Production mein 10 lakh rows pe `OFFSET 900000` bahut slow hota hai (Week 4 Day 6 mein EXPLAIN se dekhenge).

**Internal working**

*Offset*: server `offset = (page - 1) * limit` nikalta hai. MySQL `LIMIT 20 OFFSET 900000` mein pehle 900020 rows sort/scan karta hai, phir pehli 900000 phenk deta hai. Total ke liye alag `SELECT COUNT(*)` chalta hai (filters ke saath) -- ye bhi
expensive ho sakta hai, isliye kabhi-kabhi optional rakhte hain.

*Cursor*: cursor "last item ki sort position" encode karta hai. `ORDER BY created_at DESC, id DESC` ke liye cursor = `(created_at, id)`. Agla page: "wo rows jo is position ke **baad** aati hain":

```sql
-- MySQL 8. Expanded condition (index-friendly); parameters bound with ?
SELECT id, title, created_at
FROM tasks
WHERE owner_id = ?
  AND (created_at < ? OR (created_at = ? AND id < ?))
ORDER BY created_at DESC, id DESC
LIMIT 21;   -- limit + 1 to know whether another page exists
```

Key rules: (1) sort **deterministic** hona chahiye -- unique tie-breaker (`id`) zaroori, warna same `created_at` wali rows pages ke beech duplicate/miss ho jaati hain; (2) `(owner_id, created_at, id)` jaisa index (Week 4); (3) cursor **opaque**
rakho (base64url JSON) taaki client uska format na samjhe aur tum badal sako. Cursor ko validate karo (tampered ho sakta hai) -- chunki filters/ownership server-side lagte hain, tamper karne se sirf position badalti hai, data access nahi.

Hum `limit + 1` rows fetch karte hain: extra row mili to `hasMore = true`, aur wo extra row response mein nahi bhejte.

**Code (our Task API)**: neeche "Build" section mein v1 = offset, v2 = cursor.

**Frontend connection**

React Query `useInfiniteQuery` cursor APIs ke saath natural hai (`getNextPageParam: (last) => last.nextCursor`). Page-number table (MUI DataGrid jaisa) offset se easy hota hai. Frontend ko `meta.total` ya `nextCursor` chahiye -- isliye envelope `{ data, meta }`.

**Real-world scenario**

Marketplace "My orders": 50 orders, offset theek hai. Payments ledger/transaction history: crores of rows, constant inserts -> cursor (`created_at`, `id`) warna user ko duplicate/missing transactions dikhte hain jab wo page 2 par ho aur naye transactions aa jaayein.

**Interview answer:** "Offset pagination uses LIMIT and OFFSET. It is simple and allows jumping to a page and showing totals, but the database must scan and discard all skipped rows, so deep pages get slow, and concurrent inserts can cause duplicates or gaps. Cursor, or keyset, pagination uses the last
seen sort key as a cursor, for example created_at plus id, and queries rows after that position using an index. It is stable and fast on large or frequently changing tables but cannot jump to arbitrary pages. I choose offset for small admin-style lists and cursor for feeds and large datasets, always with a deterministic sort and a maximum page size."

**Follow-up questions**

1. *Why add `id` to the sort for cursor pagination?* `created_at` unique nahi hota; tie hone par ordering undefined ho jaati hai aur rows miss/duplicate hoti hain. `id` unique tie-breaker deta hai.
2. *How do you return total count cheaply?* Optional `?includeTotal=true`, cached/approximate counts, ya total hata ke sirf `hasMore`. `COUNT(*)` large tables pe expensive hai.
3. *Max page size?* Hamesha cap lagao (jaise 100) -- warna `limit=1000000` se DoS.
4. *Where do you put pagination info?* Body mein `meta`/`pageInfo`, ya headers (`X-Total-Count`, `Link` with `rel="next"` -- RFC 8288). Hum dono me se body ko primary rakhte hain aur `X-Total-Count` extra deta hain.
5. *How to paginate with sorting by a non-unique, nullable column (like `dueDate`)?* Cursor mein sort column ka value + id encode karo; NULL ordering consistent rakho (ya NULLs ko alag handle karo). Complex hai -- isliye cursor APIs aksar limited fixed sorts support karte hain.
6. *Can the cursor be tampered with?* Haan agar unsigned hai. Isse security nahi tootti kyunki ownership/filters server side lagte hain; strict sensitivity ho to HMAC se sign karo.

**Common mistakes**

- No max limit; no default limit.
- Offset on huge tables.
- Non-deterministic `ORDER BY` (no tie-breaker) causing flaky pages.
- Returning raw arrays (no meta).
- Calculating `page` from user input without validating it is a positive integer.
- Using `skip(page*limit)` with `page` starting at 0/1 confusion (off-by-one).

**Revision notes**

- Offset = easy, page jumps, slow deep pages, unstable under writes. Cursor = fast, stable, no jumps.
- Always cap `limit`, deterministic sort with unique tie-breaker, fetch `limit + 1`.
- Cursor opaque + validated.

### Topic 5.2 -- Filtering and sorting `[ESSENTIAL]`

**Concept**

Filtering = query params se result narrow karna (`?status=done&priority=high&q=report`). Sorting = `?sort=-createdAt,title` (leading `-` = descending). Ye conventions common hain; consistent raho.

Design conventions:

| Need | Convention |
|------|------------|
| Equality filters | `?status=done` |
| Search text | `?q=report` (contains/full-text; full-text index Week 4) |
| Ranges | flat names: `?dueBefore=...&dueAfter=...` (Express 5 default `simple` parser `due[lt]=` nested object nahi banata) |
| Multiple values | `?status=todo,in_progress` (comma) ya repeated key; ek chuno aur document karo |
| Sort | `?sort=-createdAt,title` |
| Sparse fields (advanced) | `?fields=id,title` |

**Why it matters (security angle)**

Sort/filter column names user se aate hain. **SQL mein identifiers (column names) bind parameters se nahi bheje ja sakte** -- `ORDER BY ?` column nahi, ek constant string treat hota hai. Isliye developers string concat karte hain aur **SQL injection** ho jata hai
(`?sort=id;DROP TABLE...`). Sahi tarika: **allow-list** (`SORTABLE_FIELDS`) aur usse **map** karke actual column (`createdAt -> created_at`). Hum Week 4-5 mein MySQL pe yahi pattern use karenge; abhi se schema mein whitelist hai.

**Internal working**

- Query string Express mein `req.query` (strings) banti hai. Hum zod schema se: strings -> numbers (coerce), enums validate, `sort` ko `[{ field, dir }]` array mein parse karte hain.
- Repository filters apply karta hai (abhi JS `filter`, Week 4 mein `WHERE` clauses), phir sort, phir slice (abhi) / `LIMIT OFFSET` (MySQL).
- Order of operations hamesha: **filter -> sort -> paginate**. Pehle paginate karke filter karoge to galat results.
- Nulls: `dueDate` null wali rows ko sort mein hamesha last rakhna ek sensible default hai (aur documented).

**Frontend connection**

Table headers pe click = `sort` param; filter chips = query params; URL mein state rakhna (shareable links) -- `useSearchParams` jaisa. Backend ko wahi contract dena jo frontend URL mein serialize karta hai.

**Real-world scenario**

Seller dashboard: `GET /orders?status=shipped&placedAfter=2026-10-01&sort=-total&limit=25`. Agar `sort` whitelist na ho aur `sort=password_hash` chal jaaye to information leak (ordering se bhi data infer hota hai).

**Interview answer:** "I expose filters and sorting as query parameters, validate them with a schema, and only allow a fixed list of filterable and sortable fields, mapping them to real column names, because identifiers cannot be parameterized in SQL and concatenating user input into ORDER BY is a SQL injection risk. The processing order is always filter, then sort, then paginate, with a deterministic tie-breaker so pages are stable."

**Follow-up questions**

1. *Can you use `ORDER BY ?` with a bound parameter?* Nahi -- MySQL use value (string) maanta hai, identifier nahi. Whitelist + mapping karo.
2. *How do you support multi-field sorting?* Comma-separated list, har token ko whitelist check; order given order mein apply.
3. *How would you add `price[gte]=10`?* Express 4 mein `qs` se milta tha; Express 5 mein `app.set('query parser', 'extended')` karna padega ya flat names (`priceMin`). Flat names simpler aur safer (kam attack surface).
4. *Should filters be case-insensitive?* MySQL default collation (`utf8mb4_0900_ai_ci`) case-insensitive hoti hai; JS mein hum explicitly lowercase compare karte hain.
5. *How do you keep filter + sort fast?* Indexes jo filter aur sort columns cover karein (composite index, Week 4 Day 3), warna full scan.

**Common mistakes**

- Passing `req.query` straight into a DB query/ORM `where`.
- Allowing arbitrary sort fields.
- Different naming between filters and response fields.
- Paginating before filtering.
- No tie-breaker in sort.

**Revision notes**

- Whitelist filter/sort fields; identifiers cannot be parameterized.
- Pipeline: validate -> filter -> sort -> paginate. Deterministic tie-breaker.
- Flat range params; document null ordering.

### Topic 5.3 -- API versioning `[ESSENTIAL]`

**Concept**

Versioning = existing clients ko tode bina API ko evolve karne ka tarika. Mobile apps update nahi hoti jaldi, third-party consumers hote hain -- isliye breaking change ko naye version mein daalte hain.

**Breaking vs non-breaking**

| Non-breaking (safe in same version) | Breaking (needs new version) |
|-------------------------------------|------------------------------|
| Naya optional field response mein | Field remove / rename |
| Naya endpoint | Field type change (`id` number -> string) |
| Naya optional request param | Required param add karna |
| Naye enum values (client tolerant ho to) | Status code/semantics change |
| | Pagination style change, envelope change |

Clients ko "**tolerant reader**" banne ko bolo: unknown fields ignore karo.

**Strategies**

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URI path | `/api/v1/tasks` | Simple, visible, cache/route friendly, easy to test with curl | URL "resource identity" purity pe sawaal (theoretical) |
| Header | `Accept-Version: 2` / custom header | Clean URLs | Hidden, harder to test/cache |
| Media type | `Accept: application/vnd.taskapi.v2+json` | "Purest" REST | Tooling/complexity |
| Query param | `?version=2` | Easy | Cache keys, optional-param confusion |

Practical recommendation: **URI major version** (`/v1`, `/v2`) -- sabse common, debug-friendly. Minor/additive changes version nahi badalte.

**Internal working in Express**

- Har version ek alag `Router`; `app.use('/api/v1', v1Router)`, `app.use('/api/v2', v2Router)`.
- Business logic (services/repositories) **shared** rakho; versions sirf edges (routes, request/response mapping) mein alag hon. Warna codebase duplicate ho jaata hai.
- V2 sirf jo badla hai wo override kare aur baaki v1 routers ko reuse kare (hum yahi karenge).
- **Deprecation**: purane version ke responses mein `Deprecation` (RFC 9745) aur `Sunset` (RFC 8594) headers + `Link: <...>; rel="successor-version"` bhejo; usage logs dekhke hi band karo.

**Frontend connection**

Frontend API client mein base URL ka version (`/api/v1`) ek config constant hota hai; mobile app ke purane builds purane version pe rehte hain -- isliye backend ko ek saath 2 versions support karne padte hain. OpenAPI se generated client (Day 6) version-specific hota hai.

**Real-world scenario**

Payments API: v1 mein `amount` float tha (rounding bug). v2 mein integer minor units (paise). Dono saal bhar chale, v1 pe `Sunset` header, partners ko email, usage dashboard se v1 traffic zero hone par band.

**Interview answer:** "I version public APIs by major version in the URL, such as /api/v1, and only introduce a new version for breaking changes like removing or renaming fields or changing semantics. Additive changes stay in the same version. I keep services shared and put version differences at the routing and mapping
layer, announce deprecation with Deprecation and Sunset headers, and retire the old version only after usage data shows clients have moved."

**Follow-up questions**

1. *Why not version every small change?* Maintenance cost; additive evolution + tolerant clients se zyada changes version ke bina ho jaate hain.
2. *URI vs header versioning?* URI visible aur simple; header URLs clean rakhta hai par debug/caching mushkil. Mostly URI.
3. *How long do you support old versions?* Documented policy (e.g., 6-12 months), telemetry se decide, Sunset header se announce.
4. *How do you test two versions?* Shared service tests + contract tests per version (Week 6).
5. *Is `/health` versioned?* Nahi -- infrastructure endpoint.

**Common mistakes**

- Copy-pasting the whole codebase per version.
- Breaking changes inside the same version.
- No deprecation communication.
- Version in the response body instead of the URL/header (client cannot route).

**Revision notes**

- Breaking vs additive; URI major version; shared services; override only what changed; Deprecation + Sunset headers.

### Build: feature-complete list endpoint

**1. Install nothing new.** Add the query schemas to `src/schemas/task.schema.js` (append; `status` and `priority` constants already exist in that file):

```js
// ---- Day 5 additions ----
export const SORTABLE_FIELDS = ['createdAt', 'dueDate', 'priority', 'title'];

const sortExpression = z.string().refine(
  (value) => value.split(',').every((token) => SORTABLE_FIELDS.includes(token.replace(/^-/, ''))),
  { message: `sort must be a comma-separated list of: ${SORTABLE_FIELDS.join(', ')} (prefix a field with - for descending)` },
);

function parseSort(value) {
  return value.split(',').map((token) =>
    token.startsWith('-') ? { field: token.slice(1), dir: 'desc' } : { field: token, dir: 'asc' },
  );
}

// Offset pagination (API v1)
export const listTasksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: status.optional(),
  priority: priority.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  dueBefore: z.iso.datetime().optional(),
  sort: sortExpression.default('-createdAt').transform(parseSort),
});

// Cursor pagination (API v2): fixed sort (newest first), so no sort param.
export const listTasksCursorQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(300).optional(),
  status: status.optional(),
  priority: priority.optional(),
});
```

Note: unknown query keys are **stripped** (plain `z.object`) -- query strings mein analytics/cache-busting params (`utm_source`, `_t`) common hain, isliye yahan strict nahi.

**2. Cursor helpers** -- `src/utils/cursor.js`

```js
import { ValidationError } from '../errors/AppError.js';

// Opaque cursor = base64url(JSON). Clients must treat it as a black box.
export function encodeCursor(task) {
  return Buffer.from(JSON.stringify({ c: task.createdAt, i: task.id })).toString('base64url');
}

export function decodeCursor(cursor) {
  try {
    const { c, i } = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof c !== 'string' || typeof i !== 'string') throw new Error('bad cursor shape');
    return { createdAt: c, id: i };
  } catch {
    throw new ValidationError([
      { in: 'query', path: 'cursor', code: 'invalid_cursor', message: 'Cursor is invalid' },
    ]);
  }
}
```

**3. Repository** -- `src/repositories/tasks.repository.js` (Day 5 version; `findAll`, `findById`, `insert`, `update`, `remove` unchanged, two query functions added)

```js
const store = new Map();

const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function applyFilters(rows, { ownerId, status, priority, q, dueBefore } = {}) {
  const needle = q?.toLowerCase();
  return rows.filter(
    (task) =>
      (!ownerId || task.ownerId === ownerId) &&
      (!status || task.status === status) &&
      (!priority || task.priority === priority) &&
      (!needle || task.title.toLowerCase().includes(needle)) &&
      (!dueBefore || (task.dueDate !== null && task.dueDate < dueBefore)),
  );
}

function sortValue(task, field) {
  return field === 'priority' ? PRIORITY_RANK[task.priority] : task[field];
}

// Multi-field comparator. Nulls always last. The final id comparison is the unique tie-breaker
// that makes the order deterministic (stable pages).
function compareBy(sort) {
  return (a, b) => {
    for (const { field, dir } of sort) {
      const av = sortValue(a, field);
      const bv = sortValue(b, field);
      if (av === bv) continue;
      if (av === null) return 1;
      if (bv === null) return -1;
      return dir === 'asc' ? cmp(av, bv) : -cmp(av, bv);
    }
    return cmp(a.id, b.id);
  };
}

export async function findAll() {
  return [...store.values()];
}

export async function findById(id) {
  return store.get(id) ?? null;
}

export async function insert(task) {
  store.set(task.id, task);
  return task;
}

export async function update(id, patch) {
  const current = store.get(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  store.set(id, next);
  return next;
}

export async function remove(id) {
  return store.delete(id);
}

// Offset pagination: filter -> sort -> slice. Returns the page and the total match count.
export async function query({ filters, sort, page, limit }) {
  const matches = applyFilters([...store.values()], filters).sort(compareBy(sort));
  const offset = (page - 1) * limit;
  return { rows: matches.slice(offset, offset + limit), total: matches.length };
}

// Keyset pagination: newest first, (createdAt DESC, id DESC). Fetch limit + 1 to detect "has more".
const newestFirst = (a, b) => cmp(b.createdAt, a.createdAt) || cmp(b.id, a.id);
const isAfter = (task, after) =>
  task.createdAt < after.createdAt || (task.createdAt === after.createdAt && task.id < after.id);

export async function queryByCursor({ filters, limit, after }) {
  const sorted = applyFilters([...store.values()], filters).sort(newestFirst);
  const candidates = after ? sorted.filter((task) => isAfter(task, after)) : sorted;
  const window = candidates.slice(0, limit + 1);
  return { rows: window.slice(0, limit), hasMore: window.length > limit };
}
```

**4. Service** -- `src/services/tasks.service.js` (only these parts change; keep `getAccessibleTask`, `getTask`, `deleteTask`, `statsByStatus` as on Day 4)

```js
import { decodeCursor, encodeCursor } from '../utils/cursor.js';

// Timestamps are stored as UTC ISO strings with milliseconds. Normalise so string comparison is correct.
const toIso = (value) => (value ? new Date(value).toISOString() : value);

function scopeFilters(user, filters) {
  return { ...filters, ownerId: isAdmin(user) ? undefined : user.id };
}

export async function listTasks(user, query) {
  const { page, limit, sort, ...filters } = query;
  const { rows, total } = await tasksRepo.query({
    filters: scopeFilters(user, { ...filters, dueBefore: toIso(filters.dueBefore) }),
    sort,
    page,
    limit,
  });
  return { rows, total, page, limit };
}

export async function listTasksByCursor(user, query) {
  const { limit, cursor, ...filters } = query;
  const after = cursor ? decodeCursor(cursor) : null;
  const { rows, hasMore } = await tasksRepo.queryByCursor({
    filters: scopeFilters(user, filters),
    limit,
    after,
  });
  const last = rows.at(-1);
  return { rows, limit, hasMore, nextCursor: hasMore && last ? encodeCursor(last) : null };
}
```

Aur `createTask` / `updateTask` mein date normalisation add karo (`dueDate: toIso(input.dueDate ?? null)`; update loop ke baad `if ('dueDate' in patch) patch.dueDate = toIso(patch.dueDate);`) taaki `"...T10:00:00Z"` aur `"...T10:00:00.000Z"` ka comparison galat na ho (string compare ke liye ek fixed format chahiye; Week 4 mein DB `DATETIME` ye problem hata deta hai).

**5. Controller** -- add to `src/controllers/tasks.controller.js` (replace `list`, add `listCursor`)

```js
export async function list(req, res) {
  const { rows, total, page, limit } = await tasksService.listTasks(req.user, req.validated.query);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.set('X-Total-Count', String(total));
  res.json({ data: rows, meta: { page, limit, total, totalPages } });
}

// API v2: different envelope (breaking change vs v1) -> that is exactly why it is a new version.
export async function listCursor(req, res) {
  const { rows, limit, hasMore, nextCursor } = await tasksService.listTasksByCursor(req.user, req.validated.query);
  res.json({ items: rows, page: { limit, hasMore, nextCursor } });
}
```

**6. Routes** -- `src/routes/v1/tasks.routes.js` (only the list line changes)

```js
import { createTaskBody, updateTaskBody, idParams, listTasksQuery } from '../../schemas/task.schema.js';
// ...
tasksRouter.get('/', validate({ query: listTasksQuery }), tasksController.list);
```

`src/routes/v2/index.js`

```js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { listTasksCursorQuery } from '../../schemas/task.schema.js';
import * as tasksController from '../../controllers/tasks.controller.js';
import { tasksRouter } from '../v1/tasks.routes.js';
import { adminRouter } from '../v1/admin.routes.js';

export const v2Router = Router();
v2Router.use(authenticate);

// v2 overrides only what changed (list) and falls through to the unchanged v1 handlers.
const v2Tasks = Router();
v2Tasks.get('/', validate({ query: listTasksCursorQuery }), tasksController.listCursor);
v2Tasks.use(tasksRouter);

v2Router.use('/tasks', v2Tasks);
v2Router.use('/admin', adminRouter);
```

`src/middleware/deprecate.js`

```js
// Announce that a version is deprecated and when it will be removed (RFC 9745 Deprecation, RFC 8594 Sunset).
export function deprecate({ deprecatedAt, sunsetAt, successor }) {
  const deprecationHeader = `@${Math.floor(new Date(deprecatedAt).getTime() / 1000)}`;
  const sunsetHeader = new Date(sunsetAt).toUTCString();

  return (req, res, next) => {
    res.set('Deprecation', deprecationHeader);
    res.set('Sunset', sunsetHeader);
    if (successor) res.append('Link', `<${successor}>; rel="successor-version"`);
    next();
  };
}
```

`src/app.js` -- replace the single `app.use('/api/v1', v1Router);` line with:

```js
import { v2Router } from './routes/v2/index.js';
import { deprecate } from './middleware/deprecate.js';
// ...
  app.use(
    '/api/v1',
    deprecate({ deprecatedAt: '2027-01-01T00:00:00Z', sunsetAt: '2027-12-31T23:59:59Z', successor: '/api/v2/tasks' }),
    v1Router,
  );
  app.use('/api/v2', v2Router);
```

(Real projects deprecation headers tab lagate hain jab v2 stable ho; yahan sirf mechanism dikhane ke liye wired hai.)

**7. Seed script** -- `scripts/seed.js` (creates 45 tasks through the real API, so it also exercises auth + validation)

```js
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const token = process.env.TOKEN;
if (!token) throw new Error('Set TOKEN first: TOKEN=$(node --env-file=.env scripts/make-token.js user-1 user)');

const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
const priorities = ['low', 'medium', 'high'];

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

for (let i = 1; i <= 45; i += 1) {
  const { data } = await call('POST', '/api/v1/tasks', {
    title: `Seed task ${String(i).padStart(2, '0')}`,
    priority: priorities[i % 3],
    dueDate: i % 4 === 0 ? null : new Date(Date.UTC(2026, 10, 1 + (i % 28))).toISOString(),
  });
  if (i % 3 === 0) await call('PATCH', `/api/v1/tasks/${data.id}`, { status: 'done' });
  if (i % 3 === 1) await call('PATCH', `/api/v1/tasks/${data.id}`, { status: 'in_progress' });
}
console.log('seeded 45 tasks');
```

**Try it**

```bash
export TOKEN=$(node --env-file=.env scripts/make-token.js user-1 user)
node scripts/seed.js

H="Authorization: Bearer $TOKEN"
curl -s -H "$H" "localhost:3000/api/v1/tasks?page=2&limit=10"                          # meta.page=2, totalPages=5
curl -s -H "$H" "localhost:3000/api/v1/tasks?status=done&priority=high&sort=-dueDate,title"
curl -s -H "$H" "localhost:3000/api/v1/tasks?q=seed%201&limit=3"
curl -i -H "$H" "localhost:3000/api/v1/tasks?limit=1000"                                # 400 (max 100)
curl -i -H "$H" "localhost:3000/api/v1/tasks?sort=ownerId"                              # 400 (not allow-listed)
curl -i -H "$H" "localhost:3000/api/v1/tasks?status=done&status=todo"                   # 400 (array is not an enum)
curl -si -H "$H" "localhost:3000/api/v1/tasks" | head -20                               # see Deprecation/Sunset/X-Total-Count headers

# v2 cursor flow
curl -s -H "$H" "localhost:3000/api/v2/tasks?limit=5"                  # copy page.nextCursor
curl -s -H "$H" "localhost:3000/api/v2/tasks?limit=5&cursor=<paste>"   # next 5, no duplicates
curl -i -H "$H" "localhost:3000/api/v2/tasks?cursor=garbage"           # 400 invalid_cursor
```

**Interview concepts demonstrated:** offset vs cursor, deterministic sort, allow-listed sort fields, `limit + 1` technique, API versioning with shared services, deprecation headers.

**Interview answer (design a paginated list endpoint):** "I accept page, limit, filters and sort as validated query parameters, cap the limit, and apply filter, sort and pagination in that order with a unique tie-breaker so results are stable. I return the items together with pagination metadata. For large or fast-changing data I switch to cursor pagination
based on an indexed sort key and return an opaque next cursor. Sortable columns come from an allow-list mapped to real column names, never from raw user input."

**Frontend connection (this day):** `meta.totalPages` drives page buttons; `page.nextCursor` drives `useInfiniteQuery`; `Deprecation`/`Sunset` headers can be surfaced by an API client wrapper as console warnings in development.

**Real-world scenario (this day):** Admin panel "All orders" uses `v1` offset (page jumps needed). The mobile feed uses `v2` cursor (infinite scroll, new items constantly arriving).

**Common mistakes (build-specific)**

- Forgetting to normalise date formats before string comparison.
- Applying `ownerId` scoping after pagination (leaks counts/data) -- scope in the same filter step.
- Mutating the repository's array with `.sort()` on the store's values (we copy with spread first).
- Letting `limit` default to "all".

### Day 5 wrap-up

**Key concepts to remember**

- Offset (page/limit/total, slow deep pages, unstable) vs cursor (keyset, opaque cursor, `limit + 1`, tie-breaker).
- Filter -> sort -> paginate. Whitelist sort/filter fields; identifiers cannot be parameterized.
- Max/default `limit`; envelope with `meta` or `page`.
- Breaking vs additive changes; URI versioning; shared services; Deprecation + Sunset.

**Five revision questions**

1. Why is `OFFSET 900000` slow in MySQL and how does keyset pagination avoid it?
2. What goes wrong if the sort order is not deterministic across pages?
3. Why can't you write `ORDER BY ?` with a bound parameter, and what do you do instead?
4. Give three examples each of breaking and non-breaking API changes.
5. How would you retire `/api/v1` safely?

**Practical coding task**

Add `dueAfter` (ISO datetime) to the v1 filters and an `includeTotal=false` option that skips computing `total` and omits it from `meta` (returns `hasNext` instead). Then add `GET /api/v2/tasks?sort=...` support for exactly one extra
fixed sort, `-updatedAt`, by making the cursor carry `updatedAt` -- document in comments why arbitrary sorts are hard with cursors.

**Self-assessment checklist**

- [ ] `/api/v1/tasks` supports page, limit, status, priority, q, dueBefore, sort with proper 400s.
- [ ] `/api/v2/tasks` pages through all seeded items with no duplicates and no gaps.
- [ ] I can write the SQL for both pagination styles from memory.
- [ ] I can explain why `id` is the tie-breaker.
- [ ] I can list at least four versioning strategies with trade-offs.

---

## Day 6 (Day 20) -- File uploads, API docs (OpenAPI/Swagger), CORS, request lifecycle debugging

**Time plan (about 2h)**

| Activity | Min |
|----------|-----|
| Read: multipart, multer, upload security | 25 |
| Read: OpenAPI basics | 15 |
| Read: CORS and debugging | 25 |
| Build: attachments, CORS, OpenAPI docs | 45 |
| Revision questions + wrap-up | 10 |

**Learning objectives**

- Multipart/form-data kaise kaam karta hai; multer (memory vs disk storage, limits, fileFilter, errors).
- File upload security: size limits, allow-list, magic-byte check, random filenames, path traversal, safe download headers.
- OpenAPI 3.1 ka structure; Swagger UI se docs serve karna; zod schemas se JSON Schema generate karna.
- CORS ko samajhna: same-origin policy, simple vs preflight requests, credentials, common errors, middleware order.
- Request lifecycle debugging ka systematic tareeka (curl, request id, DEBUG logs, symptom table).

**Questions to revise (question bank):** Category 3 (Express/API design): file upload, CORS, API docs; Category 6 (security) overlap with CORS. Coding: `EX-MW-*`, `EX-DEBUG-*`.

### Topic 6.1 -- File uploads with multer `[ESSENTIAL]`

**Concept**

Browser file bhejne ke liye `multipart/form-data` use karta hai: body ko ek **boundary** string se parts mein baanta jaata hai; har part ke apne headers (field name, filename, content type) aur raw bytes hote hain.

```
POST /api/v1/tasks/ID/attachments HTTP/1.1
Content-Type: multipart/form-data; boundary=----XYZ

------XYZ
Content-Disposition: form-data; name="file"; filename="report.pdf"
Content-Type: application/pdf

%PDF-1.7 ...raw bytes...
------XYZ--
```

`express.json()` multipart nahi samajhta. **multer** (busboy ke upar bana middleware) multipart stream parse karta hai, files ko disk/memory pe rakhta hai, `req.file` / `req.files` aur text fields `req.body` mein deta hai. Hum **multer 2.x** use karte hain (1.x mein
known DoS vulnerabilities thi jo 2.x mein fix hui; naye code mein 1.x mat lo).

**Why it matters**

Upload endpoints attackers ka favourite target hain: bade files (disk/memory DoS), disguised executables, path traversal (`../../etc/passwd`), stored XSS via SVG/HTML, malware. Interview mein "file upload secure kaise karoge?" ek classic security + design question hai.

**Internal working**

- Multer request stream ko busboy se parse karta hai -- **streaming**, isliye poori file memory mein load nahi hoti (disk storage ke saath). Parsing chalte waqt limits check hoti hain; limit cross hui to stream abort aur `MulterError` (`LIMIT_FILE_SIZE`, `LIMIT_UNEXPECTED_FILE`...). Disk storage mein partial file multer
  khud delete kar deta hai.
- **Storage engines**: `diskStorage` (file turant disk pe; `req.file.path`) vs `memoryStorage` (`req.file.buffer` RAM mein). Memory storage sirf chhote files (avatar) ya jab turant S3 pe forward karna ho tab; 5 concurrent 50MB uploads = 250MB RAM. Production mein aksar direct-to-S3 presigned URL (Week 7 Day 3) hota hai taaki file Node se guzre hi nahi.
- **Order of events**: multer ka `fileFilter` file part milte hi chalta hai (content se pehle); phir bytes stream hote hain. Isliye `file.mimetype` **client ka claim** hai -- header ka `Content-Type`, jo koi bhi fake kar sakta hai. Asli check **magic bytes** (file ke pehle bytes) se hota hai: PNG = `89 50 4E 47`, JPEG = `FF D8 FF`, PDF = `25 50 44 46` ("%PDF").
- `file.originalname` bhi client-controlled hai (`../../x.sh`, control chars, bahut lamba). **Kabhi disk filename mat banao** -- random UUID + allow-listed extension use karo; original naam sirf display metadata ke roop mein, sanitize karke store karo. (Non-ASCII filenames kabhi-kabhi mangled aate hain; display name pe depend mat karo.)
- Authorization order: **upload se pehle** auth + ownership check karo, warna unauthorized user bhi disk bhar sakta hai. Isliye middleware chain: `authenticate -> validate params -> loadTask (access check) -> multer -> signature check -> controller`.
- Download: files ko **public static folder se serve mat karo**; authenticated route se `res.download()` (Content-Disposition: attachment) + `X-Content-Type-Options: nosniff`. User-uploaded HTML/SVG ko same origin se inline serve karne se stored XSS hota hai -- isliye hum SVG/HTML allow hi nahi karte.

**Config additions** -- `src/config/env.js` (final Week 3 version)

```js
import path from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // comma-separated list of allowed browser origins, e.g. http://localhost:5173,https://app.example.com
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(100).default(5),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  jwtSecret: env.JWT_SECRET,
  corsOrigins: env.CORS_ORIGINS,
  uploadDir: path.resolve(env.UPLOAD_DIR), // absolute path, resolved once
  maxUploadMb: env.MAX_UPLOAD_MB,
};
```

`.env` mein add karo: `CORS_ORIGINS=http://localhost:5173` aur (optional) `UPLOAD_DIR=uploads`, `MAX_UPLOAD_MB=5`. Install: `npm i multer cors swagger-ui-express`.

**Upload middleware** -- `src/middleware/upload.js`

```js
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import { config } from '../config/env.js';
import { UnsupportedMediaTypeError, ValidationError } from '../errors/AppError.js';

mkdirSync(config.uploadDir, { recursive: true });

// Allow-list: declared mimetype -> extension we choose + magic bytes we verify.
const ALLOWED_TYPES = new Map([
  ['image/png', { ext: '.png', magic: [0x89, 0x50, 0x4e, 0x47] }],
  ['image/jpeg', { ext: '.jpg', magic: [0xff, 0xd8, 0xff] }],
  ['application/pdf', { ext: '.pdf', magic: [0x25, 0x50, 0x44, 0x46] }],
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  // Never use file.originalname for the path: random name + extension from OUR allow-list.
  filename: (req, file, cb) => cb(null, `${randomUUID()}${ALLOWED_TYPES.get(file.mimetype).ext}`),
});

const uploader = multer({
  storage,
  limits: {
    fileSize: config.maxUploadMb * 1024 * 1024, // bytes per file
    files: 1,
    fields: 5,
    parts: 10,
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new UnsupportedMediaTypeError(`File type "${file.mimetype}" is not allowed`));
    }
    cb(null, true);
  },
});

// Expect exactly one file in the form field named "file".
export const uploadSingleFile = uploader.single('file');

// The mimetype is only a claim. Check the first bytes of what was actually written to disk.
export async function verifyFileSignature(req, res, next) {
  const { file } = req;
  if (!file) {
    throw new ValidationError([
      { in: 'body', path: 'file', code: 'required', message: 'A file is required in the "file" form field' },
    ]);
  }

  const { magic } = ALLOWED_TYPES.get(file.mimetype);
  const head = Buffer.alloc(magic.length);
  const handle = await open(file.path, 'r');
  try {
    await handle.read(head, 0, magic.length, 0);
  } finally {
    await handle.close();
  }

  if (!magic.every((byte, index) => head[index] === byte)) {
    await unlink(file.path); // do not keep rejected files
    throw new UnsupportedMediaTypeError('File content does not match its declared type');
  }
  next();
}
```

`src/middleware/loadTask.js` (early access check, before any bytes are written)

```js
import * as tasksService from '../services/tasks.service.js';

// Throws 404 (via the service) if the task does not exist or belongs to someone else.
export async function loadTask(req, res, next) {
  req.task = await tasksService.getTask(req.user, req.validated.params.id);
  next();
}
```

**Schema + service + controller + routes**

`src/schemas/task.schema.js` -- append:

```js
export const attachmentParams = z.object({
  id: z.uuid(),
  attachmentId: z.uuid(),
});
```

`src/services/tasks.service.js` -- add (imports `path` from `node:path` at the top):

```js
import path from 'node:path';

// Display-only name: strip any directory part and control characters, cap the length.
function toDisplayName(originalName) {
  const cleaned = path.basename(String(originalName)).replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return cleaned.slice(0, 120) || 'file';
}

export async function addAttachment(user, taskId, file) {
  const task = await getAccessibleTask(user, taskId); // authorization lives in the service too
  const attachment = {
    id: randomUUID(),
    originalName: toDisplayName(file.originalname),
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
  await tasksRepo.update(taskId, {
    attachments: [...task.attachments, attachment],
    updatedAt: new Date().toISOString(),
  });
  return attachment;
}

export async function getAttachment(user, taskId, attachmentId) {
  const task = await getAccessibleTask(user, taskId);
  const attachment = task.attachments.find((item) => item.id === attachmentId);
  if (!attachment) throw new NotFoundError('Attachment', attachmentId);
  return attachment;
}
```

`src/controllers/attachments.controller.js`

```js
import path from 'node:path';
import { config } from '../config/env.js';
import * as tasksService from '../services/tasks.service.js';

export async function add(req, res) {
  const taskId = req.validated.params.id;
  const attachment = await tasksService.addAttachment(req.user, taskId, req.file);
  res
    .status(201)
    .location(`${req.baseUrl}/${taskId}/attachments/${attachment.id}`)
    .json({ data: attachment });
}

export async function download(req, res) {
  const { id, attachmentId } = req.validated.params;
  const attachment = await tasksService.getAttachment(req.user, id, attachmentId);

  res.set('X-Content-Type-Options', 'nosniff');
  // storedName is generated by us (UUID + allow-listed extension), so the path cannot escape uploadDir.
  res.download(path.join(config.uploadDir, attachment.storedName), attachment.originalName);
}
```

`src/routes/v1/tasks.routes.js` -- final Week 3 version

```js
import { Router } from 'express';
import * as tasksController from '../../controllers/tasks.controller.js';
import * as attachmentsController from '../../controllers/attachments.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireJson } from '../../middleware/requireJson.js';
import { loadTask } from '../../middleware/loadTask.js';
import { uploadSingleFile, verifyFileSignature } from '../../middleware/upload.js';
import {
  createTaskBody,
  updateTaskBody,
  idParams,
  listTasksQuery,
  attachmentParams,
} from '../../schemas/task.schema.js';

export const tasksRouter = Router();

tasksRouter.get('/', validate({ query: listTasksQuery }), tasksController.list);
tasksRouter.post('/', requireJson, validate({ body: createTaskBody }), tasksController.create);
tasksRouter.get('/:id', validate({ params: idParams }), tasksController.getOne);
tasksRouter.patch('/:id', requireJson, validate({ params: idParams, body: updateTaskBody }), tasksController.update);
tasksRouter.delete('/:id', validate({ params: idParams }), tasksController.remove);

// Order matters: validate id -> check access -> parse multipart -> verify content -> handler.
tasksRouter.post(
  '/:id/attachments',
  validate({ params: idParams }),
  loadTask,
  uploadSingleFile,
  verifyFileSignature,
  attachmentsController.add,
);
tasksRouter.get(
  '/:id/attachments/:attachmentId',
  validate({ params: attachmentParams }),
  attachmentsController.download,
);
```

**Error handler: map multer and http-errors** -- `src/middleware/errorHandler.js` (replace `toHttpError`, add the import; rest of the file unchanged)

```js
import multer from 'multer';
import { AppError } from '../errors/AppError.js';
import { config } from '../config/env.js';

const MULTER_ERRORS = {
  LIMIT_FILE_SIZE: { status: 413, code: 'FILE_TOO_LARGE', message: `File exceeds the ${config.maxUploadMb} MB limit` },
  LIMIT_UNEXPECTED_FILE: { status: 400, code: 'UNEXPECTED_FILE_FIELD', message: 'Send exactly one file in the "file" field' },
  LIMIT_FILE_COUNT: { status: 400, code: 'TOO_MANY_FILES', message: 'Only one file is allowed' },
};

function toHttpError(err) {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof multer.MulterError) {
    return MULTER_ERRORS[err.code] ?? { status: 400, code: 'UPLOAD_ERROR', message: 'Invalid upload request' };
  }
  if (err?.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  }
  if (err?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }
  // Safe 4xx errors created by libraries (http-errors / send, e.g. a missing file on download) carry expose = true.
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 && err.expose === true) {
    return { status: err.status, code: 'HTTP_ERROR', message: err.message };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' };
}
```

**Test uploads**

```bash
TOKEN=$(node --env-file=.env scripts/make-token.js user-1 user)
ID=<a task id of user-1>

# any small PNG or PDF on your disk
curl -i -H "Authorization: Bearer $TOKEN" -F "file=@./logo.png" localhost:3000/api/v1/tasks/$ID/attachments            # 201
curl -i -H "Authorization: Bearer $TOKEN" -F "file=@./notes.txt;type=text/plain" localhost:3000/api/v1/tasks/$ID/attachments   # 415 (type)
echo "not really a png" > fake.png
curl -i -H "Authorization: Bearer $TOKEN" -F "file=@./fake.png;type=image/png" localhost:3000/api/v1/tasks/$ID/attachments     # 415 (magic bytes mismatch)
curl -i -H "Authorization: Bearer $TOKEN" -F "wrong=@./logo.png" localhost:3000/api/v1/tasks/$ID/attachments                   # 400 unexpected field
curl -i -H "Authorization: Bearer $TOKEN" -o out.png localhost:3000/api/v1/tasks/$ID/attachments/<attachment-id>               # download
```

**Frontend connection**

```js
const form = new FormData();
form.append('file', fileInput.files[0]);   // field name must match the server ("file")
await fetch(`/api/v1/tasks/${id}/attachments`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type: the browser adds the boundary
  body: form,
});
```

React mein upload progress ke liye `fetch` ke bajay `XMLHttpRequest`/Axios `onUploadProgress` use hota hai. Client-side size/type check UX ke liye hai; server check security ke liye.

**Real-world scenario**

KYC upload (bank): PAN/Aadhaar scan PDF/JPEG. Server size limit, allow-list, magic-byte check, random name, private storage (S3 private bucket) aur access sirf signed/authenticated URL se. Antivirus scan async queue mein (Week 7). Agar user-supplied filename path mein use ho to
`../../app/server.js` overwrite jaisa attack possible hai.

**Interview answer:** "For uploads I use multer for multipart parsing with disk storage or streaming to object storage, and I enforce a file size limit, file count limit and an allow-list of types. Because the declared MIME type is client-controlled, I also verify magic bytes. I never use the client filename on disk: I generate a random name, store the original only as sanitized
metadata, and keep files outside any public static directory. Access is authenticated, downloads use Content-Disposition attachment and nosniff, and I run the authorization check before the upload is accepted. For large files I would use presigned URLs so the file goes straight to object storage."

**Follow-up questions**

1. *memoryStorage vs diskStorage?* Memory: simple, RAM-heavy, chhote files ya forward-to-S3; disk: streaming, kam RAM, par cleanup chahiye. Dono mein size limits lagao.
2. *Why is `mimetype` not trustworthy?* Request header ka part hai, client set karta hai. Magic bytes/content inspection (ya `file-type` library) se verify karo.
3. *How do you stop path traversal?* Client filename disk path mein kabhi nahi; generated name; resolved path upload dir ke andar ho ye assert karo.
4. *How do you handle large files (GBs)?* Presigned URL se direct-to-storage, multipart/resumable upload; API sirf metadata + signed URL deta hai (Week 7 Day 3).
5. *What about virus scanning?* Upload ke baad async scan (ClamAV/cloud service) queue ke through; scan complete hone tak file "pending" state mein.
6. *Why must the access check come before multer?* Warna unauthorized user bhi bytes bhej ke disk/CPU consume kar sakta hai.
7. *Why not serve uploads with `express.static`?* Public, unauthenticated access aur browser content sniffing / stored XSS risk; authenticated download route + nosniff behtar.
8. *What does multer do when the size limit is exceeded?* Stream abort, partial file delete (disk storage), `MulterError('LIMIT_FILE_SIZE')` -> hum 413 map karte hain.

**Common mistakes**

- Trusting `file.mimetype`/extension.
- Using `originalname` as filename.
- No `limits` (disk/memory DoS).
- Serving uploads from a public folder, including SVG/HTML.
- Setting `Content-Type: multipart/form-data` manually in fetch.
- Doing auth after multer.
- Leaving orphan files when later steps fail (use cleanup in error paths / periodic janitor).
- Storing files on one app instance's local disk when running multiple instances (use shared/object storage).

**Revision notes**

- multipart + boundary; multer (busboy); disk vs memory; limits + fileFilter + magic bytes; random filenames; auth first; private storage; nosniff + attachment; presigned URLs for large files.

### Topic 6.2 -- API documentation with OpenAPI (Swagger) `[ESSENTIAL]`

**Concept**

**OpenAPI Specification (OAS)** REST APIs ko describe karne ka machine-readable standard hai (YAML/JSON). **Swagger UI** (aur Redoc) us spec se interactive docs page banate hain jahan se "Try it out" se API call kar sakte ho. "Swagger" aksar OpenAPI ke liye bolchal ka naam hai; spec ka naam OpenAPI hai (current: 3.1, JSON Schema 2020-12 ke aligned).

**Why it matters**

Docs ek contract hain: frontend/mobile/partners bina backend dev se poochhe integrate kar sakte hain. Spec se tooling milti hai: client SDK/type generation (`openapi-typescript`), mock servers, Postman import, contract tests, linting. Interview mein "API ko document kaise karte ho?" common hai.

**Structure of an OpenAPI document**

| Section | Purpose |
|---------|---------|
| `openapi` | Spec version (`3.1.0`) |
| `info` | Title, version, description |
| `servers` | Base URLs (dev/staging/prod) |
| `paths` | Har path + method: parameters, requestBody, responses |
| `components` | Reusable parts: `schemas`, `parameters`, `responses`, `securitySchemes` |
| `security` | Default auth requirement (`bearerAuth`) |
| `tags` | Grouping in the UI |

References `$ref: '#/components/schemas/Task'` se duplication kam hoti hai.

**Approaches**

- **Design-first**: pehle spec likho/review karo, phir code. Teams ke beech contract ke liye best.
- **Code-first**: code se spec generate (decorators, schemas). Spec drift kam; par design review late hota hai.
- **Hybrid (hum yahi karte hain)**: request body schemas **zod se auto-generate** (`z.toJSONSchema`, zod 4) taaki validation aur docs ek source se aayein; paths/responses hand-written. Alternatives: `@asteasolutions/zod-to-openapi`, `swagger-jsdoc` (JSDoc comments se).

Honest note: hand-written spec **drift** ho jaata hai (code badle, docs nahi). Mitigations: schemas ko share karo (zod), contract tests (Week 6), CI mein spec lint, aur PR checklist.

**Our spec** -- `src/docs/openapi.js`

```js
import { z } from 'zod';
import {
  createTaskBody,
  updateTaskBody,
  TASK_STATUSES,
  TASK_PRIORITIES,
  SORTABLE_FIELDS,
} from '../schemas/task.schema.js';

// Generate JSON Schema from the same zod schemas used for validation (single source of truth).
function jsonSchemaOf(schema) {
  const { $schema, ...rest } = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' });
  return rest;
}

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schemaRef) => ({ 'application/json': { schema: schemaRef } });
const errorResponse = (description) => ({ description, content: jsonBody(ref('ErrorResponse')) });

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Task API',
    version: '1.0.0',
    description: 'Small task management API built during Week 3 of the Node.js interview preparation.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  tags: [{ name: 'System' }, { name: 'Tasks' }, { name: 'Attachments' }, { name: 'Admin' }],
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Liveness check',
        security: [],
        responses: {
          200: {
            description: 'Service is running',
            content: jsonBody({
              type: 'object',
              properties: { status: { type: 'string', examples: ['ok'] }, uptimeSeconds: { type: 'integer' } },
            }),
          },
        },
      },
    },
    '/api/v1/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks (offset pagination)',
        description: 'Non-admin users only see their own tasks. Order: filter, then sort, then paginate.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: TASK_STATUSES } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: TASK_PRIORITIES } },
          { name: 'q', in: 'query', description: 'Case-insensitive title search', schema: { type: 'string', maxLength: 100 } },
          { name: 'dueBefore', in: 'query', schema: { type: 'string', format: 'date-time' } },
          {
            name: 'sort',
            in: 'query',
            description: `Comma-separated fields, prefix with - for descending. Allowed: ${SORTABLE_FIELDS.join(', ')}.`,
            schema: { type: 'string', default: '-createdAt', examples: ['-dueDate,title'] },
          },
        ],
        responses: {
          200: {
            description: 'A page of tasks',
            headers: { 'X-Total-Count': { description: 'Total matching tasks', schema: { type: 'integer' } } },
            content: jsonBody({
              type: 'object',
              required: ['data', 'meta'],
              properties: {
                data: { type: 'array', items: ref('Task') },
                meta: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            }),
          },
          400: errorResponse('Invalid query parameters'),
          401: errorResponse('Missing or invalid token'),
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        requestBody: { required: true, content: jsonBody(ref('CreateTaskRequest')) },
        responses: {
          201: {
            description: 'Task created',
            headers: { Location: { description: 'URL of the new task', schema: { type: 'string' } } },
            content: jsonBody({ type: 'object', properties: { data: ref('Task') } }),
          },
          400: errorResponse('Validation failed'),
          401: errorResponse('Missing or invalid token'),
          415: errorResponse('Content-Type must be application/json'),
        },
      },
    },
    '/api/v1/tasks/{id}': {
      parameters: [{ $ref: '#/components/parameters/TaskId' }],
      get: {
        tags: ['Tasks'],
        summary: 'Get one task',
        responses: {
          200: { description: 'The task', content: jsonBody({ type: 'object', properties: { data: ref('Task') } }) },
          400: errorResponse('Invalid id'),
          401: errorResponse('Missing or invalid token'),
          404: errorResponse('Task not found (or not owned by the caller)'),
        },
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Update some fields of a task',
        requestBody: { required: true, content: jsonBody(ref('UpdateTaskRequest')) },
        responses: {
          200: { description: 'Updated task', content: jsonBody({ type: 'object', properties: { data: ref('Task') } }) },
          400: errorResponse('Validation failed'),
          401: errorResponse('Missing or invalid token'),
          404: errorResponse('Task not found'),
          415: errorResponse('Content-Type must be application/json'),
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        responses: {
          204: { description: 'Deleted' },
          400: errorResponse('Invalid id'),
          401: errorResponse('Missing or invalid token'),
          404: errorResponse('Task not found'),
        },
      },
    },
    '/api/v1/tasks/{id}/attachments': {
      parameters: [{ $ref: '#/components/parameters/TaskId' }],
      post: {
        tags: ['Attachments'],
        summary: 'Upload one attachment (PNG, JPEG or PDF)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                // format: binary renders a file picker in Swagger UI
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Attachment stored',
            headers: { Location: { schema: { type: 'string' } } },
            content: jsonBody({ type: 'object', properties: { data: ref('Attachment') } }),
          },
          400: errorResponse('Missing file or wrong field name'),
          401: errorResponse('Missing or invalid token'),
          404: errorResponse('Task not found'),
          413: errorResponse('File too large'),
          415: errorResponse('File type not allowed or content does not match type'),
        },
      },
    },
    '/api/v1/tasks/{id}/attachments/{attachmentId}': {
      parameters: [
        { $ref: '#/components/parameters/TaskId' },
        { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        tags: ['Attachments'],
        summary: 'Download an attachment',
        responses: {
          200: {
            description: 'File bytes (Content-Disposition: attachment)',
            content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
          },
          401: errorResponse('Missing or invalid token'),
          404: errorResponse('Task or attachment not found'),
        },
      },
    },
    '/api/v1/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Task counts per status (admin only)',
        responses: {
          200: {
            description: 'Counts',
            content: jsonBody({
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: { todo: { type: 'integer' }, in_progress: { type: 'integer' }, done: { type: 'integer' } },
                },
              },
            }),
          },
          401: errorResponse('Missing or invalid token'),
          403: errorResponse('Caller is not an admin'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    parameters: {
      TaskId: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    },
    schemas: {
      CreateTaskRequest: jsonSchemaOf(createTaskBody),
      UpdateTaskRequest: jsonSchemaOf(updateTaskBody),
      Task: {
        type: 'object',
        required: ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'ownerId', 'attachments', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: TASK_STATUSES },
          priority: { type: 'string', enum: TASK_PRIORITIES },
          dueDate: { type: ['string', 'null'], format: 'date-time' },
          ownerId: { type: 'string' },
          attachments: { type: 'array', items: ref('Attachment') },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Attachment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          originalName: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: 'integer', description: 'Bytes' },
          uploadedAt: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', examples: ['VALIDATION_ERROR'] },
              message: { type: 'string' },
              requestId: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    in: { type: 'string', enum: ['params', 'query', 'body'] },
                    path: { type: 'string' },
                    code: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
```

(`storedName` ko intentionally response schema se bahar rakha: internal detail hai. Aaj hamari service attachment object mein `storedName` return karti hai -- practical task mein isse response se hatana hai.)

**Frontend connection**

Spec se `npx openapi-typescript http://localhost:3000/openapi.json -o api-types.ts` jaisa command TypeScript types banata hai -- frontend aur backend ke beech type-safe contract. Swagger UI frontend devs ke liye living documentation hai; Postman mein spec import ho jaata hai.

**Real-world scenario**

Partner integration: payments team 3rd-party merchants ko `/docs` + downloadable `openapi.json` deti hai. Merchant apna SDK generate kar leta hai. Breaking change hone par spec diff (CI mein `oasdiff` jaisa tool) PR ko fail kar deta hai.

**Interview answer:** "I document REST APIs with OpenAPI. The spec lists paths, parameters, request and response schemas, error formats and the security scheme, and Swagger UI renders it as interactive documentation. To avoid drift, I generate request schemas from the same validation schemas used in code, and I validate the spec and run contract tests in CI. The spec also enables client generation and mocking."

**Follow-up questions**

1. *Swagger vs OpenAPI?* OpenAPI = specification; Swagger = tooling brand (Swagger UI, Editor, Codegen) -- pehle spec ka bhi naam Swagger tha.
2. *Design-first vs code-first?* Design-first contract review aur parallel frontend/backend work; code-first drift kam. Hybrid common.
3. *How do you keep docs in sync?* Schema generation from validators, contract tests, CI lint/diff, ownership in PR checklist.
4. *How do you describe auth?* `components.securitySchemes` + `security`; Bearer JWT = `type: http, scheme: bearer, bearerFormat: JWT`.
5. *Should `/docs` be public in production?* Internal APIs mein protect karo (auth/VPN) ya disable; public APIs mein public docs theek, par "Try it out" ko restrict karo.

**Common mistakes**

- Docs written once and never updated.
- Not documenting error responses.
- Missing auth scheme, so "Try it out" always 401s.
- Examples with real data/secrets.
- Exposing internal-only endpoints in public docs.

**Revision notes**

- OpenAPI = paths + components + security; Swagger UI = renderer; generate schemas from zod; guard against drift; docs enable client generation.

### Topic 6.3 -- CORS `[ESSENTIAL]`

**Concept**

**Same-Origin Policy (SOP)**: browser JavaScript ko doosre **origin** (scheme + host + port) ke response ko padhne se rokta hai. `http://localhost:5173` (React dev server) -> `http://localhost:3000` (API) alag origin hai (port alag).
**CORS (Cross-Origin Resource Sharing)** ek mechanism hai jisse **server** response headers se browser ko batata hai "haan, ye origin mere response ko padh sakta hai".

Zaroori baatein jo log galat samajhte hain:

1. CORS **browser enforce** karta hai. `curl`, Postman, server-to-server calls pe CORS nahi lagta. Isliye "Postman mein chal raha hai par browser mein nahi" classic symptom hai.
2. CORS **security feature nahi hai API ko protect karne ka**; ye browser mein *other sites ke JS* se user ka data padhne se rokta hai. Authentication/authorization ka replacement nahi.
3. Simple cross-origin request (jaise form-style POST) **server tak pahunch jaati hai aur side effects ho jaate hain**; browser sirf response padhne se rokta hai. (Isliye CSRF alag problem hai, Week 5.)

**Simple vs preflighted requests**

- **Simple request**: method GET/HEAD/POST, aur sirf safelisted headers, aur `Content-Type` sirf `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`. Seedha bheji jaati hai; response mein `Access-Control-Allow-Origin` na ho to JS ko response nahi milta.
- **Preflighted request**: jab method PUT/PATCH/DELETE ho, ya custom/`Authorization` header ho, ya `Content-Type: application/json` ho. Browser pehle ek **`OPTIONS`** request bhejta hai:

```
OPTIONS /api/v1/tasks HTTP/1.1
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization,content-type
```

Server ko 2xx (usually 204) ke saath ye headers dene hote hain:

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Request-Id
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
Vary: Origin
```

Preflight pass hone ke baad hi asli request jaati hai. `Max-Age` se browser preflight cache karta hai (browsers cap lagate hain; Chrome ~2 ghante).

| Header | Meaning |
|--------|---------|
| `Access-Control-Allow-Origin` | Kaun sa origin allowed (ek specific origin ya `*`) |
| `Access-Control-Allow-Methods` / `-Headers` | Preflight answer |
| `Access-Control-Allow-Credentials: true` | Cookies/Authorization-with-credentials mode allowed. **`*` origin ke saath allowed nahi** |
| `Access-Control-Expose-Headers` | Custom response headers jo JS padh sakti hai (`X-Total-Count`, `X-Request-Id`) |
| `Access-Control-Max-Age` | Preflight cache seconds |
| `Vary: Origin` | Jab origin dynamically reflect karte ho, caches ko batata hai |

**Why it matters**

Frontend se backend integrate karte hi sabse pehla error CORS hota hai. Galat fix (`origin: '*'` + credentials, ya har origin reflect karna) security hole banata hai. Interview mein "CORS kya hai, preflight kyun hota hai, aur galat config ka risk?" almost guaranteed hai.

**Internal working in Express**

- `cors` package ek middleware hai: request ka `Origin` header dekhta hai, allowed hai to response headers set karta hai; `OPTIONS` preflight ko khud `204` se answer karke chain end kar deta hai (default `preflightContinue: false`).
- **Order**: CORS middleware **auth se pehle** lagao, kyunki preflight mein `Authorization` header nahi hota -- auth pehle ho to preflight 401 se fail. Aur CORS middleware **error handler ke response par bhi** headers laga sake isliye routes se pehle ho: warna 401/500 responses mein CORS headers na hone se browser console mein
  "CORS error" dikhta hai aur asli error (401/500) chhup jaata hai -- debugging misleading.
- Origin ko **allow-list** (env se) se compare karo; `*` sirf truly public, credential-less APIs ke liye.
- Dev mein alternate: frontend dev server ka proxy (Vite `server.proxy`) -- browser ko same-origin lagta hai, CORS ki zaroorat nahi. Production mein aksar frontend aur API ek hi domain pe reverse proxy ke peeche hote hain.

**Final `src/app.js`** (end of Week 3)

```js
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { deprecate } from './middleware/deprecate.js';
import { v1Router } from './routes/v1/index.js';
import { v2Router } from './routes/v2/index.js';
import { openApiSpec } from './docs/openapi.js';

const allowedOrigins = new Set(config.corsOrigins);

const corsOptions = {
  // Requests without an Origin header (curl, server-to-server) are not CORS requests: let them through.
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Total-Count', 'Content-Disposition'],
  credentials: true,
  maxAge: 600,
};

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // app.set('trust proxy', 1); // enable when running behind exactly one reverse proxy (nginx / ALB)

  app.use(requestId);
  app.use(requestLogger);
  app.use(cors(corsOptions)); // before auth, before routes: handles preflight and decorates error responses
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  app.get('/openapi.json', (req, res) => res.json(openApiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use(
    '/api/v1',
    deprecate({ deprecatedAt: '2027-01-01T00:00:00Z', sunsetAt: '2027-12-31T23:59:59Z', successor: '/api/v2/tasks' }),
    v1Router,
  );
  app.use('/api/v2', v2Router);

  app.use(notFound);
  app.use(errorHandler); // last

  return app;
}
```

Check: `http://localhost:3000/docs` kholo -> "Authorize" pe `make-token.js` ka token daalo -> endpoints try karo. (Helmet jaisa strict CSP lagane par Swagger UI ke inline scripts block ho sakte hain -- Week 5 mein docs route pe CSP relax karte hain.)

**Test CORS from the terminal** (browser jaisa preflight khud simulate karo)

```bash
# allowed origin: expect 204 and Access-Control-Allow-* headers
curl -i -X OPTIONS localhost:3000/api/v1/tasks \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type'

# disallowed origin: expect NO Access-Control-Allow-Origin header (browser would block the response)
curl -i -X OPTIONS localhost:3000/api/v1/tasks \
  -H 'Origin: https://evil.example' \
  -H 'Access-Control-Request-Method: POST'

# error responses still carry CORS headers (401 here), so the browser shows the real 401
curl -i localhost:3000/api/v1/tasks -H 'Origin: http://localhost:5173'
```

**Frontend connection**

```js
fetch('http://localhost:3000/api/v1/tasks', {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, // => triggers preflight
  credentials: 'include',   // send cookies cross-origin (server must set Allow-Credentials + exact origin)
});
// res.headers.get('X-Total-Count') works only because the server exposes it via Access-Control-Expose-Headers
```

**Real-world scenario**

Production: React app `https://app.shop.com`, API `https://api.shop.com`. API ke allow-list mein sirf `https://app.shop.com`. Staging frontend `https://staging.shop.com` alag env var se. Kisi ne `origin: true` (reflect any) + `credentials: true` laga diya -> koi bhi malicious site logged-in user ke cookie ke saath API call karke response padh sakti hai (data theft).

**Interview answer:** "Browsers enforce the same-origin policy, and CORS is how a server opts in to letting other origins read its responses. For non-simple requests, such as JSON with an Authorization header, the browser first sends an OPTIONS preflight, and the server must answer with the allowed origin, methods and headers. I configure the cors middleware early, before authentication, with an explicit origin allow-list from
configuration, allow credentials only when needed, and expose the custom headers the client needs. CORS is enforced by browsers only and is not a substitute for authentication or CSRF protection."

**Follow-up questions**

1. *Why does Postman work but the browser fails?* CORS sirf browser enforce karta hai.
2. *Why can't you use `*` with credentials?* Spec manta hai ki credentialed requests ke liye explicit origin chahiye, warna har site user ke credentials se data padh sakti.
3. *What is a preflight and how can you reduce its cost?* `OPTIONS` check; `Access-Control-Max-Age` se cache; ya same-origin proxy se avoid.
4. *Why do I see a CORS error when the server actually returned 500/401?* Error response mein CORS headers nahi the (CORS middleware late tha/crash pehle hua) -- browser asli response chhupa deta hai. Network tab mein status dekho.
5. *Is CORS a protection against CSRF?* Nahi: simple requests (form POST) server tak pahunchti hain. CSRF ke liye SameSite cookies, CSRF tokens, Origin check (Week 5 Day 5).
6. *How do you allow multiple origins dynamically?* Allow-list se compare karke matching origin reflect karo (aur `Vary: Origin`); wildcard subdomain patterns careful regex se.

**Common mistakes**

- `origin: '*'` with `credentials: true`, or reflecting any origin with credentials.
- Registering CORS after auth or after routes.
- Forgetting to expose custom headers.
- Trying to "fix" CORS on the frontend.
- Allowing `null` origin.
- Assuming CORS secures the API.

**Revision notes**

- SOP vs CORS; browser-enforced; simple vs preflight; Allow-Origin/Methods/Headers/Credentials/Expose/Max-Age; allow-list; CORS before auth; not auth/CSRF protection.

### Topic 6.4 -- Request lifecycle debugging `[ESSENTIAL]`

**Concept**

Debugging = "request kis layer pe tooti?" Ek systematic funnel use karo, guess nahi:

```
Client (DevTools/curl)  ->  DNS/TLS  ->  Proxy/LB  ->  Node server  ->  Middleware chain  ->  Handler  ->  Service  ->  DB/external
```

**Step-by-step method**

1. **Reproduce with curl** (`-v` ya `-i`) -- browser ke extras (Origin, cookies, cache) hatao. Curl chale par browser fail ho = CORS/cookies/cache issue.
2. **Read the status + body** -- status family bata deti hai layer (see table).
3. **Take the `X-Request-Id`** -> server logs mein grep. Hamare logger har request ka ek line likhta hai aur errors mein `requestId` hota hai.
4. **Check middleware order** -- request kahan tak pahunchi? Temporary log, ya `DEBUG` output.
5. **Inspect inputs** -- `Content-Type`, body, params kya aaye (Express 5: `req.body` undefined?).
6. **Use a debugger** -- `node --inspect --env-file=.env src/server.js` + VS Code "Attach", breakpoint handler/middleware mein.
7. **Isolate** -- ek-ek middleware hatao/lagao, service ko direct function ki tarah call karo.

Tools:

```bash
curl -v http://localhost:3000/api/v1/tasks -H "Authorization: Bearer $TOKEN"    # full request/response exchange
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:3000/health   # status + timing only

# Express/router internal debug logs (the `debug` package; namespaces differ slightly between Express 4 and 5)
DEBUG='express:*,router*' npm run dev            # bash
# PowerShell:  $env:DEBUG='express:*,router*'; npm run dev

node --inspect --env-file=.env src/server.js      # then open chrome://inspect or attach from VS Code
```

**Symptom table**

| Symptom | Likely cause | How to confirm |
|---------|--------------|----------------|
| Request hangs, no response | Handler/middleware did not call `next()` or send a response; infinite loop / blocked event loop | Add log at start/end of each middleware; `curl --max-time 5`; check CPU |
| 404 on a route you wrote | Wrong mount path/prefix, method mismatch, route order (`/:id` before `/stats`), trailing slash | `DEBUG=router*`; log `req.method req.originalUrl`; check `app.use` mounts |
| 400 "expected object, received undefined" | Body not parsed: missing `Content-Type: application/json`, parser registered after route, or multipart sent | `curl -v`, look at request headers; check order in `app.js` |
| 401 | Missing/malformed `Authorization`, expired token, wrong secret/algorithm | Decode payload (`jwt.io`-style, locally) and compare `exp`; check env `JWT_SECRET` |
| 403 | Role check failed | Log `req.user.role` vs allowed roles |
| 404 for a resource that "exists" | Ownership scoping (different user), wrong id | Try with admin token or same user |
| 413 | Body/file over limit | Check `limit`, `MAX_UPLOAD_MB`, proxy `client_max_body_size` (nginx default 1MB) |
| 415 | Wrong Content-Type | Request headers |
| "CORS error" in browser console | Origin not allow-listed; preflight rejected (401/404/no 2xx); credentials + `*`; header not allowed; CORS middleware after auth/crash | DevTools Network: look at the `OPTIONS` request + response headers; replay preflight with curl |
| 500 with HTML page | Error handler not registered, or registered before routes | Check `app.js` order; response `Content-Type` |
| 502 / 504 | Node down/restarting, upstream timeout, keep-alive mismatch behind LB | LB/proxy logs, `pm2 logs`/container logs, `keepAliveTimeout` |
| Works locally, fails in prod | Env var missing, different Node version, proxy/HTTPS/cookie `Secure`, CORS origin not set | Compare env; check `/health` and startup logs |
| Intermittent errors | Shared mutable state, race condition, pool exhaustion (Week 4-6) | Correlate by requestId, load test |

**Frontend connection**

DevTools Network tab: **Headers** (request/response), **Payload**, **Preview/Response**, **Timing**. "Copy as cURL" se browser request ko terminal mein replay karo -- frontend dev ke liye backend debugging ka sabse bada shortcut. Console mein CORS error aur Network mein asli status alag ho sakte hain -- hamesha Network tab dekho.

**Real-world scenario**

Customer: "Checkout fail ho raha hai." Support `X-Request-Id` maangta hai (frontend error toast mein dikhta hai). Logs mein request: `POST /orders 500`, log line mein stack: payment provider timeout. Bina request id ke wo hazaaron lines mein se ek ko dhundhna padta.

**Interview answer:** "I debug by locating the failing layer. I reproduce the request with curl to remove browser effects, read the status code and body, take the request id and search structured logs, then verify middleware order and request inputs such as content type and parsed body. If needed I attach the Node inspector, add targeted logging, or enable the debug namespaces for Express. Status codes narrow the layer: 4xx means client contract or auth,
5xx means my code or a dependency, and 502 or 504 point at the proxy-to-app connection."

**Follow-up questions**

1. *A request never completes. What do you check?* `next()` / response missing, unresolved promise (e.g. awaiting something that never resolves), event loop blocked by sync work, upstream call without timeout.
2. *How do you debug a production-only bug?* Request id + structured logs, compare env/config, reproduce with the same payload, feature flags, metrics (Week 6-7).
3. *How can you see which middleware ran?* `DEBUG=router*`, temporary logging, or a small `trace` middleware that logs `req.id` + name.
4. *What if the browser shows a CORS error?* Network tab -> check the preflight; replay with curl; verify allow-list, method/header lists, and middleware order.
5. *Why add the request id to error responses?* Support aur logs ke beech link.

**Common mistakes**

- Debugging in the browser only.
- `console.log` without request id (cannot correlate).
- Ignoring the response body of a 4xx/5xx.
- Not checking middleware order first.
- Changing many things at once.
- Logging secrets (tokens, passwords) while debugging.

**Revision notes**

- Funnel: reproduce with curl -> status -> request id/logs -> middleware order -> inputs -> debugger -> isolate.
- Symptom table; CORS errors can mask real errors; request id everywhere.

### Day 6 wrap-up

**Key concepts to remember**

- multipart/form-data + multer; disk vs memory; limits, allow-list, magic bytes, random filenames, auth before upload, private storage, `nosniff` + attachment.
- OpenAPI (paths, components, security); Swagger UI; generate schemas from zod; docs drift.
- CORS: SOP, simple vs preflight, headers, credentials rules, allow-list, middleware order, browser-only, not CSRF/auth.
- Systematic debugging with curl, request id, DEBUG logs, inspector, symptom table.

**Five revision questions**

1. Why is `file.mimetype` unsafe to trust and what do you do about it?
2. List five protections you apply to an upload endpoint.
3. What exactly triggers a CORS preflight, and what must the server answer?
4. Why must CORS middleware be registered before authentication?
5. A user reports "it works in Postman but not in the browser". Walk through your investigation.

**Practical coding task**

Add `DELETE /api/v1/tasks/:id/attachments/:attachmentId` (authorization via the service, remove the metadata from the task and delete the file with `fs/promises.unlink`, return 204; if the file is already missing on disk, still succeed). Remove `storedName` from the
attachment objects returned in API responses (map in the service, not the controller). Add the new endpoint to `openapi.js`. Finally break CORS on purpose (move `app.use(cors(...))` below `v1Router`), reproduce the preflight failure with the curl command above, and write down what you saw.

**Self-assessment checklist**

- [ ] Valid PNG/PDF uploads succeed; fake PNG, text file, wrong field, oversize file are rejected with correct codes (415, 415, 400, 413).
- [ ] Uploaded files are stored with random names and downloaded through an authenticated route.
- [ ] `/docs` loads and "Authorize" + "Try it out" works.
- [ ] I can explain a preflight request and the headers in its response.
- [ ] A disallowed origin gets no `Access-Control-Allow-Origin` header.
- [ ] I can apply the debugging funnel to a symptom without guessing.

---

## Day 7 (Day 21) -- Revision, smoke test, weekly test

**Time plan (about 2h)**

| Activity | Min |
|----------|-----|
| Rapid revision of Days 1-6 (one-liners below), speak answers aloud | 25 |
| Run and fix the end-to-end smoke script | 25 |
| Timed weekly assessment (closed notes) | 45 |
| Check answers, mark weak areas, catch up unfinished topics | 25 |

**Learning objectives**

- Week 3 ke saare topics ek baar yaad se explain kar sako.
- Apna Task API end-to-end verify karna (script se) aur jo toote use fix karna.
- Weekly test se weak areas pehchaanna aur catch-up plan banana.

### Rapid revision: one-liners (read, then cover and recite)

| Day | One-liner set |
|-----|---------------|
| 1 | Lifecycle: DNS -> TCP -> TLS -> HTTP -> proxy -> Node -> Express -> response. HTTP stateless. Safe vs idempotent. 401 vs 403. 201+Location, 204 no body. Cookie flags: HttpOnly, Secure, SameSite. Content-Type vs Accept; multipart needs multer. |
| 2 | REST = resources + methods + stateless + cacheable + uniform + layered. Plural nouns, `{ data, meta }`. Express = function + ordered layer stack; `next()`, `next(err)`. Routes -> controllers -> services -> repositories. Whitelist writable fields. |
| 3 | Middleware `(req, res, next)`; order matters; factory pattern. zod: runtime validation, `safeParse`, strict objects, coerce pitfalls, no defaults before `.partial()`. `req.validated` (Express 5 `req.query` read-only). Validate vs sanitize vs escape. |
| 4 | Throw domain errors; single 4-arg error handler last; hide internals; `requestId`. Auth middleware: Bearer, `jwt.verify` with `algorithms`, generic 401; role gate (403); ownership in service (404, IDOR). |
| 5 | Offset vs cursor; `limit + 1`; deterministic sort with `id`; whitelist sort/filter (identifiers cannot be bound); filter -> sort -> paginate. URI versioning, breaking vs additive, Deprecation + Sunset. |
| 6 | Uploads: limits, allow-list, magic bytes, random names, auth first, private storage. OpenAPI: paths + components + security; generate from zod. CORS: browser-enforced, preflight, allow-list, before auth. Debug funnel with curl + request id. |

### Project checkpoint: Stage 1 and Stage 2 of `12_Project_Task_API.md`

Neeche ke criteria tumhare code se match hone chahiye (Stage 3 se MySQL aayega, Stage 4 mein real login/RBAC):

- [ ] Stage 1: `createApp()` / `listen()` split, health check, layered folders, JSON 404, env config validated at startup.
- [ ] Stage 2: full CRUD on tasks, zod validation for params/query/body, centralized error handler with consistent JSON, request id + access log.
- [ ] Early parts of Stage 4/5: bearer auth middleware, role gate, ownership scoping, pagination/filter/sort, v1 + v2.
- [ ] Early part of Stage 7: OpenAPI at `/docs`.

### Smoke test script

Server chalao (`npm run dev`) aur dusre terminal mein:

```bash
export TOKEN=$(node --env-file=.env scripts/make-token.js user-1 user)
node scripts/smoke.js
```

`scripts/smoke.js`

```js
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const TOKEN = process.env.TOKEN;
if (!TOKEN) throw new Error('Set TOKEN to a user token (role "user")');

const authHeaders = { Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`[OK] ${name}`);
  } catch (err) {
    process.exitCode = 1;
    console.error(`[X]  ${name}\n     ${err.message}`);
  }
}

let taskId;

await check('GET /health returns 200 and status ok', async () => {
  const res = await fetch(`${BASE}/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

await check('GET /api/v1/tasks without token returns 401 with error code', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks`);
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error.code, 'UNAUTHORIZED');
});

await check('POST with invalid body returns 400 VALIDATION_ERROR with details', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ title: 'ab', unknownField: true }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.ok(body.error.details.length >= 1);
});

await check('POST with invalid JSON returns 400 INVALID_JSON', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks`, { method: 'POST', headers: jsonHeaders, body: '{bad' });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.code, 'INVALID_JSON');
});

await check('POST valid task returns 201 with Location and the task', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ title: 'Smoke test task', priority: 'high' }),
  });
  assert.equal(res.status, 201);
  assert.ok(res.headers.get('location')?.startsWith('/api/v1/tasks/'));
  const { data } = await res.json();
  assert.equal(data.status, 'todo');
  assert.equal(data.priority, 'high');
  taskId = data.id;
});

await check('GET /tasks/:id returns the task', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks/${taskId}`, { headers: authHeaders });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).data.id, taskId);
});

await check('GET /tasks/<random uuid> returns 404', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks/${crypto.randomUUID()}`, { headers: authHeaders });
  assert.equal(res.status, 404);
});

await check('PATCH status to done returns 200', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ status: 'done' }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).data.status, 'done');
});

await check('List supports filter, sort, pagination meta and X-Total-Count', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks?status=done&sort=-createdAt&limit=5`, { headers: authHeaders });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.meta.total >= 1);
  assert.equal(body.meta.limit, 5);
  assert.ok(res.headers.get('x-total-count'));
});

await check('List rejects a non-allow-listed sort field', async () => {
  const res = await fetch(`${BASE}/api/v1/tasks?sort=ownerId`, { headers: authHeaders });
  assert.equal(res.status, 400);
});

await check('v2 cursor list returns items and page info', async () => {
  const res = await fetch(`${BASE}/api/v2/tasks?limit=1`, { headers: authHeaders });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.page.limit, 1);
});

await check('Upload of a real PNG header returns 201', async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'tiny.png');
  const res = await fetch(`${BASE}/api/v1/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: authHeaders, // no Content-Type: fetch sets the multipart boundary
    body: form,
  });
  assert.equal(res.status, 201);
});

await check('Upload of a text file returns 415', async () => {
  const form = new FormData();
  form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'notes.txt');
  const res = await fetch(`${BASE}/api/v1/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: authHeaders,
    body: form,
  });
  assert.equal(res.status, 415);
});

await check('Upload with PNG mimetype but wrong content returns 415', async () => {
  const form = new FormData();
  form.append('file', new Blob(['definitely not a png'], { type: 'image/png' }), 'fake.png');
  const res = await fetch(`${BASE}/api/v1/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: authHeaders,
    body: form,
  });
  assert.equal(res.status, 415);
});

await check('DELETE returns 204 and the task is gone', async () => {
  const del = await fetch(`${BASE}/api/v1/tasks/${taskId}`, { method: 'DELETE', headers: authHeaders });
  assert.equal(del.status, 204);
  const get = await fetch(`${BASE}/api/v1/tasks/${taskId}`, { headers: authHeaders });
  assert.equal(get.status, 404);
});

console.log(`\n${passed} checks passed${process.exitCode ? ' (some FAILED)' : ''}`);
```

Note: `crypto` global Node 19+ pe available hai; Node 18 pe `import { randomUUID } from 'node:crypto'` use karo. (Node 20/22 par global theek hai.) Failure aaye to Day 6 ke symptom table se debug karo -- yehi asli practice hai. Note: `DELETE` ke baad uploaded file disk pe reh jaati hai
(orphan) -- Day 6 practical task / janitor job ka reason.

**Interview concepts demonstrated:** end-to-end verification before writing formal tests (Week 6 converts this into Jest/Vitest + Supertest).

**Spoken-answer drill (2 minutes each, aloud, record yourself)**

1. Request lifecycle in Express.
2. 401 vs 403 vs 404 and idempotent methods.
3. Centralized error handling in Express 5.
4. Validation: zod, where, why.
5. Offset vs cursor pagination.
6. Secure file upload.
7. CORS and preflight.
8. How would you debug a request that returns 500 only in production?

### Day 7 wrap-up

**Key concepts to remember:** use the one-liner table. Priority order if time is short: lifecycle + status codes, middleware + error handling, validation, auth middleware (401/403), pagination, CORS.

**Five revision questions** (do these before the assessment)

1. What changes in Express 5 compared with 4 that affect async handlers, `req.body`, `req.query` and wildcard routes?
2. Draw the middleware order of your `app.js` and justify each position.
3. What are the three states of `req.is('application/json')` and why does `requireJson` check only for `false`?
4. Why does `validate` store parsed data separately instead of overwriting `req.body`?
5. Which parts of the Task API will change when MySQL replaces the in-memory repository, and which will not?

**Practical coding task**

Convert three checks from `smoke.js` into `node:test` tests (`node --test`) that start the app on an ephemeral port (`createApp().listen(0)`), then compare how much boilerplate Supertest will remove in Week 6. Commit the project with a README that has the endpoint table from Day 2.

**Self-assessment checklist**

- [ ] Smoke script passes fully.
- [ ] Weekly test attempted closed-notes, scored, weak areas written down.
- [ ] I can recite the Week 3 one-liners without looking.
- [ ] Unfinished topics from Days 1-6 are scheduled using the catch-up plan.

---

## Week 3 revision summary

**Core ideas (what an interviewer expects you to know cold)**

1. **HTTP**: stateless request/response; methods (safe/idempotent), status codes (families, 401/403, 201/204, 409, 429), headers (Content-Type, Accept, Authorization, Cache-Control, ETag, Origin), cookies (HttpOnly/Secure/SameSite), content types (JSON, urlencoded, multipart).
2. **REST design**: resource nouns, plural, shallow nesting, correct methods/status codes, `{ data, meta }`, stable `{ error }`, statelessness -> horizontal scaling, versioning.
3. **Express**: app = function over an ordered layer stack; middleware `(req, res, next)`; `next(err)` to the 4-arg error handler; Express 5 async error forwarding, `req.body` undefined, read-only `req.query`.
4. **Layering**: routes (wiring) -> controllers (HTTP) -> services (rules) -> repositories (data); whitelist writable fields; `createApp()` separate from `listen()`.
5. **Validation/sanitization**: zod at the boundary, parsed output used, strict schemas, validate vs sanitize vs escape; injection fixed by parameterization/encoding.
6. **Errors**: operational vs programmer errors, `AppError` family, central handler, no leaks, request id.
7. **Auth middleware**: Bearer JWT verify with algorithm allow-list, 401 vs 403, ownership (IDOR) -> 404.
8. **Collections**: offset vs cursor, deterministic sort, allow-listed sort/filter, filter -> sort -> paginate, max limit.
9. **Uploads, docs, CORS**: multer limits + allow-list + magic bytes + random names; OpenAPI + Swagger UI; CORS preflight, allow-list, before auth; debugging funnel.

**Tier reminder:** Everything tagged `[ESSENTIAL]` above is interview-core. `[ADVANCED]` extras this week: signed cursors, `sanitize-html`, HATEOAS, presigned URLs, spec diffing in CI. Honest note: ye week "Express use karna" sikhata hai; production-grade rate limiting, helmet, CSRF, logging
libraries aur tests Week 5-6 mein poore honge.

---

## Week 3 assessment

Closed notes, 45 minutes. Total 24 questions: 8 Basic, 9 Intermediate, 7 Advanced. Score = 1 point per Basic, 2 per Intermediate, 3 per Advanced (max 8 + 18 + 21 = 47). Bolke ya likhke answer karo, phir answers section se compare karo.

### Basic (B1-B8)

**B1.** What is the difference between HTTP 401 and 403?

**B2.** Which of GET, POST, PUT, PATCH, DELETE are idempotent? Why does idempotency matter for clients?

**B3.** Why must an Express error-handling middleware declare four parameters, and where is it registered?

**B4.** What is `req.body` in Express 5 when a client sends JSON without a `Content-Type` header? What should your code do?

**B5.** Give two benefits of keeping business logic in a service layer instead of the controller.

**B6.** After a successful `POST /tasks` that creates a resource, which status code and which header should the response contain?

**B7.** Which cookie attribute (a) hides the cookie from JavaScript, (b) restricts it to HTTPS, (c) limits when it is sent on cross-site requests?

**B8.** Who enforces CORS: the browser, the server or the network? Does `curl` care about it?

### Intermediate (I1-I9)

**I1. Output prediction.** What does the console print for `GET /x`?

```js
app.use((req, res, next) => { console.log('1'); next(); console.log('4'); });
app.use(async (req, res, next) => { console.log('2'); await null; next(); console.log('5'); });
app.get('/x', (req, res) => { console.log('3'); res.send('ok'); });
```

**I2. Code.** Write a zod schema for a list query with `limit` (integer, default 20, max 100), `page` (integer, default 1, min 1) and `status` (enum `todo | done`, optional). Explain what `?limit=abc` and `?limit=` produce.

**I3.** Why does the `validate` middleware in this week's project write to `req.validated` instead of assigning `req.query = parsed`?

**I4.** A payments app has a transactions table with millions of rows, constantly growing, shown as an infinite-scroll list. Which pagination style and why? Write the SQL for "next page".

**I5.** The React app on `http://localhost:5173` calls `POST /api/v1/tasks` with a JSON body and an `Authorization` header. List the requests the browser sends, and explain why the preflight would fail if `authenticate` ran before `cors()`.

**I6. Find the bugs.**

```js
function errorHandler(err, req, res) { res.status(500).json({ error: err.message }); }

const app = express();
app.use(errorHandler);
app.use('/api', apiRouter);
app.use(express.json());
```

**I7.** Order these middleware for the attachment upload route and justify: `uploadSingleFile`, `authenticate`, `verifyFileSignature`, `validate({ params })`, `loadTask`.

**I8.** What is wrong with `db.query(\`SELECT * FROM tasks ORDER BY ${req.query.sort}\`)`, and what is the correct approach given that `ORDER BY ?` does not work?

**I9.** Compare PUT and PATCH. For a user requesting another user's task, would you return 403 or 404, and why?

### Advanced (A1-A7)

**A1.** Behind an AWS load balancer you see sporadic 502 errors although the Node app is healthy and CPU is low. Give the most likely cause and fix.

**A2.** Design the API-level behavior of an idempotent `POST /payments` endpoint (headers, storage, concurrency, failure cases).

**A3.** You must support cursor pagination sorted by `dueDate` ascending, where `dueDate` can be NULL and is not unique. How do you design the cursor and the SQL condition?

**A4.** Review this upload handler and list every problem:

```js
const upload = multer({ dest: 'public/uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
  fs.renameSync(req.file.path, 'public/uploads/' + req.file.originalname);
  res.json({ url: '/uploads/' + req.file.originalname });
});
```

**A5.** Explain how Express 5 forwards async errors, and give two situations where a thrown error still will not reach your error middleware.

**A6.** List five common mistakes in JWT authentication middleware and how to avoid each.

**A7.** `amount` in `GET /payments` was a float (`12.5`); you need integer minor units (`1250`). Plan the change without breaking existing clients.

---

## Answers with explanations

### Basic

**B1.** 401 = not authenticated (missing/invalid/expired credentials; send `WWW-Authenticate`). 403 = authenticated but not permitted. *Explanation:* frontend reaction differs: 401 -> login/refresh; 403 -> "access denied".

**B2.** Idempotent: GET, PUT, DELETE (and PATCH only if the operation is "set value", not guaranteed). POST is not. *Explanation:* idempotent repeated calls leave the same server state, so clients/proxies can retry after timeouts. Retrying POST can create duplicates, hence idempotency keys.

**B3.** Express identifies error handlers by `fn.length === 4` (`err, req, res, next`). It is registered after all routes (and after the 404 handler) because errors skip normal handlers and jump to the next error handler in the stack order. *Explanation:* a 3-parameter function is treated as a normal middleware and never receives the error.

**B4.** `undefined`: `express.json()` only parses when Content-Type matches. Handle it by validating the body (schema expecting an object -> 400) and/or a `requireJson` middleware returning 415 for mismatched content types. *Explanation:* Express 4 gave `{}`, hiding the problem.

**B5.** Examples: testability without HTTP, reuse from jobs/CLI/other controllers, replaceable data layer, single place for rules like ownership, thinner controllers that only translate HTTP. *Explanation:* any two are fine.

**B6.** `201 Created` plus a `Location` header with the new resource URL (and usually the created resource in the body). *Explanation:* 200 is not wrong functionally, but 201 + Location is the REST convention.

**B7.** (a) `HttpOnly`, (b) `Secure`, (c) `SameSite` (Strict/Lax/None). *Explanation:* HttpOnly mitigates token theft via XSS; Secure prevents leaking over HTTP; SameSite reduces CSRF.

**B8.** The browser. `curl`/Postman/server-to-server do not enforce it. *Explanation:* CORS is a browser policy; it controls whether JS may read cross-origin responses, so it is not an access-control mechanism for the API.

### Intermediate

**I1.** Output: `1`, `2`, `4`, `3`, `5`. *Explanation:* middleware 1 logs `1` and calls `next()` synchronously, which runs middleware 2: logs `2`, then `await null` suspends it and returns a promise, so control returns to middleware 1 which logs `4`. In the microtask, middleware 2 resumes, calls `next()` (handler logs `3` and responds), then logs `5`. The "after next()" code is therefore not a reliable timing mechanism with async middleware; use `res.on('finish')`.

**I2.**

```js
import { z } from 'zod';

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['todo', 'done']).optional(),
});
```

`?limit=abc` -> `Number('abc')` is `NaN` -> invalid number -> 400. `?limit=` -> empty string coerces to `0` -> fails `min(1)` -> 400 (this is why `.min(1)` matters; without it `0` or `''` would slip through). Missing `limit` -> default 20 (default applies on `undefined`). *Explanation:* query values are strings; coercion + range checks are required.

**I3.** In Express 5 `req.query` is a getter-only property (defined on the prototype and re-parsed from the URL), so assignment fails or is ignored. Also parsed output is a new object, and keeping raw vs validated data separate prevents accidentally using unvalidated input. *Explanation:* `req.validated.query` is the single trusted source.

**I4.** Cursor (keyset) pagination: stable under constant inserts, fast with an index, matches infinite scroll. SQL:

```sql
SELECT id, amount, created_at
FROM transactions
WHERE account_id = ?
  AND (created_at < ? OR (created_at = ? AND id < ?))
ORDER BY created_at DESC, id DESC
LIMIT 21;
```

Index `(account_id, created_at, id)`. 21 rows -> if 21 returned, there is a next page; return 20 and a cursor built from the 20th row. *Explanation:* offset would scan/discard N rows and duplicate/skip rows as new transactions arrive.

**I5.** Browser sends (1) `OPTIONS /api/v1/tasks` preflight with `Origin`, `Access-Control-Request-Method: POST`, `Access-Control-Request-Headers: authorization,content-type`; (2) if allowed, the actual `POST`. Preflight carries no `Authorization` header, so if `authenticate` runs first it returns 401, the preflight lacks 2xx and CORS headers, and the browser blocks the real request. *Explanation:* CORS middleware must come first so it answers preflights (204) and also decorates error responses.

**I6.** Bugs: (1) handler has three parameters, so it is a normal middleware, not an error handler; (2) it is registered before the routes, so it can never catch their errors; (3) `express.json()` is registered after `apiRouter`, so API routes never see parsed bodies; (4) returns `err.message` to clients (information disclosure) and always 500 regardless of error type; (5) no `next(err)` when `res.headersSent`. Fix: json parser first, router, 404 handler, then a 4-arg error handler last that maps errors safely.

**I7.** Order: `authenticate` (router-level), `validate({ params })`, `loadTask` (access/ownership check), `uploadSingleFile`, `verifyFileSignature`, controller. *Explanation:* identity and authorization must be settled before accepting any bytes (disk/CPU DoS); params validated first so bad ids are rejected cheaply; signature check needs the file already on disk; multer is the expensive step.

**I8.** String interpolation lets attackers inject SQL (`id; DROP TABLE...`, subqueries). Bound parameters cannot be used for identifiers. Correct: allow-list sortable fields and map to column names (e.g. `{ createdAt: 'created_at', title: 'title' }`), build `ORDER BY` only from mapped constants, and add a unique tie-breaker. Values (filters) still use `?` placeholders. *Explanation:* defence by construction, not by character stripping.

**I9.** PUT replaces the whole representation (idempotent); PATCH sends a partial change (idempotent only if it sets values). For another user's task, return 404: it avoids revealing that the ID exists (prevents enumeration) while still enforcing authorization; 403 is also defensible when existence is not sensitive. *Explanation:* consistency matters: use the same rule everywhere.

### Advanced

**A1.** Keep-alive timeout mismatch: Node's `server.keepAliveTimeout` defaults to 5 seconds while the ALB idle timeout is 60 seconds. Node closes an idle connection just as the ALB reuses it for a new request -> 502. Fix: set `server.keepAliveTimeout` above the LB idle timeout (e.g. 65_000 ms) and `server.headersTimeout` a bit higher (e.g. 66_000). Also check for crashes/restarts and header size limits. *Explanation:* classic production-only bug because local testing has no LB.

**A2.** Client sends `Idempotency-Key: <uuid>` on `POST /payments`. Server stores `(key, user, request hash) -> status, response` in a durable store with a unique constraint on `(user_id, key)` (Redis `SET NX` or DB). Flow: insert key as "in progress" atomically; if insert succeeds, process and save the response; if the key exists and finished with the same request hash, return the stored response (same status/body); if it is in progress, return 409 (or wait); if same key with a different payload, return 422/409. Keys expire (e.g. 24h). Process payment and key completion transactionally where possible; the downstream payment provider call also gets an idempotency key. *Explanation:* safe retries after timeouts without double charges; covered in depth in Week 6 Day 3 and Week 7 Day 4.

**A3.** Cursor must contain the sort tuple: `(dueDate, id)` plus a NULL marker. Choose NULLs-last. SQL for the "next page" depends on the last row:

```sql
-- last row has a non-null dueDate = ?d and id = ?i
SELECT * FROM tasks
WHERE owner_id = ?
  AND ( (due_date > ?d)
     OR (due_date = ?d AND id > ?i)
     OR (due_date IS NULL) )
ORDER BY (due_date IS NULL), due_date ASC, id ASC
LIMIT 21;

-- last row has NULL dueDate: only NULL rows remain
SELECT * FROM tasks
WHERE owner_id = ? AND due_date IS NULL AND id > ?i
ORDER BY id ASC
LIMIT 21;
```

Cursor encodes `{ d: <dueDate or null>, i: <id> }`. *Explanation:* a unique tie-breaker is mandatory; NULL handling needs explicit branches; the `ORDER BY (due_date IS NULL)` expression may prevent index use, so many APIs restrict cursor sorts to indexed non-null columns or use a sentinel value (e.g. a far-future date) stored instead of NULL.

**A4.** Problems: (1) files land in `public/` -> served unauthenticated, executable/HTML/SVG content can cause stored XSS; (2) `originalname` is attacker-controlled -> path traversal (`../../x`) and overwriting other files, collisions; (3) no `limits` -> disk/memory DoS; (4) no `fileFilter` allow-list and no magic-byte check; (5) no authentication/authorization or ownership check; (6) `renameSync` blocks the event loop (use async `fs/promises`); (7) returns a guessable public URL; (8) no error handling/cleanup (orphan files); (9) multer `dest` stores with random names, but the code undoes that. Fix: private upload dir, random names, limits, allow-list + magic bytes, auth first, authenticated download with `Content-Disposition: attachment` and `nosniff`, async fs.

**A5.** Express 5 (via the `router` package) checks whether a handler returns a promise (thenable); if it rejects, it calls `next(err)`; synchronous throws are caught by try/catch around the handler call. Express 4 only caught synchronous throws; rejected promises were unhandled (request hung / `unhandledRejection`). Not forwarded: (1) errors thrown inside callbacks or timers (`setTimeout`, event-emitter listeners, `stream.on('data')`) outside the handler's promise chain -> `uncaughtException`; (2) promises you create but do not await/return (fire-and-forget) that later reject -> `unhandledRejection`. Also errors in streaming after headers were sent need `next(err)`/destroy handling. *Explanation:* "automatic" only covers the returned promise/sync call stack.

**A6.** (1) Not pinning `algorithms` (alg-confusion/`none`) -> always pass an allow-list. (2) Weak or hard-coded secret -> long random secret from env/secret manager; validate length at startup. (3) Missing/ignored `exp` or very long lifetimes -> short-lived access tokens + refresh tokens (Week 5). (4) Trusting claims without validation (role/sub types) -> validate claim shape. (5) Leaking details/logging tokens -> generic 401, never log the Authorization header. Bonus: decoding without verifying (`jwt.decode`), storing tokens in localStorage (XSS), no revocation story, and mixing authentication with authorization in one middleware.

**A7.** Do not change `v1`. Add `v2` (or a new field) where `amount` is an integer in minor units with an explicit `currency`; keep `v1` returning the float derived from the same stored integer; share the service and convert only in the response mapper per version. Announce `Deprecation`/`Sunset` headers on v1, add docs and a changelog, monitor v1 traffic, notify consumers, and retire v1 only after traffic is near zero. *Explanation:* changing a field's type is a breaking change; additive fields (for example `amountMinor` alongside `amount`) are a gentler path inside v1 when clients are tolerant readers.

---

## Weak-area identification guidance

Score out of 47. First note which **question IDs** you lost points on, then map them to the days below.

| Overall score | Reading |
|---------------|---------|
| 38-47 | Strong. Do spaced revision only; start Week 4. |
| 28-37 | Good base. Redo the weak days' "Common mistakes" + follow-ups; re-type one piece of code from memory. |
| 18-27 | Gaps. Re-read the weak days fully and rebuild their feature (without copy/paste) before Week 4. |
| below 18 | Do not rush. Use the catch-up plan; Express fundamentals will be assumed in Weeks 5-8. |

| Lost points on | Topic | Revisit |
|----------------|-------|---------|
| B1, B2, B6, B7, B8 | HTTP basics, cookies, CORS basics | Day 1, Day 6 (CORS) |
| B5, I6 | Express/layering/error handler registration | Day 2, Day 4 |
| B3, B4, I1, I3 | Middleware order/behaviour, Express 5 differences | Day 2, Day 3 |
| I2, I8 | Validation, coercion, injection | Day 3, Day 5 |
| I4, I8, A3 | Pagination/sorting design | Day 5 |
| I5, A1 | CORS preflight, proxy/keep-alive | Day 1, Day 6 |
| I7, A4 | Upload design and security | Day 6 |
| I9, A6 | Authn/authz, IDOR, JWT middleware | Day 4 (+ Week 5) |
| A2 | Idempotency | Day 1 (methods), Week 6 Day 3 |
| A5 | Express 5 async errors | Day 2, Day 4 |
| A7 | Versioning | Day 5 |

**How to diagnose the *kind* of weakness:** (1) *Concept gap* -- you cannot explain it in plain words: re-read the topic, then explain it aloud. (2) *Recall gap* -- you know it when you read it but forget in 45 minutes: use the one-liner table and spaced revision. (3) *Practice gap* -- you cannot write the code: rebuild that day's feature from an empty file. (4) *Debugging gap* -- you can write
it but cannot find your own bug: use the symptom table and break your API on purpose.

---

## Catch-up plan if you fall behind

**If you are 1 day behind** (most common): Do Day 7's smoke script and the weekly test on Day 7 as planned, but replace the 25-minute rapid revision with the unfinished day's `[ESSENTIAL]` topics only. Skip `[ADVANCED]` items and the "practical coding task" of that day; do them later during Week 4's slack.

**If you are 2-3 days behind:** Use this priority order (each block about 1.5-2 hours):

1. Day 1 essentials (lifecycle, methods, status codes, cookies) + Day 2 (REST rules, layering) -- skip the playground server.
2. Day 3 (middleware + zod) + Day 4 (error handler + auth middleware) -- these are the most-asked Express topics.
3. Day 5 offset pagination + filter/sort whitelist (skip cursor/v2 build, but read the cursor concept).
4. Day 6 CORS + debugging funnel (read upload and OpenAPI concepts; build later if time permits).
5. Smoke test + the Basic and Intermediate assessment questions only.

**If you lost a full week:** Do not start Week 4 until the Task API runs end-to-end with: health, CRUD, zod validation, central error handler, auth middleware, pagination. Cut Day 5 versioning, Day 6 uploads and OpenAPI to "read the interview answers only". Week 4 (MySQL) is independent of those, but Week 5 builds auth on this API.

**Rules for catching up:** (1) Never skip the Day 7 test; it is your diagnostic. (2) Protect the daily 2-hour block; extend by a short weekend session rather than compressing coding practice. (3) Prefer finishing `[ESSENTIAL]` of every day over completing `[ADVANCED]` of one day. (4) Keep the API running: untouched half-built code is harder to resume than a smaller, working API.

---

## Spaced-revision schedule for Week 3 topics

Revisit each topic about 1 day, 3 days and 7 days after first study (10-15 minutes each; one-liners + one follow-up answered aloud). Day numbers are absolute study days (Week 3 = Days 15-21).

| Topic (first studied) | +1 day | +3 days | +7 days |
|-----------------------|--------|---------|---------|
| HTTP lifecycle, methods, status codes (Day 15) | Day 16 | Day 18 | Day 22 |
| Headers, cookies, content types (Day 15) | Day 16 | Day 18 | Day 22 |
| REST design, layering (Day 16) | Day 17 | Day 19 | Day 23 |
| Express request flow, Express 5 changes (Day 16) | Day 17 | Day 19 | Day 23 |
| Middleware, zod validation, sanitization (Day 17) | Day 18 | Day 20 | Day 24 |
| Error handling, auth middleware, 401/403 (Day 18) | Day 19 | Day 21 | Day 25 |
| Pagination, filter/sort, versioning (Day 19) | Day 20 | Day 22 | Day 26 |
| Uploads, OpenAPI, CORS, debugging (Day 20) | Day 21 | Day 23 | Day 27 |

(Master schedule in `00_Master_Strategy_Schedule.md` has the full 56-day spaced-revision plan; this table is only Week 3's slice.)

---

End of Week 3. Next: `04_Week4_MySQL.md` (Week 4 Day 1: relational fundamentals). In Week 4-5 the in-memory `tasks.repository.js` is replaced by MySQL (`mysql2/promise`) without changing controllers or services, and the dev token script is replaced by real signup/login with bcrypt and JWT.
