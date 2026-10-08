# CRM Sprint 2 — Party convert · Account 360 · Duplicate rules

**Branches:** `feature/crm-sprint2-party-convert` on `crm-service` and `crm-ui`  
**(Includes Sprint 1 foundation work.)**  
**Date:** 2026-08-09

## Delivered

### 2a — Account 360
- `GET /api/v1/crm/accounts/{id}/summary` — account + contacts + linked leads + opportunities.
- `GET /api/v1/crm/accounts/{id}/timeline` + `POST .../notes`.
- crm-ui: account drawer with Overview / Timeline tabs.

### 2b — Lead → CRM party convert
- `POST /api/v1/crm/leads/{id}/convert-to-crm` — CREATE/EXISTING account & contact, optional opportunity.
- ERP convert (`POST .../convert?targetSystem=`) unchanged.
- crm-ui: convert wizard in lead drawer.

### 2c — Configurable duplicate rules
- Flyway `V22__duplicate_rules.sql` + `crm_duplicate_rule`.
- `GET/POST /api/v1/crm/duplicate-rules` — seeds PHONE+EMAIL on, GSTIN off.
- `LeadMergeService` uses enabled rules + normalize modes.
- crm-ui: Enterprise → Duplicate rules toggles; lead drawer lists hits to merge.

## How to try

```powershell
# crm-service
cd D:\sugamFlow\crm-service
mvn -DskipTests spring-boot:run -Dspring-boot.run.profiles=local

# crm-ui
cd D:\sugamFlow\crm-ui
npm start
```

1. Open a lead → **Convert to CRM party** (create account/contact + optional deal).
2. Accounts tab → select account → Overview / Timeline.
3. AI / Enterprise → toggle GSTIN duplicate rule → Find duplicates on a lead.
