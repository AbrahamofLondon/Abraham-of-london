import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllPlaybooks,
  getAllPosts,
  getAllResources,
  getAllShorts,
  getAllBriefs,
  getAllVault,
} from "@/lib/content/server";

type Group = {
  title: string;
  description: string;
  href: string;
  count: number;
};

type RecentItem = {
  title: string;
  description: string;
  href: string;
  group: string;
};

type Props = {
  groups: Group[];
  recent: RecentItem[];
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeSlug(value: unknown): string {
  return safeString(value)
    .replace(/^\/+|\/+$/g, "")
    .replace(/^books\//i, "")
    .replace(/^canon\//i, "")
    .replace(/^playbooks\//i, "")
    .replace(/^briefs\//i, "")
    .replace(/^blog\//i, "")
    .replace(/^posts\//i, "")
    .replace(/^resources\/strategic-frameworks\//i, "");
}

function buildRecentItem(doc: any, group: string, href: string): RecentItem {
  return {
    title: safeString(doc?.title, "Untitled"),
    description: safeString(doc?.description || doc?.summary || doc?.excerpt, "Source-labelled material."),
    href,
    group,
  };
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const books = getAllBooks().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const canons = getAllCanons().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const posts = getAllPosts().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const playbooks = getAllPlaybooks().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const resources = getAllResources().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const briefs = getAllBriefs().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const downloads = getAllDownloads().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const vault = getAllVault().filter((doc: any) => doc?.draft !== true && doc?.published !== false);
  const shorts = getAllShorts().filter((doc: any) => doc?.draft !== true && doc?.published !== false);

  const frameworkResources = resources.filter((doc: any) => String(doc?._raw?.sourceFilePath || "").includes("strategic-frameworks"));

  const groups: Group[] = [
    { title: "Essays", description: "Public thought, essays, and commentary.", href: "/blog", count: posts.length + shorts.length },
    { title: "Briefs", description: "Strategic briefs and intelligence notes.", href: "/intelligence/market", count: briefs.length },
    { title: "Playbooks", description: "Execution-grade public playbooks.", href: "/playbooks", count: playbooks.length },
    { title: "Frameworks", description: "Decision frameworks and strategic instruments.", href: "/frameworks", count: frameworkResources.length },
    { title: "Market Intelligence", description: "Public and restricted intelligence lines.", href: "/intelligence/market", count: briefs.length + downloads.length },
    { title: "Books", description: "Long-form works and featured volumes.", href: "/books", count: books.length },
    { title: "Evidence Materials", description: "Standards, evidence pages, and proof posture.", href: "/evidence", count: downloads.length },
    { title: "Vault", description: "Controlled archive and restricted materials.", href: "/vault", count: vault.length },
  ];

  const recent: RecentItem[] = [
    books[0] ? buildRecentItem(books[0], "Books", `/books/${normalizeSlug(books[0].slugSafe || books[0].slug)}`) : null,
    canons[0] ? buildRecentItem(canons[0], "Canon", `/canon/${normalizeSlug(canons[0].slugSafe || canons[0].slug)}`) : null,
    playbooks[0] ? buildRecentItem(playbooks[0], "Playbooks", `/playbooks/${normalizeSlug(playbooks[0].urlSlug || playbooks[0].slug)}`) : null,
    frameworkResources[0] ? buildRecentItem(frameworkResources[0], "Frameworks", `/resources/strategic-frameworks/${normalizeSlug(frameworkResources[0].slug || frameworkResources[0].url)}`) : null,
    briefs[0] ? buildRecentItem(briefs[0], "Briefs", `/briefs/${normalizeSlug(briefs[0].slug || briefs[0].urlSlug)}`) : null,
    posts[0] ? buildRecentItem(posts[0], "Essays", `/blog/${normalizeSlug(posts[0].slug || posts[0].url)}`) : null,
  ].filter(Boolean) as RecentItem[];

  return { props: { groups, recent }, revalidate: 1800 };
};

const LibraryIndexPage: NextPage<Props> = ({ groups, recent }) => {
  return (
    <Layout
      title="Library | Abraham of London"
      description="Structured reading room for essays, briefs, playbooks, frameworks, books, evidence materials, and archive pathways."
      canonicalUrl="/library"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Library</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              A structured reading room, not a dumping ground.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              The public Library is the broad reading room for essays, briefs, playbooks, frameworks, books, evidence materials, and archive pathways. The Canon remains a distinct foundation and is linked here without being swallowed by the Library.
            </p>
          </header>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {groups.map((group) => (
              <Link key={group.href} href={group.href} className="border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>{group.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{group.description}</p>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)", marginTop: "16px" }}>
                  {group.count} indexed
                </p>
              </Link>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>How to use this layer</p>
              <div className="mt-4 space-y-3 text-sm text-white/62">
                <p>Start with the Canon if you want origin, worldview, and governing principles.</p>
                <p>Use Evidence if you want standards, proof boundaries, and verification posture.</p>
                <p>Use Frameworks and Playbooks if you want practical instruments under consequence.</p>
                <p>Use Intelligence if you want market reading, strategic briefs, and report pathways.</p>
                <p>Use Vault when the material is controlled, restricted, or earned rather than openly browsable.</p>
              </div>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Canon stays distinct</p>
              <p className="mt-4 text-sm leading-7 text-white/60">
                The Canon is linked from the Library, but it is not merely another shelf. It remains the governing intellectual foundation behind the public reading room and the decision system itself.
              </p>
              <div className="mt-5">
                <Link href="/canon" className="text-sm text-white/72 underline-offset-4 hover:underline">
                  Enter the Canon
                </Link>
              </div>
            </section>
          </section>

          <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Recent routes into the archive</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recent.map((item) => (
                <div key={item.href} style={{ borderLeft: "1px solid rgba(201,169,110,0.32)", paddingLeft: "12px" }}>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>{item.group}</p>
                  <Link href={item.href} className="mt-2 block text-white hover:underline">{item.title}</Link>
                  <p className="mt-1 text-sm leading-6 text-white/55">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default LibraryIndexPage;
