# Dashboard Refactor — QA Checklist

## Resumen
Dashboard unificado `OrganizationDashboard` que ensambla bloques dinámicos según `orgTipo` + `role` + `activeModules`.

## Archivos

### Nuevos
- `src/components/dashboard/OrganizationDashboard.tsx` — Ensamblador principal
- `src/components/dashboard/blocks/OrgHeader.tsx` — Header contextual con org name, tipo, VITAL score, EUDR status
- `src/components/dashboard/blocks/KPISection.tsx` — KPIs filtrados por módulos activos
- `src/components/dashboard/blocks/AlertsSection.tsx` — Alertas filtradas por módulos
- `src/components/dashboard/blocks/ModuleStatusSection.tsx` — Estado visual de módulos activos
- `src/components/dashboard/blocks/QuickActionsSection.tsx` — Acciones rápidas por rol+módulos
- `src/components/dashboard/blocks/ActivitySection.tsx` — Actividad reciente (entregas, lotes, visitas)

### Reemplazados (ahora wrappers del dashboard unificado)
- `DashboardCooperativaContent.tsx`
- `DashboardExportador.tsx`
- `DashboardProductor.tsx`
- `DashboardTecnico.tsx`
- `DashboardCertificadora.tsx`

## QA Checklist

### ✅ Cooperativa
- [ ] Header muestra nombre org + badge "Cooperativa" + VITAL score + EUDR status
- [ ] KPIs: Socios activos, Hectáreas, Volumen, VITAL promedio, Créditos, Alertas
- [ ] Module Status: muestra VITAL, Créditos, Jornales, Inventario
- [ ] Alertas: muestra fitosanitaria, vital, crédito, eudr
- [ ] Acciones rápidas: Nuevo Socio, Nueva Entrega, Ejecutar VITAL, Aprobar Crédito
- [ ] Actividad: gráfico entregas 6m + tabla últimas entregas

### ✅ Exportador
- [ ] Header muestra badge "Exportador" + EUDR status, NO VITAL score
- [ ] KPIs: Proveedores (no "Socios"), Lotes comerciales, Contratos, Embarques, EUDR
- [ ] Acciones: Crear Lote, Generar EUDR, Nuevo Contrato
- [ ] Actividad: tabla lotes comerciales

### ✅ Productor
- [ ] Header muestra VITAL score, NO EUDR
- [ ] KPIs: Parcelas, Hectáreas, VITAL, Créditos, Avisos
- [ ] Acciones: Registrar Entrega, Actualizar Parcela, Ver Score VITAL
- [ ] Sin alertas section (simplificado)

### ✅ Técnico
- [ ] KPIs: Productores asignados, Evaluaciones, Visitas hoy, Bajo VITAL
- [ ] Actividad: Visitas programadas hoy
- [ ] Sin alertas section

### ✅ Certificadora
- [ ] KPIs: Auditorías, Organizaciones, Verificaciones, Reportes
- [ ] Sin módulo status section
- [ ] Sin actividad reciente detallada

### ✅ Module filtering
- [ ] Si `creditos` no activo → KPI de créditos desaparece + acción "Aprobar Crédito" desaparece
- [ ] Si `vital` no activo → VITAL score en header desaparece + KPI desaparece
- [ ] Si `eudr` no activo → EUDR status en header desaparece
- [ ] Module Status section solo muestra módulos activos

### ✅ No se rompe nada
- [ ] Rutas existentes siguen funcionando
- [ ] No se modificaron queries ni RLS
- [ ] No hardcodes de "Cooperativa" en dashboard
