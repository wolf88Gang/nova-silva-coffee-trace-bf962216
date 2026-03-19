/**
 * Hook: platform status para admin.
 * Stub temporal — usa provider mock.
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchServiceStatus,
  fetchPlatformGlobalStatus,
  type PlatformGlobalStatus,
} from '@/services/admin/adminPlatformService';

export function useAdminPlatform() {
  const services = useQuery({
    queryKey: ['admin_service_status'],
    queryFn: fetchServiceStatus,
  });
  const globalStatus = useQuery({
    queryKey: ['admin_platform_status'],
    queryFn: fetchPlatformGlobalStatus,
  });

  const g = globalStatus.data as { data?: PlatformGlobalStatus } | undefined;
  return {
    services,
    globalStatus: g?.data as PlatformGlobalStatus | undefined,
    globalStatusQuery: globalStatus,
  };
}
