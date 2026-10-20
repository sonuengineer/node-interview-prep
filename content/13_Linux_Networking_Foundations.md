# 13 - Linux, Networking and Docker Networking for a Backend Developer

> **Where this fits**
> - Roadmap: "Days 8-14 -- Linux & the command line" (the "biggest silent gap") plus the "Networking you must
>   be able to explain" and "Container & network basics" bullets of `90-day-backend-engineer-roadmap.md`.
> - Interview plan: read after Week 2 (Node internals -- `Week 2 / Day 2 notes` on the event loop and
>   thread pool) and before Week 7 / Day 6 (Docker + deployment basics). It is the "how do I SEE what my
>   service is doing" layer under everything else.
> - Frontend connection: in the browser you debug with DevTools (Network tab, Console). On a server there
>   is no DevTools -- your DevTools are `ss`, `curl -v`, `strace`, `journalctl`. This file is that toolbox.
> - Tiers: `[ESSENTIAL]` = asked or expected in most backend interviews. `[ADVANCED]` = supplementary.

**Every command and every output block in this file was executed by the author** inside `ubuntu:24.04`
containers on Docker Desktop (Windows 11, Docker 29, Node v20.20.1 inside the containers; Linux kernel
6.18 WSL2). Outputs are pasted as seen; only hostnames/timestamps/PIDs will differ on your machine. The
small list of things that could not be run is at the very end ("Not verified").

---

## Lab 0 - Build the lab machine (20 minutes)

**Goal:** one throw-away Ubuntu with all the debugging tools, so every later module is copy-paste.

Linux commands must run on Linux. On Windows/macOS we use a container. Create a folder (call it `lab13`)
and save this as `Dockerfile`:

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    curl ca-certificates dnsutils iproute2 procps strace lsof iputils-ping traceroute openssl less \
    xz-utils netcat-openbsd psmisc openssh-client sudo gawk sed grep findutils file iptables systemd-sysv
RUN curl -fsSL https://nodejs.org/dist/v20.20.1/node-v20.20.1-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1 && node -v
```

What each package gives you (memorise this table -- interviewers ask "what tool shows X?"):

| Package | Commands | Used for |
|---------|----------|----------|
| `iproute2` | `ss`, `ip` | sockets, ports, interfaces (modern `netstat`/`ifconfig`) |
| `procps` | `ps`, `top`, `free`, `vmstat`, `uptime`, `pgrep`, `pkill` | processes and memory |
| `lsof`, `psmisc` | `lsof`, `fuser` | which process has which file/port open |
| `strace` | `strace` | every system call a process makes |
| `dnsutils` | `dig`, `nslookup` | DNS debugging |
| `curl`, `openssl` | `curl -v`, `openssl s_client` | HTTP and TLS debugging |
| `traceroute`, `iputils-ping` | `traceroute`, `ping` | path and reachability |

```bash
docker build -t lx-ubuntu .
docker run -d --name lx-main --cap-add=SYS_PTRACE lx-ubuntu sleep infinity
docker exec -it lx-main bash        # you are now "on the server"
```

Notes from the real run:
- `--cap-add=SYS_PTRACE` is required for `strace -p` inside Docker (Docker's default seccomp/capabilities
  block attaching to another process). It is the single most common reason "strace doesn't work in my
  container".
- On Windows Git Bash, prefix Docker commands that contain `/paths` with `export MSYS_NO_PATHCONV=1`,
  otherwise Git Bash rewrites `/w` into `C:/Program Files/Git/w`. In PowerShell this is not needed.
- Later modules also run `apt-get install -y openssh-server tcpdump` inside the container when needed.
- Throughout the file, every lab file lives in `/tmp/lab` inside `lx-main`.

**Lab server used by many modules.** Create it once inside `lx-main`:

```bash
mkdir -p /tmp/lab && cd /tmp/lab
cat > server.mjs <<'X'
import http from 'node:http';
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const srv = http.createServer((req, res) => { res.end('hello from pid ' + process.pid + '\n'); });
srv.listen(port, host, () => console.log(`listening on ${host}:${port} pid=${process.pid}`));
process.on('SIGTERM', () => { console.log('got SIGTERM, closing'); srv.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('got SIGINT'); process.exit(0); });
X
```

It reads `PORT` and `HOST` from env (`process.env` -- see `Week 2 / Day 3 notes`), listens, and shuts down
cleanly on SIGTERM. Those 8 lines are enough to reproduce most real production network problems.

---

## Module 1 - Shell, filesystem, permissions, pipes, exit codes [ESSENTIAL]

**Learning objectives**
- Navigate and inspect the filesystem and read `ls -l` permission bits without guessing.
- Explain why a Node process gets `EACCES`, and fix it with `chmod`/`chown` instead of `chmod 777`.
- Use pipes, redirection, heredocs, `&&`/`||`, exit codes, and `set -euo pipefail` correctly.

### 1.1 Concept and why it matters

Server = Linux + a shell. Deployment scripts, Dockerfiles (`RUN`, `CMD`), CI pipelines, cron jobs and
incident debugging are all shell. Frontend dev ko `npm run build` ka pata hota hai, but the shell
underneath (`&&`, exit codes) decides whether your CI is green or silently broken.

Everything is a file in Linux: regular files, directories, devices, even sockets and pipes. That is why
the same tools (`ls`, `cat`, `lsof`) work everywhere, and why a process that opens a socket appears as a
"file descriptor" (we will see this in Module 3).

### 1.2 Filesystem and permissions -- lab

```bash
cd /tmp; mkdir -p lab && cd lab
touch a.txt; echo hi > b.txt; mkdir -p logs; ls -la
chmod 640 b.txt; stat -c '%A %U:%G %n' b.txt
chmod u+x a.txt; ls -l a.txt
stat -c '%a %n' a.txt b.txt
useradd -m dev
su dev -c 'cat /tmp/lab/b.txt; echo "exit=$?"'          # dev is "other": no read bit
chown dev:dev b.txt
su dev -c 'cat /tmp/lab/b.txt; echo "exit=$?"'          # now dev is the owner
```

Real output:

```text
--- pwd/ls
/tmp/lab
total 16
drwxr-xr-x 3 root root 4096 Oct 20 06:34 .
drwxrwxrwt 1 root root 4096 Oct 20 06:34 ..
-rw-r--r-- 1 root root    0 Oct 20 06:34 a.txt
-rw-r--r-- 1 root root    3 Oct 20 06:34 b.txt
drwxr-xr-x 2 root root 4096 Oct 20 06:34 logs
--- perms
-rw-r----- root:root b.txt
-rwxr--r-- 1 root root 0 Oct 20 06:34 a.txt
--- octal
744 a.txt
640 b.txt
--- non-root user
cat: /tmp/lab/b.txt: Permission denied
exit=1
--- chown
hi
exit=0
```

How to read `-rw-r-----`: first char = type (`-` file, `d` directory, `l` symlink). Then three triplets
`rw-` (owner) `r--` (group) `---` (others). `r=4 w=2 x=1`, so `rw- r-- ---` = `640`. On a directory, `x`
means "may enter / traverse it" and `w` means "may create/delete entries inside it".

**Node symptom this explains:**
- `Error: EACCES: permission denied, open '/var/log/app.log'` -> your process user (`ps -o user`) is not
  allowed by the bits above. Fix = make the file/dir owned by the service user (`chown nodeapp /var/log/app`),
  NOT `chmod 777`.
- `npm install -g` failing with EACCES -> global dir is owned by root.
- Never run the Node service as root: if the app has a path-traversal or RCE bug, the attacker is root.
  In Docker use `USER node` (see Module 5).

### 1.3 Pipes, redirection, heredocs, exit codes -- lab

```bash
echo out > o.txt; ls /nope > e.txt 2>&1; echo "rc=$?"; cat e.txt     # 2>&1 : stderr into same place as stdout
ls /nope 2>/dev/null; echo "rc=$?"                                    # throw stderr away
cat <<'X' > h.txt                                                     # heredoc (quoted X = no $expansion)
line one
line two
X
false && echo A || echo B; true && echo C
bash -c 'false | true; echo "no pipefail rc=$?"'
bash -c 'set -o pipefail; false | true; echo "pipefail rc=$?"'
bash -c 'set -euo pipefail; echo start; ls /nope; echo "never printed"'; echo "script rc=$?"
bash -c 'set -u; echo "$UNDEFINED_VAR"'; echo "rc=$?"
diff <(printf 'a\nb\n') <(printf 'a\nc\n')                             # process substitution
tar czf logs.tgz h.txt b.txt && tar tzf logs.tgz
```

Real output:

```text
--- redirection
rc=2
ls: cannot access '/nope': No such file or directory
rc=2
--- heredoc
line one
line two
--- && ||
B
C
--- pipefail
no pipefail rc=0
pipefail rc=1
--- set -euo
start
ls: cannot access '/nope': No such file or directory
script rc=2
bash: line 1: UNDEFINED_VAR: unbound variable
rc=127
--- process substitution
2c2
< b
---
> c
--- tar
h.txt
b.txt
```

**What you must be able to explain**
- **Exit code**: every process returns an integer; `0` = success, anything else = failure. `$?` holds the
  last one. CI, `&&`, `if cmd; then` all use it. Node: `process.exit(1)` or an uncaught exception sets it;
  `process.exitCode = 1` sets it without exiting immediately. Docker `docker run ...; echo $?` -> `137`
  means SIGKILL (128+9, often OOM), `143` = SIGTERM (128+15), `1` = app error.
- **`A && B`** runs B only if A succeeded; **`A || B`** runs B only if A failed. `false && echo A || echo B`
  printed only `B`.
- **Pipe `|`** connects stdout of left to stdin of right. By default the pipeline's exit code is the LAST
  command's, so `false | true` is "success" (the "no pipefail rc=0" line). That hides failures like
  `npm test | tee out.log` going green when tests failed.
- **`set -euo pipefail`**: `-e` exit on first failing command (the script printed `start`, then stopped
  at `ls /nope` and never printed "never printed"); `-u` error on undefined variables (typo `$DEPLY_DIR`
  would otherwise silently become empty and `rm -rf "$DEPLY_DIR/"` becomes `rm -rf /`); `-o pipefail`
  pipeline fails if ANY stage fails. Put it at the top of every deploy script.
  Caveat: `-e` has subtle exceptions (commands inside `if`, `&&` lists), so it is a safety net, not
  a substitute for checking critical steps.
- **stdout vs stderr**: fd 1 and fd 2. `> file` redirects 1, `2> file` redirects 2, `2>&1` merges. Docker and
  systemd capture both; Node `console.log` -> stdout, `console.error` -> stderr.

### 1.4 Interview answer

**Interview answer:** "Permissions in Linux are three triplets -- owner, group, others -- of read, write,
execute, shown by `ls -l` and expressible in octal, so `640` is `rw-r-----`. When a Node service gets
EACCES, I check which user the process runs as, then fix ownership or group with `chown`/`chmod` at the
narrowest scope, and I run the service as a non-root user. For scripts I use `set -euo pipefail` so that
errors, undefined variables, and failed pipeline stages stop the script instead of being silently
ignored; exit code zero means success and everything else is a failure."

### 1.5 Follow-ups

- **Q: Difference between `>` and `>>`?** `>` truncates then writes; `>>` appends. `> app.log` in a
  rotation script by mistake wipes logs.
- **Q: What does `chmod +x` do and why does a script give "Permission denied"?** Sets execute bit; the
  kernel refuses to exec a file without `x` (or when the filesystem is mounted `noexec`).
- **Q: What is a symlink vs hard link?** Symlink = a small file pointing to a path (can dangle). Hard
  link = another name for the same inode. Node deploys (`current -> releases/2026-10-20`) use symlinks.

### 1.6 Common mistakes
- `chmod -R 777` "to fix it". `sudo npm install`. Running the app as root.
- Forgetting `2>&1` in cron/CI and losing error text.
- Not quoting variables (`rm -rf $DIR/*` with empty `$DIR`).

### 1.7 Revision block

**Key concepts:** permission triplets and octal; exit codes; `&&`/`||`; pipe default exit code;
`set -euo pipefail`; stderr vs stdout.

**Revision questions**
1. What does `-rwxr-x---` mean in octal and who can do what?
2. Why is `false | true` exit code 0 and how do you change it?
3. What does `2>&1` do and why does order matter (`> f 2>&1` vs `2>&1 > f`)?
4. Docker container exits with code 137. What probably happened?
5. Why is running Node as root a security problem even if your code is "safe"?

**Practical task:** write `deploy.sh` with `set -euo pipefail` that fails if `NODE_ENV` is unset,
runs `npm ci`, `npm test`, and prints "ok". Prove each of the three failure types stops it.

**Self-assessment**
- [ ] I can read `ls -l` and convert to octal in my head.
- [ ] I can explain the pipe exit-code trap.
- [ ] I can fix an EACCES without 777.

---

## Module 2 - grep, sed, awk, xargs, find: reading logs like a backend dev [ESSENTIAL]

**Learning objectives**
- Answer "how many 5xx, which endpoint is slow, who is hammering us" from a raw access log in one line.
- Edit config in place safely, and run commands over many files with `find | xargs`.

### 2.1 Concept and why it matters

Production logs are text files with a fixed structure. `grep` filters lines, `cut`/`awk` pick columns,
`sort | uniq -c` counts, `sed` rewrites. Together they are a poor-man's analytics for the first 10 minutes
of an incident, when you cannot wait for Grafana. Frontend analogy: this is `Array.filter().map().reduce()`
over lines, with `|` instead of `.`.

### 2.2 Lab -- an access log with a hidden problem

Symptom to chase: "POST /api/orders is slow and sometimes 500 -- which clients, how slow?"

```bash
cd /tmp/lab
cat > access.log <<'X'
10.0.0.5 - - [20/Oct/2026:10:00:01 +0000] "GET /api/products?page=1 HTTP/1.1" 200 512 0.034
10.0.0.5 - - [20/Oct/2026:10:00:02 +0000] "GET /api/products/42 HTTP/1.1" 200 210 0.012
10.0.0.9 - - [20/Oct/2026:10:00:03 +0000] "POST /api/orders HTTP/1.1" 201 98 0.250
10.0.0.9 - - [20/Oct/2026:10:00:04 +0000] "POST /api/orders HTTP/1.1" 500 45 1.900
10.0.0.7 - - [20/Oct/2026:10:00:05 +0000] "GET /api/orders/7 HTTP/1.1" 404 30 0.008
10.0.0.5 - - [20/Oct/2026:10:00:06 +0000] "GET /api/products?page=2 HTTP/1.1" 200 498 0.041
10.0.0.9 - - [20/Oct/2026:10:00:07 +0000] "POST /api/orders HTTP/1.1" 500 45 2.100
10.0.0.7 - - [20/Oct/2026:10:00:08 +0000] "GET /health HTTP/1.1" 200 2 0.001
X
grep -E '" 5[0-9]{2} ' access.log                       # every 5xx line
grep -c POST access.log; grep -vn health access.log | head -2
awk '{print $9}' access.log | sort | uniq -c | sort -rn  # status code histogram
awk '{split($7,p,"?"); s[p[1]]+=$NF; n[p[1]]++} END{for(k in s) printf "%-20s n=%d avg=%.3fs\n",k,n[k],s[k]/n[k]}' access.log | sort
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -3
```

Real output:

```text
--- grep 5xx
10.0.0.9 - - [20/Oct/2026:10:00:04 +0000] "POST /api/orders HTTP/1.1" 500 45 1.900
10.0.0.9 - - [20/Oct/2026:10:00:07 +0000] "POST /api/orders HTTP/1.1" 500 45 2.100
--- grep -c / -v / -n
3
1:10.0.0.5 - - [20/Oct/2026:10:00:01 +0000] "GET /api/products?page=1 HTTP/1.1" 200 512 0.034
2:10.0.0.5 - - [20/Oct/2026:10:00:02 +0000] "GET /api/products/42 HTTP/1.1" 200 210 0.012
--- awk status histogram
      4 200
      2 500
      1 404
      1 201
--- awk avg latency per path
/api/orders          n=3 avg=1.417s
/api/orders/7        n=1 avg=0.008s
/api/products        n=2 avg=0.038s
/api/products/42     n=1 avg=0.012s
/health              n=1 avg=0.001s
--- top client IPs
      3 10.0.0.9
      3 10.0.0.5
      2 10.0.0.7
```

Reading it: both 500s come from client `10.0.0.9` on `POST /api/orders`, which averages 1.4 s versus
8-40 ms for reads. Next step in a real incident: look at the DB/connection pool for that code path
(see `Week 4 / Day 5 notes` pool and `Week 6 / Day 6 notes` slow API debugging).

**What each tool is for**
- `grep -E 'regex'` filter; `-v` invert; `-c` count; `-n` line numbers; `-r` recurse; `-i` ignore case;
  `-A3/-B3` context lines (huge for stack traces: `grep -B2 -A8 'Error:' app.log`).
- `awk '{print $9}'` fields are split on whitespace (`$1`, `$NF` last). Associative arrays make it a tiny
  GROUP BY. `awk -F, '{...}'` for CSV.
- `sort | uniq -c | sort -rn` = the "top N" idiom. `uniq` needs sorted input.
- `cut -d' ' -f1` simple column slicing.

### 2.3 sed, find, xargs

```bash
sed -n '3,4p' access.log                                  # print lines 3-4
sed 's/10\.0\.0\.[0-9]*/x.x.x.x/' access.log | head -2    # anonymise IPs before sharing a log
echo "PORT=3000" > .env; sed -i.bak 's/3000/8080/' .env; cat .env .env.bak   # in-place edit WITH backup
mkdir -p src/a src/b; touch src/a/x.js src/b/y.js src/b/z.test.js
find src -name '*.js' -not -name '*.test.js'
find src -name '*.js' | xargs wc -l | tail -1
find src -name '*.js' -print0 | xargs -0 -n1 echo file:   # -print0/-0 : safe for names with spaces
printf '1\n2\n3\n' | xargs -P3 -I{} sh -c 'echo job {} done'   # 3 in parallel
```

Real output:

```text
--- sed
10.0.0.9 - - [20/Oct/2026:10:00:03 +0000] "POST /api/orders HTTP/1.1" 201 98 0.250
10.0.0.9 - - [20/Oct/2026:10:00:04 +0000] "POST /api/orders HTTP/1.1" 500 45 1.900
x.x.x.x - - [20/Oct/2026:10:00:01 +0000] "GET /api/products?page=1 HTTP/1.1" 200 512 0.034
x.x.x.x - - [20/Oct/2026:10:00:02 +0000] "GET /api/products/42 HTTP/1.1" 200 210 0.012
--- sed -i in place with backup
PORT=8080
PORT=3000
--- find
src/b/y.js
src/a/x.js
--- xargs
0 total
file: src/b/z.test.js
file: src/b/y.js
file: src/a/x.js
--- xargs -P parallel
job 1 done
job 2 done
job 3 done
```

(`0 total` because the lab files are empty; `find` ordering is filesystem order, not alphabetical.)

- `find path -name ... -type f -mmin -5 -size +100M` finds by name/age/size. "What huge files appeared
  in the last hour?" is a classic disk-full triage.
- `xargs` turns lines of stdin into arguments of another command. Without it, `find ... | rm` does nothing
  because `rm` ignores stdin. `-P N` runs N in parallel. Prefer `-print0 | xargs -0` always.
- JSON in the shell: `jq` is the tool; if it is not installed, Node works:
  `echo '{"a":{"b":42}}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).a.b))'`
  printed `42`.

### 2.4 Interview answer

**Interview answer:** "For a quick log investigation I filter with `grep`, extract the status and path
columns with `awk`, and aggregate with `sort | uniq -c | sort -rn`, so I can answer how many 5xx there were,
which endpoint is slow on average, and which client is noisy without leaving the terminal. For bulk
changes I combine `find -print0` with `xargs -0`, and I use `sed -i.bak` so edits are reversible. This is
the first-ten-minutes toolkit before dashboards are consulted."

### 2.5 Follow-ups
- **Q: `grep` vs `awk` vs `sed`?** grep = select lines. sed = stream-edit text (substitute, delete lines).
  awk = column-aware, with variables and arithmetic.
- **Q: Why does `find | xargs rm` break with spaces in names?** xargs splits on whitespace; use
  `-print0 | xargs -0`.
- **Q: Why `sort` before `uniq -c`?** `uniq` collapses only adjacent duplicates.

### 2.6 Common mistakes
- `sed -i` without a backup on a production config. `grep` without `-E`/escaping and getting no matches.
- `cat file | grep x` (works, but `grep x file` is simpler). Parsing JSON logs with awk instead of `jq`.

### 2.7 Revision block

**Key concepts:** filter/extract/aggregate pipeline; `uniq -c` needs `sort`; `-print0|-0`; `-P` for parallel.

**Revision questions**
1. One-liner: top 5 IPs that received 4xx?
2. How do you print only the 3rd column of a CSV with commas?
3. How do you replace `localhost` with `db` in every `.env*` file under a repo safely?
4. What does `grep -B2 -A8 'Error:' app.log` give you?
5. Why does `ls | xargs rm` fail for `my file.txt`?

**Practical task:** generate a 10 000-line fake log with a Node script, then write a script that prints
p50/p95 latency per endpoint using only `awk` and `sort` (hint: sort per key, pick the index).

**Self-assessment**
- [ ] I can compute a status-code histogram from a log.
- [ ] I can explain why `xargs -0` exists.
- [ ] I use `-i.bak` for edits.

---

## Module 3 - Processes, signals and resource inspection [ESSENTIAL]

**Learning objectives**
- Find a Node process, see its memory, threads, open files; stop it politely vs forcefully.
- Read `top`, `free`, `df`, `du`, `vmstat` output and say what is actually wrong.
- Explain SIGTERM vs SIGKILL and what graceful shutdown means (`Week 6 / Day 5 notes`).

### 3.1 Concept and why it matters

A Linux process has a PID, a parent, a state, memory, a list of open file descriptors (fds) and threads.
Your Node server is "just" a process. When production is slow, first you ask the OS: is the CPU pegged
(`top`), is memory running out (`free`, RSS in `ps`), is the disk full (`df`), is the process blocked on
I/O (`vmstat` `b`/`wa`), did something kill it (exit code, `dmesg`, OOM)?

### 3.2 Lab -- run the server and inspect it

```bash
cd /tmp/lab
nohup node server.mjs > server.log 2>&1 &      # nohup: survive hangup, & : background
sleep 1; cat server.log
ps aux | grep -v grep | grep server.mjs
ps -o pid,ppid,stat,rss,vsz,etime,cmd -C node
top -b -n1 | head -12
free -h; df -h / | head -3; du -sh /usr/local /tmp/lab
vmstat 1 3
uptime
```

Real output:

```text
listening on 0.0.0.0:3000 pid=126
--- ps
root         126 21.6  0.2 761380 43288 ?        Sl   06:35   0:00 node server.mjs
    PID    PPID STAT   RSS    VSZ     ELAPSED CMD
    126     118 Sl   43288 761380       00:01 node server.mjs
--- top (batch, 1 iter, head)
top - 06:35:33 up 7 min,  0 user,  load average: 13.87, 10.29, 5.07
Tasks:   5 total,   1 running,   4 sleeping,   0 stopped,   0 zombie
%Cpu(s): 21.8 us, 28.6 sy,  0.0 ni, 32.3 id, 11.3 wa,  0.0 hi,  6.0 si,  0.0 st 
MiB Mem :  15928.8 total,   4552.9 free,   4948.3 used,   6886.7 buff/cache     
MiB Swap:   4096.0 total,   4096.0 free,      0.0 used.  10980.5 avail Mem 

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
      1 root      20   0    2708   1480   1384 S   0.0   0.0   0:00.08 sleep
    118 root      20   0    4336   3460   3212 S   0.0   0.0   0:00.12 bash
    126 root      20   0  761380  43288  36672 S   0.0   0.3   0:00.23 node
--- free/df/du
               total        used        free      shared  buff/cache   available
Mem:            15Gi       4.8Gi       4.4Gi       216Mi       6.7Gi        10Gi
Swap:          4.0Gi          0B       4.0Gi
Filesystem      Size  Used Avail Use% Mounted on
overlay        1007G   43G  914G   5% /
167M	/usr/local
60K	/tmp/lab
--- vmstat
procs -----------memory---------- ---swap-- -----io---- -system-- -------cpu-------
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st gu
 8  4      0 4656940 676808 6381624    0    0 10021 11219 20748   33 16 18 50 17  0  0
 8  2      0 4649128 676960 6384032    0    0     0 16028 22376 37307 26 29 35 10  0  0
 3  3      0 4530304 677240 6511772    0    0 122696 39604 24778 41098 25 30 34 11  0  0
```

(The load average of 13.87 is the Docker Desktop VM being busy while it unpacked the image, not our idle
server. Note that `top`/`free` inside a container show the VM's totals, not the container's limit; read the
cgroup files for the real limit, Module 5.)

**Reading these tools**
- `ps` STAT: `S` sleeping (waiting on I/O or epoll -- normal for an idle Node), `R` running, `D` uninterruptible
  disk wait (bad if many), `Z` zombie. `l` = multi-threaded. `RSS` = real RAM used (KB); `VSZ` = virtual
  address space, which is big and mostly meaningless for Node.
- `top`: `%CPU` 100 on the node process = one core saturated = the event loop is probably blocked
  (Module 6). `load average` is runnable + uninterruptible tasks over 1/5/15 minutes; compare with core
  count (`nproc`). `wa` = CPU waiting on disk.
- `free -h`: look at **available**, not "free". Linux uses spare RAM as page cache (`buff/cache`), so
  "free" is always small and that is healthy.
- `df -h` = disk per filesystem (does it have space?). `du -sh dir` = what is using the space under a dir.
  `du -sh * | sort -h | tail` finds the culprit.
- `vmstat 1`: `r` runnable threads (if >> cores, CPU-starved); `b` blocked on I/O; `si/so` swap in/out
  (any sustained non-zero = memory pressure); `us/sy/id/wa` CPU split. `iostat -x` (package `sysstat`)
  gives per-disk detail; it is not installed in this lab, so it is not demonstrated.

### 3.3 A Node process is not "single threaded" at the OS level

```bash
PID=$(pgrep -f server.mjs)
ls -l /proc/$PID/fd | head -12
grep -E 'VmRSS|Threads' /proc/$PID/status
ps -L -p $PID -o pid,tid,comm | head -12
```

```text
--- /proc
total 0
lr-x------ 1 root root 64 Oct 20 06:35 0 -> /dev/null
l-wx------ 1 root root 64 Oct 20 06:35 1 -> /tmp/lab/server.log
lr-x------ 1 root root 64 Oct 20 06:35 10 -> pipe:[119829]
l-wx------ 1 root root 64 Oct 20 06:35 11 -> pipe:[119829]
lrwx------ 1 root root 64 Oct 20 06:35 12 -> anon_inode:[eventfd]
lrwx------ 1 root root 64 Oct 20 06:35 13 -> anon_inode:[eventpoll]
lr-x------ 1 root root 64 Oct 20 06:35 14 -> pipe:[118844]
l-wx------ 1 root root 64 Oct 20 06:35 15 -> pipe:[118844]
lrwx------ 1 root root 64 Oct 20 06:35 16 -> anon_inode:[eventfd]
lr-x------ 1 root root 64 Oct 20 06:35 17 -> /dev/null
lrwx------ 1 root root 64 Oct 20 06:35 18 -> socket:[112323]
VmRSS:	   43288 kB
Threads:	11
--- threads
    PID     TID COMMAND
    126     126 node
    126     128 node
    126     129 node
    ... (11 threads in total, TIDs 126 and 128-137)
```

What this proves, line by line:
- fd 1 is `server.log`: that is what `> server.log` did. fd 0 is `/dev/null` (stdin from nohup).
- fd 13 is `anon_inode:[eventpoll]` -- the **epoll instance**. This is libuv's I/O poller: the single event loop
  thread asks the kernel "wake me when any of these sockets is readable". fd 18 is `socket:[...]` -- our
  listening socket (Module 4 matches it to port 3000). This is the physical meaning of "Node network
  I/O does not use the thread pool": it is epoll.
- 11 threads = main JS thread + 4 libuv thread-pool workers (`UV_THREADPOOL_SIZE`, default 4; used for
  `fs`, `dns.lookup`, `crypto.pbkdf2/scrypt`, `zlib`) + V8 helper threads (GC, compiler). See
  `Week 2 / Day 2 notes`. So "Node is single-threaded" really means "your JavaScript runs on one thread".

### 3.4 Signals: SIGTERM vs SIGKILL

```bash
curl -s localhost:3000
kill -TERM $PID; sleep 1; cat server.log; pgrep -f server.mjs || echo 'process gone'
nohup node server.mjs > server.log 2>&1 & sleep 1; kill -9 $(pgrep -f server.mjs); sleep 0.5; cat server.log
```

```text
hello from pid 126
--- kill -TERM
listening on 0.0.0.0:3000 pid=126
got SIGTERM, closing
process gone
--- SIGKILL cannot be handled
listening on 0.0.0.0:3000 pid=163
bash: line 25:   163 Killed                  nohup node server.mjs > server.log 2>&1
```

- `kill PID` sends **SIGTERM (15)**: "please stop". Node can handle it (`process.on('SIGTERM')`), finish
  in-flight requests, close DB pools, flush logs, exit 0. Our log shows `got SIGTERM, closing`.
- `kill -9` sends **SIGKILL (9)**: the kernel ends the process immediately; no handler runs (the log has
  no "got SIGTERM" line; the shell reports `Killed`). Exit code seen by the parent: 137 = 128+9.
- `Ctrl+C` = SIGINT (2). Docker `stop` sends SIGTERM, waits 10 s, then SIGKILL; Kubernetes does the same
  with its termination grace period. If your Node ignores SIGTERM, every deploy takes the full timeout and
  then drops in-flight requests.
- **PID 1 gotcha in Docker:** the process started by `CMD` is PID 1; the kernel does not apply default
  signal actions to PID 1, so a Node app without a SIGTERM handler may ignore `docker stop`. Use
  `docker run --init` (or tini) and always register handlers.
- `jobs` lists shell background jobs, `fg`/`bg` move them, `nohup` makes a job ignore SIGHUP (terminal
  closed). For real services use systemd (Module 9), not nohup.

### 3.5 Disk "full" but `du` says it is empty -- deleted-but-open files

Symptom: `df` shows 100% but `du` finds nothing. Cause: a file was deleted (log rotation done wrong) while
a process (Node, nginx) still has it open, so the kernel cannot free the blocks.

```bash
node -e "
const fs=require('fs'); const fd=fs.openSync('/tmp/lab/big.dat','w'); fs.writeSync(fd, Buffer.alloc(50*1024*1024));
fs.unlinkSync('/tmp/lab/big.dat'); console.log('deleted big.dat, pid', process.pid); setTimeout(()=>{}, 8000);" &
sleep 1; ls /tmp/lab/big.dat
lsof -nP +L1 | grep big.dat
```

```text
deleted big.dat, pid 1278
ls: cannot access '/tmp/lab/big.dat': No such file or directory
node    1278 root   17w   REG  0,181 52428800     0 939453 /tmp/lab/big.dat (deleted)
```

`lsof +L1` lists files with link count 0 (deleted but open). The 50 MB is still allocated until process
1278 closes fd 17 or exits. Fix: restart/reload the process (in an emergency truncate it:
`: > /proc/PID/fd/17`).

### 3.6 File descriptor limits -- `EMFILE`

Every socket is an fd. Default per-process limit is often 1024 on a plain server (our container had
1048576). A busy Node server that leaks sockets dies with `EMFILE: too many open files`.

```bash
ulimit -n
(ulimit -n 20; node -e "
const fs=require('fs'); const fds=[];
try { for (let i=0;i<100;i++) fds.push(fs.openSync('/etc/hostname','r')); } catch(e){ console.log('opened',fds.length,'then', e.code, e.message.slice(0,60)); }")
```

```text
1048576
opened 3 then EMFILE EMFILE: too many open files, open '/etc/hostname'
```

(With a limit of 20, Node itself already held 17 fds -- stdio, epoll, pipes, eventfds -- so only 3 more
opens succeeded. "My server handles ~1000 connections then breaks" is the classic 1024 limit.)
Fix: `LimitNOFILE=65535` in the systemd unit (Module 9), `--ulimit nofile=65535:65535` in `docker run`, and fix
leaks (`ls /proc/PID/fd | wc -l` growing over time).

### 3.7 Interview answer

**Interview answer:** "When a Node service misbehaves I look at it from the OS side first. `ps` and
`top` tell me whether the process is CPU-bound -- one core at 100% usually means the event loop is blocked --
`free` tells me about memory, with `available` rather than `free` being the number that matters,
`df` and `du` tell me about disk, and `lsof` or `/proc/PID/fd` show me open files and sockets so I can
spot descriptor leaks. For stopping, I send SIGTERM so the app can drain connections and close its pool,
and I only use SIGKILL as a last resort, because it gives the process no chance to clean up."

### 3.8 Follow-ups
- **Q: Load average 8 on a 4-core box?** Roughly twice as many runnable tasks as cores: saturated. Check
  whether it is CPU (`us/sy`) or I/O (`wa`, `b` column).
- **Q: What does exit code 137 mean?** 128 + 9: killed by SIGKILL, commonly the OOM killer or the `docker stop`
  timeout. 143 = SIGTERM.
- **Q: Zombie process?** A child that exited but the parent has not `wait()`ed for it. Harmless in small
  numbers; many indicate a parent bug (and PID 1 in containers must reap).

### 3.9 Common mistakes
- Reading the `free` column instead of `available`. Using `kill -9` as the first move.
- Believing `top` inside a container shows the container's limits (it shows the host VM).

### 3.10 Revision block

**Key concepts:** process/fd/threads; epoll fd in `/proc`; RSS vs VSZ; available memory; SIGTERM vs
SIGKILL; PID 1 in containers; deleted-but-open files; EMFILE.

**Revision questions**
1. Which fd in `/proc/PID/fd` is libuv's poller and what does it do?
2. Why does Node show 11 threads while being "single-threaded"?
3. `df` says 100% but `du` says 10%. Next command?
4. Why might `docker stop` take 10 seconds on your Node container?
5. What are the four numbers you check first in `vmstat` and what do they mean?

**Practical task:** write a Node server that leaks one socket per request (never ends the response, keeps
the socket in an array). Fire 2000 requests with `xargs -P`, watch `ls /proc/PID/fd | wc -l` grow, and hit
`EMFILE` by lowering `ulimit -n`.

**Self-assessment**
- [ ] I can explain RSS vs VSZ vs available memory.
- [ ] I can find and explain the epoll fd of a Node process.
- [ ] I know why SIGTERM handling matters in Docker.

---

## Module 4 - Lab: "port already in use" and "who holds my port" [ESSENTIAL]

**Learning objectives**
- Diagnose `EADDRINUSE` and `EACCES` on `listen()` end to end and free the port safely.
- Read `ss -ltnp` output (State, Recv-Q, Send-Q, Local Address) fluently.

**Node symptom:** `Error: listen EADDRINUSE: address already in use :::3000` when you run `npm start`
(nodemon restart race, a zombie dev server, two services configured with the same port).

### 4.1 Reproduce it

```bash
cd /tmp/lab
PORT=3000 nohup node server.mjs > s1.log 2>&1 & sleep 1; cat s1.log
PORT=3000 node server.mjs 2>&1 | head -14; echo "rc=${PIPESTATUS[0]}"
```

```text
listening on 0.0.0.0:3000 pid=184
node:events:502
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
    at Server.setupListenHandle [as _listen2] (node:net:1908:16)
    at listenInCluster (node:net:1965:12)
    at doListen (node:net:2139:7)
    at process.processTicksAndRejections (node:internal/process/task_queues:83:21)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1944:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  code: 'EADDRINUSE',
  errno: -98,
rc=1
```

Why `Unhandled 'error' event`: `server.listen()` reports failure by emitting `'error'` on the server;
we registered no handler, so it throws. Production code should do
`server.on('error', (e) => { if (e.code === 'EADDRINUSE') { log.fatal(...); process.exit(1); } })`.
`errno: -98` is the Linux number for `EADDRINUSE`.

### 4.2 Find who holds it (four ways)

```bash
ss -ltnp 'sport = :3000'
lsof -nP -iTCP:3000 -sTCP:LISTEN
fuser -v 3000/tcp
PID=$(lsof -t -iTCP:3000 -sTCP:LISTEN); echo "pid=$PID"; ps -o pid,cmd -p $PID
kill $PID; sleep 0.5; ss -ltn 'sport = :3000'; echo '(empty = free)'
```

```text
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
LISTEN 0      511          0.0.0.0:3000      0.0.0.0:*    users:(("node",pid=184,fd=18))
COMMAND PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    184 root   18u  IPv4 123047      0t0  TCP *:3000 (LISTEN)
                     USER        PID ACCESS COMMAND
3000/tcp:            root        184 F.... node
pid=184
    PID CMD
    184 node server.mjs
State Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
(empty = free)
```

Reading `ss -ltnp`: flags `-l` listening, `-t` TCP, `-n` numeric (no DNS/service names -- faster and
unambiguous), `-p` process (needs root to see other users' processes). **Local Address `0.0.0.0:3000`**
means "all IPv4 interfaces". For a LISTEN socket, **Send-Q = the backlog size** (511 is Node's default) and
Recv-Q = connections waiting to be accepted; a Recv-Q that stays > 0 means the event loop is not calling
`accept()` fast enough (blocked loop, Module 6). `fd=18` is the same fd we saw in `/proc/PID/fd`.
`netstat -tlnp` (old `net-tools`) shows similar data; `ss` replaced it. `lsof -i :3000` is the roadmap's
"who is holding my port?" one-liner. `kill $PID` is SIGTERM -- polite first.

### 4.3 Related port errors

```bash
useradd -m dev
su dev -c 'cd /tmp/lab && PORT=80 node server.mjs 2>&1 | grep -E "Error:|code:"'
su dev -c 'cd /tmp/lab && PORT=3001 timeout 1 node server.mjs'
HOST=127.0.0.1 PORT=4000 nohup node server.mjs > s2.log 2>&1 & sleep 1
HOST=0.0.0.0 PORT=4000 timeout 3 node server.mjs 2>&1 | grep -E "EADDRINUSE|listening" | head -2
ss -ltn 'sport = :4000'
```

This was run in a container started with `--sysctl net.ipv4.ip_unprivileged_port_start=1024`, because
Docker sets that sysctl to `0` by default (we read `0` inside `lx-main`), which lets non-root bind port 80
and hides the problem you will meet on a real server:

```text
--- EACCES: privileged port as non-root
Error: listen EACCES: permission denied 0.0.0.0:80
  code: 'EACCES',
--- non-root on 3001
listening on 0.0.0.0:3001 pid=36
got SIGTERM, closing
--- 127.0.0.1 holder then 0.0.0.0
Error: listen EADDRINUSE: address already in use 0.0.0.0:4000
  code: 'EADDRINUSE',
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
LISTEN 0      511        127.0.0.1:4000      0.0.0.0:*
```

(`got SIGTERM, closing` is `timeout 1` stopping the 3001 server -- timeout sends SIGTERM.)

- **EACCES on `listen`** = ports below 1024 need root (or `CAP_NET_BIND_SERVICE`) on a normal Linux host.
  Do not run Node as root to get port 80. Run Node on 3000 as a normal user and put nginx / a load balancer /
  `-p 80:3000` in front.
- **A socket on `127.0.0.1:4000` blocks `0.0.0.0:4000`** (the wildcard overlaps specific addresses), which
  surprises people: "I bound to localhost, why can't the other service bind all interfaces?".
- `TIME_WAIT` sockets on a port normally do not block a new `listen()` because Node sets
  `SO_REUSEADDR`; a true EADDRINUSE means a live LISTEN socket.

### 4.4 Interview answer

**Interview answer:** "EADDRINUSE means another socket is already listening on that address and port. I
find the owner with `ss -ltnp` or `lsof -i :PORT`, check whether it is a stale copy of my own service or
something else, and stop it with SIGTERM. I also make the server handle the `'error'` event from `listen`
so it logs a clear message and exits non-zero. EACCES on listen is different: ports under 1024 are
privileged, so I run on a high port as a non-root user and let a reverse proxy or the container port
mapping expose 80/443."

### 4.5 Follow-ups
- **Q: Why does nodemon sometimes say EADDRINUSE?** The old process has not released the port when the new
  one starts; the old process ignores SIGTERM or closes slowly.
- **Q: Can two processes share a port?** Yes with `SO_REUSEPORT` (kernel load-balances); Node `cluster`
  shares one listening socket among workers via the parent instead.
- **Q: What does `0.0.0.0` mean when listening vs when connecting?** Listening: all interfaces. As a
  destination it is not a real address; do not rely on it (Module 8).

### 4.6 Revision block

**Key concepts:** EADDRINUSE vs EACCES; `ss -ltnp` columns; backlog; `lsof -i`; `fuser`;
`server.on('error')`.

**Revision questions**
1. Four commands to find the process on port 8080?
2. What are Recv-Q and Send-Q on a LISTEN socket?
3. Why can a non-root Node process bind port 80 inside a default Docker container?
4. Why is `kill -9` a bad first answer to EADDRINUSE?
5. Why does binding to `127.0.0.1:4000` block a later `0.0.0.0:4000`?

**Practical task:** add a startup helper `listenOrDie(server, port)` that logs `{port, code}` for
EADDRINUSE/EACCES and exits 1; test with both failures.

**Self-assessment**
- [ ] I can free a port in under 30 seconds.
- [ ] I can read every column of `ss -ltnp`.
- [ ] I handle `listen` errors in code.

---

## Module 5 - Docker run flags, bridge vs host networking, container DNS; lab "unreachable from another container" [ESSENTIAL]

**Learning objectives**
- Use `-p`, `-e`, `-v`, `--network`, `--memory` and say what each does at the OS level.
- Explain why `localhost` means "this container" and why a server bound to `127.0.0.1` is unreachable.
- Explain user-defined bridge networks and their built-in DNS, vs the default bridge.

### 5.1 Concept and why it matters

A container is a normal Linux process with its own **namespaces** (own PID list, own filesystem view, own
network stack: its own `lo`, `eth0`, routing table, ports) and **cgroups** (resource limits such as memory).
It is not a VM. Because every container has its own network stack, "localhost" inside container A is a
different machine's loopback from "localhost" inside container B. Frontend analogy: it is like two browser
tabs on different origins -- each has its own `window`; you cannot reach across by saying "this".

Setup for these labs (run from a folder that contains `server.mjs` from Lab 0; on Windows Git Bash use
`"$(pwd -W)"`, on Linux/macOS `"$PWD"`):

```bash
export MSYS_NO_PATHCONV=1            # Git Bash only
W="$(pwd -W)"                         # folder containing server.mjs
docker network create lx-net
docker network inspect bridge --format '{{.Name}} {{(index .IPAM.Config 0).Subnet}} gw={{(index .IPAM.Config 0).Gateway}}'
```

```text
08bf231146e4276ae604c5652d49f2b2e5d406d6adc5c0fb44bad8a3f7224297
bridge 172.17.0.0/16 gw=172.17.0.1
```

(The first line is the new network id. `bridge` is Docker's default network; ours is a "user-defined bridge".)

### 5.2 Lab -- "my Node API is unreachable from another container"

**Node symptom:** from the `web` container, `fetch('http://api:3000')` fails with
`ECONNREFUSED` (or `connect ECONNREFUSED 192.168.0.2:3000`), while `curl localhost:3000` from inside the `api`
container works. Classic first docker-compose experience.

Step 1 -- start the API bound to loopback only (`HOST=127.0.0.1`), and a second "client" container:

```bash
docker run -d --name lx-srv --network lx-net -e HOST=127.0.0.1 -e PORT=3000 -v "$W:/w:ro" lx-ubuntu node /w/server.mjs
docker run -d --name lx-cli --network lx-net lx-ubuntu sleep infinity
docker logs lx-srv
docker exec lx-srv curl -sS -m3 localhost:3000
docker exec lx-cli curl -sS -m3 -v http://lx-srv:3000/ 2>&1 | head -12
docker exec lx-srv ss -ltn
docker inspect lx-srv --format '{{(index .NetworkSettings.Networks "lx-net").IPAddress}}'
```

```text
listening on 127.0.0.1:3000 pid=1
--- from inside lx-srv
hello from pid 1
--- from lx-cli by name
* Host lx-srv:3000 was resolved.
* IPv6: (none)
* IPv4: 192.168.0.2
*   Trying 192.168.0.2:3000...
* connect to 192.168.0.2 port 3000 from 192.168.0.3 port 52574 failed: Connection refused
* Failed to connect to lx-srv port 3000 after 43 ms: Couldn't connect to server
* Closing connection
curl: (7) Failed to connect to lx-srv port 3000 after 43 ms: Couldn't connect to server
--- ss inside lx-srv
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
LISTEN 0      4096      127.0.0.11:38437      0.0.0.0:*          
LISTEN 0      511        127.0.0.1:3000       0.0.0.0:*          
--- lx-srv IP
192.168.0.2
```

**Diagnosis, step by step (this is the method to state in an interview):**
1. DNS works: `lx-srv` resolved to `192.168.0.2`. So it is not a naming problem.
2. "Connection refused" (not timeout) = the packet reached the machine and nothing was listening on that
   *address*:port. A firewall drop or wrong IP would give a timeout instead.
3. `ss -ltn` inside the server container: the app listens on `127.0.0.1:3000` -- loopback only, reachable only from
   inside that network namespace. The container's `eth0` is `192.168.0.2`; nobody listens there.
4. `127.0.0.11:38437` is Docker's embedded DNS server (Section 5.4).

Step 2 -- fix: bind to all interfaces, and publish the port to the host:

```bash
docker rm -f lx-srv
docker run -d --name lx-srv --network lx-net -e HOST=0.0.0.0 -e PORT=3000 -p 18080:3000 -v "$W:/w:ro" lx-ubuntu node /w/server.mjs
docker exec lx-srv ss -ltn
docker exec lx-cli curl -sS -m3 http://lx-srv:3000/
curl -sS -m3 http://localhost:18080/          # from the Windows host
```

```text
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
LISTEN 0      4096      127.0.0.11:40405      0.0.0.0:*          
LISTEN 0      511          0.0.0.0:3000       0.0.0.0:*          
hello from pid 1
--- Windows host via -p 18080
hello from pid 1
```

Fix in code: `app.listen(port, '0.0.0.0')` (or omit host: Node then listens on `::` which accepts IPv4 too if the
kernel allows dual-stack). Common config: `HOST` env with default `0.0.0.0` in containers, `127.0.0.1` only for
local dev when you deliberately want to hide the service.

**The same bug, seen from the host: `-p` + a loopback-bound server.**

```bash
docker run -d --name lx-loop -p 18081:3000 -e HOST=127.0.0.1 -v "$W:/w:ro" lx-ubuntu node /w/server.mjs
curl -sS -m3 http://localhost:18081/ ; echo "curl rc=$?"
```

```text
curl: (52) Empty reply from server
curl rc=52
```

The port mapping is working (Docker's proxy accepted the TCP connection), but when it forwarded the traffic to
the container's `eth0:3000`, nothing was listening there, so it closed the connection: `Empty reply`. This
is a *different* symptom for the same root cause. Memorise both: `ECONNREFUSED` between containers,
`Empty reply from server` / `ECONNRESET` through `-p`.

### 5.3 The docker run flags that matter

| Flag | What it does underneath | Node-relevant example |
|------|-------------------------|-----------------------|
| `-p HOSTPORT:CONTAINERPORT` | Docker sets up NAT/proxy: host `:18080` -> container `:3000`. Only needed for traffic from OUTSIDE Docker (host/browser). Container-to-container traffic on the same network does NOT need `-p`. | `-p 18080:3000`; `-p 127.0.0.1:18080:3000` publishes to loopback of the host only (safer for DBs) |
| `-e NAME=value` | Sets an environment variable (`process.env.NAME`). `--env-file .env` loads many. Never bake secrets into the image. | `-e HOST=0.0.0.0 -e PORT=3000` |
| `-v SRC:DST[:ro]` | Bind-mount host dir or a named volume into the container. `:ro` = read-only. Data in the container filesystem is lost when the container is removed; a volume persists. | `-v "$W:/w:ro"` |
| `--network NAME` | Which virtual network (bridge, user-defined bridge, `host`, `none`). | `--network lx-net` |
| `--memory 128m` | cgroup memory limit; exceed it and the kernel OOM-kills the process (exit 137). | below |
| `--init`, `--user`, `--ulimit`, `--restart` | tini as PID 1; non-root user; fd limits; restart policy. | `--user node` |

Proof of `-e` and `-v :ro`:

```bash
docker run --rm -e GREETING=hi -v "$W:/w:ro" lx-ubuntu bash -c 'echo $GREETING; ls /w | head -3; touch /w/x 2>&1'
```

```text
hi
Dockerfile
l1.sh
l2.sh
touch: cannot touch '/w/x': Read-only file system
```

**`--memory` and Node.** Allocate 10 MB every 50 ms inside a 64 MB limit:

```bash
docker run --rm --name lx-oom --memory 64m --memory-swap 64m lx-ubuntu node -e 'const a=[];setInterval(()=>{a.push(Buffer.alloc(10*1024*1024,1)); console.log("alloc",a.length*10,"MB")},50)' | tail -4; echo "rc=${PIPESTATUS[0]}"
docker run -d --name lx-mem --memory 128m lx-ubuntu sleep 30; docker exec lx-mem cat /sys/fs/cgroup/memory.max
docker run --rm --memory 128m lx-ubuntu node -e 'console.log(Math.round(require("v8").getHeapStatistics().heap_size_limit/1048576),"MB heap limit")'
docker run --rm lx-ubuntu node -e 'console.log(Math.round(require("v8").getHeapStatistics().heap_size_limit/1048576),"MB heap limit (no flag)")'
```

```text
alloc 20 MB
alloc 30 MB
alloc 40 MB
alloc 50 MB
rc=137
134217728
259 MB heap limit
4144 MB heap limit (no flag)
```

- The process died with **exit code 137 and no JavaScript error**: the kernel OOM killer sent SIGKILL when the
  cgroup hit 64 MB (`alloc 50 MB` was the last line). There was no stack trace because SIGKILL cannot be caught.
  Diagnosis: `docker inspect --format '{{.State.OOMKilled}}' NAME` -> `true`, `docker events`, `dmesg`.
- `/sys/fs/cgroup/memory.max` is the real limit (`134217728` = 128 MiB). `free` and `top` do not show it.
- **Important Node gotcha:** with `--memory 128m` Node 20 still computed a **259 MB** V8 heap limit (the "no flag" host
  VM gave 4144 MB), i.e. larger than the container limit. A leaking app is therefore killed by the OOM killer
  (137) *before* V8 can print a friendly "heap out of memory". Set `--max-old-space-size` to roughly 75 percent
  of the container limit (e.g. `NODE_OPTIONS=--max-old-space-size=96` for 128m) so Node fails with a
  diagnosable error/heap snapshot instead. (Version-dependent: newer Node versions change the defaults
  and these numbers.) See `Week 2 / Day 6 notes` for GC and leaks.

### 5.4 Bridge, user-defined bridge, host: and container DNS

**Default `bridge` network:** containers get 172.17.x.x addresses and can reach each other by IP, but there is
**no name resolution**. Test:

```bash
docker run -d --name lx-old1 lx-ubuntu sleep infinity; docker run -d --name lx-old2 lx-ubuntu sleep infinity
docker exec lx-old1 curl -sS -m3 http://lx-old2:3000/ 2>&1
docker exec lx-old1 cat /etc/resolv.conf | grep -v '^#'
docker exec lx-old1 ip -4 addr show eth0 | grep inet
```

```text
curl: (28) Resolving timed out after 3001 milliseconds

nameserver 192.168.65.7
    inet 172.17.0.7/16 brd 172.17.255.255 scope global eth0
```

The default bridge copies the host's resolver (`192.168.65.7` is Docker Desktop's), which has never heard of
`lx-old2`, so the name lookup times out. (Not "connection refused": it never even got an IP.)

**User-defined bridge (`docker network create`, and every docker-compose project):** Docker runs an embedded DNS
server at `127.0.0.11` that resolves container names/service names to their IPs on that network.

```bash
docker exec lx-cli cat /etc/resolv.conf
docker exec lx-cli dig +short lx-srv
docker exec lx-cli getent hosts lx-srv
docker exec lx-cli dig lx-srv | sed -n '1,20p'
```

```text
# Generated by Docker Engine.
# This file can be edited; Docker Engine will not make further changes once it
# has been modified.

nameserver 127.0.0.11
options ndots:0

# Based on host file: '/etc/resolv.conf' (internal resolver)
# ExtServers: [host(192.168.65.7)]
# Overrides: []
# Option ndots from: internal
192.168.0.2
192.168.0.2     lx-srv
; <<>> DiG 9.18.39-0ubuntu0.24.04.8-Ubuntu <<>> lx-srv
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 58799
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0

;; QUESTION SECTION:
;lx-srv.				IN	A

;; ANSWER SECTION:
lx-srv.			600	IN	A	192.168.0.2

;; Query time: 4 msec
;; SERVER: 127.0.0.11#53(127.0.0.11) (UDP)
;; WHEN: Tue Oct 20 06:40:11 UTC 2026
;; MSG SIZE  rcvd: 46
```

Meaning: inside a container `nameserver 127.0.0.11` is Docker's DNS: names of containers on the same
user-defined network resolve; anything else (`example.com`) is forwarded to the host's resolver
(`ExtServers`). This is why in docker-compose your app connects to host `db`, `redis`, `api` -- the
service names -- not `localhost`. The resolved IP changes when the container is recreated, so never hard-code IPs.

**Host networking (`--network host`):** the container shares the host's network namespace -- no isolation, no
`-p` needed, a server on `PORT=18082` binds directly to the host's interfaces. On a Linux server this is
`localhost` of the real machine. Real test on Docker Desktop:

```bash
docker run -d --name lx-host --network host -e PORT=18082 -v "$W:/w:ro" lx-ubuntu node /w/server.mjs
docker logs lx-host; docker exec lx-host ip -br addr | head -4; curl -sS -m3 http://localhost:18082/; echo "win curl rc=$?"
docker exec lx-host curl -sS -m3 localhost:18082
```

```text
listening on 0.0.0.0:18082 pid=1
lo               UNKNOWN        127.0.0.1/8 ::1/128 
services1@if2    UP             192.168.65.6/32 fdc4:f303:9324::6/128 fe80::a817:3fff:fe67:5166/64 
eth0             UNKNOWN        192.168.65.3/24 fdc4:f303:9324::3/64 fe80::ecb7:59ff:fe4c:29a3/64 
br-d57aa75a86cf  DOWN           172.26.0.1/16 
curl: (7) Failed to connect to localhost:18082 after 2239 ms: Could not connect to server
win curl rc=7
hello from pid 1
```

`ip -br addr` inside the "host-network" container lists `docker0`, many `br-...` bridges and the VM's `eth0`:
it sees the host (here, Docker Desktop's Linux VM) interfaces, not an isolated stack. The request from inside
works. But the **Windows** `localhost:18082` fails, because on Docker Desktop "host" means the hidden Linux VM,
not Windows (newer Docker Desktop has an opt-in "host networking" setting; not tested here). On a real Linux
server `--network host` really is the machine. Takeaways: host mode is a Linux-server feature, loses port
isolation and the `-p` mapping, and is mainly for performance-sensitive or special-protocol cases. Default
to a user-defined bridge.

**Summary of "localhost" confusion**

| From -> To | Works with `localhost`? | Use |
|-----------|-------------------------|-----|
| Browser on host -> container with `-p 18080:3000` | yes: `localhost:18080` (host port!) | host port |
| Container A -> container B (same user-defined network) | no, `localhost` = A itself | `http://B:3000` (service name, container port) |
| Container -> service on the developer's host machine | no | `host.docker.internal` (Docker Desktop) or host gateway IP (`--add-host=host.docker.internal:host-gateway`) |
| Server inside container binds `127.0.0.1` | nobody else can reach it | bind `0.0.0.0` |

### 5.5 Interview answer

**Interview answer:** "Each container has its own network namespace, so `localhost` inside a container is the
container itself. For container-to-container traffic I put both on a user-defined bridge network, where
Docker's embedded DNS at 127.0.0.11 resolves service names, and I connect to `http://api:3000` using the
container port. `-p host:container` is only needed to expose a service to the outside. If a service is
unreachable I check three things in order: does the name resolve (`dig`/`getent`), is it a refused
connection versus a timeout, and what address is the process actually bound to (`ss -ltn`) -- a server bound to
127.0.0.1 inside a container cannot be reached by anyone else, so the fix is to bind 0.0.0.0."

### 5.6 Follow-ups
- **Q: Does container-to-container need `-p`?** No. `-p` is for host/outside access. Containers on the same
  network reach each other's container ports directly.
- **Q: How do I debug a container with no tools?** Run a sidecar sharing its network namespace:
  `docker run --rm -it --network container:NAME nicolaka/netshoot` (not run here), or `docker exec` with
  `apt install`.
- **Q: Why does my container die with 137 and no error?** OOM kill or SIGKILL; check `docker inspect` for
  `OOMKilled`, raise `--memory` or fix the leak, and set `--max-old-space-size`.
- **Q: Bridge vs host vs none?** Bridge = isolated stack with NAT to the outside; host = shares the host stack;
  none = only loopback.

### 5.7 Common mistakes
- `localhost` in a connection string inside a container (DB, Redis, other API).
- Publishing databases with `-p 3306:3306` on a public server (exposed to the internet; bind `127.0.0.1:` or do
  not publish). Using the container port instead of the service name+container port. Putting secrets in `-e`
  shown by `docker inspect` (use secrets managers in production).

### 5.8 Revision block

**Key concepts:** namespaces and cgroups; `-p`, `-e`, `-v`, `--network`, `--memory`; user-defined bridge DNS
(127.0.0.11); refused vs timeout vs empty reply; 137; host mode.

**Revision questions**
1. Why does a Node server bound to `127.0.0.1` fail from another container and what is the error?
2. What is the difference between `ECONNREFUSED`, a timeout, and `ENOTFOUND`?
3. When do you need `-p` and when not?
4. What does 137 with no stack trace mean, and how do you confirm it?
5. Why do container names resolve on `docker network create` networks but not on the default bridge?

**Practical task:** write a `docker-compose.yml` with `api` (Node) and `redis`; make the API connect via
`redis://redis:6379`; then deliberately break it three ways (use `localhost`, bind `127.0.0.1`, wrong network)
and record the exact error for each.

**Self-assessment**
- [ ] I can explain each of the three failure symptoms.
- [ ] I can name what is at 127.0.0.11.
- [ ] I set `--max-old-space-size` below the container limit.

---

## Module 6 - TCP in practice: handshake, TIME_WAIT, CLOSE_WAIT, strace and a blocked event loop [ESSENTIAL]

**Learning objectives**
- Explain the three-way handshake, connection teardown, and why `TIME_WAIT` exists, using a real packet capture.
- Read `ss -s`/`ss -tan` states and tell TIME_WAIT (normal) from CLOSE_WAIT (a bug).
- Use `strace` to watch a Node server do `accept4`, `epoll`, `read`, `writev`, and to prove fs work runs on a
  different thread than network I/O.

### 6.1 Concept: what TCP gives you

TCP is a reliable, ordered byte stream between two sockets. A **socket** is identified by the 4-tuple
`(client IP, client port, server IP, server port)`. The server's `listen()` socket only *accepts*; each accepted
connection becomes a new socket with its own fd (the `fd=19` you will see in strace). HTTP is just text sent
over such a stream.

**Three-way handshake:** `SYN` (client: "I want to talk, my starting sequence number is X") -> `SYN-ACK`
(server: "ok, mine is Y, I got your X") -> `ACK` (client: "got Y"). Cost: one network round trip before any
byte of HTTP. Real capture of one `curl localhost:3000/fixed` on loopback (`tcpdump -i lo -n -tt -S port 3000`):

```text
 IP6 ::1.51296 > ::1.3000: Flags [S], seq 207254076, win 65476, options [mss 65476,sackOK,TS val 2058002937 ec
 IP6 ::1.3000 > ::1.51296: Flags [R.], seq 0, ack 207254077, win 0, len 0
 IP 127.0.0.1.40032 > 127.0.0.1.3000: Flags [S], seq 87010993, win 65495, options [mss 65495,sackOK,TS val 181
 IP 127.0.0.1.3000 > 127.0.0.1.40032: Flags [S.], seq 4167868736, ack 87010994, win 65483, options [mss 65495,
 IP 127.0.0.1.40032 > 127.0.0.1.3000: Flags [.], ack 4167868737, win 64, options [nop,nop,TS val 1811526065 ec
 IP 127.0.0.1.40032 > 127.0.0.1.3000: Flags [P.], seq 87010994:87011076, ack 4167868737, win 64, options [nop,
 IP 127.0.0.1.3000 > 127.0.0.1.40032: Flags [.], ack 87011076, win 64, options [nop,nop,TS val 232521915 ecr 1
 IP 127.0.0.1.3000 > 127.0.0.1.40032: Flags [P.], seq 4167868737:4167868865, ack 87011076, win 64, options [no
 IP 127.0.0.1.40032 > 127.0.0.1.3000: Flags [.], ack 4167868865, win 64, options [nop,nop,TS val 1811526067 ec
 IP 127.0.0.1.40032 > 127.0.0.1.3000: Flags [F.], seq 87011076, ack 4167868865, win 64, options [nop,nop,TS va
 IP 127.0.0.1.3000 > 127.0.0.1.40032: Flags [F.], seq 4167868865, ack 87011077, win 64, options [nop,nop,TS va
 IP 127.0.0.1.40032 > 127.0.0.1.3000: Flags [.], ack 4167868866, win 64, options [nop,nop,TS val 1811526073 ec
```

(Timestamp column removed; lines truncated at 110 characters.) How to read it:
- Lines 3-5: `[S]` -> `[S.]` -> `[.]` = SYN, SYN-ACK, ACK: the handshake. (`.` means ACK.)
- Line 6 `[P.]` 82 bytes client -> server (`87010994:87011076`) = the HTTP request; line 8 `[P.]` 128 bytes back
  = the HTTP response. `[.]` lines are pure ACKs.
- Lines 10-12: `[F.]` FIN from the client, `[F.]` FIN from the server, final ACK = the four-way teardown
  (each direction is closed separately).
- Lines 1-2 are the bonus: curl tried `localhost` -> `::1` (IPv6) first; the Node server was listening on
  IPv4 `0.0.0.0` only, so the kernel answered with `[R.]` (RST: "nothing here") and curl immediately retried on
  `127.0.0.1`. That is the `localhost` vs `127.0.0.1` story in Module 8, visible on the wire.

**Why TIME_WAIT exists.** The side that closes first (sends the first FIN) ends up in `TIME_WAIT` for 60 s on
Linux (2 x MSL, "maximum segment lifetime"). Reasons: (1) if the final ACK is lost, the peer retransmits its FIN
and we must still be around to re-ACK it; (2) stray delayed packets from the OLD connection must die out before
the same 4-tuple is reused, otherwise they could be mistaken for data of a NEW connection. TIME_WAIT is not a
leak -- it is the protocol protecting correctness. It becomes a problem only when you create *very many*
short connections, because each TIME_WAIT holds a (client IP, client port, server IP, server port) tuple and a
client has only ~28 000 ephemeral ports (`32768-60999`) per destination.

### 6.2 Lab -- generate and see TIME_WAIT (Node symptom: "connect EADDRNOTAVAIL" / ephemeral port exhaustion)

A client making a **new TCP connection for every request** (the Node default `http.Agent` has `keepAlive: false`
in Node 18 and earlier; Node 19+ defaults to keep-alive for the global agent, but custom `new http.Agent()`s
and many libraries still do not) versus one that reuses connections.

```bash
cd /tmp/lab
cat > client.mjs <<'X'
import http from 'node:http';
const mode = process.argv[2];           // "close" | "keepalive"
const N = Number(process.argv[3] || 20);
const agent = new http.Agent({ keepAlive: mode === 'keepalive', maxSockets: 1 });
function get() {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: 3000, path: '/', agent }, res => { res.resume(); res.on('end', resolve); }).on('error', reject);
  });
}
for (let i = 0; i < N; i++) await get();
console.log(mode, 'done', N, 'requests');
agent.destroy();
X
nohup node server.mjs > server.log 2>&1 &
tw() { echo $(( $(ss -tan state time-wait | wc -l) - 1 )); }
echo "baseline: $(tw)"
node client.mjs close 20
ss -tan state time-wait | head -4; echo "TIME_WAIT count: $(tw)"
ss -tano state time-wait | head -3
echo "before keepalive run: $(tw)"; node client.mjs keepalive 20; echo "after 20 keep-alive requests: $(tw)"
node client.mjs close 200; echo "after 200 more non-keepalive: $(tw)"
```

```text
--- baseline
1
--- 20 requests, new TCP connection each (keepAlive=false)
close done 20 requests
Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
0      0          127.0.0.1:60696    127.0.0.1:3000       
0      0          127.0.0.1:60700    127.0.0.1:3000       
0      0          127.0.0.1:60702    127.0.0.1:3000       
TIME_WAIT count (minus header): 20
--- timer on a TIME_WAIT socket (60s)
Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess                  
0      0          127.0.0.1:60696    127.0.0.1:3000 timer:(timewait,59sec,0)
0      0          127.0.0.1:60700    127.0.0.1:3000 timer:(timewait,59sec,0)
TIME_WAIT before keepalive run: 20
keepalive done 20 requests
TIME_WAIT after 20 keep-alive requests: 21
--- 200 more non-keepalive requests
close done 200 requests
TIME_WAIT: 221
```

(The raw `ss ... | wc -l` printed `1` at baseline because `ss` always prints one header line, i.e. zero
sockets; the `tw()` helper subtracts it. The run above was done with the raw `wc -l` first, then `tw()`.)

What you learned from the numbers:
- 20 requests without keep-alive = **20 connections = 20 TIME_WAIT sockets**, each with a `timer:(timewait,59sec,0)`
  countdown. 200 more -> 221 total.
- 20 requests over a keep-alive agent with `maxSockets: 1` = **1 connection**: the count went from 20 to 21 only
  because `agent.destroy()` at the end closed that one socket. 20x fewer handshakes, 20x fewer TIME_WAIT.
- The TIME_WAIT sockets are on the *client* side (local port = ephemeral 60696...) because the client closed
  first. Rule: whoever closes first holds TIME_WAIT. If your **server** closes idle connections or sends
  `Connection: close`, the server accumulates them.
- Mitigations in order of preference: **connection reuse (keep-alive / pooling)**, then a bigger ephemeral port
  range, `net.ipv4.tcp_tw_reuse=1` for outgoing connections. Do not reach for `tcp_tw_recycle` (removed from Linux)
  or "disable TIME_WAIT".

### 6.3 CLOSE_WAIT: the one that IS a bug

```bash
cat > leak2.mjs <<'X'
import net from 'node:net';
net.createServer({ allowHalfOpen: true }, (sock) => { sock.on('data', () => {}); }).listen(3000, '0.0.0.0');
X
nohup node leak2.mjs >/dev/null 2>&1 &
node -e "
const net=require('net');
for(let i=0;i<3;i++){const s=net.connect(3000,'127.0.0.1',()=>s.end('hi'));s.on('data',()=>{});}
setTimeout(()=>{},6000)" &
sleep 1.5
ss -tan | awk 'NR==1 || /CLOSE-WAIT|FIN-WAIT/'
lsof -nP -iTCP:3000 -sTCP:CLOSE_WAIT | head -3 | cut -c1-100
```

```text
State      Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
FIN-WAIT-2 0      0          127.0.0.1:34742    127.0.0.1:3000        
FIN-WAIT-2 0      0          127.0.0.1:34756    127.0.0.1:3000        
FIN-WAIT-2 0      0          127.0.0.1:34764    127.0.0.1:3000        
CLOSE-WAIT 0      0          127.0.0.1:3000     127.0.0.1:34742       
CLOSE-WAIT 0      0          127.0.0.1:3000     127.0.0.1:34764       
CLOSE-WAIT 0      0          127.0.0.1:3000     127.0.0.1:34756       
COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    1622 root   19u  IPv4 426706      0t0  TCP 127.0.0.1:3000->127.0.0.1:34742 (CLOSE_WAIT)
node    1622 root   20u  IPv4 426707      0t0  TCP 127.0.0.1:3000->127.0.0.1:34756 (CLOSE_WAIT)
```

The client sent FIN (`.end()`), so the client side is `FIN-WAIT-2` ("waiting for the peer to close its half")
and the server side is `CLOSE-WAIT` ("the peer closed; waiting for MY application to call close()").
`allowHalfOpen: true` made Node leave closing to our code, and our code never calls `socket.end()`. The
server process holds those fds forever -- `lsof` points at the owner. Interpretation rule:

| Many sockets in... | Meaning |
|--------------------|---------|
| `TIME_WAIT` | normal after many short connections; fix by reusing connections |
| `CLOSE_WAIT` | **your app is not closing sockets** it received FIN on (leak; eventually EMFILE) |
| `SYN_SENT` | you are connecting out and not getting answers (see below) |
| `SYN_RECV` | many half-open inbound connections (SYN flood or overloaded accept queue) |
| `ESTABLISHED` huge | too many live connections: pool/leak/keep-alive timeouts too long |

(`allowHalfOpen` is off by default for `net.Server`, where Node auto-closes. HTTP servers can still leak
CLOSE_WAIT through response streams that are never ended or sockets stored in a global array.)

**Refused vs blackhole (SYN_SENT):**

```bash
curl -s -m2 http://127.0.0.1:3999/ ; echo "closed port rc=$? (7 = refused, instant)"
curl -s -m2 http://10.255.255.1:3000/ ; echo "blackhole rc=$? (28 = timeout)"
(curl -s -m3 http://10.255.255.1:3000/ &) ; sleep 1; ss -tan state syn-sent
```

```text
closed port rc=7 (7 = refused, instant)
blackhole rc=28 (28 = timeout)
Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
0      1         172.17.0.6:56220 10.255.255.1:3000
```

Closed port -> the kernel replies RST immediately -> `ECONNREFUSED`. Unreachable/firewalled -> SYNs vanish; the socket
sits in `SYN-SENT` (Send-Q 1 = one unacknowledged SYN) until a timeout. **In Node this is why you must set
connect timeouts**: without one, a dead dependency makes requests hang for the OS default (about 2 minutes) and
pile up (see `Week 6 / Day 3 notes` on timeouts).

### 6.4 Lab -- trace a Node HTTP server with strace

Goal: see the "single-threaded event loop with epoll" claim as actual system calls, and see which thread
does what.

```bash
SP=$(pidof node); echo "server pid=$SP"      # after: nohup node fsserver.mjs  (below)
strace -f -o fs.strace -e trace=accept4,openat,read,writev -p $SP & STP=$!
sleep 1; curl -s localhost:3000 >/dev/null; sleep 1; kill -INT $STP; wait $STP
grep -E 'accept4|hostname|writev|read\(' fs.strace | grep -vE 'EAGAIN|read\(16' | head -10
```

For the fs part, `fsserver.mjs` reads a file on every request:

```js
import http from 'node:http';
import { readFile } from 'node:fs/promises';
http.createServer(async (req, res) => {
  const data = await readFile('/etc/hostname');
  res.end(data);
}).listen(3000, '0.0.0.0', () => console.log('fs server pid', process.pid));
```

```text
server pid=544
strace: Process 544 attached with 11 threads
... (detach messages)
544   accept4(18, NULL, NULL, SOCK_CLOEXEC|SOCK_NONBLOCK) = 19
544   read(19, "GET / HTTP/1.1\r\nHost: localhost:"..., 65536) = 77
555   openat(AT_FDCWD, "/etc/hostname", O_RDONLY|O_CLOEXEC) = 20
554   read(20, "ccfd854c97ae\n", 13)    = 13
544   writev(19, [{iov_base="HTTP/1.1 200 OK\r\nDate: Tue, 20 O"..., iov_len=123}, {iov_base="ccfd854c97ae\n", iov_len=13}, {iov_base="", iov_len=0}], 3) = 136
544   read(19, "", 65536)               = 0
```

The first column is the thread id. It is the whole Node architecture in 6 lines:
- **Thread 544 (main = the JS thread)** does `accept4` (new connection becomes fd 19, `SOCK_NONBLOCK`),
  `read` of the request (77 bytes), and `writev` of the response. Network I/O is non-blocking and on the main
  thread, driven by epoll -- **no thread pool for sockets**.
- `readFile` was executed by **threads 555 (`openat`) and 554 (`read`)** -- two different libuv thread-pool
  workers -- because file system calls are blocking and Node offloads them to the pool. When they finish they
  wake the main thread (the `read(16, "\1\0...")` eventfd lines we filtered out).
- `read(19, "", ...) = 0` is the client closing the connection (EOF = 0 bytes).

Syscall summary over 200 requests (`strace -f -c -p $SP`, then `kill -INT`):

```text
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 93.30   13.440050        3863      3479       421 futex
  3.23    0.464574         197      2358           epoll_pwait
  1.11    0.159643         198       806           write
  0.68    0.097552          69      1407           read
  0.35    0.050880         253       201           openat
  0.24    0.035206         176       200           writev
  0.21    0.030651          76       400           epoll_ctl
  0.21    0.029691         148       200           shutdown
  0.18    0.025344         126       200           accept4
  0.15    0.021566         197       109           mprotect
```

200 requests -> exactly 200 `accept4`, 200 `openat`, 200 `writev`, 200 `shutdown` (the curl default is a new
connection per process) and 400 `epoll_ctl` (add and delete each socket). `futex` dominates "time" because it
is idle worker threads sleeping -- strace's `-f` time column counts blocked time, so do not read it as
CPU cost. `epoll_pwait` is the event loop waiting for events: the idle heartbeat of Node.

The same trace taken on the first plain server (single-thread case) showed the whole connection life on one
thread: `accept4` -> `epoll_ctl ADD` -> `read` -> `writev` -> `read = 0` -> `shutdown(SHUT_WR)` ->
`epoll_ctl DEL` -> `close`.

### 6.5 Lab -- "my server stopped answering but the process is alive": a blocked event loop

```bash
cat > spin.mjs <<'X'
import http from 'node:http';
http.createServer((req, res) => {
  if (req.url === '/spin') { const end = Date.now() + 60000; while (Date.now() < end); }
  res.end('ok\n');
}).listen(3000, '0.0.0.0', () => console.log('spin server pid', process.pid));
X
nohup node spin.mjs > spin.log 2>&1 &
SP=$(pgrep -f 'node spin.mjs')
(curl -s -m 8 localhost:3000/spin >/dev/null &) ; sleep 1
curl -s -m 2 -o /dev/null -w 'second request: http=%{http_code} time=%{time_total}s\n' localhost:3000/ || echo "second request timed out (curl rc=$?)"
top -b -n1 -p $SP | tail -2
timeout 2 strace -p $SP 2>&1 | head -5
ss -ltn 'sport = :3000'
```

```text
second request: http=000 time=2.001773s
second request timed out (curl rc=28)
top for that pid:
    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    501 root      20   0 1025316  49544  40896 R 100.0   0.3   0:03.37 node
strace main thread 2s:
strace: Process 501 attached
getpid()                                = 501
getpid()                                = 501
getpid()                                = 501
getpid()                                = 501
ss -ltn:
State  Recv-Q Send-Q Local Address:Port Peer Address:PortProcess
LISTEN 1      511          0.0.0.0:3000      0.0.0.0:*
```

Fingerprint of a blocked event loop, all four signals agree:
1. A trivial request (`/`) times out although the port is open (`LISTEN`) -- the kernel completes handshakes into
   the backlog without Node's involvement.
2. `top`: state `R`, `%CPU` **100.0**: one core fully busy running JavaScript.
3. `strace`: no `epoll_pwait`, no `accept4`, no `read`/`write` on sockets; the main thread is not going back to
   the event loop (the only syscall we saw was a cheap, repeated `getpid()` -- no socket I/O at all; we did not
   investigate where Node issues it, and you do not need to).
4. `ss -ltn`: **Recv-Q = 1** on the LISTEN socket: one connection finished the handshake and is sitting in the
   accept queue because nobody calls `accept()`. (Compare Recv-Q 0 in Module 4 when healthy.)

Compare to a healthy-but-slow service: low `%CPU`, `epoll_pwait` appears constantly, requests wait on a
database/HTTP dependency. Different fix: timeouts/pool tuning instead of moving CPU work to worker threads.
See `Week 2 / Day 2 notes` (blocking vs non-blocking) and `Week 6 / Day 6 notes`.

### 6.6 Interview answer

**Interview answer:** "TCP connects with a three-way handshake -- SYN, SYN-ACK, ACK -- costing one round trip, and
closes with FINs in each direction. The side that closes first sits in TIME_WAIT for about 60 seconds, which
exists so the final ACK can be retransmitted and so old packets from a previous connection cannot corrupt a new
one on the same four-tuple. Lots of TIME_WAIT just means lots of short-lived connections, and the fix is
connection reuse -- keep-alive and pooling -- not disabling TIME_WAIT. CLOSE_WAIT is different: the peer has
closed and my application has not, so that is a leak in my code. I would confirm either with `ss -tan` and
`lsof`, and I use `strace` to see what a process is doing at the syscall level: a healthy Node server shows
`epoll_wait`, `accept4`, `read` and `writev` on one thread, with file operations on pool threads."

### 6.7 Follow-ups
- **Q: What is the backlog / SYN queue?** Two queues: SYN queue (half-open, after SYN) and accept queue
  (handshake finished, waiting for `accept()`). Node's `listen` backlog default is 511 (capped by `net.core.somaxconn`).
  A full accept queue means dropped/ignored connections -> client timeouts.
- **Q: Does TIME_WAIT hurt the server accepting connections?** A server's *listening* port is not exhausted by TIME_WAIT (each
  entry has a distinct client tuple); the exhaustion risk is mostly on **clients/proxies** opening many connections to one
  destination (ephemeral port range). A reverse proxy to one upstream is the classic victim.
- **Q: What does `SO_REUSEADDR` do?** Lets a new `listen()` bind a port that has old TIME_WAIT sockets. Node sets it.
- **Q: Why did the first curl attempt `::1`?** `localhost` resolved to both `::1` and `127.0.0.1`; clients try them
  (Happy Eyeballs). Details in Module 8.
- **Q: What is a SYN flood?** An attacker sends many SYNs and never completes handshakes, filling the SYN queue.
  SYN cookies mitigate it.

### 6.8 Common mistakes
- Creating a new `http.Agent`/axios instance per request, or using a client with keep-alive disabled.
- Setting `tcp_tw_recycle`/"disabling TIME_WAIT" instead of reusing connections.
- Ignoring CLOSE_WAIT growth until `EMFILE`. No connect timeout on outbound calls.

### 6.9 Revision block

**Key concepts:** 4-tuple; SYN/SYN-ACK/ACK; FIN teardown; TIME_WAIT (who closes first, 60 s, why);
CLOSE_WAIT = app bug; refused vs timeout; syscalls `accept4/epoll/read/writev`; thread-pool vs main thread;
blocked-loop fingerprint (100% CPU + Recv-Q > 0 + no epoll).

**Revision questions**
1. Draw the handshake and the teardown. Which side gets TIME_WAIT?
2. 30 000 TIME_WAIT on a proxy talking to one upstream: what breaks, what fixes it?
3. Many CLOSE_WAIT sockets: whose bug, and how do you find which fds?
4. What does `Recv-Q > 0` on a LISTEN socket indicate?
5. In strace which thread does `readFile` run on versus the HTTP `read`, and why?

**Practical task:** write a load script (Node, `undici` Pool vs `http.Agent({keepAlive:false})`) hitting a local
server 5000 times; record TIME_WAIT count, total time and `ss -s` for both; write a 5-line conclusion.

**Self-assessment**
- [ ] I can narrate the handshake and teardown from a tcpdump.
- [ ] I can tell TIME_WAIT from CLOSE_WAIT and say what each means.
- [ ] I can recognise a blocked event loop from `top` + `ss` + `strace`.

---

## Module 7 - HTTP on the wire: keep-alive, chunked encoding, and connection pool vs socket vs request [ESSENTIAL]

**Learning objectives**
- Show keep-alive and chunked transfer with `curl -v`.
- Explain exactly where a request waits: in the client pool queue, on the socket, in the server accept queue,
  or in the event loop.

### 7.1 Concept and why it matters

HTTP/1.1 is a text protocol on top of a TCP stream. Two facts matter operationally:
1. A TCP connection can carry **many requests one after another** (persistent / keep-alive), saving handshakes
   (and TLS handshakes -- Module 8).
2. A response must tell the client where it ends: either a `Content-Length` header (size known up front) or
   `Transfer-Encoding: chunked` (stream of length-prefixed chunks, ended by a zero chunk) -- or by closing the
   connection. Streaming responses (large files, SSE, progressive JSON) use chunked.

(HTTP/2 multiplexes many requests as parallel streams over ONE TCP connection; the pool/sockets discussion below
is the HTTP/1.1 picture; `Week 3 / Day 1 notes` covers the protocol itself.)

### 7.2 Lab -- keep-alive and chunked

```bash
cd /tmp/lab
cat > chunk.mjs <<'X'
import http from 'node:http';
http.createServer((q, r) => {
  if (q.url === '/fixed') { r.setHeader('Content-Length', 6); return r.end('hello\n'); }
  r.write('part1\n'); setTimeout(() => { r.write('part2\n'); r.end('part3\n'); }, 300);
}).listen(3000, '0.0.0.0');
X
nohup node chunk.mjs >/dev/null 2>&1 &
curl -sv localhost:3000/fixed 2>&1 | grep -E '^< |^hello'
curl -sv localhost:3000/stream 2>&1 | grep -E '^< |^part'
curl -s --raw localhost:3000/stream | cat -A
curl -sv localhost:3000/fixed localhost:3000/fixed localhost:3000/fixed 2>&1 | grep -E 'Connected|Re-using|Connection #0'
```

```text
--- fixed length
< HTTP/1.1 200 OK
< Content-Length: 6
< Date: Tue, 20 Oct 2026 06:48:04 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< 
hello
--- streamed -> chunked
< HTTP/1.1 200 OK
< Date: Tue, 20 Oct 2026 06:48:05 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Transfer-Encoding: chunked
< 
part1
part2
part3
--- curl --raw shows chunk framing
6^M$
part1$
^M$
6^M$
part2$
^M$
6^M$
part3$
^M$
0^M$
^M$
--- keep-alive: 3 requests, ONE connection
* Connected to localhost (127.0.0.1) port 3000
* Connection #0 to host localhost left intact
* Re-using existing connection with host localhost
* Connection #0 to host localhost left intact
* Re-using existing connection with host localhost
* Connection #0 to host localhost left intact
```

Reading it:
- `Content-Length: 6` -> client knows after 6 bytes the response is done. Without a length and without chunked,
  the only terminator is closing the connection (which kills keep-alive).
- `Transfer-Encoding: chunked`: Node chose it automatically because we called `res.write()` before `end()` with no
  length. `--raw` shows the framing: `6\r\n` (chunk size in hex) + data + `\r\n`, repeated, ended by `0\r\n\r\n`
  (`^M$` is `\r\n`). Node's `Date`/`Keep-Alive: timeout=5` also tells the client the server will close an idle
  connection after 5 seconds (Node's `server.keepAliveTimeout` default is 5000 ms).
- One curl process asked for three URLs and printed `Re-using existing connection` twice: **one TCP connection
  served three requests**.
- **Production pitfall:** a load balancer (AWS ALB idle timeout 60 s) in front of Node (keepAliveTimeout 5 s): the
  Node server closes an idle connection at the very moment the LB sends a new request on it -> random
  `502`/`ECONNRESET`. Fix: set `server.keepAliveTimeout` larger than the LB's idle timeout (and
  `headersTimeout` slightly more than that).

### 7.3 Connection pool vs socket vs request

Three different things people mix up:

| Thing | What it is | Lifetime | Where it queues |
|-------|-----------|----------|-----------------|
| **Request** | One HTTP message pair (method, path, headers, body -> status, headers, body). Pure application-level idea. | milliseconds | in your handler / event loop |
| **Socket (connection)** | One TCP stream between two endpoints; an fd; a 4-tuple. May carry many sequential requests (HTTP/1.1 keep-alive) or interleaved ones (HTTP/2). | seconds to minutes | server accept queue (backlog) before accept |
| **Connection pool** | A client-side cache of sockets (or DB connections) with a max size: borrowing = waiting for a free one. `http.Agent` (`maxSockets`), `undici` Pool, `mysql2` pool (`connectionLimit`), `pg` Pool. | process lifetime | **in the pool's own wait queue, inside your process** |

Lab -- 6 requests, but a pool allowed to open only 2 sockets, against a server that takes 500 ms per request:

```bash
cat > slow.mjs <<'X'
import http from 'node:http';
http.createServer((q, r) => setTimeout(() => r.end('done\n'), 500)).listen(3000, '0.0.0.0');
X
cat > pool.mjs <<'X'
import http from 'node:http';
const agent = new http.Agent({ keepAlive: true, maxSockets: 2 });
const t0 = Date.now();
const one = (i) => new Promise((resolve) => {
  const req = http.get({ host: '127.0.0.1', port: 3000, agent }, (res) => {
    res.resume(); res.on('end', () => { console.log(`req ${i} finished at +${Date.now() - t0}ms`); resolve(); });
  });
});
const all = Promise.all([1,2,3,4,5,6].map(one));
setTimeout(() => console.log('sockets in use:', Object.values(agent.sockets).flat().length, ' queued requests:', Object.values(agent.requests).flat().length), 100);
await all; agent.destroy();
X
nohup node slow.mjs >/dev/null 2>&1 & sleep 1
node pool.mjs
```

```text
sockets in use: 2  queued requests: 4
req 1 finished at +529ms
req 2 finished at +533ms
req 3 finished at +1035ms
req 4 finished at +1037ms
req 5 finished at +1537ms
req 6 finished at +1540ms
```

The server never had more than 2 requests at once. Requests 3-6 spent time **waiting inside our own process** for
a free socket (`queued requests: 4`) -- the server's logs would show healthy 500 ms handlers while the client
measured up to 1.5 s. That is exactly what happens with an exhausted DB pool (`mysql2` `connectionLimit: 10`,
`Week 4 / Day 5 notes`): the slowness is in the **pool wait**, not in the database. The interview sentence:
"a request's latency = pool wait + connect (if no free socket) + TLS + server time + transfer; metrics on only the
server side miss the first three."

**Node symptom -> cause table (HTTP client side)**

| Symptom | Likely cause | Check |
|---------|--------------|-------|
| Latency climbs under load but server CPU/DB are idle | client pool too small / sockets exhausted | pool stats (`agent.requests`), pool wait metric |
| `ECONNRESET` / `socket hang up` randomly | idle keep-alive socket closed by the peer/LB (race) | compare keep-alive timeouts, enable retry-on-reset for idempotent calls |
| `EADDRNOTAVAIL` | ephemeral ports exhausted (many TIME_WAIT) | `ss -s`, enable keep-alive |
| Requests hang forever | no timeout on connect/response | set `timeout`/`AbortSignal.timeout`, `undici` `headersTimeout` |
| Memory/fd growth | responses never consumed (`res.resume()` missing) so sockets never return to the pool | `lsof -p PID | wc -l` |

### 7.4 Interview answer

**Interview answer:** "A request is one HTTP exchange; a socket is the TCP connection that carries it; a pool is a
bounded set of reusable connections owned by the client. With HTTP/1.1 keep-alive one socket serves many
requests sequentially, so I avoid paying the TCP and TLS handshakes each time. Where a request waits matters when
debugging: it can sit in my client's pool queue when all sockets are busy, in the server's accept backlog,
or behind a blocked event loop. A server that streams a response with no known length uses chunked
transfer encoding, which frames data as length-prefixed chunks ending in a zero-length chunk. One production
gotcha is keep-alive timeout mismatch with a load balancer, which shows up as sporadic 502s."

### 7.5 Follow-ups
- **Q: How does HTTP/2 change pools?** One connection multiplexes many streams, so you need far fewer sockets;
  head-of-line blocking moves from HTTP to TCP.
- **Q: What if a client sends both `Content-Length` and `Transfer-Encoding`?** Ambiguity is a request-smuggling vector;
  servers should reject. Know the name "HTTP request smuggling".
- **Q: Why must you consume the response body in Node?** Unread body keeps the socket busy; it cannot go back to
  the pool, leading to exhausted sockets.
- **Q: SSE or WebSocket over this?** SSE = a long-lived chunked response; WebSocket upgrades the connection to
  another protocol (`101 Switching Protocols`).

### 7.6 Common mistakes
- Treating latency as server time only. Pool size set to 1000 "just in case" (overloads the DB/peer).
- Missing `res.resume()`; not setting `keepAliveTimeout` behind an LB.

### 7.7 Revision block

**Key concepts:** persistent connections; Content-Length vs chunked; keep-alive timeout; pool wait vs server time;
socket = fd = 4-tuple.

**Revision questions**
1. How does the client know where an HTTP/1.1 response ends?
2. Why can 5 s vs 60 s keep-alive timeouts produce 502 behind a load balancer?
3. In the pool lab, why did reqs 3 and 4 finish at about 1000 ms?
4. Request vs socket vs pool: one sentence each.
5. What do you check when p99 latency is high but the DB dashboard is calm?

**Practical task:** extend `pool.mjs` to record pool-wait time and server time separately per request
(timestamp at enqueue, at socket assignment via `agent` hooks / `req.on('socket')`, at response) and print both.

**Self-assessment**
- [ ] I can show keep-alive reuse with curl.
- [ ] I can explain chunked framing.
- [ ] I can say where a request waits and prove it.

---

## Module 8 - DNS, localhost vs 127.0.0.1 vs 0.0.0.0, and TLS [ESSENTIAL]

**Learning objectives**
- Trace DNS resolution from the app to the authoritative server and read `dig` output.
- Explain `localhost`, `127.0.0.1`, `::1`, `0.0.0.0` in code and in Docker.
- Describe the TLS handshake and certificate chain; explain why `curl -k` / `rejectUnauthorized: false` is dangerous.

### 8.1 DNS resolution path

**Concept:** DNS turns `example.com` into IP addresses. When your Node code calls `fetch('https://example.com')`:

1. `dns.lookup()` (what `http`/`net`/`fetch` use by default) calls the OS resolver (`getaddrinfo`), which
   consults `/etc/nsswitch.conf` (`hosts: files dns`): first `/etc/hosts`, then DNS servers listed in
   `/etc/resolv.conf`. **`dns.lookup` runs in the libuv thread pool**, so a slow DNS server can eat pool threads and
   slow `fs`/`crypto` calls too. (`dns.resolve*` uses c-ares, a real network query, not the pool.)
2. The configured **recursive resolver** (your ISP, 8.8.8.8, Docker's 127.0.0.11) checks its cache. On a miss it walks
   the tree: **root servers** ("who handles `.com`?") -> **TLD servers** ("who handles `example.com`?") ->
   **authoritative name servers** ("what is the A record?").
3. The answer carries a **TTL** (seconds it may be cached). Every layer caches: browser, OS, resolver. Low TTL = fast
   failover, more queries. DNS changes are "slow" because of caches holding the old answer until TTL expires.

Lab:

```bash
getent hosts localhost
grep -v '^#' /etc/resolv.conf; grep -E '^hosts' /etc/nsswitch.conf; head -4 /etc/hosts
curl -s -o /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n' https://example.com
dig +noall +answer example.com A; dig +noall +answer example.com NS | head -3; dig +short example.com AAAA
```

```text
--- local resolver config

nameserver 192.168.65.7

hosts:          files dns
127.0.0.1	localhost
::1	localhost ip6-localhost ip6-loopback
fe00::	ip6-localnet
ff00::	ip6-mcastprefix
--- timing breakdown
dns=0.034455 tcp=0.045582 tls=0.146068 ttfb=0.190351 total=0.191231
--- dig
example.com.		169	IN	A	172.66.147.243
example.com.		169	IN	A	104.20.23.154
example.com.		21600	IN	NS	elliott.ns.cloudflare.com.
example.com.		21600	IN	NS	hera.ns.cloudflare.com.
```

- `dig` columns: name, **TTL (169 s left in the resolver's cache)**, class `IN`, type `A` (IPv4), data. An
  AAAA query printed nothing (`dig +short ... AAAA` returned empty): no IPv6 record seen by this resolver.
- `curl -w` timing is the best "where did the time go" tool: cumulative `dns=0.034s`, `tcp=0.046s`
  (TCP handshake finished), `tls=0.146s` (TLS finished -- 100 ms for the TLS handshake alone), `ttfb=0.190s`
  (first byte), total 0.191 s. Subtract neighbours to get each phase.

Walk the tree manually (iterative queries; `+norec` = "do not recurse for me"; `+tcp` because UDP to root servers
was blocked in this Docker Desktop network):

```bash
dig +tcp +norec +noall +authority +comments @a.root-servers.net example.com A | grep -E 'status|NS' | head -4
dig +tcp +norec +noall +authority @a.gtld-servers.net example.com A | head -3
dig +tcp +norec +noall +answer @elliott.ns.cloudflare.com example.com A | head -3
```

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 59881
;; flags: qr; QUERY: 1, ANSWER: 0, AUTHORITY: 13, ADDITIONAL: 27
com.			172800	IN	NS	l.gtld-servers.net.
example.com.		172800	IN	NS	hera.ns.cloudflare.com.
example.com.		172800	IN	NS	elliott.ns.cloudflare.com.
example.com.		300	IN	A	172.66.147.243
example.com.		300	IN	A	104.20.23.154
```

Step 1: the root server did not answer the question; it gave a referral ("ask the `.com` servers", 13 of them in
AUTHORITY). Step 2: the `.com` TLD server referred us to example.com's own name servers (Cloudflare). Step 3: the
authoritative server gave the real **A records with TTL 300**. This is what a recursive resolver does for you
on a cache miss. (`dig +trace` automates this; in this environment it printed nothing useful, so we did the steps
by hand.)

**Node symptoms and DNS:**
- `getaddrinfo ENOTFOUND api.internal` -> name does not resolve: typo, wrong network (Docker default bridge,
  Module 5), VPN/split-DNS, or a resolver outage.
- `getaddrinfo EAI_AGAIN` -> temporary DNS failure (resolver timeout); typical when the container's resolver is
  unreachable. Retry/backoff.
- Intermittent slowness every N seconds -> DNS TTL expiry and a slow resolver; Node does **not** cache DNS
  itself (each new connection calls `dns.lookup`), so connection reuse/pooling also reduces DNS load.
- After a failover the app keeps hitting the old IP -> long-lived keep-alive sockets (not DNS) still point to
  the old host; recycle connections.

### 8.2 localhost vs 127.0.0.1 vs ::1 vs 0.0.0.0

| Name | Meaning | Notes |
|------|---------|-------|
| `127.0.0.1` | IPv4 loopback address of THIS machine/namespace | traffic never leaves the host; whole `127.0.0.0/8` is loopback |
| `::1` | IPv6 loopback | |
| `localhost` | a **name**, resolved via `/etc/hosts` to BOTH `::1` and `127.0.0.1` | which one is tried first depends on resolver order and the client |
| `0.0.0.0` as a **listen** address | "all IPv4 interfaces" (wildcard) | reachable via loopback, LAN IP, container `eth0`... |
| `::` as a listen address | all IPv6 interfaces (and usually IPv4 too, dual-stack) | Node's default when you omit the host |
| `0.0.0.0` as a **destination** | not a valid peer; on Linux it often behaves like "this host", don't use | |

Why this matters in Node, with real evidence. `server.listen(3000, 'localhost')`:

```bash
cat > lo.mjs <<'X'
import http from 'node:http';
const s = http.createServer((q, r) => r.end('ok\n')).listen(3000, 'localhost', () => console.log('bound to', s.address()));
X
nohup node lo.mjs > lo.log 2>&1 & sleep 1; cat lo.log; ss -ltn 'sport = :3000'
curl -s -m2 http://127.0.0.1:3000/ || echo "FAILED rc=$?"
curl -s -m2 'http://[::1]:3000/' || echo "FAILED rc=$?"
curl -s -m2 http://localhost:3000/ || echo "FAILED rc=$?"
node -e "require('dns').lookup('localhost',{all:true},(e,a)=>console.log('lookup localhost ->',JSON.stringify(a)))"
```

```text
bound to { address: '::1', family: 'IPv6', port: 3000 }
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
LISTEN 0      511            [::1]:3000         [::]:*          
curl 127.0.0.1:
FAILED rc=7
curl [::1]:
ok
curl localhost:
ok
lookup localhost -> [{"address":"::1","family":6},{"address":"127.0.0.1","family":4}]
```

On this system `localhost` resolves with `::1` **first**, and since Node 17 `dns.lookup` returns addresses in the order
the OS gives them ("verbatim") instead of preferring IPv4. So `listen(3000, 'localhost')` bound IPv6 only,
and `curl http://127.0.0.1:3000` (IPv4) was refused. This is the famous **"works with `localhost`, fails with
`127.0.0.1`"** (or the reverse: a proxy config in Vite/webpack pointing to `localhost:3000` while the API listens on
IPv4 only). Node 20 also has `autoSelectFamily` (Happy Eyeballs) on by default for clients, which tries the next
address when the first fails (we saw curl do this in the tcpdump of Module 6 -- the `::1` attempt got an RST and
`127.0.0.1` succeeded). Older Node (<= 16) and some tools do not.

Rules of thumb:
- **Server in a container:** listen on `0.0.0.0` (or `::`), never `localhost`/`127.0.0.1` (Module 5).
- **Local dev server you do not want on the LAN:** `127.0.0.1`. Binding `0.0.0.0` on a laptop on cafe Wi-Fi exposes your
  dev API (and its debug endpoints) to other people on that network.
- **Clients:** use the service name inside Docker; in config files prefer `127.0.0.1` over `localhost` when
  you need determinism.
- **`0.0.0.0:PORT` with `-p`:** `-p 8080:3000` publishes on host `0.0.0.0:8080` (all host interfaces, i.e. reachable
  from the LAN); `-p 127.0.0.1:8080:3000` keeps it host-local.

### 8.3 TLS handshake, certificates and chain of trust

**Concept.** TLS gives (1) **encryption** (nobody on the path can read), (2) **integrity**, (3) **authentication of the
server** (you are really talking to `example.com`, not an attacker). Authentication is done with X.509 certificates.

**Handshake in plain terms (TLS 1.3):**
1. Client Hello: "I speak TLS 1.3, these ciphers, here is my key share, and the hostname (SNI) I want, ALPN: h2/http1.1."
2. Server Hello: picks cipher + its key share. From here on, everything is encrypted.
3. Server sends its **certificate chain** and a signature (CertificateVerify) proving it holds the private key.
4. Both sides derive session keys (ephemeral Diffie-Hellman, X25519 here -> **forward secrecy**). `Finished` messages
   confirm. Client then sends the HTTP request.
TLS 1.3 needs 1 round trip after TCP's handshake (TLS 1.2: 2). Session tickets allow resumption.

The `curl -v` output earlier shows precisely this:

```text
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / id-ecPublicKey
* ALPN: server accepted h2
> GET / HTTP/2
< HTTP/2 200 
```

**Certificate chain.** The server's certificate is signed by an **intermediate CA**, which is signed by a **root CA**
that ships in your OS/Node trust store. The client builds and verifies the chain to a root it already trusts,
checks the **hostname** against the certificate's Subject Alternative Names, and checks validity dates:

```bash
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | sed -n '/^Certificate chain/,/^---$/p' | head -8
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | grep -E 'Verification|Verify return|Cipher is'
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

```text
Certificate chain
 0 s:CN = example.com
   i:C = US, O = SSL Corporation, CN = Cloudflare TLS Issuing ECC CA 3
   a:PKEY: id-ecPublicKey, 256 (bit); sigalg: ecdsa-with-SHA256
   v:NotBefore: Sep 26 22:49:11 2026 GMT; NotAfter: Dec 25 22:56:35 2026 GMT
 1 s:C = US, O = SSL Corporation, CN = Cloudflare TLS Issuing ECC CA 3
   i:C = US, O = SSL Corporation, CN = SSL.com TLS Transit ECC CA R2
   a:PKEY: id-ecPublicKey, 256 (bit); sigalg: ecdsa-with-SHA384
Verification: OK
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
subject=CN = example.com
issuer=C = US, O = SSL Corporation, CN = Cloudflare TLS Issuing ECC CA 3
notBefore=Sep 26 22:49:11 2026 GMT
notAfter=Dec 25 22:56:35 2026 GMT
X509v3 Subject Alternative Name: 
    DNS:example.com, DNS:*.example.com
```

Read: cert 0 (`s:` subject = example.com, `i:` issuer = "Cloudflare TLS Issuing ECC CA 3") is the **leaf**;
cert 1 is the **intermediate** that issued it, itself issued by another CA up the chain (the root is not
sent; the client has it locally). `Verification: OK` means the chain ends in a trusted root. It is valid
for about 90 days (the short validity is why renewal automation -- Let's Encrypt / ACM -- matters).
The `s:`/`i:` fields can differ between runs and CDNs; do not memorise names.

**What goes wrong and the Node errors**

| Node error code | Meaning |
|-----------------|---------|
| `DEPTH_ZERO_SELF_SIGNED_CERT` / `SELF_SIGNED_CERT_IN_CHAIN` | cert signed by itself / unknown CA |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE` / `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` | server did not send the intermediate (misconfigured chain) or you lack the corporate CA |
| `CERT_HAS_EXPIRED` | expired certificate (renewal job broke) |
| `ERR_TLS_CERT_ALTNAME_INVALID` | hostname not in SAN (using an IP, or wrong cert) |

Lab -- a self-signed Node HTTPS server and the three ways to talk to it:

```bash
mkdir -p /tmp/lab/tls && cd /tmp/lab/tls
openssl req -x509 -newkey rsa:2048 -nodes -keyout k.pem -out c.pem -days 1 -subj '/CN=localhost' 2>/dev/null
cat > tlsserver.mjs <<'X'
import https from 'node:https'; import fs from 'node:fs';
https.createServer({ key: fs.readFileSync('k.pem'), cert: fs.readFileSync('c.pem') }, (q, r) => r.end('secure hello\n')).listen(8443, () => console.log('https on 8443'));
X
nohup node tlsserver.mjs > t.log 2>&1 & sleep 1
curl -sS https://localhost:8443/ 2>&1 | head -3
curl -sSk https://localhost:8443/
curl -sS --cacert c.pem https://localhost:8443/
node -e "fetch('https://localhost:8443').catch(e=>console.log('node fetch:', e.cause?.code))"
```

```text
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

secure hello
secure hello
node fetch: DEPTH_ZERO_SELF_SIGNED_CERT
```

1. Plain curl **refuses** (error 60), as does Node `fetch` (`DEPTH_ZERO_SELF_SIGNED_CERT`): the cert is not signed by a
   trusted CA.
2. `curl -k` ("insecure") skips verification and works.
3. `--cacert c.pem` trusts exactly that certificate -- the **correct** fix for a private/dev CA (Node:
   `NODE_EXTRA_CA_CERTS=/path/ca.pem`, or the `ca` option).

**Why `curl -k` / `NODE_TLS_REJECT_UNAUTHORIZED=0` / `rejectUnauthorized: false` is scary:** encryption still
happens, but you no longer verify *who* you are talking to. Anyone on the path (a malicious Wi-Fi, a compromised
router, a poisoned DNS answer) can present their own certificate and you accept it -- a man-in-the-middle can read and
modify everything, including tokens and passwords. And "temporary" flags in `.env` have a habit of reaching production.
Fix the trust (add the CA, fix the chain) rather than disabling checks.

Related: **mTLS** = the server also verifies a *client* certificate (service-to-service auth). **Termination:** usually a
load balancer/nginx terminates TLS and forwards plain HTTP to Node inside the private network; Node then sees
`X-Forwarded-Proto` (`app.set('trust proxy', ...)` in Express, `Week 3 / Day 2 notes`).

### 8.4 traceroute and ping (reachability)

```bash
traceroute -n -m 5 -w 1 example.com
ping -c2 -W1 example.com | tail -3
```

```text
traceroute to example.com (172.66.147.243), 5 hops max, 60 byte packets
 1  172.17.0.1  0.347 ms  0.047 ms  0.014 ms
 2  * * *
 3  * * *
 4  * * *
 5  * * *
--- example.com ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 3035ms
rtt min/avg/max/mdev = 5.011/7.225/9.440/2.214 ms
```

`traceroute` prints each router hop by sending packets with increasing TTL; hop 1 is Docker's gateway `172.17.0.1`.
`* * *` means "no reply" -- very common (routers/firewalls block the probes), so stars do NOT mean the path is broken:
the ping to the same host worked (about 7 ms). Use `ping` for "is it alive / how fast", `traceroute`/`mtr` for "where does it
slow or stop" (`mtr` was not installed here). Neither proves an HTTP service works; use `curl -v` for that.

### 8.5 Interview answers

**Interview answer (DNS):** "My app asks the OS resolver, which checks `/etc/hosts` and then the configured recursive
resolver. On a cache miss that resolver walks from the root servers to the TLD servers to the domain's authoritative
servers, and the record comes back with a TTL that every cache honours. In Node, `dns.lookup` uses the OS resolver
via the libuv thread pool and is not cached by Node, so I rely on connection reuse, and I distinguish ENOTFOUND, a
bad name, from EAI_AGAIN, a resolver timeout. To debug I use `dig`, `getent hosts`, and `curl -w` timing."

**Interview answer (localhost):** "`127.0.0.1` is the IPv4 loopback address; `localhost` is a name that can resolve
to both `::1` and `127.0.0.1`, so a server listening on `localhost` may only be on IPv6 and a client using
`127.0.0.1` will be refused. `0.0.0.0` as a listen address means every IPv4 interface. In Docker, `localhost` is the
container's own loopback, so a service bound to 127.0.0.1 is unreachable from other containers or via `-p`; it must
bind 0.0.0.0, and callers use the service name on a user-defined network."

**Interview answer (TLS):** "After TCP connects, the client sends a hello with its supported ciphers and key share and
the server name; the server answers, they derive session keys via ephemeral Diffie-Hellman, and the server proves its
identity by sending a certificate chain plus a signature. The client validates the chain up to a root CA in its trust store,
checks the hostname against the SANs and the validity dates. Disabling verification with `-k` or
`rejectUnauthorized: false` keeps the encryption but removes authentication, enabling man-in-the-middle attacks, so
the right fix is to trust the proper CA or repair the chain."

### 8.6 Follow-ups
- **Q: What is SNI?** The client sends the hostname inside the ClientHello so one IP can host many certificates.
- **Q: Why intermediates?** The root key stays offline; intermediates sign leaves and can be revoked.
- **Q: A, AAAA, CNAME, MX, TXT, NS?** IPv4, IPv6, alias to another name, mail, free text (SPF/verification), delegation.
- **Q: How does Let's Encrypt validate you?** ACME: you prove control of the domain by an HTTP-01 file or DNS-01 TXT record.
- **Q: What is certificate pinning/HSTS?** Pinning restricts accepted certs; HSTS tells browsers to always use HTTPS.
- **Q: Where does the TLS time go in a request?** One extra round trip (TLS 1.3) plus crypto; reuse connections
  (keep-alive) to pay it once.

### 8.7 Common mistakes
- Hard-coding `localhost` for service-to-service URLs; binding dev servers to `0.0.0.0` on public networks.
- `NODE_TLS_REJECT_UNAUTHORIZED=0` left in env. Forgetting the intermediate cert in the server chain.
- Assuming DNS changes are instant; assuming `traceroute` stars mean failure.

### 8.8 Revision block

**Key concepts:** resolver chain, TTL, root/TLD/authoritative; `dns.lookup` thread pool; loopback vs wildcard;
`::1` first; TLS 1.3 hello/cert/finished; chain of trust; SAN; why `-k` is dangerous.

**Revision questions**
1. Walk DNS from `getaddrinfo` to the authoritative server.
2. A server on `localhost:3000` refuses `127.0.0.1:3000`. Explain.
3. Name three Node TLS error codes and their causes.
4. What does `ENOTFOUND` vs `EAI_AGAIN` tell you?
5. Why does TLS add latency to the first request but not the tenth?

**Practical task:** write a Node script that prints DNS, TCP, TLS and TTFB phases for any URL using
`dns`, `net`, `tls` events (the Node equivalent of `curl -w`).

**Self-assessment**
- [ ] I can read a `dig` answer including TTL.
- [ ] I can explain localhost/127.0.0.1/0.0.0.0 in Docker.
- [ ] I can describe the TLS handshake and chain without notes.

---

## Module 9 - Logs, systemd, journalctl, ssh and scp [ESSENTIAL]

**Learning objectives**
- Follow logs live, find errors, and understand where a service's stdout goes under systemd.
- Write and operate a systemd unit for a Node app (restart policy, env, limits, non-root user).
- Use ssh keys, scp and port forwarding, and know the permission traps.

### 9.1 Following logs: tail, less, grep

```bash
: > app.log
(for i in 1 2 3; do echo "line $i $(date +%T)" >> app.log; sleep 0.5; done) &
timeout 2 tail -n0 -f app.log
```

```text
line 1 06:47:24
line 2 06:47:25
```

- `tail -f file` prints new lines as they arrive (like `console.log` streaming into your terminal);
  `tail -F` (capital) also re-opens the file after log rotation renames it (we did not get a clean
  demonstration of the rotation behaviour in our batch environment, see "Not verified"; the behaviour is documented in `man tail`).
  `tail -n 100 file` last 100 lines.
- `less +F file` = follow mode you can interrupt (`Ctrl+C`) to search (`/pattern`, `n` next, `G` end, `q` quit).
  `less` is the right way to open a 2 GB log; never `cat` or open it in an editor.
- Combine: `tail -f app.log | grep --line-buffered ERROR` (`--line-buffered` so lines are not held in a buffer).
- A 12-factor Node app logs to **stdout/stderr** (JSON lines via pino, `Week 6 / Day 2 notes`); the platform
  (Docker `docker logs -f`, systemd/journald, Kubernetes) collects them. The app should not manage log files or rotation.

### 9.2 systemd: the service manager

**Concept.** systemd is PID 1 on most Linux servers. It starts services in order, restarts them on failure, applies
resource limits, captures stdout/stderr into the **journal**, and stops them with SIGTERM then SIGKILL. A **unit file**
declares the service. For a Node app this replaces `nohup node ... &` and PM2 on plain VMs.

We ran a real systemd inside a container (started with `--privileged --cgroupns=host -v /sys/fs/cgroup:/sys/fs/cgroup:rw`
and `/sbin/init` as the command; that privileged flag is for the lab only):

```bash
docker run -d --name lx-sd --privileged --cgroupns=host -v /sys/fs/cgroup:/sys/fs/cgroup:rw -v "$W:/w:ro" lx-ubuntu /sbin/init
docker exec lx-sd systemctl is-system-running; docker exec lx-sd systemctl --version | head -1
```

```text
running
systemd 255 (255.4-1ubuntu8.18)
```

The app (crashes on `/crash`, so we can watch restarts) and the unit:

```bash
useradd --system --home /opt/api --shell /usr/sbin/nologin nodeapp
mkdir -p /opt/api && cp /w/server.mjs /opt/api/ && chown -R nodeapp /opt/api
cat > /opt/api/crashy.mjs <<'X'
import http from 'node:http';
http.createServer((q, r) => { if (q.url === '/crash') { console.error('fatal: simulated crash'); process.exit(1); } r.end('ok ' + process.env.APP_ENV + '\n'); })
  .listen(3000, '0.0.0.0', () => console.log('api up, pid', process.pid));
X
cat > /etc/systemd/system/api.service <<'X'
[Unit]
Description=Demo Node API
After=network.target

[Service]
User=nodeapp
WorkingDirectory=/opt/api
Environment=APP_ENV=production
ExecStart=/usr/local/bin/node /opt/api/crashy.mjs
Restart=on-failure
RestartSec=1
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
X
systemctl daemon-reload && systemctl enable --now api
systemctl status api --no-pager | head -12
curl -s localhost:3000
curl -s localhost:3000/crash; sleep 2.5
systemctl show api -p NRestarts -p ActiveState -p MainPID
journalctl -u api --no-pager -n 12 -o short-precise | cut -c1-150
tr '\0' '\n' < /proc/$(systemctl show api -p MainPID --value)/environ | grep APP_ENV
grep 'open files' /proc/$(systemctl show api -p MainPID --value)/limits
systemctl stop api; systemctl is-active api
```

Real output (the status bullet and tree characters were Unicode in the original and are shown here as ASCII):

```text
Created symlink /etc/systemd/system/multi-user.target.wants/api.service -> /etc/systemd/system/api.service.
--- status
* api.service - Demo Node API
     Loaded: loaded (/etc/systemd/system/api.service; enabled; preset: enabled)
     Active: active (running) since Tue 2026-10-20 06:46:08 UTC; 1s ago
   Main PID: 156 (node)
      Tasks: 11 (limit: 19103)
     Memory: 8.7M (peak: 9.1M)
        CPU: 200ms
     CGroup: /docker/04e75d7b1dd5.../system.slice/api.service
             `-156 /usr/local/bin/node /opt/api/crashy.mjs

Oct 20 06:46:08 04e75d7b1dd5 systemd[1]: Started api.service - Demo Node API.
Oct 20 06:46:09 04e75d7b1dd5 node[156]: api up, pid 156
--- curl
ok production
--- crash it
(curl rc=52)
MainPID=174
NRestarts=1
ActiveState=active
--- journalctl
Oct 20 06:46:08.854902 04e75d7b1dd5 systemd[1]: Started api.service - Demo Node API.
Oct 20 06:46:09.112905 04e75d7b1dd5 node[156]: api up, pid 156
Oct 20 06:46:10.013468 04e75d7b1dd5 node[156]: fatal: simulated crash
Oct 20 06:46:10.032696 04e75d7b1dd5 systemd[1]: api.service: Main process exited, code=exited, status=1/FAILURE
Oct 20 06:46:10.032983 04e75d7b1dd5 systemd[1]: api.service: Failed with result 'exit-code'.
Oct 20 06:46:11.187705 04e75d7b1dd5 systemd[1]: api.service: Scheduled restart job, restart counter is at 1.
Oct 20 06:46:11.215075 04e75d7b1dd5 systemd[1]: Started api.service - Demo Node API.
Oct 20 06:46:11.358449 04e75d7b1dd5 node[174]: api up, pid 174
--- env of running process
APP_ENV=production
--- limits
Max open files            65535                65535                files     
--- stop (sends SIGTERM)
inactive
```

What the unit does, line by line:
- `User=nodeapp` -> not root (Module 1). `--system --shell nologin` creates a service account nobody can log in as.
- `Environment=` / `EnvironmentFile=/etc/api.env` -> `process.env` (put secrets in a root-only file, mode 600).
- `Restart=on-failure` + `RestartSec=1` -> after the crash (`status=1/FAILURE`) systemd restarted it with a new
  PID (156 -> 174, `NRestarts=1`). This is a supervisor loop; for repeated crashes tune `StartLimitBurst`
  so a crash-looping app does not hammer a DB.
- `LimitNOFILE=65535` -> the running process really has 65535 open files allowed (the EMFILE fix from Module 3).
- `stdout`/`stderr` of Node lands in the **journal** with timestamps and the unit name: no log files needed.
- `systemctl stop` sends SIGTERM (our crashy.mjs has no handler, so it dies by default action; yours should drain), and after
  `TimeoutStopSec` (default 90 s) SIGKILL.
- `After=network.target` orders startup; `WantedBy=multi-user.target` + `enable` = start at boot.

Commands to know: `systemctl start|stop|restart|reload|status|enable|disable NAME`, `systemctl daemon-reload` after
editing a unit, `systemctl list-units --failed`, `systemctl cat NAME`, `journalctl -u NAME -f` (follow), `journalctl -u NAME --since "10 min ago"`,
`journalctl -p err -b` (errors this boot), `journalctl -u NAME -o json` (structured), `journalctl --disk-usage`.

`journalctl -u api -p err` returned nothing above because the Node `console.error` line is stored at the default
priority (info) unless the unit sets `SyslogLevelPrefix`; severity in the journal comes from the writer, not from "stderr".
Search by text instead (`journalctl -u api | grep fatal`).

### 9.3 ssh, scp and port forwarding

ssh = encrypted remote shell (and file/port tunnel) using public-key authentication: you keep the **private key**
(`~/.ssh/id_ed25519`); the server has your **public key** in `~/.ssh/authorized_keys`. The first connection pins the
server's host key in `~/.ssh/known_hosts` (a changed host key later warns of a possible MITM).

Lab in a container with `openssh-server` (installed with `apt-get install -y openssh-server`):

```bash
mkdir -p /run/sshd; ssh-keygen -A >/dev/null; /usr/sbin/sshd -o PasswordAuthentication=no -o PermitRootLogin=no
useradd -m -s /bin/bash deploy
su deploy -c 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q && cp ~/.ssh/id_ed25519.pub ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && ls -l ~/.ssh'
su deploy -c 'ssh -o StrictHostKeyChecking=accept-new deploy@localhost "whoami; hostname; uname -sr"'
su deploy -c 'echo "build-123" > /tmp/artifact.txt; scp -q /tmp/artifact.txt deploy@localhost:/tmp/artifact.copy2 && cat /tmp/artifact.copy2'
```

```text
total 12
-rw------- 1 deploy deploy 101 Oct 20 06:46 authorized_keys
-rw------- 1 deploy deploy 411 Oct 20 06:46 id_ed25519
-rw-r--r-- 1 deploy deploy 101 Oct 20 06:46 id_ed25519.pub
Warning: Permanently added 'localhost' (ED25519) to the list of known hosts.
deploy
ccfd854c97ae
Linux 6.18.54.1-microsoft-standard-WSL2
build-123
```

Permission trap -- sshd silently ignores keys if the files are too open:

```bash
su deploy -c 'chmod 666 ~/.ssh/authorized_keys'
su deploy -c 'ssh -n -o BatchMode=yes deploy@localhost true' </dev/null
su deploy -c 'chmod 600 ~/.ssh/authorized_keys'
su deploy -c 'ssh -n -o BatchMode=yes deploy@localhost true' </dev/null; echo "after fix rc=$?"
```

```text
deploy@localhost: Permission denied (publickey).
after fix rc=0
```

Key rule: `~/.ssh` 700, private key 600, `authorized_keys` 600 (not writable by others). (`-n` / `</dev/null` matter in scripts:
`ssh` reads stdin, and inside a `while read` loop or a piped script it would swallow the rest of the input -- we hit this while
building this lab: the script silently stopped after the first `ssh`.)

Port forwarding -- reach an internal-only service (here bound to `127.0.0.1:9000`) through the SSH server, the standard way to
reach a private DB or an admin UI without opening its port to the internet:

```bash
cat > /tmp/internal.mjs <<'X'
import http from 'node:http'; http.createServer((q,r)=>r.end('internal-only service\n')).listen(9000,'127.0.0.1');
X
nohup node /tmp/internal.mjs >/dev/null 2>&1 &
su deploy -c 'ssh -f -n -N -L 9100:127.0.0.1:9000 deploy@localhost' </dev/null; sleep 1; curl -s localhost:9100
ss -ltnp 'sport = :9100' | tail -1 | cut -c1-100
```

```text
internal-only service
LISTEN 0      128            [::1]:9100         [::]:*    users:(("ssh",pid=1232,fd=4))
```

`-L 9100:127.0.0.1:9000` = "listen on local port 9100; send whatever arrives through the SSH connection and have the
server connect to 127.0.0.1:9000 *from its point of view*". `ss` shows the `ssh` process owning port 9100 (note: on `[::1]`
only -- the `localhost` IPv6-first story again). Production habits: disable password login and root login
(`PasswordAuthentication no`, `PermitRootLogin no`), one key per person, bastion/jump host (`ssh -J`), and
`scp`/`rsync` for artifacts (modern `scp` uses SFTP underneath).

### 9.4 Other live-debug tools (concepts)

- `curl -v` / `-i` / `-w`: requests with headers/timings (done in Modules 7-8). `curl -X POST -H 'Content-Type: application/json' -d '{"a":1}' URL`.
- `strace -p PID -f -tt -e trace=network` (Module 6); `ltrace` = library calls; `gdb -p PID` attach a debugger (rare for Node;
  use `node --inspect` and `kill -USR1 PID` to turn on the inspector on a running process instead). `perf` and flame graphs
  are the next level (`Week 6 / Day 6 notes`).
- `dmesg -T | grep -i -E 'oom|killed process'` shows OOM-killer decisions (needs host access; not available inside our container).
- `nslookup` = older DNS tool, `mtr` = traceroute+ping combined, `iostat -x 1`, `htop`: not installed in this lab, therefore not demonstrated.
- `xxd`/`hexdump -C file` to see raw bytes (encoding bugs: BOM, `\r\n` line endings, wrong charset).

### 9.5 Interview answer

**Interview answer:** "I run Node on a VM as a systemd service under a dedicated non-root user, with `Restart=on-failure`, an
environment file for configuration, and `LimitNOFILE` raised. The app writes logs to stdout, which journald captures, so
I can follow them with `journalctl -u service -f` and filter by time or priority. For access I use ssh with public keys,
no password or root login, scp or rsync to ship artifacts, and `-L` port forwarding to reach private services like a
database without exposing them. If it is containerised the equivalent is `docker logs -f`, a restart policy, and the
orchestrator's health checks."

### 9.6 Follow-ups
- **Q: systemd vs PM2?** On a VM systemd gives supervision, logging, limits and boot ordering without another dependency; PM2
  adds cluster mode and a Node-specific UI. In containers neither: the orchestrator restarts the container.
- **Q: `reload` vs `restart`?** `reload` signals the app to re-read config without dropping connections (needs support);
  `restart` stops then starts.
- **Q: How do you do zero-downtime deploys with systemd?** Run two instances behind a proxy and restart one at a time, or
  use socket activation; or blue/green releases with a `current` symlink.
- **Q: What is `journalctl` persistence?** By default may be volatile (`/run/log/journal`); `Storage=persistent` keeps it across reboots.
- **Q: What is an ssh agent / why `ssh -A` is risky?** Agent forwarding lets the remote host use your keys while connected; prefer `-J` (jump).

### 9.7 Common mistakes
- Running with `nohup` and `&` in production. Logging to files inside the app and forgetting rotation (disk full, Module 3).
- `chmod 777 ~/.ssh`; sharing one deploy key; committing private keys. Forgetting `daemon-reload` after editing a unit.
- Crash-loop without `RestartSec`/`StartLimit*`.

### 9.8 Revision block

**Key concepts:** stdout -> journald; unit file anatomy; Restart policy; `journalctl -u -f`; ssh key trust and 700/600
permissions; scp; `-L` forwarding; `tail -f`, `less`.

**Revision questions**
1. Write a minimal unit for a Node app and explain each directive.
2. How do you see the last crash reason of a service?
3. ssh says `Permission denied (publickey)` though the key is right. What do you check?
4. Why should a Node app log to stdout rather than to files?
5. What does `ssh -L 5433:127.0.0.1:5432 bastion` do?

**Practical task:** extend `api.service` with `EnvironmentFile`, `NoNewPrivileges=true`, `ProtectSystem=strict`, `ReadWritePaths=`;
verify the app still starts, and prove it cannot write outside its allowed path (the error is an EROFS/EACCES from Node).

**Self-assessment**
- [ ] I can write and debug a systemd unit.
- [ ] I can find an app's logs and crash reason with journalctl.
- [ ] I know the ssh permission requirements and port forwarding.

---

## Module 10 - Interview question bank (26 questions with answers) [ESSENTIAL]

Use these for spoken practice: answer out loud in 60-90 seconds, then compare. IDs are `Q-LNX-xx` so other parts can
link to them.

**Q-LNX-01. A Node server won't start: `EADDRINUSE :::3000`. Walk me through it.**
It means a socket is already listening on that port. `ss -ltnp 'sport = :3000'` or `lsof -nP -iTCP:3000 -sTCP:LISTEN`
shows the PID; `ps -o pid,cmd -p PID` tells me whether it is a stale copy of my own app or something else. I stop it
with SIGTERM, confirm the port is free, then restart. I also add a `server.on('error')` handler so the failure logs a clear message
and exits non-zero (lab: Module 4).

**Q-LNX-02. `EACCES` on `listen(80)`?**
Ports below 1024 are privileged for non-root users. Run on a high port as a normal user and expose 80/443 via a reverse proxy, a
load balancer, `-p 80:3000` in Docker, or `CAP_NET_BIND_SERVICE`. Note Docker lowers the unprivileged-port limit to 0 by
default, so this error may not reproduce in containers (Module 4).

**Q-LNX-03. Explain `chmod 640` and why `777` is wrong.**
6 = rw for the owner, 4 = r for the group, 0 = nothing for others. `777` lets every local user and every compromised
process modify the file. Grant the narrowest access: correct owner/group and the minimum bits (Module 1).

**Q-LNX-04. What does `set -euo pipefail` do?**
`-e` exit on the first command that fails, `-u` treat unset variables as errors, `-o pipefail` makes a pipeline fail if any stage
fails (otherwise only the last stage's status counts). It prevents silent partial failures in deploy scripts, but `-e` has
exceptions (conditions in `if`/`&&`), so critical steps still deserve explicit checks.

**Q-LNX-05. Exit codes 0, 1, 137, 143?**
0 success; 1 generic app error (uncaught exception); 137 = 128+9 SIGKILL (OOM killer or forced stop); 143 = 128+15
SIGTERM. A 137 with no stack trace is typically memory (`docker inspect` `OOMKilled`).

**Q-LNX-06. SIGTERM vs SIGKILL, and why does it matter for deploys?**
SIGTERM can be caught: the app stops accepting connections, finishes in-flight requests, closes DB pools, flushes logs, exits 0.
SIGKILL cannot be caught. Docker/Kubernetes send SIGTERM and SIGKILL after a grace period, so an app that ignores SIGTERM
causes slow deploys and dropped requests. Also be careful with PID 1 in containers (use `--init`/tini).

**Q-LNX-07. How do you find what is using disk space, and what if `df` and `du` disagree?**
`df -h` per filesystem, then `du -sh * | sort -h | tail` down the tree, `find -size +100M` for big files. If `df` is much
fuller than `du`, a deleted file is still held open by a process: `lsof +L1`; restart that process (Module 3).

**Q-LNX-08. How do you read memory on Linux?**
Use the `available` column of `free -h`, not `free`, because spare RAM is used as page cache. For a process, RSS (`ps`) is real
resident memory; VSZ is virtual and not meaningful. In containers the limit is in cgroup files
(`/sys/fs/cgroup/memory.max`), because `free`/`top` show the host.

**Q-LNX-09. The CPU of your Node process is at 100% and requests time out. What do you suspect and how do you confirm?**
A blocked event loop: synchronous CPU work (large JSON parse, regex backtracking, sync crypto, a tight loop). Confirm:
`top` shows one core at 100%, `ss -ltn` shows Recv-Q > 0 on the listener, `strace` shows no `epoll_wait`/`read`/`write`, trivial requests
time out while the port is open. Then profile (`--cpu-prof`, `clinic flame`) and move CPU work to worker threads or another service (Module 6).

**Q-LNX-10. TCP three-way handshake?**
Client `SYN` (initial sequence number) -> server `SYN-ACK` (its ISN + acknowledgement of the client's) -> client `ACK`. It
establishes both sides' sequence numbers, costs one RTT before data, and creates the socket in the accept queue. Teardown uses a `FIN`/`ACK` in each direction (Module 6 capture).

**Q-LNX-11. What is TIME_WAIT, who gets it, and when is it a problem?**
The side that closes first waits ~60 s in TIME_WAIT so a lost final ACK can be retransmitted and delayed packets from the old
connection cannot be confused with a new one on the same 4-tuple. It is a problem for clients/proxies that open huge numbers of
short connections to one destination (ephemeral port exhaustion: `EADDRNOTAVAIL`). Fix with keep-alive/pooling; `tcp_tw_reuse`
helps for outbound; do not "disable" it.

**Q-LNX-12. Many sockets in CLOSE_WAIT: what does it mean?**
The peer closed, but my application has not closed its end -- an application bug (unclosed sockets, forgotten
`res.end()`/destroy, streams not consumed). It ends in fd exhaustion (`EMFILE`). Find the owner with `lsof -iTCP -sTCP:CLOSE_WAIT`.

**Q-LNX-13. `ECONNREFUSED` vs a timeout vs `ENOTFOUND` vs `ECONNRESET`?**
ENOTFOUND: DNS could not resolve the name. ECONNREFUSED: the host replied with RST -- reachable but nothing listening on that
address/port (wrong port, bound to loopback only, service down). Timeout: packets are dropped silently (firewall, wrong
route, overloaded accept queue) -- set connect timeouts. ECONNRESET: an established connection was reset by the peer (crash, idle
keep-alive closed by LB, proxy limit).

**Q-LNX-14. Why is my Node API unreachable from another container?**
Check in order: does the name resolve (user-defined network DNS; the default bridge has none); refused vs timeout; and what the
process is bound to (`ss -ltn` inside the container). `localhost` in the other container is itself, and a server bound to
`127.0.0.1` accepts only loopback traffic, so bind `0.0.0.0` and connect via `http://service:containerPort` (lab, Module 5).

**Q-LNX-15. When do you need `-p` in `docker run`?**
Only to reach a container from outside its Docker network (the host, a browser, the LAN). Container-to-container traffic on the
same user-defined network uses the container port directly. `-p 127.0.0.1:8080:3000` limits exposure to the host itself.

**Q-LNX-16. Bridge vs host networking?**
Bridge: container has its own network namespace and IP, NAT/port mapping to the outside, DNS by name on user-defined bridges. Host:
shares the host's network stack, no isolation or port mapping, a bit faster, Linux-server only (on Docker Desktop "host" is the VM).
Default to a user-defined bridge.

**Q-LNX-17. How does Docker's DNS work?**
On user-defined networks the daemon runs an embedded resolver at 127.0.0.11 inside each container (`/etc/resolv.conf`). It answers container and service
names (and aliases) with their current IPs and forwards other names to the host's resolvers. The default bridge does not provide this.

**Q-LNX-18. `localhost` vs `127.0.0.1` vs `0.0.0.0`?**
127.0.0.1 is the IPv4 loopback address. `localhost` is a hostname that may resolve to `::1` and/or 127.0.0.1, so you can get
"works on one, refused on the other" (Node >= 17 keeps OS order). `0.0.0.0` as a bind address means all IPv4 interfaces. In a
container, loopback is private to that container, so services must bind 0.0.0.0 to be reachable.

**Q-LNX-19. Describe the TLS handshake and the certificate chain.**
Client hello (versions, ciphers, key share, SNI, ALPN); server hello, then the certificate chain and a signature proving
private-key possession; ephemeral key exchange gives session keys and forward secrecy; Finished messages. The client verifies leaf -> intermediate(s) ->
a root in its trust store, the hostname against SANs, and validity/revocation. TLS 1.3 needs one extra round trip.

**Q-LNX-20. Why is `curl -k` / `rejectUnauthorized: false` dangerous?**
It disables server authentication while keeping encryption, so a man-in-the-middle can present any certificate and read or alter
traffic, including credentials. Correct fixes: add the private CA via `--cacert`/`NODE_EXTRA_CA_CERTS`, fix the server to send the full chain, renew expired certs.

**Q-LNX-21. What happens when you type `fetch('https://api.example.com/x')` -- at the network level?**
DNS lookup (OS resolver: hosts file, then recursive resolver, cached by TTL; `dns.lookup` uses the thread pool), TCP handshake to port 443 (or reuse a pooled
socket), TLS handshake (SNI, certificate validation, ALPN picks h2/http1.1), the request is written, the server processes it, the response comes back
(Content-Length or chunked), and the socket returns to the pool for keep-alive. Each phase can be timed with `curl -w`.

**Q-LNX-22. Keep-alive and chunked encoding?**
Keep-alive keeps the TCP (and TLS) connection open for subsequent requests, saving handshakes; servers close idle ones after a timeout (Node's default
5 s), which must exceed any load balancer's idle timeout to avoid 502s. Chunked encoding streams a response of unknown length as
size-prefixed chunks ending with a zero chunk, so the connection can stay reusable.

**Q-LNX-23. Connection pool vs socket vs request, and where can a request wait?**
A request is one HTTP exchange; a socket is the TCP connection (fd); a pool is a bounded client-side set of reusable sockets or DB
connections. A request can wait in the client's pool queue (invisible to server metrics), in connect/TLS setup, in the server's accept backlog, behind a
blocked event loop, or in the handler awaiting dependencies. Measure each separately (lab: 6 requests / 2 sockets finished at 0.5, 1.0, 1.5 s).

**Q-LNX-24. Which tool do you reach for: "who has this file/port open", "what syscalls is it making", "where is the time going in this request", "why is DNS failing"?**
`lsof`/`ss -p`; `strace -f -p`; `curl -w` timings (dns/tcp/tls/ttfb) plus `curl -v`; `dig`/`getent hosts` against the resolver in `/etc/resolv.conf`
(then walk root -> TLD -> authoritative with `+norec`).

**Q-LNX-25. How do you safely run Node on a Linux server?**
Dedicated non-root user; systemd (or container orchestrator) for supervision and restart; secrets in a root-only environment file or secrets manager; `LimitNOFILE`;
logs to stdout/journal; firewall exposing only 80/443/22; ssh keys only; reverse proxy for TLS; SIGTERM handling for graceful shutdown; automated certificate renewal.

**Q-LNX-26. Your container exits with 137 right after load. What do you do?**
`docker inspect --format '{{.State.OOMKilled}}'`; compare memory use with the cgroup limit; remember `free` shows the host. Fix the leak or raise `--memory`; set
`--max-old-space-size` to about 75% of the limit so V8 fails with a diagnosable error before the kernel kills the process; add a heap snapshot or metrics.

---

## Summary

- The OS is the first debugger: processes (`ps`, `top`), memory (`free`), disk (`df`, `du`, `lsof +L1`), fds (`/proc/PID/fd`, `ulimit`).
- A Node server in `/proc` is an epoll fd, a listening socket fd, and ~11 threads; network I/O lives on the main thread, `fs`/`dns.lookup`/`crypto`/`zlib` on pool threads (proved with strace).
- Port errors: `EADDRINUSE` (find the owner with `ss`/`lsof`), `EACCES` (privileged port), unreachable (bind address + DNS + refused-vs-timeout).
- TCP: handshake, FIN teardown, TIME_WAIT (normal, fix with reuse), CLOSE_WAIT (your bug), SYN_SENT (dead peer, set timeouts).
- HTTP: keep-alive reuse, chunked framing, pool wait vs server time, LB keep-alive mismatch.
- DNS: hosts file -> resolver -> root -> TLD -> authoritative; TTL; `localhost` may be `::1`.
- TLS: handshake, chain of trust, SAN; never disable verification.
- Docker: namespaces/cgroups, `-p -e -v --network --memory`, user-defined bridge DNS at 127.0.0.11, `localhost` = the container.
- Operations: systemd units, journald, ssh keys/scp/port forwarding.

Link to the rest of the prep: pooling and timeouts -> `Week 4 / Day 5`, `Week 6 / Day 3 notes`; graceful shutdown -> `Week 6 / Day 5 notes`;
Docker/deploy -> `Week 7 / Day 6 notes` and `Extension C` of `12_Project_Task_API.md`.

---

## Mixed-difficulty assessment

### Basic
1. Convert `rwxr-x---` to octal.
2. What does `A && B || C` do when A fails?
3. Which command lists listening TCP ports with their owning process?
4. Why does the pipeline `false | true` return 0?
5. In a user-defined bridge network, how does container `web` reach container `api` on its port 3000?

### Intermediate
6. `curl http://api:3000` from another container prints "Connection refused" but the name resolves. List the two most likely causes and the single command that separates them.
7. 20 000 sockets in TIME_WAIT on your reverse proxy. What do you change?
8. A deploy keeps dropping in-flight requests. What are three things you check in the app and the container setup?
9. Explain why a request can take 1.5 s on the client while every server log line says 500 ms.
10. `df` shows 100% full, `du` finds 30%. Next steps?

### Advanced
11. A Node API behind an ALB returns sporadic 502s under low traffic. Explain the cause and the exact settings to change.
12. Your container is OOM-killed (137) but `--max-old-space-size` was never reached. Explain how this can happen and how you size it.
13. Describe precisely how you would prove from the command line that a Node process is stuck in a CPU-bound loop rather than waiting on a database.
14. A teammate "fixes" a TLS error with `NODE_TLS_REJECT_UNAUTHORIZED=0`. Explain the risk and give the correct fix for (a) a private corporate CA, (b) a server missing its intermediate.
15. `localhost:3000` works in the browser but your Vite proxy to `http://localhost:3000` returns ECONNREFUSED. Explain and fix it.

### Answers with explanations
1. `750`: owner rwx = 7, group r-x = 5, others --- = 0.
2. `A && B || C`: A fails, so B is skipped; since the `&&` list failed, `C` runs. (Caveat: if A succeeds and B fails, C also runs -- it is not a real if/else.)
3. `ss -ltnp` (or `lsof -iTCP -sTCP:LISTEN -nP`).
4. Without `pipefail` the pipeline's status is that of the last command (`true`). Use `set -o pipefail`.
5. `http://api:3000` -- service name resolved by Docker DNS (127.0.0.11) and the container port; no `-p` needed.
6. (a) Process bound to 127.0.0.1 (or ::1) inside the target container; (b) wrong port / process not running. `docker exec api ss -ltn` shows the bind address and port at once. A timeout instead would indicate firewall/network, not this.
7. Reuse connections (keep-alive, `maxSockets`/pool to the upstream, HTTP/2 to the upstream), check the proxy's upstream keepalive setting, widen the ephemeral port range as a stopgap, `tcp_tw_reuse` for outbound; do not disable TIME_WAIT.
8. App handles SIGTERM and drains (`server.close`, then close pools, bounded by a timeout); container has the app as PID 1 with `--init` or a proper handler; stop grace period at least the drain time; readiness removal before shutdown; LB deregistration delay.
9. The requests queued inside the client's connection pool (max sockets reached) before being sent; server timing starts only when the request arrives (pool lab: requests 3-6 waited 0.5-1.0 s locally).
10. A deleted-but-open file: `lsof +L1`, identify the process, restart/reload it (or truncate through `/proc/PID/fd/N`), then fix log rotation (`copytruncate`/signal the app to reopen); also check inode exhaustion with `df -i`.
11. The ALB idle timeout (60 s default) is longer than Node's `keepAliveTimeout` (5 s). Node closes an idle connection while the ALB reuses it, causing a reset. Set `server.keepAliveTimeout` above the ALB idle timeout (e.g. 65 s) and `server.headersTimeout` a few seconds higher.
12. The V8 heap limit is not the whole process: buffers (`Buffer`, external memory), native modules, thread stacks, and the heap together can exceed the cgroup limit, and the default heap limit can be computed from host memory larger than the container limit (259 MB vs 128 MB limit in our lab). Set `--max-old-space-size` to about 70-75% of the container limit and monitor RSS plus `external` memory.
13. `top -p PID`: R state with ~100% on one core; `ss -ltn` Recv-Q > 0 on the listener; `strace -p PID` shows no `epoll_wait`/socket syscalls; trivial endpoint (`/health`) times out; `lsof`/`ss` show few established DB connections active; `--cpu-prof` or `kill -USR1` inspector for a profile. A DB wait would show low CPU, regular `epoll_wait`, and a healthy `/health`.
14. It disables certificate verification for the whole process, so a MITM can impersonate any server and steal tokens; (a) distribute the CA and set `NODE_EXTRA_CA_CERTS=/path/ca.pem`; (b) fix the server to send the leaf plus intermediate (fullchain) -- verify with `openssl s_client -connect host:443 -servername host`.
15. `localhost` resolves to `::1` first (Node >= 17 keeps OS order) while the API listens on IPv4 (or the reverse). Make both ends agree: bind the API to `0.0.0.0`/`::` or point the proxy to `http://127.0.0.1:3000`.

### Weak-area guidance
- Missed 1-5: redo Modules 1-4 labs by typing every command.
- Missed 6-10: redo Modules 5-7; practise the refused/timeout/empty-reply matrix.
- Missed 11-15: re-read Modules 6-8 and the Q-LNX answers 9, 11, 18-20; draw the diagrams from memory.

### Catch-up plan if behind
Prioritise Modules 4, 5, 6, 8 (ports, Docker networking, TCP states, DNS/TLS) and Q-LNX-01, 05, 09, 11, 13, 14, 18, 19, 21, 23. Skip ssh port forwarding and systemd hardening on the first pass.

---

## Hours estimate

| Module | Hours |
|--------|-------|
| Lab 0 - Lab machine | 0.5 |
| 1 - Shell, permissions, pipes, exit codes | 1.5 |
| 2 - grep/sed/awk/xargs/find | 1.5 |
| 3 - Processes, signals, resources | 2 |
| 4 - Port in use / who holds my port | 1 |
| 5 - Docker flags, networking, DNS, unreachable lab | 2 |
| 6 - TCP, TIME_WAIT, strace, blocked loop | 2.5 |
| 7 - Keep-alive, chunked, pool vs socket vs request | 1.5 |
| 8 - DNS, localhost, TLS | 2 |
| 9 - Logs, systemd, ssh | 2 |
| 10 - Question bank (spoken practice) | 1.5 |
| Assessment and review | 1 |
| **Total** | **19 hours** |

At about 2 hours per day this is roughly 9-10 days; the roadmap budgets 7 days (Days 8-14), so use the "catch-up plan" if time is short.

---

## Not verified

Everything above was executed except the following:
- `tail -F` behaviour across log rotation: the demonstration produced no visible post-rotation line in the non-interactive batch run, so only
  the description is given.
- `dig +trace` (printed nothing useful in this Docker Desktop network; the manual `+norec` walk was used instead).
- `iostat`, `htop`, `mtr`, `ltrace`, `gdb`, `nslookup`, `netstat`: not installed or run; described only. `dmesg` and `journalctl -p err` content for OOM events not shown.
- `docker run --network container:NAME nicolaka/netshoot`, Docker Desktop host-networking opt-in, `docker-compose` practical tasks, `--init`/tini behaviour, `systemd` hardening options
  (`ProtectSystem`, `NoNewPrivileges`), ALB/Kubernetes behaviours, and `tcp_tw_reuse`: stated from documentation, not executed.
- Numeric details (V8 heap limit 259 MB for a 128 MB container, Docker's default unprivileged port sysctl `0`, `localhost` resolving to `::1` first) are specific
  to Docker Desktop with Node v20.20.1 on Ubuntu 24.04; they may differ on other hosts and Node versions.
- The practical tasks and the revision questions at the end of each module are exercises for the reader; they were not run.
- Cleanup performed: containers `lx-main`, `lx-sd`, `lx-srv`, `lx-cli`, `lx-old1`, `lx-old2`, network `lx-net` and image `lx-ubuntu` were removed after the run.
