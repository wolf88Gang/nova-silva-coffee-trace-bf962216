/**
<<<<<<< Current (Your changes)
 * useSalesWizard — state and actions for the Sales Intelligence diagnostic flow.
 *
 * ACTIVE FLOW: createSession → loop (getNextStep → saveAnswer/skipQuestion) until is_complete → finalizeSession
 * LEGACY REMOVED: useAdaptiveDiagnostic
 * BACKEND CONTRACT: SalesSessionService (createSession, saveAnswer, skipQuestion, getNextStep, finalizeSession)
=======
 * useSalesWizard — LEGACY / FROZEN. Solo SalesWizardPage (/admin/sales/legacy-wizard).
 * No nuevas funciones. PRIMARY: useCopilotDiagnostic.
>>>>>>> Incoming (Background Agent changes)
 */

import { useState, useCallback } from 'react';
import { SalesSessionService } from '@/modules/sales/SalesSessionService';
import type {
  CreateSessionRequest,
  GetNextStepResponse,
  SaveAnswerRequest,
} from '@/modules/sales/SalesSessionService';

export interface UseSalesWizardState {
  sessionId: string | null;
  flowState: GetNextStepResponse | null;
  isLoading: boolean;
  error: string | null;
}

export type SaveAnswerPayload =
  | { answer_option_ids: string[] }
  | { answer_text: string }
  | { answer_number: number }
  | { answer_boolean: boolean };

export interface UseSalesWizardActions {
  createSession: (req: Omit<CreateSessionRequest, 'questionnaire_code' | 'questionnaire_version'>) => Promise<string | null>;
  saveAnswer: (questionId: string, payload: SaveAnswerPayload) => Promise<void>;
  skipQuestion: (questionId: string) => Promise<void>;
  loadNextStep: () => Promise<void>;
  finalizeAndComplete: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_QUESTIONNAIRE = { code: 'nova_sales_intel', version: 1 } as const;

export function useSalesWizard(): UseSalesWizardState & UseSalesWizardActions {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<GetNextStepResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNextStepForSession = useCallback(async (sid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await SalesSessionService.getNextStep(sid);
      setFlowState(state);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar siguiente paso');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadNextStep = useCallback(async () => {
    if (!sessionId) return;
    await loadNextStepForSession(sessionId);
  }, [sessionId, loadNextStepForSession]);

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
        await loadNextStepForSession(res.session_id);
        return res.session_id;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al crear sesión');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [loadNextStepForSession]
  );

  const saveAnswer = useCallback(
    async (questionId: string, payload: SaveAnswerPayload) => {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        await SalesSessionService.saveAnswer({
          session_id: sessionId,
          question_id: questionId,
          ...payload,
        });
        await loadNextStepForSession(sessionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar respuesta');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, loadNextStepForSession]
  );

  const skipQuestion = useCallback(
    async (questionId: string) => {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        await SalesSessionService.skipQuestion(sessionId, questionId);
        await loadNextStepForSession(sessionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al omitir pregunta');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, loadNextStepForSession]
  );

  const finalizeAndComplete = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      await SalesSessionService.finalizeSession(sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al finalizar sesión');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const reset = useCallback(() => {
    setSessionId(null);
    setFlowState(null);
    setError(null);
  }, []);

  return {
    sessionId,
    flowState,
    isLoading,
    error,
    createSession,
    saveAnswer,
    skipQuestion,
    loadNextStep,
    finalizeAndComplete,
    reset,
  };
}
