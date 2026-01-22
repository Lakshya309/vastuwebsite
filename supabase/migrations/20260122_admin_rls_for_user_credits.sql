-- Drop existing RLS policies on public.user_credits
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can create their own credit entry" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credit entry" ON public.user_credits;
DROP POLICY IF EXISTS "Users cannot delete credit entries" ON public.user_credits; -- This policy was restrictive
DROP POLICY IF EXISTS "Admin can delete credit entries" ON public.user_credits; -- Drop if it exists from previous attempt

-- Add RLS policy for SELECT: Users can view their own credits OR admin can view all
CREATE POLICY "Users can view their own credits OR admin can view all"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- Add RLS policy for UPDATE: Users can update their own credit entry OR admin can update all
CREATE POLICY "Users can update their own credit entry OR admin can update all"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());
-- Removed redundant WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Add RLS policy for INSERT: Users can create their own credit entry (via handle_new_user) OR admin can create all
CREATE POLICY "Users can create their own credit entry OR admin can create all"
ON public.user_credits FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Add RLS policy for DELETE: Admin can delete credit entries
CREATE POLICY "Admin can delete credit entries"
ON public.user_credits FOR DELETE
USING (public.is_admin());

-- Enable RLS for public.user_credits (if not already enabled)
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;