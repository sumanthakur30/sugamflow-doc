# Path lab — standard test catalog (starter prices)

> **Not for import upload** — this file is documentation only.  
> To import tests in SugamFlow use **`docs/templates/path-lab-import-catalog.csv`** or click **Download Path Lab template (.xlsx)** on the Import products screen.

Indicative **INR** prices for demo / first-time setup. Lab owners change **price** and **MRP** in **Products** after login.  
Seeded by `infra/postgres/patches/seed-path-lab-standard-tests.sql` and `scripts/seed-path-lab-tests.ps1`.

| Shop | SKU prefix | Purpose |
|------|------------|---------|
| `TRUST-MEDI-PATH-01` | `TMEDI-LAB-*`, `TMEDI-PKG-*` | Full pathology catalog |
| `TRUST-MEDI-01` (polyclinic) | `TMEDI-CLAB-*`, `LFT-TEST` | Doctor visit-pad prescriptions |

---

## Hematology

| Code | Test | Standard price (₹) | MRP (₹) |
|------|------|-------------------:|--------:|
| TMEDI-LAB-001 | Complete Blood Count (CBC) | 350 | 400 |
| TMEDI-LAB-002 | ESR | 150 | 180 |
| TMEDI-LAB-003 | Peripheral Blood Smear | 250 | 300 |
| TMEDI-LAB-004 | Bleeding Time / Clotting Time | 200 | 240 |
| TMEDI-LAB-005 | PT / INR | 400 | 450 |
| TMEDI-LAB-074 | D-Dimer | 1500 | 1750 |

## Biochemistry

| Code | Test | Standard price (₹) | MRP (₹) |
|------|------|-------------------:|--------:|
| TMEDI-LAB-010 | Liver Function Test (LFT) | 550 | 650 |
| TMEDI-LAB-011 | Kidney Function Test (KFT / RFT) | 550 | 650 |
| TMEDI-LAB-012 | Lipid Profile | 650 | 750 |
| TMEDI-LAB-013 | Blood Sugar Fasting (FBS) | 100 | 120 |
| TMEDI-LAB-014 | Post Prandial Blood Sugar (PPBS) | 100 | 120 |
| TMEDI-LAB-015 | HbA1c | 450 | 550 |
| TMEDI-LAB-016 | Serum Electrolytes | 400 | 480 |
| TMEDI-LAB-017 | Serum Amylase | 450 | 520 |
| TMEDI-LAB-018 | Serum Lipase | 500 | 580 |
| TMEDI-LAB-019 | LDH | 350 | 420 |
| TMEDI-LAB-020 | CRP | 500 | 600 |
| TMEDI-LAB-044 | Serum Calcium | 200 | 250 |

## Thyroid

| Code | Test | Standard price (₹) | MRP (₹) |
|------|------|-------------------:|--------:|
| TMEDI-LAB-030 | TSH | 300 | 360 |
| TMEDI-LAB-031 | Free T3 | 350 | 420 |
| TMEDI-LAB-032 | Free T4 | 350 | 420 |
| TMEDI-LAB-033 | Thyroid Profile (TSH + FT3 + FT4) | 850 | 999 |

## Vitamins & iron

| Code | Test | Standard price (₹) | MRP (₹) |
|------|------|-------------------:|--------:|
| TMEDI-LAB-040 | Vitamin D3 (25-OH) | 1200 | 1400 |
| TMEDI-LAB-041 | Vitamin B12 | 900 | 1050 |
| TMEDI-LAB-042 | Iron Studies | 900 | 1050 |
| TMEDI-LAB-043 | Ferritin | 900 | 1050 |

## Serology / infectious disease

| Code | Test | Standard price (₹) | MRP (₹) |
|------|------|-------------------:|--------:|
| TMEDI-LAB-050 | HBsAg | 350 | 400 |
| TMEDI-LAB-051 | Anti-HCV | 400 | 480 |
| TMEDI-LAB-052 | HIV 1 & 2 (screening) | 400 | 480 |
| TMEDI-LAB-053 | Dengue NS1 | 600 | 700 |
| TMEDI-LAB-054 | Malaria Antigen | 450 | 520 |
| TMEDI-LAB-055 | Widal (Typhoid) | 300 | 360 |

## Clinical pathology

| Code | Test | Standard price (₹) | MRP (₹) |
|------|------|-------------------:|--------:|
| TMEDI-LAB-060 | Urine Routine & Microscopy | 120 | 150 |
| TMEDI-LAB-061 | Urine Culture & Sensitivity | 650 | 750 |
| TMEDI-LAB-062 | Stool Routine & Microscopy | 150 | 180 |

## Hormones / oncology / cardiac

| Code | Test | Standard price (₹) | MRP (₹) |
|------|------|-------------------:|--------:|
| TMEDI-LAB-070 | Beta HCG (pregnancy) | 500 | 600 |
| TMEDI-LAB-071 | PSA | 700 | 850 |
| TMEDI-LAB-072 | CA-125 | 1200 | 1400 |
| TMEDI-LAB-073 | Troponin I | 1200 | 1450 |

## Packages

| Code | Package | Standard price (₹) | MRP (₹) |
|------|---------|-------------------:|--------:|
| TMEDI-PKG-001 | Basic Health Checkup | 1499 | 1999 |
| TMEDI-PKG-002 | Diabetes Care | 999 | 1299 |
| TMEDI-PKG-003 | Thyroid Care | 899 | 1099 |
| TMEDI-PKG-004 | Liver Care | 799 | 999 |
| TMEDI-PKG-005 | Fever Panel | 1299 | 1599 |

---

## Polyclinic OPD (TRUST-MEDI-01)

| Code | Test | Standard price (₹) |
|------|------|-------------------:|
| LFT-TEST | LFT Test (legacy) | 550 |
| TMEDI-CLAB-001 | CBC | 350 |
| TMEDI-CLAB-010 | LFT | 550 |
| TMEDI-CLAB-013 | FBS | 100 |
| TMEDI-CLAB-015 | HbA1c | 450 |
| TMEDI-CLAB-030 | TSH | 300 |
| TMEDI-CLAB-060 | Urine R/M | 120 |

---

## Quick start

```powershell
# 1) Create PATH_LAB shop + seed all tests
.\scripts\seed-path-lab-tests.ps1

# 2) API smoke test (after gateway is up)
.\scripts\test-path-lab-integration.ps1 -Username trustmedicentre -Password "YourPassword"

# 3) Full polyclinic → lab referral flow
.\scripts\test-polyclinic-full-flow.ps1 -Username trustmedicentre -Password "YourPassword"
```

**Note:** Prices are not medical advice or contracted rates; they are editable defaults for software demo and onboarding.
