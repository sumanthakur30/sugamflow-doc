# CRM UI conventions

Reference for Leads and later CRM screens. Palette stays the existing navy `#1f4b6e` on `#f3f5f7`. Do not introduce a second theme.

## Forms

- Group fields. Show the minimum first. Put campaign, UTM, owner, and amount behind a disclosure.
- Mark required fields with `*` and block submit with a specific message (`Title is required`).
- Free text stays text: title, person, company, email, phone, address, notes, UTM.
- Controlled values use a `<select>`: source, status, priority, currency, account, contact, campaign, owner, pipeline stage.
- Do not add a dropdown for a value the API does not store.
- Defaults the product already knows: source Phone call, priority Medium, currency INR, opportunity name `Deal · {title}`, account/contact prefilled from the lead.

## Buttons

- One primary button for the job on that surface (New lead, Create lead, Convert lead).
- Secondary buttons are the next useful actions (Log call, Add note, Book meeting, Search).
- Rare actions go under **More** (rescore, duplicates, AI, shop convert shortcut).

## Status and score

- Status and stage are badges with the word, not color alone.
- Score is `{number} — {HOT|WARM|COLD}` using the existing band classes.

## Drawers and tabs

- Lead detail is a right drawer, about 440px, full width under 720px.
- One tab visible at a time: Overview, Convert, Activity, Shop, More.
- Convert is a wizard. Fields for a step that is off (new vs existing, create opportunity) stay hidden.
- Destructive removes (tag, attachment) stay on the control that owns them. Do not add a second confirm pattern for those until the API requires it.

## Lists

- Prefer few columns. Open the row for the full record.
- Empty copy says what happened (`No leads match these filters`, `Empty` on a stage).
- Horizontal scroll is acceptable on a narrow table. Do not drop the score or status column.

## Filters

- Search stays in the header.
- Secondary filters live in a panel that can be closed.

## Errors

- Show the server message when the API returns one.
- Client checks name the missing choice (`Pick an existing account, or choose Create new.`).

## Responsive

- Header actions wrap.
- Create form rows stack.
- Drawer tabs and action buttons can shrink onto more than one line.
- Below roughly 800px, two-column tool panels become one column (existing `.grid-2` rule).

## Accessibility

- Buttons are real `<button>` elements.
- Selects are labelled.
- AI buttons expose a `title` that says what the action does, or why it is disabled.
- Do not rely on color alone for score or status.
