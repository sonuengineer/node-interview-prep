# 15 - Observability, Cloud and CI/CD

> Production engineering ka woh hissa jo "code chal raha hai" ko "code production mein survive kar raha hai, aur mujhe pata hai kyun" mein badalta hai. Metrics, tracing, alerting, CI/CD, aur cloud (AWS) basics -- har module ke saath runnable lab.

## Where this fits

| Item | Detail |
|------|--------|
| Roadmap | `90-day-backend-engineer-roadmap.md` -> "Days 71-77 Learn production engineering" and its "ADDED -- Name the actual tools" list (Metrics, Tracing, Alerting, Deploys, Cloud) |
| Already covered elsewhere (NOT repeated here) | Structured logging with pino, request/correlation IDs: Week 6 / Day 2 notes. Liveness vs readiness, graceful shutdown: Week 6 / Day 5 notes and Week 7 / Day 5 notes (section 5.2). Docker image basics and Dockerfile: Week 7 / Day 6 notes and Project Task API Extension C. Basic RED/USE definitions, a first prom-client example, and a first alert-rule sample: Week 7 / Day 5 notes (section 5.2) |
| What THIS file adds | A running multi-service lab (metrics + Grafana dashboard + Jaeger traces across HTTP and a BullMQ hop), SLO/burn-rate math with unit-tested alert rules, a validated GitHub Actions pipeline, and AWS fundamentals |
| Phase | Phase "Cloud + DevOps + Observability" (Days 71-77), and it feeds the Chaos Lab (file 16) where you ask "would my alerts have caught this?" |
| Tags | `[ESSENTIAL]` = asked in most backend interviews, `[ADVANCED]` = supplementary |

Honesty note: 8 weeks of notes do not make you an SRE. Is file ka goal hai ki tum interview mein ek real production setup ko confidently explain kar sako aur ek chhota stack khud chala chuke ho.

## How to use this file

Har module ek sitting (1-2 hours) ka unit hai. Lab files ek hi folder mein hain (`obs-lab/`). Module 1 mein poora lab banta hai; Module 2 usi lab par tracing add karta hai (files pehle se saath mein hain, bas dekhna aur chalana hai). Module 3 alert rules aur unit tests; Module 4 CI/CD (alag workflow file); Module 5 AWS.

### Lab environment (what I actually ran)

| Thing | Version used |
|-------|--------------|
| Host | Windows 11, Node v20.20.1 (project target is Node 22 LTS; everything here also ran on 20) |
| Express | 5.x (5.3.0 installed) |
| prom-client | 15.1.3 |
| OpenTelemetry | `sdk-node` 0.57.2, `auto-instrumentations-node` 0.56.1, `api` 1.9.x |
| Containers | `prom/prometheus:v2.55.1`, `grafana/grafana:11.3.0`, `jaegertracing/all-in-one:1.62.0`, `redis:7-alpine`, `rhysd/actionlint:latest`, `localstack/localstack:3.8` |
| Ports (host) | Prometheus 9091, Grafana 3001, Jaeger UI 16687, OTLP/HTTP 14318, Redis 63790, apps 3000 / 3100 / 3200 |

Windows par containers ko host ke apps tak pahunchne ke liye `host.docker.internal` use hota hai (Docker Desktop mein built-in; Linux par compose mein `extra_hosts: host.docker.internal:host-gateway` lagta hai, jo humne daal diya hai).

### Lab architecture

```
                         traceparent header
 load.js --> gateway :3000 -----------------> tasks-service :3100
               |  \                                  |
               |   \__ BullMQ job {taskId, _otel:{traceparent}} --> Redis --> worker :3200
               |
   /metrics (pull, 5s)  <---------------------- Prometheus :9091 <---- Grafana :3001
   OTLP spans (push) --------------------------> Jaeger :16687 (OTLP 14318)
```

Teen Node processes (host par), char containers (Prometheus, Grafana, Jaeger, Redis). Teeno apps `/metrics` expose karte hain; teeno spans Jaeger ko bhejte hain.

---

## Module 1 - Metrics: RED, USE, Prometheus, Grafana `[ESSENTIAL]`

**Learning objectives**

- RED aur USE methods ko sahi jagah par lagana (services vs resources) aur "four golden signals" se link karna.
- Express 5 app mein `prom-client` se counter, histogram, gauge aur default metrics lagana, sahi `route` label ke saath.
- Label cardinality trap ko run karke dekhna (10 000 series vs 1).
- Prometheus + Grafana ko docker compose se chalana; datasource aur dashboard provision karna.
- PromQL likhna: request rate, error ratio, `histogram_quantile` p95, aur histogram ki limits samajhna.

Estimated time: 2 hours. Cross-reference: basic definitions Week 7 / Day 5 notes (5.2). Yahan hum unko chala kar dekhte hain aur pitfalls dekhte hain.

### 1.1 Concept: kya measure karna hai

**Concept**

Metrics = time series numbers (`name{labels} value @ timestamp`). Logs "kya hua" batate hain, metrics "kitna aur kitna tez" batate hain, aur woh sasti hoti hain: ek counter ek number hai chahe 10 request aaye ya 10 million.

Do checklists, dono yaad rakhna:

| Method | Kis par lagta hai | Signals | Node.js / Task API example |
|--------|-------------------|---------|----------------------------|
| **RED** (Tom Wilkie) | Request-driven **services** | **R**ate (req/s), **E**rrors (failed req/s or ratio), **D**uration (latency distribution) | `/tasks/:id` ki req/s, 5xx ratio, p95 latency |
| **USE** (Brendan Gregg) | **Resources** (CPU, memory, disk, pool, queue) | **U**tilization (busy %), **S**aturation (queued/waiting work), **E**rrors | MySQL pool: in-use / max (U), waiting requests (S), connection errors (E). Event loop: busy % (U), loop lag (S) |
| Four golden signals (Google SRE) | Service dashboards | Latency, Traffic, Errors, Saturation | RED + saturation |

Yaad rakhne ka trick: **RED = "is the service happy for users?", USE = "which resource is the bottleneck?"**. Alert RED par karo (symptom), diagnose USE se karo (cause). Module 3 mein yehi principle alerting ban jata hai.

**Why it matters**

"Site slow hai" ka jawab dashboard se 30 second mein aana chahiye: kaun si route, kab se, errors ke saath ya sirf latency, aur resource saturated hai ya nahi. Bina metrics ke tum guess karte ho.

**Internal working: Prometheus pull model**

1. App `GET /metrics` par plain text deta hai (Prometheus exposition format).
2. Prometheus har `scrape_interval` par pull karta hai aur apne TSDB (time series database) mein store karta hai.
3. PromQL se query hota hai; Grafana woh query chalata hai aur graph banata hai.
4. Rules (recording/alerting) Prometheus khud evaluate karta hai (Module 3).

Pull model ke fayde: Prometheus ko pata hota hai ki target `up` hai ya nahi (`up == 0` ek free alert hai), apps ko Prometheus ka address nahi pata hona chahiye. Kamzori: short-lived jobs (cron, batch) scrape se pehle mar jaate hain -> unke liye Pushgateway ya OTel metrics push `[ADVANCED]`.

**Metric types**

| Type | Behaviour | Use for | Query with |
|------|-----------|---------|------------|
| Counter | Sirf badhta hai (restart par 0) | requests, errors, jobs done | `rate()` / `increase()` -- raw value kabhi mat dekho |
| Gauge | Upar-neeche | in-flight requests, queue depth, heap used | seedha ya `avg_over_time` |
| Histogram | Buckets mein counts (`_bucket{le=...}`), plus `_sum`, `_count` | latency, response size | `histogram_quantile(q, rate(..._bucket[5m]))` |
| Summary | Client-side quantiles | Rarely; **quantiles aggregate nahi hote** across instances | prefer histogram |

### 1.2 Lab setup: files

Folder `obs-lab/`:

```bash
mkdir obs-lab && cd obs-lab
npm init -y
npm i express@5 prom-client@15 pino@9 bullmq@5 ioredis@5 \
  @opentelemetry/api@1 @opentelemetry/sdk-node@0.57 \
  @opentelemetry/auto-instrumentations-node@0.56 \
  @opentelemetry/exporter-trace-otlp-http@0.57 \
  @opentelemetry/resources@1 @opentelemetry/semantic-conventions@1
```

`package.json` (mine; `"type": "module"` is the important line):

```json
{
  "name": "obs-lab",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "gateway": "node --import ./src/tracing.js src/gateway.js",
    "tasks": "node --import ./src/tracing.js src/tasks-service.js",
    "worker": "node --import ./src/tracing.js src/worker.js",
    "load": "node src/load.js",
    "lint": "eslint ."
  }
}
```

(`npm i` ne dependencies bhi add kar di; woh yahan nahi dikhayi. Scripts waise hi rakho.)

**`src/metrics.js`** -- registry, default metrics, RED histogram, in-flight gauge, business counter, middleware:

```js
// FILE: src/metrics.js
import client from 'prom-client';

export const register = new client.Registry();
register.setDefaultLabels({ service: process.env.OTEL_SERVICE_NAME ?? 'app' });
client.collectDefaultMetrics({ register }); // CPU, RSS, heap, event loop lag, GC, handles

// RED: Rate + Errors come from the _count of this histogram (label status), Duration from _bucket.
export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// USE-style saturation signal: how many requests are in flight right now.
export const httpInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Requests currently being processed',
  registers: [register],
});

// Business counter (bounded label values only).
export const tasksCreated = new client.Counter({
  name: 'tasks_created_total',
  help: 'Tasks created',
  labelNames: ['priority'],
  registers: [register],
});

export function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  httpInFlight.inc();
  res.on('close', () => {
    httpInFlight.dec();
    // req.route.path is the PATTERN ("/tasks/:id"), never the raw URL. Unmatched -> one bucket.
    const route = req.route ? (req.baseUrl ?? '') + req.route.path : 'unmatched';
    end({ method: req.method, route, status: String(res.statusCode) });
  });
  next();
}

export async function metricsHandler(_req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
```

Points to understand:

1. `collectDefaultMetrics` process CPU, RSS, heap, GC, active handles, event loop lag (`nodejs_eventloop_lag_*`) deta hai. Yeh USE signals ka Node version hain.
2. Histogram ek hi metric se **teeno RED signals** deta hai: `_count` se rate aur errors (status label), `_bucket` se duration.
3. `res.on('close')` use kiya, `finish` nahi: `close` client disconnect par bhi fire hota hai, to in-flight gauge kabhi "leak" nahi hota.
4. `route` label = **pattern** (`/tasks/:id`), raw URL nahi. Yeh agle subsection ka cardinality trap hai.
5. `register.setDefaultLabels({ service })` har series par `service` label lagata hai (hum Prometheus ke `job` label se bhi service pehchante hain).
6. Express 5 note: `req.route.path` Express 5 mein bhi set hota hai matched route ke baad. Unmatched (404) requests par `req.route` undefined hota hai, isliye wahan fixed string `'unmatched'` -- warna attacker random URLs bhej kar series ka dher laga sakta hai.

**`src/tasks-service.js`** (downstream service; fake DB call ke saath):

```js
// FILE: src/tasks-service.js
import express from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { metricsMiddleware, metricsHandler } from './metrics.js';
import { logger } from './log.js';

const tracer = trace.getTracer('tasks-service');
const app = express();
app.use(express.json());
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);

const tasks = new Map([['1', { id: '1', title: 'write docs' }]]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fake DB call wrapped in a MANUAL span (no DB driver here, so auto-instrumentation has nothing to show).
async function dbGet(id) {
  return tracer.startActiveSpan('db.get_task', { attributes: { 'db.system': 'fake', 'task.id': id } }, async (span) => {
    try {
      await sleep(20 + Math.random() * 60);
      return tasks.get(id) ?? null;
    } finally {
      span.end(); // ALWAYS end the span, otherwise it is never exported
    }
  });
}

app.get('/tasks/:id', async (req, res) => {
  const task = await dbGet(req.params.id);
  logger.info({ taskId: req.params.id, found: !!task }, 'task lookup');
  if (!task) return res.status(404).json({ error: 'not_found' });
  res.json(task);
});

app.post('/tasks', (req, res) => {
  const id = String(tasks.size + 1);
  tasks.set(id, { id, title: req.body?.title ?? 'untitled' });
  res.status(201).json(tasks.get(id));
});

// Error injection so dashboards/alerts have something to show.
app.get('/boom', (_req, res) => {
  const span = trace.getActiveSpan();
  span?.setStatus({ code: SpanStatusCode.ERROR, message: 'boom' });
  logger.error('injected failure');
  res.status(500).json({ error: 'boom' });
});

const server = app.listen(3100, () => logger.info('tasks-service on :3100'));
process.on('SIGTERM', () => server.close());
```

**`src/gateway.js`** (upstream; HTTP proxy + queue producer):

```js
// FILE: src/gateway.js
import express from 'express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { context, propagation } from '@opentelemetry/api';
import { metricsMiddleware, metricsHandler, tasksCreated } from './metrics.js';
import { logger } from './log.js';

const TASKS_URL = process.env.TASKS_URL ?? 'http://localhost:3100';
const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:63790', { maxRetriesPerRequest: null });
const notifyQueue = new Queue('notify', { connection });

const app = express();
app.use(express.json());
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);
app.get('/healthz', (_req, res) => res.sendStatus(200));

app.get('/tasks/:id', async (req, res) => {
  // fetch() is auto-instrumented (undici) and the traceparent header is injected for us.
  const r = await fetch(`${TASKS_URL}/tasks/${req.params.id}`);
  logger.info({ upstreamStatus: r.status }, 'proxied task lookup');
  res.status(r.status).json(await r.json());
});

app.post('/tasks', async (req, res) => {
  const r = await fetch(`${TASKS_URL}/tasks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body ?? {}),
  });
  const task = await r.json();
  tasksCreated.inc({ priority: req.body?.priority ?? 'normal' });

  // Queue hop: there is no HTTP header on a Redis job, so we carry the trace context IN the job data.
  const carrier = {};
  propagation.inject(context.active(), carrier); // writes { traceparent: '00-<traceid>-<spanid>-01' }
  await notifyQueue.add('task-created', { taskId: task.id, _otel: carrier });
  logger.info({ taskId: task.id }, 'task created and notification queued');
  res.status(201).json(task);
});

app.get('/slow', async (_req, res) => {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 900));
  res.json({ ok: true });
});

app.get('/flaky', (_req, res) => {
  if (Math.random() < 0.3) return res.status(500).json({ error: 'flaky' });
  res.json({ ok: true });
});

app.get('/boom', async (_req, res) => {
  const r = await fetch(`${TASKS_URL}/boom`);
  res.status(r.status).json(await r.json());
});

const server = app.listen(3000, () => logger.info('gateway on :3000'));
process.on('SIGTERM', () => server.close());
```

**`src/worker.js`** (BullMQ consumer; metrics ek chhote port par):

```js
// FILE: src/worker.js
import http from 'node:http';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import client from 'prom-client';
import { context, propagation, trace, ROOT_CONTEXT, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { register } from './metrics.js';
import { logger } from './log.js';

const tracer = trace.getTracer('notify-worker');
const jobsTotal = new client.Counter({ name: 'jobs_processed_total', help: 'Jobs by outcome', labelNames: ['queue', 'outcome'], registers: [register] });

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:63790', { maxRetriesPerRequest: null });

const worker = new Worker('notify', async (job) => {
  // Rebuild the remote parent context from the carrier stored in the job data.
  const parentCtx = propagation.extract(ROOT_CONTEXT, job.data._otel ?? {});
  return context.with(parentCtx, () =>
    tracer.startActiveSpan('notify process', { kind: SpanKind.CONSUMER, attributes: { 'messaging.system': 'bullmq', 'messaging.destination.name': 'notify' } }, async (span) => {
      try {
        await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
        logger.info({ taskId: job.data.taskId, jobId: job.id }, 'notification sent');
        jobsTotal.inc({ queue: 'notify', outcome: 'ok' });
      } catch (err) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR });
        jobsTotal.inc({ queue: 'notify', outcome: 'error' });
        throw err;
      } finally {
        span.end();
      }
    }));
}, { connection });

// Workers have no HTTP server, so expose /metrics on a tiny side port.
const metricsServer = http.createServer(async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
}).listen(3200);

process.on('SIGTERM', async () => { await worker.close(); metricsServer.close(); });
logger.info('worker on :3200 (metrics)');
```

**`src/log.js`** (logger):

```js
// FILE: src/log.js
import pino from 'pino';
import { trace } from '@opentelemetry/api';

// mixin() runs on every log call: if a span is active, stamp trace_id/span_id on the line.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: process.env.OTEL_SERVICE_NAME ?? 'app' },
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const { traceId, spanId } = span.spanContext();
    return { trace_id: traceId, span_id: spanId };
  },
});
```

**`src/load.js`** (traffic generator with mixed good/slow/flaky/failing routes):

```js
// FILE: src/load.js
// Tiny traffic generator: node src/load.js [seconds] [rps]
const secs = Number(process.argv[2] ?? 30);
const rps = Number(process.argv[3] ?? 10);
const base = process.env.BASE ?? 'http://localhost:3000';
const paths = [
  ['GET', '/tasks/1', 6], ['GET', '/tasks/999', 1], ['POST', '/tasks', 2],
  ['GET', '/slow', 1], ['GET', '/flaky', 2], ['GET', '/boom', 0.3],
];
const total = paths.reduce((a, p) => a + p[2], 0);
const pick = () => {
  let r = Math.random() * total;
  for (const p of paths) { r -= p[2]; if (r <= 0) return p; }
  return paths[0];
};
let sent = 0;
const end = Date.now() + secs * 1000;
while (Date.now() < end) {
  const [m, p] = pick();
  fetch(base + p, { method: m, headers: { 'content-type': 'application/json' }, body: m === 'POST' ? JSON.stringify({ title: 't' }) : undefined })
    .then((r) => r.arrayBuffer()).catch(() => {});
  sent++;
  await new Promise((r) => setTimeout(r, 1000 / rps));
}
console.log(`sent ${sent} requests`);
```

`src/tracing.js` Module 2 mein aayega; abhi ke liye metrics module ko tracing ke bina bhi chala sakte ho (`node src/gateway.js`), lekin hum seedha tracing ke saath chalate hain taaki ek hi baar chalana pade.

### 1.3 Run the stack

**`docker-compose.yml`**:

```yaml
# FILE: docker-compose.yml
name: obs
services:
  obs-redis:
    image: redis:7-alpine
    container_name: obs-redis
    ports: ["63790:6379"]

  obs-jaeger:
    image: jaegertracing/all-in-one:1.62.0
    container_name: obs-jaeger
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
    ports:
      - "16687:16686"   # Jaeger UI
      - "14318:4318"    # OTLP over HTTP (what our Node SDK exports to)

  obs-prometheus:
    image: prom/prometheus:v2.55.1
    container_name: obs-prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.retention.time=2h
    volumes:
      - ./prom/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prom/rules:/etc/prometheus/rules:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"   # needed on Linux; Docker Desktop already has it
    ports: ["9091:9090"]

  obs-grafana:
    image: grafana/grafana:11.3.0
    container_name: obs-grafana
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_DEFAULT_THEME: light
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    depends_on: [obs-prometheus]
    ports: ["3001:3000"]
```

**`prom/prometheus.yml`**:

```yaml
# FILE: prom/prometheus.yml
global:
  scrape_interval: 5s        # 15s is the usual production default; 5s makes the lab feel live
  evaluation_interval: 5s

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: gateway
    static_configs:
      - targets: ["host.docker.internal:3000"]
  - job_name: tasks-service
    static_configs:
      - targets: ["host.docker.internal:3100"]
  - job_name: worker
    static_configs:
      - targets: ["host.docker.internal:3200"]
```

**Grafana provisioning** -- datasource aur dashboard provider:

```yaml
# FILE: grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    uid: prom-main
    type: prometheus
    access: proxy
    url: http://obs-prometheus:9090
    isDefault: true
    editable: false
```

```yaml
# FILE: grafana/provisioning/dashboards/dashboards.yml
apiVersion: 1
providers:
  - name: lab
    type: file
    disableDeletion: true
    allowUiUpdates: false
    options:
      path: /var/lib/grafana/dashboards
```

Provisioning ka matlab: Grafana start hote hi files padhta hai, koi UI clicking nahi. Fayda: dashboard git mein review ho sakta hai, aur `docker compose down -v` ke baad bhi wapas aa jata hai. `uid: prom-main` isliye fix kiya taaki dashboard JSON uska reference de sake.

**Dashboard JSON** (`grafana/dashboards/red.json`): 6 panels -- rate, error ratio, p50/p95/p99, saturation (in-flight + event loop lag), memory, and an error-budget burn stat (yeh Module 3 ke recording rule ko use karta hai):

```json
{
  "uid": "red-gateway",
  "title": "Gateway RED + Node health",
  "tags": ["lab"],
  "schemaVersion": 39,
  "version": 1,
  "refresh": "5s",
  "time": { "from": "now-15m", "to": "now" },
  "panels": [
    {
      "id": 1, "type": "timeseries", "title": "Rate: requests/s by route",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
      "datasource": { "type": "prometheus", "uid": "prom-main" },
      "fieldConfig": { "defaults": { "unit": "reqps" }, "overrides": [] },
      "targets": [
        { "refId": "A", "legendFormat": "{{route}}",
          "expr": "sum by (route) (rate(http_request_duration_seconds_count{job=\"gateway\", route!=\"/metrics\"}[1m]))" }
      ]
    },
    {
      "id": 2, "type": "timeseries", "title": "Errors: 5xx ratio",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
      "datasource": { "type": "prometheus", "uid": "prom-main" },
      "fieldConfig": { "defaults": { "unit": "percentunit", "min": 0 }, "overrides": [] },
      "targets": [
        { "refId": "A", "legendFormat": "5xx ratio",
          "expr": "sum(rate(http_request_duration_seconds_count{job=\"gateway\", route!=\"/metrics\", status=~\"5..\"}[1m])) / sum(rate(http_request_duration_seconds_count{job=\"gateway\", route!=\"/metrics\"}[1m]))" }
      ]
    },
    {
      "id": 3, "type": "timeseries", "title": "Duration: p50 / p95 / p99 (histogram_quantile)",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
      "datasource": { "type": "prometheus", "uid": "prom-main" },
      "fieldConfig": { "defaults": { "unit": "s" }, "overrides": [] },
      "targets": [
        { "refId": "A", "legendFormat": "p50",
          "expr": "histogram_quantile(0.50, sum by (le) (rate(http_request_duration_seconds_bucket{job=\"gateway\", route!=\"/metrics\"}[1m])))" },
        { "refId": "B", "legendFormat": "p95",
          "expr": "histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{job=\"gateway\", route!=\"/metrics\"}[1m])))" },
        { "refId": "C", "legendFormat": "p99",
          "expr": "histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket{job=\"gateway\", route!=\"/metrics\"}[1m])))" }
      ]
    },
    {
      "id": 4, "type": "timeseries", "title": "Saturation: in-flight requests and event loop lag p99",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
      "datasource": { "type": "prometheus", "uid": "prom-main" },
      "fieldConfig": { "defaults": {}, "overrides": [] },
      "targets": [
        { "refId": "A", "legendFormat": "in flight", "expr": "http_requests_in_flight{job=\"gateway\"}" },
        { "refId": "B", "legendFormat": "event loop lag p99 (s)", "expr": "nodejs_eventloop_lag_p99_seconds{job=\"gateway\"}" }
      ]
    },
    {
      "id": 5, "type": "timeseries", "title": "Memory: heap used / RSS",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 16 },
      "datasource": { "type": "prometheus", "uid": "prom-main" },
      "fieldConfig": { "defaults": { "unit": "bytes" }, "overrides": [] },
      "targets": [
        { "refId": "A", "legendFormat": "heap used", "expr": "nodejs_heap_size_used_bytes{job=\"gateway\"}" },
        { "refId": "B", "legendFormat": "rss", "expr": "process_resident_memory_bytes{job=\"gateway\"}" }
      ]
    },
    {
      "id": 6, "type": "stat", "title": "Error budget burn (1h, SLO 99.9%)",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 16 },
      "datasource": { "type": "prometheus", "uid": "prom-main" },
      "fieldConfig": { "defaults": { "unit": "none", "decimals": 1,
        "thresholds": { "mode": "absolute", "steps": [ { "color": "green", "value": null }, { "color": "orange", "value": 1 }, { "color": "red", "value": 14.4 } ] } }, "overrides": [] },
      "targets": [
        { "refId": "A", "expr": "gateway:http_error_ratio:rate1h / 0.001" }
      ]
    }
  ]
}
```

Start everything:

```bash
docker compose up -d
# then, in three terminals (or background them):
OTEL_SERVICE_NAME=tasks-service node --import ./src/tracing.js src/tasks-service.js
OTEL_SERVICE_NAME=gateway       node --import ./src/tracing.js src/gateway.js
OTEL_SERVICE_NAME=worker        node --import ./src/tracing.js src/worker.js
node src/load.js 60 20          # 60 seconds at ~20 req/s
```

(PowerShell mein `OTEL_SERVICE_NAME=...` prefix kaam nahi karta: pehle `$env:OTEL_SERVICE_NAME='gateway'` set karo. `src/tracing.js` Module 2 ki file hai; use abhi bhi sath chalana hai.)

What I verified (real results from my run):

```text
$ docker run --rm --entrypoint promtool -v ".../prom:/p:ro" prom/prometheus:v2.55.1 check config /p/prometheus.yml
 SUCCESS: /p/prometheus.yml is valid prometheus config file syntax

$ curl localhost:9091/api/v1/targets      ->  gateway up, tasks-service up, worker up
$ node src/load.js 75 20                  ->  sent 1248 requests

# Grafana, queried through its own API (basic auth admin:admin):
GET /api/datasources                      -> one datasource "Prometheus", uid prom-main, readOnly true
GET /api/search?query=Gateway             -> dashboard uid red-gateway "Gateway RED + Node health"
GET /api/datasources/uid/prom-main/health -> {"message":"Successfully queried the Prometheus API.","status":"OK"}
POST /api/ds/query (rate expression)      -> status 200, with data frames
```

Ab browser mein kholo: Prometheus `http://localhost:9091`, Grafana `http://localhost:3001` (admin / admin, dashboard "Gateway RED + Node health"), Jaeger `http://localhost:16687`. (Maine Grafana ko screenshot se nahi, uski API se verify kiya hai -- panels ki visual rendering maine nahi dekhi.)

### 1.4 PromQL you must be able to write

Ye queries maine Prometheus API (`/api/v1/query`) se load ke baad chalayi. Results real hain (load ke dauran, 1m window):

**Rate** -- requests per second by route:

```promql
sum by (route) (rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[1m]))
```

```text
{route="/tasks/:id"} 9.35
{route="/tasks"}     2.87
{route="/flaky"}     2.51
{route="/slow"}      1.35
{route="/boom"}      0.49
```

(Load script ka mix: GET /tasks/:id sabse zyada, jaise real traffic mein hot read endpoint.)

**Error ratio** (5xx / all):

```promql
sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[1m]))
/
sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[1m]))
```

```text
{} 0.0768          # 7.7%: /flaky fails 30% of its calls and /boom always fails
```

**p95 latency** from the histogram:

```promql
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{job="gateway", route!="/metrics"}[1m])))
```

```text
{} 0.70
```

Aur route-wise p95 (`sum by (le, route)`):

```text
{route="/tasks/:id"} 0.098
{route="/tasks"}     0.041
{route="/flaky"}     0.0049
{route="/slow"}      2.27
{route="/boom"}      0.024
```

**Dhyaan do -- yeh ek real histogram trap hai.** `/slow` code mein `300 + random*900` ms sleep karta hai, yani maximum ~1.2 s. Phir bhi p95 = **2.27 s** aaya! Wajah: buckets `... 0.5, 1, 2.5, 5`. Saare slow requests `(1, 2.5]` bucket mein gire; `histogram_quantile` us bucket ke andar **linearly interpolate** karta hai, isliye jhooti 2.27 s aa gayi. Lesson: percentile ki accuracy bucket boundaries par depend karti hai. SLO threshold (jaise 1 s) ke ek bucket boundary par hona chahiye, aur buckets wahan dense hone chahiye jahan tumhara SLO hai. Average ya summary se aise sawal nahi bachte.

**Other useful PromQL** (patterns, same metrics):

```promql
# apdex-like: fraction of requests faster than 250 ms (needs a bucket boundary at 0.25: we have it)
sum(rate(http_request_duration_seconds_bucket{job="gateway", le="0.25"}[5m]))
/ sum(rate(http_request_duration_seconds_count{job="gateway"}[5m]))

# top 3 slowest routes by p95
topk(3, histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m]))))

# average latency (only as a sanity check; never alert on it)
sum(rate(http_request_duration_seconds_sum[5m])) / sum(rate(http_request_duration_seconds_count[5m]))

# a counter that just reset or a process that restarted
changes(process_start_time_seconds[1h])

# is the scrape itself healthy
up == 0
```

`rate()` vs `increase()`: `rate` = per-second average over the window; `increase` = total growth over the window (rate * seconds). Window kam se kam 4x `scrape_interval` rakho (15s scrape par `[1m]` minimum), warna ek missed scrape se graph toot jata hai.

### 1.5 The label cardinality trap

**Concept**

Har unique label-value combination ek **alag time series** hai. Prometheus memory aur disk series ki count se badhte hain, request count se nahi. `userId`, raw URL, email, order id, trace id jaise unbounded values label mein daalna sabse common Prometheus outage hai.

**Run it** (`src/cardinality-demo.js`, ek process mein):

```js
// FILE: src/cardinality-demo.js
// Shows why unbounded label values hurt: series count = number of distinct label combinations.
import client from 'prom-client';

const reg = new client.Registry();
const bad = new client.Counter({ name: 'bad_total', help: 'raw url label', labelNames: ['url'], registers: [reg] });
const good = new client.Counter({ name: 'good_total', help: 'route pattern label', labelNames: ['route'], registers: [reg] });

for (let userId = 1; userId <= 10000; userId++) {
  bad.inc({ url: `/users/${userId}/tasks` });   // 10 000 distinct values -> 10 000 time series
  good.inc({ route: '/users/:id/tasks' });      // 1 value -> 1 time series
}

const seriesCount = async (c) => (await c.get()).values.length;
console.log('bad_total series :', await seriesCount(bad));
console.log('good_total series:', await seriesCount(good));
const text = await reg.metrics();
console.log('scrape payload   :', (text.length / 1024).toFixed(0), 'KiB per scrape (every 15s, forever)');
```

```text
$ node src/cardinality-demo.js
bad_total series : 10000
good_total series: 1
scrape payload   : 360 KiB per scrape (every 15s, forever)
```

10 000 users = 10 000 series = har scrape par 360 KiB, aur har series ka apna histogram hoga to x(buckets). Production mein 1 million users ke saath yeh Prometheus ko OOM kar deta hai.

**Rules of thumb**

- Label values **bounded aur chhote** hone chahiye (tens, not thousands): method, route pattern, status class/code, outcome.
- User-level detail ke liye logs ya traces use karo (Module 2): woh per-event store hote hain, series nahi.
- Histogram ka cost = buckets x label combinations. 10 buckets x 20 routes x 5 statuses x 3 methods x 3 services = 9 000 series, theek hai; `userId` jodte hi finished.
- Unmatched routes ko ek fixed label do (humne `'unmatched'` kiya).
- Prometheus mein `topk(10, count by (__name__)({__name__=~".+"}))` ya UI ka TSDB status page (`/tsdb-status`) se high-cardinality metrics dhoondhte hain.

### Frontend connection

Frontend mein tum Web Vitals (LCP, INP) ke percentiles dekhte ho aur jaante ho ki average user experience nahi batata. Backend mein p95/p99 wahi cheez hai. React DevTools Profiler component-level "time spent" dikhata hai, jaise Jaeger span-level time dikhata hai (Module 2). Aur Redux action names ko label banane jaisa hi hai route pattern ko label banana: bounded vocabulary.

### Real-world scenario

Marketplace mein checkout slow hai. Dashboard: `/orders` ka p95 150 ms se 2 s ho gaya, error ratio flat, in-flight requests badh rahe hain, event-loop lag normal, MySQL pool waiting > 0. RED ne bataya "kya" (latency up), USE ne bataya "kahan" (DB pool saturated). Agla step trace dekhna (Module 2) ya `SHOW PROCESSLIST` / slow query log (Week 4 / Day 6 notes).

### Interview answer

**Interview answer:** "I instrument services with the RED method: request rate, error ratio and a latency histogram, and I use the USE method for resources like the DB pool and event loop. In Node I use prom-client: a histogram labelled with method, route pattern and status gives me all three RED signals, plus default metrics for heap, GC and event loop lag. Prometheus scrapes `/metrics`, and I query percentiles with `histogram_quantile` over `rate()` of the buckets, aggregated with `sum by (le)`. I keep labels bounded -- route patterns, never raw URLs or user IDs -- because every label combination is a new time series. And I pick histogram buckets around the SLO threshold, because percentile accuracy depends on bucket boundaries."

### Follow-up questions

1. *Why `sum by (le)` inside `histogram_quantile`?* Buckets alag-alag instances/routes par hote hain; quantile nikalne se pehle unko `le` ke hisaab se add karna padta hai (aggregatable). Averaging per-instance quantiles galat hai.
2. *Histogram vs Summary?* Summary quantiles client par calculate karta hai, instances ke across aggregate nahi hote. Histogram server-side quantile deta hai aur aggregate ho jata hai, lekin bucket-limited accuracy.
3. *Counter restart par kya hota hai?* `rate()` counter reset detect karke handle karta hai. Isliye raw counter graph kabhi nahi, hamesha `rate`/`increase`.
4. *Pull vs push?* Pull: central control, free `up` signal, discovery. Push: short-lived jobs, firewalled targets. OTel Collector dono bridge kar sakta hai `[ADVANCED]`.
5. *Event loop lag kaise dekhoge?* `nodejs_eventloop_lag_p99_seconds` (prom-client default). Jab lag badhe aur CPU 100% single core par ho, to loop block ho raha hai (Week 2 / Day 2, Week 6 / Day 6 notes).
6. *`/metrics` endpoint public kyun nahi hona chahiye?* Internal details leak hote hain (route names, versions) aur scrape expensive hai. Internal network, ya separate port, ya auth ke peeche rakho.

### Common mistakes

- Raw URL / userId / email as label value (cardinality).
- Counter ko `rate()` ke bina graph karna.
- Average latency par dashboard/alert banana.
- Default buckets ko blind use karna (prom-client default buckets 5 ms - 10 s, tumhare SLO ke around dense nahi).
- `rate()` window scrape interval se chhoti rakhna.
- Har instance par alag registry/label naming (naming convention: `snake_case`, base units seconds/bytes, counters end in `_total`).
- `/metrics` ko apni hi metrics mein count karna (humne `route!="/metrics"` se filter kiya).

### Revision notes

- RED for services, USE for resources; alert on RED, debug with USE.
- One histogram = rate + errors + duration. Counters need `rate()`.
- `histogram_quantile(q, sum by (le) (rate(x_bucket[5m])))`; accuracy = bucket layout.
- Cardinality = number of distinct label combinations. Bounded labels only.

**Key concepts to remember**

1. Time series = metric name + label set; series count drives cost.
2. Counter/gauge/histogram and which PromQL function pairs with each.
3. RED vs USE vs golden signals.
4. Bucket interpolation can lie (the `/slow` p95 = 2.27 s example).
5. Provisioned dashboards are code.

**Revision questions**

1. Write the PromQL for 5xx error ratio per route over 5 minutes.
2. Why did `/slow` (max ~1.2 s) show p95 = 2.27 s? How would you fix the buckets?
3. A teammate adds `user_id` as a label to `http_request_duration_seconds`. What happens and what do you propose instead?
4. Which RED/USE signals would you put on the dashboard of a BullMQ worker?
5. Why use `res.on('close')` instead of `finish` for an in-flight gauge?

**Practical task**

Add a `db_pool_in_use` / `db_pool_waiting` gauge pair (fake it with `setInterval` and random numbers if you do not have MySQL here) and a `jobs_processed_total{outcome}` panel for the worker (the counter already exists in `src/worker.js`). Add both panels to `red.json` and confirm via the Grafana API that the dashboard still provisions.

**Checklist**

- [ ] I can explain RED vs USE with one Node example each.
- [ ] I ran `docker compose up -d`, loaded the dashboard and saw live data.
- [ ] I wrote rate, error-ratio and p95 queries from memory in the Prometheus UI.
- [ ] I ran `cardinality-demo.js` and can explain the numbers.
- [ ] I can explain why bucket boundaries should surround the SLO threshold.

---

## Module 2 - Distributed tracing with OpenTelemetry (Jaeger) `[ESSENTIAL]`

**Learning objectives**

- Trace, span, context, propagation, sampling, exporter: yeh shabd clear karna.
- Node app mein OpenTelemetry auto-instrumentation lagana (ESM gotcha ke saath).
- Manual span likhna (aur `span.end()` bhoolne ka nuksan).
- Trace context ko service-to-service HTTP aur **BullMQ queue hop** ke across propagate karna.
- Trace-to-log correlation: log line se `trace_id` utha kar Jaeger mein poori request dekhna.
- Sampling ka asar run karke dekhna.

Estimated time: 2 hours. Cross-reference: correlation IDs / `x-request-id` Week 6 / Day 2 notes. Tracing usi idea ka standardised, automatic, parent-child version hai.

### 2.1 Concept

**Concept**

Ek user request kai services se guzarti hai (gateway -> tasks-service -> Redis -> worker). Logs ek service ke andar ki kahani batate hain; **trace** poori journey ki ek tree hai.

| Term | Matlab |
|------|--------|
| Trace | Ek end-to-end request, ek `trace_id` (32 hex chars) |
| Span | Trace ka ek kaam (ek HTTP call, ek DB query, ek job). Start time, duration, attributes, status, `parent_span_id` |
| Context | Current trace_id + span_id + flags jo code ke saath chalta hai (Node mein `AsyncLocalStorage` ke through) |
| Propagation | Context ko process ki seema paar bhejna. HTTP mein header `traceparent: 00-<trace_id>-<span_id>-<flags>` (W3C Trace Context) |
| Instrumentation | Spans banane wala code: auto (library patch) ya manual |
| Exporter | Spans ko backend tak bhejna (OTLP over HTTP/gRPC) |
| Sampler | Kitni traces rakhni hain (sab = mehnga) |
| Backend | Jaeger / Tempo / vendor; hum Jaeger all-in-one use karte hain |

OpenTelemetry (OTel) = vendor-neutral standard: API (code mein use hota hai), SDK (processing), exporters, Collector. Isse backend badalna config change hai, code change nahi.

**Why it matters**

Metrics bataate hain "p95 badh gayi". Trace batata hai **kahan**: gateway ne 225 ms liye, jisme tasks-service 44 ms aur Redis 13 ms, baaki gateway ke andar. Microservices mein bina tracing ke latency debugging guesswork hai.

**Internal working in Node**

1. `tracing.js` sabse pehle load hota hai (`node --import ./src/tracing.js app.js`) taaki `http`, `express`, `ioredis`, `undici/fetch` import hone se pehle patch ho jayein.
2. Active context `AsyncLocalStorage` mein hota hai, isliye `await` ke across bhi sahi span "current" rehta hai.
3. Outgoing HTTP call par instrumentation `traceparent` header **inject** karti hai; incoming call par woh header **extract** karke naya span usi trace mein bana deti hai.
4. Spans batch mein memory mein jama hote hain aur `BatchSpanProcessor` OTLP se Jaeger ko bhejta hai. Isliye process band hone se pehle `sdk.shutdown()` zaroori hai (warna last spans kho jaate hain; Week 6 / Day 5 ke graceful shutdown se link).

### 2.2 Auto-instrumentation setup (ESM)

**`src/tracing.js`**:

```js
// FILE: src/tracing.js
// Loaded BEFORE the app: node --import ./src/tracing.js src/gateway.js
import { register } from 'node:module';
// ESM needs the import-in-the-middle hook, otherwise express/ioredis imports are not patched.
register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'unknown-service', // shows up in Jaeger's service dropdown
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? 'http://localhost:14318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false }, // very noisy, rarely useful
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
    }),
  ],
});
sdk.start();

// Flush spans that are still in the batch buffer when the process is asked to stop.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.once(sig, async () => {
    await sdk.shutdown().catch(() => {});
    process.exit(0);
  });
}
```

ESM gotcha: `import` wale modules ko patch karne ke liye `register('@opentelemetry/instrumentation/hook.mjs', ...)` chahiye (import-in-the-middle). CommonJS app mein yeh zaroorat nahi, `require('./tracing')` kaafi hai. Bina hook ke ESM app mein kuch spans silently gayab hote hain: sabse khatarnak kyunki error nahi aata.

Unnecessary noise (`fs`, `dns`, `net`) ko disable kiya, kyunki woh har file read par span banate hain.

### 2.3 Manual spans

Auto-instrumentation HTTP/Redis jaisi libraries ko cover karti hai. **Business logic** ke liye khud span banao. `tasks-service.js` mein `dbGet`:

```js
async function dbGet(id) {
  return tracer.startActiveSpan('db.get_task', { attributes: { 'db.system': 'fake', 'task.id': id } }, async (span) => {
    try {
      await sleep(20 + Math.random() * 60);
      return tasks.get(id) ?? null;
    } finally {
      span.end(); // ALWAYS end the span, otherwise it is never exported
    }
  });
}
```

Rules: `startActiveSpan` span ko current context bana deta hai (andar ke auto-spans uske child banenge). `span.end()` hamesha `finally` mein. Error par `span.recordException(err); span.setStatus({ code: SpanStatusCode.ERROR })`. Attributes mein bounded ya unbounded kuch bhi ho sakta hai (traces per-event store hote hain, series nahi), lekin PII/secrets mat daalo.

### 2.4 Context propagation: HTTP and a queue hop

**HTTP** -- gateway se tasks-service tak `fetch()`: kuch likhna nahi pada. `undici` instrumentation ne `traceparent` inject kiya aur tasks-service ke `http` instrumentation ne extract kiya.

**Queue** -- Redis job par HTTP header nahi hota. Isliye hum context ko **job data ke andar carrier** mein rakhte hain. Producer (`gateway.js`):

```js
const carrier = {};
propagation.inject(context.active(), carrier); // writes { traceparent: '00-<traceid>-<spanid>-01' }
await notifyQueue.add('task-created', { taskId: task.id, _otel: carrier });
```

Consumer (`worker.js`):

```js
const parentCtx = propagation.extract(ROOT_CONTEXT, job.data._otel ?? {});
return context.with(parentCtx, () =>
  tracer.startActiveSpan('notify process', { kind: SpanKind.CONSUMER, ... }, async (span) => { ... }));
```

Yehi pattern Kafka (message headers), SQS (message attributes), RabbitMQ (headers) mein hai. Ready-made libraries (bullmq-otel, community instrumentations) yahi karti hain; manual karne se tum mechanism samajhte ho `[ADVANCED]` aur interview mein explain kar sakte ho.

Design choice: worker span ko producer span ka **child** bana diya (trace ek hi tree dikhata hai). Async messaging mein kuch log **span links** prefer karte hain (consumer ka alag trace, producer se link), kyunki job turant nahi, ghante baad bhi chal sakta hai. Dono valid hain; humare short-lived job ke liye child simpler hai.

### 2.5 Trace-to-log correlation

Goal: log line mein `trace_id` ho, taaki "ye error log dikha, ab poori request dikhao". `src/log.js` mein `mixin()` active span ki ids daalta hai (file Module 1 mein dikhayi). **Observation from my run:** auto-instrumentation ka pino instrumentation (`@opentelemetry/instrumentation-pino`, auto bundle mein included) yeh fields apne aap bhi daal deta hai (`trace_id`, `span_id`, `trace_flags`), isliye mera manual `mixin` redundant nikla. Manual mixin tab kaam ka hai jab pino instrumentation off ho ya tum koi aur logger use karo; dono saath mein bhi koi duplicate key nahi aayi.

Real log lines (gateway, ek `POST /tasks` request):

```json
{"level":30,"time":1792478389707,"service":"gateway","trace_id":"67271604bb95ee83e43df071a52891f5","span_id":"f861065e9d4d7a33","trace_flags":"01","taskId":"2","msg":"task created and notification queued"}
```

Worker ki log line (alag process) **wahi trace_id**:

```json
{"level":30,"time":1792478389862,"service":"worker","trace_id":"67271604bb95ee83e43df071a52891f5","span_id":"d59ed5bd8715ec36","trace_flags":"01","taskId":"2","jobId":"90","msg":"notification sent"}
```

Ab us id se Jaeger API ya UI (`http://localhost:16687/trace/<trace_id>`) mein poori tree. Chhota helper jo tree ko terminal mein print karta hai (`src/trace-tree.js`):

```js
// FILE: src/trace-tree.js
// Print one Jaeger trace as an indented tree.
//   node src/trace-tree.js <traceId>            (id copied from a log line)
//   node src/trace-tree.js gateway POST         (newest trace whose root operation matches)
const [a = "gateway", op = "POST"] = process.argv.slice(2);
const base = process.env.JAEGER ?? "http://localhost:16687";
const url = /^[0-9a-f]{32}$/.test(a)
  ? `${base}/api/traces/${a}`
  : `${base}/api/traces?service=${encodeURIComponent(a)}&operation=${encodeURIComponent(op)}&limit=1&lookback=1h`;
const { data } = await (await fetch(url)).json();
if (!data?.length) { console.log('no trace found'); process.exit(1); }
const t = data[0];
const byId = Object.fromEntries(t.spans.map((s) => [s.spanID, s]));
const depth = (s) => { let n = 0; let p = s.references[0]; while (p && byId[p.spanID]) { n++; p = byId[p.spanID].references[0]; } return n; };
console.log(`traceID ${t.traceID}  spans=${t.spans.length}`);
for (const s of t.spans.sort((a, b) => a.startTime - b.startTime)) {
  console.log(`${'  '.repeat(depth(s))}${t.processes[s.processID].serviceName} | ${s.operationName} | ${Math.round(s.duration / 1000)}ms`);
}
```

Run:

```text
$ curl -XPOST localhost:3000/tasks -H 'content-type: application/json' -d '{"title":"x","priority":"high"}'
$ node src/trace-tree.js 67271604bb95ee83e43df071a52891f5
traceID 67271604bb95ee83e43df071a52891f5  spans=5
gateway | POST | 225ms
  gateway | POST | 74ms
    tasks-service | POST | 44ms
  gateway | evalsha | 13ms
  worker | notify process | 153ms
```

Ise padho: gateway ka server span 225 ms; uske andar `fetch` client span (74 ms) jo tasks-service ke server span (44 ms) tak gaya; `evalsha` BullMQ ka Redis Lua call (13 ms, queue mein job daalna); aur **worker ka span, jo ek alag process mein chala, usi trace mein** (153 ms, job ki processing). Yeh trace mein HTTP aur queue dono hop ka saboot hai.

Jo mujhe nahi mila (honest notes):

- Express ke router/middleware spans nahi aaye (ESM + Express 5 mein `instrumentation-express` ne spans nahi banaye), isliye server spans ke naam sirf `POST`/`GET` hain, `POST /tasks` nahi. Isliye maine trace ko `trace_id` se dhoondha, operation name se nahi. Production mein route naam chahiye to sampler/span name manually set karna padega; maine yeh test nahi kiya.
- tasks-service ki `db.get_task` manual span `GET /tasks/:id` par dikhti hai (POST par nahi, kyunki POST ne `dbGet` call nahi kiya). Maine yeh trace dekhi:

```text
traceID ec621366c9b2a42308e0305a25954bc9  spans=4
gateway | GET | 44ms
  gateway | GET | 40ms
      tasks-service | db.get_task | 37ms
    tasks-service | GET | 39ms
```

  `db.get_task` ka parent tasks-service ka `GET` span hai; `trace-tree.js` start-time se sort karta hai, aur dono spans lagbhag ek hi microsecond window mein start hote hain, isliye printed order mein `db.get_task` upar aa sakta hai. Parent-child asli relation `references[0]` se aata hai, print order se nahi.

### 2.6 Sampling

Sab requests ki trace rakhna mehnga hai. **Head-based sampling** request ke shuru mein decide karta hai; `parentbased_traceidratio` ka matlab: root par ratio se decide, baaki services parent ka decision follow karti hain (isse trace adhura nahi hota).

```bash
OTEL_TRACES_SAMPLER=parentbased_traceidratio OTEL_TRACES_SAMPLER_ARG=0.1 \
  OTEL_SERVICE_NAME=gateway node --import ./src/tracing.js src/gateway.js
```

Experiment (maine run kiya): ratio 0.1, 300 requests `GET /tasks/1` bheji, Jaeger se wapas gina:

```text
traces sampled for 300 requests: 39         (about 13%; includes Prometheus /metrics scrapes of the gateway)
spans per trace avg/min/max: 3.9 / 1 / 4
traces containing gateway+tasks-service: 38  (whole traces kept, none half-sampled)
traces containing only gateway: 1            (a /metrics scrape)
```

| Strategy | Pro | Con |
|----------|-----|-----|
| Head-based ratio | Sasta, simple | Rare errors/slow traces miss ho sakti hain |
| Tail-based (OTel Collector) `[ADVANCED]` | "Keep all errors and slow traces" | Collector ko poori trace buffer karni padti hai, complex |
| Always-on + short retention | Saari traces | Cost / volume |

Practical default: dev mein 100%, production mein 1-10% + errors ke liye tail sampling jab team ready ho.

### Frontend connection

Browser mein `fetch` ke saath Network tab ek waterfall dikhata hai; Jaeger ka trace view backend ka waterfall hai. OTel ka browser SDK `traceparent` header frontend se bhi inject kar sakta hai, to ek click se DB query tak ek hi trace banti hai `[ADVANCED]` (CORS mein `traceparent` header allow karna padega, Week 3 / Day 6 notes).

### Real-world scenario

Payments app: "payment API kabhi-kabhi 4 s leti hai". p95 metric ne confirm kiya. Trace dekhi: `POST /pay` -> `psp.charge` span 3.6 s. Logs mein us `trace_id` se PSP timeout aur retry dikhe. Fix: client timeout + retry with backoff (Week 6 / Day 3 notes) aur ek alert PSP span duration par.

### Interview answer

**Interview answer:** "Distributed tracing links all the work for one request across services into a single tree of spans, identified by a trace id. In Node I use OpenTelemetry: auto-instrumentation for HTTP, Express and Redis, manual spans around business operations, and an OTLP exporter to Jaeger or Tempo. Context travels in the W3C `traceparent` header for HTTP; for queues I inject the context into the message or job and extract it in the consumer, so the worker's span joins the same trace. I stamp `trace_id` and `span_id` on every log line so I can jump from a log entry to the full trace. In production I sample, usually parent-based ratio so traces are never half-kept, and tail-sample errors and slow requests if I can run a Collector."

### Follow-up questions

1. *Trace vs correlation ID?* Correlation ID ek flat string hai (logs grep). Trace parent-child timing tree deta hai, standard propagation ke saath, aur backend UI.
2. *Context kho kyun jata hai?* `AsyncLocalStorage` break hota hai jab koi library callbacks/event emitters ya connection pool se context gum kare, ya instrumentation load hi na ho. Queue/cron mein context manually restore karna padta hai.
3. *Span attribute vs metric label?* Attribute high-cardinality ho sakta hai (per-event); metric label nahi (Module 1.5).
4. *Overhead?* Per-span CPU/memory small lekin non-zero; sampling + batch exporter se control. Hamesha measure karo.
5. *Span links kab?* Fan-in/fan-out ya async jobs jahan consumer trace alag chalna chahiye.
6. *Collector kyun?* App sirf OTLP bhejta hai; Collector batching, retries, tail sampling, redaction, multi-backend fan-out sambhalta hai, aur backend change code change nahi.
7. *Tracing kab nahi chahiye?* Single monolith + single DB: logs + metrics + slow query log aksar kaafi. Complexity ka cost hota hai.

### Common mistakes

- `tracing.js` ko app ke baad load karna (patch nahi hota).
- ESM mein hook register na karna.
- `span.end()` na karna (span leak, kabhi export nahi).
- Sensitive data attributes mein (tokens, card numbers, full request bodies).
- Process exit par `sdk.shutdown()` na karna (last spans lost).
- 100% sampling production mein bina cost socche.
- Queue/job hop par context propagate na karna (trace do tukdon mein).

### Revision notes

- Trace = tree of spans; context propagates (`traceparent`); queues need manual carrier.
- Load tracing first; ESM needs the import hook.
- `trace_id` in logs closes the loop. Parent-based sampling keeps traces whole.

**Key concepts to remember**

1. Span anatomy and parent-child relationships.
2. W3C `traceparent` format: `00-<32 hex trace>-<16 hex span>-<flags>`.
3. Inject/extract pattern for any carrier (HTTP headers, job data, message headers).
4. Head vs tail sampling.
5. Logs <-> traces correlation.

**Revision questions**

1. What breaks if `tracing.js` is imported after `express`?
2. Show the code that carries trace context through a BullMQ job and back.
3. Why must `span.end()` be in `finally`?
4. How does `parentbased_traceidratio` avoid half-sampled traces?
5. When would you choose span links over parent-child for a consumer?

**Practical task**

Add a `GET /tasks/:id/full` route to the gateway that calls tasks-service twice in parallel (`Promise.all`) and enqueues nothing. Make the trace show two sibling client spans. Then add `span.recordException` for a forced failure in tasks-service `/boom` and find the red span in Jaeger.

**Checklist**

- [ ] I started Jaeger and found my three services in its dropdown.
- [ ] I sent a `POST /tasks` and traced it across HTTP and the queue.
- [ ] I copied a `trace_id` from a log line and used it to fetch the trace.
- [ ] I can write the inject/extract code for a job from memory.
- [ ] I can explain why sampling must be parent-based.

---

## Module 3 - Alerting, SLI/SLO, error budgets and burn-rate rules `[ESSENTIAL]`

**Learning objectives**

- Symptom-based vs cause-based alerts, alert fatigue, paging vs ticket.
- SLI, SLO, SLA, error budget: definitions aur numbers (minutes of downtime, number of failed requests).
- Burn rate aur multi-window multi-burn-rate alerts ka logic.
- Prometheus recording + alerting rules likhna, `promtool check rules` aur `promtool test rules` se validate karna.
- Alertmanager routing (page vs ticket) aur inhibition.

Estimated time: 2 hours. Cross-reference: Week 7 / Day 5 notes ke alerting section mein simple `for: 5m` threshold alerts hain; yahan unki limitation aur better design hai.

### 3.1 Symptom vs cause, and alert fatigue

**Concept**

| | Symptom-based | Cause-based |
|---|---------------|-------------|
| Question | "Kya user ko problem dikh rahi hai?" | "Kya koi internal cheez ajeeb hai?" |
| Examples | 5xx ratio, p95 latency, checkout success rate, availability probe | CPU > 80%, disk > 85%, GC time, pod restarts, replica lag |
| False positives | Kam | Bahut: CPU 90% par bhi sab theek ho sakta hai |
| Coverage | Har tarah ke failure ko pakadta hai (jo tumne socha bhi nahi) | Sirf unhi failures ko jo tumne pehle se socha |
| Use as | **Page** (insaan ko jagana) | Dashboard, ticket, ya diagnosis ke liye |

Rule: **page only for symptoms that need a human now, and ticket/dashboard for causes.** Cause-based alerts ko "paging" tabhi do jab woh kuch aisa predict karein jo user-impact se pehle fix karna zaroori ho (jaise disk 95% par full hone wala hai aur growth fast hai).

Alert fatigue: agar on-call ko din mein 20 alerts aate hain jinme 18 ignore karne layak hain, to 19th real alert bhi ignore hota hai. Har page ke liye test: "(1) kya yeh user-impacting hai? (2) kya koi insaan abhi kuch kar sakta hai? (3) kya runbook link hai?" Teeno yes nahi to woh page nahi, ticket hai.

Paging vs ticket:

| Severity | Delivered via | Response | Example |
|----------|---------------|----------|---------|
| page | Phone/SMS/push (PagerDuty, Opsgenie) | Minutes, 24x7 | Fast error-budget burn |
| ticket | Slack channel / Jira | Business hours | Slow burn, disk will fill in 4 days |
| log only | Dashboard | Look when debugging | CPU, GC, per-pod metrics |

### 3.2 SLI, SLO, SLA, error budget

**Concept**

- **SLI** (indicator): ek measured ratio. Good events / valid events. Example: `successful_requests / total_requests`, ya `requests_faster_than_300ms / total_requests`.
- **SLO** (objective): SLI ka target over a window. "99.9% of requests succeed over 30 days".
- **SLA** (agreement): business/legal promise with penalties; SLA SLO se **dheela** hota hai (SLO tight rakho taaki SLA kabhi na tootay).
- **Error budget** = `1 - SLO`. Woh failure jo tum afford kar sakte ho. Budget bacha hai -> ship faster; budget khatam -> reliability work ko priority.

**Math (hand-calculated, check karo)**

Time-based view, 30 din = 43 200 minutes:

| SLO | Error budget | Allowed full downtime / 30 days |
|-----|--------------|----------------------------------|
| 99% | 1% | 432 min = 7.2 h |
| 99.5% | 0.5% | 216 min = 3.6 h |
| 99.9% | 0.1% | 43.2 min |
| 99.95% | 0.05% | 21.6 min |
| 99.99% | 0.01% | 4.32 min |

Request-based view (zyada realistic): gateway par 1 million requests/day = 30 million per 30 days. SLO 99.9% -> budget = 0.001 x 30 000 000 = **30 000 failed requests** per window. 1M/day matlab ~41 667 requests/hour. Agar ek bad deploy 5% requests fail karwaye to ~2 083 failures/hour, aur 30 000 / 2 083 = ~14.4 hours mein poora budget khatam. (5% / 0.1% = burn rate 50, aur 720 h / 50 = 14.4 h: dono tareeke ek jawab dete hain.)

Yeh "kitni jaldi budget jal raha hai" hi **burn rate** hai.

**Burn rate**

```
burn rate = (observed error ratio) / (error budget fraction)

SLO 99.9%  -> budget fraction = 0.001
observed 1.44% errors -> burn rate = 0.0144 / 0.001 = 14.4
```

Burn rate 1 = tum tab poora budget exactly 30 din mein khatam karoge (SLO ke barabar). Burn rate 14.4 = 30 din ka budget 30 / 14.4 = 2.08 din (50 hours) mein khatam. Ek ghante tak 14.4x par rehne se budget ka `14.4 x 1h / 720h = 2%` jal jata hai.

Is table se Google SRE Workbook ke recommended alert tiers nikalte hain (30-day window = 720 h):

| Tier | Burn rate | Long window | Short window | Budget consumed in long window | Severity |
|------|-----------|-------------|--------------|-------------------------------|----------|
| Fast | 14.4 | 1 h | 5 min | 14.4 x 1 / 720 = **2%** | page |
| Medium | 6 | 6 h | 30 min | 6 x 6 / 720 = **5%** | page |
| Slow | 3 | 1 d (24 h) | 2 h | 3 x 24 / 720 = **10%** | ticket |
| Very slow | 1 | 3 d (72 h) | 6 h | 1 x 72 / 720 = **10%** | ticket |

Sab alert condition: `error_ratio[long] > burn x budget  AND  error_ratio[short] > burn x budget`.

**Do windows kyun?** Sirf long window: outage khatam hone ke baad bhi alert ghanton tak fire karta rahega (reset time kharab). Sirf short window: 3 minute ki blip par page ho jayega (noisy). Dono `and` mein: **long window significance deta hai, short window "abhi bhi ho raha hai" confirm karta hai**, to alert jaldi band bhi hota hai.

### 3.3 The rules (validated)

`prom/rules/slo.yml` -- recording rules (SLI har window ke liye ek baar compute) + 4 burn-rate alerts + ek latency alert + ek cause-based alert (sirf ticket):

```yaml
# FILE: prom/rules/slo.yml
groups:
  # ---- Recording rules: compute the SLI once per window, reuse in alerts and dashboards ----
  - name: gateway-sli
    rules:
      - record: gateway:http_error_ratio:rate5m
        expr: |
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[5m]))
          /
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[5m]))
      - record: gateway:http_error_ratio:rate30m
        expr: |
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[30m]))
          /
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[30m]))
      - record: gateway:http_error_ratio:rate1h
        expr: |
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[1h]))
          /
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[1h]))
      - record: gateway:http_error_ratio:rate2h
        expr: |
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[2h]))
          /
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[2h]))
      - record: gateway:http_error_ratio:rate6h
        expr: |
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[6h]))
          /
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[6h]))
      - record: gateway:http_error_ratio:rate1d
        expr: |
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[1d]))
          /
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[1d]))
      - record: gateway:http_error_ratio:rate3d
        expr: |
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics", status=~"5.."}[3d]))
          /
          sum(rate(http_request_duration_seconds_count{job="gateway", route!="/metrics"}[3d]))

  # ---- Multi-window multi-burn-rate alerts for a 99.9% availability SLO (error budget = 0.001) ----
  # burn rate N means "budget is being spent N times faster than the SLO period allows".
  - name: gateway-slo-burn
    rules:
      - alert: GatewayErrorBudgetBurnFast        # 14.4x for 1h burns 2% of a 30d budget -> PAGE
        expr: |
          gateway:http_error_ratio:rate1h > (14.4 * 0.001)
          and
          gateway:http_error_ratio:rate5m > (14.4 * 0.001)
        labels: { severity: page }
        annotations:
          summary: "Gateway burning error budget 14.4x (1h and 5m windows)"
          runbook: "https://wiki.example.com/runbooks/gateway-5xx"
      - alert: GatewayErrorBudgetBurnMedium      # 6x for 6h burns 5% of the budget -> PAGE
        expr: |
          gateway:http_error_ratio:rate6h > (6 * 0.001)
          and
          gateway:http_error_ratio:rate30m > (6 * 0.001)
        labels: { severity: page }
        annotations:
          summary: "Gateway burning error budget 6x (6h and 30m windows)"
      - alert: GatewayErrorBudgetBurnSlow        # 3x for 1d burns 10% -> TICKET
        expr: |
          gateway:http_error_ratio:rate1d > (3 * 0.001)
          and
          gateway:http_error_ratio:rate2h > (3 * 0.001)
        labels: { severity: ticket }
        annotations:
          summary: "Gateway burning error budget 3x (1d and 2h windows)"
      - alert: GatewayErrorBudgetBurnVerySlow    # 1x for 3d burns 10% -> TICKET
        expr: |
          gateway:http_error_ratio:rate3d > (1 * 0.001)
          and
          gateway:http_error_ratio:rate6h > (1 * 0.001)
        labels: { severity: ticket }
        annotations:
          summary: "Gateway burning error budget 1x (3d and 6h windows)"

  # ---- A latency SLI alert (symptom): p95 of the gateway above 1s ----
  - name: gateway-latency
    rules:
      - alert: GatewayLatencyP95High
        expr: |
          histogram_quantile(0.95,
            sum by (le) (rate(http_request_duration_seconds_bucket{job="gateway", route!="/metrics"}[5m]))
          ) > 1
        for: 10m
        labels: { severity: ticket }
        annotations:
          summary: "Gateway p95 latency above 1s for 10 minutes"

  # ---- Cause-based alert kept only as a low-severity hint (compare with the symptom alerts above) ----
  - name: gateway-causes
    rules:
      - alert: EventLoopLagHigh
        expr: nodejs_eventloop_lag_p99_seconds{job="gateway"} > 0.2
        for: 5m
        labels: { severity: ticket }
        annotations:
          summary: "Event loop p99 lag above 200ms"
```

Recording rules ka fayda: alert expression aur Grafana panel dono ek hi precomputed series use karte hain (ek jagah definition), aur 3-day rate har eval cycle par dobara compute nahi hota. Naming convention `level:metric:operations` (`gateway:http_error_ratio:rate5m`).

Honest limitation: yeh rules lab ke liye hain. Real production mein (1) `route!="/metrics"` jaise filters ke saath health checks bhi exclude karo, (2) low-traffic services par ratio noisy hota hai (1 request fail = 100% error): `and sum(rate(..._count[1h])) > 0.1` jaisa minimum-traffic guard lagao, (3) 4xx ko "bad events" mein mat ginna jab tak woh server ki galti na ho.

**Validate: `promtool check rules`** (container mein):

```text
$ docker run --rm --entrypoint promtool -v ".../prom:/p:ro" prom/prometheus:v2.55.1 check rules /p/rules/slo.yml
Checking /p/rules/slo.yml
  SUCCESS: 13 rules found
```

(13 = 7 recording + 4 burn + 1 latency + 1 event-loop.)

**Unit test the alerts: `promtool test rules`**. Sirf syntax check kaafi nahi: test batata hai ki alert **sahi waqt fire karta hai** aur galat waqt chup rehta hai. `prom/tests/slo_test.yml`:

```yaml
# FILE: prom/tests/slo_test.yml
rule_files:
  - ../rules/slo.yml

evaluation_interval: 1m

tests:
  # 1) Sustained 2% errors (burn rate 20x): the FAST alert must page.
  - interval: 1m
    input_series:
      - series: 'http_request_duration_seconds_count{job="gateway", route="/tasks/:id", status="200"}'
        values: '0+980x240'
      - series: 'http_request_duration_seconds_count{job="gateway", route="/tasks/:id", status="500"}'
        values: '0+20x240'
    alert_rule_test:
      - eval_time: 90m
        alertname: GatewayErrorBudgetBurnFast
        exp_alerts:
          - exp_labels: { severity: page }
            exp_annotations:
              summary: "Gateway burning error budget 14.4x (1h and 5m windows)"
              runbook: "https://wiki.example.com/runbooks/gateway-5xx"

  # 2) Sustained 1% errors (burn rate 10x): FAST (14.4x) stays quiet, MEDIUM (6x) pages.
  - interval: 1m
    input_series:
      - series: 'http_request_duration_seconds_count{job="gateway", route="/tasks/:id", status="200"}'
        values: '0+990x480'
      - series: 'http_request_duration_seconds_count{job="gateway", route="/tasks/:id", status="500"}'
        values: '0+10x480'
    alert_rule_test:
      - eval_time: 3h
        alertname: GatewayErrorBudgetBurnFast
        exp_alerts: []
      - eval_time: 3h
        alertname: GatewayErrorBudgetBurnMedium
        exp_alerts:
          - exp_labels: { severity: page }
            exp_annotations:
              summary: "Gateway burning error budget 6x (6h and 30m windows)"

  # 3) A 3-minute 20% blip after 2h of perfect traffic: short window is hot, long window is not -> NO page.
  - interval: 1m
    input_series:
      - series: 'http_request_duration_seconds_count{job="gateway", route="/tasks/:id", status="200"}'
        values: '0+800x240'
      - series: 'http_request_duration_seconds_count{job="gateway", route="/tasks/:id", status="500"}'
        values: '0x117 200 400 600 600x123'
    alert_rule_test:
      - eval_time: 121m
        alertname: GatewayErrorBudgetBurnFast
        exp_alerts: []
```

Teen scenarios: (1) sustained 2% errors (burn 20x) -> Fast page; (2) sustained 1% (burn 10x) -> Fast **quiet**, Medium page; (3) 3-minute 20% blip after 2 hours of clean traffic -> Fast **quiet** (short window hot, long window cold).

```text
$ docker run --rm --entrypoint promtool -v ".../prom:/p:ro" prom/prometheus:v2.55.1 test rules /p/tests/slo_test.yml
Unit Testing:  /p/tests/slo_test.yml
  SUCCESS
```

Mujhe pehle yeh test ek jagah fail hua tha: maine test 1 mein `eval_time: 30m` par expect kiya ki Fast alert chup rahega ("1h window abhi bhari nahi"). Result: **alert fire hua**, kyunki `rate()` available data par compute hota hai aur 30 minute ka data bhi 2% errors dikha raha tha. Yeh asal behaviour hai: burn-rate alerts naye deploy/naye service par bhi jaldi fire kar dete hain, jo aksar acha hai. Maine test se woh expectation hata di aur is paragraph mein likh diya. Lesson: rule tests apni samajh ko bhi test karte hain.

**Live check** (lab stack par): `load.js` ne ~7.7% errors diye (burn rate = 0.077 / 0.001 = ~77). Load ke turant baad Prometheus API `/api/v1/alerts` mein `GatewayErrorBudgetBurnFast` aur `GatewayErrorBudgetBurnMedium` firing the (page). Kuch minute baad, jab traffic ruk chuka tha, maine dobara dekha:

```text
$ curl -s localhost:9091/api/v1/alerts      (name, state, severity)
GatewayErrorBudgetBurnMedium     firing  page
GatewayErrorBudgetBurnSlow       firing  ticket
GatewayErrorBudgetBurnVerySlow   firing  ticket
```

Fast ab nahi hai: uski 5-minute window traffic rukne ke baad khali ho gayi, aur `and` ki wajah se alert apne aap band ho gaya. Yahi "short window = fast reset" ka live saboot hai. Grafana panel "Error budget burn" `gateway:http_error_ratio:rate1h / 0.001` se wahi burn-rate number dikhata hai.

### 3.4 Alertmanager: routing, grouping, inhibition

Prometheus alert *evaluate* karta hai; **Alertmanager** unhe group, dedupe, silence, route karta hai. `prom/alertmanager.yml`:

```yaml
# FILE: prom/alertmanager.yml
route:
  receiver: team-tickets            # default: low urgency
  group_by: [alertname, job]        # one notification per alert group, not one per series
  group_wait: 30s                   # wait to batch alerts that start together
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - matchers: [severity="page"]
      receiver: oncall-pager
      repeat_interval: 1h

receivers:
  - name: oncall-pager
    webhook_configs:
      - url: http://pager-bridge.internal/alert        # stand-in for PagerDuty/Opsgenie
  - name: team-tickets
    webhook_configs:
      - url: http://ticket-bridge.internal/alert       # stand-in for Slack channel / Jira

inhibit_rules:
  # If the fast page is firing, do not also ticket the slow-burn alert for the same job.
  - source_matchers: [severity="page"]
    target_matchers: [severity="ticket"]
    equal: [job]
```

Validated:

```text
$ amtool check-config /p/alertmanager.yml
Checking '/p/alertmanager.yml'  SUCCESS
Found: global config, route, 1 inhibit rules, 2 receivers, 0 templates

$ amtool config routes test --config.file=/p/alertmanager.yml severity=page alertname=X     -> oncall-pager
$ amtool config routes test --config.file=/p/alertmanager.yml severity=ticket alertname=X   -> team-tickets
```

(Alertmanager ko humne lab compose mein nahi chalaya; sirf config validate ki. Prometheus ko isse jodne ke liye `alerting:` block aur container chahiye, jo practical task hai.)

Key ideas: `group_by` (ek incident = ek notification), `group_wait` (shuru ke alerts batch), `repeat_interval` (reminder), `inhibit_rules` (page fire ho raha ho to usi job ka ticket suppress), silences (planned maintenance).

### 3.5 Alert quality checklist

1. Symptom hai? Threshold SLO se aata hai? (guess-number nahi)
2. `for:` ya multi-window se flapping rokta hai?
3. Runbook link annotation mein? Dashboard link?
4. Severity -> routing sahi (page vs ticket)?
5. Test hua (`promtool test rules`)? Kabhi fire hua tha (game day / chaos lab, file 16)?
6. Owner team label?
7. Alert delete karne ka rule: agar 3 mahine mein kabhi action nahi hua to hata do.

### Frontend connection

Frontend error tracking (Sentry) mein tum "error rate per release" dekhte ho aur release revert karte ho. SLO alert wahi cheez hai backend ke liye, aur burn rate = "yeh release kitni tezi se error budget kha raha hai". Feature flag kill-switch (Module 4) ka trigger yehi alert hai.

### Real-world scenario

Banking transfer service ka SLO 99.95% successful transfers (budget 0.05%). Release ke 20 minute baad 3% transfers timeout hone lage: burn = 0.03 / 0.0005 = 60. Fast alert 5-6 minute mein page karta hai; on-call dashboard dekhta hai, deploy marker se connect karta hai, rollback (Module 4) karta hai. Dusri taraf CPU 85% ka cause-based alert pehle mahine mein 11 baar fire hua aur har baar false positive tha: use ticket/dashboard mein downgrade kiya.

### Interview answer

**Interview answer:** "I alert on symptoms tied to SLOs, not on causes. For a 99.9% availability SLO the error budget is 0.1%, about 43 minutes a month, and I alert on how fast that budget burns. I use multi-window, multi-burn-rate rules: a burn rate of 14.4 over one hour confirmed by a five-minute window pages immediately, since that spends 2% of the monthly budget per hour; 6x over six hours also pages; 3x over a day and 1x over three days open tickets. The short window makes the alert reset quickly after recovery and the long window stops short blips from paging. I record the SLI as Prometheus recording rules, unit-test the alerts with promtool, route pages and tickets with Alertmanager, and attach a runbook to every page. Cause metrics like CPU live on dashboards for diagnosis."

### Follow-up questions

1. *99.9% ka matlab kitna downtime?* 43.2 minutes per 30 days; 99.99% sirf 4.32 minutes.
2. *SLO 100% kyun nahi?* Impossible aur mehnga; users ka apna network bhi 100% nahi; budget na ho to koi change ship nahi hoga.
3. *Error budget khatam hone par?* Feature releases freeze, reliability work, post-incident actions. Policy pehle se agree honi chahiye.
4. *Latency SLO kaise?* Threshold-based SLI: `requests faster than 300ms / total`, SLO 99% over 30d. Histogram bucket boundary 0.3 par honi chahiye (Module 1.4 ka trap).
5. *Low-traffic service par burn-rate alert?* Minimum traffic guard, ya synthetic probe se traffic generate karo, ya longer windows.
6. *Blackbox vs whitebox monitoring?* Whitebox = internal metrics. Blackbox = bahar se probe (`/health`, login flow). Dono chahiye: blackbox "user ke nazariye se up hai?" batata hai.
7. *Alert mein `for:` kab use karte ho?* Simple threshold alerts (latency, queue age) mein flapping rokne ke liye; burn-rate alerts mein windows already smoothing dete hain.

### Common mistakes

- CPU/memory par page karna.
- Average latency par alert.
- Sirf ek window (late reset ya noisy).
- Rule ko test na karna (typo = alert kabhi nahi fire hoga, aur kisi ko pata bhi nahi).
- Alert mein runbook/owner nahi.
- Health-check traffic ko SLI mein ginna (ratio bhaag jata hai).
- Alertmanager grouping na lagana (ek outage = 500 notifications).
- SLO number guess karna: usually pehle 2-4 hafte ka actual data dekho phir target do.

### Revision notes

- Symptom pages, cause tickets. SLI -> SLO -> budget -> burn rate.
- Burn tiers: 14.4x/1h+5m, 6x/6h+30m (page); 3x/1d+2h, 1x/3d+6h (ticket).
- Recording rules + `promtool check rules` + `promtool test rules`.
- Alertmanager: group, route, inhibit, silence.

**Key concepts to remember**

1. Budget = 1 - SLO; 99.9% = 43.2 min/30d; 30 000 failed requests per 30M.
2. Burn rate = error ratio / budget fraction.
3. Two windows = significance + fast reset.
4. Test alerts like code.
5. Page vs ticket is a routing decision made from user impact.

**Revision questions**

1. Compute the error budget in minutes and in requests for a 99.95% SLO, 20M requests/month.
2. A service with a clean history has a steady 0.5% error ratio (burn rate 5) for 6 hours. Which tiers of the 99.9% rules fire, and after how long would the first ticket fire?
3. Why `and` between a long and a short window?
4. Why is "CPU > 80% for 5m" a poor page?
5. What did my first `eval_time: 30m` test teach about `rate()` on a partially filled window?

**Practical task**

Write a latency SLI recording rule (`fraction of gateway requests under 0.5 s`, using the `le="0.5"` bucket) and a burn-rate alert for a 99% latency SLO. Add a promtool unit test with synthetic bucket series that makes it fire and one that keeps it quiet. Then add Alertmanager to `docker-compose.yml`, connect Prometheus via an `alerting:` block, and watch the page route in the Alertmanager UI while `load.js` runs.

**Checklist**

- [ ] I can compute a monthly error budget in minutes and in requests.
- [ ] I can derive 14.4 and 2% from scratch.
- [ ] `promtool check rules` and `promtool test rules` both pass on my machine.
- [ ] I can explain page vs ticket with one example of each.
- [ ] I know three ways alerting goes wrong (fatigue, no test, no runbook).

---

## Module 4 - CI/CD with GitHub Actions and deployment strategies `[ESSENTIAL]`

**Learning objectives**

- CI vs continuous delivery vs continuous deployment; ek achhi pipeline ke stages aur unka order.
- Task API ke liye real workflow: lint, test (MySQL service container), Docker image build + smoke test, staging -> production deploy gate.
- Workflow ko `actionlint` se validate karna aur samajhna ki wo kya pakadta hai (aur kya nahi).
- Rolling, blue/green, canary, feature flags, rollback: kab kaun sa, aur database migrations ka khatra.
- CI mein secrets/permissions ka least-privilege use (GITHUB_TOKEN permissions, OIDC).

Estimated time: 2 hours. Cross-reference: Dockerfile + `docker-compose.yml` Project Task API **Extension C** mein hai; deployment outline **Extension D** mein; graceful shutdown + readiness Week 6 / Day 5 notes. Ye module unko ek automated pipeline mein jodta hai.

### 4.1 Concepts

| Term | Meaning |
|------|---------|
| **CI** (continuous integration) | Har push/PR par automatically build + lint + test. Goal: main branch hamesha green |
| **Continuous delivery** | Har green main commit ek **deployable artifact** hai; deploy ek button/approval hai |
| **Continuous deployment** | Green commit apne aap production tak chala jata hai (no human) |
| **Artifact** | Immutable output (Docker image tagged with the git SHA). "Build once, deploy the same artifact everywhere" |

Pipeline order ka rule: **sasta aur tez pehle** (lint, unit tests), mehnga baad mein (integration, image build), risky sabse last (deploy). Fail-fast: pehla fail pipeline rok de.

Gate types: automated (tests green, smoke test pass), manual approval (GitHub Environment "required reviewers"), time-based (no Friday deploys), metric-based (canary analysis; Module 3 ke SLO alerts se link).

### 4.2 The workflow

Task API (Project Task API, Express 5 + MySQL + Vitest) ke liye `.github/workflows/ci.yml`. Assumptions jo tumhare repo mein honi chahiye: `package-lock.json` committed, scripts `lint` aur `test` in `package.json`, Dockerfile root par (Extension C), aur `scripts/deploy.sh` / `scripts/rollback.sh` (nahi hain to tumhe likhni hongi: neeche samjhaya hai).

```yaml
# FILE: .github/workflows/ci.yml
name: ci

on:
  pull_request:
  push:
    branches: [main]

# One run per branch/PR: a new push cancels the older in-progress run (saves minutes).
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

# Least privilege: the default token can only read the repo. Jobs ask for more when they need it.
permissions:
  contents: read

env:
  NODE_VERSION: "22"
  IMAGE_NAME: ghcr.io/${{ github.repository }}

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm                 # caches ~/.npm keyed on package-lock.json
      - run: npm ci
      - run: npm run lint
      - name: Audit production dependencies
        run: npm audit --omit=dev --audit-level=high

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      mysql:
        image: mysql:8.4
        env:
          MYSQL_ROOT_PASSWORD: root
        ports:
          - 3306:3306
        # The job waits until this passes, so tests never start against a booting database.
        options: >-
          --health-cmd="mysqladmin ping -h 127.0.0.1 -uroot -proot --silent"
          --health-interval=5s
          --health-timeout=5s
          --health-retries=20
    env:
      TEST_DB_HOST: 127.0.0.1
      TEST_DB_PORT: "3306"
      TEST_DB_USER: root
      TEST_DB_PASSWORD: root
      TEST_DB_NAME: task_api_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - name: Run unit + integration tests
        run: npm test -- --reporter=default --coverage
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
          retention-days: 7

  build-image:
    needs: [lint, test]               # never build a release candidate from red code
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      packages: write                 # only this job may push to ghcr.io
    outputs:
      tag: ${{ steps.meta.outputs.sha_tag }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - id: meta
        run: echo "sha_tag=sha-${GITHUB_SHA::12}" >> "$GITHUB_OUTPUT"
      - name: Build (load into local daemon for a smoke test)
        uses: docker/build-push-action@v6
        with:
          context: .
          load: true
          tags: ${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.sha_tag }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Smoke test the image
        run: |
          docker run --rm "$IMAGE_NAME:${{ steps.meta.outputs.sha_tag }}" node --version
          test "$(docker run --rm "$IMAGE_NAME:${{ steps.meta.outputs.sha_tag }}" id -u)" != "0"   # must not run as root
      - name: Log in to GHCR
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Push (main only)
        if: github.ref == 'refs/heads/main'
        run: docker push "$IMAGE_NAME:${{ steps.meta.outputs.sha_tag }}"

  deploy-staging:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: build-image
    runs-on: ubuntu-latest
    environment: staging
    concurrency: { group: deploy-staging, cancel-in-progress: false }   # never abort a half-finished deploy
    permissions:
      contents: read
      id-token: write                 # lets the job exchange a GitHub OIDC token for short-lived AWS credentials
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}   # no long-lived access keys stored in GitHub
          aws-region: ${{ vars.AWS_REGION }}
      - name: Deploy ${{ needs.build-image.outputs.tag }} to staging
        run: ./scripts/deploy.sh staging "${{ needs.build-image.outputs.tag }}"
      - name: Post-deploy smoke test
        run: curl --fail --silent --retry 10 --retry-delay 6 --retry-connrefused "${{ vars.STAGING_URL }}/health"

  deploy-production:
    needs: [build-image, deploy-staging]
    runs-on: ubuntu-latest
    environment: production           # configure "Required reviewers" on this environment = manual approval gate
    concurrency: { group: deploy-production, cancel-in-progress: false }
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}
      - name: Deploy ${{ needs.build-image.outputs.tag }} to production
        run: ./scripts/deploy.sh production "${{ needs.build-image.outputs.tag }}"
      - name: Post-deploy smoke test (rollback on failure)
        run: |
          if ! curl --fail --silent --retry 10 --retry-delay 6 --retry-connrefused "${{ vars.PRODUCTION_URL }}/health"; then
            ./scripts/rollback.sh production
            exit 1
          fi
```

Har hisse ka reason:

| Part | Why |
|------|-----|
| `permissions: contents: read` at top | `GITHUB_TOKEN` ko default se least privilege; sirf jis job ko zarurat ho woh bada permission le (`packages: write`, `id-token: write`) |
| `concurrency` | Ek hi branch par nayi push purani in-progress run ko cancel kare (PR par). Deploy jobs mein `cancel-in-progress: false`: aadhi deploy ko kabhi abort nahi karte |
| `cache: npm` | `package-lock.json` hash par `~/.npm` cache; `npm ci` (not `npm install`) lockfile se reproducible install |
| `services.mysql` + `--health-cmd` | Job tab shuru hota hai jab MySQL healthy ho; tests ek real MySQL 8.4 par chalte hain (Week 5 / Day 1 ki tarah mocks nahi). Env `TEST_DB_*` wohi hain jo `vitest.config.js` (Project Task API Stage 6) padhta hai |
| `needs: [lint, test]` | Image tabhi bane jab code green ho |
| `docker/build-push-action` with `load: true` | Pehle local daemon mein load, **smoke test** (Node version, non-root user), phir push. Push sirf `main` par |
| Tag = `sha-<12 chars>` | Immutable, traceable tag. `latest` par deploy mat karo (kya chal raha hai pata nahi, rollback ambiguous) |
| `environment: staging / production` | GitHub Environments: protection rules (required reviewers), environment-specific secrets/vars. **Production approval gate yahin se aata hai** |
| `id-token: write` + `configure-aws-credentials` with `role-to-assume` | OIDC: GitHub har run ke liye short-lived signed token deta hai, AWS us par IAM role assume karne deta hai. Repo mein koi long-lived `AWS_ACCESS_KEY_ID` secret nahi (Module 5 mein trust policy) |
| Post-deploy `curl --retry` on `/health` | Deploy "command succeeded" != "app healthy". Smoke test fail to production job rollback script chalata hai |

`scripts/deploy.sh` kya karega yeh tumhare target par depend karta hai (ECS `update-service`, `docker compose pull && up -d` over SSH, Kubernetes `kubectl set image`). Isliye mene yeh script workflow mein as a contract rakhi hai: **`deploy.sh <env> <image-tag>`**, aur rollback ka contract **`rollback.sh <env>`** jo pichli known-good tag wapas lagaye.

Lint config (`eslint.config.js`, flat config, ESLint 9; install: `npm i -D eslint@9 @eslint/js@9 globals@15`) aur script `"lint": "eslint ."`:

```js
// FILE: eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  { ignores: ['node_modules/', 'coverage/'] },
];
```

### 4.3 What I validated (and what I did not)

**`actionlint` (static checker for workflow YAML, expressions, action inputs, `needs` graph, shellcheck on `run:` blocks)** -- container mein:

```text
$ docker run --rm -v ".../.github/workflows:/w:ro" rhysd/actionlint:latest /w/ci.yml
(no output)            exit=0
```

Negative control (maine jaan-boojh kar do galtiyan daali: `needs: [lint, tests]` aur checkout par `with: { depth: 1 }`):

```text
w/ci.yml:27:17: input "depth" is not defined in action "actions/checkout@v4". available inputs are "clean", "fetch-depth", ... [action]
w/ci.yml:77:3: job "build-image" needs job "tests" which does not exist in this workflow [job-needs]
exit=1
```

Yaani actionlint typo wale input aur broken dependency graph pakadta hai.

Maine yeh bhi chalaya (workflow ke har piece ko alag-alag ek real stand-in par):

1. **MySQL health command**: `mysql:8.4` container ko exactly wahi `--health-cmd="mysqladmin ping -h 127.0.0.1 -uroot -proot --silent"` flags ke saath chalaya. Docker ne status `starting` x8 ke baad `healthy` dikhaya (lagbhag 30-40 seconds). Yaani service-container options sahi hain.
2. **Docker build + smoke test**: Project Task API ka source is folder mein nahi tha, isliye maine ek multi-stage Dockerfile (same shape as Extension C: `npm ci --omit=dev`, `USER node`, `node:22-alpine`) lab app par build kiya (`Dockerfile.ci-demo`):

```dockerfile
# FILE: Dockerfile.ci-demo
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/tasks-service.js"]
```

   ```text
   $ docker build -f Dockerfile.ci-demo -t obs-ci-demo:sha-test .       -> built
   $ docker run --rm obs-ci-demo:sha-test node --version                -> v22.23.3
   $ docker run --rm obs-ci-demo:sha-test id -u                         -> 1000
   $ docker run --rm obs-ci-demo:sha-test sh -c 'test "$(id -u)" != "0" && echo non-root-ok'   -> non-root-ok
   ```
3. **ESLint 9 flat config**: `npx eslint .` lab ke saare files par exit 0; ek file jisme `const unused = 1;` tha par `error 'unused' is assigned a value but never used  no-unused-vars`, exit 1 -- yaani lint step CI ko sach mein fail karega.

**Not verified:** workflow GitHub par run nahi hua (mere paas repo/runner nahi); `actions/*` versions (v4/v5/v6) ka actual behaviour; GHCR push; OIDC role assumption; `deploy.sh`/`rollback.sh` (maine likhi nahi, kyunki target environment ke bina meaningless hain); `npm test` Task API ke source ke bina. In sab ke liye `actionlint` + upar ke piece-wise tests hi evidence hain, "workflow run green" ka claim nahi.

Hardening notes `[ADVANCED]`:

- Third-party actions ko major tag (`@v4`) ki jagah full commit SHA se pin karo (supply-chain). Dependabot actions ke versions update karwa deta hai.
- `pull_request` workflows fork se aaye code ko secrets nahi dete: yeh feature hai. `pull_request_target` (secrets ke saath, base-branch context) khatarnak hai agar tum PR ka code checkout karke chalao.
- `${{ github.event.pull_request.title }}` jaise attacker-controlled values ko `run:` mein seedha interpolate mat karo (script injection): `env:` ke through pass karo. Humare workflow mein sirf trusted values (`vars.*`, SHA output) hain.
- `npm audit --omit=dev --audit-level=high` ek basic gate hai; Dependabot/Renovate + container scanning (Trivy) alag layer hain.

### 4.4 Deployment strategies

Sabka common goal: **naya version bina user ko dikhe dikkat ke chalana, aur kuch galat ho to jaldi wapas aana.**

| Strategy | How | Pros | Cons | Use when |
|----------|-----|------|------|----------|
| **Recreate** | Purane sab band, naye start | Simplest | Downtime | Dev, batch jobs |
| **Rolling** | Instances ko ek-ek (ya batch mein) naye version se replace | No extra capacity, default in ECS/Kubernetes | Mixed versions kuch der chalte hain; rollback bhi rolling (dheema) | Default for stateless services |
| **Blue/green** | Poori nayi fleet ("green") purani ("blue") ke saath chalao, test karo, phir traffic ek switch se green par. Blue ko ready rakho | Instant rollback (switch wapas), full pre-prod test on prod infra | 2x capacity temporarily, DB compat chahiye | High-stakes releases, instant-rollback requirement |
| **Canary** | Naye version ko 1% -> 5% -> 25% -> 100% traffic, har step par metrics dekho | Real traffic par risk chhota, automatic rollback on SLO burn | Complex routing + metrics analysis | Large user base, risky change |
| **Feature flags** | Code deploy ho gaya lekin feature ek runtime switch ke peeche off. Deploy aur release alag | Instant kill switch, % rollout, targeting | Flag debt, testing combinations | Almost always; complements all above |

**Canary routing example** (nginx weights; `nginx -t` se config syntax validate kiya, traffic split maine measure nahi kiya):

```nginx
# FILE: nginx/canary.conf
upstream task_api {
    server api_stable:3000 weight=95;   # current release
    server api_canary:3000 weight=5;    # new release gets ~5% of requests
}
server {
    listen 80;
    location / {
        proxy_pass http://task_api;
        proxy_next_upstream error timeout http_502 http_503;
    }
}
```

```text
$ docker run --rm --add-host api_stable:127.0.0.1 --add-host api_canary:127.0.0.1 \
    -v ".../canary.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Canary ka asli kaam "analysis" hai: canary ke metrics (error ratio, p95) stable ke metrics se compare karo (Module 1 ke `sum by (version)(...)` queries; ek `version` label add karna padega). Burn-rate alert (Module 3) agar canary ke liye fire ho to automatic rollback.

**Blue/green** ka switch kahan hota hai: load balancer target group (ALB listener rule ko green target group par), DNS weight (slow: TTL cache), ya reverse-proxy upstream. Application-level requirement: dono versions **same database** par chalenge, isliye migrations backward compatible hone chahiye (neeche).

**Feature flags** -- chhota, runnable sketch (`src/flags.js`): percentage rollout hash se stable bucket deta hai, allow-list QA ke liye, aur `enabled: false` kill switch hai:

```js
// FILE: src/flags.js
import { createHash } from 'node:crypto';

// Flag config would normally come from a DB/config service so you can change it WITHOUT a deploy.
export const flags = {
  'new-checkout': { enabled: true, rolloutPercent: 10, allowUsers: ['qa-1'] },
  'legacy-export': { enabled: false },
};

// Stable bucket 0..99 per (flag, user): the same user always gets the same answer, and
// raising 10 -> 25 only ADDS users (nobody flips back and forth).
function bucket(flag, userId) {
  const h = createHash('sha256').update(`${flag}:${userId}`).digest();
  return h.readUInt32BE(0) % 100;
}

export function isEnabled(flag, userId) {
  const f = flags[flag];
  if (!f || !f.enabled) return false;                 // unknown or killed flag -> off (the kill switch)
  if (f.allowUsers?.includes(userId)) return true;
  return bucket(flag, userId) < (f.rolloutPercent ?? 100);
}
```

```js
// FILE: src/flags-demo.js
import { flags, isEnabled } from './flags.js';

const count = () => {
  let n = 0;
  for (let i = 0; i < 10000; i++) if (isEnabled('new-checkout', `user-${i}`)) n++;
  return n;
};
console.log('rollout 10%  ->', count(), 'of 10000 users');
console.log('qa-1 (allow-list):', isEnabled('new-checkout', 'qa-1'), '| legacy-export (disabled):', isEnabled('legacy-export', 'user-1'));

const before = new Set();
for (let i = 0; i < 10000; i++) if (isEnabled('new-checkout', `user-${i}`)) before.add(i);
flags['new-checkout'].rolloutPercent = 25;
let kept = 0;
let total = 0;
for (let i = 0; i < 10000; i++) if (isEnabled('new-checkout', `user-${i}`)) { total++; if (before.has(i)) kept++; }
console.log('rollout 25%  ->', total, 'users; of the earlier', before.size, 'users still enabled:', kept);

flags['new-checkout'].enabled = false;                // the kill switch: one config change, no deploy
console.log('kill switch  -> user-1 enabled?', isEnabled('new-checkout', 'user-1'));
```

```text
$ node src/flags-demo.js
rollout 10%  -> 1020 of 10000 users
qa-1 (allow-list): true | legacy-export (disabled): false
rollout 25%  -> 2466 users; of the earlier 1020 users still enabled: 1020
kill switch  -> user-1 enabled? false
```

Observe: 10% rollout ~ 1020 users; 25% par pehle wale **sab 1020 users bane rahe** (kisi ka experience flip-flop nahi hota), aur kill switch ek config change hai, deploy nahi. Production mein flags ko DB/Redis/LaunchDarkly/Unleash jaisi service se laate hain, process memory ke hardcoded object se nahi.

### 4.5 Rollbacks and the database problem

**Rollback ek first-class operation hai, "emergency hack" nahi.** Requirements:

1. Previous artifact available (immutable SHA tag; registry retention policy usse delete na kare).
2. Ek command/button jo bina code change ke pichli known-good tag deploy kare (`rollback.sh`).
3. Rollback ka **practice** (staging mein, aur chaos lab file 16 mein game day).
4. Alerting ka link: Module 3 fast-burn page -> on-call ka pehla move rollback/flag-off, root-cause baad mein (mitigate first).

**Database migrations break rollbacks.** Naya code kolom `status_v2` maangta hai, rollback par purana code chalta hai lekin schema badal chuka. Isliye **expand/contract (parallel change)**:

| Step | Deploy | Schema change | Safe to roll back? |
|------|--------|---------------|--------------------|
| 1. Expand | Migration pehle | Add nullable column / new table (purana code ignore karta hai) | Yes |
| 2. Dual-write | Code writes old + new | none | Yes |
| 3. Backfill | Script | Fill new column for old rows (batches) | Yes |
| 4. Switch reads | Code reads new | none | Yes (old column still written) |
| 5. Contract | Later release | Drop old column | **No** -- point of no return, isolated in its own release |

Rules: migrations alag job/step mein (Extension C ka `migrate` service), kabhi bhi app boot par har instance se race karke nahi (lock: `GET_LOCK`, Week 4 Day 5 notes ke locking section ka idea), aur kabhi ek release mein "rename column" jaisa breaking change nahi.

**Graceful shutdown ka rollout se rishta**: rolling/blue-green mein purani instances ko `SIGTERM` milta hai. Agar app in-flight requests complete nahi karti to har deploy par user ko 502 milte hain. Readiness fail karo, connections drain karo, phir exit (Week 6 / Day 5 notes). Yeh deploy-under-load test chaos lab mein bhi hai.

### Frontend connection

Tumhare frontend deploy (Vercel/Netlify) mein "preview deployments", "instant rollback to previous deployment" aur "feature flags via env/config" pehle se mile hue the. Backend ke wahi concepts hain: preview = staging environment per PR, instant rollback = blue/green switch, flags = same flags. Ek naya constraint: backend ke peeche **shared state** (database) hota hai, isliye frontend jaisa free rollback nahi; isliye expand/contract.

### Real-world scenario

Payments service release: Day 1 deploy new retry logic behind flag `psp-retry-v2` (0%). Staging smoke pass. Production: 1% (canary users, internal accounts) for 1 hour, SLO burn dashboard flat; 10%, 50%, 100% over 2 days. Day 2 at 50% the PSP timeout rate spikes: burn alert pages, on-call flips the flag to 0% (30 seconds, no deploy), investigation later. Without the flag it would be a rollback deploy of ~10 minutes while payments fail.

### Interview answer

**Interview answer:** "Our pipeline runs lint and a dependency audit, then integration tests against a real MySQL service container, then builds one immutable Docker image tagged with the commit SHA, smoke-tests it, and pushes it from main only. Deploy goes to staging automatically and to production behind a GitHub Environment approval gate, using OIDC so there are no long-lived cloud keys, and finishes with a health-check smoke test that triggers rollback on failure. For rollout I prefer rolling deployments with readiness probes and graceful shutdown for ordinary releases, canary or blue/green for risky ones, and feature flags to separate deploy from release. Rollback is a tested, one-command operation to the previous image tag, and database changes follow expand/contract so the old version still works against the new schema."

### Follow-up questions

1. *Blue/green vs canary?* Blue/green = all-or-nothing switch with instant rollback, 2x capacity. Canary = gradual exposure with metric analysis, smaller blast radius. Canary needs good observability.
2. *Rolling update mein 502 kyun aate hain?* Instance ko traffic milte hue kill ho gayi: readiness/draining/`SIGTERM` handling aur LB deregistration delay missing.
3. *`npm ci` vs `npm install`?* `ci` lockfile exactly follow karta hai, `node_modules` delete karke clean install, mismatch par fail. CI/Docker ke liye sahi.
4. *Secrets CI mein kaise?* Environment/repo secrets (masked in logs), OIDC for cloud, never in the image or repo. Fork PRs ko secrets nahi milte.
5. *Flaky tests ka kya?* Quarantine + fix; retry-on-fail chhupata hai. Common causes: shared DB state, time, ordering, random ports.
6. *Monorepo mein sab kuch kyun run na ho?* Path filters (`on.push.paths`) ya affected-graph tools.
7. *Image tag `latest` kyun nahi?* Mutable: pata nahi kaun sa code chal raha hai, rollback target undefined, nodes alag versions pull kar sakte hain.
8. *Trunk-based vs gitflow?* Trunk-based (short-lived branches, flags) CI/CD ke saath fit hota hai; long-lived branches merge hell + late integration.

### Common mistakes

- Production DB secrets ya cloud keys repo/CI variables mein long-lived rakhna (OIDC use karo).
- Tests ko mocks par chalana jab real service container asani se mil sakta hai.
- Har job ko `contents: write` jaise broad token permission.
- Deploy ke baad health check na karna.
- Rollback ko kabhi practice na karna.
- Migration ko app start par har instance se chalana, ya breaking schema change ek release mein.
- Flag ko kabhi clean up na karna.
- Build ko deploy ke time dobara karna (environments ke beech alag artifact).

### Revision notes

- CI = build+test every push; CD = artifact + gated deploy; build once, promote the same SHA.
- `needs`, `services`, `environment`, `concurrency`, `permissions`: five workflow keys to know.
- Rolling (default), blue/green (instant rollback), canary (metrics-gated), flags (deploy != release).
- Expand/contract for DB; rollback is a drilled operation; mitigate first.

**Key concepts to remember**

1. Immutable artifact tagged by SHA; same image to every environment.
2. GitHub Environments give approval gates and scoped secrets.
3. OIDC replaces stored cloud keys.
4. Strategy trade-offs: capacity, speed of rollback, blast radius, complexity.
5. Database compatibility decides whether rollback is possible.

**Revision questions**

1. Why is `docker push` restricted to `main` in the workflow, and which permission does the job need?
2. Explain the 5-step expand/contract for renaming `tasks.status` to `tasks.state`.
3. How would a canary use the Module 3 burn-rate alert to roll back automatically?
4. What does `--health-cmd` on a service container give you that `sleep 30` does not?
5. Why does raising a flag rollout from 10% to 25% via a hash bucket keep earlier users enabled?

**Practical task**

Copy `ci.yml` into a scratch GitHub repo that contains a trivial Express app (+ Dockerfile, `lint`, `test` scripts, stub `deploy.sh` that just echoes). Make a PR, watch lint/test/build run; merge; add a required-reviewer rule on the `production` environment and observe the pause. Write down what you changed vs this file.

**Checklist**

- [ ] I can draw the pipeline (lint/test -> build -> staging -> approval -> production) from memory.
- [ ] I ran `actionlint` on the workflow and fixed at least one deliberate error.
- [ ] I can explain blue/green vs rolling vs canary with one trade-off each.
- [ ] I can explain expand/contract and why dropping a column is a point of no return.
- [ ] I know why the production job uses OIDC and a protected environment.

---

## Module 5 - Cloud basics with AWS as the worked example `[ESSENTIAL]`

**Learning objectives**

- IAM: users vs roles, least privilege, policy evaluation, ek real least-privilege policy likhna.
- VPC: subnets (public/private), route tables, IGW/NAT, security groups vs NACLs, 3-tier layout.
- RDS (managed MySQL): Multi-AZ vs read replica, backups, private placement, connection-limit math.
- S3 + presigned URLs, Secrets Manager, autoscaling, CDN (CloudFront), aur cost awareness.
- Cloud-agnostic mapping (GCP/Azure) taaki ek provider "deeply" sikhne ka roadmap goal poora ho.

Estimated time: 2 hours (reading) + 30 minutes (LocalStack lab).

**IMPORTANT -- honesty box (what is and is not verified in this module)**

| Part | Status |
|------|--------|
| Sab `aws ...` CLI commands aur architecture steps | **NOT executed.** Mere paas AWS account nahi hai. Syntax accuracy ke liye maine apne knowledge par bharosa kiya hai; real use se pehle `aws <service> <command> help` se flags confirm karo, aur har cheez ke liye AWS pricing page dekho |
| JSON policy / trust / scaling / CORS documents | **Syntax validated** (`JSON.parse`), aur IAM policy + trust documents LocalStack ke IAM API ne accept kiye. Real AWS validation zyada strict hai (jaise valid principals/ARNs, account id) |
| S3 presigned URLs, Secrets Manager read, IAM policy/role creation via SDK | **Executed against LocalStack** (AWS ka local emulator), real AWS nahi. LocalStack community **IAM policies enforce nahi karta**, to "permission denied" behaviour yahan test nahi hua |
| Prices, quotas, defaults (e.g. RDS max_connections, free tier) | Bataye nahi gaye ya "check karo" likhe gaye; woh badalte rehte hain |

Cross-reference: file upload architecture (presigned URL ka design) Week 7 / Day 3 notes; secrets mistakes Week 5 / Day 6 notes; Docker/deploy Week 7 / Day 6 notes; DB replication/pool sizing file 14 (Database Internals).

### 5.1 The big picture (what we are building)

```
                          Internet
                             |
                     Route 53 (DNS)
                             |
                  CloudFront (CDN, TLS)  <---- S3 (static/uploads, private, via OAC)
                             |
   VPC 10.0.0.0/16           v
  +-----------------------------------------------------------------------+
  |  public subnets (2 AZs)      : ALB, NAT gateway                       |
  |  private-app subnets (2 AZs) : ECS/Fargate tasks running Task API     |
  |  private-data subnets (2 AZs): RDS MySQL (Multi-AZ), ElastiCache      |
  +-----------------------------------------------------------------------+
   IAM roles (task role, execution role, deploy role via OIDC)
   Secrets Manager (DB credentials, JWT secret)   CloudWatch (logs, alarms)
```

Provider mapping (agar GCP/Azure par interview ho):

| Concept | AWS | GCP | Azure |
|---------|-----|-----|-------|
| Identity & access | IAM (roles, policies) | IAM (service accounts, roles) | Entra ID + RBAC (managed identities) |
| Private network | VPC | VPC | VNet |
| Managed MySQL | RDS / Aurora | Cloud SQL | Azure Database for MySQL |
| Object storage | S3 | Cloud Storage | Blob Storage |
| Secrets | Secrets Manager | Secret Manager | Key Vault |
| Containers (serverless) | ECS Fargate | Cloud Run | Container Apps |
| CDN | CloudFront | Cloud CDN | Front Door / CDN |
| Autoscaling | Application Auto Scaling / ASG | Cloud Run autoscaler / MIG | VMSS / Container Apps scaling |

### 5.2 IAM: identity and access `[ESSENTIAL]`

**Concept**

IAM decide karta hai **kaun (principal) kis resource par kaunsa action kar sakta hai**.

| Term | Meaning |
|------|---------|
| Principal | Jo request kar raha hai: IAM user, IAM role, AWS service, federated identity |
| Policy | JSON document: `Effect`, `Action`, `Resource`, optional `Condition` |
| **User** | Long-lived identity with long-lived credentials (access key). Insaan ke liye aur woh bhi aajkal SSO/Identity Center preferred |
| **Role** | Credentials-less identity jo koi **assume** karta hai aur short-lived temporary credentials (STS) milte hain. Apps, services, CI ke liye |
| Trust policy | Role ke saath attach: **kaun** ise assume kar sakta hai |
| Permissions policy | Role ko assume karne ke baad **kya** kar sakta hai |

**Roles vs users** (interview ka favourite): application code ko IAM user ke access keys mat do (`.env` mein leak, rotation nahi, audit mushkil). Role do: ECS task role / EC2 instance profile / Lambda execution role; SDK credentials automatically temporary milte hain aur rotate hote hain. CI ke liye OIDC role (Module 4) -- GitHub ko koi stored key nahi.

**Policy evaluation (simplified)**: default = **implicit deny**. Explicit `Allow` chahiye. Explicit `Deny` kisi bhi Allow ko override karta hai. Organization SCPs aur permission boundaries upar se limit lagate hain `[ADVANCED]`.

**Least privilege** ka matlab: sirf wohi actions, sirf wohi resources. `"Action": "*", "Resource": "*"` ya `AmazonS3FullAccess` app ko dena sabse common galti hai. Task API ke app role ke liye real example (`aws/task-api-app-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AttachmentsReadWriteOwnPrefixOnly",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::task-attachments-demo/tasks/*"
    },
    {
      "Sid": "ReadOnlyTheAppSecrets",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-south-1:123456789012:secret:task-api/prod/*"
    }
  ]
}
```

Yeh role sirf bucket ke `tasks/` prefix mein read/write kar sakta hai (bucket delete, list, doosre prefixes nahi) aur sirf `task-api/prod/*` secrets padh sakta hai (create/delete nahi).

Trust policy -- ECS task ke liye (task container yeh role assume karta hai):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Trust policy -- GitHub Actions OIDC ke liye (Module 4 ka deploy role). `sub` condition **zaroori** hai: iske bina koi bhi GitHub repo tumhara role assume kar sakta hai:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/task-api:environment:production"
        }
      }
    }
  ]
}
```

CLI (**not executed**):

```bash
# create the role the ECS task assumes, then attach the least-privilege policy
aws iam create-role --role-name task-api-task-role \
  --assume-role-policy-document file://aws/trust-ecs-tasks.json
aws iam create-policy --policy-name task-api-app \
  --policy-document file://aws/task-api-app-policy.json
aws iam attach-role-policy --role-name task-api-task-role \
  --policy-arn arn:aws:iam::123456789012:policy/task-api-app

# who am I right now? (first debugging step for "AccessDenied")
aws sts get-caller-identity
```

Do roles ECS mein: **execution role** (ECS agent ke liye: image pull ECR se, logs CloudWatch ko, secrets fetch karke inject) vs **task role** (tumhara application code S3/SecretsManager call karta hai). Interview mein confuse hota hai.

Debugging AccessDenied: (1) `sts get-caller-identity` -- kaun sa principal? (2) Policy mein action/resource match? (3) Resource policy (bucket policy) ya SCP deny? (4) Condition keys? (5) CloudTrail mein denied event. IAM Access Analyzer / policy simulator tools hain.

### 5.3 VPC, subnets, security groups `[ESSENTIAL]`

**Concept**

VPC = tumhara private virtual network (CIDR range, jaise `10.0.0.0/16` = 65 536 IPs). Isko **subnets** mein baanto (har subnet ek Availability Zone mein, jaise `10.0.1.0/24`).

| Piece | Role |
|-------|------|
| Public subnet | Route table mein `0.0.0.0/0 -> Internet Gateway (IGW)`. Internet-facing cheezein: ALB, NAT gateway |
| Private subnet | Internet se **seedha reachable nahi**. App tasks, databases. Outbound internet ke liye route `0.0.0.0/0 -> NAT gateway` (public subnet mein) |
| Internet Gateway | VPC <-> internet (two-way) |
| NAT Gateway | Private subnet se **outbound only** (e.g. npm registry, third-party API). Paid per hour + per GB, cost trap (5.9) |
| Route table | Subnet ke traffic ka rasta |
| VPC endpoint | Private connectivity to AWS services. S3/DynamoDB ke liye **gateway endpoint** NAT ke bina (aur free hota hai, check pricing) |

**Security group (SG) vs NACL**

| | Security group | Network ACL |
|---|----------------|-------------|
| Level | ENI/instance/task | Subnet |
| State | **Stateful** (reply apne aap allowed) | **Stateless** (inbound + outbound dono rules) |
| Rules | Allow only | Allow + deny, numbered order |
| Default | Inbound deny all, outbound allow all | Default NACL sab allow |
| Use | Primary tool | Extra coarse layer (e.g. block an IP range) |

**Golden pattern: SG ko SG se refer karo, IP se nahi**

```
alb-sg  : inbound 443 from 0.0.0.0/0
app-sg  : inbound 3000 from alb-sg        (only the load balancer can reach the app)
db-sg   : inbound 3306 from app-sg        (only the app can reach MySQL)
```

DB ka koi public IP nahi, internet se port 3306 band, aur sirf app tier andar jaa sakta hai. Yeh MySQL ko "internet par khula" hone se bachata hai (Week 5 / Day 6 notes ki common production security mistakes).

CLI skeleton (**not executed**; `$VAR` values previous command ke output se aate hain):

```bash
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query Vpc.VpcId --output text)
aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames

# one public + one private subnet per AZ (repeat for ap-south-1b with 10.0.2.0/24 and 10.0.12.0/24)
PUB_A=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.1.0/24  --availability-zone ap-south-1a --query Subnet.SubnetId --output text)
APP_A=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.11.0/24 --availability-zone ap-south-1a --query Subnet.SubnetId --output text)

# internet access for the public subnet
IGW=$(aws ec2 create-internet-gateway --query InternetGateway.InternetGatewayId --output text)
aws ec2 attach-internet-gateway --internet-gateway-id "$IGW" --vpc-id "$VPC_ID"
RT_PUB=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --query RouteTable.RouteTableId --output text)
aws ec2 create-route --route-table-id "$RT_PUB" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW"
aws ec2 associate-route-table --route-table-id "$RT_PUB" --subnet-id "$PUB_A"

# NAT gateway (lives in the PUBLIC subnet, serves the private ones) -- costs money while it exists
EIP=$(aws ec2 allocate-address --domain vpc --query AllocationId --output text)
NAT=$(aws ec2 create-nat-gateway --subnet-id "$PUB_A" --allocation-id "$EIP" --query NatGateway.NatGatewayId --output text)

# security groups referencing each other
ALB_SG=$(aws ec2 create-security-group --group-name task-api-alb --description "ALB" --vpc-id "$VPC_ID" --query GroupId --output text)
APP_SG=$(aws ec2 create-security-group --group-name task-api-app --description "App tasks" --vpc-id "$VPC_ID" --query GroupId --output text)
DB_SG=$(aws ec2 create-security-group --group-name task-api-db  --description "MySQL" --vpc-id "$VPC_ID" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 443  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$APP_SG" --protocol tcp --port 3000 --source-group "$ALB_SG"
aws ec2 authorize-security-group-ingress --group-id "$DB_SG"  --protocol tcp --port 3306 --source-group "$APP_SG"
```

(Practice mein yeh sab Terraform/CloudFormation/CDK se hota hai taaki repeatable ho; is file mein hum Terraform nahi dikha rahe, sirf concepts ke liye CLI.)

Docker se connection: Docker networks mein bhi aisa hi idea hota hai (service names, private network): file 13 (Linux, Networking, Docker networking) dekho.

### 5.4 Managed database: RDS `[ESSENTIAL]`

**Concept**

RDS = managed MySQL/PostgreSQL: patching, automated backups, point-in-time recovery, Multi-AZ failover, monitoring. Tum **OS aur server install/maintain nahi karte**, lekin schema design, indexes, slow queries aur connection pooling tumhari zimmedari rehti hai.

| Feature | What it is | Common confusion |
|---------|------------|------------------|
| **Multi-AZ** | Dusri AZ mein **synchronous standby**; primary fail ho to automatic failover (DNS endpoint same rehta hai) | Yeh **availability** ke liye hai, read scaling ke liye nahi (standby traffic nahi leta, classic Multi-AZ instance mode mein) |
| **Read replica** | **Asynchronous** copy, read scaling ke liye | Replica lag; stale reads (file 14 / Week 7 Day 1 notes) |
| Automated backups + PITR | Daily snapshot + transaction logs, retention 1-35 days | Backup restore **naya instance** banata hai |
| Storage autoscaling, encryption (KMS) | Disk badhna, at-rest encryption | Encryption baad mein toggle nahi hota (snapshot copy se karna padta hai); shuru se on rakho |
| **RDS Proxy** | Managed connection pool in front of RDS | Lambda/bahut saare containers ke liye connections multiplex |

CLI (**not executed**; check `aws rds describe-db-engine-versions --engine mysql` for a valid `--engine-version`):

```bash
aws rds create-db-subnet-group --db-subnet-group-name task-api-data \
  --db-subnet-group-description "private data subnets" --subnet-ids "$DATA_A" "$DATA_B"

aws rds create-db-instance \
  --db-instance-identifier task-api-prod \
  --engine mysql --db-instance-class db.t4g.micro \
  --allocated-storage 20 --storage-type gp3 --storage-encrypted \
  --master-username admin --manage-master-user-password \
  --db-subnet-group-name task-api-data --vpc-security-group-ids "$DB_SG" \
  --no-publicly-accessible --multi-az \
  --backup-retention-period 7 --deletion-protection
```

`--manage-master-user-password` RDS ko master password Secrets Manager mein khud banane/rotate karne deta hai: password tumhare shell history ya code mein aata hi nahi.

**Connection-limit math (autoscaling se linked, yeh interview mein aata hai):**

```
total DB connections = (app instances) x (pool size per instance)  <=  db max_connections - headroom
10 ECS tasks x pool 10 = 100 connections
```

RDS MySQL ka `max_connections` instance class aur parameter group se aata hai: **apne instance ka actual value `SHOW VARIABLES LIKE 'max_connections'` se dekho**, assume mat karo. Autoscaling 10 -> 30 tasks karegi to connections 300 ho jaenge aur DB reject karega ("Too many connections"). Solutions: chhota pool per task, scale-out ki max limit DB capacity se bandhna, RDS Proxy, ya read replicas (Week 4 / Day 5 aur file 14).

Task API ke liye `.env` mein `DB_HOST` ko RDS endpoint (private DNS) par point karo, `DB_POOL_SIZE` ko is math se set karo. Migrations ko deploy pipeline ka alag step (Module 4).

### 5.5 Object storage: S3 and presigned URLs `[ESSENTIAL]`

**Concept**

S3 = unlimited object store (key -> bytes). Bucket default private. Server par files rakhne ki jagah (disk full, scaling issue, backups) S3 use karte hain.

**Presigned URL pattern** (Week 7 / Day 3 notes ka file upload architecture, ab AWS ke saath): API server **file bytes nahi dekhta**.

```
1. Browser -> API:  POST /tasks/42/attachments   { filename, contentType, size }
2. API validates (auth, ownership, allowed type, max size), picks the KEY itself:
   tasks/42/<uuid>.<ext>, and returns a presigned PUT URL (expires in 60-300 s)
3. Browser -> S3:   PUT <presigned URL>  (bytes go straight to S3, API is not in the path)
4. Browser -> API:  POST /tasks/42/attachments/<id>/complete  (API HEADs the object, stores metadata in MySQL)
5. Download: API checks permission -> returns a short-lived presigned GET URL (or CloudFront signed URL)
```

Presigned URL = **URL ke andar signature** (credentials signer ke) jo specific key + method + expiry ke liye valid hai. Browser ko AWS credentials nahi milte. Signature jis role ne banayi uski permissions se bandhi hoti hai (isliye task role ko `s3:PutObject` chahiye, 5.2).

**Run it (LocalStack, NOT real AWS).** `src/aws-localstack-lab.js` -- bucket banata hai, public access block lagata hai, presigned PUT/GET, tamper aur expiry tests, Secrets Manager, IAM policy+role:

```js
// FILE: src/aws-localstack-lab.js
// Runs against LocalStack (NOT real AWS). Needs: docker run -p 14566:4566 localstack/localstack:3.8
import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, PutPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { readFileSync } from 'node:fs';
import { IAMClient, CreatePolicyCommand, CreateRoleCommand, AttachRolePolicyCommand, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';

const endpoint = process.env.AWS_ENDPOINT_URL ?? 'http://localhost:14566';
const common = { region: 'ap-south-1', endpoint, credentials: { accessKeyId: 'test', secretAccessKey: 'test' } };

// ---- S3 presigned URLs: the client uploads/downloads DIRECTLY to S3, our API never proxies the bytes ----
// forcePathStyle is only needed for LocalStack/MinIO. WHEN_REQUIRED stops newer SDKs from baking a CRC32
// checksum into the presigned URL, which a plain browser PUT cannot satisfy.
const s3 = new S3Client({ ...common, forcePathStyle: true, requestChecksumCalculation: "WHEN_REQUIRED" });
const Bucket = 'task-attachments-demo';
await s3.send(new CreateBucketCommand({ Bucket }));
await s3.send(new PutPublicAccessBlockCommand({
  Bucket,
  PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true },
}));

const Key = `tasks/42/${crypto.randomUUID()}.txt`;               // server decides the key, never the client
const putUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket, Key, ContentType: 'text/plain' }), { expiresIn: 60 });
console.log('presigned PUT host+path :', new URL(putUrl).host + new URL(putUrl).pathname);
console.log('query params            :', [...new URL(putUrl).searchParams.keys()].join(', '));

const up = await fetch(putUrl, { method: 'PUT', headers: { 'content-type': 'text/plain' }, body: 'hello from the browser' });
console.log('upload via presigned PUT:', up.status);

const getUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn: 60 });
console.log('download via presigned GET:', await (await fetch(getUrl)).text());

// Tamper test: change the key in the path -> signature no longer matches.
const tampered = getUrl.replace('/tasks/42/', '/tasks/43/');
console.log('tampered URL status     :', (await fetch(tampered)).status);

// Expiry test.
const shortUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn: 1 });
await new Promise((r) => setTimeout(r, 2500));
console.log('expired URL status      :', (await fetch(shortUrl)).status);

// ---- Secrets Manager: the app reads the secret at startup, the secret is not in the image or the repo ----
const sm = new SecretsManagerClient(common);
await sm.send(new CreateSecretCommand({ Name: 'task-api/prod/db', SecretString: JSON.stringify({ username: 'taskapi', password: 'S3cret!' }) }));
const secret = JSON.parse((await sm.send(new GetSecretValueCommand({ SecretId: 'task-api/prod/db' }))).SecretString);
console.log('secret fields read      :', Object.keys(secret).join(', '));

// ---- IAM: a least-privilege policy + a role the ECS task would assume (LocalStack community does NOT enforce IAM) ----
const iam = new IAMClient(common);
const policyDoc = readFileSync(new URL('../aws/task-api-app-policy.json', import.meta.url), 'utf8');
const trustDoc = readFileSync(new URL('../aws/trust-ecs-tasks.json', import.meta.url), 'utf8');
const { Policy } = await iam.send(new CreatePolicyCommand({ PolicyName: 'task-api-app', PolicyDocument: policyDoc }));
console.log('policy created          :', Policy.Arn);
await iam.send(new CreateRoleCommand({ RoleName: 'task-api-task-role', AssumeRolePolicyDocument: trustDoc }));
await iam.send(new AttachRolePolicyCommand({ RoleName: 'task-api-task-role', PolicyArn: Policy.Arn }));
const attached = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: 'task-api-task-role' }));
console.log('role has policies       :', attached.AttachedPolicies.map((p) => p.PolicyName).join(', '));
```

Start LocalStack (signature validation on karna zaroori hai warna expiry/tamper test jhoothe pass hote hain):

```bash
docker run -d --name obs-localstack -p 14566:4566 \
  -e SERVICES=s3,secretsmanager,iam,sts -e S3_SKIP_SIGNATURE_VALIDATION=0 localstack/localstack:3.8
npm i @aws-sdk/client-s3@3 @aws-sdk/s3-request-presigner@3 @aws-sdk/client-secrets-manager@3 \
      @aws-sdk/client-iam@3 @aws-sdk/client-sts@3
node --no-warnings src/aws-localstack-lab.js
```

Real output:

```text
presigned PUT host+path : localhost:14566/task-attachments-demo/tasks/42/183112a4-d6fc-43f0-80a5-18c5772e3730.txt
query params            : X-Amz-Algorithm, X-Amz-Content-Sha256, X-Amz-Credential, X-Amz-Date, X-Amz-Expires, X-Amz-Signature, X-Amz-SignedHeaders, x-id
upload via presigned PUT: 200
download via presigned GET: hello from the browser
tampered URL status     : 403
expired URL status      : 403
secret fields read      : username, password
policy created          : arn:aws:iam::000000000000:policy/task-api-app
role has policies       : task-api-app
```

Kya dikha: (1) URL mein `X-Amz-Expires`, `X-Amz-Signature` aadi hain, credentials nahi. (2) Browser-style plain `fetch` PUT chalta hai. (3) Path badalne (`tasks/42` -> `tasks/43`) par **403**: signature us key ke liye hai. (4) 2.5 second baad 1-second wali URL **403** (expired). 

Do gotchas jo mujhe real mein mile (dono baar fix karke verify kiya):

1. **Newer AWS SDK v3 versions presigned URL mein CRC32 checksum parameters bake kar dete hain** (`x-amz-checksum-crc32`, `x-amz-sdk-checksum-algorithm`); plain browser PUT ne **400** diya. Fix: `new S3Client({ ..., requestChecksumCalculation: 'WHEN_REQUIRED' })`; query params ki list se woh keys gayab ho gayi aur upload **200** hua. Real S3 ka behaviour aisa hi hona expected hai, lekin maine real S3 par nahi chalaya.
2. **LocalStack by default presigned signature/expiry validate nahi karta**: pehli baar expired URL ne bhi 200 diya aur tampered URL ne 404 (key missing, signature failure nahi). `S3_SKIP_SIGNATURE_VALIDATION=0` ke baad dono 403. Lesson: emulator ke "pass" par bharosa mat karo jab tak woh check actually enforce na ho raha ho.

Aur AWS SDK ne Node 20 par warning di ("versions published after the first week of January 2027 will require node >=22"): isliye project Node 22 par rakho (project ka target bhi 22 hai).

Production S3 hardening checklist: Block Public Access (account + bucket level), default encryption (SSE-S3 ya SSE-KMS), versioning (accidental delete se bachav), lifecycle rules (purane versions/temp uploads expire, Glacier), bucket policy se `aws:SecureTransport` enforce, CORS sirf apni origin ke liye (browser direct upload ke liye zaroori; `aws/s3-cors.json`), uploaded content ko AV scan / content-type verify karna, key design `tasks/<id>/<uuid>` (user filename key mein nahi: path traversal aur collisions).

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.example.com"],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedHeaders": ["content-type"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

```bash
# (not executed)
aws s3api create-bucket --bucket task-attachments-prod --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-public-access-block --bucket task-attachments-prod --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-versioning --bucket task-attachments-prod --versioning-configuration Status=Enabled
aws s3api put-bucket-cors --bucket task-attachments-prod --cors-configuration file://aws/s3-cors.json
```

### 5.6 Secrets Manager `[ESSENTIAL]`

**Concept**

DB password, JWT secret, third-party API keys ko code/repo/image/`.env` file mein nahi rakhte (Week 5 / Day 6 notes). **Secrets Manager** (ya SSM Parameter Store) mein rakhte hain: encrypted at rest (KMS), IAM-controlled access, audit (CloudTrail), versions, aur automatic **rotation** (RDS ke liye built-in).

| | Secrets Manager | SSM Parameter Store |
|---|-----------------|---------------------|
| Use | Credentials with rotation | Config values / simple secrets |
| Rotation | Built-in (Lambda based) | Manual |
| Cost | Per secret per month + API calls | Standard parameters free (check current pricing) |

Two ways to get secrets to the app:

1. **Platform injection (preferred)**: ECS task definition `secrets: [{ name: "DB_PASSWORD", valueFrom: "<secret arn>:password::" }]`. ECS execution role secret fetch karke env var inject karta hai; app code unchanged (12-factor). Rotation ke baad naya value tab milega jab task restart ho.
2. **App fetch at startup** (SDK): yahi code upar ke LocalStack lab mein chalaya gaya:

```js
const sm = new SecretsManagerClient({ region: 'ap-south-1' });
const secret = JSON.parse((await sm.send(new GetSecretValueCommand({ SecretId: 'task-api/prod/db' }))).SecretString);
```

(LocalStack lab ne `secret fields read: username, password` print kiya; kabhi secret ki value log mat karo.)

Rotation ki wajah se app ko **credential reload** handle karna padta hai: ya to restart, ya DB error par secret dubara fetch karke pool recreate. `[ADVANCED]`

CLI (**not executed**):

```bash
aws secretsmanager create-secret --name task-api/prod/jwt --secret-string "$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")"
aws secretsmanager get-secret-value --secret-id task-api/prod/jwt --query SecretString --output text
```

### 5.7 Autoscaling `[ESSENTIAL]`

**Concept**

Load ke hisaab se instances/tasks ki count badhana-ghatana. Stateless app (session state Redis/JWT mein, files S3 mein; Week 7 / Day 1 notes) hi horizontally scale ho sakti hai.

| Kind | Scales | Example |
|------|--------|---------|
| Target tracking | Ek metric ko target par rakhta hai (thermostat) | Average CPU 60% ya `ALBRequestCountPerTarget` 500 |
| Step scaling | Thresholds ke steps | CPU > 70 add 2, > 90 add 4 |
| Scheduled | Time ke hisaab se | Morning peak se pehle min 6 |
| Predictive `[ADVANCED]` | History se | Daily patterns |

ECS service autoscaling (**not executed**), policy JSON (`aws/scaling-policy.json`):

```json
{
  "TargetValue": 60.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 300
}
```

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/task-api-cluster/task-api --min-capacity 2 --max-capacity 10

aws application-autoscaling put-scaling-policy --policy-name cpu60 \
  --service-namespace ecs --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/task-api-cluster/task-api \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://aws/scaling-policy.json
```

Node.js-specific sochne wali baatein:

- **Min capacity >= 2** (alag AZs mein) HA ke liye; 1 par ek AZ ka issue = outage.
- Node ek core use karta hai; CPU% scaling tab theek hai jab task 1 vCPU ka ho. I/O-bound API mein CPU kam rehta hai lekin latency badhti hai: **request count per target** ya custom metric (event loop lag, Module 1 ka `nodejs_eventloop_lag_p99_seconds`) behtar signals hain.
- **Scale-out fast, scale-in slow** (cooldowns: 60 s vs 300 s upar) taaki flapping na ho.
- Scale-in par tasks ko `SIGTERM` milta hai: **graceful shutdown + ALB deregistration delay + ECS `stopTimeout`** align karo, warna in-flight requests kat jaati hain (Week 6 / Day 5 notes).
- Warm-up: naye task ko traffic tab do jab readiness pass ho (`/health`) aur pool bhar chuka ho.
- **DB connections ka upar wala math**: max-capacity x pool size <= DB limit.
- Autoscaling lagging hai (metric 1-3 min, task start 30-60 s): sudden 10x spike ko pehle queue/rate limit/cache absorb karte hain (Week 7 notes), autoscale baad mein pakadta hai.

### 5.8 CDN: CloudFront `[ESSENTIAL]`

**Concept**

CDN = edge locations jo content cache karke user ke paas se serve karte hain: kam latency, origin par kam load, DDoS absorb, TLS termination.

Typical setup:

- **Static assets / uploads**: S3 origin, bucket private, CloudFront **Origin Access Control (OAC)** se access (bucket public nahi). Long `Cache-Control: public, max-age=31536000, immutable` + **content-hashed filenames** (`app.4f3a9c.js`): purani file invalidate karne ki zarurat nahi, naya naam.
- **API**: ALB origin; mostly **caching off** (ya short TTL for public GET endpoints). Authenticated/per-user JSON ko cache karna data-leak risk hai: cache key mein `Authorization` aur `Vary` sahi hona chahiye, warna user A ka response user B ko mil sakta hai.
- **Private downloads**: CloudFront signed URLs/cookies ya S3 presigned URLs.
- **Invalidation**: `aws cloudfront create-invalidation --distribution-id EXXXX --paths "/index.html"` (paths ki ginti par cost/limits; versioned filenames behtar).

Cache key = URL + (jo headers/cookies/query strings tum include karo). Har extra cookie/header cache hit ratio ghatata hai. Origin se `Cache-Control` / `ETag` headers sahi do (Week 3 / Day 1 notes ke HTTP caching headers).

Frontend connection: tumhara Vite/React build output (hashed assets) CloudFront + S3 par best fit hai; wahi `index.html` ko short TTL ya no-cache, assets ko immutable.

### 5.9 Cost awareness `[ESSENTIAL]`

Cloud bill ka pehla rule: **jo chalta rehta hai woh kharch karta rehta hai** (idle bhi). Yeh "estimate" ya "pricing page" ka kaam hai, isliye yahan koi dollar number nahi, sirf cost **drivers** aur habits (prices region aur time ke saath badalte hain: har baar pricing page/Calculator se confirm karo).

| Driver | Why it surprises people | What to do |
|--------|------------------------|------------|
| **NAT Gateway** | Hourly charge + per-GB processed; private subnet se S3/ECR/CloudWatch ka traffic NAT se guzre to GB charge | S3/DynamoDB **gateway endpoints** (free), interface endpoints for ECR/Logs jahan sahi ho, dev mein ek hi NAT |
| **Data transfer** | Internet egress, **cross-AZ** aur cross-region traffic charge hota hai | Same AZ mein chatty services, CloudFront (egress sasta aksar), compress responses |
| **RDS** | Multi-AZ = ~double instance, provisioned storage/IOPS, backups retention, idle dev DBs | Dev/test ko night par stop (limits ke saath), right-size, snapshot retention policy, Multi-AZ sirf prod |
| **Idle compute** | Over-provisioned tasks/instances | Right-sizing, autoscaling min ko sahi rakho, Savings Plans/Reserved for steady baseline, Spot for fault-tolerant workers (BullMQ worker jaise) |
| **CloudWatch Logs** | Ingestion per GB + storage; debug logs production mein | Log level `info`, sampling, retention 14-30 days, structured but compact logs (Week 6 / Day 2) |
| **Metrics/traces vendor** | High-cardinality metrics (Module 1.5) ya 100% trace sampling | Cardinality discipline, sampling (Module 2.6) |
| **S3** | Storage + requests + egress; versioning purane versions jama karta hai | Lifecycle rules, Intelligent-Tiering, abort incomplete multipart uploads |
| **Forgotten resources** | Unattached EBS volumes, Elastic IPs, old snapshots, test load balancers | Tagging (`env`, `owner`, `project`), periodic cleanup, budgets |

Guardrails (start of the account, not after the bill):

1. **AWS Budgets** alert (actual + forecast) aur billing email/Slack.
2. **Cost allocation tags** + Cost Explorer: "kaun sa service/team kitna".
3. Free-tier ke limits aur expiry ka dhyan (dev/learning account mein bhi alarm).
4. Temporary labs **tear down** karo (is file ke apne labs `docker rm -f` se saaf hote hain; cloud mein same discipline: `terraform destroy`-style ya script).
5. Architecture-level: pehle measure karo (cost per request/tenant), phir optimise.

Back-of-envelope method (numbers tum pricing page se lagao): `monthly = sum(driver quantity x unit price)`: e.g. `NAT hours x hourly price + GB processed x per-GB price + ALB hours x price + LCU usage + tasks vCPU-hours x price + RDS instance-hours x price + RDS storage GB x price + data egress GB x price`. Ye exercise (practical task) mein karna hai.

### Frontend connection

Frontend deploys par tum bandwidth/build-minutes ke plans dekhte ho; backend mein cost dimension zyada hai (compute, DB, NAT, egress). "Static site on CDN is cheap, dynamic backend with DB is not" yaad rakho. Aur IAM role ka concept frontend ke OAuth scopes jaisa hai: sirf utni permission jitni zarurat.

### Real-world scenario

Marketplace ko product images upload karwani hain. Galat design: images API server ke disk par -> scale-out par ek instance par image dusre par nahi. Sahi: presigned PUT to S3 (private bucket), key `products/<id>/<uuid>.jpg`, metadata MySQL mein, CloudFront (OAC) se serve, `Cache-Control: immutable` + hashed key. Security: app role sirf `products/*` prefix par PutObject; DB private subnet mein; secrets Secrets Manager mein; deploy OIDC role. Cost: NAT ko bypass karne ke liye S3 gateway endpoint; CloudWatch retention 14 din.

### Interview answer

**Interview answer:** "On AWS I run the Task API as containers on ECS Fargate behind an ALB, in private subnets across two AZs, with MySQL on RDS in separate private data subnets. Network access is layered with security groups that reference each other: the internet reaches only the ALB, the ALB reaches the app, and only the app reaches the database. Applications use IAM roles, never long-lived access keys: a task role scoped to the specific S3 prefix and secrets it needs, and an OIDC role for CI. Secrets live in Secrets Manager and are injected at start. Uploads go straight to S3 through short-lived presigned URLs so the API never handles file bytes, and static assets are served via CloudFront. The service autoscales on CPU or request count with a minimum of two tasks, and I cap the maximum so tasks times pool size never exceeds the database connection limit. For cost, I watch NAT gateway, data transfer, idle RDS and log volume, and I set budgets and tags from day one."

### Follow-up questions

1. *IAM user vs role?* User = long-lived credentials for a person/legacy; role = assumed, temporary credentials for workloads/CI/cross-account. Prefer roles + SSO.
2. *Public vs private subnet?* Route to IGW or not. Private subnets need a NAT for outbound internet.
3. *Security group vs NACL?* SG stateful, instance-level, allow-only; NACL stateless, subnet-level, allow/deny.
4. *Multi-AZ vs read replica?* Multi-AZ = HA with sync standby and automatic failover; read replica = async, scale reads, can be stale.
5. *Presigned URL kya leak kar sakta hai?* URL milne wala expiry tak woh action kar sakta hai: short expiry, narrow key, content-type/size limits, HTTPS only. Revoke nahi hota; signer role ki permission badalna ya short TTL hi control hai.
6. *Task role vs execution role (ECS)?* Execution role = ECS agent (pull image, write logs, fetch secrets); task role = app code ke AWS calls.
7. *Autoscaling se DB crash kaise ho sakta hai?* Tasks x pool > max_connections. Cap max, smaller pool, RDS Proxy.
8. *Secrets rotation app ko kaise affect karti hai?* App ko naya credential lena padega (restart ya refetch on auth failure); dual-user rotation strategies.
9. *CDN par authenticated API kyun cache nahi?* Cache key mein user identity na ho to cross-user leakage; `Vary`/cache policy sahi na ho to bhi.
10. *NAT gateway ka cost kaise ghatayein?* VPC endpoints, kam cross-AZ NAT, S3/ECR traffic endpoint se.

### Common mistakes

- `AdministratorAccess` / `*` actions-resources app role par.
- Access keys `.env` ya repo mein; GitHub OIDC trust policy mein `sub` condition na lagana.
- RDS `publicly-accessible` ya `0.0.0.0/0` par 3306 khulna.
- Bucket public ACL; presigned URL ki expiry ghanton/dino ki.
- Secrets ko logs mein print karna ya image mein bake karna.
- Min capacity 1; autoscaling max ko DB limit se bina compare kiye khulla chhodna.
- Billing alarm/budget ke bina account; tear-down na karna.
- Cloud-specific services mein bina soche lock-in (har cheez ko abstract karna bhi over-engineering hai: trade-off batao).

### Revision notes

- IAM: roles over users; least privilege; explicit deny wins; trust vs permissions policy.
- VPC: public/private, IGW/NAT, SG referencing SG; DB never public.
- RDS: Multi-AZ = HA, replica = reads; connection math.
- S3 presigned = direct upload; Secrets Manager injection; autoscaling min 2; CDN immutable assets; NAT/egress cost.

**Key concepts to remember**

1. Role = assumed identity with temporary credentials; trust policy decides who may assume.
2. Three-tier security group chain (alb -> app -> db).
3. Presigned URL = signature in the URL for one key/method/expiry.
4. Autoscaling max x pool size <= DB connections.
5. Cost drivers: NAT, data transfer, idle DB, logs.

**Revision questions**

1. Write (from memory) a policy letting a role read objects only under `s3://bucket/reports/`.
2. Why does the GitHub OIDC trust policy need a `sub` condition?
3. A task in a private subnet cannot reach the npm registry. List the three things you check.
4. How do you stop an autoscaled fleet from exhausting MySQL connections?
5. Why did the tampered presigned URL return 403 and what did the first (unvalidated) LocalStack run teach about emulators?

**Practical task**

(a) Run `src/aws-localstack-lab.js`, then extend it: add a presigned URL with a `ContentType` constraint and prove an upload with a different Content-Type is rejected (note the exact status you get). (b) Without an AWS account, draw the VPC diagram for your Task API and write the cost-driver table with the unit-price column filled from the AWS pricing pages for your region. (c) Write the least-privilege policy for the BullMQ worker (needs: read one secret; no S3).

**Checklist**

- [ ] I can explain roles vs users and trust vs permissions policies.
- [ ] I can draw a 3-tier VPC with SG-to-SG rules and say why the DB is private.
- [ ] I ran the LocalStack lab and understand each printed line.
- [ ] I can explain Multi-AZ vs read replica and the connection-limit math.
- [ ] I can name five cost drivers and one fix for each.

---

## Module 6 - Interview question bank: observability, CI/CD and cloud `[ESSENTIAL]`

**Learning objectives**

- Is file ke sabhi topics par 30 interview questions ko bina dekhe, 60-90 second mein bol kar jawab dena.
- Answers ko apne lab ke real numbers/observations se back karna (e.g. "p95 interpolation trap", "burn rate 14.4").

Estimated time: 1.5 hours (30 questions x ~3 minutes, bol kar). ID format `Q-OBS-NN` taaki study dashboard / question banks se cross-reference ho sake. Answers professional English mein hain (interview ke liye); thoda Hinglish tip `Tip:` mein.

### A. Metrics and monitoring

**Q-OBS-01 [ESSENTIAL] -- What are the three pillars of observability and when do you use each?**
Logs are discrete events with detail (what exactly happened to this request); metrics are cheap numeric aggregates over time (how much, how fast, trending); traces show one request's path and timing across services. I start from metrics (alert, "something is wrong"), narrow with traces ("where is the time going"), and confirm with logs ("what exactly happened here"), joined by a shared trace/request ID.
Tip: yeh teeno ek-doosre ke replacement nahi, ek workflow hain.

**Q-OBS-02 [ESSENTIAL] -- Explain the RED and USE methods. Which do you alert on?**
RED (Rate, Errors, Duration) describes request-driven services from the user's view; USE (Utilization, Saturation, Errors) describes resources such as CPU, DB pool or queues. I alert on RED-style symptoms and use USE to diagnose the bottleneck. For example, p95 latency rising (RED) plus MySQL pool waiters greater than zero (USE saturation) points to the DB pool.

**Q-OBS-03 [ESSENTIAL] -- Why do you use percentiles instead of averages, and how does a Prometheus histogram give you p95?**
Averages hide tail latency; 5% of users can have terrible latency while the mean looks fine. A histogram stores cumulative bucket counts; `histogram_quantile(0.95, sum by (le) (rate(x_bucket[5m])))` interpolates the 95th percentile from the rate of those buckets, aggregated across instances by summing per `le`. Accuracy depends on bucket layout: in my lab a route with a maximum of about 1.2 s reported p95 = 2.27 s because the buckets jumped from 1 to 2.5 s, so I place buckets densely around the SLO threshold.

**Q-OBS-04 [ESSENTIAL] -- What is label cardinality and why can it take Prometheus down?**
Every unique combination of label values is a separate time series, and memory/disk scale with series count, not request count. Putting user IDs or raw URLs in labels creates unbounded series. I ran 10 000 distinct URLs through a counter: 10 000 series and 360 KiB per scrape, versus 1 series using the route pattern. Rule: only bounded labels; per-user detail belongs in logs or traces.

**Q-OBS-05 [ESSENTIAL] -- Counter, gauge, histogram, summary: what is each and what do you query them with?**
Counter only increases (use `rate`/`increase`), gauge goes up and down (query directly), histogram counts observations into buckets (use `histogram_quantile` over `rate` of buckets), summary computes quantiles client-side and cannot be aggregated across instances, so I usually prefer histograms.

**Q-OBS-06 [ESSENTIAL] -- Which Node.js-specific metrics matter?**
Event loop lag (the most direct sign of a blocked loop), heap used and RSS (leaks), GC pause time, active handles/requests, CPU, plus application ones: in-flight requests, DB pool in use/waiting, queue depth and oldest-job age. prom-client's `collectDefaultMetrics` gives most of the runtime ones.

**Q-OBS-07 [ADVANCED] -- Pull vs push metrics: trade-offs?**
Pull (Prometheus) gives central control, discovery, and a free `up` signal when a target disappears. Push suits short-lived jobs or targets behind firewalls (Pushgateway or OTLP metrics to a Collector). Pull needs network reachability to each target and handles very short-lived processes poorly.

### B. Tracing

**Q-OBS-08 [ESSENTIAL] -- What is distributed tracing and how does context propagation work?**
A trace is a tree of spans sharing one trace ID; each span has a parent. The context (trace ID, span ID, flags) is carried across process boundaries, for HTTP in the W3C `traceparent` header. Instrumentation injects it on outgoing calls and extracts it on incoming ones, and in-process it flows through `AsyncLocalStorage` so it survives `await`.

**Q-OBS-09 [ESSENTIAL] -- How do you keep a trace connected across a queue?**
A job has no HTTP headers, so I inject the active context into a carrier object stored in the job payload (`propagation.inject`), and the worker extracts it (`propagation.extract`) and starts its span inside that context. In my lab the worker's span showed up under the original gateway request in Jaeger. Kafka, SQS and RabbitMQ do the same with message headers or attributes. For long-delayed jobs I may prefer a span link instead of a parent-child relationship.

**Q-OBS-10 [ESSENTIAL] -- How do you correlate logs with traces?**
Stamp `trace_id` and `span_id` on every log line from the active span (the OTel pino instrumentation does it automatically, or a logger mixin). Then a log line's trace ID can be pasted into Jaeger/Tempo to see the whole request, and traces can link back to logs by the same ID.

**Q-OBS-11 [ESSENTIAL] -- What is sampling and which strategy would you pick?**
Recording every trace is expensive. Head-based sampling decides at the root; I use parent-based ratio sampling so downstream services follow the root's decision and traces are never half-kept (with ratio 0.1, 300 requests gave 39 traces, all complete). Tail-based sampling in an OTel Collector can retain all errors and slow traces, but needs buffering and more infrastructure.

**Q-OBS-12 [ADVANCED] -- Why might auto-instrumentation silently produce no spans in a Node ESM app?**
The instrumentation must load before the instrumented modules, and for ES modules it needs the import-in-the-middle loader hook (`register('@opentelemetry/instrumentation/hook.mjs', import.meta.url)` in a file loaded with `--import`). Otherwise `import`-ed libraries are not patched and there is no error. Also instrumentation versions must support the library version (I observed that Express layer spans did not appear in my ESM + Express 5 setup, although HTTP, fetch and ioredis spans did).

**Q-OBS-13 [ADVANCED] -- Metrics label vs span attribute vs log field: where does high-cardinality data (user ID) go?**
Span attributes and log fields are stored per event, so high cardinality is fine (mind PII and storage). Metric labels create time series, so they must be bounded. I use user ID in logs/traces and aggregate metrics by route and status.

### C. Alerting and SLOs

**Q-OBS-14 [ESSENTIAL] -- Symptom-based vs cause-based alerts?**
Symptom alerts fire on what users experience (error ratio, latency, availability); they catch unknown failure modes and have few false positives, so they page. Cause alerts (CPU, disk, restarts) are noisy and only predictive for known failures; they belong on dashboards or as tickets, except for a few like "disk full in 4 hours".

**Q-OBS-15 [ESSENTIAL] -- Define SLI, SLO, SLA and error budget with an example.**
SLI is a measured good/total ratio (successful requests / all requests); SLO is the target for it over a window (99.9% over 30 days); SLA is a contractual promise, usually looser, with penalties. Error budget = 1 - SLO: 0.1%, which is 43.2 minutes of full downtime or 30 000 failed requests out of 30 million per month. When the budget is spent, risky releases pause and reliability work gets priority.

**Q-OBS-16 [ESSENTIAL] -- What is a burn rate and how do multi-window alerts work?**
Burn rate is the observed error ratio divided by the budget fraction; 1 means the budget is consumed exactly over the SLO period. For a 99.9% SLO, 14.4x over 1 hour (and over the last 5 minutes) spends 2% of the monthly budget per hour and pages; 6x over 6 hours (and 30 minutes) pages; 3x over a day and 1x over three days create tickets. The long window gives significance, the short window makes the alert stop quickly after recovery and prevents paging on a brief blip. I validated the rules with promtool unit tests, including a 3-minute blip that must not page.

**Q-OBS-17 [ESSENTIAL] -- How would you stop alert fatigue?**
Only page on user-impacting, actionable symptoms; give each page a runbook and owner; use multi-window burn rates and `for:` to avoid flapping; group and inhibit in Alertmanager; downgrade or delete alerts nobody acts on; review alert volume per on-call shift.

**Q-OBS-18 [ADVANCED] -- How do you define a latency SLO?**
Threshold-based SLI: fraction of requests completing within a target (for example 99% under 300 ms) measured from a histogram `le` bucket at exactly that threshold, so the bucket must exist at 0.3. Alert with the same burn-rate approach on the "slow requests" ratio.

**Q-OBS-19 [ADVANCED] -- What are recording rules for, and how do you test alert rules?**
Recording rules precompute expensive or reused expressions (the SLI over several windows) so alerts and dashboards share one definition and cheap queries. I check syntax with `promtool check rules` and test behaviour with `promtool test rules`, feeding synthetic series and asserting which alerts fire at which evaluation time.

### D. CI/CD and deployment

**Q-OBS-20 [ESSENTIAL] -- Describe a CI/CD pipeline for a Node API with a MySQL database.**
On each PR: install with `npm ci` (cached), lint, audit dependencies, run unit and integration tests against a real MySQL service container with a health check. On main: build one Docker image tagged with the commit SHA, smoke-test it, push to a registry, deploy automatically to staging, run a smoke test, then deploy to production behind an approval gate with a health check and automated rollback. Secrets and cloud access via environment secrets and OIDC.

**Q-OBS-21 [ESSENTIAL] -- Explain blue/green, rolling and canary deployments.**
Rolling replaces instances gradually in place: no extra capacity, but mixed versions and slow rollback. Blue/green runs a full new environment next to the old one and switches traffic at once: instant rollback, double capacity temporarily. Canary sends a small and growing percentage of traffic to the new version while comparing metrics, minimising blast radius but needing good observability and routing.

**Q-OBS-22 [ESSENTIAL] -- What are feature flags and why separate deploy from release?**
A flag gates code at runtime. You deploy code dark, enable it for a percentage or a user list, and switch it off instantly without a deploy if the SLO burns. Hash-based bucketing keeps each user's experience stable as the rollout grows (in my demo, going from 10% to 25% kept all earlier users enabled). The cost is flag debt and more test combinations, so flags need owners and removal dates.

**Q-OBS-23 [ESSENTIAL] -- How do you make rollbacks safe with database migrations?**
Use expand/contract: add nullable columns or tables first, dual-write, backfill, switch reads, and only in a later release drop the old column. Every step except the last keeps the previous app version working. Run migrations as a separate pipeline step, not on every instance start, and avoid destructive changes in the same release as the code that needs them.

**Q-OBS-24 [ESSENTIAL] -- How do you manage secrets in CI/CD?**
Environment-scoped secrets (masked in logs), required reviewers on the production environment, OIDC to obtain short-lived cloud credentials instead of stored keys with a role trust policy restricted by the `sub` claim, least-privilege `GITHUB_TOKEN` permissions, no secrets in images or build args, and no secrets for untrusted fork PRs.

**Q-OBS-25 [ADVANCED] -- Why shouldn't you deploy the `latest` tag?**
It is mutable, so you cannot tell what is running, nodes can pull different versions, and the rollback target is undefined. Use immutable tags (commit SHA or digest) and promote the same artifact through environments.

**Q-OBS-26 [ADVANCED] -- What does a rolling deploy need from the application to avoid dropped requests?**
Readiness that fails when shutting down, handling `SIGTERM` by stopping accepting new connections, finishing in-flight requests and closing pools, and a load balancer deregistration delay and orchestrator stop timeout longer than the longest request.

### E. Cloud (AWS)

**Q-OBS-27 [ESSENTIAL] -- IAM role vs IAM user, and what is least privilege?**
A user has long-lived credentials; a role is assumed and yields temporary credentials, which is what workloads and CI should use. Least privilege means granting only specific actions on specific resources, for example `s3:PutObject` on `bucket/tasks/*` rather than `s3:*` on everything. Evaluation is implicit deny, explicit allow needed, explicit deny always wins. For AccessDenied I check the caller identity, the policy, resource policies, SCPs and CloudTrail.

**Q-OBS-28 [ESSENTIAL] -- Design the network for a web API with a database.**
A VPC with public subnets (ALB, NAT) and private subnets (app, database) across two AZs. Security groups chained by reference: internet to ALB on 443, ALB to app on the app port, app to DB on 3306. The database has no public IP and is not reachable from the internet. Private subnets reach the internet outbound via NAT, and AWS services via VPC endpoints where possible.

**Q-OBS-29 [ESSENTIAL] -- RDS Multi-AZ versus read replicas?**
Multi-AZ keeps a synchronous standby in another AZ for automatic failover, which improves availability but not read capacity. Read replicas are asynchronous copies used to scale reads and can serve stale data due to replication lag. They can be combined. Neither replaces backups with point-in-time recovery.

**Q-OBS-30 [ESSENTIAL] -- How do S3 presigned URLs work and what are their risks?**
The server signs a URL that grants one operation on one key until an expiry; the browser uploads or downloads directly to S3, so the API never handles the bytes. Risks: anyone holding the URL can use it until it expires, and it is bound to the signer's permissions. Mitigate with short expiry, server-chosen keys, content-type and size constraints, HTTPS, private buckets with Block Public Access, and CORS limited to the app origin. In my test, changing the key or waiting past expiry gave 403.

**Q-OBS-31 [ESSENTIAL] -- How does autoscaling interact with a database, and what do you watch out for in Node?**
Each added instance adds its pool's connections, so `max instances x pool size` must stay below the DB connection limit (or use RDS Proxy). Scale on request count per target or a custom event-loop-lag metric because Node is single-threaded and CPU% can mislead; keep a minimum of two instances across AZs; scale out fast and in slowly; and align graceful shutdown with deregistration so scale-in does not cut requests.

**Q-OBS-32 [ESSENTIAL] -- What are the main AWS cost traps for a small backend?**
NAT gateway (hourly plus per-GB processing), data transfer (internet egress and cross-AZ), always-on Multi-AZ or oversized RDS, idle compute, CloudWatch Logs ingestion and retention, and forgotten resources such as unattached volumes. Mitigation: gateway VPC endpoints for S3, right-sizing, retention limits, tagging, Budgets alerts, and tearing down test environments.

**Q-OBS-33 [ADVANCED] -- ECS task role vs execution role?**
The execution role is used by the ECS agent to pull images, write logs and fetch secrets for injection. The task role is what the application code assumes to call AWS APIs such as S3. Mixing them up is a common cause of AccessDenied at startup versus at runtime.

**Q-OBS-34 [ADVANCED] -- When should CloudFront cache API responses?**
Only for public, idempotent GETs with explicit cache policy and short TTL. Authenticated or per-user JSON should not be cached unless the cache key includes the identity, because otherwise one user's response can be served to another. Static, content-hashed assets get long immutable caching.

### F. Scenario questions

**Q-OBS-35 [ESSENTIAL] -- "After a deploy, error rate went from 0.1% to 3%. Walk me through your response."**
Acknowledge the page (fast-burn alert), check the dashboard and deploy markers to confirm the timing correlates with the release, mitigate first by rolling back or switching off the feature flag (or shifting canary traffic to 0), confirm recovery on the same dashboard, then diagnose using traces and logs by trace ID for failing requests, write a blameless postmortem, and add a test or alert that would have caught it earlier.

**Q-OBS-36 [ESSENTIAL] -- "p95 latency doubled but error rate is flat. How do you find the cause?"**
Use RED per route to find which endpoints; check saturation (in-flight requests, event loop lag, DB pool waiters, CPU) to see which resource; open slow traces from that window to see which span grew (DB query, downstream call, or app time); check recent deploys and dependency health; and check the DB slow query log if the span is a query.

**Q-OBS-37 [ADVANCED] -- "Your Prometheus is running out of memory." What happened?**
Most likely a cardinality explosion from an unbounded label (user ID, raw URL, request ID). Find the offending metric with the TSDB status page or `topk(10, count by (__name__)({__name__=~".+"}))`, fix the instrumentation to use bounded labels, and drop or relabel the series at scrape time as an emergency measure.

**Key concepts to remember**

1. Metrics alert, traces locate, logs explain; join them with trace_id.
2. Burn rate = error ratio / (1 - SLO); two windows per alert.
3. Cardinality and bucket layout are the two classic Prometheus traps.
4. Build once, promote the same SHA; gate production; rollback is a drilled operation.
5. Roles over keys, private DB, presigned direct uploads, max instances x pool <= DB limit.

**Revision questions**

1. Pick any five questions above at random and answer each aloud in 60 seconds without notes. Record yourself and list filler words and missing numbers.
2. Which three answers above did you give without a concrete number or example from a lab? Rewrite them with one.
3. Choose one scenario question (Q-OBS-35 to Q-OBS-37) and draw the incident timeline on paper: detect, scope, mitigate, diagnose, fix, postmortem.

**Practical task**

Run a 20-minute mock: a friend (or a voice-recorded prompt) asks Q-OBS-02, 08, 16, 21, 28 and 36 in random order. For each, open with a one-sentence definition, give one real example from your lab (a number, a trace tree, a PromQL line), and end with a trade-off.

**Checklist**

- [ ] I answered all 37 questions aloud at least once.
- [ ] Each answer has one number or lab observation behind it.
- [ ] I can sketch the observability data flow (logs, metrics, traces) from memory.
- [ ] I can state the burn-rate table from memory.

---

## Summary, assessment, hours and verification log

### Summary

- **Metrics**: RED for services, USE for resources; one Prometheus histogram gives rate, errors and duration; percentiles come from buckets, so bucket layout matters (the `/slow` p95 = 2.27 s lie); label cardinality is the way Prometheus dies (10 000 series vs 1). Dashboards and datasources are provisioned as code.
- **Tracing**: OpenTelemetry auto-instrumentation (load first; ESM needs the hook) plus manual spans; context travels in `traceparent` over HTTP and in a carrier inside the job over BullMQ; `trace_id` in logs connects the three pillars; sampling must be parent-based.
- **Alerting**: page on symptoms tied to an SLO, ticket on causes; error budget = 1 - SLO; multi-window multi-burn-rate rules (14.4x/1h+5m, 6x/6h+30m, 3x/1d+2h, 1x/3d+6h); validate with `promtool check` and `promtool test`.
- **CI/CD**: lint -> test (MySQL service container) -> build once (SHA tag) -> smoke test -> staging -> approval -> production with health check and rollback; OIDC instead of stored keys; rolling/blue-green/canary/flags; expand/contract keeps rollbacks possible.
- **Cloud (AWS)**: roles over users and least privilege; public/private subnets and chained security groups; RDS Multi-AZ (HA) vs replicas (reads) and the connection math; presigned S3 URLs; Secrets Manager; autoscaling with min 2 and a DB-aware max; CloudFront for immutable assets; cost drivers (NAT, transfer, idle DB, logs).

### Mixed-difficulty assessment

Time: 40 minutes, closed notes. Answers follow after the questions.

**Basic**

1. Name the three RED signals and the three USE signals.
2. What does `rate()` do and why is a raw counter graph useless?
3. What is the difference between a trace and a span?
4. State the difference between an IAM user and an IAM role in one sentence.
5. What does `needs:` do in a GitHub Actions workflow?

**Intermediate**

6. Write the PromQL for the p99 latency of all gateway routes over 5 minutes.
7. A 99.9% SLO over 30 days: how many minutes of full downtime is the budget, and what is the burn rate if 1.44% of requests fail?
8. In your lab, the worker's span appears under the gateway request in Jaeger. Explain exactly how the trace context crossed Redis.
9. Why does the workflow run `docker push` only on `main`, and what permission does the job need for it?
10. Draw the security group chain for ALB, app and database, and state which port each rule opens.

**Advanced**

11. A service has a steady 0.5% error ratio against a 99.9% SLO, with clean history before. Which of the four burn-rate alerts fire, and when does the first one fire?
12. Explain the expand/contract sequence to rename a MySQL column `tasks.status` to `tasks.state` with a rolling deploy and a possible rollback in the middle.
13. Autoscaling max is 12 tasks, each with a pool of 10, and the RDS instance allows 100 connections. What goes wrong and give two fixes.
14. Why did a tampered presigned URL fail in my LocalStack test only after I set `S3_SKIP_SIGNATURE_VALIDATION=0`, and what general lesson does that teach about testing against emulators?

**Answers and explanations**

1. RED: Rate, Errors, Duration. USE: Utilization, Saturation, Errors. RED describes services from the user's perspective, USE describes resources.
2. `rate(counter[window])` is the per-second average increase over the window and handles counter resets. A raw counter only ever goes up (and resets to 0 on restart), so its absolute value says nothing about current traffic.
3. A trace is the whole journey of one request, identified by a trace ID. A span is one timed unit of work within it (an HTTP call, a query, a job), with a parent span ID; the spans form a tree.
4. A user has long-lived credentials, a role is assumed to get temporary credentials, which is why workloads and CI should use roles.
5. `needs:` declares job dependencies: the job starts only after the listed jobs succeed (it also gives the DAG and lets you pass `outputs`). In my workflow `build-image` needs `lint` and `test`.
6. `histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket{job="gateway", route!="/metrics"}[5m])))`.
7. Budget = 0.1% of 43 200 minutes = 43.2 minutes. Burn rate = 0.0144 / 0.001 = 14.4, which would consume 2% of the monthly budget per hour.
8. The gateway calls `propagation.inject(context.active(), carrier)` and stores the carrier (a `traceparent` string) in the BullMQ job data under `_otel`. Redis just stores bytes. The worker reads `job.data._otel`, calls `propagation.extract(ROOT_CONTEXT, carrier)` to rebuild the parent context, and starts its span with `context.with(parentCtx, ...)`, so the new span gets the same trace ID and the gateway span as parent.
9. Pushing from PRs would publish unreviewed code and would need packages-write on untrusted runs; pushing only from `main` (after lint and tests) keeps registry content trusted. The job needs `permissions: packages: write` (plus `contents: read`); the workflow default is read-only.
10. Internet -> ALB: TCP 443 from 0.0.0.0/0 (`alb-sg`). ALB -> app: TCP 3000 with source `alb-sg` (`app-sg`). App -> MySQL: TCP 3306 with source `app-sg` (`db-sg`). Referencing security groups instead of CIDR blocks keeps the rules correct as IPs change.
11. Burn rate = 0.005 / 0.001 = 5. Fast (14.4) and Medium (6) do not fire since 5 < 6. Slow (3x over 1 day AND 3x over 2 h) fires once the 1-day average exceeds 0.3%: with a clean history the 1 d ratio after t hours is 0.5% x t/24, so t = 24 x 0.3 / 0.5 = 14.4 hours; the 2 h window is already above. Very slow (1x over 3 days) would take 72 x 0.1 / 0.5 = 14.4 hours too, so both tickets fire about 14.4 hours in. The lesson: a steady 5x burn is not a page, but it will exhaust the budget in 6 days, so a ticket is the right severity.
12. (1) Expand: migration adds nullable `state`. (2) Deploy code that writes both columns and still reads `status`. (3) Backfill `state` from `status` in batches. (4) Deploy code that reads `state` (still writing both). (5) Later release: stop writing `status`, then drop it. Until step 5 the previous version still works against the schema, so rollback is safe; dropping the column is the point of no return and is shipped alone.
13. 12 x 10 = 120 connections wanted versus 100 allowed, so at full scale the DB rejects connections ("Too many connections") and requests fail precisely during a traffic spike. Fixes: lower the pool per task (for example 6, so 72 total), cap max tasks to fit, use RDS Proxy to multiplex, or scale the DB instance/parameter group. Also leave headroom for admin and migration connections.
14. LocalStack community by default skips presigned signature and expiry validation. The tampered URL pointed to a different key, which simply did not exist (404), and the expired URL still returned 200. With validation on, both returned 403. Lesson: a passing test against an emulator only counts if you know the emulator enforces that rule; include a negative test (tamper, expiry) that must fail, and verify against the real service for security-relevant behaviour.

**Weak-area guidance**

| If you missed | Revisit |
|---------------|---------|
| 1, 2, 6, 13 (metrics) | Module 1.4 and 1.5; rerun the PromQL and `cardinality-demo.js` |
| 3, 8 (tracing) | Module 2.4 and 2.5; trace a `POST /tasks` again |
| 7, 11 (SLO math) | Module 3.2 tables; recompute with 99.95% and 99.99% |
| 5, 9, 12 (CI/CD) | Module 4.2 and 4.5 |
| 4, 10, 13, 14 (cloud) | Module 5.2, 5.3, 5.4, 5.5 |

### Hours estimate

| Module | Hours | Notes |
|--------|-------|-------|
| 1 - Metrics, Prometheus, Grafana | 2.0 | Includes bringing up the compose stack |
| 2 - Distributed tracing | 2.0 | Includes the queue hop and sampling experiment |
| 3 - Alerting, SLO, burn rate | 2.0 | Includes promtool check/test |
| 4 - CI/CD and deployments | 2.0 | Plus 1 h optional scratch GitHub repo task |
| 5 - Cloud basics (AWS) | 2.5 | 2 h reading + 0.5 h LocalStack lab |
| 6 - Interview Q&A (spoken) | 1.5 | |
| Assessment + weak-area revision | 0.75 | |
| **Total** | **12.75** | About 6 sittings of 2 hours; matches Days 71-77 with a catch-up slot |

### Cleanup (run when finished)

```bash
docker compose down -v                 # obs-redis, obs-jaeger, obs-prometheus, obs-grafana + network
docker rm -f obs-localstack            # LocalStack
docker rmi obs-ci-demo:sha-test        # stand-in CI image
# stop the three node processes (Ctrl+C in each terminal, or end the node.exe tasks you started)
```

### Not verified (read this before trusting anything)

- **GitHub Actions workflow was never run on GitHub.** Validated only by `actionlint` (syntax, action inputs, job graph, shellcheck) plus piece-wise local runs: the MySQL `--health-cmd` flags on a real `mysql:8.4` container, the multi-stage Docker build and non-root check on a stand-in app, ESLint pass/fail. Not checked: `actions/*` action behaviour, GHCR push, OIDC role assumption, `npm test` and the Docker build against the real Task API source, and `scripts/deploy.sh` / `scripts/rollback.sh` (not written).
- **All AWS CLI commands, VPC/RDS/ECS/CloudFront/autoscaling snippets and prices: not executed**; there is no AWS account. JSON documents are syntax-checked only; the IAM policy/trust documents were accepted by LocalStack's IAM API, which is more lenient than AWS.
- **LocalStack (not AWS)** was used for S3 presigned URLs, Secrets Manager and IAM creation. LocalStack community does not enforce IAM policies, so "access denied" behaviour is untested. Presigned-URL expiry/tamper checks needed `S3_SKIP_SIGNATURE_VALIDATION=0`.
- **Grafana was verified through its HTTP API** (datasource present and healthy, dashboard provisioned, a query through `/api/ds/query` returns data frames); I did not look at rendered panels or take screenshots.
- **Prometheus alert delivery** (Alertmanager connected to Prometheus, webhook receipts) was not run; Alertmanager config was validated with `amtool check-config` and `amtool config routes test` only.
- **Tracing**: Express router/middleware spans did not appear in my ESM + Express 5 setup, so span names are only `GET`/`POST` (HTTP spans, undici/fetch spans, ioredis `evalsha` and manual spans did appear). I did not investigate the cause or test a fix. Worker span as child (not link) is a design choice, not a measurement. Tail sampling and the OTel Collector were not run.
- **Node version**: everything ran on Node v20.20.1 although the project target is Node 22 LTS (the AWS SDK printed a warning that future versions need Node >= 22; the CI image used `node:22-alpine` and reported v22.23.3).
- The canary nginx config was syntax-checked with `nginx -t`; the 95/5 traffic split was not measured. Grafana, Prometheus and Jaeger were not load-tested; the load script used ~1 250 requests.

### Corrections / notes for existing parts

- `07_Week7_System_Design.md` Day 5 (section 5.2) shows single-window threshold alerts (`for: 5m`) as the alert example. That is fine as a first step; Module 3 here supersedes it with burn-rate alerts, and a cross-reference from there to file 15 would help. Its `metricsMiddleware` uses `res.on('finish')`; `close` (used here) also covers aborted connections for in-flight gauges.
- `12_Project_Task_API.md` Extension C exposes `/health` while Week 7 / Day 5 notes use `/healthz` and `/readyz`; the CI workflow and smoke tests here use `/health` to match the Task API. Consistent naming across parts would avoid confusion.
- Task API has no `lint` script or ESLint config in the project doc; Module 4 adds `eslint.config.js` and `"lint": "eslint ."` as an addition to the project.
