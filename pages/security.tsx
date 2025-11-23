// pages/security-policy.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import PolicyFooter from "@/components/PolicyFooter";

export default function SecurityPolicy() {
  return (
    <Layout title="Security Policy">
      <Head>
        <title>{getPageTitle("Security Policy")}</title>
        <meta
          name="description"
          content="Our approach to protecting your information with proportionate, enterprise-style security practices and clear boundaries."
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
              We treat security as stewardship. This policy sets out how we aim to protect the
              information entrusted to us, and the limits of what any online service can guarantee.
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
                  1. Security Philosophy
                </h2>
                <p className="text-gold/70 mb-4">
                  At Abraham of London, security is approached as a responsibility, not an afterthought.
                  Our goal is to apply proportionate, modern safeguards while maintaining a lean,
                  human-centered platform.
                </p>
                <p className="text-gold/70">
                  No online service can promise absolute security, but we are intentional in reducing
                  avoidable risk and learning continuously from good practice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  2. Technical and Organisational Measures
                </h2>
                <p className="text-gold/70 mb-4">
                  Depending on the specific service or system in use, our security measures may include:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Encryption of data in transit using HTTPS/TLS</li>
                  <li>Use of reputable hosting providers and managed infrastructure</li>
                  <li>Access controls and principle of least privilege for administrative accounts</li>
                  <li>Regular updates and patching of software components</li>
                  <li>Segregation of environments where appropriate</li>
                  <li>Monitoring for unusual activity and error patterns</li>
                </ul>
                <p className="text-gold/70">
                  As our platform evolves, we may adapt or enhance these controls to reflect emerging
                  threats and best practices.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  3. Third-Party Services
                </h2>
                <p className="text-gold/70 mb-4">
                  We may rely on carefully selected third-party providers for hosting, analytics,
                  communications, or event management. Where we do so, we seek to work with providers
                  that have appropriate security standards and certifications for their role.
                </p>
                <p className="text-gold/70">
                  Each provider is responsible for the security of its own systems. We do not control
                  their internal operations and encourage you to review their individual policies where
                  relevant.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  4. Your Responsibilities
                </h2>
                <p className="text-gold/70 mb-4">
                  Security is shared. You can support a safer environment by:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>Using unique, strong passwords for accounts linked to our services</li>
                  <li>Keeping devices and browsers up to date with security patches</li>
                  <li>Avoiding sending highly sensitive personal, legal, or financial details by email</li>
                  <li>Contacting us promptly if you suspect unauthorised access involving our platform</li>
                </ul>
                <p className="text-gold/70">
                  Our{" "}
                  <Link href="/terms-of-service" className="text-gold hover:text-amber-200 underline">
                    Terms of Service
                  </Link>{" "}
                  also set out expectations around acceptable use.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  5. Incident Response
                </h2>
                <p className="text-gold/70 mb-4">
                  If we become aware of a security incident that affects personal data or the integrity
                  of our platform, we will take appropriate steps to investigate, contain, and remediate
                  the issue.
                </p>
                <p className="text-gold/70">
                  Where required by law, we will notify relevant supervisory authorities and, where
                  appropriate, individuals affected, taking into account the nature and impact of the
                  incident.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  6. Reporting Security Concerns
                </h2>
                <p className="text-gold/70 mb-4">
                  If you believe you have found a security vulnerability or concern related to our
                  platform, please report it responsibly to:
                </p>
                <p className="text-gold/70 mb-2">
                  Email:{" "}
                  <a
                    href="mailto:security@abrahamoflondon.com"
                    className="text-gold hover:text-amber-200 font-semibold"
                  >
                    security@abrahamoflondon.com
                  </a>
                </p>
                <p className="text-gold/70">
                  Please avoid publicly disclosing potential vulnerabilities before we have had a
                  reasonable opportunity to review and address them.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  7. Updates to This Policy
                </h2>
                <p className="text-gold/70 mb-2">
                  We may revise this Security Policy periodically to reflect changes in our platform,
                  threat landscape, or regulatory environment. Material changes will be reflected in the
                  &quot;Last updated&quot; date below and, where appropriate, signposted on the site.
                </p>
                <p className="text-gold/60 text-sm">Last updated: November 2025</p>
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