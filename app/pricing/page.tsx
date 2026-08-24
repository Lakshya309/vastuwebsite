import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import PricingClient from './PricingClient';
import type { PlanTier } from '@/lib/planConfig';

async function getUserData() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  let userPlan: PlanTier = "free";
  let userLoggedIn = false;

  if (user && user.id) {
    userLoggedIn = true;

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true, valid_from: true, valid_to: true },
    });

    // Check active subscription
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: user.id,
        status: { in: ['active', 'trialing'] },
        expires_at: { gt: new Date() },
      },
      include: { plans: true },
    });

    const now = new Date();
    const isAstrologerActive =
      profile?.role === 'astrologer' &&
      profile.valid_from &&
      profile.valid_to &&
      now >= new Date(profile.valid_from) &&
      now <= new Date(profile.valid_to);

    if (profile?.role === 'admin' || isAstrologerActive) {
      userPlan = "advanced";
    } else if (subscription) {
      // Derive plan tier from subscription plan name
      const planName = subscription.plans?.name?.toLowerCase() ?? "";
      if (planName.includes("advanced") || planName.includes("pro")) {
        userPlan = "advanced";
      } else if (planName.includes("basic")) {
        userPlan = "basic";
      } else {
        userPlan = "basic"; // default paid = basic
      }
    }
  }

  return {
    userEmail: user?.email ?? null,
    userPlan,
    userLoggedIn,
  };
}

export default async function PricingPage() {
  const { userEmail, userPlan, userLoggedIn } = await getUserData();

  return (
    <PricingClient
      userEmail={userEmail}
      userPlan={userPlan}
      userLoggedIn={userLoggedIn}
    />
  );
}
