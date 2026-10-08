# Procurement go-live checklist

Before production cutover: assign granular procurement permissions, run staging E2E on one branch/shop, deploy services with Flyway V14+, rebuild UI, verify gateway headers.

## Role → permission matrix

| Job (Staff UI preset) | Permissions | Can do | Cannot do |
|----------------------|-------------|--------|-----------|
| **Warehouse / storekeeper** | `PROCUREMENT_VIEW`, `PROCUREMENT_RECEIVE` | Lists, GRN receive, direct GRN, inspection complete, return ship | Approve PO, submit claims, AP, recon post |
| **Purchase manager** | `PROCUREMENT_VIEW`, `PROCUREMENT_APPROVE` | Approve PO, claims workflow, create/submit returns, recon counts | Receive GRN, ship returns, AP/finance |
| **Accountant / finance** | `PROCUREMENT_VIEW`, `PROCUREMENT_FINANCE` | AP invoices, 3-way match, recon post, accounting events | Receive, approve PO, ship returns |
| **Owner / legacy** | `MANAGE_STOCKS` | Full procurement (backward compatible) | — |

Assign via **Staff management → permissions** or job presets: *Warehouse*, *Purchase manager*, *Accountant* (retail/pharmacy shops).

## Production role setup

1. Rebuild **auth-service** (repo includes `PROCUREMENT_*` in `ALL_PERMISSIONS` — required for JWT sync).
2. For each shop, open **Staff management** and assign presets or tick:
   - Warehouse: `PROCUREMENT_VIEW` + `PROCUREMENT_RECEIVE`
   - Purchase manager: `PROCUREMENT_VIEW` + `PROCUREMENT_APPROVE`
   - Accountant: `PROCUREMENT_VIEW` + `PROCUREMENT_FINANCE`
3. Staff must **log out and back in** so JWT picks up new permissions.

### Staging seed (optional demo users)

```powershell
.\scripts\seed-procurement-staging-users.ps1 -ShopId GEN-DEMO-01 -TenantId 101
```

| UI username | Password (default) | Permissions |
|-------------|-------------------|---------------|
| `procwarehouse` | `ProcStaging1!` | VIEW + RECEIVE |
| `procpurchmgr` | `ProcStaging1!` | VIEW + APPROVE |
| `procaccountant` | `ProcStaging1!` | VIEW + FINANCE |

### Manual UI smoke (each role)

Log in once per role. Confirm **Inventory operations** tab appears (any `PROCUREMENT_*` or `MANAGE_STOCKS`).

| Screen | Warehouse | Purchase mgr | Accountant |
|--------|-----------|--------------|------------|
| Procurement dashboard / PO list | View | View | View |
| PO **Approve** | Hidden/disabled | Visible | Hidden |
| PO **Receive** | Visible | Hidden | Hidden |
| Claims **Submit** / resolution | Hidden | Visible | Hidden |
| Returns **Ship** | Visible | Hidden | Hidden |
| AP invoice **Match/Approve** | Hidden | Hidden | Visible |
| Reconciliation **Post** | Hidden | Hidden | Visible |

## Staging E2E (API + DB)

Full flow on **one branch** (`branchId=1`) and **one shop**:

`PO → submit → approve → send → receive → inspection → stock/buckets → auto-claim → resolution → return ship → recon post → AP match`

Also runs **role smoke tests** (403/200/404 on key endpoints via gateway JWT).

```powershell
# Seed roles first
.\scripts\seed-procurement-staging-users.ps1 -ShopId GEN-DEMO-01 -TenantId 101

# Owner must have MANAGE_STOCKS (or SHOP_OWNER)
.\scripts\e2e-procurement-staging.ps1 -ShopId GEN-DEMO-01 -TenantId 101 `
  -OwnerUsername demo -OwnerPassword 'YourOwnerPass'
```

Flags:

- `-SkipRoleSmoke` — full flow only
- `-SkipFullFlow` — role checks only

E2E asserts **API bucket totals = `inventory_bucket_balances` in stockdb** after inspection, return ship, etc.

## Deploy

One-shot (build, restart, Flyway check, UI build, seed, E2E):

```powershell
.\scripts\deploy-procurement-go-live.ps1 `
  -ShopId GEN-DEMO-01 -TenantId 101 `
  -OwnerUsername demo -OwnerPassword 'YourOwnerPass'
```

Manual steps equivalent:

1. **stock-service** — restart so Flyway applies **V14** (`procurement_idempotency`, direct GRN idempotency).
   ```powershell
   .\build-docker.ps1 -Services stock-service,auth-service,gateway-service
   docker compose up -d --force-recreate stock-service auth-service gateway-service
   ```
   Verify: `SELECT version FROM flyway_schema_history WHERE version = '14'` on **stockdb**.

2. **shop-management-ui** — production build and deploy static assets / container.

3. **Gateway headers**
   - `X-Auth-Permissions`: set from JWT `permissions` claim (`RequestIdGatewayFilter`).
   - `X-Idempotency-Key`: client header passes through; E2E replays PO receive with same key and expects same GRN id.

4. Re-run E2E after deploy.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Staff permission update fails in UI | Rebuild auth-service; permissions must be in auth `ALL_PERMISSIONS`. |
| Procurement menus missing | Grant any of `PROCUREMENT_*` or `MANAGE_STOCKS`; re-login. |
| 403 on receive/approve | Wrong role; check JWT permissions in login response / gateway headers. |
| Idempotency not working | Confirm stock-service V14 applied; UI sends stable `X-Idempotency-Key` on receive. |
| E2E product not found | Set `-ProductId` to a real product id for the shop. |

## Related

- **QA testing guide:** [PROCUREMENT-TESTING-GUIDE.md](./PROCUREMENT-TESTING-GUIDE.md) (manual cases, credentials, E2E scripts)
- Design: [UNIVERSAL-PROCUREMENT-DESIGN.md](./UNIVERSAL-PROCUREMENT-DESIGN.md)
- Permissions: `stock-service/.../ProcurementAccess.java`, `shop-management-ui/.../procurement-permissions.ts`
