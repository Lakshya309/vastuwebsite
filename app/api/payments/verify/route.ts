import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAuth } from '@/lib/auth';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const order = await prisma.razorpay_orders.findUnique({
      where: { razorpay_order_id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== userId) {
      return NextResponse.json({ error: 'Order does not belong to user' }, { status: 403 });
    }

    if (order.status === 'completed') {
      return NextResponse.json({ message: 'Payment already verified', status: 'completed' });
    }

    await prisma.razorpay_payments.create({
      data: {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        user_id: userId,
        amount: order.amount,
        status: 'captured',
      },
    });

    if (order.order_type === 'credits' && order.credits_purchased) {
      await prisma.user_credits.upsert({
        where: { user_id: userId },
        update: {
          credits: { increment: order.credits_purchased },
        },
        create: {
          user_id: userId,
          credits: order.credits_purchased,
        },
      });
    }

    if (order.order_type === 'subscription' && order.plan_id) {
      const plan = await prisma.subscription_plans.findUnique({
        where: { id: order.plan_id },
      });

      if (plan) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

        await prisma.user_subscriptions.create({
          data: {
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            expires_at: expiresAt,
            auto_renew: true,
          },
        });
      }
    }

    await prisma.razorpay_orders.update({
      where: { id: order.id },
      data: { status: 'completed' },
    });

    return NextResponse.json({
      message: 'Payment verified successfully',
      status: 'completed',
      orderType: order.order_type,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
