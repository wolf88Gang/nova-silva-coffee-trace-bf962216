import type { ArchetypeKey } from './demoOverviewRegistry';

export interface InventarioOverview {
  items: number;
  stock_bajo: number;
}

export function demoInventario(archetype: ArchetypeKey) {
  const hasInventario = ['cooperativa', 'finca_empresarial', 'productor_privado'].includes(archetype);
  return hasInventario ? { items: 12, stock_bajo: 2 } : { items: 0, stock_bajo: 0 };
}

export function demoInventarioOverview(archetype: ArchetypeKey): InventarioOverview {
  return demoInventario(archetype);
}
