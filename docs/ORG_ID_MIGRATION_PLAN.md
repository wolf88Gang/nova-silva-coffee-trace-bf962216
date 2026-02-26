# Plan de Migración: organization_id Unification

## Objetivo
Migrar de `cooperativa_id`/`exportador_id` a un solo `organization_id` como tenant key universal. Sin downtime, incremental, reversible.

---

## Fases

### Fase 0 — Safety Rails ✅
- Confirmar `platform_organizations` como tabla canónica
- Helpers: `get_user_organization_id()`, `has_role()`, `is_admin()`, `get_user_productor_id()`
- Grants: `EXECUTE TO authenticated`

### Fase 1 — Add Column + Index
- `ALTER TABLE ADD COLUMN IF NOT EXISTS organization_id uuid` en 19 tablas
- `CREATE INDEX IF NOT EXISTS` en cada una
- **No NOT NULL** → compatible con datos existentes

### Fase 2 — Backfill (orden dependiente)
| Orden | Tabla | Origen |
|-------|-------|--------|
| 1 | productores | cooperativa_id |
| 2 | parcelas | COALESCE(cooperativa_id, productores.organization_id) |
| 3 | entregas | COALESCE(cooperativa_id, productor join, parcela join) |
| 4 | documentos | COALESCE(cooperativa_id, parcela join, productor join) |
| 5 | lotes_acopio | cooperativa_id |
| 6 | lotes_comerciales | COALESCE(exportador_id, cooperativa_id) |
| 7 | contratos | exportador_id OR cooperativa_id |
| 8 | cooperativa_exportadores | cooperativa_id |
| 9+ | extras (creditos, visitas, etc.) | cooperativa_id OR productor join |

### Fase 3 — Dual-Write Trigger
- `sync_organization_id()` BEFORE INSERT OR UPDATE en todas las tablas
- Si `organization_id` ya está set → no override
- Fallback: cooperativa_id → exportador_id

### Fase 4 — RLS org-first
- Policies `orgfirst_select/insert/update/delete`
- `USING (is_admin(uid) OR organization_id = get_user_organization_id(uid) OR organization_id IS NULL)`
- Legacy policies se mantienen temporalmente

### Fase 5 — Frontend Switch (PR separado)
- Cambiar `.eq('cooperativa_id', orgId)` → `.eq('organization_id', orgId)`
- Fallback temporal: OR en transición
- Eliminar fallback después de 1 release estable

### Fase 6 — Harden Constraints
- Prerrequisitos: 0 NULLs, frontend migrado, triggers estables
- `ALTER COLUMN organization_id SET NOT NULL`
- `ADD FOREIGN KEY REFERENCES platform_organizations(id)`

### Fase 7 — Cleanup
- Deprecar/remover `cooperativa_id` en tablas donde no aporta
- Remover triggers dual-write
- Remover policies legacy

---

## Criterios para avanzar de fase

| De → A | Criterio |
|--------|----------|
| F1 → F2 | Columnas e índices creados sin error |
| F2 → F3 | NULL count = 0 (o justificado) en tablas críticas |
| F3 → F4 | Triggers activos, INSERT test confirma dual-write |
| F4 → F5 | RLS smoke test pasa (DevTenantInspector) |
| F5 → F6 | Frontend usa organization_id, 0 queries con cooperativa_id |
| F6 → F7 | NOT NULL constraints activos, FK creadas, 1 release estable |

---

## Rollback Strategy

### Si Fase 2 falla (backfill)
- `UPDATE SET organization_id = NULL` en tablas afectadas
- Revertir a cooperativa_id como fuente de verdad

### Si Fase 3 falla (triggers)
```sql
-- Desactivar todos los triggers
DO $$ DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY['productores','parcelas','entregas',...] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_organization_id ON public.%I', t);
END LOOP; END $$;
```

### Si Fase 4 falla (RLS)
```sql
-- Revertir policies org-first
DO $$ DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY['productores','parcelas','entregas',...] LOOP
  EXECUTE format('DROP POLICY IF EXISTS "orgfirst_select_%s" ON public.%I', t, t);
  EXECUTE format('DROP POLICY IF EXISTS "orgfirst_insert_%s" ON public.%I', t, t);
  EXECUTE format('DROP POLICY IF EXISTS "orgfirst_update_%s" ON public.%I', t, t);
  EXECUTE format('DROP POLICY IF EXISTS "orgfirst_delete_%s" ON public.%I', t, t);
END LOOP; END $$;
```
Legacy policies siguen activas → sin interrupción.

### Si Fase 6 falla (NOT NULL)
```sql
ALTER TABLE public.<tabla> ALTER COLUMN organization_id DROP NOT NULL;
```

---

## Scripts

| Script | Propósito |
|--------|-----------|
| `scripts/run_org_id_unification_phase1.sql` | Fases 0-4 completas |
| `scripts/verify_org_id_unification.sql` | Verificación post-ejecución |
| `scripts/run_organization_id_refactor.sql` | Legacy (Fase 1 original, superseded) |

---

## Verificación con DevTenantInspector

1. Login → Dashboard → Panel "Tenant Inspector" (bottom-right)
2. Tab **RLS** → "RLS Smoke Test" → todas las filas ✅, Cross = 0
3. Tab **Data** → "Run Tenant Count" → confirmar conteos por org
4. Tab **Context** → Confirmar organizationId correcto

## Estado actual
- [x] Fase 0: Helpers
- [x] Fase 1: Columnas + índices (script listo)
- [x] Fase 2: Backfill (script listo)
- [x] Fase 3: Dual-write triggers (script listo)
- [x] Fase 4: RLS org-first (script listo)
- [ ] Fase 5: Frontend switch (pendiente, PR separado)
- [ ] Fase 6: NOT NULL constraints
- [ ] Fase 7: Cleanup legacy
