
-- Add valid_from and valid_to columns to public.profiles for astrologer access
ALTER TABLE public.profiles
ADD COLUMN valid_from timestamp with time zone,
ADD COLUMN valid_to timestamp with time zone;

-- Update the RLS policy for profiles to include the new columns if necessary.
-- Current policy "Users can view their own profile" already covers all columns
-- as it uses `id = auth.uid()`.
-- No explicit change needed for SELECT policy if it's already broad.

-- For INSERT, handle_new_user function will insert nulls initially for these columns.
-- For UPDATE, we might need a more specific policy for admins to update these columns
-- which we will address when implementing the admin panel.
-- For now, the existing "Users can update their own profile" policy will allow users to
-- update these if they want, but our logic will prevent that unless they are an admin.
