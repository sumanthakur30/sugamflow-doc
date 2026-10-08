# SugamFlow — Supported Business Types

**Platform:** SugamFlow ERP  
**Document version:** 1.0  
**Last updated:** June 2026  

---

## Overview

SugamFlow is a **multi-tenant, multi-outlet** retail and healthcare platform. Each shop (outlet) has a `businessType` that controls navigation, labels, modules, and API scoping. All types below are registered in `shop-management-ui/src/app/constants/business-types.ts`.

---

## Complete business type registry

| Code | Display name | Category | Maturity |
|------|--------------|----------|----------|
| `GENERIC` | Generic | Retail / fallback | Production |
| `RETAIL` | General retail | Retail | Production |
| `MEDICAL` | Medical shop | Healthcare retail | Production |
| `PHARMACY` | Pharmacy | Healthcare retail | Production |
| `POLYCLINIC` | Polyclinic / clinic | Healthcare OPD | Production |
| `CLINIC` | Clinic (alias) | Healthcare OPD | Production |
| `PATH_LAB` | Pathology lab | Diagnostics | Production |
| `PATHOLOGY_LAB` | Pathology lab (alias) | Diagnostics | Production |
| `DIAGNOSTIC_LAB` | Diagnostic lab (alias) | Diagnostics | Production |
| `BEAUTY_PARLOR` | Beauty parlor / salon | Services | Production |
| `JEWELRY` | Jewelry | Retail | Production |
| `GROCERY` | Grocery / supermarket | Retail | Production |
| `FASHION` | Fashion / apparel | Retail | Production |
| `ELECTRONICS` | Electronics | Retail | Production |
| `RESTAURANT` | Restaurant / F&B | Hospitality | Production |
| `WHOLESALE` | Wholesale / B2B | B2B | Production |
| `AUTO_PARTS` | Automobile spare parts shop | Automobile | Production |
| `AUTO_WORKSHOP` | Automobile workshop | Automobile | Production |
| `AUTO_SERVICE_CENTER` | Automobile service center | Automobile | Production |
| `AUTO_DEALER` | Automobile dealer | Automobile | Production |
| `AUTO_PARTS_DISTRIBUTOR` | Automobile parts distributor | Automobile | Production |
| `TYRE_BATTERY_SHOP` | Tyre & battery shop | Automobile | Production |
| `AUTO_MULTIBRAND` | Multi-brand automobile store | Automobile | Production |
| `OTHER` | Other | Custom | Production |

---

## Healthcare suite (deep integration)

These types share **tenant-wide patient master**, clinical APIs, and cross-outlet routing within one tenant.

### Polyclinic / clinic (`POLYCLINIC`, `CLINIC`)

- **Modules:** Reception queue, doctor dashboard, consultation pad, e-prescription, investigations, owner command center.
- **Routing:** Prescriptions → pharmacy outlet; lab orders → path lab outlet (same tenant).
- **Labels:** Patient (not Customer).
- **Example outlets:** `TRUST-POLY-01`, `TRUST-MEDI-01`.

### Pharmacy (`PHARMACY`, `MEDICAL`)

- **Modules:** Medicine catalog, stock, prescription dispense queue, billing, GST, procurement.
- **Integration:** Bills polyclinic prescriptions; tenant-wide product catalog when linked to a clinic network.
- **Labels:** Patient on healthcare bills; medicine-specific product fields.
- **Example outlets:** `TRUST-PHAR-01`, `TRUST-MEDI-PHARMACY-01`.

### Pathology lab (`PATH_LAB`, `PATHOLOGY_LAB`, `DIAGNOSTIC_LAB`)

- **Modules:** Sample worklist, test booking, report entry, PDF release, lab billing.
- **Integration:** Receives clinic referrals (`consultationId`, `sourceType=POLYCLINIC`); tenant-wide lab order APIs.
- **Labels:** Patient.
- **Example outlets:** `TRUST-LAB-01`, `TRUST-MEDI-PATH-01`.

### Trust healthcare network pattern

One tenant can run **three sibling outlets**:

```
POLYCLINIC  →  consultations, Rx, lab referrals
PATH_LAB    →  sample processing, reports
PHARMACY    →  dispense & bill medicines
```

---

## Automobile vertical

All types in the `AUTOMOBILE_BUSINESS_TYPES` set share vehicle master, OEM catalog, counter billing, and spare-parts workflows.

| Type | Workshop / job cards |
|------|-------------------|
| `AUTO_PARTS` | No |
| `AUTO_PARTS_DISTRIBUTOR` | No |
| `TYRE_BATTERY_SHOP` | No |
| `AUTO_MULTIBRAND` | No |
| `AUTO_WORKSHOP` | Yes |
| `AUTO_SERVICE_CENTER` | Yes |
| `AUTO_DEALER` | Yes |

**Modules:** Vehicle registration, parts catalog, counter sales, workshop job cards (where applicable), procurement profile `AUTO_PARTS`.

---

## General retail & services

These types use the **default retail capability profile**: product catalog, inventory, POS billing, purchase orders, GST, owner dashboard, staff management.

| Type | Notable UI customisation |
|------|-------------------------|
| `GROCERY` | Grocery dashboard, expiry-aware inventory |
| `ELECTRONICS` | Electronics AI insights on owner dashboard |
| `FASHION` | Standard retail |
| `JEWELRY` | Standard retail |
| `BEAUTY_PARLOR` | Client label (not Customer) |
| `RESTAURANT` | Guest label; F&B oriented flows |
| `WHOLESALE` | Buyer label; B2B pricing |
| `GENERIC` / `RETAIL` / `OTHER` | Full retail toolkit |

---

## Capability matrix (summary)

| Capability | Polyclinic | Path lab | Pharmacy | Medical | Auto | Retail |
|------------|:----------:|:--------:|:--------:|:-------:|:----:|:------:|
| OPD / queue / doctor | ✓ | — | — | — | — | — |
| Path lab worklist | — | ✓ | — | — | — | — |
| Pharmacy dispense | ✓ | — | ✓ | ✓ | — | — |
| Tenant-wide patients | ✓ | ✓ | ✓ | ✓ | — | — |
| Tenant-wide clinical records | ✓ | ✓ | ✓ | ✓ | — | — |
| Retail product catalog | — | — | ✓ | ✓ | ✓ | ✓ |
| Automobile module | — | — | — | — | ✓ | — |
| Workshop job cards | — | — | — | — | ✓* | — |

\* Workshop types only: `AUTO_WORKSHOP`, `AUTO_SERVICE_CENTER`, `AUTO_DEALER`.

---

## Cross-cutting platform features (all types)

- Multi-branch / multi-outlet per tenant
- Role-based access (Shop Owner, Staff, Doctor, Lab Owner, etc.)
- JWT authentication via API gateway
- GST engine (India)
- Purchase orders & supplier management
- Inventory, batches, expiry
- Offline POS sync (MVP)
- Field force / salesman module (optional tenant)
- Subscription & shop onboarding
- Executive / owner dashboards

---

## Adding a new business type

1. Add entry to `BUSINESS_TYPE_OPTIONS` in `business-types.ts`.
2. Register capabilities in `business-type-capabilities.ts` (or inherit retail / auto / healthcare profile).
3. Extend header navigation labels and route guards as needed.
4. No separate application fork — one Angular shell, lazy-loaded feature modules.

---

*Source of truth: `shop-management-ui/src/app/constants/business-types.ts` and `business-type-capabilities.ts`.*
