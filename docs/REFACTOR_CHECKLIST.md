# Checklist de Validación — Refactor Tenant (Fase 1)

## Pre-migración

- [ ] Backup de base de datos
- [ ] Verificar que `organizations` y `usuarios_org` existen
- [ ] Ejecutar conteos baseline (ver queries abajo)

## Migraciones

- [ ] `20250225100001_add_tenant_org_id.sql` — sin errores
- [ ] `20250225100002_backfill_tenant_org_id.sql` — sin errores
- [ ] `20250225100003_rls_tenant_policies.sql` — sin errores

## Queries de validación

### 1. Filas con tenant_org_id NULL por tabla

```sql
SELECT 'productores' AS tabla, COUNT(*) AS null_count FROM public.productores WHERE tenant_org_id IS NULL
UNION ALL SELECT 'parcelas', COUNT(*) FROM public.parcelas WHERE tenant_org_id IS NULL
UNION ALL SELECT 'entregas', COUNT(*) FROM public.entregas WHERE tenant_org_id IS NULL
UNION ALL SELECT 'lotes_acopio', COUNT(*) FROM public.lotes_acopio WHERE tenant_org_id IS NULL
UNION ALL SELECT 'creditos', COUNT(*) FROM public.creditos WHERE tenant_org_id IS NULL
UNION ALL SELECT 'visitas', COUNT(*) FROM public.visitas WHERE tenant_org_id IS NULL;
```

**Objetivo:** 0 en tablas críticas tras backfill (o documentar excepciones).

### 2. Conteo parcelas por org vs productores por org

```sql
SELECT tenant_org_id, COUNT(*) AS productores
FROM public.productores
WHERE tenant_org_id IS NOT NULL
GROUP BY tenant_org_id;

SELECT tenant_org_id, COUNT(*) AS parcelas
FROM public.parcelas
WHERE tenant_org_id IS NOT NULL
GROUP BY tenant_org_id;
```

### 3. Muestreo 10 filas con joins

```sql
SELECT p.id, p.nombre, p.tenant_org_id, o.nombre AS org_nombre
FROM public.productores p
LEFT JOIN public.organizations o ON o.id = p.tenant_org_id
LIMIT 10;

SELECT par.id, par.nombre, par.tenant_org_id, pr.nombre AS productor
FROM public.parcelas par
LEFT JOIN public.productores pr ON pr.id = par.productor_id
LIMIT 10;
```

### 4. Reporte filas sin tenant (post-backfill)

```sql
SELECT 'productores' AS t, COUNT(*) FROM productores WHERE tenant_org_id IS NULL AND cooperativa_id IS NOT NULL
UNION ALL SELECT 'parcelas', COUNT(*) FROM parcelas p JOIN productores pr ON p.productor_id=pr.id WHERE p.tenant_org_id IS NULL AND pr.tenant_org_id IS NOT NULL;
```

## Post-migración

- [ ] Login como usuario coop → ve sus productores/parcelas
- [ ] Login como admin → ve todos
- [ ] Login como usuario sin org → no ve datos operacionales
- [ ] Insert con tenant_org_id correcto → éxito
- [ ] Insert con tenant_org_id ajeno → rechazado por RLS

## Rollout

1. **Staging:** Aplicar migraciones → validar → convertir NOT NULL en productores, parcelas, entregas, lotes_acopio
2. **Producción:** Ventana de mantenimiento → migraciones → validar
3. **Code deploy:** Actualizar frontend para usar tenant_org_id en queries
