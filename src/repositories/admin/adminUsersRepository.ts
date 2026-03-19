/**
 * Repository: usuarios para admin.
 * Fuente: v_admin_users_summary.
 * RLS: is_admin() para acceso.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DbUserSummary {
  user_id: string;
  full_name: string | null;
  email: string | null;
  organization_id: string | null;
  organization_name: string | null;
  is_active: boolean | null;
  last_login_at: string | null;
  created_at?: string | null;
  roles: string[] | null;
}

export async function fetchUsersFromDb(organizationId?: string): Promise<DbUserSummary[]> {
  let q = supabase.from('v_admin_users_summary').select('*');

  if (organizationId) {
    q = q.eq('organization_id', organizationId);
  }

  const { data, error } = await q.order('organization_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbUserSummary[];
}
