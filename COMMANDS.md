# Commands

Local Windows operations. EC2 steps are in [DEPLOYMENT.md](DEPLOYMENT.md). Overview is in [README.md](README.md).

Run PowerShell commands on the Windows machine. A command that says "on the server" belongs in DEPLOYMENT.md.

Scripts were read from disk. Starting or stopping the stack was not done while writing this file, so every start/stop block is untested in this pass. Health URLs match `docker-compose.yml` and the sequence scripts.

Do not put passwords in the command line. Compose reads `D:\sugamFlow\.env.local`.

## 1. Start, stop, and check everything

Directory: `D:\sugamFlow`, unless the command says `D:\sugamflow-doc`.

### Start the shop stack

```powershell
cd D:\sugamFlow
.\scripts\daily-start-sugamflow.ps1 -WithUi
```

This starts Docker Desktop if needed, then `start-local.ps1`, then the shop UI on port 4200 in a new window. Without `-WithUi`, start the UI yourself:

```powershell
cd D:\sugamFlow\shop-management-ui
npx ng serve --port 4200
```

### Preferred product sequences

Directory: `D:\sugamflow-doc`. Sequence 00 first.

```powershell
cd D:\sugamflow-doc
.\scripts\sequences\00-common-platform.ps1 -SkipMailHog
.\scripts\sequences\01-sugamflow-retail.ps1 -WithUi
.\scripts\sequences\01b-retail-extras.ps1
.\scripts\sequences\02-hospital-polyclinic.ps1
.\scripts\sequences\03-school-erp.ps1
.\scripts\sequences\04-crm.ps1 -WithUi
```

`D:\sugamFlow\scripts\sequences\*.ps1` forwards to these files. Same arguments.

### Status

```powershell
cd D:\sugamFlow
.\scripts\daily-status-sugamflow.ps1
```

Success: Docker engine is OK, `docker compose ps` lists the stack, and gateway `http://localhost:9090/actuator/health` returns HTTP 200.

### Stop

Stop Docker services only (Docker Desktop stays up):

```powershell
cd D:\sugamFlow
.\scripts\daily-stop-sugamflow.ps1
```

That runs `docker compose --env-file .env.local down`. It does not delete volumes.

Stop school JVMs, school UI, and the common Docker stack:

```powershell
cd D:\sugamFlow
.\scripts\stop-shared-runtime.ps1 -All
```

Narrower flags: `-School`, `-SchoolUi`, `-CommonDocker`.

### Restart

There is no separate restart binary. Stop, then start the same sequence again.

One Compose service (directory `D:\sugamFlow`):

```powershell
docker compose --env-file .env.local up -d --force-recreate --no-deps <service-name>
```

If it fails to stop, see [When a service will not stop](#when-a-service-will-not-stop).

## 2. Startup order

1. PostgreSQL on `localhost:5432` (Windows service `postgresql-x64-17`).
2. Docker Desktop.
3. Redis, config-service, discovery-service (Eureka `:8761`).
4. auth, shop, user, notification.
5. gateway `:9090`.
6. Then retail, clinic, school, or CRM.

Sequence 00 does steps 2–6 for the common platform. Retail and clinic call `D:\sugamFlow\scripts\ensure-login-stack.ps1` before they finish.

## 3. Service reference

Working directory for every Docker row is `D:\sugamFlow`.

Start one service:

```powershell
docker compose --env-file .env.local up -d --no-deps <service>
```

Stop one service:

```powershell
docker compose --env-file .env.local stop <service>
```

Status:

```powershell
docker compose --env-file .env.local ps <service>
```

Logs:

```powershell
docker compose --env-file .env.local logs --tail=120 <service>
```

Health, from the Windows machine: `http://localhost:<port>/actuator/health`. A good response is HTTP 200. These calls were not executed while writing this file.

Ports below are the defaults in `D:\sugamFlow\docker-compose.yml`.

| Service | Port | Depends on | Start with |
|---|---:|---|---|
| redis | 6379 | Docker | sequence 00 |
| mailhog | 1025 | Docker | sequence 00, unless `-SkipMailHog` |
| config-service | 8888 | redis | sequence 00 |
| discovery-service | 8761 | config | sequence 00 |
| gateway-service | 9090 | discovery, auth, shop | sequence 00 |
| shop-service | 8080 | discovery, Postgres `shopdb` | sequence 00 |
| auth-service | 8085 | discovery, Postgres `authdb` | sequence 00 |
| user-service | 8084 | discovery, Postgres `userdb` | sequence 00 |
| notification-service | 8087 | discovery | sequence 00 |
| product-service | 8081 | gateway up, Postgres `productdb` | sequence 01 |
| stock-service | 8082 | sequence 00, Postgres `stockdb` | sequence 01 |
| order-service | 8083 | sequence 00, Postgres `orderdb` | sequence 01 |
| payment-service | 8086 | sequence 00 | sequence 01 |
| reporting-service | 8088 | sequence 00 | sequence 01 |
| account-service | 8089 | sequence 00 | sequence 01 |
| fieldforce-service | 8090 | sequence 00 | sequence 01b |
| gst-service | 8091 | sequence 00 | sequence 01b |
| ledger-service | 8094 | sequence 00 | sequence 01b |
| gst-mock-service | 8099 | sequence 00 | sequence 01b |
| doctor-service | 8092 | sequence 00 | sequence 02 |
| appointment-service | 8093 | sequence 00 | sequence 02 |
| queue-management-service | 8098 | sequence 00 | sequence 02 |
| crm-service | 8095 | Postgres `crmdb`, sequence 00 if entitlements are on | sequence 04 |
| jyotish-service | 8097 | its own compose path under `D:\sugamFlow\sugamflow-astro` | not part of sequence 00–04 |
| marketplace-integration-service | 8096 | sequence 00 | no daily sequence; start the Compose service only when that feature is in use |

RabbitMQ is in Compose on host port 5672. The daily sequences do not start it by name.

### Clinic without the rest of retail

```powershell
cd D:\sugamFlow
.\scripts\start-common-platform.ps1
.\scripts\start-sugamflow-app.ps1 -SkipPolyclinic
```

Stop only the three clinic containers:

```powershell
cd D:\sugamFlow
docker compose --env-file .env.local stop doctor-service appointment-service queue-management-service
```

Start them again:

```powershell
docker compose --env-file .env.local up -d doctor-service appointment-service queue-management-service
```

### IPD (local)

`D:\sugamFlow\scripts\start-local-ipd.ps1` stops anything listening on ports 8100 and 8101, then starts IPD with `docker-compose.yml` plus `docker-compose.ipd.yml`. Stop with `.\scripts\stop-local-ipd.ps1`. First database: `.\scripts\rds-ipd-accommodation\00-create-ipddb.ps1`.

### School jars

Directory of the sequence: `D:\sugamflow-doc`. The jars and the start script stay in `D:\school`.

```powershell
cd D:\sugamflow-doc
.\scripts\sequences\00-common-platform.ps1 -ExposeSchoolPorts -SkipMailHog
.\scripts\sequences\03-school-erp.ps1
```

`D:\school\scripts\start-services.ps1` is what sequence 03 calls. Ports 8181–8202:

| Port | Service |
|---:|---|
| 8181 | school-settings-service |
| 8182 | subscription-service |
| 8183 | form-builder-service |
| 8184 | workflow-service |
| 8185 | rule-engine-service |
| 8186 | report-builder-service |
| 8187 | school-notification-config-service |
| 8188 | audit-service |
| 8189 | admission-service |
| 8190 | fee-service |
| 8191 | student-service |
| 8192 | attendance-service |
| 8193 | exam-service |
| 8194 | library-service |
| 8195 | hostel-service |
| 8196 | transport-service |
| 8197 | payroll-service |
| 8198 | staff-service |
| 8199 | academic-structure-service |
| 8200 | website-service |
| 8201 | cms-service |
| 8202 | compliance-service |

Health: `http://localhost:8181/actuator/health` (same path on each port). Logs: `D:\school\logs\services\<service>.err.log`.

Stop school JVMs:

```powershell
cd D:\sugamFlow
.\scripts\stop-shared-runtime.ps1 -School
```

UI:

```powershell
cd D:\school\apps\school-ui
npx ng serve --port 4300
```

Or `.\scripts\sequences\03-school-erp.ps1 -WithUi`.

### Build images before a local or EC2 pull

Directory `D:\sugamFlow`. This builds and can push. It was not run here.

```powershell
cd D:\sugamFlow
.\build-docker.ps1 -Parallel 1 -Services config-service,discovery-service,auth-service,shop-service,user-service,notification-service,gateway-service
```

Sequence wrapper (directory `D:\sugamflow-doc`):

```powershell
cd D:\sugamflow-doc
.\scripts\sequences\build-by-sequence.ps1 -Seq 00,01,02
```

School jars only: `-Seq 03`. CRM image: `-Seq 04`.

## 4. Logs, ports, and health

Gateway:

```powershell
curl.exe -sS http://127.0.0.1:9090/actuator/health
```

Eureka:

```powershell
curl.exe -sS http://127.0.0.1:8761/actuator/health
```

Who is listening (Windows):

```powershell
Get-NetTCPConnection -LocalPort 9090 -State Listen
```

Compose logs for one service are in section 3. School jar logs are files, not `docker logs`.

Local observability (laptop only, not the production EC2):

```powershell
cd D:\sugamFlow
.\scripts\start-observability-local.ps1
```

Grafana in that local compose is `http://localhost:3001`. Do not start that compose on the production EC2.

## 5. When a service will not stop

1. `docker compose --env-file .env.local ps <service>` and read the status.
2. `docker compose --env-file .env.local logs --tail=80 <service>`.
3. `docker compose --env-file .env.local stop <service>`.
4. If the container stays, `docker compose --env-file .env.local rm -sf <service>` removes that container. It does not delete the image or the database volume.
5. For a school jar, `.\scripts\stop-shared-runtime.ps1 -School`. Do not delete `D:\school\services\*\target\*.jar` while `java.exe` has it open.

`docker compose down -v` removes volumes. Use it only when you intend to wipe local Docker data.

## 6. Unix equivalents

On a Linux shell the same Compose file works. Directory on the server is `/opt/sugamflow`, not `D:\sugamFlow`. See DEPLOYMENT.md.

```bash
cd /opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production ps
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs --tail=120 gateway-service
curl -sS http://127.0.0.1:9090/actuator/health
```

There is no supported local-Linux daily script in `D:\sugamFlow\scripts`. Local development documented here is Windows PowerShell.

## 7. Scripts reused

No new scripts were added.

| Script | Purpose |
|---|---|
| `D:\sugamflow-doc\scripts\sequences\00-common-platform.ps1` | Common platform |
| `D:\sugamflow-doc\scripts\sequences\01-sugamflow-retail.ps1` | Retail |
| `D:\sugamflow-doc\scripts\sequences\01b-retail-extras.ps1` | GST, ledger, field force |
| `D:\sugamflow-doc\scripts\sequences\02-hospital-polyclinic.ps1` | Clinic |
| `D:\sugamflow-doc\scripts\sequences\03-school-erp.ps1` | School jars |
| `D:\sugamflow-doc\scripts\sequences\04-crm.ps1` | CRM |
| `D:\sugamflow-doc\scripts\sequences\build-by-sequence.ps1` | Build by sequence |
| `D:\sugamFlow\scripts\daily-start-sugamflow.ps1` | Daily shop start |
| `D:\sugamFlow\scripts\daily-stop-sugamflow.ps1` | Daily shop stop |
| `D:\sugamFlow\scripts\daily-status-sugamflow.ps1` | Health snapshot |
| `D:\sugamFlow\scripts\start-docker-clean.ps1` | Docker Desktop |
| `D:\sugamFlow\scripts\ensure-login-stack.ps1` | Gateway and shop for login |
| `D:\sugamFlow\scripts\stop-shared-runtime.ps1` | Stop school and/or Docker |
| `D:\sugamFlow\scripts\start-local-ipd.ps1` | Local IPD |
| `D:\sugamFlow\build-docker.ps1` | Image build |
| `D:\school\scripts\start-services.ps1` | School JVMs |
