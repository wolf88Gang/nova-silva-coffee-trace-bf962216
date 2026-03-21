/**
 * Commercial Brief Engine
 * Generates seller-facing interpretation from session summary data.
 * No backend logic — pure formatting and inference from existing data.
 */

import type { SalesSessionSummary } from '@/lib/salesSessionService';

/* ══════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════ */

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
  realMeaning: string;
  evidence: string;
  impact: ObjectionImpact;
  impactLabel: string;
  /** Seller's commercial objective when handling this objection */
  sellerObjective: string;
  /** How to position Nova Silva specifically against this objection */
  novaSilvaAngle: string;
  /** Short script for live calls */
  shortScript: string;
  /** Developed script for meetings */
  fullScript: string;
  /** What to say if client pushes back again */
  secondResponse: string;
  /** Concrete supporting arguments */
  strongArguments: string[];
  /** Specific proof/material to prepare */
  proofAssets: string[];
  /** Tactical question to regain control */
  tacticalQuestion: string;
  /** Explicit anti-patterns */
  doNot: string[];
  /** How client may phrase this objection */
  clientVariations: string[];
  /** What to do if unresolved in-call */
  escalationPath: string;
  /** Draft follow-up message */
  followUpDraft: string;
  priority: ObjectionPriority;
  priorityLabel: string;
  status: 'pending' | 'in_progress' | 'resolved';
  cluster: FrictionClusterKey;
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

/* ── Friction Clusters ── */
export type FrictionClusterKey =
  | 'budget_value'
  | 'trust_credibility'
  | 'complexity_adoption'
  | 'timing_approval'
  | 'competition'
  | 'compliance_risk';

export interface FrictionCluster {
  key: FrictionClusterKey;
  label: string;
  active: boolean;
  severity: 'alto' | 'medio' | 'bajo';
  meaning: string;
  sellerStance: string;
  cards: BattleCard[];
}

/* ── Account Playbook ── */
export interface AccountPlaybook {
  openingRecommendation: string;
  centralThesis: string;
  sequence: string[];
  biggestRisk: string;
  riskMitigation: string[];
  bestNextQuestion: string;
}

/* ── Commercial Hypothesis ── */
export interface CommercialHypothesis {
  paragraph: string;
}

/* ── Meeting Objective ── */
export interface MeetingObjective {
  objective: string;
}

/* ══════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════ */

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

/* ── Cluster mapping: which objection types belong to which cluster ── */
const OBJECTION_TO_CLUSTER: Record<string, FrictionClusterKey> = {
  budget: 'budget_value',
  price: 'budget_value',
  price_sensitivity: 'budget_value',
  trust: 'trust_credibility',
  complexity: 'complexity_adoption',
  adoption_risk: 'complexity_adoption',
  implementation: 'complexity_adoption',
  timing: 'timing_approval',
  authority: 'timing_approval',
  internal_approval: 'timing_approval',
  no_urgency: 'timing_approval',
  competition: 'competition',
  compliance_fear: 'compliance_risk',
};

const CLUSTER_META: Record<FrictionClusterKey, { label: string; meaning: string; stance: string }> = {
  budget_value: {
    label: 'Presupuesto / valor',
    meaning: 'El cliente no percibe suficiente valor para justificar la inversión, o no tiene presupuesto confirmado.',
    stance: 'No vender precio. Vender costo de no actuar y ROI medible. Proponer alcance mínimo viable.',
  },
  trust_credibility: {
    label: 'Confianza / credibilidad',
    meaning: 'El lead no confía en la empresa, el producto o en agtech en general. Posiblemente tuvo malas experiencias.',
    stance: 'No presionar. Construir credibilidad con hechos, referencias verificables y transparencia total.',
  },
  complexity_adoption: {
    label: 'Complejidad / adopción',
    meaning: 'El cliente teme esfuerzo, cambio interno y dificultad de implementación.',
    stance: 'No vender amplitud. Vender acompañamiento, arranque acotado y control operativo.',
  },
  timing_approval: {
    label: 'Timing / aprobación interna',
    meaning: 'No hay evento gatillo, o la decisión depende de terceros internos. La venta se alarga.',
    stance: 'No forzar cierre. Identificar sponsor, preparar material para decisores y nutrir la relación.',
  },
  competition: {
    label: 'Competencia / alternativa',
    meaning: 'El lead tiene alternativa activa o el status quo es "suficiente". Riesgo real de perder.',
    stance: 'No competir en features. Competir en visión, acompañamiento y diseño para café.',
  },
  compliance_risk: {
    label: 'Cumplimiento / riesgo regulatorio',
    meaning: 'El lead está asustado por regulación pero paralizado. No sabe qué hacer primero.',
    stance: 'Posicionar como solución, no como alarma. Mostrar flujo EUDR paso a paso y cuantificar riesgo.',
  },
};

/* ── Playbooks ── */
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

/* ══════════════════════════════════════════════════
   GENERATORS
   ══════════════════════════════════════════════════ */

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
    bullets.push(`Tipo de cliente: ${CLIENT_TYPE_LABELS[s.lead_type] ?? s.lead_type}.`);
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
      if (summary.objections.some(r => r.objection_type?.includes('compliance'))) materials.push('Caso EUDR');
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

/* ── Objection classification with cluster assignment ── */
export function classifyObjections(summary: SalesSessionSummary): BattleCard[] {
  return summary.objections.map(o => {
    const raw = o.objection_type ?? 'unknown';
    const label = OBJECTION_LABELS[raw] ?? raw.replace(/_/g, ' ');
    const conf = o.confidence ?? 0.5;

    let classification: ObjectionClassification = 'inferred';
    let classificationLabel = 'Inferida';
    if (conf >= 0.85) { classification = 'confirmed'; classificationLabel = 'Confirmada'; }
    else if (conf >= 0.6) { classification = 'declared'; classificationLabel = 'Declarada'; }

    const pb = OBJECTION_PLAYBOOKS[raw] ?? {
      realMeaning: 'Fricción detectada por el sistema. Validar directamente con el lead.',
      impact: 'delays_decision' as ObjectionImpact,
      responseScript: '"¿Puedes contarme más sobre qué les preocupa en este tema?"',
      strongArgument: 'Validar con el lead antes de construir argumento específico.',
      proofToUse: 'Caso de cliente similar al segmento del lead.',
      validateNext: 'Confirmar si esta objeción es real o solo percepción.',
      doNot: 'No asumir sin confirmar. No responder defensivamente.',
    };

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
      cluster: OBJECTION_TO_CLUSTER[raw] ?? 'complexity_adoption',
    };
  }).sort((a, b) => {
    const pOrder = { critical: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

/* ── Build friction clusters from battle cards ── */
export function buildFrictionClusters(cards: BattleCard[]): FrictionCluster[] {
  const clusterKeys = Object.keys(CLUSTER_META) as FrictionClusterKey[];
  return clusterKeys
    .map(key => {
      const meta = CLUSTER_META[key];
      const clusterCards = cards.filter(c => c.cluster === key);
      const active = clusterCards.length > 0;
      const hasCritical = clusterCards.some(c => c.priority === 'critical');
      const severity: FrictionCluster['severity'] = !active ? 'bajo' : hasCritical ? 'alto' : clusterCards.some(c => c.priority === 'medium') ? 'medio' : 'bajo';
      return {
        key,
        label: meta.label,
        active,
        severity,
        meaning: meta.meaning,
        sellerStance: meta.stance,
        cards: clusterCards,
      };
    })
    .filter(c => c.active)
    .sort((a, b) => {
      const sOrder = { alto: 0, medio: 1, bajo: 2 };
      return sOrder[a.severity] - sOrder[b.severity];
    });
}

/* ── Commercial hypothesis ── */
export function generateHypothesis(summary: SalesSessionSummary, reading: CommercialReading, clusters: FrictionCluster[]): CommercialHypothesis {
  const s = summary.session;
  if (!s) return { paragraph: 'Sin datos suficientes para generar hipótesis comercial.' };

  const pain = s.score_pain ?? 0;
  const urgency = s.score_urgency ?? 0;
  const budget = s.score_budget_readiness ?? 0;
  const fit = s.score_fit ?? 0;

  const parts: string[] = [];

  // Opening: what the lead recognizes
  if (pain >= 6) parts.push('El lead reconoce dolor operativo o comercial significativo');
  else if (pain >= 3) parts.push('El lead identifica problemas pero no los percibe como urgentes');
  else parts.push('El lead aún no articula un dolor claro');

  // Urgency
  if (urgency >= 6) parts.push('y tiene ventana de decisión activa');
  else parts.push('pero no hay urgencia definida');

  // What's blocking
  const topCluster = clusters[0];
  if (topCluster) {
    parts.push(`. La fricción principal es ${topCluster.label.toLowerCase()}`);
  }

  // Recommendation
  if (budget >= 6 && fit >= 6) {
    parts.push('. La venta debe avanzar hacia propuesta concreta con caso de negocio cuantificado.');
  } else if (fit >= 5) {
    parts.push('. La venta no debe empujarse desde features sino desde riesgo operativo, visibilidad y acompañamiento.');
  } else {
    parts.push('. El foco debe estar en educación y construcción de relación antes de cualquier propuesta.');
  }

  return { paragraph: parts.join('') };
}

/* ── Account playbook ── */
export function generateAccountPlaybook(
  summary: SalesSessionSummary,
  reading: CommercialReading,
  pitch: SuggestedPitch,
  clusters: FrictionCluster[],
): AccountPlaybook {
  const s = summary.session;
  const topCluster = clusters[0];
  const urgency = s?.score_urgency ?? 0;
  const budget = s?.score_budget_readiness ?? 0;

  const opening = pitch.angle;

  const sequence: string[] = [
    `Abrir con: ${pitch.angle.toLowerCase()}`,
  ];
  if (budget < 5) sequence.push('Validar capacidad presupuestaria antes de presentar alcance');
  if (urgency < 5) sequence.push('Identificar evento gatillo que justifique actuar ahora');
  if (topCluster) sequence.push(`Abordar fricción principal: ${topCluster.label.toLowerCase()}`);
  sequence.push('Cerrar con siguiente paso concreto y fecha');

  let biggestRisk = 'Pérdida de momentum por falta de urgencia o sponsor interno.';
  if (topCluster?.key === 'competition') biggestRisk = 'Perder contra competidor o contra el status quo. El lead tiene alternativa activa.';
  else if (topCluster?.key === 'budget_value') biggestRisk = 'Bloqueo financiero. El lead no logra justificar la inversión internamente.';
  else if (topCluster?.key === 'timing_approval') biggestRisk = 'Ciclo de decisión largo. La venta muere por inercia organizacional.';

  const mitigation: string[] = [];
  if (topCluster?.key === 'budget_value') {
    mitigation.push('Construir caso de negocio con ROI cuantificado');
    mitigation.push('Proponer alcance mínimo para demostrar valor rápido');
  } else if (topCluster?.key === 'timing_approval') {
    mitigation.push('Identificar sponsor interno');
    mitigation.push('Preparar resumen ejecutivo para decisor');
    mitigation.push('Proponer fecha límite vinculada a evento real');
  } else if (topCluster?.key === 'competition') {
    mitigation.push('Diferenciarse por visión y acompañamiento, no por features');
    mitigation.push('Ofrecer referencia verificable de cliente similar');
  } else {
    mitigation.push('Validar objeciones directamente con el lead');
    mitigation.push('Reducir percepción de riesgo con evidencia concreta');
  }

  let bestNextQuestion = '¿Quién más participaría en esta decisión?';
  if (budget < 4) bestNextQuestion = '¿Tienen presupuesto asignado o necesitan justificarlo internamente?';
  else if (urgency < 4) bestNextQuestion = '¿Hay algún evento próximo que haga esto más urgente — auditoría, cosecha, regulación?';
  else if (topCluster?.key === 'trust_credibility') bestNextQuestion = '¿Qué les daría confianza para avanzar — una referencia, un piloto, una conversación con otro cliente?';

  return {
    openingRecommendation: opening,
    centralThesis: pitch.reasoning,
    sequence,
    biggestRisk,
    riskMitigation: mitigation,
    bestNextQuestion,
  };
}

/* ── Meeting objective ── */
export function generateMeetingObjective(reading: CommercialReading, clusters: FrictionCluster[]): MeetingObjective {
  const topCluster = clusters[0];
  switch (reading.readinessLevel) {
    case 'ready_proposal':
      return { objective: 'Confirmar decisor, presentar propuesta y definir siguiente paso formal.' };
    case 'ready_discovery':
      return { objective: topCluster ? `Validar hipótesis de ${topCluster.label.toLowerCase()} y construir caso de negocio.` : 'Profundizar dolor principal y aterrizar urgencia.' };
    case 'ready_negotiation':
      return { objective: 'Presentar propuesta modular y negociar alcance mínimo viable.' };
    case 'nurture':
      return { objective: 'Identificar sponsor interno y compartir material de credibilidad.' };
    default:
      return { objective: 'Educar al lead y evaluar si hay potencial real de avance.' };
  }
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

/* ══════════════════════════════════════════════════
   LABEL MAPS
   ══════════════════════════════════════════════════ */

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
