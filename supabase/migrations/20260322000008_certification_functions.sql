-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 10: POSTGRES FUNCTIONS (Deterministic Audit Logic)
-- Migration: 20260322000008
-- Depends on: 20260322000001–20260322000007
-- =============================================================================
-- ALL functions are SECURITY DEFINER + called by service_role or Edge Functions.
-- Core rule: NO AI-driven logic. Every computation is deterministic.

-- ===========================================================================
-- 1. MASS BALANCE CALCULATION
-- Evaluates volume reconciliation for a lot or period.
-- Returns: void (updates the record in place)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_run_mass_balance(
  p_check_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec   public.certification_mass_balance_checks%ROWTYPE;
  v_var_pct numeric(9,4);
  v_result  public.audit_result;
  v_reason  text;
BEGIN
  SELECT * INTO v_rec
  FROM public.certification_mass_balance_checks
  WHERE id = p_check_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mass_balance_check % not found', p_check_id;
  END IF;

  -- variance_kg is a GENERATED column; read it directly
  -- Compute variance_pct = variance_kg / received_volume_kg * 100
  IF v_rec.received_volume_kg = 0 THEN
    v_var_pct := 0;
  ELSE
    v_var_pct := ABS(v_rec.variance_kg / v_rec.received_volume_kg * 100);
  END IF;

  -- Determine result
  IF v_var_pct <= v_rec.tolerance_pct THEN
    v_result := 'pass';
    v_reason  := NULL;
  ELSIF v_var_pct <= v_rec.tolerance_pct * 1.5 THEN
    -- Within 150% of tolerance → warning
    v_result := 'warning';
    v_reason  := format('Variance %.2f%% exceeds tolerance %.2f%% but below critical threshold',
                        v_var_pct, v_rec.tolerance_pct);
  ELSE
    v_result := 'fail';
    v_reason  := format('Mass balance variance %.4f kg (%.2f%%) exceeds tolerance of %.2f%%',
                        ABS(v_rec.variance_kg), v_var_pct, v_rec.tolerance_pct);
  END IF;

  -- Update record
  UPDATE public.certification_mass_balance_checks
  SET
    variance_pct  = v_var_pct,
    result        = v_result,
    failure_reason = v_reason,
    calculated_at  = now()
  WHERE id = p_check_id;

  -- If FAIL: trigger corrective action (handled by caller / Edge Function)
  -- Log to evidence validations for the relevant lot evidence
END;
$$;

-- ===========================================================================
-- 2. YIELD PLAUSIBILITY CHECK
-- Compares declared yield against Nova Yield biological ceiling.
-- max_deviation_pct is scheme-defined (typically 30%).
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_run_plausibility_check(
  p_check_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec        public.certification_plausibility_checks%ROWTYPE;
  v_deviation  numeric(9,4);
  v_result     public.audit_result;
  v_reason     text;
BEGIN
  SELECT * INTO v_rec
  FROM public.certification_plausibility_checks
  WHERE id = p_check_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'plausibility_check % not found', p_check_id;
  END IF;

  -- Cannot evaluate without Nova Yield ceiling
  IF v_rec.nova_yield_ceiling_kg_ha IS NULL THEN
    UPDATE public.certification_plausibility_checks
    SET result = 'inconclusive',
        failure_reason = 'Nova Yield ceiling not available for this parcel/period'
    WHERE id = p_check_id;
    RETURN;
  END IF;

  -- Compute deviation percentage
  IF v_rec.nova_yield_ceiling_kg_ha = 0 THEN
    v_deviation := 0;
  ELSE
    v_deviation := (v_rec.declared_yield_kg_ha - v_rec.nova_yield_ceiling_kg_ha)
                   / v_rec.nova_yield_ceiling_kg_ha * 100;
  END IF;

  -- Evaluate result
  IF v_deviation <= 0 THEN
    -- Declared is below ceiling: always pass
    v_result := 'pass';
    v_reason  := NULL;
  ELSIF v_deviation <= v_rec.max_deviation_pct * 0.75 THEN
    -- Within 75% of max: pass with note
    v_result := 'pass';
    v_reason  := NULL;
  ELSIF v_deviation <= v_rec.max_deviation_pct THEN
    -- Within tolerance but high: warning
    v_result := 'warning';
    v_reason  := format('Declared yield %.2f kg/ha is %.1f%% above biological ceiling %.2f kg/ha',
                        v_rec.declared_yield_kg_ha, v_deviation, v_rec.nova_yield_ceiling_kg_ha);
  ELSE
    -- Exceeds max deviation: fail
    v_result := 'fail';
    v_reason  := format('Declared yield %.2f kg/ha exceeds biological ceiling %.2f kg/ha by %.1f%% (max allowed: %.1f%%)',
                        v_rec.declared_yield_kg_ha, v_rec.nova_yield_ceiling_kg_ha,
                        v_deviation, v_rec.max_deviation_pct);
  END IF;

  UPDATE public.certification_plausibility_checks
  SET
    deviation_pct  = v_deviation,
    result         = v_result,
    failure_reason = v_reason,
    calculated_at  = now()
  WHERE id = p_check_id;
END;
$$;

-- ===========================================================================
-- 3. GEOSPATIAL VALIDATION TRIGGER FUNCTION
-- Fired after INSERT/UPDATE on certification_geospatial_validations.
-- Evaluates: deforestation alert, area deviation, protected area overlap.
-- Zero-tolerance: deforestation_alert = true → result = 'fail', no override.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_evaluate_geospatial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failures  text[] := '{}';
  v_warnings  text[] := '{}';
  v_result    public.audit_result := 'pass';
BEGIN
  -- Rule 1 (ZERO TOLERANCE): Deforestation after EUDR cutoff date
  IF NEW.deforestation_alert = true AND NEW.false_positive_flag = false THEN
    v_result   := 'fail';
    v_failures := v_failures || format(
      'Deforestation detected post-%s (source: %s, area: %.4f ha, confidence: %.1f%%)',
      NEW.eudr_reference_date,
      COALESCE(NEW.alert_source, 'unknown'),
      COALESCE(NEW.alert_area_ha, 0),
      COALESCE(NEW.alert_confidence_pct, 0)
    );
  END IF;

  -- Rule 2: Overlap with protected areas
  IF NEW.overlap_protected_area = true THEN
    v_result   := 'fail';
    v_failures := v_failures || format(
      'Parcel overlaps protected area (%.4f ha)',
      COALESCE(NEW.overlap_area_ha, 0)
    );
  END IF;

  -- Rule 3: Overlap with indigenous territories
  IF NEW.overlap_indigenous = true THEN
    v_result   := 'fail';
    v_failures := v_failures || 'Parcel overlaps indigenous territory';
  END IF;

  -- Rule 4: Area deviation (declared vs. polygon-computed)
  IF NEW.area_deviation_pct IS NOT NULL AND ABS(NEW.area_deviation_pct) > 20 THEN
    IF ABS(NEW.area_deviation_pct) > 50 THEN
      v_result   := 'fail';
      v_failures := v_failures || format(
        'Area deviation %.1f%% exceeds critical threshold (±50%%)', NEW.area_deviation_pct
      );
    ELSE
      v_warnings := v_warnings || format(
        'Area deviation %.1f%% exceeds warning threshold (±20%%)', NEW.area_deviation_pct
      );
      IF v_result = 'pass' THEN v_result := 'warning'; END IF;
    END IF;
  END IF;

  -- Rule 5: GPS precision (Section I risk: GPS precision errors)
  IF NEW.gps_precision_m IS NOT NULL AND NEW.gps_precision_m > 30 THEN
    v_warnings := v_warnings || format(
      'GPS precision %.1fm exceeds recommended maximum (30m)', NEW.gps_precision_m
    );
    IF v_result = 'pass' THEN v_result := 'warning'; END IF;
  END IF;

  -- Resolve: if only a false positive was detected but flagged → warning
  IF NEW.deforestation_alert = true AND NEW.false_positive_flag = true THEN
    v_warnings := v_warnings || 'Deforestation alert flagged as false positive — pending manual verification';
    IF v_result = 'pass' THEN v_result := 'warning'; END IF;
  END IF;

  NEW.result         := v_result;
  NEW.failure_reasons := v_failures;
  NEW.warning_flags  := v_warnings;
  NEW.validated_at   := now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER cert_geospatial_eval_trigger
  BEFORE INSERT OR UPDATE ON public.certification_geospatial_validations
  FOR EACH ROW EXECUTE FUNCTION public.cert_evaluate_geospatial();

-- ===========================================================================
-- 4. COMPLIANCE STATUS COMPUTATION
-- Computes the compliance_status for a (org, requirement, scope) triplet.
-- Called by: Edge Function after evidence upload, response submission,
-- or audit check completion.
-- This is the CORE of the compliance engine — fully deterministic.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_compute_compliance_status(
  p_organization_id  uuid,
  p_requirement_id   uuid,
  p_scope_level      text,
  p_scope_id         uuid
)
RETURNS public.compliance_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req             public.certification_requirements%ROWTYPE;
  v_applicability   public.certification_requirement_applicability%ROWTYPE;
  v_response        public.certification_requirement_responses%ROWTYPE;
  v_evidence_count  integer := 0;
  v_primary_count   integer := 0;
  v_has_fail        boolean := false;
  v_has_block       boolean := false;
  v_status          public.compliance_status;

  -- Audit check results
  v_geo_result      public.audit_result;
  v_mb_result       public.audit_result;
  v_plaus_result    public.audit_result;
  v_tb_result       public.audit_result;
BEGIN
  -- Load requirement
  SELECT * INTO v_req FROM public.certification_requirements WHERE id = p_requirement_id;
  IF NOT FOUND THEN RETURN 'not_applicable'; END IF;

  -- Check applicability override
  SELECT * INTO v_applicability
  FROM public.certification_requirement_applicability
  WHERE organization_id = p_organization_id
    AND requirement_id  = p_requirement_id;

  IF FOUND AND v_applicability.is_applicable = false THEN
    RETURN 'not_applicable';
  END IF;

  -- Check for zero-tolerance violations from audit checks
  -- Geospatial (EUDR deforestation)
  IF v_req.audit_logic_type = 'geospatial_validation' THEN
    SELECT result INTO v_geo_result
    FROM public.certification_geospatial_validations
    WHERE organization_id = p_organization_id
      AND parcel_id       = p_scope_id
    ORDER BY created_at DESC LIMIT 1;

    IF v_geo_result = 'fail' THEN
      IF v_req.severity = 'zero_tolerance' THEN
        -- Update evaluation record with blocking status
        INSERT INTO public.certification_requirement_evaluations
          (organization_id, requirement_id, scope_level, scope_id,
           compliance_status, has_zero_tolerance_violation,
           blocking_issues, evaluated_at, engine_version)
        VALUES
          (p_organization_id, p_requirement_id, p_scope_level, p_scope_id,
           'blocked', true,
           ARRAY['Geospatial validation failed: deforestation or protected area overlap detected'],
           now(), '1.0.0')
        ON CONFLICT (organization_id, requirement_id, scope_level, scope_id)
        DO UPDATE SET
          compliance_status           = 'blocked',
          has_zero_tolerance_violation = true,
          blocking_issues             = ARRAY['Geospatial validation failed: deforestation or protected area overlap detected'],
          evaluated_at                = now(),
          evaluation_version          = certification_requirement_evaluations.evaluation_version + 1,
          updated_at                  = now();
        RETURN 'blocked';
      END IF;
      v_has_fail := true;
    END IF;
  END IF;

  -- Labor traceback — child/forced labor (always zero tolerance regardless of scheme)
  IF v_req.audit_logic_type = 'labor_traceback' THEN
    SELECT result INTO v_tb_result
    FROM public.certification_traceback_checks
    WHERE organization_id = p_organization_id
      AND check_type      = 'labor'
      AND (parcel_id = p_scope_id OR producer_id = p_scope_id)
    ORDER BY calculated_at DESC LIMIT 1;

    IF EXISTS (
      SELECT 1 FROM public.certification_traceback_checks
      WHERE organization_id = p_organization_id
        AND (child_labor_detected = true OR forced_labor_detected = true)
        AND (parcel_id = p_scope_id OR producer_id = p_scope_id)
      ORDER BY calculated_at DESC LIMIT 1
    ) THEN
      v_has_block := true;
    ELSIF v_tb_result = 'fail' THEN
      v_has_fail := true;
    END IF;
  END IF;

  -- Mass balance
  IF v_req.audit_logic_type = 'mass_balance' THEN
    SELECT result INTO v_mb_result
    FROM public.certification_mass_balance_checks
    WHERE organization_id = p_organization_id
      AND lot_id          = p_scope_id
    ORDER BY calculated_at DESC LIMIT 1;

    IF v_mb_result = 'fail' THEN v_has_fail := true; END IF;
  END IF;

  -- Plausibility
  IF v_req.audit_logic_type = 'plausibility' THEN
    SELECT result INTO v_plaus_result
    FROM public.certification_plausibility_checks
    WHERE organization_id = p_organization_id
      AND parcel_id       = p_scope_id
    ORDER BY calculated_at DESC LIMIT 1;

    IF v_plaus_result = 'fail' THEN v_has_fail := true; END IF;
  END IF;

  -- Count evidence records linked to this requirement
  SELECT
    COUNT(*) FILTER (WHERE el.link_type IN ('primary','supporting')),
    COUNT(*) FILTER (WHERE el.link_type = 'primary')
  INTO v_evidence_count, v_primary_count
  FROM public.certification_evidence_links el
  JOIN public.certification_evidence_records er ON er.id = el.evidence_id
  WHERE el.organization_id = p_organization_id
    AND el.requirement_id  = p_requirement_id
    AND er.scope_id        = p_scope_id
    AND er.lifecycle_status = 'approved';

  -- Load response
  SELECT * INTO v_response
  FROM public.certification_requirement_responses
  WHERE organization_id = p_organization_id
    AND requirement_id  = p_requirement_id
    AND scope_level     = p_scope_level
    AND scope_id        = p_scope_id;

  -- Determine final status
  IF v_has_block THEN
    v_status := 'blocked';
  ELSIF v_has_fail THEN
    v_status := 'non_compliant';
  ELSIF v_evidence_count > 0 AND v_primary_count > 0 THEN
    v_status := 'compliant';
  ELSIF v_evidence_count > 0 OR (FOUND AND v_response.self_assessment = 'in_progress') THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;

  -- Upsert evaluation record
  INSERT INTO public.certification_requirement_evaluations
    (organization_id, requirement_id, scope_level, scope_id,
     compliance_status, evidence_count, primary_evidence_count,
     has_zero_tolerance_violation, evaluated_at, engine_version)
  VALUES
    (p_organization_id, p_requirement_id, p_scope_level, p_scope_id,
     v_status, v_evidence_count, v_primary_count,
     v_has_block, now(), '1.0.0')
  ON CONFLICT (organization_id, requirement_id, scope_level, scope_id)
  DO UPDATE SET
    compliance_status           = v_status,
    evidence_count              = v_evidence_count,
    primary_evidence_count      = v_primary_count,
    has_zero_tolerance_violation = v_has_block,
    evaluated_at                = now(),
    evaluation_version          = certification_requirement_evaluations.evaluation_version + 1,
    updated_at                  = now();

  RETURN v_status;
END;
$$;

-- ===========================================================================
-- 5. SCHEME COMPLIANCE ROLLUP
-- Recomputes org_scheme summary counts from evaluations.
-- Called after any evaluation update.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_rollup_scheme_compliance(
  p_organization_id  uuid,
  p_org_scheme_id    uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scheme_version_id uuid;
  v_counts record;
  v_score  numeric(5,2);
  v_blocked boolean;
BEGIN
  SELECT scheme_version_id INTO v_scheme_version_id
  FROM public.organization_certification_schemes
  WHERE id = p_org_scheme_id;

  -- Aggregate evaluations for this org + scheme
  SELECT
    COUNT(*)                                                          AS total,
    COUNT(*) FILTER (WHERE compliance_status = 'compliant')           AS compliant,
    COUNT(*) FILTER (WHERE compliance_status = 'non_compliant')       AS non_compliant,
    COUNT(*) FILTER (WHERE compliance_status = 'blocked')             AS blocked,
    COUNT(*) FILTER (WHERE compliance_status = 'in_progress')         AS in_progress,
    COUNT(*) FILTER (WHERE compliance_status = 'not_started')         AS not_started,
    COUNT(*) FILTER (WHERE compliance_status = 'waived')              AS waived,
    COUNT(*) FILTER (WHERE compliance_status = 'not_applicable')      AS not_applicable
  INTO v_counts
  FROM public.certification_requirement_evaluations cre
  JOIN public.certification_requirements cr ON cr.id = cre.requirement_id
  WHERE cre.organization_id = p_organization_id
    AND cr.scheme_version_id = v_scheme_version_id;

  -- Weighted score: compliant / (total - not_applicable - waived) * 100
  IF (v_counts.total - v_counts.not_applicable - v_counts.waived) > 0 THEN
    v_score := (v_counts.compliant::numeric /
               (v_counts.total - v_counts.not_applicable - v_counts.waived)::numeric) * 100;
  ELSE
    v_score := 0;
  END IF;

  v_blocked := v_counts.blocked > 0;

  -- Update org scheme record
  UPDATE public.organization_certification_schemes
  SET
    total_requirements   = v_counts.total,
    compliant_count      = v_counts.compliant,
    non_compliant_count  = v_counts.non_compliant,
    blocked_count        = v_counts.blocked,
    in_progress_count    = v_counts.in_progress,
    not_applicable_count = v_counts.not_applicable,
    compliance_score     = v_score,
    compliance_status    = CASE
                             WHEN v_blocked                        THEN 'blocked'
                             WHEN v_counts.compliant = (v_counts.total - v_counts.not_applicable - v_counts.waived)
                               AND v_counts.total > 0             THEN 'compliant'
                             WHEN v_counts.in_progress > 0
                               OR v_counts.non_compliant > 0      THEN 'in_progress'
                             ELSE 'not_started'
                           END,
    updated_at           = now()
  WHERE id = p_org_scheme_id;

  -- Snapshot
  INSERT INTO public.certification_scheme_readiness_snapshots
    (organization_id, org_scheme_id, snapshot_date,
     total_requirements, compliant_count, non_compliant_count, blocked_count,
     in_progress_count, not_started_count, waived_count, not_applicable_count,
     compliance_score, is_blocked)
  VALUES
    (p_organization_id, p_org_scheme_id, CURRENT_DATE,
     v_counts.total, v_counts.compliant, v_counts.non_compliant, v_counts.blocked,
     v_counts.in_progress, v_counts.not_started, v_counts.waived, v_counts.not_applicable,
     v_score, v_blocked)
  ON CONFLICT (organization_id, org_scheme_id, snapshot_date)
  DO UPDATE SET
    total_requirements   = EXCLUDED.total_requirements,
    compliant_count      = EXCLUDED.compliant_count,
    non_compliant_count  = EXCLUDED.non_compliant_count,
    blocked_count        = EXCLUDED.blocked_count,
    in_progress_count    = EXCLUDED.in_progress_count,
    not_started_count    = EXCLUDED.not_started_count,
    waived_count         = EXCLUDED.waived_count,
    not_applicable_count = EXCLUDED.not_applicable_count,
    compliance_score     = EXCLUDED.compliance_score,
    is_blocked           = EXCLUDED.is_blocked;
END;
$$;

-- ===========================================================================
-- 6. BLOCKCHAIN ANCHOR FUNCTION
-- Creates an internal-chain anchor for any entity.
-- Computes: SHA-256(canonical_json), chain_hash = SHA-256(prev || current).
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_anchor_entity(
  p_organization_id uuid,
  p_entity_type     text,
  p_entity_id       uuid,
  p_canonical_json  text,
  p_anchored_by     uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_payload_hash text;
  v_prev_id      uuid;
  v_prev_chain   text;
  v_chain_hash   text;
  v_anchor_id    uuid;
BEGIN
  -- SHA-256 of the canonical JSON payload
  v_payload_hash := encode(digest(p_canonical_json, 'sha256'), 'hex');

  -- Find previous anchor in this org's chain (for Merkle chaining)
  SELECT id, chain_hash INTO v_prev_id, v_prev_chain
  FROM public.blockchain_anchors
  WHERE organization_id = p_organization_id
  ORDER BY anchored_at DESC
  LIMIT 1;

  -- Compute chain hash: SHA-256(prev_chain_hash || payload_hash)
  IF v_prev_chain IS NOT NULL THEN
    v_chain_hash := encode(digest(v_prev_chain || v_payload_hash, 'sha256'), 'hex');
  ELSE
    v_chain_hash := encode(digest('genesis' || v_payload_hash, 'sha256'), 'hex');
  END IF;

  INSERT INTO public.blockchain_anchors
    (organization_id, entity_type, entity_id,
     payload_hash, canonical_json, anchor_chain,
     prev_anchor_id, chain_hash, anchored_by)
  VALUES
    (p_organization_id, p_entity_type, p_entity_id,
     v_payload_hash, p_canonical_json, 'internal',
     v_prev_id, v_chain_hash, p_anchored_by)
  RETURNING id INTO v_anchor_id;

  RETURN v_anchor_id;
END;
$$;

-- ===========================================================================
-- 7. CORRECTIVE ACTION AUTO-CREATION
-- Trigger: after evaluation is set to non_compliant or blocked,
-- automatically creates a corrective action if none exists.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_auto_create_corrective_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req   public.certification_requirements%ROWTYPE;
  v_title text;
  v_due   date;
BEGIN
  -- Only act on non_compliant or blocked transitions
  IF NEW.compliance_status NOT IN ('non_compliant', 'blocked') THEN
    RETURN NEW;
  END IF;

  -- Skip if already non_compliant or blocked (no change)
  IF OLD.compliance_status = NEW.compliance_status THEN
    RETURN NEW;
  END IF;

  -- Load requirement
  SELECT * INTO v_req FROM public.certification_requirements WHERE id = NEW.requirement_id;

  -- Check if an open CA already exists for this evaluation scope
  IF EXISTS (
    SELECT 1 FROM public.certification_corrective_actions
    WHERE organization_id = NEW.organization_id
      AND requirement_id  = NEW.requirement_id
      AND scope_level     = NEW.scope_level
      AND scope_id        = NEW.scope_id
      AND status NOT IN ('closed', 'waived')
  ) THEN
    RETURN NEW;
  END IF;

  -- Determine due date based on severity
  v_due := CASE v_req.severity
    WHEN 'zero_tolerance' THEN CURRENT_DATE           -- Immediate
    WHEN 'major'          THEN CURRENT_DATE + 90      -- 90 days
    WHEN 'minor'          THEN CURRENT_DATE + 180     -- 6 months
    ELSE CURRENT_DATE + 365                            -- 1 year
  END;

  v_title := format('[AUTO] Non-compliance: %s', v_req.title);

  INSERT INTO public.certification_corrective_actions
    (organization_id, requirement_id, evaluation_id,
     scope_level, scope_id, severity, is_blocking, status,
     title, description, due_date)
  VALUES
    (NEW.organization_id, NEW.requirement_id, NEW.id,
     NEW.scope_level, NEW.scope_id,
     v_req.severity,
     v_req.severity = 'zero_tolerance',
     'open',
     v_title,
     format('Automatically created. Requirement: %s. Status: %s.',
            v_req.code, NEW.compliance_status),
     v_due);

  RETURN NEW;
END;
$$;

CREATE TRIGGER cert_auto_ca_trigger
  AFTER INSERT OR UPDATE OF compliance_status ON public.certification_requirement_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.cert_auto_create_corrective_action();

-- ===========================================================================
-- 8. EVIDENCE VERSION SNAPSHOT TRIGGER
-- Captures a version snapshot each time an evidence record's status changes.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_snapshot_evidence_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version integer;
BEGIN
  -- Only snapshot on lifecycle_status or file changes
  IF OLD.lifecycle_status = NEW.lifecycle_status
     AND OLD.storage_path IS NOT DISTINCT FROM NEW.storage_path THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version
  FROM public.certification_evidence_versions
  WHERE evidence_id = NEW.id;

  INSERT INTO public.certification_evidence_versions
    (organization_id, evidence_id, version_number,
     lifecycle_status, storage_path, file_hash_sha256,
     reviewed_by, reviewed_at, change_reason, changed_by)
  VALUES
    (NEW.organization_id, NEW.id, v_version,
     NEW.lifecycle_status, NEW.storage_path, NEW.file_hash_sha256,
     NEW.reviewed_by, NEW.reviewed_at,
     format('Status changed from %s to %s', OLD.lifecycle_status, NEW.lifecycle_status),
     NEW.reviewed_by);

  RETURN NEW;
END;
$$;

CREATE TRIGGER cert_evidence_version_trigger
  AFTER UPDATE ON public.certification_evidence_records
  FOR EACH ROW EXECUTE FUNCTION public.cert_snapshot_evidence_version();

-- ===========================================================================
-- 9. CROSS-SCHEME EVIDENCE INFERENCE
-- When evidence is linked to a requirement, automatically infer links
-- to overlapping requirements in other schemes.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_infer_cross_scheme_links(
  p_organization_id uuid,
  p_evidence_id     uuid,
  p_requirement_id  uuid
)
RETURNS integer  -- Returns count of inferred links created
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overlap record;
  v_inferred_count integer := 0;
BEGIN
  -- Find all overlaps where source = this requirement
  FOR v_overlap IN
    SELECT * FROM public.certification_requirement_overlaps
    WHERE req_source_id = p_requirement_id
      AND overlap_type IN ('equivalent', 'supersedes', 'infers')
  LOOP
    -- Insert inferred link if not already exists
    INSERT INTO public.certification_evidence_links
      (organization_id, evidence_id, requirement_id,
       link_type, coverage_pct, overlap_id,
       notes)
    VALUES
      (p_organization_id, p_evidence_id, v_overlap.req_target_id,
       'inferred', v_overlap.coverage_pct, v_overlap.id,
       format('Inferred via overlap rule: %s', COALESCE(v_overlap.inference_rule, 'cross-scheme overlap')))
    ON CONFLICT (evidence_id, requirement_id) DO NOTHING;

    IF FOUND THEN
      v_inferred_count := v_inferred_count + 1;
    END IF;
  END LOOP;

  RETURN v_inferred_count;
END;
$$;

-- ===========================================================================
-- 10. UPDATED_AT MAINTENANCE TRIGGERS
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'certification_layers',
    'certification_schemes',
    'certification_scheme_versions',
    'certification_requirement_groups',
    'certification_requirements',
    'certification_evidence_type_definitions',
    'certification_evidence_records',
    'organization_certification_profiles',
    'organization_certification_schemes',
    'certification_requirement_applicability',
    'certification_requirement_responses',
    'certification_requirement_evaluations',
    'certification_geospatial_validations',
    'certification_corrective_actions',
    'certification_tasks'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.cert_set_updated_at()',
      'trg_' || t || '_updated_at', t
    );
  END LOOP;
END;
$$;
