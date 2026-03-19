-- Admin Panel Nova Silva — Fase 2: Billing, usage, invoices, payments
-- Requiere: 20250318000000_admin_panel_enums_and_orgs.sql

-- ========== E) BILLING PLANS ==========

CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.org_plan NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_custom boolean NOT NULL DEFAULT false,
  default_monthly_price numeric(12,2) NOT NULL DEFAULT 0,
  default_annual_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.billing_plans (code, name, description, default_monthly_price, default_annual_price)
VALUES
  ('lite', 'Lite', 'Plan básico', 400, 4000),
  ('smart', 'Smart', 'Plan estándar', 800, 8000),
  ('plus', 'Plus', 'Plan premium', 1500, 15000),
  ('none', 'Sin plan', 'Sin suscripción activa', 0, 0)
ON CONFLICT (code) DO NOTHING;

-- ========== BILLING ADDONS ==========

CREATE TABLE IF NOT EXISTS public.billing_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  billing_mode text NOT NULL DEFAULT 'fixed',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.billing_addons (code, name, description)
VALUES
  ('eudr_pack', 'EUDR Pack', 'Módulo EUDR'),
  ('nova_guard_pack', 'Nova Guard Pack', 'Módulo Nova Guard'),
  ('vital_pack', 'Vital Pack', 'Módulo Vital'),
  ('nova_yield_pack', 'Nova Yield Pack', 'Módulo Nova Yield'),
  ('jornales_pack', 'Jornales Pack', 'Módulo Jornales')
ON CONFLICT (code) DO NOTHING;

-- ========== ORG BILLING SETTINGS ==========

CREATE TABLE IF NOT EXISTS public.org_billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  plan_code public.org_plan NOT NULL DEFAULT 'none',
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'mensual',
  status public.org_status NOT NULL DEFAULT 'en_prueba',
  monthly_price_override numeric(12,2),
  annual_price_override numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscription_started_at timestamptz,
  subscription_ends_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT false,
  payment_terms_days integer NOT NULL DEFAULT 15,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_billing_settings_org ON public.org_billing_settings (organization_id);

DROP TRIGGER IF EXISTS trg_org_billing_settings_updated ON public.org_billing_settings;
CREATE TRIGGER trg_org_billing_settings_updated
  BEFORE UPDATE ON public.org_billing_settings
  FOR EACH ROW EXECUTE FUNCTION public._admin_updated_at();

-- ========== ORG BILLING ADDONS ==========

CREATE TABLE IF NOT EXISTS public.org_billing_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.billing_addons(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  monthly_price_override numeric(12,2),
  annual_price_override numeric(12,2),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, addon_id)
);

CREATE INDEX IF NOT EXISTS idx_org_billing_addons_org ON public.org_billing_addons (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_billing_addons_active ON public.org_billing_addons (is_active);

-- ========== F) USAGE SNAPSHOTS ==========

CREATE TABLE IF NOT EXISTS public.billing_usage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  snapshot_month date NOT NULL,
  metric_code text NOT NULL,
  metric_value numeric(14,2) NOT NULL DEFAULT 0,
  source_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, snapshot_month, metric_code)
);

CREATE INDEX IF NOT EXISTS idx_billing_usage_org_month ON public.billing_usage_snapshots (organization_id, snapshot_month);

CREATE OR REPLACE FUNCTION public.upsert_billing_usage_snapshot(
  p_organization_id uuid,
  p_snapshot_month date,
  p_metric_code text,
  p_metric_value numeric,
  p_source_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.billing_usage_snapshots (organization_id, snapshot_month, metric_code, metric_value, source_note)
  VALUES (p_organization_id, p_snapshot_month, p_metric_code, p_metric_value, p_source_note)
  ON CONFLICT (organization_id, snapshot_month, metric_code)
  DO UPDATE SET metric_value = EXCLUDED.metric_value, source_note = COALESCE(EXCLUDED.source_note, billing_usage_snapshots.source_note);
END;
$$;

-- ========== G) INVOICES ==========

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  invoice_number text UNIQUE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_at ON public.invoices (due_at);

DROP TRIGGER IF EXISTS trg_invoices_updated ON public.invoices;
CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public._admin_updated_at();

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
  yymm text;
BEGIN
  n := nextval('public.invoice_number_seq');
  yymm := to_char(now(), 'YYYYMM');
  RETURN 'NS-' || yymm || '-' || lpad(n::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal numeric(12,2);
  v_tax numeric(12,2) := 0;
BEGIN
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM public.invoice_lines WHERE invoice_id = p_invoice_id;

  UPDATE public.invoices
  SET subtotal = v_subtotal, tax_amount = v_tax, total_amount = v_subtotal + v_tax, updated_at = now()
  WHERE id = p_invoice_id;
END;
$$;

-- ========== INVOICE LINES ==========

CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  line_type text NOT NULL,
  code text,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON public.invoice_lines (invoice_id);

-- Trigger para recalcular totales al cambiar lines
CREATE OR REPLACE FUNCTION public._trg_invoice_lines_recalc()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_invoice_totals(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_invoice_totals(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_lines_recalc ON public.invoice_lines;
CREATE TRIGGER trg_invoice_lines_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_lines
  FOR EACH ROW EXECUTE FUNCTION public._trg_invoice_lines_recalc();

-- ========== H) PAYMENTS ==========

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_date timestamptz NOT NULL DEFAULT now(),
  method public.payment_method_type NOT NULL DEFAULT 'transferencia',
  reference text,
  notes text,
  registered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments (organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments (payment_date DESC);

CREATE OR REPLACE FUNCTION public.mark_invoice_paid_if_fully_covered(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric(12,2);
  v_paid numeric(12,2);
BEGIN
  SELECT total_amount INTO v_total FROM public.invoices WHERE id = p_invoice_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM public.payments WHERE invoice_id = p_invoice_id;

  IF v_paid >= v_total AND v_total > 0 THEN
    UPDATE public.invoices SET status = 'paid', paid_at = now(), updated_at = now() WHERE id = p_invoice_id;
  END IF;
END;
$$;

-- Al registrar pago, marcar factura como pagada si está cubierta
CREATE OR REPLACE FUNCTION public._trg_payments_mark_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_id IS NOT NULL THEN
    PERFORM public.mark_invoice_paid_if_fully_covered(NEW.invoice_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_mark_invoice ON public.payments;
CREATE TRIGGER trg_payments_mark_invoice
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public._trg_payments_mark_invoice();
