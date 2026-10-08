# CRM Sprint 3 — Customer 360 ERP + quote→order

**Branches:** `feature/crm-sprint3-customer360-erp` on `crm-service` and `crm-ui`  
**Date:** 2026-08-09

## Delivered

### 3a — Federated ERP strip
- `accountSummary.erp` via `ErpFederationService`: orders / invoices (quote projection) / payments.
- Live order-service list/get when `crm.order.enabled=true` + resolved `shopCustomerId`.
- Resolves customer from `account.attributes.shopCustomerId`, linked lead `SHOP_CUSTOMER` ref, or default.
- ERP convert stamps `shopCustomerId` onto the linked account.
- crm-ui Account drawer **ERP** tab.

### 3b — Quote→order polish
- Status exposes `orderEnabled` + `orderProductMapped`.
- Accept rejects SUPERSEDED; re-accept is idempotent (retries order if missing).
- Optional `productId` on quote lines (UI field + order mapping).
- Clear SKIPPED_* / order hints on Quotes tab.

## Try

```powershell
# Enable live path (pilot)
$env:CRM_ORDER_ENABLED="true"
$env:CRM_ORDER_DEFAULT_PRODUCT_ID="1"
# + convert lead to SHOP_CUSTOMER or set CRM_ORDER_DEFAULT_CUSTOMER_ID
```

1. Convert lead → Shop customer (with account linked) → Account ERP tab.
2. Create quote with Product id → Accept → order → see order on ERP strip.
