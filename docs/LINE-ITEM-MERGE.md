# Line Item Merge — Duplicate Product Consolidation

**Status:** Implemented (June 2026)

## Problem

Adding the same product twice (search, dropdown, barcode) created duplicate rows instead of increasing quantity.

## Solution

Shared utility `shop-management-ui/src/app/shared/transaction-line-items.util.ts`:

- `findCartLineIndexByProductId` — cart add / scan (merge by product, respect batch & gift-wrap)
- `mergeSalesOrderItems` — sales orders on load & before save
- `mergePurchaseOrderLines` — purchase orders
- `dedupeLabLines` — pathology test booking

## Before → After

| Action | Before | After |
|--------|--------|-------|
| Scan Printed Kurti twice | 2 rows × Qty 1 | 1 row × Qty 2 |
| Pick same product on new line | Duplicate row | Qty +1 on existing row |
| Open order ORD-000192 (had dupes) | 2× Printed Kurti | Merged on edit load |
| PO same product twice | 2 lines | 1 line, qty summed |
| Path lab same test twice | 2 rows | 1 row |

## Modules updated

| Module | File | Behavior |
|--------|------|----------|
| POS / Sales / Restaurant / Auto counter | `order-form.component.ts` | Merge on scan, dropdown, load, save |
| Pharmacy Rx compose | `pharmacy-dispense.component.ts` | Merge duplicate medicines |
| Doctor Rx pad | `doctor-dashboard.component.ts` | Quick-add increments qty |
| Path lab booking | `path-lab-booking.component.ts` | Dedupe tests |
| Purchase orders | `purchase-order-form.component.ts` | Merge on select, load, save |

## Separate rows when

- Different batch number / batch id
- Different gift-wrap flag
- Different unit price / unit cost / GST% / discount% (PO)

## Not yet merged (server-side)

- Workshop job card parts (`addJobCardLine` API)
- Existing saved orders in **read-only** order list view (merged when opening for edit)

## Tests

`shop-management-ui/src/app/shared/transaction-line-items.util.spec.ts`
