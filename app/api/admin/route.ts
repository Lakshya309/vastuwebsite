import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "../../../lib/db";
 
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can perform this action." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, userId, newRole, amount, validFrom, validTo, planId, planData } = body;

    let result;

    switch (action) {
      case "updateRole":
        if (!userId || !newRole) {
          return NextResponse.json(
            { message: "userId and newRole required." },
            { status: 400 }
          );
        }
        await prisma.profiles.update({
          where: { id: userId },
          data: { role: newRole }
        });
        break;

      case "adjustCredits":
        if (!userId || amount === undefined) {
          return NextResponse.json(
            { message: "userId and amount required." },
            { status: 400 }
          );
        }
        await prisma.user_credits.upsert({
          where: { user_id: userId },
          update: { credits: { increment: amount } },
          create: { user_id: userId, credits: amount }
        });
        break;

      case "updateAstrologerAccess":
        if (!userId || !validFrom || !validTo) {
          return NextResponse.json(
            { message: "userId, validFrom and validTo required." },
            { status: 400 }
          );
        }
        await prisma.profiles.update({
          where: { id: userId },
          data: { 
            valid_from: new Date(validFrom), 
            valid_to: new Date(validTo) 
          }
        });
        break;

      case "createSubscriptionPlan":
        if (!planData?.name || !planData?.price_inr || !planData?.duration_days) {
          return NextResponse.json(
            { message: "Plan name, price_inr, and duration_days are required." },
            { status: 400 }
          );
        }
        result = await prisma.subscription_plans.create({
          data: {
            name: planData.name,
            description: planData.description || null,
            price_inr: planData.price_inr,
            duration_days: planData.duration_days,
            plan_type: planData.plan_type || 'monthly',
            features: planData.features || null,
            razorpay_plan_id: planData.razorpay_plan_id || null,
          }
        });
        return NextResponse.json(
          { message: "Subscription plan created.", plan: result },
          { status: 201 }
        );

      case "updateSubscriptionPlan":
        if (!planId) {
          return NextResponse.json(
            { message: "planId is required." },
            { status: 400 }
          );
        }
        const updateData: Record<string, unknown> = {};
        if (planData?.name) updateData.name = planData.name;
        if (planData?.description !== undefined) updateData.description = planData.description;
        if (planData?.price_inr) updateData.price_inr = planData.price_inr;
        if (planData?.duration_days) updateData.duration_days = planData.duration_days;
        if (planData?.plan_type) updateData.plan_type = planData.plan_type;
        if (planData?.is_active !== undefined) updateData.is_active = planData.is_active;
        if (planData?.razorpay_plan_id !== undefined) updateData.razorpay_plan_id = planData.razorpay_plan_id;
        
        result = await prisma.subscription_plans.update({
          where: { id: planId },
          data: updateData
        });
        return NextResponse.json(
          { message: "Subscription plan updated.", plan: result },
          { status: 200 }
        );

      case "deleteSubscriptionPlan":
        if (!planId) {
          return NextResponse.json(
            { message: "planId is required." },
            { status: 400 }
          );
        }
        await prisma.subscription_plans.delete({
          where: { id: planId }
        });
        return NextResponse.json(
          { message: "Subscription plan deleted." },
          { status: 200 }
        );

      case "grantSubscription":
        if (!userId || !planId) {
          return NextResponse.json(
            { message: "userId and planId are required." },
            { status: 400 }
          );
        }
        const plan = await prisma.subscription_plans.findUnique({
          where: { id: planId }
        });
        if (!plan) {
          return NextResponse.json(
            { message: "Plan not found." },
            { status: 404 }
          );
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days);
        
        result = await prisma.user_subscriptions.create({
          data: {
            user_id: userId,
            plan_id: planId,
            status: 'active',
            expires_at: expiresAt,
            auto_renew: false,
          }
        });
        return NextResponse.json(
          { message: "Subscription granted.", subscription: result },
          { status: 201 }
        );

      case "cancelUserSubscription":
        if (!userId) {
          return NextResponse.json(
            { message: "userId is required." },
            { status: 400 }
          );
        }
        await prisma.user_subscriptions.updateMany({
          where: {
            user_id: userId,
            status: { in: ['active', 'trialing'] }
          },
          data: {
            status: 'cancelled',
            cancelled_at: new Date(),
            auto_renew: false,
          }
        });
        return NextResponse.json(
          { message: "User subscription cancelled." },
          { status: 200 }
        );

      default:
        return NextResponse.json(
          { message: "Invalid admin action." },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        message: `Admin action '${action}' completed successfully.`,
        result: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in admin API route:", err);

    return NextResponse.json(
      {
        message: "Failed to perform admin action",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { message: authResult.error || "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }
    const user = authResult.user;

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can perform this action." },
        { status: 403 }
      );
    }

    const plans = await prisma.subscription_plans.findMany({
      orderBy: { price_inr: 'asc' }
    });

    const activeSubscriptions = await prisma.user_subscriptions.findMany({
      where: { status: { in: ['active', 'trialing'] } },
      include: { plans: true, profiles: { select: { email: true } } },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(
      { plans, activeSubscriptions },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching admin data:", err);
    return NextResponse.json(
      { message: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}
