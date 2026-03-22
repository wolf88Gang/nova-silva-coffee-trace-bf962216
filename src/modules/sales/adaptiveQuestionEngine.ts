/**
 * adaptiveQuestionEngine — heuristics for free-text / seller notes (interpretAnswer only).
 * Next-question selection: priorityEngine via FlowEngineLoader only.
 */

import type { LeadProfile } from '@/types/salesDiagnostic';

export function interpretAnswer(
  _questionCode: string,
  value: unknown,
  _profile: LeadProfile
): {
  detected_pain_signals: string[];
  inferred_maturity: string | null;
  potential_objection: string | null;
  suggested_positioning: string | null;
} {
  const signals: string[] = [];
  let maturity: string | null = null;
  let objection: string | null = null;
  let positioning: string | null = null;
  const str = String(value ?? '').toLowerCase();

  if (str.includes('precio') || str.includes('costo') || str.includes('caro')) {
    signals.push('price_sensitivity');
    objection = 'price';
    positioning = 'Enfocarse en ROI y reduccion de costos operativos';
  }
  if (str.includes('complej') || str.includes('dificil') || str.includes('tiempo')) {
    signals.push('complexity_concern');
    objection = 'complexity';
    positioning = 'Destacar simplicidad y onboarding guiado';
  }
  if (str.includes('eudr') || str.includes('cumplimiento') || str.includes('certificacion')) {
    signals.push('compliance_priority');
    maturity = maturity ?? 'medium';
    positioning = positioning ?? 'Trazabilidad EUDR y reportes listos';
  }

  return {
    detected_pain_signals: signals.length ? signals : [],
    inferred_maturity: maturity,
    potential_objection: objection,
    suggested_positioning: positioning,
  };
}
