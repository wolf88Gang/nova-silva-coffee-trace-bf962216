-- ============================================================
-- BLOQUE 7: nutricion_aplicaciones + enum update + ag_plan_events
-- Ejecutar en Supabase SQL Editor
-- Requisito: Fase 1 completada (nutricion_planes, nutricion_fraccionamientos existen)
-- ============================================================

-- ─── 7a) Enum: añadir estados faltantes ─────────────────────
ALTER TYPE public.estado_plan_nutricional ADD VALUE IF NOT EXISTS 'approved_tecnico';
ALTER TYPE public.estado_plan_nutricional ADD VALUE IF NOT EXISTS 'superseded';

-- ─── 7b) Tabla nutricion_aplicaciones ────────────────────────
CREATE TABLE IF NOT EXISTS public.nutricion_aplicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id),
  fraccionamiento_id uuid REFERENCES public.nutricion_fraccionamientos(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id),

  -- Ejecución real
  fecha_aplicacion date NOT NULL,
  producto_aplicado text,
  cantidad_aplicada_kg numeric(6,1),
  tipo_aplicacion text DEFAULT 'edafica',  -- 'edafica' | 'foliar' | 'mixta'

  -- Dosis estructurada (Fase 2 — motor v1)
  dosis_aplicada_json jsonb,
  -- { nutrientes: { N_kg_ha, P2O5_kg_ha, K2O_kg_ha, ... }, productos: [...], metodo: {...} }

  -- Desviación vs plan
  desviacion_pct numeric(5,1),
  justificacion_desviacion text,

  -- Costo real
  costo_real numeric(10,0),
  proveedor text,
  numero_factura text,

  -- Evidencia
  evidencia_foto_url text,
  evidencias jsonb,  -- array de URLs de Storage

  -- Fase fenológica objetivo
  fase_objetivo text,

  -- Idempotencia
  idempotency_key text,

  -- Quién ejecutó
  ejecutado_por uuid REFERENCES auth.users(id),

  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_org
  ON public.nutricion_aplicaciones(organization_id);
CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_plan
  ON public.nutricion_aplicaciones(plan_id);
CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_parcela
  ON public.nutricion_aplicaciones(parcela_id);
CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_fracc
  ON public.nutricion_aplicaciones(fraccionamiento_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_idemp
  ON public.nutricion_aplicaciones(plan_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- RLS
ALTER TABLE public.nutricion_aplicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "na_select" ON public.nutricion_aplicaciones FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "na_insert" ON public.nutricion_aplicaciones FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "na_update" ON public.nutricion_aplicaciones FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "na_delete" ON public.nutricion_aplicaciones FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid())
  );

-- ─── 7c) Tabla ag_plan_events (audit log inmutable) ──────────
CREATE TABLE IF NOT EXISTS public.ag_plan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id),
  event_type text NOT NULL CHECK (event_type IN (
    'generated', 'approved', 'revised', 'execution_logged',
    'invoice_linked', 'cancelled_climate', 'closed', 'terms_accepted'
  )),
  payload_json jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_plan_events_org_plan
  ON public.ag_plan_events(organization_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_ag_plan_events_type
  ON public.ag_plan_events(plan_id, event_type);

ALTER TABLE public.ag_plan_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ape_select" ON public.ag_plan_events FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "ape_insert" ON public.ag_plan_events FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
    AND created_by = auth.uid()
  );

-- ─── 7d) Smoke Tests ────────────────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN ('nutricion_aplicaciones', 'ag_plan_events');

SELECT policyname, cmd FROM pg_policies
  WHERE tablename IN ('nutricion_aplicaciones', 'ag_plan_events');

SELECT indexname FROM pg_indexes
  WHERE tablename IN ('nutricion_aplicaciones', 'ag_plan_events');

-- Verificar enum actualizado
SELECT enumlabel FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estado_plan_nutricional')
  ORDER BY enumsortorder;

SELECT 'Bloque 7 OK: nutricion_aplicaciones + ag_plan_events + enum actualizado' AS resultado;
