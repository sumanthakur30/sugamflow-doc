# Automobile Spare Parts Module - End-to-End Business Flow & Tester Guide

**Audience:** QA team, implementation team, sales demo team, shop owner training  
**Primary demo shop:** `AUTO-DEMO-01`  
**Demo login:** Shop owner mode, username `demo`, password `Demo@2026`  
**Last updated:** June 2026

---

## 1. Purpose

This guide explains how an automobile spare-parts shop should use SugamFlow from master setup to daily sales, stock purchase, workshop usage, warranty claims, and returns.

Use this document for:

- Client demos
- Manual QA testing
- UAT sign-off
- New team onboarding
- Regression testing after auto-parts changes

---

## 2. Module Coverage

The automobile spare-parts flow covers these business areas:

- Parts catalog management
- OEM number, brand, manufacturer, rack/bin, GST, and warranty setup
- Vehicle make, model, variant, and registration master
- Part-to-vehicle compatibility mapping
- Vehicle-based part finder
- Counter billing and GST invoice
- Stock on hand, low-stock tracking, and stock adjustment
- Supplier master and purchase orders
- GRN / goods receiving and stock increase
- Workshop job cards
- Warranty claims
- Core return tracking
- Sales history and customer vehicle owner history

Known current limits:

- No automatic VIN decoder
- No TecDoc/OEM catalog feed
- No dedicated mobile app
- No advanced dealer CRM pipeline
- Inter-warehouse transfer is not implemented

---

## 3. Demo Environment

Primary shop:

- Shop ID: `AUTO-DEMO-01`
- Business type: `AUTO_PARTS`
- Tenant ID in seeded demo: usually `114`
- Login mode: Shop owner
- Username: `demo`
- Password: `Demo@2026`

Useful routes:

- Auto dashboard: `/auto-parts`
- Parts catalog: `/products`
- Add spare part: `/products/add`
- Vehicle master: `/auto-parts/vehicles`
- Vehicle parts finder: `/auto-parts/finder`
- Counter billing: `/auto-parts/counter`
- Stock list: `/stocks`
- Suppliers: `/stocks/suppliers`
- Purchase orders: `/stocks/purchase-orders`
- Direct GRN: `/stocks/direct-grn`
- Workshop job cards: `/auto-parts/workshop`
- Warranty claims: `/auto-parts/warranty`
- Core returns: `/auto-parts/core-returns`
- Sales invoices: `/orders`

Before testing, verify:

- UI opens at `http://localhost:4200`
- Login succeeds
- Header shows `AUTO-DEMO-01`
- Products list has auto columns like OEM number, Brand, Stock, Retail price
- `/auto-parts/finder` loads vehicle makes
- `/auto-parts/counter` opens full counter billing screen

---

## 4. User Roles and Permissions

Use shop owner for full testing. Staff roles may be tested separately.

Expected owner access:

- Manage products
- Manage stock
- Manage purchase orders
- Manage suppliers
- Manage counter billing
- View customers
- View workshop, warranty, and core return screens

Expected restricted staff behavior:

- Staff without product permission should not add/edit/delete spare parts
- Staff without order permission should not create counter bills
- Staff without procurement permission should not create purchase orders
- Staff without finance permission should not approve finance/AP actions

---

## 5. Business Master Data Flow

### 5.1 Vehicle Master Setup

Business meaning:

A spare-parts shop must know which part fits which vehicle. Vehicle master is the foundation for compatibility search.

Navigation:

`Auto Parts -> Vehicle master`

Test steps:

1. Open Vehicle master.
2. Add or verify vehicle make, for example `Maruti`, `Tata`, `Hyundai`.
3. Select a make and verify models, for example `Swift`, `Nexon`, `Creta`.
4. Select a model and verify variants, for example `VXI Petrol`, `XZ+ EV`, `SX Diesel`.
5. Confirm year range, engine type, and fuel type are shown where available.

Expected result:

- Make, model, and variant hierarchy is visible.
- Vehicle finder can use the same make/model/variant.
- No duplicate master rows should be created for same shop.

Negative tests:

- Try saving blank make/model name.
- Try duplicate make/model if UI allows entry.
- Try variant without selecting model.

Expected negative result:

- User gets validation or save is blocked.

---

### 5.2 Spare Part Product Master

Business meaning:

Every sellable part must be created in the catalog with part number, OEM number, price, GST, brand, and inventory settings.

Navigation:

`Parts catalog -> Add spare part`

Required fields to test:

- Part number / SKU
- Part name
- Category
- Selling price / retail price
- MRP
- GST percent
- HSN/SAC
- OEM number
- Brand
- Manufacturer
- Rack/bin/shelf location
- Reorder level
- Min/max stock
- Warranty applicable and warranty days
- Core charge applicable if returnable part

Happy path test:

1. Open Add spare part.
2. Enter a unique part number, for example `TEST-BRK-001`.
3. Enter part name, for example `Test Front Brake Pad`.
4. Select category, for example `Brake System`.
5. Add OEM number, for example `TEST-OEM-001`.
6. Add brand and manufacturer.
7. Enter price, MRP, GST, and HSN.
8. Enter rack/bin location.
9. Save.
10. Open product list and search by part number.

Expected result:

- Product is saved.
- Product appears in list.
- OEM, brand, stock, price, and category columns show correctly.
- Search by part number, name, OEM, and brand works.

Negative tests:

- Duplicate part number in same shop.
- Blank product name.
- Invalid price.
- Invalid GST percent.
- Delete product that has stock on hand.

Expected negative result:

- Duplicate/invalid data is rejected.
- Product with stock should not be deleted until stock is cleared.

---

### 5.3 Vehicle Compatibility Mapping

Business meaning:

Compatibility mapping connects a part to a vehicle variant. This lets staff find correct parts by make/model/year or registration.

Navigation:

`Products -> Edit product -> Compatibility`

Happy path test:

1. Open an existing spare part.
2. Go to Compatibility tab.
3. Select make, model, and variant.
4. Add compatibility row.
5. Save or confirm row is added.
6. Open Vehicle parts finder.
7. Select same make/model/variant and category.
8. Click Show parts.

Expected result:

- The mapped part appears in compatible parts list.
- Duplicate compatibility row should not be added twice.

Recommended demo examples:

- `Maruti -> Swift -> VXI Petrol -> Filters`
- `Maruti -> Swift -> VXI Petrol -> Brake pads`
- Quick search `OEM-002`

---

## 6. Search and Finder Flow

### 6.1 Quick Search by OEM Number

Navigation:

`Spare parts -> Search OEM part` or `/auto-parts/finder`

Test steps:

1. Enter `OEM-002` in quick search.
2. Click Search.

Expected result:

- Matching part appears, for example `Oil Filter Premium`.
- Match type should show OEM or identifier match.
- No unexpected error toast should appear.

Negative test:

1. Enter a random value like `INVALID-OEM-999`.
2. Click Search.

Expected result:

- No results or empty list.
- No backend error.
- No generic unexpected error toast.

---

### 6.2 Search by Vehicle

Test steps:

1. Open Vehicle parts finder.
2. Select Make: `Maruti`.
3. Select Model: `Swift`.
4. Select Variant: `VXI Petrol`.
5. Select Category: `Filters`.
6. Enter Year: `2019`.
7. Click Show parts.

Expected result:

- Compatible filter parts appear.
- Part number, name, category, and price are shown.

Repeat with:

- Category `Brake pads`
- Category `Belts / engine parts`
- Category `Bearings / suspension`

Expected result:

- Each category returns only matching compatible parts.

---

### 6.3 Search by Registration Number

Business meaning:

Counter staff can enter vehicle registration and get correct compatible parts without asking customer for make/model manually.

Test steps:

1. Open Vehicle parts finder.
2. Enter a seeded registration number if available.
3. Click Search.

Expected result:

- Parts mapped to that vehicle are listed.
- Result should not show lazy proxy, JSON, or unexpected error message.

If no registration exists:

- Add a vehicle registration in vehicle master/customer vehicle flow.
- Link it to make/model/variant.
- Search again.

---

## 7. Parts Catalog List Flow

Navigation:

`Parts catalog -> Spare parts catalog`

Tester checks:

1. Open parts catalog.
2. Verify columns:
   - ID
   - Part number
   - Part name
   - OEM number
   - Brand
   - Stock
   - Retail price
   - Spare category
   - Actions
3. Search by part name.
4. Search by part number.
5. Search by OEM number.
6. Search by brand.
7. Filter by category.
8. Filter by stock status.
9. Sort by ID, part number, part name, OEM, brand, stock, retail price, and category.
10. Change page size.
11. Clear filters.

Expected result:

- Search and filters update rows correctly.
- Sort indicator changes direction.
- Page size changes visible rows.
- Clear removes active filters.
- Edit opens product form.
- Delete asks confirmation.

---

## 8. Stock Management Flow

Business meaning:

Stock controls whether the shop can sell a part and whether low-stock alerts should trigger purchase.

Navigation:

`Parts stock -> Stock`

Happy path test:

1. Open Stock list.
2. Search for a part.
3. Verify quantity, reserved, and available quantity.
4. Add stock for a product.
5. Refresh product catalog.
6. Verify Stock column changed.

Expected result:

- Stock row updates.
- Available quantity is quantity minus reserved quantity.
- Low stock badge appears when quantity is below threshold.

Negative tests:

- Try negative stock.
- Try stock for invalid product.
- Try sale quantity greater than available stock.

Expected negative result:

- Invalid stock is rejected.
- Oversell should be blocked or warned where stock check is active.

---

## 9. Counter Billing Flow

Business meaning:

This is the daily shop counter sale process.

Navigation:

`Counter sales -> Counter billing`

Happy path test:

1. Open Counter billing.
2. Search part by name, code, OEM, or barcode.
3. Add product to bill.
4. Set quantity.
5. Select or create customer/vehicle owner if needed.
6. Verify GST and total.
7. Select payment method:
   - Cash
   - UPI
   - Card
   - Credit / Pay Later
8. Save invoice.
9. Open Orders / invoices.
10. Verify invoice exists.
11. Print or preview bill if available.
12. Open Stock and verify quantity reduced.

Expected result:

- Invoice created.
- Sale total is correct.
- GST summary is correct.
- Stock is reduced.
- Customer history shows order.

Negative tests:

- Save bill without items.
- Enter zero/negative quantity.
- Enter quantity greater than stock.
- Remove all lines and save.

Expected negative result:

- User cannot save invalid bill.

---

## 10. Procurement Flow

Business meaning:

When stock is low, shop purchases parts from suppliers through PO and GRN.

Navigation:

`Parts procurement -> Suppliers`  
`Parts procurement -> Purchase orders`

### 10.1 Supplier Master

Test steps:

1. Open Suppliers.
2. Add supplier.
3. Enter supplier name, code, phone, GSTIN if available.
4. Save.
5. Edit supplier.
6. Add product catalog mapping if UI section is available:
   - Product
   - Supplier part number
   - MOQ
   - Lead time
   - Last purchase price

Expected result:

- Supplier saved.
- Supplier appears in purchase order supplier dropdown.
- Mapped products appear in supplier catalog.

### 10.2 Purchase Order

Test steps:

1. Open Purchase orders.
2. Click New purchase order.
3. Select supplier.
4. Add product line.
5. Enter quantity, unit price, discount, GST if applicable.
6. Save as draft.
7. Submit/approve/send depending on configured status flow.

Expected result:

- PO number is generated.
- PO status updates correctly.
- PO detail shows line totals.

### 10.3 Receive Goods / GRN

Test steps:

1. Open an approved/sent PO.
2. Click Receive.
3. Enter received quantity.
4. Enter batch, cost, and remarks if available.
5. Submit GRN.
6. Open Stock list.
7. Verify stock increased.

Expected result:

- GRN created.
- PO status changes to partially/fully received.
- Stock quantity increases.
- Procurement audit is visible where implemented.

Negative tests:

- Receive more than ordered if not allowed.
- Receive zero quantity.
- Submit receive without line.

Expected negative result:

- Invalid receive is blocked.

---

## 11. Direct GRN Flow

Business meaning:

Direct GRN is used when goods arrive without a formal PO.

Navigation:

`Parts stock -> Direct GRN`

Test steps:

1. Open Direct GRN.
2. Select supplier.
3. Add part line.
4. Enter received quantity and cost.
5. Submit.
6. Verify stock increased.

Expected result:

- GRN is created.
- Stock is increased.
- No purchase order is required.

---

## 12. Workshop Job Card Flow

Business meaning:

Workshop job cards are used by garages/service centers to reserve and consume parts during repair work.

Navigation:

`Auto parts -> Job cards`

Happy path test:

1. Open Job cards.
2. Create new job card.
3. Enter customer/vehicle registration.
4. Enter make, model, variant, year, engine type.
5. Save job card.
6. Add part line.
7. Add labour/service line if supported.
8. Reserve required parts.
9. Mark consumed or close job card.
10. Verify stock changed.

Expected result:

- Job card number is generated.
- Job status is updated.
- Parts reservation affects available quantity.
- Closing job consumes parts.

Negative tests:

- Add part line without product.
- Consume more than reserved/available.
- Close job card without required data.

Expected negative result:

- Invalid action is blocked or error shown.

---

## 13. Warranty Claim Flow

Business meaning:

Warranty flow tracks customer complaints for parts sold with warranty.

Navigation:

`Auto parts -> Warranty claims`

Test steps:

1. Open Warranty claims.
2. Create claim.
3. Select product.
4. Add invoice number/order reference if available.
5. Enter defect description.
6. Save claim.
7. Move through status flow:
   - Draft
   - Submitted
   - Approved / Rejected
   - Closed

Expected result:

- Claim number is generated.
- Status changes are saved.
- Claim remains linked to product/customer reference.

Negative tests:

- Claim without product.
- Claim with invalid quantity.
- Claim for non-warranty product if validation exists.

Expected negative result:

- Invalid claim is blocked.

---

## 14. Core Return Flow

Business meaning:

Some parts have returnable old cores, for example alternator, compressor, starter motor. Shop may collect a deposit until the old part is returned.

Navigation:

`Auto parts -> Core returns`

Test steps:

1. Open Core returns.
2. Create core record.
3. Select product and customer/order/job card reference.
4. Enter core type and core charge.
5. Save as issued.
6. Mark returned when customer returns old part.

Expected result:

- Core number is generated.
- Status changes from issued to returned.
- Core charge remains visible.

Negative tests:

- Create core without product.
- Mark return without issued record.

Expected negative result:

- Invalid core action is blocked.

---

## 15. End-to-End Test Scenario

Use this scenario for full UAT.

Scenario: Customer comes for Swift brake pad and oil filter.

1. Login to `AUTO-DEMO-01`.
2. Open Vehicle master and verify `Maruti -> Swift -> VXI Petrol`.
3. Open Parts catalog and verify `Oil Filter Premium` has OEM `OEM-002`.
4. Open Vehicle parts finder.
5. Search by `OEM-002`.
6. Confirm part result appears.
7. Search by vehicle:
   - Make `Maruti`
   - Model `Swift`
   - Variant `VXI Petrol`
   - Category `Filters`
8. Confirm filter parts appear.
9. Change category to `Brake pads`.
10. Confirm brake pad appears.
11. Open Counter billing.
12. Search and add oil filter.
13. Search and add brake pad.
14. Add customer/vehicle owner.
15. Complete sale with cash/UPI.
16. Verify invoice in Orders.
17. Verify stock reduced.
18. If low stock, create purchase order for same part.
19. Receive PO and verify stock increased.
20. Create warranty claim for sold part if needed.

Pass criteria:

- User can complete search, sale, stock reduction, purchase replenishment, and warranty tracking without error.

---

## 16. Regression Checklist

Run this after any auto-parts change.

Product and catalog:

- Product list loads
- Auto columns visible for auto shop
- Search works by part number
- Search works by OEM
- Search works by brand
- Category filter works
- Stock filter works
- Sorting works
- Add product works
- Edit product works
- Delete protection works when stock exists

Vehicle and finder:

- Vehicle makes load
- Models load after make selection
- Variants load after model selection
- OEM search returns result
- Invalid OEM returns no result without error
- Vehicle compatibility search returns correct category
- Registration lookup returns parts where registration exists

Counter billing:

- Product search works
- Barcode/OEM search works where data exists
- Add line works
- Quantity update recalculates total
- GST total is correct
- Save invoice works
- Invoice appears in order list
- Stock reduces after sale

Procurement:

- Supplier list loads
- Add supplier works
- Supplier product mapping works where UI exists
- Create PO works
- Approve/send PO works where enabled
- Receive PO works
- Stock increases after receive
- Direct GRN works
- Supplier claims and returns screens load

Workshop:

- Job card list loads
- New job card saves
- Add part line works
- Reserve/consume stock works
- Close job card works

Warranty and core:

- Warranty claims list loads
- New claim saves
- Status update works
- Core return list loads
- New core return saves
- Mark returned works

Permissions:

- Owner has full access
- Staff without product permission cannot add/edit products
- Staff without order permission cannot bill
- Staff without procurement permission cannot create PO

---

## 17. Common Issues and Fix Checks

Issue: Vehicle finder shows empty make dropdown.

Check:

- Confirm shop header shows `AUTO-DEMO-01`.
- Confirm tenant/shop context is correct.
- Call `/api/v1/vehicles/makes` through gateway.
- Restart product-service if backend was recently rebuilt.

Issue: Quick search shows unexpected error.

Check:

- Product-service logs for `/auto-parts/search`.
- Look for lazy proxy errors such as `Could not initialize proxy`.
- Confirm search endpoint returns JSON for `OEM-002`.

Issue: Vehicle search returns no parts.

Check:

- Selected category value must match product category/fitment hint.
- Product must have compatibility row for selected variant.
- Year must be within variant year range.
- Engine/fuel type must match or be blank.

Issue: Product appears in catalog but not in counter.

Check:

- Product belongs to active shop.
- Product status is `ACTIVE`.
- Product has valid price.
- Product is returned by billing product search.

Issue: Counter sale fails due to stock.

Check:

- Stock row exists for product.
- Available quantity is greater than sale quantity.
- Active branch/shop context matches stock row.

Issue: PO receive does not increase stock.

Check:

- GRN submitted successfully.
- Product ID in PO line matches product catalog.
- Stock-service is running.
- Stock list is refreshed after receive.

Issue: Source route 404 through UI.

Check:

- Gateway has latest auto-parts routes.
- Restart gateway-service if route config changed.
- Direct service port works but gateway fails means gateway route issue.

---

## 18. Tester Evidence to Capture

For every failed test, capture:

- Shop ID and username
- Screen route
- Exact input values
- Screenshot
- Browser console error if any
- Network request URL and status
- Backend service log request ID if shown
- Expected result
- Actual result

Recommended bug title format:

`[AUTO_PARTS] <Screen> - <Action> fails when <condition>`

Example:

`[AUTO_PARTS] Vehicle finder - OEM search fails for OEM-002`

---

## 19. Demo Script for Client

Use this short script for a client meeting:

1. Open Auto Parts dashboard.
2. Show product catalog with OEM, brand, stock, and price.
3. Search `OEM-002`.
4. Open vehicle finder.
5. Select `Maruti -> Swift -> VXI Petrol -> Filters`.
6. Show compatible parts.
7. Open counter billing.
8. Add the part to invoice.
9. Show GST and total.
10. Save invoice.
11. Show sales history.
12. Show stock reduced.
13. Show purchase order flow for replenishment.
14. Show warranty/core return screens as after-sales service.

Client explanation:

SugamFlow manages the complete spare-parts lifecycle: part master, vehicle fitment, counter sale, stock, purchase, workshop usage, warranty, and return tracking in one system.

---

## 20. Sign-Off Criteria

The module is ready for demo/UAT when:

- Login and shop context are correct
- Product catalog loads without error
- Finder works by OEM and vehicle
- Counter billing creates invoice
- Stock changes after sale and purchase receive
- Procurement flow creates and receives PO
- Workshop job card flow works for service shops
- Warranty and core return screens save records
- No generic unexpected error appears in normal flows
- QA has screenshots for all pass/fail scenarios

