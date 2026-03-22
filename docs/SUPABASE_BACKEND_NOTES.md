# Notas de integración Supabase / Backend

## Migraciones Admin Panel (2025-03-18)

Base mínima para el panel de administración. Ejecutar en orden:

| Migración | Contenido |
|-----------|-----------|
| `20250318000000_admin_panel_enums_and_orgs.sql` | Enums, `platform_organizations` (ALTER), `profiles` (ALTER), `user_roles`, helpers, RLS base |
| `20250318010000_admin_panel_billing.sql` | `billing_plans`, `billing_addons`, `org_billing_settings`, `org_billing_addons`, `billing_usage_snapshots`, `invoices`, `invoice_lines`, `payments` |
| `20250318020000_admin_panel_audit_and_views.sql` | `admin_action_logs`, `v_admin_organizations_summary`, `v_admin_users_summary` |
| `20250318030000_admin_panel_rls.sql` | Políticas RLS para admin/superadmin |

**Vistas útiles para el admin panel:**
- `v_admin_organizations_summary` — overview de organizaciones
- `v_admin_users_summary` — overview de usuarios con roles

**Privacidad y auditoría:** Ver `docs/ADMIN_AUDIT_PRIVACY_GUIDE.md` — qué compartir con auditor, minimización de PII en logs.

**PayPal proxy (invoice_payment):** Ver `docs/PAYPAL_PROXY_POLICY.md` — política de permisos admin vs usuario.

**PayPal webhook:** Ver `docs/PAYPAL_WEBHOOK_SETUP.md` — recepción y validación de eventos.

**PayPal live:** Ver `docs/PAYPAL_LIVE_CHECKLIST.md` — checklist para activar invoice payment en live.

**Pendiente para fase siguiente:**
- Cálculo automático de usage snapshots
- Cálculo avanzado de overages
- Automatización de invoice generation
- Integración Stripe
- incidentes compliance estructurados

---

## Corrección sugerida: `get_user_role`

La función `get_user_role(p_user_id uuid)` en el SQL compartido usa:

```sql
FROM public.profiles p WHERE p.id = p_user_id
```

En este proyecto, la tabla `profiles` usa **`user_id`** (no `id`) como referencia a `auth.users`. Ver:
- `AuthContext.tsx`: `eq('user_id', userId)`
- `get_user_organization_id`: `WHERE user_id = p_user_id`

**Corrección recomendada** (ejecutar en Supabase SQL Editor si la función falla):

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH base AS (
    SELECT p.organization_id, NULLIF(TRIM(p.role), '') AS profile_role
    FROM public.profiles p
    WHERE p.user_id = p_user_id  -- ← Cambiar p.id por p.user_id
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

## Vista `v_demo_organizations_ui`

Si `platform_organizations` no tiene columna `name`, el fallback en la vista debe ajustarse. El SQL actual usa `COALESCE(o.display_name, o.name, 'Demo org')`. Si `name` no existe, usar solo `display_name`.

## Vista `v_parcela_hub_summary`

La vista ancla en `nutricion_parcela_contexto`. Solo devuelve parcelas que tengan fila en esa tabla. Las parcelas con solo `cooperativa_id` (sin contexto de nutrición) no aparecerán.

## Integración frontend

- **useDemoOrganizations**: Lee `v_demo_organizations_ui`; si vacío o error → mocks locales.
- **useDemoProfiles**: Lee `v_demo_profiles_ui`; si vacío o error → mocks locales.
- **useParcelHubSummary**: Lee `v_parcela_hub_summary` cuando `parcelId` es UUID.

Para que el login demo use datos reales:

1. Marcar orgs en `platform_organizations` con `is_demo = true`.
2. Rellenar `org_type`, `operating_model`, `modules`.
3. Insertar filas en `demo_profiles` por organización.

---

## Sales Intelligence (diagnóstico comercial)

Contrato unificado con el código y migraciones: **`docs/SALES_INTELLIGENCE_MASTER.md`** (rutas, tablas reales, RPCs `p_*`, Copilot vs legacy).
