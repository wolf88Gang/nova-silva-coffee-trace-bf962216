-- ============================================================
-- Migration 09 – Quote RPCs & commission trigger
-- Run in Supabase SQL Editor (single transaction).
-- ============================================================

-- ─── 1. RPC: create_quote ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_quote(
  p_plan_id   uuid,
  p_supplier_id uuid,
  p_items_json jsonb  -- [{ "product": "...", "qty": 10, "unit": "kg", "unit_price": 5.00 }]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id       uuid;
  v_commission    numeric;
  v_subtotal      numeric := 0;
  v_total         numeric;
  v_commission_amt numeric;
  v_quote_id      uuid;
  v_lines         jsonb := '[]'::jsonb;
  v_item          jsonb;
  v_line_total    numeric;
BEGIN
  -- Resolve org
  v_org_id := get_user_organization_id(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found for current user';
  END IF;

  -- Get supplier commission
  SELECT commission_pct_default INTO v_commission
    FROM ag_suppliers
   WHERE id = p_supplier_id
     AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier not found or not in your organization';
  END IF;

  -- Build lines & subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_json)
  LOOP
    v_line_total := (v_item->>'qty')::numeric * (v_item->>'unit_price')::numeric;
    v_subtotal   := v_subtotal + v_line_total;
    v_lines      := v_lines || jsonb_build_object(
      'product',    v_item->>'product',
      'qty',        (v_item->>'qty')::numeric,
      'unit',       v_item->>'unit',
      'unit_price', (v_item->>'unit_price')::numeric,
      'total',      v_line_total
    );
  END LOOP;

  v_commission_amt := v_subtotal * v_commission;
  v_total          := v_subtotal + v_commission_amt;

  INSERT INTO ag_quotes (
    organization_id, plan_id, supplier_id,
    quote_status, quote_json, idempotency_key
  ) VALUES (
    v_org_id, p_plan_id, p_supplier_id,
    'draft',
    jsonb_build_object(
      'lines',             v_lines,
      'subtotal',          v_subtotal,
      'commission_pct',    v_commission,
      'commission_amount', v_commission_amt,
      'total',             v_total
    ),
    'q_' || p_plan_id::text || '_' || p_supplier_id::text
  )
  RETURNING id INTO v_quote_id;

  -- Log creation event
  INSERT INTO ag_quote_events (quote_id, event_type, payload)
  VALUES (v_quote_id, 'created', jsonb_build_object('by', auth.uid()));

  RETURN v_quote_id;
END;
$$;

-- ─── 2. RPC: update_quote_status ─────────────────────────────
CREATE OR REPLACE FUNCTION public.update_quote_status(
  p_quote_id   uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id     uuid;
  v_old_status text;
BEGIN
  v_org_id := get_user_organization_id(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found for current user';
  END IF;

  SELECT quote_status INTO v_old_status
    FROM ag_quotes
   WHERE id = p_quote_id
     AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found or access denied';
  END IF;

  -- Validate transitions
  IF NOT (
    (v_old_status = 'draft'    AND p_new_status IN ('sent', 'cancelled'))
    OR (v_old_status = 'sent'  AND p_new_status IN ('accepted', 'expired', 'cancelled'))
    OR (v_old_status = 'accepted' AND p_new_status IN ('fulfilled', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Invalid transition: % → %', v_old_status, p_new_status;
  END IF;

  UPDATE ag_quotes
     SET quote_status = p_new_status,
         updated_at   = now()
   WHERE id = p_quote_id;

  INSERT INTO ag_quote_events (quote_id, event_type, payload)
  VALUES (p_quote_id, p_new_status, jsonb_build_object(
    'by', auth.uid(),
    'from', v_old_status
  ));
END;
$$;

-- ─── 3. RPC: get_my_quotes (if not already created) ──────────
CREATE OR REPLACE FUNCTION public.get_my_quotes()
RETURNS SETOF ag_quotes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
    FROM ag_quotes
   WHERE organization_id = get_user_organization_id(auth.uid())
   ORDER BY created_at DESC;
$$;

-- ─── 4. RPC: get_my_suppliers (if not already created) ───────
CREATE OR REPLACE FUNCTION public.get_my_suppliers()
RETURNS SETOF ag_suppliers
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
    FROM ag_suppliers
   WHERE organization_id = get_user_organization_id(auth.uid())
   ORDER BY nombre;
$$;

-- ─── 5. Trigger: auto-create commission on accepted/fulfilled ─
CREATE OR REPLACE FUNCTION public.fn_ag_quote_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.quote_status IN ('accepted', 'fulfilled')
     AND (OLD.quote_status IS DISTINCT FROM NEW.quote_status) THEN

    INSERT INTO ag_commissions (
      organization_id, quote_id, supplier_id,
      amount, commission_pct, status
    )
    SELECT
      NEW.organization_id,
      NEW.id,
      NEW.supplier_id,
      (NEW.quote_json->>'commission_amount')::numeric,
      (NEW.quote_json->>'commission_pct')::numeric,
      CASE NEW.quote_status
        WHEN 'accepted' THEN 'pending'
        WHEN 'fulfilled' THEN 'paid'
      END
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ag_quote_commission ON ag_quotes;
CREATE TRIGGER trg_ag_quote_commission
  AFTER UPDATE ON ag_quotes
  FOR EACH ROW
  EXECUTE FUNCTION fn_ag_quote_commission();

-- ─── 6. Grant execute to authenticated ───────────────────────
GRANT EXECUTE ON FUNCTION public.create_quote(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_quote_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_quotes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_suppliers() TO authenticated;
