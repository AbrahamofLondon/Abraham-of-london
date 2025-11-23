// pages/privacy.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { getPageTitle, siteConfig } from "@/lib/siteConfig";

const PrivacyPage: NextPage = () => {
  const pageTitle = "Privacy";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="How Abraham of London collects, uses, and protects personal information across this platform and related services."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16 lg:py-20 text-sm leading-relaxed text-gray-200">
        <header className="mb-10 border-b border-gold/30 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Governance · Privacy
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-gold/70">
            This Privacy Policy explains how we handle personal information at
            Abraham of London, across this site and related services. It is
            written in plain language so you can understand what we do and what
            we don&apos;t.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Last updated: {new Date().getFullYear()}
          </p>
        </header>

        {/* 1. Who we are */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            1. Who we are
          </h2>
          <p>
            &quot;Abraham of London&quot; refers to a family of platforms and
            ventures led by Abraham Adaramola, including but not limited to
            public writing, events, and related advisory and community work.
          </p>
          <p>
            For the purposes of data protection, the primary contact for this
            site is:
          </p>
          <ul className="ml-5 list-disc space-y-1 text-gray-200">
            <li>Abraham of London (United Kingdom)</li>
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
        </section>

        {/* 2. What this policy covers */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            2. What this policy covers
          </h2>
          <p>This policy applies to:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>This website and its content.</li>
            <li>
              Email communications, including newsletters (via Buttondown) and
              transactional emails (via Resend or similar providers).
            </li>
            <li>
              Contact form submissions and event registrations processed through
              this site.
            </li>
          </ul>
          <p>
            It does not replace tailored contractual terms for specific paid
            engagements, which may contain additional privacy or confidentiality
            obligations.
          </p>
        </section>

        {/* 3. Information we collect */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            3. Information we collect
          </h2>
          <p>We collect information in three main ways:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Information you provide directly</strong> – for example:
              <ul className="ml-5 mt-1 list-disc space-y-1 text-gray-200">
                <li>Newsletter sign-ups (name, email, preferences).</li>
                <li>
                  Contact form submissions (name, email, subject, message
                  content).
                </li>
                <li>
                  Event or consultation enquiries (basic personal and
                  organisational details).
                </li>
              </ul>
            </li>
            <li>
              <strong>Usage and analytics data</strong> – high-level information
              about how you interact with the site (pages visited, time on
              page, referrer) via analytics tools or server logs.
            </li>
            <li>
              <strong>Transactional / system data</strong> – e.g. confirmation
              emails, subscription status, or basic engagement metrics such as
              opens and clicks for newsletters.
            </li>
          </ul>
        </section>

        {/* 4. How we use your information */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            4. How we use your information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Send newsletters and editorial content you have requested.</li>
            <li>Respond to enquiries and manage event or call requests.</li>
            <li>
              Improve content, structure, and usability of the site based on
              aggregated behaviour.
            </li>
            <li>
              Maintain appropriate records for governance, risk, and compliance
              where necessary.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data and we do{" "}
            <strong>not</strong> share it with third parties for their own
            marketing.
          </p>
        </section>

        {/* 5. Legal bases */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            5. Legal bases for processing
          </h2>
          <p>
            Where applicable law (including UK GDPR) requires a legal basis for
            processing, we typically rely on:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Consent</strong> – for example, where you subscribe to a
              newsletter.
            </li>
            <li>
              <strong>Legitimate interests</strong> – e.g. maintaining site
              security, improving content, or keeping basic communication
              records where this does not override your rights.
            </li>
            <li>
              <strong>Contractual necessity</strong> – where processing is
              required to enter into or perform a contract or agreed
              engagement.
            </li>
          </ul>
        </section>

        {/* 6. Cookies & tracking */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            6. Cookies & tracking technologies
          </h2>
          <p>
            We may use cookies and similar technologies to support basic site
            functionality, analytics, and security. For a more detailed view of
            the types of cookies in use, and your options, please see our{" "}
            <Link
              href="/cookies"
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              Cookie Policy
            </Link>
            .
          </p>
          <p>
            You can typically control cookies via your browser settings, and in
            some cases via on-site controls where implemented.
          </p>
        </section>

        {/* 7. Email providers: Buttondown & Resend */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            7. Email delivery: Buttondown & Resend
          </h2>
          <p>
            We use third-party services to handle email delivery and list
            management, including:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Buttondown</strong> – for newsletters and curated email
              dispatches.
            </li>
            <li>
              <strong>Resend</strong> – for transactional or system emails (for
              example, confirmations, notifications, or one-off messages from
              forms).
            </li>
          </ul>
          <p>
            These providers process your email address (and sometimes associated
            engagement data such as opens or clicks) so we can understand what
            is useful and manage subscriptions effectively.
          </p>
          <p>
            You can unsubscribe from newsletters at any time by using the link
            included in each email. Transactional or service messages may
            continue where reasonably necessary (for example, a confirmation of
            a request you initiated).
          </p>
        </section>

        {/* 8. Sharing and transfers */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            8. When we share information
          </h2>
          <p>
            We may share limited personal information with trusted service
            providers who support this site and related work, such as:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Hosting and infrastructure providers.</li>
            <li>Email and newsletter delivery platforms.</li>
            <li>Analytics or security tools.</li>
          </ul>
          <p>
            Where such sharing occurs, it is done on a need-to-know basis and
            under appropriate contractual safeguards where required by law.
          </p>
        </section>

        {/* 9. Data retention */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            9. How long we keep your information
          </h2>
          <p>
            We keep personal information only for as long as reasonably
            necessary for the purposes described in this policy, or as required
            by law, regulation, or good governance practice.
          </p>
          <p>Broadly:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Newsletter data is retained while you remain subscribed and for a
              limited period afterwards for audit and suppression purposes.
            </li>
            <li>
              Contact form submissions and related correspondence may be kept as
              part of our communication records and risk management, especially
              where serious matters have been discussed.
            </li>
          </ul>
        </section>

        {/* 10. Your rights */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            10. Your rights
          </h2>
          <p>
            Depending on your location and applicable law, you may have rights
            such as:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Access to the personal data we hold about you.</li>
            <li>Correction of inaccurate or incomplete data.</li>
            <li>Erasure of certain data, subject to legal obligations.</li>
            <li>
              Restriction of processing in certain circumstances, or objection
              to specific uses.
            </li>
            <li>
              Portability of data you provided, where technically feasible and
              legally required.
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              {siteConfig.email}
            </a>
            . We may need to confirm your identity before actioning a request.
          </p>
        </section>

        {/* 11. Security */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            11. Security
          </h2>
          <p>
            We take reasonable steps to protect personal information from
            unauthorised access, loss, or misuse. No system is perfectly
            secure, but we aim for sensible, proportionate safeguards for the
            scale and sensitivity of the data we handle.
          </p>
          <p>
            For more detail on our approach, see our{" "}
            <Link
              href="/security"
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              Security Overview
            </Link>
            , which outlines our general stance on security, resilience, and
            responsible handling of systems.
          </p>
        </section>

        {/* 12. Children */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            12. Children
          </h2>
          <p>
            This site is primarily aimed at adults. We do not knowingly collect
            personal information from children without appropriate parental or
            guardian involvement. If you believe a child has provided us with
            personal information without consent, please contact us and we will
            review promptly.
          </p>
        </section>

        {/* 13. Changes */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            13. Changes to this policy
          </h2>
          <p>
            We may update this policy from time to time to reflect changes in
            law, practice, or the services we offer. The &quot;Last updated&quot;
            date above reflects the most recent revision.
          </p>
          <p>
            Where changes are significant, we may highlight them on the site or
            via email where appropriate.
          </p>
        </section>

        {/* 14. Contact */}
        <section className="mb-12 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            14. Contact and concerns
          </h2>
          <p>
            If you have questions or concerns about this policy or how your data
            is handled, you can contact:
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
            This document is for information only and does not constitute legal
            advice. Where you require formal legal guidance, you should consult
            a qualified professional.
          </p>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default PrivacyPage;