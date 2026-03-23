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

const VALID_ROLES = ['cooperativa', 'exportador', 'certificadora', 'productor', 'tecnico']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // ── 1. REQUIRE AUTHENTICATED USER ──
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ ok: false, error: 'Se requiere autenticación. Envía un Bearer token válido.' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')

    // Create anon client to validate user token (NOT service_role)
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token)

    if (userError || !user) {
      console.error('Token validation failed:', userError?.message)
      return jsonResponse({ ok: false, error: 'Token inválido o expirado. Inicia sesión primero.' }, 401)
    }

    const userId = user.id
    console.log('Authenticated user:', userId, user.email)

    // ── 2. PARSE AND VALIDATE INPUT ──
    const rawBody = await req.text()
    let role: string | undefined
    let organizationId: string | undefined

    try {
      const parsed = JSON.parse(rawBody)
      role = parsed.role
      organizationId = parsed.organization_id
    } catch {
      return jsonResponse({ ok: false, error: 'JSON inválido en el body' }, 400)
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return jsonResponse({
        ok: false,
        error: 'Rol inválido',
        details: `Recibido: ${role}. Válidos: ${VALID_ROLES.join(', ')}`
      }, 400)
    }

    // ── 3. SERVICE ROLE CLIENT (only for writes, AFTER auth validation) ──
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ── 4. RESOLVE ORGANIZATION ──
    let resolvedOrgId: string | null = null

    if (organizationId) {
      // Validate against platform_organizations
      const { data: orgRow, error: orgErr } = await supabaseAdmin
        .from('platform_organizations')
        .select('id')
        .eq('id', organizationId)
        .maybeSingle()

      if (orgErr) {
        console.warn('Error checking platform_organizations:', orgErr.message)
      }

      if (orgRow) {
        resolvedOrgId = orgRow.id
        console.log('Validated organization_id:', resolvedOrgId)
      } else {
        return jsonResponse({
          ok: false,
          error: 'Organización no encontrada',
          details: `El organization_id "${organizationId}" no existe en platform_organizations.`
        }, 400)
      }
    } else {
      // Try to resolve from existing profile
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingProfile?.organization_id) {
        resolvedOrgId = existingProfile.organization_id
        console.log('Resolved org from existing profile:', resolvedOrgId)
      } else {
        console.warn('No organization_id provided and none found in profile')
      }
    }

    // ── 5. UPSERT PROFILE (idempotent) ──
    const profileData: Record<string, unknown> = {
      user_id: userId,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      is_active: true,
    }
    if (resolvedOrgId) {
      profileData.organization_id = resolvedOrgId
    }

    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })

    if (profileErr) {
      console.error('Profile upsert error:', profileErr.message)
      // Non-fatal: continue
    }

    // ── 6. ENSURE USER_ROLES (idempotent, WHERE NOT EXISTS) ──
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle()

    if (!existingRole) {
      const { error: roleErr } = await supabaseAdmin
        .from('user_roles')
        .upsert(
          { user_id: userId, role },
          { onConflict: 'user_id,role', ignoreDuplicates: true }
        )

      if (roleErr) {
        console.error('Role upsert error:', roleErr.message)
      } else {
        console.log('Role ensured:', role)
      }
    } else {
      console.log('Role already exists:', role)
    }

    // ── 7. ENSURE ORGANIZACION_USUARIOS (idempotent, only if org exists) ──
    if (resolvedOrgId) {
      // Check if organizaciones row exists for this org
      const { data: orgRow } = await supabaseAdmin
        .from('organizaciones')
        .select('id')
        .eq('id', resolvedOrgId)
        .maybeSingle()

      if (orgRow) {
        const { error: ouErr } = await supabaseAdmin
          .from('organizacion_usuarios')
          .upsert(
            {
              organizacion_id: resolvedOrgId,
              user_id: userId,
              rol_interno: role === 'tecnico' ? 'tecnico' : 'admin_org',
              activo: true,
              user_email: user.email,
              user_name: user.user_metadata?.name || user.email?.split('@')[0],
            },
            { onConflict: 'organizacion_id,user_id', ignoreDuplicates: true }
          )

        if (ouErr) {
          console.error('organizacion_usuarios upsert error:', ouErr.message)
        } else {
          console.log('organizacion_usuarios ensured')
        }
      }
    }

    // ── 8. RESPONSE ──
    console.log('SUCCESS:', user.email, 'org:', resolvedOrgId)
    return jsonResponse({
      ok: true,
      user_id: userId,
      organization_id: resolvedOrgId,
    })

  } catch (error) {
    console.error('FATAL:', error)
    return jsonResponse({ ok: false, error: (error as Error).message }, 500)
  }
})
