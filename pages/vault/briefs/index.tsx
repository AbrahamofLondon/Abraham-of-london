/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/vault/briefs/index.tsx — VAULT BRIEFS INDEX (SSOT aligned)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Search,
  Shield,
  Lock,
  ArrowRight,
  Filter,
  Terminal,
  Activity,
} from "lucide-react";

import Layout from "@/components/Layout";

import {
  getAllCombinedDocs,
  normalizeSlug as normalizeContentSlug,
  sanitizeData,
} from "@/lib/content/server";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
  getTierLabel,
} from "@/lib/access/tier-policy";

type BriefCard = {
  slug: string;
  href: string;
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
};

function safeString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function cleanPathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function stripPrefixOnce(source: string, prefix: string): string {
  const normalizedPrefix = `${prefix.toLowerCase()}/`;
  if (source.toLowerCase().startsWith(normalizedPrefix)) {
    return source.slice(normalizedPrefix.length).replace(/^\/+/, "");
  }
  return source;
}

function normalizeBriefSlug(input: unknown): string {
  let s = cleanPathish(
    normalizeContentSlug(safeString(input))
      .replace(/\.(md|mdx)$/i, "")
      .replace(/^content\//i, "")
      .replace(/^vault\//i, "")
      .replace(/^briefs\//i, ""),
  );

  if (!s || s.includes("..")) return "";

  let changed = true;
  while (changed) {
    changed = false;

    const nextA = stripPrefixOnce(s, "content");
    if (nextA !== s) {
      s = nextA;
      changed = true;
    }

    const nextB = stripPrefixOnce(s, "vault");
    if (nextB !== s) {
      s = nextB;
      changed = true;
    }

    const nextC = stripPrefixOnce(s, "briefs");
    if (nextC !== s) {
      s = nextC;
      changed = true;
    }
  }

  s = cleanPathish(s);
  if (!s || s.includes("..")) return "";

  const parts = s.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isBriefDoc(doc: any): boolean {
  if (!doc) return false;

  const docKind = safeString(doc?.docKind).toLowerCase();
  const type = safeString(doc?.type || doc?._type).toLowerCase();
  const kind = safeString(doc?.kind).toLowerCase();
  const category = safeString(doc?.category).toLowerCase();
  const series = safeString(doc?.series).toLowerCase();
  const flattened = safeString(doc?._raw?.flattenedPath).toLowerCase();
  const sourceFilePath = safeString(doc?._raw?.sourceFilePath).toLowerCase();
  const slug = safeString(doc?.slug).toLowerCase();

  return (
    docKind === "brief" ||
    type.includes("brief") ||
    kind.includes("brief") ||
    category.includes("brief") ||
    series.includes("brief") ||
    flattened.startsWith("briefs/") ||
    flattened.startsWith("content/briefs/") ||
    flattened.startsWith("vault/briefs/") ||
    sourceFilePath.startsWith("briefs/") ||
    sourceFilePath.startsWith("content/briefs/") ||
    sourceFilePath.startsWith("vault/briefs/") ||
    slug.startsWith("briefs/") ||
    slug.startsWith("vault/briefs/")
  );
}

function getCombinedBriefs(): any[] {
  const seen = new Set<string>();

  return (getAllCombinedDocs() || [])
    .filter((doc: any) => doc && typeof doc === "object" && !doc?.draft)
    .filter(isBriefDoc)
    .filter((doc: any) => {
      const key = safeString(
        doc?._id || doc?._raw?.flattenedPath || doc?.slug,
      ).toLowerCase();

      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const docs = getCombinedBriefs();

  const items: BriefCard[] = docs
    .map((doc: any) => {
      const rawSlug = doc?.slug || doc?._raw?.flattenedPath || "";
      const slugBare = normalizeBriefSlug(rawSlug);
      if (!slugBare) return null;

      const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));

      return {
        slug: slugBare,
        href: `/vault/briefs/${slugBare}`,
        title: safeString(doc?.title).trim() || "Untitled Brief",
        series:
          safeString(doc?.series).trim() ||
          safeString(doc?.category).trim() ||
          safeString(doc?.kind).trim() ||
          "Vault Briefs",
        abstract:
          safeString(doc?.abstract).trim() ||
          safeString(doc?.excerpt).trim() ||
          safeString(doc?.summary).trim() ||
          "Technical specification pending.",
        requiredTier,
        tierLabel: getTierLabel(requiredTier),
        volume: typeof doc?.volume === "number" ? doc.volume : null,
        readTime: safeString(doc?.readTime).trim() || "5 min read",
        tags: Array.isArray(doc?.tags) ? doc.tags.map(String) : [],
        publishedAt: doc?.date ? String(doc.date) : null,
      };
    })
    .filter((item): item is BriefCard => Boolean(item));

  items.sort((a, b) => {
    const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return timeB - timeA;
  });

  return {
    props: sanitizeData({
      items,
      total: items.length,
    }),
    revalidate: 1800,
  };
};

const BriefsIndexPage: NextPage<Props> = ({ items, total }) => {
  const { data: session } = useSession();
  const [query, setQuery] = React.useState("");
  const [series, setSeries] = React.useState<string>("All");

  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ??
      (session as any)?.aol?.tier ??
      "public",
  );

  const seriesOptions = React.useMemo(() => {
    const values = new Set<string>(["All"]);
    items.forEach((item) => values.add(item.series));
    return Array.from(values);
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const seriesOk = series === "All" || item.series === series;
      const queryOk =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.abstract.toLowerCase().includes(q) ||
        item.series.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));

      return seriesOk && queryOk;
    });
  }, [items, query, series]);

  return (
    <Layout
      title="Vault Briefs // Abraham of London"
      className="min-h-screen bg-black text-white"
    >
      <Head>
        <title>Intelligence Registry // Abraham of London</title>
        <meta
          name="description"
          content="Strategic briefings, dossiers, and institutional intelligence."
        />
      </Head>

      <section className="relative border-b border-white/5 pb-16 pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Terminal size={14} className="text-amber-500" />
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-white/40">
                  Secure_Registry // {total}_Briefs_Loaded
                </span>
              </div>

              <h1 className="text-5xl font-serif italic tracking-tighter md:text-7xl">
                The Briefing Portfolio
              </h1>

              <p className="max-w-xl border-l border-amber-500/40 pl-6 font-light italic text-white/40">
                Technical intelligence converted from vision to operational specification.
                Search the registry for authorized doctrine.
              </p>
            </div>

            <div className="min-w-[280px] rounded-sm border border-white/10 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-emerald-500" />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-white/30">
                    Network_Secure
                  </span>
                </div>

                <span className="border border-amber-500/20 px-2 py-0.5 text-[8px] font-mono uppercase text-amber-500/50">
                  Tier: {userTier}
                </span>
              </div>

              <p className="text-[10px] font-mono text-white/60">
                ID: {safeString(session?.user?.email || "GUEST_L1")}
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="relative md:col-span-8">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query registry (title, tags, index)..."
                className="w-full border border-white/10 bg-zinc-900/40 py-4 pl-12 pr-4 text-sm font-mono outline-none transition-all focus:border-amber-500/50"
              />
            </div>

            <div className="relative md:col-span-4">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                size={18}
              />
              <select
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                className="w-full appearance-none border border-white/10 bg-zinc-900/40 py-4 pl-12 pr-4 text-sm font-mono outline-none focus:border-amber-500/50"
              >
                {seriesOptions.map((entry) => (
                  <option key={entry} value={entry} className="bg-black">
                    {entry}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        {filtered.length === 0 ? (
          <div className="rounded-sm border border-white/5 bg-zinc-950/40 px-8 py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/28">
              Registry returned zero dossiers
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/40">
              Adjust your query or filter. The briefing registry is loaded, but
              nothing matches the current selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px border border-white/5 bg-white/5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((brief) => {
              const canOpen = hasAccess(userTier, brief.requiredTier);
              const isPublic = brief.requiredTier === "public";

              return (
                <Link
                  key={brief.slug}
                  href={brief.href}
                  className="group relative overflow-hidden bg-black p-8 transition-all hover:bg-zinc-900/40"
                >
                  <div className="mb-12 flex items-start justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-500">
                      INDEX_{brief.slug.split("-")[1] || brief.slug.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="hidden text-[8px] font-mono uppercase tracking-widest text-white/25 md:inline">
                        {brief.tierLabel}
                      </span>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition-colors group-hover:border-amber-500">
                        {isPublic ? (
                          <Shield size={12} className="text-emerald-500" />
                        ) : (
                          <Lock
                            size={12}
                            className={
                              canOpen
                                ? "text-emerald-500"
                                : "text-white/20 group-hover:text-amber-500"
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
                      {brief.series}
                    </h4>

                    <h3 className="font-serif text-xl italic leading-snug text-white transition-colors group-hover:text-amber-100">
                      {brief.title}
                    </h3>

                    <p className="line-clamp-3 text-[11px] font-light italic leading-relaxed text-white/28">
                      {brief.abstract}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {brief.tags.slice(0, 3).map((tag) => (
                      <span
                        key={`${brief.slug}-${tag}`}
                        className="rounded-full border border-white/10 px-2 py-1 text-[8px] font-mono uppercase tracking-wider text-white/35"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-6">
                    <span className="text-[8px] font-mono uppercase tracking-tighter text-white/24">
                      {brief.readTime}
                    </span>

                    <span className="flex items-center gap-2 text-[8px] font-mono font-bold uppercase text-amber-500/50 opacity-0 transition-opacity group-hover:opacity-100">
                      Initialize <ArrowRight size={10} />
                    </span>
                  </div>
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