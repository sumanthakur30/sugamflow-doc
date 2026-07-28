-- =============================================================================
-- ORDERDB — V74 approval columns SAFE (known 500 on lab report versions)
-- Database: orderdb
-- =============================================================================
-- Why: lab_report_versions.approval_level / required_approval_levels missing
-- caused report APIs to 500 when Flyway history was incomplete.
-- Source: V74__lab_phase2_qc_formula_approval.sql
-- Idempotent — safe if already applied by Flyway.
-- =============================================================================

SELECT current_database() AS db, current_user AS usr;

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

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lab_report_versions'
  AND column_name IN ('approval_level', 'required_approval_levels')
ORDER BY column_name;
