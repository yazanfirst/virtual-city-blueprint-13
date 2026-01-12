-- Fix 1: Update storage policies to enforce user-specific folder ownership
DROP POLICY IF EXISTS "Merchants can upload shop logos" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can delete their logos" ON storage.objects;

-- Users can only upload to their own folder (userId/...)
CREATE POLICY "Users upload to own folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shop-logos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update files in their own folder
CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shop-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete files in their own folder
CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shop-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix 2: Update shop_reviews.admin_id FK to allow SET NULL on admin deletion
ALTER TABLE public.shop_reviews 
DROP CONSTRAINT IF EXISTS shop_reviews_admin_id_fkey;

ALTER TABLE public.shop_reviews
ALTER COLUMN admin_id DROP NOT NULL;

ALTER TABLE public.shop_reviews
ADD CONSTRAINT shop_reviews_admin_id_fkey
FOREIGN KEY (admin_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;