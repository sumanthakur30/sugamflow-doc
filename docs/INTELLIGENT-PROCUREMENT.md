# Intelligent Low-Stock Procurement (SugamFlow)

Enterprise-style **detect → queue → evening compile → approve → PO** flow for medical/pharmacy shops, built on existing **suppliers** and **purchase orders** in `stock-service`.

## What is implemented (MVP)

| Capability | Status |
|------------|--------|
| Low stock detection (min threshold, available qty) | ✅ Scan job + manual trigger |
| Procurement queue with priority | ✅ `low_stock_queue` |
| Supplier mapping (primary/secondary, lead time, MOQ) | ✅ `supplier_product_mapping` + API + product edit UI |
| Real ADS from order history | ✅ `order-service` analytics + `stock_prediction` refresh on scan |
| Reorder formula: `(ADS × lead) + safety − available − open PO` | ✅ `ReorderQuantityCalculator` |
| Evening auto-compile (supplier-wise draft POs) | ✅ Scheduler + manual compile |
| Approval workflow for auto drafts | ✅ Approve / reject API |
| Dashboard UI | ✅ `/stocks/procurement` |
| Settings (enable, compile time, safety/lead defaults) | ✅ |

## Architecture

- **Service:** `stock-service` (same DB as inventory & purchases)
- **API base:** `/api/v1/purchases/procurement/*` (via gateway)
- **Scheduler:** `@Scheduled` in `ProcurementScheduler` (Asia/Kolkata)
- **Flyway:** `V7__intelligent_procurement.sql`

## Daily workflow (shop owner)

1. **Suppliers** — create suppliers under **Stocks → Suppliers**.
2. **Product mapping** — on **Products → Edit** (procurement section) or POST `/api/v1/purchases/procurement/supplier-mappings` with `productId`, `supplierId`, `priorityRank` (1 = primary).
3. **Per-product min stock** — set `low_stock_threshold` on product (product-service) or use shop default in procurement settings.
4. **Enable automation** — **Stocks → Procurement (auto PO)** → turn on **Enable intelligent procurement**, set evening compile time (default 8 PM).
5. **During the day** — system scans low stock every 30 min (configurable); queue fills automatically.
6. **Evening** — compile creates **AUTO-** draft POs grouped by supplier.
7. **Review** — approve draft → open PO → edit qty if needed → **Confirm** → send/receive as today.

## Key API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/purchases/procurement/dashboard` | Summary widgets |
| GET | `/purchases/procurement/queue` | Open queue |
| POST | `/purchases/procurement/scan` | Run detection now |
| POST | `/purchases/procurement/compile` | Build draft POs now |
| POST | `/purchases/procurement/drafts/{id}/approve` | Approve auto draft |
| PUT | `/purchases/procurement/settings` | Enable/configure |
| GET/DELETE | `/purchases/procurement/supplier-mappings` | List / remove mappings |
| GET | `/purchases/procurement/products/{id}/velocity` | ADS + units sold (optional `refresh=true`) |
| GET | `/orders/analytics/product-velocity` | Order-service source for ADS (internal) |

## Phase 2 (planned / not in this MVP)

- Near-expiry / dead stock in reorder logic
- Multi-branch transfer before purchase
- WhatsApp / email evening summary
- PDF/Excel PO export
- AI demand forecasting UI beyond rolling 7-day ADS

## Configuration (`application.properties`)

```properties
procurement.scheduler.enabled=true
procurement.scan.fixed-delay-ms=1800000
procurement.compile.cron=0 */5 18-21 * * *
```

Deploy: run Flyway V7 on stock DB, redeploy `stock-service` + UI.
