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

/* ── Deep Playbooks ── */
interface ObjectionPlaybook {
  realMeaning: string;
  impact: ObjectionImpact;
  sellerObjective: string;
  novaSilvaAngle: string;
  shortScript: string;
  fullScript: string;
  secondResponse: string;
  strongArguments: string[];
  proofAssets: string[];
  tacticalQuestion: string;
  doNot: string[];
  clientVariations: string[];
  escalationPath: string;
  followUpDraft: string;
}

const OBJECTION_PLAYBOOKS: Record<string, ObjectionPlaybook> = {
  budget: {
    realMeaning: 'El lead no tiene claro el costo de NO resolver el problema. No se ha construido caso de negocio interno.',
    impact: 'blocks_decision',
    sellerObjective: 'Mover la conversación de "cuánto cuesta Nova Silva" a "cuánto cuesta no tener trazabilidad ni control operativo".',
    novaSilvaAngle: 'Modelo modular que permite arrancar con inversión mínima y escalar tras demostrar valor. No es enterprise de entrada.',
    shortScript: '"Entiendo que el presupuesto es clave. ¿Puedo preguntarte cuánto les cuesta hoy la falta de trazabilidad, los errores manuales y el riesgo de incumplimiento? Si lo cuantificamos juntos, el presupuesto se justifica solo."',
    fullScript: '"Es completamente válido evaluar el presupuesto con cuidado. Lo que hemos visto en organizaciones similares es que el costo oculto de operar sin trazabilidad —Excel disperso, errores de registro, riesgo de perder acceso a mercados por EUDR— supera con creces la inversión en Nova Silva. No proponemos una compra enterprise. Proponemos arrancar con el módulo que más impacto tiene para ustedes hoy, medir resultados en 60-90 días, y escalar con datos reales."',
    secondResponse: '"Totalmente válido. Entonces hagamos un ejercicio: calculemos juntos cuánto les cuesta hoy un solo incidente de no-conformidad o una pérdida de acceso a comprador europeo. Si ese número supera la inversión de un piloto acotado, tiene sentido avanzar. Si no, al menos tenemos datos reales para la conversación."',
    strongArguments: [
      'Nova Silva no requiere inversión enterprise de entrada — se puede arrancar con un módulo específico',
      'El ROI de trazabilidad EUDR se mide en acceso a mercados, no solo en eficiencia operativa',
      'El costo de no-conformidad regulatoria es cuantificable y creciente',
      'Modelo de licenciamiento escalable según productores activos',
    ],
    proofAssets: ['ROI estimado por módulo', 'Caso de cooperativa que arrancó con módulo mínimo y escaló en 90 días', 'Comparativa de costo oculto: herramientas fragmentadas vs plataforma integrada'],
    tacticalQuestion: '"¿Quién controla el presupuesto de tecnología? ¿Hay ventana de planificación próxima donde podamos presentar un caso de negocio?"',
    doNot: ['No enviar propuesta full antes de demostrar valor', 'No negociar precio sin haber construido caso de negocio', 'No asumir que "no hay presupuesto" significa "no hay interés"'],
    clientVariations: ['"No tenemos presupuesto para esto"', '"Es muy caro"', '"No estaba planificado en el presupuesto de este año"', '"Tendríamos que buscar financiamiento externo"'],
    escalationPath: 'Preparar caso de negocio cuantificado para presentar al decisor financiero. Si hay co-financiamiento disponible, mapear opciones.',
    followUpDraft: 'Hola [nombre], adjunto un resumen del ROI estimado para su operación con Nova Silva. Como conversamos, la idea es arrancar con [módulo específico] y medir resultados antes de ampliar alcance. ¿Podemos agendar 30 min para revisar los números juntos?',
  },
  price: {
    realMeaning: 'El lead está comparando con alternativas más baratas o con el costo de no hacer nada. No percibe valor diferencial suficiente.',
    impact: 'reduces_ticket',
    sellerObjective: 'Cambiar el marco de comparación: de "precio de software" a "costo total de propiedad incluyendo fragmentación, errores y riesgo".',
    novaSilvaAngle: 'Arquitectura offline-first que reduce costos de conectividad. Integración vs reemplazo elimina costos de migración dolorosa. Diseñado para café, no genérico.',
    shortScript: '"¿Cuánto invierten hoy sumando Excel, WhatsApp, tiempo del equipo y errores? Normalmente ese costo oculto supera 3x lo que cuesta Nova Silva."',
    fullScript: '"Entiendo la comparación de precio. Lo que generalmente no se ve es el costo total: el tiempo que su equipo invierte en Excel y WhatsApp, los errores de registro manual, las inconsistencias entre fincas, y el riesgo de perder un comprador europeo por falta de trazabilidad EUDR. Cuando sumamos todo eso, las herramientas fragmentadas son mucho más caras que una plataforma diseñada para café."',
    secondResponse: '"Hagamos un ejercicio concreto: ¿cuántas horas-persona a la semana invierte su equipo en consolidar datos de campo, registros de trazabilidad y reportes? Multipliquemos eso por 12 meses. Ese número generalmente sorprende."',
    strongArguments: [
      'El costo total de propiedad de herramientas fragmentadas supera el de una plataforma integrada',
      'Nova Silva funciona offline — no necesita inversión en conectividad rural',
      'Integra en vez de reemplazar — no hay costo de migración dolorosa',
      'Diseñado específicamente para café, no es un ERP genérico adaptado',
    ],
    proofAssets: ['Comparativa de costo total de propiedad', 'Calculadora de horas-persona en procesos manuales', 'Caso de organización que redujo costos operativos tras adopción'],
    tacticalQuestion: '"¿Con qué alternativas están comparando? Me interesa entender qué criterios son más importantes para ustedes más allá del precio."',
    doNot: ['No bajar precio sin reducir alcance', 'No competir en features contra ERPs genéricos', 'No aceptar que "es caro" sin explorar contra qué comparan'],
    clientVariations: ['"Es más caro que lo que usamos ahora"', '"Encontramos opciones más baratas"', '"No vemos por qué cuesta eso"'],
    escalationPath: 'Enviar comparativa de costo total de propiedad. Si persiste, proponer alcance reducido con precio acorde.',
    followUpDraft: 'Hola [nombre], te comparto una comparativa del costo total de operar con herramientas fragmentadas vs Nova Silva. Incluye tiempo de equipo, errores y riesgo regulatorio. ¿Podemos revisarla juntos esta semana?',
  },
  price_sensitivity: {
    realMeaning: 'El lead tiene presupuesto limitado o no visualiza el retorno de la inversión. Necesita propuesta de alcance mínimo.',
    impact: 'reduces_ticket',
    sellerObjective: 'Presentar modelo modular y demostrar que se puede arrancar con inversión controlada y escalar con resultados.',
    novaSilvaAngle: 'Modelo modular por diseño. Se puede arrancar con un solo flujo de valor y ampliar después. No es todo-o-nada.',
    shortScript: '"¿Qué pasaría si arrancamos solo con el módulo que más impacto inmediato tiene para ustedes y medimos resultados antes de ampliar?"',
    fullScript: '"Entiendo perfectamente la sensibilidad a costos. Por eso Nova Silva está diseñado de forma modular: no necesitan comprar toda la plataforma de entrada. Podemos identificar juntos cuál es el frente que más les duele — trazabilidad, cumplimiento, control de operaciones — y arrancar solo ahí. Medimos resultados en 60-90 días y ampliamos con datos reales, no con promesas."',
    secondResponse: '"Si el tema es inversión vs resultado: ¿qué pasa si el primer módulo se paga solo con lo que hoy pierden en errores o incumplimiento? Ese es el ejercicio que vale la pena hacer antes de decidir."',
    strongArguments: [
      'Modelo modular permite inversión mínima viable',
      'El ROI de trazabilidad EUDR se mide en acceso a mercados premium',
      'Arranque acotado reduce riesgo financiero a prácticamente cero',
      'Escalamiento basado en resultados demostrados, no en promesas',
    ],
    proofAssets: ['ROI estimado por módulo individual', 'Propuesta de piloto acotado con pricing transparente', 'Caso de organización que escaló desde módulo mínimo'],
    tacticalQuestion: '"¿Cuál es el frente que más impacto tendría si lo resolvemos primero? Trazabilidad, cumplimiento, operaciones?"',
    doNot: ['No hacer descuentos masivos sin reducir alcance', 'No presentar toda la plataforma cuando el presupuesto es limitado', 'No asumir que sensibilidad a precio = no quiere comprar'],
    clientVariations: ['"Somos una organización pequeña, no tenemos mucho presupuesto"', '"¿No hay una versión más económica?"', '"Necesitamos algo más accesible"'],
    escalationPath: 'Estructurar propuesta de piloto con inversión mínima y métricas de éxito claras. Explorar co-financiamiento si aplica.',
    followUpDraft: 'Hola [nombre], te envío una propuesta de arranque acotado enfocada en [módulo]. La inversión inicial es [monto] y medimos resultados en 90 días antes de ampliar. ¿Te parece revisarla?',
  },
  complexity: {
    realMeaning: 'El lead tiene experiencia negativa con tecnología o teme que la implementación sea disruptiva. El miedo no es la herramienta, es el cambio.',
    impact: 'delays_decision',
    sellerObjective: 'Reducir la percepción de riesgo de implementación. Mostrar que Nova Silva se diseñó para equipos no-técnicos en campo.',
    novaSilvaAngle: 'Interfaz diseñada para técnicos de campo, no para ingenieros. Funciona offline. Onboarding guiado paso a paso. Soporte en español.',
    shortScript: '"Nova Silva se diseñó específicamente para equipos que NO son técnicos. Funciona offline, en el campo, con onboarding guiado. ¿Qué experiencia han tenido antes con implementaciones de tecnología?"',
    fullScript: '"Entiendo la preocupación. La mayoría de las organizaciones que nos buscan ya intentaron algo antes — un ERP, una app de campo, Excel avanzado — y la experiencia no fue buena. Nova Silva se construyó exactamente para ese problema: interfaz simple para uso en campo, funciona sin internet, onboarding guiado paso a paso, y soporte continuo en español. No esperamos que su equipo aprenda solo. Los acompañamos."',
    secondResponse: '"Si la preocupación es que su equipo no va a adoptarlo: ¿qué tal si hacemos una prueba con 5 usuarios piloto durante 30 días? Si no funciona para ellos en campo real, paramos sin compromiso. Así evaluamos con evidencia, no con suposiciones."',
    strongArguments: [
      'Interfaz diseñada para técnicos de campo, no para ingenieros de escritorio',
      'Funciona offline — no depende de conectividad rural',
      'Onboarding guiado con acompañamiento humano incluido',
      'Soporte en español por equipo que entiende operación cafetera',
      'Adopción >80% documentada en implementaciones similares en 60 días',
    ],
    proofAssets: ['Demo en vivo del flujo de campo', 'Caso de implementación real con métricas de adopción', 'Plan de onboarding tipo con timeline', 'Video de uso en campo por técnico real'],
    tacticalQuestion: '"¿Cuántas personas usarían el sistema en campo? ¿Tienen un champion interno que pueda liderar la prueba?"',
    doNot: ['No mostrar todas las funcionalidades a la vez — genera más miedo', 'No hablar de APIs o integraciones técnicas en esta etapa', 'No prometer que "es facilísimo" — es honesto decir que requiere acompañamiento'],
    clientVariations: ['"Nuestro equipo no es técnico"', '"Ya probamos algo antes y no funcionó"', '"Parece muy complejo para nosotros"', '"No tenemos quién lo administre"'],
    escalationPath: 'Ofrecer sesión de demo con usuario real de campo. Si persiste, proponer piloto ultra-acotado (5 usuarios, 1 flujo, 30 días).',
    followUpDraft: 'Hola [nombre], entiendo la preocupación sobre complejidad. Te adjunto el plan de implementación que usamos con organizaciones similares — incluye onboarding guiado y métricas de adopción. ¿Podemos agendar una demo donde su equipo vea el sistema en acción?',
  },
  adoption_risk: {
    realMeaning: 'El lead sabe que su equipo resiste cambios. El riesgo no es la herramienta sino la gestión del cambio organizacional.',
    impact: 'delays_decision',
    sellerObjective: 'Convertir el miedo al cambio en un plan de adopción con métricas. Mostrar que Nova Silva incluye acompañamiento, no solo software.',
    novaSilvaAngle: 'Plan de adopción incluido. Métricas de uso visibles desde día 1. Capacitación en campo, no en aula. Arranque gradual por diseño.',
    shortScript: '"La adopción es el riesgo #1 en agtech. Por eso Nova Silva incluye plan de acompañamiento y métricas de adopción desde el día 1. ¿Puedo mostrarles cómo lo manejamos?"',
    fullScript: '"Tienen toda la razón en preocuparse por la adopción — es el factor que más falla en tecnología agrícola. Por eso en Nova Silva no simplemente entregamos una plataforma. Incluimos un plan de adopción con capacitación en campo, métricas de uso visibles para gerencia, y arranque gradual. Empezamos con un grupo piloto, medimos adopción real, ajustamos, y recién entonces ampliamos. Si el equipo no lo adopta, no tiene sentido para nadie."',
    secondResponse: '"Hagamos esto: identifiquemos 3-5 usuarios champion en su equipo. Arrancamos con ellos, medimos adopción en 30 días, y si funciona escalamos. Si no funciona, paramos. Así el riesgo es mínimo y la decisión se basa en evidencia real."',
    strongArguments: [
      'Plan de adopción incluido con métricas de uso visibles desde día 1',
      'Capacitación en campo real, no en aula o webinar genérico',
      'Arranque gradual: grupo piloto → medición → escalamiento',
      'Interfaz diseñada para el usuario menos técnico del equipo',
    ],
    proofAssets: ['Métricas reales de adopción de clientes existentes', 'Plan de adopción tipo con fases', 'Caso de organización que superó resistencia al cambio'],
    tacticalQuestion: '"¿Quién sería el champion interno que podría liderar la adopción? ¿Cuántos usuarios arrancarían en la primera fase?"',
    doNot: ['No prometer adopción automática — ser honesto', 'No ignorar la resistencia al cambio como "problema del cliente"', 'No proponer rollout masivo desde el inicio'],
    clientVariations: ['"Nuestro equipo no va a usar esto"', '"Ya nos pasó que compramos algo y nadie lo usó"', '"La gente en campo no quiere cambiar"'],
    escalationPath: 'Proponer taller de diagnóstico de adopción con el equipo. Identificar champions y resistencias antes de proponer alcance.',
    followUpDraft: 'Hola [nombre], te envío nuestro plan de adopción tipo. Incluye fases, métricas y cómo manejamos la resistencia al cambio en equipos de campo. ¿Podemos revisar juntos cómo adaptarlo a su organización?',
  },
  timing: {
    realMeaning: 'No hay evento gatillo. El lead no siente que necesita actuar ahora. Falta crear urgencia real basada en datos.',
    impact: 'delays_decision',
    sellerObjective: 'Crear urgencia legítima conectando el timing con eventos reales: EUDR, auditorías, cosechas, contratos.',
    novaSilvaAngle: 'EUDR tiene fecha fija. Las auditorías tienen calendario. Cada mes sin trazabilidad es riesgo acumulado. Implementar toma tiempo.',
    shortScript: '"¿Cuál es el costo de esperar 6 meses? Si hay auditoría o temporada de compra próxima, el sistema necesita estar operativo antes, no después."',
    fullScript: '"Entiendo que no sienten urgencia hoy. Pero déjame compartir lo que estamos viendo: las regulaciones EUDR tienen fecha definida, los compradores europeos ya están pidiendo trazabilidad, y las auditorías de certificación tienen calendario. Implementar un sistema como Nova Silva toma semanas, no días. Las organizaciones que se preparan antes tienen ventaja competitiva real — las que esperan, enfrentan costos de urgencia mucho mayores."',
    secondResponse: '"Pregunta concreta: ¿cuándo es su próxima auditoría de certificación o su próximo compromiso con un comprador que pide trazabilidad? Si es en los próximos 6 meses, el momento de prepararse es ahora, no cuando ya estén encima."',
    strongArguments: [
      'EUDR entra en vigencia con fecha fija — no es opcional',
      'Las auditorías de certificación tienen calendario predecible',
      'Implementar trazabilidad toma 60-90 días mínimo',
      'Los compradores europeos ya están filtrando proveedores sin trazabilidad',
      'Prepararse antes es ventaja competitiva; esperar es costo de urgencia',
    ],
    proofAssets: ['Línea de tiempo regulatoria EUDR', 'Calendario de auditorías del sector', 'Caso de organización que perdió comprador por falta de preparación'],
    tacticalQuestion: '"¿Cuándo es su próxima auditoría? ¿Cuándo inicia la siguiente cosecha? ¿Tienen compromiso con comprador europeo?"',
    doNot: ['No forzar urgencia falsa ni manipular con miedo', 'No empujar cierre cuando genuinamente no hay ventana', 'Si no hay urgencia real, nutrir la relación en vez de presionar'],
    clientVariations: ['"No es prioridad ahora"', '"Lo vemos el próximo año"', '"Estamos enfocados en otras cosas"', '"No tenemos urgencia"'],
    escalationPath: 'Si genuinamente no hay urgencia, pasar a modo nurture: enviar contenido educativo periódico y reconectar cuando haya evento gatillo.',
    followUpDraft: 'Hola [nombre], te comparto una línea de tiempo de las regulaciones y auditorías relevantes para su sector. Según lo que conversamos, prepararse ahora les da ventaja. ¿Podemos revisar juntos cuándo sería el mejor momento para arrancar?',
  },
  authority: {
    realMeaning: 'Estás hablando con un intermediario, no con quien decide. El riesgo es invertir tiempo sin acceso al decisor real.',
    impact: 'blocks_decision',
    sellerObjective: 'Ganar acceso al decisor real preparando material específico para ese nivel. Convertir al contacto actual en aliado interno.',
    novaSilvaAngle: 'Resumen ejecutivo listo para directivos. Caso de negocio cuantificado. Material adaptado por rol.',
    shortScript: '"Para darles la mejor propuesta posible, ¿quién más participaría en la decisión? Puedo preparar material específico para cada rol."',
    fullScript: '"Entiendo que esta decisión involucra a más personas. Eso es normal y es bueno — significa que se lo toman en serio. Lo que puedo hacer es preparar material específico para cada perfil: un resumen ejecutivo para dirección con ROI cuantificado, y un documento operativo para el equipo técnico. Así cada persona recibe la información que necesita para evaluar."',
    secondResponse: '"¿Qué necesitaría ver el decisor final para sentirse cómodo aprobando? Si me cuentas qué les importa más — costos, riesgo, operación — preparo exactamente eso."',
    strongArguments: [
      'Resumen ejecutivo de 2 páginas listo para directivos',
      'Caso de negocio cuantificado con ROI por módulo',
      'Material diferenciado por rol: dirección, operación, cumplimiento',
      'Disponibilidad para presentar directamente al comité si es útil',
    ],
    proofAssets: ['Resumen ejecutivo para directivos', 'Caso de negocio cuantificado', 'One-pager por módulo'],
    tacticalQuestion: '"¿Quién es el decisor final? ¿Podemos agendar una conversación corta con ellos donde yo presente directamente?"',
    doNot: ['No negociar con quien no puede decidir', 'No enviar propuesta formal sin confirmar que llega al decisor', 'No invertir semanas sin acceso al nivel correcto'],
    clientVariations: ['"Tengo que consultarlo con mi jefe"', '"La decisión la toma el consejo"', '"Yo no puedo aprobar esto solo"'],
    escalationPath: 'Preparar material ejecutivo y pedir al contacto que facilite acceso al decisor. Si no es posible, evaluar si vale la pena seguir invirtiendo tiempo.',
    followUpDraft: 'Hola [nombre], como conversamos, preparé un resumen ejecutivo y un caso de negocio pensados para el perfil del decisor. ¿Podrías compartirlos internamente o agendar una reunión donde yo presente directamente?',
  },
  internal_approval: {
    realMeaning: 'Hay burocracia o estructura de decisión lenta. El contacto quiere avanzar pero no puede solo. Necesita herramientas para vender internamente.',
    impact: 'delays_decision',
    sellerObjective: 'Armar al contacto con todo lo que necesita para vender Nova Silva internamente. Convertirlo en nuestro vendedor interno.',
    novaSilvaAngle: 'Material board-ready: resumen ejecutivo, caso de negocio, ROI estimado. Todo preparado para que el contacto presente sin esfuerzo.',
    shortScript: '"Entiendo que necesitan aprobación interna. ¿Qué necesita ver el consejo o directiva para aprobar? Puedo preparar exactamente ese material."',
    fullScript: '"Es totalmente normal que esto pase por aprobación interna. Lo que puedo hacer es armarles el caso completo: un resumen ejecutivo con los números que importan, un caso de negocio con ROI estimado, y un comparativo del costo de no actuar. Así quien presente esto internamente tiene todo lo necesario para que la aprobación sea lo más fluida posible."',
    secondResponse: '"¿Cuándo es la próxima reunión de consejo o comité? Si me das 48 horas de anticipación, puedo preparar material específico para lo que ellos necesitan evaluar."',
    strongArguments: [
      'Material board-ready preparado por Nova Silva para facilitar aprobación',
      'Caso de negocio con ROI cuantificado y riesgo de no actuar',
      'Disponibilidad para presentar al comité directamente si es útil',
      'Propuesta modular que reduce el monto de aprobación necesario',
    ],
    proofAssets: ['Resumen ejecutivo para directivos', 'Caso de negocio cuantificado', 'Template de memo interno para aprobación', 'Propuesta modular con inversión escalonada'],
    tacticalQuestion: '"¿Cuándo es la próxima reunión de consejo? ¿Quién es el sponsor interno más fuerte? ¿Puedo prepararle material específico?"',
    doNot: ['No asumir que el contacto puede decidir solo', 'No esperar pasivamente sin dar herramientas para la venta interna', 'No enviar propuesta full cuando un piloto facilitaría la aprobación'],
    clientVariations: ['"Tenemos que pasarlo por el consejo"', '"La junta se reúne en [fecha]"', '"Internamente es un proceso largo"', '"Necesito convencer a mi gerente"'],
    escalationPath: 'Preparar paquete completo de venta interna: resumen ejecutivo + caso de negocio + propuesta modular. Ofrecer presentar directamente al comité.',
    followUpDraft: 'Hola [nombre], preparé un paquete para facilitar la aprobación interna: resumen ejecutivo, caso de negocio con ROI, y propuesta modular. ¿Te sirve para la próxima reunión de consejo? Quedo disponible para presentar directamente si es útil.',
  },
  competition: {
    realMeaning: 'El lead tiene alternativa activa o el status quo le parece "suficiente". Hay riesgo real de perder contra competidor o contra la inercia.',
    impact: 'blocks_decision',
    sellerObjective: 'Diferenciar Nova Silva no por features sino por visión, diseño para café, y modelo de acompañamiento. Entender los criterios reales de evaluación.',
    novaSilvaAngle: 'Integración vs reemplazo. Diseñado para café, no genérico. Offline-first. Soporte en español y en campo. Acompañamiento real.',
    shortScript: '"¿Qué están evaluando además de Nova Silva? Me interesa entender qué criterios son más importantes para ustedes, no solo features."',
    fullScript: '"Es natural evaluar opciones. Lo que diferencia a Nova Silva no es una lista de features — cualquier plataforma puede prometer eso. La diferencia real es: está diseñado específicamente para café, funciona offline en campo, se integra con lo que ya usan en vez de reemplazar todo, y viene con acompañamiento real en español por gente que entiende su operación. La pregunta no es qué herramienta tiene más botones, sino cuál va a funcionar en su realidad operativa."',
    secondResponse: '"¿Puedo sugerir algo? Hagan una prueba paralela: evalúen la alternativa y evalúen Nova Silva en el mismo flujo de trabajo real. 30 días. La que funcione mejor en campo real gana. Eso elimina la especulación."',
    strongArguments: [
      'Diseñado específicamente para café, no es un ERP genérico adaptado',
      'Funciona offline — fundamental para operación rural real',
      'Se integra con herramientas existentes, no las reemplaza de golpe',
      'Soporte en español por equipo que conoce operación cafetera',
      'Modelo de acompañamiento incluido, no solo licencia de software',
    ],
    proofAssets: ['Comparativa honesta: qué hace Nova Silva que otros no', 'Caso de cliente que evaluó alternativas y eligió Nova Silva', 'Demo lado a lado del flujo de campo'],
    tacticalQuestion: '"¿Cuáles son sus 3 criterios más importantes para elegir? No features — criterios operativos reales."',
    doNot: ['No hablar mal del competidor directamente', 'No competir solo en features — es una carrera perdida', 'No asumir que el status quo no es un competidor real'],
    clientVariations: ['"Ya estamos viendo otra opción"', '"Usamos [competidor] y funciona"', '"¿Por qué cambiaríamos lo que ya tenemos?"', '"Otra plataforma nos ofrece lo mismo más barato"'],
    escalationPath: 'Proponer prueba paralela en flujo real. Si el lead ya decidió, respetar pero mantener relación para cuando la alternativa falle.',
    followUpDraft: 'Hola [nombre], entiendo que están evaluando opciones. Te propongo algo: hagamos una prueba en un flujo de trabajo real de su operación y comparemos resultados. La herramienta que funcione mejor en campo gana. ¿Les interesa?',
  },
  trust: {
    realMeaning: 'El lead no confía en la empresa, el producto o en agtech en general. Posiblemente tuvo malas experiencias anteriores con tecnología.',
    impact: 'blocks_decision',
    sellerObjective: 'Mover la conversación de "creer o no creer" a "probar con riesgo controlado". Construir credibilidad con hechos, no con discurso.',
    novaSilvaAngle: 'Piloto de bajo riesgo. Clientes verificables. Transparencia total en pricing y capacidades. Acompañamiento real, no solo software.',
    shortScript: '"Es totalmente razonable ser cautos. Por eso no buscamos que crean en una presentación, sino en una implementación controlada. Empezamos acotado, demostramos valor operativo, y escalamos con evidencia."',
    fullScript: '"Es totalmente razonable ser cautos. Justamente por eso en Nova Silva no buscamos que ustedes crean en una presentación, sino en una implementación controlada. Lo que proponemos es empezar con un alcance acotado, sobre un flujo real de ustedes, para demostrar valor operativo antes de escalar. No pedimos confianza ciega — pedimos la oportunidad de demostrar con su propia operación."',
    secondResponse: '"Totalmente válido. Entonces en vez de discutir una compra hoy, enfoquémonos en qué evidencia concreta necesitarían para sentirse cómodos evaluando un primer alcance controlado. ¿Una referencia? ¿Una prueba? ¿Ver el sistema funcionando en una org similar?"',
    strongArguments: [
      'Piloto de bajo riesgo disponible — probar antes de comprometerse',
      'Clientes reales verificables del mismo segmento',
      'Transparencia total en pricing y capacidades — sin letra pequeña',
      'Acompañamiento humano incluido, no solo licencia de software',
      'No requiere despliegue full desde el día 1 — arranque gradual',
    ],
    proofAssets: ['Referencia de cliente del mismo segmento', 'Invitación a conversación con otro cliente', 'Demo en vivo con datos reales (no demo genérica)', 'Propuesta de piloto sin compromiso a largo plazo'],
    tacticalQuestion: '"¿Qué les daría más confianza para evaluar: ver un caso similar, revisar un flujo concreto de implementación, o hablar con un cliente actual?"',
    doNot: ['No decir "confíen en nosotros"', 'No sobre-prometer capacidades', 'No presionar cuando la confianza no está construida', 'No decir "la implementación es facilísima" ni "no hay riesgo"'],
    clientVariations: ['"Ya nos prometieron algo similar antes y no funcionó"', '"No conocemos su empresa"', '"¿Cómo sabemos que esto va a funcionar?"', '"La tecnología en campo nunca funciona bien"'],
    escalationPath: 'Conectar al lead con un cliente existente del mismo segmento para referencia directa. Si no es posible, ofrecer piloto con cláusula de salida clara.',
    followUpDraft: 'Hola [nombre], entiendo que la confianza se construye con hechos. Te propongo dos opciones: 1) conversación directa con un cliente nuestro del mismo segmento, o 2) un piloto acotado de 30 días sobre un flujo real de su operación. ¿Cuál les resulta más útil?',
  },
  no_urgency: {
    realMeaning: 'No hay dolor suficiente hoy. El costo de no actuar no se siente. Falta conectar la inacción con consecuencias reales.',
    impact: 'delays_decision',
    sellerObjective: 'Crear urgencia legítima mostrando lo que pierden por no actuar, no manipulando con miedo artificial.',
    novaSilvaAngle: 'El mercado se mueve: EUDR, compradores, certificaciones. Prepararse antes es ventaja competitiva. Los que esperan pagan más.',
    shortScript: '"Entiendo que no sienten urgencia hoy. ¿Puedo compartirles qué está pasando con EUDR y cómo están reaccionando organizaciones similares? El contexto está cambiando rápido."',
    fullScript: '"Entiendo que hoy no es prioridad. Pero déjame compartir algo que estamos viendo: el mercado está cambiando más rápido de lo que parece. Los compradores europeos ya están filtrando proveedores sin trazabilidad. Las regulaciones EUDR tienen fecha. Y las organizaciones que se preparan antes no solo cumplen — se posicionan mejor frente a compradores premium. Las que esperan, enfrentan costos de urgencia mucho mayores."',
    secondResponse: '"Pregunta directa: ¿qué tendría que pasar para que esto sí fuera prioridad? ¿Perder un comprador? ¿Una auditoría fallida? ¿Un competidor que se adelante? Si identificamos el evento gatillo, podemos prepararnos antes de que llegue."',
    strongArguments: [
      'Las regulaciones tienen fecha fija — no es si, sino cuándo',
      'Los compradores ya están filtrando proveedores sin trazabilidad',
      'Implementar trazabilidad toma meses, no días — hay que anticiparse',
      'Las organizaciones que se preparan antes acceden a mercados premium',
      'El costo de implementar con urgencia es 2-3x mayor que planificado',
    ],
    proofAssets: ['Línea de tiempo del mercado y regulaciones', 'Caso de organización que perdió acceso por no prepararse', 'Comparativa: costo de prepararse vs costo de urgencia'],
    tacticalQuestion: '"¿Hay algún evento próximo que pueda cambiar la urgencia? ¿Auditoría, nuevo comprador, regulación, competidor que se adelante?"',
    doNot: ['No forzar urgencia falsa ni manipular con miedo', 'No presionar cierre cuando genuinamente no hay ventana', 'No abandonar el lead — educarlo y nutrir la relación'],
    clientVariations: ['"No es prioridad ahora"', '"Lo vemos el próximo año"', '"Estamos bien con lo que tenemos"', '"No vemos la urgencia"'],
    escalationPath: 'Pasar a modo nurture: enviar contenido educativo periódico, monitorear eventos gatillo, reconectar cuando cambie el contexto.',
    followUpDraft: 'Hola [nombre], entiendo que hoy no es prioridad. Te comparto un resumen de cómo está evolucionando el contexto regulatorio y de mercado para su sector. Cuando el tema sea relevante para ustedes, quedo disponible. Mientras tanto, les enviaré actualizaciones periódicas.',
  },
  implementation: {
    realMeaning: 'El lead ve la implementación como riesgo operativo real. No es la herramienta — es el esfuerzo, la disrupción y la incertidumbre.',
    impact: 'delays_decision',
    sellerObjective: 'Convertir "miedo a implementar" en "plan de implementación claro y controlado". Mostrar que Nova Silva lo incluye.',
    novaSilvaAngle: 'Onboarding guiado incluido. Timeline de implementación claro y predecible. Soporte continuo. Arranque gradual, no big-bang.',
    shortScript: '"La implementación es parte del servicio. No los dejamos solos. ¿Puedo mostrarles nuestro plan típico de puesta en marcha?"',
    fullScript: '"Entiendo que la implementación es la preocupación principal. En Nova Silva, la implementación no es algo que les dejamos resolver — es parte central del servicio. Tenemos un plan de puesta en marcha probado: arrancamos con un flujo de trabajo específico, capacitamos en campo, medimos adopción, y ampliamos solo cuando funciona. El timeline típico es 60-90 días para tener valor operativo real."',
    secondResponse: '"Si quieren ver exactamente cómo funciona: puedo compartirles el plan de implementación que usamos con una organización similar — fases, timeline, qué necesitamos de su equipo y qué ponemos nosotros. Así evalúan con información concreta."',
    strongArguments: [
      'Onboarding guiado incluido en el servicio — no es costo adicional',
      'Timeline de implementación claro: valor operativo en 60-90 días',
      'Arranque gradual: un flujo primero, no todo de golpe',
      'Capacitación en campo real, no webinars genéricos',
      'Soporte continuo durante y después de la implementación',
    ],
    proofAssets: ['Plan de implementación tipo con timeline detallado', 'Caso de implementación exitosa con métricas', 'Checklist de responsabilidades: qué pone Nova Silva vs qué pone el cliente'],
    tacticalQuestion: '"¿Cuándo sería el mejor momento para arrancar? ¿Tienen cosecha, auditoría o evento que defina el timing ideal?"',
    doNot: ['No minimizar el esfuerzo de implementación — ser honesto', 'No prometer que "se implementa solo"', 'No esconder lo que requiere del equipo del cliente'],
    clientVariations: ['"¿Cuánto tiempo toma implementarlo?"', '"No tenemos recursos para una implementación"', '"¿Quién nos ayuda a ponerlo en marcha?"', '"Ya nos pasó que compramos algo y nunca se implementó bien"'],
    escalationPath: 'Compartir plan de implementación detallado. Si persiste, ofrecer piloto ultra-acotado (1 flujo, 5 usuarios, 30 días) para demostrar que funciona.',
    followUpDraft: 'Hola [nombre], adjunto el plan de implementación que usamos con organizaciones similares. Incluye fases, timeline, y responsabilidades claras. ¿Podemos revisarlo juntos para adaptarlo a su contexto?',
  },
  compliance_fear: {
    realMeaning: 'El lead está asustado por regulación (especialmente EUDR) pero no sabe qué hacer. La parálisis por miedo es real y bloquea la acción.',
    impact: 'delays_decision',
    sellerObjective: 'Convertir el miedo en acción estructurada. Posicionar Nova Silva como guía, no como alarma adicional.',
    novaSilvaAngle: 'EUDR como riesgo operativo, no solo regulatorio. Nova Silva tiene flujo EUDR paso a paso. Cuantificar el riesgo de incumplimiento.',
    shortScript: '"El cumplimiento regulatorio es exactamente por lo que creamos Nova Silva. ¿Puedo mostrarles cómo resolvemos EUDR paso a paso, sin que sea abrumador?"',
    fullScript: '"Entiendo el miedo — EUDR y las exigencias de certificación son reales y están presionando a todo el sector. Pero el miedo sin acción no resuelve nada. Nova Silva tiene un flujo específico para cumplimiento EUDR: trazabilidad parcela por parcela, documentación audit-ready, y monitoreo continuo. No es que ustedes tengan que convertirse en expertos regulatorios — el sistema los guía paso a paso."',
    secondResponse: '"Pregunta directa: ¿qué pasa si en 12 meses un comprador europeo les pide trazabilidad completa y ustedes no la tienen? ¿Cuánto vale ese contrato? Ese es el costo real de no prepararse. Y prepararse toma meses, no días."',
    strongArguments: [
      'EUDR es riesgo operativo: perder acceso a mercados europeos tiene costo cuantificable',
      'Nova Silva tiene flujo EUDR específico: trazabilidad parcela por parcela',
      'Documentación audit-ready generada automáticamente',
      'El sistema guía paso a paso — no requiere ser experto en regulación',
      'Prepararse antes da ventaja competitiva frente a compradores premium',
    ],
    proofAssets: ['Flujo EUDR de Nova Silva (demo o walkthrough)', 'Costo estimado de incumplimiento EUDR', 'Caso de organización que logró compliance con Nova Silva', 'Comparativa: costo de prepararse vs costo de perder mercado'],
    tacticalQuestion: '"¿Ya tuvieron auditoría de trazabilidad? ¿Tienen deadline específico de un comprador o certificador?"',
    doNot: ['No usar el miedo como táctica de venta — posicionar como solución', 'No abrumar con tecnicismos regulatorios', 'No presentar EUDR como "problema" sin ofrecer camino claro'],
    clientVariations: ['"No sabemos cómo cumplir con EUDR"', '"Nos asusta la regulación europea"', '"No estamos preparados para auditorías"', '"¿Qué pasa si no cumplimos?"'],
    escalationPath: 'Ofrecer sesión de diagnóstico EUDR específico. Mostrar exactamente qué gaps tienen y cómo Nova Silva los cierra.',
    followUpDraft: 'Hola [nombre], como conversamos, preparé un diagnóstico rápido de su estado frente a EUDR. Incluye qué gaps existen y cómo Nova Silva los resuelve paso a paso. ¿Podemos revisarlo juntos esta semana?',
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
