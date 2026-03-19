# Integración de proveedor externo — Arquitectura segura

## Reglas

- No usar Lovable Cloud
- No exponer secrets en frontend
- API key solo en Supabase Secrets
- Frontend llama únicamente a la Edge Function

---

## 1. Dónde configurar la API key en Supabase

1. Entra a **Supabase Dashboard** → tu proyecto
2. **Project Settings** (ícono engranaje) → **Edge Functions**
3. Sección **Secrets**
4. Añade:

| Nombre | Valor | Obligatorio |
|--------|-------|-------------|
| `EXTERNAL_PROVIDER_API_KEY` | Tu API key real | Sí |
| `EXTERNAL_PROVIDER_ACCOUNT_ID` | Account ID (si el proveedor lo requiere) | No |
| `EXTERNAL_PROVIDER_BASE_URL` | URL base del API (ej. `https://api.proveedor.com`) | Sí* |

\* Si no se define, la función usa `https://api.example.com` como placeholder. Debes configurarlo con la URL real.

---

## 2. Nombres de variables de entorno

| Variable | Uso |
|----------|-----|
| `EXTERNAL_PROVIDER_API_KEY` | API key del proveedor (secreto) |
| `EXTERNAL_PROVIDER_ACCOUNT_ID` | Account ID (config, no tan sensible) |
| `EXTERNAL_PROVIDER_BASE_URL` | URL base del API |

---

## 3. Archivos que llaman la función

| Archivo | Rol |
|---------|-----|
| `supabase/functions/external-provider-proxy/index.ts` | Edge Function que usa los secrets y llama al proveedor |
| Frontend (cuando lo integres) | `supabase.functions.invoke('external-provider-proxy', { body: {...} })` |

---

## 4. Cómo probar end-to-end

### A. Configurar secrets

```bash
supabase secrets set EXTERNAL_PROVIDER_API_KEY="tu-api-key-aqui"
supabase secrets set EXTERNAL_PROVIDER_BASE_URL="https://api.proveedor.com"
# Opcional:
supabase secrets set EXTERNAL_PROVIDER_ACCOUNT_ID="tu-account-id"
```

O desde el Dashboard: Project Settings → Edge Functions → Secrets.

### B. Desplegar la función

```bash
supabase functions deploy external-provider-proxy
```

### C. Probar con curl

```bash
curl -X POST "https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/external-provider-proxy" \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "/v1/tu-endpoint", "method": "GET"}'
```

(Proyecto: `qbwmsarqewxjuwgkdfmg`)

### D. Desde el frontend

```typescript
const { data, error } = await supabase.functions.invoke('external-provider-proxy', {
  body: {
    endpoint: '/v1/tu-endpoint',
    method: 'GET',
    payload: { /* si aplica */ },
  },
})
```

---

## 5. Seguridad

- La API key **nunca** se envía al cliente
- La API key **nunca** aparece en logs (no la imprimas)
- Solo la Edge Function tiene acceso a `Deno.env.get('EXTERNAL_PROVIDER_API_KEY')`
- El frontend solo recibe la respuesta del proveedor (o errores genéricos)

---

## 6. Próximos pasos

Cuando tengas la documentación del proveedor (endpoints, auth, parámetros):

1. Ajusta `external-provider-proxy/index.ts` con la lógica real del proveedor
2. Reemplaza el proxy genérico por llamadas concretas (evita exponer endpoints arbitrarios)
3. Renombra las variables si el proveedor usa otros nombres
4. Crea un service/hook en el frontend que llame a la función
5. No pongas la key en `.env` del frontend ni en el código

---

## 7. Pasar info del proveedor

**No compartas la API key en el chat.** Comparte solo:

- Nombre del proveedor
- Formato de autenticación (Bearer, X-API-Key, header custom, etc.)
- Endpoints que necesitas llamar
- Si requiere account_id u otros parámetros

Con eso se adapta la Edge Function a tu caso.
