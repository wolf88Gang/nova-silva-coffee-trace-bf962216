-- Migration: Índices adicionales para nutrición + seed ag_fertilizers
-- Opcional: mejora consultas por parcela_id, plan_id, temporada.

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_nutrition_outcomes_parcela ON public.nutrition_outcomes (parcela_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_outcomes_temporada ON public.nutrition_outcomes (organization_id, temporada) WHERE temporada IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nutrition_adjustments_plan ON public.nutrition_adjustments (plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_harvest_results_temporada ON public.harvest_results (organization_id, temporada);
CREATE INDEX IF NOT EXISTS idx_yield_estimates_parcela ON public.yield_estimates (parcela_id);

-- Seed ag_fertilizers (solo si tabla vacía)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ag_fertilizers')
     AND (SELECT COUNT(*) FROM public.ag_fertilizers) = 0 THEN
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
