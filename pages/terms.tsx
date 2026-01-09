// pages/terms.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";
import { brand, contact, getPageTitle } from "@/lib/siteConfig";

const TermsPage: NextPage = () => {
  const pageTitle = "Terms";
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
          content="Terms of use for Abraham of London's website, content, and related services."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12 text-sm leading-relaxed text-gray-200 sm:py-16 lg:py-20">
        {/* Header and sections 1-9 remain exactly the same */}
        
        {/* 10. Contact */}
        <section className="mb-12 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-cream">
            10. Contact about these Terms
          </h2>
          <p>
            If you have questions about these Terms or believe they need to be
            clarified in light of a specific situation, contact:
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
            These Terms are intended to be firm but reasonable. If you genuinely
            believe a provision is unclear or unfair in practice, the first step
            is a measured conversation rather than escalation.
          </p>
        </section>

        <PolicyFooter isDark />
      </main>
    </Layout>
  );
};

export default TermsPage;