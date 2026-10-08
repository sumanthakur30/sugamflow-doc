# Path Lab - 5 Patient Complete Flow Demo

Generated: 2026-07-26 09:35:28
Shop: PATH-DEMO-01 | Tenant: 119 | Branch: 1
Artifacts: D:\sugamFlow\scripts\results\path-lab-5p-20260726-093503

## Lab staff login (use this in UI)

| Field | Value |
|-------|-------|
| Mode | Shop owner |
| Shop ID | PATH-DEMO-01 |
| Username | demo (or demo_PATH-DEMO-01) |
| Password | Demo@2026 |
| UI | http://localhost:4200 |
| Gateway | http://127.0.0.1:9090 |

## Patient identity credentials (realistic demo data)

Patient master records for booking / billing / report headers.
No separate patient-portal password - lookup by phone or UHID.

| # | Name | Age/Sex | UHID | Phone | DOB | Email |
|---|------|---------|------|-------|-----|-------|
| P1 | Ananya Krishnan | 28Y / F | PATH-UHID-2847 | 9101190001 | 1998-03-14 | ananya.krishnan.path@gmail.com |
| P2 | Rajesh Kumar Mehta | 51Y / M | PATH-UHID-5193 | 9101190002 | 1974-08-22 | rajesh.mehta52@yahoo.com |
| P3 | Fatima Begum | 40Y / F | PATH-UHID-4108 | 9101190003 | 1985-11-05 | fatima.begum.hyd@gmail.com |
| P4 | Arjun Singh Chauhan | 35Y / M | PATH-UHID-3521 | 9101190004 | 1991-01-30 | arjun.chauhan.lko@outlook.com |
| P5 | Priya Lakshmi Nair | 67Y / F | PATH-UHID-6702 | 9101190005 | 1959-06-18 | priya.nair.kochi@gmail.com |

### Addresses

- Ananya Krishnan: Flat 12B, Lakeview Residency, Indiranagar, Bengaluru 560038
- Rajesh Kumar Mehta: B-204, Shanti Niketan Society, Satellite Road, Ahmedabad 380015
- Fatima Begum: H.No. 8-2-293/82, Road No. 36, Jubilee Hills, Hyderabad 500033
- Arjun Singh Chauhan: 42, Hazratganj Civil Lines, Lucknow 226001
- Priya Lakshmi Nair: Villa 7, Panampilly Nagar, Ernakulam, Kochi 682036

## End-to-end flow (same for every patient)

1. Login as Path Lab demo staff (credentials above).
2. Patients - search phone/UHID - confirm demographics.
3. Booking - select patient - add tests - referring doctor - create order (ORDERED).
4. Worklist - Collect sample (barcode) - SAMPLE_COLLECTED (lab bill auto-created PENDING).
5. Accept / accession - SAMPLE_ACCEPTED.
6. Billing - open lab bill - Mark paid (CASH / UPI / CARD).
7. Reports - enter parameters - Mark ready - Sign - Release (blocked until paid).
8. Download PDF - optional Deliver to patient channel.
9. Extras by patient (below): ABHA, Micro, Histo, AI draft, FHIR, Rx OCR.

## Per-patient execution results

### P1 - Ananya Krishnan

| Step | Result |
|------|--------|
| Clinical | Pre-employment wellness package; fasting 10 hours |
| Doctor | Dr. Meera Iyer |
| Tests | PATH-005 |
| Customer ID | 407 |
| Order ID | 131 |
| Sample barcode | PATH-P1-20260726093504 |
| Bill | #435 / Rs.1999.0 / UPI / paid=True |
| Report version | 98 / RELEASED |
| PDF | P1-PATH-UHID-2847-report.pdf |
| Specialty extras | ai, fhir, rxocr |

UI path: Booking > Worklist (order 131) > Billing > Reports > release PDF.

### P2 - Rajesh Kumar Mehta

| Step | Result |
|------|--------|
| Clinical | Type-2 DM follow-up; on Metformin 500 mg BD; fasting sample |
| Doctor | Dr. Paresh Shah |
| Tests | PATH-003, PATH-002 |
| Customer ID | 406 |
| Order ID | 132 |
| Sample barcode | PATH-P2-20260726093504 |
| Bill | #436 / Rs.570.0 / CASH / paid=True |
| Report version | 99 / RELEASED |
| PDF | P2-PATH-UHID-5193-report.pdf |
| Specialty extras | - |

UI path: Booking > Worklist (order 132) > Billing > Reports > release PDF.

### P3 - Fatima Begum

| Step | Result |
|------|--------|
| Clinical | Fatigue, weight gain, cold intolerance - rule out hypothyroidism |
| Doctor | Dr. Sana Qureshi |
| Tests | PATH-004 |
| Customer ID | 409 |
| Order ID | 133 |
| Sample barcode | PATH-P3-20260726093504 |
| Bill | #437 / Rs.550.0 / CARD / paid=True |
| Report version | 100 / RELEASED |
| PDF | P3-PATH-UHID-4108-report.pdf |
| Specialty extras | abha |

UI path: Booking > Worklist (order 133) > Billing > Reports > release PDF.

### P4 - Arjun Singh Chauhan

| Step | Result |
|------|--------|
| Clinical | Fever with chills 4 days; suspected enteric/bacterial infection |
| Doctor | Dr. Vikram Tripathi |
| Tests | PATH-001 |
| Customer ID | 410 |
| Order ID | 134 |
| Sample barcode | PATH-P4-20260726093504 |
| Bill | #438 / Rs.350.0 / CASH / paid=True |
| Report version | 101 / RELEASED |
| PDF | P4-PATH-UHID-3521-report.pdf |
| Specialty extras | micro |

UI path: Booking > Worklist (order 134) > Billing > Reports > release PDF.

### P5 - Priya Lakshmi Nair

| Step | Result |
|------|--------|
| Clinical | Geriatric annual review; skin lesion biopsy referred for HPE |
| Doctor | Dr. Anil Menon |
| Tests | PATH-001, PATH-004 |
| Customer ID | 408 |
| Order ID | 135 |
| Sample barcode | PATH-P5-20260726093504 |
| Bill | #439 / Rs.900.0 / UPI / paid=True |
| Report version | 102 / RELEASED |
| PDF | P5-PATH-UHID-6702-report.pdf |
| Specialty extras | histo, ai |

UI path: Booking > Worklist (order 135) > Billing > Reports > release PDF.

## Feature coverage matrix

| Capability | Covered on |
|------------|------------|
| Patient master (name, phone, UHID, gender, DOB, address) | All 5 |
| Lab booking + multi-test order | All 5 |
| Sample collect + accession | All 5 |
| Lab billing + mark paid | All 5 (UPI/CASH/CARD mix) |
| Result entry + ready + sign + release + PDF | All 5 |
| Report deliver | All 5 |
| Rx OCR panel suggest | P1 Ananya |
| AI report draft | P1 Ananya, P5 Priya |
| FHIR R4 export | P1 Ananya |
| ABHA / NDHM link + consent | P3 Fatima |
| Microbiology culture + isolate + AST | P4 Arjun |
| Histopathology case workflow | P5 Priya |

## Re-run

```powershell
.\scripts\demo-path-lab-5-patients-e2e.ps1
```

JSON report: D:\sugamFlow\scripts\results\path-lab-5p-20260726-093503\flow-report.json
