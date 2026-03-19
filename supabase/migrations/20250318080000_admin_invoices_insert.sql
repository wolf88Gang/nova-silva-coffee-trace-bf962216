-- Admin Panel — Crear factura manual
-- RLS INSERT para invoices e invoice_lines; trigger para invoice_number.

-- invoices: admin puede insertar
DROP POLICY IF EXISTS "admin_invoices_insert" ON public.invoices;
CREATE POLICY "admin_invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (public.is_admin());

-- invoice_lines: admin puede insertar (vía invoice)
DROP POLICY IF EXISTS "admin_invoice_lines_insert" ON public.invoice_lines;
CREATE POLICY "admin_invoice_lines_insert" ON public.invoice_lines
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id
      AND i.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Trigger: asignar invoice_number al insertar si es null
CREATE OR REPLACE FUNCTION public._trg_invoices_set_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoices_set_number ON public.invoices;
CREATE TRIGGER trg_invoices_set_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public._trg_invoices_set_number();
