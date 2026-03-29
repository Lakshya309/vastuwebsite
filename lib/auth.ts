import { createServerSupabaseClient } from './supabase';
import { prisma } from './db';
import { User } from '@supabase/supabase-js'; // Import the base User type

// Define the structure for the profile data
interface UserProfileData {
  id: string;
  email: string | null;
  role: string;
  valid_from: Date | null;
  valid_to: Date | null;
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

  try {
    // Fetch user profile
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        valid_from: true,
        valid_to: true,
      }
    });

    if (!profile) {
      return augmentedUser;
    }

    try {
      // Fetch user credits
      const userCredits = await prisma.user_credits.findUnique({
        where: { user_id: user.id },
        select: { credits: true }
      });

      augmentedUser.profile = {
        ...profile,
        credits: userCredits?.credits ?? 0,
      };

    } catch (creditsError) {
      console.error("Error fetching user credits in getUser:", creditsError);
      augmentedUser.profile = { ...profile, credits: 0 };
    }
  } catch (profileError) {
    console.error("Error fetching user profile in getUser:", profileError);
  }

  return augmentedUser;
}
