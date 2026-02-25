/**
 * Terminología UI según tipo de organización.
 * Si organizations.tipo='cooperativa' → "socios"
 * Si no (hacienda, exportador, etc.) → "proveedores" o "productores"
 */
export type OrgTipo = 'cooperativa' | 'exportador' | 'certificadora' | 'productor' | 'hacienda' | 'finca_privada' | string;

export function getSociosLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Productores';
  if (tipo === 'cooperativa') return 'Socios';
  return 'Proveedores';
}

export function getProductoresLabel(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'Productores';
  if (tipo === 'cooperativa') return 'Socios';
  return 'Productores';
}

/** Singular para botones: "Nuevo socio", "Nuevo proveedor", "Nuevo productor" */
export function getSociosLabelSingular(tipo: OrgTipo | null | undefined): string {
  if (!tipo) return 'productor';
  if (tipo === 'cooperativa') return 'socio';
  return 'proveedor';
}
