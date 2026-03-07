-- RPC: Ranking de cooperativas para exportador.
-- Retorna cooperativas ordenadas por lotes entregados al tenant (exportador).
CREATE OR REPLACE FUNCTION public.get_ranking_cooperativas(p_organization_id uuid DEFAULT NULL)
RETURNS TABLE (
  cooperativa_id uuid,
  nombre text,
  puntaje numeric,
  volumen_total numeric,
  lotes_entregados bigint
) AS $$
DECLARE
  v_org_id uuid := COALESCE(p_organization_id, public.get_user_organization_id(auth.uid()));
BEGIN
  IF v_org_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    lc.cooperativa_id,
    o.nombre,
    COUNT(lc.id)::numeric AS puntaje,
    COUNT(lc.id)::numeric AS volumen_total,
    COUNT(lc.id)::bigint AS lotes_entregados
  FROM public.lotes_comerciales lc
  LEFT JOIN public.organizations o ON o.id = lc.cooperativa_id
  WHERE (lc.exportador_id = v_org_id OR lc.organization_id = v_org_id)
    AND lc.cooperativa_id IS NOT NULL
  GROUP BY lc.cooperativa_id, o.nombre
  ORDER BY lotes_entregados DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
