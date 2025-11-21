import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Abraham of London</title>
        <meta name="description" content="Our commitment to protecting your privacy and personal data" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-cream to-warmWhite pt-20">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl font-serif font-bold text-charcoal mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Privacy Policy
            </motion.h1>
            <div className="w-24 h-1 bg-gradient-to-r from-gold to-amber-200 mx-auto mb-6" />
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our commitment to protecting your privacy and personal data with integrity and transparency.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gold/20 p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">1. Information We Collect</h2>
                <p className="text-gray-700 mb-4">
                  We collect information that you provide directly to us, including when you:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Contact us through our website forms</li>
                  <li>Subscribe to our newsletter or updates</li>
                  <li>Download resources or purchase services</li>
                  <li>Attend our events or workshops</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">
                  Your information helps us provide and improve our services, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Personalizing your experience with our content</li>
                  <li>Communicating important updates and offerings</li>
                  <li>Providing customer support and responding to inquiries</li>
                  <li>Analyzing and improving our services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">3. Data Protection</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">4. Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  You have the right to access, correct, or delete your personal data. Contact us at any time 
                  to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">5. Contact</h2>
                <p className="text-gray-700">
                  For privacy-related questions, please contact us at{" "}
                  <a href="mailto:privacy@abrahamoflondon.com" className="text-gold hover:text-amber-200 transition-colors">
                    privacy@abrahamoflondon.com
                  </a>
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