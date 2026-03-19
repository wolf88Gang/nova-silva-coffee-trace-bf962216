/**
 * Mapper: DB → AdminUser.
 * v_admin_users_summary: user_id, full_name, email, organization_id, organization_name, is_active, last_login_at, roles.
 */

import type { AdminUser, UserStatus } from '@/types/admin';
import type { DbUserSummary } from '@/repositories/admin/adminUsersRepository';

function mapUserStatus(isActive: boolean | null): UserStatus {
  if (isActive === false) return 'inactive';
  return 'active';
}

function primaryRole(roles: string[] | null): string {
  if (!roles || roles.length === 0) return '—';
  const priority = ['superadmin', 'admin', 'cooperativa_admin', 'exportador_admin', 'certificadora', 'tecnico', 'auditor', 'viewer'];
  for (const r of priority) {
    if (roles.includes(r)) return r;
  }
  return roles[0] ?? '—';
}

export function mapUserSummaryToAdmin(d: DbUserSummary): AdminUser {
  const rolesArr = Array.isArray(d.roles) ? d.roles : typeof d.roles === 'string' ? [d.roles] : [];
  return {
    id: d.user_id,
    fullName: d.full_name ?? '—',
    email: d.email ?? '—',
    organizationId: d.organization_id ?? '',
    organizationName: d.organization_name ?? 'Sin org',
    role: primaryRole(rolesArr),
    status: mapUserStatus(d.is_active),
    lastLoginAt: d.last_login_at,
    createdAt: d.created_at ?? '',
  };
}
