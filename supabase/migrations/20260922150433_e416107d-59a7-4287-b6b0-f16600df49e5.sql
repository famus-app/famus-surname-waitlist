CREATE TABLE public.waitlist_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surname text NOT NULL,
  surname_key text NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT surname_length CHECK (char_length(surname) BETWEEN 1 AND 80),
  CONSTRAINT email_length CHECK (char_length(email) BETWEEN 3 AND 320)
);

GRANT INSERT ON public.waitlist_claims TO anon;
GRANT INSERT ON public.waitlist_claims TO authenticated;
GRANT ALL ON public.waitlist_claims TO service_role;

ALTER TABLE public.waitlist_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can claim an available surname"
ON public.waitlist_claims
FOR INSERT
TO anon, authenticated
WITH CHECK (
  surname_key = lower(regexp_replace(trim(surname), '[[:space:]'']+', '-', 'g'))
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
);

CREATE OR REPLACE FUNCTION public.waitlist_claim_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.waitlist_claims;
$$;

REVOKE ALL ON FUNCTION public.waitlist_claim_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.waitlist_claim_count() TO anon, authenticated, service_role;