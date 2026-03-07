/**
 * Hook para listar lotes ofrecidos (disponibles para subasta/oferta).
 * Cooperativas: lotes_comerciales que ofrecen al exportador.
 * Exportadores: lotes disponibles para comprar.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

export function useLotesOfrecidos(options?: { cooperativaId?: string; estado?: string }) {
  const { organizationId, orgTipo, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.lotesOfrecidos, organizationId, options?.cooperativaId, options?.estado],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = supabase.from('lotes_comerciales').select('*');
      if (orgTipo === 'cooperativa') {
        q = q.or(`cooperativa_id.eq.${organizationId},organization_id.eq.${organizationId}`);
      } else {
        q = q.or(`exportador_id.eq.${organizationId},organization_id.eq.${organizationId}`);
      }
      if (options?.cooperativaId) {
        q = q.eq('cooperativa_id', options.cooperativaId);
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
