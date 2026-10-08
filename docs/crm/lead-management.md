# Lead management

How a salesperson works a lead on the Leads screen (`/leads`).

Related: [creation](lead-creation.md), [lifecycle](lead-lifecycle.md), [conversion](lead-conversion.md), [filters](lead-filters.md), [scoring](lead-scoring.md), [AI](ai-features.md), [UI conventions](ui-ux-guidelines.md).

## Where you are

The page header is **Leads**. The pipeline chips show the workspace stages (GENERIC: New, Contacted, Qualified, Proposal, Won, Lost). Click a chip to show only that stage. Click it again to show every stage.

Kanban and List are the same leads. Open a card or a row to open the detail drawer.

## What a lead is

A lead is an enquiry before it is a CRM account or a shop customer. Status and pipeline stage are different:

| | Meaning |
|---|---|
| **Stage** | Where it sits on the sales pipeline. Comes from the workspace template. |
| **Status** | OPEN, QUALIFIED, CONVERTED, LOST, or DUPLICATE. |

A converted lead can still sit in a stage such as Won. The list includes converted leads. Filter status to CONVERTED when you only want those.

## Drawer

The drawer opens on the right (full width on a narrow screen).

| Tab | What you do there |
|---|---|
| **Overview** | Who they are, edit, qualification, tags, move stage, assign |
| **Convert** | Guided convert to a CRM account, contact, and optional deal |
| **Activity** | Log a call, send a message, add a note, timeline |
| **Shop** | Convert to a shop customer (ERP). Separate from Convert to CRM |
| **More** | AI assistant, duplicates, sequences, attachments, field-force visit |

## Actions

One primary action: **Convert to CRM**.

Secondary: **Log call**, **Add note**, **Book meeting**. Those open Activity, except Book meeting, which books immediately.

**More** holds Rescore, Find duplicates, AI summary, Next best action, and a shortcut to the Shop tab.

## Search and filters

Search is the box in the header (name, phone, company) and runs against the API. Status, source, and owner live under **Filters** and apply to the leads already loaded. See [lead-filters.md](lead-filters.md).

## Editing

Overview → **Edit**. Title is required. Source, priority, and status are selects. Save writes `PUT /api/v1/crm/leads/{id}`.

## Assignment

Overview → **Assign**. Round-robin uses the team added under **Import / team**. Manual assignment needs an owner user id.

## Notes and activity

Activity → **Add note** writes the timeline. **Log call** records an outbound call (duration in seconds). The **Call** button appears only when CTI is enabled.

## Import and team

**Import / team** is closed until you open it. CSV/XLSX import and round-robin members are unchanged.
