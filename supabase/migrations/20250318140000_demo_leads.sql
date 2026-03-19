-- Demo leads: captura en Supabase externo.
-- Sin Lovable. RLS: INSERT flujo actual, SELECT/UPDATE solo admins.

CREATE TABLE IF NOT EXISTS public.demo_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  nombre text NOT NULL,
  email text NOT NULL,
  organizacion text,
  tipo_organizacion text,
  mensaje text,
  demo_org_type text,
  demo_profile_label text,
  demo_route text,
  cta_source text,
  status text NOT NULL DEFAULT 'new',
  notes text
);

CREATE INDEX IF NOT EXISTS idx_demo_leads_created_at ON public.demo_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_leads_status ON public.demo_leads (status);
CREATE INDEX IF NOT EXISTS idx_demo_leads_email ON public.demo_leads (email);

ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_leads_insert" ON public.demo_leads;
CREATE POLICY "demo_leads_insert" ON public.demo_leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "demo_leads_select_admin" ON public.demo_leads;
CREATE POLICY "demo_leads_select_admin" ON public.demo_leads
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "demo_leads_update_admin" ON public.demo_leads;
CREATE POLICY "demo_leads_update_admin" ON public.demo_leads
  FOR UPDATE USING (public.is_admin());
