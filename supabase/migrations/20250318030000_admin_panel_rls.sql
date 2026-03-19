-- Admin Panel Nova Silva — Fase 4: RLS
-- Admin/superadmin ven todo. Usuarios normales solo su organización.
-- IMPORTANTE: usar get_user_organization_id(auth.uid()), NO organization_id = auth.uid()

-- ========== PLATFORM_ORGANIZATIONS ==========

ALTER TABLE public.platform_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_orgs_select" ON public.platform_organizations;
CREATE POLICY "admin_orgs_select" ON public.platform_organizations
  FOR SELECT USING (
    public.is_admin()
    OR id = public.get_user_organization_id(auth.uid())
  );

-- ========== PROFILES ==========

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_profiles_select" ON public.profiles;
CREATE POLICY "admin_profiles_select" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
    OR organization_id = public.get_user_organization_id(auth.uid())
    OR user_id = auth.uid()
  );

-- ========== USER_ROLES ==========

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_user_roles_select" ON public.user_roles;
CREATE POLICY "admin_user_roles_select" ON public.user_roles
  FOR SELECT USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR (organization_id IS NOT NULL AND organization_id = public.get_user_organization_id(auth.uid()))
  );

-- ========== BILLING TABLES ==========

ALTER TABLE public.org_billing_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_obs_select" ON public.org_billing_settings;
CREATE POLICY "admin_obs_select" ON public.org_billing_settings
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

ALTER TABLE public.org_billing_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_oba_select" ON public.org_billing_addons;
CREATE POLICY "admin_oba_select" ON public.org_billing_addons
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

ALTER TABLE public.billing_usage_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_bus_select" ON public.billing_usage_snapshots;
CREATE POLICY "admin_bus_select" ON public.billing_usage_snapshots
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_invoices_select" ON public.invoices;
CREATE POLICY "admin_invoices_select" ON public.invoices
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_invoice_lines_select" ON public.invoice_lines;
CREATE POLICY "admin_invoice_lines_select" ON public.invoice_lines
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_lines.invoice_id
      AND i.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_payments_select" ON public.payments;
CREATE POLICY "admin_payments_select" ON public.payments
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

-- ========== ADMIN_ACTION_LOGS ==========

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_aal_select" ON public.admin_action_logs;
CREATE POLICY "admin_aal_select" ON public.admin_action_logs
  FOR SELECT USING (
    public.is_admin()
    OR organization_id = public.get_user_organization_id(auth.uid())
    OR target_user_id = auth.uid()
  );

-- ========== BILLING_PLANS / BILLING_ADDONS ==========
-- Catálogos: lectura para todos autenticados

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_bp_select" ON public.billing_plans;
CREATE POLICY "admin_bp_select" ON public.billing_plans FOR SELECT TO authenticated USING (true);

ALTER TABLE public.billing_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_ba_select" ON public.billing_addons;
CREATE POLICY "admin_ba_select" ON public.billing_addons FOR SELECT TO authenticated USING (true);
