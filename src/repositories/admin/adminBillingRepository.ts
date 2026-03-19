/**
 * Repository: billing para admin.
 * Fuente: org_billing_settings, v_admin_organizations_summary, invoices, payments.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DbSubscriptionRow {
  organization_id: string;
  organization_name: string;
  plan: string;
  status: string;
  billing_cycle?: string;
  outstanding_balance: number;
  trial_ends_at: string | null;
}

export interface DbInvoice {
  id: string;
  organization_id: string;
  invoice_number: string | null;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: string;
  issued_at: string | null;
  due_at: string | null;
  currency?: string;
  paid_at?: string | null;
}

export interface DbPayment {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  method: string;
  reference: string | null;
  registered_by: string | null;
}

export async function fetchSubscriptionsFromDb(): Promise<DbSubscriptionRow[]> {
  const { data: summary, error: e1 } = await supabase
    .from('v_admin_organizations_summary')
    .select('organization_id, organization_name, plan, status, outstanding_balance')
    .order('organization_name');

  if (e1) throw e1;

  const orgIds = (summary ?? []).map((r) => r.organization_id);
  const billingMap = new Map<string, { plan_code: string; billing_cycle: string }>();
  if (orgIds.length > 0) {
    const { data: obs } = await supabase
      .from('org_billing_settings')
      .select('organization_id, plan_code, billing_cycle')
      .in('organization_id', orgIds);
    for (const row of (obs ?? []) as { organization_id: string; plan_code: string; billing_cycle: string }[]) {
      billingMap.set(row.organization_id, { plan_code: row.plan_code, billing_cycle: row.billing_cycle });
    }
  }

  return (summary ?? []).map((r) => {
    const b = billingMap.get(r.organization_id);
    return {
      organization_id: r.organization_id,
      organization_name: r.organization_name,
      plan: b?.plan_code ?? r.plan ?? 'none',
      status: r.status ?? 'en_prueba',
      billing_cycle: b?.billing_cycle,
      outstanding_balance: Number(r.outstanding_balance ?? 0),
      trial_ends_at: null,
    };
  }) as DbSubscriptionRow[];
}

export async function fetchInvoicesFromDb(limit = 50): Promise<DbInvoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, organization_id, invoice_number, period_start, period_end, total_amount, status, issued_at, due_at, currency, paid_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as DbInvoice[];
}

/** Una invoice por id (para detalle). */
export async function fetchInvoiceById(id: string): Promise<DbInvoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, organization_id, invoice_number, period_start, period_end, total_amount, status, issued_at, due_at, currency, paid_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DbInvoice | null;
}

/** Todos los payment_intents de una invoice (reference_type=invoice, reference_id=invoiceId). */
export async function fetchPaymentIntentsByInvoiceId(invoiceId: string): Promise<DbPaymentIntent[]> {
  const { data, error } = await supabase
    .from('payment_intents')
    .select('id, created_at, provider_order_id, status, reference_type, reference_id, metadata')
    .eq('reference_type', 'invoice')
    .eq('reference_id', invoiceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbPaymentIntent[];
}

/** Todos los payments de una invoice. */
export async function fetchPaymentsByInvoiceId(invoiceId: string): Promise<DbPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, organization_id, invoice_id, amount, payment_date, method, reference, registered_by')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbPayment[];
}

export async function fetchPaymentsFromDb(limit = 50): Promise<DbPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, organization_id, invoice_id, amount, payment_date, method, reference, registered_by')
    .order('payment_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as DbPayment[];
}

export interface DbPaymentIntent {
  id: string;
  created_at: string;
  provider_order_id: string | null;
  status: string;
  reference_type: string;
  reference_id: string | null;
  metadata: Record<string, unknown>;
}

/** Último payment_intent por invoice (reference_type=invoice) para las invoices dadas. */
export async function fetchPaymentIntentsByInvoiceIds(invoiceIds: string[]): Promise<Map<string, DbPaymentIntent>> {
  if (invoiceIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('payment_intents')
    .select('id, created_at, provider_order_id, status, reference_type, reference_id, metadata')
    .eq('reference_type', 'invoice')
    .in('reference_id', invoiceIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const map = new Map<string, DbPaymentIntent>();
  for (const row of (data ?? []) as DbPaymentIntent[]) {
    const refId = row.reference_id;
    if (refId && !map.has(refId)) {
      map.set(refId, row);
    }
  }
  return map;
}

export async function fetchOrgNamesBatch(orgIds: string[]): Promise<Map<string, string>> {
  if (orgIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('platform_organizations')
    .select('id, name, display_name')
    .in('id', orgIds);

  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of (data ?? []) as { id: string; name: string | null; display_name: string | null }[]) {
    map.set(row.id, row.name ?? row.display_name ?? 'Sin nombre');
  }
  return map;
}

export interface RegisterPaymentInput {
  organizationId: string;
  invoiceId?: string | null;
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
}

export interface CreateInvoiceInput {
  organizationId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  amount: number;
  dueAt?: string | null; // ISO date, default periodEnd + 30d
  description?: string | null;
}

function mapMethodToDb(m: string): string {
  const v = (m ?? '').toLowerCase();
  if (v === 'card' || v === 'stripe') return 'stripe';
  if (v === 'transfer') return 'transferencia';
  if (v === 'efectivo') return 'efectivo';
  if (v === 'cheque') return 'cheque';
  return 'otro';
}

export async function insertPaymentInDb(input: RegisterPaymentInput): Promise<DbPayment> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      organization_id: input.organizationId,
      invoice_id: input.invoiceId ?? null,
      amount: input.amount,
      method: mapMethodToDb(input.method),
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  const payment = data as DbPayment;

  await supabase.rpc('log_admin_action', {
    p_organization_id: input.organizationId,
    p_target_user_id: null,
    p_action_type: 'registrar_pago',
    p_action_payload: {
      amount: input.amount,
      method: mapMethodToDb(input.method),
      invoice_id: input.invoiceId ?? null,
      reference: input.reference ?? null,
    },
  });

  return payment;
}

export async function insertInvoiceInDb(input: CreateInvoiceInput): Promise<DbInvoice> {
  const dueAt = input.dueAt ?? (() => {
    const d = new Date(input.periodEnd);
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })();

  const { data: inv, error: e1 } = await supabase
    .from('invoices')
    .insert({
      organization_id: input.organizationId,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      due_at: dueAt,
      status: 'draft',
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
    })
    .select()
    .single();

  if (e1) throw e1;
  const invoice = inv as { id: string };

  const desc = input.description ?? 'Suscripción';
  const amt = Number(input.amount);

  const { error: e2 } = await supabase.from('invoice_lines').insert({
    invoice_id: invoice.id,
    line_type: 'subscription',
    description: desc,
    quantity: 1,
    unit_price: amt,
    line_total: amt,
  });

  if (e2) throw e2;

  await supabase.rpc('log_admin_action', {
    p_organization_id: input.organizationId,
    p_target_user_id: null,
    p_action_type: 'emitir_factura',
    p_action_payload: {
      invoice_id: invoice.id,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      amount: amt,
    },
  });

  const { data: fresh } = await supabase
    .from('invoices')
    .select('id, organization_id, invoice_number, period_start, period_end, total_amount, status, issued_at, due_at')
    .eq('id', invoice.id)
    .single();

  return fresh as DbInvoice;
}
