"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { User, ClipboardCheck, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AstrologerApplyPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "PENDING" | "APPROVED" | "REJECTED">("IDLE");
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setUser(authUser);

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

  const handleApply = async () => {
    if (!user) {
      router.push("/signup?role=astrologer");
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
                Join our platform as a Vastu expert. Once approved, you'll receive a unique code to share with clients, and all their projects will appear on your dedicated dashboard.
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
                {submitting ? "Submitting..." : (user ? "Submit Application" : "Sign Up & Apply")}
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : status === "PENDING" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Clock size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">Application Received</h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Your request to become an astrologer is currently being reviewed by our administrative team.
              </p>
              <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl text-sm font-medium inline-block">
                Status: Under Review
              </div>
            </motion.div>
          ) : status === "APPROVED" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">Congratulations!</h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Your application has been approved. You are now a registered Vastu Expert on our platform.
              </p>
              <button
                onClick={() => router.push("/astrologer/dashboard")}
                className="flex items-center justify-center gap-2 mx-auto px-8 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all group"
              >
                Go to Dashboard
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
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

import { History } from "lucide-react";
