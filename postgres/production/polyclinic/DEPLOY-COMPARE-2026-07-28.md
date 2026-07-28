# Production deploy compare — 2026-07-28 (Polyclinic / PathLab / OPD)

Use this before EC2/Docker Hub deploy. **RDS first for anything Flyway-sensitive.**

Related:

- Pre-check: `11-orderdb-predeploy-check.sql`
- SAFE V81: `12-orderdb-rds-V81-consultation-notes-text.sql`
- SAFE V74 approval cols: `13-orderdb-rds-V74-approval-columns-SAFE.sql`
- Full Flyway sources: `order-service/src/main/resources/db/migration/V73__` … `V81__`
- General checklist: `docs/production-deploy-checklist.md`

---

## 1) Git reality (what is / isn’t production-ready)

| Repo | Branch tracking | On `origin/dev`? | Local uncommitted (must ship for this release) |
|------|-----------------|------------------|-----------------------------------------------|
| **order-service** | `dev` = `origin/dev` | PathLab V73–V80 **yes** | **V81** notes→text; some Java tweaks (Consultation notes, RequestIdFilter, etc.) |
| **shop-management-ui** | `dev` = `origin/dev` | PathLab Phase 3 UI **yes** | Doctor out-of-order Start, Complete Visit visibility, Reception WhatsApp, Staff doctor fees, EMR pad metadata, e2e |
| **queue-management-service** | `feature/lab` | baseline only | **Out-of-order start + park other IN_CONSULTATION** (`QueueService.java`) — **not committed** |
| **gateway-service** | `dev` = `origin/dev` | Public lab portal routes **yes** | (none required for this OPD pack) |
| **stock-service** | `dev` = `origin/dev` | reagent auto-PO enqueue **yes** | — |
| **doctor-service** | `feature/lab` | fees columns already in schema | Staff fees UI uses existing `consultation_fee` / `follow_up_fee` — **no new Flyway** |
| Parent `sugamFlow` | `feature/polyclinic-ipd-ops` | mixed | Many PathLab/IPD/UI copies + compose/scripts — prefer deploy **nested repos**, not the whole parent dump |

**Bottom line:** PathLab Phase 1–3 (V73–V80 + images on `origin/dev`) may already be buildable from `dev`.  
**This session’s OPD/UX pack is mostly still uncommitted** — commit/push before production build.

---

## 2) Flyway / RDS — orderdb (highest risk)

| Version | File | On `origin/dev` | What it does | Prod action |
|---------|------|-----------------|--------------|-------------|
| V73 | barcode, storage, commissions, rate cards | Yes | New lab tables + sample storage cols | Flyway on order-service start **or** run file if history stuck |
| V74 | QC formula + **approval_level** cols | Yes | `lab_report_versions.approval_level` | If reports 500 → run `13-...V74...SAFE.sql` |
| V75–V80 | notify/QR, CC pricing, camps, portals, reagent PO, doctor portal | Yes | Phase 3 tables | Flyway preferred |
| **V81** | `consultations.notes` → **text** | **No (local only)** | EMR HPI/history JSON | **Must** commit + deploy **or** run `12-...V81...SAFE.sql` on RDS |

### Recommended RDS sequence (DBeaver → database **orderdb**)

1. Run `11-orderdb-predeploy-check.sql` — note max Flyway version + MISSING tables/columns.
2. If `approval_level` missing → `13-orderdb-rds-V74-approval-columns-SAFE.sql`.
3. If `consultations.notes` is not `text` → `12-orderdb-rds-V81-consultation-notes-text.sql`.
4. Deploy **order-service** image that includes V73–V81; confirm container logs: `Successfully applied` / no Flyway checksum errors.
5. Re-run check script — expect V81 applied (or manual history insert only if you applied SQL by hand and understand checksum risk).

### Do **not**

- Run orderdb scripts while connected to `postgres` default DB.
- Blindly `INSERT` into `flyway_schema_history_order` for V73–V80 if Flyway will also try to apply the same scripts (checksum mismatch / skip).
- Assume local DB state = RDS (local often had **no** Flyway history).

### Other DBs for this OPD pack

| DB | Needed for this release? | Notes |
|----|--------------------------|-------|
| **doctordb** | No new migration | Fees UI updates existing `doctors.consultation_fee` / `follow_up_fee` |
| **queuedb** | No new migration | Queue out-of-order is **code-only** |
| **appointmentdb** | No | Complete visit still uses existing complete APIs |
| **userdb / shopdb** | No for this pack | — |

---

## 3) Application images / UI to rebuild

After commit + push:

| Component | Why |
|-----------|-----|
| **queue-management-service** | Out-of-order Start + park open consult |
| **order-service** | V81 + Consultation notes text + any public/filter fixes |
| **shop-management-ui** (static build on EC2/nginx) | Queue Start, Complete Visit, Reception WhatsApp, Staff doctor fees, EMR fields |
| **gateway-service** | Only if prod lacks PathLab public routes (already on `origin/dev`) |

Deploy order tip: **RDS SAFE scripts → rebuild/push images → EC2 pull → restart order → queue → gateway → deploy UI**.

---

## 4) Feature → code map (uncommitted)

- Doctor **out-of-order Start**: `doctor-queue-board.*`, `doctor-dashboard.component.ts`, `queue-management-service/.../QueueService.java`
- **Complete Visit** visible: `doctor-dashboard.component.html` / `.scss`
- Reception **WhatsApp**: `reception-dashboard.component.*`
- Staff **doctor fees**: `staff-management.component.*` (POLYCLINIC/CLINIC only)
- EMR pad notes: `clinical-pad-metadata.ts`, `Consultation.java`, **V81**
- e2e: `e2e/polyclinic-queue-reception-flows.spec.ts`, `healthcare-responsive.spec.ts`

---

## 5) Post-deploy smoke

1. Staff → Doctor consultation fees → Save → Reception Billing shows fee when doctor selected.
2. Doctor queue → **Start** on a later waiting token → consult opens; prior IN_CONSULTATION parked.
3. Focus Mode → **Complete Visit** visible on sticky Rx bar → completes token.
4. Reception completed row → WhatsApp / View Rx / Print Rx.
5. PathLab report PDF / approval path (if Phase 3 live) → no 500 on `approval_level`.

---

## 6) If Flyway fails on EC2

1. Capture `docker logs sumanthakur30-order-service-1 --tail 200`.
2. Run `11-orderdb-predeploy-check.sql`.
3. Apply only the SAFE scripts for the missing pieces (`13`, `12`).
4. For full V73–V80 gap: apply corresponding files from  
   `order-service/src/main/resources/db/migration/` **in version order**, then restart order-service  
   **or** fix history with DBA oversight (avoid duplicate objects + bad checksums).
