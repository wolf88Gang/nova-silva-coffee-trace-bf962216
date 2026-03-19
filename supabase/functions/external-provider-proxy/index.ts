/**
 * Edge Function: proxy para proveedor externo.
 * La API key y account_id viven SOLO en Supabase Secrets.
 * El frontend NUNCA recibe ni ve estos valores.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const apiKey = Deno.env.get('EXTERNAL_PROVIDER_API_KEY')
    const accountId = Deno.env.get('EXTERNAL_PROVIDER_ACCOUNT_ID')

    if (!apiKey) {
      return jsonResponse({
        ok: false,
        error: 'Provider not configured',
        details: 'EXTERNAL_PROVIDER_API_KEY is missing. Configure it in Supabase Dashboard → Project Settings → Edge Functions → Secrets.',
      }, 503)
    }

    const rawBody = await req.text()
    let body: Record<string, unknown> = {}
    try {
      body = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
    }

    // Ejemplo: llamar al proveedor externo.
    // Reemplazar con la lógica real del proveedor cuando tengas la documentación.
    const providerUrl = Deno.env.get('EXTERNAL_PROVIDER_BASE_URL') ?? 'https://api.example.com'
    const endpoint = (body.endpoint as string) ?? '/v1/example'
    const method = ((body.method as string) ?? 'GET').toUpperCase()

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    if (accountId) {
      headers['X-Account-Id'] = accountId
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    }
    if (method !== 'GET' && body.payload) {
      fetchOptions.body = JSON.stringify(body.payload)
    }

    const res = await fetch(`${providerUrl}${endpoint}`, fetchOptions)
    const data = await res.text()
    let parsed: unknown
    try {
      parsed = data ? JSON.parse(data) : null
    } catch {
      parsed = data
    }

    if (!res.ok) {
      return jsonResponse({
        ok: false,
        error: 'Provider request failed',
        status: res.status,
        details: typeof parsed === 'object' && parsed !== null && 'message' in parsed
          ? (parsed as { message?: string }).message
          : 'See provider docs',
      }, 502)
    }

    return jsonResponse({ ok: true, data: parsed }, 200)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({
      ok: false,
      error: 'Internal error',
      details: msg,
    }, 500)
  }
})
