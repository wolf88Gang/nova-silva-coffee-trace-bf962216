-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- FRONTEND INTEGRATION: VIEWS + RPCs
-- Migration: 20260322000009
-- Depends on: 20260322000001–20260322000008
-- =============================================================================
-- These objects are the STABLE CONTRACT between the database and the frontend.
-- Lovable should query these views/RPCs — never the raw tables directly.
-- All views are SECURITY INVOKER (default): RLS on underlying tables is enforced.
-- All RPCs are SECURITY DEFINER: run as postgres but receive org_id explicitly.
-- =============================================================================

-- ===========================================================================
-- VIEW 1: cert_v_scheme_catalog
-- PURPOSE : Scheme + version picker for wizard and enrollment dropdowns.
-- CONSUMER: /certificacion/wizard
-- QUERY   : SELECT * FROM cert_v_scheme_catalog WHERE is_active = true
--           ORDER BY layer_sort_order, scheme_name;
-- NO ORG FILTER: master/reference data, public to all authenticated users.
-- ===========================================================================
CREATE OR REPLACE VIEW public.cert_v_scheme_catalog AS
SELECT
  cs.id               AS scheme_id,
  cs.code             AS scheme_code,
  cs.name             AS scheme_name,
  cs.short_name,
  cs.issuing_body,
  cs.is_active,
  -- Layer
  cl.id               AS layer_id,
  cl.code             AS layer_code,
  cl.name             AS layer_name,
  cl.layer_type,
  cl.is_regulatory,
  cl.sort_order       AS layer_sort_order,
  -- Current version (the one to enroll into)
  csv.id              AS scheme_version_id,
  csv.version_code,
  csv.version_name,
  csv.is_current,
  csv.effective_from,
  csv.effective_until,
  (SELECT COUNT(*)
   FROM public.certification_requirements r
   WHERE r.scheme_version_id = csv.id) AS requirement_count
FROM public.certification_schemes cs
JOIN public.certification_layers cl ON cl.id = cs.layer_id
JOIN public.certification_scheme_versions csv ON csv.scheme_id = cs.id;

-- ===========================================================================
-- VIEW 2: cert_v_my_schemes
-- PURPOSE : Dashboard cards — one per enrolled scheme with compliance state.
-- CONSUMER: /certificacion (dashboard)
-- QUERY   : SELECT * FROM cert_v_my_schemes WHERE organization_id = :orgId
--             AND is_active = true ORDER BY layer_is_regulatory DESC, scheme_name;
-- RLS     : organization_certification_schemes has RLS — rows auto-scoped to org.
-- FRONTEND COMPUTE: pct_compliant, color/badge from compliance_status.
-- BACKEND COMPUTE : compliance_score (engine), blocking_ca_count (subquery here).
-- ===========================================================================
CREATE OR REPLACE VIEW public.cert_v_my_schemes AS
SELECT
  ocs.id                      AS org_scheme_id,
  ocs.organization_id,
  ocs.enrollment_date,
  ocs.expiry_date,
  ocs.certificate_number,
  ocs.certificate_url,
  ocs.audit_date,
  ocs.audit_firm,
  ocs.lead_auditor,
  ocs.is_active,
  -- Live compliance counters (written by cert_rollup_scheme_compliance)
  ocs.compliance_status,
  ocs.compliance_score,
  ocs.compliant_count,
  ocs.non_compliant_count,
  ocs.blocked_count,
  ocs.in_progress_count,
  ocs.not_applicable_count,
  ocs.total_requirements,
  -- Derived: progress percentage (frontend can also compute this)
  CASE
    WHEN ocs.total_requirements > 0
    THEN ROUND(ocs.compliant_count::numeric / ocs.total_requirements * 100, 1)
    ELSE 0
  END                         AS pct_compliant,
  -- Scheme metadata
  cs.code                     AS scheme_code,
  cs.name                     AS scheme_name,
  cs.short_name               AS scheme_short_name,
  cs.issuing_body,
  -- Version metadata
  csv.id                      AS scheme_version_id,
  csv.version_code,
  csv.version_name,
  -- Layer metadata
  cl.code                     AS layer_code,
  cl.name                     AS layer_name,
  cl.layer_type,
  cl.is_regulatory            AS layer_is_regulatory,
  -- Latest snapshot (for trend arrow)
  snap.compliance_score       AS prev_score,
  snap.snapshot_date          AS prev_snapshot_date,
  snap.is_blocked             AS was_blocked,
  -- Open blocking corrective actions
  (SELECT COUNT(*)::integer
   FROM public.certification_corrective_actions ca
   JOIN public.certification_requirements cr ON cr.id = ca.requirement_id
   WHERE ca.organization_id   = ocs.organization_id
     AND cr.scheme_version_id = ocs.scheme_version_id
     AND ca.is_blocking       = true
     AND ca.status NOT IN ('closed','waived')
  )                           AS blocking_ca_count,
  ocs.updated_at
FROM public.organization_certification_schemes ocs
JOIN public.certification_scheme_versions csv ON csv.id = ocs.scheme_version_id
JOIN public.certification_schemes cs          ON cs.id  = csv.scheme_id
JOIN public.certification_layers cl           ON cl.id  = cs.layer_id
LEFT JOIN LATERAL (
  SELECT compliance_score, snapshot_date, is_blocked
  FROM   public.certification_scheme_readiness_snapshots
  WHERE  org_scheme_id = ocs.id
  ORDER BY snapshot_date DESC
  LIMIT 1
) snap ON true;

-- ===========================================================================
-- VIEW 3: cert_v_my_evaluations
-- PURPOSE : Requirement list with compliance overlay per org.
-- CONSUMER: /certificacion/esquema/:schemeKey
-- QUERY   : SELECT * FROM cert_v_my_evaluations
--             WHERE organization_id = :orgId AND scheme_code = :schemeKey
--             ORDER BY group_sort_order, sort_order;
-- NOTE    : Use cert_rpc_scheme_requirements() for a richer, single-call version.
-- ===========================================================================
CREATE OR REPLACE VIEW public.cert_v_my_evaluations AS
SELECT
  cre.id                      AS evaluation_id,
  cre.organization_id,
  cre.scope_level,
  cre.scope_id,
  cre.compliance_status,
  cre.score,
  cre.evidence_count,
  cre.primary_evidence_count,
  cre.missing_evidence,
  cre.blocking_issues,
  cre.has_zero_tolerance_violation,
  cre.open_ca_count,
  cre.overdue_ca_count,
  cre.evaluated_at,
  cre.evaluation_version,
  -- Requirement
  cr.id                       AS requirement_id,
  cr.code                     AS req_code,
  cr.title                    AS req_title,
  cr.description              AS req_description,
  cr.severity,
  cr.audit_logic_type,
  cr.blocks_certification,
  cr.is_mandatory,
  cr.scope_organization,
  cr.scope_farm,
  cr.scope_parcel,
  cr.scope_lot,
  cr.nova_yield_required,
  cr.nova_guard_required,
  cr.labor_ops_required,
  cr.eudr_article_ref,
  cr.sort_order,
  -- Group hierarchy
  crg.id                      AS group_id,
  crg.code                    AS group_code,
  crg.name                    AS group_name,
  crg.depth_level,
  crg.sort_order              AS group_sort_order,
  -- Scheme
  csv.id                      AS scheme_version_id,
  cs.code                     AS scheme_code,
  cs.name                     AS scheme_name,
  cl.code                     AS layer_code,
  cl.is_regulatory
FROM public.certification_requirement_evaluations cre
JOIN public.certification_requirements cr
  ON cr.id   = cre.requirement_id
JOIN public.certification_requirement_groups crg
  ON crg.id  = cr.group_id
JOIN public.certification_scheme_versions csv
  ON csv.id  = cr.scheme_version_id
JOIN public.certification_schemes cs
  ON cs.id   = csv.scheme_id
JOIN public.certification_layers cl
  ON cl.id   = cs.layer_id;

-- ===========================================================================
-- VIEW 4: cert_v_my_evidence
-- PURPOSE : Evidence center list with link summary and expiry state.
-- CONSUMER: /certificacion/evidencia
-- QUERY   : SELECT * FROM cert_v_my_evidence
--             WHERE organization_id = :orgId
--             AND lifecycle_status = 'approved'   -- or omit for all
--             ORDER BY collected_at DESC;
-- FRONTEND COMPUTE: status badge color, days_until_expiry display.
-- ===========================================================================
CREATE OR REPLACE VIEW public.cert_v_my_evidence AS
SELECT
  er.id,
  er.organization_id,
  er.evidence_type,
  er.title,
  er.description,
  er.source_system,
  er.scope_level,
  er.scope_id,
  er.collected_at,
  er.valid_from,
  er.valid_until,
  er.lifecycle_status,
  er.rejection_reason,
  er.storage_path,
  er.file_size_bytes,
  er.mime_type,
  er.geo_latitude,
  er.geo_longitude,
  er.geo_precision_m,
  er.is_offline_created,
  er.synced_at,
  er.created_at,
  er.updated_at,
  -- Blockchain proof
  er.blockchain_anchor_id,
  ba.payload_hash             AS anchor_hash,
  ba.anchored_at,
  -- Evidence type definition metadata
  etd.name                    AS type_def_name,
  etd.accepted_formats,
  etd.max_age_days,
  -- Link summary (aggregated to avoid fan-out)
  (SELECT COUNT(*)::integer
   FROM public.certification_evidence_links el
   WHERE el.evidence_id = er.id)                   AS total_linked_requirements,
  (SELECT COUNT(*)::integer
   FROM public.certification_evidence_links el
   WHERE el.evidence_id = er.id
     AND el.link_type = 'primary')                 AS primary_links,
  (SELECT COUNT(*)::integer
   FROM public.certification_evidence_links el
   WHERE el.evidence_id = er.id
     AND el.link_type = 'inferred')                AS inferred_links,
  -- Expiry state (computed fresh at query time)
  CASE
    WHEN er.valid_until IS NOT NULL
    THEN (er.valid_until - CURRENT_DATE)::integer
    ELSE NULL
  END                                              AS days_until_expiry,
  CASE
    WHEN er.valid_until IS NOT NULL AND er.valid_until < CURRENT_DATE
    THEN true ELSE false
  END                                              AS is_expired
FROM public.certification_evidence_records er
LEFT JOIN public.blockchain_anchors ba
  ON  ba.id = er.blockchain_anchor_id
LEFT JOIN public.certification_evidence_type_definitions etd
  ON  etd.id = er.type_definition_id;

-- ===========================================================================
-- VIEW 5: cert_v_my_corrective_actions
-- PURPOSE : CA list with fresh days computation and requirement context.
-- CONSUMER: /certificacion/correctivas
-- QUERY   : SELECT * FROM cert_v_my_corrective_actions
--             WHERE organization_id = :orgId
--             AND status != 'closed'         -- or 'open', 'in_progress', etc.
--             ORDER BY is_blocking DESC, is_overdue DESC, due_date ASC NULLS LAST;
-- NOTE    : days_to_resolve here is ALWAYS fresh (computed at SELECT time).
--           The column on the base table may be stale; ignore it.
-- ===========================================================================
CREATE OR REPLACE VIEW public.cert_v_my_corrective_actions AS
SELECT
  ca.id,
  ca.organization_id,
  ca.evaluation_id,
  ca.scope_level,
  ca.scope_id,
  ca.severity,
  ca.is_blocking,
  ca.status,
  ca.title,
  ca.description,
  ca.root_cause,
  ca.action_plan,
  ca.audit_finding_ref,
  ca.due_date,
  -- ALWAYS FRESH: computed at query time, never stale
  CASE
    WHEN ca.due_date IS NOT NULL AND ca.status NOT IN ('closed','waived')
    THEN (ca.due_date - CURRENT_DATE)::integer
    ELSE NULL
  END                         AS days_to_resolve,
  CASE
    WHEN ca.due_date IS NOT NULL
      AND ca.status NOT IN ('closed','waived')
      AND ca.due_date < CURRENT_DATE
    THEN true ELSE false
  END                         AS is_overdue,
  ca.resolution_description,
  ca.closed_at,
  ca.verified_at,
  ca.escalated,
  ca.escalated_at,
  ca.created_at,
  ca.updated_at,
  -- Requirement context
  cr.code                     AS req_code,
  cr.title                    AS req_title,
  cr.severity                 AS req_severity,
  cr.audit_logic_type,
  cr.blocks_certification,
  -- Scheme context
  csv.id                      AS scheme_version_id,
  cs.code                     AS scheme_code,
  cs.name                     AS scheme_name,
  cl.layer_type,
  cl.is_regulatory            AS layer_is_regulatory,
  -- Task progress
  (SELECT COUNT(*)::integer
   FROM public.certification_tasks t
   WHERE t.corrective_action_id = ca.id)           AS total_tasks,
  (SELECT COUNT(*)::integer
   FROM public.certification_tasks t
   WHERE t.corrective_action_id = ca.id
     AND t.status = 'done')                        AS completed_tasks
FROM public.certification_corrective_actions ca
JOIN public.certification_requirements cr
  ON cr.id   = ca.requirement_id
JOIN public.certification_scheme_versions csv
  ON csv.id  = cr.scheme_version_id
JOIN public.certification_schemes cs
  ON cs.id   = csv.scheme_id
JOIN public.certification_layers cl
  ON cl.id   = cs.layer_id;

-- ===========================================================================
-- VIEW 6: cert_v_cross_scheme_opportunities
-- PURPOSE : Evidence reuse map — shows which approved evidence could satisfy
--           requirements in other schemes via overlap rules.
-- CONSUMER: /certificacion/cruzada
-- QUERY   : SELECT * FROM cert_v_cross_scheme_opportunities
--             WHERE organization_id = :orgId
--             AND already_reused = false
--             ORDER BY coverage_pct DESC;
-- ===========================================================================
CREATE OR REPLACE VIEW public.cert_v_cross_scheme_opportunities AS
SELECT
  el.organization_id,
  el.evidence_id,
  er.title                    AS evidence_title,
  er.evidence_type,
  er.lifecycle_status,
  er.valid_until,
  er.collected_at,
  -- Source: where evidence is already linked
  el.requirement_id           AS source_req_id,
  el.link_type                AS source_link_type,
  cr_src.code                 AS source_req_code,
  cr_src.title                AS source_req_title,
  cs_src.code                 AS source_scheme_code,
  cs_src.name                 AS source_scheme_name,
  cl_src.layer_type           AS source_layer_type,
  -- Overlap rule
  ov.id                       AS overlap_id,
  ov.overlap_type,
  ov.coverage_pct,
  ov.inference_rule,
  -- Target: requirement that could benefit from reuse
  ov.req_target_id,
  cr_tgt.code                 AS target_req_code,
  cr_tgt.title                AS target_req_title,
  cr_tgt.severity             AS target_severity,
  cs_tgt.code                 AS target_scheme_code,
  cs_tgt.name                 AS target_scheme_name,
  cl_tgt.layer_type           AS target_layer_type,
  -- Is this reuse already applied?
  EXISTS (
    SELECT 1
    FROM   public.certification_evidence_links el2
    WHERE  el2.evidence_id   = el.evidence_id
      AND  el2.requirement_id = ov.req_target_id
  )                           AS already_reused
FROM public.certification_evidence_links el
JOIN public.certification_evidence_records er
  ON  er.id = el.evidence_id
JOIN public.certification_requirements cr_src
  ON  cr_src.id = el.requirement_id
JOIN public.certification_scheme_versions csv_src
  ON  csv_src.id = cr_src.scheme_version_id
JOIN public.certification_schemes cs_src
  ON  cs_src.id = csv_src.scheme_id
JOIN public.certification_layers cl_src
  ON  cl_src.id = cs_src.layer_id
JOIN public.certification_requirement_overlaps ov
  ON  ov.req_source_id = el.requirement_id
JOIN public.certification_requirements cr_tgt
  ON  cr_tgt.id = ov.req_target_id
JOIN public.certification_scheme_versions csv_tgt
  ON  csv_tgt.id = cr_tgt.scheme_version_id
JOIN public.certification_schemes cs_tgt
  ON  cs_tgt.id = csv_tgt.scheme_id
JOIN public.certification_layers cl_tgt
  ON  cl_tgt.id = cs_tgt.layer_id
WHERE er.lifecycle_status IN ('approved','submitted','under_review');

-- ===========================================================================
-- RPC 1: cert_rpc_scheme_requirements
-- PURPOSE : Full requirement list with evaluations for scheme detail page.
--           Single call — avoids N+1 queries from the frontend.
-- CONSUMER: /certificacion/esquema/:schemeKey
-- CALL    : SELECT * FROM cert_rpc_scheme_requirements(:orgId, 'eudr_2023');
-- RETURNS : One row per requirement. compliance_status defaults to 'not_started'
--           when no evaluation exists yet.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_rpc_scheme_requirements(
  p_org_id      uuid,
  p_scheme_code text
)
RETURNS TABLE (
  requirement_id              uuid,
  req_code                    text,
  req_title                   text,
  req_description             text,
  severity                    public.requirement_severity,
  audit_logic_type            public.audit_logic_type,
  blocks_certification        boolean,
  is_mandatory                boolean,
  scope_level_primary         text,
  eudr_article_ref            text,
  nova_yield_required         boolean,
  nova_guard_required         boolean,
  labor_ops_required          boolean,
  sort_order                  integer,
  group_id                    uuid,
  group_code                  text,
  group_name                  text,
  group_depth                 integer,
  group_sort                  integer,
  parent_group_code           text,
  compliance_status           public.compliance_status,
  evidence_count              integer,
  primary_evidence_count      integer,
  open_ca_count               integer,
  overdue_ca_count            integer,
  has_zero_tolerance_violation boolean,
  blocking_issues             text[],
  missing_evidence            text[],
  evaluated_at                timestamptz,
  is_applicable               boolean,
  exclusion_reason            text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cr.id,
    cr.code,
    cr.title,
    cr.description,
    cr.severity,
    cr.audit_logic_type,
    cr.blocks_certification,
    cr.is_mandatory,
    CASE
      WHEN cr.scope_parcel       THEN 'parcel'
      WHEN cr.scope_lot          THEN 'lot'
      WHEN cr.scope_farm         THEN 'farm'
      WHEN cr.scope_organization THEN 'organization'
      ELSE 'organization'
    END                          AS scope_level_primary,
    cr.eudr_article_ref,
    cr.nova_yield_required,
    cr.nova_guard_required,
    cr.labor_ops_required,
    cr.sort_order,
    crg.id,
    crg.code,
    crg.name,
    crg.depth_level,
    crg.sort_order,
    pg.code                      AS parent_group_code,
    COALESCE(cre.compliance_status, 'not_started'::public.compliance_status),
    COALESCE(cre.evidence_count, 0),
    COALESCE(cre.primary_evidence_count, 0),
    COALESCE(cre.open_ca_count, 0),
    COALESCE(cre.overdue_ca_count, 0),
    COALESCE(cre.has_zero_tolerance_violation, false),
    COALESCE(cre.blocking_issues, '{}'),
    COALESCE(cre.missing_evidence, '{}'),
    cre.evaluated_at,
    COALESCE(app.is_applicable, true),
    app.exclusion_reason
  FROM public.certification_requirements cr
  JOIN public.certification_requirement_groups crg
    ON crg.id = cr.group_id
  JOIN public.certification_scheme_versions csv
    ON csv.id = cr.scheme_version_id
  JOIN public.certification_schemes cs
    ON cs.id = csv.scheme_id
  LEFT JOIN public.certification_requirement_groups pg
    ON pg.id = crg.parent_group_id
  LEFT JOIN LATERAL (
    SELECT *
    FROM   public.certification_requirement_evaluations
    WHERE  organization_id = p_org_id
      AND  requirement_id  = cr.id
    ORDER BY evaluated_at DESC
    LIMIT 1
  ) cre ON true
  LEFT JOIN public.certification_requirement_applicability app
    ON  app.organization_id = p_org_id
    AND app.requirement_id  = cr.id
  WHERE cs.code = p_scheme_code
  ORDER BY crg.sort_order, cr.sort_order;
$$;

-- ===========================================================================
-- RPC 2: cert_rpc_dossier_summary
-- PURPOSE : Full audit dossier package in a single JSON blob.
--           Covers all 5 check types + snapshot history + CA summary.
-- CONSUMER: /certificacion/dossier
-- CALL    : SELECT cert_rpc_dossier_summary(:orgId, :orgSchemeId);
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_rpc_dossier_summary(
  p_org_id        uuid,
  p_org_scheme_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result            jsonb;
  v_scheme_version_id uuid;
BEGIN
  SELECT scheme_version_id INTO v_scheme_version_id
  FROM   public.organization_certification_schemes
  WHERE  id = p_org_scheme_id;

  IF v_scheme_version_id IS NULL THEN
    RETURN jsonb_build_object('error', 'org_scheme_id not found');
  END IF;

  SELECT jsonb_build_object(
    'org_scheme_id',   p_org_scheme_id,
    'generated_at',    now(),

    -- Scheme header
    'scheme', (
      SELECT jsonb_build_object(
        'scheme_code',        cs.code,
        'scheme_name',        cs.name,
        'version_code',       csv.version_code,
        'compliance_status',  ocs.compliance_status,
        'compliance_score',   ocs.compliance_score,
        'enrollment_date',    ocs.enrollment_date,
        'expiry_date',        ocs.expiry_date,
        'certificate_number', ocs.certificate_number,
        'audit_date',         ocs.audit_date,
        'audit_firm',         ocs.audit_firm
      )
      FROM  public.organization_certification_schemes ocs
      JOIN  public.certification_scheme_versions csv ON csv.id = ocs.scheme_version_id
      JOIN  public.certification_schemes cs ON cs.id = csv.scheme_id
      WHERE ocs.id = p_org_scheme_id
    ),

    -- Compliance breakdown
    'compliance_breakdown', (
      SELECT jsonb_build_object(
        'total',          ocs.total_requirements,
        'compliant',      ocs.compliant_count,
        'non_compliant',  ocs.non_compliant_count,
        'blocked',        ocs.blocked_count,
        'in_progress',    ocs.in_progress_count,
        'not_applicable', ocs.not_applicable_count,
        'score',          ocs.compliance_score
      )
      FROM public.organization_certification_schemes ocs
      WHERE ocs.id = p_org_scheme_id
    ),

    -- Snapshot trend (last 30 days)
    'snapshot_history', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'date',    s.snapshot_date,
          'score',   s.compliance_score,
          'blocked', s.is_blocked,
          'compliant_count', s.compliant_count,
          'non_compliant_count', s.non_compliant_count
        ) ORDER BY s.snapshot_date
      ), '[]'::jsonb)
      FROM public.certification_scheme_readiness_snapshots s
      WHERE s.org_scheme_id  = p_org_scheme_id
        AND s.snapshot_date >= CURRENT_DATE - 30
    ),

    -- Geospatial validation summary
    'geospatial', (
      SELECT jsonb_build_object(
        'total',               COUNT(*),
        'pass',                COUNT(*) FILTER (WHERE result = 'pass'),
        'fail',                COUNT(*) FILTER (WHERE result = 'fail'),
        'warning',             COUNT(*) FILTER (WHERE result = 'warning'),
        'deforestation_alerts',COUNT(*) FILTER (WHERE deforestation_alert = true AND false_positive_flag = false),
        'false_positives',     COUNT(*) FILTER (WHERE false_positive_flag = true),
        'protected_area_overlaps', COUNT(*) FILTER (WHERE overlap_protected_area = true)
      )
      FROM public.certification_geospatial_validations
      WHERE organization_id    = p_org_id
        AND scheme_version_id  = v_scheme_version_id
    ),

    -- Mass balance summary
    'mass_balance', (
      SELECT jsonb_build_object(
        'total',   COUNT(*),
        'pass',    COUNT(*) FILTER (WHERE result = 'pass'),
        'fail',    COUNT(*) FILTER (WHERE result = 'fail'),
        'warning', COUNT(*) FILTER (WHERE result = 'warning'),
        'avg_variance_pct', ROUND(AVG(ABS(variance_pct)), 2)
      )
      FROM public.certification_mass_balance_checks
      WHERE organization_id   = p_org_id
        AND scheme_version_id = v_scheme_version_id
    ),

    -- Traceback summary
    'traceback', (
      SELECT jsonb_build_object(
        'labor_total',             COUNT(*) FILTER (WHERE check_type = 'labor'),
        'labor_fail',              COUNT(*) FILTER (WHERE check_type = 'labor' AND result = 'fail'),
        'child_labor_detected',    COUNT(*) FILTER (WHERE child_labor_detected = true),
        'forced_labor_detected',   COUNT(*) FILTER (WHERE forced_labor_detected = true),
        'supply_chain_total',      COUNT(*) FILTER (WHERE check_type = 'supply_chain'),
        'avg_traceability_pct',    ROUND(AVG(traceability_pct) FILTER (WHERE check_type = 'supply_chain'), 1),
        'financial_total',         COUNT(*) FILTER (WHERE check_type = 'financial')
      )
      FROM public.certification_traceback_checks
      WHERE organization_id   = p_org_id
        AND scheme_version_id = v_scheme_version_id
    ),

    -- Corrective actions summary
    'corrective_actions', (
      SELECT jsonb_build_object(
        'total_open',     COUNT(*) FILTER (WHERE ca.status NOT IN ('closed','waived')),
        'blocking',       COUNT(*) FILTER (WHERE ca.is_blocking = true AND ca.status NOT IN ('closed','waived')),
        'overdue',        COUNT(*) FILTER (WHERE ca.due_date < CURRENT_DATE AND ca.status NOT IN ('closed','waived')),
        'zero_tolerance', COUNT(*) FILTER (WHERE ca.severity = 'zero_tolerance' AND ca.status NOT IN ('closed','waived')),
        'closed_this_month', COUNT(*) FILTER (WHERE ca.status = 'closed' AND ca.closed_at >= date_trunc('month', CURRENT_DATE))
      )
      FROM public.certification_corrective_actions ca
      JOIN public.certification_requirements cr ON cr.id = ca.requirement_id
      WHERE ca.organization_id   = p_org_id
        AND cr.scheme_version_id = v_scheme_version_id
    ),

    -- Evidence summary
    'evidence', (
      SELECT jsonb_build_object(
        'total',    COUNT(*),
        'approved', COUNT(*) FILTER (WHERE lifecycle_status = 'approved'),
        'pending',  COUNT(*) FILTER (WHERE lifecycle_status = 'pending_review'),
        'draft',    COUNT(*) FILTER (WHERE lifecycle_status = 'draft'),
        'rejected', COUNT(*) FILTER (WHERE lifecycle_status = 'rejected'),
        'anchored', COUNT(*) FILTER (WHERE blockchain_anchor_id IS NOT NULL),
        'expiring_30d', COUNT(*) FILTER (
          WHERE valid_until BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
        )
      )
      FROM public.certification_evidence_records
      WHERE organization_id = p_org_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ===========================================================================
-- RPC 3: cert_rpc_org_dashboard
-- PURPOSE : Single-call summary for the /certificacion dashboard.
--           Returns org profile + all enrolled schemes + open CA count.
-- CONSUMER: /certificacion (initial page load)
-- CALL    : SELECT cert_rpc_org_dashboard(:orgId);
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cert_rpc_org_dashboard(
  p_org_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'org_id',      p_org_id,
    'generated_at', now(),

    'profile', (
      SELECT jsonb_build_object(
        'profile_name',         p.profile_name,
        'country_code',         p.country_code,
        'commodity',            p.commodity,
        'farming_system',       p.farming_system,
        'hectares_total',       p.hectares_total,
        'producers_count',      p.producers_count,
        'eudr_due_date',        p.eudr_due_date,
        'eudr_geo_data_submitted', p.eudr_geo_data_submitted,
        'last_audit_date',      p.last_audit_date,
        'next_audit_date',      p.next_audit_date,
        'audit_readiness_score', p.audit_readiness_score
      )
      FROM public.organization_certification_profiles p
      WHERE p.organization_id = p_org_id
    ),

    'schemes', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'org_scheme_id',      ocs.id,
          'scheme_code',        cs.code,
          'scheme_name',        cs.name,
          'layer_code',         cl.code,
          'layer_is_regulatory', cl.is_regulatory,
          'compliance_status',  ocs.compliance_status,
          'compliance_score',   ocs.compliance_score,
          'compliant_count',    ocs.compliant_count,
          'non_compliant_count', ocs.non_compliant_count,
          'blocked_count',      ocs.blocked_count,
          'total_requirements', ocs.total_requirements,
          'is_active',          ocs.is_active,
          'enrollment_date',    ocs.enrollment_date,
          'expiry_date',        ocs.expiry_date
        ) ORDER BY cl.sort_order
      ), '[]'::jsonb)
      FROM  public.organization_certification_schemes ocs
      JOIN  public.certification_scheme_versions csv ON csv.id = ocs.scheme_version_id
      JOIN  public.certification_schemes cs          ON cs.id  = csv.scheme_id
      JOIN  public.certification_layers cl           ON cl.id  = cs.layer_id
      WHERE ocs.organization_id = p_org_id
        AND ocs.is_active       = true
    ),

    'open_cas', (
      SELECT jsonb_build_object(
        'total',    COUNT(*),
        'blocking', COUNT(*) FILTER (WHERE is_blocking = true),
        'overdue',  COUNT(*) FILTER (WHERE due_date < CURRENT_DATE)
      )
      FROM public.certification_corrective_actions
      WHERE organization_id = p_org_id
        AND status NOT IN ('closed','waived')
    ),

    'evidence_totals', (
      SELECT jsonb_build_object(
        'approved', COUNT(*) FILTER (WHERE lifecycle_status = 'approved'),
        'pending',  COUNT(*) FILTER (WHERE lifecycle_status = 'pending_review'),
        'draft',    COUNT(*) FILTER (WHERE lifecycle_status = 'draft')
      )
      FROM public.certification_evidence_records
      WHERE organization_id = p_org_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
