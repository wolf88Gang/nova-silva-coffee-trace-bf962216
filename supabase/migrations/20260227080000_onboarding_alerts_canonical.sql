-- ═══════════════════════════════════════════════════════════════════════
-- CANONICAL MIGRATION: Onboarding + Agro Alerts + RPCs
-- Version: 20260227080000
-- Idempotent: all statements use IF NOT EXISTS / CREATE OR REPLACE / DO $$
--
-- Dependencies (must already exist):
--   public.platform_organizations(id)
--   public.get_user_organization_id(_user_id uuid) -> uuid
--   public.is_admin(_user_id uuid) -> boolean
--   public.set_updated_at()  (trigger function)
--
-- DOES NOT create is_admin -- uses existing is_admin(_user_id uuid)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. organization_profile
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_profile (
  organization_id  uuid         PRIMARY KEY
    REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  org_type         text         NOT NULL
    CHECK (org_type IN ('beneficio_privado','cooperativa','exportador','productor_grande')),
  activities       text[]       NOT NULL DEFAULT '{}',
  crops            text[]       NOT NULL DEFAULT '{}',
  season_start_month smallint   NULL CHECK (season_start_month BETWEEN 1 AND 12),
  season_end_month   smallint   NULL CHECK (season_end_month BETWEEN 1 AND 12),
  roles_text       text         NULL,
  default_country  text         NULL,
  checklist        jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_profile_org_type
  ON public.organization_profile (org_type);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_org_profile_updated_at'
      AND tgrelid = 'public.organization_profile'::regclass
  ) THEN
    CREATE TRIGGER trg_org_profile_updated_at
      BEFORE UPDATE ON public.organization_profile
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. organization_setup_state
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_setup_state (
  organization_id  uuid         PRIMARY KEY
    REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  wizard_version   int          NOT NULL DEFAULT 1,
  current_step     smallint     NOT NULL DEFAULT 1,
  completed_steps  smallint[]   NOT NULL DEFAULT '{}',
  is_completed     boolean      NOT NULL DEFAULT false,
  completed_at     timestamptz  NULL,
  checklist        jsonb        NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at     timestamptz  NOT NULL DEFAULT now(),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_setup_state_completed_seen
  ON public.organization_setup_state (is_completed, last_seen_at);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_setup_state_updated_at'
      AND tgrelid = 'public.organization_setup_state'::regclass
  ) THEN
    CREATE TRIGGER trg_setup_state_updated_at
      BEFORE UPDATE ON public.organization_setup_state
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Patch: if table existed with column "completed" but no "is_completed"
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_setup_state'
      AND column_name = 'completed'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_setup_state'
      AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE public.organization_setup_state
      ADD COLUMN is_completed boolean NOT NULL DEFAULT false;
    UPDATE public.organization_setup_state
      SET is_completed = completed
      WHERE completed IS NOT NULL;
    COMMENT ON COLUMN public.organization_setup_state.completed IS
      'Deprecated: use is_completed. Kept for backward compat.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. agro_alerts
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agro_alerts (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid         NOT NULL
    REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  title            text         NOT NULL,
  description      text         NULL,
  category         text         NOT NULL DEFAULT 'general',
  severity         text         NOT NULL DEFAULT 'media'
    CHECK (severity IN ('baja','media','alta','critica')),
  status           text         NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','ack','closed')),
  source           text         NULL,
  metadata         jsonb        NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_by  uuid         NULL,
  acknowledged_at  timestamptz  NULL,
  closed_at        timestamptz  NULL,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agro_alerts_org_status
  ON public.agro_alerts (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_agro_alerts_org_created
  ON public.agro_alerts (organization_id, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_agro_alerts_updated_at'
      AND tgrelid = 'public.agro_alerts'::regclass
  ) THEN
    CREATE TRIGGER trg_agro_alerts_updated_at
      BEFORE UPDATE ON public.agro_alerts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- If agro_alerts existed but lacked status audit columns, add them
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='agro_alerts' AND column_name='acknowledged_by'
  ) THEN
    ALTER TABLE public.agro_alerts ADD COLUMN acknowledged_by uuid NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='agro_alerts' AND column_name='acknowledged_at'
  ) THEN
    ALTER TABLE public.agro_alerts ADD COLUMN acknowledged_at timestamptz NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='agro_alerts' AND column_name='closed_at'
  ) THEN
    ALTER TABLE public.agro_alerts ADD COLUMN closed_at timestamptz NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='agro_alerts' AND column_name='status'
  ) THEN
    ALTER TABLE public.agro_alerts ADD COLUMN status text NOT NULL DEFAULT 'open'
      CHECK (status IN ('open','ack','closed'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. RLS: organization_profile
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.organization_profile ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_profile' AND policyname='org_profile_select') THEN
    CREATE POLICY org_profile_select ON public.organization_profile FOR SELECT USING (
      organization_id IS NOT NULL
      AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_profile' AND policyname='org_profile_insert') THEN
    CREATE POLICY org_profile_insert ON public.organization_profile FOR INSERT WITH CHECK (
      organization_id IS NOT NULL
      AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_profile' AND policyname='org_profile_update') THEN
    CREATE POLICY org_profile_update ON public.organization_profile FOR UPDATE
      USING (organization_id IS NOT NULL AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid())))
      WITH CHECK (organization_id IS NOT NULL AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_profile' AND policyname='org_profile_delete') THEN
    CREATE POLICY org_profile_delete ON public.organization_profile FOR DELETE USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 5. RLS: organization_setup_state
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.organization_setup_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_setup_state' AND policyname='setup_state_select') THEN
    CREATE POLICY setup_state_select ON public.organization_setup_state FOR SELECT USING (
      organization_id IS NOT NULL
      AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_setup_state' AND policyname='setup_state_insert') THEN
    CREATE POLICY setup_state_insert ON public.organization_setup_state FOR INSERT WITH CHECK (
      organization_id IS NOT NULL
      AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_setup_state' AND policyname='setup_state_update') THEN
    CREATE POLICY setup_state_update ON public.organization_setup_state FOR UPDATE
      USING (organization_id IS NOT NULL AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid())))
      WITH CHECK (organization_id IS NOT NULL AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_setup_state' AND policyname='setup_state_delete') THEN
    CREATE POLICY setup_state_delete ON public.organization_setup_state FOR DELETE USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 6. RLS: agro_alerts
--    SELECT = org member or admin
--    INSERT = admin only
--    UPDATE = NONE (use RPC)
--    DELETE = admin only
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.agro_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agro_alerts' AND policyname='agro_alerts_select') THEN
    CREATE POLICY agro_alerts_select ON public.agro_alerts FOR SELECT USING (
      organization_id IS NOT NULL
      AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agro_alerts' AND policyname='agro_alerts_insert') THEN
    CREATE POLICY agro_alerts_insert ON public.agro_alerts FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agro_alerts' AND policyname='agro_alerts_delete') THEN
    CREATE POLICY agro_alerts_delete ON public.agro_alerts FOR DELETE USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 7. RPC: rpc_upsert_org_profile_v2  (SECURITY INVOKER)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_upsert_org_profile_v2(p_fields jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_user_organization_id(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User has no organization';
  END IF;

  INSERT INTO public.organization_profile (
    organization_id,
    org_type,
    activities,
    crops,
    season_start_month,
    season_end_month,
    roles_text,
    default_country,
    checklist
  ) VALUES (
    v_org_id,
    p_fields->>'org_type',
    COALESCE((SELECT array_agg(e::text) FROM jsonb_array_elements_text(p_fields->'activities') e), '{}'),
    COALESCE((SELECT array_agg(e::text) FROM jsonb_array_elements_text(p_fields->'crops') e), '{}'),
    (p_fields->>'season_start_month')::smallint,
    (p_fields->>'season_end_month')::smallint,
    p_fields->>'roles_text',
    p_fields->>'default_country',
    COALESCE(p_fields->'checklist', '{}'::jsonb)
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    org_type           = COALESCE(EXCLUDED.org_type, organization_profile.org_type),
    activities         = EXCLUDED.activities,
    crops              = EXCLUDED.crops,
    season_start_month = EXCLUDED.season_start_month,
    season_end_month   = EXCLUDED.season_end_month,
    roles_text         = COALESCE(EXCLUDED.roles_text, organization_profile.roles_text),
    default_country    = COALESCE(EXCLUDED.default_country, organization_profile.default_country),
    checklist          = COALESCE(EXCLUDED.checklist, organization_profile.checklist),
    updated_at         = now();
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 8. RPC: rpc_update_setup_state_v2  (SECURITY INVOKER)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_update_setup_state_v2(
  p_current_step    smallint,
  p_completed       boolean,
  p_checklist       jsonb        DEFAULT NULL,
  p_completed_steps smallint[]   DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_user_organization_id(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User has no organization';
  END IF;

  INSERT INTO public.organization_setup_state (
    organization_id, current_step, is_completed,
    completed_at, checklist, completed_steps, last_seen_at
  ) VALUES (
    v_org_id,
    p_current_step,
    COALESCE(p_completed, false),
    CASE WHEN p_completed THEN now() ELSE NULL END,
    COALESCE(p_checklist, '{}'::jsonb),
    COALESCE(p_completed_steps, '{}'),
    now()
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    current_step    = EXCLUDED.current_step,
    is_completed    = EXCLUDED.is_completed,
    completed_at    = CASE WHEN EXCLUDED.is_completed AND organization_setup_state.completed_at IS NULL
                           THEN now() ELSE organization_setup_state.completed_at END,
    checklist       = CASE WHEN EXCLUDED.checklist <> '{}'::jsonb
                           THEN EXCLUDED.checklist ELSE organization_setup_state.checklist END,
    completed_steps = CASE WHEN EXCLUDED.completed_steps <> '{}'
                           THEN EXCLUDED.completed_steps ELSE organization_setup_state.completed_steps END,
    last_seen_at    = now(),
    updated_at      = now();
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 9. RPC: rpc_set_alert_status  (SECURITY DEFINER -- no UPDATE policy)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_set_alert_status(
  p_alert_id uuid,
  p_status   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org_id       uuid;
  v_alert_org_id uuid;
  v_caller_admin boolean;
BEGIN
  IF p_status NOT IN ('open', 'ack', 'closed') THEN
    RAISE EXCEPTION 'Invalid status "%" -- allowed: open, ack, closed', p_status;
  END IF;

  v_org_id := public.get_user_organization_id(auth.uid());
  v_caller_admin := public.is_admin(auth.uid());

  SELECT organization_id INTO v_alert_org_id
    FROM public.agro_alerts
   WHERE id = p_alert_id;

  IF v_alert_org_id IS NULL THEN
    RAISE EXCEPTION 'Alert not found: %', p_alert_id;
  END IF;

  IF v_alert_org_id <> v_org_id AND NOT v_caller_admin THEN
    RAISE EXCEPTION 'Access denied: alert belongs to another organization';
  END IF;

  UPDATE public.agro_alerts SET
    status          = p_status,
    acknowledged_by = CASE WHEN p_status = 'ack'    THEN auth.uid() ELSE acknowledged_by END,
    acknowledged_at = CASE WHEN p_status = 'ack'    THEN now()      ELSE acknowledged_at END,
    closed_at       = CASE WHEN p_status = 'closed' THEN now()      ELSE closed_at END
  WHERE id = p_alert_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 10. Grants
-- ─────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE    ON public.organization_profile     TO authenticated;
GRANT DELETE                    ON public.organization_profile     TO authenticated;
GRANT SELECT, INSERT, UPDATE    ON public.organization_setup_state TO authenticated;
GRANT DELETE                    ON public.organization_setup_state TO authenticated;
GRANT SELECT                    ON public.agro_alerts              TO authenticated;
GRANT INSERT, DELETE            ON public.agro_alerts              TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_upsert_org_profile_v2(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_setup_state_v2(smallint, boolean, jsonb, smallint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_set_alert_status(uuid, text) TO authenticated;

COMMIT;
