import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SecurityPolicy() {
  return (
    <>
      <Head>
        <title>Security Policy - Abraham of London</title>
        <meta name="description" content="Our comprehensive approach to protecting your data and information" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-cream to-warmWhite pt-20">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-charcoal mb-4">
              Security Policy
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-gold to-amber-200 mx-auto mb-6" />
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Protecting your data with enterprise-grade security measures and best practices.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gold/20 p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Our Security Commitment</h2>
                <p className="text-gray-700 mb-4">
                  At Abraham of London, we take the security of your data seriously. We implement comprehensive 
                  security measures to protect your information from unauthorized access, disclosure, alteration, 
                  and destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Security Measures</h2>
                <p className="text-gray-700 mb-4">
                  Our security framework includes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Secure development practices and code reviews</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Regular security training for our team</li>
                  <li>Incident response and recovery procedures</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Data Protection</h2>
                <p className="text-gray-700 mb-4">
                  We adhere to strict data protection principles and comply with applicable data protection laws. 
                  Your personal information is processed only for the purposes for which it was collected.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Reporting Security Issues</h2>
                <p className="text-gray-700 mb-4">
                  If you discover a security vulnerability, please report it to us immediately at{" "}
                  <a href="mailto:security@abrahamoflondon.com" className="text-gold hover:text-amber-200 transition-colors">
                    security@abrahamoflondon.com
                  </a>. We appreciate your help in keeping our systems secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Continuous Monitoring</h2>
                <p className="text-gray-700">
                  We continuously monitor our systems for potential threats and regularly update our security 
                  measures to address emerging risks and vulnerabilities.
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