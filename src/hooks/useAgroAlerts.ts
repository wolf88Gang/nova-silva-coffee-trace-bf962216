import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY } from '@/lib/keys';

export interface AgroAlertRule {
  id: string;
  rule_name: string | null;
  description: string | null;
  metric_key: string | null;
  threshold_operator: string | null;
  threshold_value: number | null;
  severity: string | null;
}

export interface AgroAlert {
  id: string;
  organization_id: string;
  rule_id: string | null;
  issue_code: string;
  severity: string;
  status: string;
  title: string;
  message: string | null;
  metric_key: string | null;
  metric_value: number | null;
  window_start: string | null;
  window_end: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  // Joined rule
  agro_alert_rules: AgroAlertRule | null;
}

interface AlertFilters {
  status?: string;
  issue_code?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAgroAlerts(filters: AlertFilters = {}) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['agro-alerts', organizationId, filters],
    enabled: !!organizationId,
    queryFn: async () => {
      let q = (supabase as any)
        .from('agro_alerts')
        .select('*, agro_alert_rules(*)')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false });

      if (filters.status) q = q.eq('status', filters.status);
      if (filters.issue_code) q = q.eq('issue_code', filters.issue_code);
      if (filters.severity) q = q.eq('severity', filters.severity);
      if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
      if (filters.dateTo) q = q.lte('created_at', filters.dateTo + 'T23:59:59');

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AgroAlert[];
    },
  });
}

export function useUpdateAlertStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ack' | 'closed' }) => {
      const { error } = await (supabase as any)
        .from('agro_alerts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agro-alerts'] });
    },
  });
}
