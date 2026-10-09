# Field Force subscription

Field Force is an opt-in module, the same kind of add-on as Cashbook. It is not part of Starter, Standard, Basic, Professional, or Enterprise by default.

## How a shop gets it

Either of these turns the module on. No client name is hardcoded.

1. Platform Admin → Operations → Field Force → select the shop → **Enable Field Force**.  
   That writes `FIELD_FORCE` into that shop's `enabled_modules`.
2. Platform subscription feature `FEATURE_FIELD_FORCE` (or module code `FIELD_FORCE`) on the shop's platform plan. Shop-service maps both codes to the `FIELD_FORCE` module.

Disable removes the module from `enabled_modules`. People and leads stay.

## Caps

Stored on the shop as `shops.subscription_limits` JSON, and also read from the platform entitlement `limits` map and numeric keys in the plan `features_json`. The shop JSON wins when the same key is set in more than one place.

| Key | Meaning |
|---|---|
| `MAX_PROMOTERS` | How many promoter rows the tenant may have |
| `MAX_SALESMEN` | How many salesman rows the tenant may have |
| `MAX_FIELD_USERS` | Promoters plus salesmen |

A missing key, an empty admin box, or `-1` means unlimited. `0` means no new rows.

The count is every saved row, including inactive ones. After a downgrade, rows already saved stay. The next create is rejected when the count is already at the cap.

## Server check

fieldforce-service asks shop-service:

`GET /api/v1/internal/fieldforce/entitlement?tenantId=`

with `X-Internal-Api-Key`. If shop-service cannot answer, creates are rejected. Hiding a button is not the check.

Several shops can share one numeric tenant. Field Force data is stored by tenant. The tenant is entitled when any of its shops has the module. Caps are the most generous among those shops. If any entitled shop leaves a cap unlimited, that cap is unlimited for the tenant.
