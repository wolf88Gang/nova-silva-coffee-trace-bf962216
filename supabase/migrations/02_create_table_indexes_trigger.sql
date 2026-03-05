-- ═══════════════════════════════════════════════════════════════════════
-- 02: organizacion_usuarios -- table, columns, indexes, trigger
-- Rerunnable: IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
-- Strategy: table exists with 10 columns; we ADD the missing ones.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Create table if it does not exist (full contract schema)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organizacion_usuarios (
  id                                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id                      uuid         NOT NULL
    REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  user_id                              uuid         NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_interno                          text         NOT NULL DEFAULT 'viewer',
  rol_visible                          text         NULL,
  scope                                text         DEFAULT 'full',
  activo                               boolean      NOT NULL DEFAULT true,
  permiso_gestion_productores          boolean      NOT NULL DEFAULT false,
  permiso_crear_editar_productores     boolean      NOT NULL DEFAULT false,
  permiso_ver_parcelas_clima           boolean      NOT NULL DEFAULT false,
  permiso_gestion_lotes_acopio         boolean      NOT NULL DEFAULT false,
  permiso_ver_eudr_exportador          boolean      NOT NULL DEFAULT false,
  permiso_gestion_contratos            boolean      NOT NULL DEFAULT false,
  permiso_gestion_configuracion_org    boolean      NOT NULL DEFAULT false,
  permiso_ver_informes_financieros     boolean      NOT NULL DEFAULT false,
  user_name                            text         NULL,
  user_email                           text         NULL,
  created_at                           timestamptz  NOT NULL DEFAULT now(),
  updated_at                           timestamptz  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Add missing columns to existing table (idempotent)
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  -- rol_interno (contract uses this; existing table has 'rol')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='rol_interno') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN rol_interno text NOT NULL DEFAULT 'viewer';
    -- Backfill from existing 'rol' column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='rol') THEN
      UPDATE public.organizacion_usuarios SET rol_interno = CASE
        WHEN rol = 'admin' THEN 'admin_org'
        WHEN rol = 'miembro' THEN 'viewer'
        ELSE COALESCE(rol, 'viewer')
      END;
    END IF;
  END IF;

  -- 8 permiso_* boolean columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_gestion_productores') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_gestion_productores boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_crear_editar_productores') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_crear_editar_productores boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_ver_parcelas_clima') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_ver_parcelas_clima boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_gestion_lotes_acopio') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_gestion_lotes_acopio boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_ver_eudr_exportador') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_ver_eudr_exportador boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_gestion_contratos') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_gestion_contratos boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_gestion_configuracion_org') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_gestion_configuracion_org boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='permiso_ver_informes_financieros') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN permiso_ver_informes_financieros boolean NOT NULL DEFAULT false;
  END IF;

  -- user_name, user_email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='user_name') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN user_name text NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='user_email') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN user_email text NULL;
  END IF;

  -- scope: contract default is 'full', existing is 'organizacion'
  -- Do not rename, just ensure column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizacion_usuarios' AND column_name='scope') THEN
    ALTER TABLE public.organizacion_usuarios ADD COLUMN scope text DEFAULT 'full';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. UNIQUE constraint
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.organizacion_usuarios'::regclass
      AND contype = 'u'
      AND conname = 'uq_org_usuarios_org_user'
  ) THEN
    ALTER TABLE public.organizacion_usuarios
      ADD CONSTRAINT uq_org_usuarios_org_user UNIQUE (organizacion_id, user_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. Indexes
-- ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_org_usuarios_org_id
  ON public.organizacion_usuarios (organizacion_id);

CREATE INDEX IF NOT EXISTS idx_org_usuarios_user_id
  ON public.organizacion_usuarios (user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Trigger: updated_at
--    Uses update_updated_at_column() if exists, else set_updated_at()
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  -- Drop any existing updated_at trigger to avoid conflicts
  DROP TRIGGER IF EXISTS trg_org_usuarios_updated_at ON public.organizacion_usuarios;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER trg_org_usuarios_updated_at
      BEFORE UPDATE ON public.organizacion_usuarios
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  ELSIF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
  ) THEN
    CREATE TRIGGER trg_org_usuarios_updated_at
      BEFORE UPDATE ON public.organizacion_usuarios
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

COMMIT;
