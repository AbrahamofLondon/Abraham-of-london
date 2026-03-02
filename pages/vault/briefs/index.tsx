/* pages/vault/briefs/index.tsx — VAULT BRIEFS INDEX (Premium, SSG, SSOT-safe) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Shield, Lock, ArrowRight, Filter } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";

import { allBriefs } from "@/lib/contentlayer";
import tiers, { requiredTierFromDoc, type AccessTier } from "@/lib/access/tiers";

type BriefCard = {
  slug: string; // bare (brief-001-modern-household)
  href: string; // /vault/briefs/<slug>
  title: string;
  series: string;
  abstract: string;
  requiredTier: AccessTier;
  tierLabel: string;
  volume?: number | null;
  readTime?: string | null;
  tags: string[];
  publishedAt?: string | null;
};

type Props = {
  items: BriefCard[];
  total: number;
  requiredTier: AccessTier; // page-level (max of all items; default inner-circle)
};

/**
 * ✅ FIXED: Extract the bare slug from the full path
 * Example: "content/vault/briefs/brief-001-modern-household.mdx" -> "brief-001-modern-household"
 */
function normalizeBriefSlug(input: string): string {
  if (!input) return "";
  
  // Get the filename without extension
  const fullPath = String(input).trim();
  const fileName = fullPath.split(/[\\/]/).pop() || ""; // Get last part after slash
  const baseName = fileName.replace(/\.mdx$/i, ""); // Remove .mdx extension
  
  return baseName;
}

/**
 * ✅ FIXED: Create proper href for brief pages
 */
function toBriefHref(slug: string) {
  return `/vault/briefs/${slug}`;
}

function getSeriesFromDoc(doc: any): string {
  return (
    String(doc?.series || doc?.category || doc?.section || doc?.group || "Vault Briefs").trim() ||
    "Vault Briefs"
  );
}

function getAbstractFromDoc(doc: any): string {
  return String(doc?.abstract || doc?.excerpt || doc?.description || "").trim();
}

function getReadTimeFromDoc(doc: any): string | null {
  const rt = doc?.readTime || doc?.readingTime || doc?.time || null;
  const s = rt ? String(rt).trim() : "";
  return s || null;
}

function safeTags(doc: any): string[] {
  return Array.isArray(doc?.tags) ? doc.tags.map(String) : [];
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const docs = (allBriefs || []).filter((b: any) => !b?.draft);

  const items: BriefCard[] = docs
    .map((doc: any) => {
      // ✅ Get the slug from either doc.slug or _raw.flattenedPath
      const rawSlug = doc?.slug || doc?._raw?.flattenedPath || "";
      const slugBare = normalizeBriefSlug(rawSlug);
      
      // Skip if no slug
      if (!slugBare) return null;
      
      const required = tiers.normalizeRequired(requiredTierFromDoc(doc));

      return {
        slug: slugBare,
        href: toBriefHref(slugBare),
        title: String(doc?.title || "Untitled Brief"),
        series: getSeriesFromDoc(doc),
        abstract: getAbstractFromDoc(doc),
        requiredTier: required,
        tierLabel: tiers.getLabel(required),
        volume: typeof doc?.volume === "number" ? doc.volume : null,
        readTime: getReadTimeFromDoc(doc),
        tags: safeTags(doc),
        publishedAt: doc?.date ? String(doc.date) : null,
      };
    })
    .filter((x): x is BriefCard => x !== null && x.slug); // Type-safe filter

  // Page-level requirement: default to "public" for index
  const pageTier: AccessTier = "public";

  // Sort: newest first if date present, else alphabetical
  items.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).toISOString() : "";
    const db = b.publishedAt ? new Date(b.publishedAt).toISOString() : "";
    if (db !== da) return db.localeCompare(da);
    return a.title.localeCompare(b.title);
  });

  return {
    props: {
      items,
      total: items.length,
      requiredTier: pageTier,
    },
    revalidate: 1800,
  };
};

const BriefsIndexPage: NextPage<Props> = ({ items, total, requiredTier }) => {
  const { data: session, status } = useSession();

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser((session?.user as any)?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = !needsAuth || (session?.user ? tiers.hasAccess(user, required) : false);

  const [q, setQ] = React.useState("");
  const [series, setSeries] = React.useState<string>("All");

  const seriesOptions = React.useMemo(() => {
    const set = new Set<string>(["All"]);
    for (const it of items) set.add(it.series);
    return Array.from(set.values());
  }, [items]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((it) => {
      const sOk = series === "All" || it.series === series;
      if (!sOk) return false;
      if (!qq) return true;
      return (
        it.title.toLowerCase().includes(qq) ||
        it.abstract.toLowerCase().includes(qq) ||
        it.tags.some((t) => t.toLowerCase().includes(qq)) ||
        it.slug.toLowerCase().includes(qq)
      );
    });
  }, [items, q, series]);

  if (needsAuth && status === "loading") {
    return (
      <Layout title="Vault Briefs">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying access…</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title="Vault Briefs">
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <AccessGate
            title="Vault Briefs"
            requiredTier={required}
            message="This index requires appropriate clearance."
            onGoToJoin={() => window.location.assign("/inner-circle")}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Vault Briefs // Abraham of London" canonicalUrl="/vault/briefs" className="bg-black text-white" fullWidth headerTransparent={false}>
      <Head>
        <title>Vault Briefs // Abraham of London</title>
        <meta name="robots" content="index, follow" />
      </Head>

      <section className="relative overflow-hidden border-b border-white/10">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_78%,rgba(245,158,11,0.12),transparent_60%)]" />
          <div className="absolute inset-0 aol-grain opacity-[0.10]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 pt-14 pb-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                <Shield className="h-4 w-4 text-emerald-300/90" />
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-emerald-200/70">
                  Vault Briefs • {total} assets
                </span>
              </div>
              <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-tight text-white/95">
                Intelligence Briefs Index
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-base text-white/55 leading-relaxed">
                Technical briefs that turn manifesto-level vision into operational specification. Built for builders — not spectators.
              </p>

              <div className="mt-5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  Signed: {String((session?.user as any)?.email || "guest")}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  Tier: {tiers.getLabel(user)}
                </span>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-3 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search title, tags, slug…"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white/85 placeholder:text-white/20 outline-none focus:border-emerald-500/25 focus:bg-white/[0.05]"
                  />
                </div>

                <div className="md:col-span-2 relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <select
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-9 text-sm text-white/85 outline-none focus:border-emerald-500/25 focus:bg-white/[0.05]"
                  >
                    {seriesOptions.map((s) => (
                      <option key={s} value={s} className="bg-black">
                        {s}
                      </option>
                    ))}
                  </select>
                  <div aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                    ▾
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white/30">
                Showing {filtered.length} of {items.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-12">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">No matches</div>
            <div className="mt-3 text-white/70">Try a different keyword or clear the filter.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((b) => {
              const isPublic = b.requiredTier === "public";
              return (
                <Link
                  key={b.href}
                  href={b.href}
                  className="group block rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] hover:border-emerald-500/25 transition-colors"
                >
                  <article className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                          {b.series}
                        </div>
                        <h2 className="mt-2 font-serif text-2xl italic text-white/90 group-hover:text-emerald-100 transition-colors line-clamp-2">
                          {b.title}
                        </h2>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span
                          className={[
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 border text-[10px] font-mono uppercase tracking-[0.25em]",
                            isPublic
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80"
                              : "border-amber-500/25 bg-amber-500/10 text-amber-200/80",
                          ].join(" ")}
                        >
                          {isPublic ? <Shield className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {b.tierLabel}
                        </span>
                        {b.readTime ? (
                          <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/25">
                            {b.readTime}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {b.abstract ? (
                      <p className="mt-4 text-sm text-white/55 leading-relaxed line-clamp-3">{b.abstract}</p>
                    ) : (
                      <p className="mt-4 text-sm text-white/35 leading-relaxed line-clamp-3">
                        Technical brief • operational specification • registry-backed.
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {(b.tags || []).slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-white/35"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/25">
                        {b.slug}
                      </span>
                      <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-emerald-300/80 group-hover:text-emerald-200 transition-colors">
                        Open <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default BriefsIndexPage;