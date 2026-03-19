-- Sales Intelligence — Ensure RPCs bypass RLS when run as SECURITY DEFINER
-- The functions insert/update sales_* tables. RLS blocks inserts when the effective
-- session user (function invoker) is checked. Setting owner to postgres ensures
-- the function runs with a role that bypasses RLS (postgres has BYPASSRLS).
-- Auth is still enforced via _ensure_internal() before any write.
--
-- Uses dynamic SQL to avoid signature mismatches (e.g. p_commercial_stage text vs commercial_stage enum).

DO $$
DECLARE
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    RETURN;
  END IF;

  FOR r IN (
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'fn_sales_create_session', 'fn_sales_save_answer',
      'fn_sales_recalculate_scores', 'fn_sales_detect_objections'
    )
  ) LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) OWNER TO postgres', r.proname, r.args);
  END LOOP;
END $$;
