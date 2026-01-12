"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useAuthStore } from "../lib/store/authStore";
import { getAuthenticatedSupabaseClient } from "../lib/supabase";

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  loading: true,
});

export const useSupabase = () => useContext(SupabaseContext);

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const { idToken, loading: authLoading } = useAuthStore();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (idToken) {
      const client = getAuthenticatedSupabaseClient(idToken);
      setSupabaseClient(client);
      setLoading(false);
    } else {
      // If no idToken, clear the client.
      // For unauthenticated access, components can directly use publicSupabase if needed.
      setSupabaseClient(null);
      setLoading(false);
    }
  }, [idToken, authLoading]);

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}
