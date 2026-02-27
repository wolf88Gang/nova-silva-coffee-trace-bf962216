-- ============================================
-- Nova Silva: agro_events queue hardening
-- Add processed_at + processing_started_at columns
-- ============================================

ALTER TABLE public.agro_events
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS processing_status text NULL,
  ADD COLUMN IF NOT EXISTS processing_error text NULL;

-- Índice para workers: sacar rápido no-procesados
CREATE INDEX IF NOT EXISTS idx_agro_events_queue_pick
  ON public.agro_events (event_type, observed_at ASC)
  WHERE event_type = 'recompute_requested' AND processed_at IS NULL;

-- Índice para evitar locks eternos: buscar "en proceso" viejos (opcional)
CREATE INDEX IF NOT EXISTS idx_agro_events_queue_stale
  ON public.agro_events (event_type, processing_started_at ASC)
  WHERE event_type = 'recompute_requested' AND processed_at IS NULL AND processing_started_at IS NOT NULL;

-- Backfill opcional: si ya usabas payload.processed_at, copiarlo a columna
UPDATE public.agro_events
SET processed_at = nullif(payload->>'processed_at', '')::timestamptz
WHERE processed_at IS NULL
  AND payload ? 'processed_at';

-- Backfill status/error desde payload si existía (opcional)
UPDATE public.agro_events
SET processing_status = nullif(payload->>'status', '')
WHERE processing_status IS NULL
  AND payload ? 'status';

UPDATE public.agro_events
SET processing_error = nullif(payload->>'error_message', '')
WHERE processing_error IS NULL
  AND payload ? 'error_message';
