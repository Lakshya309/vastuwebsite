import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAuth } from '@/lib/auth';
import { cancelSubscription } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { subscriptionId, razorpaySubscriptionId } = body;

    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        id: subscriptionId,
        user_id: userId,
        status: 'active',
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.razorpay_subscription_id) {
      try {
        await cancelSubscription(subscription.razorpay_subscription_id);
      } catch (razorpayError) {
        console.error('Error cancelling Razorpay subscription:', razorpayError);
      }
    }

    await prisma.user_subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        auto_renew: false,
      },
    });

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
