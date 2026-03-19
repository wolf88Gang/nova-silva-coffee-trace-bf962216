-- Crea platform_organizations si no existe (requerido por onboarding_wizard).
-- Compatible con organizations existente.
CREATE TABLE IF NOT EXISTS public.platform_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  display_name text,
  org_type text,
  operating_model text,
  pais text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
