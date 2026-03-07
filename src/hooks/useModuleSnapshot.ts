/**
 * Hook para cargar/guardar snapshots inter-modulares por parcela/ciclo.
 * Tabla: plot_module_snapshot
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';


export interface PlotModuleSnapshot {
  id?: string;
  organization_id: string;
  parcela_id: string;
  ciclo: string;
  version?: number;
  yield_expected?: number;
  yield_uncertainty?: number;
  yield_potential?: number;
  yield_method?: string;
  yield_date?: string;
  disease_pressure_index?: number;
  roya_incidence?: number;
  broca_incidence?: number;
  defoliation_level?: number;
  disease_factor?: number;
  guard_assessment_date?: string;
  nutrient_limitation_score?: number;
  limiting_nutrient?: string;
  nutrient_factor?: number;
  resilience_index?: number;
  soil_health_score?: number;
  water_stress_index?: number;
  water_factor?: number;
  yield_adjusted?: number;
  yield_real?: number;
  productivity_gap?: number;
  computed_at?: string;
  computed_by?: string;
}

export function useModuleSnapshot(parcelaId: string | null, ciclo: string) {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.moduleSnapshot, organizationId, parcelaId, ciclo],
    enabled: !!organizationId && !!parcelaId && !!ciclo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plot_module_snapshot')
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('parcela_id', parcelaId!)
        .eq('ciclo', ciclo)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PlotModuleSnapshot | null;
    },
  });

  const upsert = useMutation({
    mutationFn: async (snapshot: Partial<PlotModuleSnapshot>) => {
      if (!organizationId || !parcelaId) throw new Error('organizationId y parcelaId requeridos');
      const payload = {
        organization_id: organizationId,
        parcela_id: parcelaId,
        ciclo,
        version: 1,
        ...snapshot,
        computed_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('plot_module_snapshot').upsert(payload, {
        onConflict: 'organization_id,parcela_id,ciclo,version',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleSnapshot });
    },
  });

  return {
    snapshot: query.data,
    isLoading: query.isLoading,
    error: query.error,
    upsertSnapshot: upsert.mutate,
    isUpserting: upsert.isPending,
  };
}
