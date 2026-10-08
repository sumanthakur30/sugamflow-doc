# SugamFlow Accounting & GST — gap vs Indian ERP (Marg-class)

**Date:** 2026-08-16  
**Rule:** Do **not** create a second GL or a new `finance-service`. `account-service` is **staff identity**, not books. `payment-service` is **platform subscriptions**, not shop cash.

**Financial spine (already live):**

| Layer | Service | Role |
|-------|---------|------|
| GL | **ledger-service** `:8094` | CoA, double-entry vouchers, TB, P&L, BS, cash/bank book, period lock, bank recon ticks, expenses/other income |
| Tax | **gst-service** | India GST engine, GSTIN, HSN/SAC, snapshots, GSTR-1/3B **prep**, thin 2B recon, e-invoice **adapter** (no fake IRN) |
| Revenue / AR | **order-service** | Invoices, POS/clinic bills, party AR, collections, credit control |
| Cost / AP | **stock-service** | GRN, AP, COGS quote, write-off → GL hooks |
| UI | **shop-management-ui** `/finance/*` + `/stocks/gstr-*` + `/compliance/einvoice` | Gated by `FINANCE_LITE` |

---

## A. Gap matrix

| Area | Existing SugamFlow | Required (Marg-class) | Gap | Priority | Implementation |
|------|--------------------|------------------------|-----|----------|----------------|
| Chart of accounts | `ledger_accounts` types ASSET/LIABILITY/INCOME/EXPENSE/EQUITY; parent_id; seed Cash/Bank/Debtors/Stock/Creditors/GST/TDS/Capital/Sales/COGS | Hierarchical groups + GST/TDS/cash/bank | **Partial** — seed is flat codes, not named groups | P1 | Use parent_id groups; do not fork CoA |
| Double-entry engine | Vouchers + balanced lines; auto-post wholesale SI/SR/collection/GRN/AP/write-off | Every financial event | **P0: retail POS / paid `orders` not posted** (wholesale only) | **P0** | `POS_SALE` voucher (this change) |
| Healthcare revenue | `revenue_ledger_entries` KPI ledger | Same trade P&L | Parallel books | P1 | Optional bridge later; POS/OPD/LAB/PHARM bills now post as `POS_SALE` |
| Voucher types | JOURNAL/SALES/PAYMENT/RECEIPT + source_type | FY+branch+type numbering, attachments, approve | Numbering is source-id based; no FY master | P1 | Period lock exists; FY table later |
| AR | Party ledger, ageing, collection desk, credit limit | Ageing buckets + allocation | **Exists** | — | Reuse `/finance/ar-ageing` |
| AP | Stock AP invoices/payments, AP ageing | Same | **Exists** | — | Reuse `/finance/ap-ageing` |
| Cash & bank | Cash book, bank book, line `reconciled` flag | CSV bank import + match | **Done** — CSV import + match on existing ticks | P1 | CSV import on existing recon |
| Expenses | Expense category + entry → GL (V4) | GST on expense, approval | **Partial** — opex exists; GST on expense thin | P1 | Extend expense GST via gst-service |
| GST engine | Central `gst-service` + order client | One engine all channels | **Exists** — keep using it | P0 keep | Do not duplicate in POS/lab |
| GSTIN / HSN | Registration, validator, HSN master | Historical rates | **Exists** (slabs + effective dates) | — | |
| GSTR-1 / 3B | `/compliance/gstr-summary` + filing pack JSON | Portal upload | **Prep exists; no GSTN upload** | P2 | Adapter only — never fake GSTN |
| GSTR-2B recon | Thin recon + UI `/stocks/gst-recon` | Full match statuses | **Partial → Excel/CSV import** | P1 | Deepen import matcher |
| Credit/debit notes | Sales return CN + GST post | Purchase DN | **Done** — purchase return ship posts `PURCHASE_DEBIT_NOTE` | P1 | |
| E-invoice / e-way | `/compliance/einvoice` adapter | IRN/QR live | **Architecture only — do not fake IRN** | P2 | Config + retry log |
| Financial year | `shop_period_locks` | Named FY 2026–27 + opening transfer | **Partial** | P1 | Named FY on lock |
| Reports | TB, P&L, BS, cash book, registers in UI | Excel/PDF | **Exists** for core; GST export exists | P1 | More registers |
| Multi-branch GL | `shop_id` isolation | `branch_id` + consolidate | **Done** — nullable `branch_id` on vouchers; TB/P&L/BS filter or consolidated default | P1 | Copy source branch; never invent |
| Retail COGS | Wholesale COGS from batch; POS no GL | Weighted avg / FIFO | **POS COGS added** (WAC / batch purchase price) | P1 | After POS sales post |
| Subscription | payment-service | Shop P&L | **Out of scope** (platform rule) | — | Do not mix |

---

## B. Architecture (no new giant service)

```
POS / OPD / LAB / Pharmacy bill (order-service)
        ↓  (if PAID / credit, ledger.integration.enabled)
ledger-service  POS_SALE voucher  Dr Cash|Bank|Debtors  Cr Sales  Cr GST split
        ↓  (later collection of UNPAID/PARTIAL)
ledger-service  POS_COLLECTION receipt  Dr Cash|Bank  Cr Debtors  (no GST)
        ↓
Trial Balance → P&L → Balance Sheet

GST: order/stock → gst-service snapshot → GSTR prep reports
```

---

## C. This delivery (P0)

Retail and department **paid/credit orders** now post an idempotent GL voucher (`source_type=POS_SALE`, `source_id=order.id`) so shop P&L is not wholesale-only.

| Channel | Debit | Credit |
|---------|-------|--------|
| PAID cash | Cash 1000 | Sales 4000 + GST 2100 |
| PAID UPI/card | Bank 1010 | Sales 4000 + GST 2100 |
| UNPAID / credit | Debtors 1100 | Sales 4000 + GST 2100 |
| PARTIAL | Cash/Bank (paid) + Debtors (rest) | Sales 4000 + GST 2100 |

Enable with existing `LEDGER_INTEGRATION_ENABLED=true` (same flag as wholesale). Checkout never fails if ledger is down.

**API:** `POST /api/v1/ledger/vouchers/from-pos-sale`  
**Later collection:** `POST /api/v1/ledger/vouchers/from-pos-collection` (`source_type=POS_COLLECTION`, `source_id=payment.id`)  
**Branches:** `ledger-service` + `order-service` `feature/pos-gl-post` (order worktree: `D:\sugamFlow\order-service-pos-gl`).

### Tests executed

| Test | Result |
|------|--------|
| `PosSalePostingMathTest` (cash / bank / unpaid / partial / rounding) | Pass |
| `CollectionReceiptPostingMathTest` (cash / UPI / card / partial) | Pass |
| `CollectionReceiptVoucherServiceTest` (idempotent second call) | Pass |
| `VoucherServiceTest` (debit = credit) | Pass |
| `OrderServicePermissionTest` | Pass |
| `PosCollectionDecisionTest` (UNPAID/PARTIAL vs PENDING) | Pass |

Posted vouchers are not rewritten (audit rule). Updating UNPAID → PAID later posts a new `POS_COLLECTION` receipt (Dr Cash/Bank, Cr Debtors) — not a rewrite of `POS_SALE`.

## D. Explicitly not in this change

GSTN live filing, fake IRN, copying Marg UI, new finance-service, school fee GL, destructive prod data, POS WIP stash, hematology branch mix-in.

## E. Remaining P1 (all done — uncommitted / not deployed)

1. ~~Named financial year (2026–27) + opening-balance transfer~~ **Done** — `shop_fiscal_years` V6, close posts P&L to 3100, next year auto-created, posting blocked into CLOSED years.
2. ~~Split GST posting: Output CGST/SGST/IGST ledgers instead of single 2100.~~ **Done** — CoA 2110/2120/2130 + 2210/2220/2230; sales/POS/credit-note post the document split (no invented 50/50). Purchase ITC posts on AP approve (not GRN).
3. ~~GSTR-2B Excel/CSV import + match statuses on existing recon.~~ **Done** — stock-service `feature/gstr-2b-import` (V43 batches/lines/resolutions) + shop-ui worktree `shop-management-ui-2b`. File import only (xlsx/xls/csv/json); never a live GSTN fetch. Statuses: MATCHED / PARTIAL / AMOUNT_MISMATCH / GST_MISMATCH / GSTIN_MISMATCH / PORTAL_ONLY / BOOKS_ONLY + Accept/Ignore.
4. ~~POS COGS (weighted average) after understanding stock valuation.~~ **Done** — stock valued at batch `purchasePrice` (GRN landed). POS quotes batch cost when `batchId` is present, else qty-weighted average of active batches (`/inventory/cogs-quote`). Dr 5300 / Cr 1200 on the existing `POS_SALE` voucher. No MRP. Best-effort; checkout never blocked.
5. ~~Nullable `branch_id` on vouchers + consolidated TB.~~ **Done** — Flyway V7 nullable `ledger_vouchers.branch_id` (null = shop-level). Posting copies source `branchId` when present (POS/SI/SR/collection/GRN/AP/expenses/journals). YEAR_END stays shop-level. TB / P&L / BS accept optional `branchId`; omit = consolidated (all branches + null). UI dropdown on GL + final accounts (`shop-management-ui-branch-gl`).
6. ~~Receipt voucher when a credit POS bill is later collected.~~ **Done** — `POST /api/v1/ledger/vouchers/from-pos-collection` (`source_type=POS_COLLECTION`, `source_id=payment.id`). Reuses wholesale collection engine (Dr Cash 1000 / Bank 1010, Cr Debtors 1100, no GST). Order-service posts best-effort on later collection of UNPAID/PARTIAL POS/OPD/LAB/PHARM (and IPD AR) bills. Multiple partials → multiple receipts.
7. ~~Bank statement CSV import on existing recon ticks.~~ **Done** — ledger-service `feature/pos-gl-post` Flyway V8 batches/lines + `POST /api/v1/ledger/bank-recon/import` (CSV only). Match proposes MATCHED / AMOUNT_MISMATCH / DATE_MISMATCH / STATEMENT_ONLY / BOOKS_ONLY (±₹1 / ±1 day); **Tick matched** uses the existing `reconciled` flag (reversible). UI on `shop-management-ui-bank-recon` `feature/bank-csv-recon`. File import only — not a live bank API.
8. ~~Purchase ITC posting without double-counting GRN stock.~~ **Done** — see §G (left intact).
9. ~~Purchase debit notes (Input GST reverse + AP reduce).~~ **Done** — see §H.

## F. Feature / GST completion (snapshot)

| Feature | Existing | Fixed this task | Tested |
|---------|----------|-----------------|--------|
| CoA + double-entry | Yes | — | Prior |
| Wholesale SI/SR/collection GL | Yes | — | Prior |
| POS / OPD / LAB / PHARM / IPD GL | No | Yes (`POS_SALE`) | Unit math + permission |
| POS later collection receipt | No | Yes (`POS_COLLECTION`) | Receipt math + idempotent |
| POS COGS | No | Yes (WAC / batch cost → 5300/1200) | CogsQuoteMath + PosSalePostingMath |
| Split GST GL posting | Single 2100 | Yes (sales / POS / CN + AP ITC + purchase DN) | GstSplitTest + ApItcPostingMathTest + PurchaseDebitNotePostingMathTest |
| AR/AP ageing | Yes | — | Prior |
| Expenses / other income | Yes | — | Prior |
| TB / P&L / BS | Yes | Optional `branchId` filter; default consolidated | Unit math (A / B / null) |
| GST engine + GSTR-1/3B prep | Yes | — | Prior |
| GSTR-2B full Excel recon | Thin | Yes (file import + statuses) | Parser + match unit tests |
| Bank statement CSV recon | Ticks only | Yes (CSV import + match on existing ticks) | Parser + match unit tests |
| E-invoice live IRN | Adapter only | No (do not fake) | — |
| E-way bill live | Architecture | No | — |

| GST capability | Status | Gap | Action |
|----------------|--------|-----|--------|
| CGST/SGST/IGST calc | gst-service | — | Keep |
| GSTIN validate | Yes | — | Keep |
| HSN/SAC + rates | Yes | — | Keep |
| Invoice snapshot | Yes | — | Keep |
| GSTR-1/3B prep JSON | Yes | No GSTN upload | P2 adapter |
| Input vs output ledgers | Output 2110–2130; input 2210–2230 posted on AP approve (`AP_ITC`); purchase DN reverses Input on return ship | — | Keep |
| 2B recon | Excel/CSV/JSON import + statuses on `/stocks/gst-recon` | Not a GSTN fetch | Keep file-only |
| Credit notes (sales) | Yes | Purchase DN posted on return ship | Keep |
| E-invoice / e-way | Adapter | Live GSTN | P2, never fake |

## G. Purchase ITC (left intact)

**Audit:** GRN `from-goods-receipt` is Dr Stock 1200 / Cr Creditors 2000 at **ex-tax** landed cost (`purchasePrice` = PO unit cost + freight). No GST fields on the GRN payload; GRN vouchers are not rewritten.

**Chosen rule:** On AP invoice approve, post a separate balanced voucher `source_type=AP_ITC` / `source_id=apInvoice.id` (no existing AP voucher to extend):

| Debit | Credit |
|-------|--------|
| Input CGST 2210 / SGST 2220 / IGST 2230 (document split) or Input GST 2200 residual | Creditors 2000 = tax only |

Does **not** debit Stock again and does **not** re-credit the GRN goods amount. Creditors rise only by tax that was never on the GRN. `GstSplit` — no invented 50/50. Copy nullable `branch_id`; gate `LEDGER_INTEGRATION_ENABLED`; best-effort if ledger is down (same as GRN).

**API:** `POST /api/v1/ledger/vouchers/from-ap-itc`  
**Branches:** `ledger-service` `feature/pos-gl-post`; `stock-service` `feature/ap-itc-post` (from `origin/dev`).  
ITC schema/posting was not reworked. Flyway ITC columns moved **V43 → V44** so `feature/gstr-2b-import` can keep `V43` (`gstr2b_import`).

## H. Purchase debit notes (this task)

**Audit:** `PurchaseReturnService.ship` already decreases inventory qty (`InventoryPostingEngine`) and writes a procurement outbox (`CREDITORS`/`INVENTORY`). That outbox is **not** consumed by ledger-service. No existing GL Stock credit — so the DN **must** credit 1200. Set `creditStock=false` only if a later consumer already posted goods.

**Chosen rule:** On purchase-return **ship**, post `source_type=PURCHASE_DEBIT_NOTE` / `source_id=purchaseReturn.id`:

| Debit | Credit |
|-------|--------|
| Creditors 2000 = ex-tax goods + document tax | Input CGST 2210 / SGST 2220 / IGST 2230 (or 2200 residual) = tax; Stock 1200 = ex-tax goods |

`GstSplit` from the return header — no invented 50/50. Copy nullable `branch_id`. Idempotent. Does not rewrite GRN / AP_ITC / POS. Gate `LEDGER_INTEGRATION_ENABLED`; best-effort if ledger is down (same as GRN/ITC).

**API:** `POST /api/v1/ledger/vouchers/from-purchase-debit-note`  
**Trigger:** existing `POST /purchases/returns/{id}/ship` (no new UI). Optional GST on create payload; V45 columns on `purchase_returns`.  
**Branches:** `ledger-service` `feature/pos-gl-post`; `stock-service` `feature/ap-itc-post`.
