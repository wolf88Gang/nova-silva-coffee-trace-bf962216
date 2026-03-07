import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { TABLE, ORG_KEY } from '@/lib/keys';
import { plotSnapshotToModuleSnapshot, type ModuleSnapshot } from '@/lib/interModuleEngine';

export function useModuleSnapshot(parcelaId: string | null, ciclo: string | null) {
  const { organizationId } = useOrgContext();

  const query = useQuery({
    queryKey: ['module-snapshot', organizationId, parcelaId, ciclo],
    enabled: !!organizationId && !!parcelaId && !!ciclo,
    queryFn: async (): Promise<ModuleSnapshot | null> => {
      const { data, error } = await supabase
        .from(TABLE.PLOT_MODULE_SNAPSHOT)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq('parcela_id', parcelaId!)
        .eq('ciclo', ciclo!)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? plotSnapshotToModuleSnapshot(data) : null;
    },
  });

  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (snapshot: Record<string, unknown>) => {
      const { error } = await supabase
        .from(TABLE.PLOT_MODULE_SNAPSHOT)
        .upsert(
          { ...snapshot, [ORG_KEY]: organizationId },
          { onConflict: 'organization_id,parcela_id,ciclo,version' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-snapshot'] });
    },
  });

  return { snapshot: query.data ?? null, isLoading: query.isLoading, upsert };
}
