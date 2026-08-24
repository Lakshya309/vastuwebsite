import Link from "next/link";

const LAST_UPDATED = "July 15, 2026";
const BUSINESS_NAME = "Mangalam Vastu";
const RAZORPAY_COMPLIANCE = "Razorpay is a PCI-DSS (Payment Card Industry Data Security Standard) compliant payment gateway.";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Last Updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Content */}
        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white space-y-12">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              {BUSINESS_NAME} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. Please read this Privacy Policy carefully. By using our services, you consent to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              1. Information We Collect
            </h2>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-3">1.1 Personal Information</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may collect the following personal information when you create an account or use our services:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-6">
              <li><strong>Name:</strong> Your full name or display name</li>
              <li><strong>Email Address:</strong> Used for account authentication and communication</li>
              <li><strong>Phone Number:</strong> For account verification and support (optional)</li>
              <li><strong>Password:</strong> Stored securely using hashing; we never store plaintext passwords</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">1.2 Payment Information</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              All payment processing is handled securely through <strong>Razorpay</strong>, our third-party payment processor. {RAZORPAY_COMPLIANCE}
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We do not store your credit card, debit card, or other payment method details on our servers. When you make a purchase:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-6">
              <li>Payment is processed directly by Razorpay</li>
              <li>We receive only transaction confirmation and order details</li>
              <li>Your payment credentials are never stored on our systems</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">1.3 Project & Floor Plan Data</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              When you use our Vastu analysis services, you may upload or create:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li>Floor plan images and architectural drawings</li>
              <li>Plot dimensions and measurements</li>
              <li>Object placement data within your floor plans</li>
              <li>Analysis results and generated reports</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve our Vastu analysis services</li>
              <li><strong>Account Management:</strong> To create and manage your account, process registrations</li>
              <li><strong>Payment Processing:</strong> To process transactions and manage credits/subscriptions</li>
              <li><strong>Communication:</strong> To send service-related notifications, updates, and support responses</li>
              <li><strong>Security:</strong> To detect and prevent fraud, unauthorized access, and abuse</li>
              <li><strong>Analytics:</strong> To understand how users interact with our platform and improve user experience</li>
            </ul>
          </section>

          {/* 3. Data Sharing & Disclosure */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              3. Data Sharing & Disclosure
            </h2>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-3">3.1 Third-Party Service Providers</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We share your information with trusted third-party service providers who assist us in operating our business:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-6">
              <li><strong>Razorpay:</strong> Payment processing (PCI-DSS compliant)</li>
              <li><strong>Supabase:</strong> Authentication and database services</li>
              <li><strong>Cloudflare R2:</strong> Secure file storage for floor plans</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">3.2 Legal Requirements</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may disclose your information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li>Comply with legal obligations</li>
              <li>Protect the rights, property, or safety of {BUSINESS_NAME}, our users, or others</li>
              <li>Prevent or investigate possible wrongdoing</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">3.3 Business Transfers</h3>
            <p className="text-gray-600 leading-relaxed">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in our privacy practices.
            </p>
          </section>

          {/* 4. Data Security */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              4. Data Security
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-6">
              <li><strong>Encryption:</strong> Data in transit is encrypted using TLS/SSL</li>
              <li><strong>Secure Storage:</strong> Files are stored in encrypted cloud storage</li>
              <li><strong>Access Controls:</strong> Strict access controls limit who can view your data</li>
              <li><strong>Password Security:</strong> Passwords are hashed using industry-standard algorithms</li>
              <li><strong>PCI-DSS Compliance:</strong> Payment processing complies with PCI-DSS standards via Razorpay</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* 5. User Rights */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              5. Your Rights
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Data Portability:</strong> Request export of your data in a machine-readable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              To exercise any of these rights, please contact us at <a href="mailto:Manglamvastu.lfe@gmail.com" className="text-primary hover:underline">Manglamvastu.lfe@gmail.com</a>.
            </p>
          </section>

          {/* 6. Cookies & Tracking */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              6. Cookies & Tracking Technologies
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-3">6.1 Essential Cookies</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              These cookies are necessary for the website to function properly. They enable core functionality such as security, session management, and accessibility.
            </p>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">6.2 Analytics Cookies</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may use analytics services to understand how visitors interact with our website. These cookies collect information about page visits, time spent on site, and navigation patterns.
            </p>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">6.3 Managing Cookies</h3>
            <p className="text-gray-600 leading-relaxed">
              You can control cookie preferences through your browser settings. Disabling cookies may affect website functionality.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              7. Data Retention
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. We may retain certain information for longer periods as required by law or for legitimate business purposes, such as legal compliance, security, and fraud prevention. When you delete your account, we will delete your personal information within a reasonable timeframe, except where retention is required by law.
            </p>
          </section>

          {/* 8. Children&apos;s Privacy */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our services are not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If you believe we have collected information from a child under 18, please contact us immediately.
            </p>
          </section>

          {/* 9. Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page with a revised &quot;Last Updated&quot; date.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Your continued use of our services after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              10. Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-white/30 rounded-xl p-6 space-y-2">
              <p className="text-gray-700 font-medium">{BUSINESS_NAME}</p>
              <p className="text-gray-600 text-sm">India</p>
              <p className="text-gray-600 text-sm">Email: <a href="mailto:Manglamvastu.lfe@gmail.com" className="text-primary hover:underline">Manglamvastu.lfe@gmail.com</a></p>
            </div>
          </section>

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
