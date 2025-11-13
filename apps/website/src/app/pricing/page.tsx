export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your organization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <PricingCard
            name="Free"
            price="$0"
            period="forever"
            description="Perfect for testing"
            features={[
              '1 sovereign node',
              '100 queries/month',
              '1 GB storage',
              'Community support',
              'Basic analytics',
            ]}
            cta="Start Free"
            ctaLink="/signup?plan=free"
          />

          <PricingCard
            name="Starter"
            price="$99"
            period="per month"
            description="For small teams"
            features={[
              '1 sovereign node',
              '10,000 queries/month',
              '10 GB storage',
              'Email support',
              'Advanced analytics',
              'API access',
            ]}
            cta="Start Trial"
            ctaLink="/signup?plan=starter"
            popular
          />

          <PricingCard
            name="Professional"
            price="$499"
            period="per month"
            description="For growing organizations"
            features={[
              '5 sovereign nodes',
              '100,000 queries/month',
              '100 GB storage',
              'Priority support',
              'Custom integrations',
              'SSO (SAML)',
              'Audit logs',
            ]}
            cta="Start Trial"
            ctaLink="/signup?plan=professional"
          />

          <PricingCard
            name="Enterprise"
            price="Custom"
            period="contact us"
            description="For large deployments"
            features={[
              'Unlimited nodes',
              'Unlimited queries',
              'Unlimited storage',
              '24/7 dedicated support',
              'On-premise deployment',
              'Air-gapped option',
              'Custom SLA',
              'Training & onboarding',
            ]}
            cta="Contact Sales"
            ctaLink="/contact?plan=enterprise"
          />
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All plans include:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Model-off training</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Multi-agent council</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Citation tracking</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Auto-discovery</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>Voice capabilities</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600">✓</span>
              <span>99.9% uptime SLA</span>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Need a custom plan?
          </h3>
          <p className="text-gray-600 mb-6">
            We can tailor a solution for your specific needs
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaLink,
  popular,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-8 ${popular ? 'ring-2 ring-purple-600' : ''}`}>
      {popular && (
        <div className="bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600 ml-2">{period}</span>
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <a
        href={ctaLink}
        className={`block w-full text-center px-6 py-3 rounded-lg font-semibold ${
          popular
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {cta}
      </a>
    </div>
  );
}