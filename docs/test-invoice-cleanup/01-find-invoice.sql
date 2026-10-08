-- DBeaver: edit only these three values, then execute the whole script.
WITH cleanup_parameters AS (
    SELECT
        21::BIGINT AS tenant_id,
        'CTC-WHS-01'::VARCHAR(100) AS shop_id,
        'REPLACE-WITH-INVOICE-NUMBER'::VARCHAR(80) AS invoice_number
)
SELECT
    i.tenant_id,
    i.shop_id,
    i.id AS invoice_id,
    i.invoice_number,
    i.payment_status,
    i.paid_amount,
    i.wholesale_sales_order_id AS sales_order_id,
    c.id AS challan_id,
    c.stock_reservation_key AS reservation_key,
    (SELECT COUNT(*) FROM sales_invoice_items x
     WHERE x.sales_invoice_id = i.id) AS invoice_item_count,
    (SELECT COUNT(*) FROM payments p
     WHERE p.tenant_id = i.tenant_id
       AND p.shop_id = i.shop_id
       AND p.reference_type = 'SALES_INVOICE'
       AND p.reference_id = i.id) AS payment_count,
    (SELECT COUNT(*) FROM sales_returns r
     WHERE r.invoice_id = i.id) AS return_count
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
