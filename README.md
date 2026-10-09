# SugamFlow

Operator entry point. Command detail is in [COMMANDS.md](COMMANDS.md). AWS and EC2 steps are in [DEPLOYMENT.md](DEPLOYMENT.md).

These three files are the operational reference. Product guides stay under `docs/`. Application source, live `.env` files, and executable scripts stay in `D:\sugamFlow` and `D:\school`.

Commands below were taken from the scripts and Compose files. They were not started as part of writing this page. Treat a command as untested until you run it.

## What this is

SugamFlow is a multi-tenant business platform. One gateway and one login serve retail, clinic, school, and CRM. Each product is a set of Spring Boot services plus an Angular UI.

| Layer | Where it runs locally | Role |
|---|---|---|
| Common | Docker, `D:\sugamFlow` | Postgres (Windows service), Redis, Eureka, config, auth, shop, user, notification, gateway |
| Retail | Docker | Product, stock, order, payment, reporting, account |
| Retail extras | Docker, optional | GST, GST mock, ledger, field force |
| Clinic | Docker, optional | Doctor, appointment, queue. IPD only when needed |
| School | Maven jars, `D:\school` | School domain services on ports 8181–8202 |
| CRM | Docker | CRM API and UI |

Shop UI: `D:\sugamFlow\shop-management-ui` on port 4200. School UI: `D:\school\apps\school-ui` on port 4300. CRM UI is started by the CRM sequence on port 4500.

## Prerequisites

On the Windows machine:

1. Docker Desktop. The disk image used here is `D:\Docker`. If Docker will not start, see `docs/DOCKER-D-DRIVE-SETUP.md`.
2. JDK 17 for school jars. The school start script looks for `C:\Program Files\Java\jdk-17\bin\java.exe` when `JAVA_HOME` is not set.
3. PostgreSQL 17 on `localhost:5432`. Service name documented in local notes: `postgresql-x64-17`.
4. Node.js, for the Angular UIs (`npx ng serve`).
5. `D:\sugamFlow\.env.local` for local Compose. Do not commit it. Copy from `.env.example` if you are setting up a new machine.
6. Eureka on port 8761 and the gateway on port 9090 before retail, clinic, school, or CRM.

Passwords and API keys stay in `.env.local`, `.env.production`, and the local credential files. They are not written in this repository.

## Run locally

Run this from PowerShell. Directory: `D:\sugamflow-doc`.

```powershell
cd D:\sugamflow-doc
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1 -WithUi
```

What this does: sequence 00 starts the shared platform. Sequence 01 starts the retail services and opens the shop UI. The old folder `D:\sugamFlow\scripts\sequences` only forwards to these files.

Success looks like: gateway health returns at `http://localhost:9090/actuator/health`, Eureka is up at `http://localhost:8761`, and the shop UI answers at `http://localhost:4200`.

Check without starting anything:

```powershell
cd D:\sugamFlow
.\scripts\daily-status-sugamflow.ps1
```

## Start and stop the whole local shop stack

These scripts live in the application repo because they locate Compose from their own folder.

Start (Windows, directory `D:\sugamFlow`):

```powershell
cd D:\sugamFlow
.\scripts\daily-start-sugamflow.ps1 -WithUi
```

Stop the Docker stack and leave Docker Desktop running:

```powershell
cd D:\sugamFlow
.\scripts\daily-stop-sugamflow.ps1
```

Stop school jars as well:

```powershell
cd D:\sugamFlow
.\scripts\stop-shared-runtime.ps1 -All
```

`docker compose down -v` deletes volumes. Do not use it as a normal stop.

## Other products

| Product | Start | UI |
|---|---|---|
| Clinic | `.\scripts\sequences\02-hospital-polyclinic.ps1` after 00 | Shop UI, clinic routes |
| School | `.\scripts\sequences\03-school-erp.ps1` after 00 with `-ExposeSchoolPorts` | `http://localhost:4300` |
| CRM | `.\scripts\sequences\04-crm.ps1` | `http://localhost:4500` |

School demo login is printed by `D:\school\scripts\seed-school-demo-auth.ps1` (organization `demo-school`, username `admin`). Do not copy passwords from scratch notes into git.

## Troubleshooting

| Symptom | What to check |
|---|---|
| Login shows HTTP 504 | Gateway `:9090` or shop-service is down. From `D:\sugamFlow`: `.\scripts\ensure-login-stack.ps1` |
| Docker engine not running | `.\scripts\start-docker-clean.ps1`. Disk image path: `D:\Docker` |
| School jar rebuild fails with "Unable to rename" | A school JVM still has the jar open. `D:\school\scripts\start-services.ps1` stops school JVMs before `mvn package` when it is building |
| Port already in use | `.\scripts\daily-status-sugamflow.ps1`, then stop the owning sequence before starting it again |
| School UI cannot reach APIs | Sequence 00 must be started with `-ExposeSchoolPorts`, and the gateway must be the Docker gateway (`host.docker.internal`) |

## Where files live

- `COMMANDS.md` — start, stop, health, logs, one service at a time.
- `DEPLOYMENT.md` — EC2, WinSCP, image push and pull.
- `docs/` — product and operations guides.
- `scripts/sequences/` — sequences 00–04.
- `config/` — Compose examples. Live env files stay in `D:\sugamFlow` and `D:\school`.
- `D:\sugamFlow\scripts` — Docker, seed, and smoke scripts.
- `D:\school\scripts` — school startup. Do not move these.
