// pages/cookies.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { contact, getPageTitle } from "@/lib/siteConfig";

const CookiesPage: NextPage = () => {
  const pageTitle = "Cookie Policy";
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB"),
    []
  );

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Cookie policy for Abraham of London's website, explaining how cookies are used and your choices."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12 text-sm leading-relaxed text-gray-200 sm:py-16 lg:py-20">
        {/* Header and content remains exactly the same */}
        <header className="mb-10 border-b border-gold/30 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Governance · Cookies
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Cookie Policy
          </h1>
          <p className="mt-3 max-w-2xl text-gold/70">
            This policy explains what cookies are, how we use them, and your
            choices regarding their use. We aim to be transparent about our use
            of tracking technologies.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Sections 1-7 remain exactly the same */}
        
        {/* 8. Contact */}
        <section className="mb-12 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            8. Questions about cookies
          </h2>
          <p>
            If you have questions about this Cookie Policy or our use of
            cookies, please contact:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Email:{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-softGold underline underline-offset-2 hover:text-amber-200"
              >
                {contact.email}
              </a>
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            We aim to use cookies responsibly and transparently. If you believe
            we&apos;re not meeting that standard, we welcome your feedback.
          </p>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default CookiesPage;