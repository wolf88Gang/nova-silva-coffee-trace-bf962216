/**
 * PayPal proxy — Edge Function mínima.
 * OAuth2 automático, whitelist estricta, sin exponer secrets.
 *
 * Requiere:
 * - Usuario autenticado real (session.access_token, no anon key)
 * - Usuario normal: organization_id en profiles (get_user_organization_id)
 * - Admin: is_admin() permite bypass de org para invoice_payment
 *
 * Política de permisos (ver docs/PAYPAL_PROXY_POLICY.md):
 * - CREATE (invoice): admin → cualquier invoice; usuario → solo invoices de su org
 * - CREATE (sandbox): usuario con org → payload libre
 * - GET/CAPTURE: admin → cualquier orderId; usuario → solo orders de su org
 *
 * Invocación: Authorization: Bearer <session.access_token>
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const REQUEST_TIMEOUT_MS = 15000
const AUTH_TIMEOUT_MS = 5000
const MAX_RETRIES = 2

type AllowedAction = 'create' | 'capture' | 'get'

const ALLOWED_ROUTES: Record<AllowedAction, { method: string; path: string }> = {
  create: { method: 'POST', path: '/v2/checkout/orders' },
  capture: { method: 'POST', path: '/v2/checkout/orders/{id}/capture' },
  get: { method: 'GET', path: '/v2/checkout/orders/{id}' },
}

/** PayPal order ID: alphanumeric, 10-50 chars. Evita path traversal. */
const ORDER_ID_REGEX = /^[A-Za-z0-9_-]{10,50}$/

function isValidOrderId(id: string): boolean {
  return ORDER_ID_REGEX.test(id)
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders } })
}

function getApiBase(): string {
  const base = Deno.env.get('PAYPAL_API_BASE')
  if (base) return base
  const mode = (Deno.env.get('PAYPAL_MODE') ?? 'sandbox').toLowerCase()
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getAccessToken(apiBase: string): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not configured')
  }

  const auth = btoa(`${clientId}:${clientSecret}`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)

  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: controller.signal,
  })
  clearTimeout(timeout)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OAuth failed: ${res.status} ${text.slice(0, 100)}`)
  }

  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('No access_token in OAuth response')
  return data.access_token
}

async function callPayPal(
  apiBase: string,
  token: string,
  method: string,
  path: string,
  body?: object
): Promise<{ status: number; data: unknown }> {
  const url = `${apiBase}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const opts: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  }
  if (body && method !== 'GET') opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  clearTimeout(timeout)

  let data: unknown
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  return { status: res.status, data }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ ok: false, error: 'Missing Authorization header' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return jsonResponse({
      ok: false,
      error: 'Unauthorized',
      details: 'Requires authenticated user. Use session.access_token, not anon key.',
    }, 401)
  }

  const { data: orgData } = await supabase.rpc('get_user_organization_id', { p_user_id: user.id })
  const orgId = orgData as string | null
  const { data: isAdminData } = await supabase.rpc('is_admin')
  const isAdmin = isAdminData === true
  // Usuario normal requiere org. Admin puede proceder sin org (ej. superadmin) para invoice_payment.
  if (!orgId && !isAdmin) {
    return jsonResponse({
      ok: false,
      error: 'Forbidden',
      details: 'User has no organization. Complete your profile or onboarding to use PayPal.',
    }, 403)
  }

  try {
    const apiBase = getApiBase()
    const rawBody = await req.text()
    let body: { action?: string; orderId?: string; payload?: object }
    try {
      body = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
    }

    const action = body.action as AllowedAction | undefined
    if (!action || !ALLOWED_ROUTES[action]) {
      return jsonResponse({
        ok: false,
        error: 'Invalid action',
        details: `Allowed: ${Object.keys(ALLOWED_ROUTES).join(', ')}`,
      }, 400)
    }

    const route = ALLOWED_ROUTES[action]
    let path = route.path

    if (action === 'capture' || action === 'get') {
      const orderId = body.orderId
      if (!orderId || typeof orderId !== 'string') {
        return jsonResponse({ ok: false, error: 'orderId required for capture/get' }, 400)
      }
      if (!isValidOrderId(orderId)) {
        return jsonResponse({ ok: false, error: 'Invalid orderId format' }, 400)
      }
      path = path.replace('{id}', orderId)
    }

    let token: string | null = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        token = await getAccessToken(apiBase)
        break
      } catch {
        if (attempt === MAX_RETRIES) {
          return jsonResponse({
            ok: false,
            error: 'Auth failed',
            details: 'Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Supabase Secrets.',
          }, 503)
        }
      }
    }
    if (!token) {
      return jsonResponse({ ok: false, error: 'Auth failed' }, 503)
    }

    let payload: object | undefined
    let invoiceId: string | null = null
    let invoiceNumber: string | null = null
    let invoiceOrgId: string | null = null

    if (action === 'create') {
      const invoiceIdParam = body.invoiceId as string | undefined
      if (invoiceIdParam) {
        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .select('id, organization_id, total_amount, currency, status, invoice_number')
          .eq('id', invoiceIdParam)
          .maybeSingle()
        if (invErr) {
          return jsonResponse({ ok: false, error: 'Invoice lookup failed', details: invErr.message }, 500)
        }
        const invoice = inv as { id: string; organization_id: string; total_amount: number; currency: string; status: string; invoice_number: string | null } | null
        if (!invoice) {
          return jsonResponse({ ok: false, error: 'Invoice not found', details: 'La factura no existe.' }, 404)
        }
        if (invoice.status === 'paid') {
          return jsonResponse({ ok: false, error: 'Invoice already paid', details: 'Esta factura ya está pagada.' }, 400)
        }
        if (invoice.status === 'void') {
          return jsonResponse({ ok: false, error: 'Invoice void', details: 'Esta factura está anulada.' }, 400)
        }
        // [POLICY] Admin: cualquier invoice. Usuario: solo invoice.organization_id === orgId.
        if (!isAdmin && invoice.organization_id !== orgId) {
          return jsonResponse({ ok: false, error: 'Forbidden', details: 'La factura no pertenece a tu organización.' }, 403)
        }
        const amount = Number(invoice.total_amount)
        if (!Number.isFinite(amount) || amount <= 0) {
          return jsonResponse({ ok: false, error: 'Invalid invoice amount', details: 'Monto inválido en la factura.' }, 400)
        }
        invoiceId = invoice.id
        invoiceNumber = invoice.invoice_number ?? `Invoice ${invoice.id.slice(0, 8)}`
        invoiceOrgId = invoice.organization_id
        const appCtx = isPlainObject(body.payload) ? (body.payload as Record<string, unknown>).application_context : undefined
        payload = {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: (invoice.currency || 'USD').toUpperCase().slice(0, 3),
              value: amount.toFixed(2),
            },
            description: `Factura ${invoiceNumber}`,
          }],
          application_context: appCtx ?? undefined,
        }
      } else {
        if (!isPlainObject(body.payload)) {
          return jsonResponse({ ok: false, error: 'payload required for create (must be object)' }, 400)
        }
        payload = body.payload
      }
    }

    const { status, data } = await callPayPal(apiBase, token, route.method, path, payload)

    if (status >= 400) {
      const errMsg = typeof data === 'object' && data !== null && 'message' in data
        ? (data as { message?: string }).message
        : 'PayPal request failed'
      return jsonResponse({
        ok: false,
        error: 'PayPal error',
        details: errMsg,
        status,
      }, 502)
    }

    // Persistir trazabilidad en payment_intents (no bloquea respuesta)
    try {
      const paypalData = data as Record<string, unknown>
      if (action === 'create') {
        const orderId = paypalData?.id as string | undefined
        const units = (paypalData?.purchase_units ?? payload?.purchase_units) as Array<Record<string, unknown>> | undefined
        const amt = units?.[0]?.amount as Record<string, string> | undefined
        const amount = amt?.value ? parseFloat(amt.value) : null
        const currency = amt?.currency_code ?? null
        const intentType = invoiceId ? 'invoice_payment' : ((body.intent_type as string) ?? 'sandbox_test')
        const referenceType = invoiceId ? 'invoice' : ((body.reference_type as string) ?? 'none')
        const referenceId = invoiceId ?? (body.reference_id as string) ?? null
        const description = invoiceId ? `Factura ${invoiceNumber}` : ((body.description as string) ?? (intentType === 'sandbox_test' ? 'PayPal sandbox test' : null))
        // payment_intent.organization_id = invoice's org (invoice flow) o user's org (sandbox)
        const insertOrgId = invoiceOrgId ?? orgId
        if (!insertOrgId) {
          console.warn('paypal-proxy: skipping payment_intents insert (no org)')
        } else {
        await supabase.from('payment_intents').insert({
          organization_id: insertOrgId,
          provider: 'paypal',
          provider_order_id: orderId ?? null,
          amount,
          currency,
          status: 'created',
          source: invoiceId ? 'paypal_invoice' : 'paypal_sandbox',
          intent_type: intentType,
          reference_type: referenceType,
          reference_id: referenceId,
          description: description ?? (intentType === 'sandbox_test' ? 'PayPal sandbox test' : null),
          metadata: { paypal_status: paypalData?.status ?? null, invoice_id: invoiceId ?? undefined },
          created_by: user.id,
        })
        }
      } else if (action === 'get' || action === 'capture') {
        const orderId = body.orderId as string
        const paypalStatus = paypalData?.status as string | undefined
        const newStatus = action === 'capture' || paypalStatus === 'COMPLETED'
          ? 'completed'
          : (paypalStatus?.toLowerCase() ?? 'fetched')
        // [POLICY] Admin: lookup por orderId solo. Usuario: orderId + organization_id.
        let q = supabase.from('payment_intents').select('id, organization_id, reference_type, reference_id, metadata').eq('provider_order_id', orderId)
        if (!isAdmin && orgId) q = q.eq('organization_id', orgId)
        const { data: existing } = await q.limit(1).maybeSingle()
        if (existing) {
          const existingOrgId = (existing as { organization_id?: string }).organization_id
          const existingMeta = (existing as { metadata?: Record<string, unknown> }).metadata ?? {}
          const metaUpdate: Record<string, unknown> = { ...existingMeta, last_fetched: new Date().toISOString(), paypal_status: paypalStatus }
          if (action === 'capture') {
            const refType = (existing as { reference_type?: string }).reference_type
            const refId = (existing as { reference_id?: string }).reference_id
            if (refType === 'invoice' && refId && !existingMeta.captured_payment_id) {
              let amount: number | null = null
              let currency = 'USD'
              const amtTop = (paypalData as Record<string, unknown>)?.amount as Record<string, string> | undefined
              if (amtTop?.value) {
                amount = parseFloat(amtTop.value)
                currency = amtTop.currency_code ?? currency
              } else {
                const units = (paypalData as Record<string, unknown>)?.purchase_units as Array<Record<string, unknown>> | undefined
                const amt = units?.[0]?.amount as Record<string, string> | undefined
                if (amt?.value) {
                  amount = parseFloat(amt.value)
                  currency = amt.currency_code ?? currency
                }
              }
              const existingRow = existing as { amount?: number }
              if (amount == null || !Number.isFinite(amount)) amount = existingRow.amount ?? 0
              try {
                const { data: payId } = await supabase.rpc('register_paypal_invoice_payment', {
                  p_invoice_id: refId,
                  p_amount: amount ?? 0,
                  p_currency: currency,
                  p_provider_order_id: orderId,
                  p_organization_id: orgId ?? existingOrgId ?? null,
                  p_registered_by: user.id,
                })
                if (payId) metaUpdate.captured_payment_id = payId
              } catch {
                /* no fallar respuesta */
              }
            }
          }
          // Update por existingOrgId (admin puede haber creado para otra org)
          const updateOrgFilter = existingOrgId ?? orgId
          if (updateOrgFilter) {
            await supabase
              .from('payment_intents')
              .update({ status: newStatus, metadata: metaUpdate })
              .eq('provider_order_id', orderId)
              .eq('organization_id', updateOrgFilter)
          }
        }
      }
    } catch {
      // No fallar la respuesta por error de persistencia
    }

    return jsonResponse({ ok: true, data }, 200)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('abort')) {
      return jsonResponse({ ok: false, error: 'Request timeout' }, 504)
    }
    return jsonResponse({ ok: false, error: 'Internal error' }, 500)
  }
})
