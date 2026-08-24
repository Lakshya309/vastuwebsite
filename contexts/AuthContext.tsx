"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { PlanTier } from "@/lib/planConfig";

export interface UserAccessPermissions {
  userId: string;
  email: string | null;
  plan: PlanTier;
  role: string;
  maxUploads: number;
  maxRelocationsPerObject: number;
  allowedObjects: string[];
  credits: number;
  hasActiveSubscription: boolean;
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    expiresAt: string;
    status: string;
  } | null;
}

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
  plan: PlanTier;
  profile?: UserProfile | null;
}

interface AuthContextType {
  user: User | null;
  access: UserAccessPermissions | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isObjectAllowed: (objectType: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  access: null,
  loading: true,
  refresh: async () => {},
  isObjectAllowed: () => false,
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
  const [access, setAccess] = useState<UserAccessPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const [userRes, accessRes] = await Promise.all([
        fetch("/api/auth/user", { cache: "no-store" }),
        fetch("/api/user/access", { cache: "no-store" }),
      ]);

      const userData = await userRes.json();
      setUser(userData.user);

      if (accessRes.ok) {
        const accessData = await accessRes.json();
        setAccess(accessData.access || null);
      } else {
        setAccess(null);
      }
    } catch (error) {
      console.error("Error fetching user data/access:", error);
      setUser(null);
      setAccess(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const isObjectAllowed = useCallback(
    (objectType: string): boolean => {
      if (!access || !access.allowedObjects) return false;
      return access.allowedObjects.includes(objectType);
    },
    [access]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        access,
        loading,
        refresh: fetchUserData,
        isObjectAllowed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
