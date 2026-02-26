# External Supabase Guarantee

## Configuración

Nova Silva usa un Supabase **externo** (no Lovable Cloud):

- **URL**: `https://qbwmsarqewxjuwgkdfmg.supabase.co`
- **Cliente único**: `src/integrations/supabase/client.ts`
- **No se usan variables de entorno** — URL y anon key están hardcodeadas

## Protecciones

### 1. Cliente único centralizado
Solo existe UN `createClient()` en todo el repo: `src/integrations/supabase/client.ts`.
Todos los componentes importan `supabase` desde ahí.

### 2. Runtime assertion (dev only)
`src/lib/assertSupabaseHost.ts` — se ejecuta al arrancar la app en dev.
Verifica que `supabase.supabaseUrl` apunta al host externo esperado.
Si no coincide, lanza `Error` y bloquea la app.

### 3. Audit script
`scripts/audit-supabase-host.ts` — escanea código fuente buscando:
- Cualquier referencia a `supabase.co` que NO sea el host externo
- Cualquier `createClient()` fuera de `client.ts`

Ejecutar: `npx tsx scripts/audit-supabase-host.ts`

### 4. Sin Lovable Cloud
- No usar conector "Lovable Cloud Supabase"
- No activar toggle de "database connection" automático
- Edge Functions se invocan con `fetch()` hardcodeado, nunca `supabase.functions.invoke()`

## Verificación

1. Network tab: todas las requests a `qbwmsarqewxjuwgkdfmg.supabase.co`
2. Console (dev): mensaje `[assertSupabaseHost] ✓`
3. Audit script: `npx tsx scripts/audit-supabase-host.ts` → 0 issues
