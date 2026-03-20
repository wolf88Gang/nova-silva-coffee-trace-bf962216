/**
 * Sales Diagnostic — adaptive lead profile and interpretation types.
 */

export type OrganizationType = 'productor' | 'cooperativa' | 'exportador' | 'beneficio';

export interface LeadProfile {
  organization_type: OrganizationType | null;
  organization_id: string | null;
  scale: string | null;
  geography: string | null;
  commercialization_model: string | null;
  pain_points: string[];
  constraints: string[];
  signals: string[];
  notes: string[];
  confidence_scores: Record<string, number>;
  updated_at: string;
}

export interface InterpretationBlock {
  id: string;
  timestamp: string;
  detected_pain_signals: string[];
  inferred_maturity: string | null;
  potential_objection: string | null;
  suggested_positioning: string | null;
}

export interface ObjectionHypothesis {
  type: string;
  confidence: number;
  triggered_by: string;
  suggested_response: string;
}

export interface AdaptivePrompt {
  id: string;
  code: string;
  text: string;
  question_type: 'single_select' | 'multi_select' | 'text' | 'textarea' | 'number' | 'boolean';
  options?: { id: string; value: string; label: string }[];
  applies_to?: OrganizationType[];
  required_fields?: (keyof LeadProfile)[];
}

export const EMPTY_LEAD_PROFILE: LeadProfile = {
  organization_type: null,
  organization_id: null,
  scale: null,
  geography: null,
  commercialization_model: null,
  pain_points: [],
  constraints: [],
  signals: [],
  notes: [],
  confidence_scores: {},
  updated_at: new Date().toISOString(),
};
