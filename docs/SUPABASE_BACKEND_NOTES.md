# Notas de integración Supabase / Backend

## Corrección sugerida: `get_user_role`

La función `get_user_role(p_user_id uuid)` debe usar `p.user_id` (no `p.id`) para referenciar `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  WITH base AS (
    SELECT p.organization_id, NULLIF(TRIM(p.role), '') AS profile_role
    FROM public.profiles p
    WHERE p.user_id = p_user_id  -- ← p.user_id, NO p.id
  ),
  ur AS (
    SELECT u.role
    FROM public.user_roles u
    JOIN base b ON u.user_id = p_user_id
               AND (u.organization_id IS NULL OR u.organization_id = b.organization_id)
    ORDER BY CASE WHEN u.organization_id IS NULL THEN 2 ELSE 1 END, u.role
    LIMIT 1
  )
  SELECT COALESCE((SELECT role FROM ur), (SELECT profile_role FROM base));
$$;
```

Evidencia: `AuthContext.tsx` usa `eq('user_id', userId)`, y `get_user_organization_id` usa `WHERE user_id = p_user_id`.

## Vista `v_demo_organizations_ui`

Si `platform_organizations` no tiene columna `name`, el fallback debe usar solo `display_name` (sin `COALESCE(..., o.name, ...)`).

## Vista `v_parcela_hub_summary`

Ancla en `nutricion_parcela_contexto`. Solo devuelve parcelas que tengan fila en esa tabla. Las parcelas con solo `cooperativa_id` (sin contexto de nutrición) **no aparecerán**.

## Pasos para login demo con datos reales

1. Marcar orgs en `platform_organizations` con `is_demo = true`
2. Rellenar `org_type`, `operating_model`, `modules`
3. Insertar filas en `demo_profiles` por organización

## Hooks frontend (Lovable)

| Hook | Vista | Fallback |
|------|-------|----------|
| `useDemoOrganizations` | `v_demo_organizations_ui` | Mocks locales en DemoLogin |
| `useDemoProfiles` | `v_demo_profiles_ui` | Mocks locales por orgType |
| `useParcelHubSummary` | `v_parcela_hub_summary` | Datos demo estáticos |

Todos definidos en `src/hooks/useViewData.ts`.
