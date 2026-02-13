CREATE TABLE IF NOT EXISTS public.shop_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert shop link clicks"
ON public.shop_link_clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Merchants can view clicks for their shops"
ON public.shop_link_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.shops s
    WHERE s.id = shop_link_clicks.shop_id
      AND s.merchant_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_shop_link_clicks_shop_id ON public.shop_link_clicks(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_link_clicks_created_at ON public.shop_link_clicks(created_at DESC);
