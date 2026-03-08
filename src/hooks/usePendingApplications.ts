/**
 * Hook to fetch pending nutrition applications from ag_nut_schedule
 * and execution completeness metrics.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';

export interface ScheduleItem {
  id: string;
  plan_id: string;
  sequence_no: number;
  window_code: string;
  target_date: string | null;
  status: string;
  products_json: unknown;
  nutrients_json: unknown;
  parcela_nombre?: string;
  plan_ciclo?: string;
}

export interface ExecutionSummary {
  plan_id: string;
  parcela_nombre: string;
  ciclo: string;
  total_applications: number;
  completed: number;
  pct_complete: number;
}

const WINDOW_LABELS: Record<string, string> = {
  post_poda: 'Post-poda',
  pre_floracion: 'Pre-floración',
  post_floracion: 'Post-floración',
  llenado: 'Llenado de grano',
  cabeza_alfiler: 'Cabeza de alfiler',
  expansion_rapida: 'Expansión rápida',
  llenado_grano: 'Llenado de grano',
  maduracion: 'Maduración',
};

export function getWindowLabel(code: string): string {
  return WINDOW_LABELS[code] ?? code.replace(/_/g, ' ');
}

/**
 * Fetches pending applications for an org. Falls back to nutricion_fraccionamientos
 * if ag_nut_schedule is not yet deployed.
 */
export function usePendingApplications() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['pending_applications', organizationId],
    queryFn: async (): Promise<ScheduleItem[]> => {
      // Try ag_nut_schedule first (Fase 2 table)
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('ag_nut_schedule')
        .select(`
          id, plan_id, sequence_no, window_code, target_date, status,
          products_json, nutrients_json
        `)
        .in('status', ['pendiente', 'programado'])
        .order('target_date', { ascending: true, nullsFirst: false });

      if (!scheduleError && scheduleData?.length) {
        // Enrich with plan/parcela info
        const planIds = [...new Set(scheduleData.map(s => s.plan_id))];
        const { data: plans } = await supabase
          .from('nutricion_planes')
          .select('id, parcela_id, ciclo')
          .in('id', planIds);

        const parcelaIds = [...new Set((plans ?? []).map(p => p.parcela_id))];
        const { data: parcelas } = await supabase
          .from('parcelas')
          .select('id, nombre')
          .in('id', parcelaIds);

        const planMap = new Map((plans ?? []).map(p => [p.id, p]));
        const parcelaMap = new Map((parcelas ?? []).map(p => [p.id, p.nombre]));

        return scheduleData.map(s => {
          const plan = planMap.get(s.plan_id);
          return {
            ...s,
            parcela_nombre: plan ? (parcelaMap.get(plan.parcela_id) ?? '—') : '—',
            plan_ciclo: plan?.ciclo ?? '—',
          };
        });
      }

      // Fallback: use nutricion_fraccionamientos from approved plans
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('nutricion_fraccionamientos')
        .select(`
          id, plan_id, numero_aplicacion,
          etapa_fenologica, fecha_programada,
          n_kg_ha, p2o5_kg_ha, k2o_kg_ha, tipo_aplicacion
        `)
        .order('fecha_programada', { ascending: true, nullsFirst: false })
        .limit(50);

      if (fallbackError) throw fallbackError;

      // Get plan info
      const planIds = [...new Set((fallbackData ?? []).map(f => f.plan_id))];
      const { data: plans } = await supabase
        .from('nutricion_planes')
        .select('id, parcela_id, ciclo, status')
        .in('id', planIds)
        .in('status', ['aprobado', 'activo', 'programado']);

      const approvedPlanIds = new Set((plans ?? []).map(p => p.id));
      const parcelaIds = [...new Set((plans ?? []).map(p => p.parcela_id))];
      const { data: parcelas } = await supabase
        .from('parcelas')
        .select('id, nombre')
        .in('id', parcelaIds);

      const planMap = new Map((plans ?? []).map(p => [p.id, p]));
      const parcelaMap = new Map((parcelas ?? []).map(p => [p.id, p.nombre]));

      return (fallbackData ?? [])
        .filter(f => approvedPlanIds.has(f.plan_id))
        .map(f => {
          const plan = planMap.get(f.plan_id);
          return {
            id: f.id,
            plan_id: f.plan_id,
            sequence_no: f.numero_aplicacion,
            window_code: f.etapa_fenologica ?? `app_${f.numero_aplicacion}`,
            target_date: f.fecha_programada,
            status: 'pendiente',
            products_json: null,
            nutrients_json: {
              N: f.n_kg_ha,
              P2O5: f.p2o5_kg_ha,
              K2O: f.k2o_kg_ha,
            },
            parcela_nombre: plan ? (parcelaMap.get(plan.parcela_id) ?? '—') : '—',
            plan_ciclo: plan?.ciclo ?? '—',
          };
        });
    },
    enabled: !!organizationId,
    staleTime: 30_000,
  });
}

/**
 * Fetches execution completeness summaries per plan.
 */
export function useExecutionSummaries() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['execution_summaries', organizationId],
    queryFn: async (): Promise<ExecutionSummary[]> => {
      // Get plans with execution data
      const { data: plans, error } = await supabase
        .from('nutricion_planes')
        .select('id, parcela_id, ciclo, status, execution_pct_total')
        .eq('organization_id', organizationId!)
        .in('status', ['aprobado', 'activo', 'programado', 'en_ejecucion'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!plans?.length) return [];

      const parcelaIds = [...new Set(plans.map(p => p.parcela_id))];
      const { data: parcelas } = await supabase
        .from('parcelas')
        .select('id, nombre')
        .in('id', parcelaIds);

      const parcelaMap = new Map((parcelas ?? []).map(p => [p.id, p.nombre]));

      // Get schedule counts per plan
      const planIds = plans.map(p => p.id);
      const { data: scheduleItems } = await supabase
        .from('nutricion_fraccionamientos')
        .select('plan_id')
        .in('plan_id', planIds);

      const countMap = new Map<string, number>();
      (scheduleItems ?? []).forEach(s => {
        countMap.set(s.plan_id, (countMap.get(s.plan_id) ?? 0) + 1);
      });

      return plans.map(p => ({
        plan_id: p.id,
        parcela_nombre: parcelaMap.get(p.parcela_id) ?? '—',
        ciclo: p.ciclo,
        total_applications: countMap.get(p.id) ?? 0,
        completed: Math.round(((p.execution_pct_total ?? 0) / 100) * (countMap.get(p.id) ?? 0)),
        pct_complete: p.execution_pct_total ?? 0,
      }));
    },
    enabled: !!organizationId,
    staleTime: 30_000,
  });
}
