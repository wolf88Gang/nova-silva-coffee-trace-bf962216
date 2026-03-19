import { useDemoAwareQuery } from './useDemoAwareQuery';
import { useDemoContext } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { demoComplianceOverview } from '@/demo/demoCompliance';

export function useComplianceOverview() {
  const { org, isDemoSession } = useDemoContext();
  const { user } = useAuth();
  const orgId = org?.id ?? user?.organizationId ?? null;
  const isDemo = isDemoSession && !!org;
  const archetype = org?.orgType ?? 'cooperativa';
  const fallback = isDemo
    ? { ...demoComplianceOverview(archetype), organization_id: orgId ?? 'demo' }
    : { organization_id: orgId ?? 'demo', eudr_logs: 0, certificaciones: 0 };

  return useDemoAwareQuery({
    queryKey: ['compliance-overview', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_compliance_overview')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data ?? fallback;
    },
    fallbackData: fallback,
    enabled: !!orgId,
    isDemo,
    isEmptyCheck: (d) => !d || (d as { eudr_logs?: number }).eudr_logs === undefined,
    staleTime: 60 * 1000,
  });
}
