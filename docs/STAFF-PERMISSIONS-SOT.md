# Staff permissions — source of truth

## Enforcement (APIs)
- **auth-service** `auth_account.permissions_json` → JWT `permissions` claim
- **gateway** strips client `X-Auth-Permissions` and sets it from JWT
- Downstream services trust gateway headers only

## Admin UX
- **account-service** `users.permissions_json` is the staff admin mirror
- `PUT /accounts/{id}/permissions` saves account then **write-through** to auth `POST /api/v1/auth/accounts/permissions`
- UI `PermissionGuard` / staff screens load **account** `GET …/me/permissions` (fresher after edits than JWT)

## Dual-store drift (additive tooling)
- Shared CSV helpers: `com.shopmanagement.security.PermissionCsv` (+ `PermissionCatalog`)
- Auth internal read: `GET /api/v1/auth/accounts/permissions?shopId=&username=` (`X-Internal-Invite-Key`)
- Account compare: `GET /accounts/{id}/permissions/diagnostic`
- Repair push account → auth: `POST /accounts/{id}/permissions/sync-auth`
- After any auth update, **staff must re-login** for JWT to refresh (UI already prompts on self-edit)

## Shared catalog
- Java: `com.shopmanagement.security.PermissionCatalog` (security-common)
- UI mirror: `shop-management-ui/src/app/auth/staff-permissions.ts` — keep in sync with `PermissionCatalog.ALL`

## Not used for staff
- **user-service** `users.permissions_json` is forced null for customers; not a staff SoT

## TRADE_ACCOUNTANT defaults
Include `MANAGE_FINANCE` and `MANAGE_GST` (plus procurement view/finance, orders, customers). Existing rows with explicit CSV are unchanged until edited; null/blank CSV picks new defaults on login/parse.

## Intentional dual store (not merging in this cut)
- Keep auth as API SoT and account as admin UX SoT
- Do not rewrite JWT claims, gateway header injection, or PermissionGuard contracts
