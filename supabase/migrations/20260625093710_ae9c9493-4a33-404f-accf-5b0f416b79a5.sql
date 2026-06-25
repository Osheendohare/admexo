
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  requirement TEXT NOT NULL,
  ai_category TEXT,
  ai_priority TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert leads" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone can view leads" ON public.leads FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.email_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  open_token TEXT NOT NULL UNIQUE,
  click_token TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_sends TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sends TO authenticated;
GRANT ALL ON public.email_sends TO service_role;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view sends" ON public.email_sends FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_send_id UUID NOT NULL REFERENCES public.email_sends(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('open','click')),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view events" ON public.email_events FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX email_events_send_idx ON public.email_events(email_send_id, event_type);
CREATE INDEX email_sends_lead_idx ON public.email_sends(lead_id);
