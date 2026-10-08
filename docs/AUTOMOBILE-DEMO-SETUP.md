# Automobile demo tenants

Five live-demo shops for field sales and tablet POS (tenants **114–118**).

## Quick start

```powershell
# Local Docker Postgres
.\scripts\seed-automobile-demo.ps1
```

### Production / EC2 + RDS

```powershell
.\scripts\seed-automobile-demo-production.ps1 `
  -RdsHost YOUR_RDS_ENDPOINT.ap-south-1.rds.amazonaws.com `
  -PostgresPassword 'YOUR_RDS_MASTER_PASSWORD' `
  -GatewayUrl https://api.sugamflow.com `
  -InternalInviteKey 'YOUR_SECURITY_INVITE_INTERNAL_KEY'
```

Verify only (no writes):

```powershell
.\scripts\seed-automobile-demo-production.ps1 `
  -RdsHost YOUR_RDS_ENDPOINT -PostgresPassword '...' -VerifyOnly
```

Requires PostgreSQL reachable at `host.docker.internal:5432` (Docker) and gateway/auth for login step.

Skip auth if services are down:

```powershell
.\scripts\seed-automobile-demo.ps1 -SkipLogins -SkipStock
```

## Demo credentials (shop owner)

| Business type | Shop ID | Username | Password |
|---------------|---------|----------|----------|
| AUTO_PARTS | `AUTO-DEMO-01` | `demo` | `Demo@2026` |
| AUTO_WORKSHOP | `WORKSHOP-DEMO-01` | `demo` | `Demo@2026` |
| AUTO_DEALER | `DEALER-DEMO-01` | `demo` | `Demo@2026` |
| TYRE_BATTERY_SHOP | `TYRE-DEMO-01` | `demo` | `Demo@2026` |
| AUTO_PARTS_DISTRIBUTOR | `DIST-DEMO-01` | `demo` | `Demo@2026` |

API username: `demo_<ShopId>` (e.g. `demo_AUTO-DEMO-01`). The login screen can fill these from **Show demo login card**.

## What gets seeded

| Shop | Records (approx.) |
|------|-------------------|
| **AUTO-DEMO-01** | 104 spare parts + `auto_part_details`, 10 suppliers, 3 POs (DRAFT/APPROVED/FULLY_RECEIVED), 5 sales orders, stock, 50 customers, vehicles + fitment, 1 warranty + 1 core return |
| **WORKSHOP-DEMO-01** | 10 parts/services, 6 job cards (OPEN/CLOSED), 25 registrations, 50 owners, stock |
| **DEALER-DEMO-01** | 7 vehicle SKUs, 50 leads (customers), 2 high-value orders — *no dedicated CRM pipeline yet* |
| **TYRE-DEMO-01** | 8 tyres + 4 batteries (MRF/Apollo/CEAT/Bridgestone, Exide/Amaron), 3 orders, stock |
| **DIST-DEMO-01** | 60 bulk SKUs, 5 suppliers, 2 wholesale orders, high warehouse stock |

## SQL files (manual run)

| File | Database |
|------|----------|
| `shop-management-kit/sql/automobile/01-automobile-demo-shops.sql` | shopdb |
| `02-automobile-demo-products.sql` | productdb |
| `03-automobile-demo-customers.sql` | userdb |
| `04-automobile-demo-vehicles.sql` | productdb |
| `05-automobile-demo-stock-suppliers.sql` | stockdb |
| `06-automobile-demo-orders-workshop.sql` | orderdb |
| `06b-automobile-demo-workshop-stockdb.sql` | stockdb |

## Verification checklist

1. Login as each shop (owner mode).
2. **AUTO_PARTS**: `/auto-parts` dashboard KPIs, `/auto-parts/counter`, products list (OEM columns), stock, PO list, orders.
3. **WORKSHOP**: `/auto-parts/workshop` job cards, vehicle master.
4. **DEALER**: products = vehicle catalog; orders history (pipeline UI not built).
5. **TYRE**: counter billing, tyre/battery categories.
6. **DIST**: large stock, wholesale orders, suppliers.

## API smoke test

```powershell
.\scripts\test-automobile-api-smoke.ps1 -ShopIds AUTO-DEMO-01
```

If **products** returns HTTP 500 with `permission denied for table auto_part_details`, the demo schema was created as `postgres` but product-service uses `productdb`. Apply:

```powershell
Get-Content -Raw infra/postgres/patches/productdb-grant-automobile-tables.sql |
  docker run --rm -i postgres:16-alpine psql "postgresql://postgres:postgres@host.docker.internal:5432/productdb" -v ON_ERROR_STOP=1 -q
```

If **auto-parts**, **vehicles**, or **automobile** return HTTP 404 through the gateway but work on ports 8081/8082, restart **gateway-service** so routes `product-service-auto-parts` and `stock-service-automobile` load (see `gateway-service/src/main/resources/application.properties`).

## Known limits

- **AUTO_DEALER**: Leads/quotations/bookings/deliveries modules are not implemented; demo uses product + order data only.
- **Stock transfers**: No inter-warehouse transfer table yet — not seeded.
- **Job card statuses**: Backend uses `OPEN` / `CLOSED`; “In progress” / “Completed” are represented via notes on OPEN cards.

See also [FIELDFORCE-DEMO-LOGIN-CARD.md](./FIELDFORCE-DEMO-LOGIN-CARD.md).
