import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLAN_PRICES, PLAN_LIMITS } from "@/lib/planConfig";
import { CREDIT_PACKAGES } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Fetch active DB plans if available
    const dbPlans = await prisma.subscription_plans.findMany({
      where: { is_active: true },
      orderBy: { price_inr: "asc" },
    });

    return NextResponse.json({
      prices: PLAN_PRICES,
      limits: PLAN_LIMITS,
      creditPackages: CREDIT_PACKAGES,
      subscriptionPlans: dbPlans,
    });
  } catch (error) {
    console.error("Error fetching pricing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing config" },
      { status: 500 }
    );
  }
}
