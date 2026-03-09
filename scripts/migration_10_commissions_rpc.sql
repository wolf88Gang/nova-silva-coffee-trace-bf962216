-- ============================================================
-- Migration 10 – RPC: get_my_commissions
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_commissions()
RETURNS SETOF ag_commissions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
    FROM ag_commissions
   WHERE organization_id = get_user_organization_id(auth.uid())
   ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_commissions() TO authenticated;
