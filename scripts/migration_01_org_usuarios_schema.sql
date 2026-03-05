-- ============================================================
-- BLOQUE 1: Estructura de organizacion_usuarios
-- Columnas, índices, constraint UNIQUE, backfill rol_interno
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1a) Agregar rol_interno (coexiste con rol legacy)
ALTER TABLE public.organizacion_usuarios
  ADD COLUMN IF NOT EXISTS rol_interno text DEFAULT 'viewer';

-- 1b) Agregar columnas denormalizadas
ALTER TABLE public.organizacion_usuarios
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS user_email text;

-- 1c) Agregar 8 columnas booleanas de permisos
ALTER TABLE public.organizacion_usuarios
  ADD COLUMN IF NOT EXISTS permiso_gestion_productores boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permiso_crear_editar_productores boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permiso_ver_parcelas_clima boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permiso_gestion_lotes_acopio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permiso_ver_eudr_exportador boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permiso_gestion_contratos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permiso_gestion_configuracion_org boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permiso_ver_informes_financieros boolean NOT NULL DEFAULT false;

-- 1d) Backfill rol_interno desde rol existente
UPDATE public.organizacion_usuarios
SET rol_interno = CASE
  WHEN rol = 'admin' THEN 'admin_org'
  WHEN rol = 'tecnico' THEN 'tecnico'
  WHEN rol = 'comercial' THEN 'comercial'
  WHEN rol = 'auditor' THEN 'auditor'
  WHEN rol = 'miembro' THEN 'viewer'
  ELSE 'viewer'
END
WHERE rol_interno IS NULL OR rol_interno = 'viewer';

-- 1e) Backfill permisos para admin_org existentes (all true)
UPDATE public.organizacion_usuarios
SET
  permiso_gestion_productores = true,
  permiso_crear_editar_productores = true,
  permiso_ver_parcelas_clima = true,
  permiso_gestion_lotes_acopio = true,
  permiso_ver_eudr_exportador = true,
  permiso_gestion_contratos = true,
  permiso_gestion_configuracion_org = true,
  permiso_ver_informes_financieros = true
WHERE rol_interno = 'admin_org';

-- 1f) Backfill permisos para tecnico
UPDATE public.organizacion_usuarios
SET
  permiso_gestion_productores = true,
  permiso_crear_editar_productores = true,
  permiso_ver_parcelas_clima = true
WHERE rol_interno = 'tecnico';

-- 1g) Backfill permisos para comercial
UPDATE public.organizacion_usuarios
SET
  permiso_gestion_lotes_acopio = true,
  permiso_ver_eudr_exportador = true,
  permiso_gestion_contratos = true,
  permiso_ver_informes_financieros = true
WHERE rol_interno = 'comercial';

-- 1h) Backfill permisos para auditor
UPDATE public.organizacion_usuarios
SET
  permiso_ver_parcelas_clima = true,
  permiso_ver_eudr_exportador = true,
  permiso_ver_informes_financieros = true
WHERE rol_interno = 'auditor';

-- 1i) Backfill user_name y user_email desde profiles
UPDATE public.organizacion_usuarios ou
SET
  user_name  = COALESCE(p.name, p.full_name),
  user_email = p.email
FROM public.profiles p
WHERE ou.user_id = p.id
  AND (ou.user_name IS NULL OR ou.user_email IS NULL);

-- 1j) Índices
CREATE INDEX IF NOT EXISTS idx_org_usuarios_org
  ON public.organizacion_usuarios(organizacion_id);

CREATE INDEX IF NOT EXISTS idx_org_usuarios_user
  ON public.organizacion_usuarios(user_id);

-- 1k) UNIQUE constraint (idempotente via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_org_usuarios_org_user'
      AND conrelid = 'public.organizacion_usuarios'::regclass
  ) THEN
    ALTER TABLE public.organizacion_usuarios
      ADD CONSTRAINT uq_org_usuarios_org_user UNIQUE (organizacion_id, user_id);
  END IF;
END $$;

-- 1l) Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.organizacion_usuarios;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.organizacion_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ✅ Bloque 1 completado
SELECT 'Bloque 1 OK: schema + backfill + indices + constraints' AS resultado;
