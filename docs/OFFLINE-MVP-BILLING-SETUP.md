# Offline Billing MVP — Setup & Usage

**Scope:** Retail, pharmacy, and automobile counter (`/orders/add`, `/auto-parts/counter`)  
**Status:** Phase 0–2 foundation implemented (June 2026)

---

## What works now

| Capability | Status |
|------------|--------|
| IndexedDB catalog cache (products + stock) | Yes |
| Connectivity indicator (header) | Yes — Online / Syncing / Offline |
| Offline bill queue (`OFF-INV-YYYY-###`) | Yes |
| Offline stock adjust queue (`OFF-ADJ-YYYY-###`) | Yes |
| Offline PO draft queue (`OFF-PO-YYYY-###`) | Yes |
| Auto sync on reconnect | Yes |
| Manual sync + queue UI (`/sync-queue`) | Yes |
| Backend idempotent ingest `POST /api/v1/orders/sync` | Yes |
| Backend idempotent stock adjust `POST /api/v1/stock/sync/adjust` | Yes |
| Backend idempotent PO create `POST /api/v1/stock/sync/purchase-orders` | Yes |
| Edit order offline | No (create only) |
| PWA service worker (production build) | Yes |
| Customer cache (IndexedDB) | Yes |
| Offline customer quick-create (walk-in) | Yes — local id, syncs before bill |
| API E2E offline sync script | Yes (`npm run e2e:offline-billing`) |

---

## Prerequisites

1. Rebuild **order-service** (migration `V24__order_sync_idempotency.sql` + `/orders/sync` endpoint).
2. Rebuild **stock-service** (`OfflineSyncController` + procurement idempotency for PO/stock).
3. Rebuild **shop-management-ui** (Dexie offline layer).
3. Log in and open a shop **while online** at least once so master data caches.

---

## Operator flow

### While online (prepare)

1. Open billing (`/orders/add` or `/auto-parts/counter`).
2. Wait for products/stock to load (triggers cache write).
3. Optional: **Sync queue → Refresh catalog** to force a full pull (products, stock, **customers**).

### When offline

1. Header shows **Offline** (red).
2. Yellow banner on billing screen: offline mode active.
3. Build bill as usual; search customers from cached list (synced while online).
4. **Place bill** → saves locally as e.g. `OFF-INV-2026-001`.
5. Open **Sync queue** (`/sync-queue`) to see pending rows.

### When back online

1. Header turns **Syncing** (orange) while queue drains.
2. Click **Sync now** if needed.
3. Server assigns permanent `ORD-######`; queue row → **SUCCESS**.

---

## Configuration

| Setting | Default | How to change |
|---------|---------|---------------|
| Offline mode enabled | `true` | `localStorage.setItem('sugamflow.offlineModeEnabled', '0')` to disable |
| Device id | auto UUID | `localStorage` key `sugamflow.deviceId` |

---

## API contract

```
POST /api/v1/orders/sync
Headers:
  X-Idempotency-Key: <clientTxnId uuid>
  X-Offline-Invoice-No: OFF-INV-2026-001
  X-Tenant-Id, X-Shop-Id, Authorization (as usual)
Body: standard Order JSON (same as POST /orders)
Response: Order DTO with server id + ORD-###### number
```

Duplicate `X-Idempotency-Key` returns the original order (no double billing).

---

## Testing offline locally

### API E2E (no browser)

```powershell
cd shop-management-ui
npm run e2e:offline-billing
# or with explicit demo shop:
powershell -File tools/e2e-offline-billing.ps1 -ShopId "GEN-DEMO-01" -Username demo -Password "Demo@2026" -TenantId 101
```

### Browser UI

1. Start stack + UI (`ng serve`).
2. Log in to a demo shop (e.g. `PHARM-DEMO-01`).
3. Open billing and confirm catalog + customers load.
4. Chrome DevTools → **Network** → **Offline**.
5. Place a test bill → verify `OFF-INV-*` in sync queue.
6. Go **Online** → verify sync → `ORD-######` on queue row.

### PWA app shell

Production build registers the service worker (static assets only; API data stays in IndexedDB):

```powershell
ng build --configuration=production
# serve dist/shop-management via your web server; SW active on repeat visits
```

---

## Known gaps (next slices)

- Encrypted local storage (Web Crypto)
- GST preview offline (uses last cached rules / local fallback)
- Dashboard KPI offline snapshot
- Conflict UI when server stock < offline sale (errors shown on sync queue row)

---

## Key files

| Area | Path |
|------|------|
| IndexedDB schema | `shop-management-ui/src/app/offline/offline-db.ts` |
| Sync orchestrator | `shop-management-ui/src/app/offline/sync-orchestrator.service.ts` |
| Offline customers | `shop-management-ui/src/app/offline/offline-customer.service.ts` |
| Billing integration | `shop-management-ui/src/app/components/order-form/` |
| Sync endpoint | `order-service/.../OrderController.java` (`/sync`) |
| Idempotency table | `order-service/.../V24__order_sync_idempotency.sql` |
