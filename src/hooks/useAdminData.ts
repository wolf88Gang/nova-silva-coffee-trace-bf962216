/**
 * Hook for admin panel: fetches real platform data from Supabase.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { pingEdgeFunction } from '@/lib/ensureDemoUser';

export interface AdminOrg {
  id: string;
  nombre: string;
  tipo: string;
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  name: string | null;
  organization_name: string | null;
  organization_id: string | null;
  role: string | null;
  email: string | null;
}

export function useAdminOrganizations() {
  return useQuery({
    queryKey: ['admin', 'organizaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizaciones')
        .select('id, nombre, tipo, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminOrg[];
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, name, organization_name, organization_id');
      if (pErr) throw pErr;

      // Get roles
      const { data: roles, error: rErr } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rErr) throw rErr;

      const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]));

      return (profiles ?? []).map(p => ({
        user_id: p.user_id,
        name: p.name,
        organization_name: p.organization_name,
        organization_id: p.organization_id,
        role: roleMap.get(p.user_id) ?? null,
        email: null, // email only in auth.users, not accessible from client
      })) as AdminUser[];
    },
  });
}

export function useAdminKPIs() {
  const orgs = useAdminOrganizations();
  const users = useAdminUsers();

  const orgCount = orgs.data?.length ?? 0;
  const userCount = users.data?.length ?? 0;
  const adminCount = users.data?.filter(u => u.role === 'admin').length ?? 0;
  const orgTypes = new Map<string, number>();
  orgs.data?.forEach(o => orgTypes.set(o.tipo, (orgTypes.get(o.tipo) ?? 0) + 1));

  return {
    orgCount,
    userCount,
    adminCount,
    orgTypes,
    isLoading: orgs.isLoading || users.isLoading,
    error: orgs.error || users.error,
  };
}

export interface SystemHealthCheck {
  service: string;
  status: 'ok' | 'error' | 'checking';
  latencyMs?: number;
  detail?: string;
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: async (): Promise<SystemHealthCheck[]> => {
      const checks: SystemHealthCheck[] = [];

      // 1. Database (REST API)
      const dbStart = performance.now();
      try {
        const { error } = await supabase.from('organizaciones').select('id').limit(1);
        const latency = Math.round(performance.now() - dbStart);
        checks.push({
          service: 'Base de datos (PostgreSQL)',
          status: error ? 'error' : 'ok',
          latencyMs: latency,
          detail: error ? error.message : `${latency}ms`,
        });
      } catch (e: any) {
        checks.push({ service: 'Base de datos (PostgreSQL)', status: 'error', detail: e.message });
      }

      // 2. Auth service
      const authStart = performance.now();
      try {
        const { error } = await supabase.auth.getSession();
        const latency = Math.round(performance.now() - authStart);
        checks.push({
          service: 'Autenticación (GoTrue)',
          status: error ? 'error' : 'ok',
          latencyMs: latency,
          detail: error ? error.message : `${latency}ms`,
        });
      } catch (e: any) {
        checks.push({ service: 'Autenticación (GoTrue)', status: 'error', detail: e.message });
      }

      // 3. Storage
      const storageStart = performance.now();
      try {
        const { error } = await supabase.storage.listBuckets();
        const latency = Math.round(performance.now() - storageStart);
        checks.push({
          service: 'Storage',
          status: error ? 'error' : 'ok',
          latencyMs: latency,
          detail: error ? error.message : `${latency}ms`,
        });
      } catch (e: any) {
        checks.push({ service: 'Storage', status: 'error', detail: e.message });
      }

      // 4. Edge Functions (ping ensure-demo-user)
      const efResult = await pingEdgeFunction();
      checks.push({
        service: 'Edge Functions',
        status: efResult.status,
        latencyMs: efResult.latencyMs,
        detail: efResult.detail,
      });

      return checks;
    },
    refetchInterval: 60000, // refresh every minute
  });
}
