"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LogoutButton from "./LogoutButton";
import { ChevronDown, Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, loading } = useAuth();
  const [legalDropdownOpen, setLegalDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLegalDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          
          <div className="hidden md:block text-center flex-1">
            <div className="flex items-center justify-center space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              {user && (
                <Link
                  href="/projects"
                  className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Projects
                </Link>
              )}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setLegalDropdownOpen(!legalDropdownOpen)}
                  className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 outline-none"
                >
                  Legal
                  <ChevronDown className={`w-4 h-4 transition-transform ${legalDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {legalDropdownOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 glass rounded-xl border border-white shadow-xl py-2 z-50 overflow-hidden">
                    <Link
                      href="/contact"
                      onClick={() => setLegalDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-primary hover:bg-white/50 transition-colors"
                    >
                      Contact Us
                    </Link>
                    <Link
                      href="/terms"
                      onClick={() => setLegalDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-primary hover:bg-white/50 transition-colors"
                    >
                      Terms & Conditions
                    </Link>
                    <Link
                      href="/privacy"
                      onClick={() => setLegalDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-primary hover:bg-white/50 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/refund"
                      onClick={() => setLegalDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-primary hover:bg-white/50 transition-colors"
                    >
                      Refund Policy
                    </Link>
                  </div>
                )}
              </div>
              
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="bg-primary/5 inline-flex items-center justify-center p-2 rounded-xl text-primary hover:bg-primary/10 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-white/20 mt-2 rounded-b-2xl overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-600 hover:text-primary px-3 py-3 rounded-xl text-base font-medium"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-600 hover:text-primary px-3 py-3 rounded-xl text-base font-medium"
            >
              Pricing
            </Link>
            {user && (
              <Link
                href="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-primary px-3 py-3 rounded-xl text-base font-medium"
              >
                Projects
              </Link>
            )}
            
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Legal</div>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-600 text-sm">Contact Us</Link>
              <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-600 text-sm">Terms & Conditions</Link>
              <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-600 text-sm">Privacy Policy</Link>
              <Link href="/refund" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-600 text-sm">Refund Policy</Link>
            </div>

            {user ? (
               <div className="pt-4 border-t border-gray-100 mt-4">
                  <div className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    {isUser && <p className="text-xs text-primary font-bold">Credits: {user.profile?.credits}</p>}
                  </div>
                  <div className="px-3">
                    <LogoutButton />
                  </div>
               </div>
            ) : (
              <div className="pt-4 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-gray-600 font-bold border border-gray-200 rounded-xl"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 bg-primary text-white font-bold rounded-xl"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
