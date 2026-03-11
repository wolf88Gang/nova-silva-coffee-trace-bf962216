/**
 * Central terminology dictionary for Nova Silva.
 * All UI text that depends on organization type must come from here.
 *
 * Unificación: cooperativa + productor + productor_empresarial = "Producción"
 * El valor en BD puede seguir siendo 'cooperativa'; esta capa lo normaliza.
 */

import { isProduccionType } from '@/lib/org-terminology';

export type OrgTipo =
  | 'cooperativa'
  | 'exportador'
  | 'productor_empresarial'
  | 'beneficio_privado'
  | 'certificadora'
  | 'aggregator'
  | 'productor'
  | 'tecnico'
  | 'admin'
  | string;

export interface ActorLabelSet {
  plural: string;
  singular: string;
  articleSingular: string;
  emptyStateTitle: string;
  emptyStateBody: string;
}

export function getActorLabels(orgTipo: OrgTipo | null | undefined): ActorLabelSet {
  if (isProduccionType(orgTipo)) {
    return {
      plural: 'Productoras y productores',
      singular: 'Persona productora',
      articleSingular: 'una persona productora',
      emptyStateTitle: 'Sin productoras ni productores',
      emptyStateBody: 'Agrega tu primera persona socia para comenzar a gestionar entregas, créditos y trazabilidad.',
    };
  }

  switch (orgTipo) {
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator':
      return {
        plural: 'Proveedores',
        singular: 'Proveedor',
        articleSingular: 'un proveedor',
        emptyStateTitle: 'Sin proveedores registrados',
        emptyStateBody: 'Agrega tu primer proveedor para gestionar compras, lotes y trazabilidad.',
      };
    case 'certificadora':
      return {
        plural: 'Unidades Auditadas',
        singular: 'Unidad Auditada',
        articleSingular: 'una unidad auditada',
        emptyStateTitle: 'Sin unidades auditadas',
        emptyStateBody: 'No hay unidades bajo auditoría activa.',
      };
    default:
      return {
        plural: 'Actores',
        singular: 'Actor',
        articleSingular: 'un actor',
        emptyStateTitle: 'Sin actores registrados',
        emptyStateBody: 'Agrega actores para comenzar.',
      };
  }
}

/** Display label for the organization type itself */
export function getOrgLabel(orgTipo: OrgTipo | null | undefined): string {
  if (isProduccionType(orgTipo)) return 'Producción';
  switch (orgTipo) {
    case 'exportador': return 'Casa de Exportación';
    case 'beneficio_privado': return 'Beneficio Privado';
    case 'aggregator': return 'Agregador';
    case 'certificadora': return 'Certificadora';
    case 'tecnico': return 'Persona técnica';
    case 'admin': return 'Administración';
    default: return 'Organización';
  }
}

/** Subtitle for the org type — used in headers and onboarding */
export function getOrgSubtitle(orgTipo: OrgTipo | null | undefined): string {
  if (isProduccionType(orgTipo)) return 'Gestión de producción y trazabilidad de café';
  switch (orgTipo) {
    case 'exportador': return 'Operaciones de exportación y comercio de café';
    case 'beneficio_privado': return 'Procesamiento y comercialización privada de café';
    case 'aggregator': return 'Consolidación y distribución de café';
    case 'certificadora': return 'Auditoría y certificación de cadena de suministro';
    default: return 'Plataforma de gestión para organizaciones de café';
  }
}

// ── Microcopy tooltips ──

export const TOOLTIPS = {
  actores: 'Personas o unidades productivas que aportan café o gestionas dentro de tu organización.',
  organizacion: 'Entidad operativa y comercial de producción, exportación o certificación de café.',
  parcelas: 'Áreas de cultivo georreferenciadas asociadas a un actor de tu organización.',
  entregas: 'Registros de café recibido en centros de acopio o puntos de recepción.',
  vital: 'Diagnóstico integral de sostenibilidad del Protocolo VITAL.',
  eudr: 'Cumplimiento del Reglamento de Deforestación de la Unión Europea.',
} as const;
