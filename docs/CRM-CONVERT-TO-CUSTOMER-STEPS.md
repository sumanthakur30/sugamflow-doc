# CRM lead to shop customer — steps

**Date:** 13 October 2026  
**Who this is for:** Super Admin, the shop owner, and the salesperson.  
**Desk:** https://crm.sugamflow.com/  
**Shop app:** https://sugamflow.com/

A person added in CRM is a **lead**. They appear on the shop **Customers** list only after **Convert to shop** succeeds. A phone call, a note, a won stage, and **Convert to CRM** do not create that customer.

The live desk still shows **Store convert payload** until this build is deployed. The steps below are the ones to use after that deploy.

---

## 1. What you should expect

Yes. After a successful convert, the same person is a customer of **that shop**.

| Action in CRM | Result |
|---|---|
| New lead | Lead only. Not a shop customer. |
| Log call, save note, move stage, mark Won | Activity on the lead. Not a shop customer. |
| Convert to CRM | CRM account, contact, and deal. Not a shop customer. |
| Convert to shop → Shop customer, status **SENT** | Row on the shop app **Customers** list (`/users`). |
| Convert to shop, status **SKIPPED** | Nothing is sent. The customer list does not change. |

The customer is a shop customer (role CUSTOMER). They are not a staff login, and they are not a wholesale party.

Look in the shop app sidebar: **Customers**. Sign in to the **same shop** you used in CRM.

---

## 2. What still has to be true

The customer list changes only when both of these are true. Other shops stay unchanged.

**This shop’s add-on is on.**  
`FEATURE_CRM_CONVERT` stays off on the shared plans (Generic Professional, CRM Starter, CRM Professional, CRM Enterprise). Super Admin ticks it for one shop. Until then the lead button says **Store convert payload** and the result is **SKIPPED**.

**The sign-in has a numeric tenant.**  
The customer service stores the person under a numeric tenant and the shop code (`GEN-DEMO-01`). CRM leads stay stored under the shop code. Convert reads the numeric tenant from the staff sign-in token and sends the shop code as the shop. It does not send the shop code as the tenant. If that number is missing, the result is **FAILED** and the customer list does not change.

This is not on **Subscriptions → Shop features**. That page is the price sheet (Basic CRM, Cashbook, GPS).

---

## 3. Super Admin — turn convert on for one shop

Do this for the shop that should receive the customer. Saving here writes a package for that shop only (`shop-gen-demo-01` for `GEN-DEMO-01`). Generic Professional and every other shop stay as they are.

1. Sign in to https://sugamflow.com/ as Super Admin.
2. Open **Platform configuration → Subscriptions → Assignments**.
3. Select the shop, for example `GEN-DEMO-01`.
4. Open **Add-on features**.
5. Tick **Convert lead to customer**.
6. Click **Save subscription**.

Ticking it also turns on CRM for that same shop package, because convert requires CRM. It does not rewrite the shared plan.

After the save, sign in to CRM for that shop. The lead button changes from **Store convert payload** to **Convert to ERP**.

---

## 4. Salesperson — from the call to the customer list

Use the shop’s own id. The demo shop is `CRM-DEMO-01` / user `demo` / password `Demo@2026`. A live client uses their own shop.

### 4.1 Sign in

1. Open https://crm.sugamflow.com/.
2. Set **Tenant** and **Shop** to this shop. Click **Set**.
3. Open **Auth login**. Shop id, username, and password are the staff login for this shop. Click **Sign in**.
4. If this shop has never used CRM, open **Demo Workspace**, pick the template (**RETAIL** for a shop, **GENERIC** otherwise), and click **Bootstrap** once.

### 4.2 Add the person as a lead

1. Open **Leads**.
2. Search the phone. If the person is already there, open that lead. Do not create a second one.
3. Click **New lead**.
   - Title (required), for example the person or shop name
   - Contact name, company, **phone**, email
   - Source: **Phone call** or **Market visit**
4. Click **Create lead**.

### 4.3 Record the call (optional)

This does not create the customer.

1. Open the lead → **Activity**.
2. Duration in seconds (60 = one minute).
3. Click **Log call**.
4. Type what they said under **Add note** → **Save note**.
5. On **Overview**, move the stage (New → Contacted, or the retail stage you use).

### 4.4 Keep them inside CRM (optional)

**Convert to CRM** creates the CRM account, contact, and deal. It does **not** add the shop customer. Use it when the salesperson will keep working the deal in CRM.

### 4.5 Send them to the shop customer list

1. Open the lead → **Convert to shop**.
2. Target: **Shop customer (user-service)**. Leave School inquiry and Field Force alone. Field Force creates a new SugamFlow shop, which is the wrong result for a buyer of this shop’s goods.
3. The button must say **Convert to ERP**.
4. Click it.
5. Read **Last**:
   - **SENT** and an id — the customer was created. Search that name or phone in the shop app.
   - **SKIPPED** — this shop’s add-on is still off. Super Admin has not saved **Convert lead to customer** on Assignments.
   - **FAILED** — the customer was not created. Sign in again on CRM, then convert. If it stays FAILED, the staff account has no numeric tenant.

### 4.6 Confirm in the shop app

1. Open https://sugamflow.com/ and sign in to the **same shop**.
2. Sidebar → **Customers**.
3. Search the name or phone from the lead.

The new row is a customer. It has no password and does not appear under **Staff**.

---

## 5. What each status means

| Last status | Meaning | Customer list |
|---|---|---|
| SKIPPED · DISABLED | Plan does not include convert. Payload stored in CRM only. | Unchanged |
| SENT | Customer service accepted the person and returned an id. | New customer row |
| FAILED | Customer service was called and rejected the request. | Unchanged |
| ACKED | This lead was already sent. CRM did not create a second customer. | Unchanged |

---

## 6. Order of work for a live shop

1. Super Admin ticks **Convert lead to customer** on **Assignments → Add-on features** for that shop and saves.
2. Salesperson signs in on CRM, creates the lead, then **Convert to shop → Shop customer → Convert to ERP**.
3. Counter opens **Customers** in the shop app and bills that person there.

CRM does not create the bill, move stock, or send WhatsApp, SMS, or email.
