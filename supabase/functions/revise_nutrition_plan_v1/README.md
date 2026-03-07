# revise_nutrition_plan_v1

Crea una revisión de plan con ajustes manuales controlados. Solo técnico o admin_org.

## Límites duros

- N no puede bajar >30% si yield alto (≥2500 kg/ha) y variedad intensiva (compacto/compuesto/f1)
- K2O no puede bajar >25%
- No permitir saltarse encalado en suelos ácidos (bloqueo activo)

## Request

```json
{
  "plan_id_original": "uuid",
  "idempotency_key": "rev_plan_xxx_20250301_abc",
  "revision_reason": "Ajuste por restricción de caja",
  "manual_adjustments_json": {
    "nutrientes": {
      "N_kg_ha": { "delta": -15, "reason_code": "CASH_CONSTRAINT" },
      "K2O_kg_ha": { "delta": -20, "reason_code": "HIGH_YIELD_RISK" }
    },
    "cronograma": { "shift_days": 7, "reason_code": "RAINFALL_FORECAST" }
  }
}
```

## Response

```json
{
  "plan": { "id": "...", "plan_revision_of": "original_id", "estado": "recommended", ... },
  "original_superseded": true
}
```

## Idempotencia

- `unique(plan_revision_of, revision_idempotency_key)`
- Mismo (plan_id_original, idempotency_key) retorna la revisión existente.
