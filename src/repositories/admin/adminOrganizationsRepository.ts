/**
 * Repository: organizaciones para admin.
 * Fuente: platform_organizations, v_admin_organizations_summary.
 * RLS: is_admin() para acceso.
 */

import { supabase } from '@/integrations/supabase/client';

export interface OrgListFilters {
  type?: string;
  plan?: string;
  status?: string;
  country?: string;
}

export interface DbOrganizationSummary {
  organization_id: string;
  organization_name: string;
  tipo: string | null;
  plan: string | null;
  status: string | null;
  country: string | null;
  created_at: string;
  trial_ends_at: string | null;
  last_invoice_status: string | null;
  last_invoice_due_at: string | null;
  outstanding_balance: number;
  active_user_count: number;
  latest_snapshot_month: string | null;
}

export interface DbPlatformOrganization {
  id: string;
  name: string | null;
  display_name: string | null;
  org_type: string | null;
  tipo?: string | null;
  plan?: string | null;
  status?: string | null;
  country?: string | null;
  pais?: string | null;
  modules?: string[] | null;
  trial_ends_at?: string | null;
  created_at: string;
}

export async function fetchOrganizationsFromDb(filters?: OrgListFilters): Promise<DbOrganizationSummary[]> {
  let q = supabase.from('v_admin_organizations_summary').select('*');

  if (filters?.type && filters.type !== 'all') {
    q = q.eq('tipo', filters.type);
  }
  if (filters?.plan && filters.plan !== 'all') {
    q = q.eq('plan', filters.plan);
  }
  if (filters?.status && filters.status !== 'all') {
    q = q.eq('status', filters.status);
  }
  if (filters?.country && filters.country !== 'all') {
    q = q.eq('country', filters.country);
  }

  const { data, error } = await q.order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbOrganizationSummary[];
}

export async function fetchOrganizationDetailFromDb(id: string): Promise<DbPlatformOrganization | null> {
  const { data, error } = await supabase
    .from('platform_organizations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DbPlatformOrganization | null;
}

export async function fetchOrganizationSummaryFromDb(id: string): Promise<DbOrganizationSummary | null> {
  const { data, error } = await supabase
    .from('v_admin_organizations_summary')
    .select('*')
    .eq('organization_id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DbOrganizationSummary | null;
}

export interface DbOrgBillingSettings {
  organization_id: string;
  plan_code: string;
  billing_cycle: string;
  status: string;
  trial_ends_at: string | null;
}

export async function fetchOrgBillingSettingsFromDb(organizationId: string): Promise<DbOrgBillingSettings | null> {
  const { data, error } = await supabase
    .from('org_billing_settings')
    .select('organization_id, plan_code, billing_cycle, status, trial_ends_at')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) throw error;
  return data as DbOrgBillingSettings | null;
}

export async function fetchOrgBillingSettingsBatch(organizationIds: string[]): Promise<Map<string, DbOrgBillingSettings>> {
  if (organizationIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('org_billing_settings')
    .select('organization_id, plan_code, billing_cycle, status, trial_ends_at')
    .in('organization_id', organizationIds);

  if (error) throw error;
  const map = new Map<string, DbOrgBillingSettings>();
  for (const row of (data ?? []) as DbOrgBillingSettings[]) {
    map.set(row.organization_id, row);
  }
  return map;
}

export async function updateOrganizationPlanInDb(id: string, planCode: string): Promise<void> {
  const { error: e1 } = await supabase
    .from('platform_organizations')
    .update({ plan: planCode, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('org_billing_settings')
    .update({ plan_code: planCode, updated_at: new Date().toISOString() })
    .eq('organization_id', id);
  if (e2) {
    if (e2.code !== 'PGRST116') throw e2;
  }

  await supabase.rpc('log_admin_action', {
    p_organization_id: id,
    p_target_user_id: null,
    p_action_type: 'cambiar_plan',
    p_action_payload: { new_plan: planCode },
  });
}

export async function updateOrganizationStatusInDb(id: string, status: string): Promise<void> {
  const { error: e1 } = await supabase
    .from('platform_organizations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('org_billing_settings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', id);
  if (e2) {
    if (e2.code !== 'PGRST116') throw e2;
  }

  const actionType = status === 'suspendido' ? 'suspender_cuenta' : status === 'activo' ? 'activar_cuenta' : 'cambiar_plan';
  await supabase.rpc('log_admin_action', {
    p_organization_id: id,
    p_target_user_id: null,
    p_action_type: actionType,
    p_action_payload: { prev_status: null, new_status: status },
  });
}
