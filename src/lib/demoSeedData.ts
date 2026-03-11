/**
 * Comprehensive demo data engine for Nova Silva.
 * Generates realistic, tenant-aware data for all domains.
 * NEVER alters backend or scientific engines.
 */

import { getDemoConfig } from '@/hooks/useDemoConfig';

// ── Helpers ──

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDec(min: number, max: number, dec = 1) { return +(Math.random() * (max - min) + min).toFixed(dec); }
function monthsAgo(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Names & Constants ──

const FIRST_NAMES = ['María', 'Carlos', 'Ana', 'José', 'Elena', 'Pedro', 'Lucía', 'Miguel', 'Carmen', 'Roberto', 'Gabriela', 'Fernando', 'Isabel', 'Andrés', 'Patricia', 'Diego', 'Rosa', 'Alejandro', 'Sofía', 'Javier'];
const LAST_NAMES = ['Solano', 'Méndez', 'Jiménez', 'Rodríguez', 'Vargas', 'Calderón', 'Mora', 'Herrera', 'Castro', 'López', 'Gutiérrez', 'Ramírez', 'Quesada', 'Chaves', 'Soto', 'Arias', 'Brenes', 'Valverde', 'Rojas', 'Trejos'];
const FINCA_PREFIXES = ['El', 'La', 'Los', 'Las', 'San', 'Santa'];
const FINCA_NAMES = ['Cedro', 'Cumbre', 'Palma', 'Esperanza', 'Roble', 'Naranjo', 'Colina', 'Mirador', 'Paraíso', 'Aurora', 'Horizonte', 'Bosque', 'Cascada', 'Volcán', 'Valle', 'Pino', 'Encino', 'Ciprés', 'Bambú', 'Helecho'];
const VARIEDADES = ['Caturra', 'Catuaí', 'SL-28', 'Gesha', 'Bourbon', 'Typica', 'Villa Sarchí', 'Obatá', 'Marsellesa', 'H1'];
const REGIONES = ['Tarrazú', 'Valle Central', 'West Valley', 'Brunca', 'Turrialba', 'Orosi', 'Tres Ríos', 'Naranjo', 'Pérez Zeledón', 'Coto Brus'];
const ENFERMEDADES = ['Roya del café', 'Broca del café', 'Ojo de gallo', 'Mancha de hierro', 'Antracnosis', 'Mal de hilachas', 'Cercospora'];
const ACTIVIDADES_JORNAL = ['Recolección', 'Fertilización', 'Podas', 'Deshierba', 'Mantenimiento drenajes', 'Siembra', 'Aplicación fitosanitaria', 'Recepa'];
const FERTILIZANTES = ['18-5-15-6-2', 'DAP 18-46-0', 'KCl 0-0-60', 'Sulfato de Magnesio', 'Urea 46-0-0', 'NPK 10-30-10', 'Nitrato de Calcio', 'Abono orgánico Premium'];
const FUNGICIDAS = ['Clorotalonil 720 SC', 'Azoxystrobin 250', 'Mancozeb 80 WP', 'Ciproconazol 100 EC', 'Opera Ultra', 'Serenade ASO'];
const CATEGORIAS_INV = ['Fertilizantes', 'Agroquímicos', 'Correctivos', 'Herramientas', 'EPP', 'Materiales cosecha', 'Empaque', 'Vivero'];
const CUP_NOTAS = ['Cítrico, chocolate, cuerpo medio', 'Floral, nuez, acidez brillante', 'Frutos rojos, panela, sedoso', 'Jazmín, bergamota, complejo', 'Caramelo, manzana verde, limpio', 'Ciruela, cacao, aterciopelado', 'Tropical, miel, dulce', 'Cereza, tofe, balanceado', 'Naranja, avellana, persistente', 'Frambuesa, vainilla, elegante'];

function genName() { return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; }
function genParcelaName() { return `${pick(FINCA_PREFIXES)} ${pick(FINCA_NAMES)}`; }
function genLoteCode(prefix: string, i: number) { return `${prefix}-2026-${String(i).padStart(3, '0')}`; }

// ── SCALE CONFIGS by orgType ──

interface ScaleConfig {
  productores: number;
  parcelas: number;
  proveedores: number;
  analisisSuelo: number;
  planesNutricion: number;
  ejecuciones: number;
  diagnosticosGuard: number;
  estimacionesYield: number;
  evaluacionesVital: number;
  muestrasNovaCup: number;
  lotesAcopio: number;
  lotesComerciales: number;
  exportaciones: number;
  cuadrillas: number;
  jornadasRegistradas: number;
  inventarioItems: number;
  dossiersEudr: number;
  auditSessions: number;
}

const SCALES: Record<string, ScaleConfig> = {
  cooperativa: { productores: 220, parcelas: 540, proveedores: 0, analisisSuelo: 180, planesNutricion: 220, ejecuciones: 300, diagnosticosGuard: 250, estimacionesYield: 120, evaluacionesVital: 180, muestrasNovaCup: 60, lotesAcopio: 40, lotesComerciales: 18, exportaciones: 6, cuadrillas: 4, jornadasRegistradas: 120, inventarioItems: 35, dossiersEudr: 25, auditSessions: 0 },
  finca_empresarial: { productores: 0, parcelas: 12, proveedores: 80, analisisSuelo: 12, planesNutricion: 12, ejecuciones: 36, diagnosticosGuard: 28, estimacionesYield: 12, evaluacionesVital: 8, muestrasNovaCup: 15, lotesAcopio: 12, lotesComerciales: 8, exportaciones: 6, cuadrillas: 6, jornadasRegistradas: 240, inventarioItems: 45, dossiersEudr: 15, auditSessions: 0 },
  exportador: { productores: 0, parcelas: 0, proveedores: 600, analisisSuelo: 0, planesNutricion: 0, ejecuciones: 0, diagnosticosGuard: 0, estimacionesYield: 0, evaluacionesVital: 0, muestrasNovaCup: 45, lotesAcopio: 80, lotesComerciales: 35, exportaciones: 18, cuadrillas: 0, jornadasRegistradas: 0, inventarioItems: 12, dossiersEudr: 50, auditSessions: 0 },
  productor_privado: { productores: 0, parcelas: 8, proveedores: 0, analisisSuelo: 8, planesNutricion: 8, ejecuciones: 24, diagnosticosGuard: 18, estimacionesYield: 8, evaluacionesVital: 4, muestrasNovaCup: 6, lotesAcopio: 4, lotesComerciales: 3, exportaciones: 0, cuadrillas: 3, jornadasRegistradas: 150, inventarioItems: 28, dossiersEudr: 5, auditSessions: 0 },
  certificadora: { productores: 0, parcelas: 0, proveedores: 0, analisisSuelo: 0, planesNutricion: 0, ejecuciones: 0, diagnosticosGuard: 0, estimacionesYield: 0, evaluacionesVital: 0, muestrasNovaCup: 0, lotesAcopio: 0, lotesComerciales: 0, exportaciones: 0, cuadrillas: 0, jornadasRegistradas: 0, inventarioItems: 0, dossiersEudr: 24, auditSessions: 8 },
};

function getScale(): ScaleConfig {
  const cfg = getDemoConfig();
  return SCALES[cfg?.orgType || 'cooperativa'] || SCALES.cooperativa;
}

function getOrgType(): string { return getDemoConfig()?.orgType || 'cooperativa'; }

// ── Data Generators ──

// Memoize to avoid re-generating on each render
const cache: Record<string, any> = {};
function memoized<T>(key: string, gen: () => T): T {
  const orgType = getOrgType();
  const k = `${orgType}::${key}`;
  if (!cache[k]) cache[k] = gen();
  return cache[k];
}

// Monthly time series (last 12 months)
export function getMonthlyTimeSeries(baseValue: number, variance: number, label = 'value') {
  return memoized(`monthly_${label}_${baseValue}`, () => {
    const months = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
    return months.map((m, i) => ({
      mes: m,
      [label]: Math.round(baseValue + (Math.sin(i * 0.8) * variance) + randInt(-variance * 0.3, variance * 0.3)),
    }));
  });
}

// ── PRODUCCIÓN ──

export interface DemoProductor { id: string; nombre: string; region: string; parcelas: number; area: number; ultimaEntrega: string; estado: string; }
export function getDemoProductores(): DemoProductor[] {
  const s = getScale();
  // Generate capped list for table display
  const count = Math.min(s.productores || s.proveedores || 20, 50);
  return memoized('productores', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `prod-${i}`,
      nombre: genName(),
      region: pick(REGIONES),
      parcelas: randInt(1, 8),
      area: randDec(0.8, 14, 1),
      ultimaEntrega: daysAgo(randInt(1, 60)),
      estado: pick(['Activo', 'Activo', 'Activo', 'Inactivo', 'Activo']),
    }))
  );
}

export interface DemoParcela { id: string; nombre: string; productor: string; variedad: string; area: number; altitud: number; region: string; }
export function getDemoParcelas(): DemoParcela[] {
  const s = getScale();
  const count = Math.min(s.parcelas || 20, 40);
  return memoized('parcelas', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `parc-${i}`,
      nombre: genParcelaName(),
      productor: genName(),
      variedad: pick(VARIEDADES),
      area: randDec(0.5, 14, 1),
      altitud: randInt(900, 1800),
      region: pick(REGIONES),
    }))
  );
}

export function getEntregasMensuales() {
  const s = getScale();
  const base = s.productores > 100 ? 1800 : s.parcelas > 5 ? 120 : 40;
  return getMonthlyTimeSeries(base, base * 0.4, 'entregas');
}

export function getProduccionKPIs() {
  const s = getScale();
  const orgType = getOrgType();
  return memoized('produccion_kpis', () => ({
    productores_count: orgType === 'exportador' ? s.proveedores : s.productores || '—',
    parcelas_count: s.parcelas || '—',
    variedades_count: randInt(4, 10),
    entregas_count: randInt(200, 3000),
    documentos_count: randInt(50, 400),
    parcelas_sin_analisis: randInt(5, 40),
    alertas_guard: randInt(2, 12),
    estimaciones_pendientes: randInt(3, 25),
  }));
}

export function getTopVariedades() {
  return memoized('top_variedades', () => {
    const vars = ['Caturra', 'Catuaí', 'Bourbon', 'Gesha', 'Villa Sarchí', 'Obatá'];
    return vars.map(v => ({ variedad: v, parcelas: randInt(10, 120), area: randDec(20, 300, 0) }));
  });
}

// ── NUTRICIÓN ──

export interface DemoAnalisisSuelo { id: string; parcela: string; productor: string; fecha: string; ph: number; mo: number; n: number; p: number; k: number; ca: number; mg: number; estado: string; }
export function getDemoAnalisisSuelo(): DemoAnalisisSuelo[] {
  const s = getScale();
  const count = Math.min(s.analisisSuelo, 30);
  return memoized('analisis_suelo', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `as-${i}`,
      parcela: genParcelaName(),
      productor: genName(),
      fecha: daysAgo(randInt(10, 365)),
      ph: randDec(4.5, 6.5, 1),
      mo: randDec(2, 8, 1),
      n: randDec(0.1, 0.5, 2),
      p: randDec(3, 25, 0),
      k: randDec(0.1, 1.2, 2),
      ca: randDec(2, 12, 1),
      mg: randDec(0.3, 3, 1),
      estado: pick(['Completo', 'Completo', 'Pendiente revisión', 'En laboratorio']),
    }))
  );
}

export interface DemoPlanNutricion { id: string; parcela: string; productor: string; estado: string; ejecucion: number; fechaCreacion: string; fechaVencimiento: string; }
export function getDemoPlanesNutricion(): DemoPlanNutricion[] {
  const s = getScale();
  const count = Math.min(s.planesNutricion, 30);
  return memoized('planes_nutricion', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `pn-${i}`,
      parcela: genParcelaName(),
      productor: genName(),
      estado: pick(['Vigente', 'Vigente', 'Vigente', 'Vencido', 'Borrador', 'Sin plan']),
      ejecucion: randInt(0, 100),
      fechaCreacion: daysAgo(randInt(30, 300)),
      fechaVencimiento: daysAgo(-randInt(0, 180)),
    }))
  );
}

export function getNutricionKPIs() {
  const s = getScale();
  return memoized('nutricion_kpis', () => ({
    planes_activos: Math.round(s.planesNutricion * 0.7),
    analisis_pendientes: randInt(4, 18),
    planes_por_ejecutar: randInt(8, 30),
    alertas_cruzadas: randInt(2, 8),
  }));
}

export function getEjecucionesNutricion() {
  return memoized('ejecuciones_nutricion', () =>
    Array.from({ length: 15 }, (_, i) => ({
      parcela: genParcelaName(),
      producto: pick(FERTILIZANTES),
      dosis: `${randInt(100, 400)} kg/ha`,
      fecha: daysAgo(randInt(1, 120)),
      estado: pick(['Aplicado', 'Aplicado', 'Programado', 'Atrasado']),
    }))
  );
}

// ── NOVA GUARD ──

export interface DemoDiagnostico { id: string; parcela: string; productor: string; enfermedad: string; severidad: string; fecha: string; estado: string; incidencia: number; }
export function getDemoDiagnosticosGuard(): DemoDiagnostico[] {
  const s = getScale();
  const count = Math.min(s.diagnosticosGuard, 30);
  return memoized('diagnosticos_guard', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `dg-${i}`,
      parcela: genParcelaName(),
      productor: genName(),
      enfermedad: pick(ENFERMEDADES),
      severidad: pick(['Alta', 'Media', 'Media', 'Baja', 'Baja', 'Baja']),
      fecha: daysAgo(randInt(1, 180)),
      estado: pick(['Activo', 'Activo', 'En tratamiento', 'Resuelto', 'Resuelto']),
      incidencia: randInt(5, 85),
    }))
  );
}

export function getGuardKPIs() {
  const s = getScale();
  return memoized('guard_kpis', () => ({
    brotes_activos: randInt(2, 8),
    parcelas_riesgo: randInt(5, 20),
    incidencias_30d: randInt(8, 35),
    tendencia: pick(['↓ 15%', '↓ 8%', '↑ 3%', '→ estable']),
  }));
}

export function getGuardPorEnfermedad() {
  return memoized('guard_por_enfermedad', () =>
    ENFERMEDADES.slice(0, 5).map(e => ({
      enfermedad: e,
      casos: randInt(3, 50),
      severidad_prom: randDec(1, 3, 1),
    }))
  );
}

// ── NOVA YIELD ──

export interface DemoEstimacionYield { id: string; parcela: string; productor: string; estado: string; resultado: string; fecha: string; variedad: string; }
export function getDemoEstimacionesYield(): DemoEstimacionYield[] {
  const s = getScale();
  const count = Math.min(s.estimacionesYield, 25);
  return memoized('estimaciones_yield', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `ye-${i}`,
      parcela: genParcelaName(),
      productor: genName(),
      estado: pick(['Completada', 'Completada', 'Completada', 'Pendiente', 'En proceso', 'Borrador']),
      resultado: `${randDec(18, 42, 1)} qq/ha`,
      fecha: daysAgo(randInt(1, 120)),
      variedad: pick(VARIEDADES),
    }))
  );
}

export function getYieldKPIs() {
  const s = getScale();
  return memoized('yield_kpis', () => ({
    estimaciones_activas: Math.round(s.estimacionesYield * 0.4),
    pendientes_validar: randInt(3, 15),
    completadas: Math.round(s.estimacionesYield * 0.6),
    parcelas_sin_estimacion: randInt(8, 40),
  }));
}

export function getYieldHistorico() {
  return memoized('yield_historico', () => {
    const campanas = ['2022/23', '2023/24', '2024/25', '2025/26'];
    return campanas.map(c => ({
      campana: c,
      estimado: randDec(24, 36, 1),
      real: c === '2025/26' ? null : randDec(22, 38, 1),
    }));
  });
}

// ── PROTOCOLO VITAL ──

export interface DemoVitalFinca { nombre: string; productor: string; score: number; exposicion: number; sensibilidad: number; capacidad: number; nivel: string; }
export function getDemoVitalFincas(): DemoVitalFinca[] {
  const s = getScale();
  const count = Math.min(s.evaluacionesVital || 20, 25);
  return memoized('vital_fincas', () =>
    Array.from({ length: count }, () => {
      const score = randInt(25, 95);
      return {
        nombre: genParcelaName(),
        productor: genName(),
        score,
        exposicion: randInt(20, 90),
        sensibilidad: randInt(20, 85),
        capacidad: randInt(25, 95),
        nivel: score >= 75 ? 'Alto' : score >= 50 ? 'Medio' : 'Bajo',
      };
    })
  );
}

export function getVitalKPIs() {
  const s = getScale();
  return memoized('vital_kpis', () => ({
    score_promedio: randInt(55, 78),
    fincas_evaluadas: s.evaluacionesVital || randInt(40, 200),
    brechas_prioritarias: randInt(6, 20),
    tendencia: `+${randInt(1, 8)} pts`,
  }));
}

export function getVitalDistribucion() {
  return memoized('vital_distribucion', () => [
    { nivel: 'Alto (≥75)', count: randInt(30, 80), fill: 'hsl(var(--primary))' },
    { nivel: 'Medio (50-74)', count: randInt(40, 100), fill: 'hsl(var(--warning))' },
    { nivel: 'Bajo (<50)', count: randInt(10, 40), fill: 'hsl(var(--destructive))' },
  ]);
}

export function getVitalBrechas() {
  return memoized('vital_brechas', () => [
    { brecha: 'Diversificación de ingresos', afectados: randInt(30, 80), prioridad: 'Alta' },
    { brecha: 'Acceso a agua de riego', afectados: randInt(20, 60), prioridad: 'Alta' },
    { brecha: 'Cobertura de seguro agrícola', afectados: randInt(15, 50), prioridad: 'Media' },
    { brecha: 'Manejo de sombra', afectados: randInt(10, 45), prioridad: 'Media' },
    { brecha: 'Capacitación técnica', afectados: randInt(8, 35), prioridad: 'Baja' },
    { brecha: 'Infraestructura postcosecha', afectados: randInt(5, 30), prioridad: 'Media' },
  ]);
}

export function getVitalAcciones() {
  return memoized('vital_acciones', () => [
    { accion: 'Programa de micro-riego por goteo', impacto: 'Alto', estado: 'En ejecución', beneficiarios: randInt(20, 60) },
    { accion: 'Capacitación en manejo integrado de plagas', impacto: 'Alto', estado: 'Planificado', beneficiarios: randInt(40, 120) },
    { accion: 'Fondo de emergencia climática', impacto: 'Medio', estado: 'Aprobado', beneficiarios: randInt(50, 200) },
    { accion: 'Instalación de estaciones meteorológicas', impacto: 'Medio', estado: 'Completado', beneficiarios: randInt(80, 300) },
    { accion: 'Vinculación a seguro paramétrico', impacto: 'Alto', estado: 'En negociación', beneficiarios: randInt(30, 100) },
  ]);
}

// ── CUMPLIMIENTO / EUDR ──

export interface DemoDossierEUDR { id: string; lote: string; origen: string; estado: string; parcelas: number; documentosFaltantes: number; riesgo: string; fecha: string; }
export function getDemoDossiersEUDR(): DemoDossierEUDR[] {
  const s = getScale();
  const count = Math.min(s.dossiersEudr, 25);
  return memoized('dossiers_eudr', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `eudr-${i}`,
      lote: genLoteCode('LT', i + 1),
      origen: pick(REGIONES),
      estado: pick(['Verde', 'Verde', 'Verde', 'Ámbar', 'Ámbar', 'Rojo']),
      parcelas: randInt(3, 30),
      documentosFaltantes: pick([0, 0, 0, 1, 2, 3]),
      riesgo: pick(['Bajo', 'Bajo', 'Bajo', 'Medio', 'Alto']),
      fecha: daysAgo(randInt(1, 90)),
    }))
  );
}

export function getCumplimientoKPIs() {
  const s = getScale();
  return memoized('cumplimiento_kpis', () => ({
    trazabilidad_pct: `${randInt(88, 99)}%`,
    lotes_activos: randInt(10, 80),
    dossiers_count: s.dossiersEudr,
    documentos_count: randInt(100, 800),
    sesiones_activas: s.auditSessions || randInt(2, 8),
  }));
}

// ── CALIDAD / NOVA CUP ──

export interface DemoMuestraCup { id: string; lote: string; productor: string; origen: string; score: number; notas: string; fecha: string; variedad: string; categoria: string; }
export function getDemoMuestrasCup(): DemoMuestraCup[] {
  const s = getScale();
  const count = Math.min(s.muestrasNovaCup, 30);
  return memoized('muestras_cup', () =>
    Array.from({ length: count }, (_, i) => {
      const score = randDec(78, 92, 1);
      return {
        id: `cup-${i}`,
        lote: genLoteCode('CMV', i + 1),
        productor: genName(),
        origen: pick(REGIONES),
        score,
        notas: pick(CUP_NOTAS),
        fecha: daysAgo(randInt(1, 180)),
        variedad: pick(VARIEDADES),
        categoria: score >= 88 ? 'Specialty Premium' : score >= 85 ? 'Specialty' : score >= 82 ? 'Fine' : 'Comercial',
      };
    })
  );
}

export function getCupKPIs() {
  const s = getScale();
  return memoized('cup_kpis', () => ({
    evaluaciones: s.muestrasNovaCup || randInt(40, 200),
    score_promedio: randDec(83, 87, 1),
    lotes_destacados: randInt(8, 40),
    tendencia: `+${randDec(0.5, 2.5, 1)} pts`,
  }));
}

export function getCupTendencia() {
  return memoized('cup_tendencia', () => {
    const meses = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
    return meses.map(m => ({ mes: m, score: randDec(83, 88, 1) }));
  });
}

// ── JORNALES ──

export interface DemoRegistroJornal { cuadrilla: string; actividad: string; parcela: string; jornales: number; costo: string; fecha: string; }
export function getDemoRegistrosJornales(): DemoRegistroJornal[] {
  const s = getScale();
  const count = Math.min(s.jornadasRegistradas, 30);
  return memoized('registros_jornales', () =>
    Array.from({ length: count }, () => ({
      cuadrilla: `Cuadrilla ${pick(['Norte', 'Sur', 'Central', 'Especial', 'Cosecha A', 'Cosecha B'])}`,
      actividad: pick(ACTIVIDADES_JORNAL),
      parcela: genParcelaName(),
      jornales: randInt(2, 20),
      costo: `₡ ${(randInt(20, 300) * 1000).toLocaleString()}`,
      fecha: daysAgo(randInt(0, 60)),
    }))
  );
}

export function getJornalesKPIs() {
  const s = getScale();
  return memoized('jornales_kpis', () => ({
    cuadrillas_activas: s.cuadrillas || randInt(2, 8),
    jornales_semana: randInt(40, 150),
    costo_semanal: `₡ ${randDec(0.5, 3.2, 1)}M`,
    pagos_pendientes: randInt(0, 5),
  }));
}

export function getJornalesMensuales() {
  const s = getScale();
  const base = s.jornadasRegistradas > 100 ? 280 : 80;
  return getMonthlyTimeSeries(base, base * 0.3, 'jornales');
}

export function getCuadrillas() {
  const s = getScale();
  return memoized('cuadrillas', () =>
    Array.from({ length: s.cuadrillas || 3 }, (_, i) => ({
      nombre: `Cuadrilla ${['Norte', 'Sur', 'Central', 'Especial', 'Cosecha A', 'Cosecha B'][i]}`,
      miembros: randInt(4, 15),
      activa: pick([true, true, true, false]),
      ultimaActividad: pick(ACTIVIDADES_JORNAL),
      costoPeriodo: `₡ ${(randInt(200, 800) * 1000).toLocaleString()}`,
    }))
  );
}

// ── FINANZAS ──

export function getFinanzasKPIs() {
  const orgType = getOrgType();
  return memoized('finanzas_kpis', () => ({
    ingresos_mes: `$${randInt(80, 450)}K`,
    costos_mes: `$${randInt(30, 200)}K`,
    margen: `${randInt(15, 42)}%`,
    score_nova: randInt(620, 850),
    carbono_toneladas: randInt(50, 800),
  }));
}

export function getFinanzasMensuales() {
  return memoized('finanzas_mensuales', () => {
    const meses = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
    return meses.map(m => ({
      mes: m,
      ingresos: randInt(60, 500),
      costos: randInt(30, 250),
    }));
  });
}

export function getDistribucionGastos() {
  return memoized('dist_gastos', () => [
    { categoria: 'Mano de obra', valor: randInt(25, 40), fill: 'hsl(var(--primary))' },
    { categoria: 'Insumos', valor: randInt(15, 30), fill: 'hsl(var(--accent))' },
    { categoria: 'Transporte', valor: randInt(5, 15), fill: 'hsl(var(--chart-3))' },
    { categoria: 'Procesamiento', valor: randInt(8, 20), fill: 'hsl(var(--chart-4))' },
    { categoria: 'Administrativos', valor: randInt(5, 12), fill: 'hsl(var(--chart-5))' },
  ]);
}

// ── INVENTARIO ──

export interface DemoInventarioItem {
  id: string; nombre: string; categoria: string; unidad: string;
  stockActual: number; stockMinimo: number; proveedor: string;
  costoUnitario: string; ultimoMovimiento: string; estado: string;
}
export function getDemoInventario(): DemoInventarioItem[] {
  const s = getScale();
  const items: DemoInventarioItem[] = [];
  const ferts = FERTILIZANTES.map((f, i) => ({
    id: `inv-f-${i}`, nombre: f, categoria: 'Fertilizantes', unidad: 'kg',
    stockActual: randInt(100, 5000), stockMinimo: randInt(200, 1000), proveedor: `AgroInsumos ${pick(['S.A.', 'Ltda.', 'CR'])}`,
    costoUnitario: `₡${randInt(500, 3000)}/kg`, ultimoMovimiento: daysAgo(randInt(1, 30)),
    estado: '',
  }));
  ferts.forEach(f => { f.estado = f.stockActual < f.stockMinimo ? 'Crítico' : f.stockActual < f.stockMinimo * 1.5 ? 'Bajo' : 'OK'; });
  items.push(...ferts);

  const fungs = FUNGICIDAS.map((f, i) => ({
    id: `inv-g-${i}`, nombre: f, categoria: 'Agroquímicos', unidad: 'L',
    stockActual: randInt(20, 500), stockMinimo: randInt(50, 200), proveedor: `Bayer CropScience`,
    costoUnitario: `₡${randInt(2000, 8000)}/L`, ultimoMovimiento: daysAgo(randInt(1, 45)),
    estado: '',
  }));
  fungs.forEach(f => { f.estado = f.stockActual < f.stockMinimo ? 'Crítico' : f.stockActual < f.stockMinimo * 1.5 ? 'Bajo' : 'OK'; });
  items.push(...fungs);

  const extras = [
    { nombre: 'Cal dolomita', cat: 'Correctivos', unit: 'kg' },
    { nombre: 'Machetes', cat: 'Herramientas', unit: 'und' },
    { nombre: 'Guantes de nitrilo', cat: 'EPP', unit: 'par' },
    { nombre: 'Sacos de yute', cat: 'Materiales cosecha', unit: 'und' },
    { nombre: 'Canastas recolectoras', cat: 'Materiales cosecha', unit: 'und' },
    { nombre: 'Bolsas vivero 6×8', cat: 'Vivero', unit: 'millar' },
    { nombre: 'Bomba de espalda 20L', cat: 'Herramientas', unit: 'und' },
    { nombre: 'Mascarillas N95', cat: 'EPP', unit: 'und' },
    { nombre: 'Botas de hule', cat: 'EPP', unit: 'par' },
    { nombre: 'Bolsas empaque 69kg', cat: 'Empaque', unit: 'und' },
  ];
  extras.forEach((e, i) => {
    const sa = randInt(5, 300);
    const sm = randInt(10, 100);
    items.push({
      id: `inv-e-${i}`, nombre: e.nombre, categoria: e.cat, unidad: e.unit,
      stockActual: sa, stockMinimo: sm, proveedor: `Proveedor ${pick(['Industrial', 'Agrícola', 'Regional'])}`,
      costoUnitario: `₡${randInt(500, 15000)}/${e.unit}`, ultimoMovimiento: daysAgo(randInt(1, 60)),
      estado: sa < sm ? 'Crítico' : sa < sm * 1.5 ? 'Bajo' : 'OK',
    });
  });

  return items.slice(0, s.inventarioItems);
}

// ── LOTES Y EXPORTACIONES ──

export interface DemoLoteComercial { id: string; codigo: string; origen: string; volumen: string; calidad: number; estado: string; eudr: string; fecha: string; composicion: string; }
export function getDemoLotesComerciales(): DemoLoteComercial[] {
  const s = getScale();
  const count = Math.min(s.lotesComerciales, 25);
  return memoized('lotes_comerciales', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `lc-${i}`,
      codigo: genLoteCode('LC', i + 1),
      origen: pick(REGIONES),
      volumen: `${randInt(50, 600)} qq`,
      calidad: randDec(80, 90, 1),
      estado: pick(['Disponible', 'Disponible', 'Comprometido', 'En tránsito', 'Entregado']),
      eudr: pick(['Verde', 'Verde', 'Verde', 'Ámbar', 'Rojo']),
      fecha: daysAgo(randInt(1, 120)),
      composicion: `${randInt(2, 15)} productores · ${pick(VARIEDADES)}/${pick(VARIEDADES)}`,
    }))
  );
}

export interface DemoExportacion { id: string; codigo: string; destino: string; volumen: string; estado: string; lote: string; fecha: string; documentacion: string; }
export function getDemoExportaciones(): DemoExportacion[] {
  const s = getScale();
  const count = Math.min(s.exportaciones, 20);
  const destinos = ['Alemania', 'Japón', 'EE.UU.', 'Bélgica', 'Corea del Sur', 'Noruega', 'Australia', 'Reino Unido'];
  return memoized('exportaciones', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `exp-${i}`,
      codigo: genLoteCode('EXP', i + 1),
      destino: pick(destinos),
      volumen: `${randInt(100, 1200)} qq`,
      estado: pick(['Embarcado', 'En tránsito', 'Entregado', 'Preparación', 'Documentación']),
      lote: genLoteCode('LC', randInt(1, 20)),
      fecha: daysAgo(randInt(1, 180)),
      documentacion: pick(['Completa', 'Completa', 'Completa', 'Pendiente', 'En revisión']),
    }))
  );
}

// ── ABASTECIMIENTO ──

export interface DemoProveedor { id: string; nombre: string; region: string; tipo: string; entregas: number; volumen: string; eudr: string; calidad: number; }
export function getDemoProveedores(): DemoProveedor[] {
  const s = getScale();
  const count = Math.min(s.proveedores, 40);
  return memoized('proveedores', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `prov-${i}`,
      nombre: genName(),
      region: pick(REGIONES),
      tipo: pick(['Individual', 'Finca', 'Cooperativa asociada']),
      entregas: randInt(1, 40),
      volumen: `${randInt(10, 500)} qq`,
      eudr: pick(['Conforme', 'Conforme', 'Conforme', 'Pendiente', 'Riesgo']),
      calidad: randDec(80, 90, 1),
    }))
  );
}

// ── CERTIFICADORA ──

export interface DemoAuditSession { id: string; organizacion: string; tipo: string; fecha: string; estado: string; hallazgos: number; hallazgosMayores: number; auditor: string; }
export function getDemoAuditSessions(): DemoAuditSession[] {
  const s = getScale();
  const count = Math.min(s.auditSessions || 8, 12);
  return memoized('audit_sessions', () =>
    Array.from({ length: count }, (_, i) => ({
      id: `audit-${i}`,
      organizacion: `${pick(['Cooperativa', 'Finca', 'Exportadora'])} ${pick(FINCA_NAMES)}`,
      tipo: pick(['EUDR', 'Orgánico', 'Rainforest', 'Fair Trade', 'C.A.F.E. Practices']),
      fecha: daysAgo(randInt(5, 180)),
      estado: pick(['Completada', 'En proceso', 'Programada', 'Completada', 'Completada']),
      hallazgos: randInt(2, 15),
      hallazgosMayores: randInt(0, 3),
      auditor: genName(),
    }))
  );
}

// ── DASHBOARD PRINCIPAL ──

export function getDashboardKPIs() {
  const orgType = getOrgType();
  const s = getScale();
  return memoized('dashboard_kpis', () => {
    if (orgType === 'cooperativa') return { kpi1: { label: 'Productores', value: s.productores }, kpi2: { label: 'Parcelas', value: s.parcelas }, kpi3: { label: 'Entregas (mes)', value: randInt(80, 400) }, kpi4: { label: 'Alertas', value: randInt(3, 12) } };
    if (orgType === 'finca_empresarial') return { kpi1: { label: 'Parcelas propias', value: s.parcelas }, kpi2: { label: 'Proveedores', value: s.proveedores }, kpi3: { label: 'Jornales (semana)', value: randInt(50, 150) }, kpi4: { label: 'Alertas', value: randInt(2, 8) } };
    if (orgType === 'exportador') return { kpi1: { label: 'Proveedores', value: `${(s.proveedores / 1000).toFixed(1)}K+` }, kpi2: { label: 'Lotes activos', value: s.lotesComerciales }, kpi3: { label: 'Exportaciones', value: s.exportaciones }, kpi4: { label: 'EUDR pendientes', value: randInt(5, 20) } };
    if (orgType === 'productor_privado') return { kpi1: { label: 'Parcelas', value: s.parcelas }, kpi2: { label: 'Área total', value: `${randInt(20, 80)} ha` }, kpi3: { label: 'Jornales (sem)', value: randInt(20, 80) }, kpi4: { label: 'Score VITAL', value: randInt(55, 85) } };
    if (orgType === 'certificadora') return { kpi1: { label: 'Orgs auditadas', value: 24 }, kpi2: { label: 'Sesiones activas', value: s.auditSessions }, kpi3: { label: 'Hallazgos abiertos', value: randInt(8, 30) }, kpi4: { label: 'Dossiers revisados', value: s.dossiersEudr } };
    return { kpi1: { label: 'Productores', value: 220 }, kpi2: { label: 'Parcelas', value: 540 }, kpi3: { label: 'Entregas', value: 1200 }, kpi4: { label: 'Alertas', value: 5 } };
  });
}

export function getDashboardAlerts() {
  const orgType = getOrgType();
  return memoized('dashboard_alerts', () => {
    const base = [
      { tipo: 'warning', texto: `${randInt(5, 20)} parcelas sin análisis de suelo reciente`, modulo: 'Nutrición' },
      { tipo: 'destructive', texto: `${randInt(2, 6)} brotes fitosanitarios activos`, modulo: 'Nova Guard' },
      { tipo: 'info', texto: `${randInt(3, 15)} estimaciones Yield pendientes de validación`, modulo: 'Nova Yield' },
    ];
    if (orgType === 'exportador' || orgType === 'finca_empresarial') {
      base.push({ tipo: 'warning', texto: `${randInt(3, 12)} proveedores con documentación EUDR incompleta`, modulo: 'Cumplimiento' });
    }
    return base;
  });
}

export function getDashboardActivity() {
  return memoized('dashboard_activity', () => [
    { fecha: daysAgo(0), texto: 'Nuevo análisis de suelo registrado – Lote El Cedro', modulo: 'Nutrición' },
    { fecha: daysAgo(0), texto: 'Diagnóstico Guard completado – Parcela Norte', modulo: 'Guard' },
    { fecha: daysAgo(1), texto: 'Estimación Yield finalizada – 28.5 qq/ha', modulo: 'Yield' },
    { fecha: daysAgo(1), texto: 'Evaluación VITAL completada – Score 72', modulo: 'VITAL' },
    { fecha: daysAgo(2), texto: 'Lote LC-2026-008 clasificado como Specialty (87.2)', modulo: 'Nova Cup' },
    { fecha: daysAgo(3), texto: 'Dossier EUDR aprobado – Lote LT-2026-015', modulo: 'EUDR' },
    { fecha: daysAgo(4), texto: 'Plan nutricional aprobado – 12 parcelas zona norte', modulo: 'Nutrición' },
    { fecha: daysAgo(5), texto: 'Fertilización completada – 18-5-15 en 8 parcelas', modulo: 'Nutrición' },
  ]);
}

// ── PARCEL DETAIL ENRICHED ──

export function getParcelDetailDemo() {
  return memoized('parcel_detail', () => ({
    produccion: {
      entregas: Array.from({ length: 8 }, (_, i) => ({
        fecha: daysAgo(i * 15 + randInt(0, 10)),
        cantidad: `${randDec(2, 18, 1)} qq`,
        tipo: pick(['Cereza', 'Pergamino', 'Uva']),
        calidad: pick(['A', 'A', 'B', 'A']),
      })),
      rendimiento: getMonthlyTimeSeries(28, 6, 'qqha'),
    },
    nutricion: {
      analisis: {
        fecha: daysAgo(randInt(15, 90)),
        ph: randDec(4.8, 6.2, 1),
        mo: randDec(3, 7, 1),
        n: randDec(0.15, 0.40, 2),
        p: randDec(5, 20, 0),
        k: randDec(0.2, 0.9, 2),
        ca: randDec(3, 10, 1),
        mg: randDec(0.5, 2.5, 1),
        interpretacion: 'pH ligeramente ácido, fósforo adecuado, potasio deficiente. Recomendar enmienda calcárea y refuerzo potásico.',
      },
      plan: {
        estado: 'Vigente',
        ejecucion: randInt(30, 85),
        aplicaciones: Array.from({ length: 4 }, (_, i) => ({
          producto: pick(FERTILIZANTES),
          dosis: `${randInt(100, 350)} kg/ha`,
          fecha: daysAgo(i * 30 + randInt(0, 15)),
          estado: i < 2 ? 'Aplicado' : pick(['Programado', 'Atrasado']),
        })),
      },
    },
    guard: {
      diagnosticos: Array.from({ length: 5 }, (_, i) => ({
        fecha: daysAgo(i * 25 + randInt(0, 15)),
        enfermedad: pick(ENFERMEDADES),
        severidad: pick(['Alta', 'Media', 'Baja']),
        incidencia: `${randInt(5, 60)}%`,
        estado: i === 0 ? 'Activo' : pick(['En tratamiento', 'Resuelto']),
        recomendacion: pick(['Aplicar fungicida sistémico', 'Monitoreo quincenal', 'Poda sanitaria', 'Trampeo activo']),
      })),
    },
    yield: {
      estimaciones: Array.from({ length: 3 }, (_, i) => ({
        campaña: `202${4 + i}/2${5 + i}`,
        estimado: randDec(22, 38, 1),
        real: i < 2 ? randDec(20, 40, 1) : null,
        fecha: daysAgo(i * 180),
      })),
    },
    vital: {
      score: randInt(45, 88),
      dimensiones: [
        { dimension: 'Económica', score: randInt(40, 90) },
        { dimension: 'Ambiental', score: randInt(35, 85) },
        { dimension: 'Social', score: randInt(45, 90) },
        { dimension: 'Productiva', score: randInt(50, 95) },
        { dimension: 'Gobernanza', score: randInt(30, 80) },
      ],
    },
    evidencias: Array.from({ length: 6 }, (_, i) => ({
      tipo: pick(['Foto análisis', 'PDF certificado', 'Foto aplicación', 'Foto cosecha', 'Documento EUDR', 'Foto parcela']),
      fecha: daysAgo(randInt(5, 120)),
      descripcion: pick(['Análisis suelo Lab CentroCafé', 'Certificado orgánico vigente', 'Registro de fertilización', 'Estado de cosecha', 'Polígono verificado', 'Panorámica del lote']),
    })),
  }));
}

// ── DOCUMENTOS ──

export interface DemoDocumento {
  id: string; nombre: string; tipo: string; parcela: string; proveedor: string;
  fecha: string; estado: string; origen: string;
}
export function getDemoDocumentos(): DemoDocumento[] {
  const tipos = ['Análisis de suelo', 'Evidencia de campo', 'Documento EUDR', 'Certificado', 'Calidad', 'Auditoría', 'Contrato', 'Factura'];
  return memoized('documentos', () =>
    Array.from({ length: 30 }, (_, i) => ({
      id: `doc-${i}`,
      nombre: `${pick(tipos)} — ${genParcelaName()}`,
      tipo: pick(tipos),
      parcela: genParcelaName(),
      proveedor: genName(),
      fecha: daysAgo(randInt(1, 180)),
      estado: pick(['Vigente', 'Vigente', 'Vigente', 'Pendiente revisión', 'Vencido', 'Borrador']),
      origen: pick(['Campo', 'Laboratorio', 'Sistema', 'Auditoría', 'Proveedor']),
    }))
  );
}

// ── RECEPCIONES ──

export interface DemoRecepcion {
  id: string; fecha: string; proveedor: string; region: string;
  volumen: string; lote: string; calidad: number; estadoDoc: string;
}
export function getDemoRecepciones(): DemoRecepcion[] {
  return memoized('recepciones', () =>
    Array.from({ length: 25 }, (_, i) => ({
      id: `rec-${i}`,
      fecha: daysAgo(randInt(0, 90)),
      proveedor: genName(),
      region: pick(REGIONES),
      volumen: `${randInt(5, 120)} qq`,
      lote: genLoteCode('REC', i + 1),
      calidad: randDec(80, 90, 1),
      estadoDoc: pick(['Completa', 'Completa', 'Completa', 'Parcial', 'Pendiente']),
    }))
  );
}

// ── EVIDENCIAS PROVEEDOR ──

export interface DemoProviderEvidence {
  id: string; proveedor: string; region: string; tipoEvidencia: string;
  fecha: string; estado: string; observacion: string;
}
export function getDemoProviderEvidence(): DemoProviderEvidence[] {
  const tiposEv = ['Cédula jurídica', 'Geolocalización', 'Declaración EUDR', 'Certificado orgánico', 'Contrato vigente', 'Fotos parcela', 'Análisis suelo'];
  return memoized('provider_evidence', () =>
    Array.from({ length: 35 }, (_, i) => ({
      id: `ev-${i}`,
      proveedor: genName(),
      region: pick(REGIONES),
      tipoEvidencia: pick(tiposEv),
      fecha: daysAgo(randInt(1, 120)),
      estado: pick(['Completo', 'Completo', 'Completo', 'Pendiente', 'Pendiente', 'Riesgo']),
      observacion: pick(['Vigente', 'Próximo a vencer', 'Falta firma', 'Requiere actualización', 'Aprobado', 'Sin observaciones']),
    }))
  );
}

// ── RIESGO DE ORIGEN ──

export interface DemoRiskScore {
  id: string; proveedor: string; region: string; eudr: string;
  calidad: number; riesgoAgro: string; riesgoDoc: string; scoreGeneral: number;
}
export function getDemoRiskScores(): DemoRiskScore[] {
  return memoized('risk_scores', () =>
    Array.from({ length: 30 }, (_, i) => ({
      id: `risk-${i}`,
      proveedor: genName(),
      region: pick(REGIONES),
      eudr: pick(['Conforme', 'Conforme', 'Conforme', 'Pendiente', 'Riesgo']),
      calidad: randDec(78, 92, 1),
      riesgoAgro: pick(['Bajo', 'Bajo', 'Medio', 'Alto']),
      riesgoDoc: pick(['Bajo', 'Bajo', 'Medio', 'Medio', 'Alto']),
      scoreGeneral: randInt(40, 98),
    }))
  );
}

// ── TRAZABILIDAD ──

export interface DemoTraceStep {
  lote: string; origen: string; productores: number; volumen: string;
  estado: string; pasos: { etapa: string; fecha: string; completado: boolean }[];
}
export function getDemoTraceability(): DemoTraceStep[] {
  const etapas = ['Recepción', 'Consolidación', 'Documentación', 'Validación EUDR', 'Exportación'];
  return memoized('traceability', () =>
    Array.from({ length: 15 }, (_, i) => {
      const completados = randInt(2, 5);
      return {
        lote: genLoteCode('LT', i + 1),
        origen: pick(REGIONES),
        productores: randInt(3, 25),
        volumen: `${randInt(50, 500)} qq`,
        estado: completados >= 5 ? 'Trazado' : completados >= 3 ? 'En proceso' : 'Pendiente',
        pasos: etapas.map((e, j) => ({
          etapa: e,
          fecha: j < completados ? daysAgo(randInt(1, 60)) : '',
          completado: j < completados,
        })),
      };
    })
  );
}

// ── Utility: clear cache on org change ──
export function clearDemoCache() {
  Object.keys(cache).forEach(k => delete cache[k]);
}

