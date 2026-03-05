/**
 * Terminología dinámica según tipo de organización (org_tipo).
 * La UI se adapta al tipo de organización del tenant, no se hardcodea "cooperativa".
 *
 * Mapping:
 * - cooperativa → Socios / Socio
 * - exportador → Proveedores / Proveedor
 * - beneficio_privado → Proveedores / Proveedor
 * - productor / productor_empresarial → Fincas / Finca (o Unidades / Unidad)
 * - aggregator → Proveedores / Proveedor
 * - default → Productores / Productor
 */
export type OrgTipo = 'cooperativa' | 'exportador' | 'certificadora' | 'productor' | 'beneficio_privado' | 'productor_empresarial' | 'aggregator' | 'tecnico' | 'admin' | string;

// ── Plural labels ──

/** Label for the collection of actors (plural): Socios / Proveedores / Fincas / Productores */
export function getActorsLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Actores';
  switch (tipo) {
    case 'cooperativa': return 'Productoras y productores';
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'Proveedores';
    case 'productor':
    case 'productor_empresarial': return 'Fincas';
    default: return 'Actores';
  }
}

/** Label for a single actor: Socio / Proveedor / Finca / Productor */
export function getActorLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Actor';
  switch (tipo) {
    case 'cooperativa': return 'Persona productora';
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'Proveedor';
    case 'productor':
    case 'productor_empresarial': return 'Finca';
    default: return 'Actor';
  }
}

/** "Nuevo Socio" / "Nuevo Proveedor" / "Nueva Finca" */
export function getNewActorLabel(tipo: OrgTipo | null | undefined): string {
  const singular = getActorLabel(tipo);
  // Spanish gender agreement
  if (['Finca', 'Persona productora'].includes(singular)) return `Nueva ${singular}`;
  return `Nuevo ${singular}`;
}

// ── Actor kind ──

export type ActorKind = 'socio' | 'proveedor' | 'unidad_propia' | 'auditado';

export function getActorKind(tipo: OrgTipo | null | undefined): ActorKind {
  if (!tipo) return 'socio';
  switch (tipo) {
    case 'cooperativa': return 'socio';
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'proveedor';
    case 'productor':
    case 'productor_empresarial': return 'unidad_propia';
    case 'certificadora': return 'auditado';
    default: return 'socio';
  }
}

/** Empty state message for actors list */
export function getActorsEmptyState(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'No hay actores registrados';
  switch (tipo) {
    case 'cooperativa': return 'No hay productoras ni productores registrados. Agrega tu primera persona socia para comenzar.';
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'No hay proveedores registrados. Agrega tu primer proveedor.';
    case 'productor':
    case 'productor_empresarial': return 'No tienes unidades productivas registradas.';
    case 'certificadora': return 'No hay unidades auditadas registradas.';
    default: return 'No hay actores registrados.';
  }
}

// ── Legacy aliases (backward compat) ──

/** @deprecated Use getActorsLabel instead */
export function getSociosLabel(tipo: OrgTipo | null | undefined): string {
  return getActorsLabel(tipo);
}

/** @deprecated Use getActorsLabel instead */
export function getProductoresLabel(tipo: OrgTipo | null | undefined): string {
  return getActorsLabel(tipo);
}

// ── Sidebar / Nav labels ──

/** Dynamic label for the actors hub nav item based on org type */
export function getActorsNavLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Actores';
  switch (tipo) {
    case 'cooperativa': return 'Productoras y productores';
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'Red de Proveedores';
    case 'productor':
    case 'productor_empresarial': return 'Mis Fincas';
    default: return 'Actores';
  }
}

/** Organization type display label */
export function getOrgTypeLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Organización';
  switch (tipo) {
    case 'cooperativa': return 'Cooperativa';
    case 'exportador': return 'Casa de Exportación';
    case 'beneficio_privado': return 'Beneficio Privado';
    case 'productor': return 'Persona productora';
    case 'productor_empresarial': return 'Productor Empresarial';
    case 'aggregator': return 'Agregador';
    case 'certificadora': return 'Certificadora';
    case 'tecnico': return 'Persona técnica';
    case 'admin': return 'Administración';
    default: return 'Organización';
  }
}
