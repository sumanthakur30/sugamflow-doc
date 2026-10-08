# Automobile Spare Parts Module — Audit Report

**Audit date:** 4 June 2026  
**Scope:** Registration, labels, database, navigation, dashboard, product master, vehicle compatibility, counter billing, supplier catalog, mobile, tables, UI, APIs  
**Method:** Code and schema review; no assumption that UI implies working backend.

---

## 1. Registration & Login Business Type Validation

### Implemented
| Item | Status | Evidence |
|------|--------|----------|
| Automobile Spare Parts Shop | Done | `AUTO_PARTS` in `automobile-business.ts`, `business-types.ts` |
| Automobile Workshop | Done | `AUTO_WORKSHOP` |
| Automobile Service Center | Done | `AUTO_SERVICE_CENTER` |
| Automobile Dealer | Done | `AUTO_DEALER` |
| Automobile Parts Distributor | Done | `AUTO_PARTS_DISTRIBUTOR` |
| Tyre & Battery Shop | Done | `TYRE_BATTERY_SHOP` |
| Multi-brand Automobile Store | Done | `AUTO_MULTIBRAND` |
| Registration taxonomy | Done | `business-taxonomy.ts` AUTOMOTIVE category; `module-catalog.ts` subtypes |
| Subtype → businessType mapping | Done | `businessTypeFromRegistrationSubtype()`; `public-shop-registration.component.ts` |
| Capabilities per type | Done | `business-type-capabilities.ts` (`automobileModule`, `automobileWorkshop`) |
| Label seeding (shop-service) | Done | `ShopDefaultHeaderLabelsSeeder`, `ShopDefaultUiFieldLabelsSeeder` automobile packs |
| Runtime label fallbacks | Done | `label-runtime.service.ts` + `AUTOMOBILE_LABEL_FALLBACKS` |

### Gaps / partial
| Item | Status | Notes |
|------|--------|-------|
| Admin shop create mapping all subtypes | Partial | Verify `admin-create-shop` / `shop-form` use `businessTypeFromRegistrationSubtype` for every AUTOMOTIVE subtype |
| Dashboard/menu per subtype (dealer vs tyre shop) | Partial | All automobile types share one nav pack; no tyre-only or dealer-only menu variant |
| Full onboarding E2E test | Not verified | Manual flow recommended after deploy |

---

## 2. Business-Specific Labels & Terminology

### Implemented
- Header labels: Product → Spare parts, Order → Counter billing, Stock → Spare inventory, User → Vehicle owners (seeded + fallbacks).
- Field labels: Part number, Part name, Spare category, OEM number, Brand, Stock (seeded keys in `automobile-ui-field-keys.ts`).
- `LabelRuntimeService` applies automobile fallbacks when shop labels missing.

### Gaps
- Not every screen uses `LabelRuntimeService` (some hard-coded "Product" in shared components).
- Purchase/GRN screens still use generic "Purchase" in places.
- Attachments tab label not surfaced on product form (no attachments UI for auto parts).

---

## 3. Database & Master Data Validation

### Tables (product-service `V13__automobile_spare_parts.sql`)
| Entity | Purpose | Status |
|--------|---------|--------|
| `auto_part_details` | OEM, brand, warranty, pricing, locations | Done |
| `auto_part_alternate_numbers` | Alternate part mapping | Done |
| `vehicle_makes` / `vehicle_models` / `vehicle_variants` | Vehicle hierarchy | Done |
| `part_vehicle_compatibility` | Part ↔ vehicle | Done |
| `vehicle_registrations` | Reg / VIN lookup | Done |

### Tables (stock-service `V16__automobile_workshop_warranty.sql`)
| Entity | Purpose | Status |
|--------|---------|--------|
| `supplier_product_mapping` extensions | supplier_sku, moq, lead time, supplier_part_number | Done |
| `workshop_job_cards` / lines | Workshop | Done |
| `customer_warranty_claims` | Warranty | Done |
| `core_return_tracking` | Core returns | Done |

### Gaps
| Item | Status |
|------|--------|
| Dedicated `supplier_catalog` table (separate from mapping) | Uses `supplier_product_mapping` — acceptable |
| Alternate numbers UI on product form | DB + API; **no form UI** for alternate numbers list |
| Product images / attachments | Not in auto migration |
| OEM catalog as separate master | Uses product + `auto_part_details` |

---

## 4. Automobile-Specific Navigation & Menu

### Implemented (`app-navigation.service.ts`)
- Overview dashboard → `/auto-parts` for automobile shops.
- Header tab "Spare parts" with submenu.
- Sidebar groups: Vehicle management, Spare parts, Parts procurement, Workshop (workshop types), Warranty & returns.
- `autoPartsOnly` links hidden for non-automobile shops.

### Gaps
| Menu item (spec) | Route / status |
|------------------|----------------|
| OEM Catalog | `/products` (shared catalog) — no dedicated OEM catalog screen |
| Compatibility Mapping | `/auto-parts/finder` (same as vehicle search) |
| Reports | No automobile-specific reports route; uses generic owner/procurement reports |
| Warranty Claims | `/auto-parts/warranty` — list, create, status workflow |
| Job cards | `/auto-parts/workshop` — list, create, detail, add lines, complete |
| Settings | Generic settings only |

---

## 5. Automobile Dashboard Redesign

### Implemented (`auto-parts-hub`)
- KPIs: today/monthly sales, inventory value estimate, pending POs, low stock, warranty open, core returns, open jobs.
- Quick actions: add part, counter billing, PO, vehicle/OEM search.
- Panels: top sellers (from recent orders), brand-wise catalog breakdown, low-stock queue, workshop/after-sales summary.

### Gaps
| Spec chart/KPI | Status |
|----------------|--------|
| Parts returned (sales returns) | Core returns only; not full sales-return KPI |
| Category-wise sales chart | Not implemented |
| Inventory aging chart | Not implemented |
| Purchase trend chart | Not implemented |
| Fast moving parts (procurement ADS) | Partial via procurement queue link only |

---

## 6. Product Master UI Enhancement

### Implemented (`product-form`)
- Tabs (automobile shops): General, Pricing, Inventory, Compatibility, Supplier, Warranty.
- General: part number, name, category, barcode, HSN, OEM, component, brand.
- Pricing/inventory/warranty fields in `autoPartDetail`.
- Supplier tab: existing procurement mappings (edit mode).
- Compatibility tab: add variant mapping (edit mode) via vehicle APIs.

### Gaps
| Feature | Status |
|---------|--------|
| Alternate part mapping UI | Missing |
| Barcode dedicated UX | Generic barcode field only |
| Images / attachments tab | Missing |
| Vehicle compatibility matrix (grid) | List only, no matrix editor |
| Minimize scrolling on non-auto shops | N/A |

---

## 7. Vehicle Compatibility UI

### Implemented
- `vehicle-parts-finder`: make → model → variant → year → category → compatible parts.
- `vehicle-master`: CRUD for makes, models, variants.
- APIs: `/vehicles/makes|models|variants`, `/auto-parts/compatible`, `/vehicles/compatibility`.

### Gaps
- Fuel type / year not separate master fields on variant (stored on variant entity).
- Performance testing with large datasets: **not run**.
- Registration search in counter billing: API exists; **limited UI** in order form.

---

## 8. Counter Billing UI Optimization

### Implemented (`order-form`)
- OEM/name/vehicle part search (`AutoPartSearchService`).
- Barcode scan with auto fallback message.
- Alternate suggestions when out of stock.
- Search results show OEM + brand; line meta shows OEM/brand when known.
- Uses `isAutomobileBusinessType` for all 7 business types.

### Gaps
| Feature | Status |
|---------|--------|
| Dedicated vehicle search on POS | Finder is separate route |
| Keyboard shortcuts (F2 search, etc.) | Not implemented |
| Stock/price in search result row | Stock on line grid only after add |
| Alternate numbers in catalog dropdown | Select still shows name only |

---

## 9. Supplier Catalog Integration

### Implemented
- Backend: `supplier_sku`, `moq`, `lead_time` on mapping; `SupplierCatalogItemDto`.
- `supplier-catalog-picker`: shows SKU, supplier part #, price, MOQ, lead time.
- `purchase-order-form`: applies MOQ/lead defaults from catalog item.

### Gaps
- MOQ display uses `moq` or falls back to `minOrderQty` — verify data populated on seed/import.

---

## 10. Mobile & Tablet Responsiveness

### Addressed in this pass
- Auto dashboard: responsive KPI grid, stacked quick actions.
- Vehicle master: single-column cards on small screens.
- Product form: scrollable tab strip (`overflow-auto`).
- Product list: existing responsive table + mobile cards (path-lab style only for test catalog).

### Remaining
- Full pass on PO, GRN, counter billing, login, registration on real devices — **recommended manual QA**.
- Sticky POS actions on mobile — not added.

---

## 11. Table Labels & Grid Improvements

### Implemented
- Product list: OEM, Brand, Stock columns for automobile shops.
- Product page API: `EntityGraph` loads `autoPartDetail`; search includes OEM/brand.
- Procurement/low-stock tables on dashboard.

### Gaps
- Purchase order list columns (delivery date, item count) — generic list unchanged.
- Invoice list vehicle column — not added.
- Compatibility column on product list — not added (would need aggregate query).

---

## 12. UI/UX Modernization

### Implemented
- Auto dashboard card layout, KPI styling (`auto-parts-hub.component.scss`).
- Tabbed spare part form.
- Automobile-focused navigation labels.

### Gaps
- Global typography/icon refresh not done.
- Counter billing still uses standard order form layout (not dedicated POS layout).

---

## 13. Summary Tables

### Features already implemented (verified)
1. Seven automobile business types + registration mapping  
2. Automobile capabilities, navigation, header tab  
3. DB schema: parts, vehicles, compatibility, workshop, warranty, core, supplier fields  
4. APIs: auto-parts search, alternatives, compatible parts, vehicle CRUD, automobile workshop/warranty/core  
5. Gateway routes for auto-parts, vehicles, automobile  
6. Product save with `autoPartDetail`  
7. Counter billing part search + alternates  
8. Supplier catalog picker with SKU/MOQ/lead  
9. Vehicle finder + vehicle master UI  
10. Automobile dashboard with KPIs and quick actions  
11. Tabbed product master (automobile)  
12. Product list OEM/brand/stock columns  
13. Label seeding and runtime fallbacks  

### Missing or incomplete (priority)
1. **Dedicated UI:** core returns management (warranty + job cards **done**)  
2. **Alternate part numbers** on product form  
3. **Automobile reports** (brand/category sales, aging, purchase trend)  
4. **OEM catalog** as distinct module  
5. **POS-optimized layout** and keyboard shortcuts  
6. **Vehicle owner** fields on invoice (vehicle reg link)  
7. **Images/attachments** on spare parts  
8. **Subtype-specific** menus (tyre shop vs distributor)  
9. **E2E / performance** validation  

### UI improvements applied (this audit pass)
- Expanded sidebar navigation groups  
- Dashboard redesign with KPIs and charts (tabular)  
- Vehicle master page  
- Product form tabs  
- Product list columns + search placeholder  
- Counter billing search/line OEM display  
- Supplier catalog picker SKU/MOQ lines  
- `isAutomobileBusinessType` on order form  

### Database changes (this pass)
- `ProductRepository`: `EntityGraph` for list; OEM/brand in search query  

### Mobile fixes (this pass)
- Dashboard and vehicle master responsive layouts; form tab strip scroll  

### Performance issues found
- Not load-tested; compatibility queries may need indexes on `part_vehicle_compatibility(product_id, variant_id)` — verify indexes in migration.  
- Page query with `EntityGraph` + `DISTINCT` — monitor for duplicate-row edge cases.  

### Industry comparison (brief)
| Capability | Typical DMS/ERP | SugamFlow status |
|------------|-----------------|------------------|
| OEM/supersession | Strong | Search + alternates API; weak UI |
| VIN/reg lookup | Strong | Registration API; thin POS integration |
| Workshop job card | Strong | API only |
| Warranty RMA | Medium | API only |
| Core exchange | Medium | API + dashboard count |
| Supplier EDI/catalog | Strong | Mapping + picker; no EDI |
| POS speed | Strong | Dedicated `/auto-parts/counter` POS with keyboard shortcuts |

### Recommendations — next phase
1. Build **warranty** and **job card** list/form screens wired to `AutomobileController`.  
2. Add **alternate numbers** editor on product form.  
3. Add **automobile reports** endpoint (top parts, brand sales, stock aging) in order/stock service.  
4. **POS mode** route: full-screen counter with keyboard shortcuts.  
5. Link **vehicle registration** to customer/order.  
6. Automated tests: registration → auto shop → create part → counter sale → PO receive.  
7. Run **mobile QA** checklist on top 8 screens.  

---

## File reference (primary)

| Area | Path |
|------|------|
| Business types | `shop-management-ui/src/app/constants/automobile-business.ts` |
| Navigation | `shop-management-ui/src/app/navigation/app-navigation.service.ts` |
| Dashboard | `shop-management-ui/src/app/components/auto-parts-hub/` |
| Vehicle master | `shop-management-ui/src/app/components/vehicle-master/` |
| Part finder | `shop-management-ui/src/app/components/vehicle-parts-finder/` |
| Product form/list | `shop-management-ui/src/app/components/product-form/`, `product-list/` |
| Counter billing | `shop-management-ui/src/app/components/order-form/` |
| Product APIs | `product-service/.../AutoPartController.java`, `VehicleController.java` |
| Stock/auto ops | `stock-service/.../AutomobileController.java` |
| Migrations | `V13__automobile_spare_parts.sql`, `V16__automobile_workshop_warranty.sql` |

---

*This report reflects repository state at audit time. Re-verify after deployment and seed data (`scripts/seed-auto-parts-demo.sql`).*
