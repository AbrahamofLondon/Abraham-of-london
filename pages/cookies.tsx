// pages/cookies.tsx — EPHEMERAL DATA PROTOCOL
import * as React from "react";
import Head from "next/head";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { contact, getPageTitle } from "@/lib/siteConfig";

const CookiesPage: NextPage = () => {
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }),
    []
  );

  return (
    <Layout title="Cookie Policy">
      <Head>
        <title>{getPageTitle("Cookies")}</title>
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        <header className="border-b border-white/10 pb-12 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Governance // Cookies
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 italic">
            Cookie Policy
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md font-light">
            We use minimal tracking technologies to ensure platform stability and 
            secure member access.
          </p>
        </header>

        <div className="space-y-16 lg:ml-[25%] max-w-2xl">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-white italic">1. Essential Operations</h2>
            <p className="text-sm text-zinc-300 font-light leading-relaxed">
              These cookies are strictly necessary for the site to function, including 
              security protocols that prevent Cross-Site Request Forgery (CSRF) 
              and maintain your session during Inner Circle access.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-white italic">2. Behavioral Analytics</h2>
            <p className="text-sm text-zinc-300 font-light leading-relaxed">
              We may utilize privacy-first analytics to understand aggregate traffic patterns. 
              These tools are configured to anonymise IP addresses and do not track 
              individuals across the web.
            </p>
          </section>

          <div className="bg-zinc-900/40 p-6 border border-white/5 font-mono text-[11px] text-zinc-500">
            [SYSTEM NOTE]: You may opt-out of all non-essential cookies via your 
            browser settings. Restricting essential cookies may disrupt access to 
            secure dispatches and membership resources.
          </div>
        </div>
        <div className="mt-32 pt-12 border-t border-white/5">
          <PolicyFooter isDark />
        </div>
      </main>
    </Layout>
  );
};

export default CookiesPage;