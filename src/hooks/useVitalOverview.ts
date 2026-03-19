import { useDemoAwareQuery } from './useDemoAwareQuery';
import { useDemoContext } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { demoVitalOverview } from '@/demo/demoVital';

export function useVitalOverview() {
  const { org, isDemoSession } = useDemoContext();
  const { user } = useAuth();
  const orgId = org?.id ?? user?.organizationId ?? null;
  const isDemo = isDemoSession && !!org;
  const archetype = org?.orgType ?? 'cooperativa';
  const fallback = isDemo
    ? { ...demoVitalOverview(archetype), organization_id: orgId ?? 'demo' }
    : { organization_id: orgId ?? 'demo', evaluaciones: 0, scores: 0 };

  return useDemoAwareQuery({
    queryKey: ['vital-overview', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_vital_overview')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data ?? fallback;
    },
    fallbackData: fallback,
    enabled: !!orgId,
    isDemo,
    isEmptyCheck: (d) => !d || (d as { evaluaciones?: number }).evaluaciones === undefined,
    staleTime: 60 * 1000,
  });
}
