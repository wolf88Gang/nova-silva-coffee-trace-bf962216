/**
 * Repository: platform status para admin.
 * Fuente: RPC get_platform_status.
 */

import { supabase } from '@/integrations/supabase/client';

export type PlatformGlobalStatus = 'operational' | 'degraded' | 'critical';

export async function fetchPlatformStatusFromDb(): Promise<PlatformGlobalStatus> {
  const { data, error } = await supabase.rpc('get_platform_status');
  if (error) throw error;
  const v = (data ?? 'operational') as string;
  if (['operational', 'degraded', 'critical'].includes(v)) return v as PlatformGlobalStatus;
  return 'operational';
}
