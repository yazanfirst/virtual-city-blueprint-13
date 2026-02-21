
DROP FUNCTION IF EXISTS public.get_active_or_suspended_public_shops_for_spots(uuid[]);

CREATE OR REPLACE FUNCTION public.get_active_or_suspended_public_shops_for_spots(_spot_ids uuid[])
 RETURNS TABLE(id uuid, spot_id uuid, name text, category text, external_link text, logo_url text, primary_color text, accent_color text, facade_template facade_template, signage_font text, texture_template text, texture_url text, status shop_status, duplicate_brand boolean, branch_label text, branch_justification text, created_at timestamp with time zone, updated_at timestamp with time zone, currency text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    s.updated_at,
    s.currency
  FROM public.shops s
  WHERE s.spot_id = ANY (_spot_ids)
    AND s.status IN ('active'::shop_status, 'suspended'::shop_status)
$function$;
