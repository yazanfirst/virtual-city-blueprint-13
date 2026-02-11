
-- Table: player_shop_visits
-- Tracks which shops each player has visited (prevents shop visit coin farming)
CREATE TABLE public.player_shop_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

ALTER TABLE public.player_shop_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own shop visits"
  ON public.player_shop_visits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can view own shop visits"
  ON public.player_shop_visits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Table: mission_completions
-- Records first-time mission level completions (prevents mission replay farming)
CREATE TABLE public.mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_type text NOT NULL,
  level integer NOT NULL,
  coins_earned integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_type, level)
);

ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own mission completions"
  ON public.mission_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can view own mission completions"
  ON public.mission_completions
  FOR SELECT
  USING (auth.uid() = user_id);
