/**
 * FlowEngineLoader — Supabase data fetching for sales diagnostic.
 *
 * ACTIVE FLOW: Commercial Copilot → SalesSessionService.getDiagnosticBundle / getNextStep
 * SINGLE ENGINE: priorityEngine.mergePriorityIntoFlowState (no parallel wizard selector)
 * BACKEND CONTRACT: sales_sessions, sales_questions, sales_session_answers, sales_session_objections
 */

import { supabase } from '@/integrations/supabase/client';
import { computeFlowState } from './FlowEngine';
import {
  buildProfileFromAnswers,
  getSignalsFromAnswers,
  getNextPriorityQuestion,
} from './priorityEngine';
import type {
  FlowState,
  FlowEngineInput,
  LoadedQuestion,
  LoadedAnswer,
  LoadedObjection,
  LoadedOption,
  ScoreState,
} from './FlowEngine.types';

/** Full snapshot for Copilot interpretation (same fetch as getNextStep, no duplicate queries). */
export interface SalesDiagnosticBundle {
  flowState: FlowState;
  questions: LoadedQuestion[];
  answers: LoadedAnswer[];
}

function mergePriorityIntoFlowState(
  baseState: FlowState,
  questions: LoadedQuestion[],
  answers: LoadedAnswer[],
  sessionMetadata: unknown
): FlowState {
  const profile = buildProfileFromAnswers(answers, questions);
  const signals = getSignalsFromAnswers(answers, questions);
  const answeredIds = new Set(answers.map((a) => a.question_id));
  const skippedIds = new Set<string>(
    (sessionMetadata as { skipped_question_ids?: string[] } | null)?.skipped_question_ids ?? []
  );
  const priorityResult = getNextPriorityQuestion(
    profile,
    answeredIds,
    signals,
    questions,
    skippedIds
  );

  if (priorityResult.is_complete) {
    return {
      ...baseState,
      next_question_id: null,
      next_question: null,
      next_question_reason: null,
      is_complete: true,
    };
  }

  if (priorityResult.next_question) {
    return {
      ...baseState,
      next_question_id: priorityResult.next_question_id,
      next_question: priorityResult.next_question,
      next_question_reason: priorityResult.reason
        ? {
            gap_fills: priorityResult.reason.gap_fills,
            signal_triggers: priorityResult.reason.signal_triggers,
            score_breakdown: priorityResult.reason.score_breakdown,
          }
        : null,
      is_complete: false,
    };
  }

  return baseState;
}

async function loadAndComputeFlow(sessionId: string): Promise<SalesDiagnosticBundle> {
  const [sessionResult, questionsResult, answersResult, objectionsResult] = await Promise.all([
    supabase
      .from('sales_sessions')
      .select(
        `id, questionnaire_id, questionnaire_version, status, metadata,
         score_total, score_pain, score_maturity, score_objection,
         score_urgency, score_fit, score_budget_readiness`,
      )
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single(),

    supabase
      .from('sales_questions')
      .select(
        `id, questionnaire_id, section_id, position, code, text, help,
         question_type, is_required, metadata,
         sales_question_sections(id, position, code, title),
         sales_answer_options(id, value, label, weight, position)`,
      )
      .eq('is_active', true)
      .order('position'),

    supabase
      .from('sales_session_answers')
      .select('question_id, answer_text, answer_number, answer_boolean, answer_option_ids, answer_json')
      .eq('session_id', sessionId),

    supabase
      .from('sales_session_objections')
      .select('objection_type, confidence, source_rule')
      .eq('session_id', sessionId),
  ]);

  if (sessionResult.error || !sessionResult.data) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  if (questionsResult.error) {
    throw new Error(`Failed to load questions: ${questionsResult.error.message}`);
  }
  if (answersResult.error) {
    throw new Error(`Failed to load answers: ${answersResult.error.message}`);
  }
  if (objectionsResult.error) {
    throw new Error(`Failed to load objections: ${objectionsResult.error.message}`);
  }

  const session = sessionResult.data;

  if (session.status === 'archived') {
    throw new Error(`Session is archived: ${sessionId}`);
  }

  const codeById = new Map<string, string>();

  const questions: LoadedQuestion[] = (questionsResult.data ?? [])
    .filter((q) => q.questionnaire_id === session.questionnaire_id)
    .map((q) => {
      const sectionRaw = Array.isArray(q.sales_question_sections)
        ? q.sales_question_sections[0]
        : q.sales_question_sections;

      const options: LoadedOption[] = ((q.sales_answer_options as LoadedOption[]) ?? [])
        .slice()
        .sort((a, b) => a.position - b.position);

      codeById.set(q.id, q.code);

      return {
        id: q.id,
        questionnaire_id: q.questionnaire_id,
        section_id: q.section_id,
        section: sectionRaw,
        position: q.position,
        code: q.code,
        text: q.text,
        help: q.help ?? null,
        question_type: q.question_type,
        is_required: q.is_required,
        metadata: q.metadata ?? null,
        options,
      } satisfies LoadedQuestion;
    })
    .sort((a, b) => {
      if (a.section.position !== b.section.position) return a.section.position - b.section.position;
      return a.position - b.position;
    });

  const answers: LoadedAnswer[] = (answersResult.data ?? []).map((a) => ({
    question_id: a.question_id,
    question_code: codeById.get(a.question_id) ?? '',
    answer_text: a.answer_text,
    answer_number: a.answer_number,
    answer_boolean: a.answer_boolean,
    answer_option_ids: a.answer_option_ids,
    answer_json: a.answer_json,
  }));

  const scores: ScoreState = {
    score_total: session.score_total ?? 0,
    score_pain: session.score_pain ?? 0,
    score_maturity: session.score_maturity ?? 0,
    score_objection: session.score_objection ?? 0,
    score_urgency: session.score_urgency ?? 0,
    score_fit: session.score_fit ?? 0,
    score_budget_readiness: session.score_budget_readiness ?? 0,
  };

  const objections: LoadedObjection[] = (objectionsResult.data ?? []).map((o) => ({
    objection_type: o.objection_type,
    confidence: o.confidence,
    source_rule: o.source_rule,
  }));

  const engineInput: FlowEngineInput = { questions, answers, scores, objections };
  const baseState = computeFlowState(engineInput);
  const flowState = mergePriorityIntoFlowState(baseState, questions, answers, session.metadata);

  return { flowState, questions, answers };
}

/** Used by SalesSessionService.getNextStep — flow only. */
export async function loadFlowState(sessionId: string): Promise<FlowState> {
  const { flowState } = await loadAndComputeFlow(sessionId);
  return flowState;
}

/** Used by Commercial Copilot for InterpretationEngine (questions + answers + flow). */
export async function loadSalesDiagnosticBundle(sessionId: string): Promise<SalesDiagnosticBundle> {
  return loadAndComputeFlow(sessionId);
}
