# Week 6 -- Testing and Production Backend Engineering (Days 36-42)

Part of the Node.js Backend Interview Preparation set. This file covers Week 6, Day 1 to Day 7
(overall Day 36 to Day 42 of the 56-day plan). The master table of contents and the 56-day schedule
live in `00_Master_Strategy_Schedule.md`. Question bank IDs (`Q-TEST-xx`, `Q-PERF-xx`, `Q-PROD-xx`) and
coding exercise IDs (`EX-TEST-xx`, `EX-DEBUG-xx`, `EX-IDEM-xx`, `EX-ERR-xx`) are cross-referenced where useful.

Tier markers used everywhere: `[ESSENTIAL]` = asked in most junior-to-mid interviews.
`[ADVANCED]` = supplementary, asked in stronger interviews or senior-ish rounds.

Honest note: Week 6 is the widest week of the plan. Testing, logging, resilience, Redis, queues,
shutdown and profiling are each a career-long topic. In 14 hours you will get the working vocabulary,
the standard patterns and the ability to explain trade-offs. You will NOT become an SRE. That is fine for
a junior-to-mid backend interview.

---

## Week 6 Table of Contents

- Week 6 map and the demo project used in all examples
- Day 1 (Day 36) - Unit vs integration tests, Vitest (Jest), Supertest, mocking, negative tests
- Day 2 (Day 37) - Logging with pino, structured errors, correlation IDs with AsyncLocalStorage
- Day 3 (Day 38) - Timeouts, retries, exponential backoff with jitter, idempotency keys, duplicate prevention
- Day 4 (Day 39) - Redis fundamentals (ioredis), caching patterns, cache invalidation
- Day 5 (Day 40) - Background jobs with BullMQ, graceful shutdown
- Day 6 (Day 41) - Debugging slow APIs and memory leaks, autocannon, Production failure diagnosis playbook
- Day 7 (Day 42) - Revision and weekly test
- Week 6 revision summary, assessment, answers, weak-area guidance, catch-up plan

---

## Week 6 map and the demo project

Is week ka theme ek line mein: **"Code chal gaya" se "code production mein safe chalega" tak ka safar.**
Frontend mein tum jaante ho ki ek component "works on my machine" hota hai aur real users ke saamne toot jaata
hai (slow network, double click, tab close). Backend mein yahi hota hai, bas stakes zyada hain: double click
ka matlab double payment ho sakta hai.

### Tools chosen this week

| Need | Tool used in notes | Alternative to know |
|------|--------------------|---------------------|
| Test runner | **Vitest** | Jest (most common in existing codebases) |
| HTTP testing | **Supertest** | node:test + fetch against a real listening port |
| Logging | **pino** + **pino-http** | winston (slower, more flexible transports) |
| Redis client | **ioredis** | node-redis (official client, also fine) |
| Queue | **BullMQ** (Redis based) | RabbitMQ, SQS (Week 7), agenda (Mongo) |
| Load test | **autocannon** | k6, wrk, Artillery |
| Profiling | **node --inspect**, **clinic** | 0x, node --cpu-prof |

**Why Vitest and not Jest in the notes?** Our rule is ES modules everywhere. Vitest is ESM-native, needs
almost zero config, and has the same API as Jest (`describe`, `it`, `expect`) with `vi` instead of `jest`.
Jest still works with ESM but needs `node --experimental-vm-modules` and `jest.unstable_mockModule` for
mocking ES modules, which is clumsy. In an interview, say: "I use Vitest on new ESM projects, Jest on
existing ones; the concepts are identical." Mapping table is in Day 1.

### The demo project: `orders-api`

Poore week mein ek chhota marketplace "orders" service use karenge, taaki examples aapas mein judte rahein.

```
orders-api/
  package.json
  vitest.config.js
  src/
    app.js              -> createApp(deps): Express 5 app factory (no listen here)
    server.js           -> composition root: builds deps, listen, graceful shutdown
    errors.js           -> AppError
    logger.js           -> pino instance
    context.js          -> AsyncLocalStorage helpers (Day 2)
    orders/
      orderService.js   -> business logic (unit tested)
      orderRepo.js      -> MySQL queries (Week 4/5 style)
    lib/
      retry.js          -> retry with backoff + jitter (Day 3)
      idempotency.js    -> idempotency store on MySQL (Day 3)
      cache.js          -> Redis cache helpers (Day 4)
      queue.js          -> BullMQ queue + worker (Day 5)
  test/
    orderService.test.js
    orders.api.test.js
```

`package.json` (ESM, Node 22 LTS; Node 20 also works for everything below):

```json
{
  "name": "orders-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "start": "node src/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "load": "autocannon -c 50 -d 20 http://localhost:3000/health"
  },
  "dependencies": {
    "bullmq": "^5.0.0",
    "express": "^5.1.0",
    "ioredis": "^5.4.0",
    "mysql2": "^3.11.0",
    "pino": "^9.0.0",
    "pino-http": "^10.0.0"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^2.0.0",
    "autocannon": "^8.0.0",
    "supertest": "^7.0.0",
    "vitest": "^2.0.0"
  }
}
```

Version note: library majors move. Always check the current major in the package docs before copying;
the concepts below do not change between majors, only small option names might.

---

## Day 1 - Unit vs integration tests, Vitest (Jest), Supertest, mocking, negative tests (Day 36)

**Learning objectives**

By the end of today you should be able to:
1. Explain the test pyramid and decide what is a unit test, an integration test and an end-to-end test.
2. Write Vitest tests with `describe/it/expect`, setup/teardown hooks, and `vi.fn`, `vi.spyOn`, `vi.mock`.
3. Test an Express 5 API with Supertest without opening a real port.
4. Mock external dependencies (payment gateway, email) correctly, and know when NOT to mock.
5. Write negative tests: validation errors, 401, 403, 404, 409, malformed JSON.
6. Answer "what must be tested in a backend" with a clear priority list.

Suggested time (about 2 hours): 25 min concept notes, 35 min unit tests, 40 min Supertest integration,
20 min negative tests and coverage.

### 1.1 Why test, and the test pyramid `[ESSENTIAL]`

**Concept**

Test ka matlab: code ka ek chhota hissa chalake check karna ki expected output aata hai ya nahi, automatically.
Backend mein tests isliye zaroori hain kyunki tum bina UI ke API ship karte ho: koi insaan har release pe
50 endpoints manually click nahi karega. Tests tumhara safety net hain, aur refactor karne ki himmat dete hain.

Test pyramid:

```
            /\
           /E2E\          few: real browser/real services, slow, flaky-prone
          /------\
         / Integr.\       some: API + real DB/Redis, medium speed
        /----------\
       /   Unit     \     many: pure functions/services, milliseconds
      /--------------\
```

| Level | What runs | Speed | Catches | Typical tool |
|-------|-----------|-------|---------|--------------|
| Unit | One function/class, dependencies faked | ms | Logic bugs, edge cases | Vitest |
| Integration | Several real pieces together (Express routes + middleware + DB) | 100ms - seconds | Wiring bugs, SQL bugs, serialization, status codes | Vitest + Supertest + real MySQL |
| End-to-end | Whole deployed system through its public interface | seconds - minutes | Deployment/config issues | Postman/newman, k6, Playwright |

**Why it matters**

Interviewers poochte hain "How do you test your APIs?" Ek weak answer: "Postman se manually". Strong answer:
"Unit tests for business rules, integration tests with Supertest against a real test database for routes,
and a few contract/smoke tests post-deploy." Also shows you understand cost vs confidence trade-off.

**Frontend connection**

React mein: unit = a pure helper or a hook with React Testing Library `renderHook`; integration = rendering a
page with real child components and a mocked network (MSW); E2E = Cypress/Playwright. Backend pyramid is the
same shape. Supertest is to Express what React Testing Library is to a component: you drive it from the
outside via its public interface (HTTP), not by poking internals.

**Real-world scenario**

Payments app: `calculateTotal()` with GST and discounts is a unit test (hundreds of cheap cases, because money
bugs are expensive). `POST /orders` returning 201 with the right JSON and writing a row in MySQL is an
integration test. "User can register, login, pay, and see receipt on staging" is one E2E smoke test.

**Interview answer:**
"I follow the test pyramid. Most of my tests are fast unit tests around business logic with dependencies
mocked at the boundary. On top of that I write integration tests that run the real Express app through
Supertest against a real test database, so routing, middleware, validation, SQL and serialization are all
exercised together. I keep only a handful of end-to-end smoke tests because they are slow and brittle."

**Follow-up questions**

- *Why not only integration tests?* They are slower, failures are harder to localize, and covering every edge
  case of a pricing function through HTTP is wasteful. Use unit tests for combinatorial logic, integration
  for wiring.
- *Why not only unit tests?* Mocks can agree with your assumptions and still be wrong. A unit test with a mocked
  repository will not tell you that your SQL has a typo or a column was renamed.
- *What about the "testing trophy" idea?* Some teams favour more integration tests because they give higher
  confidence per test. Reasonable for CRUD-heavy services; for logic-heavy services keep more unit tests. The
  key is knowing the trade-off.

**Common mistakes**

- Testing implementation details (that a private function was called) instead of behavior (output/side effect).
- Mocking everything, so the test only proves the mock works.
- Sharing mutable state between tests so order matters.
- Chasing 100% coverage numbers instead of risk-based coverage.

**Revision notes**

- Pyramid: many unit, some integration, few E2E.
- Unit = isolated logic; integration = real wiring; E2E = whole system.
- Test behavior, not implementation.

### 1.2 What must be tested in a backend (priority list) `[ESSENTIAL]`

Interviewer favourite: "What would you test in this endpoint?" Ek checklist yaad rakho. Rank by business risk.

1. **Business rules with money or permissions**: price calculation, discounts, refunds, who can do what.
2. **Authentication and authorization**: no token -> 401, wrong role -> 403, other user's resource -> 404/403.
3. **Input validation (negative tests)**: missing fields, wrong types, too long strings, negative amounts,
   unknown fields, malformed JSON.
4. **Error paths**: DB down, third-party timeout, duplicate key (409). Does the API return a safe, consistent
   error and NOT leak a stack trace?
5. **Happy path with side effects**: correct status code, response shape, row actually saved.
6. **Concurrency/idempotency-sensitive flows**: same request twice, two users buying the last item.
7. **Pagination/filter/sort boundaries**: page 0, huge limit, empty result, invalid sort column (SQL injection
   surface).
8. **Transactions**: if step 3 of 4 fails, steps 1-2 must roll back.

What you usually do NOT test: Express itself, mysql2 itself, getters/setters, one-line pass-through code,
auto-generated code. Test YOUR logic, not the framework.

### 1.3 Vitest basics `[ESSENTIAL]`

**Concept**

Vitest ek test runner hai: `*.test.js` files dhundta hai, har `it()` ko run karta hai, aur `expect()` ke
assertions check karta hai. Vite ke transform pipeline pe bana hai, isliye ESM `import` direct chalta hai
(no Babel config).

**Why it matters**

Test runner choice interview mein aata hai, aur Jest vs Vitest ka fark samajhna "I know my tooling" dikhata hai.

**Internal working**

- Vitest runs each test FILE in isolation (worker threads by default, so module state does not leak between
  files). Inside a file, tests run in order of definition (sequentially unless you opt into `concurrent`).
- `vi.mock('path')` calls are **hoisted** to the top of the file by the transformer, before imports run. That
  is why you can mock a module that is imported at the top.
- Watch mode re-runs only tests affected by changed files (dependency graph).
- Coverage: `@vitest/coverage-v8` uses V8's built-in coverage, no instrumentation of your source needed.

`vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    clearMocks: true,        // reset mock.calls between tests
    restoreMocks: true,      // restore vi.spyOn originals between tests
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/server.js'], // composition root, covered by smoke tests
      reporter: ['text', 'html'],
    },
  },
});
```

A first test file `test/basics.test.js`:

```js
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

describe('array basics', () => {
  beforeAll(() => { /* once before all tests in this describe */ });
  afterAll(() => { /* once after */ });
  beforeEach(() => { /* before every test */ });
  afterEach(() => { /* after every test */ });

  it('adds numbers', () => {
    expect(1 + 2).toBe(3);                 // strict equality (Object.is)
  });

  it('compares objects deeply', () => {
    expect({ a: 1, b: [1, 2] }).toEqual({ a: 1, b: [1, 2] });
  });

  it('matches partially', () => {
    expect({ id: 1, name: 'x', createdAt: 'now' }).toMatchObject({ id: 1, name: 'x' });
  });

  it('checks thrown errors', () => {
    expect(() => JSON.parse('{bad')).toThrow(SyntaxError);
  });

  it('checks async resolution and rejection', async () => {
    await expect(Promise.resolve(5)).resolves.toBe(5);
    await expect(Promise.reject(new Error('boom'))).rejects.toThrow('boom');
  });

  it.each([
    [1, 1, 2],
    [2, 3, 5],
    [-1, 1, 0],
  ])('add(%i, %i) = %i', (a, b, expected) => {
    expect(a + b).toBe(expected);
  });
});
```

Run: `npx vitest run` (single run, used in CI) or `npx vitest` (watch mode).

**Jest vs Vitest mapping** (interview favourite)

| Concept | Jest | Vitest |
|---------|------|--------|
| Mock function | `jest.fn()` | `vi.fn()` |
| Spy | `jest.spyOn(obj, 'm')` | `vi.spyOn(obj, 'm')` |
| Module mock | `jest.mock('x')` (CJS, hoisted by babel-jest) | `vi.mock('x')` (hoisted) |
| ESM module mock | `jest.unstable_mockModule` + dynamic import | `vi.mock` works directly |
| Fake timers | `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| Env stubbing | manual `process.env` | `vi.stubEnv('KEY','v')` |
| Globals | on by default (`describe` without import) | off by default, import from `vitest` (or `globals: true`) |
| Config | `jest.config.js` + babel for ESM | `vitest.config.js` (Vite) |
| Speed | good | usually faster, esp. in watch mode |

Jest ke liye ESM mein: `NODE_OPTIONS=--experimental-vm-modules npx jest` aur `"type":"module"`. Rest same.

`node:test` bhi built-in hai (`import test from 'node:test'`, `node --test`) and is a perfectly valid
zero-dependency choice for small services, but most employers use Jest or Vitest, so learn those first.

**Frontend connection**

Agar tumne CRA/Jest + React Testing Library use kiya hai, to `describe/it/expect/jest.fn` already aata hai.
Vitest is the same API, the default test runner of Vite projects. Backend tests do not need jsdom: keep
`environment: 'node'`.

**Interview answer:**
"I use Vitest for new ESM projects because it needs almost no configuration and has a Jest compatible API, and
I am equally comfortable with Jest on existing codebases. Both give me describe/it/expect, mock functions,
module mocking, fake timers and coverage. For HTTP-level tests I add Supertest."

**Follow-up questions**

- *Difference between `toBe` and `toEqual`?* `toBe` uses `Object.is` (reference/primitive identity);
  `toEqual` recursively compares values and ignores `undefined` properties; `toStrictEqual` is stricter
  (checks `undefined` props, classes).
- *How do you run one test?* `it.only`, `vitest -t "name"`, or `vitest path/to/file`.
- *How do you keep tests independent?* Fresh state in `beforeEach`, no shared mutable module state, clean the
  database between tests.

**Common mistakes**

- Forgetting `await` on an async assertion: `expect(promise).rejects...` without `await` passes silently.
- Leaving `.only` in committed code, so CI runs one test.
- Relying on test order.
- Importing `describe/it` but forgetting that Vitest globals are off by default.

**Revision notes**

- `vitest run` = CI, `vitest` = watch.
- `vi.mock` is hoisted; `clearMocks/restoreMocks` in config prevent leaks.
- `toEqual` for values, `toBe` for identity.

### 1.4 Mocking external dependencies `[ESSENTIAL]`

**Concept**

Mock = asli cheez ki jagah ek nakli cheez jo tum control karte ho. Payment gateway ko test mein actually call
nahi karna: slow hai, paise lag sakte hain, aur kabhi down bhi hota hai. Isliye uska fake banate hain.

Vocabulary (interviewers use these loosely; know the distinction):

- **Stub**: returns canned answers (`getRate() -> 83.2`).
- **Mock**: a stub that also records calls so you can assert them (`expect(gateway.charge).toHaveBeenCalledWith(...)`).
- **Spy**: wraps a REAL function, lets it run, records calls.
- **Fake**: a lightweight working implementation (in-memory repository, SQLite instead of MySQL).

**Why it matters**

Mocking at the right boundary makes tests fast and deterministic. Mocking at the wrong place makes tests
brittle and meaningless.

**Internal working**

`vi.fn()` creates a function that records `mock.calls`, `mock.results`, and lets you program behavior:
`mockResolvedValue`, `mockRejectedValueOnce`, `mockImplementation`. `vi.mock('./mod.js')` replaces a whole
module in the module registry before it is imported. Dependency injection (passing dependencies as function
arguments) avoids module mocking entirely: you simply pass a `vi.fn()` in. That is why we wrote `createApp` and
`createOrderService` as factories.

**Code: the service under test**

`src/errors.js`:

```js
export class AppError extends Error {
  constructor(status, code, message, details, options) {
    super(message, options);  // options = { cause } keeps the root error for logging
    this.name = 'AppError';
    this.status = status;     // HTTP status
    this.code = code;         // stable machine readable code, e.g. VALIDATION_ERROR
    this.details = details;   // optional, safe to show to client
  }
}
```

`src/orders/orderService.js` (money is always integer paise, never floats):

```js
import { AppError } from '../errors.js';

const TAX_RATE_PERCENT = 18;

export function calculateTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'items must be a non-empty array');
  }
  let subtotal = 0;
  for (const item of items) {
    const { priceInPaise, qty } = item;
    if (!Number.isInteger(priceInPaise) || priceInPaise <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'priceInPaise must be a positive integer');
    }
    if (!Number.isInteger(qty) || qty <= 0 || qty > 100) {
      throw new AppError(400, 'VALIDATION_ERROR', 'qty must be an integer between 1 and 100');
    }
    subtotal += priceInPaise * qty;
  }
  const tax = Math.round((subtotal * TAX_RATE_PERCENT) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

// Dependencies are injected: easy to fake in tests, easy to swap in production.
export function createOrderService({ orderRepo, paymentGateway }) {
  return {
    async placeOrder(userId, items) {
      const totals = calculateTotal(items);

      let charge;
      try {
        charge = await paymentGateway.charge({
          userId,
          amountInPaise: totals.total,
        });
      } catch (err) {
        // Keep the original error as `cause` for logs; do NOT put it in client-visible `details`.
        throw new AppError(502, 'PAYMENT_FAILED', 'Payment provider failed', undefined, { cause: err });
      }

      const order = await orderRepo.create({
        userId,
        items,
        ...totals,
        paymentRef: charge.id,
        status: 'PAID',
      });
      return order;
    },

    async getOrder(requester, orderId) {
      const order = await orderRepo.findById(orderId);
      // 404 (not 403) for other people's orders: do not reveal that the id exists.
      if (!order || (order.userId !== requester.id && requester.role !== 'admin')) {
        throw new AppError(404, 'NOT_FOUND', 'Order not found');
      }
      return order;
    },
  };
}
```

**Code: unit tests**

`test/orderService.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateTotal, createOrderService } from '../src/orders/orderService.js';
import { AppError } from '../src/errors.js';

describe('calculateTotal', () => {
  it('computes subtotal, 18% tax and total in paise', () => {
    const r = calculateTotal([
      { priceInPaise: 10000, qty: 2 },   // 200.00
      { priceInPaise: 5050, qty: 1 },    // 50.50
    ]);
    expect(r).toEqual({ subtotal: 25050, tax: 4509, total: 29559 });
  });

  it.each([
    ['empty items', []],
    ['not an array', 'abc'],
    ['zero qty', [{ priceInPaise: 100, qty: 0 }]],
    ['float price', [{ priceInPaise: 10.5, qty: 1 }]],
    ['negative price', [{ priceInPaise: -5, qty: 1 }]],
    ['huge qty', [{ priceInPaise: 100, qty: 101 }]],
  ])('rejects %s with 400', (_label, items) => {
    expect(() => calculateTotal(items)).toThrow(AppError);
    try {
      calculateTotal(items);
    } catch (e) {
      expect(e.status).toBe(400);
      expect(e.code).toBe('VALIDATION_ERROR');
    }
  });
});

describe('orderService.placeOrder', () => {
  let orderRepo;
  let paymentGateway;
  let service;

  beforeEach(() => {
    orderRepo = {
      create: vi.fn(async (data) => ({ id: 1, ...data })),
      findById: vi.fn(),
    };
    paymentGateway = { charge: vi.fn().mockResolvedValue({ id: 'pay_123' }) };
    service = createOrderService({ orderRepo, paymentGateway });
  });

  it('charges the gateway with the computed total and stores the order', async () => {
    const order = await service.placeOrder(7, [{ priceInPaise: 10000, qty: 1 }]);

    expect(paymentGateway.charge).toHaveBeenCalledOnce();
    expect(paymentGateway.charge).toHaveBeenCalledWith({ userId: 7, amountInPaise: 11800 });
    expect(order).toMatchObject({ id: 1, total: 11800, status: 'PAID', paymentRef: 'pay_123' });
  });

  it('does NOT save an order when the payment fails', async () => {
    paymentGateway.charge.mockRejectedValueOnce(new Error('gateway timeout'));

    await expect(service.placeOrder(7, [{ priceInPaise: 10000, qty: 1 }])).rejects.toMatchObject({
      status: 502,
      code: 'PAYMENT_FAILED',
    });
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it('does not call the gateway at all for invalid items', async () => {
    await expect(service.placeOrder(7, [])).rejects.toMatchObject({ status: 400 });
    expect(paymentGateway.charge).not.toHaveBeenCalled();
  });
});

describe('orderService.getOrder', () => {
  it('hides orders of other users behind a 404, but lets admins read them', async () => {
    const orderRepo = { findById: vi.fn().mockResolvedValue({ id: 5, userId: 99 }) };
    const service = createOrderService({ orderRepo, paymentGateway: {} });

    await expect(service.getOrder({ id: 1, role: 'user' }, 5)).rejects.toMatchObject({ status: 404 });
    await expect(service.getOrder({ id: 2, role: 'admin' }, 5)).resolves.toMatchObject({ id: 5 });
  });
});
```

Note the test "does NOT save an order when the payment fails": ye ek **negative/behavioral** test hai. Wo
sabse zyada bugs pakadta hai: "payment fail hua par order PAID dikh raha hai".

**Module mocking with `vi.mock`** (when you cannot inject, e.g. a module that imports a client directly):

```js
import { describe, it, expect, vi } from 'vitest';

// Hoisted above imports by Vitest. Factory replaces the real module.
vi.mock('../src/lib/emailClient.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'm1' }),
}));

import { sendEmail } from '../src/lib/emailClient.js';
import { notifyOrderPlaced } from '../src/orders/notify.js';

describe('notifyOrderPlaced', () => {
  it('sends one email', async () => {
    await notifyOrderPlaced({ id: 1, email: 'a@b.com' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
```

**Spies and fake timers** (needed for retry/timeout code on Day 3):

```js
import { it, expect, vi, afterEach } from 'vitest';

afterEach(() => vi.useRealTimers());

it('runs the delayed task after 1s without really waiting', async () => {
  vi.useFakeTimers();
  const task = vi.fn();
  setTimeout(task, 1000);

  expect(task).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1000);   // Async variant also flushes promise callbacks
  expect(task).toHaveBeenCalledOnce();
});

it('spies on a real method but keeps its behavior', () => {
  const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // override for determinism
  expect(Math.random()).toBe(0.5);
  spy.mockRestore();
});
```

**What NOT to mock**

- Pure functions (`calculateTotal`): just call them.
- The database in integration tests: the point of the test is to hit real SQL. Mocking mysql2 there proves nothing.
- The thing under test.

**Frontend connection**

Same as mocking `fetch` or using MSW in React tests, or `jest.fn()` for an `onClick` prop. Dependency injection
here == passing a callback prop.

**Real-world scenario**

Razorpay/Stripe call ko test mein asli me nahi bhejte. Tum `paymentGateway.charge` ko fake karte ho: ek test
success, ek timeout, ek "card declined" simulate karta hai. Production mein un failure modes ka asli behavior
(retry? refund? mark FAILED?) verify ho jaata hai without paying a rupee.

**Interview answer:**
"I mock at the boundary of my system: payment gateways, email providers, third-party HTTP APIs, and the
clock. I prefer dependency injection so I can pass a fake in directly instead of patching modules. I do not
mock the database in integration tests, and I do not mock pure functions. I assert on behavior and
observable side effects, like 'when payment fails no order is saved', rather than internal calls only."

**Follow-up questions**

- *Mock vs stub vs spy vs fake?* See vocabulary above: stub returns canned data, mock also verifies calls,
  spy wraps the real thing, fake is a simple working substitute.
- *Risk of over-mocking?* Tests pass while production fails because mock and real behavior drifted. Mitigate with
  integration tests and contract tests against the real provider sandbox.
- *How do you test time-dependent code?* Fake timers or inject a `clock` function; never `sleep` in tests.
- *How do you test code that uses `Date.now()`?* `vi.setSystemTime(new Date('2025-01-01'))` with fake timers.

**Common mistakes**

- Mocking the module under test.
- Not resetting mocks, so call counts leak between tests (use `clearMocks`/`restoreMocks`).
- Using the real third-party API in tests (flaky, slow, costs money, may hit rate limits).
- Asserting only that a mock was called, never the actual outcome.

**Revision notes**

- Mock at boundaries; inject dependencies; real DB for integration.
- Stub = canned, mock = verifies calls, spy = wraps real, fake = light implementation.
- Fake timers for retries/timeouts.

### 1.5 Supertest: integration testing the Express API `[ESSENTIAL]`

**Concept**

Supertest tumhare Express `app` ko seedha call karta hai aur HTTP request/response simulate karta hai.
Real port kholne ki zaroorat nahi (internally ek ephemeral port pe listen karta hai aur bad mein band kar deta
hai). Isse routing, middleware, JSON parsing, auth, status codes sab ek saath test hote hain.

**Why it matters**

Is test se wo bugs pakde jaate hain jo unit tests nahi pakadte: middleware order galat, `express.json()`
lagana bhul gaye, error handler ka wrong status, route path typo.

**Internal working**

`request(app)` agar app ek function (Express app) hai to wo `http.createServer(app)` banata hai, port `0` pe
listen karta hai (OS koi free port deta hai), request bhejta hai, response collect karta hai, server close
karta hai. Isi liye **`app` aur `listen()` alag files mein hone chahiye**: `app.js` factory export kare,
`server.js` listen kare. Agar `app.js` mein `listen` hai to tests port conflict aur open handle problems deti
hain.

`src/app.js`:

```js
import express from 'express';
import { AppError } from './errors.js';

export function createApp({ orderService, verifyToken, logger }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Authentication middleware: who are you?
  const requireAuth = (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Missing bearer token');
    }
    const user = verifyToken(token); // returns { id, role } or null
    if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid token');
    req.user = user;
    next();
  };

  // Authorization middleware factory: are you allowed?
  const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient role');
    }
    next();
  };

  app.post('/orders', requireAuth, async (req, res) => {
    // Express 5: a rejected promise from an async handler is forwarded to the error handler automatically.
    // In Express 4 you needed try/catch + next(err) or a wrapper.
    const order = await orderService.placeOrder(req.user.id, req.body?.items);
    res.status(201).json(order);
  });

  app.get('/orders/:id', requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'id must be a positive integer');
    }
    const order = await orderService.getOrder(req.user, id);
    res.json(order);
  });

  app.delete('/admin/orders/:id', requireAuth, requireRole('admin'), (req, res) => {
    res.status(204).end();
  });

  // 404 for unknown routes
  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Centralized error handler: 4 arguments is what marks it as an error middleware.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    // body-parser errors (malformed JSON, payload too large) carry status + type
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON body' } });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Body too large' } });
    }
    if (err instanceof AppError) {
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }

    logger?.error({ err }, 'unhandled error');
    // Never leak err.message or stack of unknown errors to the client.
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
  });

  return app;
}
```

`test/orders.api.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createOrderService } from '../src/orders/orderService.js';

// Fake in-memory repository: fast and deterministic for route-level tests.
function createFakeRepo() {
  const rows = new Map();
  let nextId = 1;
  return {
    create: async (data) => {
      const row = { id: nextId++, ...data };
      rows.set(row.id, row);
      return row;
    },
    findById: async (id) => rows.get(id) ?? null,
    _rows: rows,
  };
}

const tokens = {
  'user-token': { id: 1, role: 'user' },
  'other-token': { id: 2, role: 'user' },
  'admin-token': { id: 3, role: 'admin' },
};

describe('orders API', () => {
  let app;
  let repo;
  let gateway;

  beforeEach(() => {
    repo = createFakeRepo();
    gateway = { charge: vi.fn().mockResolvedValue({ id: 'pay_1' }) };
    const orderService = createOrderService({ orderRepo: repo, paymentGateway: gateway });
    app = createApp({ orderService, verifyToken: (t) => tokens[t] ?? null });
  });

  describe('POST /orders', () => {
    it('201 and returns the created order', async () => {
      const res = await request(app)
        .post('/orders')
        .set('Authorization', 'Bearer user-token')
        .send({ items: [{ priceInPaise: 10000, qty: 2 }] })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toMatchObject({ userId: 1, subtotal: 20000, tax: 3600, total: 23600, status: 'PAID' });
      expect(repo._rows.size).toBe(1);
    });

    // ---------- negative tests ----------
    it('401 without a token', async () => {
      const res = await request(app).post('/orders').send({ items: [] });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('401 with an invalid token', async () => {
      await request(app).post('/orders').set('Authorization', 'Bearer nope').send({}).expect(401);
    });

    it('400 for invalid items, and nothing is charged', async () => {
      const res = await request(app)
        .post('/orders')
        .set('Authorization', 'Bearer user-token')
        .send({ items: [{ priceInPaise: -1, qty: 1 }] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(gateway.charge).not.toHaveBeenCalled();
    });

    it('400 when body is missing entirely', async () => {
      await request(app).post('/orders').set('Authorization', 'Bearer user-token').expect(400);
    });

    it('400 for malformed JSON', async () => {
      const res = await request(app)
        .post('/orders')
        .set('Authorization', 'Bearer user-token')
        .set('Content-Type', 'application/json')
        .send('{"items": [');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_JSON');
    });

    it('413 for an oversized body', async () => {
      const big = { items: [], pad: 'x'.repeat(200 * 1024) };
      await request(app).post('/orders').set('Authorization', 'Bearer user-token').send(big).expect(413);
    });

    it('502 when the payment gateway fails, with a safe error body', async () => {
      gateway.charge.mockRejectedValueOnce(new Error('secret internal detail'));
      const res = await request(app)
        .post('/orders')
        .set('Authorization', 'Bearer user-token')
        .send({ items: [{ priceInPaise: 100, qty: 1 }] });
      expect(res.status).toBe(502);
      expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
      expect(repo._rows.size).toBe(0);
    });
  });

  describe('GET /orders/:id', () => {
    it('owner can read, other user gets 404, admin can read', async () => {
      const created = await request(app)
        .post('/orders')
        .set('Authorization', 'Bearer user-token')
        .send({ items: [{ priceInPaise: 100, qty: 1 }] });
      const id = created.body.id;

      await request(app).get(`/orders/${id}`).set('Authorization', 'Bearer user-token').expect(200);
      await request(app).get(`/orders/${id}`).set('Authorization', 'Bearer other-token').expect(404);
      await request(app).get(`/orders/${id}`).set('Authorization', 'Bearer admin-token').expect(200);
    });

    it('400 for a non numeric id', async () => {
      await request(app).get('/orders/abc').set('Authorization', 'Bearer user-token').expect(400);
    });
  });

  describe('authorization', () => {
    it('403 for a normal user on an admin route, 204 for admin', async () => {
      await request(app).delete('/admin/orders/1').set('Authorization', 'Bearer user-token').expect(403);
      await request(app).delete('/admin/orders/1').set('Authorization', 'Bearer admin-token').expect(204);
    });
  });

  it('404 JSON for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('500 error body never leaks internals', async () => {
    const brokenService = { placeOrder: async () => { throw new Error('db password is hunter2'); } };
    const badApp = createApp({ orderService: brokenService, verifyToken: (t) => tokens[t] ?? null });
    const res = await request(badApp)
      .post('/orders')
      .set('Authorization', 'Bearer user-token')
      .send({ items: [] });
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });
});
```

**Integration tests with a REAL MySQL** `[ESSENTIAL]` for mid roles

The above uses an in-memory fake repo (route level). For true integration confidence, run the repository
against a real MySQL 8 test database (Docker container `mysql:8`, or the CI service container). Pattern:

```js
// test/orderRepo.int.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mysql from 'mysql2/promise';
import { createOrderRepo } from '../src/orders/orderRepo.js';

let pool;
let repo;

beforeAll(async () => {
  pool = mysql.createPool({
    host: process.env.TEST_DB_HOST ?? '127.0.0.1',
    user: process.env.TEST_DB_USER ?? 'root',
    password: process.env.TEST_DB_PASSWORD ?? 'root',
    database: process.env.TEST_DB_NAME ?? 'orders_test', // ALWAYS a dedicated test database
    connectionLimit: 5,
  });
  repo = createOrderRepo(pool);
});

afterAll(async () => {
  await pool.end(); // otherwise the process hangs: open handle
});

beforeEach(async () => {
  // Clean slate per test. TRUNCATE is fast; FK checks off just for the cleanup.
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE orders');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
});

describe('orderRepo (real MySQL)', () => {
  it('persists and reads back an order', async () => {
    const created = await repo.create({ userId: 1, items: [], subtotal: 100, tax: 18, total: 118, paymentRef: 'p1', status: 'PAID' });
    const found = await repo.findById(created.id);
    expect(found.total).toBe(118);
  });
});
```

Safety rules for DB tests:
- Use a **separate database name** and add a guard: `if (!dbName.endsWith('_test')) throw ...`. Developers
  have wiped production by running tests with the wrong `.env`.
- Truncate per test, OR wrap each test in a transaction and `ROLLBACK` (faster, but does not work if the code under
  test opens its own transactions via another pooled connection).
- Run DB test files serially if they share one database (`--no-file-parallelism` or `poolOptions`), or give
  each worker its own schema.
- Always `pool.end()` in `afterAll`.

**Frontend connection**

Supertest = React Testing Library's `render` + `userEvent`: you interact via the public surface (HTTP verbs
and JSON), then assert on what a client would see. MSW is the mirror image: it fakes the server for the frontend;
here we fake the third parties for the backend.

**Real-world scenario**

Banking transfer API: integration test "POST /transfers with insufficient balance returns 422 and both account
balances are unchanged" (real DB, real transaction). A unit test with mocks cannot prove the rollback worked.

**Interview answer:**
"For API tests I export the Express app as a factory, separate from the listen call, and drive it with
Supertest. That exercises routing, middleware, validation, authentication and the error handler in one go.
For persistence code I run integration tests against a real MySQL test database that is cleaned between tests,
because mocks can't prove that my SQL, constraints or transactions behave correctly."

**Follow-up questions**

- *Why separate app and server?* So tests can import the app without binding a port, and so the process lifecycle
  (listen, shutdown) stays in one composition root.
- *How do you authenticate in tests?* Either mint a real JWT with a test secret, or inject a fake
  `verifyToken`. Minting a real token also tests the real verification middleware.
- *How do you test file uploads?* `.attach('file', Buffer.from('abc'), 'a.txt')` or a fixture path.
- *How do you keep cookies/session across calls?* `request.agent(app)` stores cookies.
- *How do you run tests in CI with MySQL?* Service container (`mysql:8`) in GitHub Actions or docker compose, wait
  for healthcheck, run migrations, then `vitest run`. Testcontainers is the programmatic alternative.
- *Test hangs after finishing, why?* Open handle: pool not ended, Redis connection not closed, server still
  listening, timers. Close everything in `afterAll`.

**Common mistakes**

- `app.listen()` inside the app module.
- Running tests against the dev or prod database.
- Tests depending on seed data left by a previous test.
- Not asserting the response body shape, only the status code.
- Forgetting to `await` the Supertest chain (the test ends before the request).

**Revision notes**

- Factory `createApp(deps)`, listen only in `server.js`.
- Supertest: `.set()`, `.send()`, `.expect()`; `request.agent` for cookies.
- Real DB for repositories, dedicated test DB, clean between tests, `pool.end()`.

### 1.6 Negative testing and test design `[ESSENTIAL]`

**Concept**

Negative test = jaan-boojhkar galat input dena aur check karna ki system gracefully fail hota hai
(proper status code, proper message, koi side effect nahi). Real users (aur attackers) galat input bhejte hain.

**Template: the negative test table for any endpoint**

| Category | Example for `POST /orders` | Expected |
|----------|----------------------------|----------|
| Missing auth | no header | 401 |
| Bad auth | expired/forged token | 401 |
| Wrong role | user hits admin route | 403 |
| Not your resource | read another user's order | 404 (or 403, be consistent) |
| Missing field | `{}` | 400 |
| Wrong type | `qty: "2"` | 400 |
| Boundary | `qty: 0`, `qty: 101`, price `-1` | 400 |
| Malformed body | invalid JSON | 400 |
| Oversized body | 200 KB | 413 |
| Duplicate | same idempotency key twice | same response, no double charge |
| Dependency failure | gateway throws | 502, no order row |
| Unknown route/method | `PATCH /orders` | 404/405 |

**Arrange - Act - Assert** keeps a test readable: set up data, perform one action, assert outcome. One reason
to fail per test; descriptive names ("returns 404 when order belongs to another user").

**Coverage, honestly**

Coverage tells you what code was never executed, not whether it is correct. 80 percent of well-chosen tests beats
100 percent of assertion-free tests. Use coverage to find untested branches (especially error paths), not as a goal.

**Flaky tests**: causes are shared state, real timers/sleeps, real network, random data without a seed,
time-of-day. Fix by isolation, fake timers, injecting the clock and fakes.

**Interview answer:**
"For every endpoint I write the happy path plus negative cases: unauthenticated, unauthorized, invalid
input at boundaries, malformed JSON, not-found, duplicates, and dependency failures. Negative tests verify
the status code, the error shape, and importantly that no unintended side effect happened, such as a charge or a
DB write."

**Follow-up questions**

- *What is a good test?* Fast, deterministic, independent, tests behavior, fails for one clear reason, readable.
- *TDD?* Write a failing test, make it pass, refactor. Useful for bug fixes: write the failing reproduction first.
- *How do you test a bug fix?* Reproduce with a failing test first, then fix, so it never regresses.
- *Snapshot tests for APIs?* Use sparingly; they hide intent and get blindly updated. Prefer explicit assertions.

**Common mistakes**

- Testing only the happy path.
- Asserting only on status code, missing the leaked stack trace in the body.
- Hard-coded sleeps in tests.
- Tests that need a specific execution order.

**Revision notes**

- Negative table: auth, role, ownership, validation, boundaries, malformed, oversize, duplicate, dependency failure.
- Assert no side effect on failure paths.
- Coverage finds gaps, it does not prove quality.

### Day 1 wrap-up

**Key concepts to remember**

- Test pyramid: many unit, some integration, few E2E.
- Test behavior and risk (money, auth, validation, errors, transactions), not framework internals.
- `createApp(deps)` factory + Supertest; `listen` only in `server.js`.
- Mock at boundaries via dependency injection; stub/mock/spy/fake vocabulary.
- Real DB for integration tests, dedicated test DB, cleaned per test, `pool.end()`.
- Vitest vs Jest: same API, `vi` vs `jest`, ESM friendlier in Vitest.

**Five revision questions**

1. Explain the test pyramid and name one bug that only an integration test would catch.
2. Difference between a mock, a stub, a spy and a fake?
3. Why must `app` and `listen()` be in different files for Supertest?
4. List six negative test cases for `POST /orders`.
5. Your test suite passes but the process never exits. What do you check?

(Model answers for the daily revision questions of Days 1 to 6 are in section 7.3 of the Day 7 notes. Try to
answer from memory first.)

**Practical coding task** (see also `EX-TEST-01` in `11_Coding_Exercises.md`)

Add `PATCH /orders/:id/cancel` to the demo app. Rules: only the owner or an admin can cancel; only orders with
status `PAID` can be cancelled (else 409 `INVALID_STATE`); cancelling calls `paymentGateway.refund`. Write
the unit tests (service) and Supertest tests including at least five negative cases. Target: all green and
branch coverage of the new code above 90 percent.

**Self-assessment checklist**

- [ ] I can explain unit vs integration vs E2E with an example for each.
- [ ] I can write a Vitest test with `vi.fn`, `mockResolvedValue` and `mockRejectedValueOnce`.
- [ ] I can test an Express route with Supertest including auth headers.
- [ ] I can list the negative cases for a typical endpoint.
- [ ] I know why a real test database is used for repository tests.
- [ ] I can map `jest.fn` / `jest.mock` to `vi.fn` / `vi.mock`.

---

## Day 2 - Logging with pino, structured errors, correlation IDs (Day 37)

**Learning objectives**

By the end of today you should be able to:
1. Explain why production logs must be structured JSON, and what each log level means.
2. Configure pino (levels, redaction, error serializer) and pino-http for request logs.
3. Separate operational errors from programmer errors and log each error exactly once.
4. Implement request correlation IDs using `AsyncLocalStorage` so every log line of a request carries the same id.
5. Propagate the correlation id to outgoing HTTP calls and background jobs.
6. Say what must never be logged (passwords, tokens, card numbers, PII).

Suggested time: 20 min concept notes, 35 min pino setup, 45 min AsyncLocalStorage correlation, 20 min errors and tests.

### 2.1 Why structured logging, levels, what to log `[ESSENTIAL]`

**Concept**

`console.log("user created " + id)` sirf insaan ke padhne ke liye hai. Production mein lakhs of lines aati
hain aur tumhe search karna hota hai: "is user ke saare errors dikhao last 10 minutes mein". Isliye logs
**structured** hone chahiye: har line ek JSON object, jisme fixed fields hon (`level`, `time`, `msg`,
`requestId`, `userId`, `durationMs`). Log tools (CloudWatch, ELK, Datadog, Loki) in fields pe query kar sakte hain.

```json
{"level":"info","time":"2025-03-01T10:15:30.123Z","service":"orders-api","requestId":"7f3c...","userId":42,"msg":"order placed","orderId":9981,"totalPaise":23600}
```

**Why it matters**

Production issue ke time tumhare paas sirf logs hote hain (debugger attach nahi kar sakte). Achhe logs =
15 minute mein root cause; kharab logs = 3 ghante ka guesswork. Interviewers "how do you debug production?" ka
pehla jawab "logs, with a correlation id" sunna chahte hain.

**Log levels** (pino numeric values in brackets)

| Level | When | Example |
|-------|------|---------|
| fatal (60) | Process cannot continue | DB unreachable at boot, uncaught exception |
| error (50) | An operation failed, needs attention | Payment gateway 500, unhandled exception in a request |
| warn (40) | Unexpected but handled, may become a problem | Retry attempt 2 of 3, slow query, deprecated usage |
| info (30) | Normal significant events | Server started, order placed, request completed |
| debug (20) | Developer detail, off in prod | SQL text, cache hit/miss |
| trace (10) | Extremely verbose | Per-iteration details |

Production default is `info`; you can flip to `debug` per environment (or temporarily per instance) via
`LOG_LEVEL` without changing code.

**What to log**

- Request completion: method, route (pattern, not raw URL with ids), status, duration, requestId, userId.
- Business events: order placed, payment captured, refund issued (with ids, amounts as integers).
- Every error ONCE with stack and context.
- Outgoing calls to third parties: target, duration, status, attempt number.
- Startup config summary (non-secret) and shutdown events.

**What NEVER to log** `[ESSENTIAL]`

Passwords, password hashes, JWTs/refresh tokens, API keys, full card numbers/CVV, OTPs, Aadhaar/PAN or other
sensitive identifiers, full request bodies of auth/payment endpoints, `Authorization` and `Cookie` headers.
Logs are copied to many systems with weaker access control than your DB; a leaked log is a data breach.
Use **redaction** (below) as a safety net, but the primary rule is: do not put secrets in log objects.

**Frontend connection**

Frontend mein tum Sentry/LogRocket ya `console.error` use karte ho. Backend equivalent: structured logs +
error tracker (Sentry works on Node too). `requestId` = Sentry's event id/trace id that lets you stitch a user
complaint ("it failed at 10:15") to the exact server events.

**Real-world scenario**

Customer: "mera payment kat gaya par order nahi dikha." Support gives the time and user id. You search
`userId:42 AND level:error` in the last hour, find `requestId=abc`, then search `requestId:abc` and see the
whole chain: order created, gateway charged, DB insert failed with deadlock, retry exhausted. Without a request id you
would have to guess which of 5,000 lines per minute belong together.

**Interview answer:**
"In production I use structured JSON logging with pino, written to stdout and shipped by the platform to a
log aggregator. Every line carries a request correlation id, and I log request completion with status and
duration, business events, and errors with stack traces exactly once. I use levels deliberately, redact
secrets such as authorization headers and passwords, and never log tokens or card data."

**Follow-up questions**

- *Why stdout and not log files?* Twelve-factor: the app emits an event stream; the platform (Docker, systemd,
  Kubernetes, PM2) captures and ships it. App-managed rotation and file paths add complexity.
- *console.log vs a logger?* console.log is unstructured, has no levels, and no context binding (and can be
  synchronous for some destinations). A logger gives levels, JSON, redaction, child loggers and speed.
- *Logs vs metrics vs traces?* Logs are discrete events (high detail, high cost). Metrics are numeric
  time series (cheap, good for alerting: error rate, p95 latency). Traces show a request's path across services.
  They complement each other (more in Week 7 / Day 5).
- *How do you avoid log volume explosion?* Correct levels, no debug in prod, sample noisy success logs, do not log in
  tight loops, set retention.

**Common mistakes**

- Logging secrets or whole request bodies.
- Logging the same error at every layer (service logs, controller logs, handler logs): 3 lines per failure, noise.
- String concatenation instead of fields (`"user " + id` cannot be queried reliably).
- Using `error` level for expected client mistakes (400s): this triggers false alerts. Use `info`/`warn`.
- Logging raw URLs with ids as the "route", which explodes cardinality; log the route pattern (`/orders/:id`).

**Revision notes**

- Structured JSON to stdout, fields not sentences.
- Levels: fatal, error, warn, info, debug, trace; prod = info.
- Never log secrets/PII; redact as a safety net; log each error once.

### 2.2 pino: setup, redaction, child loggers `[ESSENTIAL]`

**Concept**

pino Node.js ka sabse popular fast JSON logger hai. Pehle samjho ye fast kyu hai (internal working).

**Internal working**

- pino builds the JSON string with optimized serialization and writes it with `sonic-boom`, a fast buffered
  stream writer to `process.stdout` / a file.
- It does minimal work in the request path: no colors, no pretty printing, no heavy transports by default. Pretty
  printing (`pino-pretty`) and shipping are meant to be done in a **separate process/stream** (pipe), not
  in your app. In dev: `node src/server.js | npx pino-pretty`. In prod: raw JSON.
- Child loggers (`logger.child({ orderId })`) share the parent's stream and just prepend bound fields, so they
  are cheap.
- Level check is a cheap numeric comparison: `logger.debug(...)` when level is `info` does almost nothing.
  Still avoid building expensive objects before the call in hot paths.

`src/logger.js`:

```js
import pino from 'pino';
import { getContext } from './context.js';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'orders-api', env: process.env.NODE_ENV ?? 'development' }, // fixed fields on every line
  timestamp: pino.stdTimeFunctions.isoTime,                                   // readable ISO time
  formatters: {
    level: (label) => ({ level: label }),                                     // "info" instead of 30
  },
  // Secrets that might appear in objects we log. Paths use fast-redact syntax.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.cardNumber',
    ],
    censor: '[REDACTED]',
  },
  // mixin() runs on EVERY log call and its result is merged into the line.
  // This is how the correlation id is added without passing a logger around.
  mixin() {
    const ctx = getContext();
    return ctx ? { requestId: ctx.requestId, userId: ctx.userId } : {};
  },
});
```

Usage:

```js
import { logger } from './logger.js';

logger.info({ orderId: 9981, totalPaise: 23600 }, 'order placed');   // object FIRST, message second
logger.warn({ attempt: 2, maxAttempts: 3 }, 'payment gateway retry');

try {
  await doSomething();
} catch (err) {
  logger.error({ err, orderId: 9981 }, 'failed to place order');       // use the key "err" -> stack serialized
}

const orderLogger = logger.child({ orderId: 9981 });                    // bound context
orderLogger.info('charging card');
```

**Important pino gotchas**

- Argument order is `(mergingObject, message)`. `logger.info('msg', obj)` does not do what you think.
- The key `err` is serialized with the standard error serializer (type, message, stack, cause). If you
  name it `error` or `e`, you may get `{}`. Use `err`.
- Redaction only masks the configured paths. It does not detect secrets in free text. Do not rely on it as the only defense.
- Never call `logger.info(req)` for the whole request: huge and may include secrets. Use pino-http serializers.

**pino-http for request logs**

`src/middleware/httpLogger.js`:

```js
import pinoHttp from 'pino-http';
import { logger } from '../logger.js';

export const httpLogger = pinoHttp({
  logger,
  // requestContext (2.4) already created a validated id on req.id; reuse it here.
  genReqId: (req) => req.id,
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),   // no headers: smaller + safer
    res: (res) => ({ statusCode: res.statusCode }),
  },
  autoLogging: { ignore: (req) => req.url === '/health' },              // do not spam health checks
});
```

`pino-http` logs one line when each response finishes, with `responseTime` in ms. Accepting any incoming
`x-request-id` blindly allows **log injection** (newlines, huge strings); we validate format and length in 2.4.

**Frontend connection**

Child logger = React Context for logging: you bind data once (`orderId`) and everything below inherits it,
without prop drilling. `mixin()` + AsyncLocalStorage goes further: no need to pass the logger at all.

**Real-world scenario**

Marketplace seller dashboard is slow. In pino-http lines you filter `res.statusCode:200` and sort by
`responseTime` descending, grouped by route. You discover `GET /seller/reports` has p95 of 4 seconds, which
tells you where to profile (Day 6).

**Interview answer:**
"I use pino because it is fast: it writes JSON with minimal work on the hot path and leaves pretty-printing and
shipping outside the process. I set the level from an environment variable, add base fields like service
name, redact authorization headers and password fields, and use pino-http to log one line per request with
status and duration. I log errors under the `err` key so the stack trace is serialized properly."

**Follow-up questions**

- *Why is pino faster than winston?* It does less per call: no formatting, no transport pipeline in the main
  thread by default, optimized JSON serialization, and buffered writes via sonic-boom.
- *Is logging blocking?* stdout writes can block if the consumer is slow (pipes vs files behave differently by
  platform). Buffering reduces the cost; for extreme volume use a transport in a worker thread
  (`pino.transport`). On abrupt exit, buffered logs may be lost: flush/exit cleanly on shutdown (Day 5).
- *How do you change log level without redeploy?* Environment variable on restart, or an admin endpoint setting
  `logger.level = 'debug'` for a limited time (protect it).
- *Where do you use `child`?* For per-job or per-entity context, e.g. in a worker: `logger.child({ jobId })`.

**Common mistakes**

- `logger.info('x', obj)` argument order wrong.
- Logging `error` instead of `err`.
- Pretty-printing in production (slower, hard to parse).
- Logging full `req` objects (secrets, size).
- Not validating incoming `x-request-id`.

**Revision notes**

- pino = JSON, fast, stdout; pretty only in dev.
- `logger.info({ fields }, 'message')`, `err` key for errors, `child()` for bound context.
- `redact` + `mixin()`; pino-http for access logs.

### 2.3 Structured error handling: operational vs programmer errors `[ESSENTIAL]`

**Concept**

Sab errors ek jaise nahi hote. Do category:

- **Operational errors**: expected runtime problems. Invalid input, resource not found, DB timeout, third-party
  down, duplicate key. Handle: map to a proper HTTP status, return a safe message, maybe retry.
- **Programmer errors**: bugs. `undefined is not a function`, wrong argument, null dereference. You cannot
  "handle" them meaningfully at runtime; log, return a generic 500, and fix the code. For uncaught ones at
  process level, the safest action is to log and restart (let the process manager bring a clean process).

**Why it matters**

Interviewers ask "how do you handle errors in Express?" The strong answer: typed errors with a stable `code`,
one centralized error handler, one log per error, safe client messages, and a policy for process-level
failures.

**Internal working**

- Express 5 forwards synchronous throws AND rejected promises from handlers/middleware to the error-handling
  middleware (4 args). Express 4 forwards synchronous throws only; async errors need `next(err)` or a wrapper
  (or the `express-async-errors` package). This is a very common interview point.
- The error handler is the single place that maps error -> HTTP response and logs it. Lower layers throw
  (with `cause`), they do not log-and-rethrow. That avoids duplicate log lines.
- `Error` has a `cause` option (ES2022, Node 16.9+): `new Error('msg', { cause: err })`. pino's serializer
  prints the cause chain.

Error handler with logging (extends Day 1's version):

```js
// src/middleware/errorHandler.js
import { AppError } from '../errors.js';
import { logger } from '../logger.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let body = { code: 'INTERNAL', message: 'Something went wrong' };

  if (err.type === 'entity.parse.failed') {
    status = 400; body = { code: 'INVALID_JSON', message: 'Malformed JSON body' };
  } else if (err.type === 'entity.too.large') {
    status = 413; body = { code: 'PAYLOAD_TOO_LARGE', message: 'Body too large' };
  } else if (err instanceof AppError) {
    status = err.status;
    body = { code: err.code, message: err.message, details: err.details };
  } else if (err.code === 'ER_DUP_ENTRY') {              // mysql2 error code
    status = 409; body = { code: 'CONFLICT', message: 'Resource already exists' };
  }

  // Log level follows severity: 5xx is our fault -> error with stack; 4xx is the client's -> warn, no stack.
  if (status >= 500) {
    logger.error({ err }, 'request failed');          // requestId comes from the logger mixin
  } else {
    logger.warn({ code: body.code, status }, 'request rejected');
  }

  res.status(status).json({ error: { ...body, requestId: req.id } });
}
```

Returning `requestId` in the error body is a great practice: the user can quote it to support.

Process-level safety net:

```js
// src/server.js (excerpt)
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandledRejection');
  // Since Node 15 the default is to raise it as an uncaught exception (process exits).
  // We log first, then run our shutdown logic and exit non-zero.
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  shutdown('uncaughtException', 1);   // state may be corrupt: do not keep serving
});
```

(`shutdown` is written on Day 5.) Reason: after an uncaught exception your process may be in an inconsistent
state (half-updated in-memory structures, leaked locks). Best practice: log, stop accepting work, exit non-zero,
and have PM2/systemd/Kubernetes restart it. Do NOT "catch everything and carry on".

**Frontend connection**

React Error Boundary = Express centralized error handler: one place catches rendering/handler errors and shows
a fallback. Operational vs programmer error is the same as "expected API error (show toast)" vs "bug (send to Sentry,
show crash screen)".

**Real-world scenario**

Payments: gateway returns "card declined" -> operational, map to 402/422 with a user-friendly message, log at
`warn`. Null pointer in the receipt generator -> programmer error, 500 generic, `error` log with stack, alert
fires, developer fixes. Mixing these up means either users see stack traces or on-call is paged for typos in
the card number.

**Interview answer:**
"I distinguish operational errors, like validation failures or a downstream timeout, from programmer errors,
which are bugs. I throw typed errors with a status and stable error code from services, and I have a single
centralized Express error handler that maps them to safe responses, logs each failure once with the stack at
the right level, and includes the request id in the response. For uncaught exceptions and unhandled rejections
I log and shut down gracefully so the process manager restarts a clean process, rather than continuing in an
unknown state."

**Follow-up questions**

- *Express 4 vs 5 async errors?* Express 5 catches rejected promises from async handlers; in 4 you must call
  `next(err)` or wrap handlers.
- *Why not try/catch in every controller?* Duplication and inconsistent responses; a central handler is DRY. Use
  try/catch only when you can actually recover or add context.
- *Where do you log: where thrown or where handled?* Where handled (the boundary), exactly once. Throwers add context
  via `cause`.
- *Should you return the error message to the client?* Only for errors you created and vetted (AppError). Unknown
  errors get a generic message.
- *What if the error happens after headers are sent?* You cannot change status; delegate to Express's default
  handler which closes the connection (`res.headersSent` check).

**Common mistakes**

- Swallowing errors with empty `catch {}`.
- `catch (e) { throw e }` with no added value, or `catch (e) { logger.error(e); throw e }` at each layer.
- Returning `err.stack` or SQL error messages to clients (information disclosure, helps attackers).
- Catching `uncaughtException` and continuing.
- 500 for client mistakes, or 200 with `{ success: false }`.

**Revision notes**

- Operational vs programmer errors.
- AppError(status, code, message, details, { cause }); one central handler; log once.
- 5xx = error + stack, 4xx = warn. Include `requestId` in error body.
- Uncaught -> log, graceful exit, restart.

### 2.4 Request correlation IDs with AsyncLocalStorage `[ESSENTIAL]` (mechanism `[ADVANCED]`)

**Concept**

Ek server ek time pe hazaaron requests handle karta hai, aur unki log lines aapas mein mix ho jaati hain
(Node ek hi thread pe async code interleave karta hai). **Correlation ID** = har request ko ek unique id do,
aur us request ke har log line mein wahi id chipka do. Fir `requestId=abc` search karke ek request ki poori
kahani mil jaati hai.

Problem: id ko har function ko argument mein pass karna (`placeOrder(id, ...)`, `charge(id, ...)`,
`repo.insert(id, ...)`) ugly hai. Solution: **AsyncLocalStorage** (ALS), jo "thread-local storage" ka Node
equivalent hai: ek context jo request ke saath async calls ke through automatically travel karta hai.

**Why it matters**

Correlation ids are the foundation of debugging concurrent and distributed systems. ALS is the standard
Node mechanism (used by APM tools, OpenTelemetry, Sentry). "How do you trace one request across logs?" is a
very common interview question.

**Internal working**

- `AsyncLocalStorage` lives in `node:async_hooks` and is stable since Node 16. `als.run(store, fn)`
  runs `fn` with `store` as the current context. Any promise, timer, callback or I/O callback created
  **during** `fn` (transitively) sees the same store via `als.getStore()`, even after `await`s.
- Mechanism: Node tracks which async resource caused each continuation (promise reactions, timers,
  callbacks) and propagates the store from creator to continuation. The implementation is version-dependent:
  in Node 20/22 it is built on async hooks / promise hooks; newer Node versions moved the default to
  `AsyncContextFrame`, which is faster, but the public API is unchanged. Say "stable API, internals vary
  by Node version" if asked.
- Cost: small overhead per async operation; acceptable for request-scoped context. Use one ALS instance and a
  small store object.
- It does NOT magically work with everything: libraries that queue callbacks internally (some old
  connection pools, event emitters whose listeners were registered in a different context) can lose or mix up
  context. Test it. Use `AsyncLocalStorage.bind(fn)` or `AsyncResource.bind(fn)` to rebind a callback to the
  current context when needed.

`src/context.js`:

```js
import { AsyncLocalStorage } from 'node:async_hooks';

const als = new AsyncLocalStorage();

export function runWithContext(store, fn) {
  return als.run(store, fn);
}

export function getContext() {
  return als.getStore(); // undefined outside of a request/job
}

export function getRequestId() {
  return als.getStore()?.requestId;
}
```

Middleware that opens the context (put it first, as soon as the request id is known):

```js
// src/middleware/requestContext.js
import { randomUUID } from 'node:crypto';
import { runWithContext } from '../context.js';

export function requestContext(req, res, next) {
  const incoming = req.get('x-request-id');
  const requestId =
    incoming && /^[A-Za-z0-9._-]{8,64}$/.test(incoming) ? incoming : randomUUID();

  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  // Everything downstream of next() runs inside this context, including awaited code.
  runWithContext({ requestId, userId: undefined }, next);
}
```

Then auth middleware enriches the same store object (mutating the store is how userId is added after login):

```js
import { getContext } from '../context.js';

export function requireAuth(req, res, next) {
  // ... verify token, set req.user ...
  const ctx = getContext();
  if (ctx) ctx.userId = req.user.id;   // every later log line now has userId too (via logger mixin)
  next();
}
```

Now any file can log without receiving a logger or id:

```js
// src/orders/orderRepo.js
import { logger } from '../logger.js';

export async function create(order) {
  logger.debug({ total: order.total }, 'inserting order'); // line automatically gets requestId, userId
  // ...
}
```

**Propagate to outgoing calls** (so the next service logs the same id):

```js
// src/lib/httpClient.js
import { getRequestId } from '../context.js';

export async function callGateway(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': getRequestId() ?? '',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000),   // timeouts: Day 3
  });
  return res;
}
```

**Propagate into background jobs** (Day 5): ALS context does NOT cross Redis. Put the id in the job payload, and
reopen the context inside the worker:

```js
// producer
await queue.add('send-receipt', { orderId, requestId: getRequestId() });

// worker
new Worker('email', async (job) => {
  return runWithContext({ requestId: job.data.requestId, jobId: job.id }, async () => {
    logger.info('processing job');       // correlated with the original HTTP request
    // ...
  });
}, { connection });
```

Test it (Vitest) to prove isolation under concurrency:

```js
import { it, expect } from 'vitest';
import { runWithContext, getRequestId } from '../src/context.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

it('keeps contexts isolated across interleaved async work', async () => {
  const seen = [];
  await Promise.all(
    ['A', 'B', 'C'].map((id, i) =>
      runWithContext({ requestId: id }, async () => {
        await sleep(30 - i * 10);          // finish in reverse order
        seen.push(getRequestId());
      }),
    ),
  );
  expect(seen.sort()).toEqual(['A', 'B', 'C']);   // each saw its own id, not someone else's
});
```

**Wiring order in `app.js`** (important): `requestContext` first, then the HTTP logger, then body parser,
routes, 404, error handler. If `express.json()` ran before the context was opened, body parsing errors
would be logged without the id.

```js
// src/app.js (new parts only)
import express from 'express';
import { requestContext } from './middleware/requestContext.js';
import { httpLogger } from './middleware/httpLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp({ orderService, verifyToken }) {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestContext);                  // 1. id + ALS context
  app.use(httpLogger);                      // 2. access logs, reuses req.id
  app.use(express.json({ limit: '100kb' })); // 3. body parsing

  // ... routes ...

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
  app.use(errorHandler);                    // last
  return app;
}
```

Test idea: send `x-request-id: abcd1234efgh`, capture log output (pino accepts a destination stream:
`pino({}, stream)`) and assert every line has that `requestId`.

**Frontend connection**

Think `React Context`, but for the async call tree of one request instead of the component tree of one render.
Or a trace id that your frontend generates and sends as a header: same idea, and the backend should accept and
reuse it. Difference: React context is explicit via Provider; ALS is implicit, so use it for observability, not
for business logic.

**Real-world scenario**

Checkout hits `orders-api`, which calls `payments-api`, then enqueues an email job. All three emit logs with
the same `requestId`. A user reports a failed checkout; support gives the `requestId` shown in the error
toast; you search once across services and see the full timeline, including that the email job retried twice.

**Interview answer:**
"I generate a UUID per request, or reuse a validated incoming x-request-id, store it in AsyncLocalStorage, and
have the logger's mixin attach it to every log line automatically so I do not need to thread it through
function arguments. I return it in the response header and in error bodies, forward it in headers of outgoing
HTTP calls, and include it in job payloads so background work stays correlated. ALS context propagates
across awaits, timers and callbacks created inside the request."

**Follow-up questions**

- *Correlation id vs trace id?* Similar idea. A correlation id is a simple string we propagate by convention;
  distributed tracing (OpenTelemetry, W3C `traceparent` header) adds span ids and timing hierarchy. In a larger
  system you adopt OpenTelemetry `[ADVANCED]`; it also relies on ALS/async context under the hood.
- *What if context is lost?* Typically a library queues callbacks outside the context. Fix: `AsyncLocalStorage.bind(fn)`
  or `AsyncResource.bind`, or pass the id explicitly at that boundary.
- *Does ALS work across worker_threads or cluster?* Each thread/process has its own ALS; propagate by message.
- *Performance impact?* Small; measurable only at extreme throughput. Keep the store tiny.
- *Why not a global variable like `currentRequestId`?* Concurrency: another request would overwrite it between
  awaits. A global is a race; ALS is per async call chain.

**Common mistakes**

- Storing the id in a module-level variable.
- Calling `als.enterWith()` carelessly (it leaks context to the rest of the current execution); prefer `run()`.
- Opening the context after body parsing or after the logger middleware.
- Trusting an unvalidated incoming id (log injection) or using it as a security token.
- Forgetting that ALS does not cross process boundaries (Redis, queues, HTTP): you must send the id yourself.

**Revision notes**

- ALS = per-async-chain storage. `run(store, fn)`, `getStore()`. Stable since Node 16, internals vary per version.
- Logger `mixin()` reads ALS, so all lines carry `requestId`.
- Return the id to client, forward to downstream calls and jobs.

### Day 2 wrap-up

**Key concepts to remember**

- Structured JSON logs to stdout; levels; fields not sentences; log each error once.
- pino: fast, `redact`, `err` key, `child`, `mixin`; pino-http for access logs; pretty only in dev.
- Operational vs programmer errors; AppError with stable codes; central handler; 5xx error, 4xx warn.
- AsyncLocalStorage gives implicit per-request context; correlation id in logs, headers, jobs.
- Never log secrets or PII.

**Five revision questions**

1. Why structured logs instead of `console.log` strings? Give two example queries they enable.
2. What is an operational error versus a programmer error, and how is each handled?
3. How does AsyncLocalStorage keep two concurrent requests' ids separate? Why not a global variable?
4. Where does the correlation id travel (list four places) and where does ALS context NOT propagate?
5. What should an uncaught exception handler do, and why not just continue?

**Practical coding task** (see `EX-ERR-01`, `EX-DEBUG-01`)

Add correlation IDs to `orders-api`: `requestContext` middleware, pino with `mixin`, pino-http reusing `req.id`,
and a function `callGateway` that forwards `x-request-id`. Write a Vitest test using a custom pino destination
stream that fires 20 concurrent Supertest requests with different `x-request-id` headers and asserts that each
log line's `requestId` matches its own request (no mixing).

**Self-assessment checklist**

- [ ] I can write a pino config with level, base, redact and mixin from memory.
- [ ] I can explain why logs are JSON and what `requestId` solves.
- [ ] I can implement `requestContext` middleware with AsyncLocalStorage.
- [ ] I know the Express 4 vs 5 async error difference.
- [ ] I can list what must never be logged.
- [ ] I know the context is lost across Redis/HTTP and must be sent explicitly.

---

## Day 3 - Timeouts, retries, exponential backoff with jitter, idempotency, duplicate prevention (Day 38)

**Learning objectives**

By the end of today you should be able to:
1. Explain why every network call needs a timeout, and set timeouts at the right layers (fetch, DB, HTTP server).
2. Decide what is safe to retry, and implement retry with exponential backoff and jitter.
3. Explain retry storms, retry budgets and circuit breakers at interview level.
4. Define idempotency, say which HTTP methods are idempotent, and explain idempotency keys.
5. Implement an idempotency-key mechanism using a MySQL UNIQUE constraint, including the concurrent and crash cases.
6. List other duplicate-request defenses (unique constraints, locking, optimistic concurrency, UI guards).

Suggested time: 25 min timeouts, 35 min retry + tests, 50 min idempotency implementation, 10 min duplicate-prevention summary.

### 3.1 Timeouts `[ESSENTIAL]`

**Concept**

Timeout = "itni der tak wait karunga, uske baad haar maan lunga." Bina timeout ke ek slow downstream service
tumhari requests ko bahut der latka sakti hai. Node mein har pending request memory + ek socket + shayad ek DB
connection pakad ke rakhti hai. Thodi der mein pool khatam, server unresponsive.

**Why it matters**

"What happens if the payment API hangs?" interview ka classic sawal hai. Answer: timeout + retry policy +
idempotency + circuit breaker. `fetch` (undici) ke internal default timeouts bahut lambe hain (around 300 seconds
for headers/body), so practically "no timeout" for a web request. You must set your own.

**Internal working**

- `AbortSignal.timeout(ms)` (Node 17.3+, so fine on 20/22) creates a signal that aborts after `ms` with a
  `TimeoutError` `DOMException`. Its timer does not keep the process alive. `fetch` rejects when the signal aborts, and undici
  tears down the request.
- `AbortSignal.any([a, b])` (Node 20.3+) combines signals, e.g. "user cancelled OR timeout".
- A timeout only stops YOUR waiting. The remote side may still complete the operation. If you time out on a
  payment, the charge may have succeeded. That fact is the bridge between timeouts, retries and idempotency.

Layers, outermost to innermost (each inner timeout must be shorter than the one outside it):

| Layer | Setting | Notes |
|-------|---------|-------|
| Client / browser | fetch timeout, e.g. 30s | The user's patience |
| Load balancer / reverse proxy | nginx `proxy_read_timeout`, ALB idle timeout (60s default) | Returns 504 to the client |
| Node HTTP server | `server.requestTimeout` (default 300s in Node 18+), `headersTimeout` (60s), `keepAliveTimeout` (5s) | Protect against slow clients (slowloris) |
| Your handler | overall deadline for the request | Optional, via AbortSignal |
| Outbound HTTP | `AbortSignal.timeout(ms)` per call | 1-5s typical, be specific |
| Database | pool `connectTimeout`, per query `timeout` option, MySQL `max_execution_time` for SELECT | Prevent runaway queries |
| Pool acquisition | `queueLimit`, `waitForConnections` | Fail fast instead of queueing forever |

Server-side settings:

```js
// src/server.js (excerpt)
const server = app.listen(port);

// Behind an AWS ALB (idle timeout 60s) Node's keep-alive MUST be longer than the ALB idle timeout, otherwise the
// ALB reuses a socket Node just closed and you get random 502s. Node's default keepAliveTimeout is only 5000 ms.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;   // commonly set slightly above keepAliveTimeout (check the docs of your Node version)
server.requestTimeout = 120_000;  // max time to receive the ENTIRE request from the client (default 300s); keep >= headersTimeout
```

Version note: `requestTimeout` was introduced with a 0 (disabled) default and changed to 300000 ms in Node 18;
Node 20/22 keep 300s. Treat the numbers as examples and verify in the docs of your Node version. The important
idea: the proxy's idle timeout must be SHORTER than Node's keepAliveTimeout.

Outbound HTTP and DB:

```js
// src/lib/httpClient.js
export async function postJson(url, body, { timeoutMs = 3000, headers = {} } = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;                                  // fetch does NOT throw on 4xx/5xx, we do
    const retryAfterSec = Number(res.headers.get('retry-after'));
    if (Number.isFinite(retryAfterSec)) err.retryAfterMs = retryAfterSec * 1000;
    throw err;
  }
  return res.json();
}
```

```js
// mysql2 per-query timeout (client side) and pool limits
const [rows] = await pool.query({ sql: 'SELECT SLEEP(10)', timeout: 2000 });
// fails with PROTOCOL_SEQUENCE_TIMEOUT after 2s. NOTE: this stops the client from waiting; the MySQL server may
// still run the query unless you also use max_execution_time (SELECT only) or KILL QUERY from another connection.
```

**Frontend connection**

Same as `fetch` with `AbortController` in React effects: you cancel stale requests and set a timeout so the UI
does not spin forever. The big difference: on the backend a missing timeout does not just annoy one user, it
exhausts shared resources (sockets, pool connections) for everyone.

**Real-world scenario**

Marketplace checkout calls a shipping-rate API. It starts responding in 40 seconds instead of 200ms. With no
timeout, each checkout request holds a DB connection and a socket for 40s, the pool of 10 connections empties
in seconds, and now even the home page (which needs the DB) times out. One slow dependency took down everything.
With a 2s timeout and a fallback ("show flat shipping rate"), checkout degrades gracefully.

**Interview answer:**
"Every outbound call gets an explicit timeout, because a hung dependency otherwise ties up sockets and database
connections and can cascade into a full outage. I use AbortSignal.timeout for fetch, connection and query
timeouts for the database, and I make inner timeouts shorter than outer ones. I also configure the HTTP server
timeouts and make sure keepAliveTimeout is longer than my load balancer's idle timeout. I remember that a
timeout only means I stopped waiting: the remote operation may still have succeeded, so retries need
idempotency."

**Follow-up questions**

- *How do you cancel a DB query?* A client timeout stops waiting but not the query; use MySQL
  `max_execution_time` (SELECT), or `KILL QUERY <thread_id>` from another connection, and prefer fixing the slow query.
- *What is a good timeout value?* Based on the dependency's observed p99 plus margin, usually a few seconds
  for APIs. Too low causes false failures, too high defeats the purpose.
- *What is a deadline/timeout budget?* The total time for a request is divided among its steps so the sum stays
  under the client's timeout (e.g. total 5s: DB 1s, gateway 2s, rest 2s).
- *Why random 502s from the load balancer?* Often Node's keepAliveTimeout (5s default) is shorter than the LB idle
  timeout, so the LB sends a request on a socket that Node just closed.

**Common mistakes**

- No timeout on outbound calls, or a global 60s timeout "to be safe".
- Inner timeout longer than the outer one (the client gave up long ago but you keep working).
- Assuming `fetch` throws on 500.
- Treating a timeout as proof that the operation failed.

**Revision notes**

- Timeout every outbound call: `AbortSignal.timeout`.
- Inner < outer; server timeouts; keepAlive > LB idle timeout.
- Timeout means "I stopped waiting", not "it did not happen".

### 3.2 Retries, exponential backoff and jitter `[ESSENTIAL]`

**Concept**

Retry = fail hone par dobara try karna. Network aur cloud mein temporary failures normal hain (packet drop,
pod restart, rate limit). Lekin blind retry khatarnak hai: wo ek struggling service pe aur load daalta hai.

Rules of thumb:

1. Retry only **transient** failures: timeouts, connection reset, 502/503/504, 429 (honoring `Retry-After`),
   deadlock (MySQL error 1213) / lock wait timeout (1205) for whole transactions.
2. Do NOT retry permanent failures: 400, 401, 403, 404, 422, business errors, "card declined".
3. Retry only **idempotent** operations (or non-idempotent ones that carry an idempotency key).
4. Limit attempts (2-4), cap the delay, add **jitter**.
5. Retry in ONE layer only. If the client, the gateway and the service each retry 3 times, 1 failure becomes 27 calls.

**Exponential backoff**: wait grows each attempt: `delay = base * 2^attempt` (100ms, 200ms, 400ms, 800ms...),
capped at a maximum. This gives the dependency room to recover.

**Jitter**: randomize the delay. Without it, 1,000 clients that failed at the same time all retry at the same
instants (t+100ms, t+300ms, ...) in synchronized waves: a **thundering herd / retry storm**. With **full jitter**,
each client sleeps a random time between 0 and the exponential ceiling, spreading the load.

```
no jitter, 1000 clients:    |#######|        |#######|           |#######|     (synchronized waves)
full jitter, 1000 clients:  |.:|||||::..:.:|||::...:.:::..                     (spread out)
```

Strategies:

| Name | Formula | Notes |
|------|---------|-------|
| Exponential, no jitter | `min(cap, base * 2^n)` | synchronized retries, avoid |
| Full jitter | `random(0, min(cap, base * 2^n))` | best spread; widely recommended (AWS architecture blog) |
| Equal jitter | `x/2 + random(0, x/2)` where `x = min(cap, base*2^n)` | guarantees some minimum wait |
| Decorrelated jitter | `min(cap, random(base, prev*3))` | good too, stateful |

**Why it matters**

Resilience is a top mid-level interview topic. Candidates who say "I will retry 3 times" without mentioning
idempotency, jitter or which errors to retry usually get a follow-up that exposes it.

**Internal working / code**

`src/lib/retry.js`:

```js
import { setTimeout as delay } from 'node:timers/promises';

const TRANSIENT_CODES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'EPIPE', 'UND_ERR_CONNECT_TIMEOUT',
  'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT',                      // mysql2 codes for errno 1213 and 1205
]);
const TRANSIENT_STATUS = new Set([429, 502, 503, 504]);

export function isRetryable(err) {
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return true;
  if (TRANSIENT_CODES.has(err?.code) || TRANSIENT_CODES.has(err?.cause?.code)) return true;  // fetch wraps socket errors in err.cause
  if (TRANSIENT_STATUS.has(err?.status)) return true;
  return false;
}

// Full jitter: random between 0 and min(cap, base * 2^attempt)
export function backoffDelay(attempt, { baseMs = 100, capMs = 5000, random = Math.random } = {}) {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(random() * ceiling);
}

export async function retry(fn, {
  retries = 3,                 // number of RETRIES after the first attempt (so up to retries + 1 calls)
  baseMs = 100,
  capMs = 5000,
  shouldRetry = isRetryable,
  sleep = delay,               // injectable: tests pass a fake, no real waiting
  random = Math.random,        // injectable: deterministic tests
  onRetry,
  signal,
} = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      // Respect the server's Retry-After if it sent one, else use backoff with jitter.
      const wait = err.retryAfterMs ?? backoffDelay(attempt, { baseMs, capMs, random });
      onRetry?.({ attempt: attempt + 1, waitMs: wait, err });
      await sleep(wait, undefined, { signal });
    }
  }
}
```

Usage with logging and a per-attempt timeout (each attempt gets a fresh timeout; total time is bounded by the retries):

```js
import { retry } from './lib/retry.js';
import { postJson } from './lib/httpClient.js';
import { logger } from './logger.js';

export function createPaymentGateway({ baseUrl }) {
  return {
    async charge({ userId, amountInPaise, idempotencyKey }) {
      return retry(
        () => postJson(`${baseUrl}/charges`, { userId, amountInPaise }, {
          timeoutMs: 3000,
          headers: { 'idempotency-key': idempotencyKey },   // makes the retry SAFE (see 3.3)
        }),
        {
          retries: 2,
          onRetry: ({ attempt, waitMs, err }) =>
            logger.warn({ attempt, waitMs, err: err.message }, 'payment gateway retry'),
        },
      );
    },
  };
}
```

Tests (no fake timers needed because `sleep` and `random` are injected):

```js
import { describe, it, expect, vi } from 'vitest';
import { retry, backoffDelay } from '../src/lib/retry.js';

describe('backoffDelay (full jitter)', () => {
  it('stays within 0..ceiling and the ceiling doubles up to the cap', () => {
    const max = (n) => backoffDelay(n, { baseMs: 100, capMs: 1000, random: () => 0.999999 });
    expect(max(0)).toBe(99);
    expect(max(1)).toBe(199);
    expect(max(2)).toBe(399);
    expect(max(5)).toBe(999);                 // capped at 1000
    expect(backoffDelay(3, { random: () => 0 })).toBe(0);
  });
});

describe('retry', () => {
  const sleep = vi.fn().mockResolvedValue(undefined);

  it('retries transient errors then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('x'), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'ECONNRESET' }))
      .mockResolvedValue('ok');

    await expect(retry(fn, { sleep, random: () => 0.5 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('does not retry permanent errors', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('bad'), { status: 400 }));
    await expect(retry(fn, { sleep })).rejects.toThrow('bad');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after the configured retries and throws the last error', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('down'), { status: 503 }));
    await expect(retry(fn, { retries: 2, sleep })).rejects.toThrow('down');
    expect(fn).toHaveBeenCalledTimes(3);       // 1 attempt + 2 retries
  });

  it('honors Retry-After over computed backoff', async () => {
    sleep.mockClear();
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('slow down'), { status: 429, retryAfterMs: 2000 }))
      .mockResolvedValue('ok');
    await retry(fn, { sleep });
    expect(sleep).toHaveBeenCalledWith(2000, undefined, { signal: undefined });
  });
});
```

**Beyond retries** `[ADVANCED]`

- **Retry budget**: allow retries only up to ~10 percent of normal traffic, so during an outage retries cannot
  multiply load by 3x.
- **Circuit breaker**: states CLOSED (normal), OPEN (fail fast without calling, after N consecutive failures or an
  error-rate threshold), HALF-OPEN (after a cool-down allow a few trial calls; success closes it). Protects the
  dependency and keeps your own latency low. Library: `opossum`. The idea is a small state machine with a
  failure counter and a timestamp.
- **Bulkhead**: separate pools/limits per dependency so one slow dependency cannot use all resources.
- **Fallback / graceful degradation**: cached data, default value, "try later" message.
- **Hedged requests**: send a second request if the first is slow; only for idempotent reads.

**Frontend connection**

React Query / SWR retries failed queries with exponential backoff (default 3 retries with growing delay). The
reasoning is identical. Backend difference: a client library retrying is bounded to one user's tab, while a
server retrying on behalf of 10,000 concurrent requests can DDoS its own dependency.

**Real-world scenario**

Payment service pod restarts during a deploy; for 3 seconds the gateway returns 503. Orders service uses 2 retries
with full jitter: most requests succeed on retry 1 or 2 and users notice nothing. Without jitter, thousands of
requests would hit the recovering pod at identical instants and knock it down again.

**Interview answer:**
"I retry only transient failures, such as timeouts, connection resets, 502/503/504, 429 with Retry-After, and
database deadlocks, and never validation or business errors. I use a small number of attempts with exponential
backoff capped at a maximum and full jitter so that clients do not retry in synchronized waves. I only retry
idempotent operations, or non-idempotent ones that carry an idempotency key, and I retry in a single layer to
avoid multiplying traffic. For sustained failures I add a circuit breaker so the system fails fast."

**Follow-up questions**

- *Why jitter?* Prevents thundering herd/retry storms; spreads retries randomly in time.
- *What is a retry storm?* Retries from many clients amplify load on a degraded service, preventing recovery.
- *Why not retry POST?* A POST is not idempotent by definition; a retry after a timeout may create a duplicate.
  Safe only with an idempotency key.
- *What about retrying a DB transaction after deadlock?* Yes, retry the WHOLE transaction (not just the failed
  statement) since MySQL rolls back the transaction on deadlock (1213); keep attempts small.
- *Difference between retry and circuit breaker?* Retry handles brief blips for one call; the breaker stops calls
  altogether when the dependency is clearly down and probes for recovery.
- *How many retries?* Usually 2-3; the total retry time must fit inside the overall request deadline.

**Common mistakes**

- Retrying everything, including 4xx.
- Retrying without jitter or without a cap/limit.
- Retrying a non-idempotent charge without an idempotency key (double charge).
- Retries at several layers (multiplying).
- No overall deadline, so retries outlive the client's patience.
- Retrying a single statement inside a transaction that MySQL already rolled back.

**Revision notes**

- Retry transient, idempotent operations only; 2-4 attempts; cap; full jitter `random(0, min(cap, base*2^n))`.
- Honor `Retry-After`. Retry in one layer. Add circuit breaker for sustained failure.
- Retry the whole DB transaction on deadlock.

### 3.3 Idempotency and idempotency keys `[ESSENTIAL]`

**Concept**

Idempotent operation = ek hi request ko 1 baar ya 10 baar karne ka final result same hota hai.
`DELETE /orders/5` ko 10 baar chalao: order delete hi rahega (idempotent). `POST /payments` ko 10 baar
chalao: 10 charges (NOT idempotent). Real life mein duplicates aate kyun hain?

- User double-clicks "Pay".
- Mobile app timeout ke baad automatically retry karta hai.
- Load balancer / API gateway retry kar deta hai.
- Network timeout: client ko response nahi mila, par server ne kaam kar diya tha.
- Queue messages at-least-once delivery (same job twice).

| Method | Safe (no state change) | Idempotent |
|--------|------------------------|------------|
| GET, HEAD, OPTIONS | yes | yes |
| PUT (replace whole resource) | no | yes |
| DELETE | no | yes (the end state is the same; the status code may differ, 204 then 404) |
| POST (create / action) | no | NO |
| PATCH | no | depends (`set status=SHIPPED` yes, `increment counter` no) |

**Idempotency key**: client har *logical* operation ke liye ek unique key banata hai (UUID) aur header mein
bhejta hai: `Idempotency-Key: 8a1f...`. Server us key ko store karta hai. Agar wahi key dobara aaye, to server
kaam dobara nahi karta, pehle ka saved response return kar deta hai. Stripe jaise payment providers yehi karte
hain (the IETF has an Idempotency-Key header draft; the convention is widely used).

**Why it matters**

Payments/orders mein duplicate = real paisa. "How do you prevent duplicate payments?" Week 7 ke payment design
mein bhi wapas aayega. This is one of the highest-value topics for product-company backend interviews.

**Internal working: the algorithm**

```
Client: POST /orders  Idempotency-Key: K1  body B
Server:
  1. Try INSERT (user_id, K1, hash(B), status=IN_PROGRESS)   <- UNIQUE(user_id, idem_key)
  2a. Insert succeeded  -> we are the first. Do the work. Save response, mark COMPLETED. Return it.
  2b. Duplicate key error:
       - hash differs        -> 422 (same key, different request: client bug)
       - status IN_PROGRESS  -> 409 (the first request is still running; client should retry later)
       - status COMPLETED    -> return the stored response (replay) WITHOUT redoing the work
```

The **database UNIQUE constraint is the lock**. Two concurrent requests with the same key both try the INSERT;
MySQL guarantees only one succeeds (the other gets `ER_DUP_ENTRY`, errno 1062). We do not need Redis locks,
and we do not use `SELECT then INSERT` (which has a race window: both SELECTs see nothing, both INSERT).

Schema (MySQL 8):

```sql
CREATE TABLE idempotency_keys (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  idem_key        VARCHAR(64)     NOT NULL,
  request_hash    CHAR(64)        NOT NULL,
  status          ENUM('IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
  response_status SMALLINT UNSIGNED NULL,
  response_body   JSON            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_key (user_id, idem_key),   -- the lock; scoping by user stops cross-user key collisions
  KEY idx_created_at (created_at)               -- for a cleanup job that deletes keys older than 24-72 hours
) ENGINE=InnoDB;
```

`src/lib/idempotency.js`:

```js
import { createHash } from 'node:crypto';
import { AppError } from '../errors.js';

// A stable fingerprint of WHAT the client asked for. If the same key comes with a different payload it is a client bug.
// (JSON.stringify depends on key order; for strictness canonicalize keys first, or hash only the business fields.)
export function hashRequest(method, path, body) {
  return createHash('sha256').update(JSON.stringify({ method, path, body })).digest('hex');
}

export function parseIdempotencyKey(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(value)) {
    throw new AppError(400, 'IDEMPOTENCY_KEY_REQUIRED',
      'Idempotency-Key header (8-64 chars: letters, digits, _ -) is required');
  }
  return value;
}

export async function withIdempotency(pool, { userId, key, requestHash }, work) {
  // Step 1: try to claim the key. The UNIQUE constraint makes this atomic across concurrent requests and servers.
  try {
    await pool.execute(
      'INSERT INTO idempotency_keys (user_id, idem_key, request_hash) VALUES (?, ?, ?)',
      [userId, key, requestHash],
    );
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err;

    // Someone claimed it before us (a retry, a double click, or a concurrent duplicate).
    const [rows] = await pool.execute(
      'SELECT request_hash, status, response_status, response_body FROM idempotency_keys WHERE user_id = ? AND idem_key = ?',
      [userId, key],
    );
    const existing = rows[0];
    if (!existing) {
      // Row vanished (cleanup job, or the first request released it after failing). Let the client retry.
      throw new AppError(409, 'REQUEST_IN_PROGRESS', 'Please retry the request');
    }
    if (existing.request_hash !== requestHash) {
      throw new AppError(422, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was used with a different request');
    }
    if (existing.status === 'IN_PROGRESS') {
      throw new AppError(409, 'REQUEST_IN_PROGRESS', 'The original request is still being processed');
    }
    // mysql2 already parses JSON columns into objects.
    return { replayed: true, status: existing.response_status, body: existing.response_body };
  }

  // Step 2: we own the key. Do the real work exactly once.
  try {
    const { status, body } = await work();
    await pool.execute(
      "UPDATE idempotency_keys SET status = 'COMPLETED', response_status = ?, response_body = ? WHERE user_id = ? AND idem_key = ?",
      [status, JSON.stringify(body), userId, key],
    );
    return { replayed: false, status, body };
  } catch (err) {
    // Failed before any lasting side effect: release the key so the client can safely retry with the SAME key.
    // (If the work may have partially succeeded, e.g. money moved, keep the row and reconcile instead. See below.)
    await pool.execute(
      "DELETE FROM idempotency_keys WHERE user_id = ? AND idem_key = ? AND status = 'IN_PROGRESS'",
      [userId, key],
    );
    throw err;
  }
}
```

Route:

```js
// src/app.js (route)
import { hashRequest, parseIdempotencyKey, withIdempotency } from './lib/idempotency.js';

app.post('/orders', requireAuth, async (req, res) => {
  const key = parseIdempotencyKey(req.get('idempotency-key'));
  const requestHash = hashRequest(req.method, req.path, req.body);

  const result = await withIdempotency(pool, { userId: req.user.id, key, requestHash }, async () => {
    const order = await orderService.placeOrder(req.user.id, req.body?.items, { idempotencyKey: key });
    return { status: 201, body: order };
  });

  if (result.replayed) res.set('Idempotent-Replayed', 'true');
  res.status(result.status).json(result.body);
});
```

Test (integration, real MySQL): the heart of `EX-IDEM-01`.

```js
it('charges once when 10 identical requests with the same key arrive concurrently', async () => {
  const key = 'test-key-0001';
  const send = () =>
    request(app).post('/orders')
      .set('Authorization', 'Bearer user-token')
      .set('Idempotency-Key', key)
      .send({ items: [{ priceInPaise: 10000, qty: 1 }] });

  const responses = await Promise.all(Array.from({ length: 10 }, send));
  const statuses = responses.map((r) => r.status);

  expect(statuses.filter((s) => s === 201).length).toBeGreaterThanOrEqual(1);
  expect(gateway.charge).toHaveBeenCalledTimes(1);                     // the important assertion
  expect(statuses.every((s) => [201, 409].includes(s))).toBe(true);    // others: replay (201) or 409 in progress
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM orders');
  expect(n).toBe(1);
});

it('rejects the same key with a different body', async () => {
  const headers = { Authorization: 'Bearer user-token', 'Idempotency-Key': 'test-key-0002' };
  await request(app).post('/orders').set(headers).send({ items: [{ priceInPaise: 100, qty: 1 }] }).expect(201);
  await request(app).post('/orders').set(headers).send({ items: [{ priceInPaise: 999, qty: 1 }] }).expect(422);
});
```

**Hard edge cases (this is where interviewers dig)**

1. **Crash after the side effect but before saving the response.** The row stays `IN_PROGRESS` and the payment
   went through. Defences: (a) if the side effect lives in the SAME MySQL database, perform the business write
   AND the idempotency row update in ONE transaction (commit both or neither); (b) if the side effect is an
   external call, pass the same idempotency key to the provider so a re-run is harmless, and run a reconciliation
   job that finds `IN_PROGRESS` rows older than N minutes and resolves them by querying the provider;
   (c) never delete the key when money may have moved.
2. **Concurrent duplicates** are handled by the UNIQUE constraint (above), not by application-level checks.
3. **Key scope**: unique per user (or per tenant/merchant), otherwise users can collide or probe each other.
4. **Retention**: keep keys 24-72 hours (cleanup job), long enough to cover client retry windows, short enough to
   avoid unbounded table growth.
5. **Same key, different payload** -> 422, not silently returning the old response.
6. **What to store**: the status and body of the first response, including deterministic errors (e.g. 422
   validation); do not store transient 5xx (so that a retry can succeed).
7. **Business-level uniqueness** as a second safety net: e.g. `UNIQUE(user_id, client_order_ref)` on `orders`,
   `UNIQUE(payment_ref)` on `payments`. Constraints in the DB beat checks in code.
8. **Message queues**: consumers also need idempotency (Day 5): at-least-once delivery means duplicates by design.
   Use a `processed_events(event_id UNIQUE)` table or natural idempotency (`UPDATE ... SET status='SHIPPED'`).

**Other duplicate-prevention techniques**

| Technique | How | Strength / limit |
|-----------|-----|------------------|
| UI: disable button, debounce | Frontend only | Helps UX; useless against retries, bots, other clients. Never the only defense |
| DB UNIQUE constraint | `UNIQUE(user_id, client_ref)` | Strongest, simple; returns `ER_DUP_ENTRY` to map to 409 or replay |
| Idempotency key table | Above | General-purpose, replays the original response |
| `SELECT ... FOR UPDATE` | Lock the row in a transaction (Week 4 Day 5) | Serializes concurrent updates to the same row (e.g. wallet balance) |
| Optimistic locking | `UPDATE ... WHERE id=? AND version=?`, check `affectedRows` | Detects lost updates without holding locks |
| Redis `SET key val NX EX 30` | Short-lived distributed lock | Fast, but not durable or crash-safe (lock expires, Redis failover). Fine to reduce duplicates, NOT to guarantee money correctness |

**Frontend connection**

You already do this in React: disable the submit button while the mutation is pending, and generate a client-side
UUID per form submission (`useRef(crypto.randomUUID())`) that you reuse on retries. That UUID IS the idempotency key.
Frontend protection is courtesy, backend protection is the guarantee. React Query mutation retries are a reason the
backend must be idempotent.

**Real-world scenario**

UPI-like transfer: user taps "Send 5,000", the app shows a spinner, the network drops, the app retries
automatically with the same `Idempotency-Key`. The first request had actually completed. The server sees the key
as COMPLETED, replays the stored response ("success, txn id 123") and no second debit happens. Without the key
the customer is debited 10,000 and support gets a call.

**Interview answer:**
"Idempotency means repeating a request has the same effect as sending it once. GET, PUT and DELETE are idempotent
by definition, POST is not. To make a POST like 'create payment' safe, the client sends a unique Idempotency-Key
header. On the server I insert the key into a table with a UNIQUE constraint on user and key, together with a
hash of the request. If the insert succeeds I do the work and store the response; if it hits a duplicate-key
error I either replay the stored response, return 409 while the first attempt is still in progress, or return 422
if the same key was reused with a different payload. The database constraint is what makes this safe under
concurrency, and I add business-level unique constraints plus reconciliation for crash cases."

**Follow-up questions**

- *Why a DB unique constraint and not check-then-insert in code?* Check-then-insert has a race: two requests both
  see no row and both insert. The constraint is atomic.
- *Why not Redis for the idempotency record?* It can work for low-stakes cases, but for payments you want durability and
  transactional coupling with business data; Redis may lose the key on eviction or failover.
- *What if the server crashes mid-request?* See edge case 1: transaction coupling, provider-level idempotency key,
  reconciliation job.
- *How long do you keep keys?* 24 hours to a few days, cleanup by `created_at`.
- *Is PUT always idempotent?* By HTTP semantics yes, but your implementation must really replace state, not append
  (e.g. do not insert a new row on every PUT).
- *Who generates the key?* The client, once per user intent, reused on every retry of that intent. The server cannot
  generate it because the problem is a client that never saw the response.
- *Idempotency vs exactly-once delivery?* Exactly-once is not achievable over an unreliable network; the practical
  approach is at-least-once delivery plus idempotent processing (effectively-once).

**Common mistakes**

- Generating a new key on every retry (defeats the purpose).
- Check-then-insert race instead of a unique constraint.
- Not scoping keys per user, or not hashing the request.
- Deleting the key after a failure when money might have moved.
- Storing transient 5xx errors as the permanent response.
- Relying only on a disabled button.
- Unbounded table growth (no cleanup).

**Revision notes**

- Idempotent: GET, PUT, DELETE. POST is not. Keys make POST safe.
- UNIQUE(user_id, idem_key) is the lock. Hash the request. States IN_PROGRESS / COMPLETED.
- Replay stored response; 409 in progress; 422 on key reuse.
- Crash safety: one transaction, provider idempotency key, reconciliation. Keep keys 24-72h.
- Retries are only safe with idempotency.

### Day 3 wrap-up

**Key concepts to remember**

- Timeout everything; inner < outer; a timeout does not cancel the remote work.
- Retry transient + idempotent only; exponential backoff + full jitter + cap + limited attempts; one layer.
- Circuit breaker, retry budget, bulkhead = protection patterns for sustained failures.
- Idempotency key + UNIQUE constraint = atomic duplicate protection; replay the stored response.
- Crash/edge cases: transaction coupling, provider keys, reconciliation, TTL cleanup.

**Five revision questions**

1. What happens to your server if an outbound HTTP call has no timeout and the dependency hangs?
2. Write the full jitter formula and explain what problem jitter solves.
3. Which HTTP errors would you retry, which not, and why is retrying a POST dangerous?
4. Walk through what happens when two requests with the same Idempotency-Key arrive at the same millisecond.
5. The server crashes after charging the card but before saving the response. What protects the customer?

**Practical coding task** (see `EX-IDEM-01`)

Implement `withIdempotency` against a real MySQL test database and write the concurrency test above. Then extend it:
add a cleanup function `deleteExpiredKeys(pool, hours)` and a test that inserts one old and one new key (set
`created_at` manually) and verifies only the old one is deleted. Bonus: make `hashRequest` order-independent by
canonicalizing object keys.

**Self-assessment checklist**

- [ ] I can write retry-with-full-jitter from memory and test it with an injected sleep.
- [ ] I can say which status codes and error codes are retryable.
- [ ] I can explain why a timeout does not mean the operation failed.
- [ ] I can draw the idempotency-key flow including concurrent and crash cases.
- [ ] I know which HTTP methods are idempotent and why POST is not.
- [ ] I can name three duplicate-prevention techniques besides idempotency keys.

---

## Day 4 - Redis fundamentals (ioredis), caching patterns, cache invalidation (Day 39)

**Learning objectives**

By the end of today you should be able to:
1. Explain what Redis is, why it is fast, and what its single-threaded command execution means.
2. Pick the right Redis data type for a use case and use ioredis for basic operations, TTLs and atomic counters.
3. Implement cache-aside with TTL, TTL jitter, negative caching and fail-open behavior when Redis is down.
4. Explain and defend against cache stampede, penetration and avalanche.
5. Explain cache invalidation strategies, the stale-set race, and when NOT to cache.
6. Describe Redis persistence and eviction policies and why cache and queue Redis should be configured differently.

Suggested time: 30 min Redis fundamentals, 40 min cache-aside code, 30 min stampede and invalidation, 20 min tests.

### 4.1 Redis fundamentals `[ESSENTIAL]`

**Concept**

Redis ek **in-memory key-value data store** hai. Data RAM mein rehta hai, isliye reads/writes microseconds
mein hote hain (MySQL disk/buffer pool + SQL parsing + network se bahut tez). Value sirf string nahi, Redis mein
data structures hain: hash, list, set, sorted set, etc. Common uses: cache, session store, rate limiter counters,
distributed locks, leaderboards, pub/sub, and as the backing store for job queues (BullMQ).

**Why it matters**

Redis har mid-level backend interview mein aata hai: "Where would you use Redis?", "How do you cache?", "What if
cache and DB go out of sync?" It is also the usual first answer to "API slow hai, kya karoge?" (after you have
checked the query and the index first. Cache is not a substitute for a good index).

**Internal working**

- **Single-threaded command execution**: one thread executes commands one after another from an event loop
  (same mental model as Node). So every single command is **atomic**: no two commands interleave. `INCR` is safe
  without locks. Newer Redis versions (6+) can use extra I/O threads for reading/writing sockets, but command
  execution is still serial. Consequence: one slow command (`KEYS *`, `SMEMBERS` on a million-item set, a long Lua
  script) blocks ALL clients.
- **Protocol**: RESP over TCP. Clients can **pipeline** many commands in one round trip.
- **Expiry**: keys with a TTL are removed lazily (when accessed after expiry) and by an active sampling process in
  the background. So expired keys can linger briefly in memory, but you will never read an expired value.
- **Eviction**: when `maxmemory` is reached the `maxmemory-policy` decides: `noeviction` (writes fail with an error),
  `allkeys-lru`, `volatile-lru` (only keys with TTL), `allkeys-lfu`, etc. For a **cache** use `allkeys-lru` or
  `allkeys-lfu`. For a **queue or lock store** use `noeviction` (evicting a job key silently loses work;
  BullMQ documents that it requires `noeviction`).
- **Persistence** (optional): **RDB** = periodic snapshots (fast restart, can lose last minutes), **AOF** = append-only
  log of writes (fsync every second by default setting `everysec`; lose at most ~1s), or both. A pure cache can run with no
  persistence; queues should use AOF.
- **Replication / HA**: replicas copy data asynchronously (so failover can lose the last writes), Sentinel or Redis
  Cluster / managed services (ElastiCache) provide failover and sharding. Mention only at concept level.

Data types and typical use:

| Type | Commands | Use case |
|------|----------|----------|
| String | `SET/GET/INCR/EXPIRE/SETNX` | cached JSON, counters, tokens, locks |
| Hash | `HSET/HGET/HGETALL` | object fields (session, cart), update one field without rewriting JSON |
| List | `LPUSH/RPOP/BRPOP` | simple queues, recent items |
| Set | `SADD/SISMEMBER/SMEMBERS` | unique things, tags, "who liked" |
| Sorted set | `ZADD/ZRANGE/ZRANK` | leaderboards, rate limit windows, delayed jobs (BullMQ uses these) |
| Pub/Sub, Streams | `PUBLISH/SUBSCRIBE`, `XADD/XREADGROUP` | messaging (pub/sub is fire-and-forget, no persistence) |

**Code: connecting and basics with ioredis**

`src/lib/redis.js`:

```js
import { Redis } from 'ioredis';
import { logger } from '../logger.js';

// Client for CACHING: fail fast so a Redis outage does not make every API call hang. Fall back to the DB instead.
export function createCacheRedis(url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379') {
  const redis = new Redis(url, {
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,              // a command fails after 1 retry instead of queueing forever
    enableOfflineQueue: false,            // while disconnected, commands fail immediately
    retryStrategy: (times) => Math.min(times * 200, 3000),   // reconnect with growing delay (ms)
  });

  // IMPORTANT: an EventEmitter 'error' event with no listener crashes the process.
  redis.on('error', (err) => logger.warn({ err: err.message }, 'redis error'));
  redis.on('reconnecting', () => logger.warn('redis reconnecting'));
  return redis;
}
```

Basic commands:

```js
import { createCacheRedis } from './lib/redis.js';
const redis = createCacheRedis();

// Strings with TTL (EX = seconds, PX = milliseconds)
await redis.set('product:42', JSON.stringify({ id: 42, name: 'Pipe 2 inch' }), 'EX', 60);
const raw = await redis.get('product:42');          // string or null
const product = raw ? JSON.parse(raw) : null;
await redis.ttl('product:42');                       // seconds left, -1 no TTL, -2 no such key
await redis.del('product:42');

// Atomic counter: safe under concurrency because commands are executed one by one
const views = await redis.incr('views:product:42');

// SET with NX = only if not exists (basis for locks and "first one wins")
const acquired = await redis.set('lock:order:9', 'token-abc', 'PX', 10_000, 'NX');   // 'OK' or null

// Hash: update a single field without reading/writing the whole object
await redis.hset('cart:user:7', { 'sku:1': 2, 'sku:2': 1 });
await redis.hincrby('cart:user:7', 'sku:1', 1);
const cart = await redis.hgetall('cart:user:7');    // { 'sku:1': '3', 'sku:2': '1' } (all values are strings)

// Sorted set: leaderboard
await redis.zadd('leaderboard:sellers', 1500, 'seller:5', 900, 'seller:8');
const top = await redis.zrevrange('leaderboard:sellers', 0, 9, 'WITHSCORES');

// Pipeline: many commands, one network round trip (not atomic)
const results = await redis.pipeline().get('a').get('b').incr('c').exec();   // [[err, val], ...]
```

Finding keys safely: NEVER `KEYS user:*` in production (it scans everything and blocks the single thread). Use
`SCAN` (cursor based, incremental):

```js
async function deleteByPattern(redis, pattern) {
  let count = 0;
  for await (const keys of redis.scanStream({ match: pattern, count: 200 })) {
    if (keys.length) { await redis.unlink(...keys); count += keys.length; }   // UNLINK = non-blocking delete
  }
  return count;
}
```

Key naming: `app:entity:id[:field]` (colon separated), e.g. `orders-api:product:42`. Include a version when the
shape of the cached JSON changes (`v2`) so old entries are not misread after a deploy.

**Frontend connection**

Redis cache is "React Query's cache" but shared by all users and living on the server: a key, a stale time (TTL),
and invalidation rules. `localStorage` is also key-value with strings only, which is what Redis strings feel like
(`JSON.stringify` / `JSON.parse`). The difference: Redis is shared, so one wrong key leaks one user's data to another.

**Real-world scenario**

Marketplace home page shows "top 20 products" computed by a heavy SQL aggregation (800ms). Computing it per
request kills MySQL at 200 requests per second. Store the result in Redis with a 60-second TTL: 1 DB query per
minute per instance instead of 12,000. A 60-second staleness is acceptable for a trending list.

**Interview answer:**
"Redis is an in-memory data store with rich data structures. It executes commands on a single thread, so each
command is atomic, and everything is served from RAM, which makes it very fast. I use it for caching with TTLs,
atomic counters for rate limiting, short-lived locks, and as the backing store for BullMQ queues. For a cache I
configure an LRU eviction policy; for queues I use noeviction with AOF persistence, ideally on a separate instance.
I avoid O(N) commands like KEYS in production and use SCAN instead."

**Follow-up questions**

- *Why is Redis fast if it is single-threaded?* Memory access, no disk in the hot path, simple data structures,
  I/O multiplexing event loop, no lock contention or context switching between threads.
- *Redis vs Memcached?* Memcached is simpler (strings, multi-threaded). Redis has data structures, persistence,
  replication, Lua scripting, pub/sub and streams.
- *Is Redis durable?* Optionally: RDB/AOF reduce loss but it is not a primary database for critical data; treat it as
  a cache or a fast ephemeral store unless you deliberately design durability (AOF + replicas).
- *How do you do a distributed lock?* `SET key token NX PX ttl` and release with a Lua compare-and-delete (see 4.3).
  Not safe enough for strict correctness (money): use DB constraints. Redlock exists but is debated.
- *Why `UNLINK` instead of `DEL`?* `UNLINK` frees memory in a background thread, so it does not block on big values.
- *What happens if Redis goes down?* A cache layer must fail open: fall back to the DB (with protection against a
  stampede), and never make Redis a hard dependency for reads.

**Common mistakes**

- Using `KEYS *` in production.
- Forgetting the TTL, so the cache grows until eviction or an out-of-memory error.
- No `error` listener on the client (process crash) or unbounded command queueing during outages.
- Caching user-specific data under a non-user-specific key (data leak).
- Storing huge values (megabytes) in one key; it blocks the thread when read/written.
- Treating Redis as the system of record.
- Using the same Redis instance and policy for cache (evict allowed) and queues (evict forbidden).

**Revision notes**

- In-memory, single-threaded commands = atomic. Data types matter. TTL everywhere.
- `SCAN` not `KEYS`; `UNLINK`; pipeline for round trips.
- Cache: allkeys-lru. Queue/locks: noeviction + AOF.
- Handle client `error` events; cache client should fail fast.

### 4.2 Caching patterns: cache-aside and friends `[ESSENTIAL]`

**Concept**

Caching = costly result ko temporary jagah (fast) rakhna taaki next request fast serve ho.

| Pattern | Flow | When |
|---------|------|------|
| **Cache-aside (lazy loading)** | App reads cache; on miss reads DB, then writes cache. Writes go to DB, then delete the cache key. | Default choice. Simple, resilient. Used in most interviews |
| Read-through | Cache layer itself loads from DB on miss (library/provider does it) | Same idea, logic hidden in a cache library |
| Write-through | Write to cache and DB together, synchronously | Reads always warm; writes slower; extra complexity |
| Write-behind (write-back) | Write to cache, flush to DB asynchronously | Very high write rates; risk of data loss. `[ADVANCED]`, rarely right for money |
| Refresh-ahead | Refresh hot keys before expiry in the background | Avoid latency spikes on popular keys `[ADVANCED]` |

**What to cache**: read-heavy, expensive to compute, tolerant of small staleness: product catalog, category
trees, config, public profile pages, aggregated stats, results of expensive third-party calls.

**What NOT to cache** (or only with great care): per-user sensitive data under shared keys, account balances and stock
counts where stale reads cause wrong decisions, anything that must be strongly consistent, data that is cheap to read
(primary key lookup on a small table is already fast), rapidly changing data with low hit rate.

**Why it matters**

Cache gives 10x-100x latency drop and removes DB load, but adds a second source of truth that can be wrong. Good
engineers cache deliberately and know how it goes stale. Measure first (EXPLAIN, profiler), cache second.

**Internal working: cache-aside read path**

```
GET /products/42
  -> Redis GET product:42
        hit  -> return it (1 ms)
        miss -> SELECT from MySQL (20 ms) -> Redis SET product:42 EX 60 -> return
Write path: UPDATE MySQL -> Redis DEL product:42   (next read repopulates)
```

`src/lib/cache.js`:

```js
import { logger } from '../logger.js';

const inflight = new Map();   // single-flight per process: key -> Promise (protects against a stampede inside one instance)

export function createCache(redis, { prefix = 'orders-api:v1', defaultTtlSec = 60, nullTtlSec = 15 } = {}) {
  const k = (key) => `${prefix}:${key}`;

  // Values are wrapped as { v: value } so that a cached null/false/0 can be told apart from "not in cache".
  async function get(key) {
    try {
      const raw = await redis.get(k(key));
      return raw === null ? undefined : JSON.parse(raw).v;
    } catch (err) {
      logger.warn({ err: err.message, key }, 'cache get failed (fail open)');
      return undefined;                                  // treat as a miss; never fail the request because the cache is sick
    }
  }

  async function set(key, value, ttlSec = defaultTtlSec) {
    // Jitter: spread expirations by up to +10 percent so many keys written together do not expire together (avalanche).
    const ttl = ttlSec + Math.floor(ttlSec * 0.1 * Math.random());
    try {
      await redis.set(k(key), JSON.stringify({ v: value }), 'EX', ttl);
    } catch (err) {
      logger.warn({ err: err.message, key }, 'cache set failed');
    }
  }

  async function del(...keys) {
    try {
      if (keys.length) await redis.del(...keys.map(k));
    } catch (err) {
      logger.warn({ err: err.message, keys }, 'cache del failed');
    }
  }

  // cache-aside + negative caching + single-flight
  async function getOrSet(key, loader, { ttlSec = defaultTtlSec } = {}) {
    const hit = await get(key);
    if (hit !== undefined) return hit;

    if (inflight.has(key)) return inflight.get(key);     // 100 concurrent misses -> 1 DB query

    const promise = (async () => {
      const value = await loader();                       // loader errors propagate and are NOT cached
      // Negative caching: remember "does not exist" briefly so repeated lookups of missing ids do not hit the DB.
      await set(key, value ?? null, value == null ? nullTtlSec : ttlSec);
      return value ?? null;
    })().finally(() => inflight.delete(key));

    inflight.set(key, promise);
    return promise;
  }

  return { get, set, del, getOrSet, k };
}
```

Using it in the service (note: DELETE on write, not SET):

```js
// src/products/productService.js
export function createProductService({ productRepo, cache }) {
  return {
    getProduct(id) {
      return cache.getOrSet(`product:${id}`, () => productRepo.findById(id), { ttlSec: 120 });
    },

    async updateProduct(id, patch) {
      const updated = await productRepo.update(id, patch);   // 1. DB is the source of truth, write it first
      await cache.del(`product:${id}`);                      // 2. invalidate; the next read repopulates
      return updated;
    },
  };
}
```

Why delete instead of updating the cached value on write? Two concurrent writers could set the cache in the
opposite order from their DB commits, leaving a permanently wrong value. Deleting is idempotent and order-independent;
the worst case is one extra DB read.

Test with a fake cache (fast unit test, no Redis needed):

```js
import { describe, it, expect, vi } from 'vitest';
import { createCache } from '../src/lib/cache.js';

function fakeRedis() {
  const store = new Map();
  return {
    get: vi.fn(async (k) => store.get(k) ?? null),
    set: vi.fn(async (k, v) => { store.set(k, v); return 'OK'; }),
    del: vi.fn(async (...ks) => ks.forEach((k) => store.delete(k))),
  };
}

describe('cache-aside', () => {
  it('loads once for 50 concurrent misses (single-flight) and serves hits afterwards', async () => {
    const cache = createCache(fakeRedis());
    const loader = vi.fn(async () => ({ id: 1 }));

    const results = await Promise.all(Array.from({ length: 50 }, () => cache.getOrSet('p:1', loader)));
    expect(loader).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.id === 1)).toBe(true);

    await cache.getOrSet('p:1', loader);          // now a hit
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('caches "not found" (null) so missing ids do not hammer the DB', async () => {
    const cache = createCache(fakeRedis());
    const loader = vi.fn(async () => null);
    await cache.getOrSet('p:999', loader);
    await cache.getOrSet('p:999', loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('fails open when Redis throws', async () => {
    const broken = { get: vi.fn().mockRejectedValue(new Error('down')), set: vi.fn().mockRejectedValue(new Error('down')) };
    const cache = createCache(broken);
    await expect(cache.getOrSet('p:1', async () => ({ id: 1 }))).resolves.toEqual({ id: 1 });
  });

  it('does not cache loader errors', async () => {
    const cache = createCache(fakeRedis());
    const loader = vi.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce({ id: 1 });
    await expect(cache.getOrSet('p:1', loader)).rejects.toThrow('db down');
    await expect(cache.getOrSet('p:1', loader)).resolves.toEqual({ id: 1 });
  });
});
```

**Frontend connection**

Cache-aside is React Query's `queryFn` + `staleTime`: check cache, fetch on miss, `invalidateQueries` after a
mutation. React Query's invalidate = our `cache.del` after a DB write. The server-side version has an extra
problem: many instances and many users share the same cache.

**Real-world scenario**

Banking app "exchange rates" are fetched from a paid third-party API (rate-limited, 300ms). Cache the rates for
30 seconds: the API is called twice a minute instead of for each of thousands of requests, cost drops, latency drops.
Account balance, however, is NOT cached: it is read from the DB (or ledger) every time because stale balances are
dangerous.

**Interview answer:**
"I use cache-aside: the service checks Redis first, on a miss loads from the database and stores the result with a
TTL, and on writes I update the database and then delete the cache key so the next read repopulates it. I add jitter
to TTLs, cache 'not found' briefly, coalesce concurrent misses so only one request hits the database, and
treat Redis as optional: if it fails I fall back to the database rather than failing the request. I only cache
read-heavy data that can tolerate some staleness, and I would not cache things like account balances."

**Follow-up questions**

- *Write-through vs cache-aside?* Write-through updates cache and DB together so reads are always warm but writes
  are slower and more complex; cache-aside is lazy and simpler and the common default.
- *Why delete the key on update instead of setting it?* Avoids ordering races between concurrent writers and avoids
  caching a value that a later transaction rolled back.
- *Where else can you cache?* Browser/CDN with `Cache-Control`/ETag (HTTP caching), in-process memory (`Map`, LRU;
  fastest, but per instance and inconsistent between instances), Redis (shared), DB query cache. Layered caching is common.
- *What TTL do you choose?* Based on how stale the business can tolerate and how expensive a miss is; start with 30-300s
  and tune from hit-rate metrics.
- *How do you measure a cache?* Hit ratio, latency with and without, memory use, eviction count.

**Common mistakes**

- Caching before measuring or before fixing a missing index.
- No TTL, or one TTL for everything.
- Cache key that does not include everything the result depends on (user, locale, filters, page).
- Updating the cache value on write instead of deleting.
- Making Redis a hard dependency.
- Caching errors or partial results.

**Revision notes**

- Cache-aside: read cache -> miss -> DB -> set with TTL; write DB -> delete key.
- Jitter, negative caching, single-flight, fail open.
- Cache only tolerant, read-heavy, expensive data. Key must include all inputs.

### 4.3 Stampede, penetration, avalanche `[ESSENTIAL]` (distributed lock `[ADVANCED]`)

Interview mein inke teen naam aate hain. Teeno ko alag batana seekho.

| Problem | What happens | Defense |
|---------|--------------|---------|
| **Cache stampede (thundering herd / dog-piling)** | A hot key expires; 1,000 concurrent requests all miss and hit the DB for the same value | single-flight in process, distributed lock (one rebuilder), stale-while-revalidate, refresh-ahead, longer TTL for hot keys |
| **Cache penetration** | Requests for keys that never exist (random ids, attackers) always miss and always hit the DB | negative caching (short TTL), input validation, Bloom filter `[ADVANCED]`, rate limiting |
| **Cache avalanche** | Many keys expire at the same time (same TTL set together) or Redis restarts empty, DB gets overwhelmed | TTL jitter, staggered warm-up, multi-layer cache, circuit breaker and rate limit on DB, HA Redis |

Distributed single-flight with a lock (multiple instances): only the lock holder rebuilds, others wait briefly
or serve stale data.

```js
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

// Compare-and-delete: release the lock only if we still own it (our TTL may have expired and someone else took it).
const RELEASE_LUA = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end`;

export async function getWithLock(redis, cache, key, loader, { ttlSec = 60 } = {}) {
  const hit = await cache.get(key);
  if (hit !== undefined) return hit;

  const lockKey = `lock:${cache.k(key)}`;
  const token = randomUUID();
  const gotLock = await redis.set(lockKey, token, 'PX', 5000, 'NX');   // auto-expires: a crash cannot deadlock the key

  if (gotLock) {
    try {
      const value = await loader();
      await cache.set(key, value ?? null, ttlSec);
      return value ?? null;
    } finally {
      await redis.eval(RELEASE_LUA, 1, lockKey, token);
    }
  }

  // Someone else is rebuilding: poll the cache for a short while, then fall back to loading ourselves.
  for (let i = 0; i < 10; i++) {
    await sleep(50);
    const v = await cache.get(key);
    if (v !== undefined) return v;
  }
  return loader();
}
```

**Stale-while-revalidate** `[ADVANCED]`: store the value with a soft TTL (e.g. 60s) inside the payload and a hard Redis
TTL (e.g. 10 min). When the soft TTL has passed, return the stale value immediately and refresh it in the background
(guarded by the lock). Users never wait for rebuilds of hot keys.

**Interview answer:**
"A stampede is when a popular key expires and many requests rebuild it simultaneously. I prevent it with request
coalescing in-process, a short-lived Redis lock so only one worker rebuilds, and TTL jitter so keys do not expire
together. Penetration is repeated lookups for non-existent data, which I handle with validation and negative
caching. Avalanche is mass expiry or a cold cache after restart, handled by jittered TTLs and protecting the
database with limits."

**Follow-up questions**

- *Is a Redis lock enough for correctness?* For cache rebuilds yes (the worst case is duplicate work). For money or
  inventory, no: use database transactions and constraints.
- *Why a unique token and Lua for unlock?* Otherwise a slow process could delete a lock that has already expired and
  been acquired by another process.
- *What does Redis being down do to the DB?* Every request becomes a miss; protect with single-flight, rate
  limits, and maybe degrade features.

**Common mistakes**

- Lock without a TTL (a crash leaves it forever) or with a TTL shorter than the loader's runtime.
- Releasing a lock with plain `DEL`.
- Identical TTL for all keys, set in a batch.

**Revision notes**

- Stampede = one hot key, many rebuilders. Penetration = nonexistent keys. Avalanche = mass expiry.
- Defenses: single-flight/lock, negative caching, jitter, SWR.

### 4.4 Cache invalidation `[ESSENTIAL]`

**Concept**

"There are only two hard things in computer science: cache invalidation and naming things." Invalidation = jab DB
badle to cache ko stale rehne se kaise bachayein. Koi perfect solution nahi, sirf trade-offs.

| Strategy | How | Pros | Cons |
|----------|-----|------|------|
| **TTL only** | Entry expires after N seconds | Trivial, self-healing | Stale up to N seconds |
| **Explicit delete on write** | `DEL key` after DB update | Fresh quickly | Must find ALL affected keys; race (below) |
| **Versioned keys / namespaces** | Key includes a version number; bump it on change | Invalidate whole families with one `INCR`; old keys simply expire | Slightly more reads (fetch the version) |
| **Tag / set based** | Keep a Redis set of keys per tag, delete all on change | Precise for related keys | Extra bookkeeping, set can grow |
| **Event driven** | Publish an event on change (or CDC from the binlog), subscribers invalidate | Decoupled, scales to many services | More infrastructure `[ADVANCED]` |
| **Write-through** | Update cache in the write path | Fresh | Complexity, ordering races |

**Internal working: the hardest part, list caches**

Single entity key (`product:42`) is easy to delete. But a product also appears inside `products:list:category=pipes:page=1`,
`products:search:q=pvc`, `seller:5:products`... You cannot enumerate those keys. Use a **version number** per family:

```js
// src/lib/versionedCache.js
export function createVersionedKeys(redis) {
  return {
    async current(family) {
      const v = await redis.get(`ver:${family}`);
      return v ?? '0';
    },
    bump(family) {
      return redis.incr(`ver:${family}`);          // atomic; all old keys become unreachable and simply expire by TTL
    },
  };
}

// reading a list
const ver = await versions.current('products');
const key = `products:list:v${ver}:cat=${category}:page=${page}:limit=${limit}`;
const data = await cache.getOrSet(key, () => productRepo.list({ category, page, limit }), { ttlSec: 300 });

// writing a product
await productRepo.update(id, patch);
await cache.del(`product:${id}`);          // the entity key
await versions.bump('products');           // every list/search key for products is invalidated at once
```

Cost: orphaned old keys sit in Redis until their TTL (or LRU eviction) removes them, so always set TTLs.

**The classic stale-set race (explain this and you sound senior)**

```
t1  Reader A: cache miss, reads OLD row from MySQL (price 100)
t2  Writer B: UPDATE price = 120, then DEL cache key
t3  Reader A: SET cache key = price 100          <- stale value written AFTER the delete
Result: cache says 100 until the TTL expires, DB says 120.
```

Mitigations (pick by how much staleness matters):
1. Short TTL: bounds the damage (the main practical defence).
2. **Delayed double delete**: delete, then delete again after ~500ms-1s, to clear a late stale set (a heuristic).
3. Store a row `version`/`updated_at` with the cached value and refuse to overwrite a newer value (Lua check-and-set).
4. Do not cache data that must be strongly consistent; read it from the DB.
5. Read-after-write consistency for the writer's own user: bypass cache for that user for a few seconds.

Also remember **cache and DB cannot be updated atomically** (no distributed transaction). Order: write the DB first,
then invalidate. If the delete fails (Redis down), the entry stays stale until TTL: so the TTL is your safety net, and
you should log failed invalidations.

HTTP-level invalidation: `Cache-Control: max-age`, `ETag` + `If-None-Match` (304) for clients/CDNs. When using a
CDN, cache purge APIs or versioned URLs (`/assets/app.3f9a.js`) solve the same problem.

**Frontend connection**

React Query: `queryClient.invalidateQueries(['products'])` invalidates a whole family by key prefix. Our version bump is
the same trick done with a counter. The stale-set race is the server-side twin of a frontend bug where a slow, old
response overwrites newer data (solved in React with request cancellation or "latest wins").

**Real-world scenario**

Seller edits the price of a product. Old design: just TTL of 10 minutes, so the buyer sees the old price for up
to 10 minutes while checkout charges the new one: complaints. Better: price shown on listing pages can be 60s stale, but
the checkout service always reads the price from MySQL (source of truth). Cache for browsing, DB for
money decisions.

**Interview answer:**
"For invalidation I always set a TTL as a safety net, and on writes I update the database first and then delete the
affected keys. For families of keys like list and search results I use a version number in the key and bump it with
INCR on change, so everything stale becomes unreachable at once. I am aware of the race where a reader that missed
before the write can re-populate the cache with the old value after the delete, so I keep TTLs short for data that
changes, consider a delayed second delete or version checks, and never serve money-critical reads such as price at
checkout or account balance from the cache."

**Follow-up questions**

- *Why update DB first, then invalidate?* If you delete the cache first, a reader can immediately repopulate it with the
  old DB value before your write commits. Writing DB first then deleting minimizes (not eliminates) the window.
- *Can you guarantee consistency between cache and DB?* Not strictly without distributed transactions. You choose
  an acceptable staleness bound (TTL) per data type. Strong consistency = read from the DB.
- *How would you invalidate across many services?* Publish domain events (queue/pub-sub) or use CDC from the MySQL binlog
  (Debezium) and let consumers invalidate `[ADVANCED]`.
- *How do you invalidate keys by pattern?* Avoid. Use `SCAN` + `UNLINK` only for rare admin tasks; prefer versioned keys.
- *What do you do if the invalidation fails?* The TTL bounds staleness; log and alert on failures; consider retrying the
  delete via a job.

**Common mistakes**

- Updating DB and cache in the "wrong" order or updating the cache value instead of deleting.
- No TTL, relying on perfect invalidation.
- Forgetting some derived keys (list pages, search, per-user variants).
- Using `KEYS` for invalidation.
- Caching entities for different users under the same key.

**Revision notes**

- TTL = safety net. Write DB, then DEL. Version keys for families.
- The stale-set race; mitigations: short TTL, delayed double delete, version check, do not cache critical data.
- No atomicity between cache and DB: choose acceptable staleness.

### 4.5 Redis in tests and operations `[ESSENTIAL]`

- **Unit tests**: inject a fake cache/redis (as above). Fast and deterministic.
- **Integration tests**: run a real Redis in Docker (`redis:7`) and use a distinct logical DB or key prefix per test
  run; flush only YOUR keys in `afterEach` (`redis.flushdb()` is fine on a dedicated test instance, never on shared
  ones). Close with `await redis.quit()` in `afterAll` so the test process can exit.
- **Observability**: log hit/miss at `debug`, export hit ratio as a metric; Redis `INFO stats` shows `keyspace_hits`,
  `keyspace_misses`, `evicted_keys`, `used_memory`; `SLOWLOG GET` finds slow commands; `MONITOR` is for brief debugging only (it
  is expensive).
- **Security**: Redis must not be exposed to the internet; use a private network, `requirepass`/ACLs, TLS for
  managed services. A famous class of breaches is "open Redis on a public IP".
- **Serialization**: JSON is fine; keep values small; remember `Date` becomes a string after `JSON.parse`.

### Day 4 wrap-up

**Key concepts to remember**

- Redis: in-memory, single-threaded atomic commands, data structures, TTL, eviction, optional persistence.
- ioredis: handle `error` events; cache client fails fast; `SCAN` not `KEYS`; `UNLINK`.
- Cache-aside with TTL + jitter, negative caching, single-flight, fail open.
- Stampede vs penetration vs avalanche and their defenses.
- Invalidation: TTL safety net, delete on write (DB first), version keys, the stale-set race.
- Do not cache money-critical or per-user data under shared keys.

**Five revision questions**

1. Walk through cache-aside for a read and for a write. Why delete instead of update on write?
2. Define cache stampede, penetration and avalanche, with one fix for each.
3. Why can a single Redis command be considered atomic, and what is the downside of that single thread?
4. Describe the race where the cache ends up with stale data even though you invalidated it. How do you reduce it?
5. Which eviction policy and persistence would you use for a cache Redis versus a queue Redis, and why?

**Practical coding task**

Add caching to the product listing in `orders-api`: `GET /products?category=&page=` cached with a versioned key
(family `products`), `GET /products/:id` with cache-aside, `PUT /products/:id` that updates MySQL, deletes the entity
key and bumps the version. Write Vitest tests with a fake redis proving: (a) the second identical list request does not
call the repo, (b) after a PUT the next list request calls the repo again, (c) a Redis failure still returns data from the repo.
Then run autocannon (Day 6) with and without the cache and record requests/sec and p99.

**Self-assessment checklist**

- [ ] I can explain Redis single-threading and its consequence for commands like KEYS.
- [ ] I can pick a Redis data type for counters, sessions, leaderboards and locks.
- [ ] I can write `getOrSet` with TTL jitter and negative caching from memory.
- [ ] I can explain stampede, penetration, avalanche and the stale-set race.
- [ ] I know the versioned-key trick for invalidating lists.
- [ ] I know why a cache client must handle `error` events and fail open.

---

## Day 5 - Background jobs and queues (BullMQ), graceful shutdown (Day 40)

**Learning objectives**

By the end of today you should be able to:
1. Explain when to move work out of the request cycle into a background job, and what at-least-once delivery means.
2. Use BullMQ: Queue, Worker, retries with backoff, delayed jobs, concurrency, dedupe by `jobId`, events.
3. Write idempotent job processors and explain the stalled-job problem and the outbox pattern.
4. Implement graceful shutdown: SIGTERM/SIGINT, readiness flip, `server.close()`, drain workers, close Redis and the MySQL pool.
5. Explain liveness vs readiness, the container PID 1 / signal-forwarding trap, and PM2 kill timeout.
6. Test a shutdown sequence.

Suggested time: 50 min queues and BullMQ, 15 min outbox and idempotent workers, 40 min graceful shutdown, 15 min tests.

### 5.1 Background jobs: why and the concepts `[ESSENTIAL]`

**Concept**

Har kaam request-response ke andar nahi hona chahiye. Agar `POST /orders` ke andar tum email bhejo, invoice PDF
banao, warehouse API call karo, to user 6 second wait karega, aur agar email provider down hai to order hi fail
ho jaayega. Better: order save karo, ek **job** queue mein daalo, user ko turant 201 do, aur ek alag **worker** wo
kaam peeche se kare, retries ke saath.

Parts:

- **Producer**: code that enqueues a job (your API).
- **Queue / broker**: durable storage of pending jobs (Redis for BullMQ; RabbitMQ, SQS, Kafka are others, Week 7).
- **Worker / consumer**: separate process (or same process) that takes jobs and runs a **processor** function.
- **Job**: small JSON payload (ids, not whole objects) + options (attempts, delay, priority).

When to use a queue: slow work (PDF, image resize, emails, SMS), unreliable third parties, work that should be retried,
scheduled/delayed work (reminders, expiring a pending payment after 15 min), spike smoothing (queue absorbs bursts,
workers drain at a safe rate), fan-out (send 10,000 notifications).

When NOT to: work the user must see the result of in the same response, trivial fast work, or when you cannot tolerate
eventual completion.

**Why it matters**

"How do you handle long-running tasks?" "How do you send emails without slowing the API?" Answer: queue + worker + retries +
idempotent processors. Delivery guarantee vocabulary is a favourite: **at-most-once** (may lose, never duplicate),
**at-least-once** (never lose, may duplicate; the practical default), **exactly-once** (not achievable end-to-end;
simulate with at-least-once + idempotency).

**Internal working: BullMQ**

- BullMQ stores jobs in Redis using lists, sorted sets and hashes, and moves jobs between states with **Lua scripts**
  (atomic): `wait` -> `active` -> `completed` or `failed`; `delayed` (sorted set by due time); `prioritized`; `paused`.
- A worker blocks on Redis waiting for a job (needs a dedicated blocking connection), gets the job, takes a **lock** on it,
  and **renews the lock** periodically (`lockDuration`, default 30s) while the processor runs. If the worker dies or its event loop is blocked
  so long that the lock is not renewed, another worker detects the job as **stalled** and re-queues it. => the job can run
  TWICE. That is why processors must be idempotent, and why CPU-heavy work must not block the event loop in the worker (use
  worker threads / a sandboxed processor / a separate process).
- Failed attempts: with `attempts: 5` and a `backoff`, BullMQ moves the job to `delayed` and retries later. After the last
  attempt it lands in the `failed` set (BullMQ's "dead letter" state; you can inspect or retry it; some teams also copy to a
  separate DLQ queue for alerting).
- Config requirement: the Redis used by BullMQ must have `maxmemory-policy noeviction` (see Day 4). Worker and QueueEvents connections need
  `maxRetriesPerRequest: null` in ioredis (blocking commands). Do not reuse the fail-fast cache connection from Day 4.

`src/lib/queue.js`:

```js
import { Redis } from 'ioredis';
import { Queue, Worker, UnrecoverableError } from 'bullmq';
import { randomInt } from 'node:crypto';
import { logger } from '../logger.js';
import { getRequestId, runWithContext } from '../context.js';

export function createQueueConnection(url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379') {
  const connection = new Redis(url, { maxRetriesPerRequest: null });   // REQUIRED for Worker (blocking commands)
  connection.on('error', (err) => logger.warn({ err: err.message }, 'queue redis error'));
  return connection;
}

export const QUEUE_NAMES = { emails: 'emails' };

export function createEmailQueue(connection) {
  return new Queue(QUEUE_NAMES.emails, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'custom' },                    // uses the worker's backoffStrategy below (full jitter)
      removeOnComplete: { age: 3600, count: 1000 },   // keep only recent completed jobs, or Redis memory grows
      removeOnFail: { age: 7 * 24 * 3600 },           // keep failures a week for inspection
    },
  });
}

// Producer helper: enqueue with the correlation id and a dedupe jobId.
export async function enqueueReceiptEmail(queue, { orderId, email }) {
  return queue.add(
    'send-receipt',
    { orderId, email, requestId: getRequestId() },    // small payload: ids, not whole objects
    { jobId: `receipt-${orderId}` },                  // same jobId while the job exists -> BullMQ ignores the duplicate add
  );
}

// Delayed job example: cancel unpaid order after 15 minutes
export function scheduleUnpaidOrderCheck(queue, orderId) {
  return queue.add('check-unpaid', { orderId }, { delay: 15 * 60 * 1000, jobId: `unpaid-${orderId}` });
}

export function createEmailWorker(connection, { emailProvider, receiptRepo }) {
  const worker = new Worker(
    QUEUE_NAMES.emails,
    async (job) =>
      // Reopen the correlation context so logs inside the job carry the original request id (Day 2).
      runWithContext({ requestId: job.data.requestId, jobId: job.id }, async () => {
        logger.info({ name: job.name, attempt: job.attemptsMade + 1 }, 'job started');

        if (job.name === 'send-receipt') {
          const { orderId, email } = job.data;
          if (!email?.includes('@')) {
            // A retry cannot fix bad data: fail permanently, skip remaining attempts.
            throw new UnrecoverableError('invalid email in job payload');
          }
          // IDEMPOTENT processing: at-least-once delivery means this may run twice.
          const first = await receiptRepo.markSent(orderId);         // INSERT IGNORE into receipts_sent(order_id UNIQUE)
          if (!first) {
            logger.info({ orderId }, 'receipt already sent, skipping duplicate');
            return { skipped: true };
          }
          try {
            await emailProvider.send({ to: email, template: 'receipt', orderId, idempotencyKey: `receipt-${orderId}` });
          } catch (err) {
            await receiptRepo.unmark(orderId);                       // release the claim so the retry can send
            throw err;                                               // BullMQ schedules the retry
          }
          return { sent: true };
        }

        throw new UnrecoverableError(`unknown job name ${job.name}`);
      }),
    {
      connection,
      concurrency: 5,                                   // up to 5 jobs in parallel in THIS process
      limiter: { max: 20, duration: 1000 },             // at most 20 jobs per second (protect the email provider)
      settings: {
        // Full jitter backoff for attempts: 1s, 2s, 4s, 8s ceilings, capped at 60s
        backoffStrategy: (attemptsMade) => randomInt(0, Math.min(60_000, 1000 * 2 ** (attemptsMade - 1)) + 1),
      },
    },
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id, name: job.name }, 'job completed'));
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, name: job?.name, attemptsMade: job?.attemptsMade, err }, 'job failed'));
  worker.on('error', (err) => logger.error({ err }, 'worker error'));   // connection-level problems; without a listener = crash

  return worker;
}
```

Run the worker as a **separate process** (`src/worker.js`, its own PM2 app / container) so slow jobs and CPU spikes do not
affect API latency, and so you can scale workers independently of the API.

```js
// src/worker.js
import mysql from 'mysql2/promise';
import { createQueueConnection, createEmailWorker } from './lib/queue.js';
import { logger } from './logger.js';

const pool = mysql.createPool({ /* ... */ connectionLimit: 5 });
const connection = createQueueConnection();
const worker = createEmailWorker(connection, { emailProvider, receiptRepo: createReceiptRepo(pool) });

async function shutdown(signal) {
  logger.info({ signal }, 'worker shutting down');
  await worker.close();          // waits for ACTIVE jobs to finish, stops taking new ones
  await connection.quit();
  await pool.end();
  process.exit(0);
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
```

BullMQ features to know (names are enough for the interview, details in docs):

| Feature | Option |
|---------|--------|
| Retries | `attempts`, `backoff: { type: 'exponential', delay }` or custom |
| Delay | `delay` ms |
| Priority | `priority` (lower number = higher priority) |
| Concurrency | Worker `concurrency` |
| Rate limiting | Worker `limiter: { max, duration }` |
| Dedupe | `jobId` (ignored while a job with that id still exists; removal on complete frees the id) |
| Recurring / cron | `queue.upsertJobScheduler(...)` in recent BullMQ 5.x; older versions used `repeat: { pattern }`. Version-dependent: check the docs |
| Flows | parent/child jobs (`FlowProducer`) |
| Observability | `QueueEvents`, `queue.getJobCounts()`, Bull Board UI |

**The producer-side trap: DB commit vs enqueue (outbox pattern)** `[ADVANCED]`

```
BEGIN; INSERT order; COMMIT;   then   queue.add('send-receipt')
```
If the process crashes between COMMIT and `add`, the order exists but no job ever runs (lost). If you enqueue BEFORE commit,
the worker may run before the row is visible (or the transaction rolls back and the job refers to nothing). You cannot
make MySQL and Redis commit atomically. **Transactional outbox**: in the SAME DB transaction insert the order and a row in
`outbox_events(id, type, payload, published_at NULL)`. A small relay process polls unpublished rows, enqueues them, and marks them
published (at-least-once, so consumers stay idempotent). Simple version for this level: enqueue after commit and run a
periodic "reconcile" job that finds orders missing receipts.

**Frontend connection**

Like `requestIdleCallback`, a web worker or "optimistic UI + background sync": the user-visible action returns fast and the
heavy work happens elsewhere, with retries if it fails. Client-side retry queues (offline-first apps, service worker
background sync) are the same idea; the delivery-guarantee and idempotency concerns are identical.

**Real-world scenario**

Marketplace checkout: API saves the order and enqueues three jobs: `send-receipt`, `notify-seller`, `update-search-index`.
User gets 201 in 80ms. The email provider is down for 10 minutes: jobs retry with backoff and jitter, and all
emails go out when it recovers; no order was lost or delayed. During a flash sale 50,000 jobs pile up, the queue absorbs
the spike, and workers drain it at the rate-limited pace.

**Interview answer:**
"I move slow or unreliable work, like emails, PDFs and third-party calls, out of the request path into a queue, using BullMQ
on Redis. The API enqueues a small payload and returns immediately; separate worker processes consume the jobs with
configured concurrency, retries with exponential backoff, and a rate limiter. Delivery is at-least-once, so processors
must be idempotent, for example by recording a unique processed marker or by passing an idempotency key to the provider.
I also watch for stalled jobs caused by blocked event loops, set retention on completed jobs, and consider an outbox
table when I need the database write and the job enqueue to be reliably consistent."

**Follow-up questions**

- *Queue vs cron job?* Cron triggers by time; a queue is for work produced by events, with retries and backpressure. They combine (a repeatable job).
- *What if the worker crashes mid-job?* The job lock expires, BullMQ marks it stalled and another worker re-runs it. Hence idempotency.
- *Redis down?* Producers cannot enqueue: either fail the request, or fall back (outbox table drains later). Define the behavior.
- *How do you do dead letter handling?* After max attempts jobs stay in the failed set; alert on failed count, inspect, fix, retry
  (`job.retry()`), or move to a dedicated DLQ queue.
- *How do you ensure ordering?* Queues are mostly FIFO but concurrency breaks ordering; use concurrency 1, group keys (BullMQ Pro), or
  design for unordered processing.
- *BullMQ vs RabbitMQ/SQS/Kafka?* BullMQ is simple when you already run Redis and need jobs with retries/delays in Node. RabbitMQ/SQS are
  dedicated brokers with stronger durability and routing; Kafka is a log for high-throughput event streaming (Week 7).
- *How do you scale workers?* Run more worker processes/containers; Redis coordinates; tune concurrency per process and the provider limit.
- *Poison message?* A job that always fails: cap attempts, use `UnrecoverableError` for non-retryable, alert on failed.

**Common mistakes**

- Huge payloads (store the id and read fresh data in the worker; the data may have changed since enqueue).
- Non-idempotent processors (double emails, double charges).
- Blocking the worker's event loop (stalled jobs, duplicates).
- Not setting `removeOnComplete` (Redis fills up) or using an evicting Redis policy.
- Fire-and-forget `queue.add` without handling failure.
- Reusing the cache Redis connection (`maxRetriesPerRequest` must be null for workers).
- Running workers inside the API process with no isolation.
- No graceful shutdown for workers (jobs interrupted mid-way).

**Revision notes**

- Producer -> queue (Redis) -> worker; at-least-once; idempotent processors.
- attempts + backoff (with jitter) + `UnrecoverableError`; failed set = DLQ; `jobId` dedupe.
- Stalled jobs = lock not renewed -> re-run. Separate worker process. `noeviction` Redis.
- Outbox pattern for DB + queue consistency.

### 5.2 Graceful shutdown `[ESSENTIAL]`

**Concept**

Server ko band karte waqt (deploy, autoscale down, crash restart) abruptly kill karoge to in-flight requests beech mein
toot jaayengi: payment half-done, user ko connection reset, DB connection leak. **Graceful shutdown** = naye kaam lena band
karo, jo chal raha hai usse poora hone do (time limit ke saath), resources saaf-suthre close karo, fir exit.

**Why it matters**

Har deploy ek shutdown hai. Without graceful shutdown, every release causes a burst of 502s and half-written work. Interviewers ask
"What happens when you deploy while requests are in flight?" and "What does SIGTERM do?"

**Internal working**

Signals (POSIX; Linux servers/containers):

| Signal | Sent by | Catchable? | Meaning |
|--------|---------|------------|---------|
| `SIGINT` | Ctrl+C; PM2 default for stop/reload | yes | interrupt |
| `SIGTERM` | `kill`, `docker stop`, Kubernetes, systemd | yes | polite termination request |
| `SIGKILL` | after grace period expires (Docker 10s default, Kubernetes `terminationGracePeriodSeconds` 30s default, PM2 `kill_timeout`) | NO | instant kill, no cleanup |
| `SIGHUP` | terminal closed | yes | often used for reload |

Node has no default handler that waits for work: with no handler, SIGTERM terminates the process immediately. If you register a
handler with `process.on('SIGTERM', fn)`, Node runs it and does not exit on its own: YOU must drain and exit.
Windows note: Windows has no real SIGTERM; `process.kill(pid, 'SIGTERM')` force-terminates and only Ctrl+C/Ctrl+Break map to `SIGINT`/`SIGBREAK`. Develop on
Windows, but test shutdown on Linux/WSL/Docker.

`server.close()`:
- Stops accepting NEW connections and calls its callback when ALL existing connections end.
- Existing keep-alive connections that are idle can keep it from closing for a long time. Since Node 19 `server.close()` also closes idle connections;
  on Node 18.2+ call `server.closeIdleConnections()` yourself. `server.closeAllConnections()` (18.2+) force-closes everything (use after the deadline).
- Requests already being processed finish normally (the response is sent), as long as the process stays alive.

**The correct order**

```
1. Receive SIGTERM
2. Set shuttingDown = true. Readiness endpoint now returns 503. Add "Connection: close" to responses.
3. Wait a few seconds (drain delay) so the load balancer/ingress notices and stops routing new traffic
4. server.close(): stop accepting; wait for in-flight requests to finish
5. Stop consumers: await worker.close() (finishes active jobs)
6. Close dependencies in reverse order of use: queue connections, Redis (quit), DB pool (end)
7. Flush logs, process.exit(0)
Safety: a force timer (e.g. 15s, below the platform's kill timeout) logs and exits with code 1
```

Why step 3? Load balancers detect an unhealthy instance only after a health-check interval. During that window new requests are still sent to you. If
you close the listener immediately those requests get connection refused (502). A short drain delay (3-10s) with readiness already failing removes that gap.
In Kubernetes this is often done with a `preStop` sleep.

`src/server.js` (composition root, complete):

```js
import { setTimeout as sleep } from 'node:timers/promises';
import mysql from 'mysql2/promise';
import { createApp } from './app.js';
import { createCacheRedis } from './lib/redis.js';
import { createQueueConnection, createEmailQueue } from './lib/queue.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT ?? 3000);
const DRAIN_MS = Number(process.env.SHUTDOWN_DRAIN_MS ?? 5000);     // time for the LB to notice we are not ready
const FORCE_EXIT_MS = Number(process.env.SHUTDOWN_FORCE_MS ?? 15000);

const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  waitForConnections: true, connectionLimit: 10, queueLimit: 50, connectTimeout: 5000,
});
const redis = createCacheRedis();
const queueConnection = createQueueConnection();
const emailQueue = createEmailQueue(queueConnection);

let shuttingDown = false;
const app = createApp({ /* orderService, verifyToken, pool, ... */ isReady: () => !shuttingDown });

const server = app.listen(port, () => logger.info({ port }, 'server listening'));
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

async function shutdown(reason, exitCode = 0) {
  if (shuttingDown) return;                 // signals can arrive twice (Ctrl+C twice, PM2 + Docker)
  shuttingDown = true;
  logger.info({ reason }, 'shutdown started');

  const force = setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    server.closeAllConnections();
    process.exit(1);
  }, FORCE_EXIT_MS);
  force.unref();                            // the timer itself must not keep the process alive

  try {
    await sleep(DRAIN_MS);                  // readiness is already 503 here; wait for the LB to stop sending traffic
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));   // wait for in-flight requests
      server.closeIdleConnections();                            // do not wait on idle keep-alive sockets
    });
    logger.info('http server closed');

    await emailQueue.close();               // producer side
    await queueConnection.quit();
    await redis.quit();                     // QUIT = flush pending replies then close (disconnect() would drop them)
    await pool.end();                       // waits for connections in use to be released, then closes them
    logger.info('shutdown complete');
    process.exit(exitCode);
  } catch (err) {
    logger.error({ err }, 'error during shutdown');
    process.exit(1);
  }
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => { logger.fatal({ err: reason }, 'unhandledRejection'); shutdown('unhandledRejection', 1); });
process.on('uncaughtException', (err) => { logger.fatal({ err }, 'uncaughtException'); shutdown('uncaughtException', 1); });
```

Inside `createApp`, register this as the FIRST middleware so keep-alive clients are told to reconnect elsewhere while draining:

```js
app.use((req, res, next) => {
  if (!isReady()) res.set('Connection', 'close');
  next();
});
```

Readiness vs liveness endpoints (in `createApp`):

```js
// Liveness: "is the process alive and not deadlocked?" If this fails, the orchestrator RESTARTS the container. Keep it trivial.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Readiness: "should I receive traffic right now?" If this fails, the LB stops routing but does NOT restart.
app.get('/ready', async (req, res) => {
  if (!isReady()) return res.status(503).json({ status: 'shutting_down' });
  try {
    await pool.query('SELECT 1');           // optional dependency check; keep it cheap and with a timeout
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'db_unavailable' });
  }
});
```

Do not put a deep dependency check in liveness: a DB outage would make the orchestrator restart every healthy API container in a loop and make things worse.

**Platform specifics**

- **PM2** (common on a single EC2): `pm2 stop/reload` sends `SIGINT` first, then `SIGKILL` after `kill_timeout` (default 1600 ms!). Set
  `kill_timeout: 15000` in `ecosystem.config.cjs` so your shutdown has time, and handle BOTH `SIGINT` and `SIGTERM` (as above). For zero-downtime reload in cluster mode use `wait_ready: true` and call `process.send?.('ready')` after listening.
- **Docker**: use the exec form `CMD ["node", "src/server.js"]`. `CMD npm start` (shell form) makes npm/sh PID 1 and signals may never reach Node,
  so `docker stop` waits 10s and SIGKILLs. Use `docker run --init` or `tini` to reap zombies/forward signals. Match `stop_grace_period` to your force timeout.
- **Kubernetes**: SIGTERM + endpoint removal happen concurrently; add a `preStop` sleep or your own drain delay; keep your force timeout below `terminationGracePeriodSeconds`.
- **Rolling deploys**: new instance becomes ready, old instance drains. Graceful shutdown + readiness probe = zero-downtime releases.

Testing the shutdown (run on Linux/CI; Windows cannot deliver SIGTERM to a child):

```js
import { it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

it('finishes an in-flight request after SIGTERM and exits 0', async () => {
  const child = spawn('node', ['test/fixtures/slowServer.js'], { env: { ...process.env, PORT: '4567', SHUTDOWN_DRAIN_MS: '100' } });
  await sleep(500);                                           // wait until it listens (or parse its stdout for "listening")

  const inFlight = fetch('http://127.0.0.1:4567/slow');       // fixture responds after 1500ms
  await sleep(200);
  child.kill('SIGTERM');

  const res = await inFlight;
  expect(res.status).toBe(200);                               // the request was NOT cut off

  const [code] = await once(child, 'exit');
  expect(code).toBe(0);
});
```

**Frontend connection**

React `useEffect` cleanup: when a component unmounts you abort fetches, clear timers and unsubscribe to avoid leaks and updates on dead components.
Graceful shutdown is the effect cleanup of the whole process: close listener (unsubscribe), finish in-flight work, release resources.

**Real-world scenario**

Payment confirmation endpoint receives a request at the very moment a deploy rolls the instance. Without graceful shutdown the process dies after the
gateway charged the card but before the order row is written: money taken, no order (and the user's client retries into an inconsistent state). With
graceful shutdown the request completes, the pool drains, and only then the process exits; new requests were already going to the other instances.

**Interview answer:**
"On SIGTERM I stop taking new work and finish what is in flight, then exit cleanly. Concretely: flip the readiness endpoint to 503 so the load balancer
stops routing to me, wait briefly, call server.close() so in-flight requests complete, close workers so active jobs finish, then close Redis and end the MySQL pool,
and exit 0. I add a force timer shorter than the platform's kill timeout, a guard against double signals, and I handle both SIGTERM and SIGINT since PM2 uses SIGINT.
For unhandled rejections and uncaught exceptions I log and run the same shutdown path with a non-zero exit code so the process manager restarts a clean process."

**Follow-up questions**

- *Why not just `process.exit()` on SIGTERM?* It kills in-flight requests and leaks connections and half-done work.
- *What does `server.close()` actually do?* Stops accepting new connections, waits for existing ones to end; keep-alive idle sockets can delay it, so close idle connections.
- *Liveness vs readiness?* Liveness = restart me if dead; readiness = send me traffic or not. Shutdown flips readiness, not liveness.
- *What if shutdown takes too long?* Force timer, `closeAllConnections()`, exit non-zero; the platform will SIGKILL anyway.
- *What about long-lived connections (WebSockets/SSE)?* Notify clients and close them with a code that tells them to reconnect elsewhere; set a deadline.
- *Why `pool.end()`?* Releases MySQL connections cleanly (otherwise the server holds them until its timeout, which can exhaust `max_connections` during rolling deploys) and lets the process exit.
- *Why did my process not exit even though I closed the server?* Open handles: DB pool, Redis, timers, workers. `process.exit()` as the last step, and find leaks with `why-is-node-running` or `process.getActiveResourcesInfo()`.

**Common mistakes**

- No SIGTERM handler (default kills immediately).
- Calling `process.exit()` before cleanup finishes.
- Only handling SIGINT while the platform sends SIGTERM (or the reverse with PM2).
- Dockerfile with `CMD npm start`; signals do not reach Node.
- Ignoring the load balancer delay (502s at deploy).
- Shutdown with no timeout: hangs, then gets SIGKILLed anyway.
- Continuing to run after `uncaughtException`.
- Closing the DB pool before the HTTP server has drained.

**Revision notes**

- SIGTERM = polite, SIGKILL = uncatchable. PM2 sends SIGINT; `kill_timeout`.
- Order: readiness 503 -> drain delay -> `server.close()` -> workers -> queue/Redis/pool -> exit; force timer; double-signal guard.
- Liveness trivial, readiness deep. Docker exec-form CMD / `--init`.
- Unhandled errors: log + same shutdown path, exit 1.

### Day 5 wrap-up

**Key concepts to remember**

- Queues decouple slow/unreliable work; producer -> Redis -> worker; at-least-once => idempotent processors.
- BullMQ: attempts, backoff (add jitter), delay, concurrency, limiter, `jobId` dedupe, `UnrecoverableError`, failed set as DLQ.
- Worker `maxRetriesPerRequest: null`, `noeviction` Redis, separate worker process, stalled jobs from a blocked event loop.
- Outbox pattern solves DB-commit vs enqueue consistency.
- Graceful shutdown sequence and platform details (PM2 SIGINT/kill_timeout, Docker exec-form, readiness probes).

**Five revision questions**

1. Why is queue delivery at-least-once and what must the processor do about it?
2. What is a stalled job in BullMQ and what typically causes it?
3. Explain the problem between committing to MySQL and enqueuing a job, and one solution.
4. List the steps of graceful shutdown in order and the reason for each.
5. Why does `CMD npm start` in a Dockerfile break graceful shutdown?

**Practical coding task** (see also `EX-IDEM-01`)

Add `send-receipt` to `orders-api`: enqueue after the order is saved (with `requestId` in the payload), implement the worker with an idempotent processor backed by a `receipts_sent(order_id UNIQUE)` table, then
implement full graceful shutdown in `server.js` and `worker.js`. Write: (a) a unit test for the processor proving a duplicate job sends one email (fake provider + fake repo), and (b) a shutdown test
like the one above. Demonstrate by sending SIGTERM while autocannon (Day 6) is running: zero failed requests should be reported.

**Self-assessment checklist**

- [ ] I can explain producer, queue, worker, and at-least-once vs exactly-once.
- [ ] I can configure a BullMQ job with retries, backoff, delay and dedupe.
- [ ] I can explain stalled jobs and why processors must be idempotent.
- [ ] I can write the graceful shutdown sequence from memory.
- [ ] I know liveness vs readiness and why shutdown flips readiness.
- [ ] I know the PM2 and Docker pitfalls for signals.

---

## Day 6 - Debugging slow APIs and memory leaks, load testing, production failure playbook (Day 41)

**Learning objectives**

By the end of today you should be able to:
1. Run a structured investigation of a slow endpoint: measure where time goes before changing anything.
2. Detect event loop blocking with `monitorEventLoopDelay`, and profile CPU with `--inspect`, `--cpu-prof` and clinic.
3. Diagnose a memory leak using `process.memoryUsage()`, heap snapshots and the three-snapshot technique; name the common leak causes.
4. Load test with autocannon, read latency percentiles and throughput, and avoid common benchmarking mistakes.
5. Apply a "production failure diagnosis playbook" to twelve common incident symptoms (5xx spike, slow with low CPU, OOM, connection exhaustion, duplicates, backlog, and so on).
6. Answer "walk me through how you would debug X in production" in a clean, ordered way.

Suggested time: 30 min slow-API method + profiling, 30 min memory leaks, 25 min autocannon, 35 min playbook.

References: Week 2 Day 6 notes (GC and leaks theory), Week 4 Day 6 notes (EXPLAIN and slow queries), Week 4 Day 5 notes (pool, deadlocks), `Q-PERF-xx` and `Q-PROD-xx` in the question bank, `EX-DEBUG-01` in the exercises.

### 6.1 Debugging a slow API `[ESSENTIAL]`

**Concept**

"API slow hai" ek symptom hai, cause nahi. Pehle **measure** karo, guess mat karo. 90 percent cases mein slowness in jagahon se aati hai:
(1) slow/missing-index SQL ya N+1 queries, (2) slow third-party calls, (3) connection pool wait, (4) CPU-heavy synchronous code jo event loop block karta hai,
(5) bahut bada payload / serialization, (6) GC pressure ya memory swap.

**Why it matters**

"Your endpoint takes 5 seconds, what do you do?" is probably the most common production question. A structured answer separates
juniors from mid-level engineers. Also: your frontend experience (Chrome Performance tab, Network waterfall) transfers directly: it is the same
"find the slow part of the waterfall" thinking, just on the server.

**Internal working: the method**

```
1. Define slow: which endpoint, which percentile (p50 vs p99), since when, for whom, vs. what baseline?
2. Reproduce / measure: logs (pino-http responseTime), APM, or autocannon on staging with realistic data.
3. Break the request into stages and time each: auth, validation, DB queries, cache, external calls, serialization.
4. Classify:  waiting (I/O: DB, network, pool, lock)   vs   working (CPU: event loop busy)
5. Look at the right tool for the class (below), form ONE hypothesis, change ONE thing, re-measure.
```

The key diagnostic question: **is the CPU busy or is the process waiting?**

| Observation | Meaning | Look at |
|-------------|---------|---------|
| Latency high, process CPU low | Waiting on I/O | DB (slow query log, EXPLAIN, locks), pool queueing, external API latency, Redis, DNS |
| Latency high, one CPU core near 100 percent, event loop delay high | Event loop is blocked by JS work | CPU profile: sync crypto, huge JSON, regex, loops, sync fs |
| Slow only under concurrency, fast alone | Contention: pool size, locks, single-threaded CPU saturation | Pool waiting counts, lock waits, `Threads_connected`, load test |
| Slow only for some users/inputs | Data-dependent: missing index for that filter, big tenant, pagination depth | Query plan with that user's parameters |
| Gets slower over hours/days | Leak, table growth, cache churn | Memory trend, table sizes, index use |
| Slow right after deploy | Code or config change | Diff, rollback test |

**Cheap instrumentation: time the stages**

```js
// src/lib/timing.js
import { performance } from 'node:perf_hooks';
import { logger } from '../logger.js';

export async function timed(label, fn, extra = {}) {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const durationMs = Math.round(performance.now() - start);
    // warn on slow stages so they are easy to find in logs; debug otherwise
    logger[durationMs > 200 ? 'warn' : 'debug']({ stage: label, durationMs, ...extra }, 'stage timing');
  }
}

// usage
const user = await timed('db.getUser', () => userRepo.findById(id));
const rates = await timed('http.shippingRates', () => shippingApi.get(pincode), { pincode });
```

Also send a standard `Server-Timing` header in staging so Chrome DevTools shows server stages in the Network tab (frontend tool, backend data):

```js
res.set('Server-Timing', `db;dur=${dbMs}, ext;dur=${extMs}`);
```

**Detect a blocked event loop**

```js
// src/lib/loopMonitor.js
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { logger } from '../logger.js';

export function startLoopMonitor(intervalMs = 10_000) {
  const h = monitorEventLoopDelay({ resolution: 20 });   // samples how late a 20ms timer fires; values in NANOSECONDS
  h.enable();
  let lastElu = performance.eventLoopUtilization();

  const timer = setInterval(() => {
    const elu = performance.eventLoopUtilization(lastElu);   // utilization since the last tick (0..1)
    lastElu = performance.eventLoopUtilization();
    logger.info({
      loopDelayMs: { p50: h.percentile(50) / 1e6, p99: h.percentile(99) / 1e6, max: h.max / 1e6 },
      loopUtilization: Number(elu.utilization.toFixed(2)),
    }, 'event loop');
    h.reset();
  }, intervalMs);
  timer.unref();
  return () => { clearInterval(timer); h.disable(); };
}
```

Reading it: p99 loop delay above ~100ms, or utilization near 1.0, means JS is hogging the thread: every request is waiting in line
behind it (that is why ONE slow synchronous operation slows ALL endpoints, not just its own).

**Typical event-loop blockers in backend code**

- `bcrypt.hashSync`, `crypto.pbkdf2Sync`, `scryptSync` (use async versions: they run in the libuv thread pool; Week 2 Day 2).
- `JSON.parse`/`JSON.stringify` of multi-MB payloads (synchronous, O(n)).
- `fs.readFileSync` in a request path; big synchronous loops/sorts over 100k+ items.
- Catastrophic regex backtracking (ReDoS) on user input.
- Building giant arrays/strings, heavy templating, PDF/Excel generation in the API process.
- `await`ing inside a loop does NOT block the loop (it serializes the work and makes it slow, which is different: use `Promise.all` or batching).

Fix patterns: move CPU work to `worker_threads` or a job queue (Day 5), stream instead of buffering, paginate, async crypto, cache the result.

**Typical waiting-on-I/O causes**

- **N+1 queries**: `for (const order of orders) { await getItems(order.id) }` -> 1 + N queries. Fix with a JOIN or `WHERE order_id IN (?)` (parameterized) and group in memory.
- **Missing/unused index**, `SELECT *`, `OFFSET` pagination deep pages, `LIKE '%x%'` (Week 4 Day 6).
- **Pool exhaustion**: pool of 10, 50 concurrent requests, each holds a connection during slow external calls: requests wait for a free connection. Never hold a DB connection while awaiting an external API.
- **Slow dependency without a timeout** (Day 3).
- **Lock waits** from long transactions.
- **Sequential awaits that could be parallel**: independent calls with `await a(); await b();` -> `await Promise.all([a(), b()])` (limit concurrency to avoid pool overload).

Quick N+1 example and fix:

```js
// BAD: 1 + N queries
const [orders] = await pool.execute('SELECT id, user_id FROM orders WHERE user_id = ? LIMIT 50', [userId]);
for (const o of orders) {
  const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
  o.items = items;
}

// GOOD: 2 queries. mysql2 query() expands an array for IN (?) safely, as bound parameters.
const [orders] = await pool.execute('SELECT id, user_id FROM orders WHERE user_id = ? LIMIT 50', [userId]);
const ids = orders.map((o) => o.id);
const [items] = ids.length
  ? await pool.query('SELECT id, order_id, sku, qty FROM order_items WHERE order_id IN (?)', [ids])
  : [[]];
const byOrder = Map.groupBy(items, (i) => i.order_id);        // Map.groupBy: Node 21+. On Node 20 use a reduce().
for (const o of orders) o.items = byOrder.get(o.id) ?? [];
```

(Using `pool.query` here because `execute` with a prepared statement does not expand an array into a placeholder list. The values are still bound
parameters, not string concatenation: safe from SQL injection. Always add an index on `order_items(order_id)`.)

**Profiling tools** `[ESSENTIAL]` to know they exist, `[ADVANCED]` to use fluently

| Tool | Use | How |
|------|-----|-----|
| `node --inspect` + Chrome DevTools | CPU profile, heap snapshot, live debugging | `node --inspect=127.0.0.1:9229 src/server.js`, open `chrome://inspect`, "inspect", Profiler/Performance/Memory tabs |
| `node --cpu-prof` | CPU profile file for a run | writes `CPU.*.cpuprofile` on exit; open in DevTools Performance/Profiler or VS Code |
| `node --prof` + `node --prof-process` | V8 tick profiler (older, text report) | `node --prof app.js`, then `node --prof-process isolate-*.log` |
| **clinic.js** `doctor`, `flame`, `bubbleprof`, `heapprofiler` | Guided diagnosis | see below |
| `0x` | Flame graphs | `npx 0x src/server.js` |
| `process.memoryUsage()`, `v8.getHeapStatistics()` | Quick memory numbers | in code or a protected admin endpoint |
| Node diagnostic report | JSON snapshot of process state | `node --report-on-signal`, `process.report.writeReport()` |

Clinic workflow (install: `npm i -g clinic`; verify it supports your Node version, since the tool can lag behind new Node releases; if it does not, use `--cpu-prof` and DevTools):

```bash
# Doctor: runs your server, load-tests it with autocannon, then analyses CPU, memory, event loop delay, active handles
npx clinic doctor --on-port 'autocannon -c 50 -d 20 http://localhost:$PORT/orders' -- node src/server.js
# Doctor recommends the next tool. If CPU is the issue: flame graph
npx clinic flame --on-port 'autocannon -c 50 -d 20 http://localhost:$PORT/orders' -- node src/server.js
# If it is async delays / waiting between operations: bubbleprof
npx clinic bubbleprof --on-port 'autocannon -c 50 -d 20 http://localhost:$PORT/orders' -- node src/server.js
```

**Reading a flame graph**: x-axis is NOT time, it is the share of samples; **width = time spent in that function (including children)**; stack depth goes
upward (callers at the bottom). Look for wide flat "plateaus" at the TOP of the graph: they are the functions that actually burn CPU themselves. Wide bars from
node internals like `JSON.stringify`, `bcrypt`, `RegExp` tell you the category of the problem immediately.

**Inspecting production safely**: never expose `--inspect` on a public interface (it is remote code execution). Bind to `127.0.0.1` and use an SSH tunnel; on Linux
you can enable the inspector on a running process with `kill -USR1 <pid>` (it listens on 127.0.0.1:9229). Profiling slows the process a bit and heap snapshots pause it, so take them on ONE instance removed from the load balancer.

**Frontend connection**

Chrome DevTools Performance tab, flame charts and "Long tasks" are the same tools: Node uses V8 and the same DevTools front end. A "long task" blocking the main thread
freezing the UI is exactly an event-loop-blocking function freezing all requests. `Server-Timing` bridges both worlds.

**Real-world scenario**

Seller dashboard `GET /seller/reports` takes 4.5s at p95. Logs: DB stage 80ms, external stage 0ms, but handler total 4.4s and event loop p99 delay 900ms during requests.
Flame graph shows 70 percent of CPU in `JSON.stringify` and a `.sort()` over 400,000 rows loaded with `SELECT *`. Fix: aggregate in SQL (`GROUP BY`) with an index, return only needed columns,
paginate, cache for 60 seconds. p95 drops to 120ms, and other endpoints stop being slow because the loop is no longer hogged.

**Interview answer:**
"I start by measuring rather than guessing: which endpoint, which percentile, since when, and what changed. Then I break the request into stages with timing logs and check whether the process
is waiting or working. If CPU is low and latency is high it is waiting on I/O, so I look at the database with the slow query log and EXPLAIN, for N+1 queries, connection pool wait,
and external calls without timeouts. If one core is pegged and event loop delay is high, JavaScript is blocking the loop, so I take a CPU profile or a flame graph with clinic or --cpu-prof and find the hot function.
I change one thing at a time, re-measure with a load test, and add a metric or alert so I would notice a regression."

**Follow-up questions**

- *How do you know the event loop is blocked?* `monitorEventLoopDelay` / event loop utilization, health-check latency spikes for all endpoints, CPU profile.
- *Why does one slow endpoint make others slow?* Single-threaded event loop: synchronous CPU work delays every other callback, and shared resources (pool, DB) get consumed.
- *Slow only in production?* Data volume (index and plan differ), network latency to DB/third parties, smaller CPU, different config, cold caches, noisy neighbours.
- *What would you add permanently?* Request duration metrics by route, DB query timing, slow query log, event loop lag, alerts on p95/p99.
- *Should you just add more servers?* Scaling out helps throughput for CPU-bound work but does not fix a slow query, lock contention or a missing index, and can overload the DB.

**Common mistakes**

- Optimizing without profiling (guessing).
- Looking only at average latency (hides tail).
- Caching to hide an unindexed query.
- Profiling on a laptop with an empty dataset.
- Holding DB connections across external calls.
- Parallelizing everything with unbounded `Promise.all` (pool/third-party overload).
- Leaving `--inspect` open on a public interface.

**Revision notes**

- Measure first. Waiting (I/O) vs working (CPU) is the first fork.
- Tools: logs/stage timings, slow query log + EXPLAIN, event loop delay, `--inspect`/`--cpu-prof`/clinic, flame graph (width = time).
- Usual suspects: N+1, missing index, pool wait, no timeouts, sync CPU, huge payloads.
- One change at a time, re-measure, add monitoring.

### 6.2 Debugging memory leaks `[ESSENTIAL]` (tooling `[ADVANCED]`)

**Concept**

Memory leak = program memory use jo time ke saath badhti hai aur kabhi wapas nahi girti, kyunki objects ke reference rah gaye hain (isliye garbage collector unhe free nahi kar sakta).
Node mein tum memory manually free nahi karte; GC sirf **unreachable** objects free karta hai. Leak = "unnecessarily reachable" objects.

**Why it matters**

Leaks cause slow degradation, GC pauses (higher latency), then an OOM kill and a restart loop. Interview: "Your Node service restarts every few hours with out-of-memory. What do you do?"

**Internal working (recap of Week 2 Day 6, only what you need here)**

- V8 heap has generations: **young** (new space; frequent, fast "scavenge" GC) and **old** (survivors; slower mark-sweep/compact). Objects that survive a couple of scavenges move to old space.
- `process.memoryUsage()` returns: `rss` (total memory held by the process incl. code, stacks, native), `heapTotal`/`heapUsed` (V8 heap), `external` and `arrayBuffers` (Buffers and native memory outside the V8 heap).
  A growing **heapUsed after GC** points to JS object leaks. Growing **external/arrayBuffers** points to Buffers/streams. Growing **rss** with a flat heap can be native leaks or allocator fragmentation.
- Old-space limit is derived from available memory (in newer Node versions it respects container limits); override with `--max-old-space-size=<MB>`. Hitting it gives
  `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`. A container's cgroup limit can kill the process (exit code 137 = SIGKILL, often OOMKilled) even before the V8 limit.
  Raising the limit only delays a leak; it does not fix one.

**Leak or not? The sawtooth test**

- Healthy: heapUsed rises then DROPS after each major GC (sawtooth), with a flat baseline over hours.
- Leak: the lowest points of the sawtooth (post-GC baseline) keep rising (staircase), under steady traffic.
- Not a leak: memory rises after deploy then plateaus (warm-up caches, JIT, pools). Expected.

Log it periodically (cheap):

```js
// in the same place as the loop monitor
const mu = process.memoryUsage();
logger.info({
  rssMB: Math.round(mu.rss / 1048576),
  heapUsedMB: Math.round(mu.heapUsed / 1048576),
  externalMB: Math.round(mu.external / 1048576),
  arrayBuffersMB: Math.round(mu.arrayBuffers / 1048576),
}, 'memory');
```

**The common leak causes (memorize this list)**

1. **Unbounded in-memory cache or map** keyed by user/request/id with no eviction.
2. **Event listeners added repeatedly** (per request) and never removed. Node warns: `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 listeners added`.
3. **Timers/intervals** never cleared, holding closures alive.
4. **Closures capturing large objects** (e.g. a callback that keeps the whole request/response/body).
5. **Global/module-level arrays** that only grow (logs, metrics buffers, "recent requests", promise lists).
6. **Unbounded queues / in-flight work**: producing faster than consuming; unbounded `Promise.all` over a huge array; not applying stream backpressure (Week 2 Day 5).
7. **Resource leaks** (sockets, DB connections not released, file handles): not heap, but similar symptoms.
8. **Per-request data stored on long-lived objects** (e.g. pushing `req` into an array, ALS store references retained, `app.locals`).

Leaky example and fix:

```js
// LEAK: grows forever. Every distinct userId adds an entry that is never removed.
const profileCache = new Map();

app.get('/profile/:id', async (req, res) => {
  if (!profileCache.has(req.params.id)) {
    profileCache.set(req.params.id, await loadProfile(req.params.id));   // big objects
  }
  res.json(profileCache.get(req.params.id));
});

// LEAK 2: one listener per request on a shared emitter
app.get('/stream', (req, res) => {
  eventBus.on('update', (d) => res.write(`data: ${JSON.stringify(d)}\n\n`));   // never removed when the client disconnects
});
```

Fixes:

```js
// Bounded LRU (Map keeps insertion order, so the first key is the least recently used)
export class LruCache {
  constructor(maxEntries) { this.max = maxEntries; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);          // move to the "most recent" end
    this.map.set(key, value);
    return value;
  }
  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);   // evict the oldest
  }
}
// or better for multi-instance: Redis with TTL (Day 4)

// Remove the listener when the client goes away
app.get('/stream', (req, res) => {
  const handler = (d) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  eventBus.on('update', handler);
  req.on('close', () => eventBus.off('update', handler));
});
```

**Diagnosis workflow with heap snapshots**

Heap snapshot = a full dump of all objects and their references at an instant (a `.heapsnapshot` file you open in Chrome DevTools > Memory).

How to take one:

```js
import v8 from 'node:v8';
// writes Heap-<timestamp>.heapsnapshot in the cwd and returns the filename (synchronous, pauses the process, needs about 2x heap in extra memory)
const file = v8.writeHeapSnapshot();
```

```bash
node --heapsnapshot-signal=SIGUSR2 src/server.js     # then: kill -USR2 <pid>   (Linux/macOS only; Windows has no SIGUSR2)
node --heapsnapshot-near-heap-limit=3 src/server.js  # auto-write snapshots when nearing the heap limit (helps catch OOM cases)
```
Or connect DevTools via `--inspect` and click "Take snapshot" in the Memory tab (works on Windows too).

**Three-snapshot technique** (the standard method):

1. Warm up the service (send some traffic), force a GC if possible (DevTools "collect garbage" button, or `node --expose-gc` and `global.gc()`), take **Snapshot 1** (baseline).
2. Run a controlled batch of the suspected action (e.g. 1,000 requests with autocannon).
3. GC, take **Snapshot 2**. Repeat the SAME batch, GC, take **Snapshot 3**.
4. In DevTools choose Snapshot 3 and the view **"Objects allocated between Snapshot 1 and Snapshot 2"** or the **Comparison** view vs Snapshot 2. Sort by **# Delta** or **Size Delta**. Things that grow by about the same amount each batch are the leak.
5. Click a suspicious constructor (e.g. `(array)`, `Object`, `Closure`, `Map`, your class name), open an instance, and read the **Retainers** panel from bottom to top: it shows the chain of references keeping the object alive (e.g. `Map -> profileCache -> module scope`). That chain is the answer.

Terms: **shallow size** = memory of the object itself; **retained size** = memory that would be freed if the object were removed (the object plus everything only it keeps alive). Sort by retained size to find big holders.

Other tools: `clinic heapprofiler` (allocation flame graphs by call site), DevTools "Allocation instrumentation on timeline" and "Allocation sampling" (show WHERE allocations happen), `memlab` (automated leak finding for browser/Node scenarios) `[ADVANCED]`.

Production-safe approach: (1) check the trend in metrics first, (2) take the snapshot on ONE instance after removing it from the load balancer, because the process pauses for seconds and uses extra memory, (3) restart is an acceptable
mitigation while you investigate (scheduled restarts / `max_memory_restart` in PM2 as a stopgap, clearly labeled as a stopgap), (4) copy the snapshot file off the machine; it contains in-memory data including secrets and PII, so handle it like a credential.

**Frontend connection**

You already know this from the browser: detached DOM nodes, forgotten `addEventListener`/`setInterval` without cleanup in `useEffect`, closures capturing big state, growing global arrays. The DevTools Memory tab, snapshots,
the Comparison view and the Retainers panel are literally the same UI. The cause list is the same; on the server the leak is multiplied by thousands of requests and lasts for weeks of uptime.

**Real-world scenario**

An orders API restarts every ~9 hours with exit code 137 (OOMKilled). Grafana shows a post-GC baseline climbing about 40MB/hour. Three snapshots show ~12,000 new `Object`s per 1,000 requests retained by a `Map` named `requestAudit` in `audit.js`: each request
pushed an audit record including the full request body into a module-level array "to be flushed later", but the flush function had a bug and never ran. Fix: write audit rows to the DB/queue immediately (or flush with a bounded buffer), add a test, and add a
memory alert at 80 percent of the container limit.

**Interview answer:**
"First I confirm it is a leak and not warm-up, by looking at the post-GC heap baseline over time: a staircase means a leak. I check whether it is heapUsed, external or rss that grows. Then I take heap snapshots from one instance taken out of rotation, using the
three-snapshot technique: baseline, run a batch, snapshot, run the same batch, snapshot, and compare to see which object types grow by the same amount each batch. I follow the retainer chain to find the reference that keeps them alive. The usual culprits are unbounded caches or maps,
event listeners added per request, uncleared timers, and module-level arrays. I fix the root cause, for example by bounding the cache with an LRU or TTL, and use a restart policy only as a stopgap."

**Follow-up questions**

- *Heap out of memory vs container OOMKilled?* The first is V8 reaching its own limit (JS error, can log); the second is the kernel/cgroup killing the process (exit 137, no chance to log). Container limit must be larger than the V8 heap plus native/Buffers.
- *Does increasing `--max-old-space-size` fix it?* It only delays a leak; useful if the workload legitimately needs more heap.
- *How do you find which code allocates?* Allocation sampling profile / `clinic heapprofiler`.
- *Can a closure leak memory?* Yes: V8 keeps the context variables a closure references alive for the life of the closure.
- *WeakMap/WeakRef?* `WeakMap` keys do not prevent GC: useful for attaching metadata to objects without leaking; `WeakRef`/`FinalizationRegistry` are rarely needed `[ADVANCED]`.
- *Is a big `external` number a leak?* Possibly Buffers held by streams that are never consumed or ended, or large uploads kept in memory.

**Common mistakes**

- Calling normal heap growth a leak (no baseline comparison).
- Taking a snapshot on the busiest production instance still receiving traffic.
- Reading a single snapshot (needs comparisons).
- Fixing by only raising memory limits or restarting.
- Ignoring `MaxListenersExceededWarning` or silencing it with `setMaxListeners(0)`.
- Sharing heap snapshots in tickets (contain secrets and PII).

**Revision notes**

- Leak = unintended reachability. Staircase baseline after GC.
- `memoryUsage()`: heapUsed vs external vs rss.
- Causes: unbounded map/cache, listeners, timers, closures, global arrays, no backpressure.
- Three snapshots + Comparison view + Retainers. Snapshots pause the process: one instance, out of rotation.

### 6.3 Basic load and performance testing with autocannon `[ESSENTIAL]`

**Concept**

Load test = tumhari API pe artificial traffic bhejna ye dekhne ke liye ki kitne requests/second handle hota hai, latency kya hoti hai (p50/p95/p99), kahan break hota hai (saturation), aur errors kab shuru hote hain.
**autocannon** ek fast Node.js HTTP benchmarking tool hai (CLI + programmatic API). Alternatives: **k6** (scripting scenarios, ramps, thresholds), wrk, Artillery.

**Why it matters**

"How do you know your API can handle 500 requests/second?" You test it. Also used to verify an optimization (before/after), to find the saturation point, and to catch regressions. Interviewers want to hear about percentiles, realistic scenarios and what
you watch besides the load tool's output.

**Internal working**

autocannon opens `-c` concurrent connections and sends requests for `-d` seconds, measuring latency per request in a histogram and counting responses by status. With **pipelining** (`-p`) it sends several requests per connection without waiting
(unrealistic for most real clients; keep at 1 for realism). Key idea: **throughput and latency are linked**. Little's Law: `concurrency = throughput x latency` so `throughput = concurrency / latency`. Example: a MySQL pool of 10 connections and a
20ms average query ceiling is about 10 / 0.020 = 500 queries/second maximum for that pool, no matter how fast Node is. Past the saturation point, extra load does not increase throughput; it only increases latency (queueing) and then errors/timeouts.

**Code and commands**

```bash
npm i -D autocannon

# 1) baseline: health endpoint measures raw framework overhead
npx autocannon -c 50 -d 20 http://localhost:3000/health

# 2) a real read endpoint with auth
npx autocannon -c 50 -d 20 -H "Authorization=Bearer $TOKEN" http://localhost:3000/orders/1

# 3) a write endpoint (POST, JSON body). Each request must be valid; unique idempotency keys avoid replay short-circuits
npx autocannon -c 20 -d 20 -m POST \
  -H "Authorization=Bearer $TOKEN" -H "Content-Type=application/json" \
  -b '{"items":[{"priceInPaise":10000,"qty":1}]}' http://localhost:3000/orders
```

Common flags: `-c` connections (default 10), `-d` duration seconds (default 10), `-p` pipelining (default 1), `-a` fixed number of requests, `-m` method, `-b` body, `-H` header (`name=value`), `-R` fixed overall request rate, `-w` worker threads, `-t` timeout, `-j` JSON output.

Sample output (illustrative numbers, not a benchmark):

```
Running 20s test @ http://localhost:3000/orders/1
50 connections

+---------+-------+-------+-------+-------+----------+---------+--------+
| Stat    | 2.5%  | 50%   | 97.5% | 99%   | Avg      | Stdev   | Max    |
+---------+-------+-------+-------+-------+----------+---------+--------+
| Latency | 9 ms  | 14 ms | 38 ms | 55 ms | 16.2 ms  | 8.1 ms  | 310 ms |
+---------+-------+-------+-------+-------+----------+---------+--------+
| Req/Sec | 2,900 | 3,100 | 3,300 | 3,350 | 3,080    | 120     | 2,880  |
+---------+-------+-------+-------+-------+----------+---------+--------+
61k requests in 20.02s, 20 MB read      (0 non-2xx, 0 errors, 0 timeouts)
```

How to read it: look at **p99** (tail) not only the average, **Req/Sec** (throughput), and most importantly **non-2xx responses, errors, timeouts** (a "fast" result with 40 percent 500s is a failure). Max latency outliers can be GC or a cold start.

Programmatic usage (a repeatable perf smoke test script):

```js
// scripts/loadtest.js
import autocannon from 'autocannon';

const result = await autocannon({
  url: process.env.TARGET ?? 'http://localhost:3000',
  connections: 50,
  duration: 20,
  requests: [
    { method: 'GET', path: '/orders/1', headers: { authorization: `Bearer ${process.env.TOKEN}` } },
  ],
});

console.log({
  rps: result.requests.average,
  p50: result.latency.p50,
  p99: result.latency.p99,
  non2xx: result.non2xx,
  errors: result.errors,
  timeouts: result.timeouts,
});

if (result.non2xx > 0 || result.errors > 0 || result.latency.p99 > 300) {
  console.error('performance budget violated');
  process.exit(1);
}
```

**A sane load-testing procedure**

1. Use a production-like environment and dataset size (an empty table hides missing indexes). Never load test production without a plan, a window and rate limits.
2. Run the load generator on a DIFFERENT machine than the server (it competes for CPU). On a laptop treat numbers as relative, not absolute.
3. Warm up first (JIT, caches, pools), then measure. Discard the first run.
4. Ramp: 10, 50, 100, 200 connections. Find the knee where p99 climbs sharply or errors appear: that is the saturation point.
5. While the test runs, watch the SERVER: CPU per core, event loop delay, heap, DB `Threads_connected`/slow queries/pool wait, Redis ops, error logs. The bottleneck is usually visible there, not in autocannon.
6. Change one thing, re-run the same test, compare percentiles. Keep results in the PR.
7. Test realistic mixes (reads/writes, authenticated, with Redis cache hits and misses), not just `/health`.
8. Remember the **coordinated omission** problem: a closed-loop tool slows down when the server slows down, which hides tail latency. Use fixed-rate mode (`-R`) to model arrival rates, or k6 arrival-rate executors, when you need honest tail numbers `[ADVANCED]`.

**Frontend connection**

Lighthouse and WebPageTest measure one page for one user; a load test measures the server under many users at once. Same vocabulary: percentiles (like Web Vitals p75), budgets (fail the build when exceeded), and "measure before and after".

**Real-world scenario**

Before a festive sale, the team load-tests `POST /orders` at 100 connections. Throughput flat-lines at about 420 req/s and p99 jumps from 80ms to 2.5s while Node CPU is only 35 percent. `SHOW PROCESSLIST` shows 10 busy connections and others waiting: the pool of 10 and a 25ms
transaction cap throughput near 400/s (Little's Law). They fix an unnecessary extra query in the transaction, raise the pool to 25 (within MySQL `max_connections` across all instances), and add a Redis cache for the product lookup: 1,300 req/s and p99 of 90ms.

**Interview answer:**
"I use autocannon or k6 against a production-like environment, with the load generator on a separate machine and realistic requests, including authentication and writes. I ramp up connections to find the saturation point and I look at p95 and p99 latency, throughput, and error rate rather than averages.
While the test runs I watch CPU, event loop delay, memory, database connections and slow queries to find the real bottleneck. I change one variable at a time and compare before and after, and I can add a small load test with a budget to CI to catch regressions."

**Follow-up questions**

- *Why percentiles, not average?* A few very slow requests are invisible in the average but are what users and timeouts experience; p99 shows tail behavior.
- *What is saturation?* The point where adding load no longer increases throughput and latency rises sharply because a resource (CPU, pool, DB, lock) is fully used.
- *Load vs stress vs soak vs spike test?* Load = expected traffic; stress = beyond capacity to see how it fails; soak = long duration to find leaks; spike = sudden jump to test autoscaling/queues.
- *How do you know it is the DB and not Node?* Node CPU and event-loop delay are low while DB connections are busy/queued and query times rise.
- *Why is a `/health` benchmark misleading?* It measures framework overhead only; real endpoints are dominated by DB/network work.
- *How do you load test safely?* Staging, synthetic data, rate-limited, off-peak, never against third-party sandboxes without permission.

**Common mistakes**

- Running the generator and the server on the same machine, or on a laptop on battery.
- Testing with an empty database.
- Reporting average latency or only requests/second.
- Ignoring non-2xx responses.
- Changing several things between runs.
- Benchmarking with pipelining and a trivial endpoint and generalizing.
- Load testing production or third-party services unannounced.

**Revision notes**

- autocannon: `-c`, `-d`, `-m`, `-b`, `-H`; read p99, req/s, non-2xx/errors.
- Little's Law: throughput = concurrency / latency. Saturation = flat throughput, rising latency.
- Separate generator machine, warm-up, realistic data, ramp, watch the server, one change at a time.


### 6.4 Production failure diagnosis playbook `[ESSENTIAL]`

**Concept**

Production incident mein panic sabse bada dushman hai. Ek fixed **process** follow karo taaki tum random commands nahi chalao. Ye section ek playbook hai: pehle general method, fir 12 common symptoms ke liye
"symptom -> first checks -> likely causes -> how to confirm -> fix -> prevent". Interview mein "walk me through how you'd debug X" ka answer yahi structure hai.

**Why it matters**

Mid-level roles mein on-call/incident handling expected hota hai. Interviewers dekhte hain ki tum (a) users ko pehle bachate ho (mitigate), (b) evidence preserve karte ho, (c) data se hypothesis banate ho, (d) root cause fix + prevention karte ho.

#### The general method (use for every incident)

```
1. MITIGATE FIRST   Stop the bleeding: rollback the deploy, disable a feature flag, scale out, shed load, restart a stuck instance.
                    Preserve evidence BEFORE restarting: grab logs, a heap snapshot / diagnostic report, DB processlist.
2. SCOPE            What is broken: all endpoints or one? all users or some? all instances or one? since exactly when?
3. WHAT CHANGED     Deploy, config/env change, traffic spike, data growth, dependency (DB/Redis/3rd party) change, cron/job, certificate/token expiry.
4. GOLDEN SIGNALS   Latency (p50/p95/p99), Traffic (req/s), Errors (rate, by status and route), Saturation (CPU, memory, event loop lag, pool use, DB connections, queue depth, disk).
5. HYPOTHESIZE      List 2-3 likely causes. Test the cheapest/most likely first. Change ONE thing at a time.
6. FIX AND VERIFY   Confirm via metrics that the symptom is gone, not just that the error stopped being visible.
7. PREVENT          Add a regression test, an alert, a limit/timeout, a runbook entry. Write a blameless post-mortem.
```

Two useful frameworks: **RED** for services (Rate, Errors, Duration) and **USE** for resources (Utilization, Saturation, Errors) of CPU, memory, disk, network, DB connections.

Mental map of the request path (the bug lives in one of these hops; check from the outside in):

```
Client -> DNS -> CDN/WAF -> Load balancer -> Reverse proxy (nginx) -> Node process -> {MySQL, Redis, 3rd party APIs, queue}
```
Symptoms tell you which hop: 502/504 (LB/proxy cannot reach or hear back from Node), 5xx with Node logs (your code or its dependencies), 4xx spike (client bug, auth/token/CORS change, validation change), slow (see 6.1).

#### Command and metric cheat sheet

```bash
# Process and host
pm2 list ; pm2 logs orders-api --lines 200 ; pm2 monit            # PM2 status, restarts count (many restarts = crash loop)
docker ps ; docker logs --since 15m <container> ; docker stats     # containers
top -H -p <pid>  (or htop)                                          # CPU per thread; one core at 100 percent = event loop busy
free -m ; df -h ; df -i                                             # memory, disk space, inodes (full disk from logs is classic)
ss -s ; ss -tanp | grep :3000 | wc -l                               # socket counts (TIME_WAIT, ESTABLISHED floods)
journalctl -u orders-api --since "15 min ago"                       # systemd service logs
dmesg -T | grep -i -E "killed process|out of memory"                # kernel OOM killer
```

```sql
-- MySQL: what is running / waiting right now
SHOW FULL PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
SHOW STATUS LIKE 'Max_used_connections';
SHOW ENGINE INNODB STATUS;          -- section "LATEST DETECTED DEADLOCK"; run in the mysql client with \G
-- Long transactions holding locks
SELECT trx_id, trx_started, trx_mysql_thread_id, trx_query
FROM information_schema.innodb_trx ORDER BY trx_started LIMIT 10;
-- Slow query log (set on the server): slow_query_log=ON, long_query_time=0.5 ; analyze with mysqldumpslow or pt-query-digest
```

```bash
# Redis
redis-cli INFO memory ; redis-cli INFO stats          # used_memory, evicted_keys, keyspace_hits/misses
redis-cli SLOWLOG GET 10 ; redis-cli CLIENT LIST | wc -l
redis-cli --bigkeys                                   # find huge keys (uses SCAN)
redis-cli LLEN bull:emails:wait                       # BullMQ waiting jobs (key layout is version-specific; prefer queue.getJobCounts())
```

Node-side: `process.memoryUsage()`, event loop delay/utilization logs (6.1), `process.getActiveResourcesInfo()` (what handles keep the process alive), `process.report.writeReport()` (diagnostic report), pino logs filtered by `requestId`, `level:error`, `err.code`.

#### Playbook 1: 5xx spike right after a deploy

- **Symptoms**: error rate jumps within minutes of a release; maybe only some routes.
- **First checks**: deploy time vs first error time; error logs grouped by message and route; are all instances failing or only new ones?
- **Likely causes**: code bug on a new path (unhandled null), missing/changed env var or secret, DB migration not applied or applied incompatibly (column missing, NOT NULL added), dependency version bump, wrong config for the environment, crash loop on startup.
- **Confirm**: stack traces in `error` logs; `pm2 list` restart count; startup logs for config validation errors; diff of the release.
- **Fix**: **roll back first** (mitigation), then fix forward with a test. If a migration is the cause, roll back the app, not the data, unless the migration is reversible and verified.
- **Prevent**: validate env at startup and fail fast; backward-compatible (expand/contract) migrations; canary/rolling deploys with readiness checks and automatic rollback on error-rate alert; smoke tests post-deploy.

#### Playbook 2: Slow API, CPU low (waiting)

- **Symptoms**: p95/p99 up, process CPU 5-20 percent, no errors yet or timeouts starting.
- **First checks**: stage timings (DB vs external vs pool wait); `SHOW FULL PROCESSLIST`; pool queue length; third-party status/latency; Redis latency.
- **Likely causes**: slow query from data growth or a plan change, missing index, lock waits, N+1 introduced by a feature, slow/hanging third party with no timeout, DB at connection limit, DNS slowness, network between app and DB.
- **Confirm**: slow query log + `EXPLAIN` (Week 4 Day 6); `innodb_trx` for long transactions; timing logs for `http.*` stages.
- **Fix**: add/fix index or query, shorten transactions, add timeouts and fallback, cache, reduce per-request DB calls, release connections before external calls.
- **Prevent**: slow query log + alert, per-stage metrics, timeouts everywhere (Day 3), query review in PRs, load test with realistic data.

#### Playbook 3: Slow API, one CPU core at 100 percent (working, event loop blocked)

- **Symptoms**: ALL endpoints slow, even `/health`; high event loop delay; throughput plateau; CPU of the Node process pegged at one core.
- **First checks**: event loop delay logs; which request pattern started it (log by route/duration); recent code that loops/serializes large data.
- **Likely causes**: synchronous CPU work (sync crypto/bcrypt, big JSON, sort/map over huge arrays, regex ReDoS on user input, templating/PDF in-process), a huge response, an accidental infinite/long loop.
- **Confirm**: `--cpu-prof` or clinic flame on staging with a replay of the traffic, or attach `--inspect` via tunnel; the plateau function is the culprit. A ReDoS shows one regex frame consuming everything.
- **Fix**: async APIs, worker threads or a queue for CPU jobs, pagination/streaming, limit input sizes, replace the regex; as mitigation scale out or restart and block the abusive client.
- **Prevent**: request size limits, event loop lag alert, input validation limits, code review for sync APIs, CPU-heavy work isolated in workers.

#### Playbook 4: Memory climbing, OOM kills, restart loop

- **Symptoms**: memory staircase, exit code 137 or "heap out of memory", periodic restarts, latency spikes from long GC.
- **First checks**: memory metrics (rss vs heapUsed vs external); restart interval; correlation with traffic/feature; `dmesg` for OOM killer; container limit vs `--max-old-space-size`.
- **Likely causes**: unbounded cache/map, listeners/timers per request, global arrays, unconsumed streams, huge responses buffered, large file uploads held in memory, ALS/context retention, a native module leak.
- **Confirm**: 3-snapshot comparison (6.2) on one instance taken out of rotation; retainers.
- **Fix**: bound or remove the retention (LRU/TTL, remove listeners, stream instead of buffering, clear timers). Stopgap: PM2 `max_memory_restart`, more memory.
- **Prevent**: memory alert at 80 percent of limit, soak test before release, bounded data structures by default, upload limits and streaming.

#### Playbook 5: "Too many connections" / pool timeouts / requests hang waiting for DB

- **Symptoms**: errors like `ER_CON_COUNT_ERROR: Too many connections`, mysql2 `Pool is closed`/queue timeouts, request latency equals the pool wait, health fine but DB endpoints hang.
- **First checks**: `Threads_connected` vs `max_connections`; processlist grouped by user/host (which service?); number of app instances x pool `connectionLimit`; are connections idle ("Sleep") or running?
- **Likely causes**: pool size times instance count exceeds MySQL `max_connections` (especially during rolling deploys when old and new instances overlap, or a new cluster/worker mode), connection leaks (`getConnection()` without `release()` in an error path, transaction never committed/rolled back), long transactions, slow queries holding connections, creating a new pool/connection per request, a worker or cron process using its own large pool.
- **Confirm**: processlist shows many "Sleep" connections from app hosts (leak or oversized pools) vs many "Query" with long times (slow queries); search code for `getConnection` without `finally { conn.release() }`.
- **Fix**: always `try { ... } finally { conn.release() }`; correct the pool size (`instances x limit < max_connections` with headroom); set `queueLimit` and acquire timeout so you fail fast; shorten transactions; use one shared pool per process; kill stuck sessions as emergency mitigation.
- **Prevent**: pool metrics (in use / waiting), alerts on `Threads_connected` over 80 percent, connection budget per service documented, graceful shutdown that ends the pool (Day 5).

#### Playbook 6: Random 502/504 from the load balancer or nginx

- **Symptoms**: sporadic 502 Bad Gateway/504 Gateway Timeout, often with low error rate, nothing in the Node logs for those requests.
- **First checks**: LB/nginx error logs (`upstream prematurely closed connection`, `upstream timed out`, `connection refused`); Node instance restarts; response times near LB timeout (60s).
- **Likely causes**: Node `keepAliveTimeout` (5s default) shorter than the LB idle timeout, so LB reuses a closed socket (502 randomly); requests slower than LB/proxy read timeout (504); process crash/restart/deploy without graceful shutdown (connection refused / reset); health check misconfigured; instance out of memory; header size limits; WebSocket upgrade headers not proxied.
- **Confirm**: correlate 502 timestamps with restarts/deploys; compare timeouts across layers; check whether failing requests ever reached Node (their requestId missing in logs).
- **Fix**: `keepAliveTimeout` above LB idle timeout (and `headersTimeout` above that), graceful shutdown with readiness (Day 5), proper timeout hierarchy (Day 3), fix slowness or move long work to a queue and return 202.
- **Prevent**: alert on 5xx at LB level, rolling deploys with readiness gating, consistent timeout budget documented per layer.

#### Playbook 7: Duplicate orders / double charges

- **Symptoms**: same payment or order created twice; support tickets "charged twice".
- **First checks**: do the duplicate rows share a user, amount and near-identical timestamps (ms apart = double click / concurrent retry; minutes apart = client retry after timeout; hours = job reprocessing)? Check logs by requestId for both; was a timeout/retry involved?
- **Likely causes**: no idempotency key; check-then-insert race; client retry after timeout; load balancer retry of POST; queue at-least-once redelivery of a non-idempotent job; two instances running the same cron; stalled-job reprocessing.
- **Confirm**: the sequence in logs (two requests, two charge calls); absence of a UNIQUE constraint on business key; job logs showing the same job id processed twice.
- **Fix**: remediate customers (refund/reconcile), add idempotency keys with a UNIQUE constraint (Day 3), business-level unique constraints, idempotent job processors (Day 5), a single scheduler (leader lock) for crons, pass an idempotency key to the payment provider.
- **Prevent**: concurrency tests (`Promise.all` of identical requests), reconciliation job comparing provider records with the DB, alert on duplicate business keys.

#### Playbook 8: Queue backlog growing / jobs stuck

- **Symptoms**: emails/notifications delayed, queue depth rising, `waiting` count increasing, or jobs sitting in `active` forever.
- **First checks**: are workers running (process list, logs)? job counts by state (`queue.getJobCounts()`); failed jobs and their error messages; Redis memory/health; worker concurrency and the downstream rate limit.
- **Likely causes**: worker crashed/not deployed/ wrong queue name or Redis URL; producer rate exceeds consumer capacity; downstream provider slow or rate-limiting (429); jobs failing and retrying with backoff; poison job; blocked worker event loop causing stalled jobs; Redis memory full with `noeviction` (writes rejected) or eviction policy deleting job keys; a huge number of delayed jobs.
- **Confirm**: counts per state, last error of failed jobs, worker heartbeat logs, Redis `INFO memory`.
- **Fix**: restart/scale workers, raise concurrency within provider limits, fix the failing cause then retry failed jobs in bulk, remove poison jobs (`UnrecoverableError`), add rate limiting and backoff with jitter, clean old completed jobs.
- **Prevent**: alerts on queue age (oldest waiting job) not only depth, DLQ alerting, separate queues per priority/tenant so one flood does not starve others, load test the worker.

#### Playbook 9: Redis down or degraded; DB suddenly overloaded; stale data

- **Symptoms (a)**: after Redis outage/restart, DB CPU and latency spike (everything is a miss). **(b)** Users see old data after an update.
- **First checks**: Redis availability and latency (`INFO`, `SLOWLOG`), `evicted_keys`, hit ratio; deploy that changed cache keys/TTLs; are writes invalidating?
- **Likely causes (a)**: cache avalanche/stampede, cache client without fail-open (requests hang or error because Redis is unreachable), memory full with eviction, expensive command (`KEYS`) blocking Redis. **(b)**: missing invalidation for derived keys (list pages), invalidate-before-write ordering, stale-set race, TTL too long, key not including the user/locale.
- **Confirm**: hit-rate drop at the incident time; cache logs "get failed"; compare DB value vs cached value for a failing key.
- **Fix**: fail open with timeouts, single-flight/locks, TTL jitter, protect DB with rate limits/circuit breaker, warm hot keys; fix invalidation (versioned keys), shorten TTL for volatile data, bypass cache for critical reads.
- **Prevent**: cache metrics and alerts, load test with a cold cache, never use `KEYS` in production, document which data is cached and its staleness budget.

#### Playbook 10: Deadlocks and lock wait timeouts

- **Symptoms**: sporadic `ER_LOCK_DEADLOCK` (1213) or `ER_LOCK_WAIT_TIMEOUT` (1205) errors, usually under concurrency; operations failing for hot rows.
- **First checks**: `SHOW ENGINE INNODB STATUS` latest deadlock section (shows the two transactions, statements and locks); `innodb_trx` for long-running transactions; which endpoints.
- **Likely causes**: transactions locking rows in different orders (A locks row 1 then 2, B locks 2 then 1); long transactions (held open across external calls); missing index causing range/table locks; hot rows (counters, a single inventory row); isolation level choice.
- **Confirm**: the deadlock report lists the statements; reproduce with two concurrent requests.
- **Fix**: lock rows in a consistent order (sort ids), keep transactions short and never call external APIs inside them, add the right index so fewer rows are locked, retry the WHOLE transaction on 1213 (Day 3), use atomic updates (`UPDATE stock SET qty = qty - ? WHERE id = ? AND qty >= ?` and check `affectedRows`).
- **Prevent**: concurrency tests, transaction-duration metrics, lint rule/review for "no await external inside transaction".

#### Playbook 11: Works locally, fails in production

- **Symptoms**: passes tests and dev, fails after deploy.
- **First checks**: environment differences (env vars, Node version, OS, timezone, locale, memory/CPU limits), logs on first failure, config validation output.
- **Likely causes**: missing/typo'd env var or secret; case-sensitive file paths (Windows dev vs Linux prod: `./Utils.js` vs `./utils.js`); different Node version/OS and native modules (bcrypt, sharp) built for the wrong platform; timezone/DATETIME handling; reverse proxy (`req.ip`, `req.protocol` wrong without `app.set('trust proxy', ...)`, secure cookies not set); CORS origin list; HTTPS-only cookies; DB charset/collation/`sql_mode`; file system write permissions; port/host binding (`localhost` vs `0.0.0.0` in containers).
- **Confirm**: log the effective non-secret config at startup; reproduce in Docker with the production image; check Linux path casing.
- **Fix**: correct config, pin Node version (`engines`, `.nvmrc`, Docker image tag), build on the target platform, set trust proxy properly, bind to `0.0.0.0` in containers.
- **Prevent**: validated config schema at boot, same Docker image across environments, CI on Linux, staging that mirrors production.

#### Playbook 12: Intermittent 401s, "logged out" randomly, or JWT errors across instances

- **Symptoms**: some requests are 401 while others pass for the same user; users randomly logged out; only after scaling to multiple instances.
- **First checks**: do all instances use the same `JWT_SECRET`/keys? Server clocks (NTP) in sync? Token expiry vs clock skew; are sessions stored in process memory?
- **Likely causes**: different secrets per instance/environment, session stored in memory with a load balancer not sticky (login on A, request lands on B), clock skew making `nbf`/`exp` fail, refresh token rotation races (two tabs refreshing simultaneously invalidate each other), CORS preflight failing with auth header, proxy stripping `Authorization`.
- **Confirm**: compare config hashes across instances (never log the secret itself), look at the exact JWT error (`TokenExpiredError` vs `JsonWebTokenError: invalid signature`), time sync.
- **Fix**: shared secret management, store sessions in Redis/DB, allow small clock tolerance, handle concurrent refresh with a grace window/queueing on the client.
- **Prevent**: central secrets manager, startup check that secrets are present, integration tests with two app instances.

#### Quick symptom-to-first-suspect table

| Symptom | First suspects |
|---------|----------------|
| Errors right after deploy | the deploy: rollback, env/config, migration |
| All endpoints slow, CPU 100 percent | event loop blocked: sync CPU, ReDoS, huge JSON |
| Slow, CPU low | DB slow query/locks/pool, third party, missing timeout |
| Slow only under load | pool size, lock contention, single-thread saturation |
| Memory growing, restarts | leak: unbounded cache/listeners; container limit |
| Sporadic 502/504 | keepAlive vs LB idle timeout, crash/deploy, slow upstream |
| "Too many connections" | pool x instances > max_connections, connection leak |
| Duplicates | no idempotency/unique key, retries, at-least-once jobs, double cron |
| Queue backlog | workers down, slow downstream, failures, Redis memory |
| Stale data | missing invalidation, stale-set race, TTL |
| Deadlock errors | lock ordering, long transactions, missing index |
| Only prod fails | env vars, path case, proxy/trust proxy, Node/OS versions |
| 401 for valid users | secrets differ, clock skew, in-memory sessions |
| Disk full / crashes | unrotated logs, uploads, core dumps, temp files (`df -h`, `df -i`) |

#### Post-mortem template (blameless)

```
Title / date / duration / severity
Impact: who was affected, how many requests/users/payments, revenue/data impact
Timeline (UTC): detection, first response, mitigation, resolution
Root cause (the 5 whys; a process/system gap, not a person)
What went well / what went badly / where we got lucky
Action items: owner + due date (alerts, tests, limits, runbook, design change)
```

**Frontend connection**

Same loop as debugging a production frontend incident: reproduce, check the Network tab (here: logs/metrics), bisect recent changes (deploy diff), roll back via feature flag, add a test, write it up. The extra element on the backend is shared infrastructure: one bad query,
one missing timeout or one leak affects every user at once, so mitigation speed and prevention (limits, timeouts, alerts) matter more.

**Real-world scenario**

Friday 6 PM sale. Alerts: p99 5s, 504s. Method: (1) scope: all instances, `/orders` and `/products` slow, `/health` fine. (2) what changed: marketing email sent 10 minutes ago, traffic 4x; no deploy. (3) signals: CPU 30 percent, event loop OK, DB `Threads_connected` 190 of 200,
pool waiting on every instance. (4) processlist: 150 sleeping connections held by a worker pool that was created with `connectionLimit: 50` x 3 instances. (5) mitigation: scale workers down to 1 instance, restart API instances gradually; latency recovers in 2 minutes. (6) fix: pool budget
(API 10 x 4 + workers 5 x 2), `queueLimit` with fast failure, alert on connection usage. Post-mortem action: connection budget documented in the runbook.

**Interview answer:**
"My approach is to mitigate first, then diagnose. I roll back or disable the suspect change, scale out or shed load if needed, and preserve evidence like logs and a diagnostic snapshot before restarting. Then I scope the problem: which endpoints, users and instances, since when, and what changed.
I look at the golden signals, which are latency, traffic, errors and saturation, to place the problem in the request path. For example slow with low CPU points to the database, pool or a third party, while a pegged core points to blocking JavaScript and I would profile it. I form one hypothesis at a time,
verify with logs filtered by request id, database tools such as the processlist and slow query log, and profiles or heap snapshots. After the fix I verify in metrics and add a test, an alert or a limit, then write a blameless post-mortem."

**Follow-up questions**

- *You are paged: users cannot pay. What are your first 5 minutes?* Confirm and size the impact (error rate by route/status), check the last deploy and rollback if correlated, check dependencies (DB, payment provider status), check saturation (pool, CPU, memory), communicate status, then dig deeper while mitigated.
- *Rollback or fix forward?* Roll back when a recent change is the likely cause and rollback is safe (no incompatible data migration); fix forward when rollback is risky or the cause is not the deploy.
- *How do you debug something that only happens in production?* Add targeted logging with request ids, replicate with production-like data in staging, use feature flags and canaries, capture heap/CPU profiles on a single instance, replay traffic.
- *How do you prevent recurrence?* Tests for the specific failure, timeouts/limits, alerts on symptoms (latency, error rate, queue age, pool use), runbooks, chaos/game days, reviewing the timeout and retry budget.
- *What do you alert on?* Symptoms users feel (error rate, p99 latency, availability), plus saturation leading indicators (memory, event loop lag, pool use, queue age, disk); avoid noisy cause-based alerts.
- *Difference between logs, metrics and traces in an incident?* Metrics tell you THAT something is wrong and when, traces/logs show WHERE and WHY for specific requests.

**Common mistakes**

- Restarting immediately and destroying evidence (when a snapshot or logs were needed).
- Changing several things at once, so you do not know what fixed it.
- Blaming the last deploy without evidence (or ignoring it).
- Fixing symptoms (bigger pool, more memory) without a root cause.
- No timeouts/limits so one dependency failure cascades.
- Logs without request ids, no metrics, no alerts: flying blind.
- No post-mortem, so the same incident repeats.

**Revision notes**

- Method: mitigate -> scope -> what changed -> golden signals -> hypothesis -> fix/verify -> prevent.
- Waiting vs working (CPU) is the first fork for slowness; DB/pool/third party vs event loop.
- Know the 12 playbooks and the symptom table; know the DB and Redis commands.
- Roll back first, preserve evidence, one change at a time, blameless post-mortem.

### Day 6 wrap-up

**Key concepts to remember**

- Measure before optimizing; waiting (I/O) vs working (CPU) split; stage timing, slow query log, EXPLAIN, event loop delay.
- Profilers: `--inspect`, `--cpu-prof`, clinic doctor/flame/bubbleprof, flame graph reading (width = time).
- Memory: sawtooth vs staircase, heapUsed/external/rss, common leaks, three-snapshot technique, retainers, snapshot cost.
- autocannon: p99, req/s, non-2xx; Little's Law; saturation; separate generator machine; realistic data.
- Incident method and the symptom playbooks; mitigate first; evidence; post-mortem.

**Five revision questions**

1. An endpoint takes 5 seconds, CPU is at 10 percent. Walk through your investigation.
2. All endpoints (even `/health`) become slow and one core is at 100 percent. What is happening and how do you find the function responsible?
3. How do you decide a memory increase is a leak, and how do you find the retaining reference?
4. Why does an autocannon result with `Req/Sec 3000` mean nothing without p99 and the non-2xx count? What does Little's Law say about a pool of 10 connections and 25ms queries?
5. You get "Too many connections" in production right after a rolling deploy. List the likely causes and your fix.

**Practical coding task** (see `EX-DEBUG-01`)

Build a "broken" endpoint set in `orders-api` on purpose: `/slow-cpu` (sync `crypto.pbkdf2Sync` loop), `/n-plus-one` (loop of queries), `/leak` (module-level Map that grows), `/no-timeout` (calls a stub server that sleeps 30s). For each: (1) reproduce with autocannon and record p99,
(2) diagnose using the right tool (event loop delay, stage timing logs, heap snapshot comparison, timeout), (3) fix, (4) re-run and compare. Write the findings as a short post-mortem for each.

**Self-assessment checklist**

- [ ] I can explain the method for a slow API and the waiting vs working fork.
- [ ] I can measure event loop delay and read a flame graph at a basic level.
- [ ] I can list at least six causes of memory leaks and the three-snapshot technique.
- [ ] I can run autocannon and interpret latency percentiles, throughput and errors.
- [ ] I can describe the incident method (mitigate, scope, what changed, signals, hypothesis, verify, prevent).
- [ ] I know the first checks for 502/504, connection exhaustion, duplicates, and queue backlog.

---

## Day 7 - Revision and weekly test (Day 42)

**Learning objectives**

Today is mainly revision, assessment and catching up. By the end of the day you should be able to:
1. Recall the Week 6 topics from memory using the rapid-fire sheet and the answer key to the daily revision questions.
2. Explain, in 60 to 90 seconds each, the five "production" stories: testing strategy, observability, resilience (timeouts/retries/idempotency), caching and queues, shutdown and incident diagnosis.
3. Complete the weekly test (end of this file) under time limits and score yourself honestly.
4. Identify your weak areas from the score map and schedule the catch-up.
5. Connect Week 6 to Week 7 (system design): everything here is a building block of those designs.

Suggested time (about 2 hours): 25 min rapid-fire sheet, 20 min answer key to the daily revision questions (check yourself after trying to answer from memory), 40 min weekly test (closed notes), 20 min marking and weak-area mapping, 15 min catch-up on the weakest topic.

### 7.1 Spaced-revision schedule for Week 6 topics

Revisit each important topic after about 1 day, 3 days and 7 days (see the master file for the global calendar). For Week 6 specifically:

| Topic | Studied | Revisit +1 day | Revisit +3 days | Revisit +7 days |
|-------|---------|----------------|-----------------|-----------------|
| Test pyramid, mocking, Supertest, negative tests | Day 1 (Day 36) | Day 37: re-run the negative-test table from memory | Day 39: write 3 tests for a new endpoint | Day 43: explain test strategy aloud |
| pino, errors, correlation id with ALS | Day 2 (Day 37) | Day 38 | Day 40: re-implement `requestContext` | Day 44 |
| Timeouts, retries + jitter, idempotency | Day 3 (Day 38) | Day 39: write the idempotency flow on paper | Day 41: re-implement `withIdempotency` | Day 45: payment-design practice (Week 7 Day 4) |
| Redis, cache-aside, invalidation | Day 4 (Day 39) | Day 40 | Day 42 (today): `getOrSet` from memory | Day 46 |
| Queues and graceful shutdown | Day 5 (Day 40) | Day 41 | Day 43: shutdown order from memory | Day 47 |
| Slow API, leaks, load testing, incident playbook | Day 6 (Day 41) | Day 42 (today) | Day 44: walk through 3 playbooks aloud | Day 48 |

### 7.2 Rapid-fire sheet (read in 10 minutes, then cover it and recite)

Testing
- Pyramid: many unit, some integration (Supertest + real MySQL), few E2E. Test behavior and risk, not implementation.
- `createApp(deps)` factory; `listen` only in `server.js`. Mock at boundaries (payment, email, clock); fake timers; real DB for repository tests.
- Negative tests: 401, 403, 404/ownership, 400 validation and boundaries, malformed JSON, 413, duplicate 409, dependency failure with no side effects, no stack leak.
- Vitest = Jest API with `vi`; Jest ESM needs experimental flags.

Observability
- Structured JSON logs to stdout; levels; log each error once; never log secrets/PII; redaction is a safety net.
- pino: `logger.info({ fields }, 'msg')`, `err` key, `child`, `mixin`; pino-http for access logs.
- Operational vs programmer errors; central error handler; Express 5 async errors; uncaught -> log + graceful exit.
- Correlation id: AsyncLocalStorage `run/getStore`; return in header/body, forward to HTTP calls and job payloads.

Resilience
- Timeout every outbound call (`AbortSignal.timeout`); inner < outer; timeout does not cancel remote work.
- Retry transient + idempotent only; backoff `random(0, min(cap, base*2^n))`; one layer; breaker for sustained failure.
- Idempotency: UNIQUE(user_id, key) is the lock; hash request; replay / 409 in progress / 422 key reuse; crash -> transaction coupling + provider key + reconciliation.

Redis and caching
- Single-threaded atomic commands; TTL always; `SCAN` not `KEYS`; cache `allkeys-lru`, queue `noeviction` + AOF.
- Cache-aside: read miss -> DB -> set TTL (+ jitter, negative cache, single-flight); write DB -> DEL; version keys for lists; stale-set race.
- Stampede / penetration / avalanche.

Queues and shutdown
- Producer -> Redis -> worker; at-least-once -> idempotent processors; attempts + backoff + `UnrecoverableError`; stalled jobs; outbox pattern.
- Shutdown: readiness 503 -> drain delay -> `server.close()` -> workers -> queue/Redis/pool -> exit; force timer; PM2 SIGINT + `kill_timeout`; Docker exec-form CMD.

Diagnosis
- Waiting vs working. Stage timings, slow query log + EXPLAIN, event loop delay, `--inspect` / `--cpu-prof` / clinic, flame graph width = time.
- Leak = staircase; causes: unbounded map, listeners, timers, closures, global arrays; three snapshots + retainers.
- autocannon: p99, req/s, non-2xx; Little's Law; separate generator machine; one change at a time.
- Incident method: mitigate -> scope -> what changed -> golden signals -> hypothesis -> fix/verify -> prevent -> post-mortem.

### 7.3 Answer key: the five revision questions of Days 1 to 6

Try each answer aloud first; then compare. Short model answers:

**Day 1**
1. Pyramid: many fast unit tests of logic, fewer integration tests that run real wiring, very few E2E. Integration-only bug: middleware order wrong (for example `express.json()` missing so `req.body` is undefined) or a SQL typo/constraint violation, which mocked unit tests cannot see.
2. Mock = stub that also records and verifies calls; stub = canned responses; spy = wraps the real function and records; fake = lightweight working implementation (in-memory repo).
3. Supertest builds its own server from the app on an ephemeral port; if `app.js` calls `listen`, tests get port conflicts and open handles. Separate `createApp` from `server.js`, which owns the process lifecycle.
4. Missing/invalid auth (401), wrong role (403), not-owner (404), empty or missing `items` (400), `qty: 0` or 101 (400), negative price (400), malformed JSON (400), oversize body (413), payment gateway failure (502 and no order saved), duplicate idempotency key.
5. Open handles: unclosed DB pool or Redis connection, listening server, timers, BullMQ workers. Close everything in `afterAll`; find leaks with `process.getActiveResourcesInfo()` or `why-is-node-running`.

**Day 2**
1. Structured fields can be filtered and aggregated: for example `userId:42 AND level:error` in the last hour, or `route:"/orders/:id"` sorted by `responseTime` descending. Free-text strings cannot be reliably queried.
2. Operational = expected runtime failures (validation, not found, timeout, duplicate): map to status codes, safe messages, maybe retry. Programmer error = bug: log with stack, generic 500, fix the code; for uncaught ones exit and restart.
3. ALS ties a store to the async call chain created inside `run()`, so each request sees its own store across awaits. A global variable would be overwritten by whichever request ran last between awaits (race).
4. Response header and error body, outgoing HTTP headers, job payloads, log lines (via mixin). ALS does not propagate across processes: Redis/queues, HTTP calls, worker threads.
5. Log fatal, start graceful shutdown (stop accepting, drain, close resources), exit non-zero so the supervisor restarts. Continuing is unsafe because state may be corrupt (half-updated structures, leaked locks).

**Day 3**
1. Each request holds a socket and probably a DB connection indefinitely; pool exhausts; the entire service (even unrelated endpoints) hangs: a cascading failure. A timeout with a fallback degrades gracefully.
2. `delay = random(0, min(cap, base * 2^attempt))` (full jitter). It de-synchronizes clients so they do not retry in waves that overload a recovering dependency (thundering herd).
3. Retry 429 (with Retry-After), 502, 503, 504, timeouts, connection resets, DB deadlocks (whole transaction). Do not retry 400/401/403/404/422 or business errors. A POST retry after a timeout can duplicate an operation that actually succeeded unless an idempotency key makes it safe.
4. Both try `INSERT` with the unique `(user_id, idem_key)`. One succeeds and does the work; the other gets `ER_DUP_ENTRY`, then reads the row: same hash and IN_PROGRESS -> 409; COMPLETED -> replay stored response; different hash -> 422. The charge happens once.
5. Same-DB side effect: one transaction for business write plus key update. External side effect: pass the same idempotency key to the provider so a re-run returns the original charge, keep the `IN_PROGRESS` row, and a reconciliation job resolves stale rows by querying the provider.

**Day 4**
1. Read: Redis GET, on miss load from MySQL and SET with TTL. Write: update MySQL first, then DEL the key. Delete beats update because concurrent writers can set the cache in the wrong order, and delete is idempotent and order-independent.
2. Stampede: a hot key expires and many requests rebuild it at once (single-flight, lock, jitter, stale-while-revalidate). Penetration: requests for nonexistent keys always hit the DB (negative caching, validation, Bloom filter). Avalanche: many keys expire together or the cache is lost (jitter, warm-up, DB protection).
3. One thread executes commands one at a time, so each is atomic with no locks. Downside: a slow command (`KEYS`, huge set, long Lua) blocks every client.
4. Reader misses and reads old DB value, writer commits and deletes the key, reader then sets the old value: cache stale until TTL. Reduce with short TTL, delayed double delete, version check on set, and not caching strongly consistent data.
5. Cache: `allkeys-lru` (or lfu), persistence optional. Queue: `noeviction` (evicting job keys loses work) plus AOF, preferably a separate instance.

**Day 5**
1. Brokers avoid losing jobs: a job is re-delivered if a worker dies or acks late, so duplicates can occur. Processors must be idempotent (unique processed marker, provider idempotency key, natural idempotency).
2. A job whose lock was not renewed in time (worker crash or event loop blocked by CPU work) is considered stalled and given to another worker, so it may run twice. Cause: CPU-bound code in the worker, long synchronous work, process kill.
3. You cannot commit MySQL and enqueue to Redis atomically; a crash between them loses the job, enqueue-before-commit risks a job without data. Solution: transactional outbox (insert event row in the same DB transaction, relay publishes it, consumers idempotent) or enqueue after commit plus reconciliation.
4. Flip readiness to 503; wait for the LB to drain; `server.close()` (wait for in-flight requests, close idle connections); close workers (finish active jobs); close queue, Redis (`quit`), DB pool (`end`); exit 0; force timer and double-signal guard as safety.
5. Shell form makes `sh`/`npm` PID 1 and signals may not be forwarded to Node, so `docker stop` waits for the timeout and SIGKILLs the process with no cleanup. Use exec form `CMD ["node", "src/server.js"]` and `--init`/tini.

**Day 6**
1. Measure per-stage timings; CPU low means waiting: check slow query log and EXPLAIN, N+1, pool wait, locks, external calls without timeouts; fix, re-measure with a load test, add monitoring.
2. The event loop is blocked by synchronous JS (sync crypto, huge JSON, regex, loops). Confirm with event loop delay; find the function with `--cpu-prof` or clinic flame (wide flat top frames). Fix by async APIs, workers, streaming, limits.
3. Compare post-GC baseline over time (staircase = leak). Use three heap snapshots with the same workload between them, look at constructors with consistent positive deltas, then follow the Retainers chain to the reference keeping them alive.
4. Throughput without latency percentiles and error counts can hide tail latency and failing requests (500s are fast). Little's Law: 10 connections / 0.025 s = about 400 queries/s maximum for that pool.
5. Pool size x instances (old and new overlapping during deploy) exceeds `max_connections`, connection leaks (missing `release()`), long transactions, new pool per request, workers with large pools. Fix: budget connections, `finally { release }`, shorter transactions, graceful shutdown that ends pools, alert on usage.

### 7.4 Integrated lab (60 to 90 minutes, optional but valuable)

"Production-harden" the `orders-api` with a checklist. Each item should have a test or a measurable check:

- [ ] `createApp` factory; at least 12 Supertest tests including the negative table.
- [ ] pino JSON logging with redaction, pino-http, correlation id via ALS and returned in `x-request-id` plus error bodies.
- [ ] Outbound HTTP wrapper with `AbortSignal.timeout`, retry with full jitter, idempotency key passed to the gateway.
- [ ] `POST /orders` requires `Idempotency-Key`; concurrency test proves one charge for 10 parallel identical requests.
- [ ] Product reads via cache-aside with TTL jitter and fail-open; versioned list keys; invalidation test.
- [ ] `send-receipt` BullMQ job with idempotent processor; worker as a separate process.
- [ ] Graceful shutdown in server and worker; `/health` and `/ready`; shutdown test on Linux/WSL/Docker.
- [ ] autocannon baseline before and after caching saved in the README (p50, p99, req/s, errors).
- [ ] A one-page runbook: top 5 failure symptoms from the playbook and first checks for your app.

This lab maps to Project `Stage 6`, `Stage 5` and `Extension A` and `Extension B` in `12_Project_Task_API.md`.

### 7.5 Connecting Week 6 to Week 7

Week 7 designs (rate limiter, notifications, URL shortener, file upload, payments, queues, monitoring) reuse today's building blocks: Redis counters and caches (Day 4), queues and idempotent consumers (Day 5), idempotency keys and retries (Day 3), timeouts and graceful shutdown (Days 3 and 5), and logging/metrics/diagnosis (Days 2 and 6). Before starting Week 7, make sure you can explain the idempotency flow and cache-aside without notes.

### Day 7 wrap-up

**Key concepts to remember**

- The five production themes: test strategy, observability, resilience, caching and queues, shutdown and diagnosis.
- Idempotency + retries + timeouts are one coherent story; so are cache + invalidation + stampede; so are queue + at-least-once + idempotent consumer.
- The incident method is more important than any one command.

**Five revision questions**

1. Explain the full story of "user double-clicks Pay and the network times out" using timeouts, retries, idempotency keys and logs.
2. What are the trade-offs of caching product data versus reading account balances directly from MySQL?
3. How do you prove a graceful shutdown works?
4. Which Week 6 topics would you mention when asked "how do you make a Node.js service production ready?" (give the list in order)
5. Pick one playbook symptom and give the first three checks and the most likely cause.

**Practical coding task**

Take the weakest topic from your weekly test result and write a failing test first, then the implementation, then record a short post-mortem style note ("what I got wrong, why, what I will check next time"). Example: if idempotency was weak, write the concurrent duplicate test and implement
`withIdempotency` again without looking at the notes.

**Self-assessment checklist**

- [ ] I recited the rapid-fire sheet without notes and filled the gaps.
- [ ] I answered the 30 daily revision questions aloud and compared with the key.
- [ ] I completed the weekly test under time limits and scored myself.
- [ ] I mapped wrong answers to topics and scheduled the catch-up.
- [ ] I can explain the Week 6 topics in an interview-ready way in under two minutes each.

---

## Week 6 Revision Summary

**What you covered:** how to prove code works (tests), how to see what it is doing (logs, correlation ids), how to survive an unreliable world (timeouts, retries, idempotency), how to make it fast and scalable at a basic level (Redis cache, queues), how to deploy it without dropping work
(graceful shutdown), and how to find out what went wrong (profiling, heap snapshots, load tests, incident playbook).

| Area | The one-sentence version | Tier |
|------|--------------------------|------|
| Test strategy | Many unit tests, some Supertest + real DB integration tests, few E2E; negative tests and no-side-effect assertions on failures | ESSENTIAL |
| Mocking | Mock at boundaries via DI; do not mock the DB in integration tests or the unit under test | ESSENTIAL |
| Logging | Structured JSON, levels, redaction, log once, request id everywhere | ESSENTIAL |
| Errors | Operational vs programmer; typed AppError; central handler; uncaught -> graceful exit | ESSENTIAL |
| Correlation ids | AsyncLocalStorage + pino mixin; propagate across HTTP and jobs | ESSENTIAL (mechanism ADVANCED) |
| Timeouts | Every outbound call; inner < outer; timeout is not cancellation | ESSENTIAL |
| Retries | Transient + idempotent only; backoff + full jitter; one layer; breaker for sustained failures | ESSENTIAL (breaker ADVANCED) |
| Idempotency | Key + UNIQUE constraint + request hash + replay; crash cases | ESSENTIAL |
| Redis | In-memory, atomic commands, TTL, SCAN, eviction/persistence per use | ESSENTIAL |
| Caching | Cache-aside, TTL jitter, negative cache, single-flight, fail open | ESSENTIAL |
| Invalidation | TTL safety net, DB first then DEL, versioned keys, stale-set race | ESSENTIAL |
| Queues | At-least-once, idempotent processors, retries/backoff, stalled jobs, outbox | ESSENTIAL (outbox ADVANCED) |
| Graceful shutdown | readiness -> drain -> server.close -> workers -> Redis/pool -> exit; force timer | ESSENTIAL |
| Slow API debugging | Measure; waiting vs working; slow log/EXPLAIN; loop delay; profilers | ESSENTIAL (tools ADVANCED) |
| Memory leaks | Staircase baseline; common causes; 3 snapshots + retainers | ESSENTIAL (snapshots ADVANCED) |
| Load testing | autocannon, percentiles, saturation, Little's Law | ESSENTIAL |
| Incident playbook | Mitigate, scope, change, signals, hypothesis, fix, prevent | ESSENTIAL |

Honest scope note: this week gives you the vocabulary, the standard patterns and the reasoning to hold a good interview conversation on production engineering. Real fluency (reading flame graphs quickly, tuning Redis memory, running queues at scale, leading an incident) comes only from doing it on a real system over months.

---

## Week 6 Assessment (mixed difficulty)

Closed notes, 40 to 50 minutes. Scoring: Basic questions 1 point, Intermediate 2 points, Advanced 3 points (maximum 49). Write your answer before reading the answers section.

### Basic (Q1 to Q8)

**Q1.** What is the difference between a unit test and an integration test? Give one example of each for an `orders-api` that has an `orderService` and a MySQL repository.

**Q2.** Why do we export the Express `app` from one file and call `listen()` in another?

**Q3.** Which of these HTTP methods are idempotent by definition: GET, POST, PUT, DELETE, PATCH?

**Q4.** One of these pino calls is wrong. Which, and why?
```js
logger.info({ orderId: 5 }, 'order placed');
logger.info('order placed', { orderId: 5 });
```

**Q5.** What is a correlation (request) id and where should the server send it back to the client?

**Q6.** Why should every cached entry normally have a TTL?

**Q7.** What is the difference between SIGTERM and SIGKILL for a Node process?

**Q8.** Name four kinds of data that must never be written to logs.

### Intermediate (Q9 to Q18)

**Q9.** Predict the output:
```js
import { vi } from 'vitest';
import { retry } from './retry.js';   // the retry() from Day 3 (default retries = 3, shouldRetry = isRetryable)

const fn = vi.fn()
  .mockRejectedValueOnce(Object.assign(new Error('a'), { status: 503 }))
  .mockRejectedValueOnce(Object.assign(new Error('b'), { status: 400 }))
  .mockResolvedValue('ok');

try {
  const r = await retry(fn, { sleep: async () => {} });
  console.log('result', r);
} catch (e) {
  console.log('error', e.message, fn.mock.calls.length);
}
```

**Q10.** With `baseMs = 200` and `capMs = 3000`, what is the maximum possible delay (the jitter ceiling) before retry attempts 1 to 6 (attempt index 0 to 5)? What do the actual delays look like with full jitter?

**Q11.** Two identical `POST /orders` requests with the same `Idempotency-Key` arrive at the same time. Describe what each request does and what each client sees.

**Q12.** What is wrong with this middleware, and how would you fix it?
```js
let currentRequestId;
app.use((req, res, next) => { currentRequestId = randomUUID(); next(); });
app.get('/orders', async (req, res) => {
  const rows = await db.getOrders();
  logger.info({ requestId: currentRequestId }, 'fetched orders');
  res.json(rows);
});
```

**Q13.** Which Redis `maxmemory-policy` would you use for a cache instance and which for a BullMQ instance, and why?

**Q14.** In cache-aside, why do we update the database first and then delete the cache key, rather than updating the cache value?

**Q15.** You call `server.close()` on SIGTERM and the process does not exit for a minute. Why can this happen and what do you do about it?

**Q16.** An API is slow. How do you tell from observations whether the problem is a slow database or a blocked event loop?

**Q17.** Why must a BullMQ job processor be idempotent, and why must a BullMQ Worker's Redis connection use `maxRetriesPerRequest: null`?

**Q18.** Your Node service's memory grows steadily and it is killed with exit code 137 every 8 hours. Describe how you confirm a leak and find its cause.

### Advanced (Q19 to Q25)

**Q19.** Describe the "stale set" race in cache-aside with a timeline, and give three mitigations with trade-offs.

**Q20.** Your server charges a card through an external gateway and then writes the order to MySQL, with an idempotency-key table. The process crashes right after the gateway returns success but before the order and idempotency response are stored. Describe what the client's retry experiences and how
you design so that the customer is not double charged and the order is not lost.

**Q21.** Explain the transactional outbox pattern: what problem it solves, how it works, and what guarantees it gives.

**Q22.** Your BullMQ worker runs a CPU-heavy PDF generation inside the processor. Some jobs get executed twice and `stalled` events appear. Explain why and give two fixes.

**Q23.** Users get sporadic 502 errors from an AWS ALB in front of your Node API, but the Node error logs are clean and CPU is low. Give the most likely cause and the fix, and explain why the logs are clean.

**Q24.** An API instance uses a MySQL pool of 20 connections. Each request holds one connection for two sequential queries of 40 ms each (including network). Estimate the maximum throughput of ONE instance from the pool alone. What happens beyond that load, and what are two ways to raise capacity safely?

**Q25.** Incident: "customers were charged twice for the same order during a flash sale". Walk through your investigation (first checks, hypotheses, confirmation), the immediate mitigation, and the permanent prevention.

---

## Week 6 Assessment: Answers with Explanations

**Q1 (Basic).** A unit test runs one piece of logic in isolation with dependencies faked: for example `calculateTotal(items)` or `orderService.placeOrder` with a mocked payment gateway and repository, asserting that no order is saved when payment fails. An integration test runs several real pieces together: for example
`POST /orders` through Supertest against the real Express app and a real MySQL test database, asserting the status code, body and the stored row. Unit tests are fast and pinpoint logic bugs; integration tests catch wiring, SQL and serialization bugs that mocks cannot.

**Q2 (Basic).** Supertest creates its own ephemeral server from the app. If `app.js` already calls `listen()`, tests collide on ports and leave open handles. A factory `createApp(deps)` also allows injecting fakes. `server.js` is the composition root that owns listening, signals and shutdown.

**Q3 (Basic).** GET, PUT and DELETE are idempotent (also HEAD and OPTIONS). POST is not. PATCH depends on the operation (setting a field is idempotent, incrementing is not). Idempotent means repeating the request leaves the same final state, which is why they can be retried safely and why POST needs an idempotency key.

**Q4 (Basic).** The second is wrong: pino's signature is `(mergingObject, message)`. `logger.info('order placed', { orderId: 5 })` treats the object as a format argument (interpolation value) and the field is not logged as structured data. The first is correct.

**Q5 (Basic).** A unique id attached to each request and included in every log line for that request (and forwarded to downstream calls and jobs) so you can reconstruct one request's story across logs and services. Return it in the `x-request-id` response header and in error response bodies so users and support can quote it.

**Q6 (Basic).** TTL bounds staleness if invalidation fails or is imperfect, and bounds memory by letting old keys disappear (without it the cache grows until eviction or OOM). It is the safety net of every invalidation strategy.

**Q7 (Basic).** SIGTERM is a catchable polite request to terminate; the process can stop accepting work, drain and exit cleanly. SIGKILL cannot be caught or handled and kills immediately with no cleanup; platforms send it after the grace period (Docker 10s, Kubernetes 30s by default, PM2 `kill_timeout`).

**Q8 (Basic).** Passwords and hashes, access/refresh tokens and API keys, full card numbers/CVV, OTPs, government IDs, and `Authorization`/`Cookie` headers; also unnecessary PII and full request bodies of auth/payment endpoints. Use redaction as a safety net, but do not put them in log objects in the first place.

**Q9 (Intermediate).** Output: `error b 2`. Attempt 0 fails with 503 (retryable), so it sleeps (fake) and retries; attempt 1 fails with 400, which is not retryable, so `retry` rethrows immediately. The function was called 2 times and the error message is `b`. The `ok` value is never reached.

**Q10 (Intermediate).** Ceilings: attempt index 0: min(3000, 200*1) = 200; 1: 400; 2: 800; 3: 1600; 4: min(3000, 3200) = 3000 (capped); 5: 3000. With full jitter the actual delay is a random value uniformly in [0, ceiling), so e.g. attempt 3 waits anywhere between 0 and 1.6s. Randomness spreads many clients' retries over time instead of
synchronized waves.

**Q11 (Intermediate).** Both attempt `INSERT` into `idempotency_keys` with UNIQUE(user_id, idem_key). MySQL lets exactly one succeed. Request A (winner) does the work (charge, order) and stores the response and marks the key COMPLETED, returning 201. Request B gets `ER_DUP_ENTRY`, reads the row: if the original is still IN_PROGRESS (likely, since they are concurrent) it returns 409
"request in progress" and the client retries shortly and then gets the stored 201 replay (with `Idempotent-Replayed: true`); if A had already finished, B gets the replay immediately; if the body hash differs it gets 422. Only one charge happens.

**Q12 (Intermediate).** `currentRequestId` is a shared module-level variable. With concurrent requests, a later request overwrites it while an earlier one is awaiting the DB, so the log line uses the wrong id (a race). Fix: store the id in AsyncLocalStorage (`als.run({ requestId }, next)`), read it via `getStore()` or let the pino `mixin` attach it automatically, or attach it to `req.id` and pass the request
scoped logger (`req.log`).

**Q13 (Intermediate).** Cache: `allkeys-lru` (or `allkeys-lfu`) so Redis evicts least-used keys and stays within memory; losing entries is acceptable because they can be rebuilt. BullMQ: `noeviction` (BullMQ requires it) because evicting job or lock keys would silently lose work or corrupt state; with `noeviction` Redis rejects writes when full, which you alert on. Use AOF persistence for queues. Prefer separate instances so the two policies do not conflict.

**Q14 (Intermediate).** The DB is the source of truth, so write it first; then delete the cached key so the next read repopulates from fresh data. Deleting is idempotent and order-independent: two concurrent writers cannot leave an older value in the cache by completing in the opposite order, and a rolled-back transaction cannot leave a phantom value. Updating the cache value risks ordering races and caching data that was never committed. (Even delete-after-write has a small stale-set race, mitigated with short TTLs.)

**Q15 (Intermediate).** `server.close()` waits until ALL connections end. Idle HTTP keep-alive connections (and long-lived ones like SSE/WebSockets) keep the server open. Node 19+ closes idle connections in `close()`; on older 18.x call `server.closeIdleConnections()`, send `Connection: close` while draining, and after a deadline call `server.closeAllConnections()` and exit. Also keep a force-exit timer shorter
than the platform's SIGKILL timeout. Remaining open handles (DB pool, Redis, timers) can also prevent exit; close them.

**Q16 (Intermediate).** Slow DB: Node CPU low, event loop delay normal, stage timings show the `db.*` stage long, processlist/slow log shows long queries or waits, pool queue growing. Blocked event loop: one core near 100 percent, high event loop delay/utilization, ALL endpoints (including `/health`) are slow, timing logs show long gaps outside I/O stages, and a CPU profile shows a hot synchronous function.

**Q17 (Intermediate).** Queues are at-least-once: jobs can be redelivered after a worker crash, a stalled lock, retries after partial success, or duplicate enqueue, so processing twice must have the same effect as once (unique processed marker, provider idempotency key, natural idempotency). Workers use blocking Redis commands to wait for jobs; ioredis's default `maxRetriesPerRequest` (20) would make those blocking commands fail
during reconnects, so BullMQ requires `null` (retry forever) for worker/event connections.

**Q18 (Intermediate).** Confirm: plot `heapUsed` after GC (and `rss`, `external`) over hours under steady traffic; a rising post-GC baseline (staircase) is a leak, plateau after warm-up is not. Exit code 137 with a flat heap means the container limit was hit (native/Buffers or limit too low). Find the cause: on one instance taken out of rotation, take three heap snapshots with the same batch of requests between them, use DevTools Comparison for objects with
consistent growth, then follow the Retainers chain (for example a module-level `Map` with no eviction, listeners per request, uncleared intervals). Fix the retention (LRU/TTL, remove listeners, stream), then verify with a soak test and add a memory alert. `--max-old-space-size` or scheduled restarts are only stopgaps.

**Q19 (Advanced).** Timeline: t1 reader A misses and reads old DB value 100; t2 writer B commits 120 and DELs the key; t3 reader A SETs the key to 100. The cache now holds stale 100 until TTL. Mitigations: (1) short TTL bounds staleness (simple, but more DB load); (2) delayed second delete after about 0.5-1s (cheap heuristic, not guaranteed); (3) store a version or `updated_at` with the value and only
set if newer using a Lua compare-and-set (precise, more code); (4) do not cache strongly consistent data (like balance, price at checkout) (safest, slower reads); (5) bypass cache for the writer's own session briefly. State clearly that perfect consistency between a cache and a DB is not achievable without distributed transactions, so you choose an acceptable staleness bound.

**Q20 (Advanced).** The key row stays IN_PROGRESS. The client's retry (same key) gets 409 "in progress" repeatedly or after a TTL; if the row is released it could re-run the charge. Design: (1) pass the same idempotency key to the gateway, so a re-run of the charge returns the original charge instead of creating a new one; (2) do not delete the key on ambiguous failure; (3) a reconciliation job finds IN_PROGRESS keys older than N minutes, asks the gateway
for the charge by idempotency key/reference, and completes the order and the key row (or refunds if the order cannot be created); (4) where possible store the order and mark the key COMPLETED in a single DB transaction; (5) a UNIQUE `payment_ref` on orders protects against double order creation. Result: no double charge, and the order is eventually consistent.

**Q21 (Advanced).** Problem: you cannot atomically commit a DB write and publish a message to a broker; a crash in between loses the message or publishes something that was never committed. Outbox: in the same local DB transaction that writes the business data, insert a row into an `outbox_events` table. A separate relay polls (or tails the binlog/CDC) for unpublished rows, publishes them to the queue, and marks them published. Guarantees: no lost events
(they are durable with the data), at-least-once publication (relay may publish twice after a crash), so consumers must be idempotent. Costs: extra table, polling latency, relay operation and cleanup.

**Q22 (Advanced).** BullMQ renews each active job's lock on a timer inside the worker's event loop. CPU-heavy synchronous work blocks the loop, so the renewal cannot run; the lock expires (`lockDuration` default 30s) and the stalled-job checker moves the job back to waiting, so another worker (or the same one) runs it again: duplicates. Fixes: run CPU-heavy work off the main thread (`worker_threads`, a BullMQ sandboxed
processor which runs in a child process, or a separate service), break work into smaller chunks that yield to the loop, increase `lockDuration` as a stopgap, and make the processor idempotent anyway.

**Q23 (Advanced).** Likely cause: Node's `keepAliveTimeout` (default 5s) is shorter than the ALB idle timeout (default 60s). The ALB reuses an idle connection at the moment Node closes it, the request hits a closed socket and the ALB returns 502. Logs are clean because Node never received the request (it was on a connection already closing). Fix: set `server.keepAliveTimeout` above the ALB idle timeout (for example 65s) and
`headersTimeout` slightly above that. Verify by correlating 502 timestamps with idle connections and by the ALB access logs showing a target connection reset with 0 bytes.

**Q24 (Advanced).** The connection is held for about 80 ms per request (two sequential 40 ms queries) so by Little's Law max throughput is about pool / hold time = 20 / 0.080 = 250 requests per second per instance from the pool alone. Beyond that, requests queue waiting for a connection: latency rises sharply (queue wait adds to response time), then timeouts or pool errors appear, while Node CPU may still look idle. Raise capacity by (a) reducing connection
hold time (a single JOIN query, faster queries via indexes, run independent queries in parallel with two connections only if worth it, release connections before external calls, caching hot reads) and (b) scaling out instances or increasing the pool while respecting `instances x pool < MySQL max_connections` with headroom. A bigger pool alone can just move the bottleneck to MySQL.

**Q25 (Advanced).** Mitigation first: if checkout is still creating duplicates, enable a stopgap (feature flag to block repeat POSTs per user for 30s, temporarily lower concurrency, or disable the buggy retry path), and plan refunds for affected users. Investigation: (1) sample duplicate pairs and look at timing: milliseconds apart suggests double click or concurrent retry with no uniqueness; seconds suggests client/LB retry after timeout; hours suggests job reprocessing or two schedulers.
(2) Use requestId logs for both: one request or two? Was there a timeout, a 502/504 on the first, or a retry from the app or LB? (3) Check queues for stalled/redelivered jobs and whether non-idempotent processors charge. (4) Check the DB for the absence of a UNIQUE constraint or idempotency-key enforcement; check for check-then-insert code. Confirm by reproducing with a concurrent test of identical requests.
Prevention: mandatory `Idempotency-Key` with UNIQUE(user_id, key) and request hash, pass the key to the payment provider, UNIQUE business keys on orders/payments, idempotent job processors, retries only in one layer, a concurrency regression test, a reconciliation job and an alert on duplicate business keys, and a blameless post-mortem with owners.

---

## Week 6 Weak-Area Identification Guidance

Mark each question right/wrong (give partial credit if you got the idea but missed details). Then map:

| Questions | Topic | If you missed them, re-read | Practice |
|-----------|-------|------------------------------|----------|
| Q1, Q2 | Test strategy, app factory | Day 1 sections 1.1, 1.5 | Write 3 Supertest tests for a new route |
| Q3, Q9, Q10, Q11, Q20 | Idempotency, retries, jitter | Day 3 sections 3.2, 3.3 | Re-implement `retry` and `withIdempotency`; concurrent duplicate test |
| Q4, Q5, Q8, Q12 | Logging, correlation ids | Day 2 sections 2.1, 2.2, 2.4 | Add ALS `requestId` to a small app and test concurrency |
| Q6, Q13, Q14, Q19 | Redis, caching, invalidation | Day 4 sections 4.1, 4.2, 4.4 | Implement `getOrSet` with a fake Redis and write the stale-set scenario on paper |
| Q7, Q15, Q17, Q21, Q22 | Queues, shutdown | Day 5 sections 5.1, 5.2 | Write the shutdown sequence from memory; build an idempotent worker |
| Q16, Q18, Q23, Q24, Q25 | Debugging, load testing, incidents | Day 6 sections 6.1 to 6.4 | Do the Day 6 broken-endpoints lab; run autocannon and read the output |

Diagnosis of your score (maximum 49):

- 40 or more: strong. Spend the next sessions on speaking your answers aloud and on the Week 7 design problems.
- 30 to 39: solid base with gaps. Fix the lowest category in the map, then re-take only those questions after 3 days (spaced revision).
- 20 to 29: you recognize the ideas but cannot yet apply them. Re-implement the Day 3 and Day 5 code from scratch without notes, then take the test again after 2 days.
- Below 20: do not panic; this week is dense. Use the catch-up plan below and treat idempotency, cache-aside and graceful shutdown as the three must-haves.

Pattern checks:
- Many wrong in Basic: vocabulary gaps, so re-read the "Interview answer" boxes.
- Basic fine, Intermediate wrong: you know definitions but not mechanisms, so redo the code labs.
- Advanced wrong only: acceptable for junior-to-mid roles; treat as stretch material, revisit after Week 7.

---

## Week 6 Catch-Up Plan (if you are behind)

Priority principle: what is asked most in interviews first. Rank for Week 6: (1) idempotency + retries + timeouts, (2) testing with mocks and Supertest, (3) caching with Redis and invalidation, (4) debugging method for slow APIs and incidents, (5) graceful shutdown and queue concepts, (6) logging and correlation ids, (7) memory leak tooling and load testing details.
Skip all `[ADVANCED]` items first (circuit breaker implementation, Lua locks, stale-while-revalidate, outbox implementation, clinic details, `memlab`), and come back to them only if time remains.

| Situation | Plan |
|-----------|------|
| Behind by 1 day (about 2 hours) | Use today's Day 7 slot for the missed day, but only read the "Concept", "Interview answer", "Follow-up questions" and "Revision notes" of each topic plus run one code lab. Do the weekly test the next morning (20 min, only Basic and Intermediate). |
| Behind by 2 to 3 days (about 4 to 6 hours) | Day A (2h): Day 3 idempotency and retries (read fully, code `withIdempotency` + test). Day B (2h): Day 1 test strategy + Day 4 cache-aside (answers and `getOrSet` test only). Day C (1.5h): Day 5 shutdown sequence + queue concepts and Day 6 section 6.1 + playbook table. Skim logging (Day 2: interview answers only). |
| Behind by a full week (about 14 hours) | Do the 7-hour "minimum viable Week 6": Day 3 (2h), Day 1 (1.5h), Day 4 (1.5h), Day 5 shutdown (1h), Day 6 method + playbook (1h). Then borrow 2 hours from Week 7 Days 1 and 6 and 3 hours from Week 8 revision days; mark Week 6 topics for the spaced revision schedule. Do NOT skip Week 7 payment/idempotency design (it reuses these ideas). |
| Understood concepts but cannot code them | Re-type the code labs (not copy-paste): retry, idempotency, cache wrapper, shutdown. Typing exposes gaps. 20 minutes each. |
| Short on time before an interview | Memorize: the negative-test table, idempotency flow, retry rules + jitter formula, cache-aside + invalidation rules + three cache problems, shutdown order, the incident method and the slow-API fork (waiting vs working). That is about 80 percent of what is asked. |

After catching up, update your checklist and add the weakest topics to the spaced-revision calendar at +1, +3 and +7 days. Remember: no one masters all of Week 6 in 8 weeks of study; being able to reason clearly about trade-offs and failure modes is what interviewers are testing.

---

End of Week 6. Next: `07_Week7_System_Design.md` (Day 43 onward).
