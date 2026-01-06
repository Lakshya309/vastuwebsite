// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: This client is for server-side use only.
// It uses the Supabase service role key, which has full access to your database.
// Do NOT expose this client or the service role key to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL and service key are required for the admin client.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
