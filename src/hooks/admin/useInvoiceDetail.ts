/**
 * Hook: detalle de factura con intentos PayPal y pagos.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchInvoiceDetail } from '@/services/admin/adminBillingService';

export function useInvoiceDetail(invoiceId: string | null) {
  return useQuery({
    queryKey: ['admin_invoice_detail', invoiceId],
    queryFn: () => fetchInvoiceDetail(invoiceId!),
    enabled: !!invoiceId,
  });
}
