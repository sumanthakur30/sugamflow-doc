# Cross-Tenant Isolation Test Suite (Phase 2.7)

Automated tests verify shop-scoped APIs **do not leak data across tenants** when callers send mismatched `X-Tenant-Id` / `X-Shop-Id` headers or explicit `tenantId` query/path parameters.

## Principle

- **Data scoped by repository queries** (`findByIdAndTenantIdAndShopId`, etc.) must return **404 / empty**, never another tenant's rows.
- **Explicit tenant parameters** (`?tenantId=`, `/by-tenant/{id}`) must return **403 Forbidden** when they do not match request headers.
- **Shop registry reads** (shop-service effective-config) must return **403** when the shop belongs to another tenant.

## Test classes

| Service | Test class | Scenarios |
|---------|------------|-----------|
| shop-service | `EffectiveConfigCrossTenantMvcTest` | Cross-tenant effective-config read → 403 |
| product-service | `CrossTenantIsolationMvcTest` | Product by id, by-tenant param, catalog categories |
| stock-service | `CrossTenantIsolationMvcTest` | Stock by id, inventory admin tenant param |
| order-service | `CrossTenantIsolationMvcTest` | Order by id, by-tenant path, prescription status, sales-admin invoices |

Supporting unit tests (Phase 0 / 1):

- `EffectiveConfigServiceTest.resolve_deniesCrossTenantShop`
- `ShopRegistryAuthorizationTest.requireRegistryWrite_blocksCrossTenantOwner`

## Run

```powershell
cd shop-service;    mvn test "-Dtest=EffectiveConfigCrossTenantMvcTest,EffectiveConfigServiceTest,ShopRegistryAuthorizationTest"
cd product-service; mvn test "-Dtest=CrossTenantIsolationMvcTest"
cd stock-service;   mvn test "-Dtest=CrossTenantIsolationMvcTest"
cd order-service;   mvn test "-Dtest=CrossTenantIsolationMvcTest"
```

Or from repo root (after `platform-common` is installed):

```powershell
foreach ($svc in @('shop-service','product-service','stock-service','order-service')) {
  Push-Location $svc
  mvn -q test "-Dtest=*CrossTenant*,CrossTenantIsolationMvcTest"
  Pop-Location
}
```

## Regression matrix

After changes to `RequestIdFilter`, repository scoping, or admin APIs that accept `tenantId`, re-run this suite and the manual probe in `shop-management-ui/tools/e2e-shop-flow.ps1` (`-IsolationTenantId` / `-IsolationShopId`).
