# Indian medicine reference formulary (doctor prescribing)

Use this for **doctor consultation pad** search — a master list of Indian generic medicine names.  
**Not** a pharmacy stock catalog: no opening stock, no billing prices required.

## What this is

| Reference formulary | Pharmacy inventory import |
|---------------------|---------------------------|
| Doctor picks medicine name from dropdown | Pharmacy dispenses + bills |
| `Current Stock = 0` | Stock quantities required |
| Optional placeholder price (`1`) | Real MRP / selling price |
| ~100–5000 salt + strength + form rows | SKUs tied to your shop stock |

Doctors on **TRUST-POLY-01** search **tenant-wide** — rows live under **TRUST-PHAR-01** (or your pharmacy outlet) but appear on the polyclinic doctor pad.

## Files

| File | Use |
|------|-----|
| [`indian-medicine-reference-formulary.csv`](indian-medicine-reference-formulary.csv) | Starter ~100 common Indian generics — edit and expand |
| [`indian-medicine-reference-formulary-1000.csv`](indian-medicine-reference-formulary-1000.csv) | **1000 medicines** (100 generics + 900 common Indian brands) |
| [`../../scripts/build-indian-medicine-formulary-1000.ps1`](../../scripts/build-indian-medicine-formulary-1000.ps1) | Rebuild 1000-row CSV from open Indian Medicine Dataset |
| [`../infra/postgres/patches/seed-indian-reference-formulary.sql`](../infra/postgres/patches/seed-indian-reference-formulary.sql) | One-shot DB seed (reference flags: no inventory) |
| [`../../scripts/setup-indian-reference-formulary.ps1`](../../scripts/setup-indian-reference-formulary.ps1) | Local setup script |

Copy in UI assets: `shop-management-ui/src/assets/templates/indian-medicine-reference-formulary.csv`

## Option A — SQL seed (fastest for local demo)

```powershell
cd d:\sugamFlow
.\scripts\setup-indian-reference-formulary.ps1              # ~100 generics
.\scripts\setup-indian-reference-formulary.ps1 -Formulary1000   # 1000 medicines
```

Rebuild the 1000-row file (downloads public dataset on first run):

```powershell
.\scripts\build-indian-medicine-formulary-1000.ps1 -DownloadIfMissing -RegenerateSql
```

Then reload the doctor pad (`/doctor/dashboard/consultation`) and type e.g. `Dox`, `Pant`, `Met`.

## Option B — CSV import (production / your own list)

1. Log in as **owner** (or staff with **Import products**).
2. **Account** → active outlet = **TRUST-PHAR-01**.
3. Open **Catalog tools → Import products** (`/products/import`).
4. Upload `indian-medicine-reference-formulary.csv`.
5. Map columns (headers match pharmacy template).
6. Duplicate policy: **SKIP** (keeps existing SKUs; add new codes only).
7. Confirm import.

**Important for reference rows in CSV:**

- **Current Stock** = `0` (no opening stock)
- **Selling Price** = `1` (placeholder — import requires a positive number)
- **Batch Number / Expiry Date** — leave blank
- **Product Code / SKU** — use unique codes (`INRF-001`, …)

## Scaling to 1000+ medicines

1. Export your distributor / old EMR master to Excel.
2. Map columns to this template (see [`TRUST-PHAR-01-MEDICINE-IMPORT-GUIDE.md`](TRUST-PHAR-01-MEDICINE-IMPORT-GUIDE.md)).
3. Set **Current Stock = 0** for every row (prescribe-only).
4. Import in one file (under 10 MB) or split into two ~500-row files.
5. Re-import monthly with duplicate policy **UPDATE** if names change.

## Column reference (minimum)

| Column | Required | Reference value |
|--------|----------|-----------------|
| Product Name | Yes | e.g. `Doxycycline 100mg Capsule` |
| Category | Yes | Therapeutic class (Antibiotic, Analgesic, …) |
| Selling Price | Yes | `1` (placeholder) |
| GST % | Yes | `12` (most medicines) or `5` (ORS, etc.) |
| Current Stock | Yes | `0` |
| Salt Composition | Recommended | e.g. `Doxycycline 100mg` |
| Product Code / SKU | Recommended | `INRF-020` |
| Unit Type | Recommended | `tablet`, `capsule`, `syrup`, `injection` |
| Schedule Type | Optional | `H`, `H1`, `OTC` |

## After import

- Doctor pad: type **2+ letters** → instant local dropdown (with RxNorm fallback).
- Printed Rx shows medicine name + your dose/duration — **no stock check**.
- If you later add in-house pharmacy, map reference SKUs to real stock separately.

## Verify count (productdb)

```sql
SELECT COUNT(*) FROM products
WHERE tenant_id = 100 AND shop_id = 'TRUST-PHAR-01' AND code LIKE 'INRF-%';
```
