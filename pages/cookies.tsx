import Head from "next/head";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { getPageTitle } from "@/config/site";

const LAST_UPDATED = "30 April 2026";

const CookiesPage: NextPage = () => {
  return (
    <Layout title="Cookie Policy">
      <Head>
        <title>{getPageTitle("Cookie Policy")}</title>
        <meta
          name="description"
          content="Cookie and browser storage policy for Abraham of London."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        <header className="mb-16 border-b border-white/10 pb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Governance // Cookies
            </span>
          </div>
          <h1 className="mb-6 font-serif text-4xl font-medium italic text-white md:text-5xl">
            Cookie Policy
          </h1>
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
            <p className="max-w-lg text-sm font-light leading-relaxed text-zinc-400">
              This page explains the cookies and browser storage technologies used across the site,
              including session continuity, access control, diagnostics, and security features.
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
            <h2 className="font-serif text-2xl italic text-white">
              1. What We Mean By Cookies
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              We use both cookies and browser storage technologies. In this policy, &quot;cookies&quot;
              includes standard HTTP cookies as well as local storage and session storage where
              those are used to support continuity, access, analytics, or security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">2. Essential Technologies</h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Some cookies and storage entries are necessary for the site to work. Depending on the
              feature in use, these may support:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm font-light leading-relaxed text-zinc-400">
              <li>Authentication, access control, and member or purchaser entitlement checks.</li>
              <li>Session continuity, secure return links, and access recovery flows.</li>
              <li>CSRF protection, anti-abuse verification, and request integrity controls.</li>
              <li>Short-lived state needed to move between diagnostic steps or return to an unfinished assessment.</li>
            </ul>
          </section>

          <section className="space-y-4 rounded-sm border border-white/5 bg-white/[0.02] p-6">
            <h2 className="font-serif text-2xl italic text-white">
              3. Local Storage And Session Storage
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Several tools on the site store progress and continuity data in your browser. This
              can include unfinished assessment responses, strategy-room inputs, short-term result
              handoffs, reminder preferences, captured-email markers, theme preferences, and other
              state needed to avoid losing work.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Session storage usually lasts until the browser tab is closed. Local storage remains
              until it is cleared or replaced.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">
              4. Analytics And Measurement
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              We may use first-party measurement and limited session-level analytics to understand
              how users move through the site, where assessments fail, and where operational issues
              appear. These tools are used to improve reliability, completion, and service quality.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              We do not use this policy to claim that all measurement is anonymous in every case.
              Some events may be associated with a session, account, or decision record where that
              is necessary for continuity, fulfilment, or abuse prevention.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">
              5. Third-Party Technologies
            </h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Some protected forms or flows use Google reCAPTCHA or similar abuse-prevention tools.
              Those services may set or read their own cookies or browser identifiers according to
              their own policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl italic text-white">6. Your Choices</h2>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              You can manage cookies and browser storage through your browser settings. You can also
              clear local storage and session storage directly from your browser.
            </p>
            <p className="text-sm font-light leading-relaxed text-zinc-300">
              Blocking essential technologies may prevent log-in, continuity, diagnostics, or
              access-controlled products from working properly.
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

export default CookiesPage;
