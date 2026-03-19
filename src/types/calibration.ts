/**
 * Calibration Review — Type definitions.
 * Single source of truth for all calibration data contracts.
 *
 * Backend canonical tables:
 *   - sales_sessions          (or v_sales_calibration_dataset)
 *   - sales_objections        (or sales_session_objections)
 *   - sales_recommendations   (or sales_session_recommendations)
 *   - sales_rule_versions
 *
 * If the backend renames tables, update TABLE_NAMES in
 * salesCalibrationService.ts — types stay the same.
 */

// ── Row-level types (match DB columns) ──

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

export type ScoreKey = 'pain' | 'maturity' | 'urgency' | 'fit' | 'budget_readiness';

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
