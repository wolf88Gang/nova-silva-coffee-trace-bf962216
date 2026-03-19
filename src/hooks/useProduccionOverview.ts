import { useDemoAwareQuery } from './useDemoAwareQuery';
import { useDemoContext } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { demoProduccionOverview } from '@/demo/demoProduccion';

export function useProduccionOverview() {
  const { org, isDemoSession } = useDemoContext();
  const { user } = useAuth();
  const orgId = org?.id ?? user?.organizationId ?? null;
  const isDemo = isDemoSession && !!org;
  const archetype = org?.orgType ?? 'cooperativa';
  const fallback = isDemo
    ? { ...demoProduccionOverview(archetype), organization_id: orgId ?? 'demo' }
    : { organization_id: orgId ?? 'demo', productores: 0, parcelas: 0 };

  return useDemoAwareQuery({
    queryKey: ['produccion-overview', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_produccion_overview')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data ?? fallback;
    },
    fallbackData: fallback,
    enabled: !!orgId,
    isDemo,
    isEmptyCheck: (d) => !d || (d as { productores?: number }).productores === undefined,
    staleTime: 60 * 1000,
  });
}
