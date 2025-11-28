// pages/cookies.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { siteConfig } from "@/lib/siteConfig";

const CookiesPage: NextPage = () => {
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB"),
    [],
  );

  return (
    <Layout title="Cookie Policy">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20 text-sm leading-relaxed text-gray-200">
        <section className="space-y-8">
          <header className="space-y-3 border-b border-gold/30 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Governance · Cookies
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Cookie Policy
            </h1>
            <p className="text-xs text-gray-400">Last updated: {lastUpdated}</p>
            <p className="mt-2 text-sm text-gold/70">
              This Cookie Policy explains how Abraham of London uses cookies and
              similar technologies on this website, and the choices available to
              you.
            </p>
          </header>

          {/* 1. What are cookies */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. What are cookies?
            </h2>
            <p className="text-sm text-gray-200">
              Cookies are small text files stored on your device by your browser
              when you visit a website. They are widely used to help websites
              function, improve performance, and provide information to site
              owners about how their sites are used.
            </p>
          </section>

          {/* 2. How we use cookies */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. How we use cookies
            </h2>
            <p className="text-sm text-gray-200">
              We take a conservative approach to cookies. Broadly, our use falls
              into two categories:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                <span className="font-semibold text-cream">
                  Strictly necessary cookies
                </span>{" "}
                – used to support basic functionality, security controls, and
                reliable delivery of content.
              </li>
              <li>
                <span className="font-semibold text-cream">Analytics</span> – used
                to understand which pages are accessed, how the site performs,
                and where to improve.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              We do{" "}
              <strong className="font-semibold text-cream">not</strong>{" "}
              deliberately use advertising networks, behavioural profiling, or
              invasive tracking cookies on this site.
            </p>
          </section>

          {/* 3. Analytics & third-party services */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. Analytics and third-party services
            </h2>
            <p className="text-sm text-gray-200">
              We may use privacy-respecting analytics such as{" "}
              <span className="font-semibold text-cream">Plausible Analytics</span>{" "}
              (which is cookie-free) and/or{" "}
              <span className="font-semibold text-cream">Google Analytics 4</span>{" "}
              to understand high-level usage patterns. This helps identify what
              is actually useful and where the experience needs work.
            </p>
            <p className="text-sm text-gray-200">
              Our newsletter platform,{" "}
              <span className="font-semibold text-cream">Mailchimp</span>,
              may place cookies or use similar technologies when you interact
              with sign-up forms or email content. Our email infrastructure
              provider,{" "}
              <span className="font-semibold text-cream">Resend</span>, may
              process technical and delivery data to ensure that messages are
              sent securely and reliably.
            </p>
            <p className="text-sm text-gray-200">
              We do not control the specific cookies set by these third-party
              providers, but we choose vendors with a credible privacy posture
              and clear documentation.
            </p>
          </section>

          {/* 4. Managing cookies */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Managing cookies
            </h2>
            <p className="text-sm text-gray-200">
              You can control and manage cookies through your browser settings.
              In most modern browsers you can:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>View which cookies are stored on your device.</li>
              <li>Delete existing cookies.</li>
              <li>Block cookies from specific sites.</li>
              <li>Block all cookies if you choose.</li>
            </ul>
            <p className="text-sm text-gray-200">
              Disabling some cookies may affect site performance or certain
              interactive features, but core reading access should remain
              available.
            </p>
          </section>

          {/* 5. Updates and contact */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. Updates and contact
            </h2>
            <p className="text-sm text-gray-200">
              We may update this Cookie Policy if our use of cookies changes or
              if legal requirements evolve. The “Last updated” date at the top
              of the page will always indicate the latest version in force.
            </p>
            <p className="text-sm text-gray-200">
              If you have questions or concerns about how cookies are used on
              this site, you can contact:
            </p>
            <p className="text-sm text-gray-200">
              Email:{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                {siteConfig.email}
              </a>
            </p>
          </section>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default CookiesPage;