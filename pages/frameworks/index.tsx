import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import { getAllPlaybooks, getAllResources } from "@/lib/content/server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Item = { title: string; href: string; description: string };

type Props = {
  featuredFrameworks: Item[];
  featuredPlaybooks: Item[];
};

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeSlug(value: unknown): string {
  return safeString(value).replace(/^\/+|\/+$/g, "").replace(/^playbooks\//i, "").replace(/^resources\/strategic-frameworks\//i, "");
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const playbooks = getAllPlaybooks()
    .filter((doc: any) => doc?.draft !== true && doc?.published !== false)
    .slice(0, 4)
    .map((doc: any) => ({
      title: safeString(doc.title, "Untitled playbook"),
      href: `/playbooks/${normalizeSlug(doc.urlSlug || doc.slug)}`,
      description: safeString(doc.description || doc.summary || doc.excerpt, "Execution playbook."),
    }));

  const frameworks = getAllResources()
    .filter((doc: any) => String(doc?._raw?.sourceFilePath || "").includes("strategic-frameworks"))
    .slice(0, 4)
    .map((doc: any) => ({
      title: safeString(doc.title, "Untitled framework"),
      href: `/resources/strategic-frameworks/${normalizeSlug(doc.slug || doc.url || doc._raw?.flattenedPath)}`,
      description: safeString(doc.description || doc.summary || doc.excerpt, "Strategic framework."),
    }));

  return {
    props: {
      featuredFrameworks: frameworks,
      featuredPlaybooks: playbooks,
    },
    revalidate: 1800,
  };
};

const FrameworksPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  featuredFrameworks,
  featuredPlaybooks,
}) => {
  return (
    <Layout
      title="Frameworks | Abraham of London"
      description="Decision instruments, frameworks, playbooks, and operator packs."
      canonicalUrl="/frameworks"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Frameworks</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Decision instruments, frameworks, playbooks, and operator packs.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              This is the practical instrument layer behind Decision Infrastructure. The public surface distinguishes between what diagnoses, what frames, what instructs, and what remains controlled.
            </p>
          </header>

          <section className="grid gap-6 xl:grid-cols-2">
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Decision instruments</p>
              <div className="mt-4 space-y-3 text-sm text-white/65">
                <p><Link href="/decision-instruments/decision-exposure-instrument/start" className="underline-offset-4 hover:underline">Decision Exposure Instrument</Link></p>
                <p><Link href="/decision-instruments/mandate-clarity-framework/start" className="underline-offset-4 hover:underline">Mandate Clarity Framework</Link></p>
                <p><Link href="/decision-instruments/intervention-path-selector/start" className="underline-offset-4 hover:underline">Intervention Path Selector</Link></p>
                <p><Link href="/decision-instruments/operator-decision-pack/start" className="underline-offset-4 hover:underline">Operator Decision Pack</Link></p>
              </div>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Operator packs</p>
              <p className="mt-4 text-sm leading-7 text-white/60">
                Public operator packs are still selective. Current operator-facing material is carried primarily through decision instruments, Strategy Room, Decision Centre, and governed follow-up rather than a large public pack shelf.
              </p>
            </section>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <div className="flex items-center justify-between gap-3">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Frameworks</p>
                <Link href="/resources/strategic-frameworks" className="text-sm text-white/68 underline-offset-4 hover:underline">View all frameworks</Link>
              </div>
              <div className="mt-4 space-y-4">
                {featuredFrameworks.length > 0 ? featuredFrameworks.map((item) => (
                  <div key={item.href} style={{ borderLeft: "1px solid rgba(201,169,110,0.32)", paddingLeft: "12px" }}>
                    <Link href={item.href} className="text-white hover:underline">{item.title}</Link>
                    <p className="mt-1 text-sm leading-6 text-white/55">{item.description}</p>
                  </div>
                )) : <p className="text-sm text-white/45">No public frameworks are currently indexed here.</p>}
              </div>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <div className="flex items-center justify-between gap-3">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Playbooks</p>
                <Link href="/playbooks" className="text-sm text-white/68 underline-offset-4 hover:underline">View all playbooks</Link>
              </div>
              <div className="mt-4 space-y-4">
                {featuredPlaybooks.length > 0 ? featuredPlaybooks.map((item) => (
                  <div key={item.href} style={{ borderLeft: "1px solid rgba(201,169,110,0.32)", paddingLeft: "12px" }}>
                    <Link href={item.href} className="text-white hover:underline">{item.title}</Link>
                    <p className="mt-1 text-sm leading-6 text-white/55">{item.description}</p>
                  </div>
                )) : <p className="text-sm text-white/45">No public playbooks are currently indexed here.</p>}
              </div>
            </section>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default FrameworksPage;
