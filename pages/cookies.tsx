import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";

export default function CookiePolicy() {
  return (
    <Layout title="Cookie Policy">
      <Head>
        <title>{getPageTitle("Cookie Policy")}</title>
        <meta name="description" content="How we use cookies to enhance your browsing experience while respecting your privacy." />
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
              Cookie Policy
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
              Understanding how we use cookies to improve your experience on our website.
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
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">What Are Cookies?</h2>
                <p className="text-gold/70 mb-4">
                  Cookies are small text files that are stored on your device when you visit our website. 
                  They help us provide you with a better browsing experience while respecting your privacy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">How We Use Cookies</h2>
                <p className="text-gold/70 mb-4">
                  We use cookies for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Essential cookies for website functionality</li>
                  <li>Analytics cookies to understand how visitors use our site</li>
                  <li>Preference cookies to remember your settings</li>
                  <li>Marketing cookies to provide relevant content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">Managing Cookies</h2>
                <p className="text-gold/70 mb-4">
                  You can control and/or delete cookies as you wish. You can delete all cookies that are 
                  already on your computer and set most browsers to prevent them from being placed.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">Updates to This Policy</h2>
                <p className="text-gold/70">
                  We may update this Cookie Policy from time to time. We encourage you to review this page 
                  periodically for the latest information on our cookie practices.
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