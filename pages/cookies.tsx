// pages/terms.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { getPageTitle, siteConfig } from "@/lib/imports";

const TermsPage: NextPage = () => {
  const pageTitle = "Terms";
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB"),
    []
  );

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Terms of use for Abraham of London's website, content, and related services."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12 text-sm leading-relaxed text-gray-200 sm:py-16 lg:py-20">
        <header className="mb-10 border-b border-gold/30 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Governance · Terms
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 max-w-2xl text-gold/70">
            These Terms govern your use of this site and its content. By using
            this site, you agree to act with good faith, common sense, and
            respect for the boundaries set out below.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* 1. Scope */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            1. Scope of these Terms
          </h2>
          <p>These Terms apply to:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              This website, its content, and any resources made available.
            </li>
            <li>
              Any newsletters or editorial email content sent through this site
              to which you have subscribed.
            </li>
            <li>
              Publicly available information about events, gatherings, and
              projects under the Abraham of London banner.
            </li>
            <li>
              <strong>Inner Circle membership</strong> – access to exclusive
              content and community features through cryptographic key systems.
            </li>
          </ul>
          <p>
            Separate written agreements may apply to specific advisory,
            consulting, or partnership work. Where there is a conflict, those
            agreements override these Terms for that specific engagement.
          </p>
        </section>

        {/* 2. Not legal or financial advice */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            2. No legal, financial, or professional advice
          </h2>
          <p>
            Content on this site is provided for general information,
            reflection, and education. It is <strong>not</strong> legal,
            financial, immigration, medical, or other regulated professional
            advice.
          </p>
          <p>
            Decisions with legal, financial, or life-altering consequences
            should be made with proper professional counsel who understands your
            specific circumstances. You remain responsible for the choices you
            make.
          </p>
        </section>

        {/* 3. Acceptable use */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            3. Acceptable use
          </h2>
          <p>By using this site, you agree that you will not:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Abuse, attack, or attempt to compromise the site or systems.
            </li>
            <li>
              Scrape, harvest, or mine content or data in a way that breaches
              applicable laws, this policy, or basic decency.
            </li>
            <li>
              Impersonate others, misrepresent your identity, or submit content
              that is knowingly false, defamatory, or malicious.
            </li>
            <li>
              Use any resources here to promote hatred, incitement, or unlawful
              activity.
            </li>
            <li>
              <strong>Share Inner Circle access keys</strong> or attempt to
              circumvent membership controls through unauthorized means.
            </li>
          </ul>
          <p>
            If behaviour crosses these lines, access may be restricted and,
            where necessary, relevant authorities or platforms may be informed.
          </p>
        </section>

        {/* 4. Intellectual property */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            4. Intellectual property
          </h2>
          <p>
            Unless otherwise stated, the content on this site — including text,
            images, frameworks, and branding — is the intellectual property of
            Abraham of London or its licensors.
          </p>
          <p>
            <strong>Inner Circle content</strong> is provided exclusively to
            registered members and may not be redistributed, reproduced, or
            shared with non-members without explicit written permission.
          </p>
          <p>
            You may quote or reference short excerpts with appropriate credit
            and, where practical, a link back to the original source. Wholesale
            copying, republication, or commercial exploitation of content
            without explicit permission is not permitted.
          </p>
        </section>

        {/* 5. Third-party services */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            5. Third-party services and links
          </h2>
          <p>
            This site may link to or integrate with third-party services (for
            example, Mailchimp for newsletters, Resend for email delivery,
            analytics platforms, or event tools).
          </p>
          <p>
            These services operate under their own terms and privacy policies.
            You are responsible for reviewing those before using any linked
            services or platforms.
          </p>
        </section>

        {/* 6. Privacy link */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            6. Privacy and cookies
          </h2>
          <p>
            How we collect, use, and protect your personal information is
            described in our{" "}
            <Link
              href="/privacy"
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              Privacy Policy
            </Link>
            . Our approach to cookies and similar technologies is explained in
            our{" "}
            <Link
              href="/cookies"
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              Cookie Policy
            </Link>
            .
          </p>
          <p>
            For technical controls, you can also review the{" "}
            <Link
              href="/security"
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              Security Policy
            </Link>
            , which sits alongside these Terms.
          </p>
        </section>

        {/* 7. Disclaimers & limitation */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            7. Disclaimers and limitation of liability
          </h2>
          <p>
            While we aim for accuracy and usefulness, this site is provided on
            an &quot;as is&quot; and &quot;as available&quot; basis. We do not
            guarantee:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Uninterrupted or error-free operation of the site.</li>
            <li>
              That content will always be complete, current, or suitable for
              your specific situation.
            </li>
            <li>
              Continuous availability of Inner Circle features or content.
            </li>
          </ul>
          <p>
            To the fullest extent permitted by law, we are not liable for any
            indirect, consequential, or special loss arising from your use of
            this site or reliance on its content. Where liability cannot be
            excluded, it is limited to the minimum extent permissible under
            applicable law.
          </p>
        </section>

        {/* 8. Changes to the site */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            8. Changes, suspension, or withdrawal
          </h2>
          <p>
            We may update content, change functionality, or suspend or withdraw
            parts of the site at any time for operational, legal, or strategic
            reasons. Where changes are significant, we will act with reasonable
            care and avoid unnecessary disruption.
          </p>
          <p>
            <strong>Inner Circle operations</strong> may be modified, suspended,
            or discontinued with reasonable notice to affected members.
          </p>
        </section>

        {/* 9. Governing law */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            9. Governing law and jurisdiction
          </h2>
          <p>
            These Terms and any disputes arising out of or relating to your use
            of this site are governed by the laws of England and Wales, without
            regard to conflict of law principles.
          </p>
          <p>
            Where court proceedings are necessary, the courts of England and
            Wales will have non-exclusive jurisdiction, subject to any
            protections you may have as a consumer under local law.
          </p>
        </section>

        {/* 10. Contact */}
        <section className="mb-12 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            10. Contact about these Terms
          </h2>
          <p>
            If you have questions about these Terms or believe they need to be
            clarified in light of a specific situation, contact:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Email:{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                {siteConfig.email}
              </a>
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            These Terms are intended to be firm but reasonable. If you genuinely
            believe a provision is unclear or unfair in practice, the first step
            is a measured conversation rather than escalation.
          </p>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default TermsPage;


