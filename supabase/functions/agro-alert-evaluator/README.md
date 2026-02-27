# agro-alert-evaluator

Evalúa `ng_impacts` contra `agro_alert_rules` y crea `agro_alerts`.

## Secrets

```bash
supabase secrets set AGRO_ALERT_SECRET="<token_largo_random>"
```

## Invocación

```bash
curl -s -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/agro-alert-evaluator' \
  -H "Content-Type: application/json" \
  -H "x-agro-alert-secret: <EL_MISMO_TOKEN>" \
  -d '{"limit":200,"since_hours":72}'
```

## Reglas soportadas (MVP)

- **ng_expected_loss_threshold**: `params: { issue_code, threshold, window_days }` — alerta si `expected_loss_pct >= threshold`
- **ng_damage_factor_threshold**: `params: { issue_code?, threshold }` — alerta si `damage_factor >= threshold`

## Crear regla de ejemplo

```sql
INSERT INTO public.agro_alert_rules (organization_id, rule_key, params, severity)
VALUES (
  '<org_uuid>',
  'ng_expected_loss_threshold',
  '{"issue_code":"broca","threshold":0.15,"window_days":14}'::jsonb,
  'warning'
);
```
