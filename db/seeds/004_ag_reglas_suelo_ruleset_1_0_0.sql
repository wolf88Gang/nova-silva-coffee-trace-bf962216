-- Seed: ag_reglas_suelo (ruleset 1.0.0) - mínimo 40 reglas
-- Idempotente: ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo)
-- umbral_min: -999999 = sin límite inferior
-- Ejecutar: psql -f db/seeds/004_ag_reglas_suelo_ruleset_1_0_0.sql

-- ========== pH ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'pH', '<', -999999, 4.8, 'bloqueo', 'encalado', NULL, 'roja', 'Acidez extrema. Requiere encalado previo.', 'SOIL_PH_CRITICAL_LOW'),
  ('1.0.0', 'pH', 'between', 4.8, 5.2, 'ajuste', 'eficiencia_P', 0.7, 'naranja', 'Alta inmovilización P. Incrementar P soluble.', 'SOIL_PH_LOW_P_FIXATION'),
  ('1.0.0', 'pH', 'between', 5.3, 5.8, 'alerta', NULL, NULL, 'verde', 'Óptimo para café.', 'SOIL_PH_OPTIMAL'),
  ('1.0.0', 'pH', '>', 6.2, NULL, 'alerta', 'Zn_B', NULL, 'amarilla', 'Riesgo deficiencia Zn y B.', 'SOIL_PH_HIGH_MICROS')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Aluminio ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'Al', '>', 1.0, NULL, 'bloqueo', 'encalado', NULL, 'roja', 'Al intercambiable alto. Bloqueo hasta encalado.', 'SOIL_AL_CRITICAL_HIGH'),
  ('1.0.0', 'Al', 'between', 0.5, 1.0, 'alerta', NULL, NULL, 'naranja', 'Alerta técnica. Evaluar encalado.', 'SOIL_AL_WARNING'),
  ('1.0.0', 'Al', '<', -999999, 0.5, 'alerta', NULL, NULL, 'verde', 'Al aceptable.', 'SOIL_AL_ACCEPTABLE')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, severidad = EXCLUDED.severidad,
  mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== CIC ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'CIC', '<', -999999, 10, 'ajuste', 'fraccionamiento', 1.2, 'amarilla', 'Suelo ligero. Fraccionar más.', 'SOIL_CIC_LOW_FRACTION'),
  ('1.0.0', 'CIC', 'between', 10, 20, 'alerta', NULL, NULL, 'verde', 'CIC intermedia.', 'SOIL_CIC_MEDIUM'),
  ('1.0.0', 'CIC', '>', 20, NULL, 'alerta', NULL, NULL, 'verde', 'Alta retención.', 'SOIL_CIC_HIGH')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Materia Orgánica ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'MO', '<', -999999, 3, 'ajuste', 'N', 1.10, 'naranja', 'MO baja. Aumentar N 10%.', 'SOIL_MO_LOW_N_ADJUST'),
  ('1.0.0', 'MO', 'between', 3, 6, 'alerta', NULL, NULL, 'verde', 'MO media. Normal.', 'SOIL_MO_MEDIUM'),
  ('1.0.0', 'MO', '>', 6, NULL, 'ajuste', 'N', 0.95, 'amarilla', 'MO alta. Ajustar N -5%.', 'SOIL_MO_HIGH_N_REDUCE')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Fósforo (Bray II ppm) ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'P', '<', -999999, 10, 'ajuste', 'P2O5', 1.30, 'roja', 'Deficiencia severa P.', 'SOIL_P_CRITICAL_LOW'),
  ('1.0.0', 'P', 'between', 10, 20, 'ajuste', 'P2O5', 1.15, 'naranja', 'Deficiencia P.', 'SOIL_P_LOW'),
  ('1.0.0', 'P', 'between', 20, 40, 'alerta', NULL, NULL, 'verde', 'P adecuado.', 'SOIL_P_ADEQUATE'),
  ('1.0.0', 'P', '>', 40, NULL, 'alerta', 'P2O5', 0, 'amarilla', 'No aplicar P adicional.', 'SOIL_P_HIGH_NO_APPLY')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Potasio (meq/100g) ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'K', '<', -999999, 0.3, 'ajuste', 'K2O', 1.35, 'roja', 'Deficiencia severa K.', 'SOIL_K_CRITICAL_LOW'),
  ('1.0.0', 'K', 'between', 0.3, 0.5, 'ajuste', 'K2O', 1.20, 'naranja', 'Deficiencia K.', 'SOIL_K_LOW'),
  ('1.0.0', 'K', 'between', 0.5, 1.0, 'alerta', NULL, NULL, 'verde', 'K adecuado.', 'SOIL_K_ADEQUATE'),
  ('1.0.0', 'K', '>', 1.0, NULL, 'alerta', 'K2O', 0.9, 'amarilla', 'K alto. Reducir dosis.', 'SOIL_K_HIGH_REDUCE')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Calcio (meq/100g) ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'Ca', '<', -999999, 2.0, 'ajuste', 'CaO', 1.25, 'naranja', 'Deficiencia Ca.', 'SOIL_CA_LOW'),
  ('1.0.0', 'Ca', 'between', 2.0, 5.0, 'alerta', NULL, NULL, 'verde', 'Ca adecuado.', 'SOIL_CA_ADEQUATE'),
  ('1.0.0', 'Ca', '>', 8.0, NULL, 'alerta', 'micronutrientes', NULL, 'amarilla', 'Exceso Ca. Riesgo bloqueo Zn/B.', 'SOIL_CA_HIGH_MICROS')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Magnesio (meq/100g) ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'Mg', '<', -999999, 0.5, 'ajuste', 'MgO', 1.20, 'naranja', 'Deficiencia Mg.', 'SOIL_MG_LOW'),
  ('1.0.0', 'Mg', 'between', 0.5, 2.0, 'alerta', NULL, NULL, 'verde', 'Mg adecuado.', 'SOIL_MG_ADEQUATE'),
  ('1.0.0', 'Mg', '>', 3.0, NULL, 'alerta', NULL, NULL, 'amarilla', 'Exceso Mg. Evaluar compactación.', 'SOIL_MG_HIGH')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Relación Ca:Mg ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'CaMgRatio', '<', -999999, 2.0, 'alerta', 'Ca', NULL, 'naranja', 'Relación Ca:Mg baja. Incrementar Ca.', 'SOIL_CAMG_RATIO_LOW'),
  ('1.0.0', 'CaMgRatio', 'between', 2.0, 8.0, 'alerta', NULL, NULL, 'verde', 'Relación Ca:Mg adecuada.', 'SOIL_CAMG_RATIO_OK'),
  ('1.0.0', 'CaMgRatio', '>', 12.0, NULL, 'alerta', 'Mg', NULL, 'amarilla', 'Exceso Ca sobre Mg.', 'SOIL_CAMG_RATIO_HIGH')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, severidad = EXCLUDED.severidad,
  mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Saturación K (%) ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'KSatPct', '<', -999999, 2.0, 'ajuste', 'K2O', 1.20, 'naranja', 'Saturación K baja.', 'SOIL_KSAT_LOW'),
  ('1.0.0', 'KSatPct', 'between', 2.0, 5.0, 'alerta', NULL, NULL, 'verde', 'Saturación K adecuada.', 'SOIL_KSAT_ADEQUATE'),
  ('1.0.0', 'KSatPct', '>', 8.0, NULL, 'alerta', 'Mg_Ca', NULL, 'amarilla', 'Exceso K. Riesgo antagonismo Mg/Ca.', 'SOIL_KSAT_HIGH_ANTAGONISM')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, accion_valor = EXCLUDED.accion_valor,
  severidad = EXCLUDED.severidad, mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();

-- ========== Saturación de bases (%) ==========
INSERT INTO public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, umbral_max, accion_tipo, accion_objetivo, accion_valor, severidad, mensaje, explain_code) VALUES
  ('1.0.0', 'BaseSatPct', '<', -999999, 40, 'ajuste', 'encalado', NULL, 'naranja', 'Saturación bases baja. Deficiencia Ca/Mg.', 'SOIL_BASESAT_LOW'),
  ('1.0.0', 'BaseSatPct', 'between', 50, 70, 'alerta', NULL, NULL, 'verde', 'Saturación bases ideal café.', 'SOIL_BASESAT_OPTIMAL'),
  ('1.0.0', 'BaseSatPct', '>', 80, NULL, 'alerta', NULL, NULL, 'amarilla', 'Posible desbalance catiónico.', 'SOIL_BASESAT_HIGH')
ON CONFLICT (ruleset_version, variable, operador, umbral_min, accion_tipo) DO UPDATE SET
  umbral_max = EXCLUDED.umbral_max, accion_objetivo = EXCLUDED.accion_objetivo, severidad = EXCLUDED.severidad,
  mensaje = EXCLUDED.mensaje, explain_code = EXCLUDED.explain_code, updated_at = now();
