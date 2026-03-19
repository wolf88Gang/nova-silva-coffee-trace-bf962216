-- Admin Panel — 04: RLS hardening
-- Revisión de políticas. NO comparar auth.uid() con organization_id.
-- Regla: organization_id se compara con get_user_organization_id(auth.uid()).
-- Riesgos documentados al final.

-- ========== VERIFICACIÓN ==========
-- Ninguna política debe usar: organization_id = auth.uid()
-- Correcto: organization_id = public.get_user_organization_id(auth.uid())
-- get_user_organization_id retorna profiles.organization_id del usuario actual.

-- ========== platform_organizations ==========
-- SELECT: admin ve todo; usuario ve solo su org.
-- UPDATE: solo admin (ya existe admin_orgs_update).

DROP POLICY IF EXISTS "admin_orgs_select" ON public.platform_organizations;
CREATE POLICY "admin_orgs_select" ON public.platform_organizations
  FOR SELECT USING (
    public.is_admin()
    OR id = public.get_user_organization_id(auth.uid())
  );

-- ========== profiles ==========
-- SELECT: admin ve todo; usuario ve su org o su propio perfil.

DROP POLICY IF EXISTS "admin_profiles_select" ON public.profiles;
CREATE POLICY "admin_profiles_select" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
    OR organization_id = public.get_user_organization_id(auth.uid())
    OR user_id = auth.uid()
  );

-- ========== org_billing_settings ==========

DROP POLICY IF EXISTS "admin_obs_select" ON public.org_billing_settings;
CREATE POLICY "admin_obs_select" ON public.org_billing_settings
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

-- ========== invoices ==========

DROP POLICY IF EXISTS "admin_invoices_select" ON public.invoices;
CREATE POLICY "admin_invoices_select" ON public.invoices
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

-- ========== invoice_lines ==========

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

-- ========== payments ==========

DROP POLICY IF EXISTS "admin_payments_select" ON public.payments;
CREATE POLICY "admin_payments_select" ON public.payments
  FOR SELECT USING (
    public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid())
  );

-- ========== admin_action_logs ==========

DROP POLICY IF EXISTS "admin_aal_select" ON public.admin_action_logs;
CREATE POLICY "admin_aal_select" ON public.admin_action_logs
  FOR SELECT USING (
    public.is_admin()
    OR organization_id = public.get_user_organization_id(auth.uid())
    OR target_user_id = auth.uid()
  );

-- ========== RIESGOS Y NOTAS ==========
-- 1. get_user_organization_id puede retornar NULL si el usuario no tiene profiles.organization_id.
--    En ese caso, las políticas que usan = get_user_organization_id(auth.uid()) no devolverán filas.
-- 2. is_admin() usa user_roles.role IN ('admin','superadmin'). Verificar que superadmin existe.
-- 3. profiles.organization_id: si el usuario es admin de otra org, get_user_organization_id retorna
--    su org de profiles, no la org que administra. Los admins globales (superadmin) típicamente
--    no tienen organization_id; is_admin() les da acceso a todo.
-- 4. Ninguna política usa organization_id = auth.uid() (incorrecto: mezcla user_id con org_id).
