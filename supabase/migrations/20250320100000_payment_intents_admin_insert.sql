-- Admin puede insertar payment_intents para cualquier org (flujo invoice desde admin).
-- Requerido para que admin pueda iniciar pago PayPal de facturas de otras organizaciones.

DROP POLICY IF EXISTS "payment_intents_insert" ON public.payment_intents;
CREATE POLICY "payment_intents_insert" ON public.payment_intents
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin()
  );
