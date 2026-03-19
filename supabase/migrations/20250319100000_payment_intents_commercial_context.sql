-- payment_intents: extensión mínima para contexto comercial.
-- Sin tocar billing. Sin romper registros existentes.

-- intent_type: sandbox_test | plan_checkout | addon_checkout | invoice_payment
ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS intent_type text NOT NULL DEFAULT 'sandbox_test';

-- reference_type: invoice | org_billing_settings | manual | none
ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS reference_type text NOT NULL DEFAULT 'none';

-- reference_id: uuid de invoice, org_billing_settings, etc. Null para none/manual
ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS reference_id uuid;

-- description: etiqueta humana "qué estaba pagando"
ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.payment_intents.intent_type IS 'sandbox_test | plan_checkout | addon_checkout | invoice_payment';
COMMENT ON COLUMN public.payment_intents.reference_type IS 'invoice | org_billing_settings | manual | none';
COMMENT ON COLUMN public.payment_intents.reference_id IS 'UUID de invoice o org_billing_settings según reference_type';
COMMENT ON COLUMN public.payment_intents.description IS 'Etiqueta humana del intento';
