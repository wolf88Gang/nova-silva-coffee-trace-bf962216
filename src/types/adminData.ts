/**
 * Resultado de servicios admin con indicador de fallback.
 * Usado para mostrar banner "modo degradado" cuando la fuente es mock.
 */

export type AdminDataResult<T> = { data: T; isFallback: boolean };

export function adminSuccess<T>(data: T): AdminDataResult<T> {
  return { data, isFallback: false };
}

export function adminFallback<T>(data: T): AdminDataResult<T> {
  return { data, isFallback: true };
}
