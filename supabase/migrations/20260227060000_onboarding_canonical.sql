-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Canonical Onboarding (organization_profile + setup_state)
-- Version: 20260227060000
-- Idempotent: all CREATE statements use IF NOT EXISTS
-- Dependencies: platform_organizations, get_user_organization_id(uuid),
--               set_updated_at() trigger function
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 0. Helper: is_admin(uuid) — returns true if user has role 'admin'
--    Created only if it does not already exist.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 1. organization_profile
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_profile (
  organization_id uuid PRIMARY KEY
    REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  org_type text NOT NULL
    CHECK (org_type IN ('beneficio_privado', 'cooperativa', 'exportador', 'productor_grande')),
  activities text[] NOT NULL DEFAULT '{}',
  crops text[] NOT NULL DEFAULT '{}',
  season_start_month smallint NULL
    CHECK (season_start_month BETWEEN 1 AND 12),
  season_end_month smallint NULL
    CHECK (season_end_month BETWEEN 1 AND 12),
  default_country text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organization_profile IS
  'Extended org profile set during onboarding wizard (type, activities, crops, season).';

CREATE INDEX IF NOT EXISTS idx_organization_profile_org_type
  ON public.organization_profile (org_type);

-- Trigger: auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at' AND tgrelid = 'public.organization_profile'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.organization_profile
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. organization_setup_state
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_setup_state (
  organization_id uuid PRIMARY KEY
    REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  wizard_version text NOT NULL DEFAULT 'v2',
  current_step smallint NOT NULL DEFAULT 1,
  completed_steps smallint[] NOT NULL DEFAULT '{}',
  is_completed boolean NOT NULL DEFAULT false,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organization_setup_state IS
  'Tracks onboarding wizard progress per organization (step, checklist, completion).';

CREATE INDEX IF NOT EXISTS idx_setup_state_completed_seen
  ON public.organization_setup_state (is_completed, last_seen_at);

-- Trigger: auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at' AND tgrelid = 'public.organization_setup_state'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.organization_setup_state
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS Policies — organization_profile
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.organization_profile ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_profile' AND policyname = 'org_profile_select'
  ) THEN
    CREATE POLICY org_profile_select ON public.organization_profile
      FOR SELECT USING (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_profile' AND policyname = 'org_profile_insert'
  ) THEN
    CREATE POLICY org_profile_insert ON public.organization_profile
      FOR INSERT WITH CHECK (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_profile' AND policyname = 'org_profile_update'
  ) THEN
    CREATE POLICY org_profile_update ON public.organization_profile
      FOR UPDATE USING (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      ) WITH CHECK (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_profile' AND policyname = 'org_profile_delete'
  ) THEN
    CREATE POLICY org_profile_delete ON public.organization_profile
      FOR DELETE USING (
        public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. RLS Policies — organization_setup_state
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.organization_setup_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_setup_state' AND policyname = 'setup_state_select'
  ) THEN
    CREATE POLICY setup_state_select ON public.organization_setup_state
      FOR SELECT USING (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_setup_state' AND policyname = 'setup_state_insert'
  ) THEN
    CREATE POLICY setup_state_insert ON public.organization_setup_state
      FOR INSERT WITH CHECK (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_setup_state' AND policyname = 'setup_state_update'
  ) THEN
    CREATE POLICY setup_state_update ON public.organization_setup_state
      FOR UPDATE USING (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      ) WITH CHECK (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_setup_state' AND policyname = 'setup_state_delete'
  ) THEN
    CREATE POLICY setup_state_delete ON public.organization_setup_state
      FOR DELETE USING (
        public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 5. RPC: rpc_upsert_org_profile_v2
--    SECURITY INVOKER — RLS applies via the calling user's JWT
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_upsert_org_profile_v2(
  p_org_type text,
  p_activities text[],
  p_crops text[],
  p_season_start smallint DEFAULT NULL,
  p_season_end smallint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_user_organization_id(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User % has no organization', auth.uid();
  END IF;

  INSERT INTO public.organization_profile (
    organization_id, org_type, activities, crops,
    season_start_month, season_end_month
  ) VALUES (
    v_org_id, p_org_type, p_activities, p_crops,
    p_season_start, p_season_end
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    org_type           = EXCLUDED.org_type,
    activities         = EXCLUDED.activities,
    crops              = EXCLUDED.crops,
    season_start_month = EXCLUDED.season_start_month,
    season_end_month   = EXCLUDED.season_end_month,
    updated_at         = now();
END;
$$;

COMMENT ON FUNCTION public.rpc_upsert_org_profile_v2 IS
  'Upsert organization profile during onboarding. SECURITY INVOKER — RLS validates org ownership.';

-- ─────────────────────────────────────────────────────────────────────
-- 6. RPC: rpc_update_setup_state_v2
--    SECURITY INVOKER — RLS applies via the calling user's JWT
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_update_setup_state_v2(
  p_current_step smallint,
  p_completed_steps smallint[],
  p_is_completed boolean,
  p_checklist jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_user_organization_id(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User % has no organization', auth.uid();
  END IF;

  INSERT INTO public.organization_setup_state (
    organization_id, current_step, completed_steps,
    is_completed, checklist, last_seen_at
  ) VALUES (
    v_org_id, p_current_step, p_completed_steps,
    p_is_completed, p_checklist, now()
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    current_step    = EXCLUDED.current_step,
    completed_steps = EXCLUDED.completed_steps,
    is_completed    = EXCLUDED.is_completed,
    checklist       = EXCLUDED.checklist,
    last_seen_at    = now(),
    updated_at      = now();
END;
$$;

COMMENT ON FUNCTION public.rpc_update_setup_state_v2 IS
  'Upsert onboarding wizard state. SECURITY INVOKER — RLS validates org ownership.';

-- ─────────────────────────────────────────────────────────────────────
-- 7. Grant access to authenticated role (required for PostgREST)
-- ─────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON public.organization_profile TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_setup_state TO authenticated;
GRANT DELETE ON public.organization_profile TO authenticated;
GRANT DELETE ON public.organization_setup_state TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_upsert_org_profile_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_setup_state_v2 TO authenticated;

COMMIT;
