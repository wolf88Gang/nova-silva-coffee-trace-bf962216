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

serve(async (req) => {
  console.log('=== ENSURE-DEMO-USER START ===')

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    console.log('Raw body:', rawBody)

    let role: string | undefined
    let bodyOrgId: string | undefined

    try {
      const parsed = JSON.parse(rawBody)
      role = parsed.role
      bodyOrgId = parsed.organization_id
    } catch (parseErr) {
      return jsonResponse({ ok: false, error: 'Invalid JSON body', details: (parseErr as Error).message }, 400)
    }

    const validRoles = ['cooperativa', 'exportador', 'certificadora', 'productor', 'tecnico']

    if (!role) {
      return jsonResponse({ ok: false, error: 'Role is required', details: `received: ${role}` }, 400)
    }
    if (!validRoles.includes(role)) {
      return jsonResponse({ ok: false, error: 'Invalid role', details: `received: ${role}, valid: ${validRoles.join(', ')}` }, 400)
    }

    console.log('Role:', role, 'bodyOrgId:', bodyOrgId)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const email = `demo.${role}@novasilva.com`
    const password = 'demo123456'

    const names: Record<string, string> = {
      cooperativa: 'María García',
      exportador: 'Carlos Mendoza',
      certificadora: 'Ana Certificadora',
      productor: 'Juan Pérez',
      tecnico: 'Pedro Técnico',
    }

    // ── Resolve organization_id ──
    let resolvedOrgId: string | null = null

    if (bodyOrgId) {
      // Validate that it exists in platform_organizations
      const { data: orgRow, error: orgErr } = await supabaseAdmin
        .from('platform_organizations')
        .select('id')
        .eq('id', bodyOrgId)
        .maybeSingle()

      if (orgErr) {
        console.warn('Error checking platform_organizations:', orgErr.message)
      }

      if (orgRow) {
        resolvedOrgId = orgRow.id
        console.log('Validated organization_id from body:', resolvedOrgId)
      } else {
        console.warn('organization_id from body not found in platform_organizations:', bodyOrgId)
      }
    }

    // ── Create or find auth user ──
    console.log('Creating/finding user:', email)

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: names[role],
        role,
      }
    })

    let userId: string | undefined

    if (authError) {
      console.log('Auth error:', authError.message)

      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password })
        if (signInError) {
          return jsonResponse({ ok: false, error: 'Cannot sign in existing demo user', details: signInError.message }, 500)
        }
        userId = signInData?.user?.id

        // If no bodyOrgId, try to get from existing profile
        if (!resolvedOrgId && userId) {
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('user_id', userId)
            .maybeSingle()
          if (existingProfile?.organization_id) {
            resolvedOrgId = existingProfile.organization_id
            console.log('Resolved organization_id from existing profile:', resolvedOrgId)
          }
        }
      } else {
        return jsonResponse({ ok: false, error: 'Auth error', details: authError.message }, 500)
      }
    } else {
      userId = authData?.user?.id
      console.log('Created new user:', userId)
    }

    if (!userId) {
      return jsonResponse({ ok: false, error: 'Could not resolve user ID' }, 500)
    }

    // ── Upsert profile ──
    console.log('Upserting profile for:', userId, 'org:', resolvedOrgId)
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      user_id: userId,
      full_name: names[role],
      email,
      organization_id: resolvedOrgId,
      is_active: true,
    }, { onConflict: 'user_id' })

    if (profileErr) {
      console.error('Profile upsert error:', profileErr.message)
      // Non-fatal: continue but log
    }

    // ── Insert role only if org is valid ──
    if (resolvedOrgId) {
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!existingRole) {
        console.log('Inserting role:', role)
        const { error: roleErr } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role })

        if (roleErr) {
          console.error('Role insert error:', roleErr.message)
        }
      } else {
        console.log('Role already exists, skipping insert')
      }
    } else {
      console.log('No valid organization_id — skipping user_roles insert')
    }

    console.log('SUCCESS:', email, 'org:', resolvedOrgId)
    return jsonResponse({ ok: true, user_id: userId, organization_id: resolvedOrgId })

  } catch (error) {
    console.error('FATAL:', error)
    return jsonResponse({ ok: false, error: (error as Error).message }, 500)
  }
})
