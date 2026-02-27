-- ═══════════════════════════════════════════════════════════════════════
-- PREFLIGHT CHECK (read-only) -- run before applying migrations
-- Confirms DB state and prevents duplicate object creation
-- Execute via: psql or Supabase SQL Editor (read-only, no side effects)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Helper function signatures
SELECT p.proname AS func_name,
       pg_get_function_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS returns,
       p.prosecdef AS security_definer
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
 WHERE n.nspname = 'public'
   AND p.proname IN ('is_admin', 'get_user_organization_id', 'set_updated_at');

-- 2. Target tables existence
SELECT t.table_name,
       CASE WHEN t.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
  FROM (VALUES
    ('organization_profile'),
    ('organization_setup_state'),
    ('agro_alerts'),
    ('agro_alert_rules'),
    ('agro_events')
  ) AS targets(table_name)
  LEFT JOIN information_schema.tables t
    ON t.table_schema = 'public' AND t.table_name = targets.table_name;

-- 3. Columns of target tables (if they exist)
SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name IN (
     'organization_profile',
     'organization_setup_state',
     'agro_alerts',
     'agro_alert_rules'
   )
 ORDER BY table_name, ordinal_position;

-- 4. RLS policies on target tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN (
     'organization_profile',
     'organization_setup_state',
     'agro_alerts'
   );

-- 5. Existing RPCs that might conflict
SELECT p.proname, pg_get_function_arguments(p.oid) AS args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
 WHERE n.nspname = 'public'
   AND p.proname IN (
     'rpc_upsert_org_profile',
     'rpc_upsert_org_profile_v2',
     'rpc_update_setup_state',
     'rpc_update_setup_state_v2',
     'rpc_set_alert_status'
   );
