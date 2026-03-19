# Demo Leads — Operacionalización en Admin Panel

## 1. Diagnóstico inicial

### Repository (`adminGrowthRepository.ts`)
- `fetchDemoLeadsFromDb()`: SELECT con order created_at desc, limit 100
- No había `updateDemoLeadInDb`

### Service (`adminGrowthService.ts`)
- `fetchDemoLeads()`: mapea filas
- No había `updateDemoLead`

### Hook (`useAdminGrowth.ts`)
- `demoLeads`: query para listar
- No había mutación para actualizar

### Page (`AdminGrowthPage.tsx`)
- Tabla con nombre, email, organización, origen, estado, fecha
- StatusBadge con variant neutral
- Sin filtros, sin acciones

### Esquema `demo_leads`
- `status` y `notes` ya existen
- No se requiere migración

---

## 2. Migración

No aplica. `status` y `notes` ya están en la tabla.

---

## 3. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/repositories/admin/adminGrowthRepository.ts` | `updateDemoLeadInDb(id, { status?, notes? })` |
| `src/services/admin/adminGrowthService.ts` | `updateDemoLead(id, payload)` |
| `src/hooks/admin/useAdminUpdateDemoLead.ts` | Nuevo: mutación con invalidateQueries |
| `src/hooks/admin/index.ts` | Export `useAdminUpdateDemoLead` |
| `src/pages/admin/AdminGrowthPage.tsx` | Filtros status/cta_source, badge por estado, diálogo editar, loading/error/toast |

---

## 4. Flujo final de uso

### Listar leads
1. Admin → `/admin/growth`
2. Sección "Leads demo" con tabla ordenada por `created_at` desc

### Filtrar
- **Estado**: new, contacted, qualified, closed
- **Origen**: valores únicos de `cta_source` (demo_conversion_banner, contacto_page, etc.)

### Editar lead
1. Clic en ícono lápiz
2. Diálogo: Estado (select) + Notas (textarea)
3. Guardar → toast éxito o error
4. Tabla se actualiza (invalidateQueries)

### Estados permitidos
- `new` — Nuevo (neutral)
- `contacted` — Contactado (warning)
- `qualified` — Calificado (success)
- `closed` — Cerrado (neutral)

---

## 5. Seguridad

- SELECT: solo `is_admin()` (RLS existente)
- UPDATE: solo `is_admin()` (RLS existente)
- Sin lectura pública
- Arquitectura: repository → service → hook → UI

---

## 6. UX

- **Loading**: "Cargando..." en tabla
- **Error**: AdminErrorAlert + toast en mutación
- **Success**: toast "Lead actualizado"

---

## 7. Riesgos residuales

1. **Status legacy**: Leads con status distinto a new/contacted/qualified/closed se muestran con badge neutral.
2. **Filtro cta_source**: Si no hay leads, el select de origen queda vacío (solo "Todos los orígenes").
