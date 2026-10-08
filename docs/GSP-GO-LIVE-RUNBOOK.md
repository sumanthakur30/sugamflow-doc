# GSP go-live runbook (e-invoice / e-way)

Medical distributors typically will not go live without **real** IRN and e-way (not mock). SugamFlow keeps **mock as default**; switch gst-service to the HTTP GSP adapter when credentials and NIC registration are ready.

## Architecture

| Layer | Role |
|-------|------|
| UI (`/compliance/einvoice`, wholesale Generate IRN) | Calls gst-service; mirrors ack / e-way onto sales invoice |
| **gst-service** | Source of truth for IRN, signed QR, e-way, Part-B |
| GSP adapter (`GST_GSP_BASE_URL`) | Your ClearTax / IRIS / MastersIndia / custom NIC bridge |
| order-service | Stores ack no/date + e-way bill no on `sales_invoice` for print/logistics |

Default providers: `gst.einvoice.provider=mock`, `gst.eway.provider=mock`.

## Local rehearsal (no real GSP)

Use the zero-dependency fake adapter before vendor onboarding:

```bash
cd tools/fake-gsp-adapter
node server.mjs
```

Then point gst-service at it:

```bash
GST_EINVOICE_PROVIDER=http
GST_EWAY_PROVIDER=http
GST_GSP_BASE_URL=http://127.0.0.1:19091
# optional if adapter started with GSP_API_KEY=local-dev-key:
# GST_GSP_API_KEY=local-dev-key
```

Details: [`tools/fake-gsp-adapter/README.md`](../tools/fake-gsp-adapter/README.md).  
Dockerized gst-service talking to host adapter: `GST_GSP_BASE_URL=http://host.docker.internal:19091`.

## Production env (EC2 / `docker-compose.ec2-rds.yml`)

Set on the host (or secrets manager) before restarting `gst-service`:

```bash
GST_EINVOICE_PROVIDER=http
GST_EWAY_PROVIDER=http
GST_GSP_BASE_URL=https://your-gsp-adapter.example.com
GST_GSP_API_KEY=***          # if adapter requires X-Api-Key
GST_GSP_REQUIRE_API_KEY=true # optional fail-fast if key missing
```

Optional path overrides (defaults match a simple REST adapter):

| Variable | Default |
|----------|---------|
| `GST_GSP_EINVOICE_PATH` | `/einvoice/generate` |
| `GST_GSP_EWAY_PATH` | `/eway/generate` |
| `GST_GSP_EINVOICE_CANCEL_PATH` | `/einvoice/cancel` |
| `GST_GSP_EWAY_CANCEL_PATH` | `/eway/cancel` |
| `GST_GSP_EWAY_PART_B_PATH` | `/eway/part-b` |

Then:

```bash
docker compose -f docker-compose.ec2-rds.yml up -d gst-service
docker compose -f docker-compose.ec2-rds.yml logs -f gst-service
```

Expect log line: `GSP LIVE ready: baseUrl=...`. If `provider=http` but `GST_GSP_BASE_URL` is blank, **gst-service refuses to start**.

## Adapter contract (JSON)

### POST `{base}/einvoice/generate`

Request body (built by gst-service from tax snapshot) includes seller/buyer GSTIN, document number/date, line HSN, taxable/tax totals.

Response (minimum):

```json
{
  "irn": "...",
  "ackNo": "...",
  "ackDate": "2026-07-21T10:15:30",
  "signedQrPayload": "..."
}
```

`signedQrPayload` is preferred for invoice QR printing; IRN alone is a fallback.

### POST `{base}/eway/generate`

Response minimum: `{ "ewbNo": "...", "validUpto": "..." }` (field names may also be `ewb_no`).

### Cancel / Part-B

Cancel endpoints accept IRN or e-way number + reason. Part-B accepts vehicle / from place / transport doc fields. See `HttpGspEinvoiceProvider` / `HttpGspEwayBillProvider`.

Header: `X-Api-Key: <GST_GSP_API_KEY>` when the key is set.

## UI checklist

1. Open **E-Invoice / E-Way** (`COMPLIANCE_IN` pack).
2. Badge must show **Live GSP ready** (not “incomplete”).
3. Select a posted wholesale invoice with tax snapshot → **Generate IRN (live GSP)** → confirm IRN + ack.
4. Generate e-way with vehicle / distance → confirm e-way no on invoice print logistics row.
5. Print A4 invoice → QR must encode **signed QR payload** when GSP returned it.
6. Part-B / cancel / bulk retry as needed for dispatch ops.

## Rollback to mock

```bash
GST_EINVOICE_PROVIDER=mock
GST_EWAY_PROVIDER=mock
# leave GST_GSP_BASE_URL unset or ignore
docker compose -f docker-compose.ec2-rds.yml up -d gst-service
```

## Pre-go-live checklist (distributor)

- [ ] Seller GSTIN registered for e-invoice on NIC / GSP portal  
- [ ] GSP credentials in secrets (not in git)  
- [ ] Sandbox IRN smoke test on one WHOLE-DEMO / UAT invoice  
- [ ] Production `GST_*` flipped + gst-service healthy  
- [ ] One live IRN + one live e-way + print with QR verified with CA / ops  

## Notes

- Mock mode stays safe for demos; do not flip production to `http` without a working adapter URL.
- gst-service surfaces GSP HTTP errors as **502** with the adapter message in `message` for the UI.
- Invoice cancel is blocked when `einvoice_ack_number` is present — use sales return after IRN.
