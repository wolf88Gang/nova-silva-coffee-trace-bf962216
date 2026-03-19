-- Sales Intelligence — Full seed v1
-- Requires: 20250322000001, 20250322000002 (schema + questionnaire + sections)
-- Idempotent: uses ON CONFLICT / INSERT ... WHERE NOT EXISTS
-- Aligned with scripts/test_sales_pipeline.sql UUIDs
-- No giant JSON CTEs; stable codes and IDs.

-- ========== PREREQ CHECK ==========
DO $$
DECLARE
  v_q_id uuid;
BEGIN
  SELECT id INTO v_q_id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1;
  IF v_q_id IS NULL THEN
    RAISE EXCEPTION 'Questionnaire nova_sales_intel v1 not found. Run 20250322000002 first.';
  END IF;
END $$;

-- ========== SECTION IDS (from 20250322000002) ==========
-- context=a0000000-0001, pain=0002, maturity=0003, compliance=0004, urgency=0005, fit=0006, budget=0007, objections=0008

-- ========== QUESTIONS (28 from test) ==========
INSERT INTO public.sales_questions (id, questionnaire_id, section_id, code, text, question_type, position, is_required, is_active)
SELECT q.id, v_q.id, s.id, q.code, q.text, q.qtype::public.sales_question_type, q.pos, true, true
FROM (VALUES
  ('c0000000-0001-0000-0001-000000000001'::uuid, 'CTX_ORG_TYPE', 'Tipo de organización', 'single_select', 1),
  ('c0000000-0001-0000-0001-000000000002'::uuid, 'CTX_PRODUCERS', 'Cantidad de productores', 'single_select', 2),
  ('c0000000-0002-0000-0001-000000000002'::uuid, 'PAIN_REJECT', 'Lotes rechazados último año', 'single_select', 1),
  ('c0000000-0002-0000-0001-000000000003'::uuid, 'PAIN_HOURS', 'Horas/semana en trazabilidad manual', 'single_select', 2),
  ('c0000000-0002-0000-0001-000000000005'::uuid, 'PAIN_VISIBILITY', 'Visibilidad operativa actual', 'single_select', 4),
  ('c0000000-0002-0000-0001-000000000006'::uuid, 'PAIN_COST', 'Costo anual de rechazos/retrabajo', 'single_select', 5),
  ('c0000000-0002-0000-0001-000000000007'::uuid, 'PAIN_SEVERITY', 'Severidad percibida del problema', 'single_select', 6),
  ('c0000000-0003-0000-0001-000000000001'::uuid, 'MAT_SYSTEMS', 'Sistemas actuales de registro', 'single_select', 1),
  ('c0000000-0003-0000-0001-000000000002'::uuid, 'MAT_MOBILE', 'Uso de móvil en campo', 'single_select', 2),
  ('c0000000-0003-0000-0001-000000000003'::uuid, 'MAT_CONNECTIVITY', 'Conectividad en campo', 'single_select', 3),
  ('c0000000-0003-0000-0001-000000000004'::uuid, 'MAT_DATA', 'Formato de datos actual', 'single_select', 4),
  ('c0000000-0004-0000-0001-000000000002'::uuid, 'COMP_EUDR_AWARE', 'Conocimiento EUDR', 'single_select', 2),
  ('c0000000-0004-0000-0001-000000000003'::uuid, 'COMP_DUE_DILIGENCE', 'Due diligence actual', 'single_select', 3),
  ('c0000000-0004-0000-0001-000000000004'::uuid, 'COMP_GEO', 'Geo-verificación parcelas', 'single_select', 4),
  ('c0000000-0004-0000-0001-000000000005'::uuid, 'COMP_AUDIT_READY', 'Preparación para auditoría', 'single_select', 5),
  ('c0000000-0005-0000-0001-000000000001'::uuid, 'URG_TIMELINE', 'Timeline para cumplimiento', 'single_select', 1),
  ('c0000000-0005-0000-0001-000000000003'::uuid, 'URG_HARVEST', 'Próxima cosecha', 'single_select', 3),
  ('c0000000-0006-0000-0001-000000000001'::uuid, 'FIT_NEED_TRACE', 'Necesidad de trazabilidad', 'single_select', 1),
  ('c0000000-0006-0000-0001-000000000005'::uuid, 'FIT_OFFLINE', 'Importancia modo offline', 'single_select', 5),
  ('c0000000-0007-0000-0001-000000000001'::uuid, 'BUD_AVAILABLE', 'Presupuesto disponible', 'single_select', 1),
  ('c0000000-0007-0000-0001-000000000002'::uuid, 'BUD_DECISION', 'Quién decide la inversión', 'single_select', 2),
  ('c0000000-0007-0000-0001-000000000003'::uuid, 'BUD_RANGE', 'Rango de inversión anual', 'single_select', 3),
  ('c0000000-0007-0000-0001-000000000004'::uuid, 'BUD_ROI', 'Driver principal ROI', 'single_select', 4),
  ('c0000000-0007-0000-0001-000000000005'::uuid, 'BUD_TIMELINE', 'Timeline de decisión', 'single_select', 5),
  ('c0000000-0007-0000-0001-000000000006'::uuid, 'BUD_CURRENT_SPEND', 'Gasto actual en software', 'single_select', 6),
  ('c0000000-0008-0000-0001-000000000001'::uuid, 'OBJ_MAIN_CONCERN', 'Principal preocupación', 'single_select', 1),
  ('c0000000-0008-0000-0001-000000000002'::uuid, 'OBJ_PREV_FAIL', 'Experiencias previas fallidas', 'single_select', 2),
  ('c0000000-0008-0000-0001-000000000003'::uuid, 'OBJ_COMPETITION', 'Competencia actual', 'single_select', 3),
  ('c0000000-0008-0000-0001-000000000004'::uuid, 'OBJ_RESISTANCE', 'Nivel de resistencia interna', 'single_select', 4),
  ('c0000000-0008-0000-0001-000000000005'::uuid, 'OBJ_TRUST', 'Nivel de confianza en proveedores', 'single_select', 5),
  ('c0000000-0008-0000-0001-000000000006'::uuid, 'OBJ_NEEDS', 'Qué necesitan para avanzar', 'multi_select', 6)
) AS q(id, code, text, qtype, pos)
CROSS JOIN (SELECT id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1) v_q
CROSS JOIN LATERAL (
  SELECT s.id FROM public.sales_question_sections s
  WHERE s.questionnaire_id = v_q.id
    AND s.code = CASE
      WHEN q.code LIKE 'CTX_%' THEN 'context'
      WHEN q.code LIKE 'PAIN_%' THEN 'pain'
      WHEN q.code LIKE 'MAT_%' THEN 'maturity'
      WHEN q.code LIKE 'COMP_%' THEN 'compliance'
      WHEN q.code LIKE 'URG_%' THEN 'urgency'
      WHEN q.code LIKE 'FIT_%' THEN 'fit'
      WHEN q.code LIKE 'BUD_%' THEN 'budget'
      WHEN q.code LIKE 'OBJ_%' THEN 'objections'
      ELSE 'context'
    END
  LIMIT 1
) s
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  text = EXCLUDED.text,
  question_type = EXCLUDED.question_type,
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active;

-- ========== ANSWER OPTIONS (all used by test + objection rules) ==========
-- Pattern: d0000000-000X-000Y-0001-* (X=section, Y=question index in section)
INSERT INTO public.sales_answer_options (id, question_id, value, label, weight, position, is_active)
SELECT o.id, o.qid, o.value, o.label, o.weight, o.pos, true
FROM (VALUES
  ('d0000000-0001-0001-0001-000000000001'::uuid, 'c0000000-0001-0000-0001-000000000001'::uuid, 'cooperativa', 'Cooperativa', 10, 1),
  ('d0000000-0001-0002-0001-000000000003'::uuid, 'c0000000-0001-0000-0001-000000000002'::uuid, '200_500', '200-500', 15, 3),
  ('d0000000-0002-0002-0001-000000000003'::uuid, 'c0000000-0002-0000-0001-000000000002'::uuid, '4_plus', '4+ lotes', 25, 3),
  ('d0000000-0002-0003-0001-000000000004'::uuid, 'c0000000-0002-0000-0001-000000000003'::uuid, '30_plus', '30+ horas', 25, 4),
  ('d0000000-0002-0005-0001-000000000003'::uuid, 'c0000000-0002-0000-0001-000000000005'::uuid, 'none', 'Ninguna', 25, 3),
  ('d0000000-0002-0006-0001-000000000003'::uuid, 'c0000000-0002-0000-0001-000000000006'::uuid, '20k_50k', '20k-50k USD', 20, 3),
  ('d0000000-0002-0007-0001-000000000004'::uuid, 'c0000000-0002-0000-0001-000000000007'::uuid, 'critical', 'Crítico', 25, 4),
  ('d0000000-0003-0001-0001-000000000002'::uuid, 'c0000000-0003-0000-0001-000000000001'::uuid, 'spreadsheets', 'Hojas de cálculo', 5, 2),
  ('d0000000-0003-0002-0001-000000000002'::uuid, 'c0000000-0003-0000-0001-000000000002'::uuid, 'partial', 'Parcial', 10, 2),
  ('d0000000-0003-0003-0001-000000000002'::uuid, 'c0000000-0003-0000-0001-000000000003'::uuid, 'limited', 'Limitada', 10, 2),
  ('d0000000-0003-0004-0001-000000000002'::uuid, 'c0000000-0003-0000-0001-000000000004'::uuid, 'excel', 'Excel/CSV', 10, 2),
  ('d0000000-0004-0002-0001-000000000002'::uuid, 'c0000000-0004-0000-0001-000000000002'::uuid, 'heard', 'He oído hablar', 15, 2),
  ('d0000000-0004-0003-0001-000000000001'::uuid, 'c0000000-0004-0000-0001-000000000003'::uuid, 'none', 'Ninguno', 20, 1),
  ('d0000000-0004-0004-0001-000000000001'::uuid, 'c0000000-0004-0000-0001-000000000004'::uuid, 'none', 'Ninguna', 20, 1),
  ('d0000000-0004-0005-0001-000000000001'::uuid, 'c0000000-0004-0000-0001-000000000005'::uuid, 'no', 'No', 20, 1),
  ('d0000000-0005-0001-0001-000000000001'::uuid, 'c0000000-0005-0000-0001-000000000001'::uuid, 'lt3m', 'Menos de 3 meses', 25, 1),
  ('d0000000-0005-0003-0001-000000000001'::uuid, 'c0000000-0005-0000-0001-000000000003'::uuid, 'lt3m', 'Menos de 3 meses', 25, 1),
  ('d0000000-0006-0001-0001-000000000001'::uuid, 'c0000000-0006-0000-0001-000000000001'::uuid, 'full', 'Completa', 25, 1),
  ('d0000000-0006-0005-0001-000000000001'::uuid, 'c0000000-0006-0000-0001-000000000005'::uuid, 'critical', 'Crítica', 25, 1),
  ('d0000000-0007-0001-0001-000000000002'::uuid, 'c0000000-0007-0000-0001-000000000001'::uuid, 'pending', 'Pendiente', 5, 2),
  ('d0000000-0007-0002-0001-000000000002'::uuid, 'c0000000-0007-0000-0001-000000000002'::uuid, 'manager', 'Gerente', 15, 2),
  ('d0000000-0007-0003-0001-000000000002'::uuid, 'c0000000-0007-0000-0001-000000000003'::uuid, '5k_15k', '5k-15k USD', 20, 2),
  ('d0000000-0007-0004-0001-000000000002'::uuid, 'c0000000-0007-0000-0001-000000000004'::uuid, 'market_access', 'Acceso a mercado', 20, 2),
  ('d0000000-0007-0005-0001-000000000002'::uuid, 'c0000000-0007-0000-0001-000000000005'::uuid, 'next_3m', 'Próximos 3 meses', 20, 2),
  ('d0000000-0007-0006-0001-000000000002'::uuid, 'c0000000-0007-0000-0001-000000000006'::uuid, 'under_3k', 'Menos de 3k USD', 5, 2),
  ('d0000000-0008-0001-0001-000000000002'::uuid, 'c0000000-0008-0000-0001-000000000001'::uuid, 'complexity', 'Complejidad', 20, 2),
  ('d0000000-0008-0002-0001-000000000001'::uuid, 'c0000000-0008-0000-0001-000000000002'::uuid, 'bad_experience', 'Mala experiencia previa', 25, 1),
  ('d0000000-0008-0003-0001-000000000002'::uuid, 'c0000000-0008-0000-0001-000000000003'::uuid, 'passive', 'Pasiva', 10, 2),
  ('d0000000-0008-0004-0001-000000000002'::uuid, 'c0000000-0008-0000-0001-000000000004'::uuid, 'moderate', 'Moderada', 15, 2),
  ('d0000000-0008-0005-0001-000000000003'::uuid, 'c0000000-0008-0000-0001-000000000005'::uuid, 'low', 'Baja', 25, 3),
  ('d0000000-0008-0006-0001-000000000001'::uuid, 'c0000000-0008-0000-0001-000000000006'::uuid, 'demo', 'Demo', 15, 1),
  ('d0000000-0008-0006-0001-000000000003'::uuid, 'c0000000-0008-0000-0001-000000000006'::uuid, 'pilot', 'Piloto', 20, 3)
) AS o(id, qid, value, label, weight, pos)
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  weight = EXCLUDED.weight,
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active;

-- ========== SCORING RULES (per dimension: pain, maturity, objection, urgency, fit, budget_readiness) ==========
-- Maps answer options to score dimensions. Uses stable rule_code for idempotency.
INSERT INTO public.sales_scoring_rules (questionnaire_id, question_id, answer_option_id, score_dimension, weight, rule_code)
SELECT v_q.id, r.question_id, r.answer_option_id, r.score_dimension, r.weight, r.rule_code
FROM (VALUES
  ('c0000000-0002-0000-0001-000000000002'::uuid, 'd0000000-0002-0002-0001-000000000003'::uuid, 'pain', 25, 'pain_reject_4plus'),
  ('c0000000-0002-0000-0001-000000000003'::uuid, 'd0000000-0002-0003-0001-000000000004'::uuid, 'pain', 25, 'pain_hours_30plus'),
  ('c0000000-0002-0000-0001-000000000005'::uuid, 'd0000000-0002-0005-0001-000000000003'::uuid, 'pain', 25, 'pain_visibility_none'),
  ('c0000000-0002-0000-0001-000000000006'::uuid, 'd0000000-0002-0006-0001-000000000003'::uuid, 'pain', 20, 'pain_cost_20k50k'),
  ('c0000000-0002-0000-0001-000000000007'::uuid, 'd0000000-0002-0007-0001-000000000004'::uuid, 'pain', 25, 'pain_severity_critical'),
  ('c0000000-0003-0000-0001-000000000001'::uuid, 'd0000000-0003-0001-0001-000000000002'::uuid, 'maturity', 5, 'mat_systems_spreadsheets'),
  ('c0000000-0003-0000-0001-000000000002'::uuid, 'd0000000-0003-0002-0001-000000000002'::uuid, 'maturity', 10, 'mat_mobile_partial'),
  ('c0000000-0003-0000-0001-000000000003'::uuid, 'd0000000-0003-0003-0001-000000000002'::uuid, 'maturity', 10, 'mat_connectivity_limited'),
  ('c0000000-0004-0000-0001-000000000002'::uuid, 'd0000000-0004-0002-0001-000000000002'::uuid, 'objection', 15, 'comp_eudr_heard'),
  ('c0000000-0004-0000-0001-000000000003'::uuid, 'd0000000-0004-0003-0001-000000000001'::uuid, 'objection', 20, 'comp_dd_none'),
  ('c0000000-0004-0000-0001-000000000004'::uuid, 'd0000000-0004-0004-0001-000000000001'::uuid, 'objection', 20, 'comp_geo_none'),
  ('c0000000-0004-0000-0001-000000000005'::uuid, 'd0000000-0004-0005-0001-000000000001'::uuid, 'objection', 20, 'comp_audit_no'),
  ('c0000000-0005-0000-0001-000000000001'::uuid, 'd0000000-0005-0001-0001-000000000001'::uuid, 'urgency', 25, 'urg_timeline_lt3m'),
  ('c0000000-0005-0000-0001-000000000003'::uuid, 'd0000000-0005-0003-0001-000000000001'::uuid, 'urgency', 25, 'urg_harvest_lt3m'),
  ('c0000000-0006-0000-0001-000000000001'::uuid, 'd0000000-0006-0001-0001-000000000001'::uuid, 'fit', 25, 'fit_trace_full'),
  ('c0000000-0006-0000-0001-000000000005'::uuid, 'd0000000-0006-0005-0001-000000000001'::uuid, 'fit', 25, 'fit_offline_critical'),
  ('c0000000-0007-0000-0001-000000000001'::uuid, 'd0000000-0007-0001-0001-000000000002'::uuid, 'budget_readiness', 5, 'bud_avail_pending'),
  ('c0000000-0007-0000-0001-000000000002'::uuid, 'd0000000-0007-0002-0001-000000000002'::uuid, 'budget_readiness', 15, 'bud_decision_manager'),
  ('c0000000-0007-0000-0001-000000000003'::uuid, 'd0000000-0007-0003-0001-000000000002'::uuid, 'budget_readiness', 20, 'bud_range_5k15k'),
  ('c0000000-0007-0000-0001-000000000004'::uuid, 'd0000000-0007-0004-0001-000000000002'::uuid, 'budget_readiness', 20, 'bud_roi_market'),
  ('c0000000-0007-0000-0001-000000000005'::uuid, 'd0000000-0007-0005-0001-000000000002'::uuid, 'budget_readiness', 20, 'bud_timeline_next3m'),
  ('c0000000-0007-0000-0001-000000000006'::uuid, 'd0000000-0007-0006-0001-000000000002'::uuid, 'budget_readiness', 5, 'bud_spend_under3k'),
  ('c0000000-0008-0000-0001-000000000002'::uuid, 'd0000000-0008-0002-0001-000000000001'::uuid, 'objection', 25, 'obj_prev_fail_bad'),
  ('c0000000-0008-0000-0001-000000000005'::uuid, 'd0000000-0008-0005-0001-000000000003'::uuid, 'objection', 25, 'obj_trust_low')
) AS r(question_id, answer_option_id, score_dimension, weight, rule_code)
CROSS JOIN (SELECT id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1) v_q
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_scoring_rules sr
  WHERE sr.questionnaire_id = v_q.id AND sr.rule_code = r.rule_code
);

-- ========== OBJECTION RULES ==========
INSERT INTO public.sales_objection_rules (questionnaire_id, question_id, answer_option_id, objection_type, confidence, rule_code)
SELECT v_q.id, r.question_id, r.answer_option_id, r.objection_type::public.sales_objection_type, r.confidence, r.rule_code
FROM (VALUES
  ('c0000000-0007-0000-0001-000000000006'::uuid, 'd0000000-0007-0006-0001-000000000002'::uuid, 'price', 0.55, 'bud_spend_low_price'),
  ('c0000000-0008-0000-0001-000000000001'::uuid, 'd0000000-0008-0001-0001-000000000002'::uuid, 'complexity', 0.60, 'obj_main_complexity'),
  ('c0000000-0008-0000-0001-000000000002'::uuid, 'd0000000-0008-0002-0001-000000000001'::uuid, 'trust', 0.65, 'obj_prev_fail_trust'),
  ('c0000000-0008-0000-0001-000000000005'::uuid, 'd0000000-0008-0005-0001-000000000003'::uuid, 'trust', 0.60, 'obj_trust_low'),
  ('c0000000-0004-0000-0001-000000000003'::uuid, 'd0000000-0004-0003-0001-000000000001'::uuid, 'compliance_fear', 0.55, 'comp_dd_none_fear'),
  ('c0000000-0004-0000-0001-000000000005'::uuid, 'd0000000-0004-0005-0001-000000000001'::uuid, 'compliance_fear', 0.55, 'comp_audit_no_fear')
) AS r(question_id, answer_option_id, objection_type, confidence, rule_code)
CROSS JOIN (SELECT id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1) v_q
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_objection_rules sor
  WHERE sor.questionnaire_id = v_q.id AND sor.rule_code = r.rule_code
);
