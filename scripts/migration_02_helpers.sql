-- ============================================================
-- BLOQUE 2: Helpers SECURITY DEFINER
-- get_user_organization_id, is_admin, is_org_admin (overload)
-- Ejecutar en Supabase SQL Editor DESPUÉS del Bloque 1
-- ============================================================

-- 2a) get_user_organization_id — devuelve org del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacion_id
  FROM public.organizacion_usuarios
  WHERE user_id = _uid
    AND activo = true
  LIMIT 1;
$$;

-- 2b) is_admin — verifica si es admin de plataforma (user_roles)
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

-- 2c) is_org_admin (overload sin org_id) — admin en cualquier org activa
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

-- 2d) is_org_admin (firma existente con org_id) — mantener para compatibilidad
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

-- 2e) Grants — solo authenticated puede invocar
GRANT EXECUTE ON FUNCTION public.get_user_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM anon;

-- ✅ Bloque 2 completado
SELECT 'Bloque 2 OK: helpers creados con SECURITY DEFINER' AS resultado;
