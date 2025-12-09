-- Allow merchants to delete their own shops
CREATE POLICY "Merchants can delete own shops"
ON public.shops
FOR DELETE
USING (merchant_id = auth.uid());