# SugamFlow Standard PathLab — analysis and design

Date: 26 Sep 2026. Status: design only. No application code was changed.

This document is the plan to approve before a PathLab refactor. It does not contain client patient names, visit numbers, phone numbers, or result values.

Sources:

- `D:\Clients_Data\Trust-Med` — two PDF patient reports only. No Excel, Word, image masters, or database dumps. Files were read locally and were not copied into git.
- Existing SugamFlow PathLab in `order-service`, `shop-management-ui`, `shop-service`, and `product-service`.
- Public Dr Lal PathLabs patient-facing behaviour (website, app listing, public FAQ). Their reference guide is copyrighted and is not reproduced here.

Legend used below: **KEEP**, **REFACTOR**, **ADD**, **REMOVE**, **CONFIGURE**.

---

## 1. Current Trust-Med workflow (inferred from reports)

The folder is a report archive, not a laboratory information system. The workflow below is what the printed reports prove, not a full reception-to-cash process.

1. A person is registered with a name, age in years, and gender.
2. The visit gets two identifiers: a **visit id** (numeric) and a **daily serial** shaped like `10` + `YYMMDD` + `-` + a same-day sequence.
3. **Billing To** on both samples is `Self`. One report names a referring doctor. The other leaves **Ref By Doctor** blank.
4. **Registered On** and **Received On** are recorded. They can be the same minute or a few minutes apart. There is no separate “collected on” label on these prints.
5. Tests are sold as a large package, as a named panel (liver, kidney, lipid, thyroid, urine, CBC), or as a single investigation.
6. Results are released the same day. Both prints are stamped **Partial Report** on every page, including pages that already contain completed sections.
7. Each page repeats the patient block, column headers, and a watermark line of name + gender + visit id.
8. Payment, commission, sample type, container, and a named signatory are not on the print. Logo, barcode, and signature, if present, are graphics and did not come through as text.

## 2. Current SugamFlow PathLab workflow

PathLab already exists. It is not a blank module.

Patient is a shared **Customer** (`uhid`, phone, gender, date of birth). A lab visit is a **`lab_orders`** row, optionally linked to a clinic encounter, prescription, or clinical referral. Tests are **`lab_order_items`**. Tubes are **`lab_samples`**. The bill is a normal sales **`orders`** row with `billType = LAB`. Results live on **`lab_report_versions`** (legacy `lab_results` still exists). PDF release stores bytes on **`lab_report_documents`**.

Staff flow today:

Patient search or create → `/path-lab/booking` → bill / pay → worklist collect → `/path-lab/accession` → `/path-lab/reports` result entry → approve / release PDF → WhatsApp notify or deliver.

Order statuses in code (`LAB_SAMPLE_REPORT`): `SAMPLE_PENDING` → `SAMPLE_COLLECTED` → `SAMPLE_ACCEPTED` or `SAMPLE_REJECTED` → `PROCESSING` → `REPORT_READY` → `DELIVERED`, plus `CANCELLED`. Report versions: `DRAFT` → `PENDING_APPROVAL` → `APPROVED` → signed → `RELEASED` → `DELIVERED`. Amend opens a new draft.

## 3. Trust-Med report structure

Repeated on every page:

| Block | What is on the print |
|---|---|
| Identity | Patient name, age/gender, visit id, serial number |
| Parties | Billing To, Ref By Doctor (optional) |
| Times | Registered On, Received On, Reported On |
| Status | Report Status = Partial Report on both files |
| Table | Investigation, Observed Value, Flag, Unit, Biological reference range |
| Grouping | Package, then department, then panel, then parameter |
| Method | Printed under the parameter (`GOD/POD`, `IFCC`, `Calculated`, `CLIA`, `ELISA`, …) |
| Narrative | Criteria, comment, note, or interpretation after a panel |
| Flags | `H` and `L` only when out of the printed range. In-range rows have a blank flag |
| Result kinds | Number, calculated number, qualitative (`Negative`, colour, `Acidic`), index with bands |

Departments actually used: Haematology, Biochemistry, Clinical Pathology, Immunology.

Panels and packages actually used: CBC, advanced haemogram, malaria antigen, fasting sugar, liver function with GGT, lipid profile, kidney function, iron studies, HbA1c, thyroid profile, vitamins D3 and B12, urine routine, dengue NS1, typhoid IgM.

Catalog choices that must stay configurable, not hard-coded: HbA1c sits under Haematology in one report; vitamins sit under Immunology. That is this lab’s catalog, not a universal rule.

Not proven by these files: barcode payload, accreditation text, pathologist name, critical-value mark, corrected-report mark, corporate billing, home collection, or a final (non-partial) report.

## 4. Existing database structure

Almost all lab tables are in **order-service** (Flyway about V5 through V106). Important tables:

- `lab_orders`, `lab_order_items` — visit and ordered tests, patient snapshot, referral snapshot, purchase status
- `lab_samples`, `lab_sample_events` — barcode, container, collect / accept / reject / dispatch / receive, aliquots, storage
- `lab_report_versions`, `lab_report_version_items`, `lab_report_documents`, `lab_report_audit_log`
- `lab_reference_ranges` — sex, age in days, pregnancy / gestation, critical low / high
- `lab_test_definitions`, `lab_parameters`, profiles / packages, formulas, approval policies
- `lab_referring_doctors`, commission rules, rate cards, barcode sequences
- Clinical link: `clinical_referrals`, `orders.lab_order_id`, `order_items.lab_order_item_id`

There is no separate PathLab patient table. **KEEP** `customers` as the permanent person. **KEEP** `lab_orders` as the visit.

`product-service` only has LAB product SKUs. `shop-service` owns business type and which shop is the path lab. `stock-service` has no lab schema.

## 5. Existing API structure

Staff APIs sit under `/sales-admin` (gateway `/api/...`).

- Orders and worklist: `/sales-admin/lab-orders`, worklist page, dashboard metrics
- Samples: `/sales-admin/lab-samples` collect, accept, reject, dispatch, receive, aliquots, label
- Barcodes: `/sales-admin/lab-barcodes`
- Results and PDF: `/sales-admin/lab-report-versions` draft, ready, approve, sign, release, deliver, amend, notify, PDF
- Bills: `/sales-admin/healthcare/lab-orders/{id}/create-bill` and `mark-paid`
- Catalog: `/sales-admin/lab-catalog`
- Referrals and commissions: `/sales-admin/lab-referrals`, `/sales-admin/lab-referring-doctors`, `/sales-admin/lab-doctor-commissions`
- Public: report verify / PDF token, patient portal OTP, doctor portal OTP

**KEEP** these contracts. New behaviour should extend them.

## 6. Existing UI structure

Routes live in `healthcare-routing.module.ts`. Daily header (max 5): Dashboard, Orders (`/path-lab/booking`), Worklist, Reports, Payments.

Sidebar already has accession, test master, instruments, QC, network, camps, referrals, commissions, rate cards, NABL, department boards, report templates, validation policies, barcode settings, and a role-template page.

Patients are the shared customer selector. Result entry is `/path-lab/reports`. Ranges should come from `LabCatalogService.entryTemplates`. A fallback file `lab-report-panel-templates.ts` still hard-codes adult ranges for common panels. **REFACTOR** that fallback so it cannot silently override catalog ranges.

Role names on `/path-lab/role-templates` are documentation. Real gates are permission keys such as `MANAGE_LAB_ORDERS`, `MANAGE_LAB_RESULTS`, and `RELEASE_LAB_REPORTS`.

## 7. Lal PathLabs — public observations only

Observed on public pages and the app listing, not from any private system:

- Walk-in collection centres, plus home collection booked by phone, website, or app.
- Phlebotomist tracking is an app feature.
- Reports are fetched with a lab/visit id and a password. The app also shows current and older reports, including family profiles.
- Tests and packaged health checkups are both sold.
- Doctors, corporates, and collection-centre partners are separate public relationships.
- Published service notes describe critical-value alerts, turnaround monitoring, adding a test while the specimen is still usable, and not cancelling after the assay has run.

Not observed in enough detail to copy: their exact report grid, accession format, internal status names, or commission rules.

## 8. Industry-standard workflow (recommendation, not a copy)

Patient (one identity) → visit → referring doctor optional → tests or packages → bill → collect → barcode per tube → receive in department → enter result → technician check → pathologist approval → partial or final PDF → print / WhatsApp / email → history kept forever.

A later visit for the same test is a new `lab_order`, never an update of the old result.

## 9. Gaps

| Need | Today |
|---|---|
| Trust-Med style print (serial, billing party, partial stamp, method, criteria, package then department) | PDF renderer exists (`LabReportPdfRenderer`) but layout is a generic NABL skin, not this grouping |
| Partial release of finished departments | `PARTIAL` is only an unpublished label. Release is whole-version |
| Field-level “who changed this number, from what, why” | Audit log is action-level. Amendments create a new version, which is good, but line diffs are not first-class |
| One resolved range on the print | Catalog ranges by sex and age exist. UI can still inject hard-coded panels |
| Daily serial distinct from visit id and tube barcode | Barcode sequences exist. A reception serial like the date-based serial is not a separate displayed field |
| Simple desks for reception, collector, technician, pathologist | Many screens exist. Role page does not enforce them |
| Final vs corrected watermark | Amendment banner exists for version &gt; 1. Partial vs final is weak |

What is already enough and should not be rewritten: customer identity, lab order, samples, catalog, reference ranges, formulas, sales bill, referral doctors, commissions, clinic-to-lab referral, tenant/shop scope, payment-before-release.

## 10. Proposed architecture

**KEEP** one LIS inside `order-service`. Do not add a new PathLab microservice.

**KEEP** three deployments of the same module:

- Standalone shop `PATH_LAB` / `PATHOLOGY_LAB` / `DIAGNOSTIC_LAB`
- Polyclinic or clinic sending `clinical_referrals` into a path-lab shop
- Pharmacy or medical shop in the same tenant seeing released reports only through existing patient history and referral rules

**REFACTOR** presentation and a few workflow gaps. **Do not** replace `lab_orders` with a second order system.

## 11. Proposed database changes

**KEEP** `customers`, `lab_orders`, `lab_order_items`, `lab_samples`, `lab_report_versions`, `lab_reference_ranges`, `lab_test_definitions`, `lab_parameters`, sales `orders`.

**ADD** only if the column is missing after a column check during implementation:

- `lab_orders.serial_number` — reception serial, unique per shop per day, displayed beside visit id
- `lab_orders.billing_party_name` — `Self`, corporate, or insurer display name (id can point at an existing customer or rate-card party)
- `lab_report_versions.release_scope` — `PARTIAL` or `FINAL`
- `lab_report_result_revisions` — `version_item_id`, previous value, new value, user, time, reason. Written when a released value changes. Never update a released number in place.

**CONFIGURE** existing columns rather than new masters: department, specimen, container, method, unit, decimal places, TAT, price, GST, age/sex/pregnancy ranges, critical limits, result type, interpretation text, formulas.

**REMOVE** nothing in the first phases. Legacy `lab_results` stays until clinic publish no longer reads it.

## 12. Proposed API changes

**KEEP** current paths.

**ADD**

- Release body flag `releaseScope=PARTIAL|FINAL`. Partial allowed only when every included line has a value and payment rule for those lines is satisfied. Final allowed only when every non-cancelled item on the order is included.
- `GET /sales-admin/lab-orders/search` — one query: name, mobile, UHID, visit id, serial, barcode, doctor, test, status, date. Server page. No full-table load.
- Revision list on the existing audit endpoint when a line changes after release.

**REFACTOR** PDF context so package, department, panel, method, criteria, partial/final, and signatory come from catalog + shop template, not from Angular constants.

## 13. Proposed UI changes

**KEEP** the five header tabs and the existing routes.

**REFACTOR**

- Booking: search patient, optional doctor, searchable test/package picker, billing party default `Self`, show visit id and serial after save.
- Reports screen: one grid — parameter, result, unit, resolved range, flag, method. Flag computed on the server from the resolved range. No hard-coded LFT/CBC ranges in the page.
- Worklist and accession stay, but reception and collector land on filtered views of those screens rather than new apps.

**ADD** a single search box on the dashboard that calls the search API.

**CONFIGURE** dashboard cards from the metrics API that already exists (today’s patients, pending samples, processing, approval, partial, final, collection, dues, critical). Hide cards the role cannot use.

Do not add a second navigation shell.

## 14. Report engine

**KEEP** `LabReportPdfRenderer` and `LabReportPdfContextFactory`.

**REFACTOR** the layout into sections, all fed by context:

1. Header — logo, lab name, address, phone, email, website, accreditation and license lines, tagline. Shop settings, not Trust-Med text.
2. Patient band — name, UHID, age, gender, visit id, serial, doctor, billing party, registered, collected, received, reported, status.
3. Barcode of the visit or primary sample.
4. Body grouped **package → department → panel → parameter**, columns Investigation, Result, Flag, Unit, Reference range, method under the row when configured.
5. Panel interpretation and notes from the catalog.
6. Critical line only when a released value is critical.
7. Signatory block — name, qualification, registration, signature image.
8. Footer — page, generated time, disclaimer, watermark text.
9. Banner when scope is partial, when version &gt; 1 (corrected), or when reissued.

**CONFIGURE** fonts, margins, A4, colours, which columns show, watermark on/off. Default skin should look like a working Indian lab report: compact header, repeating patient band, clear H/L, blank flag when in range.

**REMOVE** the path that prints `LAB_REPORT_PANEL_TEMPLATES` ranges onto a patient report.

## 15. Master data

| Master | Where | Rule |
|---|---|---|
| Department | `lab` catalog departments | Seed Biochemistry, Haematology, Clinical Pathology, Microbiology, Serology, Immunology, Hormones. Molecular, histopathology, cytology stay available, inactive until used |
| Test | `lab_test_definitions` + parameters | One definition. Packages reference it. Do not copy parameters into each package |
| Package / profile | existing kind `PACKAGE` / `PROFILE` | Package contains profiles and tests. Example shape: Whole body profile → liver profile, kidney profile, lipid profile, vitamins. Names are catalog data |
| Sample type | specimen on the definition | Blood, serum, plasma, urine, stool, swab, sputum, semen, other |
| Container | container on the definition | EDTA, plain, fluoride, citrate, urine container, other |
| Range | `lab_reference_ranges` | Age, sex, pregnancy. Print the one range that matches the patient |
| Price / GST | test price + existing LAB bill | Do not invent a second price list |

Seed data must be anonymized demo tests. Do not load the two client PDFs.

## 16. Roles

**KEEP** permission keys. **CONFIGURE** staff templates so the keys match the job. The role-template page can stay as help text, but assigning a template must write real permissions.

| Role | Sees |
|---|---|
| Reception | Booking, today’s patients, pending payment, pending collection |
| Sample collector | Worklist collect + accession scan and handover |
| Technician | Department worklist, result draft, mark ready for review |
| Pathologist | Approval queue, critical rows, partial vs final release |
| Billing | Payments workspace already used at `/path-lab/payments` |
| Admin | Catalog, prices, templates, users, audit |
| Referring doctor | Existing doctor portal and clinic referral view, same tenant rules |

## 17. Status machine

Do not replace the current enums with a longer list. Map the requested language onto what already exists, and add one release scope.

| Daily word | Stored as |
|---|---|
| Registered | `lab_orders` created, `SAMPLE_PENDING` |
| Paid | item `purchase_status = PAID` (separate from sample status) |
| Sample pending / collected / received | existing sample statuses |
| Processing | order `PROCESSING` |
| Result entered | report version `DRAFT` |
| Technician validated | `PENDING_APPROVAL` |
| Pathologist approved | `APPROVED` + signature |
| Partial report | `RELEASED` and `release_scope = PARTIAL` |
| Final report | `RELEASED` and `release_scope = FINAL` |
| Corrected | new version number, previous version retained |
| Cancelled | existing `CANCELLED` |

Every transition keeps using `lab_report_audit_log`. A changed released value also writes `lab_report_result_revisions`.

## 18. Migration

1. Additive Flyway only, after confirming columns are absent.
2. Backfill `release_scope = FINAL` for versions already `RELEASED`.
3. No rewrite of historical `lab_results`.
4. No import of Trust-Med PDFs or identifiers.
5. Shop template starts empty of that lab’s name, logo, and doctors. Staff fill branding in shop settings.

## 19. Compatibility risks

- Clinic “publish result” still reads legacy `lab_results`. Do not drop that write until the clinic screen is checked.
- Payment-before-release must remain. Partial release must not bypass unpaid lines.
- Pharmacy, wholesale, and medical product screens are unrelated. Do not change their tables.
- Hard-coded panel removal can surprise a lab that never filled the catalog. Entry must show “no catalog range” instead of a silent adult range.
- Gateway and order-service deploy together if new fields are added. UI can follow in the same release.

## 20. Testing

- Unit: range resolve by age and sex; flag blank vs L vs H vs critical; formula lines; partial blocked when a line is empty; final blocked when an ordered test is missing; revision row on a changed released value.
- API: search pagination; tenant A cannot read tenant B; unpaid line cannot release.
- UI: booking an existing patient creates a second order and leaves the first PDF unchanged.
- PDF: package, department, panel, method, partial banner, corrected banner. Compare structure to the field list in section 3, using demo patients only.
- Regression: one medical product list, one clinic referral into the lab, one LAB bill in the payment workspace.

---

## A. Recommended architecture

One PathLab module in `order-service` + the current Angular `/path-lab` routes. Customer is the person. `lab_orders` is the visit. Samples, catalog ranges, and LAB sales bills stay. The work is a clearer daily flow and a configurable report, not a second product.

## B. ER (logical)

```
Customer (permanent)
  └── LabOrder (visit, serial, doctor, billing party, status)
        ├── LabOrderItem → LabTestDefinition
        │                    ├── LabParameter
        │                    └── LabReferenceRange (age, sex, condition)
        ├── LabSample (barcode, specimen, container, events)
        ├── Sales Order (billType LAB)
        └── LabReportVersion
              ├── LabReportVersionItem (value, unit, resolved range, flag, method)
              ├── LabReportResultRevision (only after release)
              └── LabReportDocument (PDF)
```

Package and profile rows point at test definitions. They do not own a private copy of the parameter.

## C. API / modules

Keep `/sales-admin/lab-orders`, `lab-samples`, `lab-report-versions`, `lab-catalog`, `healthcare` lab bills, referrals, and commissions. Add search, partial/final scope, and result revisions. Shop branding stays on the shop record consumed by the PDF context.

## D. Screens

| Screen | Action |
|---|---|
| `/path-lab` | Dashboard cards + universal search |
| `/path-lab/booking` | Register visit, doctor, tests, bill |
| `/path-lab/payments` | Existing payment workspace |
| `/path-lab/worklist` | Collect and track |
| `/path-lab/accession` | Barcode receive |
| `/path-lab/reports` | Enter, validate, partial or final PDF |
| `/path-lab/test-master` | Departments, tests, packages, ranges |
| `/path-lab/report-templates` | Header, footer, signatory, columns |
| `/path-lab/referrals` and commissions | Unchanged purpose |
| `/users` and patient history | Previous visits |

## E. Report architecture

Configurable A4 engine on the current OpenPDF renderer. Group package → department → panel → test. Status stamp Partial, Final, or Corrected. No client name baked into the template.

## F. Migration plan

Additive columns, backfill release scope, keep old results, demo catalog only, deploy order-service and UI together when the PDF contract changes.

## G. Implementation phases

| Phase | Deliver | Destructive? |
|---|---|---|
| 1 | Report context and PDF: grouping, method, criteria, partial/final banner, shop header. Stop using hard-coded panel ranges on the print | No schema break |
| 2 | Result entry reads catalog templates only. Empty range is visible | No |
| 3 | `release_scope` and UI action Partial vs Final | Additive column |
| 4 | Result revision table and corrected report | Additive table |
| 5 | Visit serial, billing-party label, dashboard search | Additive |
| 6 | Permission templates actually assigned to staff | Config only |

Each phase is releasable on its own. Phases 3–5 need an order-service Flyway. Phases 1–2 can ship as UI + PDF only if the context factory already has the fields.

---

Approval needed before implementation. Phase 1 is the recommended start.
