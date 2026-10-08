# SugamFlow — AWS deployment & domain routing

This document describes a production-oriented way to host the SugamFlow stack on AWS with clear separation between the marketing site, the shop management app, and the API gateway.

For local PostgreSQL bootstrap and day-to-day development database operations, see `docs/LOCAL-POSTGRES.md`.

## Domain structure

| URL | Purpose | Typical AWS pattern |
|-----|---------|------------------------|
| `https://sugamflow.com` | Landing / entry website (`sugamflow-landing`) | S3 + CloudFront, or Amplify Hosting |
| `https://app.sugamflow.com` | Shop Management UI (`shop-management-ui`) | S3 + CloudFront, or Amplify Hosting |
| `https://api.sugamflow.com` | Backend API (Spring Cloud Gateway + microservices) | Application Load Balancer → ECS Fargate, EKS, or EC2 |

Use **Route 53** for DNS: **A/AAAA alias** records pointing to CloudFront (static sites) and to the ALB (API).

## TLS certificates

- Use **AWS Certificate Manager (ACM)**.
- For **CloudFront**, request or import the certificate in **us-east-1** (required by CloudFront).
- A single ACM cert can include:
  - `sugamflow.com`
  - `*.sugamflow.com`  
  (covers `app` and `api` subdomains.)

Attach the certificate to CloudFront distributions and to the ALB HTTPS listener.

## Static sites (landing + app)

1. Build each Angular app for production:
   - `sugamflow-landing`: `ng build --configuration=production`
   - `shop-management-ui`: `ng build --configuration=production`
2. Upload the `dist/` output to **S3** (bucket not public; access only via CloudFront using **Origin Access Control**).
3. Create **CloudFront** distributions with:
   - HTTPS only
   - Default root object / SPA fallback: map **403/404** to `index.html` for client-side routing
4. Point Route 53 **A/AAAA alias** for `sugamflow.com` and `app.sugamflow.com` to the respective distributions.

### Landing links to the app

The landing production environment is expected to deep-link to the app host:

- `registerUrl`: `https://app.sugamflow.com/register`
- `loginUrl`: `https://app.sugamflow.com/login`

Source: `sugamflow-landing/src/environments/environment.prod.ts`

Keep these URLs aligned with the hostname you actually deploy for the shop UI.

## API (`api.sugamflow.com`)

### Traffic path

**Internet → Route 53 → ALB (443) → targets (gateway service)**

- Run the **gateway** behind the ALB (internal port may differ from 443; ALB maps **443 → container port**, e.g. 9090).
- All other microservices should **not** be exposed publicly; only the gateway should be on the public load balancer. Service-to-service calls stay on the private network (VPC, service mesh, or internal DNS).

### Health checks

Point the ALB target group health check at a stable endpoint (e.g. gateway **Actuator** `/actuator/health` if exposed and safe for the load balancer).

### Shop UI calling the API

`shop-management-ui` production environment currently uses an empty `apiUrl` (same-origin / dev-proxy style). When the UI is served from `app.sugamflow.com` and the API from `api.sugamflow.com`, set in **`environment.prod.ts`** (or your build pipeline):

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.sugamflow.com',
  apiGatewayUrl: 'https://api.sugamflow.com',
  apiResourcesPrefix: '/api/v1',
  shopServiceUrl: '',
  shopAdminApiKey: '' // prefer server-side or secrets; avoid embedding long-lived keys in the browser bundle
};
```

Rebuild and redeploy the `app` static assets after any change.

### CORS

The gateway must allow browser calls from `https://app.sugamflow.com`. Configure gateway CORS for production (e.g. environment variable or Spring profile used in prod) so **allowed origins** include `https://app.sugamflow.com`.  
Review: `gateway-service` CORS configuration and prod profile properties.

## Compute options (summary)

| Approach | When to use |
|----------|-------------|
| **ECS Fargate** + ALB | Good default: no servers to patch, task definitions, scaling |
| **EKS** | If you already run Kubernetes operationally |
| **EC2 + Docker Compose** | Acceptable for **staging** or small pilots; add monitoring, backups, and process for updates |

For production databases, prefer **managed** services (e.g. **RDS for PostgreSQL**) rather than running databases inside ad-hoc containers, unless you have a strong ops story for backups and HA.

## Security checklist (minimum)

- [ ] Secrets (JWT signing key, DB passwords, invite keys) in **Secrets Manager** or **SSM Parameter Store**, injected at runtime — not committed to git.
- [ ] **WAF** on CloudFront (and optionally on ALB) for common attack patterns.
- [ ] Least privilege IAM roles for ECS tasks / EC2 / CI deploy role.
- [ ] HTTPS everywhere; redirect HTTP → HTTPS on CloudFront and ALB.
- [ ] Do not expose Eureka, Config Server, or internal microservice ports on the public internet.

## Docker: build and push all microservices (ECR)

Images are defined in the repo root `docker-compose.yml` as `sugamflow/<service-name>:${IMAGE_TAG:-latest}`. Every backend service that has a `build:` entry should be built with the **same `IMAGE_TAG`** so versions stay aligned.

### Microservices (build context = folder name)

| Service | Image name (Compose) |
|---------|----------------------|
| config-service | `sugamflow/config-service` |
| discovery-service | `sugamflow/discovery-service` |
| gateway-service | `sugamflow/gateway-service` |
| shop-service | `sugamflow/shop-service` |
| product-service | `sugamflow/product-service` |
| stock-service | `sugamflow/stock-service` |
| order-service | `sugamflow/order-service` |
| user-service | `sugamflow/user-service` |
| auth-service | `sugamflow/auth-service` |
| payment-service | `sugamflow/payment-service` |
| notification-service | `sugamflow/notification-service` |
| reporting-service | `sugamflow/reporting-service` |
| account-service | `sugamflow/account-service` |

Angular apps (`shop-management-ui`, `sugamflow-landing`) are not in this Compose file; build them with `ng build` and host static files on S3/CloudFront (see above).

### 1) Local: build everything

From the repository root (where `docker-compose.yml` lives), using **PowerShell**:

```powershell
cd D:\sugamFlow
$env:IMAGE_TAG = "1.0.0"   # or: git describe --tags --always
docker compose build
```

To build **one** service:

```powershell
docker compose build shop-service
```

### 1b) Production images for EC2 (build locally, move to server)

Images are **plain JVM JARs** in the Dockerfiles; “production” behavior is mainly **`SPRING_PROFILES_ACTIVE=prod`** and **RDS secrets** when you **run** the container on EC2 (see each service’s `application-prod.properties`), not a separate Dockerfile target.

**1. Build all services on your PC** (repo root):

```powershell
cd D:\sugamFlow
$env:IMAGE_PREFIX = "sugamflow"    # or sumanthakur30/sugamflow — must match what EC2 will use
$env:IMAGE_TAG = "1.0.0"           # pin a release tag
docker compose build
```

**2. Move images to EC2 — pick one:**

- **A) Registry (recommended):** `docker login`, then `docker push` to Docker Hub or ECR (steps in §4 below). On EC2: `docker pull …` then `docker compose up -d`.

- **B) Air-gapped / no registry:** save images to a tarball, copy, load:

```powershell
$P = $env:IMAGE_PREFIX; if (-not $P) { $P = "sugamflow" }
$T = $env:IMAGE_TAG; if (-not $T) { $T = "latest" }
$imgs = @(
  "$P/config-service:$T","$P/discovery-service:$T","$P/gateway-service:$T","$P/shop-service:$T",
  "$P/product-service:$T","$P/stock-service:$T","$P/order-service:$T","$P/user-service:$T",
  "$P/auth-service:$T","$P/payment-service:$T","$P/notification-service:$T","$P/reporting-service:$T",
  "$P/account-service:$T"
)
docker save -o "sugamflow-images-$T.tar" @imgs
```

Copy `sugamflow-images-1.0.0.tar` to EC2 (`scp`), then on EC2:

```bash
sudo docker load -i sugamflow-images-1.0.0.tar
```

**3. On EC2**, use the **same** `IMAGE_PREFIX` / `IMAGE_TAG` in `.env` with your `docker-compose.yml`, and set **`SPRING_PROFILES_ACTIVE=prod`**, **`SPRING_DATASOURCE_*`**, **`SECURITY_JWT_SECRET`**, etc., before `docker compose up -d`.

### 2) AWS Console: create ECR repositories

For **each** image name above, create a private repository in **Amazon ECR** (same Region you will run workloads in, e.g. `ap-south-1`):

1. Open **AWS Console** → **Amazon ECR** → **Repositories** → **Create repository**.
2. **Repository name**: use a clear prefix, e.g. `sugamflow/shop-service` (slashes are allowed in ECR).
3. Leave encryption and scan settings per your org policy → **Create**.

Repeat for all 13 services (or automate creation with AWS CLI / IaC).

Your **registry URL** looks like:

`123456789012.dkr.ecr.<region>.amazonaws.com`

### 3) Authenticate Docker to ECR (CLI)

Install **AWS CLI v2**, configure credentials (`aws configure`), then:

```powershell
$Region = "ap-south-1"   # your region
$AccountId = "123456789012"   # your AWS account id
$Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"

aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Registry
```

### 4) Tag and push each image

After `docker compose build`, local images are named `${IMAGE_PREFIX:-sugamflow}/<service>:<tag>` (default prefix `sugamflow`). Retag and push to ECR:

```powershell
$Tag = $env:IMAGE_TAG
if (-not $Tag) { $Tag = "latest" }
$Prefix = $env:IMAGE_PREFIX
if (-not $Prefix) { $Prefix = "sugamflow" }

$Services = @(
  "config-service","discovery-service","gateway-service","shop-service",
  "product-service","stock-service","order-service","user-service",
  "auth-service","payment-service","notification-service","reporting-service",
  "account-service"
)

foreach ($s in $Services) {
  $Local = "${Prefix}/${s}:${Tag}"
  $Remote = "${Registry}/${Prefix}/${s}:${Tag}"
  docker tag $Local $Remote
  docker push $Remote
}
```

Use the **same `IMAGE_TAG`** in your ECS task definitions, Kubernetes manifests, or EC2 Compose override so all nodes pull matching versions.

### 5) CI/CD (optional)

In **GitHub Actions**, **GitLab CI**, or **CodePipeline**: run `docker compose build`, login to ECR with an OIDC or IAM role, then `docker push` the same tags. Do not commit `.env` or RDS passwords; inject `SPRING_DATASOURCE_*`, `SECURITY_JWT_SECRET`, etc. from **Secrets Manager** or **SSM Parameter Store** at deploy time.

---

## AWS Console: run the stack (high level)

Exact clicks depend on whether you use **ECS Fargate**, **EKS**, or **EC2 + Docker Compose**. The pattern is the same:

1. **VPC**: private subnets for services; public subnet only for ALB (and optionally NAT).
2. **RDS**: PostgreSQL (or your chosen engine) in private subnets; security group allows **only** the app tier on the DB port (5432 for PostgreSQL).
3. **Secrets**: store `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SECURITY_JWT_SECRET`, `SECURITY_INVITE_INTERNAL_KEY`, mail credentials, etc. in **Secrets Manager**; reference them in task definitions or instance user-data.
4. **ECR**: pull images from the repositories you created; task/instance IAM role needs `ecr:GetAuthorizationToken` and `ecr:BatchGetImage` on those repos.
5. **Start order (logical)**:
   - **config-service** (if used) → **discovery-service** → remaining microservices → **gateway-service** last among APIs that register with Eureka.
   - Set **`EUREKA_CLIENT_SERVICEURL_DEFAULTZONE`** to the **reachable** Eureka URL from each task (e.g. `http://discovery.internal:8761/eureka` on your internal DNS or service connect name).
   - Set **`SPRING_CLOUD_CONFIG_URI`** if you use config server.
6. **Public ALB**: one target group → **gateway-service** container port **9090** (or your mapped port). Health check path e.g. `/actuator/health` if exposed.
7. **Security groups**: ALB → gateway only; **do not** put Eureka, config, or internal services on a public SG.
8. **Environment-specific URLs**: override Compose defaults, e.g. `AUTH_INTEGRATION_SHOP_BASE_URL` must be the **internal** base URL to **shop-service** as seen from **auth-service** (not `localhost`).

### EC2 + Docker Compose on AWS

- Launch EC2 in a private subnet (or public only for lab); install Docker and Docker Compose plugin.
- Copy `docker-compose.yml` and a **production** `.env` (RDS URL, secrets, `IMAGE_TAG`, registry prefix).
- Change `image:` lines to full ECR URLs (`123456789012.dkr.ecr.region.amazonaws.com/sugamflow/gateway-service:1.0.0`) or use `docker compose pull` after logging in to ECR.
- Run **only** the gateway behind an ALB; bind internal services to the Docker network, not `0.0.0.0` on the internet-facing interface, unless you have a proper SG.

**Minimal EC2 compose (only `shop-service` in `docker-compose.yml`):** `docker compose config --services` will not list `user-service` until you add it. Either replace `docker-compose.yml` with the full file from this repo, or copy `docker-compose.ec2-user-service.yml` to the server and run:

```bash
sudo docker compose up -d shop-service   # creates network sugamflow_default (if project dir is sugamflow)
export USER_SERVICE_IMAGE=sugamflow/user-service:1.0.0   # or your Docker Hub image
sudo docker compose -f docker-compose.ec2-user-service.yml --env-file .env up -d
```

If your Compose project uses a different network name, set `SUGAMFLOW_DOCKER_NETWORK` to the value from `docker network ls`.

### ECS Fargate (Console sketch)

1. **ECS** → **Clusters** → **Create cluster**.
2. **Task definitions**: one per service (CPU/memory, container port, env from Secrets Manager, image from ECR).
3. **Services**: desired count ≥ 1; attach to private subnets; use **Service Connect** or **Cloud Map** for `discovery-service` hostname if you standardize on that instead of raw IPs.
4. **ALB**: listener 443 → target group → gateway service.

---

## Operational commands (local parity)

Local Docker orchestration for development is described in the repository `docker-compose.yml` (external PostgreSQL via `host.docker.internal` in the current layout). AWS production will replace that with VPC networking, ALB, and managed data stores — same **logical** ports inside the cluster, different **public** entry at `api.sugamflow.com:443`.

## Smoke test after deploy

1. Open `https://sugamflow.com` — landing loads.
2. Open `https://app.sugamflow.com` — shop UI loads.
3. From the browser devtools **Network** tab, confirm API calls go to `https://api.sugamflow.com` and return **200** (and CORS preflight **204/200** where applicable).
4. Log in and exercise one read + one write API through the gateway.

## Document history

- Initial version: domain-based routing for `sugamflow.com`, `app.sugamflow.com`, `api.sugamflow.com` with AWS building blocks and alignment to this repo’s frontend env files.
- Added: Docker Compose build/tag/push workflow for all backend microservices to Amazon ECR, plus AWS Console-oriented runbook notes (VPC, RDS, secrets, ALB, ECS/EC2 patterns).
- Added: `docker-compose.ec2-user-service.yml` overlay for hosts whose main compose only defines `shop-service`, plus EC2 notes in this doc.
- Added: §1b production image build for EC2 (compose build, optional `docker save` / `docker load`, registry push).
