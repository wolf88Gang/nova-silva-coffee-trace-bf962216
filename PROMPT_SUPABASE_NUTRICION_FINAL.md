# Prompt Supabase – Pasos finales de nutrición

Resumen de lo que ya está hecho y lo que podés ejecutar para cerrar el módulo.

---

## Ya implementado (confirmado)

- **Índice de idempotencia:** `idx_nutricion_planes_idempotency` en `(parcela_id, idempotency_key)` — ya existe en la migración `20250304110000`.
- **ag_fertilizers RLS:** Lectura solo `authenticated`; escritura bloqueada para roles públicos. Migración: `20250304180000_ag_fertilizers_rls_authenticated_only.sql`.
  - Staging: para habilitar `anon` en staging, usar política condicional por JWT claim (ej. `env='staging'`) o proyecto Supabase separado.
- **Catálogos:** `ag_nutrients`, `ag_fertilizers`
- **Tablas transaccionales:** `harvest_results`, `yield_estimates`, `nutrition_outcomes`, `nutrition_adjustments`
- **Funciones:** `calc_nutrient_demand`, `calc_full_nutrient_demand`, `coeficientes`
- **RLS:** políticas con `get_user_organization_id()` e `is_admin()`
- **Backfill reclamos_postventa:** `organization_id` desde `lotes_comerciales`

---

## Opcional: índices + seed fertilizantes

Ejecutá en el SQL Editor el contenido de:

`supabase/migrations/20250304170000_nutrition_indexes_and_fertilizer_seed.sql`

O copiá y pegá:

```sql
-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_nutrition_outcomes_parcela ON public.nutrition_outcomes (parcela_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_outcomes_temporada ON public.nutrition_outcomes (organization_id, temporada) WHERE temporada IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nutrition_adjustments_plan ON public.nutrition_adjustments (plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_harvest_results_temporada ON public.harvest_results (organization_id, temporada);
CREATE INDEX IF NOT EXISTS idx_yield_estimates_parcela ON public.yield_estimates (parcela_id);

-- Seed ag_fertilizers (solo si tabla vacía)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.ag_fertilizers) = 0 THEN
    INSERT INTO public.ag_fertilizers (nombre, formula, n_pct, p2o5_pct, k2o_pct, costo_usd_kg) VALUES
      ('Fertilizante completo 18-6-12', '18-6-12', 18, 6, 12, 0.45),
      ('Fertilizante completo 20-5-15', '20-5-15', 20, 5, 15, 0.52),
      ('Fertilizante completo 15-5-20', '15-5-20', 15, 5, 20, 0.48),
      ('Urea 46%', '46-0-0', 46, 0, 0, 0.35),
      ('Superfosfato triple', '0-46-0', 0, 46, 0, 0.42),
      ('Cloruro de potasio', '0-0-60', 0, 0, 60, 0.28),
      ('Sulfato de potasio', '0-0-50', 0, 0, 50, 0.55),
      ('Cal dolomita', 'CaO+MgO', 0, 0, 0, 0.08),
      ('Sulfato de magnesio', 'MgO', 0, 0, 0, 0.25),
      ('Bórax', 'B', 0, 0, 0, 1.20);
  END IF;
END $$;
```

---

## Verificación de reclamos_postventa

Para revisar el backfill de `organization_id`:

```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE organization_id IS NULL) AS sin_org,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) AS con_org
FROM public.reclamos_postventa;
```

---

## Respuesta sugerida para Supabase/Cursor

> **Índice de idempotencia:** Ya existe en `nutricion_planes` (parcela_id, idempotency_key).
>
> **Catálogo de fertilizantes:** Sí, cargá el seed de `006_ag_fertilizers.sql` o el bloque de la migración `20250304170000`. Incluye 10 productos (18-6-12, 20-5-15, urea, superfosfato, KCl, etc.) con costos estimados en USD/kg.
>
> **Políticas por rol:** Por ahora no. Las políticas actuales (organization_id + is_admin) son suficientes. Si más adelante necesitás restricciones por rol (ej. solo técnico puede aprobar), se pueden agregar.
>
> **Vistas/materializadas:** Opcional. Si querés reportes de nutrición y rendimiento, se puede crear una vista `v_nutrition_summary` que una `nutrition_outcomes`, `yield_estimates` y `harvest_results` por parcela/temporada.
