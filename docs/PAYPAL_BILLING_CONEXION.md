# Conexión payment_intents → Billing (futuro)

## Estado actual

- `payment_intents` tiene contexto comercial: `intent_type`, `reference_type`, `reference_id`, `description`
- Sandbox usa: `intent_type=sandbox_test`, `reference_type=none`, `description='PayPal sandbox test'`
- Billing engine no tocado

## Cómo conectar a billing real

### 1. Plan checkout (cambio de plan)

- Caller envía: `intent_type=sandbox_test`, `reference_type=org_billing_settings`, `reference_id=<org_billing_settings.id>`, `description='Plan Smart mensual'`
- El proxy persiste con ese contexto
- Al capturar: crear/actualizar `payment_intents` y luego (fuera del proxy) actualizar `org_billing_settings` o crear registro en billing

### 2. Addon checkout

- `intent_type=addon_checkout`, `reference_type=org_billing_settings` o crear `org_billing_addons` si aplica
- `reference_id` = id de la entidad relevante

### 3. Pago de factura (implementado)

- Frontend: `/paypal-invoice` — seleccionar invoice, crear orden con `invoiceId`
- Proxy: valida invoice, usa monto real, crea orden con `intent_type=invoice_payment`
- Al capturar: RPC `register_paypal_invoice_payment` inserta en `payments`, trigger marca invoice paid si cubre total

### 4. Extensión del proxy

El proxy ya acepta `body.intent_type`, `body.reference_type`, `body.reference_id`, `body.description`. El caller (frontend o backend) debe enviarlos:

```typescript
await supabase.functions.invoke('paypal-proxy', {
  body: {
    action: 'create',
    payload: { intent: 'CAPTURE', purchase_units: [...] },
    intent_type: 'invoice_payment',
    reference_type: 'invoice',
    reference_id: invoiceId,
    description: 'Factura NS-202503-000001',
  },
});
```

### 5. No implementado aún

- Lógica post-capture para actualizar `payments`, `invoices`, `org_billing_settings`
- Webhooks PayPal
- Validación de que `reference_id` existe y pertenece a la org
