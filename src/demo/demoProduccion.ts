import type { ArchetypeKey } from './demoOverviewRegistry';

export interface ProduccionOverview {
  organization_id: string;
  productores: number;
  parcelas: number;
}

export interface ProduccionActivity {
  mes: string;
  entregas: number;
  volumen_kg: number;
}

export interface TopVariedad {
  variedad: string;
  parcelas: number;
  area_ha: number;
}

export function demoProduccion(archetype: ArchetypeKey) {
  const base = { productores: 24, parcelas: 18 };
  if (archetype === 'exportador') return { ...base, productores: 0, parcelas: 0 };
  if (archetype === 'certificadora') return { ...base, productores: 0, parcelas: 0 };
  if (archetype === 'productor_privado') return { productores: 1, parcelas: 4 };
  return base;
}

export function demoProduccionOverview(archetype: ArchetypeKey): ProduccionOverview {
  const counts = demoProduccion(archetype);
  return {
    organization_id: 'demo',
    productores: counts.productores,
    parcelas: counts.parcelas,
  };
}

export function demoProduccionActivity(archetype: ArchetypeKey): ProduccionActivity[] {
  if (archetype === 'exportador' || archetype === 'certificadora') return [];
  return [
    { mes: 'Ene', entregas: 12, volumen_kg: 2400 },
    { mes: 'Feb', entregas: 8, volumen_kg: 1600 },
    { mes: 'Mar', entregas: 15, volumen_kg: 3200 },
    { mes: 'Abr', entregas: 22, volumen_kg: 4400 },
    { mes: 'May', entregas: 18, volumen_kg: 3600 },
  ];
}

export function demoTopVariedades(archetype: ArchetypeKey): TopVariedad[] {
  if (archetype === 'exportador' || archetype === 'certificadora') return [];
  return [
    { variedad: 'Caturra', parcelas: 8, area_ha: 12.5 },
    { variedad: 'Castillo', parcelas: 6, area_ha: 9.2 },
    { variedad: 'Colombia', parcelas: 4, area_ha: 6.1 },
  ];
}
