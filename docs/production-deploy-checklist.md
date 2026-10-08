# SugamFlow — Production Deploy Checklist

Use this after shared-lib changes (`platform-common`, `catalog-common`, `security-common`), remediation work, or any microservice/UI release.

**Flow:** Build on Windows → push to Docker Hub → pull on EC2 → deploy Angular UI → validate.

Related docs:

- [EC2-DOCKER-HUB-AND-WINSCP-STEPS.txt](../EC2-DOCKER-HUB-AND-WINSCP-STEPS.txt)
- [START-LOCAL-AND-EC2.txt](../START-LOCAL-AND-EC2.txt)
- [docker-compose.ec2-rds.yml](../docker-compose.ec2-rds.yml) (header comments)
- **EC2 stability / OOM investigation:** [ec2-production-stability-report.md](./ec2-production-stability-report.md)
- **Production support / cross-service log tracing:** [PRODUCTION-SUPPORT-REQUEST-TRACING.md](./PRODUCTION-SUPPORT-REQUEST-TRACING.md)
- Shared libs: [platform-common](https://github.com/sumanthakur30/platform-common), [catalog-common](https://github.com/sumanthakur30/catalog-common), [security-common](https://github.com/sumanthakur30/security-common)

---

## Release tag

Pick one tag for the release (example: `1.0.3`). Use the **same tag** in:

- `.env.local` (`IMAGE_TAG`)
- `.env.production` on EC2 (`IMAGE_TAG`, and `ORDER_IMAGE_TAG` / `FIELDFORCE_IMAGE_TAG` / `GST_IMAGE_TAG` / `LEDGER_IMAGE_TAG` if set)
- Docker Hub image tags you push

---

## Phase 0 — Pre-deploy (RDS + env)

### RDS databases

- [ ] Core DBs exist on RDS: `authdb`, `userdb`, `shopdb`, `productdb`, `orderdb`, `stockdb`, `paymentdb`, `notificationdb`, `reportingdb`, `accountdb`
- [ ] New DBs exist: `fieldforcedb`, `gstdb` — see `infra/postgres/rds-create-fieldforce-gst.sql`
- [ ] Ledger DB exists: `ledgerdb` — see `infra/postgres/rds-create-ledger.sql`
- [ ] Polyclinic DBs exist: `doctordb`, `appointmentdb`, `queuedb` — see `infra/postgres/create-polyclinic-databases.sql`
- [ ] EC2 security group can reach RDS on port 5432

### `.env.production` on EC2

Create from `.env.production.example`. **Do not** copy `.env.local` to EC2.

- [ ] `SPRING_PROFILES_ACTIVE=prod`
- [ ] `IMAGE_PREFIX=sumanthakur30` (or your registry prefix)
- [ ] `IMAGE_TAG=<release>` (e.g. `1.0.3`)
- [ ] `ORDER_IMAGE_TAG`, `FIELDFORCE_IMAGE_TAG`, `GST_IMAGE_TAG`, `LEDGER_IMAGE_TAG` aligned if used
- [ ] All `*_DB_URL` point to RDS with `?sslmode=require` (include `LEDGER_DB_URL`)
- [ ] All `*_DB_USERNAME` / `*_DB_PASSWORD` set
- [ ] `SECURITY_JWT_SECRET`, `SECURITY_INVITE_INTERNAL_KEY`, `SHOP_ADMIN_API_KEY` set (same values across auth/gateway/account)
- [ ] `GST_INTEGRATION_ENABLED=true`, `GST_INTEGRATION_BASE_URL=http://gst-service:8091`
- [ ] `LEDGER_INTEGRATION_ENABLED=true`, `LEDGER_INTEGRATION_BASE_URL=http://ledger-service:8094`
- [ ] `SHOP_INTEGRATION_FIELDFORCE_BASE_URL=http://fieldforce-service:8090`
- [ ] `GATEWAY_CORS_ALLOWED_ORIGIN_PATTERN` matches the real Angular host (e.g. `https://app.sugamflow.com`)
- [ ] All `GATEWAY_*_URI` set (auth, order, stock, product, user, shop, account, payment, notification, reporting, fieldforce, gst, ledger, doctor, appointment, queue)
- [ ] `GATEWAY_CORS_ALLOWED_ORIGIN_PATTERN` matches UI origin (e.g. `https://sugamflow.com`)
- [ ] **JVM / memory (8 GiB instance):** `JAVA_TOOL_OPTIONS` with `-Xmx256m`, `GATEWAY_JAVA_TOOL_OPTIONS` with `-Xmx384m`, `JVM_SERVICE_MEM_LIMIT=400m` — see [ec2-production-stability-report.md](./ec2-production-stability-report.md)
- [ ] **Recommended:** EC2 **≥ 16 GiB RAM** (`m7i-flex.xlarge`) for full 18-service stack
- [ ] **Forbidden:** `SPRING_CLOUD_GATEWAY_SERVER_WEBFLUX_ROUTES_*_URI` (breaks gateway routes)

### Flyway (automatic on service startup)

No manual SQL if services start cleanly:

| Service | Migration | Database |
|---------|-----------|----------|
| shop-service | V12 plan definitions + feature overrides | shopdb |
| order-service | V20/V21 healthcare | orderdb |
| stock-service | V21 workshop job card | stockdb |

Fallback SQL only if Flyway failed: `infra/postgres/patches/`

---

## Phase 1 — Build & push (Windows)

From repo root `D:\sugamFlow`:

### Login

```powershell
docker login -u sumanthakur30
```

### Set tag for this shell

```powershell
$env:IMAGE_PREFIX = "sumanthakur30"
$env:IMAGE_TAG = "1.0.3"
$env:COMPOSE_ENV_FILES = ".env.local"
```

Also set `IMAGE_TAG=1.0.3` inside `.env.local`.

### Build (includes shared Maven libs)

```powershell
.\build-docker.ps1 -Parallel 1
```

This builds `sugamflow-common-libs:local` first (`platform-common` → `catalog-common` → `security-common`), then service images.

**Minimum services to rebuild** after shared-lib changes:

- [ ] `shop-service`, `product-service`, `stock-service`, `order-service`
- [ ] Other servlet services using `security-common`
- [ ] `gateway-service` (if routes/CORS changed)
- [ ] `fieldforce-service`, `gst-service`, polyclinic services if in scope

Selective build:

```powershell
.\build-docker.ps1 -Parallel 1 -Services shop-service,product-service,stock-service,order-service,gateway-service
```

If common-libs step fails alone:

```powershell
docker build -f docker/Dockerfile.common-libs -t sugamflow-common-libs:local . --no-cache
```

### Push to Docker Hub

```powershell
docker compose --env-file .env.local push
```

Or push only changed services:

```powershell
docker compose --env-file .env.local push shop-service product-service stock-service order-service gateway-service
```

### Verify on Docker Hub

- [ ] Tag `<release>` exists for every image EC2 will pull
- [ ] Smoke pull from EC2: `docker pull sumanthakur30/auth-service:<release>`

**Note:** EC2 does **not** clone GitHub shared-lib repos. Libraries are baked into service images at build time.

---

## Phase 2 — Deploy backend (EC2)

SSH to EC2. Deploy folder example: `/home/ec2-user/opt/sugamflow`

Files on server:

- [ ] `docker-compose.ec2-rds.yml`
- [ ] `.env.production` (updated `IMAGE_TAG`)

### Pull

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull
```

Or pull only changed services:

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull \
  shop-service product-service stock-service order-service gateway-service \
  fieldforce-service gst-service doctor-service appointment-service queue-management-service
```

### Start / recreate (recommended order)

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d redis config-service discovery-service

docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate \
  shop-service product-service stock-service order-service user-service auth-service \
  payment-service notification-service reporting-service account-service \
  fieldforce-service gst-service ledger-service \
  doctor-service appointment-service queue-management-service

docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate gateway-service
```

Single service rolling update:

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull order-service
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate --no-deps order-service
```

### Logs (watch Flyway + startup)

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs -f shop-service
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs -f order-service
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production logs -f gateway-service
```

### Health

```bash
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production ps
curl -s http://127.0.0.1:9090/actuator/health
```

- [ ] All target containers `Up`
- [ ] Gateway health `UP`
- [ ] No `DependencyResolutionException` in logs

---

## Phase 3 — Deploy Angular UI

On Windows:

```powershell
cd D:\sugamFlow\shop-management-ui
npm ci
npm run build -- --configuration production
```

- [ ] `environment.prod.ts` API URL points to production gateway
- [ ] Output: `dist/shop-management/` contains `index.html`

Upload via WinSCP:

| Local | EC2 |
|-------|-----|
| `D:\sugamFlow\shop-management-ui\dist\shop-management\` | `/home/ec2-user/sugamflow-ui/` then copy to nginx |

On EC2:

```bash
sudo rm -rf /var/www/sugamflow-ui/*
sudo cp -r /home/ec2-user/sugamflow-ui/* /var/www/sugamflow-ui/
sudo chown -R nginx:nginx /var/www/sugamflow-ui
sudo chmod -R 755 /var/www/sugamflow-ui
sudo nginx -t && sudo systemctl reload nginx
```

- [ ] UI loads at production URL
- [ ] Login works against prod API

---

## Phase 4 — Post-deploy validation

### Automated

From Windows (against prod):

```powershell
.\scripts\test-production-server.ps1 -GatewayUrl https://sugamflow.com -EnvFile .env.production
```

From EC2:

```bash
bash scripts/test-production-server-ec2.sh
```

### Manual smoke

- [ ] Login / shop selection
- [ ] Product list (paginated grid)
- [ ] Order list
- [ ] Stock / inventory flows
- [ ] GST billing (if `GST_INTEGRATION_ENABLED=true`)
- [ ] Feature marketplace / plan entitlements (shop-service V12)
- [ ] Polyclinic: doctor dashboard, appointment, queue (if deployed)
- [ ] Product export (streaming CSV) if used

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Local build fails on `security-common` | `platform-common` not installed in Docker layer | `docker build -f docker/Dockerfile.common-libs -t sugamflow-common-libs:local .` then retry |
| EC2 `manifest not found` | Image/tag not pushed | Rebuild + push with same `IMAGE_TAG` as `.env.production` |
| Old code still running | Stale tag on EC2 | Update `IMAGE_TAG` in `.env.production`, pull, `--force-recreate` |
| 503 on API routes | Missing `GATEWAY_*_URI` | Add direct URIs to `.env.production`, redeploy gateway |
| Plans / features missing | shop-service not redeployed | Redeploy shop-service; check Flyway V12 on shopdb |
| CORS errors in browser | Wrong `GATEWAY_CORS_ALLOWED_ORIGIN_PATTERN` | Match UI origin, restart gateway |
| Maven OOM during build | Too many parallel builds | `.\build-docker.ps1 -Parallel 1`; Docker Desktop memory 8 GB+ |

---

## Quick command reference

**Windows — full release**

```powershell
cd D:\sugamFlow
docker login -u sumanthakur30
$env:IMAGE_PREFIX="sumanthakur30"; $env:IMAGE_TAG="1.0.3"; $env:COMPOSE_ENV_FILES=".env.local"
.\build-docker.ps1 -Parallel 1
docker compose --env-file .env.local push
```

**EC2 — full rolling deploy**

```bash
cd /home/ec2-user/opt/sugamflow
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production pull
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production up -d --force-recreate
```

---

*Last updated: shared-lib Docker build (`docker/Dockerfile.common-libs`, `build-docker.ps1`) and platform remediation releases.*
