import Head from "next/head";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { getPageTitle, siteConfig } from "@/config/site";

const LAST_UPDATED = "30 April 2026";

const TermsPage: NextPage = () => {
  const contactEmail = siteConfig.contact.email ?? "info@abrahamoflondon.org";

  return (
    <Layout title="Terms of Use">
      <Head>
        <title>{getPageTitle("Terms of Use")}</title>
        <meta
          name="description"
          content="Terms of use for Abraham of London, including diagnostics, digital products, and access-controlled services."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        <header className="mb-16 border-b border-white/10 pb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Governance // Terms
            </span>
          </div>
          <h1 className="mb-6 font-serif text-4xl font-medium italic text-white md:text-5xl">
            Terms of Use
          </h1>
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
            <p className="max-w-lg text-sm font-light leading-relaxed text-zinc-400">
              These terms govern access to this site, its diagnostic systems, digital materials,
              and any access-controlled resources made available through it.
            </p>
            <div className="text-right">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                Last Updated: {LAST_UPDATED}
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-3xl space-y-14 lg:ml-[25%]">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">1. Acceptance And Scope</h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              By accessing or using this site, you agree to these terms. If you do not agree, do
              not use the site.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              These terms apply to public pages, diagnostic tools, downloads, editorial content,
              contact forms, account or member access, and any continuity emails or return links
              connected to those services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">
              2. Informational Content And Tools
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Unless we enter into a separate written agreement with you, the site and its outputs
              are provided for information, reflection, and decision support. They are not legal,
              financial, medical, therapeutic, accounting, or regulated professional advice.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Diagnostic outputs, assessments, strategic readings, and pattern reports are intended
              to assist judgment, not replace it. You remain responsible for decisions taken on the
              basis of those outputs.
            </p>
          </section>

          <section className="space-y-4 rounded-sm border border-white/5 bg-white/[0.02] p-6">
            <h2 className="font-serif text-2xl italic text-white">
              3. Access-Controlled Services And Purchases
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Certain materials, reports, memberships, or strategy tools may be limited to invited,
              registered, or paying users. Access may be granted through session links, account
              controls, entitlement checks, or other gating mechanisms.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              We may suspend, revoke, or limit access where reasonably necessary for security,
              misuse prevention, payment failure, contractual breach, or protection of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">4. Acceptable Use</h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              You must not misuse the site. This includes attempting to interfere with service
              operation, bypass access controls, scrape protected content at scale, reverse engineer
              restricted features, submit malicious payloads, or use the site in a way that is
              unlawful or abusive.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">
              5. Intellectual Property
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Unless otherwise stated, the content, framework language, diagnostic structures,
              writing, downloads, branding, and design elements on this site are owned by or
              licensed to Abraham of London.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              You receive a limited, non-exclusive, non-transferable right to access and use the
              site for your own lawful internal or personal use. You may not reproduce,
              redistribute, republish, resell, or publicly exploit restricted materials without
              permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">
              6. User Submissions And Confidentiality
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              You retain responsibility for information you submit. Do not provide material that
              you have no right to share.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              We handle submitted information in line with our privacy practices, but general site
              use does not create a lawyer-client, adviser-client, fiduciary, or equivalent
              confidential relationship unless a separate written engagement says otherwise.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">
              7. Availability And Liability
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              We aim to keep the site accurate and available, but we do not guarantee that it will
              always be uninterrupted, error-free, or suitable for every purpose.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              To the fullest extent permitted by law, we exclude implied warranties and limit
              liability for indirect, consequential, special, or business losses arising from use
              of the site. Nothing in these terms excludes liability that cannot lawfully be
              excluded, including liability for fraud, fraudulent misrepresentation, or death or
              personal injury caused by negligence.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">
              8. Changes, Governing Law, And Contact
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              We may update these terms from time to time. The version published on this page is
              the version that applies from its stated date.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              These terms are governed by the laws of England and Wales. The courts of England and
              Wales will have jurisdiction except where mandatory local law provides otherwise.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Questions about these terms can be sent to{" "}
              <a
                className="text-amber-500 underline underline-offset-4"
                href={`mailto:${contactEmail}`}
              >
                {contactEmail}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-32 border-t border-white/5 pt-12">
          <PolicyFooter isDark />
        </div>
      </main>
    </Layout>
  );
};

export default TermsPage;
