/**
 * Adaptive Diagnostic Engine for Sales Intelligence
 * Drives context-aware question flow based on lead_profile state.
 */

export interface LeadProfile {
  organization_type: string | null;
  organization_id: string | null;
  organization_name: string | null;
  scale: string | null;
  geography: string | null;
  commercialization_model: string | null;
  pain_points: string[];
  constraints: string[];
  signals: string[];
  notes: string[];
  confidence_scores: Record<string, number>;
  raw_answers: Record<string, unknown>;
}

export interface DiagnosticQuestion {
  id: string;
  category: 'identity' | 'scale' | 'operations' | 'pain' | 'technology' | 'compliance' | 'budget' | 'urgency';
  title: string;
  description: string | null;
  inputType: 'single_select' | 'multi_select' | 'text' | 'number' | 'boolean';
  options: { value: string; label: string; description?: string }[];
  placeholder?: string;
  allowFreeText: boolean;
  relevantFor: string[] | null; // null = all org types
  requiredFields: string[]; // profile fields that must be filled before this question
  excludeIfSignals?: string[]; // skip if these signals already detected
  priority: number; // lower = asked first
}

export interface Interpretation {
  pain_signals: { signal: string; confidence: number; source: string }[];
  maturity_level: { level: string; score: number; reasoning: string };
  objections: { hypothesis: string; confidence: number; trigger: string; suggested_response: string }[];
  positioning: string[];
  recommendations: string[];
}

export function createEmptyProfile(): LeadProfile {
  return {
    organization_type: null,
    organization_id: null,
    organization_name: null,
    scale: null,
    geography: null,
    commercialization_model: null,
    pain_points: [],
    constraints: [],
    signals: [],
    notes: [],
    confidence_scores: {},
    raw_answers: {},
  };
}

// --- QUESTION BANK ---
const QUESTION_BANK: DiagnosticQuestion[] = [
  // SCALE
  {
    id: 'scale',
    category: 'scale',
    title: '¿Cuál es la escala de operación?',
    description: 'Esto nos ayuda a dimensionar la solución adecuada.',
    inputType: 'single_select',
    options: [
      { value: 'micro', label: 'Micro (< 50 productores / < 100 ha)' },
      { value: 'small', label: 'Pequeña (50-200 productores / 100-500 ha)' },
      { value: 'medium', label: 'Mediana (200-1000 productores / 500-2000 ha)' },
      { value: 'large', label: 'Grande (> 1000 productores / > 2000 ha)' },
    ],
    allowFreeText: true,
    relevantFor: null,
    requiredFields: ['organization_type'],
    priority: 10,
  },
  {
    id: 'geography',
    category: 'operations',
    title: '¿En qué país o región operan?',
    description: null,
    inputType: 'text',
    options: [],
    placeholder: 'Ej: Honduras, zona occidental',
    allowFreeText: true,
    relevantFor: null,
    requiredFields: ['organization_type'],
    priority: 15,
  },
  {
    id: 'commercialization',
    category: 'operations',
    title: '¿Cuál es el modelo de comercialización principal?',
    description: null,
    inputType: 'single_select',
    options: [
      { value: 'direct_export', label: 'Exportación directa' },
      { value: 'intermediary', label: 'Venta a intermediarios' },
      { value: 'auction', label: 'Subastas / lotes especiales' },
      { value: 'domestic', label: 'Mercado doméstico' },
      { value: 'mixed', label: 'Mixto' },
    ],
    allowFreeText: true,
    relevantFor: ['cooperativa', 'exportador', 'beneficio_privado', 'aggregator'],
    requiredFields: ['organization_type'],
    priority: 20,
  },
  // PAIN DISCOVERY
  {
    id: 'pain_main',
    category: 'pain',
    title: '¿Cuáles son los principales desafíos que enfrentan hoy?',
    description: 'Selecciona todos los que apliquen. También puedes escribir los tuyos.',
    inputType: 'multi_select',
    options: [
      { value: 'traceability', label: 'Trazabilidad y cumplimiento (EUDR, orgánico)' },
      { value: 'productivity', label: 'Productividad y rendimiento bajo' },
      { value: 'data_fragmented', label: 'Datos fragmentados / sin digitalizar' },
      { value: 'market_access', label: 'Acceso a mercados premium' },
      { value: 'producer_retention', label: 'Retención de productores' },
      { value: 'quality_control', label: 'Control de calidad inconsistente' },
      { value: 'financial_visibility', label: 'Falta de visibilidad financiera' },
      { value: 'climate_risk', label: 'Riesgo climático sin gestionar' },
      { value: 'compliance_pressure', label: 'Presión regulatoria creciente' },
    ],
    allowFreeText: true,
    relevantFor: null,
    requiredFields: ['organization_type', 'scale'],
    priority: 25,
  },
  // PRODUCER-SPECIFIC
  {
    id: 'producer_hectares',
    category: 'scale',
    title: '¿Cuántas hectáreas manejas?',
    description: null,
    inputType: 'number',
    options: [],
    placeholder: 'Número de hectáreas',
    allowFreeText: false,
    relevantFor: ['productor_empresarial'],
    requiredFields: ['organization_type'],
    priority: 12,
  },
  {
    id: 'producer_buyers',
    category: 'operations',
    title: '¿A quién vendes actualmente?',
    description: null,
    inputType: 'multi_select',
    options: [
      { value: 'coop', label: 'Cooperativa' },
      { value: 'exporter', label: 'Exportador directo' },
      { value: 'intermediary', label: 'Intermediario local' },
      { value: 'market', label: 'Mercado local' },
    ],
    allowFreeText: true,
    relevantFor: ['productor_empresarial'],
    requiredFields: ['organization_type'],
    priority: 18,
  },
  // TECHNOLOGY
  {
    id: 'current_tools',
    category: 'technology',
    title: '¿Qué herramientas digitales usan actualmente?',
    description: null,
    inputType: 'multi_select',
    options: [
      { value: 'excel', label: 'Excel / hojas de cálculo' },
      { value: 'erp', label: 'ERP (SAP, etc.)' },
      { value: 'whatsapp', label: 'WhatsApp para coordinación' },
      { value: 'paper', label: 'Registros en papel' },
      { value: 'other_platform', label: 'Otra plataforma agtech' },
      { value: 'none', label: 'No usan herramientas digitales' },
    ],
    allowFreeText: true,
    relevantFor: null,
    requiredFields: ['organization_type', 'scale'],
    priority: 30,
  },
  // COMPLIANCE
  {
    id: 'compliance_pressure',
    category: 'compliance',
    title: '¿Tienen presión de cumplimiento regulatorio?',
    description: null,
    inputType: 'multi_select',
    options: [
      { value: 'eudr', label: 'EUDR (Regulación europea de deforestación)' },
      { value: 'organic', label: 'Certificación orgánica' },
      { value: 'fairtrade', label: 'Fairtrade / comercio justo' },
      { value: 'rainforest', label: 'Rainforest Alliance' },
      { value: 'carbon', label: 'Mercados de carbono' },
      { value: 'none', label: 'Sin presión regulatoria específica' },
    ],
    allowFreeText: true,
    relevantFor: ['cooperativa', 'exportador', 'beneficio_privado', 'aggregator'],
    requiredFields: ['organization_type'],
    priority: 28,
  },
  // BUDGET
  {
    id: 'budget_readiness',
    category: 'budget',
    title: '¿Tienen presupuesto asignado para digitalización este año?',
    description: null,
    inputType: 'single_select',
    options: [
      { value: 'allocated', label: 'Sí, ya asignado' },
      { value: 'exploring', label: 'Explorando opciones' },
      { value: 'donor_funded', label: 'Depende de financiamiento externo / donante' },
      { value: 'no_budget', label: 'No por ahora' },
    ],
    allowFreeText: true,
    relevantFor: null,
    requiredFields: ['organization_type', 'scale'],
    priority: 35,
  },
  // URGENCY
  {
    id: 'urgency_timeline',
    category: 'urgency',
    title: '¿En qué plazo necesitan una solución?',
    description: null,
    inputType: 'single_select',
    options: [
      { value: 'immediate', label: 'Inmediato (< 1 mes)' },
      { value: 'quarter', label: 'Este trimestre' },
      { value: 'semester', label: 'Este semestre' },
      { value: 'exploring', label: 'Solo explorando' },
    ],
    allowFreeText: true,
    relevantFor: null,
    requiredFields: ['organization_type'],
    priority: 38,
  },
  // OPEN-ENDED
  {
    id: 'decision_blockers',
    category: 'pain',
    title: '¿Qué les impediría tomar una decisión hoy?',
    description: 'Esta información nos ayuda a anticipar y resolver dudas.',
    inputType: 'text',
    options: [],
    placeholder: 'Ej: necesitamos aprobación del consejo, evaluar otras opciones...',
    allowFreeText: true,
    relevantFor: null,
    requiredFields: ['organization_type', 'scale'],
    excludeIfSignals: ['budget_confirmed', 'urgency_immediate'],
    priority: 40,
  },
];

// --- ADAPTIVE ENGINE ---

export function getNextQuestions(profile: LeadProfile, maxCount = 3): DiagnosticQuestion[] {
  const orgType = profile.organization_type;
  if (!orgType) return [];

  const answeredIds = new Set(Object.keys(profile.raw_answers));

  const filledFields = new Set<string>();
  if (profile.organization_type) filledFields.add('organization_type');
  if (profile.scale) filledFields.add('scale');
  if (profile.geography) filledFields.add('geography');
  if (profile.commercialization_model) filledFields.add('commercialization_model');

  return QUESTION_BANK
    .filter(q => {
      // Already answered
      if (answeredIds.has(q.id)) return false;
      // Not relevant for this org type
      if (q.relevantFor && !q.relevantFor.includes(orgType)) return false;
      // Required fields not yet filled
      if (q.requiredFields.some(f => !filledFields.has(f))) return false;
      // Exclude if signals present
      if (q.excludeIfSignals?.some(s => profile.signals.includes(s))) return false;
      return true;
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxCount);
}

export function hasMoreQuestions(profile: LeadProfile): boolean {
  return getNextQuestions(profile, 1).length > 0;
}

// --- INTERPRETATION ENGINE ---

export function interpretProfile(profile: LeadProfile): Interpretation {
  const painSignals: Interpretation['pain_signals'] = [];
  const objections: Interpretation['objections'] = [];
  const positioning: string[] = [];
  const recommendations: string[] = [];

  // Pain signals from pain_points
  const painMap: Record<string, { signal: string; confidence: number }> = {
    traceability: { signal: 'Necesidad crítica de trazabilidad', confidence: 0.9 },
    productivity: { signal: 'Productividad por debajo del potencial', confidence: 0.8 },
    data_fragmented: { signal: 'Datos fragmentados — alto costo de gestión', confidence: 0.85 },
    market_access: { signal: 'Brecha de acceso a mercados premium', confidence: 0.75 },
    producer_retention: { signal: 'Riesgo de pérdida de base productiva', confidence: 0.8 },
    quality_control: { signal: 'Calidad inconsistente — riesgo de rechazo', confidence: 0.85 },
    financial_visibility: { signal: 'Opacidad financiera limita decisiones', confidence: 0.7 },
    climate_risk: { signal: 'Exposición climática sin mitigación', confidence: 0.75 },
    compliance_pressure: { signal: 'Presión regulatoria inminente', confidence: 0.9 },
  };

  for (const pain of profile.pain_points) {
    const mapped = painMap[pain];
    if (mapped) {
      painSignals.push({ ...mapped, source: 'pain_main' });
    } else {
      painSignals.push({ signal: pain, confidence: 0.6, source: 'user_input' });
    }
  }

  // Maturity assessment
  const tools = (profile.raw_answers['current_tools'] as string[]) ?? [];
  let maturityScore = 3;
  let maturityLevel = 'Emergente';
  let maturityReasoning = 'Nivel base de madurez digital.';

  if (tools.includes('none') || tools.includes('paper')) {
    maturityScore = 1;
    maturityLevel = 'Pre-digital';
    maturityReasoning = 'La organización opera con registros manuales. Alto potencial de impacto con digitalización.';
  } else if (tools.includes('excel') || tools.includes('whatsapp')) {
    maturityScore = 3;
    maturityLevel = 'Emergente';
    maturityReasoning = 'Uso de herramientas genéricas sin integración agrícola. Oportunidad de migración a plataforma especializada.';
  } else if (tools.includes('erp') || tools.includes('other_platform')) {
    maturityScore = 5;
    maturityLevel = 'En transición';
    maturityReasoning = 'Ya existe infraestructura digital. Foco en integración, especialización y analítica avanzada.';
  }

  // Scale-adjusted
  if (profile.scale === 'large') maturityScore = Math.min(maturityScore + 1, 7);
  if (profile.scale === 'micro') maturityScore = Math.max(maturityScore - 1, 1);

  // Objection detection
  const budgetAnswer = profile.raw_answers['budget_readiness'] as string;
  if (budgetAnswer === 'no_budget') {
    objections.push({
      hypothesis: 'Sin presupuesto asignado',
      confidence: 0.85,
      trigger: 'Respuesta directa a budget_readiness',
      suggested_response: 'Explorar modelos de financiamiento: piloto sin costo, co-inversión con donantes, o modelo de retorno por mejoras en precio.',
    });
  }
  if (budgetAnswer === 'donor_funded') {
    objections.push({
      hypothesis: 'Dependencia de financiamiento externo',
      confidence: 0.6,
      trigger: 'Budget depende de donante',
      suggested_response: 'Posicionar Nova Silva como plataforma elegible para proyectos de cooperación. Proporcionar caso de impacto documentable.',
    });
  }

  const timeline = profile.raw_answers['urgency_timeline'] as string;
  if (timeline === 'exploring') {
    objections.push({
      hypothesis: 'Solo explorando — sin urgencia de compra',
      confidence: 0.7,
      trigger: 'Timeline = exploring',
      suggested_response: 'Crear urgencia mostrando costo de oportunidad: pérdida de primas, riesgo regulatorio inminente (EUDR), o brecha competitiva.',
    });
  }

  const blockers = profile.raw_answers['decision_blockers'] as string;
  if (blockers && blockers.length > 10) {
    objections.push({
      hypothesis: 'Bloqueador declarado por el lead',
      confidence: 0.8,
      trigger: `decision_blockers: "${blockers.substring(0, 80)}"`,
      suggested_response: 'Abordar directamente el bloqueador con evidencia, casos de éxito, o alternativa de piloto.',
    });
  }

  // Positioning suggestions
  if (profile.pain_points.includes('traceability') || profile.pain_points.includes('compliance_pressure')) {
    positioning.push('Posicionar Nova Silva como plataforma de cumplimiento EUDR + trazabilidad integrada.');
  }
  if (profile.pain_points.includes('productivity')) {
    positioning.push('Enfatizar módulo VITAL + Nutrición como herramientas de mejora de rendimiento.');
  }
  if (profile.pain_points.includes('data_fragmented')) {
    positioning.push('Demostrar unificación de datos en tiempo real: parcela → cooperativa → exportador.');
  }
  if (profile.organization_type === 'productor_empresarial') {
    positioning.push('Enfocar en ROI directo: mejor precio por trazabilidad, reducción de pérdidas, acceso a crédito.');
  }

  // Recommendations
  if (profile.pain_points.length > 0) {
    recommendations.push('Preparar demo personalizada enfocada en los dolores identificados.');
  }
  if (maturityScore <= 2) {
    recommendations.push('Proponer programa de acompañamiento en adopción digital.');
  }
  if (profile.scale === 'large') {
    recommendations.push('Considerar propuesta enterprise con soporte dedicado.');
  }

  return {
    pain_signals: painSignals,
    maturity_level: { level: maturityLevel, score: maturityScore, reasoning: maturityReasoning },
    objections,
    positioning,
    recommendations,
  };
}

// --- PROFILE UPDATE FROM ANSWER ---

export function updateProfileFromAnswer(
  profile: LeadProfile,
  questionId: string,
  value: unknown,
  freeTextNote?: string
): LeadProfile {
  const next = { ...profile, raw_answers: { ...profile.raw_answers, [questionId]: value } };

  switch (questionId) {
    case 'scale':
      next.scale = typeof value === 'string' ? value : null;
      break;
    case 'geography':
      next.geography = typeof value === 'string' ? value : null;
      break;
    case 'commercialization':
      next.commercialization_model = typeof value === 'string' ? value : null;
      break;
    case 'pain_main': {
      const values = Array.isArray(value) ? value : [];
      next.pain_points = [...new Set([...values])];
      if (values.includes('compliance_pressure')) next.signals = [...new Set([...next.signals, 'compliance_urgency'])];
      if (values.includes('traceability')) next.signals = [...new Set([...next.signals, 'traceability_need'])];
      break;
    }
    case 'budget_readiness': {
      if (value === 'allocated') next.signals = [...new Set([...next.signals, 'budget_confirmed'])];
      next.confidence_scores = { ...next.confidence_scores, budget: value === 'allocated' ? 0.9 : value === 'exploring' ? 0.5 : 0.2 };
      break;
    }
    case 'urgency_timeline': {
      if (value === 'immediate') next.signals = [...new Set([...next.signals, 'urgency_immediate'])];
      next.confidence_scores = { ...next.confidence_scores, urgency: value === 'immediate' ? 0.95 : value === 'quarter' ? 0.7 : 0.3 };
      break;
    }
    case 'current_tools': {
      const tools = Array.isArray(value) ? value : [];
      if (tools.includes('none') || tools.includes('paper')) {
        next.signals = [...new Set([...next.signals, 'low_maturity'])];
      }
      break;
    }
    case 'compliance_pressure': {
      const certs = Array.isArray(value) ? value : [];
      if (certs.includes('eudr')) next.signals = [...new Set([...next.signals, 'eudr_pressure'])];
      break;
    }
    case 'decision_blockers': {
      if (typeof value === 'string' && value.trim()) {
        next.constraints = [...new Set([...next.constraints, value.trim()])];
      }
      break;
    }
    case 'producer_hectares': {
      if (typeof value === 'number') {
        if (value > 500) next.scale = 'large';
        else if (value > 100) next.scale = 'medium';
        else if (value > 20) next.scale = 'small';
        else next.scale = 'micro';
      }
      break;
    }
  }

  if (freeTextNote) {
    next.notes = [...next.notes, `[${questionId}] ${freeTextNote}`];
  }

  return next;
}

export const ORG_TYPES = [
  { value: 'cooperativa', label: 'Cooperativa', description: 'Organización colectiva de productores' },
  { value: 'exportador', label: 'Exportador', description: 'Empresa exportadora de café' },
  { value: 'beneficio_privado', label: 'Beneficio privado', description: 'Planta de procesamiento independiente' },
  { value: 'productor_empresarial', label: 'Productor empresarial', description: 'Finca de escala comercial' },
  { value: 'aggregator', label: 'Aggregator / Trader', description: 'Intermediario o trader de café' },
] as const;
