# PayPal Proxy — Auditoría y endurecimiento

## 1. Diagnóstico

### OAuth2
- **Resolución**: `getAccessToken(apiBase)` usa `client_credentials` con Basic auth (`btoa(clientId:clientSecret)`).
- **Endpoint**: `POST {apiBase}/v1/oauth2/token` con `grant_type=client_credentials`.
- **Reintentos**: hasta 2 intentos en fallo.

### Base URL
- **Resolución**: `getApiBase()` → `PAYPAL_API_BASE` si existe; si no, infiere de `PAYPAL_MODE` (sandbox → `https://api-m.sandbox.paypal.com`, live → `https://api-m.paypal.com`).

### Whitelist
- **Implementación**: `ALLOWED_ROUTES` fijo. Solo `create`, `capture`, `get`.
- **Mapping interno** (no configurable desde frontend):
  - `create` → POST /v2/checkout/orders
  - `capture` → POST /v2/checkout/orders/{id}/capture
  - `get` → GET /v2/checkout/orders/{id}

### ¿Se puede saltar la whitelist?
- **No**. El frontend solo envía `action` (string). El `method` y `path` vienen de `ALLOWED_ROUTES[action]`. No se aceptan `method` ni `path` desde el body.

### ¿Rutas o métodos arbitrarios?
- **No**. El path se construye solo desde `ALLOWED_ROUTES`. El `orderId` se valida con regex para evitar path traversal.

### Errores
- **Antes**: En 500 se devolvía `details: msg` (podía filtrar info interna).
- **Después**: 500 devuelve solo `{ ok: false, error: 'Internal error' }`.

### Logs
- **No** hay `console.log` ni impresión de payloads sensibles.

---

## 2. Cambios realizados

| Cambio | Archivo |
|--------|---------|
| Validación `orderId` con regex (evitar path traversal) | paypal-proxy/index.ts |
| Validación `payload` para create (debe ser objeto) | paypal-proxy/index.ts |
| 500 sin detalles internos | paypal-proxy/index.ts |
| `verify_jwt = true` en config | config.toml |
| **Requerir usuario autenticado** (rechazar anon key) | paypal-proxy/index.ts |
| **Requerir organization_id en profiles** (403 si falta) | paypal-proxy/index.ts |
| Documentación actualizada | PAYPAL_PROXY.md |

---

## 3. Auth de la función (endurecido por contexto de negocio)

### Estado actual
- **verify_jwt = true** (config.toml).
- El caller debe enviar `Authorization: Bearer <jwt>`.
- **Solo acepta access token de usuario autenticado**.
- **No acepta anon key**: `supabase.auth.getUser()` devuelve `null` con anon key → 401.
- **Requiere organization_id**: `get_user_organization_id(user.id)` debe retornar UUID válido; si no → 403.

### Implementación
1. Obtener `Authorization` header.
2. Crear cliente Supabase con ese header.
3. `supabase.auth.getUser()` — si no hay user, devolver 401.
4. `supabase.rpc('get_user_organization_id', { p_user_id: user.id })` — si null, devolver 403.
5. Continuar solo si user y orgId existen.

### Decisión
- **Objetivo**: No permitir uso indiscriminado; solo usuarios con organización asignada.
- **Patrón**: Igual que `approve_nutrition_plan_v1` (user + org).
- **Demo**: Usuarios demo deben tener `organization_id` en profiles (ensure-demo-user con DEMO_ORG_ID, o convert-demo-to-org). Sin bypass oculto.

---

## 4. Ejemplo correcto de request

### Desde frontend (usuario autenticado)
El cliente de Supabase añade automáticamente `session.access_token` cuando hay sesión:

```typescript
// Solo invocar cuando session !== null
const { data, error } = await supabase.functions.invoke('paypal-proxy', {
  body: { action: 'create', payload: { intent: 'CAPTURE', purchase_units: [...] } },
})
```

### Desde curl (access token de usuario)
Obtener token vía login (auth API o app). **No usar anon key**:

```bash
# 1. Login para obtener access_token
curl -X POST "https://...supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"..."}'

# 2. Usar access_token en paypal-proxy
curl -X POST "https://...supabase.co/functions/v1/paypal-proxy" \
  -H "Authorization: Bearer ACCESS_TOKEN_DE_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{"action":"create","payload":{"intent":"CAPTURE","purchase_units":[...]}}'
```

---

## 5. Riesgos residuales

1. **Access token robado**: Si un atacante obtiene el access token de un usuario, puede crear/capturar órdenes hasta que expire. Mitigación: tokens de corta duración, refresh automático.
2. **orderId regex**: Acepta `[A-Za-z0-9_-]{10,50}`. Si PayPal usa otros formatos, ajustar.
3. **Payload create**: Se reenvía a PayPal sin validación estructural. PayPal valida; el riesgo es enviar payloads malformados que generen errores.
4. **Sin restricción por rol**: Cualquier usuario con org puede usar el proxy. Opcional: añadir check de rol (get_user_profile_role, has_role, is_admin) si se requiere restricción adicional.
5. **Demo sin org**: Usuarios demo sin `organization_id` reciben 403. Asegurar que ensure-demo-user o convert-demo-to-org asigne org correctamente.
