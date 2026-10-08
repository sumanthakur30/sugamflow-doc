# Lead creation

**New lead** on the Leads page. API: `POST /api/v1/crm/leads` (`LeadUpsert`).

## Purpose

Record an enquiry with the facts you already have. The rest can wait.

## Always visible

| Field | Control | Required | Default |
|---|---|---|---|
| Title | Text | Yes | Empty. Create is blocked with “Title is required” |
| Contact name | Text | No | Empty |
| Company | Text | No | Empty |
| Phone | Text | No | Empty |
| Email | Email | No | Empty |
| Source | Select | No | `CALL` (Phone call) |

Source options: Phone call (`CALL`), Market visit (`VISIT`), Walk-in (`WALKIN`), Website (`WEBSITE`), Referral (`REFERRAL`). The API still accepts any source code up to 64 characters. An unknown code already stored on a lead stays selectable when you edit it.

## Hidden until “Campaign, account, UTM”

| Field | Control | Default |
|---|---|---|
| Priority | Select: Low, Medium, High, Hot | Medium |
| Expected value | Number (`amount`) | Empty |
| Currency | Select: INR, USD | INR |
| Owner | Select of team members | Unassigned |
| Account | Select of CRM accounts | None |
| CRM contact | Select of contacts on the chosen account | None, disabled until an account is picked |
| Campaign | Select of campaigns | None |
| utm_source, utm_medium, utm_campaign | Text | Empty |

Picking a different account clears the contact.

## Not on this form

Industry, company size, lead type, country, state, and city are not columns on `LeadUpsert`. Do not add them as dropdowns until the API has them. Qualification answers (BANT) are saved later from the lead drawer, not at create time.

## Expected result

The lead is created, the board reloads, and the drawer opens on Overview. Stage is the pipeline default (first stage after bootstrap). Status is OPEN. Score starts at 0, band COLD, shown as `0 — COLD`.
