# Application start sequences (step by step)

**Operator runbook (all apps):** `D:\sugamFlow\docs\LOCAL-START-ALL-APPS.md`  
**Observability (Grafana :3001, laptop only):** `D:\sugamFlow\scripts\start-observability-local.ps1` — see `D:\sugamFlow\observability\OBSERVABILITY.md`  
Do **not** run that compose file on the production app EC2.

Common microservices are shared. **Build** images/jars first, then **start** SEQ 00 once, then only the apps you need.

| Seq | Start script | Build (images / jars) | What |
|-----|--------------|------------------------|------|
| **00** | `00-common-platform.ps1` | Docker: config, discovery, auth, shop, user, notification, gateway + **subscription-service jar :8182** | Postgres, Redis, Eureka, **gateway :9090**, Super Admin catalog |
| **01** | `01-sugamflow-retail.ps1` | Docker: product, stock, order, payment, reporting, account, fieldforce, gst, ledger, gst-mock | Retail/shop A3 core: product, stock, order, payment, reporting, account (no clinic) |
| **01b** | `01b-retail-extras.ps1` | (built with 01) | Optional: gst-mock :8099, gst :8091, ledger :8094, fieldforce :8090. `-Stop` frees RAM |
| **02** | `02-hospital-polyclinic.ps1` | Docker: doctor, appointment, queue-management | Clinic :8092 / :8093 / :8098 |
| **03** | `03-school-erp.ps1` | **Maven jars** under `D:\school\services` (not Docker) | School domain :8181–8199 (+ UI :4300) |
| **04** | `04-crm.ps1` | Docker: crm-service | CRM API :8095 + UI :4500 |

Root: `D:\sugamFlow`

---

## Build all services (proper order)

One script builds by sequence (bases + compose images, school jars for 03):

```powershell
cd D:\sugamFlow

# Bases + SEQ 00+01+02 Docker images (uses IMAGE_TAG from .env.local, e.g. 1.0.2)
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02

# Same + push to Docker Hub for EC2
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02 -Tag 1.0.3 -Push

# School ERP jars
.\scripts\sequences\build-by-sequence.ps1 -Seq 03

# CRM image
.\scripts\sequences\build-by-sequence.ps1 -Seq 04

# Everything
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02,03,04 -Parallel 1
```

### Equivalent manual commands

```powershell
cd D:\sugamFlow
$env:COMPOSE_ENV_FILES = '.env.local'
# optional override:
# $env:IMAGE_TAG = '1.0.2'; $env:IMAGE_PREFIX = 'sumanthakur30'

# 1) Shared Maven libs + JRE base (once)
.\build-docker.ps1 -Parallel 1 -Services config-service   # also builds bases

# Or rebuild bases explicitly:
# docker build -f docker/Dockerfile.common-libs -t sugamflow-common-libs:local .
# docker build -f docker/Dockerfile.jre-local -t sugamflow-jre:local .

# SEQ 00
.\build-docker.ps1 -Parallel 1 -Services config-service,discovery-service,auth-service,shop-service,user-service,notification-service,gateway-service

# SEQ 01
.\build-docker.ps1 -Parallel 1 -Services product-service,stock-service,order-service,payment-service,reporting-service,account-service,fieldforce-service,gst-service,ledger-service,gst-mock-service

# SEQ 02
.\build-docker.ps1 -Parallel 1 -Services doctor-service,appointment-service,queue-management-service

# SEQ 04
.\build-docker.ps1 -Parallel 1 -Services crm-service

# SEQ 03 (School) — jars, not Docker
cd D:\school\services
mvn -DskipTests package
```

### Image names produced

Pattern: `sumanthakur30/<service>:${IMAGE_TAG}` (default tag from `.env.local` = **1.0.2**)

| Seq | Images |
|-----|--------|
| 00 | `config-service` `discovery-service` `auth-service` `shop-service` `user-service` `notification-service` `gateway-service` + host jar `subscription-service` (`D:\school`, `:8182`) |
| 01 | `product-service` `stock-service` `order-service` `payment-service` `reporting-service` `account-service` `fieldforce-service` `gst-service` `ledger-service` `gst-mock-service` |
| 02 | `doctor-service` `appointment-service` `queue-management-service` |
| 04 | `crm-service` |

Infra (no build): `redis:7-alpine`, `mailhog/mailhog:v1.0.1`, host Postgres `:5432`.

---

## Fix login 504 (gateway / shop down)

UI on `:4200` proxies to **gateway `:9090`**. If gateway or shop stopped, login shows `504 Gateway Timeout`.

```powershell
cd D:\sugamFlow
.\scripts\ensure-login-stack.ps1
# then retry http://localhost:4200
```

SEQ 01 / 02 now call this automatically before finishing.

---

## PowerShell note (Windows)

Use **Windows PowerShell** or **pwsh**. Sequence scripts call `Invoke-SugamCompose` (direct `docker compose`) so flags like `-d` are never mis-parsed.

**Do not** call:

```powershell
& .\compose-local.ps1 @{ ComposeArgs = @('up','-d',...) }   # BAD — Hashtable becomes literal arg
```

**Interactive** compose-local (stop-parsing):

```powershell
cd D:\sugamFlow
.\compose-local.ps1 --% up -d --no-build doctor-service appointment-service queue-management-service
```

---

## Quick recipes

### A) Retail / shop only

```powershell
cd D:\sugamFlow
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1 -WithUi
```

Open http://localhost:4200 — `RET-DEMO-01` / `demo` / `Demo@2026`

GST returns, trade ledger, or field force needed? Add the extras (or use `01-sugamflow-retail.ps1 -WithExtras`):

```powershell
.\scripts\sequences\01b-retail-extras.ps1
.\scripts\sequences\01b-retail-extras.ps1 -Only gst-service,gst-mock-service
.\scripts\sequences\01b-retail-extras.ps1 -Stop      # free ~1.5 GB RAM again
```

Billing works without them: order-service uses its local GST calculator and skips ledger vouchers.

### B) Hospital / polyclinic

```powershell
cd D:\sugamFlow
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1          # POS/stock usually needed
.\scripts\sequences\02-hospital-polyclinic.ps1 -WithUi
```

Demo shop: `POLY-DEMO-01` / `demo` / `Demo@2026`

### C) School ERP

```powershell
cd D:\sugamFlow
.\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
.\scripts\sequences\03-school-erp.ps1 -WithUi
```

Open http://localhost:4300 — see `D:\school\docs\DAILY_START.md`

### D) CRM (standalone pilot)

```powershell
cd D:\sugamFlow
# Postgres with crmdb must be up (SEQ 00 or local Postgres)
.\scripts\sequences\04-crm.ps1 -WithUi
# optional: .\scripts\sequences\04-crm.ps1 -RunSmoke
```

Open http://localhost:4500 — API http://localhost:8095  

Local smoke disables entitlements. For real `FEATURE_CRM`:

```powershell
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
# assign crm-professional in subscription-service, then:
.\scripts\sequences\04-crm.ps1 -RequireEntitlement -WithUi
```

### E) Everything (common → retail → clinic → school → CRM)

```powershell
cd D:\sugamFlow
# Build first (once per tag):
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02,03,04

# Then start:
.\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1
.\scripts\sequences\01b-retail-extras.ps1
.\scripts\sequences\02-hospital-polyclinic.ps1
.\scripts\sequences\03-school-erp.ps1 -WithUi
.\scripts\sequences\04-crm.ps1 -WithUi
```

---

## Ports cheat sheet

| Layer | Ports |
|-------|-------|
| Common | Eureka 8761, Config 8888, Gateway **9090**, Auth 8085, Shop 8080, Notify 8087, User 8084 |
| Retail A3 | Product 8081, Stock 8082, Order 8083, Payment 8086, Reporting 8088, Account 8089 |
| Retail extras (01b) | FieldForce 8090, GST 8091, Ledger 8094, GST mock 8099 |
| Clinic | Doctor 8092, Appointment 8093, Queue 8098 |
| School | 8181–8199, UI 4300 |
| CRM | API **8095**, UI **4500** |

---

## Image tags — local vs production

Compose services use:

```text
${IMAGE_PREFIX:-sumanthakur30}/<service>:${IMAGE_TAG:-1.0.0}
```

| Env file | Purpose | Typical tags |
|----------|---------|--------------|
| `.env.local` | Dev on your PC | `IMAGE_TAG=1.0.2` (or whatever you pulled/built) |
| `.env.production` | EC2 / prod | Copy from `.env.production.example`; **never** use `latest` |

Current production-oriented knobs (see `.env.production.example`):

```text
IMAGE_PREFIX=sumanthakur30
IMAGE_TAG=1.0.2
ORDER_IMAGE_TAG=1.0.2
FIELDFORCE_IMAGE_TAG=1.0.2
GST_IMAGE_TAG=1.0.2
LEDGER_IMAGE_TAG=1.0.2
```

Bump **only** the service you released (e.g. `ORDER_IMAGE_TAG`) when you push a single image.

### Local pull / run with a tag

```powershell
cd D:\sugamFlow
# .env.local already sets IMAGE_TAG — or override for one session:
$env:IMAGE_TAG = '1.0.2'
$env:COMPOSE_ENV_FILES = '.env.local'
docker compose pull doctor-service appointment-service queue-management-service
.\scripts\sequences\02-hospital-polyclinic.ps1
```

### Production (EC2) pattern

```bash
# On build machine / CI: build & push with an immutable tag
export IMAGE_PREFIX=sumanthakur30
export IMAGE_TAG=1.0.3   # or git describe --tags --always
docker compose build
docker compose push

# On EC2: set the same tag in .env.production, then
export COMPOSE_ENV_FILES=.env.production
docker compose -f docker-compose.yml -f docker-compose.ec2-rds.yml pull
docker compose -f docker-compose.yml -f docker-compose.ec2-rds.yml up -d
```

Polyclinic images for tag `1.0.2`:

- `sumanthakur30/doctor-service:1.0.2`
- `sumanthakur30/appointment-service:1.0.2`
- `sumanthakur30/queue-management-service:1.0.2`

---

## Notes

- Scripts are **idempotent** where possible (skip if already listening).
- If `:8095` is busy: stop the old Java CRM process, then re-run SEQ 04.
- Existing low-level scripts remain: `start-common-platform.ps1`, `start-sugamflow-app.ps1`, `D:\school\scripts\start-services.ps1`.
