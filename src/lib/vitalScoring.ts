/**
 * Motor RADIX Nova 1.0 — Cálculo IGRN para preguntas dinámicas.
 * 
 * Fórmula:
 *   IGRN = (α × E + β × S + γ × C) × 100
 * 
 * Pesos:
 *   α = 0.35 (Exposición)
 *   β = 0.30 (Sensibilidad)
 *   γ = 0.35 (Capacidad Adaptativa)
 * 
 * Scores son positivos 0-1 donde 1 = buena práctica.
 * 
 * Niveles de Madurez:
 *   0-25   → 1 Vulnerable
 *   25-50  → 2 En Transición
 *   50-75  → 3 Resiliente
 *   75-100 → 4 Regenerativo
 * 
 * Source: Guía Completa del Protocolo VITAL v2.0
 */

export type NivelMadurez = 'vulnerable' | 'transicion' | 'resiliente' | 'regenerativo';

export interface RespuestaVital {
  pregunta_id: string;
  opcion_clave: string;
  score_vital: number; // 0-1 normalizado
  texto_libre?: string;
}

export interface DimensionScore {
  dimension_id: string;
  nombre: string;
  score: number; // 0-1
}

export interface BloqueScore {
  bloque_id: string;
  nombre: string;
  score: number; // 0-1
  componente: string;
}

export interface FactorVulnerabilidad {
  pregunta_id: string;
  texto: string;
  score: number;
  impacto: 'alto' | 'medio';
  componente: string;
}

export interface ResultadoVital {
  indice_global: number;            // 0-100
  nivel_madurez: NivelMadurez;
  nivel_madurez_numero: 1 | 2 | 3 | 4;
  componentes: {
    exposicion: number;     // 0-1
    sensibilidad: number;   // 0-1
    capacidad: number;      // 0-1
  };
  dimensiones: DimensionScore[];
  bloques: BloqueScore[];
  factores_vulnerabilidad: FactorVulnerabilidad[];
  falsa_resiliencia: boolean;
  gap_componentes: number;
  componente_debil: string;
}

// ── Pesos RADIX ──

const PESOS = {
  exposicion: 0.35,
  sensibilidad: 0.30,
  capacidad_adaptativa: 0.35,
};

// ── Umbrales ──

const UMBRAL_MADUREZ = {
  vulnerable:   { min: 0,  max: 25 },
  transicion:   { min: 25, max: 50 },
  resiliente:   { min: 50, max: 75 },
  regenerativo: { min: 75, max: 100 },
};

export function getNivelMadurez(igrn: number): { nivel: NivelMadurez; numero: 1 | 2 | 3 | 4 } {
  if (igrn >= UMBRAL_MADUREZ.regenerativo.min) return { nivel: 'regenerativo', numero: 4 };
  if (igrn >= UMBRAL_MADUREZ.resiliente.min)   return { nivel: 'resiliente', numero: 3 };
  if (igrn >= UMBRAL_MADUREZ.transicion.min)   return { nivel: 'transicion', numero: 2 };
  return { nivel: 'vulnerable', numero: 1 };
}

export const NIVEL_MADUREZ_LABELS: Record<NivelMadurez, string> = {
  vulnerable: 'Nivel 1 - Vulnerable',
  transicion: 'Nivel 2 - En Transición',
  resiliente: 'Nivel 3 - Resiliente',
  regenerativo: 'Nivel 4 - Regenerativo',
};

export const NIVEL_MADUREZ_DESCRIPTIONS: Record<NivelMadurez, string> = {
  vulnerable: 'Requiere fortalecimiento institucional urgente antes de implementar sistemas avanzados.',
  transicion: 'Capacidades básicas presentes, pero con brechas en trazabilidad y digitalización.',
  resiliente: 'Alta capacidad para gestionar la mayoría de los riesgos. Lista para Protocolo VITAL completo.',
  regenerativo: 'Liderazgo en la cadena de valor: usa la data para generar primas y atraer financiamiento verde.',
};

// ── Detección de Falsa Resiliencia ──

export function detectarFalsaResiliencia(
  exposicion: number,
  sensibilidad: number,
  capacidad: number
): { esFalsa: boolean; gap: number; componenteDebil: string } {
  const scores = [
    { nombre: 'exposicion', valor: exposicion },
    { nombre: 'sensibilidad', valor: sensibilidad },
    { nombre: 'capacidad', valor: capacidad },
  ];
  const max = Math.max(...scores.map(s => s.valor));
  const min = Math.min(...scores.map(s => s.valor));
  const gap = max - min;
  const componenteDebil = scores.find(s => s.valor === min)!.nombre;

  return { esFalsa: gap >= 0.4, gap, componenteDebil };
}

// ── Cálculo Principal ──

interface PreguntaRadix {
  id: string;
  componente: 'EXPOSICION' | 'SENSIBILIDAD' | 'CAPACIDAD_ADAPTATIVA';
  bloque_id: string;
  peso_relativo: number;
  texto_pregunta: string;
}

interface BloqueRadix {
  id: string;
  nombre: string;
  dimension_id?: string;
}

interface DimensionRadix {
  id: string;
  nombre: string;
}

/**
 * Calcula resultado VITAL completo desde preguntas RADIX dinámicas.
 */
export function calcularResultadoVital(
  respuestas: RespuestaVital[],
  preguntas: PreguntaRadix[],
  bloques: BloqueRadix[],
  dimensiones: DimensionRadix[]
): ResultadoVital {
  const respMap = new Map(respuestas.map(r => [r.pregunta_id, r]));

  // Calcular promedios ponderados por componente
  const calcComponente = (comp: string) => {
    const pregsComp = preguntas.filter(p => p.componente === comp);
    let sumaPonderada = 0;
    let sumaPesos = 0;
    for (const p of pregsComp) {
      const r = respMap.get(p.id);
      if (r) {
        sumaPonderada += r.score_vital * p.peso_relativo;
        sumaPesos += p.peso_relativo;
      }
    }
    return sumaPesos > 0 ? sumaPonderada / sumaPesos : 0;
  };

  const E = calcComponente('EXPOSICION');
  const S = calcComponente('SENSIBILIDAD');
  const C = calcComponente('CAPACIDAD_ADAPTATIVA');

  // IGRN
  const igrn = Math.round((PESOS.exposicion * E + PESOS.sensibilidad * S + PESOS.capacidad_adaptativa * C) * 100);
  const igrnClamped = Math.max(0, Math.min(100, igrn));
  const { nivel, numero } = getNivelMadurez(igrnClamped);

  // Scores por bloque
  const bloqueScores: BloqueScore[] = bloques.map(b => {
    const pregsBloque = preguntas.filter(p => p.bloque_id === b.id);
    let sum = 0, count = 0;
    for (const p of pregsBloque) {
      const r = respMap.get(p.id);
      if (r) { sum += r.score_vital * p.peso_relativo; count += p.peso_relativo; }
    }
    return {
      bloque_id: b.id,
      nombre: b.nombre,
      score: count > 0 ? sum / count : 0,
      componente: pregsBloque[0]?.componente ?? '',
    };
  });

  // Scores por dimensión
  const dimensionScores: DimensionScore[] = dimensiones.map(d => {
    const bloquesEnDim = bloques.filter(b => b.dimension_id === d.id);
    const scores = bloquesEnDim.map(b => bloqueScores.find(bs => bs.bloque_id === b.id)?.score ?? 0);
    return {
      dimension_id: d.id,
      nombre: d.nombre,
      score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    };
  });

  // Factores de vulnerabilidad (score < 0.5)
  const factores: FactorVulnerabilidad[] = [];
  for (const p of preguntas) {
    const r = respMap.get(p.id);
    if (r && r.score_vital < 0.5) {
      factores.push({
        pregunta_id: p.id,
        texto: p.texto_pregunta,
        score: r.score_vital,
        impacto: r.score_vital < 0.25 ? 'alto' : 'medio',
        componente: p.componente,
      });
    }
  }
  factores.sort((a, b) => a.score - b.score);

  const fr = detectarFalsaResiliencia(E, S, C);

  return {
    indice_global: igrnClamped,
    nivel_madurez: nivel,
    nivel_madurez_numero: numero,
    componentes: { exposicion: E, sensibilidad: S, capacidad: C },
    dimensiones: dimensionScores,
    bloques: bloqueScores,
    factores_vulnerabilidad: factores.slice(0, 10),
    falsa_resiliencia: fr.esFalsa,
    gap_componentes: fr.gap,
    componente_debil: fr.componenteDebil,
  };
}

// ── Mapeo nivel VITAL → managementFactor para Monte Carlo ROI ──

export function getManagementFactor(nivelNumero: 1 | 2 | 3 | 4): number {
  switch (nivelNumero) {
    case 1: return 0.85;
    case 2: return 0.95;
    case 3: return 1.00;
    case 4: return 1.10;
  }
}

// ── Mapeo nivel VITAL → score para SCN (Colateral) ──

export function getVitalScoreForSCN(nivelNumero: 1 | 2 | 3 | 4, globalIndex: number): number {
  const baseScores: Record<number, number> = { 1: 25, 2: 50, 3: 75, 4: 100 };
  const base = baseScores[nivelNumero];
  const adjustment = (globalIndex - 0.5) * 20;
  return Math.max(0, Math.min(100, base + adjustment));
}
