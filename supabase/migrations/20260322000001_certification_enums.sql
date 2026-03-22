-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 1: ENUMS
-- Migration: 20260322000001
-- =============================================================================
-- Idempotent: uses DO $$ ... $$ blocks to avoid re-creating existing types.

-- ---------------------------------------------------------------------------
-- scheme_type: Classification layer of the certification
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.scheme_type AS ENUM (
    'eudr',        -- EU Deforestation Regulation (regulatory, non-voluntary)
    'vss',         -- Voluntary Sustainability Standard (RA, Fairtrade, UTZ, etc.)
    'corporate',   -- Corporate scheme (Nespresso AAA, Starbucks C.A.F.E., etc.)
    'national',    -- National certification (e.g. CAFE practices national variant)
    'internal'     -- Internal quality or traceability standard
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- requirement_severity: Blocking level of a non-compliance finding
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.requirement_severity AS ENUM (
    'zero_tolerance',  -- Immediate disqualification — no grace period
    'major',           -- Must be resolved before certification is granted/renewed
    'minor',           -- Must be resolved within agreed timeframe
    'improvement'      -- Advisory only — does not block certification
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- audit_logic_type: How compliance for a requirement is determined
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.audit_logic_type AS ENUM (
    'geospatial_validation',   -- Parcel polygon vs. deforestation / protected area layers
    'mass_balance',            -- Volume received == volume processed + sold + stock delta
    'plausibility',            -- Yield declared vs. biological ceiling (Nova Yield)
    'financial_traceability',  -- Payment chain: coop → farmer, price premium, min. price
    'labor_traceback',         -- Worker identity, contracts, wages, child/forced labor
    'document_review',         -- Manual document verification (certificates, permits)
    'sampling',                -- Statistical sampling of physical lots
    'interview'                -- Stakeholder / farmer interview protocol
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- compliance_status: Evaluation outcome for a requirement or scheme
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.compliance_status AS ENUM (
    'not_started',    -- No assessment begun
    'in_progress',    -- Evidence being collected / review underway
    'compliant',      -- Requirement met with acceptable evidence
    'non_compliant',  -- Requirement not met
    'waived',         -- Formally waived with documented justification
    'not_applicable', -- Requirement does not apply to this scope
    'blocked'         -- Zero-tolerance violation — blocks entire certification
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- evidence_type: Category of evidence object
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.evidence_type AS ENUM (
    'geospatial',      -- GPS coords, polygon files, satellite imagery, EUDR geo-data
    'financial',       -- Payment receipts, price premiums, bank statements
    'labor',           -- Worker contracts, payroll records, safety training certs
    'agronomic',       -- Field visit reports, yield data, input use records
    'legal',           -- Land titles, corporate permits, regulatory filings
    'environmental',   -- Deforestation analysis, biodiversity assessments
    'social',          -- Community agreements, grievance records, gender policies
    'organizational'   -- Org charts, governance docs, internal policies
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- evidence_lifecycle_status: Stage of an evidence object in its lifecycle
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.evidence_lifecycle_status AS ENUM (
    'draft',            -- Created but not submitted for review
    'submitted',        -- Submitted and awaiting review
    'under_review',     -- Actively being reviewed by auditor
    'approved',         -- Accepted as valid evidence
    'rejected',         -- Rejected — reason stored in rejection_reason
    'expired',          -- Past validity window (max_age_days exceeded)
    'superseded'        -- Replaced by a newer evidence record
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- corrective_action_status: Lifecycle of a corrective action
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.corrective_action_status AS ENUM (
    'open',                 -- Raised, not yet addressed
    'in_progress',          -- Action plan underway
    'pending_verification', -- Resolved by org, awaiting auditor verification
    'closed',               -- Verified and closed
    'overdue',              -- Past due_date without resolution
    'waived'                -- Formally waived with written justification
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- audit_result: Outcome of a deterministic audit check
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.audit_result AS ENUM (
    'pass',           -- Check passed within acceptable thresholds
    'fail',           -- Check failed — triggers corrective action
    'warning',        -- Borderline — flag for human review
    'inconclusive',   -- Insufficient data to determine result
    'not_run'         -- Check has not been executed yet
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- blockchain_chain: Target chain for cryptographic anchoring
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.blockchain_chain AS ENUM (
    'internal',         -- Internal SHA-256 hash log (no external chain)
    'polygon_mainnet',  -- Polygon PoS mainnet
    'ethereum_mainnet', -- Ethereum mainnet
    'hyperledger'       -- Permissioned Hyperledger Fabric ledger
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
