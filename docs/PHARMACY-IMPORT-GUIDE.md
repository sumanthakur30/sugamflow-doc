# Pharmacy / medicine catalog import (CSV / Excel)

Use this for **Trust Medi** and other **PHARMACY** / **MEDICAL** shops in SugamFlow.

## Where to import

1. Open **Pharmacy & catalogue** → **Import** (or sidebar **Catalog tools → Import products**).
2. Click **Download template (.xlsx)** — columns match your shop business type.
3. Fill medicines, upload **.xlsx** or **.csv**, map columns (auto-mapped if headers match), preview, then **Confirm & import**.

Sample files (copy/edit):

- Minimal: [`docs/templates/pharmacy-medicine-import-catalog.csv`](templates/pharmacy-medicine-import-catalog.csv)
- Full (TRUST-PHAR-01): [`docs/templates/trust-phar-01-medicine-import-sample.csv`](templates/trust-phar-01-medicine-import-sample.csv) — see [`TRUST-PHAR-01-MEDICINE-IMPORT-GUIDE.md`](templates/TRUST-PHAR-01-MEDICINE-IMPORT-GUIDE.md)

**Do not confuse with Export:** `products-export-*.xlsx` is a **backup** of your current catalog. For first-time bulk load use the **pharmacy sample CSV** or **Download template** on the Import screen.

**Trust Medi demo:** `infra/postgres/patches/seed-trust-medi-01-medicines.sql` already loads `TMEDI-MED-001`…`010`. Importing the sample file with those same SKUs will fail unless you set duplicate policy to **UPDATE**, or use new codes (sample uses `TMEDI-IMP-001`…).

## Column headers (PHARMACY / MEDICAL)

| Column | Required | Notes |
|--------|----------|--------|
| Product Name | Yes | Medicine display name |
| Salt Composition | No | Stored as composition (e.g. `Paracetamol 500mg`) |
| Product Code / SKU | Recommended | Unique per shop; auto-generated if blank |
| Barcode | No | Duplicate = warning |
| Category | Yes | e.g. Analgesic, Antibiotic |
| Brand | No | |
| HSN Code | No | 4–8 digits; medicines often `3004` / `30049099` |
| GST % | Yes | `0`, `3`, `5`, `12`, `18`, or `28` |
| Purchase Price | No | Validated; not persisted on product row today |
| Selling Price | Yes | Sale price (GST handling applied by system) |
| MRP | No | Max retail price |
| Current Stock | Yes | Opening quantity (stock-service init) |
| Unit Type | No | e.g. `strip`, `tablet`, `pcs` → product type hint |
| Batch Number | No | Creates inventory batch on import when **Current Stock** &gt; 0 (shown on medicine list) |
| Expiry Date | No | `YYYY-MM-DD`, `DD-MM-YYYY`, or `DD/MM/YYYY` — stored on inventory batch |
| Manufacturing Date | No | Optional; maps to batch manufacture date when provided |
| Manufacturer | No | Medicine detail |
| Minimum Stock Alert | No | Low-stock threshold |
| Product Status | No | `ACTIVE` (default) or `INACTIVE` |
| Schedule Type | No | e.g. `H`, `H1`, `X` (medicine schedule) |

## Alternate header names (auto-mapped)

- **Product Name** ← `Medicine Name`, `Name`, `Item Name`
- **Product Code** ← `SKU`, `Code`
- **Selling Price** ← `Price`
- **GST %** ← `GST`, `Tax %`
- **Current Stock** ← `Stock`, `Quantity`
- **Expiry Date** ← `Expiry`
- **Batch Number** ← `Batch`

## Tips

- **stock-service** (port **8082** locally) should be running so **Current Stock** from the sheet is applied. If it is down, products still import; add stock later under **Store & inventory**.
- Local STS run: set `SERVICES_STOCK_BASE_URL=http://localhost:8082` on **product-service** (default in `application-local.properties`).
- Keep **one medicine per row**; unique **Product Code / SKU** per shop.
- **Duplicate policy**: SKIP (default), UPDATE, or FAIL on confirm step.
- **Batch No** and **Expire** on the medicine list come from **inventory batches** created during import when **Batch Number** and **Expiry Date** are filled and stock-service is running.
- For **pathology lab** tests (not pharmacy), use the Path Lab template instead — see [`PATH-LAB-IMPORT-GUIDE.md`](PATH-LAB-IMPORT-GUIDE.md).

## API template download (optional)

`GET /api/products/import/template?businessType=PHARMACY&format=xlsx`  
(requires auth + `X-Tenant-Id` / `X-Shop-Id` headers)
