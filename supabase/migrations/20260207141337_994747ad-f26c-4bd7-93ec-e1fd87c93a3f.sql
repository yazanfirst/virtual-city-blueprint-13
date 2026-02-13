
-- Fix search_path on validate_offer_expiry function
CREATE OR REPLACE FUNCTION public.validate_offer_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
