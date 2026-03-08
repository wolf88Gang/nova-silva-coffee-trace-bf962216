/**
 * Hook to fetch full plan detail via get_plan_detail RPC
 * and approve/supersede plans via their respective RPCs.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ── Types ── */

export interface PlanNutrient {
  nutrient_code: string;
  required_amount: number;
  unit: string;
  source: string;
}

export interface PlanProduct {
  product_name: string;
  dose: number;
  unit: string;
  price: number | null;
  window_code: string;
}

export interface PlanScheduleItem {
  sequence_no: number;
  window_code: string;
  target_date: string | null;
  status: string;
  products_json: unknown;
  nutrients_json: unknown;
}

export interface PlanAuditEvent {
  event_type: string;
  actor_id: string;
  detail: unknown;
  created_at: string;
}

export interface ExplainStep {
  step_order: number;
  title: string;
  detail: string;
}

export interface PlanDetail {
  id: string;
  parcela_id: string;
  organization_id: string;
  ciclo: string;
  objetivo: string | null;
  status: string;
  nivel_confianza: string | null;
  modo_calculo: string | null;
  engine_version: string | null;
  hash_receta: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  plan_json: unknown;
  nutrients: PlanNutrient[];
  products: PlanProduct[];
  schedule: PlanScheduleItem[];
  explain_steps: ExplainStep[];
  audit_events: PlanAuditEvent[];
  fraccionamientos: unknown[];
}

/* ── Hook: fetch plan detail ── */

export function useNutritionPlanDetail(planId: string | null) {
  return useQuery({
    queryKey: ['nutrition_plan_detail', planId],
    queryFn: async (): Promise<PlanDetail> => {
      const { data, error } = await supabase.rpc('get_plan_detail', {
        p_plan_id: planId!,
      });
      if (error) throw error;
      // RPC returns jsonb — may be wrapped in an object or be the object itself
      const plan = typeof data === 'string' ? JSON.parse(data) : data;
      return plan as PlanDetail;
    },
    enabled: !!planId,
    staleTime: 30_000,
  });
}

/* ── Mutation: approve plan ── */

export function useApprovePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { data, error } = await supabase.rpc('approve_nutrition_plan', {
        _plan_id: planId,
        _user_id: session.user.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, planId) => {
      toast.success('Plan aprobado exitosamente');
      qc.invalidateQueries({ queryKey: ['nutrition_plan_detail', planId] });
      qc.invalidateQueries({ queryKey: ['nutricion_planes'] });
    },
    onError: (e: any) => toast.error(`Error al aprobar: ${e.message}`),
  });
}

/* ── Mutation: supersede plan ── */

export function useSupersedePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldPlanId, newPlanId }: { oldPlanId: string; newPlanId: string }) => {
      const { data, error } = await supabase.rpc('supersede_nutrition_plan', {
        _old_plan_id: oldPlanId,
        _new_plan_id: newPlanId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Plan reemplazado exitosamente');
      qc.invalidateQueries({ queryKey: ['nutricion_planes'] });
    },
    onError: (e: any) => toast.error(`Error al reemplazar: ${e.message}`),
  });
}
