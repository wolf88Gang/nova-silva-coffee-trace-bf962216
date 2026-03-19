/**
 * Hook: growth para admin.
 * Stub temporal — no hay tablas; usa adminGrowthService (mock).
 */

import { useQuery } from '@tanstack/react-query';
import { fetchTrialMetrics, fetchFeedback, fetchOpportunities, fetchDemoLeads } from '@/services/admin/adminGrowthService';

export function useAdminGrowth() {
  const trialMetrics = useQuery({ queryKey: ['admin_trial_metrics'], queryFn: fetchTrialMetrics });
  const feedback = useQuery({ queryKey: ['admin_feedback'], queryFn: fetchFeedback });
  const opportunities = useQuery({ queryKey: ['admin_opportunities'], queryFn: fetchOpportunities });
  const demoLeads = useQuery({ queryKey: ['admin_demo_leads'], queryFn: fetchDemoLeads });

  return {
    trialMetrics,
    feedback,
    opportunities,
    demoLeads,
  };
}
