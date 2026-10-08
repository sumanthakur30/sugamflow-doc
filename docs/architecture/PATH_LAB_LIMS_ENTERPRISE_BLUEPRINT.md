# SugamFlow Path Lab — Enterprise LIMS / LIS Blueprint

**Status:** Architecture & gap analysis (Steps 1–3) — **no greenfield standalone app**  
**Business type:** `PATH_LAB` (existing SugamFlow vertical)  
**Version:** 1.0 · July 2026  
**Audience:** Product, engineering, healthcare domain

---

## 1. Executive verdict

SugamFlow **already has** a Path Lab vertical (`businessType = PATH_LAB`) with:

- Lab booking, worklist, results, report versions/PDF  
- Polyclinic → lab referral routing (tenant-wide)  
- Patient master, GST SAC for diagnostics, billing hooks  
- UI: dashboard / booking / worklist / reports  

**Goal:** evolve this into an **enterprise-grade LIS/LIMS** that can outcompete FLABS / CrelioHealth / LiveHealth / MocDoc on *integrated multi-business* value (clinic + pharmacy + lab on one tenant), while closing critical LIS gaps (accession, analyzers, NABL, specialty, network ops).

**Non-negotiable architecture rule:** extend existing services and UI packs. Do **not** create a parallel Path Lab product outside SugamFlow.

---

## 2. Platform baseline (Step 1 — read complete)

| Layer | Reality |
|-------|---------|
| Tenancy | `tenantId` + `shopId` + `branchId`; JWT via gateway → `X-Tenant-Id`, `X-Shop-Id`, permissions |
| Lab domain home | **order-service** (`lab_orders`, `lab_results`, report versions) |
| Catalog | **product-service** `LAB_TEST` / `LAB_PACKAGE` |
| Patients | **user-service** (+ healthcare flags) |
| Inventory | **stock-service** (reuse for reagents) |
| Doctors / OPD | **doctor-service**, **appointment-service**, **queue-management-service** |
| Money | **payment-service**, **gst-service**, **ledger-service** |
| Comms | **notification-service** |
| Sales / CC / MR | **fieldforce-service** (extend for referral & camps) |
| UI | **shop-management-ui** healthcare feature + `pathLabOnly` nav |
| DB | **PostgreSQL** + Flyway (not SQL Server on EC2/RDS path) |
| Gate | `capabilities().pathLab`, `PACK_CLINIC`, `MANAGE_LAB_ORDERS` / `MANAGE_LAB_RESULTS` |

Key brief already on disk: `docs/client-briefs/SugamFlow-PATH-LAB-Client-Brief.md`.

---

## 3. Industry research summary (Step 2)

### Global enterprise LIS/LIMS

| Product | Strength | Implication for SugamFlow |
|---------|----------|---------------------------|
| Clinisys / Orchard Harvest | Configurable clinical + AP rules | Need rules engine for reflex / critical |
| LabWare / SampleManager | Instruments, CoC, regulated QC | Need analyzer adapter + specimen model |
| STARLIMS | Chain scale (e.g. Dr Lal history) | Multi-site, instrument volume, specialty |
| SoftLab / PathNet / SCC | Deep AP / micro | Specialty modules later (P2) |
| LabVantage / Thermo | Industrial + clinical hybrids | Avoid over-engineering early |

### India SaaS / chains

| Product / model | Strength | Gap vs SugamFlow opportunity |
|-----------------|----------|------------------------------|
| CrelioHealth | Portals, multi-centre, APIs, breadth | We win on **clinic+pharmacy+lab tenant** |
| FLABS | Accession, analyzers, QC, AI reports, price | Close accession/analyzer/QC ASAP |
| LiveHealth / MocDoc / MediXcel | SMB LIS speed | Differentiate on network + GST ERP depth |
| Dr Lal / SRL / Apollo / Redcliffe ops | Franchise, CC, home collection, TAT SLAs | Phase D network + mobile |

### Competitive thesis

> **SugamFlow Path Lab = LIS depth + multi-vertical healthcare ERP**  
> Standalone LIS vendors struggle at pharmacy/clinic finance/stock unity. SugamFlow already owns that — close LIS depth gaps.

---

## 4. Gap matrix (condensed)

| Area | Status |
|------|--------|
| PATH_LAB vertical, booking, worklist, PDF, GST, clinic referral | **Available** |
| First-class sample/aliquot/container/CoC | **Available (Phase B+)** — deepen storage locations + dispose/archive |
| Configurable barcode / thermal label engine | **Partial** — Code128 PDF + generated barcodes; format designer next |
| HL7/ASTM analyzer bi-dir | **Partial** — uni-dir file + ACK; bi-dir TCP next |
| NABL / IQC / EQAS | **Available** — deepen Levey-Jennings + full Westgard |
| Micro / Histo specialty | **Available (Phase D)** — culture/AST + histo; CAP/antibiogram later |
| CC settlement | **Available** — doctor referral **commission engine** still Partial |
| Multi rate cards / coupons / wallet | **Partial** — core billing exists |
| Patient/doctor portals | **Partial** — PWA hub shipped; dedicated portals next |
| AI draft / OCR / FHIR / ABHA | **Available (Phase E)** |
| Network / home GPS | **Available (Phase D)** |
| Lab rules / reflex / label designer | **Gap / thin** |

Interactive view: Cursor canvas `enterprise-lis-roadmap.canvas.tsx` (Modules 1–23).

---

## 5. Target SaaS models (Step 3)

Must support via **configuration** (shop type + packs + org settings), not forks:

1. Independent diagnostic lab  
2. Hospital / polyclinic-attached lab  
3. Multi-branch diagnostic chain  
4. Collection centres feeding central lab  
5. Franchise / B2B client labs  
6. Corporate / camp / insurance panels  
7. Home / mobile phlebotomy  

Suggested packs (additive):

| Pack | Purpose |
|------|---------|
| `PACK_CLINIC` | Existing path lab default |
| `PACK_LAB_CORE` (new) | Accession, TAT, e-sign, departments |
| `PACK_LAB_INSTRUMENTS` | Analyzer hub |
| `PACK_LAB_QUALITY` | IQC/EQAS/NABL |
| `PACK_LAB_NETWORK` | CC, franchise, home GPS |
| `PACK_LAB_SPECIALTY` | Micro + Histo |
| `PACK_LAB_ECOSYSTEM` | AI draft + FHIR export + ABHA links |

---

## 6. Target architecture

```
Angular shop-management-ui (path-lab-* + new queues)
        │
   gateway-service :9090
        │
   ┌────┴────────────────────────────────────────┐
   │ order-service (LIS core + billing coupling) │
   │  lab orders, samples, results, reports, TAT │
   └────┬────────────────────────────────────────┘
        │ optional
   lab-instrument-adapter (NEW microservice)
        │ ASTM / HL7 / vendor drivers
   Analyzers / middleware (Data Innovations-style optional)

Reuse: auth, users, products, stock, gst, payment, ledger,
       notification, doctor, appointment, queue, fieldforce, reporting
```

**Extract instrument I/O** so order-service stays transactional for clinical + commercial integrity.

---

## 7. Module blueprints (all 25 — architect level)

For each: **Reuse** | **New** | **Roles** | **Priority**.  
Detailed DDL/OpenAPI produced per phase spike; do not invent parallel schemas that ignore Flyway history.

### 1. Dashboard — **P0**
- **Flow:** Owner opens day board → queues by status/TAT/critical.  
- **Reuse:** `path-lab-dashboard`.  
- **New:** Critical lane, machine strip, CC performance, tech productivity, referral mix.  
- **Roles:** OWNER, LAB_MANAGER.  

### 2. Patient management — **P1**
- **Reuse:** user-service patients, photo if present.  
- **New:** ABHA link, ID upload, digital consent, allergy/chronic flags, prior-report timeline.  
- **Roles:** RECEPTION, OWNER.  

### 3. Appointment — **P1**
- **Reuse:** appointment-service + path-lab booking.  
- **New:** Camp/corporate slots, emergency, SMS/WhatsApp reminders via notification-service.  

### 4. Test catalog — **P0**
- **Reuse:** product `LAB_TEST` / packages.  
- **New:** Department taxonomy, panel composition, calculated/formula tests, outsource flag.  

### 5. Sample collection / accession — **P0**
- **Reuse:** `sampleBarcode`, collectors as staff.  
- **New entities:** `lab_samples`, `lab_containers`, `lab_sample_events` (CoC), reject/recollect, dispatch/receive between CC and hub.  
- **UI:** Barcode-first kanban.  

### 6. Analyzer integration — **P0**
- **New service:** `lab-instrument-adapter` (uni → bi-dir ASTM/HL7).  
- **New tables:** instrument registry, channel maps, raw message archive.  
- **Security:** instrument credentials per shop; no public exposure.  

### 7. Result entry / validation — **P0**
- **Reuse:** lab_results, report versions, audit.  
- **New:** Age/sex reference engine, delta check, critical paging, pathologist dual-sign, amend workflow.  

### 8. Histopathology — **P2 (baseline Available)**
- **Available:** case stages (gross → embed → section → stain → diagnosis) via `lab_histo_cases` + `/path-lab/histo`.  
- **Later:** image attach; CAP/cancer templates; SNOMED codes optional.  

### 9. Microbiology — **P2 (baseline Available)**
- **Available:** organism library, culture workflow, isolates + AST (S/I/R) via `lab_micro_*` + `/path-lab/micro`.  
- **Later:** antibiogram aggregate reports, CLSI panel packs.  

### 10. Radiology — **P3 optional**
- Integrate later via HL7 ORU / FHIR; do not build RIS now.  

### 11. Billing — **P1**
- **Reuse:** encounter billing, payments, GST.  
- **New:** Insurance/TPA, wallet, coupons, corporate rate cards.  

### 12. Finance — **P1**
- **Reuse:** ledger-service, day book patterns.  
- **New:** Doctor/referral commission rules, CC settlement runs, TDS hooks.  
- **Phase C:** CC settlement draft/post from received sample volumes (`/path-lab/settlement`); posts Dr 5500 / Cr 2000 / Cr 2300 TDS via ledger-service.  

### 13. Inventory (reagents) — **P1**
- **Reuse:** stock-service lots/batches.  
- **New:** Auto-consumption rules on accession/result; kit AMC/calibration calendar.  
- **Phase C:** `lab_reagent_rules` consumeOn `ACCEPT` | `RESULT` | `COLLECT`; FEFO reserve/commit (soft-fail).  

### 14. Quality (NABL) — **P1**
- **New:** IQC lots, Westgard rules, EQAS rounds, CAPA, deviations, risk log, machine maintenance.  
- **Pack:** `PACK_LAB_QUALITY` → stored as `LAB_QUALITY` (PATH_LAB default).  
- **Phase C:** IQC lockouts (auto-CAPA), EQAS submit with peer z-score (FAIL → CAPA), CAPA board.  
- **Phase D quality:** deviations (HIGH → CAPA), risk register (likelihood×impact), instrument PM/calibration/AMC.  

### 15. Reports / MIS — **P0–P1**
- **Reuse:** reporting-service + lab PDF.  
- **New:** TAT, pending, referral, CC, QC, growth MIS; export CSV/PDF.  

### 16. Communication — **P1**
- **Reuse:** notification-service.  
- **New:** WhatsApp report link + QR, patient portal hooks.  

### 17. Referral management — **P1**
- **Reuse:** fieldforce + referring doctor fields.  
- **New:** Targets, conversion funnel, hospital/corporate accounts.  

### 18. CRM — **P2**
- **Reuse:** fieldforce leads.  
- **New:** ME visit plans for doctors, pipeline stages.  

### 19. Home collection — **P2**
- **Reuse:** homeCollection booking.  
- **New:** Phlebo assignment, GPS, route optimize, COD.  
- **Phase D network:** `lab_home_collection_jobs` + GPS check-in + nearest-neighbor optimize; `lab_network_nodes` (HUB/CC/FRANCHISE).  
- **Pack:** `LAB_NETWORK` (PATH_LAB default with `LAB_QUALITY`).  

### 20. Camps — **P2**
- Bulk register/bill/report; school/corporate templates.  

### 21. AI — **P3 (Available)**
- **Available:** rule engine + optional OpenAI-compatible LLM (`lab.llm.*` / `LAB_LLM_DRAFT`); audited; never auto-releases.  
- **Available:** Rx text → panel suggest (`LAB_RX_OCR` / heuristic or LLM).  

### 22. Mobile apps — **P2 (PWA done)**
- **Available:** installable PWA (`manifest.webmanifest` start `/pwa`), role tiles (phlebo/tech/accession/reports/micro/histo), barcode sample status lookup, SW freshness cache for lab read APIs.  
- Native wrappers later if metrics demand.  

### 23. Dynamic configuration — **P1**
- Lab **rule engine** inside order-service (or dedicated `lab-rules`); label/report designers; do **not** hijack school form-builder unless shared platform is intentional.  

### 24. Security — **P0 ongoing**
- Tenant/branch isolation, audit on report amend, e-sign, optional 2FA/OTP for release, IP allowlist (wholesale pattern).  

### 25. Integrations — **P1–P3 (Available)**
- **Available:** FHIR R4 export + **push subscriptions** on release; NDHM ABHA verify/OTP (`lab.ndhm.mode=sandbox|live`); pack `LAB_ECOSYSTEM`.  
- **Later:** full ABDM HIU/HIP data pull, WhatsApp, Excel import.  

---

## 8. Suggested data model additions (Phase B+)

```
lab_samples (id, tenant, shop, branch, lab_order_id, barcode, sample_type,
             container_type, tube_color, collected_at, collector_id, status, ...)
lab_sample_events (sample_id, event_type, at, by_user, notes, from_shop, to_shop)
lab_instruments (id, shop, vendor, model, protocol, endpoint, active)
lab_instrument_channels (instrument_id, test_product_id, unit_map, ...)
lab_qc_runs / lab_qc_points
lab_reference_ranges (test_id, sex, age_min, age_max, low, high, critical_*)
```

Align naming with existing Flyway + `BranchScopedEntity`.

---

## 9. API design principles

- Keep clinical APIs under `/api/v1/sales-admin/lab-...` **or** introduce `/api/v1/lab/**` gateway route still targeting order-service (cleaner long-term).  
- Instrument adapter: internal-only `/internal/lab-instruments/**` + gateway deny public.  
- Idempotent result import keys (analyzer message id).  
- Always enforce `MANAGE_LAB_*` + tenant/shop context from gateway headers.

---

## 10. Angular UX plan

| Screen | Pattern |
|--------|---------|
| Lab Command Center | KPI cards + critical lane (evolve dashboard) |
| Accession | Barcode scan → container checklist → print labels |
| Worklist Kanban | Collect / Process / Validate / Release columns |
| Validation desk | Side-by-side history, delta, e-sign |
| Instrument console | Online status, failed messages, remap channels |
| QC board | Levey-Jennings (later), fail locks |

Reduce clicks vs Crelio-style dense forms: **scan-first**, defaults from catalog, keyboard F-keys like wholesale dayboard.

---

## 11. Roles & permissions (extend catalog)

| Role | Permissions |
|------|-------------|
| LAB_RECEPTION | register, book, bill |
| PHLEBOTOMIST | collect, home routes |
| LAB_TECH | process, enter/import results |
| PATHOLOGIST | validate, sign, amend |
| LAB_MANAGER | TAT, QC, inventory, users |
| CC_MANAGER | centre dispatch/settlement |
| OWNER / SUPER_ADMIN | all + finance |

Add fine-grained: `MANAGE_LAB_QC`, `MANAGE_LAB_INSTRUMENTS`, `RELEASE_LAB_REPORTS`.

---

## 12. Phased delivery

### Landed (A–E)

| Phase | Focus | Outcome |
|-------|-------|---------|
| **A** | Harden core | Accession UX, TAT, critical/delta, e-sign, dept catalog |
| **B** | Sample + instruments | Sample entity + uni-dir adapter + ACK (**done**) |
| **C** | Quality + money + stock | **Done** — IQC/EQAS/CAPA, reagent ACCEPT+RESULT, CC settle + ledger/TDS |
| **D** | Network + specialty + mobile | **Done** — network + micro/histo specialty + installable PWA hub |
| **E** | AI + FHIR/ABHA depth | **Done** — NDHM ABHA, FHIR push, LLM drafts, Rx→panels |

### Next roadmap (highest business value first)

| Phase | Focus | Outcome |
|-------|-------|---------|
| **1** | Commercial & ops | **In progress / landed (V73)** — configurable barcode + label reprint, doctor commissions, multi rate cards, specimen storage/dispose, worklist TAT overdue, hospital release webhooks; UI: `/path-lab/barcode-settings`, `/commissions`, `/rate-cards` |
| **2** | Clinical quality & instruments | Bi-dir HL7/ASTM, Levey-Jennings + full Westgard, formula/pregnancy ranges, multi-level approval config, report template builder |
| **3** | Network growth & portals | CC portal + center pricing, patient/doctor portals, WhatsApp report+QR, camps, reagent auto-PO, notification event matrix |
| **4** | Platform differentiation | Lab rules/reflex engine, ABDM HIU/HIP depth, CRM/ME funnels, CAP/antibiogram, native wrappers if metrics demand |

---

## 13. Success metrics

- Median TAT by department  
- % auto-imported results  
- Critical notification time  
- Report amend rate  
- Collection-centre leakage (unbilled samples)  
- IQC failure lockouts honored  
- Commission settlement cycle time  
- % results from analyzer vs manual  

---

## 14. Next engineering actions

1. Start **Phase 1** on `feature/polyclinic-ipd-ops` (or `feature/lab-lis-phase1`): barcode config + commission rules + rate cards.  
2. Wire live ABDM credentials in prod secrets (`LAB_NDHM_*`, `LAB_LLM_API_KEY`).  
3. Partner webhook hardening (HMAC, retries, DLQ).  
4. Keep Flyway additive (`V73+`); never break `/sales-admin/lab-*`.  

**Do not** start a separate Path Lab repository.

---

## Document control

| Item | Value |
|------|-------|
| Owner | SugamFlow product architecture |
| Related | `SugamFlow-PATH-LAB-Client-Brief.md`, canvas `path-lab-lims-architecture` |
| Implementation | Phase A–E complete incl. NDHM/FHIR push/LLM/OCR depth |
