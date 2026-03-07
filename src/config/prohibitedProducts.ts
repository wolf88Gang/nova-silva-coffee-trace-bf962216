/**
 * Lista de productos prohibidos para filtrar recomendaciones nutricionales y fitosanitarias.
 * Referencia al generar planes y sugerencias en Insights / Nova Guard.
 *
 * Completar con los códigos o nombres según la normativa de la organización.
 */
export const PROHIBITED_PRODUCTS: string[] = [
  // Ejemplo: 'GLIFOSATO', 'PARAQUAT', ...
  // Agregar aquí los productos prohibidos por normativa orgánica, EUDR, etc.
];

export function isProhibited(productNameOrCode: string): boolean {
  const normalized = productNameOrCode.toUpperCase().trim();
  return PROHIBITED_PRODUCTS.some((p) => normalized.includes(p.toUpperCase()));
}
