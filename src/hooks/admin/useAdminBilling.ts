/**
 * Hook: facturación para admin.
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchSubscriptions,
  fetchInvoices,
  fetchPayments,
  fetchRevenueSnapshot,
} from '@/services/admin/adminBillingService';

export function useAdminBilling() {
  const revenue = useQuery({ queryKey: ['admin_revenue'], queryFn: fetchRevenueSnapshot });
  const subscriptions = useQuery({ queryKey: ['admin_subscriptions'], queryFn: fetchSubscriptions });
  const invoices = useQuery({ queryKey: ['admin_invoices'], queryFn: fetchInvoices });
  const payments = useQuery({ queryKey: ['admin_payments'], queryFn: fetchPayments });

  return {
    revenue,
    subscriptions,
    invoices,
    payments,
  };
}
