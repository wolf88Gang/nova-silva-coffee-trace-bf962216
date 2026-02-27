# Checklist de pruebas — ng-impact-recompute

## Hardening (antes de probar)

```bash
supabase secrets set NG_RECOMPUTE_SECRET="pon_un_token_largo_random"
```

## A) Inserta un diagnóstico (usuario)

```sql
insert into public.ng_diagnostics(organization_id, parcela_id, issue_code, incidence_pct, severity_scale, phenology_index)
values (public.get_user_organization_id(auth.uid()), gen_random_uuid(), 'broca', 10, 1, 0.5)
returning id;
```

## B) Verifica evento en cola con columnas nuevas

```sql
select id, event_type, observed_at, processing_started_at, processed_at, processing_status, processing_error, payload
from public.agro_events
where event_type='recompute_requested'
order by observed_at desc
limit 10;
```

## C) Ejecuta Edge Function

```bash
curl -s -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/ng-impact-recompute' \
  -H "Content-Type: application/json" \
  -H "x-ng-recompute-secret: <TOKEN>" \
  -d '{"limit":50}'
```

## D) Verifica que el evento quedó procesado

```sql
select id, processed_at, processing_status, processing_error
from public.agro_events
where event_type='recompute_requested'
order by observed_at desc
limit 10;
```

## E) Verifica impactos y cache

```sql
select id, issue_code, expected_loss_pct, damage_factor, inputs
from public.ng_impacts
order by created_at desc
limit 10;

select *
from public.agro_state_parcela
order by updated_at desc
limit 10;
```

---

## Tests críticos (steal lock + idempotencia)

### Test 1: Steal lock

1. Inserta diagnóstico para encolar evento.
2. Simula lock colgado:
```sql
update public.agro_events
set processing_started_at = now() - interval '30 minutes',
    processing_status = 'processing'
where event_type='recompute_requested'
  and processed_at is null
order by observed_at desc
limit 1;
```
3. Ejecuta la función. Debe procesarlo (steal).

### Test 2: Idempotencia

Ejecuta la función dos veces seguidas. La segunda debe marcar `already_done` y NO crear otro ng_impacts.
