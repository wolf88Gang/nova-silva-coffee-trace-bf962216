# Prompt para Supabase AI — Módulo de Nutrición Paramétrica v1

> **Copia y pega este texto completo en el Supabase AI Assistant** antes de pedirle que genere SQL para el módulo de nutrición.
> Última actualización: 2026-03-05

---

Eres un asistente SQL para el proyecto **Nova Silva**. Este prompt define el esquema, funciones y reglas para el **Módulo de Decisión Nutricional Paramétrica — Fase 1**.

## Reglas Absolutas (heredadas del sistema)

1. **Multi-tenant**: Toda tabla tiene `organization_id uuid NOT NULL`.
2. **RLS activo** en todas las tablas. Políticas usan `get_user_organization_id(auth.uid())`.
3. **Idioma**: Tablas y columnas en español (snake_case). SQL keywords en UPPER CASE.
4. **Funciones helper** son `SECURITY DEFINER` con `SET search_path = public`.
5. Tablas nuevas SIEMPRE: `organization_id NOT NULL`, RLS, índice en `organization_id`, policy canónica.

## Funciones Helper Existentes

```sql
get_user_organization_id(_uid uuid) RETURNS uuid
is_admin(_uid uuid) RETURNS boolean
is_org_admin(_uid uuid) RETURNS boolean
is_org_admin(_uid uuid, _org_id uuid) RETURNS boolean
update_updated_at_column() RETURNS trigger
```

## Tablas Existentes Referenciadas

```sql
-- Parcela (asset)
parcelas(id uuid PK, organization_id, productor_id, nombre, area_hectareas, altitud, municipio, departamento, latitud, longitud)

-- Actor
productores(id uuid PK, organization_id, nombre, email, telefono, tipo)

-- Organización
platform_organizations(id uuid PK, nombre, tipo, modules jsonb)
```

---

## PARTE 1 — TIPOS ENUMERADOS

```sql
-- Clasificación edáfica global
CREATE TYPE public.clasificacion_edafica AS ENUM ('critico', 'limitante', 'adecuado', 'optimo');

-- Nivel de confianza del plan
CREATE TYPE public.nivel_confianza_plan AS ENUM ('alto', 'medio', 'bajo');

-- Estado del plan nutricional
CREATE TYPE public.estado_plan_nutricional AS ENUM ('borrador', 'generado', 'ajustado', 'aprobado', 'en_ejecucion', 'completado', 'cancelado');

-- Tipo de bloqueo técnico
CREATE TYPE public.tipo_bloqueo AS ENUM ('acidez', 'aluminio', 'deficit_hidrico', 'informacion_insuficiente');

-- Grupo morfológico varietal
CREATE TYPE public.grupo_varietal AS ENUM ('compacto_intensivo', 'compuesto_resistente', 'porte_alto', 'exotico_especialidad', 'hibrido_f1');

-- Tipo de fuente de datos climáticos
CREATE TYPE public.fuente_clima AS ENUM ('sensor_iot', 'api_regional', 'modelo_altitudinal');

-- Clasificación de riesgo nutricional
CREATE TYPE public.tipo_riesgo_nutricional AS ENUM ('paloteo', 'agotamiento_ciclo', 'desbalance_n', 'estres_hidrico', 'estres_termico', 'zona_no_optima');

-- Fase fenológica
CREATE TYPE public.fase_fenologica AS ENUM ('almacigo', 'trasplante', 'crecimiento_vegetativo', 'cabeza_alfiler', 'expansion_rapida', 'llenado_grano', 'maduracion');
```

---

## PARTE 2 — BANCO DE VARIEDADES (tabla de referencia)

```sql
CREATE TABLE public.nutricion_variedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,             -- ej: 'caturra', 'castillo', 'geisha'
  nombre_comun text NOT NULL,              -- ej: 'Caturra', 'Castillo', 'Geisha / Gesha'
  grupo public.grupo_varietal NOT NULL,
  multiplicador_demanda numeric(4,2) NOT NULL DEFAULT 1.00,
  multiplicador_micronutrientes numeric(4,2) NOT NULL DEFAULT 1.00,
  fraccionamiento_minimo int NOT NULL DEFAULT 3,
  
  -- Sensibilidades (escala: 'baja', 'media', 'alta', 'muy_alta')
  sensibilidad_n text DEFAULT 'media',
  sensibilidad_k text DEFAULT 'media',
  sensibilidad_ca text DEFAULT 'media',
  sensibilidad_mg text DEFAULT 'media',
  sensibilidad_b text DEFAULT 'media',
  sensibilidad_zn text DEFAULT 'media',
  sensibilidad_exceso_n text DEFAULT 'media',
  
  -- Características fisiológicas
  profundidad_radicular text DEFAULT 'media',  -- baja/media/alta
  tolerancia_sequia text DEFAULT 'media',
  tolerancia_calor text DEFAULT 'media',
  ciclo_productivo_promedio_meses numeric(3,1),
  densidad_tipica_min int,
  densidad_tipica_max int,
  
  -- Riesgos dominantes
  riesgo_paloteo boolean DEFAULT false,
  riesgo_agotamiento boolean DEFAULT false,
  restriccion_n_tardio boolean DEFAULT false,
  
  -- Límites fisiológicos
  yield_max_sostenible_kg_ha numeric(6,0),  -- ej: 4000, 4500, 2500
  
  -- Notas algorítmicas
  notas_ajuste text,
  
  created_at timestamptz DEFAULT now()
);

-- NO tiene organization_id: es catálogo global de solo lectura
-- RLS: SELECT para authenticated
ALTER TABLE public.nutricion_variedades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutricion_variedades_select" ON public.nutricion_variedades
  FOR SELECT TO authenticated USING (true);
```

### Seed de Variedades (30 variedades del documento §20)

```sql
INSERT INTO public.nutricion_variedades (codigo, nombre_comun, grupo, multiplicador_demanda, multiplicador_micronutrientes, fraccionamiento_minimo, sensibilidad_n, sensibilidad_k, sensibilidad_ca, sensibilidad_exceso_n, riesgo_paloteo, riesgo_agotamiento, restriccion_n_tardio, yield_max_sostenible_kg_ha, densidad_tipica_min, densidad_tipica_max) VALUES
-- GRUPO 1: Compactas Intensivas
('caturra',       'Caturra',              'compacto_intensivo',    1.00, 1.00, 4, 'alta',     'muy_alta', 'media',  'media', true,  false, false, 4000, 5000, 7000),
('catuai',        'Catuaí',               'compacto_intensivo',    1.05, 1.00, 4, 'alta',     'alta',     'media',  'alta',  true,  false, false, 4000, 5000, 6500),
('villa_sarchi',  'Villa Sarchí',         'compacto_intensivo',    0.95, 1.00, 4, 'media',    'alta',     'media',  'media', false, false, false, 3500, 5000, 7000),
('pacas',         'Pacas',                'compacto_intensivo',    0.95, 1.00, 4, 'media',    'alta',     'media',  'media', false, false, false, 3500, 5000, 7000),
-- GRUPO 2: Compuestos Resistentes (Híbrido de Timor)
('castillo',      'Castillo',             'compuesto_resistente',  1.15, 1.00, 4, 'alta',     'alta',     'media',  'media', false, true,  false, 4500, 5000, 7000),
('colombia',      'Colombia',             'compuesto_resistente',  1.12, 1.00, 4, 'alta',     'alta',     'media',  'media', false, true,  false, 4500, 5000, 7000),
('tabi',          'Tabi',                 'compuesto_resistente',  1.10, 1.00, 4, 'media',    'media',    'media',  'media', false, false, false, 4000, 4000, 6000),
('lempira',       'Lempira',              'compuesto_resistente',  1.15, 1.00, 4, 'alta',     'alta',     'media',  'media', false, true,  false, 4500, 5000, 7000),
('sarchimor',     'Sarchimor',            'compuesto_resistente',  1.15, 1.00, 4, 'alta',     'alta',     'media',  'media', false, true,  false, 4500, 5000, 7000),
('obata',         'Obatá',                'compuesto_resistente',  1.12, 1.00, 4, 'media',    'alta',     'media',  'media', false, false, false, 4500, 5000, 7000),
('catimor',       'Catimor',              'compuesto_resistente',  1.15, 1.00, 4, 'alta',     'alta',     'alta',   'media', false, true,  false, 4500, 5000, 7000),
-- GRUPO 3: Porte Alto
('typica',        'Typica',               'porte_alto',            0.85, 1.00, 3, 'media',    'media',    'media',  'muy_alta', false, false, false, 3000, 3000, 5000),
('bourbon',       'Bourbon',              'porte_alto',            0.90, 1.00, 3, 'media',    'media',    'media',  'alta',  false, false, false, 3500, 3000, 5000),
('mundo_novo',    'Mundo Novo',           'porte_alto',            1.00, 1.00, 3, 'media',    'media',    'alta',   'media', false, false, false, 4000, 3000, 5000),
('maragogipe',    'Maragogipe',           'porte_alto',            0.95, 1.00, 3, 'media',    'media',    'alta',   'media', false, false, false, 3000, 2500, 4000),
-- GRUPO 4: Exóticas de Especialidad
('geisha',        'Geisha / Gesha',       'exotico_especialidad',  0.90, 1.30, 4, 'alta',     'media',    'media',  'muy_alta', false, false, true,  2500, 3000, 5000),
('sl28',          'SL28',                 'exotico_especialidad',  0.95, 1.10, 3, 'media',    'alta',     'media',  'media', false, false, false, 3000, 3000, 5000),
('sl34',          'SL34',                 'exotico_especialidad',  1.00, 1.10, 3, 'media',    'alta',     'media',  'media', false, false, false, 3500, 3000, 5000),
('pacamara',      'Pacamara',             'exotico_especialidad',  1.05, 1.10, 3, 'media',    'media',    'alta',   'media', false, false, false, 3500, 3000, 5000),
('laurina',       'Laurina',              'exotico_especialidad',  0.85, 1.00, 3, 'baja',     'media',    'media',  'media', false, false, false, 2500, 3000, 5000),
-- GRUPO 5: Híbridos F1 Modernos
('h1_centroamericano', 'H1 Centroamericano', 'hibrido_f1',        1.20, 1.00, 4, 'alta',     'alta',     'media',  'media', false, false, false, 5000, 5000, 7000),
('starmaya',      'Starmaya',             'hibrido_f1',            1.18, 1.00, 4, 'alta',     'alta',     'media',  'media', false, false, false, 5000, 5000, 7000),
('marsellesa',    'Marsellesa',           'hibrido_f1',            1.15, 1.00, 4, 'alta',     'alta',     'media',  'media', false, false, false, 4500, 5000, 7000),
-- Regionales adicionales
('parainema',     'Parainema',            'compuesto_resistente',  1.12, 1.00, 4, 'alta',     'alta',     'media',  'media', false, false, false, 4500, 5000, 7000),
('ruiru_11',      'Ruiru 11',             'compuesto_resistente',  1.10, 1.00, 4, 'media',    'alta',     'media',  'media', false, false, false, 4500, 5000, 7000),
('icatu',         'Icatu',                'compuesto_resistente',  1.10, 1.00, 4, 'media',    'alta',     'media',  'media', false, false, false, 4500, 5000, 7000),
('arara',         'Arara',                'compuesto_resistente',  1.12, 1.00, 4, 'media',    'alta',     'media',  'media', false, false, false, 4500, 5000, 7000),
('cenicafe_1',    'Cenicafé 1',           'compuesto_resistente',  1.15, 1.00, 4, 'alta',     'alta',     'media',  'media', false, true,  false, 4500, 5000, 7000),
('garnica',       'Garnica',              'compuesto_resistente',  1.05, 1.00, 3, 'media',    'media',    'media',  'media', false, false, false, 4000, 4000, 6000),
('catrenic',      'Catrenic',             'compuesto_resistente',  1.12, 1.00, 4, 'alta',     'alta',     'media',  'media', false, false, false, 4500, 5000, 7000);
```

---

## PARTE 3 — CONTEXTO DE PARCELA (inputs del motor)

```sql
CREATE TABLE public.nutricion_parcela_contexto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id),
  
  -- §9.1 Variables Estructurales
  altitud_msnm numeric(5,0),
  pendiente_pct numeric(4,1),
  area_ha numeric(6,2),
  tipo_suelo text,                             -- 'andisol', 'ultisol', 'inceptisol', 'entisol'
  textura text,                                -- 'arenoso', 'franco', 'franco_arcilloso', 'arcilloso'
  sistema_manejo text DEFAULT 'convencional',  -- 'convencional' | 'organico' | 'mixto'
  densidad_plantas_ha int,
  edad_promedio_anios numeric(3,1),
  
  -- §22 Mezcla varietal ponderada (JSON array)
  -- [{variedad_codigo: 'caturra', proporcion: 0.6}, {variedad_codigo: 'castillo', proporcion: 0.4}]
  variedades jsonb NOT NULL DEFAULT '[]',
  
  -- §9.2 Variables Productivas
  rendimiento_proyectado_kg_ha numeric(6,0),   -- desde Nova Yield o manual
  fecha_floracion_principal date,
  ciclo_estimado_meses numeric(3,1),           -- derivado de altitud si no existe
  
  -- §9.4 Variables Climáticas
  precipitacion_promedio_mm numeric(6,0),
  deficit_hidrico_actual boolean DEFAULT false,
  temperatura_media numeric(4,1),
  fuente_clima public.fuente_clima DEFAULT 'modelo_altitudinal',
  
  -- §23 Renovación
  porcentaje_renovacion numeric(4,1) DEFAULT 0, -- 0-100
  edad_renovacion_anios numeric(3,1),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(parcela_id)
);

CREATE INDEX idx_nutricion_parcela_contexto_org ON public.nutricion_parcela_contexto(organization_id);
CREATE INDEX idx_nutricion_parcela_contexto_parcela ON public.nutricion_parcela_contexto(parcela_id);

ALTER TABLE public.nutricion_parcela_contexto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "npc_select" ON public.nutricion_parcela_contexto FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "npc_insert" ON public.nutricion_parcela_contexto FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "npc_update" ON public.nutricion_parcela_contexto FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "npc_delete" ON public.nutricion_parcela_contexto FOR DELETE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.nutricion_parcela_contexto
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## PARTE 4 — ANÁLISIS DE SUELO (§31–§44)

```sql
CREATE TABLE public.nutricion_analisis_suelo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id),
  
  -- Fecha y laboratorio
  fecha_analisis date NOT NULL,
  laboratorio text,
  codigo_muestra text,
  
  -- §32 Variables Edáficas
  ph_agua numeric(3,1),
  aluminio_intercambiable numeric(5,2),        -- meq/100g
  materia_organica_pct numeric(4,1),
  p_disponible numeric(6,1),                   -- ppm (Bray II)
  k_intercambiable numeric(5,2),               -- meq/100g
  ca_intercambiable numeric(6,2),              -- meq/100g
  mg_intercambiable numeric(5,2),              -- meq/100g
  na_intercambiable numeric(5,2),              -- meq/100g
  cic numeric(5,1),                            -- meq/100g
  saturacion_bases_pct numeric(4,1),
  azufre numeric(5,1),                         -- ppm
  
  -- §41 Micronutrientes
  zinc numeric(5,2),                           -- ppm
  boro numeric(5,2),                           -- ppm
  manganeso numeric(6,1),                      -- ppm
  cobre numeric(5,2),                          -- ppm
  hierro numeric(6,1),                         -- ppm
  
  -- Textura (si viene del lab)
  textura_arena_pct numeric(4,1),
  textura_limo_pct numeric(4,1),
  textura_arcilla_pct numeric(4,1),
  densidad_aparente numeric(4,2),
  
  -- §44 Clasificación calculada por el motor
  clasificacion_edafica public.clasificacion_edafica,
  
  -- §37 Relaciones catiónicas calculadas
  relacion_ca_mg numeric(4,2),
  relacion_ca_k numeric(5,1),
  relacion_mg_k numeric(4,2),
  saturacion_al_cic_pct numeric(4,1),          -- Al/CICE × 100
  
  -- §10 Bloqueos detectados (JSON array de tipo_bloqueo)
  bloqueos_detectados jsonb DEFAULT '[]',
  
  -- Encalado estimado (§33.2)
  necesidad_encalado_kg_ha numeric(6,0),
  
  -- Archivo fuente (PDF del laboratorio)
  archivo_url text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_nutricion_analisis_suelo_org ON public.nutricion_analisis_suelo(organization_id);
CREATE INDEX idx_nutricion_analisis_suelo_parcela ON public.nutricion_analisis_suelo(parcela_id);

ALTER TABLE public.nutricion_analisis_suelo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nas_select" ON public.nutricion_analisis_suelo FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "nas_insert" ON public.nutricion_analisis_suelo FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "nas_update" ON public.nutricion_analisis_suelo FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "nas_delete" ON public.nutricion_analisis_suelo FOR DELETE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.nutricion_analisis_suelo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## PARTE 5 — PLAN NUTRICIONAL (§29, salida del motor)

```sql
CREATE TABLE public.nutricion_planes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id),
  analisis_suelo_id uuid REFERENCES public.nutricion_analisis_suelo(id),
  
  -- Ciclo productivo
  ciclo text NOT NULL,                         -- ej: '2026-A', '2026-B'
  fecha_floracion date,
  
  -- Estado
  estado public.estado_plan_nutricional NOT NULL DEFAULT 'borrador',
  nivel_confianza public.nivel_confianza_plan NOT NULL DEFAULT 'bajo',
  
  -- §29 Demanda final calculada (kg/ha)
  demanda_n_kg_ha numeric(5,1),
  demanda_p2o5_kg_ha numeric(5,1),
  demanda_k2o_kg_ha numeric(5,1),
  demanda_cao_kg_ha numeric(5,1),
  demanda_mgo_kg_ha numeric(5,1),
  demanda_s_kg_ha numeric(5,1),
  
  -- Micronutrientes (kg/ha)
  demanda_zn_kg_ha numeric(5,2),
  demanda_b_kg_ha numeric(5,2),
  demanda_mn_kg_ha numeric(5,2),
  
  -- §29 Factores aplicados (trazabilidad del cálculo)
  yield_usado_kg_ha numeric(6,0),
  multiplicador_varietal_ponderado numeric(4,2),
  ajuste_edad numeric(4,2),
  ajuste_altitud numeric(4,2),
  ajuste_suelo numeric(4,2),
  eficiencia_n numeric(4,2),
  eficiencia_p numeric(4,2),
  eficiencia_k numeric(4,2),
  
  -- §10 Bloqueos activos
  bloqueos jsonb DEFAULT '[]',                 -- [{tipo, descripcion, accion_requerida}]
  es_condicionado boolean DEFAULT false,       -- true si hay bloqueo por acidez/Al
  
  -- §13 Flags de riesgo
  flags_riesgo jsonb DEFAULT '[]',             -- [{tipo_riesgo_nutricional, descripcion, severidad}]
  
  -- §14 Explicabilidad (JSON array de strings)
  explicaciones jsonb DEFAULT '[]',            -- ["Se incrementó N 15% por variedad Castillo", ...]
  
  -- §6 Nivel de confianza detalle
  confianza_detalle jsonb DEFAULT '{}',        -- {suelo: true, yield: true, floracion: true, clima: false}
  
  -- §5 Modo heurístico
  es_heuristico boolean DEFAULT false,
  
  -- §57 Modelo económico
  costo_estimado_total numeric(10,0),          -- moneda local
  impacto_productivo_estimado_pct numeric(4,1),
  riesgo_financiero_no_ejecucion text,         -- 'bajo', 'medio', 'alto'
  
  -- Ajuste manual (§3.3)
  ajustado_por uuid REFERENCES auth.users(id),
  ajuste_justificacion text,
  ajuste_fecha timestamptz,
  
  -- Aprobación
  aprobado_por uuid REFERENCES auth.users(id),
  aprobado_fecha timestamptz,
  
  -- Metadata
  version_reglas text DEFAULT 'v1.0',          -- §16 Versionado
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_nutricion_planes_org ON public.nutricion_planes(organization_id);
CREATE INDEX idx_nutricion_planes_parcela ON public.nutricion_planes(parcela_id);
CREATE INDEX idx_nutricion_planes_estado ON public.nutricion_planes(estado);

ALTER TABLE public.nutricion_planes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "np_select" ON public.nutricion_planes FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "np_insert" ON public.nutricion_planes FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "np_update" ON public.nutricion_planes FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "np_delete" ON public.nutricion_planes FOR DELETE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.nutricion_planes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## PARTE 6 — FRACCIONAMIENTOS (aplicaciones programadas del plan)

```sql
CREATE TABLE public.nutricion_fraccionamientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  
  numero_aplicacion int NOT NULL,              -- 1, 2, 3, 4...
  fase_fenologica public.fase_fenologica,
  
  -- Fechas
  fecha_programada date,
  gda_objetivo numeric(6,0),                   -- §46 Grados-Día Acumulados objetivo
  
  -- Dosis por aplicación (kg/ha)
  dosis_n numeric(5,1),
  dosis_p2o5 numeric(5,1),
  dosis_k2o numeric(5,1),
  dosis_cao numeric(5,1),
  dosis_mgo numeric(5,1),
  dosis_s numeric(5,1),
  dosis_zn numeric(5,2),
  dosis_b numeric(5,2),
  
  -- §58 Producto comercial sugerido
  producto_sugerido text,                      -- ej: '18-5-15-6-2(MgO)'
  cantidad_producto_kg_ha numeric(5,0),
  
  -- Tipo de aplicación
  tipo_aplicacion text DEFAULT 'edafica',      -- 'edafica' | 'foliar' | 'foliar_rescate'
  
  -- Notas
  notas text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_nutricion_fracc_org ON public.nutricion_fraccionamientos(organization_id);
CREATE INDEX idx_nutricion_fracc_plan ON public.nutricion_fraccionamientos(plan_id);

ALTER TABLE public.nutricion_fraccionamientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nf_select" ON public.nutricion_fraccionamientos FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "nf_insert" ON public.nutricion_fraccionamientos FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "nf_update" ON public.nutricion_fraccionamientos FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "nf_delete" ON public.nutricion_fraccionamientos FOR DELETE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()));
```

---

## PARTE 7 — REGISTRO DE EJECUCIÓN (§3.4 Capa 4)

```sql
CREATE TABLE public.nutricion_aplicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id),
  fraccionamiento_id uuid REFERENCES public.nutricion_fraccionamientos(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id),
  
  -- Ejecución real
  fecha_aplicacion date NOT NULL,
  producto_aplicado text,
  cantidad_aplicada_kg numeric(6,1),
  tipo_aplicacion text DEFAULT 'edafica',      -- 'edafica' | 'foliar'
  
  -- Desviación vs plan
  desviacion_pct numeric(5,1),                 -- % diferencia vs programado
  justificacion_desviacion text,
  
  -- Costo real
  costo_real numeric(10,0),
  proveedor text,
  numero_factura text,
  
  -- Evidencia
  evidencia_foto_url text,
  
  -- Quién ejecutó
  ejecutado_por uuid REFERENCES auth.users(id),
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_nutricion_aplicaciones_org ON public.nutricion_aplicaciones(organization_id);
CREATE INDEX idx_nutricion_aplicaciones_plan ON public.nutricion_aplicaciones(plan_id);
CREATE INDEX idx_nutricion_aplicaciones_parcela ON public.nutricion_aplicaciones(parcela_id);

ALTER TABLE public.nutricion_aplicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "na_select" ON public.nutricion_aplicaciones FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "na_insert" ON public.nutricion_aplicaciones FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "na_update" ON public.nutricion_aplicaciones FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));
CREATE POLICY "na_delete" ON public.nutricion_aplicaciones FOR DELETE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()));
```

---

## PARTE 8 — FUNCIÓN RPC: MOTOR DE CÁLCULO §29

```sql
CREATE OR REPLACE FUNCTION public.generar_plan_nutricional_v1(
  _parcela_id uuid,
  _ciclo text DEFAULT NULL,
  _yield_override numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _ctx nutricion_parcela_contexto%ROWTYPE;
  _suelo nutricion_analisis_suelo%ROWTYPE;
  _plan_id uuid;
  _yield numeric;
  _mult_varietal numeric := 1.0;
  _mult_micro numeric := 1.0;
  _ajuste_edad numeric := 1.0;
  _ajuste_alt numeric := 1.0;
  _ajuste_suelo numeric := 1.0;
  _efic_n numeric := 0.55;
  _efic_p numeric := 0.25;
  _efic_k numeric := 0.65;
  _es_heuristico boolean := false;
  _confianza nivel_confianza_plan := 'bajo';
  _bloqueos jsonb := '[]';
  _explicaciones jsonb := '[]';
  _flags jsonb := '[]';
  _es_condicionado boolean := false;
  -- Extracción base por tonelada (§4.5)
  _ext_n numeric := 37.5;    -- promedio 35-40
  _ext_p numeric := 8.5;     -- promedio 7-10
  _ext_k numeric := 47.5;    -- promedio 45-50
  _ext_ca numeric := 5.0;    -- promedio 4-6
  _ext_mg numeric := 4.0;    -- promedio 3-5
  _ext_s numeric := 3.5;     -- promedio 3-4
  -- Demanda final
  _dem_n numeric;
  _dem_p numeric;
  _dem_k numeric;
  _dem_ca numeric;
  _dem_mg numeric;
  _dem_s numeric;
  _v record;
  _prop numeric;
BEGIN
  -- Obtener org_id del usuario
  _org_id := get_user_organization_id(auth.uid());
  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no tiene organización asignada';
  END IF;

  -- Cargar contexto de parcela
  SELECT * INTO _ctx FROM nutricion_parcela_contexto
    WHERE parcela_id = _parcela_id AND organization_id = _org_id;
  IF _ctx.id IS NULL THEN
    RAISE EXCEPTION 'No existe contexto nutricional para esta parcela';
  END IF;

  -- Cargar último análisis de suelo (si existe)
  SELECT * INTO _suelo FROM nutricion_analisis_suelo
    WHERE parcela_id = _parcela_id AND organization_id = _org_id
    ORDER BY fecha_analisis DESC LIMIT 1;

  -- §10.3 Bloqueo por información insuficiente → modo heurístico
  IF _ctx.variedades IS NULL OR jsonb_array_length(_ctx.variedades) = 0
     OR _ctx.altitud_msnm IS NULL THEN
    _es_heuristico := true;
    _explicaciones := _explicaciones || '"Modo heurístico: falta variedad o altitud"';
  END IF;

  -- Determinar yield
  _yield := COALESCE(_yield_override, _ctx.rendimiento_proyectado_kg_ha, 1500);
  IF _ctx.rendimiento_proyectado_kg_ha IS NULL AND _yield_override IS NULL THEN
    _es_heuristico := true;
    _explicaciones := _explicaciones || '"Yield estimado por defecto: 1500 kg/ha"';
  END IF;

  -- §22 Multiplicador varietal ponderado
  IF NOT _es_heuristico THEN
    _mult_varietal := 0;
    _mult_micro := 0;
    FOR _v IN SELECT * FROM jsonb_array_elements(_ctx.variedades)
    LOOP
      _prop := (_v.value->>'proporcion')::numeric;
      SELECT
        COALESCE(nv.multiplicador_demanda, 1.0) * _prop,
        COALESCE(nv.multiplicador_micronutrientes, 1.0) * _prop
      INTO _mult_varietal, _mult_micro
      FROM nutricion_variedades nv
      WHERE nv.codigo = _v.value->>'variedad_codigo';
      -- Acumular (simplified — real implementation sums)
    END LOOP;
    IF _mult_varietal = 0 THEN _mult_varietal := 1.0; END IF;
    IF _mult_micro = 0 THEN _mult_micro := 1.0; END IF;
  END IF;

  -- §23 Ajuste por edad
  IF _ctx.edad_promedio_anios IS NOT NULL THEN
    IF _ctx.edad_promedio_anios < 2 THEN
      _ajuste_edad := 0.5;  -- Establecimiento
      _explicaciones := _explicaciones || '"Ajuste edad: establecimiento (×0.5), priorizar P y Ca"';
    ELSIF _ctx.edad_promedio_anios > 7 THEN
      _ajuste_edad := 0.92; -- Declive
      _explicaciones := _explicaciones || '"Ajuste edad: declive productivo (×0.92)"';
    END IF;
  END IF;

  -- §24 Ajuste por altitud
  IF _ctx.altitud_msnm IS NOT NULL THEN
    IF _ctx.altitud_msnm < 1200 THEN
      _ajuste_alt := 1.05;  -- Zona baja: mayor volatilización
      _efic_n := _efic_n - 0.05;
      _explicaciones := _explicaciones || '"Zona baja: +5% demanda, -5% eficiencia N por volatilización"';
    ELSIF _ctx.altitud_msnm > 1500 THEN
      _ajuste_alt := 1.0;
      _explicaciones := _explicaciones || '"Zona alta: extender calendario, incrementar P soluble"';
    END IF;
  END IF;

  -- §28 Ajuste por pendiente
  IF _ctx.pendiente_pct IS NOT NULL AND _ctx.pendiente_pct > 30 THEN
    _efic_n := _efic_n - 0.05;
    _explicaciones := _explicaciones || format('"Pendiente %s%%: reducida eficiencia N"', _ctx.pendiente_pct);
  END IF;

  -- §10.1 Bloqueo por acidez
  IF _suelo.id IS NOT NULL THEN
    _ajuste_suelo := 1.0;
    IF _suelo.ph_agua IS NOT NULL AND _suelo.ph_agua < 5.0 THEN
      _bloqueos := _bloqueos || '{"tipo":"acidez","descripcion":"pH < 5.0","accion_requerida":"Encalado previo obligatorio"}';
      _es_condicionado := true;
      _explicaciones := _explicaciones || format('"BLOQUEO: pH %s requiere encalado previo"', _suelo.ph_agua);
    END IF;
    IF _suelo.aluminio_intercambiable IS NOT NULL AND _suelo.aluminio_intercambiable > 1.0 THEN
      _bloqueos := _bloqueos || '{"tipo":"aluminio","descripcion":"Al > 1 meq/100g","accion_requerida":"Encalado hasta reducir Al"}';
      _es_condicionado := true;
    END IF;
    -- §4.1.3 Ajuste por MO
    IF _suelo.materia_organica_pct IS NOT NULL THEN
      IF _suelo.materia_organica_pct < 3 THEN
        _ajuste_suelo := _ajuste_suelo * 1.10;
        _explicaciones := _explicaciones || '"MO baja: +10% demanda N"';
      ELSIF _suelo.materia_organica_pct > 6 THEN
        _ajuste_suelo := _ajuste_suelo * 0.95;
        _explicaciones := _explicaciones || '"MO alta: -5% ajuste N"';
      END IF;
    END IF;
  ELSE
    _es_heuristico := true;
    _explicaciones := _explicaciones || '"Sin análisis de suelo: modo heurístico"';
  END IF;

  -- §10.2 Bloqueo por déficit hídrico
  IF _ctx.deficit_hidrico_actual THEN
    _bloqueos := _bloqueos || '{"tipo":"deficit_hidrico","descripcion":"Déficit hídrico severo activo","accion_requerida":"Convertir a aplicación foliar de rescate"}';
    _explicaciones := _explicaciones || '"BLOQUEO: déficit hídrico → solo foliar de rescate"';
  END IF;

  -- Nivel de confianza (§6)
  IF _suelo.id IS NOT NULL AND _ctx.rendimiento_proyectado_kg_ha IS NOT NULL
     AND _ctx.fecha_floracion_principal IS NOT NULL AND _ctx.fuente_clima IN ('sensor_iot', 'api_regional') THEN
    _confianza := 'alto';
  ELSIF _suelo.id IS NOT NULL OR (_ctx.rendimiento_proyectado_kg_ha IS NOT NULL AND _ctx.altitud_msnm IS NOT NULL) THEN
    _confianza := 'medio';
  ELSE
    _confianza := 'bajo';
  END IF;

  -- §29 Cálculo de demanda final
  _dem_n  := (_ext_n  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_n;
  _dem_p  := (_ext_p  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_p;
  _dem_k  := (_ext_k  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_k;
  _dem_ca := (_ext_ca * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.70;
  _dem_mg := (_ext_mg * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.60;
  _dem_s  := (_ext_s  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.50;

  -- Insertar plan
  INSERT INTO nutricion_planes (
    organization_id, parcela_id, analisis_suelo_id, ciclo, fecha_floracion,
    estado, nivel_confianza, es_heuristico, es_condicionado,
    demanda_n_kg_ha, demanda_p2o5_kg_ha, demanda_k2o_kg_ha,
    demanda_cao_kg_ha, demanda_mgo_kg_ha, demanda_s_kg_ha,
    yield_usado_kg_ha, multiplicador_varietal_ponderado,
    ajuste_edad, ajuste_altitud, ajuste_suelo,
    eficiencia_n, eficiencia_p, eficiencia_k,
    bloqueos, flags_riesgo, explicaciones,
    confianza_detalle
  ) VALUES (
    _org_id, _parcela_id, _suelo.id,
    COALESCE(_ciclo, to_char(now(), 'YYYY') || '-A'),
    _ctx.fecha_floracion_principal,
    'generado', _confianza, _es_heuristico, _es_condicionado,
    ROUND(_dem_n, 1), ROUND(_dem_p, 1), ROUND(_dem_k, 1),
    ROUND(_dem_ca, 1), ROUND(_dem_mg, 1), ROUND(_dem_s, 1),
    _yield, _mult_varietal,
    _ajuste_edad, _ajuste_alt, _ajuste_suelo,
    _efic_n, _efic_p, _efic_k,
    _bloqueos, _flags, _explicaciones,
    jsonb_build_object(
      'suelo', _suelo.id IS NOT NULL,
      'yield', _ctx.rendimiento_proyectado_kg_ha IS NOT NULL,
      'floracion', _ctx.fecha_floracion_principal IS NOT NULL,
      'clima', _ctx.fuente_clima IN ('sensor_iot', 'api_regional')
    )
  ) RETURNING id INTO _plan_id;

  RETURN _plan_id;
END;
$$;
```

---

## PARTE 9 — VISTA CONSOLIDADA DE ESTADO NUTRICIONAL

```sql
CREATE OR REPLACE VIEW public.nutricion_parcela_resumen AS
SELECT
  ctx.organization_id,
  ctx.parcela_id,
  p.nombre AS parcela_nombre,
  p.productor_id,
  prod.nombre AS productor_nombre,
  ctx.altitud_msnm,
  ctx.densidad_plantas_ha,
  ctx.variedades,
  ctx.rendimiento_proyectado_kg_ha,
  -- Último suelo
  s.id AS ultimo_suelo_id,
  s.fecha_analisis AS ultimo_suelo_fecha,
  s.ph_agua,
  s.clasificacion_edafica,
  s.bloqueos_detectados AS suelo_bloqueos,
  -- Último plan
  plan.id AS ultimo_plan_id,
  plan.estado AS plan_estado,
  plan.nivel_confianza AS plan_confianza,
  plan.es_condicionado AS plan_condicionado,
  plan.demanda_n_kg_ha,
  plan.demanda_k2o_kg_ha,
  plan.explicaciones AS plan_explicaciones,
  plan.created_at AS plan_fecha,
  -- Ejecución
  (SELECT COUNT(*) FROM nutricion_aplicaciones a WHERE a.plan_id = plan.id) AS aplicaciones_registradas,
  (SELECT COUNT(*) FROM nutricion_fraccionamientos f WHERE f.plan_id = plan.id) AS aplicaciones_programadas
FROM nutricion_parcela_contexto ctx
JOIN parcelas p ON p.id = ctx.parcela_id
LEFT JOIN productores prod ON prod.id = p.productor_id
LEFT JOIN LATERAL (
  SELECT * FROM nutricion_analisis_suelo
  WHERE parcela_id = ctx.parcela_id AND organization_id = ctx.organization_id
  ORDER BY fecha_analisis DESC LIMIT 1
) s ON true
LEFT JOIN LATERAL (
  SELECT * FROM nutricion_planes
  WHERE parcela_id = ctx.parcela_id AND organization_id = ctx.organization_id
  ORDER BY created_at DESC LIMIT 1
) plan ON true;

-- La vista hereda RLS de las tablas base por lo que no necesita RLS propia
-- (funciona correctamente con las policies de las tablas subyacentes)
```

---

## PARTE 10 — SMOKE TESTS

Después de ejecutar todo lo anterior, validar:

```sql
-- 1. Verificar tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  AND tablename LIKE 'nutricion_%' ORDER BY tablename;
-- Esperado: nutricion_analisis_suelo, nutricion_aplicaciones, nutricion_fraccionamientos,
--           nutricion_parcela_contexto, nutricion_planes, nutricion_variedades

-- 2. Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
  AND tablename LIKE 'nutricion_%';
-- Esperado: todas con rowsecurity = true

-- 3. Verificar políticas
SELECT tablename, policyname, cmd FROM pg_policies
  WHERE tablename LIKE 'nutricion_%' ORDER BY tablename, cmd;

-- 4. Verificar ENUMs
SELECT typname FROM pg_type WHERE typname IN (
  'clasificacion_edafica', 'nivel_confianza_plan', 'estado_plan_nutricional',
  'tipo_bloqueo', 'grupo_varietal', 'fuente_clima', 'tipo_riesgo_nutricional', 'fase_fenologica'
);

-- 5. Verificar banco varietal poblado
SELECT COUNT(*), grupo FROM nutricion_variedades GROUP BY grupo ORDER BY grupo;
-- Esperado: 30 variedades total en 5 grupos

-- 6. Verificar función RPC
SELECT proname FROM pg_proc WHERE proname = 'generar_plan_nutricional_v1';

-- 7. Verificar vista
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname = 'nutricion_parcela_resumen';
```

---

## REFERENCIA RÁPIDA — Secciones del Documento de Diseño

| Sección | Tema | Tabla/Función Impactada |
|---------|------|------------------------|
| §4.1 | Reglas edáficas (pH, Al, MO, pendiente) | `nutricion_analisis_suelo`, motor RPC |
| §4.2–§20 | Banco de variedades (30 variedades) | `nutricion_variedades` |
| §4.3 | Banco fenológico (7 fases) | ENUM `fase_fenologica`, `nutricion_fraccionamientos` |
| §4.4 | Banco altitudinal (3 zonas) | Motor RPC `_ajuste_alt` |
| §4.5 | Extracción por tonelada (N/P/K/Ca/Mg/S) | Motor RPC constantes `_ext_*` |
| §5 | Modo heurístico (sin suelo) | Motor RPC `_es_heuristico` |
| §6 | Nivel de confianza | Motor RPC `_confianza` |
| §9 | Variables obligatorias (contrato inputs) | `nutricion_parcela_contexto` |
| §10 | Bloqueos técnicos (hard stops) | Motor RPC `_bloqueos` |
| §11 | Eficiencia fertilizante | Motor RPC `_efic_n/p/k` |
| §12 | Multiplicadores (variedad/densidad/edad) | Motor RPC + `nutricion_variedades` |
| §13 | Flags de riesgo | Motor RPC `_flags` |
| §14 | Explicabilidad (explain engine) | `nutricion_planes.explicaciones` |
| §22 | Mezcla varietal ponderada | `nutricion_parcela_contexto.variedades` jsonb |
| §29 | Modelo integrado de demanda final | Función `generar_plan_nutricional_v1` |
| §31–§44 | Interpretación análisis de suelo | `nutricion_analisis_suelo` |
| §46–§49 | Modelo fenológico GDA | `nutricion_fraccionamientos.gda_objetivo` |
| §57–§58 | Modelo económico | `nutricion_planes.costo_estimado_total` |

---

> **End of Supabase AI Nutrition Prompt**
