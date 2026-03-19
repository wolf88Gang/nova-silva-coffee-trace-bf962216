/**
 * Hook: compliance para admin.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchComplianceIssues, fetchComplianceMetrics } from '@/services/admin/adminComplianceService';

export function useAdminCompliance() {
  return useQuery({
    queryKey: ['admin_compliance_issues'],
    queryFn: fetchComplianceIssues,
  });
}

export function useAdminComplianceMetrics() {
  return useQuery({
    queryKey: ['admin_compliance_metrics'],
    queryFn: fetchComplianceMetrics,
  });
}
