import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CookiePolicy() {
  return (
    <>
      <Head>
        <title>Cookie Policy - Abraham of London</title>
        <meta name="description" content="How we use cookies to enhance your browsing experience" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-cream to-warmWhite pt-20">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-charcoal mb-4">
              Cookie Policy
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-gold to-amber-200 mx-auto mb-6" />
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Understanding how we use cookies to improve your experience on our website.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gold/20 p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">What Are Cookies?</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are stored on your device when you visit our website. 
                  They help us provide you with a better browsing experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">How We Use Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Essential cookies for website functionality</li>
                  <li>Analytics cookies to understand how visitors use our site</li>
                  <li>Preference cookies to remember your settings</li>
                  <li>Marketing cookies to provide relevant content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Managing Cookies</h2>
                <p className="text-gray-700 mb-4">
                  You can control and/or delete cookies as you wish. You can delete all cookies that are 
                  already on your computer and set most browsers to prevent them from being placed.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Updates to This Policy</h2>
                <p className="text-gray-700">
                  We may update this Cookie Policy from time to time. We encourage you to review this page 
                  periodically for the latest information.
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