-- DBeaver: connect to orderdb, edit only the values in
-- cleanup_parameters, then execute the whole script.
-- Run only after 02-restore-stock.sql succeeds.
--
-- This intentionally does not modify ledgerdb or gstdb.

BEGIN;

CREATE TEMP TABLE cleanup_parameters ON COMMIT DROP AS
SELECT
    21::BIGINT AS tenant_id,
    'CTC-WHS-01'::VARCHAR(100) AS shop_id,
    'REPLACE-WITH-INVOICE-NUMBER'::VARCHAR(80) AS invoice_number,
    'Suman Kumar Thakur'::VARCHAR(100) AS operator,
    'DELETE-TEST-INVOICE'::TEXT AS confirmation;

CREATE TEMP TABLE cleanup_invoice AS
SELECT
    i.tenant_id,
    i.shop_id,
    i.id AS invoice_id,
    i.invoice_number,
    i.branch_id,
    i.wholesale_sales_order_id AS sales_order_id,
    c.id AS challan_id,
    c.stock_reservation_key AS reservation_key,
    i.tax_snapshot_id
FROM cleanup_parameters p
JOIN sales_invoices i
  ON i.tenant_id = p.tenant_id
 AND i.shop_id = p.shop_id
 AND i.invoice_number = p.invoice_number
LEFT JOIN LATERAL (
    SELECT dc.id, dc.stock_reservation_key
    FROM wholesale_delivery_challans dc
    WHERE dc.tenant_id = i.tenant_id
      AND dc.shop_id = i.shop_id
      AND (
          dc.sales_invoice_id = i.id
          OR dc.sales_order_id = i.wholesale_sales_order_id
      )
    ORDER BY CASE WHEN dc.sales_invoice_id = i.id THEN 0 ELSE 1 END, dc.id DESC
    LIMIT 1
) c ON TRUE;

LOCK TABLE sales_invoices, sales_invoice_items, wholesale_sales_orders,
    wholesale_delivery_challans, wholesale_foc_audits,
    wholesale_tx_audit_events, inter_shop_trades
    IN ROW EXCLUSIVE MODE;

DO $cleanup$
DECLARE
    target cleanup_invoice%ROWTYPE;
BEGIN
    IF (SELECT confirmation FROM cleanup_parameters) <> 'DELETE-TEST-INVOICE' THEN
        RAISE EXCEPTION 'Required confirmation is DELETE-TEST-INVOICE';
    END IF;

    SELECT * INTO target FROM cleanup_invoice;
    IF target.invoice_id IS NULL THEN
        RAISE EXCEPTION 'Invoice not found in the supplied tenant/shop';
    END IF;
    IF target.sales_order_id IS NULL
       OR target.challan_id IS NULL
       OR NULLIF(BTRIM(target.reservation_key), '') IS NULL THEN
        RAISE EXCEPTION 'Invoice is not linked to a wholesale SO, challan, and FEFO reservation';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM sales_invoices i
        WHERE i.id = target.invoice_id
          AND (
              COALESCE(i.paid_amount, 0) > 0.009
              OR UPPER(COALESCE(i.payment_status, 'PENDING'))
                    NOT IN ('PENDING', 'UNPAID')
              OR NULLIF(BTRIM(i.einvoice_ack_number), '') IS NOT NULL
              OR NULLIF(BTRIM(i.eway_bill_number), '') IS NOT NULL
          )
    ) THEN
        RAISE EXCEPTION 'Invoice is paid/part-paid or has e-invoice/e-way data';
    END IF;

    IF EXISTS (
        SELECT 1 FROM payments p
        WHERE p.tenant_id = target.tenant_id
          AND p.shop_id = target.shop_id
          AND p.reference_type = 'SALES_INVOICE'
          AND p.reference_id = target.invoice_id
    ) THEN
        RAISE EXCEPTION 'Payment rows exist for this invoice';
    END IF;

    IF EXISTS (
        SELECT 1 FROM sales_returns r WHERE r.invoice_id = target.invoice_id
    ) THEN
        RAISE EXCEPTION 'Sales-return rows exist for this invoice';
    END IF;

    IF EXISTS (
        SELECT 1 FROM running_account_lines ral
        WHERE ral.tenant_id = target.tenant_id
          AND ral.shop_id = target.shop_id
          AND (
              ral.related_invoice_id = target.invoice_id
              OR (ral.source_type = 'INVOICE' AND ral.source_id = target.invoice_id)
          )
    ) THEN
        RAISE EXCEPTION 'A running-account statement contains this invoice';
    END IF;

    IF EXISTS (
        SELECT 1 FROM inter_shop_trades ist
        WHERE ist.seller_shop_id = target.shop_id
          AND ist.seller_invoice_id = target.invoice_id
          AND (
              ist.buyer_purchase_order_id IS NOT NULL
              OR ist.buyer_grn_id IS NOT NULL
              OR UPPER(COALESCE(ist.status, '')) NOT IN ('PENDING', 'REJECTED')
          )
    ) THEN
        RAISE EXCEPTION 'Inter-shop downstream processing exists';
    END IF;
END
$cleanup$;

INSERT INTO wholesale_tx_audit_events (
    tenant_id, shop_id, branch_id, entity_type, entity_id,
    action, summary, actor_id, occurred_at, correlation_id
)
SELECT
    i.tenant_id,
    i.shop_id,
    i.branch_id,
    'SALES_INVOICE',
    i.invoice_number,
    'TEST_DATA_DELETE',
    LEFT(
        'Local cleanup: invoice id=' || i.invoice_id
        || ', SO id=' || i.sales_order_id
        || ', challan id=' || i.challan_id
        || ', reservation=' || i.reservation_key,
        500
    ),
    p.operator,
    NOW(),
    LEFT('local-cleanup-' || i.invoice_id || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'), 64)
FROM cleanup_invoice i
CROSS JOIN cleanup_parameters p;

DELETE FROM inter_shop_trades ist
USING cleanup_invoice i
WHERE ist.seller_shop_id = i.shop_id
  AND ist.seller_invoice_id = i.invoice_id
  AND ist.buyer_purchase_order_id IS NULL
  AND ist.buyer_grn_id IS NULL
  AND UPPER(COALESCE(ist.status, '')) IN ('PENDING', 'REJECTED');

DELETE FROM wholesale_foc_audits a
USING cleanup_invoice i
WHERE a.tenant_id = i.tenant_id
  AND a.shop_id = i.shop_id
  AND a.invoice_id = i.invoice_id;

UPDATE wholesale_delivery_challans c
SET sales_invoice_id = NULL,
    status = 'CANCELLED',
    notes = LEFT(
        CONCAT_WS(' | ', NULLIF(c.notes, ''), 'Test invoice removed by local cleanup'),
        500
    ),
    updated_at = NOW()
FROM cleanup_invoice i
WHERE c.id = i.challan_id
  AND c.tenant_id = i.tenant_id
  AND c.shop_id = i.shop_id;

UPDATE wholesale_sales_orders s
SET sales_invoice_id = NULL,
    status = 'CANCELLED',
    deleted_at = NOW(),
    deleted_by = p.operator,
    updated_at = NOW()
FROM cleanup_invoice i
CROSS JOIN cleanup_parameters p
WHERE s.id = i.sales_order_id
  AND s.tenant_id = i.tenant_id
  AND s.shop_id = i.shop_id;

DELETE FROM sales_invoice_items x
USING cleanup_invoice i
WHERE x.sales_invoice_id = i.invoice_id;

DELETE FROM sales_invoices s
USING cleanup_invoice i
WHERE s.id = i.invoice_id
  AND s.tenant_id = i.tenant_id
  AND s.shop_id = i.shop_id;

SELECT
    i.invoice_number,
    NOT EXISTS (
        SELECT 1 FROM sales_invoices s WHERE s.id = i.invoice_id
    ) AS invoice_deleted,
    EXISTS (
        SELECT 1 FROM wholesale_sales_orders s
        WHERE s.id = i.sales_order_id
          AND s.deleted_at IS NOT NULL
          AND s.status = 'CANCELLED'
    ) AS sales_order_hidden
FROM cleanup_invoice i;

COMMIT;
