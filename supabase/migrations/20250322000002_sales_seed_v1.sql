-- Sales Intelligence — Seed v1 (minimal)
-- Requiere: 20250322000001_sales_schema_base
-- El seed completo (8 secciones, 49 preguntas, 112 opciones, 55 scoring, 24 objection)
-- debe extraerse de la BD existente o completarse manualmente.
-- Este archivo contiene la estructura mínima para que el test pipeline funcione.
-- UUIDs del test: scripts/test_sales_pipeline.sql

-- Questionnaire (id explícito para referencias del test)
INSERT INTO public.sales_questionnaires (id, code, version, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'nova_sales_intel',
  1,
  true
)
ON CONFLICT (code, version) DO UPDATE SET is_active = EXCLUDED.is_active;

-- 8 sections
INSERT INTO public.sales_question_sections (id, questionnaire_id, code, title, position, is_active)
SELECT v.id, q.id, v.code, v.title, v.position, v.is_active
FROM (VALUES
  ('a0000000-0001-0000-0000-000000000001'::uuid, 'context', 'Contexto', 1, true),
  ('a0000000-0002-0000-0000-000000000001'::uuid, 'pain', 'Dolor', 2, true),
  ('a0000000-0003-0000-0000-000000000001'::uuid, 'maturity', 'Madurez', 3, true),
  ('a0000000-0004-0000-0000-000000000001'::uuid, 'compliance', 'Cumplimiento', 4, true),
  ('a0000000-0005-0000-0000-000000000001'::uuid, 'urgency', 'Urgencia', 5, true),
  ('a0000000-0006-0000-0000-000000000001'::uuid, 'fit', 'Fit', 6, true),
  ('a0000000-0007-0000-0000-000000000001'::uuid, 'budget', 'Presupuesto', 7, true),
  ('a0000000-0008-0000-0000-000000000001'::uuid, 'objections', 'Objeciones', 8, true)
) AS v(id, code, title, position, is_active)
CROSS JOIN public.sales_questionnaires q
WHERE q.code = 'nova_sales_intel' AND q.version = 1
  AND NOT EXISTS (SELECT 1 FROM public.sales_question_sections WHERE id = v.id);

-- NOTA: Las preguntas y opciones del test usan IDs c0000000-000X-000Y-0001-*, d0000000-000X-000Y-0001-*.
-- Ejecutar desde BD existente: pg_dump o export manual de sales_questions, sales_answer_options,
-- sales_scoring_rules, sales_objection_rules.
-- Regla price (fix): BUD_CURRENT_SPEND = under_3k → price
INSERT INTO public.sales_objection_rules (questionnaire_id, question_id, answer_option_id, objection_type, confidence, rule_code)
SELECT
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0007-0000-0001-000000000006'::uuid,
  'd0000000-0007-0006-0001-000000000002'::uuid,
  'price'::public.sales_objection_type,
  0.55,
  'bud_spend_low_price'
WHERE EXISTS (SELECT 1 FROM public.sales_questions WHERE id = 'c0000000-0007-0000-0001-000000000006'::uuid)
  AND EXISTS (SELECT 1 FROM public.sales_answer_options WHERE id = 'd0000000-0007-0006-0001-000000000002'::uuid)
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_objection_rules
    WHERE questionnaire_id = 'b0000000-0000-0000-0000-000000000001'::uuid
      AND rule_code = 'bud_spend_low_price'
  );
