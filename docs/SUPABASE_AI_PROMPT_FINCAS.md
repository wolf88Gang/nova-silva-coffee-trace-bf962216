# Prompt para Supabase AI — Tabla Fincas y Gemelo Digital

> **Copia y pega este texto en el Supabase AI Assistant** para crear la capa intermedia
> de Fincas entre Productores y Parcelas.
> Última actualización: 2026-03-10

---

## Contexto

Nova Silva opera con una jerarquía de 4 capas:

```
Organización → Actor (productores) → Finca → Parcela
```

Actualmente solo existen 3 capas (sin Finca). La tabla `parcelas` se vincula directamente a `productores` vía `productor_id`.

**Objetivo:** Crear la tabla `fincas` como capa intermedia, migrar `parcelas` para que apunten a `finca_id`, y mantener compatibilidad con el sistema actual.

---

## Tabla: fincas

```sql
CREATE TABLE IF NOT EXISTS public.fincas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  productor_id uuid NOT NULL REFERENCES public.productores(id) ON DELETE CASCADE,
  
  nombre text NOT NULL,
  codigo text,  -- código interno de la org
  
  -- Ubicación geográfica (nivel finca, no parcela)
  ubicacion_texto text,           -- dirección o descripción
  region text,                    -- región/zona cafetera
  municipio text,
  departamento text,
  pais text DEFAULT 'CR',
  altitud_msnm numeric,           -- altitud representativa
  latitud numeric,
  longitud numeric,
  
  -- Características
  area_total_ha numeric,          -- área total de la finca
  area_productiva_ha numeric,     -- área en producción
  tipo_tenencia text,             -- propia, arrendada, comunal
  acceso text,                    -- carretera, camino, etc.
  fuente_agua text,               -- río, naciente, pozo
  
  -- Certificaciones a nivel finca
  certificaciones text[],         -- ['rainforest', 'fairtrade', 'organico']
  
  -- Gemelo digital: scores agregados
  vital_score numeric,            -- último score VITAL (0-100)
  scn_score text,                 -- score crediticio (A+, B, C-)
  carbono_potencial_tco2 numeric, -- tCO2/ha/año estimado
  riesgo_climatico text,          -- bajo, medio, alto, crítico
  
  -- Estado
  activo boolean NOT NULL DEFAULT true,
  
  -- Auditoría
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT fincas_org_productor_unique UNIQUE (organization_id, productor_id, nombre)
);

-- Índices
CREATE INDEX idx_fincas_org ON public.fincas(organization_id);
CREATE INDEX idx_fincas_productor ON public.fincas(productor_id);
CREATE INDEX idx_fincas_org_activo ON public.fincas(organization_id) WHERE activo = true;

-- Trigger updated_at
CREATE TRIGGER set_updated_at_fincas
  BEFORE UPDATE ON public.fincas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.fincas ENABLE ROW LEVEL SECURITY;

-- Política SELECT: usuarios de la misma org
CREATE POLICY "fincas_select_org"
ON public.fincas FOR SELECT TO authenticated
USING (
  organization_id = public.get_user_organization_id(auth.uid())
);

-- Política INSERT: admin_org o tecnico de la org
CREATE POLICY "fincas_insert_org"
ON public.fincas FOR INSERT TO authenticated
WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, ARRAY['admin_org', 'tecnico'])
);

-- Política UPDATE: admin_org o tecnico de la org
CREATE POLICY "fincas_update_org"
ON public.fincas FOR UPDATE TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, ARRAY['admin_org', 'tecnico'])
);

-- Política DELETE: solo admin_org
CREATE POLICY "fincas_delete_org"
ON public.fincas FOR DELETE TO authenticated
USING (
  public.has_org_role(auth.uid(), organization_id, ARRAY['admin_org'])
);
```

---

## Migración de Parcelas

### Paso 1: Agregar columna finca_id a parcelas (nullable inicialmente)

```sql
ALTER TABLE public.parcelas
  ADD COLUMN IF NOT EXISTS finca_id uuid REFERENCES public.fincas(id);

CREATE INDEX IF NOT EXISTS idx_parcelas_finca ON public.parcelas(finca_id);
```

### Paso 2: Crear finca default por productor

Para cada productor que ya tiene parcelas, crear una finca con el nombre del productor:

```sql
-- Crear finca default para cada productor que tiene parcelas
INSERT INTO public.fincas (organization_id, productor_id, nombre, activo)
SELECT DISTINCT
  p.organization_id,
  p.productor_id,
  COALESCE(pr.nombre, pr.name, 'Finca Principal'),
  true
FROM public.parcelas p
JOIN public.productores pr ON pr.id = p.productor_id
WHERE p.finca_id IS NULL
  AND p.organization_id IS NOT NULL
ON CONFLICT (organization_id, productor_id, nombre) DO NOTHING;
```

### Paso 3: Vincular parcelas existentes a su finca default

```sql
UPDATE public.parcelas p
SET finca_id = f.id
FROM public.fincas f
WHERE p.productor_id = f.productor_id
  AND p.organization_id = f.organization_id
  AND p.finca_id IS NULL;
```

### Paso 4: Verificar migración completa

```sql
-- No debería haber parcelas sin finca
SELECT COUNT(*) AS parcelas_sin_finca
FROM public.parcelas
WHERE finca_id IS NULL AND organization_id IS NOT NULL;
-- Esperado: 0

-- Conteo de fincas creadas
SELECT organization_id, COUNT(*) AS total_fincas
FROM public.fincas
GROUP BY organization_id;
```

### Paso 5 (futuro): Hacer finca_id NOT NULL

```sql
-- Solo ejecutar cuando se confirme que todas las parcelas tienen finca_id
ALTER TABLE public.parcelas
  ALTER COLUMN finca_id SET NOT NULL;
```

---

## Vista: Gemelo Digital de Finca

```sql
CREATE OR REPLACE VIEW public.v_finca_digital_twin AS
SELECT
  f.id AS finca_id,
  f.organization_id,
  f.productor_id,
  f.nombre,
  f.region,
  f.altitud_msnm,
  f.area_total_ha,
  f.certificaciones,
  f.vital_score,
  f.scn_score,
  f.carbono_potencial_tco2,
  f.riesgo_climatico,
  COUNT(DISTINCT p.id) AS total_parcelas,
  SUM(p.area_ha) AS area_parcelas_ha,
  ROUND(AVG(p.altitud_msnm), 0) AS altitud_promedio,
  array_agg(DISTINCT p.variedad) FILTER (WHERE p.variedad IS NOT NULL) AS variedades
FROM public.fincas f
LEFT JOIN public.parcelas p ON p.finca_id = f.id
WHERE f.activo = true
GROUP BY f.id;
```

---

## Smoke Tests

```sql
-- Tabla fincas existe
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'fincas';
-- Esperado: 1

-- RLS habilitado
SELECT relrowsecurity FROM pg_class WHERE relname = 'fincas';
-- Esperado: true

-- Políticas creadas
SELECT policyname FROM pg_policies WHERE tablename = 'fincas';
-- Esperado: 4 policies

-- Columna finca_id en parcelas
SELECT column_name FROM information_schema.columns
WHERE table_name = 'parcelas' AND column_name = 'finca_id';
-- Esperado: 1 row

-- Vista digital twin
SELECT COUNT(*) FROM information_schema.views
WHERE table_name = 'v_finca_digital_twin';
-- Esperado: 1
```

---

## Notas de Compatibilidad

- `productor_id` se mantiene en `parcelas` para compatibilidad (queries legacy)
- La nueva FK `finca_id` se agrega como nullable primero, se hace NOT NULL después de verificar migración
- El frontend puede seguir filtrando por `productor_id` mientras se adopta la capa finca gradualmente
- La vista `v_finca_digital_twin` permite consultar el gemelo digital sin joins manuales
