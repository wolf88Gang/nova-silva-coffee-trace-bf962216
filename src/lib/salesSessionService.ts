import { supabase } from '@/integrations/supabase/client';

export type SalesQuestionType = 'single_select' | 'multi_select' | 'boolean' | 'number' | 'text' | 'textarea';
export type SalesQuestionAnswer = string | number | boolean | string[] | null;

export interface SalesCreateSessionInput {
  organization_id: string;
  lead_name?: string | null;
  lead_company?: string | null;
  lead_type?: string | null;
  questionnaire_code: string;
  questionnaire_version: number;
}

export interface SalesSessionRecord {
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

export interface SalesSessionOutcome {
  id: string;
  outcome: string;
  deal_value: number | null;
  close_date: string | null;
  reason_lost: string | null;
}

export interface SalesSessionObjection {
  id: string;
  objection_type: string;
  confidence: number | null;
  detail: string | null;
}

export interface SalesSessionRecommendation {
  id: string;
  recommendation_type: string;
  priority: number | null;
  detail: string | null;
}

export interface SalesQuestionOption {
  value: string;
  label: string;
}

export interface SalesQuestion {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  questionType: SalesQuestionType;
  required: boolean;
  options: SalesQuestionOption[];
  minValue: number | null;
  maxValue: number | null;
  placeholder: string | null;
  raw: unknown;
}

export interface SalesNextStepResult {
  sessionId: string;
  isComplete: boolean;
  question: SalesQuestion | null;
  raw: unknown;
}

export interface SalesSessionSummary {
  session: SalesSessionRecord | null;
  objections: SalesSessionObjection[];
  recommendations: SalesSessionRecommendation[];
  outcome: SalesSessionOutcome | null;
  raw: unknown;
}

interface SaveAnswerInput {
  sessionId: string;
  questionId: string;
  answerValue: SalesQuestionAnswer;
}

interface SaveOutcomeInput {
  sessionId: string;
  outcome: string;
  dealValue?: number | null;
  closeDate?: string | null;
  reasonLost?: string | null;
}

interface RpcAttemptResult<T> {
  name: string | null;
  data: T | null;
}

function isMissingRoutineError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  return error?.code === 'PGRST202' || message.includes('function') || message.includes('does not exist');
}

function isMissingRelationError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('does not exist');
}

async function rpcFirstAvailable<T>(names: string[], params?: Record<string, unknown>, allowMissingAll = false): Promise<RpcAttemptResult<T>> {
  let lastMissingError: any = null;

  for (const name of names) {
    const { data, error } = await (supabase as any).rpc(name, params ?? {});
    if (!error) {
      return { name, data: (data ?? null) as T | null };
    }
    if (isMissingRoutineError(error)) {
      lastMissingError = error;
      continue;
    }
    throw error;
  }

  if (allowMissingAll) {
    return { name: null, data: null };
  }

  throw lastMissingError ?? new Error(`No se encontró ninguna función RPC válida: ${names.join(', ')}`);
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOption(option: any): SalesQuestionOption | null {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }

  const value = option?.value ?? option?.id ?? option?.code ?? option?.key ?? null;
  const label = option?.label ?? option?.title ?? option?.text ?? option?.name ?? value;

  if (!value || !label) return null;

  return {
    value: String(value),
    label: String(label),
  };
}

function normalizeQuestion(raw: any): SalesQuestion | null {
  if (!raw) return null;

  const questionType = raw.question_type ?? raw.type ?? raw.input_type ?? raw.response_type ?? null;
  if (!questionType) return null;

  const optionsSource = raw.options ?? raw.choices ?? raw.question_options ?? raw.answers ?? [];
  const options = Array.isArray(optionsSource)
    ? optionsSource.map(normalizeOption).filter(Boolean) as SalesQuestionOption[]
    : [];

  const title = raw.title ?? raw.label ?? raw.question_text ?? raw.prompt ?? raw.name ?? 'Pregunta';

  return {
    id: String(raw.id ?? raw.question_id ?? raw.code ?? raw.slug ?? title),
    code: raw.code ? String(raw.code) : null,
    title: String(title),
    description: raw.description ?? raw.help_text ?? raw.subtitle ?? null,
    questionType: String(questionType) as SalesQuestionType,
    required: Boolean(raw.required ?? raw.is_required ?? true),
    options,
    minValue: toNullableNumber(raw.min_value ?? raw.min ?? raw.minimum),
    maxValue: toNullableNumber(raw.max_value ?? raw.max ?? raw.maximum),
    placeholder: raw.placeholder ?? null,
    raw,
  };
}

function extractQuestionCandidate(data: any): any {
  if (!data) return null;
  return data.current_question
    ?? data.question
    ?? data.next_question
    ?? data.step?.question
    ?? data.current_step?.question
    ?? data.data?.question
    ?? (Array.isArray(data.questions) ? data.questions[0] : null);
}

function normalizeSession(raw: any): SalesSessionRecord | null {
  if (!raw) return null;

  const id = raw.id ?? raw.session_id ?? null;
  if (!id) return null;

  return {
    id: String(id),
    organization_id: raw.organization_id ?? null,
    lead_name: raw.lead_name ?? null,
    lead_company: raw.lead_company ?? null,
    lead_type: raw.lead_type ?? null,
    commercial_stage: raw.commercial_stage ?? null,
    status: raw.status ?? null,
    score_total: toNullableNumber(raw.score_total),
    score_pain: toNullableNumber(raw.score_pain),
    score_maturity: toNullableNumber(raw.score_maturity),
    score_objection: toNullableNumber(raw.score_objection),
    score_urgency: toNullableNumber(raw.score_urgency),
    score_fit: toNullableNumber(raw.score_fit),
    score_budget_readiness: toNullableNumber(raw.score_budget_readiness),
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? null,
  };
}

function normalizeOutcome(raw: any): SalesSessionOutcome | null {
  if (!raw) return null;
  const id = raw.id ?? raw.outcome_id ?? null;
  if (!id && !raw.outcome) return null;

  return {
    id: String(id ?? raw.outcome),
    outcome: String(raw.outcome ?? ''),
    deal_value: toNullableNumber(raw.deal_value),
    close_date: raw.close_date ?? null,
    reason_lost: raw.reason_lost ?? null,
  };
}

function normalizeObjection(raw: any): SalesSessionObjection | null {
  if (!raw?.id) return null;
  return {
    id: String(raw.id),
    objection_type: String(raw.objection_type ?? raw.type ?? 'objection'),
    confidence: toNullableNumber(raw.confidence),
    detail: raw.detail ?? null,
  };
}

function normalizeRecommendation(raw: any): SalesSessionRecommendation | null {
  if (!raw?.id) return null;
  return {
    id: String(raw.id),
    recommendation_type: String(raw.recommendation_type ?? raw.type ?? 'recommendation'),
    priority: toNullableNumber(raw.priority),
    detail: raw.detail ?? null,
  };
}

function normalizeSummaryPayload(payload: any): SalesSessionSummary {
  const root = Array.isArray(payload) ? payload[0] : payload;
  const session = normalizeSession(root?.session ?? root?.sales_session ?? root);
  const outcome = normalizeOutcome(root?.outcome ?? root?.sales_session_outcome ?? null);
  const objectionsSource = root?.objections ?? root?.sales_session_objections ?? [];
  const recommendationsSource = root?.recommendations ?? root?.sales_session_recommendations ?? [];

  return {
    session,
    outcome,
    objections: Array.isArray(objectionsSource)
      ? objectionsSource.map(normalizeObjection).filter(Boolean) as SalesSessionObjection[]
      : [],
    recommendations: Array.isArray(recommendationsSource)
      ? recommendationsSource.map(normalizeRecommendation).filter(Boolean) as SalesSessionRecommendation[]
      : [],
    raw: payload,
  };
}

function getSessionIdFromCreateResponse(data: any): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return String(data);
  return data.session_id ?? data.id ?? data.session?.id ?? data.data?.session_id ?? null;
}

function isCompleteStep(data: any, question: SalesQuestion | null): boolean {
  if (!data) return false;
  return Boolean(
    data.is_complete
      ?? data.completed
      ?? data.finalized
      ?? data.done
      ?? data.status === 'completed'
      ?? data.status === 'finalized'
      ?? (question === null && (data.next_step === null || data.remaining_questions === 0))
  );
}

export function getInitialAnswerForQuestion(question: SalesQuestion | null): SalesQuestionAnswer {
  if (!question) return null;
  if (question.questionType === 'multi_select') return [];
  if (question.questionType === 'boolean') return null;
  return null;
}

async function getAuthDebugSnapshot() {
  const { data: authData, error } = await supabase.auth.getSession();
  if (error) throw error;
  return authData.session ?? null;
}

export const SalesSessionService = {
  async createSession(input: SalesCreateSessionInput): Promise<{ sessionId: string; raw: unknown }> {
    const authSession = await getAuthDebugSnapshot();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://qbwmsarqewxjuwgkdfmg.supabase.co';

    console.debug('[Sales DEBUG] VITE_SUPABASE_URL', supabaseUrl);
    console.debug('[Sales DEBUG] session_user_id', authSession?.user?.id ?? null);
    console.debug('[Sales DEBUG] supabase_auth_session', authSession);

    try {
      const debugAuth = await rpcFirstAvailable<unknown>(['fn_debug_sales_auth'], {}, true);
      console.debug('[Sales DEBUG] fn_debug_sales_auth', debugAuth.data);
    } catch (error) {
      console.debug('[Sales DEBUG] fn_debug_sales_auth', error);
    }

    const payload = {
      organization_id: input.organization_id,
      lead_name: input.lead_name ?? null,
      lead_company: input.lead_company ?? null,
      lead_type: input.lead_type ?? null,
      questionnaire_code: input.questionnaire_code,
      questionnaire_version: input.questionnaire_version,
    };

    console.debug('[Sales DEBUG] fn_sales_create_session_payload', payload);

    try {
      const result = await rpcFirstAvailable<any>(['fn_sales_create_session'], payload);
      console.debug('[Sales DEBUG] fn_sales_create_session result/error', { data: result.data, error: null });

      const sessionId = getSessionIdFromCreateResponse(result.data);
      if (!sessionId) {
        throw new Error('fn_sales_create_session no devolvió session_id');
      }

      return {
        sessionId: String(sessionId),
        raw: result.data,
      };
    } catch (error) {
      console.debug('[Sales DEBUG] fn_sales_create_session result/error', { data: null, error });
      throw error;
    }
  },

  async getNextStep(sessionId: string): Promise<SalesNextStepResult> {
    const result = await rpcFirstAvailable<any>([
      'fn_sales_get_next_step',
      'fn_sales_next_step',
      'fn_sales_get_next_question',
    ], {
      session_id: sessionId,
    });

    const question = normalizeQuestion(extractQuestionCandidate(result.data));

    return {
      sessionId,
      question,
      isComplete: isCompleteStep(result.data, question),
      raw: result.data,
    };
  },

  async saveAnswer(input: SaveAnswerInput): Promise<unknown> {
    const result = await rpcFirstAvailable<any>([
      'fn_sales_save_answer',
      'fn_sales_submit_answer',
    ], {
      session_id: input.sessionId,
      question_id: input.questionId,
      answer_value: input.answerValue,
    });

    return result.data;
  },

  async recalculateScores(sessionId: string): Promise<unknown> {
    const result = await rpcFirstAvailable<any>(['fn_sales_recalculate_scores'], {
      session_id: sessionId,
    }, true);

    return result.data;
  },

  async finalizeSession(sessionId: string): Promise<unknown> {
    const result = await rpcFirstAvailable<any>([
      'fn_sales_finalize_session',
      'fn_sales_complete_session',
    ], {
      session_id: sessionId,
    });

    return result.data;
  },

  async getSessionSummary(sessionId: string): Promise<SalesSessionSummary> {
    try {
      const result = await rpcFirstAvailable<any>([
        'fn_sales_get_session_summary',
        'fn_sales_session_summary',
      ], {
        session_id: sessionId,
      }, true);

      if (result.data) {
        return normalizeSummaryPayload(result.data);
      }
    } catch (error) {
      if (!isMissingRoutineError(error)) {
        console.warn('[Sales DEBUG] getSessionSummary RPC fallback', error);
      }
    }

    const [sessionRes, outcomeRes, objectionsRes, recommendationsRes] = await Promise.all([
      supabase
        .from('sales_sessions' as any)
        .select('id, organization_id, lead_name, lead_company, lead_type, commercial_stage, status, score_total, score_pain, score_maturity, score_objection, score_urgency, score_fit, score_budget_readiness, created_at, updated_at')
        .eq('id', sessionId)
        .maybeSingle(),
      supabase
        .from('sales_session_outcomes' as any)
        .select('id, outcome, deal_value, close_date, reason_lost')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('sales_session_objections' as any)
        .select('id, objection_type, confidence, detail')
        .eq('session_id', sessionId)
        .order('confidence', { ascending: false }),
      supabase
        .from('sales_session_recommendations' as any)
        .select('id, recommendation_type, priority, detail')
        .eq('session_id', sessionId)
        .order('priority', { ascending: true }),
    ]);

    if (sessionRes.error) {
      if (isMissingRelationError(sessionRes.error)) {
        return { session: null, outcome: null, objections: [], recommendations: [], raw: null };
      }
      throw sessionRes.error;
    }

    return {
      session: normalizeSession(sessionRes.data),
      outcome: normalizeOutcome(outcomeRes.data?.[0] ?? null),
      objections: ((objectionsRes.data ?? []).map(normalizeObjection).filter(Boolean) as SalesSessionObjection[]),
      recommendations: ((recommendationsRes.data ?? []).map(normalizeRecommendation).filter(Boolean) as SalesSessionRecommendation[]),
      raw: {
        session: sessionRes.data,
        outcome: outcomeRes.data,
        objections: objectionsRes.data,
        recommendations: recommendationsRes.data,
      },
    };
  },

  async saveOutcome(input: SaveOutcomeInput): Promise<void> {
    const payload: Record<string, unknown> = {
      session_id: input.sessionId,
      outcome: input.outcome,
      deal_value: input.outcome === 'won' ? input.dealValue ?? null : null,
      close_date: input.outcome === 'won' ? input.closeDate ?? null : null,
      reason_lost: input.outcome === 'lost' ? input.reasonLost?.trim() || null : null,
    };

    const { data: existingRows, error: existingError } = await supabase
      .from('sales_session_outcomes' as any)
      .select('id')
      .eq('session_id', input.sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError && !isMissingRelationError(existingError)) {
      throw existingError;
    }

    const existingId = existingRows?.[0]?.id ?? null;

    if (existingId) {
      const { error } = await supabase
        .from('sales_session_outcomes' as any)
        .update(payload as any)
        .eq('id', existingId);
      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from('sales_session_outcomes' as any)
      .insert(payload as any);

    if (error) throw error;
  },
};
