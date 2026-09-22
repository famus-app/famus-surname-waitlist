CREATE TABLE public.waitlist_stats (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  claimed_count bigint NOT NULL DEFAULT 0 CHECK (claimed_count >= 0)
);

GRANT SELECT ON public.waitlist_stats TO anon, authenticated;
GRANT ALL ON public.waitlist_stats TO service_role;

ALTER TABLE public.waitlist_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read the aggregate waitlist count"
ON public.waitlist_stats
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.waitlist_stats (id, claimed_count)
SELECT true, count(*) FROM public.waitlist_claims;

CREATE OR REPLACE FUNCTION public.increment_waitlist_claim_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.waitlist_stats
  SET claimed_count = claimed_count + 1
  WHERE id = true;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_waitlist_claim_count() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER increment_waitlist_claim_count_after_insert
AFTER INSERT ON public.waitlist_claims
FOR EACH ROW
EXECUTE FUNCTION public.increment_waitlist_claim_count();

REVOKE ALL ON FUNCTION public.waitlist_claim_count() FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.waitlist_claim_count();