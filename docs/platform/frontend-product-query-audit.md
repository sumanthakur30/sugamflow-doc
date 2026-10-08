# Frontend Product Query Audit (Phase 0)

Unpaged `ProductService.getProducts()` loads entire catalog into memory — avoid at scale (5K+ SKUs).

## Call Sites (Audited 2026-06-17)

| File | Usage | Risk | Recommended Replacement |
|------|-------|------|----------------------|
| `stock-form.component.ts` | `getProducts({ tenantWide: false })` | Medium | `getProductsPage(0, 50, '')` or product picker |
| `stock-list.component.ts` | `getProducts({ tenantWide: false })` | Medium | Join stock API with product name; paged lookup |
| `auto-parts-hub.component.ts` | `getProducts()` | Medium | Summary counts from dedicated hub API |
| `product-search-picker.component.ts` | `getProductsPage(0, 15, term)` | **OK** | Keep — typeahead pattern |
| `order-form.component.ts` | Product picker + barcode | **OK** | Uses paged search / barcode API |

## Preferred Patterns

1. **Billing / POS** — `ProductSearchPickerComponent` or `getProductByBarcode()`
2. **Lists** — `DataGridComponent` + `getProductsPage(page, size, search)`
3. **Dropdowns** — Never bind full catalog to `<select>`; use typeahead

## Phase 5 Action

Replace remaining unpaged call sites listed above. Track in roadmap Phase 5.7.
