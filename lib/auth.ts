import { createServerSupabaseClient } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { User } from '@supabase/supabase-js'; // Import the base User type

// Define the structure for the profile data
interface UserProfileData {
  id: string;
  email: string | null;
  role: string;
  valid_from: string | null;
  valid_to: string | null;
  credits: number;
}

// Define the augmented user type that getUser will return
export type UserWithProfileAndCredits = User & {
  profile?: UserProfileData;
};

export async function getUser(): Promise<UserWithProfileAndCredits | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Initial return object which includes the base User properties
  let augmentedUser: UserWithProfileAndCredits = { ...user };

  // Fetch user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, valid_from, valid_to')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile in getUser:", profileError);
    // If profile fetch fails, return user without profile data
    return augmentedUser;
  }

  // Fetch user credits
  const { data: userCredits, error: creditsError } = await supabaseAdmin
    .from('user_credits')
    .select('credits')
    .eq('user_id', user.id)
    .single();

  if (creditsError) {
    console.error("Error fetching user credits in getUser:", creditsError);
    // If credits fetch fails, return user with profile but without credits in profile
    augmentedUser.profile = { ...profile, credits: 0 }; // Default credits if fetch fails
    return augmentedUser;
  }

  // If both profile and credits are fetched successfully
  augmentedUser.profile = {
    ...profile,
    credits: userCredits ? userCredits.credits : 0,
  };

  return augmentedUser;
}
