# Plan de Refactor: Tenant-Centric (Fase 1)

## Objetivo
Migrar de modelo "coop-centric" a tenant genérico (`tenant_org_id` = `organizations.id`) para soportar cooperativas, haciendas privadas, productores-compradores, exportadores.

## Regla de oro
- Toda tabla operacional debe tener `tenant_org_id` (nullable en Fase 1, NOT NULL en Fase 2).
- RLS: acceso solo si `auth.uid()` pertenece a `usuarios_org.organization_id = tenant_org_id` O `user_roles.role = 'admin'`.

---

## Fase 1 — Pasos

### 1. DB: Migraciones (orden de ejecución)

| # | Migración | Descripción |
|---|-----------|-------------|
| 1 | `20250225100001_add_tenant_org_id.sql` | Añade columna `tenant_org_id uuid` a tablas (defensivo: IF EXISTS) |
| 2 | `20250225100002_backfill_tenant_org_id.sql` | Backfill desde `cooperativa_id` o joins |
| 3 | `20250225100003_rls_tenant_policies.sql` | Activa RLS y crea policies por tenant |

### 2. Backfill — Origen de tenant_org_id

| Tabla | Origen |
|-------|--------|
| productores | cooperativa_id |
| parcelas | productores.tenant_org_id via productor_id |
| documentos | parcelas.tenant_org_id via parcela_id |
| entregas | productores.tenant_org_id o parcelas.tenant_org_id |
| creditos | productores.tenant_org_id |
| visitas | productores.tenant_org_id |
| cataciones | productor o lote join |
| lotes_acopio | cooperativa_id |
| avisos, cuadrillas, inventario_insumos, transacciones | cooperativa_id |
| cooperativa_exportadores | cooperativa_id |
| contratos | cooperativa_id |
| alertas, evidencias | Resolver por entidad_tipo → tabla → tenant |

### 3. RLS — Patrón

```sql
CREATE POLICY "tenant_select" ON public.<tabla>
  FOR SELECT USING (
    tenant_org_id IS NULL  -- legacy durante transición
    OR EXISTS (
      SELECT 1 FROM usuarios_org uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = <tabla>.tenant_org_id
        AND uo.estado = 'activo'
    )
    OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );
```

### 4. Code Changes

- **types/index.ts**: Añadir `tenantOrgId?: string` a Productor; preferir sobre `cooperativaId`.
- **Queries**: Filtrar por `tenant_org_id` cuando exista; fallback a `cooperativa_id` si null.
- **Hooks/context**: Obtener `tenantOrgId` del usuario (usuarios_org o profile) y pasarlo a queries.

### 5. Rollout

1. **Staging**: Aplicar migraciones → backfill → validar conteos.
2. **Producción**: Idem, con ventana de mantenimiento si hay datos.
3. **Post-rollout**: Convertir `tenant_org_id` a NOT NULL en tablas críticas (staging primero).

---

## Tablas sin tenant_org_id

- **profiles**, **user_roles**: No operacionales; acceso por user_id.
- **organizations**: Es el tenant; no aplica.
- **usuarios_org**: Relaciona user ↔ org; RLS por user_id.
