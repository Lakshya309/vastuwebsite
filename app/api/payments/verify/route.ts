import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateAuth } from '@/lib/auth';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { fulfillOrder } from '@/lib/paymentFulfillment';

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

    const result = await fulfillOrder({
      orderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Fulfillment failed' }, { status: result.status || 500 });
    }

    return NextResponse.json({
      message: result.alreadyCompleted ? 'Payment already verified' : 'Payment verified successfully',
      status: 'completed',
      orderType: order.order_type,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
