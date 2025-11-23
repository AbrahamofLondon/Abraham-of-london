// pages/privacy-policy.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import PolicyFooter from "@/components/PolicyFooter";

export default function PrivacyPolicy() {
  return (
    <Layout title="Privacy Policy">
      <Head>
        <title>{getPageTitle("Privacy Policy")}</title>
        <meta
          name="description"
          content="How Abraham of London collects, uses, and safeguards personal data, with integrity, transparency, and respect for your rights."
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
              Our approach to handling personal data is rooted in integrity, restraint, and respect.
              This policy explains what we collect, why, and how we protect it.
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
                  1. About This Policy
                </h2>
                <p className="text-gold/70 mb-4">
                  This Privacy Policy explains how Abraham of London (&quot;we&quot;, &quot;us&quot;,
                  &quot;our&quot;) collects, uses, and protects personal data when you visit our
                  website, subscribe to our newsletter, attend events, or engage with us in other
                  ways. It is intended as a clear summary and does not override any rights you may
                  have under applicable data protection laws.
                </p>
                <p className="text-gold/70">
                  For the purposes of applicable data protection legislation, we generally act as a{" "}
                  &quot;controller&quot; of the personal data we collect directly from you in
                  connection with this site and our activities.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  2. Information We Collect
                </h2>
                <p className="text-gold/70 mb-4">
                  We collect information that you provide directly to us, including when you:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Complete our contact or enquiry forms</li>
                  <li>Subscribe to newsletters or updates</li>
                  <li>Register for or attend events, workshops, or salons</li>
                  <li>Request resources, downloads, or advisory conversations</li>
                </ul>
                <p className="text-gold/70 mb-4">
                  The information may include your name, contact details, role, organisation, areas
                  of interest, and any other details you choose to provide in open text fields.
                </p>
                <p className="text-gold/70">
                  We may also collect limited technical data (such as IP address, device type,
                  approximate location, and usage information) through cookies and similar
                  technologies, as described in our{" "}
                  <Link href="/cookie-policy" className="text-gold hover:text-amber-200 underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="text-gold/70 mb-4">
                  We use personal data for the following purposes, always with a restraint mindset:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Responding to enquiries and managing ongoing correspondence</li>
                  <li>Providing newsletters, content, and event information you have requested</li>
                  <li>Planning and administering events, workshops, and gatherings</li>
                  <li>Improving our content, user experience, and platform performance</li>
                  <li>Maintaining appropriate records for governance, compliance, and risk management</li>
                </ul>
                <p className="text-gold/70">
                  We do not sell your personal data. Where we work with third-party service providers,
                  they act under instructions and appropriate safeguards.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  4. Legal Bases for Processing
                </h2>
                <p className="text-gold/70 mb-4">
                  Where required by law, we rely on one or more of the following legal bases to process
                  personal data:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>
                    <span className="font-semibold">Consent</span> – for example, where you subscribe
                    to receive email updates.
                  </li>
                  <li>
                    <span className="font-semibold">Legitimate interests</span> – such as maintaining a
                    trusted platform, improving services, and communicating with interested parties in a
                    proportionate way.
                  </li>
                  <li>
                    <span className="font-semibold">Contract</span> – where processing is necessary to
                    enter into or perform an agreement with you.
                  </li>
                  <li>
                    <span className="font-semibold">Legal obligations</span> – where we must retain
                    certain records or respond to lawful requests.
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  5. Sharing and Transfers
                </h2>
                <p className="text-gold/70 mb-4">
                  We may share personal data with carefully selected third parties where necessary for:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Website hosting, analytics, and IT support</li>
                  <li>Email delivery, event management, and related tools</li>
                  <li>Professional advisers (for example legal or accounting support)</li>
                  <li>Law enforcement or regulatory bodies where required by law</li>
                </ul>
                <p className="text-gold/70">
                  Where data is transferred outside the UK or EU, we aim to ensure appropriate safeguards
                  are in place in line with applicable data protection requirements.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  6. Data Retention
                </h2>
                <p className="text-gold/70 mb-4">
                  We keep personal data only for as long as it is reasonably necessary for the purposes
                  set out in this policy, including for any legal, regulatory, accounting, or reporting
                  requirements.
                </p>
                <p className="text-gold/70">
                  When data is no longer required, we take reasonable steps to delete it or anonymise it
                  in a secure manner.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  7. Your Rights
                </h2>
                <p className="text-gold/70 mb-4">
                  Depending on applicable data protection law, you may have rights in relation to your
                  personal data, including:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Accessing a copy of the personal data we hold about you</li>
                  <li>Requesting corrections to inaccurate or incomplete data</li>
                  <li>Requesting deletion of certain data, subject to legal obligations</li>
                  <li>Objecting to or restricting certain types of processing</li>
                  <li>Withdrawing consent where processing is based on your consent</li>
                </ul>
                <p className="text-gold/70">
                  To exercise these rights, please contact us using the details below. We may need to
                  verify your identity before actioning a request.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  8. Security
                </h2>
                <p className="text-gold/70 mb-4">
                  We apply appropriate technical and organisational measures to protect personal data
                  against unauthorised access, accidental loss, or misuse. No system is completely
                  risk-free, but we are intentional about security.
                </p>
                <p className="text-gold/70">
                  For more detail on our approach to security, please see our{" "}
                  <Link href="/security-policy" className="text-gold hover:text-amber-200 underline">
                    Security Policy
                  </Link>
                  .
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  9. Updates to This Policy
                </h2>
                <p className="text-gold/70 mb-2">
                  We may update this Privacy Policy from time to time to reflect changes in law, our
                  practices, or our services. When we make material changes, we will adjust the &quot;Last
                  updated&quot; date below and, where appropriate, provide additional notice.
                </p>
                <p className="text-gold/60 text-sm">Last updated: November 2025</p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">10. Contact</h2>
                <p className="text-gold/70 mb-2">
                  For privacy-related questions or requests, please contact:
                </p>
                <p className="text-gold/70">
                  Email:{" "}
                  <a
                    href="mailto:privacy@abrahamoflondon.com"
                    className="text-gold hover:text-amber-200 font-semibold"
                  >
                    privacy@abrahamoflondon.com
                  </a>
                </p>
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