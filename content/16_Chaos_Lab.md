# 16 - Chaos Lab: Break Your Own System

> Part 16 of the Node.js Backend Interview Preparation set. Target system: the Task Management API from
> `12_Project_Task_API.md` (Stages 1-7 plus Extension A Redis cache, Extension B BullMQ worker, Extension C
> docker compose). Here we run it next to MySQL and Redis, break it on purpose in eight different ways, write
> down what we SEE, fix it in code, and run the same failure again to prove the fix with numbers.

**Where this fits (box)**

| Item | Value |
|------|-------|
| Roadmap | `90-day-backend-engineer-roadmap.md`, "Days 78-84 - Break your own system" (+ the "ADDED" list under it) |
| Needs first | Part 12 (the Task API, Extensions A and B), Week 6 Day 3 (timeouts/retries/idempotency), Week 6 Day 5 (queues, graceful shutdown), Week 7 Day 5 (queues, monitoring) |
| Related parts | 14 (pool sizing), 15 (metrics, alerting, SLOs), 17 (capstone project: re-use this lab on it) |
| Tier | `[ESSENTIAL]` for the failure modes and the vocabulary (timeout, retry, backoff + jitter, circuit breaker, bulkhead, DLQ, graceful shutdown). `[ADVANCED]` for the outbox and idempotent consumer. |
| Time | About 20 hours if you run every lab yourself (table at the end) |

**Honest notes before you start**

- Everything shown as "OBSERVED" below is real output captured on one Windows 11 laptop running Docker Desktop
  (12 CPUs, 15.5 GB, other containers busy at the same time). Absolute numbers (requests per second, milliseconds) are
  LOW and NOISY because of that. Compare the BEFORE and AFTER numbers of the same scenario, not numbers across
  scenarios, and do not quote the absolute values as "what Node can do".
- A chaos experiment is science, not a demo: hypothesis first, one change, same measurement before and after.
- Prometheus/Grafana alert rules in this part are the rules I would write (Part 15 has the metric names and the
  RED/USE method). They were NOT run here; what WAS observed is the log lines, the health endpoints and the HTTP codes
  that such alerts would be built from. See "Not verified" at the end.

---

## Module 0 - The lab: stack, tools and method

**Learning objectives**

- Build the lab stack (API + worker + MySQL + Redis + toxiproxy + nginx) from the Task API project.
- Know the three tools: `toxiproxy` (inject latency, black-hole, cut), `probe.mjs` (steady load, one line per second),
  `autocannon` (saturation load).
- Run every scenario twice: `VARIANT=before` (project exactly as built in Part 12) and `VARIANT=after` (with the fixes).

### 0.1 Concept (Hinglish)

Production me cheezein "poori tarah band" nahi hoti, woh **dheere ya aadhi** fail hoti hain: DB slow ho gaya, Redis
ka network atak gaya, ek deploy ke beech me connections toot gaye. Tumhara system in sab me kaise behave karta hai,
yeh sirf tab pata chalta hai jab tum khud tod ke dekho. Is lab me har failure ek script hai: same script, pehle
`before` image par, phir `after` image par.

### 0.2 Architecture of the lab

```text
                      +--------------------------- docker network "ch_default" ---------------------------+
 tools container      |                                                                                    |
 (autocannon, probe,  |   lb (nginx)  --> api1 :3000 --+                       +--> db   (ch-mysql :3306)   |
  curl)  ------------>|   [rolling profile only]  api2 +--> toxiproxy :3306 ---+                           |
        direct to api1|                                |    (mysql proxy)                                   |
                      |   worker  ---------------------+--> toxiproxy :6379 ---+--> redis (ch-redis :6379)  |
                      +------------------------------------------------------------------------------------+
   host ports: MySQL 127.0.0.1:33065, Redis 127.0.0.1:63792, api1 127.0.0.1:3065
```

The API and the worker reach MySQL and Redis THROUGH toxiproxy. A "toxic" is a fault injected on that path
(`latency`, `timeout` = black hole). `docker kill` is used when we want a real crash. This lets us create
failures that `docker stop` cannot: a dependency that is alive but slow, or silent.

### 0.3 Files (all under `task-api/chaos/`)

| File | Purpose |
|------|---------|
| `compose.yml` | The stack. `VARIANT` picks the image (`task-api:before` or `task-api:after`) |
| `toxiproxy.json` | Two proxies: `mysql` (3306 -> db) and `redis` (6379 -> redis) |
| `nginx.conf` | Round-robin load balancer for the rolling-restart scenario |
| `tools/Dockerfile` | node:22-alpine + curl + autocannon (run inside the docker network) |
| `lib.sh` | Helpers: `up`, `at`, `probe`, `ac`, `req`, `toxi`, `sql`, `ready_check`, `log_summary` |
| `probe.mjs` | Fixed request rate; one line per second with status histogram and latency |
| `ac.mjs` | autocannon wrapper; prints one compact summary |
| `req.mjs` | One request; prints status, time, `Retry-After`, start of the body |
| `up.sh` | Build the image for `$VARIANT`, start the stack, seed users and 500 tasks (idempotent) |
| `s01-...s08-*.sh` | One script per failure (plus `s03b`, `s05b`, `s07b` variants). Each calls `up` first |
| `run-all.sh` | `VARIANT=before bash chaos/run-all.sh [s01 s02 ...]` runs scenarios and stores output in `chaos/out/<scenario>-<variant>.log` |

Folder layout on disk (important, the scripts rely on it):

```text
lab/
  task-api-baseline/   <- COPY of the project exactly as Part 12 builds it (this is "before")
  task-api/            <- the project WITH the fixes from this part (this is "after") + chaos/
```

Create the baseline copy BEFORE you apply any fix: `cp -r task-api task-api-baseline` (remove `docker-compose.yml`
from the copy if you like; the lab has its own `chaos/compose.yml`). Part 12's compose file is not used here.

### 0.4 Setup commands

```bash
# 0. prerequisites: Docker Desktop running, Git Bash (Windows) or any bash (Linux/macOS)
cd lab/task-api
npm install --package-lock-only        # the Dockerfile uses "npm ci", it needs package-lock.json
# 1. bring the stack up on the BEFORE image and seed (idempotent)
VARIANT=before bash chaos/up.sh
# 2. smoke test
bash -c '. chaos/lib.sh; probe http://api1:3000 5 10'
# 3. any scenario:
VARIANT=before bash chaos/s01-kill-mysql.sh
VARIANT=after  bash chaos/s01-kill-mysql.sh
# 4. clean up when finished (containers, network and volume are all named ch-*)
bash -c '. chaos/lib.sh; teardown'
```

Two pieces of Git-Bash-on-Windows trouble that cost me time (keep them in mind):

1. `docker build -q <path>` and `docker compose` paths must be `C:/...` style, not `/c/...`. `lib.sh` uses `pwd -W`.
2. Building the SAME image tag from three compose services in parallel (`migrate`, `api1`, `worker`) hung
   `docker compose up`. `lib.sh` therefore runs ONE `docker build` and the compose services only reference the tag.

### 0.5 The compose file

```yaml
# Chaos lab stack. Project name "ch". Run through chaos/lib.sh (it sets VARIANT and the project name).
# VARIANT=before -> image built from ../../task-api-baseline   VARIANT=after -> image built from ..
x-app-env: &app-env
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: info
  DB_HOST: toxiproxy        # the app talks to MySQL THROUGH toxiproxy, so we can inject faults
  DB_PORT: "3306"
  DB_USER: taskapi
  DB_PASSWORD: lab-app-password
  DB_NAME: task_api
  DB_POOL_SIZE: ${DB_POOL_SIZE:-10}
  JWT_SECRET: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
  BCRYPT_ROUNDS: "10"
  DOCS_ENABLED: "false"
  RATE_LIMIT_MAX: "100000000"
  AUTH_RATE_LIMIT_MAX: "1000"
  REDIS_URL: redis://toxiproxy:6379   # Redis (cache + queue) also goes through toxiproxy
  DRAIN_DELAY_MS: ${DRAIN_DELAY_MS:-0}

services:
  db:
    image: mysql:8.4
    container_name: ch-mysql
    command: ["--default-time-zone=+00:00", "--max-connections=200"]
    environment:
      MYSQL_ROOT_PASSWORD: lab-root-password
      MYSQL_DATABASE: task_api
      MYSQL_USER: taskapi
      MYSQL_PASSWORD: lab-app-password
    volumes: ["ch-db-data:/var/lib/mysql"]
    ports: ["127.0.0.1:33065:3306"]
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -plab-root-password --silent"]
      interval: 3s
      timeout: 3s
      retries: 40

  redis:
    image: redis:7-alpine
    container_name: ch-redis
    command: ["redis-server", "--appendonly", "yes"]
    ports: ["127.0.0.1:63792:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 20

  toxiproxy:
    image: ghcr.io/shopify/toxiproxy:2.9.0
    command: ["-host=0.0.0.0", "-config=/toxiproxy.json"]
    volumes: ["./toxiproxy.json:/toxiproxy.json:ro"]
    depends_on: [db, redis]

  migrate:
    image: task-api:${VARIANT:-before}
    command: ["node", "scripts/migrate.js"]
    environment: { <<: *app-env, DB_HOST: db }   # migrations go straight to MySQL, never through a toxic
    depends_on: { db: { condition: service_healthy } }
    restart: "no"

  api1: &api
    image: task-api:${VARIANT:-before}
    environment: *app-env
    ports: ["127.0.0.1:3065:3000"]
    depends_on:
      toxiproxy: { condition: service_started }
      redis: { condition: service_healthy }
      migrate: { condition: service_completed_successfully }
    stop_grace_period: 15s

  api2:
    <<: *api
    ports: []
    profiles: ["rolling"]

  worker:
    image: task-api:${VARIANT:-before}
    command: ["node", "src/worker.js"]
    environment: *app-env
    healthcheck: { disable: true }
    depends_on:
      toxiproxy: { condition: service_started }
      migrate: { condition: service_completed_successfully }
    stop_grace_period: 20s

  lb:
    image: nginx:1.27-alpine
    volumes: ["./nginx.conf:/etc/nginx/conf.d/default.conf:ro"]
    profiles: ["rolling"]
    depends_on: [api1, api2]

  tools:
    build: { context: ./tools }
    image: ch-tools:local
    command: ["sleep", "infinity"]
    volumes: ["./:/chaos"]

volumes:
  ch-db-data:
```

`toxiproxy.json`:

```json
[
  { "name": "mysql", "listen": "0.0.0.0:3306", "upstream": "db:3306", "enabled": true },
  { "name": "redis", "listen": "0.0.0.0:6379", "upstream": "redis:6379", "enabled": true }
]
```

### 0.6 The helpers

```bash
#!/usr/bin/env bash
# lib.sh -- shared helpers. Source it from a scenario script. Needs bash + docker compose v2.
set -u
export MSYS_NO_PATHCONV=1 # Git Bash on Windows: stop it rewriting /paths inside docker commands
CHAOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && { pwd -W 2>/dev/null || pwd; })" # pwd -W = C:/ style path on Git Bash
export COMPOSE_PROJECT_NAME=ch
export VARIANT="${VARIANT:-before}"
if [ "$VARIANT" = "after" ]; then export DRAIN_DELAY_MS="${DRAIN_DELAY_MS:-5000}"; fi
if [ "$VARIANT" = "before" ]; then
  export APP_DIR="$CHAOS_DIR/../../task-api-baseline" # the project exactly as built in 12_Project_Task_API.md
else
  export APP_DIR="$CHAOS_DIR/.." # the project with the chaos-lab fixes applied
fi

dc() { docker compose -f "$CHAOS_DIR/compose.yml" "$@"; }
tool() { dc exec -T -e TOKEN="${TOKEN:-}" -e OK_LAT="${OK_LAT:-}" tools "$@"; } # run a command inside the tools container (same docker network)
toxi() { dc exec -T toxiproxy /toxiproxy-cli "$@"; }
sql() { docker exec -i ch-mysql mysql -uroot -plab-root-password task_api -e "$1" 2>/dev/null; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

wait_ready() { # wait_ready <url> [seconds]
  for _ in $(seq 1 "${2:-60}"); do
    if tool curl -sf -o /dev/null "$1"; then return 0; fi
    sleep 1
  done
  echo "TIMEOUT waiting for $1"
  return 1
}

# remove every toxic from both proxies (inspect prints one line per toxic: <name> type=... stream=...)
reset_toxics() {
  for proxy in mysql redis; do
    for toxic in $(toxi inspect "$proxy" 2>/dev/null | awk '/type=/{print $1}'); do
      toxi toxic delete --toxicName "$toxic" "$proxy" >/dev/null 2>&1 || true
    done
  done
}

seed_data() {
  dc exec -T -e SEED_ADMIN_EMAIL=admin@example.com -e SEED_ADMIN_PASSWORD=a-long-admin-password api1 node scripts/seed.js --demo
  sql "INSERT INTO tasks (title, status, priority, created_by, assignee_id)
       WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM n WHERE i < 500)
       SELECT CONCAT('seed task ', i), 'todo', 'medium', 1, 2 FROM n;"
}

# bring the stack up for $VARIANT (rebuilds + recreates the app containers), seed once
up() {
  log "VARIANT=$VARIANT (image built from $APP_DIR)"
  dc up -d db redis toxiproxy tools >/dev/null 2>&1
  docker build -q -t "task-api:$VARIANT" "$APP_DIR" > /dev/null # build ONCE (three services share this image)
  dc up -d --force-recreate migrate api1 worker 2>&1 | tail -3
  wait_ready http://api1:3000/health/ready 90
  if [ "$(sql 'SELECT COUNT(*) FROM users' | tail -1)" = "0" ]; then seed_data; fi
  reset_toxics
  get_token
  log "stack ready"
}

teardown() { dc --profile rolling down -v --remove-orphans; }

# log in once and keep the JWT in $TOKEN, so scripts can still send authenticated requests while the DB is down
get_token() { TOKEN="$(tool node -e "fetch('http://api1:3000/api/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'admin@example.com',password:'a-long-admin-password'})}).then(r=>r.json()).then(j=>process.stdout.write(j.data.accessToken??j.data.token))")"; export TOKEN; }

# ---- scenario helpers ---------------------------------------------------------------------------
T0=0
start_clock() { T0=$(date +%s); }
# at <seconds-from-start> <command...>: run a command at a given offset and print a marker line
at() {
  local when="$1"; shift
  local now; now=$(( $(date +%s) - T0 ))
  [ "$when" -gt "$now" ] && sleep $(( when - now ))
  echo ">> t=${when}s: $*"
  "$@"
}
api_logs() { docker logs ch-api1-1 --since "${1:-30s}" 2>&1 | tail -"${2:-6}" | cut -c1-260; }
worker_logs() { docker logs ch-worker-1 --since "${1:-30s}" 2>&1 | tail -"${2:-6}" | cut -c1-260; }
probe() { tool node /chaos/probe.mjs "$@"; }
req() { tool node /chaos/req.mjs "$@"; }
# summary of the distinct log messages the API produced in the last N seconds
log_summary() { docker logs "${2:-ch-api1-1}" --since "${1:-30s}" 2>&1 | grep -oE '"(msg|message)":"[^"]{1,90}"' | sort | uniq -c | sort -rn | head -"${3:-6}"; }
ready_check() { tool curl -s -m 5 -o /dev/null -w "GET /health/ready -> HTTP %{http_code} in %{time_total}s
" http://api1:3000/health/ready; tool curl -s -m 5 -o /dev/null -w "GET /health       -> HTTP %{http_code} in %{time_total}s
" http://api1:3000/health; }
ac() { tool node /chaos/ac.mjs "$@"; }
```

`probe.mjs` (fixed request rate, results bucketed by the second the request STARTED, so a slow request shows up
in the second the user pressed the button):

```js
// probe.mjs -- fires a steady request rate and prints ONE LINE PER SECOND: status histogram + latency.
// usage: [OK_LAT=1] node probe.mjs <baseUrl> <seconds> <rps> [GET|POST] [timeoutMs]
// The request rate is OPEN-LOOP: requests are sent at the fixed rate even if earlier ones have not finished (like real users).
import { performance } from 'node:perf_hooks';

const [base, secondsArg = '20', rpsArg = '5', method = 'GET', timeoutArg = '8000'] = process.argv.slice(2);
const seconds = Number(secondsArg);
const rps = Number(rpsArg);
const timeoutMs = Number(timeoutArg);

async function login() {
  for (let i = 0; i < 20; i += 1) {
    try {
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'a-long-admin-password' }),
      });
      const body = await res.json();
      const token = body.data?.accessToken ?? body.data?.token;
      if (token) return token;
      throw new Error(JSON.stringify(body));
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('login failed');
}

const token = process.env.TOKEN || (await login());
const started = performance.now(); // t=0 is the moment the probe starts (the script's markers use the same offsets, +/- 1 s)
const buckets = new Map(); // second -> { codes: {}, lat: [] }
const inflight = new Set();

function record(sec, code, ms) {
  const b = buckets.get(sec) ?? { codes: {}, lat: [], okLat: [] };
  b.codes[code] = (b.codes[code] ?? 0) + 1;
  b.lat.push(ms);
  if (code.startsWith('2')) b.okLat.push(ms); // latency of SUCCESSFUL responses only (shed/failed ones are fast and flatter the average)
  buckets.set(sec, b);
}

function fire(n) {
  const sec = Math.floor((performance.now() - started) / 1000);
  const t0 = performance.now();
  const init = {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  };
  let url = `${base}/api/v1/tasks?limit=20`;
  if (method === 'POST') {
    url = `${base}/api/v1/tasks`;
    init.body = JSON.stringify({ title: `probe task ${Date.now()}-${n}`, assigneeId: 2 });
  }
  const p = fetch(url, init)
    .then(async (res) => {
      await res.arrayBuffer();
      record(sec, String(res.status), performance.now() - t0);
    })
    .catch((err) => {
      const code = err.name === 'TimeoutError' ? 'CLIENT_TIMEOUT' : (err.cause?.code ?? err.name);
      record(sec, code, performance.now() - t0);
    })
    .finally(() => inflight.delete(p));
  inflight.add(p);
}

const pct = (arr, q) => {
  const s = [...arr].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor(s.length * q))] ?? 0);
};

function printSecond(sec) {
  const b = buckets.get(sec);
  if (!b) {
    console.log(`t=${String(sec).padStart(2)}s  (no completions)`);
    return;
  }
  const codes = Object.entries(b.codes)
    .map(([k, v]) => `${k}x${v}`)
    .join(' ');
  if (process.env.OK_LAT) {
    const ok = b.okLat.length ? `ok_p50=${String(pct(b.okLat, 0.5)).padStart(5)}ms ok_p99=${String(pct(b.okLat, 0.99)).padStart(5)}ms` : 'ok_p50=    -       ok_p99=    -      ';
    console.log(`t=${String(sec).padStart(2)}s  n=${String(b.lat.length).padStart(4)}  ${ok}  ${codes}`);
    return;
  }
  console.log(
    `t=${String(sec).padStart(2)}s  n=${String(b.lat.length).padStart(3)}  p50=${String(pct(b.lat, 0.5)).padStart(5)}ms  max=${String(pct(b.lat, 1)).padStart(5)}ms  ${codes}`,
  );
}

let n = 0;
let credit = 0; // rps may be < 10, so keep a fractional request budget per 100 ms tick
const timer = setInterval(() => {
  credit += rps / 10;
  while (credit >= 1) {
    fire(n++);
    credit -= 1;
  }
}, 100);

setTimeout(async () => {
  clearInterval(timer);
  await Promise.allSettled([...inflight]); // wait for every request (they all end within timeoutMs)
  // Requests are bucketed by the second they STARTED in, so slow requests show up in the second the user clicked.
  const lastSecond = Math.max(...buckets.keys());
  for (let sec = 0; sec <= lastSecond; sec += 1) printSecond(sec);
  const total = {};
  for (const b of buckets.values()) for (const [k, v] of Object.entries(b.codes)) total[k] = (total[k] ?? 0) + v;
  console.log('TOTAL', JSON.stringify(total));
}, Math.max(1000, seconds * 1000 - (performance.now() - started)));
```

`ac.mjs` (autocannon summary) and `req.mjs` (single request):

```js
// ac.mjs -- autocannon wrapper: logs in first, then prints a compact summary.
// usage: node ac.mjs <baseUrl> <connections> <seconds> [path]
import autocannon from 'autocannon';

const [base, conns = '10', secs = '10', path = '/api/v1/tasks?limit=20'] = process.argv.slice(2);

async function login() {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'a-long-admin-password' }),
  });
  const body = await res.json();
  return body.data?.accessToken ?? body.data?.token;
}
const token = process.env.TOKEN || (await login());

const r = await autocannon({
  url: `${base}${path}`,
  connections: Number(conns),
  duration: Number(secs),
  headers: { authorization: `Bearer ${token}` },
  timeout: 10,
});

console.log(
  `conns=${conns} dur=${secs}s  req/s avg=${Math.round(r.requests.average)}  total=${r.requests.total}  2xx=${r['2xx']}  non2xx=${r.non2xx}  errors=${r.errors}  timeouts=${r.timeouts}`,
);
console.log(`latency ms: p50=${r.latency.p50} p90=${r.latency.p90} p97.5=${r.latency.p97_5} p99=${r.latency.p99} max=${r.latency.max}`);
const codes = Object.entries(r.statusCodeStats ?? {})
  .map(([k, v]) => `${k}x${v.count}`)
  .join(' ');
console.log(`status codes: ${codes || 'none'}`);
```

```js
// req.mjs -- ONE authenticated request; prints status, time and the first 200 chars of the body.
// usage: node req.mjs <baseUrl> <path> [GET|POST] [jsonBody]
const [base, path = '/api/v1/tasks?limit=1', method = 'GET', body] = process.argv.slice(2);
async function token() {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'a-long-admin-password' }),
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json();
  return j.data?.accessToken ?? j.data?.token;
}
const t = process.env.TOKEN || (await token());
const t0 = performance.now();
try {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
    body,
    signal: AbortSignal.timeout(Number(process.env.REQ_TIMEOUT_MS ?? 15000)),
  });
  const text = await res.text();
  console.log(`HTTP ${res.status} in ${Math.round(performance.now() - t0)}ms retry-after=${res.headers.get('retry-after')} ${text.slice(0, 200)}`);
} catch (err) {
  console.log(`NO RESPONSE after ${Math.round(performance.now() - t0)}ms: ${err.name} ${err.cause?.code ?? ''}`);
}
```

`tools/Dockerfile`:

```dockerfile
FROM node:22-alpine
RUN apk add --no-cache curl
# ESM imports resolve node_modules by walking up from /chaos, so install into /opt/t and link it at /node_modules
RUN mkdir /opt/t && cd /opt/t && npm init -y > /dev/null && npm install --no-audit --no-fund autocannon@8 \
 && ln -s /opt/t/node_modules /node_modules
WORKDIR /chaos
```

### 0.7 The method (use it for every module)

1. **Steady state**: what does "healthy" look like (status codes, p50, p99)? Measure it first.
2. **Hypothesis**: "If X fails, I expect Y." Write it BEFORE running. Being wrong is the point.
3. **Inject**: one fault, a known start time, a known end time.
4. **Observe**: HTTP codes, latency, logs, health endpoints, data in MySQL. Four symptom classes to look for:
   `5xx`, `hang` (no answer at all), `latency spike` (200 but slow), `silent data loss` (200 but the side effect never happened).
5. **Alert**: which signal should have paged a human, and how fast?
6. **Fix**: smallest change that removes the failure mode. Re-run the SAME script.
7. **Write it down**: the incident review (Module 9) is the artefact that goes in your portfolio.

**Key concepts**

- A dead dependency is often EASIER than a slow one: dead fails fast, slow holds your threads/sockets/connections.
- You need a client-side deadline on EVERY network call. The default in most libraries is "wait forever" or "wait 10+ s".
- Resilience patterns each answer ONE question: timeout (how long may I wait?), retry (should I try again?),
  circuit breaker (should I even try?), bulkhead (how much of my capacity may this dependency use?),
  fallback (what do I answer instead?), DLQ (where does a message go when it can never succeed?).

**Revision questions**

1. Why do we put toxiproxy between the app and MySQL instead of using only `docker stop`?
2. Name the four symptom classes of a failure and one example of each from your own system.
3. Why must the BEFORE and AFTER runs use the same script and the same load?
4. What is the difference between `docker kill` of a database and a `timeout` toxic on its proxy?

**Practical task**: bring the stack up on `before`, run the 5 req/s probe for 20 s, write down your steady-state p50 and p99.

- [ ] Stack runs, `ready_check` shows HTTP 200 on `/health/ready`
- [ ] I can state steady-state latency numbers for `GET /api/v1/tasks?limit=20`
- [ ] I know where each log goes (`chaos/out/`)


## Module 1 - Failure 1: kill MySQL

**Learning objectives**

- Kill the database under steady load and write down what the API really does (not what you hope it does).
- Tell apart three symptoms in one run: 5xx errors, HANGS, and slow recovery.
- Add timeouts, a circuit breaker and a correct 503 mapping, then rerun the same script.

### 1.1 Concept (Hinglish)

Database band hona sabse "obvious" failure hai, isliye log maan lete hain ki app "error de degi aur theek ho jayegi". Real
me do cheezein hoti hain: (1) jab host gayab hota hai (container kill, network partition) to TCP connect **atak jata hai**, error nahi aata; (2) jab
pool bhar jata hai to errors ka kaaran asli DB error nahi balki "pool queue full" hota hai. Timeout aur circuit breaker
ke bina ek DB outage poori API ko hang kar deta hai.

### 1.2 Hypothesis (written BEFORE running)

"When MySQL is killed, `GET /api/v1/tasks` returns 500 quickly (connection refused). `/health` stays green, `/health/ready`
turns 503, and when MySQL is back the pool reconnects by itself within a few seconds."

### 1.3 Command

```bash
VARIANT=before bash chaos/s01-kill-mysql.sh
```

```bash
#!/usr/bin/env bash
# Failure 1: MySQL is killed at t=6 and started again at t=18.   usage: VARIANT=before|after chaos/s01-kill-mysql.sh
. "$(dirname "$0")/lib.sh"
up
log "steady load: 10 req/s GET /api/v1/tasks for 45s. docker kill ch-mysql at t=6, docker start at t=18"
start_clock
( at 6 docker kill ch-mysql >/dev/null
  at 10 ready_check
  at 12 req http://api1:3000 "/api/v1/tasks?limit=1"
  at 18 docker start ch-mysql >/dev/null ) &
probe http://api1:3000 45 10
wait
log "distinct API log messages during the run:"; log_summary 60s
```

Step by step: `up` builds and starts the stack; the probe sends 10 requests per second for 45 s; at t=6 `docker kill ch-mysql`
(SIGKILL, no clean shutdown); at t=10 and t=12 we call readiness/liveness and one single request; at t=18 `docker start ch-mysql`.
The probe's `t=` column is about 2 s behind the markers (`docker exec` start-up time); good enough for 1 s buckets.

### 1.4 OBSERVED (before)

```text
[13:12:46] steady load: 10 req/s GET /api/v1/tasks for 45s. docker kill ch-mysql at t=6, docker start at t=18
>> t=10s: ready_check
GET /health/ready -> HTTP 000 in 5.001087s
GET /health       -> HTTP 200 in 0.002913s
>> t=12s: req http://api1:3000 /api/v1/tasks?limit=1
HTTP 500 in 215ms retry-after=null {"error":{"code":"INTERNAL_ERROR","message":"Something went wrong","requestId":"6bd5f6a1-f44c-4366-a1fe-9bad673a2efe"}}
t= 0s  n=  9  p50=   17ms  max=  241ms  200x9
t= 1s  n= 10  p50=   13ms  max=   18ms  200x10
t= 2s  n= 10  p50=   10ms  max=   12ms  200x10
t= 3s  n= 10  p50=   11ms  max=   15ms  200x10
t= 4s  n= 10  p50= 8001ms  max= 8004ms  200x1 500x4 CLIENT_TIMEOUTx5
t= 5s  n= 10  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx10
t= 6s  n= 10  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx10
t= 7s  n= 10  p50= 8002ms  max= 8003ms  CLIENT_TIMEOUTx10
t= 8s  n=  9  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx9
t= 9s  n= 10  p50= 8002ms  max= 8002ms  CLIENT_TIMEOUTx10
t=10s  n= 10  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx10
t=11s  n= 10  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx10
t=12s  n= 10  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx10
t=13s  n= 10  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx10
t=14s  n= 10  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx10
t=15s  n= 10  p50= 8001ms  max= 8001ms  CLIENT_TIMEOUTx10
t=16s  n= 10  p50= 8000ms  max= 8002ms  500x5 CLIENT_TIMEOUTx5
t=17s  n= 10  p50=    5ms  max=    8ms  500x10
t=18s  n= 10  p50=    4ms  max=    7ms  500x10
t=19s  n= 10  p50=    4ms  max=   17ms  500x10
t=20s  n= 10  p50=    5ms  max=    9ms  500x10
t=21s  n= 10  p50=    4ms  max=    8ms  500x10
t=22s  n=  9  p50=    4ms  max=    5ms  500x9
t=23s  n= 10  p50=    4ms  max=    5ms  500x10
t=24s  n=  9  p50=    7ms  max= 8002ms  500x6 CLIENT_TIMEOUTx3
t=25s  n=  7  p50= 8001ms  max= 8002ms  CLIENT_TIMEOUTx7
t=26s  n= 10  p50=    5ms  max=    7ms  500x10
t=27s  n= 10  p50=    4ms  max=   14ms  500x10
t=28s  n= 10  p50=    4ms  max=    6ms  500x10
t=29s  n= 10  p50=    4ms  max=    7ms  500x10
t=30s  n= 10  p50=    4ms  max=    6ms  500x10
t=31s  n= 10  p50=    5ms  max=    6ms  500x10
t=32s  n= 10  p50=    4ms  max=    4ms  500x10
t=33s  n= 10  p50=    6ms  max=    8ms  500x10
t=34s  n= 10  p50=    7ms  max= 8002ms  500x6 CLIENT_TIMEOUTx4
t=35s  n= 10  p50= 8001ms  max= 8002ms  500x4 CLIENT_TIMEOUTx6
t=36s  n= 10  p50=    4ms  max=    6ms  500x10
t=37s  n= 10  p50=    6ms  max=   10ms  500x10
t=38s  n= 10  p50=    4ms  max=    5ms  500x10
t=39s  n=  9  p50=    4ms  max=   12ms  500x9
t=40s  n= 10  p50=    5ms  max=    8ms  500x10
t=41s  n= 10  p50=    5ms  max=    7ms  500x10
t=42s  n= 10  p50=    5ms  max=   11ms  500x10
t=43s  n= 10  p50=    4ms  max=    4ms  500x10
t=44s  n= 10  p50=    5ms  max= 8002ms  500x6 CLIENT_TIMEOUTx4
TOTAL {"200":40,"500":259,"CLIENT_TIMEOUT":143}
[13:13:41] distinct API log messages during the run:
    300 "msg":"unhandled error"
    260 "msg":"request errored"
    260 "message":"failed with status code 500"
    256 "message":"Queue limit reached."
    143 "msg":"request aborted"
     41 "msg":"request completed"
```

Reading it (the hypothesis was WRONG on four points):

1. **Hang, not error.** From the moment MySQL died, requests did not fail fast: 143 of 442 requests got NO answer and hit the probe's own 8 s
   timeout (`CLIENT_TIMEOUT`). My explanation, consistent with the evidence: after `docker kill` the container's address stops answering and no TCP reset comes back, so each new connection attempt waits for
   `connectTimeout: 10_000` (the proxy in the middle accepts the app's connection but cannot reach the upstream). The API did not even log an error for those requests (an `unhandled error` needs an error first).
2. **The 500s are not "connection refused".** 256 of the 259 errors in the log summary are `Queue limit reached.`: the hung connection attempts filled
   mysql2's waiting line (100) and everything after that was rejected immediately with a generic 500 `INTERNAL_ERROR`. On-call would see "Something went wrong" and no hint of the database.
3. **Readiness hangs too.** `GET /health/ready` did not answer within 5 s (curl printed `HTTP 000`), so a load balancer's probe would TIME OUT rather than see a clean 503.
   Liveness `/health` stayed 200, which is correct (liveness must not depend on the DB).
4. **Recovery is slow.** MySQL was started at t=18 and the run ended at t=44 with the API STILL failing (500s and timeouts): the pool had to throw away connection
   attempts that were hanging for 10 s before it could use the new server.

### 1.5 How monitoring would have alerted

| What happened | Signal | Would it fire? |
|---------------|--------|----------------|
| 40 OK, 259 x 500 | 5xx ratio above 2 percent for 2 min | Yes, but only for the 500 part (59 percent of all requests) |
| 143 hung requests | The server produced NO log line and NO metric for them until the client disconnected (`request aborted`). A pure 5xx alert misses hangs. | Needs request RATE or in-flight gauge or a synthetic probe |
| Readiness hangs | `probe_success == 0` for 1 min (blackbox exporter with a 3 s timeout) | Yes |
| DB dead | `mysql_up == 0` (mysqld exporter), pool waiters > 0 | Yes, fastest signal (seconds) |
| Slow recovery | Error ratio still above threshold after the DB is back | Alert stays firing; this is how you measure MTTR |

Rule worth remembering: **the absence of errors is not health**. A hang produces silence in the error metrics, so alert on latency (p99 above
SLO), on in-flight requests, and on a synthetic check that runs a real request.

### 1.6 Fix

| Layer | Change | Why |
|-------|--------|-----|
| Timeout | `connectTimeout` 10 s -> 3 s; every pool call is wrapped with a 1.5 s deadline (`DB_QUERY_TIMEOUT_MS`) | a dead host costs 1.5 s at most, not 10 s |
| Circuit breaker | 5 consecutive infrastructure failures open the circuit for 5 s; then ONE trial call | while open, requests fail in microseconds and the pool is not hammered |
| Error mapping | `ECONNREFUSED`, `ETIMEDOUT`, `PROTOCOL_CONNECTION_LOST`, `Queue limit reached.` ... -> **503** `DEPENDENCY_UNAVAILABLE` with `Retry-After` | the client is told "try later"; 500 means "bug" |
| Readiness | goes through the same guarded pool, so it answers 503 in milliseconds | the load balancer sees a clean signal |

Files that change (all under `task-api/`): NEW `src/resilience/timeout.js`, `src/resilience/circuit-breaker.js`, `src/resilience/errors.js`;
CHANGED `src/db/pool.js`, `src/errors/app-error.js` (adds `DependencyUnavailableError`), `src/middleware/error-handler.js`, `src/config/env.js` (new settings). The bulkhead part of
`pool.js` is explained in Module 6.

The core helper: a timeout that stops WAITING (it cannot cancel a SQL statement that is already running on the server):

```js
export class DependencyTimeoutError extends Error {
  constructor(label, ms) {
    super(`${label} did not answer within ${ms} ms`);
    this.name = 'DependencyTimeoutError';
    this.code = 'DEPENDENCY_TIMEOUT';
  }
}

/**
 * Reject if `promise` does not settle within `ms`. This only stops WAITING: the underlying work (a SQL query) keeps
 * running on the server. `onLate(value)` lets the caller clean up a value that arrives after we gave up
 * (for example hand a late MySQL connection back to the pool).
 */
export function withTimeout(promise, ms, label, onLate) {
  let timer;
  let timedOut = false;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new DependencyTimeoutError(label, ms));
    }, ms);
  });
  return Promise.race([promise, deadline])
    .finally(() => clearTimeout(timer))
    .finally(() => {
      if (timedOut) {
        promise.then(
          (value) => onLate?.(value),
          () => {}, // the late failure is irrelevant, but it must not become an unhandledRejection
        );
      }
    });
}
```

The circuit breaker (hand-rolled, about 90 lines; `opossum` is the usual library for production, same states and ideas):

```js
import { DependencyUnavailableError } from '../errors/app-error.js';
import { logger } from '../config/logger.js';
import { withTimeout } from './timeout.js';

/**
 * Circuit breaker with a per-call timeout.
 *   closed    -> calls flow; `failureThreshold` CONSECUTIVE failures open the circuit
 *   open      -> calls are rejected immediately (no waiting) until `resetTimeoutMs` has passed
 *   half-open -> exactly ONE trial call is let through; success closes the circuit, failure re-opens it
 * `isFailure(err)` decides which errors count (a duplicate-key error is the caller's fault, not the database's).
 */
export function createCircuitBreaker({
  name,
  timeoutMs,
  failureThreshold = 5,
  resetTimeoutMs = 5_000,
  isFailure = () => true,
  onLate,
}) {
  let state = 'closed';
  let consecutiveFailures = 0;
  let openedAt = 0;
  let trialInFlight = false;
  const counters = { calls: 0, failures: 0, rejected: 0, timeouts: 0 };

  function transition(next, reason) {
    if (state === next) return;
    logger.warn({ breaker: name, from: state, to: next, reason }, 'circuit breaker state change');
    state = next;
    if (next === 'open') openedAt = Date.now();
    if (next === 'closed') consecutiveFailures = 0;
  }

  function retryAfterSeconds() {
    return Math.max(1, Math.ceil((openedAt + resetTimeoutMs - Date.now()) / 1000));
  }

  async function exec(fn) {
    if (state === 'open') {
      if (Date.now() - openedAt < resetTimeoutMs) {
        counters.rejected += 1;
        throw new DependencyUnavailableError(name, 'circuit open', retryAfterSeconds());
      }
      transition('half-open', 'reset timeout elapsed');
    }

    let isTrial = false;
    if (state === 'half-open') {
      if (trialInFlight) {
        counters.rejected += 1;
        throw new DependencyUnavailableError(name, 'circuit half-open, trial call in progress', 1);
      }
      trialInFlight = true;
      isTrial = true;
    }

    counters.calls += 1;
    try {
      const result = await withTimeout(Promise.resolve().then(fn), timeoutMs, name, onLate);
      if (isTrial) transition('closed', 'trial call succeeded');
      consecutiveFailures = 0;
      return result;
    } catch (err) {
      if (err.code === 'DEPENDENCY_TIMEOUT') counters.timeouts += 1;
      if (isFailure(err)) {
        counters.failures += 1;
        consecutiveFailures += 1;
        if (isTrial) transition('open', 'trial call failed');
        else if (consecutiveFailures >= failureThreshold) transition('open', `${consecutiveFailures} consecutive failures`);
      } else if (isTrial) {
        transition('closed', 'trial call reached the dependency (application-level error)');
      }
      throw err;
    } finally {
      if (isTrial) trialInFlight = false;
    }
  }

  return { exec, state: () => state, stats: () => ({ state, ...counters }) };
}
```

Which errors mean "the dependency is broken" (and which do NOT, like a duplicate key):

```js
// Errors that mean "the dependency is broken", as opposed to "the caller sent something wrong".
const INFRASTRUCTURE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  'ENOTFOUND',
  'PROTOCOL_CONNECTION_LOST',
  'ER_CON_COUNT_ERROR',
  'DEPENDENCY_TIMEOUT',
]);

export function isInfrastructureError(err) {
  if (!err) return false;
  if (INFRASTRUCTURE_CODES.has(err.code)) return true;
  // mysql2 throws a plain Error when its own waiting line is full
  return typeof err.message === 'string' && err.message.includes('Queue limit reached');
}
```

The pool, now guarded (full new file):

```js
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { createBulkhead } from '../resilience/bulkhead.js';
import { createCircuitBreaker } from '../resilience/circuit-breaker.js';
import { isInfrastructureError } from '../resilience/errors.js';

const rawPool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  waitForConnections: true,
  connectionLimit: env.DB_POOL_SIZE,
  queueLimit: 100, // last line of defence; the bulkhead below normally rejects long before this
  connectTimeout: 3_000, // was 10 s: a dead host must not hold a request for 10 s
  enableKeepAlive: true,

  timezone: 'Z',
  dateStrings: ['DATE'],
  stringifyObjects: true,
});

// One bulkhead (bounded concurrency + tiny waiting room) and one breaker (timeout + fail fast) in front of MySQL.
export const dbBulkhead = createBulkhead({
  name: 'mysql-pool',
  maxConcurrent: env.DB_POOL_SIZE,
  maxQueue: env.DB_QUEUE_MAX,
  queueTimeoutMs: env.DB_QUEUE_TIMEOUT_MS,
});

export const dbBreaker = createCircuitBreaker({
  name: 'mysql',
  timeoutMs: env.DB_QUERY_TIMEOUT_MS,
  failureThreshold: 5,
  resetTimeoutMs: 5_000,
  isFailure: isInfrastructureError, // ER_DUP_ENTRY, ER_NO_REFERENCED_ROW... are the caller's problem, not an outage
  onLate: (connectionOrResult) => connectionOrResult?.release?.(), // a connection that arrives after we gave up goes back
});

// pool.query / pool.execute: hold one bulkhead slot for the duration of the call
function guarded(method) {
  const original = rawPool[method].bind(rawPool);
  return async (...args) => {
    const release = await dbBulkhead.acquire();
    try {
      return await dbBreaker.exec(() => original(...args));
    } finally {
      release();
    }
  };
}

// pool.getConnection (transactions): the slot is held until connection.release()
const originalGetConnection = rawPool.getConnection.bind(rawPool);
async function getConnection() {
  const releaseSlot = await dbBulkhead.acquire();
  let connection;
  try {
    connection = await dbBreaker.exec(() => originalGetConnection());
  } catch (err) {
    releaseSlot();
    throw err;
  }
  const originalRelease = connection.release.bind(connection);
  let released = false;
  connection.release = () => {
    if (released) return;
    released = true;
    originalRelease();
    releaseSlot();
  };
  return connection;
}

rawPool.query = guarded('query');
rawPool.execute = guarded('execute');
rawPool.getConnection = getConnection;

export const pool = rawPool;
```

New error class and the error handler, as diffs against Part 12:

```diff
--- before/src/errors/app-error.js
+++ after/src/errors/app-error.js
@@ -47,3 +47,15 @@
     super(message, { statusCode: 422, code, details });
   }
 }
+
+// 503: a dependency (database, Redis, queue) is down, too slow or shedding load. The CLIENT may retry later.
+export class DependencyUnavailableError extends AppError {
+  constructor(dependency, reason, retryAfterSeconds = 2) {
+    super(`${dependency} is temporarily unavailable`, {
+      statusCode: 503,
+      code: 'DEPENDENCY_UNAVAILABLE',
+      details: { dependency, reason },
+    });
+    this.retryAfterSeconds = retryAfterSeconds;
+  }
+}
```

```diff
--- before/src/middleware/error-handler.js
+++ after/src/middleware/error-handler.js
@@ -1,64 +1,78 @@
-import { ZodError } from 'zod';
-import { AppError } from '../errors/app-error.js';
-import { logger } from '../config/logger.js';
-
-// mysql2 errors carry a string `code`. These are CLIENT-caused, so they must not be 500s.
-const MYSQL_ERRORS = {
-  ER_DUP_ENTRY: { status: 409, code: 'CONFLICT', message: 'A record with the same unique value already exists' },
-  ER_NO_REFERENCED_ROW_2: { status: 400, code: 'INVALID_REFERENCE', message: 'A referenced record does not exist' },
-  ER_ROW_IS_REFERENCED_2: { status: 409, code: 'IN_USE', message: 'This record is referenced by other records' },
-};
-
-export function toHttpError(err) {
-  if (err instanceof AppError) {
-    return { status: err.statusCode, code: err.code, message: err.message, details: err.details };
-  }
-
-  if (err instanceof ZodError) {
-    return {
-      status: 400,
-      code: 'VALIDATION_ERROR',
-      message: 'Request validation failed',
-      details: err.issues.map((i) => ({ in: 'body', path: i.path.join('.'), message: i.message })),
-    };
-  }
-
-  if (err?.type === 'entity.parse.failed') {
-    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
-  }
-  if (err?.type === 'entity.too.large') {
-    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
-  }
-
-  if (typeof err?.code === 'string' && MYSQL_ERRORS[err.code]) {
-    return MYSQL_ERRORS[err.code];
-  }
-
-  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 && err.expose) {
-    return { status: err.status, code: 'BAD_REQUEST', message: err.message };
-  }
-
-  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' };
-}
-
-// eslint-disable-next-line no-unused-vars
-export function errorHandler(err, req, res, next) {
-  if (res.headersSent) return next(err);
-
-  const http = toHttpError(err);
-
-  if (http.status >= 500) {
-    (req.log ?? logger).error({ err }, 'unhandled error');
-  }
-
-  if (http.status === 401) res.set('WWW-Authenticate', 'Bearer');
-
-  res.status(http.status).json({
-    error: {
-      code: http.code,
-      message: http.message,
-      ...(http.details ? { details: http.details } : {}),
-      requestId: req.id,
-    },
-  });
-}
+import { ZodError } from 'zod';
+import { AppError } from '../errors/app-error.js';
+import { logger } from '../config/logger.js';
+import { isInfrastructureError } from '../resilience/errors.js';
+
+// mysql2 errors carry a string `code`. These are CLIENT-caused, so they must not be 500s.
+const MYSQL_ERRORS = {
+  ER_DUP_ENTRY: { status: 409, code: 'CONFLICT', message: 'A record with the same unique value already exists' },
+  ER_NO_REFERENCED_ROW_2: { status: 400, code: 'INVALID_REFERENCE', message: 'A referenced record does not exist' },
+  ER_ROW_IS_REFERENCED_2: { status: 409, code: 'IN_USE', message: 'This record is referenced by other records' },
+};
+
+export function toHttpError(err) {
+  if (err instanceof AppError) {
+    return { status: err.statusCode, code: err.code, message: err.message, details: err.details };
+  }
+
+  if (err instanceof ZodError) {
+    return {
+      status: 400,
+      code: 'VALIDATION_ERROR',
+      message: 'Request validation failed',
+      details: err.issues.map((i) => ({ in: 'body', path: i.path.join('.'), message: i.message })),
+    };
+  }
+
+  if (err?.type === 'entity.parse.failed') {
+    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
+  }
+  if (err?.type === 'entity.too.large') {
+    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
+  }
+
+  // MySQL/Redis unreachable, timed out or pool full: a 503 the client may retry, NOT a bug-style 500
+  if (isInfrastructureError(err)) {
+    return { status: 503, code: 'DEPENDENCY_UNAVAILABLE', message: 'A required service is temporarily unavailable' };
+  }
+
+  if (typeof err?.code === 'string' && MYSQL_ERRORS[err.code]) {
+    return MYSQL_ERRORS[err.code];
+  }
+
+  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 && err.expose) {
+    return { status: err.status, code: 'BAD_REQUEST', message: err.message };
+  }
+
+  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' };
+}
+
+// eslint-disable-next-line no-unused-vars
+export function errorHandler(err, req, res, next) {
+  // The request deadline middleware already answered 503; the handler finished late. Nothing left to send.
+  if (res.locals.timedOut) {
+    (req.log ?? logger).warn({ err }, 'handler finished after the request deadline');
+    return;
+  }
+  if (res.headersSent) return next(err);
+
+  const http = toHttpError(err);
+
+  if (err?.retryAfterSeconds) res.set('Retry-After', String(err.retryAfterSeconds));
+  else if (http.status === 503) res.set('Retry-After', '2');
+
+  if (http.status >= 500 && http.status !== 503) {
+    (req.log ?? logger).error({ err }, 'unhandled error');
+  }
+
+  if (http.status === 401) res.set('WWW-Authenticate', 'Bearer');
+
+  res.status(http.status).json({
+    error: {
+      code: http.code,
+      message: http.message,
+      ...(http.details ? { details: http.details } : {}),
+      requestId: req.id,
+    },
+  });
+}
```

New settings (`src/config/env.js`), diff:

```diff
--- before/src/config/env.js
+++ after/src/config/env.js
@@ -1,49 +1,58 @@
-import { z } from 'zod';
-
-// z.coerce.boolean() is a trap: Boolean("false") is true. Parse the literal strings ourselves.
-// default() goes BEFORE transform() so the default is a valid input value (zod 4 semantics).
-const bool = (fallback) =>
-  z
-    .enum(['true', 'false'])
-    .default(fallback)
-    .transform((value) => value === 'true');
-
-const schema = z.object({
-  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
-  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
-  LOG_LEVEL: z
-    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
-    .default('info'),
-  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
-  CORS_ORIGINS: z.string().default('http://localhost:5173'),
-  DOCS_ENABLED: bool('true'),
-
-  DB_HOST: z.string().min(1).default('127.0.0.1'),
-  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
-  DB_USER: z.string().min(1),
-  DB_PASSWORD: z.string().default(''),
-  DB_NAME: z.string().regex(/^[A-Za-z0-9_]+$/, 'only letters, digits and underscore'),
-  DB_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
-
-  JWT_SECRET: z
-    .string()
-    .min(32, 'must be at least 32 characters')
-    .refine((value) => !value.startsWith('replace-with'), 'still the placeholder from .env.example'),
-  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'use a form like 15m, 1h, 7d').default('1h'),
-  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
-
-  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900_000),
-  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
-  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
-
-  REDIS_URL: z.string().min(1).optional(),
-});
-
-const parsed = schema.safeParse(process.env);
-
-if (!parsed.success) {
-  const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
-  throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
-}
-
-export const env = Object.freeze(parsed.data);
+import { z } from 'zod';
+
+// z.coerce.boolean() is a trap: Boolean("false") is true. Parse the literal strings ourselves.
+// default() goes BEFORE transform() so the default is a valid input value (zod 4 semantics).
+const bool = (fallback) =>
+  z
+    .enum(['true', 'false'])
+    .default(fallback)
+    .transform((value) => value === 'true');
+
+const schema = z.object({
+  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
+  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
+  LOG_LEVEL: z
+    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
+    .default('info'),
+  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
+  CORS_ORIGINS: z.string().default('http://localhost:5173'),
+  DOCS_ENABLED: bool('true'),
+
+  DB_HOST: z.string().min(1).default('127.0.0.1'),
+  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
+  DB_USER: z.string().min(1),
+  DB_PASSWORD: z.string().default(''),
+  DB_NAME: z.string().regex(/^[A-Za-z0-9_]+$/, 'only letters, digits and underscore'),
+  DB_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
+
+  JWT_SECRET: z
+    .string()
+    .min(32, 'must be at least 32 characters')
+    .refine((value) => !value.startsWith('replace-with'), 'still the placeholder from .env.example'),
+  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'use a form like 15m, 1h, 7d').default('1h'),
+  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
+
+  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900_000),
+  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
+  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
+
+  REDIS_URL: z.string().min(1).optional(),
+
+  // --- resilience (chaos lab) ---
+  DB_QUERY_TIMEOUT_MS: z.coerce.number().int().min(100).default(1500), // give up waiting for MySQL after this
+  DB_QUEUE_MAX: z.coerce.number().int().min(0).default(20), // bulkhead waiting room
+  DB_QUEUE_TIMEOUT_MS: z.coerce.number().int().min(10).default(500), // max wait for a free DB slot
+  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).default(5000), // per-request deadline -> 503
+  // Load shedding threshold. 0 = automatic: 2 x DB_POOL_SIZE (admitted requests must not outnumber what the pool can serve).
+  MAX_INFLIGHT_REQUESTS: z.coerce.number().int().min(0).default(0),
+  DRAIN_DELAY_MS: z.coerce.number().int().min(0).max(60000).default(0), // SIGTERM -> not-ready -> wait -> close
+});
+
+const parsed = schema.safeParse(process.env);
+
+if (!parsed.success) {
+  const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
+  throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
+}
+
+export const env = Object.freeze(parsed.data);
```

Unit tests for the helpers (they ran, output in the "Verification" section at the end): `tests/unit/resilience.test.js`.

```js
import { describe, expect, it, vi } from 'vitest';
import { backoffDelayMs } from '../../src/resilience/backoff.js';
import { createBulkhead } from '../../src/resilience/bulkhead.js';
import { createCircuitBreaker } from '../../src/resilience/circuit-breaker.js';
import { withTimeout } from '../../src/resilience/timeout.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = () => Promise.reject(Object.assign(new Error('down'), { code: 'ECONNREFUSED' }));

describe('withTimeout', () => {
  it('rejects when the promise is too slow and hands the late value to onLate', async () => {
    const onLate = vi.fn();
    const slow = sleep(60).then(() => 'late-value');
    await expect(withTimeout(slow, 20, 'thing', onLate)).rejects.toMatchObject({ code: 'DEPENDENCY_TIMEOUT' });
    await sleep(80);
    expect(onLate).toHaveBeenCalledWith('late-value');
  });
});

describe('circuit breaker', () => {
  it('opens after N consecutive failures, then rejects immediately without calling the dependency', async () => {
    const breaker = createCircuitBreaker({ name: 't', timeoutMs: 100, failureThreshold: 3, resetTimeoutMs: 50 });
    const dependency = vi.fn(fail);
    for (let i = 0; i < 3; i += 1) await expect(breaker.exec(dependency)).rejects.toMatchObject({ code: 'ECONNREFUSED' });
    expect(breaker.state()).toBe('open');

    await expect(breaker.exec(dependency)).rejects.toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(dependency).toHaveBeenCalledTimes(3); // the 4th call never reached the dependency
  });

  it('half-open: one trial call; success closes the circuit', async () => {
    const breaker = createCircuitBreaker({ name: 't', timeoutMs: 100, failureThreshold: 1, resetTimeoutMs: 30 });
    await expect(breaker.exec(fail)).rejects.toBeTruthy();
    expect(breaker.state()).toBe('open');
    await sleep(40);
    await expect(breaker.exec(() => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(breaker.state()).toBe('closed');
  });

  it('half-open: a failed trial re-opens the circuit', async () => {
    const breaker = createCircuitBreaker({ name: 't', timeoutMs: 100, failureThreshold: 1, resetTimeoutMs: 30 });
    await expect(breaker.exec(fail)).rejects.toBeTruthy();
    await sleep(40);
    await expect(breaker.exec(fail)).rejects.toBeTruthy();
    expect(breaker.state()).toBe('open');
  });

  it('does not count errors that isFailure rejects (caller mistakes are not outages)', async () => {
    const breaker = createCircuitBreaker({
      name: 't',
      timeoutMs: 100,
      failureThreshold: 2,
      isFailure: (err) => err.code === 'ECONNREFUSED',
    });
    const dup = () => Promise.reject(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }));
    for (let i = 0; i < 5; i += 1) await expect(breaker.exec(dup)).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
    expect(breaker.state()).toBe('closed');
  });

  it('counts a timeout as a failure', async () => {
    const breaker = createCircuitBreaker({ name: 't', timeoutMs: 10, failureThreshold: 2 });
    const hang = () => sleep(200);
    await expect(breaker.exec(hang)).rejects.toMatchObject({ code: 'DEPENDENCY_TIMEOUT' });
    await expect(breaker.exec(hang)).rejects.toMatchObject({ code: 'DEPENDENCY_TIMEOUT' });
    expect(breaker.state()).toBe('open');
  });
});

describe('bulkhead', () => {
  it('runs at most maxConcurrent at once, queues a few, rejects the rest immediately', async () => {
    const bulkhead = createBulkhead({ name: 'b', maxConcurrent: 2, maxQueue: 1, queueTimeoutMs: 500 });
    const r1 = await bulkhead.acquire();
    const r2 = await bulkhead.acquire();
    const third = bulkhead.acquire(); // waits in the single queue slot
    await expect(bulkhead.acquire()).rejects.toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' }); // queue full
    r1(); // frees a slot -> the waiter gets it
    const r3 = await third;
    expect(bulkhead.stats()).toMatchObject({ active: 2, waiting: 0 });
    r2();
    r3();
    expect(bulkhead.stats().active).toBe(0);
  });

  it('gives up waiting after queueTimeoutMs', async () => {
    const bulkhead = createBulkhead({ name: 'b', maxConcurrent: 1, maxQueue: 5, queueTimeoutMs: 30 });
    await bulkhead.acquire();
    await expect(bulkhead.acquire()).rejects.toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(bulkhead.stats().waiting).toBe(0);
  });

  it('release() is idempotent', async () => {
    const bulkhead = createBulkhead({ name: 'b', maxConcurrent: 1, maxQueue: 0, queueTimeoutMs: 30 });
    const release = await bulkhead.acquire();
    release();
    release();
    expect(bulkhead.stats().active).toBe(0);
  });
});

describe('backoffDelayMs (full jitter)', () => {
  it('grows exponentially up to the cap and is always between 0 and the ceiling', () => {
    const max = () => 0.999999; // worst case random
    expect(backoffDelayMs(0, { baseMs: 500, capMs: 30_000, random: max })).toBeLessThan(500);
    expect(backoffDelayMs(3, { baseMs: 500, capMs: 30_000, random: max })).toBeLessThan(4_000);
    expect(backoffDelayMs(10, { baseMs: 500, capMs: 30_000, random: max })).toBeLessThan(30_000); // capped
    expect(backoffDelayMs(5, { baseMs: 500, capMs: 30_000, random: () => 0 })).toBe(0);
  });

  it('spreads clients out: 1000 callers do not all pick the same delay', () => {
    const delays = new Set(Array.from({ length: 1000 }, () => backoffDelayMs(4, { baseMs: 500 })));
    expect(delays.size).toBeGreaterThan(500);
  });
});
```

### 1.7 OBSERVED (after) - same script, same load

```text
[13:45:26] steady load: 10 req/s GET /api/v1/tasks for 45s. docker kill ch-mysql at t=6, docker start at t=18
>> t=10s: ready_check
GET /health/ready -> HTTP 503 in 0.005745s
GET /health       -> HTTP 200 in 0.005265s
>> t=12s: req http://api1:3000 /api/v1/tasks?limit=1
HTTP 503 in 185ms retry-after=1 {"error":{"code":"DEPENDENCY_UNAVAILABLE","message":"mysql is temporarily unavailable","details":{"dependency":"mysql","reason":"circuit open"},"requestId":"9
t= 0s  n=  9  p50=   27ms  max=  203ms  200x9
t= 1s  n= 10  p50=   20ms  max=   25ms  200x10
t= 2s  n= 10  p50=   12ms  max=   15ms  200x10
t= 3s  n= 10  p50=   12ms  max=   19ms  200x10
t= 4s  n= 10  p50=    9ms  max=   14ms  200x10
t= 5s  n= 10  p50=    9ms  max=  135ms  200x7 503x3
t= 6s  n= 10  p50= 1518ms  max= 1534ms  503x10
t= 7s  n= 10  p50=  219ms  max= 2003ms  503x10
t= 8s  n= 10  p50=   15ms  max=   33ms  503x10
t= 9s  n= 10  p50=    7ms  max=   10ms  503x10
t=10s  n= 10  p50=    6ms  max=   17ms  503x10
t=11s  n= 10  p50=    6ms  max=   12ms  503x10
t=12s  n= 10  p50=    6ms  max= 1503ms  503x10
t=13s  n= 10  p50=    5ms  max=    7ms  503x10
t=14s  n= 10  p50=    4ms  max=    5ms  503x10
t=15s  n= 10  p50=    4ms  max=    6ms  503x10
t=16s  n= 10  p50=    5ms  max=    8ms  503x10
t=17s  n= 10  p50=    7ms  max=    9ms  503x10
t=18s  n= 10  p50=    6ms  max=   16ms  503x10
t=19s  n= 10  p50=    6ms  max= 1513ms  503x10
t=20s  n= 10  p50=    7ms  max=   10ms  503x10
t=21s  n= 10  p50=    9ms  max=   16ms  503x10
t=22s  n= 10  p50=    6ms  max=    8ms  503x10
t=23s  n= 10  p50=    5ms  max=    7ms  503x10
t=24s  n= 10  p50=    4ms  max=    7ms  503x10
t=25s  n= 10  p50=    8ms  max=   58ms  200x4 503x6
t=26s  n= 10  p50=    8ms  max=    9ms  200x10
t=27s  n=  9  p50=   14ms  max=   20ms  200x9
t=28s  n= 10  p50=   10ms  max=   20ms  200x10
t=29s  n= 10  p50=    8ms  max=   13ms  200x10
t=30s  n= 10  p50=   12ms  max=   36ms  200x10
t=31s  n= 10  p50=   16ms  max=   20ms  200x10
t=32s  n= 10  p50=   12ms  max=   13ms  200x10
t=33s  n= 10  p50=   13ms  max=   16ms  200x10
t=34s  n= 10  p50=    9ms  max=   13ms  200x10
t=35s  n= 10  p50=    9ms  max=   10ms  200x10
t=36s  n= 10  p50=   10ms  max=   12ms  200x10
t=37s  n= 10  p50=   14ms  max=   29ms  200x10
t=38s  n= 10  p50=   21ms  max=   43ms  200x10
t=39s  n= 10  p50=   16ms  max=   18ms  200x10
t=40s  n= 10  p50=    9ms  max=   17ms  200x10
t=41s  n= 10  p50=   13ms  max=   17ms  200x10
t=42s  n= 10  p50=    8ms  max=   11ms  200x10
t=43s  n= 10  p50=    9ms  max=   12ms  200x10
t=44s  n= 10  p50=    8ms  max=   12ms  200x10
TOTAL {"200":249,"503":199}
[13:46:12] distinct API log messages during the run:
    250 "msg":"request completed"
    200 "msg":"request errored"
    200 "message":"failed with status code 503"
      7 "msg":"circuit breaker state change"
      1 "msg":"server listening"
      1 "msg":"readiness check failed"
```

| Same script, MySQL down from t=6 | Before | After |
|----------------------------------|--------|-------|
| Requests answered with 200 | 40 | 249 |
| 500 INTERNAL_ERROR | 259 | 0 |
| Hung until the client gave up (8 s) | 143 | 0 |
| 503 `DEPENDENCY_UNAVAILABLE` + `Retry-After` | 0 | 199 |
| Typical latency during the outage | 8000 ms (hung) or 4-8 ms (queue full) | 4-12 ms; one 1.5 s trial call every 5-7 s |
| `/health/ready` during the outage | no answer in 5 s | HTTP 503 in 6 ms |
| API serving 200 again | not yet at the end of the run (about 28 s after the restart) | first 200 about 9 s after the restart |

The breaker's "state change" log lines (7 in this run: closed -> open -> half-open -> open ... -> closed) are the audit trail: alert on
`circuit breaker state change` to `open`.

Trade-off to be able to explain: during the outage the "after" system still answers 503 for the same period, it does not magically stay up.
What changed is that failure is FAST, explicit and self-healing, so threads, sockets and the pool are free for the moment MySQL returns.

### 1.8 Interview answer

**Interview answer:** "I killed MySQL under load against my Task API. My hypothesis was fast 500s and quick recovery; reality was different. Because
`docker kill` leaves no TCP reset, connection attempts hung for the 10 s connect timeout, 143 of 442 requests got no answer at all, the rest got 500s
that were really 'Queue limit reached' from the driver's waiting line, and readiness itself hung. I fixed it with a 3 s connect timeout, a 1.5 s
deadline on every pool call, a circuit breaker that fails fast after five consecutive failures, and an error mapper that returns 503 with
Retry-After for infrastructure errors. Rerunning the same script gave zero hung requests, zero 500s, a clean 503 readiness in 6 ms and recovery
about 9 s after MySQL was started."

### 1.9 Follow-up questions

1. *Why not retry the query?* A retry cannot fix a dead database; it multiplies the load. Retry transient errors (deadlock) with backoff and jitter (`withTransaction` does) and let the breaker handle outages.
2. *Why does liveness not check the database?* If it did, a DB outage would make the orchestrator restart every healthy API instance in a loop, adding load exactly when the DB comes back.
3. *What does a half-open state protect?* It stops a recovering database from receiving the full traffic at once: one trial call proves it is back.
4. *Could you serve stale data instead of a 503?* Yes for reads: a fallback to the Redis cache (even expired entries) is a valid design for `GET /tasks/:id`. It is NOT implemented here; it is a deliberate product decision (stale vs unavailable).

**Common mistakes**

- Assuming a failed dependency returns an error quickly.
- Timeouts that are longer than the caller's own timeout (the client has already left).
- Returning 500 for infrastructure failures (hides the cause, trains people to ignore 5xx).
- Putting the database in the LIVENESS probe.

**Revision notes:** kill vs black hole; connect timeout; breaker states; 503 + Retry-After; readiness must be fast; absence of errors is not health.

**Key concepts**

- Connect timeout, query deadline, circuit breaker (closed/open/half-open), `isFailure`, 503 vs 500, readiness vs liveness, MTTR.

**Revision questions**

1. Why did the first failure mode look like "no errors" in the server log?
2. Which of the 259 errors were real database errors, and what were the rest?
3. What exactly is "half-open" and why only ONE trial call?
4. Why is the breaker counting only infrastructure errors?

**Practical task**: change `failureThreshold` to 1 and `resetTimeoutMs` to 30000, rerun, and describe the user-visible difference during the first minute after the DB returns.

- [ ] I reproduced the hang and the `Queue limit reached.` 500s
- [ ] I can draw the breaker state machine
- [ ] I ran the after-fix script and compared the table

---

## Module 2 - Failure 2: kill Redis (cache + queue): silent data loss

**Learning objectives**

- Prove (or disprove) "the API keeps working when Redis dies".
- Find the failure class that no HTTP metric shows: a lost background job.
- Implement a MySQL outbox with a relay that retries with exponential backoff and jitter.

### 2.1 Concept (Hinglish)

Part 12 ka claim hai: "Redis down ho to bhi API chalti rahe". Cache ke liye ye sach hai (cache miss). Lekin Redis yahan
queue bhi hai. Task assign karte hi hum notification job enqueue karte hain, aur fail hone par sirf log likhte hain. Matlab: user ko `201 Created` milta hai,
database me data hai, par **notification kabhi nahi jayegi** aur kisi ko pata bhi nahi chalega. Yeh hai silent data loss.

### 2.2 Hypothesis

"All requests keep returning 201 with normal latency (cache falls back to MySQL). Notifications for tasks created while Redis was down are lost, because the
post-commit hook only logs the enqueue failure."

### 2.3 Command

```bash
VARIANT=before bash chaos/s02-kill-redis.sh
```

```bash
#!/usr/bin/env bash
# Failure 2: Redis (cache + BullMQ queue) is killed at t=5 and started again at t=20.
# Writes (POST /tasks with an assignee) are used on purpose: they touch the cache AND the notification queue.
. "$(dirname "$0")/lib.sh"
up
sql "DELETE FROM tasks WHERE title LIKE 'probe task%'"
sql "DELETE FROM outbox" || true # leftovers of a previous run (the table only exists after migration 002)
SINCE=$(date -u +%Y-%m-%dT%H:%M:%S)
log "steady load: 5 req/s POST /api/v1/tasks (assigneeId=2) for 50s. docker kill ch-redis at t=8, docker start at t=22"
start_clock
( at 8 docker kill ch-redis >/dev/null
  at 12 req http://api1:3000 /api/v1/tasks POST '{"title":"manual request during redis outage","assigneeId":2}'
  at 22 docker start ch-redis >/dev/null ) &
probe http://api1:3000 50 5 POST
wait
sleep 8
CREATED=$(sql "SELECT COUNT(*) FROM tasks WHERE title LIKE 'probe task%'" | tail -1)
SENT=$(docker logs ch-worker-1 --since "$SINCE" 2>&1 | grep -c 'sending assignment notification')
log "tasks committed in MySQL: $CREATED   assignment notifications actually sent by the worker: $SENT"
log "rows still waiting in the outbox table (only the AFTER image writes to it): $(sql 'SELECT COUNT(*) FROM outbox' | tail -1)"
log "outbox relay log lines in the worker:"; docker logs ch-worker-1 --since "$SINCE" 2>&1 | grep -oE '"msg":"outbox relay[^"]*"|"relayed":[0-9]+' | paste - - | head -5
log "distinct API log messages:"; log_summary 60s
```

The load is `POST /api/v1/tasks` with an assignee (5 per second for 50 s): a write touches both the cache (invalidation) and the queue (notification).
Redis is killed at t=8 and started again at t=22.

### 2.4 OBSERVED (before)

```text
[14:01:31] steady load: 5 req/s POST /api/v1/tasks (assigneeId=2) for 50s. docker kill ch-redis at t=8, docker start at t=22
>> t=12s: req http://api1:3000 /api/v1/tasks POST {"title":"manual request during redis outage","assigneeId":2}
HTTP 201 in 403ms retry-after=null {"data":{"id":3243,"title":"manual request during redis outage","description":null,"status":"todo","priority":"medium","dueDate":null,"createdBy":1,"assign
t= 0s  n=  4  p50=   70ms  max=  294ms  201x4
t= 1s  n=  5  p50=   48ms  max=   85ms  201x5
t= 2s  n=  5  p50=   63ms  max=  127ms  201x5
t= 3s  n=  5  p50=   49ms  max=   70ms  201x5
t= 4s  n=  5  p50=   87ms  max=  126ms  201x5
t= 5s  n=  5  p50=  105ms  max=  129ms  201x5
t= 6s  n=  5  p50=   58ms  max=   69ms  201x5
t= 7s  n=  5  p50=   48ms  max=  537ms  201x5
t= 8s  n=  4  p50=  393ms  max=  586ms  201x4
t= 9s  n=  5  p50=   37ms  max=   39ms  201x5
t=10s  n=  5  p50=   46ms  max=   54ms  201x5
t=11s  n=  5  p50=   46ms  max=   75ms  201x5
t=12s  n=  5  p50=   48ms  max=   73ms  201x5
t=13s  n=  5  p50=   33ms  max=   67ms  201x5
t=14s  n=  5  p50=   32ms  max=   39ms  201x5
t=15s  n=  5  p50=   40ms  max=   43ms  201x5
t=16s  n=  5  p50=   32ms  max=   40ms  201x5
t=17s  n=  5  p50=   24ms  max=   31ms  201x5
t=18s  n=  5  p50=   28ms  max=   34ms  201x5
t=19s  n=  5  p50=   39ms  max=   91ms  201x5
t=20s  n=  5  p50=   33ms  max=   33ms  201x5
t=21s  n=  5  p50=   66ms  max=  153ms  201x5
t=22s  n=  5  p50=   97ms  max=  178ms  201x5
t=23s  n=  5  p50=   31ms  max=   58ms  201x5
t=24s  n=  5  p50=   56ms  max=   62ms  201x5
t=25s  n=  5  p50=   61ms  max=   77ms  201x5
t=26s  n=  5  p50=   42ms  max=   74ms  201x5
t=27s  n=  5  p50=   36ms  max=  149ms  201x5
t=28s  n=  5  p50=  115ms  max=  189ms  201x5
t=29s  n=  5  p50=   41ms  max=   78ms  201x5
t=30s  n=  5  p50=   30ms  max=   33ms  201x5
t=31s  n=  4  p50=   39ms  max=   65ms  201x4
t=32s  n=  5  p50=   47ms  max=  148ms  201x5
t=33s  n=  5  p50=   44ms  max=  102ms  201x5
t=34s  n=  5  p50=   45ms  max=   65ms  201x5
t=35s  n=  5  p50=   37ms  max=   48ms  201x5
t=36s  n=  5  p50=   43ms  max=   55ms  201x5
t=37s  n=  5  p50=   25ms  max=   37ms  201x5
t=38s  n=  5  p50=   31ms  max=   46ms  201x5
t=39s  n=  5  p50=   29ms  max=   36ms  201x5
t=40s  n=  5  p50=   27ms  max=   55ms  201x5
t=41s  n=  5  p50=   54ms  max=   72ms  201x5
t=42s  n=  5  p50=   44ms  max=   61ms  201x5
t=43s  n=  5  p50=   32ms  max=   37ms  201x5
t=44s  n=  5  p50=   44ms  max=   48ms  201x5
t=45s  n=  5  p50=   29ms  max=   42ms  201x5
t=46s  n=  5  p50=   30ms  max=   44ms  201x5
t=47s  n=  5  p50=   27ms  max=   29ms  201x5
t=48s  n=  5  p50=   32ms  max=   61ms  201x5
t=49s  n=  5  p50=   30ms  max=   33ms  201x5
TOTAL {"201":247}
[14:02:31] tasks committed in MySQL: 247   assignment notifications actually sent by the worker: 168
[14:02:31] rows still waiting in the outbox table (only the AFTER image writes to it): 0
[14:02:31] outbox relay log lines in the worker:
[14:02:32] distinct API log messages:
    249 "message":"Stream isn't writeable and enableOfflineQueue options is false"
    248 "msg":"request completed"
    168 "msg":"cache operation failed, continuing without cache"
     80 "msg":"failed to enqueue notification"
      3 "msg":"redis connection error"
      3 "msg":"notification queue error"
```

- **No HTTP symptom at all**: 247 of 247 probe requests were `201`, p50 about 30-45 ms before, during and after the outage. Every dashboard built on
  RED metrics (rate, errors, duration) stays green.
- **Silent data loss**: the script counts tasks committed in MySQL against notifications the worker actually sent. See the line starting `tasks committed in MySQL`:
  the worker sent 168 notifications for 248 assigned tasks. 80 enqueue failures were logged as `failed to enqueue notification` at level ERROR, with nothing else
  (no metric, no retry, no outbox). Those users were never told about their tasks.
- The cache did what it was designed to do: `cache operation failed, continuing without cache` (warning), requests served from MySQL.
- (Observed once in an earlier, unlogged run: after Redis restarted, requests hung for more than 15 s until the clients timed out. I could NOT reproduce it in two further runs, so I do not claim it. If you see it, suspect the BullMQ producer connection and the missing command timeout. See "Not verified".)

### 2.5 How monitoring would have alerted

HTTP/RED alerts: nothing. These are the alerts that WOULD have fired, and you must build them on purpose:

| Alert | Expression (illustrative) |
|-------|---------------------------|
| Redis down | `redis_up == 0` for 1 min |
| Enqueue failures | `increase(notifications_enqueue_failed_total[5m]) > 0` (or the log line `failed to enqueue notification`) |
| Business invariant | `rate(tasks_assigned_total[10m]) > 0 and rate(notifications_sent_total[10m]) == 0`: "work is created, nothing is delivered" |
| Queue health | queue depth and OLDEST job age; worker job completion rate dropping to 0 |

The pattern: for every asynchronous side effect, alert on the RATIO between "requested" and "completed".

### 2.6 Fix

1. **Fallback with durability: the outbox.** If `queue.add` fails, park the job in a MySQL table `outbox` (`INSERT IGNORE`, unique `job_id`).
   MySQL is up (Redis is the one that died) and is the system of record anyway.
2. **Relay in the worker**: every 2 s read parked rows, publish them to BullMQ, delete a row ONLY after a successful publish. A crash between publish and delete
   re-publishes the same job id, which BullMQ ignores.
3. **Retry with exponential backoff and full jitter** for the relay: while Redis is still down each failed round waits longer (2 s, up to 30 s, random between 0 and the cap), so the
   workers do not hammer a dependency that is trying to recover.
4. **Never lose silently**: if BOTH Redis and MySQL fail, log `NOTIFICATION LOST: queue and outbox both failed` with the full payload at ERROR (alert on this string).
5. The publish path has a 500 ms timeout and its own breaker (Module 3 explains why).

Files that change: NEW `db/migrations/002_outbox_and_dedupe.sql`, `src/queue/outbox.js`, `src/resilience/backoff.js`; CHANGED `src/queue/notifications.js`, `src/worker.js`
(starts the relay), `src/modules/tasks/task-hooks.js`.

```sql
-- 002_outbox_and_dedupe.sql : chaos-lab fixes for "Redis/queue down = lost notification" and "duplicate delivery"

-- Jobs that could not be published to Redis are parked here and re-published by the worker's relay loop.
CREATE TABLE outbox (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_name   VARCHAR(100)    NOT NULL,
  job_id     VARCHAR(255)    NOT NULL,
  payload    JSON            NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_outbox_job_id (job_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- One row per logical notification that was handled. The PRIMARY KEY is the idempotency guard (idempotent consumer).
CREATE TABLE notification_log (
  dedupe_key   VARCHAR(255) NOT NULL,
  job_id       VARCHAR(255) NULL,
  processed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dedupe_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
```

```js
import { logger } from '../config/logger.js';
import { pool } from '../db/pool.js';
import { backoffDelayMs } from '../resilience/backoff.js';

// Park a job that could not be published. UNIQUE(job_id) + INSERT IGNORE: parking the same event twice is harmless.
export async function saveToOutbox(name, data, jobId) {
  await pool.query('INSERT IGNORE INTO outbox (job_name, job_id, payload) VALUES (?, ?, ?)', [
    name,
    jobId,
    JSON.stringify(data),
  ]);
}

/**
 * Relay: publish parked jobs to the queue, delete a row only AFTER the publish worked.
 * If the process dies between publish and delete, the job is published again next round: same job id, so BullMQ
 * ignores the duplicate, and the consumer's dedupe table covers anything that slips through.
 */
export async function relayOutboxOnce(publish, batchSize = 50) {
  const [rows] = await pool.query('SELECT id, job_name, job_id, payload FROM outbox ORDER BY id ASC LIMIT ?', [
    batchSize,
  ]);
  let relayed = 0;
  for (const row of rows) {
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    await publish(row.job_name, payload, row.job_id); // throws -> stop this round, retry next round
    await pool.query('DELETE FROM outbox WHERE id = ?', [row.id]);
    relayed += 1;
  }
  if (relayed > 0) logger.info({ relayed }, 'outbox relay published parked jobs');
  return relayed;
}

// Poll loop with retry + backoff + jitter: after a failed round (Redis still down) wait longer each time, up to 30 s,
// instead of hammering a dependency that is trying to recover. A successful round goes back to the normal 2 s rhythm.
export function startOutboxRelay(publish, intervalMs = 2_000) {
  let stopped = false;
  let timer = null;
  let failures = 0;

  async function round() {
    try {
      await relayOutboxOnce(publish);
      failures = 0;
    } catch (err) {
      failures += 1;
      logger.warn({ err, failures }, 'outbox relay round failed, backing off');
    }
    if (stopped) return;
    const wait = failures === 0 ? intervalMs : Math.max(intervalMs, backoffDelayMs(failures, { baseMs: intervalMs }));
    timer = setTimeout(round, wait);
  }

  timer = setTimeout(round, intervalMs);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
```

```js
/**
 * "Full jitter" exponential backoff: wait a RANDOM time between 0 and min(cap, base * 2^attempt).
 * Exponential = a struggling dependency gets more breathing room after every failure.
 * Jitter = many clients that failed at the same moment do NOT all retry at the same moment (retry storm).
 * `random` is injectable so tests are deterministic.
 */
export function backoffDelayMs(attempt, { baseMs = 500, capMs = 30_000, random = Math.random } = {}) {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(random() * ceiling);
}
```

`src/queue/notifications.js` (full new file; the publish breaker, `enqueueNotification` with the outbox fallback, and the dead-letter helper used in Module 4):

```js
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { createCircuitBreaker } from '../resilience/circuit-breaker.js';
import { saveToOutbox } from './outbox.js';

export const NOTIFICATIONS_QUEUE = 'notifications';
export const DEAD_LETTER_QUEUE = 'notifications-dlq';

// Producers (the API) should fail fast if Redis is down.
function createProducerConnection() {
  return new Redis(env.REDIS_URL, { enableOfflineQueue: false });
}

// Workers block on Redis commands, so BullMQ requires maxRetriesPerRequest: null.
export function createWorkerConnection() {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

let queue = null;
let deadLetterQueue = null;

function getQueue() {
  if (!env.REDIS_URL) return null;
  if (!queue) {
    queue = new Queue(NOTIFICATIONS_QUEUE, {
      connection: createProducerConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2_000 }, // 2s, 4s, 8s, 16s (BullMQ has no jitter option)
        removeOnComplete: { age: 3_600, count: 1_000 },
        removeOnFail: { age: 7 * 24 * 3_600 },
      },
    });
    queue.on('error', (err) => logger.warn({ err }, 'notification queue error'));
  }
  return queue;
}

function getDeadLetterQueue() {
  if (!deadLetterQueue) {
    deadLetterQueue = new Queue(DEAD_LETTER_QUEUE, {
      connection: createProducerConnection(),
      defaultJobOptions: { removeOnComplete: false, removeOnFail: false }, // nothing here is ever auto-deleted
    });
    deadLetterQueue.on('error', (err) => logger.warn({ err }, 'dead-letter queue error'));
  }
  return deadLetterQueue;
}

// A black-holed Redis never answers: bound every publish to 500 ms and fail fast once it is clearly down.
const publishBreaker = createCircuitBreaker({
  name: 'redis-queue',
  timeoutMs: 500,
  failureThreshold: 3,
  resetTimeoutMs: 5_000,
});

/** Publish or THROW. Used by the outbox relay, which needs to know whether it worked. */
export async function publishNotification(name, data, jobId) {
  const target = getQueue();
  if (!target) return false;
  await publishBreaker.exec(() => target.add(name, data, jobId ? { jobId } : {}));
  return true;
}

/**
 * Called from the post-commit hook. NEVER throws and NEVER waits much longer than 500 ms.
 * If the queue cannot take the job, it is parked in the MySQL outbox table (the relay in the worker re-publishes it).
 * Returns 'queued' | 'outbox' | 'lost' | 'disabled'.
 */
export async function enqueueNotification(name, data, jobId) {
  if (!env.REDIS_URL) return 'disabled';
  try {
    await publishNotification(name, data, jobId);
    return 'queued';
  } catch (err) {
    logger.warn({ err, name, jobId }, 'queue unavailable, parking notification in the outbox table');
  }
  try {
    await saveToOutbox(name, data, jobId);
    return 'outbox';
  } catch (err) {
    // Both Redis and MySQL are failing. This log line is the last record of the event: alert on this message.
    logger.error({ err, name, jobId, data }, 'NOTIFICATION LOST: queue and outbox both failed');
    return 'lost';
  }
}

/** Poison / exhausted jobs go to a queue nobody auto-deletes, and an ERROR log is written (alert on it). */
export async function moveToDeadLetter(job, err) {
  const target = getDeadLetterQueue();
  await target.add('dead-letter', {
    originalName: job.name,
    originalId: job.id,
    data: job.data,
    attemptsMade: job.attemptsMade,
    error: err.message,
    failedAt: new Date().toISOString(),
  });
  logger.error({ jobId: job.id, name: job.name, err: err.message }, 'job moved to the dead-letter queue');
}

export async function closeQueue() {
  const closing = [];
  if (queue) closing.push(queue.close());
  if (deadLetterQueue) closing.push(deadLetterQueue.close());
  await Promise.all(closing);
}
```

Honest limitation (say it in an interview): this is the CHEAP outbox. The event is saved to the outbox only AFTER the transaction committed and the queue publish
failed, so a process crash in that tiny window still loses a notification. The complete pattern writes the outbox row INSIDE the original MySQL transaction
(`INSERT INTO outbox` next to the `INSERT INTO tasks`) and a relay publishes it; then the window is zero, at the price of a table write on every assignment.

### 2.7 OBSERVED (after)

```text
[14:02:49] steady load: 5 req/s POST /api/v1/tasks (assigneeId=2) for 50s. docker kill ch-redis at t=8, docker start at t=22
>> t=12s: req http://api1:3000 /api/v1/tasks POST {"title":"manual request during redis outage","assigneeId":2}
HTTP 201 in 159ms retry-after=null {"data":{"id":3496,"title":"manual request during redis outage","description":null,"status":"todo","priority":"medium","dueDate":null,"createdBy":1,"assign
t= 0s  n=  4  p50=   44ms  max=  256ms  201x4
t= 1s  n=  5  p50=   34ms  max=   34ms  201x5
t= 2s  n=  5  p50=   29ms  max=   36ms  201x5
t= 3s  n=  5  p50=   28ms  max=   40ms  201x5
t= 4s  n=  5  p50=   31ms  max=   45ms  201x5
t= 5s  n=  5  p50=   29ms  max=   37ms  201x5
t= 6s  n=  5  p50=   33ms  max=   44ms  201x5
t= 7s  n=  5  p50=   30ms  max=   38ms  201x5
t= 8s  n=  5  p50=   38ms  max=   56ms  201x5
t= 9s  n=  5  p50=   27ms  max=   30ms  201x5
t=10s  n=  5  p50=   28ms  max=   30ms  201x5
t=11s  n=  5  p50=   30ms  max=   33ms  201x5
t=12s  n=  5  p50=   38ms  max=   39ms  201x5
t=13s  n=  5  p50=   38ms  max=   53ms  201x5
t=14s  n=  5  p50=   42ms  max=   50ms  201x5
t=15s  n=  5  p50=   31ms  max=   35ms  201x5
t=16s  n=  5  p50=   40ms  max=   57ms  201x5
t=17s  n=  5  p50=   30ms  max=   53ms  201x5
t=18s  n=  5  p50=   37ms  max=   41ms  201x5
t=19s  n=  5  p50=   42ms  max=   88ms  201x5
t=20s  n=  5  p50=   51ms  max=   66ms  201x5
t=21s  n=  5  p50=   41ms  max=   47ms  201x5
t=22s  n=  5  p50=   48ms  max=   62ms  201x5
t=23s  n=  5  p50=   46ms  max=   54ms  201x5
t=24s  n=  5  p50=   41ms  max=   45ms  201x5
t=25s  n=  5  p50=   36ms  max=   83ms  201x5
t=26s  n=  5  p50=   70ms  max=   80ms  201x5
t=27s  n=  5  p50=   41ms  max=   65ms  201x5
t=28s  n=  5  p50=   68ms  max=  119ms  201x5
t=29s  n=  5  p50=   55ms  max=  108ms  201x5
t=30s  n=  5  p50=   36ms  max=   59ms  201x5
t=31s  n=  5  p50=   45ms  max=   59ms  201x5
t=32s  n=  5  p50=   56ms  max=  115ms  201x5
t=33s  n=  5  p50=   56ms  max=   79ms  201x5
t=34s  n=  5  p50=   41ms  max=   64ms  201x5
t=35s  n=  5  p50=   33ms  max=   41ms  201x5
t=36s  n=  5  p50=   37ms  max=   57ms  201x5
t=37s  n=  5  p50=   31ms  max=   31ms  201x5
t=38s  n=  5  p50=   30ms  max=   41ms  201x5
t=39s  n=  5  p50=   27ms  max=   47ms  201x5
t=40s  n=  5  p50=   28ms  max=   46ms  201x5
t=41s  n=  5  p50=   28ms  max=   35ms  201x5
t=42s  n=  4  p50=   30ms  max=   45ms  201x4
t=43s  n=  5  p50=   32ms  max=   58ms  201x5
t=44s  n=  5  p50=   35ms  max=   49ms  201x5
t=45s  n=  5  p50=   29ms  max=   50ms  201x5
t=46s  n=  5  p50=   38ms  max=   60ms  201x5
t=47s  n=  5  p50=   24ms  max=   45ms  201x5
t=48s  n=  5  p50=   29ms  max=   45ms  201x5
t=49s  n=  5  p50=   34ms  max=   42ms  201x5
TOTAL {"201":248}
[14:03:49] tasks committed in MySQL: 248   assignment notifications actually sent by the worker: 249
[14:03:50] rows still waiting in the outbox table (only the AFTER image writes to it): 0
[14:03:50] outbox relay log lines in the worker:
"msg":"outbox relay round failed, backing off"	"msg":"outbox relay round failed, backing off"
"msg":"outbox relay round failed, backing off"	"relayed":50
"msg":"outbox relay published parked jobs"	"relayed":50
"msg":"outbox relay published parked jobs"	"relayed":3
"msg":"outbox relay published parked jobs"
[14:03:51] distinct API log messages:
    248 "msg":"request completed"
    103 "msg":"queue unavailable, parking notification in the outbox table"
     97 "message":"redis-queue is temporarily unavailable"
     18 "msg":"circuit breaker state change"
      9 "message":"Stream isn't writeable and enableOfflineQueue options is false"
      5 "msg":"redis connection error"
```

| Same script, Redis down t=8..22 | Before | After |
|---------------------------------|--------|-------|
| Tasks created (probe + 1 manual) | 248 | 249 |
| Notifications actually sent | 168 | 249 |
| Notifications lost | 80 | 0 |
| Probe requests answered 201 | 247 of 247 | 248 of 248 |
| Extra log signal | `failed to enqueue notification` x80, nothing else | `queue unavailable, parking notification in the outbox table` + breaker state changes + relay lines |

### 2.8 Interview answer

**Interview answer:** "'The API keeps working without Redis' was true for HTTP: 100 percent 201s with the same latency. But Redis was also my queue, and my
post-commit hook only logged enqueue failures, so 80 of 248 assignment notifications were silently dropped, while every RED dashboard stayed green. I fixed it
with an outbox table in MySQL: if the publish fails the job is parked, and a relay in the worker republishes it with exponential backoff and full jitter, deleting the
row only after a successful publish. Delivery becomes at-least-once, so the consumer has to be idempotent (that is the duplicate-messages module). Rerun: 249 of 249 delivered. The remaining gap is a crash between commit and outbox insert, which the full pattern closes by
writing the outbox row in the same transaction."

### 2.9 Follow-up questions

1. *Why not just retry the enqueue in the request?* It adds latency to the user for something they do not need to wait for, and it does not survive a restart; a durable table does.
2. *Why a table and not another queue?* A second broker has the same dual-write problem. The database is already the source of truth and supports transactions.
3. *What is the dual-write problem?* Writing to two systems (MySQL and Redis) cannot be atomic; one can succeed while the other fails. The outbox turns it into one write plus an asynchronous, retryable copy.
4. *What about stale cache entries?* Invalidations that fail while Redis is down leave old values behind; with 60 s / 30 s TTLs the damage is bounded. For stricter needs: version keys with a DB-backed version, or shorter TTL.

**Common mistakes**

- Catching an error, logging it, and moving on for something that must not be lost.
- Judging health only by HTTP status codes.
- Deleting the outbox row before the publish is confirmed.
- Retrying with a fixed delay and no jitter.

**Revision notes:** dual-write problem; outbox + relay; at-least-once; delete after publish; backoff + jitter; alert on requested-vs-completed ratio.

**Key concepts**

- Silent data loss, dual write, transactional outbox, relay, exponential backoff, jitter, at-least-once delivery.

**Revision questions**

1. Why did no HTTP metric change while 32 percent of notifications were lost?
2. Which exact window can still lose a notification after the fix?
3. Why must the relay delete a row only after the publish succeeded?
4. What does "full jitter" mean and what problem does it prevent?

**Practical task**: stop the worker (`docker stop ch-worker-1`) and kill Redis; create 20 tasks; start both again and count notifications. Then add the outbox insert inside the transaction in `tasks.service.js`.

- [ ] I measured created vs delivered
- [ ] I can explain the remaining crash window
- [ ] I can explain backoff with jitter


## Module 3 - Failure 3: delay and partition the queue/cache path (toxiproxy)

**Learning objectives**

- Inject latency and a network partition (black hole) on the Redis path with toxiproxy (no `tc netem` needed).
- See that a "queue/cache is only an optimisation" assumption breaks when the dependency is SLOW, not dead.
- Add per-call deadlines and a breaker so slow Redis degrades to "cache miss" and "park in outbox".

`tc netem` alternative (Linux only, not run here): a privileged sidecar sharing the Redis container's network namespace, `docker run --rm --cap-add NET_ADMIN --network container:ch-redis alpine sh -c "apk add -q iproute2 && tc qdisc add dev eth0 root netem delay 1500ms"`. I used toxiproxy because it also works on Docker Desktop for Windows/macOS and can be switched on and off per proxy.

### 3.1 Concept (Hinglish)

Redis ka network slow ho jaye ya packets gayab hone lage (partition) to Redis "down" nahi hota, wo **chup** ho jata hai. Chup dependency
sabse khatarnak hai: na error, na response. Part 12 me `enableOfflineQueue: false` sirf tab bachata hai jab connection toot jaye; agar connection khula hai par jawab
nahi aa raha to command bas intezaar karti hai.

### 3.2 Hypothesis

"A slow Redis only delays notifications (they are asynchronous). The API stays fast because the cache is optional and the queue is a background mechanism."

### 3.3 Commands

```bash
VARIANT=before bash chaos/s03-queue-delay.sh      # GET path: cache
VARIANT=before bash chaos/s03b-queue-lag.sh       # POST path: cache invalidation + enqueue
```

```bash
#!/usr/bin/env bash
# Failure 3: the network path to Redis (cache + queue) gets slow, then partitioned (black hole), using toxiproxy.
. "$(dirname "$0")/lib.sh"
up
log "steady load: 5 req/s GET /api/v1/tasks for 36s. latency toxic 1500ms on t=6..16, black-hole (partition) on t=22..32"
start_clock
( at 6 toxi toxic add -t latency -a latency=1500 -n lat redis >/dev/null
  at 16 toxi toxic delete -n lat redis >/dev/null
  at 22 toxi toxic add -t timeout -a timeout=0 -n blackhole redis >/dev/null
  at 32 toxi toxic delete -n blackhole redis >/dev/null ) &
probe http://api1:3000 36 5 GET 10000
wait
log "distinct API log messages:"; log_summary 60s
```

The toxic commands it runs (the toxiproxy CLI inside the toxiproxy container):

```bash
toxiproxy-cli toxic add -t latency -a latency=1500 -n lat redis     # every response from Redis delayed by 1.5 s
toxiproxy-cli toxic delete -n lat redis
toxiproxy-cli toxic add -t timeout -a timeout=0 -n blackhole redis  # partition: data is held until the toxic is removed
toxiproxy-cli toxic delete -n blackhole redis
```

```bash
#!/usr/bin/env bash
# Failure 3b: the WRITE path. Redis answers 2 s late; measure how long one POST /tasks takes and how late the notification reaches the worker.
. "$(dirname "$0")/lib.sh"
up
toxi toxic add -t latency -a latency=2000 -n lat redis >/dev/null
log "Redis latency 2000ms is ON. creating ONE task with an assignee"
req http://api1:3000 /api/v1/tasks POST '{"title":"queue lag probe","assigneeId":2}'
START=$(date +%s)
for i in $(seq 1 30); do
  if docker logs ch-worker-1 --since 60s 2>&1 | grep -q 'sending assignment notification'; then break; fi
  sleep 1
done
log "notification reached the worker $(( $(date +%s) - START )) s after the API answered"
reset_toxics
```

### 3.4 OBSERVED (before)

`GET /api/v1/tasks` at 5 requests per second. Latency toxic 1500 ms from t=6 to 16, black hole from t=22 to 32:

```text
[13:15:25] steady load: 5 req/s GET /api/v1/tasks for 36s. latency toxic 1500ms on t=6..16, black-hole (partition) on t=22..32
t= 0s  n=  4  p50=   26ms  max=  192ms  200x4
t= 1s  n=  5  p50=   26ms  max=   35ms  200x5
t= 2s  n=  5  p50=   10ms  max=   12ms  200x5
t= 3s  n=  5  p50=   10ms  max=   14ms  200x5
t= 4s  n=  5  p50=    8ms  max=   11ms  200x5
t= 5s  n=  5  p50=   11ms  max=   19ms  200x5
t= 6s  n=  5  p50= 3017ms  max= 3024ms  200x5
t= 7s  n=  5  p50= 3025ms  max= 3031ms  200x5
t= 8s  n=  5  p50= 3017ms  max= 3021ms  200x5
t= 9s  n=  5  p50= 3013ms  max= 3021ms  200x5
t=10s  n=  5  p50= 3014ms  max= 3028ms  200x5
t=11s  n=  5  p50= 3011ms  max= 3016ms  200x5
t=12s  n=  5  p50= 3011ms  max= 3013ms  200x5
t=13s  n=  5  p50= 2055ms  max= 2452ms  200x5
t=14s  n=  5  p50= 1060ms  max= 1458ms  200x5
t=15s  n=  5  p50=   65ms  max=  461ms  200x5
t=16s  n=  5  p50=    9ms  max=   14ms  200x5
t=17s  n=  5  p50=   13ms  max=   20ms  200x5
t=18s  n=  5  p50=    8ms  max=   11ms  200x5
t=19s  n=  5  p50=   12ms  max=   16ms  200x5
t=20s  n=  5  p50=   15ms  max=   24ms  200x5
t=21s  n=  5  p50=10001ms  max=10003ms  200x2 CLIENT_TIMEOUTx3
t=22s  n=  5  p50= 9719ms  max=10002ms  200x4 CLIENT_TIMEOUTx1
t=23s  n=  5  p50= 8706ms  max= 9218ms  200x5
t=24s  n=  5  p50= 7706ms  max= 8144ms  200x5
t=25s  n=  5  p50= 6753ms  max= 7145ms  200x5
t=26s  n=  5  p50= 5776ms  max= 6169ms  200x5
t=27s  n=  5  p50= 4836ms  max= 5199ms  200x5
t=28s  n=  5  p50= 3815ms  max= 4239ms  200x5
t=29s  n=  5  p50= 2832ms  max= 3261ms  200x5
t=30s  n=  5  p50= 1884ms  max= 2236ms  200x5
t=31s  n=  5  p50=  864ms  max= 1262ms  200x5
t=32s  n=  5  p50=   15ms  max=  265ms  200x5
t=33s  n=  5  p50=    8ms  max=   13ms  200x5
t=34s  n=  5  p50=    8ms  max=    9ms  200x5
t=35s  n=  5  p50=    8ms  max=   14ms  200x5
TOTAL {"200":175,"CLIENT_TIMEOUT":4}
[13:16:02] distinct API log messages:
    176 "msg":"request completed"
      4 "msg":"request aborted"
      1 "msg":"server listening"
```

- Hypothesis WRONG. During the 1.5 s latency the API's own p50 went from about 10 ms to **3017 ms**: a list request makes two sequential Redis calls (read the version key, then read the
  list key), each paying the delay (2 x 1.5 s). Latency of a request = sum of its sequential dependency calls, so a delay of X costs N x X.
- During the black hole every request that started waited until the partition healed: latency climbed to the 10 s client timeout (4 timeouts, the others waited up to about 10 s and then completed).
  There was no error, so the status code histogram says `200` for all of it.
- **No log line.** The API log summary shows only `request completed`: a slow dependency leaves no trace in the logs except the response time field.

The write path (POST, which also invalidates the cache and enqueues the notification), with a constant 2 s Redis delay:

```text
[13:16:19] Redis latency 2000ms is ON. creating ONE task with an assignee
HTTP 201 in 12244ms retry-after=null {"data":{"id":2031,"title":"queue lag probe","description":null,"status":"todo","priority":"medium","dueDate":null,"createdBy":1,"assigneeId":2,"assignee
[13:16:37] notification reached the worker 5 s after the API answered
```

A single `POST /tasks` took **12.2 s** (about six sequential Redis round trips: delete, version increment, and the several commands of the BullMQ `add`). The notification then reached the worker a few seconds later. The queue was not "just delayed": the
HTTP request itself was held hostage by it, because `afterTasksChanged` is awaited inside the request.

### 3.5 How monitoring would have alerted

- Latency SLO alert: p99 of `GET /tasks` above 500 ms for 5 minutes. It fires within minutes. A pure error-rate alert does NOT fire (everything is 200).
- Per-dependency call duration (`dependency_call_duration_seconds{dependency="redis"}` p99) shows WHICH dependency is slow; without it you debug from the symptoms down.
- Redis: `redis_commands_duration_seconds`, `redis_connected_clients`, network probe (blackbox TCP check with a latency threshold).
- Log-based: response time above 2000 ms. The structured `responseTime` field makes this possible even without a metrics stack.

### 3.6 Fix

Both in `src/cache/cache.js` and `src/queue/notifications.js` (shown in Module 2):

1. **Per-call deadline**: every cache command gets 150 ms; every queue publish gets 500 ms. A healthy Redis answers in about 1 ms, so 150 ms means "already broken".
2. **Circuit breaker**: 5 consecutive failures open it for 5 s, so the next requests do not even try (and do not pay 150 ms each).
3. **Fallbacks**: cache -> behave as a miss and read MySQL; queue -> park in the outbox table (Module 2).
4. **Log hygiene**: warnings from the cache are throttled to one per 10 s (a dependency outage must not turn into a log flood that slows the process further).

Diff of `src/cache/cache.js` against Part 12:

```diff
--- before/src/cache/cache.js
+++ after/src/cache/cache.js
@@ -1,11 +1,12 @@
 import { Redis } from 'ioredis';
 import { env } from '../config/env.js';
 import { logger } from '../config/logger.js';
+import { createCircuitBreaker } from '../resilience/circuit-breaker.js';
 
 // No REDIS_URL -> no client -> every method below is a harmless no-op.
 const redis = env.REDIS_URL
   ? new Redis(env.REDIS_URL, {
-      maxRetriesPerRequest: 1, // fail a command quickly
+      maxRetriesPerRequest: 1,
       enableOfflineQueue: false, // while disconnected, fail immediately instead of buffering commands
       connectTimeout: 2_000,
     })
@@ -13,19 +14,31 @@
 
 redis?.on('error', (err) => logger.warn({ err }, 'redis connection error'));
 
+// A black-holed Redis never answers and never errors, so "fail fast" alone is not enough: every cache call also gets a
+// 150 ms deadline, and 5 consecutive failures open a breaker so the next 5 s of requests do not even try Redis.
+const breaker = createCircuitBreaker({ name: 'redis-cache', timeoutMs: 150, failureThreshold: 5, resetTimeoutMs: 5_000 });
+
+let lastWarnAt = 0;
+function warnThrottled(err, label) {
+  if (Date.now() - lastWarnAt < 10_000) return; // at most one warning per 10 s, not one per request
+  lastWarnAt = Date.now();
+  logger.warn({ err, label, breaker: breaker.stats() }, 'cache operation failed, continuing without cache');
+}
+
 // A cache must never take the API down: any Redis problem becomes "cache miss".
 async function safely(label, fallback, operation) {
   if (!redis) return fallback;
   try {
-    return await operation(redis);
+    return await breaker.exec(() => operation(redis));
   } catch (err) {
-    logger.warn({ err, label }, 'cache operation failed, continuing without cache');
+    warnThrottled(err, label);
     return fallback;
   }
 }
 
 export const cache = {
   enabled: Boolean(redis),
+  breaker,
 
   getText: (key) => safely('get', null, (client) => client.get(key)),
```

### 3.7 OBSERVED (after)

```text
[13:48:08] steady load: 5 req/s GET /api/v1/tasks for 36s. latency toxic 1500ms on t=6..16, black-hole (partition) on t=22..32
t= 0s  n=  4  p50=   23ms  max=  310ms  200x4
t= 1s  n=  5  p50=   23ms  max=   32ms  200x5
t= 2s  n=  5  p50=   24ms  max=   25ms  200x5
t= 3s  n=  5  p50=   16ms  max=   19ms  200x5
t= 4s  n=  5  p50=    9ms  max=   13ms  200x5
t= 5s  n=  5  p50=   15ms  max=  485ms  200x5
t= 6s  n=  5  p50=   15ms  max=  189ms  200x5
t= 7s  n=  5  p50=   11ms  max=   13ms  200x5
t= 8s  n=  5  p50=   14ms  max=   21ms  200x5
t= 9s  n=  5  p50=   20ms  max=   27ms  200x5
t=10s  n=  5  p50=   18ms  max=   35ms  200x5
t=11s  n=  5  p50=   16ms  max=  164ms  200x5
t=12s  n=  5  p50=   13ms  max=   15ms  200x5
t=13s  n=  5  p50=   12ms  max=   15ms  200x5
t=14s  n=  5  p50=   14ms  max=   28ms  200x5
t=15s  n=  5  p50=   24ms  max=   28ms  200x5
t=16s  n=  5  p50=   12ms  max=   41ms  200x5
t=17s  n=  5  p50=    9ms  max=   12ms  200x5
t=18s  n=  5  p50=   11ms  max=   12ms  200x5
t=19s  n=  5  p50=   16ms  max=   28ms  200x5
t=20s  n=  5  p50=   14ms  max=   44ms  200x5
t=21s  n=  5  p50=   27ms  max=  470ms  200x5
t=22s  n=  5  p50=   17ms  max=  172ms  200x5
t=23s  n=  5  p50=   18ms  max=   20ms  200x5
t=24s  n=  5  p50=   17ms  max=   25ms  200x5
t=25s  n=  4  p50=   23ms  max=   70ms  200x4
t=26s  n=  5  p50=   52ms  max=   57ms  200x5
t=27s  n=  5  p50=   33ms  max=  175ms  200x5
t=28s  n=  5  p50=   23ms  max=   27ms  200x5
t=29s  n=  5  p50=   26ms  max=   27ms  200x5
t=30s  n=  5  p50=   15ms  max=   26ms  200x5
t=31s  n=  5  p50=   17ms  max=   22ms  200x5
t=32s  n=  5  p50=   14ms  max=   17ms  200x5
t=33s  n=  5  p50=    9ms  max=   15ms  200x5
t=34s  n=  5  p50=   11ms  max=   13ms  200x5
t=35s  n=  5  p50=   15ms  max=   25ms  200x5
TOTAL {"200":178}
[13:48:45] distinct API log messages:
    179 "msg":"request completed"
     10 "msg":"circuit breaker state change"
      3 "msg":"cache operation failed, continuing without cache"
      2 "message":"redis-cache is temporarily unavailable"
      1 "msg":"server listening"
      1 "message":"redis-cache did not answer within 150 ms"
```

```text
[13:54:15] Redis latency 2000ms is ON. creating ONE task with an assignee
HTTP 201 in 1039ms retry-after=null {"data":{"id":2685,"title":"queue lag probe","description":null,"status":"todo","priority":"medium","dueDate":null,"createdBy":1,"assigneeId":2,"assignee"
[13:54:30] notification reached the worker 13 s after the API answered
```

| Same scripts | Before | After |
|--------------|--------|-------|
| GET latency during 1.5 s Redis latency | p50 3017 ms | p50 about 15 ms; worst request of the whole run 485 ms (the breaker was learning) |
| GET latency during the black hole | up to 10 s, 4 client timeouts | p50 about 15 ms, 0 timeouts |
| POST latency with 2 s Redis latency | 12244 ms | 1039 ms |
| Notification reaches the worker | 5 s after the API answered | 13 s after (outbox relay + slow Redis): later, but the user no longer waits for it |
| Signal in the logs | none | `circuit breaker state change` and `redis-cache did not answer within 150 ms` |

Trade-off (state it): the user's request is now fast, and the notification is allowed to be slower. That is the right way round for a notification, and the wrong way round for, say, a payment authorisation.

### 3.8 Interview answer

**Interview answer:** "I assumed a slow Redis would only delay background work. Using toxiproxy I added 1.5 s of latency and then a full partition on the Redis path, and
the API itself slowed to 3 s per request, then to 10 s, with only 200 status codes and no log signal, because cache calls and the enqueue are awaited in the
request path and `enableOfflineQueue: false` only helps when the connection is closed. The fix is a hard per-call deadline (150 ms for cache, 500 ms for publish), a circuit breaker that
turns a slow dependency into a fast failure, and fallbacks: cache miss and an outbox for jobs. Latency with a black-holed Redis went from up to 10 s to about 15 ms median."

### 3.9 Follow-up questions

1. *Why 150 ms?* Healthy p99 of a Redis call is a few milliseconds; the timeout must be well above that (to avoid false positives) and far below what the user tolerates. It needs revisiting under load: in Module 7 a saturated event loop made the 150 ms timer fire without Redis being slow.
2. *Why does `enableOfflineQueue: false` not help here?* It only changes what happens while the client is disconnected. A connected but silent socket never triggers it.
3. *What is `tc netem`?* A Linux traffic-control module that adds delay, loss, duplication and reordering to a network interface; toxiproxy does the same at the TCP proxy level and is easier to script.
4. *Fail open or fail closed?* For a cache: open (miss). For an authorisation check or a rate limiter: it depends; a fail-open limiter lets abuse through during the outage, a fail-closed one turns the outage into a full outage.

**Common mistakes**

- Testing only "dependency down" and never "dependency slow".
- No timeout on commands to a dependency that is "just a cache".
- Awaiting non-essential side effects inside the request path.
- Retrying slow calls (this multiplies the damage).

**Revision notes:** slow is worse than dead; latency = sum of sequential calls; deadlines + breaker + fallback; keep side effects off the request path or bound them.

**Key concepts**

- toxiproxy, latency toxic, black hole, `enableOfflineQueue`, sequential round trips, per-call deadline, breaker, fail open vs fail closed.

**Revision questions**

1. Why did a 1.5 s delay cost 3 s per request?
2. Why did the black hole produce only 200s?
3. What would you alert on, given that error rate stays flat?
4. Why is the POST slower than the GET under the same Redis delay?

**Practical task**: add a toxic `latency=100` on Redis and find out the smallest cache timeout for which the breaker does NOT open during normal traffic.

- [ ] I injected both latency and a partition
- [ ] I know why the status codes did not change
- [ ] I can explain the fallbacks

---

## Module 4 - Failure 4: duplicate messages (and a poison message)

**Learning objectives**

- Understand at-least-once delivery by producing a real duplicate.
- Make a consumer idempotent with a dedupe table.
- Give poison messages somewhere to go (dead-letter queue) and make that visible.

### 4.1 Concept (Hinglish)

Queue "at-least-once" deta hai: message **kam se kam ek baar** pahunchega, par kabhi-kabhi do baar. Kaise? Worker ne email bhej diya,
ack karne se pehle crash ho gaya; broker ko lagta hai kaam hua hi nahi, wo dobara de deta hai. Isliye har consumer ko **idempotent** hona
chahiye: same message dobara aaye to side effect dobara na ho. Aur jo message kabhi succeed nahi ho sakta (poison), use DLQ me daalo.

### 4.2 Hypothesis

"BullMQ job ids make duplicates impossible: the same logical event can only exist once. A bad message will fail 5 times and be reported."

### 4.3 Command

```bash
VARIANT=before bash chaos/s04-duplicates.sh
```

```bash
#!/usr/bin/env bash
# Failure 4: duplicate messages (at-least-once delivery) and a poison message.
. "$(dirname "$0")/lib.sh"
up
ID=$(sql "SELECT MAX(id) FROM tasks" | tail -1)
RUN=$(date +%s) # job ids and dedupe keys must be new on every run (BullMQ ignores an id it already knows)
log "A) enqueue the SAME logical event twice with DIFFERENT job ids (what a redelivery after a worker crash looks like)"
docker exec ch-api1-1 node -e "
import('/app/src/queue/notifications.js').then(async (m) => {
  const data = { taskId: $ID, assigneeId: 2, actorId: 1, dedupeKey: 'task-assigned-$ID-2-$RUN-A' };
  await m.enqueueNotification('task-assigned', data, 'dup-demo-first-$RUN');
  await m.enqueueNotification('task-assigned', data, 'dup-demo-second-$RUN');
  await m.closeQueue(); process.exit(0);
});"
sleep 4
log "worker log lines (a duplicate-ignored line means the fix works):"; docker logs ch-worker-1 --since 20s 2>&1 | grep -E "assignment notification|duplicate" | grep -oE '"jobId":"[^"]*"|"msg":"[^"]*"' | paste - - 
log "B) same jobId twice (BullMQ job-id idempotency at enqueue time)"
docker exec ch-api1-1 node -e "
import('/app/src/queue/notifications.js').then(async (m) => {
  const data = { taskId: $ID, assigneeId: 2, actorId: 1, dedupeKey: 'task-assigned-$ID-2-$RUN-B' };
  await m.enqueueNotification('task-assigned', data, 'same-id-demo-$RUN');
  await m.enqueueNotification('task-assigned', data, 'same-id-demo-$RUN');
  await m.closeQueue(); process.exit(0);
});"
sleep 4
log "worker log lines (expect ONE send):"; docker logs ch-worker-1 --since 6s 2>&1 | grep -E "assignment notification" | grep -oE '"jobId":"[^"]*"|"msg":"[^"]*"' | paste - - 
log "C) poison message: unknown job name. Where does it end up, and who finds out?"
docker exec ch-api1-1 node -e "
import('/app/src/queue/notifications.js').then(async (m) => {
  await m.enqueueNotification('no-such-job', { x: 1 }, 'poison-demo-$RUN');
  await m.closeQueue(); process.exit(0);
});"
sleep 4
docker exec ch-redis redis-cli --scan --pattern 'bull:notifications:failed' | head
log "failed set size:       $(docker exec ch-redis redis-cli zcard bull:notifications:failed)"
log "DLQ list/zset exists?  $(docker exec ch-redis redis-cli --scan --pattern 'bull:notifications-dlq:*' | wc -l) keys"
log "worker error logs:"; docker logs ch-worker-1 --since 15s 2>&1 | grep -E 'job failed|DLQ|dead' | cut -c1-200
```

Three experiments, each with a distinct id per run (BullMQ ignores a job id it still remembers):

- **A**: the same logical event (same dedupe data) enqueued twice with DIFFERENT job ids. This is what a redelivery after a worker crash, a retried outbox row or a client retry looks like to the consumer.
- **B**: the same job id twice (the protection Part 12 relies on).
- **C**: a poison job (unknown name).

### 4.4 OBSERVED (before)

```text
[13:16:58] A) enqueue the SAME logical event twice with DIFFERENT job ids (what a redelivery after a worker crash looks like)
[13:17:03] worker log lines (a duplicate-ignored line means the fix works):
"jobId":"dup-demo-first-1792482418"	"msg":"sending assignment notification"
"jobId":"dup-demo-second-1792482418"	"msg":"sending assignment notification"
[13:17:03] B) same jobId twice (BullMQ job-id idempotency at enqueue time)
[13:17:09] worker log lines (expect ONE send):
"jobId":"same-id-demo-1792482418"	"msg":"sending assignment notification"
[13:17:09] C) poison message: unknown job name. Where does it end up, and who finds out?
bull:notifications:failed
[13:17:15] failed set size:       4
[13:17:15] DLQ list/zset exists?  0 keys
[13:17:15] worker error logs:
{"level":50,"time":1792482430372,"pid":1,"hostname":"051026d241b2","jobId":"poison-demo-1792482418","name":"no-such-job","attemptsMade":1,"err":{"type":"UnrecoverableError","message":"Unknow
```

- **A: two sends.** Both jobs produced `sending assignment notification`: the user would receive two emails. Hypothesis wrong: job-id dedupe only protects against enqueueing the same id twice (B),
  not against redelivery or against two different jobs for one event.
- **B: one send.** The job-id mechanism works for what it was designed for, but only while BullMQ still remembers the job: `removeOnComplete: { age: 3600 }` forgets finished
  jobs after an hour, so the same id can be enqueued again after that.
- **C: the poison job went to BullMQ's `failed` set and nothing else happened.** It is retained for 7 days (`removeOnFail`), with a single ERROR log line. No queue to inspect, no alert, no replay tool: the `failed` set size grows quietly (the number printed is cumulative across my runs).

Also note: the `tasks-reassigned` job has NO job id at all in Part 12's hook code, so even enqueue-time dedupe does not exist for it.

### 4.5 How monitoring would have alerted

| Failure | Alert |
|---------|-------|
| Duplicates | Hard to see from the outside: users complain. Count `duplicate delivery ignored` (after the fix) and compare with jobs completed; a sudden rise means redeliveries (worker crashes, stalled jobs). |
| Poison / failed jobs | `bullmq_failed_jobs > 0` or DLQ depth above 0 for 5 min; ERROR log `job moved to the dead-letter queue`. |
| Stalled jobs | BullMQ `stalled` events: workers dying mid-job (OOM, deploys without graceful shutdown). |

### 4.6 Fix

1. **Idempotent consumer**: every job carries a `dedupeKey` (stable identity of the logical event). Before sending, the worker runs
   `INSERT IGNORE INTO notification_log (dedupe_key, job_id)`; `affectedRows = 0` means "already handled", so the job is acknowledged without sending. If the send fails after the claim, the claim is deleted so the retry can run.
2. **Stable identity at the source**: the hook now creates the key once (`randomUUID()` for a reassignment, the task/assignee/version triple for an assignment) and uses it as BOTH the BullMQ job id and the dedupe key; the outbox row keeps it too.
3. **Dead-letter queue**: when a job fails for the last time (attempts exhausted or `UnrecoverableError`), the worker copies it to `notifications-dlq` (never auto-deleted) and logs an ERROR line to alert on.
4. **Retry policy**: 5 attempts with exponential backoff (2 s, 4 s, 8 s, 16 s) were already configured; BullMQ has no jitter option, so in a big fleet add a custom backoff strategy with `backoffDelayMs` from Module 2.

Files that change: CHANGED `src/worker.js`, `src/modules/tasks/task-hooks.js`, `src/queue/notifications.js` (`moveToDeadLetter`, Module 2); the table `notification_log` comes from migration 002 (Module 2).

```js
import { UnrecoverableError, Worker } from 'bullmq';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './db/pool.js';
import * as tasksRepo from './modules/tasks/tasks.repository.js';
import * as usersRepo from './modules/users/users.repository.js';
import {
  closeQueue,
  createWorkerConnection,
  moveToDeadLetter,
  NOTIFICATIONS_QUEUE,
  publishNotification,
} from './queue/notifications.js';
import { startOutboxRelay } from './queue/outbox.js';

if (!env.REDIS_URL) {
  logger.fatal('REDIS_URL is required to run the worker');
  process.exit(1);
}

// ---- idempotent consumer --------------------------------------------------------------------------------------
// Delivery is "at least once", so the SAME logical notification can arrive twice (redelivery after a worker crash, an
// outbox row published twice, a client retry). We claim a dedupe key in MySQL before doing the side effect.
async function claim(dedupeKey, jobId) {
  const [result] = await pool.query('INSERT IGNORE INTO notification_log (dedupe_key, job_id) VALUES (?, ?)', [
    dedupeKey,
    jobId,
  ]);
  return result.affectedRows === 1; // 0 = somebody already handled this exact event
}

async function unclaim(dedupeKey) {
  await pool.query('DELETE FROM notification_log WHERE dedupe_key = ?', [dedupeKey]);
}

async function send(job) {
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

async function handleJob(job) {
  const dedupeKey = job.data?.dedupeKey ?? job.id;
  if (job.name !== 'task-assigned' && job.name !== 'tasks-reassigned') return send(job); // poison: let it fail fast

  if (!(await claim(dedupeKey, job.id))) {
    logger.warn({ jobId: job.id, dedupeKey }, 'duplicate delivery ignored');
    return { duplicate: true };
  }
  try {
    return await send(job);
  } catch (err) {
    await unclaim(dedupeKey); // the side effect did not complete: allow the retry to run it
    throw err;
  }
}

const worker = new Worker(NOTIFICATIONS_QUEUE, handleJob, {
  connection: createWorkerConnection(),
  concurrency: 5,
});

worker.on('completed', (job) => logger.info({ jobId: job.id, name: job.name }, 'job completed'));

worker.on('failed', async (job, err) => {
  logger.error({ jobId: job?.id, name: job?.name, attemptsMade: job?.attemptsMade, err }, 'job failed');
  if (!job) return;
  const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (exhausted || err.name === 'UnrecoverableError') {
    try {
      await moveToDeadLetter(job, err); // DLQ + an ERROR log line that monitoring can alert on
    } catch (dlqError) {
      logger.error({ err: dlqError, jobId: job.id }, 'could not move job to the dead-letter queue');
    }
  }
});

worker.on('error', (err) => logger.error({ err }, 'worker error'));

// Re-publish jobs the API had to park in MySQL while Redis was unreachable.
const stopRelay = startOutboxRelay(publishNotification);

logger.info({ queue: NOTIFICATIONS_QUEUE }, 'worker started');

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'worker shutting down');

  setTimeout(() => process.exit(1), 15_000).unref(); // hard stop if a job hangs
  stopRelay();
  await worker.close(); // stops taking new jobs and waits for the active ones
  await closeQueue();
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

```js
import { randomUUID } from 'node:crypto';
import { logger } from '../../config/logger.js';
import { enqueueNotification } from '../../queue/notifications.js';
import * as taskCache from './task-cache.js';

/**
 * Called by the service AFTER a transaction committed. Never throws (see Extension A).
 *   taskIds      - tasks that changed -> cache invalidation
 *   assignments  - [{ taskId, assigneeId, actorId, version }] -> one "task-assigned" job each
 *   reassignment - { toUserId, taskIds, actorId } | null -> one "tasks-reassigned" summary job
 * Every job carries a dedupeKey: the worker records it, so a redelivered copy is recognised and skipped.
 */
export async function afterTasksChanged({ taskIds, assignments = [], reassignment = null }) {
  try {
    await taskCache.invalidate(taskIds);

    for (const assignment of assignments) {
      // Same task + same assignee + same version of the row = same logical event = same job id and dedupe key.
      const key = `task-assigned-${assignment.taskId}-${assignment.assigneeId}-${assignment.version}`;
      await enqueueNotification(
        'task-assigned',
        { taskId: assignment.taskId, assigneeId: assignment.assigneeId, actorId: assignment.actorId, dedupeKey: key },
        key,
      );
    }

    if (reassignment) {
      // Created once per request, then carried by the job, the outbox row and every retry: one event, one identity.
      const key = `tasks-reassigned-${randomUUID()}`;
      await enqueueNotification(
        'tasks-reassigned',
        {
          toUserId: reassignment.toUserId,
          taskIds: reassignment.taskIds,
          actorId: reassignment.actorId,
          dedupeKey: key,
        },
        key,
      );
    }
  } catch (err) {
    logger.error({ err, taskIds }, 'post-commit hook failed');
  }
}
```

### 4.7 OBSERVED (after)

```text
[13:49:50] A) enqueue the SAME logical event twice with DIFFERENT job ids (what a redelivery after a worker crash looks like)
[13:49:55] worker log lines (a duplicate-ignored line means the fix works):
"jobId":"dup-demo-second-1792484390"	"msg":"duplicate delivery ignored"
"jobId":"dup-demo-first-1792484390"	"msg":"sending assignment notification"
[13:49:56] B) same jobId twice (BullMQ job-id idempotency at enqueue time)
[13:50:01] worker log lines (expect ONE send):
"jobId":"same-id-demo-1792484390"	"msg":"sending assignment notification"
[13:50:01] C) poison message: unknown job name. Where does it end up, and who finds out?
bull:notifications:failed
[13:50:07] failed set size:       6
[13:50:08] DLQ list/zset exists?  7 keys
[13:50:08] worker error logs:
{"level":50,"time":1792484402829,"pid":1,"hostname":"07acdcf4c7b0","jobId":"poison-demo-1792484390","name":"no-such-job","attemptsMade":1,"err":{"type":"UnrecoverableError","message":"Unknow
{"level":50,"time":1792484402855,"pid":1,"hostname":"07acdcf4c7b0","jobId":"poison-demo-1792484390","name":"no-such-job","err":"Unknown job name: no-such-job","msg":"job moved to the dead-le
```

| Experiment | Before | After |
|------------|--------|-------|
| A: one event, two different job ids | 2 notifications sent | 1 sent, `duplicate delivery ignored` for the second |
| B: same job id twice | 1 sent | 1 sent |
| C: poison message | `failed` set only, 1 ERROR log | copied to `notifications-dlq`, ERROR log `job moved to the dead-letter queue` |

Not fixed here (say so): `POST /api/v1/tasks` has no `Idempotency-Key`, so a client that retries after a timeout creates two tasks. That is the payment-style fix (store the key + response, return the stored response for a repeat) and it is part of Part 17.

### 4.8 Interview answer

**Interview answer:** "Queues give at-least-once delivery, so I assumed BullMQ job ids would protect me from duplicates. I tested it: the same job id twice gave one send, but the same
logical event under two different job ids, which is what a redelivery after a worker crash looks like, sent two notifications. I fixed it on the consumer side: each job carries a dedupe key and the worker does
`INSERT IGNORE` into a table with that key as primary key before sending; zero affected rows means skip. If sending fails after the claim, I remove the claim so the retry can proceed. I also added a dead-letter queue because a poison message
previously just sat in BullMQ's failed set with no alert; now it is copied to a DLQ that nothing deletes, with an ERROR log."

### 4.9 Follow-up questions

1. *Can you get exactly-once?* Not end to end over a network. You get at-least-once delivery plus an idempotent consumer, which gives exactly-once EFFECT.
2. *What if the worker crashes after the claim but before sending?* With claim-then-send the notification would be skipped on redelivery (the claim row exists). If losing is worse than duplicating, record the result AFTER sending and accept a rare duplicate, or make the send itself idempotent with the provider's idempotency key (the job id).
3. *Why `INSERT IGNORE` and not SELECT-then-INSERT?* The select-then-insert has a race between two workers; the unique key makes the database decide atomically.
4. *How long do you keep dedupe keys?* As long as redelivery or a client retry can happen (days); then prune with a scheduled `DELETE ... WHERE processed_at < NOW() - INTERVAL 7 DAY`.
5. *How do you replay the DLQ?* A small script that reads `notifications-dlq`, fixes or inspects the payload, re-adds the job to the main queue with a new id, and removes the DLQ entry; do it manually at first.

**Common mistakes**

- Believing the broker prevents duplicates.
- Checking for duplicates with a read, then writing (race).
- Sending the side effect before recording that it was done, or recording before and never undoing on failure.
- A DLQ with no alert (a graveyard nobody visits).
- Idempotency keys that change on retry (random value generated in the consumer).

**Revision notes:** at-least-once; idempotent consumer; dedupe key from the source; atomic claim; DLQ + alert; exactly-once effect.

**Key concepts**

- At-least-once, idempotency key, dedupe table, poison message, DLQ, redelivery, stalled job.

**Revision questions**

1. Which of the three experiments proved the BullMQ job-id protection works, and what are its limits?
2. Why must the dedupe key be created at the source of the event?
3. What is the trade-off between claim-then-send and send-then-record?
4. What must you add to a DLQ so that it is useful?

**Practical task**: kill the worker with `docker kill ch-worker-1` while it processes a slow job (add a 5 s sleep in `send`), restart it and watch whether the job is delivered twice. Does the dedupe table stop it?

- [ ] I produced a real duplicate
- [ ] I can explain claim-then-send
- [ ] I can replay a DLQ message


## Module 5 - Failure 5: force an API timeout (slow dependency)

**Learning objectives**

- Turn MySQL into a slow dependency (alive, correct, but late) and measure what a user sees at low and at realistic load.
- Understand why the same fault is "just slow" at 5 requests/s and a full collapse at 40 requests/s.
- Choose timeouts from measurements; understand what a request deadline can and cannot do.

### 5.1 Concept (Hinglish)

"API timeout" ka kaaran aksar API khud nahi hoti, uski koi dependency hoti hai jo dheere jawab deti hai. Slow dependency ka asar
**guna** hota hai: agar ek request 3 sequential DB calls karti hai aur har call me 1.5 s extra lag raha hai, to request 4.5 s leti hai. Aur jab
tak requests slow hain, har request ek connection pakad ke rakhti hai, isliye pool bhar jata hai (Little's law).

### 5.2 Hypothesis

"With 1.5 s of added latency on every MySQL response, requests will take about 1.5 s and still succeed. No errors."

### 5.3 Commands

```bash
VARIANT=before bash chaos/s05-slow-dependency.sh            # 5 req/s: the gentle version
VARIANT=before bash chaos/s05b-slow-dependency-under-load.sh # 40 req/s: realistic traffic
```

```bash
#!/usr/bin/env bash
# Failure 5: a slow dependency. MySQL answers, but every response is delayed by 1500 ms (t=6..26).
. "$(dirname "$0")/lib.sh"
up
log "steady load: 5 req/s GET /api/v1/tasks for 40s. mysql latency toxic 1500ms on t=6..26"
start_clock
( at 6 toxi toxic add -t latency -a latency=1500 -n lat mysql >/dev/null
  at 12 ready_check
  at 26 toxi toxic delete -n lat mysql >/dev/null ) &
probe http://api1:3000 40 5 GET 12000
wait
log "distinct API log messages:"; log_summary 60s
```

```bash
#!/usr/bin/env bash
# Failure 5b: the same slow MySQL (+1500 ms per response, t=6..24), but with realistic traffic: 40 req/s.
. "$(dirname "$0")/lib.sh"
up
log "steady load: 40 req/s GET /api/v1/tasks for 36s (client gives up after 12s). mysql latency toxic 1500ms on t=6..24"
start_clock
( at 6 toxi toxic add -t latency -a latency=1500 -n lat mysql >/dev/null
  at 24 toxi toxic delete -n lat mysql >/dev/null ) &
probe http://api1:3000 36 40 GET 12000
wait
log "distinct API log messages:"; log_summary 60s
```

### 5.4 OBSERVED (before), 5 requests per second

```text
[13:17:35] steady load: 5 req/s GET /api/v1/tasks for 40s. mysql latency toxic 1500ms on t=6..26
>> t=12s: ready_check
GET /health/ready -> HTTP 200 in 2.876415s
GET /health       -> HTTP 200 in 0.006505s
t= 0s  n=  4  p50=   16ms  max=  256ms  200x4
t= 1s  n=  5  p50=   13ms  max=   18ms  200x5
t= 2s  n=  5  p50=    9ms  max=   11ms  200x5
t= 3s  n=  5  p50=    8ms  max=   16ms  200x5
t= 4s  n=  5  p50=    8ms  max=    9ms  200x5
t= 5s  n=  5  p50=   13ms  max= 1517ms  200x5
t= 6s  n=  5  p50= 4525ms  max= 4529ms  200x5
t= 7s  n=  5  p50= 4526ms  max= 4536ms  200x5
t= 8s  n=  5  p50= 3623ms  max= 3718ms  200x5
t= 9s  n=  5  p50= 3618ms  max= 3621ms  200x5
t=10s  n=  5  p50= 3318ms  max= 3521ms  200x5
t=11s  n=  5  p50= 3112ms  max= 3115ms  200x5
t=12s  n=  5  p50= 2815ms  max= 3016ms  200x5
t=13s  n=  5  p50= 2811ms  max= 2817ms  200x5
t=14s  n=  5  p50= 2421ms  max= 2616ms  200x5
t=15s  n=  5  p50= 2312ms  max= 2316ms  200x5
t=16s  n=  5  p50= 1912ms  max= 2109ms  200x5
t=17s  n=  5  p50= 1799ms  max= 1803ms  200x5
t=18s  n=  5  p50= 1516ms  max= 1601ms  200x5
t=19s  n=  5  p50= 1512ms  max= 1520ms  200x5
t=20s  n=  5  p50= 1513ms  max= 1519ms  200x5
t=21s  n=  5  p50= 1513ms  max= 1514ms  200x5
t=22s  n=  5  p50= 1513ms  max= 1516ms  200x5
t=23s  n=  5  p50= 1511ms  max= 1513ms  200x5
t=24s  n=  5  p50= 1129ms  max= 1528ms  200x5
t=25s  n=  5  p50=  134ms  max=  534ms  200x5
t=26s  n=  5  p50=   11ms  max=   14ms  200x5
t=27s  n=  5  p50=   16ms  max=   40ms  200x5
t=28s  n=  5  p50=   11ms  max=   15ms  200x5
t=29s  n=  5  p50=   13ms  max=   18ms  200x5
t=30s  n=  5  p50=   12ms  max=   23ms  200x5
t=31s  n=  5  p50=   11ms  max=   16ms  200x5
t=32s  n=  5  p50=   12ms  max=   20ms  200x5
t=33s  n=  5  p50=   10ms  max=   12ms  200x5
t=34s  n=  5  p50=   11ms  max=   13ms  200x5
t=35s  n=  5  p50=    9ms  max=    9ms  200x5
t=36s  n=  5  p50=    8ms  max=   10ms  200x5
t=37s  n=  5  p50=   14ms  max=   23ms  200x5
t=38s  n=  5  p50=    8ms  max=   13ms  200x5
t=39s  n=  5  p50=   10ms  max=   16ms  200x5
TOTAL {"200":199}
[13:18:16] distinct API log messages:
    200 "msg":"request completed"
      1 "msg":"server listening"
```

- Hypothesis wrong by a factor of three: requests took **4.5 s** (not 1.5 s) at the start of the fault, because one `GET /tasks` makes three sequential MySQL calls (user lookup in `authenticate`, `COUNT(*)`, the page query), each delayed 1.5 s.
- Every response was `200`. `grep` for errors finds nothing: the logs hold one `request completed` per request and no warning. This is the "latency spike" symptom class.
- `/health/ready` took **2.9 s** (one query, 1.5 s each way plus overhead); a probe with a 1-2 s timeout would mark the instance unhealthy and pull it out of the load balancer.
- The latency decays from 4.5 s to 1.5 s at 5 req/s: the requests queued early were slow and later ones less so, as the pool's connections warm up.

### 5.5 OBSERVED (before), 40 requests per second

```text
[13:39:15] steady load: 40 req/s GET /api/v1/tasks for 36s (client gives up after 12s). mysql latency toxic 1500ms on t=6..24
t= 0s  n= 36  p50=   36ms  max=  274ms  200x36
t= 1s  n= 40  p50=   18ms  max=   68ms  200x40
t= 2s  n= 40  p50=   21ms  max=   32ms  200x40
t= 3s  n= 40  p50=   18ms  max=   37ms  200x40
t= 4s  n= 40  p50=   22ms  max= 1527ms  200x40
t= 5s  n= 40  p50= 5421ms  max= 6743ms  200x40
t= 6s  n= 40  p50=10429ms  max=11789ms  200x40
t= 7s  n= 40  p50=12002ms  max=12007ms  500x4 CLIENT_TIMEOUTx36
t= 8s  n= 40  p50=   11ms  max=12002ms  500x36 CLIENT_TIMEOUTx4
t= 9s  n= 40  p50=   10ms  max=12002ms  500x30 CLIENT_TIMEOUTx10
t=10s  n= 40  p50=   12ms  max=12002ms  500x38 CLIENT_TIMEOUTx2
t=11s  n= 40  p50=   13ms  max=12006ms  500x32 CLIENT_TIMEOUTx8
t=12s  n= 40  p50=   16ms  max=11242ms  200x10 500x30
t=13s  n= 40  p50=    8ms  max= 9771ms  200x2 500x38
t=14s  n= 40  p50=   11ms  max= 9712ms  200x8 500x32
t=15s  n= 40  p50=   10ms  max= 8301ms  200x10 500x30
t=16s  n= 40  p50=    8ms  max= 6818ms  200x2 500x38
t=17s  n= 36  p50=   10ms  max= 6718ms  200x8 500x28
t=18s  n= 40  p50=   22ms  max= 5329ms  200x10 500x30
t=19s  n= 40  p50=   11ms  max=   37ms  500x40
t=20s  n= 40  p50=   16ms  max= 3850ms  200x10 500x30
t=21s  n= 40  p50=   13ms  max= 2372ms  200x10 500x30
t=22s  n= 40  p50=   11ms  max=   38ms  500x40
t=23s  n= 40  p50=   26ms  max=  882ms  200x22 500x18
t=24s  n= 40  p50=   15ms  max=   31ms  200x40
t=25s  n= 40  p50=   15ms  max=   23ms  200x40
t=26s  n= 40  p50=   16ms  max=   33ms  200x40
t=27s  n= 40  p50=   14ms  max=   30ms  200x40
t=28s  n= 40  p50=   19ms  max=   42ms  200x40
t=29s  n= 40  p50=   17ms  max=   34ms  200x40
t=30s  n= 40  p50=   20ms  max=   72ms  200x40
t=31s  n= 40  p50=   16ms  max=   45ms  200x40
t=32s  n= 40  p50=   17ms  max=   24ms  200x40
t=33s  n= 40  p50=   16ms  max=   33ms  200x40
t=34s  n= 40  p50=   15ms  max=   25ms  200x40
t=35s  n= 40  p50=   20ms  max=   31ms  200x40
TOTAL {"200":848,"500":524,"CLIENT_TIMEOUT":60}
[13:39:52] distinct API log messages:
    849 "msg":"request completed"
    524 "msg":"unhandled error"
    524 "msg":"request errored"
    524 "message":"failed with status code 500"
    524 "message":"Queue limit reached."
     60 "msg":"request aborted"
```

This is the real incident. With realistic traffic and the same fault:

- Latency climbed to 5 s, 10 s and 12 s within three seconds (Little's law: 40 req/s x 4.5 s = 180 requests in flight, but the pool holds 10 connections).
- 60 requests hit the probe's 12 s timeout, and **524 returned 500** (`Queue limit reached.`) the moment the pool's waiting line filled. That is 37 percent of requests failing, caused by a database that never went down.
- After the toxic was removed (t=24) the system took several more seconds to drain the queue of work it had accepted but not started. Slow dependencies leave a long tail after they recover.

### 5.6 How monitoring would have alerted

- p99 latency alert and the 5xx alert, in that order: latency fires first (within a minute), errors fire when the pool queue is full.
- The saturation signal: in-flight requests (or `nodejs_active_requests`) and pool waiters. These rise BEFORE the first error.
- A dependency latency histogram for MySQL queries (`mysql_query_duration_seconds` p99) tells you it is the database and not your code.
- Readiness probe duration: a probe that takes 2.9 s is itself an alert, if you record `probe_duration_seconds`.

### 5.7 Fix

The same guard as Module 1 (per-call deadline + breaker + 503), plus a **request deadline** as a backstop for the paths the DB guard does not cover (statements inside a transaction run on a connection that was already obtained):

- `DB_QUERY_TIMEOUT_MS=1500`: every `pool.query`/`getConnection` waits at most this long.
- `REQUEST_TIMEOUT_MS=5000`: after 5 s the client gets `503 REQUEST_TIMEOUT` with `Retry-After`, even if a handler is still running. Express cannot cancel the handler; the late result is discarded (`res.locals.timedOut`). This is covered by a unit test (`tests/unit/protection-middleware.test.js`) but was not triggered in the runs above, because the DB guard fired first.
- Healthy p99 for this endpoint is about 50 ms, so 1500 ms is 30x headroom. Choosing the number: measure p99 healthy, multiply by 5-10, keep below what the client or load balancer tolerates, and below the request deadline.

New file `src/middleware/request-timeout.js`:

```js
// Per-request deadline. Express cannot cancel a running handler, but the CLIENT must not wait forever:
// after `ms` we answer 503 ourselves. The late handler result is discarded by the error handler (res.locals.timedOut).
export function requestTimeout(ms) {
  return (req, res, next) => {
    if (req.path.startsWith('/health')) return next();
    const timer = setTimeout(() => {
      if (res.headersSent) return;
      res.locals.timedOut = true;
      res.set('Retry-After', '2');
      res.status(503).json({
        error: { code: 'REQUEST_TIMEOUT', message: `Request took longer than ${ms} ms`, requestId: req.id },
      });
    }, ms);
    res.on('close', () => clearTimeout(timer));
    next();
  };
}
```

### 5.8 OBSERVED (after)

5 requests per second:

```text
[13:50:39] steady load: 5 req/s GET /api/v1/tasks for 40s. mysql latency toxic 1500ms on t=6..26
>> t=12s: ready_check
GET /health/ready -> HTTP 503 in 0.004900s
GET /health       -> HTTP 200 in 0.004515s
t= 0s  n=  4  p50=   15ms  max=  227ms  200x4
t= 1s  n=  5  p50=   13ms  max=   19ms  200x5
t= 2s  n=  5  p50=   13ms  max=   18ms  200x5
t= 3s  n=  5  p50=   13ms  max=   16ms  200x5
t= 4s  n=  5  p50=   20ms  max=   32ms  200x5
t= 5s  n=  5  p50=   17ms  max=   23ms  200x5
t= 6s  n=  5  p50= 1510ms  max= 1517ms  503x5
t= 7s  n=  5  p50= 1508ms  max= 1513ms  503x5
t= 8s  n=  5  p50=    8ms  max= 1507ms  503x5
t= 9s  n=  5  p50=    5ms  max=    7ms  503x5
t=10s  n=  5  p50=    5ms  max=    6ms  503x5
t=11s  n=  5  p50=    6ms  max=    7ms  503x5
t=12s  n=  5  p50=    5ms  max=    9ms  503x5
t=13s  n=  5  p50=    5ms  max= 1515ms  503x5
t=14s  n=  5  p50=    7ms  max=   11ms  503x5
t=15s  n=  5  p50=    4ms  max=   13ms  503x5
t=16s  n=  5  p50=    4ms  max=    5ms  503x5
t=17s  n=  5  p50=    5ms  max=   12ms  503x5
t=18s  n=  5  p50=    7ms  max=   11ms  503x5
t=19s  n=  5  p50=    4ms  max=    6ms  503x5
t=20s  n=  5  p50=    4ms  max= 1505ms  503x5
t=21s  n=  5  p50=    4ms  max=    6ms  503x5
t=22s  n=  5  p50=    4ms  max=    5ms  503x5
t=23s  n=  5  p50=    5ms  max=    6ms  503x5
t=24s  n=  5  p50=    7ms  max=   18ms  503x5
t=25s  n=  5  p50=   10ms  max=   13ms  503x5
t=26s  n=  5  p50=    7ms  max=   12ms  200x2 503x3
t=27s  n=  5  p50=   11ms  max=   16ms  200x5
t=28s  n=  5  p50=   15ms  max=   25ms  200x5
t=29s  n=  5  p50=   12ms  max=   16ms  200x5
t=30s  n=  5  p50=    9ms  max=   22ms  200x5
t=31s  n=  5  p50=   10ms  max=   12ms  200x5
t=32s  n=  5  p50=   10ms  max=   17ms  200x5
t=33s  n=  5  p50=   11ms  max=   12ms  200x5
t=34s  n=  5  p50=   15ms  max=   21ms  200x5
t=35s  n=  5  p50=   16ms  max=   28ms  200x5
t=36s  n=  5  p50=   10ms  max=   13ms  200x5
t=37s  n=  5  p50=    9ms  max=   14ms  200x5
t=38s  n=  5  p50=   13ms  max=   40ms  200x5
t=39s  n=  5  p50=   13ms  max=   18ms  200x5
TOTAL {"200":96,"503":103}
[13:51:20] distinct API log messages:
    103 "msg":"request errored"
    103 "message":"failed with status code 503"
     97 "msg":"request completed"
      7 "msg":"circuit breaker state change"
      1 "msg":"server listening"
      1 "msg":"readiness check failed"
```

40 requests per second:

```text
[13:33:20] steady load: 40 req/s GET /api/v1/tasks for 36s (client gives up after 12s). mysql latency toxic 1500ms on t=6..24
t= 0s  n= 32  p50=   35ms  max=  426ms  200x32
t= 1s  n= 40  p50=   17ms  max=   27ms  200x40
t= 2s  n= 40  p50=   23ms  max=   44ms  200x40
t= 3s  n= 40  p50=   20ms  max=   75ms  200x40
t= 4s  n= 40  p50=   18ms  max=   25ms  200x40
t= 5s  n= 40  p50=   24ms  max=   52ms  200x40
t= 6s  n= 40  p50=  514ms  max= 1524ms  200x6 503x34
t= 7s  n= 40  p50=   13ms  max= 1925ms  503x40
t= 8s  n= 40  p50=   10ms  max=   29ms  503x40
t= 9s  n= 40  p50=    8ms  max=   16ms  503x40
t=10s  n= 40  p50=    7ms  max=   13ms  503x40
t=11s  n= 40  p50=    8ms  max=   16ms  503x40
t=12s  n= 40  p50=    9ms  max= 1512ms  503x40
t=13s  n= 40  p50=   11ms  max=   40ms  503x40
t=14s  n= 40  p50=   11ms  max=   44ms  503x40
t=15s  n= 40  p50=    9ms  max=   28ms  503x40
t=16s  n= 40  p50=    9ms  max=   46ms  503x40
t=17s  n= 40  p50=    8ms  max=   19ms  503x40
t=18s  n= 40  p50=    8ms  max=   32ms  503x40
t=19s  n= 40  p50=   11ms  max= 1505ms  503x40
t=20s  n= 40  p50=   10ms  max=   27ms  503x40
t=21s  n= 40  p50=    8ms  max=   18ms  503x40
t=22s  n= 40  p50=   11ms  max=   29ms  503x40
t=23s  n= 40  p50=    9ms  max=   26ms  503x40
t=24s  n= 36  p50=    8ms  max=   24ms  503x36
t=25s  n= 40  p50=   12ms  max=   49ms  200x5 503x35
t=26s  n= 40  p50=   25ms  max=   40ms  200x40
t=27s  n= 40  p50=   15ms  max=   44ms  200x40
t=28s  n= 40  p50=   17ms  max=   25ms  200x40
t=29s  n= 40  p50=   18ms  max=   30ms  200x40
t=30s  n= 40  p50=   22ms  max=   60ms  200x40
t=31s  n= 40  p50=   17ms  max=   27ms  200x40
t=32s  n= 40  p50=   31ms  max=   53ms  200x40
t=33s  n= 40  p50=   31ms  max=   71ms  200x40
t=34s  n= 40  p50=   20ms  max=   25ms  200x40
t=35s  n= 40  p50=   27ms  max=   50ms  200x40
TOTAL {"200":643,"503":785}
[13:33:57] distinct API log messages:
    757 "msg":"request errored"
    757 "message":"failed with status code 503"
    644 "msg":"request completed"
      7 "msg":"circuit breaker state change"
      1 "msg":"server listening"
      1 "msg":"load shedding active"
```

| | Before (5 rps) | After (5 rps) | Before (40 rps) | After (40 rps) |
|---|----------------|---------------|-----------------|----------------|
| 200 OK | 199 | 96 | 848 | 643 |
| 500 | 0 | 0 | 524 | 0 |
| 503 + Retry-After | 0 | 103 | 0 | 785 |
| Client timeouts (12 s) | 0 | 0 | 60 | 0 |
| Worst latency | 4.5 s | 1.5 s | 12 s (timeout) | 1.9 s |
| `/health/ready` | 200 in 2.9 s | 503 in 5 ms | n/a | n/a |

Read it honestly. At 5 requests per second the old system actually gave users MORE successes (199 slow answers against 96), because 4.5 s was tolerable and the pool was not full. The
new system chooses to fail fast whenever MySQL takes longer than 1.5 s. At 40 requests per second the old system collapsed (37 percent 500s, 60 hangs, 12 s latencies) and the new one stayed responsive: every
request got an answer in under 2 s, 643 of them useful, and it recovered about 3 s after the fault ended. Timeouts are a business decision: this is the same "stale vs unavailable" and "slow vs fast failure"
trade-off, and you must be able to say which side you picked and why.

### 5.9 Interview answer

**Interview answer:** "I added 1.5 s of latency to MySQL responses with toxiproxy. At low load every request still succeeded but took 4.5 s, three times the injected delay,
because the endpoint does three sequential queries. At 40 requests per second the same fault collapsed the service: latencies hit 12 s, 60 requests timed out, 37 percent returned 500 'Queue limit reached', and
the database was never down. I fixed it with per-call deadlines, a circuit breaker, 503 with Retry-After, and a 5 s request deadline as backstop. Under the same load every request now got an answer in under 2 s, none timed out and it recovered about 3 s after the fault ended. The trade-off is that at low load
the new setup fails requests that the old one would have served slowly, so the timeout must come from measured latencies and the business tolerance."

### 5.10 Follow-up questions

1. *Where do you set timeouts in Node?* HTTP client (`AbortSignal.timeout`, undici `headersTimeout`), `mysql2` (`connectTimeout`, per-query `timeout`), ioredis (`commandTimeout`, `connectTimeout`), Express (a request deadline), `server.requestTimeout`/`headersTimeout`, and the load balancer's idle and upstream timeouts. Order them: inner < outer < client.
2. *Does a timeout cancel the work?* No. A timeout in the client only stops waiting; the SQL statement keeps running on the server. Use `KILL QUERY` or `MAX_EXECUTION_TIME` (MySQL 8 optimizer hint for SELECT) when the work itself must stop.
3. *What is a deadline propagation?* Passing the remaining time budget to downstream calls (gRPC does it natively), so a request does not start work it cannot finish.
4. *Why not retry on timeout?* If the dependency is slow, retries add load. Retry only idempotent operations, once or twice, with backoff and jitter, and only if the breaker is closed.
5. *How does this relate to the pool-size formula?* Concurrency in flight = arrival rate x latency. If latency goes up 100x, the same pool serves 100x fewer requests per second.

**Common mistakes**

- Testing a slow dependency only at low load (it hides the collapse).
- One timeout for everything, or timeouts longer than the client's patience.
- Counting a timeout as "no result" without accounting for the work still running on the server.
- Health checks that call the slow dependency with a long timeout.

**Revision notes:** latency multiplies by the number of sequential calls; Little's law; pool exhaustion follows slowness; timeouts from measurements; deadline backstop; the trade-off between slow success and fast failure.

**Key concepts**

- Latency toxic, sequential calls, Little's law, per-call deadline, request deadline, `Retry-After`, tail after recovery.

**Revision questions**

1. Why did one 1.5 s delay produce 4.5 s responses?
2. Why did 40 requests per second collapse the system while 5 did not?
3. Which timeout fired first in the after-run, and why is the request deadline still useful?
4. Give two reasons not to retry a timed-out query immediately.

**Practical task**: run the 40 req/s script with `DB_QUERY_TIMEOUT_MS=4000` and `REQUEST_TIMEOUT_MS=3000` (deadline BELOW the query timeout). Which timeout wins, and what do the users see?

- [ ] I measured the multiplication of latency
- [ ] I can pick a timeout from healthy p99
- [ ] I can state the trade-off between slow success and fast failure

---


## Module 6 - Failure 6: exhaust the MySQL connection pool

**Learning objectives**

- Reproduce pool exhaustion deterministically (small pool + added latency + many clients).
- Read the symptom: `500 Queue limit reached`, readiness failing, and goodput near ZERO although MySQL is healthy.
- Fix it with a bounded in-flight limit that matches the pool, and learn why the FIRST version of the fix failed.

### 6.1 Concept (Hinglish)

Pool = fixed number of DB connections (`DB_POOL_SIZE`). Har request ko 2-3 queries chahiye (auth ka user lookup, count,
select). Jab pool chhota hai aur clients zyada, requests pool ki queue me wait karti hain; queue (`queueLimit: 100`) bhar
gayi to mysql2 "Queue limit reached." error deta hai. Ek request ko ek se zyada baar connection chahiye, isliye queue me
wait karte-karte beech me fail hone wali requests ka **kaam waste** hota hai. Yehi pool-exhaustion ka asli nuksaan hai.

### 6.2 Hypothesis

"With a pool of 3 and 100 ms of latency per query, 150 concurrent clients will not make MySQL fail, but the API will answer slowly
and then start returning errors once the waiting line (100) is full. After the burst the service recovers by itself."

### 6.3 Command

```bash
#!/usr/bin/env bash
# Failure 6: exhaust the MySQL connection pool. Pool of 3, MySQL path has 100 ms latency, 150 concurrent clients.
export DB_POOL_SIZE=3
. "$(dirname "$0")/lib.sh"
up
toxi toxic add -t latency -a latency=100 -n lat mysql >/dev/null
log "DB_POOL_SIZE=$DB_POOL_SIZE, 100 ms added latency, autocannon 150 connections for 15s on /api/v1/users (not cached, hits MySQL)"
ac http://api1:3000 150 15 "/api/v1/users?limit=5"
log "right after the burst: readiness probe"; ready_check
log "distinct API log messages:"; log_summary 30s
reset_toxics
```

```bash
VARIANT=before bash chaos/s06-pool-exhaustion.sh    # DB_POOL_SIZE=3 is set inside the script
```

### 6.4 OBSERVED (before)

```text
[13:18:38] DB_POOL_SIZE=3, 100 ms added latency, autocannon 150 connections for 15s on /api/v1/users (not cached, hits MySQL)
conns=150 dur=15s  req/s avg=212  total=3177  2xx=0  non2xx=3177  errors=103  timeouts=103
latency ms: p50=211 p90=389 p97.5=479 p99=556 max=5071
status codes: 500x3177
[13:18:55] right after the burst: readiness probe
GET /health/ready -> HTTP 503 in 0.003434s
GET /health       -> HTTP 200 in 0.004422s
[13:18:56] distinct API log messages:
   3328 "message":"Queue limit reached."
   3327 "msg":"unhandled error"
   3327 "msg":"request errored"
   3327 "message":"failed with status code 500"
    103 "msg":"request aborted"
      1 "msg":"server listening"
```

What the output says:

- **All 3177 responses were 500** (`2xx=0`). Not one request succeeded. MySQL itself was fine: the 150 clients simply
  stood in a line for 3 connections.
- Why zero successes and not "some slow successes"? Each request needs about three DB calls in a row. A request that
  got its first connection (auth lookup) went to the BACK of the queue for its second one. By the time it was served,
  the queue was full of new arrivals; the next acquire hit `Queue limit reached.` and the request died after doing
  most of its work. Under saturation, work that is started and not finished is pure waste.
- The error is a plain 500 `INTERNAL_ERROR` with the log line `unhandled error`, indistinguishable from a code bug.
- Right after the burst `/health/ready` returned **503** (still draining the queue). A load balancer would have pulled
  the instance out exactly when other instances were taking its load: a classic cascade.
- 103 clients saw timeouts (the first seconds of the burst).

### 6.5 How monitoring would have alerted

| Signal | Alert (illustrative PromQL, not run here) | Fires after |
|--------|------------------------------------------|-------------|
| 5xx ratio | `sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) > 0.02` for 2m | about 2 min |
| Pool waiters | `db_pool_waiting_requests > 0` for 1m (mysql2 exposes the queue length on `pool.pool._connectionQueue.length`) | 1 min |
| Readiness | `probe_success{job="task-api-ready"} == 0` | next probe |
| Log based | the message `Queue limit reached.` appears | immediately |

The best early signal is SATURATION (pool waiters, p99 latency), not errors: errors are the late signal.

### 6.6 Fix: bound the work you admit, tie it to the pool

Two layers (both are in `src/db/pool.js` and `src/middleware/load-shed.js`):

1. **Bulkhead in front of the pool**: as many concurrent DB operations as pool connections, a waiting room of 20, a wait of at most
   500 ms, then an immediate 503 with `Retry-After`. mysql2's own `queueLimit` stays as the last line of defence.
2. **Admission control per REQUEST**: at most `2 x DB_POOL_SIZE` requests in flight. A request is either admitted and
   gets served quickly, or rejected at the door (~microseconds, before any logging or body parsing).

**First attempt (v1) and why it did not work**

The first version had only the per-query bulkhead plus a load-shed limit of 64 requests in flight (more than the pool
could serve) and it logged every rejection. Same script, same load:

```text
[13:28:43] DB_POOL_SIZE=3, 100 ms added latency, autocannon 150 connections for 15s on /api/v1/users (not cached, hits MySQL)
conns=150 dur=15s  req/s avg=546  total=8196  2xx=4  non2xx=8192  errors=0  timeouts=0
latency ms: p50=250 p90=424 p97.5=517 p99=630 max=2571
status codes: 200x4 503x8192
[13:29:00] right after the burst: readiness probe
GET /health/ready -> HTTP 200 in 0.186135s
GET /health       -> HTTP 200 in 0.007342s
[13:29:01] distinct API log messages:
   8319 "msg":"request errored"
   8319 "message":"failed with status code 503"
    725 "msg":"dependency unavailable"
     23 "msg":"request aborted"
      5 "msg":"request completed"
      1 "msg":"server listening"
```

`2xx=4` of 8196. Rejected requests were fast, but the 64 admitted requests still fought over 3 connections; each needed three
acquires with a 300 ms wait limit, so nearly all of them were rejected on their second or third acquire, and every rejection wrote
two JSON log lines. Lesson: a limit that is higher than what the dependency can serve only moves the failure inside the request.
Version 2 sets the in-flight limit to `2 x pool size`, sheds BEFORE the logger runs, and logs one summary line per 5 s instead of one line per rejection.

### 6.7 The code that changed

The pool wrapper (`src/db/pool.js`) is shown in full in Module 1.6: `guarded()` takes one bulkhead slot per `pool.query`/`pool.execute`, and `getConnection()` keeps the slot until `connection.release()`.

The bulkhead:

```js
import { DependencyUnavailableError } from '../errors/app-error.js';

/**
 * Bulkhead = a fixed number of slots for one resource, a SMALL waiting room, and a short wait.
 * Beyond that we say "no" immediately (503) instead of letting every request queue up behind a slow dependency.
 * acquire() resolves to a release() function (safe to call twice).
 */
export function createBulkhead({ name, maxConcurrent, maxQueue, queueTimeoutMs }) {
  let active = 0;
  const waiters = [];
  const counters = { admitted: 0, rejectedFull: 0, rejectedTimeout: 0 };

  function makeRelease() {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = waiters.shift();
      if (next) {
        clearTimeout(next.timer);
        counters.admitted += 1;
        next.resolve(makeRelease()); // hand the slot straight to the next waiter (active stays the same)
      } else {
        active -= 1;
      }
    };
  }

  function acquire() {
    if (active < maxConcurrent) {
      active += 1;
      counters.admitted += 1;
      return Promise.resolve(makeRelease());
    }
    if (waiters.length >= maxQueue) {
      counters.rejectedFull += 1;
      return Promise.reject(new DependencyUnavailableError(name, 'bulkhead full', 1));
    }
    return new Promise((resolve, reject) => {
      const waiter = { resolve, timer: null };
      waiter.timer = setTimeout(() => {
        waiters.splice(waiters.indexOf(waiter), 1);
        counters.rejectedTimeout += 1;
        reject(new DependencyUnavailableError(name, `waited more than ${queueTimeoutMs} ms for a free slot`, 1));
      }, queueTimeoutMs);
      waiters.push(waiter);
    });
  }

  return { acquire, stats: () => ({ active, waiting: waiters.length, ...counters }) };
}
```

Load shedding (runs first in the middleware chain):

```js
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { logger } from '../config/logger.js';

// Load shedding: when this process is already doing as much as it can, reject the extra work in ~1 ms (503 + Retry-After)
// instead of queueing it. Two signals: concurrent requests, and event-loop lag (p99 over the last second).
export function loadShed({ maxInflight, maxLagMs = 250 }) {
  const lag = monitorEventLoopDelay({ resolution: 10 });
  lag.enable();
  let recentLagMs = 0;
  setInterval(() => {
    recentLagMs = lag.percentile(99) / 1e6; // nanoseconds -> ms
    lag.reset();
  }, 1000).unref();

  let inflight = 0;
  const counters = { shed: 0 };

  // One summary line every 5 s instead of one log line per rejected request (logging would defeat the purpose).
  let reportedShed = 0;
  setInterval(() => {
    if (counters.shed > reportedShed) {
      logger.warn({ shedLast5s: counters.shed - reportedShed, inflight, lagP99Ms: Math.round(recentLagMs) }, 'load shedding active');
      reportedShed = counters.shed;
    }
  }, 5000).unref();

  const middleware = (req, res, next) => {
    if (req.path.startsWith('/health')) return next();
    if (inflight >= maxInflight || recentLagMs > maxLagMs) {
      counters.shed += 1;
      res.set('Retry-After', '1');
      return res.status(503).json({
        error: { code: 'OVERLOADED', message: 'Server is overloaded, retry shortly' },
      });
    }
    inflight += 1;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        inflight -= 1;
      }
    };
    res.on('finish', finish);
    res.on('close', finish);
    next();
  };
  middleware.stats = () => ({ inflight, recentLagMs: Math.round(recentLagMs), ...counters });
  return middleware;
}
```

Wiring (`src/app.js`, diff against the Part 12 version):

```diff
--- before/src/app.js
+++ after/src/app.js
@@ -1,40 +1,47 @@
-import express from 'express';
-import swaggerUi from 'swagger-ui-express';
-import { env } from './config/env.js';
-import { openapiSpec } from './docs/openapi.js';
-import { errorHandler } from './middleware/error-handler.js';
-import { httpLogger } from './middleware/http-logger.js';
-import { notFound } from './middleware/not-found.js';
-import { createRateLimiter } from './middleware/rate-limit.js';
-import { securityMiddleware } from './middleware/security.js';
-import { authRouter } from './modules/auth/auth.routes.js';
-import { healthRouter } from './modules/health/health.routes.js';
-import { tasksRouter } from './modules/tasks/tasks.routes.js';
-import { usersRouter } from './modules/users/users.routes.js';
-
-export function createApp({ globalLimit = env.RATE_LIMIT_MAX, authLimit = env.AUTH_RATE_LIMIT_MAX } = {}) {
-  const app = express();
-
-  app.disable('x-powered-by');
-  app.set('trust proxy', env.TRUST_PROXY);
-
-  app.use(httpLogger);
-  app.use(securityMiddleware);
-  app.use(healthRouter);
-  app.use(createRateLimiter({ limit: globalLimit }));
-  app.use(express.json({ limit: '100kb' }));
-
-  if (env.DOCS_ENABLED) {
-    app.get('/openapi.json', (_req, res) => res.json(openapiSpec));
-    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'Task API docs' }));
-  }
-
-  app.use('/api/v1/auth', createRateLimiter({ limit: authLimit, skipSuccessfulRequests: true }), authRouter);
-  app.use('/api/v1/users', usersRouter);
-  app.use('/api/v1/tasks', tasksRouter);
-
-  app.use(notFound);
-  app.use(errorHandler);
-
-  return app;
-}
+import express from 'express';
+import swaggerUi from 'swagger-ui-express';
+import { env } from './config/env.js';
+import { openapiSpec } from './docs/openapi.js';
+import { errorHandler } from './middleware/error-handler.js';
+import { drainHeaders } from './middleware/drain.js';
+import { httpLogger } from './middleware/http-logger.js';
+import { loadShed } from './middleware/load-shed.js';
+import { notFound } from './middleware/not-found.js';
+import { requestTimeout } from './middleware/request-timeout.js';
+import { createRateLimiter } from './middleware/rate-limit.js';
+import { securityMiddleware } from './middleware/security.js';
+import { authRouter } from './modules/auth/auth.routes.js';
+import { healthRouter } from './modules/health/health.routes.js';
+import { tasksRouter } from './modules/tasks/tasks.routes.js';
+import { usersRouter } from './modules/users/users.routes.js';
+
+export function createApp({ globalLimit = env.RATE_LIMIT_MAX, authLimit = env.AUTH_RATE_LIMIT_MAX } = {}) {
+  const app = express();
+
+  app.disable('x-powered-by');
+  app.set('trust proxy', env.TRUST_PROXY);
+
+  app.use(drainHeaders); // 0. while draining, ask keep-alive clients to reconnect elsewhere
+  // 0b. shed BEFORE the logger: a rejected request must cost ~microseconds, not a JSON log line plus an id
+  app.use(loadShed({ maxInflight: env.MAX_INFLIGHT_REQUESTS || env.DB_POOL_SIZE * 2 }));
+  app.use(httpLogger);
+  app.use(securityMiddleware);
+  app.use(healthRouter);
+  app.use(requestTimeout(env.REQUEST_TIMEOUT_MS)); // 3c. no request may hold a client longer than this
+  app.use(createRateLimiter({ limit: globalLimit }));
+  app.use(express.json({ limit: '100kb' }));
+
+  if (env.DOCS_ENABLED) {
+    app.get('/openapi.json', (_req, res) => res.json(openapiSpec));
+    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'Task API docs' }));
+  }
+
+  app.use('/api/v1/auth', createRateLimiter({ limit: authLimit, skipSuccessfulRequests: true }), authRouter);
+  app.use('/api/v1/users', usersRouter);
+  app.use('/api/v1/tasks', tasksRouter);
+
+  app.use(notFound);
+  app.use(errorHandler);
+
+  return app;
+}
```

### 6.8 OBSERVED (after)

```text
[13:34:22] DB_POOL_SIZE=3, 100 ms added latency, autocannon 150 connections for 15s on /api/v1/users (not cached, hits MySQL)
conns=150 dur=15s  req/s avg=1714  total=25711  2xx=60  non2xx=25651  errors=0  timeouts=0
latency ms: p50=71 p90=136 p97.5=204 p99=328 max=2797
status codes: 200x60 503x25651
[13:34:38] right after the burst: readiness probe
GET /health/ready -> HTTP 200 in 0.105349s
GET /health       -> HTTP 200 in 0.003358s
[13:34:39] distinct API log messages:
     61 "msg":"request completed"
      6 "msg":"request aborted"
      3 "msg":"load shedding active"
      1 "msg":"server listening"
      1 "msg":"request errored"
      1 "message":"failed with status code 503"
```

| Metric (same script, same load) | Before | After |
|---------------------------------|--------|-------|
| Successful responses (2xx) in 15 s | 0 | 60 |
| Responses that were 500 | 3177 | 0 |
| Fast 503 + Retry-After | 0 | 25651 |
| p50 latency (all responses) | 211 ms | 71 ms |
| `/health/ready` right after the burst | 503 | 200 (105 ms) |
| Log lines per rejection | 2 (unhandled error + request errored) | 0 (one summary line per 5 s) |

Be honest about what this shows: goodput is still low (60 successes in 15 s). A pool of 3 with 100 ms per query can serve about
10 requests per second at best, and the load generator is closed-loop (it re-sends the moment it gets an answer, even a 503). The
improvement is that failure became cheap, explicit (503 + Retry-After, not a fake 500), and the service stayed healthy.

### 6.9 Interview answer

**Interview answer:** "I exhausted a pool of 3 connections with 150 concurrent clients and 100 ms of added DB latency. Before the fix every single
response was a 500 'Queue limit reached', zero successes, because each request needs several connections in a row and kept
losing its place in the queue. I fixed it with a bulkhead in front of the pool plus an in-flight request limit of twice the pool size. My first version failed
(4 successes out of 8000) because the limit was higher than the pool could serve, and measuring it showed that. After the fix the excess gets a
fast 503 with Retry-After, readiness stays green, and the logs have one summary line instead of thousands."

### 6.10 Follow-up questions

1. *Should I just raise the pool size?* No, not first. A bigger pool only helps if the database has spare capacity;
   usually the DB becomes the bottleneck (CPU, locks), and `instances x pool` must stay under `max_connections`. First find out why connections are held (slow queries, transactions kept open, a leak).
2. *How do you find a connection leak?* Pool in-use count that never goes down after traffic stops; a code path that calls `getConnection()` without `release()` in `finally`. The project's `withTransaction` always releases in `finally` for this reason.
3. *Why is the limit per request and not per query?* Because the unit of work the user pays for is the request. Admitting a request means promising it ALL its resources.
4. *What does `Retry-After` do?* It tells well-behaved clients when to come back, which turns a retry storm into a spread-out trickle.

**Common mistakes**

- Making the pool big "to be safe" (then MySQL melts instead of the Node app).
- No timeout on acquiring a connection (mysql2 has none; you must add it yourself).
- Mapping infrastructure errors to 500, so on-call thinks it is a code bug.
- Admission limits that are higher than what the dependency can serve.

**Revision notes:** pool exhaustion = saturation; admitted work must fit the pool; measure the fix (my v1 was wrong); 503 + Retry-After instead of 500; shed before logging.

**Key concepts**

- `connectionLimit`, `queueLimit`, bulkhead, admission control, goodput vs throughput, saturation signal.

**Revision questions**

1. Why did every response fail instead of "some slow, some failed"?
2. What is the difference between goodput and throughput? Which one did the fix improve?
3. Why shed requests BEFORE the logger middleware?
4. How would you size `MAX_INFLIGHT_REQUESTS` for an endpoint that makes 1 DB call versus 6?

**Practical task**: run `DB_POOL_SIZE=3 VARIANT=after bash chaos/s06-pool-exhaustion.sh` with `MAX_INFLIGHT_REQUESTS=64` in `compose.yml` and observe that you recreate the v1 failure.

- [ ] I reproduced `Queue limit reached.`
- [ ] I can explain why zero requests succeeded
- [ ] I can size an in-flight limit from the pool size

---

## Module 7 - Failure 7: 10x traffic with autocannon

**Learning objectives**

- Run a closed-loop load test (autocannon) and an open-loop test (fixed arrival rate) and understand why the two lie in different ways.
- Read the bottleneck from the symptoms: here, one Node process (CPU + event loop) and the DB pool.
- Show what changes with load shedding, and be honest about what does not.

### 7.1 Concept (Hinglish)

10x traffic ka matlab hamesha "10x errors" nahi hota. Pehle latency badhti hai (queue banti hai), phir kisi limit
(pool queue, timeouts, memory) par error aate hain. Little's law: `in-flight requests = arrival rate x latency`. Agar server ki capacity
fixed hai (yahan ek Node process, ek CPU core), to zyada log aane par latency hi badhti hai.

### 7.2 Hypothesis

"The single API container can serve about N requests per second. Up to 10x connections it will stay correct but slow (latency
grows linearly), because requests queue. At 30x the DB pool queue (100) fills and errors appear."

### 7.3 Commands

```bash
#!/usr/bin/env bash
# Failure 7: 10x traffic. Same endpoint, 10 connections (normal) vs 100 connections (10x), plus a 300 connection spike.
. "$(dirname "$0")/lib.sh"
up
log "NORMAL: 10 connections, 15s, GET /api/v1/tasks?limit=20"; ac http://api1:3000 10 15
log "10x:    100 connections, 15s";                           ac http://api1:3000 100 15
log "30x:    300 connections, 15s";                           ac http://api1:3000 300 15
log "readiness right after: "; ready_check
log "api container CPU/mem:"; docker stats --no-stream --format '{{.Name}} cpu={{.CPUPerc}} mem={{.MemUsage}}' ch-api1-1
```

```bash
VARIANT=before bash chaos/s07-10x-traffic.sh
```

### 7.4 OBSERVED (before, closed-loop autocannon)

```text
[13:19:17] NORMAL: 10 connections, 15s, GET /api/v1/tasks?limit=20
conns=10 dur=15s  req/s avg=200  total=3006  2xx=3006  non2xx=0  errors=0  timeouts=0
latency ms: p50=43 p90=77 p97.5=100 p99=120 max=195
status codes: 200x3006
[13:19:34] 10x:    100 connections, 15s
conns=100 dur=15s  req/s avg=285  total=4272  2xx=4272  non2xx=0  errors=0  timeouts=0
latency ms: p50=314 p90=483 p97.5=713 p99=968 max=1070
status codes: 200x4272
[13:19:50] 30x:    300 connections, 15s
conns=300 dur=15s  req/s avg=358  total=5377  2xx=295  non2xx=5082  errors=0  timeouts=0
latency ms: p50=443 p90=819 p97.5=6194 p99=6485 max=7452
status codes: 200x295 500x5082
[13:20:06] readiness right after:
GET /health/ready -> HTTP 200 in 0.006124s
GET /health       -> HTTP 200 in 0.002132s
[13:20:08] api container CPU/mem:
ch-api1-1 cpu=0.00% mem=203.3MiB / 15.56GiB
```

Reading it:

| Connections | req/s | p50 | p99 | Result |
|-------------|-------|-----|-----|--------|
| 10 (normal) | 200 | 43 ms | 120 ms | all 200 |
| 100 (10x) | 285 | 314 ms | 968 ms | all 200, but throughput only went up 1.4x while latency went up 7x |
| 300 (30x) | 358 | 443 ms | 6485 ms | 295 x 200 and **5082 x 500** (`Queue limit reached.`) |

Throughput hardly grew because the single Node process was the bottleneck (CPU-bound JSON, auth, SQL, pino logging). Extra
connections only wait in line: that is the "10x = 7x latency" you see. The 30x run crossed the DB pool queue limit (10 connections + 100 waiters)
and turned latency into 500s.

Bottleneck checklist for a load test (what I check, in order): CPU of the app process (`docker stats`: it hit its core), event-loop delay,
DB connections in use and waiting, slow queries / lock waits (`SHOW PROCESSLIST`), N+1 query patterns (queries per request in the logs), and last the database host CPU.

### 7.5 Why a closed-loop test is not enough, and the open-loop test

autocannon only sends the next request when the previous one is answered, so when the server slows down, the load slows down too. Real users do
not wait politely. The open-loop script sends a FIXED number of requests per second regardless of answers:

```bash
#!/usr/bin/env bash
# Failure 7b: 10x traffic, OPEN loop. autocannon (s07) is closed-loop: it only sends a new request when the previous one
# answered, so it slows down by itself. Real users do not. Here: a fixed 60 req/s (normal) and then 500 req/s (more than
# this single container can serve) for 20 s. The latency columns count SUCCESSFUL responses only.
export OK_LAT=1
. "$(dirname "$0")/lib.sh"
up
log "NORMAL: 60 req/s for 8s"; probe http://api1:3000 8 60 GET 10000 | tail -3
log "SPIKE: 500 req/s for 20s (client timeout 10s)"; probe http://api1:3000 20 500 GET 10000
log "readiness right after:"; ready_check
log "distinct API log messages:"; log_summary 40s
```

OBSERVED (before): normal 60 req/s, then a 500 req/s spike for 20 s (more than the container can serve):

```text
[13:40:11] NORMAL: 60 req/s for 8s
t= 6s  n=  54  ok_p50=   25ms ok_p99=   54ms  200x54
t= 7s  n=  60  ok_p50=   24ms ok_p99=   41ms  200x60
TOTAL {"200":468}
[13:40:20] SPIKE: 500 req/s for 20s (client timeout 10s)
t= 0s  n= 350  ok_p50=  569ms ok_p99= 4202ms  200x229 500x54 CLIENT_TIMEOUTx67
t= 1s  n= 500  ok_p50=  521ms ok_p99=  759ms  200x236 CLIENT_TIMEOUTx264
t= 2s  n= 500  ok_p50=  634ms ok_p99=  995ms  200x205 500x19 ECONNRESETx38 CLIENT_TIMEOUTx238
t= 3s  n= 483  ok_p50= 1632ms ok_p99= 1714ms  200x145 500x87 ECONNRESETx33 CLIENT_TIMEOUTx218
t= 4s  n= 467  ok_p50= 1626ms ok_p99= 1711ms  200x70 500x104 ECONNRESETx50 CLIENT_TIMEOUTx243
t= 5s  n= 500  ok_p50= 1990ms ok_p99= 2485ms  200x90 500x204 ECONNRESETx14 CLIENT_TIMEOUTx192
t= 6s  n= 500  ok_p50= 2516ms ok_p99= 2612ms  200x70 500x230 ECONNRESETx46 CLIENT_TIMEOUTx154
t= 7s  n= 500  ok_p50= 2553ms ok_p99= 2609ms  200x40 500x188 CLIENT_TIMEOUTx272
t= 8s  n= 500  ok_p50= 2860ms ok_p99= 2949ms  200x70 500x227 ECONNRESETx4 CLIENT_TIMEOUTx199
t= 9s  n= 500  ok_p50= 3103ms ok_p99= 3201ms  200x50 500x255 CLIENT_TIMEOUTx195
t=10s  n= 470  ok_p50= 2849ms ok_p99= 3029ms  200x40 500x193 CLIENT_TIMEOUTx237
t=11s  n= 430  ok_p50= 2937ms ok_p99= 3137ms  200x43 500x183 CLIENT_TIMEOUTx204
t=12s  n= 483  ok_p50= 2973ms ok_p99= 9844ms  200x48 500x252 CLIENT_TIMEOUTx183
t=13s  n= 467  ok_p50= 2898ms ok_p99= 9792ms  200x97 500x259 CLIENT_TIMEOUTx111
t=14s  n= 450  ok_p50= 2697ms ok_p99= 9643ms  200x68 500x162 CLIENT_TIMEOUTx220
t=15s  n= 500  ok_p50= 7129ms ok_p99= 9787ms  200x108 500x316 CLIENT_TIMEOUTx76
t=16s  n= 500  ok_p50= 8137ms ok_p99= 9911ms  200x206 500x294
t=17s  n= 500  ok_p50= 5985ms ok_p99= 9642ms  200x203 500x279 CLIENT_TIMEOUTx18
t=18s  n= 500  ok_p50= 6235ms ok_p99= 8826ms  200x229 500x249 CLIENT_TIMEOUTx22
t=19s  n= 488  ok_p50=  909ms ok_p99= 5430ms  200x116 500x372
t=20s  n=  12  ok_p50= 3109ms ok_p99= 3741ms  200x6 500x6
TOTAL {"200":2369,"500":3933,"CLIENT_TIMEOUT":3113,"ECONNRESET":185}
[13:40:49] readiness right after:
GET /health/ready -> HTTP 200 in 0.004442s
GET /health       -> HTTP 200 in 0.002893s
[13:40:50] distinct API log messages:
   3986 "msg":"unhandled error"
   3986 "msg":"request errored"
   3986 "message":"failed with status code 500"
   3986 "message":"Queue limit reached."
   2838 "msg":"request completed"
    844 "msg":"request aborted"
```

The `ok_p50 / ok_p99` columns count successful responses only. During the spike: latency of successful requests rose from 25 ms to
2-8 seconds, 3113 requests timed out at the client (10 s), 185 connections were reset, 3933 were 500s. About 75% of the traffic got NO usable answer, and the
users who did get one waited seconds.

### 7.6 How monitoring would have alerted

- **Saturation first**: event-loop delay p99 above 100 ms for 2 minutes, in-flight requests above a threshold, CPU of the container above 80 percent.
- **Latency SLO**: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5`.
- **Errors** (late): 5xx ratio. A 10x spike without autoscaling hits latency alerts minutes before it hits error alerts.
- The traffic itself: `rate(http_requests_total[1m])` compared with the same time last week; page on a sudden jump only if latency also degrades.

### 7.7 Fix: shed what you cannot serve, scale what you can

1. **Load shedding** (the same `load-shed.js` as Module 6): in-flight limit tied to the pool, plus an event-loop-lag guard, 503 + `Retry-After: 1` produced before logging or parsing.
2. **Rate limiting per client** already exists (`express-rate-limit`, set very high for this lab). In production it is the first defence against ONE noisy client.
3. **Scale out**: more instances behind the load balancer (the rolling-restart stack in Module 8 already has two). Shedding keeps one instance alive while the autoscaler adds capacity.
4. **Cache hot reads**: the Redis cache from Extension A.

### 7.8 OBSERVED (after)

Closed-loop (autocannon), the same script:

```text
[13:35:01] NORMAL: 10 connections, 15s, GET /api/v1/tasks?limit=20
conns=10 dur=15s  req/s avg=224  total=3356  2xx=3356  non2xx=0  errors=0  timeouts=0
latency ms: p50=39 p90=68 p97.5=97 p99=110 max=205
status codes: 200x3356
[13:35:17] 10x:    100 connections, 15s
conns=100 dur=15s  req/s avg=1249  total=18734  2xx=1450  non2xx=17284  errors=0  timeouts=0
latency ms: p50=60 p90=136 p97.5=262 p99=351 max=524
status codes: 200x1450 503x17284
[13:35:33] 30x:    300 connections, 15s
conns=300 dur=15s  req/s avg=1546  total=23194  2xx=265  non2xx=22929  errors=0  timeouts=0
latency ms: p50=160 p90=298 p97.5=509 p99=661 max=2060
status codes: 200x265 503x22929
[13:35:50] readiness right after:
GET /health/ready -> HTTP 200 in 0.004481s
GET /health       -> HTTP 200 in 0.002302s
[13:35:51] api container CPU/mem:
ch-api1-1 cpu=1.02% mem=169.7MiB / 15.56GiB
```

Open-loop spike:

```text
[13:38:11] NORMAL: 60 req/s for 8s
t= 6s  n=  60  ok_p50=   24ms ok_p99=   48ms  200x60
t= 7s  n=  60  ok_p50=   21ms ok_p99=   42ms  200x60
TOTAL {"200":474}
[13:38:20] SPIKE: 500 req/s for 20s (client timeout 10s)
t= 0s  n= 350  ok_p50=  637ms ok_p99=  793ms  200x40 503x310
t= 1s  n= 500  ok_p50=  247ms ok_p99= 1166ms  200x97 503x403
t= 2s  n= 450  ok_p50=  617ms ok_p99= 1547ms  200x36 503x414
t= 3s  n= 500  ok_p50=  321ms ok_p99=  452ms  200x49 503x451
t= 4s  n= 500  ok_p50=  267ms ok_p99=  413ms  200x73 503x427
t= 5s  n= 500  ok_p50=  392ms ok_p99=  692ms  200x70 503x430
t= 6s  n= 500  ok_p50=  143ms ok_p99=  315ms  200x106 503x394
t= 7s  n= 500  ok_p50=   79ms ok_p99=  223ms  200x152 503x348
t= 8s  n= 500  ok_p50=   74ms ok_p99=  195ms  200x180 503x320
t= 9s  n= 500  ok_p50=   75ms ok_p99=  155ms  200x191 503x309
t=10s  n= 500  ok_p50=  115ms ok_p99=  226ms  200x158 503x342
t=11s  n= 500  ok_p50=   81ms ok_p99=  325ms  200x159 503x341
t=12s  n= 450  ok_p50=  108ms ok_p99=  375ms  200x101 503x349
t=13s  n= 500  ok_p50=   78ms ok_p99=  129ms  200x200 503x300
t=14s  n= 500  ok_p50=   74ms ok_p99=  187ms  200x171 503x329
t=15s  n= 500  ok_p50=   77ms ok_p99=  398ms  200x160 503x340
t=16s  n= 500  ok_p50=   74ms ok_p99=  306ms  200x140 503x360
t=17s  n= 500  ok_p50=   67ms ok_p99=   95ms  200x200 503x300
t=18s  n= 500  ok_p50=   70ms ok_p99=  113ms  200x200 503x300
t=19s  n= 500  ok_p50=   67ms ok_p99=  189ms  200x180 503x320
TOTAL {"200":2663,"503":7087}
[13:38:42] readiness right after:
GET /health/ready -> HTTP 200 in 0.003854s
GET /health       -> HTTP 200 in 0.003609s
[13:38:44] distinct API log messages:
   3138 "msg":"request completed"
      4 "msg":"load shedding active"
      3 "msg":"circuit breaker state change"
      1 "msg":"server listening"
      1 "msg":"cache operation failed, continuing without cache"
      1 "message":"redis-cache did not answer within 150 ms"
```

| Open-loop spike, 500 req/s for 20 s | Before | After |
|--------------------------------------|--------|-------|
| 200 | 2369 | 2663 |
| 500 | 3933 | 0 |
| 503 with Retry-After | 0 | 7087 |
| Client timeouts / connection resets | 3113 / 185 | 0 / 0 |
| Latency of SUCCESSFUL requests, steady state | 2.5 to 8 s (p50 per second) | about 70 ms |

The honest part, which you should say in an interview:

- In the CLOSED-loop test the fix looks worse: 1450 successes at 100 connections instead of 4272, because autocannon fires 1249 requests per second at the
  server even though most are 503s, and each 503 still costs CPU on the one Node thread (my estimate is about half a millisecond, from the throughput numbers). Shedding does not create capacity.
  What it does is bound latency and make the failure explicit; the capacity itself comes from scaling out.
- A first attempt (v1) shed with a 64-request limit and per-request logging: at 100 connections it produced
  470 successes. Moving the shed point before the logger and aligning the limit with the pool gave the numbers above. See Module 6.6.
- Under heavy CPU load the 150 ms Redis timeout can fire because the EVENT LOOP is late, not because Redis is slow (the log in the run above shows
  `redis-cache did not answer within 150 ms` and a breaker opening). A timeout is a measurement of the whole process, so tune timeouts with load, not only at idle.

### 7.9 Interview answer

**Interview answer:** "I tested 10x traffic two ways. With a closed-loop tool, 10x connections gave 1.4x throughput and 7x latency, a
single Node process saturated, and 30x pushed the pool queue over its limit into 500s. With an open-loop 500 requests per second spike,
75 percent of requests got no usable answer and the successful ones took seconds. I added load shedding with an in-flight limit tied
to the pool size: the excess gets a cheap 503 with Retry-After, successful requests stayed around 70 ms, and there were no client timeouts. I would also say what it
does not do: it does not create capacity; horizontal scaling and caching do that."

### 7.10 Follow-up questions

1. *Why not just add more connections / bigger pool?* The bottleneck was the Node CPU; also see Module 6.
2. *Node is single-threaded; how do you use all cores?* Several processes (cluster module, PM2, or several containers) behind a load balancer; worker_threads for CPU-heavy work only.
3. *k6 vs autocannon vs wrk?* All three are fine. k6 has scenarios, thresholds and an arrival-rate executor (open loop); autocannon is the quickest in Node projects; wrk gives the best raw numbers for a single URL. Know which model (open or closed) your tool uses.
4. *What is coordinated omission?* Closed-loop tools stop sending while the server is stuck, so they under-report the latency that real users would have seen.

**Common mistakes**

- Load testing from the same machine without watching the load generator's own CPU.
- Reading only the average; always look at p99 and at SUCCESS-only latency.
- Testing a cached path and calling it "capacity".
- Treating a 503 flood as "the fix failed" when the goal was to protect the service.

**Revision notes:** 10x = latency before errors; closed-loop vs open-loop; shedding bounds latency, scaling adds capacity; measure success-only p99; timeouts depend on load.

**Key concepts**

- Little's law, saturation, goodput, load shedding, open-loop vs closed-loop, coordinated omission.

**Revision questions**

1. Why did 10x connections give only 1.4x throughput?
2. What does an open-loop test show that autocannon does not?
3. Why did the fix look worse in the closed-loop test, and why is that not the whole story?
4. Which resource did you identify as the bottleneck, and with what evidence?

**Practical task**: run Module 7 against your own project and write the table "connections, req/s, p50, p99, errors". Find the knee of the curve.

- [ ] I ran both a closed-loop and an open-loop test
- [ ] I can name the bottleneck and the evidence
- [ ] I can explain shedding vs scaling

---

## Module 8 - Failure 8: rolling restart (deploy) under load with SIGTERM and graceful shutdown

**Learning objectives**

- Reproduce "a deploy causes errors" with two replicas behind nginx.
- See what `SIGTERM` really does in the baseline `server.js`, and why "graceful" shutdown timed out.
- Implement the drain sequence (readiness -> delay -> close) and prove 0 errors.

### 8.1 Concept (Hinglish)

Deploy ka matlab hai purana process band karna. SIGTERM aane par load balancer ko pata nahi hota ki ye instance ab nahi
rahega; wo tab tak traffic bhejta rahega jab tak uski health check fail na ho. Isliye sahi tarika: pehle **readiness fail**
karo (LB traffic hata de), thoda ruko, phir server close karo. Aur keep-alive connections (nginx ke) idle nahi hote jab load
chal raha ho, to `server.close()` kabhi complete nahi hota jab tak hum `Connection: close` na bhejein.

### 8.2 Hypothesis

"Because Part 12's `server.js` stops listening immediately on SIGTERM and closes idle connections, a rolling restart behind nginx under load will
produce a burst of errors (connection refused / reset) for each restarted instance, even though one replica is always up."

### 8.3 Command

```bash
#!/usr/bin/env bash
# Failure 8: rolling restart (deploy) of two API replicas behind nginx, under constant load. SIGTERM -> graceful shutdown.
. "$(dirname "$0")/lib.sh"
up
dc --profile rolling up -d --force-recreate api2 lb >/dev/null 2>&1
wait_ready http://lb/health/ready 60
log "VARIANT=$VARIANT DRAIN_DELAY_MS=${DRAIN_DELAY_MS:-0}: autocannon 12 connections, 45s, through nginx. Restart api1 at t=8, api2 at t=28 (docker restart = SIGTERM, wait, start)"
start_clock
( at 8  dc --profile rolling restart api1 >/dev/null 2>&1
  at 28 dc --profile rolling restart api2 >/dev/null 2>&1 ) &
ac http://lb 12 45
wait
log "api1 shutdown log:"; docker logs ch-api1-1 --since 60s 2>&1 | grep -E 'shutting down|drain|shutdown complete|listening|timed out' | cut -c1-160
```

```bash
VARIANT=before bash chaos/s08-rolling-restart.sh
```

`docker compose restart` sends SIGTERM, waits up to `stop_grace_period` (15 s), then SIGKILL, then starts the container again. It is the closest local
equivalent of a Kubernetes pod being replaced.

### 8.4 OBSERVED (before)

```text
[13:41:25] VARIANT=before DRAIN_DELAY_MS=0: autocannon 12 connections, 45s, through nginx. Restart api1 at t=8, api2 at t=28 (docker restart = SIGTERM, wait, start)
conns=12 dur=45s  req/s avg=249  total=11210  2xx=9819  non2xx=1391  errors=0  timeouts=0
latency ms: p50=45 p90=102 p97.5=159 p99=194 max=383
status codes: 200x9819 502x1391
[13:42:11] api1 shutdown log:
{"level":30,"time":1792483894146,"pid":1,"hostname":"3baaa88278a1","reason":"SIGTERM","msg":"shutting down"}
{"level":50,"time":1792483904146,"pid":1,"hostname":"3baaa88278a1","msg":"graceful shutdown timed out, forcing exit"}
{"level":30,"time":1792483907855,"pid":1,"hostname":"3baaa88278a1","port":3000,"nodeEnv":"production","msg":"server listening"}
```

- **1391 of 11210 responses (12.4%) were 502 Bad Gateway** (nginx could not get a valid answer from the upstream). Two restarts, two error bursts. `errors=0` at the autocannon level
  because nginx always answered; the failures are HTTP 502s, which is exactly why a client-side "no network errors" check is not enough.
- The log tells the other half of the story: `shutting down` ... exactly 10 seconds later `graceful shutdown timed out, forcing exit`.
  So the shutdown was NOT graceful: with constant load, nginx's keep-alive connections are never idle, so `closeIdleConnections()` closed nothing,
  `server.close()` waited for connections that kept getting new requests, the 10 s safety timer fired and `process.exit(1)` killed in-flight requests.
- Meanwhile nginx kept the instance in its upstream list: it sent requests to a process that was no longer accepting connections.

### 8.5 How monitoring would have alerted

- 5xx ratio at the load balancer (`nginx_http_requests_total{status="502"}` or ALB `HTTPCode_ELB_5XX_Count`), visible within one scrape.
- Deploy markers on the dashboard (annotation per release) so a 5xx bump lines up with a deploy.
- `container_last_seen`/restart count, and the log line `graceful shutdown timed out` as an alert: a graceful shutdown that does not finish is a bug.
- A canary / smoke test that runs a request loop during the release (this lab IS that test).

### 8.6 Fix: drain, then close

Sequence on SIGTERM (implemented in `src/server.js`, `src/lifecycle.js`, `src/middleware/drain.js`, `health.routes.js`):

1. `startDraining()`: `/health/ready` now answers 503 `draining`, and every response gets `Connection: close`.
2. Wait `DRAIN_DELAY_MS` (5 s here: longer than nginx's detection plus in-flight work), still serving requests.
3. `server.close()` + `closeIdleConnections()`. Because step 1 closed the keep-alive connections after their next response, they are idle now and the close completes immediately.
4. Close the pool, Redis and queue connections, `process.exit(0)`. The hard timeout is `DRAIN_DELAY_MS + 10 s`, below `stop_grace_period`.
5. Also in this file: `keepAliveTimeout = 65 s` (above typical proxy idle timeouts).

```js
import { createApp } from './app.js';
import { cache } from './cache/cache.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './db/pool.js';
import { startDraining } from './lifecycle.js';
import { closeQueue } from './queue/notifications.js';

const app = createApp();

const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'failed to start server');
    process.exit(1);
  }
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'server listening');
});

// Node's default keep-alive timeout is 5 s. nginx / ALB keep upstream connections idle for longer and would
// occasionally reuse a socket Node has just closed -> random 502s. Keep Node's timeout LONGER than the proxy's.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

let shuttingDown = false;

function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;

  // 1. Fail readiness (and send "Connection: close") so the load balancer stops routing here.
  startDraining();
  logger.info({ reason, drainDelayMs: env.DRAIN_DELAY_MS }, 'shutting down: draining');

  // Safety net: drain delay + 10 s to finish in-flight requests. Keep this below the orchestrator's kill timeout
  // (docker stop_grace_period / Kubernetes terminationGracePeriodSeconds).
  setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, env.DRAIN_DELAY_MS + 10_000).unref();

  // 2. Give the load balancer time to notice (health-check interval + a margin), still serving requests normally.
  setTimeout(() => {
    logger.info('drain delay over, closing the http server');
    // 3. Stop accepting new connections; the callback runs when in-flight requests finish.
    server.close(async (closeError) => {
      if (closeError) logger.error({ err: closeError }, 'error while closing http server');
      const results = await Promise.allSettled([pool.end(), cache.close(), closeQueue()]);
      for (const result of results) {
        if (result.status === 'rejected') logger.error({ err: result.reason }, 'error while closing a resource');
      }
      logger.info('shutdown complete');
      process.exit(closeError ? 1 : 0);
    });
    server.closeIdleConnections();
  }, env.DRAIN_DELAY_MS);
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

```js
// Process-wide "are we shutting down?" flag. Readiness reads it, the shutdown code sets it.
let draining = false;
export const isDraining = () => draining;
export const startDraining = () => {
  draining = true;
};
```

```js
import { isDraining } from '../lifecycle.js';

// While draining, tell keep-alive clients (nginx, browsers) to open a NEW connection next time.
// New connections go to a healthy replica because readiness is already failing.
export function drainHeaders(_req, res, next) {
  if (isDraining()) res.set('Connection', 'close');
  next();
}
```

Readiness, diff against Part 12:

```diff
--- before/src/modules/health/health.routes.js
+++ after/src/modules/health/health.routes.js
@@ -1,21 +1,24 @@
-import { Router } from 'express';
-import { logger } from '../../config/logger.js';
-import { pool } from '../../db/pool.js';
-
-export const healthRouter = Router();
-
-// Liveness: "is the process up?" Must NOT touch the database.
-healthRouter.get('/health', (_req, res) => {
-  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
-});
-
-// Readiness: "can I serve traffic?" Checks the database. A load balancer stops routing here on 503.
-healthRouter.get('/health/ready', async (_req, res) => {
-  try {
-    await pool.query('SELECT 1');
-    res.json({ status: 'ready' });
-  } catch (err) {
-    logger.error({ err }, 'readiness check failed');
-    res.status(503).json({ status: 'unavailable' });
-  }
-});
+import { Router } from 'express';
+import { logger } from '../../config/logger.js';
+import { pool } from '../../db/pool.js';
+import { isDraining } from '../../lifecycle.js';
+
+export const healthRouter = Router();
+
+// Liveness: "is the process up?" Must NOT touch the database.
+healthRouter.get('/health', (_req, res) => {
+  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
+});
+
+// Readiness: "can I serve traffic?" Checks the database. A load balancer stops routing here on 503.
+healthRouter.get('/health/ready', async (_req, res) => {
+  // Draining = SIGTERM received. Fail readiness FIRST so the load balancer stops sending traffic, THEN close the server.
+  if (isDraining()) return res.status(503).json({ status: 'draining' });
+  try {
+    await pool.query('SELECT 1');
+    res.json({ status: 'ready' });
+  } catch (err) {
+    logger.error({ err }, 'readiness check failed');
+    res.status(503).json({ status: 'unavailable' });
+  }
+});
```

### 8.7 OBSERVED (after)

```text
[13:42:38] VARIANT=after DRAIN_DELAY_MS=5000: autocannon 12 connections, 45s, through nginx. Restart api1 at t=8, api2 at t=28 (docker restart = SIGTERM, wait, start)
conns=12 dur=45s  req/s avg=209  total=9401  2xx=9401  non2xx=0  errors=0  timeouts=0
latency ms: p50=53 p90=96 p97.5=128 p99=144 max=237
status codes: 200x9401
[13:43:25] api1 shutdown log:
{"level":30,"time":1792483946954,"pid":1,"hostname":"b31a7de077a6","port":3000,"nodeEnv":"production","msg":"server listening"}
{"level":30,"time":1792483967662,"pid":1,"hostname":"b31a7de077a6","reason":"SIGTERM","drainDelayMs":5000,"msg":"shutting down: draining"}
{"level":30,"time":1792483972671,"pid":1,"hostname":"b31a7de077a6","msg":"drain delay over, closing the http server"}
{"level":30,"time":1792483972699,"pid":1,"hostname":"b31a7de077a6","msg":"shutdown complete"}
{"level":30,"time":1792483975192,"pid":1,"hostname":"b31a7de077a6","port":3000,"nodeEnv":"production","msg":"server listening"}
```

| Rolling restart of 2 replicas under 12 connections, 45 s | Before | After |
|----------------------------------------------------------|--------|-------|
| Total requests | 11210 | 9401 |
| 502 / non-2xx | 1391 (12.4%) | 0 |
| p99 latency | 194 ms | 144 ms |
| Graceful shutdown | timed out after 10 s, forced exit | `shutdown complete` 29 ms after the drain delay |

Total request count is lower in the "after" run because both runs shared a busy laptop; compare error counts and shutdown behaviour, not request counts.

Why not also simply have nginx retry? `proxy_next_upstream error timeout http_502` retries idempotent requests (GET) on the other replica and would have hidden part of the
problem, but it cannot safely retry POST, and it hides the cause. Do the drain properly, and keep the retry as a second layer.

### 8.8 Interview answer

**Interview answer:** "I ran a rolling restart of two API replicas behind nginx under constant load. The baseline gave 12 percent 502s, and the logs showed
'graceful shutdown timed out, forcing exit' after 10 s: behind a proxy with keep-alive connections that are never idle, `server.close()`
never completes, and meanwhile the load balancer still routes to the dying instance. I changed the shutdown to a drain sequence: readiness returns 503
and responses carry `Connection: close`, wait a drain delay longer than the health check interval, then close the listener, then close the pool and the queue connections. The rerun had zero errors and the shutdown finished in about 30 ms after the delay. In Kubernetes
the same idea is a preStop sleep plus a terminationGracePeriodSeconds above drain plus shutdown time."

### 8.9 Follow-up questions

1. *Why not just `process.on('SIGTERM', () => process.exit(0))`?* In-flight requests are cut, DB transactions are rolled back mid-way, queue jobs are left in `active` until they stall.
2. *Why does `docker stop` sometimes take exactly 10 seconds?* The process ignores SIGTERM (for example `npm start` as PID 1 or a shell wrapper), so Docker waits out the grace period and sends SIGKILL.
3. *What changes in Kubernetes?* Endpoints are removed asynchronously from the Service while the pod gets SIGTERM, so a `preStop: sleep 5` or the drain delay in code is still needed; readiness probe `periodSeconds` decides how long that takes.
4. *What about the worker?* BullMQ's `worker.close()` stops taking jobs and waits for active ones; jobs longer than the grace period will stall and be retried, so handlers must be idempotent (Module 4).
5. *What about WebSockets / long requests?* They need their own drain policy (send a close frame and a reconnect hint; set a maximum request duration lower than the grace period).

**Common mistakes**

- Shutdown code that closes the DB pool before in-flight requests finish.
- `docker stop` with a grace period shorter than the app's own timeout.
- Health check only on liveness, so the load balancer never learns the instance is draining.
- Running the app through `npm start` or a shell script as PID 1 (signal never reaches Node).
- Only measuring client-side network errors; 502/503 from the proxy are HTTP responses.

**Revision notes:** SIGTERM -> readiness 503 + Connection: close -> drain delay -> server.close -> close pool/redis/queue -> exit; hard timeout below the orchestrator's; keepAliveTimeout above the proxy's.

**Key concepts**

- SIGTERM vs SIGKILL, PID 1, readiness vs liveness, keep-alive, drain delay, `stop_grace_period`, `preStop`.

**Revision questions**

1. Why did `closeIdleConnections()` not help in the baseline?
2. Why is a drain delay needed even when readiness already fails?
3. What are the three timeouts that must be ordered correctly during a deploy?
4. Why does nginx report 502 and not a connection error to the client?

**Practical task**: set `DRAIN_DELAY_MS=0` in the `after` image and rerun; then set it to 1000 and 5000. Which value is the smallest with zero errors on your machine, and why?

- [ ] I reproduced the 502 burst
- [ ] I can draw the drain sequence
- [ ] I know the three ordered timeouts


## Module 9 - Incident review: one complete example and a blank template

**Learning objectives**

- Write a blameless incident review with timeline, impact, root cause, fix and follow-ups.
- Practise on a failure you caused yourself, with real numbers.
- Keep a reusable template for every future incident (and for your portfolio).

The example below is the Redis outage from Module 2, written as if it had happened in production. The numbers are the ones measured in the lab (before-fix run). A "game day" is a legitimate source for a review: reviewers value that you found the problem before customers did.

### 9.1 Example: INC-2026-001 - Task assignment notifications silently dropped during a Redis outage

| Field | Value |
|-------|-------|
| Status | Resolved (fix verified), follow-ups open |
| Severity | SEV-2 (data loss, no user-visible error) |
| Duration | Redis unavailable for 14 s in the experiment; the loss window is the whole outage (any outage length loses every notification created in it) |
| Detected by | Manual count at the end of the experiment. NO alert fired. |
| Services | `task-api` (API), `task-api-worker`, Redis 7 (cache + BullMQ), MySQL 8 |
| Author / date | Template: your name, date of the review |

**Summary**

During a 14 second Redis outage, the Task API kept answering every request with `201 Created`, but 80 of the 248 task assignments created during the 50 second test never produced a
notification. The system hid the failure from every HTTP dashboard. The cause was a design choice: the post-commit hook enqueued the notification in Redis and, on failure, only logged and returned.
We fixed it by parking failed enqueues in a MySQL outbox table and having the worker republish them with exponential backoff and jitter.

**Impact**

- Users: 80 of 248 assigned users (32 percent of assignments in the window) did not receive the "task assigned" notification. They could still find the task in the app, but would not know to look.
- Data: no task data was lost; MySQL was consistent (248 tasks). Only the derived side effect (notification) was lost, and it was not recoverable after the fact (the job was never stored anywhere).
- Latency/availability: none measurable. 247 of 247 probe requests succeeded; p50 stayed about 30-45 ms.
- Operational: 80 ERROR log lines `failed to enqueue notification` and 168 WARN lines about the cache, which nobody was alerted on.

**Timeline** (T = seconds since the load started; real log timestamps are in `chaos/out/s02-kill-redis-before.log`)

| T | Event |
|---|-------|
| T+0 | Load starts: 5 `POST /api/v1/tasks` per second, each with an assignee. All 201. |
| T+8 | `docker kill ch-redis`. Redis is gone (SIGKILL). |
| T+8..T+9 | First `Stream isn't writeable and enableOfflineQueue options is false` errors. Cache calls fall back to MySQL (WARN `cache operation failed, continuing without cache`). Enqueues fail (ERROR `failed to enqueue notification`). Requests still return 201. |
| T+12 | A manual `POST` returns `201` in 182 ms. This is the moment a human checking "is it up?" would have concluded that everything is fine. |
| T+22 | `docker start ch-redis`. Reconnection; enqueues work again for new requests. Jobs that failed during the outage are NOT retried: they were never stored. |
| T+50 | Load ends. 247 probe tasks + 1 manual task created. |
| T+58 | Detection: comparing created tasks (248) with notifications logged by the worker (168) shows 80 missing. No alert had fired. |
| Fix | Outbox table + relay + queue breaker implemented (Module 2). |
| Verify | Same script on the fixed build: 249 created, 249 delivered, `rows in outbox` back to 0, relay logs `relayed 50`, `relayed 50`, `relayed 3` (103 parked jobs) after the Redis restart. |

**Root cause**

Five whys:

1. Why were notifications missing? The jobs were never added to the queue while Redis was down.
2. Why was a failed enqueue not retried? The hook catches the error, logs it, and returns; the request has already been committed and answered.
3. Why is that acceptable code? The comment said "a cache/queue hiccup must not turn a successful write into an error response". That reasoning is right for the RESPONSE, but nothing replaced the lost work.
4. Why did we not notice? The only signals were log lines. RED metrics (rate, errors, duration) stayed green, and there was no metric that compares "assignments made" to "notifications delivered".
5. Why was there no durable copy? The design treated Redis as the only place where a notification job lives. The system had a dual-write (MySQL, then Redis) with no mechanism to reconcile the two.

**Contributing factors**

- "Redis is just a cache" was true for reads and false for the queue; one Redis serves both roles.
- Requirement 4 of Extension A and the producer note in Extension B claimed the API "keeps working", which is true for HTTP and was read as "nothing is lost" (see Module 10, bugs 1-3).
- No game-day or chaos test existed for the async path.

**Resolution (what we changed)**

1. `src/queue/notifications.js`: publish has a 500 ms deadline and its own circuit breaker; on failure `saveToOutbox` writes the job into `outbox` (MySQL); if MySQL fails too, ERROR `NOTIFICATION LOST` with the payload.
2. `src/worker.js` + `src/queue/outbox.js`: a relay republishes parked rows (delete after successful publish) with exponential backoff and full jitter between rounds.
3. `src/modules/tasks/task-hooks.js`: every job has a stable identity (`dedupeKey`), and the worker deduplicates (`notification_log`), because the outbox makes delivery at-least-once.
4. Migration `002_outbox_and_dedupe.sql`.

Verification: the same script on the fixed image: 249 created, 249 delivered, outbox empty, 0 lost.

**What went well**

- The cache path degraded exactly as designed (WARN, served from MySQL).
- MySQL stayed consistent; the transaction boundary was right (hook after commit).
- Because the failure was reproduced with a script, the fix could be verified with the same script.

**What went badly**

- Detection was accidental. There was no metric for the business invariant.
- A failed enqueue was only a log line; there was no retry path and no durable record.
- The hang that appeared once in a first run (Module 2) shows the producer connection is not fully understood; it is an open question, not a closed one.

**Follow-up actions**

| # | Action | Owner | Priority | Due | Status |
|---|--------|-------|----------|-----|--------|
| 1 | Alert: `notifications_enqueue_failed_total` increase > 0 for 5 min, and the log string `NOTIFICATION LOST` | on-call lead | P1 | +1 week | open |
| 2 | Business-invariant alert: assignments created vs notifications delivered (ratio below 0.99 for 10 min) | backend team | P1 | +2 weeks | open |
| 3 | Move the outbox insert INSIDE the business transaction (close the commit-to-insert crash window) | backend team | P2 | +1 month | open |
| 4 | Dashboard panel: outbox row count and oldest row age; page when oldest row is above 5 minutes | SRE | P2 | +2 weeks | open |
| 5 | Prune `notification_log` and old DLQ entries with a documented runbook | backend team | P3 | +1 month | open |
| 6 | Run the Redis kill + partition chaos scripts in staging before each release train | QA / SRE | P2 | +1 month | open |
| 7 | Investigate the one-off hang after the Redis restart (add `commandTimeout` to the producer connection) | backend team | P2 | +2 weeks | open |

**Lessons**

- "The API returns 201" is not the same as "the work happened". Alert on the invariant, not only on the status code.
- Every asynchronous side effect needs a durable record BEFORE you can call it reliable.
- Chaos scripts are cheap and found a bug that unit tests and code review had not.

### 9.2 Blank template (copy this for every incident)

```text
INCIDENT REVIEW: <ID> - <one-line title>

Status:        [Draft | In review | Resolved | Follow-ups open]
Severity:      [SEV-1 | SEV-2 | SEV-3]   (define them: SEV-1 = customers cannot use the core feature, SEV-2 = degraded or data at risk, SEV-3 = minor)
Duration:      <start> to <end> (<N> minutes)   | Time to detect: <N> | Time to mitigate: <N> | Time to resolve: <N>
Detected by:   [alert <name> | customer report | engineer noticed | chaos test]
Services:      <list>
Author/date:   <name>, <date>      Reviewers: <names>

SUMMARY
  <3-5 sentences: what happened, what the user felt, what fixed it.>

IMPACT
  Users affected:     <number or percent, which segment>
  Requests / data:    <failed requests, lost or corrupted records, money, SLO burn>
  Duration of impact: <minutes>
  Not affected:       <what stayed healthy>

TIMELINE (UTC; one line per event; include detection, escalation, mitigation, resolution)
  <hh:mm>  <event>   (source: <log / graph / chat link>)

ROOT CAUSE
  Direct cause:        <the technical trigger>
  Five whys:           1. ...  2. ...  3. ...  4. ...  5. ...  (stop at a process or design cause, not a person)
  Contributing factors:<missing alert, missing timeout, unclear ownership, risky deploy, etc.>
  Why was it not caught earlier? <tests, review, monitoring, game days>

RESOLUTION
  Mitigation (stop the bleeding):  <what and when>
  Permanent fix:                    <code/config/process change, files, PR link>
  Verification:                     <how you proved it, same experiment before/after, numbers>

DETECTION AND RESPONSE
  What worked:       <...>
  What did not:      <...>
  Where we got lucky:<...>

FOLLOW-UP ACTIONS (each needs an owner and a date)
  | # | Action | Owner | Priority | Due | Status |

LESSONS LEARNED
  <3 bullets that a new engineer should remember>

APPENDIX
  Graphs, log excerpts, commands used, related incidents, links.
```

Blameless rules to paste at the top of your review: describe what the SYSTEM allowed; use roles instead of names; assume everyone acted reasonably with the information they had; every "human error" must be followed by "why was that easy to do?".

**Key concepts**

- Timeline, impact, root cause (five whys), contributing factors, mitigation vs fix, follow-ups with owners, blameless culture, time to detect / mitigate / resolve.

**Revision questions**

1. What is the difference between mitigation and a permanent fix? Give one example from the lab.
2. Why do reviews contain "where we got lucky"?
3. Why is "engineer forgot X" never an acceptable root cause?
4. Which follow-up from the example would you do first, and why?

**Practical task**: write an incident review for Failure 8 (rolling restart) using the template and the numbers in Module 8.

- [ ] My review has a timeline with real timestamps
- [ ] Every follow-up has an owner and a due date
- [ ] I wrote a root cause that is a system property, not a person

---


## Module 10 - Bugs and wrong claims found in `12_Project_Task_API.md` (with exact corrected text)

**Learning objectives**

- Learn to treat documentation claims as hypotheses and test them.
- Know the exact text to change in Part 12 (this part does not edit Part 12; apply the corrections yourself).

What I checked: I rebuilt the project by extracting every code block of Part 12 (Stages 1-7 plus Extensions A and B), applied its edit instructions and ran it in Docker with MySQL 8.4 and Redis 7 (Node 22 image). **The code runs as written**: build, migrations, seed, login, task CRUD and list, cache, worker, notifications all worked, and the Stage 6 test files were not part of this check (they need a test database). The problems below are not syntax errors; they are claims and defaults that were false when the system was stressed. Each one was OBSERVED in this lab. Section numbers refer to the headings of Part 12.

### Bug 1 - Extension A, Requirements item 4: "slow" Redis does NOT keep the API working

Observed: with 1.5 s of latency on the Redis path every `GET /tasks` took 3 s (two sequential cache calls); during a partition requests waited up to 10 s (Module 3).

Original text (Extension A, Requirements, item 4):

```text
4. If Redis is down, slow or not configured, the API keeps working (cache is an optimisation, not a dependency).
```

Corrected text:

```text
4. If Redis is down or not configured, the API keeps working. If Redis is SLOW or unreachable without closing the connection (partition, overload), every cache
   call must be bounded by a short deadline (150 ms) and a circuit breaker, otherwise each request waits for Redis: measured 3 s per request with 1.5 s of
   Redis latency and up to 10 s during a partition. Cache failures become cache misses.
```

### Bug 2 - Extension A, Implementation approach: what `enableOfflineQueue: false` protects against

Original text (last bullet of Implementation approach):

```text
- Redis client options: `enableOfflineQueue: false` and `maxRetriesPerRequest: 1`, so a dead Redis makes commands fail
  immediately (and we fall back to the DB) instead of queueing requests and slowing the API.
```

Corrected text:

```text
- Redis client options: `enableOfflineQueue: false` and `maxRetriesPerRequest: 1`, so a Redis whose connection is CLOSED makes commands fail
  immediately (and we fall back to the DB) instead of queueing them. They do nothing for a Redis that is connected but slow or silent:
  wrap every cache call in a deadline and a circuit breaker (see Part 16, Module 3, and `src/cache/cache.js` there).
```

Also in `src/cache/cache.js` of Extension A, the `safely` helper should call the operation through a breaker (see the Part 16 version), and the warning should be throttled (one warning per 10 s). The Part 12 version logs one WARN per failed call: 160 warnings in a 14 s outage.

### Bug 3 - Extension B, Implementation approach: "fails fast ... (we catch and log)" loses notifications and still hangs when Redis is slow

Observed: 80 of 248 notifications silently lost during a 14 s Redis outage (Module 2); one `POST /tasks` took 12.2 s with 2 s of Redis latency (Module 3).

Original text (Implementation approach, producer bullet):

```text
- Producer connection: `enableOfflineQueue: false`, so `queue.add` fails fast when Redis is down instead of hanging the request (we catch and log). Worker connection: `maxRetriesPerRequest: null`, which BullMQ requires for workers.
```

Corrected text:

```text
- Producer connection: `enableOfflineQueue: false`, so `queue.add` fails fast when the Redis connection is CLOSED. It still waits when Redis is slow or silent
  (measured: one POST took 12 s with 2 s of Redis latency), so bound the call (500 ms) with a deadline and a breaker. "Catch and log" LOSES the notification
  (measured: 80 of 248 lost in a 14 s outage): park failed jobs in a durable outbox table in MySQL and republish them from the worker (Part 16, Module 2).
  Worker connection: `maxRetriesPerRequest: null`, which BullMQ requires for workers.
```

### Bug 4 - Extension B, Requirements item 3: the "stable job id" claim is too strong

Observed: two different job ids for one logical event gave two sends; `tasks-reassigned` has no job id at all in the Part 12 hook code (Module 4).

Original text (Requirements, item 3):

```text
3. Jobs survive restarts (stored in Redis), retry with exponential backoff (5 attempts) and a duplicate enqueue of the same logical event does not create a second job (stable job id).
```

Corrected text:

```text
3. Jobs survive restarts (stored in Redis) and retry with exponential backoff (5 attempts). `task-assigned` jobs have a stable job id
   (`task-assigned-<taskId>-<assigneeId>-<version>`), so enqueueing the same event twice creates one job, but ONLY while BullMQ still remembers the job
   (`removeOnComplete.age` is 3600 s) and it does NOT stop redelivery of an already processed job (for example a worker crash after sending and before the ack).
   Handlers therefore must be idempotent: every job carries a `dedupeKey` and the worker claims it with `INSERT IGNORE` before sending. Every job type needs a stable key,
   including `tasks-reassigned`.
```

Also change the code of Part 12's `task-hooks.js` for `tasks-reassigned` (the Part 16 version, shown in Module 4, creates `tasks-reassigned-<uuid>` once per request and passes it as the third argument).

### Bug 5 - Stage 3, `src/db/pool.js`: 10 s connect timeout, and the full queue becomes an anonymous 500

Observed: with MySQL unreachable, connection attempts hung for the 10 s `connectTimeout`; the waiting line filled; 256 of 259 errors were `Queue limit reached.`, answered as `500 INTERNAL_ERROR` (Module 1), and the readiness probe hung (no answer in 5 s).

Original text (two lines of the `createPool` options):

```js
  queueLimit: 100, // bounded queue = backpressure; the 101st waiter gets an error instead of memory growing forever
  connectTimeout: 10_000,
```

Corrected text:

```js
  queueLimit: 100, // last line of defence: the 101st waiter gets "Queue limit reached." (mysql2 has NO acquire timeout, so waiting can be long)
  connectTimeout: 3_000, // a dead host must not hold a request for 10 s
```

And the Stage 3 `error-handler.js`: before the `MYSQL_ERRORS` lookup in `toHttpError`, add the mapping, otherwise infrastructure failures are anonymous 500s:

```js
  // MySQL/Redis unreachable, timed out or pool full: a 503 the client may retry, NOT a bug-style 500
  if (isInfrastructureError(err)) {
    return { status: 503, code: 'DEPENDENCY_UNAVAILABLE', message: 'A required service is temporarily unavailable' };
  }
```

(`isInfrastructureError` is in `src/resilience/errors.js`, Module 1.) Also Stage 3 "Internal working" (Hinglish paragraph) ends with "bhar jaaye to error (`queueLimit`)": add "aur mysql2 me acquire timeout nahi hota, isliye khud ek timeout/bulkhead lagao".

### Bug 6 - Stage 1 shutdown (and the Q&A about it): "graceful" shutdown timed out and cut requests behind a proxy

Observed: a rolling restart of two replicas behind nginx under constant load: 12.4 percent 502s, and the log line `graceful shutdown timed out, forcing exit` exactly 10 s after `shutting down` (Module 8). The cause: busy keep-alive connections are never idle, so `closeIdleConnections()` closes nothing and `server.close()` never completes; the load balancer is still routing to the instance.

Original text (Stage 1, "Interview concepts" follow-up 3, around line 650):

```text
3. *What does `server.close()` actually do?* Stops accepting new connections and calls back when all existing
   connections end. Idle keep-alive connections must be closed with `closeIdleConnections()` (Node 18.2+).
```

Corrected text:

```text
3. *What does `server.close()` actually do?* Stops accepting new connections and calls back when all existing
   connections end. Idle keep-alive connections must be closed with `closeIdleConnections()` (Node 18.2+). Behind a proxy under constant load,
   connections are never idle, so a correct shutdown first drains: fail readiness (503) and send `Connection: close` on every response, WAIT a drain delay
   longer than the load balancer's health-check interval, and only then call `server.close()`. Measured: without the drain the safety timer fired after 10 s and
   12 percent of requests got 502 during a rolling restart; with it, 0 errors.
```

Original text (Q19 interview answer, around line 7446):

```text
**Interview answer:** "On SIGTERM the server stops accepting new connections and closes idle keep-alive sockets, in-flight requests finish, then the database pool (and Redis and queue connections) are closed, and the process exits with code 0. A timer forces exit after 10 seconds so a stuck request cannot block a deployment. The worker does the same: it stops taking jobs, lets active ones finish, then closes."
```

Corrected text:

```text
**Interview answer:** "On SIGTERM the server first fails its readiness probe and adds Connection: close to responses so the load balancer stops sending traffic, waits a drain delay longer than the health-check interval, then stops accepting connections and closes idle keep-alive sockets. In-flight requests finish, then the database pool (and Redis and queue connections) are closed and the process exits with code 0. A timer (drain delay plus 10 seconds, below the orchestrator's kill timeout) forces exit so a stuck request cannot block a deployment. The worker does the same: it stops taking jobs, lets active ones finish, then closes."
```

Replace the Stage 1 and Stage 3 `server.js` shutdown functions with the Part 16 version (Module 8), and in Extension C change the sentence "`stop_grace_period` is longer than our internal 10 s / 15 s hard timeouts" to "`stop_grace_period` is longer than `DRAIN_DELAY_MS` plus our internal 10 s / 15 s hard timeouts".

### Gap 7 - Missing hardening, NOT reproduced here

- `server.keepAliveTimeout`: Node's default is 5 s, shorter than nginx/ALB upstream idle timeouts, which can cause occasional 502s from reused connections. Part 12 never sets it (grep finds no `keepAliveTimeout`). I did not reproduce the 502 (it needs idle gaps), but the fix is two lines and is in the Part 16 `server.js`. Add to Extension D, section "nginx reverse proxy": `server.keepAliveTimeout = 65_000; server.headersTimeout = 66_000;` with the comment "must be longer than the proxy's keep-alive timeout".
- Stale cache after a Redis outage: invalidations that fail while Redis is down leave old values until the TTL (60 s / 30 s). Add one sentence to Extension A, "Common mistakes": "A failed invalidation during an outage leaves stale entries until the TTL; keep TTLs short for data where staleness matters."

**Key concepts**

- Documentation claims are hypotheses; "keeps working" must say for which failure mode; defaults (timeouts, queues) are decisions.

**Revision questions**

1. Which of the six bugs were about a wrong CLAIM and which about a wrong DEFAULT?
2. Why can a stable BullMQ job id not guarantee single delivery?
3. What would you add to a code review checklist after reading this module?

**Practical task**: apply the corrected texts to your own copy of Part 12 and then re-read Extension A and B end to end for any sentence that still promises more than the code does.

- [ ] I can state each corrected claim
- [ ] I know which code files each bug maps to
- [ ] I checked my own project for the same defaults

---


## Module 11 - Interview questions and answers (chaos, resilience, incidents)

**Learning objectives**

- Answer resilience and incident questions with a concrete story from this lab instead of definitions only.
- Use the vocabulary precisely: timeout, retry, backoff, jitter, idempotency, circuit breaker, bulkhead, load shedding,
  backpressure, DLQ, outbox, graceful shutdown, readiness vs liveness.

Format: question, tier, then **Interview answer** in professional English. Each answer is 4-8 sentences: say what
it is, why it matters, and tie it to something you actually broke and fixed.

**Q1. What is chaos engineering, and how is it different from load testing? [ESSENTIAL, Basic]**

**Interview answer:** "Chaos engineering is running controlled experiments that inject failure (a dead database, a slow
network, a duplicate message) to check that the system's real behaviour matches what we believe about it. A load test asks
'how much traffic can it take?'. A chaos test asks 'what happens when a dependency misbehaves?'. You start with a
steady-state measurement, write a hypothesis, inject one fault, observe, and then fix and re-run. In my project I used
toxiproxy between the API and MySQL/Redis so I could create failures like 'alive but slow', which `docker stop` cannot
produce. Most of my surprises came from slow dependencies, not dead ones."

**Q2. Why is a slow dependency usually worse than a dead one? [ESSENTIAL, Intermediate]**

**Interview answer:** "A dead dependency fails fast: the connection is refused, the caller gets an error in milliseconds, and
the caller can fall back. A slow dependency holds resources: every request waits, so sockets, event-loop callbacks and database
pool slots stay occupied, the pool queue fills, and healthy endpoints that need the same pool start failing too. In my
lab, adding 1.5 s of latency to MySQL made requests hang for many seconds, which then exhausted the pool, and
`/health/ready` itself hung. The fix is a deadline on every call plus a circuit breaker, so slow becomes 'fail fast'."

**Q3. What timeouts should a Node.js API have? [ESSENTIAL, Intermediate]**

**Interview answer:** "Every outgoing call needs its own timeout (connect timeout, query/command timeout), and the incoming
request needs an overall deadline. The rule is that the inner timeouts must be shorter than the outer one, which must be shorter
than what the client or load balancer waits. In the lab: MySQL connect 3 s, query 1.5 s, Redis 150 ms, queue publish
500 ms, request deadline 5 s, and the load balancer's own timeout above that. Without them the default is effectively
'wait forever', and one slow dependency stalls the whole service."

**Q4. When is retrying a good idea, and when does it make an outage worse? [ESSENTIAL, Intermediate]**

**Interview answer:** "Retry transient failures (connection reset, deadlock, 503 with Retry-After) of operations that are safe to repeat,
meaning idempotent ones or ones protected by an idempotency key. Never retry validation errors or non-idempotent writes
blindly. Retries need exponential backoff with jitter and a retry budget, otherwise thousands of clients retry in
lockstep and hit the recovering dependency at the same instant (a retry storm). Retries multiply load: three retries across
three layers is 27x traffic. That is why the circuit breaker sits next to the retry: when the dependency is clearly down, stop
retrying and fail fast."

**Q5. Explain exponential backoff with jitter. Where is it in your project? [ESSENTIAL, Intermediate]**

**Interview answer:** "Backoff means the wait grows after each failure (for example 25 ms, 50 ms, 100 ms), so a struggling
dependency gets breathing room. Jitter adds randomness so that many clients do not all retry at the same moment.
`withTransaction` retries deadlocks with `25 * 2^attempt + random(0..25)` ms. BullMQ's `backoff: { type: 'exponential', delay: 2000 }`
gives 2, 4, 8, 16 seconds between attempts; BullMQ has no built-in jitter, so for a big fleet I would add it with a
custom backoff strategy. The 'full jitter' variant, a random wait between 0 and the exponential cap, is the safest default."

**Q6. Explain the circuit breaker pattern and its states. [ESSENTIAL, Intermediate]**

**Interview answer:** "A circuit breaker wraps calls to a dependency and counts failures. Closed: calls pass through. After N
consecutive failures it opens: calls are rejected immediately without touching the dependency, which protects both sides.
After a reset timeout it goes half-open and lets exactly one trial call through; success closes it, failure re-opens it. In
my API I wrote a small breaker (about 80 lines) with a per-call timeout and an `isFailure` predicate so that a duplicate-key
error does not count as an outage. Observed effect: with MySQL black-holed, requests changed from waiting for the timeout to
an immediate 503 with Retry-After."

**Q7. What is a bulkhead, and how is it different from a circuit breaker? [ESSENTIAL, Intermediate]**

**Interview answer:** "A bulkhead isolates capacity: a fixed number of slots for one resource, a small waiting room and a short
wait, then immediate rejection. The name comes from ship compartments: one leak must not sink the whole ship. A circuit breaker
reacts to failures over time; a bulkhead limits concurrency right now, even when everything still works. In my API the MySQL
bulkhead allows as many concurrent DB operations as the pool has connections, queues up to 20 for at most 300 ms, and
answers 503 beyond that. That turned 'everything queues for 20 seconds then 500s' into 'excess load gets a fast, honest 503'."

**Q8. Graceful degradation vs fallback: what do you do when Redis dies? [ESSENTIAL, Basic]**

**Interview answer:** "The cache is an optimisation, so Redis failing must become a cache miss, not an error. That is
cache-aside with every cache call wrapped to return 'miss' on failure. Two details matter: an error is not enough (a black-holed
Redis never errors, it just never answers), so each call needs a short deadline plus a breaker; and invalidations that
fail during the outage leave stale entries behind, which is acceptable only because every key has a TTL. For data
that must not be lost (a notification), the fallback is to park it durably, for example in an outbox table."

**Q9. What is the transactional outbox pattern, and what did your version cover? [ADVANCED, Advanced]**

**Interview answer:** "The outbox solves the dual-write problem: you cannot atomically commit to MySQL and publish to a broker.
You write the event to an outbox table in the SAME transaction as the business change, and a relay process publishes
rows and deletes them afterwards. Delivery becomes at-least-once, so consumers must be idempotent. In the lab I built the
cheaper variant: publish after commit, and if Redis is unreachable park the job in an outbox table; a relay in the worker
re-publishes. The remaining gap is a process crash between commit and the outbox insert; the full version closes it by writing
the outbox row inside the original transaction."

**Q10. How do you make a message consumer idempotent? [ESSENTIAL, Intermediate]**

**Interview answer:** "Give each logical event a stable identity (a dedupe key), and record it atomically with, or just before, the
side effect. I use `INSERT IGNORE` into a table with the key as primary key: `affectedRows = 0` means someone already handled it, so
skip. If the side effect fails afterwards, delete the claim so the retry can run. Brokers are at-least-once in practice (a worker
crash after the effect but before the ack causes redelivery), so exactly-once is built from at-least-once delivery plus
idempotent processing. Enqueue-time dedupe with BullMQ job ids helps, but does not cover redelivery."

**Q11. What is a dead-letter queue and what makes a good one? [ESSENTIAL, Intermediate]**

**Interview answer:** "A DLQ holds messages that will never succeed (poison messages, or ones that exhausted their retries) so
they do not block the queue or retry forever, and so a human can inspect and replay them. A good DLQ has three properties:
nothing in it is auto-deleted, every arrival writes an ERROR log or increments a metric that alerts, and there is a
documented replay procedure. In the lab, before the fix, a poison job ended up in BullMQ's `failed` set where nobody was told;
after the fix it lands in `notifications-dlq` with the original payload and error message, and the worker logs 'job moved to the dead-letter queue'."

**Q12. What is the difference between liveness and readiness, and why does it matter for deploys? [ESSENTIAL, Basic]**

**Interview answer:** "Liveness answers 'is the process alive?': if it fails, restart it. Readiness answers 'can it serve traffic right
now?': if it fails, stop routing to it but do not kill it. Liveness must not depend on the database, otherwise a DB outage makes the
orchestrator restart every healthy API pod in a loop. Readiness checks dependencies and also reports 'draining' during shutdown. In my
rolling restart test, flipping readiness to 503 before closing the server is what let the load balancer move traffic away
without errors."

**Q13. Walk me through a correct graceful shutdown. [ESSENTIAL, Intermediate]**

**Interview answer:** "On SIGTERM: one, fail readiness so the load balancer stops sending new requests, and add `Connection: close` on
responses. Two, wait a drain delay (longer than the health-check interval) while still serving. Three, stop accepting connections with
`server.close()` and close idle keep-alive sockets. Four, wait for in-flight requests, then close the pool, Redis and queue
connections. Five, exit 0, with a hard timeout that is shorter than the orchestrator's kill timeout. The mistake I found in the
project was closing the listener immediately: the load balancer still had the instance in rotation and kept sending requests
to a closed port."

**Q14. Why can Node return random 502s behind nginx or an AWS ALB, even without a deploy? [ADVANCED, Advanced]**

**Interview answer:** "Node's default `keepAliveTimeout` is 5 seconds. nginx and ALB (60 s idle) keep upstream connections open longer.
When nginx reuses a connection at the same instant Node closes it, the request fails with a reset and nginx returns 502. The fix is to set
`server.keepAliveTimeout` higher than the proxy's idle timeout (for example 65 s) and `headersTimeout` slightly above that. It is a classic
production-only bug because it needs idle gaps and real proxies; I put it in the fixed `server.js` for that reason."

**Q15. How do you size a MySQL connection pool, and what happens when it is exhausted? [ESSENTIAL, Intermediate]**

**Interview answer:** "Pool size is a throughput limit, not a 'more is better' knob: a database does not get faster with 500 connections.
Start small (about cores times 2 plus disks, or 10-20 per app instance), and remember `instances x pool size` must stay below `max_connections`.
When the pool is exhausted, requests wait in the driver's queue; mysql2's `queueLimit` bounds it but has no acquire timeout,
so waiting can be long and the 101st waiter gets 'Queue limit reached', which is a 500 by default. I put a bulkhead in front of the pool
with a short queue and wait, and mapped the rejection to 503 with Retry-After. Always check for connection leaks (a connection
not released on an error path) before raising the pool size."

**Q16. Your service gets 10x traffic. What do you do, in order? [ESSENTIAL, Intermediate]**

**Interview answer:** "First, protect it: rate limit per client, shed load when concurrency or event-loop lag is above a
threshold (fast 503 with Retry-After), and keep timeouts short so overload does not turn into a pile of waiting requests. Second, find the
bottleneck with data: CPU of the Node process (it is single-threaded), DB connections, lock contention, or N+1 queries. Third, scale the cheap
part: caching hot reads, a second instance behind the load balancer, then database work (indexes, read replicas). In the lab, the single
API container at 10x connections did not error, it just got about ten times slower, because requests queued. Load shedding made the
latency bounded and the overload visible."

**Q17. What is backpressure, and where does it appear in this system? [ESSENTIAL, Intermediate]**

**Interview answer:** "Backpressure is a downstream component telling the upstream 'slow down' instead of letting work pile up in memory. In this
system: the bounded pool queue and bulkhead (refuse instead of queue forever), the 503 with Retry-After (tell the client), the worker's
`concurrency: 5` (limit parallel jobs), and BullMQ itself (the queue absorbs bursts so the API is not blocked). The opposite of
backpressure is an unbounded queue: memory grows, latency grows, and the process eventually dies."

**Q18. How would monitoring have alerted you to these failures? [ESSENTIAL, Intermediate]**

**Interview answer:** "I alert on symptoms users feel, from the RED method: error rate (5xx ratio above 1-2 percent for 5 minutes),
latency (p99 above the SLO), and request rate drop. Cause-based alerts support them: readiness probe failing, pool waiters above zero for
a minute, circuit breaker open, queue depth or oldest-job age rising, DLQ non-empty, and consumer lag. Two silent cases need explicit
signals: silent data loss (a log line like 'NOTIFICATION LOST' or an outbox row older than N minutes) and a hang (no completions:
alert on 'requests started minus finished' or on a rate drop, because a hung service produces no errors at all)."

**Q19. What goes into an incident review (post-mortem)? What makes it blameless? [ESSENTIAL, Basic]**

**Interview answer:** "A timeline with timestamps (detection, mitigation, resolution), the impact (who, how many requests, how long, any data loss),
the root cause and contributing factors (the five whys, until you reach a process or design cause, not 'engineer X did Y'), what
went well and badly in detection and response, and follow-up actions with owners and dates. Blameless means we ask 'how did the system allow this?'
instead of 'who did it?', because people only report honestly when they are not punished for it. Good reviews produce
tickets that actually get done, such as a missing alert, a missing timeout or a missing runbook."

**Q20. What is the difference between at-most-once, at-least-once and exactly-once delivery? [ESSENTIAL, Intermediate]**

**Interview answer:** "At-most-once: send and do not retry, so messages can be lost. At-least-once: retry until acknowledged, so messages can be
duplicated; this is what BullMQ, SQS, RabbitMQ with acks and Kafka consumers by default give you. Exactly-once is not something a network
can give you end to end; it is achieved as at-least-once delivery plus an idempotent consumer, or a transactional system like Kafka transactions inside
the Kafka ecosystem. In my worker a crash after sending the notification but before acknowledging the job causes a second send, which the dedupe key now prevents."

**Q21. How do you test a failure fix? [ESSENTIAL, Basic]**

**Interview answer:** "Re-run the same experiment: same fault, same load, same measurement, and compare. For a breaker I also write unit tests (opens after N failures,
half-open allows one trial, application errors do not count, timeouts count). Tests prove the logic; the chaos run proves the behaviour in
the real topology. I keep the experiment as a script in the repository so it can run in CI against a staging stack or before big releases."

**Q22. What is a retry storm, and what prevents it? [ADVANCED, Advanced]**

**Interview answer:** "A retry storm happens when a dependency slows down, clients time out and retry, and the retries add load, which slows the
dependency more. Prevention: exponential backoff with jitter, a retry budget (retry at most 10 percent of requests), circuit breakers, server-side
load shedding, and returning `Retry-After` so well-behaved clients wait. Retry at one layer only: if the browser, the API gateway and the service
all retry three times, one user click becomes 27 requests."

**Q23. What is load shedding, and how is it different from rate limiting? [ESSENTIAL, Intermediate]**

**Interview answer:** "Rate limiting is per client and protects fairness and abuse: 'you may send 300 requests per 15 minutes'. Load shedding is global
and protects the server: 'I am saturated, so I reject some requests, from anyone, to keep the rest fast'. Signals for shedding are concurrent
in-flight requests, event-loop delay, queue depth or CPU. The shed response is a cheap 503 with `Retry-After`, produced before parsing bodies or touching the database. Shedding sacrifices
some requests deliberately so the admitted ones still meet their latency target."

**Q24. A deploy caused errors for 20 seconds even though you have two replicas. Why, and how do you fix it? [ESSENTIAL, Advanced]**

**Interview answer:** "A rolling restart only works if the instance leaving stops receiving traffic before it stops listening. With the default
shutdown the port closes immediately, but the load balancer still has the instance in its pool until its health check fails, so new requests hit a closed port, and
keep-alive connections get reset. The fix is the drain sequence: fail readiness, wait a drain delay longer than the health-check interval, `Connection: close` on responses, then close the
server and the pool. In Kubernetes the same thing is a `preStop` sleep plus `terminationGracePeriodSeconds` above the drain and shutdown time, and in nginx you can also enable
`proxy_next_upstream` so idempotent requests retry on the other replica."

**Q25. If you had one day to harden a new service, what would you do first? [ESSENTIAL, Intermediate]**

**Interview answer:** "In order: timeouts on every network call; a request deadline; bounded pools and queues (with 503, not 500, when full); graceful shutdown with
readiness draining; liveness vs readiness done right; structured logs with request ids; RED metrics and four alerts (error rate, p99 latency, readiness, saturation);
idempotency keys on payment-like endpoints; then a circuit breaker for any dependency that can go slow, and a DLQ and an outbox for the async paths. Then I would run
a chaos script for the top three dependencies, because it finds the gaps that code review does not."

**Key concepts**

- Dead is easy, slow is hard. Every call needs a deadline.
- 5xx vs hang vs latency spike vs silent loss: four different symptoms need four different alerts.
- Timeout, retry with jitter, breaker, bulkhead, shed, fallback, DLQ, outbox: each answers one question.
- Readiness drains before shutdown; liveness never touches dependencies.

**Revision questions**

1. Pick two failures from this part and explain, in 60 seconds each, symptom, root cause, fix, proof.
2. Why is a retry without a circuit breaker dangerous?
3. Which of your fixes can still lose data, and in which exact window?
4. What would you alert on for a hang that produces no errors?

**Practical task**: record yourself answering Q2, Q6, Q13 and Q24 in two minutes each, using real numbers from your own lab run.

- [ ] I can explain every pattern with an example from my own lab
- [ ] I can state at least one limitation of each fix
- [ ] I know which alerts would have caught each failure


## Summary: results at a glance and the fix map

All numbers are from the same laptop and the same scripts (`chaos/out/*.log`); BEFORE = Part 12 as built, AFTER = with this part's fixes.

| # | Failure | Symptom class | Before | After | Main fix |
|---|---------|---------------|--------|-------|----------|
| 1 | Kill MySQL | hang + 5xx | 40 x 200, 259 x 500, 143 hung (8 s) | 249 x 200, 199 x 503, 0 hung; readiness 503 in 6 ms | connect/query timeout, circuit breaker, 503 mapping |
| 2 | Kill Redis | silent data loss | 80 of 248 notifications lost (168 sent), all HTTP green | 0 lost (249 of 249) | outbox + relay with backoff and jitter |
| 3 | Slow / partitioned Redis | latency spike, hang | GET 3 s; up to 10 s in a partition; POST 12.2 s | GET about 15 ms; POST 1.0 s | 150 ms / 500 ms deadlines, breaker, fallbacks |
| 4 | Duplicates, poison message | duplicate effect | 2 sends for 1 event; poison job only in `failed` | 1 send; poison job in the DLQ with an ERROR log | idempotent consumer, DLQ |
| 5 | Slow MySQL / API timeout | latency spike, collapse | 5 rps: 4.5 s each; 40 rps: 524 x 500, 60 timeouts, 12 s | 40 rps: 785 fast 503, 0 timeouts, max 1.9 s | per-call deadline, breaker, request deadline |
| 6 | Pool exhaustion | 5xx, zero goodput | 3177 x 500, 0 x 2xx | 60 x 2xx, 25651 fast 503, readiness stays 200 | bulkhead + in-flight limit tied to pool |
| 7 | 10x traffic | latency, then errors | 10x: 7x latency; 30x: 5082 x 500; open-loop: 75% unusable | open-loop: 0 timeouts, ok p50 about 70 ms, excess = 503 | load shedding (+ scale out) |
| 8 | Rolling restart | 502 burst | 12.4% 502, shutdown timed out | 0 errors, shutdown 29 ms after drain | readiness drain, `Connection: close`, drain delay |

Which project files change (everything is relative to `task-api/`; the baseline is the project exactly as Part 12 builds it):

| File | New / changed | Failures |
|------|---------------|----------|
| `src/resilience/timeout.js`, `circuit-breaker.js`, `bulkhead.js`, `errors.js`, `backoff.js` | NEW | 1,2,3,5,6 |
| `src/db/pool.js` | CHANGED (guarded pool, 3 s connect timeout) | 1,5,6 |
| `src/errors/app-error.js` | CHANGED (`DependencyUnavailableError`) | 1,5,6 |
| `src/middleware/error-handler.js` | CHANGED (503 mapping, `Retry-After`, deadline discard) | 1,5,6 |
| `src/config/env.js` | CHANGED (new settings) | 1,5,6,8 |
| `src/cache/cache.js` | CHANGED (deadline, breaker, throttled warnings) | 3 |
| `src/queue/notifications.js` | CHANGED (breaker, outbox fallback, DLQ helper) | 2,3,4 |
| `src/queue/outbox.js`, `db/migrations/002_outbox_and_dedupe.sql` | NEW | 2,4 |
| `src/modules/tasks/task-hooks.js` | CHANGED (dedupe keys) | 4 |
| `src/worker.js` | CHANGED (idempotent consumer, DLQ, outbox relay) | 2,4 |
| `src/middleware/load-shed.js`, `request-timeout.js`, `drain.js`, `src/lifecycle.js` | NEW | 5,6,7,8 |
| `src/app.js` | CHANGED (middleware order) | 5,6,7,8 |
| `src/modules/health/health.routes.js` | CHANGED (draining) | 8 |
| `src/server.js` | CHANGED (drain sequence, keep-alive timeouts) | 8 |
| `tests/unit/resilience.test.js`, `protection-middleware.test.js` | NEW | all |
| `.dockerignore` | CHANGED (`chaos`) | build |
| `chaos/*` | NEW (the lab) | all |

The patterns you can now name, with the exact file that implements each:

| Pattern | Where |
|---------|-------|
| Timeout | `resilience/timeout.js`, pool, cache, queue publish, `middleware/request-timeout.js` |
| Retry with exponential backoff + full jitter | `resilience/backoff.js` used by the outbox relay; `db/transaction.js` (deadlocks, from Part 12); BullMQ `attempts` + `backoff` |
| Circuit breaker | `resilience/circuit-breaker.js` (hand-rolled; `opossum` is the production-grade alternative) |
| Bulkhead | `resilience/bulkhead.js` in front of the MySQL pool |
| Bounded pool / queue | `connectionLimit`, `queueLimit`, bulkhead waiting room, in-flight limit |
| Load shedding | `middleware/load-shed.js` |
| Fallback | cache miss; outbox for jobs |
| DLQ | `notifications-dlq` via `moveToDeadLetter` |
| Idempotent consumer | `notification_log` + `INSERT IGNORE` in `worker.js` |
| Graceful shutdown / drain | `server.js`, `lifecycle.js`, `drain.js`, readiness |

## Verification record: what was actually executed

- Docker Desktop on Windows 11; Git Bash; Node 20.20.1 on the host (only used for editing); everything else inside containers: `node:22-alpine`, `mysql:8.4`, `redis:7-alpine`, `ghcr.io/shopify/toxiproxy:2.9.0`, `nginx:1.27-alpine`.
- Part 12 was rebuilt by extracting its code blocks and applying its edit instructions; it built, migrated, seeded and served traffic unchanged.
- Each of the scenarios `s01` to `s08` (plus `s03b`, `s05b`, `s07b`) was run on the BEFORE image and on the AFTER image; logs are in `chaos/out/`. Some scenarios were run more than once because I changed the probe or the fix; the numbers quoted are from the run whose log file is included.
- Unit tests (Vitest 3 in `node:22-alpine`), 14 tests, all passing:

```text

 RUN  v3.2.7 /app

 [OK] tests/unit/resilience.test.js > withTimeout > rejects when the promise is too slow and hands the late value to onLate 110ms
 [OK] tests/unit/resilience.test.js > circuit breaker > opens after N consecutive failures, then rejects immediately without calling the dependency 12ms
 [OK] tests/unit/resilience.test.js > circuit breaker > half-open: one trial call; success closes the circuit 45ms
 [OK] tests/unit/resilience.test.js > circuit breaker > half-open: a failed trial re-opens the circuit 41ms
 [OK] tests/unit/resilience.test.js > circuit breaker > does not count errors that isFailure rejects (caller mistakes are not outages) 3ms
 [OK] tests/unit/resilience.test.js > circuit breaker > counts a timeout as a failure 22ms
 [OK] tests/unit/resilience.test.js > bulkhead > runs at most maxConcurrent at once, queues a few, rejects the rest immediately 3ms
 [OK] tests/unit/resilience.test.js > bulkhead > gives up waiting after queueTimeoutMs 31ms
 [OK] tests/unit/resilience.test.js > bulkhead > release() is idempotent 1ms
 [OK] tests/unit/resilience.test.js > backoffDelayMs (full jitter) > grows exponentially up to the cap and is always between 0 and the ceiling 1ms
 [OK] tests/unit/resilience.test.js > backoffDelayMs (full jitter) > spreads clients out: 1000 callers do not all pick the same delay 1ms
 [OK] tests/unit/protection-middleware.test.js > requestTimeout > answers 503 REQUEST_TIMEOUT with Retry-After when the handler is too slow, and survives the late result 352ms
 [OK] tests/unit/protection-middleware.test.js > requestTimeout > does not touch fast requests or health probes 113ms
 [OK] tests/unit/protection-middleware.test.js > loadShed > rejects requests above maxInflight with 503 + Retry-After and lets /health through 316ms
 [OK] tests/unit/protection-middleware.test.js > error handler mapping > maps infrastructure errors to 503 and DependencyUnavailableError keeps its Retry-After 23ms
 [OK] tests/unit/protection-middleware.test.js > drain headers > adds Connection: close only once draining has started, and always calls next() 1ms

 Test Files  2 passed (2)
      Tests  16 passed (16)
   Start at  08:32:00
   Duration  3.26s (transform 276ms, setup 0ms, collect 1.12s, tests 1.08s, environment 2ms, prepare 876ms)
```

- Resource cleanup at the end: `docker compose -p ch --profile rolling down -v` (containers `ch-*`, network `ch_default`, volumes `ch_ch-db-data`), plus the images `task-api:before`, `task-api:after`, `ch-tools:local`.

## Assessment (mixed difficulty) and answers

**Basic**

1. What is the difference between liveness and readiness?
2. Name the four symptom classes of a failure.
3. What does HTTP 503 with `Retry-After` tell a client?
4. What does `docker kill` do differently from `docker stop`?

**Intermediate**

5. A request makes 3 sequential database calls and the database becomes 1.5 s slower. How long does the request take and why?
6. Explain the circuit breaker states and what the trial call is for.
7. Why does at-least-once delivery force idempotent consumers? Give one way to implement it in MySQL.
8. Why did the closed-loop test (autocannon) make the load-shedding fix look worse, and what test shows its benefit?

**Advanced**

9. Design the drain sequence for a Node API behind an ALB and Kubernetes. Which timeouts must be ordered, and how?
10. The outbox in this lab can still lose an event. When exactly, and how does the full pattern fix it?
11. A timeout in the client does not cancel the SQL statement. What problems does this create and what can you do?
12. You are told "add retries to fix the flaky dependency". What questions do you ask before you do?

**Answers**

1. Liveness: is the process alive (restart if not); must not check dependencies. Readiness: can it serve traffic now (route traffic only if yes); checks the database and reports `draining` during shutdown.
2. 5xx errors, hangs (no answer), latency spikes (200 but slow), silent data loss (200 but the side effect never happened).
3. "The service is temporarily unable; the request was not processed (or can safely be retried); try again after N seconds." It lets clients back off without guessing, and it is a cheap alternative to 500, which means "bug".
4. `docker kill` sends SIGKILL immediately (default): the process cannot clean up, and the container's network namespace disappears without TCP resets, so peers hang until their own timeouts. `docker stop` sends SIGTERM, waits (grace period), then SIGKILL.
5. About 3 x 1.5 s = 4.5 s of added latency (measured 4.5 s), because the calls are sequential and each pays the delay. Parallelising independent queries or caching reduces the number of round trips.
6. Closed: calls flow, consecutive failures counted. Open: calls rejected immediately for the reset timeout. Half-open: one trial call is allowed; success closes the circuit, failure re-opens it. The trial prevents a recovering dependency from receiving full traffic at once and avoids permanent opening.
7. Because the broker may redeliver (worker crash after the effect, before the ack; relay republish). Implement: a table with the event's dedupe key as primary key; `INSERT IGNORE` before the side effect; `affectedRows = 0` -> skip; delete the claim if the side effect fails so a retry can run.
8. Closed-loop clients re-send immediately after any answer, including fast 503s, so the server spends CPU on rejections and goodput drops; shedding cannot create capacity. The open-loop test (fixed arrival rate) shows what shedding actually buys: successful requests stay near 70 ms and nobody times out, instead of 2-8 s latencies and 75 percent unusable answers.
9. On SIGTERM: readiness -> 503 and `Connection: close`; wait a drain delay longer than the target group's health-check interval times unhealthy threshold (or a Kubernetes `preStop` sleep); `server.close()`; close pools; exit. Order: client timeout > load balancer idle/deregistration delay and `terminationGracePeriodSeconds` > drain delay + shutdown timeout > longest request/job. Node `keepAliveTimeout` > the load balancer's idle timeout.
10. If the process crashes after the transaction committed but before the outbox insert (or before the publish succeeds and the insert happens), the event exists nowhere. The full pattern inserts the outbox row in the same transaction as the business change, so commit makes both durable atomically; a relay publishes later.
11. The statement keeps running on the server holding locks and a connection, and the retry may run it twice. Mitigate: `MAX_EXECUTION_TIME` for SELECTs, `KILL QUERY` on timeout, idempotent writes, transaction-level timeouts (`innodb_lock_wait_timeout`), and avoiding retries unless the operation is idempotent.
12. Is the operation idempotent? Which errors are transient? What is the dependency's capacity (will retries amplify load)? Is there a retry budget, backoff with jitter, a circuit breaker, a deadline for the whole operation? Are other layers also retrying (multiplication)? And what is the root cause of the flakiness?

**Weak-area guidance**: if you missed 5, 6 or 8, redo Modules 5 and 7 and draw the arithmetic (Little's law). If you missed 7 or 10, redo Modules 2 and 4. If you missed 9, repeat Module 8 with `DRAIN_DELAY_MS` of 0, 1000 and 5000.

## Hours estimate

| Module | Hours |
|--------|-------|
| 0 Lab setup and method | 1.5 |
| 1 Kill MySQL | 2 |
| 2 Kill Redis (silent data loss, outbox) | 2.5 |
| 3 Slow / partitioned queue and cache | 2 |
| 4 Duplicates and poison messages | 2 |
| 5 Slow dependency / API timeout | 2 |
| 6 Pool exhaustion | 2 |
| 7 10x traffic | 2.5 |
| 8 Rolling restart and graceful shutdown | 2.5 |
| 9 Incident review (write one yourself) | 1.5 |
| 10 Bugs in Part 12 (apply the corrections) | 1 |
| 11 Interview questions (practise aloud) | 2 |
| **Total** | **about 23.5** |

Fit with the roadmap: Days 78-84 give about 7 days; use two days for modules 0-3, two for modules 4-6, two for modules 7-8, and one for modules 9-11.

## Not verified (what I could NOT run or confirm)

- **Prometheus, Grafana, Alertmanager and OpenTelemetry were not part of this lab.** All "how monitoring would have alerted" tables are the alerts I would write; the metric names are illustrative (Part 15 has a real metric set). What I observed and used as the basis: status codes, latency columns, probe results, health endpoints and log lines.
- **`tc netem`**: not run (Docker Desktop on Windows has no suitable kernel module in my setup); toxiproxy was used instead. The command shown in Module 3 is untested.
- **Kubernetes**: all statements about `preStop`, `terminationGracePeriodSeconds` and readiness probes are from documentation knowledge, not from a cluster. The nginx + two containers setup is the stand-in.
- **A hang after Redis restart** appeared in one early Module 2 run (requests timing out for over 15 s after Redis was started again) and could not be reproduced in later runs. I did not find the cause; treat it as an open question.
- **`server.keepAliveTimeout` 502s** (Gap 7): not reproduced.
- **The request-deadline middleware** (`REQUEST_TIMEOUT_MS`) is covered by a unit test but was not triggered in any chaos run (the DB guard fired first).
- **The Part 12 test suite (Stage 6)** was not run against the changed code; only the new unit tests were run. The changes touch the pool, error handler, `app.js`, `server.js` and the hooks, so run `npm test` against a test database before adopting these changes in a real project.
- **Absolute performance numbers** come from a busy laptop with other containers; only before/after comparisons are meaningful. The probe's `t=` column is about 2 s behind the script's markers (`docker exec` start-up).
- **opossum** was not used or benchmarked; the breaker here is hand-rolled (about 90 lines, unit tested).
- **Idempotency-Key for `POST /tasks`** and `MAX_EXECUTION_TIME`/`KILL QUERY` handling were described but not implemented.

End of Part 16.
