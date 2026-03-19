/**
 * Servicio de facturación para admin.
 * Usa repository + mapper. Retorna isFallback cuando usa mock.
 */

import type { AdminSubscription, AdminInvoice, AdminPayment, AdminInvoiceDetail } from '@/types/admin';
import { adminSuccess, adminFallback, type AdminDataResult } from '@/types/adminData';
import { ADMIN_ALLOW_MOCK_FALLBACK } from '@/config/adminEnv';
import {
  fetchSubscriptionsFromDb,
  fetchInvoicesFromDb,
  fetchPaymentsFromDb,
  fetchPaymentIntentsByInvoiceIds,
  fetchInvoiceById,
  fetchPaymentIntentsByInvoiceId,
  fetchPaymentsByInvoiceId,
  fetchOrgNamesBatch,
  insertPaymentInDb,
  insertInvoiceInDb,
  type RegisterPaymentInput,
  type CreateInvoiceInput,
} from '@/repositories/admin/adminBillingRepository';
import { mapSubscriptionToAdmin, mapInvoiceToAdmin, mapPaymentToAdmin, mapInvoiceDetailToAdmin } from '@/mappers/admin/billingMapper';
import { MOCK_SUBSCRIPTIONS, MOCK_INVOICES, MOCK_PAYMENTS } from '@/data/admin/mockData';

export interface RevenueSnapshot {
  mrr: number;
  activeClients: number;
  trialsActive: number;
  overdueAccounts: number;
  pendingCollections: number;
}

export async function fetchSubscriptions(): Promise<AdminDataResult<AdminSubscription[]>> {
  try {
    const rows = await fetchSubscriptionsFromDb();
    return adminSuccess(rows.map((r) => mapSubscriptionToAdmin(r, r.organization_name)));
  } catch (err) {
    console.warn('[admin] fetchSubscriptions Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_SUBSCRIPTIONS]);
  }
}

export async function fetchInvoices(): Promise<AdminDataResult<AdminInvoice[]>> {
  try {
    const rows = await fetchInvoicesFromDb();
    const orgIds = [...new Set(rows.map((r) => r.organization_id))];
    const invoiceIds = rows.map((r) => r.id);
    const [orgNames, payPalIntents] = await Promise.all([
      fetchOrgNamesBatch(orgIds),
      fetchPaymentIntentsByInvoiceIds(invoiceIds),
    ]);
    return adminSuccess(
      rows.map((r) =>
        mapInvoiceToAdmin(r, orgNames.get(r.organization_id) ?? 'Sin org', payPalIntents.get(r.id))
      )
    );
  } catch (err) {
    console.warn('[admin] fetchInvoices Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_INVOICES]);
  }
}

export async function fetchPayments(): Promise<AdminDataResult<AdminPayment[]>> {
  try {
    const rows = await fetchPaymentsFromDb();
    const orgIds = [...new Set(rows.map((r) => r.organization_id))];
    const orgNames = await fetchOrgNamesBatch(orgIds);
    return adminSuccess(rows.map((r) => mapPaymentToAdmin(r, orgNames.get(r.organization_id) ?? 'Sin org')));
  } catch (err) {
    console.warn('[admin] fetchPayments Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_PAYMENTS]);
  }
}

export async function fetchRevenueSnapshot(): Promise<AdminDataResult<RevenueSnapshot>> {
  try {
    const [subs, invoices] = await Promise.all([fetchSubscriptionsFromDb(), fetchInvoicesFromDb(500)]);
    const activeClients = subs.filter((s) => s.status === 'activo').length;
    const trialsActive = subs.filter((s) => s.status === 'en_prueba').length;
    const overdueAccounts = subs.filter((s) => s.status === 'vencido').length;
    const pendingCollections = invoices
      .filter((i) => ['overdue', 'issued'].includes((i.status ?? '').toLowerCase()))
      .reduce((s, i) => s + Number(i.total_amount ?? 0), 0);
    const mrr = subs
      .filter((s) => ['activo', 'en_prueba'].includes(s.status))
      .reduce((s, sub) => {
        const base = sub.plan === 'plus' ? 450 : sub.plan === 'smart' ? 320 : 120;
        return s + base;
      }, 0);
    return adminSuccess({
      mrr,
      activeClients,
      trialsActive,
      overdueAccounts,
      pendingCollections,
    });
  } catch (err) {
    console.warn('[admin] fetchRevenueSnapshot Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    const subs = MOCK_SUBSCRIPTIONS;
    const invoices = MOCK_INVOICES;
    return adminFallback({
      mrr: subs.filter((s) => ['activo', 'en_prueba'].includes(s.status)).reduce((s, sub) => s + (sub.plan === 'plus' ? 450 : sub.plan === 'smart' ? 320 : 120), 0),
      activeClients: subs.filter((s) => s.status === 'activo').length,
      trialsActive: subs.filter((s) => s.status === 'en_prueba').length,
      overdueAccounts: subs.filter((s) => s.status === 'vencido').length,
      pendingCollections: invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    });
  }
}

/** Detalle de factura con intentos PayPal y pagos. */
export async function fetchInvoiceDetail(invoiceId: string): Promise<AdminInvoiceDetail | null> {
  const [invoice, intents, payments] = await Promise.all([
    fetchInvoiceById(invoiceId),
    fetchPaymentIntentsByInvoiceId(invoiceId),
    fetchPaymentsByInvoiceId(invoiceId),
  ]);
  if (!invoice) return null;
  const orgNames = await fetchOrgNamesBatch([invoice.organization_id]);
  const orgName = orgNames.get(invoice.organization_id) ?? 'Sin org';
  return mapInvoiceDetailToAdmin(invoice, orgName, intents, payments);
}

export async function registerPayment(input: RegisterPaymentInput): Promise<void> {
  await insertPaymentInDb(input);
}

export async function createInvoice(input: CreateInvoiceInput): Promise<void> {
  await insertInvoiceInDb(input);
}
