"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund Policy" },
];

export default function Footer() {
  const pathname = usePathname();

  // Hide on full-screen interactive workspace routes
  if (pathname?.startsWith("/projects/") || pathname === "/portal") {
    return null;
  }

  return (
    <footer className="relative z-10 pt-1 pb-10 px-6 lg:px-24 bg-white/50 backdrop-blur-md mt-auto">
      {/* Top gradient separator */}
      <div
        className="h-px w-full mb-10"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(19,84,122,0.15) 30%, rgba(212,168,83,0.2) 50%, rgba(19,84,122,0.15) 70%, transparent 100%)",
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        {/* Brand block */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <span className="logo-bg transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo.png"
                alt="Mangalam Vastu"
                className="h-9 w-auto object-contain"
              />
            </span>
            <div className="flex flex-col leading-none">
              <span
                className="text-[18px] font-bold text-primary tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                Mangalam Vastu
              </span>
              <span
                className="text-gray-400 mt-[3px]"
                style={{
                  fontFamily: "var(--font-outfit), system-ui, sans-serif",
                  fontSize: "0.62rem",
                  fontWeight: 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Sacred Intelligence
              </span>
            </div>
          </Link>
          <p
            className="text-gray-400 text-[13px] leading-relaxed max-w-xs"
            style={{
              fontFamily: "var(--font-outfit), system-ui, sans-serif",
              fontStyle: "italic",
              letterSpacing: "0.01em",
            }}
          >
            Where ancient precision meets modern intelligence.
          </p>
        </div>

        {/* Right: copyright + links */}
        <div className="flex flex-col md:items-end gap-4">
          <p
            className="text-gray-400"
            style={{
              fontFamily: "var(--font-outfit), system-ui, sans-serif",
              fontSize: "0.68rem",
              fontWeight: 500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            © 2026 Mangalam Vastu
          </p>
          <div className="flex items-center gap-5 flex-wrap">
            {LINKS.map(({ href, label }, i) => (
              <span key={href} className="flex items-center gap-5">
                <Link
                  href={href}
                  className="text-gray-400 hover:text-primary transition-colors duration-200"
                  style={{
                    fontFamily: "var(--font-outfit), system-ui, sans-serif",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </Link>
                {i < LINKS.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-gray-200 flex-shrink-0" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
