# Prompt para Supabase AI — Nutrición Fase 2: Prueba E2E + Fraccionamientos Automáticos

> **Copia y pega este texto completo en el Supabase AI Assistant.**
> Ejecuta cada PARTE en orden. Si una parte falla, corrige antes de pasar a la siguiente.
> Última actualización: 2026-03-05

---

## CONTEXTO PREVIO (NO ejecutar — solo referencia)

Ya existen en la base de datos:

### Funciones helper
```
get_user_organization_id(_uid uuid) RETURNS uuid  -- SECURITY DEFINER
is_admin(_uid uuid) RETURNS boolean                -- SECURITY DEFINER
is_org_admin(_uid uuid) RETURNS boolean            -- SECURITY DEFINER
update_updated_at_column() RETURNS trigger
```

### ENUMs (8 tipos)
```
clasificacion_edafica, nivel_confianza_plan, estado_plan_nutricional,
tipo_bloqueo, grupo_varietal, fuente_clima, tipo_riesgo_nutricional, fase_fenologica
```

### Tablas de nutrición (Fase 1)
```
nutricion_variedades        -- 30 registros seed, catálogo global
nutricion_parcela_contexto  -- Inputs del motor (parcela_id UNIQUE)
nutricion_analisis_suelo    -- Resultados de laboratorio
nutricion_planes            -- Salida del motor §29
nutricion_fraccionamientos  -- Aplicaciones programadas
nutricion_aplicaciones      -- Registro de ejecución real
```

### Tablas existentes del sistema
```
platform_organizations(id uuid PK, nombre, tipo, modules jsonb)
parcelas(id uuid PK, organization_id uuid NOT NULL, productor_id uuid, nombre, area_hectareas, altitud, municipio)
productores(id uuid PK, organization_id uuid NOT NULL, nombre, email)
profiles(user_id uuid PK, organization_id uuid, productor_id uuid, name, organization_name)
```

### Función RPC existente
```
generar_plan_nutricional_v1(_parcela_id uuid, _ciclo text, _yield_override numeric) RETURNS uuid
```

### Vista existente
```
nutricion_parcela_resumen  -- JOIN de contexto + último suelo + último plan
```

### Organización demo
```
ID: 00000000-0000-0000-0000-000000000001
Nombre: Novasilva Demo
```

---

## PARTE 1 — VERIFICAR PRERREQUISITOS

Ejecuta esto primero para confirmar que todo de Fase 1 está en su lugar. Si alguno falla, NO continúes.

```sql
-- 1A. Verificar que las 6 tablas existen
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'nutricion_%'
ORDER BY tablename;
-- DEBE devolver: nutricion_analisis_suelo, nutricion_aplicaciones,
-- nutricion_fraccionamientos, nutricion_parcela_contexto, nutricion_planes, nutricion_variedades

-- 1B. Verificar que la función RPC existe
SELECT proname FROM pg_proc WHERE proname = 'generar_plan_nutricional_v1';
-- DEBE devolver 1 fila

-- 1C. Verificar que la vista existe
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname = 'nutricion_parcela_resumen';
-- DEBE devolver 1 fila

-- 1D. Verificar variedades seed
SELECT COUNT(*) AS total_variedades FROM public.nutricion_variedades;
-- DEBE devolver >= 30

-- 1E. Verificar que parcelas tiene organization_id
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'organization_id';
-- DEBE devolver 1 fila con is_nullable = 'NO'

-- 1F. Verificar org demo existe
SELECT id, nombre FROM public.platform_organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
-- DEBE devolver 1 fila (nombre puede variar: 'Novasilva Demo' o similar)
```

---

## PARTE 2 — SEMILLAS DEMO PARA PRUEBA E2E

Inserta datos mínimos para probar el flujo completo. Usa `ON CONFLICT DO NOTHING` para idempotencia.

```sql
-- 2A. Verificar si existe un productor demo
-- Si no existe, crearlo
DO $$
DECLARE
  _org_id uuid := '00000000-0000-0000-0000-000000000001';
  _productor_id uuid;
  _parcela_id uuid;
BEGIN
  -- Buscar un productor existente de la org demo
  SELECT id INTO _productor_id FROM public.productores
  WHERE organization_id = _org_id LIMIT 1;

  -- Si no hay productor, crear uno
  IF _productor_id IS NULL THEN
    INSERT INTO public.productores (id, organization_id, nombre, email, tipo)
    VALUES (
      'aaaaaaaa-0001-0001-0001-000000000001',
      _org_id,
      'Productor Demo Nutrición',
      'demo.nutricion@novasilva.com',
      'individual'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO _productor_id;

    -- Si todavía es null (por conflict), buscarlo
    IF _productor_id IS NULL THEN
      SELECT id INTO _productor_id FROM public.productores
      WHERE organization_id = _org_id LIMIT 1;
    END IF;
  END IF;

  RAISE NOTICE 'Productor ID: %', _productor_id;

  -- Buscar una parcela existente de la org demo
  SELECT id INTO _parcela_id FROM public.parcelas
  WHERE organization_id = _org_id LIMIT 1;

  -- Si no hay parcela, crear una
  IF _parcela_id IS NULL THEN
    INSERT INTO public.parcelas (id, organization_id, productor_id, nombre, area_hectareas, altitud)
    VALUES (
      'bbbbbbbb-0001-0001-0001-000000000001',
      _org_id,
      _productor_id,
      'Parcela Demo Nutrición',
      2.5,
      1350
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO _parcela_id;

    IF _parcela_id IS NULL THEN
      SELECT id INTO _parcela_id FROM public.parcelas
      WHERE organization_id = _org_id LIMIT 1;
    END IF;
  END IF;

  RAISE NOTICE 'Parcela ID: %', _parcela_id;
END;
$$;
```

```sql
-- 2B. Obtener IDs para usar en las siguientes partes
-- Ejecutar y ANOTAR los resultados
SELECT
  p.id AS parcela_id,
  p.nombre AS parcela_nombre,
  p.productor_id,
  p.organization_id
FROM public.parcelas p
WHERE p.organization_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1;
```

---

## PARTE 3 — INSERTAR CONTEXTO NUTRICIONAL DEMO

**IMPORTANTE**: Reemplaza `PARCELA_ID_AQUI` con el parcela_id obtenido en Parte 2B.

```sql
-- 3A. Insertar contexto de parcela
INSERT INTO public.nutricion_parcela_contexto (
  organization_id,
  parcela_id,
  altitud_msnm,
  pendiente_pct,
  area_ha,
  tipo_suelo,
  textura,
  sistema_manejo,
  densidad_plantas_ha,
  edad_promedio_anios,
  variedades,
  rendimiento_proyectado_kg_ha,
  fecha_floracion_principal,
  ciclo_estimado_meses,
  precipitacion_promedio_mm,
  deficit_hidrico_actual,
  temperatura_media,
  fuente_clima,
  porcentaje_renovacion
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  PARCELA_ID_AQUI,                              -- ← REEMPLAZAR
  1350,                                          -- Altitud media (zona cafetera)
  15.0,                                          -- 15% pendiente
  2.5,                                           -- 2.5 hectáreas
  'andisol',                                     -- Suelo volcánico típico
  'franco',                                      -- Textura franca
  'convencional',                                -- Manejo convencional
  5000,                                          -- 5000 plantas/ha
  4.5,                                           -- 4.5 años (plena producción)
  '[{"variedad_codigo": "castillo", "proporcion": 0.6}, {"variedad_codigo": "caturra", "proporcion": 0.4}]'::jsonb,
  2800,                                          -- 2800 kg/ha proyectado
  '2026-03-15',                                  -- Floración principal
  9.5,                                           -- 9.5 meses de ciclo
  1800,                                          -- 1800 mm precipitación
  false,                                         -- Sin déficit hídrico
  21.5,                                          -- 21.5°C temperatura media
  'modelo_altitudinal',                          -- Fuente clima
  0                                              -- Sin renovación
)
ON CONFLICT (parcela_id) DO UPDATE SET
  altitud_msnm = EXCLUDED.altitud_msnm,
  variedades = EXCLUDED.variedades,
  rendimiento_proyectado_kg_ha = EXCLUDED.rendimiento_proyectado_kg_ha,
  updated_at = now();
```

---

## PARTE 4 — INSERTAR ANÁLISIS DE SUELO DEMO

```sql
-- 4A. Insertar análisis de suelo demo
INSERT INTO public.nutricion_analisis_suelo (
  organization_id,
  parcela_id,
  fecha_analisis,
  laboratorio,
  codigo_muestra,
  -- Variables edáficas
  ph_agua,
  aluminio_intercambiable,
  materia_organica_pct,
  p_disponible,
  k_intercambiable,
  ca_intercambiable,
  mg_intercambiable,
  na_intercambiable,
  cic,
  saturacion_bases_pct,
  azufre,
  -- Micronutrientes
  zinc,
  boro,
  manganeso,
  cobre,
  hierro,
  -- Relaciones catiónicas (pre-calculadas)
  relacion_ca_mg,
  relacion_ca_k,
  relacion_mg_k,
  saturacion_al_cic_pct,
  -- Clasificación
  clasificacion_edafica,
  bloqueos_detectados,
  necesidad_encalado_kg_ha
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  PARCELA_ID_AQUI,                              -- ← REEMPLAZAR
  '2026-02-20',                                  -- Fecha análisis
  'Laboratorio Nacional de Suelos',
  'LNS-2026-0042',
  -- Suelo típico andisol zona cafetera colombiana
  5.2,                                           -- pH ligeramente ácido (§32)
  0.5,                                           -- Al bajo (< 1 meq, sin bloqueo)
  5.8,                                           -- MO buena (>5%)
  12.0,                                          -- P disponible adecuado
  0.35,                                          -- K intercambiable
  4.50,                                          -- Ca intercambiable
  1.20,                                          -- Mg intercambiable
  0.08,                                          -- Na bajo
  18.5,                                          -- CIC
  55.0,                                          -- Saturación bases
  15.0,                                          -- Azufre adecuado
  -- Micronutrientes
  3.5,                                           -- Zn adecuado
  0.4,                                           -- B medio
  35.0,                                          -- Mn normal
  2.5,                                           -- Cu normal
  120.0,                                         -- Fe normal
  -- Relaciones catiónicas
  3.75,                                          -- Ca/Mg (4.5/1.2)
  12.86,                                         -- Ca/K (4.5/0.35)
  3.43,                                          -- Mg/K (1.2/0.35)
  7.8,                                           -- Sat Al/CICE %
  -- Clasificación
  'adecuado',                                    -- Sin bloqueos
  '[]'::jsonb,                                   -- Sin bloqueos
  0                                              -- Sin necesidad encalado
);
```

---

## PARTE 5 — EJECUTAR RPC generar_plan_nutricional_v1

**NOTA**: Esta función usa `auth.uid()` internamente. Desde el SQL Editor (que ejecuta como postgres/service role), `auth.uid()` retorna NULL y fallará.

**Opción A — Ejecutar como service role (bypass RLS)**:

Si la función falla por auth.uid() = NULL, usa esta versión directa que simula lo que hace la RPC:

```sql
-- 5A. Ejecución directa del motor (bypass auth para prueba)
DO $$
DECLARE
  _org_id uuid := '00000000-0000-0000-0000-000000000001';
  _parcela_id uuid;
  _ctx public.nutricion_parcela_contexto%ROWTYPE;
  _suelo public.nutricion_analisis_suelo%ROWTYPE;
  _plan_id uuid;
  _yield numeric;
  _mult_varietal numeric := 0;
  _mult_micro numeric := 0;
  _ajuste_edad numeric := 1.0;
  _ajuste_alt numeric := 1.0;
  _ajuste_suelo numeric := 1.0;
  _efic_n numeric := 0.55;
  _efic_p numeric := 0.25;
  _efic_k numeric := 0.65;
  _es_heuristico boolean := false;
  _confianza public.nivel_confianza_plan := 'bajo';
  _bloqueos jsonb := '[]';
  _explicaciones jsonb := '[]';
  _flags jsonb := '[]';
  _es_condicionado boolean := false;
  _ext_n numeric := 37.5;
  _ext_p numeric := 8.5;
  _ext_k numeric := 47.5;
  _ext_ca numeric := 5.0;
  _ext_mg numeric := 4.0;
  _ext_s numeric := 3.5;
  _dem_n numeric; _dem_p numeric; _dem_k numeric;
  _dem_ca numeric; _dem_mg numeric; _dem_s numeric;
  _v record;
  _prop numeric;
  _var_mult numeric;
  _var_micro numeric;
BEGIN
  -- Obtener parcela demo
  SELECT id INTO _parcela_id FROM public.parcelas
  WHERE organization_id = _org_id LIMIT 1;

  IF _parcela_id IS NULL THEN
    RAISE EXCEPTION 'No hay parcela demo. Ejecuta Parte 2 primero.';
  END IF;

  -- Cargar contexto
  SELECT * INTO _ctx FROM public.nutricion_parcela_contexto
  WHERE parcela_id = _parcela_id AND organization_id = _org_id;

  IF _ctx.id IS NULL THEN
    RAISE EXCEPTION 'No hay contexto nutricional. Ejecuta Parte 3 primero.';
  END IF;

  -- Cargar último suelo
  SELECT * INTO _suelo FROM public.nutricion_analisis_suelo
  WHERE parcela_id = _parcela_id AND organization_id = _org_id
  ORDER BY fecha_analisis DESC LIMIT 1;

  -- Determinar yield
  _yield := COALESCE(_ctx.rendimiento_proyectado_kg_ha, 1500);

  -- Multiplicador varietal ponderado (acumulación correcta)
  IF _ctx.variedades IS NOT NULL AND jsonb_array_length(_ctx.variedades) > 0 THEN
    FOR _v IN SELECT * FROM jsonb_array_elements(_ctx.variedades)
    LOOP
      _prop := (_v.value->>'proporcion')::numeric;
      SELECT
        COALESCE(nv.multiplicador_demanda, 1.0),
        COALESCE(nv.multiplicador_micronutrientes, 1.0)
      INTO _var_mult, _var_micro
      FROM public.nutricion_variedades nv
      WHERE nv.codigo = _v.value->>'variedad_codigo';

      IF FOUND THEN
        _mult_varietal := _mult_varietal + (_var_mult * _prop);
        _mult_micro := _mult_micro + (_var_micro * _prop);
      END IF;
    END LOOP;
  END IF;

  IF _mult_varietal = 0 THEN _mult_varietal := 1.0; END IF;
  IF _mult_micro = 0 THEN _mult_micro := 1.0; END IF;

  -- Ajuste por edad
  IF _ctx.edad_promedio_anios IS NOT NULL THEN
    IF _ctx.edad_promedio_anios < 2 THEN
      _ajuste_edad := 0.5;
      _explicaciones := _explicaciones || '"Ajuste edad: establecimiento (×0.5)"';
    ELSIF _ctx.edad_promedio_anios > 7 THEN
      _ajuste_edad := 0.92;
      _explicaciones := _explicaciones || '"Ajuste edad: declive productivo (×0.92)"';
    ELSE
      _explicaciones := _explicaciones || format('"Edad %s años: plena producción, sin ajuste"', _ctx.edad_promedio_anios);
    END IF;
  END IF;

  -- Ajuste por altitud
  IF _ctx.altitud_msnm IS NOT NULL THEN
    IF _ctx.altitud_msnm < 1200 THEN
      _ajuste_alt := 1.05;
      _efic_n := _efic_n - 0.05;
      _explicaciones := _explicaciones || '"Zona baja: +5% demanda, -5% eficiencia N"';
    ELSIF _ctx.altitud_msnm > 1500 THEN
      _ajuste_alt := 1.0;
      _explicaciones := _explicaciones || '"Zona alta: extender calendario"';
    ELSE
      _explicaciones := _explicaciones || format('"Altitud %s msnm: zona óptima cafetera"', _ctx.altitud_msnm);
    END IF;
  END IF;

  -- Ajuste por pendiente
  IF _ctx.pendiente_pct IS NOT NULL AND _ctx.pendiente_pct > 30 THEN
    _efic_n := _efic_n - 0.05;
    _explicaciones := _explicaciones || format('"Pendiente %s%%: reducida eficiencia N"', _ctx.pendiente_pct);
  END IF;

  -- Bloqueos por suelo
  IF _suelo.id IS NOT NULL THEN
    IF _suelo.ph_agua IS NOT NULL AND _suelo.ph_agua < 5.0 THEN
      _bloqueos := _bloqueos || '{"tipo":"acidez","descripcion":"pH < 5.0","accion_requerida":"Encalado previo obligatorio"}'::jsonb;
      _es_condicionado := true;
    END IF;
    IF _suelo.aluminio_intercambiable IS NOT NULL AND _suelo.aluminio_intercambiable > 1.0 THEN
      _bloqueos := _bloqueos || '{"tipo":"aluminio","descripcion":"Al > 1 meq/100g","accion_requerida":"Encalado hasta reducir Al"}'::jsonb;
      _es_condicionado := true;
    END IF;
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

  -- Bloqueo déficit hídrico
  IF _ctx.deficit_hidrico_actual THEN
    _bloqueos := _bloqueos || '{"tipo":"deficit_hidrico","descripcion":"Déficit hídrico activo","accion_requerida":"Solo foliar de rescate"}'::jsonb;
  END IF;

  -- Nivel de confianza
  IF _suelo.id IS NOT NULL AND _ctx.rendimiento_proyectado_kg_ha IS NOT NULL
     AND _ctx.fecha_floracion_principal IS NOT NULL AND _ctx.fuente_clima IN ('sensor_iot', 'api_regional') THEN
    _confianza := 'alto';
  ELSIF _suelo.id IS NOT NULL OR (_ctx.rendimiento_proyectado_kg_ha IS NOT NULL AND _ctx.altitud_msnm IS NOT NULL) THEN
    _confianza := 'medio';
  ELSE
    _confianza := 'bajo';
  END IF;

  -- Cálculo de demanda final §29
  _dem_n  := (_ext_n  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_n;
  _dem_p  := (_ext_p  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_p;
  _dem_k  := (_ext_k  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_k;
  _dem_ca := (_ext_ca * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.70;
  _dem_mg := (_ext_mg * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.60;
  _dem_s  := (_ext_s  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.50;

  RAISE NOTICE '--- RESULTADO DEL MOTOR PARAMÉTRICO §29 ---';
  RAISE NOTICE 'Parcela: %', _parcela_id;
  RAISE NOTICE 'Yield usado: % kg/ha', _yield;
  RAISE NOTICE 'Mult. varietal: %', ROUND(_mult_varietal, 3);
  RAISE NOTICE 'Ajuste edad: %', _ajuste_edad;
  RAISE NOTICE 'Ajuste altitud: %', _ajuste_alt;
  RAISE NOTICE 'Ajuste suelo: %', _ajuste_suelo;
  RAISE NOTICE 'Eficiencia N/P/K: %/%/%', _efic_n, _efic_p, _efic_k;
  RAISE NOTICE '---';
  RAISE NOTICE 'Demanda N:    % kg/ha', ROUND(_dem_n, 1);
  RAISE NOTICE 'Demanda P2O5: % kg/ha', ROUND(_dem_p, 1);
  RAISE NOTICE 'Demanda K2O:  % kg/ha', ROUND(_dem_k, 1);
  RAISE NOTICE 'Demanda CaO:  % kg/ha', ROUND(_dem_ca, 1);
  RAISE NOTICE 'Demanda MgO:  % kg/ha', ROUND(_dem_mg, 1);
  RAISE NOTICE 'Demanda S:    % kg/ha', ROUND(_dem_s, 1);
  RAISE NOTICE '---';
  RAISE NOTICE 'Confianza: %', _confianza;
  RAISE NOTICE 'Heurístico: %', _es_heuristico;
  RAISE NOTICE 'Condicionado: %', _es_condicionado;
  RAISE NOTICE 'Bloqueos: %', _bloqueos;

  -- Insertar plan
  INSERT INTO public.nutricion_planes (
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
    '2026-A',
    _ctx.fecha_floracion_principal,
    'generado', _confianza, _es_heuristico, _es_condicionado,
    ROUND(_dem_n, 1), ROUND(_dem_p, 1), ROUND(_dem_k, 1),
    ROUND(_dem_ca, 1), ROUND(_dem_mg, 1), ROUND(_dem_s, 1),
    _yield, ROUND(_mult_varietal, 2),
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

  RAISE NOTICE '✅ Plan creado con ID: %', _plan_id;
END;
$$;
```

---

## PARTE 6 — FUNCIÓN v1.1: GENERAR FRACCIONAMIENTOS AUTOMÁTICOS

Esta función toma un plan_id existente y genera los fraccionamientos (aplicaciones programadas) automáticamente según reglas por fase fenológica.

```sql
CREATE OR REPLACE FUNCTION public.generar_fraccionamientos_v1(
  _plan_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan public.nutricion_planes%ROWTYPE;
  _ctx public.nutricion_parcela_contexto%ROWTYPE;
  _num_fracc int;
  _fecha_base date;
  _i int;
  _fase public.fase_fenologica;
  _pct_n numeric;
  _pct_p numeric;
  _pct_k numeric;
  _pct_ca numeric;
  _pct_mg numeric;
  _pct_s numeric;
  _fecha_prog date;
  _inserted int := 0;
BEGIN
  -- Cargar plan
  SELECT * INTO _plan FROM public.nutricion_planes WHERE id = _plan_id;
  IF _plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan no encontrado: %', _plan_id;
  END IF;

  -- Verificar que el plan pertenece a la org del usuario (o bypass para service role)
  -- En producción usa auth.uid(); en prueba con service role, omitir check

  -- Cargar contexto
  SELECT * INTO _ctx FROM public.nutricion_parcela_contexto
  WHERE parcela_id = _plan.parcela_id AND organization_id = _plan.organization_id;

  -- Determinar número de fraccionamientos
  -- Por defecto 4; para porte_alto puede ser 3
  _num_fracc := 4;

  -- Fecha base: floración del plan o fecha actual + 30 días
  _fecha_base := COALESCE(_plan.fecha_floracion, CURRENT_DATE + INTERVAL '30 days');

  -- Eliminar fraccionamientos previos del plan (idempotente)
  DELETE FROM public.nutricion_fraccionamientos WHERE plan_id = _plan_id;

  -- Distribución por aplicación (§29 simplificado):
  -- App 1 (Post-floración/Cabeza alfiler): 30% N, 40% P, 20% K
  -- App 2 (Expansión rápida):              30% N, 30% P, 30% K
  -- App 3 (Llenado de grano):              25% N, 20% P, 35% K
  -- App 4 (Pre-cosecha/Maduración):        15% N, 10% P, 15% K

  FOR _i IN 1.._num_fracc LOOP
    CASE _i
      WHEN 1 THEN
        _fase := 'cabeza_alfiler';
        _pct_n := 0.30; _pct_p := 0.40; _pct_k := 0.20;
        _pct_ca := 0.40; _pct_mg := 0.30; _pct_s := 0.30;
        _fecha_prog := _fecha_base + INTERVAL '15 days';
      WHEN 2 THEN
        _fase := 'expansion_rapida';
        _pct_n := 0.30; _pct_p := 0.30; _pct_k := 0.30;
        _pct_ca := 0.25; _pct_mg := 0.25; _pct_s := 0.25;
        _fecha_prog := _fecha_base + INTERVAL '75 days';
      WHEN 3 THEN
        _fase := 'llenado_grano';
        _pct_n := 0.25; _pct_p := 0.20; _pct_k := 0.35;
        _pct_ca := 0.20; _pct_mg := 0.25; _pct_s := 0.25;
        _fecha_prog := _fecha_base + INTERVAL '150 days';
      WHEN 4 THEN
        _fase := 'maduracion';
        _pct_n := 0.15; _pct_p := 0.10; _pct_k := 0.15;
        _pct_ca := 0.15; _pct_mg := 0.20; _pct_s := 0.20;
        _fecha_prog := _fecha_base + INTERVAL '210 days';
    END CASE;

    INSERT INTO public.nutricion_fraccionamientos (
      organization_id,
      plan_id,
      numero_aplicacion,
      fase_fenologica,
      fecha_programada,
      dosis_n,
      dosis_p2o5,
      dosis_k2o,
      dosis_cao,
      dosis_mgo,
      dosis_s,
      tipo_aplicacion,
      notas
    ) VALUES (
      _plan.organization_id,
      _plan_id,
      _i,
      _fase,
      _fecha_prog,
      ROUND(COALESCE(_plan.demanda_n_kg_ha, 0) * _pct_n, 1),
      ROUND(COALESCE(_plan.demanda_p2o5_kg_ha, 0) * _pct_p, 1),
      ROUND(COALESCE(_plan.demanda_k2o_kg_ha, 0) * _pct_k, 1),
      ROUND(COALESCE(_plan.demanda_cao_kg_ha, 0) * _pct_ca, 1),
      ROUND(COALESCE(_plan.demanda_mgo_kg_ha, 0) * _pct_mg, 1),
      ROUND(COALESCE(_plan.demanda_s_kg_ha, 0) * _pct_s, 1),
      CASE WHEN _plan.es_condicionado AND _i = 1 THEN 'foliar_rescate' ELSE 'edafica' END,
      CASE _i
        WHEN 1 THEN 'Post-floración. Priorizar P y Ca para desarrollo de fruto.'
        WHEN 2 THEN 'Expansión rápida. Máxima demanda N y K.'
        WHEN 3 THEN 'Llenado de grano. Incrementar K para calidad.'
        WHEN 4 THEN 'Pre-cosecha. Dosis de mantenimiento. Evitar N tardío en variedades sensibles.'
      END
    );

    _inserted := _inserted + 1;
  END LOOP;

  -- Actualizar estado del plan si estaba en 'generado'
  UPDATE public.nutricion_planes
  SET estado = 'generado', updated_at = now()
  WHERE id = _plan_id AND estado = 'borrador';

  RETURN _inserted;
END;
$$;
```

---

## PARTE 7 — EJECUTAR FRACCIONAMIENTOS AUTOMÁTICOS PARA PLAN DEMO

```sql
-- 7A. Obtener el plan_id creado en Parte 5
SELECT id AS plan_id, parcela_id, estado, nivel_confianza,
       demanda_n_kg_ha, demanda_k2o_kg_ha, created_at
FROM public.nutricion_planes
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC LIMIT 1;

-- 7B. Ejecutar generación de fraccionamientos
-- REEMPLAZAR PLAN_ID_AQUI con el id obtenido arriba
SELECT public.generar_fraccionamientos_v1('PLAN_ID_AQUI');

-- 7C. Verificar fraccionamientos creados
SELECT
  numero_aplicacion,
  fase_fenologica,
  fecha_programada,
  dosis_n, dosis_p2o5, dosis_k2o, dosis_cao, dosis_mgo, dosis_s,
  tipo_aplicacion,
  notas
FROM public.nutricion_fraccionamientos
WHERE plan_id = 'PLAN_ID_AQUI'
ORDER BY numero_aplicacion;
-- DEBE devolver 4 filas con distribución correcta de nutrientes
```

---

## PARTE 8 — ÍNDICES ADICIONALES DE RENDIMIENTO

```sql
-- 8A. Índices por parcela_id (si no existen)
CREATE INDEX IF NOT EXISTS idx_nutricion_planes_parcela_created
  ON public.nutricion_planes(parcela_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_fracc
  ON public.nutricion_aplicaciones(fraccionamiento_id);

CREATE INDEX IF NOT EXISTS idx_nutricion_analisis_parcela_fecha
  ON public.nutricion_analisis_suelo(parcela_id, fecha_analisis DESC);

-- 8B. Verificar índices
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename LIKE 'nutricion_%'
ORDER BY tablename, indexname;
```

---

## PARTE 9 — VERIFICACIÓN FINAL (SMOKE TESTS)

```sql
-- 9A. Vista resumen funciona con datos demo
SELECT * FROM public.nutricion_parcela_resumen
WHERE organization_id = '00000000-0000-0000-0000-000000000001';
-- DEBE devolver al menos 1 fila con: parcela_nombre, ph_agua, plan_estado='generado',
-- aplicaciones_programadas=4, aplicaciones_registradas=0

-- 9B. Verificar que la función v1.1 existe
SELECT proname, pronargs FROM pg_proc WHERE proname = 'generar_fraccionamientos_v1';
-- DEBE devolver 1 fila

-- 9C. Conteo final de datos demo
SELECT 'contextos' AS tipo, COUNT(*) FROM nutricion_parcela_contexto WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'analisis_suelo', COUNT(*) FROM nutricion_analisis_suelo WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'planes', COUNT(*) FROM nutricion_planes WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'fraccionamientos', COUNT(*) FROM nutricion_fraccionamientos WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'aplicaciones', COUNT(*) FROM nutricion_aplicaciones WHERE organization_id = '00000000-0000-0000-0000-000000000001';
-- Esperado: contextos≥1, analisis_suelo≥1, planes≥1, fraccionamientos≥4, aplicaciones=0

-- 9D. Verificar que NO hay problemas de RLS en tablas
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'nutricion_%';
-- TODAS deben tener rowsecurity = true
```

---

## RESUMEN DE ENTREGABLES FASE 2

| # | Entregable | Verificación |
|---|-----------|-------------|
| 1 | Semillas demo (productor, parcela, contexto, suelo) | Parte 9C: conteo ≥ 1 |
| 2 | Plan nutricional generado por motor §29 | Parte 9A: plan_estado = 'generado' |
| 3 | Función `generar_fraccionamientos_v1` (v1.1) | Parte 9B: existe |
| 4 | 4 fraccionamientos auto-generados | Parte 9A: aplicaciones_programadas = 4 |
| 5 | Índices de rendimiento adicionales | Parte 8B: listado |
| 6 | Vista resumen validada con datos reales | Parte 9A: datos completos |
