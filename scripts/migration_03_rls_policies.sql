-- ============================================================
-- BLOQUE 3: Políticas RLS canónicas en organizacion_usuarios
-- Ejecutar en Supabase SQL Editor DESPUÉS del Bloque 2
-- ============================================================

-- 3a) Asegurar RLS habilitado
ALTER TABLE public.organizacion_usuarios ENABLE ROW LEVEL SECURITY;

-- 3b) DROP políticas legacy (idempotente)
DROP POLICY IF EXISTS "Org principal can insert org users" ON public.organizacion_usuarios;
DROP POLICY IF EXISTS "Org principal can update org users" ON public.organizacion_usuarios;
DROP POLICY IF EXISTS "Org principal can delete org users" ON public.organizacion_usuarios;
DROP POLICY IF EXISTS "Users can view their org users" ON public.organizacion_usuarios;

-- También drop canónicas por si se re-ejecuta
DROP POLICY IF EXISTS "canonical_select_org_usuarios" ON public.organizacion_usuarios;
DROP POLICY IF EXISTS "canonical_insert_org_usuarios" ON public.organizacion_usuarios;
DROP POLICY IF EXISTS "canonical_update_org_usuarios" ON public.organizacion_usuarios;
DROP POLICY IF EXISTS "canonical_delete_org_usuarios" ON public.organizacion_usuarios;

-- 3c) SELECT: miembros de la misma org + admins plataforma
CREATE POLICY "canonical_select_org_usuarios"
ON public.organizacion_usuarios
FOR SELECT
TO authenticated
USING (
  organizacion_id = public.get_user_organization_id(auth.uid())
  OR public.is_admin(auth.uid())
);

-- 3d) INSERT: solo admin_org de la misma org o admin plataforma
CREATE POLICY "canonical_insert_org_usuarios"
ON public.organizacion_usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  (
    organizacion_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid(), organizacion_id)
  )
  OR public.is_admin(auth.uid())
);

-- 3e) UPDATE: solo admin_org de la misma org o admin plataforma
CREATE POLICY "canonical_update_org_usuarios"
ON public.organizacion_usuarios
FOR UPDATE
TO authenticated
USING (
  (
    organizacion_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid(), organizacion_id)
  )
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  (
    organizacion_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid(), organizacion_id)
  )
  OR public.is_admin(auth.uid())
);

-- 3f) DELETE: solo admin_org de la misma org o admin plataforma
CREATE POLICY "canonical_delete_org_usuarios"
ON public.organizacion_usuarios
FOR DELETE
TO authenticated
USING (
  (
    organizacion_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid(), organizacion_id)
  )
  OR public.is_admin(auth.uid())
);

-- ✅ Bloque 3 completado
SELECT 'Bloque 3 OK: RLS canónico aplicado en organizacion_usuarios' AS resultado;
