-- Sales Intelligence — Schema base
-- Tablas, enums, constraints. Sin seed. Sin RLS.

-- ========== ENUMS ==========

DO $$ BEGIN
  CREATE TYPE public.sales_session_status AS ENUM ('draft', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sales_objection_type AS ENUM (
    'price', 'timing', 'complexity', 'trust', 'no_priority',
    'compliance_fear', 'adoption_risk', 'competition', 'internal_solution', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sales_question_type AS ENUM (
    'single_select', 'multi_select', 'number', 'boolean', 'text', 'textarea'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== CATALOG TABLES ==========

CREATE TABLE IF NOT EXISTS public.sales_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(code, version)
);

CREATE TABLE IF NOT EXISTS public.sales_question_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.sales_questionnaires(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.sales_questionnaires(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sales_question_sections(id) ON DELETE CASCADE,
  code text NOT NULL,
  text text NOT NULL,
  help text,
  question_type public.sales_question_type NOT NULL DEFAULT 'single_select',
  position integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.sales_questions(id) ON DELETE CASCADE,
  value text NOT NULL,
  label text NOT NULL,
  weight numeric,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.sales_questionnaires(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.sales_questions(id) ON DELETE CASCADE,
  answer_option_id uuid REFERENCES public.sales_answer_options(id) ON DELETE CASCADE,
  score_dimension text NOT NULL,
  weight integer NOT NULL DEFAULT 0,
  rule_code text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_objection_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.sales_questionnaires(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.sales_questions(id) ON DELETE CASCADE,
  answer_option_id uuid REFERENCES public.sales_answer_options(id) ON DELETE CASCADE,
  objection_type public.sales_objection_type NOT NULL,
  confidence numeric NOT NULL DEFAULT 0.5,
  rule_code text,
  created_at timestamptz DEFAULT now()
);

-- ========== SESSION TABLES ==========

CREATE TABLE IF NOT EXISTS public.sales_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  questionnaire_id uuid NOT NULL REFERENCES public.sales_questionnaires(id) ON DELETE RESTRICT,
  questionnaire_version integer NOT NULL DEFAULT 1,
  status public.sales_session_status NOT NULL DEFAULT 'draft',
  commercial_stage text DEFAULT 'lead',
  lead_name text,
  lead_company text,
  lead_type text,
  owner_user_id uuid,
  metadata jsonb,
  score_total integer DEFAULT 0,
  score_pain integer DEFAULT 0,
  score_maturity integer DEFAULT 0,
  score_objection integer DEFAULT 0,
  score_urgency integer DEFAULT 0,
  score_fit integer DEFAULT 0,
  score_budget_readiness integer DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.sales_session_answers (
  session_id uuid NOT NULL REFERENCES public.sales_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.sales_questions(id) ON DELETE CASCADE,
  answer_text text,
  answer_number numeric,
  answer_boolean boolean,
  answer_option_ids uuid[],
  answer_json jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.sales_session_objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sales_sessions(id) ON DELETE CASCADE,
  objection_type public.sales_objection_type NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  source_rule text,
  evidence jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, objection_type, source_rule)
);

CREATE TABLE IF NOT EXISTS public.sales_session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sales_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_session_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sales_sessions(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text,
  payload jsonb,
  priority integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, recommendation_type, title)
);

CREATE TABLE IF NOT EXISTS public.sales_session_question_snapshots (
  session_id uuid NOT NULL REFERENCES public.sales_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.sales_questions(id) ON DELETE CASCADE,
  question_code text NOT NULL,
  question_text text NOT NULL,
  question_type public.sales_question_type NOT NULL,
  section_code text NOT NULL,
  section_title text NOT NULL,
  answer_option_id uuid,
  answer_option_value text,
  answer_option_label text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (session_id, question_id, answer_option_id)
);

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_ss_org ON public.sales_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_ss_status ON public.sales_sessions (status);
CREATE INDEX IF NOT EXISTS idx_ss_deleted ON public.sales_sessions (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sso_session ON public.sales_session_objections (session_id);
CREATE INDEX IF NOT EXISTS idx_ssr_questionnaire ON public.sales_scoring_rules (questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_sor_questionnaire ON public.sales_objection_rules (questionnaire_id);
