export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last Updated:</strong> January 13, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Ratu Sovereign AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our sovereign AI platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Sovereignty</h2>
            <p className="text-gray-700 mb-4">
              <strong>Your Data Stays Yours:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Each organization has its own isolated sovereign AI node</li>
              <li>Your data is stored in your designated namespace</li>
              <li>We never share your data with other organizations</li>
              <li>You can export or delete your data at any time</li>
              <li>On-premise and air-gapped deployment options available</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              <strong>Account Information:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Organization name and contact details</li>
              <li>User email addresses and names</li>
              <li>Billing information (processed securely)</li>
            </ul>
            <p className="text-gray-700 mb-4 mt-4">
              <strong>Usage Data:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Query logs (for your analytics only)</li>
              <li>API usage metrics</li>
              <li>Performance data</li>
              <li>Error logs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Model Training</h2>
            <p className="text-gray-700 mb-4">
              <strong>Model-Off Training Guarantee:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>The base Kimi K2 model is NEVER retrained on your data</li>
              <li>Your knowledge grows only through embeddings (RAG)</li>
              <li>Model integrity is cryptographically verified daily</li>
              <li>All changes are auditable and transparent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Encryption in transit (TLS 1.3)</li>
              <li>Encryption at rest (AES-256)</li>
              <li>Multi-factor authentication</li>
              <li>Role-based access control (RBAC)</li>
              <li>Regular security audits</li>
              <li>SOC 2 Type II compliance (in progress)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your data as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Active account data: Retained while your account is active</li>
              <li>Audit logs: Retained for 7 years for compliance</li>
              <li>Deleted data: Permanently removed within 30 days</li>
              <li>Backups: Retained for 90 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your data at any time</li>
              <li>Export your data in standard formats</li>
              <li>Delete your data and account</li>
              <li>Opt-out of analytics</li>
              <li>Request data portability</li>
              <li>Lodge a complaint with supervisory authorities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. GDPR Compliance</h2>
            <p className="text-gray-700 mb-4">
              For EU users, we comply with GDPR:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Data processing agreements available</li>
              <li>EU data residency options</li>
              <li>Right to be forgotten</li>
              <li>Data portability</li>
              <li>Consent management</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li><strong>Email:</strong> privacy@ratu.ai</li>
              <li><strong>Address:</strong> Ratu AI, Inc., [Address]</li>
              <li><strong>DPO:</strong> dpo@ratu.ai</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}