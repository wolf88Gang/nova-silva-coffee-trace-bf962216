import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { TABLE, ORG_KEY } from '@/lib/keys';

export function usePlotSnapshotsHistory(parcelaId: string | null) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['plot-snapshots-history', organizationId, parcelaId],
    enabled: !!organizationId && !!parcelaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.PLOT_MODULE_SNAPSHOT)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq('parcela_id', parcelaId!)
        .order('ciclo', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
