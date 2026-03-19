# Sales Intelligence — Plan de consolidación y checklist

---

## 1. Artefactos faltantes en repo principal

| Ubicación actual | En repo principal |
|------------------|-------------------|
| Schema base `sales_*` (13 tablas + enums) | NO |
| Seed: questionnaires, sections, questions, options, scoring_rules, objection_rules | NO |
| `fn_sales_create_session` | NO |
| `fn_sales_save_answer` | NO |
| `fn_sales_recalculate_scores` | NO |
| `fn_sales_detect_objections` | NO |
| `_ensure_internal` | NO |
| Auth: `is_admin()` / `user_roles` (no admin_panel_roles) | Sí (20250322000004) |
| RLS policies `sales_*` | NO |
| `20260318000001_sales_objection_recalibration.sql` | `.claude/worktrees/focused-hugle/supabase/migrations/` |
| `20260318000002_sales_recommendations_redesign.sql` | `.claude/worktrees/focused-hugle/supabase/migrations/` |
| `20260318000003_sales_performance_indexes.sql` | `.claude/worktrees/focused-hugle/supabase/migrations/` |
| `scripts/test_sales_pipeline.sql` | `.claude/worktrees/focused-hugle/scripts/` |
| `src/modules/sales/*.ts` (4 archivos) | `.claude/worktrees/focused-hugle/src/modules/sales/` |

---

## 2. Archivos a crear o copiar

### Crear (no existen en ningún lado)

| Archivo | Contenido |
|---------|-----------|
| `supabase/migrations/20250322000001_sales_schema_base.sql` | CREATE TYPE sales_*, CREATE TABLE sales_* (13 tablas), constraints, indexes base |
| `supabase/migrations/20250322000002_sales_seed_v1.sql` | INSERT questionnaires, sections, questions, options, scoring_rules, objection_rules |
| `supabase/migrations/20250322000003_sales_rpc_core.sql` | fn_sales_create_session, fn_sales_save_answer, fn_sales_recalculate_scores, fn_sales_detect_objections |
| `supabase/migrations/20250322000004_sales_auth_helper.sql` | _ensure_internal() → is_admin() → user_roles |
| `supabase/migrations/20250322000005_sales_rls.sql` | RLS policies para sales_sessions, sales_session_*, sales_questions, etc. |

### Copiar (desde worktree)

| Origen | Destino |
|--------|---------|
| `.claude/worktrees/focused-hugle/supabase/migrations/20260318000001_sales_objection_recalibration.sql` | `supabase/migrations/20250322000006_sales_objection_recalibration.sql` |
| `.claude/worktrees/focused-hugle/supabase/migrations/20260318000002_sales_recommendations_redesign.sql` | `supabase/migrations/20250322000007_sales_recommendations_redesign.sql` |
| `.claude/worktrees/focused-hugle/supabase/migrations/20260318000003_sales_performance_indexes.sql` | `supabase/migrations/20250322000008_sales_performance_indexes.sql` |
| `.claude/worktrees/focused-hugle/scripts/test_sales_pipeline.sql` | `scripts/test_sales_pipeline.sql` |
| `.claude/worktrees/focused-hugle/src/modules/sales/FlowEngine.ts` | `src/modules/sales/FlowEngine.ts` |
| `.claude/worktrees/focused-hugle/src/modules/sales/FlowEngine.types.ts` | `src/modules/sales/FlowEngine.types.ts` |
| `.claude/worktrees/focused-hugle/src/modules/sales/FlowEngineLoader.ts` | `src/modules/sales/FlowEngineLoader.ts` |
| `.claude/worktrees/focused-hugle/src/modules/sales/SalesSessionService.ts` | `src/modules/sales/SalesSessionService.ts` |

---

## 3. Orden de aplicación

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

## 4. Conflictos y duplicados

| Riesgo | Acción |
|--------|--------|
| `_ensure_internal` en migraciones 006–008 llama a función inexistente | Crear en 20250322000004 antes de 006 |
| Migraciones 006–008 usan `perform public._ensure_internal()` | 20250322000004 define `_ensure_internal()` → `is_admin()` (user_roles) |
| `sales_objection_type` enum | Definir en 20250322000001_sales_schema_base |
| `sales_session_question_snapshots` ON CONFLICT | La tabla debe tener UNIQUE(session_id, question_id, answer_option_id) en schema base |
| `sales_session_recommendations` ON CONFLICT | La tabla debe tener UNIQUE(session_id, recommendation_type, title) en schema base |

---

## 5. Doble fuente de verdad: scores

**Recomendación: B) Eliminar sales_session_scores**

| Criterio | Justificación |
|----------|---------------|
| Consumidores | Frontend usa solo sales_sessions.score_*. No hay referencias a sales_session_scores en código. |
| Auditoría | fn_sales_recalculate_scores puede emitir evento scores_recalculated con payload. Suficiente para trazabilidad. |
| Complejidad | Dual-write añade drift, más tests, más código. |
| Migración | No crear tabla sales_session_scores en schema base. fn_sales_recalculate_scores escribe solo en sales_sessions. |

**Schema base:** NO incluir sales_session_scores.

---

## 6. Price: por qué no sale y qué cambiar

### Reglas que deberían activar price

- `sales_objection_rules`: filas con `objection_type = 'price'` y `answer_option_id` que coincida con respuestas del test.
- Sin reglas en repo, no hay forma de saber qué opciones disparan price.

### Thresholds que bloquean

- **(G) Inferencia:** `score_budget_readiness = 0` → inserta price. Test tiene 35 → (G) no se ejecuta.
- **(B)** y **(C)** solo aumentan confianza de objeciones ya existentes; no crean price.

### Cambio mínimo

**Opción A:** Ajustar (G) en `fn_sales_recalibrate_objections`:

```sql
-- Antes
IF v_scores.score_budget_readiness = 0
AND NOT EXISTS (...)

-- Después
IF v_scores.score_budget_readiness < 25
AND NOT EXISTS (...)
```

Alinea con budget_gap (<=25). El test sigue con budget=35, así que price sigue sin aparecer.

**Opción B (recomendada):** Añadir 1 regla en seed para price:

```sql
INSERT INTO sales_objection_rules (questionnaire_id, question_id, answer_option_id, objection_type, confidence, rule_code)
VALUES (
  '<questionnaire_id>',
  'c0000000-0007-0000-0001-000000000006'::uuid,  -- BUD_CURRENT_SPEND
  'd0000000-0007-0006-0001-000000000002'::uuid,  -- under_3k
  'price',
  0.55,
  'bud_spend_low_price'
);
```

El test usa BUD_CURRENT_SPEND = under_3k → price se dispara.

**Implementar:** Opción B en el seed + Opción A en recalibration. (G) con `< 25` hace que price aparezca cuando budget es bajo y no hay regla. La regla BUD_CURRENT_SPEND=under_3k→price cubre el test actual (budget=35) si se añade al seed.

---

## 7. Checklist accionable

| # | Acción | Ruta |
|---|--------|------|
| 1 | Crear migración schema base | `supabase/migrations/20250322000001_sales_schema_base.sql` |
| 2 | Crear migración seed v1 | `supabase/migrations/20250322000002_sales_seed_v1.sql` |
| 3 | Crear migración RPC core | `supabase/migrations/20250322000003_sales_rpc_core.sql` |
| 4 | Crear migración auth helper | `supabase/migrations/20250322000004_sales_auth_helper.sql` |
| 5 | Crear migración RLS | `supabase/migrations/20250322000005_sales_rls.sql` |
| 6 | Copiar objection recalibration | `.claude/.../20260318000001_*` → `supabase/migrations/20250322000006_sales_objection_recalibration.sql` |
| 7 | Copiar recommendations redesign | `.claude/.../20260318000002_*` → `supabase/migrations/20250322000007_sales_recommendations_redesign.sql` |
| 8 | Copiar performance indexes | `.claude/.../20260318000003_*` → `supabase/migrations/20250322000008_sales_performance_indexes.sql` |
| 9 | Ajustar 006–008: cambiar timestamp en nombre | 20260318 → 20250322 |
| 10 | Añadir regla price en seed (BUD_CURRENT_SPEND=under_3k) | En 20250322000002_sales_seed_v1.sql |
| 10b | (G) en recalibration: budget=0 → budget<25 | En 20250322000006, línea 192 |
| 11 | Copiar test pipeline | `.claude/.../scripts/test_sales_pipeline.sql` → `scripts/test_sales_pipeline.sql` |
| 12 | Copiar módulo sales | `.claude/.../src/modules/sales/*.ts` → `src/modules/sales/` |
| 13 | Ejecutar migraciones | `supabase db push` o `supabase migration up` |
| 14 | Ejecutar test | `scripts/test_sales_pipeline.sql` en SQL Editor |
| 15 | Verificar integración en App | Rutas /admin/sales o similar si existen |

---

## 8. Dependencias del schema base

Tablas a crear en 20250322000001:

- `sales_questionnaires`
- `sales_question_sections`
- `sales_questions`
- `sales_answer_options`
- `sales_scoring_rules`
- `sales_objection_rules`
- `sales_sessions`
- `sales_session_answers`
- `sales_session_objections`
- `sales_session_events`
- `sales_session_recommendations`
- `sales_session_question_snapshots`

Enums: `sales_session_status`, `sales_objection_type`, `sales_question_type`

FK: `platform_organizations` (tenant), `profiles` (auth.users vía profiles.user_id). Auth: `is_admin()` / `user_roles`.
