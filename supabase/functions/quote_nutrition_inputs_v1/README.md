# quote_nutrition_inputs_v1

Sugiere proveedores cercanos o genera cotización a partir del plan nutricional.

## Sin supplier_id: sugerencia de proveedores

Retorna top 3 proveedores ordenados por distancia Haversine al centroide de la parcela.

```json
{
  "suggested_suppliers": [
    { "id": "...", "nombre": "...", "distancia_km": 5.2, "telefono": "..." }
  ],
  "parcela_centroid": { "lat": 10.0, "lng": -84.0 }
}
```

## Con supplier_id: cotización

Traduce demanda_final a líneas de producto según:
- **NO_KCL**: usa Sulfato de Potasio en lugar de KCl
- **Zona baja**: prefiere nitratos sobre urea
- **ORGANIC_ONLY**: (futuro) filtra productos orgánicos

## Request

```json
{
  "plan_id": "uuid",
  "supplier_id": "uuid",
  "constraints": ["NO_KCL"],
  "idempotency_key": "quote_plan_xxx_sup_yyy_20250301_abc"
}
```

## Idempotencia

- `unique(plan_id, supplier_id, quote_idempotency_key)`
- Mismo key retorna cotización existente.
