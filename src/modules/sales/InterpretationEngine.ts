/**
 * InterpretationEngine — pure derivation for Commercial Copilot.
 */

import { buildProfileFromAnswers, getProfileGaps, getSignalsFromAnswers } from './priorityEngine';
import type { InterpretationEngineInput, CopilotInterpretation, CommercialRouteKey } from './InterpretationEngine.types';
import { PLAN_SUMMARY, ROUTE_LABELS } from './commercialLabels';

function scoreToFitPercent(fit: number, total: number): number {
  const t = Math.max(total, 1);
  return Math.min(100, Math.round((fit / t) * 100));
}

function deriveRoute(input: InterpretationEngineInput): { key: CommercialRouteKey; rationale: string[] } {
  const { flowState } = input;
  const ctx = flowState.context;
  const rationale: string[] = [];
  let key: CommercialRouteKey = 'nurture';

  if (flowState.flags.includes('budget_risk') && ctx.score_urgency < 20) {
    key = 'disqualify_soft';
    rationale.push('Urgencia baja y riesgo presupuestario');
  } else if (ctx.score_objection >= 25 || flowState.detected_objections.length >= 2) {
    key = 'exec_workshop';
    rationale.push('Objeciones fuertes: alinear valor con decisores');
  } else if (ctx.score_pain >= 35 && ctx.score_urgency >= 20) {
    key = 'pilot_field';
    rationale.push('Dolor y urgencia altos: piloto acotado');
  } else if (ctx.score_fit >= 20 || flowState.flags.includes('high_pain')) {
    key = 'demo_eudr';
    rationale.push('Fit o dolor: demo orientada a EUDR/trazabilidad');
  } else {
    rationale.push('Nutrir hasta mas senales de compra');
  }

  return { key, rationale };
}

export function buildCopilotInterpretation(input: InterpretationEngineInput): CopilotInterpretation {
  const { flowState, questions, answers } = input;
  const priorityProfile = buildProfileFromAnswers(answers, questions);
  const gaps = getProfileGaps(priorityProfile);
  const signals = getSignalsFromAnswers(answers, questions);
  const { key, rationale } = deriveRoute(input);
  const fitPercent = scoreToFitPercent(flowState.context.score_fit, flowState.context.score_total || 1);

  return {
    priorityProfile,
    gaps,
    signals,
    routeKey: key,
    routeRationale: [ROUTE_LABELS[key], ...rationale],
    planSummary: PLAN_SUMMARY[key],
    fitPercent,
  };
}
