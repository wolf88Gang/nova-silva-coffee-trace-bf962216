/**
 * Repository: invoices por organización.
 * RLS filtra por organization_id del usuario.
 */

import { supabase } from '@/integrations/supabase/client';

export interface InvoiceRow {
  id: string;
  organization_id: string;
  invoice_number: string | null;
  period_start: string;
  period_end: string;
  total_amount: number;
  currency: string;
  status: string;
  issued_at: string | null;
  due_at: string | null;
}

export async function fetchInvoicesByOrg(organizationId: string, limit = 50): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, organization_id, invoice_number, period_start, period_end, total_amount, currency, status, issued_at, due_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as InvoiceRow[];
}
