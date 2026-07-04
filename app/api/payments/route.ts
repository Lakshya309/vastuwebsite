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
    const { packageId, planId } = body;

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
        package: creditPackage,
      });
    }

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
        plan,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
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
