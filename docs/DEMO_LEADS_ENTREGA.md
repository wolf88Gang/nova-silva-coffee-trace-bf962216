# Demo Leads — Captura real de leads

## 1. Diagnóstico inicial

- **DemoLeadCaptureModal**: No existía en el repo. Se creó desde cero.
- **submitLead()**: No existía. Se implementó en `demoLeadsService.ts`.
- **Flujo más cercano**: `ContactoPage` tenía envío simulado (`setTimeout`). Se reemplazó por persistencia real.

---

## 2. Migración SQL

**Archivo:** `supabase/migrations/20250318140000_demo_leads.sql`

### Tabla `public.demo_leads`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| created_at | timestamptz | default now() |
| nombre | text | NOT NULL |
| email | text | NOT NULL |
| organizacion | text | NULL |
| tipo_organizacion | text | NULL |
| mensaje | text | NULL |
| demo_org_type | text | NULL |
| demo_profile_label | text | NULL |
| demo_route | text | NULL |
| cta_source | text | NULL |
| status | text | NOT NULL default 'new' (new, contacted, converted, archived) |
| notes | text | NULL |

### RLS

- **INSERT**: permitido para todos (auth y anónimos) — típico para formularios de lead.
- **SELECT**: solo `is_admin()`.
- **UPDATE**: solo `is_admin()`.

---

## 3. Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/types/demoLeads.ts` | DemoLeadPayload, DemoLead |
| `src/repositories/demoLeadsRepository.ts` | insertLeadInDb() |
| `src/services/demoLeadsService.ts` | submitLead() |
| `src/components/demo/DemoLeadCaptureModal.tsx` | Modal con formulario y persistencia real |

---

## 4. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/demo/DemoConversionBanner.tsx` | Botón "Solicitar demo" que abre DemoLeadCaptureModal; props ctaSource, demoOrgType, demoProfileLabel, demoRoute |
| `src/pages/public/ContactoPage.tsx` | Reemplazo de submit simulado por submitLead(); mapeo de campos a payload |
| `src/repositories/admin/adminGrowthRepository.ts` | fetchDemoLeadsFromDb(), DbDemoLead |
| `src/services/admin/adminGrowthService.ts` | fetchDemoLeads() |
| `src/hooks/admin/useAdminGrowth.ts` | demoLeads query |
| `src/pages/admin/AdminGrowthPage.tsx` | Sección "Leads demo" con tabla; métrica "Leads demo" |
| `src/types/admin.ts` | AdminDemoLead |
| `src/mappers/admin/growthMapper.ts` | mapDemoLeadToAdmin() |

---

## 5. Conexión del modal

### DemoConversionBanner

- Botón "Solicitar demo" abre `DemoLeadCaptureModal`.
- Props: `ctaSource="demo_conversion_banner"`, `demoOrgType`, `demoProfileLabel`, `demoRoute` (pathname actual).

### ContactoPage

- El formulario de contacto ya no simula envío.
- Llama a `submitLead()` con: nombre, email (correo), organizacion, tipo_organizacion (interes), mensaje (incluye país y teléfono).
- `cta_source`: `"contacto_page"`, `demo_route`: `"/contacto"`.

### Estados del modal

- **idle**: formulario listo.
- **loading**: enviando.
- **success**: mensaje de confirmación y botón Cerrar.
- **error**: mensaje verificable y botón Reintentar.

---

## 6. Admin Growth

- Nueva métrica: "Leads demo" (cantidad).
- Nueva sección: tabla con nombre, email, organización, origen (cta_source), estado, fecha.
- Máximo 20 filas visibles.
- Fallback a mock vacío en desarrollo si falla Supabase.

---

## 7. Riesgos residuales

1. **INSERT anónimo**: La política permite INSERT sin autenticación. Riesgo de spam. Mitigación futura: rate limiting, captcha o Edge Function.
2. **Sin validación de email**: No se valida formato estricto en backend. El frontend usa `type="email"`.
3. **Duplicados**: No hay constraint UNIQUE en email. Se pueden registrar leads duplicados.
4. **Migración**: Aplicar `20250318140000_demo_leads.sql` antes de deploy.

---

## 8. Cómo probar

1. Aplicar migración: `supabase db push` o equivalente.
2. En demo: iniciar sesión demo → ver banner → "Solicitar demo" → completar formulario → enviar.
3. En contacto: ir a `/contacto` → completar formulario → enviar.
4. En admin: ir a `/admin/growth` → verificar sección "Leads demo".
