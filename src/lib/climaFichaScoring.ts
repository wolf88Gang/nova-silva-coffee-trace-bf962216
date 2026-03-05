/**
 * Motor Ficha CLIMA — Cálculo de riesgo para fichas de campo (técnico).
 * Opera en escala 0-3 (no 0-100).
 * 
 * 6 Bloques de riesgo:
 *   produccion, clima_agua, suelo_manejo, plagas_enfermedades,
 *   diversificacion_ingresos, capacidades_servicios
 * 
 * 3 Dimensiones derivadas: exposicion, sensibilidad, capacidad_adaptativa
 * 
 * Source: Guía Completa del Protocolo VITAL v2.0
 */

export type NivelRiesgoFicha = 'bajo' | 'medio' | 'alto' | 'critico';

export interface ResultadoFicha {
  indice_global: number;              // 0-3 (promedio de los 6 bloques)
  nivel_riesgo_global: NivelRiesgoFicha;
  riesgo_produccion: number;          // 0-3
  riesgo_clima_agua: number;
  riesgo_suelo_manejo: number;
  riesgo_plagas: number;
  riesgo_diversificacion: number;
  riesgo_capacidades: number;
  exposicion_score: number;           // 0-3
  sensibilidad_score: number;
  capacidad_adaptativa_score: number;
}

export interface AlertaFicha {
  bloque: string;
  label: string;
  valor: number;
  nivel: NivelRiesgoFicha;
}

// ── Umbrales (Escala 0-3) ──

const UMBRALES_RIESGO = {
  bajo:    { min: 0,    max: 0.75 },   // Verde
  medio:   { min: 0.75, max: 1.5 },    // Amarillo
  alto:    { min: 1.5,  max: 2.25 },   // Naranja
  critico: { min: 2.25, max: 3 },      // Rojo
};

export const BLOQUES_LABELS: Record<string, string> = {
  produccion: 'Producción y rendimientos',
  clima_agua: 'Clima y agua',
  suelo_manejo: 'Suelo y manejo de finca',
  plagas_enfermedades: 'Plagas y enfermedades',
  diversificacion_ingresos: 'Diversificación e ingresos',
  capacidades_servicios: 'Capacidades y servicios',
};

export function getNivelRiesgoFicha(valor: number): NivelRiesgoFicha {
  if (valor >= UMBRALES_RIESGO.critico.min) return 'critico';
  if (valor >= UMBRALES_RIESGO.alto.min) return 'alto';
  if (valor >= UMBRALES_RIESGO.medio.min) return 'medio';
  return 'bajo';
}

export function getNivelRiesgoColor(nivel: NivelRiesgoFicha): string {
  switch (nivel) {
    case 'bajo': return 'text-emerald-600';
    case 'medio': return 'text-amber-500';
    case 'alto': return 'text-orange-500';
    case 'critico': return 'text-destructive';
  }
}

/**
 * Calcula el resultado completo de una ficha de campo.
 * @param bloques Record de bloque → array de valores (0-3)
 * @param dimensiones Record de dimension → array de valores (0-3)
 */
export function calcularResultadoFicha(
  bloques: Record<string, number[]>,
  dimensiones: Record<string, number[]>
): ResultadoFicha {
  const promedio = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const riesgo_produccion = promedio(bloques['produccion'] ?? []);
  const riesgo_clima_agua = promedio(bloques['clima_agua'] ?? []);
  const riesgo_suelo_manejo = promedio(bloques['suelo_manejo'] ?? []);
  const riesgo_plagas = promedio(bloques['plagas_enfermedades'] ?? []);
  const riesgo_diversificacion = promedio(bloques['diversificacion_ingresos'] ?? []);
  const riesgo_capacidades = promedio(bloques['capacidades_servicios'] ?? []);

  const indice_global = (riesgo_produccion + riesgo_clima_agua + riesgo_suelo_manejo +
    riesgo_plagas + riesgo_diversificacion + riesgo_capacidades) / 6;

  return {
    indice_global,
    nivel_riesgo_global: getNivelRiesgoFicha(indice_global),
    riesgo_produccion,
    riesgo_clima_agua,
    riesgo_suelo_manejo,
    riesgo_plagas,
    riesgo_diversificacion,
    riesgo_capacidades,
    exposicion_score: promedio(dimensiones['exposicion'] ?? []),
    sensibilidad_score: promedio(dimensiones['sensibilidad'] ?? []),
    capacidad_adaptativa_score: promedio(dimensiones['capacidad_adaptativa'] ?? []),
  };
}

/**
 * Genera alertas de ficha: bloques con riesgo >= alto (≥1.5), top 3.
 */
export function generarAlertasFicha(resultado: ResultadoFicha): AlertaFicha[] {
  const bloqueScores: [string, number][] = [
    ['produccion', resultado.riesgo_produccion],
    ['clima_agua', resultado.riesgo_clima_agua],
    ['suelo_manejo', resultado.riesgo_suelo_manejo],
    ['plagas_enfermedades', resultado.riesgo_plagas],
    ['diversificacion_ingresos', resultado.riesgo_diversificacion],
    ['capacidades_servicios', resultado.riesgo_capacidades],
  ];

  return bloqueScores
    .filter(([, v]) => v >= UMBRALES_RIESGO.alto.min)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([bloque, valor]) => ({
      bloque,
      label: BLOQUES_LABELS[bloque] ?? bloque,
      valor,
      nivel: getNivelRiesgoFicha(valor),
    }));
}
