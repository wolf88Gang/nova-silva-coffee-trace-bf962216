/**
 * Shared UI constants for Sales Intelligence.
 * Single source of truth for labels across wizard, insight panel, and results.
 */

export const SCORE_LABELS: Record<string, string> = {
  score_total: 'Total',
  score_pain: 'Dolor',
  score_maturity: 'Madurez',
  score_objection: 'Objeción',
  score_urgency: 'Urgencia',
  score_fit: 'Fit',
  score_budget_readiness: 'Presup.',
};

export const OBJECTION_LABELS: Record<string, string> = {
  price: 'Precio',
  timing: 'Timing',
  complexity: 'Complejidad',
  trust: 'Confianza',
  no_priority: 'Sin prioridad',
  compliance_fear: 'Cumplimiento',
  adoption_risk: 'Adopción',
  competition: 'Competencia',
  internal_solution: 'Solución interna',
  other: 'Otro',
};

export const REC_TYPE_LABELS: Record<string, string> = {
  pitch: 'Pitch',
  demo: 'Demo',
  plan: 'Plan',
  next_step: 'Siguiente paso',
  resource: 'Recurso',
};
