import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

export interface WizardStepDef {
  id: string;
  label: string;
  questionCount: number;
}

interface WizardPersistence {
  storageKey: string;
  debounceMs?: number;
}

interface UseWizardStateOptions<R> {
  steps: WizardStepDef[];
  questionCodes: string[];
  persistence?: WizardPersistence;
  initialResponses?: Map<string, R>;
}

interface WizardValidation {
  currentStepComplete: boolean;
  allComplete: boolean;
  progress: number;
  respondedCount: number;
  totalCount: number;
  stepProgress: { stepId: string; answered: number; total: number; complete: boolean }[];
}

interface UseWizardStateReturn<R> {
  stepIndex: number;
  setStepIndex: (idx: number) => void;
  responses: Map<string, R>;
  setResponse: (code: string, value: R) => void;
  isStarted: boolean;
  start: () => void;
  isCompleted: boolean;
  complete: () => void;
  reviewFromResults: () => void;
  goNext: () => void;
  goPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastStep: boolean;
  validation: WizardValidation;
  currentStep: WizardStepDef;
  clearSaved: () => void;
}

export function useWizardState<R>(options: UseWizardStateOptions<R>): UseWizardStateReturn<R> {
  const { steps, questionCodes, persistence, initialResponses } = options;

  const loaded = useRef(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, R>>(() => {
    if (initialResponses) return new Map(initialResponses);
    if (persistence) {
      try {
        const saved = localStorage.getItem(persistence.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.responses) {
            return new Map(Object.entries(parsed.responses));
          }
        }
      } catch { /* ignore corrupt data */ }
    }
    return new Map();
  });

  useEffect(() => {
    if (persistence && loaded.current) {
      try {
        const saved = localStorage.getItem(persistence.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.stepIndex !== undefined) setStepIndex(parsed.stepIndex);
          if (parsed.isStarted) setIsStarted(true);
        }
      } catch { /* ignore */ }
    }
    loaded.current = true;
  }, [persistence]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!persistence) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const data = {
        responses: Object.fromEntries(responses),
        stepIndex,
        isStarted,
      };
      localStorage.setItem(persistence.storageKey, JSON.stringify(data));
    }, persistence.debounceMs ?? 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [responses, stepIndex, isStarted, persistence]);

  const setResponse = useCallback((code: string, value: R) => {
    setResponses(prev => {
      const next = new Map(prev);
      next.set(code, value);
      return next;
    });
  }, []);

  const currentStep = steps[stepIndex] ?? steps[0];

  const stepQuestionCodes = useMemo(() => {
    let offset = 0;
    const map = new Map<string, string[]>();
    for (const step of steps) {
      map.set(step.id, questionCodes.slice(offset, offset + step.questionCount));
      offset += step.questionCount;
    }
    return map;
  }, [steps, questionCodes]);

  const validation: WizardValidation = useMemo(() => {
    const respondedCount = responses.size;
    const totalCount = questionCodes.length;
    const progress = totalCount > 0 ? Math.round((respondedCount / totalCount) * 100) : 0;

    const stepProgress = steps.map(step => {
      const codes = stepQuestionCodes.get(step.id) ?? [];
      const answered = codes.filter(c => responses.has(c)).length;
      return { stepId: step.id, answered, total: codes.length, complete: answered === codes.length };
    });

    const currentCodes = stepQuestionCodes.get(currentStep.id) ?? [];
    const currentStepComplete = currentCodes.every(c => responses.has(c));
    const allComplete = respondedCount >= totalCount;

    return { currentStepComplete, allComplete, progress, respondedCount, totalCount, stepProgress };
  }, [responses, questionCodes, steps, stepQuestionCodes, currentStep]);

  const isLastStep = stepIndex === steps.length - 1;
  const canGoNext = validation.currentStepComplete;
  const canGoPrev = stepIndex > 0;

  const goNext = useCallback(() => {
    if (isLastStep) {
      setIsCompleted(true);
    } else {
      setStepIndex(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isLastStep]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(i => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stepIndex]);

  const start = useCallback(() => setIsStarted(true), []);
  const complete = useCallback(() => setIsCompleted(true), []);

  const reviewFromResults = useCallback(() => {
    setIsCompleted(false);
    setStepIndex(0);
  }, []);

  const clearSaved = useCallback(() => {
    if (persistence) localStorage.removeItem(persistence.storageKey);
  }, [persistence]);

  return {
    stepIndex, setStepIndex,
    responses, setResponse,
    isStarted, start,
    isCompleted, complete, reviewFromResults,
    goNext, goPrev, canGoNext, canGoPrev, isLastStep,
    validation, currentStep, clearSaved,
  };
}
