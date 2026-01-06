export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">AI-Assisted Vastu Analysis</h1>
          <p className="text-xl text-gray-700 mb-8">
            Unlock harmony and prosperity with intelligent Vastu insights and expert human guidance.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">
              Login
            </a>
            <a href="/signup" className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg shadow-md hover:bg-indigo-50 transition duration-300">
              Sign Up
            </a>
          </div>
        </section>

        {/* How it works section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <h3 className="text-xl font-bold mb-4">1. Upload Your Floor Plan</h3>
              <p className="text-gray-700">
                Simply upload an image or PDF of your property's floor plan. Our system processes it securely.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <h3 className="text-xl font-bold mb-4">2. AI-Powered Analysis</h3>
              <p className="text-gray-700">
                Our AI analyzes your layout, identifying key Vastu elements and potential areas of concern.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <h3 className="text-xl font-bold mb-4">3. Expert Review & Report</h3>
              <p className="text-gray-700">
                Receive a detailed report with AI insights, reviewed and refined by experienced human astrologers.
              </p>
            </div>
          </div>
        </section>

        {/* Why human astrologers matter section */}
        <section className="bg-emerald-50 p-12 rounded-2xl shadow-sm text-center">
          <h2 className="text-3xl font-semibold mb-6">Why Human Astrologers Matter</h2>
          <p className="text-lg text-emerald-800 max-w-2xl mx-auto">
            While AI provides powerful initial insights, the nuanced wisdom and personalized recommendations of human astrologers are invaluable for a truly comprehensive Vastu analysis. We combine the best of both worlds.
          </p>
        </section>
      </main>
    </div>
  );
}
