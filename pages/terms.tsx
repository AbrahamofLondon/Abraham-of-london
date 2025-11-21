import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";

export default function TermsOfService() {
  return (
    <Layout title="Terms of Service">
      <Head>
        <title>{getPageTitle("Terms of Service")}</title>
        <meta name="description" content="Terms and conditions for using our services and website with integrity and mutual respect." />
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
              Terms of Service
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
              Guidelines for using our services with integrity and mutual respect.
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
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">1. Acceptance of Terms</h2>
                <p className="text-gold/70 mb-4">
                  By accessing and using our website and services, you accept and agree to be bound by these Terms of Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">2. Intellectual Property</h2>
                <p className="text-gold/70 mb-4">
                  All content, including text, graphics, logos, and images, is the property of Abraham of London 
                  and is protected by intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">3. User Responsibilities</h2>
                <p className="text-gold/70 mb-4">
                  You agree to use our services for lawful purposes and in a way that does not infringe on the 
                  rights of others or restrict their use of the services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">4. Service Modifications</h2>
                <p className="text-gold/70 mb-4">
                  We reserve the right to modify or discontinue any service at any time without prior notice.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">5. Governing Law</h2>
                <p className="text-gold/70">
                  These terms are governed by and construed in accordance with the laws of England and Wales.
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