/* pages/vault/briefs/index.tsx — VAULT BRIEFS INDEX (Permanent Shared Resolver) */
/* eslint-disable @typescript-eslint/no-explicit-any */

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
import * as ContentSource from "contentlayer/generated";
import { normalizeSlug as normalizeContentSlug } from "@/lib/content/server";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";
import tiers, { requiredTierFromDoc, type AccessTier } from "@/lib/access/tiers";

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
  requiredTier: AccessTier;
};

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeBriefSlug(input: unknown): string {
  const raw = normalizeContentSlug(String(input || ""))
    .replace(/^content\//i, "")
    .replace(/^vault\/briefs\//i, "")
    .replace(/^briefs\//i, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/^\/+|\/+$/g, "");

  const parts = raw.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function getAllContentCandidates(): any[] {
  const source = ContentSource as any;

  return [
    ...safeArray(source.allBriefs),
    ...safeArray(source.allVaultBriefs),
    ...safeArray(source.allDocuments),
    ...safeArray(source.allResources),
    ...safeArray(source.allPosts),
    ...safeArray(source.allCanon),
    ...safeArray(source.allDispatches),
  ];
}

function isBriefDoc(doc: any): boolean {
  const flattened = safeString(doc?._raw?.flattenedPath).toLowerCase();
  const slug = safeString(doc?.slug).toLowerCase();
  const type = safeString(doc?.type || doc?._type).toLowerCase();
  const kind = safeString(doc?.kind).toLowerCase();
  const category = safeString(doc?.category).toLowerCase();
  const series = safeString(doc?.series).toLowerCase();

  return (
    flattened.includes("vault/briefs/") ||
    flattened.startsWith("briefs/") ||
    flattened.includes("/briefs/") ||
    slug.includes("vault/briefs/") ||
    slug.startsWith("briefs/") ||
    slug.includes("/briefs/") ||
    type.includes("brief") ||
    kind.includes("brief") ||
    category.includes("brief") ||
    series.includes("brief")
  );
}

function getCombinedBriefs(): any[] {
  const seen = new Set<string>();

  return getAllContentCandidates()
    .filter((doc: any) => doc && typeof doc === "object" && !doc?.draft)
    .filter(isBriefDoc)
    .filter((doc: any) => {
      const key = safeString(doc?._id || doc?._raw?.flattenedPath || doc?.slug).toLowerCase();
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

      const required = tiers.normalizeRequired(requiredTierFromDoc(doc));

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
        requiredTier: required,
        tierLabel: tiers.getLabel(required),
        volume: typeof doc?.volume === "number" ? doc.volume : null,
        readTime: safeString(doc?.readTime).trim() || "5 min read",
        tags: Array.isArray(doc?.tags) ? doc.tags.map(String) : [],
        publishedAt: doc?.date ? String(doc.date) : null,
      };
    })
    .filter((x): x is BriefCard => Boolean(x));

  items.sort((a, b) => {
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    return db - da;
  });

  return {
    props: {
      items,
      total: items.length,
      requiredTier: "public",
    },
    revalidate: 1800,
  };
};

const BriefsIndexPage: NextPage<Props> = ({ items, total }) => {
  const { data: session } = useSession();
  const [q, setQ] = React.useState("");
  const [series, setSeries] = React.useState<string>("All");

  const userTier = normalizeUserTier(
    (((session?.user as any)?.tier || (session as any)?.aol?.tier || "public") as string)
  );

  const seriesOptions = React.useMemo(() => {
    const set = new Set<string>(["All"]);
    items.forEach((it) => set.add(it.series));
    return Array.from(set);
  }, [items]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();

    return items.filter((it) => {
      const sOk = series === "All" || it.series === series;
      const qOk =
        !qq ||
        it.title.toLowerCase().includes(qq) ||
        it.abstract.toLowerCase().includes(qq) ||
        it.series.toLowerCase().includes(qq) ||
        it.tags.some((t) => t.toLowerCase().includes(qq));

      return sOk && qOk;
    });
  }, [items, q, series]);

  return (
    <Layout
      title="Vault Briefs // Abraham of London"
      className="min-h-screen bg-black text-white"
    >
      <Head>
        <title>Intelligence Registry // Abraham of London</title>
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
                Technical intelligence converted from vision to operational spec.
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
                ID: {String(session?.user?.email || "GUEST_L1")}
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
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Query registry (Title, Tags, Index)..."
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
                {seriesOptions.map((s) => (
                  <option key={s} value={s} className="bg-black">
                    {s}
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

                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition-colors group-hover:border-amber-500">
                      {brief.requiredTier === "public" ? (
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