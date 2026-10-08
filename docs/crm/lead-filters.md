# Lead search and filters

## Search

Header search sends the query to the leads API (name, phone, company, title). Press Enter or **Search**.

## Filters

**Filters** opens a panel. It does not stay on the page.

| Filter | Values |
|---|---|
| Status | Any, OPEN, QUALIFIED, CONVERTED, LOST, DUPLICATE |
| Source | Any, plus Phone call, Market visit, Walk-in, Website, Referral |
| Owner | Any, plus team members and owners already on loaded leads |

**Clear** resets status, source, owner, and the stage chip.

These three filters run on the leads already loaded. They do not add a new API query. A lead on a later page is not included until search or paging loads it.

## Stage chips

Each chip is a pipeline stage. Clicking it sets `stageId`. Kanban then shows that column only. List rows use the same filter. Click the active chip to clear it.

## Saved views

The leads API has no saved-filter resource. Do not add a “save this view” control until that exists.

## List columns

Lead (title and contact), Company, Phone, Stage, Status, Owner, Score (`n — BAND`). Open the row for the rest. Kanban cards show title, person or company, owner, and the same score label.
