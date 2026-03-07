# log_nutrition_execution_v1

Edge Function para registrar ejecución de fertilización contra un plan nutricional.

## Requisitos

- JWT válido (Authorization: Bearer \<token\>)
- Usuario con `organization_id` en profiles
- Plan existente en `nutricion_planes` perteneciente a la org del usuario

## Request

```json
{
  "plan_id": "uuid",
  "fecha_aplicacion": "2025-03-01",
  "tipo_aplicacion": "edafica",
  "dosis_aplicada_json": {
    "nutrientes": {
      "N_kg_ha": 45,
      "P2O5_kg_ha": 10,
      "K2O_kg_ha": 40
    },
    "productos": [],
    "metodo": {}
  },
  "evidencias": ["https://storage.../foto.jpg"],
  "costo_real": 150.50,
  "idempotency_key": "exec_plan_xxx_20250301_abc123"
}
```

## Response

```json
{
  "aplicacion": { "id": "...", "fecha_aplicacion": "2025-03-01", ... },
  "execution_pct_by_nutrient": { "N": 25, "P2O5": 22, "K2O": 25, "otros": 0 },
  "execution_pct_total": 25.5,
  "estado": "in_execution"
}
```

## Idempotencia

- `unique(plan_id, idempotency_key)` en `nutricion_aplicaciones`
- Si existe, retorna la ejecución existente sin duplicar

## Tests

- Primera ejecución → estado `in_execution`
- Acumulación suma correctamente
- execution_pct no supera 100
- Idempotencia
