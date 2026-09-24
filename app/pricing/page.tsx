import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import PricingClient from './PricingClient';
import JsonLd from "@/components/seo/JsonLd";
import { getBreadcrumbSchema, getFAQPageSchema, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing & Membership Plans | Mangalam Vastu",
  description:
    "Explore transparent pricing plans for Mangalam Vastu AI. Choose from Starter, Professional, and Enterprise packages for full 16-zone floor plan Vastu analysis.",
  alternates: {
    canonical: `${SITE_URL}/pricing`,
  },
  openGraph: {
    title: "Pricing & Membership Plans | Mangalam Vastu",
    description:
      "Choose the right Vastu analysis subscription or credit pack. Instant 16-zone report generation for architects and homeowners.",
    url: `${SITE_URL}/pricing`,
  },
};

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  duration_days: number;
  plan_type: string;
  features: Record<string, unknown> | null;
}

async function getUserData() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  let credits = 0;
  let hasActiveSubscription = false;
  let userLoggedIn = false;

  if (user && user.id) {
    userLoggedIn = true;
    
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, valid_from: true, valid_to: true },
    });

    const userCredits = await prisma.user_credits.findUnique({
      where: { user_id: user.id },
      select: { credits: true },
    });

    credits = userCredits?.credits ?? 0;

    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: user.id,
        status: { in: ['active', 'trialing'] },
        expires_at: { gt: new Date() },
      },
    });

    const now = new Date();
    const isAstrologerWithActiveSubscription =
      profile?.role === 'astrologer' &&
      profile.valid_from &&
      profile.valid_to &&
      now >= new Date(profile.valid_from) &&
      now <= new Date(profile.valid_to);

    hasActiveSubscription = (!!subscription || isAstrologerWithActiveSubscription) ?? false;
  }

  const dbPlans = await prisma.subscription_plans.findMany({
    where: { is_active: true },
    orderBy: { price_inr: 'asc' },
  });

  const subscriptions: SubscriptionPlan[] = dbPlans.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price_inr: p.price_inr,
    duration_days: p.duration_days,
    plan_type: p.plan_type,
    features: p.features as Record<string, unknown> | null,
  }));

  return {
    user: userLoggedIn ? user : null,
    userEmail: user?.email ?? null,
    credits,
    hasActiveSubscription,
    subscriptions,
  };
}

export default async function PricingPage() {
  const { userEmail, credits, hasActiveSubscription, subscriptions } = await getUserData();

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Pricing", url: "/pricing" },
  ]);

  const pricingFaqSchema = getFAQPageSchema([
    {
      question: "What is included in the Vastu analysis plans?",
      answer:
        "Plans include full access to 16-zone floor plan alignment, Devta grid calculation, Marma point sensitivity detection, object compliance tracking, and PDF report downloads.",
    },
    {
      question: "Can I buy additional credits as needed?",
      answer:
        "Yes, credit packs allow flexible pay-as-you-go Vastu analyses without requiring a recurring monthly subscription.",
    },
    {
      question: "Are payment transactions secure?",
      answer:
        "All transactions are processed through Razorpay, a PCI-DSS Level 1 compliant secure payment gateway.",
    },
  ]);

  return (
    <>
      <JsonLd data={[breadcrumbSchema, pricingFaqSchema]} />
      <PricingClient
        subscriptions={subscriptions}
        hasActiveSubscription={hasActiveSubscription}
        userCredits={credits}
        userEmail={userEmail}
      />
    </>
  );
}
