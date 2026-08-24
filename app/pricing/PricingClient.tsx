"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loadRazorpayScript } from "@/lib/razorpay-client";
import {
  Check, X, Crown, Zap, Shield, ArrowRight, Lock,
  Upload, RefreshCw, Move, Layers, Building2, Home, Star
} from "lucide-react";
import { PLAN_PRICES, PLAN_LIMITS, type PlanTier } from "@/lib/planConfig";

interface PricingClientProps {
  userEmail: string | null;
  userPlan: PlanTier;
  userLoggedIn: boolean;
}

// ─── Feature comparison rows ───────────────────────────────────────────────────
const FEATURE_ROWS: {
  label: string;
  free: string | boolean;
  basic: string | boolean;
  advanced: string | boolean;
  icon: React.ReactNode;
}[] = [
  {
    label: "Map / Floor Plan Uploads",
    free: "1 upload",
    basic: "2 uploads (1 retry)",
    advanced: "2 uploads (1 retry)",
    icon: <Upload size={14} />,
  },
  {
    label: "Object Relocations",
    free: "None",
    basic: "5 per object",
    advanced: "5 per object",
    icon: <Move size={14} />,
  },
  {
    label: "Boundary / Walls",
    free: "Draw once (locked after save)",
    basic: "Draw once (locked after save)",
    advanced: "Draw once (locked after save)",
    icon: <Layers size={14} />,
  },
  {
    label: "Basic Objects (Toilet, Kitchen, Bedroom…)",
    free: true,
    basic: true,
    advanced: true,
    icon: <Home size={14} />,
  },
  {
    label: "Standard Objects (Sofa, Bed, AC, Wardrobe…)",
    free: false,
    basic: true,
    advanced: true,
    icon: <Building2 size={14} />,
  },
  {
    label: "Premium Objects (Aquarium, Bar, Elements…)",
    free: false,
    basic: false,
    advanced: true,
    icon: <Crown size={14} />,
  },
  {
    label: "Full Commercial Object Library",
    free: false,
    basic: "Partial",
    advanced: true,
    icon: <Star size={14} />,
  },
  {
    label: "45-Direction Vastu Grid",
    free: true,
    basic: true,
    advanced: true,
    icon: <Zap size={14} />,
  },
  {
    label: "Marma Point Detection",
    free: true,
    basic: true,
    advanced: true,
    icon: <Shield size={14} />,
  },
  {
    label: "Detailed Vastu Report",
    free: true,
    basic: true,
    advanced: true,
    icon: <Check size={14} />,
  },
];

// ─── Plan card configs ─────────────────────────────────────────────────────────
const PLAN_CARDS: {
  tier: PlanTier;
  icon: React.ReactNode;
  tagline: string;
  highlight: boolean;
  badge?: string;
  cta: string;
  gradient: string;
  borderColor: string;
  textAccent: string;
  bgCard: string;
}[] = [
  {
    tier: "free",
    icon: <Home size={24} />,
    tagline: "Get started with core Vastu essentials — completely free.",
    highlight: false,
    cta: "Start Free",
    gradient: "from-gray-50 to-white",
    borderColor: "border-gray-200",
    textAccent: "text-gray-700",
    bgCard: "bg-white",
  },
  {
    tier: "basic",
    icon: <Zap size={24} />,
    tagline: "Standard furniture & utilities. Perfect for homeowners.",
    highlight: false,
    badge: "Popular",
    cta: "Get Basic",
    gradient: "from-amber-50 to-orange-50",
    borderColor: "border-amber-300",
    textAccent: "text-amber-700",
    bgCard: "bg-amber-50/30",
  },
  {
    tier: "advanced",
    icon: <Crown size={24} />,
    tagline: "Every object, full commercial library, complete access.",
    highlight: true,
    badge: "Best Value",
    cta: "Go Advanced",
    gradient: "from-primary/5 to-primary/10",
    borderColor: "border-primary",
    textAccent: "text-primary",
    bgCard: "bg-primary/5",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: <Upload size={22} />,
    title: "Upload Your Floor Plan",
    desc: "Draw or upload your floor plan with our interactive canvas tools.",
  },
  {
    step: 2,
    icon: <Layers size={22} />,
    title: "Place Objects & Analyze",
    desc: "Add furniture and objects to see real-time Vastu compliance.",
  },
  {
    step: 3,
    icon: <RefreshCw size={22} />,
    title: "Relocate & Refine",
    desc: "Move objects up to 5 times per item to optimise placement.",
  },
];

function CellValue({ val }: { val: string | boolean }) {
  if (val === true)
    return <Check size={18} className="mx-auto text-emerald-500" />;
  if (val === false) return <X size={18} className="mx-auto text-gray-300" />;
  return <span className="text-xs text-gray-600 font-medium">{val}</span>;
}

export default function PricingClient({
  userEmail,
  userPlan,
  userLoggedIn,
}: PricingClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (tier: PlanTier) => {
    if (!userLoggedIn) return;
    if (tier === "free") return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      const { orderId, amount, currency, keyId } = data;

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) throw new Error("Razorpay SDK failed to load");

      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Mangalam Vastu",
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
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
            if (!verifyRes.ok) throw new Error("Payment verification failed");
            window.location.reload();
          } catch {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: userEmail || "" },
        theme: { color: "#4f46e5" },
      };

      const rzp = new (
        window as unknown as {
          Razorpay: new (o: Record<string, unknown>) => { open: () => void };
        }
      ).Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const renderCTA = (card: (typeof PLAN_CARDS)[0]) => {
    if (!userLoggedIn) {
      return (
        <Link
          href="/login"
          className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all"
        >
          <Lock size={14} />
          Login to Get Started
        </Link>
      );
    }

    if (userPlan === card.tier) {
      return (
        <div className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-200">
          <Check size={14} />
          Current Plan
        </div>
      );
    }

    if (card.tier === "free") {
      return (
        <Link
          href="/projects"
          className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all"
        >
          Go to Dashboard
          <ArrowRight size={14} />
        </Link>
      );
    }

    return (
      <button
        onClick={() => handlePurchase(card.tier)}
        disabled={loading}
        className={`mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${
          card.highlight
            ? "bg-primary text-white shadow-primary/30"
            : "bg-amber-500 text-white shadow-amber-500/20"
        }`}
      >
        {loading ? "Processing..." : card.cta}
        {!loading && <ArrowRight size={14} />}
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-6xl mx-auto">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <Zap size={12} />
            Simple, Transparent Pricing
          </span>
          <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary mb-5 leading-tight">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Start free and upgrade when you need more. All prices include{" "}
            <span className="font-semibold text-gray-700">18% GST</span>.
          </p>
        </motion.div>

        {/* ── 3-Column Pricing Cards ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-24"
        >
          {PLAN_CARDS.map((card, i) => {
            const price = PLAN_PRICES[card.tier];
            return (
              <motion.div
                key={card.tier}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={`relative flex flex-col rounded-[2rem] border-2 p-8 transition-all ${card.borderColor} ${card.bgCard} ${
                  card.highlight
                    ? "shadow-2xl shadow-primary/15 scale-[1.02] md:scale-[1.03]"
                    : "shadow-lg"
                }`}
              >
                {/* Badge */}
                {card.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-md ${
                      card.highlight ? "bg-primary" : "bg-amber-500"
                    }`}
                  >
                    {card.badge}
                  </div>
                )}

                {/* Icon + Name */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${card.highlight ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>
                  {card.icon}
                </div>
                <h2 className={`text-2xl font-cormorant font-bold italic mb-1 ${card.textAccent}`}>
                  {PLAN_PRICES[card.tier].label}
                </h2>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">{card.tagline}</p>

                {/* Price */}
                <div className="mb-6">
                  {price.base === 0 ? (
                    <p className="text-4xl font-black text-gray-800">₹0</p>
                  ) : (
                    <>
                      <p className="text-4xl font-black text-gray-800">
                        ₹{price.total.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ₹{price.base.toLocaleString("en-IN")} + ₹{price.gst} GST
                      </p>
                    </>
                  )}
                </div>

                {/* Quick feature bullets */}
                <ul className="space-y-2.5 mb-auto">
                  {[
                    card.tier === "free"
                      ? "1 map upload"
                      : "2 map uploads (1 retry)",
                    card.tier === "free"
                      ? "No object relocation"
                      : "5 relocations per object",
                    card.tier === "free"
                      ? "Core Vastu objects only"
                      : card.tier === "basic"
                      ? "Standard object library"
                      : "Complete object library",
                    "45-direction Vastu grid",
                    "Marma point detection",
                    "Full Vastu analysis report",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs text-gray-600">
                      <Check size={13} className={`flex-shrink-0 mt-0.5 ${card.highlight ? "text-primary" : card.tier === "basic" ? "text-amber-500" : "text-emerald-500"}`} />
                      {feat}
                    </li>
                  ))}
                </ul>

                {renderCTA(card)}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Limits at a glance ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-24 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: <Upload size={20} className="text-blue-500" />,
              title: "Map Uploads",
              free: "1 upload (no retry)",
              basic: "2 uploads (1 retry)",
              advanced: "2 uploads (1 retry)",
              bg: "bg-blue-50",
            },
            {
              icon: <Move size={20} className="text-violet-500" />,
              title: "Object Relocations",
              free: "Not available",
              basic: "5 moves per object",
              advanced: "5 moves per object",
              bg: "bg-violet-50",
            },
            {
              icon: <Layers size={20} className="text-emerald-500" />,
              title: "Boundary & Walls",
              free: "Draw once — locked on save",
              basic: "Draw once — locked on save",
              advanced: "Draw once — locked on save",
              bg: "bg-emerald-50",
            },
          ].map((item) => (
            <div key={item.title} className={`p-6 rounded-[1.5rem] ${item.bg} border border-white`}>
              <div className="flex items-center gap-2 mb-4">
                {item.icon}
                <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between"><span className="text-gray-400 font-semibold">Free</span><span>{item.free}</span></div>
                <div className="flex justify-between"><span className="text-amber-500 font-semibold">Basic</span><span>{item.basic}</span></div>
                <div className="flex justify-between"><span className="text-primary font-semibold">Advanced</span><span>{item.advanced}</span></div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── How It Works ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="glass p-8 rounded-[2rem] border border-white text-center relative shadow-sm">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg">
                  {item.step}
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 mt-3 text-primary">
                  {item.icon}
                </div>
                <h3 className="font-cormorant font-bold italic text-primary text-xl mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Feature Comparison Table ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary text-center mb-4">
            Full Feature Comparison
          </h2>
          <p className="text-gray-500 text-center mb-12 text-sm">
            Every feature, compared side-by-side.
          </p>

          <div className="glass rounded-[2rem] border border-white overflow-hidden shadow-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50">
                  <th className="text-left p-5 text-xs font-bold text-gray-500 uppercase tracking-widest w-[45%]">
                    Feature
                  </th>
                  <th className="text-center p-5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Free
                  </th>
                  <th className="text-center p-5 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50/40">
                    Basic
                  </th>
                  <th className="text-center p-5 text-xs font-bold text-primary uppercase tracking-widest bg-primary/5">
                    Advanced
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-white/30 ${i % 2 === 0 ? "bg-white/20" : ""}`}
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <span className="text-gray-400">{row.icon}</span>
                        {row.label}
                      </div>
                    </td>
                    <td className="p-5 text-center"><CellValue val={row.free} /></td>
                    <td className="p-5 text-center bg-amber-50/30"><CellValue val={row.basic} /></td>
                    <td className="p-5 text-center bg-primary/5"><CellValue val={row.advanced} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── CTA Footer ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="glass p-12 rounded-[2.5rem] border border-white shadow-2xl shadow-primary/5">
            <Crown size={36} className="text-primary mx-auto mb-5 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary mb-4">
              Ready to Begin Your Vastu Journey?
            </h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
              Start completely free — no credit card required. Upgrade any time to unlock
              more objects, relocations, and the full commercial library.
            </p>
            {!userLoggedIn ? (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 justify-center"
                >
                  Get Started Free <ArrowRight size={16} />
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
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-center text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
