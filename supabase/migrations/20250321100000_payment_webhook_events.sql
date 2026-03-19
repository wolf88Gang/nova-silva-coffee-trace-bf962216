-- payment_webhook_events: trazabilidad de eventos PayPal recibidos vía webhook.
-- Solo registro y trazabilidad. No automatiza conciliación en esta fase.

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  provider text NOT NULL DEFAULT 'paypal',
  event_type text NOT NULL,
  provider_event_id text,
  provider_order_id text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'received',
  notes text
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_provider ON public.payment_webhook_events (provider);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_type ON public.payment_webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_provider_order ON public.payment_webhook_events (provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_created ON public.payment_webhook_events (created_at DESC);

COMMENT ON TABLE public.payment_webhook_events IS 'Eventos PayPal recibidos vía webhook. Trazabilidad mínima.';
COMMENT ON COLUMN public.payment_webhook_events.processing_status IS 'received | verified | verification_failed | processed';

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Solo admin puede leer (para conciliación/debug)
CREATE POLICY "payment_webhook_events_select" ON public.payment_webhook_events
  FOR SELECT USING (public.is_admin());

-- INSERT: solo vía service role (Edge Function webhook). Sin policy INSERT, anon/authenticated
-- no pueden insertar. Service role bypass RLS y puede insertar.
