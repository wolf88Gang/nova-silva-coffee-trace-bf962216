-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 4: days_to_resolve — TRIGGER + VIEW STRATEGY
-- Migration: 20260322000011
-- =============================================================================
-- DECISION: Use a BEFORE trigger + view approach (not GENERATED, not scheduled).
--
-- WHY NOT GENERATED ALWAYS AS: CURRENT_DATE is volatile → PostgreSQL rejects it
--   in stored generated columns. This was the original bug.
--
-- WHY NOT SCHEDULED FUNCTION: A cron job (pg_cron or Edge Function) running once
--   per day would mean rows are stale for up to 24 hours. No benefit over trigger.
--
-- WHY TRIGGER + VIEW:
--   - Trigger: sets days_to_resolve accurately at INSERT/UPDATE time.
--             Stale after ~1 day if the row is not touched. Acceptable for
--             internal engine state (overdue detection, CA auto-creation).
--   - View (cert_v_my_corrective_actions): recomputes from due_date - CURRENT_DATE
--             at every SELECT. Always fresh. Lovable should use the view.
--
-- RECOMMENDATION: Frontend MUST query cert_v_my_corrective_actions (not the raw
--   table) for any display of days_to_resolve or is_overdue.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Trigger function: cert_set_days_to_resolve
-- Fires BEFORE INSERT or UPDATE OF due_date, status
-- Sets days_to_resolve = due_date - CURRENT_DATE for open actions.
-- Clears it when the action is closed or waived.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cert_set_days_to_resolve()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.due_date IS NOT NULL AND NEW.status NOT IN ('closed', 'waived') THEN
    -- Positive = days remaining, Negative = overdue
    NEW.days_to_resolve := (NEW.due_date - CURRENT_DATE)::integer;
  ELSE
    -- No due date, or action is resolved → clear the field
    NEW.days_to_resolve := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Add column if not present (defensive: was omitted during initial live deploy)
DO $$ BEGIN
  ALTER TABLE public.certification_corrective_actions ADD COLUMN days_to_resolve integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DROP TRIGGER IF EXISTS cert_days_to_resolve_trigger ON public.certification_corrective_actions;

CREATE TRIGGER cert_days_to_resolve_trigger
  BEFORE INSERT OR UPDATE OF due_date, status
  ON public.certification_corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.cert_set_days_to_resolve();

-- ---------------------------------------------------------------------------
-- Backfill existing rows: update to recompute days_to_resolve now.
-- Safe: touches only rows that are still open/in-progress with a due_date.
-- ---------------------------------------------------------------------------
UPDATE public.certification_corrective_actions
SET days_to_resolve = (due_date - CURRENT_DATE)::integer
WHERE due_date  IS NOT NULL
  AND status NOT IN ('closed', 'waived');

UPDATE public.certification_corrective_actions
SET days_to_resolve = NULL
WHERE due_date IS NULL
   OR status IN ('closed', 'waived');
