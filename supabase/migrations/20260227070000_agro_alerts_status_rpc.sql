-- ═══════════════════════════════════════════════════════════════════════
-- Migration: agro_alerts table + rpc_set_alert_status
-- Version: 20260227070000
-- Idempotent: IF NOT EXISTS / CREATE OR REPLACE throughout
-- Dependencies: platform_organizations, get_user_organization_id(uuid),
--               is_admin(uuid), set_updated_at()
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Table: agro_alerts
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agro_alerts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid       NOT NULL
    REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text        NULL,
  category       text        NOT NULL DEFAULT 'general',
  severity       text        NOT NULL DEFAULT 'media'
    CHECK (severity IN ('baja', 'media', 'alta', 'critica')),
  status         text        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'ack', 'closed')),
  source         text        NULL,
  metadata       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_by uuid       NULL REFERENCES auth.users(id),
  acknowledged_at timestamptz NULL,
  closed_at      timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agro_alerts IS
  'Agro-operational alerts scoped by organization. Status transitions: open → ack → closed.';

CREATE INDEX IF NOT EXISTS idx_agro_alerts_org_status
  ON public.agro_alerts (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_agro_alerts_org_created
  ON public.agro_alerts (organization_id, created_at DESC);

-- Trigger: auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at' AND tgrelid = 'public.agro_alerts'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.agro_alerts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. RLS Policies
--    SELECT:  own org OR admin
--    INSERT:  admin only
--    UPDATE:  NONE via PostgREST (use RPC instead)
--    DELETE:  admin only
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.agro_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agro_alerts' AND policyname = 'agro_alerts_select'
  ) THEN
    CREATE POLICY agro_alerts_select ON public.agro_alerts
      FOR SELECT USING (
        organization_id = public.get_user_organization_id(auth.uid())
        OR public.is_admin(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agro_alerts' AND policyname = 'agro_alerts_insert'
  ) THEN
    CREATE POLICY agro_alerts_insert ON public.agro_alerts
      FOR INSERT WITH CHECK (
        public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- No UPDATE policy for authenticated users — all status changes go through RPC

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agro_alerts' AND policyname = 'agro_alerts_delete'
  ) THEN
    CREATE POLICY agro_alerts_delete ON public.agro_alerts
      FOR DELETE USING (
        public.is_admin(auth.uid())
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. RPC: rpc_set_alert_status
--    SECURITY DEFINER so it can bypass the absence of an UPDATE policy.
--    Validates: org ownership, allowed status values, sets audit fields.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rpc_set_alert_status(
  p_alert_id uuid,
  p_status   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id  uuid;
  v_alert   record;
BEGIN
  -- Validate status value
  IF p_status NOT IN ('open', 'ack', 'closed') THEN
    RAISE EXCEPTION 'Invalid status "%". Allowed: open, ack, closed', p_status;
  END IF;

  -- Resolve caller's organization
  v_org_id := public.get_user_organization_id(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User % has no organization', auth.uid();
  END IF;

  -- Fetch alert and verify org ownership
  SELECT id, organization_id, status
    INTO v_alert
    FROM public.agro_alerts
   WHERE id = p_alert_id;

  IF v_alert IS NULL THEN
    RAISE EXCEPTION 'Alert % not found', p_alert_id;
  END IF;

  IF v_alert.organization_id <> v_org_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: alert belongs to a different organization';
  END IF;

  -- Apply update — only status + audit columns
  UPDATE public.agro_alerts SET
    status          = p_status,
    acknowledged_by = CASE WHEN p_status = 'ack' THEN auth.uid() ELSE acknowledged_by END,
    acknowledged_at = CASE WHEN p_status = 'ack' THEN now()      ELSE acknowledged_at END,
    closed_at       = CASE WHEN p_status = 'closed' THEN now()   ELSE closed_at END
  WHERE id = p_alert_id;
END;
$$;

COMMENT ON FUNCTION public.rpc_set_alert_status IS
  'Sets agro_alerts.status to open/ack/closed. Validates org ownership. '
  'SECURITY DEFINER bypasses missing UPDATE policy — only status + audit fields are modified.';

-- ─────────────────────────────────────────────────────────────────────
-- 4. Grants
-- ─────────────────────────────────────────────────────────────────────

GRANT SELECT ON public.agro_alerts TO authenticated;
GRANT INSERT, DELETE ON public.agro_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_set_alert_status(uuid, text) TO authenticated;

COMMIT;
