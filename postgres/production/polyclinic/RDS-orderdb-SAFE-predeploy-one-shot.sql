-- =============================================================================
-- ORDERDB — ONE-SHOT SAFE pre-deploy (known pain points)
-- Database: orderdb  |  DBeaver: select orderdb (NOT postgres)
-- =============================================================================
-- Patches only the pieces that repeatedly break when Flyway history is incomplete.
-- Full PathLab V73–V80 should still come from order-service Flyway on deploy
-- (those files are already on origin/dev).
-- =============================================================================

SELECT current_database() AS db, current_user AS usr, now() AS started_at;

-- ---------- V74 SAFE ----------
ALTER TABLE IF EXISTS lab_report_versions
    ADD COLUMN IF NOT EXISTS approval_level int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS required_approval_levels int NOT NULL DEFAULT 1;

ALTER TABLE IF EXISTS lab_reference_ranges
    ADD COLUMN IF NOT EXISTS pregnancy_stage varchar(20),
    ADD COLUMN IF NOT EXISTS gestation_min_weeks int,
    ADD COLUMN IF NOT EXISTS gestation_max_weeks int;

CREATE TABLE IF NOT EXISTS lab_result_formulas (
    id bigserial primary key,
    tenant_id bigint not null,
    shop_id varchar(100),
    test_code varchar(100) not null,
    parameter_name varchar(255) not null,
    expression text not null,
    unit varchar(40),
    active boolean not null default true,
    notes varchar(1000),
    created_at timestamp not null default now()
);

CREATE TABLE IF NOT EXISTS lab_approval_policies (
    id bigserial primary key,
    tenant_id bigint not null,
    shop_id varchar(100),
    department varchar(120),
    test_code varchar(100),
    levels_json text,
    active boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

CREATE TABLE IF NOT EXISTS lab_instrument_sessions (
    id bigserial primary key,
    tenant_id bigint not null,
    shop_id varchar(100),
    instrument_id bigint,
    session_key varchar(120) not null,
    protocol varchar(40),
    status varchar(40) not null default 'ACTIVE',
    last_heartbeat_at timestamp,
    last_error varchar(1000),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

-- ---------- V81 SAFE ----------
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
    RAISE NOTICE 'consultations.notes missing — skip';
  ELSIF dtype = 'text' THEN
    RAISE NOTICE 'consultations.notes already text';
  ELSE
    EXECUTE 'ALTER TABLE consultations ALTER COLUMN notes TYPE text';
    RAISE NOTICE 'consultations.notes -> text (was %)', dtype;
  END IF;
END $$;

-- ---------- Verify ----------
SELECT 'lab_report_versions.approval_level' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'lab_report_versions' AND column_name = 'approval_level'
       ) THEN 'OK' ELSE 'MISSING' END AS status
UNION ALL
SELECT 'consultations.notes type',
       COALESCE((
         SELECT data_type FROM information_schema.columns
         WHERE table_name = 'consultations' AND column_name = 'notes'
       ), 'MISSING');

SELECT 'NEXT: deploy order-service (Flyway V73–V81) + queue-service + UI' AS next_step;
