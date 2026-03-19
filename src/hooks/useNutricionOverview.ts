import { useDemoAwareQuery } from './useDemoAwareQuery';
import { useDemoContext } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { demoNutricionOverview } from '@/demo/demoNutricion';

export function useNutricionOverview() {
  const { org, isDemoSession } = useDemoContext();
  const { user } = useAuth();
  const orgId = org?.id ?? user?.organizationId ?? null;
  const isDemo = isDemoSession && !!org;
  const archetype = org?.orgType ?? 'cooperativa';
  const fallback = isDemo
    ? { ...demoNutricionOverview(archetype), organization_id: orgId ?? 'demo' }
    : { organization_id: orgId ?? 'demo', planes: 0, aplicaciones: 0 };

  return useDemoAwareQuery({
    queryKey: ['nutricion-overview', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_nutricion_overview')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data ?? fallback;
    },
    fallbackData: fallback,
    enabled: !!orgId,
    isDemo,
    isEmptyCheck: (d) => !d || (d as { planes?: number }).planes === undefined,
    staleTime: 60 * 1000,
  });
}
