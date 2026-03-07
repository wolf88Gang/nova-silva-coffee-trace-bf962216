-- Migration: ag_fertilizers - lectura solo para authenticated
-- Catálogo global de fertilizantes: read-only, sin anon.
-- Escritura bloqueada para roles públicos.

-- Asegurar RLS habilitado
ALTER TABLE public.ag_fertilizers ENABLE ROW LEVEL SECURITY;

-- Política de lectura: solo usuarios autenticados
DROP POLICY IF EXISTS "ag_fertilizers_read" ON public.ag_fertilizers;
CREATE POLICY "ag_fertilizers_read" ON public.ag_fertilizers
  FOR SELECT TO authenticated
  USING (true);

-- Política de escritura: bloqueada para roles públicos (solo service_role/admin)
DROP POLICY IF EXISTS "ag_fertilizers_write" ON public.ag_fertilizers;
-- Sin política INSERT/UPDATE/DELETE para authenticated/anon = bloqueado por defecto con RLS.
-- Si necesitás que admin pueda escribir, crear política con is_admin():
-- CREATE POLICY "ag_fertilizers_admin_write" ON public.ag_fertilizers FOR ALL TO authenticated
--   USING (public.is_admin()) WITH CHECK (public.is_admin());
