# Ravi's Daily Checklist — Field Force Shop Onboarding

One-page guide for **salesman / promoter in the field**. Share with your team or print on A4.

**Full daily work + database tables:** [sugamflow-docs/docs/FIELDFORCE-DAILY-WORK-AND-DATA-REFERENCE.md](../sugamflow-docs/docs/FIELDFORCE-DAILY-WORK-AND-DATA-REFERENCE.md) · Hindi: [FIELDFORCE-DAILY-WORK-AND-DATA-REFERENCE-Hindi.md](../sugamflow-docs/docs/FIELDFORCE-DAILY-WORK-AND-DATA-REFERENCE-Hindi.md)

---

## URLs (bookmark these)

| Who | Local (dev) | Production |
|-----|-------------|------------|
| **Salesman — login** | http://localhost:4200/login | https://sugamflow.com/login |
| **Salesman — workspace** | http://localhost:4200/field-force/workspace | https://sugamflow.com/field-force/workspace |
| **Public register (do NOT use for field sales)** | http://localhost:4200/register | https://sugamflow.com/register |
| **Super admin — activate shops** | http://localhost:4200/admin/platform-dashboard | https://sugamflow.com/admin/platform-dashboard |

After login, salesman/promoter goes automatically to **Field Force workspace** (not the shop POS).

---

## Before first visit (one-time — Super Admin)

| # | Task | Where |
|---|------|--------|
| 1 | Create **promoter** (if needed) | Admin → **Field force** → pick **Tenant** → Add promoter |
| 2 | Create **salesman** under promoter | Same screen → Add salesman |
| 3 | Create **login invite** for salesman | Admin → **Login invite** → role **Field force — salesman** → link salesman ID |
| 4 | Salesman sets password | Email / link from invite |

Salesman login = **his own** username and password. **Not** the shop owner's login.

---

## At the shop — Salesman's steps

**Example:** Ravi visits **Aniket Medical Store**, gives demo, Aniket agrees.

### Step 1 — Log in (salesman's phone)

1. Open **login** URL: https://sugamflow.com/login (or localhost:4200/login)
2. On login screen choose **Employee** (not Shop owner, not Super Admin)
3. Fill in **three fields** (see table below — **Shop ID is NOT the new shop you are visiting**)
4. Click **Login** → you land on **Field Force workspace**

| Field | What to enter | Example (Raju) |
|-------|----------------|----------------|
| **Login mode** | **Employee** | Employee |
| **Shop ID** | The **anchor shop ID from login invite** (same tenant). Ask super admin if unsure — **not** the prospect shop name. | e.g. `MED-DEMO-01` or whatever was set in Admin → Login invite |
| **Username** | Base username from invite (app may show `username_shopId` under the field) | `raju` |
| **Password** | Password set from invite email/link | (from invite) |

**Important:** The shop you visit for demo (e.g. Aniket Medical Store) **does not exist in SugamFlow yet**. You do **not** enter that shop's name/ID at login. You only enter **Raju's own** shop ID from when his account was created.

**Optional — show live POS demo to owner:** Salesman login opens **Field Force only** (no Orders/Products). To demo billing on screen, super admin may give a separate **demo shop owner** login (Shop owner mode + demo shop ID) on a tablet — that is for presentation only; **tracking** still happens via Field Force workspace (lead + DEMO activity).

If you see "missing salesman id" → super admin must fix the login invite (salesman ID not linked in Admin → Login invite).

**Find Raju's shop ID (super admin / support):** in `authdb`:
```sql
SELECT shop_id, username, role, salesman_id, tenant_id
FROM auth_account WHERE role = 'FIELD_FORCE_SALESMAN';
```

### Step 2 — Save prospect (NOT a shop yet)

On **Field Force workspace**:

| Field | Example |
|-------|---------|
| Business name | Aniket Medical Store |
| Mobile | 9876543210 |
| Owner name | Aniket (optional) |
| City / State | optional |

Click **Save lead**. You get a code like **LD-42**. Shop does **not** exist yet.

### Step 3 — Log the demo

1. Click the lead in **My leads**
2. Activity type → **DEMO**
3. Add notes (e.g. "Showed billing + stock")
4. Click **Log activity**

### Step 4 — Convert to real shop (when owner says yes)

On the same lead → **Conversion pipeline**:

| # | Action |
|---|--------|
| 1 | Choose **Subscription** (Monthly / Yearly) |
| 2 | Check **KYC verified** (or click Mark KYC) |
| 3 | Click **Save subscription** |
| 4 | Enter **Owner username** |
| 5 | Enter **Owner email** (password link goes here) |
| 6 | Click **Complete conversion** |

**System creates:** real shop ID e.g. **FF-LD-42**, status **PENDING**, email to owner. Salesman gets **credit** on this lead.

### Step 5 — Tell the shop owner

> "Check your email for SugamFlow password setup. Your shop ID is **FF-LD-42**. It will be active after our team approves."

**Do not** send the owner to `/register` — that bypasses salesman credit.

---

## After visit — Super Admin

| # | Task | Where |
|---|------|--------|
| 1 | Open **Platform dashboard** | `/admin/platform-dashboard` |
| 2 | Find shop **FF-LD-42** | Status **PENDING** |
| 3 | **Activate** shop | PENDING → **ACTIVE** |
| 4 | (Optional) Check commission | Admin → **Field force** → Tenant → Commission entries |

Owner can then log in and use the shop.

---

## What NOT to do

| Don't | Why |
|-------|-----|
| Use `/register` after a field visit | No salesman credit |
| Use owner's login as salesman | Wrong role; no tracking |
| Skip "Save lead" and only use public form | No demo history, no commission |
| Expect shop to work instantly | **PENDING** until super admin activates |

---

## Right vs wrong flow

**Wrong (loses credit):** Demo → `/register` → fill form → done

**Right (salesman credited):** Login → Save lead → Log DEMO → Complete conversion → Admin activates

---

## Roles cheat sheet

| Person | Login | Main screen |
|--------|-------|-------------|
| **Salesman** | Field force salesman | Field Force workspace |
| **Promoter** | Field force promoter | Field Force workspace |
| **Shop owner** | Owner account (after email) | Owner dashboard / POS |
| **Super admin** | Super admin | Platform dashboard |

---

## If something fails

| Problem | Fix |
|---------|-----|
| Can't open workspace | Use salesman login; role must be FIELD_FORCE_SALESMAN |
| "Missing salesman id" | Super admin: recreate login invite with salesman linked |
| "Cannot reach server" | Gateway/backend not running (dev) or server down (prod) |
| Conversion OK but shop not working | Super admin must **activate** on platform dashboard |
| Owner didn't get email | Check spam; super admin can resend invite |

---

## One-line rule

**Field visit = Field Force login → lead → demo → conversion. Never `/register` when a salesman was involved.**
