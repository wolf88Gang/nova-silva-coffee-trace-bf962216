-- Seed: ag_parametros_altitud (zonas altitudinales)
-- Idempotente: INSERT ... ON CONFLICT (zona) DO UPDATE
-- Ejecutar: psql -f db/seeds/002_ag_parametros_altitud.sql

INSERT INTO public.ag_parametros_altitud (
  zona,
  rango_min_msnm,
  rango_max_msnm,
  shift_dias
) VALUES
  ('baja', 0, 1200, 0),
  ('media', 1200, 1500, 7),
  ('alta', 1500, 3500, 14)
ON CONFLICT (zona) DO UPDATE SET
  rango_min_msnm = EXCLUDED.rango_min_msnm,
  rango_max_msnm = EXCLUDED.rango_max_msnm,
  shift_dias = EXCLUDED.shift_dias,
  updated_at = now();
