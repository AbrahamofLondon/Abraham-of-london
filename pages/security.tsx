import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";

export default function SecurityPolicy() {
  return (
    <Layout title="Security Policy">
      <Head>
        <title>{getPageTitle("Security Policy")}</title>
        <meta name="description" content="Our comprehensive approach to protecting your data and information with enterprise-grade security measures." />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="font-serif text-4xl font-bold text-cream mb-4 sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Security Policy
            </motion.h1>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-gold to-amber-200 mx-auto mb-6"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            />
            <motion.p 
              className="text-lg text-gold/70 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Protecting your data with enterprise-grade security measures and best practices.
            </motion.p>
          </motion.div>

          {/* Content */}
          <motion.div 
            className="bg-charcoal/60 rounded-2xl border border-gold/20 p-8 mb-8 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="prose prose-lg max-w-none prose-invert">
              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">Our Security Commitment</h2>
                <p className="text-gold/70 mb-4">
                  At Abraham of London, we take the security of your data seriously. We implement comprehensive 
                  security measures to protect your information from unauthorized access, disclosure, alteration, 
                  and destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">Security Measures</h2>
                <p className="text-gold/70 mb-4">
                  Our security framework includes:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Secure development practices and code reviews</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Regular security training for our team</li>
                  <li>Incident response and recovery procedures</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">Data Protection</h2>
                <p className="text-gold/70 mb-4">
                  We adhere to strict data protection principles and comply with applicable data protection laws. 
                  Your personal information is processed only for the purposes for which it was collected.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">Reporting Security Issues</h2>
                <p className="text-gold/70 mb-4">
                  If you discover a security vulnerability, please report it to us immediately at{" "}
                  <a href="mailto:security@abrahamoflondon.com" className="text-gold hover:text-amber-200 transition-colors font-semibold">
                    security@abrahamoflondon.com
                  </a>. We appreciate your help in keeping our systems secure.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">Continuous Monitoring</h2>
                <p className="text-gold/70">
                  We continuously monitor our systems for potential threats and regularly update our security 
                  measures to address emerging risks and vulnerabilities.
                </p>
              </section>
            </div>
          </motion.div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Link 
              href="/"
              className="inline-flex items-center gap-2 border border-gold/40 text-gold px-8 py-4 rounded-xl font-semibold hover:bg-gold/10 transition-all hover:border-gold/60"
            >
              Return Home
            </Link>
          </motion.div>
        </div>
      </main>
    </Layout>
  );
}