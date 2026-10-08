# SugamFlow + School — Local Start Cheat Sheet

**Prefer the fresh runbook:** [LOCAL-START-ALL-APPS.md](LOCAL-START-ALL-APPS.md) (Retail, Hospital, School, CRM, Astro, IPD, subscription `:8182`).

**Roots**

- Platform: `D:\sugamFlow`
- School: `D:\school`

**Prerequisite:** Docker Desktop running (except School jar-only path). Host Postgres `:5432`.

**Rule:** Start **SEQ 00 once**, then only the stack you need. One Eureka — do not run jar Eureka and Docker Eureka both on `:8761`.

---

## Shared idea

```text
SEQ 00  = common (Redis, Eureka, auth, shop, gateway :9090)   ← shared by all
SEQ 01  = Retail only
SEQ 02  = Hospital / Polyclinic only
SEQ 03  = School ERP only
SEQ 04  = CRM only
IPD     = separate (not SEQ 00–04) — Maven jars :8100 / :8101
```

If common is already up → **do not re-run SEQ 00**; only run the app sequence.

Official source: `D:\sugamFlow\scripts\sequences\README.md`

---

## SEQ 00 — COMMON PLATFORM

Needed by Retail, Hospital, School (Docker path). CRM optional.

```powershell
cd D:\sugamFlow

# For Retail / Hospital / CRM / School — Eureka on host :8761 (canonical)
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
# -ExposeSchoolPorts is deprecated (already default). Safe to pass for old scripts.
.\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
```

| What | Port |
|------|------|
| Redis | 6379 |
| Eureka (canonical) | **8761** |
| Config (canonical) | **8888** |
| Gateway | **9090** |
| Shop | 8080 |
| Auth | 8085 |
| User | 8084 |
| Notification | 8087 |
| MailHog (if not skipped) | SMTP 1025, UI 8025 |
| Legacy (do not use) | 18761 / 18888 |

**Build once (images):**

```powershell
cd D:\sugamFlow
.\scripts\sequences\build-by-sequence.ps1 -Seq 00
```

**Login 504 fix:**

```powershell
cd D:\sugamFlow
.\scripts\ensure-login-stack.ps1
```

---

## SugamFlow RETAIL

Docker required. No `-ExposeSchoolPorts`.

```powershell
cd D:\sugamFlow
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1 -WithUi
```

| Item | Value |
|------|--------|
| UI | http://localhost:4200 |
| Demo | `RET-DEMO-01` / `demo` / `Demo@2026` |

| Service | Port |
|---------|------|
| Product | 8081 |
| Stock | 8082 |
| Order | 8083 |
| Payment | 8086 |
| Reporting | 8088 |
| Account | 8089 |
| FieldForce | 8090 |
| GST | 8091 |
| Ledger | 8094 |
| GST mock | 8099 |

**Build:**

```powershell
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01
```

---

## HOSPITAL / POLYCLINIC

Numbered local start (do not use School `ng serve --port 4300`):

1. **Build only when images fail** (example: missing `fieldforce-service:1.0.2`). Do not rebuild SEQ 00 unless gateway is an old image that still fails.
   `.\scripts\sequences\build-by-sequence.ps1 -Seq 01,02`
2. **SEQ 00 once** if Redis / Eureka `:8761` / gateway `:9090` / shop / auth are not already healthy. If common is up, skip 00.
3. **Then SEQ 01, then SEQ 02 with UI:**
   `.\scripts\sequences\01-sugamflow-retail.ps1`
   `.\scripts\sequences\02-hospital-polyclinic.ps1 -WithUi`
4. **Demo:** `POLY-DEMO-01` / `demo` / `Demo@2026` (also `TRUST-POLY-01`).
5. **UI is shop-management-ui on `:4200`**, not School UI on `:4300`.
6. Gateway `MalformedInputException` on properties = **file encoding**, not TLS.

Usually needs Retail POS/stock too.

```powershell
cd D:\sugamFlow
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1
.\scripts\sequences\02-hospital-polyclinic.ps1 -WithUi
```

| Item | Value |
|------|--------|
| UI | http://localhost:4200 (same shop UI) |
| Demo | `POLY-DEMO-01` or `TRUST-POLY-01` / `demo` / `Demo@2026` |

| Service | Port |
|---------|------|
| Doctor | 8092 |
| Appointment | 8093 |
| Queue | 8098 |

**Build:**

```powershell
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02
```

---

## IPD / ACCOMMODATION (not a SEQ number)

On top of Hospital (`00` + `01` + `02`). Local Maven jars (gateway points to host).

```powershell
cd D:\sugamFlow
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1
.\scripts\sequences\02-hospital-polyclinic.ps1

# IPD jars
.\scripts\restart-ipd-billing-local.ps1 -SkipBuild

# UI
cd D:\sugamFlow\shop-management-ui
npx ng serve --port 4200
```

**Or all-in-one:**

```powershell
cd D:\sugamFlow
.\scripts\restart-all-microservices-local.ps1 -WithUi
```

| Service | Port |
|---------|------|
| ipd-service | **8100** |
| accommodation-service | **8101** |

| Item | Value |
|------|--------|
| UI routes | `/ipd/dashboard`, nursing, ops |
| Demo | `POLY-DEMO-01` / `demo` / `Demo@2026` |
| Docs | `D:\sugamFlow\scripts\rds-ipd-accommodation\SCRIPTS-LOCAL.md` |

**Verify:**

```powershell
.\scripts\rds-ipd-accommodation\03-verify.ps1
.\scripts\rds-ipd-accommodation\04-test-hospital-flow.ps1
```

---

## SCHOOL ERP

Needs common with **`-ExposeSchoolPorts`** (or jar platform). School services are **Maven jars**, not Docker.

### Docker common (preferred when sharing Eureka with Retail/Hospital)

```powershell
cd D:\sugamFlow
.\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
.\scripts\sequences\03-school-erp.ps1 -WithUi
```

### No Docker (jar platform)

```powershell
cd D:\school
.\scripts\start-platform.ps1 -SugamFlowRoot "D:\sugamFlow" -SkipMailHog
.\scripts\start-services.ps1
cd D:\school\apps\school-ui
npx ng serve --port 4300
```

| Item | Value |
|------|--------|
| School UI | http://localhost:4300 |
| Shop UI (register school) | http://localhost:4200 |
| Demo login | `demo-school` / `admin` / `password` |
| Admin API key (local) | `dev-shop-admin-key` |

| Port | School service |
|------|----------------|
| 8181 | school-settings |
| 8182 | subscription |
| 8183 | form-builder |
| 8184 | workflow |
| 8185 | rule-engine |
| 8186 | report-builder |
| 8187 | school-notification-config |
| 8188 | audit |
| 8189 | admission |
| 8190 | fee |
| 8191 | student |
| 8192 | attendance |
| 8193 | exam |
| 8194 | library |
| 8195 | hostel |
| 8196 | transport |
| 8197 | payroll |
| 8198 | staff |

**Build school jars:**

```powershell
cd D:\sugamFlow
.\scripts\sequences\build-by-sequence.ps1 -Seq 03
# or: cd D:\school\services ; mvn -DskipTests package
```

**Note:** Redis is **not** required for School offline sync (Postgres + localStorage). Redis is for common/retail platform.

---

## CRM

Can run with Postgres only for pilot; use SEQ 00 if you need real entitlements / gateway.

```powershell
cd D:\sugamFlow

# Pilot (entitlements relaxed)
.\scripts\sequences\04-crm.ps1 -WithUi

# With platform + entitlement checks
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\04-crm.ps1 -RequireEntitlement -WithUi
```

| Item | Value |
|------|--------|
| CRM API | http://localhost:8095 |
| CRM UI | http://localhost:4500 |

**Build:**

```powershell
.\scripts\sequences\build-by-sequence.ps1 -Seq 04
```

---

## “I only want X today”

| Work on | Run |
|---------|-----|
| Retail only | `00` → `01 -WithUi` |
| Hospital OPD only | `00` → `01` → `02 -WithUi` |
| IPD | `00` → `01` → `02` → `restart-ipd-billing-local.ps1` + UI `:4200` |
| School only | `00 -ExposeSchoolPorts` → `03 -WithUi` |
| CRM only | `04 -WithUi` (or `00` + `04 -RequireEntitlement`) |
| School + Retail same day | One `00 -ExposeSchoolPorts`, then `01` and `03` (same Eureka) |

---

## Everything (rare)

```powershell
cd D:\sugamFlow
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02,03,04

.\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1
.\scripts\sequences\02-hospital-polyclinic.ps1
.\scripts\sequences\03-school-erp.ps1 -WithUi
.\scripts\sequences\04-crm.ps1 -WithUi

# optional IPD:
.\scripts\restart-ipd-billing-local.ps1 -SkipBuild
```

---

## Port conflict rules

1. **One Eureka on `:8761`** — jar `start-platform` **or** Docker `-ExposeSchoolPorts`, not both.
2. School jars expect Eureka at `http://localhost:8761`.
3. Shop UI = **`:4200`**, School UI = **`:4300`**, CRM UI = **`:4500`**.
4. Free a stuck port:

```powershell
netstat -ano | findstr :<port>
taskkill /PID <pid> /F
```

---

## UI ports summary

| App | URL |
|-----|-----|
| SugamFlow shop / retail / hospital / IPD | http://localhost:4200 |
| School ERP | http://localhost:4300 |
| CRM | http://localhost:4500 |
| Gateway (all APIs) | http://localhost:9090 |
| Eureka (School path) | http://localhost:8761 |
| MailHog | http://localhost:8025 |
