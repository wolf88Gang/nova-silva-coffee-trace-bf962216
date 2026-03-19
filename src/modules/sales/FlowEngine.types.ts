// ─── DB Enum mirrors ──────────────────────────────────────────────────────────

export type SalesQuestionType =
  | 'single_select'
  | 'multi_select'
  | 'number'
  | 'boolean'
  | 'text'
  | 'textarea';

export type ScoreField =
  | 'score_total'
  | 'score_pain'
  | 'score_maturity'
  | 'score_objection'
  | 'score_urgency'
  | 'score_fit'
  | 'score_budget_readiness';

export type SalesObjectionType =
  | 'price'
  | 'timing'
  | 'complexity'
  | 'trust'
  | 'internal_solution'
  | 'no_priority'
  | 'compliance_fear'
  | 'adoption_risk'
  | 'competition'
  | 'other';

export type SalesRecommendationType = 'demo' | 'plan' | 'pitch' | 'next_step' | 'resource';

// ─── Flow flags ───────────────────────────────────────────────────────────────
// Computed at runtime from scores + objections.
// Used to decide when to deepen the diagnostic.

export type FlowFlag =
  | 'high_pain'          // score_pain   >= THRESHOLD
  | 'high_objection'     // score_objection >= THRESHOLD or objection count >= 1
  | 'unclear_maturity'   // score_maturity  <= THRESHOLD after N answers
  | 'deepening_active'   // any of the three above is true
  | 'low_fit'            // score_fit        <= THRESHOLD
  | 'budget_risk';       // score_budget_readiness <= THRESHOLD

// ─── Scores ───────────────────────────────────────────────────────────────────

export interface ScoreState {
  score_total: number;
  score_pain: number;
  score_maturity: number;
  score_objection: number;
  score_urgency: number;
  score_fit: number;
  score_budget_readiness: number;
}

// ─── Skip/Branch rule stored in sales_questions.metadata ─────────────────────
//
// Schema contract for the `metadata` JSONB column on sales_questions.
// This is purely evaluated client-side by the flow engine.
// No new DB table required.
//
// skip_if:       Array of conditions. If ANY evaluates true → skip this question.
// deepen_when:   Surface this question earlier when these flags are active.
// deepening_only: Never shown in normal flow. Only appears when deepening is active.

export type SkipOperator =
  | 'answered'           // question has any recorded answer
  | 'not_answered'       // question has no recorded answer
  | 'answered_with'      // answer_option_ids contains value(s)
  | 'not_answered_with'  // answer_option_ids does not contain any of value(s)
  | 'boolean_is'         // answer_boolean === value
  | 'number_above'       // answer_number > value
  | 'number_below';      // answer_number < value

export interface SkipCondition {
  question_code: string;
  operator: SkipOperator;
  // Required for: answered_with, not_answered_with, boolean_is, number_above, number_below
  value?: string | string[] | number | boolean;
}

export interface QuestionMetadata {
  skip_if?: SkipCondition[];
  deepen_when?: FlowFlag[];
  deepening_only?: boolean;
}

// ─── Loaded data structures (shaped from DB rows) ─────────────────────────────

export interface LoadedSection {
  id: string;
  position: number;
  code: string;
  title: string;
}

export interface LoadedOption {
  id: string;
  value: string;
  label: string;
  weight: number | null;
  position: number;
}

export interface LoadedQuestion {
  id: string;
  questionnaire_id: string;
  section_id: string;
  section: LoadedSection;
  position: number;
  code: string;
  text: string;
  help: string | null;
  question_type: SalesQuestionType;
  is_required: boolean;
  metadata: QuestionMetadata | null;
  options: LoadedOption[];
}

export interface LoadedAnswer {
  question_id: string;
  question_code: string;
  answer_text: string | null;
  answer_number: number | null;
  answer_boolean: boolean | null;
  answer_option_ids: string[] | null;
  answer_json: unknown | null;
}

export interface LoadedObjection {
  objection_type: SalesObjectionType;
  confidence: number;
  source_rule: string | null;
}

// ─── Engine I/O ───────────────────────────────────────────────────────────────

export interface FlowEngineInput {
  questions: LoadedQuestion[];   // All active questions for the questionnaire, pre-sorted
  answers: LoadedAnswer[];       // All answers recorded for this session
  scores: ScoreState;            // Current score snapshot from the session
  objections: LoadedObjection[]; // Currently detected objections
}

export interface FlowState {
  next_question_id: string | null;
  next_question: LoadedQuestion | null;
  is_complete: boolean;
  context: ScoreState;
  detected_objections: LoadedObjection[];
  flags: FlowFlag[];
  deepening_active: boolean;
  progress: {
    answered: number;
    total_visible: number;   // excludes deepening_only questions
    percentage: number;
  };
}
