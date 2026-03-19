# ensure-demo-user — Diagnóstico (Fase 1)

## 1. Código inspeccionado

### Edge Function: `supabase/functions/ensure-demo-user/index.ts`

**Flujo actual:**
1. Recibe POST con `{ role }` (cooperativa, exportador, certificadora, productor, tecnico)
2. Crea usuario en Auth con `auth.admin.createUser` (o signIn si ya existe)
3. Upsert en `profiles`: `user_id`, `name`, `organization_name`
4. Upsert en `user_roles`: `user_id`, `role` con `onConflict: 'user_id'`
5. Responde `{ ok: true, email, role }`

**CORS:** OPTIONS responde `ok`; respuestas incluyen `corsHeaders`. Correcto.

**Token:** La función NO valida Authorization. Usa SERVICE_ROLE para todo. Invocación anónima (pre-login) es esperada.

---

### Frontend: invocación

| Archivo | Invocación |
|---------|------------|
| `src/pages/DemoLogin.tsx` | `supabase.functions.invoke('ensure-demo-user', { body: { role: demoRole.role } })` |
| `src/pages/demo/DemoSetupWizard.tsx` | `supabase.functions.invoke('ensure-demo-user', { body: { role: legacyRole } })` |
| `src/pages/DemoLoginLayered.tsx` | `supabase.functions.invoke('ensure-demo-user', { body: { role: legacyRole } })` |

- Usa `supabase.functions.invoke` (correcto)
- No envía Authorization explícito (no hay sesión; anon key se usa automáticamente)
- No verifica `ensureError` antes de intentar login (DemoLogin ignora el error y sigue)
- DemoSetupWizard y DemoLoginLayered no validan respuesta de la función antes de signIn

---

## 2. Esquema real vs función

### profiles

**Esquema real (migraciones):**
- `user_id` (PK o UNIQUE)
- `organization_id` (uuid → platform_organizations)
- `full_name` (20250318000000)
- `email`, `is_active`, `last_login_at`, `updated_at`, `created_at`

**Función usa:**
- `name` → **NO EXISTE**; el esquema usa `full_name`
- `organization_name` → **NO EXISTE**; el esquema usa `organization_id`

**Consecuencia:** El upsert en profiles falla o escribe en columnas inexistentes. Si `name` y `organization_name` no existen, Postgres devuelve error tipo "column does not exist".

---

### user_roles

**Esquema real (20250318000000):**
```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL,
  organization_id uuid,
  created_at timestamptz
);
-- Índices: idx_user_roles_user_id, idx_user_roles_role, idx_user_roles_org
-- NO hay UNIQUE(user_id)
```

**Función usa:**
- `upsert(..., { onConflict: 'user_id' })`

**Consecuencia:** `onConflict: 'user_id'` requiere UNIQUE o PRIMARY KEY en `user_id`. No existe. Error: `"there is no unique or exclusion constraint matching the ON CONFLICT specification"`.

---

### platform_organizations

La función **no crea ni vincula** organizaciones. Escribe `organization_name` en profiles (columna inexistente). Para que `organization_id` tenga sentido, habría que crear o resolver orgs demo en `platform_organizations` y asignar su `id` a `profiles.organization_id`.

---

## 3. Roles

**Función usa:** cooperativa, exportador, certificadora, productor, tecnico

**app_role enum (20250318000000):** admin, superadmin, cooperativa_admin, cooperativa_staff, exportador_admin, exportador_staff, certificadora, tecnico, auditor, viewer

`user_roles.role` es `text`, no usa el enum. Los valores legacy (cooperativa, productor, etc.) son válidos como texto. El frontend y rutas los usan. No es la causa del fallo.

---

## 4. Tablas ns_*

La función **no usa** `ns_user_roles` ni tablas `ns_*`. Usa `profiles` y `user_roles` reales.

---

## 5. Diagnóstico resumido

### Causa principal

1. **profiles:** columnas incorrectas  
   - Usa `name` → debe ser `full_name`  
   - Usa `organization_name` → debe ser `organization_id` (uuid de platform_organizations)

2. **user_roles:** `onConflict: 'user_id'` inválido  
   - No hay UNIQUE(user_id)  
   - El upsert falla con error de constraint

### Causas secundarias

3. **organization_id:** La función no crea ni resuelve orgs en `platform_organizations`. Sin orgs demo, no se puede asignar `organization_id` correctamente. Opciones: crear orgs demo en la función o usar `organization_id` nulo si el flujo lo permite.

4. **Frontend:** DemoLogin ignora `ensureError` y continúa con signIn. Si la función falla, el usuario no existe y el login falla con un mensaje genérico. El error real queda oculto.

5. **Interpretación CORS:** Errores 500 o de DB pueden mostrarse como fallos de red. Si la respuesta no incluye CORS en el error, el navegador puede bloquearla y parecer CORS.

---

## 6. Archivos afectados

| Archivo | Problema |
|---------|----------|
| `supabase/functions/ensure-demo-user/index.ts` | Columnas profiles incorrectas; upsert user_roles con onConflict inválido; falta resolver organization_id |
| `src/pages/DemoLogin.tsx` | No valida ensureError; mensaje genérico en fallo |
| `src/pages/demo/DemoSetupWizard.tsx` | No valida respuesta de ensure-demo-user |
| `src/pages/DemoLoginLayered.tsx` | No valida respuesta de ensure-demo-user |

---

## 7. Orden de fallo esperado

1. Upsert en `profiles` con `name` y `organization_name` → error si esas columnas no existen.
2. Si profiles pasara (p. ej. columnas legacy), upsert en `user_roles` con `onConflict: 'user_id'` → error por falta de constraint.

El fallo más probable es en el upsert de `user_roles` por el `onConflict` inválido.
