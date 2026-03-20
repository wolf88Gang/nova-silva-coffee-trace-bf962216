/**
 * CalibrationService — fetches calibration data for Calibration Review.
 * Backend: fn_cal_validation_summary, fn_cal_score_bucket_analysis, fn_cal_objection_analysis, v_sales_calibration_dataset.
 * Auth: caller must be admin (RLS on underlying tables).
 */

import { supabase } from '@/integrations/supabase/client';

export interface CalibrationRow {
  session_id: string;
  outcome: 'won' | 'lost' | 'no_decision' | null;
  score_pain: number | null;
  score_maturity: number | null;
  score_objection: number | null;
  score_urgency: number | null;
  score_fit: number | null;
  score_budget_readiness: number | null;
  total_score: number | null;
  objection_count: number;
  max_objection_confidence: number | null;
  objection_types: string[];
  rec_count?: number;
  rec_types?: string[];
  rec_signals?: string[];
}

export interface ValidationSummary {
  total_sessions: number;
  with_outcome: number;
  without_outcome: number;
  won: number;
  lost: number;
  no_decision: number;
  win_rate: number;
  loss_rate: number;
  no_decision_rate: number;
}

export interface ScoreBucketRow {
  dimension: string;
  bucket: string;
  session_count: number;
  won: number;
  lost: number;
  no_decision: number;
  win_rate: number;
  signal: string;
}

export interface ObjectionAnalysisRow {
  objection_type: string;
  count: number;
  avg_confidence: number | null;
  sessions_with_win: number;
  sessions_with_loss: number;
  loss_rate: number;
  signal: string;
  over_triggered: boolean;
  high_risk: boolean;
}

export interface CalibrationSummary {
  validation: ValidationSummary;
  outcome_distribution: { outcome: string; count: number }[];
  score_bucket_analysis: ScoreBucketRow[];
  objection_analysis: ObjectionAnalysisRow[];
  sample: CalibrationRow[];
  /** Rows with outcome for rec_underperform in rule candidates. */
  rows_for_rec: CalibrationRow[];
}

export class CalibrationService {
  /**
   * Fetches calibration workspace from backend RPCs + view.
   */
  static async getCalibrationSummary(): Promise<CalibrationSummary> {
    const [validationRes, scoreRes, objectionRes, viewRes] = await Promise.all([
      supabase.rpc('fn_cal_validation_summary'),
      supabase.rpc('fn_cal_score_bucket_analysis'),
      supabase.rpc('fn_cal_objection_analysis'),
      supabase.from('v_sales_calibration_dataset').select('*').limit(500),
    ]);

    if (validationRes.error) {
      throw new Error(
        `fn_cal_validation_summary no disponible. Verifica migraciones 20250323*, 20250324*. ${validationRes.error.message}`
      );
    }
    if (scoreRes.error) {
      throw new Error(
        `fn_cal_score_bucket_analysis no disponible. Verifica migraciones 20250323*, 20250324*. ${scoreRes.error.message}`
      );
    }
    if (objectionRes.error) {
      throw new Error(
        `fn_cal_objection_analysis no disponible. Verifica migraciones 20250323*, 20250324*. ${objectionRes.error.message}`
      );
    }
    if (viewRes.error) {
      throw new Error(
        `v_sales_calibration_dataset no disponible (depende de sales_sessions, sales_session_objections, sales_session_recommendations, sales_session_outcomes). ${viewRes.error.message}`
      );
    }

    const v = (validationRes.data as Record<string, unknown>[])?.[0];
    const validation: ValidationSummary = v
      ? {
          total_sessions: Number(v.total_sessions ?? 0),
          with_outcome: Number(v.with_outcome ?? 0),
          without_outcome: Number(v.without_outcome ?? 0),
          won: Number(v.won ?? 0),
          lost: Number(v.lost ?? 0),
          no_decision: Number(v.no_decision ?? 0),
          win_rate: Number(v.win_rate ?? 0),
          loss_rate: Number(v.loss_rate ?? 0),
          no_decision_rate: Number(v.no_decision_rate ?? 0),
        }
      : {
          total_sessions: 0,
          with_outcome: 0,
          without_outcome: 0,
          won: 0,
          lost: 0,
          no_decision: 0,
          win_rate: 0,
          loss_rate: 0,
          no_decision_rate: 0,
        };

    const outcome_distribution = [
      { outcome: 'won', count: validation.won },
      { outcome: 'lost', count: validation.lost },
      { outcome: 'no_decision', count: validation.no_decision },
    ].filter((x) => x.count > 0);

    const score_bucket_analysis = (scoreRes.data ?? []) as ScoreBucketRow[];
    const objection_analysis = (objectionRes.data ?? []) as ObjectionAnalysisRow[];

    const rows = (viewRes.data ?? []) as CalibrationRow[];
    const rowsWithOutcome = rows.filter((r) => r.outcome != null);

    return {
      validation,
      outcome_distribution,
      score_bucket_analysis,
      objection_analysis,
      sample: rows.slice(0, 50),
      rows_for_rec: rowsWithOutcome,
    };
  }
}
