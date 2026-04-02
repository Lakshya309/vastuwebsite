"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LogoutButton from "./LogoutButton";

const Navbar = () => {
  const { user, loading } = useAuth();

  const isAstrologer = user?.profile?.role === 'astrologer';
  const isAdmin = user?.profile?.role === 'admin';
  const isUser = user?.profile?.role === 'user';

  let astrologerAccessMessage = '';
  if (isAstrologer && user?.profile) {
    const now = new Date();
    const validFrom = user.profile.valid_from ? new Date(user.profile.valid_from) : null;
    const validTo = user.profile.valid_to ? new Date(user.profile.valid_to) : null;

    if (validFrom && validTo && now >= validFrom && now <= validTo) {
      astrologerAccessMessage = `Valid till ${validTo.toLocaleDateString()} (Unlimited)`;
    } else {
      astrologerAccessMessage = 'Astrologer access expired';
    }
  }

  if (loading) {
    return (
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] glass rounded-2xl border border-white/40 shadow-xl shadow-black/5 w-[90%] max-w-7xl h-16 animate-pulse" />
    );
  }

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] glass rounded-2xl border border-white/40 shadow-xl shadow-black/5 w-[90%] max-w-7xl">
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-serif font-bold italic text-primary flex items-center gap-2">
              Mangalam Vastu 
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/projects"
                  className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Projects
                </Link>
              )}
              {isAstrologer && (
                <Link
                  href="/astrologer/dashboard"
                  className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/10"
                >
                  Expert Dashboard
                </Link>
              )}
              {user && !isAstrologer && !isAdmin && (
                 <Link
                   href="/astrologer/apply"
                   className="text-primary hover:bg-primary/5 px-4 py-2 rounded-xl text-sm font-bold border border-primary/20 transition-all"
                 >
                   Become Expert
                 </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <>
                  <div className="flex flex-col items-end mr-6 text-right">
                    <span className="text-gray-500 text-[11px] font-medium opacity-80">
                      {user.email}
                    </span>
                    {isUser && user.profile?.credits !== undefined && (
                      <span className="text-primary text-[11px] font-bold">
                        Credits: {user.profile.credits}
                      </span>
                    )}
                    {isAstrologer && (
                      <span className={`text-[10px] ${astrologerAccessMessage.includes('expired') ? 'text-red-500' : 'text-green-600'}`}>
                        {astrologerAccessMessage}
                      </span>
                    )}
                  </div>
                  <LogoutButton />
                </>
              ) : (
                <div className="space-x-4 flex items-center">
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-bold transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              className="bg-primary/5 inline-flex items-center justify-center p-2 rounded-xl text-primary hover:bg-primary/10 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-4 6h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
