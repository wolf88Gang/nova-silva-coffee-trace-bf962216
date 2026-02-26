/**
 * Demo Seed Engine — provides org-type-aware demo datasets.
 *
 * This does NOT insert into the real database. Instead, it provides
 * coherent in-memory demo data filtered by orgTipo and activeModules.
 *
 * Why not real inserts?
 * - We don't control the external DB schema (tables may differ)
 * - RLS would block inserts without proper org membership
 * - The anon key doesn't have insert permissions on most tables
 * - demo-data.ts already powers all dashboards successfully
 *
 * Usage:
 *   const data = getDemoDataForOrg(orgTipo, activeModules);
 *   // data.productores, data.entregas, data.parcelas, etc.
 */

import type { OrgModule } from '@/lib/org-modules';
import { hasModule } from '@/lib/org-modules';
import type { OrgTipo } from '@/lib/org-terminology';
import {
  DEMO_PRODUCTORES,
  DEMO_ENTREGAS,
  DEMO_CREDITOS,
  DEMO_LOTES_ACOPIO,
  DEMO_LOTES_COMERCIALES,
  DEMO_ALERTAS,
  DEMO_VISITAS,
  type DemoProductor,
  type DemoEntrega,
  type DemoCredito,
  type DemoLoteAcopio,
  type DemoLoteComercial,
  type DemoAlerta,
  type DemoVisita,
} from '@/lib/demo-data';

// ── Per-orgTipo demo datasets ──

const EXPORTADOR_PROVEEDORES: DemoProductor[] = [
  { id: 'exp-1', nombre: 'Finca El Roble', cedula: 'EXP-001', comunidad: 'Antigua', parcelas: 4, hectareas: 12.0, estadoEUDR: 'compliant', puntajeVITAL: 82 },
  { id: 'exp-2', nombre: 'Beneficio Santa Clara', cedula: 'EXP-002', comunidad: 'Cobán', parcelas: 2, hectareas: 8.5, estadoEUDR: 'pending', puntajeVITAL: 71 },
];

const EXPORTADOR_ENTREGAS: DemoEntrega[] = [
  { id: 'exp-e1', productorNombre: 'Finca El Roble', fecha: '2026-02-12', pesoKg: 1200, tipoCafe: 'Pergamino SHB', precioUnitario: 3400, estadoPago: 'pagado' },
  { id: 'exp-e2', productorNombre: 'Beneficio Santa Clara', fecha: '2026-02-08', pesoKg: 800, tipoCafe: 'Arábica HB', precioUnitario: 3100, estadoPago: 'pendiente' },
];

const PRODUCTOR_EMPRESARIAL_UNIDADES: DemoProductor[] = [
  { id: 'pe-1', nombre: 'Finca Principal — Lote Norte', cedula: 'UP-001', comunidad: 'Huehuetenango', parcelas: 5, hectareas: 15.0, estadoEUDR: 'compliant', puntajeVITAL: 88 },
];

const PRODUCTOR_EMPRESARIAL_ENTREGAS: DemoEntrega[] = [
  { id: 'pe-e1', productorNombre: 'Finca Principal', fecha: '2026-02-14', pesoKg: 2300, tipoCafe: 'Pergamino', precioUnitario: 3200, estadoPago: 'pagado' },
  { id: 'pe-e2', productorNombre: 'Finca Principal', fecha: '2026-02-09', pesoKg: 1800, tipoCafe: 'Cereza', precioUnitario: 1800, estadoPago: 'pagado' },
  { id: 'pe-e3', productorNombre: 'Finca Principal', fecha: '2026-02-03', pesoKg: 900, tipoCafe: 'Pergamino', precioUnitario: 3150, estadoPago: 'pendiente' },
];

export interface DemoParcela {
  id: string;
  nombre: string;
  productorNombre: string;
  areaCultivo: number;
  variedad: string;
  altitud: number;
  estadoEUDR?: string;
}

const COOP_PARCELAS: DemoParcela[] = [
  { id: 'p1', nombre: 'Lote A — San Miguel', productorNombre: 'Juan Pérez López', areaCultivo: 2.0, variedad: 'Caturra', altitud: 1400 },
  { id: 'p2', nombre: 'Lote B — San Miguel', productorNombre: 'Juan Pérez López', areaCultivo: 1.5, variedad: 'Catuaí', altitud: 1350 },
  { id: 'p3', nombre: 'El Mirador', productorNombre: 'María Santos García', areaCultivo: 2.0, variedad: 'Bourbon', altitud: 1500 },
  { id: 'p4', nombre: 'La Esperanza', productorNombre: 'María Santos García', areaCultivo: 1.2, variedad: 'Typica', altitud: 1450 },
  { id: 'p5', nombre: 'Las Nubes', productorNombre: 'Pedro Ramírez Cruz', areaCultivo: 1.8, variedad: 'Caturra', altitud: 1300 },
  { id: 'p6', nombre: 'La Cumbre', productorNombre: 'Ana López Martínez', areaCultivo: 3.0, variedad: 'Geisha', altitud: 1600 },
];

const EXPORTADOR_PARCELAS: DemoParcela[] = [
  { id: 'ep1', nombre: 'Parcela Central', productorNombre: 'Finca El Roble', areaCultivo: 6.0, variedad: 'Bourbon', altitud: 1500, estadoEUDR: 'compliant' },
  { id: 'ep2', nombre: 'Lote Sur', productorNombre: 'Beneficio Santa Clara', areaCultivo: 4.0, variedad: 'Caturra', altitud: 1350, estadoEUDR: 'pending' },
];

const PE_PARCELAS: DemoParcela[] = [
  { id: 'pp1', nombre: 'Sector Norte', productorNombre: 'Finca Principal', areaCultivo: 5.0, variedad: 'Geisha', altitud: 1600 },
  { id: 'pp2', nombre: 'Sector Sur', productorNombre: 'Finca Principal', areaCultivo: 4.0, variedad: 'Bourbon', altitud: 1500 },
];

// ── Public API ──

export interface OrgDemoData {
  productores: DemoProductor[];
  parcelas: DemoParcela[];
  entregas: DemoEntrega[];
  creditos: DemoCredito[];
  lotesAcopio: DemoLoteAcopio[];
  lotesComerciales: DemoLoteComercial[];
  alertas: DemoAlerta[];
  visitas: DemoVisita[];
  isEmpty: boolean;
}

/**
 * Returns a coherent demo dataset filtered by org type and active modules.
 * This is the single source of demo data for all UI components.
 */
export function getDemoDataForOrg(
  orgTipo: OrgTipo | null | undefined,
  modules: OrgModule[]
): OrgDemoData {
  const base: OrgDemoData = {
    productores: [],
    parcelas: [],
    entregas: [],
    creditos: [],
    lotesAcopio: [],
    lotesComerciales: [],
    alertas: [],
    visitas: [],
    isEmpty: false,
  };

  switch (orgTipo) {
    case 'cooperativa': {
      base.productores = DEMO_PRODUCTORES;
      base.parcelas = COOP_PARCELAS;
      base.entregas = DEMO_ENTREGAS;
      base.lotesAcopio = DEMO_LOTES_ACOPIO;
      base.alertas = DEMO_ALERTAS;
      base.visitas = DEMO_VISITAS;
      if (hasModule(modules, 'creditos')) base.creditos = DEMO_CREDITOS;
      break;
    }

    case 'exportador':
    case 'beneficio_privado':
    case 'aggregator': {
      base.productores = EXPORTADOR_PROVEEDORES;
      base.parcelas = EXPORTADOR_PARCELAS;
      base.entregas = EXPORTADOR_ENTREGAS;
      base.lotesComerciales = DEMO_LOTES_COMERCIALES;
      base.alertas = DEMO_ALERTAS.filter(a => a.tipo === 'eudr');
      break;
    }

    case 'productor':
    case 'productor_empresarial': {
      base.productores = PRODUCTOR_EMPRESARIAL_UNIDADES;
      base.parcelas = PE_PARCELAS;
      base.entregas = PRODUCTOR_EMPRESARIAL_ENTREGAS;
      if (hasModule(modules, 'creditos')) base.creditos = DEMO_CREDITOS.slice(0, 1);
      break;
    }

    case 'certificadora': {
      // Certificadora sees audited units (read-only style)
      base.productores = DEMO_PRODUCTORES.slice(0, 3);
      base.parcelas = COOP_PARCELAS.slice(0, 3);
      break;
    }

    default: {
      base.productores = DEMO_PRODUCTORES.slice(0, 3);
      base.parcelas = COOP_PARCELAS.slice(0, 3);
      base.entregas = DEMO_ENTREGAS.slice(0, 2);
      break;
    }
  }

  base.isEmpty = base.productores.length === 0 && base.entregas.length === 0;
  return base;
}

/**
 * Validates that we're in a safe demo context.
 * Returns true if data operations are allowed.
 */
export function isDemoContext(orgName: string | null | undefined, userId: string | null | undefined): boolean {
  if (!userId) return false;
  // Demo users have IDs starting with "demo-"
  if (userId.startsWith('demo-')) return true;
  // Org name contains "Demo" 
  if (orgName && orgName.toLowerCase().includes('demo')) return true;
  return false;
}

/**
 * Get demo stats by org type (replaces the old per-role stat functions).
 */
export function getDemoStats(orgTipo: OrgTipo | null | undefined, modules: OrgModule[]) {
  const data = getDemoDataForOrg(orgTipo, modules);

  const totalActores = data.productores.length;
  const hectareas = data.productores.reduce((s, p) => s + p.hectareas, 0);
  const volumenKg = data.entregas.reduce((s, e) => s + e.pesoKg, 0);
  const parcelasTotal = data.parcelas.length;

  const eudrCompliance = totalActores > 0
    ? Math.round((data.productores.filter(p => p.estadoEUDR === 'compliant').length / totalActores) * 100)
    : 0;
  const promedioVITAL = totalActores > 0
    ? Math.round(data.productores.reduce((s, p) => s + p.puntajeVITAL, 0) / totalActores)
    : 0;
  const creditosActivos = data.creditos.filter(c => c.estado === 'activo').length;
  const saldoCreditos = data.creditos.filter(c => c.estado === 'activo').reduce((s, c) => s + c.saldo, 0);

  return {
    totalActores,
    hectareas,
    volumenKg,
    parcelasTotal,
    eudrCompliance,
    promedioVITAL,
    creditosActivos,
    saldoCreditos,
    alertasPendientes: data.alertas.length,
  };
}
