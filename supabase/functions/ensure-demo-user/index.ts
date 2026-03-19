import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    let role: string | undefined
    let organizationId: string | undefined
    try {
      const parsed = rawBody ? JSON.parse(rawBody) : {}
      role = parsed.role
      organizationId = parsed.organization_id ?? parsed.organizationId
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON body', details: 'Parse error' }, 400)
    }

    const validRoles = ['cooperativa', 'exportador', 'certificadora', 'productor', 'tecnico', 'admin']
    if (!role || !validRoles.includes(role)) {
      return jsonResponse({
        ok: false,
        error: 'Role is required',
        details: `Valid: ${validRoles.join(', ')}`,
        received: role,
      }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const email = role === 'admin' ? 'demo.admin@novasilva.com' : `demo.${role}@novasilva.com`
    const password = 'demo123456'

    const names: Record<string, string> = {
      cooperativa: 'María García',
      exportador: 'Carlos Mendoza',
      certificadora: 'Ana Certificadora',
      productor: 'Juan Pérez',
      tecnico: 'Pedro Técnico',
      admin: 'Admin Nova Silva',
    }
    const fullName = names[role]

    // Validate body.organization_id exists in platform_organizations if provided
    let resolvedOrgId: string | null = null
    if (organizationId) {
      const { data: orgRow, error: orgErr } = await supabaseAdmin
        .from('platform_organizations')
        .select('id')
        .eq('id', organizationId)
        .maybeSingle()
      if (orgErr || !orgRow?.id) {
        return jsonResponse({
          ok: false,
          error: 'organization_id invalid',
          details: 'Provided organization_id does not exist in platform_organizations',
        }, 400)
      }
      resolvedOrgId = orgRow.id
    }

    // Create or get user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: fullName, role },
    })

    let userId: string | undefined

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password })
        if (signInError) {
          return jsonResponse({
            ok: false,
            error: 'auth_error',
            details: signInError.message,
          }, 500)
        }
        userId = signInData?.user?.id
      } else {
        return jsonResponse({
          ok: false,
          error: 'auth_error',
          details: authError.message,
        }, 500)
      }
    } else {
      userId = authData?.user?.id
    }

    if (!userId) {
      return jsonResponse({ ok: false, error: 'internal_error', details: 'Could not get user ID' }, 500)
    }

    // Resolve organization_id: body > existing profile > DEMO_ORG_ID env > null
    let usedDemoOrg = false
    if (!resolvedOrgId) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle()
      resolvedOrgId = existingProfile?.organization_id ?? null
    }
    if (!resolvedOrgId) {
      const demoOrgId = Deno.env.get('DEMO_ORG_ID')
      if (demoOrgId) {
        const { data: orgRow } = await supabaseAdmin
          .from('platform_organizations')
          .select('id')
          .eq('id', demoOrgId)
          .maybeSingle()
        if (orgRow?.id) {
          resolvedOrgId = orgRow.id
          usedDemoOrg = true
        }
      }
    }

    // Upsert profile: full_name, email, organization_id, is_active (no name, no organization_name)
    const profilePayload: Record<string, unknown> = {
      user_id: userId,
      full_name: fullName,
      email,
      is_active: true,
    }
    if (resolvedOrgId) {
      profilePayload.organization_id = resolvedOrgId
    }

    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })

    if (profileErr) {
      return jsonResponse({
        ok: false,
        error: 'profile_upsert_failed',
        details: profileErr.message,
      }, 500)
    }

    // user_roles: no upsert with onConflict. Check if role exists; if not, insert.
    // Admin gets role without org; others need resolvedOrgId.
    let roleAssigned: string | null = null
    const shouldAssignRole = role === 'admin' || resolvedOrgId
    if (shouldAssignRole) {
      const { data: existingRoles } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (!existingRoles || existingRoles.length === 0) {
        const rolePayload: Record<string, unknown> = {
          user_id: userId,
          role,
          ...(resolvedOrgId ? { organization_id: resolvedOrgId } : {}),
        }
        const { error: roleErr } = await supabaseAdmin
          .from('user_roles')
          .insert(rolePayload)

        if (roleErr) {
          return jsonResponse({
            ok: false,
            error: 'role_insert_failed',
            details: roleErr.message,
          }, 500)
        }
        roleAssigned = role
      }
    }

    const hasOrg = !!resolvedOrgId
    return jsonResponse({
      ok: true,
      email,
      role,
      user_id: userId,
      organization_id: resolvedOrgId ?? undefined,
      ...(hasOrg ? {} : { message: 'Usuario demo creado sin organización asociada' }),
      debug: {
        used_demo_org: usedDemoOrg,
        role_assigned: roleAssigned,
      },
    }, 200)
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: 'internal_error',
      details: (err as Error).message,
    }, 500)
  }
})
