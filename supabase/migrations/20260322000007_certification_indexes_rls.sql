-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTIONS 8 & 9: INDEXES + ROW LEVEL SECURITY
-- Migration: 20260322000007
-- Depends on: 20260322000001–20260322000006
-- =============================================================================

-- ===========================================================================
-- SECTION 8: INDEXES
-- Strategy: index every (organization_id + FK + status/date) combo used in
-- compliance engine queries. No speculative indexes.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Master tables (read-heavy, rarely written)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_schemes_layer        ON public.certification_schemes(layer_id);
CREATE INDEX IF NOT EXISTS idx_scheme_ver_scheme    ON public.certification_scheme_versions(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_ver_current   ON public.certification_scheme_versions(scheme_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_req_groups_version   ON public.certification_requirement_groups(scheme_version_id);
CREATE INDEX IF NOT EXISTS idx_req_groups_parent    ON public.certification_requirement_groups(parent_group_id);
CREATE INDEX IF NOT EXISTS idx_requirements_version ON public.certification_requirements(scheme_version_id);
CREATE INDEX IF NOT EXISTS idx_requirements_group   ON public.certification_requirements(group_id);
CREATE INDEX IF NOT EXISTS idx_requirements_parent  ON public.certification_requirements(parent_req_id);
CREATE INDEX IF NOT EXISTS idx_requirements_severity ON public.certification_requirements(severity);
CREATE INDEX IF NOT EXISTS idx_requirements_audit_logic ON public.certification_requirements(audit_logic_type);
-- Cross-scheme engine lookups
CREATE INDEX IF NOT EXISTS idx_overlaps_source      ON public.certification_requirement_overlaps(req_source_id);
CREATE INDEX IF NOT EXISTS idx_overlaps_target      ON public.certification_requirement_overlaps(req_target_id);
CREATE INDEX IF NOT EXISTS idx_overlaps_type        ON public.certification_requirement_overlaps(overlap_type);

-- ---------------------------------------------------------------------------
-- Evidence tables (high write volume, high read volume)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ev_records_org       ON public.certification_evidence_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_ev_records_type      ON public.certification_evidence_records(evidence_type);
CREATE INDEX IF NOT EXISTS idx_ev_records_scope     ON public.certification_evidence_records(scope_level, scope_id);
CREATE INDEX IF NOT EXISTS idx_ev_records_org_scope ON public.certification_evidence_records(organization_id, scope_level, scope_id);
CREATE INDEX IF NOT EXISTS idx_ev_records_status    ON public.certification_evidence_records(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_ev_records_org_status ON public.certification_evidence_records(organization_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_ev_records_collected  ON public.certification_evidence_records(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ev_records_anchor    ON public.certification_evidence_records(blockchain_anchor_id) WHERE blockchain_anchor_id IS NOT NULL;
-- Offline sync
CREATE INDEX IF NOT EXISTS idx_ev_records_offline   ON public.certification_evidence_records(organization_id, is_offline_created, synced_at) WHERE is_offline_created = true;

-- Evidence links — core cross-scheme reuse query
CREATE INDEX IF NOT EXISTS idx_ev_links_org         ON public.certification_evidence_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_ev_links_evidence    ON public.certification_evidence_links(evidence_id);
CREATE INDEX IF NOT EXISTS idx_ev_links_requirement ON public.certification_evidence_links(requirement_id);
CREATE INDEX IF NOT EXISTS idx_ev_links_org_req     ON public.certification_evidence_links(organization_id, requirement_id);

-- Evidence validations
CREATE INDEX IF NOT EXISTS idx_ev_validations_org   ON public.certification_evidence_validations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ev_validations_ev    ON public.certification_evidence_validations(evidence_id);
CREATE INDEX IF NOT EXISTS idx_ev_validations_result ON public.certification_evidence_validations(result);

-- ---------------------------------------------------------------------------
-- Tenant tables (most performance-critical — used in all dashboard queries)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_org_cert_profiles_org ON public.organization_certification_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_schemes_org       ON public.organization_certification_schemes(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_schemes_version   ON public.organization_certification_schemes(scheme_version_id);
CREATE INDEX IF NOT EXISTS idx_org_schemes_status    ON public.organization_certification_schemes(organization_id, compliance_status);
CREATE INDEX IF NOT EXISTS idx_org_schemes_active    ON public.organization_certification_schemes(organization_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_req_applicability_org  ON public.certification_requirement_applicability(organization_id);
CREATE INDEX IF NOT EXISTS idx_req_applicability_req  ON public.certification_requirement_applicability(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_applicability_applicable ON public.certification_requirement_applicability(organization_id, is_applicable);

CREATE INDEX IF NOT EXISTS idx_req_responses_org     ON public.certification_requirement_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_req_responses_req     ON public.certification_requirement_responses(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_responses_scope   ON public.certification_requirement_responses(scope_level, scope_id);
CREATE INDEX IF NOT EXISTS idx_req_responses_offline ON public.certification_requirement_responses(organization_id, synced_at) WHERE is_offline_created = true;

-- Evaluations — queried heavily by dashboard and audit engine
CREATE INDEX IF NOT EXISTS idx_evaluations_org       ON public.certification_requirement_evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_req       ON public.certification_requirement_evaluations(requirement_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_scope     ON public.certification_requirement_evaluations(scope_level, scope_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_org_status ON public.certification_requirement_evaluations(organization_id, compliance_status);
CREATE INDEX IF NOT EXISTS idx_evaluations_blocked   ON public.certification_requirement_evaluations(organization_id) WHERE has_zero_tolerance_violation = true;
CREATE INDEX IF NOT EXISTS idx_evaluations_org_scope ON public.certification_requirement_evaluations(organization_id, scope_level, scope_id);

-- Readiness snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_org_date   ON public.certification_scheme_readiness_snapshots(organization_id, snapshot_date DESC);

-- ---------------------------------------------------------------------------
-- Audit tables
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_mb_checks_org        ON public.certification_mass_balance_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_mb_checks_lot        ON public.certification_mass_balance_checks(lot_id) WHERE lot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mb_checks_period     ON public.certification_mass_balance_checks(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_mb_checks_result     ON public.certification_mass_balance_checks(result);

CREATE INDEX IF NOT EXISTS idx_plaus_org            ON public.certification_plausibility_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_plaus_parcel         ON public.certification_plausibility_checks(parcel_id);
CREATE INDEX IF NOT EXISTS idx_plaus_result         ON public.certification_plausibility_checks(result);

CREATE INDEX IF NOT EXISTS idx_geo_org              ON public.certification_geospatial_validations(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_parcel           ON public.certification_geospatial_validations(parcel_id);
CREATE INDEX IF NOT EXISTS idx_geo_deforestation    ON public.certification_geospatial_validations(organization_id, deforestation_alert) WHERE deforestation_alert = true;
CREATE INDEX IF NOT EXISTS idx_geo_result           ON public.certification_geospatial_validations(result);
CREATE INDEX IF NOT EXISTS idx_geo_false_positive   ON public.certification_geospatial_validations(false_positive_flag) WHERE false_positive_flag = true;

CREATE INDEX IF NOT EXISTS idx_tb_org               ON public.certification_traceback_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tb_type              ON public.certification_traceback_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_tb_child_labor       ON public.certification_traceback_checks(organization_id) WHERE child_labor_detected = true;
CREATE INDEX IF NOT EXISTS idx_tb_forced_labor      ON public.certification_traceback_checks(organization_id) WHERE forced_labor_detected = true;
CREATE INDEX IF NOT EXISTS idx_tb_result            ON public.certification_traceback_checks(result);

-- ---------------------------------------------------------------------------
-- Corrective actions
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ca_org               ON public.certification_corrective_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ca_requirement       ON public.certification_corrective_actions(requirement_id);
CREATE INDEX IF NOT EXISTS idx_ca_scope             ON public.certification_corrective_actions(scope_level, scope_id);
CREATE INDEX IF NOT EXISTS idx_ca_status            ON public.certification_corrective_actions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ca_blocking          ON public.certification_corrective_actions(organization_id, is_blocking) WHERE is_blocking = true;
CREATE INDEX IF NOT EXISTS idx_ca_overdue           ON public.certification_corrective_actions(organization_id, due_date) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_ca_severity          ON public.certification_corrective_actions(organization_id, severity);

CREATE INDEX IF NOT EXISTS idx_tasks_org            ON public.certification_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_ca             ON public.certification_tasks(corrective_action_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned       ON public.certification_tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON public.certification_tasks(status);

-- ---------------------------------------------------------------------------
-- Blockchain anchors
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_anchors_org          ON public.blockchain_anchors(organization_id);
CREATE INDEX IF NOT EXISTS idx_anchors_entity       ON public.blockchain_anchors(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_anchors_payload_hash ON public.blockchain_anchors(payload_hash);
CREATE INDEX IF NOT EXISTS idx_anchors_tx_hash      ON public.blockchain_anchors(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anchors_chain        ON public.blockchain_anchors(anchor_chain, anchored_at DESC);

-- ===========================================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS)
-- Strategy: ALL tables use organization_id isolation.
-- Exceptions:
--   - Master tables (layers, schemes, requirements): readable by all authenticated users, writable only by service_role.
--   - blockchain_anchors: readable by org members, NEVER writable by clients (service_role only).
-- Helper function: get_current_user_org_id() must exist in the auth schema
-- or use (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()).
-- We use a JWT claim 'organization_id' for performance (set by auth hooks).
-- ===========================================================================

-- Helper: extract organization_id from JWT app_metadata claim
CREATE OR REPLACE FUNCTION public.cert_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid,
    (auth.jwt() ->> 'organization_id')::uuid
  );
$$;

-- Helper: check if current user has a given role in their org
CREATE OR REPLACE FUNCTION public.cert_user_has_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.auth_user_id = auth.uid()
      AND u.organization_id = public.cert_user_org_id()
      AND u.rol = p_role
      AND u.activo = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on all certification tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.certification_evidence_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_evidence_links             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_evidence_validations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_evidence_versions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_certification_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_certification_schemes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_requirement_applicability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_requirement_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_requirement_evaluations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_scheme_readiness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_mass_balance_checks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_plausibility_checks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_geospatial_validations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_traceback_checks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_corrective_actions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_tasks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_ca_history                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_anchors                       ENABLE ROW LEVEL SECURITY;

-- Master tables: no RLS (global reference data, all authenticated users can read)
-- certification_layers, certification_schemes, certification_scheme_versions,
-- certification_requirement_groups, certification_requirements,
-- certification_requirement_overlaps, certification_evidence_type_definitions,
-- certification_requirement_evidence_types are NOT row-restricted.

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Evidence Records
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_ev_records_org_select" ON public.certification_evidence_records
  FOR SELECT USING (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ev_records_org_insert" ON public.certification_evidence_records
  FOR INSERT WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ev_records_org_update" ON public.certification_evidence_records
  FOR UPDATE USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());
-- No DELETE policy — evidence records are logically deleted via lifecycle_status

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Evidence Links
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_ev_links_org_select" ON public.certification_evidence_links
  FOR SELECT USING (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ev_links_org_insert" ON public.certification_evidence_links
  FOR INSERT WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ev_links_org_update" ON public.certification_evidence_links
  FOR UPDATE USING (organization_id = public.cert_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Evidence Validations
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_ev_validations_org_select" ON public.certification_evidence_validations
  FOR SELECT USING (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ev_validations_org_insert" ON public.certification_evidence_validations
  FOR INSERT WITH CHECK (organization_id = public.cert_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Org Profiles & Schemes
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_org_profile_select" ON public.organization_certification_profiles
  FOR SELECT USING (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_org_profile_upsert" ON public.organization_certification_profiles
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_org_schemes_select" ON public.organization_certification_schemes
  FOR SELECT USING (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_org_schemes_upsert" ON public.organization_certification_schemes
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Requirement Applicability, Responses, Evaluations
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_req_applicability_org" ON public.certification_requirement_applicability
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_req_responses_org" ON public.certification_requirement_responses
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_req_evaluations_org_select" ON public.certification_requirement_evaluations
  FOR SELECT USING (organization_id = public.cert_user_org_id());
-- Evaluations are written by service_role only (engine output) — no client INSERT/UPDATE

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Audit Tables
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_mb_checks_org" ON public.certification_mass_balance_checks
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_plaus_checks_org" ON public.certification_plausibility_checks
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_geo_validations_org" ON public.certification_geospatial_validations
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_tb_checks_org" ON public.certification_traceback_checks
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Corrective Actions & Tasks
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_ca_org_select" ON public.certification_corrective_actions
  FOR SELECT USING (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ca_org_insert" ON public.certification_corrective_actions
  FOR INSERT WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ca_org_update" ON public.certification_corrective_actions
  FOR UPDATE USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_tasks_org" ON public.certification_tasks
  FOR ALL USING (organization_id = public.cert_user_org_id())
  WITH CHECK (organization_id = public.cert_user_org_id());

CREATE POLICY "cert_ca_history_org_select" ON public.certification_ca_history
  FOR SELECT USING (organization_id = public.cert_user_org_id());
-- CA history INSERT is via service_role only (triggered by CA status changes)

-- ---------------------------------------------------------------------------
-- RLS POLICIES: Blockchain Anchors
-- SELECT: org members can read their anchors
-- INSERT/UPDATE/DELETE: service_role ONLY (client cannot write anchors directly)
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_anchors_org_select" ON public.blockchain_anchors
  FOR SELECT USING (organization_id = public.cert_user_org_id());
-- No INSERT/UPDATE/DELETE policy for anon/authenticated roles
-- The append-only rules (created in migration 006) also prevent updates/deletes

-- ---------------------------------------------------------------------------
-- Readiness snapshots
-- ---------------------------------------------------------------------------
CREATE POLICY "cert_snapshots_org_select" ON public.certification_scheme_readiness_snapshots
  FOR SELECT USING (organization_id = public.cert_user_org_id());
