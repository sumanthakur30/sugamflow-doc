# SugamFlow — PO & Supplier Testing Steps

**Shop:** GEN-DEMO-01  
**Login:** Demo GEN DEMO 01 (SHOP OWNER)  
**Duration:** ~45 minutes  
**Scenario:** ABC Stationery → Ball Pen + Notebook → Confirm → Partial GRN → Backorder → Second GRN → Verify stock

---

## Quick glossary (read first)

| Term | Meaning |
|------|---------|
| **Supplier** | Company you buy stock from |
| **Supplier Master** | Official list with GSTIN, phone, payment terms |
| **Supplier Catalog** | Products this supplier sells you + MOQ, lead time, last price |
| **PO (Purchase Order)** | Formal order document sent to supplier |
| **GRN (Goods Receipt Note)** | Record of goods physically received |
| **MOQ** | Minimum order quantity supplier accepts |
| **Lead time** | Days from PO to delivery |
| **Partial delivery** | Supplier sends less than ordered |
| **Backorder** | Remaining qty supplier still owes |
| **Accepted qty** | Good stock that increases inventory |

---

## Before you start

| Check | How to verify |
|-------|---------------|
| UI running | Open http://localhost:4200 |
| Stock service up | Suppliers page loads without "Database error" |
| DB migrations | V19/V20 applied on stockdb |
| Test products | **Ball Pen Blue** and **Notebook A4 200pg** exist under Products |

**Test spreadsheet (Excel):** `docs/templates/purchase-order-supplier-qa-test-cases.csv`

---

## Phase A — Create the supplier (10 min)

### Screen 1 — Supplier list

1. Menu: **Stock** → **Suppliers**
2. URL path: `/stocks/suppliers`

**Expected:** Table with Code, Name, GSTIN, Phone, Email, Status, Actions. **+ Add supplier** button visible.

**Test ID:** SUP-001 — Pass / Fail: ___________

---

### Screen 2 — New supplier form

1. Click **+ Add supplier**
2. Fill in:

| Field | Value |
|-------|-------|
| Code | SUP-ABC-01 |
| Name | ABC Stationery Traders |
| GSTIN | 29AABCA1234A1Z5 |
| PAN | AABCA1234A |
| Contact person | Ramesh Kumar |
| Phone | 9876543210 |
| Email | abc@stationery.in |
| City / State | Bengaluru / Karnataka |
| Payment terms | Net 15 |
| Credit limit | 50000 |
| Default lead time (days) | 2 |
| Status | Active |

3. Click **Create supplier**

**Expected:** Success message. Supplier appears in list with status **ACTIVE**.

**Test ID:** SUP-002 — Pass / Fail: ___________

---

### Screen 3 — Supplier catalog

1. Supplier list → **Edit** on ABC Stationery
2. Scroll to **Product catalog**
3. Add **Ball Pen Blue:** Priority 1, Lead 2 days, Last price 8, MOQ 50 → **Add to catalog**
4. Add **Notebook A4 200pg:** Priority 1, Lead 2 days, Last price 45, MOQ 20 → **Add to catalog**

**Expected:** Two products listed in catalog table.

**Test IDs:** SUP-005, CAT-001 — Pass / Fail: ___________

---

## Phase B — Create the purchase order (10 min)

### Screen 4 — PO list

1. Menu: **Stock** → **Purchase orders**
2. URL path: `/stocks/purchase-orders`

**Test ID:** PO-001 — Pass / Fail: ___________

---

### Screen 5 — New PO

1. Click **New PO** (or Add)
2. Search supplier: type **ABC** → select **ABC Stationery Traders**

**Expected:** Supplier summary card (GSTIN, payment terms, catalog count). **Browse catalog** available.

3. Open catalog → select Ball Pen + Notebook → add to PO
4. Enter line quantities:

| Product | Qty | Unit cost (₹) | GST % |
|---------|-----|---------------|-------|
| Ball Pen | 100 | 8 | 12 |
| Notebook | 50 | 45 | 12 |

5. PO date: today
6. Expected date: today + 2 days
7. Notes: School season stock
8. Click **Save draft**

**Expected:** PO saved with status **DRAFT**. Line totals and PO grand total calculated correctly.

**Test IDs:** PO-002, PO-003, CAT-002 — Pass / Fail: ___________

---

## Phase C — Approve the order (5 min)

### Screen 6 — PO detail

1. Open the new PO from the list

**Workflow — choose one path:**

| If you see this button | Action | Result status |
|------------------------|--------|---------------|
| **Confirm PO** | Click Confirm PO | CONFIRMED |
| **Submit** then **Approve** then **Send to supplier** | Click in order | SENT_TO_SUPPLIER |

**Expected:** **Receive goods (GRN)** button is enabled.

**Test IDs:** WF-001 or WF-002 — Pass / Fail: ___________

---

## Phase D — First goods receipt — partial delivery (10 min)

### Screen 7 — Receive goods (GRN)

1. PO detail → **Receive goods (GRN)**
2. URL path: `/stocks/purchase-orders/{id}/receive`

**Enter quantities:**

| Line | Open qty | Delivered | Accepted | Damaged | Pending balance |
|------|----------|-----------|----------|---------|-----------------|
| Ball Pen | 100 | 100 | 100 | 0 | — |
| Notebook | 50 | 35 | 35 | 0 | Select **Backorder** for remaining 15 |

3. Submit GRN

**Expected:**

- Success message and GRN number created
- PO status: **PARTIALLY_RECEIVED**
- Fulfillment panel shows partial percentage
- Notebook line shows backorder badge (15 units)

**Test IDs:** GRN-002, GRN-004 — Pass / Fail: ___________

---

## Phase E — Check inventory (5 min)

### Screen 8 — Product stock

1. Menu: **Products**
2. Open **Ball Pen Blue** — note current stock (call it S1)
3. Open **Notebook A4 200pg** — note current stock (call it S2)

**Expected after first GRN:**

- Ball Pen stock = S1 + **100**
- Notebook stock = S2 + **35**

Only **accepted** quantity increases sellable stock.

**Test IDs:** INV-001, INV-003 — Pass / Fail: ___________

---

## Phase F — Second GRN — close backorder (5 min)

### Screen 9 — Second receive

1. Return to the same PO detail page
2. Click **Receive goods** again
3. Notebook line: Delivered **15**, Accepted **15**
4. Submit GRN

**Expected:**

- Notebook total received = **50**
- PO status: **FULLY_RECEIVED** or **CLOSED**
- Backorder cleared on notebook line

**Test IDs:** GRN-003, GRN-004 — Pass / Fail: ___________

---

## Phase G — Final inventory check

| Product | Total stock increase from this PO |
|---------|-----------------------------------|
| Ball Pen | +100 |
| Notebook | +50 |

Check inventory transactions / stock movement if available in your shop views.

**Test ID:** INV-002 — Pass / Fail: ___________

---

## Optional bonus tests

| Test ID | Action | Expected |
|---------|--------|----------|
| WF-003 | Create PO → Submit → **Reject** | Status REJECTED; receive blocked |
| GRN-006 | GRN: Accepted 90, Damaged 5 | Stock +90 only |
| SUP-007 | Deactivate supplier from list | Status INACTIVE; Reactivate available |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Database error on Suppliers | Run `infra/postgres/patches/stockdb-v19-v20-procurement.sql` on stockdb; restart stock-service |
| No Confirm PO button | Universal procurement may be ON — use Submit / Approve / Send instead |
| Receive button disabled | PO must be CONFIRMED or APPROVED/SENT (not DRAFT) |
| Product not in catalog picker | Create product under Products module first |

---

## Test sign-off

| Field | Value |
|-------|-------|
| Tests executed | ______ / 35 |
| Passed | ______ |
| Failed | ______ |
| Blockers | |
| Tester name | |
| Date | |
| Shop | GEN-DEMO-01 |

**Pilot ready?** If all P0 tests pass → PO & Supplier module is ready for pilot use on this shop.

---

## Test case reference (full list)

| ID | Module | Priority | Summary |
|----|--------|----------|---------|
| SUP-001 | Supplier | P0 | Open supplier list |
| SUP-002 | Supplier | P0 | Create supplier |
| SUP-003 | Supplier | P0 | Duplicate GSTIN blocked |
| SUP-005 | Supplier | P0 | Add catalog mapping |
| CAT-001 | Catalog | P0 | Catalog loads on PO |
| PO-001 | PO | P0 | Open PO list |
| PO-002 | PO | P0 | Create draft PO |
| PO-003 | PO | P0 | Line total calculation |
| WF-001 | Workflow | P0 | Confirm PO (simple mode) |
| WF-002 | Workflow | P0 | Submit / Approve / Send |
| GRN-001 | GRN | P0 | Full receipt 100/100 |
| GRN-002 | GRN | P0 | Partial receipt 70/100 |
| GRN-003 | GRN | P0 | Second GRN closes balance |
| GRN-004 | Backorder | P0 | Backorder disposition |
| INV-001 | Inventory | P0 | Stock before/after |
| INV-002 | Inventory | P1 | Inventory transaction |
| INV-003 | Inventory | P1 | Fulfillment panel |

Full spreadsheet: `docs/templates/purchase-order-supplier-qa-test-cases.csv`

---

*SugamFlow · Procurement testing guide · GEN-DEMO-01*
