"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSession, SessionProvider } from "next-auth/react";

interface UserProfile {
  id: string;
  email: string | null;
  role: string;
  valid_from: string | null;
  valid_to: string | null;
  credits: number;
}

interface User {
  id: string;
  email: string | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (session?.user) {
        // Construct base user from session JWT
        const sessionUser = {
          id: (session.user as any).id,
          email: session.user.email || null,
          role: (session.user as any).role,
        };
        setUser(sessionUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch("/api/auth/user");
      const data = await response.json();
      if (data.user?.profile) {
        setUser((prev) => prev ? { ...prev, profile: data.user.profile } : null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <SessionProvider>
      <AuthContext.Provider value={{ user, loading, refresh: fetchUser, fetchProfile }}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  );
};
