/**
 * Repository: growth para admin.
 * Fuente: v_admin_organizations_summary (trials), admin_feedback, admin_opportunities.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DbFeedback {
  id: string;
  organization_id: string;
  category: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export interface DbOpportunity {
  id: string;
  organization_id: string;
  type: string;
  score: number;
  notes: string | null;
  created_at: string;
}

export interface TrialMetrics {
  active: number;
  expiringSoon: number;
  conversionRate: number;
}

export async function fetchTrialMetricsFromDb(): Promise<TrialMetrics> {
  const { data, error } = await supabase
    .from('v_admin_organizations_summary')
    .select('organization_id, status, trial_ends_at');

  if (error) throw error;

  const rows = (data ?? []) as { organization_id: string; status: string; trial_ends_at: string | null }[];
  const active = rows.filter((r) => (r.status ?? '').toLowerCase() === 'en_prueba').length;
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = rows.filter((r) => {
    const t = r.trial_ends_at ? new Date(r.trial_ends_at) : null;
    return t && t >= now && t <= in30Days;
  }).length;

  const total = rows.length;
  const trials = active;
  const converted = rows.filter((r) => (r.status ?? '').toLowerCase() === 'activo').length;
  const conversionRate = trials > 0 ? converted / (trials + converted) : 0;

  return {
    active,
    expiringSoon,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

export async function fetchFeedbackFromDb(): Promise<DbFeedback[]> {
  const { data, error } = await supabase
    .from('admin_feedback')
    .select('id, organization_id, category, severity, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as DbFeedback[];
}

export async function fetchOpportunitiesFromDb(): Promise<DbOpportunity[]> {
  const { data, error } = await supabase
    .from('admin_opportunities')
    .select('id, organization_id, type, score, notes, created_at')
    .order('score', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as DbOpportunity[];
}

export interface DbDemoLead {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  organizacion: string | null;
  tipo_organizacion: string | null;
  mensaje: string | null;
  demo_org_type: string | null;
  demo_profile_label: string | null;
  demo_route: string | null;
  cta_source: string | null;
  status: string;
  notes: string | null;
}

export async function fetchDemoLeadsFromDb(): Promise<DbDemoLead[]> {
  const { data, error } = await supabase
    .from('demo_leads')
    .select('id, created_at, nombre, email, organizacion, tipo_organizacion, mensaje, demo_org_type, demo_profile_label, demo_route, cta_source, status, notes')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as DbDemoLead[];
}

export async function updateDemoLeadInDb(
  id: string,
  payload: { status?: string; notes?: string | null }
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.notes !== undefined) updates.notes = payload.notes;
  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from('demo_leads')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}
