// pages/terms-of-service.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import PolicyFooter from "@/components/PolicyFooter";

export default function TermsOfService() {
  return (
    <Layout title="Terms of Service">
      <Head>
        <title>{getPageTitle("Terms of Service")}</title>
        <meta
          name="description"
          content="Terms and conditions for using the Abraham of London website and services, framed around integrity, respect, and clear boundaries."
        />
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
              These terms govern your use of this website and related services. Please read them
              carefully; by using the site, you accept them.
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
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gold/70 mb-4">
                  By accessing or using the Abraham of London website and any related content,
                  newsletters, or online experiences (collectively, the &quot;Services&quot;), you
                  agree to be bound by these Terms of Service. If you do not agree to these terms, you
                  should not use the Services.
                </p>
                <p className="text-gold/70">
                  We may update these terms periodically. Continued use of the Services after changes
                  take effect constitutes acceptance of the updated terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  2. Eligibility and Appropriate Use
                </h2>
                <p className="text-gold/70 mb-4">
                  The Services are intended for adults who are capable of entering into binding
                  agreements under applicable law. You are responsible for ensuring that your use is
                  lawful in the jurisdiction where you are based.
                </p>
                <p className="text-gold/70">
                  You agree not to misuse the Services, including by attempting to gain unauthorised
                  access, interfering with normal operation, or using the platform for unlawful, abusive,
                  defamatory, or misleading activity.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  3. Intellectual Property
                </h2>
                <p className="text-gold/70 mb-4">
                  Unless otherwise stated, all content on this site—including text, graphics, logos,
                  images, and layouts—is owned by Abraham of London or used under licence and is
                  protected by applicable intellectual property laws.
                </p>
                <p className="text-gold/70">
                  You may view and, where clearly permitted, download content for your personal,
                  non-commercial use. You may not reproduce, distribute, adapt, or exploit content for
                  commercial purposes without prior written permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  4. No Professional Advice
                </h2>
                <p className="text-gold/70 mb-4">
                  The content we share—including articles, resources, conversations, and event
                  discussions—is for general information and reflection only. It does not constitute
                  legal, financial, investment, tax, medical, or other regulated professional advice.
                </p>
                <p className="text-gold/70">
                  You should seek appropriate independent advice before making decisions based on any
                  information obtained through the Services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  5. Third-Party Links and Services
                </h2>
                <p className="text-gold/70 mb-4">
                  The Services may contain links to third-party websites or services. These are provided
                  for convenience and context only. We do not control and are not responsible for the
                  content, security, or practices of third-party sites.
                </p>
                <p className="text-gold/70">
                  Your use of third-party sites is at your own discretion and subject to their terms and
                  policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  6. Limitation of Liability
                </h2>
                <p className="text-gold/70 mb-4">
                  To the fullest extent permitted by law, we exclude all implied warranties and
                  representations regarding the Services. The Services are provided on an &quot;as is&quot;
                  and &quot;as available&quot; basis.
                </p>
                <p className="text-gold/70">
                  We do not accept liability for loss or damage arising from your use of, or reliance on,
                  the Services, except where such liability cannot be excluded under applicable law. In
                  any case, our aggregate liability in connection with the Services will be limited to a
                  reasonable amount relative to the context in which the issue arose.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  7. Privacy and Cookies
                </h2>
                <p className="text-gold/70 mb-2">
                  Our use of personal data and cookies is explained separately in our:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-1 mb-4">
                  <li>
                    <Link href="/privacy-policy" className="text-gold hover:text-amber-200 underline">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookie-policy" className="text-gold hover:text-amber-200 underline">
                      Cookie Policy
                    </Link>
                  </li>
                </ul>
                <p className="text-gold/70">
                  Those documents sit alongside these Terms to form part of the overall governance
                  framework for your use of the Services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  8. Changes, Suspension, and Termination
                </h2>
                <p className="text-gold/70 mb-4">
                  We may change, suspend, or discontinue any part of the Services at any time, including
                  content, features, or availability, where this is reasonable in the circumstances.
                </p>
                <p className="text-gold/70">
                  We may also restrict or terminate your access to the Services if we reasonably believe
                  you have breached these terms or used the platform in a way that creates risk for us or
                  others.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  9. Governing Law and Contact
                </h2>
                <p className="text-gold/70 mb-4">
                  These terms and any non-contractual obligations arising out of or in connection with
                  them are governed by the laws of England and Wales. The courts of England and Wales will
                  have non-exclusive jurisdiction over any dispute.
                </p>
                <p className="text-gold/70 mb-2">
                  If you have questions about these Terms of Service, please contact:
                </p>
                <p className="text-gold/70">
                  Email:{" "}
                  <a
                    href="mailto:legal@abrahamoflondon.com"
                    className="text-gold hover:text-amber-200 font-semibold"
                  >
                    legal@abrahamoflondon.com
                  </a>
                </p>
                <p className="text-gold/60 text-sm mt-4">Last updated: November 2025</p>
              </section>
            </div>
          </motion.div>

          <PolicyFooter isDark={true} />

          <motion.div
            className="text-center mt-10"
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