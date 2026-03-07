-- Seed: ag_ruleset_versions (registro de versiones de reglas)
-- Idempotente: INSERT ... ON CONFLICT (version) DO UPDATE
-- Ejecutar: psql -f db/seeds/005_ag_ruleset_versions.sql

INSERT INTO public.ag_ruleset_versions (
  version,
  descripcion,
  fecha_activacion,
  activo
) VALUES
  ('1.0.0', 'Ruleset inicial v1: reglas edáficas, variedades, fenología, altitud. Banco de conocimiento Fase 1.', '2025-03-04', true)
ON CONFLICT (version) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  fecha_activacion = EXCLUDED.fecha_activacion,
  activo = EXCLUDED.activo,
  updated_at = now();
