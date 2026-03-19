-- ==================================================
-- A) CREATE/ALTER MÍNIMOS
-- ==================================================

-- onboarding_sessions
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  org_name text,
  country text,
  org_type text,
  operating_model text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_plan text,
  recommended_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_price_monthly numeric(12,2),
  estimated_price_annual numeric(12,2),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'converted', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_email ON public.onboarding_sessions(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON public.onboarding_sessions(status);

CREATE OR REPLACE FUNCTION public._onboarding_sessions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_onboarding_sessions_updated ON public.onboarding_sessions;
CREATE TRIGGER tr_onboarding_sessions_updated
  BEFORE UPDATE ON public.onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION public._onboarding_sessions_updated_at();

-- organization_configs
CREATE TABLE IF NOT EXISTS public.organization_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  org_type text,
  operating_model text,
  modules_enabled jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_scale jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_plan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_configs_org ON public.organization_configs(organization_id);

-- onboarding_price_quotes
CREATE TABLE IF NOT EXISTS public.onboarding_price_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_session_id uuid REFERENCES public.onboarding_sessions(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.platform_organizations(id) ON DELETE SET NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  base_plan text,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  usage_estimate jsonb NOT NULL DEFAULT '{}'::jsonb,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12,2),
  total numeric(12,2),
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_price_quotes_session ON public.onboarding_price_quotes(onboarding_session_id);

-- ==================================================
-- B) FUNCIONES HELPER
-- ==================================================

-- fn_recommend_operating_model
CREATE OR REPLACE FUNCTION public.fn_recommend_operating_model(p_org_type text, p_answers jsonb)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buys_third boolean;
  v_works_producers boolean;
BEGIN
  p_org_type := COALESCE(LOWER(TRIM(p_org_type)), '');
  v_buys_third := COALESCE((p_answers->>'buys_from_third_parties')::boolean, false);
  v_works_producers := COALESCE((p_answers->>'works_with_producers')::boolean, false);

  CASE p_org_type
    WHEN 'productor_privado' THEN RETURN 'single_farm';
    WHEN 'finca_empresarial' THEN
      IF v_buys_third THEN RETURN 'estate_hybrid'; ELSE RETURN 'estate'; END IF;
    WHEN 'cooperativa', 'beneficio' THEN RETURN 'aggregator';
    WHEN 'exportador' THEN RETURN 'trader';
    WHEN 'certificadora' THEN RETURN 'auditor';
    ELSE RETURN COALESCE(NULLIF(p_org_type, ''), 'single_farm');
  END CASE;
END;
$$;

-- fn_recommend_modules
CREATE OR REPLACE FUNCTION public.fn_recommend_modules(p_org_type text, p_operating_model text, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mods jsonb;
  v_needs_eudr boolean;
  v_needs_quality boolean;
  v_needs_agronomy boolean;
  v_needs_labor boolean;
  v_needs_inventory boolean;
  v_needs_catalog boolean;
BEGIN
  p_operating_model := COALESCE(LOWER(TRIM(p_operating_model)), 'single_farm');
  v_needs_eudr := COALESCE((p_answers->>'needs_eudr')::boolean, true);
  v_needs_quality := COALESCE((p_answers->>'needs_quality')::boolean, true);
  v_needs_agronomy := COALESCE((p_answers->>'needs_agronomy')::boolean, true);
  v_needs_labor := COALESCE((p_answers->>'needs_labor')::boolean, true);
  v_needs_inventory := COALESCE((p_answers->>'needs_inventory')::boolean, false);
  v_needs_catalog := COALESCE((p_answers->>'needs_input_catalog')::boolean, false);

  CASE p_operating_model
    WHEN 'single_farm' THEN
      v_mods := '["produccion","insumos","agronomia","jornales","resiliencia","calidad","cumplimiento"]'::jsonb;
    WHEN 'estate' THEN
      v_mods := '["produccion","insumos","agronomia","jornales","resiliencia","calidad","cumplimiento","finanzas"]'::jsonb;
    WHEN 'estate_hybrid' THEN
      v_mods := '["produccion","abastecimiento_cafe","insumos","agronomia","jornales","resiliencia","cumplimiento","calidad","finanzas","inventario"]'::jsonb;
    WHEN 'aggregator' THEN
      v_mods := '["produccion","abastecimiento_cafe","insumos","agronomia","resiliencia","cumplimiento","calidad","catalogo_insumos"]'::jsonb;
    WHEN 'trader' THEN
      v_mods := '["abastecimiento_cafe","cumplimiento","calidad","finanzas","trazabilidad","eudr"]'::jsonb;
    WHEN 'auditor' THEN
      v_mods := '["cumplimiento","data_room","auditorias"]'::jsonb;
    ELSE
      v_mods := '["produccion","insumos","agronomia","resiliencia","cumplimiento","calidad"]'::jsonb;
  END CASE;

  IF v_needs_eudr AND NOT (v_mods @> '["eudr"]'::jsonb) THEN
    v_mods := v_mods || '["eudr"]'::jsonb;
  END IF;
  IF v_needs_quality AND NOT (v_mods @> '["nova_cup"]'::jsonb) THEN
    v_mods := v_mods || '["nova_cup"]'::jsonb;
  END IF;
  IF v_needs_agronomy AND NOT (v_mods @> '["nutricion"]'::jsonb) THEN
    v_mods := v_mods || '["nutricion","nova_guard","nova_yield"]'::jsonb;
  END IF;
  IF v_needs_labor AND NOT (v_mods @> '["jornales"]'::jsonb) THEN
    v_mods := v_mods || '["jornales"]'::jsonb;
  END IF;
  IF v_needs_inventory AND NOT (v_mods @> '["inventario"]'::jsonb) THEN
    v_mods := v_mods || '["inventario"]'::jsonb;
  END IF;
  IF v_needs_catalog AND NOT (v_mods @> '["catalogo_insumos"]'::jsonb) THEN
    v_mods := v_mods || '["catalogo_insumos"]'::jsonb;
  END IF;

  RETURN (SELECT COALESCE(jsonb_agg(DISTINCT elem ORDER BY elem), '[]'::jsonb) FROM jsonb_array_elements_text(v_mods) elem);
END;
$$;

-- fn_recommend_visibility_policy
CREATE OR REPLACE FUNCTION public.fn_recommend_visibility_policy(p_operating_model text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  p_operating_model := COALESCE(LOWER(TRIM(p_operating_model)), 'single_farm');

  v := jsonb_build_object(
    'canSeeProducers', p_operating_model IN ('aggregator','estate_hybrid','estate'),
    'canSeeCoffeeSuppliers', p_operating_model IN ('trader','aggregator','estate_hybrid'),
    'canSeeInputSuppliers', p_operating_model IN ('aggregator','estate_hybrid','estate','single_farm'),
    'canSeeOwnedPlots', p_operating_model IN ('single_farm','estate','estate_hybrid'),
    'canSeeThirdPartyPlots', p_operating_model IN ('aggregator','estate_hybrid'),
    'canSeePurchases', p_operating_model IN ('trader','aggregator','estate_hybrid'),
    'canSeeReception', p_operating_model IN ('aggregator','estate_hybrid','estate'),
    'canSeeLabor', p_operating_model IN ('single_farm','estate','estate_hybrid','aggregator'),
    'canSeeInventory', p_operating_model IN ('estate_hybrid','aggregator'),
    'canSeeCatalog', p_operating_model IN ('aggregator','estate_hybrid'),
    'canSeeCompliance', true,
    'canSeeNovaCup', p_operating_model IN ('single_farm','estate','estate_hybrid','aggregator','trader')
  );
  RETURN v;
END;
$$;

-- fn_recommend_plan
CREATE OR REPLACE FUNCTION public.fn_recommend_plan(p_operating_model text, p_answers jsonb)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plots int;
  v_producers int;
  v_suppliers int;
  v_users int;
  v_mod_count int;
BEGIN
  p_operating_model := COALESCE(LOWER(TRIM(p_operating_model)), 'single_farm');
  v_plots := COALESCE((p_answers->>'plots_count')::int, 0);
  v_producers := COALESCE((p_answers->>'producers_count')::int, 0);
  v_suppliers := COALESCE((p_answers->>'suppliers_count')::int, 0);
  v_users := COALESCE((p_answers->>'users_count')::int, 0);

  IF p_operating_model IN ('trader','aggregator') OR v_producers > 50 OR v_plots > 100 OR v_suppliers > 20 THEN
    RETURN 'Plus';
  END IF;

  IF v_producers > 5 OR v_plots > 15 OR v_users > 3 THEN
    RETURN 'Smart';
  END IF;

  RETURN 'Lite';
END;
$$;

-- ==================================================
-- C) PRICE QUOTE FUNCTION
-- ==================================================

CREATE OR REPLACE FUNCTION public.fn_estimate_price(
  p_operating_model text,
  p_modules jsonb,
  p_answers jsonb,
  p_billing_cycle text DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_line_items jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_base numeric;
  v_addon numeric;
BEGIN
  p_billing_cycle := COALESCE(LOWER(TRIM(p_billing_cycle)), 'monthly');
  v_plan := public.fn_recommend_plan(p_operating_model, p_answers);

  -- base plan
  v_base := CASE v_plan
    WHEN 'Lite' THEN CASE WHEN p_billing_cycle = 'annual' THEN 4000 ELSE 400 END
    WHEN 'Smart' THEN CASE WHEN p_billing_cycle = 'annual' THEN 8000 ELSE 800 END
    WHEN 'Plus' THEN CASE WHEN p_billing_cycle = 'annual' THEN 15000 ELSE 1500 END
    ELSE 400
  END;

  v_line_items := v_line_items || jsonb_build_object('description', 'Plan ' || v_plan, 'amount', v_base)::jsonb;
  v_subtotal := v_base;

  -- add-ons por pack (una vez cada uno si aplica)
  IF p_modules @> '["cumplimiento"]'::jsonb OR p_modules @> '["eudr"]'::jsonb THEN
    v_addon := CASE WHEN p_billing_cycle = 'annual' THEN 2500 ELSE 250 END;
    v_line_items := v_line_items || jsonb_build_object('description', 'Cumplimiento pack', 'amount', v_addon)::jsonb;
    v_subtotal := v_subtotal + v_addon;
  END IF;
  IF p_modules @> '["agronomia"]'::jsonb OR p_modules @> '["nutricion"]'::jsonb OR p_modules @> '["nova_guard"]'::jsonb OR p_modules @> '["nova_yield"]'::jsonb THEN
    v_addon := CASE WHEN p_billing_cycle = 'annual' THEN 3000 ELSE 300 END;
    v_line_items := v_line_items || jsonb_build_object('description', 'Agronomía pack', 'amount', v_addon)::jsonb;
    v_subtotal := v_subtotal + v_addon;
  END IF;
  IF p_modules @> '["calidad"]'::jsonb OR p_modules @> '["nova_cup"]'::jsonb THEN
    v_addon := CASE WHEN p_billing_cycle = 'annual' THEN 2000 ELSE 200 END;
    v_line_items := v_line_items || jsonb_build_object('description', 'Calidad pack', 'amount', v_addon)::jsonb;
    v_subtotal := v_subtotal + v_addon;
  END IF;
  IF p_modules @> '["inventario"]'::jsonb THEN
    v_addon := CASE WHEN p_billing_cycle = 'annual' THEN 1000 ELSE 100 END;
    v_line_items := v_line_items || jsonb_build_object('description', 'Inventario pack', 'amount', v_addon)::jsonb;
    v_subtotal := v_subtotal + v_addon;
  END IF;
  IF p_modules @> '["catalogo_insumos"]'::jsonb THEN
    v_addon := CASE WHEN p_billing_cycle = 'annual' THEN 1200 ELSE 120 END;
    v_line_items := v_line_items || jsonb_build_object('description', 'Catálogo pack', 'amount', v_addon)::jsonb;
    v_subtotal := v_subtotal + v_addon;
  END IF;
  IF p_modules @> '["abastecimiento_cafe"]'::jsonb THEN
    v_addon := CASE WHEN p_billing_cycle = 'annual' THEN 2500 ELSE 250 END;
    v_line_items := v_line_items || jsonb_build_object('description', 'Abastecimiento pack', 'amount', v_addon)::jsonb;
    v_subtotal := v_subtotal + v_addon;
  END IF;

  v_total := v_subtotal;

  RETURN jsonb_build_object(
    'base_plan', v_plan,
    'modules', p_modules,
    'line_items', v_line_items,
    'subtotal', v_subtotal,
    'total', v_total,
    'currency', 'USD',
    'billing_cycle', p_billing_cycle
  );
END;
$$;

-- ==================================================
-- D) FINALIZE ONBOARDING
-- ==================================================

CREATE OR REPLACE FUNCTION public.fn_finalize_onboarding(p_session_id uuid, p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess record;
  v_op text;
  v_mods jsonb;
  v_plan text;
  v_vis jsonb;
  v_scale jsonb;
  v_price jsonb;
  v_quote_id uuid;
  v_res jsonb;
BEGIN
  SELECT * INTO v_sess FROM public.onboarding_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;

  v_op := COALESCE(v_sess.operating_model, public.fn_recommend_operating_model(v_sess.org_type, v_sess.answers));
  v_mods := CASE WHEN v_sess.recommended_modules IS NULL OR jsonb_array_length(v_sess.recommended_modules) = 0
    THEN public.fn_recommend_modules(v_sess.org_type, v_op, v_sess.answers)
    ELSE v_sess.recommended_modules END;
  v_plan := COALESCE(v_sess.recommended_plan, public.fn_recommend_plan(v_op, v_sess.answers));
  v_vis := public.fn_recommend_visibility_policy(v_op);
  v_scale := jsonb_build_object(
    'plots_count', COALESCE((v_sess.answers->>'plots_count')::int, 0),
    'producers_count', COALESCE((v_sess.answers->>'producers_count')::int, 0),
    'suppliers_count', COALESCE((v_sess.answers->>'suppliers_count')::int, 0),
    'users_count', COALESCE((v_sess.answers->>'users_count')::int, 0)
  );
  v_price := public.fn_estimate_price(v_op, v_mods, v_sess.answers, 'monthly');

  INSERT INTO public.organization_configs (
    organization_id, org_type, operating_model, modules_enabled,
    visibility_policy, estimated_scale, recommended_plan
  )
  VALUES (
    p_organization_id, v_sess.org_type, v_op, v_mods,
    v_vis, v_scale, v_plan
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    org_type = EXCLUDED.org_type,
    operating_model = EXCLUDED.operating_model,
    modules_enabled = EXCLUDED.modules_enabled,
    visibility_policy = EXCLUDED.visibility_policy,
    estimated_scale = EXCLUDED.estimated_scale,
    recommended_plan = EXCLUDED.recommended_plan,
    updated_at = now();

  INSERT INTO public.onboarding_price_quotes (
    onboarding_session_id, organization_id, billing_cycle,
    base_plan, modules, usage_estimate, line_items, subtotal, total, currency
  )
  VALUES (
    p_session_id, p_organization_id, 'monthly',
    v_plan, v_mods, v_scale,
    v_price->'line_items',
    (v_price->>'subtotal')::numeric,
    (v_price->>'total')::numeric,
    'USD'
  )
  RETURNING id INTO v_quote_id;

  UPDATE public.onboarding_sessions
  SET status = 'converted', updated_at = now()
  WHERE id = p_session_id;

  v_res := jsonb_build_object(
    'ok', true,
    'organization_id', p_organization_id,
    'organization_config_id', (SELECT id FROM public.organization_configs WHERE organization_id = p_organization_id),
    'quote_id', v_quote_id,
    'recommended_plan', v_plan,
    'modules', v_mods,
    'total_monthly', (v_price->>'total')::numeric
  );
  RETURN v_res;
END;
$$;

-- ==================================================
-- E) VIEWS
-- ==================================================

CREATE OR REPLACE VIEW public.v_onboarding_sessions_ui AS
SELECT
  id, email, org_name, country, org_type, operating_model,
  status, recommended_plan, recommended_modules,
  estimated_price_monthly, estimated_price_annual,
  created_at
FROM public.onboarding_sessions;

CREATE OR REPLACE VIEW public.v_organization_configs_ui AS
SELECT
  organization_id, org_type, operating_model, modules_enabled,
  visibility_policy, estimated_scale, recommended_plan, created_at
FROM public.organization_configs;

-- ==================================================
-- F) VISTAS SEGURAS / RLS / GRANTS
-- ==================================================

CREATE OR REPLACE VIEW public.v_organization_configs_ui_secure AS
SELECT
  oc.organization_id, oc.org_type, oc.operating_model, oc.modules_enabled,
  oc.visibility_policy, oc.estimated_scale, oc.recommended_plan, oc.created_at
FROM public.organization_configs oc
WHERE oc.organization_id = public.get_user_organization_id(auth.uid());

-- RLS onboarding_sessions: solo service role o por email (anon para crear)
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS onboarding_sessions_service ON public.onboarding_sessions;
CREATE POLICY onboarding_sessions_service ON public.onboarding_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS organization_configs: usuarios ven solo su org
ALTER TABLE public.organization_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_configs_own ON public.organization_configs;
CREATE POLICY organization_configs_own ON public.organization_configs
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS organization_configs_service ON public.organization_configs;
CREATE POLICY organization_configs_service ON public.organization_configs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS onboarding_price_quotes
ALTER TABLE public.onboarding_price_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS onboarding_price_quotes_service ON public.onboarding_price_quotes;
CREATE POLICY onboarding_price_quotes_service ON public.onboarding_price_quotes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT ON public.v_organization_configs_ui_secure TO authenticated;
REVOKE ALL ON public.onboarding_sessions FROM anon, authenticated;
REVOKE ALL ON public.organization_configs FROM anon;
GRANT SELECT ON public.organization_configs TO authenticated;
