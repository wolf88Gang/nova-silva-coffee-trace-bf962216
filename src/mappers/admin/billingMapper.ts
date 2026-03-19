/**
 * Mapper: DB → AdminSubscription, AdminInvoice, AdminPayment.
 * Normaliza invoice_status (issued→sent, void→cancelled) y payment method.
 */

import type { AdminSubscription, AdminInvoice, AdminPayment, AdminInvoicePayPalIntent, AdminInvoicePayPalIntentRow, AdminInvoiceDetail, InvoiceReconciliationStatus, InvoiceStatus, PaymentMethod, OrgPlan, BillingCycle, OrgStatus } from '@/types/admin';
import type { DbSubscriptionRow, DbInvoice, DbPayment, DbPaymentIntent } from '@/repositories/admin/adminBillingRepository';

function mapInvoiceStatus(s: string): InvoiceStatus {
  const v = (s ?? '').toLowerCase();
  if (v === 'issued') return 'sent';
  if (v === 'void') return 'cancelled';
  if (['draft', 'paid', 'overdue'].includes(v)) return v as InvoiceStatus;
  return 'draft';
}

function mapPaymentMethod(m: string): PaymentMethod {
  const v = (m ?? '').toLowerCase();
  if (v === 'stripe') return 'card';
  if (v === 'transferencia') return 'transfer';
  if (v === 'paypal') return 'paypal';
  return 'manual';
}

function mapPlan(p: string): OrgPlan {
  const v = (p ?? '').toLowerCase();
  if (['lite', 'smart', 'plus', 'none'].includes(v)) return v as OrgPlan;
  return 'none';
}

function mapBillingCycle(c: string | null): BillingCycle {
  const v = (c ?? '').toLowerCase();
  return v === 'anual' ? 'anual' : 'mensual';
}

function mapOrgStatus(s: string): OrgStatus {
  const v = (s ?? '').toLowerCase();
  if (['activo', 'en_prueba', 'vencido', 'suspendido', 'cerrado'].includes(v)) return v as OrgStatus;
  return 'en_prueba';
}

export function mapSubscriptionToAdmin(d: DbSubscriptionRow, orgName: string): AdminSubscription {
  return {
    id: `sub-${d.organization_id}`,
    organizationId: d.organization_id,
    organizationName: orgName,
    plan: mapPlan(d.plan),
    cycle: mapBillingCycle(d.billing_cycle),
    status: mapOrgStatus(d.status),
    addOns: [],
    balanceDue: d.outstanding_balance > 0 ? d.outstanding_balance : undefined,
  };
}

function mapPayPalIntent(pi: DbPaymentIntent | null | undefined): AdminInvoicePayPalIntent | undefined {
  if (!pi) return undefined;
  const meta = (pi.metadata ?? {}) as { captured_payment_id?: string };
  return {
    status: pi.status ?? 'unknown',
    providerOrderId: pi.provider_order_id ?? null,
    isCaptured: !!meta.captured_payment_id,
    createdAt: pi.created_at ?? '',
  };
}

function mapPayPalIntentRow(pi: DbPaymentIntent): AdminInvoicePayPalIntentRow {
  const base = mapPayPalIntent(pi)!;
  return { ...base, id: pi.id };
}

function computeReconciliationStatus(
  invoiceStatus: string,
  paymentIntents: DbPaymentIntent[],
  paymentsCount: number
): InvoiceReconciliationStatus {
  if ((invoiceStatus ?? '').toLowerCase() === 'paid') return 'invoice_paid';
  if (paymentsCount > 0) return 'pago_registrado';
  const hasCaptured = paymentIntents.some((pi) => !!((pi.metadata ?? {}) as { captured_payment_id?: string }).captured_payment_id);
  if (hasCaptured) return 'capturado';
  if (paymentIntents.length > 0) return 'intento_creado';
  return 'sin_intento';
}

export function mapInvoiceDetailToAdmin(
  d: DbInvoice,
  orgName: string,
  intents: DbPaymentIntent[],
  payments: DbPayment[]
): AdminInvoiceDetail {
  const status = mapInvoiceStatus(d.status);
  const reconciliationStatus = computeReconciliationStatus(d.status ?? '', intents, payments.length);
  return {
    id: d.id,
    number: d.invoice_number ?? `INV-${d.id.slice(0, 8)}`,
    organizationId: d.organization_id,
    organizationName: orgName,
    periodStart: d.period_start,
    periodEnd: d.period_end,
    amount: Number(d.total_amount),
    currency: d.currency ?? 'USD',
    status,
    issuedAt: d.issued_at ?? null,
    dueAt: d.due_at ?? null,
    paidAt: d.paid_at ?? null,
    paymentIntents: intents.map(mapPayPalIntentRow),
    payments: payments.map((p) => mapPaymentToAdmin(p, orgName)),
    reconciliationStatus,
  };
}

export function mapInvoiceToAdmin(d: DbInvoice, orgName: string, payPalIntent?: DbPaymentIntent | null): AdminInvoice {
  return {
    id: d.id,
    number: d.invoice_number ?? `INV-${d.id.slice(0, 8)}`,
    organizationId: d.organization_id,
    organizationName: orgName,
    periodStart: d.period_start,
    periodEnd: d.period_end,
    amount: Number(d.total_amount),
    status: mapInvoiceStatus(d.status),
    issuedAt: d.issued_at ?? d.period_start,
    dueAt: d.due_at ?? d.period_end,
    lastPayPalIntent: mapPayPalIntent(payPalIntent),
  };
}

export function mapPaymentToAdmin(d: DbPayment, orgName: string): AdminPayment {
  return {
    id: d.id,
    organizationId: d.organization_id,
    organizationName: orgName,
    amount: Number(d.amount),
    paidAt: d.payment_date,
    method: mapPaymentMethod(d.method),
    reference: d.reference,
    registeredBy: d.registered_by ? 'admin' : null,
  };
}
