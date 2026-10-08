# SugamFlow — Sales agent product brief

Pass this to reps for demos, calls, and follow-ups. Adjust pricing and deployment claims to match your current commercial offer.

---

## Elevator pitch (15 seconds)

**SugamFlow** is a **web-based shop operations system**: take **orders at the counter**, see **live stock**, manage **customers** and **staff**, and run the business from **one dashboard**—without juggling spreadsheets and notebooks.

---

## Who it’s for

- **Retail shops** (single or multi-branch): groceries, cosmetics, electronics, pharmacy-style workflows where supported.
- **Owners** who want visibility into sales, dues, and inventory.
- **Counter staff** who need speed, fewer mistakes, and clear product/stock context.

---

## Top selling points (memorize these)

| Theme | What to say |
|--------|-------------|
| **All-in-one** | Orders, products, stock, customers, and team access in one place. |
| **Faster billing** | Product lines, qty, MRP, discount %, auto price and line totals in **INR**. |
| **Fewer stock errors** | **Available quantity** shown while adding items (for the **active branch**). |
| **Smarter collections** | **Due / unpaid / partial** payments; filter orders by due amount; see **outstanding** on customer history. |
| **Customer context** | Pick a customer, see **past orders** and balance context when needed (panel can be **hidden** for a clean screen). |
| **Multi-shop ready** | **Active shop / branch** in the header—data stays scoped to the right location. |
| **Controlled access** | Role-based use (e.g. owner vs staff vs platform admin)—people see what they need. |
| **No install for users** | Runs in the **browser**; good for counter PCs and tablets. |

---

## Feature checklist (for demos)

Use this order on a live or staging environment.

1. **Login** → confirm **shop / branch** in the header.
2. **Products** — show catalog exists and is usable for order lines.
3. **Orders → Add order**
   - Search and **select customer**; optional **+ Add user**.
   - Add line: **product**, see **Avail.** when a product is selected, **qty**, **MRP**, **Disc %**, **price**, **line total**.
   - **Payment**: cash / UPI / card / bank / **credit**; **paid / unpaid / partial**; **due** where relevant.
   - **Show order history** (header): customer’s **recent orders**, **outstanding** summary, **open** to edit.
4. **Orders (list)**
   - Search and filters; **due** quick filters if relevant.
   - **Customer history**: pick a customer → list filters to **their orders**; **all orders** to reset.
5. **Stock** — show stock list / maintenance if the prospect cares about back office.
6. **Staff / Customers** — mention only if permissions match the buyer.

---

## Differentiators vs. common alternatives

| Vs. | Angle |
|-----|--------|
| **Notebook / Excel** | One source of truth; less double entry; dues and history don’t get lost. |
| **Basic billing-only apps** | Tied to **inventory** and **branch** context, not just printing a bill. |
| **Heavy ERP** | Lighter path for **SMB retail**—faster to learn at the counter. |

(Keep claims honest: customize “heavy ERP” wording to your market.)

---

## Objections — short responses

- **“We’re small.”** — Built for shops that have outgrown manual tracking but don’t want enterprise complexity.
- **“Staff won’t learn it.”** — Flow mirrors natural steps: customer → lines → pay. Stock and history are optional on the same screen.
- **“Internet worries.”** — Clarify your hosting (cloud / on-prem) and backup story per your actual deployment.
- **“Price.”** — Anchor on **time saved**, **fewer stock mistakes**, and **clear dues**—not just “software cost.”

---

## What not to promise without checking

- Exact **integrations** (accounting, e-commerce, SMS) unless product/engineering confirms.
- **Offline-first** mode unless you sell it explicitly.
- **Legal/compliance** (GST filing automation, etc.) unless documented in your contract.

---

## Internal note for agents

- **Product name in repo/UI** may appear as shop / tenant labels (e.g. “Shop Manager”)—align language with your **customer-facing brand** (SugamFlow vs white-label).
- For **technical buyers**, mention: modular services, API-backed, suitable for **hosted** rollout (details per your `docs/` deployment guides).

---

## Document control

- **Purpose**: Sales enablement — feature overview and demo flow.
- **Audience**: Field sales, partners, SDRs.
- **Update when**: Major UI flows change (orders, stock, auth) or positioning shifts.

_Last updated: May 2026 (align with current product build)._
