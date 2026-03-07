/**
 * Hook para listar contratos del tenant.
 * Filtra por organization_id (exportador o cooperativa).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';

export function useContratos(options?: { contratoId?: string; estado?: string }) {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: ['contratos', organizationId, options?.contratoId, options?.estado],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = supabase
        .from('contratos')
        .select('*')
        .or(`organization_id.eq.${organizationId},exportador_id.eq.${organizationId},cooperativa_id.eq.${organizationId}`);
      if (options?.contratoId) {
        q = q.eq('id', options.contratoId);
      }
      if (options?.estado) {
        q = q.eq('estado', options.estado);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
