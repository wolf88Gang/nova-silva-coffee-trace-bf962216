/**
 * Helpers para capa de resiliencia demo-aware.
 * Fallback solo cuando org es demo Y datos vacíos/error.
 */
import type { DemoOrganization } from '@/config/demoArchitecture';

/** Indica si la organización activa es demo (sesión demo-v2) */
export function isDemoOrganization(org: DemoOrganization | null | undefined): boolean {
  return !!org;
}

/** Comprueba si hay filas utilizables (array no vacío o objeto con datos) */
export function hasUsableRows<T>(data: T | null | undefined): boolean {
  if (data == null) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') return Object.keys(data).length > 0;
  return true;
}

/** Comprueba si un objeto tiene al menos una propiedad con valor no nulo */
export function hasUsableData(obj: Record<string, unknown> | null | undefined): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).some((v) => v != null && v !== '' && (Array.isArray(v) ? v.length > 0 : true));
}
