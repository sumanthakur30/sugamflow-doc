# SugamFlow — Accommodation Engine & IPD Module

**Status:** Phase 4.1 delivered (ipd clinical bed ops via HTTP AccommodationClient)  

---

## Services

| Service | Port | Responsibility |
|---------|------|----------------|
| **accommodation-service** | **8101** | Hierarchy, beds, occupancy, glossary (public `/accommodation/**`) |
| **ipd-service** | **8100** | Clinical IPD (admission, nursing, MAR, diet, billing, OT, infection, family, forms) |

Both may share `ipddb`. **ipd-service no longer embeds accommodation JPA** — allocate / release / bed status / bed+node reads go through `AccommodationClient` → `:8101`. Transfer remains composed in ipd (release + allocate + `IpdTransfer` row).

---

## Gateway

```
/api/v1/ipd/**            → ipd-service            (routes[50])
/api/v1/accommodation/**  → accommodation-service  (routes[51])
/api/forms/**             → form-builder-service   (school, routes[33])
```

---

## Phase 4 forms

| Purpose | Form key | Storage |
|---------|----------|---------|
| Nursing assessment | `ipd_nursing_assessment` | `ipd_form_submission` + nursing note `DAILY_ASSESSMENT` |
| Admission consent | `ipd_admission_consent` | `ipd_form_submission` + `ipd_admission.consent_*` |

Bootstrap: `GET /ipd/forms/bootstrap?purpose=ASSESSMENT|CONSENT`  
Submit: `POST /ipd/forms/admissions/{id}` `{ purpose, answers }`  

Resolves schema from form-builder-service when available; otherwise **embedded platform defaults**. School form-builder seeds the same keys for Design Studio (`/admin/forms`) editing.

---

## UI

| Route | Purpose |
|-------|---------|
| `/ipd/dashboard` | Beds (via accommodation API) |
| `/ipd/nursing` | Ward clinical |
| `/ipd/ops` | OT · Infection · Family · Heat map · **Forms** |

---

## Local run

```powershell
# pgAdmin: CREATE DATABASE ipddb;
cd D:\sugamFlow
.\scripts\restart-ipd-billing-local.ps1   # order :8083, accommodation :8101, ipd :8100
# restart gateway-service for routes[50]/[51]
```

Config: `accommodation.service.base-url` (default `http://localhost:8101`).

**Ops pack (phase start + RDS + production push):** [`scripts/rds-ipd-accommodation/README.md`](../../scripts/rds-ipd-accommodation/README.md)
