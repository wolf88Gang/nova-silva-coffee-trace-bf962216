/**
 * PayPal webhook — recibe eventos, valida firma, registra en payment_webhook_events.
 * Si el evento está verificado y tiene provider_order_id que coincide con payment_intent:
 *   - actualiza metadata (last_webhook_*, paypal_resource_status)
 *   - actualiza status solo para transiciones seguras (approved, declined, refunded, reversed)
 * No inserta en payments ni marca invoice paid desde webhook.
 *
 * Variables: PAYPAL_WEBHOOK_ID (opcional; si está configurado, valida firma)
 * Secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET (para verify-webhook-signature)
 *
 * URL: POST /functions/v1/paypal-webhook
 * PayPal envía a esta URL; no requiere Authorization header.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo',
  'Content-Type': 'application/json',
}

const AUTH_TIMEOUT_MS = 5000

function getApiBase(): string {
  const base = Deno.env.get('PAYPAL_API_BASE')
  if (base) return base
  const mode = (Deno.env.get('PAYPAL_MODE') ?? 'sandbox').toLowerCase()
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

async function getPayPalAccessToken(apiBase: string): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
  if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not configured')
  const auth = btoa(`${clientId}:${clientSecret}`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: controller.signal,
  })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`OAuth failed: ${res.status}`)
  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('No access_token')
  return data.access_token
}

/** Extrae provider_order_id del payload según event_type */
function extractProviderOrderId(event: Record<string, unknown>): string | null {
  const resource = event.resource as Record<string, unknown> | undefined
  if (!resource) return null
  const supp = resource.supplementary_data as Record<string, unknown> | undefined
  const related = supp?.related_ids as Record<string, string> | undefined
  if (related?.order_id) return related.order_id
  const resourceType = (event.resource_type as string) ?? ''
  if (resourceType.includes('order') && typeof resource.id === 'string') return resource.id
  if (typeof resource.id === 'string') return resource.id
  return null
}

/** Mapeo evento → status interno. Solo transiciones seguras (no completed desde webhook). */
const EVENT_TO_STATUS: Record<string, string> = {
  'CHECKOUT.ORDER.APPROVED': 'approved',
  'PAYMENT.CAPTURE.DECLINED': 'declined',
  'PAYMENT.CAPTURE.REFUNDED': 'refunded',
  'PAYMENT.CAPTURE.REVERSED': 'reversed',
}

/** Extrae status del resource PayPal si existe */
function extractResourceStatus(event: Record<string, unknown>): string | null {
  const resource = event.resource as Record<string, unknown> | undefined
  if (!resource || typeof resource.status !== 'string') return null
  return resource.status
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders },
    })
  }

  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID')
  const rawBody = await req.text()
  const headers = req.headers

  if (!rawBody || rawBody.trim().length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Empty body' }), {
      status: 400,
      headers: { ...corsHeaders },
    })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders },
    })
  }

  const eventType = (parsed.event_type as string) ?? 'unknown'
  const providerEventId = (parsed.id as string) ?? null

  let verified = false
  let processingStatus = 'received'
  let notes: string | null = null

  if (webhookId) {
    try {
      const apiBase = getApiBase()
      const token = await getPayPalAccessToken(apiBase)
      const verifyRes = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transmission_id: headers.get('paypal-transmission-id') ?? '',
          transmission_time: headers.get('paypal-transmission-time') ?? '',
          cert_url: headers.get('paypal-cert-url') ?? '',
          auth_algo: headers.get('paypal-auth-algo') ?? 'SHA256withRSA',
          transmission_sig: headers.get('paypal-transmission-sig') ?? '',
          webhook_id: webhookId,
          webhook_event: parsed,
        }),
      })
      const verifyData = await verifyRes.json() as { verification_status?: string }
      verified = verifyData.verification_status === 'SUCCESS'
      processingStatus = verified ? 'verified' : 'verification_failed'
      if (!verified) notes = `verify failed: ${verifyData.verification_status ?? 'unknown'}`
    } catch (err) {
      processingStatus = 'verification_failed'
      notes = err instanceof Error ? err.message : 'verify error'
    }
  } else {
    notes = 'PAYPAL_WEBHOOK_ID not set; accepted without verification'
  }

  const providerOrderId = extractProviderOrderId(parsed)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { error: insertErr } = await supabase.from('payment_webhook_events').insert({
    provider: 'paypal',
    event_type: eventType,
    provider_event_id: providerEventId,
    provider_order_id: providerOrderId,
    raw_payload: parsed as object,
    processing_status: processingStatus,
    notes,
  })

  if (insertErr) {
    console.error('paypal-webhook insert error:', insertErr.message)
  }

  if (verified && providerOrderId && /^[A-Za-z0-9_-]{10,50}$/.test(providerOrderId)) {
    try {
      const { data: existing } = await supabase
        .from('payment_intents')
        .select('id, metadata, status')
        .eq('provider_order_id', providerOrderId)
        .limit(1)
        .maybeSingle()

      if (existing) {
        const meta = (existing.metadata as Record<string, unknown>) ?? {}
        const currentStatus = (existing.status as string) ?? 'created'
        const newStatusFromEvent = EVENT_TO_STATUS[eventType]
        const paypalResourceStatus = extractResourceStatus(parsed)

        const metaUpdate: Record<string, unknown> = {
          ...meta,
          last_webhook_event_id: providerEventId,
          last_webhook_event_type: eventType,
          last_webhook_at: new Date().toISOString(),
        }
        if (paypalResourceStatus) metaUpdate.paypal_resource_status = paypalResourceStatus

        const updatePayload: Record<string, unknown> = { metadata: metaUpdate }
        if (newStatusFromEvent && currentStatus !== 'completed') {
          updatePayload.status = newStatusFromEvent
        }

        await supabase
          .from('payment_intents')
          .update(updatePayload)
          .eq('provider_order_id', providerOrderId)
      }
    } catch {
      /* no fallar respuesta */
    }
  }

  return new Response(JSON.stringify({ ok: true, received: true }), {
    status: 200,
    headers: { ...corsHeaders },
  })
})
