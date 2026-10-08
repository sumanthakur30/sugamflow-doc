# CRM Sprint 5–6 — Pipeline analytics + Automation/cadence

**Branch:** `feature/crm-sprint5-pipeline-analytics` (includes Sprint 6 work)  
**Date:** 2026-08-09

## Sprint 5 — Pipeline analytics
- `GET /api/v1/crm/analytics/pipeline` — aging buckets, velocity by stage, avg days to won/lost, won/lost by reason.
- Forecast adds `gapCommitVsWeighted` + manager hint.
- Insights UI: aging / velocity / reason panels; Ops forecast gap line.

## Sprint 6 — Automation + cadence
- Stage action `ENROLL_SEQUENCE` (+ activate/deactivate rule endpoints).
- Sequence enrollment `pause` / `resume` / `cancel` / `retry`.
- Ops UI: enroll-sequence rules, toggle rules, enrollment lifecycle list.

## Try
1. Insights → Deal aging / velocity / won-lost reasons.
2. Ops → add ENROLL_SEQUENCE rule; pause/retry enrollments.
