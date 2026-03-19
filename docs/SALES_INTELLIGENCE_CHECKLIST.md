# Sales Intelligence — Checklist de consolidación

---

## Archivos creados/copiados

| # | Archivo | Estado |
|---|---------|--------|
| 1 | `supabase/migrations/20250322000001_sales_schema_base.sql` | Creado |
| 2 | `supabase/migrations/20250322000002_sales_seed_v1.sql` | Creado (minimal) |
| 3 | `supabase/migrations/20250322000003_sales_rpc_core.sql` | Creado |
| 4 | `supabase/migrations/20250322000004_sales_auth_helper.sql` | Creado |
| 5 | `supabase/migrations/20250322000005_sales_rls.sql` | Creado |
| 6 | `supabase/migrations/20250322000006_sales_objection_recalibration.sql` | Copiado + fix (G) |
| 7 | `supabase/migrations/20250322000007_sales_recommendations_redesign.sql` | Copiado |
| 8 | `supabase/migrations/20250322000008_sales_performance_indexes.sql` | Copiado |
| 9 | `scripts/test_sales_pipeline.sql` | Copiado |
| 10 | `src/modules/sales/FlowEngine.ts` | Copiado |
| 11 | `src/modules/sales/FlowEngine.types.ts` | Copiado |
| 12 | `src/modules/sales/FlowEngineLoader.ts` | Copiado |
| 13 | `src/modules/sales/SalesSessionService.ts` | Copiado |

---

## Orden de migraciones

```
20250322000001  sales_schema_base
20250322000002  sales_seed_v1
20250322000003  sales_rpc_core
20250322000004  sales_auth_helper
20250322000005  sales_rls
20250322000006  sales_objection_recalibration
20250322000007  sales_recommendations_redesign
20250322000008  sales_performance_indexes
```

---

## Pendiente manual

1. **Seed completo**: 20250322000002 tiene solo questionnaire + 8 sections. Extraer de BD existente o completar:
   - sales_questions (49)
   - sales_answer_options (112)
   - sales_scoring_rules (55)
   - sales_objection_rules (24)

2. **Org demo**: Test usa `00000000-0000-0000-0000-000000000001`. Crear en platform_organizations si no existe.

3. **Usuario admin**: Test usa `77c7b31e-ac2c-4d61-bc65-80785f48ce42` (info@novasilva.co). Debe tener role admin en user_roles.

---

## Doble fuente de verdad

**Decisión: B) Eliminar sales_session_scores**

- No se crea la tabla en schema base.
- fn_sales_recalculate_scores escribe solo en sales_sessions.score_*.

---

## Fix price

- **(G)** en 20250322000006: `budget_readiness = 0` → `budget_readiness < 25`
- Regla en seed (cuando existan questions/options): BUD_CURRENT_SPEND=under_3k → price

---

## Comandos

```bash
supabase db push
# o
supabase migration up
```

Ejecutar test en SQL Editor:
```
scripts/test_sales_pipeline.sql
```
