# Lead lifecycle

Two fields move independently. Do not invent a single “Meeting” status.

## Pipeline stage

Stages come from the workspace template (`POST /api/v1/crm/workspaces/bootstrap`). The Leads page draws one chip per stage. Counts are the leads currently loaded.

**GENERIC** sales pipeline:

New → Contacted → Qualified → Proposal → Won → Lost

**RETAIL** sales pipeline:

Walk-in / inbound → Demo / trial → Quote → Sold → Lost

Move a lead from the card’s stage select or from Overview → **Move stage**. That calls the existing stage API. Won and Lost flags on the template mark terminal stages. Deal pipelines (Discovery, Proposal, and so on) belong to opportunities, not to the lead chips.

## Lead status

Stored on the lead. Edited from Overview → Edit.

| Status | When |
|---|---|
| OPEN | Default after create |
| QUALIFIED | The enquiry is worth pursuing. This is a status, not the Qualified stage |
| CONVERTED | Set by Convert to CRM when “Mark lead CONVERTED” is on |
| LOST | They will not buy |
| DUPLICATE | Merged into another lead |

Convert does not clear `stageId`. A CONVERTED lead can remain on Won (or Sold). Use the status filter to find them.

## What the chips are not

The chips are pipeline stages from the database. They are not a new backend enum. A RETAIL workspace will not show “New → Contacted → Proposal”.
