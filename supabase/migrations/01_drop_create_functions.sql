-- ═══════════════════════════════════════════════════════════════════════
-- 01: DROP/CREATE helper functions
-- Rerunnable: DROP IF EXISTS + CREATE OR REPLACE
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. get_user_organization_id(_uid uuid)
--    Source of truth: public.profiles.organization_id
-- ─────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_user_organization_id(uuid);

CREATE FUNCTION public.get_user_organization_id(_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
    FROM public.profiles
   WHERE user_id = _uid
   LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. is_org_admin(_uid uuid)
--    Returns true if user has rol_interno = 'admin_org' and activo = true
--    in organizacion_usuarios for their organization.
-- ─────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.is_org_admin(uuid);

CREATE FUNCTION public.is_org_admin(_uid uuid)
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

-- ─────────────────────────────────────────────────────────────────────
-- 3. is_admin(_uid uuid)
--    DO NOT DROP -- keep existing function.
--    Only recreate if it does not exist at all (safety net).
--    Source: public.user_roles where role = 'admin'
-- ─────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.is_admin(_uid uuid)
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = _uid AND role = 'admin'
        );
      END;
      $body$;
    $fn$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. update_updated_at_column()
--    Alias/alternative to set_updated_at() for trigger compat.
--    Created only if it does not already exist.
-- ─────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.update_updated_at_column()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $body$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $body$;
    $fn$;
  END IF;
END $$;

COMMIT;
