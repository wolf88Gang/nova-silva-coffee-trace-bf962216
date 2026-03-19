/**
 * Hook: overview para admin.
 * Agrupa revenue, organizations, compliance, platform.
 */

import { useAdminOrganizations } from './useAdminOrganizations';
import { useAdminBilling } from './useAdminBilling';
import { useQuery } from '@tanstack/react-query';
import { fetchComplianceIssues } from '@/services/admin/adminComplianceService';
import { fetchPlatformGlobalStatus } from '@/services/admin/adminPlatformService';

export function useAdminOverview() {
  const organizations = useAdminOrganizations();
  const billing = useAdminBilling();
  const compliance = useQuery({ queryKey: ['admin_compliance_issues'], queryFn: fetchComplianceIssues });
  const platformStatus = useQuery({
    queryKey: ['admin_platform_status'],
    queryFn: fetchPlatformGlobalStatus,
  });

  return {
    organizations,
    revenue: billing.revenue,
    compliance,
    platformStatus,
  };
}
