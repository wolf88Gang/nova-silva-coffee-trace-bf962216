// ═══════════════════════════════════════════════════════════════
// Motor de cálculo — Protocolo VITAL Productor
// Funciones puras, sin dependencias de BD ni estado global
// ═══════════════════════════════════════════════════════════════

import { CLIMA_PRODUCTOR_PREGUNTAS, type PreguntaClima } from '@/config/climaProductor';

export interface RespuestaClima {
  codigo: string;
  clave: string;
  valor: number;
}

export interface PuntajeDimension {
  dimension: 'exposicion' | 'sensibilidad' | 'capacidad_adaptativa';
  puntaje: number; // 0-1 normalizado
  totalPreguntas: number;
}

export interface PuntajeBloque {
  bloque: string;
  puntaje: number; // 0-100
  exposicion: number;
  sensibilidad: number;
  capacidad_adaptativa: number;
}

export interface FactorRiesgo {
  codigo: string;
  texto: string;
  bloque: string;
  impacto: number; // 0-3
}

export interface ResultadoClimaProductor {
  indiceGlobal: number; // 0-100
  nivel: 'Crítica' | 'Fragilidad' | 'En Construcción' | 'Resiliente';
  nivelColor: string;
  exposicion: number; // 0-1
  sensibilidad: number; // 0-1
  capacidadAdaptativa: number; // 0-1
  bloques: PuntajeBloque[];
  factoresRiesgo: FactorRiesgo[];
  falsaResiliencia: boolean;
  mensajeFalsaResiliencia?: string;
}

/** Normaliza un grupo de respuestas de una dimensión a 0-1 */
export function calcularPuntajeDimension(
  preguntas: PreguntaClima[],
  respuestas: Map<string, RespuestaClima>,
  dimension: 'exposicion' | 'sensibilidad' | 'capacidad_adaptativa'
): PuntajeDimension {
  const pregsDim = preguntas.filter(p => p.dimension === dimension);
  if (pregsDim.length === 0) return { dimension, puntaje: 0, totalPreguntas: 0 };

  let sumaPonderada = 0;
  let sumaPesos = 0;

  for (const p of pregsDim) {
    const resp = respuestas.get(p.codigo);
    if (resp) {
      // Normalizar valor 0-3 a 0-1
      sumaPonderada += (resp.valor / 3) * p.peso;
      sumaPesos += p.peso;
    }
  }

  const puntaje = sumaPesos > 0 ? sumaPonderada / sumaPesos : 0;
  return { dimension, puntaje, totalPreguntas: pregsDim.length };
}

/**
 * Calcula el resultado global
 * IGRN = (0.35 × (1 - E) + 0.30 × (1 - S) + 0.35 × CA) × 100
 * donde E = exposición, S = sensibilidad, CA = capacidad adaptativa
 * Valores altos = menor riesgo (mejor)
 */
export function calcularResultadoGlobal(respuestas: Map<string, RespuestaClima>): ResultadoClimaProductor {
  const todasPreguntas = CLIMA_PRODUCTOR_PREGUNTAS;

  // Dimensiones globales
  const dimE = calcularPuntajeDimension(todasPreguntas, respuestas, 'exposicion');
  const dimS = calcularPuntajeDimension(todasPreguntas, respuestas, 'sensibilidad');
  const dimCA = calcularPuntajeDimension(todasPreguntas, respuestas, 'capacidad_adaptativa');

  // IGRN
  const E = dimE.puntaje;
  const S = dimS.puntaje;
  const CA = dimCA.puntaje;
  const indiceGlobal = Math.round((0.35 * (1 - E) + 0.30 * (1 - S) + 0.35 * CA) * 100);

  // Nivel
  const { nivel, nivelColor } = getNivel(indiceGlobal);

  // Bloques
  const bloquesUnicos = [...new Set(todasPreguntas.map(p => p.bloque))];
  const bloques: PuntajeBloque[] = bloquesUnicos.map(bloque => {
    const pregsBloque = todasPreguntas.filter(p => p.bloque === bloque);
    const e = calcularPuntajeDimension(pregsBloque, respuestas, 'exposicion');
    const s = calcularPuntajeDimension(pregsBloque, respuestas, 'sensibilidad');
    const ca = calcularPuntajeDimension(pregsBloque, respuestas, 'capacidad_adaptativa');
    const puntaje = Math.round((0.35 * (1 - e.puntaje) + 0.30 * (1 - s.puntaje) + 0.35 * ca.puntaje) * 100);
    return { bloque, puntaje, exposicion: e.puntaje, sensibilidad: s.puntaje, capacidad_adaptativa: ca.puntaje };
  });

  // Top factores de riesgo (respuestas con valor alto)
  const factoresRiesgo: FactorRiesgo[] = [];
  for (const p of todasPreguntas) {
    const resp = respuestas.get(p.codigo);
    if (resp && resp.valor >= 2) {
      factoresRiesgo.push({ codigo: p.codigo, texto: p.texto, bloque: p.bloque, impacto: resp.valor });
    }
  }
  factoresRiesgo.sort((a, b) => b.impacto - a.impacto);

  // Falsa resiliencia: si diferencia entre componente más alto y más bajo ≥ 0.4
  const componentValues = [1 - E, 1 - S, CA];
  const maxComp = Math.max(...componentValues);
  const minComp = Math.min(...componentValues);
  const falsaResiliencia = (maxComp - minComp) >= 0.4;

  return {
    indiceGlobal: Math.max(0, Math.min(100, indiceGlobal)),
    nivel,
    nivelColor,
    exposicion: E,
    sensibilidad: S,
    capacidadAdaptativa: CA,
    bloques,
    factoresRiesgo: factoresRiesgo.slice(0, 10),
    falsaResiliencia,
    mensajeFalsaResiliencia: falsaResiliencia
      ? 'Se detecta un desbalance significativo entre las dimensiones evaluadas. Un puntaje alto en una dimensión puede ocultar vulnerabilidades en otras áreas. Se recomienda atención prioritaria a las dimensiones más débiles.'
      : undefined,
  };
}

export function getNivel(puntaje: number): { nivel: ResultadoClimaProductor['nivel']; nivelColor: string } {
  if (puntaje >= 81) return { nivel: 'Resiliente', nivelColor: 'text-emerald-600' };
  if (puntaje >= 61) return { nivel: 'En Construcción', nivelColor: 'text-amber-500' };
  if (puntaje >= 41) return { nivel: 'Fragilidad', nivelColor: 'text-orange-500' };
  return { nivel: 'Crítica', nivelColor: 'text-destructive' };
}
