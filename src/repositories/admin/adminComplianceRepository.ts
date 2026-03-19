/**
 * Repository: compliance para admin.
 * Fuente: v_admin_compliance_issues (invoices overdue/issued).
 * Métricas: RPC get_admin_compliance_metrics.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DbComplianceIssueRow {
  id: string;
  organization_id: string;
  organization_name: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  created_at: string;
  action_route?: string;
  action_label?: string;
}

export interface AdminComplianceMetrics {
  invoices_overdue_count: number;
  invoices_pending_count: number;
  parcelas_sin_poligono_count: number | null;
  parcelas_sin_poligono_status: 'real' | 'pendiente';
}

export async function fetchComplianceIssuesFromDb(): Promise<DbComplianceIssueRow[]> {
  const { data, error } = await supabase
    .from('v_admin_compliance_issues')
    .select('id, organization_id, organization_name, category, severity, status, description, created_at, action_route, action_label')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbComplianceIssueRow[];
}

export async function fetchComplianceMetricsFromDb(): Promise<AdminComplianceMetrics> {
  const { data, error } = await supabase.rpc('get_admin_compliance_metrics');
  if (error || !data || (data as { error?: string }).error) {
    return {
      invoices_overdue_count: 0,
      invoices_pending_count: 0,
      parcelas_sin_poligono_count: null,
      parcelas_sin_poligono_status: 'pendiente',
    };
  }
  const m = data as {
    invoices_overdue_count?: number;
    invoices_pending_count?: number;
    parcelas_sin_poligono_count?: number;
    parcelas_sin_poligono_status?: string;
  };
  return {
    invoices_overdue_count: m.invoices_overdue_count ?? 0,
    invoices_pending_count: m.invoices_pending_count ?? 0,
    parcelas_sin_poligono_count: m.parcelas_sin_poligono_count ?? null,
    parcelas_sin_poligono_status: (m.parcelas_sin_poligono_status === 'real' ? 'real' : 'pendiente') as 'real' | 'pendiente',
  };
}
