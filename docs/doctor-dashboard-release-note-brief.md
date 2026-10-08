# Doctor Dashboard Upgrade (Brief for Doctors)

## What is improved for you

This update is designed to make OPD consultations faster, cleaner, and safer.

- Less typing with quick actions and keyboard shortcuts.
- Faster medicines and investigations entry.
- Better patient safety alerts while prescribing.
- Better preview/share options before final print.
- Draft continuity so work is not lost between interruptions.

## Key changes you will use daily

### 1) Faster prescribing

- One-click **favorite medicines** and **recent medicines**.
- One-click **common tests** and **test packages**.
- Structured medicine format now supports:
  - Route (Oral/Injection/etc.)
  - M/A/N selection (Morning/Afternoon/Night)
  - Follow-up date capture

### 2) Safety support during consultation

- **Hard warning** for possible allergy conflicts.
- **Soft warning** for duplicate medicine entries.

Please review and correct warnings before saving final prescription.

### 3) Better prescription actions

- **View draft** before print.
- Print/PDF for draft and saved prescription.
- **Reuse previous prescription** quickly.
- **Duplicate saved Rx** into current pad.
- Quick share via **WhatsApp** and **Email** flow.

### 4) Draft autosave

- Consultation draft now auto-saves locally.
- If the same patient is reopened, draft is restored.
- Draft is cleared automatically after visit completion.

## Keyboard shortcuts (consultation mode)

- `Alt+1` → Chief complaint
- `Alt+2` → Diagnosis
- `Alt+3` → Clinical notes
- `Alt+4` → Follow-up date
- `Alt+5` → Investigation search
- `Alt+6` → First medicine field
- `Ctrl+Enter` → Save

## Suggested OPD flow (1-2 minute target)

1. Start visit from queue.
2. Enter complaint/diagnosis quickly using shortcuts.
3. Add medicines from favorites/recent, then refine route + M/A/N.
4. Add tests from common list/package if required.
5. Review safety warnings.
6. View draft.
7. Save and end visit.

## If something looks wrong

- Refresh Doctor Dashboard once.
- If print/PDF/share fails, save prescription first, then retry.
- If no test/medicine appears, ask admin to verify catalog entries.

---

Detailed release note:
- `docs/doctor-dashboard-release-note.md`

Doctor QA checklist:
- `shop-management-ui/tools/doctor-dashboard-opd-checklist.md`
