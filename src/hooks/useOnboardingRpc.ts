import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { enqueue, getQueue, dequeue } from '@/lib/onboardingQueue';

/**
 * Hook for onboarding RPC calls with offline fallback.
 * Calls rpc_upsert_org_profile incrementally and
 * rpc_get_onboarding_recommendation on finalize.
 */
export function useOnboardingRpc(orgId: string | null) {
  const retrying = useRef(false);

  const upsertProfile = useCallback(async (
    payload: Record<string, unknown>,
    finalize = false
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!orgId) return { ok: false, error: 'No org_id disponible' };

    const fullPayload = { ...payload, org_id: orgId, ...(finalize ? { finalize: true } : {}) };

    try {
      const { error } = await supabase.rpc('rpc_upsert_org_profile', {
        payload: fullPayload,
      });
      if (error) throw error;
      return { ok: true };
    } catch (err: any) {
      console.warn('[onboarding] RPC failed, queuing:', err.message);
      enqueue(fullPayload, finalize);
      return { ok: false, error: err.message };
    }
  }, [orgId]);

  const getRecommendation = useCallback(async (): Promise<{
    ok: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> => {
    if (!orgId) return { ok: false, error: 'No org_id' };
    try {
      const { data, error } = await supabase.rpc('rpc_get_onboarding_recommendation', {
        org_id: orgId,
      });
      if (error) throw error;
      return { ok: true, data: data as Record<string, unknown> };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }, [orgId]);

  const retryQueue = useCallback(async () => {
    if (retrying.current) return;
    retrying.current = true;
    const queue = getQueue();
    for (const item of queue) {
      try {
        const { error } = await supabase.rpc('rpc_upsert_org_profile', {
          payload: item.payload,
        });
        if (!error) dequeue(item.id);
      } catch { /* keep in queue */ }
    }
    retrying.current = false;
  }, []);

  return { upsertProfile, getRecommendation, retryQueue };
}
