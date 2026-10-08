-- DBeaver: connect to stockdb, edit only the values in
-- cleanup_parameters, then execute the whole script.

BEGIN;

CREATE TEMP TABLE cleanup_parameters ON COMMIT DROP AS
SELECT
    21::BIGINT AS tenant_id,
    'CTC-WHS-01'::VARCHAR(100) AS shop_id,
    'REPLACE-WITH-RESERVATION-KEY'::VARCHAR(120) AS reservation_key,
    'RESTORE-TEST-STOCK'::TEXT AS confirmation;

LOCK TABLE fefo_reservations, fefo_reservation_lines, stock,
    inventory_batches, inventory_bucket_balances, inventory_transactions
    IN ROW EXCLUSIVE MODE;

DO $cleanup$
DECLARE
    reservation_status TEXT;
    reservation_id BIGINT;
BEGIN
    IF (SELECT confirmation FROM cleanup_parameters) <> 'RESTORE-TEST-STOCK' THEN
        RAISE EXCEPTION 'Required confirmation is RESTORE-TEST-STOCK';
    END IF;

    SELECT r.id, UPPER(r.status)
    INTO reservation_id, reservation_status
    FROM fefo_reservations r
    JOIN cleanup_parameters p
      ON p.tenant_id = r.tenant_id
     AND p.shop_id = r.shop_id
     AND p.reservation_key = r.reservation_key;

    IF reservation_id IS NULL THEN
        RAISE EXCEPTION 'FEFO reservation not found';
    END IF;
    IF reservation_status NOT IN ('RESERVED', 'COMMITTED', 'RELEASED') THEN
        RAISE EXCEPTION 'Unsupported reservation status: %', reservation_status;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM fefo_reservation_lines l
        WHERE l.reservation_id = reservation_id
    ) THEN
        RAISE EXCEPTION 'Reservation has no allocation lines';
    END IF;
    IF reservation_status = 'RELEASED' AND NOT EXISTS (
        SELECT 1 FROM inventory_transactions tx
        WHERE tx.reference_type = 'FEFO_RESERVATION'
          AND tx.reference_id = reservation_id
          AND tx.transaction_type = 'TEST_INVOICE_CLEANUP'
    ) THEN
        RAISE EXCEPTION 'Reservation was already released outside this cleanup; stock was not changed';
    END IF;
END
$cleanup$;

CREATE TEMP TABLE stock_reversal_lines AS
SELECT
    r.id AS reservation_id,
    UPPER(r.status) AS original_status,
    r.tenant_id,
    r.shop_id,
    l.id AS reservation_line_id,
    l.stock_id,
    l.branch_id,
    l.warehouse_id,
    l.product_id,
    l.batch_id,
    l.quantity,
    l.unit_cost
FROM fefo_reservations r
JOIN cleanup_parameters p
  ON p.tenant_id = r.tenant_id
 AND p.shop_id = r.shop_id
 AND p.reservation_key = r.reservation_key
JOIN fefo_reservation_lines l ON l.reservation_id = r.id
WHERE UPPER(r.status) IN ('RESERVED', 'COMMITTED')
  AND NOT EXISTS (
      SELECT 1 FROM inventory_transactions tx
      WHERE tx.tenant_id = r.tenant_id
        AND tx.shop_id = r.shop_id
        AND tx.reference_type = 'FEFO_RESERVATION'
        AND tx.reference_id = r.id
        AND tx.transaction_type = 'TEST_INVOICE_CLEANUP'
  );

DO $cleanup$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM stock_reversal_lines l
        LEFT JOIN stock s
          ON s.id = l.stock_id
         AND s.tenant_id = l.tenant_id
         AND s.shop_id = l.shop_id
        GROUP BY l.stock_id, s.id, s.reserved
        HAVING s.id IS NULL
            OR COALESCE(s.reserved, 0) < SUM(
                CASE WHEN l.original_status = 'RESERVED' THEN l.quantity ELSE 0 END)
    ) THEN
        RAISE EXCEPTION 'Stock row is missing or reserved quantity is inconsistent';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM stock_reversal_lines l
        LEFT JOIN inventory_batches b
          ON b.id = l.batch_id
         AND b.tenant_id = l.tenant_id
         AND b.shop_id = l.shop_id
        WHERE l.batch_id IS NOT NULL AND b.id IS NULL
    ) THEN
        RAISE EXCEPTION 'An allocated inventory batch is missing';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM stock_reversal_lines l
        WHERE NOT EXISTS (
            SELECT 1 FROM inventory_bucket_balances b
            WHERE b.tenant_id = l.tenant_id
              AND b.shop_id = l.shop_id
              AND b.branch_id = l.branch_id
              AND b.warehouse_id = l.warehouse_id
              AND b.product_id = l.product_id
              AND b.batch_id = COALESCE(l.batch_id, 0)
              AND b.bucket_type = 'AVAILABLE'
        )
    ) THEN
        RAISE EXCEPTION 'An AVAILABLE inventory bucket is missing';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (
            SELECT tenant_id, shop_id, branch_id, warehouse_id, product_id,
                   COALESCE(batch_id, 0) AS batch_id, SUM(quantity) AS quantity
            FROM stock_reversal_lines
            WHERE original_status = 'RESERVED'
            GROUP BY tenant_id, shop_id, branch_id, warehouse_id,
                     product_id, COALESCE(batch_id, 0)
        ) q
        LEFT JOIN inventory_bucket_balances b
          ON b.tenant_id = q.tenant_id
         AND b.shop_id = q.shop_id
         AND b.branch_id = q.branch_id
         AND b.warehouse_id = q.warehouse_id
         AND b.product_id = q.product_id
         AND b.batch_id = q.batch_id
         AND b.bucket_type = 'RESERVED'
        WHERE b.id IS NULL OR b.quantity < q.quantity
    ) THEN
        RAISE EXCEPTION 'A RESERVED inventory bucket is missing or inconsistent';
    END IF;
END
$cleanup$;

UPDATE inventory_batches b
SET quantity_available = COALESCE(b.quantity_available, 0) + q.quantity,
    updated_at = NOW()
FROM (
    SELECT tenant_id, shop_id, batch_id, SUM(quantity)::INT AS quantity
    FROM stock_reversal_lines
    WHERE batch_id IS NOT NULL
    GROUP BY tenant_id, shop_id, batch_id
) q
WHERE b.id = q.batch_id
  AND b.tenant_id = q.tenant_id
  AND b.shop_id = q.shop_id;

UPDATE inventory_bucket_balances b
SET quantity = b.quantity + q.quantity,
    updated_at = NOW()
FROM (
    SELECT tenant_id, shop_id, branch_id, warehouse_id, product_id,
           COALESCE(batch_id, 0) AS batch_id, SUM(quantity)::INT AS quantity
    FROM stock_reversal_lines
    GROUP BY tenant_id, shop_id, branch_id, warehouse_id,
             product_id, COALESCE(batch_id, 0)
) q
WHERE b.tenant_id = q.tenant_id
  AND b.shop_id = q.shop_id
  AND b.branch_id = q.branch_id
  AND b.warehouse_id = q.warehouse_id
  AND b.product_id = q.product_id
  AND b.batch_id = q.batch_id
  AND b.bucket_type = 'AVAILABLE';

UPDATE inventory_bucket_balances b
SET quantity = b.quantity - q.quantity,
    updated_at = NOW()
FROM (
    SELECT tenant_id, shop_id, branch_id, warehouse_id, product_id,
           COALESCE(batch_id, 0) AS batch_id, SUM(quantity)::INT AS quantity
    FROM stock_reversal_lines
    WHERE original_status = 'RESERVED'
    GROUP BY tenant_id, shop_id, branch_id, warehouse_id,
             product_id, COALESCE(batch_id, 0)
) q
WHERE b.tenant_id = q.tenant_id
  AND b.shop_id = q.shop_id
  AND b.branch_id = q.branch_id
  AND b.warehouse_id = q.warehouse_id
  AND b.product_id = q.product_id
  AND b.batch_id = q.batch_id
  AND b.bucket_type = 'RESERVED';

UPDATE stock s
SET quantity = COALESCE(s.quantity, 0) + q.committed_quantity,
    reserved = COALESCE(s.reserved, 0) - q.reserved_quantity,
    available_quantity =
        (COALESCE(s.quantity, 0) + q.committed_quantity)
        - (COALESCE(s.reserved, 0) - q.reserved_quantity),
    updated_at = NOW()
FROM (
    SELECT stock_id,
           SUM(CASE WHEN original_status = 'COMMITTED' THEN quantity ELSE 0 END)::INT
               AS committed_quantity,
           SUM(CASE WHEN original_status = 'RESERVED' THEN quantity ELSE 0 END)::INT
               AS reserved_quantity
    FROM stock_reversal_lines
    GROUP BY stock_id
) q
WHERE s.id = q.stock_id;

INSERT INTO inventory_transactions (
    tenant_id, shop_id, branch_id, warehouse_id, product_id, batch_id,
    bucket_type, transaction_type, reference_type, reference_id,
    quantity_in, quantity_out, qty_unit, equivalent_base_qty, unit_cost,
    transaction_time, created_by, created_at, updated_at
)
SELECT
    tenant_id, shop_id, branch_id, warehouse_id, product_id, batch_id,
    'AVAILABLE', 'TEST_INVOICE_CLEANUP', 'FEFO_RESERVATION', reservation_id,
    quantity, 0, 'INVENTORY', quantity, unit_cost,
    NOW(), NULL, NOW(), NOW()
FROM stock_reversal_lines;

INSERT INTO inventory_transactions (
    tenant_id, shop_id, branch_id, warehouse_id, product_id, batch_id,
    bucket_type, transaction_type, reference_type, reference_id,
    quantity_in, quantity_out, qty_unit, equivalent_base_qty, unit_cost,
    transaction_time, created_by, created_at, updated_at
)
SELECT
    tenant_id, shop_id, branch_id, warehouse_id, product_id, batch_id,
    'RESERVED', 'TEST_INVOICE_CLEANUP_RESERVED',
    'FEFO_RESERVATION', reservation_id,
    0, quantity, 'INVENTORY', quantity, unit_cost,
    NOW(), NULL, NOW(), NOW()
FROM stock_reversal_lines
WHERE original_status = 'RESERVED';

UPDATE fefo_reservations r
SET status = 'RELEASED',
    release_reason = 'TEST_DATA_CLEANUP',
    released_at = NOW(),
    updated_at = NOW()
WHERE r.id IN (SELECT DISTINCT reservation_id FROM stock_reversal_lines);

SELECT
    p.reservation_key,
    r.status,
    r.release_reason,
    COALESCE(SUM(l.quantity), 0) AS restored_quantity
FROM cleanup_parameters p
JOIN fefo_reservations r
  ON r.tenant_id = p.tenant_id
 AND r.shop_id = p.shop_id
 AND r.reservation_key = p.reservation_key
LEFT JOIN stock_reversal_lines l ON l.reservation_id = r.id
GROUP BY p.reservation_key, r.status, r.release_reason;

COMMIT;
