# CRM Sprint 9 — Dashboards + reports

**Branch:** `feature/crm-sprint9-dashboards-reports`  
**Date:** 2026-08-09

## Delivered
- `GET /api/v1/crm/analytics/dashboard` — OWN/TEAM/ORG scoped KPIs + role pack widgets.
- `GET /api/v1/crm/analytics/export.csv` — CSV of KPIs/funnels for current scope.
- Report schedules: type-specific slices; `run-due` honors HOURLY/DAILY/WEEKLY vs `lastRunAt`.
- `GET /reports/schedules/{code}/last-result`.
- Insights UI: scope badge, role-filtered KPIs/panels, Export CSV, schedule list + last result.

## Try
1. Insights → Refresh → see scope badge (ORG when record-scope off).
2. Export CSV download.
3. Ops → save schedule → Run due → Insights shows schedule + Last result.
