-- Seed: ag_parametros_fenologicos (por zona: baja, media, alta)
-- Idempotente: INSERT ... ON CONFLICT (zona, fase) DO UPDATE
-- Ejecutar: psql -f db/seeds/003_ag_parametros_fenologicos.sql

-- Zona baja (ciclo 6-7 meses)
INSERT INTO public.ag_parametros_fenologicos (
  zona, fase, dias_post_floracion_min, dias_post_floracion_max, nutrientes_dominantes, proporcion_dosis_pct
) VALUES
  ('baja', 'cabeza_alfiler', 0, 45, ARRAY['N','P','Ca'], 15),
  ('baja', 'expansion_rapida', 45, 100, ARRAY['N','K'], 35),
  ('baja', 'llenado_grano', 100, 150, ARRAY['K','N'], 35),
  ('baja', 'maduracion', 150, 220, ARRAY['K','Mg','B'], 15)
ON CONFLICT (zona, fase) DO UPDATE SET
  dias_post_floracion_min = EXCLUDED.dias_post_floracion_min,
  dias_post_floracion_max = EXCLUDED.dias_post_floracion_max,
  nutrientes_dominantes = EXCLUDED.nutrientes_dominantes,
  proporcion_dosis_pct = EXCLUDED.proporcion_dosis_pct,
  updated_at = now();

-- Zona media (ciclo 8 meses)
INSERT INTO public.ag_parametros_fenologicos (
  zona, fase, dias_post_floracion_min, dias_post_floracion_max, nutrientes_dominantes, proporcion_dosis_pct
) VALUES
  ('media', 'cabeza_alfiler', 0, 55, ARRAY['N','P','Ca'], 15),
  ('media', 'expansion_rapida', 55, 120, ARRAY['N','K'], 35),
  ('media', 'llenado_grano', 120, 180, ARRAY['K','N'], 35),
  ('media', 'maduracion', 180, 250, ARRAY['K','Mg','B'], 15)
ON CONFLICT (zona, fase) DO UPDATE SET
  dias_post_floracion_min = EXCLUDED.dias_post_floracion_min,
  dias_post_floracion_max = EXCLUDED.dias_post_floracion_max,
  nutrientes_dominantes = EXCLUDED.nutrientes_dominantes,
  proporcion_dosis_pct = EXCLUDED.proporcion_dosis_pct,
  updated_at = now();

-- Zona alta (ciclo 9-10 meses)
INSERT INTO public.ag_parametros_fenologicos (
  zona, fase, dias_post_floracion_min, dias_post_floracion_max, nutrientes_dominantes, proporcion_dosis_pct
) VALUES
  ('alta', 'cabeza_alfiler', 0, 65, ARRAY['N','P','Ca'], 15),
  ('alta', 'expansion_rapida', 65, 140, ARRAY['N','K'], 35),
  ('alta', 'llenado_grano', 140, 200, ARRAY['K','N'], 35),
  ('alta', 'maduracion', 200, 280, ARRAY['K','Mg','B'], 15)
ON CONFLICT (zona, fase) DO UPDATE SET
  dias_post_floracion_min = EXCLUDED.dias_post_floracion_min,
  dias_post_floracion_max = EXCLUDED.dias_post_floracion_max,
  nutrientes_dominantes = EXCLUDED.nutrientes_dominantes,
  proporcion_dosis_pct = EXCLUDED.proporcion_dosis_pct,
  updated_at = now();
