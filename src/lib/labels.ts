/**
 * Centralized inclusive terminology for Nova Silva.
 * All visible role/actor labels MUST come from this file.
 * No component should hardcode role labels.
 *
 * Rules:
 * ✅ "Productoras y productores" (inclusive plural)
 * ✅ "Persona productora" (inclusive singular)
 * ✅ "Personal técnico" (collective neutral)
 * ✅ "Casa de Exportación" (neutral)
 * ❌ "Productores" (generic masculine)
 * ❌ "Los técnicos" (generic masculine)
 * ❌ "Productor/a" (slash notation)
 *
 * Routes, DB tables, columns, enums, filenames → NO change.
 */

// ── Role labels (visible in UI) ──

export const ROLE_LABELS = {
  // Singular
  productor: 'Persona productora',
  exportador: 'Casa de Exportación',
  tecnico: 'Persona técnica',
  cooperativa: 'Cooperativa',
  certificadora: 'Certificadora',
  admin: 'Administración',
  trabajador: 'Persona trabajadora',
  jornalero: 'Persona jornalera',

  // Plural
  productores: 'Productoras y productores',
  exportadores: 'Casas de Exportación',
  tecnicos: 'Personal técnico',
  trabajadores: 'Personal trabajador',
  jornaleros: 'Personal jornalero',
} as const;

// ── Actor labels by org type (inclusive) ──

export interface InclusiveActorLabels {
  singular: string;
  plural: string;
  emptyState: string;
}

export function getInclusiveActorLabels(orgTipo: string | null | undefined): InclusiveActorLabels {
  switch (orgTipo) {
    case 'cooperativa':
      return {
        singular: 'Persona socia',
        plural: 'Socias y socios',
        emptyState: 'No hay socias ni socios registrados',
      };
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator':
      return {
        singular: 'Proveedor',
        plural: 'Proveedores',
        emptyState: 'No hay proveedores registrados',
      };
    case 'productor':
    case 'productor_empresarial':
      return {
        singular: 'Unidad Productiva',
        plural: 'Unidades Productivas',
        emptyState: 'No hay unidades productivas registradas',
      };
    case 'certificadora':
      return {
        singular: 'Unidad Auditada',
        plural: 'Unidades Auditadas',
        emptyState: 'No hay unidades auditadas registradas',
      };
    default:
      return {
        singular: 'Actor',
        plural: 'Actores',
        emptyState: 'No hay actores registrados',
      };
  }
}

// ── Gendered empty states ──

export function getInclusiveEmptyActors(orgTipo: string | null | undefined): string {
  switch (orgTipo) {
    case 'cooperativa':
      return 'No hay productoras ni productores registrados. Agrega tu primera persona socia para comenzar.';
    default:
      return getInclusiveActorLabels(orgTipo).emptyState;
  }
}

// ── Chart / tooltip labels ──

export const CHART_LABELS = {
  productores: 'productoras y productores',
  parcelas: 'parcelas',
  entregas: 'entregas',
  lotes: 'lotes',
} as const;

// ── Gender demographic options ──

export const GENERO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decir' },
] as const;

// ── Personnel type options ──

export const TIPO_PERSONA_OPTIONS = [
  { value: 'area_tecnica', label: 'Área Técnica' },
  { value: 'experto_campo', label: 'Experta/o de campo' },
  { value: 'cuadrilla', label: 'Cuadrilla de trabajo' },
  { value: 'administrativo', label: 'Personal administrativo' },
  { value: 'comercial', label: 'Área comercial' },
] as const;
