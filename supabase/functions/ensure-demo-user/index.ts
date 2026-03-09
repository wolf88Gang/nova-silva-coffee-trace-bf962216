import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== ENSURE-DEMO-USER START ===')
  console.log('Method:', req.method)

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    console.log('Raw body received:', rawBody)

    let role: string | undefined
    try {
      const parsed = JSON.parse(rawBody)
      role = parsed.role
      console.log('Parsed role:', role, 'Type:', typeof role)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: (parseErr as Error).message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validRoles = ['cooperativa', 'exportador', 'certificadora', 'productor', 'tecnico', 'admin']

    if (!role) {
      console.error('Role is missing')
      return new Response(
        JSON.stringify({ error: 'Role is required', received: role }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!validRoles.includes(role)) {
      console.error('Invalid role:', role)
      return new Response(
        JSON.stringify({ error: 'Invalid role', received: role, valid: validRoles }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Role validation passed:', role)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const email = `demo.${role}@novasilva.com`
    const password = 'demo123456'

    const orgNames: Record<string, string> = {
      cooperativa: 'Cooperativa Café de la Selva',
      exportador: 'Exportadora Sol de América',
      certificadora: 'CertifiCafé Internacional',
      productor: 'Finca El Mirador',
      tecnico: 'Cooperativa Café de la Selva',
      admin: 'Nova Silva Platform',
    }

    const names: Record<string, string> = {
      cooperativa: 'María García',
      exportador: 'Carlos Mendoza',
      certificadora: 'Ana Certificadora',
      productor: 'Juan Pérez',
      tecnico: 'Pedro Técnico',
    }

    console.log('Attempting to create/update user:', email)

    // Intentar crear usuario
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: names[role],
        role,
        organization_name: orgNames[role],
      }
    })

    let userId: string | undefined

    if (authError) {
      console.log('Auth error (might be expected if user exists):', authError.message)

      // Si el usuario ya existe, obtener su ID mediante signIn (listUsers está paginado y puede no encontrarlo)
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('User already exists, signing in to get ID...')
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password })
        if (signInError) {
          console.error('SignIn error:', signInError.message)
          throw signInError
        }
        userId = signInData?.user?.id
        console.log('Found existing user ID:', userId)
      } else {
        throw authError
      }
    } else {
      userId = authData?.user?.id
      console.log('Created new user ID:', userId)
    }

    if (!userId) {
      throw new Error('Could not get user ID')
    }

    console.log('Upserting profile for user:', userId)
    await supabaseAdmin.from('profiles').upsert({
      user_id: userId,
      name: names[role],
      organization_name: orgNames[role],
    }, { onConflict: 'user_id' })

    console.log('Upserting role for user:', userId)
    await supabaseAdmin.from('user_roles').upsert({
      user_id: userId,
      role,
    }, { onConflict: 'user_id' })

    console.log('SUCCESS - Demo user ready:', email)

    return new Response(
      JSON.stringify({ ok: true, email, role }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('FATAL ERROR:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message, stack: (error as Error).stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
