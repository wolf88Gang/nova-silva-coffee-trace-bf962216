/**
 * Commercial-facing labels for the Sales Copilot.
 * Replaces all raw codes, enum values, and internal keys with seller-readable Spanish.
 */

export const ORG_TYPE_LABELS: Record<string, string> = {
  cooperativa: 'Cooperativa',
  exportador: 'Exportador',
  beneficio_privado: 'Beneficio privado',
  productor_empresarial: 'Productor empresarial',
  aggregator: 'Aggregator / Trader',
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
  'Emergente': 'Emergente',
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

/** Compute suggested commercial route based on profile state */
export function getSuggestedRoute(profile: {
  organization_type: string | null;
  pain_points: string[];
  signals: string[];
  raw_answers: Record<string, unknown>;
}): { route: string; why: string; evidence: string[]; missing: string[] } {
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

  // Route logic
  if (hasCompliance && hasUrgency) {
    return { route: 'Demo EUDR-first', why: 'Presión regulatoria con urgencia alta → demostrar cumplimiento inmediato.', evidence, missing };
  }
  if (hasCompliance && !hasUrgency) {
    return { route: 'Discovery guiado', why: 'Hay presión pero no urgencia → educar y crear urgencia con casos reales.', evidence, missing };
  }
  if (organization_type === 'productor_empresarial') {
    return { route: 'Ruta productor privado', why: 'Finca empresarial → enfocar en ROI directo y control operativo.', evidence, missing };
  }
  if (organization_type === 'exportador') {
    return { route: 'Ruta exportador', why: 'Exportador → diferenciación por trazabilidad y gestión de proveedores.', evidence, missing };
  }
  if (!hasBudget && budget === 'no_budget') {
    return { route: 'No empujar venta todavía', why: 'Sin presupuesto ni señales de urgencia → nutrir relación, no forzar cierre.', evidence, missing };
  }
  if (hasBudget && hasUrgency) {
    return { route: 'Propuesta directa', why: 'Presupuesto + urgencia → cerrar con propuesta concreta.', evidence, missing };
  }

  return { route: 'Piloto acotado', why: 'Perfil todavía en descubrimiento → proponer piloto de bajo riesgo.', evidence, missing };
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
  return missing.slice(0, 4); // top 4 most critical
}

export function label(map: Record<string, string>, key: string | null | undefined, fallback?: string): string {
  if (!key) return fallback ?? '—';
  return map[key] ?? key;
}
