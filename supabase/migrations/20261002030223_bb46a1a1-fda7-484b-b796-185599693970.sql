ALTER TABLE public.waitlist_claims ADD COLUMN full_name text, ADD COLUMN priority_interest boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION private.claim_waitlist_surname(
  p_surname text,
  p_surname_key text,
  p_email text,
  p_name text,
  p_priority_interest boolean
)
RETURNS TABLE (surname text, surname_key text, claim_number bigint)
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
    OR p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 1 AND 100
    OR p_priority_interest IS NULL
  THEN
    RAISE EXCEPTION 'Invalid claim details' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  INSERT INTO public.waitlist_claims (surname, surname_key, email, full_name, priority_interest)
  VALUES (trim(p_surname), p_surname_key, lower(trim(p_email)), trim(p_name), p_priority_interest)
  RETURNING waitlist_claims.surname, waitlist_claims.surname_key, waitlist_claims.claim_number;
END;
$$;

REVOKE ALL ON FUNCTION private.claim_waitlist_surname(text, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private.claim_waitlist_surname(text, text, text, text, boolean) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.claim_waitlist_surname(
  p_surname text,
  p_surname_key text,
  p_email text,
  p_name text,
  p_priority_interest boolean
)
RETURNS TABLE (surname text, surname_key text, claim_number bigint)
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.claim_waitlist_surname(p_surname, p_surname_key, p_email, p_name, p_priority_interest);
$$;

REVOKE ALL ON FUNCTION public.claim_waitlist_surname(text, text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_waitlist_surname(text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_waitlist_surname(text, text, text, text, boolean) TO anon, authenticated, service_role;