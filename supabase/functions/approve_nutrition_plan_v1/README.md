# approve_nutrition_plan_v1

Aprueba un plan nutricional. Solo usuarios con rol `tecnico`, `admin_org`, `admin` o `cooperativa`.

## Request

```json
{
  "plan_id": "uuid",
  "approval_notes": "Revisado en campo, dosis adecuadas"
}
```

## Response

```json
{
  "plan": { "id": "...", "estado": "approved_tecnico", ... }
}
```

## Eventos

- `ag_plan_events`: event_type `approved`, payload con approval_notes y approved_by.
