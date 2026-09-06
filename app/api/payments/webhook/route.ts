import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { fulfillOrder } from '@/lib/paymentFulfillment';

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

    // Record the incoming event and store its exact ID
    const createdEvent = await prisma.razorpay_events.create({
      data: {
        event_type: event,
        payload: payload.payload || payload,
        processed: false,
      },
    });

    switch (event) {
      case 'payment.captured':
      case 'order.paid': {
        const paymentEntity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
        if (paymentEntity) {
          const orderId = paymentEntity.order_id || paymentEntity.id;
          const paymentId = paymentEntity.id || `pay_${Date.now()}`;

          if (orderId) {
            await fulfillOrder({
              orderId,
              razorpayPaymentId: paymentId,
              eventId: createdEvent.id,
            });
          }
        }
        break;
      }

      case 'subscription.cancelled': {
        const subscriptionEntity = payload.payload?.subscription?.entity;
        if (subscriptionEntity?.id) {
          await prisma.user_subscriptions.updateMany({
            where: { razorpay_subscription_id: subscriptionEntity.id },
            data: {
              status: 'cancelled',
              cancelled_at: new Date(),
              auto_renew: false,
            },
          });
        }
        break;
      }

      case 'subscription.renewed': {
        const subscriptionEntity = payload.payload?.subscription?.entity;
        if (subscriptionEntity?.id) {
          const existingSubscription = await prisma.user_subscriptions.findFirst({
            where: { razorpay_subscription_id: subscriptionEntity.id },
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
        }
        break;
      }
    }

    // Mark ONLY this specific event as processed
    await prisma.razorpay_events.update({
      where: { id: createdEvent.id },
      data: { processed: true },
    }).catch(() => {});

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
