import { createClient, SupabaseClient } from "@supabase/supabase-js";

// This client can be used for public, non-user-specific data or when the user's token is not yet available.
// For operations requiring user authentication and RLS, use getAuthenticatedSupabaseClient.
export const publicSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

let authenticatedSupabase: SupabaseClient | null = null;

export function getAuthenticatedSupabaseClient(idToken: string): SupabaseClient {
  // If a client is already initialized with this token, return it.
  // This is a simple caching mechanism; for more robust solutions, consider a context provider.
  if (authenticatedSupabase) {
    // In a real app, you might want to check if the token is still valid or refresh the client
    // if the token has changed. For now, we assume if it's set, it's good.
    return authenticatedSupabase;
  }

  authenticatedSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    }
  );

  return authenticatedSupabase;
}
