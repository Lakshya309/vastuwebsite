
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
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
