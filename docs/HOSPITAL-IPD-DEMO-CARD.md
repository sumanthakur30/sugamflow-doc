# Hospital IPD — Demo card (Waves A–D)

**Audience:** sales / presenter tablet walkthrough  
**Shop:** Polyclinic demo  
**Related:** `scripts/rds-ipd-accommodation/05-seed-wave-demo-pack.ps1` · `06-smoke-waves-a-d.ps1`

---

## Login

| Field | Value |
|-------|--------|
| Mode | **Shop Owner** |
| Shop ID | `POLY-DEMO-01` |
| Username | `demo` |
| Password | `Demo@2026` |
| Tenant | `105` |

UI: `http://localhost:4200`

---

## One-time prep (local)

```powershell
cd D:\sugamFlow
# Prefer a single IPD JVM with latest jar (close any old elevated :8100 window first)
.\scripts\restart-ipd-billing-local.ps1 -SkipOrder

# Seed ICU bed, live admission, OT, visitor pass, blood, CSSD, ABHA, FHIR
.\scripts\rds-ipd-accommodation\05-seed-wave-demo-pack.ps1

# Assert Waves A–D APIs
.\scripts\rds-ipd-accommodation\06-smoke-waves-a-d.ps1
```

If an old process owns `:8100` and cannot be killed, run IPD on `:8110` and pass `-IpdBase http://127.0.0.1:8110` to both scripts (UI gateway still needs the new build on the routed port).

---

## 8-minute click path

| # | Go to | Show |
|---|--------|------|
| 1 | `/ipd/dashboard` | ICU bed `DEMO-ICU-A` + general bed; admit/transfer if needed |
| 2 | `/ipd/nursing` | Select **Demo Wave Patient** — critical care banner, NEWS, allergies, MAR, radiology |
| 3 | Nursing → Charges | Interim bill / package |
| 4 | `/ipd/ops` → OT | Demo bronchoscopy on board; WHO checklist via Forms |
| 5 | Ops → Family | Pass code + QR; open `/family/{pass}` in private window |
| 6 | Ops → Heat map | Census + ALOS KPIs |
| 7 | Ops → Quality | Demo near-miss incident + NABH indicators |
| 8 | Ops → FHIR / ABHA | Preview Bundle; ABHA linked + consent granted |
| 9 | Ops → Blood | Unit `DEMO-PRBC-O1` + crossmatched request |
| 10 | Ops → CSSD | Set `DEMO-SET-1` available / issue to OT |

---

## Pocket credentials

```
POLY-DEMO-01  ·  demo  ·  Demo@2026
Seed:  .\scripts\rds-ipd-accommodation\05-seed-wave-demo-pack.ps1
Smoke: .\scripts\rds-ipd-accommodation\06-smoke-waves-a-d.ps1
```

---

## Feature toggles (no code)

In `ipd-service` / env:

- `ipd.fhir.enabled`
- `ipd.abha.enabled` / `ipd.abha.mode=sandbox`
- `ipd.blood.enabled`
- `ipd.cssd.enabled`

Sandbox ABHA OTP for demos: **`123456`**
