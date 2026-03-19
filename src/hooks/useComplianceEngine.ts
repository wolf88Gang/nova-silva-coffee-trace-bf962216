/**
 * Hooks para cumplimiento agroquímico (Tramo B).
 * RPCs: get_blocked_ingredients, get_phaseout_ingredients
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

const STALE_MINUTES = 30;

export interface BlockedIngredient {
  ingredient_id: string;
  nombre_comun: string;
  clase_funcional: string | null;
  bloqueado_por: string;
  nivel: string;
  detalle: string | null;
}

export interface PhaseoutIngredient {
  ingredient_id: string;
  nombre_comun: string;
  certificadora: string;
  nivel_restriccion: string;
  fecha_phase_out: string | null;
  dias_restantes: number | null;
}

export function useBlockedIngredients() {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.blockedIngredients, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_blocked_ingredients', {
        _org_id: organizationId!,
      });
      if (error) throw error;
      return (data ?? []) as BlockedIngredient[];
    },
    enabled: !orgLoading && !!organizationId,
    staleTime: STALE_MINUTES * 60 * 1000,
  });
}

export function usePhaseoutIngredients() {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.phaseoutIngredients, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_phaseout_ingredients', {
        _org_id: organizationId!,
      });
      if (error) throw error;
      return (data ?? []) as PhaseoutIngredient[];
    },
    enabled: !orgLoading && !!organizationId,
    staleTime: STALE_MINUTES * 60 * 1000,
  });
}

export function isIngredientBlocked(
  blocked: BlockedIngredient[],
  ingredientId: string
): boolean {
  return blocked.some((b) => b.ingredient_id === ingredientId);
}
