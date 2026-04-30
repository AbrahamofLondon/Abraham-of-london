import Head from "next/head";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { getPageTitle, siteConfig } from "@/config/site";

const LAST_UPDATED = "30 April 2026";

const sections = [
  "Who We Are",
  "What We Collect",
  "How We Use It",
  "Email And Decision Continuity",
  "Sharing And Processors",
  "Retention",
  "Your Rights",
];

const PrivacyPage: NextPage = () => {
  const contactEmail = siteConfig.contact.email ?? "info@abrahamoflondon.org";

  return (
    <Layout title="Privacy Policy">
      <Head>
        <title>{getPageTitle("Privacy Policy")}</title>
        <meta
          name="description"
          content="Privacy policy for Abraham of London, including diagnostics, decision continuity, access controls, and data rights."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        <header className="mb-16 border-b border-white/10 pb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Governance // Privacy
            </span>
          </div>
          <h1 className="mb-6 font-serif text-4xl font-medium italic text-white md:text-5xl">
            Privacy Policy
          </h1>
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
            <p className="max-w-lg text-sm font-light leading-relaxed text-zinc-400">
              This policy explains how Abraham of London handles personal data across the site,
              diagnostic flows, access-controlled areas, contact points, and post-assessment
              continuity systems. It is written to reflect the system as it operates now.
            </p>
            <div className="text-right">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                Last Updated: {LAST_UPDATED}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
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
              <h2 className="font-serif text-2xl italic text-white">1. Who We Are</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Abraham of London is the trading and publishing identity used for this site and
                related digital services. For data protection purposes, the controller is Abraham
                Adaramola, based in London, United Kingdom.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Contact for privacy matters:{" "}
                <a
                  className="text-amber-500 underline underline-offset-4"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">2. What We Collect</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                We collect only the categories of information needed to operate the site and the
                services offered through it. Depending on how you use the site, this may include:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm font-light leading-relaxed text-zinc-400">
                <li>Contact details you provide, such as name, email address, and enquiry content.</li>
                <li>Diagnostic and decision data you enter into assessments, strategy tools, or follow-up flows.</li>
                <li>Access and entitlement data for members, purchasers, or invited users.</li>
                <li>Technical and security data such as IP-derived signals, browser information, device context, timestamps, and abuse-prevention logs.</li>
                <li>Client-side continuity data stored in your browser, including assessment progress, session state, and preference markers.</li>
              </ul>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Some newer continuity flows are designed to separate identity from decision records
                by encrypting stored email data and using hashed lookups. Some older site features
                still rely on more conventional application storage patterns while they are being
                brought into the same model.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">3. How We Use It</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                We use personal data only where there is a clear operational reason to do so. This
                includes:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm font-light leading-relaxed text-zinc-400">
                <li>Delivering assessments, reports, downloads, memberships, and other requested services.</li>
                <li>Maintaining continuity across decision tools, including saved progress, reminders, and return access.</li>
                <li>Responding to contact requests, support issues, and account or access queries.</li>
                <li>Operating security controls, rate limits, session protections, and fraud or abuse detection.</li>
                <li>Maintaining internal records needed for fulfilment, service integrity, and lawful business administration.</li>
              </ul>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Our main legal bases are contract, steps taken at your request before contract,
                legitimate interests in running and securing the service, and consent where a
                submission is optional or specifically framed that way.
              </p>
            </section>

            <section className="space-y-4 rounded-sm border border-white/5 bg-white/[0.02] p-6">
              <h2 className="font-serif text-2xl italic text-white">
                4. Email And Decision Continuity
              </h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                If you provide an email address in connection with a diagnostic, strategy, or
                decision flow, we may use it to continue that specific process. This may include a
                session continuation message, a decision-state follow-up, or a return brief where
                the system records that the decision state has changed.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                These emails are intended to continue the service you entered, not to run generic
                campaigns. They are governed by system state, cooldown controls, and unsubscribe
                handling. We do not include full assessment responses in emails, and we use
                summarised language rather than verbatim user input.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">5. Sharing And Processors</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                We do not sell personal data. We share data only where needed to operate the site,
                deliver messages you asked to receive, process access, or protect the service.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Depending on the feature in use, this may include infrastructure, hosting, email,
                and abuse-prevention providers. Current processors or third-party services may
                include Resend for transactional email delivery, Stripe for payment processing
                and access entitlement, Google reCAPTCHA where enabled on protected forms or
                flows, and Buttondown where subscription workflows are used.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Some of these providers may process data outside the United Kingdom. Where that
                happens, we rely on appropriate contractual or statutory safeguards.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">6. Retention</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                We keep data only for as long as it is reasonably needed for the relevant service,
                security, legal, or record-keeping purpose.
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm font-light leading-relaxed text-zinc-400">
                <li>Client-side continuity data remains in your browser until it expires or you remove it.</li>
                <li>Decision and reminder records may be retained while an active continuity or access relationship exists.</li>
                <li>Some unlinked or inactive session data is periodically purged.</li>
                <li>Where you unsubscribe or request deletion, we process that request as soon as reasonably practicable, although limited suppression or audit data may be retained where needed to honour the request or comply with law.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl italic text-white">7. Your Rights</h2>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Subject to applicable law, you may request access, correction, deletion,
                restriction, objection, or portability. You may also withdraw consent where we rely
                on it.
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-300">
                Some flows also provide direct unsubscribe or deletion mechanisms. You can
                request full data deletion at any time — your decision records, identity data,
                and session history will be removed. If you want to exercise a right, contact{" "}
                <a
                  className="text-amber-500 underline underline-offset-4"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
                . You also have the right to complain to the UK Information Commissioner&apos;s
                Office if you believe data has been handled unlawfully.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-32 border-t border-white/5 pt-12">
          <PolicyFooter isDark />
        </div>
      </main>
    </Layout>
  );
};

export default PrivacyPage;
