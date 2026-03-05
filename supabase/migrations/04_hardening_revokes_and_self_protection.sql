-- ═══════════════════════════════════════════════════════════════════════
-- 04: Security hardening + anti-self-deactivation trigger
-- Rerunnable: REVOKE is idempotent, trigger uses DROP IF EXISTS + CREATE
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. REVOKE EXECUTE on SECURITY DEFINER functions from anon/authenticated
--    These functions are called internally by RLS policies, not by users.
-- ─────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Anti-self-deactivation trigger
--    Prevents an admin_org from:
--    - Deactivating their own record (activo = false)
--    - Removing their own admin_org role
--    - Deleting their own record
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_prevent_self_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id = auth.uid() THEN
      RAISE EXCEPTION 'no_puedes_eliminarte_a_ti_mismo';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF OLD.user_id = auth.uid() THEN
    -- Prevent self-deactivation
    IF OLD.activo = true AND NEW.activo = false THEN
      RAISE EXCEPTION 'no_puedes_deshabilitarte';
    END IF;
    -- Prevent removing own admin_org role
    IF OLD.rol_interno = 'admin_org' AND NEW.rol_interno <> 'admin_org' THEN
      RAISE EXCEPTION 'no_puedes_perder_admin_org_de_ti_mismo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to ensure correct definition
DROP TRIGGER IF EXISTS trg_self_protection ON public.organizacion_usuarios;

CREATE TRIGGER trg_self_protection
  BEFORE UPDATE OR DELETE ON public.organizacion_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_self_deactivation();

COMMIT;
