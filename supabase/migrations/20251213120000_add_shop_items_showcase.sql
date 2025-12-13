-- Create shop_items table for virtual showroom displays
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 5),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shop_id, slot_index)
);

-- Enable row level security
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Keep updated_at fresh
CREATE TRIGGER update_shop_items_updated_at
  BEFORE UPDATE ON public.shop_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow anyone to view items for active shops, and owners/admins to view their own
CREATE POLICY "Public can view active shop items" ON public.shop_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_items.shop_id
        AND (
          s.status = 'active'
          OR s.merchant_id = auth.uid()
          OR public.is_admin(auth.uid())
        )
    )
  );

-- Allow shop owners to manage their own items
CREATE POLICY "Shop owners manage their items" ON public.shop_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_items.shop_id
        AND s.merchant_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_items.shop_id
        AND s.merchant_id = auth.uid()
    )
  );

-- Allow admins full control
CREATE POLICY "Admins manage all shop items" ON public.shop_items
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Helpful index for lookups
CREATE INDEX idx_shop_items_shop_id ON public.shop_items(shop_id);
