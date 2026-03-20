/**
 * Priority Engine — signal-driven question selection types.
 *
 * Replaces question-driven (order-based) flow with relevance-based selection.
 */

import type { OrganizationType } from '@/types/salesDiagnostic';
import type { LoadedQuestion, LoadedAnswer, LoadedOption } from './FlowEngine.types';

// ─── Critical profile fields (gaps we want to fill) ────────────────────────────

export type ProfileGapField =
  | 'organization_type'
  | 'scale'
  | 'commercialization_model'
  | 'pricing_power'
  | 'buyer_type'
  | 'logistics_model'
  | 'certification_status'
  | 'pain_severity'
  | 'maturity_level'
  | 'urgency_timeline'
  | 'budget_readiness'
  | 'objection_profile';

// ─── Signal types ──────────────────────────────────────────────────────────────

export type PainSignal =
  | 'rejections'
  | 'manual_hours'
  | 'visibility_gap'
  | 'cost_impact'
  | 'severity_high';

export type MaturitySignal =
  | 'legacy_systems'
  | 'mobile_adoption'
  | 'connectivity'
  | 'data_format';

export type UrgencySignal =
  | 'timeline_short'
  | 'harvest_soon'
  | 'deadline_pressure';

export type ContradictionFlag =
  | 'budget_vs_urgency'
  | 'maturity_vs_complexity'
  | 'pain_vs_priority';

export interface DiagnosticSignals {
  pain_signals: PainSignal[];
  maturity_signals: MaturitySignal[];
  urgency_signals: UrgencySignal[];
  contradiction_flags: ContradictionFlag[];
}

// ─── Priority model (per question) ─────────────────────────────────────────────

export interface QuestionPriorityModel {
  id: string;
  code: string;
  applies_to: OrganizationType[];
  tags: string[];
  weight: number;
  dependencies: string[];
  unlocks: string[];
  signal_targets: (PainSignal | MaturitySignal | UrgencySignal)[];
  gap_targets: ProfileGapField[];
  /** Tags that cause this question to be BLOCKED when org_type matches block rule */
  blocks_for_org_types?: { org_type: OrganizationType; when_tagged: string[] }[];
}

// ─── Profile (built from answers) ──────────────────────────────────────────────

export interface PriorityProfile {
  organization_type: OrganizationType | null;
  scale: string | null;
  commercialization_model: string | null;
  pricing_power: string | null;
  buyer_type: string | null;
  logistics_model: string | null;
  certification_status: string | null;
  pain_severity: string | null;
  maturity_level: string | null;
  urgency_timeline: string | null;
  budget_readiness: string | null;
  objection_profile: string | null;
}

// ─── "Why this question?" reason ──────────────────────────────────────────────

export interface NextQuestionReason {
  gap_fills: ProfileGapField[];
  signal_triggers: string[];
  score_breakdown?: {
    weight: number;
    gap_relevance: number;
    signal_relevance: number;
    contradiction_priority: number;
    redundancy_penalty: number;
    total: number;
  };
}

// ─── Engine output ─────────────────────────────────────────────────────────────

export interface PriorityEngineResult {
  next_question: LoadedQuestion | null;
  next_question_id: string | null;
  reason: NextQuestionReason | null;
  is_complete: boolean;
  skipped_count: number;
}
