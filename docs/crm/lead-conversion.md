# Lead conversion

Two conversions. They are not interchangeable.

| Action | Result |
|---|---|
| **Convert to CRM** | CRM account, optional contact, optional opportunity. Can mark the lead CONVERTED |
| **Shop tab → Convert to shop** | Shop customer (or school inquiry, or field-force lead). Does not create the bill |

Convert to CRM does not add a patient or customer on the shop list. The shop API needs the numeric tenant id, not the shop code string in the Tenant box. See `CRM-AND-SHOP-ERP-CLIENT-GUIDE.md`.

## Convert to CRM wizard

Primary button **Convert to CRM**, or the Convert tab. API: `POST /api/v1/crm/leads/{id}/convert-to-crm`. Same payload as before.

1. **Account** — Create new (name, GSTIN, phone, email) or Existing (account select). Next is blocked until an existing account is picked.
2. **Contact** — Create new, Existing, or Skip. Existing requires a contact on the account chosen in step 1.
3. **Opportunity** — Off by default in the step until you tick **Create opportunity**. Name and amount appear only when it is on. The deal currency sent by this call is INR. Stage and expected close date are not fields on this API. The deal opens on the deal pipeline’s first stage.
4. **Confirm** — Account, contact, opportunity, amount. **Mark lead CONVERTED** stays available (default on). **Convert lead** runs the API.

**Quick opportunity only** stays on the confirm step. It creates a deal without the account/contact convert.

If the lead already has an account or contact, the wizard opens on Existing for that side and fills the name, phone, and email from the lead.

## Errors

| Message | Cause |
|---|---|
| Pick an existing account, or choose Create new. | Step 1, Existing, nothing selected |
| Pick an existing contact, or choose Create new. | Step 2, Existing, nothing selected |
| API error text from the server | Shown as returned. A missing title or invalid account id comes from crm-service, not a generic “something went wrong” |

## After success

The green message includes status, account id, and opportunity id when present. The lead stays open. Reload shows status CONVERTED when that box was ticked. The person is still not a shop customer until the Shop tab convert succeeds.
