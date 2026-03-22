-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 3: EVIDENCE TABLES (First-Class Evidence Objects)
-- Migration: 20260322000003
-- Depends on: 20260322000001, 20260322000002
-- =============================================================================
-- Evidence is a first-class object in Nova Silva.
-- A single evidence record can satisfy multiple requirements across multiple
-- schemes simultaneously (cross-scheme reuse).
-- Evidence is immutable once approved — updates create new records (versioning).

-- ---------------------------------------------------------------------------
-- certification_evidence_records
-- The core evidence object. Represents a single piece of verifiable evidence.
-- scope_level + scope_id together identify WHERE the evidence applies:
--   organization → organizations table
--   farm         → farms table
--   parcel       → parcelas table
--   lot          → lotes_acopio table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_evidence_records (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL,

  -- Evidence classification
  evidence_type        public.evidence_type         NOT NULL,
  type_definition_id   uuid        REFERENCES public.certification_evidence_type_definitions(id),
  title                text        NOT NULL,
  description          text,

  -- Source: where did this evidence originate?
  source_system        text        CHECK (source_system IN (
                         'manual', 'nova_yield', 'nova_guard', 'labor_ops',
                         'compliance_hub', 'satellite_api', 'external_auditor'
                       )) DEFAULT 'manual',
  source_reference     text,       -- External record ID in the source system

  -- Scope: to which entity does this evidence apply?
  scope_level          text        NOT NULL CHECK (scope_level IN ('organization','farm','parcel','lot')),
  scope_id             uuid        NOT NULL,

  -- Temporal validity
  collected_at         timestamptz NOT NULL,
  valid_from           date        NOT NULL,
  valid_until          date,       -- NULL = no expiry defined (use type_definition max_age_days)

  -- Lifecycle
  lifecycle_status     public.evidence_lifecycle_status NOT NULL DEFAULT 'draft',
  rejection_reason     text,       -- Populated when lifecycle_status = 'rejected'
  superseded_by_id     uuid        REFERENCES public.certification_evidence_records(id),

  -- File storage
  storage_path         text,       -- Supabase Storage path (bucket/path/filename)
  file_hash_sha256     text,       -- SHA-256 of original file for integrity check
  file_size_bytes      bigint,
  mime_type            text,

  -- Geospatial metadata (for geospatial evidence_type)
  geo_latitude         numeric(10,8),
  geo_longitude        numeric(11,8),
  geo_precision_m      numeric(10,2),
  geo_polygon_wkt      text,       -- Well-Known Text polygon if applicable

  -- Flexible metadata only for dynamic / source-system-specific attributes
  -- JUSTIFICATION for JSONB: evidence metadata varies wildly by type and
  -- source system. Columns would be 90% NULL for most types.
  metadata             jsonb       DEFAULT '{}',

  -- Offline-first support
  is_offline_created   boolean     NOT NULL DEFAULT false,
  offline_device_id    text,       -- Device UUID for conflict resolution
  offline_created_at   timestamptz,
  synced_at            timestamptz,

  -- Cryptographic integrity
  blockchain_anchor_id uuid,       -- FK to blockchain_anchors (set after anchoring)

  -- Audit trail
  created_by           uuid        REFERENCES auth.users(id),
  reviewed_by          uuid        REFERENCES auth.users(id),
  reviewed_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_evidence_geo_valid CHECK (
    geo_latitude IS NULL OR (geo_latitude BETWEEN -90 AND 90)
  ),
  CONSTRAINT chk_evidence_geo_lon_valid CHECK (
    geo_longitude IS NULL OR (geo_longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT chk_evidence_valid_dates CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  ),
  CONSTRAINT chk_evidence_superseded_status CHECK (
    superseded_by_id IS NULL OR lifecycle_status = 'superseded'
  )
);

-- ---------------------------------------------------------------------------
-- certification_evidence_links
-- Many-to-many: evidence ↔ requirement.
-- A single evidence record can link to requirements across multiple schemes.
-- This is the cross-scheme reuse mechanism.
-- link_type:
--   primary   → Evidence directly satisfies this requirement
--   supporting → Evidence is supplementary (needs additional primary)
--   inferred  → Engine inferred this link via cross-scheme overlap rules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_evidence_links (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL,
  evidence_id     uuid        NOT NULL REFERENCES public.certification_evidence_records(id) ON DELETE CASCADE,
  requirement_id  uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE CASCADE,
  link_type       text        NOT NULL CHECK (link_type IN ('primary','supporting','inferred')),
  -- For partial overlaps: what % of the requirement does this evidence cover?
  coverage_pct    numeric(5,2) NOT NULL DEFAULT 100 CHECK (coverage_pct BETWEEN 0 AND 100),
  -- For inferred links: which overlap rule generated this?
  overlap_id      uuid        REFERENCES public.certification_requirement_overlaps(id),
  notes           text,
  created_by      uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evidence_id, requirement_id)
);

-- ---------------------------------------------------------------------------
-- certification_evidence_validations
-- Results of deterministic validation rules run against an evidence record.
-- Each record can have multiple validations (one per audit_logic_type).
-- Automated validations are run by Postgres functions / Edge Functions.
-- Manual validations are recorded by auditors.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_evidence_validations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL,
  evidence_id     uuid        NOT NULL REFERENCES public.certification_evidence_records(id) ON DELETE CASCADE,
  requirement_id  uuid        REFERENCES public.certification_requirements(id),

  -- What rule was run?
  validation_rule text        NOT NULL,   -- e.g. 'eudr_polygon_no_deforestation_post_2020'
  audit_logic     public.audit_logic_type NOT NULL,

  -- Result
  result          public.audit_result NOT NULL DEFAULT 'not_run',
  score           numeric(5,2),           -- Normalized 0-100 confidence/compliance score
  threshold       numeric(5,2),           -- Passing threshold for this rule

  -- Detail payload (structured error or pass detail)
  -- JUSTIFICATION for JSONB: validation detail schema varies per audit_logic_type.
  -- E.g., mass_balance returns {variance_kg, variance_pct, tolerance_pct}.
  -- geospatial_validation returns {alert_source, alert_area_ha, overlap_type}.
  details         jsonb       DEFAULT '{}',
  error_message   text,

  -- Execution context
  is_automated    boolean     NOT NULL DEFAULT true,   -- false = manual auditor entry
  engine_version  text,                               -- Version of the evaluation engine
  validated_at    timestamptz NOT NULL DEFAULT now(),
  validated_by    uuid        REFERENCES auth.users(id),   -- NULL if automated

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- certification_evidence_versions
-- Append-only version history for evidence records (immutability guarantee).
-- When an evidence record is updated (re-submitted), a new version snapshot
-- is recorded here. The main record is updated, the history is preserved.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_evidence_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL,
  evidence_id     uuid        NOT NULL REFERENCES public.certification_evidence_records(id) ON DELETE CASCADE,
  version_number  integer     NOT NULL,
  -- Snapshot of key fields at this version
  lifecycle_status public.evidence_lifecycle_status NOT NULL,
  storage_path    text,
  file_hash_sha256 text,
  reviewed_by     uuid        REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  change_reason   text        NOT NULL,
  changed_by      uuid        REFERENCES auth.users(id),
  changed_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evidence_id, version_number)
);
