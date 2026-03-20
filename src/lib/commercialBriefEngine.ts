/**
 * Commercial Brief Engine
 * Generates seller-facing interpretation from session summary data.
 * No backend logic — pure formatting and inference from existing data.
 */

import type { SalesSessionSummary } from '@/lib/salesSessionService';

export interface CommercialReading {
  bullets: string[];
  readiness: string;
  readinessLevel: 'ready_proposal' | 'ready_demo' | 'ready_pilot' | 'nurture' | 'immature' | 'unknown';
}

export interface NextAction {
  action: string;
  why: string;
  validate: string[];
  materials: string[];
}

export interface SuggestedPitch {
  angle: string;
  reasoning: string;
}

export type ObjectionClassification = 'inferred' | 'declared' | 'confirmed';

export interface ClassifiedObjection {
  label: string;
  classification: ObjectionClassification;
  classificationLabel: string;
  confidence: number;
  why: string;
  handling: string;
  doNot: string;
}

export interface ClassifiedRecommendation {
  label: string;
  detail: string;
  priority: number | null;
}

export interface CommercialPhase {
  label: string;
  value: string;
}

export const COMMERCIAL_PHASES: CommercialPhase[] = [
  { label: 'Discovery adicional', value: 'discovery' },
  { label: 'Demo', value: 'demo' },
  { label: 'Piloto', value: 'pilot' },
  { label: 'Propuesta', value: 'proposal' },
  { label: 'Seguimiento', value: 'follow_up' },
  { label: 'No avanzar todavía', value: 'hold' },
];

const OBJECTION_LABELS: Record<string, string> = {
  budget: 'Capacidad presupuestaria',
  price: 'Precio',
  price_sensitivity: 'Sensibilidad a precio',
  complexity: 'Complejidad percibida',
  adoption_risk: 'Riesgo de adopción',
  timing: 'Timing / ventana de decisión',
  authority: 'Autoridad de compra',
  competition: 'Competencia / alternativa existente',
  trust: 'Confianza / credibilidad',
  implementation: 'Dificultad de implementación',
  internal_approval: 'Aprobación interna',
  compliance_fear: 'Temor por cumplimiento',
  no_urgency: 'Sin urgencia percibida',
};

const OBJECTION_HANDLING: Record<string, { handling: string; doNot: string }> = {
  budget: {
    handling: 'Mover conversación a ROI y cumplimiento. Reducir alcance a piloto acotado.',
    doNot: 'No enviar propuesta full de inmediato.',
  },
  price: {
    handling: 'Demostrar valor por módulo. Proponer modelo escalable.',
    doNot: 'No negociar precio sin haber demostrado valor.',
  },
  price_sensitivity: {
    handling: 'Demostrar valor por módulo. Proponer modelo escalable.',
    doNot: 'No negociar precio sin haber demostrado valor.',
  },
  complexity: {
    handling: 'Mostrar implementación real de un caso similar. Enfatizar acompañamiento.',
    doNot: 'No mostrar todas las funcionalidades a la vez.',
  },
  adoption_risk: {
    handling: 'Proponer piloto con alcance limitado. Presentar métricas de adopción reales.',
    doNot: 'No prometer adopción sin plan de acompañamiento.',
  },
  timing: {
    handling: 'Validar ventana real de decisión. Si no hay urgencia, nutrir relación.',
    doNot: 'No empujar cierre cuando no hay ventana.',
  },
  authority: {
    handling: 'Identificar sponsor interno. Preparar resumen ejecutivo para decisor.',
    doNot: 'No negociar con quien no puede decidir.',
  },
  internal_approval: {
    handling: 'Preparar resumen ejecutivo. Entregar caso de negocio corto. Identificar sponsor.',
    doNot: 'No asumir que el contacto puede decidir solo.',
  },
};

const REC_LABELS: Record<string, string> = {
  pitch: 'Enfoque de conversación',
  demo: 'Demo sugerida',
  plan: 'Ruta comercial',
  next_step: 'Siguiente acción',
  pilot: 'Piloto recomendado',
  proposal: 'Propuesta sugerida',
  discovery: 'Discovery adicional',
  follow_up: 'Seguimiento',
  nurture: 'Nutrir relación',
  material: 'Material recomendado',
};

export function generateCommercialReading(summary: SalesSessionSummary): CommercialReading {
  const s = summary.session;
  if (!s) return { bullets: ['Sin datos de sesión disponibles.'], readiness: 'Sin información suficiente', readinessLevel: 'unknown' };

  const bullets: string[] = [];
  const total = s.score_total ?? 0;
  const pain = s.score_pain ?? 0;
  const fit = s.score_fit ?? 0;
  const urgency = s.score_urgency ?? 0;
  const budget = s.score_budget_readiness ?? 0;
  const maturity = s.score_maturity ?? 0;

  // Client type
  if (s.lead_type) {
    const typeLabel = OBJECTION_LABELS[s.lead_type] ?? s.lead_type;
    bullets.push(`Tipo de cliente: ${typeLabel}.`);
  }

  // Strongest fit
  if (fit >= 7) bullets.push('Fit fuerte con la propuesta de valor de Nova Silva.');
  else if (fit >= 4) bullets.push('Fit moderado — se necesita refinar el posicionamiento.');
  else bullets.push('Fit débil — evaluar si este lead es prioridad.');

  // Pain
  if (pain >= 7) bullets.push('Dolor comercial alto — el cliente siente la necesidad.');
  else if (pain >= 4) bullets.push('Dolor moderado — el cliente reconoce problemas pero no son urgentes.');

  // Urgency
  if (urgency >= 7) bullets.push('Urgencia alta — hay ventana de decisión activa.');
  else if (urgency < 4) bullets.push('Sin urgencia clara — no forzar cierre.');

  // Budget
  if (budget >= 7) bullets.push('Presupuesto confirmado o probable.');
  else if (budget < 4) bullets.push('Presupuesto no confirmado — riesgo de bloqueo financiero.');

  // Maturity
  if (maturity < 4) bullets.push('Madurez digital baja — contemplar acompañamiento intensivo.');

  // Readiness
  let readiness = 'Sin información suficiente';
  let readinessLevel: CommercialReading['readinessLevel'] = 'unknown';

  if (total >= 8 && budget >= 6 && urgency >= 6) {
    readiness = 'Listo para propuesta';
    readinessLevel = 'ready_proposal';
  } else if (total >= 6 && fit >= 5) {
    readiness = 'Listo para demo';
    readinessLevel = 'ready_demo';
  } else if (total >= 4) {
    readiness = 'Listo para piloto';
    readinessLevel = 'ready_pilot';
  } else if (total >= 2) {
    readiness = 'No empujar todavía';
    readinessLevel = 'nurture';
  } else {
    readiness = 'Lead aún inmaduro';
    readinessLevel = 'immature';
  }

  return { bullets, readiness, readinessLevel };
}

export function generateNextAction(summary: SalesSessionSummary, reading: CommercialReading): NextAction {
  const recs = summary.recommendations;
  const validate: string[] = [];
  const materials: string[] = [];

  if ((summary.session?.score_budget_readiness ?? 0) < 5) validate.push('Confirmar capacidad presupuestaria');
  if ((summary.session?.score_urgency ?? 0) < 5) validate.push('Validar ventana de decisión');
  if (summary.objections.length > 0) validate.push('Verificar objeciones directamente con el lead');

  switch (reading.readinessLevel) {
    case 'ready_proposal':
      return { action: 'Enviar propuesta comercial', why: 'Scores, presupuesto y urgencia son favorables.', validate, materials: ['Propuesta personalizada', 'Caso de negocio'] };
    case 'ready_demo':
      materials.push('Demo enfocada en el dolor principal');
      if (recs.some(r => r.recommendation_type?.includes('eudr') || r.recommendation_type?.includes('compliance'))) {
        materials.push('Caso EUDR');
      }
      return { action: 'Agendar demo enfocada', why: 'Buen fit pero falta aterrizar urgencia o presupuesto.', validate, materials };
    case 'ready_pilot':
      return { action: 'Proponer piloto acotado', why: 'Interés claro pero sin condiciones para propuesta full.', validate, materials: ['Piloto de bajo riesgo', 'ROI estimado'] };
    case 'nurture':
      return { action: 'No enviar propuesta todavía', why: 'Lead interesante pero sin urgencia ni presupuesto.', validate: ['Identificar sponsor interno', 'Validar si hay evento gatillo próximo'], materials: ['Caso de estudio relevante'] };
    default:
      return { action: 'Validar sponsor interno primero', why: 'Lead aún inmaduro para avanzar comercialmente.', validate: ['¿Quién decide?', '¿Cuándo podría haber presupuesto?'], materials: [] };
  }
}

export function generateSuggestedPitch(summary: SalesSessionSummary): SuggestedPitch {
  const s = summary.session;
  if (!s) return { angle: 'Discovery general', reasoning: 'Sin datos suficientes para definir ángulo.' };

  const pain = s.score_pain ?? 0;
  const fit = s.score_fit ?? 0;
  const hasComplianceObj = summary.objections.some(o => o.objection_type?.includes('compliance'));

  if (hasComplianceObj || pain >= 7) {
    return { angle: 'Abrir por cumplimiento y riesgo comercial', reasoning: 'El dolor principal gira alrededor de presión regulatoria o acceso a mercados.' };
  }
  if (fit >= 7) {
    return { angle: 'Abrir por control operativo y visibilidad', reasoning: 'El fit es alto — posicionar Nova Silva como plataforma de gestión integral.' };
  }
  if ((s.score_budget_readiness ?? 0) >= 6) {
    return { angle: 'Abrir por ROI y retorno medible', reasoning: 'Presupuesto disponible — enfocar en métricas de retorno.' };
  }
  return { angle: 'Abrir por caso de éxito similar', reasoning: 'Perfil aún en exploración — usar evidencia de clientes similares.' };
}

export function classifyObjections(summary: SalesSessionSummary): ClassifiedObjection[] {
  return summary.objections.map(o => {
    const raw = o.objection_type ?? 'unknown';
    const label = OBJECTION_LABELS[raw] ?? raw.replace(/_/g, ' ');
    const conf = o.confidence ?? 0.5;

    // Classification heuristic
    let classification: ObjectionClassification = 'inferred';
    let classificationLabel = 'Inferida';
    if (conf >= 0.85) {
      classification = 'confirmed';
      classificationLabel = 'Confirmada';
    } else if (conf >= 0.6) {
      classification = 'declared';
      classificationLabel = 'Declarada';
    }

    const defaults = OBJECTION_HANDLING[raw] ?? {
      handling: 'Validar directamente con el lead antes de actuar.',
      doNot: 'No asumir sin confirmar.',
    };

    return {
      label,
      classification,
      classificationLabel,
      confidence: conf,
      why: `Confianza ${Math.round(conf * 100)}% basada en respuestas del diagnóstico.`,
      handling: defaults.handling,
      doNot: defaults.doNot,
    };
  });
}

export function classifyRecommendations(summary: SalesSessionSummary): ClassifiedRecommendation[] {
  return summary.recommendations.map(r => {
    const raw = r.recommendation_type ?? 'unknown';
    return {
      label: REC_LABELS[raw] ?? raw.replace(/_/g, ' '),
      detail: raw,
      priority: r.priority,
    };
  });
}

export const SCORE_COMMERCIAL_LABELS: Record<string, string> = {
  score_pain: 'Dolor comercial',
  score_maturity: 'Madurez operativa',
  score_urgency: 'Urgencia',
  score_fit: 'Fit con Nova Silva',
  score_budget_readiness: 'Capacidad presupuestaria',
  score_objection: 'Riesgo de objeción',
  score_total: 'Score total',
};

export const READINESS_LABELS: Record<CommercialReading['readinessLevel'], { label: string; color: string }> = {
  ready_proposal: { label: 'Listo para propuesta', color: 'text-primary' },
  ready_demo: { label: 'Listo para demo', color: 'text-primary' },
  ready_pilot: { label: 'Listo para piloto', color: 'text-foreground' },
  nurture: { label: 'No empujar todavía', color: 'text-amber-600 dark:text-amber-400' },
  immature: { label: 'Lead aún inmaduro', color: 'text-destructive' },
  unknown: { label: 'Sin información suficiente', color: 'text-muted-foreground' },
};
