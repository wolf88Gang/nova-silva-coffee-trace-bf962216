-- Sales Intelligence — RPC core
-- fn_sales_create_session, fn_sales_save_answer, fn_sales_recalculate_scores, fn_sales_detect_objections
-- Requiere: 20250322000001, 20250322000002 (schema + seed)

-- ========== fn_sales_create_session ==========
CREATE OR REPLACE FUNCTION public.fn_sales_create_session(
  p_organization_id uuid,
  p_questionnaire_code text,
  p_questionnaire_version integer DEFAULT 1,
  p_lead_name text DEFAULT NULL,
  p_lead_company text DEFAULT NULL,
  p_lead_type text DEFAULT NULL,
  p_commercial_stage text DEFAULT 'lead',
  p_owner_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q_id uuid;
  v_session_id uuid;
BEGIN
  PERFORM public._ensure_internal();

  SELECT id INTO v_q_id
  FROM public.sales_questionnaires
  WHERE code = p_questionnaire_code AND version = p_questionnaire_version AND is_active;

  IF v_q_id IS NULL THEN
    RAISE EXCEPTION 'Questionnaire not found: % v%', p_questionnaire_code, p_questionnaire_version;
  END IF;

  INSERT INTO public.sales_sessions (
    organization_id, questionnaire_id, questionnaire_version,
    lead_name, lead_company, lead_type, commercial_stage, owner_user_id, metadata
  )
  VALUES (
    p_organization_id, v_q_id, p_questionnaire_version,
    p_lead_name, p_lead_company, p_lead_type, p_commercial_stage, p_owner_user_id, p_metadata
  )
  RETURNING id INTO v_session_id;

  INSERT INTO public.sales_session_events (session_id, event_type, created_by)
  VALUES (v_session_id, 'created', auth.uid());

  RETURN v_session_id;
END;
$$;

-- ========== fn_sales_save_answer ==========
CREATE OR REPLACE FUNCTION public.fn_sales_save_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_answer_text text DEFAULT NULL,
  p_answer_number numeric DEFAULT NULL,
  p_answer_boolean boolean DEFAULT NULL,
  p_answer_option_ids uuid[] DEFAULT NULL,
  p_answer_json jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public._ensure_internal();

  INSERT INTO public.sales_session_answers (
    session_id, question_id, answer_text, answer_number, answer_boolean,
    answer_option_ids, answer_json
  )
  VALUES (
    p_session_id, p_question_id, p_answer_text, p_answer_number, p_answer_boolean,
    p_answer_option_ids, p_answer_json
  )
  ON CONFLICT (session_id, question_id) DO UPDATE SET
    answer_text = EXCLUDED.answer_text,
    answer_number = EXCLUDED.answer_number,
    answer_boolean = EXCLUDED.answer_boolean,
    answer_option_ids = EXCLUDED.answer_option_ids,
    answer_json = EXCLUDED.answer_json;

  INSERT INTO public.sales_session_events (session_id, event_type, payload, created_by)
  VALUES (p_session_id, 'answer_saved', jsonb_build_object('question_id', p_question_id), auth.uid());
END;
$$;

-- ========== fn_sales_recalculate_scores ==========
CREATE OR REPLACE FUNCTION public.fn_sales_recalculate_scores(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q_id uuid;
  v_pain integer := 0;
  v_maturity integer := 0;
  v_objection integer := 0;
  v_urgency integer := 0;
  v_fit integer := 0;
  v_budget integer := 0;
  v_total integer := 0;
  r RECORD;
BEGIN
  PERFORM public._ensure_internal();

  SELECT questionnaire_id INTO v_q_id FROM public.sales_sessions WHERE id = p_session_id;
  IF v_q_id IS NULL THEN RAISE EXCEPTION 'Session not found'; END IF;

  FOR r IN
    SELECT sr.score_dimension, sr.weight
    FROM public.sales_scoring_rules sr
    JOIN public.sales_session_answers sa ON sa.session_id = p_session_id AND sa.question_id = sr.question_id
    WHERE sr.questionnaire_id = v_q_id
      AND (sr.answer_option_id IS NULL OR sr.answer_option_id = ANY(sa.answer_option_ids))
  LOOP
    CASE r.score_dimension
      WHEN 'pain' THEN v_pain := v_pain + r.weight;
      WHEN 'maturity' THEN v_maturity := v_maturity + r.weight;
      WHEN 'objection' THEN v_objection := v_objection + r.weight;
      WHEN 'urgency' THEN v_urgency := v_urgency + r.weight;
      WHEN 'fit' THEN v_fit := v_fit + r.weight;
      WHEN 'budget_readiness' THEN v_budget := v_budget + r.weight;
      ELSE NULL;
    END CASE;
  END LOOP;

  v_total := v_pain + v_maturity + v_objection + v_urgency + v_fit + v_budget;

  UPDATE public.sales_sessions SET
    score_pain = v_pain, score_maturity = v_maturity, score_objection = v_objection,
    score_urgency = v_urgency, score_fit = v_fit, score_budget_readiness = v_budget,
    score_total = v_total, updated_at = now(), updated_by = auth.uid()
  WHERE id = p_session_id;

  INSERT INTO public.sales_session_events (session_id, event_type, payload, created_by)
  VALUES (p_session_id, 'scores_recalculated', jsonb_build_object(
    'score_total', v_total, 'score_pain', v_pain, 'score_maturity', v_maturity,
    'score_objection', v_objection, 'score_urgency', v_urgency, 'score_fit', v_fit,
    'score_budget_readiness', v_budget
  ), auth.uid());
END;
$$;

-- ========== fn_sales_detect_objections ==========
CREATE OR REPLACE FUNCTION public.fn_sales_detect_objections(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q_id uuid;
  r RECORD;
BEGIN
  PERFORM public._ensure_internal();

  DELETE FROM public.sales_session_objections WHERE session_id = p_session_id;

  SELECT questionnaire_id INTO v_q_id FROM public.sales_sessions WHERE id = p_session_id;
  IF v_q_id IS NULL THEN RAISE EXCEPTION 'Session not found'; END IF;

  FOR r IN
    SELECT sor.objection_type, sor.confidence, sor.rule_code
    FROM public.sales_objection_rules sor
    JOIN public.sales_session_answers sa ON sa.session_id = p_session_id AND sa.question_id = sor.question_id
    WHERE sor.questionnaire_id = v_q_id
      AND (sor.answer_option_id IS NULL OR sor.answer_option_id = ANY(sa.answer_option_ids))
  LOOP
    INSERT INTO public.sales_session_objections (session_id, objection_type, confidence, source_rule, evidence)
    VALUES (p_session_id, r.objection_type, r.confidence, r.rule_code, '{}'::jsonb)
    ON CONFLICT (session_id, objection_type, source_rule) DO NOTHING;
  END LOOP;

  INSERT INTO public.sales_session_events (session_id, event_type, created_by)
  VALUES (p_session_id, 'objections_detected', auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_sales_create_session(uuid,text,integer,text,text,text,text,uuid,jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_sales_save_answer(uuid,uuid,text,numeric,boolean,uuid[],jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_sales_recalculate_scores(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_sales_detect_objections(uuid) TO service_role;
