# ag_fertilizers – Política condicional por entorno (opcional)

Para habilitar lectura `anon` solo en staging. Tres opciones listas para usar.

---

## Opción A: Claim JWT `env` (condicional por token)

Permite SELECT a `anon` solo si el JWT trae `env='staging'`. Útil si servís contenido público con un token controlado.

**Requisitos:**
- Incluir el claim `env` en el JWT (p. ej. en `app_metadata.env` o como claim plano).
- `anon` por defecto no lleva JWT; aplica si usás un token público con claims.

**Limitación:** Sin JWT no aplica; peticiones puramente anónimas (sin token) no cumplirán la condición.

```sql
-- Política adicional para anon SOLO cuando env='staging'
CREATE POLICY "ag_fertilizers_read_staging" ON public.ag_fertilizers
  FOR SELECT TO anon
  USING (
    COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb->>'env'),
      (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'env')
    ) = 'staging'
  );
```

---

## Opción B: RPC + variable de sesión (SECURITY DEFINER)

Expone un endpoint SQL/HTTP controlado. Si `app.env='staging'`, deja pasar sin auth; en producción exige `auth.uid()`.

```sql
-- Función pública que respeta app.env
CREATE OR REPLACE FUNCTION public.get_fertilizers_public()
RETURNS SETOF public.ag_fertilizers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF current_setting('app.env', true) = 'staging' THEN
    RETURN QUERY SELECT * FROM public.ag_fertilizers;
  ELSE
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
    RETURN QUERY SELECT * FROM public.ag_fertilizers;
  END IF;
END;
$$;

-- Restringir EXECUTE y otorgar solo lo necesario
REVOKE ALL ON FUNCTION public.get_fertilizers_public() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_fertilizers_public() TO anon, authenticated;
```

**Uso:**
- Para habilitar modo staging por sesión: `SELECT set_config('app.env', 'staging', true);`
- HTTP (Edge Function o middleware) puede setear `app.env` antes de llamar a la RPC.

**Notas:** `SECURITY DEFINER` — asegurate que el owner tenga permisos y el cuerpo sea minimalista. Controlá quién puede ejecutar con GRANT/REVOKE.

---

## Opción C: Proyecto separado (recomendada)

Un proyecto Supabase para staging con políticas más abiertas. El más simple y seguro: sin condicionales ni riesgos en producción.

---

## Migración opcional

Ver `supabase/migrations/20250304190000_ag_fertilizers_staging_policy_optional.sql` — política A comentada, lista para descomentar y ejecutar cuando corresponda.
