# AI Product Capture — architecture fit

**Status:** Implementation on `feature/ai-product-capture`  
**Date:** 2026-08-11  
**Repos:** `product-service` (jobs + extract + confirm), `shop-management-ui` (wizard)

## Where it fits

AI Product Capture is an **intake assistant** in front of the existing Product Master. It does **not** own catalog, stock, GST, or POS.

| Concern | Existing owner | Capture role |
|---------|----------------|--------------|
| Product row | `product-service` `POST /products` (`ProductService.addProduct`) | Confirm calls this after human review |
| SKU uniqueness | `(tenant_id, shop_id, code)` | Duplicate search before create |
| Barcode lookup | `GET /products/lookup/barcode` | Same API / same repository |
| Name/SKU search | `GET /products/page?search=` | Candidate list |
| Opening stock | `POST /stock/init` (qty 0 on create) then `POST /stock/add` | Optional qty after confirm |
| HSN / GST masters | `gst-service` | Store denormalized `hsnSac` / `gstPercent` only |
| Category / brand / unit FKs | Catalog tables exist; live form uses string `category` | Same contract as Add Product |
| Images | No shop-product image column | Capture file stored as **job evidence** only (`./data/product-capture`) |
| Auth | `@RequiresModule(PRODUCTS)` + `MANAGE_PRODUCTS` | Same |
| Shop AI flag | `shops.ai_features` JSON | New key `productCapture` |
| Pattern | PO OCR job → review → commit draft | Same human-in-the-loop; **never** auto-save |

## What we do not create

- No new microservice / gateway prefix
- No second product table or SKU scheme
- No S3 (local FS, tenant/shop path, same as import + PO OCR)
- No inventory posting except existing `/stock/add`
- No entitlement matrices in this feature

## Flow

```
Upload / camera / barcode hint
        → job UPLOADED
        → extract (ZXing + optional LLM vision + label-text heuristics)
        → search existing (barcode → SKU → name)
        → human review (AI vs user sources shown)
        → confirm → ProductService.addProduct
        → optional opening qty → stock-service /stock/add
        → product immediately available to POS / Purchase / Stock / Sales
```

AI values are stored on the job with `source` + `confidence`. Confirm accepts **user-submitted** fields only.

## APIs (`product-service`, gateway `/api/v1/products/capture/**`)

| Method | Path | Role |
|--------|------|------|
| GET | `/products/capture/enabled` | Kill-switch |
| POST | `/products/capture/jobs` | Multipart image + optional `barcodeHint` / `ocrText` |
| GET | `/products/capture/jobs/{id}` | Job + draft + matches |
| POST | `/products/capture/jobs/{id}/extract` | Re-run extract |
| POST | `/products/capture/jobs/{id}/confirm` | Human-reviewed fields → `addProduct` + optional `/stock/add` |

## UI

- `/products/capture` — AI Product Capture wizard
- `/products/scanner` — barcode lookup; if missing, continue into capture
- Shop AI flag `productCapture` (Super Admin shop form). Non-production UI also allows the wizard when the server flag is on.
