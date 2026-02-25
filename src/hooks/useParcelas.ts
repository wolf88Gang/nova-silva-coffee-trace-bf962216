/**
 * Hook para listar parcelas del tenant.
 * Filtra por cooperativa_id = organizationId.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';

export function useParcelas() {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: ['parcelas', organizationId],
    queryFn: async () => {
      if (organizationId) {
        const { data, error } = await supabase.from('parcelas').select('*').eq('cooperativa_id', organizationId);
        if (!error && data) return data;
      }
      return [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
