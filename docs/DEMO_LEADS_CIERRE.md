# Demo Leads — Cierre en Supabase externo

## 1. Auditoría realizada

### Archivos auditados
- `src/services/demoLeadsService.ts` — submitLead()
- `src/repositories/demoLeadsRepository.ts` — insertLeadInDb()
- `src/components/demo/DemoLeadCaptureModal.tsx`
- `src/pages/public/ContactoPage.tsx`
- `src/repositories/admin/adminGrowthRepository.ts`
- `src/pages/admin/AdminGrowthPage.tsx`

### Artefactos buscados
- first_replaced_line
- last_replaced_line
- "replace":
- bloques duplicados
- strings rotos
- metadata de tool output

**Resultado:** Ninguno encontrado.

---

## 2. submitLead() — Estado final

**Archivo:** `src/services/demoLeadsService.ts`

```typescript
export async function submitLead(payload: DemoLeadPayload): Promise<SubmitLeadResult> {
  try {
    const row = await insertLeadInDb(payload);
    return { ok: true, id: row.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar el lead';
    return { ok: false, error: msg };
  }
}
```

- Usa `insertLeadInDb` del repository
- Repository usa `supabase` de `@/integrations/supabase/client` (Supabase externo)
- Compilación: OK

---

## 3. SQL final

**Archivo:** `supabase/migrations/20250318140000_demo_leads.sql`

```sql
-- Demo leads: captura en Supabase externo.
-- Sin Lovable. RLS: INSERT flujo actual, SELECT/UPDATE solo admins.

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
  status text NOT NULL DEFAULT 'new',
  notes text
);

CREATE INDEX IF NOT EXISTS idx_demo_leads_created_at ON public.demo_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_leads_status ON public.demo_leads (status);
CREATE INDEX IF NOT EXISTS idx_demo_leads_email ON public.demo_leads (email);

ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_leads_insert" ON public.demo_leads;
CREATE POLICY "demo_leads_insert" ON public.demo_leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "demo_leads_select_admin" ON public.demo_leads;
CREATE POLICY "demo_leads_select_admin" ON public.demo_leads
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "demo_leads_update_admin" ON public.demo_leads;
CREATE POLICY "demo_leads_update_admin" ON public.demo_leads
  FOR UPDATE USING (public.is_admin());
```

---

## 4. RLS

| Operación | Política |
|-----------|----------|
| INSERT | Permitido (flujo demo + contacto público) |
| SELECT | Solo `public.is_admin()` |
| UPDATE | Solo `public.is_admin()` |
| Lectura pública | No |

---

## 5. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20250318140000_demo_leads.sql` | Reescrito: mínimo, idempotente (DROP POLICY IF EXISTS) |
| `src/pages/admin/AdminGrowthPage.tsx` | Añadido `Users` al import de lucide-react |

---

## 6. Integración Admin Growth

- `fetchDemoLeadsFromDb` en adminGrowthRepository
- `fetchDemoLeads` en adminGrowthService
- `useAdminGrowth().demoLeads` en hook
- `AdminGrowthPage`: métrica "Leads demo" + tabla con nombre, email, organización, origen, estado, fecha.

**Esquema:** Coincide con la tabla final.

---

## 7. Confirmación: sin artefactos

- Búsqueda: first_replaced_line, last_replaced_line, "replace":, etc. → 0 resultados
- Build: OK

---

## 8. Checklist prueba end-to-end

### A. Aplicar migración
1. `supabase db push` o ejecutar SQL en Supabase SQL Editor
2. Verificar: `SELECT 1 FROM public.demo_leads LIMIT 1;` (sin error)

### B. Captura desde modal (demo)
1. Ir a `/demo/setup`, configurar, entrar
2. Clic en "Solicitar demo" en el banner
3. Completar nombre y email obligatorios
4. Enviar
5. Ver mensaje de éxito o error

### C. Captura desde contacto
1. Ir a `/contacto`
2. Completar formulario (nombre, organización, país, correo, interés, consentimiento)
3. Enviar
4. Ver "Mensaje enviado correctamente" o toast de error

### D. Lectura en Admin
1. Login como admin
2. Ir a `/admin/growth`
3. Ver métrica "Leads demo" y tabla "Leads demo"
4. Comprobar que aparecen los leads de B y C

### E. Verificación en SQL
```sql
SELECT id, created_at, nombre, email, cta_source FROM public.demo_leads ORDER BY created_at DESC LIMIT 10;
```
