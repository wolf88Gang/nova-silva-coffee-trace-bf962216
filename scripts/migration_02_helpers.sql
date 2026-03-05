-- ============================================================
-- BLOQUE 2: Helpers SECURITY DEFINER
-- is_admin, is_org_admin (overload)
-- NO modifica get_user_organization_id (ya existe con dependencias RLS)
-- Ejecutar en Supabase SQL Editor DESPUÉS del Bloque 1
-- ============================================================

-- 2a) is_admin — verifica si es admin de plataforma (user_roles)
--     Si NO tienes tabla user_roles, comenta este bloque y usa 2a-alt.
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _uid
      AND role = 'admin'
  );
$$;

-- 2a-alt) Si NO tienes user_roles, descomenta esto y comenta 2a:
-- CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
-- RETURNS boolean
-- LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
-- AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.organizacion_usuarios
--     WHERE user_id = _uid AND rol_interno = 'admin_org' AND activo = true
--   );
-- $$;

-- 2b) is_org_admin (sin org_id) — admin en cualquier org activa
CREATE OR REPLACE FUNCTION public.is_org_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizacion_usuarios
    WHERE user_id = _uid
      AND rol_interno = 'admin_org'
      AND activo = true
  );
$$;

-- 2c) is_org_admin (con org_id) — admin en org específica
CREATE OR REPLACE FUNCTION public.is_org_admin(_uid uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizacion_usuarios
    WHERE user_id = _uid
      AND organizacion_id = _org_id
      AND rol_interno = 'admin_org'
      AND activo = true
  );
$$;

-- 2d) Grants
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM anon;

-- ✅ Bloque 2 completado (get_user_organization_id intacto)
SELECT 'Bloque 2 OK: is_admin + is_org_admin creados' AS resultado;
