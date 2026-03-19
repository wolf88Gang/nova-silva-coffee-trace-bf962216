-- Admin Panel — Convergencia mínima: profiles.created_at
-- Idempotente. No crea tablas, enums ni columnas sombra.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
