# EC2 production stability — root cause investigation

**Instance in screenshot:** `sugamflows` (`i-0c1d29c4665265b55`), **m7i-flex.large** (2 vCPU, **8 GiB RAM**), status **2/3 checks passed** after incidents.

When EC2 shows **Running** but SSH/login/API fail until reboot, the usual causes are:

1. **Instance status check failed** — guest OS hung (OOM killer, memory pressure, disk full, runaway process).
2. System status check OK — AWS hypervisor is fine; problem is inside the VM.

Your **2/3 checks** pattern matches **memory exhaustion or disk full on the guest**, not a network-only glitch.

---

## A) Root cause candidates (ranked)

### 1. **Host RAM exhaustion — highest probability**

**Evidence from repo config (before this fix):**

| Component | Count | Heap cap (old) | Subtotal |
|-----------|-------|----------------|----------|
| Microservices (common env) | 17 | `-Xmx320m` | **5.44 GiB** |
| Gateway | 1 | `-Xmx512m` | **0.50 GiB** |
| **Declared JVM heap only** | | | **~5.9 GiB** |
| + JVM native/metaspace/thread stacks (~128–256 MiB × 18) | | | **+2–4 GiB under load** |
| + Docker engine, **nginx**, OS | | | **~1 GiB** |
| **Total** | | | **Often > 8 GiB** |

**No Docker `mem_limit`** was set — one runaway JVM could take more than `-Xmx`.

**Symptoms match:** login fails (auth/gateway OOM or hung), gateway timeout, SSH may work briefly then hang, **reboot clears memory** → works again.

**EC2 correlation:** Failed **instance status check** after sustained load.

---

### 2. **Docker log / disk growth — high probability**

- Default `json-file` logs with **no rotation** on most services.
- 18 containers × Spring Boot logs → root volume fills (`/` or `/var/lib/docker`).
- Full disk → writes fail → DB migrations, sessions, nginx, Docker break → “dead” server until reboot/cleanup.

**Check:** `df -h`, `docker system df`, `du -sh /var/lib/docker/containers/*`.

---

### 3. **No health checks on critical path (gateway, auth) — medium**

Only **redis** and **discovery-service** had healthchecks.

- Gateway starts when discovery is healthy, **not** when auth/order/product are ready.
- Under memory pressure, auth may be down while gateway returns 502/504 → “can’t login”.
- **No auto-recovery** for gateway/auth beyond `restart: unless-stopped` (does not restart on hung JVM inside container).

---

### 4. **RDS connection pressure — lower on current config**

- Default `DB_POOL_MAX_SIZE=3` per service × ~16 DB users ≈ **48 connections** — usually fine on RDS.
- Risk rises if pool sizes were increased (fieldforce/gst used 10 in local defaults) or many RDS DBs on one small instance.

---

### 5. **CPU starvation on 2 vCPU — medium under peak**

18 JVMs + Eureka heartbeats every 10s + nginx + Angular traffic on **2 vCPUs** → latency spikes, health checks fail, cascading timeouts. Unlikely alone to require reboot, but amplifies memory/GC pressure.

---

### 6. **Application-level issues — lower as reboot root cause**

- Product list capped at 500 rows (`catalog.list.max-size`).
- Hikari pools capped at 3 in prod compose.
- No evidence of unbounded in-memory caches in prod config.
- **Not** the primary “fix on reboot” pattern unless combined with (1).

---

### Note: no separate `billing-service`

Billing flows use **order-service**, **payment-service**, and **user-service**. Gateway routes billing via those services.

---

## B) Files changed (this investigation)

| File | Change |
|------|--------|
| `docker-compose.ec2-rds.yml` | Log rotation, `mem_limit`, lower default `-Xmx`, `-XX:+ExitOnOutOfMemoryError`, Redis maxmemory, gateway healthcheck |
| `.env.production.example` | Safer JVM + mem limit env vars |
| `scripts/ec2-host-health-audit.sh` | **New** — run on EC2 when unhealthy |
| `docs/ec2-production-stability-report.md` | This document |

---

## C) Exact config changes (deploy to EC2)

### 1. Update `.env.production` on EC2

```bash
JAVA_TOOL_OPTIONS=-Duser.timezone=Asia/Kolkata -Xms128m -Xmx256m -XX:+ExitOnOutOfMemoryError
GATEWAY_JAVA_TOOL_OPTIONS=-Duser.timezone=Asia/Kolkata -Xms128m -Xmx384m -XX:+ExitOnOutOfMemoryError
JVM_SERVICE_MEM_LIMIT=400m
GATEWAY_SERVICE_MEM_LIMIT=640m
DISCOVERY_SERVICE_MEM_LIMIT=512m
REDIS_MEM_LIMIT=128m
DB_POOL_MAX_SIZE=3
```

### 2. Redeploy compose

```bash
cd /home/ec2-user/opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate
```

### 3. **Strongly recommended:** resize instance

| Option | RAM | Fit for full stack |
|--------|-----|-------------------|
| m7i-flex.large (current) | 8 GiB | Tight — requires 256m heaps + mem limits |
| **m7i-flex.xlarge** | **16 GiB** | **Recommended for 18 JVMs + nginx** |
| m7i-flex.2xlarge | 32 GiB | Headroom for growth / imports |

### 4. Add swap (safety net only — not a substitute for RAM)

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 5. CloudWatch alarms (AWS console)

| Alarm | Threshold |
|-------|-------------|
| `StatusCheckFailed_Instance` | ≥ 1 for 2 periods |
| `mem_used_percent` (CW agent) | > 85% for 5 min |
| `disk_used_percent` on `/` | > 80% |
| Custom: curl gateway `/actuator/health` | failed 3× |

---

## D) Commands to verify after deployment

On EC2:

```bash
bash scripts/ec2-host-health-audit.sh

free -h
docker stats --no-stream
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production ps

curl -sf http://127.0.0.1:9090/actuator/health
dmesg -T | grep -i oom | tail -20

docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs gateway-service --tail 100
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs auth-service --tail 100
```

Load test (from your PC):

```powershell
.\scripts\test-production-server.ps1 -GatewayUrl https://api.sugamflow.com -EnvFile .env.production
```

Watch during test: **no container should exceed its `mem_limit`**, host `available` should stay > 500 MiB.

---

## E) Production checklist (before go-live / after incidents)

- [ ] Instance **≥ 16 GiB RAM** for full microservice stack, or reduce services with Compose profiles
- [ ] `.env.production` uses **256m / 384m** heaps, not 320m / 512m
- [ ] `docker-compose.ec2-rds.yml` deployed with **log rotation + mem_limit**
- [ ] `bash scripts/ec2-host-health-audit.sh` saved after deploy (baseline)
- [ ] CloudWatch **instance status check** alarm → SNS/email
- [ ] Disk alarm on `/` and `/var/lib/docker`
- [ ] Weekly: `docker system prune -f` (images not in use) — **not** volumes
- [ ] RDS: confirm `max_connections` > sum of all service pools
- [ ] nginx + UI on host: confirm `df -h` > 20% free on root
- [ ] After OOM incident: collect audit script + `dmesg` before reboot if possible

---

## Architecture summary (production)

```
Browser → nginx (static Angular on EC2 host)
       → gateway-service:9090 (only published port)
       → auth / order / product / … (16+ internal JVMs)
       → AWS RDS (PostgreSQL, multi-DB)
       → redis (sessions/cache for user/account)
```

**Failure mode you saw:** host runs out of RAM or disk → guest OS degrades → login/API dead → reboot clears state → temporary fix.

**Permanent fix:** right-size RAM, cap containers, rotate logs, monitor, and optionally split optional services (polyclinic, fieldforce) onto profiles or a second instance.
