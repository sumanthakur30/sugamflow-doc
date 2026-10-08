# Automobile Spare Parts Module — Implementation Report

**Date:** June 2026  
**Platform:** SugamFlow (Spring microservices + Angular)

---

## Phase 1 — Industry Analysis Summary

### Compared solutions

| Solution | Core strength | Fitment / cross-ref | Workshop | Warranty / core |
|----------|---------------|---------------------|----------|-----------------|
| **SAP Automotive** | OEM–dealer integration, financial consolidation | EPC integration, variant config | Service orders in DMS | OEM claim workflows |
| **Oracle NetSuite Automotive** | Cloud ERP for aftermarket distributors | Item attributes, multi-subsidiary | Limited native workshop | Returns & RMA |
| **Marg ERP Automobile** | India GST, parts-wise stock, workshop billing | Part number multi-filter reports | Service + spare inventory | Basic returns |
| **GoFrugal Auto Spare** | Counter POS, serial/lot, multi-location | Barcode, centralized master | Retail-focused | Warranty tracking in POS |
| **AutoFluent** | North American shop management | Catalog integration | Full shop management | Core charges |
| **OEM DMS** (dealer systems) | VIN → EPC parts lookup, repair orders | Authoritative fitment | Bay scheduling, RO | OEM warranty only |

### Industry-standard product master fields

| Field | Industry practice | SugamFlow implementation |
|-------|-------------------|--------------------------|
| Part number | Internal SKU (unique per shop) | `products.code` |
| OEM part number | Primary lookup at counter | `auto_part_details.oem_part_number` |
| Alternate numbers | Cross-reference (aftermarket, competitor) | `auto_part_alternate_numbers` |
| Manufacturer / brand | Separate from retail brand | `manufacturer`, `part_brand` + `brands` |
| Vehicle compatibility | YMME / variant mapping | `vehicle_*` + `part_vehicle_compatibility` |
| Category / sub-category | Merchandising + search | `products.category`, `sub_category` |
| HSN/SAC, GST %, Cess | India compliance | `hsn_sac`, `gst_percent`, `cess_percent` |
| Unit | PCS, SET, LTR | `units` / `base_unit_id` |
| Barcode | POS scan | `products.barcode` |
| Shelf / rack / bin | Pick path | `shelf_location`, `rack_location`, `bin_location` |
| Warranty | Days + terms on warranted lines | `warranty_*` on `auto_part_details` |

### Vehicle compatibility model (industry)

Hierarchy: **Make → Model → Variant → Engine/Fuel → Year range**  
Example: Maruti → Swift → VXI → Petrol → 2023  

Bidirectional lookup: vehicle → parts; part → vehicles (ACES/PIES pattern without full standard import).

---

## Phase 2–12 — Current Implementation Status

### Implemented

1. **Business types:** `AUTO_PARTS`, `AUTO_WORKSHOP` with procurement profile `AUTO_PARTS`.
2. **Product master extension:** `auto_part_details` (pricing tiers, stock thresholds, locations, warranty, core charge).
3. **Vehicle master:** makes, models, variants, registrations.
4. **Fitment:** `part_vehicle_compatibility` with category hints.
5. **Intelligent search API:** `/auto-parts/search` (OEM, barcode, text, vehicle-aware parsing, registration).
6. **Alternates API:** `/auto-parts/products/{id}/alternatives`.
7. **Supplier catalog:** Extended `supplier_product_mapping` (supplier part #, SKU, MOQ, discount).
8. **Workshop:** Job cards, lines, reserve on add, consume on complete.
9. **Customer warranty claims:** Status workflow (DRAFT → CLOSED).
10. **Core returns:** ISSUED → RETURNED tracking.
11. **UI:** Product form auto section, vehicle parts finder, auto parts hub, routes under `/auto-parts`.
12. **Gateway routes** for `/api/v1/auto-parts`, `/vehicles`, `/automobile`.

### Reused from existing platform (no duplication)

- Purchase orders, GRN, direct GRN, supplier claims, purchase returns
- Inventory buckets (IN_STOCK, RESERVED, DAMAGED, etc. — via existing `inventory_bucket_balances`)
- Counter billing via **Orders** + barcode lookup
- GST/HSN on product master
- Owner dashboard (order-service) — auto-specific KPIs not yet split

### Missing / recommended enhancements

| Area | Gap | Recommendation |
|------|-----|----------------|
| ACES/PIES import | No TecDoc/ACES feed | Middleware import job + validation |
| VIN decode | Not integrated | NHTSA / commercial VIN API |
| Supersession chains | No chain table | `part_supersessions` with soft-deprecate |
| Sales return UX | Generic orders only | Auto return window + invoice link UI |
| Dedicated auto POS | Uses order form | Auto counter mode with alternates panel |
| Reports | No auto dashboard slice | Extend owner-dashboard with parts KPIs |
| Mobile polish | Responsive forms started | Full touch QA on counter + GRN |
| Order ↔ warranty | Manual claim entry | Link claim to order line on invoice |
| Bucket sync | Workshop uses stock.reserved | Align with `inventory_bucket_balances` RESERVED |

---

## Phase 13 — End-to-end test checklist

| Step | Path | Status |
|------|------|--------|
| Set business type AUTO_PARTS | Shop settings | Manual |
| Seed vehicle master | SQL / API POST makes/models | `scripts/seed-auto-parts-demo.sql` |
| Create part with OEM + fitment | Products + compatibility API | Ready |
| Supplier mapping with MOQ | Product form / supplier form | Ready |
| PO → GRN | Existing procurement | Ready |
| Vehicle search → compatible list | `/auto-parts/finder` | Ready |
| Counter bill | `/orders/add` + search | Ready |
| Workshop job reserve/consume | `/automobile/workshop/*` | Ready |
| Warranty claim lifecycle | `/automobile/warranty-claims` | Ready |
| Core issue/return | `/automobile/core-returns` | Ready |

---

## Files added (reference)

- `product-service/.../V13__automobile_spare_parts.sql`
- `product-service/.../model/AutoPart*.java`, `Vehicle*.java`
- `product-service/.../controller/AutoPartController.java`, `VehicleController.java`
- `product-service/.../service/AutoPartSearchService.java`, `VehicleMasterService.java`
- `stock-service/.../V16__automobile_workshop_warranty.sql`
- `stock-service/.../controller/AutomobileController.java`
- `shop-management-ui/.../auto-parts.service.ts`, `vehicle-parts-finder`, `auto-parts-hub`

---

## UI/UX & mobile

- Vehicle finder uses stacked `col-6` / `col-md-*` grids — no forced horizontal scroll on phone widths.
- Product auto section uses responsive rows.
- **Follow-up:** Order form alternate-parts drawer; workshop job card mobile wizard.

---

## Industry comparison conclusion

SugamFlow now covers **aftermarket distributor core workflows** (master, fitment, search, procurement, counter sales, workshop consumption, warranty, cores) aligned with Marg/GoFrugal/Odoo auto modules, while **OEM DMS depth** (EPC live feed, VIN, supersession automation) remains extension work. The implementation follows the same extension pattern as **pharmacy** (`MedicineDetail`) rather than a separate microservice.
