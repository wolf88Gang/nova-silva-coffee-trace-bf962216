-- =============================================================================
-- Sales Pipeline: Full Simulation
-- Scenario: High compliance pressure + low digital maturity + price objection
--
-- Run as: postgres role in Supabase SQL editor (or psql)
-- RPCs use auth.uid() internally — this script inlines the same logic
-- without the _ensure_internal guard so it can run in SQL context.
-- Wrap in BEGIN/ROLLBACK to leave the DB clean after inspection.
-- =============================================================================

BEGIN;

-- ─── Fixed UUIDs for reproducibility ─────────────────────────────────────────

DO $$ BEGIN
  -- Clean up any previous run of this test
  DELETE FROM public.sales_sessions         WHERE id = '00000000-0000-0000-0001-000000000001';
  DELETE FROM public.sales_questionnaires   WHERE code = 'TEST_DIAG_V1' AND version = 1;
  DELETE FROM public.organizations          WHERE id = '00000000-0000-0000-0000-000000000001';
END $$;

-- ─── 1. Organization ─────────────────────────────────────────────────────────

INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', '[TEST] Cooperativa Exportadora Demo')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Questionnaire ────────────────────────────────────────────────────────

INSERT INTO public.sales_questionnaires (id, code, version, title, is_active)
VALUES (
  '00000000-0000-0000-0010-000000000001',
  'TEST_DIAG_V1', 1,
  'Diagnóstico Comercial Nova Silva v1 [TEST]',
  true
);

-- ─── 3. Sections ─────────────────────────────────────────────────────────────

INSERT INTO public.sales_question_sections (id, questionnaire_id, position, code, title, is_active)
VALUES
  ('00000000-0000-0000-0020-000000000001', '00000000-0000-0000-0010-000000000001', 1, 'CONTEXTO',    'Contexto de la Organización', true),
  ('00000000-0000-0000-0020-000000000002', '00000000-0000-0000-0010-000000000001', 2, 'DOLOR',       'Dolor y Urgencia',            true),
  ('00000000-0000-0000-0020-000000000003', '00000000-0000-0000-0010-000000000001', 3, 'MADUREZ',     'Madurez Digital',             true),
  ('00000000-0000-0000-0020-000000000004', '00000000-0000-0000-0010-000000000001', 4, 'PRESUPUESTO', 'Presupuesto y Decisión',      true);

-- ─── 4. Questions ─────────────────────────────────────────────────────────────

INSERT INTO public.sales_questions (id, questionnaire_id, section_id, position, code, text, question_type, is_required, is_active)
VALUES
  -- CONTEXTO
  ('00000000-0000-0000-0030-000000000001',
   '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0020-000000000001',
   1, 'Q_EU_MARKET',
   '¿Exporta o planea exportar café a la Unión Europea?',
   'single_select', true, true),

  -- DOLOR
  ('00000000-0000-0000-0030-000000000002',
   '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0020-000000000002',
   1, 'Q_PAIN_OPS',
   '¿Tiene problemas con trazabilidad manual o lotes rechazados por falta de documentación?',
   'boolean', true, true),

  -- MADUREZ
  ('00000000-0000-0000-0030-000000000003',
   '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0020-000000000003',
   1, 'Q_DIGITAL',
   '¿Qué sistemas digitales usa actualmente para gestión de productores y entregas?',
   'single_select', true, true),

  -- PRESUPUESTO
  ('00000000-0000-0000-0030-000000000004',
   '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0020-000000000004',
   1, 'Q_BUDGET',
   '¿Cuál es el presupuesto estimado para digitalización este año?',
   'single_select', true, true);

-- ─── 5. Answer Options ────────────────────────────────────────────────────────

INSERT INTO public.sales_answer_options (id, question_id, position, value, label, weight, is_active)
VALUES
  -- Q_EU_MARKET
  ('00000000-0000-0000-0040-000000000001', '00000000-0000-0000-0030-000000000001', 1, 'yes', 'Sí, exportamos o planeamos exportar a la UE', 1.0, true),
  ('00000000-0000-0000-0040-000000000002', '00000000-0000-0000-0030-000000000001', 2, 'no',  'No, nuestros mercados son locales o no-UE',   0.0, true),

  -- Q_DIGITAL
  ('00000000-0000-0000-0050-000000000001', '00000000-0000-0000-0030-000000000003', 1, 'none',         'Ninguno — usamos papel y llamadas',          0.0, true),
  ('00000000-0000-0000-0050-000000000002', '00000000-0000-0000-0030-000000000003', 2, 'spreadsheets', 'Excel / hojas de cálculo',                   0.3, true),
  ('00000000-0000-0000-0050-000000000003', '00000000-0000-0000-0030-000000000003', 3, 'basic_erp',    'ERP o sistema básico de gestión',            0.6, true),
  ('00000000-0000-0000-0050-000000000004', '00000000-0000-0000-0030-000000000003', 4, 'full_digital', 'Plataforma digital integrada para el campo', 1.0, true),

  -- Q_BUDGET
  ('00000000-0000-0000-0060-000000000001', '00000000-0000-0000-0030-000000000004', 1, 'under_10k', 'Menos de USD 10,000 / año',   0.1, true),
  ('00000000-0000-0000-0060-000000000002', '00000000-0000-0000-0030-000000000004', 2, '10k_50k',   'USD 10,000 – 50,000 / año',   0.5, true),
  ('00000000-0000-0000-0060-000000000003', '00000000-0000-0000-0030-000000000004', 3, '50k_plus',  'Más de USD 50,000 / año',     1.0, true);

-- ─── 6. Scoring Rules ─────────────────────────────────────────────────────────

INSERT INTO public.sales_scoring_rules
  (id, questionnaire_id, name, score_field, question_id, operator, answer_option_id, expected_boolean, weight, priority, is_active)
VALUES
  -- EU market → pain + urgency
  ('00000000-0000-0000-0070-000000000001',
   '00000000-0000-0000-0010-000000000001',
   'EU market exposure → pain',
   'score_pain', '00000000-0000-0000-0030-000000000001', 'option_in',
   '00000000-0000-0000-0040-000000000001', NULL, 40, 10, true),

  ('00000000-0000-0000-0070-000000000002',
   '00000000-0000-0000-0010-000000000001',
   'EU market exposure → urgency',
   'score_urgency', '00000000-0000-0000-0030-000000000001', 'option_in',
   '00000000-0000-0000-0040-000000000001', NULL, 25, 10, true),

  -- Operational pain (boolean)
  ('00000000-0000-0000-0070-000000000003',
   '00000000-0000-0000-0010-000000000001',
   'Operational pain confirmed → pain',
   'score_pain', '00000000-0000-0000-0030-000000000002', 'boolean_equals',
   NULL, true, 30, 10, true),

  -- Digital maturity: none → low fit
  ('00000000-0000-0000-0070-000000000004',
   '00000000-0000-0000-0010-000000000001',
   'No digital systems → low fit signal',
   'score_fit', '00000000-0000-0000-0030-000000000003', 'option_in',
   '00000000-0000-0000-0050-000000000001', NULL, 10, 20, true),

  -- Digital maturity: spreadsheets → low maturity
  ('00000000-0000-0000-0070-000000000005',
   '00000000-0000-0000-0010-000000000001',
   'Spreadsheets → low maturity',
   'score_maturity', '00000000-0000-0000-0030-000000000003', 'option_in',
   '00000000-0000-0000-0050-000000000002', NULL, 10, 20, true),

  -- Budget: under_10k → low budget readiness
  ('00000000-0000-0000-0070-000000000006',
   '00000000-0000-0000-0010-000000000001',
   'Under 10k budget → low readiness',
   'score_budget_readiness', '00000000-0000-0000-0030-000000000004', 'option_in',
   '00000000-0000-0000-0060-000000000001', NULL, 10, 10, true),

  -- Budget: 10k-50k → medium budget readiness
  ('00000000-0000-0000-0070-000000000007',
   '00000000-0000-0000-0010-000000000001',
   '10k-50k budget → medium readiness',
   'score_budget_readiness', '00000000-0000-0000-0030-000000000004', 'option_in',
   '00000000-0000-0000-0060-000000000002', NULL, 35, 10, true),

  -- Budget: 50k+ → high budget readiness
  ('00000000-0000-0000-0070-000000000008',
   '00000000-0000-0000-0010-000000000001',
   '50k+ budget → high readiness',
   'score_budget_readiness', '00000000-0000-0000-0030-000000000004', 'option_in',
   '00000000-0000-0000-0060-000000000003', NULL, 70, 10, true);

-- ─── 7. Objection Rules ───────────────────────────────────────────────────────

INSERT INTO public.sales_objection_rules
  (id, questionnaire_id, name, objection_type, base_confidence, question_id, operator, answer_option_id, expected_boolean, priority, is_active)
VALUES
  -- EU market → compliance_fear
  ('00000000-0000-0000-0080-000000000001',
   '00000000-0000-0000-0010-000000000001',
   'EU market → compliance fear',
   'compliance_fear', 0.70,
   '00000000-0000-0000-0030-000000000001', 'option_in',
   '00000000-0000-0000-0040-000000000001', NULL, 10, true),

  -- Budget under 10k → price objection
  ('00000000-0000-0000-0080-000000000002',
   '00000000-0000-0000-0010-000000000001',
   'Low budget → price objection',
   'price', 0.65,
   '00000000-0000-0000-0030-000000000004', 'option_in',
   '00000000-0000-0000-0060-000000000001', NULL, 10, true),

  -- No digital systems → complexity objection
  ('00000000-0000-0000-0080-000000000003',
   '00000000-0000-0000-0010-000000000001',
   'No systems → complexity objection',
   'complexity', 0.40,
   '00000000-0000-0000-0030-000000000003', 'option_in',
   '00000000-0000-0000-0050-000000000001', NULL, 20, true);

-- ─── 8. Session ──────────────────────────────────────────────────────────────

INSERT INTO public.sales_sessions
  (id, organization_id, questionnaire_id, questionnaire_version,
   lead_name, lead_company, lead_type, commercial_stage, status)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0010-000000000001', 1,
  'María Fernanda Ruiz', 'Cooperativa Los Altos', 'cooperativa',
  'qualified', 'draft'
);

-- ─── 9. Answers (test scenario) ──────────────────────────────────────────────
-- Q_EU_MARKET  = yes        → compliance_fear + pain(40) + urgency(25)
-- Q_PAIN_OPS   = true       → pain(30)
-- Q_DIGITAL    = none       → low maturity(0), fit(10), complexity objection
-- Q_BUDGET     = under_10k  → budget_readiness(10), price objection

INSERT INTO public.sales_session_answers
  (session_id, question_id, answer_option_ids, answer_boolean)
VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0030-000000000001',
   ARRAY['00000000-0000-0000-0040-000000000001'::uuid], NULL),   -- Q_EU_MARKET = yes

  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0030-000000000002',
   NULL, true),                                                  -- Q_PAIN_OPS = true

  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0030-000000000003',
   ARRAY['00000000-0000-0000-0050-000000000001'::uuid], NULL),   -- Q_DIGITAL = none

  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0030-000000000004',
   ARRAY['00000000-0000-0000-0060-000000000001'::uuid], NULL);   -- Q_BUDGET = under_10k


-- =============================================================================
-- PIPELINE SIMULATION (inline — bypasses _ensure_internal for SQL context)
-- =============================================================================

DO $$
DECLARE
  p_session_id  uuid := '00000000-0000-0000-0001-000000000001';
  v_q_id        uuid;
  v_rule        RECORD;
  v_applies     boolean;
  v_evidence    jsonb;

  -- Score accumulators
  v_spain       numeric := 0;
  v_smaturity   numeric := 0;
  v_sobjection  numeric := 0;
  v_surgency    numeric := 0;
  v_sfit        numeric := 0;
  v_sbudget     numeric := 0;
  v_stotal      numeric := 0;

  -- Recalibration
  v_scores      RECORD;

BEGIN
  SELECT questionnaire_id INTO v_q_id
  FROM public.sales_sessions WHERE id = p_session_id;

  -- ── STEP 1: Recalculate Scores ─────────────────────────────────────────────

  DELETE FROM public.sales_session_scores     WHERE session_id = p_session_id;
  DELETE FROM public.sales_session_rule_hits  WHERE session_id = p_session_id AND rule_type = 'scoring';

  FOR v_rule IN
    SELECT * FROM public.sales_scoring_rules
    WHERE questionnaire_id = v_q_id AND is_active = true
    ORDER BY priority, created_at, id
  LOOP
    v_applies := false;

    IF v_rule.operator = 'option_in' THEN
      v_applies := EXISTS (
        SELECT 1 FROM public.sales_session_answers a
        WHERE a.session_id = p_session_id
          AND a.question_id = v_rule.question_id
          AND a.answer_option_ids IS NOT NULL
          AND v_rule.answer_option_id = ANY(a.answer_option_ids)
      );
    ELSIF v_rule.operator = 'boolean_equals' THEN
      v_applies := EXISTS (
        SELECT 1 FROM public.sales_session_answers a
        WHERE a.session_id = p_session_id
          AND a.question_id = v_rule.question_id
          AND a.answer_boolean IS NOT DISTINCT FROM v_rule.expected_boolean
      );
    END IF;

    IF v_applies THEN
      IF    v_rule.score_field = 'score_pain'             THEN v_spain     := v_spain     + v_rule.weight;
      ELSIF v_rule.score_field = 'score_maturity'         THEN v_smaturity := v_smaturity + v_rule.weight;
      ELSIF v_rule.score_field = 'score_urgency'          THEN v_surgency  := v_surgency  + v_rule.weight;
      ELSIF v_rule.score_field = 'score_fit'              THEN v_sfit      := v_sfit      + v_rule.weight;
      ELSIF v_rule.score_field = 'score_budget_readiness' THEN v_sbudget   := v_sbudget   + v_rule.weight;
      ELSIF v_rule.score_field = 'score_objection'        THEN v_sobjection:= v_sobjection+ v_rule.weight;
      ELSIF v_rule.score_field = 'score_total'            THEN v_stotal    := v_stotal    + v_rule.weight;
      END IF;

      INSERT INTO public.sales_session_rule_hits
        (session_id, rule_type, rule_id, score_field, weight)
      VALUES (p_session_id, 'scoring', v_rule.id, v_rule.score_field, v_rule.weight)
      ON CONFLICT (session_id, rule_type, rule_id) DO NOTHING;
    END IF;
  END LOOP;

  v_stotal := v_stotal + v_spain + v_smaturity + v_sobjection + v_surgency + v_sfit + v_sbudget;

  INSERT INTO public.sales_session_scores (session_id, score_field, value) VALUES
    (p_session_id, 'score_pain',             v_spain),
    (p_session_id, 'score_maturity',         v_smaturity),
    (p_session_id, 'score_objection',        v_sobjection),
    (p_session_id, 'score_urgency',          v_surgency),
    (p_session_id, 'score_fit',              v_sfit),
    (p_session_id, 'score_budget_readiness', v_sbudget),
    (p_session_id, 'score_total',            v_stotal);

  UPDATE public.sales_sessions SET
    score_pain             = v_spain,
    score_maturity         = v_smaturity,
    score_objection        = v_sobjection,
    score_urgency          = v_surgency,
    score_fit              = v_sfit,
    score_budget_readiness = v_sbudget,
    score_total            = v_stotal,
    updated_at             = now()
  WHERE id = p_session_id;

  RAISE NOTICE '── SCORES ── pain=% maturity=% urgency=% fit=% budget=% objection=% total=%',
    v_spain, v_smaturity, v_surgency, v_sfit, v_sbudget, v_sobjection, v_stotal;

  -- ── STEP 2: Detect Objections (base rules) ─────────────────────────────────

  DELETE FROM public.sales_session_objections WHERE session_id = p_session_id;
  DELETE FROM public.sales_session_rule_hits  WHERE session_id = p_session_id AND rule_type = 'objection';

  FOR v_rule IN
    SELECT * FROM public.sales_objection_rules
    WHERE questionnaire_id = v_q_id AND is_active = true
    ORDER BY priority, created_at, id
  LOOP
    v_applies  := false;
    v_evidence := '{}'::jsonb;

    IF v_rule.operator = 'option_in' THEN
      v_applies := EXISTS (
        SELECT 1 FROM public.sales_session_answers a
        WHERE a.session_id = p_session_id
          AND a.question_id = v_rule.question_id
          AND v_rule.answer_option_id = ANY(a.answer_option_ids)
      );
      IF v_applies THEN
        v_evidence := jsonb_build_object('question_id', v_rule.question_id, 'answer_option_id', v_rule.answer_option_id);
      END IF;
    ELSIF v_rule.operator = 'boolean_equals' THEN
      v_applies := EXISTS (
        SELECT 1 FROM public.sales_session_answers a
        WHERE a.session_id = p_session_id
          AND a.question_id = v_rule.question_id
          AND a.answer_boolean IS NOT DISTINCT FROM v_rule.expected_boolean
      );
    END IF;

    IF v_applies THEN
      INSERT INTO public.sales_session_objections
        (session_id, objection_type, confidence, source_rule, evidence)
      VALUES (p_session_id, v_rule.objection_type, v_rule.base_confidence, v_rule.id, v_evidence)
      ON CONFLICT (session_id, objection_type, source_rule) DO NOTHING;

      INSERT INTO public.sales_session_rule_hits
        (session_id, rule_type, rule_id, objection_type, confidence, evidence)
      VALUES (p_session_id, 'objection', v_rule.id, v_rule.objection_type, v_rule.base_confidence, v_evidence)
      ON CONFLICT (session_id, rule_type, rule_id) DO NOTHING;
    END IF;
  END LOOP;

  -- ── STEP 3: Recalibrate Objections ─────────────────────────────────────────

  SELECT score_urgency, score_budget_readiness INTO v_scores
  FROM public.sales_sessions WHERE id = p_session_id;

  -- (A) Repetition — no multi-rule types in this scenario, no-op

  -- (B) Absence of urgency (score_urgency = 25 < 30)
  IF v_scores.score_urgency < 30 THEN
    UPDATE public.sales_session_objections
    SET confidence = LEAST(1.0, confidence + 0.15),
        evidence   = evidence || jsonb_build_object('behavioral_boost','no_urgency','urgency_score', v_scores.score_urgency)
    WHERE session_id = p_session_id AND objection_type IN ('timing','price');
  END IF;

  -- (C) Budget gap (score_budget_readiness = 10 < 25)
  IF v_scores.score_budget_readiness < 25 THEN
    UPDATE public.sales_session_objections
    SET confidence = LEAST(1.0, confidence + 0.20),
        evidence   = evidence || jsonb_build_object('behavioral_boost','budget_gap','budget_score', v_scores.score_budget_readiness)
    WHERE session_id = p_session_id AND objection_type = 'price';
  END IF;

  -- (F) Infer timing — score_urgency = 25 ≠ 0, skip
  -- (G) Infer price  — price already exists, NOT EXISTS guard skips

  RAISE NOTICE '── OBJECTIONS RECALIBRATED ──';

  -- ── STEP 4: Generate Recommendations ──────────────────────────────────────
  -- Signals: has_compliance=T, has_price=T, has_complexity=T
  --          high_pain=T(70>=60), low_maturity=T(0<40), has_urgency=F(25<40)
  --          high_objection=T(count=3>=2), budget_gap=T(10<=25)
  -- Expected: EUDR pitch, EUDR+low_mat demo, Pro Compliance plan, EUDR audit next_step

  DELETE FROM public.sales_session_recommendations WHERE session_id = p_session_id;

  DECLARE
    v_high_pain         boolean;
    v_low_maturity      boolean;
    v_has_urgency       boolean;
    v_high_objection    boolean;
    v_budget_gap        boolean;
    v_has_compliance    boolean;
    v_has_trust         boolean;
    v_has_price         boolean;
    v_has_complexity    boolean;
    v_has_no_priority   boolean;
    v_has_adoption_risk boolean;
    v_objection_count   integer;
    v_s2                RECORD;
  BEGIN
    SELECT * INTO v_s2 FROM public.sales_sessions WHERE id = p_session_id;

    v_high_pain      := coalesce(v_s2.score_pain,0)              >= 60;
    v_low_maturity   := coalesce(v_s2.score_maturity,0)          <  40;
    v_has_urgency    := coalesce(v_s2.score_urgency,0)           >= 40;
    v_budget_gap     := coalesce(v_s2.score_budget_readiness,0)  <= 25;

    SELECT
      COUNT(DISTINCT objection_type),
      bool_or(objection_type = 'compliance_fear'),
      bool_or(objection_type = 'trust'),
      bool_or(objection_type = 'price'),
      bool_or(objection_type = 'complexity'),
      bool_or(objection_type = 'no_priority'),
      bool_or(objection_type = 'adoption_risk')
    INTO v_objection_count, v_has_compliance, v_has_trust, v_has_price,
         v_has_complexity, v_has_no_priority, v_has_adoption_risk
    FROM public.sales_session_objections WHERE session_id = p_session_id;

    v_has_compliance  := coalesce(v_has_compliance, false);
    v_has_trust       := coalesce(v_has_trust,      false);
    v_has_price       := coalesce(v_has_price,      false);
    v_has_no_priority := coalesce(v_has_no_priority,false);
    v_objection_count := coalesce(v_objection_count,0);
    v_high_objection  := coalesce(v_s2.score_objection,0) >= 30 OR v_objection_count >= 2;

    RAISE NOTICE '── SIGNALS ── high_pain=% low_maturity=% has_urgency=% high_objection=% compliance=% price=% budget_gap=%',
      v_high_pain, v_low_maturity, v_has_urgency, v_high_objection,
      v_has_compliance, v_has_price, v_budget_gap;

    -- PITCH
    IF v_has_compliance THEN
      INSERT INTO public.sales_session_recommendations
        (session_id, recommendation_type, title, description, payload, priority)
      VALUES (p_session_id, 'pitch', 'EUDR como ventaja competitiva',
        'El miedo al incumplimiento es la apertura.',
        jsonb_build_object('signal','compliance_fear','urgency','high','pitch_angle','eudr_competitive_moat'), 10);
    END IF;

    -- DEMO
    IF v_has_compliance AND v_low_maturity THEN
      INSERT INTO public.sales_session_recommendations
        (session_id, recommendation_type, title, description, payload, priority)
      VALUES (p_session_id, 'demo', 'EUDR paso a paso: desde el productor hasta el due diligence',
        'Demo guiada de cumplimiento completo para equipos con poca experiencia.',
        jsonb_build_object('signal','compliance_fear_low_maturity','demo_type','eudr_guided_onboarding','duration_min',45), 20);
    END IF;

    -- PLAN
    IF v_has_compliance THEN
      INSERT INTO public.sales_session_recommendations
        (session_id, recommendation_type, title, description, payload, priority)
      VALUES (p_session_id, 'plan', 'Plan Pro Compliance',
        'El driver principal es EUDR.',
        jsonb_build_object('signal','compliance_fear','plan_code','pro_compliance','tier','pro'), 30);
    END IF;

    -- NEXT STEP
    IF v_has_compliance AND NOT v_has_no_priority THEN
      INSERT INTO public.sales_session_recommendations
        (session_id, recommendation_type, title, description, payload, priority)
      VALUES (p_session_id, 'next_step', 'Auditoría EUDR gratuita: mapear gap actual vs requisitos',
        'Ofrecer auditoría de cumplimiento EUDR sin costo.',
        jsonb_build_object('signal','compliance_fear','action','free_eudr_audit','urgency','high','timeline','5 días hábiles'), 40);
    END IF;

    RAISE NOTICE '── RECOMMENDATIONS inserted: %',
      (SELECT COUNT(*) FROM public.sales_session_recommendations WHERE session_id = p_session_id);
  END;

END $$;


-- =============================================================================
-- OUTPUT: Read Results
-- =============================================================================

-- ── Scores ────────────────────────────────────────────────────────────────────
SELECT
  score_field,
  value,
  CASE score_field
    WHEN 'score_pain'             THEN CASE WHEN value >= 60 THEN '🔴 HIGH' WHEN value >= 35 THEN '🟡 MEDIUM' ELSE '⚪ LOW' END
    WHEN 'score_maturity'         THEN CASE WHEN value >= 60 THEN '🟢 HIGH' WHEN value >= 40 THEN '🟡 MEDIUM' ELSE '🔴 LOW' END
    WHEN 'score_urgency'          THEN CASE WHEN value >= 40 THEN '🔴 HAS'  ELSE '⚪ NONE' END
    WHEN 'score_fit'              THEN CASE WHEN value <= 25 THEN '🔴 LOW'  ELSE '🟢 OK' END
    WHEN 'score_budget_readiness' THEN CASE WHEN value <= 25 THEN '🔴 GAP'  ELSE '🟢 OK' END
    ELSE NULL
  END AS signal
FROM public.sales_session_scores
WHERE session_id = '00000000-0000-0000-0001-000000000001'
ORDER BY ARRAY_POSITION(
  ARRAY['score_pain','score_maturity','score_urgency','score_fit','score_budget_readiness','score_objection','score_total'],
  score_field::text
);

-- ── Objections (ranked by effective confidence) ───────────────────────────────
SELECT * FROM public.fn_sales_get_objection_summary('00000000-0000-0000-0001-000000000001');

-- ── Recommendations (in priority order) ──────────────────────────────────────
SELECT
  priority,
  recommendation_type,
  title,
  payload->>'signal'      AS triggered_by,
  payload->>'urgency'     AS urgency,
  payload->>'cta'         AS cta,
  payload->>'action'      AS action,
  payload->>'plan_code'   AS plan_code,
  payload->>'demo_type'   AS demo_type,
  payload->>'duration_min'AS demo_minutes
FROM public.sales_session_recommendations
WHERE session_id = '00000000-0000-0000-0001-000000000001'
ORDER BY priority;

-- ── Raw objection evidence trail ──────────────────────────────────────────────
SELECT
  objection_type,
  ROUND(confidence, 3) AS confidence,
  CASE WHEN source_rule IS NULL THEN 'behavioral' ELSE 'rule' END AS origin,
  evidence
FROM public.sales_session_objections
WHERE session_id = '00000000-0000-0000-0001-000000000001'
ORDER BY confidence DESC;

ROLLBACK;  -- Remove: keep as COMMIT if you want to persist the test data
