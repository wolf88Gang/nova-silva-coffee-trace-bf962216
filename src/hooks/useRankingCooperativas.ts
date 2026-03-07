/**
 * Hook to fetch ranking of cooperativas from Supabase RPC.
 * Falls back to demo data when RPC is unavailable or empty.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';

export interface RankingCooperativa {
  cooperativa_id: string;
  nombre: string | null;
  lotes_entregados: number;
  volumen_total: number;
  valor_estimado_usd: number;
}

const DEMO_RANKING: RankingCooperativa[] = [
  { cooperativa_id: 'd1', nombre: 'Cooperativa Café de la Selva', lotes_entregados: 8, volumen_total: 45000, valor_estimado_usd: 28500 },
  { cooperativa_id: 'd2', nombre: 'Cooperativa Montaña Verde', lotes_entregados: 12, volumen_total: 68000, valor_estimado_usd: 48200 },
  { cooperativa_id: 'd3', nombre: 'Cooperativa Sierra Nevada', lotes_entregados: 4, volumen_total: 22000, valor_estimado_usd: 12800 },
];

export function useRankingCooperativas() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['ranking-cooperativas', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_ranking_cooperativas' as any);
        if (error) throw error;
        if (!data || (data as any[]).length === 0) return DEMO_RANKING;
        return data as RankingCooperativa[];
      } catch {
        // RPC may not exist yet — fallback to demo
        return DEMO_RANKING;
      }
    },
    placeholderData: DEMO_RANKING,
  });
}
