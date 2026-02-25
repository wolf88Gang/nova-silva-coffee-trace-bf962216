# Refactor organization_id (Fase 1)

## Objetivo
Dejar de ser coop-centric: unificar tenant con `organization_id`. Filtrado y RLS por `organization_id`. Mantener `cooperativa_id`/`exportador_id` como legacy.

## Esquema confirmado

| Tabla | organization_id | Origen backfill |
|-------|-----------------|-----------------|
| productores | ✓ | cooperativa_id |
| parcelas | ✓ | cooperativa_id \|\| productores.organization_id |
| entregas | ✓ | cooperativa_id \|\| productor/parcela join |
| documentos | ✓ | cooperativa_id \|\| parcela/productor join |
| lotes_acopio | ✓ | cooperativa_id |
| lotes_comerciales | ✓ | exportador_id \|\| cooperativa_id |
| contratos | ✓ | exportador_id |
| cooperativa_exportadores | ✓ | cooperativa_id |

## Helpers SQL

- `current_org_id()` → profiles.organization_id para auth.uid()
- `is_admin()` → user_roles.role='admin'
- `_can_access_org(org_id)` → RLS: admin bypass o org_id = current_org_id()

## Queries de verificación (nulls por tabla)

```sql
SELECT 'productores' AS tabla, COUNT(*) AS null_count FROM public.productores WHERE organization_id IS NULL
UNION ALL SELECT 'parcelas', COUNT(*) FROM public.parcelas WHERE organization_id IS NULL
UNION ALL SELECT 'entregas', COUNT(*) FROM public.entregas WHERE organization_id IS NULL
UNION ALL SELECT 'documentos', COUNT(*) FROM public.documentos WHERE organization_id IS NULL
UNION ALL SELECT 'lotes_acopio', COUNT(*) FROM public.lotes_acopio WHERE organization_id IS NULL
UNION ALL SELECT 'lotes_comerciales', COUNT(*) FROM public.lotes_comerciales WHERE organization_id IS NULL
UNION ALL SELECT 'contratos', COUNT(*) FROM public.contratos WHERE organization_id IS NULL
UNION ALL SELECT 'cooperativa_exportadores', COUNT(*) FROM public.cooperativa_exportadores WHERE organization_id IS NULL;
```

## Plan de rollout

1. **Staging**: Ejecutar `scripts/run_organization_id_refactor.sql` → validar nulls → probar RLS
2. **Producción**: Ventana de mantenimiento → ejecutar script → validar
3. **Frontend**: Deploy con useCurrentOrgId y filtros por organization_id (fallback cooperativa_id)
