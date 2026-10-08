# SugamFlow Generic Enterprise CRM — Architecture Blueprint

**Product modes:** Standalone SaaS CRM **and** integrated ERP module  
**Principle:** Business-agnostic · Metadata-driven · Zero ERP schema impact · Backward compatible  
**Date:** 2026-07-30  
**Companion canvas:** [sugamflow-crm-platform-blueprint.canvas.tsx](file:///C:/Users/Suman%20Kumar%20Thakur/.cursor/projects/d-school/canvases/sugamflow-crm-platform-blueprint.canvas.tsx)  
**Related:** `docs/CRM_LEAD_MANAGEMENT_GAP_ANALYSIS.md`

---

## 1. Executive summary

SugamFlow will offer a **generic CRM Lead Management Platform** that:

1. **Sells alone** — customers who only need leads, pipelines, follow-ups, quotes, and sales teams.  
2. **Integrates loosely** with any SugamFlow ERP (School, Hospital, Pharmacy, Retail, …) via **events/APIs**, never shared databases or hardcoded domain logic.  
3. **Does not impact** existing ERP modules, APIs, or schemas when CRM is absent or disabled.

**Recommended deployable unit (MVP → Advanced):** one **`crm-service`** (modular monolith) + **`apps/crm-ui`**, reusing **auth**, **user**, **subscription**, **notification**, **gateway**, and School **form-builder** / **rule-engine**. Split into more services only when scale or team boundaries require it.

---

## 2. Gap analysis of current architecture

### 2.1 What exists

| Area | Today | Implication for CRM |
|------|-------|---------------------|
| Gateway `:9090` | JWT → `X-Tenant-Id` / `X-Shop-Id` | CRM uses same tenant model |
| auth / user | Shared login & users | CRM-only orgs are first-class |
| subscription-service (School) | Catalog modules/features/limits | Sell CRM SKUs without breaking shop plans |
| notification-service | EMAIL/SMS/WHATSAPP/PUSH | Outbound hub for CRM sequences |
| form-builder / rule-engine | School config engines | Forms + workflow conditions over HTTP |
| fieldforce-service | Merchant acquisition CRM | Keep isolated; optional later facade |
| CRM Renewals | Tenant subscription pipeline | Keep in subscription-service; not sales CRM |
| RabbitMQ | Used narrowly (product import) | Extend for CRM↔ERP domain events |
| ModuleCode.CRM | Entitlement label only | No runtime CRM product yet |

### 2.2 Coupling risks to avoid

| Risk | Why it hurts | Mitigation |
|------|--------------|------------|
| CRM tables inside shop-service / school DBs | Breaks ERP upgrades; blocks standalone sell | Dedicated `crmdb` |
| CRM imports product/stock/order entities | Hardcodes verticals | External refs + events only |
| Using `user-service` `/customers` as CRM Account | Couples to retail customer master | CRM Account/Contact own model |
| Synchronous ERP calls on every lead open | Outages cascade | Async events; cache entitlements |
| Hardcoded Hospital/School pipelines in Java | Violates config-driven rule | Industry **templates** (data) |
| 10 new microservices on day 1 | Ops cost, inconsistent tx | Modular monolith first |

### 2.3 Non-impact guarantee (acceptance criteria)

- Tenants without CRM entitlements: **no CRM routes in UI**, gateway may 403 CRM APIs, **zero** schema migrations on ERP DBs.  
- Existing `/api/v1/leads/**` (Field Force) and `/api/subscription/**/crm/**` (Renewals) **unchanged**.  
- shop/product/stock/order/doctor/appointment flows **binary-compatible**.  
- Enabling CRM is **opt-in** via subscription catalog.

---

## 3. Recommended CRM bounded context

```
┌─────────────────────────────────────────────────────────────┐
│                     CRM Bounded Context                       │
│  crm-ui  ·  crm-service (modules)  ·  crmdb                   │
│  Owns: Lead, Account, Contact, Opportunity, Quote, Activity,  │
│        Pipeline metadata, Assignment, Workflow runtime,       │
│        Campaign, Comms log, CRM analytics, AI assistants      │
└───────────────┬─────────────────────────────┬─────────────────┘
                │ HTTP (reuse)                │ Events (optional)
    auth · user · subscription ·              │ RabbitMQ
    notification · form-builder ·             │ erp.*  ↔  crm.*
    rule-engine · gateway                     │
                                              ▼
                               ERP Bounded Contexts (unchanged)
                               shop · school · hospital · …
```

**CRM is not** Field Force and **not** Platform Renewals. Those remain specialized contexts. Long-term, both may publish/consume the same event vocabulary or map into CRM via adapters — without rewriting them in MVP.

---

## 4. Microservice topology decision

### 4.1 Do **not** start with 10 services

Proposed list (`lead-service`, `customer-service`, `opportunity-service`, …) is a **logical** module map, not day-1 deployables.

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| 10 microservices | Independent scale | Deploy/tx/debug hell for SMB SaaS | Later, selective |
| Modular monolith `crm-service` | One deploy, clear packages, ACID where needed | Must enforce module boundaries in code | **MVP + Advanced** |
| Expand fieldforce-service | Reuses lead code | Merchant-specific; wrong for standalone CRM brand | **No** as core |

### 4.2 Internal modules inside `crm-service`

| Module | Responsibility |
|--------|----------------|
| `crm-core` | Lead, Contact, Account, Pipeline, Stage, Tag, Note, Attachment, CustomField |
| `crm-deal` | Opportunity, Quotation, Approval, Won/Lost |
| `crm-activity` | Task, Call, Meeting, Timeline |
| `crm-automation` | Assignment rules, Workflow runtime, SLA |
| `crm-campaign` | Campaigns, attribution |
| `crm-comms` | CommunicationLog; calls notification-service |
| `crm-analytics` | Aggregates / projections for dashboards |
| `crm-ai` | Optional add-on (summaries, score, NBA) |
| `crm-integration` | Webhooks ingest, ERP event consumers, convert publishers |

**Split candidates (Enterprise phase):** `crm-analytics`, `crm-ai`, `crm-campaign` if CPU/queue load justifies.

### 4.3 Interaction diagram (logical)

```
[crm-ui] → [gateway] → [crm-service]
                ↓
     [auth-service] [user-service]
     [subscription-service] ── entitlements (cached)
     [notification-service] ← outbound WA/SMS/Email
     [form-builder-service] ← form schemas
     [rule-engine-service]  ← evaluate conditions (or embed DSL)
                ↕ RabbitMQ
     [ERP adapters]  (school-admission, shop, hospital, …)
```

---

## 5. Generic data model

### 5.1 Design rules

1. **No industry-specific columns** (no `admission_class`, `patient_id`, `sku_id` on Lead).  
2. Domain extras live in **`attributes` JSONB** validated by **form definition**.  
3. Links to ERP use **`external_refs`**: `{ "system": "school-admission", "id": "..." }`.  
4. Every mutable entity: `tenant_id`, soft delete, audit fields, `owner_user_id`, optional `team_id`.

### 5.2 Core tables (illustrative)

```sql
-- Tenant CRM workspace (may map 1:1 to org/shop or standalone org)
crm_workspace (id, tenant_id, name, template_code, timezone, currency, settings jsonb)

crm_pipeline (id, tenant_id, code, name, object_type /* LEAD|OPPORTUNITY */, is_active)
crm_stage (id, pipeline_id, code, name, sort_order, probability, is_won, is_lost)

crm_account (id, tenant_id, name, account_type /* COMPANY|INDIVIDUAL */, attributes, external_refs, ...)
crm_contact (id, tenant_id, account_id, name, email, phone, attributes, ...)
crm_lead (id, tenant_id, account_id, contact_id, pipeline_id, stage_id, status, source_code,
          priority, score, owner_user_id, team_id, amount, currency, attributes, external_refs, ...)

crm_opportunity (id, tenant_id, account_id, lead_id, pipeline_id, stage_id, name, amount,
                 probability, expected_close, attributes, ...)
crm_quotation (id, tenant_id, opportunity_id, version, status, totals jsonb, lines jsonb,
               tax_snapshot jsonb, pdf_uri, accepted_at, ...)
crm_quotation_approval (id, quotation_id, status, requested_by, decided_by, ...)

crm_activity (id, tenant_id, type, subject, related_type, related_id, due_at, status, ...)
crm_task (...), crm_call (...), crm_meeting (...)  -- or single activity + type

crm_note, crm_attachment, crm_tag, crm_tag_link
crm_timeline_event (id, tenant_id, related_type, related_id, event_type, payload, occurred_at)
crm_communication_log (id, tenant_id, channel, direction, related_*, provider_msg_id, body_preview, ...)

crm_campaign, crm_campaign_member
crm_lead_source (tenant configurable taxonomy)
crm_lost_reason, crm_won_reason
crm_assignment_rule (id, tenant_id, priority, when_json, then_json, is_active)
crm_workflow_def (id, tenant_id, trigger, graph_json, is_active)
crm_workflow_instance (id, def_id, related_*, state, wait_until, ...)
crm_approval_policy (...)

crm_custom_field_def (id, tenant_id, object_type, key, data_type, options, ...)
-- values preferably inside attributes JSONB keyed by field key

crm_score_event (id, lead_id, delta, reason, source)
crm_audit_event (id, tenant_id, actor, action, object_type, object_id, before, after, at)
```

Indexes: `(tenant_id, owner_user_id, stage_id)`, `(tenant_id, score)`, GIN on `attributes` as needed.

### 5.3 Dynamic fields

- Admin defines fields → stored in `crm_custom_field_def` **and/or** School form-builder `form_key = crm.lead.{template}`.  
- UI renders from metadata; API accepts `attributes` map; server validates against definition.  
- Mandatory / visibility / field ACL = metadata, not code.

---

## 6. Dynamic configuration framework

Admin (tenant) configures — all data-driven:

| Config | Storage |
|--------|---------|
| Business / industry template | `crm_workspace.template_code` |
| Pipelines & stages | `crm_pipeline` / `crm_stage` |
| Lead statuses, priorities, sources | Taxonomies per tenant |
| Lost / won reasons | Taxonomies |
| Activity / follow-up types | Taxonomy + activity type enum extension table |
| Custom forms & validation | form-builder + `crm_custom_field_def` |
| Assignment rules | `crm_assignment_rule.when/then` |
| Approval workflows | `crm_approval_policy` + workflow graph |
| Feature gates | subscription catalog |

**Unlimited:** pipelines, stages, business units (teams), products (as CRM catalog items in attributes or `crm_product_ref` light table — **not** stock-service SKUs unless linked via external_ref).

Example pipelines (templates only): Sales · Support · Renewal · Admission · Patient · Distributor · Service.

---

## 7. Industry template strategy

Onboarding: **Select industry → Apply template pack** (idempotent seed).

Templates (minimum set):

Real Estate · Education · Hospital · Clinic · Medical Distributor · Pharmacy · Manufacturing · Retail · Insurance · Banking · Automobile · Travel · Logistics · Construction · IT Services · Consultancy

Each pack includes:

- Pipelines + stages + probabilities  
- Form definitions (lead/account/opportunity)  
- Source / lost / won taxonomies  
- Sample assignment + follow-up workflows  
- Default dashboards / report defs  
- Optional convert adapter mapping hints (`external_system` codes)

**Critical:** Templates are **JSON/SQL seed data** versioned in repo (`crm-templates/education/v1.json`). Never `if (template == HOSPITAL)` in core services — only template application service reads pack files.

---

## 8. Event-driven integration model

### 8.1 Transport

- Extend **RabbitMQ** (already in platform).  
- Topic exchange: `sugamflow.domain`.  
- Routing keys: `erp.*.inquiry.created`, `crm.lead.converted`, `crm.quote.accepted`, …  
- Consumers idempotent on `event_id`.

### 8.2 Contract shape

```json
{
  "eventId": "uuid",
  "eventType": "erp.inquiry.created",
  "occurredAt": "ISO-8601",
  "tenantId": "string",
  "sourceSystem": "school-admission",
  "payload": {
    "externalId": "ADM-123",
    "displayName": "...",
    "phone": "...",
    "email": "...",
    "suggestedTemplate": "education",
    "attributes": { }
  }
}
```

### 8.3 Direction

| Direction | Example | Handler |
|-----------|---------|---------|
| ERP → CRM | Admission / walk-in / dealer inquiry | `crm-integration` creates/updates Lead |
| CRM → ERP | Lead converted / quote accepted | ERP adapter creates student/customer/order |
| None | Standalone CRM | Convert marks status; no ERP consumer required |

### 8.4 Adapter ownership

- **ERP owns** adapters that publish inquiries and consume convert events.  
- **CRM owns** generic ingest + outbound publish.  
- Adding PathLab CRM does **not** change CRM core — only a new adapter + template.

---

## 9. API contracts (additive, non-breaking)

Base: `/api/v1/crm/**` via gateway. Auth: existing JWT + tenant headers.

### 9.1 Core (sketch)

```
POST   /api/v1/crm/workspaces/bootstrap          # apply template
GET    /api/v1/crm/metadata/pipelines
POST   /api/v1/crm/leads
GET    /api/v1/crm/leads?view=&filter=
POST   /api/v1/crm/leads/import                  # CSV/Excel
POST   /api/v1/crm/leads/{id}/assign
POST   /api/v1/crm/leads/{id}/score/recompute
POST   /api/v1/crm/leads/{id}/convert            # emits event
POST   /api/v1/crm/opportunities
POST   /api/v1/crm/quotations
POST   /api/v1/crm/quotations/{id}/share
POST   /api/v1/crm/activities
GET    /api/v1/crm/timeline/{objectType}/{id}
POST   /api/v1/crm/workflows
POST   /api/v1/crm/webhooks/ingest/{channel}     # Meta, Google, WA, forms
GET    /api/v1/crm/analytics/funnel
GET    /api/v1/crm/analytics/forecast
```

### 9.2 Preserved (do not break)

- `/api/v1/leads/**` — Field Force  
- `/api/subscription/**/crm/**` — Renewals  
- All ERP `/api/v1/**` and `/api/school/**`

### 9.3 Public ingest (API add-on)

- API keys scoped per tenant; rate limits from subscription limits.

---

## 10. Workflow engine design

**No-code graph** stored as JSON on `crm_workflow_def`.

Triggers: LeadCreated · StageChanged · ScoreCrossed · InactivityDays · FormSubmitted · QuoteSent · Manual

Nodes: Condition · Assign · Notify (channel) · CreateTask · Wait · Escalate · Webhook · SetField · AddTag

Execution: `crm-automation` worker (scheduled + event-driven). Prefer calling School **rule-engine** for condition DSL reuse where practical; keep CRM graph orchestration inside CRM to avoid blocking school upgrades.

Example:

```
IF source = WEBSITE → Assign Team A → Send WhatsApp → Create Follow-up
→ Wait 3d → IF no activity → Escalate Manager
```

---

## 11. Communication hub

Single chronological **timeline** projecting:

Email · WhatsApp · SMS · Calls · Meetings · Notes · Files · Internal comments · Tasks

Implementation:

- Writes go to `crm_communication_log` / `crm_timeline_event`.  
- Outbound via **notification-service**.  
- Inbound webhooks (WA) → append log → optional score events.  
- UI: Salesforce/HubSpot-style activity panel on record.

---

## 12. AI features (add-on)

All behind `FEATURE_CRM_AI` (+ usage limits):

Lead/Call/Meeting summary · Proposal generator · Follow-up / NBA · Lead score assist · Sentiment · Churn · Upsell/Cross-sell · Forecast assist · Copilot · Voice · Card/Doc OCR · Email/WhatsApp draft  

Run async; store results as timeline notes / score events. No AI in hot path without cache.

---

## 13. Subscription & licensing model

Reuse **School subscription-service** catalog (no breaking changes).

### Suggested SKUs

| SKU | Intent |
|-----|--------|
| CRM Starter | Leads, contacts, 1 pipeline, tasks, basic reports, user limit |
| CRM Professional | Multi-pipeline, quotes, sequences, API eligible |
| CRM Enterprise | SSO, field ACL, unlimited pipelines, SLA, audit export |
| Add-ons | AI · Sales Automation · WhatsApp · API · Storage · Extra users |

### Catalog modeling

- `business_type`: `CRM` (standalone) **and/or** attach CRM modules to existing vertical plans.  
- Modules: `CRM_CORE`, `CRM_QUOTE`, `CRM_AUTOMATION`, `CRM_CAMPAIGN`, `CRM_AI`.  
- Limits: `crm.max_users`, `crm.max_pipelines`, `crm.storage_mb`, `crm.ai_calls_month`.  

Enforcement: existing effective-config / entitlement cache pattern — **configure in Super Admin Platform Subscription; enforce in crm-service**, not in product/stock.

Standalone sell: create org with CRM plan only → `crm-ui` is default app; ERP modules not provisioned.

---

## 14. Security

| Control | Approach |
|---------|----------|
| Multi-tenant isolation | Every query filtered by `tenant_id` from JWT; no cross-tenant IDs |
| RBAC | Roles: CRM_Admin, Manager, Sales, ReadOnly — mapped in user-service |
| Field-level permissions | Metadata on custom fields + server-side strip |
| Row-level | Owner / team / role sharing rules |
| Audit | `crm_audit_event` + optional export (enterprise) |
| API | JWT + OAuth-ready clients; API keys for ingest add-on |
| SSO | Align with platform enterprise SSO controls when entitled |

---

## 15. UX blueprint

### 15.1 Apps

| App | Audience |
|-----|----------|
| `apps/crm-ui` | Standalone CRM customers + ERP users with CRM module |
| Optional embed | Deep-link from shop-management-ui / school-ui nav when entitled |

### 15.2 Screens

1. **Onboarding** — industry template → invite users → connect WhatsApp/API (optional)  
2. **Admin config** — pipelines, fields, reasons, assignment, workflows, templates  
3. **CRM home** — KPIs + my overdue + today  
4. **Lead / Opp workspace** — list | Kanban · record · timeline · composer  
5. **Quote builder** — tax snapshot, share, approve  
6. **Dashboards / reports** — funnel, aging, source, salesperson, forecast  
7. **Mobile-responsive** — check-in later with Field Force patterns if needed  

Patterns inspired by Salesforce / HubSpot / Zoho / Freshsales / Pipedrive / Dynamics — **within SugamFlow design system** (no purple-gradient AI slop). Include: global search, saved filters, bulk actions, keyboard shortcuts, dark mode, a11y.

---

## 16. Customer onboarding flow

```
Sign up (auth)
  → Choose: Standalone CRM | Attach to existing ERP tenant
  → Select industry template
  → subscription-service assigns CRM plan
  → crm-service bootstrap workspace + seed metadata
  → Invite sales users
  → Optional: connect channels (WA, web form, API key)
  → Optional: enable ERP adapter (if integrated)
  → Land on CRM Home
```

ERP-only tenants: Super Admin / shop admin enables CRM module → same bootstrap with template matching `businessType` (mapping table, not hardcoded UI lists).

---

## 17. Migration strategy (existing SugamFlow tenants)

| Tenant type | Action | Risk |
|-------------|--------|------|
| No CRM purchase | Nothing | None |
| Wants CRM | Enable module + template | Opt-in only |
| Field Force users | Keep FF; optional one-way import to CRM leads | Additive |
| Platform renewals | Unchanged in subscription-service | None |
| School/Hospital live | Adapters off by default; enable per org | None if off |

**No forced data migration.** Dual-run FF and CRM until customer cuts over.

---

## 18. Phased implementation roadmap

### Phase A — MVP (0–3 months) — marketable standalone

- `crm-service` + `crmdb` + gateway routes  
- `crm-ui` (login, leads, contacts, accounts, activities, Kanban, list)  
- Catalog: CRM Starter/Pro (core features)  
- Manual + CSV/Excel + public API ingest + web form  
- Pipelines/stages config · assignment (manual + round-robin)  
- Timeline (notes/tasks) · basic funnel dashboard  
- Industry templates: Education, Retail, Medical Distributor, Generic  
- Entitlement gate · tenant isolation tests  

### Phase B — Advanced (3–6 months)

- Opportunities + GST quotations + approvals  
- WhatsApp/SMS/Email sequences via notification-service  
- Workflow engine + SLA aging  
- Full template library  
- First ERP adapters (School inquiry, Distributor inquiry)  
- Reports pack · mobile polish  

### Phase C — Enterprise (6–12 months)

- AI add-on · campaigns · forecast · field ACL · SSO  
- More ERP adapters · Field Force facade / sync  
- Split analytics/AI services if needed  
- Advanced security (masking, device policies)  

---

## 19. Reuse checklist (mandatory)

| Reuse | Do not reinvent |
|-------|-----------------|
| subscription-service | Separate billing engine |
| auth-service / user-service | Parallel identity |
| notification-service | Parallel WA/SMS |
| gateway-service | Side door APIs |
| form-builder / rule-engine | Second form DSL (prefer reuse) |
| RabbitMQ | Second broker (unless scale forces) |

| Isolate | Why |
|---------|-----|
| shop / product / stock / order / doctor / appointment | ERP domains |
| fieldforce DB | Acquisition specialization |
| renewal_opportunity | Platform retention |

---

## 20. Success metrics

- CRM-only customer live with **zero** ERP services required in their plan.  
- ERP customer enables CRM with **no** regression in POS/clinical/admission.  
- New industry = **template PR**, not core code change.  
- Existing Field Force & Renewals APIs green in CI.

---

## Appendix A — Standalone vs integrated matrix

| Concern | Standalone | Integrated |
|---------|------------|------------|
| Tenant | CRM org | Existing shop/org |
| Convert | Status + export | Event → ERP adapter |
| Nav | crm-ui only | CRM + ERP apps |
| Data | crmdb only | crmdb + external_refs |
| Plan | CRM SKU | Vertical plan + CRM module |

## Appendix B — Decision log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Service count | 1 modular `crm-service` | Cost, consistency, SMB SaaS |
| Customer master | CRM Account ≠ user-service customer | Decouple standalone sell |
| Industry logic | Templates | No hardcoding |
| ERP link | Events | No shared DB |
| Licensing | Extend subscription catalog | No breaking changes |
| Field Force | Leave intact | Backward compatibility |
