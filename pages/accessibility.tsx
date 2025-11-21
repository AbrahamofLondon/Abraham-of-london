import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AccessibilityStatement() {
  return (
    <>
      <Head>
        <title>Accessibility Statement - Abraham of London</title>
        <meta name="description" content="Our commitment to making our website accessible to everyone" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-cream to-warmWhite pt-20">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-charcoal mb-4">
              Accessibility Statement
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-gold to-amber-200 mx-auto mb-6" />
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Committed to ensuring digital accessibility for everyone, regardless of ability.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gold/20 p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Our Commitment</h2>
                <p className="text-gray-700 mb-4">
                  Abraham of London is committed to ensuring digital accessibility for people with disabilities. 
                  We are continually improving the user experience for everyone and applying the relevant 
                  accessibility standards.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Measures We Take</h2>
                <p className="text-gray-700 mb-4">
                  To ensure accessibility, we:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Follow WCAG 2.1 guidelines for web content</li>
                  <li>Implement semantic HTML structure</li>
                  <li>Provide alternative text for images</li>
                  <li>Ensure keyboard navigation support</li>
                  <li>Maintain sufficient color contrast</li>
                  <li>Design with responsive layouts</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Feedback & Contact</h2>
                <p className="text-gray-700 mb-4">
                  We welcome your feedback on the accessibility of our website. Please let us know if you 
                  encounter accessibility barriers:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Email: <a href="mailto:accessibility@abrahamoflondon.com" className="text-gold hover:text-amber-200 transition-colors">accessibility@abrahamoflondon.com</a></li>
                  <li>Phone: +44 (0)20 XXXX XXXX</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Continuous Improvement</h2>
                <p className="text-gray-700">
                  We regularly review our website and make necessary adjustments to ensure we meet or exceed 
                  accessibility standards. This is an ongoing process as technology and standards evolve.
                </p>
              </section>
            </div>
          </div>

          <div className="text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}