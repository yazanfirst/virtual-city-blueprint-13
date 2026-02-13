
-- Fix: Restrict notifications INSERT to service_role only
-- Previously WITH CHECK (true) allowed any authenticated user to insert notifications for anyone
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);
