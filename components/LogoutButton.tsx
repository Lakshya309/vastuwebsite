"use client";

import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LogoutButton() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { refresh } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await refresh();
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      Logout
    </button>
  );
}
