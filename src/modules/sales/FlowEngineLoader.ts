/**
 * FlowEngineLoader — Supabase data fetching layer for the flow engine.
 *
 * Handles all I/O. Shapes raw DB rows into FlowEngineInput.
 * Then calls the pure computeFlowState() engine.
 *
 * Callers (hooks, pages) only import loadFlowState().
 */

import { supabase } from '@/integrations/supabase/client';
import { computeFlowState } from './FlowEngine';
import type {
  FlowState,
  FlowEngineInput,
  LoadedQuestion,
  LoadedAnswer,
  LoadedObjection,
  LoadedOption,
  ScoreState,
} from './FlowEngine.types';

// ─── Main loader ──────────────────────────────────────────────────────────────

export async function loadFlowState(sessionId: string): Promise<FlowState> {
  // All queries run in parallel — no sequential round trips needed.
  const [sessionResult, questionsResult, answersResult, objectionsResult] = await Promise.all([
    supabase
      .from('sales_sessions')
      .select(
        `id, questionnaire_id, questionnaire_version, status,
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

  // ─── Error gates ────────────────────────────────────────────────────────────

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

  // ─── Shape questions ─────────────────────────────────────────────────────────
  // Filter to the correct questionnaire_id, then sort by section.position → question.position.

  const codeById = new Map<string, string>();

  const questions: LoadedQuestion[] = (questionsResult.data ?? [])
    .filter((q) => q.questionnaire_id === session.questionnaire_id)
    .map((q) => {
      // Supabase returns one-to-one joins as an object, not an array.
      // Normalise defensively.
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

  // ─── Shape answers ────────────────────────────────────────────────────────────

  const answers: LoadedAnswer[] = (answersResult.data ?? []).map((a) => ({
    question_id: a.question_id,
    question_code: codeById.get(a.question_id) ?? '',
    answer_text: a.answer_text,
    answer_number: a.answer_number,
    answer_boolean: a.answer_boolean,
    answer_option_ids: a.answer_option_ids,
    answer_json: a.answer_json,
  }));

  // ─── Shape scores ─────────────────────────────────────────────────────────────
  // Nulls are coerced to 0 — matches the DB DEFAULT 0 intent.

  const scores: ScoreState = {
    score_total: session.score_total ?? 0,
    score_pain: session.score_pain ?? 0,
    score_maturity: session.score_maturity ?? 0,
    score_objection: session.score_objection ?? 0,
    score_urgency: session.score_urgency ?? 0,
    score_fit: session.score_fit ?? 0,
    score_budget_readiness: session.score_budget_readiness ?? 0,
  };

  // ─── Shape objections ─────────────────────────────────────────────────────────

  const objections: LoadedObjection[] = (objectionsResult.data ?? []).map((o) => ({
    objection_type: o.objection_type,
    confidence: o.confidence,
    source_rule: o.source_rule,
  }));

  // ─── Run the pure engine ──────────────────────────────────────────────────────

  const engineInput: FlowEngineInput = { questions, answers, scores, objections };
  return computeFlowState(engineInput);
}
