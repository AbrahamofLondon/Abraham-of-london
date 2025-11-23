// pages/cookies.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const CookiesPage: NextPage = () => {
  return (
    <Layout title="Cookie Policy">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Governance · Cookies
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Cookie Policy
            </h1>
            <p className="text-sm text-gold/70">
              Last updated: {new Date().toLocaleDateString("en-GB")}
            </p>
            <p className="mt-2 text-sm text-gray-200">
              This Cookie Policy explains how Abraham of London uses cookies and
              similar technologies on this website.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. What Are Cookies?
            </h2>
            <p className="text-sm text-gray-200">
              Cookies are small text files stored on your device by your browser
              when you visit a website. They are widely used to make websites
              work, or work more efficiently, and to provide information to site
              owners.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. How We Use Cookies
            </h2>
            <p className="text-sm text-gray-200">
              We use a minimal and conservative approach to cookies. Broadly, our
              use falls into the following categories:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                <span className="font-semibold text-cream">
                  Strictly necessary cookies:
                </span>{" "}
                used for core functionality and security of the site.
              </li>
              <li>
                <span className="font-semibold text-cream">Analytics:</span>{" "}
                used to understand which pages are being accessed and how the site
                is performing overall.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              We do <strong className="font-semibold text-cream">not</strong>{" "}
              deliberately use advertising, behavioural profiling, or invasive
              tracking cookies on this site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. Analytics & Third-Party Services
            </h2>
            <p className="text-sm text-gray-200">
              We may use privacy-respecting analytics such as{" "}
              <span className="font-semibold text-cream">Plausible Analytics</span>{" "}
              (which is cookie-free) and/or{" "}
              <span className="font-semibold text-cream">Google Analytics 4</span>{" "}
              to understand how people use the site. This helps inform which
              content is helpful and where to improve.
            </p>
            <p className="text-sm text-gray-200">
              Our newsletter platform,{" "}
              <span className="font-semibold text-cream">Buttondown</span>,
              may place cookies or use similar technologies when you interact
              with embedded forms or email content. Our email infrastructure
              provider, <span className="font-semibold text-cream">Resend</span>,
              may also process technical data for secure and reliable email
              delivery.
            </p>
            <p className="text-sm text-gray-200">
              We do not control the cookies set by these third-party providers
              directly, but we choose vendors with a strong privacy posture and
              transparent documentation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Managing Cookies
            </h2>
            <p className="text-sm text-gray-200">
              You can control and manage cookies in your browser. Most browsers
              allow you to:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>View which cookies are stored on your device.</li>
              <li>Delete existing cookies.</li>
              <li>Block cookies from specific sites.</li>
              <li>Block all cookies if you choose.</li>
            </ul>
            <p className="text-sm text-gray-200">
              Disabling some cookies may impact the performance or functionality
              of the site, but basic reading access should remain available.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. Updates
            </h2>
            <p className="text-sm text-gray-200">
              We may update this Cookie Policy if our use of cookies changes or if
              legal requirements evolve. The “Last updated” date at the top of the
              page will always indicate the latest version.
            </p>
          </section>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default CookiesPage;