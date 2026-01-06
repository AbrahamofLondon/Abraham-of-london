/* pages/canon/index.tsx - HYDRATED INSTITUTIONAL VERSION */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

// INSTITUTIONAL FIX: Import from the hardened compat layer instead of legacy lib/canon
import {
  getAllCanons,
  getAccessLevel,
  normalizeSlug,
  getDocHref,
  isDraftContent,
} from "@/lib/contentlayer-compat";
import { sanitizeData } from "@/lib/server/md-utils";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type AccessLevel = "public" | "inner-circle" | "private";

type CanonItem = {
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string;
  href: string;
  accessLevel: AccessLevel;
  coverImage: string | null;
  date: string | null;
  readTime: string | null;
};

type CanonIndexProps = {
  items: CanonItem[];
  counts: {
    total: number;
    public: number;
    inner: number;
    private: number;
  };
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(
  /\/+$/,
  ""
);

// -----------------------------------------------------------------------------
// HELPERS (SANITY CHECK)
// -----------------------------------------------------------------------------

function toAccessLevel(v: unknown): AccessLevel {
  const n = String(v || "").trim().toLowerCase();
  if (n === "inner-circle" || n === "private" || n === "public") return n as AccessLevel;
  return "public";
}

// -----------------------------------------------------------------------------
// PAGE COMPONENT
// -----------------------------------------------------------------------------

const CanonIndexPage: NextPage<CanonIndexProps> = ({ items, counts }) => {
  const title = "The Canon";
  const description =
    "Foundational work on purpose, governance, civilisation, and legacy — organised for builders, not browsers.";
  const canonicalUrl = `${SITE}/canon`;

  return (
    <Layout title={title} description={description}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* HERO SECTION */}
        <section className="relative isolate overflow-hidden border-b border-white/10 bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
                Canon · Foundations
              </p>

              <h1 className="mt-6 font-serif text-5xl font-bold tracking-tight text-white sm:text-6xl">
                The Canon
              </h1>

              <p className="mt-8 text-lg leading-relaxed text-gray-400">
                This is the long-form spine of Abraham of London: purpose, governance,
                civilisation, stewardship, and legacy — written for founders, fathers,
                and leaders who prefer structure over noise.
              </p>

              {/* LIVE COUNTS */}
              <div className="mt-10 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-400">
                  Total: {counts.total}
                </span>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-200">
                  Public: {counts.public}
                </span>
                <span className="rounded-full border border-amber-400/20 bg-black/40 px-4 py-2 text-amber-200/60">
                  Inner: {counts.inner}
                </span>
              </div>

              <div className="mt-12 flex flex-wrap gap-4">
                <Link
                  href="/canon/the-architecture-of-human-purpose"
                  className="rounded-xl bg-amber-500 px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-amber-400"
                >
                  Start with Volume One →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* LIBRARY LIST */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
                  Library
                </p>
                <h2 className="mt-3 font-serif text-4xl font-bold text-white">
                  Browse Canon Entries
                </h2>
              </div>
              <Link
                href="/content"
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:bg-white/10"
              >
                Explore All Content
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {items.map((item) => {
                const badgeClass =
                  item.accessLevel === "public"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    : item.accessLevel === "inner-circle"
                    ? "border-amber-500/20 bg-black/40 text-amber-200/70"
                    : "border-white/10 bg-white/5 text-gray-400";

                return (
                  <Link
                    key={item.slug}
                    href={item.href}
                    className="group block rounded-3xl border border-white/5 bg-zinc-900/50 p-8 transition-all hover:border-amber-500/30 hover:bg-zinc-900/80"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-bold text-white transition-colors group-hover:text-amber-400">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="mt-2 text-sm font-medium text-gray-400">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClass}`}
                      >
                        {item.accessLevel.replace("-", " ")}
                      </span>
                    </div>

                    {item.excerpt && (
                      <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-gray-400 group-hover:text-gray-300">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>{item.date || "Legacy Content"}</span>
                      {item.readTime && <span>{item.readTime}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>

            {items.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/10 p-20 text-center text-gray-500">
                Institutional documents are currently being indexed.
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CanonIndexPage;

// -----------------------------------------------------------------------------
// STATIC PROPS
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  // Use the hardened compat getter
  const canons = getAllCanons();

  const items: CanonItem[] = canons
    .filter((c: any) => c && !isDraftContent(c))
    .map((c: any) => {
      // Logic: Ensure we map Contentlayer fields to our sanitized CanonItem type
      return {
        title: c.title || "Untitled Canon",
        subtitle: c.subtitle || null,
        excerpt: c.excerpt || c.description || null,
        coverImage: c.coverImage || null,
        slug: normalizeSlug(c.slug || c._raw.flattenedPath),
        href: getDocHref(c),
        accessLevel: toAccessLevel(getAccessLevel(c)),
        date: c.date ? new Date(c.date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : null,
        readTime: c.readTime || null,
      };
    })
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da || a.title.localeCompare(b.title);
    });

  const counts = items.reduce(
    (acc, it) => {
      acc.total += 1;
      if (it.accessLevel === "public") acc.public += 1;
      else if (it.accessLevel === "inner-circle") acc.inner += 1;
      else acc.private += 1;
      return acc;
    },
    { total: 0, public: 0, inner: 0, private: 0 }
  );

  // SANITIZE DATA: The final shield against serialization errors
  return {
    props: sanitizeData({ items, counts }),
    revalidate: 1800,
  };
};
