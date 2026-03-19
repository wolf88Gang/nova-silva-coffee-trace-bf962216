/**
 * Servicio de growth para admin.
 * Conectado a Supabase: admin_feedback, admin_opportunities, v_admin_organizations_summary.
 */

import type { AdminFeedbackItem, AdminOpportunity, AdminTrialMetric, AdminDemoLead } from '@/types/admin';
import { adminSuccess, adminFallback, type AdminDataResult } from '@/types/adminData';
import { ADMIN_ALLOW_MOCK_FALLBACK } from '@/config/adminEnv';
import {
  fetchTrialMetricsFromDb,
  fetchFeedbackFromDb,
  fetchOpportunitiesFromDb,
  fetchDemoLeadsFromDb,
  updateDemoLeadInDb,
} from '@/repositories/admin/adminGrowthRepository';
import { fetchOrgNamesBatch } from '@/repositories/admin/adminBillingRepository';
import { mapFeedbackToAdmin, mapOpportunityToAdmin, mapDemoLeadToAdmin } from '@/mappers/admin/growthMapper';
import { MOCK_FEEDBACK, MOCK_OPPORTUNITIES } from '@/data/admin/mockData';

export async function fetchTrialMetrics(): Promise<AdminDataResult<AdminTrialMetric>> {
  try {
    const data = await fetchTrialMetricsFromDb();
    return adminSuccess(data);
  } catch (err) {
    console.warn('[admin] fetchTrialMetrics Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback({ active: 1, expiringSoon: 1, conversionRate: 0.42 });
  }
}

export async function fetchFeedback(): Promise<AdminDataResult<AdminFeedbackItem[]>> {
  try {
    const rows = await fetchFeedbackFromDb();
    const orgIds = [...new Set(rows.map((r) => r.organization_id))];
    const orgNames = await fetchOrgNamesBatch(orgIds);
    return adminSuccess(rows.map((r) => mapFeedbackToAdmin(r, orgNames.get(r.organization_id) ?? 'Sin org')));
  } catch (err) {
    console.warn('[admin] fetchFeedback Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_FEEDBACK]);
  }
}

export async function fetchOpportunities(): Promise<AdminDataResult<AdminOpportunity[]>> {
  try {
    const rows = await fetchOpportunitiesFromDb();
    const orgIds = [...new Set(rows.map((r) => r.organization_id))];
    const orgNames = await fetchOrgNamesBatch(orgIds);
    return adminSuccess(rows.map((r) => mapOpportunityToAdmin(r, orgNames.get(r.organization_id) ?? 'Sin org')));
  } catch (err) {
    console.warn('[admin] fetchOpportunities Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_OPPORTUNITIES]);
  }
}

export async function fetchDemoLeads(): Promise<AdminDataResult<AdminDemoLead[]>> {
  try {
    const rows = await fetchDemoLeadsFromDb();
    return adminSuccess(rows.map(mapDemoLeadToAdmin));
  } catch (err) {
    console.warn('[admin] fetchDemoLeads Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([]);
  }
}

export async function updateDemoLead(
  id: string,
  payload: { status?: string; notes?: string | null }
): Promise<void> {
  await updateDemoLeadInDb(id, payload);
}
