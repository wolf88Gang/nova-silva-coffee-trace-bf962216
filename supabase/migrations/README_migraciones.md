# Migraciones: Permisos por organizacion

## Orden de ejecucion

```
01_drop_create_functions.sql      -- helpers: get_user_organization_id, is_org_admin, is_admin, update_updated_at_column
02_create_table_indexes_trigger.sql  -- tabla organizacion_usuarios + columnas + indexes + trigger updated_at
03_rls_policies_and_grants.sql    -- RLS: SELECT/INSERT/UPDATE/DELETE + GRANTs
04_hardening_revokes_and_self_protection.sql  -- REVOKE EXECUTE + trigger anti-auto-desactivacion
```

Ejecutar en orden numerico. Cada archivo es idempotente (rerunnable).

## Como aplicar

### Via Supabase SQL Editor
Copiar y pegar cada archivo en orden en el SQL Editor del dashboard de Supabase.

### Via CLI (requiere SUPABASE_ACCESS_TOKEN)
```bash
supabase db push
```

### Via psql directo
```bash
psql $DATABASE_URL -f supabase/migrations/01_drop_create_functions.sql
psql $DATABASE_URL -f supabase/migrations/02_create_table_indexes_trigger.sql
psql $DATABASE_URL -f supabase/migrations/03_rls_policies_and_grants.sql
psql $DATABASE_URL -f supabase/migrations/04_hardening_revokes_and_self_protection.sql
```

## Rollback

### Funciones (si las versiones anteriores eran diferentes)
```sql
-- Solo si necesitas revertir get_user_organization_id:
DROP FUNCTION IF EXISTS public.get_user_organization_id(uuid);
-- Recrear con la definicion anterior (si la tenias documentada)

-- is_org_admin es nueva, drop si necesitas revertir:
DROP FUNCTION IF EXISTS public.is_org_admin(uuid);

-- is_admin NO se toca en esta migracion (no requiere rollback)
```

### Columnas nuevas
```sql
-- Las columnas agregadas (permiso_*, user_name, user_email, rol_interno)
-- se pueden dropear, pero verificar que no haya datos antes:
-- ALTER TABLE public.organizacion_usuarios DROP COLUMN IF EXISTS rol_interno;
-- (repetir para cada columna nueva)
```

### Trigger anti-self
```sql
DROP TRIGGER IF EXISTS trg_self_protection ON public.organizacion_usuarios;
DROP FUNCTION IF EXISTS public.trg_prevent_self_deactivation();
```

## Notas de seguridad

### SECURITY DEFINER + search_path
Todas las funciones SECURITY DEFINER usan `SET search_path = public` para prevenir
ataques de search_path hijacking. Esto significa que la funcion se ejecuta con los
privilegios del owner (normalmente `postgres`) pero solo busca objetos en `public`.

### REVOKE EXECUTE
Las funciones helper (`get_user_organization_id`, `is_org_admin`, `is_admin`) tienen
REVOKE EXECUTE para `anon` y `authenticated`. Esto significa que:
- Los usuarios NO pueden llamar estas funciones directamente via PostgREST/RPC
- Las funciones SI funcionan cuando son invocadas por las politicas RLS (porque RLS
  se ejecuta con los privilegios del owner de la policy, no del usuario)

### is_admin: firma existente
La funcion `is_admin(_user_id uuid)` NO se dropea ni se recrea. Se mantiene la
version existente en la DB. Solo se crea un stub de seguridad si no existe ninguna
version (caso de instalacion limpia).

## Smoke tests

### Verificar funciones
```sql
-- Debe retornar el org_id del usuario actual
SELECT public.get_user_organization_id(auth.uid());

-- Debe retornar true/false
SELECT public.is_org_admin(auth.uid());
SELECT public.is_admin(auth.uid());
```

### Verificar tabla
```sql
-- Debe mostrar todas las columnas del contrato
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'organizacion_usuarios'
ORDER BY ordinal_position;
```

### Verificar RLS
```sql
-- Como usuario autenticado, debe retornar solo registros de su org
SELECT * FROM public.organizacion_usuarios LIMIT 5;

-- Plan de ejecucion debe mostrar la policy aplicada
EXPLAIN SELECT * FROM public.organizacion_usuarios;
```

### Verificar trigger anti-self
```sql
-- Como admin_org, intentar desactivarse a si mismo (debe fallar):
UPDATE public.organizacion_usuarios SET activo = false WHERE user_id = auth.uid();
-- Error esperado: 'no_puedes_deshabilitarte'

-- Intentar quitarse rol admin_org (debe fallar):
UPDATE public.organizacion_usuarios SET rol_interno = 'viewer' WHERE user_id = auth.uid();
-- Error esperado: 'no_puedes_perder_admin_org_de_ti_mismo'

-- Intentar borrarse (debe fallar):
DELETE FROM public.organizacion_usuarios WHERE user_id = auth.uid();
-- Error esperado: 'no_puedes_eliminarte_a_ti_mismo'
```

## Regenerar tipos TypeScript
```bash
supabase gen types typescript --project-id qbwmsarqewxjuwgkdfmg > src/types/supabase.ts
```
