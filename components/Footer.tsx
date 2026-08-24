import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund" },
  { label: "Shipping Policy", href: "/shipping" },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white/60 backdrop-blur-sm mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Brand */}
          <div>
            <p className="text-lg font-cormorant font-bold italic text-primary">
              Mangalam Vastu
            </p>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
              AI-Assisted Vastu Analysis
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12px] text-gray-500 hover:text-primary font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
          <p>© {new Date().getFullYear()} Mangalam Vastu. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Support:</span>
            <a
              href="mailto:Manglamvastu.lfe@gmail.com"
              className="text-primary hover:underline font-medium"
            >
              Manglamvastu.lfe@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span>Payments secured by</span>
            <span className="font-bold text-gray-600">Razorpay</span>
            <span className="text-gray-300">|</span>
            <span>PCI-DSS Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
