export function getSupabaseCookieName() {
  let cookieName = 'sb-auth-token';
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const urlObj = new URL(supabaseUrl);
      // Extracts the project ref from the hostname (e.g. xyzabc from xyzabc.supabase.co)
      cookieName = `sb-${urlObj.hostname.split('.')[0]}-auth-token`;
    }
  } catch (e) {
    // Fallback to default
  }
  return cookieName;
}
