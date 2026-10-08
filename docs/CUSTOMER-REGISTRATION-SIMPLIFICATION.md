# Customer / Patient / Client Registration Simplification

**Status:** Implemented (June 2026)  
**Scope:** All SugamFlow business types — retail, pharmacy, clinic, automobile, pathology, service

---

## Objective

Reduce customer onboarding friction to **Name + Mobile only**, matching industry POS/CRM/EMR practice (Marg, Vyapar, Tally POS, Practo, etc.).

**Target:** Complete registration in **under 10 seconds** from billing, POS, appointments, and walk-in flows.

---

## Before vs after

| Area | Before | After |
|------|--------|-------|
| **Full user form** (`/users/add`, `/users/edit`) | Name, Phone, **State**, **City** required | **Name + Mobile only** required |
| **Quick inline create** (POS, pharmacy, path lab) | Name + Phone (already minimal) | Name (min 2, letters/spaces/dots) + 10-digit mobile; email/address collapsed |
| **Reception walk-in** | Name + Phone + Doctor + Visit type | Same workflow; stricter name/mobile rules aligned |
| **Edit customer** | State/City blocked save when empty | State, City, Address, Email all optional |
| **Duplicate mobile** | Backend 409 only on quick-create | Pre-save check + **View existing / Continue anyway / Cancel** |
| **Backend validation** | Implicit (DB NOT NULL only) | Explicit name (≥2 chars) + 10-digit mobile on create/update |
| **Validation on load** | Required fields could show errors after touch | Errors only after field interaction or save attempt |

---

## Mandatory fields policy (enforced)

| Field | Frontend | Backend | DB |
|-------|----------|---------|-----|
| **Full name** | Required, min 2 chars, `[A-Za-z.\s]+` | Required, min 2 chars, same pattern | `NOT NULL` |
| **Mobile** | Required, exactly 10 digits | Required, 10 digits after normalize | `NOT NULL` |
| **Role** | Fixed `CUSTOMER` | Auto-default `CUSTOMER` | `NOT NULL` |
| **Status** | Auto `ACTIVE` | Auto `ACTIVE` | `NOT NULL` |

Everything else is **optional** and nullable.

---

## Optional fields (never block save)

Email, Address, State, City, Pin code, DOB, Gender, GSTIN, UHID, Notes, Loyalty, Credit limit, Vehicle/Insurance attrs, Registration date, and all business-specific extensions.

> **Note:** `state` and `city` exist only in the Angular full form; they are composed into nullable `address` on save. No DB columns for state/city.

---

## Registration modes

### Quick registration (billing flows)

**Screens:** Orders/POS (`/orders/add`), Auto counter, Pharmacy dispense, Path lab booking, inline `CustomerEntitySelector`.

**UI shows:**
- Name *
- Mobile *
- [Save] / [Save and add another]
- Optional expander: email, address

**Files:**
- `shop-management-ui/src/app/shared/customer-entity-selector/`
- `shop-management-ui/src/app/shared/customer-validators.ts`

### Extended profile (master data)

**Screens:** `/users/add`, `/users/edit/:id`

**Sections:**
- Basic: Name *, Mobile *, Email (optional)
- Address information (optional): address line, state, city
- Registration date (optional)

**Files:**
- `shop-management-ui/src/app/components/user-form/`

### Reception walk-in (clinic)

**Screen:** `/reception/dashboard`

**Required for visit:** Name, Mobile, Doctor, Visit type (operational — not customer master fields).

**Files:**
- `shop-management-ui/src/app/components/reception-dashboard/`

---

## Duplicate customer handling

| Step | Behavior |
|------|----------|
| Before create | Search by 10-digit mobile |
| Match found | Dialog: **View existing** · **Continue anyway** · **Cancel** |
| Continue anyway | `POST /api/v1/customers?allowDuplicatePhone=true` |
| Backend default | `409 Conflict` with `CustomerDuplicateException` |

**Configurable:** `allowDuplicatePhone` query param (tenant-wide setting can wrap this later).

---

## Backend changes

| File | Change |
|------|--------|
| `user-service/.../UserService.java` | `validateCustomerName`, `validateCustomerPhone`; `createUser(..., allowDuplicatePhone)` |
| `user-service/.../CustomerController.java` | `allowDuplicatePhone` request param on `POST /customers` |
| `users` table | **No migration** — `email`, `address`, `gender`, `date_of_birth` already nullable (V7, V8) |

**API contract (unchanged paths):**

```
POST /api/v1/customers?tenantWide=false&allowDuplicatePhone=false
PUT  /api/v1/customers/{id}
```

---

## Impacted screens

| Screen | Route | Mode |
|--------|-------|------|
| Customer master add/edit | `/users/add`, `/users/edit/:id` | Extended |
| Customer list | `/users` | — |
| POS billing | `/orders/add` | Quick |
| Auto counter | `/auto-parts/counter` | Quick |
| Pharmacy dispense | `/pharmacy/add` | Quick |
| Path lab booking | `/path-lab/booking` | Quick |
| Reception | `/reception/dashboard` | Walk-in + duplicate dialog |

---

## Test checklist

### Create

- [x] Name + Mobile → success
- [x] Name + Mobile + empty optional fields → success
- [ ] Name only → fail (frontend + backend)
- [ ] Mobile only → fail
- [x] Duplicate mobile → warning dialog
- [x] Continue anyway → success (`allowDuplicatePhone=true`)

### Edit

- [x] Update name only → success
- [x] Update mobile only → success
- [x] Empty state/city/address → success (no validation error)

### Cross-module

- [ ] POS quick-create without address
- [ ] Pharmacy dispense quick-create
- [ ] Reception walk-in with duplicate flow

### Responsive

- [ ] Mobile: single column, large Save button
- [ ] Tablet: two-column name/mobile
- [ ] Desktop: compact quick panel

---

## Deploy notes

After pulling changes:

```powershell
# Rebuild user-service (backend validation + allowDuplicatePhone)
docker compose build user-service
docker compose up -d user-service

# UI — ng serve or rebuild shop-management-ui
cd shop-management-ui
npm start
```

---

## Success criteria

✅ Customer/patient/client registration completable in **<10 seconds** with **Name + Mobile only**  
✅ Extended profile enrichment available later without blocking billing  
✅ Frontend and backend validation synchronized  
✅ No breaking API or DB migration required
