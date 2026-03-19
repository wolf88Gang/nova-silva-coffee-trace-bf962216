-- payment_intents: trazabilidad interna de intentos de pago (PayPal sandbox, etc.)
-- No conectado a billing. Solo auditoría de create/get/capture.

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'paypal',
  provider_order_id text,
  amount numeric,
  currency text,
  status text NOT NULL DEFAULT 'created',
  source text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_org ON public.payment_intents(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_order ON public.payment_intents(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created ON public.payment_intents(created_at DESC);

COMMENT ON TABLE public.payment_intents IS 'Trazabilidad de intentos de pago (PayPal sandbox). No billing.';

CREATE TRIGGER trg_payment_intents_updated
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public._admin_updated_at();

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- SELECT: admin ve todo; usuario ve solo su organización
CREATE POLICY "payment_intents_select" ON public.payment_intents
  FOR SELECT USING (
    public.is_admin()
    OR organization_id = public.get_user_organization_id(auth.uid())
  );

-- INSERT: solo para la propia organización
CREATE POLICY "payment_intents_insert" ON public.payment_intents
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

-- UPDATE: solo para la propia organización (actualizar status en get/capture)
CREATE POLICY "payment_intents_update" ON public.payment_intents
  FOR UPDATE USING (
    public.is_admin()
    OR organization_id = public.get_user_organization_id(auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR organization_id = public.get_user_organization_id(auth.uid())
  );
