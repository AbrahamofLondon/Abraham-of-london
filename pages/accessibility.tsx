// pages/accessibility-statement.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Shield, Users, Target } from "lucide-react";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import PolicyFooter from "@/components/PolicyFooter";

export default function AccessibilityStatement() {
  const accessibilityPrinciples = [
    {
      icon: Shield,
      title: "WCAG 2.1 AA Alignment",
      description:
        "We aim to align with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards, ensuring content is perceivable, operable, understandable, and robust.",
    },
    {
      icon: Users,
      title: "Inclusive Design",
      description:
        "Our design process considers diverse abilities from the outset, not as an afterthought, to create experiences that work for as many people as reasonably possible.",
    },
    {
      icon: Target,
      title: "Ongoing Testing",
      description:
        "Where feasible, we apply automated and manual checks using keyboard navigation, screen readers, and assistive technologies to identify and reduce barriers.",
    },
  ];

  const accessibilityFeatures = [
    "Keyboard navigation across core areas",
    "Screen reader compatibility with ARIA where appropriate",
    "High-contrast colour combinations for key elements",
    "Support for text resizing up to 200% without loss of content where practical",
    "Alternative text for meaningful images",
    "Clear focus indicators for interactive components",
    "Semantic HTML structure to support assistive technologies",
    "Form labels and accessible error messaging for key forms",
    "Consistent and predictable navigation patterns",
    "Descriptive link and button text where context requires clarity",
  ];

  return (
    <Layout title="Accessibility Statement">
      <Head>
        <title>{getPageTitle("Accessibility Statement")}</title>
        <meta
          name="description"
          content="How Abraham of London approaches digital accessibility and inclusive design, along with how to contact us about any barriers you encounter."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="font-serif text-4xl font-bold text-cream mb-4 sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Accessibility Statement
            </motion.h1>
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-gold to-amber-200 mx-auto mb-6"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            />
            <motion.p
              className="text-xl text-gold/70 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              We want our content to be accessible to as many people as reasonably possible. This
              statement explains what we are doing, where there may still be limitations, and how you
              can tell us if something is not working for you.
            </motion.p>
          </motion.div>

          {/* Commitment Section */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-charcoal/60 rounded-2xl border border-gold/20 p-8 backdrop-blur-sm">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-cream mb-6">
                    Our Commitment to Digital Inclusion
                  </h2>
                  <p className="text-lg text-gold/70 leading-relaxed mb-6">
                    Abraham of London exists to equip and encourage leaders, fathers, and founders. It
                    would be contradictory to build a platform that excludes people unnecessarily. We see
                    accessibility as part of responsible stewardship, not a tick-box exercise.
                  </p>
                  <p className="text-gold/70 leading-relaxed">
                    We are working towards alignment with WCAG 2.1 Level AA where reasonably achievable
                    for our context. Some content—such as legacy assets, older PDFs, or third-party
                    embeds—may not yet fully meet this standard, but we are committed to gradual
                    improvement over time.
                  </p>
                </div>
                <div className="grid gap-6">
                  {accessibilityPrinciples.map((principle, index) => (
                    <motion.div
                      key={principle.title}
                      className="flex items-start gap-4 p-4 rounded-xl border border-gold/20 bg-charcoal/40"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 flex items-center justify-center">
                        <principle.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">{principle.title}</h3>
                        <p className="text-sm text-gold/70 leading-relaxed">
                          {principle.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Features Grid */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-semibold text-cream mb-4">
                Current Accessibility Features
              </h2>
              <p className="text-lg text-gold/70 max-w-2xl mx-auto">
                We have implemented a range of features to support more accessible use of this site.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {accessibilityFeatures.map((feature, index) => (
                <motion.div
                  key={feature}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gold/20 bg-charcoal/60 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -2 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-gold/80">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Feedback & Contact */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-2xl border border-gold/25 p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                    If You Experience Barriers
                  </h2>
                  <p className="text-gold/70 leading-relaxed mb-6">
                    Accessibility is a journey. Despite our efforts, there may still be areas of this
                    site that are difficult to use with certain assistive technologies, device setups, or
                    connection conditions.
                  </p>
                  <p className="text-gold/70 leading-relaxed">
                    If you encounter a barrier, we would genuinely value hearing from you. While we
                    cannot promise to resolve every issue immediately, your feedback informs our
                    priorities and future improvements.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-cream mb-3">Contact Information</h3>
                    <div className="space-y-3 text-gold/70">
                      <p className="flex items-center gap-3">
                        <span className="font-semibold text-gold">Email:</span>
                        <a
                          href="mailto:accessibility@abrahamoflondon.com"
                          className="hover:text-amber-200 transition-colors underline underline-offset-2"
                        >
                          accessibility@abrahamoflondon.com
                        </a>
                      </p>
                      <p className="flex items-center gap-3">
                        <span className="font-semibold text-gold">Alternative:</span>
                        You may also use the{" "}
                        <Link
                          href="/contact"
                          className="underline underline-offset-2 text-gold hover:text-amber-200"
                        >
                          contact form
                        </Link>{" "}
                        and mention &quot;Accessibility&quot; in your subject line.
                      </p>
                      <p className="flex items-center gap-3">
                        <span className="font-semibold text-gold">Response Time:</span>
                        We aim to respond within 2 business days.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-cream mb-3">Helpful Details to Include</h3>
                    <ul className="text-gold/70 space-y-2 text-sm">
                      <li>• A brief description of the issue</li>
                      <li>• The URL or page name where it occurred</li>
                      <li>• Your browser, device, and any assistive technology used</li>
                      <li>• Any screenshots or examples, if convenient</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Continuous Improvement */}
          <motion.section
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-charcoal/60 rounded-2xl border border-gold/20 p-8 backdrop-blur-sm">
              <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                Scope and Limitations
              </h2>
              <p className="text-gold/70 leading-relaxed max-w-3xl mx-auto mb-4">
                This statement covers the main Abraham of London website experience. It does not
                guarantee the accessibility of every third-party integration, embedded tool, or
                external resource we may reference, although we are selective about partners.
              </p>
              <p className="text-gold/70 leading-relaxed max-w-3xl mx-auto mb-4">
                We are committed to continuous improvement and periodically reviewing this statement as
                the platform evolves.
              </p>
              <p className="text-gold/60 text-sm">
                Last updated: November 2025
              </p>
            </div>
          </motion.section>

          <PolicyFooter isDark={true} />

          {/* Return Home */}
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