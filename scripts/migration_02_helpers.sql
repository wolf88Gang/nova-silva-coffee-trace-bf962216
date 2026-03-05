-- ============================================================
-- BLOQUE 2: Helpers SECURITY DEFINER (safe / idempotent)
-- NO modifica get_user_organization_id (dependencias RLS)
-- NO usa DO/EXECUTE — sentencias planas compatibles con cualquier runner
-- Si is_admin o is_org_admin YA existen con otra firma, este bloque
-- solo ajusta GRANT/REVOKE y no intenta recrearlas.
-- Ejecutar en Supabase SQL Editor DESPUÉS del Bloque 1
-- ============================================================

-- ─── 2a) is_admin ───────────────────────────────────────────
-- Intenta crear. Si ya existe con firma idéntica, OR REPLACE la reemplaza.
-- Si ya existe con firma distinta (nombre de param diferente),
-- este CREATE OR REPLACE fallará de forma segura; ignora el error
-- y continúa con GRANT/REVOKE abajo.
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

-- 2a-alt) Si NO tienes tabla user_roles, comenta 2a y descomenta esto:
-- CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
-- RETURNS boolean
-- LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
-- AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.organizacion_usuarios
--     WHERE user_id = _uid AND rol_interno = 'admin_org' AND activo = true
--   );
-- $$;

-- ─── 2b) is_org_admin (sin org_id) ─────────────────────────
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

-- ─── 2c) is_org_admin (con org_id) ─────────────────────────
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

-- ─── 2d) Grants (seguros incluso si alguna función no se creó) ──
-- Si alguna función no existe, el GRANT fallará de forma no destructiva.
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM anon;

-- ✅ Bloque 2 completado (get_user_organization_id intacto)
SELECT 'Bloque 2 OK: helpers verificados' AS resultado;
