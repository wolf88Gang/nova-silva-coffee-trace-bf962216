/**
 * Hook para listar entregas del tenant.
 * Filtra por cooperativa_id = organizationId.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';

export function useEntregas() {
  const { organizationId, productorId, role, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: ['entregas', organizationId, productorId, role],
    queryFn: async () => {
      if (organizationId) {
        let q = supabase.from('entregas').select('*').eq('cooperativa_id', organizationId);
        if (role === 'productor' && productorId) {
          q = q.eq('productor_id', productorId);
        }
        const { data, error } = await q;
        if (!error && data) return data;
      }
      return [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
