# SugamFlow Automobile Software — Feature Catalog

**Purpose:** What shop owners get today in the automobile vertical (spare parts, workshop, tyre, distributor).  
**Audience:** Sales, demos, onboarding, purchase decisions.  
**Last updated:** June 2026

---

## Supported shop types

| Business type | Best for | Demo shop |
|---------------|----------|-----------|
| **AUTO_PARTS** | Spare parts counter / retail shop | `AUTO-DEMO-01` |
| **AUTO_WORKSHOP** | Garage / mechanic workshop | `WORKSHOP-DEMO-01` |
| **AUTO_SERVICE_CENTER** | Authorized service center | Same modules as workshop |
| **AUTO_DEALER** | Vehicle sales showroom | `DEALER-DEMO-01` |
| **AUTO_PARTS_DISTRIBUTOR** | Wholesale / bulk distribution | `DIST-DEMO-01` |
| **TYRE_BATTERY_SHOP** | Tyre & battery specialist | `TYRE-DEMO-01` |
| **AUTO_MULTIBRAND** | Multi-brand auto store | Uses spare-parts module |

Shops can register via **public registration** (`/register` → Automotive category) or **admin onboarding**.

**Demo login:** Shop owner mode → `demo` / `Demo@2026` on any demo shop above (see login **Show demo login card**).

---

## Module overview

```
┌─────────────────────────────────────────────────────────────────┐
│  AUTO PARTS HUB (/auto-parts)                                   │
│  Dashboard · Counter · Vehicle finder · Workshop · Warranty     │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   Product master      Procurement (PO/GRN)   Counter billing
   Vehicle master      Stock & suppliers      Orders & GST
```

---

## 1. Spare parts product master

**Screens:** Products list, Add/Edit product (auto section), Import wizard

| Feature | Available | Notes |
|---------|-----------|-------|
| Part number (SKU) | Yes | Unique per shop |
| OEM part number | Yes | Primary counter lookup |
| Alternate / cross-reference numbers | Yes (API) | API + DB; limited UI on product form |
| Manufacturer & part brand | Yes | |
| HSN/SAC, GST %, MRP, selling price | Yes | India GST ready |
| Barcode scan at counter | Yes | Via order form |
| Shelf / rack / bin location | Yes | On `auto_part_details` |
| Min/max stock, reorder level | Yes | Low-stock alerts |
| Warranty days & terms | Yes | On part master |
| Core charge (deposit parts) | Yes | Linked to core returns |
| Vehicle fitment (compatibility) | Yes | Part ↔ make/model/variant/year |
| Product import (Excel) | Yes | Shared import wizard |
| Product images / attachments | No | Not built for auto |

---

## 2. Vehicle master & intelligent search

**Screens:** `/auto-parts/vehicles`, `/auto-parts/finder`

| Feature | Available | Notes |
|---------|-----------|-------|
| Vehicle makes, models, variants | Yes | Master data + API |
| Customer vehicle registration | Yes | Reg number lookup |
| Search by OEM number | Yes | `/api/v1/auto-parts/search` |
| Search by barcode | Yes | |
| Search by text (part name/code) | Yes | |
| Search by vehicle (make/model/year) | Yes | Returns compatible parts |
| Registration → compatible parts | Yes | Counter workflow |
| VIN decode (automatic) | No | Manual entry only |
| TecDoc / ACES catalog import | No | Future enhancement |

---

## 3. Counter billing & sales

**Screens:** `/auto-parts/counter`, `/orders`, `/orders/add`

| Feature | Available | Notes |
|---------|-----------|-------|
| Fast counter POS | Yes | Order form with `autoCounter` mode |
| Barcode scanning | Yes | |
| GST-inclusive billing | Yes | |
| Customer = vehicle owner | Yes | Labels: "Vehicle owners" |
| Sales history & print | Yes | Orders list |
| Credit / due tracking | Yes | Shared orders module |
| Dedicated alternate-parts panel at counter | Partial | API exists; UI drawer limited |
| Sales return workflow (auto-specific) | Partial | Uses generic order returns |

---

## 4. Inventory & stock

**Screens:** `/stocks`, stock add/edit, near-expiry report

| Feature | Available | Notes |
|---------|-----------|-------|
| Stock on hand, reserved, available | Yes | |
| Batch / expiry (where applicable) | Yes | Shared stock model |
| Low-stock banner | Yes | |
| Inline stock edit (desktop + mobile cards) | Yes | |
| Inter-warehouse transfer | No | Not implemented |
| Inventory buckets (damaged, QC hold) | Yes | Via procurement/GRN |

---

## 5. Procurement (parts purchasing)

**Screens:** `/stocks/purchase-orders`, suppliers, GRN receive, direct GRN, inspections, claims

| Feature | Available | Notes |
|---------|-----------|-------|
| Purchase orders (draft → approve → receive) | Yes | Full workflow + audit trail |
| Goods receipt (GRN) with batch/cost | Yes | Increases stock |
| Direct GRN (no PO) | Yes | |
| Supplier master | Yes | |
| Supplier ↔ part mapping (supplier part #, MOQ, lead time) | Yes | |
| Quality inspection on GRN | Yes | Configurable |
| Supplier claims & purchase returns | Yes | |
| Stock reconciliation | Yes | |
| AP invoices & 3-way match | Yes | Finance role |
| Procurement profile **AUTO_PARTS** | Yes | Auto-configured for automobile shops |
| Mobile PO list (card layout) | Yes | |

---

## 6. Workshop (garage / service center)

**Screens:** `/auto-parts/workshop`, job card create/detail

| Feature | Available | Notes |
|---------|-----------|-------|
| Job cards (open → in progress → closed) | Yes | |
| Add labour + parts lines | Yes | |
| Reserve parts on job | Yes | Reduces available stock |
| Consume parts on job complete | Yes | |
| Link to customer vehicle | Yes | Via registration master |
| Bay scheduling / technician roster | No | |
| Service reminders (SMS) | No | |

*Available for:* `AUTO_WORKSHOP`, `AUTO_SERVICE_CENTER`, `AUTO_DEALER` (workshop nav group).

---

## 7. Warranty & core returns

**Screens:** `/auto-parts/warranty`, `/auto-parts/core-returns`

| Feature | Available | Notes |
|---------|-----------|-------|
| Customer warranty claims | Yes | DRAFT → SUBMITTED → APPROVED → CLOSED |
| Core charge issue tracking | Yes | ISSUED → RETURNED |
| Link claim to invoice line automatically | No | Manual claim entry |
| OEM warranty portal integration | No | |

---

## 8. Customers & staff

| Feature | Available | Notes |
|---------|-----------|-------|
| Vehicle owners (customers) | Yes | Shared user/customer module |
| Vehicle registration per customer | Yes | |
| Staff accounts & permissions | Yes | MANAGE_PRODUCTS, MANAGE_ORDERS, MANAGE_STOCKS, procurement roles |
| Owner dashboard | Yes | Shared; auto-specific KPI widgets limited |

---

## 9. GST & compliance

| Feature | Available | Notes |
|---------|-----------|-------|
| GST % on products | Yes | |
| HSN on spare parts | Yes | |
| GST service (enterprise) | Yes | `gst-service` for advanced flows |
| E-invoice / e-way bill | Partial | Platform-dependent |

---

## 10. Reports & dashboard

**Screen:** `/auto-parts` (Auto Parts Hub)

| Feature | Available | Notes |
|---------|-----------|-------|
| Automobile hub dashboard | Yes | KPI cards, quick links |
| Generic sales reports | Yes | Via orders |
| Automobile-only analytics pack | Partial | No dedicated auto P&L / fast-mover report screen |
| Near-expiry stock report | Yes | Shared |

---

## 11. Mobile & tablet

| Feature | Available | Notes |
|---------|-----------|-------|
| Responsive UI (Bootstrap) | Yes | Counter, stock, PO cards on phone |
| Touch-optimized counter | Partial | Usable; not a dedicated tablet POS skin |
| Offline mode | No | Requires network |
| Android/iOS native app | No | Web only |

---

## 12. Platform features (shared with other verticals)

| Feature | Available |
|---------|-----------|
| Multi-tenant / multi-shop | Yes |
| Role-based access | Yes |
| Subscription (monthly/yearly) | Yes (shop record) |
| Email notifications (invites, alerts) | Yes |
| Audit trail (procurement PO/GRN) | Yes |
| Login audit (security) | Yes (recent) |

---

## Not available today (automobile-specific gaps)

Use this list honestly in sales conversations:

| Gap | Impact |
|-----|--------|
| **Dealer CRM** (leads, quotations, bookings, deliveries) | `AUTO_DEALER` uses products + orders only |
| **Online payment** at signup | Manual/subscription offline |
| **VIN decoder** | Manual vehicle entry |
| **OEM catalog feed** (TecDoc, ACES) | Manual product entry or import |
| **Alternate parts UI** on product form | API only |
| **Inter-branch stock transfer** | Not built |
| **Dedicated automobile reports** | Generic reports only |
| **Salesman → auto shop conversion** wired to `AUTO_PARTS` type | Field-force converts to generic `FIELD_FORCE` type today |

---

## Demo & verification

```powershell
# Seed all 5 automobile demo shops
.\scripts\seed-automobile-demo.ps1

# API smoke (products, vehicles, workshop, warranty)
.\scripts\test-automobile-api-smoke.ps1 -ShopIds AUTO-DEMO-01
```

**Field sales demo flow** (phone + tablet): see `docs/FIELDFORCE-DEMO-LOGIN-CARD.md`  
- Phone: salesman on `GEN-DEMO-01` → `/field-force/workspace`  
- Tablet: owner on `AUTO-DEMO-01` → `/auto-parts` counter demo

---

## Quick reference — main menu routes

| Menu | Route |
|------|-------|
| Auto Parts Hub | `/auto-parts` |
| Counter billing | `/auto-parts/counter` |
| Vehicle parts finder | `/auto-parts/finder` |
| Vehicle master | `/auto-parts/vehicles` |
| Spare parts list | `/products` |
| Stock | `/stocks` |
| Purchase orders | `/stocks/purchase-orders` |
| Suppliers | `/stocks/suppliers` |
| Workshop job cards | `/auto-parts/workshop` |
| Warranty claims | `/auto-parts/warranty` |
| Core returns | `/auto-parts/core-returns` |
| Orders / invoices | `/orders` |
| Customers | `/users` |

---

## Related documentation

- `docs/AUTOMOBILE-FEATURES-ONE-PAGER.md` — **one-page print summary** for sales meetings  
- `docs/AUTOMOBILE-FEATURES-HINDI.md` — **हिंदी फील्ड सेल्स गाइड**  
- `docs/AUTOMOBILE-DEMO-SETUP.md` — demo seeds & credentials  
- `docs/AUTOMOBILE-SPARE-PARTS-IMPLEMENTATION-REPORT.md` — technical implementation depth  
- `docs/AUTOMOBILE-SPARE-PARTS-AUDIT-REPORT.md` — gap analysis & QA  
- `docs/AUTOMOBILE-FLOW-TESTING-GUIDE-PDF.md` — **all flows + QA walkthrough (PDF source)**  
- `docs/automobile-guides/SugamFlow-Automobile-All-Flows-Features-Guide.pdf` — **printable PDF** (`npm run pdf:automobile` in `docs/`)  
- `docs/FIELDFORCE-DEMO-LOGIN-CARD.md` — salesman + tablet demo script  
- `docs/FIELDFORCE-SALESMAN-PROMOTER-GUIDE-Hindi.md` — field-force login & leads (Hindi)
