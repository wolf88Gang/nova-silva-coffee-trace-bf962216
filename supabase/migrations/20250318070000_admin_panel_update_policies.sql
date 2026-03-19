-- Admin Panel — Políticas UPDATE para acciones admin
-- Solo admin/superadmin pueden actualizar.

DROP POLICY IF EXISTS "admin_orgs_update" ON public.platform_organizations;
CREATE POLICY "admin_orgs_update" ON public.platform_organizations
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_obs_update" ON public.org_billing_settings;
CREATE POLICY "admin_obs_update" ON public.org_billing_settings
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pagos: admin puede insertar
DROP POLICY IF EXISTS "admin_payments_insert" ON public.payments;
CREATE POLICY "admin_payments_insert" ON public.payments
  FOR INSERT WITH CHECK (public.is_admin());
