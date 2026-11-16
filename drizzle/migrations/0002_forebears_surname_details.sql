CREATE TABLE public.surname_details (
  surname_key text PRIMARY KEY,
  surname text NOT NULL,
  reported_count bigint,
  jurisdictions jsonb NOT NULL DEFAULT '[]'::jsonb,
  match_status text NOT NULL CHECK (match_status IN ('matched', 'not_found')),
  source text NOT NULL DEFAULT 'Forebears OnoGraph',
  checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.surname_details TO anon, authenticated;
GRANT ALL ON public.surname_details TO service_role;
ALTER TABLE public.surname_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public surname statistics are readable" ON public.surname_details FOR SELECT TO anon, authenticated USING (true);