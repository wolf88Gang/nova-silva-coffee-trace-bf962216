/**
 * Hook: payment_intents.
 * Lista intentos de pago de la organización (trazabilidad PayPal sandbox).
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrgContext } from './useOrgContext';
import { getPaymentIntentsByOrg, type PaymentIntent } from '@/services/paymentIntentsService';

export function usePaymentIntents(limit = 10) {
  const { organizationId, isLoading: orgLoading } = useOrgContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['payment_intents', organizationId, limit],
    queryFn: () => getPaymentIntentsByOrg(organizationId!, limit),
    enabled: !orgLoading && !!organizationId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payment_intents', organizationId, limit] });
  };

  return {
    ...query,
    intents: (query.data ?? []) as PaymentIntent[],
    invalidate,
  };
}
