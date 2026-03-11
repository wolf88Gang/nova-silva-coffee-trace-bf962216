/**
 * React Query hooks for Supabase UI views.
 * Each hook queries a v_* view filtered by organization_id,
 * with graceful fallback to null on error (view may not exist yet).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { useOrgContext } from '@/hooks/useOrgContext';

// ── Helper: safe view query ──

async function queryView<T = Record<string, unknown>>(
  viewName: string,
  filters?: Record<string, string | null>,
  orderBy?: string,
): Promise<T[] | null> {
  try {
    let q = (supabase as any).from(viewName).select('*');
    if (filters) {
      for (const [col, val] of Object.entries(filters)) {
        if (val) q = q.eq(col, val);
      }
    }
    if (orderBy) q = q.order(orderBy);
    const { data, error } = await q;
    if (error) {
      console.warn(`[useViewData] ${viewName}:`, error.message);
      return null;
    }
    return data as T[];
  } catch (e) {
    console.warn(`[useViewData] ${viewName} fetch failed:`, e);
    return null;
  }
}

// ── Types matching Supabase views ──

export interface DemoOrgRow {
  id: string;
  display_name: string;
  org_type: string;
  operating_model: string;
  country: string;
  modules: string[];
  is_demo: boolean;
  description?: string;
  stats?: Record<string, unknown>;
}

export interface DemoProfileRow {
  id: string;
  organization_id: string;
  profile_label: string;
  role: string;
  description: string;
  landing_route: string;
  access_areas?: string[];
}

export interface ParcelaHubRow {
  parcela_id: string;
  organization_id: string;
  productor_id: string;
  productor_nombre: string;
  parcela_nombre: string;
  area_ha: number | null;
  variedad: string | null;
  altitud: number | null;
  ultimo_plan_nutricion_estado: string | null;
  ultimo_diagnostico_guard_riesgo: string | null;
  ultima_estimacion_yield_fecha: string | null;
  ultimo_score_vital: number | null;
  tiene_evidencias: boolean;
  tiene_jornales: boolean;
  tiene_eudr: boolean;
  tiene_novacup: boolean;
}

export interface OverviewRow {
  [key: string]: unknown;
}

// ── Hooks ──

export function useDemoOrganizations() {
  return useQuery({
    queryKey: ['v_demo_organizations_ui'],
    queryFn: () => queryView<DemoOrgRow>('v_demo_organizations_ui', undefined, 'display_name'),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}

export function useDemoProfiles(organizationId: string | null) {
  return useQuery({
    queryKey: ['v_demo_profiles_ui', organizationId],
    queryFn: () => queryView<DemoProfileRow>('v_demo_profiles_ui', { organization_id: organizationId }),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}

function useActiveOrgId(): string | null {
  const { organizationId } = useOrgContext();
  const demoConfig = getDemoConfig();
  // For demo mode, use the demo org id (may be a synthetic id)
  return organizationId || demoConfig?.orgId || null;
}

export function useParcelaHub(parcelaId: string | null) {
  return useQuery({
    queryKey: ['v_parcela_hub_summary', parcelaId],
    queryFn: () => queryView<ParcelaHubRow>('v_parcela_hub_summary', { parcela_id: parcelaId }),
    enabled: !!parcelaId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useProduccionOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_produccion_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_produccion_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useNutricionOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_nutricion_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_nutricion_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useGuardOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_guard_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_guard_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useYieldOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_yield_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_yield_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useVitalOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_vital_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_vital_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useComplianceOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_compliance_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_compliance_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useNovaCupOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_novacup_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_novacup_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useJornalesOverview() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_jornales_overview', orgId],
    queryFn: () => queryView<OverviewRow>('v_jornales_overview', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// ── VITAL granular views ──

export interface VitalParcelaRow {
  parcela_id: string;
  organization_id: string;
  productor_id: string;
  ultimo_score_vital: number | null;
}

export interface VitalPromedioProductorRow {
  productor_id: string;
  vital_promedio_productor: number | null;
}

export function useVitalParcelas() {
  const orgId = useActiveOrgId();
  return useQuery({
    queryKey: ['v_vital_parcela_last', orgId],
    queryFn: () => queryView<VitalParcelaRow>('v_vital_parcela_last', { organization_id: orgId }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useVitalPromedioProductor() {
  return useQuery({
    queryKey: ['v_vital_promedio_productor'],
    queryFn: () => queryView<VitalPromedioProductorRow>('v_vital_promedio_productor'),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
