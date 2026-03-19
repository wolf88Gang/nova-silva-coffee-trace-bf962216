/**
 * Registry de datasets fallback por arquetipo.
 * resolveArchetypeDataset(org) devuelve el bundle correcto según orgType, operatingModel, modules.
 */
import type { DemoOrganization } from '@/config/demoArchitecture';
import { demoProduccion } from './demoProduccion';
import { demoNutricion } from './demoNutricion';
import { demoGuard } from './demoGuard';
import { demoYield } from './demoYield';
import { demoVital } from './demoVital';
import { demoCompliance } from './demoCompliance';
import { demoNovaCup } from './demoNovaCup';
import { demoJornales } from './demoJornales';
import { demoInventario } from './demoInventario';
import { demoExportaciones } from './demoExportaciones';

export type ArchetypeKey = 'cooperativa' | 'finca_empresarial' | 'exportador' | 'productor_privado' | 'certificadora';

export function resolveArchetypeDataset(org: DemoOrganization | null | undefined) {
  const archetype: ArchetypeKey = org?.orgType ?? 'cooperativa';
  return {
    produccion: demoProduccion(archetype),
    nutricion: demoNutricion(archetype),
    guard: demoGuard(archetype),
    yield: demoYield(archetype),
    vital: demoVital(archetype),
    compliance: demoCompliance(archetype),
    novacup: demoNovaCup(archetype),
    jornales: demoJornales(archetype),
    inventario: demoInventario(archetype),
    exportaciones: demoExportaciones(archetype),
  };
}
