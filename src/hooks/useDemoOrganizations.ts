/**
 * Hook para organizaciones demo.
 * Intenta v_demo_organizations_ui; si vacío o error, usa mocks locales.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DEMO_ORGANIZATIONS,
  type DemoOrganization,
  type DemoModule,
} from '@/config/demoArchitecture';

interface VDemoOrgRow {
  id: string;
  display_name: string;
  org_type: string | null;
  operating_model: string | null;
  country: string | null;
  modules: unknown;
  is_demo: boolean;
}

function mapModules(raw: unknown): DemoModule[] {
  if (!raw || !Array.isArray(raw)) {
    return [
      { id: 'm1', key: 'produccion', label: 'Producción', active: true },
      { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: true },
      { id: 'm3', key: 'agronomia', label: 'Agronomía', active: true },
      { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: true },
      { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: true },
      { id: 'm6', key: 'calidad', label: 'Calidad', active: true },
      { id: 'm7', key: 'finanzas', label: 'Finanzas', active: true },
      { id: 'm8', key: 'jornales', label: 'Jornales', active: true },
    ];
  }
  return (raw as { key?: string; active?: boolean }[]).map((m, i) => ({
    id: `m${i + 1}`,
    key: m.key ?? '',
    label: m.key ?? '',
    active: m.active ?? true,
  }));
}

function mapRowToOrg(row: VDemoOrgRow): DemoOrganization {
  return {
    id: row.id,
    name: row.display_name ?? 'Demo org',
    orgType: (row.org_type as DemoOrganization['orgType']) ?? 'cooperativa',
    operatingModel: (row.operating_model as DemoOrganization['operatingModel']) ?? 'agregacion_cooperativa',
    modules: mapModules(row.modules),
  };
}

export function useDemoOrganizations() {
  return useQuery({
    queryKey: ['demo-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_demo_organizations_ui')
        .select('id, display_name, org_type, operating_model, country, modules, is_demo');

      if (error) {
        console.warn('v_demo_organizations_ui:', error.message);
        return { data: DEMO_ORGANIZATIONS, source: 'local' as const };
      }
      if (!data?.length) {
        return { data: DEMO_ORGANIZATIONS, source: 'local' as const };
      }
      return {
        data: data.map((r) => mapRowToOrg(r as VDemoOrgRow)),
        source: 'supabase' as const,
      };
    },
    staleTime: 60 * 1000,
  });
}
