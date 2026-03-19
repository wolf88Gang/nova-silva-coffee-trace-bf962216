# Sales Intelligence — Live Parity Plan

> Cómo pasar del seed mínimo (20250322000009) a paridad completa con la BD en producción.

---

## 1. Usar `scripts/export_sales_seed.sql`

### Paso 1: Ejecutar en Supabase SQL Editor (BD en vivo)

1. Conectarse a la BD de producción (Supabase Dashboard → SQL Editor).
2. Copiar el contenido de `scripts/export_sales_seed.sql`.
3. Ejecutar cada bloque (o todo el script).
4. Exportar los resultados como CSV o copiar las filas.

### Paso 2: Queries incluidas

| # | Tabla | Columnas exportadas |
|---|-------|--------------------|
| 1 | `sales_questions` | id, questionnaire_id, section_id, code, text, help, question_type, position, is_required, metadata, is_active |
| 2 | `sales_answer_options` | id, question_id, value, label, weight, position, is_active |
| 3 | `sales_scoring_rules` | id, questionnaire_id, question_id, answer_option_id, score_dimension, weight, rule_code |
| 4 | `sales_objection_rules` | id, questionnaire_id, question_id, answer_option_id, objection_type, confidence, rule_code |

Filtro: `questionnaire_id = (SELECT id FROM sales_questionnaires WHERE code = 'nova_sales_intel' AND version = 1)`.

---

## 2. Transformar datos exportados en migración

### Reglas de transformación

1. **Mantener UUIDs** de la BD en vivo para `id`, `questionnaire_id`, `section_id`, `question_id`, `answer_option_id`.
2. **Estructura INSERT**:
   - Usar `INSERT INTO ... SELECT ... FROM (VALUES (...)) AS v(...) CROSS JOIN ...` o `INSERT ... VALUES (...), (...)`.
3. **Idempotencia**:
   - `sales_questions`, `sales_answer_options`: `ON CONFLICT (id) DO UPDATE SET ...`
   - `sales_scoring_rules`, `sales_objection_rules`: `WHERE NOT EXISTS (SELECT 1 FROM ... WHERE rule_code = v.rule_code)` o `ON CONFLICT` si existe UNIQUE.
4. **Evitar CTEs JSON gigantes**: preferir filas `VALUES` o `COPY` desde CSV.
5. **Orden de inserción**: questions → answer_options → scoring_rules → objection_rules (por FKs).

### Herramienta opcional

Script que lea CSV y genere SQL:

```bash
# Ejemplo (pseudocódigo)
node scripts/csv_to_seed_migration.js \
  --questions questions.csv \
  --options options.csv \
  --scoring scoring.csv \
  --objections objections.csv \
  --output supabase/migrations/20250323000001_sales_seed_v1_live.sql
```

---

## 3. Nombre sugerido para la migración

```
supabase/migrations/20250323000001_sales_seed_v1_live.sql
```

Alternativa: `20250323000001_sales_seed_v1_full_live.sql` si se quiere distinguir del seed mínimo.

---

## 4. Orden de aplicación

```
20250322000001  sales_schema_base
20250322000002  sales_seed_v1          ← questionnaire + 8 sections
20250322000003  sales_rpc_core
20250322000004  sales_auth_helper
20250322000005  sales_rls
20250322000006  sales_objection_recalibration
20250322000007  sales_recommendations_redesign
20250322000008  sales_performance_indexes
20250322000009  sales_seed_v1_full      ← seed mínimo (28Q, 32O, 22S, 6R)
20250323000001  sales_seed_v1_live      ← NUEVO: reemplaza contenido de 000009
```

**Importante**: La migración `20250323000001` debe **reemplazar** el contenido insertado por `20250322000009` (questions, options, scoring, objections). Opciones:

- **A) Reemplazo directo**: `20250323000001` hace `DELETE FROM sales_* WHERE questionnaire_id = ...` y luego `INSERT` con datos live. Riesgo: borra el seed mínimo si 000009 ya corrió.
- **B) Upsert idempotente**: `20250323000001` solo hace `INSERT ... ON CONFLICT DO UPDATE` para todas las filas. Las filas del seed mínimo se sobrescriben; las nuevas se añaden. **Recomendado**.
- **C) Eliminar 000009**: Borrar `20250322000009` y que `20250323000001` sea el único seed. Requiere que 000009 no se haya aplicado en producción.

---

## 5. Riesgos antes de reemplazar el seed mínimo

| Riesgo | Mitigación |
|--------|------------|
| **UUIDs distintos** entre live y seed mínimo | El seed mínimo usa `c0000000-*`, `d0000000-*`. Si live usa otros UUIDs, `scripts/test_sales_pipeline.sql` fallará. Decisión: mantener UUIDs de live y actualizar el test, o forzar UUIDs del test en la migración live (menos recomendable). |
| **Preguntas/opciones faltantes en live** | Verificar que live tenga al menos las 28 preguntas y 32 opciones usadas por el test. Si no, el test seguirá fallando. |
| **Reglas de scoring/objection incompletas** | El pipeline puede dar scores/objections distintos. Ejecutar `scripts/test_sales_pipeline.sql` tras aplicar la migración y comparar con resultados esperados. |
| **Secciones con códigos distintos** | `sales_question_sections` en 000002 usa `context`, `pain`, etc. Live debe usar los mismos `code` para que el mapeo questions→sections funcione. |
| **Migración ya aplicada en prod** | Si `20250322000009` ya corrió, no se puede "eliminar". Usar opción B (upsert) en `20250323000001`. |

---

## 6. Checklist pre-despliegue

- [ ] Exportar las 4 tablas desde live con `scripts/export_sales_seed.sql`.
- [ ] Verificar que `questionnaire_id` y `section_id` coinciden con los de `20250322000002`.
- [ ] Generar migración con INSERT idempotente (ON CONFLICT / WHERE NOT EXISTS).
- [ ] Probar en BD local: `supabase db reset` (o equivalente) y ejecutar `scripts/test_sales_pipeline.sql`.
- [ ] Si el test usa UUIDs fijos, decidir: actualizar test a UUIDs de live, o mapear live → UUIDs del test en la migración.
- [ ] Revisar que no haya JSON/CTEs excesivamente grandes (límite de tamaño de migración).
