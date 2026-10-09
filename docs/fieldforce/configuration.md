# Field Force shop settings

Subscription says whether the shop is allowed to use Field Force and what the caps are. Shop settings say how that shop wants to use it. Settings cannot raise a cap.

| Setting | Effect |
|---|---|
| Field Force enabled | When off, creates and edits are refused. Rows stay. |
| Promoters enabled | When off, new promoters are refused |
| Salesmen enabled | When off, new salesmen are refused |
| Default state code / default city | Stored for the tenant. Promoter and salesman forms still ask for state and city |

Settings live in `fieldforce_tenant_settings`, one row per numeric tenant. No row means enabled, with promoters and salesmen allowed, and no default area.

Platform Admin changes caps on the Field Force screen. Shop owners see the same screen from Settings → Field Force only when the module is already on. They cannot enable the add-on or change caps.
