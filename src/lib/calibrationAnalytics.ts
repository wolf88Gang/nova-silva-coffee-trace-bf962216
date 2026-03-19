/**
 * Calibration Review — Analytics computations.
 *
 * ⚠️  FRONTEND DRIFT NOTICE:
 * These computations duplicate analytics that SHOULD live as SQL views
 * or RPCs in the backend. They exist as a stopgap until backend views
 * are deployed. When backend provides pre-computed analytics, replace
 * these functions with direct data fetches.
 *
 * REAL SCHEMA: scores are individual columns (score_pain, score_maturity, etc.)
 * NOT a JSON object. Outcomes are in sales_session_outcomes, not on the session row.
 */
import type {
  CalibrationSession,
  SessionOutcome,
  CalibrationObjection,
  CalibrationRecommendation,
  OutcomeDistribution,
  ScoreBucket,
  ScoreKey,
  ObjectionAnalysis,
  RecommendationAnalysis,
  CalibrationSignal,
  BucketCounts,
} from '@/types/calibration';
import { SCORE_LABELS } from '@/lib/calibrationLabels';

export const SCORE_KEYS: ScoreKey[] = ['pain', 'maturity', 'urgency', 'fit', 'budget_readiness', 'objection'];

/** Map ScoreKey to the real column name on CalibrationSession */
const SCORE_COLUMN_MAP: Record<ScoreKey, keyof CalibrationSession> = {
  pain: 'score_pain',
  maturity: 'score_maturity',
  urgency: 'score_urgency',
  fit: 'score_fit',
  budget_readiness: 'score_budget_readiness',
  objection: 'score_objection',
};

function getScoreValue(session: CalibrationSession, key: ScoreKey): number | null {
  const col = SCORE_COLUMN_MAP[key];
  return (session[col] as number | null) ?? null;
}

const EMPTY_BUCKET: BucketCounts = { won: 0, lost: 0, noDecision: 0, total: 0 };

// ── Outcomes ──

export function computeOutcomes(outcomes: SessionOutcome[] | null): OutcomeDistribution {
  const empty: OutcomeDistribution = { won: 0, lost: 0, no_decision: 0, total: 0, winRate: 0, lossRate: 0, noDecisionRate: 0 };
  if (!outcomes || outcomes.length === 0) return empty;

  const won = outcomes.filter(o => o.outcome === 'won').length;
  const lost = outcomes.filter(o => o.outcome === 'lost').length;
  const no_decision = outcomes.filter(o => o.outcome === 'no_decision').length;
  const total = outcomes.length;

  return {
    won, lost, no_decision, total,
    winRate: total > 0 ? (won / total) * 100 : 0,
    lossRate: total > 0 ? (lost / total) * 100 : 0,
    noDecisionRate: total > 0 ? (no_decision / total) * 100 : 0,
  };
}

// ── Score Buckets ──
// Requires joining sessions with outcomes to know win/loss per session

export function computeScoreBuckets(
  sessions: CalibrationSession[] | null,
  outcomes: SessionOutcome[] | null
): ScoreBucket[] {
  if (!sessions) return [];
  const outcomeMap = new Map<string, string>();
  if (outcomes) {
    for (const o of outcomes) {
      outcomeMap.set(o.session_id, o.outcome);
    }
  }

  return SCORE_KEYS.map(key => {
    const bucket: ScoreBucket = {
      scoreKey: key,
      low: { ...EMPTY_BUCKET },
      mid: { ...EMPTY_BUCKET },
      high: { ...EMPTY_BUCKET },
    };
    for (const s of sessions) {
      const outcome = outcomeMap.get(s.id);
      if (!outcome) continue;
      const val = getScoreValue(s, key);
      if (val == null) continue;
      const tier: 'low' | 'mid' | 'high' = val <= 3 ? 'low' : val <= 7 ? 'mid' : 'high';
      bucket[tier].total++;
      if (outcome === 'won') bucket[tier].won++;
      else if (outcome === 'lost') bucket[tier].lost++;
      else bucket[tier].noDecision++;
    }
    return bucket;
  });
}

// ── Objection Analysis ──

export function computeObjectionAnalysis(
  objections: CalibrationObjection[] | null,
  outcomes: SessionOutcome[] | null
): ObjectionAnalysis[] {
  if (!objections) return [];
  const outcomeMap = new Map<string, string>();
  if (outcomes) {
    for (const o of outcomes) {
      outcomeMap.set(o.session_id, o.outcome);
    }
  }
  const byType = new Map<string, { count: number; totalConf: number; won: number; lost: number }>();

  for (const o of objections) {
    const outcome = outcomeMap.get(o.session_id);
    const entry = byType.get(o.objection_type) ?? { count: 0, totalConf: 0, won: 0, lost: 0 };
    entry.count++;
    entry.totalConf += o.confidence ?? 0;
    if (outcome === 'won') entry.won++;
    if (outcome === 'lost') entry.lost++;
    byType.set(o.objection_type, entry);
  }

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

// ── Recommendation Analysis ──

export function computeRecommendationAnalysis(
  recs: CalibrationRecommendation[] | null,
  outcomes: SessionOutcome[] | null
): RecommendationAnalysis[] {
  if (!recs) return [];
  const outcomeMap = new Map<string, string>();
  if (outcomes) {
    for (const o of outcomes) {
      outcomeMap.set(o.session_id, o.outcome);
    }
  }
  const byType = new Map<string, { count: number; won: number; lost: number }>();

  for (const r of recs) {
    const outcome = outcomeMap.get(r.session_id);
    const entry = byType.get(r.recommendation_type) ?? { count: 0, won: 0, lost: 0 };
    entry.count++;
    if (outcome === 'won') entry.won++;
    if (outcome === 'lost') entry.lost++;
    byType.set(r.recommendation_type, entry);
  }

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

// ── Signals ──

const MIN_SAMPLE_DISCRIMINATING = 10;
const MIN_SAMPLE_SCORE = 5;
const DISCRIMINATION_THRESHOLD = 0.1;
const OVER_DETECT_COUNT = 10;
const OVER_DETECT_LOSS = 20;
const UNDER_DETECT_COUNT = 3;
const UNDER_DETECT_LOSS = 80;
const OVERUSE_MULTIPLIER = 3;
const OVERUSE_WIN_CEILING = 30;
const LOW_TOTAL_SAMPLE = 20;

export function computeSignals(
  sessions: CalibrationSession[] | null,
  outcomes: SessionOutcome[] | null,
  objections: CalibrationObjection[] | null,
  recs: CalibrationRecommendation[] | null
): CalibrationSignal[] {
  const signals: CalibrationSignal[] = [];
  if (!sessions || sessions.length === 0) return signals;

  // Score signals
  const buckets = computeScoreBuckets(sessions, outcomes);
  for (const b of buckets) {
    const total = b.low.total + b.mid.total + b.high.total;
    if (total > 0 && total < MIN_SAMPLE_SCORE) {
      signals.push({
        id: `low-sample-${b.scoreKey}`,
        severity: 'medium',
        category: 'Scores',
        title: `Muestra insuficiente para ${SCORE_LABELS[b.scoreKey] ?? b.scoreKey}`,
        detail: `Solo ${total} sesiones tienen score ${b.scoreKey}. Resultados estadísticamente poco confiables.`,
      });
    }
    if (total >= MIN_SAMPLE_DISCRIMINATING) {
      const lowWR = b.low.total > 0 ? b.low.won / b.low.total : 0;
      const highWR = b.high.total > 0 ? b.high.won / b.high.total : 0;
      if (Math.abs(highWR - lowWR) < DISCRIMINATION_THRESHOLD) {
        signals.push({
          id: `no-discrim-${b.scoreKey}`,
          severity: 'high',
          category: 'Scores',
          title: `${SCORE_LABELS[b.scoreKey] ?? b.scoreKey} no discrimina outcomes`,
          detail: `Win rate similar en bucket bajo (${(lowWR * 100).toFixed(1)}%) y alto (${(highWR * 100).toFixed(1)}%). Posible ruido.`,
        });
      }
    }
  }

  // Objection signals
  if (objections) {
    const objAnalysis = computeObjectionAnalysis(objections, outcomes);
    for (const o of objAnalysis) {
      if (o.count >= OVER_DETECT_COUNT && o.lossRate < OVER_DETECT_LOSS) {
        signals.push({
          id: `over-detected-${o.type}`,
          severity: 'medium',
          category: 'Bloqueadores',
          title: `"${o.type}" posiblemente sobre-detectado`,
          detail: `${o.count} detecciones pero solo ${o.lossRate.toFixed(1)}% loss rate. Podría ser ruido.`,
        });
      }
      if (o.count < UNDER_DETECT_COUNT && o.lossRate > UNDER_DETECT_LOSS) {
        signals.push({
          id: `under-detected-${o.type}`,
          severity: 'high',
          category: 'Bloqueadores',
          title: `"${o.type}" con muestra mínima pero alto loss rate`,
          detail: `Solo ${o.count} detecciones con ${o.lossRate.toFixed(1)}% loss rate. Requiere más datos o revisión de threshold.`,
        });
      }
    }
  }

  // Recommendation signals
  if (recs) {
    const recAnalysis = computeRecommendationAnalysis(recs, outcomes);
    const avg = recAnalysis.length > 0 ? recAnalysis.reduce((s, a) => s + a.count, 0) / recAnalysis.length : 0;
    for (const r of recAnalysis) {
      if (r.count > avg * OVERUSE_MULTIPLIER && r.winRate < OVERUSE_WIN_CEILING) {
        signals.push({
          id: `overused-rec-${r.type}`,
          severity: 'high',
          category: 'Próximos pasos',
          title: `"${r.type}" sobreutilizada sin resultados`,
          detail: `${r.count} usos (${OVERUSE_MULTIPLIER}x promedio) con solo ${r.winRate.toFixed(1)}% win rate. Evaluar eliminación o ajuste.`,
        });
      }
    }
  }

  // General sample size
  if (sessions.length < LOW_TOTAL_SAMPLE) {
    signals.push({
      id: 'low-total-sample',
      severity: 'low',
      category: 'General',
      title: 'Muestra total reducida',
      detail: `Solo ${sessions.length} sesiones. Todas las métricas deben interpretarse con cautela.`,
    });
  }

  const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  signals.sort((a, b) => (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2));

  return signals;
}
