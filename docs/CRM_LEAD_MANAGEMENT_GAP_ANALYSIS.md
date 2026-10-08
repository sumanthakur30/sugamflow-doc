# SugamFlow CRM Lead Management — Deep Gap Analysis

**Audience:** Product, Architecture, Engineering  
**Date:** 2026-07-30  
**Benchmarks:** Salesforce Sales Cloud, Microsoft Dynamics 365, HubSpot, Zoho CRM, Freshsales, Pipedrive, Monday CRM, ClickUp CRM, LeadSquared, Kylas, SalesBabu, Oracle CX, Bizom, Retailio  
**Companion canvas:** Cursor canvas `sugamflow-crm-lead-gap-analysis.canvas.tsx`  
**Design principles:** Configuration over hardcoding · Multi-tenant · Cloud-native · Backward compatible · Catalog-gated entitlements

---

## 1. Executive verdict

SugamFlow does **not** yet have a general-purpose Lead Management CRM comparable to Salesforce, Zoho, HubSpot, or LeadSquared.

What exists today is two narrow CRM-shaped surfaces:

| Surface | Location | Purpose | Coverage vs full lead lifecycle |
|---------|----------|---------|----------------------------------|
| Field Force merchant CRM | `fieldforce-service` + FF workspace UI | Acquire merchants → convert to shop | ~30–40% of a sales CRM (manual + field) |
| Platform CRM Renewals | School `subscription-service` + Super Admin tab | Tenant renewal / churn / upsell hints | Retention only — not new-lead CRM |
| `ModuleCode.CRM` | Platform entitlements enum | Plan label | **No** feature module, screens, or runtime gate |

**Implication:** Treat tenant sales CRM (Lead → Opportunity → Quote → Customer → Support → Renewal) as largely **greenfield**, while **reusing** Field Force patterns, renewal CRM APIs, `notification-service`, School `rule-engine-service`, `workflow-service`, and `form-builder-service`.

**Target:** Best-in-class CRM for Indian SMBs and multi-vertical enterprises — School, Hospital, PathLab, Pharmacy, Distributor, Retail, Manufacturing, Services — without industry-hardcoded Java/Angular.

---

## 2. Codebase baseline (do not assume)

### 2.1 Field Force (acquisition)

- Entities: `BusinessLead`, `FieldActivity`, `LeadConversion`, promoters, salesmen, beats, GPS/attendance, commissions
- Statuses: `NEW` → `CONTACTED` → … → `CONVERTED` / `REJECTED` / `DUPLICATE`
- Sources (enum only): `FIELD_VISIT`, `REFERRAL`, `INBOUND_CALL`, `CAMPAIGN`, `PARTNER`, `OTHER`
- Duplicate detect: mobile / GSTIN / name / GPS — **no merge UI**
- Assignment: manual `assignedSalesmanId` + beat plans — **no round-robin / SLA engine**
- Activities: visit, call, demo, follow-up, KYC, etc. — **not wired to WhatsApp/SMS/email send**
- Analytics: funnel / performance / dashboard APIs
- Docs: `docs/FIELDFORCE-LEAD-ARCHITECTURE.md`

### 2.2 Platform CRM Renewals (retention)

- Tables: `renewal_opportunity`, `renewal_reminder` (Flyway V14)
- Stages: `LEAD`, `TRIAL`, `ACTIVE`, `RENEWAL_DUE`, `AT_RISK`, `WON`, `LOST`, `CHURNED`
- Health score 0–100, upsell near-limit hints
- Reminders `T30/T14/T7/GRACE/FAIL_PAY` — channel default **IN_APP only** (no outbound dispatcher)

### 2.3 Reusable platform capabilities (not CRM-wired)

| Capability | Service | CRM use |
|------------|---------|---------|
| EMAIL / SMS / WHATSAPP / PUSH | sugamFlow `notification-service` | Comms + sequences |
| Rules (`when`/`then`, SEND_WHATSAPP, etc.) | School `rule-engine-service` | Assignment, scoring, SLA |
| Workflows | School `workflow-service` | Approvals, conversion |
| Dynamic forms (18 field types) | School `form-builder-service` | Lead custom fields / vertical layouts |
| Subscription catalog / modules | School `subscription-service` | Gate `FEATURE_CRM` / modules |

### 2.4 Explicitly missing

- Generic `crm-service` / Lead–Contact–Account–Deal model for tenants  
- Quotation / proposal / e-sign as CRM objects  
- Omnichannel lead ingest (Meta, Google, WhatsApp, web forms, OCR)  
- Unified inbox, email open tracking, call recording  
- Configurable pipelines per business type  
- AI scoring / summaries / next-best-action  
- School-ui or shop CRM module for day-to-day sales (beyond FF + renewals)  
- `FEATURE_CRM` feature flag / `@RequiresModule(CRM)` enforcement  

---

## 3. Industry benchmark summary

| Capability | SF / D365 | HubSpot / Zoho / Freshsales | LeadSquared / Kylas | Pipedrive / Monday | SugamFlow today |
|------------|-----------|-----------------------------|---------------------|--------------------|-----------------|
| Omnichannel capture | Strong | Strong | Very strong (India) | Medium | Weak (manual FF) |
| Assignment engine | Strong | Strong | Very strong | Medium | Weak (manual) |
| Scoring + qualify | Strong | Strong | Strong | Medium | Weak |
| WhatsApp-native | Add-on | Improving | Native strength | Weak | Providers exist, not CRM |
| GST quotes | Localization | Zoho strong | Medium | Weak | None as CRM |
| Field GPS / beat | Add-on / partner | Weak | Strong / Bizom | Weak | **Partial (FF)** |
| Vertical ERP depth | Custom | Custom | Thin | Thin | **Platform strength if CRM lands** |
| Renewal CRM | Strong | Strong | Medium | Weak | **Partial (tenants)** |
| AI copilot | Strong | Strong | Growing | Growing | None |
| Price / SMB India | High | Mid | Mid–low | Mid | Opportunity |

SugamFlow’s **win zone** is not “another Salesforce clone.” It is **vertical ERP + India-native sales loop** (WhatsApp, GSTIN, PIN territory, beat, UPI) with one configurable CRM engine.

---

## 4. Lead lifecycle gap matrix

| Stage | Coverage | Gap (what to build) | Priority |
|-------|----------|---------------------|----------|
| Lead Source | Partial | Campaign master, UTM, multi-touch attribution, source taxonomy per business type | P0 |
| Lead Capture | Partial | Web/landing, CSV/Excel, WhatsApp, Meta/Google/LinkedIn, API, QR, OCR card, missed-call, chatbot, walk-in, referral program | P0 |
| Duplicate Check | Partial | Fuzzy rules, merge + survivorship, GSTIN/PAN uniqueness policies | P0 |
| Assignment | Partial | Round-robin, territory/PIN/state/district, product/business, workload, office hours, holiday, vacation, escalation | P0 |
| Qualification | None | BANT / MEDDIC / custom scorecards, temperature, intent, probability | P0 |
| Scoring | Partial | Rule + behavior + AI; negative scores; auto-qualify / reassign | P0 |
| Activities | Partial | Calendar sync, recurring, video, geo check-in verify, voice notes, expense/travel | P1 |
| Follow-up | Partial | SLA timers, sequences, overdue queues, auto-tasks | P0 |
| Communication | None | Unified timeline, templates, tracking, bulk campaigns, recordings | P0 |
| Quotation | None | GST quote builder, versions, e-sign, share, payment link, acceptance | P0 |
| Negotiation | None | Discount history, competitor tracking, approval gates | P1 |
| Approval | None | Quote/discount/credit approval workflows | P1 |
| Won / Lost | Partial | Reason taxonomy, mandatory reasons, analytics | P0 |
| Customer | Partial | Generic convert → customer/account/shop/admission hooks (config) | P0 |
| Support | None | Case handoff + SLA from won deal | P2 |
| Renewal | Exists* | *Tenant renewals only — need per-vertical AMC/contract renewals | P1 |
| Upsell | Partial | Catalog-driven suggestions beyond meter hints | P1 |
| Referral | None | Referral program, rewards, attribution | P2 |

\*Platform tenant renewals are the only “Exists” stage at product maturity.

---

## 5. Feature gap catalog (prioritized)

### 5.1 High priority (P0) — ship or lose deals

| Area | Today | Missing | Benchmark |
|------|-------|---------|-----------|
| Tenant sales CRM module | Entitlement label only | Lead / Contact / Account / Pipeline UI gated by catalog | SF, Zoho, HubSpot, LeadSquared |
| Omnichannel capture | Manual FF + thin sources | Forms, WhatsApp, ads, import, API, QR, OCR | LeadSquared, HubSpot |
| Duplicate + merge | Detect only | Merge UI, rules, policies | Salesforce Duplicate Rules |
| Assignment engine | Manual + beats | RR, geo, workload, hours, escalation | LeadSquared Omni |
| Scoring & qualification | Priority enum | Rules + BANT/MEDDIC + behavior | HubSpot, Freshsales |
| Pipeline & opportunity | FF statuses; renewals stages | Configurable pipelines per business type | Pipedrive, SF |
| GST quotation | None | Builder, tax, PDF, share, accept, pay link | Zoho, Kylas |
| Communication CRM | Providers unused | Inbox + templates + tracking + sequences | LeadSquared, Freshsales |
| Won/Lost + convert | Status / FF→shop | Reasons + config convert targets | All majors |

### 5.2 Medium priority (P1)

- Workflow builder (if/else, SLA, aging, approvals, webhooks) on School rule-engine/workflow  
- Kanban, saved views, global search, bulk ops  
- Mobile offline, route plan, nearby leads, visit verification, push  
- Core dashboards + scheduled reports (source ROI, aging, target vs achievement)  
- Calendar (Google / Outlook), telephony click-to-call, call notes  
- AI: summaries, drafts (EN/HI + regional), next-best-action, card OCR  
- Negotiation / discount approval trails  

### 5.3 Low priority (P3) / later enterprise (P2–P3)

- Full campaign suite + multi-touch attribution  
- Field-level ACL, Aadhaar/GSTIN masking, device/IP MFA policies (extend platform security)  
- Advanced AI: churn prediction, win probability models, voice assistant, proposal generator  
- Dark mode / a11y / keyboard shortcuts polish  
- Slack/Teams deep integrations  
- CPQ-class product configurator  

---

## 6. Capability deep-dives (gaps by domain)

### 6.1 Lead capture — missing vs required

**Required channels:** Website form · Landing pages · Manual · Bulk Excel/CSV · WhatsApp · Facebook / Instagram Leads · Google Ads · LinkedIn · Public API · Email parsing · QR · Business card OCR · Referral · Trade show · Walk-in · Phone / missed call · Chatbot · Support ticket · Campaign  

**SugamFlow today:** Manual Field Force + limited source enum.  
**Build:** Ingest adapters → normalized `LeadIntakeEvent` → duplicate check → assignment. Forms via form-builder; WhatsApp via notification-service + WA Business API; ads via partner webhooks. All adapters **config-registered** per tenant / business type — no hardcoded channel lists in feature code.

### 6.2 Lead information model

**Must support (configurable schema + form-builder overlays):**  
Company / Individual · GSTIN · PAN · Aadhaar (optional, masked) · Industry · Business type · Revenue · Employees · Address · Geo · Maps · Website · Social · Multi-contact · Multi-branch · Timezone · Language · Tags · Custom / dynamic fields · Attachments · Notes · Timeline · Audit  

**Today:** Fixed JPA columns on `business_leads`.  
**Build:** Core identity columns + `custom_fields` JSON / EAV bound to form definitions; PII columns with field-level ACL.

### 6.3 Assignment

**Must support:** Manual · Round robin · Territory · PIN · State · District · Product · Business · Salesperson · AI · Workload · Holiday · Office hours · Escalation · Reassignment · Vacation  

**Today:** Manual salesman + beat.  
**Build:** `AssignmentPolicy` documents evaluated by rule-engine; beat/PIN as territory inputs; vacation calendar integration.

### 6.4 Qualification & scoring

**Must support:** BANT · MEDDIC · Custom · Temperature · Intent · Budget · Authority · Need · Timeline · Pain · Priority · Probability · Formula scores · Rule / AI / behavior (email open, click, visit, meeting, download, WA/SMS reply, call connect/duration) · Negative scores · Auto-qualify · Auto-reassign  

**Today:** Priority + renewal health ≠ sales score.  
**Build:** Scorecard templates per business type; event stream for behavioral points; optional AI model behind feature flag.

### 6.5 Activities & communication

**Must support:** Call · Meeting · Demo · Site visit · Video · WhatsApp · Email · SMS · Task · Reminder · Calendar sync · Recurring · Travel · Expense · Geo verify · Voice notes · Attachments · Templates · Bulk · Auto follow-up · Open/read tracking · Campaign analytics · Conversation timeline · Recording  

**Today:** FF activity types; notifications not CRM-wired; renewals IN_APP only.  
**Build:** Activity service + Comms timeline projecting notification deliveries; template library; sequence runner.

### 6.6 Opportunity, quote, negotiation

**Must support:** Pipeline · Stage · Probability · Value · Products · Competitors · Discount · Close date · Approvals · Forecast · Multi-quote · Negotiation history · Won/Lost reasons · AI win prediction · Quote builder · GST · Tax · Terms · E-sign · PDF · Versioning · WA/Email share · Online accept · Payment link  

**Today:** None as CRM objects (healthcare consultation quote is unrelated).  
**Build:** `Opportunity`, `Quote`, `QuoteLine`, `ApprovalInstance` — tax via existing GST engines where possible.

### 6.7 Automation

**Must support:** If/else · Conditions · Approval · Notify · Task · Reminder · Escalation · Auto-assign · Aging · SLA · Renewal · Convert · Webhooks · API  

**Reuse:** School rule-engine + workflow; do **not** invent a second engine inside shop feature modules.

### 6.8 AI (India SMB + Enterprise)

Prioritize: Lead summary · Call/meeting summary · Email/WhatsApp draft (EN/HI + config languages) · Follow-up / NBA · Sentiment · Win prediction · Churn · Upsell/cross-sell · Forecast assist · Card/document OCR · Proposal draft · Sales copilot  

Gate all AI behind catalog features and org AI policy (enterprise controls).

### 6.9 Dashboards & reports

KPIs: totals · today/new/hot/cold · qualified · won/lost · pipeline value · forecast · source · campaign ROI · salesperson · activity · overdue · conversion · aging · business/state/district/branch/product cuts · trends · heat maps · real-time  

Reports: source · conversion · funnel · salesperson · activity · call · meeting · aging · follow-up · campaign · lost/won reason · forecast · target vs achievement · CAC · LTV · ROI · export · schedule  

**Today:** FF funnel + renewals KPIs only.

### 6.10 Mobile CRM

Offline · Geo · Check-in · Attendance · Route · Nearby · Voice · Photo · Card scan · GPS verify · E-sign · Push  

**Today:** GPS/attendance APIs; thin UI — extend FF mobile patterns into tenant CRM app.

### 6.11 Security

RBAC · Audit · Field ACL · Ownership · Masking · Approval audit · Login history · Device · IP · MFA · Encryption  

Extend platform auth/enterprise controls; CRM must not bypass ownership scopes.

### 6.12 Integrations

Google Workspace · M365 · WhatsApp Business · SMS · Payment · GST API · Maps · Calendar · Slack · Teams · ERP · Accounting · Inventory · Marketing · Support · Telephony  

Prefer **adapter registry** + webhooks over hardwired SDKs in UI.

---

## 7. Industry-wise CRM requirements

All vertical differences = **pipeline templates + form keys + convert targets + assignment policies** in config — never industry `if (hospital)` in feature services.

| Vertical | Must-have CRM objects / flows | Convert / handoff target | Reuse |
|----------|-------------------------------|--------------------------|-------|
| School ERP | Admission inquiry → counselor → fee quote → enroll | Application / student / fee plan | admission + form-builder + workflow |
| Hospital / Polyclinic | OPD inquiry, corporate packages, doctor referral | Patient / appointment / package | customers, appointments |
| Path Lab | B2B centers, doctor leads, camp leads, rate cards | Account + rate card + orders | FF pattern; LIMS docs as specs |
| Pharmacy / Medical shop | Doctor/clinic leads, wholesale buyers | Customer + schemes | wholesale / customers |
| Medical Distributor | Retailer onboarding, credit, schemes, beat | Shop/retailer + credit limit | Field Force + beats |
| Retail / Electronics / Grocery | Walk-in, Meta leads, EMI quotes, store territory | Customer + invoice | shop customers |
| Manufacturing | Dealer RFQ → quote → PO, samples | Dealer account + order | New opp/quote |
| Service business | AMC/contract, site survey, renewal SLA | Contract + ticket | Renewals patterns + support |

---

## 8. UX gaps & redesign directions

### Gaps

Navigation (no CRM IA) · Lead create friction · Weak search / no global search · Filters / saved views · No Kanban · List-only FF · Thin timeline · No activity panel density · Few one-click actions · Limited bulk · Dark mode / a11y / shortcuts incomplete  

### Wireframe ideas (config-driven shell)

1. **CRM Home:** KPI strip (entitlement-aware) + “My overdue” + “Today’s follows” — one job per section.  
2. **Lead workspace:** Left list/Kanban · Center record + timeline · Right activity / next action.  
3. **Capture bar:** “Add lead” + Import + Connect channel (setup).  
4. **Quote drawer:** GST lines, discount, approve, share WhatsApp.  
5. **Mobile visit mode:** Nearby map · Check-in · Voice note · Photo · Next stop.

Preserve shop-management-ui / school-ui design systems; CRM is a **module shell**, not a separate brand theme.

---

## 9. Database schema recommendations

Multi-tenant (`organization_id` / `shop_id` as applicable), soft-delete, audit columns, JSON for flexible attributes.

Suggested core tables (new `crm` schema or `crm-service` DB):

```text
crm_lead
crm_contact
crm_account
crm_pipeline / crm_pipeline_stage          -- per business_type_code
crm_opportunity
crm_quote / crm_quote_line / crm_quote_version
crm_activity
crm_task
crm_note / crm_attachment
crm_score_event / crm_scorecard
crm_assignment_rule / crm_assignment_log
crm_duplicate_rule / crm_merge_history
crm_campaign / crm_campaign_member
crm_comm_message                          -- projection of outbound/inbound
crm_approval_request
crm_lost_won_reason                       -- configurable taxonomy
crm_custom_field_value                    -- or JSON on parent + form_key
crm_audit_event
```

**Compatibility:**

- Keep `fieldforce.business_leads` as acquisition specialization **or** migrate behind a facade that maps to `crm_lead` with `lead_class=MERCHANT_ACQUISITION`.  
- Keep `renewal_opportunity` as retention specialization with `lead_class=TENANT_RENEWAL`.  
- Do not break existing FF / renewal APIs; add versioned `/api/v1/crm/**` and deprecate slowly.

---

## 10. API & microservice recommendations

### Recommended topology

```text
crm-service (new)  ──►  Lead, Opp, Quote, Activity, Assignment, Score
        │
        ├── notification-service (comms)
        ├── form-builder-service (layouts)
        ├── rule-engine-service / workflow-service (automation)
        ├── subscription-service (entitlements FEATURE_CRM)
        ├── fieldforce-service (facade / eventual merge)
        └── shop-service / admission / customers (convert adapters)
```

### API shape (backward compatible)

- `POST /api/v1/crm/leads` · ingest · search · merge  
- `POST /api/v1/crm/leads/{id}/assign` · score · qualify  
- `GET/POST /api/v1/crm/opportunities` · stage transitions  
- `GET/POST /api/v1/crm/quotes` · approve · share · accept  
- `POST /api/v1/crm/activities` · tasks  
- `POST /api/v1/crm/webhooks/meta|google|whatsapp|forms`  
- `GET /api/v1/crm/reports/*` · dashboards  

Preserve:

- `/api/v1/leads/**` (Field Force)  
- `/api/subscription/.../crm/**` (Renewals)  

Gateway: register new predicates; fix any missing FF routes (`beats`, `activities`, `attendance`) if still incomplete.

### Entitlements

- Catalog module/features: `CRM`, `CRM_WHATSAPP`, `CRM_AI`, `CRM_QUOTE`, `CRM_MOBILE_OFFLINE`  
- Enforce via existing effective-config / entitlements — **never** hardcode vertical module lists in UI.

---

## 11. Automation & workflow engine

1. **Events:** `LeadCreated`, `LeadScoreChanged`, `StageChanged`, `QuoteSent`, `SLABreached`, `ActivityOverdue`.  
2. **Rules:** Tenant JSON rules in rule-engine (`when`/`then`) — actions: assign, notify, create task, escalate, webhook.  
3. **Workflows:** Multi-step approvals (discount > X%, credit limit).  
4. **Sequences:** Time-based WhatsApp/SMS/Email steps via notification-service.  
5. **Idempotency + audit** on every automated mutation.

No second workflow runtime inside Angular feature modules.

---

## 12. Implementation roadmap

### Phase 1 — Foundation (0–3 months)

- New `crm-service` (or expand fieldforce carefully) with Lead / Contact / Activity  
- Catalog gate + Super Admin / tenant CRM UI shell  
- Capture: manual, CSV/Excel, public API, web form (form-builder)  
- Duplicate + merge; assignment rules (RR + PIN/state + workload)  
- India fields: GSTIN, PAN, geo; tags; notes; timeline  
- Convert adapters: → shop customer / FF conversion / school inquiry  
- Kanban + list + saved filters  

### Phase 2 — Revenue (3–6 months)

- Pipelines per business type; Opportunity  
- GST Quotation + PDF + WhatsApp/Email share + payment link  
- Comms sequences (WA/SMS/Email) + conversation timeline  
- SLA / aging / auto-tasks on rule-engine  
- Mobile check-in + offline-lite  
- Core dashboards (funnel, source, salesperson, overdue)  

### Phase 3 — Scale (6–9 months)

- Campaigns + UTM attribution  
- Advanced / behavior scoring  
- Calendar sync · telephony · approvals · forecast  
- Scheduled reports · field ACL · masking  
- Ad lead adapters (Meta/Google) · missed-call · chatbot  

### Phase 4 — Enterprise AI (9–12 months)

- AI scoring, summaries, NBA, OCR card, win prediction  
- Multilingual drafts · churn/upsell · copilot  
- Align with subscription enterprise SSO / residency / audit export  

---

## 13. Differentiation vs Salesforce, HubSpot, Zoho, LeadSquared

| Differentiator | Why it wins in India / SugamFlow |
|----------------|----------------------------------|
| Vertical CRM inside ERP | Same engine, different pipelines for School vs PathLab vs Retail — Salesforce needs heavy custom; LeadSquared is sales-thin on ERP |
| India-native by default | GSTIN quotes, WhatsApp-first sequences, UPI links, state/PIN territory — not paid add-ons |
| Acquire → Operate → Renew | Field Force + shop ops + tenant renewals — close the middle with tenant sales CRM |
| Config > code | Catalog, form-builder, rule-engine — competitors ship per-industry apps |
| Price-to-value for SMB | Mid-market CRM depth without SF complexity or HubSpot marketing lock-in |

**Do not compete** on being the deepest marketing automation suite first. **Compete** on closing the loop from lead → billed operations → renewal inside one platform.

---

## 14. Architecture guardrails (non-negotiable)

1. **Configure** CRM capabilities in Super Admin / tenant admin against platform catalog — not hardcoding Hospital/Retail lists in Java or Angular.  
2. **Enforce** via entitlements / effective-config caches — no hot-path calls to subscription-service on every click.  
3. **Reuse** notification, form-builder, rule-engine, workflow — do not duplicate.  
4. **Specialize** Field Force and Renewals as bounded contexts or lead classes — do not fork three incompatible CRMs.  
5. **Multi-tenant, scalable, cloud-native** from day one (org isolation, indexes on owner/stage/score, async ingest).  
6. **Backward compatible** APIs for FF and renewals during migration.  

---

## 15. Suggested next decisions (product)

1. Greenfield `crm-service` vs evolve `fieldforce-service` into multi-lead-class CRM.  
2. First vertical for Phase 1 pilot: **Medical Distributor / Retail** (FF adjacency) vs **School admissions** (form-builder adjacency).  
3. Quote tax engine: reuse shop GST vs new CRM tax calculator.  
4. WhatsApp: official Business API partner selection and template governance.  

---

## Appendix A — Competitive feature checklist (condensed)

Use as backlog acceptance criteria; mark Done only when **tenant-configurable** and **catalog-gated**.

- [ ] Omnichannel ingest adapters (≥ web, CSV, API, WhatsApp, Meta)  
- [ ] Duplicate rules + merge  
- [ ] Assignment policies (RR, geo, workload, hours, escalation)  
- [ ] Qualification templates + scoring engine  
- [ ] Configurable pipelines + opportunities  
- [ ] GST quotes + share + accept + pay link  
- [ ] Unified activity + comms timeline  
- [ ] Automation on rule-engine  
- [ ] Mobile field CRM offline-lite  
- [ ] Dashboards + exportable reports  
- [ ] RBAC + field ACL + audit  
- [ ] AI assist pack (optional entitlement)  
- [ ] Vertical pipeline packs (config packs, not code)  

## Appendix B — Related docs

- `docs/FIELDFORCE-LEAD-ARCHITECTURE.md`  
- `docs/SUGAMFLOW-PLATFORM-ARCHITECTURE.md`  
- `docs/SUGAMFLOW-BUSINESS-TYPES.md`  
- School: `docs/SUBSCRIPTION_PLATFORM_ANALYSIS.md` (CRM Renewals Phase 12)  
- Workspace rule: platform-subscription-maintenance (configure in Super Admin; enforce via entitlements)
