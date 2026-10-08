# Secrets Inventory Template

> Copy this checklist when rotating secrets. **Never commit filled-in values.**  
> Generated inventories are written to `.local/secrets-inventory-YYYY-MM-DD.md` by `.\scripts\phase0-prep.ps1`.

## Application secrets (rotate before production)

| Variable | Used by | Rotation required |
|----------|---------|-------------------|
| `SECURITY_JWT_SECRET` | auth-service, gateway-service | **Yes** — default `0123456789...` in compose |
| `SECURITY_INVITE_INTERNAL_KEY` | auth-service, account-service, shop-service | **Yes** — default `dev-invite-key-change-in-production` |
| `SHOP_ADMIN_API_KEY` | shop-service admin onboarding | **Yes** — default `dev-shop-admin-key` |

## Database credentials (per-service)

| Variable | Database |
|----------|----------|
| `AUTH_DB_PASSWORD` | authdb |
| `USER_DB_PASSWORD` | userdb |
| `SHOP_DB_PASSWORD` | shopdb |
| `PRODUCT_DB_PASSWORD` | productdb |
| `ORDER_DB_PASSWORD` | orderdb |
| `STOCK_DB_PASSWORD` | stockdb |
| `PAYMENT_DB_PASSWORD` | paymentdb |
| `NOTIFICATION_DB_PASSWORD` | notificationdb |
| `REPORTING_DB_PASSWORD` | reportingdb |
| `ACCOUNT_DB_PASSWORD` | accountdb |
| `DOCTOR_DB_PASSWORD` | doctordb |
| `APPOINTMENT_DB_PASSWORD` | appointmentdb |
| `QUEUE_DB_PASSWORD` | queuedb |
| `FIELDFORCE_DB_PASSWORD` | fieldforcedb |
| `GST_DB_PASSWORD` | gstdb |

## Demo / E2E credentials (not production secrets)

| Context | Username | Password | Notes |
|---------|----------|----------|-------|
| GEN-DEMO-01 owner | `demo_GEN-DEMO-01` | `Demo@2026` | **Not** `Demo@123` (docs typo) |
| AUTO-DEMO-01 owner | `demo_AUTO-DEMO-01` | `Demo@2026` | |
| TRUST-MEDI-01 owner | `trustmedicentre_TRUST-MEDI-01` | (local) | `reset-local-auth-password.ps1` |
| Procurement staging | `procwarehouse_*`, etc. | `ProcStaging1!` | `seed-procurement-staging-users.ps1` |

## Rotation checklist

- [ ] Generate new `SECURITY_JWT_SECRET` (≥32 chars)
- [ ] Update `.env.production` / AWS Secrets Manager
- [ ] Update `SECURITY_INVITE_INTERNAL_KEY` and `SHOP_ADMIN_API_KEY`
- [ ] Remove default fallbacks from `application.properties` and `docker-compose*.yml`
- [ ] Redeploy all services (JWT secret must match gateway + auth)
- [ ] Force user re-login (old tokens invalid)
- [ ] Re-run `.\scripts\phase0-prep.ps1` and compare baseline logs
