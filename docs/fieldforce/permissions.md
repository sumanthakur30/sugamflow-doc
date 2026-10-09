# Field Force access

Field Force uses the roles that already exist. It does not add a second permission catalog.

| Role | Field Force |
|---|---|
| `SUPER_ADMIN` | Operations → Field Force for every shop. Can enable the add-on and set caps. |
| `SHOP_OWNER` | Settings → Field Force when the shop module `FIELD_FORCE` is on. Can change shop settings. Cannot turn the subscription on. |
| `FIELD_FORCE_PROMOTER` / `FIELD_FORCE_SALESMAN` | `/field-force/workspace` when the subscription is on and the shop has not turned Field Force off. |
| Other staff | No Field Force settings link |

The workspace and the promoter/salesman APIs also require the subscription. A role alone is not enough.

Login invites for promoter and salesman still need the existing promoter id or salesman id from fieldforce-service.
