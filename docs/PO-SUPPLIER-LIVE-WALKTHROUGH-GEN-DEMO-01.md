# Live walkthrough — Stationery PO end-to-end (GEN-DEMO-01)

**Time:** ~45 minutes  
**Shop:** GEN-DEMO-01  
**Login:** Demo GEN DEMO 01 (SHOP_OWNER)  
**Scenario:** ABC Stationery → Ball Pen + Notebook → Confirm → Partial GRN → Backorder → Second GRN → Verify stock

Open the test spreadsheet alongside: [`templates/purchase-order-supplier-qa-test-cases.csv`](templates/purchase-order-supplier-qa-test-cases.csv)

---

## Before you start

| Check | How |
|-------|-----|
| UI running | http://localhost:4200 |
| Gateway + stock-service up | Suppliers page loads without "Database error" |
| Migrations applied | V19/V20 on stockdb (see `infra/postgres/patches/stockdb-v19-v20-procurement.sql`) |
| Products exist | Create **Ball Pen Blue** and **Notebook A4 200pg** under Products if missing |

**Learning goal:** By the end you will understand Supplier → Catalog → PO → GRN → Inventory in one continuous story.

---

## Phase A — Create the supplier (10 min)

### Screen 1 — Supplier list

1. Top menu: **Stock** → **Suppliers**
2. URL: `/stocks/suppliers`

**You should see:** Table with search, status filter, **+ Add supplier**

**Mark test:** SUP-001 Pass/Fail

---

### Screen 2 — New supplier form

1. Click **+ Add supplier**
2. Enter:

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
| Default lead time | 2 |
| Status | Active |

3. Click **Create supplier**

**You should see:** Green success toast; redirect to supplier list; new row **ACTIVE**

**Learning:** Supplier Master = who you buy from + tax/compliance details.

**Mark test:** SUP-002 Pass/Fail

---

### Screen 3 — Supplier catalog

1. List → **Edit** on ABC Stationery
2. Scroll to **Product catalog**
3. **Add Ball Pen Blue:** Priority 1, Lead 2, Last price 8, MOQ 50 → **Add to catalog**
4. **Add Notebook A4 200pg:** Priority 1, Lead 2, Last price 45, MOQ 20 → **Add to catalog**

**You should see:** Two rows in catalog table

**Learning:** Catalog = what this supplier sells you + buying rules (MOQ, lead time, last price).

**Mark tests:** SUP-005, CAT-001 Pass/Fail

---

## Phase B — Create the purchase order (10 min)

### Screen 4 — PO list

1. **Stock** → **Purchase orders**
2. URL: `/stocks/purchase-orders`

**Mark test:** PO-001 Pass/Fail

---

### Screen 5 — New PO

1. Click **New PO** (or Add)
2. **Select supplier:** type "ABC" → pick **ABC Stationery Traders**

**You should see:**
- Supplier summary (GSTIN, terms, catalog count)
- Option to **Browse catalog**

3. Open catalog → select Ball Pen + Notebook → add to PO
4. Set quantities:

| Product | Qty | Unit cost | GST |
|---------|-----|-----------|-----|
| Ball Pen | 100 | 8 | 12% |
| Notebook | 50 | 45 | 12% |

5. PO date: today | Expected: today + 2 days
6. Notes: `School season stock`
7. **Save draft**

**You should see:** PO in list with status **DRAFT**; line totals calculated

**Learning:** PO = formal order document; draft = still editable.

**Mark tests:** PO-002, PO-003, CAT-002 Pass/Fail

---

## Phase C — Approve the order (5 min)

### Screen 6 — PO detail

1. Open the new PO from the list

**Check workflow mode:**

| If you see… | Do this |
|-------------|---------|
| **Confirm PO** button | Universal procurement is **OFF** → click **Confirm PO** → status **CONFIRMED** |
| **Submit / Approve / Send** | Universal **ON** → Submit → Approve → Send to supplier |

**You should see:** Status badge updated; **Receive goods (GRN)** button enabled

**Learning:** Confirm/Approve = manager says "yes, order from this supplier."

**Mark tests:** WF-001 or WF-002, WF-005 Pass/Fail

---

## Phase D — First goods receipt — partial (10 min)

### Screen 7 — Receive goods

1. PO detail → **Receive goods (GRN)**
2. URL: `/stocks/purchase-orders/{id}/receive`

**Scenario:** Supplier delivers **70 notebooks only** first (Ball Pen full 100).

| Line | Open | Delivered | Accepted | Damaged | Pending disposition |
|------|------|-----------|----------|---------|---------------------|
| Ball Pen | 100 | 100 | 100 | 0 | — |
| Notebook | 50 | 35 | 35 | 0 | **Backorder** for remaining 15 |

3. Submit GRN

**You should see:**
- Success message; GRN number created
- PO status **PARTIALLY_RECEIVED**
- Fulfillment panel: partial %
- Notebook backorder badge on PO detail

**Learning:**
- GRN = what physically arrived
- Partial delivery leaves **open qty**
- Backorder = supplier still owes balance

**Mark tests:** GRN-002, GRN-004 Pass/Fail

---

## Phase E — Check inventory (5 min)

### Screen 8 — Product stock

1. Go to **Products**
2. Open **Ball Pen Blue** → note stock (call it `S1`)
3. Open **Notebook A4** → note stock (call it `S2`)

**Expected after first GRN:**
- Ball Pen stock ≈ `S1 + 100`
- Notebook stock ≈ `S2 + 35`

**Learning:** Only **accepted** qty increases sellable stock.

**Mark tests:** INV-001, INV-003 Pass/Fail

---

## Phase F — Second GRN — close backorder (5 min)

### Screen 9 — Second receive

1. Return to same PO detail
2. **Receive goods** again
3. Notebook: Delivered 15, Accepted 15
4. Submit

**You should see:**
- Notebook total received = 50
- PO **FULLY_RECEIVED** or **CLOSED**
- Backorder cleared

**Mark tests:** GRN-003, GRN-004 Pass/Fail

---

## Phase G — Final inventory check

| Product | Expected total increase from PO |
|---------|--------------------------------|
| Ball Pen | +100 |
| Notebook | +50 |

Verify inventory transactions reference GRN if available in your stock views.

**Mark test:** INV-002 Pass/Fail

---

## Optional bonus tests (same session)

| Test | Quick action |
|------|--------------|
| Reject PO | Create second PO → Submit → **Reject** (WF-003) |
| Damaged goods | New PO → GRN with Accepted 90 Damaged 5 (GRN-006) |
| Deactivate supplier | List → Deactivate ABC → confirm hidden from new PO (SUP-007) |

---

## Sign-off

| Metric | Your result |
|--------|-------------|
| Tests executed | ___ / 35 |
| Passed | ___ |
| Failed | ___ |
| Blockers | |
| Tester name | |
| Date | |

**Production readiness (your shop after this walkthrough):** If all P0 tests pass → safe for pilot PO/supplier use on GEN-DEMO-01.
