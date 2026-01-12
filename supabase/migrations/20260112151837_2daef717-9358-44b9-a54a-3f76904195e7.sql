-- Fix 1: Restrict profiles to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 2 & 3: Update shops SELECT policy to hide admin_notes and merchant_id from public
-- We'll create a more restrictive policy that:
-- - Public users can only see active shops (excluding sensitive fields via application layer)
-- - Shop owners can see their own shops with all details
-- - Admins can see everything

-- First, let's create a function to check if user is the shop owner or admin
CREATE OR REPLACE FUNCTION public.can_view_shop_sensitive_data(shop_merchant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.uid() = shop_merchant_id  -- Shop owner
    OR is_admin(auth.uid())         -- Admin
  )
$$;

-- Create a secure view for public shop data that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_shops AS
SELECT 
  id,
  spot_id,
  name,
  category,
  external_link,
  logo_url,
  primary_color,
  accent_color,
  facade_template,
  signage_font,
  texture_template,
  texture_url,
  status,
  duplicate_brand,
  branch_label,
  branch_justification,
  created_at,
  updated_at,
  -- Only show merchant_id to the owner or admins
  CASE 
    WHEN auth.uid() = merchant_id OR is_admin(auth.uid()) THEN merchant_id
    ELSE NULL
  END as merchant_id,
  -- Only show admin_notes to admins
  CASE 
    WHEN is_admin(auth.uid()) THEN admin_notes
    ELSE NULL
  END as admin_notes
FROM public.shops
WHERE status = 'active' 
   OR merchant_id = auth.uid() 
   OR is_admin(auth.uid());

-- Grant access to the view
GRANT SELECT ON public.public_shops TO authenticated;
GRANT SELECT ON public.public_shops TO anon;