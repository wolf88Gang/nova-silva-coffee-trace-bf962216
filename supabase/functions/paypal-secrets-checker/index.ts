/**
 * Verifica que los secrets de PayPal estén configurados en Supabase.
 * NO devuelve los valores, solo flags true/false.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID')
  const mode = Deno.env.get('PAYPAL_MODE')
  const apiBase = Deno.env.get('PAYPAL_API_BASE')

  const body = {
    ok: true,
    paypal: {
      client_id_present: !!clientId,
      client_secret_present: !!clientSecret,
      webhook_id_present: !!webhookId,
    },
    extras: {
      mode_present: !!mode,
      api_base_present: !!apiBase,
    },
    note: 'Values are not returned. Update secrets via Dashboard Settings > Edge Functions > Secrets or supabase secrets set.',
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders },
  })
})
