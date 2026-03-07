import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';

export interface BlockedIngredient {
  ingredient_id: string;
  nombre_comun: string;
  clase_funcional: string;
  bloqueado_por: string;
  nivel: string;
  detalle: string;
}

export interface PhaseoutIngredient {
  ingredient_id: string;
  nombre_comun: string;
  certificadora: string;
  nivel_restriccion: string;
  fecha_phase_out: string;
  dias_restantes: number;
}

export function useBlockedIngredients() {
  return useQuery<BlockedIngredient[]>({
    queryKey: ['blockedIngredients'],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_blocked_ingredients' as any);
      if (error) throw error;
      return (data as BlockedIngredient[]) ?? [];
    },
  });
}

export function usePhaseoutIngredients() {
  return useQuery<PhaseoutIngredient[]>({
    queryKey: ['phaseoutIngredients'],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_phaseout_ingredients' as any);
      if (error) throw error;
      return (data as PhaseoutIngredient[]) ?? [];
    },
  });
}

export function isIngredientBlocked(
  blocked: BlockedIngredient[],
  ingredientId: string,
): boolean {
  return blocked.some((b) => b.ingredient_id === ingredientId);
}
