import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
  }
  return razorpayInstance;
}

export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const CREDIT_PACKAGES = [
  { id: 'credits_1', credits: 1, priceInr: 99, name: '1 Credit' },
  { id: 'credits_3', credits: 3, priceInr: 249, name: '3 Credits', popular: true },
  { id: 'credits_5', credits: 5, priceInr: 399, name: '5 Credits' },
  { id: 'credits_10', credits: 10, priceInr: 699, name: '10 Credits' },
];

export interface CreateOrderParams {
  userId: string;
  amount: number;
  currency?: string;
  orderType: 'credits' | 'subscription';
  credits?: number;
  planId?: string;
  receipt?: string;
}

export interface CreateSubscriptionParams {
  userId: string;
  planId: string;
  customerId?: string;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const {
    userId,
    amount,
    currency = 'INR',
    orderType,
    credits,
    planId,
    receipt,
  } = params;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay not configured');
  }

  const options = {
    amount: amount * 100,
    currency,
    receipt: (receipt || `rcpt_${userId.replace(/-/g, '').slice(0, 8)}_${Date.now()}`).slice(0, 40),
    notes: {
      userId,
      orderType,
      credits: credits?.toString() || '',
      planId: planId || '',
    },
  };

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create(options);
  return order;
}

export async function createSubscription(params: CreateSubscriptionParams) {
  const { userId, planId, customerId } = params;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay not configured');
  }

  const subscriptionConfig: {
    plan_id: string;
    total_count: number;
    quantity: number;
    notes: { userId: string };
    customer_id?: string;
  } = {
    plan_id: planId,
    total_count: 12,
    quantity: 1,
    notes: { userId },
  };

  if (customerId) {
    subscriptionConfig.customer_id = customerId;
  }

  const razorpay = getRazorpay();
  const subscription = await razorpay.subscriptions.create(subscriptionConfig);

  return subscription;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay not configured');
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const signatureBuffer = Buffer.from(signature, 'utf-8');
  
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Razorpay webhook secret not configured');
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const signatureBuffer = Buffer.from(signature, 'utf-8');
  
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function cancelSubscription(subscriptionId: string) {
  const razorpay = getRazorpay();
  const subscription = await razorpay.subscriptions.cancel(subscriptionId);
  return subscription;
}

export async function getSubscription(subscriptionId: string) {
  const razorpay = getRazorpay();
  const subscription = await razorpay.subscriptions.fetch(subscriptionId);
  return subscription;
}

export async function createCustomer(email: string, name: string, userId: string) {
  const razorpay = getRazorpay();
  const customer = await razorpay.customers.create({
    email,
    name,
    notes: {
      userId,
    },
  });
  return customer;
}
