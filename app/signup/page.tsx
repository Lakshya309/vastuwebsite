"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      // Log in automatically after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      await refresh();
      router.push("/projects"); // Redirect to dashboard
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during signup");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0 organic-gradient opacity-80" />
      <div className="fixed inset-0 z-0 bg-white/40" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="glass p-12 md:p-16 rounded-[3rem] border border-white shadow-2xl relative overflow-hidden group">
          {/* Accent Glow */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary leading-tight mb-2">Join Us.</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">Initialize Your Cosmic Journey</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-8">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-4">
                  Universal Identity (Email)
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm italic placeholder:text-gray-300 shadow-sm"
                  placeholder="name@astral.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-4">
                  Define Access Key
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-6 py-4 bg-white/50 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm italic placeholder:text-gray-300 shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-xs font-bold italic ml-4"
                >
                  Spectral Error: {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? "Integrating..." : "Begin Integration"}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline decoration-teal-500 decoration-2 underline-offset-4">
                  Establish Linkage
                </Link>
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-white/50 flex flex-col items-center">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Vastu Professionals</p>
              <a
                href="/astrologer/apply"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white/70 border border-white text-primary rounded-2xl hover:bg-primary hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg"
              >
                Apply for Expert Status
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}