/**
 * commercialLabels — Spanish UI copy for Commercial Copilot (Zone B/C).
 */

import type { ProfileGapField } from './priorityEngine.types';

export const PROFILE_FIELD_LABELS: Record<ProfileGapField, string> = {
  organization_type: 'Tipo de organización',
  scale: 'Escala',
  commercialization_model: 'Modelo comercial',
  pricing_power: 'Poder de precios',
  buyer_type: 'Tipo de comprador',
  logistics_model: 'Logística',
  certification_status: 'Certificación / cumplimiento',
  pain_severity: 'Dolor operativo',
  maturity_level: 'Madurez digital',
  urgency_timeline: 'Urgencia',
  budget_readiness: 'Presupuesto',
  objection_profile: 'Objeciones',
};

export const OBJECTION_LABELS: Record<string, string> = {
  price: 'Precio / TCO',
  timing: 'Timing',
  complexity: 'Complejidad',
  trust: 'Confianza',
  internal_solution: 'Solución interna',
  no_priority: 'No es prioridad',
  compliance_fear: 'Miedo al cumplimiento',
  adoption_risk: 'Riesgo de adopción',
  competition: 'Competencia',
  other: 'Otra',
};

export const ROUTE_LABELS: Record<string, string> = {
  demo_eudr: 'Demo EUDR + trazabilidad',
  pilot_field: 'Piloto en campo',
  exec_workshop: 'Workshop ejecutivo',
  nurture: 'Nutrir con contenido',
  disqualify_soft: 'Baja prioridad — seguimiento ligero',
};

export const PLAN_SUMMARY: Record<string, string> = {
  demo_eudr: 'Enfocar en cumplimiento UE, lotes y due diligence.',
  pilot_field: 'Reducir riesgo con piloto acotado y KPI claros.',
  exec_workshop: 'Alinear decisión: ROI, presupuesto, dueño.',
  nurture: 'Mantener relación hasta ventana de compra.',
  disqualify_soft: 'No forzar cierre; dejar puerta abierta.',
};
