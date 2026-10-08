# Field Force â€” Demo login card (all business types)

Give this to **salesmen/promoters** for live POS demos at shop visits.  
**Field force login** = tracking (leads). **Demo shop login** = show product on tablet.

Related: [FIELDFORCE-FIELD-VISIT-WALKTHROUGH.md](./FIELDFORCE-FIELD-VISIT-WALKTHROUGH.md) Â· [FIELDFORCE-SUPERADMIN-ONBOARDING.md](./FIELDFORCE-SUPERADMIN-ONBOARDING.md)

---

## One-page workflow (salesman)

```
PHONE                          TABLET (optional)
â”€â”€â”€â”€â”€                          â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Login: Employee                Login: Shop owner
  Shop ID = GEN-DEMO-01          Shop ID = pick by business type
  (field-force anchor)           (see table below)
        â”‚                              â”‚
        â–¼                              â–¼
Save lead at prospect          Show billing / stock / clinic UI
Log DEMO activity              (demo data only)
Conversion if owner buys
```

**Do not** use demo login for tracking. **Do not** use field-force login for POS demo.

---

## Demo shops (after SQL seed)

Run once on PostgreSQL (super admin):

| # | Script | Database |
|---|--------|----------|
| 1 | `shop-management-kit/sql/postgresql/01-business-type-shop-registration-and-labels.sql` | `shopdb` |
| 2 | `shop-management-kit/sql/postgresql/03-business-type-demo-products.sql` | `productdb` |
| 3 | `shop-management-kit/sql/postgresql/04-business-type-demo-users.sql` | `userdb` |

Verify:

```sql
SELECT shop_id, tenant_id, business_type, status
FROM shops
WHERE shop_id LIKE '%-DEMO-01'
ORDER BY tenant_id;
```

---

## Demo presenter logins (tablet)

**Login mode:** **Shop owner** (not Employee)

**Default credentials** (after running bulk script below):

| Password (all) | `Demo@2026` |
|----------------|-------------|
| Username (all) | `demo` |

| Prospect / demo type | Shop ID | Tenant | What to show |
|----------------------|---------|--------|--------------|
| General / kirana | `GEN-DEMO-01` | 101 | Products, orders, dues |
| Retail store | `RET-DEMO-01` | 102 | Retail billing, stock |
| Medical shop | `MED-DEMO-01` | 103 | Medical billing, patients |
| Pharmacy | `PHARM-DEMO-01` | 104 | Pharmacy retail + dispense |
| Polyclinic / clinic | `POLY-DEMO-01` | 105 | Reception, doctor, **IPD Waves Aâ€“D** (beds, nursing, OT, family QR, FHIR/ABHA, blood, CSSD)* |
| Pathology lab | `PATH-DEMO-01` | 119 | Lab booking, worklist, reports, QC / FHIR |
| Beauty / salon | `BEAUTY-DEMO-01` | 106 | Services, clients |
| Jewelry | `JEWEL-DEMO-01` | 107 | Catalog, billing |
| Grocery / supermarket | `GROCERY-DEMO-01` | 108 | Fast billing, stock |
| Fashion / apparel | `FASHION-DEMO-01` | 109 | Catalog, orders |
| Electronics | `ELEC-DEMO-01` | 110 | Products, stock |
| Restaurant / cafe | `REST-DEMO-01` | 111 | Menu, orders |
| Wholesale | `WHOLE-DEMO-01` | 112 | Bulk / buyer flow |
| Other / custom | `OTHER-DEMO-01` | 113 | Generic demo |

### Automobile demos (after `seed-automobile-demo.ps1`)

| Business type | Shop ID | Tenant | What to show |
|---------------|---------|--------|--------------|
| Spare parts | `AUTO-DEMO-01` | 114 | Counter POS, 100+ parts, POs, OEM search |
| Workshop | `WORKSHOP-DEMO-01` | 115 | Job cards, vehicle owners, service bay |
| Dealer | `DEALER-DEMO-01` | 116 | Vehicle catalog + orders (CRM pipeline TBD) |
| Tyre & battery | `TYRE-DEMO-01` | 117 | Tyre/battery brands, retail billing |
| Parts distributor | `DIST-DEMO-01` | 118 | Bulk stock, wholesale orders, dealers |

Details: [AUTOMOBILE-DEMO-SETUP.md](./AUTOMOBILE-DEMO-SETUP.md)

\*Polyclinic needs extra clinical seed data for full OPD flow.

**Effective username** sent to API: `demo_<ShopId>` (e.g. `demo_MED-DEMO-01`). You can type `demo` in the username field â€” the app adds the suffix.

---

## Field force login (phone â€” tracking)

| Mode | Shop ID | Username | Notes |
|------|---------|----------|-------|
| **Employee** | Anchor from invite (e.g. `GEN-DEMO-01`) | e.g. `raju` | Same every day |
| Role | `FIELD_FORCE_SALESMAN` | | Lands on `/field-force/workspace` |

---

## Bulk create demo logins (super admin)

From repo root (gateway + auth-service running):

```powershell
cd D:\sugamflow

# All *-DEMO-01 shops, username demo, password Demo@2026
.\scripts\setup-demo-presenter-logins.ps1

# Only medical + pharmacy + grocery
.\scripts\setup-demo-presenter-logins.ps1 -ShopIds MED-DEMO-01,PHARM-DEMO-01,GROCERY-DEMO-01

# MEDICAL/PHARMACY demos need FEFO batch stock for POS create-order:
.\scripts\seed-medical-demo-batch-stock.ps1 -ShopId MED-DEMO-01
.\scripts\seed-medical-demo-batch-stock.ps1 -ShopId PHARM-DEMO-01

# Custom password
.\scripts\setup-demo-presenter-logins.ps1 -Password 'Demo@2026'
```

Manual alternative: **`/admin/create-login-invite`** â†’ Role **Shop owner** for each shop row above.

---

## Printable card (cut along line)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ SUGAMFLOW â€” FIELD DEMO (tablet)     Password: Demo@2026     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Login: Shop owner Â· URL: /login                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Kirana / general â”‚ GEN-DEMO-01    â”‚ demo                    â”‚
â”‚ Medical          â”‚ MED-DEMO-01    â”‚ demo                    â”‚
â”‚ Pharmacy         â”‚ PHARM-DEMO-01  â”‚ demo                    â”‚
â”‚ Polyclinic       â”‚ POLY-DEMO-01   â”‚ demo                    â”‚
â”‚ Grocery          â”‚ GROCERY-DEMO-01â”‚ demo                    â”‚
â”‚ Restaurant       â”‚ REST-DEMO-01   â”‚ demo                    â”‚
â”‚ Auto parts       â”‚ AUTO-DEMO-01   â”‚ demo                    â”‚
â”‚ Workshop         â”‚ WORKSHOP-DEMO-01â”‚ demo                   â”‚
â”‚ Dealer           â”‚ DEALER-DEMO-01 â”‚ demo                    â”‚
â”‚ Tyre & battery   â”‚ TYRE-DEMO-01   â”‚ demo                    â”‚
â”‚ Distributor      â”‚ DIST-DEMO-01   â”‚ demo                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ TRACKING (phone): Employee Â· GEN-DEMO-01 Â· raju Â· ****     â”‚
â”‚ 1 Save lead  2 Demo on tablet  3 Log DEMO  4 Convert       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Shop not found on login | Run SQL seed `01-business-type-shop-registration-and-labels.sql` |
| Empty products | Run `03-business-type-demo-products.sql` |
| Invalid credentials | Re-run `setup-demo-presenter-logins.ps1` for that shop |
| Polyclinic missing doctor UI | Seed polyclinic kit separately; use MED/PHARM demo meanwhile |

---

_Last updated: May 2026_
