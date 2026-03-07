# Prompt Cursor – Edge Function generate_nutrition_plan_v2

Crear la Edge Function `generate_nutrition_plan_v2` en `supabase/functions/generate_nutrition_plan_v2/` con los siguientes requisitos.

---

## Contratos TypeScript

### Entrada (Request body)

```typescript
interface GeneratePlanRequest {
  parcela_id: string;
  organization_id: string;
  idempotency_key?: string;
  inputs?: {
    yield_estimado_kg_ha?: number;
    variedad?: string;
    altitud_msnm?: number;
    edad_anios?: number;
    estres_fitosanitario?: 'bajo' | 'medio' | 'alto';
    suelo?: { pH?: number; MO?: number; P?: number; K?: number; Al?: number; CIC?: number };
    organicos?: {
      materia_organica_pct?: number;
      cobertura_viva?: boolean;
      podas_recientes?: boolean;
      compost_anual_kg_ha?: number;
    };
  };
}
```

### Salida (Response)

```typescript
interface GeneratePlanResponse {
  plan_id: string;
  estado: 'recommended' | 'error';
  receta_canonica_json: Record<string, unknown>;
  explain_json?: Record<string, unknown>;
  nivel_confianza?: 'alto' | 'medio' | 'bajo';
  hash_receta?: string;
  error?: string;
}
```

---

## 19 Submotores (en orden de ejecución)

1. **validate_input** – Validar parcela_id, organization_id; verificar que parcela existe y pertenece al org
2. **idempotency_check** – Si idempotency_key existe, buscar plan con mismo key; si existe, retornar plan existente
3. **fetch_parcela** – Obtener parcela (área_ha, variedad, altitud, etc.) desde Supabase
4. **fetch_yield_estimate** – Obtener yield_estimates más reciente para parcela; fallback a input o default 2500
5. **fetch_variety_factor** – Consultar ag_variedades por variedad; factor_demanda_base
6. **fetch_altitude_params** – Consultar ag_parametros_altitud por zona (baja/media/alta según altitud)
7. **fetch_fenologic_params** – Consultar ag_parametros_fenologicos por zona
8. **fetch_soil_rules** – Consultar ag_reglas_suelo (ruleset 1.0.0) para evaluar suelo
9. **calc_coefficients** – Calcular coeficientes edad, estrés, altitud
10. **calc_extraction** – Extracción CENICAFE por tonelada (ag_nutrients o constantes)
11. **calc_absorption** – Aplicar eficiencias de absorción
12. **calc_organic_contribution** – Estimar aportes orgánicos (MO, cobertura, podas, compost)
13. **apply_soil_adjustments** – Aplicar reglas de suelo (pH, Al, P, K, MO, CIC)
14. **liebig_limitante** – Identificar nutriente limitante (Ley de Liebig)
15. **calc_fertilizer_doses** – Convertir demanda a dosis de fertilizantes (ag_fertilizers)
16. **build_fenologic_calendar** – Construir 4 aplicaciones según ag_parametros_fenologicos
17. **build_receta_canonica** – Armar JSON canónico con inputs, demanda, fertilizantes, fases, explain
18. **compute_hash** – Hash SHA-256 de receta canónica (para trazabilidad)
19. **persist_plan** – INSERT en nutricion_planes; INSERT en ag_plan_events (event_type: 'generated')

---

## Flujo de ejecución

```
validate_input → idempotency_check → [si no existe]
  fetch_parcela → fetch_yield_estimate → fetch_variety_factor → fetch_altitude_params →
  fetch_fenologic_params → fetch_soil_rules → calc_coefficients → calc_extraction →
  calc_absorption → calc_organic_contribution → apply_soil_adjustments →
  liebig_limitante → calc_fertilizer_doses → build_fenologic_calendar →
  build_receta_canonica → compute_hash → persist_plan
```

---

## Reglas

### Idempotencia
- Si `idempotency_key` está presente y existe un plan con `parcela_id` + `idempotency_key`, retornar ese plan sin recalcular.
- Usar índice único `idx_nutricion_planes_idempotency` (parcela_id, idempotency_key).

### Tolerancia a datos incompletos
- Si parcela no tiene variedad: usar 'Caturra' por defecto.
- Si no hay yield_estimate: usar 2500 kg/ha o el valor de inputs.
- Si ag_nutrients está vacío: usar constantes del frontend (nutritionDemandEngine.ts).
- Si ag_fertilizers está vacío: recomendar fórmula genérica "18-6-12".
- Si falla un submotor no crítico: continuar con valores por defecto y marcar nivel_confianza = 'bajo'.

### Persistencia
- INSERT en `nutricion_planes` con: organization_id, parcela_id, ruleset_version='1.0.0', engine_version='nutrition_v2', idempotency_key, receta_canonica_json, hash_receta, explain_json, nivel_confianza, estado='recommended'.
- INSERT en `ag_plan_events` con: plan_id, event_type='generated', payload_json con resumen.

### Autenticación
- Verificar JWT. Obtener organization_id del usuario desde profiles o del body.
- RLS en nutricion_planes filtra por organization_id.

---

## Estructura de archivos sugerida

```
supabase/functions/generate_nutrition_plan_v2/
  index.ts           # Handler HTTP, orquestación
  submotors/
    validate.ts
    fetch.ts         # fetch_parcela, fetch_yield, fetch_variety, etc.
    calc.ts          # calc_extraction, calc_absorption, etc.
    build.ts         # build_receta_canonica, build_fenologic_calendar
    persist.ts
  types.ts           # Interfaces
  constants.ts       # EXTRACTION_PER_TON, ABSORPTION_EFFICIENCY (fallback)
```

---

## Invocación

```
POST /functions/v1/generate_nutrition_plan_v2
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "parcela_id": "uuid",
  "organization_id": "uuid",
  "idempotency_key": "opcional",
  "inputs": {
    "yield_estimado_kg_ha": 2500,
    "variedad": "Caturra",
    "altitud_msnm": 1400,
    "edad_anios": 6,
    "estres_fitosanitario": "bajo"
  }
}
```
