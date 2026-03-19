-- Añadir created_at a v_admin_users_summary para UI de usuarios
CREATE OR REPLACE VIEW public.v_admin_users_summary AS
SELECT
  p.user_id,
  p.full_name,
  p.email,
  p.organization_id,
  COALESCE(o.name, o.display_name, 'Sin org') AS organization_name,
  COALESCE(p.is_active, true) AS is_active,
  p.last_login_at,
  p.created_at,
  (
    SELECT jsonb_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL)
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
  ) AS roles
FROM public.profiles p
LEFT JOIN public.platform_organizations o ON o.id = p.organization_id;
