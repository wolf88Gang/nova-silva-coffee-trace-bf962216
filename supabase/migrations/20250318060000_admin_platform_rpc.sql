-- Admin Panel — Platform: RPC para estado global
-- Retorna 'operational' | 'degraded' | 'critical'
-- Base: ping a DB. Extensible con tabla platform_health_checks.
CREATE OR REPLACE FUNCTION public.get_platform_status()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'operational'::text;
$$;
