# Procurement Ã¢â‚¬â€ QA testing guide

**Audience:** QA / testing team  
**Scope:** Universal procurement (PO Ã¢â€ â€™ GRN Ã¢â€ â€™ inspection Ã¢â€ â€™ claims Ã¢â€ â€™ returns Ã¢â€ â€™ reconciliation Ã¢â€ â€™ AP), supplier product catalog, role permissions, GST on PO lines  
**Last updated:** 2026-06-03  

---

## 1. What you are testing

| Area | Description |
|------|-------------|
| **Supplier catalog** | Map shop products to a supplier so PO lines only show that supplierÃ¢â‚¬â„¢s catalog |
| **Purchase orders** | Draft Ã¢â€ â€™ submit Ã¢â€ â€™ approve Ã¢â€ â€™ send Ã¢â€ â€™ receive (GRN) |
| **Inspection** | Batch verify: accepted qty Ã¢â€ â€™ AVAILABLE bucket; rejected Ã¢â€ â€™ QUARANTINE + auto-claim |
| **Returns & claims** | Supplier claims, return ship, bucket updates |
| **Finance** | Reconciliation post, AP invoice match/approve (accountant role) |
| **Roles** | Warehouse, purchase manager, accountant Ã¢â‚¬â€ menus and API 403/200 |
| **GST (optional)** | Line discount %, GST %, order subtotal / tax / total |

**Out of scope for this guide:** Supplier KPI dashboard, AP payment runs, supplier portal, RFQ.

---

## 2. Test environment

### 2.1 Prerequisites

| # | Requirement | How to verify |
|---|-------------|---------------|
| 1 | Docker stack running | Gateway `http://127.0.0.1:9090`, UI reachable |
| 2 | **auth-service** includes `PROCUREMENT_*` in `ALL_PERMISSIONS` | Staff permission save works |
| 3 | **stock-service** Flyway **V14+** on `stockdb` | Procurement tables + idempotency |
| 4 | **stock-service** Flyway **V15** for GST tests | `purchase_order_lines.gst_percent`, `discount_percent` |
| 5 | **shop-management-ui** built with procurement screens | `/stocks/suppliers`, `/stocks/purchase-orders` |
| 6 | Demo shop with products | At least one product in tenant |
| 7 | Owner login with `MANAGE_STOCKS` or `SHOP_OWNER` | Full flow + catalog admin |

### 2.2 Staging demo shops (typical)

| Shop ID | Tenant ID | Notes |
|---------|-----------|--------|
| `GEN-DEMO-01` | `101` | General retail demo |
| `PHARM-DEMO-01` | `104` | Pharmacy demo; use `-ProductId` if auto-pick fails |

Resolve tenant from DB if unsure:

```sql
SELECT shop_id, tenant_id FROM shopdb.shops WHERE shop_id = 'PHARM-DEMO-01';
```

### 2.3 Login rules (important)

| User type | Username in login form | Shop ID field | Password |
|-----------|------------------------|---------------|----------|
| **Owner / demo** | `{base}_{ShopId}` (e.g. `demo_GEN-DEMO-01`) | `GEN-DEMO-01` | e.g. `Demo@2026` (confirm with env) |
| **Procurement roles** | **Exact** value from `auth_account` after seed (see below) | Same shop as seed | `ProcStaging1!` (seed default) |

**Owner example:** username **`demo_GEN-DEMO-01`**, shop **`GEN-DEMO-01`**.

**Procurement roles:** seed script stores scoped names in `authdb`, e.g. `procwarehouse___GEN-DEMO-01` (see `infra/postgres/patches/seed-procurement-staging-users.sql`). The login API matches username **as typed** (no auto-suffix). Verify before testing:

```sql
SELECT username, permissions_json FROM authdb.auth_account
WHERE shop_id = 'GEN-DEMO-01' AND username LIKE 'proc%';
```

Use that username in the login form with the same **Shop ID** and password from seed.

**Automated E2E** scripts append `_ShopId` once (`procwarehouse_GEN-DEMO-01`); if API role smoke fails with 401, align seed usernames with E2E or login using the DB value above for manual UI tests.

After permission changes, user must **log out and log in** again.

### 2.4 One-time data setup (per shop)

```powershell
# Role users for API/UI role tests
.\scripts\seed-procurement-staging-users.ps1 -ShopId GEN-DEMO-01 -TenantId 101

# Pharmacy/Medical: opening stock WITH non-expired FEFO batches (required for POS)
.\scripts\seed-medical-demo-batch-stock.ps1 -ShopId PHARM-DEMO-01 -TenantId 104
# Local Docker SQL alternative:
.\scripts\seed-pharmacy-opening-stock.ps1 -PharmacyShopId PHARM-DEMO-01 -TenantId 104
```

**Note:** Opening stock seed updates **`stock`** quantity, not **inventory buckets**. After GRN/inspection, sellable qty follows **AVAILABLE** bucket (see Ã‚Â§6.3).

---

## 3. UI navigation map

| Screen | Route | Who needs access |
|--------|-------|------------------|
| Procurement dashboard | `/stocks/procurement` | Any `PROCUREMENT_*` or `MANAGE_STOCKS` |
| Suppliers list | `/stocks/suppliers` | Owner / manage stocks |
| Add / edit supplier | `/stocks/suppliers/add`, `/stocks/suppliers/edit/:id` | Owner |
| Purchase orders | `/stocks/purchase-orders` | Procurement roles |
| New / edit PO | `/stocks/purchase-orders/add`, `.../edit/:id` | Owner / purchase manager |
| PO detail / receive | `/stocks/purchase-orders/:id`, `.../receive` | By role |
| AP invoices | `/stocks/ap-invoices` | `PROCUREMENT_FINANCE` or owner |

Tab visibility: **Inventory operations** (or equivalent) appears when JWT has any procurement permission.

---

## 4. Manual test cases

Use **Pass / Fail / Blocked** and attach screenshots for UI defects.

### 4.1 Supplier product catalog (required before PO product pick)

**Goal:** Shop owner can only select products on a PO that are mapped to the selected supplier.

| ID | Step | Expected result |
|----|------|-----------------|
| **TC-SUP-01** | Ensure product exists under **Products** (name + code) | Product visible in product search |
| **TC-SUP-02** | **Suppliers Ã¢â€ â€™ Add supplier**, fill required fields, save | Supplier created |
| **TC-SUP-03** | Open **Edit** on that supplier (catalog not on first create screen) | **Product catalog** section visible |
| **TC-SUP-04** | **Add product:** search by name/code, set Priority, Lead (days), Last price, MOQ Ã¢â€ â€™ **Add to catalog** | Row appears in catalog table; success toast |
| **TC-SUP-05** | **Remove** a mapped product, confirm | Row removed; PO search no longer shows it |
| **TC-SUP-06** | **New purchase order** Ã¢â€ â€™ select supplier Ã¢â€ â€™ **+ Line** Ã¢â€ â€™ search product | Only **mapped** products listed; hint if none mapped |
| **TC-SUP-07** | Select catalog product | Unit cost / MOQ / expected date pre-filled from mapping where configured |
| **TC-SUP-08** | Change supplier on draft PO | Line catalog picker disabled until supplier set; catalog search scoped to new supplier |

**Fail cues:** PO line shows Ã¢â‚¬Å“No mapped products matchÃ¢â‚¬Â; full product list appears instead of supplier catalog; labels missing on catalog add row (regression: use full labels Priority / Lead / Last price / MOQ).

---

### 4.2 Purchase order Ã¢â‚¬â€ happy path (owner)

| ID | Step | Expected result |
|----|------|-----------------|
| **TC-PO-01** | New PO, supplier + catalog line, qty, unit cost, save draft | Status **DRAFT** |
| **TC-PO-02** | Submit Ã¢â€ â€™ Approve Ã¢â€ â€™ Send | Status progresses; approve visible to purchase manager / owner |
| **TC-PO-03** | Receive GRN (qty delivered = ordered) | GRN created; inspection pending if mode = batch verify |
| **TC-PO-04** | Complete inspection (partial accept/reject) | AVAILABLE Ã¢â€ â€˜ by accepted qty; QUARANTINE Ã¢â€ â€˜ by rejected |
| **TC-PO-05** | Check **stock/check** or sellable stock for product | Quantity = **AVAILABLE** bucket total (not legacy stock + GRN unless buckets were seeded) |
| **TC-PO-06** | Auto-claim after reject (if enabled) | Claim in list with type from reason |
| **TC-PO-07** | Return ship (warehouse) | QUARANTINE reduced per scenario |
| **TC-PO-08** | Reconciliation post (accountant) | Session posted |
| **TC-PO-09** | AP invoice match + approve (accountant) | Invoice approved |

---

### 4.3 GST on purchase order (pharmacy / GST-enabled env)

| ID | Step | Expected result |
|----|------|-----------------|
| **TC-GST-01** | PO line: qty 10, unit cost 100, discount 0%, GST 18% | Taxable = 1000, tax = 180, line total = 1180 |
| **TC-GST-02** | Same line with discount 10% | Taxable = 900, tax = 162, total = 1062 |
| **TC-GST-03** | PO detail view | Shows taxable / GST / grand total consistent with form |

If PO create returns **500** / missing column, apply Flyway **V15** on `stockdb` (see Ã‚Â§7).

---

### 4.4 Role-based UI (manual)

Log in **once per user**; confirm buttons match matrix.

| Screen / action | Warehouse | Purchase manager | Accountant | Owner |
|---------------|-----------|----------------|------------|-------|
| View PO / claims lists | Yes | Yes | Yes | Yes |
| **Approve** PO | No | Yes | No | Yes |
| **Receive** GRN | Yes | No | No | Yes |
| Claims submit / resolution | No | Yes | No | Yes |
| Return **Ship** | Yes | No | No | Yes |
| AP **Match / Approve** | No | No | Yes | Yes |
| Reconciliation **Post** | No | No | Yes | Yes |

| ID | Step | Expected |
|----|------|----------|
| **TC-ROLE-01** | Login `procwarehouse` | Receive visible; Approve hidden |
| **TC-ROLE-02** | Login `procpurchmgr` | Approve visible; Receive hidden |
| **TC-ROLE-03** | Login `procaccountant` | AP + recon visible; Receive hidden |

Preset permissions: see [PROCUREMENT-GO-LIVE.md](./PROCUREMENT-GO-LIVE.md#role--permission-matrix).

---

### 4.5 Module configuration

| ID | Step | Expected |
|----|------|----------|
| **TC-CFG-01** | Enable universal procurement for branch (owner/settings or API) | PO/GRN/inspection menus active |
| **TC-CFG-02** | `grnPostingMode = AFTER_INSPECTION` | Stock/buckets update after inspection complete, not at raw receive |
| **TC-CFG-03** | `claimsAutoGenerate = true` | Claim created on inspection reject |

---

### 4.6 Idempotency (API or UI with header)

| ID | Step | Expected |
|----|------|----------|
| **TC-IDEM-01** | POST receive same PO twice with **same** `X-Idempotency-Key` | Second call returns same GRN id; DB has one GRN for that key |

---

## 5. Automated tests (PowerShell)

Run from repo root `d:\sugamFlow` (adjust passwords).

### 5.1 Full staging E2E (roles + flow + DB buckets)

```powershell
.\scripts\seed-procurement-staging-users.ps1 -ShopId GEN-DEMO-01 -TenantId 101

.\scripts\e2e-procurement-staging.ps1 -ShopId GEN-DEMO-01 -TenantId 101 `
  -OwnerUsername demo -OwnerPassword 'Demo@2026'
```

**Pass criteria:** ends with `All procurement E2E checks passed.`

| Section | What it validates |
|---------|-------------------|
| Role smoke | Warehouse / purchase manager / accountant HTTP status codes on guarded endpoints |
| Full flow | PO Ã¢â€ â€™ GRN Ã¢â€ â€™ inspection Ã¢â€ â€™ buckets API=DB Ã¢â€ â€™ stock/check vs AVAILABLE Ã¢â€ â€™ claim Ã¢â€ â€™ return Ã¢â€ â€™ recon Ã¢â€ â€™ AP Ã¢â€ â€™ idempotency |

**Flags:**

| Flag | Use when |
|------|----------|
| `-SkipRoleSmoke` | Only full owner flow |
| `-SkipFullFlow` | Only role API smoke |
| `-ProductId 19` | Force product (e.g. PHARM-DEMO-01) |

**Pharmacy example:**

```powershell
.\scripts\seed-procurement-staging-users.ps1 -ShopId PHARM-DEMO-01 -TenantId 104
.\scripts\seed-medical-demo-batch-stock.ps1 -ShopId PHARM-DEMO-01 -TenantId 104
.\scripts\seed-pharmacy-opening-stock.ps1 -PharmacyShopId PHARM-DEMO-01 -TenantId 104

.\scripts\e2e-procurement-staging.ps1 -ShopId PHARM-DEMO-01 -TenantId 104 `
  -OwnerUsername demo -OwnerPassword 'Demo@2026' -ProductId 19
```

### 5.2 GST E2E

```powershell
.\scripts\e2e-procurement-gst.ps1 -ShopId GEN-DEMO-01 -TenantId 101 `
  -OwnerUsername demo -OwnerPassword 'Demo@2026'
```

**Pass criteria:** PO totals **subtotal 900, tax 162, total 1062** (with 10% discount + 18% GST on scripted line).

---

## 6. API role smoke Ã¢â‚¬â€ expected HTTP status

Automated script expects these (non-exhaustive; fake ids `999999`):

| Role | Method | Path | Allowed status |
|------|--------|------|----------------|
| Warehouse | GET | `/purchases/orders/page` | 200 |
| Warehouse | PUT | `/purchases/orders/999999/approve` | 403, 404 |
| Warehouse | POST | `/purchases/ap-invoices` | 403, 400 |
| Purchase mgr | GET | `/purchases/claims` | 200 |
| Purchase mgr | POST | `/purchases/orders/999999/receive` | 403, 404, 400 |
| Accountant | GET | `/purchases/ap-invoices` | 200 |
| Accountant | POST | `/purchases/reconciliation/sessions/999999/post` | 403, 404 |

Gateway base: `/api/v1/...` with `Authorization`, `X-Tenant-Id`, `X-Skip-Tenant-Context: true`.

---

## 7. Known issues & troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Login 401 with `demo` | Username must be shop-scoped | Use `demo_GEN-DEMO-01` (pattern `{user}_{ShopId}`) |
| No products on PO line | Supplier catalog empty | TC-SUP-04: map products on supplier edit |
| Catalog section missing | New supplier not saved | Save supplier, then **Edit** |
| `stock/check` Ã¢â€°Â  legacy stock + GRN | Buckets drive sellable qty | Expect **AVAILABLE** bucket; ignore legacy-only opening seed |
| E2E `stock/check quantity=8 expected 208` | Old assertion vs buckets | Use latest `e2e-procurement-staging.ps1` (compares to AVAILABLE) |
| PO create 500 (GST) | V15 not applied | Run Flyway V15 on `stockdb` or redeploy stock-service |
| Procurement menus missing | No JWT permissions | Assign `PROCUREMENT_*` or `MANAGE_STOCKS`; re-login |
| 403 on receive/approve | Wrong role | See Ã‚Â§4.4 matrix |
| Idempotency duplicate GRN | V14 missing | Verify Flyway V14 on `stockdb` |

---

## 8. Test data cleanup

E2E creates suppliers `S-E2E-{suffix}`, POs, GRNs per run. Staging DB can accumulate data; optional cleanup:

- Delete test suppliers/POs via UI or SQL on `stockdb` for shop/tenant under test.
- Re-run E2E on clean branch/product if bucket baselines confuse manual checks.

---

## 9. Defect report template

```
Title: [TC-ID] Short description
Environment: GEN-DEMO-01 / PHARM-DEMO-01, tenant __, build/date __
User role: owner | procwarehouse | procpurchmgr | procaccountant
Steps:
1.
2.
Expected:
Actual:
Screenshots / API response:
Logs: stock-service / gateway (if 500)
```

---

## 10. Related documents

| Document | Purpose |
|----------|---------|
| [PROCUREMENT-GO-LIVE.md](./PROCUREMENT-GO-LIVE.md) | Production checklist, deploy script |
| [UNIVERSAL-PROCUREMENT-DESIGN.md](./UNIVERSAL-PROCUREMENT-DESIGN.md) | Functional design |
| `scripts/e2e-procurement-staging.ps1` | Automated regression |
| `scripts/e2e-procurement-gst.ps1` | GST regression |
| `scripts/seed-procurement-staging-users.ps1` | Role test users |

---

## 11. Quick regression checklist (release sign-off)

- [ ] TC-SUP-04 Ã¢â‚¬Â¦ TC-SUP-06 supplier catalog Ã¢â€ â€™ PO picker  
- [ ] TC-PO-01 Ã¢â‚¬Â¦ TC-PO-05 full PO path + stock/buckets  
- [ ] TC-ROLE-01 Ã¢â‚¬Â¦ TC-ROLE-03 three role logins  
- [ ] `e2e-procurement-staging.ps1` green on target shop  
- [ ] `e2e-procurement-gst.ps1` green (if GST in release)  
- [ ] Flyway V14 + V15 verified on staging `stockdb`  

