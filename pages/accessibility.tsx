// pages/accessibility.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { siteConfig } from "@/lib/siteConfig";

const AccessibilityPage: NextPage = () => {
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB"),
    [],
  );

  return (
    <Layout title="Accessibility Statement">
      <main className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-gray-200 sm:py-16 lg:py-20">
        <section className="space-y-8">
          <header className="space-y-3 border-b border-gold/30 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Governance · Accessibility
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Accessibility Statement
            </h1>
            <p className="text-xs text-gray-400">Last updated: {lastUpdated}</p>
            <p className="mt-2 text-sm text-gold/70">
              Abraham of London is committed to making this website usable and
              accessible for as many people as possible, including those with
              disabilities and assistive technology needs.
            </p>
          </header>

          {/* 1. Commitment */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. Our commitment
            </h2>
            <p className="text-sm text-gray-200">
              The aim is to align with recognised good practice, including the{" "}
              <span className="font-semibold text-cream">
                Web Content Accessibility Guidelines (WCAG) 2.1
              </span>{" "}
              at level AA, as far as is reasonably practical for a small,
              founder-led platform.
            </p>
          </section>

          {/* 2. Measures */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. Measures we take
            </h2>
            <p className="text-sm text-gray-200">
              Practical steps already in place include:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Using semantic HTML and appropriate ARIA attributes.</li>
              <li>Supporting keyboard navigation where possible.</li>
              <li>Maintaining high contrast between text and background.</li>
              <li>Using readable font sizes, line spacing, and hierarchy.</li>
              <li>Providing alternative text for meaningful images.</li>
              <li>Avoiding unnecessary flashing or disruptive animations.</li>
              <li>Testing across modern browsers and common device sizes.</li>
            </ul>
          </section>

          {/* 3. Third-party content */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. Third-party content and services
            </h2>
            <p className="text-sm text-gray-200">
              Some areas of the site incorporate third-party services, such as:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Embedded videos (e.g. YouTube or similar platforms).</li>
              <li>Newsletter sign-up forms (Mailchimp).</li>
              <li>Analytics and security scripts.</li>
            </ul>
            <p className="text-sm text-gray-200">
              While we aim to choose providers that respect accessibility norms,
              their components may not fully meet the same standards in every
              respect. These integrations are reviewed over time and may be
              replaced where a better alternative exists.
            </p>
          </section>

          {/* 4. Known limitations */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Known limitations
            </h2>
            <p className="text-sm text-gray-200">
              Some content may not yet be fully optimised. Known limitations
              include:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Legacy posts or documents that pre-date the current design
                system.
              </li>
              <li>Occasional images where alternative text may be missing.</li>
              <li>
                More complex layouts on experimental or long-form editorial
                pages.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              These areas are being iteratively improved as the platform evolves
              and new patterns are standardised.
            </p>
          </section>

          {/* 5. Feedback */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. Feedback and contact
            </h2>
            <p className="text-sm text-gray-200">
              If you experience barriers using this site, encounter content that
              is difficult to access, or have specific accessibility
              requirements, please let us know. Feedback is taken seriously and
              feeds directly into future improvements.
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

export default AccessibilityPage;