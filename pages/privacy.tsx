// pages/privacy.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const PrivacyPage: NextPage = () => {
  return (
    <Layout title="Privacy Policy">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Governance · Data Protection
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-sm text-gold/70">
              Last updated: {new Date().toLocaleDateString("en-GB")}
            </p>
            <p className="mt-2 text-sm text-gray-200">
              Abraham of London (“we”, “us”, “our”) is committed to handling your
              personal information with integrity, restraint, and transparency.
              This policy explains what we collect, how we use it, and the rights
              you have under UK data protection law.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. Who We Are
            </h2>
            <p className="text-sm text-gray-200">
              Abraham of London is a UK-based personal brand and advisory
              platform focused on faith, leadership, fatherhood, and strategy.
              For the purposes of data protection law, we act as the{" "}
              <strong className="font-semibold text-cream">
                Data Controller
              </strong>{" "}
              for this website and associated communications.
            </p>
            <p className="text-sm text-gray-200">
              <span className="font-semibold text-cream">Contact:</span>{" "}
              info@abrahamoflondon.org
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. What We Collect
            </h2>
            <p className="text-sm text-gray-200">
              We collect the minimum data needed to operate the platform and stay
              in touch with people who intentionally engage.
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                <span className="font-semibold text-cream">
                  Information you provide directly:
                </span>{" "}
                name, email address, messages through contact forms, newsletter
                sign-ups, event registrations, and consultation requests.
              </li>
              <li>
                <span className="font-semibold text-cream">
                  Information collected automatically:
                </span>{" "}
                IP address, browser and device details, pages visited, time spent
                on site, and referring URLs.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              We do <strong className="font-semibold text-cream">not</strong>{" "}
              intentionally collect special category data (e.g. health, religion,
              political opinions) via this website. If you choose to disclose such
              information in a message, you do so voluntarily.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. How We Use Your Information
            </h2>
            <p className="text-sm text-gray-200">
              We use your personal data for clear and limited purposes:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>To send newsletters and editorial updates you subscribed to.</li>
              <li>
                To deliver transactional emails (e.g. confirmation emails, resource
                links) via{" "}
                <span className="font-semibold text-cream">Resend</span>.
              </li>
              <li>
                To manage mailing lists and campaigns via{" "}
                <span className="font-semibold text-cream">Buttondown</span>.
              </li>
              <li>
                To respond to enquiries, speaking requests, or consulting
                approaches.
              </li>
              <li>
                To maintain security, monitor performance, and improve the user
                experience.
              </li>
              <li>To comply with legal, regulatory, or accounting obligations.</li>
            </ul>
            <p className="text-sm text-gray-200">
              We do <strong className="font-semibold text-cream">not</strong> sell,
              rent, or trade your personal data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Legal Bases for Processing
            </h2>
            <p className="text-sm text-gray-200">
              Under UK GDPR, we rely on the following legal bases:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                <span className="font-semibold text-cream">Consent:</span> for
                newsletters and non-essential updates.
              </li>
              <li>
                <span className="font-semibold text-cream">Contract:</span> when
                you download resources, register for an event, or request services.
              </li>
              <li>
                <span className="font-semibold text-cream">
                  Legitimate interests:
                </span>{" "}
                to run the platform, understand what’s being used, and protect
                against abuse, in a way that does not override your rights.
              </li>
              <li>
                <span className="font-semibold text-cream">
                  Legal obligations:
                </span>{" "}
                where we must retain records or respond to lawful requests.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. Service Providers (Processors)
            </h2>
            <p className="text-sm text-gray-200">
              We use trusted third-party processors to operate the platform:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                <span className="font-semibold text-cream">Resend</span> – sending
                transactional and system emails.
              </li>
              <li>
                <span className="font-semibold text-cream">Buttondown</span> –
                managing email newsletter subscriptions.
              </li>
              <li>
                <span className="font-semibold text-cream">
                  Hosting & infrastructure
                </span>{" "}
                – such as Netlify or Vercel for serving the website.
              </li>
              <li>
                <span className="font-semibold text-cream">Analytics</span> – such
                as Plausible (privacy-first) and/or Google Analytics for
                high-level traffic insights.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              These providers process data on our behalf under written terms and
              are expected to maintain appropriate security and compliance
              standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              6. International Transfers
            </h2>
            <p className="text-sm text-gray-200">
              Some service providers may process data outside the UK. Where this
              happens, we rely on mechanisms such as adequacy decisions, Standard
              Contractual Clauses (SCCs), or equivalent safeguards provided by the
              vendor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              7. Data Retention
            </h2>
            <p className="text-sm text-gray-200">
              We keep personal data only for as long as it is reasonably required:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Newsletter subscriptions – until you unsubscribe or your address
                bounces repeatedly.
              </li>
              <li>
                Contact enquiries – normally up to 24 months, unless they form
                part of an ongoing engagement.
              </li>
              <li>
                Analytics – in line with retention periods set in the analytics
                tool.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              You can request deletion sooner where applicable (see your rights
              below).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              8. Your Rights
            </h2>
            <p className="text-sm text-gray-200">
              Under UK data protection law, you have the right to:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Request access to the personal data we hold about you.</li>
              <li>Ask us to correct inaccurate or incomplete data.</li>
              <li>Request deletion of your personal data in certain cases.</li>
              <li>
                Object to or request restriction of processing in specific
                circumstances.
              </li>
              <li>
                Withdraw consent at any time where processing is based on consent.
              </li>
              <li>
                Request data portability for information you have provided to us
                where technically feasible.
              </li>
            </ul>
            <p className="text-sm text-gray-200">
              To exercise any of these rights, contact{" "}
              <a
                href="mailto:info@abrahamoflondon.org"
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                info@abrahamoflondon.org
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              9. Cookies & Tracking
            </h2>
            <p className="text-sm text-gray-200">
              See our{" "}
              <a
                href="/cookies"
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                Cookie Policy
              </a>{" "}
              for details on how we use cookies and similar technologies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              10. Security
            </h2>
            <p className="text-sm text-gray-200">
              We use appropriate technical and organisational measures to protect
              your data, including HTTPS, restricted access, and secure third-party
              providers. See our{" "}
              <a
                href="/security"
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                Security Policy
              </a>{" "}
              for more detail.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              11. Changes to This Policy
            </h2>
            <p className="text-sm text-gray-200">
              We may update this Privacy Policy from time to time. The “Last
              updated” date at the top of this page will always show the current
              version. Significant changes may also be signposted in the
              newsletter or via a site notice.
            </p>
          </section>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default PrivacyPage;