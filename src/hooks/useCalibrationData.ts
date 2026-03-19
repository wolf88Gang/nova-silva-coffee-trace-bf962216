/**
 * Calibration Review — data hooks.
 * Attempts to read from Sales Intelligence tables in Supabase.
 * Gracefully degrades if tables don't exist or return errors.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──

export interface CalibrationSession {
  id: string;
  organization_id: string | null;
  outcome: 'won' | 'lost' | 'no_decision' | null;
  scores: Record<string, number> | null;
  created_at: string;
  rule_version_id: string | null;
}

export interface CalibrationObjection {
  id: string;
  session_id: string;
  objection_type: string;
  confidence: number;
  created_at: string;
}

export interface CalibrationRecommendation {
  id: string;
  session_id: string;
  recommendation_type: string;
  signal: string | null;
  created_at: string;
}

export interface RuleVersion {
  id: string;
  version: string;
  parent_version_id: string | null;
  deployed_at: string;
  description: string | null;
  changes_applied: Record<string, unknown> | null;
  is_active: boolean;
  snapshot_before: Record<string, unknown> | null;
  snapshot_after: Record<string, unknown> | null;
}

export type BackendStatus = 'available' | 'unavailable' | 'error';

interface QueryResult<T> {
  data: T[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  backendStatus: BackendStatus;
}

/**
 * Safely query a table. If the table doesn't exist (42P01) or RLS blocks,
 * we return empty with backendStatus='unavailable' instead of crashing.
 */
async function safeQuery<T>(
  table: string,
  select: string,
  options?: { order?: string; limit?: number }
): Promise<{ data: T[]; status: BackendStatus }> {
  try {
    let q = supabase.from(table).select(select) as any;
    if (options?.order) q = q.order(options.order, { ascending: false });
    if (options?.limit) q = q.limit(options.limit);
    const { data, error } = await q;
    if (error) {
      // Table doesn't exist or permission denied
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === '42501') {
        return { data: [], status: 'unavailable' };
      }
      return { data: [], status: 'error' };
    }
    return { data: (data ?? []) as T[], status: 'available' };
  } catch {
    return { data: [], status: 'unavailable' };
  }
}

// ── Sessions ──

export function useCalibrationSessions(): QueryResult<CalibrationSession> {
  const query = useQuery({
    queryKey: ['calibration', 'sessions'],
    queryFn: () => safeQuery<CalibrationSession>(
      'sales_sessions',
      'id, organization_id, outcome, scores, created_at, rule_version_id',
      { order: 'created_at' }
    ),
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });

  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    backendStatus: query.data?.status ?? 'unavailable',
  };
}

// ── Objections ──

export function useCalibrationObjections(): QueryResult<CalibrationObjection> {
  const query = useQuery({
    queryKey: ['calibration', 'objections'],
    queryFn: () => safeQuery<CalibrationObjection>(
      'sales_objections',
      'id, session_id, objection_type, confidence, created_at',
      { order: 'created_at' }
    ),
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });

  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    backendStatus: query.data?.status ?? 'unavailable',
  };
}

// ── Recommendations ──

export function useCalibrationRecommendations(): QueryResult<CalibrationRecommendation> {
  const query = useQuery({
    queryKey: ['calibration', 'recommendations'],
    queryFn: () => safeQuery<CalibrationRecommendation>(
      'sales_recommendations',
      'id, session_id, recommendation_type, signal, created_at',
      { order: 'created_at' }
    ),
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });

  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    backendStatus: query.data?.status ?? 'unavailable',
  };
}

// ── Rule Versions ──

export function useRuleVersions(): QueryResult<RuleVersion> {
  const query = useQuery({
    queryKey: ['calibration', 'rule-versions'],
    queryFn: () => safeQuery<RuleVersion>(
      'sales_rule_versions',
      'id, version, parent_version_id, deployed_at, description, changes_applied, is_active, snapshot_before, snapshot_after',
      { order: 'deployed_at' }
    ),
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });

  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    backendStatus: query.data?.status ?? 'unavailable',
  };
}

export function useRuleVersionDetail(versionId: string | undefined) {
  const query = useQuery({
    queryKey: ['calibration', 'rule-version', versionId],
    queryFn: async () => {
      if (!versionId) return { data: [], status: 'unavailable' as BackendStatus };
      try {
        const { data, error } = await supabase
          .from('sales_rule_versions')
          .select('*')
          .eq('id', versionId)
          .single();
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return { data: [], status: 'unavailable' as BackendStatus };
          }
          return { data: [], status: 'error' as BackendStatus };
        }
        return { data: data ? [data as RuleVersion] : [], status: 'available' as BackendStatus };
      } catch {
        return { data: [], status: 'unavailable' as BackendStatus };
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

// ── Computed analytics ──

export interface OutcomeDistribution {
  won: number;
  lost: number;
  no_decision: number;
  total: number;
  winRate: number;
  lossRate: number;
  noDecisionRate: number;
}

export function computeOutcomes(sessions: CalibrationSession[] | null): OutcomeDistribution {
  if (!sessions || sessions.length === 0) {
    return { won: 0, lost: 0, no_decision: 0, total: 0, winRate: 0, lossRate: 0, noDecisionRate: 0 };
  }
  const withOutcome = sessions.filter(s => s.outcome);
  const won = withOutcome.filter(s => s.outcome === 'won').length;
  const lost = withOutcome.filter(s => s.outcome === 'lost').length;
  const no_decision = withOutcome.filter(s => s.outcome === 'no_decision').length;
  const total = withOutcome.length;
  return {
    won, lost, no_decision, total,
    winRate: total > 0 ? (won / total) * 100 : 0,
    lossRate: total > 0 ? (lost / total) * 100 : 0,
    noDecisionRate: total > 0 ? (no_decision / total) * 100 : 0,
  };
}

export type ScoreKey = 'pain' | 'maturity' | 'urgency' | 'fit' | 'budget_readiness';
export const SCORE_KEYS: ScoreKey[] = ['pain', 'maturity', 'urgency', 'fit', 'budget_readiness'];

export interface ScoreBucket {
  scoreKey: ScoreKey;
  low: { won: number; lost: number; noDecision: number; total: number };
  mid: { won: number; lost: number; noDecision: number; total: number };
  high: { won: number; lost: number; noDecision: number; total: number };
}

export function computeScoreBuckets(sessions: CalibrationSession[] | null): ScoreBucket[] {
  if (!sessions) return [];
  return SCORE_KEYS.map(key => {
    const bucket = {
      scoreKey: key,
      low: { won: 0, lost: 0, noDecision: 0, total: 0 },
      mid: { won: 0, lost: 0, noDecision: 0, total: 0 },
      high: { won: 0, lost: 0, noDecision: 0, total: 0 },
    };
    sessions.forEach(s => {
      if (!s.scores || !s.outcome) return;
      const val = s.scores[key];
      if (val == null) return;
      const tier = val <= 3 ? 'low' : val <= 7 ? 'mid' : 'high';
      bucket[tier].total++;
      if (s.outcome === 'won') bucket[tier].won++;
      else if (s.outcome === 'lost') bucket[tier].lost++;
      else bucket[tier].noDecision++;
    });
    return bucket;
  });
}

export interface ObjectionAnalysis {
  type: string;
  count: number;
  avgConfidence: number;
  sessionsWithLoss: number;
  sessionsWithWin: number;
  lossRate: number;
}

export function computeObjectionAnalysis(
  objections: CalibrationObjection[] | null,
  sessions: CalibrationSession[] | null
): ObjectionAnalysis[] {
  if (!objections || !sessions) return [];
  const sessionMap = new Map(sessions.map(s => [s.id, s]));
  const byType = new Map<string, { count: number; totalConf: number; won: number; lost: number }>();

  objections.forEach(o => {
    const session = sessionMap.get(o.session_id);
    const entry = byType.get(o.objection_type) ?? { count: 0, totalConf: 0, won: 0, lost: 0 };
    entry.count++;
    entry.totalConf += o.confidence;
    if (session?.outcome === 'won') entry.won++;
    if (session?.outcome === 'lost') entry.lost++;
    byType.set(o.objection_type, entry);
  });

  return Array.from(byType.entries())
    .map(([type, d]) => ({
      type,
      count: d.count,
      avgConfidence: d.count > 0 ? d.totalConf / d.count : 0,
      sessionsWithLoss: d.lost,
      sessionsWithWin: d.won,
      lossRate: (d.won + d.lost) > 0 ? (d.lost / (d.won + d.lost)) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export interface RecommendationAnalysis {
  type: string;
  count: number;
  sessionsWithWin: number;
  sessionsWithLoss: number;
  winRate: number;
}

export function computeRecommendationAnalysis(
  recs: CalibrationRecommendation[] | null,
  sessions: CalibrationSession[] | null
): RecommendationAnalysis[] {
  if (!recs || !sessions) return [];
  const sessionMap = new Map(sessions.map(s => [s.id, s]));
  const byType = new Map<string, { count: number; won: number; lost: number }>();

  recs.forEach(r => {
    const session = sessionMap.get(r.session_id);
    const entry = byType.get(r.recommendation_type) ?? { count: 0, won: 0, lost: 0 };
    entry.count++;
    if (session?.outcome === 'won') entry.won++;
    if (session?.outcome === 'lost') entry.lost++;
    byType.set(r.recommendation_type, entry);
  });

  return Array.from(byType.entries())
    .map(([type, d]) => ({
      type,
      count: d.count,
      sessionsWithWin: d.won,
      sessionsWithLoss: d.lost,
      winRate: (d.won + d.lost) > 0 ? (d.won / (d.won + d.lost)) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
