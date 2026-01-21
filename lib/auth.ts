import { createServerSupabaseClient } from './supabase';

export async function getUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
