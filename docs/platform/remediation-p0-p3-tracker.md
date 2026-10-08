# P0–P3 Remediation Tracker

Status after audit remediation sprint (June 2026).

## P0 — Blockers ✅

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Redact public/pre-login `ShopDto` | **Done** | `ShopDtoRedaction`, public lookup + pre-login `/api/shops/{id}` |
| 2 | Cap `GET /stock`, `GET /products` | **Done** | Default cap 500 + `X-Deprecated-Endpoint` header |
| 3 | Batch product lookup in billing | **Done** | `POST /products/lookup/batch`; `OrderService` single batch per save |
| 4 | DB indexes | **Done** | V16 product barcode; V33 order commerce; V23 stock inventory |
| 5 | Block direct microservice access (prod) | **Done** | `GatewayAccessFilter` + `X-Gateway-Verified` from gateway |

**Deploy:** Restart gateway + shop/product/stock/order services (Flyway on product/stock/order DBs).

## P1 — SaaS hardening ✅

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6 | Cross-tenant tests for offline sync | **Done** | `CrossTenantIsolationMvcTest.offlineSyncAdjust_idempotencyIsolatedPerShop` |
| 7 | `@RequiresModule` on high-value endpoints | **Done** | Shared `ModuleFeatureGateAspect` in security-common |
| 8 | Nav from `effective-config` | **Done** | `AppNavigationService.showHeaderTab()` uses `hasModule()` |
| 9 | k6 perf gates in CI | **Done** | `.github/workflows/k6-perf-smoke.yml` |
| 10 | Magic-byte upload validation | **Done** | Procurement attachments |
| 11 | Procurement attachment entity ownership | **Done** | `ProcurementAttachmentEntityValidator` |

## P2 — Quality & UX ✅ (MVP)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 12 | Split `InventoryModule` lazy routes | **Done** | `AutoPartsModule` + `ProcurementModule` lazy chunks |
| 13 | Decompose god components | **Done** | `DoctorQueueBoardComponent`; `OrderFormCounterComponent` (~360 lines extracted) |
| 14 | Playwright responsive suite | **Done** | Billing + stocks/PO/procurement + healthcare (doctor/reception/pharmacy) |
| 15 | Standardize list/grid | **Done** | `ListPageHeaderComponent` + `app-data-grid` on stock, user, product, and order lists |
| 16 | OnPush + trackBy | **Done** | `order-form` OnPush + trackBy; lists already OnPush |
| — | Auto-parts route guards | **Done** | `PermissionGuard` on `/auto-parts/**` |

## P3 — Scale & vertical depth ✅ (MVP)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 17 | Streaming export/import 25k+ SKUs | **Done** | Paginated export (`export-page-size` 1000, max 50k); `GET /products/export/csv/stream`; async jobs stream to disk |
| 18 | Stock transfer offline queue | **Done** | `POST /stock/sync/transfer`; IndexedDB `STOCK_TRANSFER` op + orchestrator |
| 19 | Pharmacy counter perf benchmark | **Done** | `load-tests/k6/pharmacy-counter-smoke.js` in CI smoke |
| 20 | Tenant-admin feature marketplace | **Done** | `GET/POST /api/v1/shops/{id}/feature-marketplace`; account drawer trials for shop owners |
| 21 | Hospital IPD or registration UX | **Done** | Reception `IPD_ADMISSION` visit type + ward/bed fields → encounter notes |

**Deploy P3:** Rebuild product/stock/shop services + UI. Config: `product.import.export-max-rows`, `export-page-size`.
