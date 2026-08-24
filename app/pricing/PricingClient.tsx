"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loadRazorpayScript } from "@/lib/razorpay-client";
import {
  Check, X, Crown, Zap, Shield, ArrowRight, Lock,
  Upload, RefreshCw, Move, Layers, Building2, Home, Star,
  CheckCircle2, XCircle, Sparkles, HelpCircle, AlertCircle
} from "lucide-react";
import { PLAN_PRICES, type PlanTier } from "@/lib/planConfig";

interface PricingClientProps {
  userEmail: string | null;
  userPlan: PlanTier;
  userLoggedIn: boolean;
}

// ─── Table Comparison Row Interface ──────────────────────────────────────────
type CellStatus = "included" | "limited" | "excluded";

interface ComparisonRow {
  feature: string;
  category: string;
  tooltip?: string;
  free: { status: CellStatus; label: string };
  basic: { status: CellStatus; label: string };
  advanced: { status: CellStatus; label: string };
  icon: React.ReactNode;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  // ── Usage & Canvas Limits ──
  {
    feature: "Floor Plan Uploads",
    category: "Usage & Canvas Limits",
    tooltip: "Number of map uploads permitted for your account.",
    free: { status: "limited", label: "1 Upload (No Retry)" },
    basic: { status: "included", label: "2 Uploads (1 Retry)" },
    advanced: { status: "included", label: "2 Uploads (1 Retry)" },
    icon: <Upload size={15} className="text-blue-500" />,
  },
  {
    feature: "Object Relocations",
    category: "Usage & Canvas Limits",
    tooltip: "Move placed items up to 5 times to find optimal Vastu position.",
    free: { status: "excluded", label: "Not Included (0 Moves)" },
    basic: { status: "included", label: "5 Moves per Object" },
    advanced: { status: "included", label: "5 Moves per Object" },
    icon: <Move size={15} className="text-violet-500" />,
  },
  {
    feature: "Boundary & Wall Edits",
    category: "Usage & Canvas Limits",
    tooltip: "Draw plot walls once. Boundary locks upon saving.",
    free: { status: "limited", label: "Draw Once (Locked on Save)" },
    basic: { status: "limited", label: "Draw Once (Locked on Save)" },
    advanced: { status: "limited", label: "Draw Once (Locked on Save)" },
    icon: <Layers size={15} className="text-emerald-500" />,
  },

  // ── Object Library Access ──
  {
    feature: "Basic Core Objects",
    category: "Object Libraries",
    tooltip: "Toilet, Kitchen, Main Entry, Pooja Room, Master Bedroom",
    free: { status: "included", label: "Full Access" },
    basic: { status: "included", label: "Full Access" },
    advanced: { status: "included", label: "Full Access" },
    icon: <Home size={15} className="text-gray-600" />,
  },
  {
    feature: "Standard Furniture & Utilities",
    category: "Object Libraries",
    tooltip: "Bed, Sofa Set, AC, Wardrobe, Dining, TV, Washing Machine, etc.",
    free: { status: "excluded", label: "Locked" },
    basic: { status: "included", label: "Full Access" },
    advanced: { status: "included", label: "Full Access" },
    icon: <Building2 size={15} className="text-amber-600" />,
  },
  {
    feature: "Premium & Commercial Library",
    category: "Object Libraries",
    tooltip: "Aquarium, Bar, Fire/Water Elements, Heavy Machinery, Store, Offices",
    free: { status: "excluded", label: "Locked" },
    basic: { status: "excluded", label: "Locked" },
    advanced: { status: "included", label: "Full Unrestricted Access" },
    icon: <Crown size={15} className="text-amber-500" />,
  },

  // ── Vastu Intelligence & Reports ──
  {
    feature: "45-Direction Vastu Grid",
    category: "Vastu Analysis Engine",
    tooltip: "Exact angular subdivision into 45 Devta energy zones.",
    free: { status: "included", label: "Included" },
    basic: { status: "included", label: "Included" },
    advanced: { status: "included", label: "Included" },
    icon: <Zap size={15} className="text-yellow-500" />,
  },
  {
    feature: "Marma Point Vulnerability Check",
    category: "Vastu Analysis Engine",
    tooltip: "Detect sensitive intersection points on walls & objects.",
    free: { status: "included", label: "Included" },
    basic: { status: "included", label: "Included" },
    advanced: { status: "included", label: "Included" },
    icon: <Shield size={15} className="text-indigo-500" />,
  },
  {
    feature: "Vastu Analysis Report",
    category: "Vastu Analysis Engine",
    tooltip: "Comprehensive remedies, element balance, and detailed score breakdown.",
    free: { status: "limited", label: "Summary Report" },
    basic: { status: "included", label: "Detailed Report" },
    advanced: { status: "included", label: "Full Expert Report" },
    icon: <CheckCircle2 size={15} className="text-emerald-500" />,
  },
];

// ─── Status Badge Component ──────────────────────────────────────────────────
function StatusCell({ status, label }: { status: CellStatus; label: string }) {
  if (status === "included") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
        <Check size={13} className="text-emerald-600 stroke-[3]" />
        {label}
      </span>
    );
  }

  if (status === "limited") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <Sparkles size={13} className="text-amber-600" />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 opacity-80">
      <X size={13} className="text-slate-400 stroke-[2.5]" />
      {label}
    </span>
  );
}

// ─── Plan Feature Bullets for Cards ──────────────────────────────────────────
const PLAN_BULLETS: Record<
  PlanTier,
  { text: string; included: boolean; highlight?: boolean }[]
> = {
  free: [
    { text: "1 Map Upload (No retry)", included: true },
    { text: "Core Vastu Objects (Toilet, Kitchen, Pooja, Entry)", included: true },
    { text: "45-Direction Vastu Grid Analysis", included: true },
    { text: "Marma Point Vulnerability Check", included: true },
    { text: "Summary Vastu Analysis Report", included: true },
    { text: "0 Object Relocations (Fixed placement)", included: false },
    { text: "Standard Furniture (Bed, Sofa, AC, Wardrobe)", included: false },
    { text: "Premium & Commercial Object Library", included: false },
  ],
  basic: [
    { text: "2 Map Uploads (1 Retry included)", included: true, highlight: true },
    { text: "5 Relocations per Object (Refine placement)", included: true, highlight: true },
    { text: "Standard Furniture (Bed, Sofa, AC, Wardrobe, TV)", included: true, highlight: true },
    { text: "Core Vastu Objects Included", included: true },
    { text: "45-Direction Vastu Grid & Marma Detection", included: true },
    { text: "Detailed Vastu Analysis Report", included: true },
    { text: "Premium Objects (Aquarium, Bar, Elements)", included: false },
    { text: "Full Commercial & Industrial Library", included: false },
  ],
  advanced: [
    { text: "2 Map Uploads (1 Retry included)", included: true },
    { text: "5 Relocations per Object (Refine placement)", included: true },
    { text: "100% Unrestricted Object Library", included: true, highlight: true },
    { text: "Premium Objects (Aquarium, Bar, Elements)", included: true, highlight: true },
    { text: "Full Commercial, Office & Industrial Library", included: true, highlight: true },
    { text: "Standard & Basic Furniture Included", included: true },
    { text: "45-Direction Vastu Grid & Marma Detection", included: true },
    { text: "Full Comprehensive Expert Report", included: true, highlight: true },
  ],
};

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
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI / QR",
                instruments: [{ method: "upi" }],
              },
              other: {
                name: "Other Payment Methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
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

  const renderCTA = (tier: PlanTier) => {
    if (!userLoggedIn) {
      return (
        <Link
          href="/login"
          className="mt-8 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-900 text-white font-bold text-sm shadow-md hover:bg-gray-800 transition-all hover:scale-[1.02]"
        >
          <Lock size={15} />
          Login to Access
        </Link>
      );
    }

    if (userPlan === tier) {
      return (
        <div className="mt-8 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-sm border-2 border-emerald-300 shadow-sm">
          <Check size={16} className="stroke-[3]" />
          Current Active Plan
        </div>
      );
    }

    if (tier === "free") {
      return (
        <Link
          href="/projects"
          className="mt-8 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
        >
          Go to Dashboard
          <ArrowRight size={15} />
        </Link>
      );
    }

    const isAdvanced = tier === "advanced";

    return (
      <button
        onClick={() => handlePurchase(tier)}
        disabled={loading}
        className={`mt-8 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-98 ${
          isAdvanced
            ? "bg-gradient-to-r from-primary via-indigo-600 to-primary text-white shadow-primary/30 hover:brightness-110"
            : "bg-amber-500 text-white shadow-amber-500/25 hover:bg-amber-600"
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Initiating Checkout...</span>
          </div>
        ) : (
          <>
            <span>Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 md:px-8 bg-gradient-to-b from-stone-50 via-white to-stone-50">
      <div className="max-w-6xl mx-auto">

        {/* ── Hero Header ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20">
            <Sparkles size={14} className="text-primary" />
            Transparent Vastu Pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-cormorant font-bold italic text-primary mb-4 leading-tight">
            Simple Plans, Complete Clarity
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose the plan tailored to your floor plan needs. Clear limits, transparent access, no hidden costs. All paid prices include <span className="font-bold text-gray-800">18% GST</span>.
          </p>
        </motion.div>

        {/* ── 3 Main Plan Cards ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-8 mb-20 items-stretch"
        >
          {/* 1. FREE TIER */}
          <div className="flex flex-col rounded-[2.2rem] border-2 border-gray-200 bg-white p-8 shadow-md relative hover:shadow-xl transition-all">
            {userPlan === "free" && userLoggedIn && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm">
                Your Current Plan
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center mb-4">
              <Home size={22} />
            </div>
            <h2 className="text-2xl font-cormorant font-bold text-gray-900 mb-1">Free Tier</h2>
            <p className="text-xs text-gray-500 mb-6 min-h-[32px]">Essential core Vastu tools to get started with basic layouts.</p>

            <div className="mb-6 pb-6 border-b border-gray-100">
              <span className="text-4xl font-black text-gray-900">₹0</span>
              <span className="text-xs text-gray-400 ml-2 font-medium">Free Forever</span>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Plan Features</div>
            <ul className="space-y-3 mb-auto">
              {PLAN_BULLETS.free.map((b) => (
                <li key={b.text} className={`flex items-start gap-2.5 text-xs ${b.included ? "text-gray-700" : "text-gray-400 line-through opacity-70"}`}>
                  {b.included ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>

            {renderCTA("free")}
          </div>

          {/* 2. BASIC TIER */}
          <div className="flex flex-col rounded-[2.2rem] border-2 border-amber-300 bg-gradient-to-b from-amber-50/40 to-white p-8 shadow-xl relative hover:shadow-2xl transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-400 shadow-md">
              Most Popular
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Zap size={22} />
            </div>
            <h2 className="text-2xl font-cormorant font-bold text-amber-950 mb-1">Basic Plan</h2>
            <p className="text-xs text-gray-600 mb-6 min-h-[32px]">Standard furniture & utilities. Ideal for homeowners & small layouts.</p>

            <div className="mb-6 pb-6 border-b border-amber-100">
              <span className="text-4xl font-black text-gray-900">
                ₹{PLAN_PRICES.basic.total.toLocaleString("en-IN")}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                ₹{PLAN_PRICES.basic.base.toLocaleString("en-IN")} + ₹{PLAN_PRICES.basic.gst} GST (18%)
              </p>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Included Capabilities</div>
            <ul className="space-y-3 mb-auto">
              {PLAN_BULLETS.basic.map((b) => (
                <li key={b.text} className={`flex items-start gap-2.5 text-xs ${b.included ? "text-gray-800 font-medium" : "text-gray-400 line-through opacity-70"}`}>
                  {b.included ? (
                    <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>

            {renderCTA("basic")}
          </div>

          {/* 3. ADVANCED TIER */}
          <div className="flex flex-col rounded-[2.2rem] border-2 border-primary bg-gradient-to-b from-primary/10 via-primary/5 to-white p-8 shadow-2xl relative hover:shadow-primary/20 transition-all scale-[1.02]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white bg-primary shadow-lg shadow-primary/30 flex items-center gap-1">
              <Crown size={12} />
              Best Value • Complete Access
            </div>

            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <Crown size={22} />
            </div>
            <h2 className="text-2xl font-cormorant font-bold text-primary mb-1">Advanced Plan</h2>
            <p className="text-xs text-gray-600 mb-6 min-h-[32px]">Full unrestricted commercial, office, residential & elemental library.</p>

            <div className="mb-6 pb-6 border-b border-primary/10">
              <span className="text-4xl font-black text-gray-900">
                ₹{PLAN_PRICES.advanced.total.toLocaleString("en-IN")}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                ₹{PLAN_PRICES.advanced.base.toLocaleString("en-IN")} + ₹{PLAN_PRICES.advanced.gst} GST (18%)
              </p>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-3">All Features Unlocked</div>
            <ul className="space-y-3 mb-auto">
              {PLAN_BULLETS.advanced.map((b) => (
                <li key={b.text} className="flex items-start gap-2.5 text-xs text-gray-900 font-medium">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span className={b.highlight ? "font-bold text-primary" : ""}>{b.text}</span>
                </li>
              ))}
            </ul>

            {renderCTA("advanced")}
          </div>
        </motion.div>

        {/* ── Limits at a Glance Summary Cards ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-cormorant font-bold text-primary">
              Core Limits & Access Matrix
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Key differences between Free, Basic, and Advanced tier accounts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Uploads */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Map Uploads</h3>
                  <p className="text-[11px] text-gray-400">Upload allowance per account</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                  <span className="font-semibold text-gray-500">Free</span>
                  <span className="font-bold text-gray-700">1 Upload (0 Retry)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="font-semibold text-amber-800">Basic</span>
                  <span className="font-bold text-amber-900">2 Uploads (1 Retry)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="font-semibold text-primary">Advanced</span>
                  <span className="font-bold text-primary">2 Uploads (1 Retry)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Relocations */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                  <Move size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Object Relocations</h3>
                  <p className="text-[11px] text-gray-400">Re-position items to test Vastu</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                  <span className="font-semibold text-gray-500">Free</span>
                  <span className="font-bold text-gray-400 line-through">Not Allowed (0)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="font-semibold text-amber-800">Basic</span>
                  <span className="font-bold text-amber-900">5 Moves / Object</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="font-semibold text-primary">Advanced</span>
                  <span className="font-bold text-primary">5 Moves / Object</span>
                </div>
              </div>
            </div>

            {/* Card 3: Object Library */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Object Library Access</h3>
                  <p className="text-[11px] text-gray-400">Furniture & elements available</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                  <span className="font-semibold text-gray-500">Free</span>
                  <span className="font-bold text-gray-700">Core Essentials Only</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="font-semibold text-amber-800">Basic</span>
                  <span className="font-bold text-amber-900">Standard Furniture</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="font-semibold text-primary">Advanced</span>
                  <span className="font-bold text-primary">100% Full Library</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Side-by-Side Detailed Feature Comparison Table ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-cormorant font-bold text-primary mb-2">
              Side-by-Side Feature Comparison
            </h2>
            <p className="text-sm text-gray-500">
              Clear breakdown of what is included, limited, or excluded in each plan tier.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-5 text-xs font-bold uppercase tracking-wider w-[40%]">
                      Feature Name
                    </th>
                    <th className="p-5 text-center text-xs font-bold uppercase tracking-wider text-gray-300 w-[20%]">
                      Free Plan
                    </th>
                    <th className="p-5 text-center text-xs font-bold uppercase tracking-wider text-amber-300 bg-slate-800/80 w-[20%]">
                      Basic Plan
                    </th>
                    <th className="p-5 text-center text-xs font-bold uppercase tracking-wider text-primary-light bg-primary/30 w-[20%]">
                      Advanced Plan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 shrink-0">
                            {row.icon}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {row.feature}
                            </div>
                            {row.tooltip && (
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                {row.tooltip}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Free Cell */}
                      <td className="p-5 text-center align-middle">
                        <StatusCell status={row.free.status} label={row.free.label} />
                      </td>

                      {/* Basic Cell */}
                      <td className="p-5 text-center align-middle bg-amber-50/20">
                        <StatusCell status={row.basic.status} label={row.basic.label} />
                      </td>

                      {/* Advanced Cell */}
                      <td className="p-5 text-center align-middle bg-primary/5">
                        <StatusCell status={row.advanced.status} label={row.advanced.label} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* ── How It Works ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-cormorant font-bold text-primary text-center mb-10">
            How Upgrade Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center shadow-md">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Select Your Plan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Choose between Basic (for standard home furniture) or Advanced (for all commercial & premium items).
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center shadow-md">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Instant Activation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pay securely via Razorpay (UPI, GPay, Cards, Netbanking). Your tier updates instantly.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center shadow-md">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Unlock Full Canvas</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Add objects, run 5 relocations, and generate detailed Vastu analysis reports immediately.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Error Banner ─────────────────────────────────────────── */}
        {error && (
          <div className="mt-8 max-w-lg mx-auto bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-red-700 text-xs font-semibold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
