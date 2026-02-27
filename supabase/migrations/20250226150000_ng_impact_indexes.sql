-- Índices para ng-impact-recompute: idempotencia y cola
-- Sin arrepentimientos.

-- Idempotencia: búsqueda por inputs->>'diagnostic_id' en ng_impacts
CREATE INDEX IF NOT EXISTS idx_ng_impacts_diag_id_rules_v1
  ON public.ng_impacts ((inputs->>'diagnostic_id'))
  WHERE method = 'rules_v1';

-- Cola: eventos recompute_requested por tipo y fecha
CREATE INDEX IF NOT EXISTS idx_agro_events_recompute_unprocessed
  ON public.agro_events (event_type, observed_at DESC)
  WHERE event_type = 'recompute_requested';
