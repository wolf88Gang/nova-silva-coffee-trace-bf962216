# Nutrición Fase 2 — Script Único para Supabase SQL Editor

> **Instrucciones**: Copia TODO el bloque SQL de abajo y pégalo en el SQL Editor de Supabase. Ejecútalo de una sola vez. No necesitas reemplazar nada manualmente — el script auto-detecta IDs.
>
> **Requisito**: Fase 1 ya ejecutada (6 tablas nutricion_*, RPC generar_plan_nutricional_v1, vista nutricion_parcela_resumen, 30 variedades seed).
>
> Última actualización: 2026-03-06

---

```sql
-- ============================================================
-- NUTRICIÓN FASE 2 — SCRIPT COMPLETO AUTO-CONTENIDO
-- Ejecutar de una sola vez en SQL Editor de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PARTE 1: VERIFICACIONES PREVIAS
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Verificar tablas de Fase 1
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nutricion_parcela_contexto') THEN
    RAISE EXCEPTION 'FALTA tabla nutricion_parcela_contexto. Ejecuta Fase 1 primero.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nutricion_analisis_suelo') THEN
    RAISE EXCEPTION 'FALTA tabla nutricion_analisis_suelo. Ejecuta Fase 1 primero.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nutricion_planes') THEN
    RAISE EXCEPTION 'FALTA tabla nutricion_planes. Ejecuta Fase 1 primero.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nutricion_fraccionamientos') THEN
    RAISE EXCEPTION 'FALTA tabla nutricion_fraccionamientos. Ejecuta Fase 1 primero.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nutricion_aplicaciones') THEN
    RAISE EXCEPTION 'FALTA tabla nutricion_aplicaciones. Ejecuta Fase 1 primero.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='nutricion_variedades') THEN
    RAISE EXCEPTION 'FALTA tabla nutricion_variedades. Ejecuta Fase 1 primero.';
  END IF;
  -- Verificar RPC
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='generar_plan_nutricional_v1') THEN
    RAISE EXCEPTION 'FALTA función generar_plan_nutricional_v1. Ejecuta Fase 1 primero.';
  END IF;
  -- Verificar vista
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='nutricion_parcela_resumen') THEN
    RAISE EXCEPTION 'FALTA vista nutricion_parcela_resumen. Ejecuta Fase 1 primero.';
  END IF;
  -- Verificar variedades
  IF (SELECT count(*) FROM public.nutricion_variedades) < 25 THEN
    RAISE EXCEPTION 'Faltan variedades seed (esperadas >=25, hay %). Ejecuta Fase 1.', (SELECT count(*) FROM public.nutricion_variedades);
  END IF;

  RAISE NOTICE '✅ PARTE 1: Todas las verificaciones pasaron.';
END;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 2: SEMILLAS DEMO (org, productor, parcela)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _org_id    uuid := '00000000-0000-0000-0000-000000000001';
  _prod_id   uuid;
  _parc_id   uuid;
  _org_name_col text;
BEGIN
  -- 2A. Asegurar org demo existe
  -- Detectar si la columna se llama "name" o "nombre"
  SELECT column_name INTO _org_name_col
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='platform_organizations'
    AND column_name IN ('name','nombre')
  LIMIT 1;

  IF _org_name_col IS NULL THEN
    RAISE EXCEPTION 'platform_organizations no tiene columna name ni nombre';
  END IF;

  -- Insertar org demo si no existe (usa SQL dinámico por el nombre de columna)
  IF NOT EXISTS (SELECT 1 FROM public.platform_organizations WHERE id = _org_id) THEN
    EXECUTE format(
      'INSERT INTO public.platform_organizations (id, %I) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      _org_name_col
    ) USING _org_id, 'Novasilva Demo';
    RAISE NOTICE 'Org demo creada.';
  ELSE
    RAISE NOTICE 'Org demo ya existe.';
  END IF;

  -- 2B. Asegurar productor demo
  SELECT id INTO _prod_id FROM public.productores
  WHERE organization_id = _org_id LIMIT 1;

  IF _prod_id IS NULL THEN
    INSERT INTO public.productores (id, organization_id, nombre, email)
    VALUES (
      'aaaaaaaa-0001-0001-0001-000000000001', _org_id,
      'Productor Demo Nutrición', 'demo.nutricion@novasilva.com'
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO _prod_id;

    IF _prod_id IS NULL THEN
      SELECT id INTO _prod_id FROM public.productores
      WHERE organization_id = _org_id LIMIT 1;
    END IF;
    RAISE NOTICE 'Productor creado: %', _prod_id;
  ELSE
    RAISE NOTICE 'Productor existente: %', _prod_id;
  END IF;

  -- 2C. Asegurar parcela demo
  -- Detectar si la columna de altitud se llama "altitud" o "altitud_msnm"
  SELECT id INTO _parc_id FROM public.parcelas
  WHERE organization_id = _org_id LIMIT 1;

  IF _parc_id IS NULL THEN
    -- Intentar con altitud_msnm primero, luego altitud
    BEGIN
      INSERT INTO public.parcelas (id, organization_id, productor_id, nombre, area_hectareas, altitud_msnm)
      VALUES (
        'bbbbbbbb-0001-0001-0001-000000000001', _org_id, _prod_id,
        'Parcela Demo Nutrición', 2.5, 1350
      ) ON CONFLICT DO NOTHING
      RETURNING id INTO _parc_id;
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO public.parcelas (id, organization_id, productor_id, nombre, area_hectareas, altitud)
      VALUES (
        'bbbbbbbb-0001-0001-0001-000000000001', _org_id, _prod_id,
        'Parcela Demo Nutrición', 2.5, 1350
      ) ON CONFLICT DO NOTHING
      RETURNING id INTO _parc_id;
    END;

    IF _parc_id IS NULL THEN
      SELECT id INTO _parc_id FROM public.parcelas
      WHERE organization_id = _org_id LIMIT 1;
    END IF;
    RAISE NOTICE 'Parcela creada: %', _parc_id;
  ELSE
    RAISE NOTICE 'Parcela existente: %', _parc_id;
  END IF;

  RAISE NOTICE '✅ PARTE 2: Semillas OK. Productor=% Parcela=%', _prod_id, _parc_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 3: CONTEXTO NUTRICIONAL DEMO
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _org_id    uuid := '00000000-0000-0000-0000-000000000001';
  _parc_id   uuid;
BEGIN
  SELECT id INTO _parc_id FROM public.parcelas
  WHERE organization_id = _org_id LIMIT 1;

  IF _parc_id IS NULL THEN
    RAISE EXCEPTION 'No hay parcela demo. Parte 2 falló.';
  END IF;

  INSERT INTO public.nutricion_parcela_contexto (
    organization_id, parcela_id, altitud_msnm, pendiente_pct, area_ha,
    tipo_suelo, textura, sistema_manejo, densidad_plantas_ha,
    edad_promedio_anios, variedades, rendimiento_proyectado_kg_ha,
    fecha_floracion_principal, ciclo_estimado_meses,
    precipitacion_promedio_mm, deficit_hidrico_actual,
    temperatura_media, fuente_clima, porcentaje_renovacion
  ) VALUES (
    _org_id, _parc_id,
    1350, 15.0, 2.5,
    'andisol', 'franco', 'convencional', 5000,
    4.5,
    '[{"variedad_codigo":"castillo","proporcion":0.6},{"variedad_codigo":"caturra","proporcion":0.4}]'::jsonb,
    2800, '2026-03-15', 9.5,
    1800, false, 21.5, 'modelo_altitudinal', 0
  )
  ON CONFLICT (parcela_id) DO UPDATE SET
    altitud_msnm = EXCLUDED.altitud_msnm,
    variedades = EXCLUDED.variedades,
    rendimiento_proyectado_kg_ha = EXCLUDED.rendimiento_proyectado_kg_ha,
    updated_at = now();

  RAISE NOTICE '✅ PARTE 3: Contexto nutricional OK para parcela %', _parc_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 4: ANÁLISIS DE SUELO DEMO
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _org_id    uuid := '00000000-0000-0000-0000-000000000001';
  _parc_id   uuid;
  _suelo_id  uuid;
BEGIN
  SELECT id INTO _parc_id FROM public.parcelas
  WHERE organization_id = _org_id LIMIT 1;

  INSERT INTO public.nutricion_analisis_suelo (
    organization_id, parcela_id, fecha_analisis, laboratorio, codigo_muestra,
    ph_agua, aluminio_intercambiable, materia_organica_pct,
    p_disponible, k_intercambiable, ca_intercambiable, mg_intercambiable,
    na_intercambiable, cic, saturacion_bases_pct, azufre,
    zinc, boro, manganeso, cobre, hierro,
    relacion_ca_mg, relacion_ca_k, relacion_mg_k, saturacion_al_cic_pct,
    clasificacion_edafica, bloqueos_detectados, necesidad_encalado_kg_ha
  ) VALUES (
    _org_id, _parc_id,
    '2026-02-20', 'Laboratorio Nacional de Suelos', 'LNS-2026-0042',
    5.2, 0.5, 5.8,
    12.0, 0.35, 4.50, 1.20,
    0.08, 18.5, 55.0, 15.0,
    3.5, 0.4, 35.0, 2.5, 120.0,
    3.75, 12.86, 3.43, 7.8,
    'adecuado', '[]'::jsonb, 0
  )
  RETURNING id INTO _suelo_id;

  RAISE NOTICE '✅ PARTE 4: Análisis de suelo OK. ID=%', _suelo_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 5: EJECUTAR MOTOR PARAMÉTRICO §29 (bypass auth)
-- ────────────────────────────────────────────────────────────
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
  SELECT id INTO _parcela_id FROM public.parcelas
  WHERE organization_id = _org_id LIMIT 1;

  IF _parcela_id IS NULL THEN
    RAISE EXCEPTION 'No hay parcela demo.';
  END IF;

  -- Cargar contexto
  SELECT * INTO _ctx FROM public.nutricion_parcela_contexto
  WHERE parcela_id = _parcela_id AND organization_id = _org_id;

  IF _ctx.id IS NULL THEN
    RAISE EXCEPTION 'No hay contexto nutricional.';
  END IF;

  -- Cargar último suelo
  SELECT * INTO _suelo FROM public.nutricion_analisis_suelo
  WHERE parcela_id = _parcela_id AND organization_id = _org_id
  ORDER BY fecha_analisis DESC LIMIT 1;

  _yield := COALESCE(_ctx.rendimiento_proyectado_kg_ha, 1500);

  -- Multiplicador varietal ponderado
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
    ELSIF _ctx.edad_promedio_anios > 7 THEN
      _ajuste_edad := 0.92;
    END IF;
  END IF;

  -- Ajuste por altitud
  IF _ctx.altitud_msnm IS NOT NULL THEN
    IF _ctx.altitud_msnm < 1200 THEN
      _ajuste_alt := 1.05;
      _efic_n := _efic_n - 0.05;
    END IF;
  END IF;

  -- Ajuste por pendiente
  IF _ctx.pendiente_pct IS NOT NULL AND _ctx.pendiente_pct > 30 THEN
    _efic_n := _efic_n - 0.05;
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
      IF _suelo.materia_organica_pct < 3 THEN _ajuste_suelo := _ajuste_suelo * 1.10;
      ELSIF _suelo.materia_organica_pct > 6 THEN _ajuste_suelo := _ajuste_suelo * 0.95;
      END IF;
    END IF;
  ELSE
    _es_heuristico := true;
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

  -- Cálculo de demanda §29
  _dem_n  := (_ext_n  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_n;
  _dem_p  := (_ext_p  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_p;
  _dem_k  := (_ext_k  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / _efic_k;
  _dem_ca := (_ext_ca * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.70;
  _dem_mg := (_ext_mg * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.60;
  _dem_s  := (_ext_s  * (_yield / 1000.0) * _mult_varietal * _ajuste_edad * _ajuste_alt * _ajuste_suelo) / 0.50;

  RAISE NOTICE '--- MOTOR §29 ---';
  RAISE NOTICE 'Yield: % kg/ha | Varietal: % | Edad: % | Alt: % | Suelo: %',
    _yield, ROUND(_mult_varietal,3), _ajuste_edad, _ajuste_alt, _ajuste_suelo;
  RAISE NOTICE 'N: % | P2O5: % | K2O: % | CaO: % | MgO: % | S: %',
    ROUND(_dem_n,1), ROUND(_dem_p,1), ROUND(_dem_k,1),
    ROUND(_dem_ca,1), ROUND(_dem_mg,1), ROUND(_dem_s,1);
  RAISE NOTICE 'Confianza: % | Heurístico: % | Condicionado: %', _confianza, _es_heuristico, _es_condicionado;

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
    '2026-A', _ctx.fecha_floracion_principal,
    'generado', _confianza, _es_heuristico, _es_condicionado,
    ROUND(_dem_n,1), ROUND(_dem_p,1), ROUND(_dem_k,1),
    ROUND(_dem_ca,1), ROUND(_dem_mg,1), ROUND(_dem_s,1),
    _yield, ROUND(_mult_varietal,2),
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

  RAISE NOTICE '✅ PARTE 5: Plan creado ID=%', _plan_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 6: FUNCIÓN v1.1 — FRACCIONAMIENTOS AUTOMÁTICOS
-- ────────────────────────────────────────────────────────────
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
  _num_fracc int := 4;
  _fecha_base date;
  _i int;
  _fase public.fase_fenologica;
  _pct_n numeric; _pct_p numeric; _pct_k numeric;
  _pct_ca numeric; _pct_mg numeric; _pct_s numeric;
  _fecha_prog date;
  _inserted int := 0;
BEGIN
  SELECT * INTO _plan FROM public.nutricion_planes WHERE id = _plan_id;
  IF _plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan no encontrado: %', _plan_id;
  END IF;

  _fecha_base := COALESCE(_plan.fecha_floracion, CURRENT_DATE + INTERVAL '30 days');

  -- Limpiar previos (idempotente)
  DELETE FROM public.nutricion_fraccionamientos WHERE plan_id = _plan_id;

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
      organization_id, plan_id, numero_aplicacion, fase_fenologica,
      fecha_programada, dosis_n, dosis_p2o5, dosis_k2o,
      dosis_cao, dosis_mgo, dosis_s, tipo_aplicacion, notas
    ) VALUES (
      _plan.organization_id, _plan_id, _i, _fase, _fecha_prog,
      ROUND(COALESCE(_plan.demanda_n_kg_ha,0) * _pct_n, 1),
      ROUND(COALESCE(_plan.demanda_p2o5_kg_ha,0) * _pct_p, 1),
      ROUND(COALESCE(_plan.demanda_k2o_kg_ha,0) * _pct_k, 1),
      ROUND(COALESCE(_plan.demanda_cao_kg_ha,0) * _pct_ca, 1),
      ROUND(COALESCE(_plan.demanda_mgo_kg_ha,0) * _pct_mg, 1),
      ROUND(COALESCE(_plan.demanda_s_kg_ha,0) * _pct_s, 1),
      CASE WHEN _plan.es_condicionado AND _i = 1 THEN 'foliar_rescate' ELSE 'edafica' END,
      CASE _i
        WHEN 1 THEN 'Post-floración. Priorizar P y Ca.'
        WHEN 2 THEN 'Expansión rápida. Máxima demanda N y K.'
        WHEN 3 THEN 'Llenado de grano. Incrementar K.'
        WHEN 4 THEN 'Pre-cosecha. Mantenimiento.'
      END
    );
    _inserted := _inserted + 1;
  END LOOP;

  UPDATE public.nutricion_planes
  SET estado = 'generado', updated_at = now()
  WHERE id = _plan_id AND estado = 'borrador';

  RETURN _inserted;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 7: EJECUTAR FRACCIONAMIENTOS PARA PLAN DEMO
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _org_id uuid := '00000000-0000-0000-0000-000000000001';
  _plan_id uuid;
  _count int;
BEGIN
  SELECT id INTO _plan_id FROM public.nutricion_planes
  WHERE organization_id = _org_id
  ORDER BY created_at DESC LIMIT 1;

  IF _plan_id IS NULL THEN
    RAISE EXCEPTION 'No hay plan demo. Parte 5 falló.';
  END IF;

  SELECT public.generar_fraccionamientos_v1(_plan_id) INTO _count;

  RAISE NOTICE '✅ PARTE 7: % fraccionamientos creados para plan %', _count, _plan_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 8: ÍNDICES DE RENDIMIENTO
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nutricion_planes_parcela_created
  ON public.nutricion_planes(parcela_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_fracc
  ON public.nutricion_aplicaciones(fraccionamiento_id);

CREATE INDEX IF NOT EXISTS idx_nutricion_analisis_parcela_fecha
  ON public.nutricion_analisis_suelo(parcela_id, fecha_analisis DESC);

-- ────────────────────────────────────────────────────────────
-- PARTE 9: VERIFICACIÓN FINAL
-- ────────────────────────────────────────────────────────────

-- 9A. Vista resumen con datos demo
SELECT * FROM public.nutricion_parcela_resumen
WHERE organization_id = '00000000-0000-0000-0000-000000000001';

-- 9B. Función v1.1 existe
SELECT proname, pronargs FROM pg_proc WHERE proname = 'generar_fraccionamientos_v1';

-- 9C. Conteo final
SELECT 'contextos' AS tipo, COUNT(*) AS n FROM nutricion_parcela_contexto WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'analisis_suelo', COUNT(*) FROM nutricion_analisis_suelo WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'planes', COUNT(*) FROM nutricion_planes WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'fraccionamientos', COUNT(*) FROM nutricion_fraccionamientos WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'aplicaciones', COUNT(*) FROM nutricion_aplicaciones WHERE organization_id = '00000000-0000-0000-0000-000000000001';
-- Esperado: contextos≥1, analisis≥1, planes≥1, fraccionamientos≥4, aplicaciones=0

-- 9D. RLS activo en todas
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'nutricion_%';

-- 9E. Fraccionamientos detallados
SELECT f.numero_aplicacion, f.fase_fenologica, f.fecha_programada,
       f.dosis_n, f.dosis_p2o5, f.dosis_k2o, f.tipo_aplicacion
FROM nutricion_fraccionamientos f
JOIN nutricion_planes p ON f.plan_id = p.id
WHERE p.organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY f.numero_aplicacion;
```

---

## Resultado esperado

| Verificación | Resultado |
|---|---|
| Parte 1 | `✅ Todas las verificaciones pasaron` |
| Parte 2 | IDs de productor y parcela |
| Parte 3 | Contexto nutricional insertado |
| Parte 4 | Análisis de suelo insertado |
| Parte 5 | Plan con demandas N/P/K/Ca/Mg/S |
| Parte 6 | Función `generar_fraccionamientos_v1` creada |
| Parte 7 | 4 fraccionamientos creados |
| Parte 8 | 3 índices creados |
| Parte 9A | Vista resumen con datos |
| Parte 9C | Conteos correctos |
| Parte 9E | 4 filas con distribución por fase |
