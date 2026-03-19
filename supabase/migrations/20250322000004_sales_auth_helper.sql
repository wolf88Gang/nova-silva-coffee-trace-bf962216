-- Sales Intelligence — Auth helper
-- _ensure_internal: usa is_admin() existente. No crea admin_panel_roles.

CREATE OR REPLACE FUNCTION public._ensure_internal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: internal role required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public._ensure_internal() TO authenticated;
GRANT EXECUTE ON FUNCTION public._ensure_internal() TO service_role;
