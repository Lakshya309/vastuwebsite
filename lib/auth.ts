import { createServerSupabaseClient } from './supabase';
import { prisma } from './db';
import { User } from '@supabase/supabase-js';

export interface SubscriptionInfo {
  id: string;
  plan_id: string;
  status: string;
  expires_at: Date;
  is_active: boolean;
  plan_name: string;
  plan_duration_days: number;
}

export interface UserProfileData {
  id: string;
  email: string | null;
  role: string;
  valid_from: Date | null;
  valid_to: Date | null;
  credits: number;
  has_active_subscription: boolean;
  subscription: SubscriptionInfo | null;
}

export type UserWithProfileAndCredits = User & {
  profile?: UserProfileData;
};

export interface PaymentAccessResult {
  hasAccess: boolean;
  reason?: string;
  requiredCredits?: number;
}

export async function checkPaymentAccess(userId: string): Promise<PaymentAccessResult> {
  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { role: true, valid_from: true, valid_to: true },
  });

  if (!profile) {
    return { hasAccess: false, reason: 'Profile not found' };
  }

  if (profile.role === 'astrologer') {
    const now = new Date();
    const isSubscriptionActive =
      profile.valid_from && profile.valid_to
        ? now >= new Date(profile.valid_from) && now <= new Date(profile.valid_to)
        : false;

    if (isSubscriptionActive) {
      return { hasAccess: true };
    }
  }

  const activeSubscription = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      status: { in: ['active', 'trialing'] },
      expires_at: { gt: new Date() },
    },
    include: { plans: true },
    orderBy: { created_at: 'desc' },
  });

  if (activeSubscription) {
    return { hasAccess: true };
  }

  const userCredits = await prisma.user_credits.findUnique({
    where: { user_id: userId },
  });

  if (userCredits && userCredits.credits > 0) {
    return { hasAccess: true, requiredCredits: 1 };
  }

  return { hasAccess: false, reason: 'No credits or subscription' };
}

export async function deductCredit(userId: string, amount: number = 1): Promise<boolean> {
  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { role: true, valid_from: true, valid_to: true },
  });

  if (profile?.role === 'astrologer') {
    const now = new Date();
    const isSubscriptionActive =
      profile.valid_from && profile.valid_to
        ? now >= new Date(profile.valid_from) && now <= new Date(profile.valid_to)
        : false;

    if (isSubscriptionActive) {
      return true;
    }
  }

  const activeSubscription = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      status: { in: ['active', 'trialing'] },
      expires_at: { gt: new Date() },
    },
  });

  if (activeSubscription) {
    return true;
  }

  const result = await prisma.user_credits.updateMany({
    where: {
      user_id: userId,
      credits: { gte: amount },
    },
    data: {
      credits: { decrement: amount },
    },
  });

  return result.count > 0;
}

export async function refundCredit(userId: string, amount: number = 1): Promise<void> {
  await prisma.user_credits.upsert({
    where: { user_id: userId },
    update: {
      credits: { increment: amount },
    },
    create: {
      user_id: userId,
      credits: amount,
    },
  });
}

export async function getUser(): Promise<UserWithProfileAndCredits | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let augmentedUser: UserWithProfileAndCredits = { ...user };

  try {
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
      const userCredits = await prisma.user_credits.findUnique({
        where: { user_id: user.id },
        select: { credits: true }
      });

      const activeSubscription = await prisma.user_subscriptions.findFirst({
        where: {
          user_id: user.id,
          status: { in: ['active', 'trialing'] },
          expires_at: { gt: new Date() },
        },
        include: { plans: true },
        orderBy: { created_at: 'desc' },
      });

      const now = new Date();
      const isAstrologerWithActiveSubscription =
        profile.role === 'astrologer' &&
        profile.valid_from &&
        profile.valid_to &&
        now >= new Date(profile.valid_from) &&
        now <= new Date(profile.valid_to);

      const hasActiveSubscription = (!!activeSubscription || isAstrologerWithActiveSubscription) ?? false;

      let subscriptionInfo: SubscriptionInfo | null = null;
      if (activeSubscription) {
        subscriptionInfo = {
          id: activeSubscription.id,
          plan_id: activeSubscription.plan_id,
          status: activeSubscription.status,
          expires_at: activeSubscription.expires_at,
          is_active: true,
          plan_name: activeSubscription.plans?.name || 'Subscription',
          plan_duration_days: activeSubscription.plans?.duration_days || 30,
        };
      } else if (isAstrologerWithActiveSubscription) {
        subscriptionInfo = {
          id: 'astrologer',
          plan_id: 'astrologer',
          status: 'active',
          expires_at: profile.valid_to!,
          is_active: true,
          plan_name: 'Astrologer Access',
          plan_duration_days: Math.ceil((new Date(profile.valid_to!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        };
      }

      augmentedUser.profile = {
        ...profile,
        credits: userCredits?.credits ?? 0,
        has_active_subscription: hasActiveSubscription,
        subscription: subscriptionInfo,
      };

    } catch (creditsError) {
      console.error("Error fetching user credits in getUser:", creditsError);
      augmentedUser.profile = {
        ...profile,
        credits: 0,
        has_active_subscription: false,
        subscription: null,
      };
    }
  } catch (profileError) {
    console.error("Error fetching user profile in getUser:", profileError);
  }

  return augmentedUser;
}
