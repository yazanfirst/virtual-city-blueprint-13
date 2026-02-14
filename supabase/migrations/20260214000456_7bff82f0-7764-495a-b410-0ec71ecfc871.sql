-- Allow merchants to read all visits to their shops (not just their own visits)
CREATE POLICY "Merchants can view visits to their shops"
ON public.player_shop_visits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = player_shop_visits.shop_id
    AND shops.merchant_id = auth.uid()
  )
);

-- Allow merchants to read link clicks for their shops
CREATE POLICY "Merchants can view link clicks for their shops"
ON public.shop_link_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = shop_link_clicks.shop_id
    AND shops.merchant_id = auth.uid()
  )
);

-- Allow merchants to read redemptions for their offers
CREATE POLICY "Merchants can view redemptions for their offers"
ON public.offer_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_offers
    JOIN public.shops ON shops.id = merchant_offers.shop_id
    WHERE merchant_offers.id = offer_redemptions.offer_id
    AND shops.merchant_id = auth.uid()
  )
);