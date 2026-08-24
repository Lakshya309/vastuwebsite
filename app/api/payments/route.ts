import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAuth } from '@/lib/auth';
import { createRazorpayOrder, CREDIT_PACKAGES } from '@/lib/razorpay';
import { PLAN_PRICES, type PlanTier } from '@/lib/planConfig';

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { packageId, planId, tier } = body;

    // ── NEW: Tier-based plan purchase (basic / advanced) ─────────────────────
    if (tier && (tier === 'basic' || tier === 'advanced')) {
      const priceConfig = PLAN_PRICES[tier as PlanTier];

      if (!priceConfig || priceConfig.base === 0) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }

      // Look up matching subscription plan from DB (match by plan_type or name)
      const plan = await prisma.subscription_plans.findFirst({
        where: {
          is_active: true,
          OR: [
            { plan_type: tier },
            { name: { contains: tier, mode: 'insensitive' } },
          ],
        },
        orderBy: { price_inr: 'asc' },
      });

      // If no DB plan exists yet, use config price directly
      const orderAmount = plan ? plan.price_inr : priceConfig.total;
      const receipt = `tier_${tier}_${userId}_${Date.now()}`;

      const order = await createRazorpayOrder({
        userId,
        amount: orderAmount,
        orderType: 'subscription',
        planId: plan?.id,
        receipt,
      });

      await prisma.razorpay_orders.create({
        data: {
          user_id: userId,
          razorpay_order_id: order.id,
          amount: orderAmount,
          order_type: 'subscription',
          plan_id: plan?.id ?? null,
          status: 'pending',
          receipt: order.receipt,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        tier,
      });
    }

    // ── Legacy: Credit package purchase ──────────────────────────────────────
    if (packageId) {
      const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      if (!creditPackage) {
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }

      const order = await createRazorpayOrder({
        userId,
        amount: creditPackage.priceInr,
        orderType: 'credits',
        credits: creditPackage.credits,
        receipt: `cr_${userId}_${Date.now()}`,
      });

      await prisma.razorpay_orders.create({
        data: {
          user_id: userId,
          razorpay_order_id: order.id,
          amount: creditPackage.priceInr,
          order_type: 'credits',
          credits_purchased: creditPackage.credits,
          status: 'pending',
          receipt: order.receipt,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        package: creditPackage,
      });
    }

    // ── Legacy: DB Plan ID purchase ───────────────────────────────────────────
    if (planId) {
      const plan = await prisma.subscription_plans.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      const order = await createRazorpayOrder({
        userId,
        amount: plan.price_inr,
        orderType: 'subscription',
        planId: plan.id,
        receipt: `sub_${userId}_${Date.now()}`,
      });

      await prisma.razorpay_orders.create({
        data: {
          user_id: userId,
          razorpay_order_id: order.id,
          amount: plan.price_inr,
          order_type: 'subscription',
          plan_id: plan.id,
          status: 'pending',
          receipt: order.receipt,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        plan,
      });
    }

    return NextResponse.json({ error: 'Invalid request: provide tier, packageId, or planId' }, { status: 400 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const creditPackages = CREDIT_PACKAGES;

    const plans = await prisma.subscription_plans.findMany({
      where: { is_active: true },
      orderBy: { price_inr: 'asc' },
    });

    return NextResponse.json({
      credits: creditPackages,
      subscriptions: plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
