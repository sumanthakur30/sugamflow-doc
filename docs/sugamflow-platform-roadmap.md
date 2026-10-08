# SugamFlow Platform Roadmap — Complete Implementation Guide

Single master document for transforming SugamFlow into a configurable multi-business SaaS platform.
All phases are **backward compatible** — no breaking changes to existing APIs, schemas, or modules.

**Status legend:** `[ ]` pending · `[~]` in progress · `[x]` done

---

## Principles (Non-Negotiable)

1. **Configuration first** — config → feature flag → business rule → custom code
2. **Tenant isolation** — no cross-tenant or cross-business data leakage
3. **Additive only** — new tables/APIs; legacy routes kept during migration
4. **Union entitlements** — existing `enabled_modules` on shops are never silently removed

---

## Phase 0 — Foundation (Weeks 1–4)

**Goal:** Safe baseline before configuration engine. Zero user-visible breaking changes.

| # | Task | Status | Deliverable |
|---|------|--------|-------------|
| 0.1 | Cross-tenant integration tests | [x] | `shop-service` effective-config tenant isolation tests |
| 0.2 | Audit unpaged `getProducts()` calls | [x] | [frontend-product-query-audit.md](./platform/frontend-product-query-audit.md) |
| 0.3 | Extract shared catalog filter library | [x] | `catalog-common` Maven module |
| 0.4 | Document canonical API routes | [x] | [api-canonical-routes.md](./platform/api-canonical-routes.md) |
| 0.5 | Build script for shared modules | [x] | `scripts/build-shared-modules.ps1` |

### 0.1 Cross-Tenant Tests

Automated tests verify shop-scoped APIs reject wrong-tenant access:

- `EffectiveConfigServiceTest` — tenant A cannot read shop belonging to tenant B
- `EffectiveConfigCrossTenantMvcTest`, `CrossTenantIsolationMvcTest` in product/stock/order services
- See [cross-tenant-test-suite.md](./platform/cross-tenant-test-suite.md)

### 0.2 Product Query Audit

Replace unpaged full-catalog loads with `getProductsPage()` / typeahead pickers.
See audit file for call sites and migration notes.

### 0.3 Catalog Common Module

```
catalog-common/
  CatalogProductView.java
  ProductCatalogCategory.java
  ProductCatalogContext.java
  ProductCatalogFilterSupport.java
```

Used by `product-service` and `order-service` via thin delegators (same package names preserved).

### 0.4 Canonical API Routes

Document at `docs/platform/api-canonical-routes.md`. Legacy aliases remain active.

---

## Phase 1 — Configuration Engine (Weeks 5–10)

**Goal:** Unified effective-config API; plan entitlements; admin feature management.

| # | Task | Status | Deliverable |
|---|------|--------|-------------|
| 1.1 | Platform capabilities registry (Java) | [x] | `platform-common` module |
| 1.2 | Plan definitions table + seed data | [x] | Flyway `V12__plan_definitions.sql` |
| 1.3 | Tenant feature overrides table | [x] | Flyway `V12__tenant_feature_overrides.sql` |
| 1.4 | Effective-config resolver service | [x] | `EffectiveConfigService` |
| 1.5 | Effective-config API | [x] | `GET /api/v1/shops/{shopId}/effective-config` |
| 1.6 | Admin feature APIs | [x] | `POST /api/v1/admin/shops/{shopId}/features/{code}/...` |
| 1.7 | Angular effective-config client | [x] | `EffectiveConfigService` + nav fallback |
| 1.8 | Contract tests | [x] | Controller + service tests |

### Effective Config Resolution

```
modules  = plan.modules ∪ shop.enabled_modules
features = plan.features ∪ shop.ai_features ∪ overrides
capabilities = BusinessTypeCapabilities.for(businessType)
accessLevel  = subscription lifecycle (FULL | READ_ONLY | BLOCKED)
```

### Plan Codes (Seeded)

| Plan | Modules |
|------|---------|
| STARTER | PRODUCTS, INVENTORY, CUSTOMERS, BILLING |
| STANDARD / BASIC (legacy) | + PURCHASE, SUPPLIERS, GST_REPORTS, BARCODE |
| PROFESSIONAL | + BATCH, EXPIRY, CRM, ADVANCED_REPORTS |
| ENTERPRISE | + MULTI_OUTLET, API_ACCESS, AUDIT_LOGS, CUSTOM_BRANDING, WORKFLOW_ENGINE |

Healthcare add-on modules (PRESCRIPTION, DOCTORS, PATIENT_RECORDS, FOLLOW_UP) enabled via `enabled_modules` or admin override until Phase 3 marketplace.

### Build Order

```powershell
.\scripts\build-shared-modules.ps1
cd shop-service; mvn test -Dtest=EffectiveConfig*
```

---

## Phase 2 — Pharmacy Excellence (Weeks 11–16)

| # | Task | Status |
|---|------|--------|
| 2.1 | Expiry alert dashboard widget (30/60/90 day) | [x] |
| 2.2 | Generic-first product search (PHARMACY context) | [x] |
| 2.3 | Rack location via dynamic attributes (EAV prep) | [x] |
| 2.4 | Dedicated pharmacy counter route | [x] |
| 2.5 | Prominent letterhead mode in Rx UI | [x] |
| 2.6 | Fast-moving medicines report widget | [x] |
| 2.7 | Cross-service tenant isolation test suite | [x] |

---

## Phase 3 — Dynamic Product Attributes (Weeks 17–22)

| # | Task | Status |
|---|------|--------|
| 3.1 | `product_attribute_definitions` + `product_attribute_values` tables | [x] |
| 3.2 | Dynamic attribute form section in product UI | [x] |
| 3.3 | Optical attribute pack (lens_power, cylinder, axis) | [x] |
| 3.4 | Book store pack (isbn, author, publisher) | [x] |
| 3.5 | Hide undeveloped business types from registration | [x] |

---

## Phase 4 — Dynamic Document Framework (Weeks 23–28)

| # | Task | Status |
|---|------|--------|
| 4.1 | Generalize `prescription_print_template` → `document_templates` | [x] |
| 4.2 | Invoice / PO / lab report templates | [x] |
| 4.3 | Skip header/footer for all document types | [x] |
| 4.4 | Template admin UI | [x] |

---

## Phase 5 — Dashboard & Performance (Weeks 29–34)

| # | Task | Status |
|---|------|--------|
| 5.1 | Widget-based dashboard shell | [x] |
| 5.2 | Lazy widget APIs (`/dashboard/widgets/{code}/data`) | [x] |
| 5.3 | CDK virtual scroll on product/order lists | [x] |
| 5.4 | OnPush on top 5 list components | [x] |
| 5.5 | Split `doctor-dashboard` into sub-routes | [x] |
| 5.6 | Redis cache for executive dashboard aggregates | [x] |
| 5.7 | Replace all unpaged `getProducts()` call sites | [x] |

---

## Phase 6 — Workflow Engine (Weeks 35–42)

| # | Task | Status |
|---|------|--------|
| 6.1 | `workflow_definitions` table | [x] |
| 6.2 | Pharmacy dispense workflow (DRAFT → VERIFIED → BILLED → DISPENSED) | [x] |
| 6.3 | Lab sample → report workflow | [x] |
| 6.4 | Enterprise plan gate for workflow engine | [x] |

---

## Phase 7 — Marketplace & Integrations (Weeks 43+)

| # | Task | Status |
|---|------|--------|
| 7.1 | WhatsApp / SMS add-on services | [x] |
| 7.2 | API access keys (Enterprise) | [x] |
| 7.3 | Feature marketplace admin UI | [x] |
| 7.4 | `@RequiresModule` backend annotations (opt-in per endpoint) | [x] |

---

## Regression Matrix (Run After Every Phase)

| Module | Pharmacy | Clinic | Path Lab | Retail | Auto | Cross-Tenant |
|--------|----------|--------|----------|--------|------|--------------|
| Products | ✓ | ✓ | ✓ | ✓ | ✓ | block |
| Orders/Billing | ✓ | ✓ | ✓ | ✓ | ✓ | block |
| Inventory | ✓ | — | ✓ | ✓ | ✓ | block |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | block |
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | block |
| Permissions | ✓ | ✓ | ✓ | ✓ | ✓ | block |
| Mobile 320px | ✓ | ✓ | ✓ | ✓ | ✓ | — |

Demo shops: `scripts/setup-demo-presenter-logins.ps1`, polyclinic network in `infra/postgres/production/polyclinic/`.

---

## Key Files (Phase 0 + 1)

| Concern | Path |
|---------|------|
| Master roadmap | `docs/sugamflow-platform-roadmap.md` |
| API routes | `docs/platform/api-canonical-routes.md` |
| Product query audit | `docs/platform/frontend-product-query-audit.md` |
| Catalog shared lib | `catalog-common/` |
| Platform shared lib | `platform-common/` |
| Plan migration | `shop-service/.../V12__plan_definitions_and_feature_overrides.sql` |
| Effective config API | `shop-service/.../EffectiveConfigController.java` |
| Feature admin API | `shop-service/.../FeatureAdminController.java` |
| UI capabilities (existing) | `shop-management-ui/.../business-type-capabilities.ts` |
| UI effective config | `shop-management-ui/.../effective-config.service.ts` |
| Build shared modules | `scripts/build-shared-modules.ps1` |

---

## Next Action After Phase 1

**Phase 3 — Dynamic Product Attributes** is complete. **Phase 4 — Dynamic Document Framework** is complete. **Phase 5 — Dashboard & Performance** is complete. **Phase 6 — Workflow Engine** is complete. **Phase 7 — Marketplace & Integrations** is complete.
