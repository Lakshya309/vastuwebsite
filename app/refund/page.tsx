import Link from "next/link";
import { RefreshCw, CreditCard, Clock, XCircle, CheckCircle, AlertCircle } from "lucide-react";

const LAST_UPDATED = "July 15, 2026";
const BUSINESS_NAME = "Mangalam Vastu";
const REFUND_WINDOW = "7 days";
const PROCESSING_TIME = "5-7 business days";

export default function RefundPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-cormorant font-bold italic text-primary mb-4">
            Refund & Cancellation Policy
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Last Updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="glass p-6 rounded-2xl border border-white text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Refund Window
            </h3>
            <p className="text-2xl font-bold text-primary">{REFUND_WINDOW}</p>
            <p className="text-gray-400 text-xs mt-1">From purchase date</p>
          </div>

          <div className="glass p-6 rounded-2xl border border-white text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Processing Time
            </h3>
            <p className="text-2xl font-bold text-primary">{PROCESSING_TIME}</p>
            <p className="text-gray-400 text-xs mt-1">After approval</p>
          </div>

          <div className="glass p-6 rounded-2xl border border-white text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Refund Method
            </h3>
            <p className="text-lg font-bold text-primary">Original Source</p>
            <p className="text-gray-400 text-xs mt-1">Same as payment</p>
          </div>
        </div>

        {/* Content */}
        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white space-y-12">
          
          {/* 1. Cancellation Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-cormorant font-bold italic text-primary">
                1. Cancellation Policy
              </h2>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-3">1.1 Subscription Cancellations</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              You may cancel your {BUSINESS_NAME} subscription at any time through your account settings or by contacting our support team. Upon cancellation:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-4">
              <li>Your subscription will remain active until the end of the current billing period</li>
              <li>No further charges will be made after cancellation</li>
              <li>You will retain access to subscription features until expiration</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">1.2 Credit Purchases</h3>
            <p className="text-gray-600 leading-relaxed">
              Purchased credits are immediately added to your account and cannot be cancelled once the purchase is completed. Credits do not expire unless otherwise specified at the time of purchase.
            </p>
          </section>

          {/* 2. Refund Eligibility */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-cormorant font-bold italic text-primary">
                2. Refund Eligibility
              </h2>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-3">2.1 Eligible for Refund</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              You may request a refund within <strong>{REFUND_WINDOW}</strong> of your purchase date if:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-6">
              <li>You experienced technical issues that prevented you from using the service</li>
              <li>You were charged incorrectly or duplicate charges were made</li>
              <li>The service was not available as described</li>
              <li>You have not used any credits or analysis services</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">2.2 Non-Refundable Items</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              The following are <strong>NON-REFUNDABLE</strong> under any circumstances:
            </p>
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Astrologer / Expert Access</p>
                  <p className="text-sm text-gray-500">Once expert status is activated or the validity period has commenced, astrologer/expert access is non-refundable.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Used Credits</p>
                  <p className="text-sm text-gray-500">Credits that have been redeemed or used to generate analysis reports are non-refundable.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Completed Analyses</p>
                  <p className="text-sm text-gray-500">Once a Vastu analysis has been generated and delivered, the service is considered complete and non-refundable.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Used Subscription Period</p>
                  <p className="text-sm text-gray-500">If you have accessed and used subscription services during any portion of the billing period, that portion is non-refundable.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Failed or Incomplete Attempts</p>
                  <p className="text-sm text-gray-500">If you were unable to complete an analysis due to errors in your uploaded floor plan or incorrect data entry, credits used are non-refundable.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Refund Process */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-cormorant font-bold italic text-primary">
                3. Refund Process
              </h2>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-3">3.1 How to Request a Refund</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              To request a refund, please contact our support team within {REFUND_WINDOW} of your purchase:
            </p>
            <div className="bg-white/30 rounded-xl p-6 space-y-2 mb-6">
              <p className="text-gray-700 font-medium">{BUSINESS_NAME} Support</p>
              <p className="text-gray-600 text-sm">Email: <a href="mailto:Manglamvastu.lfe@gmail.com" className="text-primary hover:underline">Manglamvastu.lfe@gmail.com</a></p>
              <p className="text-gray-400 text-xs mt-1">Please include your order/transaction ID and reason for refund request.</p>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your refund request should include:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-6">
              <li>Your registered email address</li>
              <li>Order number or transaction ID</li>
              <li>Date of purchase</li>
              <li>Reason for the refund request</li>
              <li>Any supporting documentation (if applicable)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">3.2 Refund Review</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Once we receive your refund request, we will:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4 mb-6">
              <li>Review your request within 2-3 business days</li>
              <li>Verify your eligibility based on the criteria above</li>
              <li>Email you regarding the decision</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">3.3 Refund Timeline</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Approved refunds will be processed within <strong>{PROCESSING_TIME}</strong>. The refund will be credited to your original payment source:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li><strong>Credit/Debit Card:</strong> Refund will appear in 5-7 business days</li>
              <li><strong>UPI:</strong> Refund will be credited within 1-3 business days</li>
              <li><strong>Net Banking:</strong> Refund will be processed within 5-7 business days</li>
            </ul>
            <p className="text-gray-500 text-sm mt-4 italic">
              Note: The refund timeline depends on your bank or payment provider. {BUSINESS_NAME} is not responsible for delays caused by third-party payment processors.
            </p>
          </section>

          {/* 4. Partial Refunds */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              4. Partial Refunds
            </h2>
            <p className="text-gray-600 leading-relaxed">
              In cases where partial services have been used (e.g., some credits redeemed, partial subscription period used), refunds may be calculated on a pro-rated basis, considering the unused portion of the service. The final refund amount, if any, will be determined at our discretion.
            </p>
          </section>

          {/* 5. Chargebacks */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              5. Chargebacks
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you initiate a chargeback with your bank or payment provider without first contacting us for a refund, we reserve the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 ml-4">
              <li>Suspend or terminate your account</li>
              <li>Deduct any outstanding balance from refund amounts</li>
              <li>Recover related costs and fees</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Important:</strong> Please contact us before filing a chargeback. Most issues can be resolved directly. Chargebacks without prior contact may result in account suspension.
            </p>
          </section>

          {/* 6. Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              6. Dispute Resolution
            </h2>
            <p className="text-gray-600 leading-relaxed">
              If you disagree with a refund decision, you may escalate the matter by providing additional information to support your request. We will review escalated disputes within 7 business days. Our decision regarding refunds is final.
            </p>
          </section>

          {/* 7. Contact */}
          <section>
            <h2 className="text-2xl font-cormorant font-bold italic text-primary mb-4">
              7. Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For any questions regarding our Refund & Cancellation Policy, please contact us:
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
