# ensure-demo-user — Fase 3: Endurecimiento final

## 1. Diagnóstico profiles.user_id UNIQUE

**Script de verificación:** `scripts/diagnose_profiles_user_id.sql`

```sql
SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'profiles'
  AND ccu.column_name = 'user_id';
```

**Si no sale UNIQUE o PRIMARY KEY:** aplicar migración `20250318130000_profiles_user_id_unique.sql`.

**Migración:** Idempotente. Comprueba si ya existe UNIQUE; si hay duplicados, no fuerza la constraint; si no hay duplicados, crea `idx_profiles_user_id_unique`.

---

## 2. Archivos afectados en AuthContext

| Archivo | Cambio |
|---------|--------|
| `src/contexts/AuthContext.tsx` | `getUserProfile`: select `full_name`, `organization_id`, `productor_id` (eliminados `name`, `organization_name`). Mapeo `full_name` → `name`. Si hay `organization_id`, consulta `platform_organizations` para `organizationName`. |

**Fuente real:** `profiles.full_name`, `profiles.organization_id`, `platform_organizations.name` / `display_name`.

---

## 3. Cambios realizados

### Migración
- `supabase/migrations/20250318130000_profiles_user_id_unique.sql` — UNIQUE en `profiles.user_id` si no existe y no hay duplicados, idempotente.

### Script de diagnóstico
- `scripts/diagnose_profiles_user_id.sql` — consulta para verificar constraints.

### AuthContext
- Select de `profiles`: `full_name`, `organization_id`, `productor_id`.
- `organizationName` se obtiene de `platform_organizations` cuando hay `organization_id`.
- Mantiene `User` con `name` y `organizationName` (compatibilidad).

### ensure-demo-user
- Resolución de org: body > profile existente > **DEMO_ORG_ID** (env) > null.
- Respuesta: si no hay org, incluye `message: 'Usuario demo creado sin organización asociada'`.

### Frontend
- `DemoLogin.tsx`, `DemoLoginLayered.tsx`: si `data.message` existe, mostrarlo en toast.

---

## 4. Recomendación final sobre org demo

**Config:** Definir `DEMO_ORG_ID` en Supabase Edge Functions (env) con el UUID de una org demo existente en `platform_organizations`.

**Si no existe:** No se crea org automáticamente. Se muestra el mensaje "Usuario demo creado sin organización asociada". El usuario puede hacer login; el rol se toma de metadata; el acceso a datos por tenant puede quedar limitado.

**Para Lovable:** Crear una org demo en `platform_organizations` (por ejemplo con `is_demo = true`), copiar su UUID y configurarlo como `DEMO_ORG_ID` en Supabase.

---

## 5. Riesgos residuales después de esta fase

1. **profiles sin UNIQUE:** Si la migración no se aplica (ej. por duplicados), el upsert seguirá fallando. Ejecutar `scripts/check_profiles_duplicates.sql` antes de deploy; resolver duplicados manualmente.
2. **DEMO_ORG_ID:** Si no se configura, la org demo seguirá siendo null. Configurar en Supabase Edge Functions si hay entorno demo.
3. **platform_organizations:** Si `profiles.organization_id` no tiene FK a `platform_organizations`, la consulta de org name puede fallar; AuthContext ya maneja el caso null.

---

## 6. Scripts de pre-deploy

| Script | Uso |
|--------|-----|
| `scripts/diagnose_profiles_user_id.sql` | Verificar si existe UNIQUE en user_id |
| `scripts/check_profiles_duplicates.sql` | Listar user_id duplicados; si hay filas → resolver antes de migración |

---

## 7. Debug en ensure-demo-user

La respuesta incluye `debug`:

```json
{
  "debug": {
    "used_demo_org": true,
    "role_assigned": "cooperativa"
  }
}
```

- `used_demo_org`: true si se usó DEMO_ORG_ID (body y profile no tenían org)
- `role_assigned`: rol insertado en user_roles, o null si ya existía
