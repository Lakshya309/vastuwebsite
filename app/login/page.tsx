"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient()
  const { refresh } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      await refresh();
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const redirectTo = searchParams.get('redirectedFrom') || '/projects';
      window.location.href = redirectTo;
    } catch (err: any) {
      setError(err.message);
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
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary leading-tight mb-2">Welcome Back.</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">Access Your Astral Workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
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
                  Access Key
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
                className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Establishing Linkage..." : "Establish Linkage"}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                New to the platform?{" "}
                <a href="/signup" className="text-primary font-bold hover:underline decoration-teal-500 decoration-2 underline-offset-4">
                  Initialize Profile
                </a>
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-white/50 flex flex-col items-center">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Practitioner Access</p>
              <a
                href="/astrologer/apply"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white/70 border border-white text-primary rounded-2xl hover:bg-primary hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg"
              >
                Apply to be an Expert
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
