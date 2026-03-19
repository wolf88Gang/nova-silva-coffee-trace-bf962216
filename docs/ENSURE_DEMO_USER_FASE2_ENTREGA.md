# ensure-demo-user — Fase 2: Entrega final

## 1. Resumen de cambios

### Edge Function `ensure-demo-user`

| Antes | Después |
|-------|---------|
| profiles: `name`, `organization_name` | profiles: `full_name`, `email`, `organization_id`, `is_active` |
| user_roles: `upsert(..., onConflict: 'user_id')` | user_roles: SELECT existente → si no hay, INSERT (sin duplicar) |
| Sin validar `body.organization_id` | Valida que exista en `platform_organizations` si viene |
| Sin resolver `organization_id` | Resolución: body > profile existente > null |
| Sin rol si no hay org | Si no hay `organization_id` válido: no inserta en user_roles |
| Respuestas genéricas | JSON con `ok`, `error`, `details`, `user_id`, `organization_id` |
| CORS en 200 y 500 | CORS en OPTIONS, 200, 4xx, 5xx (helper `jsonResponse`) |

### Frontend

| Archivo | Cambio |
|---------|--------|
| `DemoLogin.tsx` | Si `ensureError` o `data?.ok === false`: toast con mensaje y return; no continúa a signIn |
| `DemoSetupWizard.tsx` | Idem; si falla, navega a `/demo-v2` con `state: { error: msg }` |
| `DemoLoginLayered.tsx` | Idem; useEffect muestra toast si llega con `state.error` desde wizard |

---

## 2. Código final de `ensure-demo-user`

Ver `supabase/functions/ensure-demo-user/index.ts`.

Flujo:
1. Parsea body: `role`, `organization_id` (opcional)
2. Valida role ∈ [cooperativa, exportador, certificadora, productor, tecnico]
3. Si `organization_id` viene: valida que exista en `platform_organizations`
4. Crea usuario Auth (o signIn si ya existe)
5. Resuelve `organization_id`: body > profile existente > null
6. Upsert profiles: `full_name`, `email`, `organization_id`, `is_active`
7. Si hay `organization_id`: consulta user_roles; si no existe fila, INSERT rol
8. Responde `{ ok, email, role, user_id, organization_id }`

---

## 3. Rol usado

**Rol:** El mismo que viene en `body.role` (cooperativa, exportador, certificadora, productor, tecnico).

**Motivo:** Son los roles legacy que usa el frontend para rutas y redirección. El esquema `user_roles.role` es `text`; no se usa el enum `app_role`. Se mantienen estos valores para compatibilidad con el flujo demo.

**Cuándo se inserta:** Solo si existe `organization_id` válido. Si no hay org, no se inserta fila en user_roles.

---

## 4. Si no hay `organization_id` válido

- Se hace upsert de profiles con `organization_id: null`
- No se inserta en `user_roles`
- El usuario puede hacer login (Auth funciona)
- El AuthContext puede no resolver rol desde user_roles; usará `user_metadata.role` como fallback
- La app puede mostrar "Sin organización" o comportamiento limitado según el código actual

---

## 5. Manejo de error por pantalla

| Pantalla | Comportamiento |
|----------|----------------|
| **DemoLogin** | Si ensure-demo-user falla: toast con `details` o `error`, no intenta signIn |
| **DemoSetupWizard** | Si falla: navega a `/demo-v2` con `state: { error: msg }`; el usuario ve el wizard fallar y redirigir |
| **DemoLoginLayered** | Si ensure-demo-user falla: toast y no signIn; si llega desde wizard con `state.error`: toast al montar |

---

## 6. Headers CORS

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Content-Type: application/json
```

En todas las respuestas (OPTIONS, 200, 4xx, 5xx) vía helper `jsonResponse`.

---

## 7. Invocación frontend

- Sigue usando `supabase.functions.invoke('ensure-demo-user', { body: { role } })`
- No se envía token explícito (flujo pre-login, anon key)
- Se valida `ensureError` y `data?.ok === false` antes de continuar
- Mensajes de error usan `data?.details` o `error.message`

---

## 8. Riesgos residuales

1. **profiles.onConflict: 'user_id'**  
   Si `profiles` no tiene UNIQUE en `user_id`, el upsert fallará. Se asume que existe (como en convert-demo-to-org).

2. **AuthContext y `organization_name`**  
   El AuthContext selecciona `organization_name` de profiles; la función ya no la escribe. Si profiles no tiene esa columna, no hay cambio. Si la tiene y antes se rellenaba, ahora quedará null. El AuthContext tiene fallbacks.

3. **Demo sin org**  
   Usuarios demo sin `organization_id` tendrán rol solo en metadata; el acceso a datos por org puede verse limitado según RLS.

4. **Organizaciones demo**  
   No se crean orgs en `platform_organizations`. Si no existen orgs demo previas, todos los usuarios demo tendrán `organization_id: null` y no se insertará rol en user_roles.
