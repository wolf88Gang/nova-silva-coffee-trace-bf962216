-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 5: DEMO SEED DATA
-- Migration: 20260322000012
-- =============================================================================
-- PURPOSE: Provides enough data for Lovable to render all 7 certification pages
--          with realistic, varied content immediately after deploy.
--
-- DEMO ORG UUID: '00000000-0000-0000-0000-000000000099'
-- IMPORTANT: Replace this UUID with your real organization_id before using
--            this data with a real Supabase auth user. The demo UUID is chosen
--            to be clearly identifiable and not conflict with real UUIDs.
--
-- IDEMPOTENT: All inserts use ON CONFLICT DO NOTHING — safe to run multiple times.
-- =============================================================================

DO $$
DECLARE
  -- Demo organization
  v_org_id          uuid := '00000000-0000-0000-0000-000000000099';

  -- Scheme + version IDs
  v_eudr_scheme_id  uuid;
  v_ra_scheme_id    uuid;
  v_eudr_ver_id     uuid;
  v_ra_ver_id       uuid;

  -- Org scheme enrollment IDs
  v_org_eudr_id     uuid;
  v_org_ra_id       uuid;

  -- Requirement group IDs
  v_grp_eudr_geo_id uuid;
  v_grp_eudr_doc_id uuid;
  v_grp_ra_env_id   uuid;
  v_grp_ra_soc_id   uuid;

  -- Requirement IDs (EUDR)
  v_req_eudr_geo_id    uuid := 'b1000000-0000-0000-0000-000000000001';
  v_req_eudr_trace_id  uuid := 'b1000000-0000-0000-0000-000000000002';
  v_req_eudr_doc_id    uuid := 'b1000000-0000-0000-0000-000000000003';
  v_req_eudr_mb_id     uuid := 'b1000000-0000-0000-0000-000000000004';

  -- Requirement IDs (RA)
  v_req_ra_plaus_id    uuid := 'b2000000-0000-0000-0000-000000000001';
  v_req_ra_labor_id    uuid := 'b2000000-0000-0000-0000-000000000002';
  v_req_ra_water_id    uuid := 'b2000000-0000-0000-0000-000000000003';

  -- Evidence record IDs
  v_ev_geo_id       uuid := 'e1000000-0000-0000-0000-000000000001';
  v_ev_trace_id     uuid := 'e1000000-0000-0000-0000-000000000002';
  v_ev_mb_id        uuid := 'e1000000-0000-0000-0000-000000000003';
  v_ev_audit_id     uuid := 'e1000000-0000-0000-0000-000000000004';
  v_ev_labor_id     uuid := 'e1000000-0000-0000-0000-000000000005';
  v_ev_draft_id     uuid := 'e1000000-0000-0000-0000-000000000006';

  -- Demo scope UUIDs (parcel / lot)
  v_parcel_a        uuid := 'f1000000-0000-0000-0000-000000000001';
  v_parcel_b        uuid := 'f1000000-0000-0000-0000-000000000002';
  v_lot_a           uuid := 'f2000000-0000-0000-0000-000000000001';

BEGIN

-- ===========================================================================
-- STEP 1: EUDR SCHEME + VERSION
-- ===========================================================================
INSERT INTO public.certification_schemes (id, layer_id, code, name, short_name, issuing_body, is_active)
SELECT
  'a1000000-0000-0000-0000-000000000001',
  cl.id,
  'eudr_2023',
  'EU Deforestation Regulation 2023/1115',
  'EUDR',
  'European Commission',
  true
FROM public.certification_layers cl WHERE cl.code = 'eudr'
ON CONFLICT (code) DO NOTHING;

SELECT id INTO v_eudr_scheme_id FROM public.certification_schemes WHERE code = 'eudr_2023';

INSERT INTO public.certification_scheme_versions
  (id, scheme_id, version_code, version_name, effective_from, is_current)
VALUES
  ('a1000000-0000-0000-0000-000000000002',
   v_eudr_scheme_id, '2023-v1', 'EUDR 2023/1115 — Initial', '2023-06-29', true)
ON CONFLICT (scheme_id, version_code) DO NOTHING;

SELECT id INTO v_eudr_ver_id
FROM public.certification_scheme_versions
WHERE scheme_id = v_eudr_scheme_id AND version_code = '2023-v1';

-- ===========================================================================
-- STEP 2: RAINFOREST ALLIANCE SCHEME + VERSION
-- ===========================================================================
INSERT INTO public.certification_schemes (id, layer_id, code, name, short_name, issuing_body, is_active)
SELECT
  'a2000000-0000-0000-0000-000000000001',
  cl.id,
  'rainforest_alliance_2020',
  'Rainforest Alliance Sustainable Agriculture Standard 2020',
  'RA 2020',
  'Rainforest Alliance',
  true
FROM public.certification_layers cl WHERE cl.code = 'vss'
ON CONFLICT (code) DO NOTHING;

SELECT id INTO v_ra_scheme_id FROM public.certification_schemes WHERE code = 'rainforest_alliance_2020';

INSERT INTO public.certification_scheme_versions
  (id, scheme_id, version_code, version_name, effective_from, is_current)
VALUES
  ('a2000000-0000-0000-0000-000000000002',
   v_ra_scheme_id, '2020-v1.2', 'RA SAS 2020 v1.2', '2021-07-01', true)
ON CONFLICT (scheme_id, version_code) DO NOTHING;

SELECT id INTO v_ra_ver_id
FROM public.certification_scheme_versions
WHERE scheme_id = v_ra_scheme_id AND version_code = '2020-v1.2';

-- ===========================================================================
-- STEP 3: REQUIREMENT GROUPS
-- ===========================================================================
-- EUDR groups
INSERT INTO public.certification_requirement_groups
  (id, scheme_version_id, code, name, sort_order, depth_level)
VALUES
  ('c1000000-0000-0000-0000-000000000001', v_eudr_ver_id,
   'EUDR-P1', 'Geospatial & Deforestation', 10, 1),
  ('c1000000-0000-0000-0000-000000000002', v_eudr_ver_id,
   'EUDR-P2', 'Due Diligence Documentation', 20, 1)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

SELECT id INTO v_grp_eudr_geo_id
FROM public.certification_requirement_groups
WHERE scheme_version_id = v_eudr_ver_id AND code = 'EUDR-P1';

SELECT id INTO v_grp_eudr_doc_id
FROM public.certification_requirement_groups
WHERE scheme_version_id = v_eudr_ver_id AND code = 'EUDR-P2';

-- RA groups
INSERT INTO public.certification_requirement_groups
  (id, scheme_version_id, code, name, sort_order, depth_level)
VALUES
  ('c2000000-0000-0000-0000-000000000001', v_ra_ver_id,
   'RA-P1', 'Environmental Management', 10, 1),
  ('c2000000-0000-0000-0000-000000000002', v_ra_ver_id,
   'RA-P2', 'Social & Living Income', 20, 1)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

SELECT id INTO v_grp_ra_env_id
FROM public.certification_requirement_groups
WHERE scheme_version_id = v_ra_ver_id AND code = 'RA-P1';

SELECT id INTO v_grp_ra_soc_id
FROM public.certification_requirement_groups
WHERE scheme_version_id = v_ra_ver_id AND code = 'RA-P2';

-- ===========================================================================
-- STEP 4: REQUIREMENTS
-- ===========================================================================
-- EUDR: Geospatial validation (zero_tolerance)
INSERT INTO public.certification_requirements
  (id, scheme_version_id, group_id, code, title, description, severity,
   audit_logic_type, scope_parcel, blocks_certification,
   nova_guard_required, eudr_article_ref, sort_order)
VALUES
  (v_req_eudr_geo_id, v_eudr_ver_id, v_grp_eudr_geo_id,
   'EUDR-ART3-GEO',
   'Parcel polygon free of deforestation post-31-Dec-2020',
   'All parcels supplying coffee must have verified GeoJSON polygons with no deforestation detected by PRODES/GFW/Hansen since 31 December 2020.',
   'zero_tolerance', 'geospatial_validation', true, true, true, 'Article 3(a)', 10)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

-- EUDR: Supply chain traceability (major)
INSERT INTO public.certification_requirements
  (id, scheme_version_id, group_id, code, title, description, severity,
   audit_logic_type, scope_organization, scope_parcel, blocks_certification, eudr_article_ref, sort_order)
VALUES
  (v_req_eudr_trace_id, v_eudr_ver_id, v_grp_eudr_geo_id,
   'EUDR-ART9-TRACE',
   'Full farm-level supply chain traceability',
   'Operator must maintain documented traceability to the level of the plot of land for all coffee placed on the EU market.',
   'major', 'labor_traceback', true, false, false, 'Article 9', 20)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

-- EUDR: Due diligence statement (major)
INSERT INTO public.certification_requirements
  (id, scheme_version_id, group_id, code, title, description, severity,
   audit_logic_type, scope_organization, blocks_certification, eudr_article_ref, sort_order)
VALUES
  (v_req_eudr_doc_id, v_eudr_ver_id, v_grp_eudr_doc_id,
   'EUDR-ART4-DDS',
   'Due Diligence Statement submitted to TRACES NT',
   'Prior to placing coffee on the EU market, a Due Diligence Statement must be submitted and reference number obtained.',
   'major', 'document_review', true, false, 'Article 4', 30)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

-- EUDR: Mass balance (minor)
INSERT INTO public.certification_requirements
  (id, scheme_version_id, group_id, code, title, description, severity,
   audit_logic_type, scope_lot, blocks_certification, eudr_article_ref, sort_order)
VALUES
  (v_req_eudr_mb_id, v_eudr_ver_id, v_grp_eudr_doc_id,
   'EUDR-ART9-MB',
   'Mass balance reconciliation per export lot',
   'Volume of certified coffee must be reconciled at lot level: received ≈ processed + sold + closing stock (±5% tolerance).',
   'minor', 'mass_balance', true, false, 'Article 9(1)(e)', 40)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

-- RA: Yield plausibility (major)
INSERT INTO public.certification_requirements
  (id, scheme_version_id, group_id, code, title, description, severity,
   audit_logic_type, scope_parcel, blocks_certification, nova_yield_required, sort_order)
VALUES
  (v_req_ra_plaus_id, v_ra_ver_id, v_grp_ra_env_id,
   'RA2020-C1.1.1',
   'Declared yield within biological plausibility ceiling',
   'Declared yield per hectare must not exceed the Nova Yield biological ceiling by more than 30%. Deviations trigger data quality audit.',
   'major', 'plausibility', true, false, true, 10)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

-- RA: Labor practices (zero_tolerance for child/forced)
INSERT INTO public.certification_requirements
  (id, scheme_version_id, group_id, code, title, description, severity,
   audit_logic_type, scope_organization, blocks_certification, labor_ops_required, sort_order)
VALUES
  (v_req_ra_labor_id, v_ra_ver_id, v_grp_ra_soc_id,
   'RA2020-C4.1.1',
   'No child labor or forced labor',
   'Zero tolerance for child labor (workers under 15 or below local minimum age for work) and forced labor of any kind.',
   'zero_tolerance', 'labor_traceback', true, true, true, 10)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

-- RA: Water management (minor)
INSERT INTO public.certification_requirements
  (id, scheme_version_id, group_id, code, title, description, severity,
   audit_logic_type, scope_organization, blocks_certification, sort_order)
VALUES
  (v_req_ra_water_id, v_ra_ver_id, v_grp_ra_env_id,
   'RA2020-C2.1.1',
   'Water use records and conservation measures',
   'Organization must maintain water use records and implement conservation measures at processing facilities.',
   'minor', 'document_review', true, false, 20)
ON CONFLICT (scheme_version_id, code) DO NOTHING;

-- ===========================================================================
-- STEP 5: CROSS-SCHEME OVERLAP (EUDR traceability ↔ RA labor)
-- ===========================================================================
INSERT INTO public.certification_requirement_overlaps
  (req_source_id, req_target_id, overlap_type, coverage_pct, inference_rule)
VALUES
  (v_req_eudr_trace_id, v_req_ra_labor_id,
   'partial', 60,
   'EUDR-ART9-TRACE supply chain records partially cover RA2020-C4.1.1 worker identity verification')
ON CONFLICT (req_source_id, req_target_id) DO NOTHING;

-- ===========================================================================
-- STEP 6: ORGANIZATION CERTIFICATION PROFILE
-- ===========================================================================
INSERT INTO public.organization_certification_profiles
  (organization_id, profile_name, country_code, commodity,
   farming_system, hectares_total, producers_count,
   altitude_min_masl, altitude_max_masl, primary_variety,
   eudr_due_date, eudr_geo_data_submitted, audit_readiness_score)
VALUES
  (v_org_id, 'Cooperativa Nova Silva Demo', 'CR', 'coffee',
   'smallholder', 840.50, 127,
   1200, 1800, 'Catuaí Rojo',
   '2025-12-31', true, 72.5)
ON CONFLICT (organization_id) DO NOTHING;

-- ===========================================================================
-- STEP 7: SCHEME ENROLLMENTS
-- ===========================================================================
INSERT INTO public.organization_certification_schemes
  (id, organization_id, scheme_version_id, enrollment_date, expiry_date,
   certificate_number, compliance_status,
   compliant_count, non_compliant_count, blocked_count, in_progress_count,
   not_applicable_count, total_requirements, compliance_score, is_active)
VALUES
  ('d1000000-0000-0000-0000-000000000001',
   v_org_id, v_eudr_ver_id, '2024-01-15', '2025-12-31',
   'EUDR-CR-2024-00127',
   'in_progress',
   2, 1, 0, 1, 0, 4, 50.0, true),
  ('d2000000-0000-0000-0000-000000000001',
   v_org_id, v_ra_ver_id, '2023-07-01', '2026-06-30',
   'RA-CR-2023-04521',
   'in_progress',
   1, 1, 0, 1, 0, 3, 33.3, true)
ON CONFLICT (organization_id, scheme_version_id) DO NOTHING;

SELECT id INTO v_org_eudr_id
FROM public.organization_certification_schemes
WHERE organization_id = v_org_id AND scheme_version_id = v_eudr_ver_id;

SELECT id INTO v_org_ra_id
FROM public.organization_certification_schemes
WHERE organization_id = v_org_id AND scheme_version_id = v_ra_ver_id;

-- ===========================================================================
-- STEP 8: EVIDENCE RECORDS (6 records — varied lifecycle states)
-- ===========================================================================

-- EV1: Approved geospatial evidence (satisfies EUDR-ART3-GEO for parcel A)
INSERT INTO public.certification_evidence_records
  (id, organization_id, evidence_type, title, description,
   source_system, scope_level, scope_id,
   collected_at, valid_from, valid_until,
   lifecycle_status, file_hash_sha256, mime_type,
   geo_latitude, geo_longitude, geo_precision_m)
VALUES
  (v_ev_geo_id, v_org_id,
   'geospatial', 'Polígono GeoJSON — Parcela Norte A (verificado PRODES)',
   'Polígono verificado contra PRODES y GFW. Sin alertas de deforestación post 31-Dic-2020. Confianza: 97%.',
   'nova_guard', 'parcel', v_parcel_a,
   '2024-02-10 09:00:00+00', '2024-01-01', '2025-12-31',
   'approved',
   'a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
   'application/geo+json',
   9.9333, -84.0833, 3.2)
ON CONFLICT (id) DO NOTHING;

-- EV2: Approved traceability declaration (EUDR-ART9-TRACE, org-level)
INSERT INTO public.certification_evidence_records
  (id, organization_id, evidence_type, title, description,
   source_system, scope_level, scope_id,
   collected_at, valid_from, valid_until,
   lifecycle_status, mime_type, file_hash_sha256)
VALUES
  (v_ev_trace_id, v_org_id,
   'organizational', 'Declaración de trazabilidad cadena de suministro 2024',
   'Informe de trazabilidad completa desde finca hasta exportación. 127 productores verificados. Trazabilidad: 94%.',
   'external_auditor', 'organization', v_org_id,
   '2024-03-01 00:00:00+00', '2024-01-01', '2025-12-31',
   'approved', 'application/pdf',
   'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5')
ON CONFLICT (id) DO NOTHING;

-- EV3: Approved mass balance report (EUDR-ART9-MB, lot-level)
INSERT INTO public.certification_evidence_records
  (id, organization_id, evidence_type, title, description,
   source_system, scope_level, scope_id,
   collected_at, valid_from, valid_until,
   lifecycle_status, mime_type, file_hash_sha256)
VALUES
  (v_ev_mb_id, v_org_id,
   'financial', 'Balance de masa — Lote de exportación ENE-2024-001',
   'Reconciliación de volumen: 48,200 kg recibidos vs 47,900 kg procesados+vendidos+stock. Varianza: 0.62% (dentro de tolerancia 5%).',
   'compliance_hub', 'lot', v_lot_a,
   '2024-02-28 00:00:00+00', '2024-01-01', '2024-12-31',
   'approved', 'application/pdf',
   'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')
ON CONFLICT (id) DO NOTHING;

-- EV4: Approved audit report (RA labor — approved and anchored conceptually)
INSERT INTO public.certification_evidence_records
  (id, organization_id, evidence_type, title, description,
   source_system, scope_level, scope_id,
   collected_at, valid_from, valid_until,
   lifecycle_status, mime_type, file_hash_sha256)
VALUES
  (v_ev_audit_id, v_org_id,
   'social', 'Informe auditoría social RA 2020 — Cosecha 2023',
   'Auditoría de prácticas laborales realizada por Rainforest Alliance. Sin hallazgos de trabajo infantil o forzado. 127 trabajadores verificados.',
   'external_auditor', 'organization', v_org_id,
   '2024-01-20 00:00:00+00', '2024-01-01', '2025-12-31',
   'approved', 'application/pdf',
   'd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7')
ON CONFLICT (id) DO NOTHING;

-- EV5: Pending review — labor documentation (RA C4.1.1)
INSERT INTO public.certification_evidence_records
  (id, organization_id, evidence_type, title, description,
   source_system, scope_level, scope_id,
   collected_at, valid_from,
   lifecycle_status, mime_type)
VALUES
  (v_ev_labor_id, v_org_id,
   'labor', 'Registros de contratos laborales cosecha 2024',
   '127 contratos individuales de trabajadores. Pendiente revisión por certificador externo.',
   'manual', 'organization', v_org_id,
   '2024-10-01 00:00:00+00', '2024-10-01',
   'submitted', 'application/pdf')
ON CONFLICT (id) DO NOTHING;

-- EV6: Draft — due diligence statement (not yet complete)
INSERT INTO public.certification_evidence_records
  (id, organization_id, evidence_type, title, description,
   source_system, scope_level, scope_id,
   collected_at, valid_from,
   lifecycle_status, mime_type)
VALUES
  (v_ev_draft_id, v_org_id,
   'legal', 'BORRADOR — Declaración de Diligencia Debida TRACES NT',
   'Declaración de diligencia debida en preparación para envío a TRACES NT. Pendiente obtener número de referencia.',
   'manual', 'organization', v_org_id,
   '2024-11-01 00:00:00+00', '2024-11-01',
   'draft', 'application/pdf')
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- STEP 9: EVIDENCE LINKS (evidence ↔ requirements)
-- ===========================================================================
-- EV1 → EUDR-ART3-GEO (primary, 100% coverage)
INSERT INTO public.certification_evidence_links
  (organization_id, evidence_id, requirement_id, link_type, coverage_pct)
VALUES (v_org_id, v_ev_geo_id, v_req_eudr_geo_id, 'primary', 100)
ON CONFLICT (evidence_id, requirement_id) DO NOTHING;

-- EV2 → EUDR-ART9-TRACE (primary, 100%)
INSERT INTO public.certification_evidence_links
  (organization_id, evidence_id, requirement_id, link_type, coverage_pct)
VALUES (v_org_id, v_ev_trace_id, v_req_eudr_trace_id, 'primary', 100)
ON CONFLICT (evidence_id, requirement_id) DO NOTHING;

-- EV2 → RA2020-C4.1.1 (inferred via overlap rule, 60% coverage)
INSERT INTO public.certification_evidence_links
  (organization_id, evidence_id, requirement_id, link_type, coverage_pct, notes)
VALUES (v_org_id, v_ev_trace_id, v_req_ra_labor_id, 'inferred', 60,
        'Inferred via overlap: EUDR-ART9-TRACE covers 60% of RA2020-C4.1.1 worker identity scope')
ON CONFLICT (evidence_id, requirement_id) DO NOTHING;

-- EV3 → EUDR-ART9-MB (primary, 100%)
INSERT INTO public.certification_evidence_links
  (organization_id, evidence_id, requirement_id, link_type, coverage_pct)
VALUES (v_org_id, v_ev_mb_id, v_req_eudr_mb_id, 'primary', 100)
ON CONFLICT (evidence_id, requirement_id) DO NOTHING;

-- EV4 → RA2020-C4.1.1 (primary, 100%)
INSERT INTO public.certification_evidence_links
  (organization_id, evidence_id, requirement_id, link_type, coverage_pct)
VALUES (v_org_id, v_ev_audit_id, v_req_ra_labor_id, 'primary', 100)
ON CONFLICT (evidence_id, requirement_id) DO NOTHING;

-- EV5 → RA2020-C4.1.1 (supporting, pending_review)
INSERT INTO public.certification_evidence_links
  (organization_id, evidence_id, requirement_id, link_type, coverage_pct)
VALUES (v_org_id, v_ev_labor_id, v_req_ra_labor_id, 'supporting', 80)
ON CONFLICT (evidence_id, requirement_id) DO NOTHING;

-- ===========================================================================
-- STEP 10: COMPLIANCE EVALUATIONS (varied statuses for UI coverage)
-- ===========================================================================
INSERT INTO public.certification_requirement_evaluations
  (organization_id, requirement_id, scope_level, scope_id,
   compliance_status, evidence_count, primary_evidence_count,
   has_zero_tolerance_violation, evaluated_at, engine_version)
VALUES
  -- EUDR: Geospatial → compliant (approved geo evidence exists)
  (v_org_id, v_req_eudr_geo_id, 'parcel', v_parcel_a,
   'compliant', 1, 1, false, now() - interval '2 hours', '1.0.0'),

  -- EUDR: Traceability → compliant
  (v_org_id, v_req_eudr_trace_id, 'organization', v_org_id,
   'compliant', 1, 1, false, now() - interval '2 hours', '1.0.0'),

  -- EUDR: Due diligence → in_progress (only draft evidence exists)
  (v_org_id, v_req_eudr_doc_id, 'organization', v_org_id,
   'in_progress', 1, 0, false, now() - interval '2 hours', '1.0.0'),

  -- EUDR: Mass balance → compliant
  (v_org_id, v_req_eudr_mb_id, 'lot', v_lot_a,
   'compliant', 1, 1, false, now() - interval '2 hours', '1.0.0'),

  -- RA: Plausibility → not_started (no evidence yet)
  (v_org_id, v_req_ra_plaus_id, 'parcel', v_parcel_a,
   'not_started', 0, 0, false, now() - interval '2 hours', '1.0.0'),

  -- RA: Labor → in_progress (has inferred + pending evidence, not fully compliant)
  (v_org_id, v_req_ra_labor_id, 'organization', v_org_id,
   'in_progress', 3, 1, false, now() - interval '2 hours', '1.0.0'),

  -- RA: Water management → non_compliant (no evidence at all)
  (v_org_id, v_req_ra_water_id, 'organization', v_org_id,
   'non_compliant', 0, 0, false, now() - interval '2 hours', '1.0.0')

ON CONFLICT (organization_id, requirement_id, scope_level, scope_id)
DO UPDATE SET
  compliance_status   = EXCLUDED.compliance_status,
  evidence_count      = EXCLUDED.evidence_count,
  primary_evidence_count = EXCLUDED.primary_evidence_count,
  evaluated_at        = EXCLUDED.evaluated_at;

-- ===========================================================================
-- STEP 11: CORRECTIVE ACTIONS (3 varied states for /correctivas page)
-- ===========================================================================

-- CA1: Open blocking — EUDR geospatial issue on parcel B (hypothetical fail)
INSERT INTO public.certification_corrective_actions
  (id, organization_id, requirement_id, scope_level, scope_id,
   severity, is_blocking, status, title, description,
   due_date, created_at)
VALUES
  ('ca000000-0000-0000-0000-000000000001',
   v_org_id, v_req_eudr_geo_id, 'parcel', v_parcel_b,
   'zero_tolerance', true, 'open',
   '[AUTO] Alerta de deforestación confirmada — Parcela Sur B',
   'Análisis satelital PRODES detectó deforestación de 1.2 ha en parcela Sur B posterior al 31-Dic-2020. Fuente: PRODES 2023. Confianza: 89%. Acción requerida: verificar campo y aportar evidencia refutatoria o excluir parcela del alcance EUDR.',
   CURRENT_DATE + 7,
   now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- CA2: In progress — RA water documentation
INSERT INTO public.certification_corrective_actions
  (id, organization_id, requirement_id, scope_level, scope_id,
   severity, is_blocking, status, title, description, action_plan,
   due_date, created_at)
VALUES
  ('ca000000-0000-0000-0000-000000000002',
   v_org_id, v_req_ra_water_id, 'organization', v_org_id,
   'minor', false, 'in_progress',
   'Implementar registro de uso de agua en beneficio húmedo',
   'No se encontraron registros de uso de agua en el beneficio húmedo. Rainforest Alliance requiere medición y documentación mensual del consumo hídrico.',
   'Instalar medidor volumétrico en beneficio. Designar responsable de registro mensual. Subir evidencia fotográfica e informes trimestrales a plataforma.',
   CURRENT_DATE + 90,
   now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- CA3: Closed — resolved EUDR documentation issue
INSERT INTO public.certification_corrective_actions
  (id, organization_id, requirement_id, scope_level, scope_id,
   severity, is_blocking, status, title, description,
   resolution_description, due_date, closed_at, created_at)
VALUES
  ('ca000000-0000-0000-0000-000000000003',
   v_org_id, v_req_eudr_doc_id, 'organization', v_org_id,
   'major', false, 'closed',
   'Completar y enviar Declaración de Diligencia Debida a TRACES NT',
   'DDS no fue enviada previo al cierre del período anterior. Periodo en cuestión: exportación OCT-2023.',
   'DDS enviada a TRACES NT el 15-Nov-2023. Número de referencia obtenido: TRACES-2023-CR-008821. Declaración archivada en carpeta Certificación > EUDR > DDS.',
   CURRENT_DATE - 60,
   now() - interval '45 days',
   now() - interval '90 days')
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- STEP 12: READINESS SNAPSHOTS (30-day history for trend chart)
-- ===========================================================================
INSERT INTO public.certification_scheme_readiness_snapshots
  (organization_id, org_scheme_id, snapshot_date,
   total_requirements, compliant_count, non_compliant_count,
   blocked_count, in_progress_count, not_started_count,
   compliance_score, is_blocked)
VALUES
  (v_org_id, 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 4, 1, 1, 0, 2, 0, 25.0, false),
  (v_org_id, 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 4, 1, 1, 0, 2, 0, 25.0, false),
  (v_org_id, 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 4, 2, 1, 0, 1, 0, 50.0, false),
  (v_org_id, 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 4, 2, 1, 0, 1, 0, 50.0, false),
  (v_org_id, 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE - 5,  4, 3, 1, 0, 0, 0, 75.0, false),
  (v_org_id, 'd1000000-0000-0000-0000-000000000001', CURRENT_DATE,      4, 2, 1, 0, 1, 0, 50.0, false),

  (v_org_id, 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 3, 0, 1, 0, 1, 1, 0.0,  false),
  (v_org_id, 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 3, 0, 1, 0, 2, 0, 0.0,  false),
  (v_org_id, 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE - 5,  3, 1, 1, 0, 1, 0, 33.3, false),
  (v_org_id, 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE,      3, 1, 1, 0, 1, 0, 33.3, false)

ON CONFLICT (organization_id, org_scheme_id, snapshot_date) DO NOTHING;

END $$;
