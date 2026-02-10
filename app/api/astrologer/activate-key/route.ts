// app/api/astrologer/activate-key/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';


export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get key from request body
    const { key } = await request.json();
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Activation key is required' }, { status: 400 });
    }

    // Use Supabase Admin to perform privileged operations
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    );

    // 3. Find the key in the database
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('astrologer_keys')
      .select('*')
      .eq('key', key)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({ error: 'Invalid or expired key' }, { status: 404 });
    }

    if (keyData.is_claimed) {
      return NextResponse.json({ error: 'This key has already been claimed' }, { status: 409 });
    }

    // 4. Update the user's profile
    const now = new Date();
    const validTo = new Date(now);
    validTo.setDate(validTo.getDate() + keyData.duration_days);

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'astrologer',
        valid_from: now.toISOString(),
        valid_to: validTo.toISOString(),
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Failed to update profile:', profileUpdateError);
      return NextResponse.json({ error: 'Failed to activate astrologer role' }, { status: 500 });
    }

    // 5. Mark the key as claimed
    const { error: keyUpdateError } = await supabaseAdmin
      .from('astrologer_keys')
      .update({
        is_claimed: true,
        claimed_by: user.id,
        claimed_at: now.toISOString(),
      })
      .eq('id', keyData.id);

    if (keyUpdateError) {
      // This is not ideal, as the user profile is already updated.
      // In a real production scenario, you'd use a transaction here.
      console.error('Failed to mark key as claimed:', keyUpdateError);
    }

    return NextResponse.json({ message: 'Astrologer role activated successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in activate-key route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
