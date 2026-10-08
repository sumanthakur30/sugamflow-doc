# Subscription Management

Industry-style subscription lifecycle for SugamFlow shop registry (platform admin).

## Model

| Layer | Field | Values |
|-------|--------|--------|
| **Shop status** | `shops.status` | `ACTIVE`, `PENDING`, `DEACTIVATED`, `SUSPENDED` |
| **Subscription status** | `shops.subscription_status` | `TRIAL`, `ACTIVE`, `GRACE`, `EXPIRED`, `CANCELLED`, `ARCHIVED` |
| **Access** | derived `accessLevel` on API | `FULL`, `READ_ONLY`, `BLOCKED` |

Grace period: **7 days** after `subscription_expiry`, then `EXPIRED`.

## Database (V10)

- `shops`: `subscription_status`, `grace_period_end`, `suspended_reason`, `trial_ends_at`, `subscription_started_at`
- `subscription_billing_records`: invoice, plan, amount, dates, payment mode, created_by
- `subscription_audit_logs`: action, actor, old/new values, notes

## API (`shop-service`, SUPER_ADMIN JWT)

Base: `/api/v1/shops/{shopId}/subscription`

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/renew` | Renew N days; sets subscription ACTIVE |
| POST | `/extend-trial` | Extend trial (+7/15/30 days) |
| POST | `/suspend` | Suspend shop (reason required) |
| POST | `/activate` | Reactivate suspended shop |
| POST | `/deactivate` | Deactivate shop |
| POST | `/change-plan` | Upgrade/downgrade plan |
| GET | `/billing-history` | Billing rows |
| GET | `/audit-log` | Audit rows |
| GET | `/access-status` | accessLevel + statuses |

## UI

- **Shop registry** (`shop-list`): separate Shop status and Subscription badges; **More** menu with renew, trial, plan, suspend, billing, audit.
- **Access control**: `SubscriptionWriteGuard` blocks orders/products/stock/purchase **add/edit** when `READ_ONLY` or `BLOCKED`.
- **Header**: grace/expired banner with renew reminder.

## Scheduler

| Job | Schedule | Purpose |
|-----|----------|---------|
| Lifecycle sweep | 02:15 daily | expiry → grace → expired |
| Email reminders | 08:00 daily | 30/15/7/1-day pre-expiry; grace + expired daily |

## Email notifications

Uses **notification-service** (`POST /api/v1/notifications`) — same channel as owner invites.

| Trigger | Recipient | Dedup key |
|---------|-----------|-----------|
| ≤30 days to expiry | Shop owner email | `{expiry}_PRE_30` |
| ≤15 days | Owner | `{expiry}_PRE_15` |
| ≤7 days | Owner | `{expiry}_PRE_7` |
| ≤1 day | Owner | `{expiry}_PRE_1` |
| Grace period starts | Owner (+ platform) | `{expiry}_GRACE_START` |
| Each day in grace | Owner | `{today}_GRACE` |
| Each day expired | Owner | `{today}_EXPIRED` |

Config (`shop-service`):

```properties
shop.subscription.reminders.enabled=true
shop.subscription.reminders.platform-notify-email=ops@yourcompany.com
```

Requires `shop.integration.notification-base-url` and shop owner `email` on the registry row.

API: `GET /api/v1/shops/{shopId}/subscription/reminders` — sent reminder log (super admin).

## Test cases (manual)

1. Expired shop → Renew 30 days → subscription `ACTIVE`, new expiry.
2. Expired shop → Extend trial → `TRIAL`, extended date, audit entry.
3. Active shop → Suspend → `BLOCKED`, no new sales.
4. Suspended → Activate → access restored.
5. Past expiry → grace (7 days) → then expired.

## Deploy

Rebuild **shop-service** after migration V10. No direct DB edits required for renew/suspend flows.
