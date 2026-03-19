-- DEBUG: fn_debug_sales_auth — instrumentación temporal para depurar fn_sales_create_session
-- Usa is_admin() (mismo que _ensure_internal). REVERSIBLE: eliminar cuando termine el debug.

CREATE OR REPLACE FUNCTION public.fn_debug_sales_auth()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'is_internal_admin', public.is_admin()
  );
$$;

GRANT EXECUTE ON FUNCTION public.fn_debug_sales_auth() TO authenticated;
