/**
 * Hook: listado de usuarios para admin.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchUsers, type UserFilters } from '@/services/admin/adminUsersService';

export function useAdminUsers(filters?: UserFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin_users', filters],
    queryFn: () => fetchUsers(filters),
    enabled: options?.enabled ?? true,
  });
}
