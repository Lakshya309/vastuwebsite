import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import type { PlanTier } from "@/lib/planConfig";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ user: null });
  }

  const userId = (session.user as any).id;

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        valid_from: true,
        valid_to: true,
      }
    });

    const userCredits = await prisma.user_credits.findUnique({
      where: { user_id: userId },
      select: { credits: true }
    });

    // Resolve plan tier
    let userPlan: PlanTier = "free";

    const now = new Date();
    const isAstrologerActive =
      profile?.role === "astrologer" &&
      profile.valid_from &&
      profile.valid_to &&
      now >= new Date(profile.valid_from) &&
      now <= new Date(profile.valid_to);

    if (profile?.role === "admin" || isAstrologerActive) {
      userPlan = "advanced";
    } else {
      const subscription = await prisma.user_subscriptions.findFirst({
        where: {
          user_id: userId,
          status: { in: ["active", "trialing"] },
          expires_at: { gt: now },
        },
        include: { plans: true },
      });

      if (subscription) {
        const planName = subscription.plans?.name?.toLowerCase() ?? "";
        if (planName.includes("advanced") || planName.includes("pro")) {
          userPlan = "advanced";
        } else {
          userPlan = "basic";
        }
      }
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: session.user.email,
        plan: userPlan,
        profile: profile ? {
          ...profile,
          credits: userCredits?.credits ?? 0,
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
