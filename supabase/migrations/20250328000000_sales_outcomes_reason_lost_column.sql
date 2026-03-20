-- Fix: align sales_session_outcomes column name with code.
-- If the table was created with 'reason' instead of 'reason_lost', rename it.
-- Idempotent: only runs if 'reason' exists and 'reason_lost' does not.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_session_outcomes' AND column_name = 'reason'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_session_outcomes' AND column_name = 'reason_lost'
  ) THEN
    ALTER TABLE public.sales_session_outcomes RENAME COLUMN reason TO reason_lost;
  END IF;
END $$;
