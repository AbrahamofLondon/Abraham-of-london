// pages/privacy.tsx — DATA SOVEREIGNTY & PRIVACY PROTOCOL
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { getPageTitle, siteConfig } from "@/lib/imports";

const PrivacyPage: NextPage = () => {
  const pageTitle = "Privacy Policy";
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB", { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }),
    []
  );

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Privacy and data protection protocols for the Abraham of London platform."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        <header className="border-b border-white/10 pb-12 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Governance // Privacy
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 italic">
            Privacy Policy
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md font-light">
              This protocol outlines the handling of personal data within the Abraham of London ecosystem. 
              We prioritize data minimisation and cryptographic anonymity over conventional tracking.
            </p>
            <div className="text-right">
              <span className="block font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                Last Revised: {lastUpdated}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <aside className="hidden lg:block lg:col-span-3 sticky top-32 h-fit">
            <nav className="space-y-4">
              {['Identity', 'Data Scope', 'Legal Basis', 'Your Rights'].map((item, i) => (
                <div key={item} className="flex items-center gap-3 group cursor-pointer">
                  <span className="font-mono text-[8px] text-amber-500/40">0{i+1}</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                    {item}
                  </span>
                </div>
              ))}
            </nav>
          </aside>

          <div className="lg:col-span-9 space-y-16">
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-white italic">1. Institutional Identity</h2>
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                "Abraham of London" represents the professional ventures and intellectual portfolio 
                led by Abraham Adaramola. For the purposes of data protection, we act as the 
                Primary Controller for information processed via this site.
              </p>
              <p className="text-sm font-mono text-amber-500/80">
                Liaison: {siteConfig.email}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-white italic">2. Inner Circle Cryptography</h2>
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm">
                <p className="text-sm text-zinc-300 font-light mb-4">
                  For members of the Inner Circle, we employ specific privacy-preserving measures:
                </p>
                <ul className="list-none p-0 space-y-3 text-xs text-zinc-400">
                  <li className="flex gap-4 items-start border-l border-amber-500/20 pl-4 py-1">
                    <span>Email addresses are converted to <strong>SHA-256 hashes</strong> immediately after verification.</span>
                  </li>
                  <li className="flex gap-4 items-start border-l border-amber-500/20 pl-4 py-1">
                    <span>Access keys are issued via secure ephemeral channels to prevent permanent identification.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-4 text-sm text-zinc-300 font-light leading-relaxed">
              <h2 className="font-serif text-2xl text-white italic">3. Usage of Information</h2>
              <p>Information is utilized exclusively for:</p>
              <ul className="list-disc ml-4 space-y-2 text-zinc-400">
                <li>Transmission of editorial dispatches and the Intelligence Portfolio.</li>
                <li>Strategic management of advisory enquiries and consultation scheduling.</li>
                <li>Edge-level security monitoring to prevent platform abuse.</li>
              </ul>
              <p className="mt-4 border-t border-white/5 pt-4 italic text-zinc-500 text-xs">
                We do not engage in the sale of data or secondary market profiling.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-white italic">4. Statutory Rights</h2>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                Under UK GDPR, you retain the right to access, rectify, or erase your data. 
                Given our hashing protocols, we may require additional verification to link 
                requests to specific encrypted identifiers.
              </p>
            </section>
          </div>
        </div>
        <div className="mt-32 pt-12 border-t border-white/5">
          <PolicyFooter isDark />
        </div>
      </main>
    </Layout>
  );
};

export default PrivacyPage;