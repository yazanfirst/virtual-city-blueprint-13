-- Create shop_items table for showcase wall products
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 5),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, slot_index)
);

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view items of active shops
CREATE POLICY "Anyone can view shop items of active shops"
ON public.shop_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops 
    WHERE shops.id = shop_items.shop_id 
    AND (shops.status = 'active' OR shops.merchant_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Merchants can insert items for their own shops
CREATE POLICY "Merchants can insert items for own shops"
ON public.shop_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shops 
    WHERE shops.id = shop_items.shop_id 
    AND shops.merchant_id = auth.uid()
  )
);

-- Merchants can update items for their own shops
CREATE POLICY "Merchants can update items for own shops"
ON public.shop_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.shops 
    WHERE shops.id = shop_items.shop_id 
    AND shops.merchant_id = auth.uid()
  )
);

-- Merchants can delete items for their own shops
CREATE POLICY "Merchants can delete items for own shops"
ON public.shop_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shops 
    WHERE shops.id = shop_items.shop_id 
    AND shops.merchant_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_shop_items_updated_at
BEFORE UPDATE ON public.shop_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();