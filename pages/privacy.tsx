// pages/privacy.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { getPageTitle, siteConfig } from "@/lib/imports";

const PrivacyPage: NextPage = () => {
  const pageTitle = "Privacy";
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
          content="How Abraham of London collects, uses, and protects personal information across this platform and related services."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12 text-sm leading-relaxed text-gray-200 sm:py-16 lg:py-20">
        <header className="mb-10 border-b border-gold/30 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Governance · Privacy
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-gold/70">
            This Privacy Policy explains how we handle personal information at
            Abraham of London across this site and related services. It is
            written in plain language so you can see what we do, what we
            don&apos;t, and what your options are.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* 1. Who we are */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            1. Who we are
          </h2>
          <p>
            &quot;Abraham of London&quot; refers to a family of platforms and
            ventures led by Abraham Adaramola, including (but not limited to)
            public writing, events, advisory work, and community initiatives.
          </p>
          <p>
            For data protection purposes, the primary contact for this site is:
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
              Email communications, including newsletters and campaign updates
              (via services such as Mailchimp) and transactional emails (via
              Resend or similar providers).
            </li>
            <li>
              Contact form submissions, teaser requests, and event or call
              enquiries processed through this site.
            </li>
            <li>
              <strong>Inner Circle registration and access systems</strong>,
              including membership management and cryptographic key issuance.
            </li>
          </ul>
          <p>
            It does <strong>not</strong> replace written terms for specific paid
            engagements or advisory relationships. Where a formal contract is in
            place, its privacy and confidentiality terms will take precedence
            for that work.
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
              <strong>Information you provide directly</strong>, for example:
              <ul className="ml-5 mt-1 list-disc space-y-1 text-gray-200">
                <li>
                  Newsletter sign-ups (name, email, high-level preferences).
                </li>
                <li>
                  Contact form submissions (name, email, subject, and what you
                  choose to write).
                </li>
                <li>
                  Event or consultation enquiries (basic personal and
                  organisational details you share).
                </li>
                <li>
                  <strong>Inner Circle registration</strong> (email and name for
                  access key issuance and community management).
                </li>
              </ul>
            </li>
            <li>
              <strong>Usage and analytics data</strong> - high-level information
              about how you interact with the site (pages visited, approximate
              timings, referrer) via privacy-aware analytics tools or server
              logs.
            </li>
            <li>
              <strong>Transactional / system data</strong> - for example,
              confirmation emails, subscription status, and basic newsletter
              engagement metrics such as opens and clicks.
            </li>
          </ul>
          <p>
            We do not deliberately collect sensitive categories of personal data
            (such as health information) through this site. If you choose to
            send such information anyway, we will handle it as carefully as we
            reasonably can, but you should avoid including highly sensitive
            details in ordinary contact forms.
          </p>
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
              <strong>Manage Inner Circle access</strong> - issue cryptographic
              access keys, verify membership status, and provide exclusive
              content to registered members.
            </li>
            <li>
              Improve the structure, clarity, and usefulness of the site based
              on aggregated, non-identifying behaviour patterns.
            </li>
            <li>
              Maintain appropriate records for governance, risk management, and
              compliance where this is sensible and proportionate.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data, and we do{" "}
            <strong>not</strong> share it with third parties for their own
            independent marketing.
          </p>
        </section>

        {/* 5. Legal bases */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            5. Legal bases for processing
          </h2>
          <p>
            Where UK GDPR or similar data protection laws apply, we rely on one
            or more of the following legal bases:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Consent</strong> - for example, where you subscribe to a
              newsletter or explicitly request a teaser or resource by email.
            </li>
            <li>
              <strong>Legitimate interests</strong> - maintaining site security,
              improving content, keeping basic communication records, or
              following up on serious matters, where this does not override your
              rights and expectations.
            </li>
            <li>
              <strong>Contractual necessity</strong> - where processing is
              required to enter into or perform a contract or agreed engagement
              with you.
            </li>
            <li>
              <strong>Inner Circle operations</strong> - processing necessary
              for providing exclusive content and community access to registered
              members.
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
            functionality, security, and analytics. These are kept to what is
            necessary and proportionate for the level of service being offered.
          </p>
          <p>
            For a more detailed view of the types of cookies in use, and your
            options, please see our{" "}
            <Link
              href="/cookies"
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              Cookie Policy
            </Link>
            .
          </p>
          <p>
            You can usually control cookies through your browser settings and,
            where implemented, via on-site controls.
          </p>
        </section>

        {/* 7. Email providers */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            7. Email delivery and list management
          </h2>
          <p>
            We use specialist third-party services to handle email delivery and
            list management, including (for example):
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Mailchimp</strong> - for newsletters and curated email
              dispatches.
            </li>
            <li>
              <strong>Resend</strong> - for transactional or system emails (such
              as confirmations, teaser delivery, or internal notifications from
              forms).
            </li>
            <li>
              <strong>Inner Circle access emails</strong> - cryptographic key
              delivery and exclusive content notifications via secure email
              providers.
            </li>
          </ul>
          <p>
            These providers process your email address and basic engagement data
            (such as opens and clicks) so we can deliver messages, manage
            opt-outs, and understand what is useful.
          </p>
          <p>
            You can unsubscribe from newsletters at any time using the link in
            each email. Transactional or service messages may continue where
            reasonably necessary (for example, to confirm a request you
            initiated).
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
            <li>Security tools and analytics services.</li>
          </ul>
          <p>
            Where sharing occurs, it is done on a need-to-know basis and, where
            required by law, under appropriate contractual terms and safeguards.
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
            by law, regulation, or sensible governance practice.
          </p>
          <p>In broad terms:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Newsletter data is retained while you remain subscribed and for a
              limited period afterwards for audit, suppression, and
              record-keeping.
            </li>
            <li>
              Contact form submissions and related correspondence may be kept as
              part of communication records and risk management, particularly
              where serious or complex matters have been raised.
            </li>
            <li>
              <strong>Inner Circle membership data</strong> is retained for the
              duration of your active membership plus a reasonable period for
              audit and compliance purposes. Cryptographic keys and access
              records are subject to automatic data retention policies.
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
            <li>
              Erasure of certain data, subject to legal and governance
              obligations.
            </li>
            <li>
              Restriction of processing in specific circumstances, or objection
              to particular uses.
            </li>
            <li>
              Portability of certain data you have provided, where technically
              feasible and legally required.
            </li>
            <li>Withdrawal of consent for processing based on consent.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              {siteConfig.email}
            </a>
            . We may need to verify your identity before acting on a request.
          </p>
        </section>

        {/* 11. Security */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            11. Security
          </h2>
          <p>
            We take reasonable steps to protect personal information from
            unauthorized access, loss, or misuse, using a combination of
            technical and organizational measures. No system is perfectly
            secure, but security is treated as a core design concern, not an
            afterthought.
          </p>
          <p>
            For more detail on our stance and controls, see the{" "}
            <Link
              href="/security"
              className="text-softGold underline underline-offset-2 hover:text-amber-200"
            >
              Security Policy
            </Link>
            , which sets out our approach to bot protection, rate limiting,
            logging, and infrastructure security.
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
            guardian involvement. If you believe a child has provided personal
            information without consent, please contact us so we can review and
            act where appropriate.
          </p>
        </section>

        {/* 13. Changes */}
        <section className="mb-8 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            13. Changes to this policy
          </h2>
          <p>
            We may update this policy to reflect changes in law, practice, or
            the services we offer. The &quot;Last updated&quot; date above shows
            the most recent revision.
          </p>
          <p>
            Where changes are significant, we may highlight them on the site or,
            if appropriate, via email.
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
            advice. If you require formal legal guidance, you should consult an
            appropriately qualified professional.
          </p>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default PrivacyPage;



