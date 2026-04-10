"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CreditCard } from "lucide-react";

interface PaywallGuardProps {
  children: React.ReactNode;
  requiresPayment?: boolean;
  fallback?: React.ReactNode;
}

interface UserAccess {
  hasAccess: boolean;
  credits: number;
  hasSubscription: boolean;
  role: string;
}

export function PaywallGuard({ children, requiresPayment = true, fallback }: PaywallGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUserAccess({
          hasAccess: data.profile?.has_active_subscription || (data.profile?.credits ?? 0) > 0 || data.profile?.role === "astrologer" || data.profile?.role === "admin",
          credits: data.profile?.credits ?? 0,
          hasSubscription: data.profile?.has_active_subscription ?? false,
          role: data.profile?.role ?? "user",
        });
      } catch (error) {
        console.error("Error checking access:", error);
        setUserAccess({ hasAccess: false, credits: 0, hasSubscription: false, role: "user" });
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!requiresPayment) {
    return <>{children}</>;
  }

  if (userAccess?.hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Required</h2>
        <p className="text-gray-600 mb-6">
          You need credits or an active subscription to access this content.
        </p>
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            View Plans
          </Link>
          <Link
            href="/portal"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export function usePaywall() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) {
          setHasAccess(false);
          return;
        }
        const data = await res.json();
        const access = 
          data.profile?.has_active_subscription || 
          (data.profile?.credits ?? 0) > 0 || 
          data.profile?.role === "astrologer" || 
          data.profile?.role === "admin";
        setHasAccess(access);
      } catch {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  return { hasAccess, loading };
}
