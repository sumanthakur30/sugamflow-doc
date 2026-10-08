# Trust Path Lab (TRUST-LAB-01) — import full test catalog

Use this for **Trust Path Lab** (`TRUST-LAB-01`). The file contains **122 pathology tests and packages** across all major departments.

## Quick steps

1. In the header, select outlet **TRUST-LAB-01** (Pathology lab).
2. Open **Catalog tools → Import products** (`/products/import`).
3. Click **Download full Trust Path catalog (CSV)** (or use `docs/templates/trust-lab-import-catalog.csv`).
4. Optional: open in Excel, adjust **Selling Price** / **MRP**, save as `.xlsx`.
5. **Upload & validate** → fix column mapping if needed → **Preview** → **Confirm & import**.

## What is included

| Category | Examples |
|----------|----------|
| Hematology | CBC, ESR, coagulation, blood group, D-Dimer |
| Biochemistry | LFT, KFT, lipid, diabetes, enzymes, electrolytes |
| Thyroid | TSH, FT3, FT4, Anti-TPO |
| Vitamins & minerals | Vitamin D, B12, iron studies, folate, zinc |
| Serology | Hepatitis, HIV, dengue, malaria, typhoid, COVID |
| Microbiology | Urine/blood/sputum culture, AFB |
| Clinical pathology | Urine R/M, stool, semen analysis |
| Hormones | FSH, LH, pregnancy, cortisol, AMH |
| Oncology / cardiac | PSA, CA markers, troponin, NT-proBNP |
| Immunology / molecular | IgE, ANA, TB IGRA, HLA-B27 |
| Packages | Full body, diabetes, ANC, PCOD, fever panel, etc. |

SKU prefix: **`TPLAB-LAB-*`** (tests), **`TPLAB-PKG-*`** (packages).

## Required columns

- Test Name, Test Code / SKU, Category, Selling Price, GST %
- **HSN Code**: `999316` for individual tests, `998419` for packages (pre-filled in CSV)

## Regenerate catalog

```powershell
.\scripts\build-path-lab-import-catalog.ps1 -AllVariants
```

## Database note

- Products import into **productdb** for the active shop.
- Ensure **gst-service** has SAC `999316` and `998419` (migration `V4__path_lab_hsn_sac.sql`).

## After import

Open **Products** (or lab booking) and confirm tests appear. Edit prices anytime without re-import.
