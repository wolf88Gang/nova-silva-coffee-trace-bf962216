-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 4: TENANT / ORGANIZATION TABLES
-- Migration: 20260322000004
-- Depends on: 20260322000001, 20260322000002, 20260322000003
-- =============================================================================
-- These tables represent an organization's certification state:
--   - which schemes they are enrolled in
--   - which requirements apply to them
--   - their self-assessment responses
--   - computed compliance evaluations (output of the compliance engine)

-- ---------------------------------------------------------------------------
-- organization_certification_profiles
-- One row per organization. Central certification context.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_certification_profiles (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL UNIQUE,

  -- Organization context
  profile_name      text        NOT NULL,
  country_code      text        NOT NULL,          -- ISO 3166-1 alpha-2 (e.g. 'CO', 'BR', 'VN')
  commodity         text        NOT NULL DEFAULT 'coffee',
  farming_system    text        CHECK (farming_system IN ('smallholder','estate','mixed')),

  -- Scope summary (used for applicability rules)
  hectares_total    numeric(14,4),
  producers_count   integer,
  altitude_min_masl integer,
  altitude_max_masl integer,
  primary_variety   text,

  -- EUDR-specific
  eudr_due_date     date,                          -- Operator's EUDR compliance deadline
  eudr_geo_data_submitted boolean NOT NULL DEFAULT false,

  -- Audit readiness
  last_audit_date   date,
  next_audit_date   date,
  audit_readiness_score numeric(5,2),              -- 0-100 computed by engine

  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- organization_certification_schemes
-- Enrollment of an organization into a specific scheme version.
-- One row per (org, scheme_version) pair.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_certification_schemes (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL,
  scheme_version_id    uuid        NOT NULL REFERENCES public.certification_scheme_versions(id) ON DELETE RESTRICT,

  -- Enrollment
  enrollment_date      date        NOT NULL,
  expiry_date          date,

  -- Certificate details
  certificate_number   text,
  certificate_url      text,       -- Supabase Storage or external URL

  -- Audit info
  audit_date           date,
  audit_firm           text,
  lead_auditor         text,

  -- Current compliance state (updated by engine)
  compliance_status    public.compliance_status NOT NULL DEFAULT 'not_started',
  compliant_count      integer     NOT NULL DEFAULT 0,
  non_compliant_count  integer     NOT NULL DEFAULT 0,
  blocked_count        integer     NOT NULL DEFAULT 0,   -- Zero-tolerance failures
  in_progress_count    integer     NOT NULL DEFAULT 0,
  not_applicable_count integer     NOT NULL DEFAULT 0,
  total_requirements   integer     NOT NULL DEFAULT 0,
  compliance_score     numeric(5,2),                    -- Weighted score 0-100

  is_active            boolean     NOT NULL DEFAULT true,
  deactivation_reason  text,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organization_id, scheme_version_id)
);

-- ---------------------------------------------------------------------------
-- certification_requirement_applicability
-- Overrides: which requirements apply to a given organization (and why not).
-- By default ALL requirements in an enrolled scheme version apply.
-- This table stores explicit exclusions and waivers.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_requirement_applicability (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL,
  requirement_id   uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE CASCADE,

  is_applicable    boolean     NOT NULL DEFAULT true,

  -- If not applicable: why?
  exclusion_reason text        CHECK (exclusion_reason IN (
                     'scope_mismatch',      -- Org scope doesn't match (e.g. req is farm-level only)
                     'not_enrolled',        -- Org not enrolled in the scheme
                     'formally_waived',     -- Auditor-granted waiver
                     'regulatory_exemption' -- Legal exemption applies
                   )),
  waiver_justification text,
  waived_by        uuid        REFERENCES auth.users(id),
  waived_at        timestamptz,
  waiver_expires_at date,

  -- Scope filter: requirement applies only to specific parcel/lot
  -- NULL = applies to all scope entities of the required scope_level
  scope_filter_id  uuid,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, requirement_id)
);

-- ---------------------------------------------------------------------------
-- certification_requirement_responses
-- Organization's self-assessment declaration for a requirement.
-- Per requirement per scope entity (e.g., per parcel for parcel-level requirements).
-- Offline-first: responses can be created offline and synced later.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_requirement_responses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL,
  requirement_id   uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE CASCADE,

  -- Scope: which entity does this response cover?
  scope_level      text        NOT NULL CHECK (scope_level IN ('organization','farm','parcel','lot')),
  scope_id         uuid        NOT NULL,

  -- Response content
  response_text    text,
  self_assessment  public.compliance_status NOT NULL DEFAULT 'not_started',

  -- Period this response covers
  period_start     date,
  period_end       date,

  -- Submission
  submitted_at     timestamptz,
  submitted_by     uuid        REFERENCES auth.users(id),

  -- Offline-first
  is_offline_created boolean   NOT NULL DEFAULT false,
  offline_device_id  text,
  synced_at          timestamptz,
  sync_conflict      boolean   NOT NULL DEFAULT false,  -- Set by sync engine on conflict
  conflict_details   jsonb     DEFAULT '{}',            -- Conflict metadata for resolution

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organization_id, requirement_id, scope_level, scope_id)
);

-- ---------------------------------------------------------------------------
-- certification_requirement_evaluations
-- The computed, deterministic compliance state for a requirement.
-- This is the OUTPUT of the compliance engine — NOT user input.
-- Re-computed whenever evidence, responses, or audit checks change.
-- Versioned: each re-evaluation increments evaluation_version.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_requirement_evaluations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL,
  requirement_id       uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE CASCADE,
  response_id          uuid        REFERENCES public.certification_requirement_responses(id),

  -- Scope: which entity is being evaluated?
  scope_level          text        NOT NULL CHECK (scope_level IN ('organization','farm','parcel','lot')),
  scope_id             uuid        NOT NULL,

  -- Computed compliance state
  compliance_status    public.compliance_status NOT NULL DEFAULT 'not_started',
  score                numeric(5,2),               -- Weighted compliance score 0-100

  -- Evidence summary
  evidence_count       integer     NOT NULL DEFAULT 0,
  primary_evidence_count integer   NOT NULL DEFAULT 0,
  missing_evidence     text[]      NOT NULL DEFAULT '{}',     -- Human-readable list of gaps
  missing_evidence_ids uuid[]      NOT NULL DEFAULT '{}',     -- FK refs to evidence_type_definitions

  -- Blocking summary
  blocking_issues      text[]      NOT NULL DEFAULT '{}',     -- Descriptions of zero-tolerance issues
  has_zero_tolerance_violation boolean NOT NULL DEFAULT false,

  -- Corrective actions
  open_ca_count        integer     NOT NULL DEFAULT 0,
  overdue_ca_count     integer     NOT NULL DEFAULT 0,

  -- Engine metadata
  evaluated_at         timestamptz NOT NULL DEFAULT now(),
  evaluated_by         uuid        REFERENCES auth.users(id),  -- NULL = automated engine
  engine_version       text        NOT NULL DEFAULT '1.0.0',
  evaluation_version   integer     NOT NULL DEFAULT 1,

  -- Cryptographic integrity
  blockchain_anchor_id uuid,       -- FK to blockchain_anchors (after anchoring)

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- One current evaluation per (org, requirement, scope)
  UNIQUE (organization_id, requirement_id, scope_level, scope_id)
);

-- ---------------------------------------------------------------------------
-- certification_scheme_readiness_snapshots
-- Point-in-time snapshot of overall scheme compliance for a organization.
-- Generated daily or on-demand. Used for dashboards and audit reports.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_scheme_readiness_snapshots (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL,
  org_scheme_id        uuid        NOT NULL REFERENCES public.organization_certification_schemes(id) ON DELETE CASCADE,

  snapshot_date        date        NOT NULL DEFAULT CURRENT_DATE,

  -- Counts by status
  total_requirements   integer     NOT NULL DEFAULT 0,
  compliant_count      integer     NOT NULL DEFAULT 0,
  non_compliant_count  integer     NOT NULL DEFAULT 0,
  blocked_count        integer     NOT NULL DEFAULT 0,
  in_progress_count    integer     NOT NULL DEFAULT 0,
  not_started_count    integer     NOT NULL DEFAULT 0,
  waived_count         integer     NOT NULL DEFAULT 0,
  not_applicable_count integer     NOT NULL DEFAULT 0,

  -- Weighted score
  compliance_score     numeric(5,2) NOT NULL DEFAULT 0,
  audit_readiness_pct  numeric(5,2) NOT NULL DEFAULT 0,

  -- Blocking condition
  is_blocked           boolean     NOT NULL DEFAULT false,
  blocking_reasons     text[]      NOT NULL DEFAULT '{}',

  -- Cross-scheme reuse stats
  reused_evidence_count integer    NOT NULL DEFAULT 0,
  inferred_compliant_count integer NOT NULL DEFAULT 0,

  created_at           timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organization_id, org_scheme_id, snapshot_date)
);
