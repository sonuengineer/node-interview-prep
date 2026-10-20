# Week 7 -- Backend System Design and Production Scenarios

Days 43-49 of the 56-day plan. About 2 hours per day, 14 hours for the week.

Is week ka goal: tum "design a rate limiter / notification system / URL shortener / file upload / payment flow" jaise questions ko **simple design se start karke, step by step complexity add karte hue** bol sako. Interviewer ko yeh dikhana hai ki tum trade-offs samajhte ho, buzzwords nahi bolte.

Tier markers: `[ESSENTIAL]` = most interviews mein poocha jata hai. `[ADVANCED]` = supplementary, time ho to padho.

Honest note: system design ek week mein master nahi hota. Is week ka realistic target hai ek repeatable framework + 5 designs ko 10-15 minute mein bol paana. Depth practice se aati hai (Week 8 mocks).

## Table of Contents

- [How to approach any design question (framework)](#how-to-approach-any-design-question-framework)
- [Day 1 - Monolith vs microservices, load balancing, scaling, caching, DB scaling, connection limits](#day-1---monolith-vs-microservices-load-balancing-scaling-caching-db-scaling-connection-limits)
- [Day 2 - Rate limiter and notification system](#day-2---rate-limiter-and-notification-system)
- [Day 3 - URL shortener and file upload architecture](#day-3---url-shortener-and-file-upload-architecture)
- [Day 4 - Payment and transaction workflows, retries, idempotency, failure recovery](#day-4---payment-and-transaction-workflows-retries-idempotency-failure-recovery)
- [Day 5 - Message queues, async processing, logging, metrics, monitoring](#day-5---message-queues-async-processing-logging-metrics-monitoring)
- [Day 6 - Docker, deployment basics, design-practice session](#day-6---docker-deployment-basics-design-practice-session)
- [Day 7 - Revision and weekly test](#day-7---revision-and-weekly-test)
- [Week 7 revision summary](#week-7-revision-summary)
- [Week 7 assessment](#week-7-assessment)
- [Answers with explanations](#answers-with-explanations)
- [Weak-area identification guidance](#weak-area-identification-guidance)
- [Catch-up plan if you fall behind](#catch-up-plan-if-you-fall-behind)

Cross-references: Week 4 (MySQL indexes, transactions, locking, pooling), Week 5 (auth, rate limiting basics, secrets), Week 6 / Day 3 (retries, backoff, idempotency basics), Week 6 / Day 4 (Redis, caching), Week 6 / Day 5 (queues, graceful shutdown). Yahan un topics ko dobara nahi samjhaya ja raha; sirf design level par jod rahe hain.

---

## How to approach any design question (framework)

`[ESSENTIAL]` Yeh framework har design answer ka skeleton hai. 45-minute interview ho ya 15-minute phone screen, yahi order follow karo.

1. **Clarify requirements (3-5 min).** Functional: system kya karega? Non-functional: scale (requests/sec), latency target, availability, consistency, durability. Out of scope kya hai, yeh bhi bolo.
2. **Estimate (2 min).** Back-of-envelope: QPS, storage, read/write ratio. Sirf utna jitna design decision change kare.
3. **Simplest working design (5 min).** Ek Node.js service + ek MySQL. Bolo: "Pehle yeh kaam karta hai, ab dekhte hain kahan toot-ta hai."
4. **API design + data model (5 min).** Endpoints, request/response, MySQL tables, indexes.
5. **Deep dive on the hard part (10 min).** Har design ka ek hard part hota hai (rate limiter: atomicity; payments: idempotency + consistency; URL shortener: ID generation; notifications: reliability).
6. **Failure scenarios (5 min).** Kya toot sakta hai? Retry, timeout, duplicate, partial failure.
7. **Scale only where justified (5 min).** Bottleneck identify karo, phir cache / replica / queue / shard add karo, aur trade-off bolo.

Rule of thumb: **complexity ko justify karo, pehle se mat daalo.** Agar tum seedha "Kafka + microservices + Cassandra" bol do bina numbers ke, interviewer ko lagta hai tum pattern-match kar rahe ho.

**Interview answer (opening line you can reuse):**
"Before designing, I would like to clarify the functional and non-functional requirements and estimate the expected load. I will start with the simplest design that works, a stateless Node.js service with MySQL, then identify the bottlenecks and add components such as caching, queues, or replicas only where the numbers justify them."

Frontend connection: React mein tum pehle component state se start karte ho, aur sirf zaroorat padne par Redux/React Query laate ho. Backend design mein bhi same principle: pehle local state (single DB), phir shared infra (cache, queue) jab pain dikhe.

---

## Day 1 - Monolith vs microservices, load balancing, scaling, caching, DB scaling, connection limits

**Learning objectives**

- Modular monolith aur microservices ka difference, aur kab kya choose karna hai, bata sako.
- Load balancer kaise kaam karta hai aur stateless service kyun zaroori hai, explain kar sako.
- Vertical vs horizontal scaling, aur horizontal scaling ke liye app ko kya banana padta hai.
- Caching layers (browser, CDN, app cache, Redis) aur cache-aside pattern with code.
- DB scaling ladder: index -> pool tuning -> cache -> read replica -> partition/shard.
- Connection limit math: `instances x pool size <= max_connections`.

Estimated time: 25 min monolith/microservices, 25 min load balancing + horizontal scaling, 30 min caching, 30 min DB scaling + connection limits, 10 min revision questions.

### 1.1 Modular monolith vs microservices `[ESSENTIAL]`

**Concept**

- **Monolith:** ek deployable unit. Saara code (users, orders, payments) ek hi process mein, ek hi DB.
- **Modular monolith:** ek deployable unit, lekin andar se clear module boundaries (users/, orders/, payments/). Modules ek doosre ke internals ko directly import nahi karte; sirf public interface (service function) se baat karte hain.
- **Microservices:** har business capability alag service, alag deployment, aksar alag DB. Services network (HTTP/gRPC/queue) se baat karti hain.

**Why it matters**

Interviewer ka favourite question: "Microservices kyun nahi use kiye?" Sahi answer hai: team size, deploy independence aur scaling needs ke hisaab se. Junior/mid candidates jo "microservices are always better" bolte hain, woh red flag hain.

**Internal working / what actually changes**

| Aspect | Modular monolith | Microservices |
|--------|------------------|---------------|
| Function call | In-process, nanoseconds | Network call, milliseconds, can fail |
| Transaction | Ek MySQL transaction, ACID | Distributed: saga, eventual consistency |
| Deployment | Ek unit | Per service pipeline |
| Debugging | Ek stack trace | Distributed tracing zaroori |
| Data joins | SQL JOIN | API composition ya data duplication |
| Team scaling | 1-3 teams tak comfortable | Many independent teams |
| Ops cost | Low | High (service discovery, observability, CI/CD per service) |

Network call ka matlab: timeout, retry, partial failure, version mismatch. Yeh sab complexity ek in-process function call mein nahi thi.

**Code example: module boundary in a modular monolith**

```js
// src/modules/orders/index.js  (public interface of the orders module)
import { createOrder, getOrder } from './orders.service.js';
export { createOrder, getOrder };
// Other modules import ONLY from 'modules/orders/index.js',
// never from 'modules/orders/orders.repository.js'.
```

```js
// src/modules/payments/payments.service.js
import { getOrder } from '../orders/index.js'; // allowed: public interface

export async function chargeOrder(orderId) {
  const order = await getOrder(orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND');
  // payments logic here
}
```

Agar baad mein orders ko alag service banana pade, to sirf `getOrder` ka implementation HTTP call mein badlega; payments module ko pata bhi nahi chalega. Yeh modular monolith ka asli fayda hai.

**Frontend connection:** Micro-frontends vs single React app. Micro-frontends tab chahiye jab bahut saari teams independent deploy karein. Chhoti team ke liye ek well-structured React app (feature folders) better hai. Backend mein bhi same logic.

**Real-world scenario (marketplace)**

Ek marketplace startup: 6 developers, ek team. Modular monolith: `catalog`, `orders`, `payments`, `notifications` modules, ek MySQL. Jab payments team alag hui aur PCI compliance ke liye isolation chahiye, tab payments ko alag service banaya. Baaki monolith mein rahe.

**Interview answer:**
"I would start with a modular monolith. It gives us single-transaction consistency, simple deployment, and easy debugging, while clear module boundaries keep the option to extract services later. I would move to microservices only when there is a concrete reason: independent scaling of a hot component, independent deployment cadence for separate teams, or isolation requirements such as payment compliance. Microservices add network failures, distributed transactions, and operational overhead, so they should solve a real problem."

**Follow-up questions**

1. *Microservices mein transaction kaise handle karte ho?* Distributed transaction (2PC) avoid karte hain; saga pattern use karte hain: har service apna local transaction karti hai aur failure par compensating action chalata hai (e.g., payment fail -> order cancel). Eventual consistency accept karni padti hai. Reliable event publishing ke liye outbox pattern (Day 5).
2. *Service boundaries kaise decide karte ho?* Business capability / bounded context se (orders, payments), table-level shared DB se nahi. Jo cheezein saath mein change hoti hain, unhein saath rakho.
3. *Shared database across services theek hai?* Generally nahi: tight coupling, ek service ka schema change doosri ko tod deta hai. Distributed monolith ban jata hai.
4. *Monolith se extract karne ka pehla step?* Module boundary clean karo, phir strangler pattern: traffic ko dheere dheere naye service par route karo.

**Common mistakes**

- "Microservices = scalable, monolith = not scalable." Galat. Monolith ko bhi horizontally scale kar sakte ho (multiple instances behind load balancer).
- Services alag, DB shared: dono ke nuksan, fayda koi nahi.
- Pehle din se 10 services banana ek 3-person team ke liye.
- Synchronous HTTP chains (A -> B -> C -> D): ek slow service sab ko slow kar deti hai.

**Revision notes**

- Default: modular monolith. Split on need: team independence, scaling hotspots, isolation.
- Microservices cost: network failures, no ACID across services, observability, deploy complexity.
- Saga + outbox for cross-service consistency.

### 1.2 Load balancing and horizontal scaling `[ESSENTIAL]`

**Concept**

- **Vertical scaling (scale up):** ek server ko bada karo (more CPU/RAM). Simple, lekin limit hai aur single point of failure.
- **Horizontal scaling (scale out):** zyada servers/instances lagao. Load balancer traffic baantta hai.
- **Load balancer (LB):** client ke saamne ek single address; peeche multiple app instances. Examples: Nginx, HAProxy, AWS ALB, cloud LBs.

**Why it matters**

Node.js single-threaded event loop par JS chalata hai, isliye ek process ek CPU core hi use karta hai (JS ke liye). Multi-core machine par multiple processes (PM2 cluster / containers) chalane padte hain, aur multiple machines par LB.

**Internal working**

```
                  +-----------+
 Client --------> |   Load    | ---> App instance 1 (Node)
 (browser/app)    | Balancer  | ---> App instance 2 (Node)
                  | (Nginx)   | ---> App instance 3 (Node)
                  +-----+-----+          |        |
                        |                v        v
                 health checks      +---------+ +-------+
                 (remove bad)       | MySQL   | | Redis |
                                    +---------+ +-------+
```

LB algorithms:

- **Round robin:** ek ke baad ek. Simple.
- **Least connections:** jis instance ke paas kam active connections, usko request. Long-lived requests ke liye better.
- **IP hash / sticky sessions:** ek client hamesha same instance par. Session in-memory ho to kaam aata hai, lekin scaling aur failover mein dikkat.
- **Health checks:** LB periodically `/health` hit karta hai; fail hone par instance rotation se bahar.

L4 vs L7: L4 (TCP level) sirf connections forward karta hai, fast. L7 (HTTP level) path/header dekh kar route kar sakta hai (`/api` -> backend, `/static` -> CDN), TLS terminate kar sakta hai.

**Stateless services** `[ESSENTIAL]`

Horizontal scaling ki shart: **app instance ke paas koi aisi state nahi honi chahiye jo sirf us instance ki memory mein ho.**

| In-memory state (bad for scale-out) | Where it should live |
|-------------------------------------|----------------------|
| Login sessions in `Map` | Redis ya JWT |
| Uploaded files in local disk | Object storage (S3) |
| Rate limit counters in `Map` | Redis |
| Cron job running on every instance | Single scheduler / queue with locking |
| In-process cache for shared data | Redis (ya short TTL + accept staleness) |

**Code example: Nginx as load balancer**

```nginx
# /etc/nginx/conf.d/api.conf
upstream node_api {
    least_conn;
    server app1:3000 max_fails=3 fail_timeout=10s;
    server app2:3000 max_fails=3 fail_timeout=10s;
    server app3:3000 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://node_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 3s;
        proxy_read_timeout 30s;
    }
}
```

Express ko batao ki woh proxy ke peeche hai, warna `req.ip` hamesha LB ka IP dega aur rate limiting toot jayegi:

```js
// src/app.js
import express from 'express';

const app = express();
// Trust exactly one proxy hop (the load balancer). Do not use `true` blindly:
// it lets clients spoof X-Forwarded-For.
app.set('trust proxy', 1);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

export default app;
```

Multi-core on a single machine (ya container ke andar): Node ka built-in `cluster` module ya PM2 cluster mode use hota hai; modern container deployments mein aksar ek process per container aur orchestrator se multiple containers chalaye jaate hain. Dono theek hain; important baat: instances stateless ho.

**Frontend connection:** CDN + multiple edge servers jaise static assets serve karte hain, waise hi LB requests ko multiple app servers mein baant-ta hai. React app ke liye "stateless" matlab state URL/server mein, local component instance mein nahi.

**Real-world scenario (banking app)**

Net banking login ke baad session Redis mein. User ka agla request kisi bhi instance par jaye, session mil jata hai. Agar session instance memory mein hota, to deploy/restart par sab users logout ho jaate aur LB sticky sessions chahiye hote.

**Interview answer:**
"To scale horizontally I would make the Node.js service stateless: sessions or tokens in Redis or JWT, files in object storage, counters in Redis. Then I would run multiple instances behind a load balancer such as Nginx or an ALB, using least-connections or round robin with health checks so unhealthy instances are removed automatically. The database then becomes the next bottleneck, so I would watch connection counts and query load."

**Follow-up questions**

1. *Sticky sessions kab use karoge?* Jab legacy app in-memory session par depend kare, ya WebSocket connections ko same server par rakhna ho. Lekin better hai state ko externalize karna; sticky sessions uneven load aur failover problems laate hain.
2. *Load balancer khud single point of failure nahi?* Haan, isliye managed LB (multi-AZ) ya active-passive/active-active pair with floating IP/DNS failover use hota hai.
3. *Zero-downtime deploy kaise?* Rolling deploy: naye instance start, health check pass, LB mein add, purane instance ko connection draining ke saath hata do. App mein graceful shutdown (Week 6 / Day 5).
4. *WebSockets ke saath scaling?* Connections sticky hote hain; instances ke beech messages ke liye Redis pub/sub ya message broker chahiye.

**Common mistakes**

- Local disk par upload save karna, phir doosre instance par file nahi milti.
- `trust proxy` set na karna: har client ka IP same dikhta hai.
- `trust proxy` ko `true` karna jab proxy chain known nahi: IP spoofing.
- Health check `/health` mein DB heavy query chalana: LB health check hi DB ko load kar de. Liveness (process up) aur readiness (dependencies ok) alag rakho.

**Revision notes**

- Scale out requires stateless instances.
- LB: algorithm + health checks + TLS termination.
- `trust proxy` for real client IP.
- Externalize sessions, files, counters, schedulers.

### 1.3 Caching `[ESSENTIAL]`

Redis ke basics Week 6 / Day 4 mein cover ho chuke hain. Yahan system design ka angle: **cache kahan lagana hai, kya cache karna hai, aur kab nahi.**

**Concept**

Cache = expensive result ko fast storage mein temporarily rakhna, taaki baar baar compute/DB hit na karna pade.

**Why it matters**

Read-heavy systems (catalog, profile, short URL redirect) mein 90%+ requests cache se serve ho sakte hain. DB load drastically kam hota hai.

**Cache layers (outer to inner)**

```
Browser cache -> CDN -> API gateway/LB cache -> App in-memory cache -> Redis -> DB buffer pool -> Disk
```

| Layer | Use for | Invalidation |
|-------|---------|--------------|
| Browser (`Cache-Control`) | Static assets, public GETs | Versioned file names, short max-age |
| CDN | Images, JS/CSS, public API responses | Purge API, TTL |
| App memory (LRU) | Tiny, hot, rarely changing data (config) | TTL; per-instance so may differ |
| Redis | Shared hot data, sessions, counters | TTL + explicit delete on write |
| MySQL buffer pool | Automatic page cache | Automatic |

**Caching patterns**

- **Cache-aside (lazy loading)** `[ESSENTIAL]`: app pehle cache check kare; miss par DB se padhe, cache mein daale. Write par DB update + cache delete.
- **Write-through:** write cache aur DB dono mein ek saath. Cache hamesha fresh, write slower.
- **Write-behind (write-back):** cache mein write, DB mein async. Fast, lekin data loss risk. `[ADVANCED]`
- **Read-through:** cache library khud DB se load kare.

**Code example: cache-aside with node-redis and mysql2**

```js
// src/products/products.service.js
import { createClient } from 'redis';
import mysql from 'mysql2/promise';

const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (err) => console.error('redis error', err.message));
await redis.connect();

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  waitForConnections: true,
});

const TTL_SECONDS = 300;

export async function getProduct(id) {
  const key = `product:${id}`;

  // 1. try cache (cache failure must not break the request)
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('cache read failed, falling back to DB', err.message);
  }

  // 2. miss -> DB
  const [rows] = await pool.execute(
    'SELECT id, name, price_cents, stock FROM products WHERE id = ?',
    [id],
  );
  const product = rows[0] ?? null;

  // 3. populate (cache "not found" briefly too, to stop penetration)
  try {
    await redis.set(key, JSON.stringify(product), {
      EX: product ? TTL_SECONDS : 30,
    });
  } catch (err) {
    console.warn('cache write failed', err.message);
  }
  return product;
}

export async function updateProductPrice(id, priceCents) {
  await pool.execute('UPDATE products SET price_cents = ? WHERE id = ?', [
    priceCents,
    id,
  ]);
  // invalidate AFTER the DB commit
  await redis.del(`product:${id}`);
}
```

Note: `await` at top-level ES modules mein allowed hai (Node 14.8+ / Node 22 fine).

**Cache problems (interview favourites)**

| Problem | Meaning | Fix |
|---------|---------|-----|
| Cache stampede / thundering herd | Hot key expire hui, hazaaron requests ek saath DB par | Request coalescing (single-flight / lock), TTL jitter, serve-stale-while-revalidate |
| Cache penetration | Non-existent keys baar baar request, hamesha DB hit | Cache null result short TTL, Bloom filter `[ADVANCED]`, input validation |
| Cache avalanche | Bahut saari keys ek saath expire | Random jitter in TTL |
| Stale data | Cache DB se purana | TTL, delete on write, accept eventual consistency |
| Hot key | Ek key par massive traffic | Local in-memory layer, key replication |

TTL jitter example:

```js
const jitter = Math.floor(Math.random() * 60); // 0-59 seconds
await redis.set(key, value, { EX: 300 + jitter });
```

Single-flight in one process (stops duplicate DB calls inside one instance):

```js
const inflight = new Map();

export function singleFlight(key, loader) {
  if (inflight.has(key)) return inflight.get(key);
  const p = loader().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
// usage: singleFlight(`product:${id}`, () => loadProductFromDb(id))
```

Yeh sirf ek instance ke andar dedupe karta hai; cross-instance ke liye Redis lock (`SET key value NX PX 5000`) use hota hai.

**Frontend connection:** React Query / SWR ka stale-while-revalidate wahi idea hai. Backend cache bhi same trade-off: speed vs freshness. `Cache-Control` headers browser cache ko control karte hain, tum already jaante ho.

**Real-world scenario (marketplace)**

Product detail page: 95% reads. Cache-aside Redis mein 5-minute TTL. Seller price update kare to DB commit ke baad `DEL product:{id}`. Flash sale mein hot product ke liye stampede avoid karne ke liye TTL jitter + single-flight.

What NOT to cache: payment balances ya inventory counts jahan stale value se money/overselling ka nuksan ho. Un par DB (source of truth) with transactions.

**Interview answer:**
"I would use cache-aside with Redis for read-heavy data: check the cache, on a miss read from MySQL and populate with a TTL, and on writes update the database and then delete the cache key. I would add TTL jitter and request coalescing to avoid stampedes, and cache negative results briefly to avoid penetration. I would not cache data where staleness is unacceptable, such as account balances or stock used for purchase decisions; those read from the primary database inside transactions."

**Follow-up questions**

1. *Write par cache update karein ya delete?* Delete safer hai. Update karne par race ho sakti hai (do writers, out-of-order cache set). Delete ke baad next read fresh load karega.
2. *DB commit ke pehle ya baad cache delete?* Baad mein. Pehle delete karoge to ek concurrent reader purana data dobara cache kar sakta hai. Phir bhi chhoti race possible hai, TTL us ko bound karta hai.
3. *Redis down ho gaya to?* Cache failure par request fail mat karo; DB par fall back karo, lekin DB ko protect karne ke liye rate limit / circuit breaker rakho. Cache ek optimization hai, dependency nahi.
4. *Eviction policy?* LRU / LFU (`maxmemory-policy allkeys-lru`). Sessions jaise must-keep data ke liye alag Redis ya `volatile-*` policy.

**Common mistakes**

- Cache ko source of truth banana.
- Bina TTL ke cache: memory badhti rehti hai, stale forever.
- Cache key mein user-specific data mix karna (user A ka data user B ko mile): key mein user id / tenant id daalo.
- Redis error par 500 return karna.

**Revision notes**

- Cache-aside default; delete on write; TTL + jitter.
- Stampede, penetration, avalanche: naam aur fix yaad rakho.
- Cache optimization hai, correctness-critical data par nahi.

### 1.4 Database scaling ladder `[ESSENTIAL]`

**Concept**

Jab DB slow ho, seedha sharding mat bolo. **Ladder** follow karo, sasti cheezein pehle:

1. **Fix queries and indexes** (Week 4 / Day 3 and Day 6). EXPLAIN chalao, missing index lagao, N+1 hatao.
2. **Right-size and tune pool**: connection pool, `innodb_buffer_pool_size`.
3. **Cache** hot reads (Redis).
4. **Vertical scale** DB instance (more RAM = bigger buffer pool).
5. **Read replicas**: reads replicas par, writes primary par.
6. **Partitioning / archiving**: purana data archive, large tables partition.
7. **Sharding**: data ko multiple DB servers mein baanta (last resort).

**Internal working: read replicas**

```
          writes                    async replication (binlog)
 App --------------> MySQL Primary ---------------------------> Replica 1
  |                                                       \----> Replica 2
  +---- reads (most) ---------------------------------------> Replicas
```

- MySQL replication binlog based hai, default **asynchronous**: replica thoda piche ho sakta hai (**replication lag**).
- Consequence: user ne profile update kiya (primary), turant read replica se padha, purana data dikha. Isse "read-your-writes" problem kehte hain.
- Fix: write ke turant baad ki reads primary se (ya us user ko kuch seconds primary par pin karo), critical reads (balance, post-payment status) hamesha primary se.

**Code example: simple read/write split**

```js
// src/db.js
import mysql from 'mysql2/promise';

export const primary = mysql.createPool({
  host: process.env.DB_PRIMARY_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

export const replica = mysql.createPool({
  host: process.env.DB_REPLICA_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

// Reads that tolerate slight staleness
export const readDb = replica;
// Writes and reads that must be fresh
export const writeDb = primary;
```

**Sharding (overview) `[ADVANCED]`**

- Shard key choose karo (e.g., `user_id`). Data `hash(user_id) % N` se shards mein.
- Problems: cross-shard JOIN/transaction nahi, resharding mushkil, hot shards, operational complexity.
- Alternative: **consistent hashing** resharding kam painful banata hai.
- Interview mein bolo: "Sharding last resort hai; pehle indexes, cache, replicas."

**Partitioning vs sharding:** partitioning ek hi DB server ke andar table ko parts mein todta hai (e.g., by date, for archiving/pruning). Sharding data ko alag servers par rakhta hai.

**Connection limits** `[ESSENTIAL]`

MySQL `max_connections` limited hai (default 151). Har connection memory leta hai (thread, buffers).

Math:

```
total connections = app instances x pool size (connectionLimit)  +  workers' pools  +  admin/monitoring

Example: 10 instances x 10 pool = 100 connections
         + 2 worker processes x 5 = 10
         + admin/migrations headroom ~ 10
         = ~120 < max_connections 151  [OK]
```

Agar autoscaling se 30 instances ho gaye: 30 x 10 = 300 > 151: `Too many connections`. Options:

- Pool size kam karo (aksar 5-10 per instance kaafi hota hai; Node async hai, queries short hoti hain).
- `max_connections` badhao (memory check karke).
- Connection proxy (ProxySQL, RDS Proxy) jo many app connections ko few DB connections mein multiplex karta hai. `[ADVANCED]`
- Slow queries fix karo: connection jitni der busy, utni zyada connections chahiye.

Little's law intuition: `connections needed ~ queries per second x average query time (seconds)`. 500 qps x 10 ms = 5 connections busy on average. Isliye bahut bade pool ki zaroorat aksar nahi hoti; zyada connections se DB par context switching badhti hai.

Pool exhaustion code smell:

```js
// BAD: connection leak -> pool exhausted -> requests hang
const conn = await pool.getConnection();
const [rows] = await conn.query('SELECT 1');
return rows; // forgot conn.release()
```

```js
// GOOD
const conn = await pool.getConnection();
try {
  const [rows] = await conn.query('SELECT 1');
  return rows;
} finally {
  conn.release();
}
```

**Frontend connection:** Browser bhi per-domain connection limit rakhta hai (HTTP/1.1 mein ~6). Waise hi DB ka connection limit ek shared scarce resource hai.

**Real-world scenario (payments)**

Black Friday: autoscaler ne API instances 8 se 40 kar diye. Har ek 20 connections khol raha tha: 800 connections vs `max_connections=500`. Result: `ER_CON_COUNT_ERROR`, checkout fail. Fix: pool size 5 per instance, RDS Proxy, aur slow report query ko replica par shift.

**Interview answer:**
"I scale the database in order of cost and risk. First indexes and query fixes, then connection pool tuning, then caching hot reads, then read replicas for read-heavy workloads while handling replication lag by reading critical data from the primary. Partitioning or archiving helps with very large tables, and sharding is a last resort because it removes cross-shard joins and transactions. I also make sure total connections, instances times pool size plus workers, stay below MySQL max_connections, or I use a connection proxy."

**Follow-up questions**

1. *Replica lag kaise handle karoge?* Critical reads primary se; read-your-writes ke liye session-level primary pinning; replica lag monitor (`Seconds_Behind_Source` / replica status) aur alert.
2. *Index kaise help karta hai scaling mein?* Query ko full scan se O(log n) lookup banata hai, CPU/IO kam, isliye same hardware zyada traffic handle karta hai. Write cost thoda badhta hai (Week 4 / Day 3).
3. *Pool size kitna rakhein?* Chhota se shuru (5-20), measure karo. Zyada pool != zyada throughput.
4. *Shard key kaise choose karte ho?* High cardinality, evenly distributed, query patterns ke saath aligned (most queries ek shard mein jayein). Auto-increment ID ya timestamp se hot shard banta hai.

**Common mistakes**

- Seedha sharding/NoSQL suggest karna bina indexes check kiye.
- Replica par balance check karna.
- Har instance ka pool size 100.
- Connection release bhoolna (leak).
- Primary ko replica ke saath equal weight dena aur lag ignore karna.

**Revision notes**

- Ladder: indexes -> cache -> vertical -> replicas -> partition -> shard.
- Replication async => lag => read-your-writes problem.
- Connection math: instances x pool <= max_connections.

### Day 1 wrap-up

**Key concepts to remember**

- Modular monolith default; microservices need a justification.
- Stateless instances + LB + health checks = horizontal scaling.
- Cache-aside, delete on write, TTL jitter; never cache correctness-critical balances.
- DB scaling ladder; replica lag; connection limit arithmetic.
- `trust proxy` and externalized state.

**Five revision questions**

1. Modular monolith ko microservices se kab replace karoge, aur kyun?
2. Horizontal scaling ke liye Node service ko stateless kaise banate hain? Teen examples do.
3. Cache stampede kya hai aur do fixes batao.
4. Replica lag kya hai aur kaun si reads primary se hi honi chahiye?
5. 12 instances, pool size 15, 3 workers pool size 5, `max_connections=151`: kya problem hai, fix kya?

**Practical coding task**

`getProduct` function ko extend karo: Redis lock (`SET lock:product:{id} 1 NX PX 5000`) se cross-instance single-flight banao taaki cache miss par sirf ek instance DB hit kare aur baaki thodi der wait karke cache dobara padhein. Fallback: lock na mile aur cache bhi empty ho to 100 ms ke baad ek baar retry, phir DB.

**Self-assessment checklist**

- [ ] Main monolith vs microservices ka trade-off table bina dekhe bol sakta hoon.
- [ ] Main stateless ka matlab aur 3 externalized states bata sakta hoon.
- [ ] Main cache-aside code likh sakta hoon aur invalidation order samjha sakta hoon.
- [ ] Main DB scaling ladder 7 steps mein bol sakta hoon.
- [ ] Main connection limit calculation kar sakta hoon.

---

## Day 2 - Rate limiter and notification system

**Learning objectives**

- Rate limiter ko requirements se design kar sako: algorithm choose karna, Redis mein atomically implement karna.
- Fixed window, sliding window, token bucket, leaky bucket ke trade-offs bata sako.
- Failure behavior (fail open vs fail closed) justify kar sako.
- Notification system ko simplest version (DB table + worker) se queue-based version tak evolve kar sako.
- At-least-once delivery, dedupe aur retry ko notification context mein explain kar sako.

Estimated time: 55 min rate limiter, 55 min notification system, 10 min revision questions.

### 2.1 Design: Rate limiter `[ESSENTIAL]`

Week 5 / Day 5 mein rate limiting ka security angle (brute force, abuse) aur `express-rate-limit` basics cover hue. Yahan hum **system design** karte hain: apna limiter design karna, jo multiple instances ke saath sahi chale.

**Concept**

Rate limiter ek client (user / IP / API key) ko ek time window mein limited requests karne deta hai. Limit cross hone par HTTP `429 Too Many Requests`.

**Why it matters**

Abuse/DDoS se protection, fair usage (ek heavy client baaki ko starve na kare), cost control (SMS/email provider ka bill), downstream protection (DB, third-party API).

#### Requirements

Functional:

- Per key (user id, API key, ya IP) limit: e.g., 100 requests/minute.
- Different limits per route/plan (login 5/min, search 60/min, premium 1000/min).
- Limit cross hone par 429 + `Retry-After` header.
- Informative headers: remaining, reset time.

Non-functional:

- Low latency: limiter har request par chalta hai, overhead < 2-5 ms.
- Correct across multiple app instances (distributed).
- Highly available: limiter fail ho to poora API down nahi hona chahiye (policy decide karo).
- Memory bounded: purane keys expire hon.
- Reasonable accuracy: thoda over/under limit acceptable ya strict? (Interview mein poochho.)

Estimate: 5,000 req/s, 1 million active keys. Redis ek node par 50k-100k+ simple ops/s handle kar sakta hai, isliye ek Redis kaafi hai. Memory: 1M keys x ~100 bytes = ~100 MB.

#### Algorithms

| Algorithm | Idea | Pros | Cons |
|-----------|------|------|------|
| Fixed window counter | Window (e.g., 1 min) mein count, window badalte hi reset | Bahut simple, kam memory | Boundary burst: 100 requests at 12:00:59 + 100 at 12:01:00 = 200 in 2 sec |
| Sliding window log | Har request ka timestamp sorted set mein, window ke bahar ke hata do | Accurate | Memory O(requests per window) |
| Sliding window counter | Current + previous window ka weighted count | Accurate approx, kam memory | Approximation |
| Token bucket | Bucket mein tokens, constant rate se refill, request = token | Bursts allow, smooth average, kam memory (2 values) | Do values atomically update karni padti hain |
| Leaky bucket | Queue jo fixed rate se drain hota hai | Smooth output rate | Burst queue/drop, latency |

Recommendation: **token bucket** (burst-friendly, O(1) memory, industry standard) ya simple cases ke liye fixed window. Interview mein bolo: "Main fixed window se start karunga kyunki simplest hai, boundary-burst problem bataunga, phir token bucket par jaunga."

#### Simplest working design: in-memory, single instance

```js
// src/rate-limit/memory-limiter.js  (single instance only, for learning)
const windows = new Map(); // key -> { count, resetAt }

export function memoryRateLimit({ limit, windowMs, keyFn }) {
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let w = windows.get(key);
    if (!w || now >= w.resetAt) {
      w = { count: 0, resetAt: now + windowMs };
      windows.set(key, w);
    }
    w.count += 1;
    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', Math.max(0, limit - w.count));
    if (w.count > limit) {
      const retryAfter = Math.ceil((w.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: 'RATE_LIMITED', retryAfterSeconds: retryAfter });
    }
    next();
  };
}
```

Kahan toot-ta hai:

1. Multiple instances: har instance ki alag `Map`, effective limit = limit x instances.
2. Restart par counters reset.
3. `Map` mein purani keys kabhi delete nahi hoti: memory leak (cleanup interval chahiye).

Isliye shared store: **Redis**.

#### Redis fixed window (simple distributed version)

```js
// INCR is atomic. Problem: if the process dies between INCR and EXPIRE the key never expires.
// Fix: set TTL only when the key is created, inside one atomic Lua script.
const FIXED_WINDOW_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`;
```

Common mistake: `INCR` ke baad alag se `EXPIRE` call karna. Beech mein crash ho to key bina TTL ke reh jati hai aur user permanently blocked.

#### Final design: Redis token bucket via Lua

Token bucket mein read-modify-write chahiye (tokens padho, refill compute karo, minus karo, likho). Do instances ek saath chalayein to race ho jayegi. Redis commands single-threaded execute hote hain aur Lua script atomically chalti hai, isliye poora logic ek script mein.

```js
// src/rate-limit/token-bucket.js
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (e) => console.error('redis error', e.message));
await redis.connect();

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_per_sec = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])

local t = redis.call('TIME')
local now_ms = t[1] * 1000 + math.floor(t[2] / 1000)

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
if tokens == nil then
  tokens = capacity
  ts = now_ms
end

local elapsed = math.max(0, now_ms - ts)
tokens = math.min(capacity, tokens + elapsed * refill_per_sec / 1000)

local allowed = 0
local retry_ms = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retry_ms = math.ceil((cost - tokens) * 1000 / refill_per_sec)
end

redis.call('HSET', key, 'tokens', tokens, 'ts', now_ms)
redis.call('PEXPIRE', key, math.ceil(capacity / refill_per_sec * 1000) * 2)
return { allowed, math.floor(tokens), retry_ms }
`;

export async function consume(key, { capacity, refillPerSec, cost = 1 }) {
  const [allowed, remaining, retryMs] = await redis.eval(TOKEN_BUCKET_LUA, {
    keys: [`rl:${key}`],
    arguments: [String(capacity), String(refillPerSec), String(cost)],
  });
  return { allowed: allowed === 1, remaining, retryMs };
}
```

Logic: bucket ka `tokens` aur last `ts` store hota hai. Har request par elapsed time x refill rate tokens add karo (capacity tak), phir cost minus karo. Agar tokens kam hain to retry time compute karo. `PEXPIRE` idle keys ko cleanup karta hai (bucket full hone ka time ka 2x).

Express 5 middleware:

```js
// src/rate-limit/middleware.js
import { consume } from './token-bucket.js';

export function rateLimit({ capacity, refillPerSec, keyFn, failOpen = true }) {
  return async (req, res, next) => {
    const id = keyFn(req);
    try {
      const r = await consume(id, { capacity, refillPerSec });
      res.set('RateLimit-Limit', String(capacity));
      res.set('RateLimit-Remaining', String(r.remaining));
      if (!r.allowed) {
        res.set('Retry-After', String(Math.ceil(r.retryMs / 1000)));
        return res.status(429).json({
          error: 'RATE_LIMITED',
          retryAfterSeconds: Math.ceil(r.retryMs / 1000),
        });
      }
      return next();
    } catch (err) {
      // Redis unreachable or script error
      if (failOpen) return next(); // availability over strictness
      return res.status(503).json({ error: 'RATE_LIMITER_UNAVAILABLE' });
    }
  };
}

// usage
// app.use('/api', rateLimit({ capacity: 100, refillPerSec: 100 / 60,
//   keyFn: (req) => req.user?.id ?? req.ip }));
// app.post('/login', rateLimit({ capacity: 5, refillPerSec: 5 / 60,
//   keyFn: (req) => `login:${req.ip}`, failOpen: false }), loginHandler);
```

Express 5 mein async handler/middleware ka rejected promise automatically error handler tak jata hai. Express 4 mein try/catch ya wrapper chahiye. Yahan try/catch isliye hai ki fail-open ka decision humein khud lena hai.

#### API design

Limiter mostly middleware (library) hai, lekin shared gateway/service ke liye:

```
POST /internal/v1/ratelimit/check
Request : { "key": "user:42", "rule": "api_default", "cost": 1 }
Response: 200 { "allowed": true,  "remaining": 87, "retryAfterMs": 0 }
          200 { "allowed": false, "remaining": 0,  "retryAfterMs": 1200 }
```

Client-facing response:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 2
RateLimit-Limit: 100
RateLimit-Remaining: 0
Content-Type: application/json

{ "error": "RATE_LIMITED", "retryAfterSeconds": 2 }
```

Header naming version-dependent hai: purane APIs `X-RateLimit-*` use karte hain, IETF draft `RateLimit-*` hai. Consistent raho aur document karo.

#### MySQL schema (rules/config, not counters)

Counters Redis mein rehte hain (fast, expiring). MySQL mein sirf **configuration** aur audit, kyunki rules rarely change hote hain aur durable hone chahiye.

```sql
CREATE TABLE rate_limit_rules (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rule_name      VARCHAR(64)  NOT NULL,                -- 'api_default', 'login', 'search'
  plan           VARCHAR(32)  NOT NULL DEFAULT 'free', -- 'free', 'pro'
  capacity       INT UNSIGNED NOT NULL,                -- bucket size (burst)
  refill_per_sec DECIMAL(10,4) NOT NULL,               -- sustained rate
  fail_open      TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rule_plan (rule_name, plan)
) ENGINE=InnoDB;

CREATE TABLE rate_limit_blocks (                       -- optional: manual/automatic bans
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject       VARCHAR(128) NOT NULL,                 -- 'ip:1.2.3.4' or 'user:42'
  reason        VARCHAR(255) NOT NULL,
  blocked_until DATETIME     NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subject_until (subject, blocked_until)
) ENGINE=InnoDB;
```

App rules ko startup par load karke memory mein cache kare (e.g., 60-second refresh) taaki har request par MySQL hit na ho.

#### Components

- Express middleware (limiter library) in every API instance.
- Redis (counters/buckets), optionally replica for failover.
- MySQL (rules, blocks).
- Optional: API gateway/Nginx `limit_req` as the first coarse layer (cheap IP-level filtering before requests reach Node).

#### Data flow

```
Client
  |
  v
+-----------------+   coarse per-IP limit (limit_req)
| Nginx / Gateway |------------------------------------> 429 (cheap reject)
+--------+--------+
         v
+---------------------+     EVAL token-bucket Lua (atomic)     +-------+
| Node.js API         | -------------------------------------> | Redis |
| rateLimit middleware| <------------------------------------- +-------+
+--------+------------+     { allowed, remaining, retryMs }
         |
   allowed? ----no----> 429 + Retry-After
         |
        yes
         v
   route handler -> MySQL
```

#### Failure scenarios

| Failure | What happens | Mitigation |
|---------|--------------|------------|
| Redis down/slow | Limiter cannot decide | **Fail open** for normal APIs (availability), **fail closed** for security-sensitive ones (login, OTP). Short Redis timeout (e.g., 50 ms). Local in-memory fallback limiter (approximate). |
| Redis restarts (data loss) | Buckets reset, clients get a fresh quota | Acceptable for most; use AOF persistence if not |
| Clock skew between app instances | Wrong refill | Use Redis `TIME` inside Lua (done above), not app clock |
| Race between instances | Over-limit requests slip through | Atomic Lua script (done) |
| Shared IP (office NAT, mobile carrier) | Many users blocked together | Prefer user id / API key after auth; IP only for unauthenticated routes |
| Spoofed `X-Forwarded-For` | Attacker rotates fake IPs | `trust proxy` sahi hop count par set karo |
| Hot key (one abusive client) | One Redis key gets huge traffic | Nginx-level block, ban table |

#### Trade-offs

- **Accuracy vs cost:** sliding log accurate but memory heavy; token bucket cheap and burst-friendly; fixed window cheapest but boundary burst.
- **Fail open vs fail closed:** availability vs protection. Per-route decision.
- **Centralized Redis vs local limiters:** central = accurate, extra network hop (~1 ms); local = fast, approximate (limit x instances). Hybrid: local limiter with a quota slice synced to Redis periodically. `[ADVANCED]`
- **Rate limit at gateway vs in app:** gateway protects Node early; app knows user/plan.

#### Scaling options (only when justified)

1. Start: one Redis, one script call per request (~0.2-1 ms). Yeh thousands of req/s handle karta hai.
2. Redis replica + automatic failover (Sentinel / managed service) for availability.
3. Redis Cluster: keys ko hash se shard karo. Har limiter operation ek hi key touch karta hai, isliye cleanly shard hota hai.
4. Redis calls kam karo: obvious bans memory mein pre-check, coarse limits Nginx par, health checks aur static assets limiter se skip.
5. Multi-region: per-region limits (approximate global) rather than synchronous cross-region calls.

**Frontend connection:** Client side tum debounce/throttle karte ho (search box). Server side rate limiter wahi throttle hai, lekin client ko trust nahi kar sakte, isliye server par enforce karna padta hai. Frontend ko `Retry-After` honor karke backoff karna chahiye.

**Real-world scenario (payments / banking)**

OTP endpoint: 3 requests per 10 minutes per phone number, plus 20 per hour per IP; fail closed (agar limiter down hai to OTP bhejna band, kyunki SMS cost aur abuse risk). Normal product browsing: 300/min per user, fail open.

**Interview answer:**
"I would clarify the limits: per user, API key or IP, and whether strict accuracy is needed. I would start with a fixed-window counter in memory to show the idea, then point out that it breaks with multiple instances and has a boundary burst problem. The production design is a token bucket stored in Redis, updated atomically with a Lua script that uses Redis time, so all Node instances share one view. The middleware returns 429 with a Retry-After header. If Redis is unavailable I fail open for normal endpoints and fail closed for sensitive ones such as login or OTP. Rules live in MySQL and are cached in memory. To scale, I would add Redis replication and then Redis Cluster, since each decision touches a single key, and push coarse per-IP limits to Nginx."

**Follow-up questions**

1. *Fixed window ki problem kya hai?* Window boundary par burst: limit 100/min ho to 12:00:59 par 100 aur 12:01:00 par 100 = 2 second mein 200. Sliding window ya token bucket isse solve karte hain.
2. *Token bucket aur leaky bucket mein difference?* Token bucket burst allow karta hai (bucket full ho to turant capacity tak requests); leaky bucket output rate ko smooth/constant rakhta hai, burst ko queue karta ya drop karta hai.
3. *Distributed race kaise avoid karte ho?* Read-modify-write ko Redis Lua ya `INCR` jaise atomic commands mein rakhte hain. App-level GET then SET race karta hai.
4. *Redis down ho to?* Per-route policy: fail open ya closed; short timeout; optional local fallback.
5. *Different plans ke liye limits?* Rules table (plan -> capacity/refill), user ka plan token/DB se, app memory mein rules cache.
6. *Logged-out users ko kaise limit karoge?* IP (correct `trust proxy` ke saath), plus CAPTCHA escalation. IP shared hoti hai, isliye limits generous rakho.

**Common mistakes**

- In-memory counters in a multi-instance deployment.
- GET + SET (non-atomic) in Redis.
- `INCR` and `EXPIRE` as two separate calls.
- Using app server clock across instances.
- Using only IP behind a proxy without `trust proxy` (everyone shares the LB IP).
- No `Retry-After`, so clients retry immediately and make it worse.
- Limiting health-check endpoints, causing LB to mark instances unhealthy.

**Revision notes**

- Token bucket in Redis Lua = standard answer; fixed window = simplest.
- Atomicity (Lua), Redis TIME, TTL on keys.
- 429 + Retry-After; fail open vs closed per route.
- Counters in Redis, rules in MySQL.

### 2.2 Design: Notification system `[ESSENTIAL]`

**Concept**

System jo events (order placed, OTP, password reset, promo) ko user tak email, SMS, push ya in-app notification ke roop mein pahunchata hai, reliably.

**Why it matters**

Notifications third-party providers (SES, Twilio, FCM) par depend karte hain: slow, rate-limited, aur kabhi fail. Agar API request ke andar synchronous bhejoge to checkout slow ya fail ho jayega. Yeh design async processing aur reliability ka classic example hai.

#### Requirements

Functional:

- Channels: email, SMS, push, in-app.
- Triggers: transactional (OTP, order confirmation) aur marketing/bulk (campaign).
- Templates with variables, localization.
- User preferences (opt-out per channel/category). Transactional security messages opt-out nahi hote.
- Delivery status tracking (queued, sent, delivered, failed).
- Scheduling (send at 9 AM) `[ADVANCED]`.

Non-functional:

- Reliability: notification lose nahi honi chahiye (at-least-once).
- Duplicate minimize: same OTP do baar na jaye (dedupe).
- Latency: OTP seconds mein; marketing minutes mein theek.
- Isolation: bulk campaign OTP ko delay na kare (priority).
- Provider rate limits respect karna.
- Observability: kitne sent/failed.

Estimate: 1M users, 3 notifications/user/day = ~3M/day = ~35/s average, peak 10x = ~350/s. Ek MySQL + chhote worker pool yeh handle kar sakta hai. Kafka ki zaroorat nahi.

#### Simplest working design (and where it breaks)

Version 0: request handler ke andar sync send.

```js
// WRONG for production: provider latency/failure is now your API's latency/failure
app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);
  await sendEmail(order.userEmail, 'Order placed'); // 3 seconds, or throws
  res.status(201).json(order);
});
```

Problems: slow response, provider down => order API fail, retry par duplicate email, crash par notification lost.

Version 1 (recommended starting point): **DB table as the queue + a worker**. Request mein sirf notification ka row insert (order ke saath same transaction mein, to "order ho gaya lekin notification record nahi" ka gap nahi). Alag worker rows uthakar bhejta hai. Yeh **transactional outbox** idea hai (Day 5 mein detail).

Version 2: jab volume/latency zyada ho, MySQL polling ki jagah real queue (BullMQ/Redis, SQS, RabbitMQ) with per-channel workers.

Interview mein bolo: "350/s peak par table + SKIP LOCKED workers kaafi hain. Jab volume 10x ho ya multiple consumers/fan-out chahiye, queue add karunga."

#### API design

```
Internal (called by other modules/services):
POST /v1/notifications
  Headers: Idempotency-Key: order-1001-confirmation
  Body: {
    "userId": 42,
    "type": "ORDER_CONFIRMED",
    "channels": ["email", "push"],      // optional; else derived from preferences
    "data": { "orderId": 1001, "total": "49.99" },
    "priority": "high",
    "sendAt": null
  }
  202 Accepted { "notificationId": 9001, "status": "queued" }

Client-facing:
GET  /v1/me/notifications?limit=20&cursor=...     -> in-app list
POST /v1/me/notifications/:id/read                -> mark read
GET  /v1/me/notification-preferences
PUT  /v1/me/notification-preferences
     Body: { "marketing_email": false, "order_sms": true }

Provider callbacks:
POST /webhooks/email-provider    -> delivered / bounced / complained (verify signature)
```

`202 Accepted` kyunki sending async hai: request accept hui, delivery abhi nahi hui.

#### MySQL schema

```sql
CREATE TABLE notification_templates (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type        VARCHAR(64)  NOT NULL,         -- ORDER_CONFIRMED
  channel     ENUM('email','sms','push','in_app') NOT NULL,
  locale      VARCHAR(10)  NOT NULL DEFAULT 'en',
  subject     VARCHAR(255) NULL,
  body        TEXT         NOT NULL,         -- 'Hi {{name}}, order {{orderId}} placed'
  PRIMARY KEY (id),
  UNIQUE KEY uq_tpl (type, channel, locale)
) ENGINE=InnoDB;

CREATE TABLE notification_preferences (
  user_id     BIGINT UNSIGNED NOT NULL,
  category    VARCHAR(64)  NOT NULL,         -- 'marketing', 'order_updates'
  channel     ENUM('email','sms','push','in_app') NOT NULL,
  enabled     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, category, channel)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  type            VARCHAR(64)  NOT NULL,
  channel         ENUM('email','sms','push','in_app') NOT NULL,
  payload         JSON         NOT NULL,
  priority        TINYINT      NOT NULL DEFAULT 5,   -- 1 high ... 9 low
  status          ENUM('queued','processing','sent','delivered','failed','dead')
                  NOT NULL DEFAULT 'queued',
  dedupe_key      VARCHAR(128) NOT NULL,             -- e.g. 'order-1001-confirmation:email'
  attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_until    DATETIME     NULL,                 -- lease for crash recovery
  provider_msg_id VARCHAR(128) NULL,
  last_error      VARCHAR(500) NULL,
  read_at         DATETIME     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dedupe (dedupe_key),
  KEY idx_due (status, next_attempt_at, priority),
  KEY idx_user_created (user_id, created_at)
) ENGINE=InnoDB;
```

Key choices:

- `UNIQUE(dedupe_key)`: producer retry kare to duplicate row nahi banta (`INSERT ... ON DUPLICATE KEY UPDATE id = id`).
- `idx_due (status, next_attempt_at, priority)`: worker query ke liye. `status='queued' AND next_attempt_at <= NOW()` fast hoti hai.
- `locked_until`: worker crash par row hamesha `processing` na reh jaye.
- Ek logical notification ke multiple channels = multiple rows (per channel status/retry independent).

#### Components

- **Producer** (order service / any module): notification rows insert karta hai (same DB transaction as business change).
- **Preference + template resolver:** channels filter, template render.
- **Worker pool:** rows claim karke provider adapter call karta hai.
- **Provider adapters** (SES/Twilio/FCM) with timeout; ek interface, multiple vendors (failover possible).
- **Webhook handler:** delivery status updates.
- **DLQ (dead state):** max attempts ke baad `dead`, alert.

#### Data flow

```
 Order API
    | BEGIN
    |  INSERT orders ...
    |  INSERT notifications (status=queued, dedupe_key)   <- same transaction
    | COMMIT
    v
 +-----------+        claim batch                       +-----------------+
 |  MySQL    | <--------------------------------------- | Worker (N procs)|
 | notifs    |  SELECT ... FOR UPDATE SKIP LOCKED       |  - check prefs  |
 +-----------+  set status=processing, locked_until     |  - render tmpl  |
       ^                                                |  - call provider|
       | update status sent / retry / dead              +--------+--------+
       +------------------------------------------------------- |
                                                                v
                                                    +----------------------+
                                                    | Email / SMS / Push   |
                                                    | providers (3rd party)|
                                                    +----------+-----------+
                                                               | webhook
                                                               v
                                                    POST /webhooks/... -> status=delivered/failed
```

#### Worker code: claim with SKIP LOCKED

`FOR UPDATE SKIP LOCKED` MySQL 8.0+ mein available hai. Multiple workers ek hi row ko nahi uthate: locked rows skip ho jaate hain.

```js
// src/notifications/worker.js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 5 });

const MAX_ATTEMPTS = 6;
const LEASE_SECONDS = 60;

async function claimBatch(limit = 20) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, user_id, type, channel, payload, attempts
         FROM notifications
        WHERE (status = 'queued' AND next_attempt_at <= NOW())
           OR (status = 'processing' AND locked_until < NOW())
        ORDER BY priority ASC, next_attempt_at ASC
        LIMIT ?
        FOR UPDATE SKIP LOCKED`,
      [limit],
    );
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      await conn.query(
        `UPDATE notifications
            SET status = 'processing',
                attempts = attempts + 1,
                locked_until = DATE_ADD(NOW(), INTERVAL ? SECOND)
          WHERE id IN (?)`,
        [LEASE_SECONDS, ids],
      );
    }
    await conn.commit();
    return rows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

function backoffSeconds(attempt) {
  const base = Math.min(2 ** attempt * 5, 3600);            // 10s, 20s, 40s ... max 1h
  return Math.floor(base / 2 + Math.random() * (base / 2)); // jitter
}

async function sendViaProvider(n) {
  const res = await fetch(process.env.EMAIL_PROVIDER_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      'idempotency-key': `notification-${n.id}`, // if provider supports it
    },
    body: JSON.stringify({ userId: n.user_id, template: n.type, data: n.payload }),
    signal: AbortSignal.timeout(5000), // never wait forever on a provider
  });
  if (res.status >= 500 || res.status === 429) {
    const e = new Error(`provider ${res.status}`);
    e.retryable = true;
    throw e;
  }
  if (!res.ok) {
    const e = new Error(`provider rejected ${res.status}`);
    e.retryable = false; // 4xx: bad address / payload, retrying will not help
    throw e;
  }
  const body = await res.json();
  return { messageId: body.id };
}

async function processOne(n) {
  const attempt = n.attempts + 1; // DB already incremented it in claimBatch
  try {
    const result = await sendViaProvider(n);
    await pool.execute(
      `UPDATE notifications SET status = 'sent', provider_msg_id = ?, last_error = NULL
        WHERE id = ?`,
      [result.messageId, n.id],
    );
  } catch (err) {
    // network errors/timeouts have no "retryable" flag: treat them as retryable
    const retryable = err.retryable ?? true;
    if (!retryable || attempt >= MAX_ATTEMPTS) {
      await pool.execute(
        `UPDATE notifications SET status = 'dead', last_error = ? WHERE id = ?`,
        [String(err.message).slice(0, 500), n.id],
      );
      return;
    }
    await pool.execute(
      `UPDATE notifications
          SET status = 'queued',
              next_attempt_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
              last_error = ?
        WHERE id = ?`,
      [backoffSeconds(attempt), String(err.message).slice(0, 500), n.id],
    );
  }
}

let running = true;
process.on('SIGTERM', () => {
  running = false;
});

while (running) {
  const batch = await claimBatch();
  if (batch.length === 0) {
    await new Promise((r) => setTimeout(r, 1000)); // idle poll interval
    continue;
  }
  await Promise.allSettled(batch.map(processOne));
}
await pool.end();
```

`AbortSignal.timeout()` aur global `fetch` Node 18+ mein hain, Node 22 mein fine. Provider URL/payload yahan illustrative hain; real SES/Twilio SDK ka shape alag hoga. `mysql2` ka `query` (execute nahi) `IN (?)` ke liye array expand karta hai, isliye wahan `query` use hua.

Producer side (same transaction as business write):

```js
// inside createOrder transaction (conn from pool.getConnection())
await conn.execute(
  `INSERT INTO notifications (user_id, type, channel, payload, dedupe_key)
   VALUES (?, 'ORDER_CONFIRMED', 'email', ?, ?)
   ON DUPLICATE KEY UPDATE id = id`,
  [userId, JSON.stringify({ orderId }), `order-${orderId}-confirmation:email`],
);
```

#### Failure scenarios

| Failure | Behavior | Mitigation |
|---------|----------|------------|
| Provider timeout / 5xx | Retry with exponential backoff + jitter | Max attempts, then `dead` + alert |
| Provider 4xx (invalid number) | Do not retry | Mark dead; suppress bad addresses |
| Worker crashes mid-send | Row stuck in `processing` | `locked_until` lease; another worker reclaims after expiry |
| Crash after provider accepted, before DB update | Reclaimed => **duplicate send** (at-least-once) | Provider idempotency key if supported; accept rare duplicate for non-critical; OTP: code validity dedupes |
| Producer retries | Duplicate rows | `UNIQUE(dedupe_key)` |
| Bulk campaign floods queue | OTPs delayed | Priority column, separate worker pools/queues for high priority |
| Provider rate limit (429) | Throttled | Worker concurrency cap + token bucket per provider (reuse 2.1) |
| DB down | Producers fail, workers idle | Business write also fails (consistent); worker resumes later |
| User unsubscribed / prefs changed | Must not send | Check preferences at send time, not only at enqueue time |
| Poison message (always fails) | Infinite retry loop | `MAX_ATTEMPTS` + dead state |

#### Trade-offs

- **DB-as-queue vs real queue:** DB table = transactional with business data, no new infra, easy to inspect/replay; polling load on MySQL and limited throughput. Real queue = high throughput, push-based, but dual-write problem (DB commit and enqueue not atomic) unless you use outbox.
- **At-least-once vs exactly-once:** exactly-once across third-party providers practically impossible; design for at-least-once plus idempotent/dedupe.
- **Send-time vs enqueue-time preference check:** send-time safer (user may opt out after enqueue).
- **Per-channel rows vs one row:** per-channel rows give independent retries and status, cost more rows.

#### Scaling options (when justified)

1. More workers (SKIP LOCKED makes this safe). Workers stateless hain.
2. Index tuning and batch updates; archive `sent` rows older than N days (partition by month).
3. Real queue (BullMQ on Redis, SQS, RabbitMQ) jab polling cost ya throughput hurt kare; outbox table rakho taaki publishing reliable rahe.
4. Separate queues per channel and priority (OTP queue marketing ke peeche kabhi nahi rukti).
5. Bulk campaigns: fan-out in batches (campaign job 1000-user batch jobs mein expand hota hai, har batch job notifications create karta hai) instead of one giant insert.
6. Provider failover (primary SMS provider down => secondary) adapter interface ke peeche.
7. In-app notifications: MySQL mein store, online users ko WebSocket/SSE se push, instances ke beech Redis pub/sub. `[ADVANCED]`

**Frontend connection:** React app mein toast/inbox UI notifications dikhata hai; backend mein in-app notification row `GET /me/notifications` se aati hai. Push notification service worker + FCM tum frontend side se jaante ho; backend sirf token store karke FCM ko call karta hai.

**Real-world scenario (marketplace)**

Buyer ne order place kiya: order insert + 2 notification rows (email, push) ek transaction mein. Worker 1 second ke andar email bhej deta hai. SES temporarily 503 de to row 10s, 20s, 40s ke baad retry hoti hai; buyer ka checkout kabhi slow nahi hua. Seller ko "new order" SMS: Twilio rate limit ke liye worker concurrency 5.

**Interview answer:**
"I would not send notifications inside the request path. The producer inserts a notification row, in the same database transaction as the business change, with a unique dedupe key. A separate worker pool claims due rows using SELECT FOR UPDATE SKIP LOCKED, checks user preferences, renders the template, and calls the provider with a timeout. On retryable failures it reschedules with exponential backoff and jitter, and after a maximum number of attempts it marks the row dead and alerts. Delivery is at-least-once, so I use dedupe keys and provider idempotency where available. A lease column recovers rows from crashed workers. For scale I add workers, then separate queues per channel and priority, and move to a message queue like SQS or BullMQ when the polling load or throughput justifies it, keeping an outbox so publishing stays reliable."

**Follow-up questions**

1. *Duplicate notification kaise roke?* Producer side `UNIQUE(dedupe_key)`; consumer side provider idempotency key; crash window mein rare duplicate accept karna padta hai (at-least-once).
2. *SKIP LOCKED kya karta hai?* Locked rows ko wait kiye bina skip kar deta hai, to multiple workers disjoint rows pakadte hain. MySQL 8.0+ (aur PostgreSQL 9.5+).
3. *Worker crash ho jaye to?* `processing` + `locked_until` lease; expiry ke baad koi aur worker reclaim karta hai.
4. *OTP aur marketing ek hi system mein kaise?* Priority + alag queue/worker pool; OTP ke liye short TTL (expire hone ke baad bhejna bekaar).
5. *Ordering guarantee?* Notifications ke liye strict order generally zaroori nahi; zaroorat ho to per-user ordering (same partition key).
6. *Millions of users ko campaign kaise bhejoge?* Batch fan-out jobs, provider rate limit ke andar throttle, suppression list, unsubscribe check, idempotent batch ids.

**Common mistakes**

- Request ke andar sync send.
- Enqueue DB commit ke baad alag se karna (commit ho gaya, enqueue fail => lost event). Outbox use karo.
- Infinite retries; no dead state.
- 4xx errors ko retry karna.
- Retry without jitter (thundering herd on provider recovery).
- Preferences sirf enqueue time par check karna.
- Provider call par timeout na lagana (worker hang).

**Revision notes**

- Async via table/queue, 202 Accepted.
- Outbox (same txn), dedupe_key unique, SKIP LOCKED, lease, backoff + jitter, dead state.
- At-least-once + idempotency; priority isolation; scale workers first.

### Day 2 wrap-up

**Key concepts to remember**

- Rate limiter: token bucket + Redis Lua atomicity + Redis TIME; fail open/closed per route; 429 + Retry-After.
- Counters in Redis, rules in MySQL.
- Notification system: transactional insert, worker claims with SKIP LOCKED, backoff + jitter, dead letters, dedupe, at-least-once.
- Simplest first: table + worker; queue only when numbers justify.

**Five revision questions**

1. Fixed window aur token bucket ka difference kya hai? Boundary burst example do.
2. Redis mein limiter ke liye Lua script kyun chahiye? `INCR` + `EXPIRE` ka kya risk hai?
3. Login endpoint ke liye limiter fail open hona chahiye ya fail closed? Kyun?
4. Notification system mein `UNIQUE(dedupe_key)` aur `locked_until` kya problems solve karte hain?
5. At-least-once delivery mein duplicate kyun aate hain aur unhe kaise handle karte hain?

**Practical coding task**

Token bucket ko apne machine par Redis (Docker se, Day 6 dekho) ke saath chalao. 10 parallel requests (`Promise.all`) ek hi key par bhejo jahan `capacity=5, refillPerSec=1`. Verify karo exactly 5 allowed aur 5 denied hain. Phir script mein `redis.call('TIME')` hata kar app clock bhejne wala version banao aur do processes se skew simulate karke dekho kya galat hota hai.

**Self-assessment checklist**

- [ ] Main 4 rate limiting algorithms ka trade-off bol sakta hoon.
- [ ] Main token bucket Lua script ka logic line by line samjha sakta hoon.
- [ ] Main notification system ko table+worker se queue tak evolve karna bata sakta hoon.
- [ ] Main duplicate aur lost notification ke cases aur fixes bata sakta hoon.
- [ ] Main dono designs ka failure table bina dekhe bol sakta hoon.

---

## Day 3 - URL shortener and file upload architecture

**Learning objectives**

- URL shortener ko requirements se design karo: short code generation ke options aur unke trade-offs.
- 301 vs 302 redirect, cache-aside for read-heavy traffic, analytics ko async kaise karte hain.
- File upload ka simplest version (server par multer) aur production version (presigned URL direct-to-object-storage) dono samjho.
- Upload ke security aur failure cases (orphans, malicious files, abandoned uploads) handle karna.

Estimated time: 55 min URL shortener, 55 min file upload, 10 min revision questions.

### 3.1 Design: URL shortener `[ESSENTIAL]`

**Concept**

Service jo lambe URL ko chhote code mein badalti hai (`https://sho.rt/aZ3kP9x`) aur us code par visit karne par original URL par redirect karti hai.

**Why it matters**

Yeh ek classic interview question hai kyunki isme chhoti si problem ke andar kai core ideas aate hain: unique ID generation, read-heavy traffic, caching, DB schema/collation, redirect semantics, analytics.

#### Requirements

Functional:

- Long URL do, short URL milega.
- Short URL open karo, original par redirect.
- Optional: custom alias, expiry date, user ke apne links list, click analytics.

Non-functional:

- Redirect very fast (p99 < 50-100 ms) aur highly available (links break nahi hone chahiye).
- Read-heavy: reads:writes ~ 100:1.
- Codes unique hone chahiye; guess karna mushkil (privacy) ideally.
- Durable: link ek baar bana to saalon tak chalna chahiye (jab tak expire na ho).

Estimate:

```
New URLs      : 100 million / month  -> ~40 writes/s average
Redirects     : 100:1 read ratio     -> ~4,000 reads/s average, peak ~10x = 40,000/s
Storage       : 100M/month x 12 x 5 years = 6 billion rows x ~500 bytes = ~3 TB
Code length   : base62 (a-z, A-Z, 0-9), 7 chars = 62^7 = ~3.5 trillion combinations
                (6 billion urls use only ~0.2% of the space)
```

Learning: 7 characters kaafi hain. Writes kam hain, reads zyada: cache lagao.

#### Short code generation options `[ESSENTIAL]`

| Option | How | Pros | Cons |
|--------|-----|------|------|
| A. Random code + unique index + retry | Random 7 chars, INSERT, duplicate error aaye to retry | Simple, no coordination, unguessable | Collision retries (rare at low fill) |
| B. Auto-increment ID -> base62 | Insert row, `code = base62(id)` | No collisions, shortest codes | Sequential => enumerable/guessable; single DB sequence bottleneck at scale |
| C. Hash of long URL (MD5/SHA, first 7 chars) | Deterministic | Same URL, same code (dedupe) | Collisions need handling, same URL cannot have different owners/expiry |
| D. Pre-generated key service (KGS) | Separate service keeps a pool of unused random keys | No collision at request time, fast | Extra component; key pool management `[ADVANCED]` |
| E. Snowflake-style ID -> base62 | Timestamp + machine id + sequence | Multi-writer, no DB sequence | Longer code (~11 chars), more complex `[ADVANCED]` |

Recommendation for interview: **Option A** (random + unique constraint + retry) as the simplest correct design, then mention B/D when asked about predictability or high collision rate. Collision math: jab table 1% full (35 billion of 3.5 trillion), retry probability ~1%, ek-do retry se kaam ho jata hai.

#### Simplest working design

One Express service + one MySQL table. No cache, no queue.

```
POST /v1/urls  -> insert row with random code
GET /:code     -> SELECT long_url WHERE code = ? -> 302 redirect
```

Yeh 40 writes/s aur ek DB par few hundred reads/s ke liye bilkul theek hai. Phir 4,000+ reads/s par cache add karenge, kyunki bottleneck redirects ki DB reads honge.

#### API design

```
POST /v1/urls
  Headers: Authorization: Bearer <token> (optional for anonymous)
  Body   : { "longUrl": "https://example.com/very/long/path?x=1",
             "customAlias": "summer-sale",     // optional
             "expiresAt": "2027-01-01T00:00:00Z" } // optional
  201 Created { "code": "aZ3kP9x", "shortUrl": "https://sho.rt/aZ3kP9x",
                "longUrl": "...", "expiresAt": null }
  400 invalid URL / scheme
  409 alias already taken
  429 rate limited

GET /:code
  302 Found   Location: <longUrl>
  404 Not Found (unknown code)
  410 Gone    (expired or disabled)

GET /v1/urls/:code/stats        (owner only)
  200 { "code": "aZ3kP9x", "totalClicks": 1520, "daily": [ ... ] }

DELETE /v1/urls/:code           (owner only) -> 204
```

#### 301 vs 302 `[ESSENTIAL]`

- **301 Moved Permanently:** browsers/CDNs cache karte hain. Fayda: kam traffic aapke server par. Nuksan: aapko clicks dikhte nahi (analytics miss), expiry/disable/edit browser cache ki wajah se turant kaam nahi karta.
- **302 Found (ya 307):** har baar server hit hota hai: analytics, expiry, destination change sab control mein. Cost: zyada traffic.

Interview answer: analytics aur expiry chahiye to 302; pure permanent links ke liye 301. Aksar services 302 use karti hain.

#### MySQL schema

```sql
CREATE TABLE urls (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  long_url    VARCHAR(2048) NOT NULL,
  owner_id    BIGINT UNSIGNED NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  expires_at  DATETIME     NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_code (code),
  KEY idx_owner_created (owner_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- daily aggregated analytics (not one row per click)
CREATE TABLE url_daily_stats (
  code   VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  day    DATE   NOT NULL,
  clicks BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (code, day)
) ENGINE=InnoDB;
```

Important detail: `ascii_bin` collation. Default MySQL collations (e.g., `utf8mb4_0900_ai_ci`) case-insensitive hain, to `aZ3kP9x` aur `AZ3KP9X` same maane jaate, collision aur galat redirect. Base62 codes case-sensitive hain, isliye binary collation chahiye.

`long_url VARCHAR(2048)` ko hum index nahi karte. Agar "same long URL ka same code" dedupe chahiye to `long_url_hash CHAR(64)` (SHA-256) par index lagao; lambe URL ko seedha index nahi karte.

#### Code: create and redirect (Express 5)

```js
// src/urls/code.js
import { randomInt } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function randomCode(length = 7) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)]; // CSPRNG, unbiased
  }
  return out;
}
```

```js
// src/urls/urls.service.js
import mysql from 'mysql2/promise';
import { createClient } from 'redis';
import { randomCode } from './code.js';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });
const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (e) => console.error('redis error', e.message));
await redis.connect();

export function validateLongUrl(input) {
  let u;
  try {
    u = new URL(input);
  } catch {
    return null;
  }
  // Only web URLs. Blocks javascript:, data:, file: etc.
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (input.length > 2048) return null;
  return u.toString();
}

export async function createShortUrl({ longUrl, ownerId = null, expiresAt = null }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode(7);
    try {
      await pool.execute(
        'INSERT INTO urls (code, long_url, owner_id, expires_at) VALUES (?, ?, ?, ?)',
        [code, longUrl, ownerId, expiresAt],
      );
      return code;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') continue; // collision, try another code
      throw err;
    }
  }
  throw new Error('Could not allocate a unique code');
}

export async function resolveCode(code) {
  const key = `url:${code}`;
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached); // may be { missing: true }
  } catch {
    // cache is an optimization, fall through to DB
  }

  const [rows] = await pool.execute(
    'SELECT long_url, is_active, expires_at FROM urls WHERE code = ?',
    [code],
  );
  let value;
  if (rows.length === 0) {
    value = { missing: true };
  } else {
    const r = rows[0];
    const expired = r.expires_at && new Date(r.expires_at) <= new Date();
    value = { longUrl: r.long_url, gone: !r.is_active || Boolean(expired) };
  }

  try {
    await redis.set(key, JSON.stringify(value), { EX: value.missing ? 60 : 3600 });
  } catch {
    // ignore cache write failure
  }
  return value;
}
```

```js
// src/urls/urls.routes.js
import { Router } from 'express';
import { createShortUrl, resolveCode, validateLongUrl } from './urls.service.js';

export const router = Router();

router.post('/v1/urls', async (req, res) => {
  const longUrl = validateLongUrl(req.body?.longUrl);
  if (!longUrl) return res.status(400).json({ error: 'INVALID_URL' });
  const code = await createShortUrl({ longUrl, ownerId: req.user?.id ?? null });
  res.status(201).json({ code, shortUrl: `${process.env.BASE_URL}/${code}`, longUrl });
});

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  if (!/^[0-9A-Za-z-]{3,16}$/.test(code)) return res.sendStatus(404); // cheap reject
  const hit = await resolveCode(code);
  if (hit.missing) return res.sendStatus(404);
  if (hit.gone) return res.sendStatus(410);
  recordClick(code); // fire-and-forget, never block the redirect
  res.redirect(302, hit.longUrl);
});

function recordClick(code) {
  // see "Analytics" below; implementation intentionally non-blocking
}
```

Express 5 mein async route handler ke rejected promises automatically error middleware par jaate hain (Express 4 mein nahi). `res.redirect(302, url)` Express 5 mein bhi is signature ke saath kaam karta hai.

Note: cache mein `expires_at` jaisi cheez cache ho rahi hai, isliye TTL expiry se zyada nahi hona chahiye. Simple approach: cache TTL = min(3600, seconds until expiry), ya `gone` check cache hit par bhi `expiresAt` timestamp compare karke karo. Production mein cached value mein `expiresAt` store karo aur har hit par compare karo.

#### Analytics (async, off the hot path)

Har click par DB write 40,000 writes/s ban jayegi. Isliye:

- Redis counter: `HINCRBY clicks:2026-10-19 aZ3kP9x 1` (cheap, in-memory).
- Har minute ek job Redis counters ko MySQL `url_daily_stats` mein flush karta hai:

```sql
INSERT INTO url_daily_stats (code, day, clicks)
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE clicks = clicks + VALUES(clicks);
```

(MySQL 8.0.20+ mein `VALUES()` deprecated hai, alias syntax `INSERT ... AS new ON DUPLICATE KEY UPDATE clicks = clicks + new.clicks` prefer hota hai; dono 8.x mein kaam karte hain, deprecated ka matlab future removal.)

Trade-off: Redis crash par last minute ke clicks lose ho sakte hain. Approximate analytics ke liye theek; billing-grade ke liye event queue (Kafka/SQS) chahiye. `[ADVANCED]`

#### Components

- Node.js stateless API (create + redirect), multiple instances behind LB.
- MySQL (source of truth).
- Redis (redirect cache, click counters).
- Background job (flush analytics, delete expired links).
- CDN/edge (optional, for redirect caching of very hot links).

#### Data flow

```
Create:
 Client -> POST /v1/urls -> validate URL -> random code -> INSERT (retry on dup) -> 201

Redirect (hot path):
 Browser -> GET /aZ3kP9x
              |
        +-----v------+  hit   +-------+
        | Node API   |------->| Redis |-- long_url --> 302 Location
        +-----+------+  miss  +-------+
              |  SELECT by unique code
              v
          +-------+  populate cache (TTL), then 302
          | MySQL |
          +-------+
              (async) HINCRBY clicks counter -> periodic flush -> url_daily_stats
```

#### Failure scenarios

| Failure | Behavior | Mitigation |
|---------|----------|------------|
| Code collision | `ER_DUP_ENTRY` on insert | Retry with new code (up to N), alert if retries spike (space filling) |
| Redis down | Cache misses | Fall back to DB; protect DB with connection limits/rate limits |
| MySQL primary down | Creates fail; cached redirects still work | Replica promotion; reads from replica; cache keeps hot links alive |
| Cache stampede on viral link | Many misses at once | TTL jitter, single-flight (Day 1.3) |
| Malicious/phishing URLs | Service abused | Validate scheme, domain blocklist, safe-browsing check, report/disable flow, rate limit creation, require login for bulk |
| Open redirect/phishing reputation | Domain flagged | Interstitial page for suspicious links; abuse handling |
| Expired link served from cache | Wrong behavior | Store `expiresAt` in cache entry, compare on hit |
| Enumeration/scraping of codes | Private links discovered | Random codes (not sequential), rate limit 404s, longer codes for private links |
| Click counter loss | Under-count | Accept for approximate; queue for exact |

#### Trade-offs

- Random code (A) vs counter (B): A = unguessable, no coordination, retry; B = no collisions, shortest, but enumerable and needs a global sequence.
- 301 vs 302: traffic cost vs control/analytics.
- Strong vs eventual analytics.
- Dedupe same long URL (hash lookup, one more read per create) vs allow many codes per URL (simple, per-user stats).

#### Scaling options (add only when needed)

1. Start: one MySQL + Node. Fine up to hundreds of reads/s.
2. Add Redis cache-aside: 90-99% hit ratio; MySQL load drops by that factor. Hot working set (popular links) chhota hota hai, so a few GB of Redis can hold it.
3. Read replicas for cache misses; primary only for creates.
4. CDN in front for extremely hot links (short TTL 302).
5. Scale create path: if writes exceed one primary, shard by `hash(code)` (lookup is always by code so single-shard queries), or use pre-generated keys (KGS) distributed in ranges per app instance.
6. Partition `url_daily_stats` by date; archive old data. Expired-link cleanup job in batches (`DELETE ... LIMIT 1000` loop) to avoid long locks.

**Frontend connection:** Tum `window.location` ya React Router redirect jaante ho; yahan server-side HTTP redirect (302 + `Location` header) hota hai jo browser follow karta hai. Link-preview, UTM params aur analytics dashboard ka data isi backend se aata hai.

**Real-world scenario (marketplace marketing)**

Seller SMS campaign bhejta hai jisme short link hai. 1 lakh users 10 minute mein click karte hain (burst). Redirect Redis se serve hota hai, DB almost idle. Campaign khatam hone par seller dashboard daily stats dikhata hai (Redis counters ka flushed aggregate).

**Interview answer:**
"I would start with a stateless Node.js API and a MySQL table with a unique, case-sensitive code column. To create a link I generate a random 7-character base62 code with a cryptographically secure generator and insert it; on a duplicate key error I retry. Seven characters give about 3.5 trillion combinations, which is plenty. Redirects are read-heavy, roughly a hundred to one, so I put Redis in front with cache-aside and a TTL, including a short negative cache for unknown codes. I use a 302 redirect so that analytics and expiry stay under my control. Click counts are incremented in Redis and flushed to MySQL in batches so the redirect path never waits on a write. For scale I add read replicas and a CDN, and only if writes outgrow one primary would I shard by code or use pre-generated key ranges. I validate URL schemes and rate limit creation to reduce abuse."

**Follow-up questions**

1. *Auto-increment + base62 ka issue kya hai?* Sequential codes guess/enumerate ho sakte hain (privacy), aur multiple DB writers par single sequence bottleneck. Fix: random codes, ya ID ko obfuscate (e.g., shuffle bits/Feistel), ya range-based allocation per instance.
2. *Collision kaise handle karoge?* DB unique constraint ko source of truth maano; duplicate error par retry. App-side "check then insert" race karta hai, isliye pehle check mat karo.
3. *Custom alias?* Same unique index; 409 on duplicate; reserved words block karo (`api`, `admin`, `login`) taaki routes se conflict na ho.
4. *Link expire kaise?* `expires_at` check on read (lazy) + background cleanup. Cache TTL expiry se align karo.
5. *Same URL do baar submit ho to?* Policy decide karo: naya code (simple) ya `long_url_hash` par dedupe lookup.
6. *Database 10x bada ho jaye to?* Archive/TTL purane links, partition, aur shard by code hash. Lookups hamesha code se, isliye sharding natural hai.
7. *Redirect latency kaise kam karoge?* Cache hit path mein ek Redis GET; region-wise deployment; CDN; keep-alive connections.

**Common mistakes**

- Default case-insensitive collation par base62 code store karna.
- Check-then-insert (race) instead of insert-and-handle-duplicate.
- Non-crypto `Math.random()` for codes when guessability matters.
- DB write on every click.
- 301 use karke analytics expect karna.
- URL scheme validate na karna (`javascript:` links).
- Reserved aliases ko block na karna.

**Revision notes**

- 7-char base62 = 3.5T. Random + unique index + retry (simple). Counter/KGS for alternatives.
- `ascii_bin` collation. 302 vs 301. Cache-aside + negative cache. Async clicks.
- Validate URLs, rate limit creates, enumerate protection.

### 3.2 Design: File upload architecture `[ESSENTIAL]`

Week 3 / Day 6 mein Express par multer se file upload ka implementation cover hua. Yahan architecture: production mein files kahan jaati hain aur kaise scale hoti hain.

**Concept**

User se files (profile photo, invoice PDF, KYC document, video) lena, safely store karna, aur baad mein serve karna.

**Why it matters**

File uploads performance, security aur storage cost, teeno ka risk hain. Galat design se server memory/bandwidth bhar jati hai, ya malicious files ghus jaati hain.

#### Requirements

Functional:

- Authenticated user file upload kare (images <= 10 MB, documents <= 25 MB, optionally videos up to 2 GB).
- File ka metadata store (owner, name, type, size).
- Authorized user download/view kar sake (private files = signed URL; public = CDN).
- Image thumbnails/processing, virus scan.
- Delete file.

Non-functional:

- Durable storage (data loss nahi).
- API servers par load kam (large uploads Node ko block/bhaar na karein).
- Security: type/size validation, malware, access control, no path traversal.
- Cost-effective, scalable to millions of files.
- Resumable/reliable uploads for large files.

#### Simplest working design: multer to local disk (and why it breaks)

```js
// Works on ONE server in development.
import express from 'express';
import multer from 'multer';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });
const app = express();

app.post('/v1/files', upload.single('file'), (req, res) => {
  res.status(201).json({ name: req.file.originalname, path: req.file.path });
});
```

Kahan toot-ta hai:

1. Multiple instances: file ek server ki disk par, doosra instance nahi dekh pata.
2. Server restart/redeploy (containers ephemeral hain): files lost.
3. Large uploads: Node ka bandwidth/CPU/connection time use hota hai (slow clients ke saath long-lived connections).
4. Disk full, backups, no CDN.

Intermediate: multer se Node ke through object storage (S3) mein stream (proxy upload). Persistent hai, lekin saara data tumhare server se guzarta hai (bandwidth cost, timeouts, load balancer limits, e.g., 1 MB-10 MB body limits).

**Recommended design: direct-to-object-storage via presigned URLs.**

Client apna file seedha S3 (ya compatible storage) par upload karta hai; Node sirf permission deta hai aur metadata manage karta hai.

#### API design

```
1) POST /v1/files                              (initiate)
   Body : { "fileName": "invoice.pdf", "contentType": "application/pdf", "sizeBytes": 482113 }
   201  : { "fileId": "7b1e...", "uploadUrl": "https://bucket.s3.amazonaws.com/...signed...",
            "method": "PUT", "headers": { "Content-Type": "application/pdf" }, "expiresInSeconds": 300 }
   400  : type not allowed / size too large
   429  : too many pending uploads

2) Client -> PUT <uploadUrl> (file bytes) directly to S3

3) POST /v1/files/:fileId/complete             (finalize; idempotent)
   200  : { "fileId": "7b1e...", "status": "uploaded" }
   409  : object missing / size mismatch

4) GET /v1/files/:fileId                       -> metadata + status
5) GET /v1/files/:fileId/download-url          -> { "url": "<signed GET url>", "expiresInSeconds": 60 }
6) DELETE /v1/files/:fileId                    -> 204
```

#### MySQL schema

```sql
CREATE TABLE files (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id     CHAR(36)     NOT NULL,                 -- UUID shown to clients
  owner_id      BIGINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_key   VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  content_type  VARCHAR(127) NOT NULL,
  size_bytes    BIGINT UNSIGNED NOT NULL,
  status        ENUM('pending','uploaded','scanning','ready','rejected','deleted')
                NOT NULL DEFAULT 'pending',
  checksum_sha256 CHAR(64)   NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_at   DATETIME     NULL,
  pending_expires_at DATETIME NOT NULL,                -- abandoned-upload cleanup
  PRIMARY KEY (id),
  UNIQUE KEY uq_public_id (public_id),
  UNIQUE KEY uq_storage_key (storage_key),
  KEY idx_owner_created (owner_id, created_at),
  KEY idx_status_created (status, created_at)
) ENGINE=InnoDB;
```

Design choices:

- `public_id` (UUID) client ko dikhta hai; sequential `id` expose nahi karte (enumeration/IDOR risk kam).
- `storage_key` server generate karta hai: `uploads/{ownerId}/{uuid}`. User ka filename kabhi key mein seedha nahi (path traversal, collisions, unsafe characters).
- `status` lifecycle: pending -> uploaded -> scanning -> ready (ya rejected).
- DB mein file ka content nahi, sirf metadata (BLOB mein bade files rakhna DB ko slow aur mehnga karta hai).

Note: `uq_storage_key` jaise index ke liye `VARCHAR(512)` ascii (1 byte per char) hone se 512 bytes ka key banta hai, jo InnoDB ke index limit (3072 bytes) ke andar hai.

#### Code: initiate and complete (Express 5, AWS SDK v3)

```js
// src/files/s3.js
import { S3Client } from '@aws-sdk/client-s3';
export const s3 = new S3Client({ region: process.env.AWS_REGION });
export const BUCKET = process.env.S3_BUCKET;
```

```js
// src/files/files.service.js
import { randomUUID } from 'node:crypto';
import { PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mysql from 'mysql2/promise';
import { s3, BUCKET } from './s3.js';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });

const ALLOWED = new Map([
  ['image/jpeg', 10 * 1024 * 1024],
  ['image/png', 10 * 1024 * 1024],
  ['application/pdf', 25 * 1024 * 1024],
]);

export async function initiateUpload({ ownerId, fileName, contentType, sizeBytes }) {
  const maxSize = ALLOWED.get(contentType);
  if (!maxSize) throw Object.assign(new Error('TYPE_NOT_ALLOWED'), { status: 400 });
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > maxSize) {
    throw Object.assign(new Error('SIZE_NOT_ALLOWED'), { status: 400 });
  }

  const publicId = randomUUID();
  const storageKey = `uploads/${ownerId}/${publicId}`; // server-generated, never user input

  await pool.execute(
    `INSERT INTO files (public_id, owner_id, original_name, storage_key, content_type,
                        size_bytes, status, pending_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
    [publicId, ownerId, String(fileName).slice(0, 255), storageKey, contentType, sizeBytes],
  );

  // ContentLength and ContentType are part of the signature: the client must send exactly
  // these values, so it cannot upload a different size or type with this URL.
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      ContentType: contentType,
      ContentLength: sizeBytes,
    }),
    { expiresIn: 300 },
  );

  return { fileId: publicId, uploadUrl, method: 'PUT', headers: { 'Content-Type': contentType }, expiresInSeconds: 300 };
}

export async function completeUpload({ ownerId, fileId }) {
  const [rows] = await pool.execute(
    'SELECT id, storage_key, size_bytes, status FROM files WHERE public_id = ? AND owner_id = ?',
    [fileId, ownerId], // owner check => no IDOR
  );
  const file = rows[0];
  if (!file) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
  if (file.status !== 'pending') return { fileId, status: file.status }; // idempotent

  let head;
  try {
    head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: file.storage_key }));
  } catch {
    throw Object.assign(new Error('OBJECT_MISSING'), { status: 409 });
  }
  if (Number(head.ContentLength) !== Number(file.size_bytes)) {
    throw Object.assign(new Error('SIZE_MISMATCH'), { status: 409 });
  }

  // Conditional update keeps this safe if /complete is called twice concurrently
  await pool.execute(
    `UPDATE files SET status = 'uploaded', uploaded_at = NOW()
      WHERE id = ? AND status = 'pending'`,
    [file.id],
  );
  // a scan/thumbnail job is enqueued here (outbox row or queue message)
  return { fileId, status: 'uploaded' };
}

export async function getDownloadUrl({ ownerId, fileId }) {
  const [rows] = await pool.execute(
    `SELECT storage_key, original_name FROM files
      WHERE public_id = ? AND owner_id = ? AND status = 'ready'`,
    [fileId, ownerId],
  );
  if (rows.length === 0) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: rows[0].storage_key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(rows[0].original_name)}"`,
    }),
    { expiresIn: 60 },
  );
}
```

```js
// src/files/files.routes.js
import { Router } from 'express';
import { initiateUpload, completeUpload, getDownloadUrl } from './files.service.js';

export const router = Router();

router.post('/v1/files', async (req, res) => {
  const out = await initiateUpload({ ownerId: req.user.id, ...req.body });
  res.status(201).json(out);
});

router.post('/v1/files/:fileId/complete', async (req, res) => {
  res.json(await completeUpload({ ownerId: req.user.id, fileId: req.params.fileId }));
});

router.get('/v1/files/:fileId/download-url', async (req, res) => {
  const url = await getDownloadUrl({ ownerId: req.user.id, fileId: req.params.fileId });
  res.json({ url, expiresInSeconds: 60 });
});
```

Errors ko Week 3 / Day 4 wale centralized error middleware se `err.status` use karke map karo. Express 5 async errors automatically forward karta hai.

Alternative for strict size cap: **presigned POST** (`@aws-sdk/s3-presigned-post`) mein `content-length-range` condition hoti hai jo S3 khud enforce karta hai. Presigned PUT mein signed `Content-Length` bhi exact size enforce karta hai.

Packages: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`. Local development mein S3-compatible MinIO use kar sakte ho (Docker compose, Day 6) with `endpoint` and `forcePathStyle: true`.

Bucket CORS: browser se direct PUT ke liye bucket par CORS rule chahiye (allowed origin = tumhara frontend, method PUT, header Content-Type). Yeh frontend dev ke liye common stumbling block hai.

#### Large files: multipart upload `[ADVANCED]`

- 100 MB+ ke liye S3 multipart: `CreateMultipartUpload` -> har part (5 MB - 5 GB) ke liye presigned `UploadPart` URL -> parallel part uploads -> `CompleteMultipartUpload`.
- Fayda: failed part dobara bhej sakte ho (resumable), parallel speed.
- Cleanup: S3 lifecycle rule `AbortIncompleteMultipartUpload` (e.g., 1 day) laga do, warna adhoore parts ka storage bill aata rehta hai.
- Alternative: tus protocol (resumable upload standard).

#### Post-upload processing

```
 uploaded -> enqueue job -> worker:
     1. download first bytes, check magic bytes (real file type, not just claimed Content-Type)
     2. malware scan (ClamAV or managed scanner)
     3. images: generate thumbnails (sharp), strip EXIF (privacy)
     4. status = ready (or rejected + delete object)
```

Content-Type header client-controlled hai; kabhi bharosa mat karo. Magic bytes (e.g., PDF `%PDF-`, PNG `89 50 4E 47`) verify karo. Processing ko async worker mein karo (Day 5), request mein nahi.

#### Components

- Node API: auth, validation, metadata, presign.
- Object storage (S3/MinIO): file bytes.
- MySQL: metadata + lifecycle state.
- CDN (CloudFront) for public assets; signed URLs/cookies for private.
- Worker + queue: scanning, thumbnails, cleanup.
- Optional: S3 event notification -> queue, as a backup when client never calls `/complete`.

#### Data flow

```
 Client                  Node API                 MySQL            S3 (object storage)
   |  POST /v1/files        |                        |                     |
   |----------------------->| validate type/size     |                     |
   |                        | INSERT files(pending)->|                     |
   |                        | presign PUT ---------------------------------|
   |<-- uploadUrl ----------|                        |                     |
   |                                                                       |
   |  PUT bytes directly ------------------------------------------------->|
   |<-- 200 --------------------------------------------------------------|
   |                                                                       |
   |  POST /complete ------>| HEAD object ---------------------------------->|
   |                        |<-- size ok ------------------------------------|
   |                        | UPDATE status=uploaded ->|                     |
   |                        | enqueue scan job         |                     |
   |<-- 200 uploaded -------|                                               |
                                      Worker: scan, thumbnails -> status=ready
   Later: GET /download-url -> signed GET (60 s) -> client downloads from S3/CDN
```

#### Failure scenarios

| Failure | Behavior | Mitigation |
|---------|----------|------------|
| Client abandons after initiate | `pending` row, no object | Cleanup job deletes pending rows past `pending_expires_at` |
| Upload done, `/complete` never called | Orphan object, row stays `pending` | S3 event -> queue marks uploaded; or periodic reconciliation (HEAD pending keys) |
| Object uploaded, row missing | Orphan object | Lifecycle rule on `uploads/` prefix for unreferenced; reconciliation job |
| Client lies about size/type | Bad file stored | Signed Content-Length/Type, HEAD check, magic bytes, scan |
| Presigned URL leaked | Someone can upload that key once until expiry | Short expiry (5 min), key unique per upload, no overwrite of existing `ready` objects, private bucket |
| `/complete` called twice / concurrently | Double processing | Idempotent: conditional `UPDATE ... WHERE status='pending'` |
| Malware uploaded | Distribution risk | Quarantine status until scan `ready`; never serve `uploaded` files |
| S3 outage / throttling | Uploads fail | Client retry with backoff; return clear error; multi-region only if SLA demands |
| Worker crash during scan | Stuck `scanning` | Lease/timeouts like Day 2.2; retries |
| Cost explosion (huge files, spam) | Bills | Per-user quotas, rate limit initiate, size caps, lifecycle policies |
| IDOR (user A downloads user B's file) | Data leak | Always filter by `owner_id` (or ACL) in the query; signed URLs short-lived |

#### Trade-offs

- **Proxy upload through Node vs direct-to-S3:** proxy = simple control, server load/cost; direct = scalable and cheap, more moving parts (initiate/complete, CORS, orphans).
- **Signed PUT vs signed POST:** PUT simple; POST gives policy conditions (size range, key prefix).
- **Private signed URLs vs public CDN:** private = secure, URL expiry; public = fast, cheap, only for non-sensitive assets.
- **Sync vs async scanning:** sync blocks user; async needs `status` lifecycle and UI polling.
- **Local FS/DB BLOB vs object storage:** object storage wins for scale/durability; DB BLOB only for tiny, transactional cases.

#### Scaling options

1. Start: direct-to-S3 presigned flow, one worker. Node API sirf metadata handle karta hai, isliye bahut kam load.
2. CDN for downloads; signed cookies/URLs for private content.
3. Worker pool scale by queue depth; separate queue for video transcoding.
4. Multipart + resumable for large files.
5. Partition/archive `files` table by created date; storage tiering (S3 Infrequent Access/Glacier lifecycle).
6. Dedupe by `checksum_sha256` (content-addressed storage) if many identical files. `[ADVANCED]`

**Frontend connection:** React mein tum `<input type="file">` + `fetch`/`axios` se upload karte ho. Presigned flow mein frontend do steps karta hai: pehle backend se URL maango, phir `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })`, phir `/complete` call. Progress bar ke liye `XMLHttpRequest` ya axios `onUploadProgress` S3 par hi kaam karta hai. CORS bucket par configure karna padta hai, Express par nahi.

**Real-world scenario (banking / KYC)**

KYC document upload: private bucket, presigned PUT with 5-minute expiry, file `pending` -> `uploaded` -> virus scan -> `ready`. Operator ko download sirf 60-second signed URL se, har access audit log mein. Customer ke document kisi aur customer ko kabhi nahi milte kyunki query `owner_id` ya role check ke saath hoti hai.

**Interview answer:**
"The simplest version is multer writing to local disk, but that fails with multiple instances, ephemeral containers, and it ties up Node with large transfers. In production I would upload directly to object storage with presigned URLs. The client calls my API to initiate an upload with the file name, type and size; I validate against an allowlist and size limits, create a pending metadata row in MySQL with a server-generated storage key, and return a short-lived presigned PUT URL that is bound to the content type and length. The client uploads straight to S3, then calls a complete endpoint which verifies the object with a HEAD request and moves the row to uploaded in an idempotent way. A background worker then checks magic bytes, scans for malware, generates thumbnails, and marks the file ready; files are never served before that. Downloads use short-lived signed URLs or a CDN, with an ownership check on every request. I handle abandoned uploads with a cleanup job and S3 lifecycle rules, and for very large files I use multipart upload."

**Follow-up questions**

1. *Presigned URL kya hai aur secure kyun hai?* Ek URL jisme signature hota hai (credentials + expiry + specific key/method). Bina AWS credentials ke temporary access deta hai. Short expiry, single key, aur signed headers se risk limited.
2. *File type validation kaise?* Allowlist, Content-Type signed, extension ignore, magic bytes server side, aur malware scan. Client-side validation sirf UX ke liye hai.
3. *Upload progress/resume?* Direct-to-S3 mein browser progress deta hai; multipart se failed parts retry; tus protocol alternative.
4. *Orphan files kaise clean karoge?* `pending_expires_at` cleanup, S3 lifecycle (multipart abort, prefix expiry), reconciliation job jo storage list aur DB compare kare.
5. *Public images ke liye kya?* Public bucket/CDN with unguessable keys ya signed CDN URLs; sensitive nahi hain to long cache headers.
6. *Server pe hi upload zaroori ho (e.g., processing before store)?* Stream karo (memory mein pura file mat load karo), size limit, aur ek hi instance ki disk par depend mat karo; ya temp upload then S3.

**Common mistakes**

- Local disk par store karna in a scaled/containerized deployment.
- `multer.memoryStorage()` se bade files RAM mein load karna (OOM).
- Client ka `originalname` seedha path/key mein use karna (path traversal: `../../`).
- Content-Type/extension par trust.
- Ownership check bhoolna (IDOR) on download.
- Public bucket par sensitive documents.
- Cleanup/lifecycle na rakhna: orphans, storage bill.
- Files ko DB BLOB mein rakhna.

**Revision notes**

- Direct-to-S3 via presigned URL; Node = control plane, S3 = data plane.
- initiate -> PUT -> complete (idempotent) -> scan -> ready.
- Server-generated keys, signed type/length, magic bytes, quarantine until scanned.
- Cleanup (pending expiry, lifecycle), ownership checks, short-lived download URLs.

### Day 3 wrap-up

**Key concepts to remember**

- Short code: 7 base62 chars; random + unique index + retry; case-sensitive collation; 302 vs 301.
- Read-heavy => cache-aside; clicks async (Redis counter + batch flush).
- File upload: presigned URL direct to object storage; metadata + status lifecycle in MySQL.
- Security: validate URLs/types, server-generated keys, ownership checks, quarantine until scan.

**Five revision questions**

1. URL shortener mein 7 character base62 code kitne combinations deta hai, aur collision kaise handle karte ho?
2. `ascii_bin` collation kyun zaroori hai short codes ke liye?
3. 301 aur 302 ke beech tum kab kya choose karoge?
4. File upload ko Node ke through proxy karne ke bajay presigned URL kyun better hai? Iske naye failure cases kaun se aate hain?
5. Upload `/complete` endpoint idempotent kyun hona chahiye aur kaise banate ho?

**Practical coding task**

URL shortener ka chhota working version banao (Express 5 + mysql2, Redis optional): `POST /v1/urls` aur `GET /:code`. 50 parallel creates chalao aur verify karo koi duplicate code nahi hai. Phir `code` column ko default collation par badal kar do codes `abc` aur `ABC` insert karke dekho kya hota hai, aur `ascii_bin` se compare karo.

**Self-assessment checklist**

- [ ] Main code generation ke 3 options aur unke trade-offs bata sakta hoon.
- [ ] Main redirect flow ka cache-aside diagram bina dekhe bana sakta hoon.
- [ ] Main presigned upload flow ke 3 steps aur har step ke failure cases bata sakta hoon.
- [ ] Main file upload ke 5 security risks aur unke fixes bol sakta hoon.
- [ ] Main dono designs ka scaling ladder (simple se complex) explain kar sakta hoon.

---

## Day 4 - Payment and transaction workflows, retries, idempotency, failure recovery

**Learning objectives**

- Money handling ke rules: integer minor units, kabhi float nahi.
- Payment checkout (external PSP like Stripe/Razorpay) ko state machine + webhook + idempotency ke saath design karo.
- Internal money transfer (wallet/bank) ko ACID transaction, row locking aur double-entry ledger ke saath design karo.
- Retry classification, idempotency keys, outbox, reconciliation, saga: failure recovery toolbox.
- "Request timeout ho gaya, payment hua ya nahi?" jaise unknown-state problem handle karna.

Estimated time: 20 min money rules + overview, 40 min PSP checkout design, 35 min ledger transfer design, 25 min retries/recovery + revision questions.

Cross-reference: Week 4 / Day 4-5 (transactions, isolation, `FOR UPDATE`, deadlocks) aur Week 6 / Day 3 (idempotency, retries basics). Yahan unhe design mein jod rahe hain.

### 4.1 Money rules and workflow overview `[ESSENTIAL]`

**Concept**

Payment system ka ek hi golden rule hai: **kabhi paisa lose ya duplicate nahi hona chahiye**, chahe network, server ya provider fail ho. Isliye correctness ko performance par priority milti hai.

**Rules**

1. **Amounts ko integer minor units mein store karo** (cents/paise): Rs 499.50 = `49950`. Floating point mein `0.1 + 0.2 = 0.30000000000000004`.

```js
console.log(0.1 + 0.2);                 // 0.30000000000000004
console.log(Math.round(499.5 * 100));   // 49950  (convert once at the boundary, then use integers)
```

2. MySQL mein `BIGINT` (minor units) ya `DECIMAL(19,4)`. `FLOAT/DOUBLE` kabhi nahi. Currency code (`CHAR(3)`, ISO 4217) saath store karo; currencies ke alag decimals hote hain (JPY 0, KWD 3).
3. **Server amount compute karta hai** (cart/order se); client ka bheja hua amount trust nahi karte.
4. **Har money-changing operation idempotent** ho (same request dobara aaye to dobara paisa move na ho).
5. **Append-only history** (ledger/events); balance ko overwrite karke history mat mitao.
6. **Network call ke dauraan DB transaction/lock hold mat karo** (slow PSP call = locks lamba time = system freeze).
7. **Unknown state ko "failed" mat maano.** Timeout ka matlab hai "pata nahi"; check/reconcile karo.

Do alag workflows jo interview mein aate hain:

| Workflow | Example | Core difficulty |
|----------|---------|-----------------|
| Checkout with external PSP | Customer card se order pay karta hai | Async confirmation (webhook), duplicate/out-of-order events, unknown state |
| Internal transfer / wallet | Account A se B ko paisa | Atomicity, concurrency (double spend), deadlocks, auditability |

**Frontend connection:** Checkout page par "Pay" button double-click ho sakta hai, user refresh kar sakta hai, ya network kat sakta hai. Frontend disable-button karta hai, lekin backend ko phir bhi idempotent hona padega kyunki client kabhi reliable nahi hota. `Idempotency-Key` header frontend generate karta hai (UUID per checkout attempt) aur retries par wahi bhejta hai.

**Revision notes**

- Integers, server-computed amounts, idempotency, append-only ledger, no network inside DB txn, unknown != failed.

### 4.2 Design: Checkout payment with an external PSP `[ESSENTIAL]`

#### Requirements

Functional:

- Customer order ka payment kare (card/UPI/wallet via PSP).
- System payment ka status track kare: created, pending, succeeded, failed, refunded.
- Success par order `paid` ho aur fulfillment/notification trigger ho.
- Refunds (full/partial).
- Customer/merchant payment history dekh sake.

Non-functional:

- Correctness: no double charge, no paid-but-order-unpaid mismatch (ya agar ho to detect aur fix).
- Idempotent APIs, safe retries.
- Auditability: har state change ka record.
- Security: card data kabhi tumhare server par nahi (PSP hosted fields/tokenization, PCI scope kam); webhook signature verify.
- Availability: PSP down ho to graceful error; checkout ke baaki parts (cart) chalte rahe.

Estimate: 50 orders/s peak. Yeh throughput kam hai; ek MySQL primary kaafi. Challenge scale nahi, correctness hai.

#### Simplest working design (and where it breaks)

```js
// WRONG: synchronous charge in request, trusting the response
app.post('/orders/:id/pay', async (req, res) => {
  const order = await getOrder(req.params.id);
  const charge = await psp.charge({ amount: req.body.amount, token: req.body.token });
  if (charge.ok) await markOrderPaid(order.id);
  res.json({ ok: charge.ok });
});
```

Kahan toot-ta hai:

1. Client amount bhejta hai: tamper.
2. PSP call timeout: charge ho gaya ho sakta hai lekin tumhe pata nahi; user retry kare to double charge.
3. Charge hua, `markOrderPaid` se pehle server crash: customer ko paisa kata, order unpaid.
4. 3-D Secure/UPI jaise flows async hote hain: response mein final result nahi hota.
5. Double-click: do charges.

Fix: payments ko **state machine + idempotency + webhook confirmation + reconciliation** se manage karo.

#### Payment state machine

```
                +--> failed
                |
 created --> pending --> succeeded --> partially_refunded --> refunded
                |             |
                +--> canceled +--> refunded

 Rules: only forward transitions; terminal: failed, canceled, refunded.
 Each transition is a conditional UPDATE: ... WHERE id = ? AND status IN (<allowed previous states>)
```

Conditional update ka `affectedRows` batata hai ki transition hua ya koi aur pehle kar chuka (duplicate webhook / race).

#### API design

```
POST /v1/orders/:orderId/payments
  Headers: Authorization: Bearer <token>
           Idempotency-Key: 6f1c9d3e-...            (required)
  Body   : { "paymentMethodToken": "tok_abc" }       // token from PSP hosted fields, not card number
  201    : { "paymentId": "pay_123", "status": "pending", "clientSecret": "..." }
  200    : same body (replay of same Idempotency-Key)
  409    : same key still in progress / order not payable
  422    : same key reused with different payload

GET  /v1/payments/:paymentId           -> { status, amountMinor, currency, ... }
POST /v1/payments/:paymentId/refunds   (Idempotency-Key required) Body: { "amountMinor": 2500 }

POST /webhooks/psp                     (called by PSP; signature verified; no user auth)
```

Amount request mein nahi hai: server order se lega.

#### MySQL schema

```sql
CREATE TABLE orders (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  total_minor  BIGINT UNSIGNED NOT NULL,
  currency     CHAR(3) NOT NULL,
  status       ENUM('pending_payment','paid','canceled','fulfilled') NOT NULL DEFAULT 'pending_payment',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id       CHAR(36) NOT NULL,
  order_id        BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  amount_minor    BIGINT UNSIGNED NOT NULL,
  currency        CHAR(3) NOT NULL,
  status          ENUM('created','pending','succeeded','failed','canceled',
                       'partially_refunded','refunded') NOT NULL DEFAULT 'created',
  idempotency_key VARCHAR(128) NOT NULL,
  request_hash    CHAR(64) NOT NULL,           -- SHA-256 of normalized request body
  psp_payment_id  VARCHAR(128) NULL,
  failure_code    VARCHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_public_id (public_id),
  UNIQUE KEY uq_user_idem (user_id, idempotency_key),
  UNIQUE KEY uq_psp_payment (psp_payment_id),
  KEY idx_order (order_id),
  KEY idx_status_updated (status, updated_at),
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB;

CREATE TABLE payment_events (                 -- append-only audit trail
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id  BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(32) NULL,
  to_status   VARCHAR(32) NOT NULL,
  source      VARCHAR(32) NOT NULL,           -- 'api', 'webhook', 'reconciliation'
  detail      JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payment (payment_id, id)
) ENGINE=InnoDB;

CREATE TABLE webhook_events (                 -- dedupe incoming PSP events
  event_id    VARCHAR(128) NOT NULL,          -- PSP's unique event id
  event_type  VARCHAR(64)  NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id)
) ENGINE=InnoDB;

CREATE TABLE outbox (                         -- reliable async side effects (Day 5)
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic        VARCHAR(64) NOT NULL,          -- 'payment.succeeded'
  payload      JSON NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_unpublished (published_at, id)
) ENGINE=InnoDB;
```

Key choices:

- `UNIQUE(user_id, idempotency_key)`: DB-level guarantee ki ek request ek hi payment row banaye, concurrent duplicates mein bhi.
- `request_hash`: same key different body = client bug, reject (422).
- `UNIQUE(psp_payment_id)`: ek PSP payment ek hi row se map ho (MySQL unique index multiple NULLs allow karta hai, isliye `created` rows jinka `psp_payment_id` abhi NULL hai woh conflict nahi karte).
- `webhook_events.event_id` primary key: duplicate webhooks ko DB reject karta hai.
- `payment_events`: audit trail + debugging.

#### Components

- **Payment API** (Node.js): idempotent create, status read.
- **PSP adapter:** SDK/HTTP wrapper with timeouts and PSP-side idempotency key.
- **Webhook endpoint:** signature verify, dedupe, state transitions.
- **MySQL:** orders, payments, events, outbox (source of truth).
- **Outbox publisher + queue + workers:** receipts, fulfillment, accounting.
- **Reconciliation job:** stuck/mismatched payments ko PSP se compare karke fix.

#### Data flow

```
 Browser                 Payment API                MySQL                  PSP
   | POST /payments (Idempotency-Key)                                        |
   |----------------------->| 1. load order, compute amount                  |
   |                        | 2. INSERT payments(status=created) ----------->|(DB)
   |                        |    (dup key -> return existing result)         |
   |                        | 3. create PSP payment (idempotency key, 5s timeout)--->|
   |                        |<---------------- psp_payment_id, clientSecret ---------|
   |                        | 4. UPDATE status=pending, psp_payment_id       |
   |<-- 201 pending --------|                                                |
   |                                                                         |
   | (customer completes card / 3DS / UPI on PSP-hosted UI)                  |
   |                                                                         |
   |                        |<------- POST /webhooks/psp (payment.succeeded)-|
   |                        | 5. verify HMAC on raw body                     |
   |                        | 6. BEGIN                                       |
   |                        |    INSERT webhook_events (dup => already done) |
   |                        |    UPDATE payments SET status='succeeded'      |
   |                        |       WHERE id=? AND status IN ('created','pending')
   |                        |    UPDATE orders SET status='paid' ...         |
   |                        |    INSERT outbox('payment.succeeded')          |
   |                        |    INSERT payment_events                       |
   |                        |    COMMIT                                      |
   |                        |--------------- 200 OK ------------------------>|
   |                                                                         |
   | Browser polls GET /payments/:id (or SSE) until succeeded/failed         |
   |                                                                         |
   | Outbox publisher -> queue -> workers: receipt email, fulfillment, ledger|
```

Important: Browser redirect/"success" page par order ko paid mark mat karo; **webhook (ya server-to-server verification)** hi source of truth hai, kyunki browser kuch bhi bol sakta hai.

#### Code: create payment (idempotent, no DB lock during PSP call)

```js
// src/payments/payments.service.js
import { createHash, randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });

const hashRequest = (obj) =>
  createHash('sha256').update(JSON.stringify(obj)).digest('hex');

export async function createPayment({ userId, orderId, idempotencyKey, paymentMethodToken }) {
  // 1. Load order; amount comes from the server, never from the client
  const [orders] = await pool.execute(
    `SELECT id, total_minor, currency, status FROM orders WHERE id = ? AND user_id = ?`,
    [orderId, userId],
  );
  const order = orders[0];
  if (!order) throw httpError(404, 'ORDER_NOT_FOUND');
  if (order.status !== 'pending_payment') throw httpError(409, 'ORDER_NOT_PAYABLE');

  const requestHash = hashRequest({ orderId, paymentMethodToken });
  const publicId = randomUUID();

  // 2. Claim the idempotency key atomically using the UNIQUE index
  try {
    await pool.execute(
      `INSERT INTO payments
         (public_id, order_id, user_id, amount_minor, currency, status, idempotency_key, request_hash)
       VALUES (?, ?, ?, ?, ?, 'created', ?, ?)`,
      [publicId, orderId, userId, order.total_minor, order.currency, idempotencyKey, requestHash],
    );
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    // Same key seen before: replay or conflict
    const [rows] = await pool.execute(
      `SELECT public_id, status, request_hash FROM payments
        WHERE user_id = ? AND idempotency_key = ?`,
      [userId, idempotencyKey],
    );
    const existing = rows[0];
    if (existing.request_hash !== requestHash) throw httpError(422, 'IDEMPOTENCY_KEY_REUSED');
    if (existing.status === 'created') throw httpError(409, 'REQUEST_IN_PROGRESS');
    return { paymentId: existing.public_id, status: existing.status, replay: true };
  }

  // 3. Call the PSP OUTSIDE any DB transaction, with a timeout and the PSP's own idempotency key
  let intent;
  try {
    intent = await callPsp({
      amountMinor: Number(order.total_minor),
      currency: order.currency,
      paymentMethodToken,
      idempotencyKey: `pay-${publicId}`,
    });
  } catch (err) {
    // Timeout/network: the outcome is UNKNOWN. Leave status 'created'; the reconciliation job
    // and the webhook will settle it. Do not mark failed here.
    throw httpError(502, 'PSP_UNAVAILABLE_RETRY_WITH_SAME_KEY');
  }

  // 4. Record PSP reference; guard the transition
  await pool.execute(
    `UPDATE payments SET status = 'pending', psp_payment_id = ?
      WHERE public_id = ? AND status = 'created'`,
    [intent.id, publicId],
  );
  return { paymentId: publicId, status: 'pending', clientSecret: intent.clientSecret };
}

async function callPsp(body) {
  const res = await fetch(`${process.env.PSP_BASE_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.PSP_SECRET_KEY}`,
      'idempotency-key': body.idempotencyKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`PSP ${res.status}`);
  return res.json();
}

function httpError(status, code) {
  return Object.assign(new Error(code), { status });
}
```

Note: PSP ka URL/payload shape illustrative hai; Stripe/Razorpay ke official SDK ka shape alag hoga, lekin idempotency key + timeout + unknown-state ka pattern same rehta hai.

Flow detail: agar client same key se retry kare jab pehla attempt `created` state mein tha (PSP call timeout hua), to humne `409 REQUEST_IN_PROGRESS` diya. Better version: `created` state mein stale ho (e.g., > 30s) to wahi PSP call dobara karo **same PSP idempotency key** (`pay-{publicId}`) ke saath; PSP duplicate charge nahi karega. Yeh isliye safe hai.

#### Code: webhook handler (verify, dedupe, transition, outbox)

```js
// src/payments/webhook.routes.js
import express, { Router } from 'express';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });
export const router = Router();

// raw body is required to verify the signature; do NOT use express.json() on this route
router.post('/webhooks/psp', express.raw({ type: 'application/json' }), async (req, res) => {
  const received = Buffer.from(req.get('x-psp-signature') ?? '', 'hex');
  const expected = crypto
    .createHmac('sha256', process.env.PSP_WEBHOOK_SECRET)
    .update(req.body) // Buffer
    .digest();
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.sendStatus(401);
  }

  const event = JSON.parse(req.body.toString('utf8'));
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // dedupe: PSPs deliver at-least-once
    try {
      await conn.execute('INSERT INTO webhook_events (event_id, event_type) VALUES (?, ?)', [
        event.id,
        event.type,
      ]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        await conn.rollback();
        return res.sendStatus(200); // already processed
      }
      throw err;
    }

    if (event.type === 'payment.succeeded') {
      const [r] = await conn.execute(
        `UPDATE payments SET status = 'succeeded'
          WHERE psp_payment_id = ? AND status IN ('created','pending')`,
        [event.data.paymentId],
      );
      if (r.affectedRows === 1) {
        const [[p]] = await conn.execute(
          'SELECT id, order_id, amount_minor FROM payments WHERE psp_payment_id = ?',
          [event.data.paymentId],
        );
        await conn.execute(`UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending_payment'`, [p.order_id]);
        await conn.execute(
          `INSERT INTO payment_events (payment_id, from_status, to_status, source) VALUES (?, 'pending', 'succeeded', 'webhook')`,
          [p.id],
        );
        await conn.execute(`INSERT INTO outbox (topic, payload) VALUES ('payment.succeeded', ?)`, [
          JSON.stringify({ paymentId: p.id, orderId: p.order_id, amountMinor: String(p.amount_minor) }),
        ]);
      }
      // affectedRows === 0 => out-of-order or already terminal: nothing to do
    } else if (event.type === 'payment.failed') {
      await conn.execute(
        `UPDATE payments SET status = 'failed', failure_code = ?
          WHERE psp_payment_id = ? AND status IN ('created','pending')`,
        [event.data.code ?? 'unknown', event.data.paymentId],
      );
    }

    await conn.commit();
    res.sendStatus(200); // respond fast; heavy work happens via outbox
  } catch (err) {
    await conn.rollback();
    // non-2xx makes the PSP retry later
    res.sendStatus(500);
  } finally {
    conn.release();
  }
});
```

Mount ordering: `express.json()` global middleware ke saath yeh route `app.use(express.json())` se **pehle** register karo ya route-specific raw parser use karo, warna body already parse ho chuki hogi aur signature verify nahi hoga. Real PSPs (Stripe) timestamp tolerance bhi lagate hain (replay attack rokne ke liye) aur apne SDK mein `constructEvent` dete hain; wahi use karo.

Dedupe insert aur state change **ek hi transaction** mein hain: agar processing fail ho to dedupe row bhi rollback ho jati hai, aur PSP ka retry dobara process karega.

#### Failure scenarios

| Failure | Behavior | Mitigation |
|---------|----------|------------|
| Customer double-clicks Pay | Two requests, same key | `UNIQUE(user_id, idempotency_key)`; second gets replay/409 |
| PSP call times out | Unknown if charged | Leave `created`; retry with same PSP idempotency key; webhook + reconciliation settle |
| Server crashes after PSP charge, before DB update | Charged but DB says `created` | Webhook arrives and moves to `succeeded`; reconciliation catches rest |
| Duplicate webhook | Same event twice | `webhook_events` PK + conditional UPDATE |
| Out-of-order webhooks (failed after succeeded?) | Wrong final state | Forward-only transitions via `WHERE status IN (...)` |
| Webhook endpoint down | PSP retries (hours/days) | Idempotent handler; reconciliation job pulls missed events |
| Webhook forged | Fake "paid" | HMAC signature on raw body, timing-safe compare, timestamp tolerance |
| Order cancelled/expired while payment succeeds | Money taken, no order | Detect on webhook: if order not payable -> auto refund + alert |
| Amount mismatch (tampering) | Wrong charge | Server-computed amount; verify PSP amount equals order total on webhook |
| DB down at webhook time | 500 -> PSP retries | Fine; idempotent |
| PSP outage | Cannot create payments | Fast timeout, clear error, circuit breaker, optional secondary PSP `[ADVANCED]` |
| Refund API call times out | Unknown refund state | Same pattern: refund row + idempotency key + reconcile |

**Reconciliation job** (safety net, runs every few minutes + daily full):

```
for each payment in ('created','pending') older than 15 min:
    p = PSP.retrievePayment(psp_payment_id or by idempotency key)
    if p.status == succeeded -> apply same transition code path as webhook (source='reconciliation')
    if p.status == failed/canceled/expired -> mark failed/canceled
daily: compare PSP settlement report totals with SUM(payments.succeeded) -> alert on mismatch
```

#### Trade-offs

- **Webhook-only vs webhook + polling:** webhook fast but can be missed; polling/reconciliation adds load but guarantees convergence. Use both.
- **Synchronous confirmation vs async:** async (webhook) works for 3DS/UPI/bank redirects; UI must poll or use SSE.
- **Strong consistency (single MySQL primary) vs scale:** payments volume modest; keep it on primary, scale reads elsewhere.
- **One table with status vs event-sourcing:** status + audit events table = simple and enough; full event sourcing `[ADVANCED]` only if needed.
- **Build PSP abstraction early?** Thin adapter interface is cheap; full multi-PSP routing only if justified.

#### Scaling options

1. Single MySQL primary + indexes (`status, updated_at` for reconcile scans). Handles hundreds of payments/s.
2. Move side effects to queue via outbox (receipts, fulfillment, accounting), keeping the webhook transaction short.
3. Read replicas for history pages (not for post-payment status checks right after paying: replica lag).
4. Partition `payments`/`payment_events` by month; archive old.
5. Multiple webhook receiver instances (stateless; DB handles dedupe).
6. Separate payment service/DB (microservice) only if compliance/team isolation demands (Day 1.1).

**Real-world scenario (marketplace)**

Buyer 2,499 rupees ka order pay karta hai. UPI app khulti hai, buyer approve karta hai, lekin app se browser wapas aane se pehle network kat jata hai. Browser "success" page tak nahi pahunchta, lekin PSP ka webhook server par aata hai: payment `succeeded`, order `paid`, outbox se email + seller notification + fulfillment. Buyer app dobara kholta hai to `GET /payments/:id` `succeeded` dikhata hai. Agar webhook bhi miss hota, to reconciliation 15 minute mein payment ko sahi state mein la deta.

**Interview answer:**
"I would model a payment as a state machine in MySQL: created, pending, succeeded, failed, refunded, with forward-only transitions implemented as conditional updates. The create-payment API requires an Idempotency-Key, enforced by a unique index on user and key, and the amount comes from the order on the server, never from the client. I insert the payment row first, then call the payment provider outside any database transaction, with a timeout and the provider's own idempotency key. If the call times out, I treat the result as unknown, not failed. The source of truth for success is a signed webhook: I verify the HMAC on the raw body, dedupe by event id in the same transaction that updates the payment and order and writes an outbox row, and return 200 quickly. Side effects like emails and fulfillment run from the outbox through a queue. A reconciliation job queries the provider for payments stuck in created or pending and compares settlement reports daily, so the system converges even if webhooks are lost."

**Follow-up questions**

1. *Timeout par kya karoge?* Unknown state: failed mark nahi karenge. PSP idempotency key ke saath safe retry; webhook aur reconciliation final state laayenge.
2. *Webhook duplicate/out-of-order kaise handle?* Event id dedupe (PK) aur forward-only conditional UPDATE; `affectedRows` check.
3. *User success page par redirect hua, order paid kar du?* Nahi. Browser trust nahi hota; webhook ya server-side PSP verification se hi.
4. *Idempotency key aur request hash ka kya role?* Key duplicate detect karti hai; hash same key ke saath different payload (bug/abuse) pakadta hai.
5. *Refund kaise design karoge?* Alag `refunds` table, own state machine + idempotency key, sum(refunds) <= captured amount constraint (check in transaction with `FOR UPDATE` on payment row), PSP refund API same pattern.
6. *Inventory oversell kaise rokoge?* Order create par stock reserve (hold with expiry) ya conditional update `UPDATE stock SET qty = qty - ? WHERE id = ? AND qty >= ?`; payment fail/expire par release (saga compensation).
7. *Card details store karte ho?* Nahi. PSP tokens/hosted fields; PCI-DSS scope chhota rakhte hain.

**Common mistakes**

- Float/Number for money; client-supplied amount.
- Treating a timeout as failure (double charge on retry).
- Marking paid on the frontend redirect.
- Holding a DB transaction open during the PSP HTTP call.
- Webhook handler without signature verification or dedupe.
- Parsing webhook body with `express.json()` before verifying signature.
- Doing heavy work (emails, PDFs) inside webhook before returning 200 (PSP timeout, retries).
- No reconciliation.
- Updating status without checking previous status (overwriting `refunded` with `succeeded`).

**Revision notes**

- State machine + conditional UPDATE; unique idempotency key; request hash.
- PSP call outside txn, with timeout + PSP idempotency; unknown != failed.
- Webhook: raw body HMAC, dedupe, one txn (payment+order+outbox), fast 200.
- Reconciliation closes the loop.

### 4.3 Design: Internal money transfer with a ledger `[ESSENTIAL]`

Yeh banking/wallet question hai: "A se B ko paisa transfer karo, concurrency aur failure ke saath."

#### Requirements

Functional:

- Account A se account B ko amount transfer.
- Insufficient balance par reject.
- Transaction history / statement, balance read.
- Same transfer request retry ho to ek hi baar execute.

Non-functional:

- **Atomicity:** debit aur credit dono hon ya dono nahi.
- **No overdraft / double spend** under concurrent transfers.
- **No deadlocks** (A->B aur B->A ek saath).
- **Auditability:** immutable ledger.
- Strong consistency; correctness > throughput.

#### Simplest working design

Ek MySQL transaction: dono accounts ke rows lock karo, balance check, update dono, ledger entries insert, commit. InnoDB ACID yeh sab de deta hai; extra infrastructure ki zaroorat nahi.

#### API design

```
POST /v1/transfers
  Headers: Idempotency-Key: 3f2a...
  Body   : { "fromAccountId": 11, "toAccountId": 22, "amountMinor": 25000, "currency": "INR" }
  201    : { "transferId": "...", "status": "completed" }
  200    : replay of same key
  402/409: insufficient funds
  404    : account missing
  422    : same key, different payload

GET /v1/accounts/:id/balance
GET /v1/accounts/:id/ledger?limit=50&cursor=...
```

Authorization: sirf `fromAccountId` ka owner transfer start kar sake (Week 5 / Day 4 authz).

#### MySQL schema

```sql
CREATE TABLE accounts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  currency      CHAR(3) NOT NULL,
  balance_minor BIGINT NOT NULL DEFAULT 0,
  version       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  CONSTRAINT chk_balance_non_negative CHECK (balance_minor >= 0)
) ENGINE=InnoDB;

CREATE TABLE transfers (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id       CHAR(36) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  request_hash    CHAR(64) NOT NULL,
  from_account_id BIGINT UNSIGNED NOT NULL,
  to_account_id   BIGINT UNSIGNED NOT NULL,
  amount_minor    BIGINT UNSIGNED NOT NULL,
  currency        CHAR(3) NOT NULL,
  status          ENUM('completed','failed') NOT NULL,
  failure_reason  VARCHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_public_id (public_id),
  UNIQUE KEY uq_idem (from_account_id, idempotency_key),
  KEY idx_to_account (to_account_id),
  CONSTRAINT fk_tr_from FOREIGN KEY (from_account_id) REFERENCES accounts (id),
  CONSTRAINT fk_tr_to   FOREIGN KEY (to_account_id)   REFERENCES accounts (id),
  CONSTRAINT chk_amount_positive CHECK (amount_minor > 0),
  CONSTRAINT chk_not_self CHECK (from_account_id <> to_account_id)
) ENGINE=InnoDB;

CREATE TABLE ledger_entries (                 -- append-only, never UPDATE/DELETE
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transfer_id   BIGINT UNSIGNED NOT NULL,
  account_id    BIGINT UNSIGNED NOT NULL,
  direction     ENUM('debit','credit') NOT NULL,
  amount_minor  BIGINT UNSIGNED NOT NULL,
  balance_after BIGINT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_account_id (account_id, id),
  CONSTRAINT fk_le_transfer FOREIGN KEY (transfer_id) REFERENCES transfers (id),
  CONSTRAINT fk_le_account  FOREIGN KEY (account_id)  REFERENCES accounts (id)
) ENGINE=InnoDB;
```

Notes:

- `CHECK (balance_minor >= 0)` MySQL 8.0.16+ mein enforce hota hai (older versions parse karke ignore karte the). Yeh last line of defense hai; app logic bhi check karta hai.
- `UNIQUE(from_account_id, idempotency_key)`: duplicate transfer DB-level block.
- Ledger **double-entry**: har transfer ke do rows (debit A, credit B), amounts equal. Invariant: `SUM(credit) = SUM(debit)` per transfer; `accounts.balance_minor` ledger ka cached/derived result hai aur nightly check se verify hota hai.

#### Code: transfer in one transaction with ordered locking

```js
// src/transfers/transfer.service.js
import { createHash, randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });

export async function transfer({ userId, idempotencyKey, fromId, toId, amountMinor, currency }) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw httpError(400, 'INVALID_AMOUNT');
  if (fromId === toId) throw httpError(400, 'SAME_ACCOUNT');

  const requestHash = createHash('sha256')
    .update(JSON.stringify({ fromId, toId, amountMinor, currency }))
    .digest('hex');

  // Retry the whole transaction on deadlock (rare, but possible under load)
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Idempotency: if this key already produced a transfer, return it
      const [prev] = await conn.execute(
        `SELECT public_id, status, request_hash FROM transfers
          WHERE from_account_id = ? AND idempotency_key = ?`,
        [fromId, idempotencyKey],
      );
      if (prev.length > 0) {
        await conn.rollback();
        if (prev[0].request_hash !== requestHash) throw httpError(422, 'IDEMPOTENCY_KEY_REUSED');
        return { transferId: prev[0].public_id, status: prev[0].status, replay: true };
      }

      // 2. Lock both accounts in a fixed order (ascending id) => no A<->B deadlock cycle
      const ids = [fromId, toId].sort((a, b) => a - b);
      const [accounts] = await conn.query(
        `SELECT id, user_id, currency, balance_minor
           FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE`,
        ids,
      );
      const from = accounts.find((a) => a.id === fromId);
      const to = accounts.find((a) => a.id === toId);
      if (!from || !to) throw httpError(404, 'ACCOUNT_NOT_FOUND');
      if (from.user_id !== userId) throw httpError(403, 'NOT_OWNER');
      if (from.currency !== currency || to.currency !== currency) throw httpError(422, 'CURRENCY_MISMATCH');
      if (BigInt(from.balance_minor) < BigInt(amountMinor)) throw httpError(409, 'INSUFFICIENT_FUNDS');

      // 3. Record the transfer (UNIQUE key also guards a concurrent duplicate)
      const publicId = randomUUID();
      const [t] = await conn.execute(
        `INSERT INTO transfers (public_id, idempotency_key, request_hash, from_account_id,
                                to_account_id, amount_minor, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [publicId, idempotencyKey, requestHash, fromId, toId, amountMinor, currency],
      );

      // 4. Move money
      await conn.execute(
        'UPDATE accounts SET balance_minor = balance_minor - ?, version = version + 1 WHERE id = ?',
        [amountMinor, fromId],
      );
      await conn.execute(
        'UPDATE accounts SET balance_minor = balance_minor + ?, version = version + 1 WHERE id = ?',
        [amountMinor, toId],
      );

      // 5. Double-entry ledger
      const fromAfter = BigInt(from.balance_minor) - BigInt(amountMinor);
      const toAfter = BigInt(to.balance_minor) + BigInt(amountMinor);
      await conn.execute(
        `INSERT INTO ledger_entries (transfer_id, account_id, direction, amount_minor, balance_after)
         VALUES (?, ?, 'debit', ?, ?), (?, ?, 'credit', ?, ?)`,
        [t.insertId, fromId, amountMinor, fromAfter.toString(), t.insertId, toId, amountMinor, toAfter.toString()],
      );

      await conn.commit();
      return { transferId: publicId, status: 'completed', replay: false };
    } catch (err) {
      await conn.rollback().catch(() => {});
      if (err.code === 'ER_LOCK_DEADLOCK' && attempt < 3) continue; // retry whole txn
      if (err.code === 'ER_DUP_ENTRY' && attempt < 3) continue;     // concurrent duplicate won; replay next loop
      throw err;
    } finally {
      conn.release();
    }
  }
}

function httpError(status, code) {
  return Object.assign(new Error(code), { status });
}
```

Kyun yeh sahi hai:

- `SELECT ... FOR UPDATE` dono rows par exclusive lock leta hai: concurrent transfer wait karega, isliye double spend nahi (REPEATABLE READ mein plain SELECT stale balance dikha sakta tha; locking read latest committed value padhta hai).
- **Lock ordering:** hamesha chhota id pehle. Agar A->B aur B->A ek saath ho, dono pehle account 1 lock karna chahenge, circular wait nahi banta, isliye deadlock nahi.
- Pura kaam ek transaction mein: crash par rollback, partial debit nahi.
- Retries: deadlock (`ER_LOCK_DEADLOCK`) par poora transaction dobara chalao (Week 4 / Day 5); duplicate-key race par loop dobara chalata hai aur ab step 1 replay return karega.
- `BigInt` isliye: mysql2 `BIGINT` ko default mein Number/string return kar sakta hai; bade balances par precision ka risk. Production mein `supportBigNumbers: true, bigNumberStrings: true` pool option set karo aur strings/BigInt se kaam karo.

Alternative: optimistic locking with `version` column: `UPDATE accounts SET ... WHERE id = ? AND version = ?`, affectedRows 0 => retry. Hot accounts par retries badhte hain; money paths par pessimistic lock (`FOR UPDATE`) common hai.

#### Components

- Transfer API (Node.js, stateless).
- MySQL primary (accounts, transfers, ledger).
- Optional: outbox for notifications/statements after commit.
- Nightly reconciliation job: `accounts.balance_minor == SUM(credits) - SUM(debits)` aur global debit = credit.

#### Data flow

```
 Client --POST /transfers (Idempotency-Key)--> API
                                                |
                                       BEGIN (conn from pool)
                                                | SELECT transfer by key  -> replay? return
                                                | SELECT accounts (ordered ids) FOR UPDATE
                                                | check owner, currency, balance
                                                | INSERT transfers
                                                | UPDATE accounts (-A, +B)
                                                | INSERT ledger_entries x2
                                       COMMIT   |
                                                v
                                         201 Created
                                                | (after commit) outbox -> notify both parties
```

#### Failure scenarios

| Failure | Behavior | Mitigation |
|---------|----------|------------|
| App crashes mid-transaction | InnoDB rolls back | Atomicity; client retries with same key |
| Client timeout after commit | Client does not know result | Retry with same key returns the stored result |
| Two concurrent transfers from same account | Serialized by row lock | `FOR UPDATE`; balance re-checked after lock |
| A->B and B->A concurrently | Possible deadlock | Ordered locking; retry on `ER_LOCK_DEADLOCK` |
| Overdraft via bug | Negative balance | `CHECK (balance_minor >= 0)` + app check |
| Lock wait timeout (hot account) | `ER_LOCK_WAIT_TIMEOUT` | Short transactions, retry/backoff, 503 with Retry-After |
| Replica lag on balance read | Stale balance shown | Read balance from primary for money screens |
| Ledger/balance drift (bug) | Inconsistent | Nightly reconciliation + alerts |
| Cross-currency / cross-bank transfer | Needs multiple systems | Saga with pending/holding account + compensation `[ADVANCED]` |

#### Trade-offs

- Pessimistic (`FOR UPDATE`) vs optimistic (version): pessimistic is simpler/safer for money; optimistic scales better on low contention.
- Stored balance + ledger vs ledger-only (compute balance via SUM): stored balance is O(1) read; ledger-only is purest but slow without snapshots. Common approach: both, with reconciliation.
- Single DB vs distributed: single-DB ACID is easy; cross-service transfers need saga/2PC (avoid 2PC, prefer saga + idempotent steps + reconciliation).
- Isolation level: default REPEATABLE READ with locking reads is fine; SERIALIZABLE is simpler to reason about but more lock contention/deadlocks.

#### Scaling options

1. Single primary + proper indexes + short transactions; typically thousands of transfers/s on decent hardware.
2. Hot accounts (e.g., merchant settlement account): split into sub-accounts/buckets and aggregate later, or serialize through a queue per account.
3. Partition ledger by month; archive.
4. Shard by account id ranges only when needed; cross-shard transfers then need saga (two-phase style with idempotent steps).
5. Reads (statements) from replicas, balance for decisions from primary.

**Frontend connection:** Banking app ka "Send money" button: UI disable karna kaafi nahi; same `Idempotency-Key` ke saath retry safe hai. "Pending/processing" spinner ke baad `GET /transfers/:id` se confirm dikhana chahiye, optimistic UI se paisa "gaya" dikhana galat ho sakta hai.

**Real-world scenario (banking)**

Rahul 500 rupees Priya ko bhej raha hai, usi waqt Priya bhi Rahul ko 200 bhej rahi hai. Dono transactions account 1 pehle lock karte hain (ascending order), isliye ek wait karta hai aur doosra complete hota hai; deadlock nahi. Rahul ka network beech mein toot jaata hai aur app retry karta hai: same `Idempotency-Key`, server stored result return karta hai, paisa ek hi baar gaya.

**Interview answer:**
"For an internal transfer I keep everything in one MySQL transaction. First I check the idempotency key so a retried request returns the stored result. Then I lock both account rows with SELECT FOR UPDATE, always in ascending id order so that opposite transfers cannot deadlock. I verify ownership, currency and balance after taking the lock, insert the transfer, update both balances, and write two immutable double-entry ledger rows, one debit and one credit, then commit. Amounts are integers in minor units, and a CHECK constraint prevents negative balances as a last line of defense. If MySQL reports a deadlock I retry the whole transaction. The ledger is append-only for auditability, and a nightly job verifies that balances equal the sum of ledger entries. For scale I keep transactions short, split hot accounts, move reads to replicas except balance checks for decisions, and only consider sharding with saga-style cross-shard transfers if one primary is truly insufficient."

**Follow-up questions**

1. *Isolation level kaun sa?* InnoDB default REPEATABLE READ; locking read (`FOR UPDATE`) latest committed row padhta hai aur lock leta hai, isliye lost update/double spend nahi. SERIALIZABLE bhi chalega lekin zyada contention.
2. *Deadlock kaise avoid?* Consistent lock ordering, short transactions, indexes ke through narrow locks; phir bhi retry on `ER_LOCK_DEADLOCK`.
3. *Idempotency yahan kaise?* Unique `(from_account_id, idempotency_key)` aur same transaction mein transfer row; replay stored result.
4. *Balance ko stored rakhein ya SUM karein?* Stored + ledger, nightly reconciliation; SUM har read par slow.
5. *Cross-bank transfer?* Saga: debit from sender to "in-transit" account, call external rail (idempotent), on success credit/settle, on failure reverse (compensating entry). Eventual consistency + reconciliation.
6. *Reversal kaise?* Original ledger entries delete/update nahi karte; naya reversing transfer (opposite entries) banate hain, `reversal_of` reference ke saath.

**Common mistakes**

- Read balance (plain SELECT), check in JS, then UPDATE (race => double spend).
- `UPDATE ... SET balance = <value computed in JS>` instead of relative `balance = balance - ?`.
- Inconsistent lock order (deadlocks).
- Floats for amounts.
- No idempotency on retries.
- Updating/deleting ledger rows.
- Doing external HTTP calls while holding row locks.
- Ignoring `ER_LOCK_DEADLOCK` instead of retrying.
- Assuming CHECK constraints work on very old MySQL (before 8.0.16 they were ignored).

**Revision notes**

- One ACID transaction: idempotency check, ordered `FOR UPDATE`, validate, insert transfer, relative updates, ledger x2.
- Deadlock = retry whole txn; lock ordering prevents cycles.
- Double-entry ledger append-only + reconciliation.

### 4.4 Retries, idempotency and failure recovery toolbox `[ESSENTIAL]`

**Concept**

Distributed systems mein failures normal hain: timeout, duplicate delivery, partial success. Recovery ke liye 6 tools: **timeouts, retries (with backoff + jitter), idempotency, outbox, reconciliation, saga/compensation.** Week 6 / Day 3 mein basics ho chuke hain; yahan decision-making.

**Which errors to retry**

| Situation | Retry? | Why |
|-----------|--------|-----|
| Network timeout, connection reset | Yes, if operation idempotent | Transient |
| HTTP 502/503/504 | Yes, with backoff | Server overloaded/restarting |
| HTTP 429 | Yes, after `Retry-After` | Rate limited |
| HTTP 400/401/403/404/422 | No | Request itself is wrong; retry same result |
| HTTP 409 (conflict/in progress) | Sometimes, after delay | Depends |
| Non-idempotent POST without key | **No** (or add key first) | Duplicate side effect risk |

**Exponential backoff with jitter (utility)**

```js
// src/lib/retry.js
export async function withRetry(fn, { retries = 4, baseMs = 200, maxMs = 5000, isRetryable = () => true } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const cap = Math.min(maxMs, baseMs * 2 ** attempt);
      const delay = Math.random() * cap; // "full jitter": spreads retries, avoids thundering herd
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
}

// usage
// await withRetry(() => psp.getPayment(id), { isRetryable: (e) => e.status >= 500 || e.name === 'TimeoutError' });
```

Retry budget: total retries ko limit karo (e.g., 10% extra traffic), warna outage mein retries se load multiply hota hai (retry storm). Retries sirf ek layer par karo (client, ya service, ya LB), har layer par nahi, warna 3 layers x 3 retries = 27 attempts.

**Idempotency key semantics**

- Client UUID generate karta hai per *logical operation* (not per HTTP attempt). Retry par same key.
- Server stores: key, request hash, status (in-progress/complete), response. Replay par stored response return.
- Scope: key per user/account (collisions across users avoid).
- TTL: 24h-7d store karo, phir purge (ya business unique constraint se hamesha enforce).
- Natural idempotency better hai jahan possible: `PUT /resources/{id}` (same result), unique business constraints (e.g., one payment per order attempt).

**Outbox pattern** (summary; code in Day 5)

Business change aur "event to publish" ek hi DB transaction mein likho (outbox table), phir alag publisher event bhejta hai. Isse "DB commit hua lekin event publish fail" (dual-write problem) khatam. Delivery at-least-once => consumers idempotent.

**Saga (distributed workflow with compensation)**

Order flow: `reserve stock -> charge payment -> confirm order`. Failure par reverse order mein compensation:

```
 reserve stock (OK) -> charge payment (FAIL)  => compensate: release stock, mark order canceled
 reserve stock (OK) -> charge payment (OK) -> confirm (FAIL) => compensate: refund payment, release stock
```

- **Orchestration:** ek coordinator steps chalata hai (easy to reason).
- **Choreography:** services events se react karti hain (loose coupling, harder to trace).
- Har step aur compensation **idempotent** hone chahiye. State DB mein persist karo (crash par resume).

**Circuit breaker** `[ADVANCED]`

Dependency (PSP) baar-baar fail ho to kuch der ke liye calls rok do (open), jaldi fail karo, phir half-open mein thoda test. Isse threads/connections block nahi hote aur dependency ko recover hone ka time milta hai. (Libraries: `opossum`.)

**Failure recovery checklist**

1. Timeout on every outbound call.
2. Idempotent operations or keys.
3. Persist intent before side effect (insert row first).
4. Converging background jobs (retry stuck states, reconciliation).
5. Dead-letter + alert for items that cannot self-heal.
6. Observability: metrics for retries, stuck counts, reconciliation diffs (Day 5).

**Interview answer:**
"I classify failures first: transient errors such as timeouts, 503 and 429 are retried with exponential backoff and jitter and a retry budget, while 4xx validation errors are not. Retrying is only safe when the operation is idempotent, so write APIs accept an idempotency key and store the request hash and result, and I persist my intent in the database before performing any external side effect. To avoid dual writes between the database and a message broker I use the transactional outbox. For multi-step business flows across services I use a saga with idempotent steps and compensating actions, and a reconciliation job as the safety net that repairs anything stuck. Dead-letter queues and alerts cover failures that cannot self-heal."

**Follow-up questions**

1. *Idempotency aur retry mein difference?* Retry client/service ka behavior hai (dobara try karna); idempotency server ka property hai (dobara aane par same effect). Retry safe tabhi jab idempotent.
2. *Exactly-once possible hai?* Network par practically nahi; at-least-once delivery + idempotent processing se "effectively once" milta hai.
3. *Retry storm kya hai?* Outage mein sab clients ek saath retry karte hain aur load multiply hota hai. Fix: jitter, backoff, retry budget, circuit breaker, load shedding.
4. *2PC kyun avoid karte hain?* Coordinator failure par participants locks ke saath block ho jaate hain; availability/complexity cost. Saga + idempotency practical hai.
5. *Compensating action fail ho jaye?* Retry until success (idempotent), phir DLQ + manual intervention/alert.

**Common mistakes**

- Retry on every error including 4xx.
- Retrying at every layer.
- No jitter.
- New idempotency key per retry (defeats the purpose).
- Idempotency store without request-hash check.
- Saga steps not idempotent.
- Publishing events after commit in app code without outbox.

**Revision notes**

- Timeout + backoff/jitter + budget; retry only idempotent/transient.
- Idempotency key per logical operation, stored result, hash check.
- Outbox, saga with compensation, reconciliation, DLQ.

### Day 4 wrap-up

**Key concepts to remember**

- Integer minor units; server-computed amounts; unknown != failed.
- PSP flow: payment row first, PSP call outside txn, webhook as truth (HMAC raw body, dedupe, one txn), reconciliation.
- Transfer: single ACID txn, ordered `FOR UPDATE`, relative updates, double-entry ledger, retry on deadlock.
- Idempotency keys + outbox + saga + backoff with jitter.

**Five revision questions**

1. Payment API timeout ho gaya. Tum kya karoge aur kya nahi?
2. Webhook handler mein signature verify, dedupe aur state transition kaise implement karoge? Raw body kyun zaroori hai?
3. A->B aur B->A transfers ek saath chalein to deadlock kaise rokte ho?
4. Idempotency key aur request hash dono kyun store karte hain?
5. Saga aur 2PC ka difference? Saga mein compensation fail ho to?

**Practical coding task**

`transfer()` function Docker MySQL par chalao. Do accounts banao (balance 1000 aur 1000). 200 concurrent transfers (random direction, random small amounts, har ek ka unique idempotency key) `Promise.all` se chalao, phir assert karo: total balance (sum of both) 2000 hi hai, koi balance negative nahi, aur `SUM(credit) = SUM(debit)` ledger mein. Phir lock ordering hata kar (sort comment out) deadlock errors count karo aur dekho retry kitna zaroori ho jata hai.

**Self-assessment checklist**

- [ ] Main payment state machine aur conditional-update transitions explain kar sakta hoon.
- [ ] Main idempotent create-payment ka flow bina dekhe bol sakta hoon.
- [ ] Main webhook verification + dedupe + outbox ek transaction mein samjha sakta hoon.
- [ ] Main ordered locking se deadlock prevention explain kar sakta hoon.
- [ ] Main retry classification, outbox, saga ko ek paragraph mein bol sakta hoon.

---

## Day 5 - Message queues, async processing, logging, metrics, monitoring

**Learning objectives**

- Message queue kab chahiye aur kab nahi, aur broker choose karna (BullMQ/Redis, RabbitMQ, SQS, Kafka).
- Delivery semantics (at-most-once, at-least-once), ack/retry/DLQ, idempotent consumers.
- Transactional outbox pattern ko code ke saath implement karna.
- Long-running work ke liye async API pattern (202 Accepted + job status).
- Logs, metrics, traces, health checks, alerts: production Node service ko observable kaise banate hain.

Estimated time: 60 min queues + async processing, 50 min observability, 10 min revision questions.

Cross-reference: Week 6 / Day 5 (BullMQ basics, graceful shutdown), Week 6 / Day 2 (logging, correlation IDs), Week 6 / Day 6 (debugging slow APIs). Yahan design-level integration hai.

### 5.1 Message queues and asynchronous processing `[ESSENTIAL]`

**Concept**

Message queue = producer message daalta hai, consumer baad mein process karta hai. Producer aur consumer ek doosre ka wait nahi karte (decoupling in time).

**Why it matters**

1. **Latency:** user ko turant response, heavy kaam (email, PDF, image resize) background mein.
2. **Reliability:** consumer down ho to messages queue mein safe rehte hain.
3. **Load leveling:** traffic spike ko queue absorb karta hai; workers apni speed par process karte hain (backpressure).
4. **Decoupling:** producer ko pata nahi consumer kaun hai.
5. **Retry/isolation:** ek failing job baaki ko block nahi karta.

Queue kab nahi: agar kaam 20 ms ka hai aur user ko result chahiye (simple read), to queue overkill hai. Queue complexity laata hai: eventual consistency, duplicates, monitoring.

**Internal working: queue vs pub/sub vs log**

| Model | Behavior | Example use | Tools |
|-------|----------|-------------|-------|
| Work queue | Har message ek consumer ko, process hone ke baad delete | Email send, image resize | BullMQ, SQS, RabbitMQ queues |
| Pub/Sub (fan-out) | Har message sabhi subscribers ko | "OrderPlaced" -> email + analytics + inventory | RabbitMQ exchanges, SNS, Redis pub/sub (no durability) |
| Log / stream | Append-only, consumers apna offset track karte hain, replay possible | Event streaming, analytics, audit | Kafka |

**Broker comparison (practical)**

| Tool | Good for | Notes |
|------|----------|-------|
| BullMQ (Redis) | Node.js jobs: retries, delays, priorities, rate limit, cron | Easy for Node teams; durability depends on Redis persistence config |
| RabbitMQ | Complex routing, acks, DLX, multiple languages | Operate yourself or managed |
| AWS SQS (+SNS) | Fully managed, scales, at-least-once, DLQ built in | Visibility timeout; standard queues unordered, FIFO queues ordered/dedupe |
| Kafka | Very high throughput, replay, event streaming, multiple consumer groups | Operationally heavy; overkill for most junior/mid projects `[ADVANCED]` |

Interview recommendation: "For a Node.js team with Redis already present, BullMQ; on AWS, SQS; Kafka only for high-volume streaming/replay requirements."

**Delivery semantics** `[ESSENTIAL]`

- **At-most-once:** message deliver hone par ack se pehle hi delete: crash par lost, duplicates nahi. Rarely acceptable.
- **At-least-once:** ack consumer ke process complete hone ke baad. Crash par message dobara aata hai: **duplicates possible**. Industry default.
- **Exactly-once:** end-to-end practically nahi; "effectively once" = at-least-once + **idempotent consumer**.

Isliye har consumer ko yeh sawaal poochho: "Agar yeh message 2 baar process ho jaye to kya hoga?"

**Idempotent consumer pattern**

```sql
CREATE TABLE processed_messages (
  consumer   VARCHAR(64)  NOT NULL,
  message_id VARCHAR(128) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (consumer, message_id)
) ENGINE=InnoDB;
```

```js
// Effect and the "processed" marker commit together, or not at all
async function handleOnce(conn, consumer, messageId, applyEffect) {
  await conn.beginTransaction();
  try {
    const [r] = await conn.execute(
      'INSERT IGNORE INTO processed_messages (consumer, message_id) VALUES (?, ?)',
      [consumer, messageId],
    );
    if (r.affectedRows === 0) {
      await conn.rollback(); // duplicate delivery, already processed
      return false;
    }
    await applyEffect(conn); // must use the same conn so it is part of the transaction
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}
```

Yeh tab kaam karta hai jab effect same DB mein ho. External side effect (email) ke liye provider idempotency key ya "send-once" record chahiye.

**Retries, DLQ, poison messages**

- Job fail ho to retry with backoff (attempts: 5, exponential).
- Max attempts ke baad **dead-letter queue (DLQ)** / failed set mein; alert; manual inspect/replay.
- **Poison message:** hamesha fail hone wala message jo baaki ko block kare; DLQ isse isolate karta hai.
- **Visibility timeout (SQS) / lock duration (BullMQ):** worker job lock leta hai; agar timeout se pehle ack na kare to job doosre worker ko mil jata hai. Timeout > expected processing time rakho.

**Ordering and concurrency**

- Standard queues mein order guaranteed nahi. Strict order chahiye to per-key ordering (Kafka partition key, SQS FIFO message group id) ya design aisa karo ki order matter na kare (idempotent, version numbers).
- Concurrency = ek worker ke andar parallel jobs; I/O bound jobs ke liye 10-50, CPU-bound ke liye kam (ya worker threads/alag process).

#### Code: BullMQ producer and worker (ES modules)

```js
// src/queues/connection.js
export const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
};
```

```js
// src/queues/email.queue.js
import { Queue } from 'bullmq';
import { connection } from './connection.js';

export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s, 16s
    removeOnComplete: { age: 3600, count: 1000 },   // keep Redis small
    removeOnFail: false,                            // keep failed jobs for inspection (DLQ-like)
  },
});

// jobId makes enqueue idempotent while the job is retained
export function enqueueOrderEmail(orderId, userId) {
  return emailQueue.add('order-confirmation', { orderId, userId }, { jobId: `order-email-${orderId}` });
}
```

```js
// src/workers/email.worker.js
import { Worker } from 'bullmq';
import { connection } from '../queues/connection.js';

const worker = new Worker(
  'email',
  async (job) => {
    const { orderId, userId } = job.data;
    // 1. load data, 2. send via provider with timeout and idempotency key
    const res = await fetch(process.env.EMAIL_PROVIDER_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': `order-email-${orderId}` },
      body: JSON.stringify({ userId, template: 'order-confirmation', orderId }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`provider ${res.status}`); // throwing => retry with backoff
    return { ok: true };
  },
  { connection, concurrency: 10 },
);

worker.on('failed', (job, err) => {
  console.error(JSON.stringify({ msg: 'job failed', jobId: job?.id, attempts: job?.attemptsMade, err: err.message }));
});

// graceful shutdown: stop taking jobs, let running ones finish
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    await worker.close();
    process.exit(0);
  });
}
```

BullMQ ke custom `jobId` mein `:` allowed nahi hota aur purely integer ID allowed nahi hoti, isliye `order-email-123` jaisa format use kiya. BullMQ API version-dependent hai; behavior ke liye apne installed version ka documentation dekho (yeh code BullMQ 5.x style hai).

Redis persistence: BullMQ jobs Redis mein hote hain; Redis restart par jobs lose na hon, isliye `appendonly yes` (AOF) enable karo aur `maxmemory-policy noeviction` rakho (eviction policy se queue keys delete ho sakti hain). Yeh common production mistake hai.

#### Transactional outbox pattern `[ESSENTIAL]`

**Problem (dual write):** `COMMIT` DB mein ho gaya, lekin `queue.add()` fail (ya reverse order mein queue add hua aur commit fail). Result: event lost ya phantom event.

**Solution:** event ko bhi DB mein, business data ke saath, ek hi transaction mein likho (`outbox` table, Day 4 schema). Alag publisher process outbox rows ko queue mein bhejta hai aur `published_at` set karta hai.

```
 API:  BEGIN
         INSERT orders ...
         INSERT outbox (topic='order.created', payload=...)
       COMMIT                         <-- atomic: both or neither

 Publisher (loop):  SELECT unpublished FROM outbox ... FOR UPDATE SKIP LOCKED
                    queue.add(...)   -> mark published_at
```

```js
// src/outbox/publisher.js
import mysql from 'mysql2/promise';
import { Queue } from 'bullmq';
import { connection } from '../queues/connection.js';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 3 });
const queues = new Map();
const getQueue = (name) => {
  if (!queues.has(name)) queues.set(name, new Queue(name, { connection }));
  return queues.get(name);
};

export async function publishBatch(limit = 100) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, topic, payload FROM outbox
        WHERE published_at IS NULL
        ORDER BY id
        LIMIT ?
        FOR UPDATE SKIP LOCKED`,
      [limit],
    );
    for (const row of rows) {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      // deterministic jobId: if we crash after add() but before the UPDATE, the retry is deduped
      await getQueue(row.topic.replace('.', '-')).add(row.topic, payload, { jobId: `outbox-${row.id}` });
    }
    if (rows.length > 0) {
      await conn.query('UPDATE outbox SET published_at = NOW() WHERE id IN (?)', [rows.map((r) => r.id)]);
    }
    await conn.commit();
    return rows.length;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

let running = true;
process.on('SIGTERM', () => {
  running = false;
});
while (running) {
  const n = await publishBatch();
  if (n === 0) await new Promise((r) => setTimeout(r, 500));
}
```

(mysql2 JSON columns ko usually parsed object ke roop mein deta hai; code dono forms handle karta hai.) Publisher at-least-once publish karta hai; consumer idempotent ho. Alternative to polling: CDC (Debezium reading binlog) `[ADVANCED]`.

Queue name mein `:` BullMQ mein problem karta hai isliye `.` ko `-` se replace kiya.

#### Design: Async processing API (long-running work) `[ESSENTIAL]`

Example: "Download sales report (CSV, 2 minute compute)". Sync HTTP request mein 2 minute wait = timeouts (LB 60 s), connection occupied.

**Requirements:** user report request kare; heavy compute background mein; user status dekhe; completed report download kare; retries; duplicate requests handle; failure visible.

**Simplest design:** request mein sync compute (fine for < 2-3 sec). Jab slow ho, async pattern.

**API design:**

```
POST /v1/reports                         Idempotency-Key: ...
  Body: { "type": "sales", "from": "2026-01-01", "to": "2026-03-31" }
  202 Accepted
  Location: /v1/jobs/8f3a...
  { "jobId": "8f3a...", "status": "queued" }

GET /v1/jobs/8f3a...
  200 { "jobId": "8f3a...", "status": "running|completed|failed", "progress": 60,
        "resultUrl": null, "error": null }
  (completed => resultUrl = signed download URL, see Day 3.2)
```

**Schema:**

```sql
CREATE TABLE jobs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id   CHAR(36) NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  type        VARCHAR(32) NOT NULL,
  params      JSON NOT NULL,
  status      ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  progress    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  result_key  VARCHAR(512) NULL,
  error       VARCHAR(500) NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_public_id (public_id),
  UNIQUE KEY uq_user_idem (user_id, idempotency_key),
  KEY idx_user_created (user_id, created_at)
) ENGINE=InnoDB;
```

**Data flow:**

```
 Client --POST /reports--> API --INSERT jobs(queued) + outbox--> MySQL
    <------ 202 + jobId ----'
                                   outbox publisher -> Queue
 Client --GET /jobs/:id (poll every 2-5s, or SSE/WebSocket)
                                   Worker: status=running -> compute (stream rows, write CSV to S3)
                                           -> status=completed + result_key (or failed + error)
```

**Failure scenarios:** worker crash mid-job (job lock expires, retried: job must be idempotent, overwrite same output key); user retries POST (idempotency key returns same job); poison job (attempts exhausted -> failed + error shown); result expired (S3 lifecycle) -> regenerate.

**Scaling:** workers scale by queue depth; separate queue for heavy reports so they do not delay light jobs; per-user concurrency limit; reports on read replica to protect primary.

**Frontend connection:** React mein polling (`useQuery` with `refetchInterval`) ya SSE se status dikhana. Jaise promise pending -> resolved, waise job `queued -> completed`; "202 Accepted" ka matlab "kaam shuru karne ka wada kiya, khatam nahi hua".

**Real-world scenario (marketplace)**

Seller "Download last quarter orders" dabata hai; API turant 202 deta hai, worker replica DB se rows stream karke CSV S3 par daalta hai, seller ko in-app notification (Day 2.2) milti hai "Report ready".

**Interview answer:**
"For slow or unreliable work I move it off the request path. The API validates the request, stores a job row and an outbox event in one transaction, and returns 202 Accepted with a job id. A publisher moves outbox events to a queue such as BullMQ or SQS, and workers process them with retries, exponential backoff, and a dead-letter queue. Because delivery is at-least-once, consumers are idempotent, using an idempotency key or a processed-messages table committed together with the effect. Clients poll the job status endpoint or receive a push. I scale workers on queue depth and monitor queue length and oldest-message age. I would not introduce a queue for fast operations the user needs synchronously."

**Follow-up questions**

1. *Queue vs direct HTTP call between services?* Queue = async, buffering, retries, decoupling, but eventual consistency and extra infra. Sync HTTP = simple, immediate result, but coupling and cascading failure.
2. *Message duplicate kaise handle?* Idempotent consumer: dedupe by message id in same transaction as effect; natural idempotent operations (set status = X); provider idempotency keys.
3. *Outbox kyun, seedha queue.add kyun nahi?* Dual-write problem: DB aur broker atomic nahi hote. Outbox atomicity DB transaction se leta hai.
4. *Queue backlog badh raha hai to?* Metrics (depth, oldest age), workers scale, slow job profile, concurrency tune, rate limits downstream, separate queues, shed low-priority.
5. *Ordering chahiye to?* Per-key partition/group (Kafka key, SQS FIFO group id), single consumer per key, ya version numbers aur idempotent upserts.
6. *Kafka vs RabbitMQ vs SQS?* Kafka = log/replay/high throughput streaming; RabbitMQ = flexible routing; SQS = managed simple work queue. Choose by need and ops capacity.
7. *Job stuck "active" ho to?* Lock timeout/stalled job detection retry karta hai; lock renewal; job idempotent.

**Common mistakes**

- Redis eviction policy allkeys-lru par queue chalana (jobs delete).
- No persistence/AOF for important jobs.
- Non-idempotent workers with at-least-once delivery.
- Infinite retries; no DLQ.
- `queue.add()` after DB commit without outbox.
- Lock duration shorter than job duration (duplicate parallel processing).
- Giant payloads in messages (store in DB/S3, send id).
- No monitoring of queue depth/age.

**Revision notes**

- Queue = decoupling + buffering + retries; at-least-once => idempotent consumers.
- Outbox solves dual-write; DLQ for poison; backoff + jitter.
- Async API: 202 + job status + idempotency key.
- Broker choice: BullMQ/SQS common; Kafka for streams.

### 5.2 Logging, metrics and monitoring `[ESSENTIAL]`

**Concept**

Production mein tum server ko "dekh" nahi sakte; observability ke teen pillars se samajhte ho ki system kya kar raha hai:

| Pillar | Question it answers | Format |
|--------|---------------------|--------|
| **Logs** | Is request/event mein exactly kya hua? | Structured JSON events |
| **Metrics** | System overall kaisa chal raha hai, trend kya hai? | Numeric time series (counters, gauges, histograms) |
| **Traces** | Ek request kin services/DB calls se guzri, time kahan laga? | Spans with trace id `[ADVANCED]` |

**Why it matters**

"Site slow hai" ya "payments fail ho rahe" jaise reports par bina observability tum andhere mein ho. Monitoring + alerts incident ko customers se pehle detect karte hain.

**Internal working: how it fits**

```
 Node services --stdout JSON logs--> log agent (Fluent Bit/CloudWatch) --> Log store (Loki/ELK/CloudWatch)
 Node services --/metrics (pull)---> Prometheus (scrape every 15s) --> Grafana dashboards
                                                        |--> Alertmanager --> Slack/PagerDuty
 Node services --OpenTelemetry spans--> Trace backend (Jaeger/Tempo)   [ADVANCED]
```

#### Logs

Rules:

- **Structured JSON**, ek line = ek event (searchable fields: `level`, `msg`, `requestId`, `userId`, `route`, `durationMs`).
- App stdout par log kare; collection infrastructure ka kaam hai (12-factor).
- **Levels:** error (action needed), warn, info (business events), debug (off in prod).
- **Correlation/request ID** har log line mein (Week 6 / Day 2); downstream calls mein header se pass karo.
- **Never log:** passwords, tokens, full card numbers, PII unnecessarily. Redaction configure karo.

```js
// src/logger.js
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = req.headers['x-request-id'] ?? randomUUID();
    res.setHeader('x-request-id', id); // client can quote this in a support ticket
    return id;
  },
});

// app.use(httpLogger);
// inside a handler: req.log.info({ orderId }, 'order created');
```

Sample log line:

```json
{"level":30,"time":1760860800000,"req":{"id":"b1c2...","method":"POST","url":"/v1/orders"},"res":{"statusCode":201},"responseTime":42,"msg":"request completed"}
```

#### Metrics

Frameworks:

- **RED (for services):** **R**ate (requests/s), **E**rrors (error %), **D**uration (latency percentiles).
- **USE (for resources like CPU, DB pool):** **U**tilization, **S**aturation (queue/wait), **E**rrors.
- **Four golden signals (Google SRE):** latency, traffic, errors, saturation.

Percentiles: average latency misleading hai; **p50/p95/p99** dekho. Histogram buckets se percentiles nikalte hain.

Node-specific metrics: event loop lag/delay (blocked loop ka sabse seedha signal), heap used / RSS (memory leak), GC pause, active handles, CPU; DB pool in-use vs waiting; Redis latency; queue depth and oldest job age.

```js
// src/metrics.js
import client from 'prom-client';
import { monitorEventLoopDelay } from 'node:perf_hooks';

client.collectDefaultMetrics(); // process CPU, memory, event loop lag, GC, handles

export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const paymentsTotal = new client.Counter({
  name: 'payments_total',
  help: 'Payments by final status',
  labelNames: ['status'],
});

export const dbPoolWaiting = new client.Gauge({
  name: 'db_pool_waiting_requests',
  help: 'Requests waiting for a DB connection',
});

const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();
new client.Gauge({
  name: 'app_event_loop_delay_p99_seconds',
  help: 'Event loop delay p99',
  collect() {
    this.set(loopDelay.percentile(99) / 1e9); // nanoseconds -> seconds
  },
});

export function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    // use the route PATTERN ('/v1/orders/:id'), never the raw URL (cardinality explosion)
    end({ method: req.method, route: req.route?.path ?? 'unmatched', status: res.statusCode });
  });
  next();
}

export async function metricsHandler(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}
```

```js
// src/app.js (excerpt)
import express from 'express';
import { httpLogger } from './logger.js';
import { metricsMiddleware, metricsHandler } from './metrics.js';

const app = express();
app.use(httpLogger);
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler); // expose only on an internal network / behind auth
```

**Cardinality warning:** metric labels mein `userId`, raw URL, email jaisi unbounded values mat daalo: har unique value ek nayi time series banata hai, Prometheus memory phat jati hai. Labels bounded rakho (method, route pattern, status class).

Business metrics bhi: `payments_total{status="succeeded"}`, orders/minute, signup/min. Technical metrics theek ho aur business metric gira ho (e.g., checkout success rate) to bhi incident hai.

#### Health checks

```js
// Liveness: is the process alive? (orchestrator restarts if it fails). Keep it trivial.
app.get('/healthz', (req, res) => res.sendStatus(200));

// Readiness: can it serve traffic? (LB/orchestrator removes from rotation if it fails)
let shuttingDown = false;
process.on('SIGTERM', () => {
  shuttingDown = true; // start failing readiness so the LB drains us (see Day 6 graceful shutdown)
});

app.get('/readyz', async (req, res) => {
  if (shuttingDown) return res.status(503).json({ status: 'shutting_down' });
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});
```

Liveness mein DB check mat karo: DB slow ho to orchestrator saare healthy app instances restart kar dega, jo outage ko badhaata hai.

#### Alerting `[ESSENTIAL]`

- **Symptom-based alerts** (user ko kya dikh raha hai): error rate, latency p99, availability, checkout success. Cause-based (CPU 80%) alerts noisy hote hain.
- Har alert actionable ho, runbook link ke saath. Alert fatigue = ignore hone wale alerts.
- **SLI/SLO:** SLI = measured indicator (e.g., successful requests / total), SLO = target (99.9% over 30 days). Error budget = 0.1% allowed failure; budget khatam to feature work rok kar reliability.

Example Prometheus alert rules:

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: >
          sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m]))
          / sum(rate(http_request_duration_seconds_count[5m])) > 0.05
        for: 5m
        labels:
          severity: page
        annotations:
          summary: "5xx error rate above 5% for 5 minutes"

      - alert: HighLatencyP99
        expr: >
          histogram_quantile(0.99,
            sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) > 1
        for: 10m
        labels:
          severity: ticket
        annotations:
          summary: "p99 latency above 1s for 10 minutes"

      - alert: EventLoopBlocked
        expr: app_event_loop_delay_p99_seconds > 0.2
        for: 5m
        labels:
          severity: page
        annotations:
          summary: "Event loop delay p99 above 200ms"
```

Note: yeh single-window (5m) alert ek simple starting point hai. Production mein SLO-based **multi-window multi-burn-rate alerts** isse behtar hain (fast burn pe page, slow burn pe ticket, aur short window se alert jaldi resolve): derivation, unit-tested rules and the lab proof are in `15_Observability_Cloud_CICD.md` (Module 3), jo is alert ko supersede karta hai.

Endpoint naming: `/healthz` and `/readyz` here are generic names for liveness and readiness. The Task API project (`12_Project_Task_API.md`) implements the same two ideas as `GET /health` (liveness) and `GET /health/ready` (readiness, also 503 "draining" during shutdown). Names are a convention; the split is what matters.

Queue alerts: depth badhna + **oldest message age** (age zyada = consumers piche ya stuck). DB: connections used / max, replica lag, slow query count.

#### Incident triage flow (what interviewers love)

```
1. Detect   : alert fires (error rate / latency)
2. Scope    : which endpoints/users/regions? since when? recent deploy? (dashboards, deploy markers)
3. Mitigate : rollback deploy / disable feature flag / scale out / shed load  (restore service first)
4. Diagnose : logs by requestId, traces, DB slow log, resource metrics (event loop, heap, pool)
5. Fix + verify
6. Postmortem: blameless, root cause, action items
```

**Frontend connection:** Browser DevTools Network/Performance tab aur frontend error tracking (Sentry) tum jaante ho; backend observability uska server-side equivalent hai. `x-request-id` response header frontend bug report mein attach ho jaye to backend log turant dhoondhi ja sakti hai.

**Real-world scenario (payments)**

Alert: "payment success rate dropped from 98% to 70%". Dashboard dekha: deploy 10 minute pehle hua. PSP latency normal, lekin app logs mein `ECONNRESET` ek endpoint par; pool metrics mein `db_pool_waiting_requests` high: naye release mein ek query ka index missing tha. Mitigation: rollback; fix: index add; postmortem action: slow-query alert aur pre-deploy EXPLAIN check.

**Interview answer:**
"I instrument services with three signals. Structured JSON logs with a request ID that I propagate across services and redact for secrets; metrics in Prometheus format covering the RED signals, rate, errors and duration as histograms so I can read p95 and p99, plus Node-specific metrics such as event loop delay, heap usage and DB pool waiters, and business metrics like payment success rate; and distributed traces where multiple services are involved. I expose liveness and readiness endpoints separately so the orchestrator restarts dead processes but only drains traffic when dependencies are down. Alerts are symptom-based, such as error rate, p99 latency, queue age, and are tied to SLOs with runbooks. During an incident I scope the impact, mitigate first, for example by rolling back, then diagnose with logs and traces and write a blameless postmortem."

**Follow-up questions**

1. *Logs vs metrics vs traces?* Logs = detailed events (what happened); metrics = aggregates over time (how much/how fast); traces = request path across services (where time went).
2. *Liveness vs readiness?* Liveness = process healthy (restart if not); readiness = ready to take traffic (remove from LB if not). Liveness mein dependencies check mat karo.
3. *Percentile kyun, average kyun nahi?* Average outliers chhupa deta hai; p99 tail latency batata hai jo real users ko hurt karti hai.
4. *High cardinality kya hai?* Metric labels ki unique combinations bahut zyada (userId); storage/memory blow up.
5. *Event loop lag kaise measure karte ho?* `perf_hooks.monitorEventLoopDelay` ya prom-client default metrics (`nodejs_eventloop_lag_seconds`); high lag = CPU-bound/blocking code.
6. *Kya alert karoge aur kya sirf dashboard par rakhoge?* Page: user-visible symptoms (errors, latency, availability). Dashboard/ticket: capacity trends, disk growth, CPU.
7. *PII logs mein?* Avoid; redact; short retention; access control; compliance (GDPR/PCI).

**Common mistakes**

- `console.log` plain text strings (unsearchable) instead of structured logs.
- Logging secrets/tokens/PII.
- Average latency only.
- Unbounded metric labels.
- Alerting on every CPU spike (noise).
- DB check in liveness probe.
- `/metrics` publicly exposed.
- No request ID propagation (cannot follow one request).
- Logging inside hot loops at debug level in production (performance cost).
- Monitoring technical metrics but no business metric.

**Revision notes**

- Logs (JSON + request ID), metrics (RED/USE, histograms, p99), traces.
- Liveness vs readiness; graceful drain.
- Symptom-based alerts, SLO/error budget, runbooks.
- Node signals: event loop delay, heap, pool waiters, queue age.

### Day 5 wrap-up

**Key concepts to remember**

- Queue = decoupling, buffering, retries; at-least-once => idempotent consumers; DLQ; backoff + jitter.
- Outbox solves the DB + broker dual-write; async API = 202 + job status.
- Observability: structured logs, RED metrics with histograms, traces; liveness vs readiness; symptom-based alerts.
- Queue health = depth + oldest age; Redis AOF + `noeviction` for job queues.

**Five revision questions**

1. At-least-once delivery ka matlab kya hai aur consumer ko kya karna padta hai?
2. Outbox pattern kaunsi problem solve karta hai? Publisher crash ho jaye to kya hota hai?
3. Long-running report generation API kaise design karoge (endpoints, status codes, schema)?
4. RED metrics kya hain aur histogram se p99 kaise nikalte hain?
5. Liveness aur readiness probes mein kya difference hai aur DB check kahan hona chahiye?

**Practical coding task**

BullMQ ke saath ek chhota worker banao (Redis Docker se). Producer 20 jobs daale jinme se random 30% throw karein. `attempts: 4` with exponential backoff set karo, `failed` event log karo, aur dekho kitne jobs DLQ (failed set) mein gaye. Phir `prom-client` se `jobs_processed_total{status}` counter add karo aur `/metrics` par verify karo.

**Self-assessment checklist**

- [ ] Main queue vs pub/sub vs log ka difference bata sakta hoon.
- [ ] Main idempotent consumer ka ek implementation likh sakta hoon.
- [ ] Main outbox flow ka diagram bina dekhe bana sakta hoon.
- [ ] Main logs/metrics/traces aur RED/USE explain kar sakta hoon.
- [ ] Main ek incident triage flow bol sakta hoon.

---

## Day 6 - Docker, deployment basics, design-practice session

**Learning objectives**

- Docker ke core concepts (image, container, layer, volume, network) aur Node.js ke liye production-quality Dockerfile likhna.
- Docker Compose se app + MySQL + Redis local stack chalana, correct healthchecks aur networking ke saath.
- Graceful shutdown ko containers/orchestrators ke saath jodna.
- Deployment basics: environments, config/secrets, CI/CD pipeline, migrations, rolling/blue-green/canary, Nginx + TLS, rollback.
- Design-practice session: 45-minute framework drill aur 5 designs ka cheat sheet.

Estimated time: 45 min Docker + Compose, 30 min deployment basics, 40 min design practice, 5 min revision questions.

### 6.1 Docker fundamentals `[ESSENTIAL]`

**Concept**

- **Image:** read-only package: OS userland + Node.js runtime + tumhara code + dependencies. Build once, run anywhere.
- **Container:** image ka running instance (isolated process with own filesystem view, network, limits). VM nahi hai: host kernel share karta hai, isliye lightweight aur fast.
- **Dockerfile:** image banane ki instructions.
- **Layer:** har instruction ek layer; layers cached hote hain. Jo cheez kam change hoti hai (dependencies) upar, jo zyada change hoti hai (source code) neeche rakho, taaki rebuild fast ho.
- **Registry:** images ka storage (Docker Hub, GitHub Container Registry, ECR).
- **Volume:** container ke bahar persistent storage (DB data). Container delete hone par bhi data bacha rehta hai.
- **Network:** containers ek doosre ko service name se resolve karte hain (Compose network ke andar DNS).

**Why it matters**

"Mere machine par chal raha hai" problem khatam: dev, CI, production mein same image. Deployment repeatable, rollback easy (purana image tag chala do), horizontal scaling easy (same image ke N containers). Interviewers basic Docker knowledge expect karte hain (Dockerfile padhna/likhna, compose, env, ports).

**Frontend connection:** `npm run build` ka output deploy karne jaisa, bas yahan poora runtime (Node version, OS libs) saath package hota hai. Jaise `node_modules` lockfile se reproducible installs, waise image reproducible environment.

**Internal working (short)**

Linux namespaces (process, network, mount isolation) + cgroups (CPU/memory limits) se container isolation milta hai. Image ek stack of read-only layers hai; container start par upar ek thin writable layer judti hai (container delete = wo layer delete, isliye persistent data volume mein).

#### Production Dockerfile for Node.js 22 (multi-stage)

`package.json` (relevant parts):

```json
{
  "name": "orders-api",
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^5.0.0",
    "mysql2": "^3.0.0"
  }
}
```

`Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

# ---- Stage 1: install production dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci = exact versions from lockfile; --omit=dev = no devDependencies in the final image
RUN npm ci --omit=dev

# ---- Stage 2: runtime image ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# dependencies first (changes rarely => layer cache hit), source after (changes often)
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# run as the unprivileged "node" user that ships with the official image
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

# exec form (JSON array): node becomes PID 1 and receives SIGTERM directly.
# Shell form (CMD npm start) would run a shell as PID 1 and swallow signals.
CMD ["node", "src/server.js"]
```

Line-by-line important points:

- `node:22-alpine`: chhota image (musl libc). Kuch native modules (bcrypt, sharp) alpine par issues de sakte hain; tab `node:22-slim` (Debian) use karo. Production mein tag pin karo (e.g., `node:22.11-alpine`) ya digest, `latest` nahi.
- `npm ci --omit=dev`: lockfile se deterministic install (npm 8+ mein `--omit=dev`; purane `--production`).
- Multi-stage: build tools/dev dependencies final image mein nahi aate (TypeScript ya build step ho to stage 2 mein build chalao aur sirf `dist/` copy karo).
- `USER node`: non-root; container compromise hone par damage limited.
- `CMD ["node", ...]` exec form: signals sahi pahunchte hain (graceful shutdown ke liye zaroori).
- `HEALTHCHECK`: Docker/Compose container ko healthy/unhealthy mark karta hai. Orchestrators (Kubernetes) apne probes use karte hain; wahan yeh ignore hota hai.
- Alpine mein `wget` busybox se available hai; `curl` default nahi hota.

`.dockerignore` (build context chhota aur secrets bahar):

```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
Dockerfile
docker-compose.yml
coverage
tests
*.md
```

`.env` ko image mein kabhi mat daalo: image layers mein secret reh jata hai aur registry se leak ho sakta hai.

Build and run:

```bash
docker build -t orders-api:1.0.0 .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="mysql://app:apppass@host.docker.internal:3306/appdb" \
  -e NODE_ENV=production \
  --name orders-api orders-api:1.0.0
```

`-p 3000:3000` = host:container port mapping. Container ke andar app ko `0.0.0.0` par listen karna chahiye (Express `app.listen(port)` default sab interfaces par sunta hai, theek hai); sirf `127.0.0.1` par listen kiya to port mapping kaam nahi karegi.

**Useful commands**

```bash
docker ps                         # running containers
docker ps -a                      # include stopped
docker logs -f orders-api         # follow logs (stdout/stderr)
docker exec -it orders-api sh     # shell inside running container
docker stop orders-api            # SIGTERM, then SIGKILL after 10s grace (default)
docker images                     # local images
docker system prune               # remove unused data (careful)
docker inspect orders-api         # full config/state, health status
```

#### Signals, PID 1 and graceful shutdown

`docker stop` pehle `SIGTERM` bhejta hai, grace period (default 10 s) ke baad `SIGKILL`. Node ko SIGTERM handler lagana padta hai, warna process turant mar jata hai aur in-flight requests toot jaati hain (Week 6 / Day 5 mein basics).

```js
// src/server.js
import app from './app.js';
import { pool } from './db.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => logger.info({ port }, 'listening'));

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutdown started');

  // hard stop if draining takes too long (keep < orchestrator grace period)
  const force = setTimeout(() => {
    logger.error('forced shutdown');
    process.exit(1);
  }, 25_000);
  force.unref();

  // stop accepting new connections; wait for in-flight requests to finish
  server.close(async (err) => {
    try {
      await pool.end(); // close DB connections cleanly
    } finally {
      process.exit(err ? 1 : 0);
    }
  });
  server.closeIdleConnections(); // Node 18.2+: drop idle keep-alive sockets so close() can complete
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

Sequence in a rolling deploy: orchestrator naya container start kare -> `/readyz` pass -> traffic shift -> purane container ko SIGTERM -> `/readyz` 503 (LB drain) -> in-flight requests complete -> exit. Compose/orchestrator mein grace period (`stop_grace_period: 30s`, Kubernetes `terminationGracePeriodSeconds`) shutdown timeout se zyada rakho.

`docker run --init` (ya Compose `init: true`) ek tiny init process PID 1 par daalta hai jo signals forward karta aur zombie processes reap karta hai. Agar tum `node` ko hi PID 1 par exec form mein chalate ho aur apna handler hai, to zaroorat kam hai; lekin child processes spawn karte ho to `init: true` helpful hai.

#### Docker Compose: app + MySQL + Redis

`docker-compose.yml` (Compose v2; `version:` key ab obsolete hai, mat likho):

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: "3000"
      DATABASE_URL: mysql://app:${MYSQL_PASSWORD}@mysql:3306/appdb
      REDIS_URL: redis://redis:6379
    env_file:
      - .env            # JWT_SECRET etc. (never committed)
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    init: true
    stop_grace_period: 30s

  mysql:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: appdb
      MYSQL_USER: app
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./db/init:/docker-entrypoint-initdb.d:ro   # *.sql files run only on first initialization
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -uroot -p$$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

`.env` (Compose automatically substitutes `${...}` from this file; keep it out of git):

```
MYSQL_ROOT_PASSWORD=change-me-root
MYSQL_PASSWORD=change-me-app
JWT_SECRET=generate-a-long-random-value
```

Explain:

- **Service names are hostnames:** app ke andar MySQL ka host `mysql` hai, `localhost` nahi (localhost = app container khud). Common beginner bug.
- **Ports:** `ports: "3000:3000"` sirf app expose; MySQL/Redis ko host par expose mat karo production mein (sirf internal network). Local debugging ke liye `127.0.0.1:3307:3306` jaisa localhost-only mapping use karo.
- **`depends_on` with `condition: service_healthy`:** sirf start order nahi, DB ready hone tak wait. Phir bhi app ko connection retry logic rakhna chahiye (DB baad mein restart ho sakta hai).
- **`$$MYSQL_ROOT_PASSWORD`:** Compose `$$` ko literal `$` banata hai, taaki container ke andar shell variable expand kare.
- **Volumes:** `mysql_data` named volume DB data persist karta hai. `docker compose down -v` volumes bhi delete kar deta hai (data loss, dhyaan se).
- **`docker-entrypoint-initdb.d`:** `.sql` scripts sirf pehli baar (empty data dir par) chalte hain. Schema evolution ke liye migrations tool chahiye (neeche).
- **MySQL 8.4 LTS** image; `mysql_native_password` default disabled hai, `mysql2` caching_sha2_password support karta hai, isliye koi problem nahi.

Commands:

```bash
docker compose up -d --build        # build images and start all services in background
docker compose ps                   # status and health
docker compose logs -f app          # follow app logs
docker compose exec mysql mysql -uapp -p appdb    # SQL shell inside the mysql container
docker compose restart app
docker compose down                 # stop and remove containers (volumes kept)
docker compose down -v              # ALSO delete volumes (wipes DB data)
```

Development override: `docker-compose.override.yml` mein `volumes: ["./src:/app/src"]` aur `command: ["node", "--watch", "src/server.js"]` daalke hot reload milta hai (Node 18.11+ `--watch`, Node 22 mein stable-ish; version-dependent: Node 22 mein `--watch` stable hai).

**Common mistakes (Docker)**

- `localhost` use karna container-to-container connection mein.
- `.env`/secrets image mein COPY karna, ya `.dockerignore` na hona (huge context, `node_modules` copy).
- `COPY . .` pehle, phir `npm install` (har source change par dependencies dobara install).
- Root user se chalana.
- Shell form `CMD npm start` (signals nahi pahunchte, graceful shutdown fail).
- `latest` tag pin kiye bina; production mein unpredictable updates.
- DB data bina volume ke (container delete = data gone).
- Memory limits na rakhna: Node heap container limit se zyada ho kar OOM kill. `docker run -m 512m` ke saath `NODE_OPTIONS=--max-old-space-size=384` jaisa heap limit sochkar set karo.
- Healthcheck mein dependencies heavy check.

**Follow-up questions**

1. *Container aur VM mein kya difference?* VM poora guest OS (own kernel) chalata hai; container host kernel share karta hai, isolation namespaces/cgroups se. Container lighter aur fast start, VM stronger isolation.
2. *Multi-stage build kyun?* Final image chhota aur secure: build tools, dev dependencies, source maps ya compilers runtime image mein nahi jaate.
3. *Container ke andar data kaise persist karte ho?* Volumes/bind mounts, ya managed DB/object storage. Container filesystem ephemeral hai.
4. *Containers ek doosre se kaise baat karte hain?* Same user-defined network (Compose default) par service name se DNS resolve hota hai.
5. *Secrets kaise manage karoge?* Runtime par env vars/secret manager/Docker secrets; image mein nahi, git mein nahi (Week 5 / Day 6).
6. *Ek container mein app + DB dono?* Nahi. Ek container = ek process/responsibility; alag lifecycle, scaling, logs.

**Revision notes**

- Image (template) vs container (running). Layers + cache order. Volumes for data.
- Multi-stage, non-root, exec-form CMD, .dockerignore, pinned tags.
- Compose: service names as hosts, healthchecks + `service_healthy`, named volumes, secrets via env/.env.
- SIGTERM handling + grace period.

### 6.2 Deployment basics `[ESSENTIAL]`

**Concept**

Deployment = tumhare tested code ko production servers par safely, repeatably aur minimal downtime ke saath chalana.

**Why it matters**

Mid-level backend interview mein "tum apna app deploy kaise karte ho?" common sawaal hai. Expectation: manual `ssh + git pull` se aage ka pipeline-based process, config/secrets handling, zero-downtime, rollback ka idea.

#### Environments and configuration (12-factor)

- **dev -> staging -> production.** Staging production ki replica (smaller) jahan release test hota hai.
- **Config via environment variables**, code mein hardcode nahi. Same image, different env = different environment.
- **Logs to stdout.** **Stateless processes.** **Port binding via env** (`PORT`).
- **Secrets:** secret manager (AWS Secrets Manager/SSM, Vault), CI secrets; rotate karo; `.env` git mein nahi.
- Config validate karo startup par (fail fast):

```js
// src/config.js
function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  jwtSecret: required('JWT_SECRET'),
};
```

#### Deployment options (simple to complex)

| Option | Description | When |
|--------|-------------|------|
| Single VM + Docker Compose + Nginx | Ek EC2/VPS, compose stack, Nginx reverse proxy + TLS | Small apps, MVP, interviews/projects |
| VM + PM2 (no Docker) | `pm2 start` cluster mode, ecosystem file | Simple legacy setups |
| Managed containers (ECS Fargate, Cloud Run, Azure Container Apps) | You give image; platform runs/scales | Most startups; low ops |
| Kubernetes | Orchestrator: scheduling, rolling updates, autoscaling, self-healing | Many services/teams `[ADVANCED]` |
| PaaS (Render, Railway, Heroku) | git push or image deploy | Fastest setup |

Recommendation: "Pehle managed container platform ya single VM with Compose; Kubernetes tab jab complexity justify ho."

#### Nginx reverse proxy with TLS (single VM setup)

```nginx
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;                              # nginx 1.25.1+ syntax; older: "listen 443 ssl http2;"
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    client_max_body_size 5m;               # protect Node from huge request bodies

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

TLS termination Nginx par hota hai; certificate Let's Encrypt (Certbot) se auto-renew. Express mein `app.set('trust proxy', 1)` zaroor (Day 1.2).

PM2 (agar Docker nahi): `ecosystem.config.cjs` (PM2 config CommonJS mein hoti hai):

```js
module.exports = {
  apps: [
    {
      name: 'orders-api',
      script: 'src/server.js',
      instances: 'max',          // one process per CPU core
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_memory_restart: '500M',
    },
  ],
};
```

Commands: `pm2 start ecosystem.config.cjs`, `pm2 reload orders-api` (zero-downtime reload in cluster mode), `pm2 logs`.

#### CI/CD pipeline

Stages: **lint -> test -> build image -> push to registry -> deploy -> smoke test -> (rollback on failure).**

GitHub Actions example:

```yaml
name: ci-cd
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
```

Immutable tag = commit SHA: kis version production mein hai pata hota hai, rollback = purana SHA deploy. Deploy step platform-specific hai (ECS update service, SSH + `docker compose pull && docker compose up -d`, kubectl set image). Deploy ke baad smoke test: `curl -f https://api.example.com/healthz`.

#### Database migrations in deployments `[ESSENTIAL]`

- Schema changes **migration files** se (knex/Prisma/Flyway/`node-pg-migrate` style; MySQL ke liye Knex/Prisma/Flyway/Liquibase), version control mein.
- Migration ko **alag deploy step** mein chalao (har app instance start par nahi: race, multiple instances ek saath migrate).
- **Backward-compatible (expand/contract):** rolling deploy mein kuch der purana aur naya code saath chalte hain, isliye schema dono ke saath compatible hona chahiye.

```
Rename column  name -> full_name  safely:
 1. Expand : ADD COLUMN full_name; app writes both columns, reads old
 2. Backfill: copy data in batches
 3. Switch : app reads new column
 4. Contract: (later release) DROP COLUMN name
Never rename/drop in one step while old code is still running.
```

Large table par `ALTER TABLE` lock/slow ho sakta hai: MySQL 8 mein kai operations online (`ALGORITHM=INPLACE/INSTANT`) hote hain; tools: `gh-ost`, `pt-online-schema-change` `[ADVANCED]`.

#### Release strategies

| Strategy | How | Pros | Cons |
|----------|-----|------|------|
| Rolling | Instances ek ek karke replace | No extra capacity needed, default | Mixed versions during rollout |
| Blue/Green | Naya full environment (green) ready, traffic switch | Instant rollback (switch back) | 2x capacity; DB shared => schema compatibility |
| Canary | Naye version ko 1-5% traffic, metrics dekhkar badhao | Risk kam, real traffic validation | Needs good metrics and routing |
| Feature flags | Code deploy aur feature release alag | Quick disable without redeploy | Flag management debt |

Zero-downtime checklist: readiness probe, graceful shutdown (6.1), backward-compatible schema, connection draining at LB, stateless instances, health-gated rollout.

**Rollback:** previous image tag redeploy (fast). Data migrations ke saath rollback tabhi safe jab expand/contract follow kiya ho (isliye destructive changes baad mein).

**Frontend connection:** Frontend deploy (Vercel/Netlify, CDN) static files hote hain aur atomic hota hai. Backend deploy mein long-running processes aur DB schema involve hain, isliye graceful shutdown, migrations aur backward compatibility ka extra dhyaan chahiye. API versioning (Week 3 / Day 5) isi wajah se frontend ko break hone se bachati hai.

**Real-world scenario (marketplace)**

Friday 5 PM release: image `sha-9f3c1a` pipeline se build hua, staging par smoke test pass. Production par canary 5% traffic; Grafana mein error rate aur p99 same. Phir rolling 100%. Naye column ke liye migration pichle hafte expand step mein deploy ho chuka tha, isliye purana code bhi compatible tha. 10 minute baad error rate badha: feature flag off kiya (redeploy nahi), phir fix next day.

**Interview answer:**
"I package the service as a Docker image built in a multi-stage Dockerfile running as a non-root user, tagged with the commit SHA. A CI pipeline runs lint and tests, builds and pushes the image, then deploys to staging and production, followed by a smoke test against the health endpoint. Configuration comes from environment variables and a secret manager, never baked into the image. I use readiness probes and graceful shutdown on SIGTERM so rolling deployments do not drop requests, and database migrations run as a separate step using the expand and contract approach so old and new code can run side by side. If metrics degrade I roll back by redeploying the previous image tag or turning off a feature flag. For small systems I would use Docker Compose behind Nginx on a VM, then move to a managed container platform, and consider Kubernetes only when the number of services justifies its operational cost."

**Follow-up questions**

1. *Zero-downtime deploy kaise?* Rolling/blue-green + readiness probes + graceful shutdown + backward-compatible DB changes + LB draining.
2. *Migrations kab chalate ho?* Deploy pipeline mein alag step, app start se pehle ek hi baar; expand/contract; destructive changes baad mein.
3. *Docker image tag strategy?* Immutable commit SHA tags (plus optional semver); `latest` production deploy ke liye nahi.
4. *Rollback kaise?* Previous image redeploy; feature flags; DB changes backward compatible rakhe ho.
5. *Secrets kaise inject karte ho?* Platform secret manager -> env vars at runtime; rotation; least privilege IAM; never in image/git/logs.
6. *PM2 vs Docker?* PM2 = process manager on a host (cluster mode, restarts). Docker = packaging + isolation; orchestrator restarts containers. Containers mein aksar PM2 ki zaroorat nahi (ek process per container, platform scale/restart karta hai).
7. *Kubernetes kab?* Jab bahut services, autoscaling, self-healing, multi-team platform chahiye; chhote systems ke liye over-engineering.

**Common mistakes**

- Manual `ssh` + `git pull` + `npm install` on production servers.
- Same DB migration run by every instance on startup.
- Destructive migrations (drop/rename) in the same release as code change.
- Secrets in repo, image, or logs.
- No health-gated rollout and no rollback plan.
- `latest` tag in production.
- No staging; testing in production.
- Not setting `NODE_ENV=production`.

**Revision notes**

- Env-based config + secrets manager; same image across environments.
- CI/CD: test -> build -> push -> deploy -> smoke test; immutable SHA tags.
- Migrations separate + expand/contract; release strategies; rollback.
- Nginx TLS termination + `trust proxy`.

### 6.3 Design-practice session `[ESSENTIAL]`

Aaj ka goal: bolne ki practice. Design padhna aur design bolna alag skills hain. Timer lagao aur **zor se bolo** (ya record karo).

#### 45-minute interview timeline

| Minutes | Step | What to say/do |
|---------|------|----------------|
| 0-5 | Requirements | Functional, non-functional, scale numbers, out of scope. Interviewer se confirm |
| 5-8 | Estimates | QPS, storage, read:write ratio (only decision-changing numbers) |
| 8-15 | Simplest design + API + schema | Ek service + MySQL; endpoints; tables with keys/indexes |
| 15-30 | Deep dive on the hard part | Algorithm/consistency/idempotency/concurrency |
| 30-38 | Failures + trade-offs | "What if X dies?" table, alternatives considered |
| 38-45 | Scaling + wrap-up | Bottleneck -> cache/replica/queue/shard, monitoring, summary |

#### Cheat sheet: five designs in one line each (revision only; details above)

| Design | Hard part | Simplest design | Key decision | First scale step |
|--------|-----------|-----------------|--------------|------------------|
| Rate limiter (2.1) | Atomic, distributed counting | In-memory fixed window | Token bucket in Redis via Lua, Redis TIME, fail open/closed per route | Redis replica -> Cluster by key |
| Notification system (2.2) | Reliability + dedupe | Table + worker (SKIP LOCKED) | At-least-once, dedupe_key, backoff + jitter, DLQ, priority | More workers -> real queue per channel |
| URL shortener (3.1) | Unique short code + read-heavy redirects | One table, random code + unique index | Retry on duplicate, `ascii_bin`, 302, cache-aside | Redis cache -> replicas -> shard by code |
| File upload (3.2) | Large files off the API servers | multer to disk | Presigned URL direct-to-S3, initiate/complete, scan, quarantine | CDN, multipart, worker scale |
| Payment/transfer (4.2-4.3) | Never lose/duplicate money | Single ACID transaction | Idempotency key, state machine, webhook truth, ordered `FOR UPDATE`, ledger | Outbox + queue, replicas for reads, shard only if forced |

#### Practice prompts (attempt each in 10 minutes, speaking)

1. Design a ticket/seat booking system (no double booking). Hint below.
2. Design a leaderboard for a game (top 100, user rank).
3. Design an API for an e-commerce checkout (cart -> order -> payment -> notification).
4. Design a job scheduler / cron service (run job at time T exactly once across instances).
5. Design a comments system for a blog/marketplace product page (pagination, moderation).
6. Design a "recently viewed items" / activity feed.
7. Design an audit-log service (immutable, searchable).
8. Design an API gateway for 3 microservices (auth, rate limit, routing).
9. Design a coupon/discount redemption system (each coupon max N uses).
10. Design a chat/inbox notification counter (unread counts) at scale.

**Skeleton answers (check yourself after attempting)**

1. **Seat booking:** hard part = concurrency. Table `seats(event_id, seat_id, status, hold_expires_at, booked_by)` with `UNIQUE(event_id, seat_id)` per booking row, or conditional update `UPDATE seats SET status='held', held_by=?, hold_expires_at=NOW()+INTERVAL 10 MINUTE WHERE event_id=? AND seat_id=? AND (status='available' OR (status='held' AND hold_expires_at < NOW()))` and check `affectedRows = 1`. Payment within hold window then `held -> booked`; job releases expired holds. Idempotent payment (Day 4). Flash-sale traffic: waiting room/queue + rate limit; Redis for fast availability reads but DB as source of truth.
2. **Leaderboard:** Redis sorted set `ZADD`, `ZREVRANGE 0 99`, `ZREVRANK user`. Persist scores in MySQL for durability; rebuild Redis from DB. Scale: shard by game/season, periodic snapshots. Trade-off: Redis memory vs DB `ORDER BY score DESC LIMIT 100` with index (fine until large).
3. **Checkout:** order created `pending_payment` with price snapshot, stock reserved with expiry, payment per 4.2, webhook -> `paid` + outbox -> notification/fulfillment; saga compensation for failures; idempotency at each POST.
4. **Scheduler:** `jobs(id, run_at, status, locked_until)`; workers claim due jobs with `FOR UPDATE SKIP LOCKED` (Day 2.2 pattern); lease for crash recovery; idempotent job handlers; for cron-like recurrence compute next `run_at` in the same transaction as completion.
5. **Comments:** `comments(id, product_id, user_id, parent_id, body, status, created_at)`, index `(product_id, id)`, keyset pagination (Week 4 / Day 6), moderation status, rate limit posting, counts cached/denormalized, XSS-safe output.
6. **Recently viewed:** Redis list/sorted set per user (`ZADD user:42:recent <timestamp> item`, trim to 50), async persistence optional, TTL; writes are cheap and loss-tolerant.
7. **Audit log:** append-only table partitioned by month, no UPDATE/DELETE grants for the app user, hash-chain optional, ship to search store (OpenSearch) via queue, retention policy.
8. **API gateway:** single entry: TLS, authentication (JWT verify), rate limiting, routing, request ID injection, timeouts/circuit breaker, caching; avoid putting business logic there.
9. **Coupons:** `coupons(max_uses, used_count)` with atomic `UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses` and `UNIQUE(coupon_id, user_id)` in redemptions; same transaction as order; release on payment failure (or count on payment success only, decide).
10. **Unread counts:** per-user counter in Redis (`INCR`/`DECR`) with periodic reconciliation from DB; or store `last_read_id` and compute count with index; write on message, reset on open.

#### Scoring rubric (rate yourself 0-2 per row, total /16)

| Item | 0 | 1 | 2 |
|------|---|---|---|
| Clarified requirements and numbers | skipped | partly | explicit functional + non-functional + estimate |
| Started with simplest design | jumped to complex | partly | clear simple version, then evolved |
| API + schema | vague | one of them | both with keys/indexes |
| Hard part addressed | missed | superficial | concrete mechanism (atomicity, idempotency, etc.) |
| Failure scenarios | none | one or two | table-style, with mitigations |
| Trade-offs | none | mentioned | compared alternatives with reasons |
| Scaling justified by bottleneck | buzzwords | partly | ladder with numbers |
| Communication (structured, time-boxed) | rambling | okay | clear, summarizing at end |

Below 10: revise sections and redo. 10-13: good for junior-to-mid. 14+: strong.

**Interview answer (when asked "how do you approach system design questions?"):**
"I follow the same structure every time. I clarify functional and non-functional requirements and estimate the scale, then I propose the simplest design that works, usually one stateless service and one database, with the API and schema. I identify the hard part of the problem, such as atomic counting, idempotency, or concurrency, and solve it concretely. Then I walk through failure scenarios and trade-offs, and only after finding the real bottleneck do I add caching, replicas, queues, or sharding. I finish by describing monitoring and how I would roll the system out safely."

**Follow-up questions**

1. *Tumhara design kab fail hoga?* Bottleneck numbers ke saath batao (e.g., "single MySQL primary at around X writes/s; pehla signal replica lag aur lock waits"). Honest limits batana strength hai.
2. *Isme sabse risky part kya hai?* Usually concurrency/consistency (payments, bookings) ya external dependency (PSP). Mitigation batao.
3. *Agar 10x traffic ho?* Bottleneck identify -> cache -> replicas -> queue -> shard; har step ka cost/trade-off.
4. *Alternatives kya the?* Do-teen options aur reject karne ke reasons (e.g., Kafka vs table+worker at 350/s).

**Common mistakes (in design interviews)**

- Buzzword dumping (Kafka, Kubernetes, microservices) bina numbers.
- Requirements na poochna.
- Sirf happy path batana.
- Schema/API skip karna (backend interview mein yeh core hai).
- Time management: 30 min requirements mein.
- Interviewer ke hints ignore karna.
- Single point of failure ignore karna.

**Revision notes**

- Same framework har baar; simple first; hard part deep; failures; scale with numbers.
- Cheat-sheet table yaad rakho; 10 prompts practice.

### Day 6 wrap-up

**Key concepts to remember**

- Multi-stage Dockerfile, non-root, exec-form CMD, `.dockerignore`, pinned tags.
- Compose: service-name hosts, healthchecks with `service_healthy`, volumes, env secrets.
- SIGTERM -> graceful shutdown -> drain -> close pool; grace period > shutdown timeout.
- CI/CD with immutable tags, separate migrations (expand/contract), rolling/blue-green/canary, rollback.
- Design framework and the five-design cheat sheet.

**Five revision questions**

1. Dockerfile mein dependency install `COPY . .` se pehle kyun karte hain?
2. `CMD npm start` aur `CMD ["node", "src/server.js"]` mein signal handling ka kya difference hai?
3. Compose mein app MySQL se `localhost:3306` se connect kyun nahi kar pata?
4. Column rename ko zero-downtime deploy mein kaise karoge?
5. Canary aur blue/green deployment mein difference aur trade-off?

**Practical coding task**

Apne Task Management API project (12_Project_Task_API.md, Extension C) ke liye Dockerfile + `docker-compose.yml` banao (app, mysql, redis). `docker compose up -d --build` chalao, `curl localhost:3000/healthz` aur `/readyz` check karo. Phir `docker compose stop mysql` karke dekho `/readyz` 503 deta hai aur `/healthz` 200 hi rehta hai. Aakhir mein `docker compose stop app` chalao aur logs mein graceful shutdown line verify karo.

**Self-assessment checklist**

- [ ] Main bina dekhe multi-stage Node Dockerfile likh sakta hoon.
- [ ] Main compose file mein healthchecks aur `depends_on` condition samjha sakta hoon.
- [ ] Main graceful shutdown sequence aur grace periods explain kar sakta hoon.
- [ ] Main expand/contract migration aur release strategies bata sakta hoon.
- [ ] Maine kam se kam 3 practice prompts bolkar attempt kiye aur rubric se score kiya.

---

## Day 7 - Revision and weekly test

**Learning objectives**

- Week 7 ke 5 major designs ko bina notes ke 10-12 minute mein bol sakna.
- Spaced revision (1 day, 3 days, 7 days) se Day 1-6 ke concepts pakka karna.
- Weekly test (60 min) dena, weak areas identify karna aur unhe fix karna.
- Jo topics unfinished rahe unhe catch-up karna (catch-up plan neeche).

Estimated time (2 hours): 30 min revision summary + spaced questions, 60 min weekly test (closed book), 20 min answer check + weak-area log, 10 min plan for Week 8.

### Day 7 schedule

| Time | Activity |
|------|----------|
| 0:00-0:10 | Day 1-2 revision: scaling ladder, caching, connection math, rate limiter, notifications. Cheat-sheet table (Day 6.3) dekho |
| 0:10-0:20 | Day 3-4: URL shortener, file upload, payment/transfer flows. Sirf diagrams aur "hard part" dobara draw karo |
| 0:20-0:30 | Day 5-6: queues/outbox, observability, Docker/deployment. Dockerfile aur compose syntax bina dekhe likhne ki koshish |
| 0:30-1:30 | **Weekly test** (60 min, closed book, timer on). Neeche "Week 7 assessment" |
| 1:30-1:50 | Answers check karo, har galti ko weak-area log mein likho |
| 1:50-2:00 | Weak topics ke liye Week 8 ke liye 3 priorities choose karo |

### Spaced revision map for Week 7 topics

Prompt.md ke spaced-revision rule ke hisaab se har topic ko lagbhag 1, 3 aur 7 din baad dobara dekho (Week 8 ke dauraan bhi).

| Topic | Revisit after ~1 day | ~3 days | ~7 days |
|-------|----------------------|---------|---------|
| Scaling ladder, caching, connection math (Day 1) | Day 2 start: 5 questions | Day 4 | Day 7 test |
| Rate limiter + notification (Day 2) | Day 3 start | Day 5 | Week 8 / Day 1 or 2 (rapid revision) |
| URL shortener + file upload (Day 3) | Day 4 start | Day 6 | Week 8 / Day 5 (system design revision) |
| Payments, ledger, idempotency (Day 4) | Day 5 start | Day 7 | Week 8 / Day 3-4 |
| Queues, outbox, observability (Day 5) | Day 6 start | Day 7 | Week 8 / Day 4 (incident scenarios) |
| Docker, deployment, practice framework (Day 6) | Day 7 | Week 8 / Day 1 | Week 8 / Day 5 |

### Day 7 wrap-up

**Key concepts to remember (the whole week in 12 lines)**

1. Modular monolith default; microservices only with a concrete reason.
2. Stateless instances + LB + health checks = horizontal scaling; externalize sessions, files, counters.
3. Cache-aside, delete on write, TTL jitter; do not cache correctness-critical balances.
4. DB scaling ladder: indexes -> cache -> vertical -> replicas (lag) -> partition -> shard. Connection math: instances x pool <= max_connections.
5. Rate limiter: token bucket in Redis Lua, atomic, Redis TIME, 429 + Retry-After, fail open/closed per route.
6. Notifications: transactional insert + worker (SKIP LOCKED), dedupe key, backoff + jitter, DLQ, at-least-once.
7. URL shortener: random 7-char base62, unique index + retry, `ascii_bin`, 302, cache-aside, async click counts.
8. File upload: presigned direct-to-S3, initiate/complete, quarantine until scanned, ownership checks, cleanup.
9. Payments: integer money, state machine, idempotency key, PSP call outside txn, webhook as truth, reconciliation.
10. Transfers: single ACID txn, ordered `FOR UPDATE`, double-entry ledger, retry on deadlock.
11. Queues: at-least-once + idempotent consumers; outbox for dual-write; async API 202 + job status.
12. Observability: structured logs + request ID, RED metrics, liveness vs readiness, symptom-based alerts. Docker: multi-stage, non-root, exec-form CMD, compose with healthchecks; migrations expand/contract.

**Five revision questions**

1. Kisi bhi design question ko tum kin 7 steps mein attack karte ho?
2. Ek unknown/timeout situation (payment) ko "failed" kyun nahi maante, kya karte ho?
3. Tumhare paas 3 rate limiter ki problems batao jo in-memory implementation mein multi-instance deployment par aati hain.
4. Outbox pattern, idempotent consumer aur dedupe key ek saath kaise kaam karte hain?
5. Rolling deployment mein zero downtime ke liye app, DB aur infra level par kya-kya chahiye?

**Practical coding task**

Mini integration: Express 5 app mein (1) token-bucket rate limit middleware (Redis), (2) `POST /v1/transfers` idempotent endpoint (Day 4 code), (3) `/healthz` + `/readyz` + `/metrics`, (4) Dockerfile + compose. Ek script se 50 concurrent transfers aur 100 rapid requests bhejo; verify karo: balances conserve hue, extra requests 429 hue, aur metrics mein `http_request_duration_seconds` buckets dikh rahe hain.

**Self-assessment checklist**

- [ ] Main 5 major designs ko 10 minute mein bol sakta hoon (requirements -> simple design -> hard part -> failures -> scale).
- [ ] Weekly test mein 70% se zyada score kiya (neeche scoring dekho).
- [ ] Mere weak-area log mein kam se kam 3 items likhe hain aur Week 8 ke liye plan hai.
- [ ] Maine har design ka ek ASCII diagram haath se draw kiya.
- [ ] Mujhe Dockerfile aur compose ka syntax yaad hai (ya cheat-sheet se verify kiya).

---

## Week 7 revision summary

**Architecture and scaling**

- Modular monolith > microservices by default. Microservices cost: network failures, no cross-service ACID (saga + outbox), observability, deploy overhead.
- Horizontal scaling needs stateless instances; LB with health checks, `trust proxy`.
- Caching: cache-aside; stampede/penetration/avalanche fixes; never cache balances for decisions.
- DB ladder and replica lag; connection math; pool leaks.

**Design patterns by system**

| System | Core mechanism | Failure handling | Scale step |
|--------|----------------|------------------|------------|
| Rate limiter | Token bucket, Redis Lua, Redis TIME | Fail open vs closed, `Retry-After` | Redis replica, Cluster |
| Notifications | Transactional insert, SKIP LOCKED worker, dedupe key | Backoff + jitter, lease, DLQ, 4xx no retry | More workers, queues per channel/priority |
| URL shortener | Random code + unique index + retry, `ascii_bin`, 302 | Collision retry, negative cache | Cache, replicas, shard by code |
| File upload | Presigned PUT, initiate/complete, status lifecycle | Pending cleanup, scan quarantine, idempotent complete | CDN, multipart, workers |
| Payments (PSP) | State machine, idempotency, webhook, reconciliation | Unknown != failed, dedupe, forward-only transitions | Outbox, queue, replicas for history |
| Transfers | Ordered `FOR UPDATE`, ledger | Deadlock retry, idempotent replay | Hot-account splitting, saga |

**Reliability toolbox:** timeouts, retries with backoff + jitter + budget, idempotency keys, outbox, DLQ, reconciliation, saga, circuit breaker.

**Observability and delivery:** logs (JSON, request ID, redaction), metrics (RED/USE, histograms, p99, event loop delay, pool waiters, queue age), liveness vs readiness, symptom-based alerts and SLOs; Docker multi-stage, compose healthchecks, graceful SIGTERM, CI/CD with SHA tags, expand/contract migrations, rolling/blue-green/canary, rollback.

**Tier reminder**

- `[ESSENTIAL]` this week: framework, monolith vs microservices reasoning, cache-aside, DB ladder, rate limiter basics, async notification idea, URL shortener, presigned upload idea, idempotency + transactions for money, outbox concept, health/metrics/logs, Dockerfile basics.
- `[ADVANCED]`: sliding window/Lua details beyond token bucket, Bloom filters, multipart/tus, KGS/Snowflake, CDC/Debezium, circuit breakers, sharding mechanics, tracing, Kubernetes. Interview mein naam aur idea bolna kaafi hai.

---

## Week 7 assessment

Time: 60 minutes, closed book. 24 questions: Basic (B) x8 = 1 point each, Intermediate (I) x9 = 2 points each, Advanced (A) x7 = 3 points each. Total = 8 + 18 + 21 = 47 points.

**Basic**

**B1.** Modular monolith aur microservices mein ek major difference bataiye jo transactions se related hai.

**B2.** Horizontal scaling ke liye service "stateless" kyun honi chahiye? Do examples do ki kya state bahar rakhni chahiye.

**B3.** Cache-aside pattern mein read aur write par kya hota hai?

**B4.** HTTP status code kaun sa return karte hain jab rate limit cross ho, aur kaun sa header client ko batata hai ki kitni der baad retry kare?

**B5.** Payment amounts ko float mein store karna kyun galat hai? Kaise store karte hain?

**B6.** At-least-once delivery ka matlab kya hai aur uska ek consequence kya hai?

**B7.** Liveness aur readiness probe mein difference?

**B8.** Dockerfile mein `CMD ["node", "src/server.js"]` (exec form) ko `CMD npm start` par prefer kyun karte hain?

**Intermediate**

**I1.** 10 app instances, har ek ka pool `connectionLimit: 20`, 2 worker processes pool 10 ke saath, MySQL `max_connections = 151`. Kya problem hai aur do fixes batao.

**I2.** Fixed-window rate limiter ki boundary problem explain karo aur token bucket isse kaise behtar hai.

**I3.** Redis mein rate limiter ke liye `INCR` ke baad alag se `EXPIRE` call karna kyun risky hai? Fix kya hai?

**I4.** Notification system mein `UNIQUE(dedupe_key)` aur `locked_until` column kaunse do alag problems solve karte hain?

**I5.** URL shortener mein short code column ke liye `ascii_bin` collation kyun chahiye? 301 vs 302 mein kab kya?

**I6.** File upload mein presigned URL flow ke 3 steps likho. Client ne size ya type jhooth bola to kaise pakadte ho?

**I7.** Payment API ne PSP ko call kiya aur 8 second timeout aa gaya. Tum kya karoge aur kya NAHI karoge?

**I8.** Outbox pattern kya problem solve karta hai? Ek minimal flow likho.

**I9.** Percentile (p99) aur average latency mein kaun zyada useful hai aur kyun? Metrics label mein `userId` kyun nahi daalte?

**Advanced**

**A1.** Do transfers ek saath chal rahe hain: A->B (100) aur B->A (50). Deadlock kaise ho sakta hai aur kaise pakka rokoge? Phir bhi deadlock aaye to application level par kya karoge?

**A2.** Webhook handler design karo: signature verification, duplicates, out-of-order events, aur slow downstream work sab kaise handle karoge? Raw body ki zaroorat kyun?

**A3.** Redis down ho gaya. Rate limiter ka behavior login endpoint aur product listing endpoint ke liye alag kyun hona chahiye? Aur cache-aside wale endpoint ka kya hona chahiye?

**A4.** 2PC ke bajay saga kyun? Order -> payment -> inventory flow ke liye compensation steps likho, aur compensation fail ho to?

**A5.** Notification system ko 350/s peak par "table + SKIP LOCKED workers" se chala rahe ho. Kab aur kyun real queue (SQS/BullMQ) par move karoge? Move karte waqt kaunsi reliability problem aati hai aur kaise solve karoge?

**A6.** Tumne read replica lagaya aur users complain karte hain ki "profile update ke baad purana naam dikhta hai". Root cause, aur 2 fixes batao. Phir batao kaunse reads kabhi replica par nahi jaane chahiye.

**A7.** Zero-downtime deploy mein column `name` ko `full_name` rename karna hai. Step-by-step plan likho aur batao ki ek hi release mein rename kyun khatarnak hai.

---

## Answers with explanations

**B1.** Modular monolith mein ek hi process aur ek hi database hone se multi-table business operation ek ACID transaction mein ho jata hai. Microservices mein har service ka apna DB hota hai, isliye cross-service operations ke liye ACID transaction nahi milta; saga (compensating actions) aur eventual consistency chahiye. Explanation: network ke beech atomic commit expensive (2PC) aur fragile hai.

**B2.** Agar instance ki memory mein state ho (login session, uploaded file, rate-limit counter), to LB ka agla request doosre instance par jaye to state nahi milegi, aur restart/scale-down par state lost. Externalize: sessions/tokens -> Redis ya JWT; files -> object storage (S3); counters -> Redis. Stateless instances ko freely add/remove kar sakte hain.

**B3.** Read: pehle cache check; hit to return; miss par DB se load, TTL ke saath cache mein set, return. Write: DB update (commit) karo, phir cache key delete (update nahi) taaki next read fresh load kare. Delete safer kyunki concurrent writers par cache update out-of-order ho sakta hai.

**B4.** `429 Too Many Requests` aur `Retry-After` header (seconds). Optionally `RateLimit-Limit/Remaining` headers. Retry-After clients ko immediate retry storm se bachata hai.

**B5.** Floating point binary fractions ko exactly represent nahi karta (`0.1 + 0.2 !== 0.3`), rounding errors paise mein galat balance de sakte hain. Integer minor units (paise/cents) in `BIGINT`, ya `DECIMAL`; currency code saath; conversion sirf boundary par.

**B6.** Message ko tab tak redelivered kiya jaata hai jab tak consumer ack na kare; isliye message ek ya zyada baar aa sakta hai, lose nahi hota. Consequence: duplicates, isliye consumers idempotent hone chahiye (dedupe by message id / idempotency key).

**B7.** Liveness: process alive hai ya nahi (fail par restart). Readiness: traffic lene ke liye ready hai ya nahi, dependencies (DB) sahi (fail par LB rotation se bahar, restart nahi). DB check readiness mein, liveness mein nahi, warna DB slow hone par saare healthy instances restart ho jaate.

**B8.** Exec form mein `node` PID 1 hota hai aur `SIGTERM` seedha receive karta hai, to graceful shutdown handler chal sakta hai. `npm start` shell/npm process ke through chalta hai jo signal forward nahi karta (ya delay se), to container 10 second baad SIGKILL hota hai aur in-flight requests toot jaati hain.

**I1.** Total = 10 x 20 + 2 x 10 = 220 > 151 (plus admin/monitoring headroom). Result: `Too many connections` errors. Fixes: pool size kam karo (e.g., 8 per instance -> 80 + 20 = 100), `max_connections` badhao (memory check karke), connection proxy (ProxySQL/RDS Proxy), slow queries fix karo taaki connections jaldi release ho, autoscaling ke max instance count ko pool size se link karo.

**I2.** Fixed window mein window boundary par burst: limit 100/min ho to 12:00:59 par 100 aur 12:01:00 par 100 = 2 second mein 200 requests. Token bucket continuous refill karta hai: bucket capacity burst limit hai, refill rate sustained limit; boundary jump nahi hota, aur memory O(1) per key (tokens + timestamp).

**I3.** Agar process `INCR` ke baad aur `EXPIRE` se pehle crash ho jaye (ya network drop), key bina TTL ke reh jati hai; counter kabhi reset nahi hota aur user permanently blocked ho sakta hai (aur memory leak). Fix: ek atomic Lua script jisme `INCR` ke saath TTL set ho (current == 1 par `PEXPIRE`), ya `SET key 0 NX PX window` phir `INCR`. Redis commands individually atomic hain, lekin do commands ke beech atomicity nahi.

**I4.** `UNIQUE(dedupe_key)`: producer-side duplicates rokta hai (producer retry par duplicate row nahi banta). `locked_until` lease: worker crash par `processing` mein stuck rows ko expiry ke baad dobara claim karne deta hai (crash recovery). Dono alag failure modes: duplicate production vs stuck consumption.

**I5.** Short codes case-sensitive hain (`aZ3` != `AZ3`); default MySQL collations case-insensitive hote hain, to alag codes collide kar jayenge ya galat URL redirect hoga. `ascii_bin` binary comparison deta hai. 301 browsers cache karte hain (kam traffic, lekin analytics aur expiry/disable control kho jata hai); 302 har baar server hit karta hai (analytics, expiry, edit control). Analytics/expiry chahiye to 302; permanent links aur minimal load ke liye 301.

**I6.** (1) `POST /files` initiate: server type/size validate, `pending` row, presigned PUT URL (short expiry, signed Content-Type/Length). (2) Client S3 par seedha PUT. (3) `POST /files/:id/complete`: server HEAD object se size verify, status `uploaded` (idempotent), async scan/thumbnail -> `ready`. Jhooth pakadna: signed Content-Length/Type (mismatch par S3 reject), HEAD par size compare, magic bytes check worker mein, malware scan, aur `ready` se pehle serve na karna.

**I7.** NAHI: failed mark nahi karenge aur naya payment attempt (naya idempotency key) nahi banayenge, kyunki charge ho chuka ho sakta hai (double charge risk). KARENGE: payment ko `created`/`pending` rakhenge, client ko "retry with same Idempotency-Key" wala retryable error denge, PSP call same PSP idempotency key se retry hoga, webhook se final state aayegi, aur reconciliation job PSP se status query karke converge karega.

**I8.** Problem: dual write; DB commit aur broker publish atomic nahi, ek fail ho to event lost ya phantom event. Flow: transaction mein business row + `outbox` row insert, commit; alag publisher unpublished outbox rows padhkar queue mein bhejta hai (deterministic jobId), phir `published_at` set karta hai; consumer idempotent (kyunki at-least-once).

**I9.** p99 (percentiles) zyada useful: average outliers chhupa deta hai, tail latency real users ko hurt karti hai. `userId` jaisi unbounded values label mein daalne se har unique value ek naya time series banata hai (high cardinality) aur Prometheus memory/storage phat jaati hai; labels bounded rakho (method, route pattern, status).

**A1.** Deadlock: T1 pehle A lock kare, T2 pehle B; phir T1 B maange, T2 A maange: circular wait. Fix: consistent lock order, dono transactions pehle chhota id lock karein (`ORDER BY id FOR UPDATE`), to cycle nahi banta. Phir bhi MySQL deadlock detect kar ke ek transaction ko victim (`ER_LOCK_DEADLOCK`) bana sakta hai (gap locks, secondary index locks); application level par poora transaction retry (2-3 baar, small backoff), idempotency key ke saath safe. Transactions short rakho, external calls lock ke andar nahi.

**A2.** Signature: raw body par HMAC (JSON parse hone ke baad bytes change ho sakte hain), `timingSafeEqual`, timestamp tolerance. Isliye route par `express.raw()`. Duplicates: `webhook_events(event_id PK)` insert same transaction mein state change ke saath; duplicate par 200. Out-of-order: forward-only transitions via `UPDATE ... WHERE status IN (allowed)` aur `affectedRows` check. Slow downstream: webhook mein sirf DB transaction + outbox row, 200 jaldi; emails/fulfillment outbox -> queue workers. Failure par non-2xx (PSP retries), reconciliation job missed events ke liye.

**A3.** Login par limiter protection hai (brute force/credential stuffing/SMS cost); down hone par open chhodna attack allow karta hai, isliye fail closed (503) ya stricter local fallback. Product listing par availability priority hai; fail open (ya approximate local limit) taaki Redis outage poore site ko down na kare. Cache-aside endpoint par Redis down: cache skip karke DB se serve karo (cache optimization hai, dependency nahi), lekin DB ko protect karne ke liye timeouts, connection limits aur load shedding/circuit breaker rakho.

**A4.** 2PC mein coordinator fail hone par participants locks ke saath blocked, availability/latency cost, aur kai systems (PSP, third parties) 2PC support hi nahi karte. Saga: har step local transaction, failure par compensating action. Order -> reserve stock (compensate: release stock) -> charge payment (compensate: refund) -> confirm order (compensate: cancel order + refund + release). Compensation fail ho to: idempotent retry with backoff, state persist (crash-resume), phir DLQ + alert + manual intervention; reconciliation job.

**A5.** Move karne ke triggers: polling load MySQL par noticeable, throughput 10x, multiple independent consumers/fan-out, per-channel isolation, ya DB contention. Naya problem: dual write (DB commit aur enqueue atomic nahi). Solution: transactional outbox: notification/event row business transaction mein, publisher queue mein push kare (deterministic jobId), consumers idempotent, DLQ + queue depth/age monitoring. Table ko history/audit ke liye rakh sakte ho.

**A6.** Root cause: asynchronous replication lag; write primary par hua, read replica se hui jahan abhi apply nahi hua (read-your-writes violation). Fixes: (1) write ke baad user ki reads kuch seconds ke liye primary par pin karo ya response mein updated data return karo; (2) strongly consistent reads primary se; (3) replica lag monitor karke lagging replica ko rotation se hatao/semi-sync replication consider karo. Replica par kabhi nahi: balances/payment status jo decisions drive karein, inventory checks purchase ke liye, anything inside a write transaction, auth/permission checks right after role change, locking reads (`FOR UPDATE`).

**A7.** Plan: (1) Expand migration: `ADD COLUMN full_name NULL`; deploy app jo dono columns likhe (write both) aur old column se padhe. (2) Backfill `full_name` from `name` in batches (small `UPDATE ... LIMIT` loops, throttled). (3) Deploy app jo `full_name` se padhe (abhi bhi dono likhe). (4) Verify (counts, mismatches = 0). (5) Next release: app dono columns likhna band kare. (6) Contract migration: `DROP COLUMN name`. Ek hi release mein rename khatarnak: rolling/canary deploy mein purana aur naya code saath chalte hain; rename ke baad purana code `name` column dhoondhega aur fail hoga; rollback bhi impossible/risky hota hai; large table par lock/long ALTER downtime la sakta hai.

### Scoring

| Score (of 47) | Meaning | Next step |
|---------------|---------|-----------|
| 0-23 (< 50%) | Foundations weak | Day 1, 2, 4 notes dobara padho (framework, caching, idempotency); sirf Basic + Intermediate dubara solve karo; Week 8 mein system design revision ko extra 2 ghante do |
| 24-33 (50-70%) | Developing | Weak-area log ke topics fix karo; 3 designs bolkar practice karo; Advanced questions A1, A2 par focus |
| 34-41 (70-88%) | Interview-ready for junior-to-mid system design | Advanced gaps fill karo; mock interviews mein timing practice |
| 42-47 (> 88%) | Strong | Week 8 mocks; follow-up depth (sharding, saga, CDC) `[ADVANCED]` explore |

Honest note: 47 points ka test sirf recall + reasoning measure karta hai. Real readiness ke liye designs ko bolkar practice karna zaroori hai (Week 8 mocks).

---

## Weak-area identification guidance

Test ke baad har galat/aadhe-sahi answer ko neeche ki table se map karo aur "weak-area log" banao (topic, kya galat hua, kaunsa section dobara padhna hai).

| If you missed... | Likely weakness | Re-read | Fix by doing |
|------------------|-----------------|---------|--------------|
| B1, B2, B3, I1, A6 | Scaling, caching, DB ladder, connection math | Day 1 (1.1-1.4) | Connection math 3 examples hand se solve; cache-aside code dobara likho |
| B4, I2, I3, A3 | Rate limiter atomicity and failure policy | Day 2 / 2.1 | Lua token bucket ko 10 parallel requests se test karo (Day 2 coding task) |
| I4, A5, B6 | Notification reliability, at-least-once, queues | Day 2 / 2.2, Day 5 / 5.1 | SKIP LOCKED worker aur idempotent consumer likho |
| I5, I6 | URL shortener, upload architecture | Day 3 | Dono ke diagram aur schema bina dekhe draw karo |
| B5, I7, I8, A1, A2, A4 | Money correctness, idempotency, transactions, webhooks, saga | Day 4 (4.1-4.4), Week 4 / Day 4-5 | Transfer concurrency test (Day 4 coding task); webhook handler ek baar khud likho |
| B7, I9 | Observability basics | Day 5 / 5.2 | `/metrics` aur `/readyz` apne project mein add karo |
| B8, A7 | Docker, deployment, migrations | Day 6 / 6.1-6.2 | Dockerfile + compose likho; expand/contract ek table par practice |
| Could not structure answers (even when right) | Communication/framework | Framework section + Day 6 / 6.3 | 3 prompts timer ke saath bolo, record karke suno; rubric se score |

Self-diagnosis questions:

1. Kya mujhe "simplest design" yaad rehta hai ya main seedha complex components bolta hoon?
2. Kya main har design ka hard part ek sentence mein bol sakta hoon?
3. Kya main har component ke failure ke liye mitigation bata sakta hoon?
4. Kya main numbers (QPS, connections, storage) se scaling decision justify kar sakta hoon?
5. Kya mujhe code-level details yaad hain (Lua script idea, `SKIP LOCKED`, ordered locks, HMAC on raw body, Dockerfile) ya sirf diagrams?

Agar 1-2 ka jawab "no" hai: framework drill (Day 6.3). 3-4 "no": failure tables aur scaling ladder revise karo. 5 "no": code snippets dobara type karo (copy nahi).

---

## Catch-up plan if you fall behind

Realistic rule: Week 7 ke 14 ghante hain. Agar piche ho, **priority order** se kaam karo (essential first), advanced content skip karo.

**Priority tiers**

1. Must-do (6 hours): framework, Day 1 (1.1-1.4 core), Day 2 rate limiter basics + notification design idea, Day 4 (4.1, 4.2 flow, idempotency), Day 5 queues/at-least-once/outbox concept, Day 6 Dockerfile + compose syntax.
2. Should-do (4 hours): URL shortener, file upload design, transfers/ledger, observability (RED, probes), deployment/migrations.
3. Nice-to-have `[ADVANCED]` (skip if short): sliding window variants, Bloom filters, multipart/tus, KGS/Snowflake, circuit breaker details, tracing, Kubernetes, sharding mechanics.

**If you are 1 day behind:** Day 7 ke revision block (30 min) chhota karo, weekly test sirf Basic + Intermediate (17 questions, 40 min) lo, advanced questions Week 8 / Day 5 (system design revision) mein.

**If you are 2-3 days behind:**

| Original | Compressed plan |
|----------|-----------------|
| Day 1 + Day 2 | 3 hours: 1.2-1.4 summaries + rate limiter + notification (skip in-memory code details, read only diagrams, failure tables, interview answers) |
| Day 3 + Day 4 | 3.5 hours: URL shortener (code generation + cache), file upload flow, payment 4.2 + 4.4 (skip full ledger code; read concept and answer) |
| Day 5 + Day 6 | 3 hours: queue semantics + outbox + observability bullets, Dockerfile/compose, deployment summary |
| Day 7 | 1.5 hours: cheat-sheet + weekly test (Basic + Intermediate) |

**If you are a full week behind:** Week 8 ko shuru karo, lekin Week 8 / Day 5 ko Week 7 ke liye reserve karo: us din ke 2 ghante mein Day 6.3 ka cheat-sheet + 3 designs ko bolkar practice karo (rate limiter, URL shortener, payments). Baki Week 7 content ko Week 8 ke baad buffer time mein padho. Interview mein system design ka weightage junior roles mein kam hota hai; mid-level par zyada, isliye target role ke hisaab se time decide karo.

**Minimum viable Week 7 (agar sirf 3 ghante bache hain)**

1. Framework (10 min) + cheat-sheet table (10 min).
2. Rate limiter: token bucket idea + Redis atomicity + fail open/closed (20 min).
3. Payments: idempotency key + state machine + webhook + unknown != failed (30 min).
4. Caching + DB ladder + connection math (25 min).
5. Queues: at-least-once, idempotent consumers, outbox (20 min).
6. Dockerfile + compose + graceful shutdown (25 min).
7. Interview answers (spoken) of those topics out loud (40 min).

Rule: padhne se zyada bolkar practice. Catch-up mein bhi roz kam se kam 15 minute design bolne ka rakho.

---

*End of Week 7. Next: Week 8 -- Interview Revision and Mock Preparation (08_Week8_Revision_Mocks_Checklist.md).*
