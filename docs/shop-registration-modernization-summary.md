# Shop Registration Modernization Summary (Phase 1, 2, 2.1)

This document summarizes the redesign and implementation status of the `shop-management-ui` and `shop-service` registration modernization.

## Scope Covered

- Phase 1: Multi-step onboarding UX and config-driven frontend architecture.
- Phase 2: Backend schema, DTO, and persistence support for scalable onboarding fields.
- Phase 2.1: Validation hardening, duplicate detection API, and frontend duplicate-check gating.

## Frontend (`shop-management-ui`) Implementation

## Registration UX

- Replaced one long registration form with a 6-step wizard:
  1. Business Information
  2. Business Category & Type
  3. Billing Preferences
  4. Module Selection
  5. Subscription Plan
  6. Review & Confirm
- Added Save & Continue Later using local draft persistence.
- Added sticky wizard footer and progress indicator.

## Config-Driven Taxonomy and Module System

- Added centralized taxonomy and module constants:
  - `src/app/modules/shop-registration/constants/business-taxonomy.ts`
  - `src/app/modules/shop-registration/constants/module-catalog.ts`
- Added registration models:
  - `src/app/modules/shop-registration/models/registration.models.ts`
- Added wizard helper service:
  - `src/app/modules/shop-registration/services/shop-registration-wizard.service.ts`
- Dynamic behavior now driven by category/subtype selection:
  - subtype dropdown is category-dependent
  - billing type defaults by subtype
  - module suggestions auto-apply by subtype

## API Payload and Compatibility

- Extended request payload in:
  - `src/app/services/public-shop-registration.service.ts`
- New fields sent:
  - `businessCategory`
  - `businessSubtype`
  - `enabledModules` (string array)
  - `billingType`
  - `subscriptionPlan`
  - `isMultiBranch`
  - `panNumber`
  - `state`
  - `city`
  - `pincode`
- Legacy compatibility retained by deriving and sending `businessType`.

## Duplicate-Check UX (Phase 2.1)

- Added API method:
  - `checkDuplicate(...)` in `PublicShopRegistrationService`
- Added step-gating in:
  - `src/app/components/public-shop-registration/public-shop-registration.component.ts`
- Step 1 now blocks advance when duplicate is detected and shows reason-specific errors.

## Backend (`shop-service`) Implementation

## Public Registration API and DTO

- Extended request contract:
  - `src/main/java/com/shopmanagement/shopservice/dto/PublicShopRegistrationRequest.java`
- Added onboarding fields:
  - `businessCategory`, `businessSubtype`
  - `enabledModules` (`List<String>`)
  - `billingType`, `subscriptionPlan`
  - `isMultiBranch`
  - `panNumber`, `state`, `city`, `pincode`
- Controller mapping updated in:
  - `src/main/java/com/shopmanagement/shopservice/controller/PublicShopRegistrationController.java`
- `enabledModules` converted to JSON text for storage.

## Shop DTO, Entity, and Persistence

- Extended DTO:
  - `src/main/java/com/shopmanagement/shopservice/dto/ShopDto.java`
- Extended entity:
  - `src/main/java/com/shopmanagement/shopservice/model/Shop.java`
- Added DB migration:
  - `src/main/resources/db/migration/V9__add_onboarding_classification_and_modules.sql`
- Added columns:
  - `business_category`
  - `business_subtype`
  - `enabled_modules`
  - `billing_type`
  - `subscription_plan`
  - `is_multi_branch`
  - `pan_number`
  - `state_name`
  - `city_name`
  - `pincode`
- Mapping wired in `ShopService` create/update/read paths.

## Validation and Hardening (Phase 2.1)

Implemented in `ShopService`:

- PAN validation: `^[A-Z]{5}[0-9]{4}[A-Z]$`
- Pincode validation: `^[1-9][0-9]{5}$`
- `enabledModules`:
  - must be valid JSON
  - must be JSON array
  - payload size guard
- Phone normalization to digits for consistent storage/checking.
- GST compatibility: derives `gstStateCode` from GSTIN prefix when not explicitly provided.

## Duplicate Detection API (Phase 2.1)

- Added repository support in `ShopRepository`:
  - `existsByTenantIdAndShopNameIgnoreCase(...)`
  - `existsByTenantIdAndPhone(...)`
- Added service method:
  - `checkDuplicate(...)`
- Added endpoint:
  - `GET /api/v1/public/shop-registration/duplicate-check`
- Contract documented in:
  - `shop-service/docs/public-shop-registration-duplicate-check.md`

## Testing and Verification Status

## Frontend

- Build succeeds.
- New spec added:
  - `src/app/components/public-shop-registration/public-shop-registration.component.spec.ts`
- Validates:
  - Step blocked on duplicate
  - Step advances when duplicate check passes

## Backend

- `shop-service` compiles successfully after all changes.

## Rollout Order (Recommended)

1. Deploy `shop-service` with DB migration `V9` first.
2. Verify duplicate-check endpoint in lower environment.
3. Deploy `shop-management-ui` wizard updates.
4. Execute UAT for:
   - registration step flow
   - subtype-driven defaults
   - duplicate handling messages
   - submit success and pending activation status
5. Monitor registration failures and validation errors for 1-2 release cycles.

## UAT Checklist (Quick)

- Create unique shop with new fields and verify persistence.
- Attempt duplicate `shopId` and verify Step 1 block.
- Attempt duplicate `shopName` same tenant and verify block.
- Attempt duplicate `phone` same tenant and verify block.
- Register with GST enabled and GSTIN only, verify acceptance.
- Submit with invalid PAN and invalid pincode, verify clear error messages.
- Confirm legacy consumers still function with `businessType`.

## Next Recommended Work

- Add async debounce for duplicate-check in UI (if needed before Next click).
- Add backend integration tests for duplicate-check and validation branches.
- Add admin/reporting exposure for new onboarding fields where needed.
- Add analytics events for category/subtype/module selections to support future AI recommendations.
