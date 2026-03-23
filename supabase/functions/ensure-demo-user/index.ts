import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// =============================================================================
// DEMO TENANT CONSTANTS
// These values are hardcoded and intentionally match the demo_data_fix migration.
// The edge function never touches non-demo users or non-demo orgs.
// =============================================================================

// Valid roles for the demo environment
const DEMO_ROLES = ['cooperativa', 'exportador', 'certificadora', 'productor', 'tecnico'] as const
type DemoRole = typeof DEMO_ROLES[number]

// Display names per role
const DEMO_NAMES: Record<DemoRole, string> = {
  cooperativa: 'María García',
  exportador:  'Carlos Mendoza',
  certificadora: 'Ana Certificadora',
  productor:   'Juan Pérez',
  tecnico:     'Pedro Técnico',
}

// platform_organizations.id — referenced by profiles.organization_id (FK)
const PLATFORM_ORG_ID: Record<DemoRole, string> = {
  cooperativa:   '00000000-0000-0000-0000-000000000001',
  productor:     '00000000-0000-0000-0000-000000000001',
  tecnico:       '00000000-0000-0000-0000-000000000001',
  exportador:    '00000000-0000-0000-0000-000000000002',
  certificadora: '00000000-0000-0000-0000-000000000003',
}

// organizaciones.id — referenced by organizacion_usuarios.organizacion_id (FK)
// Used by cert_user_org_id() RLS fallback.
const APP_ORG_ID: Record<DemoRole, string> = {
  cooperativa:   '00000000-0000-0000-0000-000000000001',
  productor:     '00000000-0000-0000-0000-000000000001',
  tecnico:       '00000000-0000-0000-0000-000000000001',
  exportador:    '00000000-0000-0000-0000-000000000002',
  certificadora: '00000000-0000-0000-0000-000000000003',
}

const DEMO_PASSWORD = 'demo123456'

// =============================================================================
// HANDLER
// =============================================================================

serve(async (req) => {
  console.log('=== ENSURE-DEMO-USER START ===')

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // ── Parse and validate body ──
  let role: string | undefined
  try {
    const parsed = JSON.parse(await req.text())
    role = parsed.role
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
  }

  if (!role || !(DEMO_ROLES as readonly string[]).includes(role)) {
    return jsonResponse({
      ok: false,
      error: 'Invalid role',
      details: `received: ${role}, valid: ${DEMO_ROLES.join(', ')}`,
    }, 400)
  }

  const demoRole = role as DemoRole
  const email    = `demo.${demoRole}@novasilva.com`
  const platformOrgId = PLATFORM_ORG_ID[demoRole]
  const appOrgId      = APP_ORG_ID[demoRole]

  console.log('Role:', demoRole, '| email:', email, '| org:', platformOrgId)

  // ── Service-role client (no RLS) ──
  // Security: this client operates only on the hardcoded demo email/orgs above.
  // It never reads or writes data for non-demo users.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  )

  try {
    // ── 1. Ensure auth user exists ──
    let userId: string

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: DEMO_NAMES[demoRole], role: demoRole },
    })

    if (createErr) {
      if (
        createErr.message.includes('already registered') ||
        createErr.message.includes('already been registered')
      ) {
        // User exists — resolve their ID via admin list
        const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
        if (listErr) {
          return jsonResponse({ ok: false, error: 'Cannot list users', details: listErr.message }, 500)
        }
        const existing = users.find(u => u.email === email)
        if (!existing) {
          return jsonResponse({ ok: false, error: `Demo user ${email} not found after create conflict` }, 500)
        }
        userId = existing.id
        console.log('User already exists:', userId)
      } else {
        return jsonResponse({ ok: false, error: 'Auth create error', details: createErr.message }, 500)
      }
    } else {
      userId = created.user.id
      console.log('Created user:', userId)
    }

    // ── 2. Upsert profile ──
    // Columns: user_id (PK conflict target), name, organization_id
    // Does NOT write: full_name (doesn't exist), email (doesn't exist), is_active (doesn't exist)
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert(
        { user_id: userId, name: DEMO_NAMES[demoRole], organization_id: platformOrgId },
        { onConflict: 'user_id' }
      )

    if (profileErr) {
      // Non-fatal: log but continue. Profile may already be correctly populated.
      console.warn('Profile upsert warning:', profileErr.message)
    }

    // ── 3. Ensure user_roles entry ──
    // user_roles has no organization_id column — it is a global role assignment.
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

    // ── 4. Ensure organizacion_usuarios entry ──
    // Required for cert_user_org_id() RLS fallback in certification pages.
    // Unique constraint: (organizacion_id, user_id)
    const { error: ouErr } = await admin
      .from('organizacion_usuarios')
      .upsert(
        {
          organizacion_id: appOrgId,
          user_id: userId,
          rol: demoRole,
          activo: true,
        },
        { onConflict: 'organizacion_id,user_id' }
      )

    if (ouErr) {
      console.warn('organizacion_usuarios upsert warning:', ouErr.message)
    }

    console.log('SUCCESS:', email, '| userId:', userId, '| org:', platformOrgId)
    return jsonResponse({ ok: true, user_id: userId, organization_id: platformOrgId })

  } catch (err) {
    console.error('FATAL:', err)
    return jsonResponse({ ok: false, error: (err as Error).message }, 500)
  }
})
