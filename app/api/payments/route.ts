import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAuth } from '@/lib/auth';
import { createRazorpayOrder, CREDIT_PACKAGES } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { packageId, planId } = body || {};
    const targetPlanId = planId || packageId;

    if (!targetPlanId) {
      return NextResponse.json({ error: 'Invalid request: planId or packageId required' }, { status: 400 });
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetPlanId);

    // 1. Try finding in DB subscription_plans
    const dbPlan = await prisma.subscription_plans.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: targetPlanId }] : []),
          { name: { equals: targetPlanId, mode: 'insensitive' } },
        ],
        is_active: true,
      },
    });

    if (dbPlan) {
      const isCreditPlan = dbPlan.plan_type === 'credit' || dbPlan.plan_type === 'free';
      const orderType = isCreditPlan ? 'credits' : 'subscription';

      // Base price vs price with 18% GST (e.g. 999 -> 1179, 2500 -> 2950)
      const finalPriceWithGst = dbPlan.price_inr === 1 ? 1 : Math.round(dbPlan.price_inr * 1.18);

      // Check for an existing valid pending order created in the last 10 minutes WITH the matching GST price
      const existingPendingOrder = await prisma.razorpay_orders.findFirst({
        where: {
          user_id: userId,
          plan_id: dbPlan.id,
          order_type: orderType,
          amount: finalPriceWithGst, // Must match full GST price
          status: 'pending',
          created_at: { gte: tenMinutesAgo },
        },
        orderBy: { created_at: 'desc' },
      });

      if (existingPendingOrder) {
        return NextResponse.json({
          orderId: existingPendingOrder.razorpay_order_id,
          amount: existingPendingOrder.amount * 100, // in paise for Razorpay Checkout
          currency: existingPendingOrder.currency || 'INR',
          plan: {
            ...dbPlan,
            priceWithGst: existingPendingOrder.amount,
          },
        });
      }

      const order = await createRazorpayOrder({
        userId,
        amount: finalPriceWithGst,
        orderType,
        credits: isCreditPlan ? 1 : undefined,
        planId: dbPlan.id,
        receipt: `${isCreditPlan ? 'cr' : 'sub'}_${userId}_${Date.now()}`,
      });

      await prisma.razorpay_orders.create({
        data: {
          user_id: userId,
          razorpay_order_id: order.id,
          amount: finalPriceWithGst,
          order_type: orderType,
          credits_purchased: isCreditPlan ? 1 : null,
          plan_id: dbPlan.id,
          status: 'pending',
          receipt: order.receipt,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: {
          ...dbPlan,
          priceWithGst: finalPriceWithGst,
        },
      });
    }

    // 2. Fallback to CREDIT_PACKAGES constant if hardcoded package ID passed
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === targetPlanId);
    if (creditPackage) {
      const finalPriceWithGst = creditPackage.priceWithGst || creditPackage.priceInr;

      // Check for recent pending order with matching GST price
      const existingPendingOrder = await prisma.razorpay_orders.findFirst({
        where: {
          user_id: userId,
          amount: finalPriceWithGst,
          order_type: 'credits',
          status: 'pending',
          created_at: { gte: tenMinutesAgo },
        },
        orderBy: { created_at: 'desc' },
      });

      if (existingPendingOrder) {
        return NextResponse.json({
          orderId: existingPendingOrder.razorpay_order_id,
          amount: existingPendingOrder.amount * 100,
          currency: existingPendingOrder.currency || 'INR',
          package: creditPackage,
        });
      }

      const order = await createRazorpayOrder({
        userId,
        amount: finalPriceWithGst,
        orderType: 'credits',
        credits: creditPackage.credits,
        receipt: `cr_${userId}_${Date.now()}`,
      });

      await prisma.razorpay_orders.create({
        data: {
          user_id: userId,
          razorpay_order_id: order.id,
          amount: finalPriceWithGst,
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
        package: creditPackage,
      });
    }

    return NextResponse.json({ error: 'Invalid plan or package ID' }, { status: 400 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const plans = await prisma.subscription_plans.findMany({
      where: { is_active: true },
      orderBy: { price_inr: 'asc' },
    });

    const creditPlans = plans.filter(p => p.plan_type === 'credit' || p.plan_type === 'free');
    const subscriptionPlans = plans.filter(p => p.plan_type === 'subscription');

    return NextResponse.json({
      allPlans: plans,
      creditPlans,
      subscriptionPlans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
