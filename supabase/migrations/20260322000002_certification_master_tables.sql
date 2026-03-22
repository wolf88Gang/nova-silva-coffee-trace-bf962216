-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 2: MASTER / REFERENCE TABLES
-- Migration: 20260322000002
-- Depends on: 20260322000001 (enums)
-- =============================================================================
-- These tables are global (not per-organization). They define the certification
-- ontology: layers → schemes → versions → requirement_groups → requirements.
-- Cross-scheme overlap mapping and evidence type definitions are also here.

-- ---------------------------------------------------------------------------
-- certification_layers
-- Top-level classification: EUDR (regulatory), VSS (voluntary), Corporate
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_layers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text        NOT NULL UNIQUE,            -- 'eudr', 'vss', 'corporate'
  name          text        NOT NULL,                   -- Display name
  description   text,
  layer_type    public.scheme_type NOT NULL,
  is_regulatory boolean     NOT NULL DEFAULT false,     -- true = legal obligation (EUDR)
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Seed canonical layers
INSERT INTO public.certification_layers (code, name, description, layer_type, is_regulatory, sort_order)
VALUES
  ('eudr',      'EU Deforestation Regulation',          'Mandatory regulatory requirement for EU market access. Cutoff date: 31-Dec-2020.',
   'eudr',      true,  10),
  ('vss',       'Voluntary Sustainability Standards',    'Rainforest Alliance, Fairtrade, UTZ, CAFE Practices, ESENCIAL, etc.',
   'vss',       false, 20),
  ('corporate', 'Corporate Schemes',                    'Nespresso AAA, Starbucks C.A.F.E. Practices, JDE Responsible Sourcing, etc.',
   'corporate', false, 30),
  ('national',  'National Certifications',              'Country-specific programs and national variants of VSS.',
   'national',  false, 40),
  ('internal',  'Internal Standards',                   'Organization-defined quality and traceability requirements.',
   'internal',  false, 50)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- certification_schemes
-- Named standards within a layer (e.g. Rainforest Alliance 2020)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_schemes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id     uuid        NOT NULL REFERENCES public.certification_layers(id) ON DELETE RESTRICT,
  code         text        NOT NULL UNIQUE,   -- 'rainforest_alliance', 'fairtrade', 'eudr_2023'
  name         text        NOT NULL,
  short_name   text,
  issuing_body text,                          -- e.g. 'Rainforest Alliance', 'FLO-CERT'
  website_url  text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- certification_scheme_versions
-- Versioned snapshots of a scheme (e.g. RA 2020 v1.2, Fairtrade 2019)
-- Requirements are always tied to a version, never to the scheme directly.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_scheme_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id       uuid        NOT NULL REFERENCES public.certification_schemes(id) ON DELETE RESTRICT,
  version_code    text        NOT NULL,      -- '2020-v1', '2024-v1.2'
  version_name    text        NOT NULL,
  effective_from  date        NOT NULL,
  effective_until date,                      -- NULL = currently active
  is_current      boolean     NOT NULL DEFAULT false,
  changelog_url   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scheme_id, version_code)
);

-- Enforce single current version per scheme
CREATE UNIQUE INDEX IF NOT EXISTS uidx_scheme_version_current
  ON public.certification_scheme_versions (scheme_id)
  WHERE is_current = true;

-- ---------------------------------------------------------------------------
-- certification_requirement_groups
-- Hierarchical grouping: Principle → Criterion → Indicator (self-referencing)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_requirement_groups (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_version_id uuid        NOT NULL REFERENCES public.certification_scheme_versions(id) ON DELETE CASCADE,
  parent_group_id   uuid        REFERENCES public.certification_requirement_groups(id) ON DELETE CASCADE,
  code              text        NOT NULL,    -- e.g. 'P1', 'C1.1', 'I1.1.1'
  name              text        NOT NULL,
  description       text,
  sort_order        integer     NOT NULL DEFAULT 0,
  depth_level       integer     NOT NULL DEFAULT 1,  -- 1=Principle, 2=Criterion, 3=Indicator
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scheme_version_id, code)
);

-- ---------------------------------------------------------------------------
-- certification_requirements
-- Atomic, evaluable requirements — the core certification ontology object.
-- Each requirement:
--   - belongs to exactly one scheme version
--   - has one audit_logic_type (determines how compliance is checked)
--   - has one severity (determines blocking behavior)
--   - defines scope (org / farm / parcel / lot)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_requirements (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_version_id    uuid        NOT NULL REFERENCES public.certification_scheme_versions(id) ON DELETE CASCADE,
  group_id             uuid        NOT NULL REFERENCES public.certification_requirement_groups(id) ON DELETE RESTRICT,
  parent_req_id        uuid        REFERENCES public.certification_requirements(id) ON DELETE CASCADE,  -- Sub-requirements
  code                 text        NOT NULL,   -- e.g. 'RA2020-C1.1.1', 'EUDR-ART3-GEO'
  title                text        NOT NULL,
  description          text        NOT NULL,
  rationale            text,                   -- Why this requirement exists
  guidance             text,                   -- Auditor guidance notes
  severity             public.requirement_severity NOT NULL,
  audit_logic_type     public.audit_logic_type    NOT NULL,
  -- Scope flags: at which level is this evaluated?
  scope_organization   boolean     NOT NULL DEFAULT false,
  scope_farm           boolean     NOT NULL DEFAULT false,
  scope_parcel         boolean     NOT NULL DEFAULT true,
  scope_lot            boolean     NOT NULL DEFAULT false,
  -- Blocking behavior
  is_mandatory         boolean     NOT NULL DEFAULT true,
  blocks_certification boolean     NOT NULL DEFAULT false,  -- true for zero_tolerance
  -- Integration hints
  nova_yield_required  boolean     NOT NULL DEFAULT false,  -- triggers Nova Yield check
  nova_guard_required  boolean     NOT NULL DEFAULT false,  -- triggers Nova Guard signal
  labor_ops_required   boolean     NOT NULL DEFAULT false,  -- triggers LaborOps check
  eudr_article_ref     text,        -- e.g. 'Article 3(a)', 'Article 9'
  sort_order           integer     NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scheme_version_id, code)
);

-- Ensure blocks_certification is always true for zero_tolerance
ALTER TABLE public.certification_requirements
  ADD CONSTRAINT chk_zero_tolerance_blocks
  CHECK (severity <> 'zero_tolerance' OR blocks_certification = true);

-- ---------------------------------------------------------------------------
-- certification_requirement_overlaps
-- Cross-scheme equivalence mapping: which requirements across schemes cover
-- the same topic, allowing evidence reuse and effort deduplication.
-- overlap_type:
--   equivalent  → 100% overlap, evidence fully reusable
--   partial     → Partial overlap, evidence partially reusable (coverage_pct)
--   supersedes  → Target is stricter; meeting target implies meeting source
--   infers      → Source compliance creates a probabilistic signal for target
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_requirement_overlaps (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  req_source_id   uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE CASCADE,
  req_target_id   uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE CASCADE,
  overlap_type    text        NOT NULL CHECK (overlap_type IN ('equivalent','partial','supersedes','infers')),
  coverage_pct    numeric(5,2) NOT NULL DEFAULT 100 CHECK (coverage_pct BETWEEN 0 AND 100),
  inference_rule  text,   -- Human-readable rule: 'ESENCIAL compliant → Fairtrade C1.2.1 waived'
  inference_logic text,   -- Machine rule expression (future: evaluated by cross-scheme engine)
  notes           text,
  created_by      uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (req_source_id, req_target_id),
  -- Prevent self-reference
  CHECK (req_source_id <> req_target_id)
);

-- ---------------------------------------------------------------------------
-- certification_evidence_type_definitions
-- Master registry of accepted evidence forms per requirement type.
-- Defines: accepted formats, max age, signature requirements.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_evidence_type_definitions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text        NOT NULL UNIQUE,  -- 'eudr_polygon_geojson', 'fairtrade_payment_receipt'
  name                text        NOT NULL,
  evidence_type       public.evidence_type NOT NULL,
  description         text,
  accepted_formats    text[]      NOT NULL DEFAULT '{}',  -- ['pdf','jpg','geojson','kml','xlsx']
  max_age_days        integer,                            -- NULL = never expires
  requires_signature  boolean     NOT NULL DEFAULT false, -- Digital or wet signature required
  requires_witness    boolean     NOT NULL DEFAULT false, -- Third-party witness required
  requires_notary     boolean     NOT NULL DEFAULT false,
  is_geo_tagged       boolean     NOT NULL DEFAULT false, -- Must carry GPS coordinates
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- certification_requirement_evidence_types
-- Many-to-many: which evidence types are accepted for which requirements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_requirement_evidence_types (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id        uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE CASCADE,
  evidence_type_def_id  uuid        NOT NULL REFERENCES public.certification_evidence_type_definitions(id) ON DELETE CASCADE,
  is_primary            boolean     NOT NULL DEFAULT false,  -- Primary vs supporting evidence
  is_sufficient_alone   boolean     NOT NULL DEFAULT false,  -- Can this evidence alone satisfy the req?
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requirement_id, evidence_type_def_id)
);
