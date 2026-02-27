-- ============================================
-- Nova Silva: Alertas tempranas (agro_alert_rules + agro_alerts)
-- RLS canónico: get_user_organization_id(auth.uid()), is_admin()
-- ============================================

-- ========== 1. agro_alert_rules (config por organización) ==========
CREATE TABLE IF NOT EXISTS public.agro_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  rule_key text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agro_alert_rules_org_enabled
  ON public.agro_alert_rules (organization_id, is_enabled)
  WHERE is_enabled = true;

-- ========== 2. agro_alerts (instancias generadas) ==========
CREATE TABLE IF NOT EXISTS public.agro_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  rule_id uuid NOT NULL REFERENCES public.agro_alert_rules(id) ON DELETE CASCADE,
  parcela_id uuid NULL,
  lote_id uuid NULL,
  productor_id uuid NULL,
  issue_code text NULL,
  metric_key text NOT NULL,
  metric_value numeric NULL,
  window_start timestamptz NULL,
  window_end timestamptz NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ack', 'closed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agro_alerts_org_status_created
  ON public.agro_alerts (organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agro_alerts_org_parcela_created
  ON public.agro_alerts (organization_id, parcela_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agro_alerts_org_rule_window
  ON public.agro_alerts (organization_id, rule_id, window_end DESC);

-- Índice para dedup: (org, rule_id, parcela_id, issue_code) en últimas 24h
CREATE INDEX IF NOT EXISTS idx_agro_alerts_dedup
  ON public.agro_alerts (organization_id, rule_id, parcela_id, issue_code, created_at DESC);

-- ========== 3. RLS ==========
ALTER TABLE public.agro_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agro_alerts ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol_name text;
  cond_select text := 'organization_id IS NOT NULL AND (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())';
  cond_admin text := 'public.is_admin()';
BEGIN
  -- agro_alert_rules
  FOR pol_name IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agro_alert_rules'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.agro_alert_rules', pol_name); END LOOP;
  EXECUTE 'CREATE POLICY "agro_alert_rules_select" ON public.agro_alert_rules FOR SELECT USING (' || cond_select || ')';
  EXECUTE 'CREATE POLICY "agro_alert_rules_insert" ON public.agro_alert_rules FOR INSERT WITH CHECK (' || cond_admin || ')';
  EXECUTE 'CREATE POLICY "agro_alert_rules_update" ON public.agro_alert_rules FOR UPDATE USING (' || cond_admin || ')';
  EXECUTE 'CREATE POLICY "agro_alert_rules_delete" ON public.agro_alert_rules FOR DELETE USING (' || cond_admin || ')';

  -- agro_alerts: SELECT org/admin, INSERT/UPDATE/DELETE solo admin
  FOR pol_name IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agro_alerts'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.agro_alerts', pol_name); END LOOP;
  EXECUTE 'CREATE POLICY "agro_alerts_select" ON public.agro_alerts FOR SELECT USING (' || cond_select || ')';
  EXECUTE 'CREATE POLICY "agro_alerts_insert" ON public.agro_alerts FOR INSERT WITH CHECK (' || cond_admin || ')';
  EXECUTE 'CREATE POLICY "agro_alerts_update" ON public.agro_alerts FOR UPDATE USING (' || cond_admin || ')';
  EXECUTE 'CREATE POLICY "agro_alerts_delete" ON public.agro_alerts FOR DELETE USING (' || cond_admin || ')';
END $$;

-- ========== 4. Reglas iniciales (ejemplo manual) ==========
-- INSERT INTO public.agro_alert_rules (organization_id, rule_key, params, severity)
-- VALUES ('<org_uuid>', 'ng_expected_loss_threshold', '{"issue_code":"broca","threshold":0.15,"window_days":14}'::jsonb, 'warning');
