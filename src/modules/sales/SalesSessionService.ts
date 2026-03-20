/**
 * SalesSessionService — API layer between Admin Panel and Supabase.
 *
 * All RPC calls go through here. No raw supabase.rpc() calls in UI components.
 *
 * Auth requirement: caller must be admin (user_roles.role IN ('admin','superadmin')).
 * RPCs enforce this via _ensure_internal() which calls is_admin().
 *
 * Offline compatibility:
 *   - Read calls (getNextStep) use the local FlowEngineLoader which fetches
 *     current DB state and runs the engine client-side — works offline once
 *     data is cached.
 *   - Write calls (createSession, saveAnswer, finalize) require connectivity.
 *     Queue them with a pending-writes cache (not implemented here).
 */

import { supabase } from '@/integrations/supabase/client';
import { loadFlowState, loadSalesDiagnosticBundle, type SalesDiagnosticBundle } from './FlowEngineLoader';
import type { FlowState } from './FlowEngine.types';

// ─── Request / Response contracts ────────────────────────────────────────────

export interface CreateSessionRequest {
  organization_id: string;
  questionnaire_code: string;
  questionnaire_version: number;
  lead_name?: string;
  lead_company?: string;
  lead_type?: string;
  commercial_stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  owner_user_id?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSessionResponse {
  session_id: string;
}

export interface SaveAnswerRequest {
  session_id: string;
  question_id: string;
  answer_text?: string | null;
  answer_number?: number | null;
  answer_boolean?: boolean | null;
  answer_option_ids?: string[] | null;
  answer_json?: unknown | null;
}

// No response body — void RPC. Errors throw.

export interface GetNextStepResponse extends FlowState {
  // FlowState already includes everything the frontend needs:
  // next_question_id, next_question (with options), is_complete,
  // context (all scores), detected_objections, flags, deepening_active, progress
}

export interface FinalizeSessionResponse {
  session_id: string;
  status: 'completed';
}

export interface ObjectionSummaryRow {
  priority: number;
  objection_type: string;
  effective_confidence: number;
  rule_hits: number;
  has_behavioral_signal: boolean;
  evidence_trail: unknown[];
}

export interface RecommendationRow {
  id: string;
  recommendation_type: 'pitch' | 'demo' | 'plan' | 'next_step' | 'resource';
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  priority: number;
}

export type SalesOutcome = 'won' | 'lost' | 'no_decision';

export interface SessionOutcome {
  outcome: SalesOutcome;
  reason_lost: string | null;
  deal_value: number | null;
  close_date: string | null; // YYYY-MM-DD
}

export interface SessionSummaryResponse {
  session_id: string;
  status: string;
  commercial_stage: string;
  lead_name?: string | null;
  lead_company?: string | null;
  lead_type?: string | null;
  outcome: SessionOutcome | null;
  scores: {
    score_total: number;
    score_pain: number;
    score_maturity: number;
    score_objection: number;
    score_urgency: number;
    score_fit: number;
    score_budget_readiness: number;
  };
  objections: ObjectionSummaryRow[];
  recommendations: RecommendationRow[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SalesSessionService {
  /**
   * CREATE SESSION
   *
   * Call once at the start of a diagnostic.
   * Returns session_id used for all subsequent calls.
   *
   * Latency: 1 RPC round trip.
   */
  static async createSession(req: CreateSessionRequest): Promise<CreateSessionResponse> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!req.organization_id || typeof req.organization_id !== 'string' || !UUID_REGEX.test(req.organization_id)) {
      throw new Error('organization_id is required and must be a valid UUID from platform_organizations');
    }

    const payload = {
      p_organization_id:       req.organization_id,
      p_questionnaire_code:    req.questionnaire_code,
      p_questionnaire_version: req.questionnaire_version,
      p_lead_name:             req.lead_name             ?? null,
      p_lead_company:          req.lead_company          ?? null,
      p_lead_type:             req.lead_type             ?? null,
      p_commercial_stage:      req.commercial_stage      ?? 'lead',
      p_owner_user_id:         req.owner_user_id         ?? null,
      p_metadata:              req.metadata              ?? null,
    };
    const { data, error } = await supabase.rpc('fn_sales_create_session', payload);
    if (error) throw new Error(`createSession failed: ${error.message}`);
    if (!data) throw new Error('createSession returned no session_id');
    return { session_id: data as string };
  }

  /**
   * SKIP QUESTION
   *
   * Permanently skips a question for this session. Stored in session.metadata.skipped_question_ids.
   * Used by the signal-driven priority engine to avoid irrelevant questions.
   *
   * Latency: 2 round trips (fetch metadata, then update).
   */
  static async skipQuestion(sessionId: string, questionId: string): Promise<void> {
    const { data: session, error: fetchError } = await supabase
      .from('sales_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const meta = (session.metadata as { skipped_question_ids?: string[] } | null) ?? {};
    const skipped = new Set(meta.skipped_question_ids ?? []);
    skipped.add(questionId);

    const { error: updateError } = await supabase
      .from('sales_sessions')
      .update({
        metadata: { ...meta, skipped_question_ids: [...skipped] },
      })
      .eq('id', sessionId);

    if (updateError) throw new Error(`skipQuestion failed: ${updateError.message}`);
  }

  /**
   * SAVE ANSWER
   *
   * Call after the user answers a question.
   * The RPC upserts on (session_id, question_id) — safe to call multiple times.
   *
   * Latency: 1 RPC round trip.
   * After saving, call getNextStep() to get the updated flow state.
   */
  static async saveAnswer(req: SaveAnswerRequest): Promise<void> {
    const { error } = await supabase.rpc('fn_sales_save_answer', {
      p_session_id:       req.session_id,
      p_question_id:      req.question_id,
      p_answer_text:      req.answer_text       ?? null,
      p_answer_number:    req.answer_number      ?? null,
      p_answer_boolean:   req.answer_boolean     ?? null,
      p_answer_option_ids:req.answer_option_ids  ?? null,
      p_answer_json:      req.answer_json        ?? null,
    });

    if (error) throw new Error(`saveAnswer failed: ${error.message}`);
  }

  /**
   * GET NEXT STEP
   *
   * Returns the next question + full diagnostic context.
   * Runs the flow engine client-side using the current DB state.
   *
   * Call sequence after saveAnswer():
   *   1. saveAnswer()                    → persists the answer
   *   2. fn_sales_recalculate_scores()   → updates scores (optional: call explicitly or let finalize handle it)
   *   3. getNextStep()                   → loads state + runs flow engine
   *
   * For a smooth wizard UX without blocking on scores, call getNextStep()
   * immediately after saveAnswer() using the stale score state (scores update
   * on finalize anyway). Only recalculate mid-session if you need live flags.
   *
   * Latency: 4 parallel Supabase queries (no RPC).
   * Offline: works once data is cached locally.
   */
  static async getNextStep(sessionId: string): Promise<GetNextStepResponse> {
    return loadFlowState(sessionId);
  }

  /**
   * DIAGNOSTIC BUNDLE — flow + questions + answers for Commercial Copilot interpretation.
   * Same engine as getNextStep; no duplicate question-selection logic.
   */
  static async getDiagnosticBundle(sessionId: string): Promise<SalesDiagnosticBundle> {
    return loadSalesDiagnosticBundle(sessionId);
  }

  /**
   * RECALCULATE SCORES (mid-session)
   *
   * Optional: call after every N answers to get live score-driven deepening.
   * Finalize always recalculates, so this is only needed for live feedback.
   *
   * Latency: 1 RPC round trip.
   */
  static async recalculateScores(sessionId: string): Promise<void> {
    const { error } = await supabase.rpc('fn_sales_recalculate_scores', {
      p_session_id: sessionId,
    });
    if (error) throw new Error(`recalculateScores failed: ${error.message}`);
  }

  /**
   * FINALIZE SESSION
   *
   * Call when the questionnaire is complete (is_complete = true from getNextStep).
   * Runs the full pipeline server-side:
   *   recalculate_scores → detect_objections_v2 → generate_recommendations → snapshot
   *
   * Idempotent: calling on an already-completed session is a no-op (returns immediately).
   *
   * Latency: 1 RPC round trip (pipeline runs inside the DB).
   */
  static async finalizeSession(sessionId: string): Promise<FinalizeSessionResponse> {
    const { error } = await supabase.rpc('fn_sales_finalize_session', {
      p_session_id: sessionId,
    });

    if (error) throw new Error(`finalizeSession failed: ${error.message}`);

    return { session_id: sessionId, status: 'completed' };
  }

  /**
   * GET SESSION SUMMARY
   *
   * Fetches the full output of a completed session in one call.
   * Used by the results page / Admin Panel session detail view.
   *
   * Latency: 4 parallel Supabase queries.
   */
  static async getSessionSummary(sessionId: string): Promise<SessionSummaryResponse> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !UUID_REGEX.test(sessionId)) {
      throw new Error(`Invalid session_id format: ${sessionId}`);
    }
    const [sessionResult, objectionsResult, recommendationsResult, outcomeResult] = await Promise.all([
      supabase
        .from('sales_sessions')
        .select(
          `id, status, commercial_stage, lead_name, lead_company, lead_type,
           score_total, score_pain, score_maturity, score_objection,
           score_urgency, score_fit, score_budget_readiness`,
        )
        .eq('id', sessionId)
        .is('deleted_at', null)
        .single(),

      supabase.rpc('fn_sales_get_objection_summary', { p_session_id: sessionId }),

      supabase
        .from('sales_session_recommendations')
        .select('id, recommendation_type, title, description, payload, priority')
        .eq('session_id', sessionId)
        .order('priority'),

      supabase
        .from('sales_session_outcomes')
        .select('outcome, reason_lost, deal_value, close_date')
        .eq('session_id', sessionId)
        .maybeSingle(),
    ]);

    if (sessionResult.error || !sessionResult.data) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    if (objectionsResult.error) {
      throw new Error(`Failed to load objections: ${objectionsResult.error.message}`);
    }
    if (recommendationsResult.error) {
      throw new Error(`Failed to load recommendations: ${recommendationsResult.error.message}`);
    }

    const s = sessionResult.data;
    const o = outcomeResult.error ? null : (outcomeResult.data as { outcome: string; reason_lost: string | null; deal_value: number | null; close_date: string | null } | null);

    return {
      session_id: s.id,
      status:     s.status,
      commercial_stage: s.commercial_stage,
      lead_name:  s.lead_name ?? null,
      lead_company: s.lead_company ?? null,
      lead_type:  s.lead_type ?? null,
      outcome: o ? {
        outcome: o.outcome as SalesOutcome,
        reason_lost: o.reason_lost ?? null,
        deal_value: o.deal_value ?? null,
        close_date: o.close_date ?? null,
      } : null,
      scores: {
        score_total:            s.score_total            ?? 0,
        score_pain:             s.score_pain             ?? 0,
        score_maturity:         s.score_maturity         ?? 0,
        score_objection:        s.score_objection        ?? 0,
        score_urgency:          s.score_urgency         ?? 0,
        score_fit:              s.score_fit             ?? 0,
        score_budget_readiness: s.score_budget_readiness ?? 0,
      },
      objections:      (objectionsResult.data ?? []) as ObjectionSummaryRow[],
      recommendations: (recommendationsResult.data ?? []) as RecommendationRow[],
    };
  }

  /**
   * UPSERT OUTCOME
   *
   * Records or updates the commercial outcome for a session.
   * Admin only (RLS on sales_session_outcomes).
   */
  static async upsertOutcome(
    sessionId: string,
    payload: { outcome: SalesOutcome; reason_lost?: string | null; deal_value?: number | null; close_date?: string | null }
  ): Promise<void> {
    const { error } = await supabase.from('sales_session_outcomes').upsert(
      {
        session_id: sessionId,
        outcome: payload.outcome,
        reason_lost: payload.reason_lost ?? null,
        deal_value: payload.deal_value ?? null,
        close_date: payload.close_date || null,
      },
      { onConflict: 'session_id' }
    );
    if (error) throw new Error(`upsertOutcome failed: ${error.message}`);
  }
}
