/**
 * Hook para ranking de cooperativas (computed).
 * Por ahora retorna array vacío; se puede conectar a una vista o RPC cuando exista.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

export interface RankingCooperativa {
  cooperativa_id: string;
  nombre?: string;
  puntaje?: number;
  volumen_total?: number;
  lotes_entregados?: number;
  /** Opcional: Lovable/UI puede mostrarlo si el RPC lo devuelve */
  valor_estimado_usd?: number;
}

export function useRankingCooperativas() {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.rankingCooperativas, organizationId],
    queryFn: async (): Promise<RankingCooperativa[]> => {
      if (!organizationId) return [];
      try {
        // Intentar RPC si existe
        const { data, error } = await supabase.rpc('get_ranking_cooperativas', {
          p_organization_id: organizationId,
        });
        if (!error && data) return data as RankingCooperativa[];
      } catch {
        // RPC no existe aún
      }
      return [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
