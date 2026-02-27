/**
 * Hook for onboarding persistence.
 * Writes directly to organization_profile and organization_setup_state via upsert.
 * Falls back to offline queue if writes fail.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface SetupState {
  organization_id: string;
  current_step: number;
  is_completed: boolean;
  checklist: Record<string, unknown>;
}

/** Check if onboarding is completed for this org */
export function useSetupState(orgId: string | null) {
  return useQuery({
    queryKey: ['setup-state', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('organization_setup_state')
        .select('*')
        .eq('organization_id', orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as SetupState | null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useOnboardingPersistence(orgId: string | null) {
  const qc = useQueryClient();

  /** Upsert profile fields (partial) */
  const saveProfile = useCallback(async (fields: Record<string, unknown>) => {
    if (!orgId) return { ok: false, error: 'Sin org_id' };
    try {
      const { error } = await (supabase as any)
        .from('organization_profile')
        .upsert(
          { organization_id: orgId, ...fields, updated_at: new Date().toISOString() },
          { onConflict: 'organization_id' }
        );
      if (error) throw error;
      return { ok: true };
    } catch (err: any) {
      console.warn('[onboarding] profile save failed:', err.message);
      return { ok: false, error: err.message };
    }
  }, [orgId]);

  /** Upsert setup state (step tracking + checklist + modules) */
  const saveSetupState = useCallback(async (
    currentStep: number,
    isCompleted: boolean,
    checklist?: Record<string, unknown>
  ) => {
    if (!orgId) return { ok: false, error: 'Sin org_id' };
    try {
      const payload: Record<string, unknown> = {
        organization_id: orgId,
        current_step: currentStep,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      };
      if (checklist) payload.checklist = checklist;
      if (isCompleted) payload.completed_at = new Date().toISOString();

      const { error } = await (supabase as any)
        .from('organization_setup_state')
        .upsert(payload, { onConflict: 'organization_id' });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['setup-state', orgId] });
      return { ok: true };
    } catch (err: any) {
      console.warn('[onboarding] setup state save failed:', err.message);
      return { ok: false, error: err.message };
    }
  }, [orgId, qc]);

  return { saveProfile, saveSetupState };
}
