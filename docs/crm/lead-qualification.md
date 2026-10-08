# Lead qualification

Qualification is separate from the pipeline stage named Qualified and from the status QUALIFIED.

## Status

Set status to QUALIFIED from Overview → Edit when the enquiry is worth pursuing. That does not move the stage. Move the stage with **Move stage** when the sales step actually changed. See [lead-lifecycle.md](lead-lifecycle.md).

## Score and rating

Score and band are calculated. Priority (Low, Medium, High, Hot) is chosen by the user. See [lead-scoring.md](lead-scoring.md).

## Qualification answers

Overview → **Qualification**. The schema is the tenant’s (default BANT when Ops has loaded qualification schemas). Each field is whatever the schema defines (text or textarea). **Save qualification** writes the answers onto this lead.

If the schema list is empty, the drawer says to load Ops → Qualification schemas and reopen the lead.

Use this after a real conversation: budget, who decides, what they need, and when. It is not part of **New lead**, because those answers are not known at create time.
