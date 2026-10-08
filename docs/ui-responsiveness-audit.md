# UI Responsiveness Audit — Rapid Click Protection

Date: 2026-06-18

## Root causes

1. **No single-flight guards on save/print/PDF actions** — repeated clicks started parallel HTTP calls and main-thread PDF work (`jspdf` + `html2canvas`).
2. **Overlapping list reloads** — `forkJoin(...).subscribe()` in product/order lists without `exhaustMap`; focus/visibility auto-refresh stacked fetches.
3. **Duplicate concurrent GET requests** — identical catalog/stock requests fired together from multiple components.
4. **Heavy template method calls in large grids** — order list and product list recompute per-row helpers on every change detection (partially mitigated by existing OnPush + prior product-list work).
5. **PDF generation on main thread** — multiple client-side PDF jobs queued without serialization.

## Systemic fixes (new infrastructure)

| File | Purpose |
|------|---------|
| `shared/async-action/async-action-runner.service.ts` | Per-key busy flags + `run()` wrapper (exhaust overlapping actions) |
| `shared/async-action/list-reload.util.ts` | `bindListReload()` — `Subject` + `exhaustMap` for list pages |
| `shared/async-action/pdf-action-queue.service.ts` | Serializes client-side PDF generation |
| `shared/async-action/performance-diagnostics.service.ts` | Dev-mode logging: duplicate actions, slow APIs, long tasks |
| `shared/async-action/action-guard.directive.ts` | Blocks click propagation while `[appActionGuard]="busy"` |
| `interceptors/in-flight-request.interceptor.ts` | Coalesces identical concurrent GETs; logs slow requests |

Registered in `app.module.ts` (interceptor) and `shared.module.ts` (directive).

## Components updated

| Component | Fixes |
|-----------|-------|
| `order-form` | Early `isSubmitting` return; `AsyncActionRunner.run()` for create/update/offline save |
| `order-list` | `bindListReload` for paging; print/thermal single-flight; auto-refresh skips in-flight load |
| `product-list` | `bindListReload`; delete single-flight; mobile `trackBy`; auto-refresh guard |
| `product-form` | Early submit guard; `AsyncActionRunner.run('product-save')` |
| `pharmacy-dispense` | `isSubmitting`, modal open guard, PDF queue, disabled Save button |
| `doctor-dashboard` | Board refresh `exhaustMap`; consultation/visit/PDF guards; Rx save sets busy before consultation create |
| `prescription-view-modal` | Ignores print/PDF clicks while downloading |

## Before vs after (expected)

| Scenario | Before | After |
|----------|--------|-------|
| 20× Save on billing form | Multiple POSTs, UI freeze | One request; button disabled |
| 20× Refresh on product list | Stacked `forkJoin` (products+stocks+batches) | One in-flight reload |
| 20× Print order | Multiple popups + API storms | One print flow |
| 20× PDF download | Parallel html2canvas jobs | Serialized queue |
| 20× identical GET (catalog) | N parallel requests | Coalesced to 1 |

## Remaining follow-ups (not in this pass)

- Cache order-list row helpers (`getCustomerName`, `getDueAmount`) into maps on load
- Order-form line total getters → precomputed arrays per line index
- `ChangeDetectionStrategy.OnPush` for `pharmacy-dispense`, `product-form`
- Path-lab PDF/release actions (same `AsyncActionRunner` pattern)
- Purchase-order form submit guard (same pattern as product-form)

## Verification

1. Open DevTools → Console (dev build) — watch `[perf] duplicate action blocked` when spam-clicking Save.
2. Network tab — spam Refresh on Products: only one products/stocks batch at a time.
3. Billing → spam Save: single POST, form stays disabled until complete.
4. Pharmacy → spam PDF: one download at a time.

Run unit test: `npm test -- --include=**/async-action-runner.service.spec.ts`
