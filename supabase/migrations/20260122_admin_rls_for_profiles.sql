-- Drop existing RLS policies on public.profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles; -- Make sure to drop this too if it exists

-- Add RLS policy for SELECT: Users can view their own profile OR admin can view all
CREATE POLICY "Users can view their own profile OR admin can view all"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- Add RLS policy for UPDATE: Users can update their own profile OR admin can update all
CREATE POLICY "Users can update their own profile OR admin can update all"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());
-- Removed redundant WITH CHECK (auth.uid() = id OR public.is_admin());

-- Add RLS policy for INSERT: Users can create their own profile (via handle_new_user) OR admin can create all
-- This policy is to ensure that only the user themselves or an admin can create a profile.
-- The handle_new_user trigger will satisfy `auth.uid() = id`.
CREATE POLICY "Users can create their own profile OR admin can create all"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Enable RLS for public.profiles (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;