# PayPal Webhook — Setup y pruebas

Edge Function `paypal-webhook` para recibir eventos PayPal.

## Variables y secrets

| Variable | Requerido | Descripción |
|----------|-----------|-------------|
| `PAYPAL_WEBHOOK_ID` | Opcional | ID del webhook en PayPal. Si está configurado, se valida la firma. Sin él, se aceptan eventos sin verificación (solo desarrollo). |
| `PAYPAL_CLIENT_ID` | Sí (si WEBHOOK_ID) | Para OAuth en verify-webhook-signature |
| `PAYPAL_CLIENT_SECRET` | Sí (si WEBHOOK_ID) | Para OAuth |
| `PAYPAL_MODE` | Opcional | `sandbox` (default) o `live` |
| `PAYPAL_API_BASE` | Opcional | Override de la URL base de la API |

## URL del webhook

```
https://<project-ref>.supabase.co/functions/v1/paypal-webhook
```

Configurar esta URL en [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/) → App → Webhooks → Add Webhook.

## Eventos soportados

Se registran todos los eventos. Se extrae `provider_order_id` cuando aplica:

| Evento | provider_order_id | Actualización status |
|--------|-------------------|----------------------|
| `PAYMENT.CAPTURE.COMPLETED` | `resource.supplementary_data.related_ids.order_id` | — (no se setea completed desde webhook) |
| `PAYMENT.CAPTURE.DECLINED` | `related_ids.order_id` | `declined` |
| `PAYMENT.CAPTURE.REFUNDED` | `related_ids.order_id` | `refunded` |
| `PAYMENT.CAPTURE.REVERSED` | `related_ids.order_id` | `reversed` |
| `CHECKOUT.ORDER.APPROVED` | `resource.id` | `approved` |
| Otros con `resource.id` | si existe | — |

**No se hace desde webhook:** insert en `payments`, marcar invoice `paid`. El status `completed` solo lo setea el flujo capture del proxy.

## Tabla `payment_webhook_events`

| Campo | Descripción |
|-------|-------------|
| provider | `paypal` |
| event_type | Ej. `PAYMENT.CAPTURE.COMPLETED` |
| provider_event_id | ID del evento en PayPal |
| provider_order_id | Order ID si se puede extraer |
| raw_payload | Payload completo (jsonb) |
| processing_status | `received` \| `verified` \| `verification_failed` |
| notes | Mensaje de error o nota |

## Trazabilidad en `payment_intents`

Si el evento está verificado y hay `provider_order_id` que coincide con un `payment_intent`:

- `metadata.last_webhook_event_id`
- `metadata.last_webhook_event_type`
- `metadata.last_webhook_at`
- `metadata.paypal_resource_status` (status del resource PayPal, ej. COMPLETED)
- `status` (solo para transiciones seguras: approved, declined, refunded, reversed; nunca se setea completed desde webhook)

## Cómo probar en sandbox

### 1. Sin verificación (desarrollo local)

Dejar `PAYPAL_WEBHOOK_ID` vacío. Los eventos se aceptan y se guardan con `processing_status=received`.

### 2. Con verificación (sandbox real)

1. Crear webhook en [PayPal Developer](https://developer.paypal.com/dashboard/applications/) con la URL de la función.
2. Copiar el Webhook ID.
3. Configurar `PAYPAL_WEBHOOK_ID` en Supabase Secrets.
4. Ejecutar un pago de prueba; PayPal enviará eventos reales.

### 3. Simulador de webhooks

[Webhooks simulator](https://developer.paypal.com/api/rest/webhooks/simulator/) envía eventos mock. **Nota:** la verificación postback no funciona con eventos mock; se guardarán con `verification_failed`. Para el simulador, usar `PAYPAL_WEBHOOK_ID=WEBHOOK_ID` (literal) o dejar vacío.

### 4. Probar con ngrok (local)

```bash
ngrok http 54321
supabase functions serve paypal-webhook
# URL: https://<ngrok-id>.ngrok.io (configurar en PayPal)
```

## Riesgos residuales

- Eventos mock del simulador no pasan verificación postback.
- Sin `PAYPAL_WEBHOOK_ID`, cualquier POST a la URL puede insertar registros (solo en desarrollo).
- La tabla es solo lectura para admin.
- No se inserta en `payments` ni se marca invoice paid desde webhook; eso sigue vía flujo capture del proxy.
