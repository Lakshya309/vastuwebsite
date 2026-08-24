import Link from "next/link";
import { Mail, MapPin, Clock, MessageCircle } from "lucide-react";

const CONTACT_INFO = {
  businessName: "Mangalam Vastu",
  address: "India",
  email: "Manglamvastu.lfe@gmail.com",
  hours: "Monday - Saturday: 9:00 AM - 6:00 PM IST",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary mb-4">
            Contact Us
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">
            We&apos;re Here to Help
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Address */}
          <div className="glass p-8 rounded-[2rem] border border-white">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-cormorant font-bold italic text-primary mb-2">
              Office Address
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {CONTACT_INFO.businessName}<br />
              {CONTACT_INFO.address}
            </p>
          </div>

          {/* Email */}
          <div className="glass p-8 rounded-[2rem] border border-white">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-cormorant font-bold italic text-primary mb-2">
              Email Support
            </h3>
            <a 
              href={`mailto:${CONTACT_INFO.email}`}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              {CONTACT_INFO.email}
            </a>
            <p className="text-gray-400 text-sm mt-2">
              We respond within 24-48 hours
            </p>
          </div>

          {/* Email Support */}
          <div className="glass p-8 rounded-[2rem] border border-white">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-cormorant font-bold italic text-primary mb-2">
              Email Support
            </h3>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="text-primary hover:underline font-medium break-all"
            >
              {CONTACT_INFO.email}
            </a>
            <p className="text-gray-400 text-sm mt-2">
              We respond within 24–48 hours
            </p>
          </div>

          {/* Business Hours */}
          <div className="glass p-8 rounded-[2rem] border border-white">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-cormorant font-bold italic text-primary mb-2">
              Business Hours
            </h3>
            <p className="text-gray-600">
              {CONTACT_INFO.hours}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Closed on Sundays & Public Holidays
            </p>
          </div>
        </div>

        {/* Quick Contact Form */}
        <div className="glass p-10 rounded-[2.5rem] border border-white">
          <div className="flex items-center gap-4 mb-8">
            <MessageCircle className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-cormorant font-bold italic text-primary">
                Send us a Message
              </h2>
              <p className="text-gray-400 text-sm">
                For general inquiries only. For support, email us directly.
              </p>
            </div>
          </div>
          
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-white/50 border border-white rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-5 py-4 bg-white/50 border border-white rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Subject
              </label>
              <select className="w-full px-5 py-4 bg-white/50 border border-white rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm text-gray-600">
                <option>General Inquiry</option>
                <option>Partnership</option>
                <option>Expert/Astrologer Registration</option>
                <option>Technical Support</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Message
              </label>
              <textarea
                rows={5}
                className="w-full px-5 py-4 bg-white/50 border border-white rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm resize-none"
                placeholder="How can we help you?"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="text-gray-400 hover:text-primary text-sm font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
