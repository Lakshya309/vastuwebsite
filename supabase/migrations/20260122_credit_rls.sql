
-- Enable RLS for user_credits table
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own credit entry upon sign-up
CREATE POLICY "Users can create their own credit entry"
ON public.user_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Enable updates for user_credits only if the user is an authenticated user and it's their own record.
-- This will be further restricted later to allow updates only via specific functions or admin.
CREATE POLICY "Users can update their own credit entry"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Disable deletion of credit entries by users
CREATE POLICY "Users cannot delete credit entries"
ON public.user_credits FOR DELETE
USING (FALSE);
