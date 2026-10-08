# CRM Sprint 4 — Activities + My Day

**Branches:** `feature/crm-sprint4-activities-myday` on `crm-service` and `crm-ui`  
**Date:** 2026-08-09

## Delivered

### 4a — Unified activities facade
- `GET /api/v1/crm/activities?from&to&types&limit` — merges TASK / MEETING / CALL / NOTE (recent notes by createdAt; no due schema yet).
- Existing `/tasks`, `/ops/*`, timelines unchanged.

### 4b — My Day work queue
- `GET /api/v1/crm/my-day` — overdue, due today, meetings today, hot leads (score ≥ 70), open approvals, recent activities.
- crm-ui default route `/home` (**My Day** tab): complete tasks, open hot leads, decide approvals.

## Try

1. Bootstrap workspace → open **My Day**.
2. Process SLA aging → overdue/due lists fill.
3. Book a meeting / log a call → Recent activities.
