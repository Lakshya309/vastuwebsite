"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "OAuthAccountNotLinked") {
      setError("This email is registered with Google. Use the 'Sign in with Google' button below.");
    } else if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const redirectTo = searchParams.get("redirectedFrom") || "/projects";
      await signIn("google", { callbackUrl: redirectTo });
    } catch (err: any) {
      setError(err.message || "Failed to initiate login connection.");
      setIsGoogleLoading(false);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const redirectTo = searchParams.get("redirectedFrom") || "/projects";
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error || "Invalid email or password");
      }

      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
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

            <div className="space-y-6">
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-xs font-bold italic text-center"
                >
                  Spectral Error: {error}
                </motion.p>
              )}

              <form onSubmit={handleCredentialsLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-4">
                    Universal Identity (Email)
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-6 py-4 bg-white/50 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm italic placeholder:text-gray-300 shadow-sm"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-4">
                    Access Phrase (Password)
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

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-4 px-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Access Workspace</span>
                  )}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-[9px] font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                className="w-full py-5 bg-white border border-gray-200 text-gray-700 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-4 px-6"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Establishing Linkage...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-10 text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                New seeker?{" "}
                <Link href="/signup" className="text-primary font-bold hover:underline decoration-teal-500 decoration-2 underline-offset-4">
                  Create an Identity
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/50 flex flex-col items-center">
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
