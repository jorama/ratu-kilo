export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              🧠 Ratu Sovereign AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Your Organization's Private AI Node
            </p>
            <p className="text-lg mb-12 max-w-3xl mx-auto text-blue-50">
              Multi-tenant SaaS platform powered by Kimi K2. Each organization gets its own sovereign AI node with private knowledge base, complete data control, and zero vendor lock-in.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
              >
                Start Free Trial
              </a>
              <a
                href="/demo"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-600 transition"
              >
                Watch Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Ratu?
            </h2>
            <p className="text-xl text-gray-600">
              True sovereignty, transparency, and control over your AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔒"
              title="True Sovereignty"
              description="Your data stays yours. Deploy on-premise or air-gapped. Full control, zero vendor lock-in."
            />
            <FeatureCard
              icon="🎯"
              title="Model-Off Training"
              description="Base model never retrained. Knowledge grows only through embeddings. Predictable, auditable, compliant."
            />
            <FeatureCard
              icon="🤝"
              title="Multi-Agent Intelligence"
              description="Council of AI agents deliberate on complex queries. Researcher, analyst, editor, and critic roles."
            />
            <FeatureCard
              icon="📚"
              title="RAG with Citations"
              description="Every answer cites its sources. Track provenance. Verify accuracy. Build trust."
            />
            <FeatureCard
              icon="🌐"
              title="Auto-Discovery"
              description="Crawl websites, parse PDFs, detect changes. Keep knowledge fresh automatically."
            />
            <FeatureCard
              icon="🎤"
              title="Voice Enabled"
              description="Speech-to-text and text-to-speech. Multiple providers. Natural conversations."
            />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Organizations
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by governments, universities, and enterprises
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <UseCaseCard
              title="Government Ministries"
              description="Citizen service chatbots, policy analysis, document management, multi-language support"
              examples={['Ministry of Health', 'Education Department', 'Public Services']}
            />
            <UseCaseCard
              title="Universities"
              description="Research assistant, student support, course recommendations, academic paper analysis"
              examples={['Research Labs', 'Student Services', 'Library Systems']}
            />
            <UseCaseCard
              title="Enterprises"
              description="Internal knowledge base, customer support, compliance monitoring, market analysis"
              examples={['Fortune 500', 'Startups', 'Consulting Firms']}
            />
            <UseCaseCard
              title="Healthcare"
              description="Patient information, medical guidelines, appointment scheduling, health records search"
              examples={['Hospitals', 'Clinics', 'Health Systems']}
            />
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start free, scale as you grow
          </p>
          <a
            href="/pricing"
            className="inline-block px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition"
          >
            View Pricing Plans
          </a>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Build Your Sovereign AI?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join organizations worldwide using Ratu for sovereign AI
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
          >
            Get Started Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Ratu AI</h3>
              <p className="text-sm">Sovereign AI for everyone</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/features" className="hover:text-white">Features</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/careers" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="/security" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2025 Ratu Sovereign AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseCard({ title, description, examples }: { title: string; description: string; examples: string[] }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Perfect for:</p>
        <ul className="space-y-1">
          {examples.map((example, idx) => (
            <li key={idx} className="text-sm text-gray-600 flex items-center">
              <span className="mr-2">✓</span>
              {example}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}