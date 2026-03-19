/**
 * Mapper: DB compliance rows → AdminComplianceIssue.
 */

import type { AdminComplianceIssue, ComplianceSeverity } from '@/types/admin';
import type { DbComplianceIssueRow } from '@/repositories/admin/adminComplianceRepository';

function mapSeverity(s: string): ComplianceSeverity {
  const v = (s ?? '').toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(v)) return v as ComplianceSeverity;
  return 'medium';
}

export function mapComplianceIssueToAdmin(d: DbComplianceIssueRow): AdminComplianceIssue {
  return {
    id: d.id,
    severity: mapSeverity(d.severity),
    category: d.category,
    organizationId: d.organization_id,
    organizationName: d.organization_name,
    createdAt: d.created_at,
    status: (d.status === 'open' ? 'open' : d.status === 'resolved' ? 'resolved' : 'in_review') as 'open' | 'in_review' | 'resolved',
    description: d.description,
    actionLabel: d.action_label,
    actionRoute: d.action_route,
  };
}
