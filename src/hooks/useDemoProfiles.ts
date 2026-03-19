/**
 * Hook para perfiles demo por organización.
 * Intenta v_demo_profiles_ui; si vacío o error, usa mocks locales.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProfilesByOrg, type DemoProfile, type DemoOrganization } from '@/config/demoArchitecture';

interface VDemoProfileRow {
  id: string;
  organization_id: string;
  profile_label: string;
  role: string;
  description: string | null;
  landing_route: string | null;
}

/** Mapeo role backend → email demo (ensure-demo-user usa 5 usuarios fijos) */
const ROLE_TO_DEMO_EMAIL: Record<string, string> = {
  cooperativa: 'demo.cooperativa@novasilva.com',
  tecnico: 'demo.tecnico@novasilva.com',
  productor: 'demo.productor@novasilva.com',
  exportador: 'demo.exportador@novasilva.com',
  certificadora: 'demo.certificadora@novasilva.com',
  admin_org: 'demo.cooperativa@novasilva.com',
  auditor: 'demo.certificadora@novasilva.com',
};

function getDemoEmailForProfile(profileRole: string, orgType?: string): string {
  if (profileRole === 'tecnico') return ROLE_TO_DEMO_EMAIL.tecnico;
  if (profileRole === 'productor') return ROLE_TO_DEMO_EMAIL.productor;
  if (profileRole === 'auditor') return ROLE_TO_DEMO_EMAIL.certificadora;
  if (profileRole === 'admin_org') {
    if (orgType === 'exportador') return ROLE_TO_DEMO_EMAIL.exportador;
    if (orgType === 'certificadora') return ROLE_TO_DEMO_EMAIL.certificadora;
    return ROLE_TO_DEMO_EMAIL.cooperativa;
  }
  return ROLE_TO_DEMO_EMAIL[profileRole] ?? ROLE_TO_DEMO_EMAIL.cooperativa;
}

function mapRowToProfile(row: VDemoProfileRow, orgType?: string): DemoProfile {
  const email = getDemoEmailForProfile(row.role, orgType);
  return {
    id: row.id,
    name: row.profile_label ?? row.role,
    role: row.role,
    organizationId: row.organization_id,
    email,
    password: 'demo123456',
  };
}

export function useDemoProfiles(orgId: string | null, orgs?: DemoOrganization[]) {
  const org = orgId && orgs ? orgs.find((o) => o.id === orgId) : null;

  return useQuery({
    queryKey: ['demo-profiles', orgId],
    queryFn: async () => {
      if (!orgId) return { data: [], source: 'local' as const };

      const { data, error } = await supabase
        .from('v_demo_profiles_ui')
        .select('id, organization_id, profile_label, role, description, landing_route')
        .eq('organization_id', orgId);

      if (error) {
        console.warn('v_demo_profiles_ui:', error.message);
        return { data: getProfilesByOrg(orgId), source: 'local' as const };
      }
      if (!data?.length) {
        return { data: getProfilesByOrg(orgId), source: 'local' as const };
      }
      const orgType = org?.orgType;
      return {
        data: data.map((r) => mapRowToProfile(r as VDemoProfileRow, orgType)),
        source: 'supabase' as const,
      };
    },
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
}
