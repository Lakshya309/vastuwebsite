import Link from "next/link";

const LAST_UPDATED = "April 8, 2026";
const BUSINESS_NAME = "Mangalam Vastu";
const STATE = "[STATE]";
const COUNTRY = "India";

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Last Updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Content */}
        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white space-y-12">
          
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Welcome to {BUSINESS_NAME}. By accessing or using our website and services, you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-gray-600 leading-relaxed">
              These Terms constitute a legally binding agreement between you and {BUSINESS_NAME} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account or using any part of our service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
          </section>

          {/* 2. Use of Service */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              2. Use of Service
            </h2>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">2.1 Permitted Use</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              You may use our Vastu analysis services for personal or professional purposes in accordance with these Terms. Our platform provides AI-assisted Vastu compliance analysis for architectural plans and floor layouts.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-3">2.2 Prohibited Use</h3>
            <p className="text-gray-600 leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li>Use our services for any unlawful purpose or in violation of any local, state, national, or international law</li>
              <li>Attempt to gain unauthorized access to any part of our platform</li>
              <li>Interfere with or disrupt our servers or networks</li>
              <li>Use automated systems to access our platform without permission</li>
              <li>Resell, redistribute, or commercialize our services without authorization</li>
              <li>Upload viruses, malware, or other harmful code</li>
              <li>Harass, abuse, or harm another user</li>
            </ul>
          </section>

          {/* 3. User Account */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              3. User Account Responsibilities
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To access our services, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information during registration</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring your account information is current and accurate</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              You must be at least 18 years of age to create an account. If you are under 18, you may use the services only with parental consent.
            </p>
          </section>

          {/* 4. Credits & Subscriptions */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              4. Credits & Subscriptions
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {BUSINESS_NAME} offers both credit-based and subscription-based access to our services:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-4">
              <li><strong>Credits:</strong> Purchased credits allow you to generate individual Vastu analysis reports. Credits do not expire unless otherwise stated.</li>
              <li><strong>Subscriptions:</strong> Monthly, quarterly, or yearly subscriptions provide unlimited or tiered access to our analysis services during the subscription period.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              All purchases are final and subject to our Refund Policy. Subscription renewals occur automatically unless cancelled before the renewal date.
            </p>
          </section>

          {/* 5. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              All content, features, and functionality of {BUSINESS_NAME}, including but not limited to the website design, text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of {BUSINESS_NAME} and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Your Content:</strong> You retain ownership of any floor plans, designs, or content you upload to our platform. By uploading content, you grant us a limited license to use, store, and process it solely for the purpose of providing our services to you.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Analysis Reports:</strong> The Vastu analysis reports generated through our platform are for your personal reference. Commercial use of generated reports may require additional licensing. Contact us for enterprise or commercial usage permissions.
            </p>
          </section>

          {/* 6. Service Description */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              6. Service Description
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {BUSINESS_NAME} provides AI-assisted Vastu compliance analysis services. Our platform analyzes floor plans and architectural layouts based on principles of Vastu Shastra, an ancient Indian architectural science.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Important Disclaimer:</strong> The analysis provided through our platform is for informational purposes only. It should not be construed as professional Vastu consultation. We recommend consulting with certified Vastu experts for critical decisions. {BUSINESS_NAME} does not guarantee specific outcomes or results from implementing our analysis recommendations.
            </p>
          </section>

          {/* 7. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To the maximum extent permitted by law, {BUSINESS_NAME} and its affiliates, officers, directors, employees, and agents shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Any damages arising from reliance on our analysis or recommendations</li>
              <li>Errors, inaccuracies, or omissions in our analysis</li>
              <li>Unauthorized access to your data or account</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Our total liability for any claim arising from these Terms or your use of our services shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* 8. Account Termination */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              8. Account Termination
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account at any time, with or without notice, if we believe you have violated these Terms or engaged in prohibited conduct.
            </p>
            <p className="text-gray-600 leading-relaxed">
              You may cancel your account at any time by contacting us or using the account deletion feature in your profile settings. Upon termination, your right to use our services immediately ceases, and any unused credits or subscription time may be forfeited in accordance with our Refund Policy.
            </p>
          </section>

          {/* 9. Governing Law */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              9. Governing Law
            </h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of {STATE}, {COUNTRY}. Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the courts located in {STATE}, {COUNTRY}.
            </p>
          </section>

          {/* 10. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on this page with a revised &quot;Last Updated&quot; date.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Your continued use of our services after any changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.
            </p>
          </section>

          {/* 11. Contact Information */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-white/30 rounded-xl p-6 space-y-2">
              <p className="text-gray-700 font-medium">{BUSINESS_NAME}</p>
              <p className="text-gray-600 text-sm">[YOUR BUSINESS ADDRESS]</p>
              <p className="text-gray-600 text-sm">Email: [YOUR SUPPORT EMAIL]</p>
              <p className="text-gray-600 text-sm">Phone: [YOUR PHONE NUMBER]</p>
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
