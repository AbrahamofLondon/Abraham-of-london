// pages/terms.tsx — SERVICE ENGAGEMENT & TERMS
import * as React from "react";
import Head from "next/head";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { contact, getPageTitle } from "@/lib/siteConfig";

const TermsPage: NextPage = () => {
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }),
    []
  );

  return (
    <Layout title="Terms of Use">
      <Head>
        <title>{getPageTitle("Terms")}</title>
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        <header className="border-b border-white/10 pb-12 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Governance // Terms
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 italic">
            Terms of Use
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md font-light">
            These terms govern the use of the Abraham of London platform and its intellectual content. 
            Engagement implies acceptance of these protocols.
          </p>
        </header>

        <div className="space-y-16 lg:ml-[25%] max-w-2xl">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-white italic">1. Intellectual Property</h2>
            <p className="text-sm text-zinc-300 font-light leading-relaxed">
              All content, including the 75 intelligence briefs, editorial dispatches, and 
              governance frameworks, are the exclusive property of Abraham of London. 
              Unauthorised distribution or reproduction is strictly prohibited.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-white italic">2. Inner Circle Conduct</h2>
            <p className="text-sm text-zinc-300 font-light leading-relaxed">
              Membership to the Inner Circle is a privilege, not a right. We reserve the 
              unilateral right to revoke access keys in instances of platform abuse, 
              violation of confidentiality, or actions that compromise the community.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-white italic">3. Liability & Advisory</h2>
            <p className="text-sm text-zinc-400 font-light leading-relaxed italic">
              The content provided on this platform is for informational and strategic 
              discourse. It does not constitute formal legal, financial, or professional 
              advice unless specifically engaged under a separate, signed contract.
            </p>
          </section>

          <div className="p-8 border-l border-amber-500/20 bg-white/[0.01]">
            <h3 className="text-xs uppercase tracking-widest text-amber-500 mb-4">Protocol Conflict</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              If you believe a provision is unclear, we invite a measured dialogue. 
              Contact: <span className="text-zinc-300">{contact.email}</span>
            </p>
          </div>
        </div>
        <div className="mt-32 pt-12 border-t border-white/5">
          <PolicyFooter isDark />
        </div>
      </main>
    </Layout>
  );
};

export default TermsPage;