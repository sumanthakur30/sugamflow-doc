# Platform Identity — Phase 3 (Super Admin ops)

**Branch:** `feature/identity-3.1-tenant-audit` (merge to `august01`)  
**Rules:** `.cursor/rules/platform-identity-subscription.mdc`  
**Predecessor:** [PLATFORM-IDENTITY-PHASE1.md](./PLATFORM-IDENTITY-PHASE1.md), [PLATFORM-SUBSCRIPTION-PHASE2.md](./PLATFORM-SUBSCRIPTION-PHASE2.md)

---

## Goal

Super Admin can operate **cross-tenant identity** without logging into each shop as owner:

```
Super Admin → pick Shop/Org → list users → invite / reset / audit logins → (later unlock / impersonate)
```

Do **not** break existing shop Staff (`/staff`) or school owner login.

---

## Phase map

| Step | Deliverable |
|------|-------------|
| **3.0** | Tenant users list by `shopId` + reuse platform invite/password-reset |
| **3.0b** | Dual-read auth accounts so AUTH_ONLY shops (e.g. POLY-DEMO-01) appear |
| **3.1** | Login-event audit read for a shop |
| **3.2** | Account unlock / lockout model (auth-service) — brute-force lock + Super Admin unlock |
| **3.3** | Impersonation JWT + mandatory audit |
| **3.4** | Identity usage dashboard (logins, invites, resets) |

---

## 3.0 / 3.0b — Tenant users (dual-read)

### API

`GET /admin/accounts?shopId=&search=` → Super Admin only  

Merges:

1. account-service `users` → `source=LOCAL`
2. auth-service `GET /api/v1/auth/accounts` (internal key) → `source=AUTH_ONLY` when username missing locally

Auth unreachable → local list only (fail-open).

Gateway: `/api/v1/admin/accounts` → account-service.

### UI

`/admin/tenant-users` — Source badge `LOCAL` / `AUTH_ONLY`; invite + password reset still work by username.

---

## 3.1 — Login audit

### API

`GET /admin/login-events?shopId=&username=&limit=` → Super Admin  
Proxies auth-service `GET /api/v1/auth/login-events` (internal key) over existing `auth_login_events` writes.

Gateway: `/api/v1/admin/login-events` on account-service admin route.

### UI

Same Tenant users page — **Recent logins** table.

---

## 3.2 — Lockout / unlock

### Auth

- Columns on `auth_account`: `failed_login_attempts`, `locked_until`, `lock_reason` (Flyway V13)
- Config: `auth.lockout.max-failed-attempts=5`, `auth.lockout.duration=PT15M`
- Bad password increments; at threshold → `AUTH_LOCKED` (403)
- Success / invite accept / password-reset confirm / admin unlock clear lock
- Internal: `POST /api/v1/auth/accounts/unlock`

### Super Admin

- `POST /admin/accounts/unlock` `{ shopId, username }`
- Tenant users UI: LOCKED badge + Unlock action

---

## Test plan

- [ ] Super Admin lists users for `POLY-DEMO-01` (AUTH_ONLY owner visible)
- [ ] `GEN-DEMO-01` still shows LOCAL staff
- [ ] Password reset works for AUTH_ONLY username
- [ ] Login events appear after a shop login
- [ ] 5 bad passwords → `AUTH_LOCKED`; admin unlock → login works again
- [ ] Shop owner `/staff` unchanged
- [ ] Non–Super Admin gets 403 on `/admin/accounts` and `/admin/login-events`
