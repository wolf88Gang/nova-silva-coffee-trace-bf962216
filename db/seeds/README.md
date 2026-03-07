# Seeds del Módulo de Nutrición Paramétrica

Scripts idempotentes para cargar catálogos base. Ejecutar **después** de aplicar la migración `20250304100000_create_ag_nutrition_catalog_tables.sql`.

## Orden de ejecución

```bash
# 1. Aplicar migración (si no está aplicada)
supabase db push
# o
psql $DATABASE_URL -f supabase/migrations/20250304100000_create_ag_nutrition_catalog_tables.sql

# 2. Cargar seeds en orden
psql $DATABASE_URL -f db/seeds/001_ag_variedades.sql
psql $DATABASE_URL -f db/seeds/002_ag_parametros_altitud.sql
psql $DATABASE_URL -f db/seeds/003_ag_parametros_fenologicos.sql
psql $DATABASE_URL -f db/seeds/004_ag_reglas_suelo_ruleset_1_0_0.sql
psql $DATABASE_URL -f db/seeds/005_ag_ruleset_versions.sql
```

## Script unificado (Linux/Mac)

```bash
for f in db/seeds/00*.sql; do psql $DATABASE_URL -f "$f"; done
```

## Contenido

| Archivo | Contenido |
|---------|-----------|
| 001_ag_variedades.sql | 30 variedades (Caturra, Castillo, Geisha, etc.) |
| 002_ag_parametros_altitud.sql | 3 zonas (baja/media/alta) con shift de días |
| 003_ag_parametros_fenologicos.sql | 12 fases (4 por zona) con proporción de dosis |
| 004_ag_reglas_suelo_ruleset_1_0_0.sql | 40 reglas (pH, Al, CIC, MO, P, K, Ca, Mg, CaMgRatio, KSatPct, BaseSatPct) |
| 005_ag_ruleset_versions.sql | Registro ruleset 1.0.0 |

Todos los scripts usan `ON CONFLICT DO UPDATE` para idempotencia.
