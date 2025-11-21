import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - Abraham of London</title>
        <meta name="description" content="Terms and conditions for using our services and website" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-cream to-warmWhite pt-20">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-charcoal mb-4">
              Terms of Service
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-gold to-amber-200 mx-auto mb-6" />
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Guidelines for using our services with integrity and mutual respect.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gold/20 p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing and using our website and services, you accept and agree to be bound by these Terms of Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">2. Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  All content, including text, graphics, logos, and images, is the property of Abraham of London 
                  and is protected by intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">3. User Responsibilities</h2>
                <p className="text-gray-700 mb-4">
                  You agree to use our services for lawful purposes and in a way that does not infringe on the 
                  rights of others or restrict their use of the services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">4. Service Modifications</h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify or discontinue any service at any time without prior notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">5. Governing Law</h2>
                <p className="text-gray-700">
                  These terms are governed by and construed in accordance with the laws of England and Wales.
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