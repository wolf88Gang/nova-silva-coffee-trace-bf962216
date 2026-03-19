# PayPal Proxy — Edge Function

## Auth y restricciones de negocio

- **verify_jwt = true**: La función exige `Authorization: Bearer <jwt>`.
- **Solo acepta usuario autenticado real**: `session.access_token` de un usuario logueado.
- **No acepta anon key**: Las llamadas con `Bearer <ANON_KEY>` devuelven 401.
- **Requiere organization_id en profiles**: El usuario debe tener `profiles.organization_id` asignado (vía `get_user_organization_id`).

### Quién puede usar el proxy

- Usuario autenticado con sesión válida **y** `profiles.organization_id` no nulo.
- Usuarios que completaron onboarding o conversión demo (tienen org asignada).

### Quién no puede

- Usuario anónimo o sin sesión → 401.
- Usuario autenticado sin `organization_id` en profiles → 403.
- Llamadas con anon key → 401.

### Error si falta organization_id

```json
{
  "ok": false,
  "error": "Forbidden",
  "details": "User has no organization. Complete your profile or onboarding to use PayPal."
}
```

HTTP 403.

### Flujo demo

Los usuarios demo deben tener `organization_id` asignado en profiles. La función `ensure-demo-user` puede usar `DEMO_ORG_ID` para asignar org a usuarios demo. Si los usuarios demo no tienen `organization_id`, recibirán 403; completar onboarding o conversión demo para asignar la org.

## Endpoints permitidos (whitelist)

| action | Método PayPal | Descripción |
|--------|---------------|-------------|
| `create` | POST /v2/checkout/orders | Crear orden |
| `capture` | POST /v2/checkout/orders/{id}/capture | Capturar pago |
| `get` | GET /v2/checkout/orders/{id} | Obtener orden |

El frontend **no** envía `method` ni `path`; el mapeo es interno y fijo.

## Secrets requeridos

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` (`sandbox` o `live`)
- `PAYPAL_API_BASE` (opcional; si no se define, se infiere de `PAYPAL_MODE`)

## Desplegar

```bash
supabase functions deploy paypal-proxy
```

---

## Uso real recomendado (frontend autenticado)

El cliente Supabase envía automáticamente el `access_token` de la sesión cuando el usuario está logueado. **Solo invocar cuando haya sesión activa.**

### Servicio (recomendado)

```typescript
import { createPayPalOrder, capturePayPalOrder, getPayPalOrder } from '@/services/paypalProxyService'

// Solo llamar cuando el usuario está autenticado (session !== null)
// supabase.functions.invoke() usa automáticamente session.access_token

const createResult = await createPayPalOrder({
  intent: 'CAPTURE',
  purchase_units: [{
    amount: { currency_code: 'USD', value: '10.00' },
    description: 'Demo Nova Silva',
  }],
})
if (!createResult.ok) throw new Error(createResult.details ?? createResult.error)
const orderId = (createResult.data as { id?: string })?.id

const captureResult = await capturePayPalOrder(orderId!)
const getResult = await getPayPalOrder(orderId!)
```

### Llamada directa

```typescript
import { supabase } from '@/integrations/supabase/client'

// Requiere sesión activa. Si no hay sesión, la función devuelve 401.
const { data, error } = await supabase.functions.invoke('paypal-proxy', {
  body: { action: 'create', payload: { intent: 'CAPTURE', purchase_units: [...] } },
})
```

### Guard recomendado en componentes

```typescript
const { session, user } = useAuth() // o useSupabaseClient + session
if (!session) {
  // Redirigir a login o mostrar mensaje
  return
}
if (!user?.organizationId) {
  // Completar onboarding o perfil antes de usar PayPal
  return
}
await createPayPalOrder(...)
```

---

## Prueba técnica rápida (curl con access token)

Para probar sin UI, necesitas un **access token de usuario autenticado**, no la anon key.

### 1. Obtener access token

**Opción A — Desde la app:** Loguéate, abre DevTools → Application → Local Storage (o Session Storage) y busca la sesión de Supabase, o usa `supabase.auth.getSession()` en consola.

**Opción B — API de auth:**

```bash
curl -X POST "https://qbwmsarqewxjuwgkdfmg.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu-password"}'
```

Extraer `access_token` de la respuesta.

### 2. Crear orden

```bash
curl -X POST "https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/paypal-proxy" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_DE_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{"action":"create","payload":{"intent":"CAPTURE","purchase_units":[{"amount":{"currency_code":"USD","value":"10.00"},"description":"Test Sandbox"}]}}'
```

**Respuesta esperada:** `{ "ok": true, "data": { "id": "5O190127TN364715T", ... } }`

### 3. Capturar y obtener orden

```bash
# Capturar
curl -X POST "https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/paypal-proxy" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_DE_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{"action":"capture","orderId":"ORDER_ID"}'

# Obtener
curl -X POST "https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/paypal-proxy" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_DE_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{"action":"get","orderId":"ORDER_ID"}'
```

### Nota

- **No usar** `Bearer <ANON_KEY>` — la función rechaza anon key y devuelve 401.
- Si recibes `401 Unauthorized` con `details: "Requires authenticated user. Use session.access_token, not anon key."`, estás usando anon key en lugar del token de sesión.

---

## Configurar secrets (antes de desplegar)

```bash
supabase secrets set PAYPAL_CLIENT_ID="tu-client-id"
supabase secrets set PAYPAL_CLIENT_SECRET="tu-client-secret"
supabase secrets set PAYPAL_MODE="sandbox"
supabase secrets set PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"
```

---

## Errores

- `401`: Sin Authorization, token inválido o anon key (requiere usuario autenticado)
- `403`: Usuario sin `organization_id` en profiles (completar perfil/onboarding)
- `400`: JSON inválido, action inválido, orderId faltante
- `502`: Error de PayPal (detalles en `details`, sin exponer secrets)
- `503`: Auth fallida PayPal (revisar secrets)
- `504`: Timeout

## Extensión futura: validación por rol

Para restringir por rol (ej. solo admin o cooperativa_admin), puede añadirse:

```typescript
// Obtener rol: supabase.rpc('get_user_profile_role', { p_user_id: user.id })
// O verificar rol específico: supabase.rpc('has_role', { p_user_id: user.id, p_role: 'cooperativa_admin' })
// Si existe is_admin(): permitir admins sin org como excepción
```

Por ahora la restricción mínima es `organization_id` válido.

## Restricciones

- No webhooks en esta fase
- No suscripciones
- No billing complejo
- Secrets solo en Supabase

---

## Flujo mínimo frontend (PayPal Sandbox)

Vista de prueba técnica en `/paypal-sandbox`. No integrado en el producto principal.

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/paypal-sandbox` | Crear orden y redirigir a PayPal |
| `/paypal-sandbox/return` | Retorno tras aprobar; consultar/capturar |

### Flujo E2E en sandbox

1. **Login**: Usuario autenticado con `organization_id` (ej. demo.cooperativa@novasilva.com).
2. **Ir a** `https://tu-dominio.com/paypal-sandbox`.
3. **Crear orden**: Clic en "Crear orden PayPal" → se crea orden de $10 USD → redirección a PayPal sandbox.
4. **Aprobar o cancelar**:
   - Aprobar: PayPal redirige a `/paypal-sandbox/return?token=ORDER_ID`.
   - Cancelar: PayPal redirige a `/paypal-sandbox?paypal_cancelled=1` → se muestra "El pago fue cancelado antes de completarse."
5. **Retorno (aprobado)**: Resumen (Order ID, Status, Amount, Currency, Captured) + botones Consultar/Capturar.
6. **Capturar**: Si la orden ya está capturada, el botón se deshabilita y se muestra "Esta orden ya fue capturada."

### Mensajes de error (UX)

| Código | Mensaje mostrado |
|--------|------------------|
| 401 | Sesión inválida o expirada. Iniciá sesión de nuevo. |
| 403 | Tu perfil no tiene organización asignada. Completá el onboarding para usar PayPal. |
| PayPal/red | Detalle del error en `details` o mensaje de red |

### Archivos

- `src/pages/paypal/PayPalSandboxPage.tsx` — Crear orden, redirección, lista de intentos
- `src/pages/paypal/PayPalSandboxReturnPage.tsx` — Retorno, consultar, capturar
- `src/services/paypalProxyService.ts` — Servicio (create, capture, get)
- `src/repositories/paymentIntentsRepository.ts` — Lectura de payment_intents
- `src/services/paymentIntentsService.ts` — Servicio de trazabilidad
- `src/hooks/usePaymentIntents.ts` — Hook para listar intentos

### Trazabilidad (payment_intents)

El proxy persiste cada create/get/capture en la tabla `payment_intents`:
- **create**: insert con order_id, amount, currency, status=created, intent_type, reference_type, reference_id, description
- **get**: update status si existe registro
- **capture**: update status=completed

**Contexto comercial** (extensión mínima):
- `intent_type`: sandbox_test | plan_checkout | addon_checkout | invoice_payment
- `reference_type`: invoice | org_billing_settings | manual | none
- `reference_id`: uuid de invoice o org_billing_settings
- `description`: etiqueta humana

Para sandbox: `intent_type=sandbox_test`, `reference_type=none`, `description='PayPal sandbox test'`.

Para conectar a billing: el caller puede pasar en body `intent_type`, `reference_type`, `reference_id`, `description`.

---

## Pago de factura (invoice payment)

### Flujo

1. Ir a `/paypal-invoice`
2. Seleccionar factura (issued, overdue o draft)
3. Clic "Pagar con PayPal"
4. Crear orden (proxy valida invoice, usa monto real)
5. Redirigir a PayPal
6. Aprobar → retorno a `/paypal-sandbox/return?token=X`
7. Capturar → proxy inserta en `payments`, marca invoice paid si cubre total

### Validaciones backend

- Invoice existe
- Invoice.organization_id = usuario.organization_id
- Invoice no paid, no void
- Monto desde invoice, no desde frontend

### RPC

`register_paypal_invoice_payment(invoice_id, amount, currency, provider_order_id, org_id, user_id)` — inserta en payments, llama `mark_invoice_paid_if_fully_covered`.
