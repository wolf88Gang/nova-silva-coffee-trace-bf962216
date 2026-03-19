/**
 * Utilidades para evitar charts rotos.
 * Si data vacía y hay fallback → usar fallback.
 */

export function ensureSeries<T>(data: T[] | null | undefined, fallbackSeries: T[]): T[] {
  if (data && Array.isArray(data) && data.length > 0) return data;
  return fallbackSeries;
}

export function ensurePieData<T extends { value?: number; name?: string }>(
  data: T[] | null | undefined,
  fallbackData: T[]
): T[] {
  if (data && Array.isArray(data) && data.length > 0) return data;
  return fallbackData;
}

export function ensureTableRows<T>(data: T[] | null | undefined, fallbackRows: T[]): T[] {
  if (data && Array.isArray(data) && data.length > 0) return data;
  return fallbackRows;
}
