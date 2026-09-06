import { prisma } from '@/lib/db';

export interface FulfillOrderParams {
  orderId: string; // razorpay_order_id
  razorpayPaymentId: string;
  razorpaySignature?: string;
  eventId?: string; // ID of razorpay_events row if called from webhook
}

export async function fulfillOrder(params: FulfillOrderParams) {
  const { orderId, razorpayPaymentId, razorpaySignature, eventId } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch order with atomic check
    const order = await tx.razorpay_orders.findUnique({
      where: { razorpay_order_id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found', status: 404 };
    }

    // If already completed, return cleanly (idempotent fulfillment)
    if (order.status === 'completed') {
      if (eventId) {
        await tx.razorpay_events
          .update({
            where: { id: eventId },
            data: { processed: true },
          })
          .catch(() => {});
      }
      return { success: true, alreadyCompleted: true, order };
    }

    // 2. Record / Upsert Payment entry in razorpay_payments
    const existingPayment = await tx.razorpay_payments.findUnique({
      where: { razorpay_payment_id: razorpayPaymentId },
    });

    if (!existingPayment) {
      await tx.razorpay_payments.create({
        data: {
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: order.razorpay_order_id,
          razorpay_signature: razorpaySignature || null,
          user_id: order.user_id,
          amount: order.amount,
          status: 'captured',
        },
      });
    }

    // 3. Fulfill based on order_type
    if (order.order_type === 'credits' && order.credits_purchased) {
      await tx.user_credits.upsert({
        where: { user_id: order.user_id },
        update: {
          credits: { increment: order.credits_purchased },
        },
        create: {
          user_id: order.user_id,
          credits: order.credits_purchased,
        },
      });
    } else if (order.order_type === 'subscription' && order.plan_id) {
      const plan = await tx.subscription_plans.findUnique({
        where: { id: order.plan_id },
      });

      if (plan) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

        await tx.user_subscriptions.create({
          data: {
            user_id: order.user_id,
            plan_id: plan.id,
            status: 'active',
            expires_at: expiresAt,
            auto_renew: true,
          },
        });

        // Upgrade user to astrologer role if not admin
        const currentProfile = await tx.profiles.findUnique({
          where: { id: order.user_id },
          select: { role: true },
        });

        if (currentProfile && currentProfile.role !== 'admin') {
          await tx.profiles.update({
            where: { id: order.user_id },
            data: { role: 'astrologer' },
          });
        }

        // Approve any pending astrologer application
        await tx.astrologer_applications.updateMany({
          where: {
            user_id: order.user_id,
            status: 'PENDING',
          },
          data: {
            status: 'APPROVED',
            reviewed_at: new Date(),
          },
        });
      }
    }

    // 4. Mark order completed
    const updatedOrder = await tx.razorpay_orders.update({
      where: { id: order.id },
      data: { status: 'completed' },
    });

    // 5. Mark specific webhook event as processed if applicable
    if (eventId) {
      await tx.razorpay_events
        .update({
          where: { id: eventId },
          data: { processed: true },
        })
        .catch(() => {});
    }

    return { success: true, alreadyCompleted: false, order: updatedOrder };
  });
}
