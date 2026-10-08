# CRM Sprint 7 — Omnichannel messaging

**Branch:** `feature/crm-sprint7-omnichannel`  
**Date:** 2026-08-09

## Delivered
- `POST /api/v1/crm/messages/send` — ad-hoc WA/SMS/Email via `NotificationClient` + lead timeline `MESSAGE_QUEUED` / `MESSAGE_FAILED`.
- Channel entitlement gate on send + sequence enroll.
- Sequence step dispatch also writes `MESSAGE_*` on lead/opp timeline.
- Lead drawer **Message** compose (AI draft → send).

## Try
1. Enable `CRM_NOTIFICATION_ENABLED=true` (or accept SKIPPED_DISABLED timeline events locally).
2. Open lead → Message → Send WhatsApp/SMS/Email → see timeline event.
