/**
 * Hook para resumen de parcela (ficha hub).
 * Usa v_parcela_hub_summary cuando parcelId es UUID.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParcelHubSummary {
  parcela_id: string;
  organization_id: string;
  productor_id: string | null;
  productor_nombre: string | null;
  parcela_nombre: string | null;
  area_ha: number | null;
  variedad: string | null;
  altitud: number | null;
  ultimo_plan_nutricion_estado: string | null;
  ultimo_diagnostico_guard_riesgo: string | null;
  ultima_estimacion_yield_fecha: string | null;
  ultimo_score_vital: number | null;
  tiene_evidencias: boolean;
  tiene_jornales: boolean;
  tiene_eudr: boolean;
  tiene_novacup: boolean;
}

export function useParcelHubSummary(parcelId: string | undefined) {
  const isUuid = parcelId ? UUID_REGEX.test(parcelId) : false;

  return useQuery({
    queryKey: ['parcela-hub-summary', parcelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_parcela_hub_summary')
        .select('*')
        .eq('parcela_id', parcelId)
        .maybeSingle();

      if (error) {
        console.warn('v_parcela_hub_summary:', error.message);
        return null;
      }
      return data as ParcelHubSummary | null;
    },
    enabled: !!parcelId && isUuid,
    staleTime: 30 * 1000,
  });
}
