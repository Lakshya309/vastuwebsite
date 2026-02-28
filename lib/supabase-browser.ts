import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
    const getProxyUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/supabase-proxy`
        }
        if (process.env.NEXT_PUBLIC_SITE_URL) {
            return `${process.env.NEXT_PUBLIC_SITE_URL}/supabase-proxy`
        }
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}/supabase-proxy`
        }
        return 'http://localhost:3001/supabase-proxy'
    }

    // Match the server's expected cookie name (derived from the actual URL)
    let cookieName = 'sb-auth-token'
    try {
        const urlObj = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
        cookieName = `sb-${urlObj.hostname.split('.')[0]}-auth-token`
    } catch (e) { }

    return createBrowserClient(
        getProxyUrl(),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: cookieName
            }
        }
    )
}
