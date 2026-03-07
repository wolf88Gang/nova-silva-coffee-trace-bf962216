# Prompt para Supabase (SQL Editor / IA)

Ejecutá las siguientes acciones **en orden** en el SQL Editor de Supabase.

---

## 1. Verificar tablas faltantes

Ejecutá esta query para ver si `comparacion_muestras` y `lotes_exportacion` existen como tablas, vistas o en otro esquema:

```sql
SELECT table_schema, table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('comparacion_muestras', 'lotes_exportacion')
ORDER BY table_schema, table_name;
```

- Si **no devuelve filas**: las tablas no existen. Crearlas con el Paso 2.
- Si devuelve filas: anotá `table_schema` y `table_type`. Si son vistas y necesitás tablas, creá las tablas con el Paso 2.

---

## 2. Crear `comparacion_muestras` y `lotes_exportacion` (si no existen)

Ejecutá este SQL **solo si** el Paso 1 confirmó que no existen:

```sql
-- comparacion_muestras
CREATE TABLE IF NOT EXISTS public.comparacion_muestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lote_comercial_id uuid NULL REFERENCES public.lotes_comerciales(id) ON DELETE SET NULL,
  muestra_offer_id uuid NULL,
  muestra_pss_id uuid NULL,
  muestra_arrival_id uuid NULL,
  diferencia_puntaje_offer_pss numeric NULL,
  diferencia_puntaje_pss_arrival numeric NULL,
  diferencia_puntaje_offer_arrival numeric NULL,
  semaforo text NOT NULL DEFAULT 'pendiente' CHECK (semaforo IN ('verde', 'ambar', 'rojo', 'pendiente')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comparacion_org ON public.comparacion_muestras (organization_id);
CREATE INDEX IF NOT EXISTS idx_comparacion_lote ON public.comparacion_muestras (lote_comercial_id);
ALTER TABLE public.comparacion_muestras ENABLE ROW LEVEL SECURITY;

-- lotes_exportacion
CREATE TABLE IF NOT EXISTS public.lotes_exportacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lote_comercial_id uuid NULL REFERENCES public.lotes_comerciales(id) ON DELETE SET NULL,
  contrato_id uuid NULL,
  referencia text NULL,
  volumen_kg numeric NULL,
  estado text NOT NULL DEFAULT 'preparacion' CHECK (estado IN ('preparacion', 'embarcado', 'en_transito', 'entregado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lotes_export_org ON public.lotes_exportacion (organization_id);
CREATE INDEX IF NOT EXISTS idx_lotes_export_lote ON public.lotes_exportacion (lote_comercial_id);
ALTER TABLE public.lotes_exportacion ENABLE ROW LEVEL SECURITY;
```

Luego, políticas RLS (solo si existen `get_user_organization_id` e `is_admin`):

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_organization_id') THEN
    DROP POLICY IF EXISTS "comparacion_select" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_select" ON public.comparacion_muestras FOR SELECT TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "comparacion_insert" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_insert" ON public.comparacion_muestras FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
    DROP POLICY IF EXISTS "comparacion_update" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_update" ON public.comparacion_muestras FOR UPDATE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "comparacion_delete" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_delete" ON public.comparacion_muestras FOR DELETE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());

    DROP POLICY IF EXISTS "lotes_export_select" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_select" ON public.lotes_exportacion FOR SELECT TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "lotes_export_insert" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_insert" ON public.lotes_exportacion FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
    DROP POLICY IF EXISTS "lotes_export_update" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_update" ON public.lotes_exportacion FOR UPDATE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "lotes_export_delete" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_delete" ON public.lotes_exportacion FOR DELETE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
  END IF;
END $$;
```

---

## 3. Agregar `organization_id` a `contratos` (si falta)

```sql
-- Agregar columna si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'contratos' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.contratos ADD COLUMN organization_id uuid;
    CREATE INDEX IF NOT EXISTS idx_contratos_organization_id ON public.contratos(organization_id);
  END IF;
END $$;

-- Backfill desde exportador_id
UPDATE public.contratos SET organization_id = exportador_id 
WHERE exportador_id IS NOT NULL AND organization_id IS NULL;

-- Si tiene cooperativa_id y no exportador_id
UPDATE public.contratos SET organization_id = cooperativa_id 
WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;
```

---

## 4. RLS en `contratos`

```sql
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contratos_org_select" ON public.contratos;
CREATE POLICY "contratos_org_select" ON public.contratos FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) 
    OR exportador_id = public.get_user_organization_id(auth.uid()) 
    OR cooperativa_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "contratos_org_insert" ON public.contratos;
CREATE POLICY "contratos_org_insert" ON public.contratos FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()) OR exportador_id = public.get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "contratos_org_update" ON public.contratos;
CREATE POLICY "contratos_org_update" ON public.contratos FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) 
    OR exportador_id = public.get_user_organization_id(auth.uid()) 
    OR cooperativa_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "contratos_org_delete" ON public.contratos;
CREATE POLICY "contratos_org_delete" ON public.contratos FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) 
    OR exportador_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin()
  );
```

---

## 5. Vista `kpi_ranking_coops`

Vista que expone el ranking de cooperativas para KPIs (usa la misma lógica que el RPC `get_ranking_cooperativas`):

```sql
CREATE OR REPLACE VIEW public.kpi_ranking_coops AS
SELECT
  lc.cooperativa_id,
  o.nombre AS cooperativa_nombre,
  COUNT(lc.id)::numeric AS puntaje,
  COUNT(lc.id)::bigint AS lotes_entregados
FROM public.lotes_comerciales lc
LEFT JOIN public.organizations o ON o.id = lc.cooperativa_id
WHERE lc.cooperativa_id IS NOT NULL
GROUP BY lc.cooperativa_id, o.nombre;
```

**Nota:** Esta vista no filtra por tenant (organization_id del usuario). El filtrado se hace en la app con `useRankingCooperativas` (RPC). Si preferís una vista por tenant, habría que usar `SECURITY DEFINER` y `auth.uid()`; el RPC ya cubre ese caso.

---

## 6. Verificación final

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'comparacion_muestras', 'lotes_exportacion', 'kpi_ranking_coops'
)
ORDER BY table_name;
```

Deberías ver las 3 entradas (2 tablas + 1 vista).
