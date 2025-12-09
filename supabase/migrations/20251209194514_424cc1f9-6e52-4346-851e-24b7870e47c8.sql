-- Allow authenticated users to insert a merchant role for themselves (upgrade to merchant)
CREATE POLICY "Users can upgrade to merchant"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'merchant'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'merchant'
  )
);