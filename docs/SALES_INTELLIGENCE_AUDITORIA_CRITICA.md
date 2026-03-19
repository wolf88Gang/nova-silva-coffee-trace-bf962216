# Auditoría crítica — Módulo Sales Intelligence Nova Silva

> Directo. Técnico. Sin complacencia.

---

## 1. Consistencia del backend

### Diseño coherente para producción

**No verificable desde el repo.** Las migraciones en `.claude/worktrees/focused-hugle/supabase/migrations/` son **incrementales** y asumen que ya existen:

- Tablas: `sales_sessions`, `sales_session_scores`, `sales_questions`, `sales_answer_options`, `sales_scoring_rules`, `sales_objection_rules`, `sales_session_objections`, `sales_session_events`, `sales_session_recommendations`, `sales_session_question_snapshots`, `sales_session_answers`, `sales_questionnaires`, `sales_question_sections`
- Funciones: `fn_sales_detect_objections`, `fn_sales_recalculate_scores`, `fn_sales_create_session`, `fn_sales_save_answer`, `fn_sales_finalize_session`
- Helpers: `_ensure_internal`
- Auth: `is_admin()` / `user_roles` (no admin_panel_roles)

**Ninguna de estas definiciones estaba en el repositorio.** (Ahora sí: ver supabase/migrations/20250322*.) El schema base, el seed y `fn_sales_detect_objections` no existen en el código. O están en otro branch, en otro repo, o en migraciones aplicadas directamente en Supabase sin versionar.

### Contradicciones en el relato de implementación

| Afirmado | Contradicción |
|----------|---------------|
| "Seed desplegado en la BD" | No hay seed SQL en el repo. `scripts/test_sales_pipeline.sql` usa UUIDs hardcodeados (`c0000000-0001-...`, `d0000000-0001-...`) que asumen un seed existente con esos IDs. |
| "8 secciones, 49 preguntas, 112 opciones, 55 scoring rules, 24 objection rules" | No hay forma de verificar esto desde el código. No hay `INSERT` en `sales_*` para catálogos. |
| "Migraciones aplicadas" | Las migraciones `20260318*` están en `.claude/worktrees/focused-hugle/` y **no** en `supabase/migrations/` del workspace principal. Si el proyecto usa `supabase db push` o similar, esas migraciones pueden no estar aplicadas. |
| "RLS aplicada a tablas sales_*" | No hay `CREATE POLICY` para ninguna tabla `sales_*` en el repo. |

### Señales de que algo pudo haberse "reportado" pero no verificado

1. **Seed**: Se asume que existe porque el test usa UUIDs; no hay comprobación de que el seed esté cargado.
2. **Reglas**: Sin `fn_sales_detect_objections` en el repo, no se puede verificar que las reglas estén correctamente conectadas.
3. **RLS**: No hay políticas en el código; se reporta como aplicada sin evidencia visible.
4. **Pipeline**: El test usa `set_config` para simular JWT; si `_ensure_internal` no existe o no está correctamente implementado, el test fallaría en entorno real.

---

## 2. Scoring

### Escala abierta (score_total = 271)

- Los scores son **aditivos** (suma de pesos de reglas). No hay techo definido.
- `score_total = 271` es coherente con el diseño: suma de `score_pain` (82) + `score_maturity` (18) + `score_objection` (50) + `score_urgency` (35) + `score_fit` (51) + `score_budget_readiness` (35) = 271.

### ¿Conviene normalizar?

**Sí, para UI y priorización comercial.** Riesgos de dejarlo así:

1. **Interpretación**: Un comercial no sabe si 271 es "alto" o "bajo" sin contexto.
2. **Comparación**: Si añades preguntas o cambias reglas, la escala cambia. No hay forma de comparar sesiones de distintas versiones.
3. **Priorización**: No hay percentiles ni ranking. "Score total" no sirve para ordenar oportunidades sin un rango conocido.
4. **Thresholds**: El `FlowEngine` usa umbrales fijos (40, 30, 25, 20). Si la escala crece, esos umbrales pueden quedar obsoletos.

**Recomendación**: Definir un rango máximo teórico (ej. suma de todos los pesos posibles) y normalizar a 0–100 para UI, o usar percentiles por cohorte.

---

## 3. Doble fuente de verdad: sales_sessions vs sales_session_scores

### Situación actual

- **`sales_sessions.score_*`**: Columnas en la sesión. El frontend usa esto (`SalesSessionService.getSessionSummary`, `FlowEngineLoader`).
- **`sales_session_scores`**: Mencionada en `20260318000003_sales_performance_indexes.sql` como "dual-write — table kept for external audit consumers". No se ve en el código cómo se escribe.

### Riesgo

1. **Drift**: Si `fn_sales_recalculate_scores` escribe en ambos pero con lógica distinta o en momentos distintos, pueden divergir.
2. **Fuente**: El frontend consume solo `sales_sessions`. Si `sales_session_scores` es la "auditoría", puede que nadie la use para validar.

### Si hubiera que simplificar

**Eliminar `sales_session_scores`** si no hay consumidores externos reales. Mantener `sales_sessions.score_*` como única fuente. Si se necesita auditoría, añadir un snapshot de scores en `sales_session_events` al finalizar (payload ya existe en `scores_recalculated`).

---

## 4. Objeciones: ausencia de price

### Resultados del test

- Detectadas: trust, complexity, compliance_fear, competition.
- No detectada: price.

### Hipótesis técnicas

1. **Reglas**: `price` solo aparece si una regla en `sales_objection_rules` dispara `objection_type = 'price'` para alguna de las respuestas del test. No hay definición de reglas en el repo; no se puede verificar.
2. **Inferencia (G)**: `fn_sales_recalibrate_objections` inserta `price` cuando `score_budget_readiness = 0` **y** no hay regla de price. En el test, `score_budget_readiness = 35` → (G) no se ejecuta.
3. **Boosts (B) y (C)**: Solo aumentan la confianza de objeciones **ya existentes** de tipo `timing` o `price`. No crean objeciones nuevas.
4. **Conclusión**: Si ninguna regla dispara `price` con las respuestas del test, y (G) no aplica porque budget ≠ 0, la objeción `price` no aparece. Es esperable.

### Qué revisar primero

1. **Reglas**: `SELECT * FROM sales_objection_rules WHERE objection_type = 'price'` — ver qué `question_id` y `answer_option_id` disparan price.
2. **Respuestas del test**: Comprobar si alguna de las respuestas de BUD_* o de otra sección dispara una regla de price.
3. **Diseño del test**: Si el test debía incluir price, hay que añadir respuestas que disparen una regla de price o usar un escenario con `score_budget_readiness = 0` para forzar (G).

---

## 5. RLS y seguridad

### "RLS solo internos"

**No verificable desde el repo.** No hay políticas RLS para tablas `sales_*` en el código. Si existen, están en migraciones no versionadas o en otro lugar.

### Qué verificar para no dejar fugas

1. **Políticas**: `SELECT * FROM pg_policies WHERE tablename LIKE 'sales_%'` — confirmar que existen.
2. **RLS activo**: `SELECT relname, relrowsecurity FROM pg_class WHERE relname LIKE 'sales_%'` — `relrowsecurity = true`.
3. **Bypass**: Las funciones `fn_sales_*` son `SECURITY DEFINER`; ejecutan con privilegios del owner. Si no validan `_ensure_internal` correctamente, cualquier usuario autenticado podría llamarlas.
4. **`_ensure_internal`**: Comprueba `is_admin()` → `user_roles` donde `role IN ('admin','superadmin')`. No usa admin_panel_roles.

### Error típico

**Políticas que permiten SELECT a `authenticated` sin filtrar por `organization_id`.** Si `sales_sessions` tiene `organization_id` (FK a platform_organizations), la política debe filtrar por tenant o permitir solo admins vía `is_admin()`.

---

## 6. Snapshot / auditoría

### Snapshot actual

`sales_session_question_snapshots` guarda en `fn_sales_finalize_session`:

- `question_id`, `question_code`, `question_text`, `question_type`, `section_code`, `section_title`
- `answer_option_id`, `answer_option_value`, `answer_option_label`

### Limitaciones

1. **Valor en el momento**: Si `sales_answer_options` cambia después, el snapshot no refleja el valor que vio el usuario al responder.
2. **Sin timestamp por respuesta**: No se sabe cuándo se dio cada respuesta.
3. **Sin historial de scores**: No hay trazabilidad de cómo evolucionaron los scores durante la sesión.
4. **Reglas no auditadas**: Los pesos y las reglas que generaron los scores no se guardan. No se puede reproducir el cálculo de forma independiente.

### Para trazabilidad fuerte

1. Guardar en el snapshot el `value` y `label` de la opción **en el momento del snapshot** (no solo el ID).
2. Añadir `answered_at` en `sales_session_answers` o en el evento `answer_saved`.
3. Incluir en el evento `finalized` un payload con: scores finales, reglas aplicadas (IDs o nombres), version del questionnaire.
4. Considerar un snapshot de `sales_objection_rules` y `sales_scoring_rules` por versión de questionnaire para auditoría.

---

## 7. Queries SQL de verificación

Ejecutar en Supabase SQL Editor (o equivalente) con un usuario con permisos suficientes.

### Q1 — Seed existe

```sql
-- Verificar que el catálogo está poblado
SELECT
  (SELECT COUNT(*) FROM sales_question_sections WHERE is_active) AS sections,
  (SELECT COUNT(*) FROM sales_questions WHERE is_active) AS questions,
  (SELECT COUNT(*) FROM sales_answer_options WHERE is_active) AS options,
  (SELECT COUNT(*) FROM sales_scoring_rules) AS scoring_rules,
  (SELECT COUNT(*) FROM sales_objection_rules) AS objection_rules,
  (SELECT COUNT(*) FROM sales_questionnaires WHERE is_active) AS questionnaires;
```

### Q2 — Reglas conectadas

```sql
-- Reglas de scoring sin answer_option_id válido o sin question_id
SELECT 'scoring_orphan' AS check_type, id, question_id, answer_option_id, score_dimension
FROM sales_scoring_rules sr
WHERE (sr.answer_option_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sales_answer_options ao
  WHERE ao.id = sr.answer_option_id AND ao.is_active
))
   OR NOT EXISTS (SELECT 1 FROM sales_questions q WHERE q.id = sr.question_id AND q.is_active)
LIMIT 5;

-- Reglas de objection sin answer_option_id válido
SELECT 'objection_orphan' AS check_type, id, objection_type, answer_option_id
FROM sales_objection_rules sor
WHERE answer_option_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sales_answer_options ao
    WHERE ao.id = sor.answer_option_id AND ao.is_active
  )
LIMIT 5;
```

*(Ajustar nombres de columnas si el schema usa `score_dimension` u otro; las tablas de reglas pueden tener estructura distinta.)*

### Q3 — RLS existe

```sql
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = c.relname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname LIKE 'sales_%'
  AND c.relkind = 'r'
ORDER BY c.relname;
```

### Q4 — Pipeline escribe lo esperado

```sql
-- Para una sesión finalizada reciente, verificar que tiene scores, objeciones, recomendaciones y eventos
WITH latest AS (
  SELECT id FROM sales_sessions
  WHERE status = 'completed' AND deleted_at IS NULL
  ORDER BY updated_at DESC LIMIT 1
)
SELECT
  (SELECT score_total FROM sales_sessions WHERE id = (SELECT id FROM latest)) AS has_scores,
  (SELECT COUNT(*) FROM sales_session_objections WHERE session_id = (SELECT id FROM latest)) AS objection_count,
  (SELECT COUNT(*) FROM sales_session_recommendations WHERE session_id = (SELECT id FROM latest)) AS recommendation_count,
  (SELECT COUNT(*) FROM sales_session_events WHERE session_id = (SELECT id FROM latest)) AS event_count,
  (SELECT COUNT(*) FROM sales_session_question_snapshots WHERE session_id = (SELECT id FROM latest)) AS snapshot_count;
```

### Q5 — Drift entre sales_sessions y sales_session_scores

```sql
-- Si sales_session_scores existe y tiene la misma estructura
SELECT ss.id,
       ss.score_total AS ss_total,
       sss.score_total AS sss_total,
       ss.score_total - COALESCE(sss.score_total, 0) AS drift
FROM sales_sessions ss
LEFT JOIN sales_session_scores sss ON sss.session_id = ss.id
WHERE ss.status = 'completed'
  AND ss.deleted_at IS NULL
  AND (sss.session_id IS NULL OR ss.score_total != sss.score_total)
LIMIT 10;
```

### Q6 — Recomendaciones generadas

```sql
-- Sesiones completadas sin recomendaciones (deberían tener 4: pitch, demo, plan, next_step)
SELECT ss.id, ss.updated_at,
       (SELECT COUNT(*) FROM sales_session_recommendations WHERE session_id = ss.id) AS rec_count
FROM sales_sessions ss
WHERE ss.status = 'completed'
  AND ss.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM sales_session_recommendations r
    WHERE r.session_id = ss.id AND r.recommendation_type IN ('pitch','demo','plan','next_step')
  )
LIMIT 5;
```

### Q7 — Objeciones generadas

```sql
-- Sesiones con score_objection > 0 o con objeciones detectadas
SELECT ss.id,
       ss.score_objection,
       (SELECT COUNT(*) FROM sales_session_objections WHERE session_id = ss.id) AS objection_rows,
       (SELECT jsonb_agg(objection_type) FROM (
         SELECT objection_type FROM sales_session_objections
         WHERE session_id = ss.id
       ) o) AS objection_types
FROM sales_sessions ss
WHERE ss.status = 'completed'
  AND ss.deleted_at IS NULL
ORDER BY ss.updated_at DESC
LIMIT 5;
```

### Q8 — Eventos del pipeline

```sql
-- Verificar secuencia de eventos para una sesión finalizada
SELECT event_type, payload, created_at
FROM sales_session_events
WHERE session_id = (
  SELECT id FROM sales_sessions
  WHERE status = 'completed' AND deleted_at IS NULL
  ORDER BY updated_at DESC LIMIT 1
)
ORDER BY created_at;
```

---

## 8. Estado final

### LISTO PARA SEGUIR

- Pipeline lógico (recalculate → objections_v2 → recommendations → snapshot) está bien ordenado.
- Recalibración de objeciones (A–G) está documentada y es coherente.
- Recomendaciones por slots (pitch, demo, plan, next_step) con prioridades claras.
- Índices de rendimiento considerados en migración 20260318000003.
- Eliminación del evento redundante `objections_detected` en v2.

### CORREGIR ANTES DE SEGUIR

1. **Migraciones en el repo**: Mover las migraciones `20260318*` de `.claude/worktrees/focused-hugle/` a `supabase/migrations/` del proyecto principal, o documentar explícitamente que están en otro flujo.
2. **Schema y seed versionados**: Incluir en el repo el schema base de `sales_*` y el seed (secciones, preguntas, opciones, reglas). Sin esto, no hay reproducibilidad.
3. **RLS**: Añadir políticas RLS para `sales_*` y versionarlas en migraciones. Verificar que existan con Q3.
4. **`_ensure_internal` y `user_roles`**: Asegurar que `is_admin()` existe y que `user_roles` tiene al menos un usuario con `role IN ('admin','superadmin')`. Si no, los RPC fallarán para usuarios reales.

### DEUDA ACEPTABLE POR AHORA

1. **Doble fuente de verdad** (`sales_sessions` vs `sales_session_scores`): Mantener si hay consumidores; documentar y validar con Q5.
2. **Score sin normalizar**: Aceptable para MVP; planear normalización para UI/comercial.
3. **Snapshot sin historial de scores**: Aceptable; mejorar en siguiente iteración.
4. **Price objection en el test**: Si el diseño del test no incluía respuestas que disparen price, no es un bug. Documentar el criterio para que price aparezca.

---

*Documento generado por auditoría técnica. No sustituye pruebas manuales ni validación en entorno real.*
