/**
 * Servicio: payment_intents.
 * Trazabilidad de intentos de pago. Usa repository.
 */

import {
  fetchPaymentIntentsByOrg,
  type PaymentIntentRow,
} from '@/repositories/paymentIntentsRepository';

export interface PaymentIntent {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  organizationId: string;
  provider: string;
  providerOrderId: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  source: string | null;
  intentType: string;
  referenceType: string;
  referenceId: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
}

function mapRowToIntent(row: PaymentIntentRow): PaymentIntent {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    organizationId: row.organization_id,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    source: row.source,
    intentType: row.intent_type ?? 'sandbox_test',
    referenceType: row.reference_type ?? 'none',
    referenceId: row.reference_id ?? null,
    description: row.description ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export async function getPaymentIntentsByOrg(
  organizationId: string,
  limit?: number
): Promise<PaymentIntent[]> {
  const rows = await fetchPaymentIntentsByOrg(organizationId, limit);
  return rows.map(mapRowToIntent);
}
