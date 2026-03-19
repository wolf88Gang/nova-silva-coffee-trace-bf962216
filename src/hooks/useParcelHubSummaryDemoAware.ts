/**
 * Parcel hub summary demo-aware.
 * Si Supabase vacío/error y org demo → fallback local.
 * Si parcelId es demo (parcela-1, etc.) → fallback directo sin Supabase.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoContext } from '@/contexts/DemoContext';
import { getDemoParcelHubFallback } from '@/demo/demoParcelHub';
import type { ParcelHubSummary } from './useParcelHubSummary';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useParcelHubSummaryDemoAware(parcelId: string | undefined) {
  const { org, isDemoSession } = useDemoContext();
  const isUuid = parcelId ? UUID_REGEX.test(parcelId) : false;
  const isDemoId = parcelId && !isUuid && (parcelId.startsWith('parcela-') || parcelId.length < 36);
  const isDemo = isDemoSession && !!org;
  const orgId = org?.id ?? 'demo';

  const query = useQuery({
    queryKey: ['parcela-hub-summary-demo-aware', parcelId],
    queryFn: async (): Promise<{ data: ParcelHubSummary | null; source: 'supabase' | 'demo-fallback' }> => {
      if (isDemoId && isDemo) {
        const fallback = getDemoParcelHubFallback(parcelId!, orgId);
        return { data: fallback, source: 'demo-fallback' };
      }
      if (!isUuid || !parcelId) return { data: null, source: 'supabase' };

      const { data, error } = await supabase
        .from('v_parcela_hub_summary')
        .select('*')
        .eq('parcela_id', parcelId)
        .maybeSingle();

      if (error) {
        console.warn('v_parcela_hub_summary:', error.message);
        if (isDemo) {
          const fallback = getDemoParcelHubFallback(parcelId, orgId);
          return { data: fallback, source: 'demo-fallback' };
        }
        return { data: null, source: 'supabase' };
      }

      if (!data && isDemo) {
        const fallback = getDemoParcelHubFallback(parcelId, orgId);
        return { data: fallback, source: 'demo-fallback' };
      }

      return { data: data as ParcelHubSummary | null, source: 'supabase' };
    },
    enabled: !!parcelId,
    staleTime: 30 * 1000,
  });

  const result = query.data;
  return {
    data: result?.data ?? null,
    isFallback: result?.source === 'demo-fallback',
    source: result?.source ?? 'supabase',
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
