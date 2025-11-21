import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";

export default function PrivacyPolicy() {
  return (
    <Layout title="Privacy Policy">
      <Head>
        <title>{getPageTitle("Privacy Policy")}</title>
        <meta name="description" content="Our commitment to protecting your privacy and personal data with integrity and transparency." />
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
              Privacy Policy
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
              Our commitment to protecting your privacy and personal data with integrity and transparency.
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
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">1. Information We Collect</h2>
                <p className="text-gold/70 mb-4">
                  We collect information that you provide directly to us, including when you:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Contact us through our website forms</li>
                  <li>Subscribe to our newsletter or updates</li>
                  <li>Download resources or purchase services</li>
                  <li>Attend our events or workshops</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">2. How We Use Your Information</h2>
                <p className="text-gold/70 mb-4">
                  Your information helps us provide and improve our services, including:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Personalizing your experience with our content</li>
                  <li>Communicating important updates and offerings</li>
                  <li>Providing customer support and responding to inquiries</li>
                  <li>Analyzing and improving our services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">3. Data Protection</h2>
                <p className="text-gold/70 mb-4">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">4. Your Rights</h2>
                <p className="text-gold/70 mb-4">
                  You have the right to access, correct, or delete your personal data. Contact us at any time 
                  to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">5. Contact</h2>
                <p className="text-gold/70">
                  For privacy-related questions, please contact us at{" "}
                  <a href="mailto:privacy@abrahamoflondon.com" className="text-gold hover:text-amber-200 transition-colors font-semibold">
                    privacy@abrahamoflondon.com
                  </a>
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