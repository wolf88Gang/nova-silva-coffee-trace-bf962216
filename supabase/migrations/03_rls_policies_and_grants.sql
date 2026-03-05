-- ═══════════════════════════════════════════════════════════════════════
-- 03: RLS policies + GRANTs for organizacion_usuarios
-- Rerunnable: creates policies only if they do not exist
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.organizacion_usuarios ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────
-- SELECT: members of the same org OR platform admin
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organizacion_usuarios' AND policyname='org_usuarios_select') THEN
    CREATE POLICY org_usuarios_select ON public.organizacion_usuarios
      FOR SELECT USING (
        organizacion_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- INSERT: org admin of same org OR platform admin
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organizacion_usuarios' AND policyname='org_usuarios_insert') THEN
    CREATE POLICY org_usuarios_insert ON public.organizacion_usuarios
      FOR INSERT WITH CHECK (
        (
          organizacion_id = public.get_user_organization_id(auth.uid())
          AND public.is_org_admin(auth.uid())
        )
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- UPDATE: org admin of same org OR platform admin
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organizacion_usuarios' AND policyname='org_usuarios_update') THEN
    CREATE POLICY org_usuarios_update ON public.organizacion_usuarios
      FOR UPDATE
      USING (
        (
          organizacion_id = public.get_user_organization_id(auth.uid())
          AND public.is_org_admin(auth.uid())
        )
        OR public.is_admin(auth.uid())
      )
      WITH CHECK (
        (
          organizacion_id = public.get_user_organization_id(auth.uid())
          AND public.is_org_admin(auth.uid())
        )
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- DELETE: org admin of same org OR platform admin
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organizacion_usuarios' AND policyname='org_usuarios_delete') THEN
    CREATE POLICY org_usuarios_delete ON public.organizacion_usuarios
      FOR DELETE USING (
        (
          organizacion_id = public.get_user_organization_id(auth.uid())
          AND public.is_org_admin(auth.uid())
        )
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- GRANTs
-- ─────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizacion_usuarios TO authenticated;
GRANT SELECT ON public.organizacion_usuarios TO anon;

COMMIT;
