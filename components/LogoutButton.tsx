"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps = {}) {
  const router = useRouter();
  const { refresh } = useAuth();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    await refresh();
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/70 border border-transparent hover:border-gray-200/60 transition-all duration-200"
      }
      style={{
        fontFamily: "var(--font-outfit), system-ui, sans-serif",
        fontSize: "0.72rem",
        fontWeight: 500,
        letterSpacing: "0.05em",
      }}
    >
      <LogOut className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
      Sign out
    </button>
  );
}

