/**
 * Hook para listar clientes compradores del tenant (exportador).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

export function useClientesCompradores() {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.clientesCompradores, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('clientes_compradores')
        .select('*')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
