# TRUST-PHAR-01 — Medicine bulk import sample (polyclinic pharmacy)

Production-ready sample for shop **`TRUST-PHAR-01`** (polyclinic pharmacy / `PHARMACY` or `MEDICAL` business type).

## Files

| File | Use |
|------|-----|
| [`trust-phar-01-medicine-import-sample.csv`](trust-phar-01-medicine-import-sample.csv) | Open in Excel, edit, save as `.xlsx` if needed |
| [`trust-phar-01-medicine-import-sample.xlsx`](trust-phar-01-medicine-import-sample.xlsx) | Same data + **Field guide** sheet (generate via script below) |

Copy to UI assets: `shop-management-ui/src/assets/templates/`

## How to import

1. Log in and set **Active shop** = `TRUST-PHAR-01`.
2. Go to **Catalog tools → Import products** (or **Products → Import**).
3. Upload `.xlsx` or `.csv` (not `.md`).
4. Confirm column mapping (pharmacy headers auto-map).
5. Review validation preview → **Confirm & import**.
6. View catalog: **Products** tab → `/products`.

**Duplicate policy:** use **SKIP** (default), **UPDATE** to refresh existing SKUs, or **FAIL** to stop on duplicates.

Sample SKUs use **short codes** (e.g. `PARA-500`, `AMX-500`) — unique per outlet only; shop id is already stored on each product row.

### Recommended SKU style (pharmacy)

| Style | Example | Notes |
|--------|---------|--------|
| Salt + strength | `PARA-500`, `CET-10` | Easy to read on labels and POS |
| Short mnemonic | `DMR-SYP`, `CIP-EYE` | Good for syrups / devices |
| Numeric | `M001`, `M002` | Fine if you prefer serial codes |

Avoid embedding the full shop id in every SKU (`TRUST-PHAR-01-MED-001`) unless you need it for external ERP sync — it clutters the medicine list. Use **Barcode** for scanner IDs (EAN).

---

## Mandatory vs optional (import engine)

### Required for pharmacy import

| Column | Required | Validation |
|--------|----------|------------|
| **Product Name** | Yes | Non-empty |
| **Category** | Yes | Non-empty (therapeutic / product class) |
| **Selling Price** | Yes | Positive number |
| **GST %** | Yes | One of: `0`, `3`, `5`, `12`, `18`, `28` |
| **Current Stock** | Yes | Zero or positive integer (opening stock) |

### Strongly recommended

| Column | Notes |
|--------|--------|
| **Product Code / SKU** | Unique per outlet; auto-generated if blank |
| **HSN Code** | 4–8 digits; warning if not in GST master |
| **MRP** | Used for billing / display |
| **Barcode** | Duplicate in file or catalog = error/warning |

### Optional (imported into catalog)

| Column | Stored as |
|--------|-----------|
| Salt Composition | Medicine `composition` |
| Brand | Product brand name (text) |
| Purchase Price | Validated only (not on product row today) |
| Unit Type | Product type hint (`strip`, `tablet`, `bottle`, etc.) |
| Batch Number | Creates inventory batch when **Current Stock** > 0 (e.g. `PARA-B250801`) |
| Expiry Date | `YYYY-MM-DD`, `DD-MM-YYYY`, or `DD/MM/YYYY` — shown as **Expire** on medicine list |
| Manufacturing Date | Optional; stored on batch (`YYYY-MM-DD` formats) |
| Manufacturer | Medicine detail |
| Minimum Stock Alert | Low-stock threshold |
| Product Status | `ACTIVE` (default) or `INACTIVE` |
| Schedule Type | `H`, `H1`, `X`, `OTC`, etc. |

### Reference columns (in sample sheet — not imported yet)

Keep these in your master spreadsheet for operations; SugamFlow **ignores unmapped columns** on upload:

- Generic Name, Therapeutic Class (use **Category** for import)
- Supplier / Vendor, Manufacturing Date, Pack Size, Discount %
- Rack / Shelf Location, Prescription Required
- Dosage Form, Strength, Storage Condition
- Medicine Image URL, Notes / Remarks

> **Tip:** Put strength in **Product Name** (e.g. `Paracetamol 500mg Tablet`) and form in **Unit Type** (`tablet`, `syrup`, `injection`) until dedicated columns are supported.

---

## Validation rules (summary)

| Rule | Code | Severity |
|------|------|----------|
| Missing required column mapping | `MISSING_COLUMN` | Error |
| Empty mandatory cell | `REQUIRED_FIELD` | Error |
| Invalid GST | `INVALID_GST` | Error |
| Invalid HSN format | `INVALID_HSN` | Error |
| HSN not in master | `HSN_WARNING` | Warning |
| Duplicate SKU in file | `DUPLICATE_SKU_FILE` | Error |
| Duplicate SKU in catalog (same outlet) | `DUPLICATE_SKU` | Warning |
| Duplicate barcode | `DUPLICATE_BARCODE` / file | Warning / Error |
| Invalid stock / price / date | `INVALID_*` | Error |
| Row failed on save | `IMPORT_FAILED` | Error (see error CSV) |

---

## Sample sheet contents (15 rows)

| Type | Example SKU |
|------|-------------|
| Tablet | PARA-500 |
| Capsule (antibiotic H1) | AMX-500 |
| Syrup | DMR-SYP |
| Injection (cold chain) | INS-40 |
| Ointment | BET-20G |
| Eye drops | CIP-EYE |
| ORS powder | ORS-1 |
| Surgical consumable | GLV-M, SYR-5ML |

---

## Services that must be running (local)

- **product-service** — import API  
- **stock-service** (port 8082) — applies **Current Stock** from sheet  
- **gst-service** — HSN validation (optional; warnings if down)  
- **gateway** (9090) + Angular proxy

---

## Regenerate Excel (optional)

```powershell
cd d:\sugamFlow
python docs/templates/generate-trust-phar-01-xlsx.py
```

Requires: `pip install openpyxl`
