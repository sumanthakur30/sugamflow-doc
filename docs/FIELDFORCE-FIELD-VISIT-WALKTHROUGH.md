# Field Force — Field visit walkthrough (how tracking works)

**Use this doc** to train salesmen or to paste into Cursor when you ask: *“Guide me through a field visit step by step.”*

**Example story:** Salesman **Ravi** visits **Aniket Medical Store**, gives a SugamFlow demo, owner agrees → shop onboarded → everything tracked on dashboard.

---

## Big picture (what gets tracked)

```
Salesman login (his account)
    → Save BUSINESS LEAD (prospect — not a shop yet)
    → Log DEMO activity (proof of visit/demo)
    → (Optional) Complete CONVERSION → real shop FF-LD-xx
    → Super admin activates shop
    → Commission rows (if plan configured)
```

**Tracked in database (`fieldforcedb`):**

| Step | Table | What is stored |
|------|--------|----------------|
| Login | `authdb.auth_account` | Role `FIELD_FORCE_SALESMAN`, `salesman_id` |
| Save lead | `business_leads` | Shop name, mobile, status `NEW`, assigned to Ravi |
| Log demo | `field_activities` | Type `DEMO`, notes, timestamp |
| Status change | `business_leads.lead_status` | Auto → `DEMO_GIVEN` after DEMO |
| Dashboard cards | API aggregates | Leads ↑, Activities ↑ |
| Conversion | `lead_conversions` + `shopdb.shops` | Shop `FF-LD-42`, status `PENDING` |
| Commission | `commission_entries` | Events `LEAD_CREATED`, `DEMO_COMPLETED`, `CONVERSION` |

**Not tracked if you skip Field Force:** If owner uses public **`/register`**, the visit is **not** linked to Ravi’s salesman id.

---

## Part A — One-time setup (Super Admin, before first field day)

Do this once per salesman.

| # | Who | Action | Where in UI |
|---|-----|--------|-------------|
| 1 | Super admin | Create **promoter** (if needed) | `/admin/field-force` → pick **Tenant** → Add promoter |
| 2 | Super admin | Create **salesman** under promoter | Same screen → Add salesman |
| 3 | Super admin | Create **login invite** | `/admin/create-login-invite` → role **Field force — salesman** → link **salesman ID** |
| 4 | Ravi | Open email/link, set password | One-time |

**Verify in DB (`fieldforcedb` as user `fieldforcedb`):**

```sql
SELECT id, salesman_code, full_name, mobile, status FROM salesmen;
-- note Ravi's id, e.g. 3

-- authdb:
SELECT username, role, salesman_id FROM auth_account WHERE role = 'FIELD_FORCE_SALESMAN';
-- salesman_id must match salesmen.id
```

If `salesman_id` is NULL → workspace shows **“missing salesman id”** and leads won’t attribute correctly.

---

## Part B — Field visit (Salesman Ravi, at the shop)

### B1 — Login (Ravi’s phone, not shop owner’s)

Open login page → select **Employee** (field-force accounts use Employee mode).

| Field | Enter | Do NOT enter |
|-------|--------|--------------|
| **Shop ID** | Anchor shop from **login invite** (e.g. `MED-DEMO-01`) | New prospect shop name / `FF-LD-42` (doesn't exist yet) |
| **Username** | Ravi’s base username (e.g. `raju`) | Shop owner’s username |
| **Password** | Ravi’s password from invite | Owner password |

| Do | Don’t |
|----|--------|
| **Employee** mode + invite **Shop ID** + salesman credentials | Use **Shop owner** mode for salesman |
| Lands on **`/field-force/workspace`** | Expect POS / Orders for tracking login |
| Ask super admin for Shop ID if forgotten (`auth_account.shop_id`) | Use `/register` for the prospect |

**Product demo on screen:** Salesman login has **no POS**. Use **Print quick reference**, video, or a separate **demo shop owner** tablet login to show billing — then log **DEMO** in Field Force workspace for tracking.

After login, Ravi sees **Field force workspace** only (no Products/Orders tabs).

---

### B2 — Save prospect as LEAD (before or right after hello)

**On workspace — left panel “New business lead”:**

| Field | Example |
|-------|---------|
| Business name * | Aniket Medical Store |
| Mobile * | 9876543210 |
| Owner name | Aniket |
| City / State | Delhi / DL |

Click **Save lead**.

**What happens in system:**

1. Row inserted in `business_leads`
2. `lead_code` = **`LD-42`** (example)
3. `lead_status` = **`NEW`**
4. `assigned_salesman_id` = Ravi’s id (from login token)
5. `lead_source` = **`FIELD_VISIT`**
6. Lead appears in **My leads** (only Ravi’s assigned leads)
7. Dashboard card **Leads** count increases (tenant-wide total)
8. Optional commission: **`LEAD_CREATED`** in `commission_entries` if plan has amount

**Shop does NOT exist yet** — no billing, no owner account.

---

### B3 — Give SugamFlow demo to shop owner

**Two parts:**

#### (1) Show the product (demo to human)

Ravi can demo SugamFlow on:

- A **staging demo shop** (separate owner login / demo tenant), **or**
- Laptop hotspot + your demo URL, **or**
- Video / quick reference print from workspace (**Print quick reference**)

Topics to show: orders, stock, GST, customer dues — per sales brief.

#### (2) Record demo in Field Force (tracking — required)

Back on **Field force workspace**:

1. Click **Aniket Medical Store** in **My leads**
2. Section **Log field activity**
3. Type → **`DEMO`**
4. Notes → e.g. `Showed billing, stock, customer history. Owner interested.`
5. Optional: **Next follow-up** date
6. Click **Log activity**

**What happens in system:**

| Where | Change |
|-------|--------|
| `field_activities` | New row: `activity_type = DEMO`, `salesman_id = Ravi`, `notes`, `activity_at = now` |
| `business_leads.lead_status` | Auto-updated to **`DEMO_GIVEN`** |
| Dashboard **Activities** card | Count increases |
| Activity list (right panel) | Shows DEMO line with time + notes |
| `commission_entries` | Optional **`DEMO_COMPLETED`** if plan configured |

**This is how “demo happened” is proved** — not by opening POS on salesman login.

---

### B4 — Owner says “Yes, we want it” (conversion)

Same selected lead → **Conversion pipeline**:

| # | UI action | DB / outcome |
|---|-----------|--------------|
| 1 | Subscription → **MONTHLY** or **YEARLY** | `lead_conversions.subscription_plan_code` |
| 2 | Check **KYC verified** (or Mark KYC) | `kyc_verified = true` |
| 3 | **Save subscription** | Stage → `SUBSCRIPTION_SELECTION` |
| 4 | Owner username | e.g. `aniket_medical` |
| 5 | Owner email | owner@gmail.com (password link) |
| 6 | **Complete conversion** | Creates real shop |

**After Complete conversion:**

| System | Result |
|--------|--------|
| `business_leads` | `lead_status = CONVERTED`, `external_shop_id = FF-LD-42` |
| `lead_conversions` | `current_stage = COMPLETED` |
| `shopdb.shops` | New shop **`FF-LD-42`**, status **`PENDING`** |
| Email | Owner invite for password setup |
| Dashboard **Converted** card | +1 |
| `commission_entries` | Optional **`CONVERSION`** event |

**Tell owner:**

> “Check email for SugamFlow password. Shop ID is **FF-LD-42**. Our team will activate it shortly.”

---

### B5 — End of day (Ravi)

1. **Refresh** workspace
2. Confirm lead shows **CONVERTED** and shop id
3. Log **FOLLOWUP** on leads still open

---

## Part C — Super admin (after Ravi leaves)

| # | Action | Where |
|---|--------|-------|
| 1 | Open platform dashboard | `/admin/platform-dashboard` |
| 2 | Find shop **FF-LD-42** | Status **PENDING** |
| 3 | **Activate** shop | → **ACTIVE** |
| 4 | (Optional) Check commission | `/admin/field-force` → Tenant → Commission entries |

Owner can now log in and use POS.

---

## Part D — What each dashboard shows

### D1 — Salesman workspace (`/field-force/workspace`)

**Summary cards (top):**

| Card | Meaning for Ravi |
|------|------------------|
| **Leads** | All active leads in tenant (not only his) |
| **Converted** | How many leads reached CONVERTED in tenant |
| **Activities** | Total field activities logged in tenant |
| **Legacy shop regs** | Old deprecated registrations (ignore for new work) |

**My leads list:** Only leads where `assigned_salesman_id = Ravi`.

**Selected lead panel:** Activity history + conversion pipeline.

---

### D2 — Super admin Field force (`/admin/field-force`)

Per tenant:

| Section | Use |
|---------|-----|
| Promoters / Salesmen | Team roster |
| Commission plans | How much per lead/demo/conversion |
| Commission entries | Ravi’s accrued amounts (`beneficiary_type = SALMAN`, `beneficiary_id = Ravi’s id`) |
| Shop registrations | Legacy only |

Funnel API (for reports): `GET /api/v1/fieldforce/analytics/funnel` — counts by `lead_status`.

---

## Part E — Wrong vs right (memorize)

### Wrong (no tracking / no credit)

```
Visit shop → tell owner to open /register → owner fills form
→ shop may exist but Ravi gets NO lead, NO demo log, NO commission
```

### Right (full tracking)

```
Ravi login → Save lead LD-42 → Log DEMO → Complete conversion → Admin activates
→ every step in business_leads + field_activities + optional commission_entries
```

---

## Part F — Cursor prompt (copy-paste)

When you want Cursor to walk you through live:

```
I'm doing a Field Force field visit as salesman Ravi (tenant 1, salesman id 3).
Guide me step by step in SugamFlow UI:
1) login URL and what screen I should land on
2) save lead for "Aniket Medical Store" mobile 9876543210
3) log DEMO activity with sample notes
4) what should change on workspace dashboard cards
5) complete conversion with MONTHLY plan and owner email
6) what super admin must do after
7) SQL to verify in fieldforcedb (business_leads, field_activities, commission_entries)

Use docs/FIELDFORCE-FIELD-VISIT-WALKTHROUGH.md and FIELDFORCE-DAILY-WORK-AND-DATA-REFERENCE.md
```

---

## Part G — Quick verification SQL

Connect DBeaver as **`fieldforcedb` / `fieldforcedb`**, database **`fieldforcedb`**:

```sql
-- Ravi's leads
SELECT lead_code, business_name, mobile, lead_status, external_shop_id, assigned_salesman_id
FROM business_leads
WHERE assigned_salesman_id = 3 AND deleted_at IS NULL
ORDER BY id DESC;

-- Demo activities on latest lead
SELECT fa.activity_type, fa.activity_at, fa.notes
FROM field_activities fa
JOIN business_leads bl ON bl.id = fa.business_lead_id
WHERE bl.lead_code = 'LD-42';

-- Commission for that lead
SELECT commission_event, beneficiary_type, beneficiary_id, amount, status
FROM commission_entries
WHERE business_lead_id = (SELECT id FROM business_leads WHERE lead_code = 'LD-42');
```

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [FIELDFORCE-DEMO-LOGIN-CARD.md](./FIELDFORCE-DEMO-LOGIN-CARD.md) | Tablet POS demo logins per business type |
| [FIELDFORCE-DAILY-CHECKLIST.md](./FIELDFORCE-DAILY-CHECKLIST.md) | One-page print |
| [FIELDFORCE-DAILY-WORK-AND-DATA-REFERENCE.md](../sugamflow-docs/docs/FIELDFORCE-DAILY-WORK-AND-DATA-REFERENCE.md) | Tables + daily work |
| [FIELDFORCE-SALESMAN-PROMOTER-GUIDE.md](./FIELDFORCE-SALESMAN-PROMOTER-GUIDE.md) | Full API + architecture |

_Last updated: May 2026_
