-- Admin Panel Nova Silva — Fase 1: Enums, platform_organizations, profiles, helpers
-- Compatible con esquema existente. Usa CREATE IF NOT EXISTS y ALTER ADD COLUMN IF NOT EXISTS.

-- ========== A) ENUMS ==========

DO $$ BEGIN
  CREATE TYPE public.org_tipo AS ENUM ('cooperativa', 'exportador', 'certificadora', 'interna');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.org_plan AS ENUM ('lite', 'smart', 'plus', 'none');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.org_status AS ENUM ('en_prueba', 'activo', 'vencido', 'suspendido', 'cerrado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'admin', 'superadmin', 'cooperativa_admin', 'cooperativa_staff',
    'exportador_admin', 'exportador_staff', 'certificadora', 'tecnico', 'auditor', 'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('mensual', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'overdue', 'paid', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method_type AS ENUM ('transferencia', 'efectivo', 'cheque', 'stripe', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_action_type AS ENUM (
    'activar_trial', 'extender_trial', 'activar_cuenta', 'suspender_cuenta', 'cerrar_cuenta',
    'cambiar_plan', 'registrar_pago', 'cambiar_rol', 'activar_addon', 'desactivar_addon',
    'emitir_factura', 'marcar_factura_pagada'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== B) PLATFORM_ORGANIZATIONS — agregar columnas ==========

ALTER TABLE public.platform_organizations
  ADD COLUMN IF NOT EXISTS tipo public.org_tipo DEFAULT 'cooperativa',
  ADD COLUMN IF NOT EXISTS plan public.org_plan DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS status public.org_status DEFAULT 'en_prueba',
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Costa Rica',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS modules jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_eudr_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vital_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_guard_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_limit integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Si no tiene name, usar display_name como fallback
UPDATE public.platform_organizations SET name = COALESCE(name, display_name) WHERE name IS NULL AND display_name IS NOT NULL;

-- Índices por tipo, plan, status
CREATE INDEX IF NOT EXISTS idx_platform_orgs_tipo ON public.platform_organizations (tipo);
CREATE INDEX IF NOT EXISTS idx_platform_orgs_plan ON public.platform_organizations (plan);
CREATE INDEX IF NOT EXISTS idx_platform_orgs_status ON public.platform_organizations (status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public._admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_orgs_updated ON public.platform_organizations;
CREATE TRIGGER trg_platform_orgs_updated
  BEFORE UPDATE ON public.platform_organizations
  FOR EACH ROW EXECUTE FUNCTION public._admin_updated_at();

-- ========== C) PROFILES — agregar columnas ==========

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public._admin_updated_at();

-- ========== D) USER_ROLES — crear si no existe ==========
-- Si ya existe (legacy con UNIQUE(user_id)), solo agregamos organization_id. No romper convert-demo-to-org.

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  organization_id uuid REFERENCES public.platform_organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.platform_organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON public.user_roles (organization_id);

-- ========== E) HELPERS ==========

CREATE OR REPLACE FUNCTION public.get_user_organization_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY CASE role WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 WHEN 'cooperativa_admin' THEN 3 WHEN 'exportador_admin' THEN 4 ELSE 99 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role);
$$;

-- is_admin: true si el usuario actual tiene admin o superadmin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
$$;
