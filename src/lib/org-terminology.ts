/**
 * Terminología dinámica según tipo de organización (org_tipo).
 * La UI se adapta al tipo de organización del tenant, no se hardcodea "cooperativa".
 *
 * Unificación de tipos de producción:
 * - cooperativa, productor, productor_empresarial → Todos son "Producción"
 * - exportador, beneficio_privado, aggregator → Exportación / Comercio
 * - certificadora → Certificación
 *
 * El valor en BD puede seguir siendo 'cooperativa' o 'productor';
 * esta capa lo normaliza como 'produccion' en la UI.
 */
export type OrgTipo = 'cooperativa' | 'exportador' | 'certificadora' | 'productor' | 'beneficio_privado' | 'productor_empresarial' | 'aggregator' | 'tecnico' | 'admin' | string;

/** Returns true if this orgTipo belongs to the unified "Producción" group */
export function isProduccionType(tipo: OrgTipo | null | undefined): boolean {
  return ['cooperativa', 'productor', 'productor_empresarial'].includes(tipo ?? '');
}

// ── Plural labels ──

/** Label for the collection of actors (plural): Productoras y productores / Proveedores / Fincas */
export function getActorsLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Actores';
  if (isProduccionType(tipo)) return 'Productoras y productores';
  switch (tipo) {
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'Proveedores';
    default: return 'Actores';
  }
}

/** Label for a single actor: Persona productora / Proveedor */
export function getActorLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Actor';
  if (isProduccionType(tipo)) return 'Persona productora';
  switch (tipo) {
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'Proveedor';
    default: return 'Actor';
  }
}

/** "Nueva persona productora" / "Nuevo Proveedor" */
export function getNewActorLabel(tipo: OrgTipo | null | undefined): string {
  const singular = getActorLabel(tipo);
  if (['Finca', 'Persona productora'].includes(singular)) return `Nueva ${singular}`;
  return `Nuevo ${singular}`;
}

// ── Actor kind ──

export type ActorKind = 'socio' | 'proveedor' | 'unidad_propia' | 'auditado';

export function getActorKind(tipo: OrgTipo | null | undefined): ActorKind {
  if (!tipo) return 'socio';
  if (isProduccionType(tipo)) return 'socio';
  switch (tipo) {
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'proveedor';
    case 'certificadora': return 'auditado';
    default: return 'socio';
  }
}

/** Empty state message for actors list */
export function getActorsEmptyState(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'No hay actores registrados';
  if (isProduccionType(tipo)) return 'No hay productoras ni productores registrados. Agrega tu primera persona socia para comenzar.';
  switch (tipo) {
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'No hay proveedores registrados. Agrega tu primer proveedor.';
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
  if (isProduccionType(tipo)) return 'Productoras y productores';
  switch (tipo) {
    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': return 'Red de Proveedores';
    default: return 'Actores';
  }
}

/** Organization type display label — unified under "Producción" */
export function getOrgTypeLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Organización';
  if (isProduccionType(tipo)) return 'Producción';
  switch (tipo) {
    case 'exportador': return 'Casa de Exportación';
    case 'beneficio_privado': return 'Beneficio Privado';
    case 'aggregator': return 'Agregador';
    case 'certificadora': return 'Certificadora';
    case 'tecnico': return 'Persona técnica';
    case 'admin': return 'Administración';
    default: return 'Organización';
  }
}
