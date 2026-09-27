"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loadRazorpayScript } from "@/lib/razorpay-client";
import { CREDIT_PACKAGES } from "@/lib/razorpay";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload, Download, Home, Building2, Star,
  Check, Lock, Sparkles, Compass, Layers, Zap,
  ArrowRight, ShieldCheck, CheckCircle2, X, ChevronDown, ChevronUp, ChevronRight,
  HelpCircle, CreditCard, Award, Crown
} from "lucide-react";

/* ─── Types ─── */
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

/* ─── Feature slides (left / dark panel) ─── */
const FEATURES = [
  {
    id: "intro",
    eyebrow: "Mangalam Plus",
    title: ["Ancient Vastu", "Wisdom."],
    accent: "High-Fidelity AI Precision",
    body: "India's most advanced architectural Vastu analysis platform. Built on classical Samarangana Sutradhara & Mayamatam texts, powered by modern spatial AI.",
    stats: [
      { v: "99.8%", l: "Spatial Accuracy" },
      { v: "45", l: "Devta Grids" },
      { v: "1,200+", l: "Consultants" },
    ],
    icon: Sparkles,
    badge: "",
  },
  {
    id: "devta",
    eyebrow: "Feature 01",
    title: ["45 Devta", "Grid Overlay"],
    accent: "Sacred Spatial Energy Geometry",
    body: "Maps exact energy fields of all 45 internal and external deities across any floor plan. Zones governed by Brahma, Aryama, Vivasvan, Mitra and 41 other sacred entities — with degree-level precision.",
    icon: Compass,
    badge: "Advanced & Astrologer Plans",
  },
  {
    id: "shakti",
    eyebrow: "Feature 02",
    title: ["Shakti Chakra", "360° Wheel"],
    accent: "Degree-Level Angular Balancing",
    body: "360-degree rotational grid computing exact directional weightages and elemental imbalances. Calibrates true North offset and live boundary distribution analysis across all 16 directional zones.",
    icon: Layers,
    badge: "Advanced & Astrologer Plans",
  },
  {
    id: "marma",
    eyebrow: "Feature 03",
    title: ["Marma Points", "& Vulnerability Nodes"],
    accent: "Critical Structural Intersection",
    body: "Detects Mahamarma and Uparamarma lines across floor plans. Ensures columns, walls, toilets, and heavy equipment avoid vital energy channels mapped across 9 primary Marma nodes per plan.",
    icon: Zap,
    badge: "Advanced & Astrologer Plans",
  },
  {
    id: "pdf",
    eyebrow: "Feature 04",
    title: ["Executive", "PDF Reports"],
    accent: "Client-Ready Professional Export",
    body: "Multi-page PDF documents with room-by-room Vastu status, elemental remedies, floor plan overlays, and optional white-label branding. Instant high-resolution export from any completed analysis.",
    icon: Download,
    badge: "All Paid Plans",
  },
  {
    id: "upload",
    eyebrow: "Feature 05",
    title: ["Blueprint", "Map Upload"],
    accent: "Instant CAD / Floor Plan Processing",
    body: "Upload architectural floor plan images to calibrate compass headings, set true scale, and snap all 16 Vastu zones over your actual building drawings — PNG, JPG, or blueprint scans.",
    icon: Upload,
    badge: "Basic · Advanced · Astrologer",
  },
  {
    id: "usecases",
    eyebrow: "Who It's For",
    title: ["Built for Every", "Stakeholder."],
    accent: "Purpose-built for every role",
    body: "Three distinct user types, each with tailored tooling and workflows designed around how they actually practice Vastu analysis.",
    icon: Home,
    badge: "",
    cases: [
      {
        icon: Home,
        title: "Homeowners",
        body: "One-time single-property analysis with room-by-room guidance for construction or renovation.",
      },
      {
        icon: Building2,
        title: "Architects & Designers",
        body: "Multi-project workflows with professional blueprint upload and spatial measurement tools.",
      },
      {
        icon: Star,
        title: "Astrologers & Consultants",
        body: "Unlimited analyses with white-label PDF reports and client project management dashboard.",
      },
    ],
  },
];

/* ─── Credit / Pay-As-You-Go Plans ─── */
const CREDIT_PLANS = [
  {
    id: "free",
    label: "FREE TRIAL",
    labelBg: "bg-emerald-500",
    title: "Free Trial",
    sub: "5 Credits for new accounts",
    price: "₹0",
    note: "No credit card required",
    popular: false,
    features: [
      ["5 free analysis credits", true],
      ["Manual canvas drawing", true],
      ["16 Vastu Zones & 8 Directions", true],
      ["Residential property only", true],
      ["5 relocations / object", true],
      ["Map / blueprint upload", false],
      ["45 Devta Grid Overlay", false],
      ["PDF Report Download", false],
    ],
    cta: "Start Free",
    ctaHref: "/projects",
    cardBg: "bg-white",
    border: "border-emerald-500/30",
    ctaClass: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20",
    pkg: null,
    subPlan: false,
  },
  {
    id: "basic",
    label: "BASIC · SINGLE PROJECT",
    labelBg: "bg-[#004b6e]",
    title: "Basic Plan",
    sub: "Single property credit",
    price: "₹1,179",
    note: "₹999 + 18% GST · one-time",
    popular: false,
    features: [
      ["1 comprehensive analysis credit", true],
      ["Manual canvas & Map upload", true],
      ["16 Vastu Zones & 8 Directions", true],
      ["Residential property", true],
      ["5 relocations / object", true],
      ["Basic Summary PDF Report", true],
      ["45 Devta Grid Overlay", false],
      ["Shakti Chakra & Marma Points", false],
    ],
    cta: "Buy Basic Plan · ₹1,179",
    ctaHref: null,
    cardBg: "bg-white",
    border: "border-slate-200",
    ctaClass: "bg-[#004b6e] text-white hover:bg-[#003854] shadow-[#004b6e]/20",
    pkg: "basic_plan",
    subPlan: false,
  },
  {
    id: "advanced",
    label: "⭐ MOST POPULAR · FULL PRECISION",
    labelBg: "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950",
    title: "Advanced Plan",
    sub: "Full-precision 16 zones + 45 Devta credit",
    price: "₹2,950",
    note: "₹2,500 + 18% GST · one-time",
    popular: true,
    features: [
      ["1 advanced precision credit", true],
      ["Manual canvas & Map upload", true],
      ["16 Zones + 45 Devta Grid + Shakti Chakra", true],
      ["Residential & Commercial properties", true],
      ["5 relocations / object", true],
      ["Full Detailed PDF Report Export", true],
      ["Marma Points & Distance Tool", true],
      ["Wall Color Customization", true],
    ],
    cta: "Buy Advanced Plan · ₹2,950",
    ctaHref: null,
    cardBg: "bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40",
    border: "border-amber-400/80 ring-2 ring-amber-400/30",
    ctaClass: "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-extrabold hover:from-amber-400 hover:to-yellow-300 shadow-amber-500/25",
    pkg: "advanced_plan",
    subPlan: false,
  },
];

/* ─── Expert Monthly Subscription Plans ─── */
const SUBSCRIPTION_PLANS = [
  {
    id: "starter_expert",
    label: "EXPERT STARTER",
    labelBg: "bg-[#1c2333]",
    title: "Expert Starter",
    sub: "Growing consultancy practice",
    price: "₹1,999",
    note: "per month · cancel anytime",
    popular: false,
    features: [
      ["20 project analyses / month", true],
      ["All 45 Devta & Shakti Chakra tools", true],
      ["White-label PDF reports", true],
      ["Client project management portal", true],
      ["Expert referral badge", true],
      ["Priority email & chat support", true],
      ["All property types (Res / Comm)", true],
      ["Unlimited object relocations", true],
    ],
    cta: "Apply as Astrologer",
    ctaHref: "/astrologer/apply",
    cardBg: "bg-white",
    border: "border-slate-200",
    ctaClass: "bg-[#1c2333] text-white hover:bg-[#0d1b2a]",
    pkg: null,
    subPlan: true,
  },
  {
    id: "pro_expert",
    label: "⭐ UNLIMITED CONSULTANT",
    labelBg: "bg-gradient-to-r from-[#004b6e] to-[#0e2235]",
    title: "Expert Pro",
    sub: "Established Vastu consultancy",
    price: "₹3,499",
    note: "per month · cancel anytime",
    popular: true,
    features: [
      ["Unlimited project analyses", true],
      ["All overlay tools & 45 Devtas", true],
      ["White-label PDF reports with logo", true],
      ["Client project management portal", true],
      ["Expert referral directory listing", true],
      ["Priority hotline & phone support", true],
      ["All property types supported", true],
      ["Unlimited object relocations", true],
    ],
    cta: "Apply as Astrologer",
    ctaHref: "/astrologer/apply",
    cardBg: "bg-gradient-to-br from-sky-50/60 via-white to-slate-50",
    border: "border-primary/40 ring-2 ring-primary/20",
    ctaClass: "bg-gradient-to-r from-[#004b6e] to-[#0e2235] text-white hover:opacity-95 shadow-[#004b6e]/25",
    pkg: null,
    subPlan: true,
  },
  {
    id: "enterprise",
    label: "ENTERPRISE",
    labelBg: "bg-amber-400 text-slate-950 font-bold",
    title: "Enterprise Plan",
    sub: "Architectural firms & large teams",
    price: "Custom",
    note: "Contact us for team pricing",
    popular: false,
    features: [
      ["Unlimited team members & projects", true],
      ["Dedicated account manager", true],
      ["Custom API access & CAD integrations", true],
      ["Multi-brand white-label setup", true],
      ["SLA & 99.9% uptime guarantees", true],
      ["On-site training sessions", true],
      ["Custom feature development", true],
      ["All Expert Pro features included", true],
    ],
    cta: "Contact Sales",
    ctaHref: "/contact",
    cardBg: "bg-white",
    border: "border-amber-300",
    ctaClass: "bg-amber-400 text-slate-950 font-bold hover:bg-amber-300",
    pkg: null,
    subPlan: false,
  },
];

/* ─── FAQ Items ─── */
const FAQS = [
  {
    q: "What is included in the Vastu analysis plans?",
    a: "Plans include full access to 16-zone floor plan alignment, 8 direction sectoring, Marma point vulnerability detection, object compliance tracking, and downloadable PDF reports.",
  },
  {
    q: "What is the difference between Credit Plans and Expert Subscriptions?",
    a: "Credit Plans are one-time per-project purchases that never expire, perfect for homeowners and individual projects. Expert Subscriptions offer monthly recurring project allowances or unlimited access for professional astrologers, architects, and Vastu consultants.",
  },
  {
    q: "Do purchased project credits expire?",
    a: "No, project credits purchased via Pay-As-You-Go plans never expire. You can use them whenever you need to analyze a new floor plan.",
  },
  {
    q: "Are payment transactions secure?",
    a: "All transactions are processed through Razorpay, a PCI-DSS Level 1 compliant secure payment gateway supporting UPI, NetBanking, Debit/Credit Cards, and Wallets.",
  },
];

/* ─── Main Component ─── */
export default function PricingClient({
  subscriptions,
  hasActiveSubscription,
  userCredits,
  userEmail,
}: PricingClientProps) {
  const [leftIdx, setLeftIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"credits" | "subscriptions" | "faqs">("credits");

  const rightScrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isAstrologer = user?.role === "astrologer" || user?.role === "admin";
  const isSubscribed = hasActiveSubscription;

  /* ─── Auto-cycle features on left side ─── */
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setLeftIdx((prev) => (prev + 1) % FEATURES.length);
    }, 6000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const handleNextFeature = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setLeftIdx((prev) => (prev + 1) % FEATURES.length);
  };

  const handlePrevFeature = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setLeftIdx((prev) => (prev - 1 + FEATURES.length) % FEATURES.length);
  };

  /* ─── Scroll jump handler for right side tabs ─── */
  const scrollToSection = (sectionId: string, tab: "credits" | "subscriptions" | "faqs") => {
    setActiveTab(tab);
    const element = document.getElementById(sectionId);
    if (element && rightScrollRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /* ─── Payment handler ─── */
  const handlePurchase = async (type: "credits" | "subscription", packageId: string) => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type === "credits" ? { packageId } : { planId: packageId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create order");
      }
      const { orderId, amount, currency } = await res.json();
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Razorpay SDK failed to load");
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Mangalam Vastu",
        description: type === "credits" ? "Purchase Vastu Analysis Plan" : "Astrologer Subscription",
        order_id: orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const v = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!v.ok) throw new Error("Verification failed");
            window.location.reload();
          } catch {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: { name: user?.name || "", email: userEmail || user?.email || "" },
        theme: { color: "#004b6e" },
      };
      const rzp = new (window as unknown as { Razorpay: new (o: Record<string, unknown>) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const feat = FEATURES[leftIdx];
  const FeatIcon = feat.icon;

  /* ─── Lock body overflow while on this full-viewport split page ─── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const footer = document.querySelector("footer") as HTMLElement | null;
    if (footer) footer.style.display = "none";
    return () => {
      document.body.style.overflow = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  return (
    <>
      {/* Feature detail modal — light popup on dark left */}
      <AnimatePresence>
        {modalOpen && feat.cases && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#faf3e8] text-[#1c2333] rounded-[2rem] overflow-hidden shadow-2xl border border-amber-300/40"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    Who It&apos;s For
                  </span>
                  <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-full hover:bg-black/10 transition-colors">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-4">
                  {feat.cases?.map((c) => (
                    <div key={c.title} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/5 shadow-sm">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                        <c.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-primary mb-1">{c.title}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FULL-VIEWPORT SPLIT LAYOUT ─── */}
      <div
        className="fixed inset-0 flex overflow-hidden"
        style={{ top: 72 }} /* below navbar */
      >
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-50 border border-red-300 text-red-700 rounded-2xl text-sm shadow-lg flex items-center gap-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            LEFT PANEL — dark — features showcase as it is
        ══════════════════════════════════════════════════ */}
        <div className="w-1/2 h-full bg-[#0d1b2a] relative overflow-hidden flex flex-col select-none">
          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,168,83,0.14) 0%, transparent 70%)", filter: "blur(80px)" }}
            />
            <div
              className="absolute -bottom-40 right-0 w-[400px] h-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(128,208,199,0.08) 0%, transparent 70%)", filter: "blur(80px)" }}
            />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />
          </div>

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-10 pt-8 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/10 backdrop-blur p-1.5 rounded-xl border border-white/10">
                <img src="/manglam_plus.png" alt="Manglam+" className="h-6 w-auto object-contain" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Platform Features</span>
            </div>

            {/* Dot nav for 7 features */}
            <div className="flex items-center gap-2">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
                    setLeftIdx(i);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === leftIdx ? "w-6 h-2 bg-amber-400" : "w-2 h-2 bg-white/20 hover:bg-white/50"
                  }`}
                  title={`Feature ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-10 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={leftIdx}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 backdrop-blur">
                  <FeatIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">{feat.eyebrow}</span>
                </div>

                {/* Heading */}
                <div>
                  <h2
                    className="font-bold italic leading-[1.05] text-white"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "clamp(2.4rem, 4.2vw, 3.6rem)" }}
                  >
                    {feat.title[0]}
                    <br />
                    <span className="text-gold-shimmer">{feat.title[1]}</span>
                  </h2>
                  <p className="text-amber-300/70 text-xs font-semibold uppercase tracking-widest mt-2">{feat.accent}</p>
                </div>

                {/* Body */}
                <p className="text-gray-300 text-sm leading-[1.8] max-w-[480px]">{feat.body}</p>

                {/* Badge */}
                {feat.badge && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Available in:</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">{feat.badge}</span>
                  </div>
                )}

                {/* Stats grid — hero slide only */}
                {feat.stats && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {feat.stats.map((s) => (
                      <div key={s.l} className="p-4 rounded-2xl bg-white/5 border border-white/8 text-center backdrop-blur-sm">
                        <div className="text-2xl font-extrabold text-amber-300">{s.v}</div>
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mt-1">{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Use cases — last feature slide */}
                {feat.cases && (
                  <div className="space-y-2.5 pt-1">
                    {feat.cases.map((c) => (
                      <div
                        key={c.title}
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/10 cursor-pointer transition-colors group"
                      >
                        <div className="p-2 bg-amber-400/10 text-amber-300 rounded-xl shrink-0 group-hover:bg-amber-400/20 transition-colors">
                          <c.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-white flex items-center justify-between">
                            <span>{c.title}</span>
                            <span className="text-[10px] text-amber-300 font-normal underline opacity-0 group-hover:opacity-100 transition-opacity">
                              View details →
                            </span>
                          </h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Bar Controls */}
          <div className="relative z-10 flex items-center justify-between px-10 py-5 border-t border-white/8">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevFeature}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Previous feature"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={handleNextFeature}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Next feature"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
              <span className="text-xs text-white/40 ml-2">
                {leftIdx + 1} / {FEATURES.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-1.5 w-36 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${((leftIdx + 1) / FEATURES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-px shrink-0 bg-gradient-to-b from-[#0d1b2a] via-amber-400/30 to-[#faf8f4]" />

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL — vertical scrolling showing all pricing
        ══════════════════════════════════════════════════ */}
        <div className="w-1/2 h-full bg-[#faf8f4] relative overflow-hidden flex flex-col">
          {/* Ambient Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute -top-24 right-0 w-96 h-96 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,168,83,0.10) 0%, transparent 70%)", filter: "blur(60px)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-72 h-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(128,208,199,0.08) 0%, transparent 70%)", filter: "blur(60px)" }}
            />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "radial-gradient(circle, rgba(19,84,122,1) 1px, transparent 1px)", backgroundSize: "36px 36px" }}
            />
          </div>

          {/* Sticky Top Header Bar */}
          <div className="relative z-20 flex items-center justify-between px-8 py-5 bg-[#faf8f4]/90 backdrop-blur-md border-b border-black/5 shrink-0">
            <div className="flex items-center gap-2">
              {isLoggedIn && userCredits > 0 && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <CreditCard className="w-3.5 h-3.5" />
                  {userCredits} Credits Available
                </div>
              )}
              {isSubscribed && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  Active Membership
                </div>
              )}
              {!isLoggedIn && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full text-xs text-emerald-800 font-medium">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  5 Free Credits for New Users
                </div>
              )}
            </div>

            {/* Quick-Jump Tabs */}
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full text-xs font-semibold">
              <button
                onClick={() => scrollToSection("sec-credits", "credits")}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeTab === "credits" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-primary"
                }`}
              >
                Credit Plans
              </button>
              <button
                onClick={() => scrollToSection("sec-subscriptions", "subscriptions")}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeTab === "subscriptions" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-primary"
                }`}
              >
                Expert Memberships
              </button>
              <button
                onClick={() => scrollToSection("sec-faqs", "faqs")}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeTab === "faqs" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-primary"
                }`}
              >
                FAQs
              </button>
            </div>
          </div>

          {/* Vertical Scroll Area showing ALL pricing options */}
          <div
            ref={rightScrollRef}
            className="relative z-10 flex-1 overflow-y-auto px-8 py-8 space-y-12 scroll-smooth"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0,75,110,0.3) transparent",
            }}
          >
            {/* ══════════════════════════════════════════════════
                SECTION 1: PAY-AS-YOU-GO CREDIT PLANS
            ══════════════════════════════════════════════════ */}
            <section id="sec-credits" className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/8 text-primary mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pay-As-You-Go</span>
                </div>
                <h2
                  className="text-3xl font-bold italic text-primary leading-tight"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  Per-Project Credit Plans
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-lg">
                  Buy project credits as you need them. No recurring charges. Credits never expire. Perfect for homeowners and project spot-checks.
                </p>
              </div>

              <div className="space-y-5">
                {CREDIT_PLANS.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-[2rem] border-2 p-7 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${p.cardBg} ${p.border}`}
                  >
                    {p.popular && (
                      <div className="absolute top-0 right-0 text-slate-950 font-extrabold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl bg-gradient-to-l from-amber-400 to-yellow-500 shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-950" />
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2 ${p.labelBg}`}>
                          {p.label}
                        </span>
                        <h3
                          className="text-2xl font-bold italic text-primary leading-none"
                          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                        >
                          {p.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{p.sub}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-primary leading-none">{p.price}</div>
                        <div className="text-[10px] text-gray-400 mt-1 font-medium">{p.note}</div>
                      </div>
                    </div>

                    {/* Features checklist grid */}
                    <div className="grid grid-cols-2 gap-2 my-5 pt-3 border-t border-black/5">
                      {(p.features as [string, boolean][]).map(([text, inc], i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-xs font-medium ${
                            inc ? "text-gray-700" : "text-gray-300"
                          }`}
                        >
                          {inc ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          )}
                          <span className={inc ? "" : "line-through decoration-gray-200"}>{text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    {p.ctaHref ? (
                      <Link
                        href={p.ctaHref}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] ${p.ctaClass}`}
                      >
                        {p.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : p.pkg ? (
                      isLoggedIn ? (
                        <button
                          onClick={() => handlePurchase("credits", p.pkg!)}
                          disabled={loading}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] disabled:opacity-50 ${p.ctaClass}`}
                        >
                          {loading ? (
                            "Processing Order..."
                          ) : (
                            <>
                              {p.cta} <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href="/login?redirect=/pricing"
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] ${p.ctaClass}`}
                        >
                          Login to Purchase · {p.price} <ArrowRight className="w-4 h-4" />
                        </Link>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            {/* Banner Divider */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1b2a] via-[#1c2333] to-[#004b6e] text-white shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Consultant Membership</span>
                <h4 className="text-lg font-bold">Practicing Vastu professionally?</h4>
                <p className="text-xs text-gray-300 max-w-sm">Get unlimited monthly project allowances with white-label PDF report exporting and client portal access.</p>
              </div>
              <button
                onClick={() => scrollToSection("sec-subscriptions", "subscriptions")}
                className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs whitespace-nowrap hover:bg-amber-300 transition-colors shadow"
              >
                View Memberships ↓
              </button>
            </div>

            {/* ══════════════════════════════════════════════════
                SECTION 2: EXPERT MONTHLY SUBSCRIPTION MEMBERSHIPS
            ══════════════════════════════════════════════════ */}
            <section id="sec-subscriptions" className="space-y-6 pt-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-800 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Expert Subscriptions</span>
                </div>
                <h2
                  className="text-3xl font-bold italic text-primary leading-tight"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  Unlimited Monthly Memberships
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-lg">
                  Designed for professional Vastu consultants, architects, and astrologers. Includes white-label PDF reports and client management.
                </p>
              </div>

              <div className="space-y-5">
                {SUBSCRIPTION_PLANS.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-[2rem] border-2 p-7 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${p.cardBg} ${p.border}`}
                  >
                    {p.popular && (
                      <div className="absolute top-0 right-0 text-white font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl bg-gradient-to-l from-[#004b6e] to-[#0e2235] shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Recommended Consultant
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2 ${p.labelBg}`}>
                          {p.label}
                        </span>
                        <h3
                          className="text-2xl font-bold italic text-primary leading-none"
                          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                        >
                          {p.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{p.sub}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-primary leading-none">{p.price}</div>
                        <div className="text-[10px] text-gray-400 mt-1 font-medium">{p.note}</div>
                      </div>
                    </div>

                    {/* Features checklist grid */}
                    <div className="grid grid-cols-2 gap-2 my-5 pt-3 border-t border-black/5">
                      {(p.features as [string, boolean][]).map(([text, inc], i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-xs font-medium ${
                            inc ? "text-gray-700" : "text-gray-300"
                          }`}
                        >
                          {inc ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          )}
                          <span className={inc ? "" : "line-through decoration-gray-200"}>{text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action CTA */}
                    {p.subPlan ? (
                      <Link
                        href={isSubscribed ? "/astrologer/dashboard" : "/astrologer/apply"}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] ${
                          isSubscribed ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : p.ctaClass
                        }`}
                      >
                        {isSubscribed ? (
                          <>
                            <Check className="w-4 h-4" /> Active Membership Dashboard
                          </>
                        ) : (
                          <>
                            {p.cta} <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Link>
                    ) : (
                      <Link
                        href={p.ctaHref || "/contact"}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] ${p.ctaClass}`}
                      >
                        {p.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 3: FREQUENTLY ASKED QUESTIONS
            ══════════════════════════════════════════════════ */}
            <section id="sec-faqs" className="space-y-6 pt-4 pb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-black/5 text-gray-700 mb-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pricing Support</span>
                </div>
                <h2
                  className="text-3xl font-bold italic text-primary leading-tight"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  Frequently Asked Questions
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Have questions about credit packages, GST invoicing, or subscription tiers?
                </p>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-black/8 bg-white overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-sm text-primary hover:bg-slate-50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-gray-400"}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-black/5 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Need help footer card */}
              <div className="p-6 rounded-2xl bg-white border border-black/8 text-center space-y-2">
                <h4 className="text-sm font-bold text-primary">Need a custom enterprise quote or help choosing?</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Our team can assist with high-volume project analysis, custom CAD integrations, or team setup.
                </p>
                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#003854] transition-colors"
                  >
                    Contact Support & Sales <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
