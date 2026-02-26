/**
 * Central terminology dictionary for Nova Silva.
 * All UI text that depends on organization type must come from here.
 * "Cooperativa" is ONE type of organization, not the default mental model.
 *
 * This file consolidates and replaces ad-hoc label logic scattered across components.
 * Components should import from here, not re-invent labels.
 */

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
  switch (orgTipo) {
    case 'cooperativa':
      return {
        plural: 'Socios',
        singular: 'Socio',
        articleSingular: 'un socio',
        emptyStateTitle: 'Sin socios registrados',
        emptyStateBody: 'Agrega tu primer socio para comenzar a gestionar entregas, créditos y trazabilidad.',
      };
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
    case 'productor':
    case 'productor_empresarial':
      return {
        plural: 'Unidades Productivas',
        singular: 'Unidad Productiva',
        articleSingular: 'una unidad productiva',
        emptyStateTitle: 'Sin unidades productivas',
        emptyStateBody: 'Registra tus fincas o unidades productivas para gestionar parcelas e inventario.',
      };
    case 'certificadora':
      return {
        plural: 'Unidades Auditadas',
        singular: 'Unidad Auditada',
        articleSingular: 'una unidad auditada',
        emptyStateTitle: 'Sin unidades auditadas',
        emptyStateBody: 'No hay productores o unidades bajo auditoría activa.',
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
  switch (orgTipo) {
    case 'cooperativa': return 'Cooperativa';
    case 'exportador': return 'Exportador';
    case 'beneficio_privado': return 'Beneficio Privado';
    case 'productor':
    case 'productor_empresarial': return 'Productor Empresarial';
    case 'aggregator': return 'Agregador';
    case 'certificadora': return 'Certificadora';
    case 'tecnico': return 'Técnico';
    case 'admin': return 'Administrador';
    default: return 'Organización';
  }
}

/** Subtitle for the org type — used in headers and onboarding */
export function getOrgSubtitle(orgTipo: OrgTipo | null | undefined): string {
  switch (orgTipo) {
    case 'cooperativa': return 'Gestión cooperativa de productores de café';
    case 'exportador': return 'Operaciones de exportación y comercio de café';
    case 'beneficio_privado': return 'Procesamiento y comercialización privada de café';
    case 'productor':
    case 'productor_empresarial': return 'Gestión de fincas y producción directa';
    case 'aggregator': return 'Consolidación y distribución de café';
    case 'certificadora': return 'Auditoría y certificación de cadena de suministro';
    default: return 'Plataforma de gestión para organizaciones de café';
  }
}

// ── Microcopy tooltips ──

export const TOOLTIPS = {
  actores: 'Personas o unidades productivas que aportan café o gestionas dentro de tu organización.',
  organizacion: 'Entidad operativa y comercial: cooperativa, beneficio privado, exportador o productor empresarial.',
  parcelas: 'Áreas de cultivo georreferenciadas asociadas a un actor de tu organización.',
  entregas: 'Registros de café recibido en centros de acopio o puntos de recepción.',
  vital: 'Diagnóstico integral de sostenibilidad del Protocolo VITAL.',
  eudr: 'Cumplimiento del Reglamento de Deforestación de la Unión Europea.',
} as const;
