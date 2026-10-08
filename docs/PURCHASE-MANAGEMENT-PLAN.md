# Purchase management — analysis & implementation plan

**Goal:** Model **supplier → purchase order → goods receipt**, tie inbound quantity and **landing cost** to stock and (optionally) accounting, replacing ad-hoc “Add stock only” workflows for procurement.

---

## 1. Current state (repository analysis)

### What exists today

| Area | Behaviour |
|------|-----------|
| **Inbound quantity** | `stock-service` `StockService.addStock` (`POST /stock/add`) merges quantity onto the **aggregate `stock`** row per product / branch / shop; optionally creates **`inventory_batches`** when `batchNumber` is provided. |
| **UI** | `shop-management-ui` **Add / Edit stock** — pick product + quantity (+ optional batch/expiry for pharma-style flow). No supplier, PO number, taxes, or three-way match. |
| **`inventory_batches`** | Table + entity include **`purchase_price`**, **`mrp`**, **`selling_price`**, **`quantity_available`**. **Gap:** `addStock` creates a batch **without** setting `purchase_price` / `mrp` / `selling_price` (only qty, expiry, batch number). |
| **`inventory_transactions`** | Exists with `transaction_type`, `reference_type`, `reference_id`, `quantity_in/out`, **`unit_cost`**. **Gap:** **`addStock` does not insert** ledger-style transactions — audit trail for “why did stock jump?” is weak. |
| **Warehouses** | `Warehouse` / default **MAIN** auto-creation inside `StockService.resolveWarehouseId` supports storage location concepts. |
| **Customer orders** | `order-service` handles **sales** (stock **out** via reservation / fulfilment paths). **Purchases are not mirrored** as first-class documents. |

### Confirming: no procurement domain yet

Grepping the **application** codebase (excluding `node_modules`): no **supplier**, **purchase order**, **GRN**, or procurement controllers — only unrelated **“coPurchaseCount”** in recommendations.

---

## 2. What “purchase management” should mean (scoped)

**Minimum viable (MVP):**

1. **Supplier master** — name, GSTIN optional, phone, address, payment terms (simple text), active flag; scoped by **tenant + shop** (same as catalog).
2. **Purchase order (PO)** — header: supplier, expected date, status (`DRAFT`, `CONFIRMED`, `PARTIALLY_RECEIVED`, `CLOSED`, `CANCELLED`); lines: product, qty ordered, unit cost, tax/discount fields as needed for India (start **exclusive** totals if GST split is phased).
3. **Goods receipt note (GRN)** — receive against a PO line (partial allowed) **or** one-off inbound (optional): quantities, batch/expiry continuation, landed cost updates.
4. **Stock effect** — on GRN **post**, increase stock using **existing** semantics (`addStock` or a consolidated internal **receive** method).

**Later (phase 2+):**

- PO approval workflow; email/WhatsApp PO PDF  
- Creditor **accounts payable** postings via `account-service`  
- Purchase return / debit note  
- Landed cost allocation (freight charges across lines)

---

## 3. Architectural options

| Approach | Pros | Cons |
|---------|------|------|
| **A. Extend `stock-service`** — new tables (`suppliers`, `purchase_orders`, `purchase_order_lines`, `goods_receipts`, `goods_receipt_lines`) in **same DB**, new controllers under e.g. `/purchases` or `/procurement`. | Single transaction for **GRN + stock + batch**; reuses repositories; simplest ops. | Blurs “inventory vs procurement” bounded context as the service grows. |
| **B. New `purchase-service`** calling `stock-service` over HTTP/WebClient | Clean separation | **Distributed transaction**: GRN persisted but stock RPC fails unless you implement **compensation**, idempotent receive, saga — more moving parts early. |
| **C. Master data in `shop-service`, documents in `stock-service`** | Shop directory “feels right” for party master | Split writes; still need coherence for FKs unless supplier IDs are replicated. |

**Recommendation for SugamFlow today:** **(A)** implement **purchase + supplier + GRN inside `stock-service`** (same PostgreSQL schema, Flyway migrations), with a **future extract** path if procurement becomes huge. Optionally move **supplier** to `shop-service` later if CRM-style sharing across apps matters.

---

## 4. Data model sketch (Flyway migrations)

Entities (tenant/shop scoped, align with existing `TenantScopedEntity` / `BranchScopedEntity` patterns):

1. **`suppliers`**  
   `id`, `tenant_id`, `shop_id`, `code` (unique per shop), `name`, `gstin`, contact fields, `status`, timestamps.

2. **`purchase_orders`**  
   `id`, `tenant_id`, `shop_id`, `branch_id` (delivery branch), `supplier_id`, `po_number` (unique per shop), `po_date`, `expected_date`, `status`, `notes`, totals (`subtotal`, `tax_total`, `grand_total`), `created_by`.

3. **`purchase_order_lines`**  
   `purchase_order_id`, `line_no`, `product_id`, `qty_ordered`, `qty_received` (computed or maintained on receive), `unit_cost`, optional tax fields.

4. **`goods_receipts`**  
   `id`, `purchase_order_id` (nullable for ad-hoc), `grn_number`, `received_at`, `received_by`, `status` (`POSTED` / `DRAFT`).

5. **`goods_receipt_lines`**  
   `goods_receipt_id`, `purchase_order_line_id` (nullable if ad-hoc), `product_id`, `qty_received`, optional `batch_number`, `expiry_date`, **`purchase_price`** (for `InventoryBatch`).

**Indexes:** `(tenant_id, shop_id, po_number)`, `(tenant_id, shop_id, grn_number)` unique.

---

## 5. Business rules & integration with stock

### 5.1 Posting a GRN (happy path)

1. Validate PO line open quantities (ordered − already received ≥ this receipt).  
2. For each line:  
   - Call internal method similar to **`addStock`** — ideally **extract** `_receiveStock(ProductId, qty, branchId, batchMeta, landedCost)` used by both `POST /stock/add` and GRN posting.  
   - When batch path used: **`InventoryBatch`** should set **`purchase_price`** (and pass through **mrp**/selling price if ERP updates price list).  
3. **`PurchaseOrderLine.qty_received`** (or derived via sum of GRN lines) updated.  
4. **`purchase_orders.status`** → `PARTIALLY_RECEIVED` or `CLOSED`.  
5. Insert **`inventory_transactions`** row: e.g. `transaction_type=PURCHASE_IN`, `reference_type=GRN`, `reference_id=grnId`, `quantity_in=qty`, `unit_cost=...`, `warehouse_id` consistent with stock row.

### 5.2 Ad-hoc receipts (optional MVP)

Allow GRN **without** PO for counter purchase — creates stock movement only and updates supplier totals off-book or links “one-time supplier”. Can defer until after PO-based flow stabilises.

### 5.3 Permissions

Reuse pattern: **`MANAGE_STOCKS`** for receiving; consider **`MANAGE_PURCHASES`** for PO create/approve differentiation (split later).

---

## 6. API surface (proposal)

Expose under gateway path **`/api/v1/purchases/...`** (stock-service controllers, routed like `/stock`):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/purchases/suppliers` | List suppliers (page optional) |
| `POST` | `/purchases/suppliers` | Create supplier |
| `PUT` | `/purchases/suppliers/{id}` | Update |
| `GET` | `/purchases/orders` | List PO with filters |
| `POST` | `/purchases/orders` | Create draft PO |
| `PUT` | `/purchases/orders/{id}` | Edit draft / confirm |
| `POST` | `/purchases/orders/{id}/receive` | Create GRN + post lines (body: lines[]) **or** split `POST …/grns` then `POST …/grns/{id}/post` |

Wire **gateway** `Path=/api/v1/purchases,/api/v1/purchases/**` → `stock-service`.

---

## 7. Frontend (`shop-management-ui`)

1. **`Suppliers`** — list + form (reuse `app-form-card` patterns from products/customers).  
2. **`Purchase orders`** — list (status badges), detail, line editor (reuse order-form line UX patterns).  
3. **`Receive goods`** wizard — choose PO → enter quantities per line, batch/expiry where needed → **Post receipt**.  
4. **Routing** — add `/purchases/...` under authenticated layout; sidebar entries under **Stock** group or **Procurement**.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| **Double-post** duplicate stock | GRN **`POST`** idempotent key or **`POSTED`** status prevents repeat; transactional boundary around stock + receipt. |
| **Cost vs selling price drift** | Optional toggle “update product `price`/`mrp` from last receipt” — default **off**. |
| **GST complexity** | MVP: store **exclusive** amounts + GST % per line later; defer e-invoice for **purchase**. |
| **Large migrations** | Backfill scripts not required; tables are additive. |

---

## 9. Phased rollout (recommended)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **P0** | DB migrations + `Supplier` CRUD API + Angular suppliers screen | Addresses “supplier management missing” in competitor sheet |
| **P1** | `PurchaseOrder` + lines CRUD, confirm, list | Order-to-supplier without stock yet (optional) |
| **P2** | **GRN post** → `addStock` extension + **`inventory_transactions`** + batch **purchase_price** | True purchase-driven inventory |
| **P3** | Reports (purchase by supplier/date), CSV export | Operating visibility |
| **P4** | `account-service` hooks (creditors, GRNI) | Finance parity |

Rough effort (one full-stack dev): **P0–P2** ≈ **2–4 weeks** depending on GST granularity and QA depth.

### P0 status (in this repo)

- [x] **`suppliers`** table (Flyway `V5__create_suppliers.sql`) + JPA entity
- [x] REST under **`/purchases/suppliers`** (gateway: **`/api/v1/purchases/**`** → `stock-service`, `StripPrefix=2`)
- [x] Angular: **`/stocks/suppliers`** list + add/edit ( **`MANAGE_STOCKS`** ); nav under Stock

Next: purchase orders + GRN (see §9 phases P1–P2).

---

## 10. Document history

- Initial draft from codebase review (`stock-service` `StockService.addStock`, `InventoryBatch`, `InventoryTransaction`, `stock-form`, gateway routes).
- Added: P0 supplier implementation (`V5`, `/purchases/suppliers`, UI `/stocks/suppliers`).
