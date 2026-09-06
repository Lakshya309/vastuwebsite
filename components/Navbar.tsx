"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LogoutButton from "./LogoutButton";
import { ChevronDown, Menu, X, Sparkles, User as UserIcon } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [legalDropdownOpen, setLegalDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection for navbar depth effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const isAstrologer = user?.role === 'astrologer' || user?.profile?.role === 'astrologer';
  const isAdmin = user?.role === 'admin' || user?.profile?.role === 'admin';
  const isUser = !isAstrologer && !isAdmin;

  let astrologerAccessMessage = '';
  if (isAstrologer && user?.profile) {
    const now = new Date();
    const validFrom = user.profile.valid_from ? new Date(user.profile.valid_from) : null;
    const validTo = user.profile.valid_to ? new Date(user.profile.valid_to) : null;

    if (validFrom && validTo && now >= validFrom && now <= validTo) {
      astrologerAccessMessage = `Valid till ${validTo.toLocaleDateString()}`;
    } else {
      astrologerAccessMessage = 'Access expired';
    }
  }

  // Helper for active link styles
  const isHomeActive = pathname === "/";
  const isPricingActive = pathname === "/pricing";
  const isProjectsActive = pathname.startsWith("/projects");
  const isLegalActive = ["/contact", "/terms", "/privacy", "/refund"].includes(pathname);

  if (loading) {
    return (
      <header className="fixed top-4 left-0 right-0 z-[100] px-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-6xl h-[56px] bg-primary/90 rounded-full border border-white/15 shadow-2xl animate-pulse pointer-events-auto" />
      </header>
    );
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-[100] px-3 sm:px-6 flex justify-center pointer-events-none">
      <nav
        className={`pointer-events-auto w-full max-w-6xl transition-all duration-300 rounded-full ${
          scrolled
            ? "bg-[#004b6e]/95 backdrop-blur-2xl border border-white/25 shadow-2xl shadow-primary/40"
            : "bg-[#004b6e]/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-primary/25"
        }`}
      >
        <div className="px-3 sm:px-5 py-2 flex items-center justify-between min-h-[54px]">
          
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="bg-white/10 p-1.5 rounded-full border border-white/20 transition-transform duration-300 group-hover:scale-105 shadow-sm">
              <img
                src="/logo.png"
                alt="Mangalam Vastu"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span
                className="text-base font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                Mangalam Vastu
              </span>
              <span
                className="text-[9px] uppercase font-semibold text-accent-gold tracking-widest mt-0.5"
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              >
                Sacred Intelligence
              </span>
            </div>
          </Link>

          {/* Center Pill Nav Links Container */}
          <div className="hidden md:flex items-center gap-1 bg-black/20 border border-white/15 rounded-full p-1 shadow-inner">
            <Link
              href="/"
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 outline-none focus:outline-none focus:ring-0 ${
                isHomeActive
                  ? "bg-white text-primary shadow-md font-bold"
                  : "text-white/85 hover:text-white hover:bg-white/15"
              }`}
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
            >
              Home
            </Link>

            {/* Manglam+ Badge Link */}
            <Link
              href="/pricing"
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center gap-1 outline-none focus:outline-none focus:ring-0 ${
                isPricingActive
                  ? "bg-white shadow-md font-bold"
                  : "hover:bg-white/15"
              }`}
            >
              <img
                src="/manglam_plus.png"
                alt="Manglam+"
                className={`h-5 w-auto object-contain transition-all ${
                  isPricingActive ? "brightness-0" : ""
                }`}
              />
            </Link>

            {user && (
              <Link
                href="/projects"
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 outline-none focus:outline-none focus:ring-0 ${
                  isProjectsActive
                    ? "bg-white text-primary shadow-md font-bold"
                    : "text-white/85 hover:text-white hover:bg-white/15"
                }`}
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              >
                Projects
              </Link>
            )}

            {/* Legal Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLegalDropdownOpen(!legalDropdownOpen)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1 outline-none ${
                  isLegalActive
                    ? "bg-white text-primary shadow-md font-bold"
                    : "text-white/85 hover:text-white hover:bg-white/15"
                }`}
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              >
                Legal
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 opacity-80 ${
                    legalDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {legalDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-primary-dark border border-white/20 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl">
                  {[
                    { href: "/contact", label: "Contact Us" },
                    { href: "/terms", label: "Terms & Conditions" },
                    { href: "/privacy", label: "Privacy Policy" },
                    { href: "/refund", label: "Refund Policy" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setLegalDropdownOpen(false)}
                      className="block px-4 py-2 text-xs font-medium text-white/85 hover:text-white hover:bg-white/15 transition-colors"
                      style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  pathname.startsWith("/admin")
                    ? "bg-white text-primary shadow-md font-bold"
                    : "text-white/85 hover:text-white hover:bg-white/15"
                }`}
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right Section: CTAs & User Profile */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAstrologer && (
              <Link
                href="/astrologer/dashboard"
                className="bg-accent-gold text-primary hover:bg-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105"
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              >
                Expert Dashboard
              </Link>
            )}

            {user && !isAstrologer && !isAdmin && (
              <Link
                href="/astrologer/apply"
                className="bg-gradient-to-r from-accent-gold via-[#e8b87a] to-accent-gold text-primary hover:opacity-95 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105 flex items-center gap-1.5"
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Become Expert
              </Link>
            )}

            {user ? (
              <div className="bg-black/15 border border-white/20 rounded-full px-3 py-1 text-xs text-white flex items-center gap-2.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-accent-gold opacity-90" />
                  <span className="max-w-[130px] truncate text-[11px] font-medium text-white/95" style={{ fontFamily: "var(--font-outfit)" }}>
                    {user.email}
                  </span>
                </div>

                {isUser && user.profile?.credits !== undefined && (
                  <span
                    className="bg-accent-gold/25 text-accent-gold border border-accent-gold/40 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {user.profile.credits} CR
                  </span>
                )}

                <LogoutButton className="text-white/80 hover:text-white hover:bg-white/15 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all flex items-center gap-1" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold uppercase tracking-wider text-white/85 hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white/15 transition-colors"
                  style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-primary hover:bg-cream px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105"
                  style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <Link
                href="/signup"
                className="bg-accent-gold text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              >
                Join
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="bg-white/10 border border-white/20 inline-flex items-center justify-center p-2 rounded-full text-white hover:bg-white/20 focus:outline-none transition-colors"
            >
              <span className="sr-only">Toggle navigation</span>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/15 mt-1 pt-3 pb-5 px-4 space-y-2 bg-[#004b6e] rounded-b-[2rem]">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-full text-xs font-semibold ${
                isHomeActive ? "bg-white text-primary" : "text-white/85 hover:bg-white/15"
              }`}
            >
              Home
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-full ${
                isPricingActive ? "bg-white text-primary shadow-md" : "hover:bg-white/15"
              }`}
            >
              <img
                src="/manglam_plus.png"
                alt="Manglam+"
                className={`h-5 w-auto object-contain transition-all ${
                  isPricingActive ? "brightness-0" : ""
                }`}
              />
            </Link>

            {user && (
              <Link
                href="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-full text-xs font-semibold ${
                  isProjectsActive ? "bg-white text-primary" : "text-white/85 hover:bg-white/15"
                }`}
              >
                Projects
              </Link>
            )}

            {user && !isAstrologer && !isAdmin && (
              <Link
                href="/astrologer/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 bg-gradient-to-r from-accent-gold to-[#e8b87a] text-primary font-bold rounded-full text-xs uppercase tracking-wider text-center"
              >
                Become Expert
              </Link>
            )}

            <div className="pt-2 border-t border-white/15 space-y-1">
              <div className="px-4 py-1 text-[10px] uppercase font-bold text-accent-gold tracking-widest">
                Legal
              </div>
              {[
                { href: "/contact", label: "Contact Us" },
                { href: "/terms", label: "Terms & Conditions" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/refund", label: "Refund Policy" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/15 rounded-full"
                >
                  {label}
                </Link>
              ))}
            </div>

            {user ? (
              <div className="pt-3 border-t border-white/15 mt-3 flex items-center justify-between px-2">
                <div className="text-xs text-white/90">
                  <p className="font-semibold truncate max-w-[180px]">{user.email}</p>
                  {isUser && (
                    <p className="text-[11px] text-accent-gold font-bold">
                      Credits: {user.profile?.credits ?? 0}
                    </p>
                  )}
                </div>
                <LogoutButton className="text-white/85 hover:text-white bg-white/15 rounded-full px-3 py-1 text-xs font-semibold" />
              </div>
            ) : (
              <div className="pt-3 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-white font-semibold border border-white/20 rounded-full text-xs"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 bg-white text-primary font-bold rounded-full text-xs uppercase tracking-wider"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
