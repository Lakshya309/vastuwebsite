import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const CREDIT_PACKAGES = [
  { 
    id: 'credits_1rs', 
    credits: 1, 
    priceInr: 1, 
    priceWithGst: 1,
    name: '1 Rupee Test Credit', 
    description: 'Test payment credit',
    relocationsLimit: 5,
    mapUploadAllowed: true,
    popular: false 
  },
  { 
    id: 'basic_plan', 
    credits: 1, 
    priceInr: 999, 
    priceWithGst: 1179,
    name: 'Basic Plan', 
    description: '1 Project Credit • 5 Relocations Limit • Manual Plot & Map Upload',
    relocationsLimit: 5,
    mapUploadAllowed: true,
    popular: false 
  },
  { 
    id: 'advanced_plan', 
    credits: 1, 
    priceInr: 2500, 
    priceWithGst: 2950,
    name: 'Advanced Plan', 
    description: '1 Advanced Credit • 5 Relocations Limit • 45 Devta Grid & Shakti Chakra • Full PDF Report',
    relocationsLimit: 5,
    mapUploadAllowed: true,
    popular: true 
  },
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
    receipt: receipt || `rcpt_${userId}_${Date.now()}`,
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

  return signature === expectedSignature;
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

  return signature === expectedSignature;
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
