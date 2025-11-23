// pages/accessibility.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const AccessibilityPage: NextPage = () => {
  return (
    <Layout title="Accessibility Statement">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Governance · Accessibility
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Accessibility Statement
            </h1>
            <p className="text-sm text-gold/70">
              Last updated: {new Date().toLocaleDateString("en-GB")}
            </p>
            <p className="mt-2 text-sm text-gray-200">
              Abraham of London is committed to making this website usable and
              accessible for as many people as possible, including those with
              disabilities.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. Our Commitment
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

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. Measures We Take
            </h2>
            <p className="text-sm text-gray-200">
              Practical steps include:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Using semantic HTML and appropriate ARIA attributes.</li>
              <li>Supporting keyboard navigation where possible.</li>
              <li>Maintaining high contrast between text and background.</li>
              <li>Using readable font sizes and line spacing.</li>
              <li>Providing alternative text for meaningful images.</li>
              <li>Avoiding unnecessary flashing or distracting animations.</li>
              <li>Testing across modern browsers and devices.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. Third-Party Content
            </h2>
            <p className="text-sm text-gray-200">
              Some areas of the site incorporate third-party services, such as:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Embedded videos (e.g. YouTube).</li>
              <li>Newsletter sign-up forms (Buttondown).</li>
              <li>Analytics scripts.</li>
            </ul>
            <p className="text-sm text-gray-200">
              While we aim to choose providers that respect accessibility, their
              components may not fully meet the same standards. We continue to
              review these integrations over time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Known Limitations
            </h2>
            <p className="text-sm text-gray-200">
              Some content may not yet be fully optimised, for example:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Legacy posts or documents that pre-date the current design system.
              </li>
              <li>Occasional images where alternative text may be missing.</li>
              <li>
                Complex layouts on experimental or long-form editorial pages.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              These areas are being iteratively improved as the platform evolves.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. Feedback & Contact
            </h2>
            <p className="text-sm text-gray-200">
              If you experience barriers using this site or have specific
              accessibility requirements, please let us know. This feedback is
              taken seriously and informs future improvements.
            </p>
            <p className="text-sm text-gray-200">
              Email:{" "}
              <a
                href="mailto:info@abrahamoflondon.org"
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                info@abrahamoflondon.org
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