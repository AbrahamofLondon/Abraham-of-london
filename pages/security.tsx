import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const LAST_UPDATED = "30 April 2026";

const sections = [
  "Security Model",
  "Access And Session Controls",
  "Abuse Prevention",
  "Data Handling",
  "User Responsibilities",
  "Reporting",
];

const SecurityPage: NextPage = () => {
  const securityEmail = "support@abrahamoflondon.org";
  const securitySubject = "Responsible Disclosure Report";

  return (
    <Layout title="Security Policy | Abraham of London">
      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        <header className="mb-16 border-b border-white/10 pb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Governance // Security
            </span>
          </div>
          <h1 className="mb-6 font-serif text-4xl font-medium italic text-white md:text-5xl">
            Security Policy
          </h1>
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
            <p className="max-w-lg text-sm font-light leading-relaxed text-zinc-400">
              Security is managed as an operating discipline. This page describes the controls we
              use today, the limits of those controls, and how to report a concern.
            </p>
            <div className="text-right">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                Last Updated: {LAST_UPDATED}
              </span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <aside className="sticky top-32 hidden h-fit lg:col-span-3 lg:block">
            <nav className="space-y-4">
              {sections.map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="font-mono text-[8px] text-amber-500/40">
                    0{index + 1}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {item}
                  </span>
                </div>
              ))}
            </nav>
          </aside>

          <div className="space-y-14 lg:col-span-9">
            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">1. Security Model</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                The platform uses layered controls rather than any single security measure. Those
                controls may include server-side validation, access gating, session controls,
                encrypted transport, environment isolation, audit logging, and least-privilege
                operational access.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Parts of the site are static or cache-friendly, while other parts are dynamic and
                stateful. We do not represent the system as invulnerable, and no internet-facing
                service can guarantee complete security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">
                2. Access And Session Controls
              </h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Access-controlled areas use a combination of server-side checks, session management,
                entitlement records, and short-lived continuity mechanisms. Some client-side state
                is stored in your browser to preserve progress, return access, or product
                continuity.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                We avoid storing long-lived access tokens in browser storage where that can
                reasonably be avoided. Legacy or transitional flows may still use browser storage
                for non-sensitive continuity data such as progress, reminders, and return-state
                markers.
              </p>
            </section>

            <section className="space-y-4 rounded-sm border border-white/5 bg-white/[0.02] p-6">
              <h2 className="font-serif text-2xl italic text-white">3. Abuse Prevention</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Selected public forms and sensitive interaction points are protected by
                rate-limiting, request validation, bot-detection logic, and reCAPTCHA where
                enabled. These measures are applied according to operational risk, not necessarily
                on every page.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                We may also use timing signals, duplicate-pattern checks, request metadata, and
                other abuse indicators to protect the service and reduce automated misuse.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">4. Data Handling</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Security-sensitive data is handled according to the operational needs of the
                feature. In newer decision continuity flows, email identity data may be encrypted
                at rest and linked to decision records through hashed lookups or controlled session
                links. Not every legacy surface has been migrated to that pattern yet.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Payment processing is handled entirely by Stripe. We do not store card numbers,
                CVVs, or full payment credentials on our servers. Stripe processes payments
                under its own PCI-DSS-compliant security controls.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                We minimise internal access where practical, but authorised operators, service
                providers, and technical staff may still need limited access to investigate service
                issues, fulfil requests, or respond to abuse or legal obligations.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">
                5. Your Security Responsibilities
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-sm font-light leading-relaxed text-zinc-400">
                <li>Protect any access links, invitation links, or paid-resource access credentials you receive.</li>
                <li>Do not submit unnecessary confidential, medical, or regulated financial information through general forms unless we specifically ask for it through an appropriate channel.</li>
                <li>Use a current browser and keep your own device and accounts secure.</li>
                <li>Contact us promptly if you believe your access or data may have been exposed.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">6. Reporting And Response</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                If we become aware of a security incident, we investigate, contain, and remediate
                according to the nature of the event. Where required by law, we will notify
                affected parties or regulators.
              </p>
              <div className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="mb-2 font-mono text-[10px] uppercase text-zinc-500">
                  Security Contact
                </p>
                <p className="text-sm text-white">
                  Report suspected vulnerabilities or misuse to{" "}
                  <a
                    className="text-amber-500 underline underline-offset-4"
                    href={`mailto:${securityEmail}?subject=${encodeURIComponent(securitySubject)}`}
                  >
                    {securityEmail}
                  </a>
                  {" "}with the subject "{securitySubject}".
                </p>
              </div>
            </section>
          </div>
        </section>

        <div className="mt-32 border-t border-white/5 pt-12">
          <PolicyFooter isDark />
        </div>
      </main>
    </Layout>
  );
};

export default SecurityPage;
