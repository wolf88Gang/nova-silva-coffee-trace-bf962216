/**
 * useCopilotDiagnostic — PRIMARY sales diagnostic hook for Commercial Copilot.
 * BACKEND: SalesSessionService only (no supabase in UI).
 * ENGINE: loadSalesDiagnosticBundle → same priority merge as getNextStep.
 */

import { useState, useCallback } from 'react';
import { SalesSessionService } from '@/modules/sales/SalesSessionService';
import type { CreateSessionRequest } from '@/modules/sales/SalesSessionService';
import type { FlowState } from '@/modules/sales/FlowEngine.types';
import type { LoadedQuestion, LoadedAnswer } from '@/modules/sales/FlowEngine.types';
import type { SalesDiagnosticBundle } from '@/modules/sales/FlowEngineLoader';

export type CopilotSavePayload =
  | { answer_option_ids: string[] }
  | { answer_text: string }
  | { answer_number: number }
  | { answer_boolean: boolean };

const DEFAULT_QUESTIONNAIRE = { code: 'nova_sales_intel', version: 1 } as const;

export function useCopilotDiagnostic() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<SalesDiagnosticBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBundle = useCallback(async (sid: string) => {
    const b = await SalesSessionService.getDiagnosticBundle(sid);
    setBundle(b);
  }, []);

  const createSession = useCallback(
    async (
      req: Omit<CreateSessionRequest, 'questionnaire_code' | 'questionnaire_version'>
    ): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await SalesSessionService.createSession({
          ...req,
          questionnaire_code: DEFAULT_QUESTIONNAIRE.code,
          questionnaire_version: DEFAULT_QUESTIONNAIRE.version,
        });
        setSessionId(res.session_id);
        await refreshBundle(res.session_id);
        return res.session_id;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al crear sesión');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshBundle]
  );

  const saveAnswer = useCallback(
    async (questionId: string, payload: CopilotSavePayload) => {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        await SalesSessionService.saveAnswer({
          session_id: sessionId,
          question_id: questionId,
          ...payload,
        });
        await SalesSessionService.recalculateScores(sessionId);
        await refreshBundle(sessionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar respuesta');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, refreshBundle]
  );

  const skipQuestion = useCallback(
    async (questionId: string) => {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        await SalesSessionService.skipQuestion(sessionId, questionId);
        await refreshBundle(sessionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al omitir pregunta');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, refreshBundle]
  );

  const finalizeSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      await SalesSessionService.finalizeSession(sessionId);
      await refreshBundle(sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al finalizar');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, refreshBundle]);

  const reset = useCallback(() => {
    setSessionId(null);
    setBundle(null);
    setError(null);
  }, []);

  const flowState: FlowState | null = bundle?.flowState ?? null;
  const questions: LoadedQuestion[] = bundle?.questions ?? [];
  const answers: LoadedAnswer[] = bundle?.answers ?? [];

  return {
    sessionId,
    flowState,
    questions,
    answers,
    bundle,
    isLoading,
    error,
    createSession,
    saveAnswer,
    skipQuestion,
    finalizeSession,
    reset,
    refreshBundle,
  };
}
