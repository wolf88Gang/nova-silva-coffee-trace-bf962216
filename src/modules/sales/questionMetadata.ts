/**
 * questionMetadata — static copy per question code (por qué preguntamos).
 */

export interface QuestionMetadataEntry {
  why_we_ask: string;
  what_changes: string;
  fills_profile_fields: string[];
}

const DEFAULT_META: QuestionMetadataEntry = {
  why_we_ask: 'Priorizar el siguiente paso comercial con datos reales del prospecto.',
  what_changes: 'Ajusta puntuación y ruta sugerida en el panel derecho.',
  fills_profile_fields: [],
};

export const QUESTION_METADATA: Record<string, QuestionMetadataEntry> = {
  CTX_ORG_TYPE: {
    why_we_ask: 'El tipo de organización filtra preguntas irrelevantes y el tono del pitch.',
    what_changes: 'Activa reglas de prioridad (p. ej. productor vs cooperativa).',
    fills_profile_fields: ['organization_type'],
  },
  CTX_PRODUCERS: {
    why_we_ask: 'La escala define complejidad de despliegue y módulos clave.',
    what_changes: 'Completa el gap de escala y ajusta fit operativo.',
    fills_profile_fields: ['scale'],
  },
  PAIN_REJECT: {
    why_we_ask: 'Lotes rechazados cuantifican dolor tangible y ROI de trazabilidad.',
    what_changes: 'Refuerza señales de dolor y objeciones de cumplimiento.',
    fills_profile_fields: ['pain_severity'],
  },
  PAIN_HOURS: {
    why_we_ask: 'Horas manuales en trazabilidad son palanca de eficiencia.',
    what_changes: 'Señal de dolor operativo para priorizar automatización.',
    fills_profile_fields: ['pain_severity'],
  },
  MAT_SYSTEMS: {
    why_we_ask: 'Sistemas actuales definen curva de adopción y migración de datos.',
    what_changes: 'Madurez y posibles objeciones de complejidad.',
    fills_profile_fields: ['maturity_level'],
  },
  COMP_EUDR_AWARE: {
    why_we_ask: 'Conocimiento EUDR orienta profundidad del mensaje regulatorio.',
    what_changes: 'Certificación / cumplimiento percibido.',
    fills_profile_fields: ['certification_status'],
  },
  URG_TIMELINE: {
    why_we_ask: 'Plazos definen urgencia real del ciclo de venta.',
    what_changes: 'Urgencia y prioridad en la ruta comercial.',
    fills_profile_fields: ['urgency_timeline'],
  },
  BUD_AVAILABLE: {
    why_we_ask: 'Disponibilidad de presupuesto califica el avance hacia propuesta.',
    what_changes: 'Readiness presupuestario y riesgo de precio.',
    fills_profile_fields: ['budget_readiness'],
  },
  OBJ_MAIN_CONCERN: {
    why_we_ask: 'La preocupación principal guía el siguiente argumento.',
    what_changes: 'Perfil de objeciones y ruta sugerida.',
    fills_profile_fields: ['objection_profile'],
  },
};

export function getQuestionMetadata(code: string): QuestionMetadataEntry {
  return QUESTION_METADATA[code] ?? DEFAULT_META;
}
