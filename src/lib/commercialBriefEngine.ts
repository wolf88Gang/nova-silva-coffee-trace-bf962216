/**
 * Commercial Brief Engine
 * Generates seller-facing interpretation from session summary data.
 * No backend logic — pure formatting and inference from existing data.
 */

import type { SalesSessionSummary } from '@/lib/salesSessionService';

export interface CommercialReading {
  bullets: string[];
  readiness: string;
  readinessLevel: 'ready_proposal' | 'ready_discovery' | 'ready_negotiation' | 'nurture' | 'immature' | 'unknown';
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
export type ObjectionImpact = 'blocks_decision' | 'delays_decision' | 'reduces_ticket' | 'low_risk';
export type ObjectionPriority = 'critical' | 'medium' | 'low';

export interface BattleCard {
  label: string;
  classification: ObjectionClassification;
  classificationLabel: string;
  confidence: number;
  // What it really means
  realMeaning: string;
  // Evidence
  evidence: string;
  // Commercial impact
  impact: ObjectionImpact;
  impactLabel: string;
  // Attack plan
  responseScript: string;
  strongArgument: string;
  proofToUse: string;
  validateNext: string;
  doNot: string;
  // Priority
  priority: ObjectionPriority;
  priorityLabel: string;
  // State
  status: 'pending' | 'in_progress' | 'resolved';
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
  { label: 'Propuesta', value: 'proposal' },
  { label: 'Negociación', value: 'negotiation' },
  { label: 'Seguimiento', value: 'follow_up' },
  { label: 'No avanzar todavía', value: 'hold' },
];

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  finca_privada: 'Finca privada',
  beneficio: 'Beneficio (compra + procesa)',
  exportador: 'Exportador',
  exportador_red: 'Exportador con red de productores',
  cooperativa: 'Cooperativa / Asociación',
  trader: 'Comercializador / Trader',
  // legacy fallbacks
  productor_empresarial: 'Finca privada',
  aggregator: 'Comercializador / Trader',
  beneficio_privado: 'Beneficio (compra + procesa)',
};

const IMPACT_LABELS: Record<ObjectionImpact, string> = {
  blocks_decision: 'Bloquea decisión',
  delays_decision: 'Retrasa decisión',
  reduces_ticket: 'Reduce ticket',
  low_risk: 'Riesgo bajo',
};

const PRIORITY_LABELS: Record<ObjectionPriority, string> = {
  critical: 'Crítica',
  medium: 'Media',
  low: 'Baja',
};

interface ObjectionPlaybook {
  realMeaning: string;
  impact: ObjectionImpact;
  responseScript: string;
  strongArgument: string;
  proofToUse: string;
  validateNext: string;
  doNot: string;
}

const OBJECTION_PLAYBOOKS: Record<string, ObjectionPlaybook> = {
  budget: {
    realMeaning: 'El lead no tiene claro el costo de NO resolver el problema. No se ha construido caso de negocio interno.',
    impact: 'blocks_decision',
    responseScript: '"Entiendo que el presupuesto es una variable importante. ¿Puedo preguntarte cuánto les cuesta hoy no tener trazabilidad / no cumplir EUDR / perder productores? Si lo cuantificamos juntos, el presupuesto se justifica solo."',
    strongArgument: 'Nova Silva opera con modelo escalable. No requiere inversión enterprise de entrada. Un piloto acotado permite validar ROI antes de comprometer presupuesto completo.',
    proofToUse: 'Caso de cooperativa similar que arrancó con módulo mínimo y escaló tras demostrar valor en 90 días.',
    validateNext: '¿Quién controla el presupuesto? ¿Hay ventana de planificación próxima? ¿Existe co-financiamiento disponible?',
    doNot: 'No enviar propuesta full. No negociar precio sin haber demostrado valor. No asumir que "no hay presupuesto" significa "no hay interés".',
  },
  price: {
    realMeaning: 'El lead está comparando con alternativas más baratas o con el costo de no hacer nada. No percibe valor diferencial suficiente.',
    impact: 'reduces_ticket',
    responseScript: '"¿Cuánto invierten hoy en las herramientas actuales sumando Excel, WhatsApp, tiempo del equipo y errores? Normalmente ese costo oculto supera 3x lo que cuesta Nova Silva."',
    strongArgument: 'La arquitectura offline-first de Nova Silva reduce costos de conectividad. La integración vs. reemplazo elimina costos de migración dolorosa.',
    proofToUse: 'Comparativa de costo total de propiedad: herramientas fragmentadas vs. plataforma integrada.',
    validateNext: '¿Con qué están comparando? ¿Cuál es su criterio de evaluación real?',
    doNot: 'No bajar precio sin reducir alcance. No competir en features contra ERPs genéricos.',
  },
  price_sensitivity: {
    realMeaning: 'El lead tiene presupuesto limitado o no visualiza el retorno de la inversión.',
    impact: 'reduces_ticket',
    responseScript: '"Entiendo la sensibilidad a costos. ¿Qué pasaría si arrancamos con el módulo que más impacto inmediato tiene y medimos resultados antes de ampliar?"',
    strongArgument: 'Modelo modular permite arrancar con inversión mínima. El ROI de trazabilidad EUDR se mide en acceso a mercados, no en eficiencia operativa.',
    proofToUse: 'ROI estimado por módulo. Costo de pérdida de mercado por incumplimiento EUDR.',
    validateNext: 'Confirmar cuál módulo genera impacto más rápido. Validar si hay financiamiento externo aplicable.',
    doNot: 'No hacer descuentos masivos. No presentar toda la plataforma cuando el presupuesto es limitado.',
  },
  complexity: {
    realMeaning: 'El lead tiene experiencia negativa con tecnología. Teme que la implementación sea disruptiva o requiera capacidades que no tiene.',
    impact: 'delays_decision',
    responseScript: '"¿Qué experiencia han tenido con implementaciones de tecnología antes? Lo pregunto porque Nova Silva se diseñó específicamente para equipos que NO son técnicos."',
    strongArgument: 'Interfaz diseñada para técnicos de campo, no para ingenieros. Funciona offline. Onboarding guiado. Soporte en español.',
    proofToUse: 'Mostrar caso de implementación real en cooperativa con adopción >80% en 60 días.',
    validateNext: '¿Cuántas personas usarían el sistema? ¿Tienen un champion interno?',
    doNot: 'No mostrar todas las funcionalidades a la vez. No hablar de APIs o integraciones técnicas.',
  },
  adoption_risk: {
    realMeaning: 'El lead sabe que su equipo resiste cambios. El riesgo no es la herramienta sino la gestión del cambio.',
    impact: 'delays_decision',
    responseScript: '"La adopción es el riesgo #1 en agtech. Por eso Nova Silva incluye plan de acompañamiento y métricas de adopción. ¿Puedo mostrarles cómo lo manejamos en una org similar?"',
    strongArgument: 'Plan de adopción incluido. Métricas de uso visibles desde día 1. Capacitación en campo, no en aula.',
    proofToUse: 'Métricas reales de adopción de clientes existentes.',
    validateNext: '¿Quién sería el champion interno? ¿Cuántos usuarios iniciales?',
    doNot: 'No prometer adopción automática. No ignorar la resistencia al cambio.',
  },
  timing: {
    realMeaning: 'No hay evento gatillo. El lead no siente que necesita actuar ahora.',
    impact: 'delays_decision',
    responseScript: '"¿Cuál es el costo de esperar 6 meses? Si hay temporada de compra o auditoría próxima, el sistema necesita estar operativo antes."',
    strongArgument: 'EUDR entra en vigencia con fecha fija. Las auditorías de certificación tienen calendario. Cada mes sin trazabilidad es riesgo acumulado.',
    proofToUse: 'Línea de tiempo regulatoria. Calendario de auditorías del sector.',
    validateNext: '¿Cuándo es su próxima auditoría? ¿Cuándo inicia la siguiente cosecha?',
    doNot: 'No empujar cierre cuando no hay ventana real. Nutrir, no presionar.',
  },
  authority: {
    realMeaning: 'Estás hablando con un intermediario, no con quien decide. El riesgo es invertir tiempo sin acceso al decisor.',
    impact: 'blocks_decision',
    responseScript: '"Para asegurarme de darles la mejor propuesta, ¿quién más participaría en la decisión? Me encantaría preparar material específico para cada rol."',
    strongArgument: 'Preparar resumen ejecutivo para directivos. Caso de negocio con ROI claro. No depender solo del contacto operativo.',
    proofToUse: 'Resumen ejecutivo de 2 páginas. Caso de negocio cuantificado.',
    validateNext: '¿Quién es el decisor final? ¿Podemos agendar una conversación con ellos?',
    doNot: 'No negociar con quien no puede decidir. No enviar propuesta formal sin acceso al decisor.',
  },
  internal_approval: {
    realMeaning: 'Hay burocracia o estructura de decisión lenta. El contacto quiere avanzar pero no puede solo.',
    impact: 'delays_decision',
    responseScript: '"Entiendo que necesitan aprobación interna. ¿Qué necesita ver el consejo/directiva para aprobar? Puedo preparar exactamente eso."',
    strongArgument: 'Preparar resumen ejecutivo adaptado al decisor. Entregar caso de negocio con métricas que el consejo entienda.',
    proofToUse: 'Template de caso de negocio. Resumen ejecutivo listo para directivos.',
    validateNext: '¿Cuándo es la próxima reunión de consejo? ¿Quién es el sponsor interno?',
    doNot: 'No asumir que el contacto puede decidir solo. No esperar pasivamente.',
  },
  competition: {
    realMeaning: 'El lead tiene alternativa activa. Hay riesgo real de perder contra competidor o contra el status quo.',
    impact: 'blocks_decision',
    responseScript: '"¿Qué están evaluando además de Nova Silva? Me interesa entender qué criterios son más importantes para ustedes."',
    strongArgument: 'Nova Silva es integración, no reemplazo. Arquitectura offline-first. Diseñado para café, no genérico. Soporte en español y en campo.',
    proofToUse: 'Comparativa honesta: qué hace Nova Silva que otros no. Caso de cliente que migró desde competidor.',
    validateNext: '¿Cuáles son sus criterios de evaluación? ¿Cuándo deciden?',
    doNot: 'No hablar mal del competidor. No competir solo en features. Competir en visión y acompañamiento.',
  },
  compliance_fear: {
    realMeaning: 'El lead está asustado por regulación pero no sabe qué hacer. La parálisis por miedo es real.',
    impact: 'delays_decision',
    responseScript: '"El cumplimiento regulatorio es exactamente por lo que creamos Nova Silva. ¿Puedo mostrarles cómo resolvemos EUDR paso a paso?"',
    strongArgument: 'EUDR como riesgo operativo, no solo regulatorio. Perder acceso a mercados europeos tiene costo cuantificable.',
    proofToUse: 'Flujo EUDR de Nova Silva. Costo estimado de incumplimiento.',
    validateNext: '¿Ya tuvieron auditoría? ¿Tienen deadline específico?',
    doNot: 'No usar miedo como táctica. Posicionar como solución, no como alarma.',
  },
  trust: {
    realMeaning: 'El lead no confía en la empresa, el producto o en agtech en general. Posiblemente tuvo malas experiencias.',
    impact: 'blocks_decision',
    responseScript: '"Es completamente válido ser cauto. ¿Qué les daría confianza para evaluar Nova Silva? ¿Una referencia de una org similar? ¿Un piloto sin compromiso?"',
    strongArgument: 'Clientes reales verificables. Piloto de bajo riesgo disponible. Transparencia total en pricing y capacidades.',
    proofToUse: 'Referencia de cliente existente del mismo segmento. Invitación a conversación con otro cliente.',
    validateNext: '¿Qué experiencia previa tuvieron con tecnología? ¿Qué les daría confianza?',
    doNot: 'No presionar. No sobre-prometer. Construir credibilidad con hechos.',
  },
  no_urgency: {
    realMeaning: 'No hay dolor suficiente hoy. El costo de no actuar no se siente.',
    impact: 'delays_decision',
    responseScript: '"Entiendo que no sienten urgencia hoy. ¿Puedo compartirles qué está pasando en el mercado con EUDR y cómo están reaccionando organizaciones similares?"',
    strongArgument: 'El mercado se mueve. Las regulaciones tienen fecha. Los que se preparan antes tienen ventaja competitiva.',
    proofToUse: 'Línea de tiempo del mercado. Casos de orgs que perdieron acceso por no prepararse.',
    validateNext: '¿Hay algún evento próximo que pueda cambiar la urgencia? ¿Auditoría, nuevo comprador, regulación?',
    doNot: 'No forzar urgencia falsa. Educar, no manipular.',
  },
  implementation: {
    realMeaning: 'Similar a complejidad. El lead ve la implementación como riesgo operativo.',
    impact: 'delays_decision',
    responseScript: '"La implementación es parte del servicio. No los dejamos solos. ¿Puedo mostrarles el plan típico de puesta en marcha?"',
    strongArgument: 'Onboarding guiado. Timeline de implementación claro. Soporte continuo.',
    proofToUse: 'Plan de implementación tipo. Timeline de cliente similar.',
    validateNext: '¿Cuándo sería el mejor momento para arrancar? ¿Tienen cosecha o evento que defina timing?',
    doNot: 'No minimizar el esfuerzo. Ser honesto sobre qué requiere del cliente.',
  },
};

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

  if (s.lead_type) {
    const typeLabel = CLIENT_TYPE_LABELS[s.lead_type] ?? s.lead_type;
    bullets.push(`Tipo de cliente: ${typeLabel}.`);
  }

  if (fit >= 7) bullets.push('Fit fuerte con la propuesta de valor de Nova Silva.');
  else if (fit >= 4) bullets.push('Fit moderado — se necesita refinar el posicionamiento.');
  else bullets.push('Fit débil — evaluar si este lead es prioridad.');

  if (pain >= 7) bullets.push('Dolor comercial alto — el cliente siente la necesidad.');
  else if (pain >= 4) bullets.push('Dolor moderado — el cliente reconoce problemas pero no son urgentes.');

  if (urgency >= 7) bullets.push('Urgencia alta — hay ventana de decisión activa.');
  else if (urgency < 4) bullets.push('Sin urgencia clara — no forzar cierre.');

  if (budget >= 7) bullets.push('Presupuesto confirmado o probable.');
  else if (budget < 4) bullets.push('Presupuesto no confirmado — riesgo de bloqueo financiero.');

  if (maturity < 4) bullets.push('Madurez digital baja — contemplar acompañamiento intensivo.');

  let readiness = 'Sin información suficiente';
  let readinessLevel: CommercialReading['readinessLevel'] = 'unknown';

  if (total >= 8 && budget >= 6 && urgency >= 6) {
    readiness = 'Listo para propuesta';
    readinessLevel = 'ready_proposal';
  } else if (total >= 6 && fit >= 5) {
    readiness = 'Discovery adicional';
    readinessLevel = 'ready_discovery';
  } else if (total >= 4) {
    readiness = 'Negociación temprana';
    readinessLevel = 'ready_negotiation';
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
  const validate: string[] = [];
  const materials: string[] = [];

  if ((summary.session?.score_budget_readiness ?? 0) < 5) validate.push('Confirmar capacidad presupuestaria');
  if ((summary.session?.score_urgency ?? 0) < 5) validate.push('Validar ventana de decisión');
  if (summary.objections.length > 0) validate.push('Verificar objeciones directamente con el lead');

  switch (reading.readinessLevel) {
    case 'ready_proposal':
      return { action: 'Enviar propuesta comercial', why: 'Scores, presupuesto y urgencia son favorables. El lead está listo para recibir una propuesta concreta.', validate, materials: ['Propuesta personalizada', 'Caso de negocio cuantificado'] };
    case 'ready_discovery':
      materials.push('Caso de éxito relevante al segmento');
      if (summary.objections.some(r => r.objection_type?.includes('compliance'))) {
        materials.push('Caso EUDR');
      }
      return { action: 'Profundizar discovery con foco en dolor principal', why: 'Buen fit pero falta aterrizar urgencia o presupuesto. Tu objetivo es construir caso de negocio, no vender todavía.', validate, materials };
    case 'ready_negotiation':
      return { action: 'Estructurar propuesta escalonada', why: 'Interés claro pero sin condiciones para propuesta full. Proponer alcance mínimo que demuestre valor.', validate, materials: ['Propuesta modular', 'ROI estimado por módulo'] };
    case 'nurture':
      return { action: 'No enviar propuesta todavía', why: 'El lead está en fase de validación interna. Tu objetivo no es vender ahora, es armar caso de negocio para sponsor.', validate: ['Identificar sponsor interno', 'Validar si hay evento gatillo próximo'], materials: ['Caso de estudio relevante', 'Resumen ejecutivo para decisor'] };
    default:
      return { action: 'Validar sponsor interno primero', why: 'Lead aún inmaduro para avanzar comercialmente. Enfocarse en educación y construcción de relación.', validate: ['¿Quién decide?', '¿Cuándo podría haber presupuesto?', '¿Hay evento regulatorio próximo?'], materials: [] };
  }
}

export function generateSuggestedPitch(summary: SalesSessionSummary): SuggestedPitch {
  const s = summary.session;
  if (!s) return { angle: 'Discovery general', reasoning: 'Sin datos suficientes para definir ángulo.' };

  const pain = s.score_pain ?? 0;
  const fit = s.score_fit ?? 0;
  const hasComplianceObj = summary.objections.some(o => o.objection_type?.includes('compliance'));

  if (hasComplianceObj || pain >= 7) {
    return { angle: 'Abrir por cumplimiento y riesgo comercial', reasoning: 'El dolor principal gira alrededor de presión regulatoria o acceso a mercados. Posicionar EUDR como riesgo operativo, no solo regulatorio.' };
  }
  if (fit >= 7) {
    return { angle: 'Abrir por control operativo y visibilidad', reasoning: 'El fit es alto — posicionar Nova Silva como plataforma de gestión integral que elimina fragmentación.' };
  }
  if ((s.score_budget_readiness ?? 0) >= 6) {
    return { angle: 'Abrir por ROI y retorno medible', reasoning: 'Presupuesto disponible — enfocar en métricas de retorno concretas y timeline de implementación.' };
  }
  return { angle: 'Abrir por caso de éxito similar', reasoning: 'Perfil aún en exploración — usar evidencia de clientes similares para construir credibilidad.' };
}

export function classifyObjections(summary: SalesSessionSummary): BattleCard[] {
  return summary.objections.map(o => {
    const raw = o.objection_type ?? 'unknown';
    const label = OBJECTION_LABELS[raw] ?? raw.replace(/_/g, ' ');
    const conf = o.confidence ?? 0.5;

    let classification: ObjectionClassification = 'inferred';
    let classificationLabel = 'Inferida';
    if (conf >= 0.85) {
      classification = 'confirmed';
      classificationLabel = 'Confirmada';
    } else if (conf >= 0.6) {
      classification = 'declared';
      classificationLabel = 'Declarada';
    }

    const playbook = OBJECTION_PLAYBOOKS[raw];
    const defaults: ObjectionPlaybook = {
      realMeaning: 'Fricción detectada por el sistema. Validar directamente con el lead.',
      impact: 'delays_decision',
      responseScript: '"¿Puedes contarme más sobre qué les preocupa en este tema?"',
      strongArgument: 'Validar con el lead antes de construir argumento específico.',
      proofToUse: 'Caso de cliente similar al segmento del lead.',
      validateNext: 'Confirmar si esta objeción es real o solo percepción.',
      doNot: 'No asumir sin confirmar. No responder defensivamente.',
    };

    const pb = playbook ?? defaults;

    // Priority based on confidence + impact
    let priority: ObjectionPriority = 'low';
    if (conf >= 0.7 || pb.impact === 'blocks_decision') priority = 'critical';
    else if (conf >= 0.5) priority = 'medium';

    return {
      label,
      classification,
      classificationLabel,
      confidence: conf,
      realMeaning: pb.realMeaning,
      evidence: `Confianza ${Math.round(conf * 100)}% basada en respuestas del diagnóstico.`,
      impact: pb.impact,
      impactLabel: IMPACT_LABELS[pb.impact],
      responseScript: pb.responseScript,
      strongArgument: pb.strongArgument,
      proofToUse: pb.proofToUse,
      validateNext: pb.validateNext,
      doNot: pb.doNot,
      priority,
      priorityLabel: PRIORITY_LABELS[priority],
      status: 'pending' as const,
    };
  }).sort((a, b) => {
    const pOrder = { critical: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
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
  ready_discovery: { label: 'Discovery adicional', color: 'text-primary' },
  ready_negotiation: { label: 'Negociación temprana', color: 'text-foreground' },
  nurture: { label: 'No empujar todavía', color: 'text-amber-600 dark:text-amber-400' },
  immature: { label: 'Lead aún inmaduro', color: 'text-destructive' },
  unknown: { label: 'Sin información suficiente', color: 'text-muted-foreground' },
};
