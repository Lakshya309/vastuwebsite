import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { getSupabaseCookieName } from './supabase-shared';

export interface AuthResult {
  user: User | null;
  supabase: SupabaseClient | null;
  error: string | null;
  status: number;
}

export async function validateAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    return validateBearerToken(authHeader);
  }
  
  return validateCookieAuth();
}

async function validateBearerToken(authHeader: string): Promise<AuthResult> {
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return { 
      user: null, 
      supabase: null, 
      error: 'Missing token', 
      status: 401 
    };
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { 
      user: null, 
      supabase: null, 
      error: 'Invalid or expired token', 
      status: 401 
    };
  }
  
  return { user, supabase, error: null, status: 200 };
}

async function validateCookieAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component or Route Handler
          }
        },
      },
      cookieOptions: {
        name: getSupabaseCookieName()
      }
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { 
      user: null, 
      supabase: null, 
      error: 'Unauthorized', 
      status: 401 
    };
  }
  
  return { user, supabase, error: null, status: 200 };
}
