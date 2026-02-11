
-- ============================================
-- Table 1: player_progress
-- ============================================
CREATE TABLE public.player_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  coins integer NOT NULL DEFAULT 100,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  missions_completed integer NOT NULL DEFAULT 0,
  shops_visited integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own progress"
  ON public.player_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players can insert own progress"
  ON public.player_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update own progress"
  ON public.player_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.player_progress FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_player_progress_updated_at
  BEFORE UPDATE ON public.player_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Table 2: merchant_offers
-- ============================================
CREATE TABLE public.merchant_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL,
  coin_price integer NOT NULL,
  min_player_level integer NOT NULL DEFAULT 1,
  daily_limit integer NOT NULL DEFAULT 10,
  per_player_limit integer NOT NULL DEFAULT 1,
  min_order_value numeric,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_offers ENABLE ROW LEVEL SECURITY;

-- Players can see active offers
CREATE POLICY "Authenticated users can view active offers"
  ON public.merchant_offers FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Merchants can see all their own offers (including inactive)
CREATE POLICY "Merchants can view own shop offers"
  ON public.merchant_offers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = merchant_offers.shop_id AND s.merchant_id = auth.uid()
  ));

-- Merchants can insert offers for their own shops
CREATE POLICY "Merchants can create offers for own shops"
  ON public.merchant_offers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = merchant_offers.shop_id AND s.merchant_id = auth.uid()
  ));

-- Merchants can update their own shop offers
CREATE POLICY "Merchants can update own shop offers"
  ON public.merchant_offers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = merchant_offers.shop_id AND s.merchant_id = auth.uid()
  ));

-- Merchants can delete their own shop offers
CREATE POLICY "Merchants can delete own shop offers"
  ON public.merchant_offers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = merchant_offers.shop_id AND s.merchant_id = auth.uid()
  ));

-- Admins can manage all offers
CREATE POLICY "Admins can manage all offers"
  ON public.merchant_offers FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_merchant_offers_updated_at
  BEFORE UPDATE ON public.merchant_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for expires_at (must be in the future on insert/update)
CREATE OR REPLACE FUNCTION public.validate_offer_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_merchant_offer_expiry
  BEFORE INSERT OR UPDATE ON public.merchant_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_offer_expiry();

-- ============================================
-- Table 3: offer_redemptions
-- ============================================
CREATE TABLE public.offer_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.merchant_offers(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  redemption_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'claimed',
  coins_spent integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.offer_redemptions ENABLE ROW LEVEL SECURITY;

-- Players can view their own redemptions
CREATE POLICY "Players can view own redemptions"
  ON public.offer_redemptions FOR SELECT
  USING (auth.uid() = player_id);

-- Merchants can view redemptions for their shop offers (to verify codes)
CREATE POLICY "Merchants can view redemptions for own shop offers"
  ON public.offer_redemptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.merchant_offers mo
    JOIN public.shops s ON s.id = mo.shop_id
    WHERE mo.id = offer_redemptions.offer_id AND s.merchant_id = auth.uid()
  ));

-- Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
  ON public.offer_redemptions FOR ALL
  USING (public.is_admin(auth.uid()));

-- Insert is restricted to service role (Edge Function) -- no direct player insert policy
-- The Edge Function uses the service role key to insert redemptions

-- Index for fast lookups
CREATE INDEX idx_offer_redemptions_offer_id ON public.offer_redemptions(offer_id);
CREATE INDEX idx_offer_redemptions_player_id ON public.offer_redemptions(player_id);
CREATE INDEX idx_offer_redemptions_code ON public.offer_redemptions(redemption_code);
CREATE INDEX idx_merchant_offers_shop_id ON public.merchant_offers(shop_id);
CREATE INDEX idx_player_progress_user_id ON public.player_progress(user_id);
