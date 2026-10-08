# CRM Sprint 8 — Scoring + qualification

**Branch:** `feature/crm-sprint8-scoring-qualification`  
**Date:** 2026-08-09

## Delivered
- Flyway **V23**: `crm_score_band` (hot/warm mins) + `crm_qualification_schema` (BANT fields JSON).
- Score rule **CRUD**: `POST /api/v1/crm/scoring/rules` (create/update points/active); bands `GET|PUT /scoring/bands`.
- Lead responses include **`scoreBand`** (`HOT`/`WARM`/`COLD`); My Day hot list uses tenant `hotMin`.
- Qualification: `GET|POST /qualification/schemas`, `POST /qualification/leads/{id}` → `lead.attributes.qualification` + timeline `QUALIFICATION_UPDATED`.
- AI NBA / churn use band thresholds instead of hard-coded 25/30/60.
- Ops UI: editable score rules, Hot/Warm/Cold bands, schema toggle; lead drawer badge + BANT form.

## Try
1. Ops → Score rules: change points / add rule; save bands (e.g. Hot 65).
2. My Day → hot list should respect Hot min.
3. Open lead → see Hot/Warm/Cold badge; fill BANT → Save → timeline event.
