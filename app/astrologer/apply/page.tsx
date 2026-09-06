"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, ClipboardCheck, Clock, CheckCircle2, ChevronRight, History, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { loadRazorpayScript } from "@/lib/razorpay-client";

function AstrologerApplyContent() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "PENDING" | "APPROVED" | "REJECTED">("IDLE");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const { user, loading: authLoading, refresh } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      checkStatus();
    }
  }, [authLoading, user]);

  const checkStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/astrologer/application-status");
      if (res.ok) {
        const data = await res.json();
        if (data.application) {
          setStatus(data.application.status);
        }
      }
    } catch (err: any) {
      console.error("Error checking application status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (targetPlanId: string) => {
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: targetPlanId }),
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
        description: "Expert Subscription Plan",
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

            await refresh();
            router.push("/astrologer/dashboard");
          } catch (err: any) {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      router.push(`/signup?role=astrologer${planId ? `&planId=${planId}` : ''}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/astrologer/apply", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit application");
      }

      setStatus("PENDING");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isSubscribed = user?.profile?.has_active_subscription;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-28">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="relative h-40 bg-indigo-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
          </div>
          <div className="relative z-10 text-center text-white">
            <ClipboardCheck size={48} className="mx-auto mb-2" />
            <h1 className="text-3xl font-extrabold tracking-tight">Astrologer Application</h1>
          </div>
        </div>

        <div className="p-8 md:p-12">
          {status === "IDLE" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Provide Expert Consultations</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Join our platform as a Vastu expert. Submit your application below for admin review. Once approved, you can activate your Expert Subscription and client dashboard.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                    <User size={20} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">Expert Profile</h3>
                  <p className="text-xs text-gray-500">Get a dedicated workspace for project analysis.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                    <History size={20} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">Unique Code</h3>
                  <p className="text-xs text-gray-500">A personal identifier for client project linking.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">Direct Linking</h3>
                  <p className="text-xs text-gray-500">No manual sharing needed; everything is synced.</p>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <button
                onClick={handleApply}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/20 transition-all group disabled:opacity-50"
              >
                {submitting ? "Submitting..." : user ? "Submit Application" : "Sign Up & Apply"}
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : status === "PENDING" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Clock size={40} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">Application Received</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Your request to become an astrologer is currently under review by our administrative team.
              </p>
              
              {/* Approval Timeline Popup Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-2xl mb-6 text-left shadow-sm">
                <div className="flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-base mb-1">Review & Approval Notice</h4>
                    <p className="text-amber-800 text-sm leading-relaxed">
                      It may take <span className="font-bold underline">5 to 6 business days</span> for your application to be reviewed and approved by our admin team.
                    </p>
                    <p className="text-amber-700 text-xs mt-2">
                      Once your application is approved, you will be able to purchase the Expert Subscription and activate your Vastu Expert dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
                Status: Pending Admin Approval
              </div>
            </motion.div>
          ) : status === "APPROVED" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">Congratulations!</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Your application has been approved by our admin team. You are now authorized to use the Vastu Expert workspace.
              </p>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              {!isSubscribed ? (
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8">
                  <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Activate Expert Subscription</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">
                    Subscribe to the Expert Plan to unlock unlimited analyses and client tools.
                  </p>
                  <button
                    onClick={() => handlePayment(planId || "credits_1rs")}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all group disabled:opacity-50"
                  >
                    {submitting ? "Processing..." : "Subscribe to Expert Plan"}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push("/astrologer/dashboard")}
                  className="flex items-center justify-center gap-2 mx-auto px-8 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all group"
                >
                  Go to Expert Dashboard
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold text-red-600 mb-2">Application Rejected</h2>
              <p className="text-gray-500">Unfortunately, your application was not approved at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AstrologerApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AstrologerApplyContent />
    </Suspense>
  );
}
