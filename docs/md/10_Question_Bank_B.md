# Question Bank B -- Categories 6-10

Authentication and Security, Testing and Debugging, Performance and Scalability, Production Scenarios, Backend System Design.

Companion file: `09_Question_Bank_A.md` covers categories 1-5 (JS, Node internals, Express, SQL, MongoDB).
Related notes: Week 5 (`05_Week5_Data_Auth_Security.md`), Week 6 (`06_Week6_Testing_Production.md`), Week 7 (`07_Week7_System_Design.md`), exercises in `11_Coding_Exercises.md`.

## How to use this bank

- Cover the **Interview answer** with your hand, say your own answer aloud, then compare.
- The **Hinglish explanation** is for understanding. If you cannot explain the "why" in your own words, you have memorized, not understood -- re-read the Hinglish part.
- Tier tags: `[ESSENTIAL]` = asked in most junior-to-mid interviews. `[ADVANCED]` = supplementary, for stronger roles or when time permits.
- Difficulty tags: Basic, Intermediate, Advanced (as required by the spec).
- Code uses ES modules, Node.js 22 LTS (Node 20 differences noted), Express 5, mysql2/promise, parameterized queries.
- Honest note: you will not master all 150+ questions in 8 weeks. Do every `[ESSENTIAL]` first.

## Mini index table

| Category | ID range | Count | Main topics |
|----------|----------|-------|-------------|
| 6. Authentication and Security | Q-SEC-01 .. Q-SEC-32 | 32 | hashing, bcrypt, JWT, refresh tokens, sessions, RBAC, IDOR, SQLi, XSS, CSRF, CORS, rate limiting, secrets, headers, OAuth |
| 7. Testing and Debugging | Q-TEST-01 .. Q-TEST-30 | 30 | unit vs integration, Jest/Vitest, Supertest, mocking, negative tests, flaky tests, logging, correlation IDs, debugging tools |
| 8. Performance and Scalability | Q-PERF-01 .. Q-PERF-32 | 32 | profiling, N+1, indexing, caching, Redis, pooling, streams, clustering, load testing, horizontal scaling |
| 9. Production Scenarios | Q-PROD-01 .. Q-PROD-32 | 32 | slow API, memory climbing, duplicate payments, DB connections exhausted, 502s, stuck queues, incident response |
| 10. Backend System Design | Q-SD-01 .. Q-SD-30 | 30 | rate limiter, URL shortener, notifications, file upload, payments, queues, monolith vs microservices, Docker |

---

# CATEGORY 6: AUTHENTICATION AND SECURITY

## Q-SEC-01 -- Authentication vs authorization

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What is the difference between authentication and authorization? Give a backend example.

**Interview answer:** Authentication answers "who are you?" -- it verifies identity, for example by checking an email and password or validating a token. Authorization answers "what are you allowed to do?" -- it decides whether that verified identity may perform a specific action on a specific resource. Authentication always happens first. In an API, an auth middleware verifies the token and sets `req.user`; authorization checks like "is this user an admin?" or "does this order belong to this user?" happen afterwards, in a role middleware or in the service layer.

**Hinglish explanation:** Authentication matlab pehchaan -- tum kaun ho. Authorization matlab permission -- tum kya kar sakte ho. Office ka example lo: gate par ID card dikhana = authentication. Andar jaakar server room khol pana ya nahi = authorization. Frontend me jaise login page aur protected route (role check) hote hain, same cheez backend me enforce hoti hai -- aur backend wala hi asli security hai, kyunki frontend ko user bypass kar sakta hai.

**Example:**

```js
// authentication: who is this?
export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    req.user = verifyAccessToken(token); // { id, role }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// authorization: may they do this?
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });
```

**Follow-ups:**
- Q: 401 or 403? A: 401 = not authenticated (missing/invalid credentials). 403 = authenticated but not permitted.
- Q: Is hiding a button in React authorization? A: No. It is UX only. The API must enforce the rule.

---

## Q-SEC-02 -- Why hash passwords instead of encrypting them

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Why do we hash passwords rather than encrypt them or store them in plain text?

**Interview answer:** Encryption is reversible: anyone with the key can recover every password, and the key often lives next to the data. Hashing is one-way, so even if the database leaks, attackers cannot directly read passwords. For passwords we use a slow, salted, purpose-built hash such as bcrypt, scrypt, or Argon2, not a fast hash like SHA-256. At login we hash the submitted password with the stored salt and compare results; we never need the original password.

**Hinglish explanation:** Server ko password yaad rakhne ki zaroorat nahi, sirf verify karna hai. Isliye one-way hash use karte hain. Agar encrypt kiya aur key leak ho gayi, to saare passwords ek saath khul jaate hain. Hash me wapas original nikalna practically impossible hai -- attacker sirf guess karke try kar sakta hai. Isliye slow hash chahiye taaki guessing mehengi pade.

**Follow-ups:**
- Q: Why not SHA-256? A: It is designed to be fast; GPUs can try billions per second. Password hashes must be deliberately slow and memory/CPU hard.
- Q: Can I "decrypt" a hash? A: No. Attackers only guess candidates and hash them; slow hashes and salts make that expensive.
- Q: What is "forgot password" then? A: We cannot send the old password. We issue a reset token and let the user set a new one (see Q-SEC-25).

---

## Q-SEC-03 -- How bcrypt works: salt and cost factor

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** How does bcrypt work? What are the salt and the cost factor?

**Interview answer:** bcrypt is an adaptive password hashing function based on the Blowfish cipher. Each hash includes a random per-password salt, which makes identical passwords produce different hashes and defeats precomputed rainbow tables. The cost factor (work factor, for example 12) sets the number of iterations as 2^cost, so you can raise it as hardware gets faster. The output string contains the algorithm version, cost, salt, and hash together, so `bcrypt.compare` needs only the plain password and the stored string.

**Hinglish explanation:** Salt = random data jo har password ke saath mil jaata hai. Do users ka password "abc123" same ho, tab bhi hash alag aayega. Cost factor = kitna slow banana hai. Cost 12 matlab 2^12 rounds. Hardware tez ho jaaye to cost badha do. Hash string me hi salt aur cost ka info hota hai, isliye alag column nahi chahiye.

**Example:**

```js
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash('S3cret!pass', 12);
// $2b$12$<22-char salt><31-char hash>
const ok = await bcrypt.compare('S3cret!pass', hash); // true
```

**Follow-ups:**
- Q: Does bcrypt block the event loop? A: The `bcrypt` native package runs hashing on the libuv thread pool (async API), so the event loop stays free. The pure-JS `bcryptjs` is slower and runs on the main thread in chunks. Under heavy login load the default pool of 4 threads can saturate.
- Q: What cost should I pick? A: Tune so one hash takes roughly 100-300 ms on your production hardware; 10-12 is a common starting point.
- Q: bcrypt input limit? A: bcrypt only uses the first 72 bytes of the password. Very long passwords are truncated; some teams pre-hash or cap length.

---

## Q-SEC-04 -- bcrypt vs scrypt vs Argon2

**Difficulty:** Intermediate | `[ADVANCED]`

**Question:** Which password hashing algorithm would you choose today and why?

**Interview answer:** Argon2id is the current recommendation (OWASP lists it first) because it is both CPU-hard and memory-hard, which hurts GPU and ASIC attackers. scrypt is also memory-hard and is available in Node's built-in `crypto` module. bcrypt is older but still acceptable, battle-tested, and widely supported. The most important thing is to use any of them correctly with a proper cost, rather than debate which is best. For a typical Node service, bcrypt or Argon2id with sensible parameters is fine.

**Hinglish explanation:** Attacker GPU se lakhon guesses karta hai. Memory-hard algorithm (Argon2, scrypt) me har guess ke liye bahut RAM chahiye, to GPU ka advantage kam ho jaata hai. bcrypt memory kam use karta hai par phir bhi theek hai. Interview me bas ye bolo: "Argon2id preferred, bcrypt acceptable, SHA-256 / MD5 never."

**Example (built-in scrypt):**

```js
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = stored.split(':');
  const key = await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64);
  return timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}
```

**Follow-ups:**
- Q: How do you migrate from an old hash? A: Store an algorithm/version marker; on successful login, re-hash with the new algorithm and save ("rehash on login").
- Q: What is a pepper? A: A secret value added to the password before hashing, stored outside the database (for example in a secrets manager). Extra defense if the DB alone leaks.

---

## Q-SEC-05 -- Secure login endpoint

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Design a secure login API. What mistakes do people commonly make?

**Interview answer:** Validate input, look up the user by email with a parameterized query, compare the password with `bcrypt.compare`, and on success issue short-lived tokens. On failure return one generic message such as "Invalid email or password" with 401, so attackers cannot enumerate which emails exist. Add rate limiting and account lockout/backoff against brute force, use HTTPS, and never log passwords or tokens. Also compare against a dummy hash when the user does not exist so response time does not reveal whether the account exists.

**Hinglish explanation:** Common galtiyan: "Email not found" aur "Wrong password" alag-alag message dena (attacker ko pata chal jaata hai kaun sa email registered hai), password log kar dena, rate limit na lagana, aur 200 status ke saath error bhej dena. Ek hi generic error do, aur time bhi same rakho.

**Example:**

```js
import bcrypt from 'bcrypt';

const DUMMY_HASH = await bcrypt.hash('dummy-password-for-timing', 12);

export async function login(req, res) {
  const { email, password } = req.body; // validated earlier by schema
  const [rows] = await pool.execute(
    'SELECT id, password_hash, role FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  res.json({ accessToken });
}
```

**Follow-ups:**
- Q: Should signup also hide whether an email exists? A: Ideally yes -- respond "check your email" regardless; at minimum rate-limit it. This is a trade-off against UX.
- Q: How do you stop brute force? A: Per-IP and per-account rate limits, exponential delay, temporary lockout, CAPTCHA after N failures, and alerting. Beware lockout being abused for denial of service against a victim.

---

## Q-SEC-06 -- JWT structure

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What is the structure of a JWT? Is the payload encrypted?

**Interview answer:** A JWT has three Base64URL-encoded parts separated by dots: header (algorithm and type), payload (claims such as `sub`, `exp`, `iat`, `role`), and signature. The signature is computed over `header.payload` with a secret (HS256) or a private key (RS256), so any change is detectable. The payload is only encoded, not encrypted -- anyone can decode and read it. So never put passwords, secrets, or sensitive personal data in a JWT.

**Hinglish explanation:** JWT ek sealed-but-transparent envelope jaisa hai. Andar ka content koi bhi padh sakta hai (base64 decode karo), lekin agar koi content badle to seal (signature) toot jaata hai aur server pakad leta hai. Isliye JWT = integrity guarantee, confidentiality nahi.

**Example:**

```js
import jwt from 'jsonwebtoken';

const token = jwt.sign({ sub: '42', role: 'user' }, process.env.JWT_SECRET, {
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: 'api.example.com',
});
// header.payload.signature
const decodedWithoutVerify = jwt.decode(token); // anyone can do this
```

**Follow-ups:**
- Q: What are standard claims? A: `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`.
- Q: Why is a JWT "stateless"? A: The server verifies it with the key alone, no DB/session lookup. The cost is that revocation is hard (see Q-SEC-12).

---

## Q-SEC-07 -- Verifying a JWT correctly

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What must you check when verifying a JWT? What is the "alg: none" problem?

**Interview answer:** Verify the signature with the expected key, and pin the allowed algorithms explicitly. Check `exp` (and `nbf`), and validate `iss` and `aud` where relevant. Never use `jwt.decode` for authentication, because decode does not verify anything. The "alg: none" attack and the RS256-to-HS256 confusion attack work when a server trusts the algorithm named in the token header; pinning `algorithms: ['HS256']` prevents both. Modern `jsonwebtoken` versions reject `none` by default, but pinning is still best practice.

**Hinglish explanation:** Token ka header attacker likh sakta hai. Agar server bole "jo algorithm header me likha hai wahi use kar lo", to attacker "none" likh dega ya public key ko HMAC secret bana dega. Isliye server khud decide kare -- "main sirf HS256 accept karunga".

**Example:**

```js
const payload = jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ['HS256'],
  issuer: 'api.example.com',
  clockTolerance: 5, // seconds of allowed clock skew
});
```

**Follow-ups:**
- Q: decode vs verify? A: decode only base64-decodes; verify also checks signature and claims.
- Q: Where does the secret come from? A: Environment/secrets manager, at least 32 random bytes; never hard-coded.

---

## Q-SEC-08 -- Access tokens and refresh tokens

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Why use both access and refresh tokens? How long should each live?

**Interview answer:** An access token is short-lived (for example 5-15 minutes) and sent with every API request, so if it leaks the damage window is small. A refresh token is long-lived (days or weeks), used only against the auth endpoint to obtain new access tokens, and is stored more carefully (httpOnly secure cookie) and tracked server-side so it can be revoked. This gives stateless fast verification for most requests while still allowing logout, revocation, and session control.

**Hinglish explanation:** Access token = chhota day-pass, har jagah dikhate ho. Refresh token = membership card, sirf reception par dikhate ho naya day-pass lene ke liye. Day-pass chori ho jaaye to 15 minute baad bekaar. Membership card ko safe rakhte ho aur DB me record rakhte ho taaki cancel kar sako.

**Follow-ups:**
- Q: Where is the refresh token stored in DB? A: Store a hash of it (like a password), with user id, expiry, device info, and revoked flag.
- Q: What happens when access token expires in the SPA? A: An interceptor calls `/auth/refresh`, retries the original request once, and redirects to login if refresh fails.

---

## Q-SEC-09 -- Refresh token rotation and reuse detection

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** What is refresh token rotation and how does reuse detection protect users?

**Interview answer:** With rotation, every refresh call returns a new refresh token and invalidates the old one. Tokens belong to a "family". If an already-used refresh token is presented again, it means it was probably stolen (either the thief or the real user is replaying it), so the server revokes the entire family and forces re-login. This limits the value of a stolen refresh token to a single use window and gives a detection signal.

**Hinglish explanation:** Har baar refresh karne par purana card cancel aur naya card milta hai. Agar kisi ne purana card dobara use kiya, to pakka koi duplicate bana kar chal raha hai -- system us user ke saare cards cancel kar deta hai. Thoda tricky hai kyunki network retry me real user bhi purana token bhej sakta hai, isliye kuch systems chhota grace period dete hain.

**Example (sketch):**

```js
export async function refresh(req, res) {
  const presented = req.cookies.refresh_token;
  const hash = sha256(presented);
  const [rows] = await pool.execute(
    'SELECT id, user_id, family_id, used_at, expires_at FROM refresh_tokens WHERE token_hash = ?',
    [hash]
  );
  const row = rows[0];
  if (!row || row.expires_at < new Date()) return res.sendStatus(401);

  if (row.used_at) { // reuse detected
    await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE family_id = ?', [row.family_id]);
    return res.sendStatus(401);
  }
  await pool.execute('UPDATE refresh_tokens SET used_at = NOW() WHERE id = ?', [row.id]);
  const next = await issueRefreshToken(row.user_id, row.family_id); // new row, same family
  res.cookie('refresh_token', next, { httpOnly: true, secure: true, sameSite: 'strict', path: '/auth' });
  res.json({ accessToken: signAccessToken({ id: row.user_id }) });
}
```

Note: the "mark used" step should be atomic (`UPDATE ... WHERE used_at IS NULL` and check affected rows) so two parallel refreshes do not both succeed.

**Follow-ups:**
- Q: Why hash refresh tokens in DB? A: Same reason as passwords: a DB leak should not hand out usable tokens. SHA-256 is fine here because tokens are long random values, not guessable passwords.
- Q: Is the race with parallel tabs a problem? A: Yes; use a short grace window or a single-flight refresh in the client.

---

## Q-SEC-10 -- Sessions vs JWT

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Compare server-side sessions and JWT authentication. When would you choose each?

**Interview answer:** With sessions, the server stores state (in memory, Redis, or a DB) and gives the client an opaque session id in a cookie; revocation and logout are trivial, but every request needs a store lookup and scaling needs a shared store. With JWT, the token itself carries claims and is verified by signature, so there is no lookup and it suits multiple services, but revocation before expiry is hard and tokens get large. For a classic web app with one backend, sessions in Redis are simple and secure. For APIs consumed by mobile apps or many services, short-lived JWT plus refresh tokens is common. Many systems mix both.

**Hinglish explanation:** Session = server ke paas register, client ke paas sirf token number. Kabhi bhi register me se entry delete karke user ko logout kara sakte ho. JWT = client ke paas hi poori information (signed). Server ko yaad nahi rakhna padta, par ek baar de diya to expiry tak wapas nahi le sakte. "JWT hamesha behtar hai" ek myth hai; trade-off dekho.

| Aspect | Session | JWT |
|--------|---------|-----|
| State | server-side | client-side (stateless) |
| Revocation | instant | hard (needs denylist/short expiry) |
| Scaling | shared store needed | easy |
| Size per request | tiny id | larger token |
| Best for | monolith web apps | APIs, mobile, microservices |

**Follow-ups:**
- Q: Is JWT more secure than sessions? A: Not inherently. Security depends on storage, expiry, and transport.
- Q: Can sessions scale? A: Yes, with Redis or sticky sessions; Redis-backed sessions scale well.

---

## Q-SEC-11 -- Where to store tokens on the client

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Where should a browser app store tokens: localStorage or cookies?

**Interview answer:** localStorage is readable by any JavaScript on the page, so one XSS bug lets an attacker steal the token. An httpOnly cookie cannot be read by JavaScript, which removes that theft path, but cookies are sent automatically so you must defend against CSRF with SameSite, CSRF tokens, or custom headers. A common balanced pattern is: access token kept in memory, refresh token in an httpOnly, Secure, SameSite cookie scoped to the refresh path.

**Hinglish explanation:** Frontend dev hone ke naate tum jaante ho localStorage easily accessible hai. XSS se koi bhi script `localStorage.getItem` kar sakti hai. httpOnly cookie ko JS dekh hi nahi sakti, par browser use khud bhejta hai, to CSRF ka khatra aa jaata hai. Har option me ek risk hai; combine karke dono kam karte hain.

**Example:**

```js
res.cookie('refresh_token', token, {
  httpOnly: true,   // not readable from JS
  secure: true,     // HTTPS only
  sameSite: 'strict',
  path: '/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

**Follow-ups:**
- Q: What about memory-only access token and page refresh? A: On load the SPA silently calls `/auth/refresh` to get a new access token.
- Q: Cookie vs Authorization header for APIs used by mobile? A: Mobile apps typically use the header with secure OS storage (Keychain/Keystore).

---

## Q-SEC-12 -- Logging out / revoking a JWT

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** JWTs are stateless. How do you log a user out or revoke a token before it expires?

**Interview answer:** You cannot "delete" a stateless token, so you add a small amount of state. Options: keep access tokens very short-lived and revoke the refresh token on logout; maintain a denylist of token ids (`jti`) in Redis with a TTL equal to the remaining lifetime; or store a per-user `token_version` and reject tokens with an older version (this also gives "log out everywhere"). Revoking the refresh token is the usual baseline, with the denylist or version added for sensitive events such as a password change.

**Hinglish explanation:** JWT ek baar issue hua to server bhool jaata hai. Isliye ya to expiry chhoti rakho (15 min), ya Redis me "blocked list" rakho. Password change ya account hack hone par `token_version` badha do -- purane saare tokens apne aap invalid ho jaate hain.

**Example:**

```js
// denylist entry lives only as long as the token could still be valid
export async function blockToken(jti, exp) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.set(`deny:${jti}`, '1', { EX: ttl });
}
// in authenticate middleware, after jwt.verify:
if (await redis.exists(`deny:${payload.jti}`)) return res.sendStatus(401);
```

**Follow-ups:**
- Q: Does a denylist defeat the stateless benefit? A: Partly; it adds one fast Redis lookup. It is a trade-off between security and purity.
- Q: How do you "logout all devices"? A: Revoke all refresh tokens for the user and/or bump `token_version`.

---

## Q-SEC-13 -- Implementing RBAC

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you implement role-based access control in an Express API?

**Interview answer:** Store the user's role(s) in the database, put the role in the verified token or load it per request, and apply a reusable middleware that checks the role against the route's allowed roles. For finer control, map roles to permissions (for example `order:refund`) and check permissions rather than role names, so roles can change without touching route code. Always enforce on the server, and for sensitive actions re-read the role from the database, because a role inside a long-lived token can be stale.

**Hinglish explanation:** RBAC me user ko role milta hai (admin, seller, buyer) aur role ko permissions. Route par middleware lagao. Dhyan rahe: token me role purana ho sakta hai (admin se normal bana diya par token abhi valid hai), isliye critical actions par DB se check karo.

**Example:**

```js
const permissions = {
  admin: ['user:delete', 'order:refund', 'order:read'],
  seller: ['order:read'],
  buyer: [],
};
export const can = (perm) => (req, res, next) =>
  permissions[req.user.role]?.includes(perm)
    ? next()
    : res.status(403).json({ error: 'Forbidden' });

router.post('/orders/:id/refund', authenticate, can('order:refund'), refundOrder);
```

**Follow-ups:**
- Q: RBAC vs ABAC? A: ABAC decides from attributes (owner, department, time, amount). Use RBAC for coarse access plus ownership checks for individual resources.
- Q: Role in JWT or in DB? A: JWT is fast but can be stale; a DB or cached lookup is fresher. Choose by sensitivity.

---

## Q-SEC-14 -- IDOR / Broken Object Level Authorization

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** A user calls `GET /api/orders/123`. What security check is often forgotten, and how do you fix it?

**Interview answer:** The forgotten check is object-level authorization: confirming order 123 belongs to the caller. Without it any logged-in user can change the id and read someone else's data. This is an Insecure Direct Object Reference (IDOR), also called BOLA, and it is the top risk in the OWASP API Security list. The fix is to scope queries by owner (`WHERE id = ? AND user_id = ?`) or to check ownership in the service layer, and to return 404 for resources the caller may not see. Non-guessable ids help but are not a fix.

**Hinglish explanation:** Login hona kaafi nahi hai. `/orders/123` ko `/orders/124` karke koi dusre ka order dekh le to galti backend ki hai. Har resource query me owner ka filter lagao. Sirf UUID use karna security nahi hai, bas guess karna mushkil banata hai.

**Example:**

```js
const [rows] = await pool.execute(
  'SELECT * FROM orders WHERE id = ? AND user_id = ?',
  [req.params.id, req.user.id]
);
if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
res.json(rows[0]);
```

**Follow-ups:**
- Q: 403 or 404? A: 404 avoids confirming the resource exists; 403 is more explicit. Many teams choose 404 for privacy.
- Q: How do you test it? A: An integration test where user A's token requests user B's resource and must fail.

---

## Q-SEC-15 -- SQL injection

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What is SQL injection and how do you prevent it in Node.js?

**Interview answer:** SQL injection happens when untrusted input is concatenated into a SQL string so the input changes the query's structure. Prevent it with parameterized queries (prepared statements), where values are sent separately from the SQL text and the database never interprets them as code. Also validate input, use least-privilege database accounts, and whitelist anything that cannot be parameterized, such as column names for `ORDER BY`. An ORM helps only if you avoid raw string interpolation.

**Hinglish explanation:** Agar tum `"SELECT * FROM users WHERE email = '" + email + "'"` likhte ho aur user `' OR '1'='1` bhejta hai, to query ka matlab hi badal jaata hai. Placeholder `?` use karne par value hamesha data maani jaati hai, code nahi. Table/column names placeholder se nahi jaate -- unke liye allowed list banao.

**Example:**

```js
// BAD (never do this):
// await pool.query(`SELECT * FROM users WHERE email = '${email}'`);

// GOOD
const [rows] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email]);

// whitelist for ORDER BY (identifiers cannot be placeholders)
const SORTABLE = { created: 'created_at', price: 'price' };
const col = SORTABLE[req.query.sort] ?? 'created_at';
const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC';
const [items] = await pool.query(
  `SELECT id, price FROM products ORDER BY ${col} ${dir} LIMIT ?`,
  [20]
);
```

**Follow-ups:**
- Q: Is escaping enough? A: Parameterization is more reliable than manual escaping.
- Q: Why `pool.query` for LIMIT above? A: With mysql2 `execute` (true prepared statements) a JS number bound to `LIMIT ?` is sent as a DOUBLE and older mysql2 versions fail with `Incorrect arguments to mysqld_stmt_execute` (tested on MySQL 8.0.46: mysql2 2.3.3 through 3.20.0 fail, 3.24.6 works; passing the limit as a string `'20'` to `execute` works on the older versions). `query` does client-side substitution, so a number works but a string becomes `LIMIT '20'` and is a syntax error. The value is still a validated number.
- Q: Second-order injection? A: Stored malicious data later used unsafely in another query. Parameterize everywhere, not only at the input point.

---

## Q-SEC-16 -- XSS

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What is XSS, and what can a backend do about it?

**Interview answer:** Cross-Site Scripting is when an attacker gets their JavaScript to run in another user's browser on your origin, through stored, reflected, or DOM-based injection. Impact includes stealing tokens, acting as the user, and defacing pages. The main defense is output encoding in the view layer (React escapes by default; avoid `dangerouslySetInnerHTML`). The backend contributes by validating input, sanitizing any rich HTML it must accept with a library such as sanitize-html, sending a strict Content-Security-Policy, using httpOnly cookies so scripts cannot read session cookies, and returning correct `Content-Type` headers.

**Hinglish explanation:** XSS me attacker tumhari site par apna script chala deta hai (jaise comment me `<script>` likh kar). Frontend me React default me escape karta hai, isliye tumhe pata hai `dangerouslySetInnerHTML` risky hai. Backend side par: rich text allow karna ho to sanitize karo, CSP lagao, aur token ko httpOnly cookie me rakho.

**Example:**

```js
import helmet from 'helmet';
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    objectSrc: ["'none'"],
  },
}));
```

**Follow-ups:**
- Q: Stored vs reflected? A: Stored lives in the DB and hits many users; reflected is in a crafted link and hits whoever clicks.
- Q: Is a JSON API safe from XSS? A: Mostly, if it returns `application/json` and clients render safely; the risk is in how clients render the data.

---

## Q-SEC-17 -- CSRF and SameSite cookies

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What is CSRF and when does it apply? How do you prevent it?

**Interview answer:** Cross-Site Request Forgery tricks a logged-in user's browser into sending an unwanted request to your site; because browsers attach cookies automatically, the server cannot tell it was forged. It applies when authentication relies on cookies. Defenses: `SameSite=Lax` or `Strict` on cookies, anti-CSRF tokens (synchronizer or double-submit), checking the `Origin` header, and requiring a custom header or JSON content type on state-changing requests. APIs that authenticate only with an `Authorization` header (not cookies) are not CSRF-prone.

**Hinglish explanation:** Tum bank me login ho aur dusri tab me evil.com khola. Evil.com ek hidden form bhejta hai bank ko "transfer money" -- browser tumhari cookie khud laga deta hai. Isliye SameSite cookie lagao (cross-site request me cookie na jaye) aur state-changing requests par CSRF token maango. Header-based token me ye problem nahi kyunki browser header khud nahi lagata.

**Example:**

```js
res.cookie('sid', sessionId, { httpOnly: true, secure: true, sameSite: 'lax' });

// simple Origin check for state-changing requests
const ALLOWED = new Set(['https://app.example.com']);
export function checkOrigin(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin && !ALLOWED.has(origin)) return res.sendStatus(403);
  }
  next();
}
```

**Follow-ups:**
- Q: Why must GET be safe (no state change)? A: GET can be forged easily via links or images.
- Q: Does CORS prevent CSRF? A: No (see Q-SEC-19).

---

## Q-SEC-18 -- What is CORS and how does it work

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What is CORS? Explain preflight requests.

**Interview answer:** CORS (Cross-Origin Resource Sharing) is a browser mechanism that relaxes the same-origin policy: a server tells the browser which other origins may read its responses, using headers such as `Access-Control-Allow-Origin`. For non-simple requests (custom headers like `Authorization`, methods like PUT or DELETE, JSON content type) the browser first sends an `OPTIONS` preflight asking whether the real request is allowed. If the response does not permit it, the browser blocks the frontend JavaScript from using the response. CORS is enforced by browsers, not servers, so curl and Postman ignore it.

**Hinglish explanation:** Tum frontend dev ho, "CORS error" roz dekhte ho. Asli baat: browser dusre origin (domain/port/protocol) ke response ko JS ko dene se pehle poochta hai "server, kya allowed hai?". Backend ko sahi headers bhejne hain. Preflight = browser ka pehle se `OPTIONS` call. Ye security feature user ke browser ko bachata hai, server ko nahi.

**Example:**

```js
import cors from 'cors';
app.use(cors({
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,   // allow cookies; origin must NOT be '*'
  maxAge: 600,         // cache preflight for 10 minutes
}));
```

**Follow-ups:**
- Q: Why can't I use `*` with credentials? A: The spec forbids it; the origin must be explicit.
- Q: "Works in Postman, fails in browser"? A: Postman does not enforce CORS; browsers do.
- Q: Why is my 401 or 500 shown as a CORS error? A: Error responses that lack CORS headers (cors middleware registered after the failing route, or a crash before it) look like CORS failures in the browser.

---

## Q-SEC-19 -- CORS is not a security tool for your API

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Does CORS protect my API from attackers or from CSRF?

**Interview answer:** No. CORS only controls whether a browser lets frontend JavaScript from another origin read a response. Attackers can call your API directly with curl, and a cross-site form POST can still be sent by the browser (CORS does not stop "simple" requests from being sent, only their responses from being read). Real protection comes from authentication, authorization, CSRF defenses, rate limiting, and validation. Reflecting any incoming origin together with credentials, however, is a genuine vulnerability.

**Hinglish explanation:** Log sochte hain CORS lagaya to API safe. Galat. CORS sirf browser ka rule hai. Hacker script se seedha request maar sakta hai. Isliye auth, permissions aur rate limit zaroori hain. Aur "jo origin aaye wahi allow kar do" wali galti mat karna -- wo cookies ke saath dangerous hai.

**Follow-ups:**
- Q: What is a safe origin policy? A: A fixed allow-list from config, per environment.
- Q: Is a public read-only API with `*` OK? A: Yes, if it has no credentials and no private data.

---

## Q-SEC-20 -- Rate limiting and brute-force protection

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you implement rate limiting and what do you limit by?

**Interview answer:** Rate limiting caps how many requests a client can make in a time window, to protect against brute force, scraping, and overload. Use `express-rate-limit` for a single instance, but with multiple instances use a shared store such as Redis so limits are global. Limit by IP for anonymous endpoints and by user id or API key for authenticated ones, with stricter limits on login, signup, OTP, and password reset. Return `429 Too Many Requests` with a `Retry-After` header. Behind a proxy, configure `trust proxy` so the real client IP is used. For algorithm detail see Q-SD-01.

**Hinglish explanation:** Rate limit = "ek window me max N request". Login par 5 attempts per 15 min brute force rokta hai. Dhyan do: agar load balancer ke peeche ho aur `trust proxy` set nahi kiya, to sabhi users ka IP load balancer ka dikhega aur sab ek hi bucket me aa jaayenge. Aur memory store multi-server me kaam nahi karta, Redis chahiye.

**Example:**

```js
import rateLimit from 'express-rate-limit';
app.set('trust proxy', 1); // one proxy hop (for example nginx or an ALB)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later' },
});
app.post('/auth/login', loginLimiter, login);
```

**Follow-ups:**
- Q: Many users behind one IP (office NAT)? A: Combine IP with an account identifier; use a higher limit per IP and a lower one per account.
- Q: Fixed window vs sliding window vs token bucket? A: See Q-SD-01.

---

## Q-SEC-21 -- Secrets and configuration management

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** How do you manage secrets such as DB passwords and JWT keys?

**Interview answer:** Never commit secrets to git or hard-code them. Read them from environment variables in development (a git-ignored `.env` file; Node 20.6+ supports `--env-file`), and from a secrets manager (AWS Secrets Manager, SSM Parameter Store, Vault) or the platform's secret injection in production. Validate required config at startup and fail fast if something is missing, use different secrets per environment, rotate them, give each service least privilege, and make sure logs and error messages never print them. If a secret was ever committed, treat it as compromised and rotate it, because git history keeps it.

**Hinglish explanation:** `.env` ko `.gitignore` me daalo aur `.env.example` commit karo (bina real values ke). Production me secret manager use karo. Galti se push ho gaya to file delete karna kaafi nahi -- history me rahega, secret ko rotate (naya banao) karna padega.

**Example:**

```js
// config.js -- fail fast at startup
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}
export const config = Object.freeze({
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
});
// run: node --env-file=.env server.js   (Node 20.6+)
```

**Follow-ups:**
- Q: Are env vars fully secure? A: They can leak via process dumps, `/proc`, crash reports, or child processes; a secrets manager adds access control and audit.
- Q: Where must a JWT secret never live? A: In frontend code or in the repo.

---

## Q-SEC-22 -- Security headers and helmet

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What does helmet do and which headers matter?

**Interview answer:** helmet is Express middleware that sets a collection of protective HTTP headers. Important ones: `Strict-Transport-Security` (force HTTPS), `Content-Security-Policy` (limit script sources, mitigate XSS), `X-Content-Type-Options: nosniff` (stop MIME sniffing), framing protection through CSP `frame-ancestors` or `X-Frame-Options` (clickjacking), and `Referrer-Policy`. Also disable `X-Powered-By` so the stack is not advertised. Headers are defense in depth, not a replacement for secure code.

**Hinglish explanation:** Helmet ek line me kai browser-side safety switches on kar deta hai: `app.use(helmet())`. Ye khud hacker ko nahi rokta, par browser ko bolta hai "is page ko iframe me mat dikhana, sirf HTTPS use karna, aise scripts mat chalana".

**Example:**

```js
import express from 'express';
import helmet from 'helmet';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
```

**Follow-ups:**
- Q: What is HSTS? A: It tells browsers to use HTTPS only for the domain for a set time; prevents downgrade attacks.
- Q: Can CSP break my app? A: Yes; test with `Content-Security-Policy-Report-Only` first.

---

## Q-SEC-23 -- HTTPS, TLS, and where it terminates

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Why must an API use HTTPS, and where is TLS usually terminated?

**Interview answer:** HTTPS (HTTP over TLS) encrypts traffic, authenticates the server through its certificate, and protects integrity, so passwords and tokens cannot be sniffed or modified on the network. In production TLS is usually terminated at a reverse proxy or load balancer (nginx, AWS ALB, Cloudflare), which forwards plain HTTP to Node over a private network. Then Node must trust the proxy headers (`trust proxy`) so `req.secure` and `req.ip` are correct, and `Secure` cookies work. Add HSTS and redirect HTTP to HTTPS.

**Hinglish explanation:** HTTP me password plain text me network par ghoomta hai. HTTPS me encrypted. Aksar Node khud certificate handle nahi karta; nginx ya load balancer karta hai (TLS termination) aur Node ko normal HTTP bhejta hai. Isiliye `app.set('trust proxy', 1)` zaroori hai warna Express sochega connection insecure hai.

**Follow-ups:**
- Q: Should internal traffic be encrypted too? A: For sensitive systems yes (mTLS or private network policy); it depends on the threat model.
- Q: Why did my `Secure` cookie not get set? A: Often the app sees HTTP from the proxy and `trust proxy` is not configured.

---

## Q-SEC-24 -- Input validation and mass assignment

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Why validate input on the server, and what is mass assignment?

**Interview answer:** Client-side validation is a convenience; any client can be bypassed, so the server must validate type, format, length, and range of every input with a schema library such as Zod or Joi, rejecting unknown fields. Mass assignment is when you spread the request body straight into a DB update or model, letting an attacker set fields they should not control, such as `role: 'admin'` or `isPaid: true`. Prevent it with explicit allow-listed fields (pick only what the endpoint accepts), and never trust ids or ownership from the body.

**Hinglish explanation:** `User.update(req.body)` likhna dangerous hai: attacker body me `"role":"admin"` bhej dega. Hamesha schema se sirf allowed fields lo. Frontend validation sirf UX ke liye; Postman se koi bhi kuch bhi bhej sakta hai.

**Example:**

```js
import { z } from 'zod';

const updateProfile = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().regex(/^\d{10}$/).optional(),
}).strict(); // unknown keys (like role) cause an error

export function updateMe(req, res) {
  const data = updateProfile.parse(req.body); // throws ZodError -> 400 via error middleware
  // update only the allowed fields
  return userService.update(req.user.id, data).then((u) => res.json(u));
}
```

**Follow-ups:**
- Q: Validation vs sanitization? A: Validation rejects bad input; sanitization cleans it (trim, strip HTML). Prefer validate and reject; sanitize when you must accept messy data.
- Q: Where do you validate? A: At the edge (middleware) and keep business invariants in the service layer.

---

## Q-SEC-25 -- Secure password reset flow

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Design a secure "forgot password" flow.

**Interview answer:** The user submits their email; the server always replies with the same message regardless of whether the account exists. If it exists, generate a cryptographically random token (`crypto.randomBytes(32)`), store only its hash with an expiry (for example 15-30 minutes) and single-use flag, and email a link containing the raw token. When the user submits a new password with the token, hash the token, find the record, check expiry and unused status, update the password hash, mark the token used, and revoke existing sessions and refresh tokens. Rate-limit the endpoint.

**Hinglish explanation:** Reset token ko password jaisa treat karo: DB me sirf hash. Token ek baar chalega, jaldi expire hoga. "Email registered nahi hai" jaisa error mat do, sabko "agar account hai to mail bhej diya" bolo. Reset ke baad purane sessions kill karo, kyunki ho sakta hai attacker pehle se logged in ho.

**Example:**

```js
import { randomBytes, createHash } from 'node:crypto';

const sha256 = (v) => createHash('sha256').update(v).digest('hex');

export async function requestReset(email) {
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (!rows[0]) return; // same response either way
  const raw = randomBytes(32).toString('hex');
  await pool.execute(
    'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL 30 MINUTE)',
    [rows[0].id, sha256(raw)]
  );
  await sendMail(email, `https://app.example.com/reset?token=${raw}`);
}
```

**Follow-ups:**
- Q: Why not use JWT as reset token? A: Single-use and revocation are easier with a DB record.
- Q: Why `randomBytes` and not `Math.random`? A: `Math.random` is predictable; security tokens need a CSPRNG.

---

## Q-SEC-26 -- NoSQL injection

**Difficulty:** Intermediate | `[ADVANCED]`

**Question:** Can MongoDB be injected? Show an example.

**Interview answer:** Yes. If you pass `req.body` objects directly into a query, an attacker can send operators instead of values, for example `{"email":"a@b.com","password":{"$ne":null}}`, which matches any password. Defend by validating that fields are strings (schema validation), rejecting keys that start with `$`, using `express-mongo-sanitize` or explicit casting, and never building `$where` queries from user input. Hash-compare passwords in application code rather than querying by password.

**Hinglish explanation:** SQL me string tod kar attack hota hai, Mongo me JSON object bhej kar. `password: {"$ne": null}` matlab "password null ke barabar nahi" -- sab match. Fix: input ko string force karo.

**Example:**

```js
// vulnerable: password could be an object like { $ne: null }
// const user = await users.findOne({ email: req.body.email, password: req.body.password });

// safe
const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
const user = await users.findOne({ email });
const ok = user && await bcrypt.compare(password, user.passwordHash);
```

**Follow-ups:**
- Q: Does Mongoose protect me? A: Schema casting helps, but query filters from untrusted objects can still be dangerous; validate first.

---

## Q-SEC-27 -- Dependency and supply-chain security

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you keep npm dependencies from becoming a security risk?

**Interview answer:** Commit the lockfile and install with `npm ci` for reproducible builds, run `npm audit` and automated update tools (Dependabot/Renovate) in CI, keep dependencies minimal, prefer well-maintained packages and built-ins, and pin versions of critical packages. Be wary of typosquatted names, install scripts, and abandoned packages. Run production with a non-root user, minimal image, and least-privilege credentials so a compromised package has limited reach. Keep Node itself on a supported LTS version.

**Hinglish explanation:** Tumhare code ke saath hazaaron packages aate hain; unme se ek bhi compromise hua to tumhara server compromise. Isliye lockfile commit karo, `npm ci` use karo, audit chalao, aur "ek line ke liye poora package" mat install karo.

**Follow-ups:**
- Q: `npm install` vs `npm ci`? A: `npm ci` installs exactly the lockfile versions and fails if it differs; use it in CI and Docker builds.
- Q: What is a typosquat? A: A malicious package named almost like a popular one (for example `expresss`).

---

## Q-SEC-28 -- HS256 vs RS256 (symmetric vs asymmetric signing)

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** When would you use RS256 instead of HS256 for JWTs?

**Interview answer:** HS256 uses one shared secret for signing and verifying, so every service that verifies tokens can also forge them; it suits a single backend. RS256 (or ES256) uses a private key to sign and a public key to verify, so only the auth service holds the private key while other services verify with the public key, often published at a JWKS endpoint. This suits microservices, third-party verification, and key rotation using a `kid` header. The cost is more complexity and slightly slower verification.

**Hinglish explanation:** HS256 me ek hi chaabi se lock aur unlock -- jiske paas chaabi, wo token bana bhi sakta hai. RS256 me private key sirf auth service ke paas, baaki services ko public key do jo sirf verify kar sakti hai. Multiple services ho to RS256 safer.

**Follow-ups:**
- Q: What is JWKS? A: A JSON endpoint listing public keys (with `kid`) so verifiers can fetch and rotate keys.
- Q: How do you rotate signing keys? A: Publish new key, start signing with it, keep the old public key until old tokens expire.

---

## Q-SEC-29 -- OAuth 2.0 and OpenID Connect basics

**Difficulty:** Intermediate | `[ADVANCED]`

**Question:** What is OAuth 2.0? How does "Login with Google" work at a high level?

**Interview answer:** OAuth 2.0 is an authorization framework that lets a user grant an application limited access to their resources on another service without sharing their password. OpenID Connect (OIDC) adds an identity layer on top, returning an ID token that says who the user is. In the Authorization Code flow (with PKCE for public clients), the app redirects the user to the provider, the user logs in and consents, the provider redirects back with a one-time code, and the backend exchanges that code plus its client secret for tokens over a back channel. The app then creates its own session for the user. A `state` parameter protects against CSRF.

**Hinglish explanation:** "Login with Google" me tum Google ko password nahi dete apni app ko; Google bolta hai "haan ye banda wahi hai" aur ek code deta hai. Tumhara backend code ko Google ko dikhakar token leta hai. OAuth = permission dene ka protocol, OIDC = us par pehchaan (identity) ka layer.

**Follow-ups:**
- Q: Why exchange a code instead of returning the token directly? A: The code travels through the browser URL; the token exchange happens server-to-server, keeping tokens off the front channel.
- Q: What is PKCE? A: A one-time secret proving the party that started the flow is the one finishing it; protects public clients and is recommended for all.

---

## Q-SEC-30 -- Common production security mistakes

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What are the most common security mistakes you have seen or would watch for in a Node API review?

**Interview answer:** Frequent ones: missing authorization checks on resources (IDOR); trusting client input or spreading `req.body` into queries; string-built SQL; secrets in git; stack traces and internal errors returned to clients; verbose logging of passwords, tokens, or card data; overly permissive CORS; no rate limiting on login and OTP endpoints; weak JWT handling (decode instead of verify, no expiry, secret in code); running as root; outdated dependencies; and admin endpoints exposed without extra protection. A solid review checklist covers authentication, authorization per object, validation, error handling, secrets, headers, logging, and rate limits.

**Hinglish explanation:** Interviewer ye dekhna chahta hai ki tum "happy path" ke bahar sochte ho. Ek checklist yaad rakho: Auth, Authz (object level), Validation, Errors (stack trace leak), Secrets, Logs (sensitive data), Limits (rate), Dependencies.

**Example (safe error response):**

```js
// centralized error handler, Express 5
app.use((err, req, res, next) => {
  req.log?.error({ err, requestId: req.id }, 'request failed');
  const status = err.status ?? 500;
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message, // no stack, no SQL
    requestId: req.id,
  });
});
```

**Follow-ups:**
- Q: What data must never be logged? A: Passwords, tokens, full card numbers, secrets, and in many cases personal data (mask it).
- Q: How do you prove a feature is secure? A: Threat-model it, write negative tests, and review against a checklist like OWASP API Top 10.

---

## Q-SEC-31 -- Webhook signature verification and timing-safe compare

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** A payment provider sends webhooks to your API. How do you make sure a webhook is genuine, and why use `timingSafeEqual`?

**Interview answer:** The provider signs the raw request body with a shared secret (HMAC-SHA256) and sends the signature in a header. The server recomputes the HMAC over the exact raw bytes, compares it to the header using a constant-time comparison (`crypto.timingSafeEqual`), and also checks a timestamp to reject replays. You must capture the raw body before JSON parsing, because re-serializing changes bytes and breaks the signature. A normal `===` comparison can leak information through timing differences. Process each event idempotently since providers retry.

**Hinglish explanation:** Koi bhi tumhare webhook URL par fake "payment success" bhej sakta hai. Isliye signature check karo. Raw body chahiye kyunki JSON parse karke dobara string banane par spacing/order badal sakti hai. `timingSafeEqual` isliye taaki comparison ka time guess karne me use na ho sake.

**Example:**

```js
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const app = express();

app.post('/webhooks/pay', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.get('x-signature') ?? '';
  const expected = createHmac('sha256', process.env.WEBHOOK_SECRET).update(req.body).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.sendStatus(401);

  const event = JSON.parse(req.body.toString('utf8'));
  // check event timestamp, then process idempotently by event.id
  res.sendStatus(200);
});
```

**Follow-ups:**
- Q: Why check lengths first? A: `timingSafeEqual` throws if buffer lengths differ.
- Q: What about replayed webhooks? A: Verify a timestamp tolerance and store processed event ids.

---

## Q-SEC-32 -- Securing file uploads

**Difficulty:** Intermediate | `[ADVANCED]`

**Question:** What security risks come with file uploads and how do you mitigate them?

**Interview answer:** Risks include oversized files exhausting memory or disk, malicious file types (executables, HTML/SVG with script), path traversal through filenames, content-type spoofing, and malware. Mitigate by enforcing size and count limits, allow-listing types and checking magic bytes rather than trusting the client MIME type, generating your own random storage names, storing files outside the web root or in object storage (S3) with private access, serving them from a separate domain with `Content-Disposition` or via signed URLs, streaming rather than buffering, and scanning if the risk justifies it.

**Hinglish explanation:** User ki di hui filename par kabhi bharosa mat karo (`../../etc/passwd`). Apna random naam banao, size limit lagao, aur file ko app server ke andar executable folder me mat rakho. Best: direct S3 par signed URL se upload.

**Example:**

```js
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const ALLOWED = new Set(['image/png', 'image/jpeg']);
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED.has(file.mimetype)),
});
app.post('/avatar', authenticate, upload.single('avatar'), saveAvatar);
```

**Follow-ups:**
- Q: Is `file.mimetype` trustworthy? A: No, it comes from the client; verify magic bytes for important cases.
- Q: Why signed URLs? A: The client uploads straight to storage, keeping large files off your API servers (see Q-SD-14).

---

# END OF CATEGORY 6

---

# CATEGORY 7: TESTING AND DEBUGGING

## Q-TEST-01 -- Unit vs integration vs end-to-end tests

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What is the difference between unit, integration, and end-to-end tests? What does the test pyramid say?

**Interview answer:** A unit test checks one small piece of logic in isolation (a function or service) with dependencies replaced by fakes; it is fast and precise. An integration test checks several real parts working together, for example an HTTP route, middleware, and a real test database. An end-to-end test drives the whole deployed system as a user would. The test pyramid recommends many unit tests, fewer integration tests, and very few end-to-end tests, because cost, slowness, and flakiness grow as you go up. For backend APIs I weight integration tests heavily, since most real bugs sit at the boundaries (SQL, validation, auth middleware).

**Hinglish explanation:** Unit = ek function ko akele test karna (jaise React me ek pure function ya component). Integration = route + middleware + DB sab milake (jaise React Testing Library me component + hooks + mock server). E2E = poora system browser/HTTP se. Neeche wale tests tez aur sasta, upar wale slow aur flaky. Backend me integration tests bahut value dete hain kyunki bug aksar DB query ya middleware me hota hai, pure function me nahi.

**Follow-ups:**
- Q: Which do you write first for a CRUD API? A: Integration tests on the critical endpoints (happy path plus key failures), unit tests for tricky business logic such as pricing or state machines.
- Q: Why not only E2E? A: Slow, hard to debug, and flaky; a failure does not tell you which layer broke.

---

## Q-TEST-02 -- What should you test in a backend API

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** For an endpoint like `POST /orders`, what test cases would you write?

**Interview answer:** I cover the happy path (201 and correct body and DB row), validation failures (missing or malformed fields, wrong types, unknown fields) returning 400/422, authentication (no token, expired token -> 401), authorization (wrong role or another user's resource -> 403/404), not-found and conflict cases (409, duplicate), business rules (out of stock, insufficient balance), error handling (dependency fails -> 500 or 503 without leaking internals), idempotency (same key twice creates one order), and side effects (transaction rolled back on failure, event or email queued once). I focus on behavior through the public interface, not implementation details.

**Hinglish explanation:** Sirf "sab sahi chale" test karna kaafi nahi. Interviewer ko batao ki tum negative cases sochte ho: bina token, galat token, kisi aur ka data, galat input, duplicate request, DB fail. Ye checklist rakho: Happy, Validation, Auth, Authz, Conflict, Business rule, Failure, Idempotency.

**Follow-ups:**
- Q: What should you NOT test? A: Framework or library internals (Express routing itself), private helper details, trivial getters.
- Q: How many assertions per test? A: Keep each test about one behavior; multiple asserts are fine if they describe that one behavior.

---

## Q-TEST-03 -- Jest vs Vitest vs node:test

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Which testing framework would you choose for a Node.js ES-modules project and why?

**Interview answer:** Vitest is a good default for ESM projects: it supports ES modules natively, is fast, has a Jest-compatible API (`describe`, `it`, `expect`, `vi.fn`), and includes mocking, coverage, and watch mode. Jest is widely used and mature but ESM support still needs the experimental `--experimental-vm-modules` flag and `jest.unstable_mockModule` for module mocking. Node's built-in `node:test` runner (stable since Node 20) is zero-dependency and fine for small projects, with `node:assert` and built-in mocking. Using Supertest with any of them is the same. I would follow the team's existing choice and not switch frameworks without reason.

**Hinglish explanation:** Jest purana aur popular hai par ESM (`import/export`) ke saath thoda dard deta hai. Vitest ESM friendly hai aur API Jest jaisi hi hai, to seekhna aasan. `node:test` me kuch install nahi karna. Interview me bas tool ka naam mat ratao; batao ki ESM aur mocking ka kya issue hota hai.

**Example (Vitest):**

```js
// sum.test.js
import { describe, it, expect } from 'vitest';
import { sum } from './sum.js';

describe('sum', () => {
  it('adds numbers', () => expect(sum(2, 3)).toBe(5));
});
// package.json: "scripts": { "test": "vitest run" }
```

**Follow-ups:**
- Q: Why `vitest run` in CI? A: Plain `vitest` starts watch mode; `run` executes once and exits.
- Q: Why does `jest.mock` not work in my ESM test? A: `jest.mock` hoisting relies on CommonJS; in native ESM use `jest.unstable_mockModule` and dynamic imports.

---

## Q-TEST-04 -- Testing Express routes with Supertest

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** How do you test an Express API with Supertest? Why should `app` be exported separately from `listen`?

**Interview answer:** Supertest makes HTTP requests directly against an Express app object, without needing a real listening port, and gives a fluent API for asserting status, headers, and body. To allow that, I create the app in `app.js` and export it, and only call `app.listen` in `server.js`. This avoids port conflicts and open handles when tests run in parallel, and keeps the app importable in tests.

**Hinglish explanation:** Agar app.js me hi `app.listen(3000)` likha hai to har test file import par server start ho jaayega aur port busy error aayega. Isliye app aur server alag file me. Supertest khud andar se ephemeral port par app chala leta hai.

**Example:**

```js
// app.js
import express from 'express';
export const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// server.js
import { app } from './app.js';
app.listen(process.env.PORT ?? 3000);

// app.test.js
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from './app.js';

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

**Follow-ups:**
- Q: How do you send an auth header? A: Call `.set()` with the `Authorization` header and a `Bearer <token>` value.
- Q: Test hangs after finishing? A: An open handle (DB pool, Redis client, timers); close them in an `afterAll` hook.

---

## Q-TEST-05 -- Mock vs stub vs spy vs fake

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Explain mocks, stubs, spies, and fakes.

**Interview answer:** They are all test doubles. A stub returns canned answers so the code under test can proceed. A spy wraps a real function and records how it was called while still running it. A mock is a pre-programmed object with expectations about calls, such as "must be called once with these args". A fake is a lightweight working implementation, for example an in-memory repository instead of MySQL. In practice, libraries like Jest/Vitest use `fn()` for all of these, so the key is choosing what you are verifying: returned state or interactions. Prefer state verification and fakes where possible, because over-mocking couples tests to implementation.

**Hinglish explanation:** Stub = "jab bulao to ye jawab de do". Spy = "asli kaam karo par yaad rakho kisne kitni baar bulaya". Mock = "mujhe expect hai ki tum exactly aise bulaoge, warna fail". Fake = chhota nakli version jaise in-memory DB. Jyada mocking karoge to code refactor karte hi tests toot jayenge, jabki behavior wahi hai.

**Example:**

```js
import { vi, it, expect } from 'vitest';

it('sends a welcome email once', async () => {
  const mailer = { send: vi.fn().mockResolvedValue({ ok: true }) }; // stub + spy
  await registerUser({ email: 'a@b.com' }, { mailer });
  expect(mailer.send).toHaveBeenCalledTimes(1);
  expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
});
```

**Follow-ups:**
- Q: What is the risk of too many mocks? A: Tests pass while real integration is broken; and they break on harmless refactors.
- Q: When must you mock? A: Slow, non-deterministic, or costly boundaries: third-party APIs, payment gateways, email, time, randomness.

---

## Q-TEST-06 -- Mocking external dependencies and dependency injection

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you test code that calls an external API such as a payment gateway or email service?

**Interview answer:** I isolate the external call behind a small module or interface (an adapter), and inject it into the service, so tests can pass a fake. For module-level mocking I use the framework's module mock (`vi.mock`) to replace the HTTP client, or a network-level interceptor such as `nock` or MSW so real HTTP code paths still run. I test success, error, timeout, and malformed-response behavior, and I never hit the real provider from automated tests. A few separate contract or sandbox tests may verify the real integration.

**Hinglish explanation:** Payment gateway ko test me asli call karna matlab slow, paise, aur flaky. Isliye service ko `paymentClient` parameter me do (dependency injection). Test me nakli client do jo success, failure, timeout simulate kare. Isse code testable bhi banta hai -- ye design ka fayda hai.

**Example:**

```js
// orderService.js
export function createOrderService({ db, paymentClient }) {
  return {
    async checkout(userId, amount) {
      const charge = await paymentClient.charge({ userId, amount });
      if (charge.status !== 'succeeded') throw Object.assign(new Error('Payment failed'), { status: 402 });
      return db.saveOrder({ userId, amount, chargeId: charge.id });
    },
  };
}

// orderService.test.js
import { it, expect, vi } from 'vitest';
it('throws 402 when the charge fails', async () => {
  const paymentClient = { charge: vi.fn().mockResolvedValue({ status: 'failed' }) };
  const svc = createOrderService({ db: { saveOrder: vi.fn() }, paymentClient });
  await expect(svc.checkout(1, 500)).rejects.toMatchObject({ status: 402 });
});
```

**Follow-ups:**
- Q: Why test the timeout path? A: In production a hung gateway is more common than a clean decline; code must not hang or double-charge.
- Q: nock vs mocking the module? A: nock tests the real HTTP client wiring; module mocks are simpler but skip it.

---

## Q-TEST-07 -- Database in tests: real DB vs mocks

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Should integration tests use a real database or a mocked one? How do you keep tests isolated?

**Interview answer:** For repositories and queries I prefer a real database of the same engine (MySQL 8), typically in a Docker container, because mocks cannot catch wrong SQL, missing indexes, constraint violations, or transaction behavior; and SQLite substitutes differ in semantics. To isolate tests I apply migrations once, then either truncate tables in `beforeEach`, or wrap each test in a transaction that is rolled back, or use unique data per test. Tests must not depend on execution order, and a separate test database or schema is used so development data is never touched.

**Hinglish explanation:** Agar DB mock kar diya to tumhari SQL ghalat bhi ho tab bhi test pass ho jayega. Isliye test ke liye alag MySQL (docker) rakho. Har test se pehle tables saaf karo taaki ek test ka data dusre ko kharab na kare. Kabhi bhi dev/prod DB par tests mat chalao.

**Example:**

```js
import { beforeAll, beforeEach, afterAll } from 'vitest';
import mysql from 'mysql2/promise';

let pool;
beforeAll(async () => {
  pool = mysql.createPool({ uri: process.env.TEST_DATABASE_URL, connectionLimit: 5 });
});
beforeEach(async () => {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE orders');
  await pool.query('TRUNCATE TABLE users');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
});
afterAll(async () => { await pool.end(); });
```

**Follow-ups:**
- Q: Parallel test files sharing one DB? A: They can collide; run DB tests serially, or give each worker its own schema.
- Q: Tests are slow because of the DB? A: Use a container started once, transaction rollback, and keep the integration suite focused.

---

## Q-TEST-08 -- Negative testing and validation tests

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What is negative testing? Give examples for a signup API.

**Interview answer:** Negative testing checks that the system behaves safely with invalid, unexpected, or malicious input: it should reject it with the right status and message and not change state. For signup: missing email, invalid email, too-short password, oversized fields, wrong types (number instead of string), extra unknown fields such as `role`, duplicate email (409), malformed JSON (400), and SQL-like strings that must be stored or rejected harmlessly. I also assert that nothing was written to the database on failure.

**Hinglish explanation:** Frontend developer hone ke naate tum form validation jaante ho. Backend me ye tab zaroori hai jab koi form bypass karke seedha API maare. Test me galat input bhejo aur dekho ki status 400/409 aaye aur DB me kuch insert na ho.

**Example:**

```js
import request from 'supertest';
import { it, expect } from 'vitest';

it.each([
  [{}, 400],
  [{ email: 'not-an-email', password: 'Str0ng!pass' }, 400],
  [{ email: 'a@b.com', password: '123' }, 400],
  [{ email: 'a@b.com', password: 'Str0ng!pass', role: 'admin' }, 400], // mass assignment
])('rejects invalid signup %#', async (body, status) => {
  const res = await request(app).post('/auth/signup').send(body);
  expect(res.status).toBe(status);
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users');
  expect(rows[0].n).toBe(0);
});
```

**Follow-ups:**
- Q: 400 vs 422? A: 400 for malformed requests; 422 for well-formed but semantically invalid data. Pick one convention and keep it consistent.

---

## Q-TEST-09 -- Testing authentication and authorization

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you test protected routes and role checks?

**Interview answer:** I create helper functions that make users with known roles and sign tokens with the test secret, then write a matrix of tests per protected endpoint: no token -> 401, malformed or expired token -> 401, valid token but wrong role -> 403, valid role -> success, and user A accessing user B's resource -> 403 or 404. I use real middleware, not mocks, so wiring errors show up. For expiry I sign a token with a negative or tiny `expiresIn`, or use fake timers.

**Hinglish explanation:** Auth bug sabse costly hota hai. Isliye har protected route ke liye 4-5 cases likho: token nahi, kharab token, expire token, galat role, kisi aur ka data. Helper `tokenFor(role)` bana lo taaki test chhote rahein.

**Example:**

```js
import jwt from 'jsonwebtoken';
const tokenFor = (user, opts = {}) =>
  jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '15m', ...opts });

it('returns 401 for an expired token', async () => {
  const expired = tokenFor({ id: 1, role: 'user' }, { expiresIn: -10 });
  await request(app).get('/me').set('Authorization', `Bearer ${expired}`).expect(401);
});

it('returns 403 when a normal user hits an admin route', async () => {
  await request(app).delete('/users/9').set('Authorization', `Bearer ${tokenFor({ id: 1, role: 'user' })}`).expect(403);
});
```

**Follow-ups:**
- Q: How do you test IDOR? A: Create two users and a resource owned by user B, request it with user A's token, expect 403/404.

---

## Q-TEST-10 -- Testing asynchronous code and the forgotten await

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What are common mistakes when testing async code, and how do you assert that a promise rejects?

**Interview answer:** The biggest mistake is not awaiting or returning the promise, so the test finishes before the assertion runs and passes falsely (or the error surfaces later as an unhandled rejection in another test). Use `async` tests with `await`, and assert rejections with `await expect(fn()).rejects.toThrow(...)` rather than try/catch without a failing branch. Also avoid arbitrary `setTimeout` sleeps; wait on conditions or use fake timers.

**Hinglish explanation:** `expect(fn()).rejects.toThrow()` ke aage `await` bhool gaye to test bina check kiye pass ho jaata hai. Ye silent galti hai. Aur "sleep(1000)" jaisa wait mat daalo -- flaky bhi, slow bhi.

**Example:**

```js
// WRONG: passes even if the promise never rejects
it('rejects (broken)', () => {
  expect(failingCall()).rejects.toThrow('boom'); // missing await/return
});

// RIGHT
it('rejects', async () => {
  await expect(failingCall()).rejects.toThrow('boom');
});

// try/catch needs an assertion count so it cannot pass silently
it('rejects (try/catch)', async () => {
  expect.assertions(1);
  try { await failingCall(); } catch (e) { expect(e.message).toBe('boom'); }
});
```

**Follow-ups:**
- Q: Why would a failure show up in the wrong test? A: The floating promise rejected after its own test ended, so it is attributed to whichever test is running.

---

## Q-TEST-11 -- Testing the centralized error handler

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you test that your Express error middleware returns safe, consistent responses?

**Interview answer:** I register a test-only route that throws (sync and async) or calls `next(err)` with different error types, then assert the status, JSON shape, `requestId`, and that internal details such as stack traces or SQL messages are absent for 5xx responses. I also verify known errors (validation, not found, conflict) map to the expected status codes. In Express 5, rejected promises from async handlers reach the error middleware automatically; in Express 4 they need a wrapper or `express-async-errors`, so I include an async-throw test to catch regressions.

**Hinglish explanation:** Error handler ek jagah hai jahan sab errors aate hain, to usko test karna bahut valuable hai. Ek fake route banao jo `throw` kare, aur dekho response me stack trace ya SQL error to nahi aa gaya. Express 5 me async function ka error khud handler tak pahunchta hai; Express 4 me nahi.

**Example:**

```js
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/errorHandler.js';

function makeApp() {
  const app = express();
  app.get('/boom', async () => { throw new Error('db password is hunter2'); });
  app.get('/bad', () => { const e = new Error('Invalid id'); e.status = 400; throw e; });
  app.use(errorHandler);
  return app;
}

it('hides internals for 500', async () => {
  const res = await request(makeApp()).get('/boom').expect(500);
  expect(JSON.stringify(res.body)).not.toContain('hunter2');
});
```

**Follow-ups:**
- Q: Why does error middleware need four params? A: Express identifies error handlers by the `(err, req, res, next)` signature.

---

## Q-TEST-12 -- Flaky tests

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What causes flaky tests and how do you fix them?

**Interview answer:** Flaky tests pass and fail without code changes. Common causes: shared mutable state or database data between tests, dependence on test order, real time or timers, randomness, network calls to real services, race conditions with unawaited promises, port collisions, and parallel execution against one resource. Fixes: isolate data per test, reset state in hooks, control time with fake timers, seed or inject randomness, mock the network, await everything, wait for conditions rather than sleeping, and run suspicious tests repeatedly (or in random order) to reproduce. Quarantine and fix flaky tests promptly because they destroy trust in the suite.

**Hinglish explanation:** Flaky = kabhi pass, kabhi fail, bina code badle. Ye team ka bharosa tod deta hai ("rerun karo, ho jayega"). Jad aksar: shared data, time, order, network, ya await bhoolna. Reproduce karne ke liye test ko 50 baar loop me chalao.

**Follow-ups:**
- Q: Is retrying failed tests in CI a fix? A: It hides the problem; use it as a temporary mitigation only while you fix the root cause.
- Q: How do you find order dependence? A: Run with random order or in isolation (`--sequence.shuffle` in Vitest).

---

## Q-TEST-13 -- Faking time in tests

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you test code that depends on time, such as token expiry or retry delays?

**Interview answer:** I use fake timers provided by the framework so I can advance the clock deterministically instead of waiting. In Vitest: `vi.useFakeTimers()`, `vi.setSystemTime(...)`, and `vi.advanceTimersByTimeAsync(ms)`. Alternatively I inject a clock (`now()` function) into the code so tests pass a fixed time. I always restore real timers in `afterEach` and take care with promises, because fake timers do not resolve promises on their own; I use the async advance helpers.

**Hinglish explanation:** "5 second ka retry delay" test karne ke liye 5 second wait karna bekaar hai. Fake timers se ghadi ko aage bada do. Ya code me `Date.now` seedha mat use karo, ek `clock` inject karo.

**Example:**

```js
import { vi, it, expect, afterEach } from 'vitest';
afterEach(() => vi.useRealTimers());

it('retries after 1s backoff', async () => {
  vi.useFakeTimers();
  const fn = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('ok');
  const p = retry(fn, { retries: 2, baseDelayMs: 1000, jitter: false });
  await vi.advanceTimersByTimeAsync(1000);
  await expect(p).resolves.toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
});
```

**Follow-ups:**
- Q: Why is real `setTimeout` in tests bad? A: Slow and flaky under CI load.

---

## Q-TEST-14 -- Testing concurrency and race conditions

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** How would you write a test proving that two simultaneous requests cannot overspend a wallet or oversell stock?

**Interview answer:** I seed an account with a known balance, fire N concurrent requests with `Promise.all` against the real application and a real database, and then assert the invariants: the final balance is correct, never negative, and only the expected number of requests succeeded. This test fails against naive read-then-write code and passes only when the implementation uses an atomic conditional update (`UPDATE ... SET balance = balance - ? WHERE id = ? AND balance >= ?`) or row locking (`SELECT ... FOR UPDATE`) inside a transaction. It requires a real DB because mocks cannot model locking.

**Hinglish explanation:** Race condition normal test me dikhta hi nahi kyunki ek-ek request chalti hai. Isliye ek saath 10 request bhejo. Agar code "pehle balance padho, phir minus karo" wala hai to dono request purana balance dekhengi aur paisa double kharch ho jaayega. Test unhe pakad leta hai.

**Example:**

```js
it('does not overspend with parallel withdrawals', async () => {
  await pool.execute('INSERT INTO wallets (id, balance) VALUES (1, 100)');
  const calls = Array.from({ length: 10 }, () =>
    request(app).post('/wallets/1/withdraw').set(auth).send({ amount: 30 })
  );
  const results = await Promise.all(calls);
  const ok = results.filter((r) => r.status === 200).length;
  const [[w]] = await pool.execute('SELECT balance FROM wallets WHERE id = 1');
  expect(ok).toBe(3);        // 100 / 30 = 3 withdrawals
  expect(w.balance).toBe(10);
});
```

**Follow-ups:**
- Q: Does this prove correctness? A: It raises confidence but cannot prove it; also reason about the isolation level and locking explicitly.

---

## Q-TEST-15 -- Code coverage: what it means and does not

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Is 100% code coverage a good goal?

**Interview answer:** Coverage measures which lines or branches ran during tests, not whether the tests assert anything meaningful. A test can execute code and verify nothing. High coverage with weak assertions gives false confidence, and chasing 100% leads to brittle, low-value tests. I use coverage to find untested areas, set a reasonable threshold (for example 70-80% on critical modules), and prioritize meaningful assertions, branch coverage, and testing risky logic and failure paths.

**Hinglish explanation:** Coverage batata hai kaun si line chali, ye nahi ki sahi check hui ya nahi. `expect(true).toBe(true)` bhi coverage badha deta hai. Isliye number ke peeche mat bhaago; payment, auth jaise risky hisso me quality tests likho.

**Follow-ups:**
- Q: Line vs branch coverage? A: Branch coverage checks both sides of each `if`; it reveals untested else paths.
- Q: Mutation testing? A: It changes your code and checks whether tests fail, measuring test strength (advanced, slow).

---

## Q-TEST-16 -- TDD and when it helps

**Difficulty:** Basic | `[ADVANCED]`

**Question:** What is TDD? Do you use it for backend work?

**Interview answer:** Test-Driven Development is a loop of red, green, refactor: write a failing test that describes the behavior, write the minimum code to pass it, then refactor with the tests protecting you. It works especially well for pure business logic (pricing, validation rules, state transitions) and for reproducing bugs: write a failing test that captures the bug, then fix it. I am pragmatic: for glue code and exploratory work, I may write tests right after, but I never skip tests for critical logic.

**Hinglish explanation:** TDD me pehle test likhte ho jo fail hota hai (red), phir code likhte ho jo pass kare (green), phir code saaf karte ho (refactor). Bug fix ke time sabse kaam ka: pehle bug ko reproduce karne wala test likho, phir fix karo -- bug dobara aaya to test pakad lega.

**Follow-ups:**
- Q: Downsides? A: Slows exploratory design and can lock in a poor design if tests are too tied to implementation.

---

## Q-TEST-17 -- Testing idempotency and duplicate requests

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** How would you test that a payment endpoint is idempotent?

**Interview answer:** I send the same request twice (and also in parallel) with the same `Idempotency-Key`, then assert that only one charge and one order row exist, that both responses return the same result (status and body), and that a different payload with the same key is rejected with a conflict (for example 422/409). I also test the key store's behavior when the first request fails midway: a retry should be able to complete or return the stored failure consistently. The parallel case needs a real database, since the guarantee comes from a unique constraint or an atomic insert. See Q-PROD-03 and Q-SD-19 for the design.

**Hinglish explanation:** Idempotency ka matlab: ek hi request 2 baar aaye to asar ek baar ka. Test: same key se do baar bhejo (aur ek saath bhi), dekho DB me sirf ek payment hai. Parallel wala test hi asli test hai, kyunki sequential me to simple check bhi pass ho jaata hai.

**Example:**

```js
it('creates one payment for parallel requests with the same key', async () => {
  const send = () => request(app).post('/payments').set(auth).set('Idempotency-Key', 'k-123').send({ amount: 500 });
  const [a, b] = await Promise.all([send(), send()]);
  expect([a.status, b.status].every((s) => [200, 201, 409].includes(s))).toBe(true);
  const [[row]] = await pool.execute('SELECT COUNT(*) AS n FROM payments WHERE idempotency_key = ?', ['k-123']);
  expect(row.n).toBe(1);
});
```

**Follow-ups:**
- Q: Why might one parallel request get 409? A: A design may reject an in-flight duplicate; another may make it wait and return the first result. Both are acceptable if documented.

---

## Q-TEST-18 -- Structured logging vs console.log

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Why use a structured logger like pino instead of console.log in production?

**Interview answer:** Structured logging emits each log as JSON with fields (timestamp, level, message, requestId, userId, duration), so log systems (CloudWatch, ELK, Datadog) can search, filter, and aggregate reliably, instead of grepping free text. A logger such as pino adds levels, child loggers carrying context, redaction of sensitive fields, and very low overhead through asynchronous, minimal serialization. `console.log` has no levels or structure, and in some setups writing to a slow stdout can add latency.

**Hinglish explanation:** `console.log("user login failed " + email)` ko search karna mushkil. JSON log `{"level":"warn","msg":"login failed","userId":42,"requestId":"abc"}` ko aap query kar sakte ho: "requestId=abc ke saare logs dikhao". Pino fast hai aur passwords redact kar sakta hai.

**Example:**

```js
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'password', '*.token'],
});

logger.info({ userId: 42, orderId: 'o-9', ms: 120 }, 'order created');
const child = logger.child({ requestId: 'abc-123' });
child.error({ err: new Error('db timeout') }, 'checkout failed');
```

**Follow-ups:**
- Q: Do logs go to a file or stdout? A: In containers write to stdout/stderr and let the platform collect them (12-factor).
- Q: What does redact do? A: Replaces configured paths with a placeholder so secrets never reach log storage.

---

## Q-TEST-19 -- Log levels and what to log

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Explain log levels. What should and should not be logged?

**Interview answer:** Typical levels in order: `fatal` (process cannot continue), `error` (an operation failed and needs attention), `warn` (unexpected but handled), `info` (important business and lifecycle events), `debug` and `trace` (diagnostic detail, off in production by default). Log request metadata, outcomes, durations, ids, and error context with stack traces. Do not log passwords, tokens, full card numbers, or unnecessary personal data, and avoid logging inside tight loops. Errors should be logged once, where they are handled, not at every layer, to avoid duplicates.

**Hinglish explanation:** Level ka matlab seriousness. Production me `info` ya `warn` se upar rakho, debugging ke waqt temporarily `debug` on karo. Sensitive data kabhi mat logo. Ek error ko har layer par log karoge to ek hi problem ki 5 entries banengi aur alerting shor machayegi.

**Follow-ups:**
- Q: error vs warn? A: Error means a failed operation needing action; a handled 404 or validation failure is usually info/warn, not error.
- Q: Can logs affect performance? A: Yes; synchronous or very verbose logging adds latency and cost.

---

## Q-TEST-20 -- Correlation IDs and AsyncLocalStorage

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What is a correlation (request) ID and how do you propagate it across async code?

**Interview answer:** A correlation id is a unique value attached to each incoming request (taken from an `X-Request-Id` header if present, else generated) and included in every log line and downstream call, so you can trace one request's whole path across logs and services. In Node, passing it through every function is tedious, so I use `AsyncLocalStorage` from `node:async_hooks`, which keeps a per-request context that survives `await` boundaries. Middleware sets it, the logger reads it, and I return it in the response header and error body so support can quote it.

**Hinglish explanation:** Hazaaron requests ek saath chal rahi hain, logs mix ho jaate hain. Har request ko ek ID do aur har log me wo ID daalo, phir ek ID se poori kahani mil jaati hai. AsyncLocalStorage ek tarah ka "request-wise hidden global" hai -- React Context jaisa, par async code ke liye.

**Example:**

```js
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const als = new AsyncLocalStorage();

export function requestContext(req, res, next) {
  const id = req.get('x-request-id') ?? randomUUID();
  res.set('x-request-id', id);
  als.run({ requestId: id }, next);
}

export const log = (level, msg, extra = {}) =>
  console.log(JSON.stringify({ level, msg, requestId: als.getStore()?.requestId, ...extra }));
```

**Follow-ups:**
- Q: How does it propagate to other services? A: Forward the header in outgoing HTTP calls (or use W3C `traceparent` with OpenTelemetry).
- Q: Does ALS cost performance? A: Small overhead; acceptable for most services.

---

## Q-TEST-21 -- Operational vs programmer errors

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What is the difference between operational errors and programmer errors, and how should each be handled?

**Interview answer:** Operational errors are expected runtime problems in a correct program: invalid user input, a timeout, a database that is down, a 404. They should be handled gracefully (retry, return a proper status, degrade). Programmer errors are bugs: calling a function with the wrong type, reading a property of `undefined`. These indicate the process may be in an unknown state, so the typical advice is to log, fail fast, and let a supervisor (PM2, Docker, Kubernetes) restart it after graceful shutdown. A custom `AppError` class with `status` and an `isOperational` flag helps the central error handler decide.

**Hinglish explanation:** Operational error = "duniya ne gadbad ki" (DB band, user ne galat input diya). Handle karke response do. Programmer error = "mera code galat hai" (undefined.name). Process ki state bharose layak nahi, isliye log karo aur restart hone do, chup-chap chalate mat raho.

**Example:**

```js
export class AppError extends Error {
  constructor(message, status = 500, { code, isOperational = true } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.isOperational = isOperational;
  }
}
// throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
```

**Follow-ups:**
- Q: Should the server exit on every error? A: No, only on unexpected/programmer errors at process level (uncaught exception); operational errors are handled per request.

---

## Q-TEST-22 -- Debugging Node.js with the inspector

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** How do you debug a Node.js application?

**Interview answer:** I use the built-in inspector: start with `node --inspect` (or `--inspect-brk` to pause at the first line), then attach Chrome DevTools via `chrome://inspect` or the VS Code debugger, set breakpoints, inspect variables, and step through async code with async call stacks. For quick checks I use targeted structured logs. For production issues I rely on logs, metrics, and traces, and only use the inspector on a safe, non-public port, because an exposed inspector allows remote code execution. I can also capture CPU profiles and heap snapshots from DevTools.

**Hinglish explanation:** Tum browser me DevTools use karte ho; Node me bhi wahi DevTools use hota hai. `node --inspect server.js` chalao aur VS Code me breakpoints lagao. Production me inspector port internet par kabhi expose mat karo -- wo seedha code execution ka darwaza hai.

**Example:**

```bash
node --inspect-brk server.js            # pause on first line; attach from chrome://inspect
node --inspect=127.0.0.1:9229 server.js # bind to loopback only
```

**Follow-ups:**
- Q: How to debug in Docker? A: Map the port and bind `0.0.0.0` only in a private dev network; in production use SSH tunnels if needed.
- Q: Debugging async code? A: Modern V8 produces async stack traces across `await` chains and DevTools shows an async call stack; staying on async/await rather than raw callbacks keeps traces useful.

---

## Q-TEST-23 -- unhandledRejection and uncaughtException

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What happens when a promise rejection is not handled in Node.js? How should you handle `uncaughtException`?

**Interview answer:** Since Node 15 the default `--unhandled-rejections` mode is `throw`: an unhandled rejection is raised as an uncaught exception and crashes the process. I register `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers only to log the error with context, start a graceful shutdown (stop accepting connections, finish in-flight work with a timeout, close pools), and exit with a non-zero code so the supervisor restarts the process. Continuing to run after an uncaught exception is unsafe because the application state may be corrupt.

**Hinglish explanation:** Pehle purane Node me unhandled rejection sirf warning deta tha; ab process crash karta hai. Handler me "ignore kar do aur chalte raho" mat likho. Log karo, graceful shutdown karo, exit(1) karo, aur PM2/Docker restart karega.

**Example:**

```js
import { server } from './server.js';
import { logger } from './logger.js';

function shutdown(reason, err) {
  logger.fatal({ err, reason }, 'fatal error, shutting down');
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 10_000).unref(); // force exit after 10s
}
process.on('unhandledRejection', (err) => shutdown('unhandledRejection', err));
process.on('uncaughtException', (err) => shutdown('uncaughtException', err));
```

**Follow-ups:**
- Q: Why `.unref()` on the timer? A: So the timer alone does not keep the process alive if shutdown finishes sooner.
- Q: Express 4 async handler throws? A: Without a wrapper the rejection is unhandled and the request hangs; Express 5 forwards it to error middleware.

---

## Q-TEST-24 -- "Cannot set headers after they are sent to the client"

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What does `ERR_HTTP_HEADERS_SENT` mean and what usually causes it?

**Interview answer:** It means the code tried to send a second response, or modify headers, after the response was already started. Common causes: calling `res.send`/`res.json` twice, forgetting `return` after sending in an `if` branch so execution continues, calling both `res.send` and `next()`, or sending in a callback after an earlier error response. The fix is to ensure exactly one response path, use `return res.status(...).json(...)`, and let errors flow to the central error handler instead of responding in multiple places.

**Hinglish explanation:** Response ek hi baar jaa sakta hai. Agar `if (!user) res.status(404).json(...)` ke baad `return` nahi likha, to code neeche chalta rahega aur dobara `res.json(...)` karega -- error. Rule: response bhejte waqt `return` lagao.

**Example:**

```js
// BUG
app.get('/users/:id', async (req, res) => {
  const user = await findUser(req.params.id);
  if (!user) res.status(404).json({ error: 'Not found' }); // no return
  res.json(user);                                          // second response
});

// FIX
app.get('/users/:id', async (req, res) => {
  const user = await findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});
```

**Follow-ups:**
- Q: Can it come from middleware? A: Yes, a middleware that responds and also calls `next()`.

---

## Q-TEST-25 -- "Works on my machine, fails in production"

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** An endpoint works locally but fails in production. How do you investigate?

**Interview answer:** I start from evidence: logs and error tracking for that request id, the exact status and stack. Then I compare environments systematically: Node version, environment variables and config, database schema/migrations and data volume, network rules and DNS, TLS and proxy settings (`trust proxy`, body size limits, timeouts), file paths and case-sensitive filenames (Linux vs Windows), memory/CPU limits, and third-party credentials. I try to reproduce with production-like data and settings (Docker, staging), add temporary targeted logging if needed, and fix the root cause, adding a test or a startup config check so it cannot silently recur.

**Hinglish explanation:** Pehle andaza mat lagao, logs dekho. Phir difference dhundo: Node version, env variables, DB data size, proxy config, aur Windows vs Linux ka filename case (`User.js` vs `user.js` Windows par chalta hai, Linux par nahi). Dev me 10 rows, prod me 10 million -- slow query bhi ek bada kaaran hai.

**Follow-ups:**
- Q: Common culprit list? A: Missing env var, schema not migrated, different Node version, CORS/proxy headers, timeouts at the load balancer, case-sensitive paths.
- Q: How do you prevent drift? A: Docker, the same Node version pinned (`engines`, `.nvmrc`), config validation at startup, and a staging environment.

---

## Q-TEST-26 -- Request hangs forever with no error

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** A request never returns and shows no error. What could be wrong?

**Interview answer:** The handler never sends a response or calls `next`. Likely causes: an async error thrown in Express 4 without a wrapper (rejection ignored, no response), a missing `await` or a promise that never resolves, a callback never invoked, a DB or HTTP call with no timeout hanging on a dead connection, a pool with no free connections (waiting forever for a connection), or an infinite loop blocking the event loop (then every request hangs). I check logs, add timeouts, look at pool stats, and use a CPU profile if the whole server is frozen.

**Hinglish explanation:** "Hang" ke do type: sirf ek request atki (code ne response hi nahi bheja, ya DB call atka) ya poora server atka (event loop block). Pehle check karo: dusri requests chal rahi hain kya? Haan to ek-request bug; nahi to event loop block.

**Follow-ups:**
- Q: How do you find which one? A: Hit `/health` while the stuck request is pending; if it also hangs the event loop is blocked.
- Q: Prevention? A: Timeouts on every outbound call, request timeout middleware, and pool `connectionLimit` with a `queueLimit`/acquire timeout.

---

## Q-TEST-27 -- A systematic debugging method

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Describe your approach to debugging a bug reported by a user.

**Interview answer:** First reproduce it and define the expected versus actual behavior, collecting request id, input, time, and environment. Next narrow it down with logs and by bisecting: which layer (client, API, service, DB, third party) first deviates? Form a hypothesis, test it with the smallest experiment (a log, a debugger breakpoint, a SQL query, a failing unit test), and change one thing at a time. After the fix, write a regression test, verify in a staging-like environment, and note the root cause so the same class of bug can be prevented.

**Hinglish explanation:** Interview me ye batao ki tum guess nahi karte. Reproduce -> narrow down -> hypothesis -> chhota experiment -> fix -> regression test. "Ek baar me ek cheez badlo" -- warna pata nahi chalega kis cheez ne fix kiya.

**Follow-ups:**
- Q: What if you cannot reproduce? A: Improve observability (more context in logs, request ids), compare production data/config, and look for race or timing conditions.

---

## Q-TEST-28 -- Health checks: liveness vs readiness

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What are liveness and readiness checks and how would you implement them?

**Interview answer:** A liveness check tells the orchestrator whether the process is alive or should be restarted; it should be cheap and should not depend on external systems. A readiness check tells the load balancer whether the instance can serve traffic now: database reachable, migrations done, caches warmed, and not shutting down. During graceful shutdown readiness should start failing first so traffic drains before the process exits. Putting a dependency check in liveness can cause restart storms when the database is briefly down.

**Hinglish explanation:** Liveness = "zinda hai?" Agar nahi to restart. Readiness = "kaam ke liye taiyaar hai?" Agar nahi to traffic mat bhejo, par restart bhi mat karo. DB down hone par liveness fail karoge to saare pods restart hote rahenge aur halat aur kharab hogi.

**Example:**

```js
let shuttingDown = false;
process.on('SIGTERM', () => { shuttingDown = true; });

app.get('/healthz', (req, res) => res.sendStatus(200)); // liveness
app.get('/readyz', async (req, res) => {                // readiness
  if (shuttingDown) return res.sendStatus(503);
  try {
    await pool.query('SELECT 1');
    res.sendStatus(200);
  } catch {
    res.sendStatus(503);
  }
});
```

**Follow-ups:**
- Q: Should readiness hit the DB each time? A: Lightly (a `SELECT 1` with a short timeout) or cache the result for a few seconds.

---

## Q-TEST-29 -- Running tests in CI

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What should a CI pipeline for a Node.js backend do?

**Interview answer:** On every pull request: checkout, set up the pinned Node version, restore the npm cache, `npm ci`, run lint and format checks, run unit tests, start service containers (MySQL, Redis) and run migrations, run integration tests, collect coverage, run `npm audit` or a dependency scan, and build the Docker image. Merges are gated on green status. Tests must be deterministic, use test credentials, and never touch real services. Deployment to staging can follow automatically after merge.

**Hinglish explanation:** CI ka matlab har push par automatic checks. Order: install -> lint -> tests -> build. DB wale tests ke liye CI me MySQL container chalta hai. Agar CI fail ho to merge block.

**Follow-ups:**
- Q: Why `npm ci`? A: Reproducible install from the lockfile.
- Q: How do you speed up CI? A: Dependency caching, running test shards in parallel, and keeping the heavy suites targeted.

---

## Q-TEST-30 -- Tests hang or leak: open handles

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Your test run finishes all tests but the process does not exit (or prints "did not exit one second after the test run"). Why and how do you fix it?

**Interview answer:** Something still holds the event loop open: a database pool, Redis client, HTTP server, interval, or timer was never closed. The fix is to close every resource in `afterAll` (`await pool.end()`, `await redis.quit()`, `server.close()`), `unref()` background timers, and avoid starting listeners at import time. Jest offers `--detectOpenHandles` to find them; Vitest reports hanging processes and can use `--pool` options, but the real fix is the same cleanup.

**Hinglish explanation:** Node process tab tak zinda rehta hai jab tak koi socket ya timer khula hai. Test ke baad DB pool ya Redis connection band nahi kiya to process atka rahega. `afterAll` me sab band karo.

**Example:**

```js
import { afterAll } from 'vitest';
import { pool } from '../src/db.js';
import { redis } from '../src/redis.js';

afterAll(async () => {
  await pool.end();
  await redis.quit();
});
```

**Follow-ups:**
- Q: Should I use `--forceExit`? A: Only as a stopgap; it can hide leaks and cut off pending work.

---

# END OF CATEGORY 7

---

# CATEGORY 8: PERFORMANCE AND SCALABILITY

## Q-PERF-01 -- How to approach a performance problem

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Your API is slow. What is your general approach before changing any code?

**Interview answer:** Measure first, then optimize the proven bottleneck. I define the goal (for example p95 under 300 ms), reproduce with a realistic load, and find where time goes: use request timing logs or tracing to split time into app CPU, database, cache, and external calls; check the event loop delay, CPU, memory, and database slow query log; then profile the specific hot path. I change one thing at a time, re-measure, and keep the change only if it helps. Optimizing without measurement usually wastes time and adds complexity.

**Hinglish explanation:** "Mujhe lagta hai DB slow hai" -- ye guess hai. Pehle naapo. Total time ko hisson me todo: kitna DB me, kitna external API me, kitna apne code me. Jo sabse bada hissa hai wahi fix karo. Ek baar me ek badlav, phir dobara naapo.

**Follow-ups:**
- Q: What are the usual suspects? A: Missing index or N+1 queries, large payloads, blocking synchronous code, no connection reuse, sequential awaits that could be parallel, and no caching for hot reads.
- Q: Why "p95" and not average? A: See Q-PERF-02.

---

## Q-PERF-02 -- Latency, throughput, and percentiles

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Explain latency, throughput, and why p95/p99 matter more than the average.

**Interview answer:** Latency is how long one request takes; throughput is how many requests per second the system completes. They interact: as load approaches capacity, queues build and latency rises sharply. Averages hide slow outliers: if 1 percent of requests take 5 seconds, the average still looks fine but one in a hundred users has a bad experience, and in a page that makes many calls most users hit a slow one. So I track percentiles: p50 (typical), p95 and p99 (tail latency), plus error rate.

**Hinglish explanation:** Average ek jhooth bol sakta hai. 99 request 100 ms me aur ek 10 second me, average ~200 ms dikhega par ek user ka experience kharab. p99 batata hai "sabse bure 1 percent kitne slow hain". Latency = ek request ka time, throughput = ek second me kitni request.

**Follow-ups:**
- Q: What is a "saturation" point? A: The load where latency climbs steeply because a resource (CPU, pool, DB) is fully used; run load tests to find it.
- Q: Little's Law? A: Concurrent requests in the system = arrival rate x average latency, useful for sizing pools and worker counts.

---

## Q-PERF-03 -- Detecting a blocked event loop

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you detect and prevent event loop blocking?

**Interview answer:** A blocked event loop shows up as high latency across all endpoints while CPU for one core is near 100 percent. I measure event loop delay with `perf_hooks.monitorEventLoopDelay()` and alert on high p99 delay. Typical blockers: synchronous APIs (`fs.readFileSync`, `crypto.pbkdf2Sync`), large `JSON.parse` or `JSON.stringify`, catastrophic regular expressions, big loops over large arrays, and heavy CPU work. Fixes: use async APIs, stream or paginate large data, chunk work with `setImmediate`, move CPU-bound work to worker threads or a queue, and validate regexes against ReDoS.

**Hinglish explanation:** Node ka ek hi main thread hai. Agar ek request ne 2 second tak loop me CPU kaam kiya, to us dauran baaki sab requests ruki rahengi. Isliye synchronous heavy kaam request path me mat rakho.

**Example:**

```js
import { monitorEventLoopDelay } from 'node:perf_hooks';

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => {
  console.log(JSON.stringify({
    metric: 'event_loop_delay_ms',
    p50: h.percentile(50) / 1e6,
    p99: h.percentile(99) / 1e6,
    max: h.max / 1e6,
  }));
  h.reset();
}, 10_000).unref();
```

**Follow-ups:**
- Q: Which sync calls are acceptable? A: Only at startup (reading config), never inside request handling.
- Q: What is ReDoS? A: A regex with catastrophic backtracking where crafted input makes matching take exponential time, freezing the loop.

---

## Q-PERF-04 -- CPU-bound work: worker threads, child processes, or queue

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** An endpoint resizes images (or generates a big PDF). It makes the whole API slow. What do you do?

**Interview answer:** CPU-bound work blocks the single JS thread, so move it off the request path. Options: worker threads (share memory and are good for CPU-intensive JS tasks, ideally in a pool), a separate process or service, or a background job queue (BullMQ) with dedicated worker processes. For user-facing work I usually enqueue a job, return `202 Accepted` with a job id, and let the client poll or receive a webhook/notification. Native libraries such as `sharp` already run off the main thread, so check whether the library is already non-blocking before adding workers.

**Hinglish explanation:** Node async I/O me mast hai, par heavy calculation me ek hi thread phans jaata hai. To heavy kaam alag thread/process ya queue me bhejo. Queue sabse scalable: API jaldi se "202 Accepted" bol deti hai aur worker peeche se kaam karta hai.

**Example:**

```js
// worker.js
import { parentPort, workerData } from 'node:worker_threads';
function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
parentPort.postMessage(fib(workerData.n));

// main.js
import { Worker } from 'node:worker_threads';
export const runFib = (n) =>
  new Promise((resolve, reject) => {
    const w = new Worker(new URL('./worker.js', import.meta.url), { workerData: { n } });
    w.once('message', resolve);
    w.once('error', reject);
  });
```

**Follow-ups:**
- Q: Worker per request? A: Spawning is costly; use a pool (for example `piscina`) with a bounded size.
- Q: Worker threads vs cluster? A: Workers parallelize CPU work inside one process; cluster runs multiple processes to use all cores for handling requests.

---

## Q-PERF-05 -- The N+1 query problem

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What is the N+1 query problem and how do you fix it?

**Interview answer:** N+1 happens when code runs one query to fetch N parent rows and then one additional query per row to fetch related data, resulting in N+1 round trips. It scales poorly because each query adds network latency and database load. Fix by fetching related data in one query with a `JOIN`, or with a second query using `WHERE id IN (...)` and grouping in memory, or by batching (DataLoader-style). ORMs hide this with lazy loading, so inspect the generated SQL and use eager loading deliberately.

**Hinglish explanation:** 100 orders laaye, phir har order ke liye alag query se customer ka naam laaye -- 101 queries! Aadmi ek tokri laane ke liye 100 chakkar lagaye. Ek JOIN ya `IN (...)` query se ek hi chakkar me sab aa jaata hai.

**Example:**

```js
// N+1 (bad)
const [orders] = await pool.execute('SELECT id, user_id, total FROM orders LIMIT 100');
for (const o of orders) {
  const [u] = await pool.execute('SELECT name FROM users WHERE id = ?', [o.user_id]);
  o.userName = u[0]?.name;
}

// one query (good)
const [rows] = await pool.execute(
  `SELECT o.id, o.total, u.name AS user_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
    LIMIT 100`
);
```

**Follow-ups:**
- Q: JOIN vs two queries with IN? A: JOIN is fine for to-one relations; for to-many, a JOIN multiplies parent rows, so two queries plus in-memory grouping can be cleaner.
- Q: How do you detect it? A: Query logs/APM showing many near-identical queries per request.

---

## Q-PERF-06 -- Index fundamentals and EXPLAIN

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** A query on a large table is slow. How do you use EXPLAIN and indexes to fix it?

**Interview answer:** I run `EXPLAIN` (or `EXPLAIN ANALYZE` in MySQL 8) on the query to see the access type, the chosen key, and estimated or actual rows. `type: ALL` means a full table scan, a red flag on a big table. I add an index on the columns used in `WHERE`, `JOIN`, and `ORDER BY`, then re-run EXPLAIN to confirm it is used and rows scanned dropped. I also remember trade-offs: indexes cost storage and slow writes, and some expressions defeat them (functions on the column, leading wildcards in `LIKE '%x'`, implicit type conversion).

**Hinglish explanation:** Index = kitab ka index. Bina index har page padhna padta hai (full scan). `EXPLAIN` batata hai MySQL kaise query chalayega. `type=ALL` dikha to danger. Par har column par index mat lagao -- insert/update slow ho jaate hain.

**Example:**

```sql
EXPLAIN SELECT id, total FROM orders WHERE user_id = 42 AND status = 'paid' ORDER BY created_at DESC LIMIT 20;

CREATE INDEX idx_orders_user_status_created ON orders (user_id, status, created_at);

-- MySQL 8.0.18+: actual execution stats
EXPLAIN ANALYZE SELECT id, total FROM orders WHERE user_id = 42 AND status = 'paid' ORDER BY created_at DESC LIMIT 20;
```

**Follow-ups:**
- Q: Why is `WHERE DATE(created_at) = '2026-01-01'` slow? A: The function on the column prevents index use; rewrite as a range: `created_at >= '2026-01-01' AND created_at < '2026-01-02'`.
- Q: Does an index always get used? A: The optimizer may skip it when it estimates a scan is cheaper (low selectivity).

---

## Q-PERF-07 -- Composite index order and covering indexes

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** How do you decide the column order of a composite index? What is a covering index?

**Interview answer:** A composite index is usable from its leftmost prefix. Generally put equality-filtered columns first, then the range or sort column, so the index can both filter and deliver rows already ordered; selectivity matters but query patterns matter more. For `WHERE user_id = ? AND status = ? ORDER BY created_at`, `(user_id, status, created_at)` works. A covering index contains every column the query needs, so MySQL answers from the index alone ("Using index") without reading table rows. After a range condition on one column, later columns in the index cannot be used for filtering.

**Hinglish explanation:** Composite index phonebook jaisa: pehle surname, phir first name. Sirf first name se dhundho to phonebook kaam nahi aata -- leftmost prefix rule. Isliye jo column hamesha equality me use hota hai usse pehle rakho, range/sort last me.

**Example:**

```sql
-- supports: user_id; user_id+status; user_id+status+created_at (also ordering)
CREATE INDEX idx_orders_usc ON orders (user_id, status, created_at);

-- covering: query reads only indexed columns
CREATE INDEX idx_orders_cover ON orders (user_id, status, total);
SELECT status, total FROM orders WHERE user_id = 42;  -- can be "Using index"
```

**Follow-ups:**
- Q: Index on `(a, b)` helps `WHERE b = ?`? A: Generally not, because `b` is not a leftmost prefix.
- Q: Too many indexes? A: Each slows INSERT/UPDATE/DELETE and uses memory; remove unused ones.

---

## Q-PERF-08 -- Offset vs keyset pagination

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Why can `LIMIT/OFFSET` pagination be slow on large tables and what is the alternative?

**Interview answer:** With `OFFSET N` the database still reads and discards the first N rows, so deep pages get slower and can show duplicates or gaps if rows are inserted meanwhile. Keyset (cursor/seek) pagination remembers the last seen sort key and queries "rows after this", which uses an index range and has constant cost regardless of depth. The trade-offs: you cannot jump to an arbitrary page number, and the sort key must be unique and indexed (add `id` as tie-breaker).

**Hinglish explanation:** Offset 1,000,000 ka matlab MySQL pehle 10 lakh rows padh kar phenk deta hai, phir 20 deta hai. Keyset me bolte ho "last id 5000 ke baad ke 20 do" -- seedha wahan se shuru. Infinite scroll ke liye perfect, "page 57 par jao" ke liye nahi.

**Example:**

```js
// offset (slow for deep pages)
await pool.query('SELECT id, title FROM posts ORDER BY id DESC LIMIT ? OFFSET ?', [20, 100000]);

// keyset (fast)
const lastId = Number(req.query.after) || Number.MAX_SAFE_INTEGER;
const [rows] = await pool.execute(
  'SELECT id, title FROM posts WHERE id < ? ORDER BY id DESC LIMIT 20',
  [lastId]
);
const nextCursor = rows.length ? rows[rows.length - 1].id : null;
```

**Follow-ups:**
- Q: Sorting by non-unique `created_at`? A: Use `(created_at, id)` as a compound cursor: `WHERE created_at < ? OR (created_at = ? AND id < ?)` with an index on `(created_at, id)`. The shorter row-constructor form `WHERE (created_at, id) < (?, ?)` returns the same rows but on MySQL 8.0 it was not used as an index seek in our test (about 180k index entries read on a 200k-row table versus 20), so prefer the expanded form.
- Q: Return total count? A: `COUNT(*)` is expensive on big tables; return `hasMore` or an approximate count.

---

## Q-PERF-09 -- Over-fetching and payload size

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** How can returning too much data hurt performance, and what do you do about it?

**Interview answer:** Selecting all columns and returning entire records costs database I/O (and prevents covering indexes), memory, serialization time, network bandwidth, and client parse time. I select only needed columns, paginate with sensible default and maximum page sizes, support field selection where useful, avoid embedding huge nested objects, compress responses (gzip/brotli), and use caching headers. Large exports should be streamed.

**Hinglish explanation:** Frontend dev ko pata hai ki bada JSON browser ko slow karta hai. Backend me `SELECT *` karke 50 columns bhejna jabki UI ko 3 chahiye -- DB, network, JSON, sab par bojh. Sirf wahi lo jo chahiye, aur page size ki max limit rakho (jaise 100).

**Follow-ups:**
- Q: Why cap `limit`? A: A client could request `limit=1000000` and exhaust memory; clamp it server-side.

---

## Q-PERF-10 -- Connection pool sizing

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you size a MySQL connection pool in a Node.js service?

**Interview answer:** A pool reuses a limited number of database connections, because creating connections is expensive and MySQL has a hard `max_connections`. Pool size should be small: more connections do not mean more throughput once the database CPU or I/O is saturated; they cause context switching and queueing. A reasonable starting point is 10 per app instance, then tune with load tests and observed wait times. The key constraint: total connections = instances x pool size, and this must stay safely below `max_connections` with headroom for admin and other services. Also release connections in `finally` and set acquire/queue limits and timeouts.

**Hinglish explanation:** Pool me 100 connection rakh dene se DB tez nahi ho jaata; DB ek waqt me limited queries hi efficiently chala pata hai. Agar 10 servers hain aur har ek ka pool 20 hai to 200 connections DB par. MySQL ki limit 151 default hai to crash! Isliye total count ka hisaab rakho.

**Example:**

```js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,      // per instance
  queueLimit: 100,          // fail fast instead of queueing forever (0 = unlimited)
  waitForConnections: true,
  connectTimeout: 10_000,
  enableKeepAlive: true,
});

// manual connection: ALWAYS release
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  // ... queries ...
  await conn.commit();
} catch (e) {
  await conn.rollback();
  throw e;
} finally {
  conn.release();
}
```

**Follow-ups:**
- Q: Pool exhausted symptoms? A: Requests hang or time out waiting for a connection although the DB looks idle; usually leaked connections (see Q-PROD-04).
- Q: Serverless/many instances? A: Use a proxy (ProxySQL, RDS Proxy) to multiplex connections.

---

## Q-PERF-11 -- Cache-aside pattern with Redis

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Explain the cache-aside pattern and show how you would cache a product lookup.

**Interview answer:** In cache-aside the application checks the cache first; on a hit it returns the cached value, on a miss it reads from the database, stores the result in the cache with a TTL, and returns it. Writes go to the database and then invalidate or update the cache. It is simple and resilient (if Redis is down you can fall back to the DB), but data can be stale until the TTL expires or the key is invalidated, so choose TTLs based on how stale the data can be.

**Hinglish explanation:** Pehle Redis se poochho (jaise React Query cache). Mila to wahi do. Nahi mila to DB se lao, Redis me rakho (TTL ke saath), phir do. Data update hone par cache key delete kar do, warna purana data dikhta rahega.

**Example:**

```js
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

export async function getProduct(id) {
  const key = `product:${id}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const [rows] = await pool.execute('SELECT id, name, price FROM products WHERE id = ?', [id]);
  if (!rows[0]) return null;
  await redis.set(key, JSON.stringify(rows[0]), { EX: 300 }); // 5 min TTL
  return rows[0];
}

export async function updateProduct(id, data) {
  await pool.execute('UPDATE products SET price = ? WHERE id = ?', [data.price, id]);
  await redis.del(`product:${id}`); // invalidate
}
```

**Follow-ups:**
- Q: What if Redis is down? A: Catch the error, log, and fall back to the DB (cache should be an optimization, not a dependency), but protect the DB from the resulting load.
- Q: Should you cache "not found"? A: Briefly (negative caching with a short TTL) to avoid repeated DB hits for missing ids.

---

## Q-PERF-12 -- Cache invalidation and stampede

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** What is a cache stampede and how do you prevent it? How do you handle invalidation?

**Interview answer:** A cache stampede (thundering herd) occurs when a popular key expires and many concurrent requests all miss and hit the database at once to rebuild it. Mitigations: request coalescing (only one request rebuilds, others await the same promise within the process or use a short Redis lock), TTL jitter so keys do not all expire together, "stale-while-revalidate" (serve stale while one refresh runs), and pre-warming hot keys. For invalidation, prefer short TTLs plus explicit deletion on writes for important data; versioned keys (`product:42:v7`) avoid race conditions; and accept that some data can be eventually consistent.

**Hinglish explanation:** Maan lo ek hot product ki cache expire hui aur usi second 5000 requests aayi -- sab DB par toot padengi. Solution: sirf ek request DB se rebuild kare, baaki intezaar karein. Aur sabki expiry thodi random rakho taaki ek saath na gire. Cache invalidation hard problem hai -- isliye TTL ek safety net hota hai.

**Example (in-process coalescing):**

```js
const inflight = new Map();

export function getOnce(key, loader) {
  if (inflight.has(key)) return inflight.get(key);
  const p = loader().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

const ttl = 300 + Math.floor(Math.random() * 60); // jitter
```

**Follow-ups:**
- Q: Coalescing across multiple instances? A: Use a short-lived Redis lock (`SET key val NX PX 5000`) so one instance rebuilds.
- Q: Write-through vs write-back? A: Write-through updates cache and DB together (consistent, slower writes); write-back writes to cache first and persists later (fast, risk of loss).

---

## Q-PERF-13 -- HTTP caching: Cache-Control and ETag

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How can HTTP caching headers reduce load on your API?

**Interview answer:** `Cache-Control` tells browsers and CDNs how long a response may be reused (`max-age`, `s-maxage`, `public`/`private`, `no-store` for sensitive data). `ETag` provides a validator: the client sends `If-None-Match` and, if the resource has not changed, the server replies `304 Not Modified` with no body, saving bandwidth and serialization. Public, rarely changing responses can be cached at the CDN edge; user-specific or sensitive responses should use `private` or `no-store`. Express generates weak ETags for responses by default.

**Hinglish explanation:** Agar data baar-baar nahi badalta to har baar server se mat mangwao. `Cache-Control: max-age=60` bolta hai "60 second tak dobara mat poochho". ETag me client puchta hai "mere paas version X hai, naya hai kya?" -- server bolta hai 304, body nahi bhejta. Frontend me tumne ye browser DevTools me dekha hoga.

**Example:**

```js
app.get('/api/categories', async (req, res) => {
  const items = await getCategories();
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json(items); // Express adds an ETag automatically
});

app.get('/api/me', authenticate, (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.json(req.user);
});
```

**Follow-ups:**
- Q: Danger of caching authenticated responses on a CDN? A: One user's private data could be served to another; use `private`/`no-store` and `Vary` appropriately.

---

## Q-PERF-14 -- Compression

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Should a Node API compress responses? Where?

**Interview answer:** Compressing text responses (JSON, HTML) with gzip or brotli can cut payload size by 70 percent or more, improving transfer time. Compression costs CPU, though, and in Node it uses the thread pool/CPU of your process, so in production it is usually better to do it at the reverse proxy or CDN (nginx, CloudFront) rather than in the Express app. Do not compress already-compressed content such as images or videos, and watch for security issues like BREACH when compressing secrets reflected in responses over HTTPS.

**Hinglish explanation:** Chota payload = tez download. JSON gzip hone par bahut chhota ho jaata hai. Par compression CPU khaata hai. Isliye aam taur par nginx/CDN ye kaam karta hai aur Node API sirf business logic. Image/video pehle se compressed hote hain, unhe dobara compress karna bekaar.

**Example:**

```js
import compression from 'compression';
app.use(compression({ threshold: 1024 })); // only compress bodies larger than 1 KB
```

**Follow-ups:**
- Q: gzip vs brotli? A: Brotli compresses better but is slower at high levels; good for static assets precompressed at build time.

---

## Q-PERF-15 -- Streaming large data instead of buffering

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you serve or export a very large file or query result without running out of memory?

**Interview answer:** Stream it. Instead of loading everything into memory, pipe data in chunks to the response using `stream.pipeline`, which handles backpressure (pausing the source when the client is slow) and error cleanup. For files use `fs.createReadStream`; for database exports use a streaming query with row-by-row transformation (to CSV or NDJSON). Memory stays roughly constant regardless of size, and the first bytes reach the client quickly.

**Hinglish explanation:** 2 GB CSV ko `readFile` se pura RAM me laoge to server crash. Stream me chhote-chhote chunk aate hain aur seedha client ko jaate hain. Backpressure ka matlab: agar client slow hai to source ko "ruko" bol do -- `pipeline` ye khud sambhalta hai.

**Example:**

```js
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

app.get('/export/report.csv', authenticate, async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
  try {
    await pipeline(createReadStream('./reports/big.csv'), res);
  } catch (err) {
    // client aborted or read failed; response is already partially sent
    console.error('stream failed', err.code);
  }
});
```

**Follow-ups:**
- Q: Why `pipeline` over `.pipe()`? A: `.pipe()` does not forward errors or destroy streams properly, causing leaks; `pipeline` does.
- Q: Streaming rows from MySQL? A: mysql2 supports `connection.query(sql).stream()` on non-promise connections; use `pipeline` into a transform.

---

## Q-PERF-16 -- JSON serialization cost and large payloads

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** `JSON.stringify` of a big object is blocking the server. What are your options?

**Interview answer:** `JSON.stringify` and `JSON.parse` are synchronous and CPU-bound, so large payloads block the event loop for all other requests. Options: reduce the payload (pagination, fewer fields), stream the output (NDJSON or a streaming JSON writer), cache the serialized string for hot data, use schema-based serializers such as `fast-json-stringify` (Fastify uses it) that are faster for known shapes, and for extremely large work offload to a worker thread (noting that transferring data to a worker also has a copy cost). Measure before choosing.

**Hinglish explanation:** JSON banana ya padhna bhi CPU ka kaam hai aur single thread par hota hai. 50 MB JSON ek baar me parse karne me loop kuch sau millisecond block ho sakta hai. Chhota payload, streaming, ya cache kiya hua string -- ye sab options hain.

**Follow-ups:**
- Q: How would you find it? A: CPU profile or flame graph shows time in `JSON.stringify`; event loop delay metric spikes on specific endpoints.

---

## Q-PERF-17 -- Using all CPU cores: cluster and PM2

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Node is single-threaded. How do you use a multi-core machine?

**Interview answer:** JavaScript runs on one main thread per process, so one process uses roughly one core for JS. To use more cores I run multiple processes: the built-in `cluster` module (a primary forks workers that share the same listening port), PM2's cluster mode, or, in containers, one process per container with an orchestrator running several replicas behind a load balancer. The processes do not share memory, so application state, sessions, and caches must live in external stores such as Redis or the database, and the app must be stateless.

**Hinglish explanation:** 8 core ki machine par ek Node process sirf ek core use karta hai. To 8 process chalao, load balancer ya cluster unme requests baant deta hai. Dhyan do: in-memory variable (jaise ek local counter ya session map) har process ka alag hoga, isliye shared state Redis me rakho.

**Example:**

```js
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import http from 'node:http';

if (cluster.isPrimary) {
  for (let i = 0; i < availableParallelism(); i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.error(`worker ${worker.process.pid} died, restarting`);
    cluster.fork();
  });
} else {
  http.createServer((req, res) => res.end(`handled by ${process.pid}\n`)).listen(3000);
}
```

**Follow-ups:**
- Q: Cluster vs worker threads? A: Cluster = many processes handling requests; worker threads = parallel CPU work in one process, sharing the process.
- Q: Cluster inside Docker/Kubernetes? A: Usually prefer one process per container and scale replicas, so the orchestrator manages restarts and resources.

---

## Q-PERF-18 -- Horizontal vs vertical scaling and stateless services

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What is the difference between vertical and horizontal scaling? What makes an app horizontally scalable?

**Interview answer:** Vertical scaling means giving one machine more resources (CPU, RAM); it is simple but has a ceiling and a single point of failure. Horizontal scaling means adding more machines or instances behind a load balancer; it scales further and improves availability but requires the application to be stateless. A stateless service keeps no request-specific data in local memory or local disk between requests: sessions go to Redis, uploads go to object storage, schedulers run once (leader election or a queue), and configuration comes from the environment. The database usually becomes the next bottleneck and scales through indexing, read replicas, caching, and partitioning.

**Hinglish explanation:** Vertical = bada server khareedna. Horizontal = zyada servers lagana. Horizontal tabhi chalega jab koi bhi server koi bhi request sambhal sake. Agar login session server ki memory me hai, to dusre server par request jaayegi to user logged out dikhega. Isliye state bahar rakho.

**Follow-ups:**
- Q: What breaks when you add a second instance? A: In-memory sessions, local file uploads, in-memory rate limiters, cron jobs running twice, and websockets without a shared broker.
- Q: When is vertical scaling the right first step? A: When it is a quick, cheap fix and the app is not yet at its limits; scaling out has a complexity cost.

---

## Q-PERF-19 -- Parallelizing async work with controlled concurrency

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** An endpoint awaits three independent service calls one after another. How do you speed it up? What goes wrong if you parallelize 10,000 calls?

**Interview answer:** Independent calls should run concurrently with `Promise.all` (or `Promise.allSettled` when partial failure is acceptable), making total time roughly the slowest call instead of the sum. But unbounded parallelism over a large list can exhaust sockets, memory, database connections, or hit the third party's rate limits. For large lists I process in bounded batches or use a concurrency limiter (`p-limit`, or a small worker-pool loop) and add timeouts.

**Hinglish explanation:** `await a(); await b(); await c();` ka time = a+b+c. `Promise.all([a(), b(), c()])` ka time = sabse slow wala. Par 10,000 requests ek saath bhejoge to server aur connection pool dono dam tod denge. Isliye limit (jaise 10 ek saath) lagao.

**Example:**

```js
// independent calls: run together
const [user, orders, recs] = await Promise.all([
  getUser(id),
  getOrders(id),
  getRecommendations(id),
]);

// bounded concurrency without a library
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
```

**Follow-ups:**
- Q: Dependent calls? A: Must stay sequential; only parallelize independent work.
- Q: `Promise.all` fails fast? A: It rejects on the first rejection but other promises keep running; use `allSettled` to collect all outcomes.

---

## Q-PERF-20 -- Thread pool saturation

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** What is the libuv thread pool and how can it become a bottleneck?

**Interview answer:** libuv keeps a pool of worker threads (default size 4, controlled by `UV_THREADPOOL_SIZE`, maximum 1024) used for operations that lack non-blocking OS APIs: file system calls, `dns.lookup`, and CPU-heavy crypto such as `pbkdf2`, `scrypt`, `randomBytes`, and bcrypt (native addon), plus zlib. Network sockets are not in this pool; they use OS polling. If many slow tasks queue up, for example 50 concurrent bcrypt logins or lots of file reads, they wait for the four threads, and unrelated operations such as `fs` calls and DNS lookups also slow down. Mitigations: raise `UV_THREADPOOL_SIZE` (set at process start before the pool is used), limit concurrency of heavy tasks, lower bcrypt cost carefully, or move heavy work to separate workers.

**Hinglish explanation:** Sab async cheezein thread pool me nahi jaati. Network I/O OS ke epoll/IOCP se hota hai. Par file system, dns.lookup, bcrypt/crypto ke liye 4 threads ka pool hai. Agar ek saath bahut saare login (bcrypt) aa gaye to chaaron thread busy aur baaki file/DNS kaam ruk gaye. Env variable `UV_THREADPOOL_SIZE=8` jaise badha sakte ho.

**Example:**

```bash
UV_THREADPOOL_SIZE=8 node server.js
```

**Follow-ups:**
- Q: Does `UV_THREADPOOL_SIZE` set inside the script work? A: Only if set before the pool is first used; safest is to set it in the environment when launching.
- Q: Is more threads always better? A: No; beyond core count you add contention.

---

## Q-PERF-21 -- Connection reuse (HTTP keep-alive) for outbound calls

**Difficulty:** Intermediate | `[ADVANCED]`

**Question:** Your service calls another API thousands of times a minute and latency is high. What connection-level optimizations help?

**Interview answer:** Reusing connections avoids repeating the TCP and TLS handshake for every request. In modern Node (19+ the global agent has keep-alive enabled by default; on Node 18 and earlier it did not), using `fetch` or a shared `http.Agent`/`undici` pool with keep-alive keeps connections warm. I create one shared client per downstream host, set sensible timeouts, bound the max sockets, and avoid creating a new client per request. HTTP/2 multiplexing can further reduce connection counts.

**Hinglish explanation:** Har request par naya connection banana matlab har baar handshake ka time. Ek baar connection khola aur baar-baar use kiya to bahut fast. Client ek baar bana kar share karo, har request me naya mat banao.

**Example:**

```js
import { Agent, request } from 'undici';

const client = new Agent({ keepAliveTimeout: 10_000, connections: 50 });

export async function getUser(id) {
  const { statusCode, body } = await request(`https://users.internal/users/${id}`, {
    dispatcher: client,
    headersTimeout: 3000,
    bodyTimeout: 3000,
  });
  if (statusCode !== 200) throw new Error(`users service ${statusCode}`);
  return body.json();
}
```

**Follow-ups:**
- Q: Why timeouts? A: Without them a slow dependency holds your sockets and requests indefinitely.

---

## Q-PERF-22 -- Load testing: tools and interpreting results

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you load test an API and what do you look at?

**Interview answer:** I use tools such as `autocannon` (Node), k6, or wrk to generate concurrent requests against a staging environment with production-like data. I ramp the load, hold it, and watch latency percentiles, requests per second, error rate, and server metrics (CPU, memory, event loop delay, DB connections, slow queries). The goal is to find the saturation point and the first bottleneck, not just a big number. I test realistic scenarios (mixed endpoints, auth, realistic payloads), warm up first, run the load generator on a separate machine, and never load test production without safeguards.

**Hinglish explanation:** Load test se pata chalta hai ki kitne users par system toot jaata hai aur pehle kya tootta hai (DB? CPU? pool?). Sirf "RPS = 5000" mat dekho; p95/p99 latency aur errors dekho. Load generator ko usi machine par mat chalao jahan server hai -- wo CPU kha jayega.

**Example:**

```bash
npx autocannon -c 100 -d 30 -p 10 http://localhost:3000/api/products
# -c connections, -d duration seconds, -p pipelined requests
```

**Follow-ups:**
- Q: Smoke vs load vs stress vs soak? A: Smoke = quick sanity; load = expected traffic; stress = beyond capacity to see failure mode; soak = long duration to find leaks.
- Q: Why is a laptop test unrepresentative? A: Different hardware, no network latency, tiny dataset, warm caches.

---

## Q-PERF-23 -- CPU profiling and flame graphs

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** Where is the CPU time going in a Node process? How do you profile it?

**Interview answer:** I capture a CPU profile: either `node --cpu-prof` which writes a `.cpuprofile` file you can open in Chrome DevTools, or attach the inspector and record from the Performance/Profiler tab, or use tools such as `clinic flame` or `0x` to produce flame graphs. In a flame graph, wide bars at the top mean functions where most time is spent; I look for unexpected hot functions (JSON serialization, regex, crypto, sync loops), optimize the real hotspot, and re-profile to confirm. Profile under realistic load, since idle profiles show nothing useful.

**Hinglish explanation:** Flame graph me jo bar sabse chauda wo sabse zyada time kha raha hai. Pehle profile lo, phir optimize karo. Aksar surprise milta hai -- jaise koi chhota regex ya JSON.stringify poora time kha raha tha.

**Example:**

```bash
node --cpu-prof --cpu-prof-dir=./profiles server.js
# run load, stop the process, open the .cpuprofile in Chrome DevTools (Performance tab -> Load profile)
```

**Follow-ups:**
- Q: Is profiling safe in production? A: Short, sampling-based profiles are low overhead; do it on one instance and limit duration.

---

## Q-PERF-24 -- Memory tuning: heap, GC, and --max-old-space-size

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** How does Node manage memory and what does `--max-old-space-size` do?

**Interview answer:** V8 manages the JS heap with a generational garbage collector: short-lived objects live in the young generation and are collected cheaply, survivors are promoted to the old generation, which is collected less often by mark-and-sweep/compact with incremental and concurrent phases to reduce pauses. `--max-old-space-size=<MB>` sets the old-generation limit; when exceeded the process dies with "JavaScript heap out of memory". Defaults depend on version and available memory (newer Node versions size the limit from the container memory). In containers I set it to about 70-80 percent of the container limit, leaving room for buffers and native memory (which are outside the heap). Raising the limit only postpones a leak; the real fix is to find what retains memory.

**Hinglish explanation:** V8 apna heap khud saaf karta hai (garbage collection). Naye objects jaldi mar jaate hain, jo zinda rehte hain old space me jaate hain. Limit paar hui to crash. Limit badhana leak ka ilaaj nahi, bas deri hai. Container ki memory limit aur Node ki heap limit dono dhyan me rakho, kyunki Buffers heap ke bahar hote hain.

**Example:**

```bash
node --max-old-space-size=1536 server.js   # container limit 2 GB
```

```js
console.log(process.memoryUsage()); // rss, heapTotal, heapUsed, external, arrayBuffers
```

**Follow-ups:**
- Q: heapUsed vs rss? A: heapUsed is live JS objects; rss is total process memory including native allocations and Buffers.
- Q: Memory leak diagnosis? A: See Q-PROD-02.

---

## Q-PERF-25 -- Bulk inserts and batching

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** You must insert 100,000 rows. How do you do it efficiently?

**Interview answer:** Avoid 100,000 individual round trips. Batch rows into multi-row `INSERT ... VALUES (...), (...)` statements (for example 500-1000 rows per statement), inside a transaction so commits are not per row, and keep each batch within `max_allowed_packet`. For very large imports, `LOAD DATA INFILE` is fastest, or a streamed pipeline reading a file and inserting in batches. Use parameterized batches rather than concatenating values, and consider temporarily deferring secondary index maintenance only when safe. Handle failures by retrying the failed batch and keeping the import idempotent (`INSERT ... ON DUPLICATE KEY UPDATE` or a unique key).

**Hinglish explanation:** Ek-ek row insert karoge to har row par network ka chakkar. 1000 rows ek saath bhejo. Transaction me daalo taaki commit baar-baar na ho. Query me values string se mat jodo, mysql2 ka bulk `VALUES ?` ya placeholders use karo.

**Example:**

```js
export async function bulkInsert(pool, rows, batchSize = 500) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      // mysql2 expands a nested array for "VALUES ?" when using query()
      await conn.query('INSERT INTO events (user_id, type, payload) VALUES ?', [
        chunk.map((r) => [r.userId, r.type, JSON.stringify(r.payload)]),
      ]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
```

**Follow-ups:**
- Q: Why `query` and not `execute` here? A: `execute` uses server-side prepared statements and does not expand the nested array for `VALUES ?`.
- Q: Single giant transaction risks? A: Long locks and big undo logs; chunk the transaction (for example commit every N batches) if rollback of everything is not required.

---

## Q-PERF-26 -- Read replicas and replication lag

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** How do read replicas help and what problems do they introduce?

**Interview answer:** A primary database handles writes and replicates changes to one or more read replicas, which serve read-only queries, spreading read load and enabling reporting queries without hurting the primary. The main problem is replication lag: a replica may be slightly behind, so a user who just wrote data and then reads from a replica might not see it (read-your-writes violation). Mitigations: route reads that must be fresh (right after a write, or critical reads such as balances) to the primary, use sticky routing for a short period after writes, or monitor lag and fall back. Replicas do not help write scaling.

**Hinglish explanation:** Primary sirf likhne aur zaroori reads ke liye, replicas padhne ke liye. Problem: replica thoda peeche chalta hai. User ne profile update kiya aur turant page reload kiya, replica se purana data dikha. Isliye "abhi likha hai" wale reads primary se karo. Write badhne par replica madad nahi karta.

**Example:**

```js
const writePool = mysql.createPool({ uri: process.env.DB_PRIMARY_URL, connectionLimit: 10 });
const readPool = mysql.createPool({ uri: process.env.DB_REPLICA_URL, connectionLimit: 20 });

export const db = {
  write: (sql, params) => writePool.execute(sql, params),
  read: (sql, params) => readPool.execute(sql, params),
  readFresh: (sql, params) => writePool.execute(sql, params), // read-your-writes / critical reads
};
```

**Follow-ups:**
- Q: Money balance read from a replica? A: No; use the primary for correctness-critical reads.
- Q: How do you scale writes? A: Vertical scaling, batching, partitioning, or sharding (see Q-SD-12).

---

## Q-PERF-27 -- Backpressure, load shedding, and queue limits

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** What should a service do when it is receiving more traffic than it can handle?

**Interview answer:** Accepting everything and queueing without limit makes latency explode and memory grow until the service crashes. A resilient service applies backpressure and load shedding: bound queues and pools, set per-request timeouts, reject excess work quickly with `503` or `429` and `Retry-After`, prioritize important traffic, and let clients back off with jitter. Autoscaling helps with sustained growth but reacts with a delay, so protective limits are still needed. Fast failure is better than slow failure for everyone.

**Hinglish explanation:** Bheed zyada ho to darwaza band karna padta hai, warna andar sab dab jaate hain. Server bhi aisa hi: limit se zyada requests ko jaldi "503 busy, baad me aao" bol do. Isse jo requests andar hain wo achhe se chalti hain.

**Example:**

```js
let active = 0;
const MAX_ACTIVE = 200;

app.use((req, res, next) => {
  if (active >= MAX_ACTIVE) {
    res.set('Retry-After', '2');
    return res.status(503).json({ error: 'Server busy' });
  }
  active++;
  res.on('close', () => { active--; });
  next();
});
```

**Follow-ups:**
- Q: Why jitter in client retries? A: Without it all clients retry simultaneously, creating retry storms.

---

## Q-PERF-28 -- Offloading slow work to background jobs

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Signup sends a welcome email and the API takes 3 seconds. What would you change?

**Interview answer:** Slow, non-essential side effects should not be on the request path. Save the user, then enqueue a job (BullMQ with Redis, or SQS) and return immediately; a worker process sends the email with retries and exponential backoff. This improves response time and isolates failures: if the email provider is down, signup still works and the job retries later. The job must be idempotent since queues deliver at least once, and failed jobs go to a dead-letter queue for inspection.

**Hinglish explanation:** User ko email ke liye 3 second wait karane ki zaroorat nahi. Job queue me daalo, "ok" bol do, worker peeche se mail bhejega. Email service down ho to bhi signup chalega. Bas job ko aise likho ki do baar chal jaaye to bhi ek hi mail jaaye.

**Example:**

```js
import { Queue, Worker } from 'bullmq';
const connection = { host: process.env.REDIS_HOST, port: 6379 };

export const emailQueue = new Queue('email', { connection });

// API
await emailQueue.add('welcome', { userId, email }, {
  jobId: `welcome:${userId}`,          // dedupes the same job id
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 1000,
});

// worker process
new Worker('email', async (job) => sendWelcomeEmail(job.data), { connection, concurrency: 5 });
```

**Follow-ups:**
- Q: At-least-once vs exactly-once? A: Queues generally deliver at least once; make consumers idempotent to get effectively-once results.
- Q: What if Redis loses jobs? A: Enable persistence (AOF) or use a managed queue with durability guarantees; for critical events use the outbox pattern (Q-SD-20).

---

## Q-PERF-29 -- Hot rows and lock contention

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** Throughput collapses when many requests update the same row (for example a product's stock counter). Why, and what can you do?

**Interview answer:** Each update takes an exclusive row lock until the transaction commits, so concurrent updates to a hot row serialize; latency grows with queue length, and long transactions or deadlocks make it worse. Mitigations: keep transactions short, do the update as a single atomic statement (`UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0`), avoid holding locks across network calls, update rows in a consistent order to prevent deadlocks, shard the counter across several rows and sum them, buffer increments in Redis and flush in batches, or use a queue to serialize intentionally.

**Hinglish explanation:** Ek hi row ko 1000 log update karein to lock ki line lag jaati hai. Transaction ke andar kisi bahar ki API ko call mat karo, warna lock bahut der tak pakda rahega. Atomic update ek line me karo, aur agar bahut hi hot hai to counter ko kai rows me baant do.

**Example:**

```sql
UPDATE products SET stock = stock - 1 WHERE id = 42 AND stock > 0;
-- check affected rows in application: 0 means sold out
```

**Follow-ups:**
- Q: Deadlock? A: Two transactions waiting on each other's locks; MySQL kills one (error 1213) and the app should retry it.

---

## Q-PERF-30 -- Timeouts, circuit breakers, and bulkheads

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** How do you prevent one slow dependency from taking down your whole API?

**Interview answer:** Set explicit timeouts on every outbound call (HTTP, DB, Redis) so threads and sockets are never held indefinitely. Add a circuit breaker: after a threshold of failures, stop calling the dependency for a cooldown period (open), then let a few trial requests through (half-open) before closing again, returning fallbacks or fast errors meanwhile. Use bulkheads (separate pools or concurrency limits per dependency) so one slow service cannot consume all resources. Combine with retries limited by exponential backoff and jitter, never infinite retries.

**Hinglish explanation:** Maan lo payment gateway slow ho gaya. Agar tum har request usse wait karwate rahe to saare connection/sockets atak jaayenge aur tumhari poori API down. Circuit breaker electrical fuse ki tarah hai: baar-baar fail hone par call band kar do, thodi der baad dobara try karo.

**Example:**

```js
async function withTimeout(promiseFactory, ms) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    return await promiseFactory(ac.signal);
  } finally {
    clearTimeout(timer);
  }
}

const res = await withTimeout((signal) => fetch(url, { signal }), 3000);
```

**Follow-ups:**
- Q: Library? A: `opossum` implements a circuit breaker for Node.
- Q: What about retrying non-idempotent calls? A: Only with an idempotency key; otherwise retries may duplicate effects.

---

## Q-PERF-31 -- CDN and offloading static and cacheable content

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** How does a CDN help backend performance?

**Interview answer:** A CDN caches content at edge locations close to users, so static assets (images, JS, CSS) and cacheable API responses are served without reaching your origin servers. This reduces latency, origin load, and bandwidth cost, and absorbs traffic spikes and some DDoS traffic. For correctness, set proper `Cache-Control` headers, use versioned or hashed asset names for long caching, purge or short TTL for changing content, and avoid caching personalized responses.

**Hinglish explanation:** CDN matlab duniya bhar me copies. Mumbai ka user Mumbai ke edge se image le leta hai, tumhare Virginia server tak jaata hi nahi. Backend ka bojh bhi kam. Dhyan: personal data wali API response ko CDN par cache mat karo.

**Follow-ups:**
- Q: Cache busting? A: Put a content hash in filenames (`app.3f9a1c.js`) so a new deploy gets a new URL.

---

## Q-PERF-32 -- Precomputed aggregates and denormalization

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** A dashboard runs `COUNT` and `SUM` over millions of rows on every load. How do you make it fast?

**Interview answer:** Avoid recomputing heavy aggregates on each request. Options: ensure supporting indexes first; cache results with a short TTL; maintain precomputed summary tables updated incrementally (on write, by a job, or from events) and queried by the dashboard; use denormalized counters on parent rows (like `comment_count`) with atomic updates; or offload analytics to a read replica or warehouse. The trade-off is added write complexity and eventual consistency, so denormalize only when measurements show the need and define how the derived data is repaired if it drifts.

**Hinglish explanation:** Har baar 1 crore rows ka SUM nikalna mehenga hai. Ek chhoti "summary" table rakho jisme din-wise totals pehle se jode hue hon. Dashboard sirf summary padhe. Cost: likhte waqt summary bhi update karni padti hai, aur kabhi mismatch ho to repair ka tareeka chahiye.

**Example:**

```sql
CREATE TABLE daily_sales (
  day DATE NOT NULL,
  seller_id BIGINT NOT NULL,
  order_count INT NOT NULL DEFAULT 0,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (day, seller_id)
);

INSERT INTO daily_sales (day, seller_id, order_count, revenue)
VALUES (CURRENT_DATE, 7, 1, 499.00)
ON DUPLICATE KEY UPDATE order_count = order_count + 1, revenue = revenue + 499.00;
```

**Follow-ups:**
- Q: Normalization vs denormalization? A: Normalize for correctness by default; denormalize selectively for read performance, accepting redundancy.

---

# END OF CATEGORY 8

---

# CATEGORY 9: PRODUCTION SCENARIOS

How to use this category: scenario questions test your **method**, not a memorized fix. Interviewers want to hear: (1) check the impact and mitigate, (2) gather evidence, (3) narrow the layer, (4) fix the root cause, (5) prevent recurrence. Each scenario below lists symptoms, a diagnosis sequence, common causes with fixes, and prevention.

---

## Q-PROD-01 -- "The API suddenly became slow"

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Monitoring shows the API is suddenly slow in production (p95 jumped from 200 ms to 4 s). Nothing was deployed. Walk me through your diagnosis.

**Interview answer:** First I confirm scope and impact: which endpoints, which users or regions, since when, and whether it is slow for all requests or a subset. I correlate the start time with changes (deploys, config, traffic spikes, cron jobs, data growth, a dependency incident). Then I split latency by layer: app CPU and event loop delay, database (slow query log, active queries, locks, connections), cache (hit rate, Redis latency), and external APIs (their latency and error rates), using traces or timing logs. If one endpoint is slow, I inspect its query plan or downstream calls; if everything is slow, I look at shared resources: event loop blocked, CPU or memory saturation, DB or pool saturation, network, or a noisy neighbor. I mitigate first when possible (rollback, scale out, disable the heavy feature, add a timeout or circuit breaker), then fix the root cause and add monitoring so it is detected earlier.

**Hinglish explanation:** Ek-ek layer ko check karo, andaza mat lagao. Pehle sawaal: "kya sab slow hai ya sirf ek endpoint?" Agar sirf ek endpoint, to uski query ya uske downstream call me problem. Agar sab slow, to shared cheez: CPU, event loop, DB, ya connection pool. Beech me user ko bachane ke liye mitigate bhi karo (scale out, rollback, feature off), root cause baad me.

**Diagnosis steps (checklist):**

1. Scope: which endpoints, which customers, since when? Compare p50 vs p99 (all slow, or only the tail?).
2. What changed: deploy, config/feature flag, traffic spike, new data volume, scheduled job, dependency incident.
3. Host health: CPU, memory, GC, event loop delay (`monitorEventLoopDelay`), open handles, restarts.
4. Database: `SHOW FULL PROCESSLIST`, slow query log, `EXPLAIN` of the slow query, lock waits (`information_schema.innodb_trx`, `performance_schema` data lock tables), connection count versus `max_connections`.
5. Pool: are requests waiting for a free connection? (high wait time while DB CPU is low suggests leaked or insufficient pool).
6. Cache: hit rate dropped? Redis latency or evictions? A cold cache after restart or flush can cause a DB surge.
7. External calls: provider latency/timeouts, retries amplifying load, missing timeouts.
8. Traffic: unusual spike, bot, retry storm, one tenant with huge payloads.

**Common causes and fixes:**

| Cause | Evidence | Fix |
|-------|----------|-----|
| Slow or missing index after data growth | slow query log, `EXPLAIN type=ALL` | add or fix index, rewrite query |
| N+1 queries on a new feature | many identical queries per request | join/batch |
| Event loop blocked | event loop delay high, CPU 100 percent one core | remove sync work, offload to worker |
| DB pool exhausted/leak | waiting for connections, low DB CPU | release in `finally`, tune pool |
| Cache flush or expiry stampede | hit rate drop, DB spike | coalescing, jitter, warm-up |
| Slow third-party API without timeout | outbound latency high | timeouts, circuit breaker, async |
| Lock contention | lock waits, deadlocks | shorten transactions, order updates |
| Traffic spike or bot | RPS jump, single IP/user | rate limit, scale, cache |

**Example (quick request timing middleware to see where time goes):**

```js
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (ms > 1000) {
      req.log?.warn({ route: req.route?.path, method: req.method, ms, status: res.statusCode }, 'slow request');
    }
  });
  next();
});
```

**Follow-ups:**
- Q: How do you prove the DB is the bottleneck? A: Time the queries separately (APM spans or logs), compare DB time to total request time, and check DB metrics (CPU, active threads, slow log).
- Q: Everything slow but CPU is low? A: Likely waiting: pool exhaustion, lock waits, slow downstream calls, or network issues.
- Q: What do you do in the first five minutes? A: Check dashboards and recent changes, decide whether to roll back or scale, communicate status; do not start deep debugging while users are down.

---

## Q-PROD-02 -- "Memory keeps climbing until the process is killed"

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** A Node service's memory climbs steadily and it is eventually OOM-killed and restarted. How do you find and fix the leak?

**Interview answer:** First I confirm it is a real leak: a sawtooth pattern (rise then drop after GC) is normal, but a steady upward trend in `heapUsed` after garbage collection is a leak. I check which memory is growing: `heapUsed` (JS objects) versus `external` and `arrayBuffers` (Buffers) versus `rss` (native). Then I take heap snapshots at intervals (via `--inspect`, `v8.writeHeapSnapshot()`, or a signal handler) and compare them in Chrome DevTools to see which object types and retainers grow. Typical causes: unbounded in-memory caches or maps, event listeners added per request and never removed, global arrays collecting data, timers or intervals never cleared, closures retaining large objects, unbounded queues, and request-scoped data stored globally. I fix the retention (bounded LRU cache with TTL, remove listeners, clear timers), verify memory stabilizes under load, and add a memory metric and alert. As a temporary mitigation I can restart on a schedule or set a heap limit and restart gracefully, but that is not a fix.

**Hinglish explanation:** Leak ka matlab object ki zaroorat nahi par koi reference pakde hai to GC use hata nahi pata. Pehle confirm karo ki GC ke baad bhi memory upar ja rahi hai. Phir heap snapshot lo (pehle aur baad me), DevTools me compare karo -- kaun sa object count badh raha hai aur use kaun pakde hue hai (retainer). Mostly gunahgaar: ek global Map jo kabhi saaf nahi hota, har request par `on('event')` lagana, ya setInterval jo band nahi hua.

**Diagnosis steps:**

1. Trend: plot `process.memoryUsage()` (`heapUsed`, `rss`, `external`, `arrayBuffers`) over hours. Correlate with traffic and deploys.
2. Which type of memory? Growing `heapUsed` means JS objects; growing `external`/`arrayBuffers` means Buffers (unclosed streams, big uploads held in memory); growing `rss` without heap growth means native leaks or fragmentation.
3. Reproduce under load in staging (autocannon) with `--inspect`; force GC (`--expose-gc` in test) and see if memory returns.
4. Take snapshots: baseline, after N requests, after more requests. Use the Comparison view and sort by "Size delta"; inspect Retainers.
5. Look for the usual suspects: global caches, per-request listeners, intervals, closures, queues, `Map`s keyed by user id, accumulating logs in memory.
6. Fix, redeploy, and watch the memory graph for a full traffic cycle.

**Example (typical leak and fix):**

```js
// LEAK: every request adds a listener and a cache entry that is never removed
const cache = new Map();
app.get('/profile/:id', async (req, res) => {
  const data = await loadProfile(req.params.id);
  cache.set(req.params.id, data);          // unbounded growth
  eventBus.on('update', () => {/* uses data */}); // listener leak
  res.json(data);
});

// FIX: bounded cache with TTL, no per-request listeners
import { LRUCache } from 'lru-cache';
const cache2 = new LRUCache({ max: 5000, ttl: 60_000 });
```

```js
// take a heap snapshot on demand (protect this endpoint or use a signal)
import v8 from 'node:v8';
process.on('SIGUSR2', () => {
  const file = v8.writeHeapSnapshot();
  console.log('heap snapshot written', file);
});
```

**Follow-ups:**
- Q: What does Node's `MaxListenersExceededWarning` tell you? A: More than 10 listeners on one emitter, often a listener leak.
- Q: Heap snapshot in production? A: It pauses the process and needs about as much memory as the heap, so do it on a single instance taken out of rotation.
- Q: Is high memory always a leak? A: No; caches, large buffers, and delayed GC can raise usage that then stabilizes. Leak means continuous growth.
- Q: Why not just increase `--max-old-space-size`? A: It only delays the crash and makes GC pauses longer.

---

## Q-PROD-03 -- "Customers are being charged twice (duplicate payments)"

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** Some customers report being charged twice for the same order. How do you investigate and prevent it?

**Interview answer:** First I stop the bleeding and check the facts: find affected orders, compare timestamps, request ids, and payment gateway charge ids to see if two separate requests created two charges or one request retried. Common causes: the user double-clicks or the client retries on a timeout; the server times out but the gateway succeeded so a retry charges again; load balancer or client retries of a non-idempotent POST; webhooks delivered more than once and processed twice; two concurrent requests both passing a "no existing payment" check (race condition); and a queue delivering a job twice. The fix is layered: use an idempotency key per payment intent (generated by the client or server) enforced with a unique database constraint, send the same key to the gateway, make state transitions atomic and conditional (`UPDATE ... WHERE status = 'pending'`), process webhooks idempotently by event id, make payment job consumers idempotent, and disable the button on the client (UX only). Then refund duplicates, reconcile with the gateway, and add monitoring that detects duplicates.

**Hinglish explanation:** Duplicate payment ka root cause: "ek hi kaam do baar ho gaya". Network me timeout aaya to client ko pata nahi payment hua ya nahi, wo retry karta hai. Server ne to charge kar diya tha, to doosra charge ho gaya. Solution: har payment ko ek unique key do (idempotency key). Dusri baar wahi key aaye to naya charge nahi, purana result return karo. Unique constraint DB me hona chahiye, sirf `if (!exists)` check race condition me fail hota hai.

**Diagnosis steps:**

1. Collect affected orders and the gateway's charge ids; compare timestamps (milliseconds apart suggests double-click/race/parallel retry; seconds apart suggests timeout retries or queue redelivery).
2. Trace by request id in logs: one request twice or two different requests?
3. Check gateway logs: was the second charge created with the same idempotency key (if any)?
4. Check code path: is there a read-then-insert "exists" check without a unique constraint? Are retries enabled on a non-idempotent call (client, proxy, SDK)?
5. Check webhook handler: is `event.id` stored/deduplicated?
6. Check queue consumers for at-least-once redelivery without dedupe.

**Example (idempotency with a unique key; MySQL 8):**

```sql
CREATE TABLE payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  idempotency_key VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
  gateway_charge_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- NULL unless succeeded; a UNIQUE index allows many NULLs, so at most ONE succeeded payment per order
  succeeded_order_id BIGINT GENERATED ALWAYS AS (CASE WHEN status = 'succeeded' THEN order_id END) STORED,
  UNIQUE KEY uq_payments_idem (idempotency_key),
  UNIQUE KEY uq_payments_one_success (succeeded_order_id)
) ENGINE=InnoDB;
```

The unique `idempotency_key` guarantees one row per client intent; the generated-column unique index is a second safety net so a bug can never mark two payments for the same order as succeeded.

```js
export async function createPayment(req, res) {
  const key = req.get('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
  const { orderId, amount } = req.body;

  // 1) atomically claim the key; a duplicate key makes the insert fail
  try {
    await pool.execute(
      'INSERT INTO payments (order_id, idempotency_key, amount) VALUES (?, ?, ?)',
      [orderId, key, amount]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [[existing]] = await pool.execute(
        'SELECT status, gateway_charge_id FROM payments WHERE idempotency_key = ?', [key]
      );
      return res.status(200).json({ replayed: true, ...existing });
    }
    throw err;
  }

  // 2) call the gateway with the SAME key so the gateway also dedupes
  const charge = await gateway.charge({ amount, idempotencyKey: key });

  // 3) conditional transition
  await pool.execute(
    "UPDATE payments SET status = 'succeeded', gateway_charge_id = ? WHERE idempotency_key = ? AND status = 'pending'",
    [charge.id, key]
  );
  res.status(201).json({ status: 'succeeded', chargeId: charge.id });
}
```

**Follow-ups:**
- Q: What if the server crashes after charging but before updating the DB? A: The payment stays `pending`; a reconciliation job queries the gateway by idempotency key or charge id and completes the state. Retrying with the same key returns the same charge.
- Q: Who generates the key? A: Typically the client per user intent (for example per checkout attempt); the server can also derive one from `order_id`.
- Q: How long do you store keys? A: At least the maximum retry window (often 24 hours to several days); expire them with a cleanup job.
- Q: Is disabling the submit button enough? A: No, it is UX only; network retries and multiple tabs bypass it.
- Q: Same key, different body? A: Reject with 422 (or 409) because the key is being reused for a different request; store a request fingerprint to detect that.

---

## Q-PROD-04 -- "DB connections are exhausted"

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** The app logs `Too many connections` (MySQL error 1040) or requests hang waiting for a connection. How do you diagnose and fix it?

**Interview answer:** There are two related failures: the MySQL server hitting `max_connections` (error 1040), or the application pool being exhausted so requests wait. I check `SHOW STATUS LIKE 'Threads_connected'` and `SHOW FULL PROCESSLIST` to see who holds connections and what they are doing; sleeping connections suggest leaks or oversized pools, while many long-running queries suggest slow queries or locks holding connections. Common causes: connections acquired with `getConnection()` and not released on error paths (no `finally`), transactions left open (no commit/rollback), slow queries or lock waits that tie up connections, too many app instances times the pool size, creating a new pool or connection per request, and traffic spikes without queue limits. Fixes: always release in `finally`, one shared pool per process, size the pool so instances x pool stays under `max_connections` with headroom, shorten transactions and avoid external calls inside them, add query and connection timeouts, fix slow queries, and consider a proxy (ProxySQL, RDS Proxy) for many clients. Add metrics for pool usage and wait time.

**Hinglish explanation:** Connection limit ek bus ki seats jaisi hai. Agar log seat chhodte hi nahi (release nahi karte), to nayi sawari ko seat nahi milti. Sabse common bug: `getConnection()` ke baad error aaya aur `release()` run hi nahi hua. Isliye `try/finally`. Dusra: har request par naya pool bana dena. Tisra: 10 servers x 50 pool = 500 connections par DB ki limit 151.

**Diagnosis steps:**

1. Identify which side is exhausted: DB-side `Too many connections` versus app-side waiting (pool timeouts, hung requests with idle DB).
2. DB: `SHOW STATUS LIKE 'Threads_connected'; SHOW VARIABLES LIKE 'max_connections';`
3. Who holds them: `SHOW FULL PROCESSLIST;` and group by host/user/state. Many `Sleep` with high `Time` means leaked or idle connections; many `Query` with high `Time` means slow queries or locks.
4. Open transactions: `SELECT * FROM information_schema.innodb_trx;` for long-running transactions.
5. App: log pool stats (in-use, queued); search code for `getConnection()` without `finally { release() }`, `createConnection/createPool` inside handlers, transactions without commit/rollback on all paths.
6. Math: instances x `connectionLimit` versus `max_connections`.

**Example:**

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
SELECT user, SUBSTRING_INDEX(host, ':', 1) AS client, command, COUNT(*) AS n, MAX(time) AS max_secs
  FROM information_schema.processlist
 GROUP BY user, client, command
 ORDER BY n DESC;
SELECT trx_id, trx_started, trx_mysql_thread_id, trx_query
  FROM information_schema.innodb_trx
 ORDER BY trx_started;
```

```js
// LEAK: release is skipped if anything throws
// const conn = await pool.getConnection();
// await conn.query(...); // throws -> never released
// conn.release();

// FIX
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  await conn.execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [100, 1]);
  await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [100, 2]);
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

**Follow-ups:**
- Q: Quick mitigation during the incident? A: Restart the leaking instances, kill long-idle or stuck sessions (`KILL <id>`), temporarily raise `max_connections` if memory allows, and shed load; then fix the cause.
- Q: Why not just raise `max_connections`? A: Each connection uses memory; more concurrency also hurts the DB. It buys time but hides leaks.
- Q: `pool.query` vs `getConnection`? A: `pool.query` and `pool.execute` acquire and release automatically; manual `getConnection` is needed only for transactions or session state.

---

## Q-PROD-05 -- 502 Bad Gateway / 504 Gateway Timeout

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Users see 502 or 504 errors from the load balancer or nginx. What do you check?

**Interview answer:** A 502 means the proxy got an invalid response or could not connect to the upstream (the Node process crashed, restarted, is not listening, or closed the connection early). A 504 means the upstream did not respond within the proxy's timeout (slow handler, blocked event loop, exhausted pool). I check whether the Node process is running and healthy (restarts, OOM kills, crash logs), the proxy error logs, health check results, and compare timeouts: the proxy timeout versus the app's slowest requests, and the Node `keepAliveTimeout`, which should be higher than the load balancer's idle timeout, otherwise the LB reuses a connection that Node just closed and gets a 502. During deploys, 502s mean connections were dropped, so graceful shutdown and readiness checks matter.

**Hinglish explanation:** 502 = proxy ne server se baat karne ki koshish ki par server ne ya to jawab hi nahi diya ya connection tod diya (crash/restart). 504 = server zinda hai par jawab dene me bahut der laga di. Ek famous trap: AWS ALB ka idle timeout 60 sec hai aur Node ka `keepAliveTimeout` 5 sec -- Node pehle connection band kar deta hai aur ALB ko random 502 milte hain. Fix: Node ka keepAliveTimeout ALB se zyada rakho.

**Example:**

```js
import http from 'node:http';
import { app } from './app.js';

const server = http.createServer(app);
server.keepAliveTimeout = 65_000; // > ALB idle timeout of 60s
server.headersTimeout = 66_000;   // > keepAliveTimeout
server.listen(3000);
```

**Follow-ups:**
- Q: 502 only during deployments? A: The process is killed without draining; add graceful shutdown (Q-PROD-28) and readiness checks.
- Q: 504 on one slow endpoint? A: Make it asynchronous (202 and a job) or raise the timeout only if truly needed.

---

## Q-PROD-06 -- CPU at 100 percent

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** One Node instance sits at 100 percent CPU and latency is terrible. What now?

**Interview answer:** Because JS runs on one thread, one core at 100 percent usually means the main thread is saturated by CPU work. I capture a CPU profile or flame graph under load to find the hot function. Typical culprits: synchronous crypto or compression, huge `JSON.stringify`/`parse`, regex backtracking (ReDoS), big in-memory sorts or loops, template rendering, or an infinite loop; also GC pressure from allocation-heavy code. Mitigate by scaling out or restarting, then fix the hotspot: optimize, add pagination or caching, move work to workers or queues, and fix regexes. Verify with a load test.

**Hinglish explanation:** Ek core 100% matlab main thread pura vyast. Flame graph se dekho kaun sa function sabse zyada time le raha hai. Aksar ek heavy loop, bada JSON ya bure regex. Pehle mitigate (instances badhao), phir asli function fix karo.

**Follow-ups:**
- Q: CPU is high only for a few seconds periodically? A: Look at cron jobs, cache refreshes, or GC cycles.
- Q: Multiple cores free but one pegged? A: The app is not clustered or load is unevenly distributed; run more processes.

---

## Q-PROD-07 -- Whole server hangs but the process is alive

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** The process is running but no request gets a response, including the health check. What could cause that?

**Interview answer:** If even a trivial health route hangs, the event loop is blocked or the process is stuck at a lower level. Causes: a synchronous infinite or very long loop, catastrophic regex, a huge synchronous operation, a deadlock-like wait on a native call, thread pool starvation affecting file or DNS operations (the health check itself may not use it but app routes do), or the process being frozen by memory pressure (swapping or GC thrash near the heap limit). I capture a diagnostic: send `SIGUSR1` to start the inspector (or use a pre-enabled one), take a CPU profile, or use `node --report` diagnostic reports; check CPU, memory, GC logs; then identify the blocking code from the stack. Meanwhile, the supervisor restarts it by liveness probe.

**Hinglish explanation:** Health check bhi nahi chal raha matlab Node ka loop hi atka hua hai. Ya to koi sync loop/regex, ya memory itni bhar gayi ki GC hi chalta rehta hai. Process ka stack dekhne ke liye inspector ya diagnostic report lo.

**Example:**

```bash
node --report-on-signal --report-signal=SIGUSR2 server.js   # then: kill -USR2 <pid>
# produces a JSON diagnostic report with JS and native stacks, heap stats, handles
```

**Follow-ups:**
- Q: How do you tell blocked loop from busy DB? A: A blocked loop stops all routes including `/healthz`; a busy DB affects only DB-backed routes.

---

## Q-PROD-08 -- Deadlocks in production

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** Logs show `ER_LOCK_DEADLOCK (1213)` errors during peak traffic. What is happening and what do you do?

**Interview answer:** A deadlock happens when two transactions each hold a lock the other needs; InnoDB detects the cycle and rolls back one transaction with error 1213. It is normal in busy systems, so the application must retry the failed transaction. To reduce frequency: keep transactions short, access rows in a consistent order (for example always lock lower account id first), avoid user interaction or network calls inside transactions, use appropriate indexes so fewer rows are locked, and use the lowest isolation level that is correct. I diagnose with `SHOW ENGINE INNODB STATUS` (the latest detected deadlock section) and identify the conflicting statements.

**Hinglish explanation:** Do log ek doosre ka darwaza kholne ka intezaar kar rahe hain, dono atak gaye. MySQL ek ko hata deta hai (error 1213). Tumhara code us transaction ko dobara chalaye. Rokne ka tarika: hamesha same order me rows lock karo (pehle chhota id, phir bada).

**Example:**

```js
export async function withRetry(fn, { retries = 3 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err.code === 'ER_LOCK_DEADLOCK' || err.errno === 1213;
      if (!retryable || attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 50 * 2 ** attempt + Math.random() * 50));
    }
  }
}

// transfer: lock in a consistent order to avoid deadlocks
export async function transfer(pool, from, to, amount) {
  const [first, second] = from < to ? [from, to] : [to, from];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('SELECT id FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE', [first, second]);
    const [r] = await conn.execute('UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?', [amount, from, amount]);
    if (r.affectedRows !== 1) throw new Error('Insufficient funds');
    await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, to]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
```

**Follow-ups:**
- Q: Deadlock vs lock wait timeout (1205)? A: Deadlock is a detected cycle and fails immediately; lock wait timeout means waiting too long without a cycle (a long transaction elsewhere).
- Q: Is retrying safe? A: Yes if the whole transaction is retried and has no external side effects; keep side effects (emails, API calls) outside or after commit.

---

## Q-PROD-09 -- A query that was fast is now slow as data grew

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** An endpoint that worked fine for a year is slow now. The code did not change. What happened?

**Interview answer:** Most likely the data volume crossed a threshold where a query that was acceptable on small tables (full scan, filesort, missing or non-selective index, unbounded `COUNT(*)`, offset pagination) is now expensive. The optimizer may also have changed its plan because table statistics changed. I find the query from the slow query log or APM, run `EXPLAIN ANALYZE`, look for full scans, filesorts, temporary tables, and huge examined-rows counts compared with returned rows, then add or adjust indexes, rewrite the query (keyset pagination, avoid functions on indexed columns, select needed columns), or archive and partition old data. I verify with the new plan and monitor.

**Hinglish explanation:** 1000 rows par full scan pata hi nahi chalta, 10 million rows par 5 second. Code nahi badla par data badh gaya. Slow query log pakdo, EXPLAIN dekho, index lagao.

**Example:**

```sql
-- find rows examined vs returned
EXPLAIN ANALYZE
SELECT id, total FROM orders WHERE status = 'paid' AND created_at >= '2026-01-01' ORDER BY created_at DESC LIMIT 50;

ANALYZE TABLE orders;  -- refresh optimizer statistics if the plan looks wrong
```

**Follow-ups:**
- Q: Index exists but unused? A: Low selectivity, function on the column, type mismatch (string vs number), stale statistics, or an optimizer choice; check `EXPLAIN`.
- Q: How do you prevent surprises? A: Load-test with production-sized data and alert on slow query counts.

---

## Q-PROD-10 -- Queue backlog growing and jobs stuck

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Your background job queue (emails, invoices) keeps growing and some jobs are stuck. How do you investigate?

**Interview answer:** I compare the arrival rate with the processing rate: if producers outpace consumers, I scale workers or raise concurrency; if processing slowed, I look for a slow dependency, a slow query in the job, or a poison job that retries forever and blocks capacity. I check worker health (crashed, no heartbeat, stalled jobs), Redis health and memory (evictions can drop jobs), failure counts, and retry/backoff settings. For stuck jobs I check lock/visibility timeouts that are shorter than the job duration (the job gets redelivered while still running, causing duplicates), and move repeatedly failing jobs to a dead-letter queue. I also make sure jobs are idempotent, set sensible concurrency per dependency, and alert on queue depth and oldest job age.

**Hinglish explanation:** Queue ek line hai: agar log line me tezi se aa rahe hain aur counter slow hai to line lambi hogi. Ya counter par ek "poison" customer khada hai jo hat hi nahi raha (job baar-baar fail). Ya worker mar gaya. Metrics dekho: kitne aa rahe, kitne nikal rahe, sabse purana job kitna purana.

**Example (BullMQ worker with safe settings):**

```js
import { Worker } from 'bullmq';

const worker = new Worker('invoices', processInvoice, {
  connection,
  concurrency: 5,
  lockDuration: 60_000, // must exceed typical job time or it will be treated as stalled
});

worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'job failed'));
worker.on('stalled', (jobId) => logger.warn({ jobId }, 'job stalled'));
```

**Follow-ups:**
- Q: What is a dead-letter queue? A: A holding queue for jobs that exhausted retries so they do not block others and can be inspected or replayed.
- Q: Why jobs run twice sometimes? A: At-least-once delivery plus stalled-job redelivery; make handlers idempotent.

---

## Q-PROD-11 -- Redis goes down: cascading failure

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** Redis (cache, sessions, rate limiter) goes down and the whole API starts failing or slowing down. How should the system behave and what do you do?

**Interview answer:** Redis should be treated as an optimization for caches, so on failure the app should degrade rather than die: catch cache errors and fall back to the database, with short Redis command timeouts and no unbounded reconnect queueing that stalls requests. But falling back means a sudden load on the database, so protect it with a circuit breaker, request coalescing, and possibly load shedding. For rate limiting, decide fail-open (allow) or fail-closed (block) per endpoint: login endpoints may fail closed or use a local in-memory fallback; public reads may fail open. If Redis stores sessions, an outage logs users out, so use a replicated, highly available Redis (sentinel/cluster/managed) and monitor it. During the incident I restore Redis, and then warm caches gradually to avoid a stampede.

**Hinglish explanation:** Cache ka kaam speed badhana hai, zindagi nahi. Cache gir jaaye to app DB se kaam chalaye. Par DB par achanak bojh aayega, isliye usko protect karo. Rate limiter ka decision lo: Redis na ho to sab allow karein ya sab block? Login par shayad block, public GET par shayad allow.

**Example:**

```js
const redis = createClient({
  url: process.env.REDIS_URL,
  socket: { connectTimeout: 1000, reconnectStrategy: (n) => Math.min(n * 100, 3000) },
  disableOfflineQueue: true, // fail fast instead of queueing commands while disconnected
});
redis.on('error', (e) => logger.error({ err: e }, 'redis error'));

export async function cacheGet(key) {
  try {
    return await redis.get(key);
  } catch {
    return null; // treat as a miss; caller falls back to the DB
  }
}
```

**Follow-ups:**
- Q: Fail-open vs fail-closed? A: Fail-open favors availability; fail-closed favors protection. Choose per endpoint risk.
- Q: Redis eviction policy for caches? A: `allkeys-lru` for pure caches; do not use eviction for job queues or primary data.

---

## Q-PROD-12 -- Cache stampede after a deploy or restart

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** After every deploy or cache flush, the database CPU spikes and the API slows for several minutes. Why?

**Interview answer:** The cache is cold, so every request misses and goes to the database at once; popular keys are rebuilt by many concurrent requests (stampede). Fixes: in-process and Redis-lock request coalescing so one request rebuilds a key, pre-warming hot keys before shifting traffic, rolling deploys instead of restarting all instances at once, TTL jitter, serving stale data while refreshing in the background, and keeping the cache external (Redis) rather than per-process memory so a deploy does not empty it. I also rate-limit or shed load on expensive endpoints during warm-up.

**Hinglish explanation:** Deploy ke baad cache khaali, to sabki requests DB par. Dawai: sirf ek request DB se bhare, baaki wait karein; important keys deploy se pehle garam kar lo; saare servers ek saath restart mat karo (rolling).

**Follow-ups:**
- Q: In-memory cache per instance and rolling deploy? A: Each new instance starts cold; use shared Redis for hot data.

---

## Q-PROD-13 -- Retry storms after an outage

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** A downstream service recovers from an outage but immediately goes down again under load. What is happening?

**Interview answer:** A retry storm (thundering herd): when the dependency recovers, all clients retry at once, often multiplied by several retry layers (client, gateway, service, SDK), producing more load than normal and knocking it over again. Prevention: exponential backoff with jitter, a retry budget or cap, circuit breakers so clients stop calling an unhealthy service, retries at only one layer, honoring `Retry-After`, load shedding at the server, and gradual ramp-up after recovery.

**Hinglish explanation:** Sab log ek hi second par dobara try karte hain, to server phir se gir jaata hai. Retry ke beech random delay (jitter) rakho aur delay badhate jao (exponential). Aur teen jagah retry mat lagao -- 3 x 3 x 3 = 27 guna load.

**Example:**

```js
export async function retry(fn, { retries = 4, baseMs = 200, maxMs = 5000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const exp = Math.min(maxMs, baseMs * 2 ** attempt);
      const delay = Math.random() * exp; // "full jitter"
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
const isRetryable = (e) => ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].includes(e.code) || e.status >= 500 || e.status === 429;
```

**Follow-ups:**
- Q: Which requests are safe to retry? A: Idempotent ones (GET, PUT, DELETE), or POST with an idempotency key.

---

## Q-PROD-14 -- A bad deploy: rollback and safe release strategies

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** A release breaks production. How do you respond, and how do you make releases safer?

**Interview answer:** I mitigate first: roll back to the last known good version (or turn off the feature flag), confirm recovery from metrics, then investigate with logs and the diff. Rollback is easy only if the change is reversible, so database changes must be backward compatible: use the expand-and-contract pattern (add nullable column or new table, deploy code that handles both, backfill, then remove old structures later). To make releases safer: automated tests and CI gates, staging, rolling or blue-green or canary deployment with health checks, feature flags, versioned Docker images, quick rollback tooling, and post-deploy monitoring on error rate and latency.

**Hinglish explanation:** Pehle service wapas chalao (rollback), phir sochna ki kya galat hua. Rollback tabhi aasan jab DB badlav purane code ke saath bhi chale. Isliye column drop ya rename ek saath mat karo; pehle naya add karo, dono code chalne do, phir purana hatao.

**Follow-ups:**
- Q: Blue-green vs canary? A: Blue-green switches all traffic between two full environments; canary sends a small percentage to the new version first and increases gradually.
- Q: Can you always roll back? A: Not if the release made irreversible data changes; plan migrations accordingly.

---

## Q-PROD-15 -- Safe database migrations on large tables

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** An `ALTER TABLE` on a 200-million-row table caused downtime. How do you migrate large tables safely?

**Interview answer:** Some alterations rebuild the table or take metadata locks that block writes, and a long-running transaction can make the ALTER wait while queueing everything behind it. In MySQL 8, many operations support `ALGORITHM=INSTANT` or `INPLACE` with `LOCK=NONE` (for example adding a column at the end), so I specify the algorithm explicitly so the statement fails rather than silently taking a heavy lock. For others, I use online schema change tools (`gh-ost`, `pt-online-schema-change`) that copy data in the background and swap tables. I also use expand-and-contract, backfill in small batches with pauses, run during low traffic, set lock wait timeouts, test on a production-sized copy, and keep a rollback plan.

**Hinglish explanation:** Bade table par seedha ALTER karna dangerous: table lock ho sakta hai aur sab queries peeche line me lag jaati hain. Specify karo `ALGORITHM=INSTANT` -- agar MySQL instant nahi kar sakta to error dega aur tumhe pata chal jayega, silently lock nahi karega. Backfill chhote batches me karo.

**Example:**

```sql
-- fails fast if it cannot be done instantly, instead of locking the table
ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(32) NULL, ALGORITHM=INSTANT;

-- batched backfill (run from a script in a loop until 0 rows affected)
UPDATE orders SET coupon_code = 'NONE' WHERE coupon_code IS NULL AND id BETWEEN 1 AND 5000;
```

**Follow-ups:**
- Q: Why can a quick ALTER still hang? A: It needs a metadata lock and waits for open transactions on that table; new queries then queue behind the waiting ALTER.

---

## Q-PROD-16 -- Third-party API is failing or timing out

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** A payment, SMS, or email provider starts timing out. How should your system behave?

**Interview answer:** Never let a third party's failure hang or crash your service. Use explicit timeouts, limited retries with backoff and jitter for idempotent calls, circuit breakers to fail fast during an outage, and bulkheads so it cannot consume all your capacity. Move non-critical calls (email, SMS, analytics) to background jobs so the user flow is unaffected, and for critical flows return a clear, honest status to the user (for example "payment pending") plus reconciliation to resolve unknown outcomes. If possible, add a fallback provider. Monitor provider latency and error rates, and alert.

**Hinglish explanation:** Dusre ki galti se apni service mat girne do. Timeout lagao, retry limit me, fast fail, aur jo kaam abhi zaroori nahi (email) use queue me daalo. Payment me "unknown" status ho sakta hai -- uske liye baad me reconcile karna padta hai.

**Follow-ups:**
- Q: Timeout happened on a charge: did it succeed? A: Unknown; query the gateway by idempotency key or wait for the webhook; never blindly retry without an idempotency key.

---

## Q-PROD-17 -- Webhooks delivered twice or out of order

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** Your payment webhook handler sometimes processes the same event twice or receives events out of order. How do you make it robust?

**Interview answer:** Webhooks are delivered at least once and ordering is not guaranteed, so the handler must be idempotent and order-tolerant. Verify the signature first. Store the provider's `event.id` with a unique constraint and ignore duplicates; make state transitions conditional and monotonic (only move forward in a state machine, for example never from `paid` back to `pending`); when ordering matters, fetch the latest state from the provider API or compare event timestamps/versions. Respond quickly with 2xx after durable receipt (persist the event, process asynchronously via a queue) because slow handlers cause provider retries. Reconcile periodically to catch missed events.

**Hinglish explanation:** Provider bolta hai "main kam se kam ek baar bhejunga" -- yani do baar bhi aa sakta hai, aur "refund" "payment success" se pehle bhi pahunch sakta hai. Isliye event id DB me unique rakho, state machine me peeche mat jao, aur jaldi 200 bhejo.

**Example:**

```js
app.post('/webhooks/pay', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!verifySignature(req)) return res.sendStatus(401);
  const event = JSON.parse(req.body.toString('utf8'));
  try {
    await pool.execute('INSERT INTO webhook_events (event_id, type, payload) VALUES (?, ?, ?)', [event.id, event.type, req.body.toString('utf8')]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.sendStatus(200); // duplicate: already received
    throw e;
  }
  await queue.add('process-webhook', { eventId: event.id }, { jobId: event.id });
  res.sendStatus(200);
});
```

**Follow-ups:**
- Q: What status should you return on processing failure? A: If you have not durably stored the event, return 5xx so the provider retries; once stored, return 200 and handle failures internally.

---

## Q-PROD-18 -- Inconsistent data after partial failure

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** An order was created and the customer was charged, but the order row is missing "paid" status because the app crashed in between. How do you prevent and repair this?

**Interview answer:** This is a partial-failure problem: multiple steps across systems (database and payment gateway) cannot be one atomic transaction. For steps within one database, use a transaction. For cross-system steps, design for recoverability: persist intent first (order in `pending`, payment attempt with idempotency key), call the external system, then record the result with a conditional update; a reconciliation job or webhook finalizes states that were left pending by crashes. Use the outbox pattern for publishing events reliably (write the event in the same DB transaction, a relay publishes it), and sagas with compensating actions (refund/cancel) for multi-service workflows. Add alerts on records stuck in intermediate states for too long.

**Hinglish explanation:** DB aur payment gateway ko ek saath "all or nothing" nahi kar sakte. Isliye pehle apne DB me likho "pending", phir gateway call, phir result likho. Beech me crash ho jaaye to ek background job pending records ko gateway se poochkar theek kar de. Alert bhi lagao: "30 min se pending order".

**Follow-ups:**
- Q: Why not use a distributed transaction (2PC)? A: Most third parties do not support it, it hurts availability and complexity; sagas plus idempotency are the practical approach.

---

## Q-PROD-19 -- Users randomly logged out after scaling to multiple instances

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** After adding a second server, users get logged out randomly. Why?

**Interview answer:** Authentication state is not shared between instances. Typical causes: sessions stored in each process's memory (the default `MemoryStore`), so a request landing on another instance has no session; different `JWT_SECRET` or session secret values per instance or per environment; cookies not honored because `trust proxy` is missing (secure cookies not set behind HTTPS termination); or a load balancer without sticky sessions combined with in-memory state. Fixes: store sessions in Redis/DB, use identical secrets via a secrets manager, configure `trust proxy`, and keep services stateless.

**Hinglish explanation:** Server A ki memory me tumhara session hai. Agla request server B par gaya to B ko tum jaante hi nahi. Isliye session Redis me rakho, ya JWT use karo jo kisi bhi server par verify ho jaye -- par secret sabhi servers par same hona chahiye.

**Follow-ups:**
- Q: Sticky sessions as a fix? A: A workaround that reduces balance and fails when an instance dies; prefer shared storage.

---

## Q-PROD-20 -- CORS or cookie issues only in production

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Login works locally but in production the browser blocks requests (CORS) or the cookie is not stored. What do you check?

**Interview answer:** Compare origins and cookie attributes. For CORS: the exact production frontend origin must be in the allow-list (scheme, host, and port), `credentials: true` requires a specific origin not `*`, and the frontend must send `credentials: 'include'`; preflight (`OPTIONS`) must succeed and not be blocked by auth middleware or the proxy; allowed headers and methods must include what the client sends; and error responses must also carry CORS headers. For cookies: `Secure` requires HTTPS and `trust proxy` behind a TLS-terminating proxy; `SameSite=None` is required for cross-site cookies and must be combined with `Secure`; the cookie `Domain`/`Path` must match; and third-party cookie blocking in browsers can affect cross-site setups, so prefer same-site subdomains or a proxy under one domain.

**Hinglish explanation:** Local me frontend `localhost:5173` aur backend `localhost:3000` -- same-site. Production me `app.site.com` aur `api.other.com` -- cross-site, to cookie par SameSite aur Secure ke rules lagte hain. Ye frontend dev ke liye familiar hoga: `fetch(..., { credentials: 'include' })` aur server me origin explicit, `*` nahi.

**Follow-ups:**
- Q: Simplest robust setup? A: Serve frontend and API under the same site (for example `app.example.com` and `api.example.com`, or a reverse proxy path `/api`), with `SameSite=Lax` cookies.

---

## Q-PROD-21 -- Disk is full

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** The server stops working and the disk is 100 percent full. What are the likely causes and the fix?

**Interview answer:** Typical culprits: unrotated log files, uploaded files stored locally, temp files not cleaned, core dumps or heap snapshots, and database binary logs or slow query logs. I find large directories (`df -h`, `du -sh /* | sort -h`), free space safely (rotate or compress logs, remove old temp files), restore service, and then prevent recurrence: log to stdout and let the platform manage logs, use `logrotate` with size and age limits, store uploads in object storage, set retention policies, and alert on disk usage at 70-80 percent rather than at 100.

**Hinglish explanation:** Disk bharne ka sabse common kaaran log files. App ke andar file me logging karna aur rotate na karna. Docker me stdout par log karo, aur disk usage ka alert 80% par lagao.

**Follow-ups:**
- Q: Why did the app crash and not just error? A: Writes fail (`ENOSPC`); databases and loggers can crash or corrupt on a full disk.

---

## Q-PROD-22 -- Service crash-loops after deployment

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** After a deploy the process keeps restarting. How do you debug it?

**Interview answer:** I read the logs of the failed start (PM2 logs, `docker logs`, orchestrator events) for the first error. Common causes: missing or wrong environment variables or secrets, failing database connection (wrong host, credentials, network rules, migrations not run), port already in use (`EADDRINUSE`), a syntax or import error (ESM versus CommonJS mismatch, missing dependency, case-sensitive file name), an unhandled exception during startup, out-of-memory kill, or failing health checks that make the orchestrator kill a healthy-but-slow-starting container. I reproduce locally with the same image and environment, fix, and add startup config validation that fails fast with a clear message. If users are affected, I roll back first.

**Hinglish explanation:** Restart loop me sabse pehli error line dhoondo. 80% cases: env variable missing, DB se connect nahi hua, ya import path galat. Health check jaldi fail hota ho to slow start wala app bhi baar-baar maara jaata hai -- `startupProbe`/initial delay set karo.

**Follow-ups:**
- Q: How do you see an OOM kill? A: `docker inspect` shows `OOMKilled: true`; `dmesg` shows the kernel OOM killer; exit code 137.
- Q: Crash loop backoff? A: Orchestrators delay restarts progressively; fix the cause, do not just wait.

---

## Q-PROD-23 -- ECONNRESET, EMFILE, EADDRINUSE and similar errors

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** What do `ECONNRESET`, `ETIMEDOUT`, `EMFILE`, and `EADDRINUSE` mean, and how do you respond to each?

**Interview answer:** `ECONNRESET`: the other side closed the connection abruptly (server crashed, proxy idle timeout, keep-alive mismatch, client aborted); handle by retrying idempotent requests and aligning keep-alive timeouts. `ETIMEDOUT`: no response within the OS or configured timeout; add proper timeouts, check network rules or an unhealthy dependency. `EMFILE` ("too many open files"): the process hit the file-descriptor limit, usually from leaked sockets or files, or a very high concurrency; fix leaks (close streams, reuse connections, limit concurrency) and raise `ulimit -n` if justified. `EADDRINUSE`: the port is already taken, often by a previous instance still running or two processes configured identically; stop the old process or change the port. `ENOTFOUND`/`EAI_AGAIN`: DNS failures, which also use the thread pool for `dns.lookup`.

**Hinglish explanation:** Ye error codes system ki bhasha hain. ECONNRESET = samne wale ne phone kaat diya. ETIMEDOUT = kisi ne uthaya hi nahi. EMFILE = tumne itni files/sockets khol rakhi hain ki OS ki limit khatam. EADDRINUSE = port pehle se kisi aur ke paas hai.

**Example:**

```js
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal({ port: PORT }, 'port already in use');
    process.exit(1);
  }
  throw err;
});
```

**Follow-ups:**
- Q: Where can EMFILE come from in Node? A: Opening thousands of files or sockets concurrently (for example `Promise.all` over a huge list) without limits.

---

## Q-PROD-24 -- Rate limiter blocks legitimate users (everyone looks like one IP)

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** After adding rate limiting, many different users get 429 errors and logs show the same IP for everyone. Why?

**Interview answer:** The app is behind a reverse proxy or load balancer, so `req.ip` is the proxy's address, and all users share one rate-limit bucket. The fix is to configure Express `trust proxy` with the correct number of hops (or the proxy's address) so `req.ip` is derived from `X-Forwarded-For`. Be careful not to trust the header blindly (`trust proxy: true`) when the app is directly reachable, because clients can spoof it and evade limits. Where possible also key limits by authenticated user id or API key, and use a shared store like Redis for multi-instance consistency.

**Hinglish explanation:** Load balancer ke peeche tumhe sabka IP "10.0.0.5" dikhta hai (balancer ka). Isliye 1000 users ek hi bucket me aa gaye. `app.set('trust proxy', 1)` se Express asli client IP `X-Forwarded-For` se nikalta hai. Par bina soche `true` mat karo, warna attacker header jhootha bhej dega.

**Example:**

```js
app.set('trust proxy', 1); // exactly one trusted proxy hop in front of the app
const key = (req) => req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`;
```

**Follow-ups:**
- Q: Why not trust all? A: Spoofed `X-Forwarded-For` would let an attacker choose their own "IP" and bypass the limiter.

---

## Q-PROD-25 -- A secret or customer data leaked: security incident response

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** A developer accidentally committed an AWS key / database password to a public repo. What do you do?

**Interview answer:** Treat it as compromised immediately: revoke or rotate the credential first (before cleaning the repo), because bots scrape public repositories within minutes. Then determine exposure: review access logs and cloud audit logs (CloudTrail) for use of the key, check for unauthorized resources or data access, and assess what data could have been reached. Remove the secret from the repository and history (and understand that clones and forks may retain it, so rotation is the real fix), notify stakeholders per policy and legal requirements if customer data was involved, and write a post-incident review. Prevent recurrence: secrets managers, pre-commit and CI secret scanning, least-privilege and short-lived credentials, and separate keys per environment.

**Hinglish explanation:** Pehle key badlo (rotate/revoke), phir repo saaf karo. Git history se hata dena kaafi nahi, kyunki kisi ne already copy kar liya hoga. Phir logs check karo ki kisi ne use to nahi kiya. Aage ke liye secret scanning aur chhote permissions.

**Follow-ups:**
- Q: Why rotate before deleting the commit? A: The secret may already be copied; deletion does not un-leak it.

---

## Q-PROD-26 -- Incident response process and post-mortems

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you handle a production incident from start to finish?

**Interview answer:** Detect (alerts, user reports), then acknowledge and assign an incident lead. Assess severity and impact quickly. Mitigate first: rollback, feature flag off, scale out, failover, or traffic shedding, because restoring service beats finding the perfect fix. Communicate status regularly to stakeholders. Investigate with logs, metrics, and traces, using hypotheses and recording a timeline. After recovery, run a blameless post-mortem covering impact, timeline, root cause(s) (including contributing factors), what went well and badly, and action items with owners (monitoring, tests, runbooks, design changes). The goal is learning and preventing repeat incidents, not blame.

**Hinglish explanation:** Interviewer ye sunna chahta hai ki tum panic nahi karte aur order jaante ho: pehle service wapas laao, phir root cause. Aur baad me "kiski galti" nahi, "system me kya sudhaaren" -- ye blameless post-mortem hai.

**Follow-ups:**
- Q: What goes in a runbook? A: Symptoms, dashboards, common causes, step-by-step mitigation, escalation contacts.
- Q: How do you reduce time to detect? A: Alerts on symptoms users feel (error rate, latency, saturation), not only on causes.

---

## Q-PROD-27 -- Timezone and date bugs in production

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Reports show wrong dates or "yesterday's" data for some users after deployment to a server in a different region. What is going on?

**Interview answer:** The server, database session, and clients are using different time zones, or dates are stored as local time strings. Best practice: store timestamps in UTC (MySQL `TIMESTAMP` is stored as UTC and converted using the session time zone; `DATETIME` has no zone), send ISO 8601 strings with a `Z` or offset in APIs, keep the server and DB in UTC, convert to the user's zone only at the display layer, and be explicit about `mysql2`'s `timezone` option. For "day" boundaries (daily reports), define the business time zone explicitly and compute ranges with it. Avoid parsing ambiguous date strings with `new Date('2026-03-01')`, which is treated as UTC, versus `'2026-03-01 00:00:00'`, which is local time.

**Hinglish explanation:** Server America me, user India me, DB UTC me -- agar sab alag samajh rahe hain to "aaj" ka matlab alag ho jaata hai. Rule: andar UTC, bahar user ki timezone. API me hamesha ISO format `2026-03-01T10:00:00Z`.

**Example:**

```js
const pool = mysql.createPool({ uri: process.env.DATABASE_URL, timezone: 'Z' }); // treat dates as UTC
const iso = new Date().toISOString(); // 2026-03-01T10:00:00.000Z
```

**Follow-ups:**
- Q: Daylight saving traps? A: Use libraries with IANA time zones for conversions; never add 24 hours to represent "next day".

---

## Q-PROD-28 -- Dropping requests during deploys: graceful shutdown

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Each deployment causes a few failed requests. How do you implement graceful shutdown?

**Interview answer:** On `SIGTERM` the process should stop accepting new connections, let in-flight requests finish within a deadline, close resources (HTTP server, database pool, Redis, queue workers), and then exit. Also flip the readiness probe to failing first so the load balancer stops sending new traffic before the process stops, and keep a short delay for that to propagate. A hard timeout forces exit if shutdown hangs, so the orchestrator is not blocked. Idle keep-alive connections should be closed (`server.closeIdleConnections()` in Node 18.2+; `server.close()` also closes idle connections in Node 19+).

**Hinglish explanation:** Deploy me purana process bas "kill" mat hone do. Pehle bolo "naye customer mat bhejo" (readiness fail), jo chal raha hai usko khatam hone do, connections band karo, phir exit. Warna beech wale requests fail honge aur user ko 502 dikhega.

**Example:**

```js
import http from 'node:http';
import { app } from './app.js';
import { pool } from './db.js';

const server = http.createServer(app);
let shuttingDown = false;
app.get('/readyz', (req, res) => res.sendStatus(shuttingDown ? 503 : 200));
server.listen(3000);

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, draining`);
  const force = setTimeout(() => process.exit(1), 25_000);
  force.unref();
  await new Promise((r) => setTimeout(r, 5000));   // let the LB notice readiness failing
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  server.closeIdleConnections();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**Follow-ups:**
- Q: Kubernetes terminationGracePeriodSeconds? A: It must exceed your drain time; otherwise the pod is SIGKILLed.
- Q: Why does `server.close` not finish? A: Open keep-alive connections; close idle ones and enforce a deadline.

---

## Q-PROD-29 -- Overselling inventory (race condition)

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** During a flash sale, 120 orders were accepted for 100 items in stock. Why and how do you fix it?

**Interview answer:** The code read the stock, checked it in application memory, and then wrote the new value, so concurrent requests read the same stock before any write happened (lost update / check-then-act race). The fix is to make the check-and-decrement atomic in the database: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?` and check `affectedRows`; or lock the row with `SELECT ... FOR UPDATE` inside a transaction. Keep the transaction short, create the order in the same transaction, and add a `CHECK (stock >= 0)` constraint (enforced in MySQL 8.0.16+) as a safety net. For extreme hot items, consider Redis atomic decrement as a front gate, a queue to serialize purchases, or reservation with expiry.

**Hinglish explanation:** Dono ne dekha "stock 1 hai", dono ne khareed liya. Check aur update ke beech gap tha. Atomic SQL me check bhi update ke saath hota hai: `stock >= 1` jab tak true ho tab tak hi minus hoga. `affectedRows = 0` matlab sold out.

**Example:**

```js
export async function placeOrder(pool, userId, productId, qty) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [qty, productId, qty]
    );
    if (r.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'OUT_OF_STOCK' };
    }
    const [o] = await conn.execute('INSERT INTO orders (user_id, product_id, qty) VALUES (?, ?, ?)', [userId, productId, qty]);
    await conn.commit();
    return { ok: true, orderId: o.insertId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
```

```sql
ALTER TABLE products ADD CONSTRAINT chk_stock_nonneg CHECK (stock >= 0);
```

**Follow-ups:**
- Q: Optimistic vs pessimistic locking? A: Pessimistic (`FOR UPDATE`) blocks others while you work; optimistic uses a version column and retries on conflict. Choose by contention level.
- Q: Isolation level REPEATABLE READ prevents this? A: Not by itself for check-then-write in application code; you need atomic updates or locking reads.

---

## Q-PROD-30 -- Stale data after update (replica lag and cache)

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Users update their profile but still see old data for a few seconds or minutes. What could cause it?

**Interview answer:** Possible causes: reads served from a lagging read replica, a cache that was not invalidated after the write (or invalidated before the DB commit and refilled with the old value), a CDN or browser cache serving old responses, or client-side state not refreshed. I trace the read path to find which layer serves stale data. Fixes: read-your-writes by sending reads that follow a write to the primary, invalidate or update cache after the DB commit (and handle the race with a short TTL or versioned keys), set correct `Cache-Control` for user-specific responses, and return the updated resource in the write response so the client can update its state.

**Hinglish explanation:** Likhne wali jagah aur padhne wali jagah alag ho sakti hai: DB replica, Redis cache, CDN, browser. Har layer me purana data atak sakta hai. Pata karo kaun si layer purana de rahi hai: seedha primary DB se padho, phir cache, phir CDN check karo.

**Follow-ups:**
- Q: Invalidate cache before or after commit? A: After commit; otherwise a concurrent read can refill the cache with old data before the commit lands.

---

## Q-PROD-31 -- Cron job runs twice on multiple instances

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** After scaling to 3 instances, customers got the same daily email three times. Why and how do you fix it?

**Interview answer:** Each instance ran its own in-process scheduler (for example `node-cron`), so the job fired three times. Run scheduled work in exactly one place: a dedicated scheduler process or service, an external scheduler (Kubernetes CronJob, cloud scheduler) that enqueues a job, or use a distributed lock/leader election (for example a Redis lock with `SET key value NX PX`, or a DB row lock) so only one instance proceeds. The job itself should still be idempotent (record "daily email sent for date X for user Y" with a unique key) because locks can fail and jobs can be retried.

**Hinglish explanation:** Teen server, teen scheduler, teen baar mail. Ya to scheduler ek jagah chalao ya lock lo ("main kar raha hoon"). Aur job ko idempotent banao: DB me unique (user_id, date) rakho taaki dobara chale tab bhi mail ek hi jaaye.

**Example:**

```js
const got = await redis.set('lock:daily-email:2026-03-01', instanceId, { NX: true, PX: 10 * 60_000 });
if (got !== 'OK') return; // another instance owns this run
await runDailyEmailJob();
```

**Follow-ups:**
- Q: Is a Redis lock fully safe? A: Not against every failure (expiry during a long job, clock pauses); combine with idempotent processing.

---

## Q-PROD-32 -- Error rate jumped right after a release: what do you check first

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** An alert fires: 5xx rate went from 0.1 percent to 8 percent five minutes after a deploy. Your first moves?

**Interview answer:** Correlate with the deploy and decide quickly: if the spike lines up with the release and impact is significant, roll back (or disable the feature flag) first and investigate after. Meanwhile I look at the error breakdown by endpoint and status, sample stack traces from logs or error tracking (Sentry) with request ids, and check whether errors come from one new code path, a config or env change, a migration, or a dependency. I confirm recovery after rollback, then reproduce in staging, write a regression test, and add a canary or automated rollback on error-rate thresholds for future releases.

**Hinglish explanation:** Deploy ke 5 minute baad errors badhe to sabse pehla shak deploy par. Jaldi rollback, phir aaram se investigate. Logs me dekho kaun sa endpoint aur kaun si error. Future me canary release rakho taaki sirf 5% users effect hon.

**Follow-ups:**
- Q: What is the RED method? A: Rate, Errors, Duration -- the three request metrics to watch for each service.
- Q: What is an error budget? A: The allowed unreliability implied by an SLO; when it is spent, slow down releases and focus on reliability.

---

# END OF CATEGORY 9

---

# CATEGORY 10: BACKEND SYSTEM DESIGN

How to use this category: start with the simplest working design, then add complexity only when a requirement justifies it. For each major design say: requirements, API, data model, components, data flow, failure scenarios, trade-offs, and scaling options. System design answers are about reasoning aloud, so state assumptions and numbers.

---

## Q-SD-01 -- Design a rate limiter (algorithms and API)

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Design a rate limiter for an API. Compare the main algorithms.

**Interview answer:**
- Requirements: limit requests per client (user, API key, or IP) per time window, low overhead (a few ms at most), accurate enough, return `429` with `Retry-After`, work across multiple app instances, and be configurable per route and plan.
- Algorithms: **Fixed window** counts requests per window (simple, but allows a burst of 2x at window boundaries). **Sliding window log** stores request timestamps (accurate, memory heavy). **Sliding window counter** weights the previous and current window counts (good accuracy, low memory). **Token bucket** refills tokens at a steady rate up to a capacity, each request consumes a token (allows controlled bursts, widely used). **Leaky bucket** processes requests at a fixed rate through a queue (smooths traffic).
- Components: middleware (or API gateway) calling a shared store (Redis) with atomic operations; rules config; metrics.
- Failure scenarios: Redis down (choose fail-open or fail-closed per route), clock skew (use Redis time), hot keys.
- Trade-offs: accuracy versus memory versus complexity; centralized store gives global limits but adds a network hop; local in-memory limits are fast but per-instance only.
- Scaling: shard keys across Redis nodes, use local pre-checks plus periodic sync for very high QPS.

**Hinglish explanation:** Rate limiter ek gatekeeper hai: "ek user minute me max 100 requests". Fixed window me problem: 12:00:59 par 100 aur 12:01:00 par 100 -- do second me 200! Token bucket me ek balti hai jisme tokens dheere-dheere bharte hain; har request ek token leti hai; balti khaali to "429". Burst allow hota hai par average rate control me rehta hai. Multiple servers hon to counter Redis me rakho.

**Example (token bucket in a single Redis Lua script so check-and-update is atomic):**

```js
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const TOKEN_BUCKET = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_per_sec = tonumber(ARGV[2])
local now_ms = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
if tokens == nil then tokens = capacity; ts = now_ms end

local elapsed = math.max(0, now_ms - ts) / 1000
tokens = math.min(capacity, tokens + elapsed * refill_per_sec)

local allowed = 0
if tokens >= cost then tokens = tokens - cost; allowed = 1 end

redis.call('HSET', key, 'tokens', tokens, 'ts', now_ms)
redis.call('PEXPIRE', key, math.ceil(capacity / refill_per_sec * 1000) * 2)
return { allowed, math.floor(tokens) }
`;

export function rateLimit({ capacity = 20, refillPerSec = 5 } = {}) {
  return async (req, res, next) => {
    const id = req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`;
    try {
      const [allowed, remaining] = await redis.eval(TOKEN_BUCKET, {
        keys: [`rl:${id}`],
        arguments: [String(capacity), String(refillPerSec), String(Date.now()), '1'],
      });
      res.set('X-RateLimit-Remaining', String(remaining));
      if (!allowed) {
        res.set('Retry-After', String(Math.ceil(1 / refillPerSec)));
        return res.status(429).json({ error: 'Too many requests' });
      }
      next();
    } catch {
      next(); // fail-open on Redis errors; change to fail-closed for sensitive routes
    }
  };
}
```

**Follow-ups:**
- Q: Why a Lua script? A: Redis runs it atomically, so concurrent requests cannot interleave between reading and writing the bucket.
- Q: Where would you place the limiter? A: At the edge (API gateway/CDN) for coarse limits, and in the app for per-user or per-endpoint limits.
- Q: What do you return to the client? A: `429`, `Retry-After`, and rate-limit headers.
- Q: Different limits per plan? A: Store limits per key or plan in config and pass them to the script.

---

## Q-SD-02 -- Rate limiter at distributed scale

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** The rate limiter must handle 100,000 requests per second across many regions. What changes?

**Interview answer:** A single Redis hop per request becomes a bottleneck and adds latency. Options: shard rate-limit keys across a Redis Cluster by client id; use local in-process token buckets with periodic synchronization (each node gets a share of the global limit, accepting slight inaccuracy); enforce coarse limits at the CDN or gateway edge; and limit per region with a global soft cap. Accept approximate limiting at high scale, because strict global accuracy costs latency. Protect Redis with timeouts and fail-open, and monitor limiter latency itself, since a slow limiter slows every request.

**Hinglish explanation:** Har request par Redis ko call karna 1 lakh/sec par bhaari padega. Isliye har server ko local quota do aur kabhi-kabhi sync karo. Thoda sa galat (approximate) chalega, speed zyada zaroori hai.

**Follow-ups:**
- Q: Trade-off of local limits? A: Faster and resilient, but a client hitting many nodes can exceed the global limit slightly.
- Q: Limiter is down? A: Fail-open for most routes, but keep lightweight local limits as a safety net.

---

## Q-SD-03 -- How to approach a system design interview

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** How do you structure your answer to an open-ended design question?

**Interview answer:** I clarify requirements first (functional and non-functional: scale, latency, availability, consistency), state assumptions and rough numbers (users, requests per second, data size), then propose the simplest working design: API, data model, and core components. I walk through the main data flow end to end, then identify bottlenecks and failure points, and add scaling techniques only where justified: caching, indexing, replicas, queues, partitioning. I discuss trade-offs openly (consistency versus availability, cost versus complexity), and mention monitoring, security, and deployment. I keep checking with the interviewer so we go deeper where they care.

**Hinglish explanation:** Seedha "Kafka lagayenge, microservices banayenge" mat bolo. Pehle poocho kya chahiye, kitne users, kitna data. Phir simple version (ek app + ek DB) banao. Phir batao kahan toot sakta hai aur kaise fix karoge. Interviewer ko process dekhna hai.

**Follow-ups:**
- Q: Back-of-envelope example? A: See Q-SD-30.
- Q: What if you do not know a component? A: Say so, describe the problem it solves, and propose a simpler alternative.

---

## Q-SD-04 -- Design a URL shortener (core design)

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Design a URL shortening service like bit.ly.

**Interview answer:**
- Requirements: create a short link for a long URL, redirect quickly, optional custom alias and expiry, basic click analytics. Non-functional: very read-heavy (for example 100:1 read to write), low redirect latency, high availability, short codes unguessable enough and unique.
- API: `POST /api/links { url, alias?, expiresAt? }` returns `{ code, shortUrl }`; `GET /:code` returns `301`/`302` redirect with `Location`; `GET /api/links/:code/stats`.
- Schema: `links(code PK, long_url, user_id, created_at, expires_at, click_count)`; unique on `code`.
- Components: API servers (stateless), MySQL (or a key-value store) for links, Redis cache for hot codes, optional queue to record clicks asynchronously.
- Data flow: create -> validate URL, generate a unique code, insert, return. Redirect -> cache lookup, on miss read DB and populate cache, respond with redirect, emit click event.
- Code generation: encode an auto-increment id (or a distributed id generator) in base62 for guaranteed uniqueness (7 characters of base62 gives about 3.5 trillion codes), or random codes with a unique-constraint retry on collision.
- Failure scenarios: DB down (cache still serves hot links), collision on random codes (retry), abuse (rate limit creation, validate and block malicious URLs).
- Trade-offs: sequential ids are guessable (enumeration); random codes need collision handling; `301` is cached by browsers (fewer hits, no analytics) while `302` hits your server every time (analytics possible).
- Scaling: cache, read replicas, shard by code, CDN, and an ID-range allocator per app instance.

**Hinglish explanation:** Simple version: ek table jisme `code -> long_url`. Redirect ke time table se code dhundho aur browser ko redirect bhej do. Kyunki padhna bahut zyada hota hai, Redis cache lagao. Code banane ka asaan tarika: row ka numeric id lo aur base62 (a-z, A-Z, 0-9) me convert karo. Analytics ko request path me mat rakho; queue me daalo.

**Example:**

```js
import crypto from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export function toBase62(n) {
  let s = '';
  let x = BigInt(n);
  if (x === 0n) return ALPHABET[0];
  while (x > 0n) {
    s = ALPHABET[Number(x % 62n)] + s;
    x /= 62n;
  }
  return s;
}

// random-code approach with collision retry
export async function createLink(pool, longUrl) {
  for (let i = 0; i < 5; i++) {
    const code = toBase62(BigInt('0x' + crypto.randomBytes(5).toString('hex'))).slice(0, 7);
    try {
      await pool.execute('INSERT INTO links (code, long_url) VALUES (?, ?)', [code, longUrl]);
      return code;
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e; // retry on collision only
    }
  }
  throw new Error('Could not allocate a code');
}

// redirect
app.get('/:code', async (req, res) => {
  const cached = await redis.get(`link:${req.params.code}`);
  let url = cached;
  if (!url) {
    const [rows] = await pool.execute('SELECT long_url FROM links WHERE code = ? AND (expires_at IS NULL OR expires_at > NOW())', [req.params.code]);
    if (!rows[0]) return res.sendStatus(404);
    url = rows[0].long_url;
    await redis.set(`link:${req.params.code}`, url, { EX: 3600 });
  }
  res.redirect(302, url);
});
```

```sql
CREATE TABLE links (
  code VARCHAR(16) NOT NULL PRIMARY KEY,
  long_url VARCHAR(2048) NOT NULL,
  user_id BIGINT NULL,
  click_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL
) ENGINE=InnoDB;
```

**Follow-ups:**
- Q: 301 vs 302? A: 301 is permanent and cacheable by browsers, reducing load but hiding clicks; 302 is temporary and keeps clicks flowing through you.
- Q: Same long URL submitted twice? A: Either return the existing code (needs an index on a hash of the URL) or allow duplicates; depends on product needs.
- Q: Redirect open-redirect and malware risks? A: Validate schemes (`http`/`https` only), block known-bad domains, and rate limit creation.

---

## Q-SD-05 -- URL shortener: scaling and ID generation

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** The shortener now needs 10,000 redirects per second and billions of links. How do you scale it and generate unique ids across servers?

**Interview answer:** Reads dominate, so put a cache (Redis) in front and a CDN or edge cache for popular codes; the cache hit ratio should be very high. For storage, partition (shard) by hashing the code, or use a distributed key-value store; a single MySQL table with a primary key lookup scales a long way before sharding is necessary. For unique id generation without a central bottleneck: pre-allocate id ranges to each app instance from a counter service (each instance consumes its block locally), or use a Snowflake-style id (timestamp, machine id, sequence) encoded in base62. Record analytics asynchronously through a queue and aggregate. Add rate limiting on creation and expiry cleanup jobs.

**Hinglish explanation:** 10,000 redirects/sec me DB par seedha jaana mushkil, to cache ka hit ratio 95%+ rakho. ID banane ke liye har server ko ek block de do (jaise 1-1000, 1001-2000); wo apne block me se khud ids bana leta hai, central counter ko har baar nahi poochna padta.

**Follow-ups:**
- Q: What if a range-holding server dies? A: Unused ids in the block are simply skipped; uniqueness is preserved.
- Q: Cache eviction? A: LRU with TTL; popular links stay hot.

---

## Q-SD-06 -- Design a notification system

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Design a notification system sending email, SMS, and push notifications for events such as order shipped or OTP.

**Interview answer:**
- Requirements: multi-channel delivery, user preferences and opt-outs, templating, reliable delivery with retries, no duplicates, rate limits per provider, priority (OTP urgent versus marketing), delivery status tracking.
- API: internal `POST /notifications { userId, type, data, channels?, idempotencyKey }` (or consume events from other services); `GET /notifications/:id` for status; webhook endpoints for provider delivery receipts.
- Schema: `notifications(id, user_id, type, channel, payload, status, attempts, idempotency_key UNIQUE, created_at, sent_at)`, `user_preferences(user_id, channel, enabled)`, `templates(...)`.
- Components: producer services publish events, a notification service validates, checks preferences, renders templates, and enqueues one job per channel; separate queues per channel and priority; channel workers call providers (SES, Twilio, FCM) with retries and backoff; a dead-letter queue; a status store.
- Data flow: event -> notification service -> preference and dedupe check -> persist `pending` -> enqueue -> worker sends -> update `sent/failed` -> delivery webhook updates `delivered/bounced`.
- Failure scenarios: provider outage (retry, circuit breaker, fallback provider), duplicate events (idempotency key), worker crash mid-send (at-least-once, so dedupe at provider if supported), poison messages (DLQ).
- Trade-offs: at-least-once (possible duplicate) versus at-most-once (possible loss); OTP and security notifications need low latency and a priority queue; marketing can be batched and throttled.
- Scaling: scale workers per queue independently, partition by user id, batch sends, rate-limit per provider.

**Hinglish explanation:** Notification service apna chhota system hai: koi bhi service bolti hai "is user ko ye message bhejo". Service preferences dekhti hai, template banati hai, aur queue me daal deti hai. Alag workers email/SMS/push bhejte hain. Provider fail ho to retry. OTP ke liye alag fast queue, marketing ke liye alag slow queue taaki OTP kabhi marketing ke peeche na atke.

**Example:**

```js
// producer side: enqueue after deduplicating with a unique idempotency key
export async function notify(pool, queues, { userId, type, data }) {
  const key = `${type}:${data.entityId}:${userId}`;
  try {
    await pool.execute(
      "INSERT INTO notifications (user_id, type, payload, status, idempotency_key) VALUES (?, ?, ?, 'pending', ?)",
      [userId, type, JSON.stringify(data), key]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return; // already created
    throw e;
  }
  const [prefs] = await pool.execute('SELECT channel FROM user_preferences WHERE user_id = ? AND enabled = 1', [userId]);
  for (const { channel } of prefs) {
    await queues[channel].add('send', { userId, type, data, key }, { jobId: `${key}:${channel}`, attempts: 5, backoff: { type: 'exponential', delay: 2000 } });
  }
}
```

**Follow-ups:**
- Q: Ordering guarantees? A: Rarely required; where needed (status updates), include a version or timestamp and ignore older ones.
- Q: How to avoid spamming users? A: Per-user frequency caps, batching/digests, and preferences.

---

## Q-SD-07 -- Notification reliability: retries, DLQ, dedupe

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** How do you guarantee a notification is delivered but not sent twice?

**Interview answer:** True exactly-once delivery across systems is not achievable in general; the practical target is at-least-once delivery combined with idempotent processing to get an effectively-once outcome. Persist the notification before sending, use a unique idempotency key per notification-channel, retry failures with exponential backoff and jitter, move permanently failing messages to a dead-letter queue for investigation, and record provider message ids. For providers that support idempotency keys, send them; otherwise accept a small duplicate risk where the worker crashes after sending but before recording success, and mitigate by checking status before resend and keeping sending and recording close together. Track delivery receipts and alert on rising failure rates.

**Hinglish explanation:** "Bilkul ek hi baar" ki guarantee network me mushkil hai: send ho gaya par "ho gaya" likhne se pehle crash. Isliye "kam se kam ek baar" + "dobara aane par pehchan lo" (idempotency). Itna kaafi hota hai.

**Follow-ups:**
- Q: Poison message? A: A message that always fails; limit attempts and send it to a DLQ so it does not block the queue.

---

## Q-SD-08 -- Monolith vs modular monolith vs microservices

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** When would you choose a monolith versus microservices?

**Interview answer:** A monolith deploys everything as one unit: simple to develop, test, deploy, and debug, with in-process calls and ACID transactions across the whole domain. It becomes hard when teams and codebase grow and parts need independent scaling or release cycles. A modular monolith keeps one deployable but with strict internal module boundaries, which is a strong default for most teams. Microservices split by business capability with separate deployments and data stores: independent scaling and deployment and team autonomy, but at the price of network latency, partial failures, distributed data consistency (sagas instead of transactions), complex observability, and operational overhead. I would start with a modular monolith and extract a service only when there is a clear reason, such as different scaling needs, team ownership, or fault isolation.

**Hinglish explanation:** Microservices fashion nahi, ek trade-off hain. Chhoti team ke liye monolith best: ek deploy, ek DB, transactions aasan. Jab team badi ho ya ek hissa (jaise video processing) alag scale karna ho, tab alag service banao. "Modular monolith" = ek hi app par andar alag-alag saaf modules -- baad me nikalna aasan.

**Follow-ups:**
- Q: Biggest microservices pitfall? A: A distributed monolith: services too tightly coupled, deployed together, sharing a database.
- Q: How to extract a service safely? A: Identify a bounded context, put an API in front of it, move its data ownership, route traffic gradually (strangler pattern).

---

## Q-SD-09 -- Load balancing

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** What does a load balancer do and which algorithms exist?

**Interview answer:** A load balancer distributes incoming traffic across multiple instances to improve capacity and availability, performing health checks to remove unhealthy instances, and often terminating TLS. Layer 4 balancers route by IP and port (fast), layer 7 balancers route by HTTP details such as path, host, or headers (flexible, enabling path-based routing and header-based canaries). Algorithms: round robin, weighted round robin, least connections, IP hash (for stickiness), and least response time. Sticky sessions can be used, but stateless instances are preferred. High availability needs the balancer itself to be redundant (managed services such as ALB do this).

**Hinglish explanation:** Load balancer traffic police hai: aane wali requests ko alag-alag servers par baant deta hai aur jo server bimar hai use hata deta hai. Round robin = baari baari. Least connections = jisko kam kaam, usse do. Nginx, HAProxy, AWS ALB popular hain.

**Follow-ups:**
- Q: Why health checks matter? A: Without them traffic continues to a dead instance, producing errors.
- Q: Sticky sessions downside? A: Uneven load and lost sessions when an instance dies.

---

## Q-SD-10 -- Stateless services and horizontal scaling design

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How would you prepare a Node.js app to run on ten instances behind a load balancer?

**Interview answer:** Make it stateless and externalize shared concerns. Sessions or tokens in Redis or JWT, uploads to object storage, cache and rate limits in Redis, scheduled jobs in a single scheduler or guarded by locks, websocket fan-out through a pub/sub broker, configuration from environment variables, structured logs to stdout, health and readiness endpoints, graceful shutdown, and database connection budgets (instances times pool size within `max_connections`). Use containers and an orchestrator, rolling deployments, and autoscaling on CPU or request rate.

**Hinglish explanation:** Checklist: koi bhi cheez jo server ki apni memory ya disk par rakhi hai use bahar nikalo. Session -> Redis. Upload -> S3. Cron -> ek jagah. Logs -> stdout. Phir 1 ho ya 10 instance, farak nahi padta.

**Follow-ups:**
- Q: WebSockets with many instances? A: A client connects to one instance, so broadcasting needs a shared pub/sub (Redis pub/sub or a message broker).
- Q: What about in-memory caches? A: Fine for tiny, safe-to-be-stale data; otherwise use Redis.

---

## Q-SD-11 -- Caching layers and strategies

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Where can caching be applied in a backend system and what strategies exist?

**Interview answer:** Layers: browser cache, CDN, reverse proxy, application cache (Redis or in-process), and database caches (buffer pool, query cache removed in MySQL 8). Strategies: cache-aside (app manages cache, most common), read-through (cache loads on miss), write-through (write cache and DB together), write-behind (write cache first, persist asynchronously, risky), and refresh-ahead. Key concerns: what to cache (read-heavy, expensive, rarely changing), TTL and invalidation, stampede protection, memory limits with eviction policy (LRU), and consistency expectations. Never cache without defining acceptable staleness.

**Hinglish explanation:** Cache ek shortcut hai: mehnga kaam ek baar karo, baar-baar use karo. Par har cache ke saath sawaal aata hai: "purana data kitni der tak chalega?" Browser, CDN, Redis, in-process -- har layer ka apna kaam. Cache-aside sabse common (Q-PERF-11).

**Follow-ups:**
- Q: Query cache in MySQL 8? A: It was removed in 8.0; use application-level caching.
- Q: What should not be cached? A: Highly personalized or sensitive data on shared caches, and rapidly changing data requiring strict consistency.

---

## Q-SD-12 -- Scaling the database: indexes, replicas, partitioning, sharding

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** The database is the bottleneck. In what order would you scale it?

**Interview answer:** Start with the cheapest, highest-impact steps: fix slow queries and indexes, remove N+1 patterns, add connection pooling and caching, and scale up the instance. Next add read replicas for read-heavy load (accepting replication lag), and move analytics to replicas or a warehouse. Then consider table partitioning (for example by date) for very large tables and archive old data. Only when write volume or data size exceeds one primary's capability, consider sharding: splitting data across databases by a shard key (user id or tenant id) with a routing layer. Sharding is a last resort because it complicates cross-shard queries, transactions, joins, and resharding. Choose a shard key with even distribution and queries that mostly stay within a single shard.

**Hinglish explanation:** Pehle sasta fix: index, query, cache. Phir replicas. Phir partitioning. Sharding sabse aakhri, kyunki usme JOIN aur transactions bahut mushkil ho jaate hain. Interview me ye order batana important hai: "main seedha sharding nahi bolunga".

**Follow-ups:**
- Q: Partitioning vs sharding? A: Partitioning splits a table inside one database server; sharding splits data across multiple database servers.
- Q: Bad shard key? A: A key that concentrates traffic (hot shard), like a timestamp-based key for recent writes.
- Q: Replica lag handling? A: See Q-PERF-26.

---

## Q-SD-13 -- Message queues and asynchronous processing

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Why use a message queue? What are its guarantees and pitfalls?

**Interview answer:** A queue decouples producers from consumers: the API can accept work quickly and workers process it at their own pace, smoothing traffic spikes, isolating failures, and enabling retries and independent scaling. Typical uses: emails, image processing, report generation, webhooks, and integration events. Brokers include Redis-based (BullMQ), RabbitMQ, SQS, and Kafka (a distributed log, suited to high-throughput event streaming and replay). Guarantees are usually at-least-once delivery, so consumers must be idempotent. Pitfalls: poison messages (use DLQ), unbounded growth (monitor depth and age), ordering assumptions, visibility timeout shorter than the job time (duplicate processing), and losing messages if the broker is not durable. The client-facing pattern is "202 Accepted" with a status endpoint or webhook.

**Hinglish explanation:** Queue = tokri jisme kaam daal do aur worker baad me nikalke karta hai. Fayda: API tez rahegi, kaam fail ho to retry, traffic spike ho to tokri bhar jaati hai par server nahi girta. Nuksaan: "kaam abhi nahi hua" ke liye user ko status dikhana padega, aur duplicate kaam se bachna padega.

**Example:**

```js
// API: accept quickly
app.post('/reports', authenticate, async (req, res) => {
  const [r] = await pool.execute("INSERT INTO report_jobs (user_id, status) VALUES (?, 'queued')", [req.user.id]);
  await reportQueue.add('build', { jobId: r.insertId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  res.status(202).location(`/reports/${r.insertId}`).json({ id: r.insertId, status: 'queued' });
});
```

**Follow-ups:**
- Q: RabbitMQ vs Kafka? A: RabbitMQ is a broker with flexible routing and acknowledgements, good for task queues; Kafka is a durable partitioned log for high-throughput streams and replays.
- Q: Queue vs cron? A: Queues react to events and scale; cron runs on schedules (and should enqueue work rather than do it inline).

---

## Q-SD-14 -- Design a file upload system

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Design file uploads (profile pictures, documents, videos) for a web app.

**Interview answer:**
- Requirements: upload files up to some size, secure access, scalable storage, optional processing (thumbnails, virus scan), resumable uploads for large files, download via authorized links.
- API: `POST /files/uploads { filename, contentType, size }` returns `{ fileId, uploadUrl }` (a presigned URL); the client uploads directly to object storage (S3); then `POST /files/:id/complete`; `GET /files/:id` returns a short-lived signed download URL after an authorization check.
- Schema: `files(id, owner_id, storage_key, original_name, content_type, size, status[pending|uploaded|processed|rejected], created_at)`.
- Components: API server (issues presigned URLs, validates size and type, tracks metadata), object storage (S3-compatible, private bucket), optional event trigger on upload -> queue -> worker (thumbnail, virus scan), CDN for public assets.
- Data flow: client asks for upload URL -> API validates and records `pending` -> client uploads directly to storage -> storage event or client "complete" call -> worker validates (magic bytes, scan) and processes -> status `processed`.
- Failure scenarios: abandoned uploads (lifecycle rule deletes pending objects), partial/large uploads (multipart upload with retry per part), malware (scan before making available), wrong type (validate content, not only the extension).
- Trade-offs: direct-to-storage uploads keep large traffic off API servers and scale well but need careful validation and expiry; proxy-through-server is simpler but costs bandwidth and memory.
- Scaling: object storage scales by itself; processing workers scale on queue depth; CDN for downloads.

**Hinglish explanation:** Badi file ko apne Node server se mat guzaro. Server S3 se ek temporary "presigned URL" mangta hai aur client ko deta hai; client seedha S3 par upload karta hai. Server ka bojh kam, speed zyada. Baad me worker thumbnail ya virus scan karta hai. DB me sirf metadata (naam, size, owner, status).

**Example (presigned URL with AWS SDK v3):**

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ALLOWED = new Set(['image/png', 'image/jpeg', 'application/pdf']);
const MAX_BYTES = 10 * 1024 * 1024;

app.post('/files/uploads', authenticate, async (req, res) => {
  const { contentType, size } = req.body;
  if (!ALLOWED.has(contentType) || !(size > 0 && size <= MAX_BYTES)) {
    return res.status(400).json({ error: 'Invalid file type or size' });
  }
  const id = randomUUID();
  const key = `uploads/${req.user.id}/${id}`;
  await pool.execute("INSERT INTO files (id, owner_id, storage_key, content_type, size, status) VALUES (?, ?, ?, ?, ?, 'pending')", [id, req.user.id, key, contentType, size]);
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.BUCKET, Key: key, ContentType: contentType, ContentLength: size }), { expiresIn: 300 });
  res.status(201).json({ fileId: id, uploadUrl: url });
});
```

**Follow-ups:**
- Q: How do you serve private files? A: Authorize in the API, then redirect to or return a short-lived presigned GET URL.
- Q: Large video uploads? A: Multipart upload with part retries; process with transcoding workers.
- Q: Why not trust the extension? A: It is user-controlled; check magic bytes and scan.

---

## Q-SD-15 -- Design a REST API for a task management system

**Difficulty:** Basic | `[ESSENTIAL]`

**Question:** Design the REST API and schema for a Task Management app (users, projects, tasks). This is the shape of the project in `12_Project_Task_API.md`.

**Interview answer:**
- Requirements: users sign up and log in; create projects; create, assign, update, and delete tasks; filter and sort lists; roles (admin, member) with authorization.
- Resources and endpoints: `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`; `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`; `GET/POST /projects/:id/tasks`; `GET/PATCH/DELETE /tasks/:id`. Lists accept `?status=open&assignee=me&sort=-due_date&limit=20&cursor=...`. Use nouns, correct status codes (201 with `Location`, 204, 400, 401, 403, 404, 409, 422), JSON consistently, and version the API (`/v1`).
- Schema: `users(id, email UNIQUE, password_hash, role)`, `projects(id, owner_id, name)`, `project_members(project_id, user_id, role)`, `tasks(id, project_id, title, description, status, priority, assignee_id, due_date, created_at, updated_at)`; foreign keys and indexes on `(project_id, status, due_date)` and `assignee_id`.
- Components: Express app with routes, controllers, services, repositories; validation, auth, error-handling middleware; MySQL; pino logging.
- Failure and edge cases: concurrent updates (use `updated_at`/version for optimistic locking with `If-Match` or a `version` field), authorization on every resource (project membership), soft delete versus hard delete.
- Scaling: pagination, indexing, caching of read-heavy lists, rate limiting.

**Hinglish explanation:** REST me URL cheez (noun) batata hai aur HTTP method action: `GET /tasks` list, `POST /tasks` create, `PATCH /tasks/5` update. Authorization par dhyan: sirf project ke members hi uske tasks dekh sakein. Pagination aur filters shuru se rakho, baad me add karna painful hota hai.

**Example:**

```sql
CREATE TABLE tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  priority TINYINT NOT NULL DEFAULT 2,
  assignee_id BIGINT NULL,
  due_date DATE NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL,
  KEY idx_tasks_project_status_due (project_id, status, due_date)
) ENGINE=InnoDB;
```

**Follow-ups:**
- Q: PUT vs PATCH? A: PUT replaces the whole resource; PATCH changes provided fields only.
- Q: How do you prevent two users overwriting each other? A: A `version` column: `UPDATE tasks SET ..., version = version + 1 WHERE id = ? AND version = ?`; if zero rows changed, return 409.

---

## Q-SD-16 -- Design a payment workflow

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** Design the backend flow for a customer paying for an order through an external payment gateway.

**Interview answer:**
- Requirements: correct charging exactly once per order, order state consistency, handling timeouts and unknown outcomes, refunds, auditability, security (never store raw card data; use the gateway's tokenization/hosted fields to stay out of PCI scope).
- API: `POST /orders` creates an order in `pending`; `POST /orders/:id/payments` (with `Idempotency-Key`) creates a payment intent/attempt; gateway webhook `POST /webhooks/payments` confirms the result; `GET /orders/:id` shows status; `POST /payments/:id/refunds`.
- Schema: `orders(id, user_id, amount, currency, status)`, `payments(id, order_id, idempotency_key UNIQUE, gateway_ref, status, amount, created_at)`, `webhook_events(event_id UNIQUE, ...)`, `refunds(...)`, plus an append-only audit trail (see Q-SD-18 for ledgers).
- Data flow: (1) order created `pending`; (2) server creates a payment record `pending` (unique idempotency key) and a gateway payment intent with the same key; (3) client completes payment with the gateway (card details go straight to the gateway); (4) the gateway calls the webhook with the final result; (5) the handler verifies the signature, dedupes by event id, and atomically moves payment and order to `paid` or `failed`; (6) fulfillment is triggered via an event/queue after commit.
- Failure scenarios: request timeout (outcome unknown, so wait for webhook or query the gateway), duplicate webhooks (event-id dedupe), webhook before client return (order of arrival varies), webhook lost (reconciliation job polls payments stuck in `pending`), partial failure after charge (state machine and reconciliation), double click (idempotency key), amount tampering (compute the amount on the server, never trust the client's).
- Trade-offs: synchronous confirmation is simpler but unreliable; webhook-driven confirmation is robust but asynchronous, so the UI shows "processing" and updates when final.
- Scaling: queue for post-payment work, partition by order id, keep webhook handler fast.

**Hinglish explanation:** Payment flow me teen cheezein yaad rakho: (1) Paisa server par decide hota hai, client se amount mat lo. (2) Card details apne server par kabhi mat aane do -- gateway ke form se jaaye. (3) Final sach webhook se aata hai, client ke "success" button se nahi. Beech me kuch bhi fail ho sakta hai, isliye pending records aur reconciliation job chahiye.

**Example (state machine guard):**

```js
const ALLOWED = {
  pending: ['paid', 'failed', 'cancelled'],
  paid: ['refunded'],
  failed: [],
  cancelled: [],
  refunded: [],
};

export async function transitionOrder(conn, orderId, from, to) {
  if (!ALLOWED[from]?.includes(to)) throw new Error(`Illegal transition ${from} -> ${to}`);
  const [r] = await conn.execute('UPDATE orders SET status = ? WHERE id = ? AND status = ?', [to, orderId, from]);
  return r.affectedRows === 1; // false means someone else already changed it
}
```

**Follow-ups:**
- Q: Why server-side amount? A: Clients can tamper with request bodies; recompute from the cart on the server.
- Q: What do you store about cards? A: Nothing sensitive; only a gateway token and maybe last four digits and brand.
- Q: Currency handling? A: Store amounts as integers in minor units (paise/cents) or `DECIMAL`, never floating point.

---

## Q-SD-17 -- Payment state machine and reconciliation

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** How do you make sure your payment records match what the gateway actually did?

**Interview answer:** Model payment status as a strict state machine with conditional, atomic transitions, so no event can move a record backward or skip a step. Run a periodic reconciliation job that finds payments in non-final states older than a threshold, queries the gateway (by idempotency key or gateway reference), and moves them to the correct final state; also run a daily reconciliation that compares the gateway's settlement report with internal records and flags mismatches (missing, duplicate, or amount differences) for review. Log every transition with who or what triggered it for audit, and alert on stuck or mismatched records.

**Hinglish explanation:** Hamari DB aur gateway ki kitaab kabhi mismatch ho sakti hai (webhook miss, crash). Isliye ek job har kuch minute me "pending" payments gateway se poochhti hai. Aur raat ko gateway ki settlement report se apni entries milati hai. Ye production payments ka standard hissa hai.

**Example:**

```js
export async function reconcilePending(pool, gateway) {
  const [rows] = await pool.execute(
    "SELECT id, order_id, idempotency_key FROM payments WHERE status = 'pending' AND created_at < NOW() - INTERVAL 15 MINUTE LIMIT 200"
  );
  for (const p of rows) {
    const remote = await gateway.lookupByIdempotencyKey(p.idempotency_key); // provider-specific
    if (!remote) continue; // no charge exists; consider failing/cancelling after a longer window
    const status = remote.paid ? 'paid' : remote.failed ? 'failed' : null;
    if (status) {
      await pool.execute("UPDATE payments SET status = ?, gateway_ref = ? WHERE id = ? AND status = 'pending'", [status, remote.id, p.id]);
    }
  }
}
```

**Follow-ups:**
- Q: Who triggers the job? A: A single scheduler enqueuing a job (not every instance; see Q-PROD-31).
- Q: Why also a daily report-based check? A: Webhooks and lookups can both miss edge cases; settlement files are the source of truth for money.

---

## Q-SD-18 -- Design a wallet or ledger (double-entry)

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** Design a wallet system where users hold balances and transfer money.

**Interview answer:** Use an append-only ledger instead of just mutating a balance column: each movement is recorded as ledger entries with debits and credits that sum to zero (double-entry), and balances are derived from the ledger (and may be cached in an `accounts.balance` column updated in the same transaction). Every transfer runs in a single database transaction: lock the involved accounts in a consistent order, check sufficient funds, insert the ledger entries, update balances, and commit. Use an idempotency key per transfer to avoid duplicates, use `DECIMAL` or integer minor units, never allow negative balances unless intended (enforce with a `CHECK`), and keep entries immutable (corrections are new reversing entries). For audit and reconciliation, ledger totals must match external settlements.

**Hinglish explanation:** Sirf `balance = balance - 100` likhna risky hai kyunki history nahi rehti. Bank ki tarah bahi-khata rakho: har transfer ke do entries (ek se minus, ek me plus). Balance = entries ka jod. Galti hui to purani entry mat badlo, ulta entry daalo. Transaction aur consistent lock order se race aur deadlock bachte hain (Q-PROD-08).

**Example:**

```sql
CREATE TABLE accounts (
  id BIGINT PRIMARY KEY,
  balance_minor BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT chk_balance_nonneg CHECK (balance_minor >= 0)
) ENGINE=InnoDB;

CREATE TABLE ledger_entries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transfer_id CHAR(36) NOT NULL,
  account_id BIGINT NOT NULL,
  amount_minor BIGINT NOT NULL,         -- negative = debit, positive = credit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_transfer_account (transfer_id, account_id),
  KEY idx_ledger_account (account_id, created_at)
) ENGINE=InnoDB;
```

```js
export async function transfer(pool, { transferId, from, to, amountMinor }) {
  const [a, b] = from < to ? [from, to] : [to, from];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('SELECT id FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE', [a, b]);
    const [d] = await conn.execute('UPDATE accounts SET balance_minor = balance_minor - ? WHERE id = ? AND balance_minor >= ?', [amountMinor, from, amountMinor]);
    if (d.affectedRows !== 1) throw Object.assign(new Error('Insufficient funds'), { status: 422 });
    await conn.execute('UPDATE accounts SET balance_minor = balance_minor + ? WHERE id = ?', [amountMinor, to]);
    await conn.execute('INSERT INTO ledger_entries (transfer_id, account_id, amount_minor) VALUES (?, ?, ?), (?, ?, ?)',
      [transferId, from, -amountMinor, transferId, to, amountMinor]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') return { duplicate: true }; // same transferId replayed
    throw e;
  } finally {
    conn.release();
  }
}
```

**Follow-ups:**
- Q: Why integers for money? A: Floating-point cannot represent decimals exactly; use minor units (paise) or `DECIMAL`.
- Q: Why keep a cached balance? A: Summing a large ledger on every read is slow; the cached balance is updated atomically in the same transaction and can be re-derived to verify.

---

## Q-SD-19 -- Design idempotency keys

**Difficulty:** Advanced | `[ESSENTIAL]`

**Question:** How would you design an idempotency mechanism for a `POST /payments` API?

**Interview answer:** The client sends a unique `Idempotency-Key` header (a UUID per user intent). The server stores a record keyed by (key, user) with the request fingerprint (hash of method, path, body), a status (`in_progress`, `completed`), and the saved response (status code and body). Flow: atomically insert the key row (unique constraint); if the insert succeeds, process the request and save the response; if it fails because the key exists, then: if the fingerprint differs return `422`/`409`; if still `in_progress` return `409` (or wait briefly); if `completed` return the stored response exactly. Keys expire after a retention window (for example 24 hours). The handler's side effects must be inside the same transaction as the key completion, or the operation itself must be conditionally atomic, so a crash does not leave a charged-but-unrecorded state. Pass the same key downstream to the gateway.

**Hinglish explanation:** Idempotency key = request ka "token number". Pehli baar aaya to kaam karo aur natija save karo. Dobara wahi number aaya to naya kaam mat karo, saved natija wapas do. Agar number same par body alag ho, to client ka bug hai -- error do. Insert ka unique constraint isme asli hathiyaar hai kyunki do parallel requests me bhi sirf ek hi insert jeetega.

**Example:**

```sql
CREATE TABLE idempotency_keys (
  user_id BIGINT NOT NULL,
  idem_key VARCHAR(64) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  status ENUM('in_progress','completed') NOT NULL DEFAULT 'in_progress',
  response_status SMALLINT NULL,
  response_body JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, idem_key)
) ENGINE=InnoDB;
```

```js
import { createHash } from 'node:crypto';

export function idempotent(handler) {
  return async (req, res, next) => {
    const key = req.get('Idempotency-Key');
    if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
    const hash = createHash('sha256').update(req.method + req.originalUrl + JSON.stringify(req.body)).digest('hex');
    try {
      await pool.execute('INSERT INTO idempotency_keys (user_id, idem_key, request_hash) VALUES (?, ?, ?)', [req.user.id, key, hash]);
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') return next(e);
      const [[row]] = await pool.execute('SELECT request_hash, status, response_status, response_body FROM idempotency_keys WHERE user_id = ? AND idem_key = ?', [req.user.id, key]);
      if (row.request_hash !== hash) return res.status(422).json({ error: 'Idempotency key reused with different request' });
      if (row.status === 'in_progress') return res.status(409).json({ error: 'Request in progress' });
      return res.status(row.response_status).json(row.response_body);
    }
    try {
      const { status, body } = await handler(req);
      await pool.execute("UPDATE idempotency_keys SET status = 'completed', response_status = ?, response_body = ? WHERE user_id = ? AND idem_key = ?", [status, JSON.stringify(body), req.user.id, key]);
      res.status(status).json(body);
    } catch (err) {
      await pool.execute('DELETE FROM idempotency_keys WHERE user_id = ? AND idem_key = ? AND status = ?', [req.user.id, key, 'in_progress']);
      next(err);
    }
  };
}
```

Note: this simple version removes the key if the handler throws so the client can retry; production systems must decide which failures are safe to retry, and ideally make the business write and the key completion one transaction.

**Follow-ups:**
- Q: Is the same key allowed across users? A: Scope keys per user (or tenant) to avoid collisions.
- Q: Which HTTP methods need it? A: POST and other non-idempotent operations; GET, PUT, DELETE are idempotent by definition when implemented correctly.
- Q: What if the process crashes while `in_progress`? A: The key stays `in_progress`; use a timeout to allow takeover, or a reconciliation job for the business operation.

---

## Q-SD-20 -- Distributed transactions: saga and outbox

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** In a microservices system, an order spans the Order, Payment, and Inventory services. How do you keep data consistent without a distributed transaction?

**Interview answer:** Use the saga pattern: a sequence of local transactions, each publishing an event that triggers the next step, with compensating actions if a step fails (for example release stock, refund payment, cancel order). Sagas can be choreographed (services react to each other's events) or orchestrated (a coordinator drives the steps); orchestration is easier to reason about for complex flows. To publish events reliably, use the transactional outbox pattern: write the business change and an outbox row in the same local database transaction, and a relay process publishes outbox rows to the broker, marking them sent, which avoids the "DB committed but event lost" problem. Consumers must be idempotent since delivery is at least once. The result is eventual consistency, so the UI should show intermediate states.

**Hinglish explanation:** Alag-alag database ko ek saath commit nahi kara sakte. To har service apna local transaction karti hai aur event bhejti hai. Kuch fail ho to ulta kaam (compensation) chalata hai: payment hua par stock nahi, to refund. Outbox ka idea: event ko bhi usi DB transaction me table me likh do, phir ek alag process use broker par bhej deta hai -- is tarah "DB me likha par event gum" wali problem nahi hoti.

**Example:**

```js
// order service: business row and outbox row in ONE local transaction
await conn.beginTransaction();
const [o] = await conn.execute("INSERT INTO orders (user_id, amount, status) VALUES (?, ?, 'pending')", [userId, amount]);
await conn.execute('INSERT INTO outbox (aggregate_id, type, payload) VALUES (?, ?, ?)', [o.insertId, 'OrderCreated', JSON.stringify({ orderId: o.insertId, amount })]);
await conn.commit();

// relay (separate process): poll, publish, mark as sent
const [events] = await pool.execute('SELECT id, type, payload FROM outbox WHERE sent_at IS NULL ORDER BY id LIMIT 100');
for (const ev of events) {
  await broker.publish(ev.type, ev.payload);
  await pool.execute('UPDATE outbox SET sent_at = NOW() WHERE id = ?', [ev.id]);
}
```

**Follow-ups:**
- Q: Why can the relay publish twice? A: It may crash after publishing but before marking; consumers dedupe by event id.
- Q: Choreography vs orchestration? A: Choreography is decentralized and simple for small flows but hard to follow at scale; orchestration centralizes the flow logic.

---

## Q-SD-21 -- Retry strategies, backoff, and circuit breakers (design view)

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How should services retry failed calls to each other?

**Interview answer:** Retry only transient failures (timeouts, connection resets, 5xx, 429) and only idempotent operations or those protected by idempotency keys. Use exponential backoff with jitter and a maximum attempt count or total deadline, honor `Retry-After`, and retry at one layer to avoid multiplying attempts. Set timeouts on every call. Add a circuit breaker so that, after repeated failures, calls fail fast for a cooldown, giving the dependency time to recover. For asynchronous work, push failures to a retry queue with delays and a dead-letter queue after the maximum attempts. Make the retry policy observable (metrics on retries and breaker state).

**Hinglish explanation:** Retry ek dawai hai: kam matra me kaam karti hai, zyada me nuksaan. Sirf unhi errors par retry karo jo thodi der me theek ho sakte hain (timeout, 503), 400 par nahi. Delay badhate jao aur randomness daalo. Dependency baar-baar fail ho rahi ho to circuit breaker kholkar kuch der call hi band kar do. Code: Q-PROD-13.

**Follow-ups:**
- Q: Do you retry a 400? A: No; it is a client error that will fail again.
- Q: What is a deadline? A: A total time budget for the whole operation, propagated to downstream calls so retries do not exceed it.

---

## Q-SD-22 -- Logging, metrics, tracing, and alerting

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you make a backend observable in production?

**Interview answer:** I use the three pillars. Logs: structured JSON with correlation ids, levels, and redaction, shipped to a central system. Metrics: numeric time series such as request rate, error rate, latency percentiles (RED method for services), and resource saturation (USE method: utilization, saturation, errors) plus business metrics (orders per minute), collected with Prometheus or a cloud agent and shown in dashboards. Traces: distributed traces (OpenTelemetry) showing the path and timing of a request across services and the database. Alerts fire on symptoms that matter to users (error rate, latency SLO burn, queue age) with clear runbooks, avoiding noisy alerts. Add health endpoints and uptime checks, and error tracking (Sentry) for exceptions.

**Hinglish explanation:** Logs batate hain "kya hua", metrics batate hain "kitna aur kitni tezi se", traces batate hain "kahan time laga". Teeno chahiye. Alert wahan lagao jahan user ko dikkat ho (errors, latency), aur har alert ke saath "ab kya karna hai" ka runbook ho.

**Example:**

```js
import client from 'prom-client';

client.collectDefaultMetrics();
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => end({ method: req.method, route: req.route?.path ?? 'unknown', status: res.statusCode }));
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});
```

**Follow-ups:**
- Q: Why use the route pattern and not the raw URL as a label? A: Raw URLs with ids create unbounded label cardinality and overload the metrics system.
- Q: What is an SLO? A: A target such as 99.9 percent of requests succeed under 500 ms over 30 days; alerts track error-budget burn.

---

## Q-SD-23 -- Docker basics for a Node.js service

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you containerize a Node.js API, and what are the best practices?

**Interview answer:** A container packages the app with its runtime and dependencies so it runs identically everywhere. I use a small official Node LTS base image, a multi-stage build (install and build in one stage, copy only what production needs into a slim final stage), copy `package*.json` first to leverage layer caching, use `npm ci --omit=dev`, run as a non-root user, set `NODE_ENV=production`, add a `.dockerignore` (exclude `node_modules`, `.git`, `.env`), expose the port, define a healthcheck, handle `SIGTERM` for graceful shutdown (use `exec` form `CMD ["node", "server.js"]` so Node is PID 1 and receives signals), and keep secrets out of the image (inject at runtime). Use `docker compose` locally for the app, MySQL, and Redis.

**Hinglish explanation:** Docker "mere laptop par chal raha hai" wali problem hatata hai. Image = recipe + saman ka dabba; container = us dabbe ko chalana. `package.json` pehle copy karo taaki dependency install ka layer cache ho jaaye aur har code change par dobara install na ho. Secrets image me mat daalo.

**Example:**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml (local development)
services:
  api:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
  db:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: app
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      retries: 10
  redis:
    image: redis:7
```

**Follow-ups:**
- Q: Why not `CMD npm start`? A: npm becomes PID 1 and may not forward `SIGTERM` to Node, breaking graceful shutdown.
- Q: Image vs container? A: Image is the immutable package; a container is a running instance of it.
- Q: Why non-root? A: Limits the damage if the app is compromised.

---

## Q-SD-24 -- Deployment strategies and zero-downtime releases

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** How do you deploy new versions without downtime?

**Interview answer:** Run multiple instances behind a load balancer and replace them gradually. Rolling deployment updates a few instances at a time while health and readiness checks keep traffic away from instances that are not ready; blue-green runs a full new environment and switches traffic at once (instant rollback by switching back, but double the resources); canary sends a small share of traffic to the new version and increases it as metrics stay healthy. Requirements for zero downtime: graceful shutdown (Q-PROD-28), backward-compatible database migrations (expand and contract), readiness probes, and automated rollback on errors. Feature flags decouple deployment from release.

**Hinglish explanation:** Naya version aise lagao ki users ko pata na chale. Rolling = ek-ek server badlo. Blue-green = poora naya setup taiyar karke switch dabao. Canary = pehle 5% users ko naya do. Teeno me DB badlav backward compatible hona zaroori hai kyunki kuch der purana aur naya code saath chalte hain.

**Follow-ups:**
- Q: How does a DB change stay compatible? A: Expand (add new column/table), deploy code that supports both, migrate data, then contract (remove old) in a later release.
- Q: CI/CD? A: CI runs tests and builds an image; CD deploys that same image through environments with approvals and automated checks.

---

## Q-SD-25 -- Design a scheduled and delayed job system

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** Design a system for scheduled jobs (daily reports) and delayed jobs (send reminder in 24 hours) that works with several app instances.

**Interview answer:** Separate scheduling from execution. A single scheduler (or leader-elected one, or an external scheduler such as a Kubernetes CronJob or cloud scheduler) emits jobs at the right time onto a durable queue; workers consume with concurrency limits. For delayed jobs, use the queue's delay feature (BullMQ delayed jobs, SQS delay or scheduled messages), or a `jobs` table with `run_at` that workers poll using `SELECT ... FOR UPDATE SKIP LOCKED` (MySQL 8) so several workers can claim distinct rows without blocking. Jobs are idempotent, have retries with backoff, a dead-letter state, and visibility into status. Handle clock and time zones (store UTC), missed runs after downtime (catch-up policy), and overlapping runs (lock or skip).

**Hinglish explanation:** "Kaun chalayega" aur "kaun karega" alag rakho. Scheduler sirf ghadi dekhta hai aur job queue me daalta hai; workers kaam karte hain. DB-table approach me `SKIP LOCKED` ek badhiya trick hai: kai workers ek saath row uthate hain par koi ek hi row ko dobara nahi uthata.

**Example:**

```js
export async function claimJobs(pool, limit = 10) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      "SELECT id, type, payload FROM jobs WHERE status = 'pending' AND run_at <= NOW() ORDER BY run_at LIMIT ? FOR UPDATE SKIP LOCKED",
      [limit]
    );
    if (rows.length) {
      await conn.query("UPDATE jobs SET status = 'running', started_at = NOW() WHERE id IN (?)", [rows.map((r) => r.id)]);
    }
    await conn.commit();
    return rows;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
```

**Follow-ups:**
- Q: Stuck `running` jobs after a worker crash? A: A reaper resets jobs whose `started_at` is older than a timeout back to `pending`.
- Q: DB table vs a real queue? A: A table is simple and transactional with business data; a queue broker scales better for high throughput.

---

## Q-SD-26 -- Design inventory and a flash sale

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** Design the inventory handling for a flash sale where thousands of users try to buy limited stock at once.

**Interview answer:** The core invariant is never to sell more than stock. For a first design, an atomic conditional update in MySQL (`UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0`) inside the order transaction is correct and simple (Q-PROD-29). Under extreme load the hot row becomes a bottleneck, so add: a Redis atomic decrement (`DECR` or a Lua script) as a fast front gate that rejects excess requests early, then create orders asynchronously through a queue; a reservation model (hold stock for 10 minutes while the user pays, release on expiry) to prevent paying for unavailable stock; rate limiting and a waiting-room to smooth traffic; idempotency per user per sale item; and reconciliation of Redis counts against the database. Make failure behavior explicit: Redis loss must not oversell, so the database remains the final authority.

**Hinglish explanation:** Flash sale ka dar: stock 100 aur orders 120. Sabse safe: DB me atomic update. Bahut zyada traffic ho to pehle Redis me jaldi se count kam karke 100 ke baad wale ko turant "sold out" bol do, aur asli order queue se bane. Aakhri sach hamesha DB hai.

**Example:**

```js
// Redis front gate: atomic decrement only if stock remains
const RESERVE = `
local s = tonumber(redis.call('GET', KEYS[1]) or '0')
if s >= tonumber(ARGV[1]) then
  redis.call('DECRBY', KEYS[1], ARGV[1])
  return 1
end
return 0
`;
const ok = await redis.eval(RESERVE, { keys: [`stock:${productId}`], arguments: ['1'] });
if (ok !== 1) return res.status(409).json({ error: 'Sold out' });
await orderQueue.add('create-order', { userId, productId }, { jobId: `${userId}:${productId}:${saleId}` });
res.status(202).json({ status: 'processing' });
```

**Follow-ups:**
- Q: If the order creation later fails? A: Compensate: increment the Redis counter back (or let the reservation expire) and notify the user.
- Q: One purchase per user? A: A unique key `(sale_id, user_id)` in the database.

---

## Q-SD-27 -- Design real-time updates (WebSockets) at scale

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** Design real-time notifications or chat for a Node.js backend. How do WebSockets scale across multiple servers?

**Interview answer:** WebSocket connections are long-lived and stateful, so each client holds a connection to one server instance. To broadcast across instances, use a pub/sub backbone (Redis pub/sub or Streams, NATS, Kafka): a server that receives a message publishes it, and every instance that holds relevant connections delivers it locally. Authenticate during the handshake (a token), authorize channel subscriptions, handle heartbeats (ping/pong) and reconnects with backoff and message catch-up (last event id), persist messages in a database for history and offline delivery, and apply backpressure and rate limits per connection. Sticky sessions help the WebSocket upgrade, though stateless reconnect handling is more robust. Alternatives for one-way updates: Server-Sent Events or long polling, which are simpler. Plan connection limits and file descriptors per instance.

**Hinglish explanation:** WebSocket me ek user ek server se jura hota hai. Agar user A server 1 par aur user B server 2 par hai, to A ka message B tak pahunchane ke liye beech me Redis pub/sub chahiye. Frontend me tumne socket reconnect handle kiya hoga; backend ko bhi "last event id" se missed messages bhejna padta hai.

**Follow-ups:**
- Q: WebSockets vs SSE vs polling? A: WebSockets are bidirectional and low latency; SSE is simple one-way over HTTP; polling is the simplest but wasteful.
- Q: How many connections per Node instance? A: Tens of thousands is feasible with tuning (file descriptors, memory per connection); measure with load tests.

---

## Q-SD-28 -- Consistency, CAP, and eventual consistency

**Difficulty:** Advanced | `[ADVANCED]`

**Question:** Explain the CAP theorem and eventual consistency in practical terms.

**Interview answer:** In a distributed system, when a network partition occurs you must choose between consistency (every read sees the latest write) and availability (every request gets a response). Partition tolerance is not optional in real networks, so the practical choice is CP or AP behavior during partitions. A single-primary relational database favors consistency for writes. Caches, replicas, search indexes, and event-driven systems are typically eventually consistent: updates propagate with a delay, so reads may be stale briefly. Good design decides per use case: money balances and inventory need strong consistency on the write path, while counters, feeds, and search can be eventually consistent. Handle it explicitly with read-your-writes routing, versioning, idempotency, and UI that shows pending states.

**Hinglish explanation:** CAP ka matlab: network toot jaaye to ya to galat/purana jawab do (available) ya jawab hi mat do (consistent). Balance jaisi cheez me "jawab mat do" behtar. Like count jaisi cheez me thoda purana chalega. Eventual consistency = thodi der me sab jagah data barabar ho jaayega.

**Follow-ups:**
- Q: Where does your Node/MySQL app show eventual consistency? A: Read replicas, caches, queue-driven updates, and search indexes.
- Q: ACID vs BASE? A: ACID emphasizes strict transactional guarantees; BASE (basically available, soft state, eventually consistent) trades strictness for availability and scale.

---

## Q-SD-29 -- API gateway and service-to-service communication

**Difficulty:** Intermediate | `[ADVANCED]`

**Question:** What is an API gateway and how should services communicate?

**Interview answer:** An API gateway is a single entry point in front of services that handles cross-cutting concerns: routing, authentication, rate limiting, TLS, request/response transformation, and aggregation (a backend-for-frontend pattern shapes responses per client such as web or mobile). Between services, synchronous communication (HTTP/REST or gRPC) is simple but couples availability and latency, so use timeouts, retries, and circuit breakers; asynchronous communication (events on a broker) decouples services and absorbs spikes but brings eventual consistency and harder tracing. A common approach is synchronous calls for queries that need an immediate answer and events for state changes that others react to. Propagate correlation ids and auth context across calls.

**Hinglish explanation:** Gateway building ka reception hai: sab pehle wahin aate hain, ID check hoti hai, phir sahi department bheja jaata hai. Services aapas me baat karein to ya direct call (tez par ek girti hai to dusri bhi atakti hai) ya event bhejkar (halka sa deri par zyada safe).

**Follow-ups:**
- Q: REST vs gRPC internally? A: gRPC offers strongly typed, efficient binary communication and streaming; REST is simpler and universally supported.
- Q: BFF? A: A backend tailored to one frontend's needs, reducing over-fetching and round trips.

---

## Q-SD-30 -- Back-of-the-envelope capacity estimation

**Difficulty:** Intermediate | `[ESSENTIAL]`

**Question:** Estimate the load and storage for a URL shortener with 100 million new links per month and a 100:1 read-to-write ratio.

**Interview answer:** Writes: 100 million per month is about 100,000,000 / (30 x 86,400) = roughly 40 writes per second on average; peak maybe 3x, so about 120 per second. Reads at 100:1 give about 4,000 reads per second on average, and perhaps 12,000 at peak. Storage: each record about 500 bytes (code, long URL up to 2 KB in the worst case but typically a few hundred bytes, metadata), so 100 million x 500 B = 50 GB per month, about 600 GB per year, and about 3 TB over five years; this fits a single sharded or partitioned relational or key-value store with replication. Cache: if 20 percent of links produce 80 percent of reads, cache that hot set; for example 10 million hot links x 500 B = 5 GB, which fits in one Redis instance. Bandwidth is small because responses are redirects of a few hundred bytes. The numbers show reads dominate, so caching and read scaling matter more than write scaling.

**Hinglish explanation:** Interview me exact answer nahi chahiye, tareeka chahiye. Month ko seconds me todo (about 2.6 million seconds), requests per second nikalo, peak ke liye 3x lo, size multiply karo, phir decide karo: cache lagega? ek DB kaafi hai? Ye hisaab dikhata hai ki tum design numbers se karte ho, andaza se nahi.

**Example (quick calculation helper):**

```js
const perMonth = 100_000_000;
const secondsPerMonth = 30 * 24 * 3600;
const writesPerSec = perMonth / secondsPerMonth;       // ~38.6
const readsPerSec = writesPerSec * 100;                // ~3,858
const storageGbPerMonth = (perMonth * 500) / 1e9;      // 50 GB
console.log({ writesPerSec, readsPerSec, storageGbPerMonth });
```

**Follow-ups:**
- Q: What numbers should you memorize? A: About 86,400 seconds per day, 2.6 million per month; memory is roughly 100 ns, SSD about 100 microseconds, network round trip in a datacenter about 0.5 ms, cross-region about 100 ms.
- Q: How does this change the design? A: High read load means caching and replicas; large storage means partitioning; low write rate means a single primary is fine initially.

---

# END OF CATEGORY 10

---

## Final revision map (Question Bank B)

| If you only have this much time | Do these |
|----------------------------------|----------|
| 1 hour | Q-SEC-01, 05, 06, 08, 14, 15, 17, 18; Q-TEST-01, 02, 05; Q-PERF-03, 05, 11; Q-PROD-01, 02, 03, 04; Q-SD-01, 04, 06, 16 |
| 1 day | All `[ESSENTIAL]` questions in categories 6-9, plus Q-SD-01 to Q-SD-16 |
| 1 week | Everything; then practice speaking each Interview answer aloud in under 90 seconds |

Practice method: for every scenario, speak the sequence "impact -> mitigate -> evidence -> root cause -> prevention". For design questions, speak "requirements -> numbers -> simple design -> bottlenecks -> trade-offs".

## REMAINING

Nothing remaining for categories 6-10: all five categories are complete (Q-SEC-01..32, Q-TEST-01..30, Q-PERF-01..32, Q-PROD-01..32, Q-SD-01..30). Coding exercises for these topics (EX-JWT, EX-TEST, EX-DEBUG, EX-RATE, EX-IDEM) live in `11_Coding_Exercises.md`.
