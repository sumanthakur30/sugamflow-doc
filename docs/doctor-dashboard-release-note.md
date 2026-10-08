# Doctor Dashboard Upgrade Release Note

## Overview

This release upgrades the OPD consultation and prescription workflow to improve speed, safety, and clinical usability for doctors in high-volume clinic settings.

Primary goals delivered:
- Reduce clicks and typing effort during consultation.
- Improve prescribing safety with in-context warnings.
- Separate and streamline medicine vs investigation workflows.
- Provide cleaner preview/share/print options before final prescription output.

## Key Improvements

### 1) Reception Queue Correction + Audit

- Added edit action in Today's appointments queue for correcting wrong doctor assignment.
- Added backend update endpoint for appointments.
- Added edit audit fields and display:
  - `lastEditedBy`
  - `lastEditedAt`
- Added dedicated "Last edited" column in queue table.

## 2) Investigations Workflow (Recommended Tests)

- Added dedicated investigations section in Doctor Dashboard.
- Added fast search for tests.
- Added one-click common investigations:
  - CBC
  - Blood Sugar
  - Thyroid Profile
  - X-Ray Chest
  - MRI
  - Vitamin D
  - LFT/KFT
  - Urine Routine
- Added one-click investigation packages:
  - Fever Workup
  - Diabetes Monitoring
  - Thyroid Panel
- Added recent-test quick chips.
- Added save lab order flow from consultation pad.

## 3) Prescription Standardization + Safety

- Enhanced medicine entry with structured fields and faster controls:
  - Route selector (Oral/Injection/Topical/Inhalation/Other)
  - M/A/N selector (Morning/Afternoon/Night)
  - Follow-up date capture in consultation
- Added favorites and recent medicine quick-add.
- Added safety warnings:
  - Soft warning: duplicate medicine detection
  - Hard warning: allergy conflict detection (name/generic/composition matching)

## 4) View/Preview/Share Workflow

- Added "View draft" mode before print.
- Kept and improved draft/saved print-PDF flow:
  - Print draft
  - PDF draft
  - Print saved Rx
  - PDF saved Rx
- Added reuse/duplication actions:
  - Reuse previous prescription
  - Duplicate saved prescription to pad
- Added quick share actions:
  - Share draft on WhatsApp
  - Share draft by Email

## 5) OPD Speed Optimization

- Added keyboard shortcuts in consultation mode:
  - `Alt+1`: focus Chief complaint
  - `Alt+2`: focus Diagnosis
  - `Alt+3`: focus Clinical notes
  - `Alt+4`: focus Follow-up date
  - `Alt+5`: focus Investigation search
  - `Alt+6`: focus first Medicine field
  - `Ctrl+Enter`: quick save
- Added in-screen shortcut legend for doctor discoverability.
- Improved sticky action bar behavior for mobile/tablet via responsive action grid.

## 6) Draft Continuity

- Added local draft autosave for consultation pad (doctor+shop+patient scoped).
- Added draft auto-restore when same patient consultation is resumed.
- Added draft clear on visit completion.
- Added autosave status label in UI.

## 7) Integration Cues

- Added lab integration readiness hint when test catalog is available.
- Added pharmacy integration readiness hint when medicine catalog is available.

## Files Added

- `shop-management-ui/src/app/components/doctor-dashboard/doctor-dashboard.component.spec.ts`
- `shop-management-ui/tools/doctor-dashboard-opd-checklist.md`
- `appointment-service/src/main/resources/db/migration/V2__appointment_edit_audit.sql`
- `docs/doctor-dashboard-release-note.md`

## Files Updated (major)

- `shop-management-ui/src/app/components/doctor-dashboard/doctor-dashboard.component.ts`
- `shop-management-ui/src/app/components/doctor-dashboard/doctor-dashboard.component.html`
- `shop-management-ui/src/app/components/doctor-dashboard/doctor-dashboard.component.scss`
- `shop-management-ui/src/app/components/rx-line-form/rx-line-form.component.ts`
- `shop-management-ui/src/app/components/rx-line-form/rx-line-form.component.html`
- `shop-management-ui/src/app/constants/prescription-rx.model.ts`
- `shop-management-ui/src/app/services/appointment.service.ts`
- `shop-management-ui/src/app/components/reception-dashboard/reception-dashboard.component.ts`
- `shop-management-ui/src/app/components/reception-dashboard/reception-dashboard.component.html`
- `appointment-service/src/main/java/com/shopmanagement/appointmentservice/web/AppointmentController.java`
- `appointment-service/src/main/java/com/shopmanagement/appointmentservice/service/AppointmentService.java`
- `appointment-service/src/main/java/com/shopmanagement/appointmentservice/model/Appointment.java`
- `appointment-service/src/main/java/com/shopmanagement/appointmentservice/filter/RequestIdFilter.java`
- `appointment-service/src/main/java/com/shopmanagement/appointmentservice/support/TenantContext.java`

## QA and Validation

Automated checks completed during rollout:
- Focused Angular component/spec runs for doctor dashboard and Rx logic.
- Lint/diagnostic checks for all modified UI files.
- Final doctor-dashboard component spec status: passing.

Manual verification checklist provided at:
- `shop-management-ui/tools/doctor-dashboard-opd-checklist.md`

## Deployment Notes

- Restart/redeploy `appointment-service` to apply migration and new appointment update flow.
- Ensure frontend (`shop-management-ui`) is rebuilt and deployed with dashboard updates.
- Verify gateway continues forwarding `X-Auth-User` for appointment audit attribution.

## Expected Outcome

Doctors can complete most OPD consultations with fewer interactions, clearer decision support, and faster prescription output while maintaining better safety and traceability.
