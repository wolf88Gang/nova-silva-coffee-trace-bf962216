/**
 * Priority Engine — signal-driven question selection.
 *
 * Replaces question-driven (order-based) flow with relevance-based selection.
 * Sections 1–6 of the adaptive diagnostic upgrade spec.
 */

import type { LoadedQuestion, LoadedAnswer, LoadedOption } from './FlowEngine.types';
import type {
  PriorityProfile,
  ProfileGapField,
  DiagnosticSignals,
  NextQuestionReason,
  PriorityEngineResult,
} from './priorityEngine.types';
import { PRIORITY_CONFIG, PRODUCTOR_BLOCKED_TAGS, ANSWER_TO_PROFILE } from './priorityQuestionConfig';

// ─── SECTION 2: GAP DETECTION ────────────────────────────────────────────────

const CRITICAL_FIELDS: (keyof PriorityProfile)[] = [
  'organization_type',
  'scale',
  'commercialization_model',
  'pricing_power',
  'buyer_type',
  'logistics_model',
  'certification_status',
  'pain_severity',
  'maturity_level',
  'urgency_timeline',
  'budget_readiness',
  'objection_profile',
];

/**
 * Returns missing critical profile fields.
 * Used to prioritize questions that fill gaps.
 */
export function getProfileGaps(profile: PriorityProfile): ProfileGapField[] {
  const gaps: ProfileGapField[] = [];
  for (const field of CRITICAL_FIELDS) {
    const val = profile[field];
    if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
      gaps.push(field as ProfileGapField);
    }
  }
  return gaps;
}

// ─── Profile builder from answers ──────────────────────────────────────────────

/**
 * Builds a PriorityProfile from answers + questions (for option value resolution).
 */
export function buildProfileFromAnswers(
  answers: LoadedAnswer[],
  questions: LoadedQuestion[]
): PriorityProfile {
  const answerByCode = new Map(answers.map((a) => [a.question_code, a]));
  const optionsByQuestion = new Map<string, LoadedOption[]>();
  for (const q of questions) {
    optionsByQuestion.set(q.id, q.options);
  }

  const profile: PriorityProfile = {
    organization_type: null,
    scale: null,
    commercialization_model: null,
    pricing_power: null,
    buyer_type: null,
    logistics_model: null,
    certification_status: null,
    pain_severity: null,
    maturity_level: null,
    urgency_timeline: null,
    budget_readiness: null,
    objection_profile: null,
  };

  for (const [code, mapping] of Object.entries(ANSWER_TO_PROFILE)) {
    const answer = answerByCode.get(code);
    if (!answer?.answer_option_ids?.length) continue;

    const question = questions.find((q) => q.code === code);
    const opts = question ? optionsByQuestion.get(question.id) ?? [] : [];
    const opt = opts.find((o) => o.id === answer.answer_option_ids![0]);
    const value = opt?.value ?? null;
    if (!value) continue;

    const entry = mapping[value];
    if (entry) {
      (profile as Record<string, string | null>)[entry.field] = entry.value;
    }
  }

  return profile;
}

// ─── SECTION 3: SIGNAL TRACKING ─────────────────────────────────────────────────

/** Maps answer option values to signals (from scoring rules + heuristics). */
const VALUE_TO_SIGNALS: Record<string, { pain?: string; maturity?: string; urgency?: string }> = {
  '4_plus': { pain: 'rejections' },
  '30_plus': { pain: 'manual_hours' },
  none: { pain: 'visibility_gap', maturity: 'legacy_systems' },
  '20k_50k': { pain: 'cost_impact' },
  critical: { pain: 'severity_high' },
  spreadsheets: { maturity: 'legacy_systems' },
  excel: { maturity: 'data_format' },
  partial: { maturity: 'mobile_adoption' },
  limited: { maturity: 'connectivity' },
  lt3m: { urgency: 'timeline_short' },
  heard: {},
  full: {},
  '5k_15k': {},
  next_3m: { urgency: 'harvest_soon' },
};

/**
 * Updates signals from answers. Each answer can add to pain/maturity/urgency.
 */
export function getSignalsFromAnswers(
  answers: LoadedAnswer[],
  questions: LoadedQuestion[]
): DiagnosticSignals {
  const signals: DiagnosticSignals = {
    pain_signals: [],
    maturity_signals: [],
    urgency_signals: [],
    contradiction_flags: [],
  };

  const seen = { pain: new Set<string>(), maturity: new Set<string>(), urgency: new Set<string>() };

  for (const a of answers) {
    const q = questions.find((q) => q.id === a.question_id);
    if (!q?.options?.length || !a.answer_option_ids?.length) continue;

    const opt = q.options.find((o) => o.id === a.answer_option_ids[0]);
    const value = opt?.value;
    if (!value) continue;

    const mapped = VALUE_TO_SIGNALS[value];
    if (mapped) {
      if (mapped.pain && !seen.pain.has(mapped.pain)) {
        seen.pain.add(mapped.pain);
        signals.pain_signals.push(mapped.pain as import('./priorityEngine.types').PainSignal);
      }
      if (mapped.maturity && !seen.maturity.has(mapped.maturity)) {
        seen.maturity.add(mapped.maturity);
        signals.maturity_signals.push(mapped.maturity as import('./priorityEngine.types').MaturitySignal);
      }
      if (mapped.urgency && !seen.urgency.has(mapped.urgency)) {
        seen.urgency.add(mapped.urgency);
        signals.urgency_signals.push(mapped.urgency as import('./priorityEngine.types').UrgencySignal);
      }
    }
  }

  return signals;
}

// ─── SECTION 5: PRODUCTOR BLOCKING ─────────────────────────────────────────────

function isBlockedForProductor(question: LoadedQuestion, orgType: string | null): boolean {
  if (orgType !== 'productor') return false;
  const config = PRIORITY_CONFIG[question.code];
  if (!config) return false;
  const hasBlockedTag = config.tags.some((t) =>
    PRODUCTOR_BLOCKED_TAGS.some((b) => b === t || t.includes('producer') || t.includes('producers'))
  );
  return hasBlockedTag;
}

// ─── SECTION 4: PRIORITY ENGINE ────────────────────────────────────────────────

const GAP_RELEVANCE_BONUS = 15;
const SIGNAL_RELEVANCE_BONUS = 12;
const CONTRADICTION_PRIORITY_BONUS = 20;
const REDUNDANCY_PENALTY = 8;

/**
 * Selects next question by relevance, not order.
 *
 * Algorithm:
 * 1. Filter by organization_type
 * 2. Remove answered
 * 3. Block productor-inappropriate questions
 * 4. Score: weight + gap_relevance + signal_relevance + contradiction_priority - redundancy_penalty
 * 5. Return highest score
 */
export function getNextPriorityQuestion(
  profile: PriorityProfile,
  answeredQuestions: Set<string>,
  signals: DiagnosticSignals,
  questions: LoadedQuestion[],
  skippedQuestions: Set<string> = new Set()
): PriorityEngineResult {
  const gaps = getProfileGaps(profile);
  const orgType = profile.organization_type;

  // If org_type unknown, force CTX_ORG_TYPE first
  if (!orgType) {
    const ctxOrg = questions.find((q) => q.code === 'CTX_ORG_TYPE');
    if (ctxOrg && !answeredQuestions.has(ctxOrg.id) && !skippedQuestions.has(ctxOrg.id)) {
      return {
        next_question: ctxOrg,
        next_question_id: ctxOrg.id,
        reason: {
          gap_fills: ['organization_type'],
          signal_triggers: [],
          score_breakdown: {
            weight: 100,
            gap_relevance: 50,
            signal_relevance: 0,
            contradiction_priority: 0,
            redundancy_penalty: 0,
            total: 150,
          },
        },
        is_complete: false,
        skipped_count: 0,
      };
    }
  }

  const candidates: LoadedQuestion[] = [];

  for (const q of questions) {
    if (answeredQuestions.has(q.id)) continue;
    if (skippedQuestions.has(q.id)) continue;
    if (isBlockedForProductor(q, orgType)) continue;

    const config = PRIORITY_CONFIG[q.code];
    if (!config) continue;

    const appliesTo = config.applies_to || [];
    if (orgType && appliesTo.length > 0 && !appliesTo.includes(orgType)) continue;

    const deps = config.dependencies || [];
    const depsMet = deps.every((d) => {
      const depQ = questions.find((q) => q.code === d);
      return !depQ || answeredQuestions.has(depQ.id);
    });
    if (!depsMet) continue;

    candidates.push(q);
  }

  if (candidates.length === 0) {
    return {
      next_question: null,
      next_question_id: null,
      reason: null,
      is_complete: true,
      skipped_count: skippedQuestions.size,
    };
  }

  let best: LoadedQuestion | null = null;
  let bestScore = -Infinity;
  let bestReason: NextQuestionReason | null = null;

  for (const q of candidates) {
    const config = PRIORITY_CONFIG[q.code];
    const weight = config?.weight ?? 10;

    let gapRelevance = 0;
    const gapFills: ProfileGapField[] = [];
    for (const g of config?.gap_targets ?? []) {
      if (gaps.includes(g)) {
        gapRelevance += GAP_RELEVANCE_BONUS;
        gapFills.push(g);
      }
    }

    let signalRelevance = 0;
    const signalTriggers: string[] = [];
    for (const st of config?.signal_targets ?? []) {
      if (
        signals.pain_signals.includes(st as any) ||
        signals.maturity_signals.includes(st as any) ||
        signals.urgency_signals.includes(st as any)
      ) {
        signalRelevance += SIGNAL_RELEVANCE_BONUS;
        signalTriggers.push(st);
      }
    }

    let contradictionPriority = 0;
    if (signals.contradiction_flags.length > 0) {
      contradictionPriority = CONTRADICTION_PRIORITY_BONUS;
    }

    let redundancyPenalty = 0;
    const sectionCode = q.section?.code ?? '';
    const sameSectionAnswered = questions.some(
      (oq) =>
        oq.section?.code === sectionCode &&
        oq.id !== q.id &&
        answeredQuestions.has(oq.id)
    );
    if (sameSectionAnswered && gapFills.length === 0 && signalTriggers.length === 0) {
      redundancyPenalty = REDUNDANCY_PENALTY;
    }

    const total =
      weight + gapRelevance + signalRelevance + contradictionPriority - redundancyPenalty;

    if (total > bestScore) {
      bestScore = total;
      best = q;
      bestReason = {
        gap_fills: gapFills,
        signal_triggers: signalTriggers,
        score_breakdown: {
          weight,
          gap_relevance: gapRelevance,
          signal_relevance: signalRelevance,
          contradiction_priority: contradictionPriority,
          redundancy_penalty: redundancyPenalty,
          total,
        },
      };
    }
  }

  return {
    next_question: best,
    next_question_id: best?.id ?? null,
    reason: bestReason,
    is_complete: false,
    skipped_count: skippedQuestions.size,
  };
}
