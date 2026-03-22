-- =============================================================================
-- NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
-- SECTION 3: JWT / RLS FIX
-- Migration: 20260322000010
-- =============================================================================
-- PROBLEM: cert_user_org_id() previously read ONLY from JWT app_metadata.
-- If the auth hook is not configured (it isn't yet), every RLS check returns
-- NULL → the policy `organization_id = cert_user_org_id()` fails for ALL rows.
--
-- SOLUTION: Dual-path function.
--   Path 1 (fast): JWT app_metadata.organization_id  — set by auth hook when available
--   Path 2 (safe): organizacion_usuarios table lookup — works without any auth hook
--
-- This means certification pages work immediately in Lovable with standard
-- Supabase email/password auth, no custom JWT claims required.
--
-- When the auth hook is later added, Path 1 kicks in and eliminates the
-- extra DB query. No code changes required.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- cert_user_org_id()
-- Returns the organization_id for the current authenticated user.
-- Called inside every RLS policy on cert_* tables.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cert_user_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Path 1: JWT app_metadata.organization_id (populated by auth hook)
  -- Fast path: no DB query needed. Set up a Supabase auth hook to populate:
  --   auth.users.raw_app_meta_data = {"organization_id": "<uuid>"}
  v_org_id := nullif(
    (auth.jwt() -> 'app_metadata' ->> 'organization_id'),
    ''
  )::uuid;

  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;

  -- Path 2: Fallback — derive from organizacion_usuarios (no auth hook required)
  -- Reads from the real table. auth.uid() is always available for authenticated users.
  -- If a user belongs to multiple orgs, returns the most recently joined one.
  -- Frontend should call cert_rpc_user_org_id() to discover and switch orgs.
  SELECT organizacion_id INTO v_org_id
  FROM   public.organizacion_usuarios
  WHERE  user_id      = auth.uid()
    AND  activo       = true
  ORDER BY created_at
  LIMIT 1;

  RETURN v_org_id;  -- NULL if user has no active org membership
END;
$$;

-- ---------------------------------------------------------------------------
-- cert_user_has_role()
-- Returns true if the current user has any of the specified roles in the org.
-- Called inside RLS write policies to restrict mutations to authorized roles.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cert_user_has_role(
  p_org_id uuid,
  p_roles  text[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.organizacion_usuarios
    WHERE  user_id        = auth.uid()
      AND  organizacion_id = p_org_id
      AND  rol             = ANY(p_roles)
      AND  activo          = true
  );
$$;

-- ---------------------------------------------------------------------------
-- cert_rpc_user_orgs()
-- Returns all organizations the current user is a member of.
-- Consumer: org switcher in the frontend header.
-- Call    : SELECT * FROM cert_rpc_user_orgs();
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cert_rpc_user_orgs()
RETURNS TABLE (
  organization_id  uuid,
  org_name         text,
  rol              text,
  activo           boolean,
  has_cert_profile boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ou.organizacion_id,
    o.nombre,
    ou.rol,
    ou.activo,
    EXISTS (
      SELECT 1
      FROM   public.organization_certification_profiles ocp
      WHERE  ocp.organization_id = ou.organizacion_id
    ) AS has_cert_profile
  FROM  public.organizacion_usuarios ou
  JOIN  public.organizaciones o ON o.id = ou.organizacion_id
  WHERE ou.user_id = auth.uid()
    AND ou.activo  = true
  ORDER BY ou.created_at;
$$;

-- ---------------------------------------------------------------------------
-- NOTES FOR AUTH HOOK (future implementation):
--
-- When ready to configure the Supabase auth hook, create a Postgres function:
--
--   CREATE OR REPLACE FUNCTION auth.set_org_claim()
--   RETURNS event_trigger AS $$
--   -- For user sign-in events, update raw_app_meta_data with organization_id
--   $$ LANGUAGE plpgsql;
--
-- Or use a Supabase Edge Function hook:
--   /functions/v1/auth-hook → reads organizacion_usuarios → sets app_metadata
--
-- Until then, Path 2 (organizacion_usuarios fallback) handles all auth.
-- ---------------------------------------------------------------------------
