/**
 * Calibration Review — Type definitions.
 * Single source of truth for all calibration data contracts.
 *
 * Backend canonical tables:
 *   - sales_sessions
 *   - sales_session_objections
 *   - sales_session_recommendations
 *   - sales_session_outcomes
 *   - sales_rule_versions
 */

// ── Row-level types (match REAL DB columns) ──

export interface CalibrationSession {
  id: string;
  organization_id: string | null;
  lead_name: string | null;
  lead_company: string | null;
  lead_type: string | null;
  commercial_stage: string | null;
  status: string | null;
  score_total: number | null;
  score_pain: number | null;
  score_maturity: number | null;
  score_objection: number | null;
  score_urgency: number | null;
  score_fit: number | null;
  score_budget_readiness: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface SessionOutcome {
  id: string;
  session_id: string;
  outcome: 'won' | 'lost' | 'no_decision';
  deal_value: number | null;
  created_at: string;
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
  priority: number | null;
  created_at: string;
}

export interface RuleVersion {
  id: string;
  deployed_at: string | null;
  description: string | null;
  changes_applied: Record<string, unknown> | null;
  is_active: boolean;
}

// ── Computed analytics types ──

export interface OutcomeDistribution {
  won: number;
  lost: number;
  no_decision: number;
  total: number;
  winRate: number;
  lossRate: number;
  noDecisionRate: number;
}

export type ScoreKey = 'pain' | 'maturity' | 'urgency' | 'fit' | 'budget_readiness' | 'objection';

export interface BucketCounts {
  won: number;
  lost: number;
  noDecision: number;
  total: number;
}

export interface ScoreBucket {
  scoreKey: ScoreKey;
  low: BucketCounts;
  mid: BucketCounts;
  high: BucketCounts;
}

export interface ObjectionAnalysis {
  type: string;
  count: number;
  avgConfidence: number;
  sessionsWithLoss: number;
  sessionsWithWin: number;
  lossRate: number;
}

export interface RecommendationAnalysis {
  type: string;
  count: number;
  sessionsWithWin: number;
  sessionsWithLoss: number;
  winRate: number;
}

export type BackendStatus = 'available' | 'unavailable' | 'error';

export interface CalibrationSignal {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  detail: string;
}
