-- Drop the SECURITY DEFINER view (security risk)
DROP VIEW IF EXISTS public.public_shops;

-- Drop the helper function (no longer needed)
DROP FUNCTION IF EXISTS public.can_view_shop_sensitive_data(uuid);

-- The shops table RLS already restricts row access properly.
-- The sensitive column exposure (admin_notes, merchant_id) is now handled at the 
-- application layer with explicit column selection in queries.
-- 
-- Current RLS on shops:
-- - Anyone can view active shops OR their own shops OR if admin
-- - This is correct for row-level access
-- 
-- Column-level security for admin_notes is enforced by:
-- 1. Frontend queries explicitly exclude admin_notes for non-admin users
-- 2. Only AdminDashboard.tsx uses select('*') and that page is admin-protected

-- No additional RLS changes needed - the migration for profiles (requiring auth) remains in effect