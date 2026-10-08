# SugamFlow CRM — Discovery & Gap Analysis (2026-08-09)

**Phase:** Discovery only (no large-scale implementation in this pass)  
**Scope:** Product sales CRM (`crm-service` + `crm-ui`) + ERP/FieldForce/subscription boundaries  
**Supersedes for planning:** Older “no crm-service” claims in `CRM_LEAD_MANAGEMENT_GAP_ANALYSIS.md`  
**Companion audit:** `CRM_ENTERPRISE_AUDIT_2026.md` (2026-07-31) — this doc **re-scores** after V11–V21 + Accounts UI

**Product north star (from brief):**  
> Simplicity of HubSpot + configurability of Zoho + intelligence of Dynamics + deep SugamFlow ERP + WhatsApp + multi-tenant SaaS  
> Not a Salesforce clone.

---

## 1. Current architecture overview

```
crm-ui (:4500)  ──JWT──► auth-service
                 └──/api/v1/crm/**──► crm-service (:8095, crmdb, Flyway V1–V21)
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           ▼                               ▼                               ▼
  subscription-service            notification-service              convert adapters
  FEATURE_CRM*                    WA/SMS/Email (opt-in)             user-service (SHOP_CUSTOMER)
                                                                   fieldforce (FIELD_FORCE)
                                                                   school inquiries (config)
                                                                   order-service (quote accept, opt-in)

Separate (do not merge):
  • Field Force merchant leads  → fieldforce-service + shop-management-ui
  • Super Admin “CRM Renewals”  → subscription-service /api/subscription/crm/**
```

| Layer | Location | Notes |
|-------|----------|-------|
| Backend | `D:\sugamFlow\crm-service` | Modular monolith; ~29 controllers; ~44 entities |
| Frontend | `D:\sugamFlow\crm-ui` | Angular 16; **single AppComponent** tabs (no feature routes) |
| Gateway | `gateway-service` | `/api/v1/crm/**` + public capture/adapters/CSAT |
| Shop UI | `shop-management-ui` | **No sales CRM module** — FF workspace + renewals tab only |
| Templates | `crm-templates/*.json` | GENERIC, EDUCATION, RETAIL, MEDICAL_DISTRIBUTOR |

**Auth / tenancy:** JWT via gateway; CRM requires `X-Tenant-Id` (+ optional `X-User-Id`). LocalStorage keys in crm-ui (`sf.*`) differ from shop UI (`auth-*`).

**Entitlements:** `CrmEntitlementGuard` + catalog flags (`FEATURE_CRM`, `_QUOTE`, `_CAMPAIGN`, `_AI`, `_SEQUENCES`, `_WHATSAPP/_SMS/_EMAIL`, `_APPROVAL`, `_AUTOMATION`, `_API`, `_CASES`). Local default: entitlement **off**.

---

## 2. Feature inventory (what exists today)

| Area | Status | Evidence |
|------|--------|----------|
| Workspace bootstrap + industry templates | **Done** | `/workspaces/bootstrap`, templates JSON |
| Configurable pipelines / stages | **Done** | `crm_pipeline`, `crm_stage` |
| Leads CRUD, status, stage move, assign | **Done** | `CrmLeadController` |
| Round-robin / team members | **Done** | `AssignmentController`, V2 |
| Lead import CSV/XLSX | **Done** | `/leads/import` |
| Duplicate detect + merge | **Partial** | `/duplicates`, `/merge` — rules not fully admin-configurable |
| Notes + timeline | **Done** | V3 |
| Lead convert → ERP targets | **Partial** | `LeadConvertService`; opt-in live clients + sinks |
| Accounts + contacts | **Partial** | APIs + **Accounts tab in UI**; weak Customer 360 |
| Opportunities + stage move | **Done** | Kanban/list in UI |
| Close / win-loss reasons | **Done** | V12 |
| GST quotations + PDF + revise + approval | **Done** | V4/V13/V16; `FEATURE_CRM_QUOTE` |
| Payment links | **Stub** | STUB provider |
| Quote → order sync | **Partial** | `OrderClient` when `crm.order.enabled` |
| Campaigns + public web capture | **Done** | V7 |
| Sequences (cadence) | **Partial** | V5; needs notification + catalog |
| Lead scoring rules | **Partial** | V8 score rules; UI/admin polish needed |
| SLA tasks / aging | **Partial** | Task list ≠ full My Day |
| Calendar / call logs | **Partial** | Ops APIs; no first-class Activities module |
| Stage automation | **Partial** | V14; not full trigger/action engine |
| Forecast commits | **Partial** | V19 |
| Cases + CSAT | **Partial** | V17–V18; thin UI |
| Tags / attachments | **Partial** | V15; attachment storage stub |
| AI assist | **Partial / Heuristic** | V9; `HEURISTIC` default; HTTP LLM optional |
| Usage meters / seats | **Partial** | V20 |
| Territories / journeys / connectors | **Schema only** | V21 labs — **no controllers** |
| CTI / SSO / payment | **Stub** | SPI defaults |
| Customer 360 over ERP orders/invoices | **Missing** | No unified account timeline from ERP |
| My Day work queue | **Missing** | Analytics summary only |
| BANT / qualification checklist | **Missing** | — |
| Generic workflow engine | **Missing** | Stage rules ≠ full automation |
| CRM-specific RBAC (own/team/org) | **Missing** | Soft tenant + field ACL partial |
| Production multi-route UI shell | **Missing** | Pilot monolith |

---

## 3. Industry benchmark (summary)

| Capability | SF / Dynamics | HubSpot | Zoho | Pipedrive / Freshsales | SugamFlow today |
|------------|---------------|---------|------|------------------------|-----------------|
| Core lead→deal→activity | Strong | Strong | Strong | Strong | **Good pilot** |
| Configurable pipeline | Strong | Strong | Strong | Strong | **Good** |
| GST commercial / quotes | Localize | Weak | Strong | Medium | **Strong differentiator** |
| WhatsApp-native | Add-on | Improving | Good | Medium | Adapter via notification |
| ERP quote→order→invoice | Strong | Medium | Strong | Weak | **Partial — biggest moat if finished** |
| Field GPS / beats | Add-on | Weak | Add-on | Weak | **Via FieldForce (keep separate)** |
| Cadences | Strong | Strong | Good | Good | Partial |
| Automation engine | Strong | Strong | Strong | Medium | Partial (stage-only) |
| Forecasting | Strong | Good | Good | Medium | Partial |
| Cases / service | Strong | Hub | Desk | Medium | Thin |
| AI NBA / summaries | Strong | Strong | Good | Medium | Heuristic |
| Customer 360 | Strong | Strong | Strong | Medium | **Gap** |
| My Day / mobile | Strong | Strong | Good | Strong | **Gap** |
| Configurable scoring | Strong | Strong | Strong | Medium | Partial |
| Territory / hierarchy | Strong | Add-on | Good | Medium | Schema-only |

**SugamFlow should win on:** CRM + ERP + FieldForce + Indian GST quotes + WhatsApp + vertical templates + subscription packaging — not on cloning Salesforce inbox/CPQ depth first.

---

## 4. Gap matrix (priority)

Priority: **P0** critical foundation · **P1** competitive · **P2** advanced · **P3** future

| Capability | Industry standard | SugamFlow existing | Gap | Pri | Recommendation |
|------------|-------------------|--------------------|-----|-----|----------------|
| Lead create/list/kanban/assign/import | Core | Yes | Polish edit/PUT + filters | P0 | Complete lead update UX; keep APIs |
| Lead conversion wizard (acct/contact/opp) | Core | Convert to ERP targets | Weak party linking UX | P0 | Guided convert: new/existing account+contact+optional opp |
| Duplicate rules (phone/email/GSTIN) | Core | Basic dup/merge | Configurable rules UI | P0 | Admin duplicate rule engine on existing endpoints |
| Accounts / contacts | Core | APIs + basic UI | Incomplete detail tabs | P0 | Record detail shell (overview/timeline/…) |
| Customer 360 (ERP reuse) | Core mid-market | Convert events only | Orders/invoices/payments missing | P0 | Read-only federation from order/user/payment — **no duplicate tables** |
| Opportunity pipeline + close reasons | Core | Yes | Aging/velocity widgets | P1 | Extend analytics; keep stages configurable |
| Activities engine + My Day | Core | Notes/calls/tasks/calendar | No unified activity + My Day | P0 | Activity aggregate + My Day API/UI |
| Lead scoring admin | Competitive | Rules + events | Operator UI + Hot/Warm/Cold | P1 | Scoring rule UI; categories derived |
| Qualification (BANT/custom) | Competitive | Missing | Full | P1 | Config checklist on lead; no hard-code BANT-only |
| Sequences / cadence | Competitive | Partial | Reliability + stop conditions | P1 | Harden + notification entitlement |
| Workflow automation | Competitive | Stage automation | Triggers/actions limited | P1 | Expand automation; reuse rule-engine if available |
| WhatsApp / omnichannel timeline | India SMB | Send via notification | Unified inbox thin | P1 | Provider abstraction; timeline on party |
| Territory & assignment rules | Mid-market | RR + GEO hints | Territory BC missing | P2 | Implement V21 territory + assignment rules |
| Team hierarchy RBAC | Mid-market | Soft | Own/team/org scopes | P0 | CRM roles via user-service templates |
| Sales dashboard / reports | Core | Analytics summary | Manager/exec widgets | P1 | Configurable widgets; export jobs |
| Forecasting | Mid-market | Commits API | Best/commit/coverage UX | P2 | Build on V19 |
| Quote → order → invoice | Differentiator | Partial | Not default path | P0 | Enable + UX; reuse order-service |
| Cases | Mid-market | Thin | Depth | P2 | Grow or integrate support BC |
| AI summaries / NBA | Advanced | Heuristic + HTTP | Provider + audit/cost | P2 | Keep LLM SPI; gate `FEATURE_CRM_AI` |
| Journeys / marketplace connectors | Advanced | V21 schema | No APIs | P3 | After P0–P1 |
| Production UI shell | Product | Pilot monolith | Routes, mobile, shell | P0 | Split crm-ui routes; match shop shell quality |
| Entitlement enforcement | SaaS | Partial | Leakage risk | P0 | Guard every module; hide UI |
| Attachments real storage | Core | Stub | Files | P1 | Reuse platform object storage pattern |
| CTI / SSO / payment | Enterprise | Stub | — | P2–P3 | SPI only until customer demand |

---

## 5. Target architecture (design — not implementing now)

### Domain model (configuration-first)

- **Workspace** (tenant) → Pipelines/Stages → Leads / Opportunities  
- **Account** ↔ **Contact** ↔ Lead/Opp (many-to-many stakeholders later)  
- **Activity** polymorphic → lead | contact | account | opportunity  
- **Automation** = Trigger × Condition × Action (config)  
- **Sequence** = ordered steps with stop rules  
- **ScoreRule** / **DuplicateRule** / **AssignmentRule** / **QualificationSchema** as config  
- **AI** = `LlmProvider` SPI + prompt templates + audit/usage  
- **Comms** = notification-service providers only  

### Service boundaries (do not create duplicates)

| Concern | Owner |
|---------|--------|
| CRM domain | `crm-service` |
| Identity / RBAC templates | `auth-service` / `user-service` |
| Subscription / FEATURE_* | platform subscription-service |
| WA/SMS/Email transport | `notification-service` |
| Orders / invoices / AR | `order-service` (+ finance as exists) |
| Products / stock | product/stock services |
| Field visits / GPS | `fieldforce-service` |
| Renewals ops CRM | subscription-service (keep separate) |

### Events (target)

`LeadCreated|Assigned|Converted`, `OpportunityStageChanged`, `ActivityOverdue`, `QuoteAccepted`, `SequenceStepDue` → automation + analytics consumers.

---

## 6. Database / API / UI change themes

### Database

- **Reuse** existing `crm_*` tables; extend via Flyway only.  
- **Do not** copy shop customer/order/payment tables into crmdb.  
- **New tables only when needed:** e.g. `crm_activity` (if tasks/calls/calendar remain fragmented), `crm_duplicate_rule`, `crm_qualification_schema`, assignment-rule tables; activate V21 territory when productized.  
- Never rename/drop production columns without compatibility migrations.

### API

- Keep `/api/v1/crm/**` backward compatible.  
- Add: My Day, Customer 360 aggregate (read model), activity CRUD unify, qualification, duplicate-rules admin, deeper automation.  
- Prefer BFF-style aggregate endpoints over N+1 from Angular.

### UI

- Evolve `crm-ui` from tab monolith → routed modules: Home/My Day, Leads, Accounts, Opportunities, Pipeline, Activities, Dashboard, Reports, Settings.  
- Record detail pattern: header + tabs (Overview, Timeline, Activities, ERP, Audit).  
- Deep-link from shop-management-ui optional later; do not force merge apps in Phase 1.

### Subscription mapping (target)

| Plan | Include |
|------|---------|
| CRM Basic / Starter | Leads, contacts, activities, basic pipeline |
| Professional | Sequences, automation, WhatsApp, advanced reports, forecasting |
| Enterprise | AI, territory, advanced analytics, API/adapters, SSO |

Every new capability ships with catalog flag + guard + UI hide.

---

## 7. Security / performance / compatibility

**Security:** Enforce entitlement in non-local; object-level owner/team scope; harden public capture HMAC; never expose LLM keys to UI; tenant isolation tests mandatory.

**Performance:** Server-side page/filter/sort; indexes on `(tenant_id, stage_id, updated_at)`; async import/export; autocomplete not huge dropdowns; lazy Angular routes.

**Compatibility:** Preserve Field Force `/api/v1/leads`; preserve renewals CRM; preserve convert event history; local entitlement-off smoke path.

---

## 8. Implementation roadmap (adjusted sprints)

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **0 — Discovery** | This document | Approved baseline |
| **1 — Foundation** | Entitlement enforce; CRM RBAC scopes; crm-ui routing shell; lead PUT/edit | Safe SaaS packaging + usable shell |
| **2 — Party + convert** | Account/contact detail; convert wizard; duplicate rules | Clean Lead→Account→Contact→Opp |
| **3 — Customer 360 + ERP** | Federated orders/invoices/payments; quote→order default path | ERP moat visible in CRM |
| **4 — Activities + My Day** | Unified activities; My Day work queue | “What should I do today?” |
| **5 — Pipeline analytics** | Aging, velocity, won/lost, forecast UX | Manager visibility |
| **6 — Automation + cadence** | Expand triggers/actions; harden sequences | Sales automation parity |
| **7 — Omnichannel** | Timeline + WA/SMS/Email via notification | India SMB channel |
| **8 — Scoring + qualification** | Rule UI; Hot/Warm/Cold; qualification schemas | Configurable qualification |
| **9 — Dashboards + reports** | Role dashboards; export | Reporting baseline |
| **10 — AI + labs** | LLM provider, summaries/NBA behind flag; territory if demanded | Differentiated intelligence |

Do **not** start Sprint 10 AI or V21 journeys until P0 Customer 360 / My Day / entitlements land.

---

## 9. Dependency map (change impact)

| Change | Consumers | Risk |
|--------|-----------|------|
| Entitlement on by default | All crm-ui tabs | Local/dev must keep profile override |
| Lead convert UX | user-service, FF, school | Must keep existing targetSystem contracts |
| Quote→order | order-service | Idempotent accept; no double orders |
| Activity unify | Existing tasks/calls/calendar | Migrate or facade — don’t break ops APIs |
| crm-ui routing | Pilot users | Feature-flag old tab shell if needed |
| Public capture | Gateway allowlist | Security regression if misconfigured |

---

## 10. Test themes (for later implementation)

- Tenant isolation (cross-tenant ID attack)  
- Entitlement deny/allow matrix  
- Lead convert new vs existing party; duplicate merge  
- Pipeline stage move + close reasons  
- Sequence stop on convert/won  
- Quote accept → order once  
- My Day overdue + hot leads  
- Notification provider failures soft-fail  

---

## 11. Decision for engineering

**Do not rebuild CRM.** Extend `crm-service` / `crm-ui`.  
**Do not** merge Field Force or renewals CRM into product CRM.  
**Do not** hard-code industry logic — templates + config only.  
**Next gate:** Product + eng sign-off on this gap matrix → start Sprint 1 only.

---

*Inventory sources: `crm-service` (Flyway V1–V21, web/*, entitlement, convert), `crm-ui` AppComponent/API, gateway routes, user-service/fieldforce ingest, `CRM_ENTERPRISE_AUDIT_2026.md`, platform subscription CRM feature flags.*
