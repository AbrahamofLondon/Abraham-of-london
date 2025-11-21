import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Shield, Users, Target } from "lucide-react";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";

export default function AccessibilityStatement() {
  const accessibilityPrinciples = [
    {
      icon: Shield,
      title: "WCAG 2.1 AA Compliance",
      description: "We adhere to Web Content Accessibility Guidelines 2.1 Level AA standards, ensuring our content is perceivable, operable, understandable, and robust."
    },
    {
      icon: Users,
      title: "Inclusive Design",
      description: "Our design process considers diverse abilities from the ground up, creating experiences that work for everyone regardless of physical or cognitive abilities."
    },
    {
      icon: Target,
      title: "Continuous Testing",
      description: "Regular automated and manual testing using screen readers, keyboard navigation, and assistive technologies to identify and resolve barriers."
    }
  ];

  const accessibilityFeatures = [
    "Keyboard navigation throughout entire site",
    "Screen reader compatibility with ARIA labels",
    "High contrast mode support",
    "Text resizing up to 200% without loss of content",
    "Alternative text for all meaningful images",
    "Clear focus indicators for interactive elements",
    "Semantic HTML structure for proper document outline",
    "Form labels and error messaging",
    "Consistent and predictable navigation",
    "Time-based media alternatives"
  ];

  return (
    <Layout title="Accessibility Statement">
      <Head>
        <title>{getPageTitle("Accessibility Statement")}</title>
        <meta 
          name="description" 
          content="Our unwavering commitment to digital accessibility for everyone, regardless of ability. We build inclusive experiences from the ground up." 
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
              Our unwavering commitment to digital accessibility for everyone, regardless of ability. 
              We build inclusive experiences from the ground up, not as an afterthought.
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
                    At Abraham of London, we believe that wisdom and insight should be accessible to all. 
                    Our commitment to digital accessibility reflects our broader mission to serve leaders 
                    and thinkers regardless of physical or cognitive abilities.
                  </p>
                  <p className="text-gold/70 leading-relaxed">
                    We are dedicated to meeting and exceeding WCAG 2.1 Level AA standards, treating 
                    accessibility not as a compliance requirement but as a core value that shapes 
                    everything we build.
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
                        <p className="text-sm text-gold/70 leading-relaxed">{principle.description}</p>
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
                Accessibility Features
              </h2>
              <p className="text-lg text-gold/70 max-w-2xl mx-auto">
                We've implemented comprehensive accessibility features to ensure everyone can engage with our content
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
                    Your Feedback Matters
                  </h2>
                  <p className="text-gold/70 leading-relaxed mb-6">
                    We consider accessibility an ongoing journey of improvement. Your experience helps us 
                    identify areas where we can do better and serve our community more effectively.
                  </p>
                  <p className="text-gold/70 leading-relaxed">
                    If you encounter any accessibility barriers or have suggestions for improvement, 
                    we want to hear from you.
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
                        <span className="font-semibold text-gold">Phone:</span>
                        +44 (0)208 0622 5909
                      </p>
                      <p className="flex items-center gap-3">
                        <span className="font-semibold text-gold">Response Time:</span>
                        Within 2 business days
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-cream mb-3">When You Contact Us</h3>
                    <ul className="text-gold/70 space-y-2 text-sm">
                      <li>• Describe the accessibility issue in detail</li>
                      <li>• Include the URL of the relevant page</li>
                      <li>• Let us know your preferred contact method</li>
                      <li>• Share any assistive technology you're using</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Continuous Improvement */}
          <motion.section 
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-charcoal/60 rounded-2xl border border-gold/20 p-8 backdrop-blur-sm">
              <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                Continuous Improvement Process
              </h2>
              <p className="text-gold/70 leading-relaxed max-w-3xl mx-auto mb-6">
                Our accessibility work never stops. We conduct quarterly audits, gather user feedback, 
                monitor emerging standards, and train our team on inclusive design practices. Each update 
                to our platform includes accessibility considerations as a non-negotiable requirement.
              </p>
              <p className="text-gold/60 text-sm">
                Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </motion.section>

          {/* Return Home */}
          <motion.div 
            className="text-center mt-12"
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