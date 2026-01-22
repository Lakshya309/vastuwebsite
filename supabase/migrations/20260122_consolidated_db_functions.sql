-- Function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures the function runs with the privileges of the user who defined it (e.g., supabase_admin)
AS $$
BEGIN
  -- Insert into public.profiles
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user'); -- Default role 'user'

  -- Insert into public.user_credits
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 0); -- Default credits 0

  RETURN NEW;
END;
$$;

-- Trigger to call handle_new_user() after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Function to atomically deduct credits for a user
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Ensure atomicity and prevent race conditions
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    -- Get current credits
    SELECT credits INTO current_credits
    FROM public.user_credits
    WHERE user_id = p_user_id;

    -- Check if user exists and has enough credits
    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User % not found in user_credits table.', p_user_id;
    END IF;

    IF current_credits < 1 THEN
        RAISE EXCEPTION 'Insufficient credits';
    ELSE
        -- Deduct credit
        UPDATE public.user_credits
        SET credits = credits - 1,
            updated_at = now()
        WHERE user_id = p_user_id;

        RETURN TRUE; -- Credit deducted successfully
    END IF;
END;
$$;

-- Function to allow admin to update a user's role
CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_new_role text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update user roles.';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_user_id;
END;
$$;

-- Function to allow admin to adjust a user's credits
CREATE OR REPLACE FUNCTION public.admin_adjust_user_credits(p_user_id uuid, p_amount integer)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can adjust user credits.';
  END IF;

  UPDATE public.user_credits
  SET credits = credits + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to allow admin to update an astrologer's access validity
CREATE OR REPLACE FUNCTION public.admin_update_astrologer_access(
    p_user_id uuid,
    p_valid_from timestamptz,
    p_valid_to timestamptz
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update astrologer access.';
  END IF;

  UPDATE public.profiles
  SET valid_from = p_valid_from,
      valid_to = p_valid_to
  WHERE id = p_user_id;
END;
$$;
