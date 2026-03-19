# Política de permisos: paypal-proxy

Edge Function que proxea llamadas a la API de PayPal. Controla quién puede crear órdenes, capturar y consultar.

## Requisitos base

- Usuario autenticado con `session.access_token` (no anon key)
- Admin: `is_admin()` = true (role admin o superadmin en user_roles)
- Usuario normal: `organization_id` en profiles (get_user_organization_id)

## Tabla de permisos

| Acción | Admin | Usuario con org |
|--------|-------|-----------------|
| **CREATE (invoice)** | Cualquier invoice de cualquier org | Solo invoices de su org |
| **CREATE (sandbox)** | Payload libre (sin persistir si no hay org) | Payload libre |
| **GET (order)** | Cualquier orderId | Solo orders de payment_intents de su org |
| **CAPTURE (order)** | Cualquier orderId | Solo orders de payment_intents de su org |

## Detalle por flujo

### CREATE con invoiceId

- Admin: puede crear orden PayPal para cualquier factura. El `payment_intent` se persiste con `organization_id = invoice.organization_id`.
- Usuario: solo si `invoice.organization_id === user.organization_id`. 403 si no.

### CREATE sin invoiceId (sandbox)

- Usuario con org: payload libre, `payment_intent` con su org.
- Admin sin org: payload libre, no persiste `payment_intent` (no hay org).

### GET / CAPTURE

- Lookup de `payment_intents` por `provider_order_id`:
  - Admin: sin filtrar por org (encuentra cualquier orden).
  - Usuario: filtrado por `organization_id = user.organization_id`.
- Update de `payment_intents`: siempre por `organization_id` del registro existente (evita que admin actualice con org equivocada).
- `register_paypal_invoice_payment`: usa `COALESCE(p_organization_id, v_invoice_org)` para el payment.

## Quién puede capturar

Quien creó la orden puede capturarla (mismo usuario, misma sesión). Admin que creó orden para invoice de org X puede capturar; el `payment_intent` tiene `organization_id` de la invoice, y el lookup admin no filtra por org.

## Quién puede consultar

Misma lógica que capture: admin ve todo; usuario solo órdenes de su org.

## No hay bypass accidental

- Todas las comprobaciones usan `is_admin()` vía RPC (no claim ni header).
- Usuario sin org no puede crear órdenes de invoice (403).
- Usuario no puede crear orden para invoice de otra org (403).
- Usuario no puede get/capture órdenes de otra org (no las encuentra en el lookup).

## Riesgos residuales

- Admin con org: si tiene `organization_id` en profiles, el comportamiento es el mismo; `is_admin` tiene prioridad en los bypass.
- Sandbox vs live: la política aplica igual; el modo se controla por `PAYPAL_MODE`.
