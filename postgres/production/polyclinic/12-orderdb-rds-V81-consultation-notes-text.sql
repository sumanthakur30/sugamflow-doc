-- =============================================================================
-- ORDERDB — V81 SAFE (consultation notes → text)
-- Database: orderdb
-- =============================================================================
-- Why: EMR pad stores HPI / history / examination JSON in consultations.notes.
-- varchar was truncating / failing; Flyway file:
--   order-service/.../V81__consultation_notes_text.sql
-- This file is NOT yet on origin/dev — apply on RDS before/with that release.
-- Idempotent for PostgreSQL.
-- =============================================================================

SELECT current_database() AS db, current_user AS usr;

DO $$
DECLARE
  dtype text;
BEGIN
  SELECT data_type INTO dtype
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'consultations'
    AND column_name = 'notes';

  IF dtype IS NULL THEN
    RAISE NOTICE 'consultations.notes does not exist — skip (unexpected)';
  ELSIF dtype = 'text' THEN
    RAISE NOTICE 'consultations.notes already text — OK';
  ELSE
    EXECUTE 'ALTER TABLE consultations ALTER COLUMN notes TYPE text';
    RAISE NOTICE 'consultations.notes altered to text (was %)', dtype;
  END IF;
END $$;

-- Verify
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'consultations'
  AND column_name = 'notes';

-- Optional: record Flyway history ONLY if you apply SQL manually and Flyway table exists
-- and version 81 is not already present. Uncomment after verifying max version.
-- INSERT INTO flyway_schema_history_order (
--   installed_rank, version, description, type, script, checksum, installed_by,
--   installed_on, execution_time, success
-- )
-- SELECT
--   COALESCE((SELECT MAX(installed_rank) FROM flyway_schema_history_order), 0) + 1,
--   '81',
--   'consultation notes text',
--   'SQL',
--   'V81__consultation_notes_text.sql',
--   NULL,
--   current_user,
--   now(),
--   0,
--   TRUE
-- WHERE to_regclass('public.flyway_schema_history_order') IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM flyway_schema_history_order WHERE version = '81' AND success = TRUE
--   );
