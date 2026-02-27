-- RPC para obtener organization_id de un usuario (usado por rls-smoke-test)
CREATE OR REPLACE FUNCTION public.get_user_organization_id(p_user_id uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
