# SugamFlow Path Lab — Premium Laboratory Report Design

## Competitive study (summary)

Reviewed layouts from **CrelioHealth**, **Flabs**, **Dr Lal PathLabs**, **SRL**, **Thyrocare**, **Metropolis**, **Apollo Diagnostics**, **HealthPlix Labs**, **CloudPath**, **Abbott AlinIQ**, and **LabWare**, plus classic Indian diagnostic centre printouts (ATM Softek–style samples).

| Pattern | What leaders do | SugamFlow approach |
|---------|-----------------|--------------------|
| Letterhead | Compact logo + accreditation + contact | Brandable letterhead; NABL badge; QR + barcode without wasting vertical space |
| Patient card | Dense meta grid / cards | Premium **Patient / Doctor / Visit** card |
| Results | Department sections, panels (CBC / Diff / Indices) | Department **cards** + smart subgroups + keep-together page breaks |
| Abnormal | Color + arrows | ↑ High · ↓ Low · !! Critical (color **and** symbols) + panic row + banner |
| Methodology | Footnotes under panels / analytes | Shared section method **or** per-analyte footnotes; optional Method / Instrument columns |
| Interpretation | Clinical notes | Clinical · AI summary · Doctor remarks · Recommendation · Medical notes |
| Trust | QR verify + signatory | QR verify URL · barcode · pathologist + optional seal / signature image |
| Branding | Tenant skins | Classic · Corporate · Minimal · Hospital · NABL · Diagnostic · Executive · Color · B&W · Pediatric |
| Legal | Disclaimer + page marks | Configurable disclaimer · running print footer · powered-by |

## Architecture

1. **Canonical original** — server PDF via `LabReportPdfRenderer` (OpenPDF), stored on release.
2. **WYSIWYG preview** — Angular `app-lab-report-print-sheet` with `@media print` A4 for browser print / WhatsApp PDF checks.
3. **Shared grouping util** — `lab-report-print.util.ts` (section titles, CBC/Lipid/LFT subgroups, flag/trend helpers).
4. **Config** — `DocumentType.LAB_REPORT` shell (logo, colors, NABL, pathologist, template skin, section toggles).

## Layout structure

1. Compact letterhead (lab logo, NABL chip, contact, regs, QR, barcode, status pill)
2. Title band — Laboratory Investigation Report + order/version
3. Critical banner (when any panic value)
4. Amendment banner (v2+)
5. Patient / Doctor / Visit information card
6. Investigation summary (test · department · specimen · method · analyzer)
7. Department result cards (subgroups e.g. CBC → Differential → Indices)
8. Methodology footnotes (shared or per-analyte)
9. Interpretation stack (clinical / AI / doctor / recommendation / notes)
10. End-of-report marker
11. Authentication footer (report ID, pathologist, signature image, seal, QR hint)
12. Disclaimer + SugamFlow attribution
13. Print running footer (lab · patient · report id)

## Abnormal highlighting

| Flag | UI / PDF | Symbol |
|------|----------|--------|
| Normal | Black | — |
| High | Red bold | ↑ |
| Low | Blue bold | ↓ |
| Critical / Panic | Dark red + pink row + page banner | !! |

## Configuration (Lab Settings → Document templates → Lab report)

- **Branding:** logo, primary color, tagline, GST, NABL, lab reg, ISO, pathologist, signature URL, **report template skin**
- **Sections:** patient block, reference range, QR, barcode, **method**, **instrument**, prior trend, interpretation, mobile, address, doctor, **signature**
- **Footer:** disclaimer, powered-by SugamFlow
- **Print mode:** FULL vs PRE_PRINTED_STATIONERY

## How to verify

1. Login PATH-DEMO-01 (`demo` / `Demo@2026`)
2. Path Lab → Reports → open an order with results
3. **Premium print preview** / **Browser print** — confirm department cards, flags, QR, skin
4. Change **Report template** in Document templates → refresh preview
5. **Sign, release & download PDF** — letterhead, critical banner (if any), groups, QR

```bash
cd order-service
mvn -Dtest=LabReportPdfRendererTest test
```

## Phased follow-ups

- Real Code128 SVG/PNG in browser (replace decorative barcode bars)
- Native mini sparkline charts for multi-visit trends
- Persist methodology / instrument on `lab_report_version_items`
- Histopathology / culture image attachments in PDF
- Online verify portal for QR deep-link (history · download · share)
- Digital certificate / eSign audit trail on every reprint
