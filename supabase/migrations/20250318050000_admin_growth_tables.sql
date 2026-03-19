-- Admin Panel — Growth: feedback y oportunidades
CREATE TABLE IF NOT EXISTS public.admin_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'media',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_feedback_org ON public.admin_feedback (organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_status ON public.admin_feedback (status);

CREATE TABLE IF NOT EXISTS public.admin_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('high_usage_low_plan', 'trial_engaged', 'inactive_recoverable', 'addon_candidate')),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_opportunities_org ON public.admin_opportunities (organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_opportunities_type ON public.admin_opportunities (type);

ALTER TABLE public.admin_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_feedback_select" ON public.admin_feedback;
CREATE POLICY "admin_feedback_select" ON public.admin_feedback
  FOR SELECT USING (public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "admin_opportunities_select" ON public.admin_opportunities;
CREATE POLICY "admin_opportunities_select" ON public.admin_opportunities
  FOR SELECT USING (public.is_admin() OR organization_id = public.get_user_organization_id(auth.uid()));
