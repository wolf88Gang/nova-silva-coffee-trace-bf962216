/**
 * Onboarding persistence hooks.
 *
 * Tables:
 *   - public.organization_profile  (PK organization_id)
 *   - public.organization_setup_state (PK organization_id)
 *
 * Strategy: try RPC v2 first, fallback to direct upsert.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ── Types ──

export interface SetupState {
  organization_id: string;
  wizard_version: number | null;
  current_step: number;
  completed_steps: number[] | null;
  is_completed: boolean;
  completed_at: string | null;
  checklist: Record<string, unknown> | null;
  last_seen_at: string | null;
  updated_at: string | null;
}

interface SaveSetupPayload {
  currentStep: number;
  completedSteps?: number[];
  isCompleted?: boolean;
  checklist?: Record<string, unknown>;
  lastSeenAt?: string;
}

interface Result {
  ok: boolean;
  error?: string;
}

// ── Reader ──

/** Read organization_setup_state for a given org */
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

// ── Writer hook ──

export function useOnboardingPersistence(orgId: string | null) {
  const qc = useQueryClient();

  /** Upsert partial fields into organization_profile */
  const saveProfile = useCallback(async (fields: Record<string, unknown>): Promise<Result> => {
    if (!orgId) return { ok: false, error: 'Sin org_id' };

    // Try RPC v2 first
    try {
      const { error } = await supabase.rpc('rpc_upsert_org_profile_v2' as any, {
        p_fields: { organization_id: orgId, ...fields },
      });
      if (!error) return { ok: true };
      // RPC doesn't exist or failed - fall through to direct upsert
      if (!error.message?.includes('function') && !error.message?.includes('does not exist')) {
        throw error;
      }
    } catch (rpcErr: any) {
      // If it's a real error (not "function not found"), propagate
      if (!rpcErr?.message?.includes('function') && !rpcErr?.message?.includes('does not exist')) {
        console.warn('[onboarding] profile RPC error:', rpcErr.message);
      }
    }

    // Fallback: direct upsert
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

  /** Upsert setup state (step tracking + checklist) */
  const saveSetupState = useCallback(async (payload: SaveSetupPayload): Promise<Result> => {
    if (!orgId) return { ok: false, error: 'Sin org_id' };

    const now = new Date().toISOString();

    // Try RPC v2 first
    try {
      const { error } = await supabase.rpc('rpc_update_setup_state_v2' as any, {
        p_current_step: payload.currentStep,
        p_completed: payload.isCompleted ?? false,
        p_checklist: payload.checklist ?? null,
        p_completed_steps: payload.completedSteps ?? null,
      });
      if (!error) {
        qc.invalidateQueries({ queryKey: ['setup-state', orgId] });
        return { ok: true };
      }
      if (!error.message?.includes('function') && !error.message?.includes('does not exist')) {
        throw error;
      }
    } catch (rpcErr: any) {
      if (!rpcErr?.message?.includes('function') && !rpcErr?.message?.includes('does not exist')) {
        console.warn('[onboarding] setup RPC error:', rpcErr.message);
      }
    }

    // Fallback: direct upsert
    try {
      const row: Record<string, unknown> = {
        organization_id: orgId,
        current_step: payload.currentStep,
        is_completed: payload.isCompleted ?? false,
        updated_at: now,
        last_seen_at: payload.lastSeenAt ?? now,
      };
      if (payload.completedSteps) row.completed_steps = payload.completedSteps;
      if (payload.checklist) row.checklist = payload.checklist;
      if (payload.isCompleted) row.completed_at = now;

      const { error } = await (supabase as any)
        .from('organization_setup_state')
        .upsert(row, { onConflict: 'organization_id' });
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
