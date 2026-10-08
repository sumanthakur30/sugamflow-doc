# Universal Procurement & Inventory Receipt Design

**Status:** Architecture proposal (June 2026). **Implemented:** Phase 0–1 (config, PO workflow, fulfillment), Phase 2 (GRN splits, buckets, posting engine), Phase 3 (inspection hold/release, attachments, reason catalog), Phase 4 (supplier claims, resolutions, purchase returns, auto-claim from GRN/inspection), Phase 5 (stock reconciliation, supplier AP 3-way match, procurement accounting outbox / GRNI hooks).  
**Scope:** Purchase Order, GRN, Quality Inspection, Evidence, Supplier Claims, Returns, Reconciliation, Supplier Scorecards  
**Principle:** Industry-agnostic core workflow; business rules via **configuration**, not code forks.

---

## 1. Executive summary

SugamFlow today has a **solid MVP** in `stock-service`: suppliers → PO (`DRAFT` → `CONFIRMED` → receive) → GRN (immediate `POSTED`) → `PURCHASE_IN` ledger + batch cost. Intelligent auto-replenishment adds draft approval for `AUTO_REPLENISH` POs only.

This design extends that foundation into a **configurable universal procurement platform** comparable to mid-market ERP (Odoo Inventory / Zoho Inventory depth) while remaining extractable per bounded context. Estimated full program: **~28–40 engineer-weeks** across 6 phases (detail in §12).

---

## 2. Current implementation (as-built)

### 2.1 Service map

| Component | Location | Role |
|-----------|----------|------|
| Procurement domain | `stock-service` | PO, GRN, suppliers, intelligent procurement |
| Gateway | `gateway-service` | `/api/v1/purchases/**` → stock-service |
| UI | `shop-management-ui` | `/stocks/purchase-orders`, receive wizard |
| Catalog | `product-service` | Products, `low_stock_threshold` |
| Sales returns | `order-service` | Customer returns only |
| Accounting | `procurement_accounting_events` outbox in `stock-service` | GRNI/AP events on GRN, returns, claims, reconciliation, AP approve (ledger consumer TBD) |

### 2.2 PO lifecycle (today)

```
DRAFT → CONFIRMED → PARTIALLY_RECEIVED → CLOSED
         (auto only) CANCELLED via reject
```

**Quantities:** `qty_ordered`, `qty_received` only. No accepted/rejected/pending/returned split.

**Missing vs target:** `SUBMITTED`, `APPROVED`, `SENT_TO_SUPPLIER`, `FULLY_RECEIVED` (alias), general `CANCELLED`, fulfillment %.

### 2.3 GRN (today)

- Always tied to PO (`purchase_order_id` NOT NULL).
- Single step: `POST /orders/{id}/receive` → status `POSTED` + stock in same transaction.
- Line fields: `qty_received`, `batch_number`, `expiry_date`, `purchase_price`.
- **All received qty posts to available stock** — no damage/reject/quarantine buckets.

### 2.4 Not implemented

Supplier claims, purchase returns, inventory reconciliation, QC inspection, evidence attachments, multi-level PO approval (manual POs), direct/transfer/consignment receipt, serial tracking, AP/three-way match, supplier scorecards, notification channels beyond existing alert infra.

### 2.5 Configuration today

- `procurement_settings.enabled` per tenant/shop/branch.
- `business-type-capabilities.ts` — **does not gate procurement** (healthcare vs retail only).
- Batch/expiry enforced in `receivePurchaseInbound` (pharmacy-oriented).

---

## 3. ERP benchmark comparison

| Capability | SAP B1 | NetSuite | D365 SCM | Odoo 17 | Zoho Inv | Marg ERP | Tally Prime | **SugamFlow today** | **Target** |
|------------|--------|----------|----------|---------|----------|----------|-------------|---------------------|------------|
| PO lifecycle | Full | Full | Full | Full | Good | Good | Basic (order) | Partial | Full + config gates |
| Partial receipt | Yes | Yes | Yes | Yes | Yes | Yes | Limited | Yes | Yes |
| GRN w/o PO | Yes | Yes | Yes | Yes | Yes | Yes | Manual stock | No | Config flag |
| QC at receipt | Add-on | Yes | Yes | Quality app | Limited | Basic | No | No | Config workflows |
| Stock buckets | Yes | Yes | Yes | Locations | Warehouses | Godown | Stock groups | Aggregate only | Bucket engine |
| Batch/serial | Yes | Yes | Yes | Yes | Batch | Batch | Batch | Batch only | Profile-driven |
| Supplier claim | Yes | RMA | Yes | RMA | Limited | Debit note | Debit note | No | Yes |
| 3-way match | Yes | Yes | Yes | Optional | Partial | Invoice match | Voucher link | Invoice fields only | Phase 5 |
| AP / GRNI | Yes | Yes | Yes | Accounting | Books sync | Yes | Voucher | No | Event to account-service |
| Approval matrix | Yes | Yes | Yes | Studio rules | Basic | Role | No | Auto-PO only | Config matrix |
| Multi-warehouse | Yes | Yes | Yes | Yes | Yes | Yes | Multi godown | Default MAIN | Explicit receive WH |
| Mobile GRN | Apps | Yes | WMS app | Barcode | App | Desktop | No | Responsive web | PWA + scan APIs |
| Supplier scorecard | Yes | Yes | Yes | Limited | Reports | Reports | No | No | Phase 6 |
| Audit immutability | Yes | Yes | Yes | Chatter | Audit | Audit | Audit trail | Partial txn log | Full event store |

**Positioning:** Target state ≈ **Odoo Inventory + Purchase + Quality + RMA** depth, with India GST via existing `gst-service`, without SAP-grade manufacturing MRP in v1.

---

## 4. Gap analysis (prioritized)

### P0 — Core workflow parity

1. PO status model incomplete; no fulfillment %.
2. GRN quantity dimensions: delivered/accepted/damaged/rejected/missing only `qty_received`.
3. No inventory bucket posting (inspection, quarantine, damaged).
4. No GRN types: direct purchase, transfer, consignment.
5. No draft GRN / inspection-before-post pattern.

### P1 — Disputes & returns

6. Supplier claim / dispute module absent.
7. Purchase return to supplier absent (sales return exists elsewhere).
8. No resolution workflows (replacement, credit note, refund).

### P2 — Compliance & audit

9. Evidence attachments not linked to GRN/claims.
10. Immutable audit trail incomplete (no field-level history on PO/GRN).
11. Configurable inspection reasons missing.

### P3 — Enterprise features

12. Multi-level approval (amount/role) only for auto-replenishment.
13. Inventory reconciliation / cycle count missing.
14. Supplier performance KPIs missing.
15. Accounting integration (GRNI, AP, credit notes) missing.

### P4 — Scale & UX

16. Serial/warranty tracking missing.
17. Mobile-optimized scan flows partial.
18. Notifications (WhatsApp/SMS) not wired for procurement events.
19. Business-type procurement profiles not in capabilities registry.

---

## 5. Target architecture

### 5.1 Bounded contexts (recommended evolution)

```
┌─────────────────────────────────────────────────────────────────┐
│                     shop-management-ui (PWA)                     │
│  PO │ GRN │ Inspection │ Claims │ Returns │ Reconciliation      │
└────────────────────────────┬────────────────────────────────────┘
                             │ /api/v1/purchases, /inventory, /claims
┌────────────────────────────▼────────────────────────────────────┐
│                      gateway-service                             │
└─┬──────────────┬────────────────────┬───────────────────────────┘
  │              │                    │
  ▼              ▼                    ▼
stock-service   document-service*   notification-service*
(procurement)   (attachments)       (alerts: email/WA/SMS)
  │
  ├── inventory-engine (internal module)
  ├── posting-rules (config-driven)
  └── emits: InventoryPosted, ClaimOpened, GrnCompleted
        │
        ▼
account-service (listeners: GRNI, AP invoice, credit note)
product-service (catalog, tracking profile)
order-service (transfer orders — future)
```

\* *Phase 4+ extract if attachment/notification volume warrants separate deployables. Until then, modules inside `stock-service` with clear packages.*

**Keep procurement in `stock-service` through Phase 4** (single DB transaction for GRN + buckets + claims + returns). Extract `procurement-service` only when team size or release cadence demands it.

### 5.2 Configuration model (no code forks)

New tables (tenant/shop scoped):

**`procurement_module_config`**

| Key | Example values |
|-----|----------------|
| `po.approval.enabled` | true/false |
| `po.approval.matrix_id` | FK |
| `grn.allow_without_po` | false (retail true for counter buy) |
| `grn.require_inspection` | NONE / BASIC / FULL |
| `grn.posting_mode` | IMMEDIATE / AFTER_INSPECTION |
| `inventory.tracking_profile` | PHARMACY / RETAIL_SKU / SERIAL / LOT / NONE |
| `claims.auto_generate` | true |
| `returns.purchase_enabled` | true |

**`procurement_profile`** — maps `business_type` (+ optional shop override) to default config bundle:

| Profile | Batch | Serial | Inspection | Consignment GRN |
|---------|-------|--------|------------|-----------------|
| PHARMACY_CHAIN | Required | No | BATCH_VERIFY | No |
| RETAIL_STORE | Optional | No | BASIC | No |
| ELECTRONICS | Optional | Required | TECHNICAL | No |
| FMCG_DISTRIBUTOR | Required | No | BASIC | Yes |
| HOSPITAL_PROCUREMENT | Required | No | COMPLIANCE | No |
| WAREHOUSE_DC | Lot | No | BASIC | Yes |

Loaded at shop bootstrap (`scripts/sql-shop-bootstrap`) and editable in admin UI.

**`inspection_reason_catalog`** — system + tenant custom reasons (Damage, Wrong Variant, …).

**`approval_matrix` + `approval_matrix_rule`** — role, min/max amount, document type, sequence.

---

## 6. Database schema (scalable)

### 6.1 Purchase Order extensions

```sql
-- Extend purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS
  workflow_status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
  -- DRAFT, SUBMITTED, APPROVED, SENT_TO_SUPPLIER, PARTIALLY_RECEIVED,
  -- FULLY_RECEIVED, CLOSED, CANCELLED
  sent_to_supplier_at TIMESTAMPTZ,
  sent_to_supplier_by VARCHAR(100),
  fulfillment_pct NUMERIC(5,2) GENERATED ALWAYS AS (...) STORED, -- or maintained
  currency_code VARCHAR(3) DEFAULT 'INR',
  warehouse_id BIGINT, -- default receive warehouse
  receipt_type VARCHAR(30) DEFAULT 'STANDARD'; -- STANDARD, BLANKET, CONSIGNMENT

-- Extend purchase_order_lines
ALTER TABLE purchase_order_lines ADD COLUMN IF NOT EXISTS
  qty_accepted INT NOT NULL DEFAULT 0,
  qty_rejected INT NOT NULL DEFAULT 0,
  qty_returned INT NOT NULL DEFAULT 0,
  qty_pending INT NOT NULL DEFAULT 0, -- computed: ordered - received
  uom VARCHAR(20) DEFAULT 'EA',
  variant_id BIGINT,
  tax_rate NUMERIC(5,2);
```

Maintain aggregates via triggers or service layer on each GRN/inspection event.

### 6.2 Goods Receipt (universal)

```sql
CREATE TABLE goods_receipts_v2 ( -- migrate from goods_receipts
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  shop_id VARCHAR(100) NOT NULL,
  branch_id BIGINT NOT NULL,
  grn_number VARCHAR(50) NOT NULL,
  receipt_source VARCHAR(30) NOT NULL, -- PO, DIRECT, TRANSFER, CONSIGNMENT
  purchase_order_id BIGINT, -- nullable when DIRECT
  transfer_order_id BIGINT,
  supplier_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  status VARCHAR(30) NOT NULL, -- DRAFT, RECEIVED, INSPECTION, POSTED, CANCELLED
  inspection_status VARCHAR(30), -- NOT_REQUIRED, PENDING, APPROVED, PARTIAL, REJECTED, HOLD
  received_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  supplier_invoice_no VARCHAR(100),
  supplier_invoice_date DATE,
  idempotency_key VARCHAR(64),
  ...
);

CREATE TABLE goods_receipt_lines (
  ...
  qty_ordered INT,
  qty_delivered INT NOT NULL,
  qty_accepted INT NOT NULL DEFAULT 0,
  qty_damaged INT NOT NULL DEFAULT 0,
  qty_defective INT NOT NULL DEFAULT 0,
  qty_missing INT NOT NULL DEFAULT 0,
  qty_rejected INT NOT NULL DEFAULT 0,
  qty_return_initiated INT NOT NULL DEFAULT 0,
  batch_number VARCHAR(100),
  expiry_date DATE,
  serial_numbers JSONB, -- array when profile requires
  unit_cost NUMERIC(18,4),
  inspection_line_id BIGINT
);
```

### 6.3 Quality inspection

```sql
CREATE TABLE quality_inspections (
  id BIGSERIAL PRIMARY KEY,
  goods_receipt_id BIGINT NOT NULL,
  workflow_type VARCHAR(40) NOT NULL, -- NONE, BASIC, QUALITY, TECHNICAL, BATCH, COMPLIANCE
  status VARCHAR(30) NOT NULL,
  inspected_by VARCHAR(100),
  inspected_at TIMESTAMPTZ,
  ...
);

CREATE TABLE quality_inspection_lines (
  inspection_id BIGINT,
  grn_line_id BIGINT,
  qty_inspected INT,
  qty_approved INT,
  qty_rejected INT,
  result VARCHAR(30), -- APPROVED, PARTIAL, REJECTED, HOLD
  reason_code VARCHAR(50),
  reason_notes TEXT
);
```

### 6.4 Evidence

```sql
CREATE TABLE procurement_attachments (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  shop_id VARCHAR(100) NOT NULL,
  entity_type VARCHAR(40) NOT NULL, -- GRN, PO, CLAIM, RETURN, INSPECTION
  entity_id BIGINT NOT NULL,
  attachment_type VARCHAR(40) NOT NULL, -- PRODUCT_PHOTO, DAMAGE_PHOTO, CHALLAN, INVOICE, ...
  storage_uri VARCHAR(512) NOT NULL,
  captured_at TIMESTAMPTZ,
  captured_by VARCHAR(100),
  geo_lat NUMERIC, geo_lng NUMERIC,
  supplier_id BIGINT,
  grn_id BIGINT,
  deleted_at TIMESTAMPTZ -- soft delete only
);
```

### 6.5 Supplier claims

```sql
CREATE TABLE supplier_claims (
  id BIGSERIAL PRIMARY KEY,
  claim_number VARCHAR(50) NOT NULL,
  supplier_id BIGINT NOT NULL,
  goods_receipt_id BIGINT,
  grn_line_id BIGINT,
  claim_type VARCHAR(40) NOT NULL, -- SHORT_SUPPLY, DAMAGE, DEFECT, WRONG_PRODUCT, ...
  status VARCHAR(30) NOT NULL,
  qty_claimed NUMERIC(18,4),
  amount_claimed NUMERIC(18,4),
  auto_generated BOOLEAN DEFAULT false,
  ...
);

CREATE TABLE supplier_claim_communications (
  claim_id BIGINT,
  channel VARCHAR(20), -- IN_APP, EMAIL, WHATSAPP
  message TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ
);

CREATE TABLE claim_resolutions (
  claim_id BIGINT,
  resolution_type VARCHAR(30), -- REPLACEMENT, CREDIT_NOTE, REFUND, DISCOUNT, WARRANTY
  status VARCHAR(30),
  linked_grn_id BIGINT, -- replacement receipt
  linked_credit_note_id BIGINT,
  ...
);
```

### 6.6 Purchase returns

```sql
CREATE TABLE purchase_returns (
  id BIGSERIAL PRIMARY KEY,
  return_number VARCHAR(50) NOT NULL,
  supplier_id BIGINT NOT NULL,
  source_type VARCHAR(30), -- GRN, CLAIM, MANUAL
  source_id BIGINT,
  status VARCHAR(30),
  ...
);

CREATE TABLE purchase_return_lines (
  return_id BIGINT,
  product_id BIGINT,
  batch_id BIGINT,
  qty_returned INT,
  bucket_from VARCHAR(30), -- DAMAGED, RETURN_STOCK, AVAILABLE
  ...
);
```

### 6.7 Inventory buckets & posting

```sql
CREATE TABLE inventory_bucket_balances (
  tenant_id BIGINT, shop_id VARCHAR, branch_id BIGINT,
  warehouse_id BIGINT, product_id BIGINT, batch_id BIGINT,
  bucket_type VARCHAR(30) NOT NULL,
  -- AVAILABLE, INSPECTION, QUARANTINE, RETURN, DAMAGED, RESERVED
  quantity NUMERIC(18,4) NOT NULL,
  PRIMARY KEY (..., bucket_type)
);

CREATE TABLE inventory_posting_rules (
  tenant_id BIGINT, shop_id VARCHAR,
  event_type VARCHAR(40), -- GRN_LINE_POSTED, INSPECTION_APPROVED, ...
  condition_json JSONB,
  debit_bucket VARCHAR(30),
  credit_bucket VARCHAR(30),
  priority INT
);
```

### 6.8 Reconciliation

```sql
CREATE TABLE stock_reconciliation_sessions (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT,
  status VARCHAR(30), -- DRAFT, COUNTING, REVIEW, POSTED
  ...
);

CREATE TABLE stock_reconciliation_lines (
  session_id BIGINT,
  product_id BIGINT,
  system_qty NUMERIC,
  counted_qty NUMERIC,
  variance NUMERIC,
  reason_code VARCHAR(50)
);
```

### 6.9 Audit (immutable)

```sql
CREATE TABLE procurement_audit_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  shop_id VARCHAR(100) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT NOT NULL,
  action VARCHAR(40) NOT NULL,
  actor_id VARCHAR(100),
  occurred_at TIMESTAMPTZ NOT NULL,
  before_json JSONB,
  after_json JSONB,
  correlation_id VARCHAR(64)
);
```

No hard deletes on procurement documents — `status = CANCELLED` + reversal postings.

### 6.10 Supplier scorecard (materialized / nightly)

```sql
CREATE TABLE supplier_kpi_snapshot (
  supplier_id BIGINT,
  period_month DATE,
  total_orders INT,
  fulfillment_rate_pct NUMERIC,
  on_time_delivery_pct NUMERIC,
  damage_rate_pct NUMERIC,
  claim_count INT,
  avg_resolution_days NUMERIC,
  purchase_value NUMERIC,
  rating NUMERIC
);
```

---

## 7. Inventory transaction engine

### 7.1 Design principles

1. **Single entry point:** `InventoryPostingEngine.post(PostingCommand)`.
2. **Idempotent** via `idempotency_key` on GRN post.
3. **Configurable rules** resolve bucket movements from `inventory_posting_rules` + `procurement_module_config`.
4. **Always** write `inventory_transactions` + `procurement_audit_events`.

### 7.2 GRN line posting algorithm

```
delivered = line.qty_delivered
accepted  = line.qty_accepted   (after inspection, or = delivered if no inspection)
damaged   = line.qty_damaged
rejected  = line.qty_rejected
missing   = line.qty_missing

inventory_increase = accepted  -- ONLY this hits AVAILABLE (per requirement)

Movements:
  AVAILABLE      += accepted
  DAMAGED        += damaged + defective
  QUARANTINE     += rejected (pending claim)
  INSPECTION     += (delivered - accepted - damaged - rejected - missing) while inspection pending
  CLAIM_PENDING  += missing + rejected (when auto-claim on)

On inspection approve:
  INSPECTION -= qty; AVAILABLE += approved portion
```

### 7.3 Reversal

`POST /grns/{id}/reverse` creates offsetting postings (manager permission), sets GRN `CANCELLED`, rolls back PO quantities.

### 7.4 Integration with existing `StockService`

Refactor `receivePurchaseInbound` → delegate to engine. Deprecate direct aggregate `stock.quantity` mutation without bucket awareness (migrate aggregate as **view/sum of AVAILABLE bucket**).

---

## 8. API design

Base: `/api/v1/purchases` (existing) + extensions.

### 8.1 Purchase orders

| Method | Path | Notes |
|--------|------|-------|
| POST | `/orders` | Create DRAFT |
| PUT | `/orders/{id}` | Edit draft |
| POST | `/orders/{id}/submit` | → SUBMITTED |
| POST | `/orders/{id}/approve` | Uses matrix |
| POST | `/orders/{id}/send` | → SENT_TO_SUPPLIER |
| POST | `/orders/{id}/cancel` | With reason |
| GET | `/orders/{id}/fulfillment` | %, qty breakdown |

### 8.2 Goods receipts

| Method | Path | Notes |
|--------|------|-------|
| POST | `/grns` | Create DRAFT (PO/direct/transfer) |
| PUT | `/grns/{id}/lines` | Capture delivered qty |
| POST | `/grns/{id}/submit-inspection` | If configured |
| POST | `/grns/{id}/post` | Engine posting |
| POST | `/grns/{id}/reverse` | Manager |
| GET | `/grns/{id}/attachments` | Evidence |

### 8.3 Inspection, claims, returns

| Method | Path |
|--------|------|
| POST | `/inspections` |
| PUT | `/inspections/{id}/lines/{lineId}` |
| POST | `/inspections/{id}/complete` |
| POST | `/claims` (manual) — auto from GRN event |
| PUT | `/claims/{id}/status` |
| POST | `/claims/{id}/communications` |
| POST | `/claims/{id}/resolutions` |
| POST | `/purchase-returns` |
| POST | `/reconciliation/sessions` |

### 8.4 Config & analytics

| Method | Path |
|--------|------|
| GET/PUT | `/config/module` |
| GET | `/config/inspection-reasons` |
| GET | `/suppliers/{id}/scorecard` |
| GET | `/analytics/procurement-dashboard` |

### 8.5 Events (internal, Phase 4+)

- `Procurement.GrnPosted`
- `Procurement.ClaimSubmitted`
- `Procurement.ReturnShipped`

Consumed by `account-service`, `notification-service`.

---

## 9. Accounting integration

### 9.1 Posting map (India-ready)

| Event | Debit | Credit |
|-------|-------|--------|
| GRN posted (accepted qty) | Inventory / Stock-in-Trade | GRNI or Creditors (if invoice) |
| GRN damaged (not claimed yet) | Damaged-in-transit suspense | GRNI |
| Claim credit approved | Creditors | Purchase returns & allowances |
| Replacement GRN | Inventory | Damaged suspense |
| Purchase return shipped | Creditors | Inventory |

### 9.2 Implementation

- `stock-service` publishes `AccountingEvent` JSON to queue or REST to `account-service`.
- `account-service` maps `tenant_id` → chart of accounts template (retail vs hospital vs manufacturing).
- Idempotent `external_reference = GRN-{id}-LINE-{lineId}`.
- GST input credit via `gst-service` when supplier invoice registered (Phase 5).

Tally/Marg parity: export **voucher XML/JSON** optional connector (Phase 6).

---

## 10. UI/UX (responsive / mobile-first)

### 10.1 Information architecture

```
Inventory
 ├── Procurement Dashboard (KPIs, pending GRN/approvals/claims)
 ├── Purchase Orders (list → detail → timeline)
 ├── Receive Goods (mobile wizard: scan → qty → photo)
 ├── Inspection Queue
 ├── Supplier Claims
 ├── Purchase Returns
 ├── Stock Reconciliation
 └── Suppliers (scorecard tab)
```

### 10.2 Mobile receive wizard

1. Scan PO barcode / select PO.
2. Per line: scan product → enter delivered → split damaged/reject (if profile on).
3. Camera capture → `procurement_attachments`.
4. Offline queue (IndexedDB) sync when online — Phase 5.

### 10.3 Config admin (shop owner)

- Toggle inspection mode, GRN without PO, tracking fields visible.
- Manage approval matrix and custom rejection reasons.

### 10.4 Component reuse

Extend existing `purchase-order-receive` → stepper with conditional steps from `procurement_module_config` API.

---

## 11. Multi-tenant & multi-branch

- All tables: `tenant_id`, `shop_id`, `branch_id` (existing `BranchScopedEntity`).
- **Central procurement:** `shop_id` = hub shop; `delivery_branch_id` on PO lines.
- **Franchise:** separate `shop_id`, shared supplier catalog optional via tenant-level `suppliers` (future).
- **Warehouse receive:** mandatory `warehouse_id` on GRN; visibility API aggregates buckets per branch/warehouse.
- Headers: `X-Tenant-Id`, `X-Shop-Id`, `X-Branch-Id` (existing pattern).

---

## 12. Phased implementation roadmap

| Phase | Scope | Engineer-weeks* | Outcome |
|-------|--------|-----------------|---------|
| **0** | Config framework + profiles + audit events | 3–4 | Foundation for all verticals |
| **1** | PO workflow expansion + fulfillment metrics + cancel/amend rules | 4–5 | Universal PO states |
| **2** | GRN v2 (sources, draft, qty dimensions) + posting engine + buckets | 8–10 | Correct inventory impact |
| **3** | Inspection + evidence attachments | 5–6 | QC-ready businesses |
| **4** | Supplier claims + resolutions + purchase returns | 6–8 | Dispute closure |
| **5** | Reconciliation + AP/GRNI events + GST purchase | 5–7 | Finance parity |
| **6** | Scorecards + notifications + mobile PWA + AI hooks | 4–6 | Operations excellence |

\* *One full-stack engineer-week ≈ 5 days; parallel backend/frontend reduces calendar time.*

**Suggested MVP for go-live (Phases 0–2):** ~15–19 engineer-weeks (~4 months with 1 FTE, ~2 months with 2 FTE).

### 12.1 Migration strategy

1. Additive Flyway migrations (`V9__procurement_universal.sql` …).
2. Backfill `workflow_status` from legacy `status` (`CONFIRMED` → `APPROVED` or `SENT_TO_SUPPLIER`).
3. Dual-write GRN to old + new tables during transition (2-week flag).
4. Feature flag per shop: `procurement.universal.enabled`.

---

## 13. AI & automation (future-ready)

| Use case | Data hook |
|----------|-----------|
| Shortage detection | `low_stock_queue` + PO open qty |
| Damage image classification | `procurement_attachments` + claim type |
| Supplier risk score | `supplier_kpi_snapshot` + claim history |
| Purchase anomaly | PO unit cost vs `supplier_product_mapping.last_price` |
| Smart reorder | Existing intelligent procurement |
| Claim prediction | GRN reject reasons → ML model |

Expose features via `ai-feature-flags` per tenant; no core workflow dependency.

---

## 14. Permissions (RBAC)

| Permission | Actions |
|------------|---------|
| `MANAGE_PURCHASES` | PO create/edit/submit |
| `APPROVE_PURCHASES` | Approval matrix |
| `RECEIVE_GOODS` | GRN draft/receive |
| `INSPECT_GOODS` | Inspection complete |
| `MANAGE_CLAIMS` | Claims & resolutions |
| `POST_RECONCILIATION` | Cycle count post |
| `MANAGE_STOCKS` | Legacy superset during migration |

---

## 15. References (codebase)

- `stock-service/.../V6__purchase_orders_goods_receipts.sql`
- `stock-service/.../PurchaseOrderService.java`
- `stock-service/.../StockService.receivePurchaseInbound`
- `docs/PURCHASE-MANAGEMENT-PLAN.md`, `docs/INTELLIGENT-PROCUREMENT.md`
- `shop-management-ui/.../business-type-capabilities.ts`

---

*Document owner: Platform / Inventory team. Review with finance (account-service) before Phase 5.*
