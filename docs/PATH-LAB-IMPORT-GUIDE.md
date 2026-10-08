# Path Lab — product import guide

SugamFlow reuses the **existing Products Import/Export** module (`/products/import`). No separate upload tool is required.

## Download template (Excel)

### Option A — From the UI (recommended)

1. Link or register shop **`TRUST-MEDI-PATH-01`** (business type **Pathology lab**).
2. Switch outlet to the path lab.
3. Open **Catalog tools → Import products** (or `/products/import`).
4. Click **Download Path Lab template (.xlsx)** before filling data.
5. Upload the file → **Upload & validate** → fix mapping if needed → **Preview** (errors show **row numbers**) → **Confirm & import**.

### Option B — Script (gateway running + login)

```powershell
.\scripts\download-path-lab-import-template.ps1 `
  -Username trustmedicentre -Password "YourPassword" -ShopId TRUST-MEDI-PATH-01
```

Saves: `docs/templates/path-lab-import-template.xlsx`

### Option C — API

`GET /api/v1/products/export/template?businessType=PATH_LAB&format=xlsx`  
Headers: `X-Tenant-Id`, `X-Shop-Id`, `X-Business-Type: PATH_LAB`, auth + `IMPORT_PRODUCTS` or `MANAGE_PRODUCTS`.

## Template columns

| Column | Maps to | Required |
|--------|---------|----------|
| Test Name | Product name | Yes |
| Test Code / SKU | Unique code (tenant-wide) | Yes (path lab) |
| Category | e.g. Hematology, Biochemistry | Yes |
| Sample Type | Blood, Serum, Urine… | Recommended |
| Processing Time (TAT) | e.g. 6 hours, 24 hours | Recommended |
| Report Type | Digital PDF, Printed… | Recommended |
| Service Type | LAB, DIAGNOSTIC, PACKAGE | Recommended |
| HSN Code | **999316** (lab tests) or **998419** (packages) — see table below | Recommended |
| GST % | 0, 5, 12, 18, 28 | Yes |
| Selling Price | Standard price (owner can change later) | Yes |
| MRP | List price | Optional |
| Barcode | Optional | No |
| Product Status | ACTIVE / INACTIVE | Optional |

Lab-specific fields are stored on **medicine_detail** metadata (generic name, strength, schedule) for reuse across hospital/HMS expansion.

## Pre-filled catalog CSV (full menu — 122 tests)

```powershell
.\scripts\build-path-lab-import-catalog.ps1 -AllVariants
```

Outputs:

| File | Shop / SKU prefix | Tests |
|------|-------------------|------:|
| `docs/templates/trust-lab-import-catalog.csv` | **TRUST-LAB-01** — `TPLAB-LAB-*` | 122 |
| `docs/templates/path-lab-import-catalog.csv` | TRUST-MEDI-PATH-01 — `TMEDI-LAB-*` | 122 |

Trust Path Lab: see **`docs/templates/TRUST-LAB-01-PATH-IMPORT-GUIDE.md`**.

On the import screen: **Download full Trust Path catalog (CSV)**.

Open in Excel and save as `.xlsx` if you prefer Excel format.

## HSN / SAC codes for testing (SugamFlow GST master)

Use these in the **HSN Code** column so import validation passes (no “not found in master” warning):

| Use for | Code | Type | GST % (seeded) | Notes |
|--------|------|------|----------------|--------|
| **Individual pathology tests** (CBC, LFT, TSH, etc.) | **999316** | SAC | 18% | Medical test services — standard for standalone lab |
| **Health checkup / combo packages** | **998419** | SAC | 18% | Other human health services |
| **Already in DB** (generic) | **998314** | SAC | 18% | Wholesale/retail services — works but less specific |
| **Medicines** (Trust Medi pharmacy only) | **30049099** | HSN | 18% | Medicaments — not for pure lab SKUs |

**Do not use** `9997` in import — it is not in the GST master and triggers warnings.

Apply migration + restart gst-service after pulling latest code:

```powershell
docker compose up -d gst-service
# Flyway runs V4__path_lab_hsn_sac.sql on gst DB at startup
```

Regenerate catalog CSV with correct SAC:

```powershell
.\scripts\build-path-lab-import-catalog.ps1
```

## If preview shows empty test name

The sample CSV had **Test Code** and **Test Name** columns swapped in an earlier build. Re-download **sample catalog (CSV)** or run `.\scripts\build-path-lab-import-catalog.ps1`, then upload again.

## If you see “Unknown import field: PROCESSING_TIME”

The **product-service** container must include Path Lab import fields. Rebuild and restart:

```powershell
.\scripts\rebuild-product-service.ps1
```

Then hard-refresh the browser and run **Re-validate & preview** again. Map **Sample Type** → `SAMPLE_TYPE` (not `SCHEDULE_TYPE`).

## Validation & errors

- **Row-level errors** in preview (column + message + error code).
- **Error report CSV** after failed import: `row_number`, `column_name`, `error_code`, `error_message`.
- Path lab imports do **not** require stock quantity (services).
- Duplicate SKU in file → error on that **row number**.

## SQL seed (alternative)

```powershell
.\scripts\seed-path-lab-tests.ps1
```

Seeds the same catalog directly in Postgres (productdb). Use **import** when the lab owner maintains Excel offline.

## Integrated workflow check

```powershell
.\scripts\seed-path-lab-tests.ps1
.\scripts\test-polyclinic-full-flow.ps1 -Username trustmedicentre -Password "YourPassword"
.\scripts\test-path-lab-integration.ps1 -Username trustmedicentre -Password "YourPassword" -PathLabShopId TRUST-MEDI-PATH-01
```

Polyclinic consult → lab on pad → path lab worklist (`tenantWide`) → sample status → report → doctor patient chart.
