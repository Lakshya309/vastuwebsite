"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loadRazorpayScript } from "@/lib/razorpay-client";
import { CREDIT_PACKAGES } from "@/lib/razorpay";
import { Upload, FileSearch, Download, Home, Building2, Star, Check, Lock } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  duration_days: number;
  plan_type: string;
  features: Record<string, unknown> | null;
}

interface PricingClientProps {
  subscriptions: SubscriptionPlan[];
  hasActiveSubscription: boolean | null;
  userCredits: number;
  userEmail: string | null;
}

const FREE_CREDITS = 5;

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Upload,
    title: "Upload Your Floor Plan",
    description: "Draw or upload your floor plan with our interactive canvas tools.",
  },
  {
    step: 2,
    icon: FileSearch,
    title: "Place Objects & Analyze",
    description: "Add furniture and objects to see real-time Vastu compliance.",
  },
  {
    step: 3,
    icon: Download,
    title: "Get Your Report",
    description: "Receive a comprehensive analysis with actionable recommendations.",
  },
];

const USE_CASES = [
  {
    icon: Home,
    title: "Homeowners",
    description: "Ensure your dream home brings peace and prosperity. Perfect for new construction or renovations.",
    features: ["One-time analysis per property", "Detailed room-by-room guidance", "Cost-effective solution"],
  },
  {
    icon: Building2,
    title: "Architects & Designers",
    description: "Integrate Vastu compliance into your projects seamlessly. Impress clients with professional reports.",
    features: ["Multiple project analysis", "Client-ready reports", "Priority support"],
  },
  {
    icon: Star,
    title: "Astrologers & Vastu Consultants",
    description: "Offer Vastu analysis services to your clients. Build credibility with AI-powered insights.",
    features: ["Unlimited analyses", "White-label reports", "Client management"],
  },
];

const FEATURE_COMPARISON = [
  { feature: "Vastu Analysis", credits: true, subscription: true },
  { feature: "Marma Point Detection", credits: true, subscription: true },
  { feature: "45-Direction Grid", credits: true, subscription: true },
  { feature: "Detailed Reports", credits: true, subscription: true },
  { feature: "Object Placement Guide", credits: true, subscription: true },
  { feature: "Number of Analyses", credits: "1 credit per analysis", subscription: "Unlimited" },
  { feature: "Report Validity", credits: "Permanent access", subscription: "During subscription" },
  { feature: "Priority Support", credits: false, subscription: true },
  { feature: "API Access", credits: false, subscription: false },
];

export default function PricingClient({
  subscriptions,
  hasActiveSubscription,
  userCredits,
  userEmail,
}: PricingClientProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!userEmail;
  const isSubscribed = hasActiveSubscription;

  const handlePurchase = async (type: "credits" | "subscription", packageId: string) => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "credits"
            ? { packageId }
            : { planId: packageId }
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { orderId, amount, currency } = await res.json();

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        throw new Error("Razorpay SDK failed to load");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Mangalam Vastu",
        description: type === "credits" ? "Purchase Credits" : "Subscription Plan",
        order_id: orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }

            window.location.reload();
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: userEmail || "",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const renderButton = (type: "credits" | "subscription", id: string) => {
    if (!isLoggedIn) {
      return (
        <Link
          href="/login"
          className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
        >
          <Lock className="w-4 h-4" />
          Login to Purchase
        </Link>
      );
    }

    if (isSubscribed && type === "subscription") {
      return (
        <div className="mt-4 w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-xl font-semibold border border-green-200">
          <Check className="w-4 h-4" />
          Active
        </div>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePurchase(type, id);
        }}
        disabled={loading}
        className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Processing..." : "Subscribe"}
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get started with professional Vastu analysis or upgrade to unlimited access
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 glass rounded-full border border-white">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-primary font-semibold">
              {FREE_CREDITS} Free Credits for New Users
            </span>
          </div>
          {isLoggedIn && userCredits > 0 && (
            <div className="mt-4 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              You have {userCredits} credits available
            </div>
          )}
        </motion.div>

        {/* How It Works */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={index} className="glass p-8 rounded-[2rem] border border-white text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {item.step}
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-cormorant font-bold italic text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Use Cases */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary text-center mb-4">
            Perfect For Everyone
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Whether you&apos;re a homeowner, architect, or Vastu consultant, we have the right plan for you.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map((useCase, index) => (
              <div key={index} className="glass p-8 rounded-[2rem] border border-white">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <useCase.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-cormorant font-bold italic text-primary mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {useCase.description}
                </p>
                <ul className="space-y-2">
                  {useCase.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Credit Packages & Subscriptions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-24"
        >
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Credit Packages */}
            <div>
              <h2 className="text-3xl font-cormorant font-bold italic text-primary mb-2">
                Pay As You Go
              </h2>
              <p className="text-gray-600 mb-8">
                Purchase credits individually. Each credit unlocks one comprehensive Vastu analysis.
              </p>
              <div className="space-y-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`glass p-6 rounded-[1.5rem] border transition-all cursor-pointer ${
                      selectedPackage === pkg.id
                        ? "border-primary shadow-lg shadow-primary/10"
                        : "border-white hover:border-primary/30"
                    } ${pkg.popular ? "ring-2 ring-primary ring-offset-4" : ""}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                          {pkg.popular && (
                            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          {pkg.credits} {pkg.credits === 1 ? 'analysis' : 'analyses'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{pkg.priceInr}</p>
                        <p className="text-xs text-gray-400">
                          ₹{(pkg.priceInr / pkg.credits).toFixed(0)}/analysis
                        </p>
                      </div>
                    </div>
                    {renderButton("credits", pkg.id)}
                  </div>
                ))}
              </div>
            </div>

            {/* Subscriptions */}
            <div>
              <h2 className="text-3xl font-cormorant font-bold italic text-primary mb-2">
                Expert Subscription
              </h2>
              <p className="text-gray-600 mb-8">
                Unlimited Vastu analyses for astrologers, architects, and serious consultants.
              </p>
              {isSubscribed ? (
                <div className="glass p-8 rounded-[1.5rem] border border-green-200 bg-green-50/50 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Active Subscription</h3>
                  <p className="text-green-600">You have unlimited access to all analyses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((plan) => (
                    <div
                      key={plan.id}
                      className={`glass p-6 rounded-[1.5rem] border transition-all cursor-pointer ${
                        selectedPlan === plan.id
                          ? "border-primary shadow-lg shadow-primary/10"
                          : "border-white hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          <p className="text-sm text-gray-500">
                            {plan.duration_days} days of unlimited access
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">₹{plan.price_inr}</p>
                          <p className="text-xs text-gray-400">
                            ₹{(plan.price_inr / plan.duration_days).toFixed(0)}/day
                          </p>
                        </div>
                      </div>
                      {renderButton("subscription", plan.id)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary text-center mb-4">
            Compare Features
          </h2>
          <p className="text-gray-500 text-center mb-12">
            See what&apos;s included in each plan
          </p>
          <div className="glass rounded-[2rem] border border-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50">
                  <th className="text-left p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="text-center p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="text-center p-6 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row, index) => (
                  <tr key={index} className={`border-b border-white/30 ${index % 2 === 0 ? 'bg-white/20' : ''}`}>
                    <td className="p-6 text-gray-700 font-medium">{row.feature}</td>
                    <td className="p-6 text-center">
                      {typeof row.credits === 'boolean' ? (
                        row.credits ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{row.credits}</span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {typeof row.subscription === 'boolean' ? (
                        row.subscription ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{row.subscription}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* CTA Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="glass p-12 rounded-[2.5rem] border border-white">
            <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary mb-4">
              Ready to Begin Your Vastu Journey?
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Start with {FREE_CREDITS} free credits on signup. No credit card required.
            </p>
            {!isLoggedIn ? (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 glass text-primary rounded-xl font-bold hover:bg-white transition-all border border-primary/20"
                >
                  Login
                </Link>
              </div>
            ) : (
              <Link
                href="/projects"
                className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
