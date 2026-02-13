
-- Atomic coin deduction function to prevent race conditions in offer redemption.
-- Uses UPDATE ... SET coins = coins - _price WHERE coins >= _price RETURNING coins
-- so the decrement is always relative to the current row value, not a stale snapshot.
CREATE OR REPLACE FUNCTION public.deduct_coins(_user_id uuid, _price integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining integer;
BEGIN
  UPDATE player_progress
    SET coins = coins - _price,
        updated_at = now()
  WHERE user_id = _user_id
    AND coins >= _price
  RETURNING coins INTO remaining;

  IF NOT FOUND THEN
    RETURN -1;  -- signals insufficient coins
  END IF;

  RETURN remaining;
END;
$$;
