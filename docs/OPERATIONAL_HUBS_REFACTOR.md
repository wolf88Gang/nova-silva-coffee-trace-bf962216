# Operational Hubs Refactor — QA Checklist

## Resumen
ParcelasHub y EntregasHub universales reemplazan páginas legacy (MiFinca, TecnicoParcelas).
ActorContext permite scoping de operaciones por actor seleccionado.

## Archivos

### Nuevos
- `src/contexts/ActorContext.tsx` — Context para seleccionar actor como scope operativo
- `src/pages/parcelas/ParcelasHub.tsx` — Página universal de parcelas
- `src/pages/entregas/EntregasHub.tsx` — Página universal de entregas

### Modificados (wrappers)
- `src/pages/productor/MiFinca.tsx` → wrapper de ParcelasHub
- `src/pages/tecnico/TecnicoParcelas.tsx` → wrapper de ParcelasHub
- `src/components/layout/DashboardLayout.tsx` → wraps children with ActorProvider

## QA Checklist

### ✅ ParcelasHub
- [ ] Cooperativa: muestra "parcelas de toda la organización" (org-wide)
- [ ] Con actor seleccionado: filtra y muestra "Mostrando parcelas de Socio: {nombre}"
- [ ] Productor: solo ve sus parcelas (forzado por productorId)
- [ ] Columna EUDR: solo si módulo eudr activo
- [ ] Botón "Nueva parcela": solo si canWrite(role)
- [ ] Columna "Socio/Proveedor": oculta cuando hay actor seleccionado

### ✅ EntregasHub
- [ ] Cooperativa: muestra entregas org-wide con nombre del actor
- [ ] Productor: solo sus entregas
- [ ] Columna VITAL: solo si módulo vital activo, marca "VITAL bajo" en rojo
- [ ] Filtro por tipo de café funciona
- [ ] KPIs: volumen total, valor total, pagados/total

### ✅ ActorContext
- [ ] selectedActorId persiste entre navegación dentro de DashboardLayout
- [ ] clearSelectedActor resetea el filtro
- [ ] Productor ignora ActorContext y usa productorId directo

### ✅ Multi-tenant
- [ ] Queries filtran por cooperativa_id = organizationId (cuando se conecte a Supabase real)
- [ ] Org1 no ve parcelas/entregas de Org2

### ✅ Legacy wrappers
- [ ] MiFinca renderiza ParcelasHub correctamente
- [ ] TecnicoParcelas renderiza ParcelasHub correctamente
