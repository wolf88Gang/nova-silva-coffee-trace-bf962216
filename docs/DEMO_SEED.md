# Demo Seed — QA Checklist

## Resumen
Dataset demo coherente por tipo de organización, 100% in-memory (sin inserts reales a BD).
Usa `src/lib/demoSeed.ts` como fuente única de datos demo tipificados.

## Archivos

### Nuevos
- `src/lib/demoSeed.ts` — Engine de datos demo por orgTipo con `getDemoDataForOrg()`, `getDemoStats()`, `isDemoContext()`

### Modificados
- `src/components/dashboard/OrganizationDashboard.tsx` — Usa `getDemoStats()` + empty state dinámico
- `src/components/dev/DevTenantInspector.tsx` — Botón "Reset Demo" (solo contexto demo)

## Datasets por orgTipo

### Cooperativa
- 8 socios (productores)
- 6 parcelas (2 por productor principal)
- 5 entregas
- 4 créditos (si módulo activo)
- 4 alertas
- 5 visitas

### Exportador / Beneficio Privado
- 2 proveedores
- 2 parcelas
- 2 entregas
- 3 lotes comerciales
- Alertas EUDR filtradas

### Productor Empresarial
- 1 unidad productiva
- 2 parcelas
- 3 entregas propias
- 1 crédito (si módulo activo)

### Certificadora
- 3 unidades auditadas (read-only)
- 3 parcelas

## QA Checklist

### ✅ Demo Cooperativa
- [ ] Dashboard muestra KPIs con 8 socios, entregas, VITAL
- [ ] Stats header muestra promedio VITAL y EUDR compliance
- [ ] Empty state NO aparece (hay datos demo)

### ✅ Demo Exportador
- [ ] Dashboard muestra 2 proveedores
- [ ] Lotes comerciales visibles
- [ ] Sin módulos cooperativa-specific

### ✅ Demo Productor Empresarial
- [ ] Dashboard muestra 1 unidad y 3 entregas
- [ ] Sin lista de socios/proveedores terceros

### ✅ Empty State
- [ ] Si totalActores == 0: muestra card "Tu organización aún no tiene datos"
- [ ] CTA "Crear primer socio/proveedor/unidad"

### ✅ Seguridad
- [ ] `isDemoContext()` valida userId starts with "demo-" o orgName contiene "Demo"
- [ ] Botón "Reset Demo" solo visible en dev + contexto demo
- [ ] No hay inserts reales a la BD
- [ ] No se ejecuta nada en producción

### ✅ DevTenantInspector
- [ ] Botón "Reset Demo" visible en modo demo
- [ ] Botón "Run Test Queries" funciona contra Supabase externo
