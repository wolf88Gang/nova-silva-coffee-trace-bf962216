/**
 * Servicio de estado de plataforma para admin.
 * Global status: RPC get_platform_status.
 * Detalle por servicio: siempre datos limitados (pendiente platform_health_checks).
 */

import type { AdminServiceStatus } from '@/types/admin';
import { adminSuccess, adminFallback, type AdminDataResult } from '@/types/adminData';
import { ADMIN_ALLOW_MOCK_FALLBACK } from '@/config/adminEnv';
import { fetchPlatformStatusFromDb, type PlatformGlobalStatus } from '@/repositories/admin/adminPlatformRepository';
import { MOCK_SERVICE_STATUS } from '@/data/admin/mockData';

export type { PlatformGlobalStatus };

/** No existe tabla platform_health_checks. En prod: throw; en dev: fallback. */
export async function fetchServiceStatus(): Promise<AdminDataResult<AdminServiceStatus[]>> {
  if (!ADMIN_ALLOW_MOCK_FALLBACK) {
    throw new Error('platform_health_checks no disponible; datos limitados');
  }
  return adminFallback([...MOCK_SERVICE_STATUS]);
}

export async function fetchPlatformGlobalStatus(): Promise<AdminDataResult<PlatformGlobalStatus>> {
  try {
    const data = await fetchPlatformStatusFromDb();
    return adminSuccess(data);
  } catch (err) {
    console.warn('[admin] fetchPlatformGlobalStatus RPC error:', err);
    if (!ADMIN_ALLOW_MOCK_FALLBACK) throw err;
    return adminFallback('operational');
  }
}
