-- Run in Supabase SQL Editor against LIVE DB to export seed data.
-- Use output to build 20250323000001_sales_seed_v1_live.sql (see docs/SALES_INTELLIGENCE_LIVE_PARITY_PLAN.md).
-- Questionnaire: nova_sales_intel, version 1

-- 1. sales_questions (filter by questionnaire)
SELECT id, questionnaire_id, section_id, code, text, help, question_type, position, is_required, metadata, is_active
FROM public.sales_questions q
WHERE questionnaire_id = (SELECT id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1)
ORDER BY section_id, position;

-- 2. sales_answer_options (for those questions)
SELECT ao.id, ao.question_id, ao.value, ao.label, ao.weight, ao.position, ao.is_active
FROM public.sales_answer_options ao
WHERE question_id IN (
  SELECT id FROM public.sales_questions
  WHERE questionnaire_id = (SELECT id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1)
)
ORDER BY ao.question_id, ao.position;

-- 3. sales_scoring_rules
SELECT id, questionnaire_id, question_id, answer_option_id, score_dimension, weight, rule_code
FROM public.sales_scoring_rules
WHERE questionnaire_id = (SELECT id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1)
ORDER BY question_id, score_dimension;

-- 4. sales_objection_rules
SELECT id, questionnaire_id, question_id, answer_option_id, objection_type, confidence, rule_code
FROM public.sales_objection_rules
WHERE questionnaire_id = (SELECT id FROM public.sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1)
ORDER BY objection_type, question_id;
