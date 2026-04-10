import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    await prisma.razorpay_events.create({
      data: {
        event_type: event,
        payload: payload.payload || payload,
        processed: false,
      },
    });

    switch (event) {
      case 'payment.captured': {
        const paymentEntity = payload.payload.payment.entity;
        const orderId = paymentEntity.order_id;

        const order = await prisma.razorpay_orders.findUnique({
          where: { razorpay_order_id: orderId },
        });

        if (order && order.status !== 'completed') {
          if (order.order_type === 'credits' && order.credits_purchased) {
            await prisma.user_credits.upsert({
              where: { user_id: order.user_id },
              update: {
                credits: { increment: order.credits_purchased },
              },
              create: {
                user_id: order.user_id,
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
                  user_id: order.user_id,
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
        }
        break;
      }

      case 'subscription.cancelled': {
        const subscriptionEntity = payload.payload.subscription.entity;
        const razorpaySubscriptionId = subscriptionEntity.id;

        await prisma.user_subscriptions.updateMany({
          where: { razorpay_subscription_id: razorpaySubscriptionId },
          data: {
            status: 'cancelled',
            cancelled_at: new Date(),
            auto_renew: false,
          },
        });
        break;
      }

      case 'subscription.renewed': {
        const subscriptionEntity = payload.payload.subscription.entity;
        const razorpaySubscriptionId = subscriptionEntity.id;

        const existingSubscription = await prisma.user_subscriptions.findFirst({
          where: { razorpay_subscription_id: razorpaySubscriptionId },
        });

        if (existingSubscription) {
          const plan = await prisma.subscription_plans.findUnique({
            where: { id: existingSubscription.plan_id },
          });

          if (plan) {
            const newExpiresAt = new Date(existingSubscription.expires_at);
            newExpiresAt.setDate(newExpiresAt.getDate() + plan.duration_days);

            await prisma.user_subscriptions.update({
              where: { id: existingSubscription.id },
              data: {
                expires_at: newExpiresAt,
                status: 'active',
              },
            });
          }
        }
        break;
      }
    }

    await prisma.razorpay_events.updateMany({
      where: { event_type: event },
      data: { processed: true },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
