import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { RAZORPAY_WEBHOOK_SECRET } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/**
 * Webhook Testing Utility (Development / Staging Only)
 * Allows developers to simulate Razorpay webhooks locally and verify database execution.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const orderId = url.searchParams.get("orderId");
  const eventType = url.searchParams.get("event") || "payment.captured";
  const tier = url.searchParams.get("tier") || "basic";

  try {
    let targetOrderId = orderId;
    let targetUserId = userId;

    if (!targetOrderId && targetUserId) {
      // Find latest order for this user
      const latestOrder = await prisma.razorpay_orders.findFirst({
        where: { user_id: targetUserId },
        orderBy: { created_at: "desc" },
      });
      if (latestOrder) {
        targetOrderId = latestOrder.razorpay_order_id;
      }
    }

    if (!targetOrderId) {
      // Create a dummy pending order for testing if none provided
      if (!targetUserId) {
        const firstProfile = await prisma.profiles.findFirst();
        if (!firstProfile) {
          return NextResponse.json(
            { error: "No user profiles exist in database to test webhook" },
            { status: 400 }
          );
        }
        targetUserId = firstProfile.id;
      }

      const mockOrderId = `order_test_${Date.now()}`;
      await prisma.razorpay_orders.create({
        data: {
          user_id: targetUserId,
          razorpay_order_id: mockOrderId,
          amount: tier === "advanced" ? 2950 : 1179,
          order_type: "subscription",
          status: "pending",
          receipt: `rcpt_test_${Date.now()}`.slice(0, 40),
        },
      });
      targetOrderId = mockOrderId;
    }

    const mockPaymentId = `pay_test_${Date.now()}`;

    // Construct Razorpay payload
    const mockPayload = {
      entity: "event",
      account_id: "acc_test_12345",
      event: eventType,
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: mockPaymentId,
            entity: "payment",
            amount: tier === "advanced" ? 295000 : 117900,
            currency: "INR",
            status: "captured",
            order_id: targetOrderId,
            invoice_id: null,
            international: false,
            method: "upi",
            amount_refunded: 0,
            refund_status: null,
            captured: true,
            description: `${tier.toUpperCase()} Plan Subscription`,
            email: "test@example.com",
            contact: "+919999999999",
            fee: 2358,
            tax: 360,
            error_code: null,
            error_description: null,
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    };

    const payloadString = JSON.stringify(mockPayload);

    // Compute HMAC signature if webhook secret is configured
    const secret = RAZORPAY_WEBHOOK_SECRET || "your_razorpay_webhook_secret";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payloadString)
      .digest("hex");

    // Invoke the actual webhook handler endpoint directly
    const webhookUrl = new URL("/api/payments/webhook", req.url).toString();
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: payloadString,
    });

    const webhookResult = await webhookRes.json();

    // Check database status after webhook trigger
    const updatedOrder = await prisma.razorpay_orders.findUnique({
      where: { razorpay_order_id: targetOrderId },
    });

    const userSubscriptions = targetUserId
      ? await prisma.user_subscriptions.findMany({
          where: { user_id: targetUserId },
          orderBy: { created_at: "desc" },
          take: 3,
        })
      : [];

    return NextResponse.json({
      message: "Webhook simulation executed successfully",
      testParams: {
        orderId: targetOrderId,
        userId: targetUserId,
        eventType,
        tier,
      },
      webhookResponseBody: webhookResult,
      dbStatus: {
        orderStatus: updatedOrder?.status,
        userSubscriptionsCount: userSubscriptions.length,
        latestSubscription: userSubscriptions[0] || null,
      },
      instructions: [
        "To test webhook via curl / Postman, use POST /api/payments/webhook with header x-razorpay-signature",
        "To test live Razorpay webhooks locally during development, run: ngrok http 3000 and add https://your-ngrok.ngrok-free.app/api/payments/webhook into Razorpay Dashboard -> Webhooks",
      ],
    });
  } catch (error: any) {
    console.error("Test webhook simulation error:", error);
    return NextResponse.json(
      { error: "Webhook test failed", details: error.message },
      { status: 500 }
    );
  }
}
