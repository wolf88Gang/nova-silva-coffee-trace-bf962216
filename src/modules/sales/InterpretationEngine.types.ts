/**
 * InterpretationEngine — types for Commercial Copilot (pure derivation from bundle).
 */

import type { FlowState, LoadedQuestion, LoadedAnswer } from './FlowEngine.types';
import type { PriorityProfile, ProfileGapField, DiagnosticSignals } from './priorityEngine.types';

export type CommercialRouteKey =
  | 'demo_eudr'
  | 'pilot_field'
  | 'exec_workshop'
  | 'nurture'
  | 'disqualify_soft';

export interface CopilotInterpretation {
  priorityProfile: PriorityProfile;
  gaps: ProfileGapField[];
  signals: DiagnosticSignals;
  routeKey: CommercialRouteKey;
  routeRationale: string[];
  planSummary: string;
  fitPercent: number;
}

export interface InterpretationEngineInput {
  flowState: FlowState;
  questions: LoadedQuestion[];
  answers: LoadedAnswer[];
}
