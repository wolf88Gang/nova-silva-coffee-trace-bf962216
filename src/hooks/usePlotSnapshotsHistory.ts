/**
 * Hook para cargar historial de snapshots por parcela (todos los ciclos).
 * Usado por ProductivityGapChart.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

export function usePlotSnapshotsHistory(parcelaId: string | null) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.moduleSnapshot, 'history', organizationId, parcelaId],
    enabled: !!organizationId && !!parcelaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plot_module_snapshot')
        .select('ciclo, yield_expected, yield_real, yield_adjusted, productivity_gap')
        .eq('organization_id', organizationId!)
        .eq('parcela_id', parcelaId!)
        .order('ciclo', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}
