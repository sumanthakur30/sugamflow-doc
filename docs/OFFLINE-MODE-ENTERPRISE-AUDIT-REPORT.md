# SugamFlow Enterprise Offline Mode — Design & Validation Report

**Date:** 5 June 2026  
**Scope:** Retail, Pharmacy, Medical Store, Automobile Parts, Distribution, CRM (Field Force), Polyclinic  
**Method:** Codebase audit + industry offline-first patterns (POS / ERP / Pharmacy / CRM)

---

## Executive Summary

SugamFlow is a **100% online-first** Angular SPA backed by 19 Spring Boot microservices through a gateway. There is **no offline data layer**, **no sync engine**, and **no PWA shell**. Users cannot complete billing, inventory, procurement, CRM, or clinical workflows during a network outage.

The platform has **foundational building blocks** that accelerate an offline program:

| Building block | Location | Reuse for offline |
|----------------|----------|-------------------|
| JWT session in `localStorage` | `auth-session.service.ts` | Offline login grace (with encryption) |
| Tenant/shop headers | `tenant.interceptor.ts` | Sync payload scoping |
| Procurement idempotency | `ProcurementIdempotencyService` | Pattern for order/CRM/clinical sync |
| `window:online` refresh | `product-list.component.ts` | Hook for sync-on-reconnect |
| Network error UX | `api-error.interceptor.ts` (status `0`) | Extend to offline banner |
| Multi-business-type routing | `business-types.ts`, capabilities | Per-vertical offline profiles |

**Verdict:** SugamFlow **cannot** operate as an enterprise offline-first system today. A phased 9–12 month program is required. MVP offline billing + master data for retail/pharmacy/auto can ship in **Phase 2 (~4 months)** after foundation work.

---

## Scorecard

| Dimension | Score | Rationale |
|-----------|------:|-----------|
| **Offline Readiness** | **8 / 100** | No IndexedDB, SW, sync queue, or offline routes |
| **Sync Reliability** | **5 / 100** | GRN idempotency only; no order/CRM sync, no conflict model |
| **Security** | **35 / 100** | JWT plaintext in `localStorage`; tenant headers good; no local encryption |
| **User Experience** | **15 / 100** | Generic “Cannot reach server” message; no status bar or queue UI |
| **Production Readiness** | **5 / 100** | Complete outage = no billing, no stock, no clinical, no CRM |

---

## 1. Offline Architecture Review

### 1.1 Current state (verified in codebase)

| Capability | Status | Evidence |
|------------|--------|----------|
| Frontend without backend | **No** | Every screen calls HTTP APIs via `HttpClient` |
| Local storage | **Partial** | `localStorage` / `sessionStorage` for auth, tenant, UI prefs only |
| IndexedDB | **No** | No `indexedDB`, Dexie, or localforage references |
| Service Worker | **No** | No `ngsw`, Workbox, or `service-worker` |
| PWA | **No** | `package.json` has no `@angular/pwa`; `angular.json` has no `serviceWorker` |
| Sync framework | **No** | No outbound/inbound sync, queue, or conflict resolver |
| Backend offline APIs | **No** | No delta-sync, batch-ingest, or client-origin endpoints |

**Architecture today:**

```
Browser (Angular 16 SPA)
    → HttpClient + interceptors (auth, tenant, request-id, errors)
    → Gateway :9090
    → 19 microservices (auth, order, product, stock, shop, …)
    → PostgreSQL per service
```

**Only “offline-adjacent” behavior:**

- `product-list` listens to `window:online` and refetches (`onWindowOnline`).
- `api-error.interceptor` shows *“Cannot reach the server”* on HTTP status `0`.
- Procurement GRN uses `X-Idempotency-Key` (frontend `sessionStorage` + backend `procurement_idempotency` table).

### 1.2 Recommended target architecture

Industry-standard stack aligned with modern POS/ERP offline models:

```
┌─────────────────────────────────────────────────────────────────┐
│  Angular PWA (App Shell + lazy routes)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Connectivity │  │ Offline UX   │  │ Feature modules      │ │
│  │ Service      │  │ Banner/Queue │  │ (billing, stock, …)  │ │
│  └──────┬───────┘  └──────────────┘  └──────────┬───────────┘ │
│         │                                         │             │
│  ┌──────▼─────────────────────────────────────────▼───────────┐ │
│  │ Repository Layer (reads/writes local first)                │ │
│  └──────┬─────────────────────────────────────────┬───────────┘ │
│         │                                         │             │
│  ┌──────▼───────┐                    ┌───────────▼──────────┐  │
│  │ IndexedDB    │◄── encrypt ───────►│ Web Crypto (AES-GCM) │  │
│  │ (Dexie.js)   │    PHI / tokens    │ per-tenant key       │  │
│  └──────┬───────┘                    └──────────────────────┘  │
│         │                                                      │
│  ┌──────▼───────┐   ┌────────────────┐   ┌─────────────────┐ │
│  │ Outbound     │   │ Inbound        │   │ Master-data     │ │
│  │ Sync Queue   │   │ Delta Cache    │   │ Search Index    │ │
│  │ PENDING→DONE │   │ (server cursor)│   │ (Web Worker)    │ │
│  └──────┬───────┘   └───────┬────────┘   └─────────────────┘ │
│         │                   │                                  │
│  ┌──────▼───────────────────▼────────────────────────────────┐ │
│  │ Sync Orchestrator (online event, manual, cron, backoff)   │ │
│  └──────┬────────────────────────────────────────────────────┘ │
└─────────┼──────────────────────────────────────────────────────┘
          │ HTTPS + X-Idempotency-Key + X-Client-Seq + If-Match
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Gateway + new sync-ingest endpoints (or dedicated sync-service)│
│  → order-service, stock-service, product-service, …           │
│  → server-side idempotency store + version vectors             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 IndexedDB schema (high level)

| Store | Purpose | TTL / refresh |
|-------|---------|---------------|
| `meta` | `lastSyncAt`, `deviceId`, `schemaVersion`, `offlineLoginAt` | — |
| `session` | Encrypted offline auth snapshot | Configurable grace |
| `products` | SKU, barcode, price, tax, batches | Delta every 15–60 min online |
| `customers`, `suppliers`, `doctors`, `patients` | Lookup masters | Delta |
| `stock_snapshot` | Available qty per product/batch/warehouse | Refresh on sync + local delta |
| `tax_rules`, `units`, `categories`, `warehouses` | Reference data | Rarely changes |
| `outbound_queue` | Pending mutations | Until SUCCESS |
| `inbound_cursors` | Per-entity `updatedSince` tokens | — |
| `dashboard_cache` | KPI JSON blobs | Stale-while-offline |
| `conflicts` | User-resolvable merge rows | Until resolved |

---

## 2. Offline Login Support

### 2.1 Current behavior

- Login requires live `POST /api/v1/auth/login`.
- JWT stored in **plaintext** `localStorage` (`auth-access-token`, `auth-session`).
- Session validity: JWT `exp` only (`hasValidSession()`); default **8 hours** (`security.jwt.expiration=PT8H`).
- `ensureCurrentSessionAllowed()` calls shop status API online — blocked offline.
- 401 from any API triggers logout (`api-error.interceptor.ts`).

### 2.2 Option A — Last successful authentication (offline resume)

**Feasibility:** High for **UI access**; **not sufficient alone** for API-backed offline ops.

**Store (encrypted):**

```typescript
interface OfflineAuthSnapshot {
  userId: number;
  tenantId: number;
  shopId: string;
  roles: string[];
  permissions: string[];
  businessType: string;
  loginTimestamp: string;      // ISO
  offlineGraceExpiresAt: string;
  deviceId: string;
}
```

**Security implications:**

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stolen device → full app access | High | Device PIN/biometric gate; encrypt with key derived from user PIN + device secret |
| Revoked user still offline | High | Cap grace at 24–72h; block WRITE sync if server revoked (on reconnect) |
| Shared terminal abuse | Medium | Auto-lock; per-shift offline operator PIN |
| PHI on disk (polyclinic) | Critical | AES-256-GCM; separate key per tenant; wipe on logout |

### 2.3 Option B — Periodic online re-verification

**Feasibility:** High; **recommended as policy layer** on top of Option A.

| Setting | Typical use |
|---------|-------------|
| 7 days | High-security pharmacy / polyclinic |
| 15 days | Retail / auto parts |
| 30 days | Field sales CRM |

After expiry: read-only offline OR hard block until online login.

### 2.4 Recommendation: **Hybrid A + B**

1. **Option A** enables offline session resume immediately after last online login.
2. **Option B** enforces `offlineGraceExpiresAt` from tenant config (`shop_offline_policy` table).
3. Separate **read grace** vs **write grace** (e.g. read 30d, write 7d).
4. Offline writes always queue locally; server is authoritative on sync.
5. Do **not** extend JWT offline — use opaque offline capability token bound to device + grace window.

---

## 3. Offline Dashboard

### 3.1 Current state

`owner-dashboard.component.ts` fetches live APIs (`OwnerDashboardResponse`, polyclinic dashboard, AI insights). **No cache.** Offline → blank/error.

### 3.2 Target behavior

| Element | Offline source |
|---------|----------------|
| KPI cards | Last successful `dashboard_cache` snapshot |
| Reports | Pre-synced report payloads or computed locally from cached orders |
| Recent transactions | `orders` store (local + synced) |
| Banner | `Offline Data — Last Synced At: DD/MM/YYYY HH:mm` |

**Implementation:**

- On successful online fetch → persist snapshot to IndexedDB with `syncedAt`.
- Offline route guard allows dashboard if snapshot exists.
- Show staleness badge; disable drill-downs that need live aggregates.

---

## 4. Offline Master Data

### 4.1 Current state

- Products: server-paginated (`getProductsPage`); search hits API.
- Customers, suppliers: HTTP lookup per screen.
- No local full-catalog cache.

### 4.2 Target cache entities

| Entity | Services | Offline search |
|--------|----------|----------------|
| Products | product-service | Barcode, SKU, name index |
| Customers | customer-service | Phone, name |
| Suppliers | stock-service | Name, GSTIN |
| Categories, units, tax | product/gst | Filter chips |
| Warehouses | stock-service | Dropdown |
| Doctors, patients | order/sales-admin | UHID, phone (polyclinic) |

### 4.3 Local search performance design

| Catalog size | Strategy | Target search |
|--------------|----------|---------------|
| ≤ 10k | In-memory + Dexie index | < 50 ms |
| 10k–50k | Web Worker + prefix trie | < 100 ms |
| 50k–100k | Sharded indexes + virtual scroll | < 150 ms |
| 100k+ | Server-assisted sync (category chunks) + on-demand page cache | < 200 ms |

**Sync:** `GET /api/v1/sync/products?since={cursor}&limit=500` (new endpoint); checkpoint cursor in `inbound_cursors`.

---

## 5. Offline Billing Support (Critical)

### 5.1 Current state

- `order-form.component.ts` → `orderService.createOrder()` → HTTP POST.
- Stock validation, GST (`gst.service`), FEFO batch pick — all online.
- Invoice number: server assigns `ORD-%06d` **after** DB insert (`OrderService.java`).
- **No** order-service idempotency.

### 5.2 Target offline billing flow

```
1. User builds cart (local products + stock_snapshot)
2. Tax computed locally (cached tax rules + GST calculator port)
3. Save to IndexedDB:
   - clientTxnId: uuid
   - tempInvoiceNo: OFF-INV-2026-001 (per-device sequence)
   - status: PENDING_SYNC
4. Decrement stock_snapshot (optimistic local)
5. Print PDF from local template (jspdf already in project)
6. On sync:
   - POST /api/v1/orders/sync with X-Idempotency-Key: clientTxnId
   - Server returns permanent orderNumber / invoiceNumber
   - UI replaces OFF-INV-* on receipt reprint option
```

### 5.3 Business-type coverage

| Type | Offline billing MVP | Notes |
|------|---------------------|-------|
| Retail | Yes | Straightforward |
| Pharmacy | Yes (Phase 2) | FEFO batch pick from `stock_snapshot`; schedule H validation offline = warn only |
| Automobile parts | Yes (Phase 2) | Reuse `auto-parts/counter` UX; cache fitment index subset |
| Medical store | Yes | Same as pharmacy |
| Distribution | Phase 3 | Multi-warehouse, credit limits |
| Polyclinic billing | Phase 4 | Tied to visit/patient sync |

### 5.4 Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Oversell vs real stock | P0 | Server reconciliation; conflict screen; optional hard stock lock online |
| Duplicate invoice on retry | P0 | Idempotency key = `clientTxnId` |
| GST number gap in sequence | P1 | Server renumbers; audit trail links OFF-INV → ORD |
| Credit customer over-limit | P1 | Offline credit cap config |

---

## 6. Offline Inventory Management

### 6.1 Current state

- Stock reads via `stock-service` HTTP.
- Adjustments/reconciliation exist server-side (`StockReconciliationService`, `InventoryPostingEngine`) — **no offline path**.
- No generic “stock transfer” UI surfaced for all verticals.

### 6.2 Target

| Operation | Offline | Sync payload |
|-----------|---------|--------------|
| Stock issue (sale) | Via billing local delta | Included in order sync |
| Stock adjustment | Queue `STOCK_ADJUST` | Idempotent movement id |
| Stock transfer | Queue `STOCK_TRANSFER` | Source/dest warehouse + qty |

**Local `stock_movements` log** mirrors server posting engine event types for replay.

**Conflict:** If server stock < offline issue, flag **SYNC_CONFLICT** → user chooses adjust / reject / partial fulfill.

---

## 7. Offline Purchase Order

### 6.1 Current state

- Full PO lifecycle online (`purchase-order.service.ts`, `stock-service`).
- GRN receive has idempotency — good pattern.

### 7.2 Target

| Action | Offline |
|--------|---------|
| Draft PO | Yes — local `DRAFT` |
| Create PO | Queue `PO_SUBMIT` |
| Edit PO | Local until synced |
| Receive GRN | Phase 3 (mobile PWA); queue with existing idempotency |

**Status:** `Pending Sync` badge on PO list. Auto-submit on reconnect via orchestrator.

---

## 8. Offline CRM (Field Force)

### 8.1 Current state

- `field-force-workspace` — leads, activities, conversion — all HTTP.
- Duplicate checks require online API.

### 8.2 Target

| Action | Offline |
|--------|---------|
| Lead creation | Queue with `clientLeadId` |
| Follow-up / notes / tasks | Append-only local log |
| Duplicate detection | Fuzzy match on cached leads (phone); server reconciles on sync |

**Field sales priority:** High ROI — intermittent connectivity is common.

---

## 9. Offline Polyclinic

### 9.1 Current state

- Patient registration, appointments, consultations, prescriptions — `order.service.ts` / `salesAdmin` HTTP chains.
- PHI transits network only; **nothing encrypted locally**.

### 9.2 Target (Phase 4 — regulated)

| Workflow | Offline | Encryption |
|----------|---------|------------|
| Patient registration | Queue | AES-GCM + tenant key |
| Appointment booking | Local calendar slot | Slot conflict on sync |
| Consultation notes | Draft locally | PHI store encrypted |
| Prescription draft | Local Rx lines | Link to patient UHID temp id |

**Compliance:** Treat as **medical device adjacent** for Indian DISHA / IT Act — document DPIA, cache TTL max 72h for PHI, mandatory wipe on logout.

---

## 10. Sync Engine Design

### 10.1 Outbound (Local → Server)

```
SyncOrchestrator.tick():
  for item in queue.where(status=PENDING).orderBy(createdAt):
    mark PROCESSING
    try:
      response = api.ingest(item)  // idempotent
      mark SUCCESS; store serverIds mapping
    catch Retryable:
      increment retryCount; backoff; mark PENDING
    catch Fatal:
      mark FAILED; surface in UI
```

**Ordering:** Per-module FIFO; **billing before stock adjust** where linked.

### 10.2 Inbound (Server → Local)

```
for entity in [products, customers, stock, ...]:
  cursor = inbound_cursors[entity]
  batch = api.delta(entity, since=cursor)
  upsert IndexedDB
  cursor = batch.nextCursor
```

### 10.3 Triggers

| Trigger | Implementation |
|---------|----------------|
| Internet restored | `window:online` + `navigator.connection` + heartbeat ping |
| Manual sync | Header button → `SyncOrchestrator.runFull()` |
| Scheduled | `setInterval` when online (e.g. every 15 min) |

### 10.4 New backend surfaces (recommended)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/sync/orders` | Batch order ingest |
| `POST /api/v1/sync/stock-movements` | Adjustments/transfers |
| `GET /api/v1/sync/{entity}/delta` | Inbound master data |
| `GET /api/v1/sync/status` | Server cursor + policy |
| `POST /api/v1/sync/ack` | Client confirms applied cursor |

Extend `ProcurementIdempotencyService` → platform `SyncIdempotencyService`.

---

## 11. Conflict Resolution Strategy

### 11.1 Test scenarios

| Scenario | User A (online) | User B (offline) | Recommended resolution |
|----------|-----------------|------------------|------------------------|
| Product price | ₹100 → ₹120 | Sells at ₹100 | **Server price wins** for new lines; completed offline sale kept at ₹100 with audit flag |
| Product price edit | ₹100 → ₹120 | Edits name locally | **Version merge** — non-overlapping fields merge |
| Stock qty | 50 → 30 (sale) | Sells 25 offline | **Server reconcile** — if 5 short, conflict UI |
| Customer phone | Updated | Old phone on invoice | **LWW on master**; invoice keeps snapshot |
| PO status | Cancelled | Receives GRN offline | **Reject sync** — user must undo |

### 11.2 Recommendation: **Tiered hybrid**

| Data class | Strategy |
|------------|----------|
| Financial transactions (orders, payments) | **Append-only** + idempotency; no overwrite |
| Master data (product, customer) | **Version-based merge** (`updatedAt` + `version` column) |
| Stock balances | **Server authoritative reconcile** with user conflict screen for shortages |
| Config (tax, permissions) | **Server always wins** |

**Avoid pure Last-Write-Wins** for money and stock. **User conflict screen** required for stock shortfall and duplicate patients (phone match).

---

## 12. Sync Queue Monitoring

### 12.1 Queue record schema

```typescript
interface SyncQueueItem {
  id: string;              // uuid
  clientTxnId: string;     // idempotency
  module: 'BILLING' | 'STOCK' | 'PO' | 'CRM' | 'POLYCLINIC' | 'MASTER';
  operation: string;       // CREATE_ORDER, ADJUST_STOCK, ...
  payload: unknown;        // encrypted at rest
  createdAt: string;
  syncStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  retryCount: number;
  lastError?: string;
  serverRef?: string;      // order id, etc.
}
```

### 12.2 UI: `/settings/sync-queue`

Filters by status/module; actions: Retry, Export payload, Cancel (if draft).

---

## 13. Sync Failure Handling

### 13.1 Simulated scenarios

| Failure | Expected behavior |
|---------|-------------------|
| API 503 | Exponential backoff (1s, 2s, 4s… max 5 min); stay PENDING |
| Validation 400 | FAILED; show field errors; allow edit + retry |
| Duplicate idempotency | SUCCESS (return existing server id) |
| Network loss mid-sync | PROCESSING → timeout → PENDING; **no data loss** |
| Partial batch success | Per-item status; continue queue |

**Rule:** Queue items only move to SUCCESS after server ACK. Local state uses `clientTxnId` until `serverRef` mapped.

---

## 14. Offline User Experience

### 14.1 Current state

- No connectivity indicator in header/shell.
- `api-error.interceptor` alert on every failed request offline (noisy).

### 14.2 Target UX

| State | Color | Header chip |
|-------|-------|-------------|
| Online | Green | `Online` |
| Syncing | Orange | `Syncing (n pending)` |
| Offline | Red | `Offline — 12 pending` |

**Always visible:** Pending count, last sync time, tap → queue drawer.

**Mobile/tablet:** Sticky top banner; min 44px touch targets; test at 320 / 375 / 390 / 768 / 820 / 1024 px.

**Interceptor change:** Suppress global alerts for offline-queued operations; route errors to queue item.

---

## 15. Data Security

### 15.1 Current risks

| Issue | Severity |
|-------|----------|
| JWT in plaintext `localStorage` | P1 |
| Session snapshot JSON readable | P1 |
| No tenant crypto isolation locally | P1 |
| PHI would be plaintext if cached naively | P0 (polyclinic) |
| No cache expiry | P2 |

### 15.2 Requirements matrix

| Requirement | Implementation |
|-------------|----------------|
| Encrypt sensitive data | AES-256-GCM via Web Crypto; key from PIN + `deviceId` salt |
| Tenant isolation | IndexedDB namespaced `sf_{tenantId}_{shopId}` |
| User isolation | Separate encryption subkey per `userId` |
| Cache expiry | TTL per store; PHI max 72h |
| Secure token storage | Move JWT to httpOnly cookie online; offline use encrypted capability blob |

### 15.3 Compliance notes

- **PCI:** No card data in local queue; UPI/card = record payment *mode* only offline.
- **India DISHA / IT Act:** Consent for local PHI; breach notification process if device lost.
- **GST:** Offline invoices must sync before statutory filing period; audit OFF-INV → ORD mapping.

---

## 16. Performance Testing Plan

### 16.1 Projected benchmarks (post-implementation targets)

| Catalog | Search (p95) | Filter (p95) | Full delta sync | RAM (browser) |
|---------|-------------|--------------|-----------------|---------------|
| 5k | 30 ms | 40 ms | 8 s | 80 MB |
| 10k | 45 ms | 55 ms | 15 s | 120 MB |
| 50k | 90 ms | 110 ms | 90 s | 250 MB |
| 100k | 150 ms | 180 ms | 180 s | 400 MB |

### 16.2 Optimizations

1. **Web Worker** search index (don't block UI thread).
2. **Compound Dexie indexes:** `[tenantId+barcode]`, `[tenantId+sku]`, `[tenantId+nameLower]`.
3. **Delta sync** only — never full catalog pull after initial.
4. **Compression** (gzip) on sync API payloads.
5. **Virtual scroll** in product pickers (already partially used).
6. **Chunked inbound** — 500 rows per request.
7. **Service Worker** cache app shell only — not full data.

---

## 17. Mobile & Tablet Offline Testing

### 17.1 Current state

- Responsive Bootstrap layout exists.
- **No** offline banner; billing counter (`order-form-counter.scss`) has mobile layouts but fails without API.

### 17.2 Test matrix (post-implementation)

| Viewport | Checks |
|----------|--------|
| 320px | Banner not overlapping header; queue drawer full-width |
| 375px / 390px | Counter mode usable; barcode input visible offline |
| 768px / 820px | Split-pane billing + cart |
| 1024px | Sidebar + sync status visible |

**Tooling:** Playwright offline mode (`context.setOffline(true)`), Chrome DevTools throttling.

---

## 18. Production Readiness by Vertical

| Vertical | Can operate full outage today? | MVP offline (Phase 2) | Full offline (Phase 4) |
|----------|-------------------------------|----------------------|------------------------|
| Retail shops | **No** | Billing + masters | + PO + reports |
| Medical stores | **No** | Billing + FEFO | + procurement |
| Pharmacies | **No** | Billing + batch | + schedule reminders |
| Automobile parts | **No** | Counter billing + search | + workshop issue |
| Distributors | **No** | Read-only catalog | + multi-warehouse |
| Polyclinics | **No** | — | Patient + Rx + appointments |
| Field sales CRM | **No** | Leads + visits | + conversion sync |

---

## Issue Register

| ID | Module | Risk | Severity | Business Impact | Recommended Fix |
|----|--------|------|----------|-----------------|-----------------|
| OFF-001 | Platform | No local data layer | **P0** | All ops stop when network drops | IndexedDB + repository layer |
| OFF-002 | Billing | Orders require live API | **P0** | Revenue loss at POS | Offline order queue + temp invoice |
| OFF-003 | Stock | No local stock snapshot | **P0** | Oversell / blind billing | Cache stock + reconcile on sync |
| OFF-004 | Auth | 8h JWT; online shop check | **P0** | Forced logout offline | Offline grace policy + encrypted snapshot |
| OFF-005 | Security | Plaintext JWT in localStorage | **P1** | Token theft | Encrypt + httpOnly online session |
| OFF-006 | Sync | No idempotency on orders | **P1** | Duplicate bills on retry | `SyncIdempotencyService` |
| OFF-007 | Master data | API-only product search | **P1** | Billing slow / impossible offline | Delta sync + worker index |
| OFF-008 | Dashboard | No KPI cache | **P1** | Owners blind offline | Snapshot on fetch |
| OFF-009 | PO | No offline draft queue | **P2** | Procurement delay | PO outbound queue |
| OFF-010 | CRM | Field force 100% online | **P2** | Lost leads in field | Lead queue + fuzzy dedup |
| OFF-011 | Polyclinic | PHI not encrypted locally | **P0** (if shipped naive) | Regulatory breach | Encrypted PHI + short TTL |
| OFF-012 | UX | No connectivity indicator | **P2** | User confusion | Global status bar |
| OFF-013 | PWA | No service worker | **P2** | App won't load if browser cache cold | `@angular/pwa` app shell |
| OFF-014 | Conflict | No version columns | **P1** | Data corruption on sync | `@Version` + merge rules |
| OFF-015 | Performance | No worker search | **P3** | UI jank at 50k+ SKU | Web Worker index |

---

## Implementation Roadmap

### Phase 0 — Foundation (6–8 weeks)

- [ ] Add `@angular/pwa` + app shell service worker (static assets only).
- [ ] Introduce `Dexie` + `OfflineDatabase` with tenant/user namespaces.
- [ ] `ConnectivityService` + header status chip (green/orange/red).
- [ ] `SyncQueueService` + queue UI skeleton.
- [ ] Web Crypto encryption wrapper for sensitive stores.
- [ ] Feature flag: `offlineModeEnabled` per shop (default off).

**Exit:** App loads offline shell; queue visible; no business writes yet.

### Phase 1 — Master data + dashboard cache (6–8 weeks)

- [ ] Backend delta sync APIs (products, customers, stock snapshot, tax).
- [ ] Inbound sync orchestrator + `lastSyncAt` dashboard.
- [ ] Web Worker product search; virtual scroll pickers.
- [ ] Offline dashboard snapshots.
- [ ] Extend `product-list` online handler → full sync trigger.

**Exit:** Browse catalog, search, view stale KPIs offline.

### Phase 2 — Offline billing MVP (8–10 weeks)

- [ ] Local order builder + GST port from cached rules.
- [ ] `OFF-INV-*` sequencing per device.
- [ ] `POST /api/v1/sync/orders` + idempotency.
- [ ] Stock snapshot decrement + reconcile.
- [ ] Offline PDF print (jspdf).
- [ ] Retail + pharmacy + auto counter paths.

**Exit:** Shops can sell during outage; sync on reconnect.

### Phase 3 — Inventory + procurement queue (6–8 weeks)

- [x] Stock adjust/transfer queue.
- [x] PO draft/create offline queue.
- [x] Reuse procurement idempotency pattern platform-wide.
- [x] Conflict resolution UI (stock shortfall).

**Exit:** Back-office can continue PO and adjustments offline.

### Phase 4 — CRM + polyclinic + hardening (10–12 weeks)

- [ ] Field force lead/activity queue.
- [ ] Polyclinic patient/Rx/appointment (encrypted).
- [ ] Hybrid offline login policy (7/15/30 day config).
- [ ] Playwright offline E2E suite.
- [ ] Performance tests at 100k SKUs.
- [ ] Security audit + DPIA for PHI.

**Exit:** Enterprise offline-first certification per vertical.

### Phase 5 — Operations excellence (ongoing)

- [ ] Scheduled background sync.
- [ ] Mobile GRN offline (per `UNIVERSAL-PROCUREMENT-DESIGN.md` Phase 5).
- [ ] Grafana dashboards for sync failure rates.
- [ ] Multi-device conflict analytics.

---

## Effort Summary

| Phase | Calendar (2 FTE) | Cumulative capability |
|-------|------------------|------------------------|
| 0 | 1.5 mo | PWA shell, queue, UX |
| 1 | 1.5 mo | Master data offline |
| 2 | 2 mo | **Billing MVP** |
| 3 | 1.5 mo | Stock + PO |
| 4 | 2.5 mo | CRM + polyclinic |
| **Total** | **~9 months** | Production-grade offline |

---

## Immediate Next Steps (Week 1)

1. **Architecture decision record** — approve IndexedDB + Dexie + sync-service scope.
2. **Spike:** Dexie proof-of-concept with 10k products + worker search in `shop-management-ui`.
3. **Backend RFC:** `SyncIdempotencyService` schema shared across order/stock.
4. **Security:** Encrypted offline auth snapshot design review.
5. **Pilot vertical:** AUTO_PARTS or PHARMACY demo shop for Phase 2 MVP.

---

## Appendix A — Key file references (current codebase)

| Area | Path |
|------|------|
| Auth / session | `shop-management-ui/src/app/services/auth-session.service.ts` |
| Network errors | `shop-management-ui/src/app/interceptors/api-error.interceptor.ts` |
| Tenant scoping | `shop-management-ui/src/app/interceptors/tenant.interceptor.ts` |
| Billing | `shop-management-ui/src/app/components/order-form/order-form.component.ts` |
| Dashboard | `shop-management-ui/src/app/components/owner-dashboard/owner-dashboard.component.ts` |
| GRN idempotency (pattern) | `stock-service/.../ProcurementIdempotencyService.java` |
| Order numbering | `order-service/.../OrderService.java` |
| JWT expiry | `auth-service/src/main/resources/application.properties` (`PT8H`) |
| Procurement offline mention | `docs/UNIVERSAL-PROCUREMENT-DESIGN.md` §10.2 Phase 5 |

---

## Appendix B — Document history

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-06-05 | Architecture audit | Initial enterprise offline assessment |
