/**
 * useRadixPreguntasOrg — Hook placeholder para preguntas organizacionales RADIX.
 * 
 * Las tablas radix_bloques_org y radix_preguntas_org NO existen aún en la DB.
 * Mientras tanto, devuelve datos del config estático diagnosticoCooperativa.ts.
 * 
 * Source: Guía Completa del Protocolo VITAL v2.0
 */
import { useMemo } from 'react';
import { VITAL_ORG_BLOCKS, type VitalOrgBlock } from '@/config/vitalOrgQuestions';

export type NivelMadurezOrg = 1 | 2 | 3 | 4;

export const NIVEL_MADUREZ_LABELS: Record<NivelMadurezOrg, string> = {
  1: 'Nivel 1 - Vulnerable',
  2: 'Nivel 2 - En Transición',
  3: 'Nivel 3 - Resiliente',
  4: 'Nivel 4 - Regenerativo',
};

export function scoreToNivelMadurez(score: number): NivelMadurezOrg {
  if (score >= 75) return 4;
  if (score >= 50) return 3;
  if (score >= 25) return 2;
  return 1;
}

export type RecomendacionOrg = 'implementacion_completa' | 'piloto_parcial' | 'fortalecimiento_previo';

export const RECOMENDACION_TEXTOS: Record<RecomendacionOrg, string> = {
  implementacion_completa: 'La organización demuestra capacidades sólidas en las dimensiones críticas. Puede implementar el Protocolo VITAL completo, incluyendo trazabilidad EUDR, digitalización de productores y gestión de riesgos integrados.',
  piloto_parcial: 'La organización tiene capacidades básicas pero requiere acompañamiento en áreas específicas. Recomendamos comenzar con un piloto acotado: una zona geográfica, un grupo de productores certificados, o un módulo específico.',
  fortalecimiento_previo: 'Existen brechas importantes en dimensiones críticas (Gobernanza, Equipo Técnico o Sistemas de Datos). Antes de implementar herramientas digitales de trazabilidad, es necesario fortalecer la base institucional.',
};

/**
 * Hook para obtener bloques y preguntas organizacionales.
 * Actualmente retorna datos estáticos. Cuando las tablas RADIX existan,
 * se reemplazará con queries a Supabase.
 */
export function useRadixPreguntasOrg() {
  const bloques = useMemo(() => VITAL_ORG_BLOCKS, []);

  return {
    bloques,
    isLoading: false,
    isError: false,
    totalPreguntas: bloques.reduce((s, b) => s + b.questions.length, 0),
  };
}

/**
 * Calcula el IGRN organizacional y genera recomendación.
 */
export function calcularIndiceVITALOrg(
  answers: Record<number, number>,
  bloques: VitalOrgBlock[]
): {
  indiceGlobal: number;
  nivelMadurez: NivelMadurezOrg;
  recomendacion: RecomendacionOrg;
  byBlock: Record<string, { score: number; nivelMadurez: NivelMadurezOrg }>;
  bloquesCriticosEnRojo: string[];
  falsaResiliencia: boolean;
} {
  const byBlock: Record<string, { score: number; nivelMadurez: NivelMadurezOrg }> = {};
  const bloquesCriticosEnRojo: string[] = [];

  for (const block of bloques) {
    const scores = block.questions
      .map(q => answers[q.id])
      .filter(s => s !== undefined && s !== null);
    const scorePct = scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
      : 0;
    const nivel = scoreToNivelMadurez(scorePct);
    byBlock[block.id] = { score: scorePct, nivelMadurez: nivel };

    // Check critical blocks
    if (block.id === 'gobernanza' || block.id === 'cumplimiento') {
      if (nivel === 1) bloquesCriticosEnRojo.push(block.id);
    }
  }

  const indiceGlobal = bloques.reduce(
    (sum, b) => sum + b.weight * (byBlock[b.id]?.score ?? 0), 0
  );
  const nivelMadurez = scoreToNivelMadurez(indiceGlobal);

  // Falsa resiliencia
  const vals = Object.values(byBlock).map(v => v.score / 100);
  const maxDiff = vals.length > 1 ? Math.max(...vals) - Math.min(...vals) : 0;

  // Recomendación
  let recomendacion: RecomendacionOrg;
  if (bloquesCriticosEnRojo.length > 0) {
    recomendacion = 'fortalecimiento_previo';
  } else if (nivelMadurez >= 3) {
    recomendacion = 'implementacion_completa';
  } else {
    recomendacion = 'piloto_parcial';
  }

  return {
    indiceGlobal,
    nivelMadurez,
    recomendacion,
    byBlock,
    bloquesCriticosEnRojo,
    falsaResiliencia: maxDiff >= 0.4,
  };
}
