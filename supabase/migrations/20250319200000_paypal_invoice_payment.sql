-- PayPal invoice payment: RPC para registrar pago y agregar método paypal.

-- Agregar 'paypal' al enum payment_method_type (idempotente)
DO $$
BEGIN
  ALTER TYPE public.payment_method_type ADD VALUE 'paypal';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC: registrar pago PayPal para invoice (evita RLS, valida org)
CREATE OR REPLACE FUNCTION public.register_paypal_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'USD',
  p_provider_order_id text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_registered_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_org uuid;
  v_payment_id uuid;
BEGIN
  SELECT organization_id INTO v_invoice_org FROM public.invoices WHERE id = p_invoice_id;
  IF v_invoice_org IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  IF p_organization_id IS NOT NULL AND v_invoice_org != p_organization_id THEN
    RAISE EXCEPTION 'Invoice does not belong to organization';
  END IF;

  INSERT INTO public.payments (
    organization_id,
    invoice_id,
    amount,
    currency,
    method,
    reference,
    registered_by
  )
  VALUES (
    COALESCE(p_organization_id, v_invoice_org),
    p_invoice_id,
    p_amount,
    COALESCE(NULLIF(trim(p_currency), ''), 'USD'),
    'paypal',
    p_provider_order_id,
    p_registered_by
  )
  RETURNING id INTO v_payment_id;

  PERFORM public.mark_invoice_paid_if_fully_covered(p_invoice_id);
  RETURN v_payment_id;
END;
$$;

COMMENT ON FUNCTION public.register_paypal_invoice_payment IS 'Registra pago PayPal para invoice. Usado por paypal-proxy en capture.';
