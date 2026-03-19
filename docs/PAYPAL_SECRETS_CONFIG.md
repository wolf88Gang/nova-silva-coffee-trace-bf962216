# Configuración de secrets PayPal en Supabase

## Nombres exactos que espera el checker

Configura estos secrets en **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**:

| Secret | Obligatorio | Ejemplo (Sandbox) |
|--------|-------------|-------------------|
| `PAYPAL_CLIENT_ID` | Sí | Tu Client ID |
| `PAYPAL_CLIENT_SECRET` | Sí | Tu Client Secret |
| `PAYPAL_MODE` | Sí | `sandbox` o `live` |
| `PAYPAL_API_BASE` | Sí | `https://api-m.sandbox.paypal.com` (sandbox) o `https://api-m.paypal.com` (live) |
| `PAYPAL_WEBHOOK_ID` | No | ID del webhook si usas verificación |

## Por CLI

```bash
supabase secrets set PAYPAL_CLIENT_ID="tu-client-id"
supabase secrets set PAYPAL_CLIENT_SECRET="tu-client-secret"
supabase secrets set PAYPAL_MODE="sandbox"
supabase secrets set PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"
# Opcional:
supabase secrets set PAYPAL_WEBHOOK_ID="tu-webhook-id"
```

## Verificar

```bash
curl -s "https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/paypal-secrets-checker" \
  -H "Authorization: Bearer TU_ANON_KEY"
```

Todos los flags deben ser `true` (excepto `webhook_id_present` si no lo configuraste).
