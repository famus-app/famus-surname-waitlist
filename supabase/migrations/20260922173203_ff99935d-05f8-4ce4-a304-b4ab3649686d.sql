CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.claim_waitlist_surname(text, text, text) SET SCHEMA private;
ALTER FUNCTION public.claimed_popular_surnames() SET SCHEMA private;

REVOKE ALL ON FUNCTION private.claim_waitlist_surname(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.claim_waitlist_surname(text, text, text) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.claimed_popular_surnames() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.claimed_popular_surnames() TO anon, authenticated, service_role;

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
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.claim_waitlist_surname(p_surname, p_surname_key, p_email);
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
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.claimed_popular_surnames();
$$;

REVOKE ALL ON FUNCTION public.claimed_popular_surnames() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claimed_popular_surnames() TO anon, authenticated, service_role;