// pages/cookie-policy.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import PolicyFooter from "@/components/PolicyFooter";

export default function CookiePolicy() {
  return (
    <Layout title="Cookie Policy">
      <Head>
        <title>{getPageTitle("Cookie Policy")}</title>
        <meta
          name="description"
          content="How we use cookies and similar technologies, and the choices you have in managing them."
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
              This Cookie Policy explains how we use cookies and similar technologies when you visit our
              website and how you can manage your preferences.
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
                  This Cookie Policy explains how Abraham of London (&quot;we&quot;, &quot;us&quot;,
                  &quot;our&quot;) uses cookies and similar technologies on our website. It should be read
                  together with our{" "}
                  <Link href="/privacy-policy" className="text-gold hover:text-amber-200 underline">
                    Privacy Policy
                  </Link>
                  , which explains how we handle personal data more broadly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  2. What Are Cookies?
                </h2>
                <p className="text-gold/70 mb-4">
                  Cookies are small text files that are placed on your device when you visit a website.
                  They are widely used to make websites work, improve efficiency, and provide information
                  to site owners. Related technologies (such as pixels, tags, and local storage) may also
                  be used for similar purposes; we refer to all of these collectively as &quot;cookies&quot;.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  3. Types of Cookies We Use
                </h2>
                <p className="text-gold/70 mb-4">
                  Depending on your interactions and settings, we may use the following categories of
                  cookies:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>
                    <span className="font-semibold">Strictly necessary cookies</span> – essential for the
                    website to function, for example to enable basic navigation, security, or access to
                    secure areas. These cannot be switched off via our cookie tools, though you may still
                    be able to block them in your browser.
                  </li>
                  <li>
                    <span className="font-semibold">Performance and analytics cookies</span> – help us
                    understand how visitors use our site (for example, which pages are most visited) so we
                    can measure performance and improve the experience over time.
                  </li>
                  <li>
                    <span className="font-semibold">Preference cookies</span> – allow the site to remember
                    choices you make (such as language or region) and provide more tailored features.
                  </li>
                  <li>
                    <span className="font-semibold">Marketing or targeting cookies</span> – may be used,
                    where enabled, to deliver content that is more relevant to your interests or to measure
                    the effectiveness of campaigns. We do not sell your personal data to third parties for
                    their own marketing.
                  </li>
                </ul>
                <p className="text-gold/70">
                  The specific cookies in use may change over time as we refine or add functionality.
                  Where required by law, we will seek your consent before setting non-essential cookies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  4. Managing Cookies and Preferences
                </h2>
                <p className="text-gold/70 mb-4">
                  You have several options for managing cookies:
                </p>
                <ul className="list-disc list-inside text-gold/70 space-y-2 mb-4">
                  <li>
                    <span className="font-semibold">Browser settings</span> – most browsers allow you to
                    block or delete cookies. The method varies by browser, so please consult your browser&apos;s
                    help or settings pages for details.
                  </li>
                  <li>
                    <span className="font-semibold">Cookie controls</span> – where we provide on-site
                    cookie banners or preference tools, you can use these to accept, reject, or customise
                    non-essential cookies.
                  </li>
                  <li>
                    <span className="font-semibold">Third-party tools</span> – some analytics or marketing
                    providers offer their own opt-out mechanisms.
                  </li>
                </ul>
                <p className="text-gold/70">
                  Please note that disabling certain types of cookies may affect the performance of the
                  site or limit access to some features.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  5. Third-Party Cookies
                </h2>
                <p className="text-gold/70 mb-4">
                  Some cookies on our site may be set by third parties, for example analytics providers,
                  embedded content platforms, or social media services. These third parties may collect and
                  use information in line with their own privacy and cookie policies.
                </p>
                <p className="text-gold/70">
                  We do not control how third parties use their cookies once they are set. We recommend
                  reviewing their policies directly for more information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  6. Changes to This Cookie Policy
                </h2>
                <p className="text-gold/70 mb-4">
                  We may update this Cookie Policy from time to time, for example to reflect changes in the
                  cookies we use, in our Services, or in applicable law. When we make material changes, we
                  will update the &quot;Last updated&quot; date below and, where appropriate, provide
                  additional notice.
                </p>
                <p className="text-gold/60 text-sm">Last updated: November 2025</p>
              </section>

              <section>
                <h2 className="font-serif text-2xl font-semibold text-cream mb-4">
                  7. Contact
                </h2>
                <p className="text-gold/70 mb-2">
                  If you have any questions about our use of cookies or this Cookie Policy, please contact
                  us at:
                </p>
                <p className="text-gold/70 mb-2">
                  Email:{" "}
                  <a
                    href="mailto:privacy@abrahamoflondon.com"
                    className="text-gold hover:text-amber-200 transition-colors font-semibold"
                  >
                    privacy@abrahamoflondon.com
                  </a>
                </p>
                <p className="text-gold/70">
                  For more information on how we process personal data, please see our{" "}
                  <Link href="/privacy-policy" className="text-gold hover:text-amber-200 underline">
                    Privacy Policy
                  </Link>
                  .
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