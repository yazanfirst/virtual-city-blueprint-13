-- SECURITY FIX: Prevent public exposure of shops.merchant_id and shops.admin_notes
-- Approach:
-- 1) Tighten shops SELECT RLS to owner/admin only (so full rows aren't public)
-- 2) Provide SECURITY DEFINER RPCs that return ONLY safe public columns for active/suspended shops
-- 3) Update shop_items SELECT RLS to avoid depending on public visibility of shops

-- 1) Tighten shops SELECT policy
DROP POLICY IF EXISTS "Anyone can view active shops" ON public.shops;

CREATE POLICY "Shop owners and admins can view shops"
ON public.shops
FOR SELECT
USING ((merchant_id = auth.uid()) OR is_admin(auth.uid()));

-- 2) Helper: safe status check for use in other RLS policies
CREATE OR REPLACE FUNCTION public.is_shop_active(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops s
    WHERE s.id = _shop_id
      AND s.status = 'active'::shop_status
  )
$$;

-- 3) RPCs for public shop browsing (NO merchant_id, NO admin_notes)
CREATE OR REPLACE FUNCTION public.get_active_public_shops_for_spots(_spot_ids uuid[])
RETURNS TABLE (
  id uuid,
  spot_id uuid,
  name text,
  category text,
  external_link text,
  logo_url text,
  primary_color text,
  accent_color text,
  facade_template facade_template,
  signage_font text,
  texture_template text,
  texture_url text,
  status shop_status,
  duplicate_brand boolean,
  branch_label text,
  branch_justification text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.spot_id,
    s.name,
    s.category,
    s.external_link,
    s.logo_url,
    s.primary_color,
    s.accent_color,
    s.facade_template,
    s.signage_font,
    s.texture_template,
    s.texture_url,
    s.status,
    s.duplicate_brand,
    s.branch_label,
    s.branch_justification,
    s.created_at,
    s.updated_at
  FROM public.shops s
  WHERE s.spot_id = ANY (_spot_ids)
    AND s.status = 'active'::shop_status
$$;

CREATE OR REPLACE FUNCTION public.get_active_or_suspended_public_shops_for_spots(_spot_ids uuid[])
RETURNS TABLE (
  id uuid,
  spot_id uuid,
  name text,
  category text,
  external_link text,
  logo_url text,
  primary_color text,
  accent_color text,
  facade_template facade_template,
  signage_font text,
  texture_template text,
  texture_url text,
  status shop_status,
  duplicate_brand boolean,
  branch_label text,
  branch_justification text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.spot_id,
    s.name,
    s.category,
    s.external_link,
    s.logo_url,
    s.primary_color,
    s.accent_color,
    s.facade_template,
    s.signage_font,
    s.texture_template,
    s.texture_url,
    s.status,
    s.duplicate_brand,
    s.branch_label,
    s.branch_justification,
    s.created_at,
    s.updated_at
  FROM public.shops s
  WHERE s.spot_id = ANY (_spot_ids)
    AND s.status IN ('active'::shop_status, 'suspended'::shop_status)
$$;

-- 4) Update shop_items SELECT policy so public can still view items for active shops
DROP POLICY IF EXISTS "Anyone can view shop items of active shops" ON public.shop_items;

CREATE POLICY "Anyone can view shop items of active shops"
ON public.shop_items
FOR SELECT
USING (
  public.is_shop_active(shop_items.shop_id)
  OR is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.shops s
    WHERE s.id = shop_items.shop_id
      AND s.merchant_id = auth.uid()
  )
);
