/**
 * Mocks demo de parcelas para navegación.
 */
export interface DemoParcela {
  id: string;
  name: string;
  productorName: string;
}

export const DEMO_PARCELAS: DemoParcela[] = [
  { id: 'parcela-1', name: 'Lote Norte', productorName: 'Juan Pérez' },
  { id: 'parcela-2', name: 'El Mirador', productorName: 'María García' },
  { id: 'parcela-3', name: 'La Esperanza', productorName: 'Pedro Técnico' },
];
