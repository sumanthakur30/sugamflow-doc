# Plan: Billing / POS — barcode scan + faster line-item capture

**Goal:** Counter staff can scan (or paste) a barcode to add/update a line instantly, without scrolling long product dropdowns.

### Executive summary

| Milestone | Outcome |
|-----------|---------|
| **M1 — Lookup API** | `GET /products/lookup/barcode` (or equivalent) resolves product by `barcode` for active tenant + shop; optional unique index on `(tenant_id, shop_id, barcode)`. |
| **M2 — Scan UX** | Order form has a scan field + Enter adds line or merges qty on same SKU; audible/visual feedback on miss. |
| **M3 — Fast pick** | Typeahead replaces “load entire catalog”; optional deprecate heavy `getProducts()` on mount. |
| **M4 — Harden** | Tests, docs for scanner HID + Enter; performance index if needed. |

**Repos:** `product-service` (API + Flyway); `shop-management-ui` (`order-form`); gateway unchanged unless path pattern conflicts (none expected).

### Milestone checklist

- [ ] **A** Backend barcode lookup + tests
- [ ] **A′** *(recommended)* Flyway unique partial index where `barcode IS NOT NULL` + product create/update validation
- [ ] **B** Scan input + merge rules + stock messaging aligned with existing order form
- [ ] **C** Typeahead + lazy catalog loading
- [ ] **D** E2E / manual POS smoke doc

**Current state (repo check):**

| Area | Finding |
|------|---------|
| **Product model** | `barcode` field exists (`product-service` `Product.barcode`, UI product form captures it). |
| **Search API** | `ProductRepository.searchByTenantAndShop` matches **code, name, category, productType** — **does not match `barcode`**. |
| **Order form UI** | Each line uses `getProducts()` → full list in `<select>`. Poor for scale; no barcode field or Enter-to-add flow. |
| **Gateway** | `/api/v1/products/**` already routes to `product-service` — new endpoints under `/products/...` are fine. |

---

## Phase A — Backend: resolve product by barcode (required)

**A1.** Add repository method (scoped to tenant + shop like other reads):

- `Optional<Product> findByTenantIdAndShopIdAndBarcode(Long tenantId, String shopId, String barcode)`

**A2.** Behaviour:

- **Trim** input; optionally **normalize** (e.g. strip leading zeros) behind a flag only if retailers need it later.
- If **duplicate barcodes** exist for same shop (no DB unique constraint today), define policy: return **first** match + log warning, or return **409** with message — recommend **unique (tenant_id, shop_id, barcode)** when not null (DB migration + validation on create/update) for production POS.

**A3.** New controller endpoint (must not clash with `GET /products/{id:\\d+}`):

- e.g. `GET /products/lookup/barcode?value={barcode}`  
  or `GET /products/by-barcode/{barcode}` (URL-encode path).

**A4.** Use existing tenant/shop resolution from headers (same as list APIs). Return **404** when not found (UI shows “Unknown barcode”).

**A5.** Optional (same release or follow-up): extend `searchByTenantAndShop` JPQL to include  
`LOWER(COALESCE(p.barcode, '')) LIKE ...` so generic product search also finds by barcode substring.

**Tests:** repository + controller integration test with tenant/shop context.

---

## Phase B — Angular: scan box + add/merge line (core POS UX)

**B1.** **Dedicated “Scan / barcode” input** at top of **Line items** (always visible on Add Order; optional on Edit).

- `type="text"`, `inputmode="none"` or default, **autocomplete="off"**, **spellcheck="false"**.
- **Autofocus** when opening Add Order (and after each successful add, re-focus for next scan).
- Hardware scanners usually send digits + **Enter** — on `(keydown.enter)` / form submit: prevent default, call lookup, clear input.

**B2.** **Client API:** `ProductService.getProductByBarcode(barcode: string): Observable<Product>` → new gateway URL.

**B3.** **Add/merge logic** after product loads:

- If **last line** is same `productId` and quantity is “fresh” (optional: same session rule) → **increment quantity** by 1 (typical retail behaviour).
- Else **append** a new row (reuse `createItemGroup()` + `onProductSelected` pricing/MRP logic).
- If **stock** is tracked: respect existing `getLineItemAvailableStockDisplay` / warnings; optionally block over-sell or show confirm (match current product policy).

**B4.** **Feedback:** toast or inline message — “Added {name}”, “Unknown barcode”, “Inactive product” if you filter by status.

**B5.** **Keyboard:** ensure scan input is not inside a `<form>` that submits whole order on Enter (use `(keydown.enter).preventDefault()` on scan field only).

---

## Phase C — Faster line-item capture (reduces dependency on dropdown)

**C1.** **Async product picker** (replace or supplement per-line `<select>`):

- Typeahead on **name/code/barcode** using existing `getProductsPage(0, 20, search)` once **Phase A** adds barcode to search **or** use dedicated lookup endpoint.
- Show top matches; **Enter** selects first hit (for power users).

**C2.** **Stop loading full catalog** on init when catalog is large:

- Lazy-load: only load products for dropdown when row opened, or rely on typeahead + scan (preferred for POS).
- Keep a **small cache** of recently picked products in memory for the session.

**C3.** **Optional “POS mode” route** e.g. `/orders/pos` — minimal chrome, large tap targets, customer optional last (configurable) — can be a later iteration.

---

## Phase D — Quality & ops

- **E2E:** Playwright/Cypress: type barcode → line appears; duplicate scan increments qty.
- **Docs:** Short user note: barcode must be set on product; scanner must send Enter (HID mode).
- **Performance:** index on `(tenant_id, shop_id, barcode)` if not already implied by unique constraint.

---

## Suggested order of work

1. **A** (backend lookup + optional unique constraint + search includes barcode).  
2. **B** (scan field + merge behaviour + focus).  
3. **C1–C2** (typeahead + avoid full `getProducts()` load).  
4. **D** tests and polish.

---

## Out of scope (unless you expand the ticket)

- Native mobile app / Bluetooth scanner SDK (USB HID works in browser today).  
- Offline POS (service worker / local queue).  
- Weigh scale integration.

---

## Effort (rough)

| Phase | Estimate (devdays) |
|-------|---------------------|
| A | 0.5–1 |
| B | 1–2 |
| C1–C2 | 1–2 |
| D | 0.5 |

*Depends on DB migration for unique barcode and how far you refactor the line-item UI.*
