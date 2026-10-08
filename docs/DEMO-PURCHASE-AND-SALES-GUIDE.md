# SugamFlow — demo & test playbook (purchase + POS)

Use this **one document** to rehearse QA and walk a client through a believable retail flow: **procurement (supplier → PO → GRN → stock)** and **selling (order + optional GST)**.

**Last updated:** 2026-05-14 (aligned with current `shop-management-ui`, `stock-service`, `order-service`, gateway proxy).

---

## 1. Environment checklist

| Item | Notes |
|------|------|
| **Gateway** | Running (local default often `http://127.0.0.1:9090`; Angular dev proxy uses `proxy.conf.js`). |
| **Services** | At minimum: gateway, shop-service (registry), stock-service (purchases + inventory), order-service (orders), user/product as required for login/catalog. |
| **UI** | `shop-management-ui` — `npm start`; open app, log in as a user with **`MANAGE_STOCKS`** and **`MANAGE_ORDERS`**. |
| **Context** | Header: correct **tenant** + **shop** + **branch** (purchase and stock use `X-Tenant-Id` / `X-Shop-Id`). |
| **DB** | `stock-service`: Flyway through **`V6__purchase_orders_goods_receipts.sql`** applied on inventory DB before PO/GRN features work. |

---

## 2. Demo script (~10 minutes)

### A. Procurement (Purchase order → inward / GRN)

1. **Suppliers**  
   Navigate: **Stock → Suppliers** (`/stocks/suppliers`).  
   Add **one supplier** (name, code, optional GSTIN). Save.

2. **Products & baseline stock (optional)**  
   **Products**: ensure at least one sellable product exists.  
   **Stock**: you can skip manual add if you will receive everything via GRN.

3. **Purchase order**  
   **Stock → Purchase orders** (`/stocks/purchase-orders`) → **+ New PO**.  
   Pick **supplier**, **PO date**, add **lines** (product, qty ordered, unit cost) → save **draft**.

4. **Confirm**  
   Open the PO (`/stocks/purchase-orders/:id`) → **Confirm PO** (draft → confirmed).

5. **Goods receipt (GRN)**  
   From list **Receive** or from detail **Receive goods (GRN)**.  
   For each open line set **qty to receive**, **batch number**, optional **expiry**, **purchase price**, optional **supplier invoice # / date** → **Post receipt & update stock**.

6. **Verify inward**  
   **Stock → list**: quantity increased for received products (batches carry **purchase price**; **inventory transactions** logged as `PURCHASE_IN` / `GRN` in backend).

**Talking point:** “We register the supplier PO, confirm it, then every inward is a posted GRN that lands cost and qty into inventory.”

### B. Selling (POS order + GST choice)

7. **Shop GST setting**  
   **Shops**: if the shop owner wants **no GST at all**, turn off **Enable GST billing for this shop**.  
   If they are GST-registered and want choice per bill, leave it **on** and capture GSTIN/state as today.

8. **Place order**  
   **Orders → New** (`/orders/add`): add lines, payment as usual.

9. **Include GST on this bill** (only when shop GST billing is **on**)  
   Checked → tax computed on bill; unchecked → bill without GST for that sale.

10. **Save** → confirm order appears in list / print path as you use in demos.

**Talking point:** “Master switch is the shop; the checkbox is the counter choice for this bill.”

---

## 3. Quick test matrix (internal QA)

| # | Case | Expect |
|---|------|--------|
| T1 | Create draft PO, edit lines, save | Status `DRAFT`; totals match lines. |
| T2 | Confirm PO | Status `CONFIRMED`. |
| T3 | Partial GRN | Status `PARTIALLY_RECEIVED`; open qty decreases. |
| T4 | Full GRN | Status `CLOSED`; stock matches cumulation. |
| T5 | Shop GST **off** | No “Include GST” on order form; bills without GST. |
| T6 | Shop GST **on** | Checkbox appears; unchecked vs checked changes tax/totals server-side after save. |

---

## 4. Troubleshooting (short)

- **422 / validation / Forbidden on purchases** — user missing **`MANAGE_STOCKS`**; fix role/permissions.  
- **PO/GRN 404 or table errors** — Flyway **`V6`** not applied on `stock-service` DB.  
- **Angular sees no data** — wrong tenant/shop in header vs data created.  
- **Gateway `/api/v1/purchases/**`** — already routed to `stock-service` in gateway config; Angular uses `gatewayResourceUrl('purchases/…')`.

---

## 5. Related technical references (optional)

- Deeper procurement design: **`docs/PURCHASE-MANAGEMENT-PLAN.md`**.  
- Competitor parity notes: **`docs/MARK-SOFTWARE-vs-SUGAMFLOW-WHATSAPP.md`**.
