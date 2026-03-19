/**
 * calibrationAnalytics — rule candidates from backend analytics.
 * Score and objection analysis now come from backend RPCs.
 */

import type { CalibrationRow } from './CalibrationService';
import type { ScoreBucketRow, ObjectionAnalysisRow } from './CalibrationService';

const MIN_SAMPLE = 5;

export interface RuleCandidate {
  kind: 'score_weak' | 'objection_over' | 'rec_underperform';
  id: string;
  label: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Computes rule adjustment candidates from backend score/objection results + rec rows.
 */
export function computeRuleCandidates(
  scoreResults: ScoreBucketRow[],
  objectionResults: ObjectionAnalysisRow[],
  rowsForRec: CalibrationRow[]
): RuleCandidate[] {
  const candidates: RuleCandidate[] = [];
  const withOutcome = rowsForRec.filter((r) => r.outcome != null);

  // Score dimensions: strong_negative bucket (high) or weak discrimination (medium)
  const dims = [...new Set(scoreResults.map((r) => r.dimension))];
  for (const dim of dims) {
    const buckets = scoreResults.filter((r) => r.dimension === dim);
    const neg = buckets.find((b) => b.signal === 'strong_negative');
    const allWeak = buckets.every((b) => b.signal === 'neutral' || b.signal === 'noise');
    const hasSample = buckets.some((b) => b.session_count >= MIN_SAMPLE);
    if (neg) {
      const lossRate = neg.session_count > 0 ? neg.lost / neg.session_count : 0;
      candidates.push({
        kind: 'score_weak',
        id: `score_${dim}_${neg.bucket}`,
        label: `${dim} ${neg.bucket}`,
        detail: `Loss ${(lossRate * 100).toFixed(0)}% (n=${neg.session_count})`,
        priority: 'high',
      });
    } else if (allWeak && hasSample) {
      candidates.push({
        kind: 'score_weak',
        id: `score_${dim}`,
        label: dim,
        detail: 'Sin discriminación clara',
        priority: 'medium',
      });
    }
  }

  // Over-triggered or high-risk objections (from backend)
  for (const o of objectionResults) {
    if (o.over_triggered || o.high_risk) {
      const parts: string[] = [];
      if (o.over_triggered) parts.push('over-triggered');
      if (o.high_risk) parts.push(`loss ${(o.loss_rate * 100).toFixed(0)}%`);
      candidates.push({
        kind: 'objection_over',
        id: `obj_${o.objection_type}`,
        label: o.objection_type,
        detail: parts.join(' · '),
        priority: 'high',
      });
    }
  }

  // Recommendation patterns underperform (rec_types with low win rate)
  const recByType = new Map<string, { wins: number; total: number }>();
  for (const r of withOutcome) {
    const types = r.rec_types ?? [];
    for (const t of types) {
      let entry = recByType.get(t);
      if (!entry) {
        entry = { wins: 0, total: 0 };
        recByType.set(t, entry);
      }
      entry.total += 1;
      if (r.outcome === 'won') entry.wins += 1;
    }
  }
  for (const [recType, { wins, total }] of recByType) {
    if (total >= MIN_SAMPLE) {
      const winRate = wins / total;
      if (winRate < 0.35) {
        candidates.push({
          kind: 'rec_underperform',
          id: `rec_${recType}`,
          label: recType,
          detail: `Win rate ${(winRate * 100).toFixed(0)}% (n=${total})`,
          priority: 'high',
        });
      }
    }
  }

  return candidates;
}
