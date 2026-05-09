import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import { getAllBriefs } from "@/lib/content/server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type BriefItem = { title: string; href: string; description: string };

type Props = {
  briefs: BriefItem[];
};

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeSlug(value: unknown): string {
  return safeString(value).replace(/^\/+|\/+$/g, "").replace(/^briefs\//i, "");
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const briefs = getAllBriefs()
    .filter((doc: any) => doc?.draft !== true && doc?.published !== false)
    .slice(0, 8)
    .map((doc: any) => ({
      title: safeString(doc.title, "Untitled brief"),
      href: `/briefs/${normalizeSlug(doc.slug || doc.urlSlug || doc._raw?.flattenedPath)}`,
      description: safeString(doc.description || doc.summary || doc.excerpt, "Strategic brief."),
    }));

  return { props: { briefs }, revalidate: 1800 };
};

const IntelligenceMarketPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ briefs }) => {
  return (
    <Layout
      title="Market Intelligence | Abraham of London"
      description="Global Market Intelligence, strategic briefs, and report access rules."
      canonicalUrl="/intelligence/market"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Market intelligence</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Strategic reading for operators and decision-makers.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              This layer connects Global Market Intelligence, market briefs, and strategic reports. Public and restricted materials are separated honestly. Catalog identity governs access where a report is active, and inactive materials are not presented as freely purchasable.
            </p>
          </header>

          <section className="grid gap-6 xl:grid-cols-3">
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Global Market Intelligence</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                The flagship market intelligence surface connects public brief, institutional edition, and boardroom-facing material without collapsing them into one generic content listing.
              </p>
              <div className="mt-5 space-y-2 text-sm">
                <p><Link href="/intelligence/global-market-intelligence-q1-2026" className="text-white hover:underline">Open market intelligence landing</Link></p>
                <p><Link href="/artifacts" className="text-white hover:underline">Browse artifact archive</Link></p>
              </div>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Access rules</p>
              <ul className="mt-3 space-y-2 text-sm text-white/60">
                <li>Public briefings are labelled public.</li>
                <li>Restricted intelligence remains tied to entitlement or controlled archive routes.</li>
                <li>Paid or premium reports route through artifact identity rather than generic library framing.</li>
              </ul>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Strategic reports</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Reports stay connected to intelligence lines, consequence framing, and catalog identity. They are not presented as a random shelf of PDFs.
              </p>
            </section>
          </section>

          <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
            <div className="flex items-center justify-between gap-3">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Recent briefs</p>
              <Link href="/library" className="text-sm text-white/68 underline-offset-4 hover:underline">View structured archive</Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {briefs.length > 0 ? briefs.map((brief) => (
                <div key={brief.href} style={{ borderLeft: "1px solid rgba(201,169,110,0.32)", paddingLeft: "12px" }}>
                  <Link href={brief.href} className="text-white hover:underline">{brief.title}</Link>
                  <p className="mt-1 text-sm leading-6 text-white/55">{brief.description}</p>
                </div>
              )) : <p className="text-sm text-white/45">No briefs are currently indexed here.</p>}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default IntelligenceMarketPage;
