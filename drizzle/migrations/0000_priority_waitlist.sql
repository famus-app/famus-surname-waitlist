CREATE TABLE public.priority_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  requested_surname text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.priority_waitlist TO anon, authenticated;
GRANT ALL ON public.priority_waitlist TO service_role;
ALTER TABLE public.priority_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join the priority list" ON public.priority_waitlist
FOR INSERT TO anon, authenticated
WITH CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' AND length(requested_surname) BETWEEN 1 AND 80 AND (full_name IS NULL OR length(full_name) <= 120));