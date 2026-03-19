# Checklist: activar invoice payment PayPal en live

Preparación mínima para pasar de sandbox a live de forma controlada.

## 1. Qué cambia entre sandbox y live

| Aspecto | Sandbox | Live |
|----------|---------|------|
| **API base** | `https://api-m.sandbox.paypal.com` | `https://api-m.paypal.com` |
| **PAYPAL_CLIENT_ID** | Credenciales app sandbox | Credenciales app live |
| **PAYPAL_CLIENT_SECRET** | Credenciales app sandbox | Credenciales app live |
| **PAYPAL_WEBHOOK_ID** | ID webhook sandbox | ID webhook live (distinto) |
| **Return/Cancel URLs** | Mismo dominio; PayPal sandbox redirige | Mismo dominio; PayPal live redirige |
| **Dominio** | Cualquiera (dev) | Dominio producción en allowlist PayPal |

El proxy y el webhook ya soportan live: usan `PAYPAL_MODE` y `PAYPAL_API_BASE` para elegir la API. No hace falta cambiar código.

## 2. Variables necesarias para live

| Variable | Valor live |
|----------|------------|
| `PAYPAL_MODE` | `live` |
| `PAYPAL_API_BASE` | `https://api-m.paypal.com` |
| `PAYPAL_CLIENT_ID` | Client ID de la app **live** en [PayPal Developer](https://developer.paypal.com/dashboard/applications/) |
| `PAYPAL_CLIENT_SECRET` | Client Secret de la app **live** |
| `PAYPAL_WEBHOOK_ID` | ID del webhook configurado en la app **live** |

## 3. Checklist para activar live

### Antes de cambiar secrets

- [ ] App live creada en [PayPal Developer](https://developer.paypal.com/dashboard/applications/)
- [ ] App live en modo **Live** (no Sandbox)
- [ ] Dominio de producción verificado en PayPal (si aplica)

### Return / Cancel URLs en PayPal

- [ ] En la app live: **App Settings** → **Return URLs** → añadir:
  - `https://<tu-dominio-produccion>/paypal-sandbox/return`
  - `https://<tu-dominio-produccion>/admin/billing` (cancel desde InvoiceDetailSheet)
  - `https://<tu-dominio-produccion>/paypal-invoice` (cancel desde PayPalInvoicePaymentPage)

### Webhook live

- [ ] En la app live: **Webhooks** → **Add Webhook**
- [ ] URL: `https://<project-ref>.supabase.co/functions/v1/paypal-webhook`
- [ ] Eventos mínimos: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.DECLINED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`
- [ ] Copiar el **Webhook ID** generado

### Secrets en Supabase (producción)

```bash
supabase secrets set PAYPAL_MODE="live"
supabase secrets set PAYPAL_API_BASE="https://api-m.paypal.com"
supabase secrets set PAYPAL_CLIENT_ID="<live-client-id>"
supabase secrets set PAYPAL_CLIENT_SECRET="<live-client-secret>"
supabase secrets set PAYPAL_WEBHOOK_ID="<live-webhook-id>"
```

- [ ] Secrets actualizados en el proyecto de **producción**
- [ ] Redeploy de Edge Functions si hace falta (los secrets se leen en runtime)

### Verificación post-activación

- [ ] Probar OAuth: `paypal-secrets-checker` debe indicar modo live
- [ ] Crear orden de prueba con monto bajo (ej. $1)
- [ ] Completar flujo: aprobar en PayPal live → return → capture
- [ ] Verificar: `payment_intents` con status `completed`, `payments` con método `paypal`, invoice `paid` si aplica

## 4. Riesgos que bloquean live

| Riesgo | Estado |
|--------|--------|
| Credenciales live mal configuradas | Mitigación: checklist y prueba con monto bajo |
| Return URL no permitida en PayPal | Mitigación: añadir dominio producción en PayPal |
| Webhook sin verificación | Mitigación: configurar `PAYPAL_WEBHOOK_ID` live |

Ninguno bloquea de forma absoluta si se sigue el checklist.

## 5. Riesgos aceptables para piloto pagado

| Riesgo | Mitigación |
|--------|------------|
| **Race en doble capture** | Si dos requests de capture llegan casi a la vez, podrían insertar dos payments. Probabilidad baja; el frontend deshabilita el botón tras capturar. |
| **Ruta `/paypal-sandbox/return` en live** | Nombre confuso pero funcional. Opcional: renombrar a `/paypal/return` en una fase posterior. |
| **Sin idempotencia en RPC** | `register_paypal_invoice_payment` no comprueba duplicados por `provider_order_id`. El proxy evita doble llamada con `captured_payment_id`. |
| **Webhook live sin pruebas previas** | Los eventos live son reales. Probar primero con sandbox; en live, revisar `payment_webhook_events` tras el primer pago. |

## 6. Endurecimiento mínimo antes de live

### Doble capture / doble payment

- **Actual**: El proxy solo llama a `register_paypal_invoice_payment` si `!existingMeta.captured_payment_id`.
- **Riesgo**: Dos requests concurrentes podrían leer antes del update y ambos llamar al RPC.
- **Recomendación**: Para piloto, aceptable. Para producción estable, añadir constraint `UNIQUE (invoice_id, reference)` en `payments` o comprobar en el RPC antes de insertar.

### Webhook live

- **Actual**: Verificación de firma si `PAYPAL_WEBHOOK_ID` está configurado.
- **Recomendación**: Configurar siempre `PAYPAL_WEBHOOK_ID` en live.

### Errores operativos

- **Actual**: Errores de PayPal se devuelven al cliente; no hay retry automático.
- **Recomendación**: Revisar logs de Edge Functions tras el primer pago live.

## 7. Recomendación final

**Go para piloto pagado** si:

1. Se completa el checklist.
2. Se hace una prueba con monto bajo ($1–5) en live.
3. Se revisa `payment_intents`, `payments` e `invoices` tras la prueba.
4. Se monitorea el primer puñado de pagos reales.

**No-go** si:

- No hay app live configurada en PayPal.
- El dominio de producción no está en las Return URLs de PayPal.
- No se puede hacer una prueba controlada antes de pagos reales.
