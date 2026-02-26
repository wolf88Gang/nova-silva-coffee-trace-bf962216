-- =============================================================================
-- VERIFICACIÓN: Phase 3 — NOT NULL + FK + org-only RLS
-- =============================================================================

-- ─── 1. NOT NULL check ───
SELECT 'NOT NULL' AS section;

SELECT c.table_name, c.column_name, c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.column_name = 'organization_id'
  AND c.table_name IN (
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  )
ORDER BY c.table_name;

-- ─── 2. Foreign keys ───
SELECT 'FOREIGN KEYS' AS section;

SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'organization_id'
ORDER BY tc.table_name;

-- ─── 3. RLS policies (should be org_only_* only) ───
SELECT 'RLS POLICIES' AS section;

SELECT tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  )
ORDER BY tablename, policyname;

-- ─── 4. Check no legacy policies remain ───
SELECT 'LEGACY POLICY CHECK' AS section;

SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  )
  AND (
    qual LIKE '%cooperativa_id%'
    OR policyname LIKE 'orgid_%'
    OR policyname LIKE 'orgfirst_%'
    OR policyname LIKE 'org_scoped_%'
  );
-- Expected: 0 rows

-- ─── 5. Triggers removed ───
SELECT 'TRIGGERS CHECK' AS section;

SELECT tgname, c.relname AS tablename
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal
  AND (tgname LIKE 'trg_sync_org_id_%' OR tgname = 'trg_sync_organization_id')
ORDER BY c.relname;
-- Expected: 0 rows (triggers dropped)

-- ─── 6. Row counts per org (sanity) ───
SELECT 'ROW COUNTS' AS section;

SELECT 'productores' AS tbl, organization_id, COUNT(*) AS rows
FROM public.productores GROUP BY organization_id
UNION ALL
SELECT 'parcelas', organization_id, COUNT(*) FROM public.parcelas GROUP BY organization_id
UNION ALL
SELECT 'entregas', organization_id, COUNT(*) FROM public.entregas GROUP BY organization_id
ORDER BY tbl, rows DESC;

-- ─── 7. Composite indexes ───
SELECT 'INDEXES' AS section;

SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE 'idx_%_org%' OR indexname LIKE 'idx_profiles_%')
ORDER BY tablename, indexname;
