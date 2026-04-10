import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import PricingClient from './PricingClient';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  duration_days: number;
  plan_type: string;
  features: Record<string, unknown> | null;
}

async function getUserData() {
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

  const { data: { user } } = await supabase.auth.getUser();

  let credits = 0;
  let hasActiveSubscription = false;
  let userLoggedIn = false;

  if (user) {
    userLoggedIn = true;
    
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, valid_from: true, valid_to: true },
    });

    const userCredits = await prisma.user_credits.findUnique({
      where: { user_id: user.id },
      select: { credits: true },
    });

    credits = userCredits?.credits ?? 0;

    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: user.id,
        status: { in: ['active', 'trialing'] },
        expires_at: { gt: new Date() },
      },
    });

    const now = new Date();
    const isAstrologerWithActiveSubscription =
      profile?.role === 'astrologer' &&
      profile.valid_from &&
      profile.valid_to &&
      now >= new Date(profile.valid_from) &&
      now <= new Date(profile.valid_to);

    hasActiveSubscription = (!!subscription || isAstrologerWithActiveSubscription) ?? false;
  }

  const dbPlans = await prisma.subscription_plans.findMany({
    where: { is_active: true },
    orderBy: { price_inr: 'asc' },
  });

  const subscriptions: SubscriptionPlan[] = dbPlans.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price_inr: p.price_inr,
    duration_days: p.duration_days,
    plan_type: p.plan_type,
    features: null,
  }));

  return {
    user: userLoggedIn ? user : null,
    userEmail: user?.email ?? null,
    credits,
    hasActiveSubscription,
    subscriptions,
  };
}

export default async function PricingPage() {
  const { user, userEmail, credits, hasActiveSubscription, subscriptions } = await getUserData();

  return (
    <PricingClient
      subscriptions={subscriptions}
      hasActiveSubscription={hasActiveSubscription}
      userCredits={credits}
      userEmail={userEmail}
    />
  );
}
