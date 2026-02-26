-- =============================================================================
-- VERIFICACIÓN: organization_id unification
-- Ejecutar después de run_org_id_unification_phase1.sql
-- =============================================================================

-- ─── 1. NULL counts por tabla ───
SELECT 'NULL COUNTS' AS section;

SELECT tabla, null_count, total_count,
  CASE WHEN total_count = 0 THEN 'EMPTY'
       WHEN null_count = 0 THEN '✅ ALL FILLED'
       ELSE '⚠️ ' || null_count || ' NULLS'
  END AS status
FROM (
  SELECT 'productores' AS tabla,
    COUNT(*) FILTER (WHERE organization_id IS NULL) AS null_count,
    COUNT(*) AS total_count FROM public.productores
  UNION ALL
  SELECT 'parcelas', COUNT(*) FILTER (WHERE organization_id IS NULL), COUNT(*) FROM public.parcelas
  UNION ALL
  SELECT 'entregas', COUNT(*) FILTER (WHERE organization_id IS NULL), COUNT(*) FROM public.entregas
  UNION ALL
  SELECT 'documentos', COUNT(*) FILTER (WHERE organization_id IS NULL), COUNT(*) FROM public.documentos
  UNION ALL
  SELECT 'lotes_acopio', COUNT(*) FILTER (WHERE organization_id IS NULL), COUNT(*) FROM public.lotes_acopio
  UNION ALL
  SELECT 'lotes_comerciales', COUNT(*) FILTER (WHERE organization_id IS NULL), COUNT(*) FROM public.lotes_comerciales
  UNION ALL
  SELECT 'contratos', COUNT(*) FILTER (WHERE organization_id IS NULL), COUNT(*) FROM public.contratos
  UNION ALL
  SELECT 'cooperativa_exportadores', COUNT(*) FILTER (WHERE organization_id IS NULL), COUNT(*) FROM public.cooperativa_exportadores
) counts
ORDER BY null_count DESC;

-- ─── 2. Distribution por organization_id ───
SELECT 'DISTRIBUTION' AS section;

SELECT 'productores' AS tabla, organization_id, COUNT(*) AS rows
FROM public.productores WHERE organization_id IS NOT NULL
GROUP BY organization_id
UNION ALL
SELECT 'parcelas', organization_id, COUNT(*) FROM public.parcelas WHERE organization_id IS NOT NULL GROUP BY organization_id
UNION ALL
SELECT 'entregas', organization_id, COUNT(*) FROM public.entregas WHERE organization_id IS NOT NULL GROUP BY organization_id
ORDER BY tabla, rows DESC;

-- ─── 3. Helpers exist ───
SELECT 'HELPERS' AS section;

SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_organization_id','has_role','is_admin','get_user_productor_id','sync_organization_id')
ORDER BY routine_name;

-- ─── 4. Triggers active ───
SELECT 'TRIGGERS' AS section;

SELECT trigger_name, event_object_table, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name = 'trg_sync_organization_id'
ORDER BY event_object_table;

-- ─── 5. RLS policies (org-first) ───
SELECT 'RLS POLICIES' AS section;

SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public' AND policyname LIKE 'orgfirst_%'
ORDER BY tablename, cmd;

-- ─── 6. Consistency check: org_id = cooperativa_id where both exist ───
SELECT 'CONSISTENCY' AS section;

SELECT 'productores' AS tabla,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL AND cooperativa_id IS NOT NULL AND organization_id != cooperativa_id) AS mismatches,
  COUNT(*) AS total
FROM public.productores
UNION ALL
SELECT 'parcelas',
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL AND cooperativa_id IS NOT NULL AND organization_id != cooperativa_id),
  COUNT(*) FROM public.parcelas
UNION ALL
SELECT 'entregas',
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL AND cooperativa_id IS NOT NULL AND organization_id != cooperativa_id),
  COUNT(*) FROM public.entregas;

-- ─── 7. Sample rows ───
SELECT 'SAMPLE ROWS' AS section;

SELECT 'productores' AS tabla, id, cooperativa_id, organization_id FROM public.productores LIMIT 3;
SELECT 'parcelas' AS tabla, id, cooperativa_id, organization_id FROM public.parcelas LIMIT 3;
SELECT 'entregas' AS tabla, id, cooperativa_id, organization_id FROM public.entregas LIMIT 3;
