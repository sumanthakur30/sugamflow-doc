-- =============================================================================
-- ORDERDB — Pre-deploy check (AWS RDS)
-- Database: orderdb  |  User: prefer app DB user or postgres
-- =============================================================================
-- Run FIRST in DBeaver with orderdb selected.
-- Use results to decide: Flyway auto-migrate vs manual SAFE scripts.
-- =============================================================================

SELECT current_database() AS db, current_user AS usr, now() AS checked_at;

-- 1) Flyway history present?
SELECT
  CASE WHEN to_regclass('public.flyway_schema_history_order') IS NOT NULL
       THEN 'OK — flyway_schema_history_order exists'
       ELSE 'MISSING — order-service may recreate baseline; prefer SAFE scripts below'
  END AS flyway_status;

-- 2) Latest applied Flyway version (if table exists)
SELECT version, description, success, installed_on
FROM flyway_schema_history_order
WHERE success = TRUE
ORDER BY installed_rank DESC
LIMIT 15;

-- 3) Critical columns that previously broke prod/local (V74 / EMR)
SELECT
  c.table_name,
  c.column_name,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    (c.table_name = 'lab_report_versions' AND c.column_name IN ('approval_level', 'required_approval_levels'))
    OR (c.table_name = 'consultations' AND c.column_name = 'notes')
  )
ORDER BY c.table_name, c.column_name;

-- 4) PathLab Phase 1–3 tables (V73–V80) — missing = not migrated yet
SELECT t.expected_table,
       CASE WHEN to_regclass('public.' || t.expected_table) IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM (VALUES
  ('lab_barcode_configs'),
  ('lab_barcode_sequences'),
  ('lab_label_prints'),
  ('lab_doctor_commission_rules'),
  ('lab_result_formulas'),
  ('lab_approval_policies'),
  ('lab_instrument_sessions'),
  ('lab_report_access_tokens'),
  ('lab_release_notify_targets'),
  ('lab_cc_center_price_overrides'),
  ('lab_camps'),
  ('lab_patient_portal_otps'),
  ('lab_reagent_procurement_settings'),
  ('lab_referring_doctors')
) AS t(expected_table)
ORDER BY status DESC, expected_table;

-- Interpretation:
-- • If latest Flyway version < 80 → deploy new order-service image and let Flyway run,
--   OR apply flyway files V73..V80 manually then insert history rows carefully.
-- • If approval_level MISSING → run 13-orderdb-rds-V74-approval-columns-SAFE.sql
-- • If consultations.notes is varchar → run 12-orderdb-rds-V81-consultation-notes-text.sql
-- • Doctor fees UI needs NO orderdb change (uses doctordb.doctors.consultation_fee)
