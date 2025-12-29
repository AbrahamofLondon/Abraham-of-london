// pages/canon/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

import {
  getAllCanons,
  getAccessLevel,
  resolveCanonSlug,
} from "@/lib/canon";
import type { Canon } from "@/lib/canon";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type AccessLevel = "public" | "inner-circle" | "private";

type CanonItem = {
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  slug: string;
  accessLevel: AccessLevel;
  coverImage?: string | null;
  date?: string | null;
  readTime?: string | null;
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
// HELPERS (EXPORT-SAFE)
// -----------------------------------------------------------------------------

function safeString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function safeTitle(v: unknown): string {
  const s = safeString(v).trim();
  return s || "Canon Entry";
}

function cleanSlug(input: unknown): string {
  const s = safeString(input)
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!s) return "";
  if (s.includes("http://") || s.includes("https://")) return "";
  if (s.includes("?") || s.includes("#")) return "";
  if (s.includes("..")) return "";
  if (!/^[a-z0-9/_-]+$/i.test(s)) return "";

  return s;
}

function isDraft(doc: any): boolean {
  return doc?.draft === true || doc?.draft === "true";
}

function toAccessLevel(v: unknown): AccessLevel {
  const n = safeString(v).trim().toLowerCase();
  if (n === "inner-circle" || n === "private" || n === "public") return n;
  return "public";
}

function toIsoDate(v: unknown): string | null {
  const s = safeString(v).trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

const CanonIndexPage: NextPage<CanonIndexProps> = ({ items, counts }) => {
  const title = "The Canon";
  const description =
    "Foundational work on purpose, governance, civilisation, and legacy — organised for builders, not browsers.";
  const canonicalUrl = `${SITE}/canon`;

  return (
    <Layout title={title} description={description} canonicalUrl={canonicalUrl} ogType="website">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      {/* HERO (CANON ONLY) */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Canon · Foundations
            </p>

            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              The Canon
            </h1>

            <p className="mt-5 text-base leading-relaxed text-gray-300 sm:text-lg">
              This is the long-form spine of Abraham of London: purpose, governance,
              civilisation, stewardship, and legacy — written for founders, fathers,
              and leaders who prefer structure over noise.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em]">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200">
                Total: {counts.total}
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-200">
                Public: {counts.public}
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-black/20 px-4 py-2 text-amber-200/80">
                Inner: {counts.inner}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-gray-300">
                Private: {counts.private}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/canon/the-architecture-of-human-purpose"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl"
              >
                Start with Volume One
                <span>→</span>
              </Link>

              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400/5 px-7 py-3.5 text-sm font-semibold text-amber-100 transition-all hover:scale-105 hover:bg-amber-500/10"
              >
                Inner Circle access
                <span>↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LIST */}
      <section className="bg-white py-14 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
                Library
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Browse canon entries
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-gray-300">
                Public entries are readable immediately. Inner Circle and Private entries
                are listed for transparency, but remain gated.
              </p>
            </div>

            <Link
              href="/content"
              className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
            >
              Explore all content
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const href = `/canon/${item.slug}`;
              const badge =
                item.accessLevel === "public"
                  ? { label: "Public", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200" }
                  : item.accessLevel === "inner-circle"
                  ? { label: "Inner Circle", className: "border-amber-500/20 bg-black/20 text-amber-700/80 dark:text-amber-200/80" }
                  : { label: "Private", className: "border-slate-300 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-gray-300" };

              const subtitle = safeString(item.subtitle).trim();
              const excerpt = safeString(item.excerpt).trim();
              const date = item.date ? new Date(item.date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : null;

              return (
                <Link
                  key={item.slug}
                  href={href}
                  className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-slate-900 transition-colors group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
                        {item.title}
                      </h3>

                      {subtitle ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
                          {subtitle}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`inline-flex flex-shrink-0 items-center rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {excerpt ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                      {excerpt}
                    </p>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-gray-400">
                    <span className="uppercase tracking-[0.15em]">/canon/{item.slug}</span>
                    <span className="flex items-center gap-3">
                      {date ? <span>{date}</span> : null}
                      {item.readTime ? <span>{item.readTime}</span> : null}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {items.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300">
              No canon entries found yet.
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
};

export default CanonIndexPage;

// -----------------------------------------------------------------------------
// STATIC PROPS
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  const canons: Canon[] = getAllCanons();

  const items: CanonItem[] = canons
    .filter((c) => c && !isDraft(c))
    .map((c) => {
      const slug = cleanSlug(resolveCanonSlug(c));
      const accessLevel = toAccessLevel(getAccessLevel(c));

      return {
        title: safeTitle((c as any)?.title),
        subtitle: safeString((c as any)?.subtitle).trim() || null,
        excerpt: safeString((c as any)?.excerpt).trim() || null,
        coverImage: safeString((c as any)?.coverImage).trim() || null,
        date: toIsoDate((c as any)?.date),
        readTime: safeString((c as any)?.readTime).trim() || null,
        slug,
        accessLevel,
      };
    })
    .filter((x) => Boolean(x.slug))
    // Sort newest-first if date exists; else stable by title
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (da !== db) return db - da;
      return a.title.localeCompare(b.title);
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

  return {
    props: { items, counts },
    revalidate: 1800,
  };
};