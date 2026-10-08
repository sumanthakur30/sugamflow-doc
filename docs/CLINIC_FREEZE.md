# Clinical freeze zone (Marg-parity program)

## Rule

Trade / Marg-parity work (schemes, wholesale, finance, STRICT schedule) must be **additive** and
**pack-gated**. Do not change clinical defaults for `POLYCLINIC` / `CLINIC`.

## Defaults (must hold)

| Shop type | Packs | `pharmacyComplianceMode` |
|-----------|-------|--------------------------|
| POLYCLINIC / CLINIC | CLINIC + RETAIL_RX | **OFF** |
| PHARMACY / MEDICAL | RETAIL_RX | STRICT |
| WHOLESALE | WHOLESALE + RETAIL_RX + FINANCE_LITE + COMPLIANCE_IN | STRICT |

## Freeze surfaces

- Doctor dashboard / consultation pad / Rx save
- Reception / appointments / queue
- `PolyclinicRoutingService`
- Pharmacy dispense queue
- Path-lab worklist / results
- Patient history / clinical timeline
- Polyclinic owner command-center KPI formulas

## Allowed shared changes

- Nullable columns on `Shop` / inventory
- New routes behind `wholesaleOnly` / `retailRxOnly`
- New services (`TradeScheme`, future wholesale-service)
- GST line fields already present (`freeQuantity`, `schemeDiscount`) — wire only when RETAIL_RX UI applies

## Merge gate

PRs touching stock/order/gst/shop/platform-common run `.github/workflows/polyclinic-freeze-gate.yml`.
