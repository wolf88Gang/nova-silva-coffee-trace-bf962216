-- Seed: ag_fertilizers (fertilizantes comerciales para café)
-- Ejecutar en Supabase SQL Editor o: psql -f db/seeds/006_ag_fertilizers.sql
-- Requiere: tabla ag_fertilizers creada por SUPABASE_AI_PROMPT_TRAMO_A
-- Idempotente: solo inserta si la tabla está vacía o el nombre no existe.

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
