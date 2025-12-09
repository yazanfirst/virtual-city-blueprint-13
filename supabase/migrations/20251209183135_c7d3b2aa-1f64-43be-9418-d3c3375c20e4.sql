-- Create storage bucket for shop logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-logos', 'shop-logos', true);

-- Allow anyone to view shop logos (public bucket)
CREATE POLICY "Shop logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-logos');

-- Allow authenticated merchants to upload their own logos
CREATE POLICY "Merchants can upload shop logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shop-logos' 
  AND auth.role() = 'authenticated'
);

-- Allow merchants to update their own logos
CREATE POLICY "Merchants can update their logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'shop-logos' AND auth.role() = 'authenticated');

-- Allow merchants to delete their own logos
CREATE POLICY "Merchants can delete their logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'shop-logos' AND auth.role() = 'authenticated');