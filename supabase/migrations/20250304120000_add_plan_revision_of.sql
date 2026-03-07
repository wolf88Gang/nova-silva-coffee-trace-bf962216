-- Migration: Agregar plan_revision_of y campos de revisión a nutricion_planes
ALTER TABLE public.nutricion_planes
  ADD COLUMN IF NOT EXISTS plan_revision_of uuid NULL REFERENCES public.nutricion_planes(id),
  ADD COLUMN IF NOT EXISTS revision_reason text NULL,
  ADD COLUMN IF NOT EXISTS revision_notes text NULL,
  ADD COLUMN IF NOT EXISTS revision_idempotency_key text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nutricion_planes_revision_idempotency
  ON public.nutricion_planes (plan_revision_of, revision_idempotency_key)
  WHERE plan_revision_of IS NOT NULL AND revision_idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nutricion_planes_plan_revision_of ON public.nutricion_planes (plan_revision_of);

-- RPC: Verificar si usuario puede aprobar/revisar planes (tecnico, admin_org, admin, cooperativa)
CREATE OR REPLACE FUNCTION public.can_approve_nutrition_plan(p_user_id uuid, p_org_id uuid)
RETURNS boolean AS $$
BEGIN
  IF p_org_id IS NULL THEN RETURN false; END IF;
  -- Admin global
  IF EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p_user_id AND ur.role = 'admin') THEN
    RETURN true;
  END IF;
  -- Usuario debe pertenecer a la org
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id AND p.organization_id = p_org_id) THEN
    RETURN false;
  END IF;
  -- Rol tecnico, admin_org o cooperativa (admin de coop)
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role IN ('tecnico', 'admin_org', 'admin', 'cooperativa')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
