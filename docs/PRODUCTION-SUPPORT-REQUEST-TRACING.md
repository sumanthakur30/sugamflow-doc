# SugamFlow — Production Support: Cross-Service Request Tracing

**Audience:** production support, on-call, SRE, backend engineers  
**Goal:** trace one user action across gateway + microservices on production (EC2 + RDS), then harden the pipeline so support can resolve incidents without guessing.

Related:

- [production-deploy-checklist.md](./production-deploy-checklist.md)
- [ec2-production-stability-report.md](./ec2-production-stability-report.md)
- [platform/api-canonical-routes.md](./platform/api-canonical-routes.md) (`X-Request-Id` header)
- Local observability stack (optional): `docker-compose.yml` profile `observability` + `infra/observability/`

---

## 1. Executive summary

| Topic | Today (production) | Target for production support |
|-------|--------------------|-------------------------------|
| Trace model | Custom **`X-Request-Id`** (correlation UUID) | Same id as **support ticket key**, plus optional OpenTelemetry later |
| Log shape | `INFO [order-service,<uuid>] …` via MDC `requestId` | Id always present on gateway + every service + every hop |
| Storage | Docker **json-file** logs on EC2 | Central search (Loki/CloudWatch Logs) indexed by `requestId` |
| UI | Browser sends/shows id; toast may show `(ref: …)` | Id always visible on errors; CORS exposes response header |
| Tracing product | No Zipkin / Jaeger / OTel | Phase-2 optional Micrometer Tracing + Tempo/Jaeger |

**Principle:** Do not wait for full OpenTelemetry to support customers. Make **`X-Request-Id` reliable end-to-end first**, then add spans if needed.

---

## 2. How the flow works today

```
Browser (Angular)
  │  X-Request-Id: <uuid>     (RequestIdInterceptor)
  ▼
gateway-service
  │  accepts or creates X-Request-Id
  │  forwards to target service
  ▼
microservice RequestIdFilter
  │  MDC.put("requestId", id)
  │  response header X-Request-Id
  ▼
optional WebClient hop (product ↔ stock ↔ order, etc.)
  │  should forward same X-Request-Id
  ▼
logs: INFO [service-name,<uuid>] message…
```

### Key code locations

| Layer | Path |
|-------|------|
| UI outbound | `shop-management-ui/src/app/interceptors/request-id.interceptor.ts` |
| UI error toast | `shop-management-ui/src/app/interceptors/api-error.interceptor.ts` |
| Gateway | `gateway-service/.../filter/RequestIdGatewayFilter.java` |
| Services | `*/src/main/java/**/filter/RequestIdFilter.java` (16 services) |
| Log pattern | `logging.pattern.level=%5p [${spring.application.name:},%X{requestId:-}]` |

### Services with `RequestIdFilter`

`auth-service`, `account-service`, `user-service`, `shop-service`, `product-service`, `stock-service`, `order-service`, `payment-service`, `notification-service`, `reporting-service`, `gst-service`, `fieldforce-service`, `doctor-service`, `appointment-service`, `queue-management-service`, `ledger-service`

---

## 3. Production support runbook (use now)

### 3.1 Capture the request id from the customer / browser

1. Open DevTools → **Network**.
2. Reproduce the failure (or ask the customer for a screenshot of Network headers).
3. Select the failing `https://sugamflow.com/api/v1/...` call.
4. Copy **Request Headers → `X-Request-Id`**.

Fallback:

- Toast text may include `(ref: <uuid>)`.
- Console: `sessionStorage.getItem('sugamflow.lastRequestId')`  
  (may be stale if the failing response did not expose `X-Request-Id`).

Share this UUID in the incident ticket as **`requestId=`**.

### 3.2 Search EC2 logs by request id

Deploy dir is usually one of:

- `/opt/sugamflow`
- `/home/ec2-user/opt/sugamflow`

```bash
cd /opt/sugamflow   # or /home/ec2-user/opt/sugamflow

RID='paste-uuid-here'
COMPOSE='docker compose -f docker-compose.ec2-rds.yml --env-file .env.production'

# Health first
$COMPOSE ps

# Sweep common services (extend list as needed)
for s in gateway-service auth-service order-service shop-service product-service \
  stock-service user-service payment-service notification-service gst-service \
  doctor-service appointment-service queue-management-service account-service \
  reporting-service fieldforce-service; do
  echo "===== $s ====="
  $COMPOSE logs --since 2h "$s" 2>&1 | grep -F "$RID" || true
done
```

**What good output looks like**

```text
===== gateway-service =====
... (may be sparse — see gaps)
===== order-service =====
2026-07-15T10:04:03.862+05:30 ERROR [order-service,aaaaaaaa-bbbb-...] ...
===== product-service =====
2026-07-15T10:04:03.910+05:30 INFO  [product-service,aaaaaaaa-bbbb-...] ...
```

Order of timestamps shows hop sequence.

### 3.3 Classify the failure quickly

| Pattern in logs | Likely cause |
|-----------------|--------------|
| Only gateway / connection refused | Downstream service down or crash-loop (check `ps` + Flyway) |
| Same `RID` ERROR in one service | Bug or data issue in that service |
| Multiple services with same `RID`, last shows SQL/Flyway | DB / migration / ownership (recent prod example: orderdb Flyway) |
| No hits for `RID` | Wrong time window, service not logging pattern, or id not propagated |

### 3.4 Minimal incident template

```text
Environment: production (sugamflow.com)
Shop / tenant: …
User: …
UTC/IST time: …
API: METHOD /api/v1/...
HTTP status: …
requestId (X-Request-Id): …
Browser: …
Services with log hits: …
Root ERROR line(s): …
```

---

## 4. Known gaps (must fix for reliable production support)

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| G1 | Gateway sets header but often **does not put `requestId` in MDC** | Hard to grep gateway hop | P0 |
| G2 | CORS does not **expose** `X-Request-Id` to browser JS | Toast/`sessionStorage` miss on errors | P0 |
| G3 | Early 401/403 responses may omit `X-Request-Id` | Support has no id for auth failures | P0 |
| G4 | Not all WebClient/Feign clients forward `X-Request-Id` | Internal hop loses correlation | P0 |
| G5 | `appointment-service` / `queue-management-service` lack log pattern with `%X{requestId}` | MDC set but invisible in console logs | P1 |
| G6 | Prod has **no log aggregation** (only Docker json-file, short retention) | Support must SSH + grep | P1 |
| G7 | No distributed span UI | Slow latency RCA across hops | P2 |
| G8 | Async / messaging paths may not carry id | Background jobs unlinked | P2 |

---

## 5. Implementation plan (phased)

### Phase 0 — Baseline (documentation + support process) ✅ this doc

- [x] Document current `X-Request-Id` contract and EC2 grep runbook
- [ ] Add link from on-call / deploy checklist to this doc
- [ ] Train support: always collect `X-Request-Id` before restarting pods

### Phase 1 — Make correlation production-grade (P0 / P1) — **implement first**

Acceptance: for any authenticated API call, one UUID is visible in the UI error path **and** searchable in every service that handled the call.

#### 1.1 Gateway MDC / structured log

- Put `requestId` into reactive logging context (or log explicitly in filter with `requestId=`).
- Ensure rate-limit / auth-failure paths log the same id.
- Always set response header `X-Request-Id` (including 401/403).

#### 1.2 CORS expose header

In gateway CORS (and UI if needed):

```yaml
# conceptual — apply in gateway CORS config
exposed-headers: X-Request-Id
```

Also allow header remains: `X-Request-Id`.

#### 1.3 UI error UX

- On HTTP error, prefer response `X-Request-Id`, else request header value, else sessionStorage.
- Always show `(ref: <uuid>)` in toast for 4xx/5xx.
- Optional: copy-to-clipboard on error banner.

#### 1.4 Shared outbound client filter

Standardize one approach (prefer **security-common** or **platform-common** helper):

- All WebClient builders add exchange filter that copies inbound MDC/`X-Request-Id` to outbound requests.
- Audit clients that omit it (example gap called out previously: some ledger/integration clients).
- Inventory: order ↔ product ↔ stock ↔ gst ↔ shop ↔ auth ↔ notification.

#### 1.5 Uniform log pattern

Every service `application.properties` / `application-prod.yml`:

```properties
logging.pattern.level=%5p [${spring.application.name:},%X{requestId:-}]
```

Confirm **appointment-service**, **queue-management-service**, **ledger-service** (when deployed).

#### 1.6 Log retention / aggregation (minimum for support)

Pick one for EC2 (recommend Loki path already in repo for local):

| Option | Effort | Notes |
|--------|--------|-------|
| A. Promtail + Loki + Grafana on EC2 | Medium | Reuse `infra/observability/`; profile already exists locally |
| B. CloudWatch Logs agent | Medium | Align with existing CloudWatch alarms |
| C. Keep Docker logs + increase retention | Low | Short-term: raise `max-size` / `max-file` in compose |

Minimum acceptance for Phase 1 ops:

- Search by `requestId` without SSH (Grafana/CloudWatch) **or** documented one-liner retained as interim.
- Retention ≥ **7 days** for app containers used in incidents.

**Deliverables Phase 1**

- [ ] PRs: gateway MDC + CORS expose + 401 header
- [ ] PR: UI always surfaces ref id
- [ ] PR: shared WebClient request-id filter + adopt in all outbound clients
- [ ] PR: missing service log patterns
- [ ] Deploy observability or CloudWatch Logs for prod
- [ ] Update this doc “Runbook” with Grafana/CloudWatch query examples

### Phase 2 — Optional distributed tracing (P2)

Only after Phase 1 is stable.

1. Add Micrometer Tracing + OpenTelemetry (or Brave) to Boot 3 services.
2. Propagate W3C `traceparent` **in addition to** `X-Request-Id` (keep UUID for human support).
3. Export to Jaeger/Tempo (local first via Compose, then EC2 or managed).
4. Grafana: jump from Loki log line → trace.

Keep `X-Request-Id` as the **customer-facing support key** even if span ids exist.

### Phase 3 — Support polish

- Admin “debug panel” (SHOP_OWNER / SUPER_ADMIN): last N request ids for session.
- Persist `requestId` on selected audit tables (auth login already has `correlation_id` pattern — extend carefully).
- Alerting: spike of 5xx grouped by route (Prometheus already present in some stacks).

---

## 6. Implementation checklist (engineering)

### Must-have code changes

- [ ] Gateway: MDC / structured log includes `requestId` on every request
- [ ] Gateway: `X-Request-Id` on unauthorized and error responses
- [ ] Gateway CORS: `exposedHeaders` includes `X-Request-Id`
- [ ] UI: error interceptor always resolves and displays `ref`
- [ ] Commons: reusable WebClient filter for `X-Request-Id`
- [ ] All domain services: apply shared filter on every outbound client
- [ ] All services: `logging.pattern.level` with `%X{requestId:-}`
- [ ] Unit/integration test: header in → MDC set → outbound header same → response header same

### Production deploy / ops

- [ ] Compose logging driver retention adequate (or Loki/CloudWatch live)
- [ ] Support cheat-sheet one-pager linked from this doc
- [ ] Post-deploy verification:
  1. Login in browser, force a 500 or call known endpoint
  2. Copy `X-Request-Id`
  3. Confirm hits in gateway + target service logs within 1 minute

### Verification script (suggested)

```bash
# On EC2 after deploy — replace RID after a browser call
RID='...'
docker compose -f docker-compose.ec2-rds.yml --env-file .env.production \
  logs --since 15m gateway-service order-service 2>&1 | grep -F "$RID"
```

Expect ≥ 1 matching line per hop that should have executed.

---

## 7. Support decision tree

```text
Customer reports UI error
        │
        ▼
Have X-Request-Id?
   │ no → Ask for Network screenshot / time / shopId; check service health
   │ yes
        ▼
SSH EC2, grep RID across services
        │
        ├─ no hits → expand --since; check gateway only; check CORS/UI id
        ├─ crash-loop / Connection refused → treat as infra (compose ps, Flyway)
        └─ ERROR line in service → file bug with RID + stack + shop/tenant
```

---

## 8. Do / Don’t for on-call

**Do**

- Always collect `requestId` before restarting services (restarts destroy log context).
- Prefer `logs --since` + `grep -F` over live `logs -f` noise.
- Note IST vs UTC timestamps in tickets (`Asia/Kolkata` is set via `JAVA_TOOL_OPTIONS` on many services).

**Don’t**

- Don’t treat missing demo data as “missing RDS” when status is **500** (check service up / Flyway first).
- Don’t merge unrelated stale branches into prod while debugging (keep `dev` / `feature/lab` release discipline).
- Don’t expect Zipkin URLs yet — they do not exist in prod.

---

## 9. Ownership

| Area | Owner |
|------|--------|
| Gateway / CORS / filter | platform / gateway owner |
| Shared WebClient filter | platform-common / security-common owner |
| UI error interceptor | frontend owner |
| Prod log stack | DevOps / on-call |
| Runbook updates | whoever ships Phase 1 changes |

---

## 10. Revision

| Date | Change |
|------|--------|
| 2026-07-15 | Initial production-support tracing doc + Phase 1/2 plan |

When Phase 1 ships, replace Section 3.2 grep-only steps with the centralized query examples and mark gaps G1–G6 as closed.
