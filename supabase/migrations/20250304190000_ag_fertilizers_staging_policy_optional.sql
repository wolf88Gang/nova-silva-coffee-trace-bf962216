-- Migration OPCIONAL: Política condicional para staging (anon cuando env='staging')
-- NO ejecutar por defecto. Descomentar y ejecutar solo si necesitás Opción A.
-- Requiere: JWT con claim env en app_metadata o plano.

/*
-- Política adicional para anon SOLO cuando env='staging'
CREATE POLICY "ag_fertilizers_read_staging" ON public.ag_fertilizers
  FOR SELECT TO anon
  USING (
    COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb->>'env'),
      (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'env')
    ) = 'staging'
  );
*/
