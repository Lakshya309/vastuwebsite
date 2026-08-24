import Link from "next/link";
import { Zap, Clock, ShieldCheck, Globe } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery Policy | Mangalam Vastu",
  description: "Mangalam Vastu delivers digital services instantly. No physical shipping. Learn how your plan or report is delivered.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary mb-4">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Last Updated: July 15, 2026
          </p>
        </div>

        {/* Quick cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="glass p-6 rounded-2xl border border-white text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">Instant Delivery</h3>
            <p className="text-gray-400 text-xs">All services are delivered immediately upon payment confirmation</p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">100% Digital</h3>
            <p className="text-gray-400 text-xs">No physical goods are shipped. All services are online and software-based</p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">Secure Access</h3>
            <p className="text-gray-400 text-xs">Your plan is activated instantly and accessible from your account dashboard</p>
          </div>
        </div>

        {/* Content */}
        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white space-y-10">

          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              1. Nature of Our Services
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Mangalam Vastu is a <strong>100% digital platform</strong>. We do not sell or ship any physical products. All plans, analysis reports, and features are delivered electronically through our website and are accessible immediately after a successful payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              2. Delivery of Digital Services
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Upon successful payment, the following is delivered instantly:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li><strong>Basic / Advanced Plan:</strong> Your account is upgraded immediately. New object categories and increased upload/relocation limits are enabled within seconds of payment verification.</li>
              <li><strong>Vastu Analysis Reports:</strong> Generated in real-time once you submit your floor plan for analysis. Reports are available instantly on screen and can be saved or printed.</li>
              <li><strong>Credits (if applicable):</strong> Credits are added to your account balance immediately after payment confirmation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              3. Delivery Confirmation
            </h2>
            <p className="text-gray-600 leading-relaxed">
              You will receive a payment confirmation email at your registered email address once your transaction is successfully processed. Your upgraded plan status is visible in your account dashboard immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              4. Delays or Access Issues
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              In rare cases, there may be a short delay (up to 15 minutes) in plan activation due to payment gateway processing. If your plan is not activated within 30 minutes of a successful payment:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li>Log out and log back in to refresh your account status</li>
              <li>Clear your browser cache and reload the page</li>
              <li>Contact our support team at <a href="mailto:Manglamvastu.lfe@gmail.com" className="text-primary hover:underline">Manglamvastu.lfe@gmail.com</a> with your transaction ID</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              5. No Physical Shipping
            </h2>
            <p className="text-gray-600 leading-relaxed">
              As all our services are digital in nature, there is no physical shipping, packaging, or courier involved. No shipping charges are ever applied to any purchase on Mangalam Vastu.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              6. Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For any questions about service delivery, please contact us:
            </p>
            <div className="bg-white/30 rounded-xl p-6 space-y-2">
              <p className="text-gray-700 font-medium">Mangalam Vastu</p>
              <p className="text-gray-600 text-sm">India</p>
              <p className="text-gray-600 text-sm">
                Email:{" "}
                <a href="mailto:Manglamvastu.lfe@gmail.com" className="text-primary hover:underline">
                  Manglamvastu.lfe@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Policy links */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link>
          <Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
          <Link href="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
