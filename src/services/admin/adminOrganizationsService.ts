/**
 * Servicio de organizaciones para admin.
 * Usa repository + mapper. Retorna isFallback cuando usa mock.
 */

import type { AdminOrganization } from '@/types/admin';
import { adminSuccess, adminFallback, type AdminDataResult } from '@/types/adminData';
import { ADMIN_ALLOW_MOCK_FALLBACK } from '@/config/adminEnv';
import {
  fetchOrganizationsFromDb,
  fetchOrganizationDetailFromDb,
  fetchOrganizationSummaryFromDb,
  fetchOrgBillingSettingsFromDb,
  fetchOrgBillingSettingsBatch,
  updateOrganizationStatusInDb,
  updateOrganizationPlanInDb,
  type OrgListFilters,
} from '@/repositories/admin/adminOrganizationsRepository';
import { mapOrganizationSummaryToAdmin, mapPlatformOrgToAdmin } from '@/mappers/admin/organizationMapper';
import { MOCK_ORGANIZATIONS } from '@/data/admin/mockData';

export type { OrgListFilters };

export async function fetchOrganizations(filters?: OrgListFilters): Promise<AdminDataResult<AdminOrganization[]>> {
  try {
    const rows = await fetchOrganizationsFromDb(filters);
    const orgIds = rows.map((r) => r.organization_id);
    const billingMap = await fetchOrgBillingSettingsBatch(orgIds);
    return adminSuccess(rows.map((r) => mapOrganizationSummaryToAdmin(r, billingMap.get(r.organization_id) ?? null)));
  } catch (err) {
    console.warn('[admin] fetchOrganizations Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_ORGANIZATIONS]);
  }
}

export async function fetchOrganizationById(id: string): Promise<AdminDataResult<AdminOrganization | null>> {
  try {
    const [org, summary, billing] = await Promise.all([
      fetchOrganizationDetailFromDb(id),
      fetchOrganizationSummaryFromDb(id),
      fetchOrgBillingSettingsFromDb(id),
    ]);
    if (!org) return adminSuccess(null);
    return adminSuccess(mapPlatformOrgToAdmin(org, summary, billing));
  } catch (err) {
    console.warn('[admin] fetchOrganizationById Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback(MOCK_ORGANIZATIONS.find((o) => o.id === id) ?? null);
  }
}

export async function updateOrganizationStatus(
  id: string,
  status: AdminOrganization['status']
): Promise<void> {
  try {
    await updateOrganizationStatusInDb(id, status);
  } catch (err) {
    console.warn('[admin] updateOrganizationStatus error:', err);
    throw err;
  }
}

export async function updateOrganizationPlan(
  id: string,
  plan: AdminOrganization['plan']
): Promise<void> {
  try {
    await updateOrganizationPlanInDb(id, plan);
  } catch (err) {
    console.warn('[admin] updateOrganizationPlan error:', err);
    throw err;
  }
}
