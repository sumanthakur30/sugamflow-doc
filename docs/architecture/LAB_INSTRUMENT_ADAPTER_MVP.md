# Lab instrument adapter (Phase B+)

Dedicated microservice: **`lab-instrument-adapter`** (port **8290**).

## Architecture

```
Analyzer / middleware
    → drop folder (*.txt / *.astm / *.oru / *.hl7)
        → lab-instrument-adapter (poll)
            → POST order-service /internal/lab-instruments/import
               headers: X-Internal-Api-Key, X-Tenant-Id, X-Shop-Id
            ← MSA/ACK payload
        → write *.ack  (bi-dir MVP acknowledgment)
```

Public gateway **blocks** `/api/v1/internal/**` and `/internal/**` via `BlockInternalPathGatewayFilter`.
Adapter must call **order-service directly** (Docker network / localhost), never via the public gateway.

## Run locally

```bash
# order-service must be up with SECURITY_INTERNAL_API_KEY set
cd lab-instrument-adapter
mvn spring-boot:run
```

Env:

| Variable | Purpose |
|----------|---------|
| `LAB_ORDER_SERVICE_URL` | e.g. `http://localhost:8085` |
| `SECURITY_INTERNAL_API_KEY` | Same key as order-service |
| `LAB_ADAPTER_TENANT_ID` / `LAB_ADAPTER_SHOP_ID` | Target lab outlet |
| `LAB_ADAPTER_INSTRUMENT_CODE` | Must match `lab_instruments.code` |
| `LAB_ADAPTER_DROP_FOLDER` | Inbox path |

Legacy PowerShell watcher still available: `scripts/lab-instrument-drop-watch.ps1` (uses staff JWT + `/sales-admin/.../import`).

## ACK format (MVP)

```
MSA|AA|<externalMessageId>|OK
ACK|<timestamp>|AA|<externalMessageId>
```

`AE` on failure. Full ASTM E1394 / HL7 ACK handshake is a later iteration.
