# SugamFlow — Automobile All Flows & Features Guide

**Primary demo shop:** AUTO-DEMO-01  
**Login:** Shop owner mode → `demo` / `Demo@2026`  
**Duration:** Full walkthrough ~90 min · Quick demo ~15 min  
**Audience:** Sales, QA, onboarding, shop owners

---

## Quick glossary

| Term | Meaning |
|------|---------|
| **OEM number** | Original equipment manufacturer part number (primary counter lookup) |
| **Fitment** | Which vehicle make/model/year a part fits |
| **Counter POS** | Fast spare-parts billing at shop counter |
| **PO / GRN** | Purchase order → goods receipt → stock increase |
| **Job card** | Workshop repair order with labour + parts |
| **Core charge** | Deposit on returnable parts (e.g. alternator core) |
| **Warranty claim** | Customer claim against sold part with warranty |

---

## Demo shops & credentials

| Business type | Shop ID | Tenant | Username | Password |
|---------------|---------|--------|----------|----------|
| Spare parts counter | `AUTO-DEMO-01` | 114 | `demo` | `Demo@2026` |
| Workshop / garage | `WORKSHOP-DEMO-01` | 115 | `demo` | `Demo@2026` |
| Vehicle dealer (basic) | `DEALER-DEMO-01` | 116 | `demo` | `Demo@2026` |
| Tyre & battery | `TYRE-DEMO-01` | 117 | `demo` | `Demo@2026` |
| Parts distributor | `DIST-DEMO-01` | 118 | `demo` | `Demo@2026` |

**Seed all demos:**

```powershell
.\scripts\seed-automobile-demo.ps1
```

**API smoke test:**

```powershell
.\scripts\test-automobile-api-smoke.ps1 -ShopIds AUTO-DEMO-01
```

Login screen → **Show demo login card** → pick shop → **Shop owner mode**.

---

## Before you start

| Check | How to verify |
|-------|---------------|
| UI running | http://localhost:4200 |
| Gateway + auth up | Login succeeds |
| Demo seeded | AUTO-DEMO-01 shows products, stock, suppliers |
| Automobile routes | `/auto-parts` loads dashboard (not 404) |

If `/auto-parts` returns 404, restart **gateway-service** so automobile routes load.

---

## Module map — main routes

| Module | Route | What it does |
|--------|-------|--------------|
| Auto Parts Hub | `/auto-parts` | Dashboard, KPIs, quick links |
| Counter billing | `/auto-parts/counter` | Fast POS for spare parts |
| Vehicle parts finder | `/auto-parts/finder` | Search by OEM, vehicle, barcode |
| Vehicle master | `/auto-parts/vehicles` | Customer vehicles & registration |
| Spare parts list | `/products` | Part master (OEM, brand, HSN, fitment) |
| Stock | `/stocks` | On-hand, low-stock alerts |
| Purchase orders | `/stocks/purchase-orders` | PO workflow + GRN |
| Suppliers | `/stocks/suppliers` | Supplier master + catalog |
| GRN inspections | `/stocks/inspections` | Quality hold before stock (if configured) |
| Workshop job cards | `/auto-parts/workshop` | Garage jobs (WORKSHOP-DEMO-01) |
| Warranty claims | `/auto-parts/warranty` | Customer warranty lifecycle |
| Core returns | `/auto-parts/core-returns` | Deposit part tracking |
| Orders / invoices | `/orders` | Sales history & print |
| Customers | `/users` | Vehicle owners |

---

# Part A — Feature catalog (what is included today)

## A1. Supported shop types

| Type | Best for | Demo shop |
|------|----------|-----------|
| AUTO_PARTS | Spare parts retail counter | AUTO-DEMO-01 |
| AUTO_WORKSHOP | Garage / mechanic | WORKSHOP-DEMO-01 |
| AUTO_SERVICE_CENTER | Authorized service | Same as workshop |
| AUTO_DEALER | Showroom (basic) | DEALER-DEMO-01 |
| AUTO_PARTS_DISTRIBUTOR | Wholesale | DIST-DEMO-01 |
| TYRE_BATTERY_SHOP | Tyre & battery specialist | TYRE-DEMO-01 |
| AUTO_MULTIBRAND | Multi-brand store | Uses spare-parts module |

## A2. Spare parts product master

| Feature | Status |
|---------|--------|
| Part number (SKU), OEM number | Yes |
| Brand, manufacturer, HSN/GST, MRP | Yes |
| Barcode scan at counter | Yes |
| Shelf / rack / bin location | Yes |
| Min/max stock, reorder alerts | Yes |
| Warranty days on part | Yes |
| Core charge (deposit parts) | Yes |
| Vehicle fitment (compatibility) | Yes |
| Excel product import | Yes |
| Product images | No |

## A3. Vehicle master & search

| Feature | Status |
|---------|--------|
| Make / model / variant master | Yes |
| Registration number lookup | Yes |
| Search by OEM number | Yes |
| Search by vehicle (make/model/year) | Yes |
| VIN auto-decode | No |
| TecDoc / OEM catalog feed | No |

## A4. Counter billing & sales

| Feature | Status |
|---------|--------|
| Fast counter POS | Yes |
| GST-inclusive billing | Yes |
| Customer = vehicle owner | Yes |
| Sales history & print | Yes |
| Credit / due tracking | Yes |
| Dedicated alternate-parts panel | Partial (API exists) |

## A5. Inventory & procurement

| Feature | Status |
|---------|--------|
| Stock on hand, reserved, available | Yes |
| Low-stock banner | Yes |
| Purchase orders (draft → approve → receive) | Yes |
| GRN with batch/cost | Yes |
| Direct GRN (no PO) | Yes |
| Supplier master + part catalog mapping | Yes |
| Quality inspection on GRN | Yes (configurable) |
| Supplier claims & purchase returns | Yes |
| Inter-warehouse transfer | No |

## A6. Workshop (garage)

| Feature | Status |
|---------|--------|
| Job cards (open → closed) | Yes |
| Labour + parts lines | Yes |
| Reserve parts on job | Yes |
| Consume parts on job complete | Yes |
| Bay scheduling / technician roster | No |

## A7. Warranty & core returns

| Feature | Status |
|---------|--------|
| Warranty claims (DRAFT → CLOSED) | Yes |
| Core charge issue / return tracking | Yes |
| OEM warranty portal integration | No |

## A8. Not available (be honest in sales)

| Gap | Impact |
|-----|--------|
| Dealer CRM (leads, booking, delivery) | DEALER-DEMO uses products + orders only |
| VIN decoder | Manual vehicle entry |
| TecDoc/OEM catalog feed | Manual entry or Excel import |
| Dedicated automobile P&L reports | Generic reports only |
| Offline mode | Web only, network required |
| Native Android/iOS app | Browser only |

---

# Part B — 15-minute sales demo (AUTO-DEMO-01)

| Step | Screen | Show |
|------|--------|------|
| 1 | Login → AUTO-DEMO-01 | Shop owner lands on Auto Parts Hub |
| 2 | `/auto-parts` | Dashboard KPIs and quick links |
| 3 | `/auto-parts/finder` | Search part by OEM or Maruti Swift 2023 |
| 4 | `/auto-parts/counter` | Bill 2–3 parts with GST |
| 5 | `/products` | OEM column, fitment, low-stock badges |
| 6 | `/stocks/purchase-orders` | Open PO-APPR-001 → receive goods |
| 7 | `/orders` | Recent counter sales |

**Pass / Fail:** ___________

---

# Part C — Full flow walkthrough (AUTO-DEMO-01)

## Phase C1 — Login & hub (5 min)

1. Open http://localhost:4200
2. **Show demo login card** → select **AUTO-DEMO-01**
3. Mode: **Shop owner** → Login

**Expected:** Header shows **Demo AUTO DEMO 01**. Menu includes **Auto Parts Hub**, **Counter sales**, **Parts stock**, **Purchase orders**.

4. Navigate to `/auto-parts`

**Expected:** Dashboard with quick links to Counter, Finder, Vehicles, Workshop, Warranty.

**Test ID:** AUTO-001 — Pass / Fail: ___________

---

## Phase C2 — Vehicle parts finder (10 min)

1. Menu → **Auto Parts Hub** → **Vehicle finder** (or `/auto-parts/finder`)
2. Search by **OEM number** (e.g. a seeded Bosch or Mann filter OEM from products list)
3. Search by **vehicle**: Make **Maruti**, Model **Swift**, Year **2023**

**Expected:** Compatible parts list with part number, OEM, brand, stock hint.

4. Open **Vehicle master** (`/auto-parts/vehicles`)
5. Find a seeded registration (e.g. `DL01AB1234` if present) → view linked customer

**Expected:** Vehicle record with owner and compatible parts link.

**Test IDs:** AUTO-002, AUTO-003 — Pass / Fail: ___________

---

## Phase C3 — Counter billing (15 min)

1. Go to `/auto-parts/counter` (or Orders → Add with auto counter mode)
2. Select / add customer (vehicle owner)
3. Add parts:
   - Search by part name or scan barcode
   - Add **Brake pad** or **Oil filter** (any seeded auto part)
4. Verify line GST, quantity, unit price
5. Save order / complete bill

**Expected:** Order saved. GST totals correct. Stock decreases for billed qty.

6. Open `/orders` → find new order → print or view detail

**Test IDs:** AUTO-004, AUTO-005 — Pass / Fail: ___________

---

## Phase C4 — Product master (10 min)

1. Menu → **Products** (`/products`)
2. Verify columns: Part number, OEM, Brand, Stock (for automobile shops)
3. Open any product → check tabs: General, Pricing, Inventory, Compatibility, Supplier, Warranty
4. Open fitment / compatibility section → verify vehicle links

**Expected:** Automobile-specific fields visible. Fitment rows for seeded parts.

**Test ID:** AUTO-006 — Pass / Fail: ___________

---

## Phase C5 — Stock & low-stock alerts (5 min)

1. Menu → **Parts stock** (`/stocks`)
2. Search a part billed in Phase C3
3. Confirm quantity reduced vs before billing
4. Check low-stock banner (if any part below reorder level)

**Expected:** Stock matches sales. Low-stock toast may appear for demo parts.

**Test ID:** AUTO-007 — Pass / Fail: ___________

---

## Phase C6 — Supplier & catalog (10 min)

1. Menu → **Stock** → **Suppliers** (`/stocks/suppliers`)
2. Open **Bosch Auto Parts India** (SUP-01)
3. Review GSTIN, payment terms, status **ACTIVE**
4. Scroll to **Product catalog** — mapped parts with MOQ, lead time

**Expected:** 10 suppliers seeded. Catalog mappings on key suppliers.

5. Optional: **+ Add supplier** → create test supplier → add catalog line

**Test IDs:** AUTO-008, AUTO-009 — Pass / Fail: ___________

---

## Phase C7 — Purchase order & GRN (20 min)

### Seeded POs on AUTO-DEMO-01

| PO number | Status | Use for |
|-----------|--------|---------|
| PO-DRAFT-001 | DRAFT | Edit, add lines, submit workflow |
| PO-APPR-001 | APPROVED | Receive goods (GRN) |
| PO-RCV-001 | FULLY_RECEIVED | View history, fulfillment panel |

1. Open `/stocks/purchase-orders`
2. Open **PO-APPR-001** (approved, ready to receive)
3. Click **Receive goods (GRN)**
4. Enter delivered / accepted quantities → Submit

**Expected:** GRN created. PO status moves toward PARTIALLY_RECEIVED or FULLY_RECEIVED.

5. Check **Fulfillment** panel on PO detail (ordered vs received vs accepted)

**Important — inspection mode:** If procurement config has `grnPostingMode = AFTER_INSPECTION`, accepted qty goes to **inspection hold** first. Complete approval at **Stock → Inspections** (`/stocks/inspections`) before sellable stock updates.

6. Verify stock increase on received part (after inspection if applicable)

**Test IDs:** AUTO-010, AUTO-011, AUTO-012 — Pass / Fail: ___________

---

## Phase C8 — Warranty & core returns (10 min)

1. `/auto-parts/warranty` — view seeded warranty claim
2. Walk status: DRAFT → SUBMITTED → APPROVED → CLOSED (if actions available)
3. `/auto-parts/core-returns` — view core charge issue (ISSUED → RETURNED)

**Expected:** At least 1 warranty + 1 core return seeded on AUTO-DEMO-01.

**Test IDs:** AUTO-013, AUTO-014 — Pass / Fail: ___________

---

## Phase C9 — Customers & staff (5 min)

1. Menu → **Customers** / **Users** (`/users`)
2. Open a vehicle owner — verify phone, vehicles linked
3. Menu → **Staff** — list staff roles (if seeded)

**Expected:** ~50 customers seeded with vehicle registrations.

**Test ID:** AUTO-015 — Pass / Fail: ___________

---

# Part D — Workshop demo (WORKSHOP-DEMO-01)

1. Logout → Login **WORKSHOP-DEMO-01** / `demo` / `Demo@2026`
2. `/auto-parts/workshop` — list job cards
3. Open an **OPEN** job card → view parts + labour lines
4. Note **reserved** stock on parts lines
5. Complete / close job → verify parts **consumed** from stock

**Expected:** 6 job cards seeded (OPEN/CLOSED mix). Stock reserve/consume works.

**Test IDs:** AUTO-W01, AUTO-W02 — Pass / Fail: ___________

---

# Part E — Tyre & battery demo (TYRE-DEMO-01)

1. Login **TYRE-DEMO-01**
2. `/products` — MRF/Apollo/CEAT tyres, Exide/Amaron batteries
3. `/auto-parts/counter` — bill 1 tyre + 1 battery
4. `/orders` — verify GST bill

**Expected:** 8 tyres + 4 batteries seeded. 3 sample orders.

**Test ID:** AUTO-T01 — Pass / Fail: ___________

---

# Part F — Distributor demo (DIST-DEMO-01)

1. Login **DIST-DEMO-01**
2. `/stocks` — high warehouse quantities (~60 bulk SKUs)
3. `/stocks/suppliers` — 5 wholesale suppliers
4. `/stocks/purchase-orders` — wholesale POs
5. `/orders` — 2 wholesale orders

**Expected:** Bulk stock and B2B-style order history.

**Test ID:** AUTO-D01 — Pass / Fail: ___________

---

# Part G — Dealer demo (DEALER-DEMO-01)

1. Login **DEALER-DEMO-01**
2. `/products` — 7 vehicle SKUs (showroom catalog)
3. `/orders` — 2 high-value orders
4. `/users` — 50 leads (customers)

**Note:** Dedicated dealer CRM (leads pipeline, quotations, bookings, deliveries) is **not built**. Demo uses product + order data only.

**Test ID:** AUTO-DE01 — Pass / Fail: ___________

---

# Part H — Field sales + tablet combo demo

| Device | Login | Screen | Story |
|--------|-------|--------|-------|
| Phone (salesman) | GEN-DEMO-01 field-force user | `/field-force/workspace` | Capture lead, schedule visit |
| Tablet (shop owner) | AUTO-DEMO-01 | `/auto-parts/counter` | Owner bills parts while salesman is in field |

See `docs/FIELDFORCE-DEMO-LOGIN-CARD.md` for salesman credentials.

---

# Troubleshooting

| Problem | Solution |
|---------|----------|
| `/auto-parts` 404 | Restart gateway-service; check automobile routes in `application.properties` |
| Products 500 / permission denied on `auto_part_details` | Run `infra/postgres/patches/productdb-grant-automobile-tables.sql` on productdb |
| PO detail database error | Ensure PO has lines (re-run `seed-automobile-demo.ps1`) |
| Stock not updated after GRN | Check GRN status INSPECTION_PENDING → approve at `/stocks/inspections` |
| Wrong supplier on PO form | Use AUTO-DEMO suppliers (Bosch, Mann Filter) not GEN-DEMO suppliers |
| Outlet registry error | Restart shop-service; hard refresh browser |
| City required on shop edit | Restart UI dev server after latest fix |

---

# Test sign-off

| Field | Value |
|-------|-------|
| Shop tested | AUTO-DEMO-01 |
| Tests executed | ______ / 25 |
| Passed | ______ |
| Failed | ______ |
| Blockers | |
| Tester name | |
| Date | |

**Pilot ready?** If Phases C1–C8 pass on AUTO-DEMO-01 → automobile spare-parts module ready for pilot.

---

# Test case reference

| ID | Module | Priority | Summary |
|----|--------|----------|---------|
| AUTO-001 | Hub | P0 | Login + dashboard |
| AUTO-002 | Finder | P0 | OEM search |
| AUTO-003 | Vehicles | P0 | Vehicle master + registration |
| AUTO-004 | Counter | P0 | Create counter bill |
| AUTO-005 | Orders | P0 | Order history + GST |
| AUTO-006 | Products | P0 | Auto part master tabs |
| AUTO-007 | Stock | P0 | Stock after sale |
| AUTO-008 | Supplier | P0 | Supplier list |
| AUTO-009 | Catalog | P1 | Supplier catalog mapping |
| AUTO-010 | PO | P0 | Open approved PO |
| AUTO-011 | GRN | P0 | Receive goods |
| AUTO-012 | Inspection | P1 | Inspection hold → stock |
| AUTO-013 | Warranty | P1 | Warranty claim view |
| AUTO-014 | Core | P1 | Core return view |
| AUTO-015 | CRM | P1 | Vehicle owners |
| AUTO-W01 | Workshop | P1 | Job card list |
| AUTO-W02 | Workshop | P1 | Reserve/consume parts |
| AUTO-T01 | Tyre | P2 | Tyre counter demo |
| AUTO-D01 | Distributor | P2 | Wholesale stock |
| AUTO-DE01 | Dealer | P2 | Vehicle SKU catalog |

---

## Related files

| Document | Purpose |
|----------|---------|
| `docs/AUTOMOBILE-FEATURES.md` | Full English feature catalog |
| `docs/AUTOMOBILE-FEATURES-ONE-PAGER.md` | One-page sales summary |
| `docs/AUTOMOBILE-FEATURES-HINDI.md` | Hindi field sales guide |
| `docs/AUTOMOBILE-DEMO-SETUP.md` | Seed script & SQL files |
| `docs/PO-SUPPLIER-TESTING-STEPS-PDF.md` | Detailed PO/GRN walkthrough (GEN-DEMO) |
| `scripts/seed-automobile-demo.ps1` | Seed all 5 demo shops |

---

*SugamFlow · Automobile spare parts, workshop & distribution · June 2026*
