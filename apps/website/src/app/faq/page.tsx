'use client';

import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What is Ratu Sovereign AI?',
      answer: 'Ratu is a multi-tenant SaaS platform that provides sovereign AI nodes for organizations. Each organization gets its own private AI node with isolated knowledge base, powered by Kimi K2.',
    },
    {
      question: 'What does "sovereign AI" mean?',
      answer: 'Sovereign AI means you have complete control over your AI and data. Your knowledge base is private, the base model is never retrained on your data, and you can deploy on-premise or air-gapped if needed.',
    },
    {
      question: 'How does model-off training work?',
      answer: 'The base Kimi K2 model stays frozen and is never retrained. Your knowledge grows only through embeddings (RAG). This ensures predictable behavior, auditability, and compliance.',
    },
    {
      question: 'Can I deploy Ratu on-premise?',
      answer: 'Yes! Enterprise plans include on-premise deployment options. You can run Ratu in your own data center or even in air-gapped environments.',
    },
    {
      question: 'What is the multi-agent council?',
      answer: 'The council is a system where multiple AI agents (researcher, analyst, editor, critic) deliberate on complex queries. They work together to provide comprehensive, well-reasoned answers.',
    },
    {
      question: 'How does citation tracking work?',
      answer: 'Every answer includes citations in the format [CIT:doc_id:chunk_ix]. You can trace every claim back to its source document and specific chunk, ensuring transparency and verifiability.',
    },
    {
      question: 'What data sources can I connect?',
      answer: 'You can connect websites (with auto-crawling), PDFs, APIs, and more. Our discovery agents automatically detect changes and keep your knowledge base up to date.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. We use encryption in transit (TLS 1.3) and at rest (AES-256), implement RBAC, maintain audit logs, and offer SOC 2 compliance. Your data is isolated in your own namespace.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Absolutely. You can export all your data at any time in standard formats. There is no vendor lock-in.',
    },
    {
      question: 'What is included in the free plan?',
      answer: 'The free plan includes 1 sovereign node, 100 queries/month, 1 GB storage, and community support. Perfect for testing and small projects.',
    },
    {
      question: 'How is pricing calculated?',
      answer: 'Pricing is based on the number of nodes, queries per month, and storage. We offer transparent, predictable pricing with no hidden fees.',
    },
    {
      question: 'Do you offer support?',
      answer: 'Yes! Free plans get community support, paid plans get email support, and Enterprise plans get 24/7 dedicated support with custom SLAs.',
    },
    {
      question: 'Can I integrate Ratu with my existing systems?',
      answer: 'Yes. We provide a comprehensive REST API, WebSocket support, and can build custom integrations for Enterprise customers.',
    },
    {
      question: 'What languages are supported?',
      answer: 'Kimi K2 supports multiple languages. The platform UI is currently in English, with multi-language support coming soon.',
    },
    {
      question: 'How do I get started?',
      answer: 'Sign up for a free account, add your first data source, and start chatting with your AI. Our quickstart guide will have you up and running in 5 minutes.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about Ratu Sovereign AI
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <span className="text-2xl text-gray-400">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Our team is here to help
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}