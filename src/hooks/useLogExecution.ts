import { useCallback, useState } from 'react';
import { logNutritionExecution, type ExecutionInput, type ExecutionResult } from '@/lib/logNutritionExecution';

export function useLogExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const submit = useCallback(async (payload: ExecutionInput) => {
    setLoading(true);
    setError(null);
    try {
      const r = await logNutritionExecution(payload);
      setResult(r);
      return r;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { submit, loading, error, result, reset };
}
