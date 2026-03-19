/**
 * Servicio de compliance para admin.
 * Fuentes: v_admin_compliance_issues, get_admin_compliance_metrics.
 */

import type { AdminComplianceIssue } from '@/types/admin';
import { adminSuccess, adminFallback, type AdminDataResult } from '@/types/adminData';
import { ADMIN_ALLOW_MOCK_FALLBACK } from '@/config/adminEnv';
import {
  fetchComplianceIssuesFromDb,
  fetchComplianceMetricsFromDb,
  type AdminComplianceMetrics,
} from '@/repositories/admin/adminComplianceRepository';
import { mapComplianceIssueToAdmin } from '@/mappers/admin/complianceMapper';
import { MOCK_COMPLIANCE_ISSUES } from '@/data/admin/mockData';

export async function fetchComplianceIssues(): Promise<AdminDataResult<AdminComplianceIssue[]>> {
  try {
    const rows = await fetchComplianceIssuesFromDb();
    return adminSuccess(rows.map(mapComplianceIssueToAdmin));
  } catch (err) {
    console.warn('[admin] fetchComplianceIssues Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_COMPLIANCE_ISSUES]);
  }
}

export async function fetchComplianceMetrics(): Promise<AdminDataResult<AdminComplianceMetrics>> {
  try {
    const data = await fetchComplianceMetricsFromDb();
    return adminSuccess(data);
  } catch (err) {
    console.warn('[admin] fetchComplianceMetrics error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback({
      invoices_overdue_count: 0,
      invoices_pending_count: 0,
      parcelas_sin_poligono_count: null,
      parcelas_sin_poligono_status: 'pendiente',
    });
  }
}
