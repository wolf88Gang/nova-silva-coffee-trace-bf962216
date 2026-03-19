-- Admin Panel Nova Silva — Fase 3: Admin action logs, vistas resumen
-- Requiere: 20250318010000_admin_panel_billing.sql

-- ========== I) ADMIN ACTION LOG ==========
-- IMPORTANTE: action_payload debe ser minimal. Usar org_id, action_type, códigos.
-- NO almacenar nombres de org, emails ni PII. Ver docs/ADMIN_AUDIT_PRIVACY_GUIDE.md

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.platform_organizations(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type public.admin_action_type NOT NULL,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_org ON public.admin_action_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target_user ON public.admin_action_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_type ON public.admin_action_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created ON public.admin_action_logs (created_at DESC);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_organization_id uuid,
  p_target_user_id uuid,
  p_action_type public.admin_action_type,
  p_action_payload jsonb DEFAULT '{}'::jsonb,
  p_notes text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.admin_action_logs (organization_id, target_user_id, action_type, action_payload, notes, created_by)
  VALUES (p_organization_id, p_target_user_id, p_action_type, p_action_payload, p_notes, COALESCE(p_created_by, auth.uid()))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ========== J) VIEWS ==========

CREATE OR REPLACE VIEW public.v_admin_organizations_summary AS
SELECT
  o.id AS organization_id,
  COALESCE(o.name, o.display_name, 'Sin nombre') AS organization_name,
  o.tipo,
  o.plan,
  o.status,
  o.country,
  o.created_at,
  o.trial_ends_at,
  (
    SELECT i.status
    FROM public.invoices i
    WHERE i.organization_id = o.id
    ORDER BY i.period_end DESC
    LIMIT 1
  ) AS last_invoice_status,
  (
    SELECT i.due_at
    FROM public.invoices i
    WHERE i.organization_id = o.id
    ORDER BY i.period_end DESC
    LIMIT 1
  ) AS last_invoice_due_at,
  (
    SELECT COALESCE(SUM(i.total_amount), 0)
    FROM public.invoices i
    WHERE i.organization_id = o.id
    AND i.status NOT IN ('paid', 'void')
  ) AS outstanding_balance,
  (
    SELECT COUNT(DISTINCT p.user_id)
    FROM public.profiles p
    WHERE p.organization_id = o.id
    AND (p.is_active IS NULL OR p.is_active = true)
  ) AS active_user_count,
  (
    SELECT MAX(snapshot_month)
    FROM public.billing_usage_snapshots s
    WHERE s.organization_id = o.id
  ) AS latest_snapshot_month
FROM public.platform_organizations o;

CREATE OR REPLACE VIEW public.v_admin_users_summary AS
SELECT
  p.user_id,
  p.full_name,
  p.email,
  p.organization_id,
  COALESCE(o.name, o.display_name, 'Sin org') AS organization_name,
  COALESCE(p.is_active, true) AS is_active,
  p.last_login_at,
  (
    SELECT jsonb_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL)
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
  ) AS roles
FROM public.profiles p
LEFT JOIN public.platform_organizations o ON o.id = p.organization_id;
