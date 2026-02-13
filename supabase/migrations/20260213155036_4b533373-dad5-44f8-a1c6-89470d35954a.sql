
-- 1. Track external link clicks from shop interior
CREATE TABLE IF NOT EXISTS public.shop_link_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_link_clicks ENABLE ROW LEVEL SECURITY;

-- Players can insert their own clicks
CREATE POLICY "Players can insert own link clicks"
  ON public.shop_link_clicks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Merchants can view clicks for own shops
CREATE POLICY "Merchants can view own shop link clicks"
  ON public.shop_link_clicks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops s WHERE s.id = shop_link_clicks.shop_id AND s.merchant_id = auth.uid()
  ));

-- Admins can view all
CREATE POLICY "Admins can view all link clicks"
  ON public.shop_link_clicks FOR SELECT
  USING (is_admin(auth.uid()));

-- Index for merchant analytics queries
CREATE INDEX IF NOT EXISTS idx_shop_link_clicks_shop_id ON public.shop_link_clicks(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_link_clicks_created ON public.shop_link_clicks(shop_id, created_at);

-- 2. Shop ratings table
CREATE TABLE IF NOT EXISTS public.shop_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id, user_id)
);
ALTER TABLE public.shop_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view ratings
CREATE POLICY "Authenticated can view ratings"
  ON public.shop_ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Players can insert their own rating
CREATE POLICY "Players can insert own rating"
  ON public.shop_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Players can update their own rating
CREATE POLICY "Players can update own rating"
  ON public.shop_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Merchants can view ratings for own shops
CREATE POLICY "Merchants can view own shop ratings"
  ON public.shop_ratings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops s WHERE s.id = shop_ratings.shop_id AND s.merchant_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_shop_ratings_shop_id ON public.shop_ratings(shop_id);

-- 3. Add product_url column to shop_items
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS product_url text DEFAULT NULL;

-- 4. Index on player_shop_visits for analytics
CREATE INDEX IF NOT EXISTS idx_player_shop_visits_shop_id ON public.player_shop_visits(shop_id);
CREATE INDEX IF NOT EXISTS idx_player_shop_visits_created ON public.player_shop_visits(shop_id, created_at);
