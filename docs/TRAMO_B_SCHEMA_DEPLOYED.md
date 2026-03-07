# Tramo B — Esquema desplegado en Supabase

Este documento describe el esquema efectivamente desplegado (por Supabase AI), que puede diferir del archivo de migración local.

## Cambios respecto a la migración base

### plot_module_snapshot
- **UNIQUE** extendida a `(organization_id, parcela_id, ciclo, version)` para snapshots incrementales
- El frontend usa `version: 1` y `onConflict: 'organization_id,parcela_id,ciclo,version'` en upserts

### disease_assessments
- `disease_pressure_index` — **GENERATED ALWAYS AS** (fórmula ponderada) **STORED**
- `pressure_level` — **GENERATED ALWAYS AS** (baja/moderada/alta/severa) **STORED**
- Trigger `calc_disease_factor` mantiene `disease_factor` en rango [0.5, 1.0]
- **No insertar** `disease_pressure_index` ni `disease_factor` desde el frontend

### resilience_assessments
- `resilience_index` — **GENERATED ALWAYS AS** (ponderado) **STORED**
- `resilience_level` — **GENERATED ALWAYS AS** (fragil/baja/moderada/alta) **STORED**
- **No insertar** `resilience_index` ni `resilience_level` desde el frontend

### RPCs disponibles
- `get_latest_snapshot(parcela_id, ciclo)` — snapshot más reciente
- `get_latest_disease_assessment(parcela_id, ciclo)`
- `get_latest_resilience_assessment(parcela_id, ciclo)`
- `get_cohort_learning(org_id, variedad, altitud_rango)`
- `calc_yield_adjusted(yield_est, nutrient_f, disease_f, water_f)`

### Vista
- `v_parcelas_riesgo_alto` — parcelas con doble riesgo (presión fitosanitaria + resiliencia baja)
