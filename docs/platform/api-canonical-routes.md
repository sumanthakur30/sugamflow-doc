# SugamFlow Canonical API Routes

Legacy routes remain active for backward compatibility. New clients should use canonical paths only.

## Authentication

| Canonical | Legacy | Service |
|-----------|--------|---------|
| `POST /api/v1/auth/login` | — | auth-service |
| `POST /api/v1/auth/register` | — | auth-service |

## Shops & Configuration

| Canonical | Legacy | Service | Notes |
|-----------|--------|---------|-------|
| `GET/POST /api/v1/shops` | `/api/shops` | shop-service | Registry CRUD |
| `GET /api/v1/shops/{shopId}/effective-config` | — | shop-service | **Phase 1** — plan + modules + capabilities |
| `GET/POST /api/v1/shops/{shopId}/subscription/*` | — | shop-service | Subscription lifecycle |
| `GET /api/v1/admin/shops` | — | shop-service | Super-admin list |
| `POST /api/v1/admin/shops/{shopId}/features/{code}/enable` | — | shop-service | **Phase 1** |
| `POST /api/v1/public/shop-registration` | — | shop-service | Public signup |

## Customers

| Canonical | Legacy | Service |
|-----------|--------|---------|
| `GET/POST /api/v1/customers` | `/api/users/customers` | user-service |

## Products

| Canonical | Legacy | Service |
|-----------|--------|---------|
| `GET/POST /api/v1/products` | `/api/products` | product-service |
| `GET /api/v1/products?page=&size=&search=` | unpaged `GET /products` | product-service — **prefer paged** |

Query params: `catalogContext=PHARMACY|PATHOLOGY|RECEPTION`, `tenantWide=true` (polyclinic only).

## Orders & Healthcare

| Canonical | Legacy | Service |
|-----------|--------|---------|
| `GET/POST /api/v1/orders` | — | order-service |
| `GET /api/v1/orders/reports/executive-dashboard` | `/reports/owner-dashboard` | order-service |

## Stock & Procurement

| Canonical | Legacy | Service |
|-----------|--------|---------|
| `GET/POST /api/v1/purchases/procurement/*` | `/api/v1/stock/purchases/*` | stock-service |
| `GET /api/v1/stock/*` | — | stock-service |

## Accounts & Staff

| Canonical | Legacy | Service |
|-----------|--------|---------|
| `GET/POST /api/v1/accounts` | — | account-service |

## Reports

| Canonical | Legacy | Service |
|-----------|--------|---------|
| `GET /api/v1/reports/*` | `/api/reports/*` | reporting-service |

## Required Headers (Authenticated Domain APIs)

| Header | Purpose |
|--------|---------|
| `Authorization: Bearer <JWT>` | Identity |
| `X-Tenant-Id` | Tenant scope |
| `X-Shop-Id` | Active shop scope |
| `X-Request-Id` | Tracing (optional; auto-generated if absent) |

Super-admin may override tenant/shop via headers at gateway.

## Deprecation Policy

1. Legacy routes documented here remain for **12 months** after canonical replacement.
2. OpenAPI `@Deprecated` annotations added in Phase 2.
3. No route removal without a major version bump and migration guide.
