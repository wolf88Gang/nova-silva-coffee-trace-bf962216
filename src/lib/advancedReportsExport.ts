/**
 * Reportes Avanzados VITAL — Generación de datos para exportación.
 * 7 secciones obligatorias según Guía Completa del Protocolo VITAL v2.0
 *
 * Secciones:
 *   1. Resumen Ejecutivo
 *   2. Marco Metodológico (fórmula IGRN con pesos α, β, γ)
 *   3. Perfil Agregado (distribución por nivel)
 *   4. Tabla de Productores Críticos
 *   5. Análisis por Dimensión
 *   6. Recomendaciones Consolidadas
 *   7. Limitaciones y Advertencias
 */

import { getVitalLevel } from '@/lib/vitalLevels';

// ── Types ──

export interface VitalProducerSnapshot {
  name: string;
  region: string;
  igrn: number;
  riskPrimary: string;
  exposicion: number;
  sensibilidad: number;
  capacidad: number;
}

export interface VitalReportSummary {
  evaluated: number;
  avgIGRN: number;
  critical: number;
  fragile: number;
  building: number;
  resilient: number;
}

export interface VitalReportData {
  orgName: string;
  generatedAt: string;
  period: string;
  summary: VitalReportSummary;
  criticalProducers: VitalProducerSnapshot[];
  sections: {
    resumenEjecutivo: string;
    marcoMetodologico: string;
    perfilAgregado: string;
    tablaCriticos: string;
    analisisDimensiones: string;
    recomendaciones: string;
    limitaciones: string[];
  };
}

// ── Demo Data ──

const SAMPLE_CRITICAL_PRODUCERS: VitalProducerSnapshot[] = [
  { name: 'José Mendoza López', region: 'Jinotega Norte', igrn: 24, riskPrimary: 'Suelo degradado', exposicion: 0.35, sensibilidad: 0.72, capacidad: 0.18 },
  { name: 'Carlos Ramírez Solís', region: 'Matagalpa Sur', igrn: 31, riskPrimary: 'Sin acceso a agua', exposicion: 0.55, sensibilidad: 0.68, capacidad: 0.22 },
  { name: 'Ana Pérez Gutiérrez', region: 'Nueva Segovia', igrn: 28, riskPrimary: 'Monocultivo sin sombra', exposicion: 0.42, sensibilidad: 0.80, capacidad: 0.15 },
  { name: 'Roberto Flores Díaz', region: 'Jinotega Centro', igrn: 35, riskPrimary: 'Plagas recurrentes', exposicion: 0.60, sensibilidad: 0.55, capacidad: 0.28 },
  { name: 'María Isabel Cruz', region: 'Matagalpa Norte', igrn: 22, riskPrimary: 'Cafetal sin renovar (>20 años)', exposicion: 0.30, sensibilidad: 0.85, capacidad: 0.12 },
];

const SAMPLE_SUMMARY: VitalReportSummary = {
  evaluated: 342,
  avgIGRN: 58.4,
  critical: 34,
  fragile: 98,
  building: 153,
  resilient: 57,
};

// ── Limitaciones Obligatorias ──

const LIMITACIONES_OBLIGATORIAS: string[] = [
  'Los resultados reflejan la autoevaluación del productor y la observación del técnico en un momento específico. Las condiciones pueden cambiar entre evaluaciones.',
  'El Protocolo VITAL mide resiliencia percibida y observable, no resiliencia absoluta. Eventos climáticos extremos pueden superar cualquier nivel de preparación.',
  'Los datos de carbono son estimaciones basadas en conteos visuales y factores de ajuste publicados. No sustituyen una verificación MRV formal.',
  'La integración con el Score Crediticio Nova (SCN) utiliza el nivel VITAL como proxy de gestión. No constituye un análisis crediticio completo.',
  'Las recomendaciones generadas son orientativas y deben ser validadas por el equipo técnico en campo antes de su implementación.',
];

// ── Generator ──

export function generateVitalReport(
  orgName: string,
  period: string,
  summary?: Partial<VitalReportSummary>,
  criticalProducers?: VitalProducerSnapshot[],
): VitalReportData {
  const s = { ...SAMPLE_SUMMARY, ...summary };
  const producers = criticalProducers ?? SAMPLE_CRITICAL_PRODUCERS;
  const now = new Date().toISOString().split('T')[0];

  const pctCritical = ((s.critical / s.evaluated) * 100).toFixed(1);
  const pctResilient = ((s.resilient / s.evaluated) * 100).toFixed(1);

  const resumenEjecutivo = `Este reporte documenta el nivel de resiliencia climática de ${s.evaluated} productores evaluados por ${orgName} durante el período ${period}. El Índice Global de Resiliencia Neta (IGRN) promedio es de ${s.avgIGRN}/100, con ${s.critical} productores (${pctCritical}%) en estado crítico y ${s.resilient} (${pctResilient}%) clasificados como resilientes.`;

  const marcoMetodologico = `El Protocolo VITAL utiliza la fórmula IGRN = (α × E + β × S + γ × C) × 100, donde α = 0.35 (Exposición), β = 0.30 (Sensibilidad) y γ = 0.35 (Capacidad Adaptativa). Los scores E, S y C son promedios ponderados normalizados 0-1 donde 1 = buena práctica. Los niveles de madurez se clasifican en: Crítica (0-40), Fragilidad (41-60), En Construcción (61-80) y Resiliente (81-100).`;

  const perfilAgregado = `Distribución por nivel: Crítica ${s.critical} (${pctCritical}%), Fragilidad ${s.fragile} (${((s.fragile / s.evaluated) * 100).toFixed(1)}%), En Construcción ${s.building} (${((s.building / s.evaluated) * 100).toFixed(1)}%), Resiliente ${s.resilient} (${pctResilient}%).`;

  const tablaCriticos = producers
    .map(p => `${p.name} | ${p.region} | IGRN: ${p.igrn} | Riesgo: ${p.riskPrimary}`)
    .join('\n');

  const analisisDimensiones = `Exposición promedio: ${(producers.reduce((a, p) => a + p.exposicion, 0) / producers.length * 100).toFixed(0)}/100. Sensibilidad promedio: ${(producers.reduce((a, p) => a + p.sensibilidad, 0) / producers.length * 100).toFixed(0)}/100. Capacidad Adaptativa promedio: ${(producers.reduce((a, p) => a + p.capacidad, 0) / producers.length * 100).toFixed(0)}/100.`;

  const recomendaciones = `1. Atención prioritaria a los ${s.critical} productores en estado crítico con planes de acción individuales. 2. Programa de fortalecimiento en capacidad adaptativa para productores en fragilidad. 3. Acompañamiento técnico intensivo en las zonas con mayor concentración de riesgo. 4. Revisión de la estrategia de renovación de cafetales para productores con plantaciones >15 años.`;

  return {
    orgName,
    generatedAt: now,
    period,
    summary: s,
    criticalProducers: producers,
    sections: {
      resumenEjecutivo,
      marcoMetodologico,
      perfilAgregado,
      tablaCriticos,
      analisisDimensiones,
      recomendaciones,
      limitaciones: LIMITACIONES_OBLIGATORIAS,
    },
  };
}

// ── Export to clipboard (text format) ──

export function exportVitalReportToClipboard(report: VitalReportData): string {
  const lines = [
    `═══════════════════════════════════════`,
    `REPORTE PROTOCOLO VITAL — ${report.orgName}`,
    `Período: ${report.period} | Generado: ${report.generatedAt}`,
    `═══════════════════════════════════════`,
    ``,
    `1. RESUMEN EJECUTIVO`,
    report.sections.resumenEjecutivo,
    ``,
    `2. MARCO METODOLÓGICO`,
    report.sections.marcoMetodologico,
    ``,
    `3. PERFIL AGREGADO`,
    report.sections.perfilAgregado,
    ``,
    `4. PRODUCTORES CRÍTICOS`,
    report.sections.tablaCriticos,
    ``,
    `5. ANÁLISIS POR DIMENSIÓN`,
    report.sections.analisisDimensiones,
    ``,
    `6. RECOMENDACIONES`,
    report.sections.recomendaciones,
    ``,
    `7. LIMITACIONES Y ADVERTENCIAS`,
    ...report.sections.limitaciones.map((l, i) => `   ${i + 1}. ${l}`),
    ``,
    `═══════════════════════════════════════`,
    `Interpretación Nova Silva — Protocolo VITAL v2.0`,
  ];
  return lines.join('\n');
}
