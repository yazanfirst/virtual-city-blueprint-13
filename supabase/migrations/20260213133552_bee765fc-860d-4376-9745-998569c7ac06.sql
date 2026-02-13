
-- Harden deduct_coins: reject non-positive prices and restrict execute to service_role only
CREATE OR REPLACE FUNCTION public.deduct_coins(_user_id uuid, _price integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining integer;
BEGIN
  -- Reject non-positive prices
  IF _price <= 0 THEN
    RAISE EXCEPTION 'price must be positive';
  END IF;

  UPDATE player_progress
    SET coins = coins - _price,
        updated_at = now()
  WHERE user_id = _user_id
    AND coins >= _price
  RETURNING coins INTO remaining;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN remaining;
END;
$$;

-- Lock down execute privileges to service_role only
REVOKE EXECUTE ON FUNCTION public.deduct_coins(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_coins(uuid, integer) TO service_role;
