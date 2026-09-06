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
  ArrowRight, ShieldCheck, CheckCircle2, X, ChevronDown,
} from "lucide-react";

/* ─── Types ─── */
interface SubscriptionPlan {
  id: string; name: string; description: string | null;
  price_inr: number; duration_days: number; plan_type: string;
  features: Record<string, unknown> | null;
}
interface PricingClientProps {
  subscriptions: SubscriptionPlan[];
  hasActiveSubscription: boolean | null;
  userCredits: number; userEmail: string | null;
}

/* ─── Feature slides (left / dark panel) ─── */
const FEATURES = [
  {
    id: "intro", eyebrow: "Mangalam Plus",
    title: ["Ancient Vastu", "Wisdom."],
    accent: "High-Fidelity AI Precision",
    body: "India's most advanced architectural Vastu analysis platform. Built on classical Samarangana Sutradhara & Mayamatam texts, powered by modern spatial AI.",
    stats: [{ v: "99.8%", l: "Spatial Accuracy" }, { v: "45", l: "Devta Grids" }, { v: "1,200+", l: "Consultants" }],
    icon: Sparkles, badge: "",
  },
  {
    id: "devta", eyebrow: "Feature 01",
    title: ["45 Devta", "Grid Overlay"],
    accent: "Sacred Spatial Energy Geometry",
    body: "Maps exact energy fields of all 45 internal and external deities across any floor plan. Zones governed by Brahma, Aryama, Vivasvan, Mitra and 41 other sacred entities — with degree-level precision.",
    icon: Compass, badge: "Advanced & Astrologer Plans",
  },
  {
    id: "shakti", eyebrow: "Feature 02",
    title: ["Shakti Chakra", "360° Wheel"],
    accent: "Degree-Level Angular Balancing",
    body: "360-degree rotational grid computing exact directional weightages and elemental imbalances. Calibrates true North offset and live boundary distribution analysis across all 16 directional zones.",
    icon: Layers, badge: "Advanced & Astrologer Plans",
  },
  {
    id: "marma", eyebrow: "Feature 03",
    title: ["Marma Points", "& Vulnerability Nodes"],
    accent: "Critical Structural Intersection",
    body: "Detects Mahamarma and Uparamarma lines across floor plans. Ensures columns, walls, toilets, and heavy equipment avoid vital energy channels mapped across 9 primary Marma nodes per plan.",
    icon: Zap, badge: "Advanced & Astrologer Plans",
  },
  {
    id: "pdf", eyebrow: "Feature 04",
    title: ["Executive", "PDF Reports"],
    accent: "Client-Ready Professional Export",
    body: "Multi-page PDF documents with room-by-room Vastu status, elemental remedies, floor plan overlays, and optional white-label branding. Instant high-resolution export from any completed analysis.",
    icon: Download, badge: "All Paid Plans",
  },
  {
    id: "upload", eyebrow: "Feature 05",
    title: ["Blueprint", "Map Upload"],
    accent: "Instant CAD / Floor Plan Processing",
    body: "Upload architectural floor plan images to calibrate compass headings, set true scale, and snap all 16 Vastu zones over your actual building drawings — PNG, JPG, or blueprint scans.",
    icon: Upload, badge: "Basic · Advanced · Astrologer",
  },
  {
    id: "usecases", eyebrow: "Who It's For",
    title: ["Built for Every", "Stakeholder."],
    accent: "Purpose-built for every role",
    body: "Three distinct user types, each with tailored tooling and workflows designed around how they actually practice Vastu analysis.",
    icon: Home, badge: "",
    cases: [
      { icon: Home, title: "Homeowners", body: "One-time single-property analysis with room-by-room guidance for construction or renovation." },
      { icon: Building2, title: "Architects & Designers", body: "Multi-project workflows with professional blueprint upload and spatial measurement tools." },
      { icon: Star, title: "Astrologers & Consultants", body: "Unlimited analyses with white-label PDF reports and client project management dashboard." },
    ],
  },
];

/* ─── Pricing slides (right / light panel) ─── */
const PLANS = [
  {
    id: "intro_user", type: "intro",
    eyebrow: "Pay-As-You-Go Plans",
    title: ["Per-Project", "Credit Plans."],
    body: "Purchase individual project analysis credits. No recurring charges. Credits never expire. Perfect for homeowners, occasional consultants, and architectural spot-checks.",
    cta: null,
  },
  {
    id: "free", type: "plan",
    label: "FREE TRIAL", labelBg: "bg-emerald-500",
    title: "Free Trial", sub: "5 Credits for new accounts",
    price: "₹0", note: "No credit card required",
    features: [
      ["5 free analysis credits", true], ["Manual canvas drawing", true], ["16 Vastu Zones & 8 Directions", true],
      ["Residential property only", true], ["5 relocations / object", true],
      ["Map / blueprint upload", false], ["45 Devta Grid Overlay", false], ["PDF Report", false],
    ],
    cta: "Start Free", ctaHref: "/projects",
    cardBg: "bg-white", border: "border-emerald-400/40",
    ctaClass: "bg-emerald-500 text-white hover:bg-emerald-600",
    pkg: null, subPlan: false,
  },
  {
    id: "basic", type: "plan",
    label: "BASIC", labelBg: "bg-[#004b6e]",
    title: "Basic Plan", sub: "Single property credit",
    price: "₹1,179", note: "₹999 + 18% GST · one-time",
    features: [
      ["1 comprehensive analysis credit", true], ["Manual canvas & Map upload", true], ["16 Vastu Zones & 8 Directions", true],
      ["Residential property", true], ["5 relocations / object", true],
      ["Basic Summary PDF Report", true], ["45 Devta Grid Overlay", false], ["Shakti Chakra & Marma Points", false],
    ],
    cta: "Buy Basic · ₹1,179", ctaHref: null,
    cardBg: "bg-white", border: "border-primary/20",
    ctaClass: "bg-[#004b6e] text-white hover:bg-[#003854]",
    pkg: "basic_plan", subPlan: false,
  },
  {
    id: "advanced", type: "plan",
    label: "⭐ ADVANCED", labelBg: "bg-gradient-to-r from-amber-500 to-yellow-400",
    title: "Advanced Plan", sub: "Full-precision analysis credit",
    price: "₹2,950", note: "₹2,500 + 18% GST · one-time",
    popular: true,
    features: [
      ["1 advanced precision credit", true], ["Manual canvas & Map upload", true], ["16 Zones + 45 Devta Grid + Shakti Chakra", true],
      ["Residential & Commercial", true], ["5 relocations / object", true],
      ["Full Detailed PDF Report", true], ["Marma Points & Distance Tool", true], ["Wall Color Customization", true],
    ],
    cta: "Buy Advanced · ₹2,950", ctaHref: null,
    cardBg: "bg-amber-50/70", border: "border-amber-400/60",
    ctaClass: "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold hover:from-amber-400 hover:to-yellow-300",
    pkg: "advanced_plan", subPlan: false,
  },
  {
    id: "intro_expert", type: "intro",
    eyebrow: "Expert Subscription Plans",
    title: ["Unlimited Monthly", "Memberships."],
    body: "For professional Vastu consultants, architects, and astrologers. Three subscription tiers designed to match the scale of your practice. All plans include white-label PDF reports and client dashboard.",
    cta: null,
  },
  {
    id: "starter_expert", type: "plan",
    label: "EXPERT STARTER", labelBg: "bg-[#1c2333]",
    title: "Expert Starter", sub: "Growing consultancy practice",
    price: "₹1,999", note: "per month · cancel anytime",
    features: [
      ["20 project analyses / month", true], ["All overlay tools", true], ["White-label PDF reports", true],
      ["Client project management portal", true], ["Expert referral badge", true],
      ["Priority support", true], ["All property types", true], ["Unlimited relocations", true],
    ],
    cta: "Apply as Astrologer", ctaHref: "/astrologer/apply",
    cardBg: "bg-white", border: "border-slate-200",
    ctaClass: "bg-[#1c2333] text-white hover:bg-[#0d1b2a]",
    pkg: null, subPlan: true,
  },
  {
    id: "pro_expert", type: "plan",
    label: "EXPERT PRO", labelBg: "bg-gradient-to-r from-[#004b6e] to-[#0e2235]",
    title: "Expert Pro", sub: "Established consultancy",
    price: "₹3,499", note: "per month · cancel anytime",
    popular: true,
    features: [
      ["Unlimited project analyses", true], ["All overlay tools", true], ["White-label PDF reports", true],
      ["Client project management portal", true], ["Expert referral badge", true],
      ["Priority support & hotline", true], ["All property types", true], ["Unlimited relocations", true],
    ],
    cta: "Apply as Astrologer", ctaHref: "/astrologer/apply",
    cardBg: "bg-white", border: "border-primary/30",
    ctaClass: "bg-gradient-to-r from-[#004b6e] to-[#0e2235] text-white hover:opacity-90",
    pkg: null, subPlan: true,
  },
  {
    id: "enterprise", type: "plan",
    label: "ENTERPRISE", labelBg: "bg-amber-400",
    title: "Enterprise", sub: "Architectural firms & large teams",
    price: "Custom", note: "Contact us for team pricing",
    features: [
      ["Unlimited team members & projects", true], ["Dedicated account manager", true],
      ["Custom API access & integrations", true], ["Multi-brand white-label setup", true],
      ["SLA & uptime guarantees", true], ["On-site training sessions", true],
      ["Custom feature development", true], ["All Expert Pro features", true],
    ],
    cta: "Contact Sales", ctaHref: "/contact",
    cardBg: "bg-amber-50/60", border: "border-amber-400/50",
    ctaClass: "bg-amber-400 text-slate-950 font-extrabold hover:bg-amber-300",
    pkg: null, subPlan: false,
  },
];

/* ─── Main Component ─── */
export default function PricingClient({
  subscriptions, hasActiveSubscription, userCredits, userEmail,
}: PricingClientProps) {
  /* Refs for scroll state (avoids stale closure bug) */
  const phaseRef = useRef<"left" | "right">("left");
  const leftIdxRef = useRef(0);
  const rightIdxRef = useRef(0);
  const isThrottled = useRef(false);

  /* Reactive state for rendering */
  const [phase, setPhase] = useState<"left" | "right">("left");
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isAstrologer = user?.role === "astrologer" || user?.role === "admin";
  const isSubscribed = hasActiveSubscription;

  const astrologerPlanFromDb = subscriptions.find(
    (s) => s.plan_type === "subscription" || s.name.toLowerCase().includes("astrologer")
  );

  const basicPackage = CREDIT_PACKAGES.find((p) => p.id === "basic_plan");
  const advancedPackage = CREDIT_PACKAGES.find((p) => p.id === "advanced_plan");

  /* ─── WHEEL HANDLER — uses refs, throttled to 1 step per 600ms ─── */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isThrottled.current) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      const curPhase = phaseRef.current;
      const curLeft = leftIdxRef.current;
      const curRight = rightIdxRef.current;

      if (curPhase === "left") {
        if (dir > 0) {
          if (curLeft < FEATURES.length - 1) {
            const next = curLeft + 1;
            leftIdxRef.current = next;
            setLeftIdx(next);
          } else {
            phaseRef.current = "right";
            setPhase("right");
          }
        } else {
          if (curLeft > 0) {
            const prev = curLeft - 1;
            leftIdxRef.current = prev;
            setLeftIdx(prev);
          }
        }
      } else {
        if (dir > 0) {
          if (curRight < PLANS.length - 1) {
            const next = curRight + 1;
            rightIdxRef.current = next;
            setRightIdx(next);
          }
        } else {
          if (curRight > 0) {
            const prev = curRight - 1;
            rightIdxRef.current = prev;
            setRightIdx(prev);
          } else {
            phaseRef.current = "left";
            setPhase("left");
          }
        }
      }

      isThrottled.current = true;
      setTimeout(() => { isThrottled.current = false; }, 600);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []); // empty deps — uses refs!

  /* ─── Payment handler ─── */
  const handlePurchase = async (type: "credits" | "subscription", packageId: string) => {
    if (!isLoggedIn) { router.push("/login?redirect=/pricing"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type === "credits" ? { packageId } : { planId: packageId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create order"); }
      const { orderId, amount, currency } = await res.json();
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Razorpay SDK failed to load");
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, currency,
        name: "Mangalam Vastu",
        description: type === "credits" ? "Purchase Vastu Analysis Plan" : "Astrologer Subscription",
        order_id: orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const v = await fetch("/api/payments/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }),
            });
            if (!v.ok) throw new Error("Verification failed");
            window.location.reload();
          } catch { setError("Payment verification failed. Please contact support."); }
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
  const plan = PLANS[rightIdx];
  const FeatIcon = feat.icon;

  /* ─── Hide footer / body scroll while on this page ─── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    // hide footer
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
                    <div key={c.title} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/5">
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-50 border border-red-300 text-red-700 rounded-2xl text-sm shadow-lg">
            {error}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            LEFT PANEL — dark — features — scrolls first
        ══════════════════════════════════════════════════ */}
        <div className="w-1/2 h-full bg-[#0d1b2a] relative overflow-hidden flex flex-col select-none">

          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
            <div className="absolute -bottom-40 right-0 w-[400px] h-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(128,208,199,0.06) 0%, transparent 70%)", filter: "blur(80px)" }} />
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          </div>

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-10 pt-8 pb-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/10 backdrop-blur p-1.5 rounded-xl">
                <img src="/manglam_plus.png" alt="Manglam+" className="h-6 w-auto object-contain" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Features</span>
            </div>
            {/* Dot nav */}
            <div className="flex items-center gap-2">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { phaseRef.current = "left"; leftIdxRef.current = i; setPhase("left"); setLeftIdx(i); }}
                  className={`rounded-full transition-all duration-300 ${i === leftIdx ? "w-6 h-2 bg-amber-400" : "w-2 h-2 bg-white/20 hover:bg-white/50"}`}
                />
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={leftIdx}
                initial={{ opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-7"
              >
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10">
                  <FeatIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">{feat.eyebrow}</span>
                </div>

                {/* Heading */}
                <div>
                  <h2
                    className="font-bold italic leading-[1.0] text-white"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)" }}
                  >
                    {feat.title[0]}
                    <br />
                    <span className="text-gold-shimmer">{feat.title[1]}</span>
                  </h2>
                  <p className="text-amber-300/60 text-xs font-semibold uppercase tracking-widest mt-2">{feat.accent}</p>
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

                {/* Stats grid — hero only */}
                {feat.stats && (
                  <div className="grid grid-cols-3 gap-3">
                    {feat.stats.map((s) => (
                      <div key={s.l} className="p-4 rounded-2xl bg-white/5 border border-white/8 text-center">
                        <div className="text-2xl font-extrabold text-amber-300">{s.v}</div>
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-500 mt-1">{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Use cases — last feature */}
                {feat.cases && (
                  <div className="space-y-3">
                    {feat.cases.map((c) => (
                      <div key={c.title} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8 group">
                        <div className="p-2 bg-amber-400/10 text-amber-300 rounded-xl shrink-0 group-hover:bg-amber-400/20 transition-colors">
                          <c.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{c.title}</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom scroll bar */}
          <div className="relative z-10 flex items-center gap-4 px-10 py-6 border-t border-white/8">
            <ChevronDown className={`w-4 h-4 transition-colors ${phase === "left" ? "text-amber-400 animate-bounce" : "text-white/20"}`} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 flex-1">
              {phase === "left"
                ? leftIdx < FEATURES.length - 1 ? "Scroll to explore features" : "Scroll to see pricing →"
                : "Pricing panel active"}
            </span>
            <div className="h-px flex-1 bg-white/10 rounded overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded transition-all duration-500"
                style={{ width: `${((leftIdx) / (FEATURES.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-px shrink-0 bg-gradient-to-b from-[#0d1b2a] via-amber-400/40 to-[#faf8f4]" />

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL — light — pricing — scrolls second
        ══════════════════════════════════════════════════ */}
        <div className="w-1/2 h-full bg-[#faf8f4] relative overflow-hidden flex flex-col select-none">

          {/* Ambient */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 right-0 w-96 h-96 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,168,83,0.10) 0%, transparent 70%)", filter: "blur(60px)" }} />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(128,208,199,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
            <div className="absolute inset-0 opacity-[0.035]"
              style={{ backgroundImage: "radial-gradient(circle, rgba(19,84,122,1) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          </div>

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-10 pt-8 pb-0">
            <div className="flex items-center gap-2">
              {isLoggedIn && userCredits > 0 && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                  {userCredits} Credits Available
                </div>
              )}
              {!isLoggedIn && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-black/8 rounded-full text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {5} Free Credits for New Users
                </div>
              )}
            </div>
            {/* Dot nav */}
            <div className="flex items-center gap-2">
              {PLANS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { phaseRef.current = "right"; rightIdxRef.current = i; setPhase("right"); setRightIdx(i); }}
                  className={`rounded-full transition-all duration-300 ${i === rightIdx ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-black/10 hover:bg-black/25"}`}
                />
              ))}
            </div>
          </div>

          {/* Main content */}
          <div
            className={`relative z-10 flex-1 flex flex-col justify-center px-10 transition-opacity duration-300 ${phase === "right" ? "opacity-100" : "opacity-40"}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={rightIdx}
                initial={{ opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* ── Intro slides ── */}
                {plan.type === "intro" && (
                  <div className="space-y-7 max-w-[480px]">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/8">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{plan.eyebrow}</span>
                    </div>
                    <h2
                      className="font-bold italic leading-[1.0] text-primary"
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)" }}
                    >
                      {plan.title[0]}
                      <br />
                      <span className="text-[#004b6e]">{plan.title[1]}</span>
                    </h2>
                    <p className="text-gray-600 text-sm leading-[1.8]">{plan.body}</p>
                    <button
                      onClick={() => { phaseRef.current = "right"; const next = rightIdx + 1; rightIdxRef.current = next; setRightIdx(next); }}
                      className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
                    >
                      View Plans <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ── Pricing plan cards ── */}
                {plan.type === "plan" && (() => {
                  const p = plan;
                  return (
                    <div className={`rounded-[2rem] border-2 p-8 relative overflow-hidden shadow-xl ${p.cardBg} ${p.border}`}>
                      {p.popular && (
                        <div className="absolute top-0 right-0 text-slate-950 font-extrabold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl bg-gradient-to-l from-amber-400 to-yellow-500 shadow">
                          Most Popular
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-5">
                        <span className={`text-[10px] font-extrabold text-white uppercase tracking-widest px-3 py-1 rounded-full ${p.labelBg}`}>
                          {p.label}
                        </span>
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-primary leading-none">{p.price}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{p.note}</div>
                        </div>
                      </div>

                      <div className="mb-1">
                        <h3
                          className="text-3xl font-bold italic text-primary leading-none"
                          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                        >
                          {p.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{p.sub}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 my-5">
                        {(p.features as [string, boolean][]).map(([text, inc], i) => (
                          <div key={i} className={`flex items-center gap-1.5 text-[11px] font-medium ${inc ? "text-gray-700" : "text-gray-300"}`}>
                            {inc
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              : <Lock className="w-3 h-3 text-gray-300 shrink-0" />
                            }
                            <span className={inc ? "" : "line-through decoration-gray-200"}>{text}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      {p.ctaHref ? (
                        <Link href={p.ctaHref} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md ${p.ctaClass}`}>
                          {p.cta} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : p.pkg && !p.subPlan ? (
                        isLoggedIn ? (
                          <button
                            onClick={() => handlePurchase("credits", p.pkg!)}
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 ${p.ctaClass}`}
                          >
                            {loading ? "Processing..." : <>{p.cta} <ArrowRight className="w-3.5 h-3.5" /></>}
                          </button>
                        ) : (
                          <Link href="/login" className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md ${p.ctaClass}`}>
                            Login to Purchase <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )
                      ) : p.subPlan ? (
                        <Link
                          href={isAstrologer ? "/astrologer/dashboard" : "/astrologer/apply"}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md ${
                            isSubscribed ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : p.ctaClass
                          }`}
                        >
                          {isSubscribed ? <><Check className="w-3.5 h-3.5" /> Active Plan</> : <>{p.cta} <ArrowRight className="w-3.5 h-3.5" /></>}
                        </Link>
                      ) : (
                        <Link href={p.ctaHref || "/contact"} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md ${p.ctaClass}`}>
                          {p.cta} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom scroll bar */}
          <div className="relative z-10 flex items-center gap-4 px-10 py-6 border-t border-black/5">
            <ChevronDown className={`w-4 h-4 transition-colors ${phase === "right" ? "text-primary animate-bounce" : "text-black/20"}`} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 flex-1">
              {phase === "right"
                ? rightIdx < PLANS.length - 1 ? "Scroll to see more plans" : "All plans explored ✓"
                : "← Scroll features first"}
            </span>
            <div className="h-px flex-1 bg-black/8 rounded overflow-hidden">
              <div
                className="h-full bg-primary rounded transition-all duration-500"
                style={{ width: `${rightIdx > 0 ? (rightIdx / (PLANS.length - 1)) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
