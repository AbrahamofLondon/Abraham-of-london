// pages/security.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const SecurityPage: NextPage = () => {
  return (
    <Layout title="Security Policy">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Governance · Security
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Security Policy
            </h1>
            <p className="text-sm text-gold/70">
              Last updated: {new Date().toLocaleDateString("en-GB")}
            </p>
            <p className="mt-2 text-sm text-gray-200">
              This Security Policy summarises how we protect the Abraham of London
              platform and the limited personal data we process.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. Approach to Security
            </h2>
            <p className="text-sm text-gray-200">
              Security is treated as a non-negotiable, not an afterthought. The
              platform is deliberately lean: fewer moving parts, fewer places for
              things to go wrong, and minimal personal data collected.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. Technical Measures
            </h2>
            <p className="text-sm text-gray-200">
              We implement a range of technical and organisational measures:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>HTTPS enforced across the site.</li>
              <li>Security headers configured via the hosting platform.</li>
              <li>Regular dependency updates and security patches.</li>
              <li>Limited access to deployment and configuration systems.</li>
              <li>Use of reputable infrastructure (Netlify/Vercel, Resend, Buttondown).</li>
              <li>Distinction between public content and private configuration.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. Data Minimisation
            </h2>
            <p className="text-sm text-gray-200">
              The best way to protect data is not to collect what you do not need.
              We:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Avoid asking for unnecessary personal information.</li>
              <li>Do not create user accounts or passwords on this site.</li>
              <li>Use simple forms for contact and newsletter, not invasive profiling.</li>
              <li>Prefer privacy-first analytics where possible.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Email & Communications
            </h2>
            <p className="text-sm text-gray-200">
              Transactional and system emails are sent via{" "}
              <span className="font-semibold text-cream">Resend</span>, which uses
              modern infrastructure, encryption in transit, and robust delivery
              practices.
            </p>
            <p className="text-sm text-gray-200">
              Newsletter delivery is handled by{" "}
              <span className="font-semibold text-cream">Buttondown</span>, a
              specialist email provider with a strong privacy focus.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. Incident Response
            </h2>
            <p className="text-sm text-gray-200">
              If we become aware of a security incident that affects your personal
              data, we will:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Investigate promptly to understand the impact.</li>
              <li>Contain and remediate the issue as quickly as possible.</li>
              <li>
                Where required by law, notify affected individuals and relevant
                authorities.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              6. Your Responsibilities
            </h2>
            <p className="text-sm text-gray-200">
              While we take reasonable steps on our side, security is a shared
              responsibility. We ask that you:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Avoid sending highly sensitive information (e.g. financial details,
                medical records) via the contact form or email.
              </li>
              <li>Verify unusual or unexpected requests before acting.</li>
              <li>
                Contact us if you suspect fraudulent activity in our name, so we
                can review and respond.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              7. Updates
            </h2>
            <p className="text-sm text-gray-200">
              Security practice evolves. This statement reflects the current
              operating posture and may be updated as tools, vendors, and
              regulations change. The “Last updated” date will always show the
              latest version.
            </p>
          </section>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default SecurityPage;