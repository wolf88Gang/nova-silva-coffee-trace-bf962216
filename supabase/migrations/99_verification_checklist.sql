-- ═══════════════════════════════════════════════════════════════════════
-- POST-MIGRATION VERIFICATION CHECKLIST
-- Run after applying 20260227080000_onboarding_alerts_canonical.sql
-- All queries are read-only except the test inserts (cleaned up at end)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Tables exist ────────────────────────────────────────────────
SELECT 'organization_profile' AS tbl,
       (to_regclass('public.organization_profile') IS NOT NULL) AS exists;
SELECT 'organization_setup_state' AS tbl,
       (to_regclass('public.organization_setup_state') IS NOT NULL) AS exists;
SELECT 'agro_alerts' AS tbl,
       (to_regclass('public.agro_alerts') IS NOT NULL) AS exists;

-- ─── 2. is_completed column exists in setup_state ───────────────────
SELECT column_name, data_type, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'organization_setup_state'
   AND column_name = 'is_completed';

-- ─── 3. RLS enabled ────────────────────────────────────────────────
SELECT relname, relrowsecurity
  FROM pg_class
 WHERE relname IN ('organization_profile','organization_setup_state','agro_alerts')
   AND relnamespace = 'public'::regnamespace;

-- ─── 4. RLS policies count ─────────────────────────────────────────
SELECT tablename, count(*) AS policy_count
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('organization_profile','organization_setup_state','agro_alerts')
 GROUP BY tablename;

-- Expected: organization_profile=4, organization_setup_state=4, agro_alerts=3

-- ─── 5. RPCs exist ─────────────────────────────────────────────────
SELECT proname, pg_get_function_arguments(oid) AS args,
       prosecdef AS is_sec_definer
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace
   AND proname IN (
     'rpc_upsert_org_profile_v2',
     'rpc_update_setup_state_v2',
     'rpc_set_alert_status'
   );

-- ─── 6. No conflicting is_admin(uuid) with wrong param name ────────
SELECT proname, pg_get_function_arguments(oid) AS args
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace
   AND proname = 'is_admin';
-- Expected: only is_admin(_user_id uuid), NOT is_admin(p_user_id uuid)

-- ─── 7. Triggers ───────────────────────────────────────────────────
SELECT tgname, tgrelid::regclass AS table_name
  FROM pg_trigger
 WHERE tgrelid IN (
   'public.organization_profile'::regclass,
   'public.organization_setup_state'::regclass,
   'public.agro_alerts'::regclass
 )
 AND NOT tgisinternal;
