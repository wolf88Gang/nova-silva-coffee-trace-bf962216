import { useDemoAwareQuery } from './useDemoAwareQuery';
import { useDemoContext } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { demoNovaCupOverview } from '@/demo/demoNovaCup';

export function useNovaCupOverview() {
  const { org, isDemoSession } = useDemoContext();
  const { user } = useAuth();
  const orgId = org?.id ?? user?.organizationId ?? null;
  const isDemo = isDemoSession && !!org;
  const archetype = org?.orgType ?? 'cooperativa';
  const fallback = isDemo
    ? { ...demoNovaCupOverview(archetype), organization_id: orgId ?? 'demo' }
    : { organization_id: orgId ?? 'demo', snapshots: 0 };

  return useDemoAwareQuery({
    queryKey: ['novacup-overview', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_novacup_overview')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data ?? fallback;
    },
    fallbackData: fallback,
    enabled: !!orgId,
    isDemo,
    isEmptyCheck: (d) => !d || (d as { snapshots?: number }).snapshots === undefined,
    staleTime: 60 * 1000,
  });
}
