/**
 * FlowEngine — deterministic diagnostic flow logic.
 *
 * Pure function. Zero I/O. No Supabase imports.
 * Receives shaped data from FlowEngineLoader and returns the next action.
 */

import type {
  FlowEngineInput,
  FlowState,
  FlowFlag,
  LoadedQuestion,
  LoadedAnswer,
  LoadedObjection,
  QuestionMetadata,
  SkipCondition,
  ScoreState,
} from './FlowEngine.types';

// ─── Tunable thresholds ───────────────────────────────────────────────────────
// All scores are additive weights (not percentages) from the rule engine.
// Adjust as the questionnaire dataset grows.

const THRESHOLDS = {
  high_pain: 40,
  high_objection_score: 30,
  high_objection_count: 1,   // any detected objection triggers deepening
  unclear_maturity_max: 35,
  unclear_maturity_min_answers: 3,  // don't flag before enough data
  low_fit: 25,
  budget_risk: 20,
} as const;

// ─── Answer map ───────────────────────────────────────────────────────────────
// Keyed by question_code for stable references in skip conditions.

function buildAnswerMap(answers: LoadedAnswer[]): Map<string, LoadedAnswer> {
  const map = new Map<string, LoadedAnswer>();
  for (const a of answers) {
    map.set(a.question_code, a);
  }
  return map;
}

// ─── Skip condition evaluator ─────────────────────────────────────────────────
// Returns true if the condition is satisfied (i.e., the question should be skipped).

function evaluateSkipCondition(
  cond: SkipCondition,
  answerMap: Map<string, LoadedAnswer>,
): boolean {
  const answer = answerMap.get(cond.question_code);

  switch (cond.operator) {
    case 'answered':
      return answer !== undefined;

    case 'not_answered':
      return answer === undefined;

    case 'answered_with': {
      if (!answer?.answer_option_ids?.length) return false;
      const targets = Array.isArray(cond.value) ? cond.value : [cond.value as string];
      return targets.some((v) => answer.answer_option_ids!.includes(v));
    }

    case 'not_answered_with': {
      // True when: no answer at all, OR answer exists but doesn't include the target option(s)
      if (!answer?.answer_option_ids?.length) return true;
      const targets = Array.isArray(cond.value) ? cond.value : [cond.value as string];
      return !targets.some((v) => answer.answer_option_ids!.includes(v));
    }

    case 'boolean_is': {
      if (answer?.answer_boolean === null || answer?.answer_boolean === undefined) return false;
      return answer.answer_boolean === cond.value;
    }

    case 'number_above': {
      if (answer?.answer_number == null) return false;
      return answer.answer_number > (cond.value as number);
    }

    case 'number_below': {
      if (answer?.answer_number == null) return false;
      return answer.answer_number < (cond.value as number);
    }

    default:
      return false;
  }
}

// ─── Skip gate ────────────────────────────────────────────────────────────────
// A question is skipped if ANY of its skip_if conditions evaluates to true.

function shouldSkip(
  question: LoadedQuestion,
  answerMap: Map<string, LoadedAnswer>,
): boolean {
  const meta = question.metadata;
  if (!meta?.skip_if?.length) return false;
  return meta.skip_if.some((cond) => evaluateSkipCondition(cond, answerMap));
}

// ─── Flag computation ─────────────────────────────────────────────────────────

function computeFlags(
  scores: ScoreState,
  objections: LoadedObjection[],
  answeredCount: number,
): FlowFlag[] {
  const flags: FlowFlag[] = [];

  if (scores.score_pain >= THRESHOLDS.high_pain) {
    flags.push('high_pain');
  }

  if (
    scores.score_objection >= THRESHOLDS.high_objection_score ||
    objections.length >= THRESHOLDS.high_objection_count
  ) {
    flags.push('high_objection');
  }

  if (
    answeredCount >= THRESHOLDS.unclear_maturity_min_answers &&
    scores.score_maturity <= THRESHOLDS.unclear_maturity_max
  ) {
    flags.push('unclear_maturity');
  }

  if (scores.score_fit <= THRESHOLDS.low_fit && answeredCount > 0) {
    flags.push('low_fit');
  }

  if (scores.score_budget_readiness <= THRESHOLDS.budget_risk && answeredCount > 0) {
    flags.push('budget_risk');
  }

  return flags;
}

// ─── Deepening priority score ─────────────────────────────────────────────────
// Returns how many active flags a question's deepen_when list matches.
// Used to sort deepening questions ahead of normal questions.

function deepeningScore(question: LoadedQuestion, activeFlags: FlowFlag[]): number {
  const meta = question.metadata as QuestionMetadata | null;
  if (!meta?.deepen_when?.length) return 0;
  return meta.deepen_when.filter((f) => activeFlags.includes(f)).length;
}

// ─── Main engine entry point ──────────────────────────────────────────────────

export function computeFlowState(input: FlowEngineInput): FlowState {
  const { questions, answers, scores, objections } = input;

  const answerMap = buildAnswerMap(answers);
  const answeredIds = new Set(answers.map((a) => a.question_id));
  const answeredCount = answeredIds.size;

  // Step 1: Compute flags from current state
  const flags = computeFlags(scores, objections, answeredCount);
  const deepening = flags.some((f) =>
    (['high_pain', 'high_objection', 'unclear_maturity'] as FlowFlag[]).includes(f),
  );
  if (deepening) flags.push('deepening_active');

  // Step 2: Compute progress denominator
  // total_visible = questions that can appear in normal flow (not deepening_only)
  let totalVisible = 0;
  for (const q of questions) {
    if (!q.metadata?.deepening_only) totalVisible++;
  }

  // Step 3: Build candidate list
  // Candidates are: unanswered + not skipped + visible given deepening state
  const candidates: LoadedQuestion[] = [];

  for (const q of questions) {
    if (answeredIds.has(q.id)) continue;
    if (shouldSkip(q, answerMap)) continue;
    if (q.metadata?.deepening_only && !deepening) continue;
    candidates.push(q);
  }

  // Step 4: All questions done
  if (candidates.length === 0) {
    return {
      next_question_id: null,
      next_question: null,
      is_complete: true,
      context: scores,
      detected_objections: objections,
      flags,
      deepening_active: deepening,
      progress: {
        answered: answeredCount,
        total_visible: totalVisible,
        percentage: totalVisible > 0 ? 100 : 0,
      },
    };
  }

  // Step 5: Sort candidates
  // Priority: deepening_score DESC → section.position ASC → question.position ASC
  const sorted = [...candidates].sort((a, b) => {
    const da = deepeningScore(a, flags);
    const db = deepeningScore(b, flags);
    if (db !== da) return db - da;
    if (a.section.position !== b.section.position) return a.section.position - b.section.position;
    return a.position - b.position;
  });

  const next = sorted[0];

  return {
    next_question_id: next.id,
    next_question: next,
    is_complete: false,
    context: scores,
    detected_objections: objections,
    flags,
    deepening_active: deepening,
    progress: {
      answered: answeredCount,
      total_visible: totalVisible,
      percentage: totalVisible > 0 ? Math.round((answeredCount / totalVisible) * 100) : 0,
    },
  };
}
