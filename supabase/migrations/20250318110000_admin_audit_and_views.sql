-- Admin Panel — 03: Auditoría y vistas
-- Consolida vistas admin. Solo campos necesarios. Sin tablas paralelas ni columnas sombra.
-- Consumo por ruta: ver comentarios en cada vista.

-- ========== v_admin_organizations_summary ==========
-- Consumo: /admin/overview, /admin/organizations, /admin/billing (subscriptions), /admin/growth (trial metrics)
-- Campos: id, name, tipo, plan, status, country, created_at, trial_ends_at, last_invoice_*, outstanding_balance, active_user_count, latest_snapshot_month

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

COMMENT ON VIEW public.v_admin_organizations_summary IS 'Admin: /admin/overview, /admin/organizations, /admin/billing, /admin/growth. Solo campos necesarios.';

-- ========== v_admin_users_summary ==========
-- Consumo: /admin/users, /admin/organizations/:id (tab usuarios)
-- Campos: user_id, full_name, email, organization_id, organization_name, is_active, last_login_at, created_at, roles

CREATE OR REPLACE VIEW public.v_admin_users_summary AS
SELECT
  p.user_id,
  p.full_name,
  p.email,
  p.organization_id,
  COALESCE(o.name, o.display_name, 'Sin org') AS organization_name,
  COALESCE(p.is_active, true) AS is_active,
  p.last_login_at,
  COALESCE(p.created_at, p.updated_at) AS created_at,
  (
    SELECT jsonb_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL)
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
  ) AS roles
FROM public.profiles p
LEFT JOIN public.platform_organizations o ON o.id = p.organization_id;

COMMENT ON VIEW public.v_admin_users_summary IS 'Admin: /admin/users, /admin/organizations/:id. Requiere profiles.created_at (20250318100000).';

-- ========== v_admin_compliance_issues ==========
-- Consumo: /admin/compliance (cola de revisión)
-- Fuentes: invoices (overdue, issued). Sin tablas paralelas.
-- Estructura: id, organization_id, organization_name, category, severity, status, description, created_at, action_route, action_label

CREATE OR REPLACE VIEW public.v_admin_compliance_issues AS
SELECT
  ('inv-' || i.id::text)::text AS id,
  i.organization_id,
  COALESCE(o.name, o.display_name, 'Sin org') AS organization_name,
  'Facturación'::text AS category,
  CASE WHEN (i.status::text = 'overdue') THEN 'critical'::text ELSE 'high'::text END AS severity,
  CASE WHEN (i.status::text = 'overdue') THEN 'open'::text ELSE 'in_review'::text END AS status,
  CASE
    WHEN (i.status::text = 'overdue') THEN ('Factura vencida — cuenta en mora ($' || COALESCE(i.total_amount, 0)::text || ')')
    ELSE ('Factura pendiente de pago ($' || COALESCE(i.total_amount, 0)::text || ')')
  END AS description,
  COALESCE(i.due_at, i.period_end)::timestamptz AS created_at,
  '/admin/billing'::text AS action_route,
  'Registrar pago'::text AS action_label
FROM public.invoices i
LEFT JOIN public.platform_organizations o ON o.id = i.organization_id
WHERE i.status IN ('overdue', 'issued');

COMMENT ON VIEW public.v_admin_compliance_issues IS 'Admin: /admin/compliance. Issues desde invoices overdue/issued. Solo fuentes reales.';

-- ========== RPC: get_admin_compliance_metrics ==========
-- Retorna métricas reales mínimas. Solo admin. Parcelas sin polígono si tabla existe.

CREATE OR REPLACE FUNCTION public.get_admin_compliance_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overdue int;
  v_pending int;
  v_parcelas_sin int := 0;
  v_parcelas_status text := 'pendiente';
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT COUNT(*)::int INTO v_overdue FROM public.invoices WHERE status = 'overdue';
  SELECT COUNT(*)::int INTO v_pending FROM public.invoices WHERE status = 'issued';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcelas')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'poligono_geojson') THEN
    SELECT COUNT(*)::int INTO v_parcelas_sin FROM public.parcelas WHERE poligono_geojson IS NULL;
    v_parcelas_status := 'real';
  END IF;

  RETURN jsonb_build_object(
    'invoices_overdue_count', v_overdue,
    'invoices_pending_count', v_pending,
    'parcelas_sin_poligono_count', v_parcelas_sin,
    'parcelas_sin_poligono_status', v_parcelas_status
  );
END;
$$;

COMMENT ON FUNCTION public.get_admin_compliance_metrics() IS 'Admin: métricas compliance. Solo is_admin().';
