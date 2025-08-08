-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Create a new policy that uses the has_role function to avoid recursion
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));