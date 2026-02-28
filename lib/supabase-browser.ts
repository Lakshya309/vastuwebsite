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

    return createBrowserClient(
        getProxyUrl(),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
