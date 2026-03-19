/**
 * Repository: payment_intents.
 * Trazabilidad de intentos de pago (PayPal sandbox).
 */

import { supabase } from '@/integrations/supabase/client';

export interface PaymentIntentRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  organization_id: string;
  provider: string;
  provider_order_id: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  source: string | null;
  intent_type: string;
  reference_type: string;
  reference_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
}

export async function fetchPaymentIntentsByOrg(
  organizationId: string,
  limit = 20
): Promise<PaymentIntentRow[]> {
  const { data, error } = await supabase
    .from('payment_intents')
    .select('id, created_at, updated_at, organization_id, provider, provider_order_id, amount, currency, status, source, intent_type, reference_type, reference_id, description, metadata, created_by')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PaymentIntentRow[];
}
