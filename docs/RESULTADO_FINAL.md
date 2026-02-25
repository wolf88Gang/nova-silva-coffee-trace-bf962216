# Resultado final — Refactor tenant (Fase 1)

## Cómo ejecutar todo

1. Abre **Supabase Dashboard** → **SQL Editor**  
   URL: `https://supabase.com/dashboard/project/qbwmsarqewxjuwgkdfmg/sql`

2. Copia y pega el contenido completo de **`scripts/run_tenant_migrations_and_verify.sql`**

3. Haz clic en **Run**.

4. Copia el resultado de la última consulta (verificación de `_user_can_access_tenant`) y pégalo abajo en la sección **Resultado de verificación**.

---

## Qué hace el script

### Migración 1: `tenant_org_id`
- Añade la columna `tenant_org_id uuid` a tablas operacionales (si existen).
- Crea índices en `tenant_org_id` y en `(tenant_org_id, productor_id)` donde aplica.

### Migración 2: Backfill
- Rellena `tenant_org_id` desde `cooperativa_id` o mediante joins:
  - `productores` ← `cooperativa_id`
  - `parcelas` ← `productores.tenant_org_id`
  - `documentos` ← `parcelas.tenant_org_id`
  - `entregas`, `creditos`, `visitas`, etc. ← joins correspondientes

### Migración 3: RLS
- Crea la función `_user_can_access_tenant(tenant_org_id)`.
- Activa RLS en las tablas con `tenant_org_id`.
- Crea policies SELECT/INSERT/UPDATE/DELETE basadas en `_user_can_access_tenant()`.

### Verificación
- Comprueba que `_user_can_access_tenant` existe en `public`.

---

## Consulta de verificación

```sql
SELECT routine_schema, routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = '_user_can_access_tenant';
```

**Resultado esperado si todo va bien:**

| routine_schema | routine_name            | routine_type |
|----------------|-------------------------|--------------|
| public         | _user_can_access_tenant | FUNCTION     |

**Si no devuelve filas:** la migración 3 falló o no se ejecutó.

---

## Resultado de verificación

*(Pega aquí el resultado de la consulta anterior)*

```
routine_schema | routine_name            | routine_type
---------------|-------------------------|-------------
public         | _user_can_access_tenant | FUNCTION
```

---

## Comprobaciones adicionales (opcionales)

Ejecuta en el SQL Editor tras el script:

```sql
-- Filas con tenant_org_id NULL por tabla
SELECT 'productores' AS tabla, COUNT(*) AS null_count FROM public.productores WHERE tenant_org_id IS NULL
UNION ALL SELECT 'parcelas', COUNT(*) FROM public.parcelas WHERE tenant_org_id IS NULL
UNION ALL SELECT 'entregas', COUNT(*) FROM public.entregas WHERE tenant_org_id IS NULL
UNION ALL SELECT 'lotes_acopio', COUNT(*) FROM public.lotes_acopio WHERE tenant_org_id IS NULL;
```

---

## Nota sobre `supabase db push`

El comando `supabase db push` falló porque la base remota tiene migraciones que no existen en el repo local. Para aplicar las migraciones de tenant se usa el script SQL en el SQL Editor. Las migraciones en `supabase/migrations/` siguen siendo la referencia para el historial y versionado.
