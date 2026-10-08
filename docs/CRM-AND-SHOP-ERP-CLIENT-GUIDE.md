# SugamFlow — CRM and shop ERP for one owner

**Who this is for:** the shop owner, the office team, and salesmen who visit the market.  
**Share this file** with the client. It is the reference for how the same business uses CRM and the shop (ERP) together.

**Date:** 8 October 2026

---

## 1. Short answer

Yes. CRM and the shop ERP are for the **same owner** and the **same shop**.

They are two screens, one business:

| Screen | What it is for | Who uses it |
|---|---|---|
| **CRM** | Enquiries, phone calls, market visits, follow-up, quotes | Owner and sales team |
| **Shop ERP** (SugamFlow shop app) | Customers, products, stock, bills, payments | Owner and counter staff |
| **Field Force** | Only when a salesman is signing up a **new shop** on SugamFlow | Promoter / salesman whose job is shop onboarding |

A person who phones or is met in the market starts as a **lead in CRM**.  
When they agree to buy, they become a **customer in the shop ERP**, and the sale becomes an **order / bill** there. Stock and money stay in the shop app. CRM does not keep a second stock book.

---

## 2. One owner, three jobs

Do not share the owner’s password with salesmen.

| Person | Login | Daily job |
|---|---|---|
| **Owner** | Shop owner login for this shop | Sees CRM pipeline and shop bills. Creates salesman logins. |
| **Office / inside sales** | Their own user on the **same shop** | Takes calls, creates leads, logs calls, sends quotes. |
| **Market salesman** | Their own user on the **same shop** | Visits the market, creates or updates the lead, logs the demo, asks the office to bill when the customer buys. |
| **Counter** | Their own user on the **same shop** | Bills the customer in the shop app after CRM has created the customer and the order. |

Same shop id on every login. Example used in the local demo: shop `CRM-DEMO-01`. A live client uses **their own shop id**, not the demo shop.

---

## 3. How the pieces connect

```text
Market visit or phone call
        |
        v
   CRM lead  (name, phone, company, source CALL or VISIT)
        |
        +-- Log the call or the demo
        +-- Note what they want
        +-- Move stage: New -> Contacted -> Qualified -> Proposal
        |
        v
   Convert inside CRM
        Account + Contact + Opportunity
        |
        v
   Convert to ERP  ->  Shop customer
        (same person now exists on the shop’s customer list)
        |
        v
   CRM quote  ->  Accept quote  ->  Shop order
        |
        v
   Shop ERP bill, payment, stock
```

Two convert buttons exist on a lead. They do different jobs:

1. **Convert to CRM** — keeps the buyer inside CRM (account, contact, deal).
2. **Convert to ERP → Shop customer** — copies that buyer into the shop’s customer list so the counter can bill them.

A quote becomes a shop order only after the lead is a shop customer and quote-to-order is switched on for that shop. Until then, CRM still stores the quote, and the counter creates the bill by hand in the shop app.

---

## 4. What the owner sets up once

1. Confirm the shop exists and is **Active** in SugamFlow (shop id, owner name, phone).
2. Sign in to **CRM** with that shop id.
3. Click **Bootstrap** once. Pick the template:
   - **GENERIC** — New, Contacted, Qualified, Proposal, Won, Lost.
   - **RETAIL** — Walk-in, Demo / trial, Quote, Sold, Lost. Use this when salesmen demo products in the market.
4. Add each salesman under **Leads → Team**. Use their real user id and display name. This is who leads can be assigned to.
5. Ask SugamFlow to turn on live ERP links for this shop:
   - **Shop customer convert** points at the shop’s customer list (not a practice sink).
   - **Quote → order** is on, with a default product or a product id on each quote line.
6. Give each salesman their **own** username and password for this shop. They sign in as staff of this shop, not as the owner.

---

## 5. Office: a new lead from a phone call

1. Open CRM and sign in. Shop id is this shop.
2. Open **Leads**.
3. **Create lead**
   - Title (required), for example the shop or person name
   - Contact name, company, **phone**, email
4. Click **Create**. The lead opens on the right. It starts as **New** and **OPEN**.
5. Click **Edit**. Set **Source** to `CALL`. Click **Save**.  
   The create form stores source as `WEBSITE` until you edit it.
6. Make the call on your phone. In **Score / call / meeting**:
   - Phone can stay blank if it is already on the lead
   - Duration is in seconds (60 = one minute)
   - Click **Log call**
7. Type what they said under **Follow-up notes** and click **Save note**.
8. **Move stage** from **New** to **Contacted**.
9. If another salesman will visit them, **Assign** the lead to that user.

**Log call** records an outbound connected call. The separate **Call** button appears only when a phone system (CTI) is connected. It is off until that is set up.

---

## 6. Market salesman: demo and sale of this owner’s products

This is the path when the salesman visits a buyer to **show and sell this shop’s products**. The buyer is a customer of this owner. They are not a new SugamFlow shop.

### Before leaving

1. Sign in to CRM with **your** username (same shop id as the owner).
2. Open **My Day** for follow-ups already due.
3. Open **Leads**. Search the phone number. If the person already exists, open that lead. Do not create a second one. Use **Find duplicates** if you are unsure.

### At the visit

1. If they are new, **Create lead** with title, contact, company, and phone.
2. **Edit** the lead. Set **Source** to `VISIT`. Save.
3. After the demo, **Log call** (duration of the meeting) and **Save note**:
   - what you showed
   - what they want to buy
   - next date
4. **Move stage** to **Contacted**, or to **Demo / trial** if the workspace template is RETAIL.
5. If they are serious, fill **Qualification** (budget, who decides, what they need, when) and save it.

### When they agree to buy

1. **Convert to CRM**
   - Account: Create new (their shop or company name, phone, GSTIN if you have it)
   - Contact: Create new
   - Tick **Create opportunity** and enter the amount
   - Tick **Mark lead CONVERTED**
2. **Convert to ERP** → choose **Shop customer** → **Convert to ERP**.  
   They now exist on the shop’s customer list. The button does not create the bill by itself.
3. Open **Quotes**. Add the products and amounts. Send or accept the quote.
4. Tell the counter the customer name and quote. They bill in the **shop app** (stock and payment). When quote-to-order is on, accepting the quote creates the shop order for them.

### If they do not buy

- **Edit** the lead and set status to **LOST**, or move the stage to **Lost**.
- Save a note with the reason so the next visit does not start from zero.

---

## 7. When to use Field Force instead

Use **Field Force** only if the salesman’s job is to **bring a new business onto SugamFlow** (a new shop id, owner invite, subscription). Example: visiting a medical store to sell SugamFlow itself.

Do **not** use Field Force when the salesman is selling this owner’s goods to a buyer. That visit stays in CRM (section 6). Completing a Field Force conversion **creates a new shop**. That is the wrong result for a product sale.

If a CRM lead really should become a Field Force onboarding lead:

1. Open the lead.
2. **Convert to ERP** → **Field Force**.
3. Or click **Open visit** under **Field Force visit** (opens the visit screen for that lead).

Field Force login is **Employee** mode, with that salesman’s own username. The shop id at login is the anchor shop on their invite, not the name of the shop they are standing in.

---

## 8. Day checklist

**Owner (morning)**  
- My Day: overdue, due today, meetings, hot leads (score 70+).  
- Unassigned leads on the board. Assign them.

**Salesman (each visit)**  
- Search the phone first.  
- Create or update the lead. Source `VISIT`.  
- Log the demo and a note.  
- Move the stage.  
- Convert to shop customer only when they will buy.

**Counter (when sales says “bill this”)**  
- Find the customer in the shop app (created from CRM).  
- Bill the quote. Take payment. Stock drops in the shop app.

---

## 9. Words on the screen

| Word | Meaning |
|---|---|
| Lead | Someone who might buy. Not yet a shop customer. |
| Stage | Where they are in the pipeline (New, Contacted, Qualified, …). |
| Status | OPEN, QUALIFIED, CONVERTED, LOST, or DUPLICATE. |
| Account / Contact | The company and the person, inside CRM. |
| Opportunity / Deal | The sale you are trying to close, with an amount. |
| Quote | The price you offered. |
| Shop customer | The same person on the shop ERP customer list. |
| Order / bill | The sale in the shop app. Stock and payment live here. |

---

## 10. Local demo (SugamFlow team only)

Not for the client’s live shop.

| Item | Value |
|---|---|
| CRM | http://localhost:4500 |
| Shop id | `CRM-DEMO-01` |
| Username | `demo` |
| Password | `Demo@2026` |
| Workspace | Demo Workspace. Bootstrap as **RETAIL** if you are showing market demos. |

Live ERP customer create and quote-to-order stay off until `CRM_CONVERT_SHOP_URL` points at the shop customer API and quote-to-order is enabled. Until then, **Convert to ERP** stores the request in CRM and the counter still creates the bill in the shop app.
