"use client";

import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../lib/store/authStore";
import Navbar from "./Navbaar";

interface AuthContextProviderProps {
  children: React.ReactNode;
}

export default function AuthContextProvider({ children }: AuthContextProviderProps) {
  const { setUser, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-900">Loading application...</div>;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
