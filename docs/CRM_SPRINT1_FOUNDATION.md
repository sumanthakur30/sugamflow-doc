# CRM Sprint 1 — Foundation (in progress / landed on branch)

**Branches:** `feature/crm-sprint1-foundation` on `crm-service` and `crm-ui`  
**Date:** 2026-08-09

## Delivered

### 1a — Entitlements
- Entitlement snapshot modules now include `deals`, `accounts`, `insights` (plus existing gates).
- Pilot profile keeps `crm.entitlement.enabled=true` by default; local stays off for smoke.
- crm-ui **hides** locked tabs (Quotes / Campaigns / Cases / AI) instead of only disabling them.

### 1b — Record scope (OWN / TEAM / ORG)
- New `crm.security.record-scope-enabled` (local **false**, pilot-retail **true**).
- Headers: `X-Crm-Access-Scope`, `X-Auth-Role` (role-derived scope).
- Enforced on lead/opportunity get/update/delete/stage + list filters.
- Unit tests: `CrmRecordScopeServiceTest`.

### 1c — Routing shell
- Angular routes: `'' → leads`, `/:module`.
- `CrmNavService` + thin `CrmModuleRouteComponent`.
- Tab nav uses `routerLink` (deep-linkable URLs).

### 1d — Lead edit
- `PUT` already existed on backend; UI now has **Edit** in lead drawer + `CrmApiService.updateLead`.

## How to try

```powershell
# crm-service
cd D:\sugamFlow\crm-service
mvn spring-boot:run "-Dspring-boot.run.profiles=local"

# Optional scope test locally:
# $env:CRM_RECORD_SCOPE_ENABLED='true'

# crm-ui
cd D:\sugamFlow\crm-ui
npm start
# open http://localhost:4500/leads
```

## Next (Sprint 2)
Account/contact detail tabs, convert wizard (new/existing party), configurable duplicate rules.
