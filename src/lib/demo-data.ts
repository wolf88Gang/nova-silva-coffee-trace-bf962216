// Demo data for all roles — matches the external Supabase schema
// This module provides mock data for UI development until real DB queries are wired up.

export interface DemoProductor {
  id: string;
  nombre: string;
  cedula: string;
  comunidad: string;
  parcelas: number;
  hectareas: number;
  estadoEUDR: 'compliant' | 'pending' | 'non-compliant';
  puntajeVITAL: number;
  ultimaEntrega?: string;
}

export interface DemoLoteAcopio {
  id: string;
  codigo: string;
  fecha: string;
  pesoKg: number;
  pesoQQ: number;
  productores: number;
  tipoCafe: string;
  estado: 'en_proceso' | 'disponible' | 'vendido';
}

export interface DemoEntrega {
  id: string;
  productorNombre: string;
  fecha: string;
  pesoKg: number;
  tipoCafe: string;
  precioUnitario: number;
  estadoPago: 'pagado' | 'pendiente' | 'parcial';
}

export interface DemoCredito {
  id: string;
  productorNombre: string;
  monto: number;
  saldo: number;
  estado: 'activo' | 'pagado' | 'vencido';
  tipo: string;
  fechaVencimiento: string;
}

export interface DemoVisita {
  id: string;
  productorNombre: string;
  fecha: string;
  tipo: string;
  estado: 'programada' | 'completada' | 'cancelada';
  comunidad: string;
}

export interface DemoAlerta {
  id: string;
  tipo: string;
  titulo: string;
  fecha: string;
  nivel: 'verde' | 'ambar' | 'rojo';
}

// ───── COOPERATIVA ─────
export const DEMO_PRODUCTORES: DemoProductor[] = [
  { id: '1', nombre: 'Juan Pérez López', cedula: '1234-56789-0101', comunidad: 'San Miguel', parcelas: 3, hectareas: 4.5, estadoEUDR: 'compliant', puntajeVITAL: 78, ultimaEntrega: '2026-02-10' },
  { id: '2', nombre: 'María Santos García', cedula: '1234-56789-0102', comunidad: 'El Progreso', parcelas: 2, hectareas: 3.2, estadoEUDR: 'compliant', puntajeVITAL: 85, ultimaEntrega: '2026-02-08' },
  { id: '3', nombre: 'Pedro Ramírez Cruz', cedula: '1234-56789-0103', comunidad: 'Las Flores', parcelas: 1, hectareas: 1.8, estadoEUDR: 'pending', puntajeVITAL: 52, ultimaEntrega: '2026-01-28' },
  { id: '4', nombre: 'Ana López Martínez', cedula: '1234-56789-0104', comunidad: 'San Miguel', parcelas: 4, hectareas: 6.1, estadoEUDR: 'compliant', puntajeVITAL: 91, ultimaEntrega: '2026-02-12' },
  { id: '5', nombre: 'Carlos Hernández', cedula: '1234-56789-0105', comunidad: 'El Progreso', parcelas: 2, hectareas: 2.5, estadoEUDR: 'non-compliant', puntajeVITAL: 38, ultimaEntrega: '2026-01-15' },
  { id: '6', nombre: 'Rosa Méndez Jiménez', cedula: '1234-56789-0106', comunidad: 'Las Flores', parcelas: 3, hectareas: 5.0, estadoEUDR: 'compliant', puntajeVITAL: 72 },
  { id: '7', nombre: 'Luis Torres Paz', cedula: '1234-56789-0107', comunidad: 'San Miguel', parcelas: 2, hectareas: 3.8, estadoEUDR: 'pending', puntajeVITAL: 65 },
  { id: '8', nombre: 'Elena Castillo Ramos', cedula: '1234-56789-0108', comunidad: 'El Progreso', parcelas: 1, hectareas: 1.2, estadoEUDR: 'compliant', puntajeVITAL: 80, ultimaEntrega: '2026-02-05' },
];

export const DEMO_LOTES_ACOPIO: DemoLoteAcopio[] = [
  { id: '1', codigo: 'LOT-2026-001', fecha: '2026-02-15', pesoKg: 2300, pesoQQ: 50, productores: 4, tipoCafe: 'Pergamino', estado: 'disponible' },
  { id: '2', codigo: 'LOT-2026-002', fecha: '2026-02-10', pesoKg: 1840, pesoQQ: 40, productores: 3, tipoCafe: 'Cereza', estado: 'en_proceso' },
  { id: '3', codigo: 'LOT-2026-003', fecha: '2026-01-28', pesoKg: 4600, pesoQQ: 100, productores: 6, tipoCafe: 'Pergamino', estado: 'vendido' },
  { id: '4', codigo: 'LOT-2026-004', fecha: '2026-02-12', pesoKg: 920, pesoQQ: 20, productores: 2, tipoCafe: 'Oro', estado: 'disponible' },
];

export const DEMO_ENTREGAS: DemoEntrega[] = [
  { id: '1', productorNombre: 'Juan Pérez López', fecha: '2026-02-10', pesoKg: 460, tipoCafe: 'Pergamino', precioUnitario: 3200, estadoPago: 'pagado' },
  { id: '2', productorNombre: 'María Santos García', fecha: '2026-02-08', pesoKg: 690, tipoCafe: 'Cereza', precioUnitario: 1800, estadoPago: 'pagado' },
  { id: '3', productorNombre: 'Ana López Martínez', fecha: '2026-02-12', pesoKg: 920, tipoCafe: 'Pergamino', precioUnitario: 3200, estadoPago: 'pendiente' },
  { id: '4', productorNombre: 'Pedro Ramírez Cruz', fecha: '2026-01-28', pesoKg: 230, tipoCafe: 'Pergamino', precioUnitario: 3100, estadoPago: 'parcial' },
  { id: '5', productorNombre: 'Elena Castillo Ramos', fecha: '2026-02-05', pesoKg: 345, tipoCafe: 'Cereza', precioUnitario: 1750, estadoPago: 'pagado' },
];

export const DEMO_CREDITOS: DemoCredito[] = [
  { id: '1', productorNombre: 'Juan Pérez López', monto: 15000, saldo: 8500, estado: 'activo', tipo: 'Insumos', fechaVencimiento: '2026-06-30' },
  { id: '2', productorNombre: 'Pedro Ramírez Cruz', monto: 5000, saldo: 5000, estado: 'vencido', tipo: 'Emergencia', fechaVencimiento: '2026-01-15' },
  { id: '3', productorNombre: 'María Santos García', monto: 20000, saldo: 0, estado: 'pagado', tipo: 'Inversión', fechaVencimiento: '2025-12-31' },
  { id: '4', productorNombre: 'Ana López Martínez', monto: 10000, saldo: 6000, estado: 'activo', tipo: 'Insumos', fechaVencimiento: '2026-09-30' },
];

export const DEMO_ALERTAS: DemoAlerta[] = [
  { id: '1', tipo: 'fitosanitaria', titulo: 'Roya detectada en zona El Progreso', fecha: '2026-02-14', nivel: 'rojo' },
  { id: '2', tipo: 'vital', titulo: '3 productores con puntaje VITAL crítico', fecha: '2026-02-13', nivel: 'ambar' },
  { id: '3', tipo: 'credito', titulo: '1 crédito vencido sin arreglo', fecha: '2026-02-10', nivel: 'rojo' },
  { id: '4', tipo: 'eudr', titulo: '2 parcelas pendientes de verificación', fecha: '2026-02-09', nivel: 'ambar' },
];

// ───── TÉCNICO ─────
export const DEMO_VISITAS: DemoVisita[] = [
  { id: '1', productorNombre: 'Juan Pérez López', fecha: '2026-02-17', tipo: 'Evaluación VITAL', estado: 'programada', comunidad: 'San Miguel' },
  { id: '2', productorNombre: 'Pedro Ramírez Cruz', fecha: '2026-02-17', tipo: 'Diagnóstico fitosanitario', estado: 'programada', comunidad: 'Las Flores' },
  { id: '3', productorNombre: 'María Santos García', fecha: '2026-02-15', tipo: 'Seguimiento', estado: 'completada', comunidad: 'El Progreso' },
  { id: '4', productorNombre: 'Ana López Martínez', fecha: '2026-02-14', tipo: 'Evaluación VITAL', estado: 'completada', comunidad: 'San Miguel' },
  { id: '5', productorNombre: 'Carlos Hernández', fecha: '2026-02-18', tipo: 'Evaluación VITAL', estado: 'programada', comunidad: 'El Progreso' },
];

// ───── EXPORTADOR ─────
export interface DemoLoteComercial {
  id: string;
  codigoICO: string;
  origen: string;
  pesoSacos: number;
  tipoCafe: string;
  puntajeSCA: number;
  estadoEUDR: 'compliant' | 'pending' | 'non-compliant';
  estado: 'en_formacion' | 'listo' | 'en_transito' | 'entregado';
  contratoId?: string;
}

export const DEMO_LOTES_COMERCIALES: DemoLoteComercial[] = [
  { id: '1', codigoICO: 'ICO-GT-2026-001', origen: 'Cooperativa Café de la Selva', pesoSacos: 250, tipoCafe: 'Arábica SHB', puntajeSCA: 84, estadoEUDR: 'compliant', estado: 'listo', contratoId: 'C-001' },
  { id: '2', codigoICO: 'ICO-GT-2026-002', origen: 'Cooperativa Los Altos', pesoSacos: 180, tipoCafe: 'Arábica HB', puntajeSCA: 81, estadoEUDR: 'compliant', estado: 'en_transito', contratoId: 'C-002' },
  { id: '3', codigoICO: 'ICO-CR-2026-003', origen: 'Cooperativa Montaña Verde', pesoSacos: 320, tipoCafe: 'Arábica SHB EP', puntajeSCA: 87, estadoEUDR: 'pending', estado: 'en_formacion' },
];

// ───── Stats helpers ─────
export function getCooperativaStats() {
  const totalProductores = DEMO_PRODUCTORES.length;
  const hectareasTotales = DEMO_PRODUCTORES.reduce((sum, p) => sum + p.hectareas, 0);
  const volumenAcopiado = DEMO_LOTES_ACOPIO.reduce((sum, l) => sum + l.pesoQQ, 0);
  const lotesEnProceso = DEMO_LOTES_ACOPIO.filter(l => l.estado === 'en_proceso').length;
  const creditosActivos = DEMO_CREDITOS.filter(c => c.estado === 'activo').reduce((sum, c) => sum + c.saldo, 0);
  const eudrCompliance = Math.round((DEMO_PRODUCTORES.filter(p => p.estadoEUDR === 'compliant').length / totalProductores) * 100);
  const alertasPendientes = DEMO_ALERTAS.length;
  const promedioVITAL = Math.round(DEMO_PRODUCTORES.reduce((sum, p) => sum + p.puntajeVITAL, 0) / totalProductores);

  return { totalProductores, hectareasTotales, volumenAcopiado, lotesEnProceso, creditosActivos, eudrCompliance, alertasPendientes, promedioVITAL };
}

export function getTecnicoStats() {
  const productoresAsignados = DEMO_PRODUCTORES.length;
  const evaluacionesPendientes = DEMO_VISITAS.filter(v => v.estado === 'programada' && v.tipo.includes('VITAL')).length;
  const evaluacionesCompletadas = DEMO_VISITAS.filter(v => v.estado === 'completada').length;
  const visitasHoy = DEMO_VISITAS.filter(v => v.fecha === '2026-02-17' && v.estado === 'programada').length;
  const productoresBajoVITAL = DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 50).length;

  return { productoresAsignados, evaluacionesPendientes, evaluacionesCompletadas, visitasHoy, productoresBajoVITAL };
}

export function getExportadorStats() {
  const volumenTotal = DEMO_LOTES_COMERCIALES.reduce((s, l) => s + l.pesoSacos, 0);
  const contratosActivos = 2;
  const embarquesEnTransito = DEMO_LOTES_COMERCIALES.filter(l => l.estado === 'en_transito').length;
  const eudrCompliance = Math.round((DEMO_LOTES_COMERCIALES.filter(l => l.estadoEUDR === 'compliant').length / DEMO_LOTES_COMERCIALES.length) * 100);
  const proveedoresActivos = 3;
  return { volumenTotal, contratosActivos, embarquesEnTransito, eudrCompliance, proveedoresActivos };
}

export function getProductorStats() {
  return {
    parcelas: 3,
    hectareas: 4.5,
    ultimaEntrega: '2026-02-10',
    creditosActivos: 1,
    saldoCreditos: 8500,
    puntajeVITAL: 78,
    avisosNoLeidos: 2,
  };
}

// ───── NUTRICIÓN KPIs (§3.8 Fase 3) ─────
export function getNutricionStats() {
  return {
    parcelasConPlan: 6,
    parcelasTotales: 8,
    pctPlanActivo: 75,
    pctEjecucion70: 62,
    desviacionPromedio: 12,
    analisisValidos: 5,
    analisisVencidos: 1,
    analisisTotales: 7,
    parcelasSinVariedad: 2,
  };
}
