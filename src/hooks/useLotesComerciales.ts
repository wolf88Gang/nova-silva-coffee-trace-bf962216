/**
 * Hook para listar lotes comerciales del tenant.
 * Filtra por organization_id (exportador o cooperativa).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';

export function useLotesComerciales(options?: { loteId?: string }) {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: ['lotes_comerciales', organizationId, options?.loteId],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = supabase
        .from('lotes_comerciales')
        .select('*')
        .or(`organization_id.eq.${organizationId},exportador_id.eq.${organizationId},cooperativa_id.eq.${organizationId}`);
      if (options?.loteId) {
        q = q.eq('id', options.loteId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
