-- =============================================================================
-- NOVA SILVA — DEMO DATA FIX (part 1/2)
-- Migration: 20260323000001_demo_add_tecnico_role
-- =============================================================================
-- Add 'tecnico' to app_role enum.
-- Must be committed in its own transaction before being used in DML
-- (PostgreSQL restriction: new enum values cannot be used in the same txn).
-- =============================================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tecnico';
