# Prompt: Supabase SQL Editor – Migraciones comerciales

Ejecutá estos bloques **en orden** en el SQL Editor de tu proyecto Supabase (Dashboard → SQL Editor → New query).

---

## Paso 0: Verificar tablas base (opcional)

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'lotes_comerciales', 'lotes_acopio', 'contratos', 'organizations',
  'profiles', 'user_roles'
)
ORDER BY table_name;
```

Si faltan `lotes_comerciales` o `lotes_acopio`, las migraciones siguientes fallarán. En ese caso, creá primero esas tablas o sincronizá el esquema con Lovable.

---

## Paso 1: reclamos_postventa y comparacion_muestras

Copiá y ejecutá todo el contenido de:

`supabase/migrations/20250304140000_create_reclamos_and_comparacion_muestras.sql`

---

## Paso 2: clientes, ofertas, lotes exportación

Copiá y ejecutá todo el contenido de:

`supabase/migrations/20250304150000_create_ofertas_clientes_lotes_exportacion.sql`

---

## Paso 3: RPC get_ranking_cooperativas

Copiá y ejecutá todo el contenido de:

`supabase/migrations/20250304160000_create_get_ranking_cooperativas.sql`

---

## Paso 4: Verificación final

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'reclamos_postventa', 'comparacion_muestras',
  'clientes_compradores', 'ofertas_comerciales', 'ofertas_lotes',
  'lotes_comerciales_lotes_acopio', 'lotes_exportacion'
)
ORDER BY table_name;
```

Deberías ver las 7 tablas listadas.

---

## Si algo falla

- **"relation lotes_comerciales does not exist"**: Creá primero la tabla `lotes_comerciales` o sincronizá el esquema desde Lovable.
- **"function get_user_organization_id does not exist"**: Ejecutá antes la migración que crea esa función (p. ej. `20250226120000_add_get_user_organization_id.sql`).
- **"function is_admin does not exist"**: Ejecutá antes la migración que crea `is_admin()` (p. ej. `20250225110001_organization_id_refactor.sql`).
