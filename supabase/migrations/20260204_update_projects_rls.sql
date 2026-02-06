-- Drop the existing policy on the projects table
DROP POLICY IF EXISTS "users manage own projects" ON public.projects;

-- Create a new policy that allows users to manage their own projects and admins to manage all projects
CREATE POLICY "Users can manage their own projects and admins can manage all"
ON public.projects
FOR ALL
USING (auth.uid() = user_id OR (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
  )
))
WITH CHECK (auth.uid() = user_id OR (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
  )
));
