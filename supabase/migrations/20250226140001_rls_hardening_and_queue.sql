-- Migration 001: RLS hardening + trigger cola + RPC para paquete NG→Impacto
-- Helpers usados: get_user_organization_id(auth.uid()), is_admin() (sin params).
-- NO tocar platform_organizations ni helpers existentes.

-- Firmas detectadas:
--   public.get_user_organization_id(p_user_id uuid) RETURNS uuid
--   public.is_admin() RETURNS boolean  -- usa auth.uid() internamente
--   has_role, get_user_productor_id: NO existen en el repo

-- ========== 1. Habilitar RLS en las 5 tablas ==========
ALTER TABLE public.agro_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ng_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ng_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agro_state_parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_adjustments ENABLE ROW LEVEL SECURITY;

-- ========== 2. RLS: agro_events, ng_diagnostics, ng_impacts, yield_adjustments ==========
-- Condición canónica: organization_id IS NOT NULL AND (org match OR admin)
DO $$
DECLARE
  tbl text;
  tables_standard text[] := ARRAY['agro_events', 'ng_diagnostics', 'ng_impacts', 'yield_adjustments'];
  pol_name text;
  cond text := 'organization_id IS NOT NULL AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())';
BEGIN
  FOREACH tbl IN ARRAY tables_standard LOOP
    FOR pol_name IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, tbl);
    END LOOP;

    EXECUTE format('CREATE POLICY "ng_agro_select_%s" ON public.%I FOR SELECT USING (' || cond || ')', tbl, tbl);
    EXECUTE format('CREATE POLICY "ng_agro_insert_%s" ON public.%I FOR INSERT WITH CHECK (' || cond || ')', tbl, tbl);
    EXECUTE format('CREATE POLICY "ng_agro_update_%s" ON public.%I FOR UPDATE USING (' || cond || ')', tbl, tbl);
    EXECUTE format('CREATE POLICY "ng_agro_delete_%s" ON public.%I FOR DELETE USING (' || cond || ')', tbl, tbl);
  END LOOP;
END $$;

-- ========== 3. RLS: agro_state_parcela (SELECT por org; INSERT/UPDATE/DELETE solo admin) ==========
DO $$
DECLARE
  pol_name text;
  cond_select text := 'organization_id IS NOT NULL AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())';
  cond_admin text := 'public.is_admin()';
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agro_state_parcela'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.agro_state_parcela', pol_name);
  END LOOP;

  EXECUTE 'CREATE POLICY "ng_agro_select_agro_state_parcela" ON public.agro_state_parcela FOR SELECT USING (' || cond_select || ')';
  EXECUTE 'CREATE POLICY "ng_agro_insert_agro_state_parcela" ON public.agro_state_parcela FOR INSERT WITH CHECK (' || cond_admin || ')';
  EXECUTE 'CREATE POLICY "ng_agro_update_agro_state_parcela" ON public.agro_state_parcela FOR UPDATE USING (' || cond_admin || ')';
  EXECUTE 'CREATE POLICY "ng_agro_delete_agro_state_parcela" ON public.agro_state_parcela FOR DELETE USING (' || cond_admin || ')';
END $$;

-- ========== 4. Trigger after insert en ng_diagnostics ==========
-- Obligatorio: recompute_requested. Opcional: guard_diagnosis_created.
DROP TRIGGER IF EXISTS trg_ng_diagnostics_after_insert ON public.ng_diagnostics;

CREATE OR REPLACE FUNCTION public._trg_ng_diagnostics_after_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.agro_events (
    organization_id,
    parcela_id,
    lote_id,
    productor_id,
    event_type,
    payload,
    observed_at,
    created_by,
    source
  ) VALUES (
    NEW.organization_id,
    NEW.parcela_id,
    NEW.lote_id,
    NEW.productor_id,
    'recompute_requested',
    jsonb_build_object('diagnostic_id', NEW.id, 'processed_at', null),
    COALESCE(NEW.observed_at, now()),
    NEW.created_by,
    COALESCE(NEW.source, 'trigger')
  );
  -- Opcional: guard_diagnosis_created
  INSERT INTO public.agro_events (
    organization_id,
    parcela_id,
    lote_id,
    productor_id,
    event_type,
    payload,
    observed_at,
    created_by,
    source
  ) VALUES (
    NEW.organization_id,
    NEW.parcela_id,
    NEW.lote_id,
    NEW.productor_id,
    'guard_diagnosis_created',
    jsonb_build_object('diagnostic_id', NEW.id, 'parcela_id', NEW.parcela_id, 'lote_id', NEW.lote_id),
    COALESCE(NEW.created_at, now()),
    NEW.created_by,
    COALESCE(NEW.source, 'trigger')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE TRIGGER trg_ng_diagnostics_after_insert
  AFTER INSERT ON public.ng_diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION public._trg_ng_diagnostics_after_insert();

-- ========== 5. RPC rpc_queue_ng_impact_recompute ==========
CREATE OR REPLACE FUNCTION public.rpc_queue_ng_impact_recompute(p_diagnostic_id uuid)
RETURNS void AS $$
DECLARE
  v_org_id uuid;
  v_user_org uuid;
  v_exists boolean;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.ng_diagnostics
  WHERE id = p_diagnostic_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Diagnostic not found or has no organization_id';
  END IF;

  v_user_org := public.get_user_organization_id(auth.uid());
  IF v_user_org IS NULL OR v_user_org != v_org_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: diagnostic belongs to another organization';
    END IF;
  END IF;

  -- Dedup: no insertar si ya existe recompute_requested para ese diagnostic_id en últimas 24h con processed_at null
  SELECT EXISTS (
    SELECT 1 FROM public.agro_events
    WHERE organization_id = v_org_id
      AND event_type = 'recompute_requested'
      AND payload->>'diagnostic_id' = p_diagnostic_id::text
      AND (payload->>'processed_at') IS NULL
      AND observed_at >= now() - interval '24 hours'
  ) INTO v_exists;

  IF v_exists THEN
    RETURN; -- ya encolado, no duplicar
  END IF;

  INSERT INTO public.agro_events (
    organization_id,
    event_type,
    payload,
    observed_at
  ) VALUES (
    v_org_id,
    'recompute_requested',
    jsonb_build_object('diagnostic_id', p_diagnostic_id, 'processed_at', null),
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
