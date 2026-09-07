# SugamFlow shop UI — businesses and functionality

Source of truth: `shop-management-ui` navigation + `business-type-capabilities.ts` + Report centre catalogue.  
Date: 2026-09-07. Runtime: signed-in app at `sugamflow.com` (not the public marketing site).

This file lives in **sugamflow-doc** (not the UI repo).

What a shop **sees** is the intersection of:

1. Shop `businessType` (this document).
2. Platform Subscription modules / packs (`effective-config`). Wholesale desks need pack `WHOLESALE`.
3. Staff permissions (owner sees more than a cashier).
4. Tenant / shop isolation — every bill is stored with `tenant_id` + `shop_id`. GEN-DEMO-01 (tenant 101) never lists POLY-DEMO-01 (tenant 105) orders.

Login is always **auth-service**: shop id + username + password.

---

## How to read this

- **Retail core** is the default for GENERIC, RETAIL, GROCERY, FASHION, ELECTRONICS, JEWELRY, BEAUTY_PARLOR, RESTAURANT, OPTICAL, BOOK_STORE, OTHER, and unset type. Same screens; labels may change (Customers / Guests / Clients).
- **Clinic workflow** = POLYCLINIC / CLINIC (and aliases). MEDICAL and PHARMACY use **retail screens** plus medicine / Rx extras — not full OPD.
- **School** and **Astrology** are listed so you do not confuse them with shop ERP. Day-to-day School is `school-ui`. Astrology public sites are not this app.
- Report centre: `/reports`. Many sales/stock desks are **not** extra Finance sidebar rows.

---

## Shared platform (every shop that has the module)

| Area | Route | What it does |
|---|---|---|
| Shop registry | `/shops` | Outlets for the signed-in tenant |
| Command / owner home | `/owner-dashboard` | Retail pulse, wholesale dayboard, or auto parts home by type |
| Products | `/products` | Catalog (hidden for pure path lab / school) |
| Sale / Orders | `/orders` | POS / bills list, add, print, collect |
| Collect Payment | `/payments` | Outstanding by party (retail rows show as **Shop**) |
| Stock | `/stocks` | On-hand, batches, adjustments |
| Staff | `/staff` | Invite / roles (identity stays auth/user-service) |
| People | `/users` | Customers / Patients / Buyers / Guests |
| Report centre | `/reports` | Catalogue of reports + desks |
| Daily Income / Expenses / Payroll | `/finance/other-income`, `/finance/expenses`, `/finance/payroll` | Cashbook extras |
| Party ledger / collection / credit | `/finance/party-ledger`, `/finance/collection-desk`, `/finance/credit-control` | AR desks |
| Accounts / GL / final | `/finance/accounts`, `/finance/ledger`, `/finance/final-accounts` | Books |
| Cashbook | `/finance/cash-book` | Cash / bank |
| Sales analysis | `/finance/sales-analysis` | Item / company / HSN / route / MR |
| AR / AP ageing | `/finance/ar-ageing`, `/finance/ap-ageing` | Age buckets |
| Sales returns | `/finance/sales-returns` | Credit notes |
| E-Invoice / E-Way | `/compliance/einvoice` | Only if gst-service is configured — not invented IRNs |
| Alerts | `/alerts` | Low stock / expiry / credit rules |
| Super Admin | `/admin/**` | Platform subscription, tenant users, invites — not shop day-to-day |

**Report centre — common sales/stock (all audiences unless noted)**

- Sales register `/finance/sales-register`
- Cashier day close `/finance/day-close`
- Item velocity `/finance/item-velocity`
- Branch sales `/finance/branch-sales` (period revenue **and** period order/invoice counts)
- Stock intelligence, near expiry, batch margin, ageing
- Stock net movement `/stocks/net-movement`
- Stock valuation `/stocks/valuation`
- Dump / expiry value `/stocks/dump-expiry` (read-only; no write-off)
- GSTR summary / GST recon (books, not filed returns)
- Channel listing pack `/products/channel-listings` (CSV export only — no live Amazon/Flipkart)

---

## 1. Generic / general retail family

**Types:** `GENERIC`, `RETAIL`, `GROCERY`, `FASHION`, `ELECTRONICS`, `JEWELRY`, `BEAUTY_PARLOR`, `OPTICAL`, `BOOK_STORE`, `OTHER`, empty type.

**Capabilities:** retail catalog on; no OPD, no path lab, no pharmacy dispense, no tenant-wide patients.

**Top bar (typical):** Products · Sale · Stock · Payment (plus Staff / people when permitted).

**Functionality**

- Product master, categories, search, edit/delete
- POS / orders: bill, split pay, due, print, returns
- Collect Payment: pending shop bills grouped by customer (UI says Patient — same retail data)
- Stock: current stock, PO, auto PO, GRN / purchase bill, AP invoices, rack/bin, transfers, production/BOM, trade schemes
- Command center (`/owner-dashboard`) — sales / money / inventory widgets
- Optical / book store: extra catalog attribute packs only
- Electronics: AI insight widgets if order-service exposes them
- Restaurant (`RESTAURANT`): **same retail core**. People tab = Guests. There is **no** KOT / table-service product in this UI.

---

## 2. Wholesale / distributor

**Types:** `WHOLESALE`, `DISTRIBUTOR` (and auto parts distributor as wholesale **audience** for reports).

**Extra vs retail:** sidebar **Wholesale** group when subscription pack `WHOLESALE` is on.

**Functionality**

- Distributor home / Dayboard (`/owner-dashboard`)
- B2B sale bills / SO (`/wholesale`)
- Beat / salesman credit desks (wholesale-only nav)
- Barcode labels, purchase-bill shortcuts marked wholesale-only
- Report centre audience `wholesale` (Dayboard, sale book) plus shared sales/stock reports
- People tab = Buyers

---

## 3. Medical shop

**Type:** `MEDICAL` (also `MEDICAL_SHOP`).

**Capabilities:** retail catalog **and** pharmacy dispense; healthcare patients; tenant-wide clinical records (to see polyclinic Rx in the same tenant); packaging (strip/tablet).

**Not** full clinic OPD (no doctor Today / reception as the primary workflow).

**Functionality**

- Everything in retail core
- Medicine catalog fields, near-expiry, batch margin, stock ageing, daily stock nav
- Prescriptions: doctor Rx queue `/pharmacy`, walk-in `/pharmacy/add`, counter `/pharmacy/counter`
- Dispense polyclinic prescriptions for the **same tenant**
- People tab = Patients (shared tenant patient master)
- Collect Payment still lists **Shop** bills for this outlet only

---

## 4. Pharmacy

**Type:** `PHARMACY` (also `RETAIL_PHARMACY`, `CLINIC_PHARMACY`).

Same shape as Medical shop: retail + Rx dispense + tenant-wide patients. Procurement profile `PHARMACY_CHAIN`.

**Functionality:** Medical shop list above. Typical demo pairing: clinic shop writes Rx → pharmacy shop dispenses (`TRUST-MEDI-01` → `PHARMACY-01` pattern).

---

## 5. Polyclinic / clinic (OPD)

**Types:** `POLYCLINIC`, `CLINIC`.

**Capabilities:** OPD on; retail catalog **off** (no generic product grid as the main catalog); pharmacy dispense on (in-clinic pharmacy); tenant-wide patients and clinical records.

**Top / clinic chrome:** Doctor or Reception header instead of Products/Sale when the role is clinical.

### Doctor

| Screen | Route |
|---|---|
| Today / follow-ups | `/doctor/today` |
| Patients | `/doctor/patients` |
| Consultations / queue | `/doctor/dashboard/queue` |
| Consultation | `/doctor/consultation` |
| Path Lab referrals | `/doctor/path-lab-referrals` |
| Pharmacy referrals | `/doctor/pharmacy-referrals` |
| Healthcare reports | `/reports?category=Healthcare` |

### Reception

| Screen | Route |
|---|---|
| Reception desk | `/reception/dashboard` |
| Queue TV | `/clinic/queue-display` |
| Collect Payment | `/payments` |
| Tokens / slots | reception dashboard (booking is **not** blocked if Command center widgets fail) |

### Clinic admin

- Healthcare executive dashboard `/healthcare/executive-dashboard`
- Complete patient history `/reports/patient-history`
- Document / prescription / clinical / advice templates
- In-clinic pharmacy queue, walk-in, counter, stock, expiry, returns
- Clinic lab sidebar (referrals into a path-lab shop in the tenant)
- Shared finance / GST / report centre (audience `clinic`)

**Hospital chrome is hidden** on clinic/polyclinic (`hideHospitalOnlyClinicChrome`). IPD code exists but is not the day-1 clinic menu.

---

## 6. Hospital

**Type:** `HOSPITAL`.

**Capabilities:** same as clinic **plus** `hospitalInpatient`.

**Functionality:** all clinic OPD/pharmacy **and** IPD:

| Screen | Route |
|---|---|
| IPD overview | `/ipd`, `/ipd/overview` |
| Inpatients | `/ipd/patients` |
| Beds | `/ipd/beds` |
| Nursing | `/ipd/nursing` |
| Rounds | `/ipd/rounds` |
| Orders | `/ipd/orders` |
| Discharge | `/ipd/discharge` |
| IPD billing | `/ipd/billing` |
| ER board | `/ipd/er` |
| Ops | `/ipd/ops` |
| Patient chart | `/ipd/patient/:admissionId` |

TPA / ABHA appear on admit / encounter where those desks were shipped — not a second subscription product.

---

## 7. Pathology lab

**Types:** `PATH_LAB`, `PATHOLOGY_LAB`, `DIAGNOSTIC_LAB`.

**Capabilities:** path lab on; retail catalog **off**; no OPD; patients tenant-wide; product catalog **not** tenant-wide (stock stays on this outlet).

**Header (max 5):** Dashboard · Orders · Worklist · Reports · Payments.

### Daily lab

| Screen | Route |
|---|---|
| Lab dashboard | `/path-lab` |
| Test booking | `/path-lab/booking` |
| Worklist | `/path-lab/worklist` |
| Result entry / published PDFs | `/path-lab/reports` |
| Lab payments | `/path-lab/payments` |
| Accession | `/path-lab/accession` |
| Patients | `/users` |
| Patient history | `/reports/patient-history` |
| Shop billing / inventory | `/orders`, `/stocks` (sidebar, not header) |

### Lab operations (sidebar; permission-gated)

- Test master `/path-lab/test-master`
- Instruments `/path-lab/instruments`
- QC `/path-lab/qc`
- Network `/path-lab/network`
- Camps `/path-lab/camps`
- Settlement `/path-lab/settlement`
- Collection-centre portal `/path-lab/cc-portal`
- Referrals / referrer desk `/path-lab/referrals`, `/path-lab/referrer-desk`
- Commissions `/path-lab/commissions`
- Rate cards `/path-lab/rate-cards`
- NABL `/path-lab/nabl`
- Specialty desks: micro, hematology, biochemistry, hormones, thyroid, serology, histo
- Report templates, validation policies, notifications, ecosystem, barcode settings, role templates
- PWA hub `/pwa`

Lab PDFs are **clinical output**, not Report centre MIS. Business reports stay at `/reports` (audience `lab`).

---

## 8. Automobile

**Types:** `AUTO_PARTS`, `AUTO_WORKSHOP`, `AUTO_SERVICE_CENTER`, `AUTO_DEALER`, `AUTO_PARTS_DISTRIBUTOR`, `TYRE_BATTERY_SHOP`, `AUTO_MULTIBRAND`.

**Capabilities:** retail catalog + automobile module. Workshop types also get job cards.

**Functionality**

- Retail core (parts as products, counter billing)
- Parts dashboard (`/owner-dashboard`)
- Auto-parts header tab and sidebar (vehicle master, OEM catalog, counter) — existing auto-parts module routes
- Workshop / service center / dealer: job cards and parts consumption
- Distributor type: wholesale report audience as well
- People tab = Vehicle owners

---

## 9. School / education

**Types:** `SCHOOL`, `EDUCATION`, `ACADEMY`.

**In this shop UI:** almost no retail catalog. Identity / Super Admin can create a school tenant (`/admin/create-school`). **Attendance, fees, timetable, website CMS** live in **school-ui** + school services — not here. Do not treat Holly Cross Website CMS as a shop module.

People-tab fallback label = Students (if someone opens this UI).

---

## 10. Astrology / Jyotish

**Type:** `ASTROLOGY`.

**In shop UI:** sidebar **Astro ERP** → `/astro` (customers & kundlis) when that route is wired. Login is still shop + user + password.

**Not in this UI:** public pandit websites (`jhaastro.com` forms). Central desk is `astro.sugamflow.com` (jyotish-ui). Isolation is tenant/shop (e.g. JHAASTRO), not a second login product.

---

## 11. Super Admin / platform (not a shop type)

| Screen | Route |
|---|---|
| Platform dashboard | `/admin/platform-dashboard` |
| Platform subscription | `/admin/platform-subscription` |
| Create shop / school | `/admin/create-shop`, `/admin/create-school` |
| Tenant users | `/admin/tenant-users` |
| Login invite / reset | `/admin/create-login-invite` |
| Support tickets | `/admin/support-tickets` |
| Field force admin | `/admin/field-force` |
| Medicine master / providers | `/admin/medicine-master`, `/admin/medicine-providers` |
| School website domains | `/admin/school-website-domains` (tenant hosts, not “school-only”) |

Plans and limits are configured **only** here. Feature services must not grow a second plan editor.

---

## Capability matrix (code)

From `capabilitiesForBusinessType` in `shop-management-ui`:

| Type | OPD | Path lab | Retail catalog | Pharmacy Rx | Tenant patients | IPD | Auto |
|---|---|---|---|---|---|---|---|
| GENERIC / RETAIL / grocery / fashion / electronics / jewelry / beauty / restaurant / optical / book / other | | | Yes | | | | |
| WHOLESALE / DISTRIBUTOR | | | Yes | | | | |
| MEDICAL / PHARMACY | | | Yes | Yes | Yes | | |
| POLYCLINIC / CLINIC | Yes | | | Yes | Yes | | |
| HOSPITAL | Yes | | | Yes | Yes | Yes | |
| PATH_LAB | | Yes | | | Yes | | |
| AUTO_* (workshop variants) | | | Yes | | | | Yes (+ job cards) |
| SCHOOL | | | | | | | |
| ASTROLOGY | | | Yes (default retail fallback) | | | | + `/astro` nav |

Unset or unknown type = retail default.

---

## Intentionally not in shop ERP

- Restaurant KOT / table maps
- Live marketplace connectors (CSV listing pack only)
- School fees / attendance / CMS as shop features
- A separate `reporting-service` for shop MIS (Report centre calls order/stock/finance APIs)
- Cross-shop data on Collect Payment (list is `tenantId` + logged-in `shopId`)

---

## Where to click (quick)

| You want | Open |
|---|---|
| Day close, branch sales, valuation | `/reports` then Sales or Stock |
| Clinic day | `/doctor/today` or `/reception/dashboard` |
| Lab day | `/path-lab` |
| Pharmacy Rx | `/pharmacy` |
| Hospital wards | `/ipd` |
| Outstanding collect | `/payments` |
