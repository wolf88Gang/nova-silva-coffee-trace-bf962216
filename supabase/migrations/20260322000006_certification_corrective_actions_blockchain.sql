-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTIONS 6 & 7: CORRECTIVE ACTIONS + BLOCKCHAIN ANCHORS
-- Migration: 20260322000006
-- Depends on: 20260322000001–20260322000005
-- =============================================================================

-- ===========================================================================
-- SECTION 6: CORRECTIVE ACTIONS ENGINE
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- certification_corrective_actions
-- Raised when: compliance engine detects non-compliant or blocked status.
-- Severity = zero_tolerance → is_blocking = true → prevents certification.
-- Lifecycle: open → in_progress → pending_verification → closed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_corrective_actions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL,
  requirement_id       uuid        NOT NULL REFERENCES public.certification_requirements(id) ON DELETE RESTRICT,
  evaluation_id        uuid        REFERENCES public.certification_requirement_evaluations(id),

  -- Scope of the non-compliance
  scope_level          text        NOT NULL CHECK (scope_level IN ('organization','farm','parcel','lot')),
  scope_id             uuid        NOT NULL,

  -- Classification
  severity             public.requirement_severity NOT NULL,
  is_blocking          boolean     NOT NULL DEFAULT false,   -- true for zero_tolerance
  status               public.corrective_action_status NOT NULL DEFAULT 'open',

  -- Content
  title                text        NOT NULL,
  description          text        NOT NULL,
  root_cause           text,       -- Root cause analysis (populated by org or auditor)
  action_plan          text,       -- Corrective action plan description

  -- Audit references
  audit_finding_ref    text,       -- External auditor finding reference code
  scheme_version_id    uuid        REFERENCES public.certification_scheme_versions(id),

  -- Timeline
  due_date             date,
  days_to_resolve      integer     GENERATED ALWAYS AS (
                         CASE WHEN due_date IS NOT NULL
                         THEN (due_date - CURRENT_DATE)::integer
                         ELSE NULL END
                       ) STORED,

  -- Resolution
  resolution_description text,
  closed_at            timestamptz,
  closed_by            uuid        REFERENCES auth.users(id),

  -- Verification
  verified_at          timestamptz,
  verified_by          uuid        REFERENCES auth.users(id),
  verification_notes   text,
  verification_evidence_id uuid    REFERENCES public.certification_evidence_records(id),

  -- Waiver
  waiver_justification text,
  waived_at            timestamptz,
  waived_by            uuid        REFERENCES auth.users(id),

  -- Escalation
  escalated            boolean     NOT NULL DEFAULT false,
  escalated_at         timestamptz,
  escalation_reason    text,

  -- Audit trail
  created_by           uuid        REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- A blocking CA must have is_blocking = true when severity = zero_tolerance
  CONSTRAINT chk_ca_blocking_consistency CHECK (
    severity <> 'zero_tolerance' OR is_blocking = true
  ),
  -- Cannot be both closed and overdue
  CONSTRAINT chk_ca_status_consistency CHECK (
    status <> 'closed' OR closed_at IS NOT NULL
  )
);

-- ---------------------------------------------------------------------------
-- certification_tasks
-- Granular action items assigned to team members to resolve a corrective action.
-- Multiple tasks can belong to one corrective action.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_tasks (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        uuid        NOT NULL,
  corrective_action_id   uuid        NOT NULL REFERENCES public.certification_corrective_actions(id) ON DELETE CASCADE,

  -- Task details
  title                  text        NOT NULL,
  description            text,
  category               text        CHECK (category IN (
                           'data_collection', 'field_visit', 'document_upload',
                           'stakeholder_meeting', 'system_update', 'verification', 'other'
                         )),

  -- Assignment
  assigned_to            uuid        REFERENCES auth.users(id),
  assigned_at            timestamptz,

  -- Timeline
  due_date               date,
  priority               text        NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),

  -- Completion
  status                 text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  completed_at           timestamptz,
  completed_by           uuid        REFERENCES auth.users(id),
  completion_notes       text,

  -- Evidence produced by this task
  evidence_id            uuid        REFERENCES public.certification_evidence_records(id),

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_task_done_requires_completion CHECK (
    status <> 'done' OR completed_at IS NOT NULL
  )
);

-- ---------------------------------------------------------------------------
-- certification_ca_history
-- Append-only status change log for corrective actions.
-- Immutable audit trail of all transitions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certification_ca_history (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL,
  corrective_action_id uuid        NOT NULL REFERENCES public.certification_corrective_actions(id) ON DELETE CASCADE,
  from_status          public.corrective_action_status,
  to_status            public.corrective_action_status NOT NULL,
  changed_by           uuid        REFERENCES auth.users(id),
  change_reason        text,
  changed_at           timestamptz NOT NULL DEFAULT now()
  -- NO updated_at: append-only
);

-- ===========================================================================
-- SECTION 7: CRYPTOGRAPHIC LAYER (Blockchain Anchors)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- blockchain_anchors
-- APPEND-ONLY table. Records are NEVER updated or deleted.
-- Each row represents a cryptographic commitment of an entity's state
-- at a point in time.
-- Supported entity_types:
--   evidence_record    → certification_evidence_records
--   evaluation         → certification_requirement_evaluations
--   mass_balance       → certification_mass_balance_checks
--   geospatial         → certification_geospatial_validations
--   traceback          → certification_traceback_checks
--   plausibility       → certification_plausibility_checks
--   corrective_action  → certification_corrective_actions
--   scheme_snapshot    → certification_scheme_readiness_snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blockchain_anchors (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL,

  -- What is being anchored?
  entity_type      text        NOT NULL CHECK (entity_type IN (
                     'evidence_record', 'evaluation', 'mass_balance',
                     'geospatial', 'traceback', 'plausibility',
                     'corrective_action', 'scheme_snapshot'
                   )),
  entity_id        uuid        NOT NULL,

  -- Cryptographic commitment
  payload_hash     text        NOT NULL,    -- SHA-256 hex of the canonical JSON payload
  payload_version  integer     NOT NULL DEFAULT 1,
  canonical_json   text,                   -- The exact JSON that was hashed (for verification)

  -- Blockchain details
  anchor_chain     public.blockchain_chain NOT NULL DEFAULT 'internal',
  tx_hash          text,                   -- Blockchain transaction hash (external chains only)
  block_number     bigint,                 -- Block number (external chains only)
  block_timestamp  timestamptz,            -- Block timestamp from chain

  -- For internal anchoring: Merkle chain reference
  prev_anchor_id   uuid        REFERENCES public.blockchain_anchors(id),
  chain_hash       text,                   -- SHA-256(prev_chain_hash || payload_hash)

  -- Status
  is_verified      boolean     NOT NULL DEFAULT false,
  verified_at      timestamptz,
  verification_url text,       -- Explorer URL for external chains

  -- Immutable creation record
  anchored_at      timestamptz NOT NULL DEFAULT now(),
  anchored_by      uuid        REFERENCES auth.users(id)
  -- NO updated_at — this table is APPEND-ONLY
);

-- Prevent UPDATE and DELETE on blockchain_anchors (immutability enforcement)
CREATE OR REPLACE RULE blockchain_anchors_no_update AS
  ON UPDATE TO public.blockchain_anchors DO INSTEAD NOTHING;

CREATE OR REPLACE RULE blockchain_anchors_no_delete AS
  ON DELETE TO public.blockchain_anchors DO INSTEAD NOTHING;

-- ---------------------------------------------------------------------------
-- Add blockchain_anchor_id FK constraints AFTER anchor table is created
-- (Tables in migrations 3-5 reference blockchain_anchors but it was not yet created)
-- ---------------------------------------------------------------------------
ALTER TABLE public.certification_evidence_records
  ADD CONSTRAINT fk_evidence_blockchain
  FOREIGN KEY (blockchain_anchor_id) REFERENCES public.blockchain_anchors(id);

ALTER TABLE public.certification_requirement_evaluations
  ADD CONSTRAINT fk_evaluation_blockchain
  FOREIGN KEY (blockchain_anchor_id) REFERENCES public.blockchain_anchors(id);

ALTER TABLE public.certification_mass_balance_checks
  ADD CONSTRAINT fk_mb_blockchain
  FOREIGN KEY (blockchain_anchor_id) REFERENCES public.blockchain_anchors(id);

ALTER TABLE public.certification_plausibility_checks
  ADD CONSTRAINT fk_plaus_blockchain
  FOREIGN KEY (blockchain_anchor_id) REFERENCES public.blockchain_anchors(id);

ALTER TABLE public.certification_geospatial_validations
  ADD CONSTRAINT fk_geo_blockchain
  FOREIGN KEY (blockchain_anchor_id) REFERENCES public.blockchain_anchors(id);

ALTER TABLE public.certification_traceback_checks
  ADD CONSTRAINT fk_tb_blockchain
  FOREIGN KEY (blockchain_anchor_id) REFERENCES public.blockchain_anchors(id);
