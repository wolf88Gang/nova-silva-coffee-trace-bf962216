-- Sales Intelligence — RLS
-- Solo is_admin() para todas las tablas sales_* (uso interno / admin panel)

ALTER TABLE public.sales_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_question_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_objection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_session_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_session_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_session_question_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_catalog_admin" ON public.sales_questionnaires;
CREATE POLICY "sales_catalog_admin" ON public.sales_questionnaires FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_sections_admin" ON public.sales_question_sections;
CREATE POLICY "sales_sections_admin" ON public.sales_question_sections FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_questions_admin" ON public.sales_questions;
CREATE POLICY "sales_questions_admin" ON public.sales_questions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_options_admin" ON public.sales_answer_options;
CREATE POLICY "sales_options_admin" ON public.sales_answer_options FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_scoring_rules_admin" ON public.sales_scoring_rules;
CREATE POLICY "sales_scoring_rules_admin" ON public.sales_scoring_rules FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_objection_rules_admin" ON public.sales_objection_rules;
CREATE POLICY "sales_objection_rules_admin" ON public.sales_objection_rules FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_sessions_admin" ON public.sales_sessions;
CREATE POLICY "sales_sessions_admin" ON public.sales_sessions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_answers_admin" ON public.sales_session_answers;
CREATE POLICY "sales_answers_admin" ON public.sales_session_answers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_objections_admin" ON public.sales_session_objections;
CREATE POLICY "sales_objections_admin" ON public.sales_session_objections FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_events_admin" ON public.sales_session_events;
CREATE POLICY "sales_events_admin" ON public.sales_session_events FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_recommendations_admin" ON public.sales_session_recommendations;
CREATE POLICY "sales_recommendations_admin" ON public.sales_session_recommendations FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "sales_snapshots_admin" ON public.sales_session_question_snapshots;
CREATE POLICY "sales_snapshots_admin" ON public.sales_session_question_snapshots FOR ALL USING (public.is_admin());
