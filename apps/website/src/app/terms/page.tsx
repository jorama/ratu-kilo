export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last Updated:</strong> January 13, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing or using Ratu Sovereign AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              Ratu Sovereign AI provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Multi-tenant SaaS platform for sovereign AI nodes</li>
              <li>RAG (Retrieval-Augmented Generation) capabilities</li>
              <li>Multi-agent council system</li>
              <li>Web crawling and document processing</li>
              <li>Voice capabilities (STT/TTS)</li>
              <li>Analytics and monitoring</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your use complies with applicable laws</li>
              <li>The accuracy of information you provide</li>
              <li>Promptly notifying us of any security breaches</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use the Service for illegal purposes</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Reverse engineer or decompile the software</li>
              <li>Use the Service to harm others</li>
              <li>Violate intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Ownership</h2>
            <p className="text-gray-700 mb-4">
              <strong>Your Data is Yours:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You retain all rights to your data</li>
              <li>We do not claim ownership of your content</li>
              <li>You can export your data at any time</li>
              <li>You can delete your data and account</li>
              <li>We will not use your data to train models</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Level Agreement</h2>
            <p className="text-gray-700 mb-4">
              We commit to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>99.9% uptime for paid plans</li>
              <li>Response time &lt; 2s (p95)</li>
              <li>Daily backups</li>
              <li>Security updates within 24 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Payment Terms</h2>
            <p className="text-gray-700 mb-4">
              For paid plans:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Billing is monthly or annual</li>
              <li>Payments are non-refundable</li>
              <li>Prices may change with 30 days notice</li>
              <li>Overages billed at standard rates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-700 mb-4">
              Either party may terminate:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You can cancel anytime from your dashboard</li>
              <li>We may suspend accounts for violations</li>
              <li>30 days notice for termination without cause</li>
              <li>Data export available for 30 days after termination</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RATU AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-700">
              For questions about these Terms:<br />
              <strong>Email:</strong> legal@ratu.ai<br />
              <strong>Address:</strong> Ratu AI, Inc., [Address]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}