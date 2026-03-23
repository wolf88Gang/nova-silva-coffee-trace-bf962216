import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// =============================================================================
// CONTRACT
// =============================================================================
// POST /ensure-demo-user
// Authorization: Bearer <user_access_token>  ← REQUIRED, anon key is REJECTED
// Body: { role: string, organization_id: uuid }
//
// Flow:
//   1. Validate Bearer token → resolve user_id (null/anon → 401)
//   2. Validate role is a known demo role
//   3. Validate organization_id exists in platform_organizations
//   4. Upsert profile (user_id, name, organization_id)
//   5. Upsert user_roles WHERE NOT EXISTS
//   6. Upsert organizacion_usuarios ON CONFLICT DO NOTHING
//      (required for cert_user_org_id() RLS fallback)
//   7. Return { ok: true, user_id, organization_id }
//
// The function NEVER creates auth users.
// The function NEVER reads or writes data for non-demo tenants.
// =============================================================================

const DEMO_ROLES = ['cooperativa', 'exportador', 'certificadora', 'productor', 'tecnico'] as const
type DemoRole = typeof DEMO_ROLES[number]

const DEMO_NAMES: Record<DemoRole, string> = {
  cooperativa:   'Mar\u00eda Garc\u00eda',
  exportador:    'Carlos Mendoza',
  certificadora: 'Ana Certificadora',
  productor:     'Juan P\u00e9rez',
  tecnico:       'Pedro T\u00e9cnico',
}

// Demo user email pattern — only these users may call this function.
// Prevents non-demo authenticated users from invoking provisioning logic.
const DEMO_EMAIL_RE = /^demo\.[a-z]+@novasilva\.com$/

serve(async (req) => {
  console.log('=== ENSURE-DEMO-USER START ===')

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // ── 1. Extract and validate Bearer token ──────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    console.warn('Missing or malformed Authorization header')
    return json({ ok: false, error: 'Authorization header required' }, 401)
  }
  const jwt = authHeader.slice(7)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  )

  // admin.auth.getUser(jwt) returns null user for anon key (no sub claim)
  const { data: { user }, error: authErr } = await admin.auth.getUser(jwt)
  if (authErr || !user?.id) {
    console.warn('Token validation failed:', authErr?.message ?? 'no user in JWT')
    return json({ ok: false, error: 'Token inv\u00e1lido o sesi\u00f3n no autenticada' }, 401)
  }

  const userId    = user.id
  const userEmail = user.email ?? ''

  // Guard: only demo accounts may call this function
  if (!DEMO_EMAIL_RE.test(userEmail)) {
    console.warn('Non-demo user attempted ensure-demo-user:', userEmail)
    return json({ ok: false, error: 'Acceso restringido a cuentas demo' }, 403)
  }

  console.log('Authenticated user:', userEmail, userId)

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let role: string
  let organizationId: string

  try {
    const body = JSON.parse(await req.text())
    role           = body.role
    organizationId = body.organization_id
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400)
  }

  if (!role || !(DEMO_ROLES as readonly string[]).includes(role)) {
    return json({
      ok: false,
      error: 'Invalid role',
      details: `received: ${role}, valid: ${DEMO_ROLES.join(', ')}`,
    }, 400)
  }

  if (!organizationId) {
    return json({ ok: false, error: 'organization_id is required' }, 400)
  }

  const demoRole = role as DemoRole

  // ── 3. Validate organization_id in platform_organizations ─────────────────
  const { data: platformOrg, error: platformOrgErr } = await admin
    .from('platform_organizations')
    .select('id')
    .eq('id', organizationId)
    .maybeSingle()

  if (platformOrgErr || !platformOrg) {
    console.warn('organization_id not found in platform_organizations:', organizationId)
    return json({
      ok: false,
      error: 'organization_id no existe en platform_organizations',
      details: organizationId,
    }, 400)
  }

  try {
    // ── 4. Upsert profile ──────────────────────────────────────────────────
    // Only valid columns: user_id, name, organization_id
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert(
        { user_id: userId, name: DEMO_NAMES[demoRole], organization_id: organizationId },
        { onConflict: 'user_id' }
      )

    if (profileErr) {
      console.warn('Profile upsert warning:', profileErr.message)
    }

    // ── 5. Upsert user_roles (WHERE NOT EXISTS) ────────────────────────────
    // user_roles has no organization_id column — global role assignment.
    const { data: existingRole } = await admin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingRole) {
      const { error: roleErr } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role: demoRole })
      if (roleErr) {
        console.warn('user_roles insert warning:', roleErr.message)
      }
    }

    // ── 6. Upsert organizacion_usuarios ────────────────────────────────────
    // organizacion_usuarios.organizacion_id → organizaciones (not platform_organizations)
    // Verify the org exists in organizaciones before writing.
    // Unique constraint: (organizacion_id, user_id)
    const { data: appOrg } = await admin
      .from('organizaciones')
      .select('id')
      .eq('id', organizationId)
      .maybeSingle()

    if (!appOrg) {
      // Org exists in platform_organizations but not in organizaciones.
      // cert_user_org_id() RLS will not find this user's org until an admin
      // seeds the organizaciones row. Auth succeeds but cert pages will be empty.
      console.warn('organizacion_id not in organizaciones:', organizationId,
        '— profile and user_roles are set but cert RLS will return null')
    } else {
      const { error: ouErr } = await admin
        .from('organizacion_usuarios')
        .upsert(
          {
            organizacion_id: organizationId,
            user_id:         userId,
            rol:             demoRole,
            activo:          true,
          },
          { onConflict: 'organizacion_id,user_id' }
        )
      if (ouErr) {
        console.warn('organizacion_usuarios upsert warning:', ouErr.message)
      }
    }

    console.log('SUCCESS:', userEmail, '| userId:', userId, '| org:', organizationId)
    return json({ ok: true, user_id: userId, organization_id: organizationId })

  } catch (err) {
    console.error('FATAL:', err)
    return json({ ok: false, error: (err as Error).message }, 500)
  }
})
