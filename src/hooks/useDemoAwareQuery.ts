/**
 * Hook genérico demo-aware.
 * Si query falla o devuelve vacío Y isDemo=true → usa fallbackData.
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export type DataSource = 'supabase' | 'demo-fallback';

export interface UseDemoAwareQueryOptions<TData, TError = Error> {
  queryKey: unknown[];
  queryFn: () => Promise<TData>;
  fallbackData: TData;
  enabled?: boolean;
  isDemo?: boolean;
  isEmptyCheck?: (data: TData) => boolean;
  staleTime?: number;
}

export interface UseDemoAwareQueryResult<TData> {
  data: TData;
  isFallback: boolean;
  source: DataSource;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const defaultEmptyCheck = <T>(data: T): boolean => {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') return Object.keys(data as object).length === 0;
  return false;
};

export function useDemoAwareQuery<TData>({
  queryKey,
  queryFn,
  fallbackData,
  enabled = true,
  isDemo = false,
  isEmptyCheck = defaultEmptyCheck,
  staleTime = 60 * 1000,
}: UseDemoAwareQueryOptions<TData>): UseDemoAwareQueryResult<TData> {
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await queryFn();
        const empty = isEmptyCheck(result);
        if (isDemo && empty) return fallbackData;
        return result;
      } catch (err) {
        if (isDemo) return fallbackData;
        throw err;
      }
    },
    enabled,
    staleTime,
    retry: isDemo ? 1 : 2,
  });

  const isFallback = isDemo && (!!query.error || isEmptyCheck((query.data ?? fallbackData) as TData));
  const data = (query.data ?? fallbackData) as TData;
  const source: DataSource = isFallback ? 'demo-fallback' : 'supabase';

  return {
    data,
    isFallback,
    source,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
