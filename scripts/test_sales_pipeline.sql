-- =====================================================================
-- Sales Intelligence Pipeline — End-to-End Test
--
-- Run in Supabase SQL Editor or via execute_sql.
-- Sets auth context to simulate a real admin user, then:
--   1. Creates a session via fn_sales_create_session
--   2. Saves answers via fn_sales_save_answer (one per key question)
--   3. Finalizes via fn_sales_finalize_session (runs full pipeline)
--   4. Queries outputs: scores, objections, recommendations, events
--
-- Auth user: info@novasilva.co (77c7b31e-ac2c-4d61-bc65-80785f48ce42)
-- Organization: Cooperativa Demo (00000000-0000-0000-0000-000000000001)
-- =====================================================================

DO $$
DECLARE
  v_session_id uuid;
  v_admin_uid  uuid := '77c7b31e-ac2c-4d61-bc65-80785f48ce42';
BEGIN
  -- ── Set auth context so RPCs can pass _ensure_internal() ────────────
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', v_admin_uid::text,
    'role', 'authenticated',
    'iss', 'supabase',
    'iat', extract(epoch from now())::int,
    'exp', extract(epoch from now() + interval '1 hour')::int
  )::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_admin_uid::text, true);
  PERFORM set_config('role', 'authenticated', true);

  RAISE NOTICE '=== STEP 1: Create session ===';

  v_session_id := public.fn_sales_create_session(
    p_organization_id       := '00000000-0000-0000-0000-000000000001'::uuid,
    p_questionnaire_code    := 'nova_sales_intel',
    p_questionnaire_version := 1,
    p_lead_name             := 'Juan Pérez',
    p_lead_company          := 'Cooperativa Café Montaña',
    p_lead_type             := 'cooperativa',
    p_commercial_stage      := 'lead'
  );

  RAISE NOTICE 'Session created: %', v_session_id;

  -- ── STEP 2: Save answers ────────────────────────────────────────────
  RAISE NOTICE '=== STEP 2: Save answers ===';

  -- CTX_ORG_TYPE = cooperativa
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0001-0000-0001-000000000001'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0001-0001-0001-000000000001'::uuid]);

  -- CTX_PRODUCERS = 200-500
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0001-0000-0001-000000000002'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0001-0002-0001-000000000003'::uuid]);

  -- PAIN_REJECT = 4+ lots (high pain)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0002-0000-0001-000000000002'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0002-0002-0001-000000000003'::uuid]);

  -- PAIN_HOURS = 30+ hours (high pain)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0002-0000-0001-000000000003'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0002-0003-0001-000000000004'::uuid]);

  -- PAIN_VISIBILITY = none (high pain)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0002-0000-0001-000000000005'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0002-0005-0001-000000000003'::uuid]);

  -- PAIN_COST = 20k-50k
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0002-0000-0001-000000000006'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0002-0006-0001-000000000003'::uuid]);

  -- PAIN_SEVERITY = critical
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0002-0000-0001-000000000007'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0002-0007-0001-000000000004'::uuid]);

  -- MAT_SYSTEMS = spreadsheets (low maturity)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0003-0000-0001-000000000001'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0003-0001-0001-000000000002'::uuid]);

  -- MAT_MOBILE = partial
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0003-0000-0001-000000000002'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0003-0002-0001-000000000002'::uuid]);

  -- MAT_CONNECTIVITY = limited
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0003-0000-0001-000000000003'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0003-0003-0001-000000000002'::uuid]);

  -- MAT_DATA = excel
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0003-0000-0001-000000000004'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0003-0004-0001-000000000002'::uuid]);

  -- COMP_EUDR_AWARE = heard (compliance fear signal)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0004-0000-0001-000000000002'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0004-0002-0001-000000000002'::uuid]);

  -- COMP_DUE_DILIGENCE = none (compliance fear)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0004-0000-0001-000000000003'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0004-0003-0001-000000000001'::uuid]);

  -- COMP_GEO = none
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0004-0000-0001-000000000004'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0004-0004-0001-000000000001'::uuid]);

  -- COMP_AUDIT_READY = no
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0004-0000-0001-000000000005'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0004-0005-0001-000000000001'::uuid]);

  -- URG_TIMELINE = lt3m (high urgency)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0005-0000-0001-000000000001'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0005-0001-0001-000000000001'::uuid]);

  -- URG_HARVEST = lt3m
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0005-0000-0001-000000000003'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0005-0003-0001-000000000001'::uuid]);

  -- FIT_NEED_TRACE = full
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0006-0000-0001-000000000001'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0006-0001-0001-000000000001'::uuid]);

  -- FIT_OFFLINE = critical
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0006-0000-0001-000000000005'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0006-0005-0001-000000000001'::uuid]);

  -- BUD_AVAILABLE = pending
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0007-0000-0001-000000000001'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0007-0001-0001-000000000002'::uuid]);

  -- BUD_DECISION = manager
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0007-0000-0001-000000000002'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0007-0002-0001-000000000002'::uuid]);

  -- BUD_RANGE = 5k-15k
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0007-0000-0001-000000000003'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0007-0003-0001-000000000002'::uuid]);

  -- BUD_ROI = market_access
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0007-0000-0001-000000000004'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0007-0004-0001-000000000002'::uuid]);

  -- BUD_TIMELINE = next_3m
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0007-0000-0001-000000000005'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0007-0005-0001-000000000002'::uuid]);

  -- BUD_CURRENT_SPEND = under_3k
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0007-0000-0001-000000000006'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0007-0006-0001-000000000002'::uuid]);

  -- OBJ_MAIN_CONCERN = complexity
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0008-0000-0001-000000000001'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0008-0001-0001-000000000002'::uuid]);

  -- OBJ_PREV_FAIL = bad experience (trust signal)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0008-0000-0001-000000000002'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0008-0002-0001-000000000001'::uuid]);

  -- OBJ_COMPETITION = passive
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0008-0000-0001-000000000003'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0008-0003-0001-000000000002'::uuid]);

  -- OBJ_RESISTANCE = moderate
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0008-0000-0001-000000000004'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0008-0004-0001-000000000002'::uuid]);

  -- OBJ_TRUST = low (trust signal)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0008-0000-0001-000000000005'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0008-0005-0001-000000000003'::uuid]);

  -- OBJ_NEEDS = demo + pilot (multi_select)
  PERFORM public.fn_sales_save_answer(v_session_id, 'c0000000-0008-0000-0001-000000000006'::uuid,
    p_answer_option_ids := ARRAY['d0000000-0008-0006-0001-000000000001'::uuid, 'd0000000-0008-0006-0001-000000000003'::uuid]);

  RAISE NOTICE 'Answers saved: 28 questions answered';

  -- ── STEP 3: Finalize (runs full pipeline) ──────────────────────────
  RAISE NOTICE '=== STEP 3: Finalize session ===';
  PERFORM public.fn_sales_finalize_session(v_session_id);
  RAISE NOTICE 'Session finalized successfully';

  -- ── STEP 4: Output results ─────────────────────────────────────────
  RAISE NOTICE '=== RESULTS ===';
  RAISE NOTICE 'Session ID: %', v_session_id;
  RAISE NOTICE 'Run these queries to inspect results:';
  RAISE NOTICE '';
  RAISE NOTICE 'SCORES:';
  RAISE NOTICE '  SELECT score_total, score_pain, score_maturity, score_objection, score_urgency, score_fit, score_budget_readiness FROM sales_sessions WHERE id = ''%'';', v_session_id;
  RAISE NOTICE '';
  RAISE NOTICE 'OBJECTIONS:';
  RAISE NOTICE '  SELECT * FROM fn_sales_get_objection_summary(''%'');', v_session_id;
  RAISE NOTICE '';
  RAISE NOTICE 'RECOMMENDATIONS:';
  RAISE NOTICE '  SELECT recommendation_type, title, description FROM sales_session_recommendations WHERE session_id = ''%'' ORDER BY priority;', v_session_id;
  RAISE NOTICE '';
  RAISE NOTICE 'EVENTS:';
  RAISE NOTICE '  SELECT event_type, payload FROM sales_session_events WHERE session_id = ''%'' ORDER BY created_at;', v_session_id;

END;
$$;
