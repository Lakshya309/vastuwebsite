"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserProfile {
  id: string;
  email: string | null;
  role: string;
  valid_from: string | null;
  valid_to: string | null;
  credits: number;
  has_active_subscription?: boolean;
}

interface User {
  id: string;
  email: string | null;
  name?: string | null;
  role?: string;
  profile?: UserProfile | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  fetchProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Inner component — must be a child of SessionProvider (in layout.tsx)
function AuthContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loading = status === "loading";

  const user: User | null =
    status === "authenticated" && session?.user
      ? {
          id: (session.user as any).id,
          email: session.user.email ?? null,
          role: (session.user as any).role ?? "user",
          profile: profile ?? undefined,
        }
      : null;

  // Refresh session (calls /api/auth/session internally via NextAuth)
  const refresh = async () => {
    await update();
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch("/api/auth/user");
      const data = await response.json();
      if (data.user?.profile) {
        setProfile(data.user.profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refresh, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <AuthContextInner>{children}</AuthContextInner>;
};
