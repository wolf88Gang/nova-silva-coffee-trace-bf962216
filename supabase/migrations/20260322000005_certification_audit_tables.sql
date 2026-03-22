-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 5: AUDIT / CONTROL TABLES (Deterministic Checks)
-- Migration: 20260322000005
-- Depends on: 20260322000001–20260322000004
-- =============================================================================
-- These tables store the inputs and outputs of the four deterministic audit
-- logic types:
--   1. Mass Balance (volume reconciliation)
--   2. Yield Plausibility (Nova Yield integration)
--   3. Geospatial Validation (EUDR compliance)
--   4. Traceback (supply chain, labor, financial)

-- ---------------------------------------------------------------------------
-- certification_mass_balance_checks
-- Validates: volume received ≈ volume processed + sold + closing stock
-- Tolerance defined per scheme. Typically ±5% for coffee.
-- Triggered by: lot closure, periodic settlement, audit request.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_mass_balance_checks (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid        NOT NULL,
  scheme_version_id     uuid        NOT NULL REFERENCES public.certification_scheme_versions(id),

  -- Subject of the check
  lot_id                uuid,       -- FK to lotes_acopio (nullable for period-level checks)
  period_start          date        NOT NULL,
  period_end            date        NOT NULL,
  check_level           text        NOT NULL DEFAULT 'lot' CHECK (check_level IN ('lot','period','annual')),

  -- Volume inputs (all in kg of cherry equivalent unless noted)
  certified_volume_kg   numeric(16,4) NOT NULL DEFAULT 0,  -- Volume claimed as certified
  received_volume_kg    numeric(16,4) NOT NULL DEFAULT 0,  -- Total received from certified farms
  processed_volume_kg   numeric(16,4) NOT NULL DEFAULT 0,  -- Wet/dry processed
  sold_volume_kg        numeric(16,4) NOT NULL DEFAULT 0,  -- Sold with certification claim
  exported_volume_kg    numeric(16,4) NOT NULL DEFAULT 0,
  stock_opening_kg      numeric(16,4) NOT NULL DEFAULT 0,
  stock_closing_kg      numeric(16,4) NOT NULL DEFAULT 0,

  -- Conversion ratios (for cherry → parchment → green bean conversion)
  conversion_ratio      numeric(8,4) NOT NULL DEFAULT 1.0,
  conversion_basis      text        CHECK (conversion_basis IN ('cherry','parchment','green','roasted')),

  -- Computed variance (GENERATED column — no manual input needed)
  variance_kg           numeric(16,4) GENERATED ALWAYS AS (
                          received_volume_kg
                          - processed_volume_kg
                          - (stock_closing_kg - stock_opening_kg)
                        ) STORED,
  variance_pct          numeric(9,4),   -- Computed after insert via trigger/function
  tolerance_pct         numeric(7,4)    NOT NULL DEFAULT 5.0,

  -- Audit result
  result                public.audit_result NOT NULL DEFAULT 'not_run',
  failure_reason        text,
  warning_flags         text[]      NOT NULL DEFAULT '{}',

  -- Execution metadata
  calculated_at         timestamptz NOT NULL DEFAULT now(),
  calculated_by         uuid        REFERENCES auth.users(id),  -- NULL = automated
  engine_version        text,

  -- Cryptographic integrity
  blockchain_anchor_id  uuid,

  created_at            timestamptz NOT NULL DEFAULT now(),

  -- Constraint: period must be valid
  CONSTRAINT chk_mb_period_valid CHECK (period_end >= period_start)
);

-- ---------------------------------------------------------------------------
-- certification_plausibility_checks
-- Validates: declared farm yield vs. biological ceiling from Nova Yield module.
-- Catches: data fabrication, volume inflation, ghost farms.
-- Deviation > 30% (configurable per scheme) = FAIL.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_plausibility_checks (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          uuid        NOT NULL,
  parcel_id                uuid        NOT NULL,  -- FK to parcelas
  scheme_version_id        uuid        NOT NULL REFERENCES public.certification_scheme_versions(id),

  period_start             date        NOT NULL,
  period_end               date        NOT NULL,

  -- Declared values (from organization)
  declared_yield_kg_ha     numeric(12,4) NOT NULL,
  declared_area_ha         numeric(12,4),
  declared_total_kg        numeric(16,4),

  -- Nova Yield biological ceiling
  nova_yield_ceiling_kg_ha numeric(12,4),    -- Populated by Nova Yield integration
  nova_yield_run_id        uuid,             -- Reference to Nova Yield calculation record
  nova_yield_confidence    numeric(5,2),     -- 0-100 confidence of the ceiling estimate

  -- Agronomic context (inputs to plausibility model)
  variety_code             text,
  altitude_masl            integer,
  rainfall_mm              numeric(10,2),
  temperature_avg_c        numeric(5,2),
  biotic_stress_factor     numeric(5,4),     -- 0.0–1.0 (1.0 = no stress)
  soil_quality_index       numeric(5,2),

  -- Result
  deviation_pct            numeric(9,4),     -- (declared - ceiling) / ceiling * 100
  max_deviation_pct        numeric(7,4)    NOT NULL DEFAULT 30.0,
  result                   public.audit_result NOT NULL DEFAULT 'not_run',
  failure_reason           text,
  warning_flags            text[]          NOT NULL DEFAULT '{}',

  -- Execution metadata
  calculated_at            timestamptz NOT NULL DEFAULT now(),
  calculated_by            uuid        REFERENCES auth.users(id),

  -- Cryptographic integrity
  blockchain_anchor_id     uuid,

  created_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_plaus_period_valid CHECK (period_end >= period_start),
  CONSTRAINT chk_plaus_deviation_logic CHECK (
    (nova_yield_ceiling_kg_ha IS NULL) OR (deviation_pct IS NOT NULL)
  )
);

-- ---------------------------------------------------------------------------
-- certification_geospatial_validations
-- EUDR Article 3(a): no deforestation after 31-Dec-2020.
-- Also validates: GPS precision, polygon area vs declared area,
-- overlap with protected areas, indigenous territories.
-- Integrates with: Nova Guard (risk signals), external satellite APIs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_geospatial_validations (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid        NOT NULL,
  parcel_id               uuid        NOT NULL,   -- FK to parcelas
  scheme_version_id       uuid        NOT NULL REFERENCES public.certification_scheme_versions(id),

  -- Polygon data
  polygon_wkt             text,                   -- WKT representation of parcel polygon
  polygon_area_ha         numeric(14,6),          -- Area computed from polygon geometry
  declared_area_ha        numeric(14,6),          -- Area as declared by farmer
  area_deviation_pct      numeric(9,4),           -- (polygon - declared) / declared * 100
  gps_precision_m         numeric(10,2),          -- GPS measurement precision in meters
  gps_point_count         integer,                -- Number of GPS points used

  -- EUDR cutoff validation
  eudr_reference_date     date        NOT NULL DEFAULT '2020-12-31',
  deforestation_alert     boolean     NOT NULL DEFAULT false,
  alert_source            text        CHECK (alert_source IN (
                            'gfw','prodes','glad_s2','hansen','sentinel_2',
                            'planet','manual','nova_guard'
                          )),
  alert_area_ha           numeric(14,6),          -- Area of detected deforestation
  alert_confidence_pct    numeric(5,2),           -- Source confidence level
  forest_cover_pct        numeric(7,4),           -- % forest cover at reference date

  -- Overlap validations
  overlap_protected_area  boolean     NOT NULL DEFAULT false,
  overlap_indigenous      boolean     NOT NULL DEFAULT false,
  overlap_water_body      boolean     NOT NULL DEFAULT false,
  overlap_area_ha         numeric(14,6),

  -- Satellite imagery metadata
  satellite_image_date    date,
  satellite_image_url     text,
  satellite_resolution_m  numeric(8,2),

  -- False positive management (SECTION I — Risk: satellite false positives)
  false_positive_flag     boolean     NOT NULL DEFAULT false,
  false_positive_reason   text,
  false_positive_verified_by uuid     REFERENCES auth.users(id),
  false_positive_verified_at timestamptz,

  -- Nova Guard integration
  nova_guard_signal_id    uuid,       -- Reference to Nova Guard risk signal
  nova_guard_risk_level   text        CHECK (nova_guard_risk_level IN ('low','medium','high','critical')),

  -- Result
  result                  public.audit_result NOT NULL DEFAULT 'not_run',
  failure_reasons         text[]      NOT NULL DEFAULT '{}',
  warning_flags           text[]      NOT NULL DEFAULT '{}',

  -- Execution metadata
  validated_at            timestamptz,
  validated_by            uuid        REFERENCES auth.users(id),
  engine_version          text,

  -- Cryptographic integrity
  blockchain_anchor_id    uuid,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- certification_traceback_checks
-- Validates supply chain integrity at three levels:
--   labor        → Worker identity, contracts, wages, child/forced labor
--   supply_chain → Farm-to-mill traceability of certified coffee
--   financial    → Payment chain: premium paid, minimum price observed
-- Integrates with: LaborOps module, financial_traceability audit logic.
-- Zero-tolerance: child_labor_detected, forced_labor_detected.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_traceback_checks (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid        NOT NULL,
  scheme_version_id       uuid        NOT NULL REFERENCES public.certification_scheme_versions(id),

  -- Subject of check
  check_type              text        NOT NULL CHECK (check_type IN ('labor','supply_chain','financial')),
  lot_id                  uuid,       -- FK to lotes_acopio (for supply_chain / financial)
  parcel_id               uuid,       -- FK to parcelas (for labor checks)
  producer_id             uuid,       -- FK to productores

  period_start            date        NOT NULL,
  period_end              date        NOT NULL,

  -- Labor-specific fields
  workers_declared        integer,
  workers_verified        integer,
  seasonal_workers        integer,
  permanent_workers       integer,
  -- ZERO TOLERANCE — any true = immediate blocked status
  child_labor_detected    boolean     NOT NULL DEFAULT false,
  forced_labor_detected   boolean     NOT NULL DEFAULT false,
  discrimination_detected boolean     NOT NULL DEFAULT false,
  -- Wage compliance
  minimum_wage_met        boolean,
  payment_gap_pct         numeric(7,4),   -- (actual_wage - min_wage) / min_wage * 100
  -- Safety
  ppe_provided            boolean,
  safety_training_done    boolean,
  -- LaborOps integration
  labor_ops_run_id        uuid,

  -- Supply chain traceability fields
  farm_count_declared     integer,
  farm_count_verified     integer,
  traceability_pct        numeric(5,2),   -- % of volume with full farm-level traceability

  -- Financial traceability fields
  price_paid_usd_kg       numeric(10,4),
  minimum_price_usd_kg    numeric(10,4),
  fairtrade_premium_paid  boolean,
  premium_amount_usd      numeric(14,2),
  payment_proof_count     integer,

  -- Result
  result                  public.audit_result NOT NULL DEFAULT 'not_run',
  failure_reason          text,
  risk_score              numeric(5,2),   -- 0-100 composite risk score
  warning_flags           text[]      NOT NULL DEFAULT '{}',

  -- Execution metadata
  calculated_at           timestamptz NOT NULL DEFAULT now(),
  calculated_by           uuid        REFERENCES auth.users(id),

  -- Cryptographic integrity
  blockchain_anchor_id    uuid,

  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_tb_period_valid CHECK (period_end >= period_start),
  -- Zero tolerance constraints — child and forced labor immediately block
  CONSTRAINT chk_tb_zero_tolerance_result CHECK (
    (child_labor_detected = false AND forced_labor_detected = false)
    OR result = 'fail'
  )
);
