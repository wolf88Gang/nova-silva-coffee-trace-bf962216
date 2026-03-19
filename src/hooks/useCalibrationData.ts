/**
 * Calibration Review — data hooks.
 *
 * Single access layer for all Calibration Review data.
 * Aligned to REAL backend schema.
 *
 * TABLE MAPPING:
 *   sessions        → sales_sessions
 *   outcomes        → sales_session_outcomes
 *   objections      → sales_session_objections
 *   recommendations → sales_session_recommendations
 *   rule_versions   → sales_rule_versions
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  CalibrationSession,
  SessionOutcome,
  CalibrationObjection,
  CalibrationRecommendation,
  RuleVersion,
  BackendStatus,
} from '@/types/calibration';

// Re-export types and analytics for backward compat
export type { CalibrationSession, SessionOutcome, CalibrationObjection, CalibrationRecommendation, RuleVersion, BackendStatus };
export type { OutcomeDistribution, ScoreBucket, ScoreKey, ObjectionAnalysis, RecommendationAnalysis } from '@/types/calibration';
export { computeOutcomes, computeScoreBuckets, computeObjectionAnalysis, computeRecommendationAnalysis, SCORE_KEYS } from '@/lib/calibrationAnalytics';

// ── Table names (single place to update) ──

const TABLE = {
  sessions: 'sales_sessions',
  outcomes: 'sales_session_outcomes',
  objections: 'sales_session_objections',
  recommendations: 'sales_session_recommendations',
  ruleVersions: 'sales_rule_versions',
} as const;

// ── Column selects (REAL schema) ──

const SELECT = {
  sessions: 'id, organization_id, lead_name, lead_company, lead_type, commercial_stage, status, score_total, score_pain, score_maturity, score_objection, score_urgency, score_fit, score_budget_readiness, created_at, updated_at',
  outcomes: 'id, session_id, outcome, deal_value, close_date, reason_lost, created_at',
  objections: 'id, session_id, objection_type, confidence, detail, created_at',
  recommendations: 'id, session_id, recommendation_type, priority, detail, signal, created_at',
  ruleVersions: 'id, parent_version_id, deployed_at, description, changes_applied, is_active, snapshot_before, snapshot_after',
} as const;

// ── Query result shape ──

interface QueryResult<T> {
  data: T[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  backendStatus: BackendStatus;
}

// ── Safe query utility ──

interface SafeQueryResult<T> {
  data: T[];
  status: BackendStatus;
}

async function safeQuery<T>(
  table: string,
  select: string,
  options?: { order?: string; limit?: number }
): Promise<SafeQueryResult<T>> {
  try {
    let query = supabase.from(table).select(select);
    if (options?.order) query = query.order(options.order, { ascending: false });
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === '42501' ||
        error.code === 'PGRST205' ||
        error.code === 'PGRST204' ||
        error.message?.includes('does not exist')
      ) {
        return { data: [], status: 'unavailable' };
      }
      return { data: [], status: 'error' };
    }
    return { data: (data ?? []) as T[], status: 'available' };
  } catch {
    return { data: [], status: 'unavailable' };
  }
}

function wrapQuery<T>(query: ReturnType<typeof useQuery<SafeQueryResult<T>>>): QueryResult<T> {
  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    backendStatus: query.data?.status ?? 'unavailable',
  };
}

const STALE_3MIN = 1000 * 60 * 3;

// ── Sessions ──

export function useCalibrationSessions(): QueryResult<CalibrationSession> {
  const query = useQuery({
    queryKey: ['calibration', 'sessions'],
    queryFn: () => safeQuery<CalibrationSession>(TABLE.sessions, SELECT.sessions, { order: 'created_at' }),
    staleTime: STALE_3MIN,
    retry: 1,
  });
  return wrapQuery(query);
}

// ── Outcomes ──

export function useCalibrationOutcomes(): QueryResult<SessionOutcome> {
  const query = useQuery({
    queryKey: ['calibration', 'outcomes'],
    queryFn: () => safeQuery<SessionOutcome>(TABLE.outcomes, SELECT.outcomes, { order: 'created_at' }),
    staleTime: STALE_3MIN,
    retry: 1,
  });
  return wrapQuery(query);
}

// ── Objections ──

export function useCalibrationObjections(): QueryResult<CalibrationObjection> {
  const query = useQuery({
    queryKey: ['calibration', 'objections'],
    queryFn: () => safeQuery<CalibrationObjection>(TABLE.objections, SELECT.objections, { order: 'created_at' }),
    staleTime: STALE_3MIN,
    retry: 1,
  });
  return wrapQuery(query);
}

// ── Recommendations ──

export function useCalibrationRecommendations(): QueryResult<CalibrationRecommendation> {
  const query = useQuery({
    queryKey: ['calibration', 'recommendations'],
    queryFn: () => safeQuery<CalibrationRecommendation>(TABLE.recommendations, SELECT.recommendations, { order: 'created_at' }),
    staleTime: STALE_3MIN,
    retry: 1,
  });
  return wrapQuery(query);
}

// ── Rule Versions ──

export function useRuleVersions(): QueryResult<RuleVersion> {
  const query = useQuery({
    queryKey: ['calibration', 'rule-versions'],
    queryFn: () => safeQuery<RuleVersion>(TABLE.ruleVersions, SELECT.ruleVersions, { order: 'deployed_at' }),
    staleTime: STALE_3MIN,
    retry: 1,
  });
  return wrapQuery(query);
}

// ── Version Detail ──

export function useRuleVersionDetail(versionId: string | undefined) {
  const query = useQuery({
    queryKey: ['calibration', 'rule-version', versionId],
    queryFn: async (): Promise<SafeQueryResult<RuleVersion>> => {
      if (!versionId) return { data: [], status: 'unavailable' };
      try {
        const { data, error } = await supabase
          .from(TABLE.ruleVersions)
          .select(SELECT.ruleVersions)
          .eq('id', versionId)
          .single();
        if (error) {
          if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
            return { data: [], status: 'unavailable' };
          }
          return { data: [], status: 'error' };
        }
        return { data: data ? [data as RuleVersion] : [], status: 'available' };
      } catch {
        return { data: [], status: 'unavailable' };
      }
    },
    enabled: !!versionId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    data: query.data?.data?.[0] ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    backendStatus: query.data?.status ?? 'unavailable',
    refetch: query.refetch,
  };
}
