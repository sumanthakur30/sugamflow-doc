# Field Force

Field Force is a paid add-on for any shop. It is not tied to one client. Platform Admin turns it on for the shops that bought it, and sets caps per shop.

## What it is for

A shop's own promoters and salesmen capture business leads before that prospect is a shop. The people, areas, and lead history stay in fieldforce-service. The subscription decision stays in shop-service.

## Who uses it

| Person | What they can do |
|---|---|
| Platform Admin | Enable or disable the add-on, set caps, open any shop |
| Shop owner | See Field Force in Settings when the add-on is on, and set how the shop uses it |
| Promoter / salesman | Open the field workspace when the add-on is on and the shop has not turned it off |

## What is included now

- Promoters and salesmen (code, name, mobile, email, state, city, joining date, status)
- Status values already stored: `ACTIVE` and `INACTIVE`
- Tenant settings: module on/off for the shop, promoters on/off, salesmen on/off, default state and city
- Subscription caps: `MAX_PROMOTERS`, `MAX_SALESMEN`, `MAX_FIELD_USERS`
- Usage on the Platform Admin Field Force screen
- Existing lead, visit, attendance, and commission APIs stay as they are

Turning the add-on off, or lowering a cap, does not delete promoters, salesmen, or leads.

## Planned, not added in this change

Visits, attendance, GPS, routes, tasks, orders, incentives, and commissions already have some fieldforce-service APIs. This change does not add new screens for them, and it does not add a `SUSPENDED` status.

## How the checks stack

```
Shop subscription (FIELD_FORCE module + caps)
        ↓
Tenant settings (on/off, default area)
        ↓
Existing login role (Platform Admin, shop owner, promoter, salesman)
        ↓
Screen and API
```
