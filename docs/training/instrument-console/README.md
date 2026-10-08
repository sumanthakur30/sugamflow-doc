# Instrument Console — beginner training

## What this page is for

Lab machines send codes like `GLU=105`.  
**Instrument console** teaches SugamFlow what those codes mean and pushes values onto a patient sample.

It does **not**:
- book patients
- collect samples
- create the final PDF

It **does**:
- register analyzers (e.g. BIO1)
- map channels (`GLU` → Fasting Blood Sugar)
- import results for a sample barcode

## Live demo already prepared (PATH-DEMO-01)

| Item | Value |
|------|-------|
| Login | Shop `PATH-DEMO-01`, user `demo`, password `Demo@2026` |
| Instrument | `BIO1` (Bio Chemistry Analyzer 1) |
| Patient | Rajesh Kumar Mehta |
| Order | `136` |
| Sample barcode | `TRAIN-BIO1-20260726101552` |
| Import result | `PROCESSED` |
| Reports proof | Order 136 summary: **Imported from analyzer BIO1** |

## Click-through “video”

Open this file in Chrome/Edge:

`docs/training/instrument-console/INDEX.html`

It auto-plays screenshots with captions (Play / Pause / Next).

## Do it yourself in 4 steps

1. **Sample worklist** — book FBS (or any test) → Collect → Accept → copy barcode  
2. **Instruments** — save instrument `BIO1` with channel `GLU`  
3. **Manual import** paste:

```text
BARCODE=TRAIN-BIO1-20260726101552
GLU=118
```

Instrument code: `BIO1` → **Import results**  
4. **Reports** — open that order → review → pay bill → release PDF  

## Success checklist

- Recent messages = `PROCESSED`
- Reports shows imported values / “Imported from analyzer BIO1”
- You can still edit on Reports before release
