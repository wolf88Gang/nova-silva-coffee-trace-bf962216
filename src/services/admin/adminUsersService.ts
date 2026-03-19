/**
 * Servicio de usuarios para admin.
 * Usa repository + mapper. Retorna isFallback cuando usa mock.
 */

import type { AdminUser } from '@/types/admin';
import { adminSuccess, adminFallback, type AdminDataResult } from '@/types/adminData';
import { ADMIN_ALLOW_MOCK_FALLBACK } from '@/config/adminEnv';
import { fetchUsersFromDb } from '@/repositories/admin/adminUsersRepository';
import { mapUserSummaryToAdmin } from '@/mappers/admin/userMapper';
import { MOCK_USERS } from '@/data/admin/mockData';

export interface UserFilters {
  organizationId?: string;
  role?: string;
  status?: string;
}

export async function fetchUsers(filters?: UserFilters): Promise<AdminDataResult<AdminUser[]>> {
  try {
    const rows = await fetchUsersFromDb(filters?.organizationId);
    let result = rows.map(mapUserSummaryToAdmin);
    if (filters?.role && filters.role !== 'all') {
      result = result.filter((u) => u.role === filters.role);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((u) => u.status === filters.status);
    }
    return adminSuccess(result);
  } catch (err) {
    console.warn('[admin] fetchUsers Supabase error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback([...MOCK_USERS]);
  }
}

export async function fetchUsersByOrganization(organizationId: string): Promise<AdminDataResult<AdminUser[]>> {
  return fetchUsers({ organizationId });
}
