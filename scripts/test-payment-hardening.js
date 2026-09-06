const { prisma } = require('../lib/db');

async function testPaymentHardening() {
  console.log("Starting Payment System Hardening Verification Tests...\n");

  // 1. Create a dummy test user or find existing test user
  const user = await prisma.users.findFirst({ select: { id: true, email: true } });
  if (!user) {
    console.error("No user found in database for test.");
    process.exit(1);
  }
  console.log(`Using test user ID: ${user.id} (${user.email})`);

  // 2. Create a test order
  const testOrderId = `test_order_${Date.now()}`;
  const testOrder = await prisma.razorpay_orders.create({
    data: {
      user_id: user.id,
      razorpay_order_id: testOrderId,
      amount: 999,
      order_type: 'credits',
      credits_purchased: 1,
      status: 'pending',
      receipt: `rcpt_${Date.now()}`,
    },
  });
  console.log(`✔ Test order created: ID=${testOrder.id}, RazorpayOrderID=${testOrderId}`);

  // Get initial credit balance
  const initialCreditRecord = await prisma.user_credits.findUnique({ where: { user_id: user.id } });
  const initialCredits = initialCreditRecord ? initialCreditRecord.credits : 0;
  console.log(`Initial Credits: ${initialCredits}`);

  // Import paymentFulfillment logic
  const { fulfillOrder } = require('../lib/paymentFulfillment');

  // 3. First fulfillment (Simulating /api/payments/verify call)
  const testPaymentId = `test_pay_${Date.now()}`;
  console.log(`\nSimulating 1st fulfillment call (client verification)...`);
  const result1 = await fulfillOrder({
    orderId: testOrderId,
    razorpayPaymentId: testPaymentId,
    razorpaySignature: 'sig_test_123',
  });
  console.log(`1st Fulfillment Result:`, { success: result1.success, alreadyCompleted: result1.alreadyCompleted, status: result1.order?.status });

  // 4. Second fulfillment (Simulating /api/payments/webhook call arriving 100ms later)
  console.log(`\nSimulating 2nd concurrent fulfillment call (webhook arriving later)...`);
  const result2 = await fulfillOrder({
    orderId: testOrderId,
    razorpayPaymentId: testPaymentId,
  });
  console.log(`2nd Fulfillment Result:`, { success: result2.success, alreadyCompleted: result2.alreadyCompleted, status: result2.order?.status });

  // 5. Verify final credit balance
  const finalCreditRecord = await prisma.user_credits.findUnique({ where: { user_id: user.id } });
  const finalCredits = finalCreditRecord ? finalCreditRecord.credits : 0;
  console.log(`\nFinal Credits: ${finalCredits}`);

  if (finalCredits === initialCredits + 1) {
    console.log(`\n🎉 TEST PASSED! Exactly 1 credit was added despite 2 fulfillment calls.`);
  } else {
    console.error(`\n❌ TEST FAILED! Expected ${initialCredits + 1} credits, but found ${finalCredits}.`);
  }

  // Cleanup test order & payment
  await prisma.razorpay_payments.deleteMany({ where: { razorpay_order_id: testOrderId } });
  await prisma.razorpay_orders.deleteMany({ where: { razorpay_order_id: testOrderId } });
  // Restore initial credits
  if (initialCreditRecord) {
    await prisma.user_credits.update({ where: { user_id: user.id }, data: { credits: initialCredits } });
  }
  console.log("Cleaned up test records successfully.");
}

testPaymentHardening()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
  });
