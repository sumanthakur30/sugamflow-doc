# Field Force API

## Subscription (shop-service)

| Method | Path | Who |
|---|---|---|
| `POST` | `/api/v1/admin/shops/{shopId}/modules/FIELD_FORCE/enable` | Platform Admin |
| `POST` | `/api/v1/admin/shops/{shopId}/modules/FIELD_FORCE/disable` | Platform Admin |
| `PUT` | `/api/v1/admin/shops/{shopId}/modules/FIELD_FORCE/limits` | Platform Admin |
| `GET` | `/api/v1/internal/fieldforce/entitlement?tenantId=` | fieldforce-service, header `X-Internal-Api-Key` |
| `GET` | `/api/v1/shops/{shopId}/effective-config` | Shop UI. `modules` contains `FIELD_FORCE` when the add-on is on. `limits` holds the caps. |

Limits body:

```json
{ "maxPromoters": 10, "maxSalesmen": 25, "maxFieldUsers": null }
```

`null` clears that cap.

Enable and disable are written to `subscription_audit_log` as `ENABLE_MODULE` and `DISABLE_MODULE`. Cap changes are `LIMIT_CHANGED`.

## Workforce (fieldforce-service)

| Method | Path | Rule |
|---|---|---|
| `GET` | `/api/v1/fieldforce/access` | Subscription, caps, counts, and shop settings. Header `X-Tenant-Id` is the numeric tenant. |
| `PUT` | `/api/v1/fieldforce/settings` | Shop settings only. Does not change the subscription. |
| `POST` | `/api/v1/promoters` | Subscription on, shop settings allow promoters, under `MAX_PROMOTERS` and `MAX_FIELD_USERS` |
| `POST` | `/api/v1/salesmen` | Same for salesmen and `MAX_SALESMEN` |
| `PUT` / `PATCH` / `DELETE` on promoters and salesmen | Existing paths | Refused when the subscription or the shop switch is off. Rows are not deleted by that refusal. |

## Errors

| HTTP | When |
|---|---|
| 403 | Field Force is not on the shop plan, or the shop has turned it off |
| 409 | Cap reached, or an existing conflict (duplicate city, promoter still linked) |
| 503 | shop-service did not answer the entitlement call |

409 body example: `Salesman limit reached. PROFESSIONAL allows 10 salesmen. Upgrade the plan or contact your administrator.`
