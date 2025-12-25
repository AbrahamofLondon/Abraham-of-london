// pages/security.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const SecurityPage: NextPage = () => {
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB"),
    []
  );

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
            <p className="text-sm text-gold/70">Last updated: {lastUpdated}</p>
            <p className="mt-2 text-sm text-gray-200">
              This Security Policy sets out how we protect the Abraham of London
              platform and the data you choose to share with us. Security is
              treated as a governance issue, not a cosmetic feature.
            </p>
          </header>

          {/* 1. Security by Design */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              1. Security by Design
            </h2>
            <p className="text-sm text-gray-200">
              The platform is engineered with defence-in-depth. We combine
              secure infrastructure, hardened application code, and conservative
              data practices to reduce the attack surface and limit blast
              radius.
            </p>
            <p className="text-sm text-gray-200">
              Controls are implemented at multiple layers: browser, edge,
              application, and service integrations. New features are assessed
              for security impact before they ship.
            </p>
          </section>

          {/* 2. Bot Protection & reCAPTCHA */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              2. Bot Protection & reCAPTCHA v3
            </h2>
            <p className="text-sm text-gray-200">
              Public forms are a primary attack vector. We apply a combination
              of behavioural and structural controls to protect them:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Google reCAPTCHA v3 on key flows (contact, newsletter, teaser
                requests), evaluated on the server.
              </li>
              <li>
                Action-specific scoring and thresholds to distinguish human use
                from scripted abuse.
              </li>
              <li>
                Multiple honeypot fields designed to attract and silently
                neutralise automated submissions.
              </li>
              <li>
                Normal users see no intrusive challenges; suspicious traffic is
                quietly throttled or rejected.
              </li>
            </ul>
          </section>

          {/* 3. Rate Limiting */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              3. Rate Limiting & Abuse Controls
            </h2>
            <p className="text-sm text-gray-200">
              To protect availability and prevent brute-force style abuse, the
              platform applies explicit rate limits:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                IP-based and email-based rate limiting across sensitive
                endpoints.
              </li>
              <li>
                Tight limits on contact, newsletter, and subscription flows
                (typically 3-5 attempts per 15 minutes).
              </li>
              <li>
                <strong>Inner Circle registration protection</strong> - dual
                IP-based (20 attempts per 15 minutes) and email-based (3
                attempts per hour) rate limiting to prevent abuse.
              </li>
              <li>
                Proper HTTP <code>429</code> responses with{" "}
                <code>Retry-After</code> guidance when limits are exceeded.
              </li>
              <li>
                In-memory protection as standard, with a design that can extend
                to Redis-backed distributed limits when required.
              </li>
            </ul>
          </section>

          {/* 4. Input Validation */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              4. Input Validation & Sanitisation
            </h2>
            <p className="text-sm text-gray-200">
              Untrusted input is treated as hostile by default. All user data
              passing into the system is validated, constrained, and sanitised:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Rigorous email validation plus rejection of known disposable
                domains on key flows.
              </li>
              <li>
                Length limits and character checks for names, subjects, and free
                text messages.
              </li>
              <li>
                Systematic escaping of content used in emails and logs to reduce
                XSS and injection risk.
              </li>
              <li>
                Strong typing across the codebase (TypeScript) to reduce
                malformed data and logic errors.
              </li>
              <li>
                <strong>Cryptographic validation</strong> for Inner Circle
                access keys to prevent tampering and ensure integrity.
              </li>
            </ul>
          </section>

          {/* 5. Technical Measures */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              5. Technical Security Controls
            </h2>
            <p className="text-sm text-gray-200">
              The platform is deployed on modern, reputable infrastructure with
              hardened defaults and secure transport:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>HTTPS enforcement with modern TLS configurations.</li>
              <li>
                Strict security headers, including HSTS, X-Frame-Options,
                X-Content-Type-Options, basic XSS protections, and referrer
                controls.
              </li>
              <li>
                Cross-origin isolation and restrictive cross-origin resource
                loading where supported.
              </li>
              <li>
                Controlled access to deployment, environment variables, and
                administration consoles.
              </li>
              <li>
                Hosting and email services provided by established vendors
                (Netlify, Vercel, Resend, Mailchimp and similar) with their own
                security baselines and certifications.
              </li>
            </ul>
          </section>

          {/* 6. Data Minimisation */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              6. Data Minimisation & Privacy
            </h2>
            <p className="text-sm text-gray-200">
              The most robust way to protect data is not to collect it in the
              first place. The platform is intentionally lean:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Only information strictly necessary to respond to your request
                or deliver a resource is requested.
              </li>
              <li>
                No public user accounts, passwords, or payment card data are
                stored on this site.
              </li>
              <li>
                <strong>Inner Circle privacy protection</strong> - email
                addresses are stored as SHA-256 hashes, access keys are stored
                as cryptographic hashes, and no raw personal data is retained in
                accessible formats.
              </li>
              <li>
                Security logs use anonymised IPs wherever possible, balancing
                monitoring with privacy.
              </li>
              <li>
                Data is retained only for as long as needed for the purpose for
                which it was collected.
              </li>
            </ul>
          </section>

          {/* 7. Email & Comms */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              7. Email & Communications Security
            </h2>
            <p className="text-sm text-gray-200">
              Email is handled via specialist providers with encryption in
              transit and established compliance frameworks:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                <span className="font-semibold text-cream">Resend</span> for
                transactional emails (contact acknowledgements, teaser delivery,
                internal notifications).
              </li>
              <li>
                <span className="font-semibold text-cream">Mailchimp</span> for
                newsletter and campaign delivery, with unsubscribe support and
                GDPR-aware processing.
              </li>
              <li>
                <strong>Inner Circle cryptographic key delivery</strong> -
                secure email transmission of access keys with minimal data
                exposure.
              </li>
              <li>
                Subscription flows are designed to prevent silent enrolment and
                to respect user choice.
              </li>
              <li>
                Email APIs are called over HTTPS with appropriate authentication
                and minimal payloads.
              </li>
            </ul>
          </section>

          {/* 8. Monitoring & Audit */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              8. Security Monitoring & Audit Logging
            </h2>
            <p className="text-sm text-gray-200">
              Security events are logged with enough context to investigate
              issues while avoiding unnecessary personal data:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Logging of key API activity (newsletter, subscriptions, contact,
                teaser requests) with anonymised identifiers.
              </li>
              <li>
                reCAPTCHA scores and reasons captured for security tuning and
                anomaly detection.
              </li>
              <li>
                Rate limit breaches and honeypot triggers recorded as potential
                abuse indicators.
              </li>
              <li>
                <strong>Inner Circle access monitoring</strong> - cryptographic
                key usage tracking without storing raw keys or personal data.
              </li>
              <li>
                Logs are used for operational security and troubleshooting, not
                for profiling ordinary users.
              </li>
            </ul>
          </section>

          {/* 9. Incident Response */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              9. Incident Response
            </h2>
            <p className="text-sm text-gray-200">
              If a security incident is suspected or confirmed, the response is
              structured and proportionate:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Rapid triage to confirm scope and impact.</li>
              <li>
                Containment and remediation of the underlying cause (for
                example, configuration fixes or dependency updates).
              </li>
              <li>
                Direct communication with affected parties where the impact
                warrants it.
              </li>
              <li>
                Regulatory notifications where required by applicable law,
                depending on jurisdiction and severity.
              </li>
              <li>
                Post-incident review to harden controls and prevent recurrence.
              </li>
            </ul>
          </section>

          {/* 10. User Responsibilities */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              10. Your Security Responsibilities
            </h2>
            <p className="text-sm text-gray-200">
              Some risks sit outside any website&apos;s control. You can help
              protect yourself and your information by:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>
                Not sending highly sensitive information (for example, full
                financial or medical details) through standard contact forms.
              </li>
              <li>
                Treating unexpected requests for money, credentials, or
                confidential data with scepticism, even if they appear to come
                from this brand.
              </li>
              <li>
                <strong>Protecting Inner Circle access keys</strong> - treating
                cryptographic keys as sensitive credentials and not sharing them
                publicly.
              </li>
              <li>
                Using up-to-date browsers and operating systems with security
                features enabled.
              </li>
              <li>
                Reporting suspicious emails or activity to{" "}
                <span className="font-semibold text-cream">
                  Abraham@AbrahamofLondon.com
                </span>
                .
              </li>
              <li>
                Protecting your email account with strong passwords and, where
                possible, multi-factor authentication.
              </li>
            </ul>
          </section>

          {/* 11. Continuous Improvement */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-cream">
              11. Continuous Security Improvement
            </h2>
            <p className="text-sm text-gray-200">
              Security is an ongoing discipline, not a single project. The
              platform&apos;s controls are refined over time as threats and
              standards evolve:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-gray-200">
              <li>Regular dependency and platform upgrades.</li>
              <li>
                Monitoring of relevant security advisories and industry
                guidance.
              </li>
              <li>
                Progressive hardening of headers, rate limits, logging, and bot
                detection based on observed behaviour.
              </li>
              <li>
                <strong>Cryptographic algorithm review</strong> - periodic
                assessment of hashing and key generation methods.
              </li>
              <li>
                Periodic review of this Security Policy to ensure it accurately
                reflects what is implemented.
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-200">
              Where this policy is updated, the revised version will be
              published on this page with an updated date. Material changes that
              affect how your data is handled will be highlighted in plain
              language.
            </p>
          </section>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default SecurityPage;
