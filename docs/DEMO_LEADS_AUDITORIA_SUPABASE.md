# Demo Leads — Auditoría Supabase (sin Lovable Cloud)

## 1. Diagnóstico

### Migración `20250318140000_demo_leads.sql`
- **Tabla**: `public.demo_leads` en schema `public` del proyecto
- **RLS**: INSERT público, SELECT/UPDATE solo `public.is_admin()`
- **Funciones**: Usa `public.is_admin()` definida en `20250318000000_admin_panel_enums_and_orgs.sql`
- **Lovable**: Ninguna referencia

### Repository `demoLeadsRepository.ts`
- **Import**: `supabase` desde `@/integrations/supabase/client`
- **Operación**: `supabase.from('demo_leads').insert(...).select(...).single()`
- **Cliente**: `createClient` de `@supabase/supabase-js` (estándar)
- **Lovable**: Ninguna referencia

### Service `demoLeadsService.ts`
- **Import**: `insertLeadInDb` desde repository
- **Lógica**: Orquesta repository, devuelve `{ ok, id }` o `{ ok: false, error }`
- **Lovable**: Ninguna referencia

### Integración
| Componente | Llama a | Vía |
|------------|---------|-----|
| DemoLeadCaptureModal | submitLead | demoLeadsService |
| ContactoPage | submitLead | demoLeadsService |
| Admin Growth | fetchDemoLeadsFromDb | adminGrowthRepository → supabase.from('demo_leads').select() |

### Lectura en Admin Growth
- `adminGrowthRepository.fetchDemoLeadsFromDb()` → `supabase.from('demo_leads').select(...)`
- `adminGrowthService.fetchDemoLeads()` → repository
- `useAdminGrowth().demoLeads` → service
- RLS: SELECT solo si `is_admin()` (usuario admin autenticado)

---

## 2. Confirmación: Supabase exclusivo

| Aspecto | Estado |
|---------|--------|
| Cliente Supabase | `@/integrations/supabase/client` — createClient estándar |
| Tablas | `public.demo_leads` en schema public |
| RLS | Coherente con admin (is_admin para SELECT/UPDATE) |
| Auth | INSERT permite anónimo; SELECT/UPDATE requieren admin |
| Storage | No usado |
| Edge Functions | No usadas para leads |

---

## 3. Verificación: Sin dependencias Lovable

| Elemento | Estado |
|----------|--------|
| Lovable Cloud | No usado |
| Connectors | No hay |
| Storage fuera de Supabase | No |
| Auth fuera de Supabase | No (AuthContext usa supabase.auth) |

---

## 4. Implementación correcta

La implementación cumple los requisitos. No se requieren cambios.

---

## 5. Checklist para aplicar la migración

1. **Conectar al proyecto Supabase** (Dashboard o CLI)
2. **Verificar orden de migraciones**: `20250318140000` debe ejecutarse después de `20250318000000` (define `is_admin()`)
3. **Aplicar**:
   ```bash
   supabase db push
   ```
   O en SQL Editor de Supabase Dashboard:
   - Copiar contenido de `supabase/migrations/20250318140000_demo_leads.sql`
   - Ejecutar
4. **Comprobar**:
   ```sql
   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'demo_leads');
   ```

---

## 6. Archivos frontend que llaman al service real

| Archivo | Función | Flujo |
|---------|---------|-------|
| `src/components/demo/DemoLeadCaptureModal.tsx` | `submitLead(payload)` | Modal "Solicitar demo" |
| `src/pages/public/ContactoPage.tsx` | `submitLead(payload)` | Formulario de contacto |

Ambos usan `submitLead` de `@/services/demoLeadsService`.

---

## 7. Prueba end-to-end

### A. Desde DemoConversionBanner (usuario en demo)
1. Ir a `/demo/setup`, configurar y entrar al demo
2. Ver banner naranja "Este demo refleja..."
3. Clic en "Solicitar demo"
4. Completar: nombre, email (obligatorios)
5. Enviar
6. Ver mensaje "¡Gracias!" o error verificable

### B. Desde ContactoPage (público, sin login)
1. Ir a `/contacto`
2. Completar formulario (nombre, organización, país, correo, interés, consentimiento)
3. Enviar
4. Ver "Mensaje enviado correctamente" o toast de error

### C. En Admin Growth (admin)
1. Login como admin
2. Ir a `/admin/growth`
3. Ver métrica "Leads demo" y tabla "Leads demo"
4. Comprobar que aparecen los leads creados en A y B

### D. Verificación en Supabase
```sql
SELECT id, created_at, nombre, email, cta_source FROM public.demo_leads ORDER BY created_at DESC LIMIT 10;
```

---

## 8. SQL final (sin cambios)

El SQL de `20250318140000_demo_leads.sql` es correcto. Contenido:

```sql
-- Demo leads: captura real de leads desde flujo demo y CTAs.
CREATE TABLE IF NOT EXISTS public.demo_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  nombre text NOT NULL,
  email text NOT NULL,
  organizacion text,
  tipo_organizacion text,
  mensaje text,
  demo_org_type text,
  demo_profile_label text,
  demo_route text,
  cta_source text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'archived')),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_demo_leads_created_at ON public.demo_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_leads_status ON public.demo_leads (status);
CREATE INDEX IF NOT EXISTS idx_demo_leads_email ON public.demo_leads (email);

ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_leads_insert" ON public.demo_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "demo_leads_select_admin" ON public.demo_leads FOR SELECT USING (public.is_admin());
CREATE POLICY "demo_leads_update_admin" ON public.demo_leads FOR UPDATE USING (public.is_admin());
```

---

## 9. Archivos modificados en esta auditoría

Ninguno. La implementación actual es correcta.

---

## 10. Riesgos residuales

1. **Cliente Supabase**: URL y anon key están hardcodeados en `client.ts`. Para usar un Supabase propio, configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` y actualizar el client.
2. **INSERT anónimo**: Permite spam. Mitigación futura: rate limiting, captcha o Edge Function.
3. **Orden de migraciones**: `20250318140000` debe ejecutarse después de `20250318000000` (is_admin).
