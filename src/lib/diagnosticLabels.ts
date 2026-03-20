/**
 * Commercial-facing labels for the Sales Copilot.
 * All raw codes → seller-readable Spanish.
 */

export const ORG_TYPE_LABELS: Record<string, string> = {
  finca_privada: 'Finca privada',
  beneficio: 'Beneficio (compra + procesa)',
  exportador: 'Exportador',
  exportador_red: 'Exportador con red de productores',
  cooperativa: 'Cooperativa / Asociación',
  trader: 'Comercializador / Trader',
  // legacy fallbacks
  productor_empresarial: 'Finca privada',
  beneficio_privado: 'Beneficio (compra + procesa)',
  aggregator: 'Comercializador / Trader',
};

export const SCALE_LABELS: Record<string, string> = {
  micro: 'Micro',
  small: 'Pequeña',
  medium: 'Mediana',
  large: 'Grande',
};

export const COMMERCIALIZATION_LABELS: Record<string, string> = {
  direct_export: 'Exportación directa',
  intermediary: 'Intermediarios',
  auction: 'Subastas / lotes especiales',
  domestic: 'Mercado doméstico',
  mixed: 'Mixto',
};

export const PAIN_LABELS: Record<string, string> = {
  traceability: 'Trazabilidad y cumplimiento',
  productivity: 'Productividad baja',
  data_fragmented: 'Datos fragmentados',
  market_access: 'Acceso a mercados premium',
  producer_retention: 'Retención de productores',
  quality_control: 'Calidad inconsistente',
  financial_visibility: 'Visibilidad financiera',
  climate_risk: 'Riesgo climático',
  compliance_pressure: 'Presión regulatoria',
};

export const SIGNAL_LABELS: Record<string, string> = {
  compliance_urgency: 'Alta presión de cumplimiento',
  traceability_need: 'Necesidad de trazabilidad crítica',
  budget_confirmed: 'Presupuesto confirmado',
  urgency_immediate: 'Urgencia alta',
  low_maturity: 'Madurez digital baja',
  eudr_pressure: 'Presión EUDR activa',
};

export const MATURITY_LABELS: Record<string, string> = {
  'Pre-digital': 'Pre-digital',
  Emergente: 'Emergente',
  'En transición': 'En transición',
};

export const BUDGET_LABELS: Record<string, string> = {
  allocated: 'Asignado',
  exploring: 'Explorando',
  donor_funded: 'Financiamiento externo',
  no_budget: 'Sin presupuesto',
};

export const TIMELINE_LABELS: Record<string, string> = {
  immediate: 'Inmediato',
  quarter: 'Este trimestre',
  semester: 'Este semestre',
  exploring: 'Solo explorando',
};

/** Aggregate map for humanizing any raw answer value */
export const ALL_VALUE_LABELS: Record<string, string> = {
  ...SCALE_LABELS,
  ...COMMERCIALIZATION_LABELS,
  ...PAIN_LABELS,
  ...BUDGET_LABELS,
  ...TIMELINE_LABELS,
  // Tools
  excel: 'Excel / hojas de cálculo',
  erp: 'ERP',
  whatsapp: 'WhatsApp',
  paper: 'Registros en papel',
  other_platform: 'Otra plataforma agtech',
  none: 'Ninguna',
  // Compliance
  eudr: 'EUDR',
  organic: 'Orgánico',
  fairtrade: 'Fairtrade',
  rainforest: 'Rainforest Alliance',
  carbon: 'Carbono',
  // Buyers
  coop: 'Cooperativa',
  exporter: 'Exportador directo',
  intermediary_buyer: 'Intermediario local',
  market: 'Mercado local',
  // Boolean
  true: 'Sí',
  false: 'No',
};

export const QUESTION_WHY: Record<string, string> = {
  scale: 'La escala determina qué módulos son prioritarios y qué tipo de acompañamiento necesitan.',
  geography: 'La ubicación nos indica regulaciones aplicables, riesgos climáticos y mercados accesibles.',
  commercialization: 'El modelo de comercialización define qué herramientas de trazabilidad y calidad necesitan.',
  pain_main: 'Los dolores principales guían toda la propuesta de valor y el pitch.',
  current_tools: 'Saber qué usan hoy indica la curva de adopción y el esfuerzo de migración.',
  compliance_pressure: 'La presión regulatoria define urgencia y justifica inversión ante directivos.',
  budget_readiness: 'Saber si hay presupuesto orienta la ruta: piloto, co-inversión o propuesta enterprise.',
  urgency_timeline: 'La ventana de tiempo define si empujar cierre o nutrir la relación.',
  decision_blockers: 'Anticipar bloqueadores permite preparar respuestas y reducir fricción.',
  producer_hectares: 'El tamaño de la finca determina el modelo de licenciamiento y ROI esperado.',
  producer_buyers: 'A quién vende define las presiones de cumplimiento y las oportunidades de diferenciación.',
};

export const QUESTION_IMPACT: Record<string, string> = {
  scale: 'Ajusta las recomendaciones de módulos y el pricing sugerido.',
  geography: 'Activa señales de regulación y adapta el contexto de cumplimiento.',
  commercialization: 'Refina la ruta comercial y el posicionamiento.',
  pain_main: 'Genera señales de dolor y define los ángulos del pitch.',
  current_tools: 'Calibra el nivel de madurez digital y la estrategia de migración.',
  compliance_pressure: 'Detecta urgencia regulatoria y objeciones potenciales.',
  budget_readiness: 'Identifica si hay riesgo financiero en la negociación.',
  urgency_timeline: 'Define la estrategia de cierre: corta, media o largo plazo.',
  decision_blockers: 'Detecta objeciones antes de que aparezcan en la negociación.',
  producer_hectares: 'Ajusta la escala automáticamente y calibra la propuesta.',
  producer_buyers: 'Identifica presiones externas y oportunidades de diferenciación.',
};

/** Humanize objection trigger text for seller display */
export const OBJECTION_TRIGGER_LABELS: Record<string, string> = {
  'Respuesta directa a budget_readiness': 'El lead indicó que no tiene presupuesto asignado',
  'Budget depende de donante': 'El presupuesto depende de financiamiento externo',
  'Timeline = exploring': 'El lead aún está explorando sin urgencia de compra',
};

export function humanizeObjectionTrigger(raw: string): string {
  // Check direct map
  const mapped = OBJECTION_TRIGGER_LABELS[raw];
  if (mapped) return mapped;
  // Check if it contains decision_blockers quote
  if (raw.includes('decision_blockers')) {
    const quote = raw.match(/"(.+?)"/)?.[1];
    return quote ? `El lead declaró: "${quote}"` : 'El lead mencionó un bloqueador específico';
  }
  // Fallback: strip technical prefixes
  return raw
    .replace(/^Respuesta directa a\s*/, '')
    .replace(/^.*?=\s*/, '')
    .replace(/_/g, ' ');
}

/** Compute suggested commercial route based on profile state */
export function getSuggestedRoute(profile: {
  organization_type: string | null;
  pain_points: string[];
  signals: string[];
  raw_answers: Record<string, unknown>;
}): { route: string; why: string; evidence: string[]; missing: string[]; isDefault: boolean } {
  const { organization_type, pain_points, signals, raw_answers } = profile;

  const hasCompliance = pain_points.includes('traceability') || pain_points.includes('compliance_pressure') || signals.includes('eudr_pressure');
  const hasProductivity = pain_points.includes('productivity');
  const hasBudget = signals.includes('budget_confirmed');
  const hasUrgency = signals.includes('urgency_immediate');
  const timeline = raw_answers['urgency_timeline'] as string | undefined;
  const budget = raw_answers['budget_readiness'] as string | undefined;

  const evidence: string[] = [];
  const missing: string[] = [];

  if (hasCompliance) evidence.push('Presión de cumplimiento detectada');
  if (hasProductivity) evidence.push('Dolor de productividad declarado');
  if (hasBudget) evidence.push('Presupuesto confirmado');
  if (hasUrgency) evidence.push('Urgencia alta');
  if (!budget) missing.push('Validar capacidad presupuestaria');
  if (!timeline) missing.push('Confirmar ventana de decisión');
  if (!organization_type) missing.push('Definir tipo de organización');

  if (hasCompliance && hasUrgency) {
    return { route: 'Demo EUDR-first', why: 'Presión regulatoria con urgencia alta → demostrar cumplimiento inmediato.', evidence, missing, isDefault: false };
  }
  if (hasCompliance && !hasUrgency) {
    return { route: 'Discovery guiado', why: 'Hay presión pero no urgencia → educar y crear urgencia con casos reales.', evidence, missing, isDefault: false };
  }
  if (organization_type === 'productor_empresarial') {
    return { route: 'Ruta productor privado', why: 'Finca empresarial → enfocar en ROI directo y control operativo.', evidence, missing, isDefault: false };
  }
  if (organization_type === 'exportador') {
    return { route: 'Ruta exportador', why: 'Exportador → diferenciación por trazabilidad y gestión de proveedores.', evidence, missing, isDefault: false };
  }
  if (!hasBudget && budget === 'no_budget') {
    return { route: 'No empujar venta todavía', why: 'Sin presupuesto ni señales de urgencia → nutrir relación, no forzar cierre.', evidence, missing, isDefault: false };
  }
  if (hasBudget && hasUrgency) {
    return { route: 'Propuesta directa', why: 'Presupuesto + urgencia → cerrar con propuesta concreta.', evidence, missing, isDefault: false };
  }

  return { route: 'Piloto acotado', why: 'Perfil todavía en descubrimiento → proponer piloto de bajo riesgo.', evidence, missing, isDefault: true };
}

/** Compute critical missing information */
export function getMissingInfo(profile: {
  organization_type: string | null;
  scale: string | null;
  commercialization_model: string | null;
  raw_answers: Record<string, unknown>;
  pain_points: string[];
}): string[] {
  const missing: string[] = [];
  if (!profile.scale) missing.push('Falta definir la escala de operación');
  if (!profile.commercialization_model && profile.organization_type !== 'productor_empresarial') {
    missing.push('Falta validar modelo de comercialización');
  }
  if (profile.pain_points.length === 0) missing.push('Falta identificar dolores principales');
  if (!profile.raw_answers['budget_readiness']) missing.push('Falta validar capacidad presupuestaria');
  if (!profile.raw_answers['urgency_timeline']) missing.push('Falta confirmar ventana de decisión');
  if (!profile.raw_answers['current_tools']) missing.push('Falta entender madurez digital actual');
  if (!profile.raw_answers['decision_blockers'] && profile.raw_answers['budget_readiness']) {
    missing.push('Falta identificar bloqueadores de decisión');
  }
  return missing.slice(0, 4);
}

/** Humanize any raw value using all label maps */
export function humanizeValue(raw: unknown): string {
  if (raw == null) return '—';
  if (Array.isArray(raw)) {
    return raw.map(v => ALL_VALUE_LABELS[String(v)] ?? String(v)).join(', ');
  }
  const s = String(raw);
  return ALL_VALUE_LABELS[s] ?? s;
}

export function label(map: Record<string, string>, key: string | null | undefined, fallback?: string): string {
  if (!key) return fallback ?? '—';
  return map[key] ?? key;
}
