# Test Invoice Cleanup — Stock and Invoice Rows Only

These local SQL scripts do only two things:

1. Restore stock from the invoice's exact FEFO reservation.
2. Remove the wholesale invoice rows and hide its sales order.

They do not change the Angular UI, runtime services, `ledgerdb`, or `gstdb`.

Use them only for unpaid setup/test invoices. Take a database snapshot first.

## Files

- `01-find-invoice.sql` — read-only lookup in `orderdb`.
- `02-restore-stock.sql` — restores exact batch, warehouse, stock, and bucket quantities in `stockdb`.
- `03-delete-invoice-rows.sql` — deletes invoice rows in `orderdb`.

## 1. Find the invoice and reservation

In DBeaver, connect to `orderdb` and open `01-find-invoice.sql`.
Edit `tenant_id`, `shop_id`, and `invoice_number` in the
`cleanup_parameters` block at the top. Execute the whole script.

Copy the returned `reservation_key`. Stop if the invoice has payment or return rows.

## 2. Restore stock first

In DBeaver, connect to `stockdb` and open `02-restore-stock.sql`.
Edit `tenant_id`, `shop_id`, and `reservation_key` in the block at the top.
Keep the confirmation value as `RESTORE-TEST-STOCK`, then execute the whole
script.

The script:

- Restores `inventory_batches.quantity_available`.
- Restores the exact `AVAILABLE` warehouse/batch bucket.
- Removes the exact `RESERVED` bucket quantity when applicable.
- Restores aggregate `stock` correctly for `RESERVED` and `COMMITTED` reservations.
- Writes inventory transaction evidence.
- Marks the reservation `RELEASED`.
- Is protected against restoring the same reservation twice.

Do not run step 3 unless this transaction commits successfully.

## 3. Delete invoice rows

Reconnect to `orderdb` and open `03-delete-invoice-rows.sql`.
Edit `tenant_id`, `shop_id`, `invoice_number`, and `operator` in the block at
the top. Keep the confirmation value as `DELETE-TEST-INVOICE`, then execute
the whole script.

The script:

- Blocks paid, returned, e-invoiced, e-way billed, running-account, or processed inter-shop invoices.
- Deletes invoice item and invoice header rows.
- Removes test-only FOC and pending/rejected inter-shop rows.
- Cancels and unlinks the challan.
- Cancels and soft-deletes the wholesale sales order.
- Retains a wholesale audit event.

Because these scripts intentionally do not touch `ledgerdb` or `gstdb`, use them only when the setup/test invoice has no accounting or GST artifacts.
