-- Enable RLS for public.project_objects (if not already enabled)
ALTER TABLE public.project_objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on project_objects to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own project objects" ON public.project_objects;
DROP POLICY IF EXISTS "Admins can manage all project objects" ON public.project_objects;


-- Create a new policy that allows users to manage their own project objects and admins to manage all
CREATE POLICY "Users can manage their own project objects and admins can manage all"
ON public.project_objects
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM public.projects
  WHERE public.projects.id = project_id AND auth.uid() = public.projects.user_id
) OR public.is_admin())
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.projects
  WHERE public.projects.id = project_id AND auth.uid() = public.projects.user_id
) OR public.is_admin());