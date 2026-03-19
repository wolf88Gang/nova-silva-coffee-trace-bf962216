/**
 * Servicio: proxy PayPal vía Edge Function.
 * No expone secrets. Solo llama a paypal-proxy.
 *
 * Requiere:
 * - Usuario autenticado (session.access_token; si no, 401)
 * - profiles.organization_id asignado (si no, 403)
 *
 * El cliente Supabase envía automáticamente session.access_token cuando hay sesión.
 * Invocar solo cuando el usuario esté logueado y tenga organización asignada.
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreateOrderPayload {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: Array<{
    amount: { currency_code: string; value: string };
    description?: string;
  }>;
  /** Para redirect flow: return_url y cancel_url donde PayPal redirige al usuario */
  application_context?: {
    return_url?: string;
    cancel_url?: string;
  };
}

export interface PayPalProxyResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: string;
  status?: number;
}

export interface CreateInvoiceOrderInput {
  invoiceId: string;
  returnUrl: string;
  cancelUrl: string;
}

export async function createPayPalOrder(payload: CreateOrderPayload): Promise<PayPalProxyResult> {
  const { data, error } = await supabase.functions.invoke('paypal-proxy', {
    body: { action: 'create', payload },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.ok === false) return { ok: false, error: data.error, details: data.details, status: data.status };
  return { ok: true, data: data?.data };
}

/** Crear orden PayPal para pagar una invoice. Monto y moneda vienen del backend. */
export async function createPayPalInvoiceOrder(input: CreateInvoiceOrderInput): Promise<PayPalProxyResult> {
  const { data, error } = await supabase.functions.invoke('paypal-proxy', {
    body: {
      action: 'create',
      invoiceId: input.invoiceId,
      payload: { application_context: { return_url: input.returnUrl, cancel_url: input.cancelUrl } },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.ok === false) return { ok: false, error: data.error, details: data.details, status: data.status };
  return { ok: true, data: data?.data };
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalProxyResult> {
  const { data, error } = await supabase.functions.invoke('paypal-proxy', {
    body: { action: 'capture', orderId },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.ok === false) return { ok: false, error: data.error, details: data.details, status: data.status };
  return { ok: true, data: data?.data };
}

export async function getPayPalOrder(orderId: string): Promise<PayPalProxyResult> {
  const { data, error } = await supabase.functions.invoke('paypal-proxy', {
    body: { action: 'get', orderId },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.ok === false) return { ok: false, error: data.error, details: data.details, status: data.status };
  return { ok: true, data: data?.data };
}
