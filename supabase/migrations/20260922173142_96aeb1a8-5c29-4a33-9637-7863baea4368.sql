ALTER TABLE public.waitlist_claims
ADD COLUMN claim_number bigint GENERATED ALWAYS AS IDENTITY;

ALTER TABLE public.waitlist_claims
ALTER COLUMN claim_number SET NOT NULL;

ALTER TABLE public.waitlist_claims
ADD CONSTRAINT waitlist_claims_claim_number_key UNIQUE (claim_number);

REVOKE INSERT ON public.waitlist_claims FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_waitlist_surname(
  p_surname text,
  p_surname_key text,
  p_email text
)
RETURNS TABLE (
  surname text,
  surname_key text,
  claim_number bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF char_length(trim(p_surname)) NOT BETWEEN 1 AND 80
    OR p_surname_key <> lower(regexp_replace(trim(p_surname), '[[:space:]'']+', '-', 'g'))
    OR p_surname_key !~ '^[a-zà-ž]+(?:-[a-zà-ž-]+)*$'
    OR char_length(p_email) NOT BETWEEN 3 AND 320
    OR p_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  THEN
    RAISE EXCEPTION 'Invalid claim details' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  INSERT INTO public.waitlist_claims (surname, surname_key, email)
  VALUES (trim(p_surname), p_surname_key, lower(trim(p_email)))
  RETURNING waitlist_claims.surname, waitlist_claims.surname_key, waitlist_claims.claim_number;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_waitlist_surname(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_waitlist_surname(text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.claimed_popular_surnames()
RETURNS TABLE (
  surname text,
  surname_key text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wc.surname, wc.surname_key
  FROM public.waitlist_claims AS wc
  WHERE wc.surname_key = ANY (ARRAY['smith', 'patel', 'kim', 'gupta', 'garcia', 'williams', 'singh', 'chen'])
  ORDER BY array_position(ARRAY['smith', 'patel', 'kim', 'gupta', 'garcia', 'williams', 'singh', 'chen'], wc.surname_key);
$$;

REVOKE ALL ON FUNCTION public.claimed_popular_surnames() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claimed_popular_surnames() TO anon, authenticated, service_role;